// ランウェイ（UI-36・SCENES.fashion）。ファッションショー「ぽかぽか コレクション」の ほんばん（きまりは js/fashion-show.js・絵は js/fashion-art.js）。
// ながれ: まくが あく → しかいの コンセプト と まつ 3人（どきどき）→ 1人ずつ: よびこみ → ランウェイを あるく（おくから てまえへ・とおい ほど ちいさい）
// → さきで とまって ズーム → カメラの わ 3かい（「ポーズ！」・むずかしめ）→ しんさいん 3人の ふだと ひとこと → ターンして もどる
// → 3にん そろって フィナーレ（かみふぶき）→ けっか はっぴょう（ドラムロール・ランク）→ ごほうびの まど（コイン・けいひん・きねん しゃしん）。
// ・カメラの わは「ポーズ！」の ボタンに むかって ちぢむ（かおに かからない）。ボタンを はやく おしすぎると ミス（れんだ できない）。わが きえるまで おさないと ミス。
// ・カメラ（ズーム）: はじめは うしろで まつ 3人に よる → ひいて ランウェイ → さきで モデルに よる → フィナーレは 3人。
// ・3人は Chara.draw（ラスタは 2つの 大きさ だけ: あるく とき と ズームの とき。とおくは canvas で ちいさく 描く）。
//   しんさいん・しかいは Art.npcSvg（SvgCache の キーは なまえと 大きさ）。ステージ・客席・ライトは まいかい canvas に 描く（ズームしても きれい）。
// PokaDebug: fashionShow()・fashionAuto(ずれ)・fashionSpeed(ばい)・fashionScene()（js/debug.js）。
class FashionScene {
  async enter(p = {}) {
    this.back = p.back || null; this.closed = false;
    this.show = p.show || FashionShow.begin();
    if (!this.show) { UI.toast("うけつけで さんかひを はらってね"); this.leave(); return; }
    this.theme = FashionShow.THEME[this.show.theme];
    this.t = 0; this.waits = []; this.phase = "open"; this.cur = -1;
    this.models = this.show.order.map((id, i) => ({ id, i, z: 0, lane: i - 1, dir: "down", pose: "idle_01", face: "fs_doki", gesture: null, judgments: [], gestures: [], walking: false, tween: null, hop: 0, line: null }));
    this.ring = null; this.pop = null; this.flashT = -9; this.camTo = { k: 1 }; this.plate = null;
    this.mc = null; this.panel = null; this.banner = null; this.confetti = []; this.curtain = 1; this.results = []; this.summary = null; this.early = 0;
    this.rand = FashionShow.rng(this.show.seed ^ 0x5f3759df);
    UI.showHud(false); Sound.bgm("fashion_show");
    this.buildUI(); this.resize(); this.cam = this.camTarget({ k: 1 });
    await this.preload();
    this.run().catch((e) => console.error(e));
  }
  exit() { this.closed = true; this.ui?.remove(); for (const w of this.waits) w.res(); this.waits = []; }
  get speed() { return FashionScene.speed || 1; }
  // かおの なまえ（ごじには smile が なく、がちゃんには surprise が ない）
  face(id, f) { return (FashionScene.FACE[f] && FashionScene.FACE[f][id]) || f; }
  // ---- ボタン ----
  buildUI() {
    this.ui?.remove();
    const ui = (this.ui = U.el("div", { class: "fs-ui" }));
    this.btn = UI.btn("ポーズ！", () => this.press(), "fs-pose");
    this.btn.disabled = true;
    this.quitBtn = UI.btn("やめる", () => this.quit(), "small fs-quit");
    ui.append(this.btn, this.quitBtn); UI.root.append(ui);
  }
  async quit() {
    if (this.phase === "reward" || UI.busy) return;
    const prev = FashionScene.speed; FashionScene.speed = 0.0001;
    const ok = await UI.confirm("ショーを やめる？\n（さんかひは もどらないよ）", "やめる", "つづける");
    FashionScene.speed = prev;
    if (ok) this.leave();
  }
  // でる（きりかえの とちゅう なら おわってから。update で 1かいだけ）
  leave() { this.closed = true; this.leaving = true; }
  goBack() { this.leaving = false; this.ui?.remove(); if (this.back) Game.goto("venue", this.back, "circle"); else Game.goto("world", {}, "circle"); }
  // ---- じかん（ショーの とけいで まつ）----
  wait(sec, skip = false) { return new Promise((res) => { if (this.closed) return res(); this.waits.push({ at: this.t + sec, res, skip }); }); }
  // しんさの ふだは タップで つぎへ
  skip() { const w = this.waits.find((x) => x.skip); if (w) w.at = this.t; }
  // ---- がめんの かたち ----
  resize() {
    const W = G.W, H = G.H, top = 6, bottom = 108, backY = Math.round(top + (H - top - bottom) * 0.37), tipY = H - bottom - 6;
    this.g = { W, H, cx: W / 2, backY, tipY, backHalf: Math.min(W * 0.11, 46), tipHalf: Math.min(W * 0.34, 150), size: Math.round(Math.min(W * 0.42, (tipY - backY) * 0.62, 190)) };
  }
  zAt(z) { return 0.42 + 0.58 * z; }
  feetAt(m) { const g = this.g, y = g.backY + 6 + (g.tipY - 28 - g.backY - 6) * m.z, x = g.cx + m.lane * Math.min(g.W * 0.2, 80) * (m.spread != null ? m.spread : 1 - m.z * 0.65); return { x, y }; }
  // カメラ: ちゅうもくする ところ（fx, fy）を がめんの（ax, ay）に k ばいで うつす。k = 1 なら そのまま
  camTarget(T) {
    const g = this.g;
    if (T.m) { const q = this.feetAt(T.m), s = g.size * this.zAt(T.m.z); return { k: T.k, fx: q.x, fy: q.y - s * 0.56, ax: g.cx, ay: g.H * 0.4 }; }
    if (T.back) return { k: T.k, fx: g.cx, fy: g.backY - g.size * 0.2, ax: g.cx, ay: g.H * 0.5 };
    if (T.group) return { k: T.k, fx: g.cx, fy: this.feetAt({ z: T.z, lane: 0 }).y - g.size * this.zAt(T.z) * 0.5, ax: g.cx, ay: g.H * 0.5 };
    return { k: 1, fx: g.cx, fy: g.H / 2, ax: g.cx, ay: g.H / 2 };
  }
  toScreen(x, y) { const c = this.cam; return [(x - c.fx) * c.k + c.ax, (y - c.fy) * c.k + c.ay]; }
  // ---- 絵を さきに よむ ----
  outfitOpts(id) { const L = this.show.looks[id]; return { outfit: L.outfit, color: L.color }; }
  combos() {
    const out = { small: [], big: [] }, th = this.show.theme;
    this.models.forEach((m, i) => {
      const o = this.outfitOpts(m.id);
      const F = (f) => this.face(m.id, f);
      for (const f of ["fs_doki", "smile", "fs_kime"]) for (const pose of ["idle_01", "idle_02"]) out.small.push([m.id, { ...o, pose, dir: "down", face: F(f) }]);
      for (const pose of ["walk_01", "walk_02"]) { out.small.push([m.id, { ...o, pose, dir: "down", face: F("smile") }]); out.small.push([m.id, { ...o, pose, dir: "up", face: "normal" }]); }
      for (let k = 0; k < 3; k++) for (const f of ["fs_kime", "smile", "normal", "oops"]) out.big.push([m.id, { ...o, pose: "idle_01", dir: "down", face: F(f), gesture: FashionShow.poseOf(th, i, k) }]);
      out.big.push([m.id, { ...o, pose: "idle_01", dir: "down", face: "fs_kime" }]);
      for (const g of ["wai", "heart"]) for (const f of ["fs_kime", "love", "smile"]) out.small.push([m.id, { ...o, pose: "idle_01", dir: "down", face: F(f), gesture: g }]);
    });
    return out;
  }
  async preload() {
    const c = this.combos(), npc = [...FashionShow.JUDGES, FashionShow.MC].map((n) => this.npcSprite(n, 64, true));
    await Promise.all([Chara.preload(c.small, this.g.size), Chara.preload(c.big, this.g.size * 1.6), ...npc]);
  }
  npcSprite(n, size, ensure = false) {
    const pw = Chara.pxSize(size), ph = Math.round((pw * Chara.VB.h) / Chara.VB.w), key = `fsnpc:${n.id}:${pw}`;
    const svg = () => Art.npcSvg({ sp: n.sp, emo: "happy", dir: "down", pose: "idle_01", outfit: n.outfit });
    return ensure ? SvgCache.ensure(key, svg, pw, ph) : SvgCache.get(key, svg, pw, ph);
  }
  // ---- ショーの ながれ ----
  async run() {
    const T = this.theme, ms = this.models;
    this.camTo = { k: 1.55, back: true }; this.cam = this.camTarget(this.camTo);
    await this.wait(0.3); Sound.se("whoosh");
    this.curtainOpen = this.t; await this.wait(1.2);
    await this.say(`みなさま おまたせ しました！ ぽかぽか コレクション、はじまります！`, 2.2);
    // まつ 3人の ひとこと（ひとりずつ）
    for (const m of ms) {
      if (this.closed) return;
      m.line = { text: FashionScene.LINES.wait[m.id] || "どきどき……", t0: this.t, dur: 1.5 }; m.face = "fs_doki"; m.hop = this.t; Sound.voice(m.id);
      await this.wait(1.5);
    }
    this.camTo = { k: 1 };
    await this.say(`きょうの テーマは「${T.name}」！`, 2.2);
    for (let i = 0; i < ms.length; i++) { if (this.closed) return; await this.walk(ms[i]); }
    if (this.closed) return;
    await this.finale();
    if (this.closed) return;
    await this.result();
  }
  // しかいの ふきだし（sec びょう）
  async say(text, sec) { this.mc = { text, t0: this.t, dur: sec }; await this.wait(sec); }
  tween(m, z1, l1, dur) { m.tween = { t0: this.t, dur, z0: m.z, z1, l0: m.lane, l1 }; return this.wait(dur); }
  async walk(m) {
    this.cur = m.i; this.phase = "walk";
    const name = Save.d.chars[m.id].name;
    m.face = "smile"; this.models.forEach((o) => { if (o !== m) o.face = "fs_doki"; });
    const lv = this.show.levels[m.id]; this.plate = { name, no: m.i + 1, stars: lv.stars, matched: lv.matched.length };
    await this.say(`エントリー ナンバー ${m.i + 1}ばん、${name}！`, 1.7);
    // まんなかへ でて ランウェイを あるく（おくから てまえへ）
    m.walking = true; m.dir = "down"; Sound.se("swish");
    await this.tween(m, 0.02, 0, 0.5);
    await this.tween(m, 1, 0, 3.0);
    m.walking = false; m.pose = "idle_01"; m.face = "fs_kime";
    // さきで ズーム → ポーズ 3かい
    this.camTo = { k: 1.65, m }; await this.wait(0.45);
    this.phase = "pose";
    for (let k = 0; k < 3; k++) {
      await this.wait(0.5 + this.rand() * 0.45);
      if (this.closed) return;
      const dur = FashionShow.ringDur(m.i, k), g = FashionShow.poseOf(this.show.theme, m.i, k);
      const j = await new Promise((res) => { this.ring = { t0: this.t, t1: this.t + dur, dur, k, res, done: false }; this.btn.disabled = false; });
      this.ring = null; this.btn.disabled = true;
      m.judgments.push(j); m.gestures.push(g); m.gesture = g; m.popT = this.t;
      m.face = j === "perfect" ? "fs_kime" : j === "great" ? "smile" : j === "good" ? "normal" : "oops";
      this.pop = { text: FashionShow.JUDGE_TEXT[j], j, t0: this.t };
      if (j === "perfect" || j === "great") { this.flashT = this.t; Sound.se("fs_shutter"); }
      Sound.se(j === "perfect" ? "perfect" : j === "great" ? "good" : j === "good" ? "ok" : "miss");
      await this.wait(0.85);
      m.gesture = null; m.face = "fs_kime";
    }
    this.phase = "judge"; this.plate = null;
    this.camTo = { k: 1 }; await this.wait(0.4);
    // しんさ（3人の ふだと ひとこと）
    const r = FashionShow.modelResult(this.show, m.i, m.judgments); this.results[m.i] = r;
    this.panel = { r, k: -1, t0: this.t };
    const best = r.counts.perfect === 3 ? "きまったー！ パーフェクト！" : r.pose >= 18 ? "すてきな ポーズ！" : "どうどうと あるいて くれました！";
    await this.say(best, 1.2);
    for (let k = 0; k < 3; k++) { if (this.closed) return; this.panel.k = k; this.panel.tk = this.t; Sound.se("ding"); await this.wait(2.2, true); }
    await this.say(`${name}、${r.total}てん！`, 1.4);
    this.panel = null;
    this.models.forEach((o) => { if (o !== m && o.z < 0.01) o.face = r.total >= 60 ? "smile" : "fs_doki"; });
    // ターンして もどる
    const happy = r.total >= 75 ? 0 : r.total >= 45 ? 1 : 2;
    m.line = { text: (FashionScene.LINES.after[m.id] || ["やった！", "ふう！", "つぎこそ！"])[happy], t0: this.t, dur: 1.8 };
    m.dir = "up"; m.walking = true; m.face = "normal";
    await this.tween(m, 0, m.i - 1, 2.0);
    m.walking = false; m.dir = "down"; m.pose = "idle_01"; m.face = r.total >= 60 ? "fs_kime" : "smile";
  }
  async finale() {
    this.phase = "finale"; this.cur = -1;
    await this.say("さいごは 3にん そろって ランウェイへ！", 1.4);
    this.models.forEach((m) => { m.walking = true; m.dir = "down"; m.face = "smile"; m.spread0 = 1 - m.z * 0.65; m.spreadT = this.t; this.tween(m, 0.72, m.i - 1, 2.4); });
    this.camTo = { k: 1.12, group: true, z: 0.72 };
    await this.wait(2.4);
    this.models.forEach((m, i) => { m.walking = false; m.pose = "idle_01"; m.gesture = i === 1 ? "heart" : "wai"; m.face = "fs_kime"; m.popT = this.t; });
    this.burst(); Sound.se("fanfare"); this.flashT = this.t;
    await this.say("みんな、ありがとう！", 1.6);
  }
  async result() {
    this.phase = "result";
    const sum = (this.summary = FashionShow.finish(this.show, this.models.map((m) => ({ id: m.id, judgments: m.judgments, gestures: m.gestures, face: "fs_kime" }))));
    if (!sum) { this.leave(); return; }
    const R = FashionShow.RANK[sum.rank];
    await this.say("けっか はっぴょう！", 1.0);
    Sound.se("fs_drum"); this.models.forEach((m) => { m.gesture = null; m.face = "fs_doki"; });
    await this.wait(1.7);
    this.banner = { R, score: sum.score, t0: this.t };
    const top = ["grand", "gold", "silver"].includes(sum.rank);
    this.models.forEach((m, i) => { m.face = top ? (i === 1 ? "love" : "fs_kime") : "smile"; m.gesture = top ? (i === 1 ? "heart" : "wai") : "heart"; });
    if (top) this.burst();
    Sound.se(top ? "levelup" : "good");
    await this.say({ grand: "グランプリ！ おめでとう！", gold: "ゴールド！ すばらしい！", silver: "シルバー！ すてき！", bronze: "ブロンズ！ よく がんばったね！", try: "がんばったで しょう！ また きてね！" }[sum.rank], 2.0);
    this.phase = "reward";
    await this.rewards(sum);
    this.leave();
  }
  // ---- ボタン ----
  press(auto = false) {
    if (this.closed) return;
    const r = this.ring;
    if (!r || r.done) { if (this.phase === "pose" && !auto) { this.early = this.t; Sound.se("cancel"); } return; }
    const dt = this.t + Math.min(0.05, Math.max(0, (performance.now() - this.lastNow) / 1000)) * this.speed - r.t1;
    r.done = true; r.res(dt < -FashionShow.WINDOW.good ? "miss" : FashionShow.judgeOf(dt));
  }
  down(p) { if (UI.busy) return; if (this.phase === "pose") this.press(); else if (this.phase === "judge") this.skip(); }
  // ---- まいフレーム ----
  update(dt) {
    if (this.leaving) { if (!UI.busy && (!Game.trans || Game.trans.phase === "in")) this.goBack(); return; }
    if (this.closed) return;
    this.ui.classList.toggle("fs-off", !(this.phase === "walk" || this.phase === "pose")); this.ui.classList.toggle("fs-end", this.phase === "result" || this.phase === "reward");
    const d = dt * this.speed; this.t += d; this.lastNow = performance.now();
    for (const w of this.waits.slice()) if (this.t >= w.at) { this.waits.splice(this.waits.indexOf(w), 1); w.res(); }
    for (const m of this.models) {
      if (m.tween) { const tw = m.tween, k = U.clamp((this.t - tw.t0) / tw.dur, 0, 1), e = k * k * (3 - 2 * k); m.z = tw.z0 + (tw.z1 - tw.z0) * e; m.lane = tw.l0 + (tw.l1 - tw.l0) * e; if (k >= 1) m.tween = null; }
      if (m.spreadT != null) { const k = U.clamp((this.t - m.spreadT) / 2.4, 0, 1); m.spread = m.spread0 + (1.02 - m.spread0) * k * k * (3 - 2 * k); }
      if (m.walking) m.pose = Math.floor(this.t / 0.27) % 2 ? "walk_02" : "walk_01";
      else if (!m.gesture) m.pose = Math.floor(this.t / 0.6 + m.i) % 2 ? "idle_02" : "idle_01";
    }
    // カメラ（ズームは ゆっくり）
    const f = 1 - Math.pow(0.002, d), c = this.cam, T = this.camTarget(this.camTo); for (const k of ["k", "fx", "fy", "ax", "ay"]) c[k] += (T[k] - c[k]) * f;
    // じどうで おす（テスト）・わが きえたら ミス
    const r = this.ring;
    if (r && !r.done && FashionScene.auto != null && this.t >= r.t1 + FashionScene.auto) this.press(true);
    if (r && !r.done && this.t > r.t1 + FashionShow.WINDOW.good + 0.08) { r.done = true; r.res("miss"); }
    // かみふぶき
    for (const p of this.confetti) { p.vy += 140 * d; p.x += p.vx * d; p.y += p.vy * d; p.a += p.va * d; }
    this.confetti = this.confetti.filter((p) => p.y < this.g.H + 20);
  }
  burst() { const g = this.g; for (let i = 0; i < 70; i++) this.confetti.push({ x: g.cx + (this.rand() - 0.5) * g.W, y: -10 - this.rand() * 120, vx: (this.rand() - 0.5) * 60, vy: 30 + this.rand() * 60, a: this.rand() * 6, va: (this.rand() - 0.5) * 8, c: ["#FF8FB8", "#FFE07A", "#7FD3F0", "#B79BEA", "#7CCB6B", "#FFFFFF"][i % 6], w: 5 + this.rand() * 4 }); }
  // ---- 描く ----
  render(ctx) {
    const g = this.g; if (!g) return;
    ctx.save();
    // カメラ（ポーズの ときは モデルの むねを まんなかに ズーム）
    const c = this.cam; if (c) { ctx.translate(c.ax, c.ay); ctx.scale(c.k, c.k); ctx.translate(-c.fx, -c.fy); }
    this.drawStage(ctx); this.drawRunway(ctx); this.drawAudience(ctx); if (this.models) this.drawModels(ctx);
    for (const p of this.confetti) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w * 0.7, p.w, p.w * 1.4); ctx.restore(); }
    ctx.restore();
    if (!this.models) return;
    this.drawPlate(ctx); this.drawRing(ctx); this.drawPop(ctx); this.drawCurtain(ctx);
    const fl = this.t - this.flashT; if (fl >= 0 && fl < 0.28) { ctx.fillStyle = `rgba(255,255,255,${(0.75 * (1 - fl / 0.28)).toFixed(3)})`; ctx.fillRect(0, 0, g.W, g.H); }
    this.drawLines(ctx); this.drawPanel(ctx); this.drawBanner(ctx); this.drawMc(ctx);
  }
  drawStage(ctx) {
    const g = this.g, W = g.W, T = this.theme, t = this.t;
    const bg = ctx.createLinearGradient(0, 0, 0, g.H); bg.addColorStop(0, "#130F26"); bg.addColorStop(0.5, "#231C42"); bg.addColorStop(1, "#2D2552"); ctx.fillStyle = bg; ctx.fillRect(-W, -g.H, W * 3, g.H * 3);
    // LED の 大きな がめん（テーマの いろ・ロゴ・ながれる ひかり）
    const sx = W * 0.09, sw = W * 0.82, sy = 34, sh = Math.max(60, g.backY - 74);
    ctx.save(); U.rr(ctx, sx, sy, sw, sh, 12); ctx.clip();
    const led = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh); led.addColorStop(0, MallArt.shade(T.col, -0.35)); led.addColorStop(0.5, T.col); led.addColorStop(1, MallArt.shade(T.col, -0.45)); ctx.fillStyle = led; ctx.fillRect(sx, sy, sw, sh);
    ctx.globalAlpha = 0.18; ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 9; i++) { const x = sx + ((i * 0.13 + t * 0.08) % 1.2) * sw - sw * 0.1; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + 26, sy); ctx.lineTo(x - 30, sy + sh); ctx.lineTo(x - 56, sy + sh); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 0.22; for (let y = sy + 3; y < sy + sh; y += 5) ctx.fillRect(sx, y, sw, 1);
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = "#F7E3A1"; U.rr(ctx, sx, sy, sw, sh, 12); ctx.stroke();
    this.text(ctx, "ぽかぽか コレクション", g.cx, sy + sh * 0.44, Math.min(26, W * 0.068), "#FFFFFF", INK, 5);
    this.text(ctx, `テーマ「${T.name}」`, g.cx, sy + sh * 0.44 + Math.min(26, W * 0.068) + 4, Math.min(16, W * 0.044), "#FFF3C4", INK, 4);
    // トラスと ライト（うえ）
    ctx.fillStyle = "#3A3458"; ctx.fillRect(0, 8, W, 10); ctx.strokeStyle = "#5C5585"; ctx.lineWidth = 1.5; for (let x = 0; x < W; x += 12) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x + 12, 18); ctx.stroke(); }
    for (let i = 0; i < 6; i++) {
      const x = W * (0.1 + i * 0.16), sway = Math.sin(t * 0.9 + i * 1.4) * W * 0.12;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; const lg = ctx.createLinearGradient(x, 18, x + sway, g.tipY); lg.addColorStop(0, "rgba(255,247,214,0.32)"); lg.addColorStop(1, "rgba(255,247,214,0)"); ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(x - 5, 20); ctx.lineTo(x + 5, 20); ctx.lineTo(x + sway + 46, g.tipY); ctx.lineTo(x + sway - 46, g.tipY); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#1F1D2E"; ctx.beginPath(); ctx.arc(x, 20, 7, 0, 7); ctx.fill(); ctx.fillStyle = "#FFF7D6"; ctx.beginPath(); ctx.arc(x, 22, 3.5, 0, 7); ctx.fill();
    }
    // ステージの ゆか と りょうがわの カーテン
    const fy = sy + sh + 6, fl = ctx.createLinearGradient(0, fy, 0, g.backY + 18); fl.addColorStop(0, "#3B3363"); fl.addColorStop(1, "#4F4682"); ctx.fillStyle = fl; ctx.fillRect(0, fy, W, g.backY + 18 - fy);
    for (const side of [0, 1]) {
      const x0 = side ? W - W * 0.1 : 0, cw = W * 0.1;
      const cg = ctx.createLinearGradient(x0, 0, x0 + cw, 0); for (let k = 0; k <= 4; k++) cg.addColorStop(k / 4, k % 2 ? "#8E1F3E" : "#B7325A"); ctx.fillStyle = cg; ctx.fillRect(x0, 18, cw, g.backY + 10);
      ctx.fillStyle = "#F7C948"; ctx.fillRect(x0, 18, cw, 6); ctx.beginPath(); ctx.arc(side ? x0 + 6 : x0 + cw - 6, g.backY * 0.6, 5, 0, 7); ctx.fill();
    }
  }
  drawRunway(ctx) {
    const g = this.g, t = this.t, by = g.backY, ty = g.tipY, bh = g.backHalf, th = g.tipHalf;
    const rg = ctx.createLinearGradient(0, by, 0, ty); rg.addColorStop(0, "#DCD3EE"); rg.addColorStop(1, "#FFFFFF");
    ctx.beginPath(); ctx.moveTo(g.cx - bh, by); ctx.lineTo(g.cx + bh, by); ctx.lineTo(g.cx + th, ty - 18); ctx.quadraticCurveTo(g.cx + th, ty + 16, g.cx, ty + 16); ctx.quadraticCurveTo(g.cx - th, ty + 16, g.cx - th, ty - 18); ctx.closePath();
    ctx.fillStyle = rg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // まんなかの ひかる すじ・ふちの LED（ながれる）
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = this.theme.col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(g.cx, by + 4); ctx.lineTo(g.cx, ty + 4); ctx.stroke(); ctx.restore();
    for (let i = 0; i <= 14; i++) {
      const k = i / 14, y = by + (ty - 18 - by) * k, hw = bh + (th - bh) * k, on = (i + Math.floor(t * 8)) % 3 === 0;
      for (const s of [-1, 1]) { ctx.fillStyle = on ? "#FFF3A8" : "#C9B9F2"; ctx.beginPath(); ctx.arc(g.cx + s * (hw - 4), y, 2.6 + k * 1.6, 0, 7); ctx.fill(); }
    }
    // つやの ひかり
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.moveTo(g.cx - bh * 0.5, by + 6); ctx.lineTo(g.cx - bh * 0.2, by + 6); ctx.lineTo(g.cx - th * 0.25, ty - 22); ctx.lineTo(g.cx - th * 0.6, ty - 22); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 客席（ランウェイの りょうがわ・てまえほど 大きい）と カメラの フラッシュ
  drawAudience(ctx) {
    const g = this.g, rows = 6, slot = Math.floor(this.t * 5);
    for (let r = 0; r < rows; r++) {
      const k = (r + 0.5) / rows, y = g.backY + 26 + (g.H - g.backY - 6) * k * 0.98, rad = 8 + k * 13, edge = g.backHalf + (g.tipHalf - g.backHalf) * Math.min(1, k * 1.1) + rad + 6;
      for (const s of [-1, 1]) {
        for (let x = g.cx + s * edge, n = 0; s < 0 ? x > -rad : x < g.W + rad; x += s * rad * 2.3, n++) {
          const id = r * 97 + n * 13 + (s > 0 ? 7 : 0), bob = Math.sin(this.t * 3 + id) * 1.6;
          ctx.fillStyle = id % 3 ? "#2E2A4A" : "#3B355E"; ctx.beginPath(); ctx.ellipse(x, y + rad * 1.3, rad * 1.25, rad * 0.9, 0, Math.PI, 0); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y + bob, rad * 0.82, 0, 7); ctx.fill();
          if (id % 7 === 0) { ctx.strokeStyle = ["#FF8FB8", "#7FD3F0", "#FFE07A"][id % 3]; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + rad * 0.6, y + rad * 0.4); ctx.lineTo(x + rad * 0.9 + Math.sin(this.t * 4 + id) * 3, y - rad * 0.9); ctx.stroke(); }
          if ((id * 31 + slot * 17) % 53 === 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; const fg = ctx.createRadialGradient(x, y - rad * 0.2, 0, x, y - rad * 0.2, rad * 2.2); fg.addColorStop(0, "rgba(255,255,255,0.95)"); fg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y - rad * 0.2, rad * 2.2, 0, 7); ctx.fill(); ctx.restore(); }
        }
      }
    }
  }
  drawModels(ctx) {
    const g = this.g, list = this.models.slice().sort((a, b) => a.z - b.z);
    for (const m of list) {
      const q = this.feetAt(m), k = this.zAt(m.z), size = g.size * k * (1 + 0.07 * Math.max(0, 1 - (this.t - (m.popT ?? -9)) / 0.22)), big = this.cam.k > 1.3 && this.cur === m.i && (m.gesture || this.phase === "pose");
      // スポットライト（あるいて いる 人）
      if (this.cur === m.i && this.phase !== "finale") { ctx.save(); ctx.globalCompositeOperation = "lighter"; const sg = ctx.createRadialGradient(q.x, q.y - size * 0.5, 0, q.x, q.y - size * 0.5, size * 0.95); sg.addColorStop(0, "rgba(255,246,214,0.32)"); sg.addColorStop(1, "rgba(255,246,214,0)"); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(q.x, q.y - size * 0.5, size * 0.95, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "rgba(20,16,40,0.28)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, size * 0.26, size * 0.07, 0, 0, 7); ctx.fill();
      const o = { ...this.outfitOpts(m.id), pose: m.pose, dir: m.dir, face: m.dir === "up" ? "normal" : this.face(m.id, m.face), ...(m.gesture && m.dir === "down" ? { gesture: m.gesture } : {}) };
      const R = big ? g.size * 1.6 : g.size, s = size / R;
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(s, s); Chara.draw(ctx, m.id, o, 0, 0, R); ctx.restore();
    }
  }
  // 「ポーズ！」の ボタンの まんなか（ろんりの ざひょう）。わは ここに むかって ちぢむ
  btnAt() {
    const b = this.btn && this.btn.getBoundingClientRect(), c = G.canvas.getBoundingClientRect(), u = G.cssPerUnit || 1;
    if (!b || !b.width) return { x: this.g.cx, y: this.g.H - 70, r: 42 };
    return { x: (b.left + b.width / 2 - c.left) / u, y: (b.top + b.height / 2 - c.top) / u, r: b.width / 2 / u };
  }
  // カメラの わ（そとの わが ちぢんで ボタンの まわりの わに かさなる とき）
  drawRing(ctx) {
    const r = this.ring, g = this.g, B = this.btnAt(), R1 = B.r + 7, cx = B.x, cy = B.y;
    if (this.t - this.early < 0.5) this.text(ctx, "まだ！", cx, cy - R1 - 22, 18, "#FFE07A", INK, 5);
    if (!r || r.done) return;
    const p = (this.t - r.t0) / r.dur, R0 = Math.min(128, g.W * 0.36), rad = R1 + (R0 - R1) * (1 - p), near = Math.abs(rad - R1) < 7;
    ctx.save(); ctx.lineCap = "round";
    ctx.setLineDash([7, 7]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(cx, cy, R1, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (rad > 6) { ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.stroke(); ctx.lineWidth = 5.5; ctx.strokeStyle = near ? "#FFE07A" : "#FF6FA0"; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.stroke(); }
    // カメラの しるし（4つの かど）
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = cx + sx * (R1 + 14), y = cy + sy * (R1 + 14); ctx.beginPath(); ctx.moveTo(x - sx * 11, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * 11); ctx.stroke(); }
    ctx.restore();
    this.text(ctx, `ポーズ ${r.k + 1} / 3`, cx - R1 - 52, cy, 13, "#FFFFFF", INK, 4);
  }
  drawPop(ctx) {
    const p = this.pop, g = this.g; if (!p) return; const a = this.t - p.t0; if (a > 0.9) { this.pop = null; return; }
    const s = 1 + Math.max(0, 0.35 - a) * 1.4, col = { perfect: "#FFE07A", great: "#FF9EC4", good: "#9FD8F2", miss: "#D9D3E6" }[p.j];
    ctx.save(); ctx.translate(g.cx, g.H * 0.24 - a * 18); ctx.scale(s, s); this.text(ctx, p.text, 0, 0, 34, col, INK, 7); ctx.restore();
  }
  drawCurtain(ctx) {
    const g = this.g, open = this.curtainOpen == null ? 0 : U.clamp((this.t - this.curtainOpen) / 1.2, 0, 1); if (open >= 1) return;
    const e = open * open * (3 - 2 * open), w = (g.W / 2) * (1 - e);
    for (const side of [0, 1]) {
      const x = side ? g.W - w : 0, cg = ctx.createLinearGradient(x, 0, x + Math.max(1, w), 0); for (let k = 0; k <= 6; k++) cg.addColorStop(k / 6, k % 2 ? "#8E1F3E" : "#B7325A");
      ctx.fillStyle = cg; ctx.fillRect(x, 0, w, g.H); ctx.fillStyle = "#F7C948"; ctx.fillRect(side ? x : x + w - 6, 0, 6, g.H);
    }
    if (open < 0.3) this.text(ctx, "ぽかぽか コレクション", g.cx, g.H * 0.42, Math.min(28, g.W * 0.075), "#FFF3C4", INK, 6);
  }
  // 3人の ひとこと（あたまの うえの ちいさい ふきだし。カメラの ズームに あわせる）
  drawLines(ctx) {
    const g = this.g;
    for (const m of this.models) {
      const L = m.line; if (!L) continue; const a = this.t - L.t0; if (a > L.dur) { m.line = null; continue; }
      const q = this.feetAt(m), k = this.zAt(m.z), [x, y] = this.toScreen(q.x, q.y - g.size * k * 0.98 - 6);
      this.bubble(ctx, L.text, U.clamp(x, 70, g.W - 70), Math.max(y, 100), 150, 13);
    }
  }
  // あるいて いる モデルの なまえと おしゃれ レベル（★）
  drawPlate(ctx) {
    const P = this.plate, g = this.g; if (!P || this.phase === "judge" || this.mc) return;
    const a = U.clamp((this.t - (P.t1 ?? (P.t1 = this.t))) / 0.3, 0, 1), w = 156, h = 46, x = 10 - (1 - a) * (w + 20), y = 10;
    ctx.save(); ctx.fillStyle = "rgba(255,251,240,0.95)"; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    this.text(ctx, P.name, x + 10, y + 14, 13, INK, null, 0, "left");
    this.text(ctx, "★".repeat(P.stars) + "☆".repeat(5 - P.stars), x + 10, y + 32, 14, "#F2A93B", null, 0, "left");
    this.text(ctx, `${P.no} / 3`, x + w - 9, y + 14, 11, "#8A5A9B", null, 0, "right");
    if (P.matched) this.text(ctx, `テーマ ${P.matched}こ`, x + w - 9, y + 32, 10, "#8A5A9B", null, 0, "right");
  }
  // しんさいんの パネル（したの ほう）: 3人の すがた・なまえ・ふだ。うえに いま はなして いる 人の ひとこと
  drawPanel(ctx) {
    const P = this.panel, g = this.g; if (!P) return;
    const h = 156, y = g.H - h - 6, a = U.clamp((this.t - P.t0) / 0.3, 0, 1), yy = y + (1 - a) * (h + 10);
    ctx.save(); ctx.fillStyle = "rgba(255,251,240,0.97)"; U.rr(ctx, 8, yy, g.W - 16, h, 16); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    this.text(ctx, "しんさいん", g.cx, yy + 13, 11, "#8A5A9B", null);
    const cw = (g.W - 16) / 3;
    FashionShow.JUDGES.forEach((J, i) => {
      const x = 8 + cw * i + cw / 2, spr = this.npcSprite(J, 72), on = i === P.k;
      ctx.save(); ctx.fillStyle = on ? "#FFE9A8" : "#EFE6FA"; U.rr(ctx, x - cw / 2 + 5, yy + 104, cw - 10, 44, 10); ctx.fill(); ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
      if (spr) { const w = 72, hh = (72 * Chara.VB.h) / Chara.VB.w; ctx.drawImage(spr, x - w / 2 - 20, yy + 100 - hh * 0.92, w, hh); }
      this.text(ctx, J.name, x - 18, yy + 120, 13, INK, null);
      this.text(ctx, J.look, x - 18, yy + 137, 11, "#6B5B8A", null);
      if (i <= P.k) {
        const pop = Math.min(1, (this.t - P.tk) / 0.25), s = on ? 0.6 + pop * 0.4 : 1;
        ctx.save(); ctx.translate(x + 27, yy + 70); ctx.scale(s, s);
        ctx.fillStyle = "#C9A87A"; ctx.fillRect(-3, 12, 6, 26); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.strokeRect(-3, 12, 6, 26);
        ctx.fillStyle = "#FFFFFF"; U.rr(ctx, -21, -34, 42, 48, 8); ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
        this.text(ctx, String(P.r.cards[i]), 0, -10, 27, P.r.cards[i] >= 8 ? "#E8434F" : INK, null);
        ctx.restore();
      }
    });
    if (P.k >= 0) this.judgeBubble(ctx, FashionShow.JUDGES[P.k], P.r.comments[P.k], yy - 10);
  }
  // しんさいんの ひとこと（なまえ と みる ところ・ことば）
  judgeBubble(ctx, J, text, bottom) {
    const g = this.g, w = g.W - 28, size = 14;
    ctx.save(); ctx.font = `900 ${size}px 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif`;
    const L = this.lines(ctx, text, w - 24).slice(0, 3), h = 30 + L.length * (size + 6) + 6, x = 14, y = bottom - h;
    ctx.fillStyle = "#FFFFFF"; U.rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    const k = FashionShow.JUDGES.indexOf(J), tx = 8 + ((g.W - 16) / 3) * (k + 0.5); ctx.beginPath(); ctx.moveTo(tx - 8, y + h - 1); ctx.lineTo(tx, y + h + 9); ctx.lineTo(tx + 8, y + h - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.textBaseline = "middle"; L.forEach((l, i) => ctx.fillText(l, x + 12, y + 30 + (size + 6) * i + (size + 6) / 2 - 3));
    ctx.restore();
    this.text(ctx, `${J.name}（${J.role}）`, x + 12, y + 15, 11, "#8A5A9B", null, 0, "left");
  }
  drawBanner(ctx) {
    const B = this.banner, g = this.g; if (!B) return;
    const a = U.clamp((this.t - B.t0) / 0.4, 0, 1), s = 0.6 + a * 0.4, y = g.H * 0.27;
    ctx.save(); ctx.translate(g.cx, y); ctx.scale(s, s); ctx.globalAlpha = a;
    const w = Math.min(g.W - 30, 320), h = 76;
    ctx.fillStyle = B.R.col; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2 - 14, 0); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2 + 14, 0); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    this.text(ctx, B.R.name, 0, -6, B.R.name.length > 6 ? 24 : 32, INK, "#FFFFFF", 4);
    this.text(ctx, `${B.score}てん`, 0, 26, 18, INK, null);
    ctx.restore();
  }
  drawMc(ctx) {
    const M = this.mc, g = this.g; if (!M) return; const a = this.t - M.t0; if (a > M.dur) { this.mc = null; return; }
    const x = 10, y = 8, w = g.W - 20 - 76, h = 66, spr = this.npcSprite(FashionShow.MC, 56);
    ctx.save(); ctx.globalAlpha = Math.min(1, a / 0.15); ctx.fillStyle = "rgba(255,251,240,0.97)"; U.rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    if (spr) { const sw = 56, sh = (56 * Chara.VB.h) / Chara.VB.w; ctx.save(); ctx.beginPath(); U.rr(ctx, x + 4, y + 4, 54, h - 8, 10); ctx.clip(); ctx.drawImage(spr, x + 3, y + h - sh * 0.86, sw, sh); ctx.restore(); }
    this.text(ctx, `しかいの ${FashionShow.MC.name}`, x + 62, y + 16, 11, "#8A5A3B", null, 0, "left");
    this.wrapText(ctx, M.text, x + 62, y + 34, w - 70, 15, INK, 18);
    ctx.restore();
  }
  // ---- もじ ----
  text(ctx, s, x, y, size, fill, line = INK, lw = 4, align = "center") {
    ctx.save(); ctx.font = `900 ${size}px 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle";
    if (line && lw) { ctx.lineJoin = "round"; ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.strokeText(s, x, y); }
    ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
  }
  lines(ctx, s, maxW) {
    const words = s.split(" "), out = []; let cur = "";
    for (const w of words) { const nx = cur ? cur + " " + w : w; if (ctx.measureText(nx).width > maxW && cur) { out.push(cur); cur = w; } else cur = nx; }
    if (cur) out.push(cur); return out;
  }
  wrapText(ctx, s, x, y, maxW, size, fill, lh) {
    ctx.save(); ctx.font = `900 ${size}px 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = fill;
    this.lines(ctx, s, maxW).slice(0, 3).forEach((l, i) => ctx.fillText(l, x, y + i * lh)); ctx.restore();
  }
  bubble(ctx, s, x, y, maxW, size, wide = false) {
    ctx.save(); ctx.font = `900 ${size}px 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif`;
    const L = this.lines(ctx, s, maxW - 20).slice(0, 3), w = Math.min(maxW, Math.max(...L.map((l) => ctx.measureText(l).width)) + 22), h = L.length * (size + 5) + 14, bx = U.clamp(x - w / 2, 8, this.g.W - 8 - w), by = y - h;
    ctx.fillStyle = "#FFFFFF"; U.rr(ctx, bx, by, w, h, 12); ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke();
    if (!wide) { ctx.beginPath(); ctx.moveTo(x - 7, by + h - 1); ctx.lineTo(x, by + h + 9); ctx.lineTo(x + 7, by + h - 1); ctx.closePath(); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.textBaseline = "middle"; L.forEach((l, i) => ctx.fillText(l, bx + 11, by + 7 + (size + 5) * i + (size + 5) / 2));
    ctx.restore();
  }
  // ---- ごほうびの まど ----
  rewards(sum) {
    return new Promise(async (resolve) => {
      const R = FashionShow.RANK[sum.rank], body = U.el("div", { class: "fs-result" });
      body.append(U.el("div", { class: "fs-rank", html: `<b style="background:${R.col}">${R.name}</b><span>${sum.score}てん</span>` }));
      const rows = U.el("div", { class: "fs-rows" });
      for (const r of sum.models) {
        const c = Save.d.chars[r.id], stars = "★".repeat(r.level.stars) + "☆".repeat(5 - r.level.stars);
        rows.append(U.el("div", { class: "fs-row", html: `<b>${c.name}</b><span class="fs-pt">${r.total}てん</span><span class="fs-detail">おしゃれ ${stars}（${r.fashion}）・ポーズ ${r.pose}${r.bonus ? "・パーフェクト +10" : ""}</span>` }));
      }
      body.append(rows, U.el("div", { class: "fs-coins", html: `<i class="coin-ico"></i> ${R.coins}コイン もらった！` }));
      if (sum.got.length) {
        const got = U.el("div", { class: "fs-got" });
        for (const id of sum.got) { const isF = !!FURN_INDEX[id], it = isF ? FURN_INDEX[id] : ITEM_INDEX[id]; got.append(U.el("div", { class: "fs-prize", html: `${UI.icon(isF ? "furn" : "wear", id, 56)}<b>${it.name}</b>` })); }
        body.append(U.el("p", { class: "fs-lead", text: "はじめての ランクの けいひん！" }), got);
      }
      const cv = U.el("canvas", { class: "fs-photo" }), pw = 220, px = G.px || 2; cv.width = Math.round(pw * px); cv.height = Math.round(((pw * FashionArt.PH) / FashionArt.PW) * px);
      body.append(U.el("p", { class: "fs-lead", text: "きねん しゃしん（すまほの「しゃしん」に はいったよ）" }), cv);
      await FashionArt.preloadPhoto(sum.photo, pw);
      const g2 = cv.getContext("2d"); g2.scale(px, px); FashionArt.drawPhoto(g2, sum.photo, 0, 0, pw);
      Sound.se("coin");
      const m = UI.modal({ title: "ショーの けっか", body, cls: "fs-panel", footer: UI.btn("かいじょうに もどる", () => m.close(), "yellow wide"), onClose: resolve });
    });
  }
}
SCENES.fashion = FashionScene;
// 3人の ひとこと（まつ とき・しんさの あと〔よい・ふつう・ざんねん〕）
FashionScene.LINES = {
  wait: { wanko: "どきどき するね……！", gachan: "ぴよ……がんばろうね！", goji: "ガゥー、きんちょう する" },
  after: { wanko: ["やったー！ きまった！", "ちょっと うまく できたかな？", "あれれ？ でも たのしい！"], gachan: ["ぴよぴよ〜♪ たのしい！", "どきどき したけど たのしい！", "つぎは もっと がんばる！"], goji: ["ガォー♪ うまく できた！", "ガゥ、なかなか！", "ガゥ……つぎこそ！"] },
};
FashionScene.FACE = { smile: { goji: "pk_nikori" }, love: { wanko: "pk_heart", gachan: "pk_heart", goji: "love" }, oops: { wanko: "surprise", gachan: "pk_odoroki", goji: "surprise" } };
FashionScene.speed = 1; // PokaDebug.fashionSpeed（テスト）
FashionScene.auto = null; // PokaDebug.fashionAuto: わが かさなる じこくからの ずれ（びょう）で じどうで おす
// こうかおん（カメラの シャッター・ドラムロール）
(() => {
  const se0 = Sound.se;
  Sound.se = function (name) {
    if (name === "fs_shutter") { if (!this.ctx || !Save.d || !Save.d.settings.se) return; this.noise(this.seGain, { dur: 0.05, vol: 0.32, freq: 3200, q: 0.8 }); this.noise(this.seGain, { t: 0.07, dur: 0.06, vol: 0.22, freq: 1800, q: 1.2 }); return; }
    if (name === "fs_drum") { if (!this.ctx || !Save.d || !Save.d.settings.se) return; for (let i = 0; i < 22; i++) this.noise(this.seGain, { t: i * 0.07, dur: 0.05, vol: 0.12 + i * 0.006, freq: 380, q: 0.9 }); this.tone(this.seGain, { f: 196, t: 1.55, dur: 0.3, type: "triangle", vol: 0.2 }); return; }
    return se0.call(this, name);
  };
})();
