// ナンプレの おてつだい（パズル こうぼう・UI-81。オーナーの 依頼 2026-10-04「脳トレとパズルに関して完全に大人向けのゲームを」「パズルはナンプレ」）。
// おみせで「おてつだいする」→「ナンプレ」→ 難しさ（初級・中級・上級・超上級）→ おきゃくさん 1人に 1問（ShopScene の rounds 1）。
// 盤は 画面いっぱい（NumplaTask.full。ShopScene が うえの おみせを ほそく する）。大人むけ なので 画面の ことばは 漢字かな まじり。
//  ・マスを タップ → したの 数字で 入れる（のこりの かずつき）。まちがいは 赤く なって ミス +1（のこる ので 消すか 入れなおす）
//  ・メモ: 候補を ちいさく 書く。正しい 数字を 入れると おなじ 行・列・ブロックの メモから その 数字を 消す
//  ・消す・戻す（さいごの 1手）・ヒント（えらんだ マス か、つぎに 入る マスに 正しい 数字と わけ）
//  ・とちゅうで やめても 続きから（Save.d.shops.kobo.numpla.cont）。時間の 上限は ゆったり（NUMPLA_PLAY）
// 問題は js/numpla-data.js（tools/build-numpla.mjs が つくる）を NumplaRules.transform で 数字・行・列を いれかえて だす。
const NUMPLA_PLAY = {
  // limit: 時間の 上限（びょう）・par: めやす（これを こえると すこしずつ へる）・pay: ○ の コイン（◎ は 1.5ばい）・rep: ひょうばんの ばいりつ
  easy: { limit: 20 * 60, par: 6 * 60, pay: 700, rep: 2 },
  normal: { limit: 30 * 60, par: 12 * 60, pay: 1500, rep: 3 },
  hard: { limit: 45 * 60, par: 20 * 60, pay: 2600, rep: 4 },
  expert: { limit: 60 * 60, par: 30 * 60, pay: 4000, rep: 6 },
};
const NUMPLA_FONT = "'M PLUS Rounded 1c', sans-serif";
const Numpla = {
  LEVELS: NumplaRules.LEVELS,
  level(id) { return this.LEVELS.find((L) => L.id === id) || null; },
  state() { return Save.d.shops.kobo.numpla; },
  mmss(sec) { const s = Math.max(0, Math.floor(sec || 0)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; },
  // つぎの 問題: たばを じゅんばんに（おなじ ものが つづかない）・数字と 行・列を いれかえる
  newPuzzle(lv, rnd = Math.random) {
    const N = this.state(), list = NUMPLA_BANK[lv] || NUMPLA_BANK.easy, k = (N.n[lv] = (N.n[lv] || 0) + 1);
    return NumplaRules.transform(list[(k - 1) % list.length], rnd);
  },
  // セーブの 続きが つかえるか（こわれて いたら すてる）
  validCont(c) {
    if (!c || !this.level(c.lv) || typeof c.p !== "string" || c.p.length !== 81 || typeof c.v !== "string" || c.v.length !== 81 || !Array.isArray(c.m) || c.m.length !== 81) return false;
    const g = NumplaRules.parse(c.p), v = NumplaRules.parse(c.v);
    return g.every((d, i) => !d || v[i] === d) && NumplaRules.count(g, 2).n === 1;
  },
  // パズル こうぼうで「ナンプレ」を えらんだ あと（BrainGames.choose の pick）: 続きから か、難しさを えらぶ。やめたら null
  async pick(store) {
    const N = this.state();
    if (N.cont && !this.validCont(N.cont)) N.cont = null;
    if (N.cont) {
      const L = this.level(N.cont.lv);
      const i = await UI.ask(`${store.owner.name}\nとちゅうの ナンプレが あるよ チク。\n${L.name}・${this.mmss(N.cont.used)}・ミス ${N.cont.miss || 0}`, ["続きから", "新しい問題", "やめる"]);
      if (i === 0) return N.cont.lv;
      if (i !== 1) return null;
      N.cont = null; Save.mark();
    }
    const opt = (L) => L.name + (N.clear[L.id] ? `（クリア ${N.clear[L.id]}・ベスト ${this.mmss(N.best[L.id])}）` : "");
    const i = await UI.ask(`${store.owner.name}\n難しさは どうする？\n${this.LEVELS.map((L) => `・${L.name}：${NUMPLA_LEVEL_NOTE[L.id]}`).join("\n")}`, [...this.LEVELS.map(opt), "やめる"]);
    if (i < 0 || i >= this.LEVELS.length) return null;
    N.lv = this.LEVELS[i].id; Save.mark();
    return N.lv;
  },
  // おみせの はじめの ひとこと（2かいめ から）
  hello(sc) { const L = this.level(this.state().cont ? this.state().cont.lv : this.state().lv) || this.LEVELS[0]; return `きょうも よろしくね！ ${L.name}の ナンプレを 1問 おねがい チク。\n（おみせ Lv.${sc.lv}）`; },
};
// えらぶ ときの ひとこと（大人むけ・みじかく）
const NUMPLA_LEVEL_NOTE = { easy: "ヒント多め・すぐ解ける", normal: "候補をしぼって解く", hard: "ペアやトリプルを使う", expert: "X-Wing などの上級技" };
const NUMPLA_HOWTO = [
  "ナンプレは、9×9 のマスに 1〜9 の\n数字を入れる パズルだよ。",
  "縦の列・横の行・太い線の 3×3 の\nブロックに、1〜9 が 1つずつ 入るように。",
  "マスを タップして 下の数字で 入れる。\n「メモ」で 候補を 小さく 書けるよ。",
  "まちがえると 赤くなって ミスが 1つ ふえる。\nとちゅうで やめても 続きから できるよ。",
];

class NumplaTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const N = Numpla.state();
    const cont = Numpla.validCont(N.cont) ? N.cont : null;
    this.lvId = cont ? cont.lv : Numpla.level(N.lv) ? N.lv : "easy";
    this.L = Numpla.level(this.lvId); this.P = NUMPLA_PLAY[this.lvId];
    this.puzzle = cont ? cont.p : Numpla.newPuzzle(this.lvId);
    this.given = NumplaRules.parse(this.puzzle); this.sol = NumplaRules.solve(this.given);
    this.val = cont ? NumplaRules.parse(cont.v) : this.given.slice();
    this.memo = cont ? cont.m.map((m) => m & NumplaRules.ALL) : new Array(81).fill(0);
    this.mistakes = cont ? cont.miss || 0 : 0; this.hints = cont ? cont.hint || 0 : 0;
    this.used0 = cont ? Math.max(0, cont.used || 0) : 0; this.resumed = !!cont;
    this.blank = this.given.filter((d) => !d).length;
    this.sel = -1; // さいしょは どこも えらばない（ヒントは つぎに 入る マスを わけと いっしょに おしえる）
    this.memoMode = false; this.hist = []; this.flash = null; this.tip = null; this.done = false; this.doneAt = 0; this.saveT = 0;
    this.timeLimit = this.P.limit; this.title = `ナンプレ（${this.L.name}）を おねがい！`;
    this.save();
  }
  // ShopScene: 盤は 画面いっぱい・おきゃくさんは 1人・続きは つかった 時間から
  static get full() { return true; }
  static get rounds() { return 1; }
  get usedTime() { return this.used0; }
  used() { return this.sc.timeLimit ? this.sc.timeLimit - this.sc.timeLeft : this.used0; }
  filled() { let n = 0; for (let i = 0; i < 81; i++) if (!this.given[i] && this.val[i] === this.sol[i]) n++; return n; }
  left(d) { let n = 9; for (let i = 0; i < 81; i++) if (this.val[i] === d && this.val[i] === this.sol[i]) n--; return n; }
  wrong(i) { return !!this.val[i] && this.val[i] !== this.sol[i]; }
  // ---- セーブ（続きから） ----
  save() {
    const N = Numpla.state();
    if (this.done) { N.cont = null; return; }
    N.cont = { lv: this.lvId, p: this.puzzle, v: NumplaRules.format(this.val), m: [...this.memo], miss: this.mistakes, hint: this.hints, used: Math.round(this.used()) };
    Save.mark();
  }
  // ---- ならび ----
  layout(R) {
    this.R = R;
    // たてに: すきま・うえの 行・盤・数字 2だん・どうぐ 1だん。盤は よこ いっぱい（9マスは 375 はばで 44px に できない ので 40px くらい）、ボタンは 44 いじょう
    const gap = 6, pad = 4, statusH = 24, other = pad * 2 + statusH + gap * 4;
    let k = Math.floor(Math.min((R.w - 10) / 9, 46)), bh = Math.floor((R.h - other - 9 * k) / 3);
    if (bh < 44) { bh = 44; k = Math.floor((R.h - other - 3 * bh) / 9); }
    bh = Math.min(bh, 56); this.k = k;
    // あまる たかさ（390×844 など）は うえ・盤の まえ・盤と ボタンの あいだに すこしずつ（のこりは した。ボタンが 指に ちかい）
    const gw = k * 9, spare = Math.max(0, R.h - other - gw - 3 * bh), top = R.y + pad + Math.min(16, spare * 0.15), toolH = bh;
    this.statusY = top; this.gx = Math.round(R.x + (R.w - gw) / 2); this.gy = Math.round(top + statusH + gap + Math.min(12, spare * 0.1));
    let y = this.gy + gw + gap + Math.min(40, spare * 0.35);
    const cols = 5, bw = (R.w - 10 - gap * (cols - 1)) / cols;
    this.btns = [];
    for (let d = 1; d <= 9; d++) {
      const r = d <= 5 ? 0 : 1, c = d <= 5 ? d - 1 : d - 6;
      this.btns.push({ x: R.x + 5 + c * (bw + gap), y: y + r * (bh + gap), w: bw, h: bh, label: String(d), fs: 22, digit: d, cb: () => this.input(d) });
    }
    this.btns.push({ x: R.x + 5 + 4 * (bw + gap), y: y + bh + gap, w: bw, h: bh, label: "消す", fs: 15, color: "#FFE6DE", cb: () => this.erase() });
    y += bh * 2 + gap * 2;
    const tw = (R.w - 10 - gap * 2) / 3;
    this.memoBtn = { x: R.x + 5, y, w: tw, h: toolH, label: "メモ", fs: 15, cb: () => { this.memoMode = !this.memoMode; this.refresh(); } };
    this.btns.push(this.memoBtn,
      { x: R.x + 5 + tw + gap, y, w: tw, h: toolH, label: "戻す", fs: 15, cb: () => this.undo() },
      { x: R.x + 5 + (tw + gap) * 2, y, w: tw, h: toolH, label: "ヒント", fs: 15, color: "#FFF3B0", icon: (ctx, x, yy, s) => BrainArt.drawLens(ctx, x, yy, s), inline: true, cb: () => this.hint() });
    this.refresh();
  }
  // 数字の ボタン: のこりの かず（0 は おせない）・メモの ときは いろを かえる
  refresh() {
    for (const b of this.btns) {
      if (b.digit) { const n = this.left(b.digit); b.badge = n > 0 && n < 9 ? String(n) : ""; b.disabled = n <= 0 || this.done; b.color = this.memoMode ? "#E3ECFF" : "#FFFDF6"; }
    }
    if (this.memoBtn) { this.memoBtn.on = this.memoMode; this.memoBtn.label = this.memoMode ? "メモ ON" : "メモ"; }
  }
  cellAt(p) { if (!p) return -1; const c = Math.floor((p.x - this.gx) / this.k), r = Math.floor((p.y - this.gy) / this.k); return c >= 0 && r >= 0 && c < 9 && r < 9 ? r * 9 + c : -1; }
  cellXY(i) { return { x: this.gx + (i % 9) * this.k, y: this.gy + ((i / 9) | 0) * this.k }; }
  downArea(p) { const i = this.cellAt(p); if (i >= 0 && !this.done) { this.sel = i; Sound.se("tap"); } }
  key(k) {
    if (this.done) return;
    const d = { up: -9, down: 9, left: -1, right: 1 }[k];
    if (d == null) return;
    const i = this.sel < 0 ? 40 : this.sel, r = (i / 9) | 0, c = i % 9;
    if ((k === "up" && r === 0) || (k === "down" && r === 8) || (k === "left" && c === 0) || (k === "right" && c === 8)) return;
    this.sel = i + d;
  }
  snap() { this.hist.push({ val: this.val.slice(), memo: this.memo.slice(), sel: this.sel }); if (this.hist.length > 300) this.hist.shift(); }
  canEdit(i) { return i >= 0 && !this.given[i] && !this.done && this.val[i] !== this.sol[i]; }
  // ただしい 数字を 入れた とき: メモを かたづけて、ぜんぶ うまったら おしまい
  placed(i, d) {
    this.memo[i] = 0;
    for (const j of NumplaRules.PEERS[i]) this.memo[j] &= ~(1 << d);
    if (this.filled() >= this.blank) this.complete();
  }
  input(d) {
    const i = this.sel;
    if (this.done) return;
    if (i < 0) { this.say("先に マスを えらんでね"); return; }
    if (this.given[i] || this.val[i] === this.sol[i]) { this.say(this.given[i] ? "そこは はじめから 入っているよ" : "そこは もう 正解だよ"); return; }
    this.snap();
    if (this.memoMode) {
      if (this.val[i]) this.val[i] = 0; // まちがいの 数字は メモに かえる
      this.memo[i] ^= 1 << d; Sound.se("pop");
    } else {
      if (this.val[i] === d) return; // おなじ まちがいを もう いちど 入れても ミスに しない
      this.val[i] = d;
      if (d === this.sol[i]) { Sound.se("good"); this.placed(i, d); }
      else { this.mistakes++; this.flash = { i, t: 0 }; this.sc.mistake("ちがうみたい"); }
    }
    this.refresh(); this.save();
  }
  erase() {
    const i = this.sel;
    if (!this.canEdit(i) || (!this.val[i] && !this.memo[i])) return;
    this.snap(); this.val[i] = 0; this.memo[i] = 0; Sound.se("cancel");
    this.refresh(); this.save();
  }
  undo() {
    const h = this.hist.pop();
    if (!h || this.done) return;
    // さいごの 1手を もとに もどす（ミス・ヒントの かずは そのまま）
    this.val = h.val; this.memo = h.memo; this.sel = h.sel; Sound.se("cancel");
    this.refresh(); this.save();
  }
  // ヒント: えらんだ マス（あいて いる・まちがい）か、人の 解き方で つぎに 入る マス → 正しい 数字と わけ
  hint() {
    if (this.done) return;
    let i = this.canEdit(this.sel) ? this.sel : -1, why = "";
    const g = this.val.map((v, k) => (v === this.sol[k] ? v : 0));
    if (i < 0) {
      const s = NumplaRules.nextStep(g);
      if (s) { i = s.i; why = { box: "この ブロックで", row: "この 行で", col: "この 列で", cell: "この マスの 候補は" }[s.how]; }
      else { const c = NumplaRules.candidates(g); let best = 10; for (let k = 0; k < 81; k++) if (!g[k] && NumplaRules.BITS[c[k]] < best) { best = NumplaRules.BITS[c[k]]; i = k; } }
    }
    if (i < 0) return;
    const d = this.sol[i];
    this.snap(); this.hints++; this.sel = i; this.val[i] = d; Sound.se("sparkle");
    this.tip = { text: why ? (why === "この マスの 候補は" ? `${why} ${d} だけ` : `${why} ${d} が 入るのは ここだけ`) : `ここは ${d}`, t: 2.6 };
    this.placed(i, d); this.refresh(); this.save();
  }
  say(text) { this.tip = { text, t: 1.6 }; Sound.se("tap"); }
  complete() {
    if (this.done) return;
    this.done = true; this.doneAt = G.t; this.sel = -1; Sound.se("sparkle");
    const N = Numpla.state(), t = Math.round(this.used());
    N.clear[this.lvId] = (N.clear[this.lvId] || 0) + 1;
    if (!N.best[this.lvId] || t < N.best[this.lvId]) N.best[this.lvId] = t;
    N.cont = null; Save.mark();
    this.sc.resultNote = `ナンプレ ${this.L.name} クリア ${N.clear[this.lvId]}回目・${Numpla.mmss(t)}（ベスト ${Numpla.mmss(N.best[this.lvId])}）・ミス ${this.mistakes}・ヒント ${this.hints}`;
    this.sc.finish(this.score());
  }
  tick(dt) {
    if (this.flash && (this.flash.t += dt) > 0.6) this.flash = null;
    if (this.tip && (this.tip.t -= dt) <= 0) this.tip = null;
    if (!this.done && (this.saveT += dt) > 5) { this.saveT = 0; this.save(); }
  }
  // ---- てんすう・コイン ----
  score() {
    const over = Math.max(0, this.used() - this.P.par) / this.P.par, pen = Math.min(20, over * 20) + this.mistakes * 6 + this.hints * 8;
    if (this.done) return 100 - pen;
    return (60 * this.filled()) / Math.max(1, this.blank) - pen - 20;
  }
  timeout() { const s = Math.min(40, this.score()); this.done = true; Numpla.state().cont = null; Save.mark(); return s; }
  payFor(rank) { return Math.round(this.P.pay * [0, 0.45, 1, 1.5][rank] * (1 + 0.1 * (Math.min(5, this.lv) - 1)) * GameEconomy.mode(this.sc.difficulty).reward); }
  repFor(rank, rep) { return rep * this.P.rep; }
  get stopText() { return `ナンプレを ここで やめる？\n続きは つぎに ナンプレを えらぶと できるよ（${Numpla.mmss(this.used())}・ミス ${this.mistakes}）。`; }
  get stopNote() { this.save(); return "とちゅうの ナンプレは のこして あるよ。つぎに ナンプレを えらぶと 続きから できるよ。"; }
  // ---- 絵 ----
  draw(ctx) {
    const { gx, gy, k } = this, W = k * 9, R = this.R, sel = this.sel, sd = sel >= 0 ? this.val[sel] : 0;
    const fade = this.done ? Math.min(1, (G.t - this.doneAt) / 0.6) : 0;
    ctx.save();
    // うえの 行: 難しさ・時間・ミス・ヒント（時間の ぼう）
    const sy = this.statusY, used = this.used(), lim = this.sc.timeLimit || this.P.limit;
    ctx.textBaseline = "middle"; ctx.font = `900 13px ${NUMPLA_FONT}`;
    ctx.fillStyle = ["#7BC67E", "#64B5F6", "#F29A1F", "#E5533D"][Numpla.LEVELS.indexOf(this.L)] || INK;
    U.rr(ctx, R.x + 6, sy + 2, 62, 20, 10); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.textAlign = "center"; ctx.fillText(this.L.name, R.x + 37, sy + 12.5);
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = `900 15px ${NUMPLA_FONT}`; ctx.fillText(Numpla.mmss(used), R.x + 76, sy + 12.5);
    ctx.textAlign = "right"; ctx.font = `800 12px ${NUMPLA_FONT}`; ctx.fillText(`ミス ${this.mistakes}　ヒント ${this.hints}`, R.x + R.w - 8, sy + 12.5);
    const bx = R.x + 128, bw = Math.max(20, R.w - 128 - 112), kk = U.clamp(1 - used / lim, 0, 1);
    U.rr(ctx, bx, sy + 8, bw, 9, 4.5); ctx.fillStyle = "#EFE6D6"; ctx.fill();
    if (kk > 0) { U.rr(ctx, bx, sy + 8, bw * kk, 9, 4.5); ctx.fillStyle = kk > 0.5 ? "#6FCF6A" : kk > 0.25 ? "#FFC23D" : "#F0605D"; ctx.fill(); }
    // ます
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(gx, gy, W, W);
    const sr = (sel / 9) | 0, sc = sel % 9, sb = sel >= 0 ? NumplaRules.BOX[sel] : -1;
    for (let i = 0; i < 81; i++) {
      const { x, y } = this.cellXY(i), r = (i / 9) | 0, c = i % 9, v = this.val[i];
      let bg = null;
      if (sel >= 0 && (r === sr || c === sc || NumplaRules.BOX[i] === sb)) bg = "#FFF5D1";
      if (sd && v === sd && !this.wrong(i)) bg = "#D6E6FF";
      if (this.wrong(i)) bg = "#FFE0DA";
      if (i === sel) bg = "#FFE07A";
      if (this.flash && this.flash.i === i) bg = `rgba(240,96,93,${0.7 - this.flash.t})`;
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, k, k); }
      if (fade) { ctx.fillStyle = `rgba(255,236,170,${0.5 * fade * (0.5 + 0.5 * Math.sin(G.t * 4 + (r + c) * 0.5))})`; ctx.fillRect(x, y, k, k); }
      if (v) {
        ctx.textAlign = "center"; ctx.font = `${this.given[i] ? 900 : 800} ${Math.round(k * 0.62)}px ${NUMPLA_FONT}`;
        ctx.fillStyle = this.given[i] ? INK : this.wrong(i) ? "#D8382B" : "#3554B5";
        ctx.fillText(String(v), x + k / 2, y + k * 0.54);
      } else if (this.memo[i]) {
        ctx.fillStyle = "#6D6A8E"; ctx.font = `700 ${Math.max(9, Math.round(k * 0.27))}px ${NUMPLA_FONT}`; ctx.textAlign = "center";
        for (let d = 1; d <= 9; d++) if (this.memo[i] & (1 << d)) ctx.fillText(String(d), x + (((d - 1) % 3) + 0.5) * (k / 3), y + (((d - 1) / 3 | 0) + 0.55) * (k / 3));
      }
    }
    // せん: ほそい・ブロックは ふとい
    ctx.strokeStyle = "#CDBFA8"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let t = 1; t < 9; t++) if (t % 3) { ctx.moveTo(gx + t * k, gy); ctx.lineTo(gx + t * k, gy + W); ctx.moveTo(gx, gy + t * k); ctx.lineTo(gx + W, gy + t * k); }
    ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath();
    for (const t of [3, 6]) { ctx.moveTo(gx + t * k, gy); ctx.lineTo(gx + t * k, gy + W); ctx.moveTo(gx, gy + t * k); ctx.lineTo(gx + W, gy + t * k); }
    ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeRect(gx, gy, W, W);
    if (sel >= 0) { const { x, y } = this.cellXY(sel); ctx.strokeStyle = "#E39B12"; ctx.lineWidth = 2.6; ctx.strokeRect(x + 1.5, y + 1.5, k - 3, k - 3); }
    // ひとこと（ヒントの わけ・おしらせ）: うえの 行に かさねる（盤の 数字は かくさない）
    if (this.tip) {
      ctx.font = `900 13px ${NUMPLA_FONT}`; ctx.textAlign = "center";
      const tw = Math.min(R.w - 8, ctx.measureText(this.tip.text).width + 28), mx = R.x + R.w / 2, my = this.statusY + 12.5;
      ctx.globalAlpha = Math.min(1, this.tip.t / 0.3);
      ctx.fillStyle = "rgba(255,255,255,0.98)"; ctx.strokeStyle = "#E39B12"; ctx.lineWidth = 2.5; U.rr(ctx, mx - tw / 2, my - 13, tw, 26, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(this.tip.text, mx, my + 1, tw - 14); ctx.globalAlpha = 1;
    }
    if (this.done) {
      ctx.globalAlpha = fade; ctx.font = `900 22px ${NUMPLA_FONT}`; ctx.textAlign = "center";
      const say = "クリア！", tw = ctx.measureText(say).width + 44, mx = gx + W / 2, my = gy + W * 0.16;
      ctx.fillStyle = "rgba(255,255,255,0.97)"; ctx.strokeStyle = "#E5533D"; ctx.lineWidth = 3; U.rr(ctx, mx - tw / 2, my - 20, tw, 40, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#E5533D"; ctx.fillText(say, mx, my + 1); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  // おきゃくさんの ふきだし: ちいさい 盤と 難しさ
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(h - 4, 34), px = x + 2, py = y + (h - s) / 2;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(px, py, s, s); ctx.strokeRect(px, py, s, s);
    ctx.lineWidth = 0.8; ctx.beginPath(); for (const t of [1, 2]) { ctx.moveTo(px + (t * s) / 3, py); ctx.lineTo(px + (t * s) / 3, py + s); ctx.moveTo(px, py + (t * s) / 3); ctx.lineTo(px + s, py + (t * s) / 3); } ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `900 9px ${NUMPLA_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    [[0, 0, "5"], [2, 1, "3"], [1, 2, "8"]].forEach(([c, r, t]) => ctx.fillText(t, px + (c + 0.5) * (s / 3), py + (r + 0.55) * (s / 3)));
    const tx = px + s + (w - s - 4) / 2;
    ctx.font = `900 13px ${NUMPLA_FONT}`; ctx.fillText(`ナンプレ ${this.L.name}`, tx, y + h * 0.32, w - s - 8);
    ctx.font = `800 11px ${NUMPLA_FONT}`; ctx.fillText(this.resumed ? "続きを おねがい！" : "1問 おねがい！", tx, y + h * 0.74, w - s - 8);
    ctx.restore();
  }
  debug(css) {
    const cell = (i) => { const { x, y } = this.cellXY(i); return css(x + this.k / 2, y + this.k / 2); };
    return { game: "numpla", lv: this.lvId, puzzle: this.puzzle, solution: NumplaRules.format(this.sol), val: NumplaRules.format(this.val), memo: [...this.memo], sel: this.sel, memoMode: this.memoMode,
      mistakes: this.mistakes, hints: this.hints, filled: this.filled(), blank: this.blank, done: this.done, resumed: this.resumed, used: Math.round(this.used()), tip: this.tip ? this.tip.text : "",
      cellCss: this.k * G.cssPerUnit, grid: { ...css(this.gx, this.gy), size: this.k * 9 * G.cssPerUnit }, empty: this.val.map((v, i) => (v === this.sol[i] ? -1 : i)).filter((i) => i >= 0).map((i) => ({ i, d: this.sol[i], ...cell(i) })),
      given: this.given.map((v, i) => (v ? i : -1)).filter((i) => i >= 0).slice(0, 3).map((i) => ({ i, ...cell(i) })) };
  }
}

// パズル こうぼうの 4つめの ゲーム（js/mg-kobo.js の KoboGames・KOBO_TASKS）
KOBO_TASKS.numpla = NumplaTask;
KoboGames.GAMES.push({ id: "numpla", name: "ナンプレ", desc: "9×9の 数字パズル", adult: true, howto: NUMPLA_HOWTO, pick: (store) => Numpla.pick(store), hello: (sc) => Numpla.hello(sc) });
