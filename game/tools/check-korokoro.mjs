// ころころ フルーツ（js/korokoro-physics.js・js/korokoro-art.js・js/mg-korokoro.js・js/korokoro-town.js）の 検査。ブラウザ なしで 物理と おてつだいを うごかす。
// 玉の だん（くだもの と 3人の かお が おちてくる）・物理が こわれない（NaN・かべ ぬけ・めりこみ）・おなじ たねは おなじ けっか・
// がったい・すいかの はれつ・あふれ と からっぽ・おとす まの まち時間・ちゅうもんが とどく／時間ぎれ／あふれの 減点・
// こどもの はやさの ボットでも とどけられる（レベル 1〜5）・絵（NaN なし・id なし・キャッシュの キーが 有限）・お店・町・セーブ・BGM・ことば。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { KorokoroWorld: World, KOROKORO_TIERS: T, KOROKORO_RULES: RULES, KOROKORO_ORDERS: ORDERS, KorokoroArt: Art, KorokoroBoard: Board, KorokoroTask: Task } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;

// ---- 1. だん: 11しゅ・だんだん 大きく・おちてくる 5しゅに 3人の かお ----
ok(T.length === 11 && T.every((t, i) => t.tier === i && (i === 0 || t.r > T[i - 1].r)), "だんは 11しゅで 大きさが ふえる");
ok(T.every((t) => !kanji.test(t.name) && t.name.length <= 5), "だんの なまえは ひらがな・カタカナ 5もじ まで");
ok(["wanko", "gachan", "goji"].every((id) => T.some((t) => t.hero === id && t.tier < RULES.drop)), "わんこ・がちゃん・ごじ の かおが おちてくる だんに ある");
ok(T.filter((t) => !t.hero).length === 8 && T[T.length - 1].id === "suika", "くだもの 8しゅ・いちばん 大きいのは すいか");
ok(T.every((t, i) => i === 0 || t.points > T[i - 1].points), "大きい ものほど ポイントが おおい");

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
  w.add(2, 40, 100, { landed: true }); w.add(2, 54, 100, { landed: true });
  let ev = []; for (let i = 0; i < 30; i++) ev.push(...w.step(1 / 60));
  ok(w.bodies.length === 1 && w.bodies[0].tier === 3 && ev.filter((e) => e.type === "merge").length === 1, "おなじ いちご 2つが がちゃん 1つに ならない");
  const h = new World(3); h.add(1, 40, 104, { landed: true }); h.add(1, 51.5, 104, { landed: true });
  const he = []; for (let i = 0; i < 20; i++) he.push(...h.step(1 / 60));
  ok(he.some((e) => e.type === "merge" && e.hero === "wanko" && e.tier === 2), "わんこ 2つが がったいしても わんこの しるしが ない");
  const s = new World(3); s.add(10, 26, 86, { landed: true }); s.add(10, 73, 86, { landed: true });
  const se = []; for (let i = 0; i < 30; i++) se.push(...s.step(1 / 60));
  ok(s.bodies.length === 0 && se.some((e) => e.type === "burst"), "すいか 2つが はじけない");
  const d = new World(4); d.add(3, 30, 100, { landed: true }); d.add(4, 50, 100, { landed: true });
  for (let i = 0; i < 30; i++) d.step(1 / 60);
  ok(d.bodies.length === 2, "ちがう もの どうしが がったいした");
  // あふれ: ふちより 上に 2びょう → しらせ → ゆかを ひらいて からっぽ → また あそべる
  const o = new World(5);
  for (let i = 0; i < 12; i++) { const col = i % 2, row = Math.floor(i / 2); o.add((row + col) % 2 ? 9 : 10, 24 + col * 52, 86.4 - row * 44, { landed: true }); } // となりは ちがう もの（がったい しない）
  let over = null, t = 0;
  for (; t < 6 && !over; t += 1 / 60) for (const e of o.step(1 / 60)) if (e.type === "overflow") over = t;
  ok(over != null && over >= RULES.overSec - 0.1, `あふれの しらせが ない／はやすぎる（${over}）`);
  o.spill(); for (let i = 0; i < 60 * 4 && o.bodies.length; i++) o.step(1 / 60);
  ok(o.bodies.length === 0 && !o.floorOpen, "あふれた あと 箱が からっぽに ならない");
  o.dropAt(0, 50); for (let i = 0; i < 90; i++) o.step(1 / 60);
  ok(o.bodies.length === 1 && o.bodies[0].y > 100, "からっぽの あと また おとせない");
  // おとす まえの めやす: まっすぐ おちて とまる ところ
  const g = new World(6); g.add(6, 50, 110 - 13.8, { landed: true });
  ok(Math.abs(g.landingY(0, 50) - (110 - 13.8 * 2 - 4.6)) < 1e-6 && g.landingY(0, 5) === 110 - 4.6, "おちる ところの めやすが ちがう");
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
  // 2つの かおの がったいで その子が よろこぶ
  const c = new Task(fakeScene(), 1); c.layout(RECT); c.board.world.add(3, 40, 100, { landed: true }); c.board.world.add(3, 57.2, 100, { landed: true });
  for (let i = 0; i < 20; i++) c.update(1 / 60);
  const gachan = c.sc.team.find((m) => m.id === "gachan");
  ok(gachan.turn > 0 && gachan.emo === "happy" && c.sc.fx.some((f) => f.text === "ぴよ！"), "がちゃん 2つの がったいで がちゃんが よろこばない");
  // 大きな くだもので チップ
  const big = new Task(fakeScene(), 1); big.layout(RECT); big.board.world.add(8, 30, 90, { landed: true }); big.board.world.add(8, 66, 90, { landed: true });
  for (let i = 0; i < 30; i++) big.update(1 / 60);
  ok(big.bonusTip === R.KOROKORO_BONUS[9] && big.board.points === T[9].points, `メロンを つくった チップ（${big.bonusTip}）`);
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
ok(Art.FACES.length === 5 && Art.cropOf(1) > Art.cropOf(0), "表情 5つ・かおの 玉は みみの ぶん ひろく");
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
  const song = R.SONGS.shop_korokoro;
  ok(song && song.modern && !kanji.test(song.title) && song.source && /Schumann/.test(song.source.composer) && song.source.license === "Public Domain", "BGM（パブリックドメインの 名曲・出典）");
  ok(R.MusicDiscs.DISCS.some((d) => d.from.shop === "korokoro" && d.song === "shop_korokoro"), "おてつだいの ディスク");
  ok(R.ShopRewards.prizes.filter((p) => p.shop === "korokoro").length === 4, "おみせの ごほうび 4つ");
}

console.log(`Korokoro: ${n} checks（${table.join(" ／ ")}）`);
