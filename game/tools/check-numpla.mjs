// ナンプレ（パズル こうぼうの 4つめの ゲーム・UI-81。js/numpla-rules.js・js/numpla-data.js・js/mg-numpla.js）の 検査。ブラウザ なしで たしかめる。
// きまりと 解き方（ユニット・解の かず・人の 解き方の むずかしさ・ヒントの 1手・いれかえ）・問題の たば（4×40・解は 1つ・点対称・むずかしさ）・
// あそぶ ところ（えらぶ・入れる・まちがい・メモ・消す・戻す・ヒント・クリア・時間ぎれ・コイン・ひょうばん・続きから）・
// 2つの スマホの 画面（390×844・375×667）で はみださない・ボタンは 44px・セーブ（たすだけ・ふるい セーブを おぎなう）・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { NumplaRules: NR, NUMPLA_BANK: BANK, Numpla, NumplaTask, NUMPLA_PLAY: PLAY, NUMPLA_HOWTO, NUMPLA_LEVEL_NOTE, KoboGames: KG, KOBO_TASKS, KoboTask, HOWTO, ShopScene, Save, G, GameEconomy, PokaDebug } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const IDS = ["easy", "normal", "hard", "expert"];
// きまった 乱数（おなじ けっか）
const seeded = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---- 1. とうろく ----
{
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("mg-kobo.js") > 0 && at("mg-kobo.js") < at("numpla-rules.js") && at("numpla-rules.js") < at("numpla-data.js") && at("numpla-data.js") < at("mg-numpla.js") && at("mg-numpla.js") < at("nerikasu-town.js"), "index.html: mg-kobo → numpla-rules → numpla-data → mg-numpla の じゅん");
  for (const f of ["numpla-rules.js", "numpla-data.js", "mg-numpla.js"]) ok(sw.includes(`"./js/${f}"`), `sw.js の FILES に ${f}`);
  ok(/^\/\/ 自動生成（node tools\/build-numpla\.mjs/.test(readFileSync(new URL("../js/numpla-data.js", import.meta.url), "utf8")), "numpla-data.js は 自動生成（tools/build-numpla.mjs）");
  ok(KOBO_TASKS.numpla === NumplaTask && KoboTask.classOf("numpla") === NumplaTask && NumplaTask.full === true && NumplaTask.rounds === 1, "パズル こうぼうの 4つめ（画面いっぱい・おきゃくさん 1人）");
  const g = KG.game("numpla");
  ok(g.id === "numpla" && g.name === "ナンプレ" && g.adult && typeof g.pick === "function" && typeof g.hello === "function" && g.howto === NUMPLA_HOWTO && KG.GAMES[KG.GAMES.length - 1] === g, "KoboGames の ナンプレ（大人むけ・難しさを きく・ひとこと・せつめい）");
  ok(HOWTO.kobo({ variant: "numpla" }).slice(1).join() === NUMPLA_HOWTO.join() && NUMPLA_HOWTO.length === 4 && NUMPLA_HOWTO.every((l) => l.split("\n").every((r) => width(r) <= 26)), "はじめての せつめい 4つ（1行 26もじ まで）");
  ok(NUMPLA_HOWTO.some((l) => /3×3/.test(l)) && NUMPLA_HOWTO.some((l) => /メモ/.test(l)) && NUMPLA_HOWTO.some((l) => /続きから/.test(l)), "せつめいの なかみ（ブロック・メモ・続きから）");
  ok(typeof PokaDebug.numpla === "function" && typeof PokaDebug.numplaFill === "function", "PokaDebug.numpla・numplaFill");
}

// ---- 2. きまりと 解き方 ----
ok(NR.UNITS.length === 27 && NR.UNITS.every((u) => new Set(u).size === 9 && u.every((i) => i >= 0 && i < 81)), "ユニット 27（行・列・ブロック）");
ok(NR.PEERS.every((p, i) => p.length === 20 && !p.includes(i)), "どの マスも まわりは 20マス");
ok(NR.TECHS.length === 12 && NR.TECHS[0] === null && NR.TECHS.slice(1).every((t) => t.id && t.name), "解き方 11しゅ");
ok(NR.LEVELS.map((L) => L.id).join() === IDS.join() && NR.LEVELS.map((L) => L.name).join() === "初級,中級,上級,超上級", "難しさ 4つ（初級・中級・上級・超上級）");
for (let k = 1; k < 4; k++) ok(NR.LEVELS[k].tech[0] > NR.LEVELS[k - 1].tech[1] && NR.LEVELS[k].givens[0] <= NR.LEVELS[k - 1].givens[0], `${NR.LEVELS[k].id}: まえより むずかしい 解き方・はじめの 数字は おおくない`);
{
  const empty = new Array(81).fill(0);
  ok(NR.count(empty, 2).n === 2, "からっぽの 盤は 解が たくさん");
  const sol = NR.solve(empty);
  ok(sol && NR.valid(sol) && sol.every((d) => d >= 1 && d <= 9) && NR.count(sol, 2).n === 1, "すきまの ない 盤は 解が 1つ");
  const dup = empty.slice(); dup[0] = 5; dup[8] = 5;
  ok(NR.count(dup, 2).n === 0 && !NR.valid(dup), "おなじ 行に おなじ 数字 → 解なし・valid でない");
  ok(NR.format(NR.parse(NR.format(sol))) === NR.format(sol) && NR.parse("0".repeat(81)).every((d) => d === 0) && NR.givens("1" + ".".repeat(80)) === 1, "parse・format・givens");
}
// ---- 3. 問題の たば ----
const all = new Set();
for (const L of NR.LEVELS) {
  const list = BANK[L.id];
  ok(Array.isArray(list) && list.length === 40, `${L.id}: 40もん`);
  for (const [k, p] of list.entries()) {
    const where = `${L.id}[${k}]`, g = NR.parse(p), sol = NR.solve(g), gr = NR.grade(g), cnt = NR.givens(p);
    ok(/^[1-9.]{81}$/.test(p), `${where}: 81もじ`);
    ok(!all.has(p), `${where}: ほかの 問題と おなじ`); all.add(p);
    ok([...p].every((c, i) => (c === ".") === (p[80 - i] === ".")), `${where}: 点対称`);
    ok(cnt >= L.givens[0] && cnt <= L.givens[1], `${where}: はじめの 数字 ${cnt}`);
    ok(NR.count(g, 2).n === 1, `${where}: 解は 1つ`);
    ok(gr.solved && gr.max >= L.tech[0] && gr.max <= L.tech[1] && NR.format(gr.grid) === NR.format(sol), `${where}: 人の 解き方で とける（いちばん むずかしい 解き方 ${gr.max}）`);
    ok(NR.fits(p, L.id) && !IDS.filter((x) => x !== L.id).some((x) => NR.fits(p, x)), `${where}: ${L.id} だけに あう`);
  }
  // いれかえても むずかしさ・解の かずは おなじ（5もん × 6とおり）
  const rnd = seeded(7 + IDS.indexOf(L.id));
  for (const p of list.slice(0, 5)) for (let t = 0; t < 6; t++) {
    const q = NR.transform(p, rnd);
    ok(q !== p && NR.givens(q) === NR.givens(p) && NR.fits(q, L.id) && NR.grade(NR.parse(q)).max === NR.grade(NR.parse(p)).max, `${L.id}: いれかえても おなじ むずかしさ`);
  }
}
// ヒントの 1手: 初級は ヒントだけで さいごまで とける・どの 1手も 正しい
for (const L of NR.LEVELS) for (const p of BANK[L.id].slice(0, L.id === "easy" ? 40 : 6)) {
  const g = NR.parse(p), sol = NR.solve(g);
  let steps = 0, s, bad = false;
  while ((s = NR.nextStep(g))) { if (s.d !== sol[s.i] || g[s.i] || !["box", "row", "col", "cell"].includes(s.how)) { bad = true; break; } g[s.i] = s.d; steps++; }
  ok(!bad, `${L.id}: ヒントの 1手が 正しい`);
  if (L.id === "easy") ok(g.every((d, i) => d === sol[i]) && steps === 81 - NR.givens(p), "easy: ヒントの 1手だけで さいごまで");
}

// ---- 4. あそぶ ところ（ブラウザ なし）----
Save.d = Save.fresh();
const N = () => Save.d.shops.kobo.numpla;
const makeSc = (difficulty = "normal") => ({ timeLimit: 0, timeLeft: 0, difficulty, mistakes: 0, finish(s) { this.done = s; }, mistake(t) { this.said = t; this.mistakes++; }, addFx() {}, timePenalty: () => 0 });
// ShopScene の full の ならび（js/minigames.js の layout）: 390×844・375×667（dpr 1）
const PHONES = [[390, 844], [375, 667]].map(([cw, ch]) => {
  const tile = Math.max(16, Math.round((32 * cw) / 360)), px = tile / 32, sc = Object.create(ShopScene.prototype);
  G.W = cw / px; G.H = ch / px; sc.full = true; sc.layout();
  return { name: `${cw}×${ch}`, px, W: G.W, H: G.H, R: { ...sc.R }, viewH: sc.viewH };
});
ok(PHONES.every((P) => P.viewH <= 100 && P.R.x >= 0 && P.R.x + P.R.w <= P.W && P.R.y > P.viewH && P.R.y + P.R.h <= P.H), "full: うえの おびは ほそく・したは ぜんぶ 盤");
const start = (lv, sc = makeSc(), workLv = 3, P = PHONES[1]) => { N().lv = lv; N().cont = null; const t = new NumplaTask(sc, workLv); sc.timeLimit = t.timeLimit; sc.timeLeft = t.timeLimit - t.usedTime; G.cssPerUnit = P.px; t.layout(P.R); return t; };
const btn = (t, label) => t.btns.find((b) => b.label === label || (label === "メモ" && b === t.memoBtn));
const tap = (t, b) => t.down({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const tapCell = (t, i) => { const { x, y } = t.cellXY(i); t.down({ x: x + t.k / 2, y: y + t.k / 2 }); };
for (const P of PHONES) for (const lv of IDS) {
  const t = start(lv, makeSc(), 3, P), where = `${P.name} ${lv}`, css = P.px, R = P.R;
  ok(t.lvId === lv && NR.fits(t.puzzle, lv) && t.blank === 81 - NR.givens(t.puzzle) && NR.valid(t.sol), `${where}: いれかえた 問題も ${lv}`);
  const inR = (b) => b.x >= R.x - 0.5 && b.y >= R.y - 0.5 && b.x + b.w <= R.x + R.w + 0.5 && b.y + b.h <= R.y + R.h + 0.5;
  ok(t.btns.length === 13 && t.btns.every(inR) && t.btns.every((b) => b.w * css >= 44 && b.h * css >= 44), `${where}: ボタン 13こ（1〜9・消す・メモ・戻す・ヒント）は 44px いじょう・はみださない`);
  ok(t.btns.every((a, i) => t.btns.every((b, j) => i === j || a.x + a.w <= b.x + 0.5 || b.x + b.w <= a.x + 0.5 || a.y + a.h + 3 <= b.y + 0.5 || b.y + b.h + 3 <= a.y + 0.5)), `${where}: ボタンが かさならない`);
  const gs = t.k * 9;
  ok(t.gx >= R.x && t.gx + gs <= R.x + R.w && t.gy >= t.statusY + 24 && t.gy + gs <= Math.min(...t.btns.map((b) => b.y)) && t.k * css >= 38, `${where}: 盤（1マス ${(t.k * css).toFixed(1)}px）は はみださず ボタンの うえ`);
  ok(t.statusY >= R.y && t.statusY + 24 <= t.gy, `${where}: うえの 行（難しさ・時間・ミス）`);
}
{ // 入れる・まちがい・メモ・消す・戻す
  const sc = makeSc(), t = start("normal", sc);
  const i = t.val.findIndex((v) => !v), d = t.sol[i], wrong = (d % 9) + 1, peer = NR.PEERS[i].find((j) => !t.val[j]);
  tapCell(t, i); ok(t.sel === i, "マスを タップで えらぶ");
  tap(t, btn(t, String(wrong))); ok(t.val[i] === wrong && t.mistakes === 1 && sc.mistakes === 1 && t.wrong(i), "まちがいは 赤く のこって ミス 1");
  tap(t, btn(t, String(wrong))); ok(t.mistakes === 1, "おなじ まちがいを もう いちど 入れても ミスは ふえない");
  tap(t, btn(t, "消す")); ok(t.val[i] === 0, "消す");
  tap(t, btn(t, "メモ")); ok(t.memoMode && t.memoBtn.on && t.memoBtn.label === "メモ ON", "メモ ON");
  tap(t, btn(t, String(d))); tap(t, btn(t, String(wrong))); ok(t.memo[i] === ((1 << d) | (1 << wrong)) && !t.val[i], "メモは 数字を 小さく 書く（数字は 入らない）");
  tap(t, btn(t, String(wrong))); ok(t.memo[i] === 1 << d, "おなじ メモを もう いちど → 消える");
  tapCell(t, peer); tap(t, btn(t, String(d))); ok(t.memo[peer] & (1 << d), "となりの マスにも メモ");
  tap(t, btn(t, "メモ")); ok(!t.memoMode, "メモ OFF");
  const f0 = t.filled(), left0 = t.left(d);
  tapCell(t, i); tap(t, btn(t, String(d)));
  ok(t.val[i] === d && t.filled() === f0 + 1 && !t.memo[i] && !(t.memo[peer] & (1 << d)) && t.left(d) === left0 - 1, "正しい 数字 → まわりの メモから その 数字が 消える・のこりが へる");
  tap(t, btn(t, "戻す")); ok(t.val[i] === 0 && t.memo[peer] & (1 << d) && t.filled() === f0 && t.mistakes === 1, "戻す: さいごの 1手（ミスの かずは そのまま）");
  t.sel = t.given.findIndex((v) => v); tap(t, btn(t, String(t.val[t.sel]))); ok(t.tip && /はじめから/.test(t.tip.text) && t.mistakes === 1, "はじめの 数字は かえられない");
  // ヒント: えらんだ マスが 入れられない ときは 人の 解き方で つぎに 入る マス
  const g0 = t.val.map((v, k) => (v === t.sol[k] ? v : 0)), step = NR.nextStep(g0);
  tap(t, btn(t, "ヒント"));
  ok(t.hints === 1 && step && t.sel === step.i && t.val[step.i] === t.sol[step.i] && /ここだけ|だけ/.test(t.tip.text), "ヒント: つぎに 入る マスに 正しい 数字と わけ");
  tapCell(t, t.val.findIndex((v, k) => !v)); const hi = t.sel; tap(t, btn(t, "ヒント"));
  ok(t.hints === 2 && t.val[hi] === t.sol[hi] && /^ここは \d$/.test(t.tip.text), "ヒント: えらんだ マスに 正しい 数字");
  // 1 を ぜんぶ 入れると 1 の ボタンは おせない
  for (let k = 0; k < 81; k++) if (t.sol[k] === 1) t.val[k] = 1;
  t.refresh(); ok(btn(t, "1").disabled && !btn(t, "2").disabled, "9つ ぜんぶ 入った 数字の ボタンは おせない");
  // 続きから: セーブ → あたらしい タスクで おなじ ところから
  sc.timeLeft = sc.timeLimit - 123; t.save();
  const c = N().cont;
  ok(c && c.lv === "normal" && c.p === t.puzzle && c.v === NR.format(t.val) && c.miss === 1 && c.hint === 2 && c.used === 123 && Numpla.validCont(c), "とちゅうの 問題を セーブ（続きから）");
  const t2 = new NumplaTask(makeSc(), 3);
  ok(t2.resumed && t2.puzzle === t.puzzle && NR.format(t2.val) === NR.format(t.val) && t2.memo.join() === t.memo.join() && t2.mistakes === 1 && t2.hints === 2 && t2.usedTime === 123, "続きから: おなじ 盤・メモ・ミス・ヒント・時間");
  ok(/続き/.test(t2.stopText) && /続き/.test(t2.stopNote), "やめる ときの ことば（続きから できる）");
  const gi = [...c.p].findIndex((ch) => ch !== "."), other = String((Number(c.p[gi]) % 9) + 1);
  for (const [bad, why] of [[{ ...c, v: c.v.slice(1) }, "みじかい"], [{ ...c, lv: "ultra" }, "難しさが ない"], [{ ...c, v: c.v.slice(0, gi) + other + c.v.slice(gi + 1) }, "はじめの 数字が ちがう"], [{ ...c, m: c.m.slice(2) }, "メモが みじかい"], [{ ...c, p: ".".repeat(81), v: ".".repeat(81) }, "解が 1つで ない"], [null, "ない"]])
    ok(!Numpla.validCont(bad), `こわれた 続きは つかわない（${why}）`);
}
{ // クリア: てんすう・きろく・コイン
  const sc = makeSc(), t = start("hard", sc, 5);
  const n0 = N().n.hard;
  for (let k = 0; k < 81; k++) if (!t.given[k]) { t.val[k] = t.sol[k]; }
  const last = t.val.findIndex((v, k) => !t.given[k]); t.val[last] = 0; t.refresh();
  sc.timeLeft = sc.timeLimit - 600;
  tapCell(t, last); tap(t, btn(t, String(t.sol[last])));
  ok(t.done && sc.done === 100 && N().cont === null && N().clear.hard === 1 && N().best.hard === 600 && /上級 クリア 1回目・10:00/.test(sc.resultNote), "クリア → ◎・きろく（クリア・ベスト）・続きは けす");
  ok(N().n.hard === n0, "クリアしても だした かずは そのまま");
  const t3 = start("hard", makeSc(), 5);
  ok(t3.puzzle !== t.puzzle && N().n.hard === n0 + 1, "つぎの 問題は たばの つぎ");
}
{ // てんすう
  const t = start("normal");
  t.done = true; t.sc.timeLeft = t.sc.timeLimit - 60;
  ok(t.score() === 100, "めやすの 時間 いないで ミス・ヒント なし → 100");
  t.mistakes = 1; ok(t.score() === 94, "ミス 1 → 94（◎）");
  t.mistakes = 2; t.hints = 1; ok(t.score() === 80, "ミス 2・ヒント 1 → 80（○）");
  t.mistakes = 0; t.hints = 0; t.sc.timeLeft = t.sc.timeLimit - PLAY.normal.par * 2; ok(Math.abs(t.score() - 80) < 1e-9, "めやすの 2ばいの 時間 → −20");
  t.sc.timeLeft = t.sc.timeLimit - PLAY.normal.par * 5; ok(Math.abs(t.score() - 80) < 1e-9, "時間の へりは 20 まで");
  const u = start("normal"); u.sc.timeLeft = 0;
  const s = u.timeout(); ok(s <= 40 && N().cont === null && u.done, "時間ぎれ → ひくい てん・続きは けす");
}
{ // コイン・ひょうばん（GameEconomy の きまりと おなじ ランクの ばいりつ・おみせ Lv で すこし ふえる・1にち 20000 の なか）
  for (const lv of IDS) {
    const t = start(lv, makeSc(), 1), pays = [0, 1, 2, 3].map((r) => t.payFor(r));
    ok(pays[0] === 0 && pays[1] < pays[2] && pays[2] < pays[3] && pays[2] === PLAY[lv].pay && pays[3] === Math.round(PLAY[lv].pay * 1.5), `${lv}: ランクで コイン（○ ${pays[2]}・◎ ${pays[3]}）`);
    ok(t.repFor(3, 12) === 12 * PLAY[lv].rep, `${lv}: ひょうばん ${PLAY[lv].rep}ばい`);
    const t5 = start(lv, makeSc("hard"), 5);
    ok(t5.payFor(3) === Math.round(PLAY[lv].pay * 1.5 * 1.4 * GameEconomy.mode("hard").reward), `${lv}: Lv5・むずかしい の コイン（1.5ばい × Lv × むずかしさ）`);
  }
  for (let k = 1; k < 4; k++) { const a = PLAY[IDS[k - 1]], b = PLAY[IDS[k]]; ok(b.pay > a.pay && b.rep >= a.rep && b.limit > a.limit && b.par > a.par, `${IDS[k]}: むずかしい ほど コイン・時間が おおい`); }
  for (const lv of IDS) ok(PLAY[lv].par < PLAY[lv].limit && PLAY[lv].limit <= 3600, `${lv}: めやす < 上限（60ぷん まで）`);
  // 1ぷん あたりの コイン（めやすの 時間で ◎）は こどもむけ 3しゅ（Lv1・4にん・◎ で 1にん 40びょう）と おなじ くらい か すこし おおい
  const kids = (GameEconomy.pay("kobo", 1, 3) * 4) / ((4 * 40) / 60);
  for (const lv of IDS) { const per = (PLAY[lv].pay * 1.5) / (PLAY[lv].par / 60); ok(per >= kids * 0.8 && per <= kids * 3, `${lv}: 1ぷん あたり ${per.toFixed(0)}コイン（こどもむけ ${kids.toFixed(0)}）`); }
}
{ // えらぶ ときの ことば・はじめの ひとこと
  for (const L of NR.LEVELS) ok(NUMPLA_LEVEL_NOTE[L.id] && width(`・${L.name}：${NUMPLA_LEVEL_NOTE[L.id]}`) <= 19.5, `${L.id}: えらぶ ときの ひとこと（みじかく）`);
  N().cont = null; N().lv = "expert";
  ok(/超上級の ナンプレ/.test(Numpla.hello({ lv: 4 })), "2かいめ からの ひとこと（えらんだ 難しさ）");
  ok(Numpla.mmss(0) === "00:00" && Numpla.mmss(754) === "12:34" && Numpla.mmss(3599.6) === "59:59", "時間の かきかた");
}
// ---- 5. セーブ ----
{
  const f = Save.fresh().shops.kobo.numpla;
  ok(f && f.lv === "easy" && IDS.every((k) => f.n[k] === 0 && f.clear[k] === 0 && f.best[k] === 0) && f.cont === null && Save.fresh().shops.kobo.games.numpla === 0, "セーブ: shops.kobo.numpla（あたらしい ところ だけ）");
  const old = Save.fresh(); delete old.shops.kobo.numpla; delete old.shops.kobo.games.numpla; old.shops.kobo.games.logic = 7; old.shops.kobo.rep = 55;
  const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(m.shops.kobo.numpla) === JSON.stringify(f) && m.shops.kobo.games.numpla === 0 && m.shops.kobo.games.logic === 7 && m.shops.kobo.rep === 55 && m.v === Save.SCHEMA && Save.SCHEMA === 2, "ふるい セーブに numpla を おぎなう（まえの かずは そのまま・SCHEMA は そのまま）");
}
console.log(`✓ numpla: ${n} checks（問題 ${all.size}もん〔4×40・解は 1つ・点対称・人の 解き方で とける〕・いれかえ・ヒント・あそぶ ところ・コイン・続きから・2つの がめん）`);
