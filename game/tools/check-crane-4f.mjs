// Meeときょれじゃ 4F の あたらしい しゅるいの クレーン 3台（UI-54。js/crane-machines.js・js/crane-scene.js・js/crane-physics.js・js/arcade-art.js・js/gacha-forest.js）の 検査。ブラウザ なしで
// 物理（はねかえり・たこやきの くぼみ）・たこやき（だまを すくう・くぼみに はまる・あたりで けいひん・おみせの 人が もどす）・バーバーカット（ちょきん・ほつれ・よく きれる ハサミ・すべりだい）・
// バウンドボール（ゴムボールで はねる・てまえを つかむと まえに はねやすい）・セーブと つづきから・100コインと はずれの かず・4F の ばしょ（かくさない）・館の 絵・ことばを たしかめる。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { CraneMachines: CM, PrizeArcade: PA, CranePhys: CP, CraneArt: CA } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
const DAY = "2026-10-2";
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const idx = (id) => CM.DEFS.findIndex((d) => d.id === id);
const TAKO = idx("tako"), BARBER = idx("barber"), BOUND = idx("bound");
const run = (r, sec = 40) => { for (let f = 0; f < 60 * sec && !r.done; f++) r.step(1 / 60); return r; };
const balls = (r) => r.list().filter((b) => b.data.ball);

// ---- 1. 台の ならび（21〜23）・PrizeArcade・あそびかた・いろ ----
ok(TAKO === 21 && BARBER === 22 && BOUND === 23 && CM.DEFS.length === 24 && PA.machines.length === 24, "4F の 3台は 21〜23 ばん");
for (const [i, type] of [[TAKO, "tako"], [BARBER, "barber"], [BOUND, "bound"]]) {
  const d = CM.DEFS[i], m = PA.machines[i];
  ok(d.type === type && m.type === type && m.id === d.id && m.daily && d.pool && d.pick === m.mix && !d.keep && !d.legacy, `${d.id}: しゅるい・日がわり`);
  ok(PA.rules[type] && !kanji.test(PA.rules[type] + m.name + m.label) && m.label.length <= 8, `${d.id}: あそびかた・なまえ（かな）`);
  const th = CA.THEME[d.theme]; ok(th && CA.TEX[th.wall] && CA.TEX[th.floor] && !kanji.test(th.sign), `${d.id}: かべ・ゆか・かんばん`);
  ok(/^<svg/.test(CA.TEX[th.wall]()) && !/NaN|undefined/.test(CA.TEX[th.wall]()), `${d.id}: かべの 絵`);
  const L = PA.prizeList(i, DAY); ok(L.length === d.pick && new Set(L).size === L.length && L.every((id) => R.FURN_INDEX[id]), `${d.id}: その日の けいひん（家具）${L}`);
}
ok(CM.clawy("tako") && CM.clawy("bound") && !CM.clawy("barber"), "たこやき・バウンドボールは アームの 台・バーバーカットは ハサミ");
// 「やめる」の ボタン（CraneRound.canLeave）: 24台 ぜんぶ はじめは やめられる。台の あそびの ようす（this.idle など）で うわがき されない
for (let i = 0; i < CM.DEFS.length; i++) { const r = new CM.CraneRound(i, null, { seed: 2, day: DAY }); ok(typeof r.canLeave === "function" && !Object.prototype.hasOwnProperty.call(r, "canLeave") && r.canLeave() === true, `${CM.DEFS[i].id}: はじめは「やめる」が おせる`); }
ok(CM.DEFS[TAKO].pool.every((sh) => R.ArcadePrizes.INDEX[CM.SHAPES[sh]().prize].size === "mini") && CM.DEFS[BOUND].pool.every((sh) => R.ArcadePrizes.INDEX[CM.SHAPES[sh]().prize].size === "chibi") && CM.DEFS[BARBER].pool.length === R.BridgePrizes.ITEMS.length, "けいひん: たこやき ミニマスコット・バウンドボール ちいさな ぬいぐるみ・バーバーカット はしわたしの はこ");
ok(R.BridgePrizes.ITEMS.every((it) => { const S = CM.SHAPES["cut_" + it.key](); return S.prize === it.id && S.look === "hashi-" + it.key && Math.abs(S.size[0] - it.size[0] * 0.56) < 1e-6; }), "バーバーカットの はこは はしわたしの はこの 0.56ばい（おなじ 絵）");

// ---- 2. 物理: はねかえり（ゴムボール）・くぼみ（たこやき）・ねて いる だまは pin で おきない ----
{
  const W = new CP.World({ sub: 4 }); W.collider({ k: "plane", n: [0, 1, 0], d: 0 }); W.collider({ k: "sphere", c: [0, 6, 0], r: 6, bounce: 0.9 });
  const b = W.body({ parts: [{ x: 0, y: 40, z: 0, r: 2, m: 1 }] }); let apex = 0, hit = false;
  for (let f = 0; f < 240; f++) { W.step(1 / 60); const y = W.centroid(b)[1]; if (y < 15) hit = true; if (hit) apex = Math.max(apex, y); }
  ok(apex > 26, `ゴムボールで はねる（${apex.toFixed(1)}cm まで）`);
  const W2 = new CP.World({ sub: 4 }); W2.collider({ k: "plane", n: [0, 1, 0], d: 0 }); const b2 = W2.body({ parts: [{ x: 0, y: 40, z: 0, r: 2, m: 1 }] }); let a2 = 0, h2 = false;
  for (let f = 0; f < 240; f++) { W2.step(1 / 60); const y = W2.centroid(b2)[1]; if (y < 3) h2 = true; if (h2) a2 = Math.max(a2, y); }
  ok(a2 < 3, "はねかえりの ない ゆかでは はねない");
  // くぼみ: そっと おくと まん中へ・はやく ころがると とおりすぎる
  const P = { x0: 0, x1: 40, z0: 0, z1: 20, top: 10, holes: [[20, 10]], hr: 2.45, dep: 1.45, th: 3 };
  const cups = () => { const w = new CP.World({ sub: 4 }); w.collider({ k: "cups", ...P, fr: 0.12 }); w.collider({ k: "box", c: [20, 3.5, 10], h: [20, 3.5, 10] }); return w; };
  const w3 = cups(), q = w3.body({ parts: [{ x: 21.2, y: 12.5, z: 10.4, r: 2, m: 0.25 }], fric: 0.3 }); for (let f = 0; f < 180; f++) w3.step(1 / 60);
  const c3 = w3.centroid(q); ok(Math.hypot(c3[0] - 20, c3[2] - 10) < 0.6 && c3[1] < P.top + 1.2, `くぼみに はまる ${c3.map((v) => v.toFixed(2))}`);
  const w4 = cups(), q4 = w4.body({ parts: [{ x: 6, y: 12.05, z: 10, r: 2, m: 0.25 }], fric: 0.3 }); for (let k = 0; k < 4; k++) { w4.step(1 / 60); } const p4 = w4.P[q4.i0]; p4.px = p4.x - 160 / 240; for (let f = 0; f < 40; f++) w4.step(1 / 60);
  ok(w4.centroid(q4)[0] > 26, `はやい だまは くぼみを とおりすぎる（x ${w4.centroid(q4)[0].toFixed(1)}）`);
  const w5 = new CP.World({ sub: 4 }), pinned = w5.body({ parts: [{ x: 0, y: 2, z: 0, r: 2, m: 1 }] }); w5.nap(pinned, w5.centroid(pinned)); pinned.pin = true; w5.wake(pinned); ok(pinned.sleep, "pin の だまは おきない");
}

// ---- 3. たこやき ----
{
  const d = CM.DEFS[TAKO], P = d.plate;
  ok(P.holes.length === 16 && P.hits.length === 3 && P.hits.every((k) => k >= 0 && k < 16) && new Set(P.hits).size === 3, "てっぱんの くぼみ 16・あたり 3");
  ok(P.holes.every(([x, z]) => x - P.hr > P.x0 && x + P.hr < P.x1 && z - P.hr > P.z0 && z + P.hr < P.z1) && d.home.x > P.x0 && d.home.x < P.x1 && d.home.z > P.z0 && d.home.z < P.z1, "くぼみと はなす ところは てっぱんの なか");
  ok(d.moveLim[1] < P.x0 - 2 && d.rig.yaws.length === 5, "アームは やまの うえ だけ（てっぱんの うえには いけない）・5本の ツメ");
  const r = new CM.CraneRound(TAKO, null, { seed: 3, day: DAY });
  ok(balls(r).length === d.balls.n && balls(r).every((b) => { const c = r.W.centroid(b); return c[0] < P.x0 && c[1] < 9; }), "はじめは ピンポンだま 46こ（やまの なか）");
  ok(r.list().every((b) => b.data.ball) && Math.hypot(r.rig.x - d.start.x, r.rig.z - d.start.z) < 1e-6 && r.rig.o.lim[1] === d.moveLim[1], "けいひんは つつの なか・アームは やまの うえから");
  r.move(1, 0); for (let f = 0; f < 120; f++) r.step(1 / 60); r.move(0, 0); ok(r.rig.x <= d.moveLim[1] + 1e-6, "アームは てっぱんの うえへ いけない");
  // すくって てっぱんへ（なんかいか ためす。だいたい 1かいで 2こ いじょう）
  let scooped = 0, tries = 0, board = null, wonAt = -1;
  for (let k = 0; k < 6; k++) {
    const q = new CM.CraneRound(TAKO, board, { seed: 40 + k, day: DAY }), bs = balls(q).filter((b) => { const c = q.W.centroid(b); return c[0] > 8 && c[0] < 26 && c[1] < 9; }), c = q.W.centroid(bs[(k * 11) % bs.length]);
    q.rig.load({ x: c[0], z: c[2] }); q.press(); let held = 0, rel = false;
    for (let f = 0; f < 60 * 40 && !q.done; f++) { q.step(1 / 60); if (q.phase === "carry") held = Math.max(held, balls(q).filter((b) => q.W.centroid(b)[1] > 20).length); if (q.phase === "release" && !rel) { rel = true; ok(Math.hypot(q.rig.x - d.home.x, q.rig.z - d.home.z) < 0.6, "てっぱんの うえで はなす"); } }
    ok(q.done, "たこやき: あそびが おわる"); scooped += held; tries++;
    if (q.got.length && wonAt < 0) wonAt = k;
    board = JSON.parse(JSON.stringify(q.board()));
  }
  ok(scooped / tries >= 1.5, `たこやき: すくえる だまが すくない（${(scooped / tries).toFixed(1)}こ）`);
  // くぼみに はまった だまは つぎも うまった まま（セーブから もどしても）・あたりに はまると つつから けいひん・つぎの 1かいの はじめに おみせの 人が もどす
  const t = new CM.CraneRound(TAKO, null, { seed: 5, day: DAY }), miss = P.holes.findIndex((_, k) => !P.hits.includes(k)), hit = P.hits[0];
  t.add("pingpong", [P.holes[miss][0], P.top + 6, P.holes[miss][1]], [1, 0, 0, 0]); const ev = [];
  for (let f = 0; f < 240; f++) { t.step(1 / 60); ev.push(...t.events.splice(0)); }
  ok(t.filled[miss] && ev.some((e) => e.e === "hole" && e.k === miss && !e.hit) && !t.got.length, "はずれの くぼみに はまる（けいひんは でない）");
  const tb = JSON.parse(JSON.stringify(t.board())), t2 = new CM.CraneRound(TAKO, tb, { seed: 5, day: DAY });
  ok(t2.filled[miss] && !t2.staff && t2.list().some((b) => b.pin && b.data.hole === miss), "うまった くぼみは つぎも うまった まま");
  const pinnedBall = t2.list().find((b) => b.data.hole === miss), before = t2.W.centroid(pinnedBall); t2.add("pingpong", [before[0], P.top + 9, before[2]], [1, 0, 0, 0]); for (let f = 0; f < 120; f++) t2.step(1 / 60);
  ok(Math.hypot(...t2.W.centroid(pinnedBall).map((v, j) => v - before[j])) < 0.05, "うまった だまは うえに だまが のっても うごかない");
  t2.add("pingpong", [P.holes[hit][0], P.top + 6, P.holes[hit][1]], [1, 0, 0, 0]); const ev2 = [];
  for (let f = 0; f < 300; f++) { t2.step(1 / 60); ev2.push(...t2.events.splice(0)); }
  ok(ev2.some((e) => e.e === "hole" && e.k === hit && e.hit) && ev2.some((e) => e.e === "dispense") && t2.got.length === 1 && t2.won, "あたりの くぼみに はまると つつから けいひんが おちて とれる");
  ok(CM.lineup(d, DAY).includes(t2.gotShapes[0]) && PA.prizesOf(TAKO, t2)[0].n === 1 && R.FURN_INDEX[PA.prizesOf(TAKO, t2)[0].id], "とれるのは その日の ミニマスコット");
  const t3 = new CM.CraneRound(TAKO, JSON.parse(JSON.stringify(t2.board())), { seed: 6, day: DAY });
  ok(t3.staff === "tako" && t3.filled.every((v) => !v) && balls(t3).length === d.balls.n && balls(t3).every((b) => !t3.onPlate(t3.W.centroid(b))), "あたりの つぎは おみせの 人が てっぱんの だまを やまへ もどす");
  // とりだしぐちに おちた だまは けいひんでは ない（つぎに おみせの 人が もどす）
  const t4 = new CM.CraneRound(TAKO, null, { seed: 7, day: DAY }); t4.add("pingpong", [8.5, 20, 8.5], [1, 0, 0, 0]); run(t4, 2);
  ok(!t4.got.length && balls(t4).length === d.balls.n, "とりだしぐちに おちた だまは けいひんに ならない");
  ok(new CM.CraneRound(TAKO, JSON.parse(JSON.stringify(t4.board())), { seed: 7, day: DAY }).list().filter((b) => b.data.ball).length === d.balls.n, "へった だまは おみせの 人が たす");
  // いくつか あそぶと とれる・とれすぎない（ボット 2れつ × 8かい）
  let wins = 0, plays = 0;
  for (let s = 0; s < 2; s++) { let bd = null; for (let k = 0; k < 8; k++) { const q = new CM.CraneRound(TAKO, bd, { seed: 900 + s * 50 + k, day: DAY }), bs = balls(q).filter((b) => { const c = q.W.centroid(b); return c[0] > 8 && c[0] < 26 && c[1] < 9; }), c = q.W.centroid(bs[(k * 13 + s * 7) % bs.length]); q.rig.load({ x: c[0], z: c[2] }); q.press(); run(q); plays++; if (q.got.length) wins++; bd = JSON.parse(JSON.stringify(q.board())); } }
  ok(wins >= 2 && wins <= plays * 0.7, `たこやき: 16かいで ${wins}かい とれた（2〜11）`);
}

// ---- 4. バーバーカット ----
{
  const d = CM.DEFS[BARBER], C = d.cut;
  const play = (board, slot, dx, dz, o = {}) => {
    const r = new CM.CraneRound(BARBER, board, { seed: 8, day: DAY, ...o }), b = r.list().find((q) => q.pin && r.slotOf(q) === slot), c = r.W.centroid(b);
    r.hold(true, false); for (let f = 0; f < 3000 && r.phase === "right" && r.rig.x < c[0] + dx - 1e-6; f++) r.step(1 / 60);
    r.hold(false, false); r.step(1 / 60); r.hold(false, true);
    for (let f = 0; f < 3000 && r.phase === "back" && r.rig.z < c[2] + dz - 1e-6; f++) r.step(1 / 60);
    r.hold(false, false); const ev = []; for (let f = 0; f < 60 * 15 && !r.done; f++) { r.step(1 / 60); ev.push(...r.events.splice(0).map((e) => e.e)); }
    return { r, ev, sid: b.data.sid };
  };
  const r0 = new CM.CraneRound(BARBER, null, { seed: 8, day: DAY });
  ok(r0.list().length === 3 && r0.list().every((b) => b.pin && b.sleep && r0.slotOf(b) >= 0) && r0.phase === "right" && r0.rig.x === C.start[0] && r0.rig.z === C.start[1], "はこ 3つが ひもで つるされて いる・ハサミは ひだりの まえ");
  ok(new Set(r0.list().map((b) => r0.slotOf(b))).size === 3 && r0.list().every((b) => CM.lineup(d, DAY).includes(b.data.shape)), "ひも 1本に はこ 1つ（その日の けいひん）");
  run(new CM.CraneRound(BARBER, null, { seed: 8, day: DAY }), 2); ok(r0.list().every((b) => b.pin), "きるまで はこは おちない");
  // ①を はなすと もう みぎへ いけない・②を はなすと ちょきん
  { const r = new CM.CraneRound(BARBER, null, { seed: 8, day: DAY }); r.hold(true, false); for (let f = 0; f < 60; f++) r.step(1 / 60); const x1 = r.rig.x; r.hold(false, false); r.step(1 / 60); ok(x1 > C.start[0] + 7 && r.phase === "back", "①で みぎへ・はなすと ②の ばん"); r.hold(true, false); for (let f = 0; f < 30; f++) r.step(1 / 60); ok(r.rig.x === x1, "①は もう きかない"); r.hold(false, true); for (let f = 0; f < 30; f++) r.step(1 / 60); r.hold(false, false); r.step(1 / 60); ok(r.phase === "snip", "②を はなすと ちょきん"); }
  // ぴったり → きれて すべりだいを すべって とれる・はずれ → きれない・おしい → ほつれる・ほつれ 1 なら すこし ずれても きれる
  const a = play(null, 1, 0, -2); ok(a.ev.includes("cut") && a.r.got.length === 1 && a.r.won && R.FURN_INDEX[PA.prizesOf(BARBER, a.r)[0].id], "ひもに あわせると きれて とれる");
  const b = play(null, 1, 3.6, -2); ok(b.ev.includes("snipmiss") && !b.r.got.length && !Object.keys(b.r.rig.fray).length, "とおい ところは きれない・ほつれない");
  const c = play(null, 1, 1.4, -2); ok(c.ev.includes("near") && !c.r.got.length && c.r.rig.fray[c.sid] === 1, "おしいと ひもが ほつれる");
  const cb = JSON.parse(JSON.stringify(c.r.board())); ok(cb.s.f.some(([sid, v]) => sid === c.sid && v === 1), "ほつれは セーブに のこる");
  const c2 = play(cb, 1, 1.4, -2); ok(c2.ev.includes("cut") && c2.r.got.length === 1, "ほつれた ひもは すこし ずれても きれる");
  const tooFar = play(null, 1, 0, -C.blade - 3); ok(!tooFar.r.got.length, "はの さきより まえでは きれない");
  // きれた ところには つぎの 1かいで あたらしい はこ（restock）
  const nx = new CM.CraneRound(BARBER, JSON.parse(JSON.stringify(a.r.board())), { seed: 9, day: DAY }); ok(nx.staff === "restock" && nx.list().length === 3 && nx.list().every((q) => q.pin), "きれた ひもに おみせの 人が あたらしい はこを つるす");
  // よく きれる ハサミ（assist）: 2.4cm まで きれる
  const s = play(null, 1, 2.2, -2, { assist: true }); ok(s.r.sharp && s.r.staff === "sharp" && s.r.got.length === 1, "よく きれる ハサミは すこし ずれても きれる");
  // じかんぎれ（30びょう）は その ばしょで ちょきん
  { const r = new CM.CraneRound(BARBER, null, { seed: 8, day: DAY }); for (let f = 0; f < 60 * 31; f++) r.step(1 / 60); ok(r.phase !== "right" && r.time === 0, "30びょうで ちょきん"); }
  // つづきから: ちょきんの ところから おなじ けっか
  { const r = new CM.CraneRound(BARBER, null, { seed: 8, day: DAY }), bb = r.list().find((q) => r.slotOf(q) === 1), cc = r.W.centroid(bb); r.rig.x = cc[0]; r.rig.z = cc[2] - 2; r.rig.used1 = true; r.go("back"); r.snip();
    const cp = JSON.parse(JSON.stringify(r.snap())); ok(cp.snip && cp.type === "barber", "ちょきんの とちゅうの セーブ");
    const again = run(new CM.CraneRound(BARBER, cp.board, { cp, day: DAY }), 15); ok(again.got.length === 1 && run(r, 15).got.length === 1, "つづきからでも おなじ けっか"); }
  // 100コイン・はずれ 4かいで よく きれる ハサミ（PrizeArcade）
  {
    R.Save.d = R.Save.fresh(); R.Save.d.coins = 2000; const a2 = PA.norm(); const back = { venue: "arcade", floor: 4 };
    for (let k = 0; k < 4; k++) { const run2 = PA.start(BARBER, back); ok(run2 && !run2.assist, "はずれ 4かい までは ふつうの ハサミ"); PA.finish(run2, { got: [], gotShapes: [], board: () => ({ v: 1, id: "barber", n: 4, b: [], s: {}, day: DAY }) }); }
    ok(a2.miss[BARBER] === 4, "はずれの かず");
    const run3 = PA.start(BARBER, back); ok(run3 && run3.assist, "はずれ 4かいで よく きれる ハサミ"); PA.finish(run3, { got: [], gotShapes: [], board: () => ({ v: 1, id: "barber", n: 4, b: [], s: {}, day: DAY }) }); ok(a2.miss[BARBER] === 0, "よく きれる ハサミの あとは 0 から");
    ok(R.Save.d.coins === 2000 - 500, "1かい 100コイン");
  }
}

// ---- 5. バウンドボール ----
{
  const d = CM.DEFS[BOUND], B = d.ball, ch = d.chute;
  ok(Math.abs(d.home.x - B.c[0]) < 1 && Math.abs(d.home.z - B.c[2]) < 2.5 && B.c[2] - B.r < ch.z1 + 1 && B.bounce > 0.5, "はなす ところは ゴムボールの うえ・ボールの まえが とりだしぐち");
  const r0 = new CM.CraneRound(BOUND, null, { seed: 4, day: DAY }); ok(r0.list().length >= d.fill.keep && r0.list().every((b) => r0.W.centroid(b)[2] > d.step.z), "ぬいぐるみは だんの おく（ボールの おく）");
  // ぬいぐるみの うしろの ほうを つかむと まえに はねやすい（ぬいぐるみが アームの まえに ぶらさがる。ほんものの こつ「つかむ ところを まえ・うしろに かえる」）
  const grab = (dz) => { let lifted = 0, wins = 0, board = null; for (let k = 0; k < 14; k++) { const r = new CM.CraneRound(BOUND, board, { seed: 300 + k, day: DAY }), L = r.list(), b = L[k % L.length], c = r.W.centroid(b); r.rig.load({ x: c[0], z: c[2] + dz }); r.press(); let up = false, rel = null; for (let f = 0; f < 60 * 40 && !r.done; f++) { r.step(1 / 60); if (r.phase === "carry" && !up) up = r.list().some((q) => r.W.centroid(q)[1] > 26); if (r.phase === "release" && !rel) rel = [r.rig.x, r.rig.z]; } ok(r.done && rel && Math.hypot(rel[0] - d.home.x, rel[1] - d.home.z) < 0.6, "バウンドボール: ボールの うえで はなす"); if (up) lifted++; if (r.got.length) wins++; board = JSON.parse(JSON.stringify(r.board())); } return { lifted, wins }; };
  const back = grab(3), mid = grab(0);
  ok(back.wins >= 3 && mid.wins >= 1 && back.wins > mid.wins, `バウンドボール: うしろを つかむと とりやすい（うしろ ${back.wins}・まん中 ${mid.wins} / 14）`);
  ok(back.lifted >= 4 && mid.lifted >= 4, `バウンドボール: つかめない（${back.lifted}・${mid.lifted}）`);
}

// ---- 6. セーブ・日がわり（tools/check-crane.mjs の ぜんぶの 台の 検査も とおる）----
for (const i of [TAKO, BARBER, BOUND]) {
  const a = new CM.CraneRound(i, null, { seed: 4, day: DAY }), bd = JSON.parse(JSON.stringify(a.board()));
  ok(JSON.stringify(bd).length < 9000 && bd.day === DAY && bd.id === CM.DEFS[i].id, `${CM.DEFS[i].id}: セーブ`);
  const nextDay = new CM.CraneRound(i, bd, { seed: 4, day: "2026-10-3" }); ok(nextDay.day === "2026-10-3" && JSON.stringify(nextDay.mix) === JSON.stringify(CM.lineup(CM.DEFS[i], "2026-10-3")), `${CM.DEFS[i].id}: つぎの 日は その日の けいひん`);
}

// ---- 7. 4F の ばしょ（きたの ひがしの かべ・シールの ガチャを かくさない・まえに たてる・フロアマップ）・館の 絵 ----
{
  const f4 = R.VenueHalls.defs.arcade.floors[4], cr = f4.fixtures.filter((f) => f.kind === "crane"), st = f4.fixtures.filter((f) => f.kind === "gacha" && R.StickerBook.isSticker(f.series));
  ok(cr.map((f) => f.machine).join() === [TAKO, BARBER, BOUND].join() && cr.every((f) => f.y === 0 && f.dir === "y" && f.action === "crane" && f.w === 2 && f.h === 2), "4F の きたの かべに 3台");
  ok(R.IkeArcade.floorOf(TAKO) === 4 && R.IkeArcade.floorOf(BARBER) === 4 && R.IkeArcade.floorOf(BOUND) === 4 && ![1, 2, 3].some((k) => R.VenueHalls.defs.arcade.floors[k].fixtures.some((f) => f.machine >= 21)), "3台は 4F だけ");
  // ななめ うえから みると x − y が おなじ れつは かさなる。せの たかい クレーンは シールの ガチャ との あいだを 1れつ あける
  for (const g of st) for (const c of cr) ok(c.x - (c.y + c.h) >= g.x + g.w - g.y - 1, `クレーン（${c.x},${c.y}）が シールの ガチャ（${g.x},${g.y}）を かくす`);
  const walk = (r, [x, y]) => !R.IsoVenue.solidAt(r, x, y) && !r.fixtures.some((f) => !f.walk && !f.over && f.kind !== "hangsign" && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  ok(cr.every((f) => f.spots.every((p) => walk(f4, p)) && walk(f4, f.back)), "クレーンの まえに たてる");
  const z = f4.zones.find((q) => q.shop === "arcForestCrane"); ok(z && z.label === "クレーンゲーム" && cr.every((f) => f.x >= z.x && f.x + f.w <= z.x + z.w && f.y >= z.y && f.y + f.h <= z.y + z.h) && R.MallArt.SHOP.arcForestCrane, "フロアマップの へや「クレーンゲーム」");
  const dir = f4.fixtures.find((f) => f.kind === "directory"); ok(/クレーンゲーム 3だい/.test(dir.text) && /100コイン/.test(dir.text), "もりの あんないに クレーン");
  ok(/クレーン 3だい/.test(R.VenueHalls.defs.arcade.floors[1].fixtures.find((f) => f.kind === "directory").text), "1F の フロア あんないに クレーン");
  for (const f of cr) { const m = R.ArcadeArt.model(f); ok(m && /^<svg /.test(m.svg) && !/NaN|undefined/.test(m.svg) && m.vb.w > 0 && m.vb.h > 0 && !/NaN|undefined/.test(R.ArcadeArt.modelKey(f)), `館の ${f.label} の 絵`); }
  ok(R.ArcadeArt.specOf(TAKO) === "tako" && R.ArcadeArt.specOf(BARBER) === "barber" && R.ArcadeArt.specOf(BOUND) === "bound", "館の 台の しゅるい");
}

// ---- 8. 画面の ことば（かな）・おと ----
{
  const src = R.CraneScene.toString() + Object.values(R.CraneScene.prototype).filter((v) => typeof v === "function").map((v) => v.toString()).join("\n");
  for (const t of ["たまの やまを ねらって", "てっぱんへ はこぶよ", "あかい わが あたり", "ゴムボールの うえへ はこぶよ", "①を おしつづけて ハサミを みぎへ", "②を おしつづけて おくへ。はなすと ちょきん！", "おしい！ ひもが ほつれたよ", "おみせの ひとが よく きれる ハサミに かえて くれたよ", "おみせの ひとが てっぱんの ピンポンだまを やまに もどしたよ"]) ok(src.includes(t), `画面の ことば「${t}」`);
  for (const m of src.matchAll(/"([^"\n]*[ぁ-んァ-ヶ][^"\n]*)"/g)) ok(!kanji.test(m[1]), `画面の ことばに 漢字: ${m[1]}`);
  ok(["crane_pon", "crane_boing", "crane_snip"].every((k) => typeof R.Sound.se === "function") && /crane_snip/.test(src), "おと（ぽん・ぽよん・ちょきん）");
  ok(typeof R.PokaDebug.arcadeTako === "function" && typeof R.PokaDebug.arcadeBarber === "function", "PokaDebug.arcadeTako・arcadeBarber");
}

console.log(`Crane 4F (UI-54): takoyaki (5-prong scoop, 16 cups / 3 hits, plate keeps filled cups, staff reset), barber cut (hold 1 then 2, snip, fray, sharp scissors after 4 misses, slide to chute, resume), bound ball (rubber bounce, grabbing the back of the plush beats the centre), daily prizes, saves, 4F north wall placement without hiding the sticker machines, venue art and kana texts — ${n} checks OK`);
