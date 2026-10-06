// 英語ゲームの おてつだい（あたまの たいそうの 4つめ・大人むけ・UI-82。オーナーの 依頼 2026-10-04「脳トレは、英語ゲーム（英語は中学生レベルと
// 高校レベル選べる。また、英単語の日本語の意味を選択するゲームと、文章中に英語を当てはめるゲームがある。）」）。
// おみせで「おてつだいする」→「英語」→ レベル（中学・高校）→ あそびかた（単語の意味・文の穴うめ）→ おきゃくさん 1人に 10問（ShopScene の rounds 1）。
//  ・単語の意味: 英単語（品詞つき）の 意味を 4つから。まちがいは おなじ レベル・品詞で、似た 意味の なかまは まぜない（js/eng-words.js）
//  ・文の穴うめ: 和訳つきの 英文の ___ に 入る 語を 4つから（js/eng-sentences.js。まちがいの 3つは 文ごとに 決めて ある）
//  ・こたえると 正解・まちがいと 解説（意味・和訳・文法の ポイント）→「次へ」。おわりに まちがえた ものを まとめて 見せる
// 盤は 画面いっぱい（ShopScene の full）。大人むけ なので 問題・用語は 漢字かな まじり（AGENTS.md の 5）。
// TOEIC対策（UI-98。オーナーの 依頼 2026-10-06「頭の体操のお手伝いの英語についてTOEIC対策のお手伝いも追加してほしい。」）: 3つめの レベル。
//  ・単語の意味: ビジネスの 場面で よく 出る 語（js/eng-words.js の toeic）・文の穴うめ: Reading の Part 5（短文穴埋め問題）と おなじ 形（js/eng-sentences.js の toeic）
//  ・Part 5 は 1問 20びょう くらいで とくのが めやす と いわれる ので、10問の めやすは 200びょう。コイン・ひょうばんは 高校より すこし おおい
//  ・TOEIC は ETS の 登録商標。この ゲームは ETS の 承認を 受けて いない（EnglishGame.NOTICE を TOEIC を えらぶ ところと せってい に だす）。
//    ETS の きまり: いちばん はじめに めだつ ところ（レベルの なまえ）に ® を つける・ことわりの 文を 読める 大きさで だす
const ENG_PLAY = {
  // n: 1回の 問題の かず・pay: ○ の コイン（◎ は 1.5ばい）・rep: ひょうばんの ばいりつ・par: こたえる 時間の めやす（びょう。こえると すこし へる）
  jh: { n: 10, pay: 300, rep: 2, par: 120 },
  hs: { n: 10, pay: 450, rep: 3, par: 150 },
  toeic: { n: 10, pay: 600, rep: 4, par: 200 },
};
// color: 問題の うえの ふだの いろ
const ENG_LEVELS = [{ id: "jh", name: "中学レベル", short: "中学", note: "基本の単語と文法", color: "#64B5F6" }, { id: "hs", name: "高校レベル", short: "高校", note: "受験レベルの単語と構文", color: "#E5893D" },
  { id: "toeic", name: "TOEIC®対策", short: "TOEIC", note: "ビジネス英語・Part 5形式", color: "#7E57C2" }];
const ENG_MODES = [{ id: "word", name: "単語の意味", note: "英単語の意味を4つから選ぶ" }, { id: "fill", name: "文の穴うめ", note: "英文の空所に入る語を選ぶ" }];
const ENG_POS = { n: "名詞", v: "動詞", a: "形容詞", d: "副詞" };
const ENG_FONT = "'M PLUS Rounded 1c', sans-serif";
const ENG_HOWTO = [
  "英語は、中学レベル・高校レベル・\nTOEIC®対策から 選べるよ ホー。",
  "「単語の意味」は 英単語の意味を、\n「文の穴うめ」は 空所に入る語を選ぶ。",
  "1回 10問。答えると 正解と 解説が出るから、\n「次へ」で 進んでね。",
  "全問正解で ◎。まちがえた ものは\n最後に まとめて 見られるよ。",
];
const EnglishGame = {
  // 商標の ことわり（ETS の きまり）。TOEIC を えらぶ ところ（日本語）と せってい（英語。js/menu.js）に だす
  NOTICE: { ja: "※TOEIC®はETSの登録商標です。\nこのゲームはETSの推薦・承認を受けていません。", en: "TOEIC® is a registered trademark of ETS. This product is not endorsed or approved by ETS." },
  state() { return Save.d.shops.brain.eng; },
  key(lv, mode) { return lv + "_" + mode; },
  level(id) { return ENG_LEVELS.find((L) => L.id === id) || ENG_LEVELS[0]; },
  modeOf(id) { return ENG_MODES.find((M) => M.id === id) || ENG_MODES[0]; },
  // 問題を n こ: さいきん だした もの（recent）を さけて えらぶ
  questions(lv, mode, n = 10, rnd = Math.random) {
    const E = this.state(), key = this.key(lv, mode), list = mode === "fill" ? ENG_FILL[lv] : ENG_WORDS[lv];
    const recent = (E.recent[key] = Array.isArray(E.recent[key]) ? E.recent[key] : []);
    let pool = list.map((_, i) => i).filter((i) => !recent.includes(i));
    if (pool.length < n) { recent.length = 0; pool = list.map((_, i) => i); }
    const pickIds = [];
    while (pickIds.length < n && pool.length) pickIds.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    recent.push(...pickIds); while (recent.length > Math.floor(list.length * 0.6)) recent.shift();
    return pickIds.map((id) => (mode === "fill" ? this.fillQ(lv, id, rnd) : this.wordQ(lv, id, rnd)));
  },
  // 単語の 問題: まちがいは おなじ 品詞・べつの 意味・べつの なかま
  wordQ(lv, id, rnd = Math.random) {
    const [en, pos, ans, grp] = ENG_WORDS[lv][id];
    const others = ENG_WORDS[lv].filter((w, i) => i !== id && w[1] === pos && w[2] !== ans && (!grp || w[3] !== grp));
    const wrong = [];
    while (wrong.length < 3 && others.length) wrong.push(others.splice(Math.floor(rnd() * others.length), 1)[0][2]);
    return { kind: "word", id, en, pos, ans, choices: U.shuffle([ans, ...wrong]) };
  },
  fillQ(lv, id) {
    const [en, ans, wrong, ja, point] = ENG_FILL[lv][id];
    return { kind: "fill", id, en, ans, ja, point, choices: U.shuffle([ans, ...wrong]) };
  },
  // あたまの たいそうで「英語」を えらんだ あと（BrainGames.choose の pick）: レベル → あそびかた。やめたら null
  async pick(store) {
    const E = this.state(), name = store.owner.name;
    const i = await UI.ask(`${name}\n英語の レベルは どうする ホー？\n${ENG_LEVELS.map((L) => `・${L.name}：${L.note}`).join("\n")}`, [...ENG_LEVELS.map((L) => L.name), "やめる"]);
    if (i < 0 || i >= ENG_LEVELS.length) return null;
    const lv = ENG_LEVELS[i].id, best = (M) => E.best[this.key(lv, M.id)];
    const j = await UI.ask(`${name}\n${ENG_LEVELS[i].name}だね。どちらに する？\n${ENG_MODES.map((M) => `・${M.name}：${M.note}`).join("\n")}${lv === "toeic" ? "\n" + this.NOTICE.ja : ""}`, [...ENG_MODES.map((M) => M.name + (best(M) ? `（ベスト ${best(M)}/10）` : "")), "やめる"]);
    if (j < 0 || j >= ENG_MODES.length) return null;
    E.lv = lv; E.mode = ENG_MODES[j].id; Save.mark();
    return E.mode;
  },
  hello(sc) { const E = this.state(); return `きょうも よろしくね！ 英語（${this.level(E.lv).short}・${this.modeOf(E.mode).name}）を\n10問 おねがい ホー。（おみせ Lv.${sc.lv}）`; },
};

// 英文を はばに あわせて 行に わける。___ を fill に かえた ことばは blank（いろを かえる）
function englishSentenceLines(ctx, en, fill, maxW) {
  const lines = [];
  let line = [], w = 0;
  const sp = ctx.measureText(" ").width;
  for (const raw of en.split(" ")) {
    const t = { text: raw.includes("___") ? raw.replace("___", fill) : raw, blank: raw.includes("___") }, tw = ctx.measureText(t.text).width;
    if (line.length && w + sp + tw > maxW) { lines.push(line); line = []; w = 0; }
    w += (line.length ? sp : 0) + tw; line.push(t);
  }
  if (line.length) lines.push(line);
  return lines;
}
// 和文は 1もじずつ・英文は ことばごとに 行を わける
function englishWrapText(ctx, text, maxW, words = true) {
  const parts = words ? text.split(" ") : [...text], lines = [];
  let line = "";
  for (const p of parts) {
    const t = line ? line + (words ? " " : "") + p : p;
    if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = p; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

class BrainEngTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const E = EnglishGame.state();
    this.lvId = ENG_PLAY[E.lv] ? E.lv : "jh"; this.mode = E.mode === "fill" ? "fill" : "word";
    this.L = EnglishGame.level(this.lvId); this.M = EnglishGame.modeOf(this.mode); this.P = ENG_PLAY[this.lvId]; this.nq = this.P.n;
    this.qs = EnglishGame.questions(this.lvId, this.mode, this.nq);
    this.index = 0; this.correct = 0; this.missed = []; this.answered = null; this.think = 0; this.done = false;
    this.timeLimit = 20 * 60; this.title = `英語（${this.L.short}・${this.M.name}）`;
  }
  // ShopScene: 盤は 画面いっぱい・おきゃくさんは 1人
  static get full() { return true; }
  static get rounds() { return 1; }
  get boardKey() { return `${this.lvId}_${this.mode}`; } // みんなの ランキングは レベル × あそびかた ごと（js/online.js）
  get cur() { return this.qs[this.index] || null; }
  layout(R) {
    this.R = R;
    // たてに: うえの 行・問題の カード・選択肢 4つ・「次へ」。ボタンは 44px いじょう
    const pad = 4, statusH = 24, gap = 8, bh = U.clamp(Math.floor((R.h - 300) / 6), 46, 60), nextH = Math.max(46, bh - 4);
    this.statusY = R.y + pad;
    this.cardY = this.statusY + statusH + 6;
    const choicesH = bh * 4 + 6 * 3;
    this.cardH = Math.max(150, Math.min(240, R.h - pad * 2 - statusH - 6 - gap - choicesH - gap - nextH));
    this.choiceY = this.cardY + this.cardH + gap; this.bh = bh;
    this.nextY = this.choiceY + choicesH + gap; this.nextH = nextH;
    this.setup();
  }
  setup() {
    const q = this.cur, R = this.R;
    this.btns = [];
    if (!q) return;
    const A = this.answered;
    q.choices.forEach((c, i) => {
      const right = c === q.ans, picked = A && A.pick === i;
      this.btns.push({ x: R.x + 6, y: this.choiceY + i * (this.bh + 6), w: R.w - 12, h: this.bh, label: c, fs: q.kind === "fill" ? 17 : 16, choice: i,
        color: A ? (right ? "#C8EFC4" : picked ? "#FFD6D0" : "#F2EEE6") : "#FFFDF6", cb: () => this.answer(i) });
    });
    if (A) this.btns.push({ x: R.x + 6, y: this.nextY, w: R.w - 12, h: this.nextH, label: this.index + 1 >= this.nq ? "結果へ" : "次へ", fs: 16, color: "#FFE27A", next: true, cb: () => this.next() });
  }
  answer(i) {
    const q = this.cur;
    if (!q || this.answered || this.done) return;
    const ok = q.choices[i] === q.ans;
    this.answered = { pick: i, ok };
    if (ok) { this.correct++; Sound.se("good"); }
    else { this.missed.push(q); this.sc.mistake("ちがうよ"); }
    this.setup();
  }
  next() {
    if (!this.answered || this.done) return;
    this.answered = null; this.index++;
    if (!this.cur) { this.complete(); return; }
    Sound.se("tap"); this.setup();
  }
  complete() {
    this.done = true; this.btns = [];
    const E = EnglishGame.state(), key = EnglishGame.key(this.lvId, this.mode);
    E.plays[key] = (E.plays[key] || 0) + 1;
    if (this.correct > (E.best[key] || 0)) E.best[key] = this.correct;
    Save.mark();
    const miss = this.missed.slice(0, 5).map((q) => (q.kind === "word" ? `${q.en}＝${q.ans}` : `${q.ans}（${q.point}）`)).join("・");
    this.sc.resultNote = `英語 ${this.L.name}・${this.M.name} ${this.correct}/${this.nq}問 正解（ベスト ${E.best[key]}）` + (miss ? `。まちがえた: ${miss}${this.missed.length > 5 ? " ほか" : ""}` : "。全問正解！");
    Sound.se(this.correct >= this.nq ? "sparkle" : "pop");
    this.sc.finish(this.score());
  }
  tick(dt) { if (!this.answered && !this.done) this.think += dt; }
  // てんすう: 正解の わりあい − めやすを こえた 時間（10 まで）。全問正解で ◎（92 いじょう）
  score() { const pen = Math.min(10, (Math.max(0, this.think - this.P.par) / this.P.par) * 10); return (100 * this.correct) / this.nq - pen; }
  timeout() { const s = Math.min(40, this.score()); this.done = true; return s; }
  payFor(rank) { return Math.round(this.P.pay * [0, 0.45, 1, 1.5][rank] * (1 + 0.1 * (Math.min(5, this.lv) - 1)) * GameEconomy.mode(this.sc.difficulty).reward); }
  repFor(rank, rep) { return rep * this.P.rep; }
  // ---- 絵 ----
  draw(ctx) {
    const R = this.R, q = this.cur || this.qs[this.qs.length - 1], A = this.answered;
    ctx.save(); ctx.textBaseline = "middle";
    // うえの 行: レベル・あそびかた・なん問め・正解の かず
    const sy = this.statusY;
    ctx.fillStyle = this.L.color; U.rr(ctx, R.x + 6, sy + 2, 118, 20, 10); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.font = `900 12px ${ENG_FONT}`; ctx.textAlign = "center"; ctx.fillText(`${this.L.short}・${this.M.name}`, R.x + 65, sy + 12.5, 110);
    ctx.fillStyle = INK; ctx.font = `900 15px ${ENG_FONT}`; ctx.fillText(`${Math.min(this.index + 1, this.nq)} / ${this.nq}`, R.x + R.w / 2 + 20, sy + 12.5);
    ctx.textAlign = "right"; ctx.font = `800 12px ${ENG_FONT}`; ctx.fillText(`正解 ${this.correct}`, R.x + R.w - 8, sy + 12.5);
    // 問題の カード
    const cx = R.x + 6, cw = R.w - 12, cy = this.cardY, ch = this.cardH, mid = cx + cw / 2;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, cx, cy, cw, ch, 14); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center";
    const fb = A ? 46 : 0; // した: こたえの せつめい
    if (q.kind === "word") {
      ctx.fillStyle = "#8A7D6A"; ctx.font = `800 12px ${ENG_FONT}`; ctx.fillText(`（${ENG_POS[q.pos]}）`, mid, cy + 22);
      ctx.fillStyle = INK; ctx.font = `900 ${q.en.length > 11 ? 30 : 36}px ${ENG_FONT}`; ctx.fillText(q.en, mid, cy + (ch - fb) / 2 + 8, cw - 20);
      ctx.fillStyle = "#8A7D6A"; ctx.font = `700 12px ${ENG_FONT}`; ctx.fillText("意味を選んでね", mid, cy + ch - fb - 16);
    } else {
      // 英文（あなは こたえると 正解で うまって みどり。おなじ 語が ほかに あっても あなの ところだけ いろを かえる）と 和訳
      ctx.font = `800 17px ${ENG_FONT}`;
      const L = englishSentenceLines(ctx, q.en, A ? q.ans : "_____", cw - 24), top = cy + 22, lh = 24, sp = ctx.measureText(" ").width;
      L.forEach((toks, k) => {
        const y = top + k * lh, w = toks.reduce((a, t) => a + ctx.measureText(t.text).width, 0) + sp * (toks.length - 1);
        let x = mid - w / 2;
        ctx.textAlign = "left";
        for (const t of toks) { ctx.fillStyle = t.blank ? (A ? "#2E8B3A" : "#3554B5") : INK; ctx.fillText(t.text, x, y); x += ctx.measureText(t.text).width + sp; }
        ctx.textAlign = "center";
      });
      ctx.font = `700 13px ${ENG_FONT}`; ctx.fillStyle = "#6D665C";
      englishWrapText(ctx, q.ja, cw - 24, false).slice(0, 2).forEach((ln, k) => ctx.fillText(ln, mid, top + L.length * lh + 6 + k * 18));
    }
    if (A) {
      // こたえの せつめい: ○／× と 意味・ポイント
      const y = cy + ch - fb / 2 - 2;
      ctx.fillStyle = A.ok ? "#2E8B3A" : "#D8382B"; ctx.font = `900 16px ${ENG_FONT}`;
      const head = A.ok ? "○ 正解！" : "× 正解は";
      const tail = q.kind === "word" ? `${q.en} ＝ ${q.ans}` : `${q.ans}（${q.point}）`;
      ctx.fillText(`${head} ${tail}`, mid, y, cw - 16);
    }
    ctx.restore();
  }
  // おきゃくさんの ふきだし
  drawOrder(ctx, x, y, w, h) {
    ctx.save();
    const s = Math.min(h - 4, 34), px = x + 2, py = y + (h - s) / 2;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; U.rr(ctx, px, py, s, s, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3554B5"; ctx.font = `900 13px ${ENG_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ABC", px + s / 2, py + s / 2 + 1, s - 4);
    const tx = px + s + (w - s - 4) / 2;
    ctx.fillStyle = INK; ctx.font = `900 13px ${ENG_FONT}`; ctx.fillText(`英語 ${this.L.short}・${this.M.name}`, tx, y + h * 0.32, w - s - 8);
    ctx.font = `800 11px ${ENG_FONT}`; ctx.fillText(`${this.nq}問 おねがい！`, tx, y + h * 0.74, w - s - 8);
    ctx.restore();
  }
  debug(css) {
    const q = this.cur;
    return { game: "eng", lv: this.lvId, mode: this.mode, index: this.index, nq: this.nq, correct: this.correct, missed: this.missed.map((m) => m.en), done: this.done, think: Math.round(this.think),
      answered: this.answered ? { ...this.answered } : null,
      cur: q ? { kind: q.kind, id: q.id, en: q.en, pos: q.pos || null, ja: q.ja || null, ans: q.ans, choices: [...q.choices], right: q.choices.indexOf(q.ans) } : null,
      choices: this.btns.filter((b) => b.choice != null).map((b) => ({ label: b.label, ...css(b.x + b.w / 2, b.y + b.h / 2), h: b.h * G.cssPerUnit })),
      next: (() => { const b = this.btns.find((x) => x.next); return b ? { label: b.label, ...css(b.x + b.w / 2, b.y + b.h / 2) } : null; })() };
  }
}

// あたまの たいそうの 4つめの ゲーム（js/mg-brain.js の BrainGames・BRAIN_TASKS）。variant は "eng"・レベルと あそびかたは Save.d.shops.brain.eng
BRAIN_TASKS.eng = BrainEngTask;
BrainGames.GAMES.push({ id: "eng", name: "英語", desc: "単語の意味・文の穴うめ", adult: true, boards: ENG_LEVELS.flatMap((L) => ENG_MODES.map((M) => ({ id: `${L.id}_${M.id}`, name: `${L.short}・${M.name}` }))), howto: ENG_HOWTO, pick: (store) => EnglishGame.pick(store).then((m) => (m ? "eng" : null)), hello: (sc) => EnglishGame.hello(sc) });
