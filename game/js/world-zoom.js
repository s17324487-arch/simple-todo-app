// 町・フィールドの ズーム（ゆび 2ほんの ピンチ・ひだりの ＋ − ボタン・マウスの ホイール・キーボードの ＋ − 0）。
// WorldScene を 外から つつむ（scene-world.js は 地面の 位置あわせ 1か所だけ）。
// ・ひろく みる（ちいさく する）ときは 絵を その 大きさで 描きなおす（0.75・0.5 の 2だん）。くっきり して、メモリも へる。
//   描きなおす あいだは いまの 絵を ちぢめて 出す（きえない）。1コマに 読みこむ 絵と 作る 地面の 数を しぼる（かくかく しない）。
// ・ちかくで みる（おおきく する）ときは いまの 絵を そのまま ひろげる（おうちの ズームと おなじ。メモリを ふやさない）。
// ・倍率は 1マスが 端末の 画素の 整数に なる ように そろえる（地面の チャンクの つぎめに すき間が 出ない）。
// ・天気（雨・雪）と スティックは 画面に そのまま 描く（ズームしない）。
const WorldZoom = {
  MIN: 0.5, MAX: 1.5,
  STEPS: [0.5, 0.75, 1, 1.25, 1.5], // ＋ − ボタンの だん
  RASTERS: [0.5, 0.75, 1], // 絵を 描きなおす だん（ひろく みる ときだけ）
  LOAD_MAX: 6, // かわりの 絵が ある ときに 同時に 読みこむ 数
  CHUNK_BUDGET: 3, // 1コマに 作る 地面の チャンク（かわりが ある とき）
  CHUNK_MAX: 48, // ズームの だんの チャンクを とっておく 数（見える チャンクより おおく）
  alt: new Map(), // 絵の キー → さいごに できた 大きさの キー（読みこみ ちゅうの かわり）
  drawing: false, scaled: false, basePx: 1, budget: 0, deferred: null, raster: null, box: null, bound: false,

  saved() { const z = Number(Save.d && Save.d.settings && Save.d.settings.worldZoom); return Number.isFinite(z) ? U.clamp(z, this.MIN, this.MAX) : 1; },
  base() { return this.drawing ? this.basePx : G.px; },
  // 端末の 画素 / 論理px（1マスが 整数の 画素に なる ように まるめる）
  dev(z, px = this.base()) { return Math.max(1, Math.round(TS * px * z)) / TS; },
  level(z) { return this.RASTERS.find((l) => l >= z - 1e-6) || 1; },
  rasterPx(z, px = this.base()) { return z < 1 - 1e-6 ? this.dev(this.level(z), px) : px; },
  // 画面の 1論理px は 町の なん論理px か（1 なら ズームなし）
  ratio(sc) { const Z = sc && sc.zoom; if (!Z || !sc.zoomLive) return 1; const px = this.base(); return px / this.dev(Z.z, px); },
  // 町の 座標 → 画面の 論理px（PokaDebug・テスト用）
  toScreen(sc, wx, wy) { const r = this.ratio(sc); return { x: G.W / 2 + (wx - sc.cam.x) / r, y: G.H / 2 + (wy - sc.cam.y) / r }; },
  view(sc) { const r = this.ratio(sc); return { w: G.W * r, h: G.H * r }; },

  set(sc, z, instant = false) {
    const Z = sc.zoom; if (!Z) return;
    Z.target = U.clamp(Math.round(z * 1000) / 1000, this.MIN, this.MAX);
    if (instant) { Z.z = Z.target; sc.clampCam(); }
    sc.hintT = 0;
    this.commit(sc); this.sync(sc);
  },
  step(sc, dir) {
    const Z = sc.zoom; if (!Z) return;
    const t = dir > 0 ? this.STEPS.find((s) => s > Z.target + 0.01) || this.MAX : [...this.STEPS].reverse().find((s) => s < Z.target - 0.01) || this.MIN;
    this.set(sc, t);
  },
  commit(sc) { if (!Save.d) return; Save.d.settings.worldZoom = sc.zoom.target; Save.mark(); },

  // ---- ボタン（ひだり、天気の 下）----
  icon(plus) {
    return `<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><circle cx="14" cy="14" r="9" fill="#FFFDF6" stroke="${INK}" stroke-width="2.6"/><path d="M20.6 20.6 L26.8 26.8" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M9.6 14 H18.4${plus ? " M14 9.6 V18.4" : ""}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  },
  mount(sc) {
    this.unmount();
    const box = U.el("div", { class: "world-zoom" });
    const mk = (dir, label) => {
      const b = UI.btn(this.icon(dir > 0), () => { if (Game.inputLocked || G.scene !== sc) return; Sound.se("tap"); this.step(sc, dir); }, "round world-zoom-btn " + (dir > 0 ? "in" : "out"));
      b.setAttribute("aria-label", label); return b;
    };
    box.append(mk(-1, "まちを ひろく みる"), mk(1, "まちを ちかくで みる"));
    UI.root.append(box); this.box = box; this.sync(sc); this.bind();
  },
  unmount() { if (this.box) this.box.remove(); this.box = null; },
  sync(sc) {
    if (!this.box || !sc.zoom) return;
    const [out, inn] = this.box.children;
    out.disabled = sc.zoom.target <= this.MIN + 1e-6; inn.disabled = sc.zoom.target >= this.MAX - 1e-6;
  },
  bind() {
    if (this.bound || !G.canvas) return; this.bound = true;
    const live = () => G.sceneName === "world" && G.scene && G.scene.zoom && !Game.inputLocked ? G.scene : null;
    G.canvas.addEventListener("wheel", (e) => {
      const sc = live(); if (!sc) return;
      e.preventDefault();
      this.set(sc, sc.zoom.target * Math.exp(-U.clamp(e.deltaY, -120, 120) * 0.0018));
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey) return;
      const sc = live(); if (!sc || UI.busy) return;
      if (e.key === "+" || e.key === "=" || e.key === ";") this.step(sc, 1);
      else if (e.key === "-" || e.key === "_") this.step(sc, -1);
      else if (e.key === "0") this.set(sc, 1);
    });
  },

  // ---- ゆび 2ほん ----
  pinchStart(sc, pts) {
    const [a, b] = pts, Z = sc.zoom;
    Z.pinch = { a: a.id, b: b.id, d0: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), z0: Z.z };
    sc.joy = null; sc.touch = null; sc.tapMark = null;
    if (sc.fishing) sc.fishing.press = null; // つりの ながおしを やめる
  },
  pinchMove(sc) {
    const Z = sc.zoom, P = Z.pinch, A = Game.pointers.get(P.a), B = Game.pointers.get(P.b);
    if (!A || !B) return;
    Z.target = Z.z = U.clamp(Math.round(P.z0 * Math.hypot(A.x - B.x, A.y - B.y) / P.d0 * 1000) / 1000, this.MIN, this.MAX);
    sc.hintT = 0; sc.clampCam(); this.sync(sc);
  },

  // ---- 地面の チャンク（ズームの だんごと）----
  chunkKey(map, cx, cy, px) { return map.id + ":" + cx + "," + cy + "@" + px; },
  blank() { if (!this.blankCanvas) { this.blankCanvas = document.createElement("canvas"); this.blankCanvas.width = this.blankCanvas.height = 1; } return this.blankCanvas; },
  dropChunks(keep) {
    for (const k of [...Tiles.chunks.keys()]) { const px = +k.slice(k.lastIndexOf("@") + 1); if (px !== this.basePx && !keep.includes(px)) Tiles.chunks.delete(k); }
  },
  trimChunks() {
    const extra = [...Tiles.chunks.keys()].filter((k) => +k.slice(k.lastIndexOf("@") + 1) !== this.basePx);
    for (let i = 0; i < extra.length - this.CHUNK_MAX; i++) Tiles.chunks.delete(extra[i]);
  },

  // テスト・PokaDebug 用の ようす
  state(sc) {
    if (!sc || !sc.zoom) return null;
    const px = G.px, v = this.view(sc), r = this.box && this.box.getBoundingClientRect();
    return { z: sc.zoom.z, target: sc.zoom.target, saved: Save.d.settings.worldZoom, pinch: !!sc.zoom.pinch, dev: this.dev(sc.zoom.z, px), raster: this.rasterPx(sc.zoom.rz, px), px,
      view: { w: v.w, h: v.h, tilesW: v.w / TS, tilesH: v.h / TS }, cam: { ...sc.cam },
      chunks: [...Tiles.chunks.keys()].reduce((o, k) => { const p = k.slice(k.lastIndexOf("@") + 1); o[p] = (o[p] || 0) + 1; return o; }, {}),
      buttons: r ? [...this.box.children].map((b) => { const q = b.getBoundingClientRect(); return { label: b.getAttribute("aria-label"), x: q.x, y: q.y, w: q.width, h: q.height, disabled: b.disabled }; }) : [] };
  },
};

// ---- つなぎ ----
(() => {
  const Z = WorldZoom, P = WorldScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  // 絵の キャッシュ: できた 大きさを おぼえる・町を 描く あいだは 読みこみ ちゅうに ほかの 大きさで かわりに 出す
  const load = SvgCache._load, get = SvgCache.get;
  SvgCache._load = function (k, fn, pw, ph) {
    const p = load.call(this, k, fn, pw, ph);
    p.then((c) => { if (c) Z.alt.set(k.slice(0, k.lastIndexOf("@")), k); });
    return p;
  };
  SvgCache.get = function (key, fn, pw, ph) {
    if (!Z.drawing) return get.call(this, key, fn, pw, ph);
    const k = key + "@" + pw + "x" + ph;
    if (this.map.has(k)) return get.call(this, key, fn, pw, ph);
    const a = Z.alt.get(key), fb = a && a !== k ? this.map.get(a) : null;
    if (fb && !this.pending.has(k) && this.pending.size >= Z.LOAD_MAX) return fb;
    return get.call(this, key, fn, pw, ph) || fb || null;
  };
  const chunk = Tiles.chunk;
  Tiles.chunk = function (map, cx, cy) {
    if (!Z.drawing || G.px === Z.basePx) return chunk.call(this, map, cx, cy);
    const key = Z.chunkKey(map, cx, cy, G.px), hit = this.chunks.get(key);
    if (hit) { this.chunks.delete(key); this.chunks.set(key, hit); return chunk.call(this, map, cx, cy); } // あたらしい じゅんに
    const fb = this.chunks.get(Z.chunkKey(map, cx, cy, Z.basePx));
    if (fb && Z.budget <= 0) return fb;
    if (!fb && Z.budget <= -Z.CHUNK_BUDGET) return Z.blank();
    Z.budget--;
    const c = chunk.call(this, map, cx, cy); Z.trimChunks(); return c;
  };
  const weather = Weather.draw;
  Weather.draw = function (ctx, sc) { if (Z.drawing && Z.scaled) { Z.deferred = () => weather.call(this, ctx, sc); return; } return weather.call(this, ctx, sc); };
  wrap("renderJoy", function (orig, ctx) { if (Z.drawing && Z.scaled) return; return orig.call(this, ctx); });

  wrap("enter", async function (orig, p) {
    const z = Z.saved();
    this.zoomLive = true; this.zoom = { z, target: z, rz: z, pinch: null, swallow: new Set() };
    const r = await orig.call(this, p);
    Z.mount(this);
    return r;
  });
  wrap("exit", function (orig) { Z.unmount(); if (this.zoom) { this.zoom.pinch = null; this.zoom.swallow.clear(); } return orig.call(this); });
  // 読みこみは いまの ズームの 大きさで（同期の ぶぶんだけ G.px を かえる）
  wrap("preload", function (orig) {
    if (!this.zoomLive || !this.zoom) return orig.call(this);
    const px = G.px, r = Z.rasterPx(this.zoom.rz, px);
    if (r === px) return orig.call(this);
    G.px = r;
    try { return orig.call(this); } finally { G.px = px; }
  });
  wrap("clampCam", function (orig) {
    const r = Z.ratio(this); if (r === 1 || Z.drawing) return orig.call(this);
    const W = G.W, H = G.H; G.W = W * r; G.H = H * r;
    try { return orig.call(this); } finally { G.W = W; G.H = H; }
  });
  wrap("screenToTile", function (orig, sx, sy) {
    const r = Z.ratio(this); if (r === 1 || Z.drawing) return orig.call(this, sx, sy);
    return orig.call(this, G.W / 2 + (sx - G.W / 2) * r, G.H / 2 + (sy - G.H / 2) * r);
  });
  wrap("update", function (orig, dt) {
    const out = orig.call(this, dt), S = this.zoom;
    if (S && !S.pinch && S.z !== S.target) {
      S.z += (S.target - S.z) * (1 - Math.pow(0.0004, dt));
      if (Math.abs(S.target - S.z) < 0.004) S.z = S.target;
      this.clampCam();
    }
    return out;
  });
  wrap("render", function (orig, ctx) {
    const S = this.zoom;
    if (!this.zoomLive || !S) return orig.call(this, ctx);
    // 絵の 大きさ（rz）は うごいて いる あいだは そのまま、とまったら（ピンチ ちゅうは その ばで）いまの ズームに
    if (S.z === S.target || S.pinch) S.rz = S.z;
    const px = G.px, W = G.W, H = G.H, dev = Z.dev(S.z, px), raster = Z.rasterPx(S.rz, px), scaled = dev !== px, hint = this.hintT;
    if (raster !== Z.raster) { Z.basePx = px; Z.dropChunks([raster]); Z.raster = raster; }
    Z.drawing = true; Z.scaled = scaled; Z.basePx = px; Z.budget = Z.CHUNK_BUDGET; Z.deferred = null;
    if (scaled) { G.W = W * px / dev; G.H = H * px / dev; G.px = raster; this.devPx = dev; this.hintT = 0; ctx.save(); ctx.setTransform(dev, 0, 0, dev, 0, 0); }
    try { orig.call(this, ctx); }
    finally {
      Z.drawing = false;
      if (scaled) { ctx.restore(); G.W = W; G.H = H; G.px = px; this.devPx = null; this.hintT = hint; }
    }
    if (scaled) { const d = Z.deferred; Z.deferred = null; if (d) d(); this.renderJoy(ctx); }
  });
  // ゆび 2ほんで ピンチ（3本めは むし）。ピンチの ゆびを はなしても タップ・スティックに しない
  wrap("down", function (orig, p) {
    const S = this.zoom; if (!S) return orig.call(this, p);
    if (S.pinch) { S.swallow.add(p.id); return; }
    const pts = [...Game.pointers.values()];
    if (pts.length >= 2) { for (const q of pts) if (q.id !== pts[0].id && q.id !== pts[1].id) S.swallow.add(q.id); Z.pinchStart(this, pts); return; }
    return orig.call(this, p);
  });
  wrap("move", function (orig, p) {
    const S = this.zoom; if (!S) return orig.call(this, p);
    if (S.pinch) { if (p.id === S.pinch.a || p.id === S.pinch.b) Z.pinchMove(this); return; }
    if (S.swallow.has(p.id)) return;
    return orig.call(this, p);
  });
  wrap("up", function (orig, p, cancel) {
    const S = this.zoom; if (!S) return orig.call(this, p, cancel);
    if (S.pinch && (p.id === S.pinch.a || p.id === S.pinch.b)) { S.swallow.add(p.id === S.pinch.a ? S.pinch.b : S.pinch.a); S.pinch = null; Z.commit(this); return; }
    if (S.swallow.delete(p.id)) return;
    return orig.call(this, p, cancel);
  });
  wrap("cancel", function (orig, p) { const S = this.zoom; if (S) { if (S.pinch) Z.commit(this); S.pinch = null; S.swallow.clear(); } return orig.call(this, p); });
})();
