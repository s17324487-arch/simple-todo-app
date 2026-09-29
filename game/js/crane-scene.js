// クレーンゲームの 画面（SCENES.prize）と PrizeArcade（100コイン・つづきから・ごほうび）。
// 台の なかは 3D の 物理（CraneMachines）。ここでは カメラで うつして、筐体・アーム・景品を 描く。まえ と よこ の 2つの カメラ。
const PrizeArcade = {
  // 12台（台の 番号は CraneMachines.DEFS・館の 什器 machine と おなじ）。qty: 1こ とれた ときに もらえる かず・coins: 1こ とれた ときの コイン
  // prize は 台の だいひょうの 景品（まぜて ある 台は 形ごとの 景品 CraneMachines.SHAPES[...].prize を わたす）
  machines: [
    { id: "chibi-wanko", type: "claw", name: "わんこの ぬいぐるみ", label: "わんこ ぬいぐるみ", prize: "ike_chibi_wanko_0", mix: 4, qty: 1 },
    { id: "goji-big", type: "claw", name: "ごじの おおきな ぬいぐるみ", label: "ごじ おおきな", prize: "ike_prize_1", qty: 1, legacy: true },
    { id: "mini", type: "sweet", name: "スウィートランド・ミニマスコット", label: "ミニマスコット", prize: "ike_mini_wanko", mix: 3, qty: 1 },
    { id: "medal", type: "sweet", name: "スウィートランド・コインメダル", label: "コイン メダル", coins: 20, qty: 1 },
    { id: "wanko-big", type: "tripod", name: "トライポッド・わんこ", label: "わんこ トライポッド", prize: "ike_prize_3", qty: 1, legacy: true },
    { id: "panda-big", type: "tripod", name: "トライポッド・パンダ", label: "パンダ トライポッド", prize: "ike_plush_panda", qty: 1 },
    { id: "gachan-ring", type: "ring", name: "リングフック・がちゃん", label: "がちゃん リング", prize: "ike_prize_4", qty: 1, legacy: true },
    { id: "coin-chest", type: "ring", name: "リングフック・たからばこ", label: "コイン たからばこ", coins: 300, qty: 1 },
    { id: "chibi-gachan", type: "claw", name: "がちゃんの ぬいぐるみ", label: "がちゃん ぬいぐるみ", prize: "ike_chibi_gachan_0", mix: 4, qty: 1 },
    { id: "chibi-goji", type: "claw", name: "ごじの ぬいぐるみ", label: "ごじ ぬいぐるみ", prize: "ike_chibi_goji_0", mix: 4, qty: 1 },
    { id: "bear-big", type: "claw", name: "くまの おおきな ぬいぐるみ", label: "くま おおきな", prize: "ike_plush_bear", qty: 1 },
    { id: "penguin-ring", type: "ring", name: "リングフック・ぺんぎん", label: "ぺんぎん リング", prize: "ike_plush_penguin", qty: 1 },
  ],
  PRICE: 100,
  rules: {
    claw: "やじるしで アームを うごかして「つかむ」。アームが おりて つかんで、おとしぐちまで はこぶよ。アームの つよさは まいかい ちがうよ。はずれが つづくと つよく なるよ。",
    ring: "リングの まえに アームを あわせて「つかむ」。フックが リングに はいると もちあがるよ。よこから みる「カメラ」で おくゆきを たしかめよう。",
    sweet: "ショベルが うごいて いる ときに「すくう」。つぎに「おとす」で ステージに おとそう。おしだしで てまえから おちた おかしが もらえるよ。1かいで 3ど すくえるよ。",
    tripod: "ひかりが アームの ところで「とめる」と、その アームが おちるよ。アームが へると けいひんが あなに おちるよ。1かいで 3ど とめられるよ。おちた アームは つぎも そのままだよ。",
  },
  // ふるい セーブにも 台の ようす・はずれの かずを たす
  norm() { const a = Save.d.arcade || (Save.d.arcade = { active: null, settled: null, plays: 0, wins: 0 }); if (!a.boards || typeof a.boards !== "object") a.boards = {}; if (!a.miss || typeof a.miss !== "object") a.miss = {}; if (!a.got || typeof a.got !== "object") a.got = {}; this.upgrade(a); return a; },
  // 台を 12台に いれかえる まえの とちゅうの 1かい: おなじ 台（legacy）なら つづきから、いれかわった 台なら 100コインを かえす
  upgrade(a) {
    const run = a.active; if (!run || run.def) return;
    const m = this.machines[run.machine];
    if (m && m.legacy) { run.def = m.id; return; }
    a.active = null; a.refunded = (a.refunded || 0) + 1; Save.d.coins += this.PRICE; Save.write();
  },
  // とれた 景品（形ごと）→ [{ id, n } | { coins }]。ふるい とちゅうの 1かい（形が ない）は 台の だいひょうの 景品
  prizesOf(machine, round) {
    const m = this.machines[machine], got = (round && round.got) || [], shapes = (round && round.gotShapes) || [], out = new Map();
    if (m.coins) return got.length ? [{ coins: got.length * m.coins * m.qty }] : [];
    got.forEach((_, k) => { const sh = shapes[k], S = sh && CraneMachines.SHAPES[sh], id = (S && S().prize) || m.prize; out.set(id, (out.get(id) || 0) + m.qty); });
    return [...out].map(([id, n]) => ({ id, n }));
  },
  // 台の 景品の 一覧（まぜて ある 台は ぜんぶの しゅるい）
  prizeList(machine) {
    const d = CraneMachines.DEFS[machine], m = this.machines[machine], shapes = d.fill && d.fill.mix ? d.fill.mix : Array.isArray(d.sweet) ? d.sweet : [];
    const ids = shapes.map((sh) => CraneMachines.SHAPES[sh]().prize).filter(Boolean);
    return ids.length ? ids : m.prize ? [m.prize] : [];
  },
  // コインの 台は 1にちの 上限（ArcadePrizes.COIN_DAY_MAX）まで。1こぶんの コインが のこって いれば あそべる
  coinOpen(machine) { const m = this.machines[machine]; return !m.coins || ArcadePrizes.coinLeft() >= m.coins * m.qty; },
  item(id) { return FURN_INDEX[id] || BAG_INDEX[id] || ITEM_INDEX[id] || { name: id }; },
  // とれた 景品の 絵（はじめの 1つ。コインは "coin"）と その SVG（とりだしぐち・けっかの まど）
  picture(machine, round) { const p = this.prizesOf(machine, round)[0]; return !p ? this.machines[machine].prize || "coin" : p.coins ? "coin" : p.id; },
  pictureSvg(id) { return id === "coin" ? CraneArt.coinSvg() : FURN_INDEX[id] ? Art.furnSvg(id) : Art.iconSvg("bag", id); },
  // アームが つよい かくりつ（はずれが 4かい つづくと かならず つよい）
  chance(machine) { const n = this.norm().miss[machine] || 0; return n >= 4 ? 1 : [0.34, 0.45, 0.58, 0.72][n]; },
  async open(machine, back) {
    const m = this.machines[machine]; if (!m) return;
    const a = this.norm();
    if (a.active) { const yes = await UI.confirm("とちゅうの クレーンが あるよ。おかねを はらわずに つづける？", "つづける", "やめる"); if (yes) Game.goto("prize", { run: a.active }); return; }
    if (a.refunded) { UI.toast("台が あたらしく なったので、とちゅうだった 1かいの " + this.PRICE + "コインを かえしたよ"); a.refunded = 0; Save.write(); }
    if (!this.coinOpen(machine)) { await UI.say([{ name: "Meeときょれじゃ", text: "きょうの コインの けいひんは おしまい。\nまた あした あそびに きてね！" }]); return; }
    const each = m.type === "sweet" ? "（おちた ぶんだけ）" : "", prize = m.coins ? `コイン ${m.coins}${m.type === "sweet" ? "（1まい）" : ""} ${each}` : m.mix ? `${this.item(m.prize).name.replace(/^\S+ /, "")}（${m.mix}しゅるい）${each}` : this.item(m.prize).name + " " + (each || "×" + m.qty);
    const cap = m.coins ? `\nコインの けいひんは 1にち ${ArcadePrizes.COIN_DAY_MAX}コイン まで（きょう のこり ${ArcadePrizes.coinLeft()}）。` : "";
    if (!(await UI.confirm(m.name + "\n" + this.rules[m.type] + "\nけいひん：" + prize + cap + "\n1かい " + this.PRICE + "コイン。とれない ことも あるよ。", this.PRICE + "コインで あそぶ", "やめる"))) return;
    const run = this.start(machine, back);
    if (run) Game.goto("prize", { run }); else UI.toast("コインが たりないか、セーブできなかったよ");
  },
  // 100コインを はらって はじめる（セーブに のこせた ときだけ）
  start(machine, back) {
    const a = this.norm();
    if (a.active || !this.machines[machine] || Save.d.coins < this.PRICE || !this.coinOpen(machine)) return null;
    const m = this.machines[machine], strong = m.type === "claw" ? Math.random() < this.chance(machine) : true;
    const run = { id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2), machine, def: m.id, back, strong, cp: null };
    const coins = Save.d.coins; Save.d.coins -= this.PRICE; a.active = run; Save.write();
    try { if (JSON.parse(localStorage.getItem(Save.KEY))?.arcade?.active?.id === run.id) return run; } catch (e) {}
    Save.d.coins = coins; a.active = null; Save.mark(); return null;
  },
  // おわり: けいひんを わたす・台の ようすを のこす（1かいだけ）
  finish(run, round) {
    const a = this.norm();
    if (!run || a.active?.id !== run.id || a.settled === run.id) return false;
    const m = this.machines[run.machine], got = (round && round.got) || [], n = got.length * m.qty;
    for (const p of this.prizesOf(run.machine, round)) {
      if (p.coins) { Save.d.coins += p.coins; const c = ArcadePrizes.coinState(); c.coinToday = (c.coinToday || 0) + p.coins; }
      else if (FURN_INDEX[p.id]) Save.d.furn[p.id] = (Save.d.furn[p.id] || 0) + p.n; else Save.addBag(p.id, p.n);
    }
    if (n > 0) { a.wins++; a.got[run.machine] = (a.got[run.machine] || 0) + n; }
    if (m.type === "claw") a.miss[run.machine] = got.length ? 0 : Math.min(4, (a.miss[run.machine] || 0) + 1);
    if (round && round.board) a.boards[run.machine] = round.board();
    a.plays++; a.settled = run.id; a.active = null; Save.write(); return true;
  },
};

// ---- カメラ（ピンホール）----
class CraneCam {
  constructor(def, mode) { this.def = def; this.mode = mode; this.f = 1; this.cx = 0; this.cy = 0; this.aim(); }
  // まっすぐ まえ（または よこ）を むく カメラ。たての せんは たてのまま（シフトレンズ）。目の たかさは 台の 上の ほう
  aim() {
    const M = this.def.box, side = this.mode === "side", dist = 1.12 * Math.max(M.w, M.d);
    this.eye = side ? [M.w + dist, M.h * 0.8, M.d * 0.5] : [M.w * 0.5, M.h * 0.8, -dist];
    this.fw = side ? [-1, 0, 0] : [0, 0, 1]; this.rt = side ? [0, 0, 1] : [1, 0, 0]; this.up = [0, 1, 0];
  }
  raw(x, y, z) { const d = [x - this.eye[0], y - this.eye[1], z - this.eye[2]], zc = d[0] * this.fw[0] + d[1] * this.fw[1] + d[2] * this.fw[2]; return [(d[0] * this.rt[0] + d[1] * this.rt[1] + d[2] * this.rt[2]) / zc, (d[0] * this.up[0] + d[1] * this.up[1] + d[2] * this.up[2]) / zc, zc]; }
  // ガラスの 面と わく（はしら・かんばん・したの パネル）が rect に おさまる ように
  fit(rect) {
    const M = this.def.box, pts = [];
    for (const u of [-6, (this.mode === "side" ? M.d : M.w) + 6]) for (const v of [-12, M.h + 12]) pts.push(this.mode === "side" ? this.raw(M.w, v, u) : this.raw(u, v, 0));
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const [u, v] of pts) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    this.f = Math.min(rect.w / (u1 - u0), rect.h / (v1 - v0));
    // 上に よせる（あいた ところは 下。3にんが たつ）
    this.cx = rect.x + rect.w / 2 - (this.f * (u0 + u1)) / 2; this.cy = rect.y + this.f * v1;
    this.bottom = rect.y + this.f * (v1 - v0);
  }
  p(x, y, z) { const [u, v, d] = this.raw(x, y, z); return [this.cx + this.f * u, this.cy - this.f * v, d]; }
  // world の 長さ → 画面の 長さ（その ふかさで）
  s(len, d) { return (len * this.f) / d; }
}

class CraneScene {
  async enter(p) {
    const a = PrizeArcade.norm();
    this.run = p.run; this.i = this.run.machine; this.m = PrizeArcade.machines[this.i]; this.def = CraneMachines.DEFS[this.i]; this.th = CraneArt.THEME[this.def.theme];
    this.closed = false; this.hold = {}; this.fx = []; this.clock = 0; this.saveT = 0; this.gotShown = 0; this.finished = false; this.speed = 1; this.cheer = 0; this.sad = 0; this.flash = 0;
    const cp = this.run.cp && this.run.cp.board ? this.run.cp : null, board = cp ? cp.board : a.boards[this.i] || null;
    this.round = new CraneMachines.CraneRound(this.i, board, { strong: this.run.strong !== false, cp });
    this.camMode = "front"; this.cam = new CraneCam(this.def, "front"); this.cams = { front: this.cam, side: new CraneCam(this.def, "side") };
    UI.showHud(true, "Meeときょれじゃ"); Sound.bgm("arcade_hall");
    this.buildUI(); this.resize();
    if (!this.run.cp) this.checkpoint();
    const keys = this.texKeys();
    await Promise.all([CraneArt.ensureAll(keys), Chara.preload(Save.d.order.flatMap((id) => ["up", "down"].flatMap((dir) => ["normal", "happy", "sad"].map((face) => [id, { pose: "idle_01", dir, face, outfit: Save.d.chars[id].outfit, color: Save.d.chars[id].color }]))), 42)]);
  }
  texKeys() {
    const k = [this.th.wall, this.th.floor], looks = new Set(this.round.list().map((b) => b.data.look));
    const shapes = [...(this.def.fill ? this.def.fill.mix || [this.def.fill.shape] : []), ...[].concat(this.def.sweet || []), ...(this.def.prize ? [this.def.prize] : [])];
    for (const sh of shapes) looks.add(CraneMachines.SHAPES[sh]().look);
    for (const l of looks) for (const key of Object.keys(CraneArt.TEX)) if (key.startsWith(l + "-")) k.push(key);
    return k;
  }
  // ---- ボタン ----
  buildUI() {
    const P = (this.panel = U.el("div", { class: "crane-panel" })), t = this.round.type;
    this.status = U.el("div", { class: "crane-status" });
    const row = U.el("div", { class: "crane-row" });
    this.pad = U.el("div", { class: "crane-pad" + (t === "claw" || t === "ring" ? "" : " hidden") });
    for (const [dir, label, gx, gy, name] of [["up", "▲", 2, 1, "おく"], ["left", "◀", 1, 2, "ひだり"], ["right", "▶", 3, 2, "みぎ"], ["down", "▼", 2, 3, "てまえ"]]) {
      const b = U.el("button", { class: "crane-dir", html: label, "aria-label": name });
      b.style.gridColumn = gx; b.style.gridRow = gy;
      let downAt = 0, heldFor = 0;
      const on = (e) => { e.preventDefault(); this.hold[dir] = true; downAt = performance.now(); try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add("on"); Sound.se("tap"); };
      const off = () => { if (this.hold[dir]) heldFor = performance.now() - downAt; this.hold[dir] = false; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off);
      // みじかい タップ だけ すこし うごく（おしつづけた あとの click では うごかさない）。キーボードの click（detail 0）も
      b.addEventListener("click", (e) => { if (!this.hold[dir] && (e.detail === 0 || heldFor < 180)) this.nudge(dir); heldFor = 1e9; });
      this.pad.append(b);
    }
    this.pad.append(U.el("div", { class: "crane-knob" }));
    this.goBtn = UI.btn(t === "tripod" ? "とめる" : t === "sweet" ? "すくう" : "つかむ", () => this.press(0), "crane-go");
    this.go2 = t === "sweet" ? UI.btn("おとす", () => this.press(1), "crane-go crane-go2") : null;
    const acts = U.el("div", { class: "crane-acts" }); acts.append(this.goBtn); if (this.go2) acts.append(this.go2);
    const side = U.el("div", { class: "crane-side" });
    this.camBtn = UI.btn("カメラ", () => this.toggleCam(), "crane-small"); this.backBtn = UI.btn("やめる", () => this.leave(), "crane-small");
    side.append(this.camBtn, this.backBtn);
    row.append(this.pad, acts, side);
    this.result = U.el("div", { class: "crane-result hidden" });
    P.append(this.status, row, this.result);
    UI.root.append(P);
    this.refresh();
  }
  text(el, v) { if (el.textContent !== v) el.textContent = v; }
  dis(el, v) { if (el && el.disabled !== v) el.disabled = v; }
  refresh() {
    const r = this.round, t = r.type, ph = r.phase;
    let s = "";
    if (this.finished) s = r.got.length ? "やったー！ ゲット！" : "おしい！ また チャレンジ しよう。";
    else if (t === "claw" || t === "ring") s = ph === "move" ? `のこり ${Math.ceil(r.time)}びょう ・ やじるしで うごかして「つかむ」` : ph === "down" ? "おりるよ… もういちど おすと そこで つかむ" : ph === "stop" || ph === "open" ? "アームが ひらくよ…" : ph === "close" ? "つかんで…" : ph === "up" || ph === "top" ? "もちあげて…" : ph === "carry" ? "おとしぐちへ はこぶよ…" : ph === "release" ? "はなすよ！" : "どうかな…";
    else if (t === "tripod") s = ph === "spin" ? `ひかりを アームの ところで「とめる」 ・ のこり ${r.stops}かい` : ph === "stopped" ? (r.hit ? "あたり！ アームが おちた！" : "はずれ… つぎは どこで とめる？") : "どうかな…";
    else s = ph === "swing" ? `いまだ！と おもったら「すくう」 ・ のこり ${r.scoops}かい` : ph === "swing2" ? "ステージの どこに おとす？「おとす」" : ph === "dip" || ph === "scoop" ? "すくってる…" : ph === "lift" ? "はこんでるよ…" : ph === "dump" || ph === "back" ? "おとしたよ！" : ph === "watch" ? `おしだしを みまもろう… ${r.got.length}こ おちた` : "どうかな…";
    if (!this.finished && r.got.length && t === "sweet" && ph !== "watch") s += ` （${r.got.length}こ ゲット）`;
    this.text(this.status, s);
    const busy = this.finished || !(ph === "move" || ph === "spin" || ph === "swing" || ph === "swing2" || (ph === "down" && r.pt > 0.25));
    this.dis(this.goBtn, busy || (t === "sweet" && ph !== "swing"));
    if (this.go2) this.dis(this.go2, this.finished || ph !== "swing2");
    this.goBtn.classList.toggle("ready", !this.goBtn.disabled);
    if (this.go2) this.go2.classList.toggle("ready", !this.go2.disabled);
    for (const b of this.pad.children) if (b.tagName === "BUTTON") this.dis(b, this.finished || ph !== "move");
    const waiting = ph === "move" || ph === "spin" || ph === "swing";
    this.text(this.backBtn, this.finished ? "もどる" : "やめる"); this.dis(this.backBtn, !this.finished && !waiting);
  }
  nudge(dir) { const r = this.round; if (r.phase !== "move") return; const [dx, dz] = this.dirVec(dir), R = r.rig; R.load({ x: R.x + dx * 1.2, z: R.z + dz * 1.2 }); }
  // やじるし → world の 向き（カメラに あわせる）
  dirVec(dir) {
    const side = this.camMode === "side";
    if (dir === "left") return side ? [0, -1] : [-1, 0];
    if (dir === "right") return side ? [0, 1] : [1, 0];
    if (dir === "up") return side ? [-1, 0] : [0, 1];
    return side ? [1, 0] : [0, -1];
  }
  press(which) {
    if (Game.inputLocked || this.finished) return;
    const r = this.round;
    if (r.type === "sweet" && ((which === 0 && r.phase !== "swing") || (which === 1 && r.phase !== "swing2"))) return;
    const res = r.press();
    if (!res) return;
    Sound.se(res === "hit" ? "crane_hit" : res === "miss" ? "crane_miss" : res === "scoop" || res === "dump" ? "crane_scoop" : "crane_go");
    this.refresh();
  }
  toggleCam() { this.camMode = this.camMode === "front" ? "side" : "front"; this.cam = this.cams[this.camMode]; this.resize(); Sound.se("tap"); this.text(this.camBtn, this.camMode === "front" ? "カメラ" : "まえから"); }
  resize() {
    const top = 64, bot = this.panel ? Math.max(150, this.panel.getBoundingClientRect().height + 12) : 200, h = Math.max(160, G.H - top - bot);
    this.view = { x: 0, y: top, w: G.W, h };
    // 3にんの ぶん（44px）を のこして 台を 大きく
    for (const c of Object.values(this.cams)) c.fit({ x: 8, y: top + 2, w: G.W - 16, h: h - 50 });
  }
  checkpoint() { if (this.finished) return; this.run.cp = this.round.snap(); PrizeArcade.norm().active = this.run; Save.write(); }
  leave() {
    if (Game.inputLocked) return;
    const r = this.round;
    if (!this.finished && !(r.phase === "move" || r.phase === "spin" || r.phase === "swing")) return;
    if (!this.finished) this.checkpoint();
    Game.goto("venue", this.run.back, "circle");
  }
  again() {
    if (Game.inputLocked) return;
    const run = PrizeArcade.start(this.i, this.run.back);
    if (!run) { UI.toast("コインが たりないよ"); return; }
    Game.goto("prize", { run }, "none");
  }
  exit() { this.closed = true; if (!this.finished && this.round) this.checkpoint(); this.panel?.remove(); UI.showHud(false); }
  finish() {
    if (this.finished) return; this.finished = true;
    const r = this.round, ok = PrizeArcade.finish(this.run, r); UI.updateHud();
    const n = r.got.length * this.m.qty, prizes = PrizeArcade.prizesOf(this.i, r);
    if (n) { Sound.se("crane_win"); this.cheer = 3; } else { Sound.se("bad"); this.sad = 2; }
    // けっか（もういちど・もどる）
    this.result.innerHTML = "";
    const pic = U.el("div", { class: "crane-prize-pic" });
    pic.innerHTML = PrizeArcade.pictureSvg(PrizeArcade.picture(this.i, r));
    const msg = U.el("div", { class: "crane-result-text", text: n ? prizes.map((p) => (p.coins ? "コイン " + p.coins : PrizeArcade.item(p.id).name + " ×" + p.n)).join("・") + " を もらったよ！" : "こんどは とれるかな？" });
    const btns = U.el("div", { class: "crane-result-btns" });
    btns.append(UI.btn("もういちど（" + PrizeArcade.PRICE + "コイン）", () => this.again(), "yellow"), UI.btn("おみせに もどる", () => this.leave(), ""));
    this.result.append(n ? pic : U.el("span"), msg, btns);
    this.result.classList.remove("hidden"); this.panel.classList.add("done");
    if (!ok) this.result.dataset.settled = "again";
    this.refresh(); this.resize();
  }
  update(dt) {
    if (this.closed || document.hidden) return;
    this.clock += dt;
    if (Game.inputLocked) return;
    const r = this.round;
    if (!this.finished) {
      // やじるし（キーボード・ボタン）
      let dx = 0, dz = 0;
      for (const dir of ["left", "right", "up", "down"]) if (this.hold[dir] || G.keys[dir]) { const [a, b] = this.dirVec(dir); dx += a; dz += b; }
      r.move(dx, dz);
      if ((dx || dz) && r.phase === "move" && (this.motorT = (this.motorT || 0) - dt) <= 0) { this.motorT = 0.16; Sound.se("crane_motor"); }
    }
    const before = r.phase;
    r.step(dt * this.speed);
    for (const ev of r.events.splice(0)) this.onEvent(ev);
    if (!this.finished && r.done) this.finish();
    if (!this.finished && r.phase === "move" && (this.saveT += dt) > 2) { this.saveT = 0; const cp = this.run.cp; if (!cp || Math.abs(cp.x - r.rig.x) + Math.abs(cp.z - r.rig.z) > 0.5 || Math.abs(cp.time - r.time) > 1.5) this.checkpoint(); }
    if (r.type === "tripod" && r.phase === "spin") { const c = r.rig.cell(); if (c !== this.lastCell) { this.lastCell = c; Sound.se("crane_tick"); } }
    if (before !== r.phase || this.clock - (this.refT || 0) > 0.2) { this.refT = this.clock; this.refresh(); }
    for (const f of this.fx) f.t += dt; this.fx = this.fx.filter((f) => f.t < f.life);
    if (this.cheer > 0) this.cheer -= dt; if (this.sad > 0) this.sad -= dt; if (this.flash > 0) this.flash -= dt;
  }
  onEvent(ev) {
    if (ev.e === "checkpoint") this.checkpoint();
    else if (ev.e === "phase") {
      const p = ev.p;
      if (p === "down") Sound.se("crane_down"); else if (p === "close") Sound.se("crane_clack"); else if (p === "up") Sound.se("crane_up"); else if (p === "release") Sound.se("crane_clack");
      else if (p === "dip") Sound.se("crane_down"); else if (p === "lift") Sound.se("crane_up");
    } else if (ev.e === "got") {
      Sound.se(this.round.type === "sweet" ? "crane_candy" : "crane_thud"); this.flash = 0.8;
      this.fx.push({ k: "get", t: 0, life: 1.6, look: ev.look });
      for (let i = 0; i < 18; i++) this.fx.push({ k: "conf", t: 0, life: 1.4 + (i % 5) * 0.12, a: (i / 18) * Math.PI * 2, v: 60 + (i * 37) % 70, c: ["#F7A9C8", "#FFE07A", "#9ED3C6", "#C9B6EE"][i % 4] });
    } else if (ev.e === "armdrop") Sound.se("crane_arm");
    else if (ev.e === "loose") Sound.se("crane_loose");
  }
  key(k, down) { if (down && k === "ok") { if (this.finished) return; const r = this.round; this.press(r.type === "sweet" && r.phase === "swing2" ? 1 : 0); } }

  // ================= 描く =================
  render(ctx) {
    const W = G.W, H = G.H, c = this.cam, r = this.round, M = this.def.box;
    this.drawRoom(ctx, W, H);
    this.drawInterior(ctx);
    // うごく もの（ふかさ順）
    const list = [];
    this.collectMachine(list);
    for (const b of r.list()) list.push({ d: c.raw(...r.W.centroid(b))[2], draw: () => this.drawBody(ctx, b) });
    if (r.type === "claw" || r.type === "ring") this.collectClaw(list);
    list.sort((a, b) => b.d - a.d).forEach((o) => o.draw());
    this.drawGlass(ctx);
    this.drawFrame(ctx);
    this.drawParty(ctx);
    this.drawFx(ctx);
  }
  // ゲームセンターの へや（まわりは くらく、ぼんやり ひかる）
  drawRoom(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2B2346"); g.addColorStop(0.55, "#3C2F5C"); g.addColorStop(1, "#1F1A33");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const x = (i * 97) % W, y = 70 + ((i * 61) % Math.max(60, H - 260)), rr = 10 + (i % 4) * 7, a = 0.08 + 0.06 * Math.sin(this.clock * 1.4 + i); ctx.fillStyle = `hsla(${(i * 47) % 360},80%,70%,${a})`; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    // ゲームセンターの ゆか（台の まえ。3にんが たつ）
    const fy = this.cam.bottom - 8, fb = this.view.y + this.view.h, fg = ctx.createLinearGradient(0, fy, 0, fb); fg.addColorStop(0, "#524277"); fg.addColorStop(1, "#2A2140");
    ctx.fillStyle = fg; ctx.fillRect(0, fy, W, fb - fy);
    ctx.fillStyle = "rgba(255,255,255,0.05)"; for (let x = -40; x < W + 40; x += 28) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + (x - W / 2) * 0.5, fb); ctx.lineTo(x + (x - W / 2) * 0.5 + 8, fb); ctx.lineTo(x + 5, fy); ctx.fill(); }
  }
  // 平面に テクスチャ（よこ の しま に わけて アフィン で はる）
  plane(ctx, img, o, u, v, ul, vl, tile, strips, tint) {
    if (!img) return;
    const c = this.cam, pat = this.pattern(ctx, img), tw = img.width, th = img.height;
    for (let k = 0; k < strips; k++) {
      const t0 = (vl * k) / strips, t1 = (vl * (k + 1)) / strips;
      const P = (s, t) => c.p(o[0] + u[0] * s + v[0] * t, o[1] + u[1] * s + v[1] * t, o[2] + u[2] * s + v[2] * t);
      const a = P(0, t0), b = P(ul, t0), d = P(0, t1), e = P(ul, t1);
      const U0 = (ul / tile) * tw, V0 = (t0 / tile) * th, V1 = (t1 / tile) * th;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.clip();
      const ax = (b[0] - a[0]) / U0, ay = (b[1] - a[1]) / U0, cx = (d[0] - a[0]) / (V1 - V0), cy = (d[1] - a[1]) / (V1 - V0);
      ctx.transform(ax, ay, cx, cy, a[0] - cx * V0, a[1] - cy * V0);
      ctx.fillStyle = pat; ctx.fillRect(-2, V0 - 2, U0 + 4, V1 - V0 + 4);
      ctx.restore();
    }
    if (tint) this.poly(ctx, [c.p(...o), c.p(o[0] + u[0] * ul, o[1] + u[1] * ul, o[2] + u[2] * ul), c.p(o[0] + u[0] * ul + v[0] * vl, o[1] + u[1] * ul + v[1] * vl, o[2] + u[2] * ul + v[2] * vl), c.p(o[0] + v[0] * vl, o[1] + v[1] * vl, o[2] + v[2] * vl)], tint);
  }
  pattern(ctx, img) { this.pats = this.pats || new Map(); let p = this.pats.get(img); if (!p) { p = ctx.createPattern(img, "repeat"); this.pats.set(img, p); } return p; }
  poly(ctx, pts, fill, stroke, lw) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }
  P3(pts) { return pts.map((q) => this.cam.p(q[0], q[1], q[2])); }
  // かべ・ゆか・おとしぐち
  drawInterior(ctx) {
    const c = this.cam, r = this.round, d = this.def, M = d.box, wall = CraneArt.tex(this.th.wall), floor = CraneArt.tex(this.th.floor);
    ctx.save();
    // おくの かべ・よこの かべ
    this.plane(ctx, wall, [0, 0, M.d], [1, 0, 0], [0, 1, 0], M.w, M.h, 26, 6, null);
    const sideTint = "rgba(255,255,255,0.10)";
    this.plane(ctx, wall, [0, 0, 0], [0, 0, 1], [0, 1, 0], M.d, M.h, 26, 6, "rgba(40,30,60,0.28)");
    this.plane(ctx, wall, [M.w, 0, 0], [0, 0, 1], [0, 1, 0], M.d, M.h, 26, 6, "rgba(40,30,60,0.28)");
    // てんじょうの あかり（上から あかるい）
    const top = this.P3([[0, M.h, 0], [M.w, M.h, 0], [M.w, M.h, M.d], [0, M.h, M.d]]);
    this.poly(ctx, top, "rgba(255,250,235,0.9)");
    // ゆか
    this.plane(ctx, floor, [0, 0, 0], [1, 0, 0], [0, 0, 1], M.w, M.d, 22, 10, null);
    const lg = ctx.createLinearGradient(0, c.p(0, M.h, M.d)[1], 0, c.p(0, 0, 0)[1]); lg.addColorStop(0, "rgba(255,255,255,0.18)"); lg.addColorStop(1, "rgba(0,0,0,0.12)");
    this.poly(ctx, this.P3([[0, 0, 0], [M.w, 0, 0], [M.w, 0, M.d], [0, 0, M.d]]), lg);
    // よこの かべの ネット（こまかい あみ）
    ctx.strokeStyle = sideTint; ctx.lineWidth = 1;
    for (const x of [0, M.w]) for (let k = 1; k < 8; k++) { const a = c.p(x, (M.h * k) / 8, 0), b = c.p(x, (M.h * k) / 8, M.d); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    if (d.chute) this.drawChute(ctx);
    if (r.type === "tripod") this.drawTripodFloor(ctx);
    if (r.type === "sweet") this.drawSweetFloor(ctx);
    this.drawShadows(ctx);
    ctx.restore();
  }
  drawChute(ctx) {
    const ch = this.def.chute, h = [[ch.x0, 0, ch.z0], [ch.x1, 0, ch.z0], [ch.x1, 0, ch.z1], [ch.x0, 0, ch.z1]];
    // あなの 中（くらい）と うちがわの かべ
    this.poly(ctx, this.P3(h), "#2A2238");
    const inner = [[ch.x0, -14, ch.z1], [ch.x1, -14, ch.z1], [ch.x1, 0, ch.z1], [ch.x0, 0, ch.z1]];
    const g = ctx.createLinearGradient(0, this.cam.p(ch.x0, 0, ch.z1)[1], 0, this.cam.p(ch.x0, -14, ch.z1)[1]); g.addColorStop(0, "#5A4B78"); g.addColorStop(1, "#2A2238");
    this.poly(ctx, this.P3(inner), g);
    // ふちの ライト
    const glow = 0.55 + 0.45 * Math.sin(this.clock * 5);
    this.poly(ctx, this.P3(h), null, `rgba(255,236,150,${0.5 + glow * 0.4})`, 2.4);
    const [lx, ly, ld] = this.cam.p((ch.x0 + ch.x1) / 2, 0.1, (ch.z0 + ch.z1) / 2);
    ctx.fillStyle = `rgba(255,236,150,${0.55 + glow * 0.3})`; ctx.font = `900 ${Math.max(9, this.cam.s(3.4, ld))}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("GET", lx, ly + 3);
  }
  drawTripodFloor(ctx) {
    const R = this.round.rig, o = R.o, c = this.cam, N = 40;
    const ring = (rad, y = 0.05) => Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2; return c.p(o.cx + Math.cos(a) * rad, y, o.cz + Math.sin(a) * rad); });
    // あな（中は くらい つつ）
    const g = ctx.createRadialGradient(c.p(o.cx, 0, o.cz)[0], c.p(o.cx, 0, o.cz)[1], 2, c.p(o.cx, 0, o.cz)[0], c.p(o.cx, 0, o.cz)[1], c.s(14, c.p(o.cx, 0, o.cz)[2]));
    g.addColorStop(0, "#120E1E"); g.addColorStop(1, "#3B3052");
    const hole = o.hole || 13.5, r0 = hole + 0.6, r1 = hole + 3.4;
    // ゆかの もよう（あなの まわりの ぎんいろの わ）
    this.poly(ctx, ring(r1 + 1.2, 0.03), "#D9DEE7", "#1F1D1B", 1.6);
    this.poly(ctx, ring(hole), g, "#1F1D1B", 2);
    // ランプの わ（12こ。アームの ところは いろつき）
    const cells = R.cells(), lit = R.cell(), blink = R.flash > 0 && Math.floor(R.flash * 10) % 2 === 0;
    for (let k = 0; k < cells; k++) {
      const a0 = (k / cells) * Math.PI * 2 + (o.a0 * Math.PI) / 180 - Math.PI / cells + 0.03, a1 = a0 + (Math.PI * 2) / cells - 0.06, arm = R.armAt(k);
      const pts = []; for (let s = 0; s <= 6; s++) { const a = a0 + ((a1 - a0) * s) / 6; pts.push(c.p(o.cx + Math.cos(a) * r1, 0.08, o.cz + Math.sin(a) * r1)); }
      for (let s = 6; s >= 0; s--) { const a = a0 + ((a1 - a0) * s) / 6; pts.push(c.p(o.cx + Math.cos(a) * r0, 0.08, o.cz + Math.sin(a) * r0)); }
      const on = k === lit && (R.run || blink || R.flash > 0);
      const base = arm ? (arm.up ? "#FF8FB8" : "#6E6882") : "#F4F0FA"; // アームの ランプは ピンク・あいだは しろ（テーマの いろと まざらない）
      this.poly(ctx, pts, on ? (this.round.hit && k === this.round.lastCell && R.flash > 0 ? "#FFF3A0" : "#FFE45C") : base, "#1F1D1B", 1.4);
      if (on) { const m = pts[3]; ctx.fillStyle = "rgba(255,240,140,0.45)"; ctx.beginPath(); ctx.arc(m[0], m[1], 12, 0, 7); ctx.fill(); }
    }
  }
  drawSweetFloor(ctx) {
    const R = this.round.rig, o = R.o, c = this.cam, N = 44;
    // まわる 台（しましま が まわる）
    const disk = Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2; return c.p(o.cx + Math.cos(a) * o.rad, o.top, o.cz + Math.sin(a) * o.rad); });
    const side = [...disk.map((p, i) => { const a = (i / N) * Math.PI * 2; return c.p(o.cx + Math.cos(a) * o.rad, o.top - 3, o.cz + Math.sin(a) * o.rad); })];
    this.poly(ctx, side, this.th.body2, "#1F1D1B", 2);
    this.poly(ctx, disk, "#FFF3F7", "#1F1D1B", 2);
    for (let k = 0; k < 12; k++) {
      const a0 = R.ang + (k * Math.PI) / 6, a1 = a0 + Math.PI / 12, pts = [c.p(o.cx, o.top + 0.02, o.cz)];
      for (let s = 0; s <= 4; s++) { const a = a0 + ((a1 - a0) * s) / 4; pts.push(c.p(o.cx + Math.cos(a) * o.rad, o.top + 0.02, o.cz + Math.sin(a) * o.rad)); }
      this.poly(ctx, pts, k % 2 ? "#F8C8D8" : "#C8E8DD");
    }
    // ステージ（おしだし台）の 上と まえ
    const st = this.round.stage, x0 = st.cx - st.w / 2, x1 = st.cx + st.w / 2;
    this.poly(ctx, this.P3([[x0, st.top, st.z0], [x1, st.top, st.z0], [x1, st.top - 3, st.z0], [x0, st.top - 3, st.z0]]), this.th.body2, "#1F1D1B", 2);
    this.poly(ctx, this.P3([[x0, st.top, st.z0], [x1, st.top, st.z0], [x1, st.top, st.z1], [x0, st.top, st.z1]]), "#FFF7E6", "#1F1D1B", 2);
    for (let k = 1; k < 8; k++) { const z = st.z0 + ((st.z1 - st.z0) * k) / 8, a = c.p(x0, st.top + 0.02, z), b = c.p(x1, st.top + 0.02, z); ctx.strokeStyle = "rgba(233,150,180,0.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // ステージの ふちの ライト（ながれる）
    for (let k = 0; k <= 16; k++) { const x = x0 + (st.w * k) / 16, p = c.p(x, st.top - 1.5, st.z0), on = (k + Math.floor(this.clock * 8)) % 4 === 0; ctx.fillStyle = on ? "#FFF3A0" : this.th.trim; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, c.s(0.7, p[2])), 0, 7); ctx.fill(); }
    // とりだしぐち（まえの あな）
    this.poly(ctx, this.P3([[x0, 0, 0], [x1, 0, 0], [x1, 0, 14], [x0, 0, 14]]), "#2A2238");
  }
  // かげ（ゆか・ステージ・まわる 台の 上）
  drawShadows(ctx) {
    const c = this.cam, r = this.round;
    const floorAt = (x, y, z) => { if (r.type === "sweet") { const st = r.stage, o = r.rig.o; if (y > st.top - 1 && x > st.cx - st.w / 2 && x < st.cx + st.w / 2 && z > st.z0 && z < st.z1) return st.top; if (Math.hypot(x - o.cx, z - o.cz) < o.rad) return o.top; } return 0; };
    // ゆかに おちる まるい かげ（ゆかの 上の 円を カメラで うつす。たかい ほど うすく 大きく）
    const shadow = (x, y, z, rad, a) => {
      const fy = floorAt(x, y, z), h = y - fy; if (h < -1) return;
      const k = Math.max(0.15, 1 - h / 60), R = rad * (1.1 - k * 0.2), p = c.p(x, fy + 0.05, z), ax = c.p(x + R, fy, z), bx = c.p(x - R, fy, z), az = c.p(x, fy, z + R), bz = c.p(x, fy, z - R);
      const rx = Math.max(Math.abs(ax[0] - bx[0]), Math.abs(az[0] - bz[0])) / 2, ry = Math.max(Math.abs(ax[1] - bx[1]), Math.abs(az[1] - bz[1])) / 2;
      if (!(rx > 0.5 && ry > 0.3)) return;
      ctx.fillStyle = `rgba(30,20,40,${a * k})`; ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, 0, 7); ctx.fill();
    };
    for (const b of r.list()) { const q = r.W.centroid(b), s = b.data.size || [10, 10, 10]; shadow(q[0], q[1], q[2], Math.max(s[0], s[2]) * 0.42, 0.28); }
    if (r.type === "claw" || r.type === "ring") { const h = r.rig.hub(); shadow(h[0], h[1], h[2], 6.5, 0.32); }
  }
  // ---- 景品 ----
  drawBody(ctx, b) {
    const d = b.data;
    if (d.look === "star") this.drawSlab(ctx, b, "star", 18, 18, 5.4);
    else if (d.slab) this.drawSlab(ctx, b, d.look, ...d.slab);
    else if (d.box) this.drawBox(ctx, b);
    else if (d.look === "uma") this.drawStick(ctx, b);
    else if (d.art) this.drawPlush(ctx, b);
    if (d.ring) this.drawRing(ctx, b);
  }
  frame(b) { const q = CranePhys.qmat(b.q); return { R: q, ex: q[0], ey: q[1], ez: q[2] }; }
  wpt(b, L) { return CraneMachines.toWorld(this.round.W, b, L); }
  toEye(p) { const e = this.cam.eye; return [e[0] - p[0], e[1] - p[1], e[2] - p[2]]; }
  // ひらたい もの（星の クッション）: おもて・うら・よこの そう
  drawSlab(ctx, b, look, w, h, t) {
    const { ez } = this.frame(b), cen = this.wpt(b, [0, 0, 0]), tv = this.toEye(cen), front = -(ez[0] * tv[0] + ez[1] * tv[1] + ez[2] * tv[2]) > 0;
    const face = CraneArt.tex(look + (front ? "-front" : "-back")), side = CraneArt.tex(look + "-side"), rim = CraneArt.tex(look + "-rim"), sgn = front ? -1 : 1, n = 7;
    const q = (z, img, mirror) => { const X = mirror ? -1 : 1; this.quadL(ctx, b, img, [-w / 2 * X, h / 2, z], [w / 2 * X, h / 2, z], [-w / 2 * X, -h / 2, z]); };
    q(-sgn * t / 2, rim || side, !front);
    for (let k = 1; k < n; k++) q(-sgn * t / 2 + (sgn * t * k) / n, side, !front);
    q(sgn * t / 2, face, !front);
  }
  // ローカルの 3点に 画像を はる
  quadL(ctx, b, img, a, bb, c) { if (!img) return; const P = (L) => this.cam.p(...this.wpt(b, L)); CraneArt.quad(ctx, img, P(a), P(bb), P(c)); }
  drawBox(ctx, b) {
    const [w, h, dd] = b.data.box, look = b.data.look, c = this.cam, faces = [];
    const T = (k) => CraneArt.tex(look + "-" + k) || CraneArt.tex(look + "-side") || CraneArt.tex(look + "-top");
    const F = (n, cen, a, bb, cc, key) => { const wn = this.wpt(b, [cen[0] + n[0], cen[1] + n[1], cen[2] + n[2]]), wc = this.wpt(b, cen), nv = [wn[0] - wc[0], wn[1] - wc[1], wn[2] - wc[2]], tv = this.toEye(wc); if (nv[0] * tv[0] + nv[1] * tv[1] + nv[2] * tv[2] > 0) faces.push({ d: c.raw(...wc)[2], a, b: bb, c: cc, key }); };
    const X = w / 2, Y = h / 2, Z = dd / 2;
    F([0, 0, -1], [0, 0, -Z], [-X, Y, -Z], [X, Y, -Z], [-X, -Y, -Z], "front");
    F([0, 0, 1], [0, 0, Z], [X, Y, Z], [-X, Y, Z], [X, -Y, Z], "back");
    F([-1, 0, 0], [-X, 0, 0], [-X, Y, Z], [-X, Y, -Z], [-X, -Y, Z], "side");
    F([1, 0, 0], [X, 0, 0], [X, Y, -Z], [X, Y, Z], [X, -Y, -Z], "side");
    F([0, 1, 0], [0, Y, 0], [-X, Y, Z], [X, Y, Z], [-X, Y, -Z], "top");
    F([0, -1, 0], [0, -Y, 0], [-X, -Y, -Z], [X, -Y, -Z], [-X, -Y, Z], "side");
    faces.sort((p, q) => q.d - p.d);
    for (const f of faces) { const img = f.key === "front" ? CraneArt.tex(look + "-front") || T("side") : f.key === "back" ? CraneArt.tex(look + "-back") || T("side") : f.key === "top" ? CraneArt.tex(look + "-top") || T("side") : T("side"); this.quadL(ctx, b, img, f.a, f.b, f.c); }
  }
  drawStick(ctx, b) {
    const c = this.cam, s = b.data.size, a = c.p(...this.wpt(b, [-s[0] / 2, 0, 0])), e = c.p(...this.wpt(b, [s[0] / 2, 0, 0])), dx = e[0] - a[0], dy = e[1] - a[1], l = Math.hypot(dx, dy) || 1, wpx = c.s(s[1], (a[2] + e[2]) / 2), nx = (-dy / l) * wpx / 2, ny = (dx / l) * wpx / 2;
    const img = CraneArt.tex("uma-wrap"); if (!img) return;
    CraneArt.quad(ctx, img, [a[0] - nx, a[1] - ny], [e[0] - nx, e[1] - ny], [a[0] + nx, a[1] + ny]);
    // まるみの かげ
    ctx.strokeStyle = "rgba(60,40,20,0.18)"; ctx.lineWidth = wpx * 0.28; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0] + nx * 0.6, a[1] + ny * 0.6); ctx.lineTo(e[0] + nx * 0.6, e[1] + ny * 0.6); ctx.stroke();
  }
  // ぬいぐるみ: いつも カメラを むく 絵（まわると うらに なる・ころがると かたむく）
  drawPlush(ctx, b) {
    const c = this.cam, [ax, ay, aw, ah] = b.data.art, { ey, ez } = this.frame(b), cen = this.wpt(b, [ax, ay, 0]), tv = this.toEye(cen), front = -(ez[0] * tv[0] + ez[1] * tv[1] + ez[2] * tv[2]) > 0;
    const img = CraneArt.tex(b.data.look + (front ? "-front" : "-back")); if (!img) return;
    const top = c.p(cen[0] + (ey[0] * ah) / 2, cen[1] + (ey[1] * ah) / 2, cen[2] + (ey[2] * ah) / 2), bot = c.p(cen[0] - (ey[0] * ah) / 2, cen[1] - (ey[1] * ah) / 2, cen[2] - (ey[2] * ah) / 2), mid = c.p(...cen);
    let vx = bot[0] - top[0], vy = bot[1] - top[1]; const full = c.s(ah, mid[2]), vl = Math.hypot(vx, vy) || 1, k = Math.max(0.68, Math.min(1, vl / full)); // ぬいぐるみは まるいので あまり つぶさない
    vx = (vx / vl) * full * k; vy = (vy / vl) * full * k;
    const wpx = c.s(aw, mid[2]), ux = (-vy / (full * k)) * wpx, uy = (vx / (full * k)) * wpx;
    const p0 = [mid[0] - ux / 2 - vx / 2, mid[1] - uy / 2 - vy / 2];
    CraneArt.quad(ctx, img, p0, [p0[0] + ux, p0[1] + uy], [p0[0] + vx, p0[1] + vy]);
  }
  drawRing(ctx, b) {
    const [rx, ry, rz, R] = b.data.ring, c = this.cam, pts = [];
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(c.p(...this.wpt(b, [rx + Math.cos(a) * R, ry + Math.sin(a) * R, rz]))); }
    const d = pts[0][2], lw = Math.max(2, c.s(1.2, d));
    const tag = [c.p(...this.wpt(b, [rx, ry - R, rz])), c.p(...this.wpt(b, [rx, ry - R - 1.6, rz]))];
    ctx.lineCap = "round"; ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.9; ctx.beginPath(); ctx.moveTo(tag[0][0], tag[0][1]); ctx.lineTo(tag[1][0], tag[1][1]); ctx.stroke();
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK; ctx.lineWidth = lw + 2; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = "#F48FB1"; ctx.lineWidth = lw; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = Math.max(1, lw * 0.3); ctx.beginPath(); pts.slice(2, 8).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  }
  // ---- アーム ----
  collectClaw(list) {
    const ctx = this._ctx, c = this.cam, R = this.round.rig, d = this.def, M = d.box, hub = R.hub(), topY = M.h - 1.5;
    // レール・くるま・ケーブル
    list.push({ d: c.raw(R.x, topY, R.z)[2] + 30, draw: () => {
      for (const z of [2, M.d - 2]) CraneArt.rod(ctx, c.p(2, topY, z), c.p(M.w - 2, topY, z), Math.max(3, c.s(1.4, c.raw(M.w / 2, topY, z)[2])), ["#4D5563", "#C9D0DA", "#7E8794"]);
      CraneArt.rod(ctx, c.p(R.x, topY - 1.2, 2), c.p(R.x, topY - 1.2, M.d - 2), Math.max(3, c.s(1.6, c.raw(R.x, topY, R.z)[2])), ["#4D5563", "#DDE3EA", "#8A939E"]);
    } });
    list.push({ d: c.raw(R.x, topY - 3, R.z)[2] - 0.5, draw: () => {
      const a = c.p(R.x, topY - 2.5, R.z), bb = c.p(hub[0], hub[1] + 5, hub[2]);
      this.poly(ctx, this.boxPts(R.x, topY - 2.5, R.z, 3.4, 2.2, 3.4), "#6C7582", INK, 1.5);
      ctx.strokeStyle = "#2E2A36"; ctx.lineWidth = Math.max(1.6, c.s(0.5, a[2])); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bb[0], bb[1]); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a[0] + 1, a[1]); ctx.lineTo(bb[0] + 1, bb[1]); ctx.stroke();
    } });
    // あたま
    list.push({ d: c.raw(...hub)[2], draw: () => this.drawHead(ctx, hub) });
    // うで（ふし ごと）
    R.segs.forEach((segs, k) => {
      const j = R.joints(k), mid = j[Math.floor(j.length / 2)];
      list.push({ d: c.raw(...mid)[2] - 0.2, draw: () => {
        const n = j.length - 1, hook = R.o.segs.length === 3;
        for (let s = 0; s < n; s++) {
          const a = c.p(...j[s]), bb = c.p(...j[s + 1]), d = (a[2] + bb[2]) / 2, last = s === n - 1;
          if (hook) CraneArt.rod(ctx, a, bb, Math.max(2.2, c.s(R.o.segs[s].r * 2.2, d)), s === 0 ? ["#5E6670", "#E8EDF3", "#8A939E"] : ["#8A6A2E", "#FFE9A8", "#C49A45"]);
          else CraneArt.plate(ctx, a, bb, Math.max(3, c.s(R.o.segs[s].r * 3, d)), last ? ["#2F3A57", "#8FA2C8", "#46547A"] : ["#6B737E", "#F1F4F8", "#9AA3AE"]);
        }
        for (const q of j.slice(0, n)) { const p = c.p(...q); ctx.fillStyle = "#D5DBE3"; ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, c.s(0.75, p[2])), 0, 7); ctx.fill(); ctx.stroke(); }
      } });
    });
  }
  boxPts(x, y, z, hw, hh, hd) { return this.P3([[x - hw, y - hh, z - hd], [x + hw, y - hh, z - hd], [x + hw, y + hh, z - hd], [x - hw, y + hh, z - hd]]); }
  // アームの あたま。3本アームは UFO の かたち（ふちに ライト・まるい ドーム・星の マーク）、ほかは つつ ＋ マーク
  drawHead(ctx, hub) {
    const c = this.cam, R = this.round.rig, r = R.o.headR, N = 28, th = this.th, ufo = R.o.yaws.length === 3;
    const ringAt = (y, rad) => Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2; return c.p(hub[0] + Math.cos(a) * rad, y, hub[2] + Math.sin(a) * rad); });
    const band = (y0, y1, r0, r1, col) => {
      const lo = ringAt(y0, r0), hi = ringAt(y1, r1), idx = lo.map((p, i) => i).sort((a, b) => lo[a][0] - lo[b][0]), L = idx[0], Rr = idx[N - 1], body = [];
      for (let i = L; ; i = (i + 1) % N) { body.push(lo[i]); if (i === Rr) break; } for (let i = Rr; ; i = (i - 1 + N) % N) { body.push(hi[i]); if (i === L) break; }
      const g = ctx.createLinearGradient(lo[L][0], 0, lo[Rr][0], 0); g.addColorStop(0, this.shade(col, -0.32)); g.addColorStop(0.38, this.shade(col, 0.22)); g.addColorStop(1, this.shade(col, -0.38));
      this.poly(ctx, lo, this.shade(col, -0.45), INK, 1.4); this.poly(ctx, body, g, INK, 1.6); this.poly(ctx, hi, this.shade(col, 0.28), INK, 1.4);
      return { lo, hi };
    };
    if (ufo) {
      band(hub[1] - 2.6, hub[1] - 0.4, r * 0.62, r * 0.62, "#9AA3AE"); // うでの ねもと
      const disc = band(hub[1] - 0.6, hub[1] + 1.4, r * 1.38, r * 1.3, th.head); // UFO の ふち
      // ふちの ライト（ながれる）
      disc.lo.forEach((p, i) => { if (i % 2) return; const q = disc.hi[i], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], on = (i / 2 + Math.floor(this.clock * 7)) % 3 === 0; ctx.fillStyle = on ? "#FFF6B0" : "#FFB6D0"; ctx.beginPath(); ctx.arc(m[0], m[1], Math.max(1.2, c.s(0.45, p[2])), 0, 7); ctx.fill(); });
      // ドーム
      const top = c.p(hub[0], hub[1] + 1.4, hub[2]), dr = c.s(r * 0.95, top[2]), dh = c.s(r * 0.8, top[2]);
      const dg = ctx.createRadialGradient(top[0] - dr * 0.35, top[1] - dh * 0.7, 1, top[0], top[1] - dh * 0.3, dr * 1.1); dg.addColorStop(0, "#FFFFFF"); dg.addColorStop(0.35, this.shade(th.head, 0.55)); dg.addColorStop(1, this.shade(th.head, -0.1));
      ctx.beginPath(); ctx.ellipse(top[0], top[1], dr, dh, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = dg; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
      this.emblem(ctx, top[0], top[1] - dh - dr * 0.15, dr * 0.62);
    } else {
      const b = band(hub[1] - 2.4, hub[1] + 4.2, r, r * 0.9, th.head);
      const mid = c.p(hub[0], hub[1] + 1, hub[2] - r * 0.98);
      ctx.fillStyle = this.shade(th.body, 0.1); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(mid[0], mid[1], c.s(r * 0.55, mid[2]), c.s(1.3, mid[2]), 0, 0, 7); ctx.fill(); ctx.stroke();
      const cap = c.p(hub[0], hub[1] + 4.2, hub[2]); this.emblem(ctx, cap[0], cap[1] - c.s(1.8, cap[2]), c.s(r * 0.7, cap[2]));
    }
    const lamp = c.p(hub[0], hub[1] + (ufo ? 0.4 : 1.2), hub[2] - r * (ufo ? 1.36 : 0.96)); ctx.fillStyle = Math.floor(this.clock * 4) % 2 ? "#FF7BA8" : "#FFD0E0"; ctx.beginPath(); ctx.arc(lamp[0], lamp[1], Math.max(1.8, c.s(0.8, lamp[2])), 0, 7); ctx.fill();
  }
  // あたまの マーク（星。つよい アームの ときは ぴかぴか）
  emblem(ctx, x, y, sz) {
    const strong = this.round.strong && this.round.type === "claw" && this.round.phase !== "move", glow = strong ? 0.6 + 0.4 * Math.sin(this.clock * 10) : 0;
    if (glow) { ctx.fillStyle = `rgba(255,240,140,${glow * 0.5})`; ctx.beginPath(); ctx.arc(x, y, sz * 1.6, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = strong ? "#FFF08A" : this.th.trim === "#FFFFFF" ? "#FFE07A" : this.th.trim; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? sz * 0.45 : sz; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  // ---- 台の しかけ（ガード・トライポッドの アーム・ショベル など）----
  collectMachine(list) {
    const ctx = this._ctx, c = this.cam, r = this.round, d = this.def;
    if (d.chute) for (const g of d.chute.guards || []) list.push({ d: c.raw(...g.c)[2], draw: () => this.acrylic(g) });
    if (r.type === "tripod") for (const a of r.rig.arms) { const m = [(a.c.a[0] + a.c.b[0]) / 2, (a.c.a[1] + a.c.b[1]) / 2, (a.c.a[2] + a.c.b[2]) / 2]; list.push({ d: c.raw(...m)[2], draw: () => this.drawTriArm(a) }); }
    if (r.type === "sweet") this.collectSweet(list);
  }
  acrylic(g) {
    const ctx = this._ctx, [x, y, z] = g.c, [hx, hy, hz] = g.h;
    const f = this.P3([[x - hx, y - hy, z - hz], [x + hx, y - hy, z - hz], [x + hx, y + hy, z - hz], [x - hx, y + hy, z - hz]]), bk = this.P3([[x - hx, y - hy, z + hz], [x + hx, y - hy, z + hz], [x + hx, y + hy, z + hz], [x - hx, y + hy, z + hz]]);
    const top = [bk[3], bk[2], f[2], f[3]];
    this.poly(ctx, hx > hz ? f : this.P3([[x - hx, y - hy, z - hz], [x - hx, y - hy, z + hz], [x - hx, y + hy, z + hz], [x - hx, y + hy, z - hz]]), "rgba(200,235,255,0.28)", "rgba(255,255,255,0.85)", 1.6);
    this.poly(ctx, top, "rgba(255,255,255,0.55)");
  }
  drawTriArm(a) {
    const ctx = this._ctx, c = this.cam, A = c.p(...a.c.a), B = c.p(...a.c.b), w = Math.max(3, c.s(2.3, (A[2] + B[2]) / 2));
    CraneArt.rod(ctx, A, B, w, a.up ? ["#5E6670", "#EEF2F6", "#8A939E"] : ["#4A4F58", "#9AA1AA", "#6B727C"]);
    // ねもとの はこ
    const yaw = (a.yaw * Math.PI) / 180, o = this.round.rig.o, bx = o.cx + Math.cos(yaw) * (o.out + 1.2), bz = o.cz + Math.sin(yaw) * (o.out + 1.2);
    this.poly(ctx, this.boxPts(bx, 1.8, bz, 2, 1.8, 2), a.up ? this.th.body : "#8C8699", INK, 1.5);
    this.poly(ctx, this.P3([[bx - 2, 3.6, bz - 2], [bx + 2, 3.6, bz - 2], [bx + 2, 3.6, bz + 2], [bx - 2, 3.6, bz + 2]]), a.up ? this.shade(this.th.body, 0.3) : "#A9A3B6", INK, 1.2);
  }
  collectSweet(list) {
    const c = this.cam, r = this.round, R = r.rig, o = R.o, st = r.stage, ctx = this._ctx;
    // まんなかの はしら（しましま）
    list.push({ d: c.raw(o.cx, o.top + 6, o.cz)[2], draw: () => { const a = c.p(o.cx, o.top, o.cz), b = c.p(o.cx, o.top + 14, o.cz), w = c.s(9, a[2]); CraneArt.rod(ctx, a, b, w, ["#F2A7C0", "#FFFFFF", "#F7C6D6"]); for (let k = 0; k < 4; k++) { const y = o.top + 2 + k * 3.2 + ((R.ang * 3) % 3.2), p = c.p(o.cx, y, o.cz); ctx.strokeStyle = "#E86F9A"; ctx.lineWidth = Math.max(1.5, c.s(0.9, p[2])); ctx.beginPath(); ctx.ellipse(p[0], p[1], w / 2, w * 0.14, -0.3, 0, Math.PI); ctx.stroke(); } } });
    // おしだし
    const P = R.pusher, [px, py, pz] = P.c, [hx, hy, hz] = P.h;
    list.push({ d: c.raw(px, py, pz)[2], draw: () => {
      this.poly(ctx, this.P3([[px - hx, py + hy, pz - hz], [px + hx, py + hy, pz - hz], [px + hx, py + hy, pz + hz], [px - hx, py + hy, pz + hz]]), "#FFE3EC", INK, 1.6);
      this.poly(ctx, this.P3([[px - hx, py - hy, pz - hz], [px + hx, py - hy, pz - hz], [px + hx, py + hy, pz - hz], [px - hx, py + hy, pz - hz]]), this.th.body, INK, 1.8);
      for (let k = 0; k < 6; k++) { const x = px - hx + ((k + 0.5) * hx * 2) / 6, p = c.p(x, py, pz - hz); ctx.fillStyle = this.th.trim; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, c.s(0.9, p[2])), 0, 7); ctx.fill(); }
    } });
    // ステージの よこ・うしろの かべ（とうめい）
    for (const g of [{ c: [st.cx - st.w / 2 - 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2] }, { c: [st.cx + st.w / 2 + 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2] }, { c: [st.cx, st.top + 6, st.z1 + 0.4], h: [st.w / 2 + 0.8, 6, 0.4] }]) list.push({ d: c.raw(...g.c)[2], draw: () => this.acrylic(g) });
    // まわる 台の かこい（とうめい）: おくの はんぶんは 景品の まえに 描かない
    const fence = (front) => () => { const N = 36, pts = []; for (let i = 0; i <= N; i++) { const a = front ? (i / N) * Math.PI + Math.PI : (i / N) * Math.PI; pts.push([o.cx + Math.cos(a) * (o.rad + 0.6), o.cz + Math.sin(a) * (o.rad + 0.6)]); } const lo = pts.map(([x, z]) => c.p(x, o.top - 0.5, z)), hi = pts.map(([x, z]) => c.p(x, o.top + 6.5, z)); this.poly(ctx, [...lo, ...hi.reverse()], "rgba(210,240,255,0.16)"); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.4; ctx.beginPath(); hi.reverse().forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
    list.push({ d: c.raw(o.cx, o.top, o.cz + o.rad)[2], draw: fence(false) });
    list.push({ d: c.raw(o.cx, o.top, o.cz - o.rad)[2] - 1, draw: fence(true) });
    // ショベル（うでと バケツ。うちがわは あかるい ぎんいろ、ふちは テーマの いろ）
    list.push({ d: c.raw(R.sx, R.sy, R.sz)[2] - 0.3, draw: () => {
      const a = c.p(R.sx, R.sy + 4, R.sz), b = c.p(R.sx, this.def.box.h - 2, R.sz); CraneArt.rod(ctx, a, b, Math.max(3.4, c.s(2, a[2])));
      const j = c.p(R.sx, R.sy + 4, R.sz); ctx.fillStyle = this.th.body; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(j[0], j[1], Math.max(3, c.s(1.6, j[2])), 0, 7); ctx.fill(); ctx.stroke();
      const parts = R.parts.map((p, pi) => { const cc = p.c.c, Rm = p.c.R, h = p.c.h, corner = (sx, sy, sz) => [cc[0] + Rm[0][0] * sx * h[0] + Rm[1][0] * sy * h[1] + Rm[2][0] * sz * h[2], cc[1] + Rm[0][1] * sx * h[0] + Rm[1][1] * sy * h[1] + Rm[2][1] * sz * h[2], cc[2] + Rm[0][2] * sx * h[0] + Rm[1][2] * sy * h[1] + Rm[2][2] * sz * h[2]]; return { pi, d: c.raw(...cc)[2], faces: [[[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]]].map((f) => this.P3(f.map((s) => corner(...s)))) }; });
      parts.sort((p, q) => q.d - p.d).forEach((p) => p.faces.forEach((f, i) => this.poly(ctx, f, p.pi === 0 ? (i === 0 ? "#F4F7FA" : "#C3CCD6") : i === 0 ? this.shade(this.th.body, 0.25) : this.th.body, INK, 1.3)));
    } });
  }
  // ---- ガラス・わく ----
  drawGlass(ctx) {
    const M = this.def.box, side = this.camMode === "side", c = this.cam;
    const q = side ? this.P3([[M.w, 0, 0], [M.w, 0, M.d], [M.w, M.h, M.d], [M.w, M.h, 0]]) : this.P3([[0, 0, 0], [M.w, 0, 0], [M.w, M.h, 0], [0, M.h, 0]]);
    const x0 = Math.min(...q.map((p) => p[0])), x1 = Math.max(...q.map((p) => p[0])), y0 = Math.min(...q.map((p) => p[1])), y1 = Math.max(...q.map((p) => p[1]));
    ctx.save(); this.poly(ctx, q, null); ctx.clip();
    const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "rgba(255,255,255,0.20)"); g.addColorStop(0.3, "rgba(255,255,255,0.02)"); g.addColorStop(0.62, "rgba(255,255,255,0.0)"); g.addColorStop(0.7, "rgba(255,255,255,0.12)"); g.addColorStop(0.76, "rgba(255,255,255,0.0)");
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * 0.08, y0); ctx.lineTo(x0 + (x1 - x0) * 0.2, y0); ctx.lineTo(x0 + (x1 - x0) * 0.02, y1); ctx.lineTo(x0 - (x1 - x0) * 0.1, y1); ctx.fill();
    ctx.restore();
  }
  drawFrame(ctx) {
    const M = this.def.box, side = this.camMode === "side", th = this.th, c = this.cam, t = this.clock;
    // わくは ガラスの 面（まえ: z=0・よこ: x=W）の 上に 描く
    const F = (u, v) => (side ? c.p(M.w, v, u) : c.p(u, v, 0)), L = side ? M.d : M.w;
    const pw = 5, top = M.h, sign = 12, bot = -12;
    const quadUV = (u0, v0, u1, v1) => [F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)];
    // はしら
    for (const [u0, u1] of [[-pw, 0], [L, L + pw]]) {
      const q = quadUV(u0, bot, u1, top + sign), g = ctx.createLinearGradient(q[0][0], 0, q[1][0], 0); g.addColorStop(0, th.body2); g.addColorStop(0.5, th.body); g.addColorStop(1, th.body2);
      this.poly(ctx, q, g, INK, 2);
      for (let k = 0; k < 9; k++) { const v = bot + 3 + ((top + sign - bot - 6) * k) / 8, p = F((u0 + u1) / 2, v), hue = (k * 40 + t * 120) % 360; ctx.fillStyle = `hsl(${hue},85%,72%)`; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(2, c.s(0.9, p[2])), 0, 7); ctx.fill(); }
    }
    // したの パネル（とりだしぐち）
    const bq = quadUV(0, bot, L, 0), bg = ctx.createLinearGradient(0, bq[3][1], 0, bq[0][1]); bg.addColorStop(0, th.body); bg.addColorStop(1, th.body2);
    this.poly(ctx, bq, bg, INK, 2);
    const ch = this.def.chute, door = side ? null : ch ? [ch.x0 + 1, ch.x1 - 1] : this.round.type === "tripod" ? [M.w / 2 - 9, M.w / 2 + 9] : [M.w / 2 - 12, M.w / 2 + 12];
    if (door) {
      const dq = quadUV(door[0], bot + 3, door[1], -2); this.poly(ctx, dq, "#2A2238", INK, 2);
      this.poly(ctx, quadUV(door[0] + 1, bot + 3.8, door[1] - 1, -5), "rgba(200,235,255,0.25)", "rgba(255,255,255,0.7)", 1.2);
      const mid = F((door[0] + door[1]) / 2, bot + 1.1); ctx.fillStyle = "#FFF7E0"; ctx.font = `800 ${Math.max(8, c.s(2.2, mid[2]))}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("とりだしぐち", mid[0], mid[1] + 2);
      if (this.round.got.length) { const it = PrizeArcade.picture(this.i, this.round), img = SvgCache.get("crane:door:" + it, () => PrizeArcade.pictureSvg(it), 96, 96), m2 = F((door[0] + door[1]) / 2, bot / 2 + 1), sz = Math.min(Math.abs(dq[1][0] - dq[0][0]) * 0.8, Math.abs(dq[2][1] - dq[1][1]) * 1.1); if (img) ctx.drawImage(img, m2[0] - sz / 2, m2[1] - sz / 2, sz, sz); }
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,240,150,${this.flash * 0.6})`; this.poly(ctx, dq, ctx.fillStyle); }
    }
    // かんばん（まわる ライト）
    const sq = quadUV(-pw, top, L + pw, top + sign), sg = ctx.createLinearGradient(0, sq[3][1], 0, sq[0][1]); sg.addColorStop(0, th.body); sg.addColorStop(1, th.body2);
    this.poly(ctx, sq, sg, INK, 2.2);
    const inner = quadUV(-pw + 2, top + 2, L + pw - 2, top + sign - 2); this.poly(ctx, inner, "#FFF8EE", INK, 1.6);
    const n = 22;
    for (let k = 0; k < n; k++) { const u = -pw + 1.2 + ((L + pw * 2 - 2.4) * k) / (n - 1); for (const v of [top + 1.2, top + sign - 1.2]) { const p = F(u, v), on = (k + Math.floor(t * 6)) % 3 === 0; ctx.fillStyle = on ? "#FFF6B0" : th.trim; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, c.s(0.85, p[2])), 0, 7); ctx.fill(); if (on) { ctx.fillStyle = "rgba(255,246,176,0.35)"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(3.5, c.s(1.8, p[2])), 0, 7); ctx.fill(); } } }
    const mid = F(L / 2, top + sign / 2 - 0.2), fs = Math.max(11, Math.min(20, c.s(3.8, mid[2])));
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `900 ${fs}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = "#FFFFFF"; ctx.strokeText(th.sign, mid[0], mid[1] - fs * 0.25, Math.abs(inner[1][0] - inner[0][0]) - 10);
    ctx.fillStyle = this.shade(th.body2, -0.35); ctx.fillText(th.sign, mid[0], mid[1] - fs * 0.25, Math.abs(inner[1][0] - inner[0][0]) - 10);
    // デジタルの のこり（びょう・かい）
    const r = this.round, led = r.type === "claw" || r.type === "ring" ? String(Math.max(0, Math.ceil(r.phase === "move" ? r.time : 0))).padStart(2, "0") : r.type === "tripod" ? String(r.stops) : String(r.scoops);
    { const lp = F(L + pw - 2.6, top + sign / 2), lh = Math.max(14, c.s(sign - 5, lp[2])), lw = lh * (led.length > 1 ? 1.25 : 0.8);
      ctx.fillStyle = "#1B1426"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; U.rr(ctx, lp[0] - lw, lp[1] - lh / 2, lw, lh, 3); ctx.fill(); ctx.stroke();
      ctx.font = `900 ${lh * 0.72}px ui-monospace, Menlo, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#FF6B4A"; ctx.shadowColor = "#FF6B4A"; ctx.shadowBlur = 6; ctx.fillText(led, lp[0] - lw / 2, lp[1] + 1); ctx.shadowBlur = 0; }
    // チャンス メーター（3本アーム・2本アーム）
    if (this.round.type === "claw") {
      const miss = PrizeArcade.norm().miss[this.i] || 0, fill = this.finished ? miss : miss, ms = Math.max(8, fs * 0.55), y = mid[1] + fs * 0.55;
      ctx.font = `800 ${ms}px sans-serif`; ctx.fillStyle = INK; ctx.fillText("チャンス", mid[0] - ms * 3, y);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k < fill ? "#FF7BA8" : "#E6DDEA"; ctx.beginPath(); ctx.arc(mid[0] + ms * 0.2 + k * ms * 1.3, y, ms * 0.42, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); }
    } else if (this.round.type === "tripod") {
      const ms = Math.max(8, fs * 0.55), y = mid[1] + fs * 0.55; ctx.font = `800 ${ms}px sans-serif`; ctx.fillStyle = INK; ctx.fillText("アーム のこり " + this.round.rig.arms.filter((a) => a.up).length, mid[0], y);
    } else if (this.round.type === "sweet") {
      const ms = Math.max(8, fs * 0.55), y = mid[1] + fs * 0.55; ctx.font = `800 ${ms}px sans-serif`; ctx.fillStyle = INK; ctx.fillText("すくって おとして おしだそう", mid[0], y);
    }
    ctx.textBaseline = "alphabetic";
  }
  // 3にん（まえで みて いる。とれたら ふりむいて よろこぶ）
  drawParty(ctx) {
    const W = G.W, size = Math.min(50, W * 0.13), won = this.cheer > 0, sad = this.sad > 0, y = Math.min(this.view.y + this.view.h - 4, this.cam.bottom + size * 0.95);

    Save.d.order.forEach((id, k) => {
      const c = Save.d.chars[id], x = W / 2 + (k - 1) * size * 0.95, hop = won ? Math.abs(Math.sin(this.clock * 9 + k)) * 8 : Math.sin(this.clock * 2 + k) * 1.2;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x, y, size * 0.32, size * 0.1, 0, 0, 7); ctx.fill();
      Chara.draw(ctx, id, { pose: "idle_01", dir: won || sad ? "down" : "up", face: won ? "happy" : sad ? "sad" : "normal", outfit: c.outfit, color: c.color }, x, y - hop, size);
    });
  }
  drawFx(ctx) {
    const W = G.W, cy = this.view.y + this.view.h * 0.45;
    for (const f of this.fx) {
      if (f.k === "conf") { const k = f.t / f.life, x = W / 2 + Math.cos(f.a) * f.v * f.t * 1.6, y = cy + Math.sin(f.a) * f.v * f.t + 120 * f.t * f.t; ctx.fillStyle = f.c; ctx.globalAlpha = 1 - k; ctx.fillRect(x - 3, y - 2, 6, 4); ctx.globalAlpha = 1; }
      if (f.k === "get") {
        const k = f.t / f.life, s = 1 + Math.min(1, f.t * 5) * 0.2 - Math.max(0, f.t - 1.2) * 0.5;
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); ctx.translate(W / 2, cy - 20 * k); ctx.scale(s, s);
        ctx.font = "900 34px sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeText("ゲット！", 0, 0); ctx.fillStyle = "#FFE45C"; ctx.fillText("ゲット！", 0, 0);
        ctx.restore();
      }
    }
  }
}
// render の 中で つかう ctx（acrylic などの 小さな 関数へ）
(() => { const r = CraneScene.prototype.render; CraneScene.prototype.render = function (ctx) { this._ctx = ctx; return r.call(this, ctx); }; })();
SCENES.prize = CraneScene;

// ---- こうかおん（WebAudio で その場で つくる）----
const CraneSE = {
  crane_go: (S, T) => { T({ f: 660, dur: 0.06, type: "pulse", vol: 0.13 }); T({ f: 990, t: 0.07, dur: 0.1, type: "pulse", vol: 0.13 }); },
  crane_motor: (S, T) => { T({ f: 118, f2: 126, dur: 0.14, type: "sawtooth", vol: 0.045 }); },
  crane_down: (S, T) => { T({ f: 520, f2: 180, dur: 0.9, type: "triangle", vol: 0.09 }); T({ f: 96, dur: 0.9, type: "sawtooth", vol: 0.03 }); },
  crane_up: (S, T) => { T({ f: 200, f2: 560, dur: 1.0, type: "triangle", vol: 0.08 }); T({ f: 100, dur: 1, type: "sawtooth", vol: 0.03 }); },
  crane_clack: (S, T, N) => { N({ dur: 0.05, vol: 0.28, freq: 1600, q: 3 }); T({ f: 240, f2: 120, dur: 0.07, type: "square", vol: 0.08 }); },
  crane_loose: (S, T) => { T({ f: 400, f2: 300, dur: 0.18, type: "triangle", vol: 0.08 }); },
  crane_thud: (S, T, N) => { T({ f: 150, f2: 55, dur: 0.22, type: "sine", vol: 0.34 }); N({ dur: 0.12, vol: 0.2, freq: 500, q: 0.8 }); },
  crane_candy: (S, T) => { T({ f: 1480, dur: 0.05, type: "square", vol: 0.08 }); T({ f: 1976, t: 0.06, dur: 0.12, type: "square", vol: 0.08 }); },
  crane_win: (S, T) => { ["C5", "E5", "G5", "C6", "E6", "G6", "C7"].forEach((n, i) => T({ f: S.freq(n), t: i * 0.07, dur: i === 6 ? 0.5 : 0.07, type: "pulse", vol: 0.11 })); },
  crane_tick: (S, T) => { T({ f: 1900, dur: 0.018, type: "square", vol: 0.035 }); },
  crane_hit: (S, T) => { T({ f: 880, dur: 0.07, type: "pulse", vol: 0.12 }); T({ f: 1320, t: 0.08, dur: 0.16, type: "pulse", vol: 0.12 }); },
  crane_miss: (S, T) => { T({ f: 330, f2: 250, dur: 0.2, type: "triangle", vol: 0.12 }); },
  crane_arm: (S, T, N) => { N({ dur: 0.08, vol: 0.3, freq: 900, q: 2 }); T({ f: 180, f2: 70, t: 0.03, dur: 0.18, type: "square", vol: 0.1 }); },
  crane_scoop: (S, T, N) => { N({ dur: 0.25, vol: 0.18, freq: 1200, f2: 2600, q: 1.4 }); },
};
(() => {
  const se = Sound.se;
  Sound.se = function (name) {
    const fx = CraneSE[name];
    if (!fx) return se.call(this, name);
    if (!this.ctx || !Save.d || !Save.d.settings.se) return;
    const d = this.seGain; fx(this, (o) => this.tone(d, o), (o) => this.noise(d, o));
  };
})();

// 店内の 台の 絵は js/arcade-art.js（ArcadeArt・斜め上から 見る 館）。
