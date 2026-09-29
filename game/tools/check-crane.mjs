// クレーンゲーム（crane-physics.js・crane-machines.js・crane-scene.js）の 検査。ブラウザ なしで 物理を うごかす。
// 8台が こわれない・ちゃんと ねらえば とれる・よわい アームは たいてい はずれる・トライポッド／スウィートランド／リングの しくみ・
// セーブと つづきから・100コインと ごほうびは 1かいだけ・おなじ たねは おなじ けっか・画面の ことば・SvgCache の キー。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { CraneMachines: CM, PrizeArcade: PA, CraneArt: CA } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const finite = (v) => Number.isFinite(v);
const clawLike = (r) => r.type === "claw" || r.type === "ring";
// アームを 景品の 上へ（リングの 台は リングの ま上）→ おす → おわるまで
const aimAndGrab = (r, k, dx = 0, dz = 0) => {
  const b = r.list()[k], p = b.data.ring ? CM.toWorld(r.W, b, b.data.ring.slice(0, 3)) : r.W.centroid(b);
  r.rig.load({ x: p[0] + dx, z: p[2] + dz }); r.press();
  for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60);
  return r;
};

// ---- 1. 8台: 4しゅるい × 2・こわれない・台の 中・おもすぎない ----
ok(PA.machines.length === 8 && CM.DEFS.length === 8, "クレーンは 8台");
for (const t of ["claw", "sweet", "tripod", "ring"]) ok(PA.machines.filter((m) => m.type === t).length === 2 && CM.DEFS.filter((d) => d.type === t).length === 2, t + " は 2台");
PA.machines.forEach((m, i) => { ok(CM.DEFS[i].type === m.type, `台 ${i}: PrizeArcade と CraneMachines の しゅるいが ちがう`); ok(R.FURN_INDEX[m.prize] || R.BAG_INDEX[m.prize], `台 ${i}: けいひん ${m.prize} が ない`); ok(m.qty >= 1, `台 ${i}: qty`); });
for (let i = 0; i < 8; i++) {
  const t0 = performance.now(), r = new CM.CraneRound(i, null, { seed: 11 }), build = performance.now() - t0, M = r.def.box;
  ok(r.list().length >= 1, `台 ${i}: 景品が ない`);
  for (const p of r.W.P) if (!p.dead) ok(finite(p.x) && finite(p.y) && finite(p.z), `台 ${i}: 位置が NaN`);
  for (const b of r.list()) { const c = r.W.centroid(b); ok(c[0] > 0 && c[0] < M.w && c[2] > 0 && c[2] < M.d && c[1] > -1 && c[1] < M.h, `台 ${i}: 景品が 台の 外 ${c.map((v) => v.toFixed(1))}`); }
  const t1 = performance.now(); for (let f = 0; f < 120; f++) r.step(1 / 60); const per = (performance.now() - t1) / 120;
  ok(per < 6, `台 ${i}: 1フレームの 物理が おもい（${per.toFixed(2)}ms）`);
  ok(build < 3000, `台 ${i}: はじめの ならべが おそい（${build.toFixed(0)}ms）`);
}

// ---- 2. アーム: つよい ＋ よい ねらい → とれる・よわい → たいてい はずれる（3本アーム） ----
{
  let strong = 0, weak = 0; const tries = 6;
  for (let k = 0; k < tries; k++) { if (aimAndGrab(new CM.CraneRound(0, null, { seed: 5, strong: true }), k).got.length) strong++; if (aimAndGrab(new CM.CraneRound(0, null, { seed: 5, strong: false }), k).got.length) weak++; }
  ok(strong >= 3, `3本アーム: つよい アームで ねらっても とれない（${strong}/${tries}）`);
  ok(weak <= 2 && weak < strong, `3本アーム: よわい アームで とれすぎる（${weak}/${tries}）`);
  // まったく ちがう ところ（おくの すみ）では とれない
  const r = new CM.CraneRound(0, null, { seed: 5, strong: true }); r.rig.load({ x: 54, z: 42 }); r.press(); for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60);
  ok(r.done, "3本アーム: あそびが おわらない");
  // 30びょう たつと じぶんで おりる
  const t = new CM.CraneRound(0, null, { seed: 5 }); for (let f = 0; f < 60 * 31; f++) t.step(1 / 60); ok(t.phase !== "move" && t.time === 0, "30びょうで アームが おりない");
}
// 2本アーム（大きい ぬいぐるみ）: つよい アームなら どこかで とれる
{ let w = 0; for (const [dx, dz] of [[0, 0], [0, 4], [0, -4], [4, 0], [-4, 0]]) if (aimAndGrab(new CM.CraneRound(1, null, { seed: 5, strong: true }), 0, dx, dz).got.length) w++; ok(w >= 1, "2本アーム: つよい アームでも とれない"); }

// ---- 3. リングフック: リングに かければ とれる（アームの つよさは かんけい ない）・はずせば とれない ----
for (const i of [6, 7]) {
  let w = 0; const k0 = new CM.CraneRound(i, null, { seed: 5 }).list().length;
  for (let k = 0; k < k0; k++) if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: false }), k).got.length) w++;
  ok(w >= Math.ceil(k0 / 2), `リング ${i}: リングに あわせても とれない（${w}/${k0}）`);
  const miss = aimAndGrab(new CM.CraneRound(i, null, { seed: 5 }), 0, 9, 0);
  ok(miss.got.length === 0, `リング ${i}: リングから 9cm ずれても とれる`);
}

// ---- 4. トライポッド: あたりで アームが おちる・おちた アームは つぎも そのまま・ぜんぶ おちれば とれる ----
for (const i of [4, 5]) {
  let board = null, won = false, plays = 0;
  for (let play = 0; play < 3 && !won; play++) {
    const r = new CM.CraneRound(i, board, { seed: 3 }); plays++;
    if (board) ok(r.rig.arms.filter((a) => !a.up).length >= 3, `トライポッド ${i}: おちた アームが もどって いる`);
    for (let f = 0; f < 60 * 40 && !r.done; f++) {
      if (r.phase === "spin") { const a = r.rig.armAt(r.rig.cell()); if (a && a.up && r.rig.light % 1 > 0.45) { ok(r.press() === "hit", `トライポッド ${i}: アームの ランプで とめても あたらない`); } }
      r.step(1 / 60);
    }
    ok(r.done, `トライポッド ${i}: あそびが おわらない`);
    won = r.got.length > 0; board = r.board();
  }
  ok(won, `トライポッド ${i}: アームを ぜんぶ おとしても とれない`);
  // はずれの ランプでは アームは おちない
  const r = new CM.CraneRound(i, null, { seed: 3 }); r.rig.light = 1.5; r.rig.run = false; r.phase = "spin";
  ok(r.press() === "miss" && r.rig.arms.every((a) => a.up), `トライポッド ${i}: はずれで アームが おちた`);
}

// ---- 5. スウィートランド: 3かい すくって おとす・おしだしで おちた ぶんだけ もらえる ----
for (const i of [2, 3]) {
  let board = null, total = 0, scooped = 0;
  for (let play = 0; play < 2; play++) {
    const r = new CM.CraneRound(i, board, { seed: 9 }), o = r.rig.o;
    for (let f = 0; f < 60 * 60 && !r.done; f++) {
      if (r.phase === "swing" && Math.abs(r.rig.sz - (o.cz + 6)) < 0.7 && r.pt > 0.4) r.press();
      if (r.phase === "swing2" && Math.abs(r.rig.sx - 32) < 0.7 && r.pt > 0.4) r.press();
      if (r.phase === "lift" && r.pt < 1 / 60 + 1e-6) scooped += r.list().filter((b) => { const c = r.W.centroid(b); return Math.abs(c[0] - r.rig.sx) < 7 && Math.abs(c[2] - r.rig.sz) < 7 && c[1] > o.top + 2; }).length;
      r.step(1 / 60);
    }
    ok(r.done && r.scoops === 0, `スウィート ${i}: 3かい すくえない`);
    total += r.got.length; board = r.board();
  }
  ok(scooped >= 1, `スウィート ${i}: ショベルで すくえない`);
  ok(total >= 1, `スウィート ${i}: 2かい あそんでも 1こも おちない`);
}

// ---- 6. セーブ: board() から おなじ 台に もどる・つづきから（おりる とちゅう → もういちど おろす） ----
for (let i = 0; i < 8; i++) {
  const a = new CM.CraneRound(i, null, { seed: 4 }), bd = JSON.parse(JSON.stringify(a.board())), b = new CM.CraneRound(i, bd, { seed: 4 });
  const sa = a.list().map((x) => [x.data.sid, a.W.centroid(x)]), sb = new Map(b.list().map((x) => [x.data.sid, b.W.centroid(x)]));
  ok(JSON.stringify(bd).length < 9000, `台 ${i}: セーブが 大きすぎる（${JSON.stringify(bd).length}）`);
  for (const [sid, c] of sa) { const d = sb.get(sid); ok(d && Math.hypot(d[0] - c[0], d[1] - c[1], d[2] - c[2]) < 1.5, `台 ${i}: セーブから もどすと 景品 ${sid} の 位置が ちがう`); }
}
{
  const r = new CM.CraneRound(0, null, { seed: 4, strong: true }); r.rig.load({ x: 30, z: 20 }); r.press(); for (let f = 0; f < 60; f++) r.step(1 / 60);
  const cp = JSON.parse(JSON.stringify(r.snap())); ok(cp.drop && cp.x === 30 && cp.z === 20, "おりる とちゅうの セーブに ばしょが ない");
  const again = new CM.CraneRound(0, cp.board, { seed: 4, strong: true, cp }); ok(again.phase === "stop" && Math.abs(again.rig.x - 30) < 1e-6, "つづきから: もういちど おりない");
  const mv = new CM.CraneRound(0, null, { seed: 4 }); mv.rig.load({ x: 22, z: 30 }); for (let f = 0; f < 120; f++) mv.step(1 / 60);
  const cp2 = mv.snap(), back = new CM.CraneRound(0, cp2.board, { seed: 4, cp: cp2 }); ok(back.phase === "move" && Math.abs(back.time - mv.time) < 0.01 && Math.abs(back.rig.x - 22) < 0.01, "つづきから: うごかす ときの 時間・ばしょ");
  const tr = new CM.CraneRound(4, null, { seed: 4 }); tr.stops = 1; const cp3 = tr.snap(), tr2 = new CM.CraneRound(4, cp3.board, { seed: 4, cp: cp3 }); ok(tr2.stops === 1, "つづきから: トライポッドの のこり");
  const sw = new CM.CraneRound(2, null, { seed: 4 }); sw.scoops = 2; sw.got = [99]; const cp4 = sw.snap(), sw2 = new CM.CraneRound(2, cp4.board, { seed: 4, cp: cp4 }); ok(sw2.scoops === 2 && sw2.got.length === 1, "つづきから: スウィートの のこりと とれた かず");
}

// ---- 7. おなじ たね・おなじ そうさ → おなじ けっか ----
{
  const go = () => { const r = new CM.CraneRound(0, null, { seed: 21, strong: true }); return aimAndGrab(r, 1); };
  const a = go(), b = go(); ok(JSON.stringify(a.board()) === JSON.stringify(b.board()) && a.got.join() === b.got.join(), "おなじ たねで けっかが ちがう（ランダムが まじって いる）");
}

// ---- 8. PrizeArcade: 100コイン・ごほうびは 1かいだけ・天井・リングは いつも つよい ----
{
  const S = R.Save; S.d = S.fresh(); S.d.coins = 1000; const back = { venue: "arcade", floor: 1, back: { map: "city", x: 12, y: 62 } };
  ok(S.d.arcade.boards && S.d.arcade.miss && S.d.arcade.got, "Save.fresh に クレーンの 台・はずれ・とれた かずが ない");
  const old = S.migrate({ ...S.fresh(), arcade: { active: null, settled: null, plays: 3, wins: 1 } }); ok(old.arcade.plays === 3 && old.arcade.boards && old.arcade.miss, "ふるい セーブに 台の ようすを たせない");
  const run = PA.start(0, back); ok(run && S.d.coins === 900 && S.d.arcade.active.id === run.id, "100コインで はじまらない");
  ok(PA.start(1, back) === null && S.d.coins === 900, "とちゅうの あいだに もう1台 はじめられる");
  const round = { got: [3, 7], board: () => ({ v: 1, n: 9, b: [], s: {} }) };
  ok(PA.finish(run, round) && S.d.furn.ike_prize_0 === 2 && !PA.finish(run, round) && S.d.furn.ike_prize_0 === 2, "ごほうびが 2かい もらえる／もらえない");
  ok(S.d.arcade.active === null && S.d.arcade.plays === 1 && S.d.arcade.miss[0] === 0 && S.d.arcade.boards[0], "おわりの セーブ");
  // はずれが つづくと つよく なる（4かいで かならず）
  S.d.coins = 1000; for (let k = 0; k < 4; k++) { const rr = PA.start(0, back); PA.finish(rr, { got: [], board: () => ({ v: 1, n: 1, b: [], s: {} }) }); }
  ok(S.d.arcade.miss[0] === 4 && PA.chance(0) === 1, "はずれ 4かいで かならず つよい アームに ならない");
  const lucky = PA.start(0, back); ok(lucky.strong === true, "天井で つよく ならない"); PA.finish(lucky, { got: [1], board: () => ({ v: 1, n: 1, b: [], s: {} }) }); ok(S.d.arcade.miss[0] === 0, "とれたら はずれの かずが もどらない");
  S.d.coins = 5000;
  for (let k = 0; k < 5; k++) { const rr = PA.start(6, back); ok(rr.strong === true, "リングフックの アームが よわい"); PA.finish(rr, { got: [], board: () => ({ v: 1, n: 1, b: [], s: {} }) }); }
  const cookie = PA.start(7, back); PA.finish(cookie, { got: [1], board: () => ({ v: 1, n: 1, b: [], s: {} }) }); ok((S.d.bag.prize_cookie || 0) === 12, "まむまむの はこで 12まい もらえない");
  const sweet = PA.start(2, back); PA.finish(sweet, { got: [1, 2, 3], board: () => ({ v: 1, n: 1, b: [], s: {} }) }); ok((S.d.bag.prize_uma || 0) === 3, "スウィートは おちた かずだけ もらえる");
  S.d.coins = 50; ok(PA.start(0, back) === null && S.d.coins === 50, "コインが たりなくても はじまる");
}

// ---- 9. ことば（ひらがな中心・漢字なし）・SvgCache の キー ----
{
  const kanji = /[一-鿿]/;
  for (const [t, s] of Object.entries(PA.rules)) ok(!kanji.test(s) && s.length <= 110, `あそびかた（${t}）に 漢字／ながすぎる`);
  for (const m of PA.machines) ok(!kanji.test(m.name) && m.name.length <= 16, `台の なまえ「${m.name}」`);
  for (const m of PA.machines) ok(!kanji.test(PA.item(m.prize).name), `けいひんの なまえ「${PA.item(m.prize).name}」に 漢字`);
  for (const th of Object.values(CA.THEME)) ok(!kanji.test(th.sign), `かんばん「${th.sign}」に 漢字`);
  const keys = Object.keys(CA.TEX); ok(keys.length > 20 && keys.every((k) => /^[a-z]+(-[a-z]+)+$/.test(k)), "テクスチャの キーは きまった なまえ だけ");
  for (const k of keys) { const s = CA.TEX[k](); ok(typeof s === "string" && s.startsWith("<svg") && !/undefined|NaN/.test(s), `テクスチャ ${k} の SVG`); }
  for (const d of CM.DEFS) { const th = CA.THEME[d.theme]; ok(th && CA.TEX[th.wall] && CA.TEX[th.floor], `台の テーマ ${d.theme}`); }
  for (const s of Object.keys(CM.SHAPES)) { const S = CM.SHAPES[s](); ok(Object.keys(CA.TEX).some((k) => k.startsWith(S.look + "-")), `景品 ${s} の 絵（${S.look}）が ない`); }
}
console.log(`Crane: 8 machines (claw/2-claw/sweet/tripod/ring), physics outcomes, save/resume, fees and rewards, determinism, text — ${n} checks OK`);
