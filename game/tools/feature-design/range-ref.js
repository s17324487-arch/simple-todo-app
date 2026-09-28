// ⑥ 射撃場の しくみと 画面（見本の 実装・classic script）。えらんだ 1人の 目の 高さの 主観で、実際の 射撃競技の ように うつ。
//   new RangeRef.Game(RANGE_DATA, courseId, gunId, { seed, W, H, who, hopStep }) … 1しゅもくの あそび（hopStep は ホップ ダイヤル 0〜20・まんなか 10）
//   game.update(dt, input) … input = { dx, dy（ゆびの うごき px）, fire（おした しゅんかん）, hold（おしている）, ads（のぞく きりかえ）,
//                                       breath（いきを とめる: おしている）, action（ボルト・レバー・こめる）, reload, zoomIn, zoomOut, finish }
//   game.hud() … 画面の うえの 表示に つかう 数（のこり時間・たま・ストリング・てん・かぜ など）
//   RangeRef.draw(ctx, game, art) … 画面を 描く（art.img(key) で 絵。キーは RangeRef.artKeys(RANGE_DATA) で ぜんぶ わかる・有限）
//   RangeRef.bot(game, skill) … 人に にせた じどう あそび（build-range.mjs の ★の めやす しらべ・PokaDebug.rangeAuto）
//   RangeRef.ballistics(gun, hop, B) … BB弾の 弾道の 表（くうきの ていこう・ホップの 浮く 力）・RangeRef.hopAt(gun, step, B) … ホップ ダイヤル → つよさ
//   RangeRef.facade200() … 町の 建物の 外がわ（town-renewal-art.js の facades と 同じ 200×160）
// 角度は mrad（1mrad = 10m で 1cm）、長さは m。GunArtRef（gun-art-ref.js）を 先に 読みこむ。
const RangeRef = (() => {
  const INK = "#1F1D1B", EYE = 1.5;
  const r1 = (n) => Math.round(n * 10) / 10;
  const rng = (seed) => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (R) => { let u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // ---- 弾道（BB弾）----
  // くうきの ていこう（速さの 2じょう）＋ ホップアップの 浮く 力（逆回転の マグヌス効果。回転は 速さほど はやく へらないので (速さ/初速)^liftExp）＋ じゅうりょく
  // 水平に うった ときの 高さ y と 時間 t を 1m ごとに ならべる。hop = 1 で うった しゅんかん じゅうりょくと つりあう
  function flight(gun, hop, B) {
    const A = Math.PI * 0.003 * 0.003, k = (0.5 * B.rho * B.cd * A) / (gun.bb / 1000), dt = B.dt, n = Math.round(B.maxD / B.step);
    const T = new Array(n + 1).fill(null), Y = new Array(n + 1).fill(null), V = new Array(n + 1).fill(null);
    let x = 0, y = 0, vx = gun.v0, vy = 0, t = 0, i = 0; T[0] = 0; Y[0] = 0; V[0] = gun.v0;
    while (i < n && t < 5) {
      const v = Math.hypot(vx, vy), lift = hop * B.g * Math.pow(v / gun.v0, B.liftExp);
      const ax = -k * v * vx - lift * (vy / v), ay = -k * v * vy + lift * (vx / v) - B.g;
      const px = x, py = y, pt = t; vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; t += dt;
      while (i < n && x >= (i + 1) * B.step) { i++; const f = (i * B.step - px) / (x - px); T[i] = pt + f * dt; Y[i] = py + f * (y - py); V[i] = Math.hypot(vx, vy); }
      if (vx < 5) break;
    }
    for (let j = 1; j <= n; j++) if (T[j] == null) { T[j] = T[j - 1] + 1; Y[j] = Y[j - 1] - 1; V[j] = 1; }
    return { T, Y, V, step: B.step };
  }
  // サイトの ゼロイン: いつもの ホップで zero m の ところで ねらった 高さに あたる ように じゅうこうを すこし 上に むける
  function ballistics(gun, hop, B, base) {
    const f = flight(gun, hop, B), fb = base || (hop === gun.hop ? f : flight(gun, gun.hop, B));
    const zi = Math.round(gun.zero / B.step), theta = (gun.sh - fb.Y[zi]) / gun.zero;
    const at = (d) => { const u = Math.max(0, Math.min(f.T.length - 1.001, d / f.step)), i = Math.floor(u), w = u - i; const L = (a) => a[i] + (a[i + 1] - a[i]) * w; return { t: L(f.T), y: L(f.Y) + d * theta - gun.sh, v: L(f.V) }; };
    return { at, theta, f };
  }
  // よこかぜで ながれる 量（m）: かぜ × （とぶ 時間 − くうきが なかった ときの 時間）
  const drift = (gun, d, t, w) => w * Math.max(0, t - d / gun.v0);

  // ---- 見え方（カメラ）----
  // コースごとの 見はば（のぞかない とき・度）。のぞくと じゅうの zoom ばい
  const FOV = { steel: 30, bullseye: 10, practical: 42, precision: 4, long: 30, moving: 30 };
  const RUN_SCREEN = 0.4; // ランニング ターゲットの めかくしの かべは 的の 0.4m てまえ
  const HC = 0.44; // ねらう 点の 画面の たかさ（H に たいする わりあい）
  // 的の 大きさ（m）: ipsc は 45×57cm（A ゾーン 15×32.5・C ゾーン 30×45。A・C は 半分の 大きさで もつ）、ポッパーは 高さ 1.1m
  const SHAPE = { ipsc: { w: 0.45, h: 0.57, cy: 1.25, A: [0.075, 0.1625], C: [0.15, 0.225] }, ns: { w: 0.45, h: 0.57, cy: 1.25 }, popper: { w: 0.3, h: 1.1, head: 0.22 } };
  // ホップ ダイヤル（0〜steps。まんなかが いつもの ホップ）→ ホップの つよさ
  const hopAt = (gun, step, B) => { const H = B.hop, s = step == null ? H.steps / 2 : step; return gun.hop * (H.min + ((H.max - H.min) * s) / H.steps); };

  class Game {
    constructor(data, courseId, gunId, o = {}) {
      this.D = data; this.cid = courseId; this.C = data.courses[courseId]; this.gun = data.guns.find((g) => g.id === gunId);
      const seed = o.seed || `range:${courseId}:${gunId}`;
      // かぜは べつの 乱数（同じ seed なら うつ 人が ちがっても 同じ かぜ）
      this.W = o.W || 360; this.H = o.H || 700; this.R = rng(seed); this.RW = rng(seed + ":wind"); this.who = o.who || "wanko";
      this.hopStep = o.hopStep != null ? o.hopStep : data.ballistics.hop.steps / 2; this.hop = o.hop != null ? o.hop : hopAt(this.gun, this.hopStep, data.ballistics);
      this.bal = ballistics(this.gun, this.hop, data.ballistics);
      const g = this.gun;
      this.phase = "ready"; this.t = 0; this.clock = 0; this.left = this.C.time || 0; this.events = [];
      this.aim = { yaw: 0, pitch: 0 }; this.want = { yaw: 0, pitch: 0 }; this.kick = { x: 0, y: 0 }; this.settle = 0;
      this.ads = false; this.adsT = 0; this.zi = Array.isArray(g.zoom) ? 0.5 : 1; this.breath = { hold: false, stamina: 1, shake: 0 };
      this.ammo = g.mag; this.chamber = true; this.busy = null; this.slideLock = false; this.needAction = false; this.pullLeft = 0;
      this.shots = 0; this.hits = 0; this.bullets = []; this.fx = []; this.marks = [];
      this.wind = 0; this.windTo = 0; this.windNext = 0;
      this.targets = []; this.setupCourse();
    }
    get cat() { return this.gun.cat; }
    // のぞいた ときの ばいりつ（スコープは さいしょう〜さいだいの あいだ）
    get zoom() { const z = this.gun.zoom; const az = Array.isArray(z) ? z[0] + (z[1] - z[0]) * this.zi : z; return 1 + (az - 1) * this.adsT; }
    get pxPerMrad() { return (this.W / 2 / Math.tan(((FOV[this.cid] || 36) * Math.PI) / 360)) / 1000 * this.zoom; }
    // どの しゅもくも RO の「スタンバイ」→ ブザーで はじまる
    setupCourse() {
      const C = this.C, K = C.kind;
      if (K === "steel") { this.string = 0; this.times = []; this.startString(); return; }
      this.score = 0; this.log = [];
      if (K === "ipsc") { this.targets = C.targets.map((d) => this.mk(d)); this.aim.pitch = this.want.pitch = -40; this.standbyFor(1.6, 2.8); return; }
      if (K === "bull" || K === "issf") { this.xs = 0; this.series = 0; this.nextSeries(); return; }
      if (K === "long") { this.targets = C.targets.map((d) => this.mk(d)); this.cur = 0; this.curShots = 0; this.windNext = 0; this.standbyFor(1, 2); return; }
      if (K === "run") { this.run = -1; this.runT = 0; this.targets = []; this.aim.pitch = this.want.pitch = ((C.y - EYE) / C.z) * 1000; this.nextRun(); this.standbyFor(1, 2); return; }
    }
    standbyFor(a, b) { this.phase = "standby"; this.standby = a + this.R() * (b - a); this.events.push({ ev: "standby" }); }
    // せいみつ しゃげき: 1シリーズ ごとに あたらしい まと（APS は 5はつ × 2シリーズ・1シリーズ 2ふん）
    nextSeries() {
      const C = this.C, c = C.card; this.series++; this.sShots = 0; this.left = C.time;
      this.targets = [this.mk({ id: "card" + this.series, shape: C.kind === "bull" ? "aps" : "issf", x: c.x, y: c.y, z: c.z, size: c.size })];
      this.aim.pitch = this.want.pitch = ((c.y - EYE) / c.z) * 1000; this.aim.yaw = this.want.yaw = 0;
      this.standbyFor(1, 1.8);
    }
    endSeries() {
      if ((this.series || 1) < (this.C.series || 1)) { this.phase = "between"; this.between = 2.2; this.events.push({ ev: "series", n: this.series }); }
      else this.finish();
    }
    mk(d) { return { ...d, def: d, hits: [], down: 0, hitT: 0, x0: d.x, dir: 1, active: !d.wait, marks: [] }; }
    startString() {
      const C = this.C; this.string++; this.targets = C.targets.map((d) => this.mk(d)); this.phase = "standby"; this.standby = C.standby[0] + this.R() * (C.standby[1] - C.standby[0]);
      this.ammo = this.gun.mag; this.chamber = true; this.slideLock = false; this.busy = null; this.ads = false; this.adsT = 0;
      this.aim.pitch = this.want.pitch = -80; this.aim.yaw = this.want.yaw = 0; this.events.push({ ev: "standby", string: this.string });
    }
    nextRun() {
      const C = this.C; this.run++; if (this.run >= C.runs.length) return this.finish();
      const sp = C.runs[this.run], dir = this.run % 2 ? -1 : 1;
      this.targets = [this.mk({ id: "run" + this.run, shape: "run", x: -dir * (C.window / 2 + 0.6), y: C.y, z: C.z, d: C.d })];
      Object.assign(this.targets[0], { vx: dir * sp, wait: C.wait[0] + this.R() * (C.wait[1] - C.wait[0]), shot: false });
      this.events.push({ ev: "run", n: this.run + 1, fast: sp > 1 });
    }
    // 的の いまの 位置（うごく 的）
    posOf(tg, t) {
      const d = tg.def;
      if (d.swing && tg.active) { const a = t - (tg.actT || 0); return { x: d.x + d.swing.amp * Math.sin((2 * Math.PI * a) / d.swing.period), y: d.y, z: d.z }; }
      if (d.rail) { const L = d.rail.to - d.rail.from, s = ((t * d.rail.speed) % (2 * L) + 2 * L) % (2 * L); return { x: d.rail.from + (s < L ? s : 2 * L - s), y: d.y, z: d.z }; }
      if (tg.shape === "run") { const tt = Math.max(0, t - tg.startT - tg.wait); return { x: tg.x0 + tg.vx * tt, y: d.y, z: d.z }; }
      return { x: tg.x, y: d.y, z: d.z };
    }
    // ゆれ（mrad）: のぞいて いる ときだけ。おもい じゅうほど 小さい。いきを とめると へる・ながく とめすぎると ふるえる
    sway() {
      if (this.adsT <= 0) return { x: 0, y: 0 };
      const Hd = this.D.hold, base = Hd[this.cat] / Math.sqrt(this.gun.weight / (this.cat === "hand" ? 0.8 : 3)), t = this.t;
      const k = (this.breath.hold ? Hd.calm : 1) * (1 + this.breath.shake * (Hd.shake - 1)) * (1 + 2 * this.settle) * this.adsT;
      return { x: base * k * (Math.sin(t * 1.3 + 0.7) + 0.6 * Math.sin(t * 2.9 + 2.1)) * 0.6, y: base * k * (0.8 * Math.sin(t * 1.7) + 0.5 * Math.sin(t * 3.3 + 1.3)) * 0.6 };
    }
    update(dt, inp = {}) {
      const g = this.gun, C = this.C, K = C.kind, Hd = this.D.hold;
      if (this.phase === "end") return;
      this.t += dt;
      // ねらいを うごかす（ゆびの うごき → 角度。おもい じゅうは すこし おくれる）
      const ppm = this.pxPerMrad;
      if (inp.dx || inp.dy) { this.want.yaw += (inp.dx || 0) / ppm; this.want.pitch -= (inp.dy || 0) / ppm; this.settle = Math.min(1, this.settle + Math.hypot(inp.dx || 0, inp.dy || 0) / ppm / 40); }
      this.want.yaw = Math.max(-700, Math.min(700, this.want.yaw)); this.want.pitch = Math.max(-250, Math.min(250, this.want.pitch));
      const tau = 0.02 + 0.012 * g.weight, a = 1 - Math.exp(-dt / tau);
      this.aim.yaw += (this.want.yaw - this.aim.yaw) * a; this.aim.pitch += (this.want.pitch - this.aim.pitch) * a;
      this.settle *= Math.exp(-dt / 0.45);
      // はねあがりは もどる（のこりは 自分で もどす）
      const kk = Math.exp(-dt / 0.12); this.kick.x *= kk; this.kick.y *= kk;
      // のぞく
      if (inp.ads) this.ads = !this.ads;
      const adsTime = 0.16 + 0.04 * g.weight; this.adsT = Math.max(0, Math.min(1, this.adsT + (this.ads ? dt : -dt) / adsTime));
      if (Array.isArray(g.zoom)) { if (inp.zoomIn) this.zi = Math.min(1, this.zi + 0.25); if (inp.zoomOut) this.zi = Math.max(0, this.zi - 0.25); }
      // いき
      const B = this.breath;
      if (inp.breath && B.stamina > 0 && B.shake <= 0) { B.hold = true; B.stamina = Math.max(0, B.stamina - dt / Hd.breath); if (B.stamina <= 0) { B.hold = false; B.shake = 1; this.events.push({ ev: "gasp" }); } }
      else { B.hold = false; if (B.shake > 0) B.shake = Math.max(0, B.shake - dt / Hd.rest); B.stamina = Math.min(1, B.stamina + dt / (Hd.rest * 1.2)); }
      // かぜ（ロングレンジ・ムービング）
      if (C.wind || C.kind === "run") { if (this.t >= this.windNext) { const W = C.wind || [0, 0.6], gu = C.gust || [6, 12], RW = this.RW; this.windTo = (W[0] + RW() * (W[1] - W[0])) * (RW() < 0.5 ? -1 : 1); this.windNext = this.t + gu[0] + RW() * (gu[1] - gu[0]); } this.wind += (this.windTo - this.wind) * (1 - Math.exp(-dt / 1.5)); }
      // しゅもくの すすみ
      if (this.phase === "standby") {
        this.standby -= dt;
        if (this.standby <= 0) { this.phase = "play"; this.clock = 0; this.raise = K === "steel" ? C.raise : 0.3; this.events.push({ ev: "beep" }); }
        this.stepBullets(dt); return;
      }
      if (this.phase === "between") {
        this.between -= dt; this.stepBullets(dt);
        if (this.between <= 0) { if (K === "steel") { if (this.string >= C.strings) this.finish(); else this.startString(); } else this.nextSeries(); }
        return;
      }
      this.clock += dt;
      if (this.raise > 0) { this.raise -= dt; if (K === "steel" && this.raise <= 0) { this.want.pitch = Math.max(this.want.pitch, -20); } }
      if (C.time) { this.left = Math.max(0, C.time - this.clock); if (this.left <= 0 && K !== "ipsc") { if (K === "bull" || K === "issf") this.endSeries(); else this.finish(); return; } }
      // じゅうの そうさ
      if (this.busy) { this.busy.left -= dt; if (this.busy.left <= 0) this.doneBusy(); }
      if (inp.reload && !this.busy && this.ammo < g.mag && g.action !== "single") this.startReload();
      if (inp.action && !this.busy) {
        if (this.needAction && (g.action === "bolt" || g.action === "lever")) this.busy = { kind: "cycle", left: g.cycle };
        else if (g.action === "single" && !this.chamber) this.busy = { kind: "load", left: g.perRound };
      }
      if (this.pullLeft > 0) { this.pullLeft -= dt; if (this.pullLeft <= 0) this.shoot(); }
      const limit = C.shots && (this.sShots != null ? this.sShots : this.shots) >= C.shots, oneShot = K === "run" && this.targets[0] && this.targets[0].shot;
      const canFire = !this.busy && this.chamber && this.pullLeft <= 0 && !(this.raise > 0) && this.cool <= 0 && !limit && !oneShot;
      this.cool = (this.cool || 0) - dt;
      if (canFire && (inp.fire || (g.action === "auto" && inp.hold))) { if (g.action === "da") this.pullLeft = g.pull; else this.shoot(); }
      if (!this.chamber && !this.busy && this.ammo <= 0 && g.action !== "single" && g.action !== "lever") this.startReload();
      // うごく 的
      for (const tg of this.targets) {
        if (tg.shape === "popper" && tg.down && tg.fall < 1) tg.fall = Math.min(1, (tg.fall || 0) + dt * 3);
        if (tg.def.shape === "gong" && tg.hitT) tg.swingA = Math.max(0, 1 - (this.t - tg.hitT) / 2.5);
      }
      if (K === "run") this.stepRun(dt);
      this.stepBullets(dt);
      if (K === "ipsc" && (inp.finish || this.ipscDone() || this.clock >= (C.limit || 60))) this.finish();
      if ((K === "bull" || K === "issf") && this.sShots >= C.shots && !this.bullets.length) this.endSeries();
      if (K === "long" && this.shots >= C.shots && !this.bullets.length) this.finish();
    }
    startReload() {
      const g = this.gun;
      if (g.action === "lever") { this.busy = { kind: "tube", left: g.perRound }; return; }
      this.busy = { kind: "reload", left: g.reload + (this.slideLock ? g.empty : 0) }; this.events.push({ ev: "reload" });
    }
    doneBusy() {
      const b = this.busy, g = this.gun; this.busy = null;
      if (b.kind === "reload") { this.ammo = g.mag; this.chamber = true; this.slideLock = false; this.events.push({ ev: "reloaded" }); }
      if (b.kind === "tube") { this.ammo = Math.min(g.mag, this.ammo + 1); if (!this.chamber && !this.needAction) this.chamber = true; if (this.ammo < g.mag) this.busy = { kind: "tube", left: g.perRound }; }
      if (b.kind === "cycle") { this.needAction = false; this.chamber = this.ammo > 0; this.events.push({ ev: "cycle" }); }
      if (b.kind === "load") { this.chamber = true; this.events.push({ ev: "load" }); }
    }
    // 1ぱつ うつ: ねらい ＋ はねあがり ＋ ゆれ ＋ ばらつき の むきに BB弾を とばす
    shoot() {
      const g = this.gun, R = this.R, sw = this.sway(), ads = this.adsT > 0.9;
      const sig = (ads ? g.group : g.hip) / 2 / 2.45 * (1 + (this.busy ? 1 : 0));
      const tr = ads ? (this.D.hold.trigger[g.action] || 0.3) : 0;
      const dir = { yaw: this.aim.yaw + this.kick.x + sw.x + gauss(R) * sig + gauss(R) * tr, pitch: this.aim.pitch + this.kick.y + sw.y + gauss(R) * sig + gauss(R) * tr };
      // ロングレンジは いまの かね（ちかい じゅんに per はつずつ）を おぼえて おく
      const want = this.C.kind === "long" && this.targets[this.cur] ? this.targets[this.cur].id : null;
      if (want && ++this.curShots >= this.C.per) { this.cur++; this.curShots = 0; }
      this.bullets.push({ t0: this.t, dir, sig, wind: this.wind, done: false, grow: this.D.ballistics.spreadGrow, gx: gauss(R), gy: gauss(R), want });
      this.shots++; if (this.sShots != null) this.sShots++; this.ammo--; this.cool = 1 / g.rate;
      this.kick.y += g.recoil * (0.85 + 0.3 * R()); this.kick.x += g.recoil * (R() - 0.5) * 0.4; this.want.pitch += g.recoil * (1 - g.back); this.aim.pitch += g.recoil * (1 - g.back);
      if (g.action === "bolt" || g.action === "lever") { this.chamber = false; this.needAction = true; }
      else if (g.action === "single") this.chamber = false;
      else { this.chamber = this.ammo > 0; if (this.ammo <= 0 && g.power === "gbb") this.slideLock = true; }
      if (g.action === "lever" && this.busy && this.busy.kind === "tube") this.busy = null;
      this.fx.push({ kind: "air", t: 0, life: 0.2 }); this.events.push({ ev: "fire", power: g.power, action: g.action });
      if (this.C.kind === "run" && this.targets[0]) this.targets[0].shot = true;
    }
    // BB弾が 的の きょりに ついた ときに あたりを しらべる（てまえの 的から じゅんに）
    stepBullets(dt = 1 / 60) {
      for (const b of this.bullets) {
        if (b.done) continue;
        const list = this.targets.filter((tg) => !tg.done && tg.active && !(tg.shape === "popper" && tg.down)).map((tg) => ({ tg, z: tg.def.z })).sort((a, c) => a.z - c.z);
        const back = this.C.kind === "long" || this.C.kind === "run" ? 80 : this.C.kind === "issf" ? 11 : 26;
        b.checked = b.checked || new Set();
        let stopped = false;
        if (this.C.kind === "run" && !b.checked.has("screen")) {
          const zs = this.C.z - RUN_SCREEN, at = this.bal.at(zs);
          if (b.t0 + at.t <= this.t) {
            b.checked.add("screen");
            const bx = (zs * b.dir.yaw) / 1000 + drift(this.gun, zs, at.t, b.wind), by = EYE + (zs * b.dir.pitch) / 1000 + at.y;
            if (Math.abs(bx) > this.C.window / 2 && by < 2.2) { b.done = true; this.fx.push({ kind: "puff", x: bx, y: Math.max(0.05, by), z: zs, t: 0, life: 0.8 }); this.onMiss(); continue; }
          }
        }
        for (const { tg, z } of list) {
          if (b.checked.has(tg.id)) continue;
          const at = this.bal.at(z); if (b.t0 + at.t > this.t) break;
          b.checked.add(tg.id);
          const grow = 1 + z / b.grow, sx = b.gx * b.sig * (grow - 1), sy = b.gy * b.sig * (grow - 1);
          const bx = (z * (b.dir.yaw + sx)) / 1000 + drift(this.gun, z, at.t, b.wind), by = EYE + (z * (b.dir.pitch + sy)) / 1000 + at.y;
          const p = this.posOf(tg, b.t0 + at.t), hit = this.hitTest(tg, bx - p.x, by - p.y);
          if (hit) { this.onHit(tg, hit, bx - p.x, by - p.y, b.t0 + at.t, b); b.done = true; stopped = true; break; }
        }
        if (!stopped) { const at = this.bal.at(back); if (b.t0 + at.t <= this.t) { b.done = true; const bx = (back * b.dir.yaw) / 1000 + drift(this.gun, back, at.t, b.wind), by = EYE + (back * b.dir.pitch) / 1000 + at.y; this.fx.push({ kind: "puff", x: bx, y: Math.max(0.05, by), z: back, t: 0, life: 0.8 }); this.onMiss(); } }
      }
      this.bullets = this.bullets.filter((b) => !b.done);
      this.fx = this.fx.filter((f) => (f.t += dt) < f.life);
    }
    // あたり → { zone, pts, lx, ly }。dx / dy は 的の 位置（posOf）からの ずれ（m）。
    // lx / ly は 絵の 原点からの 位置（m・うえが +）: 紙の 的は 的の まんなか、ポッパーは 足もと、ほかは まんなか
    hitTest(tg, dx, dy) {
      const s = tg.def.shape || tg.shape, C = this.C, box = (w, h) => Math.abs(dx) <= w / 2 && Math.abs(dy) <= h / 2;
      if (s === "round" || s === "gong") return Math.hypot(dx, dy) <= tg.def.d / 2 ? { zone: "hit", lx: dx, ly: dy } : null;
      if (s === "stop") return box(tg.def.w, tg.def.h) ? { zone: "hit", lx: dx, ly: dy } : null;
      if (s === "aps") { const r = Math.hypot(dx, dy) - (C.card.gauge || 0); for (const ring of C.card.rings) if (r <= ring.d / 2) return { zone: ring.x ? "X" : String(ring.pts), pts: ring.pts, x: !!ring.x, lx: dx, ly: dy }; return box(tg.def.size, tg.def.size) ? { zone: "0", pts: 0, lx: dx, ly: dy } : null; }
      if (s === "issf") { if (!box(tg.def.size, tg.def.size)) return null; const r = Math.hypot(dx, dy), v = Math.round((10.9 - Math.floor(r / (C.card.step / 10)) * 0.1) * 10) / 10; return { zone: "ring", pts: v >= 1 ? v : 0, lx: dx, ly: dy }; }
      if (s === "run") { const r = Math.hypot(dx, dy), ring = Math.max(1, Math.ceil((r / (tg.def.d / 2)) * 10)); return ring <= 10 ? { zone: "ring", pts: 11 - ring, lx: dx, ly: dy } : null; }
      if (s === "ipsc" || s === "ns") {
        const S = SHAPE.ipsc, yy = dy - S.cy; // 紙の 的は 地面から 立てる（まんなかの 高さ cy）
        if (Math.abs(dx) > S.w / 2 || Math.abs(yy) > S.h / 2 || Math.abs(dx) / (S.w / 2) + Math.abs(yy) / (S.h / 2) > 1.62) return null;
        if (s === "ns") return { zone: "NS", lx: dx, ly: yy };
        return { zone: Math.abs(dx) <= S.A[0] && Math.abs(yy) <= S.A[1] ? "A" : Math.abs(dx) <= S.C[0] && Math.abs(yy) <= S.C[1] ? "C" : "D", lx: dx, ly: yy };
      }
      if (s === "popper") { const S = SHAPE.popper, hy = S.h - S.head / 2; if (Math.hypot(dx, dy - hy) <= S.head / 2 || (Math.abs(dx) <= S.w * 0.37 && dy >= 0 && dy <= S.h - S.head)) return { zone: "hit", lx: dx, ly: dy }; return null; }
      return null;
    }
    onHit(tg, hit, dx, dy, when, b) {
      const K = this.C.kind; this.hits++; tg.hitT = this.t; tg.marks.push([hit.lx, hit.ly]);
      let pts = 0;
      if (K === "steel") { tg.done = true; if (tg.def.stop) this.stringDone(when); }
      else if (K === "bull") { pts = hit.pts; this.score += pts; if (hit.x) this.xs++; this.log.push(hit.zone); }
      else if (K === "issf") { pts = hit.pts; this.score = Math.round((this.score + pts) * 10) / 10; this.log.push(pts.toFixed(1)); }
      else if (K === "long") { if (b && b.want === tg.id) { pts = tg.def.pts; this.score += pts; this.log.push(tg.def.z + "m"); } else this.log.push("×"); } // ちがう かねは はずれ
      else if (K === "run") { if (!tg.scored) { tg.scored = true; pts = hit.pts; this.score += pts; this.log.push(pts); } }
      else if (K === "ipsc") {
        if (tg.shape === "popper") { tg.down = true; tg.fall = 0; if (tg.def.act) { const s = this.targets.find((x) => x.id === tg.def.act); if (s) { s.active = true; s.actT = this.t; } } }
        else tg.hits.push(hit.zone);
      }
      this.events.push({ ev: "hit", kind: tg.shape, zone: hit.zone, pts, z: tg.def.z, delay: tg.def.z / 340 });
    }
    onMiss() { this.events.push({ ev: "miss" }); if (this.C.kind === "bull") this.log.push("M"); if (this.C.kind === "issf") this.log.push("0.0"); if (this.C.kind === "long") this.log.push("×"); }
    stringDone(when) {
      const C = this.C, left = this.targets.filter((x) => !x.def.stop && !x.done).length, time = Math.round(((when - (this.t - this.clock)) + left * C.penalty) * 100) / 100;
      this.times.push({ time, left }); this.phase = "between"; this.between = 2.2; this.events.push({ ev: "string", time, left, n: this.string });
    }
    stepRun(dt) {
      const tg = this.targets[0]; if (!tg) return;
      if (tg.startT == null) tg.startT = this.t;
      const p = this.posOf(tg, this.t), C = this.C;
      if (Math.abs(p.x) > C.window / 2 + 0.7 && this.t - tg.startT - tg.wait > 0.5 && !this.bullets.length) { if (!tg.scored) this.log.push(0); this.nextRun(); }
    }
    ipscDone() { return this.targets.filter((t) => t.shape === "popper").every((t) => t.down) && this.targets.filter((t) => t.shape === "ipsc" && t.active).every((t) => t.hits.length >= this.C.perPaper) && !this.bullets.length; }
    // IPSC の てんすう: かみは よい 2はつ・ポッパー 5・ミス −10・NS −10
    ipscScore() {
      const C = this.C, Z = C.zones; let pts = 0, miss = 0, ns = 0, zones = { A: 0, C: 0, D: 0 };
      for (const t of this.targets) {
        if (t.shape === "ipsc") { const best = t.hits.map((z) => Z[z]).sort((a, b) => b - a).slice(0, C.perPaper); t.hits.forEach((z) => zones[z]++); pts += best.reduce((a, b) => a + b, 0); miss += Math.max(0, C.perPaper - t.hits.length); }
        if (t.shape === "popper") { if (t.down) pts += C.popper; else miss++; }
        if (t.shape === "ns") ns += t.hits.length;
      }
      const total = Math.max(0, pts - miss * C.miss - ns * C.ns), time = Math.max(0.5, this.lastShot != null ? this.lastShot : this.clock);
      return { pts, miss, ns, zones, total, time: Math.round(time * 100) / 100, hf: Math.round((total / time) * 100) / 100 };
    }
    finish() {
      if (this.phase === "end") return;
      const C = this.C, K = C.kind; this.phase = "end";
      if (K === "steel") { const ts = this.times.map((x) => x.time).sort((a, b) => a - b); this.result = Math.round(ts.slice(0, C.strings - C.drop).reduce((a, b) => a + b, 0) * 100) / 100; }
      else if (K === "ipsc") { this.sheet = this.ipscScore(); this.result = this.sheet.hf; }
      else this.result = this.score;
      const st = this.D.courses[this.cid].stars || [];
      this.stars = C.score === "time" ? st.filter((v) => this.result <= v).length : st.filter((v) => this.result >= v).length;
      this.coins = Math.round(this.D.pay.base * this.D.pay.rank[this.stars]);
      this.events.push({ ev: "end", stars: this.stars, result: this.result });
    }
    take() { const e = this.events; this.events = []; return e; }
    // 画面の うえの 表示（DOM の HUD）に つかう 数
    hud() {
      const C = this.C, K = C.kind, g = this.gun, r2 = (n) => Math.round(n * 100) / 100;
      const h = { kind: K, phase: this.phase, clock: r2(this.clock), left: C.time ? Math.ceil(this.left) : null, limit: C.limit || null, ammo: this.ammo, mag: g.mag, chamber: this.chamber,
        busy: this.busy ? this.busy.kind : null, needAction: this.needAction, slideLock: this.slideLock, ads: this.ads, zoom: Math.round(this.zoom * 10) / 10, stamina: r2(this.breath.stamina), shake: this.breath.shake > 0, hold: this.breath.hold };
      if (K === "steel") Object.assign(h, { string: this.string, strings: C.strings, times: this.times.map((x) => x.time) });
      if (K === "bull" || K === "issf") Object.assign(h, { series: this.series, seriesN: C.series || 1, shot: this.sShots, shots: C.shots, score: this.score, last: this.log.length ? this.log[this.log.length - 1] : null });
      if (K === "long") { const t = this.targets[Math.min(this.cur, this.targets.length - 1)]; Object.assign(h, { shot: this.shots, shots: C.shots, score: this.score, cur: t ? t.def.z : null, curShot: Math.min(C.per, this.curShots + 1), per: C.per }); }
      if (K === "run") Object.assign(h, { run: Math.max(1, this.run + 1), runs: C.runs.length, fast: C.runs[Math.max(0, this.run)] > 1, score: this.score });
      if (C.wind || K === "run") { const w = Math.abs(this.wind); Object.assign(h, { windDir: this.wind < 0 ? -1 : 1, windLevel: w < 0.3 ? 0 : w < 0.7 ? 1 : 2 }); }
      return h;
    }
  }
  // ipsc の 最後の 1ぱつの 時間を おぼえる
  const _shoot = Game.prototype.shoot; Game.prototype.shoot = function () { _shoot.call(this); if (this.C.kind === "ipsc") this.lastShot = this.clock; };

  // ---- 人に にせた じどう あそび ----
  //   react 見てから うごく まで・tau ねらいが ちかづく はやさ・speed いちばん はやい うごき（mrad/びょう）・err 手の ぶれ（mrad）
  //   tol どこまで ちかづいたら うつか（的の 半径の わりあい）・dwell ねらって から うつ まで・windErr かぜの よみの ずれ・leadErr さきよみの ずれ
  //   breath いきを とめるか・act ボルトなどを うごかす までの おくれ
  const SKILL = {
    kid: { react: 0.45, tau: 0.3, speed: 500, err: 2.4, tol: 1.0, dwell: 0.35, windErr: 0.8, leadErr: 0.5, pred: 0.5, breath: false, act: 0.5, taps: 2.5 },
    casual: { react: 0.3, tau: 0.2, speed: 900, err: 1.2, tol: 0.75, dwell: 0.22, windErr: 0.45, leadErr: 0.25, pred: 0.8, breath: true, act: 0.25, taps: 4 },
    good: { react: 0.18, tau: 0.11, speed: 1600, err: 0.5, tol: 0.55, dwell: 0.12, windErr: 0.2, leadErr: 0.1, pred: 1.0, breath: true, act: 0.1, taps: 6 },
  };
  function bot(g, skill = "casual") {
    const sk = typeof skill === "string" ? SKILL[skill] : { ...SKILL.casual, ...skill }, dt = 1 / 60;
    const inp = { dx: 0, dy: 0, fire: false, hold: false, ads: false, breath: false, action: false, reload: false };
    const B = g._bot || (g._bot = { R: rng("bot" + g.cid + g.gun.id + JSON.stringify(sk).length), on: 0, wait: 0, tap: 0, act: 0, wx: 0, wy: 0, tgt: null, react: 0, windGuess: 0, guessNext: 0 });
    if (g.phase === "end") return inp;
    if (!g.ads) inp.ads = true;
    if (Array.isArray(g.gun.zoom) && g.zi < 0.75 && B.R() < 0.05) inp.zoomIn = true;
    if (g.phase !== "play") { B.react = sk.react; return inp; }
    if (B.react > 0) { B.react -= dt; return inp; }
    // ボルト・レバー・こめる・リロード
    if (g.needAction || (g.gun.action === "single" && !g.chamber && !g.busy)) { B.act += dt; if (B.act >= sk.act) { inp.action = true; B.act = 0; } }
    if (!g.busy && g.ammo <= 0 && g.gun.action === "lever") inp.reload = true;
    // ねらう 的と ねらう 点（弾道・かぜ・さきよみ を よむ）
    const pick = () => {
      const K = g.C.kind, live = g.targets.filter((t) => t.active && !t.done && !(t.shape === "popper" && t.down) && t.shape !== "ns");
      if (K === "steel") { const plates = live.filter((t) => !t.def.stop); const L = plates.length ? plates : live; return L.sort((a, c) => Math.abs(a.def.x / a.def.z * 1000 - g.aim.yaw) - Math.abs(c.def.x / c.def.z * 1000 - g.aim.yaw))[0]; }
      if (K === "ipsc") { const pp = live.filter((t) => t.shape === "popper"); if (pp.length) return pp.sort((a, c) => Math.abs(a.def.x / a.def.z * 1000 - g.aim.yaw) - Math.abs(c.def.x / c.def.z * 1000 - g.aim.yaw))[0]; const pa = live.filter((t) => t.shape === "ipsc" && t.hits.length < g.C.perPaper); return pa.sort((a, c) => Math.abs(g.posOf(a, g.t).x / a.def.z * 1000 - g.aim.yaw) - Math.abs(g.posOf(c, g.t).x / c.def.z * 1000 - g.aim.yaw))[0]; }
      if (K === "long") return g.targets[g.cur] || null;
      return live[0];
    };
    // 6ぱつ うっても すすまない 的は（てまえの 的に かくれて いる など）しばらく あきらめる
    const skip = B.skip || (B.skip = new Map());
    if (B.tgt && g.C.kind !== "long" && (B.shotsAt >= 6 || g.t - B.since > 3.5)) { skip.set(B.tgt.id, g.t + 3); B.tgt = null; }
    if (!B.tgt || !g.targets.includes(B.tgt) || B.tgt.done || (g.C.kind === "long" && B.tgt !== g.targets[g.cur]) || (B.tgt.shape === "popper" && B.tgt.down) || (B.tgt.shape === "ipsc" && B.tgt.hits.length >= g.C.perPaper)) { if (B.wait > 0) { B.wait -= dt; return inp; } const all = g.targets; g.targets = all.filter((t) => !((skip.get(t.id) || 0) > g.t)); B.tgt = pick() || null; g.targets = all; if (!B.tgt) B.tgt = pick(); B.on = 0; B.shotsAt = 0; B.since = g.t; B.pw = null; B.progress = B.tgt ? (B.tgt.hits || []).length : 0; }
    const tg = B.tgt; if (!tg) { if (g.C.kind === "ipsc") inp.finish = true; return inp; }
    if (g.t >= B.guessNext) { B.windGuess = g.wind + (B.R() - 0.5) * 2 * sk.windErr * (Math.abs(g.wind) + 0.3); B.guessNext = g.t + 1.5; }
    const z = tg.def.z, at = g.bal.at(z), tFly = at.t;
    let p = g.posOf(tg, g.t + (tg.shape === "run" || tg.def.rail || tg.def.swing ? tFly * (1 - sk.leadErr * (B.R() - 0.3)) : 0));
    if (tg.shape === "run" && g.t - tg.startT - tg.wait < 0) return inp;
    let ay = p.y; if (tg.shape === "ipsc") ay = SHAPE.ipsc.cy; if (tg.shape === "popper") ay = SHAPE.popper.h - SHAPE.popper.head / 2;
    const wantYaw = ((p.x - drift(g.gun, z, tFly, B.windGuess)) / z) * 1000, wantPitch = ((ay - EYE - at.y) / z) * 1000;
    // 中心の 見きわめの ずれ（1ぱつ ごとに かわる）
    if (B.ex == null || B.shotN !== g.shots) { B.ex = gauss(B.R) * sk.err; B.ey = gauss(B.R) * sk.err; B.shotN = g.shots; }
    B.wx = B.ex; B.wy = B.ey;
    const tx = wantYaw + B.wx, ty = wantPitch + B.wy, dyaw = tx - g.want.yaw, dpit = ty - g.want.pitch;
    // うごく 的は その はやさに あわせて ゆびを うごかし（pred）、のこりの ずれを tau で ちぢめる
    const vy0 = B.pw ? (wantYaw - B.pw[0]) / dt : 0, vp0 = B.pw ? (wantPitch - B.pw[1]) / dt : 0; B.pw = [wantYaw, wantPitch];
    let mx = vy0 * dt * sk.pred + dyaw * (1 - Math.exp(-dt / sk.tau)), my = vp0 * dt * sk.pred + dpit * (1 - Math.exp(-dt / sk.tau)); const m = Math.hypot(mx, my), cap = (sk.speed * dt) / Math.max(1, g.zoom * 0.5); if (m > cap) { mx *= cap / m; my *= cap / m; }
    const ppm = g.pxPerMrad; inp.dx = mx * ppm; inp.dy = -my * ppm;
    // 見えて いる ねらい（はねあがり・ゆれ こみ）と ねらう 点の ずれ
    // 人は じぶんが 思う まんなか（手の ぶれ こみ）で うつ
    const sw = g.sway(), d = Math.hypot(g.aim.yaw + g.kick.x + sw.x - tx, g.aim.pitch + g.kick.y + sw.y - ty);
    const size = tg.shape === "ipsc" ? SHAPE.ipsc.A[0] : tg.shape === "popper" ? SHAPE.popper.head / 2 : tg.shape === "stop" ? tg.def.h / 2 : tg.shape === "aps" ? 0.011 : tg.shape === "issf" ? 0.004 : (tg.def.d || 0.3) / 2;
    const rad = (size / z) * 1000;
    if (sk.breath && (g.C.kind === "issf" || g.C.kind === "bull" || g.C.kind === "long" || g.C.kind === "run") && d < rad * 4 && g.breath.stamina > 0.25) inp.breath = true;
    const inWindow = tg.shape !== "run" || Math.abs(p.x) < g.C.window / 2 - 0.05;
    if (d < rad * sk.tol && inWindow) B.on += dt; else B.on = Math.max(0, B.on - dt * 2);
    const needDwell = sk.dwell * (g.zoom > 2 ? 0.5 : 1);
    if (tg.hits && tg.hits.length > B.progress) { B.progress = tg.hits.length; B.shotsAt = 0; B.since = g.t; }
    if (B.on >= needDwell && B.tap <= 0) { inp.fire = true; inp.hold = true; B.tap = 1 / sk.taps; B.on = 0; B.shotsAt = (B.shotsAt || 0) + 1; if (g.C.kind !== "bull" && g.C.kind !== "issf" && !(tg.shape === "ipsc" && tg.hits.length + 1 < g.C.perPaper)) { B.wait = sk.react * 0.5; } }
    B.tap -= dt;
    return inp;
  }

  // ---- 絵 ----
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // 的の 絵（mm 単位の viewBox。中心 0,0）。キーは "rt:" + shape（有限）
  function targetSvg(shape, def = {}) {
    let s = "", vb;
    if (shape === "round" || shape === "gong") { const r = ((def.d || 0.2) * 1000) / 2; vb = [-r - 20, -r - 20, 2 * r + 40, 2 * r + (shape === "gong" ? 40 : 200)]; s = shape === "gong" ? `<path d="M${-r * 0.6},${-r * 0.8} L${-r * 0.3},${-r - 18} M${r * 0.6},${-r * 0.8} L${r * 0.3},${-r - 18}" stroke="#555A60" stroke-width="${r * 0.06}"/><circle r="${r}" fill="#F2F2EE" ${st(r * 0.05)}/><circle r="${r * 0.18}" fill="#E35D5B"/>` : `<rect x="${-r * 0.1}" y="${r}" width="${r * 0.2}" height="${170}" fill="#555A60"/><circle r="${r}" fill="#F2F2EE" ${st(r * 0.06)}/>`; }
    else if (shape === "stop") { const w = 300, h = 250; vb = [-w / 2 - 20, -h / 2 - 20, w + 40, h + 220]; s = `<rect x="-15" y="${h / 2}" width="30" height="190" fill="#555A60"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="#F7C948" ${st(12)}/>`; }
    else if (shape === "aps" || shape === "issf") {
      const size = shape === "aps" ? 170 : 80; vb = [-size / 2, -size / 2, size, size];
      s = `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" fill="#FFFDF6"/>`;
      if (shape === "aps") s += [[50, "#FFFFFF"], [35, "#FFFFFF"], [22, "#1F1D1B"], [11, "#1F1D1B"]].map(([d, f], i) => `<circle r="${d / 2}" fill="${f}" stroke="${i > 1 ? "#FFFFFF" : INK}" stroke-width="0.8"/>`).join("") + `<circle r="${50 / 2}" fill="none" ${st(0.8)}/>`;
      else { for (let n = 1; n <= 10; n++) { const r = 2.5 * (11 - n) + 0.25 - 2.25; s += `<circle r="${r1(Math.max(0.25, r + 2.25))}" fill="${n >= 4 ? "#1F1D1B" : "#FFFFFF"}" stroke="${n >= 4 ? "#FFFFFF" : INK}" stroke-width="0.35"/>`; } s += `<circle r="0.25" fill="#FFFFFF"/>`; }
    }
    else if (shape === "ipsc" || shape === "ns") { const w = 450, h = 570, f = shape === "ns" ? "#FAFAF6" : "#C9A66B"; vb = [-w / 2 - 20, -h / 2 - 20, w + 40, h + 700]; const oct = `M${-w / 2 + 70},${-h / 2} L${w / 2 - 70},${-h / 2} L${w / 2},${-h / 2 + 90} L${w / 2},${h / 2 - 90} L${w / 2 - 70},${h / 2} L${-w / 2 + 70},${h / 2} L${-w / 2},${h / 2 - 90} L${-w / 2},${-h / 2 + 90} Z`;
      s = `<rect x="-14" y="${h / 2}" width="28" height="660" fill="#8C6A42"/><path d="${oct}" fill="${f}" ${st(10)}/>`;
      if (shape === "ipsc") s += `<rect x="-150" y="-225" width="300" height="450" rx="6" fill="none" stroke="#7A5A30" stroke-width="5"/><rect x="-75" y="-162.5" width="150" height="325" rx="4" fill="none" stroke="#7A5A30" stroke-width="5"/><text x="0" y="-110" font-size="44" font-weight="900" text-anchor="middle" fill="#7A5A30">A</text><text x="0" y="-180" font-size="36" text-anchor="middle" fill="#7A5A30">C</text><text x="-188" y="0" font-size="36" text-anchor="middle" fill="#7A5A30">D</text>`;
      else s += `<text x="0" y="30" font-size="110" font-weight="900" text-anchor="middle" fill="#C8C4BC">NS</text>`; }
    else if (shape === "popper") { vb = [-200, -1150, 400, 1200]; s = `<path d="M-150,0 L150,0 L110,-40 L110,-760 Q110,-860 70,-880 L-70,-880 Q-110,-860 -110,-760 L-110,-40 Z" fill="#F2F2EE" ${st(12)}/><circle cx="0" cy="-990" r="110" fill="#F2F2EE" ${st(12)}/><rect x="-20" y="-890" width="40" height="30" fill="#F2F2EE"/>`; }
    else if (shape === "run") { const r = 150; vb = [-r - 60, -r - 60, 2 * r + 120, 2 * r + 120]; s = `<rect x="${-r - 50}" y="${-r - 50}" width="${2 * r + 100}" height="${2 * r + 100}" rx="10" fill="#E8D6B0" ${st(8)}/>` + Array.from({ length: 10 }, (_, i) => `<circle r="${r1(r * (1 - i / 10))}" fill="${i >= 6 ? "#E35D5B" : i % 2 ? "#FFFDF6" : "#F4E6CC"}" stroke="${INK}" stroke-width="2"/>`).join(""); }
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(r1).join(" ")}" width="${r1(Math.min(600, vb[2]))}" height="${r1(Math.min(600, vb[2]) * vb[3] / vb[2])}">${s}</svg>`, vb };
  }
  // 的の 絵の キー（有限: しゅるい × 大きさ mm。rt:round:200・rt:gong:450・rt:ipsc など）
  const tkey = (d) => "rt:" + d.shape + (d.d ? ":" + Math.round(d.d * 1000) : "");
  const VB = new Map(), vbOf = (d) => { const k = tkey(d); if (!VB.has(k)) VB.set(k, targetSvg(d.shape, d).vb); return VB.get(k); };
  // courses の まと から ぜんぶの キーと 絵を つくる（ゲームでは SvgCache に さいしょに 入れる）
  function artKeys(data) {
    const seen = new Map(), add = (d) => { const k = tkey(d); if (!seen.has(k)) seen.set(k, { key: k, make: () => targetSvg(d.shape, d).svg }); };
    for (const C of Object.values(data.courses)) {
      for (const t of C.targets || []) add(t);
      if (C.card) add({ shape: C.kind === "bull" ? "aps" : "issf", size: C.card.size });
      if (C.kind === "run") add({ shape: "run", d: C.d });
    }
    return [...seen.values()];
  }

  // 手の 絵（わんこ: しろい まえあし・がちゃん: きいろい はね・ごじ: はいいろの 手と しろい つめ）
  const HAND = {
    wanko: { fill: "#FFFFFF", arm: "#F1EEE8", shade: "#9E978D", pad: "#F4B6C2", spot: "#1F1D1B", kind: "paw" },
    gachan: { fill: "#FADA78", arm: "#F2CF68", shade: "#A88B3E", pad: "#F2C04E", kind: "wing" },
    goji: { fill: "#8C8686", arm: "#7F7979", shade: "#4A4646", fill2: "#4A4A4C", claw: "#FFFFFF", kind: "claw" },
  };
  function handSvg(who, x, y, ang, tone, side) {
    const H = HAND[who], f = who === "goji" && tone === "dark" ? H.fill2 : H.fill, a = r1(ang);
    let arm = `<path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${f}" stroke-width="40" stroke-linecap="round"/>`;
    let hand = "";
    if (H.kind === "paw") hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-8,-15 L-8,-6 M1,-16 L1,-6 M10,-14 L10,-6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9" cy="5" rx="5" ry="4" fill="${H.spot}"/>`;
    else if (H.kind === "wing") hand = `<path d="M-20,6 Q-22,-14 -2,-17 Q16,-18 22,-8 L14,-6 L20,1 L11,2 L15,9 Q0,18 -20,6 Z" fill="${f}" ${st(2)}/><path d="M-10,-4 Q0,-8 10,-6" fill="none" stroke="${H.pad}" stroke-width="2"/>`;
    else hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-12,-14 L-15,-23 L-7,-16 Z M-1,-16 L-2,-26 L5,-16 Z M10,-14 L12,-23 L16,-11 Z" fill="${H.claw}" ${st(1.4)}/>`;
    return arm + `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${hand}</g>`;
  }
  // 主観の じゅう（手つき）。viewBox 360×260 の したの ほうに おく。キーは "rg:" + gun + ":" + who + ":" + tone（9×3×2 = 有限）
  const FPV = { hand: { px: 0.95, ang: 12, at: [214, 216] }, rifle: { px: 0.37, ang: 9, at: [266, 210] }, sniper: { px: 0.34, ang: 8, at: [270, 212] } };
  function fpvSvg(gun, who, tone = "soft") {
    const F = FPV[gun.cat], P = GunArtRef.parts(gun), b = P.box, px = F.px, rad = (F.ang * Math.PI) / 180;
    const gx = (P.grip[0] - b[0]) * px, gy = (P.grip[1] - b[1]) * px;
    const tr = (pt) => { const x = (pt[0] - b[0]) * px - gx, y = (pt[1] - b[1]) * px - gy; return [F.at[0] + x * Math.cos(rad) - y * Math.sin(rad), F.at[1] + x * Math.sin(rad) + y * Math.cos(rad)]; };
    const inner = GunArtRef.svg(gun, { px, uid: "fp" + gun.id + who }).replace("<svg ", `<svg x="${r1(-gx)}" y="${r1(-gy)}" `);
    let s = "";
    if (P.fore) { const [fx, fy] = tr(P.fore); s += handSvg(who, fx, fy + 6, F.ang - 10, tone, "L"); }
    s += `<g transform="translate(${F.at[0]} ${F.at[1]}) rotate(${F.ang})">${inner}</g>`;
    if (P.fore) { const [fx, fy] = tr(P.fore); s += `<g transform="translate(${r1(fx)} ${r1(fy + 6)}) rotate(${F.ang - 10})"><path d="M-18,-6 Q0,-16 18,-8" fill="none" stroke="${INK}" stroke-width="1.6"/></g>`; }
    const [hx, hy] = tr(P.grip); s += handSvg(who, hx, hy + 4, F.ang + 20, tone, "R");
    const mz = tr(P.muzzle);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="720" height="520" overflow="hidden">${s}</svg>`, muzzle: mz };
  }
  // ---- 画面を 描く ----
  function view(g) {
    const sw = g.sway(), scope = g.gun.sight === "scope" && g.adsT > 0.5;
    // スコープは けしきが ゆれる（レティクルは まんなか）。アイアン サイトは サイトが ゆれる
    const yaw = g.aim.yaw + g.kick.x + (scope ? sw.x : 0), pitch = g.aim.pitch + g.kick.y + (scope ? sw.y : 0);
    return { yaw, pitch, ppm: g.pxPerMrad, cx: g.W / 2, cy: g.H * HC, sw, scope };
  }
  const proj = (V, x, y, z) => ({ X: V.cx + ((x / z) * 1000 - V.yaw) * V.ppm, Y: V.cy - (((y - EYE) / z) * 1000 - V.pitch) * V.ppm });
  function drawEnv(ctx, g, V) {
    const { W, H } = g, env = g.C.env, horizon = V.cy + V.pitch * V.ppm;
    if (env === "field") {
      const sky = ctx.createLinearGradient(0, 0, 0, horizon); sky.addColorStop(0, "#8FC8EC"); sky.addColorStop(1, "#DDEFF8"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Math.max(0, horizon));
      // とおくの 木と どて（80m）
      const b0 = proj(V, -60, 0, 80), b1 = proj(V, 60, 3, 80);
      ctx.fillStyle = "#7FA870"; ctx.beginPath(); ctx.moveTo(-10, horizon); for (let i = 0; i <= 24; i++) { const x = -60 + i * 5, p = proj(V, x, 4 + 2.5 * Math.sin(i * 1.7), 95); ctx.lineTo(p.X, p.Y); } ctx.lineTo(W + 10, horizon); ctx.fill();
      ctx.fillStyle = "#A68A64"; ctx.fillRect(b0.X, b1.Y, b1.X - b0.X, b0.Y - b1.Y);
      const gr = ctx.createLinearGradient(0, horizon, 0, H); gr.addColorStop(0, "#B9D49A"); gr.addColorStop(1, "#8DB86C"); ctx.fillStyle = gr; ctx.fillRect(0, horizon, W, H - horizon);
      // きょりの かんばん（ロングレンジだけ）・かぜの はた
      ctx.textAlign = "center";
      if (g.C.kind === "long") for (const d of [10, 20, 30, 40, 50, 60, 70]) { const p = proj(V, -7.5, 0.9, d), q = proj(V, -7.5, 0, d), s = Math.max(6, (1.2 / d) * 1000 * V.ppm * 0.4); ctx.fillStyle = "#FFFDF6"; ctx.fillRect(p.X - s, p.Y - s * 0.6, s * 2, s * 1.2); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(p.X - s, p.Y - s * 0.6, s * 2, s * 1.2); ctx.beginPath(); ctx.moveTo(p.X, p.Y + s * 0.6); ctx.lineTo(q.X, q.Y); ctx.stroke(); ctx.fillStyle = INK; ctx.font = `900 ${Math.max(6, s * 0.8)}px 'M PLUS Rounded 1c', sans-serif`; ctx.fillText(d + "m", p.X, p.Y + s * 0.3); }
      for (const d of [20, 45, 65]) { const p = proj(V, 8, 3, d), q = proj(V, 8, 0, d), L = Math.max(8, (1.2 / d) * 1000 * V.ppm); ctx.strokeStyle = "#6E747C"; ctx.lineWidth = Math.max(1, L * 0.06); ctx.beginPath(); ctx.moveTo(q.X, q.Y); ctx.lineTo(p.X, p.Y); ctx.stroke(); const ang = Math.max(-1.2, Math.min(1.2, g.wind * 1.1)), fl = Math.sin(g.t * 6 + d) * 0.12; ctx.fillStyle = "#F29A1F"; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(p.X + Math.sin(ang) * L, p.Y + (1 - Math.cos(ang)) * L * 0.6 + L * 0.35 + fl * L); ctx.lineTo(p.X, p.Y + L * 0.5); ctx.fill(); }
      return;
    }
    // なかの レンジ（indoor: コンクリートの かべ・天井の バッフル・おくの たまどめ／hall: 10m の きょうぎ場）
    const hall = env === "hall", zb = hall ? 11 : 26, quad = (pts, fill, line) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke(); } };
    ctx.fillStyle = hall ? "#EFEDE6" : "#44474C"; ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = hall ? "#C9B79A" : "#8A857E"; ctx.fillRect(0, horizon, W, H - horizon);
    // おくの たまどめ（ゴムの つぶ。したは すな）
    const bl = proj(V, -6, 0, zb), br = proj(V, 6, 3.2, zb);
    ctx.fillStyle = hall ? "#D8D2C4" : "#3F3A35"; ctx.fillRect(bl.X, br.Y, br.X - bl.X, bl.Y - br.Y);
    if (!hall) { const t = proj(V, -6, 0.5, zb); ctx.fillStyle = "#6E6152"; ctx.fillRect(bl.X, t.Y, br.X - bl.X, bl.Y - t.Y); }
    // よこの かべ（コンクリートの パネル・2m ごとの つなぎめ）
    for (const s of [-1, 1]) {
      quad([proj(V, s * 6, 0, 1.2), proj(V, s * 6, 3.2, 1.2), proj(V, s * 6, 3.2, zb), proj(V, s * 6, 0, zb)], hall ? "#E6E4DE" : "#B4B6B2", INK);
      ctx.strokeStyle = hall ? "#CFCBC2" : "#96989A"; ctx.lineWidth = 1;
      for (let z = 2; z < zb; z += 2) { const p = proj(V, s * 6, 0, z), q = proj(V, s * 6, 3.2, z); ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
    }
    // ゆかの きょり
    ctx.strokeStyle = hall ? "#B8A888" : "#A59F96"; ctx.lineWidth = 1.2; ctx.font = "900 10px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    for (let z = 2; z < zb; z += hall ? 2 : 5) { const a = proj(V, -6, 0, z), b = proj(V, 6, 0, z); ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke(); if (z % 5 === 0) { const m = proj(V, 0, 0, z); ctx.fillStyle = "#FFFDF6"; ctx.fillText(z + "m", m.X, m.Y - 2); } }
    // 天井の バッフル（ななめの いた。とびだした たまを とめる）と あかり
    if (!hall) for (let z = 3; z < zb; z += 5) quad([proj(V, -6, 3.2, z), proj(V, 6, 3.2, z), proj(V, 6, 2.8, z + 0.5), proj(V, -6, 2.8, z + 0.5)], "#57514A", INK);
    if (!hall) for (let z = 3; z < zb; z += 5) { const a = proj(V, -1.2, 2.8, z + 0.5), b = proj(V, 1.2, 2.8, z + 0.5); ctx.fillStyle = "#FFF3C4"; ctx.fillRect(a.X, a.Y - 2, b.X - a.X, 3); }
    // 10m の まとの ささえ
    if (hall) { const c = g.C.card, p = proj(V, c.x, 0, c.z), q = proj(V, c.x, c.y - c.size / 2, c.z); ctx.strokeStyle = "#8C9196"; ctx.lineWidth = Math.max(1, (0.02 / c.z) * 1000 * V.ppm); ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
  }
  function drawTargets(ctx, g, V, art) {
    const order = [...g.targets].filter((t) => t.active || t.def.wait).sort((a, c) => c.def.z - a.def.z);
    for (const tg of order) {
      if (!tg.active) continue;
      const p = g.posOf(tg, g.t), d = tg.def, z = p.z, im = art.img(tkey(d)); if (!im) continue;
      const vb = vbOf(d), k = (0.001 / z) * 1000 * V.ppm; // 1mm の 画面 px
      let cy = p.y; if (tg.shape === "ipsc" || tg.shape === "ns") cy = SHAPE.ipsc.cy; if (tg.shape === "popper") cy = 0;
      const c = proj(V, p.x, cy, z);
      ctx.save(); ctx.translate(c.X, c.Y);
      if (tg.shape === "popper" && tg.down) ctx.scale(1, Math.max(0.06, Math.cos((tg.fall || 0) * Math.PI * 0.48))); // うしろに たおれる
      if (d.shape === "gong" && tg.swingA) ctx.rotate(Math.sin((g.t - tg.hitT) * 9) * 0.12 * tg.swingA);
      if (d.shape === "round" && tg.hitT && g.t - tg.hitT < 0.4) ctx.rotate(Math.sin((g.t - tg.hitT) * 30) * 0.05);
      ctx.drawImage(im, vb[0] * k, vb[1] * k, vb[2] * k, vb[3] * k);
      if (g.C.kind === "long" && tg === g.targets[g.cur] && g.phase !== "end") { const s = Math.max(5, 0.12 * 1000 * k), top = vb[1] * k - s * 0.4; ctx.fillStyle = "#F29A1F"; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.5, top - s); ctx.lineTo(s * 0.5, top - s); ctx.lineTo(0, top); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // あたった あと（スチールは ぬりが はげた しろい 点・かみは あな）
      for (const [mx, my] of tg.marks) { ctx.fillStyle = tg.shape === "ipsc" || tg.shape === "ns" || tg.shape === "aps" || tg.shape === "issf" || tg.shape === "run" ? "#1F1D1B" : "#8A8E94"; ctx.beginPath(); ctx.arc(mx * 1000 * k, -my * 1000 * k, Math.max(1.2, 3 * k), 0, 7); ctx.fill(); }
      ctx.restore();
    }
    // ランニング ターゲットの まど: 左右の めかくしの かべ（まどの そとの 的は 見えない・うてない）
    if (g.C.kind === "run") { const C = g.C, zs = C.z - RUN_SCREEN; for (const s of [-1, 1]) { const x0 = (s * C.window) / 2, x1 = s * (C.window / 2 + 8), a = proj(V, x0, 0, zs), b = proj(V, x1, 2.2, zs); ctx.fillStyle = "#9C8466"; ctx.fillRect(Math.min(a.X, b.X), b.Y, Math.abs(b.X - a.X), a.Y - b.Y); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(Math.min(a.X, b.X), b.Y, Math.abs(b.X - a.X), a.Y - b.Y); ctx.fillStyle = "#B59C7C"; const t = proj(V, x0, 2.2, zs), m = proj(V, x1, 2.05, zs); ctx.fillRect(Math.min(t.X, m.X), t.Y, Math.abs(m.X - t.X), Math.max(2, m.Y - t.Y)); } }
    for (const f of g.fx) if (f.kind === "puff") { const p = proj(V, f.x, f.y, f.z), k = f.t / f.life, r = Math.max(2, (0.12 / f.z) * 1000 * V.ppm) * (0.6 + k); ctx.fillStyle = `rgba(200,180,140,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.arc(p.X, p.Y, r, 0, 7); ctx.fill(); }
  }
  // のぞいた ときの 手（ハンドガンを りょう手で にぎる。うでは 画面の したの すみへ）
  function drawHandsAds(ctx, g, x, y, u) {
    const Hd = HAND[g.who] || HAND.wanko, f = Hd.fill, H = g.H;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // うでは 目に ちかくて くらい（したへ いくほど かげ）
    for (const [sx, sy, ex] of [[-12, 80, -210], [12, 86, 220]]) {
      const hx = x + sx * u, hy = y + sy * u, bx = x + ex * u, by = H + 30 * u, L = Math.hypot(bx - hx, by - hy), nx = -(by - hy) / L, ny = (bx - hx) / L, hw = 15 * u, bw = 56 * u;
      const gr = ctx.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, Hd.arm || f); gr.addColorStop(1, Hd.shade || "#8C857C");
      ctx.beginPath(); ctx.moveTo(hx + nx * hw, hy + ny * hw); ctx.quadraticCurveTo((hx + bx) / 2 + nx * bw * 0.9, (hy + by) / 2 + ny * bw * 0.9, bx + nx * bw, by + ny * bw); ctx.lineTo(bx - nx * bw, by - ny * bw); ctx.quadraticCurveTo((hx + bx) / 2 - nx * bw * 0.7, (hy + by) / 2 - ny * bw * 0.7, hx - nx * hw, hy - ny * hw); ctx.closePath();
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8 * u; ctx.stroke();
    }
    ctx.fillStyle = f; ctx.strokeStyle = INK; ctx.lineWidth = 1.8 * u;
    ctx.beginPath(); ctx.ellipse(x + 9 * u, y + 70 * u, 25 * u, 19 * u, 0.25, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 9 * u, y + 76 * u, 25 * u, 19 * u, -0.3, 0, 7); ctx.fill(); ctx.stroke();
    if (Hd.kind === "paw") { ctx.fillStyle = Hd.spot; ctx.beginPath(); ctx.ellipse(x + 17 * u, y + 64 * u, 5 * u, 4 * u, 0, 0, 7); ctx.fill(); }
    if (Hd.kind === "wing") { ctx.strokeStyle = Hd.pad; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(x - 24 * u, y + 76 * u); ctx.quadraticCurveTo(x - 8 * u, y + 68 * u, x + 8 * u, y + 76 * u); ctx.stroke(); }
    if (Hd.kind === "claw") { ctx.fillStyle = Hd.claw; ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * u; for (const dx of [-26, -15, -4]) { ctx.beginPath(); ctx.moveTo(x + dx * u, y + 64 * u); ctx.lineTo(x + (dx - 3) * u, y + 55 * u); ctx.lineTo(x + (dx + 5) * u, y + 62 * u); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
  }
  // サイト（のぞいた ときの 見え方）。ねらう 点は (cx + ゆれ, cy)。アイアン サイトは まえの サイトの うえが ねらう 点
  function drawSight(ctx, g, V) {
    const { W, H } = g, a = g.adsT, s = g.gun.sight, x = V.cx + V.sw.x * V.ppm, y = V.cy - V.sw.y * V.ppm, u = W / 360;
    // かどの まるい しかく（古い Safari にも ある arcTo で 描く）
    const rr = (x0, y0, w, h, r, fill) => { ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, r); ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, r); ctx.arcTo(x0, y0 + h, x0, y0, r); ctx.arcTo(x0, y0, x0 + w, y0, r); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * u; ctx.stroke(); };
    if (s === "scope") {
      const r = W * 0.47; ctx.save(); ctx.fillStyle = "#0E1014"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(V.cx, V.cy, r, 0, Math.PI * 2, true); ctx.fill("evenodd");
      const vg = ctx.createRadialGradient(V.cx, V.cy, r * 0.8, V.cx, V.cy, r); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)"); ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(V.cx, V.cy, r, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(V.cx - r, V.cy); ctx.lineTo(V.cx + r, V.cy); ctx.moveTo(V.cx, V.cy - r); ctx.lineTo(V.cx, V.cy + r); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(V.cx - r, V.cy); ctx.lineTo(V.cx - r * 0.55, V.cy); ctx.moveTo(V.cx + r * 0.55, V.cy); ctx.lineTo(V.cx + r, V.cy); ctx.moveTo(V.cx, V.cy + r * 0.55); ctx.lineTo(V.cx, V.cy + r); ctx.stroke();
      // 1mrad ごとの めもり（5mrad ごとに 大きく）。ばいりつで 大きさが かわる（ファースト フォーカル プレーン）
      const step = V.ppm, every = step < 4 ? 2 : 1; ctx.fillStyle = INK;
      for (let i = -10; i <= 10; i++) { if (!i || i % every) continue; const L = i % 5 ? 3 : 6; if (Math.abs(i * step) > r * 0.55) continue; ctx.fillRect(V.cx + i * step - 0.6, V.cy - L, 1.2, L * 2); ctx.fillRect(V.cx - L, V.cy + i * step - 0.6, L * 2, 1.2); }
      ctx.beginPath(); ctx.arc(V.cx, V.cy, 1.6, 0, 7); ctx.fillStyle = "#E35D5B"; ctx.fill();
      ctx.restore(); return;
    }
    ctx.save(); ctx.globalAlpha = a;
    if (s === "diopter") {
      // うしろの ダイオプター（くらい まど）と まえの リング
      const r = W * 0.36; ctx.fillStyle = "rgba(10,10,12,0.92)"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, r, 0, Math.PI * 2, true); ctx.fill("evenodd");
      ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(x, y, 3.4 * V.ppm, 0, 7); ctx.stroke(); ctx.lineWidth = 1 * u; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(x, y, 3.4 * V.ppm + 2.5 * u, 0, 7); ctx.stroke();
    } else if (s === "peep") {
      // まえの サイト: ポスト・まもりの みみ・さんかくの だい（その したは ハンドガード）
      ctx.fillStyle = "#23262B"; ctx.fillRect(x - 1.5 * u, y, 3 * u, 22 * u);
      for (const sx of [-1, 1]) ctx.fillRect(x + sx * 9 * u - 1.5 * u, y + 4 * u, 3 * u, 18 * u);
      ctx.beginPath(); ctx.moveTo(x - 11 * u, y + 20 * u); ctx.lineTo(x + 11 * u, y + 20 * u); ctx.lineTo(x + 20 * u, y + 46 * u); ctx.lineTo(x - 20 * u, y + 46 * u); ctx.closePath(); ctx.fill();
      rr(x - 26 * u, y + 46 * u, 52 * u, 34 * u, 5 * u, "#3E434B");
      // うしろの あな（目の すぐ まえで ぼやけた わっか）
      const r0 = 32 * u, r1 = 76 * u, rg = ctx.createRadialGradient(x, y, r0, x, y, r1); rg.addColorStop(0, "rgba(18,18,20,0)"); rg.addColorStop(0.2, "rgba(18,18,20,0.9)"); rg.addColorStop(0.75, "rgba(18,18,20,0.9)"); rg.addColorStop(1, "rgba(18,18,20,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI * 2); ctx.moveTo(x + r0, y); ctx.arc(x, y, r0, 0, Math.PI * 2, true); ctx.fill("evenodd");
    } else if (s === "buckhorn") {
      // まえの サイト（きんいろの ビード）と バレル
      ctx.fillStyle = "#1F1D1B"; ctx.fillRect(x - 1.2 * u, y + 4 * u, 2.4 * u, 20 * u);
      ctx.beginPath(); ctx.arc(x, y + 2.6 * u, 2.6 * u, 0, 7); ctx.fillStyle = "#E8C070"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8 * u; ctx.stroke();
      const bg = ctx.createLinearGradient(0, y + 20 * u, 0, y + 150 * u); bg.addColorStop(0, "rgba(58,64,82,1)"); bg.addColorStop(1, "rgba(58,64,82,0)");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(x - 4 * u, y + 22 * u); ctx.lineTo(x + 4 * u, y + 22 * u); ctx.lineTo(x + 14 * u, y + 150 * u); ctx.lineTo(x - 14 * u, y + 150 * u); ctx.closePath(); ctx.fill();
      // うしろの バックホーン（V の そこに ビードを のせる）
      const ry = y + 3 * u; ctx.fillStyle = "#1F1D1B"; ctx.beginPath();
      ctx.moveTo(x - 62 * u, ry - 16 * u); ctx.quadraticCurveTo(x - 22 * u, ry + 1 * u, x - 6 * u, ry + 4 * u); ctx.lineTo(x, ry + 10 * u); ctx.lineTo(x + 6 * u, ry + 4 * u); ctx.quadraticCurveTo(x + 22 * u, ry + 1 * u, x + 62 * u, ry - 16 * u); ctx.lineTo(x + 58 * u, ry + 18 * u); ctx.lineTo(x - 58 * u, ry + 18 * u); ctx.closePath(); ctx.fill();
    } else {
      // ハンドガン（notch3 / notch / ramp）: まえの ポスト → うしろの サイト（U の みぞ）→ スライドの うしろ（リボルバーは シリンダー）→ りょう手
      const fw = s === "notch" ? 2.2 * u : 2.8 * u, nw = fw + 2.8 * u, nd = 9 * u, ry = y;
      ctx.fillStyle = s === "ramp" ? "#E35D5B" : "#1F1D1B"; ctx.fillRect(x - fw, ry, fw * 2, 16 * u);
      if (s === "notch3") { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(x, ry + 3.2 * u, 1.7 * u, 0, 7); ctx.fill(); }
      rr(x - 16 * u, ry + 40 * u, 32 * u, 30 * u, 4 * u, s === "ramp" ? "#A9B0BA" : "#3E434B");
      drawHandsAds(ctx, g, x, ry, u);
      if (s === "ramp") { rr(x - 30 * u, ry + 12 * u, 60 * u, 30 * u, 8 * u, "#CDD2DA"); ctx.strokeStyle = "#A9B0BA"; ctx.lineWidth = 2 * u; for (const sx of [-15, 0, 15]) { ctx.beginPath(); ctx.moveTo(x + sx * u, ry + 16 * u); ctx.lineTo(x + sx * u, ry + 38 * u); ctx.stroke(); } }
      else { rr(x - 22 * u, ry + 10 * u, 44 * u, 34 * u, 5 * u, s === "notch" ? "#2C3140" : "#2F333A"); ctx.strokeStyle = "#1B1E23"; ctx.lineWidth = 1 * u; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5 * u, ry + 20 * u); ctx.lineTo(x + i * 5 * u, ry + 38 * u); ctx.stroke(); } }
      ctx.fillStyle = s === "ramp" ? "#8E959E" : "#1F1D1B"; ctx.beginPath();
      ctx.moveTo(x - 25 * u, ry); ctx.lineTo(x - nw, ry); ctx.lineTo(x - nw, ry + nd); ctx.lineTo(x + nw, ry + nd); ctx.lineTo(x + nw, ry); ctx.lineTo(x + 25 * u, ry); ctx.lineTo(x + 25 * u, ry + 13 * u); ctx.lineTo(x - 25 * u, ry + 13 * u); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1 * u; ctx.stroke();
      if (s === "notch3") { ctx.fillStyle = "#FFFFFF"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * (nw + 5 * u), ry + 4.5 * u, 1.7 * u, 0, 7); ctx.fill(); } }
    }
    ctx.restore();
  }
  function draw(ctx, g, art) {
    const V = view(g), { W, H } = g;
    ctx.save(); drawEnv(ctx, g, V); drawTargets(ctx, g, V, art);
    // ヒットの 数字
    ctx.restore();
    if (g.adsT > 0.05) drawSight(ctx, g, V);
    if (g.adsT < 0.95) {
      // のぞかない ときの ねらいの しるしと 主観の じゅう
      const k = 1 - g.adsT, low = g.phase === "standby" || g.phase === "between"; ctx.save(); ctx.globalAlpha = k; const x = V.cx, y = V.cy;
      if (!low) { ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); ctx.strokeStyle = "#E35D5B"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); }
      // 主観の じゅう（スタンバイは さげて もつ・ブザーの あと もちあげる・ボルトや リロードの あいだは すこし さがる）
      const im = art.img("fpv"); if (im) { const h = (W * 260) / 360, kick = Math.min(1, Math.abs(g.kick.y) / 10); ctx.drawImage(im, kick * 6, H - h + kick * 12 + (g.busy ? 26 : 0) + (low ? 80 : g.raise > 0 ? 80 * (g.raise / 0.35) : 0), W, h); }
      ctx.restore();
    }
  }
  // 町の 建物の 外がわ（town-renewal-art.js の facades と 同じ 200×160 の デザイン。入口は つつむ 関数が まんなか したに 描く）
  //   コンクリートの かべ・あかい ライン・まとの マーク・シャッター（ひだり）・まど（みぎ）・「シューティング レンジ」
  function facade200() {
    const R = (x, y, w, h, c, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" ${st(1.7)}/>`;
    const P = (d, c = "none", sw = 1.7) => `<path d="${d}" fill="${c}" ${st(sw)}/>`;
    const C = (x, y, z, col) => `<circle cx="${x}" cy="${y}" r="${z}" fill="${col}" ${st(1.5)}/>`;
    const glass = (x, y, w, h) => R(x, y, w, h, "#B8DADF") + P(`M${x + 4},${y + h - 5} L${x + w - 4},${y + 5}`, "none", 1);
    let s = R(8, 50, 184, 102, "#D3D6D6", 3) + P("M2,52 L26,24 H174 L198,52 Z", "#8D9AA5") + R(8, 50, 184, 8, "#C96A64", 0);
    s += [13, 9.5, 6, 2.6].map((z, i) => C(100, 38, z, ["#FFF6DF", "#D9776F", "#FFF6DF", "#D9776F"][i])).join("");
    s += R(18, 96, 56, 54, "#B9C0C6") + Array.from({ length: 8 }, (_, i) => P(`M20,${101 + i * 6} H72`, "none", 0.7)).join("") + R(14, 90, 64, 7, "#8D9AA5");
    s += glass(132, 92, 50, 34) + P("M132,109 H182", "none", 1) + [0, 1, 2].map((i) => C(146 + i * 11, 138, 3.2, ["#D9776F", "#FFF6DF", "#D9776F"][i])).join("");
    s += R(40, 64, 120, 21, "#FFF6DF", 5) + `<text x="100" y="78.5" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="${INK}">シューティング レンジ</text>`;
    return s;
  }
  return { rng, ballistics, flight, drift, hopAt, FOV, SHAPE, EYE, Game, bot, SKILL, draw, view, proj, targetSvg, tkey, artKeys, handSvg, fpvSvg, FPV, facade200 };
})();
if (typeof module !== "undefined") module.exports = RangeRef;
