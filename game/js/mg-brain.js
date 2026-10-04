// のうトレの おてつだい「あたまの たいそう」（ネリカスタウン・UI-64。オーナーの 依頼 2026-10-03「脳トレ系の中でも異なるゲーム3種で選択できて、たとえば間違え探しなど」）。
// おみせで「おてつだいする」→ 3しゅから えらぶ（BrainGames.choose・ShopScene の variant）→ おきゃくさん 1にんに 1もん。
//  ・まちがい さがし（BrainSpotTask）: ひだりと みぎの 2まいの え。ちがう ところを タップ（ない・ふえた・いろ・ちがう もの・おおきさ・むき）
//  ・おなじ え さがし（BrainPairTask）: さいしょに ちらっと みせて → カードを 2まいずつ めくって おなじ えを そろえる
//  ・くだもの けいさん（BrainMathTask）: くだものの かずの たしざん・ひきざん（Lv で 5 → 20 まで）。こたえを 4つから えらぶ
// 店主は ふくろうの ホーせんせい。絵は js/brain-art.js（BrainArt）。店内・かんばん・BGM・町の お店（BrainTown）も ここで 登録する。
const BRAIN_FONT = "'M PLUS Rounded 1c', sans-serif";
// パズル こうぼう（js/mg-kobo.js の KoboGames）も この しくみを つかう（shop・ASK・GAMES・HELLO だけ かえる）
const BrainGames = {
  shop: "brain",
  ASK: "きょうは どの もんだいに する？",
  GAMES: [
    { id: "spot", name: "まちがい さがし", desc: "えの ちがう ところ",
      howto: ["まちがい さがしは、ひだりと みぎの\n2まいの えを くらべるよ。", "ちがう ところを みつけたら、\nどちらかの えを タップ！ まるが つくよ。", "こまったら「ヒント」。\nでも てんすうが すこし へるよ。"] },
    { id: "pair", name: "おなじ え さがし", desc: "カードを そろえる",
      howto: ["おなじ え さがしは、さいしょに\nカードを ちらっと みせるよ。", "2まい めくって おなじ えなら そろうよ。\nちがったら もとに もどるから おぼえてね。", "レベルが あがると、いろだけ ちがう\nカードも まざるよ。"] },
    { id: "math", name: "くだもの けいさん", desc: "かずを けいさん",
      howto: ["くだもの けいさんは、おきゃくさんの\nもんだいに こたえるよ。", "くだものを かぞえて、こたえを\nしたの 4つから えらんでね。", "まちがえても もういちど えらべるよ。\nいっかいで あてると はなまる！"] },
  ],
  HELLO: "あたまの たいそう きょうしつへ ようこそ ホー。\nおきゃくさんの もんだいを いっしょに といてね。",
  game(id) { return this.GAMES.find((g) => g.id === id) || this.GAMES[0]; },
  // ShopScene の さいしょの せつめい（HOWTO.brain）: えらんだ ゲームの ぶん
  howto(variant) { return [this.HELLO, ...this.game(variant).howto]; },
  // おみせの「おてつだいする」: どの ゲーム？（ほかの おみせは "" を かえす・やめたら null）
  async choose(store) {
    if (store.shopId !== this.shop) return "";
    const st = Save.d.shops[this.shop], face = Art.npcSvg({ ...SHOP_OWNERS[this.shop], emo: "happy" });
    const text = `${store.owner.name}\n${this.ASK}\n${this.GAMES.map((g) => `・${g.name}：${g.desc}`).join("\n")}`;
    const i = await UI.ask(text, [...this.GAMES.map((g) => g.name + (st.games[g.id] ? "" : "（はじめて）")), "やめる"]);
    if (i < 0 || i >= this.GAMES.length) return null;
    const g = this.GAMES[i];
    // はじめての ゲームは せつめいを きく（いちばん さいしょの おてつだいは おみせの なかで HOWTO[おみせ] が でる）
    if (st.plays && !st.games[g.id]) await UI.say(g.howto.map((t) => ({ name: store.owner.name, face, text: t })));
    // えらんだ あとに きく こと（ナンプレの 難しさ・続きから。js/mg-numpla.js）。やめたら null
    if (g.pick && (await g.pick(store)) == null) return null;
    st.games[g.id] = (st.games[g.id] || 0) + 1; st.last = g.id;
    Save.write();
    return g.id;
  },
};

// ---- まちがい さがし ----
const BRAIN_SPOT_SCENES = [
  { id: "field", sky: "#D3ECF8", ground: "#C5E6A6", far: "#A9D58A", deco: "sun" },
  { id: "room", sky: "#F7E6D2", ground: "#E9CDA6", far: "#D9B184", deco: "window" },
  { id: "beach", sky: "#CFEAF6", ground: "#F6E3B4", far: "#8FCDE6", deco: "cloud" },
];
class BrainSpotTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const [n, k] = [[7, 3], [8, 3], [8, 4], [9, 4], [10, 5]][lv - 1];
    this.cols = 3; this.rows = 4;
    const cells = this.cols * this.rows;
    this.theme = U.pick(BRAIN_SPOT_SCENES);
    const kinds = U.shuffle([...BrainArt.KINDS]);
    const at = U.shuffle([...Array(cells).keys()]);
    const mk = (kind, v = 0) => ({ kind, v, dx: U.rand(-0.1, 0.1), dy: U.rand(-0.08, 0.08), rot: U.rand(-0.16, 0.16), s: 1, flip: false });
    this.left = Array(cells).fill(null);
    at.slice(0, n).forEach((c, i) => (this.left[c] = mk(kinds[i])));
    this.right = this.left.map((q) => (q ? { ...q } : null));
    // ちがいの しゅるい（Lv で ふえる）。まず ちがう しゅるいを 1つずつ
    const types = ["gone", "color", "kind"];
    if (lv >= 2) types.push("extra");
    if (lv >= 3) types.push("size");
    if (lv >= 4) types.push("flip");
    const order = [...U.shuffle([...types]), ...U.shuffle([...types])];
    const used = new Set(), full = at.slice(0, n), empty = at.slice(n), unused = kinds.slice(n);
    this.diffs = [];
    for (const t0 of order) {
      if (this.diffs.length >= k) break;
      let t = t0, c;
      if (t === "extra") c = empty.find((x) => !used.has(x));
      else if (t === "flip") c = full.find((x) => !used.has(x) && BrainArt.flips(this.left[x].kind));
      else c = full.find((x) => !used.has(x));
      if (c === undefined) { t = "color"; c = full.find((x) => !used.has(x)); }
      if (c === undefined) continue;
      used.add(c);
      const q = this.right[c];
      if (t === "gone") this.right[c] = null;
      else if (t === "extra") this.right[c] = mk(unused.length ? unused.shift() : U.pick(kinds));
      else if (t === "color") q.v = 1;
      else if (t === "kind") q.kind = unused.length ? unused.shift() : kinds.find((x) => x !== q.kind);
      else if (t === "size") q.s = 0.58;
      else if (t === "flip") q.flip = true;
      this.diffs.push({ cell: c, type: t, found: false });
    }
    this.k = this.diffs.length; this.misses = 0; this.hints = 0; this.hintT = 0; this.hintCell = -1; this.cool = 0; this.marks = []; this.pops = [];
    this.timeLimit = [40, 40, 46, 48, 52][lv - 1]; this.title = "まちがい さがし おねがい！";
  }
  get found() { return this.diffs.filter((d) => d.found).length; }
  layout(R) {
    this.R = R;
    const top = R.y + 30, bottom = R.y + R.h - 60, gap = 8;
    const pw = (R.w - gap * 3) / 2, ph = Math.min(bottom - top, pw * 1.6);
    const y = top + (bottom - top - ph) / 2;
    this.pics = [{ x: R.x + gap, y, w: pw, h: ph }, { x: R.x + gap * 2 + pw, y, w: pw, h: ph }];
    // うえの おびは そら（たいよう・まど・くも）。こものは その したの 3×4 マス
    this.band = Math.round(ph * 0.13); this.cw = pw / this.cols; this.ch = (ph - this.band) / this.rows; this.size = Math.min(this.cw, this.ch) * 0.74;
    this.btns = [{ x: R.x + 10, y: R.y + R.h - 52, w: 112, h: 46, label: "ヒント", fs: 15, inline: true, color: "#FFF3B0", icon: (ctx, x, y, s) => BrainArt.drawLens(ctx, x, y, s), cb: () => this.hint() }];
  }
  center(pic, cell) { const c = cell % this.cols, r = Math.floor(cell / this.cols); return { x: pic.x + (c + 0.5) * this.cw, y: pic.y + this.band + (r + 0.5) * this.ch }; }
  cellAt(p) {
    // そらの おびの すこし うえ（こものの あたま）まで うけつける
    for (const pic of this.pics) if (p.x >= pic.x && p.x < pic.x + pic.w && p.y >= pic.y + this.band * 0.4 && p.y < pic.y + pic.h) return U.clamp(Math.floor((p.y - pic.y - this.band) / this.ch), 0, this.rows - 1) * this.cols + Math.min(this.cols - 1, Math.floor((p.x - pic.x) / this.cw));
    return -1;
  }
  downArea(p) {
    const cell = this.cellAt(p);
    if (cell < 0 || this.cool > 0 || this.found >= this.k) return;
    const d = this.diffs.find((x) => x.cell === cell);
    if (d && d.found) return;
    if (d) {
      d.found = true; Sound.se("good");
      for (const pic of this.pics) this.pops.push({ ...this.center(pic, cell), t: 0 });
      if (this.hintCell === cell) this.hintT = 0;
      if (this.found >= this.k) { Sound.se("sparkle"); this.sc.finish(this.score()); }
      return;
    }
    this.misses++; this.cool = 0.4; this.marks.push({ x: p.x, y: p.y, t: 0 });
    this.sc.mistake("そこは おなじ だよ");
  }
  hint() {
    const d = this.diffs.find((x) => !x.found);
    if (!d || this.hintT > 0) return;
    this.hints++; this.hintCell = d.cell; this.hintT = 2;
  }
  tick(dt) {
    if (this.cool > 0) this.cool -= dt; if (this.hintT > 0) this.hintT -= dt;
    for (const m of this.marks) m.t += dt; for (const m of this.pops) m.t += dt;
    this.marks = this.marks.filter((m) => m.t < 0.7); this.pops = this.pops.filter((m) => m.t < 0.8);
  }
  score() { return (100 * this.found) / this.k - this.misses * 6 - this.hints * 10 - this.sc.timePenalty(); }
  timeout() { return Math.min(40, this.score() - 20); }
  drawPic(ctx, pic, items) {
    const T = this.theme, { x, y, w, h } = pic, band = this.band, gy = y + band;
    ctx.save();
    U.rr(ctx, x, y, w, h, 12); ctx.clip();
    ctx.fillStyle = T.sky; ctx.fillRect(x, y, w, band + 2);
    ctx.fillStyle = T.far; ctx.fillRect(x, gy - 4, w, 6);
    ctx.fillStyle = T.ground; ctx.fillRect(x, gy + 2, w, h - band);
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    for (let r = 1; r < this.rows; r++) { ctx.beginPath(); ctx.moveTo(x, gy + r * this.ch); ctx.lineTo(x + w, gy + r * this.ch); ctx.stroke(); }
    // そらの かざり（どちらの えにも おなじ。こものとは かさならない）
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    if (T.deco === "sun") { ctx.fillStyle = "#FFE48A"; ctx.beginPath(); ctx.arc(x + w * 0.84, y + band * 0.5, band * 0.32, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (T.deco === "window") { for (const k of [0.2, 0.62]) { ctx.fillStyle = "#D7EEF7"; U.rr(ctx, x + w * k, y + band * 0.18, w * 0.2, band * 0.64, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w * (k + 0.1), y + band * 0.18); ctx.lineTo(x + w * (k + 0.1), y + band * 0.82); ctx.stroke(); } }
    else { ctx.fillStyle = "#FFFFFF"; for (const [a, r] of [[0.16, 0.26], [0.26, 0.34], [0.36, 0.24], [0.7, 0.22], [0.78, 0.3]]) { ctx.beginPath(); ctx.arc(x + w * a, y + band * 0.55, band * r, 0, 7); ctx.fill(); } }
    items.forEach((q, cell) => {
      if (!q) return;
      const c = this.center(pic, cell);
      ctx.save(); ctx.translate(c.x + q.dx * this.cw, c.y + q.dy * this.ch); ctx.rotate(q.rot);
      BrainArt.draw(ctx, q.kind, q.v, 0, 0, this.size * q.s, { flip: q.flip });
      ctx.restore();
    });
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, x, y, w, h, 12); ctx.stroke();
  }
  draw(ctx) {
    const R = this.R;
    ctx.save();
    this.drawPic(ctx, this.pics[0], this.left); this.drawPic(ctx, this.pics[1], this.right);
    // みつけた ところ（あかい まる）・ヒント（きいろの てんてん）・はずれ（ばつ）
    const rr = Math.min(this.cw, this.ch) * 0.46;
    for (const d of this.diffs) if (d.found) for (const pic of this.pics) { const c = this.center(pic, d.cell); ctx.strokeStyle = "#E53935"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, 7); ctx.stroke(); }
    if (this.hintT > 0 && this.hintCell >= 0) for (const pic of this.pics) {
      const c = this.center(pic, this.hintCell), k = 1 + Math.sin(G.t * 9) * 0.08;
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = "#F2A93B"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, rr * 1.15 * k, 0, 7); ctx.stroke(); ctx.restore();
    }
    for (const m of this.pops) { ctx.save(); ctx.globalAlpha = 1 - m.t / 0.8; FX.sparkles(ctx, m.x, m.y, m.t / 0.8); ctx.restore(); }
    for (const m of this.marks) { ctx.save(); ctx.globalAlpha = 1 - m.t / 0.7; ctx.strokeStyle = "#5C6BC0"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(m.x - 9, m.y - 9); ctx.lineTo(m.x + 9, m.y + 9); ctx.moveTo(m.x + 9, m.y - 9); ctx.lineTo(m.x - 9, m.y + 9); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 13px ${BRAIN_FONT}`;
    ctx.fillText(this.found >= this.k ? "ぜんぶ みつけた！" : "ひだりと みぎで ちがう ところを タップ", R.x + R.w / 2, R.y + 16, R.w - 16);
    // みつけた かず（まるの ならび）
    const bx = R.x + 134, by = R.y + R.h - 29, step = Math.min(30, (R.x + R.w - 16 - bx) / this.k);
    for (let i = 0; i < this.k; i++) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = i < this.found ? "#E53935" : "#FFFFFF"; ctx.beginPath(); ctx.arc(bx + 10 + i * step, by, 9, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    BrainArt.drawLens(ctx, x + 26, y + h * 0.42, 44);
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${BRAIN_FONT}`; ctx.fillText("ちがう ところを", x + w * 0.62, y + h * 0.26, w - 56);
    ctx.font = `900 22px ${BRAIN_FONT}`; ctx.fillText(this.k + "つ", x + w * 0.62, y + h * 0.56);
    ctx.font = `800 11px ${BRAIN_FONT}`; ctx.fillText("みつけてね！", x + w * 0.62, y + h * 0.84, w - 56);
    ctx.restore();
  }
  debug(css) {
    const P = this.pics, same = this.left.map((q, c) => c).filter((c) => this.left[c] && !this.diffs.some((d) => d.cell === c))[0];
    return { game: "spot", found: this.found, total: this.k, misses: this.misses, hints: this.hints, hintCell: this.hintT > 0 ? this.hintCell : -1, theme: this.theme.id,
      diffs: this.diffs.map((d) => ({ type: d.type, found: d.found, left: css(this.center(P[0], d.cell).x, this.center(P[0], d.cell).y), right: css(this.center(P[1], d.cell).x, this.center(P[1], d.cell).y) })),
      same: same === undefined ? null : css(this.center(P[1], same).x, this.center(P[1], same).y) };
  }
}

// ---- おなじ え さがし ----
class BrainPairTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const [pairs, cols, twins] = [[6, 4, 0], [6, 4, 0], [8, 4, 0], [8, 4, 2], [10, 5, 3]][lv - 1];
    this.pairs = pairs; this.cols = cols; this.rows = Math.ceil((pairs * 2) / cols);
    // twins: おなじ しゅるいで いろだけ ちがう 2くみ（Lv.4 から）
    const kinds = U.shuffle([...BrainArt.KINDS]).slice(0, pairs - twins);
    const keys = [...kinds.map((k) => [k, 0]), ...kinds.slice(0, twins).map((k) => [k, 1])];
    this.cards = U.shuffle(keys.flatMap(([kind, v]) => [0, 1].map(() => ({ kind, v, key: kind + ":" + v, open: false, done: false, flip: 0 }))));
    this.peek = [2.4, 1.6, 2.2, 1.6, 2][lv - 1]; this.peek0 = this.peek;
    this.misses = 0; this.lock = 0; this.free = Math.ceil(pairs * 0.8); this.pops = [];
    this.timeLimit = [38, 36, 48, 50, 62][lv - 1]; this.title = "おなじ えを さがして！";
  }
  get done() { return this.cards.filter((c) => c.done).length / 2; }
  layout(R) {
    this.R = R;
    const top = R.y + 32, bottom = R.y + R.h - 8, cw = (R.w - 16) / this.cols, ch = (bottom - top) / this.rows;
    let w = Math.min(cw - 8, (ch - 8) * 0.8), h = w / 0.8;
    if (h > ch - 8) { h = ch - 8; w = h * 0.8; }
    this.cardW = w; this.cardH = h;
    this.cards.forEach((c, i) => { const col = i % this.cols, row = Math.floor(i / this.cols); c.x = R.x + 8 + (col + 0.5) * cw; c.y = top + (row + 0.5) * ch; });
    this.btns = [];
  }
  open() { return this.cards.filter((c) => c.open && !c.done); }
  downArea(p) {
    if (this.peek > 0 || this.lock > 0 || this.done >= this.pairs) return;
    const c = this.cards.find((q) => Math.abs(p.x - q.x) <= this.cardW / 2 + 3 && Math.abs(p.y - q.y) <= this.cardH / 2 + 3);
    if (!c || c.open || c.done) return;
    c.open = true; Sound.se("pop");
    const o = this.open();
    if (o.length < 2) return;
    if (o[0].key === o[1].key) {
      o.forEach((q) => { q.done = true; this.pops.push({ x: q.x, y: q.y, t: 0 }); });
      Sound.se("good");
      if (this.done >= this.pairs) { Sound.se("sparkle"); this.sc.finish(this.score()); }
    } else { this.misses++; this.lock = 0.8; }
  }
  tick(dt) {
    if (this.peek > 0) { this.peek -= dt; if (this.peek <= 0) Sound.se("tap"); }
    if (this.lock > 0 && (this.lock -= dt) <= 0) for (const c of this.open()) c.open = false;
    for (const c of this.cards) { const want = this.peek > 0 || c.open || c.done ? 1 : 0; c.flip += U.clamp(want - c.flip, -dt * 6, dt * 6); }
    for (const m of this.pops) m.t += dt; this.pops = this.pops.filter((m) => m.t < 0.8);
  }
  score() { return (100 * this.done) / this.pairs - Math.max(0, this.misses - this.free) * 5 - this.sc.timePenalty(); }
  timeout() { return Math.min(40, this.score() - 20); }
  draw(ctx) {
    const R = this.R, w = this.cardW, h = this.cardH;
    ctx.save();
    for (const c of this.cards) {
      const face = c.flip > 0.5, sx = Math.max(0.04, Math.abs(Math.cos(c.flip * Math.PI)));
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(sx, 1);
      ctx.fillStyle = INK; U.rr(ctx, -w / 2, -h / 2 + 3, w, h, 10); ctx.fill();
      ctx.fillStyle = face ? (c.done ? "#FFF6D6" : "#FFFFFF") : "#7E9CD8"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      U.rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill(); ctx.stroke();
      if (face) BrainArt.draw(ctx, c.kind, c.v, 0, 0, Math.min(w, h) * 0.78);
      else BrainArt.drawBack(ctx, 0, 0, Math.min(w, h) * 0.92);
      if (c.done) { ctx.strokeStyle = "#F2A93B"; ctx.lineWidth = 3; U.rr(ctx, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8); ctx.stroke(); }
      ctx.restore();
    }
    for (const m of this.pops) { ctx.save(); ctx.globalAlpha = 1 - m.t / 0.8; FX.sparkles(ctx, m.x, m.y, m.t / 0.8); ctx.restore(); }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 13px ${BRAIN_FONT}`;
    const say = this.peek > 0 ? "よく みて おぼえてね！" : this.done >= this.pairs ? "ぜんぶ そろった！" : `おなじ えを そろえよう（${this.done} / ${this.pairs}）`;
    ctx.fillText(say, R.x + R.w / 2, R.y + 16, R.w - 16);
    if (this.peek > 0) { const k = this.peek / this.peek0, bw = R.w * 0.4; ctx.fillStyle = "#E6DCCB"; U.rr(ctx, R.x + R.w / 2 - bw / 2, R.y + 25, bw, 5, 2.5); ctx.fill(); ctx.fillStyle = "#7E9CD8"; U.rr(ctx, R.x + R.w / 2 - bw / 2, R.y + 25, bw * k, 5, 2.5); ctx.fill(); }
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(36, h * 0.5);
    BrainArt.drawBack(ctx, x + 18, y + h * 0.4, s); BrainArt.drawBack(ctx, x + 30, y + h * 0.48, s);
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${BRAIN_FONT}`; ctx.fillText("おなじ えを", x + w * 0.64, y + h * 0.26, w - 60);
    ctx.font = `900 22px ${BRAIN_FONT}`; ctx.fillText(this.pairs + "くみ", x + w * 0.64, y + h * 0.56);
    ctx.font = `800 11px ${BRAIN_FONT}`; ctx.fillText("そろえてね！", x + w * 0.64, y + h * 0.84, w - 60);
    ctx.restore();
  }
  debug(css) {
    return { game: "pair", pairs: this.pairs, done: this.done, misses: this.misses, free: this.free, peek: Math.max(0, this.peek), lock: Math.max(0, this.lock),
      cards: this.cards.map((c) => ({ key: c.key, open: c.open, done: c.done, ...css(c.x, c.y) })) };
  }
}

// ---- くだもの けいさん ----
class BrainMathTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.nq = [3, 3, 4, 4, 5][lv - 1];
    this.qs = [];
    for (let i = 0; i < 40 && this.qs.length < this.nq; i++) { const q = BrainMathTask.make(lv); if (!this.qs.some((x) => x.op === q.op && x.a === q.a && x.b === q.b)) this.qs.push(q); }
    this.index = 0; this.misses = 0; this.wait = 0; this.flash = null;
    this.timeLimit = [30, 32, 42, 44, 54][lv - 1]; this.title = "けいさん おしえて！";
  }
  // 1もん: op は "+"（たしざん）・"-"（ひきざん）・"?"（いくつ たすと □ に なる）。こたえは 0〜20
  static make(lv) {
    const R = U.randi, fruit = U.pick(BrainArt.FRUIT_KINDS);
    let op = "+", a, b;
    if (lv <= 1) { a = R(1, 4); b = R(1, 5 - a); }
    else if (lv === 2) { a = R(2, 7); b = R(1, 10 - a); }
    else if (lv === 3) { if (U.chance(0.5)) { a = R(3, 9); b = R(1, 10 - a); } else { op = "-"; a = R(4, 10); b = R(1, a - 1); } }
    else if (lv === 4) { if (U.chance(0.5)) { a = R(4, 10); b = R(2, 15 - a); } else { op = "-"; a = R(7, 15); b = R(2, a - 2); } }
    else { op = U.pick(["+", "-", "?"]); if (op === "+") { a = R(6, 12); b = R(3, 20 - a); } else if (op === "-") { a = R(10, 20); b = R(3, a - 3); } else { a = R(3, 10); b = R(2, 20 - a); } }
    const ans = op === "+" ? a + b : op === "-" ? a - b : b, set = new Set([ans]);
    for (const d of U.shuffle([-3, -2, -1, 1, 2, 3])) if (set.size < 4 && ans + d >= 0 && ans + d <= 20) set.add(ans + d);
    for (let v = 0; set.size < 4; v++) set.add(v);
    return { op, a, b, ans, fruit, choices: U.shuffle([...set]), tries: 0, ok: false };
  }
  get cur() { return this.qs[this.index] || null; }
  layout(R) {
    this.R = R;
    this.choiceY = R.y + R.h - 64;
    this.setup();
  }
  setup() {
    const q = this.cur;
    if (!q) { this.btns = []; return; }
    const cells = gridBtns(this.R, 4, 4, this.choiceY, 56);
    this.btns = q.choices.map((v, i) => ({ ...cells[i], label: String(v), fs: 24, color: "#FFFDF6", disabled: !!(q.bad && q.bad.includes(v)), cb: () => this.answer(v) }));
  }
  answer(v) {
    const q = this.cur;
    if (!q || this.wait > 0) return;
    q.tries++;
    if (v !== q.ans) { this.misses++; q.bad = [...(q.bad || []), v]; this.setup(); this.flash = { ok: false, t: 0.5 }; this.sc.mistake("ちがうよ"); return; }
    q.ok = true; Sound.se("good"); this.flash = { ok: true, t: 0.7 }; this.wait = 0.7;
    this.btns.forEach((b) => (b.on = b.label === String(v)));
  }
  tick(dt) {
    if (this.flash && (this.flash.t -= dt) <= 0) this.flash = null;
    if (this.wait > 0 && (this.wait -= dt) <= 0) {
      this.index++;
      if (!this.cur) { this.btns = []; Sound.se("sparkle"); this.sc.finish(this.score()); return; }
      this.setup();
    }
  }
  points() { return this.qs.reduce((s, q) => s + (!q.ok ? 0 : q.tries <= 1 ? 1 : q.tries === 2 ? 0.5 : 0.25), 0); }
  score() { return (100 * this.points()) / this.nq - this.sc.timePenalty(); }
  timeout() { return Math.min(40, this.score() - 20); }
  // くだものの まとまり（5こずつ ならべる）。cross: うしろから cross こは たべた（うすく ばつ）。s: くだものの 大きさ（2つの まとまりで そろえる）
  static fit(n, w, h) { return Math.min(42, w / Math.min(5, Math.max(1, n)), h / Math.max(1, Math.ceil(n / 5))) * 0.92; }
  group(ctx, kind, n, cx, cy, s, cross = 0) {
    const rows = Math.max(1, Math.ceil(n / 5));
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / 5), inRow = Math.min(5, n - r * 5), x = cx + (i % 5 - (inRow - 1) / 2) * s, y = cy + (r - (rows - 1) / 2) * s;
      const eaten = i >= n - cross;
      ctx.save(); if (eaten) ctx.globalAlpha = 0.3; BrainArt.drawFruit(ctx, kind, x, y, s * 0.94); ctx.restore();
      if (eaten) { ctx.strokeStyle = "#5C6BC0"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.3); ctx.lineTo(x + s * 0.3, y + s * 0.3); ctx.moveTo(x + s * 0.3, y - s * 0.3); ctx.lineTo(x - s * 0.3, y + s * 0.3); ctx.stroke(); }
    }
  }
  // え の ならべかた: よこに 2つ か、うえ・したに 2つ（くだものが 大きく なる ほう）
  plan(q) {
    const R = this.R, top = R.y + 48, bottom = this.choiceY - 52, gh = bottom - top, cx = R.x + R.w / 2, F = BrainMathTask.fit;
    if (q.op === "-") return { top, bottom, gh, cx, s: F(q.a, R.w - 40, gh - 12), stack: false };
    const nb = q.op === "?" ? 3 : q.b, gw = (R.w - 16 - 44) / 2, half = (gh - 34) / 2;
    const side = Math.min(F(q.a, gw - 8, gh - 12), F(nb, gw - 8, gh - 12)), stack = Math.min(F(q.a, R.w - 40, half), F(nb, R.w - 40, half));
    return { top, bottom, gh, cx, gw, half, s: Math.max(side, stack), stack: stack > side * 1.12 };
  }
  text(q) {
    const nm = BrainArt.name(q.fruit);
    if (q.op === "+") return [`${nm}が ${q.a}こ と ${q.b}こ。`, "ぜんぶで なんこ？"];
    if (q.op === "-") return [`${nm}が ${q.a}こ。`, `${q.b}こ たべたら のこりは なんこ？`];
    return [`${nm}が ${q.a}こ。`, `なんこ ふえたら ${q.a + q.b}こに なる？`];
  }
  draw(ctx) {
    const R = this.R, q = this.cur || this.qs[this.qs.length - 1];
    ctx.save();
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const [l1, l2] = this.text(q);
    ctx.font = `800 13px ${BRAIN_FONT}`; ctx.fillText(l1, R.x + R.w / 2, R.y + 16, R.w - 70); ctx.fillText(l2, R.x + R.w / 2, R.y + 34, R.w - 16);
    ctx.font = `800 11px ${BRAIN_FONT}`; ctx.textAlign = "right"; ctx.fillText(`${Math.min(this.index + 1, this.nq)} / ${this.nq}`, R.x + R.w - 10, R.y + 16);
    // え（くだもの）と しき
    const L = this.plan(q), { top, bottom, gh, cx } = L, mid = (top + bottom) / 2;
    ctx.fillStyle = "#FFF6E6"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, R.x + 8, top - 6, R.w - 16, gh + 12, 12); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.font = `900 26px ${BRAIN_FONT}`; ctx.fillStyle = INK;
    const qbox = (x, y) => { ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, x - 26, y - 26, 52, 52, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#7E9CD8"; ctx.fillText("？", x, y + 1); ctx.fillStyle = INK; };
    if (q.op === "-") this.group(ctx, q.fruit, q.a, cx, mid, L.s, q.b);
    else if (L.stack) {
      const ya = top + L.half / 2 + 2, yb = bottom - L.half / 2 - 2;
      this.group(ctx, q.fruit, q.a, cx, ya, L.s); ctx.fillText("＋", cx, mid);
      if (q.op === "+") this.group(ctx, q.fruit, q.b, cx, yb, L.s); else qbox(cx, yb);
    } else {
      const xa = R.x + 8 + L.gw / 2, xb = R.x + R.w - 8 - L.gw / 2;
      this.group(ctx, q.fruit, q.a, xa, mid, L.s); ctx.fillText("＋", cx, mid);
      if (q.op === "+") this.group(ctx, q.fruit, q.b, xb, mid, L.s); else qbox(xb, mid);
    }
    // しき（こたえが あたると うまる）
    const show = q.ok ? String(q.ans) : "？", eq = q.op === "+" ? `${q.a} ＋ ${q.b} ＝ ${show}` : q.op === "-" ? `${q.a} − ${q.b} ＝ ${show}` : `${q.a} ＋ ${show} ＝ ${q.a + q.b}`;
    ctx.fillStyle = INK; ctx.font = `900 28px ${BRAIN_FONT}`; ctx.fillText(eq, cx, bottom + 28, R.w - 20);
    if (this.flash) {
      // まんなかに ふだ（くだものの うえでも よめる）
      const say = this.flash.ok ? "せいかい！" : "もういちど！", col = this.flash.ok ? "#E53935" : "#5C6BC0";
      ctx.globalAlpha = Math.min(1, this.flash.t / 0.3); ctx.font = `900 22px ${BRAIN_FONT}`;
      const tw = ctx.measureText(say).width + 34;
      ctx.fillStyle = "rgba(255,255,255,0.94)"; ctx.strokeStyle = col; ctx.lineWidth = 3; U.rr(ctx, cx - tw / 2, mid - 22, tw, 44, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.fillText(say, cx, mid + 1);
    }
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const q = this.qs[0];
    BrainArt.drawFruit(ctx, q.fruit, x + 18, y + h * 0.36, 30); BrainArt.drawFruit(ctx, q.fruit, x + 34, y + h * 0.56, 30);
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 12px ${BRAIN_FONT}`; ctx.fillText("けいさんの もんだい", x + w * 0.64, y + h * 0.26, w - 60);
    ctx.font = `900 22px ${BRAIN_FONT}`; ctx.fillText(this.nq + "もん", x + w * 0.64, y + h * 0.56);
    ctx.font = `800 11px ${BRAIN_FONT}`; ctx.fillText(this.lv >= 3 ? "たしざん・ひきざん" : "たしざん", x + w * 0.64, y + h * 0.84, w - 60);
    ctx.restore();
  }
  debug(css) {
    const q = this.cur;
    return { game: "math", index: this.index, total: this.nq, misses: this.misses, waiting: this.wait > 0,
      cur: q ? { op: q.op, a: q.a, b: q.b, ans: q.ans, fruit: q.fruit, choices: [...q.choices], tries: q.tries, text: this.text(q).join("") } : null };
  }
}

// ShopScene は MG_TASKS[おみせ] を new する。のうトレは えらんだ ゲーム（sc.variant）の クラスを かえす
const BRAIN_TASKS = { spot: BrainSpotTask, pair: BrainPairTask, math: BrainMathTask };
BrainGames.tasks = BRAIN_TASKS;
// ゲームを えらぶ おみせ（js/store-iso.js の「おてつだいする」・PokaDebug.shop の variant）。パズル こうぼうは js/mg-kobo.js が たす
const SHOP_GAMES = { brain: BrainGames };
function BrainTask(sc, lv) { return new (BRAIN_TASKS[sc && sc.variant] || BrainSpotTask)(sc, lv); }
// おみせの おく（たなに ちきゅうぎ・ほん・パズル）
BrainTask.backdrop = (ctx, sc, W) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = W * 0.56 + i * (W * 0.085);
    ctx.fillStyle = ["#E57373", "#64B5F6", "#FFD54F", "#81C784", "#BA68C8"][i]; ctx.fillRect(x - 6, 40, 12, 22); ctx.strokeRect(x - 6, 40, 12, 22);
    if (i % 2) { ctx.fillStyle = "#8EC5F4"; ctx.beginPath(); ctx.arc(x, 110, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8FD19E"; ctx.beginPath(); ctx.arc(x - 2, 108, 4, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = "#FFFDF6"; ctx.fillRect(x - 8, 104, 16, 16); ctx.strokeRect(x - 8, 104, 16, 16); ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x, 120); ctx.moveTo(x - 8, 112); ctx.lineTo(x + 8, 112); ctx.stroke(); }
  }
  ctx.restore();
};
MG_TASKS.brain = BrainTask;
SHOP_OWNERS.brain = { sp: "owl", col: "#A98B6D", col2: "#F3E6D3", name: "ふくろうの ホーせんせい", outfit: { face: "glasses", neck: "bowtie_red" }, look: { brow: "soft", cheek: "pink" } };
HOWTO.brain = (sc) => BrainGames.howto(sc && sc.variant); // ShopScene.flow が えらんだ ゲームで よぶ（js/minigames.js）
// かんばんの しるし: ふくろうの かお
SIGN_ICON.brain = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="1" rx="9" ry="8" fill="#C7A27A" ${OS(1.5)}/><path d="M-8,-4 L-7,-10 L-3,-6 Z M8,-4 L7,-10 L3,-6 Z" fill="#C7A27A" ${OS(1.2)}/><circle cx="-3.6" cy="-1" r="3.4" fill="#FFFFFF" ${OS(1.2)}/><circle cx="3.6" cy="-1" r="3.4" fill="#FFFFFF" ${OS(1.2)}/><circle cx="-3.6" cy="-0.6" r="1.4" fill="${INK}"/><circle cx="3.6" cy="-0.6" r="1.4" fill="${INK}"/><path d="M-1.4,3 L1.4,3 L0,5.4 Z" fill="#FFB74D" stroke="none"/></g>`;
// 店内（10×12・斜め上の 館 js/store-iso.js）: こくばん・ずかんの ほんだな・かんがえる つくえ・まちがい さがしの え・カード あわせの テーブル・ちきゅうぎ・パズルの たな
STORE_INTERIORS.brain = {
  wall: "#E9F0F8", wallPat: "dots", accent: "#5C8FE6", wainscot: "#CFDDF2", wood: "#D9A066", caption: "かんがえる って たのしい！",
  mats: { ".": { c: ["#E7D7BC", "#DFCCAE"], pat: "plank" }, r: { c: ["#DCE6F6", "#D2DDF0"], pat: "carpet" } }, zones: [["r", 0, 6, 2, 9]],
  counter: { body: "#5C8FE6", top: "#FFFDF6", items: ["cards", "bell"] },
  walls: {
    north: [{ t: "frames", a: 0.3, b: 2.7, z0: 174, z1: 222, n: 3, art: (i) => [`<circle r="9" fill="#F28B82" stroke="${INK}" stroke-width="1.2"/>`, `<rect x="-8" y="-8" width="16" height="16" fill="#8EC5F4" stroke="${INK}" stroke-width="1.2"/>`, `<path d="M0,-10 L10,8 L-10,8 Z" fill="#F6D47A" stroke="${INK}" stroke-width="1.2"/>`][i % 3] }, { t: "sign", a: 4.0, b: 7.0, z0: 174, z1: 220 }, { t: "poster", a: 7.4, b: 8.6, z0: 176, z1: 222, art: `<g transform="scale(1.7)">${SIGN_ICON.brain(0, 0)}</g>`, text: "ホーせんせい" }, { t: "clock", a: 9.0, z: 206 }],
    west: [{ t: "window", a: 3.0, b: 5.6, z0: 104, z1: 200, curtain: "#A8C4E8" }, { t: "board", a: 6.3, b: 9.7, z0: 170, z1: 214, lines: ["きょうの めあて", "よく みて よく かんがえよう"], col: "#FFFDF4" }, { t: "shelf", a: 10.1, b: 11.8, z: 150, goods: "books" }],
  },
  fixtures: [
    ["wallshelf", 4, 0, 3, 1, "ずかんの ほんだな", { variant: "books", sign: "ずかん", height: 150 }], ["globe", 4, 1, 1, 1, "ちきゅうぎ"], ["candyjar", 6, 1, 1, 1, "ごほうびの あめ", { col: "#8EB4EE" }],
    ["chalkboard", 0, 0, 3, 1, "きょうの もんだいの こくばん"], ["wallshelf", 7, 0, 3, 1, "パズルの たな", { variant: "puzzles", sign: "パズル", height: 150 }],
    ["wallshelf", 0, 3, 1, 2, "えほんの たな", { variant: "books", sign: "えほん", height: 120, levels: 3 }], ["desks", 0, 6, 2, 2, "かんがえる つくえ"],
    ["spotboard", 7, 4, 2, 1, "まちがい さがしの え"], ["puzzletable", 7, 6, 2, 2, "カード あわせの テーブル", { variant: "cards" }],
    ["board", 9, 3, 1, 1, "きょうの けいさん", { lines: ["けいさん", "3 + 4 =", "？"], col: "#3E6B57" }],
    ["plant", 9, 10, 1, 1, null, { variant: "tall" }], ["plant", 0, 11, 1, 1, null, { variant: "bush" }],
    ["npc", 2, 9, 1, 1, "べんきょうちゅうの こ", { sp: "rabbit", ci: 2, dir: "up", action: "chat", lines: ["まちがい さがし、5こ みつけたよ！", "カード あわせ、ぜんぶ そろった！"] }],
  ],
};
// 店内 BGM: モーツァルト「きらきらぼし」（パブリックドメイン。ディスクの 写し）を やさしい 音で
(() => {
  const src = SONGS.disc_twinkle, inst = ["piano", "mallet", "bass", "pad"];
  if (src) SONGS.shop_brain = { ...src, title: "かんがえる きらきらぼし", disc: false, bpm: 92, tracks: src.tracks.map((tr, k) => (tr.drum ? tr : { ...tr, instrument: inst[k] || tr.instrument })) };
})();
// 町の お店: ネリカスタウンの よこの 道（中）の 北の「まちの おうち」（nerikasu_home6・7×5・入口 3）を お店に する。
// 足もと・入口・大きさは そのまま。絵は tools/town-design/nerikasu-buildings.mjs の brain（js/nerikasu-town-art.js に 生成）。
// NerikasuTown.install（js/nerikasu-town.js）が originals を とる まえに かえる（ころころ フルーツと おなじ。js/korokoro-town.js）
const BrainTown = {
  install() {
    const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home6");
    if (!b) throw Error("brain: ネリカスタウンの お店の 場所が ない");
    Object.assign(b, { act: { type: "work", shop: "brain" }, label: "あたまの たいそう", sign: "brain" });
  },
};
BrainTown.install();
