// ころころ フルーツ（js/korokoro-physics.js・js/korokoro-art.js・js/mg-korokoro.js・js/korokoro-town.js・js/korokoro-score.js）の 検査。ブラウザ なしで 物理と おてつだいを うごかす。
// 玉の だん（くだもの 5しゅ ＋ いちばん 大きい 3だんが がちゃん・わんこ・ごじ）・点は 本物の スイカゲームと おなじ 三角数・おちてくるのは 小さい はんぶん（おなじ 確率）・
// 物理が こわれない（NaN・かべ ぬけ・めりこみ）・おなじ たねは おなじ けっか・がったい・ごじの はれつ・あふれ と からっぽ・おとす まの まち時間・
// ちゅうもんが とどく／時間ぎれ／あふれの 減点・こどもの はやさの ボットでも とどけられる（レベル 1〜5）・
// スコア モード（あふれたら おしまい・点・ハイスコアと ランキング・コイン・画面に おさまる・ボットの 点）・絵（NaN なし・id なし・キャッシュの キーが 有限）・お店・町・セーブ・BGM・ことば。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { KorokoroWorld: World, KOROKORO_TIERS: T, KOROKORO_RULES: RULES, KOROKORO_ORDERS: ORDERS, KorokoroArt: Art, KorokoroBoard: Board, KorokoroTask: Task,
  KOROKORO_SCORE: SCORE, KOROKORO_SCORE_HOWTO: SCORE_HOWTO, KorokoroScore: Score, KorokoroScoreScene: ScoreScene } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;

// ---- 1. だん: 8しゅ（さくらんぼ・いちご・みかん・りんご・なし・がちゃん・わんこ・ごじ）・だんだん 大きく・おちてくるのは 小さい 4しゅ ----
ok(T.length === 8 && T.every((t, i) => t.tier === i && (i === 0 || t.r > T[i - 1].r)), "だんは 8しゅで 大きさが ふえる");
ok(T.map((t) => t.name).join() === "さくらんぼ,いちご,みかん,りんご,なし,がちゃん,わんこ,ごじ", "だんの じゅんばん（もも・メロン・すいか → がちゃん・わんこ・ごじ）");
ok(T.every((t) => !kanji.test(t.name) && t.name.length <= 5), "だんの なまえは ひらがな・カタカナ 5もじ まで");
ok(T.slice(5).map((t) => t.hero).join() === "gachan,wanko,goji" && T.slice(0, 5).every((t) => !t.hero), "いちばん 大きい 3だんが がちゃん → わんこ → ごじ の かお");
ok(RULES.drop * 2 === T.length && T.every((t) => !t.hero || t.tier >= RULES.drop), "おちてくるのは 小さい はんぶん（3人の かおは くっつけて つくる だけ）");
ok(T.map((t) => t.points).join() === "1,3,6,10,15,21,28,36", "点は 本物の スイカゲームと おなじ 三角数（2つ くっつけた だんで 1・3・6・…）");
ok(T[RULES.drop - 1].r * 2 <= 22 && T[T.length - 1].r * 2 >= 45 && T[T.length - 1].r * 2 <= 50, "おちてくる いちばん 大きい もの（はばの 2わり）と ごじ（はばの 半分 くらい）の 大きさ");
{
  const w = new World(5), c = Array(T.length).fill(0), N = 40000;
  for (let i = 0; i < N; i++) c[w.pickDrop()]++;
  ok(c.slice(0, RULES.drop).every((k) => Math.abs(k / N - 1 / RULES.drop) < 0.015) && c.slice(RULES.drop).every((k) => k === 0), `おちてくる だんの わりあいが おなじ くらいに ならない（${c.join(",")}）`);
}

// ---- 2. 物理: ボット（おなじ だんの 上か、いちばん ひくい ところ）で 4ぷん あそんでも こわれない ----
let seedR = 1;
const rnd = () => ((seedR = (seedR * 1103515245 + 12345) % 2147483648) / 2147483648);
function aimFor(w, tier, noise = 0, silly = 0) {
  const r = T[tier].r;
  let best = null;
  if (rnd() >= silly) for (const b of w.bodies) {
    if (b.tier !== tier || b.grow < 1) continue;
    if (Math.abs(w.landingY(tier, b.x) - (b.y - (r + b.r))) < 1.2 && (!best || b.y > best.y)) best = b;
  }
  let x;
  if (best) x = best.x;
  else if (silly && rnd() < silly) x = r + rnd() * (100 - 2 * r);
  else { let by = -1e9; for (let i = 0; i <= 20; i++) { const xx = r + ((100 - 2 * r) * i) / 20, y = w.landingY(tier, xx) + (tier <= 1 ? xx : 100 - xx) * 0.02; if (y > by) { by = y; x = xx; } } }
  return x + (rnd() * 2 - 1) * noise;
}
function play(seed, secs, every = 1.1, noise = 1.5, silly = 0.1) {
  const w = new World(seed); seedR = seed;
  let held = w.pickDrop(), next = 0, t = 0, bad = 0, spills = 0, merges = 0, maxN = 0, bursts = 0;
  for (; t < secs; t += 1 / 60) {
    if (t >= next && !w.floorOpen) { w.dropAt(held, aimFor(w, held, noise, silly)); held = w.pickDrop(); next = t + every; }
    for (const e of w.step(1 / 60)) { if (e.type === "merge") merges++; if (e.type === "burst") bursts++; if (e.type === "overflow") { spills++; w.spill(); } }
    if (!w.ok()) bad++;
    for (const b of w.bodies) if (b.x < b.r - 0.6 || b.x > w.W - b.r + 0.6 || (!w.floorOpen && b.y > w.H - b.r + 0.6)) bad++;
    maxN = Math.max(maxN, w.bodies.length);
  }
  return { w, bad, spills, merges, maxN, bursts };
}
for (const seed of [1, 2, 3, 4]) {
  const r = play(seed, 240);
  ok(r.bad === 0, `たね ${seed}: 玉が こわれた／かべや ゆかを ぬけた（${r.bad}）`);
  ok(r.merges > 60 && r.maxN < 60, `たね ${seed}: がったいが すくない／玉が ふえすぎ（${r.merges}・${r.maxN}）`);
}
// とまった あと: めりこみが ない・しずかに なる
{
  const { w } = play(9, 60);
  for (let i = 0; i < 60 * 4; i++) w.step(1 / 60);
  let worst = 0, speed = 0;
  for (let i = 0; i < w.bodies.length; i++) for (let j = i + 1; j < w.bodies.length; j++) {
    const a = w.bodies[i], b = w.bodies[j], pen = a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y);
    worst = Math.max(worst, pen / Math.min(a.r, b.r));
  }
  for (const b of w.bodies) speed = Math.max(speed, Math.hypot(b.vx, b.vy));
  ok(worst < 0.08, `とまった 玉が めりこむ（${worst.toFixed(3)}）`);
  ok(speed < 12, `とまった あとも 玉が うごきつづける（${speed.toFixed(1)}）`);
}
// おなじ たね・おなじ 入力は おなじ けっか
{
  const snap = (w) => JSON.stringify(w.bodies.map((b) => [b.tier, b.x.toFixed(4), b.y.toFixed(4), b.a.toFixed(4)]));
  ok(snap(play(21, 50).w) === snap(play(21, 50).w), "おなじ たねで けっかが ちがう");
  ok(snap(play(21, 50).w) !== snap(play(22, 50).w), "たねが かわっても おなじ ならび");
}

// ---- 3. がったい・すいかの はれつ・あふれ ----
{
  const w = new World(3);
  w.add(1, 40, 100, { landed: true }); w.add(1, 51.6, 100, { landed: true });
  let ev = []; for (let i = 0; i < 30; i++) ev.push(...w.step(1 / 60));
  const m1 = ev.filter((e) => e.type === "merge");
  ok(w.bodies.length === 1 && w.bodies[0].tier === 2 && m1.length === 1 && m1[0].points === 3 && m1[0].from === 1 && !m1[0].hero, "おなじ いちご 2つが みかん 1つ（3てん）に ならない");
  const p = new World(3); p.add(4, 30, 96, { landed: true }); p.add(4, 54.4, 96, { landed: true });
  const pe = []; for (let i = 0; i < 20; i++) pe.push(...p.step(1 / 60));
  ok(pe.some((e) => e.type === "merge" && e.tier === 5 && e.hero === "gachan" && e.points === 15), "なし 2つで がちゃんが できない（15てん・がちゃんの しるし）");
  const h = new World(3); h.add(5, 30, 94, { landed: true }); h.add(5, 60.4, 94, { landed: true });
  const he = []; for (let i = 0; i < 20; i++) he.push(...h.step(1 / 60));
  ok(he.some((e) => e.type === "merge" && e.tier === 6 && e.hero === "wanko" && e.points === 21), "がちゃん 2つで わんこが できない（21てん・わんこの しるし）");
  const s = new World(3); s.add(7, 26, 86, { landed: true }); s.add(7, 73, 86, { landed: true });
  const se = []; for (let i = 0; i < 30; i++) se.push(...s.step(1 / 60));
  ok(s.bodies.length === 0 && se.some((e) => e.type === "burst" && e.points === 36 && e.hero === "goji"), "ごじ 2つが はじけない（36てん）");
  const d = new World(4); d.add(3, 30, 100, { landed: true }); d.add(4, 52, 98, { landed: true });
  for (let i = 0; i < 30; i++) d.step(1 / 60);
  ok(d.bodies.length === 2, "ちがう もの どうしが がったいした");
  // あふれ: ふちより 上に 2びょう → しらせ → ゆかを ひらいて からっぽ → また あそべる
  const tower = (wo) => { for (let i = 0; i < 12; i++) { const col = i % 2, row = Math.floor(i / 2); wo.add((row + col) % 2 ? 6 : 7, 24 + col * 52, 86.4 - row * 44, { landed: true }); } return wo; }; // となりは ちがう もの（がったい しない）
  const firstOver = (wo) => { for (let t = 0; t < 6; t += 1 / 60) for (const e of wo.step(1 / 60)) if (e.type === "overflow") return t; return null; };
  const o = tower(new World(5)), over = firstOver(o);
  ok(over != null && over >= RULES.overSec - 0.1, `あふれの しらせが ない／はやすぎる（${over}）`);
  o.spill(); for (let i = 0; i < 60 * 4 && o.bodies.length; i++) o.step(1 / 60);
  ok(o.bodies.length === 0 && !o.floorOpen, "あふれた あと 箱が からっぽに ならない");
  o.dropAt(0, 50); for (let i = 0; i < 90; i++) o.step(1 / 60);
  ok(o.bodies.length === 1 && o.bodies[0].y > 100, "からっぽの あと また おとせない");
  // スコア モードの 箱: はみだして から みじかい じかんで おしまい
  const q = tower(new World(5, { overSec: SCORE.overSec })), qOver = firstOver(q);
  ok(q.overSec === SCORE.overSec && SCORE.overSec < RULES.overSec && qOver != null && qOver >= SCORE.overSec - 0.1 && qOver < RULES.overSec - 0.5, `スコア モードの おしまいが おそい／はやすぎる（${qOver}）`);
  // おとす まえの めやす: まっすぐ おちて とまる ところ
  const ra = T[3].r, g = new World(6); g.add(3, 50, 110 - ra, { landed: true });
  ok(Math.abs(g.landingY(0, 50) - (110 - ra * 2 - T[0].r)) < 1e-6 && g.landingY(0, 5) === 110 - T[0].r, "おちる ところの めやすが ちがう");
}

// ---- 4. おてつだい（KorokoroTask）: ちゅうもん・とどく・時間ぎれ・あふれの 減点・まち時間 ----
const RECT = { x: 10, y: 380, w: 342, h: 390 };
function fakeScene() {
  const sc = { phase: "work", timeLimit: 60, timeLeft: 60, finished: null, custX: 100, counterY: 200, viewH: 300, cust: { emo: "normal" },
    team: ["wanko", "gachan", "goji"].map((id) => ({ id, turn: 0, jump: -1, emo: "normal" })), fx: [],
    timePenalty() { return Math.max(0, 1 - this.timeLeft / this.timeLimit - 0.5) * 50; },
    finish(score) { if (this.finished == null) this.finished = score; }, mistake() { this.mistakes = (this.mistakes || 0) + 1; }, addFx(kind, x, y, o) { this.fx.push({ kind, x, y, ...o }); } };
  return sc;
}
for (let lv = 1; lv <= 5; lv++) {
  const O = ORDERS[lv - 1];
  ok(O.time >= 45 && O.sets.every((set) => set.length >= 1 && set.every((tier) => tier >= RULES.drop && tier < T.length)), `Lv${lv}: ちゅうもんは おちてこない くだもの（${JSON.stringify(O.sets)}）`);
  for (let k = 0; k < 6; k++) {
    const sc = fakeScene(), t = new Task(sc, lv); t.layout(RECT);
    ok(sc.board === t.board && t.want.length >= 1 && t.timeLimit === O.time && !kanji.test(t.title), `Lv${lv}: ちゅうもんが つくれない`);
    t.want.forEach((w, i) => t.board.world.add(w.tier, 20 + i * 50, 80));
    for (let f = 0; f < 3; f++) t.update(1 / 60);
    ok(sc.finished === 100 && t.want.every((w) => w.done) && t.board.flyers.length === t.want.length, `Lv${lv}: ちゅうもんが とどいても 100点に ならない（${sc.finished}）`);
  }
}
{
  // つぎの おきゃくさんも おなじ 箱（のこった 玉は そのまま）
  const sc = fakeScene(), a = new Task(sc, 1); a.layout(RECT);
  a.board.world.add(4, 30, 100, { landed: true });
  const b = new Task(sc, 1); b.layout(RECT);
  ok(b.board === a.board && b.board.world.bodies.length === 1, "おきゃくさんが かわると 箱が きえる");
  // 時間ぎれ: からっぽ 10点・1つ まえの だんが あれば △ ちかく・あふれは 減点
  const empty = new Task(fakeScene(), 3); empty.layout(RECT);
  ok(empty.timeout() === 10, `からっぽで 時間ぎれの 点が ちがう（${empty.timeout()}）`);
  const near = new Task(fakeScene(), 1); near.layout(RECT); near.want = [{ tier: 5, done: false }]; near.board.world.add(4, 50, 100, { landed: true });
  ok(near.timeout() >= 30 && near.timeout() < 45, `あと すこしの 時間ぎれが △ ちかく に ならない（${near.timeout()}）`);
  const sp = new Task(fakeScene(), 1); sp.layout(RECT); sp.board.spills++;
  ok(sp.score() === 70 && sp.timeout() === 0, "あふれの 減点が ちがう");
  // おとす: まち時間の あいだは おとせない・つぎの 玉に かわる・はしは 箱の なかに
  const d = new Task(fakeScene(), 1); d.layout(RECT); const bd = d.board, first = bd.held, second = bd.next;
  bd.aimAt(-500); ok(Math.abs(bd.aim - T[first].r) < 1e-9, "ねらいが 箱の そとに でる");
  ok(bd.dropNow() && bd.held === second && !bd.dropNow() && bd.world.bodies.length === 1, "まち時間の あいだに また おとせる");
  for (let i = 0; i < 40; i++) d.update(1 / 60);
  ok(bd.dropNow(), "まち時間の あとに おとせない");
  // ゆびで: 箱の 上で おして うごかし はなすと おちる・よこの れつでは おちない
  const u = new Task(fakeScene(), 1); u.layout(RECT); const ub = u.board;
  u.down({ x: ub.bx + ub.bw * 0.8, y: RECT.y + 40, id: 7 }); u.move({ x: ub.bx + ub.bw * 0.3, y: RECT.y + 40, id: 7 }); u.up({ x: ub.bx + ub.bw * 0.3, y: RECT.y + 40, id: 7 });
  ok(ub.world.bodies.length === 1 && Math.abs(ub.world.bodies[0].x - ub.world.clampX(ub.world.bodies[0].tier, 30)) < 0.5, "ゆびで ねらって おとせない");
  for (let i = 0; i < 40; i++) u.update(1 / 60);
  u.down({ x: ub.col.x + 10, y: ub.col.y + 200, id: 8 }); u.up({ x: ub.col.x + 10, y: ub.col.y + 200, id: 8 });
  ok(ub.world.bodies.length === 1, "よこの れつを おしても おちる");
  // かおの 玉が できると その子が よろこぶ（なし 2つ → がちゃん）
  const c = new Task(fakeScene(), 1); c.layout(RECT); c.board.world.add(4, 30, 96, { landed: true }); c.board.world.add(4, 54.4, 96, { landed: true });
  for (let i = 0; i < 20; i++) c.update(1 / 60);
  const gachan = c.sc.team.find((m) => m.id === "gachan");
  ok(gachan.turn > 0 && gachan.emo === "happy" && c.sc.fx.some((f) => f.text === "ぴよ！"), "がちゃんが できても がちゃんが よろこばない");
  // 大きな かおの 玉で チップ（がちゃん 2つ → わんこ）
  const big = new Task(fakeScene(), 1); big.layout(RECT); big.board.world.add(5, 30, 94, { landed: true }); big.board.world.add(5, 60.4, 94, { landed: true });
  for (let i = 0; i < 30; i++) big.update(1 / 60);
  ok(big.bonusTip === R.KOROKORO_BONUS[6] && big.board.points === T[5].points && big.sc.fx.some((f) => f.text === "わん！"), `わんこを つくった チップ（${big.bonusTip}）`);
  // ごじ どうしが きえると チップ・3人 みんなで よろこぶ
  const top = new Task(fakeScene(), 1); top.layout(RECT); top.board.world.add(7, 26, 86, { landed: true }); top.board.world.add(7, 73, 86, { landed: true });
  for (let i = 0; i < 30; i++) top.update(1 / 60);
  ok(top.bonusTip === R.KOROKORO_BONUS.burst && top.board.points === T[7].points && top.sc.team.every((m) => m.emo === "happy"), `ごじ どうしの チップ・よろこび（${top.bonusTip}）`);
}

// ---- 5. こどもの はやさの ボットで シフト（4にん・箱は つづく）: とどけられる ----
function shift(lv, seed, { every, noise, silly }) {
  const sc = fakeScene(); let done = 0, ranks = [], time = 0;
  seedR = seed;
  // ちゅうもん（KorokoroTask の U.pick）も おなじ たねで えらぶ。Math.random の ままだと 実行ごとに けっかが かわる
  const pick0 = R.U.pick; R.U.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  try {
  sc.board = new Board(sc, seed);
  for (let c = 0; c < 4; c++) {
    const t = new Task(sc, lv); t.layout(RECT); sc.finished = null; sc.timeLimit = sc.timeLeft = t.timeLimit;
    let wait = 0;
    while (sc.finished == null) {
      if (sc.timeLeft <= 0) { sc.finished = t.timeout(); break; }
      wait -= 1 / 60;
      if (wait <= 0 && t.board.canDrop()) { t.board.aim = t.board.world.clampX(t.board.held, aimFor(t.board.world, t.board.held, noise, silly)); t.board.dropNow(); wait = every; }
      t.update(1 / 60); sc.timeLeft -= 1 / 60;
    }
    time += t.timeLimit - sc.timeLeft;
    const s = sc.finished, rank = s >= 92 ? 3 : s >= 72 ? 2 : s >= 45 ? 1 : 0;
    ranks.push(rank); if (t.want.every((w) => w.done)) done++;
    for (let i = 0; i < 60 * 3.4; i++) sc.board.tick(1 / 60, false);
  }
  } finally { R.U.pick = pick0; }
  return { done, ranks, time };
}
const table = [];
for (let lv = 1; lv <= 5; lv++) {
  const kid = { every: 1.6, noise: 4, silly: 0.25 }, good = { every: 1.1, noise: 1.5, silly: 0.05 };
  let kidDone = 0, goodDone = 0, kidGood = 0, all = 0, t = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const a = shift(lv, seed * 7 + lv, kid), b = shift(lv, seed * 11 + lv, good);
    kidDone += a.done; goodDone += b.done; kidGood += a.ranks.filter((r) => r >= 2).length; all += 4; t += a.time;
  }
  table.push(`Lv${lv}: こども ${kidDone}/${all}（○いじょう ${kidGood}）・じょうず ${goodDone}/${all}・こどもの 1にん ${Math.round(t / all)}びょう`);
  ok(kidDone / all >= (lv <= 3 ? 0.8 : 0.6), `Lv${lv}: こどもの はやさで とどけられない（${kidDone}/${all}）`);
  ok(goodDone / all >= 0.9, `Lv${lv}: じょうずでも とどけられない（${goodDone}/${all}）`);
}

// ---- 6. 絵: NaN なし・id なし（ほかの 絵と かさならない）・キャッシュの キーは だん×表情×大きさ ----
for (const t of T) for (const emo of Art.FACES) for (const size of [30, 60, 140]) {
  const svg = Art.svg(t.tier, emo, size);
  ok(svg.startsWith("<svg") && svg.endsWith("</svg>") && !/NaN|undefined|Infinity/.test(svg) && !/\sid="/.test(svg), `絵 ${t.id}:${emo}:${size} が こわれている`);
}
ok(Art.FACES.length === 5 && T.every((t) => Art.cropOf(t.tier) === (t.hero ? Art.HERO[t.hero].crop : Art.CROP)) && T.filter((t) => t.hero).every((t) => Art.HERO[t.hero].crop > Art.CROP), "表情 5つ・かおの 玉は みみ と かざりの ぶん ひろく");
// ブラウザで はかった かざりの はみだし（わんこ 1.31・がちゃん ねむり 1.47・ごじ にっこり 1.54）より わくが 大きい
ok(Art.HERO.wanko.crop >= 1.33 && Art.HERO.gachan.crop >= 1.5 && Art.HERO.goji.crop >= 1.57, "かおの 玉の かざりが わくで きれる");
{
  const b = new Board(fakeScene(), 1); b.layout(RECT);
  const keys = new Set();
  for (const t of T) for (const emo of Art.FACES) keys.add(`${t.tier}:${emo}:${Math.ceil((t.r * b.s * 2 * Art.cropOf(t.tier) * 2) / 8) * 8}`);
  ok(keys.size <= T.length * Art.FACES.length, "キャッシュの キーが ふえる");
}

// ---- 7. お店・町・セーブ・BGM・ことば ----
{
  const S = R.SHOPS.korokoro, owner = R.SHOP_OWNERS.korokoro, how = R.HOWTO.korokoro;
  ok(S && S.rounds === 4 && S.lines.length === 4 && !kanji.test(S.name + S.desc + S.lines.join("")), "お店の データ・ことば");
  ok(owner && owner.sp === "squirrel" && !kanji.test(owner.name) && how.length >= 3 && how.every((l) => !kanji.test(l)), "店主と あそびかたの ことば");
  ok(R.GameEconomy.pay("korokoro", 1, 0) === 0 && R.GameEconomy.pay("korokoro", 1, 2) > R.GameEconomy.pay("crepe", 1, 2), "コイン（1にんに じかんが かかる ぶん おおめ）");
  ok(R.STORE_INTERIORS.korokoro && R.StoreArt.prop("fruitbox").startsWith("<svg") && !/NaN|undefined/.test(R.StoreArt.prop("fruitbox")), "店内と ガラスの 箱の 絵");
  ok(R.BUY_SHOPS.korokoro.items().every((it) => it && it.price > 0), "レジで かえる もの");
  const town = R.MAP_DEFS.town, b = town.buildings.find((x) => x.id === "nerikasu_home5"), m = new R.WorldMap("town");
  ok(b && b.act.type === "work" && b.act.shop === "korokoro" && b.label === "ころころ フルーツ" && b.asset === "nerikasu.bld_nerikasu_home5", "ネリカスタウンの お店");
  ok(!m.isSolid(b.x + b.door, b.y + b.h) && m.doors.some((d) => d.b.act.shop === "korokoro"), "お店の 入口に いけない");
  const fresh = R.Save.fresh(), old = JSON.parse(JSON.stringify(fresh)); delete old.shops.korokoro;
  const mig = R.Save.migrate(old);
  ok(fresh.shops.korokoro.lv === 1 && fresh.shops.korokoro.pts === 0 && mig.shops.korokoro && mig.shops.korokoro.lv === 1 && R.Save.SCHEMA === 1, "セーブ（ふるい セーブにも お店が たされる）");
  // スコア モードの きろく（2026-09-30 に たした）: まえの セーブの ころころ フルーツにも hi・tops・games が たされる。ほかの あたいは そのまま
  const v0 = JSON.parse(JSON.stringify(fresh)); v0.shops.korokoro = { lv: 3, rep: 40, best: 120, plays: 5, pts: 300 };
  const v1 = R.Save.migrate(v0).shops.korokoro;
  ok(fresh.shops.korokoro.hi === 0 && Array.isArray(fresh.shops.korokoro.tops) && fresh.shops.korokoro.tops.length === 0 && fresh.shops.korokoro.games === 0, "セーブ: スコア モードの きろくの ばしょ");
  ok(v1.hi === 0 && Array.isArray(v1.tops) && v1.games === 0 && v1.lv === 3 && v1.rep === 40 && v1.pts === 300 && v1.tops !== R.Save.fresh().shops.korokoro.tops, "セーブ: まえの セーブに スコア モードの きろくが たされない／ほかの あたいが かわる");
  const song = R.SONGS.shop_korokoro;
  ok(song && song.modern && !kanji.test(song.title) && song.source && /Schumann/.test(song.source.composer) && song.source.license === "Public Domain", "BGM（パブリックドメインの 名曲・出典）");
  ok(R.MusicDiscs.DISCS.some((d) => d.from.shop === "korokoro" && d.song === "shop_korokoro"), "おてつだいの ディスク");
  ok(R.ShopRewards.prizes.filter((p) => p.shop === "korokoro").length === 4, "おみせの ごほうび 4つ");
}

// ---- 8. スコア モード（js/korokoro-score.js）: 本物の スイカゲームと おなじ きまり ----
const scoreTable = [];
{
  ok(ScoreScene && R.SCENES.koroscore === ScoreScene && SCORE.tops === 5 && SCORE_HOWTO.length >= 4 && SCORE_HOWTO.every((l) => !kanji.test(l)), "スコア モードの 画面・あそびかたの ことば");
  // 画面: 箱が ちゅうもん モードより 大きい・スコア／つぎ／3人／じゅんばん が 画面に おさまる（390×844・375×667）
  const G = R.G, W0 = G.W, H0 = G.H;
  for (const [w, h] of [[390, 844], [375, 667]]) {
    G.W = w; G.H = h;
    const sc = Object.create(ScoreScene.prototype); sc.team = ["wanko", "gachan", "goji"].map((id) => ({ id, turn: 0, jump: -1, emo: "normal" }));
    sc.board = new Board(sc, 1, Score.board()); sc.resize();
    const b = sc.board, row = b.row, spots = [0, 1, 2].map((i) => sc.teamSpot(i));
    ok(Math.abs(b.bh / b.bw - SCORE.H / 100) < 0.01, `${w}×${h}: スコア モードの 箱の たて・よこ（${b.bw}×${b.bh}）`);
    ok(b.bw >= 280 && b.bx - 7 >= 0 && b.bx + b.bw + 7 <= w && b.by - b.top >= sc.infoY + sc.infoH && row.y >= b.by + b.bh + 9 && row.y + row.h <= h - 4 && row.w / T.length >= 40, `${w}×${h}: スコア モードの 箱と じゅんばんが 画面に おさまらない（${JSON.stringify({ bw: b.bw, bx: b.bx, by: b.by, row })}）`);
    ok(sc.panel.x >= 8 && spots[0].x - sc.charSize / 2 >= sc.panel.x + sc.panel.w - 2 && spots[2].x + sc.charSize / 2 <= sc.nextBox.x + 2 && sc.nextBox.x + sc.nextBox.w <= w - 8 && sc.infoY >= 56, `${w}×${h}: スコア・3人・つぎ が かさなる／「やめる」の ボタン（うえ 8〜52）に かかる`);
    const order = new Board(fakeScene(), 1); order.layout({ x: 10, y: Math.round(Math.min(h * 0.4, 330)) + 40, w: w - 20, h: h - Math.round(Math.min(h * 0.4, 330)) - 52 });
    ok(b.bw > order.bw * 1.1, `${w}×${h}: スコア モードの 箱が ちゅうもん モードより 大きく ない（${b.bw} / ${order.bw}）`);
  }
  G.W = W0; G.H = H0;
  // 点: おとすだけ 0点・さくらんぼ 2つで 1・ごじ どうしで 36（コインは まんなかでは でない）
  const sc = { phase: "play", team: ["wanko", "gachan", "goji"].map((id) => ({ id, turn: 0, jump: -1, emo: "normal" })), fx: [], overs: 0,
    teamSpot: (i) => ({ x: 100 + i * 40, y: 50 }), addFx(kind, x, y, o) { this.fx.push({ kind, x, y, ...o }); }, gameOver() { this.overs++; } };
  const b = new Board(sc, 7, Score.board()); b.layout({ x: 8, y: 135, w: 374, h: 699 });
  ok(b.mode === "score" && b.world.overSec === SCORE.overSec && b.row && !b.col, "スコア モードの 箱");
  b.held = 3; b.dropNow(); for (let i = 0; i < 90; i++) b.tick(1 / 60, true);
  ok(b.points === 0 && b.drops === 1, "おとした だけで 点が はいる");
  b.world.add(0, 20, 105, { landed: true }); b.world.add(0, 29.2, 105, { landed: true }); for (let i = 0; i < 30; i++) b.tick(1 / 60, true);
  ok(b.points === 1 && b.merges === 1, `さくらんぼ 2つが 1てんに ならない（${b.points}）`);
  b.world.bodies = []; b.world.add(7, 26, 86, { landed: true }); b.world.add(7, 73, 86, { landed: true }); for (let i = 0; i < 30; i++) b.tick(1 / 60, true);
  ok(b.points === 37 && b.coins === 0 && b.world.bodies.length === 0 && sc.team.every((m) => m.emo === "happy") && sc.fx.some((f) => f.text === "がおー！"), `ごじ どうしが 36てんで きえない（${b.points}・コイン ${b.coins}）`);
  // あふれ: おしまい（1かいだけ）・箱は とまる・もう おとせない
  b.world.bodies = []; for (let i = 0; i < 12; i++) { const col = i % 2, row = Math.floor(i / 2); b.world.add((row + col) % 2 ? 6 : 7, 24 + col * 52, 86.4 - row * 44, { landed: true }); }
  let t = 0; for (; t < 4 && !b.over; t += 1 / 60) b.tick(1 / 60, true);
  const snap = JSON.stringify(b.world.bodies.map((o) => [o.x, o.y]));
  for (let i = 0; i < 60; i++) b.tick(1 / 60, true);
  ok(b.over === "overflow" && sc.overs === 1 && t < 1.6 && !b.canDrop() && !b.dropNow() && JSON.stringify(b.world.bodies.map((o) => [o.x, o.y])) === snap && !b.world.floorOpen && b.spills === 0, `スコア モードで あふれても おしまいに ならない（${t.toFixed(2)}びょう・${sc.overs}かい）`);
  ok(b.world.bodies.some((o) => o.over > 0 && b.emo(o) === "sad") && b.world.bodies.some((o) => !(o.over > 0) && b.emo(o) === "surprise"), "おしまいの かお（はみだした 玉は かなしい・ほかは びっくり）");
  // じぶんで やめる: おなじ ように とまる（かおは にっこり・あかい せんは ださない）
  const st = new Board(sc, 8, Score.board()); st.layout({ x: 8, y: 135, w: 374, h: 699 }); st.world.add(2, 50, 100, { landed: true });
  st.end("stop"); st.end("overflow");
  ok(st.over === "stop" && !st.canDrop() && st.emo(st.world.bodies[0]) === "happy" && sc.overs === 1, "やめた ときの おしまい");
  // ハイスコア・ランキング（上から 5つ・おなじ 点は まえの きろくが うえ）・コイン・ひょうばん・めやす
  const save0 = R.Save.d; R.Save.d = R.Save.fresh();
  try {
    const r1 = Score.record(120, "2026-10-1"), r2 = Score.record(80, "2026-10-1"), r3 = Score.record(120, "2026-10-2");
    ok(r1.rank === 1 && r1.newBest && r2.rank === 2 && !r2.newBest && r3.rank === 2 && !r3.newBest && Score.best() === 120, `ランキングの じゅんい（${[r1.rank, r2.rank, r3.rank]}）`);
    for (const v of [300, 10, 50]) Score.record(v, "2026-10-3");
    const st = R.Save.d.shops.korokoro, last = Score.record(5, "2026-10-4");
    ok(st.tops.length === 5 && st.tops.map((e) => e.s).join() === "300,120,120,80,50" && last.rank === 0 && st.hi === 300 && st.games === 7 && st.tops[1].d === "2026-10-1", `ランキングが 5つ・大きい じゅん（${st.tops.map((e) => e.s)}）`);
    ok(Score.day("2026-10-1") === "10/1" && Score.day("") === "", "ランキングの 日づけ");
  } finally { R.Save.d = save0; }
  ok(Score.pay(0) === 0 && Score.pay(600) === 100 && Score.pay(10000) === SCORE.coinMax && Score.pay(600, "easy") < Score.pay(600) && Score.pay(600, "hard") > Score.pay(600) && Score.pay(600, "normal", 1.2) === 120, "スコア モードの コイン");
  ok(Score.rep(0) === 0 && Score.rep(550) === 5 && Score.rep(99999) === SCORE.repMax && Score.grade(0) === 0 && Score.grade(400) === 2 && Score.grade(5000) === 3, "ひょうばん・めやす（×△○◎）");
  // ボット: どれも いつかは おしまいに なる・かんがえて おとす ほど 点が たかい（こどもの はやさ）
  const scoreGame = (seed, { every, noise, silly }, o = Score.board()) => {
    const w = new World(seed, { overSec: SCORE.overSec, H: o.H, rules: o.rules }); seedR = seed * 7 + 3;
    let held = w.pickDrop(), next = 0, t = 0, score = 0, gojis = 0, up = 0;
    for (; t < 1200; t += 1 / 60) {
      if (t >= next) { w.dropAt(held, aimFor(w, held, noise, silly)); held = w.pickDrop(); next = t + every; }
      let end = false;
      for (const e of w.step(1 / 60)) { if (e.type === "merge" || e.type === "burst") score += e.points; if (e.type === "merge" && e.tier === T.length - 1) gojis++; if (e.type === "overflow") end = true; }
      for (const o of w.bodies) if (o.landed) up = Math.max(up, -o.vy); // おかれた 玉の うえむきの はやさ（がったいで おされて とびあがる）
      if (end || !w.ok()) break;
    }
    return { score, t, gojis, up, ok: w.ok() };
  };
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  for (const [name, bot] of [["でたらめ", { every: 1.2, noise: 0, silly: 1 }], ["こども", { every: 1.6, noise: 4, silly: 0.25 }]]) {
    const games = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => scoreGame(seed, bot));
    ok(games.every((g) => g.ok && g.t < 1199 && g.score > 0), `${name}: スコア モードが おわらない／こわれる`);
    scoreTable.push({ name, score: med(games.map((g) => g.score)), secs: Math.round(med(games.map((g) => g.t))), gojis: games.reduce((k, g) => k + g.gojis, 0) });
  }
  ok(scoreTable[1].score > scoreTable[0].score * 1.3 && scoreTable[1].gojis >= 4, `かんがえて おとしても 点が あまり かわらない（${JSON.stringify(scoreTable)}）`);
  // くっついた ときの はねを おさえて 15% たかい 箱（オーナーの FB 2026-09-30）: まえの きまり（はね・110）より ながく あそべる
  const kidBot = { every: 1.6, noise: 4, silly: 0.25 }, old = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => scoreGame(seed, kidBot, { H: RULES.H, rules: null }));
  const oldSecs = med(old.map((g) => g.t)), oldScore = med(old.map((g) => g.score));
  const nowUp = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8].map((seed) => scoreGame(seed, kidBot).up)), oldUp = Math.max(...old.map((g) => g.up));
  ok(new World(1).R === RULES && RULES.up === Infinity && RULES.keep === 1 && Math.abs(SCORE.H - RULES.H * 1.15) < 0.01 && Score.board().H === SCORE.H, "ちゅうもん モードの 物理は そのまま・スコア モードの 箱は 15% たかい");
  ok(nowUp <= SCORE.rules.up + 1e-6 && oldUp > 200, `がったいで おされた 玉の うえむきの はやさ（いま ${nowUp.toFixed(0)}・まえ ${oldUp.toFixed(0)}）`);
  ok(scoreTable[1].secs >= oldSecs * 1.25 && scoreTable[1].score >= oldScore * 1.2, `はねを おさえても ながく あそべない（いま ${scoreTable[1].secs}びょう ${scoreTable[1].score}てん・まえ ${Math.round(oldSecs)}びょう ${oldScore}てん）`);
  scoreTable.push({ name: "まえの きまりの こども", score: oldScore, secs: Math.round(oldSecs), gojis: old.reduce((k, g) => k + g.gojis, 0) });
  // お店の モードえらび: ころころ フルーツ いがいは きかない
  ok(await Score.choose({ shopId: "crepe" }) === "order", "ほかの お店で モードを きく");
}

// ---- 9. ハイスコアの ごほうび: フルーツの とくべつな かぐ（js/korokoro-prizes.js）----
{
  const P = R.KOROKORO_PRIZES, KP = R.KorokoroPrizes, F = R.FURN_INDEX;
  ok(P.length === 6 && P.every((p, i) => i === 0 || p.score > P[i - 1].score) && P[0].score <= 300 && P[P.length - 1].score <= 3000, "ごほうびは 6つ・めやすは だんだん たかく（はじめは かんたん）");
  ok(new Set(P.map((p) => p.id)).size === P.length && P.every((p) => !kanji.test(p.name + p.desc) && p.name.length <= 12), "ごほうびの id・なまえ・せつめい（漢字なし・12もじ まで）");
  ok(["さくらんぼ", "いちご", "みかん", "りんご", "なし"].every((w) => P.some((p) => p.name.startsWith(w))), "くだもの 5しゅの かぐが ある");
  const shopFloor = R.BUY_SHOPS.furniture.items("floor").map((f) => f.id);
  for (const p of P) {
    const f = F[p.id];
    ok(f && f.rare && f.price === 0 && f.koroPrize && f.kind === "floor" && f.interactive && f.comfort > 0 && f.w === p.w && f.depth === p.depth && f.h === p.h, `${p.id}: 家具の とうろく`);
    ok(!shopFloor.includes(p.id), `${p.id}: 家具やさんで うって いる`);
    ok(R.FurnModels.has(p.id), `${p.id}: 立体モデルが ない`);
    for (const flip of [false, true]) for (const live of [false, true]) {
      const m = live ? R.FurnModels.build(p.id, { flip, live: true }) : R.HomeDesign.model(p.id, { flip });
      const svg = m && m.full, ids = svg ? [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]) : [];
      ok(svg && svg.startsWith("<svg") && !/NaN|undefined|Infinity/.test(svg) && [m.x, m.y, m.w, m.h].every(Number.isFinite) && m.w > 20 && m.h > 20 && new Set(ids).size === ids.length, `${p.id}（${flip ? "はんてん" : "そのまま"}${live ? "・うごく" : ""}）: 絵が こわれている`);
    }
    ok(typeof R.FURN_ART[p.id] === "function" && R.FURN_ART[p.id]().startsWith("<svg"), `${p.id}: 一覧の 絵が ない`);
    ok(R.ItemDexSources.source("furn", F[p.id]).includes(p.score + "てん"), `${p.id}: ずかんの てに いれかたが ない`);
  }
  // さわる: どの かぐも タップで うごく（ランプは あかりが つく・きえる）
  const save1 = R.Save.d; R.Save.d = R.Save.fresh();
  try {
    const fake = { chars: [], s: 1 };
    for (const p of P) {
      const it = { id: p.id, uid: 900 + P.indexOf(p), x: 100, y: 300 };
      ok(R.FurnLive.tap(fake, it) === true && R.FurnLive.state(it).t < 0.5, `${p.id}: タップで うごかない`);
    }
    const lamp = { id: "koro_cherry_lamp", uid: 900, x: 100, y: 300 }, on = R.FurnLive.state(lamp).on;
    R.FurnLive.tap(fake, lamp); ok(R.FurnLive.state(lamp).on === !on, "さくらんぼの ランプの あかりが かわらない");
  } finally { R.FurnLive.reset(); R.Save.d = save1; }
  // もらう: めやすに とどいた まだの ものを 1つずつ（下の ものも いっしょ）・2どめは もらえない・ハイスコアも かぞえる
  const save0 = R.Save.d; R.Save.d = R.Save.fresh();
  try {
    const st = R.Save.d.shops.korokoro;
    ok(KP.claim(P[0].score - 1).length === 0 && KP.next() === P[0], "めやす まえに もらえる");
    const a = KP.claim(P[1].score, "2026-10-1");
    ok(a.map((p) => p.id).join() === [P[0].id, P[1].id].join() && R.Save.d.furn[P[0].id] === 1 && R.Save.d.furn[P[1].id] === 1 && st.gifts[P[1].id] === "2026-10-1", "めやすで ごほうびが もらえない");
    ok(KP.claim(P[1].score + 50).length === 0 && R.Save.d.furn[P[0].id] === 1, "おなじ ごほうびを 2かい もらえる");
    st.hi = P[P.length - 1].score + 10;
    ok(KP.claim(0).length === P.length - 2 && P.every((p) => R.Save.d.furn[p.id] === 1 && KP.got(p.id)) && KP.next() === null && KP.list().every((p) => p.own), "ハイスコアで のこりの ごほうびが もらえない");
  } finally { R.Save.d = save0; }
  // まえの セーブにも gifts が たされる
  const v0 = JSON.parse(JSON.stringify(R.Save.fresh())); delete v0.shops.korokoro.gifts;
  ok(JSON.stringify(R.Save.migrate(v0).shops.korokoro.gifts) === "{}", "まえの セーブに gifts が たされない");
}

console.log(`Korokoro: ${n} checks（${table.join(" ／ ")}／ スコア モード ${scoreTable.map((r) => `${r.name} ${r.score}てん・${r.secs}びょう`).join("・")}）`);
