// 起動・画面サイズ・ループ・シーン切り替え・入力
const G = {
  W: 360, H: 640, px: 2, dpr: 1,
  canvas: null, ctx: null,
  scene: null, sceneName: "",
  t: 0, frame: 0,
  keys: {},
};

const Game = {
  trans: null,
  pointers: new Map(),
  lastTs: 0,

  boot() {
    G.canvas = document.getElementById("screen");
    G.ctx = G.canvas.getContext("2d");
    UI.init();
    Save.load();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 200));
    this.bindInput();
    // 1分ごとに育成パラメータを進めてオートセーブ
    setInterval(() => { Save.applyElapsed(false); Save.write(); UI.updateHud(); }, 20000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { Save.applyElapsed(false); Save.write(); }
      else { Save.applyElapsed(true); if (Sound.ctx) Sound.ctx.resume(); }
    });
    window.addEventListener("pagehide", () => Save.write());
    this.goto("title", {}, "none");
    requestAnimationFrame((ts) => this.loop(ts));
  },

  resize() {
    const app = document.getElementById("app");
    const r = app.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const devW = Math.max(1, Math.round(r.width * dpr)), devH = Math.max(1, Math.round(r.height * dpr));
    // タイル(論理32px)が端末ピクセルの整数になるように倍率を決める → タイルのすき間が出ない
    const tile = Math.max(16, Math.round((32 * devW) / 360));
    const oldPx = G.px;
    G.px = tile / 32;
    G.dpr = dpr;
    G.W = devW / G.px;
    G.H = devH / G.px;
    G.canvas.width = devW;
    G.canvas.height = devH;
    G.cssPerUnit = r.width / G.W;
    document.documentElement.style.setProperty("--u", G.cssPerUnit + "px");
    if (oldPx !== G.px) { SvgCache.clear(); Tiles.clear && Tiles.clear(); }
    if (G.scene && G.scene.resize) G.scene.resize();
  },

  loop(ts) {
    const dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    G.t += dt;
    G.frame++;
    try {
      if (G.scene && !this.paused) G.scene.update(dt);
      this.updateTrans(dt);
      const ctx = G.ctx;
      ctx.setTransform(G.px, 0, 0, G.px, 0, 0);
      ctx.imageSmoothingEnabled = true;
      if (G.scene) G.scene.render(ctx);
      this.renderTrans(ctx);
    } catch (e) {
      console.error(e);
      if (!this.errShown) { this.errShown = true; UI.toast("エラー: " + e.message, "err"); }
    }
    requestAnimationFrame((t) => this.loop(t));
  },

  // ---- シーン ----
  goto(name, params = {}, type = "fade") {
    // 旧デバッグ/入口から来ても、なかよしパズルは専用受付に案内する。
    if(name==="shop" && params.shop==="link"){name="store";params={...params,atCounter:true};}
    // 戦闘からの帰宅は全滅処理だけ。UI以外からの移動要求にも同じ規則を適用。
    if (name === "house" && G.sceneName === "battle" && !G.scene?.defeated) return;
    if (this.trans && this.trans.phase !== "in") return;
    const doSwitch = async () => {
      if (G.scene && G.scene.exit) G.scene.exit();
      const S = SCENES[name];
      const sc = new S();
      G.sceneName = name;
      this.pointers.clear();
      if (sc.enter) await sc.enter(params);
      G.scene = sc;
    };
    if (type === "none") { this.trans = { type: "fade", phase: "wait", t: 0, dur: 0.3 }; doSwitch().then(() => { this.trans.phase = "in"; this.trans.t = 0; }); return; }
    this.trans = { type, phase: "out", t: 0, dur: type === "battle" ? 0.9 : 0.32, next: doSwitch };
    if (type === "battle") Sound.se("encounter");
  },
  updateTrans(dt) {
    const tr = this.trans;
    if (!tr) return;
    tr.t += dt;
    if (tr.phase === "out" && tr.t >= tr.dur) {
      tr.phase = "wait";
      tr.next().then(() => { tr.phase = "in"; tr.t = 0; tr.dur = 0.32; }).catch((e) => { console.error(e); this.trans = null; });
    } else if (tr.phase === "in" && tr.t >= tr.dur) {
      this.trans = null;
    }
  },
  renderTrans(ctx) {
    const tr = this.trans;
    if (!tr) return;
    const p = tr.phase === "out" ? U.clamp(tr.t / tr.dur, 0, 1) : tr.phase === "wait" ? 1 : 1 - U.clamp(tr.t / tr.dur, 0, 1);
    ctx.save();
    if (tr.type === "circle" && tr.phase !== "wait") {
      const R = Math.hypot(G.W, G.H) / 2;
      ctx.fillStyle = "#1F1D1B";
      ctx.beginPath();
      ctx.rect(0, 0, G.W, G.H);
      ctx.arc(G.W / 2, G.H / 2, Math.max(0.01, R * (1 - p)), 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    } else if (tr.type === "battle" && tr.phase === "out") {
      // ポケモン風：ちかちか → しましまで とじる
      const q = tr.t / tr.dur;
      if (q < 0.4) {
        if (Math.floor(q * 20) % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(0, 0, G.W, G.H); }
      } else {
        const k = (q - 0.4) / 0.6, n = 10, h = G.H / n;
        ctx.fillStyle = "#1F1D1B";
        for (let i = 0; i < n; i++) {
          const w = G.W * U.clamp(k * 1.4 - (i % 2) * 0.2, 0, 1);
          if (i % 2) ctx.fillRect(G.W - w, i * h, w, h + 1); else ctx.fillRect(0, i * h, w, h + 1);
        }
      }
    } else {
      ctx.fillStyle = tr.type === "white" ? `rgba(255,255,255,${p})` : `rgba(31,29,27,${p})`;
      ctx.fillRect(0, 0, G.W, G.H);
    }
    ctx.restore();
  },
  get inputLocked() { return !!this.trans || UI.busy || this.paused; },

  // ---- 入力 ----
  bindInput() {
    const cv = G.canvas;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * G.W, y: ((e.clientY - r.top) / r.height) * G.H, id: e.pointerId };
    };
    cv.addEventListener("pointerdown", (e) => {
      Sound.init();
      e.preventDefault();
      if (this.inputLocked) return;
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      const p = pos(e);
      p.sx = p.x; p.sy = p.y; p.t0 = performance.now();
      this.pointers.set(e.pointerId, p);
      if (G.scene && G.scene.down) G.scene.down(p);
    });
    cv.addEventListener("pointermove", (e) => {
      const p0 = this.pointers.get(e.pointerId);
      if (!p0) { if (G.scene && G.scene.hover) G.scene.hover(pos(e)); return; }
      const p = pos(e);
      Object.assign(p0, { x: p.x, y: p.y });
      if (this.inputLocked) return;
      if (G.scene && G.scene.move) G.scene.move(p0);
    });
    const up = (e) => {
      const p0 = this.pointers.get(e.pointerId);
      if (!p0) return;
      this.pointers.delete(e.pointerId);
      const p = pos(e);
      Object.assign(p0, { x: p.x, y: p.y });
      p0.dur = performance.now() - p0.t0;
      p0.tap = p0.dur < 400 && Math.hypot(p0.x - p0.sx, p0.y - p0.sy) < 10;
      if (this.inputLocked && e.type !== "pointercancel") { if (G.scene && G.scene.cancel) G.scene.cancel(p0); return; }
      if (G.scene && G.scene.up) G.scene.up(p0, e.type === "pointercancel");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    // どこかを最初に触ったら音を有効にする（iOS対策）
    // iOS は touchend / click でないと音が有効にならないことがある
    for (const ev of ["pointerdown", "touchend", "click", "keydown"]) document.addEventListener(ev, () => Sound.init(), { capture: true, passive: true });
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right", z: "ok", Z: "ok", Enter: "ok", " ": "ok", x: "cancel", X: "cancel", Escape: "cancel" };
    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      const k = KEYMAP[e.key];
      if (!k) return;
      Sound.init();
      if (k !== "ok" && k !== "cancel") e.preventDefault();
      if (G.keys[k]) return;
      G.keys[k] = true;
      if (UI.busy) {
        // 会話中は ok で送る
        if (k === "ok") { const sh = document.querySelector(".dlg-shade:not(.ask)"); if (sh) sh.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); }
        if (k === "cancel") { const x = [...document.querySelectorAll(".modal-wrap .close")].pop(); if (x) x.click(); }
        return;
      }
      if (this.trans) return;
      if (G.scene && G.scene.key) G.scene.key(k, true);
    });
    window.addEventListener("keyup", (e) => {
      const k = KEYMAP[e.key];
      if (!k) return;
      G.keys[k] = false;
      if (G.scene && G.scene.key) G.scene.key(k, false);
    });
    window.addEventListener("blur", () => { G.keys = {}; if (G.scene && G.scene.cancel) for (const p of this.pointers.values()) G.scene.cancel(p); this.pointers.clear(); });
  },

  openMenu() { if (!this.inputLocked) Menu.open(); },
};

// シーン登録（各ファイルで SCENES.xxx = class を追加する）
const SCENES = {};

window.addEventListener("DOMContentLoaded", () => {
  // 試聴室は音源だけを起動。実ゲームのセーブ読込・自動保存・pagehide保存を登録しない。
  if (new URLSearchParams(location.search).get("audio-preview") === "1") {
    Save.d = Save.fresh();
    return;
  }
  if (document.fonts && document.fonts.ready) {
    // フォントが来るのを少しだけ待つ（キャンバスの文字用）
    Promise.race([document.fonts.ready, U.wait(1500)]).then(() => Game.boot());
  } else Game.boot();
});
