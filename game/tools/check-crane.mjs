// クレーンゲーム（crane-physics.js・crane-machines.js・crane-scene.js）の 検査。ブラウザ なしで 物理を うごかす。
// 12台が こわれない・ちゃんと ねらえば とれる・よわい アームは たいてい はずれる・トライポッド／スウィートランド／リングの しくみ・
// セーブと つづきから（台の id・いれかわった 台の ふるい セーブ）・100コインと ごほうびは 1かいだけ・形ごとの 景品・コインの 景品と 1にちの 上限・
// おなじ たねは おなじ けっか・画面の ことば・SvgCache の キー。
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

// ---- 1. 12台: 4しゅるい（あそびかたは まえと おなじ）・こわれない・台の 中・おもすぎない ----
ok(PA.machines.length === 12 && CM.DEFS.length === 12, "クレーンは 12台");
for (const t of ["claw", "sweet", "tripod", "ring"]) ok(PA.machines.filter((m) => m.type === t).length >= 2 && CM.DEFS.filter((d) => d.type === t).length === PA.machines.filter((m) => m.type === t).length, t + " は 2台 いじょう");
ok(new Set(CM.DEFS.map((d) => d.id)).size === 12 && PA.machines.every((m, i) => m.id === CM.DEFS[i].id), "台の id が ない・かさなる・PrizeArcade と ちがう");
ok([1, 4, 6].every((i) => CM.DEFS[i].legacy && PA.machines[i].legacy) && CM.DEFS.filter((d) => d.legacy).length === 3, "まえの 8台と おなじ 台は 1・4・6");
PA.machines.forEach((m, i) => {
  ok(CM.DEFS[i].type === m.type, `台 ${i}: PrizeArcade と CraneMachines の しゅるいが ちがう`); ok(m.qty >= 1, `台 ${i}: qty`);
  const list = PA.prizeList(i); ok(m.coins > 0 ? !m.prize : list.length >= 1 && list.every((id) => R.FURN_INDEX[id] || R.BAG_INDEX[id]), `台 ${i}: けいひん ${list} が ない`);
  if (m.mix) ok(list.length === m.mix && new Set(list).size === m.mix, `台 ${i}: まぜた 景品の しゅるい`);
});
// 景品: 3人の ぬいぐるみ（表情・ポーズ・こもの ちがい 4しゅずつ）・ミニマスコット・町の人・コイン
{
  const plush = R.ArcadePrizes.ITEMS; ok(plush.filter((it) => it.size === "chibi").length === 12 && plush.filter((it) => it.size === "mini").length === 3 && plush.filter((it) => it.spec.sp).length >= 3, "景品の かず");
  for (const who of ["wanko", "gachan", "goji"]) { const v = plush.filter((it) => it.spec.who === who && it.size === "chibi"); ok(new Set(v.map((it) => it.spec.face)).size === 4 && new Set(v.map((it) => it.spec.pose)).size >= 3, `${who}: 表情 4しゅ・ポーズ 3しゅ いじょう`); }
  for (const it of plush) { const f = R.FURN_INDEX[it.id]; ok(f && f.rare && f.price === 0 && f.interactive && f.cityItem && !/[一-鿿]/.test(f.name), `景品 ${it.id} の 家具`); for (const dir of ["down", "up"]) { const svg = R.ArcadePrizes.svg(it.id, dir); ok(svg.startsWith("<svg") && !/undefined|NaN/.test(svg), `景品 ${it.id} の 絵（${dir}）`); } const m = R.IkebukuroItemArt.model(it.id); ok(m.full.includes("<svg") && m.w === f.w, `景品 ${it.id} の おうちの 絵`); }
  ok(PA.machines.filter((m) => m.coins).length === 2, "コインの 台は 2台");
}
for (let i = 0; i < 12; i++) {
  const t0 = performance.now(), r = new CM.CraneRound(i, null, { seed: 11 }), build = performance.now() - t0, M = r.def.box;
  ok(r.list().length >= 1, `台 ${i}: 景品が ない`);
  for (const p of r.W.P) if (!p.dead) ok(finite(p.x) && finite(p.y) && finite(p.z), `台 ${i}: 位置が NaN`);
  for (const b of r.list()) { const c = r.W.centroid(b); ok(c[0] > 0 && c[0] < M.w && c[2] > 0 && c[2] < M.d && c[1] > -1 && c[1] < M.h, `台 ${i}: 景品が 台の 外 ${c.map((v) => v.toFixed(1))}`); }
  const t1 = performance.now(); for (let f = 0; f < 120; f++) r.step(1 / 60); const per = (performance.now() - t1) / 120;
  ok(per < 6, `台 ${i}: 1フレームの 物理が おもい（${per.toFixed(2)}ms）`);
  ok(build < 3000, `台 ${i}: はじめの ならべが おそい（${build.toFixed(0)}ms）`);
}

// ---- 2. アーム: つよい ＋ よい ねらい → とれる・よわい → たいてい はずれる（3本アーム: ちいさな ぬいぐるみの 山 3台） ----
for (const i of [0, 8, 9]) {
  let strong = 0, weak = 0; const tries = 6;
  for (let k = 0; k < tries; k++) { if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: true }), k).got.length) strong++; if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: false }), k).got.length) weak++; }
  ok(strong >= 2, `3本アーム ${i}: つよい アームで ねらっても とれない（${strong}/${tries}）`);
  ok(weak <= 2 && weak < strong, `3本アーム ${i}: よわい アームで とれすぎる（${weak}/${tries}）`);
}
{
  // まったく ちがう ところ（おくの すみ）では とれない
  const r = new CM.CraneRound(0, null, { seed: 5, strong: true }); r.rig.load({ x: 54, z: 42 }); r.press(); for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60);
  ok(r.done, "3本アーム: あそびが おわらない");
  // 30びょう たつと じぶんで おりる
  const t = new CM.CraneRound(0, null, { seed: 5 }); for (let f = 0; f < 60 * 31; f++) t.step(1 / 60); ok(t.phase !== "move" && t.time === 0, "30びょうで アームが おりない");
}
// 2本アーム（大きい ぬいぐるみ: ごじ・くま）: つよい アームなら どこかで とれる
for (const i of [1, 10]) { let w = 0; for (const [dx, dz] of [[0, 0], [0, 4], [0, -4], [4, 0], [-4, 0]]) if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: true }), 0, dx, dz).got.length) w++; ok(w >= 1, `2本アーム ${i}: つよい アームでも とれない`); }

// ---- 3. リングフック: リングに かければ とれる（アームの つよさは かんけい ない）・はずせば とれない ----
for (const i of [6, 7, 11]) {
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

// ---- 6. セーブ: board() から おなじ 台に もどる・つづきから（おりる とちゅう → もういちど おろす）・ほかの 台の ようすは つかわない ----
for (let i = 0; i < 12; i++) {
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
  const sw = new CM.CraneRound(2, null, { seed: 4 }); sw.scoops = 2; sw.got = [99]; sw.gotShapes = ["mini_goji"]; const cp4 = sw.snap(), sw2 = new CM.CraneRound(2, cp4.board, { seed: 4, cp: cp4 }); ok(sw2.scoops === 2 && sw2.got.length === 1 && sw2.gotShapes[0] === "mini_goji", "つづきから: スウィートの のこりと とれた かず・形");
  // 台の id: ちがう 台の ようすは すてる（はじめから）・id の ない ふるい ようすは まえと おなじ 台（legacy）だけ つかう
  const a0 = new CM.CraneRound(0, null, { seed: 4 }), bd0 = a0.board(); ok(bd0.id === "chibi-wanko", "台の ようすに id が ない");
  const other = new CM.CraneRound(8, JSON.parse(JSON.stringify(bd0)), { seed: 4 }); ok(other.list().every((b) => b.data.shape.startsWith("chibi_gachan")), "ほかの 台の ようすを つかった");
  const oldStar = { v: 1, n: 3, b: [[1, "star", 30, 3, 20, 1, 0, 0, 0]], s: { x: 8.5, z: 8.5 } }; ok(new CM.CraneRound(0, oldStar, { seed: 4 }).list().every((b) => b.data.shape !== "star"), "いれかわった 台に ふるい 景品（ほしの クッション）が のこる");
  const g1 = new CM.CraneRound(1, null, { seed: 4 }).board(); delete g1.id; const g1b = new CM.CraneRound(1, g1, { seed: 4 }); ok(g1b.list().length === 1 && g1b.list()[0].data.shape === "goji", "まえと おなじ 台（ごじ）の ふるい ようすが つかえない");
}

// ---- 7. おなじ たね・おなじ そうさ → おなじ けっか ----
{
  const go = () => { const r = new CM.CraneRound(0, null, { seed: 21, strong: true }); return aimAndGrab(r, 1); };
  const a = go(), b = go(); ok(JSON.stringify(a.board()) === JSON.stringify(b.board()) && a.got.join() === b.got.join(), "おなじ たねで けっかが ちがう（ランダムが まじって いる）");
}

// ---- 8. PrizeArcade: 100コイン・ごほうびは 1かいだけ・天井・リングは いつも つよい・形ごとの 景品・コインと 上限・ふるい とちゅうの 1かい ----
{
  const S = R.Save; S.d = S.fresh(); S.d.coins = 1000; const back = { venue: "arcade", floor: 1, back: { map: "city", x: 12, y: 62 } }, empty = () => ({ v: 1, n: 1, b: [], s: {} });
  ok(S.d.arcade.boards && S.d.arcade.miss && S.d.arcade.got, "Save.fresh に クレーンの 台・はずれ・とれた かずが ない");
  const old = S.migrate({ ...S.fresh(), arcade: { active: null, settled: null, plays: 3, wins: 1 } }); ok(old.arcade.plays === 3 && old.arcade.boards && old.arcade.miss, "ふるい セーブに 台の ようすを たせない");
  const run = PA.start(0, back); ok(run && S.d.coins === 900 && S.d.arcade.active.id === run.id && run.def === "chibi-wanko", "100コインで はじまらない・台の id が ない");
  ok(PA.start(1, back) === null && S.d.coins === 900, "とちゅうの あいだに もう1台 はじめられる");
  const round = { got: [3, 7], gotShapes: ["chibi_wanko_2", "chibi_wanko_2"], board: () => ({ v: 1, id: "chibi-wanko", n: 9, b: [], s: {} }) };
  ok(PA.finish(run, round) && S.d.furn.ike_chibi_wanko_2 === 2 && !PA.finish(run, round) && S.d.furn.ike_chibi_wanko_2 === 2, "形ごとの ごほうびが 2かい もらえる／もらえない");
  ok(S.d.arcade.active === null && S.d.arcade.plays === 1 && S.d.arcade.miss[0] === 0 && S.d.arcade.boards[0], "おわりの セーブ");
  // 形の ない ふるい とちゅう（とれた ものの 形が わからない）は 台の だいひょうの 景品
  const r0 = PA.start(0, back); PA.finish(r0, { got: [1], board: empty }); ok(S.d.furn.ike_chibi_wanko_0 === 1, "形の ない ごほうび");
  // はずれが つづくと つよく なる（4かいで かならず）
  S.d.coins = 1000; for (let k = 0; k < 4; k++) { const rr = PA.start(0, back); PA.finish(rr, { got: [], board: empty }); }
  ok(S.d.arcade.miss[0] === 4 && PA.chance(0) === 1, "はずれ 4かいで かならず つよい アームに ならない");
  const lucky = PA.start(0, back); ok(lucky.strong === true, "天井で つよく ならない"); PA.finish(lucky, { got: [1], board: empty }); ok(S.d.arcade.miss[0] === 0, "とれたら はずれの かずが もどらない");
  S.d.coins = 5000;
  for (const i of [6, 11]) for (let k = 0; k < 3; k++) { const rr = PA.start(i, back); ok(rr.strong === true, "リングフックの アームが よわい"); PA.finish(rr, { got: [], board: empty }); }
  const mini = PA.start(2, back); PA.finish(mini, { got: [1, 2, 3], gotShapes: ["mini_goji", "mini_goji", "mini_wanko"], board: empty }); ok(S.d.furn.ike_mini_goji === 2 && S.d.furn.ike_mini_wanko === 1, "スウィートは おちた かずだけ（形ごと）");
  // コイン: メダルは 1まい 20・たからばこは 300。1にち 600 まで（たりない ときは はじまらない）
  const c0 = S.d.coins, medal = PA.start(3, back); PA.finish(medal, { got: [1, 2, 3], gotShapes: ["medal", "medal", "medal"], board: empty }); ok(S.d.coins === c0 - 100 + 60 && S.d.arcade.coinToday === 60, "コイン メダルの コイン");
  const chest = PA.start(7, back); PA.finish(chest, { got: [1], gotShapes: ["chest"], board: empty }); ok(S.d.coins === c0 - 200 + 360 && S.d.arcade.coinToday === 360 && !(S.d.bag.chest || S.d.furn.chest), "たからばこの コイン");
  ok(R.ArcadePrizes.coinLeft() === 240 && PA.start(7, back) === null && PA.coinOpen(3), "コインの 上限（300 のこって いない）");
  S.d.arcade.coinToday = 590; ok(PA.start(3, back) === null && !PA.coinOpen(3) && PA.coinOpen(0), "コインの 上限（20 のこって いない）");
  S.d.arcade.coinDay = "2000-01-01"; ok(R.ArcadePrizes.coinLeft() === 600, "つぎの 日に 上限が もどらない");
  // 台を いれかえる まえの とちゅうの 1かい: いれかわった 台は 100コインを かえす・おなじ 台（legacy）は つづきから
  S.d.coins = 500; S.d.arcade.active = { id: "old-0", machine: 0, back, strong: true, cp: null }; PA.norm(); ok(S.d.arcade.active === null && S.d.coins === 600 && S.d.arcade.refunded === 1, "いれかわった 台の とちゅうの 100コイン");
  PA.norm(); ok(S.d.coins === 600, "かえす のは 1かいだけ");
  S.d.arcade.active = { id: "old-1", machine: 1, back, strong: true, cp: null }; PA.norm(); ok(S.d.arcade.active && S.d.arcade.active.def === "goji-big" && S.d.coins === 600, "おなじ 台の とちゅうが きえる");
  S.d.arcade.active = null; S.d.coins = 50; ok(PA.start(0, back) === null && S.d.coins === 50, "コインが たりなくても はじまる");
}

// ---- 9. ことば（ひらがな中心・漢字なし）・SvgCache の キー ----
{
  const kanji = /[一-鿿]/;
  for (const [t, s] of Object.entries(PA.rules)) ok(!kanji.test(s) && s.length <= 110, `あそびかた（${t}）に 漢字／ながすぎる`);
  for (const m of PA.machines) ok(!kanji.test(m.name) && m.name.length <= 16 && !kanji.test(m.label) && m.label.length <= 10, `台の なまえ「${m.name}」「${m.label}」`);
  PA.machines.forEach((m, i) => { for (const id of PA.prizeList(i)) ok(!kanji.test(PA.item(id).name), `けいひんの なまえ「${PA.item(id).name}」に 漢字`); });
  for (const th of Object.values(CA.THEME)) ok(!kanji.test(th.sign), `かんばん「${th.sign}」に 漢字`);
  const keys = Object.keys(CA.TEX); ok(keys.length > 20 && keys.every((k) => /^[a-z]+(-[a-z0-9]+)+$/.test(k)), "テクスチャの キーは きまった なまえ だけ");
  for (const k of keys) { const s = CA.TEX[k](); ok(typeof s === "string" && s.startsWith("<svg") && !/undefined|NaN/.test(s), `テクスチャ ${k} の SVG`); }
  for (const d of CM.DEFS) { const th = CA.THEME[d.theme]; ok(th && CA.TEX[th.wall] && CA.TEX[th.floor], `台の テーマ ${d.theme}`); }
  for (const s of Object.keys(CM.SHAPES)) { const S = CM.SHAPES[s](); ok(Object.keys(CA.TEX).some((k) => k.startsWith(S.look + "-")), `景品 ${s} の 絵（${S.look}）が ない`); }
}
console.log(`Crane: 12 machines (claw/2-claw/sweet/tripod/ring), plush/coin prizes, physics outcomes, save/resume and machine ids, fees, rewards and coin cap, determinism, text — ${n} checks OK`);
