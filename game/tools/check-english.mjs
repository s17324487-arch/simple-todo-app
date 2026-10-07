// 英語ゲーム（あたまの たいそうの 4つめ・大人むけ・UI-82。js/eng-words.js・js/eng-sentences.js・js/mg-english.js）の 検査。ブラウザ なしで たしかめる。
// とうろく・単語（レベル・品詞・意味が かさならない・なかま・レベルを またがない）・穴うめの 文（あなは 1つ・選択肢 4つ・和訳・ポイント）・
// 問題の えらびかた（10問・さいきんの 問題を さける・まちがいの 選択肢は おなじ 品詞で べつの 意味と なかま）・あそぶ ところ（こたえる・次へ・
// てんすう・コイン・ひょうばん・ベスト・まちがえた ものの まとめ）・2つの スマホの 画面（390×844・375×667）で はみださない・44px・セーブ。
// TOEIC対策（UI-98）: 3つめの レベル（ビジネスの 単語・Part 5 形式の 穴うめ・中学／高校と かさならない・コイン・商標の ことわり・ふるい セーブ）。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ENG_WORDS: W, ENG_FILL: F, ENG_PLAY: PLAY, ENG_LEVELS, ENG_MODES, ENG_POS, ENG_HOWTO, EnglishGame: EG, UI, BrainEngTask: Eng, BrainGames: BG, BRAIN_TASKS, BrainTask, HOWTO, ShopScene, Save, G, GameEconomy, PokaDebug } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const LV = ["jh", "hs", "toeic"]; // レベル（中学・高校・TOEIC対策）
const seeded = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const ENG_NOTICE = EG.NOTICE;

// ---- 1. とうろく ----
{
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("mg-brain.js") > 0 && at("mg-brain.js") < at("eng-words.js") && at("eng-words.js") < at("eng-sentences.js") && at("eng-sentences.js") < at("mg-english.js") && at("mg-english.js") < at("nerikasu-town.js"), "index.html: mg-brain → eng-words → eng-sentences → mg-english の じゅん");
  for (const f of ["eng-words.js", "eng-sentences.js", "mg-english.js"]) ok(sw.includes(`"./js/${f}"`), `sw.js の FILES に ${f}`);
  ok(BRAIN_TASKS.eng === Eng && BrainTask.classOf("eng") === Eng && Eng.full === true && Eng.rounds === 1, "あたまの たいそうの 4つめ（画面いっぱい・おきゃくさん 1人）");
  const g = BG.game("eng");
  ok(g.id === "eng" && g.name === "英語" && g.adult && typeof g.pick === "function" && typeof g.hello === "function" && g.howto === ENG_HOWTO && BG.GAMES[BG.GAMES.length - 1] === g, "BrainGames の 英語（大人むけ・レベルと あそびかたを きく・ひとこと・せつめい）");
  ok(HOWTO.brain({ variant: "eng" }).slice(1).join() === ENG_HOWTO.join() && ENG_HOWTO.length === 4 && ENG_HOWTO.every((l) => l.split("\n").every((r) => width(r) <= 26)), "はじめての せつめい 4つ（1行 26もじ まで）");
  ok(ENG_HOWTO.some((l) => /中学/.test(l) && /高校/.test(l) && /TOEIC®対策/.test(l)) && ENG_HOWTO.some((l) => /単語の意味/.test(l) && /穴うめ/.test(l)) && ENG_HOWTO.some((l) => /次へ/.test(l)), "せつめいの なかみ（レベル 3つ・2つの あそびかた・次へ）");
  ok(typeof PokaDebug.english === "function", "PokaDebug.english");
  ok(ENG_LEVELS.map((L) => L.id).join() === LV.join() && ENG_MODES.map((M) => M.id).join() === "word,fill" && Object.keys(PLAY).join() === LV.join(), "レベル 3つ（中学・高校・TOEIC対策）・あそびかた 2つ");
  ok(ENG_LEVELS.every((L) => /^#[0-9A-F]{6}$/i.test(L.color)) && new Set(ENG_LEVELS.map((L) => L.color)).size === ENG_LEVELS.length, "レベルごとに ちがう ふだの いろ");
  const T = EG.level("toeic");
  ok(T.id === "toeic" && T.name === "TOEIC®対策" && T.short === "TOEIC" && /Part 5/.test(T.note), "TOEIC対策の なまえ・Part 5 形式");
  // 商標の ことわり（ETS の きまり）: えらぶ ところ（日本語）・せってい（英語）・データの ファイル
  ok(ENG_NOTICE.en === "TOEIC® is a registered trademark of ETS. This product is not endorsed or approved by ETS." && /TOEIC®/.test(ENG_NOTICE.ja) && /ETS/.test(ENG_NOTICE.ja) && /登録商標/.test(ENG_NOTICE.ja) && /承認/.test(ENG_NOTICE.ja), "商標の ことわり（英語・日本語）");
  const src = (f) => readFileSync(new URL(`../js/${f}`, import.meta.url), "utf8");
  ok(/EnglishGame\.NOTICE\.en/.test(src("menu.js")) && ["eng-words.js", "eng-sentences.js"].every((f) => src(f).includes(ENG_NOTICE.en)), "せってい に 英語の ことわり・データの ファイルにも");
  for (const L of ENG_LEVELS) ok(width(`・${L.name}：${L.note}`) <= 19.5 && width(L.name) <= 9, `${L.id}: えらぶ ときの ことば（みじかく）`);
  for (const M of ENG_MODES) ok(width(`・${M.name}：${M.note}`) <= 19.5 && width(M.name + "（ベスト 10/10）") <= 14, `${M.id}: えらぶ ときの ことば（みじかく）`);
}

// ---- 2. 単語 ----
const ascii = /^[a-z][a-z-]*$/;
for (const lv of LV) {
  const L = W[lv];
  ok(Array.isArray(L) && L.length >= { jh: 250, hs: 320, toeic: 280 }[lv], `${lv}: 単語 ${L.length}`);
  const words = new Set(), means = new Set(), groups = {};
  for (const e of L) {
    const [en, pos, mean, grp] = e, where = `${lv} ${en}`;
    ok(e.length === 3 || (e.length === 4 && /^[a-z]+$/.test(grp)), `${where}: かたち [英語, 品詞, 意味, なかま]`);
    ok(ascii.test(en) && en.length <= 15, `${where}: 英語は 小文字の 1語（15もじ まで）`);
    ok(ENG_POS[pos], `${where}: 品詞`);
    ok(typeof mean === "string" && mean.length > 0 && width(mean) <= 9 && !/[a-zA-Z]/.test(mean), `${where}: 意味（日本語・ボタンに おさまる）`);
    ok(!words.has(en), `${where}: おなじ 単語が 2つ`); words.add(en);
    ok(!means.has(pos + mean), `${where}: おなじ 品詞で 意味「${mean}」が かさなる`); means.add(pos + mean);
    if (grp) (groups[pos + grp] = groups[pos + grp] || []).push(en);
  }
  for (const [k, list] of Object.entries(groups)) ok(list.length >= 2, `${lv}: なかま ${k} は 2語 いじょう（${list}）`);
  for (const pos of Object.keys(ENG_POS)) ok(L.filter((e) => e[1] === pos).length >= 20, `${lv}: ${ENG_POS[pos]}は 20語 いじょう`);
}
{ const jh = new Set(W.jh.map((e) => e[0])); ok(W.hs.every((e) => !jh.has(e[0])), "中学と 高校で おなじ 単語が ない"); }
{ const base = new Set([...W.jh, ...W.hs].map((e) => e[0])), dup = W.toeic.filter((e) => base.has(e[0])).map((e) => e[0]); ok(!dup.length, "TOEIC対策の 単語は 中学・高校と かさならない " + dup); }
// TOEIC対策は ビジネスの 場面の 語（会議・出張・経理・人事・物流・店舗）
{ const has = (w) => W.toeic.some((e) => e[0] === w); ok(["agenda", "invoice", "itinerary", "reimburse", "applicant", "shipment", "warranty", "quarterly"].every(has), "TOEIC対策の 単語に ビジネスの 語"); }

// ---- 3. 穴うめの 文 ----
for (const lv of LV) {
  const L = F[lv], seen = new Set();
  ok(Array.isArray(L) && L.length >= (lv === "toeic" ? 100 : 95), `${lv}: 穴うめ ${L.length}もん`);
  for (const e of L) {
    const [en, ans, wrong, ja, point] = e, where = `${lv}「${en}」`, ch = [ans, ...wrong];
    ok(e.length === 5 && Array.isArray(wrong) && wrong.length === 3, `${where}: かたち [英文, 正解, まちがい 3つ, 和訳, ポイント]`);
    ok((en.match(/___/g) || []).length === 1 && /^[\x20-\x7E—]+$/.test(en) && en.length <= 72, `${where}: あなは 1つ・英文（72もじ まで）`);
    ok(new Set(ch).size === 4 && ch.every((c) => /^[A-Za-z][A-Za-z ']*$/.test(c) && width(c) <= 12), `${where}: 選択肢 4つ（ちがう・英語・ボタンに おさまる）`);
    ok(!seen.has(en), `${where}: おなじ 文が 2つ`); seen.add(en);
    ok(typeof ja === "string" && ja.length >= 4 && ja.length <= 40 && /[。？]$/.test(ja), `${where}: 和訳`);
    ok(typeof point === "string" && point.length > 0 && width(point) <= 14, `${where}: ポイント（みじかく）`);
    if (en.startsWith("___")) ok(ch.every((c) => /^[A-Z]/.test(c)), `${where}: 文の はじめの あなは 大文字で そろえる`);
    else ok(ch.every((c) => c === "I" || /^[a-z]/.test(c) || /^[A-Z]/.test(ans) === /^[A-Z]/.test(c)), `${where}: 大文字・小文字が そろう`);
    ok(!/\s{2}|\s[.,?!]/.test(en.replace("___", "x")), `${where}: スペースの つかいかた`);
  }
}

{ const base = new Set([...F.jh, ...F.hs].map((e) => e[0])); ok(F.toeic.every((e) => !base.has(e[0])), "TOEIC対策の 文は 中学・高校と ちがう"); }
// TOEIC対策の 文は Part 5 の よくある かたち（品詞・動詞の 形・前置詞と 接続詞・関係詞・語い）を まんべんなく
{
  const by = (re) => F.toeic.filter((e) => re.test(e[4])).length;
  ok(by(/副詞|形容詞|名詞/) >= 25 && by(/完了|受け身|未来|動名詞|不定詞|単数|複数|仮定法|to$|ing/) >= 20 && by(/by|until|during|despite|although|though|while|for|on|at|in|between|among|so that|due to|either|neither|as /i) >= 20 && by(/who|whose|which|that|where|whoever|anyone|代名詞|目的格/) >= 8, "TOEIC対策の 穴うめの かたち（品詞・動詞・前置詞と 接続詞・関係詞）");
}

// ---- 4. 問題の えらびかた ----
Save.d = Save.fresh();
const E = () => Save.d.shops.brain.eng;
for (const lv of LV) for (const mode of ["word", "fill"]) {
  const rnd = seeded(lv.length * 10 + mode.length), list = mode === "fill" ? F[lv] : W[lv];
  let prev = null;
  for (let r = 0; r < 12; r++) {
    const qs = EG.questions(lv, mode, 10, rnd), ids = qs.map((q) => q.id);
    ok(qs.length === 10 && new Set(ids).size === 10 && ids.every((i) => i >= 0 && i < list.length), `${lv} ${mode}: 10問・ちがう 問題`);
    if (prev) ok(ids.every((i) => !prev.includes(i)), `${lv} ${mode}: つづけて おなじ 問題を ださない`);
    prev = ids;
    for (const q of qs) {
      ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.ans), `${lv} ${mode} ${q.en}: 選択肢 4つ・正解が 1つ`);
      if (mode === "word") {
        const w = list[q.id], others = q.choices.filter((c) => c !== q.ans).map((m) => list.find((e) => e[2] === m && e[1] === w[1]));
        ok(others.every(Boolean) && others.every((e) => e[0] !== w[0] && (!w[3] || e[3] !== w[3])), `${lv} ${q.en}: まちがいは おなじ 品詞・べつの なかま`);
      }
    }
  }
  ok(E().recent[EG.key(lv, mode)].length <= Math.floor(list.length * 0.6), `${lv} ${mode}: さいきんの 問題の きろくは 6わり まで`);
}

// ---- 5. あそぶ ところ（ブラウザ なし）----
const makeSc = (difficulty = "normal") => ({ timeLimit: 0, timeLeft: 0, difficulty, mistakes: 0, finish(s) { this.done = s; }, mistake(t) { this.said = t; this.mistakes++; }, addFx() {}, timePenalty: () => 0 });
const PHONES = [[390, 844], [375, 667]].map(([cw, ch]) => {
  const tile = Math.max(16, Math.round((32 * cw) / 360)), px = tile / 32, sc = Object.create(ShopScene.prototype);
  G.W = cw / px; G.H = ch / px; sc.full = true; sc.layout();
  return { name: `${cw}×${ch}`, px, R: { ...sc.R } };
});
const start = (lv, mode, sc = makeSc(), workLv = 3, P = PHONES[1]) => { E().lv = lv; E().mode = mode; const t = new Eng(sc, workLv); sc.timeLimit = t.timeLimit; sc.timeLeft = t.timeLimit; G.cssPerUnit = P.px; t.layout(P.R); return t; };
const tap = (t, b) => t.down({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const choiceBtn = (t, right) => t.btns.find((b) => b.choice != null && (b.label === t.cur.ans) === right);
const nextBtn = (t) => t.btns.find((b) => b.next);
for (const P of PHONES) for (const lv of LV) for (const mode of ["word", "fill"]) {
  const t = start(lv, mode, makeSc(), 3, P), where = `${P.name} ${lv} ${mode}`, R = P.R, css = P.px;
  const inR = (b) => b.x >= R.x - 0.5 && b.y >= R.y - 0.5 && b.x + b.w <= R.x + R.w + 0.5 && b.y + b.h <= R.y + R.h + 0.5;
  ok(t.lvId === lv && t.mode === mode && t.nq === 10 && t.qs.length === 10 && t.L.color === EG.level(lv).color, `${where}: 10問`);
  ok(t.btns.length === 4 && t.btns.every(inR) && t.btns.every((b) => b.h * css >= 44 && b.w * css >= 44), `${where}: 選択肢 4つは 44px いじょう・はみださない`);
  ok(t.cardY >= t.statusY + 24 && t.cardY + t.cardH <= t.choiceY && t.cardH >= 150, `${where}: 問題の カードは 選択肢の うえ（たかさ ${Math.round(t.cardH)}）`);
  tap(t, choiceBtn(t, false));
  const nb = nextBtn(t);
  ok(t.answered && !t.answered.ok && t.missed.length === 1 && nb && inR(nb) && nb.h * css >= 44 && t.btns.filter((b) => b.choice != null).every((b) => b.y + b.h <= nb.y), `${where}: まちがい → 次へ（44px・選択肢の した）`);
  // 正解・まちがいの いろ
  const right = t.btns.find((b) => b.label === t.cur.ans), picked = t.btns.find((b) => b.choice === t.answered.pick);
  ok(right.color === "#C8EFC4" && picked.color === "#FFD6D0", `${where}: 正解は みどり・えらんだ まちがいは あか`);
}
{ // 10問 こたえて おしまい: てんすう・ベスト・まちがえた ものの まとめ
  const sc = makeSc(), t = start("jh", "word", sc, 1);
  for (let k = 0; k < 10; k++) {
    tap(t, choiceBtn(t, k !== 3)); // 4問めだけ まちがえる
    const before = t.index;
    tap(t, nextBtn(t));
    if (k < 9) ok(t.index === before + 1 && !t.answered, `次へで つぎの 問題（${k + 1}）`);
  }
  ok(t.done && t.correct === 9 && t.missed.length === 1 && sc.done === 90, "9問 正解 → 90（○）");
  ok(E().best.jh_word === 9 && E().plays.jh_word === 1, "ベストと かず");
  ok(/英語 中学レベル・単語の意味 9\/10問 正解（ベスト 9）。まちがえた: /.test(sc.resultNote) && sc.resultNote.includes(t.missed[0].en + "＝" + t.missed[0].ans), "けっかの ことば（まちがえた 単語と 意味）");
  const u = start("hs", "fill", makeSc(), 1);
  for (let k = 0; k < 10; k++) { tap(u, choiceBtn(u, true)); tap(u, nextBtn(u)); }
  ok(u.done && u.correct === 10 && u.sc.done === 100 && /全問正解/.test(u.sc.resultNote) && E().best.hs_fill === 10, "全問正解 → 100（◎）・ベスト 10");
  const v = start("hs", "fill", makeSc(), 1); v.correct = 10; v.think = PLAY.hs.par * 2;
  ok(Math.abs(v.score() - 90) < 1e-9, "めやすの 2ばいの 時間 → −10");
  v.think = PLAY.hs.par * 9; ok(Math.abs(v.score() - 90) < 1e-9, "時間の へりは 10 まで");
  const x = start("toeic", "fill", makeSc(), 1);
  for (let k = 0; k < 10; k++) { tap(x, choiceBtn(x, true)); tap(x, nextBtn(x)); }
  ok(x.done && x.correct === 10 && x.sc.done === 100 && /英語 TOEIC®対策・文の穴うめ 10\/10問 正解（ベスト 10）。全問正解/.test(x.sc.resultNote) && E().best.toeic_fill === 10 && E().plays.toeic_fill === 1, "TOEIC対策の 穴うめ 10問 → 100・ベスト");
  const y = start("toeic", "word", makeSc(), 1); y.correct = 10; y.think = PLAY.toeic.par * 2;
  ok(Math.abs(y.score() - 90) < 1e-9, "TOEIC対策: めやすの 2ばいの 時間 → −10");
  const w = start("jh", "fill", makeSc(), 1); tap(w, choiceBtn(w, true)); const think = w.think; w.tick(5); ok(w.think === think, "こたえを よんで いる あいだは 時間を かぞえない");
  ok(w.timeout() <= 40 && w.done, "時間ぎれ → ひくい てん");
}
{ // コイン・ひょうばん
  for (const lv of LV) {
    const t = start(lv, "word", makeSc(), 1), pays = [0, 1, 2, 3].map((r) => t.payFor(r));
    ok(pays[0] === 0 && pays[1] < pays[2] && pays[2] < pays[3] && pays[2] === PLAY[lv].pay && pays[3] === Math.round(PLAY[lv].pay * 1.5), `${lv}: ランクで コイン（○ ${pays[2]}・◎ ${pays[3]}）`);
    ok(t.repFor(3, 12) === 12 * PLAY[lv].rep, `${lv}: ひょうばん ${PLAY[lv].rep}ばい`);
    const t5 = start(lv, "word", makeSc("hard"), 5);
    ok(t5.payFor(3) === Math.round(PLAY[lv].pay * 1.5 * 1.4 * GameEconomy.mode("hard").reward), `${lv}: Lv5・むずかしい の コイン（1.5ばい × Lv × むずかしさ）`);
    const t30 = start(lv, "word", Object.assign(makeSc("hard"), { lv: 30 }), 5); // おみせ Lv.30（Lv.6 から 1レベル +2%・UI-108）
    ok(t30.payFor(3) === Math.round(PLAY[lv].pay * 1.5 * 1.4 * GameEconomy.mode("hard").reward * 1.5), `${lv}: おみせ Lv.30 は コイン +50% （${t30.payFor(3)}）`);
  }
  ok(PLAY.hs.pay > PLAY.jh.pay && PLAY.hs.rep >= PLAY.jh.rep && PLAY.hs.par >= PLAY.jh.par, "高校の ほうが コイン・ひょうばんが おおい");
  ok(PLAY.toeic.pay > PLAY.hs.pay && PLAY.toeic.rep >= PLAY.hs.rep && PLAY.toeic.n === 10 && PLAY.toeic.par === 200, "TOEIC対策は 高校より コイン・ひょうばんが おおい・めやすは Part 5 の 1問 20びょう × 10問");
  // 1ぷん あたりの コイン（めやすの 時間で ◎）は こどもむけ 3しゅ（Lv1・4にん・1にん 40びょう）と おなじ くらい か すこし おおい
  const kids = (GameEconomy.pay("brain", 1, 3) * 4) / ((4 * 40) / 60);
  for (const lv of LV) { const per = (PLAY[lv].pay * 1.5) / (PLAY[lv].par / 60); ok(per >= kids * 0.8 && per <= kids * 3, `${lv}: 1ぷん あたり ${per.toFixed(0)}コイン（こどもむけ ${kids.toFixed(0)}）`); }
}
{ // ひとこと
  E().lv = "hs"; E().mode = "fill";
  ok(/英語（高校・文の穴うめ）/.test(EG.hello({ lv: 3 })), "2かいめ からの ひとこと（えらんだ レベル・あそびかた）");
  E().lv = "toeic"; E().mode = "word";
  ok(/英語（TOEIC・単語の意味）/.test(EG.hello({ lv: 3 })), "TOEIC対策の ひとこと");
}
{ // えらぶ ところ（UI.ask を すりかえる）: レベル 3つ → TOEIC対策 → あそびかた（商標の ことわり つき）。中学には ことわりを ださない
  const realAsk = UI.ask, asked = [], store = { owner: { name: "ホーせんせい" } };
  let ans = [];
  UI.ask = (text, btns) => { asked.push([text, btns.join("|")]); return Promise.resolve(ans.shift()); };
  ans = [2, 1]; const m = await EG.pick(store);
  ok(m === "fill" && E().lv === "toeic" && E().mode === "fill", "TOEIC対策・文の穴うめ を えらぶ");
  ok(asked[0][1] === "中学レベル|高校レベル|TOEIC®対策|やめる" && ENG_LEVELS.every((L) => asked[0][0].includes(`・${L.name}：${L.note}`)) && !asked[0][0].includes(ENG_NOTICE.ja), "レベルの まど（3つ・やめる）" + JSON.stringify(asked[0]));
  ok(/TOEIC®対策だね/.test(asked[1][0]) && asked[1][0].includes(ENG_NOTICE.ja) && /^単語の意味\|文の穴うめ（ベスト 10\/10）\|やめる$/.test(asked[1][1]), "TOEIC対策の あそびかたの まど（ことわり・ベスト）" + JSON.stringify(asked[1]));
  asked.length = 0; ans = [0, 0]; await EG.pick(store);
  ok(E().lv === "jh" && E().mode === "word" && !asked[1][0].includes(ENG_NOTICE.ja), "中学では ことわりを ださない");
  asked.length = 0; ans = [3]; ok((await EG.pick(store)) === null && asked.length === 1 && E().lv === "jh", "やめる → null");
  UI.ask = realAsk;
}
// ---- 6. セーブ ----
{
  const f = Save.fresh().shops.brain.eng;
  ok(f && f.lv === "jh" && f.mode === "word" && LV.flatMap((lv) => [lv + "_word", lv + "_fill"]).every((k) => f.plays[k] === 0 && f.best[k] === 0 && Array.isArray(f.recent[k]) && !f.recent[k].length) && Save.fresh().shops.brain.games.eng === 0, "セーブ: shops.brain.eng（あたらしい ところ だけ）");
  const old = Save.fresh(); delete old.shops.brain.eng; delete old.shops.brain.games.eng; old.shops.brain.games.math = 4; old.shops.brain.rep = 30;
  const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(m.shops.brain.eng) === JSON.stringify(f) && m.shops.brain.games.eng === 0 && m.shops.brain.games.math === 4 && m.shops.brain.rep === 30 && m.v === Save.SCHEMA && Save.SCHEMA === 2, "ふるい セーブに eng を おぎなう（まえの かずは そのまま・SCHEMA は そのまま）");
  // TOEIC対策の まえの セーブ（中学・高校 だけ）: toeic の かず・ベスト・さいきんを おぎなう。まえの きろくは そのまま
  const pre = Save.fresh(), pe = pre.shops.brain.eng;
  for (const k of ["plays", "best", "recent"]) { delete pe[k].toeic_word; delete pe[k].toeic_fill; }
  pe.lv = "hs"; pe.mode = "fill"; pe.best.hs_fill = 7; pe.plays.hs_fill = 3; pe.recent.hs_fill = [4, 9];
  const m2 = Save.migrate(JSON.parse(JSON.stringify(pre))).shops.brain.eng;
  ok(m2.plays.toeic_word === 0 && m2.best.toeic_fill === 0 && Array.isArray(m2.recent.toeic_fill) && !m2.recent.toeic_fill.length && m2.best.hs_fill === 7 && m2.plays.hs_fill === 3 && m2.recent.hs_fill.join() === "4,9" && m2.lv === "hs" && m2.mode === "fill", "TOEIC対策の まえの セーブに toeic を おぎなう（まえの きろくは そのまま）");
}
console.log(`✓ english: ${n} checks（単語 中学 ${W.jh.length}・高校 ${W.hs.length}・TOEIC ${W.toeic.length}／穴うめ 中学 ${F.jh.length}・高校 ${F.hs.length}・TOEIC ${F.toeic.length}・10問・まちがいの 選択肢・あそぶ ところ・コイン・2つの がめん）`);
