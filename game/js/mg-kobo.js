// パズルの おてつだい「パズル こうぼう」（ネリカスタウン・UI-65。オーナーの 依頼 2026-10-03「パズル系も同様〔異なるゲーム3種で選択できる〕」）。
// おみせで「おてつだいする」→ 3しゅから えらぶ（KoboGames.choose・ShopScene の variant）→ おきゃくさん 1にんに 1もん。
//  ・スライド パズル（KoboSlideTask）: ばらばらの え（3×3・Lv.5 は 4×4）。あいた ところと おなじ れつの いたを タップして もとに もどす
//  ・かたち はめ（KoboShapeTask）: ピースを ゆびで はこんで おなじ かたちの あなへ（Lv.3 から タップで まわす・Lv.4 から にた かたち・Lv.5 は おおきさ ちがい）
//  ・おえかき ロジック（KoboLogicTask）: よこと たての すうじの ヒントで ますを ぬると えが でる（5×5・Lv.4 から 6×6。ちがう ますは ばつ）
// 店主は はりねずみの チクタさん。絵は js/kobo-art.js（KoboArt）。店内・かんばん・BGM・町の お店（KoboTown）も ここで 登録する。
const KOBO_FONT = "'M PLUS Rounded 1c', sans-serif";
// ゲームを えらぶ ところ・せつめいは あたまの たいそうと おなじ しくみ（js/mg-brain.js の BrainGames）
const KoboGames = Object.assign(Object.create(BrainGames), {
  shop: "kobo",
  ASK: "きょうは どの パズルに する？",
  GAMES: [
    { id: "slide", name: "スライド パズル", desc: "えを ならべなおす",
      howto: ["スライド パズルは、ばらばらに なった\nえを もとに もどすよ。", "あいて いる ところと おなじ れつの\nいたを タップすると、すっと うごくよ。", "したの おてほんを みてね。\nすくない てかずで できると はなまる！"] },
    { id: "shape", name: "かたち はめ", desc: "かたちを あなに いれる",
      howto: ["かたち はめは、したの ピースを\nおなじ かたちの あなに いれるよ。", "ピースを ゆびで はこんで、あなの うえで\nはなしてね。ちがう あなだと もどるよ。", "むきが ちがう ピースは、タップすると\nくるっと まわるよ。"] },
    { id: "logic", name: "おえかき ロジック", desc: "すうじで ぬりえ",
      howto: ["おえかき ロジックは、すうじの ヒントで\nますを ぬると、えが でて くるよ。", "すうじは つづけて ぬる ますの かず。\n2つ あったら あいだを 1つ いじょう あけるよ。", "ちがう ますを ぬると ばつが つくよ。\nゆびで なぞると まとめて ぬれるよ。"] },
  ],
  HELLO: "パズル こうぼうへ ようこそ チク。\nおきゃくさんの パズルを いっしょに といてね。",
});

// ---- スライド パズル ----
class KoboSlideTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    // [いたの かず（n×n）, いちばん すくない てかずの はんい]
    const [n, lo, hi] = [[3, 3, 4], [3, 5, 7], [3, 8, 10], [3, 11, 13], [4, 10, 12]][lv - 1];
    this.n = n; this.N = n * n; this.blank = this.N - 1;
    this.pic = KoboSlideTask.nextPic();
    const { tiles, par } = KoboSlideTask.shuffle(n, lo, hi);
    this.tiles = tiles; this.par = par; this.allow = Math.ceil(par * 1.5) + 4;
    this.moves = 0; this.hints = 0; this.hintT = 0; this.hintPos = -1; this.done = false; this.doneAt = 0; this.nudge = null;
    this.disp = []; this.place();
    for (let id = 0; id < this.N; id++) this.disp[id] = { ...this.goal[id] };
    this.timeLimit = [35, 40, 50, 60, 70][lv - 1]; this.title = "えを もとに もどして！";
  }
  // おきゃくさんごとに ちがう え（3まいを じゅんばんに）
  static nextPic() { const ids = KoboArt.PIC_IDS; KoboSlideTask.picN = ((KoboSlideTask.picN ?? U.randi(0, ids.length - 1)) + 1) % ids.length; return ids[KoboSlideTask.picN]; }
  static nbrs(p, n) { const r = (p / n) | 0, c = p % n, out = []; if (r > 0) out.push(p - n); if (r < n - 1) out.push(p + n); if (c > 0) out.push(p - 1); if (c < n - 1) out.push(p + 1); return out; }
  // いちばん すくない てかず（IDA*・マンハッタン きょり）。path は うごかす いたの ばしょの じゅん。とおすぎる・ながすぎる ときは null
  static solve(tiles, n, max = 34, limit = 250000) {
    const N = n * n, B = N - 1, t = [...tiles], path = [];
    const man = (id, p) => Math.abs((id % n) - (p % n)) + Math.abs(((id / n) | 0) - ((p / n) | 0));
    let h0 = 0; for (let p = 0; p < N; p++) if (t[p] !== B) h0 += man(t[p], p);
    if (!h0) return { length: 0, path: [] };
    let bound = h0, nodes = 0;
    const dfs = (b, g, h, prev) => {
      if (g + h > bound) return g + h;
      if (!h) return -1;
      if (++nodes > limit) return Infinity;
      let min = Infinity;
      for (const p of KoboSlideTask.nbrs(b, n)) {
        if (p === prev) continue;
        const id = t[p];
        t[b] = id; t[p] = B; path.push(p);
        const r = dfs(p, g + 1, h - man(id, p) + man(id, b), b);
        if (r === -1) return -1;
        path.pop(); t[p] = id; t[b] = B;
        if (r < min) min = r;
      }
      return min;
    };
    for (;;) {
      const r = dfs(tiles.indexOf(B), 0, h0, -1);
      if (r === -1) return { length: path.length, path: [...path] };
      if (nodes > limit || r === Infinity || r > max) return null;
      bound = r;
    }
  }
  // かんせいから でたらめに うごかして、いちばん すくない てかずが [lo, hi] の ものを えらぶ（かならず とける ならび）
  static shuffle(n, lo, hi) {
    const N = n * n, mid = (lo + hi) / 2;
    let best = null;
    for (let i = 0; i < 80; i++) {
      const t = [...Array(N).keys()];
      let b = N - 1, prev = -1;
      for (let s = U.randi(lo, hi + 3); s > 0; s--) { const p = U.pick(KoboSlideTask.nbrs(b, n).filter((q) => q !== prev)); t[b] = t[p]; t[p] = N - 1; prev = b; b = p; }
      const sol = KoboSlideTask.solve(t, n, hi + 2);
      if (!sol || !sol.length) continue;
      if (sol.length >= lo && sol.length <= hi) return { tiles: t, par: sol.length };
      if (!best || Math.abs(sol.length - mid) < Math.abs(best.par - mid)) best = { tiles: t, par: sol.length };
    }
    return best || { tiles: [...Array(N).keys()].map((q, i, a) => (i === N - 2 ? N - 1 : i === N - 1 ? N - 2 : q)), par: 1 };
  }
  // いたの いまの ばしょ（goal[いた] = { c, r }）
  place() { this.goal = []; this.tiles.forEach((id, p) => (this.goal[id] = { c: p % this.n, r: (p / this.n) | 0 })); }
  get solved() { return this.tiles.every((id, p) => id === p); }
  placed() { return this.tiles.filter((id, p) => id === p && id !== this.blank).length; }
  layout(R) {
    this.R = R;
    // きの わく（はば m）ごと、うえの ことばと したの ボタンの あいだに おさめる
    const m = 7, top = R.y + 24, bottom = R.y + R.h - 58, s = Math.min(R.w - 2 * m - 4, bottom - top - 2 * m);
    this.board = { x: R.x + (R.w - s) / 2, y: top + (bottom - top - s) / 2, s, m };
    this.thumb = { x: R.x + R.w - 52, y: R.y + R.h - 50, s: 42 };
    this.btns = [{ x: R.x + 10, y: R.y + R.h - 52, w: 112, h: 46, label: "ヒント", fs: 15, inline: true, color: "#FFF3B0", icon: (ctx, x, y, s) => BrainArt.drawLens(ctx, x, y, s), cb: () => this.hint() }];
    KoboArt.picture(this.pic, Math.ceil(s * G.px)); // さきに よみこむ
  }
  center(p) { const { x, y, s } = this.board, k = s / this.n; return { x: x + ((p % this.n) + 0.5) * k, y: y + (((p / this.n) | 0) + 0.5) * k }; }
  cellAt(q) { const { x, y, s } = this.board; if (q.x < x || q.y < y || q.x >= x + s || q.y >= y + s) return -1; const k = s / this.n; return Math.floor((q.y - y) / k) * this.n + Math.floor((q.x - x) / k); }
  downArea(q) {
    if (this.done) return;
    const at = this.cellAt(q), n = this.n, b = this.tiles.indexOf(this.blank);
    if (at < 0 || at === b) return;
    const ar = (at / n) | 0, ac = at % n, br = (b / n) | 0, bc = b % n;
    if (ar !== br && ac !== bc) { this.nudge = { pos: at, t: 0.3 }; Sound.se("tap"); return; } // あいた ところと おなじ れつ では ない
    // あいた ところまでの いたを まとめて 1つずつ ずらす（てかずは うごいた いたの かず）
    const step = ar === br ? Math.sign(ac - bc) : Math.sign(ar - br) * n;
    for (let cur = b; cur !== at; cur += step) { this.tiles[cur] = this.tiles[cur + step]; this.tiles[cur + step] = this.blank; this.moves++; }
    this.place(); this.hintT = 0; Sound.se("pop");
    // できあがりの うごきは G.t で（おわると ShopScene は tick を よばない ので、いたは いまの ばしょに そろえる）
    if (this.solved) { this.done = true; this.doneAt = G.t; this.goal.forEach((g, id) => (this.disp[id] = { ...g })); Sound.se("sparkle"); this.sc.finish(this.score()); }
  }
  // つぎに うごかす いた（いちばん すくない てかずの 1て め。とおすぎる ときは ちかづく いた）
  nextMove() {
    const key = this.tiles.join();
    if (this.solKey !== key) { this.solKey = key; const s = KoboSlideTask.solve(this.tiles, this.n, this.n === 3 ? 31 : 40); this.sol = s ? s.path : null; }
    if (this.sol) return this.sol.length ? this.sol[0] : -1;
    const b = this.tiles.indexOf(this.blank), man = (id, p) => Math.abs((id % this.n) - (p % this.n)) + Math.abs(((id / this.n) | 0) - ((p / this.n) | 0));
    return KoboSlideTask.nbrs(b, this.n).sort((p, q) => man(this.tiles[p], b) - man(this.tiles[p], p) - (man(this.tiles[q], b) - man(this.tiles[q], q)))[0];
  }
  hint() {
    if (this.done || this.hintT > 0) return;
    const p = this.nextMove();
    if (p < 0) return;
    this.hints++; this.hintPos = p; this.hintT = 2.2;
  }
  tick(dt) {
    const k = Math.min(1, dt * 18);
    for (let id = 0; id < this.N; id++) { const d = this.disp[id], g = this.goal[id]; d.c += (g.c - d.c) * k; d.r += (g.r - d.r) * k; }
    if (this.hintT > 0) this.hintT -= dt;
    if (this.nudge && (this.nudge.t -= dt) <= 0) this.nudge = null;
  }
  score() {
    const pen = this.sc.timePenalty();
    if (!this.done) return (60 * this.placed()) / (this.N - 1) - this.hints * 10 - pen;
    return 100 - Math.max(0, this.moves - this.allow) * 2.5 - this.hints * 10 - pen;
  }
  timeout() { return Math.min(40, this.score() - 20); }
  draw(ctx) {
    const R = this.R, { x, y, s, m } = this.board, n = this.n, k = s / n, pic = KoboArt.picture(this.pic, Math.ceil(s * G.px));
    ctx.save();
    // きの わく
    ctx.fillStyle = "#C9935B"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, x - m, y - m, s + m * 2, s + m * 2, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#7A5638"; U.rr(ctx, x - 2, y - 2, s + 4, s + 4, 6); ctx.fill();
    if (this.done && pic) {
      // できあがり: いたの さかいめが きえて 1まいの えに
      const u = G.t - this.doneAt;
      ctx.save(); U.rr(ctx, x, y, s, s, 6); ctx.clip(); ctx.drawImage(pic, x, y, s, s); ctx.restore();
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u / 0.5); this.drawTiles(ctx, pic, k); ctx.restore();
      if (u < 1.2) FX.sparkles(ctx, x + s / 2, y + s * 0.2, u / 1.2);
    } else this.drawTiles(ctx, pic, k);
    // ヒント: つぎに うごかす いたが ひかる
    if (this.hintT > 0 && this.hintPos >= 0) {
      const id = this.tiles[this.hintPos], d = this.disp[id], pulse = 1 + Math.sin(G.t * 9) * 0.06;
      ctx.save(); ctx.translate(x + (d.c + 0.5) * k, y + (d.r + 0.5) * k); ctx.scale(pulse, pulse);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = "#F2A93B"; ctx.lineWidth = 4; U.rr(ctx, -k / 2 + 3, -k / 2 + 3, k - 6, k - 6, 8); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 13px ${KOBO_FONT}`;
    ctx.fillText(this.done ? "できた！ もとの えに なったよ" : "あいた ところと おなじ れつの いたを タップ", R.x + R.w / 2, R.y + 14, R.w - 16);
    // てかず・めやす と おてほん
    const mx = (R.x + 130 + this.thumb.x - 52) / 2, my = R.y + R.h - 29;
    ctx.font = `900 16px ${KOBO_FONT}`; ctx.fillStyle = this.moves > this.allow ? "#E5533D" : INK; ctx.fillText(`てかず ${this.moves}`, mx, my - 9, 100);
    ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillStyle = INK; ctx.fillText(`めやす ${this.allow} まで`, mx, my + 11, 100);
    const T = this.thumb;
    ctx.textAlign = "right"; ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillText("おてほん", T.x - 6, T.y + T.s / 2, 52);
    ctx.fillStyle = "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, T.x - 2, T.y - 2, T.s + 4, T.s + 4, 6); ctx.fill(); ctx.stroke();
    if (pic) { ctx.save(); U.rr(ctx, T.x, T.y, T.s, T.s, 4); ctx.clip(); ctx.drawImage(pic, T.x, T.y, T.s, T.s); ctx.restore(); }
    ctx.restore();
  }
  drawTiles(ctx, pic, k) {
    const { x, y } = this.board, n = this.n, src = pic ? pic.width / n : 0;
    for (let id = 0; id < this.N; id++) {
      if (id === this.blank) continue;
      const d = this.disp[id], shake = this.nudge && this.tiles[this.nudge.pos] === id ? Math.sin(this.nudge.t * 60) * 3 : 0;
      const tx = x + d.c * k + 2 + shake, ty = y + d.r * k + 2, w = k - 4;
      ctx.save(); U.rr(ctx, tx, ty, w, w, 7); ctx.clip();
      if (pic) ctx.drawImage(pic, (id % n) * src, ((id / n) | 0) * src, src, src, tx - 2, ty - 2, k, k);
      else { ctx.fillStyle = ["#FFE0B2", "#C8E6C9", "#BBDEFB", "#F8BBD0"][id % 4]; ctx.fillRect(tx, ty, w, w); }
      // いたの つや（うえと ひだり）
      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillRect(tx, ty, w, 4); ctx.fillRect(tx, ty, 4, w);
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, tx, ty, w, w, 7); ctx.stroke();
      // ばんごうの ふだ（ひだり うえ）
      const r = Math.max(8, k * 0.12), bx = tx + r + 3, by = ty + r + 3;
      ctx.fillStyle = "rgba(255,253,246,0.94)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `900 ${Math.round(r * 1.25)}px ${KOBO_FONT}`; ctx.fillText(String(id + 1), bx, by + 0.5);
    }
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(40, h * 0.62), pic = KoboArt.picture(this.pic, Math.ceil(s * G.px)), px = x + 6, py = y + h * 0.44 - s / 2;
    ctx.fillStyle = "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; U.rr(ctx, px - 2, py - 2, s + 4, s + 4, 5); ctx.fill(); ctx.stroke();
    if (pic) { ctx.save(); U.rr(ctx, px, py, s, s, 3); ctx.clip(); ctx.drawImage(pic, px, py, s, s); ctx.restore(); }
    ctx.strokeStyle = "rgba(31,29,27,0.45)"; ctx.lineWidth = 1;
    for (let i = 1; i < this.n; i++) { ctx.beginPath(); ctx.moveTo(px + (s * i) / this.n, py); ctx.lineTo(px + (s * i) / this.n, py + s); ctx.moveTo(px, py + (s * i) / this.n); ctx.lineTo(px + s, py + (s * i) / this.n); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${KOBO_FONT}`; ctx.fillText(KoboArt.PICTURES[this.pic][0], x + w * 0.64, y + h * 0.26, w - 56);
    ctx.font = `900 20px ${KOBO_FONT}`; ctx.fillText(`${this.n}×${this.n}`, x + w * 0.64, y + h * 0.56);
    ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillText("なおしてね！", x + w * 0.64, y + h * 0.84, w - 56);
    ctx.restore();
  }
  debug(css) {
    const b = this.tiles.indexOf(this.blank), next = this.done ? -1 : this.nextMove();
    return { game: "slide", n: this.n, pic: this.pic, par: this.par, allow: this.allow, moves: this.moves, hints: this.hints, done: this.done, placed: this.placed(), blank: b, tiles: [...this.tiles],
      hintPos: this.hintT > 0 ? this.hintPos : -1, next: next < 0 ? null : css(this.center(next).x, this.center(next).y),
      // いちばん すくない てかずで とく ときに タップする ところ（テスト用）
      path: this.done || !this.sol ? [] : this.sol.map((p) => css(this.center(p).x, this.center(p).y)),
      far: (() => { const f = [...Array(this.N).keys()].find((p) => p !== b && (p % this.n) !== (b % this.n) && ((p / this.n) | 0) !== ((b / this.n) | 0)); return f === undefined ? null : css(this.center(f).x, this.center(f).y); })() };
  }
}

// ---- かたち はめ ----
// にて いる かたちの くみ（Lv.4 から 1くみ まぜる）と、Lv.1 の わかりやすい かたち
const KOBO_SIMILAR = [["triangle", "rtri"], ["circle", "hexagon"], ["heart", "drop"], ["square", "diamond"], ["semi", "drop"], ["house", "arrow"]];
const KOBO_EASY = ["circle", "square", "triangle", "star", "heart", "house", "cross", "diamond"];
class KoboShapeTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    // [あなの かず, まわす ピースの かず, にた かたちの くみ, おおきさ ちがいの ふたご]
    const [k, turns, similar, twin] = [[3, 0, 0, 0], [4, 0, 0, 0], [4, 2, 0, 0], [5, 3, 1, 0], [6, 4, 1, 1]][lv - 1];
    const slots = [], used = new Set();
    const clash = (x) => KOBO_SIMILAR.some(([a, b]) => (a === x && used.has(b)) || (b === x && used.has(a)));
    for (const pair of U.shuffle(KOBO_SIMILAR.map((p) => [...p]))) {
      if (slots.length >= similar * 2) break;
      if (pair.some((x) => used.has(x) || clash(x))) continue;
      for (const x of pair) { slots.push({ kind: x, size: 1 }); used.add(x); }
    }
    const pick = () => { const x = U.shuffle(KoboArt.KINDS.filter((q) => !used.has(q) && !clash(q) && (lv > 1 || KOBO_EASY.includes(q))))[0]; used.add(x); return x; };
    if (twin) { const x = pick(); slots.push({ kind: x, size: 1 }, { kind: x, size: 0.68 }); }
    while (slots.length < k) slots.push({ kind: pick(), size: 1 });
    this.k = k; this.rotate = turns > 0;
    this.holes = U.shuffle(slots).map((q) => ({ ...q, q: KoboArt.rots(q.kind) > 1 ? U.randi(0, 3) : 0, filled: false }));
    const turnable = U.shuffle(this.holes.map((h, i) => i).filter((i) => KoboArt.rots(this.holes[i].kind) > 1)), need = new Set(turnable.slice(0, turns));
    // ピース: あなと おなじ じゅんばん（hole）。トレーの ならびは まぜる
    this.pieces = this.holes.map((h, i) => { const off = need.has(i) ? U.randi(1, KoboArt.rots(h.kind) - 1) : 0, turn = h.q + off; return { kind: h.kind, size: h.size, hole: i, turn, q: turn % 4, ang: (turn * Math.PI) / 2, placed: false, x: 0, y: 0, hx: 0, hy: 0, wob: 0 }; });
    this.slotOf = U.shuffle(this.pieces.map((p, i) => i));
    this.placedN = 0; this.misses = 0; this.wrongTurn = 0; this.drag = null; this.tip = null; this.pops = [];
    this.timeLimit = [30, 34, 40, 46, 52][lv - 1]; this.title = "かたちを はめて！";
  }
  layout(R) {
    this.R = R;
    const cols = Math.min(3, this.k), rows = Math.ceil(this.k / cols), top = R.y + 28, bottom = R.y + R.h - 6, mid = top + (bottom - top) * 0.52;
    this.boardR = { x: R.x + 6, y: top, w: R.w - 12, h: mid - top - 4 };
    this.trayR = { x: R.x + 6, y: mid + 4, w: R.w - 12, h: bottom - mid - 4 };
    const cell = (box, i) => { const c = i % cols, r = Math.floor(i / cols), inRow = Math.min(cols, this.k - r * cols); return { x: box.x + box.w / 2 + (c - (inRow - 1) / 2) * (box.w / cols), y: box.y + (r + 0.5) * (box.h / rows) }; };
    this.s = Math.min(this.boardR.w / cols, this.boardR.h / rows, this.trayR.h / rows) * 0.36;
    this.holes.forEach((h, i) => Object.assign(h, cell(this.boardR, i)));
    this.slotOf.forEach((pi, i) => { const p = this.pieces[pi], c = cell(this.trayR, i); p.hx = c.x; p.hy = c.y; if (!p.placed && this.drag?.p !== p) { p.x = c.x; p.y = c.y; } else if (p.placed) { p.x = this.holes[p.hole].x; p.y = this.holes[p.hole].y; } });
    this.btns = [];
  }
  get placed() { return this.placedN; }
  turnsTo(p, h) { const r = KoboArt.rots(p.kind); return (((h.q - p.q) % r) + r) % r; }
  pickAt(q) {
    let best = null, bd = Infinity;
    for (const p of this.pieces) {
      if (p.placed) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y), r = Math.max(24, this.s * p.size * 1.15);
      if (d <= r && d < bd) { best = p; bd = d; }
    }
    return best;
  }
  downArea(q) {
    if (this.placedN >= this.k || this.drag) return;
    const p = this.pickAt(q);
    if (!p) return;
    this.drag = { p, ox: q.x - p.x, oy: q.y - p.y, sx: q.x, sy: q.y, moved: false };
    Sound.se("tap");
  }
  move(q) {
    const d = this.drag;
    if (!d || !q) return;
    if (Math.hypot(q.x - d.sx, q.y - d.sy) > 7) d.moved = true;
    if (d.moved) { d.p.x = q.x - d.ox; d.p.y = q.y - d.oy; }
  }
  up(q, canceled = false) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (canceled) return;
    const p = d.p;
    if (!d.moved) {
      // タップ: くるっと まわす（Lv.3 から）
      if (this.rotate) { p.turn++; p.q = p.turn % 4; Sound.se("pop"); }
      else p.wob = 0.35;
      return;
    }
    // いちばん ちかい あいた あなへ
    let hole = null, hd = Infinity;
    for (const h of this.holes) { if (h.filled) continue; const dd = Math.hypot(p.x - h.x, p.y - h.y); if (dd < Math.max(26, this.s * h.size * 1.1) && dd < hd) { hole = h; hd = dd; } }
    if (!hole) return; // トレーに もどる（tick）
    if (hole.kind === p.kind && hole.size === p.size) {
      if (this.turnsTo(p, hole) === 0) {
        hole.filled = true; p.placed = true; p.x = hole.x; p.y = hole.y; p.ang = (p.turn * Math.PI) / 2; p.wob = 0; this.placedN++; this.pops.push({ x: hole.x, y: hole.y, t0: G.t });
        Sound.se("good");
        if (this.placedN >= this.k) { Sound.se("sparkle"); this.sc.finish(this.score()); }
        return;
      }
      this.wrongTurn++; this.tip = { text: "むきが ちがうよ。タップで まわしてね", x: hole.x, y: hole.y, t: 1.6 }; Sound.se("tap"); return;
    }
    this.misses++;
    this.tip = { text: hole.kind === p.kind ? "おおきさが ちがうよ" : "かたちが ちがうよ", x: hole.x, y: hole.y, t: 1.2 };
    this.sc.mistake(hole.kind === p.kind ? "おおきさが ちがうよ" : "かたちが ちがうよ");
  }
  tick(dt) {
    const k = Math.min(1, dt * 14);
    for (const p of this.pieces) {
      const target = (p.turn * Math.PI) / 2;
      p.ang += (target - p.ang) * Math.min(1, dt * 16);
      if (p.wob > 0) p.wob -= dt;
      if (!p.placed && this.drag?.p !== p) { p.x += (p.hx - p.x) * k; p.y += (p.hy - p.y) * k; }
    }
    if (this.tip && (this.tip.t -= dt) <= 0) this.tip = null;
    this.pops = this.pops.filter((m) => G.t - m.t0 < 0.8);
  }
  score() { return (100 * this.placedN) / this.k - this.misses * 6 - this.sc.timePenalty(); }
  timeout() { return Math.min(40, this.score() - 20); }
  piece(ctx, p, lift = 0) {
    const s = this.s * p.size, wob = p.wob > 0 ? Math.sin(p.wob * 40) * 0.12 : 0;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang - (p.turn * Math.PI) / 2 + wob);
    KoboArt.drawPiece(ctx, p.kind, p.q, 0, 0, s, { lift });
    ctx.restore();
  }
  draw(ctx) {
    const R = this.R, B = this.boardR, T = this.trayR;
    ctx.save();
    // あなの ある きの いた・ピースの トレー
    ctx.fillStyle = "#D9A066"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, B.x, B.y, B.w, B.h, 14); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(122,86,56,0.35)"; ctx.lineWidth = 1.5;
    for (let i = 1; i < 5; i++) { const yy = B.y + (B.h * i) / 5; ctx.beginPath(); ctx.moveTo(B.x + 10, yy); ctx.bezierCurveTo(B.x + B.w * 0.3, yy - 3, B.x + B.w * 0.7, yy + 3, B.x + B.w - 10, yy); ctx.stroke(); }
    ctx.fillStyle = "#F3E3C6"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, T.x, T.y, T.w, T.h, 14); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = "#C9A27A"; U.rr(ctx, T.x + 6, T.y + 6, T.w - 12, T.h - 12, 10); ctx.stroke(); ctx.restore();
    for (const h of this.holes) KoboArt.drawHole(ctx, h.kind, h.q, h.x, h.y, this.s * h.size * 1.06);
    for (const p of this.pieces) if (p.placed) this.piece(ctx, p);
    for (const p of this.pieces) if (!p.placed && this.drag?.p !== p) this.piece(ctx, p);
    if (this.drag) this.piece(ctx, this.drag.p, 6);
    for (const m of this.pops) { const u = (G.t - m.t0) / 0.8; if (u < 1) { ctx.save(); ctx.globalAlpha = 1 - u; FX.sparkles(ctx, m.x, m.y, u); ctx.restore(); } } // はまった きらきら（さいごの 1つは おわった あとも G.t で うごく）
    if (this.tip) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.tip.t / 0.3); ctx.font = `800 12px ${KOBO_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const tw = Math.min(R.w - 20, ctx.measureText(this.tip.text).width + 22), tx = U.clamp(this.tip.x, R.x + 10 + tw / 2, R.x + R.w - 10 - tw / 2), ty = Math.max(B.y + 16, this.tip.y - this.s * 1.4);
      ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.strokeStyle = "#5C6BC0"; ctx.lineWidth = 2; U.rr(ctx, tx - tw / 2, ty - 14, tw, 28, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3F4A99"; ctx.fillText(this.tip.text, tx, ty + 1, tw - 12); ctx.restore();
    }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 13px ${KOBO_FONT}`;
    const say = this.placedN >= this.k ? "ぜんぶ はまった！" : this.rotate ? "ピースを あなへ（タップで まわる）" : "ピースを おなじ かたちの あなへ";
    ctx.fillText(say, R.x + R.w / 2 - 22, R.y + 14, R.w - 70);
    ctx.font = `900 13px ${KOBO_FONT}`; ctx.textAlign = "right"; ctx.fillText(`${this.placedN} / ${this.k}`, R.x + R.w - 10, R.y + 14);
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(10, h * 0.16);
    this.holes.slice(0, 3).forEach((q, i) => KoboArt.drawPiece(ctx, q.kind, q.q, x + 14 + (i % 2) * 18, y + h * 0.26 + i * h * 0.24, s));
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${KOBO_FONT}`; ctx.fillText("かたちを", x + w * 0.64, y + h * 0.26, w - 56);
    ctx.font = `900 22px ${KOBO_FONT}`; ctx.fillText(this.k + "つ", x + w * 0.64, y + h * 0.56);
    ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillText("はめてね！", x + w * 0.64, y + h * 0.84, w - 56);
    ctx.restore();
  }
  debug(css) {
    return { game: "shape", total: this.k, placed: this.placedN, misses: this.misses, wrongTurn: this.wrongTurn, rotate: this.rotate, dragging: !!this.drag, tip: this.tip ? this.tip.text : "",
      holes: this.holes.map((h) => ({ kind: h.kind, size: h.size, q: h.q, filled: h.filled, ...css(h.x, h.y) })),
      pieces: this.pieces.map((p) => ({ kind: p.kind, size: p.size, q: p.q, placed: p.placed, hole: p.hole, turns: this.turnsTo(p, this.holes[p.hole]), ...css(p.x, p.y) })) };
  }
}

// ---- おえかき ロジック ----
class KoboLogicTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    // [もんだいの しゅるい, さいしょから ぬって ある ます]
    const [tier, pre] = [["easy", 3], ["easy", 1], ["normal", 0], ["big", 2], ["big", 0]][lv - 1];
    const [name, color, rows] = KoboLogicTask.pick(tier), C = KoboArt.clues(rows);
    this.name = name; this.color = color; this.sol = C.grid; this.rowClues = C.rows; this.colClues = C.cols;
    this.rows = this.sol.length; this.cols = this.sol[0].length;
    this.cell = this.sol.map((r) => r.map(() => 0)); // 0 まだ・1 ぬった・2 まちがい（ばつ）・3 おわった れつの のこり（うすい ばつ）
    this.total = this.sol.flat().filter(Boolean).length; this.found = 0; this.misses = 0; this.done = false; this.doneAt = 0; this.paint = null;
    for (const [x, y] of U.shuffle(this.sol.flatMap((r, y) => r.map((v, x) => (v ? [x, y] : null)).filter(Boolean))).slice(0, pre)) { this.cell[y][x] = 1; this.found++; }
    this.preset = this.found; this.lines();
    this.timeLimit = [45, 50, 60, 70, 80][lv - 1]; this.title = "おえかき ロジック おねがい！";
  }
  // おなじ もんだいが つづかない ように（さいきんの 4つを さける）
  static pick(tier) {
    const list = KoboArt.LOGIC[tier], recent = KoboLogicTask.recent || (KoboLogicTask.recent = []);
    const p = U.pick(list.filter((q) => !recent.includes(q[0])).length ? list.filter((q) => !recent.includes(q[0])) : list);
    recent.push(p[0]); if (recent.length > 4) recent.shift();
    return p;
  }
  // ぬりおわった れつ・ぎょうの すうじは うすく、のこりの ますに うすい ばつ
  lines() {
    this.rowDone = this.sol.map((r, y) => r.every((v, x) => !v || this.cell[y][x] === 1));
    this.colDone = this.sol[0].map((_, x) => this.sol.every((r, y) => !r[x] || this.cell[y][x] === 1));
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (!this.cell[y][x] && (this.rowDone[y] || this.colDone[x])) this.cell[y][x] = 3;
  }
  layout(R) {
    this.R = R;
    const mr = Math.max(...this.rowClues.map((c) => c.length)), mc = Math.max(...this.colClues.map((c) => c.length));
    // うえの ことばは ひだり うえの すみ（すうじの ない ところ）に かく ので、ますは たかさ いっぱい（6×6 でも 44px いじょう）
    const top = R.y + 6, bottom = R.y + R.h - 6;
    this.cw = Math.max(54, 12 + mr * 14); this.ch = Math.max(48, 6 + mc * 15);
    this.k = Math.floor(Math.min((R.w - 12 - this.cw) / this.cols, (bottom - top - this.ch) / this.rows, 58));
    const gw = this.cw + this.k * this.cols, gh = this.ch + this.k * this.rows;
    this.gx = Math.round(R.x + (R.w - gw) / 2 + this.cw); this.gy = Math.round(top + (bottom - top - gh) / 2 + this.ch);
    this.btns = [];
  }
  at(x, y) { return { x: this.gx + (x + 0.5) * this.k, y: this.gy + (y + 0.5) * this.k }; }
  hit(q) { if (!q) return null; const x = Math.floor((q.x - this.gx) / this.k), y = Math.floor((q.y - this.gy) / this.k); return x >= 0 && y >= 0 && x < this.cols && y < this.rows ? { x, y } : null; }
  downArea(q) {
    if (this.done) return;
    const c = this.hit(q);
    if (!c) return;
    this.paint = { a: c, last: c, axis: null };
    this.mark(c);
  }
  // なぞる: さいしょに うごいた ほう（よこ か たて）の 1れつ だけ ぬる。とばした ますも ぬる
  move(q) {
    const P = this.paint;
    if (!P || this.done) return;
    const raw = this.hit(q);
    if (!raw) return;
    if (!P.axis) { if (raw.y === P.a.y && raw.x !== P.a.x) P.axis = "row"; else if (raw.x === P.a.x && raw.y !== P.a.y) P.axis = "col"; else return; }
    const c = P.axis === "row" ? { x: raw.x, y: P.a.y } : { x: P.a.x, y: raw.y }, dx = Math.sign(c.x - P.last.x), dy = Math.sign(c.y - P.last.y);
    let cur = P.last;
    while ((cur.x !== c.x || cur.y !== c.y) && this.paint) { cur = { x: cur.x + dx, y: cur.y + dy }; this.mark(cur); }
    if (this.paint) this.paint.last = c;
  }
  up() { this.paint = null; }
  mark({ x, y }) {
    if (this.cell[y][x] || this.done) return;
    if (this.sol[y][x]) {
      this.cell[y][x] = 1; this.found++; Sound.se("pop"); this.lines();
      if (this.found >= this.total) { this.done = true; this.doneAt = G.t; this.paint = null; Sound.se("sparkle"); this.sc.finish(this.score()); } // できあがりの うごきは G.t で
      return;
    }
    this.cell[y][x] = 2; this.misses++; this.paint = null;
    this.sc.mistake("そこは ぬらないよ");
  }
  score() {
    const pen = this.sc.timePenalty();
    if (this.done) return 100 - this.misses * 6 - pen;
    return (60 * (this.found - this.preset)) / Math.max(1, this.total - this.preset) - this.misses * 6 - pen;
  }
  timeout() { return Math.min(40, this.score() - 20); }
  draw(ctx) {
    const R = this.R, { gx, gy, k, rows, cols } = this, W = k * cols, H = k * rows, u = this.done ? G.t - this.doneAt : 0, fade = this.done ? Math.min(1, u / 0.5) : 0;
    ctx.save();
    // すうじの ヒントの おび（いま なぞって いる れつは きいろ）
    ctx.fillStyle = "#FFF6E6"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    U.rr(ctx, gx - this.cw, gy, this.cw - 2, H, 8); ctx.fill(); ctx.stroke(); U.rr(ctx, gx, gy - this.ch, W, this.ch - 2, 8); ctx.fill(); ctx.stroke();
    const cur = this.paint?.last;
    if (cur) { ctx.fillStyle = "rgba(255,228,138,0.55)"; ctx.fillRect(gx - this.cw + 2, gy + cur.y * k + 1, this.cw - 6, k - 2); ctx.fillRect(gx + cur.x * k + 1, gy - this.ch + 2, k - 2, this.ch - 6); }
    ctx.textBaseline = "middle"; ctx.font = `900 14px ${KOBO_FONT}`;
    this.rowClues.forEach((c, y) => { ctx.fillStyle = this.rowDone[y] ? "#B5AFA6" : INK; ctx.textAlign = "center"; c.forEach((v, i) => ctx.fillText(String(v), gx - 10 - (c.length - 1 - i) * 14, gy + (y + 0.5) * k + 1)); });
    this.colClues.forEach((c, x) => { ctx.fillStyle = this.colDone[x] ? "#B5AFA6" : INK; ctx.textAlign = "center"; c.forEach((v, i) => ctx.fillText(String(v), gx + (x + 0.5) * k, gy - 11 - (c.length - 1 - i) * 15)); });
    // ひだり うえの すみ: のこりの かず
    const cx = gx - this.cw / 2 - 1, cy = gy - this.ch / 2 - 1;
    ctx.fillStyle = INK; ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillText(this.done ? "できた！" : "のこり", cx, cy - 9, this.cw - 6);
    ctx.font = `900 18px ${KOBO_FONT}`; ctx.fillStyle = this.done ? "#E5533D" : "#3F4A99"; ctx.fillText(this.done ? "◎" : String(this.total - this.found), cx, cy + 9, this.cw - 6);
    // ます
    ctx.fillStyle = "#FFFDF6"; ctx.fillRect(gx, gy, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = this.cell[y][x], px = gx + x * k, py = gy + y * k;
      if (v === 1) {
        ctx.fillStyle = "#5C6BC0"; ctx.fillRect(px + 1.5, py + 1.5, k - 3, k - 3);
        if (fade) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = this.color; ctx.fillRect(px, py, k, k); ctx.restore(); }
      } else if (v >= 2 && !fade) {
        const r = k * (v === 2 ? 0.26 : 0.18);
        ctx.strokeStyle = v === 2 ? "#E5533D" : "#C9C2B6"; ctx.lineWidth = v === 2 ? 3.4 : 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px + k / 2 - r, py + k / 2 - r); ctx.lineTo(px + k / 2 + r, py + k / 2 + r); ctx.moveTo(px + k / 2 + r, py + k / 2 - r); ctx.lineTo(px + k / 2 - r, py + k / 2 + r); ctx.stroke();
      }
    }
    if (!fade) {
      ctx.strokeStyle = "#D8CFC0"; ctx.lineWidth = 1;
      for (let i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(gx + i * k, gy); ctx.lineTo(gx + i * k, gy + H); ctx.stroke(); }
      for (let i = 1; i < rows; i++) { ctx.beginPath(); ctx.moveTo(gx, gy + i * k); ctx.lineTo(gx + W, gy + i * k); ctx.stroke(); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(gx, gy, W, H);
    // できあがり: えの なまえの ふだ（うえの すうじの おびの うえ。ますの まんなかは ShopScene の はんこが かさなる）
    if (this.done) {
      if (u < 1.2) FX.sparkles(ctx, gx + W / 2, gy + H * 0.3, u / 1.2);
      const say = `「${this.name}」が できた！`, bh = Math.min(40, this.ch - 6);
      ctx.save(); ctx.globalAlpha = fade; ctx.font = `900 17px ${KOBO_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const tw = Math.min(W - 4, ctx.measureText(say).width + 30), mx = gx + W / 2, my = gy - this.ch / 2 - 1;
      ctx.fillStyle = "rgba(255,255,255,0.97)"; ctx.strokeStyle = "#E5533D"; ctx.lineWidth = 3; U.rr(ctx, mx - tw / 2, my - bh / 2, tw, bh, bh / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#E5533D"; ctx.fillText(say, mx, my + 1, tw - 16); ctx.restore();
    }
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(40, h * 0.62), k = s / this.cols, px = x + 6, py = y + h * 0.44 - (k * this.rows) / 2;
    ctx.fillStyle = "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(px, py, s, k * this.rows); ctx.strokeRect(px, py, s, k * this.rows);
    // ふきだしの ます（こたえは みせない きまった もよう）
    ctx.fillStyle = "#5C6BC0";
    for (let yy = 0; yy < this.rows; yy++) for (let xx = 0; xx < this.cols; xx++) if ((xx + yy * 2) % 4 === 0) ctx.fillRect(px + xx * k + 0.8, py + yy * k + 0.8, k - 1.6, k - 1.6);
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${KOBO_FONT}`; ctx.fillText("おえかき ロジック", x + w * 0.64, y + h * 0.26, w - 56);
    ctx.font = `900 20px ${KOBO_FONT}`; ctx.fillText(`${this.cols}×${this.rows}`, x + w * 0.64, y + h * 0.56);
    ctx.font = `800 11px ${KOBO_FONT}`; ctx.fillText("ぬってね！", x + w * 0.64, y + h * 0.84, w - 56);
    ctx.restore();
  }
  debug(css) {
    const todo = [], empty = [];
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const c = this.at(x, y);
      if (this.sol[y][x] && this.cell[y][x] !== 1) todo.push({ x, y, ...css(c.x, c.y) });
      if (!this.sol[y][x] && !this.cell[y][x]) empty.push({ x, y, ...css(c.x, c.y) });
    }
    return { game: "logic", name: this.name, rows: this.rows, cols: this.cols, total: this.total, found: this.found, preset: this.preset, misses: this.misses, done: this.done,
      clues: { rows: this.rowClues, cols: this.colClues }, rowDone: [...this.rowDone], colDone: [...this.colDone], auto: this.cell.flat().filter((v) => v === 3).length, cellCss: this.k * G.cssPerUnit, todo, empty };
  }
}

// ShopScene は MG_TASKS[おみせ] を new する。パズル こうぼうは えらんだ ゲーム（sc.variant）の クラスを かえす
const KOBO_TASKS = { slide: KoboSlideTask, shape: KoboShapeTask, logic: KoboLogicTask };
KoboGames.tasks = KOBO_TASKS;
SHOP_GAMES.kobo = KoboGames;
function KoboTask(sc, lv) { return new (KOBO_TASKS[sc && sc.variant] || KoboSlideTask)(sc, lv); }
// おみせの おく（たなに パズルの はこ・ジグソーの ピース・いろの キューブ）
KoboTask.backdrop = (ctx, sc, W) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  const cols = ["#E57373", "#64B5F6", "#FFD54F", "#81C784", "#BA68C8"];
  for (let i = 0; i < 5; i++) {
    const x = W * 0.56 + i * (W * 0.085), c = cols[i];
    // うえの たな: パズルの はこ（ふたに ます め）
    ctx.fillStyle = c; ctx.fillRect(x - 9, 44, 18, 18); ctx.strokeRect(x - 9, 44, 18, 18);
    ctx.strokeStyle = "rgba(31,29,27,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, 44); ctx.lineTo(x - 3, 62); ctx.moveTo(x + 3, 44); ctx.lineTo(x + 3, 62); ctx.moveTo(x - 9, 50); ctx.lineTo(x + 9, 50); ctx.moveTo(x - 9, 56); ctx.lineTo(x + 9, 56); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // したの たな: ジグソーの ピースと キューブ
    if (i % 2) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 8, 108); ctx.lineTo(x - 2, 108); ctx.arc(x, 106, 3, Math.PI, 0); ctx.lineTo(x + 8, 108); ctx.lineTo(x + 8, 114); ctx.arc(x + 10, 116, 3, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x + 8, 124); ctx.lineTo(x - 8, 124); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { for (const [dx, dy, cc] of [[-6, 0, c], [6, 0, cols[(i + 2) % 5]], [0, -10, cols[(i + 4) % 5]]]) { ctx.fillStyle = cc; ctx.fillRect(x + dx - 5, 114 + dy - 5, 10, 10); ctx.strokeRect(x + dx - 5, 114 + dy - 5, 10, 10); } }
  }
  ctx.restore();
};
MG_TASKS.kobo = KoboTask;
SHOP_OWNERS.kobo = { sp: "hedgehog", col: "#F3E0C8", col2: "#9C7A5E", name: "はりねずみの チクタさん", outfit: { body: "apron", neck: "scarf_red" }, look: { brow: "soft", cheek: "pink" } };
HOWTO.kobo = (sc) => KoboGames.howto(sc && sc.variant); // ShopScene.flow が えらんだ ゲームで よぶ（js/minigames.js）
// かんばんの しるし: ジグソーの ピース
SIGN_ICON.kobo = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-8,-8 H-2.6 A3,3 0 1 1 2.6,-8 H8 V-2.6 A3,3 0 1 1 8,2.6 V8 H-8 Z" fill="#F2C14E" ${OS(1.5)}/><circle cx="-3" cy="2" r="1.4" fill="${INK}"/><path d="M-0.4,3.6 L3.4,-0.8" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/></g>`;
// 店内（10×12）: スライド パズルの がく・ジグソーの かべ・こうぼうの さぎょうだい・かたち はめの つくえ・いろの キューブ・おえかき ロジックの ボード
(() => {
  const r = (x, y, w, h, col, rr = 4) => StoreArt.rect(x, y, w, h, col, rr), p = (d, col = "none") => StoreArt.path(d, col), c = (x, y, rr, col) => StoreArt.dot(x, y, rr, col);
  const TILE = ["#F2C14E", "#E57373", "#64B5F6", "#81C784", "#BA68C8", "#FFB74D", "#4DB6AC", "#F48FB1"];
  const piece = (x, y, s, col) => `<path d="M${x},${y} h${s * 0.36} a${s * 0.14},${s * 0.14} 0 1 1 ${s * 0.28},0 h${s * 0.36} v${s * 0.36} a${s * 0.14},${s * 0.14} 0 1 1 0,${s * 0.28} v${s * 0.36} h-${s} Z" fill="${col}"/>`;
  const PROPS = {
    slideframe: () => { let a = r(26, 12, 168, 150, "#B98555", 10) + r(40, 26, 140, 122, "#7A5638", 4); for (let i = 0; i < 9; i++) if (i !== 8) a += r(44 + (i % 3) * 45, 30 + Math.floor(i / 3) * 38, 42, 34, TILE[i], 4) + `<text x="${65 + (i % 3) * 45}" y="${53 + Math.floor(i / 3) * 38}" text-anchor="middle" font-size="16" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" stroke="none">${i + 1}</text>`; return a + p("M60,162 L46,184 M160,162 L174,184"); },
    jigsawwall: () => r(16, 14, 188, 150, "#E9D7B8", 8) + piece(36, 34, 52, "#F2C14E") + piece(100, 30, 50, "#64B5F6") + piece(150, 70, 40, "#E57373") + piece(40, 100, 46, "#81C784") + piece(104, 102, 44, "#BA68C8") + c(60, 24, 4, "#E53935") + c(124, 22, 4, "#E53935") + c(168, 62, 4, "#E53935") + c(62, 92, 4, "#E53935") + c(126, 94, 4, "#E53935"),
    workbench: () => r(10, 92, 200, 18, "#C98A52", 3) + p("M22,110 V176 M198,110 V176 M22,150 H198") + r(30, 64, 60, 28, "#E8C38E", 3) + p("M36,72 h48 M36,82 h40") + r(104, 70, 36, 22, "#9CCC65", 3) + r(148, 56, 8, 36, "#8D6E63", 2) + r(140, 50, 24, 10, "#B0BEC5", 3) + piece(166, 68, 24, "#F2C14E") + c(60, 140, 10, "#64B5F6") + r(120, 132, 40, 14, "#FFD54F", 3),
    shapesorter: () => r(16, 96, 188, 16, "#D9A066", 3) + p("M26,112 V176 M194,112 V176") + r(30, 40, 160, 56, "#E8C38E", 8) + c(62, 68, 13, "#6D5D4B") + r(94, 55, 26, 26, "#6D5D4B", 2) + p("M152,54 L168,82 H136 Z", "#6D5D4B") + c(70, 132, 12, "#EF5350") + r(102, 120, 24, 24, "#42A5F5", 2) + p("M152,120 L166,146 H138 Z", "#66BB6A"),
    cubes: () => { let a = r(52, 150, 116, 18, "#B98555", 4) + p("M66,168 V186 M154,168 V186"); for (const [x, y, k] of [[64, 104, 0], [110, 104, 2], [87, 62, 4]]) a += r(x, y, 44, 44, TILE[k], 6) + p(`M${x + 15},${y} V${y + 44} M${x + 29},${y} V${y + 44} M${x},${y + 15} H${x + 44} M${x},${y + 29} H${x + 44}`); return a; },
    picross: () => { let a = r(28, 14, 164, 158, "#FFFDF6", 8); const heart = [".#.#.", "#####", "#####", ".###.", "..#.."]; heart.forEach((row, y) => [...row].forEach((v, x) => { a += r(60 + x * 24, 48 + y * 24, 22, 22, v === "#" ? "#EF5350" : "#FFFFFF", 2); })); a += `<text x="42" y="64" text-anchor="middle" font-size="12" font-family="sans-serif" font-weight="bold" fill="${INK}" stroke="none">1 1</text><text x="72" y="40" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="${INK}" stroke="none">2</text><text x="120" y="40" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="${INK}" stroke="none">4</text>`; return a + p("M60,172 V186 M160,172 V186"); },
  };
  const prop0 = StoreArt.prop.bind(StoreArt);
  StoreArt.prop = (kind) => (PROPS[kind] ? StoreArt.svg(PROPS[kind]()) : prop0(kind));
  STORE_INTERIORS.kobo = { wall: "#F4EBDD", floor: "#D8B88E", accent: "#E0A040", motif: "wood", caption: "とけた とき、すっきり！", fixtures: [
    ["slideframe", 0, 0, 3, 2, "スライド パズルの がく"], ["jigsawwall", 8, 0, 2, 2, "ジグソーの かべ"], ["workbench", 0, 5, 3, 2, "こうぼうの さぎょうだい"], ["shapesorter", 7, 5, 3, 2, "かたち はめの つくえ"], ["cubes", 0, 9, 2, 1, "いろの キューブ"], ["picross", 7, 9, 3, 1, "おえかき ロジックの ボード"]] };
})();
// 店内 BGM「からくり こうぼう」: この ゲームの ために つくった きょく（オルゴールと プラック・8小節）
SONGS.shop_kobo = { title: "からくり こうぼう", bpm: 108, key: "F", modern: true, groove: "pop", swing: 0.04, original: true, tracks: [
  { instrument: "pluck", vol: 0.17, gate: 0.7, pan: 0.14, notes: "F4 A4 C5 A4 F4 . C5 . | D5 C5 Bb4 A4 G4 . . . | E4 G4 C5 G4 E4 . Bb4 . | A4 G4 F4 G4 A4 . . . | F4 A4 C5 F5 E5 D5 C5 . | D5 . Bb4 . G4 A4 Bb4 . | A4 C5 G4 Bb4 E4 G4 C5 . | F4 . A4 . F4 . _ _" },
  { instrument: "mallet", vol: 0.08, gate: 0.6, pan: -0.16, notes: "_ _ _ _ C6 . _ _ | _ _ _ _ Bb5 . _ _ | _ _ _ _ C6 . _ _ | _ _ _ _ A5 . _ _ | _ _ _ _ A5 . C6 . | _ _ _ _ D6 . _ _ | _ _ _ _ Bb5 . G5 . | A5 . . . _ _ _ _" },
  { instrument: "epiano", vol: 0.1, gate: 0.8, pan: -0.22, notes: "F3+A3+C4 . . . _ F3+A3+C4 . . | G3+Bb3+D4 . . . _ G3+Bb3+D4 . . | C3+E3+G3+Bb3 . . . _ C3+E3+G3+Bb3 . . | F3+A3+C4 . . . _ F3+A3+C4 . . | F3+A3+C4 . . . _ F3+A3+C4 . . | Bb2+D3+F3 . . . _ Bb2+D3+F3 . . | C3+E3+G3+Bb3 . . . _ C3+E3+G3+Bb3 . . | F3+A3+C4 . . . _ _ _ _" },
  { instrument: "bass", vol: 0.19, gate: 0.78, pan: 0, notes: "F2 . . _ C3 . F2 _ | G2 . . _ D3 . G2 _ | C2 . . _ G2 . C2 _ | F2 . . _ C3 . F2 _ | F2 . . _ C3 . F2 _ | Bb1 . . _ F2 . Bb1 _ | C2 . . _ G2 . C2 _ | F2 . . _ C3 . _ _" },
  { drum: true, vol: 0.07, notes: "k _ s _ k _ s _" },
  { drum: true, vol: 0.018, pan: 0.3, notes: "_ h _ h _ h _ h" },
] };
// 町の お店: ネリカスタウンの みぎの 道の そばの「まちの おうち」（nerikasu_home2・9×5・入口 4）を お店に する。
// 足もと・入口・大きさは そのまま。絵は tools/town-design/nerikasu-buildings.mjs の kobo（js/nerikasu-town-art.js に 生成）。
// NerikasuTown.install（js/nerikasu-town.js）が originals を とる まえに かえる（あたまの たいそうと おなじ。js/mg-brain.js）
const KoboTown = {
  install() {
    const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home2");
    if (!b) throw Error("kobo: ネリカスタウンの お店の 場所が ない");
    Object.assign(b, { act: { type: "work", shop: "kobo" }, label: "パズル こうぼう", sign: "kobo" });
  },
};
KoboTown.install();
