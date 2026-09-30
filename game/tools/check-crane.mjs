// クレーンゲーム（crane-physics.js・crane-machines.js・crane-scene.js・snack-art.js）の 検査。ブラウザ なしで 物理を うごかす。
// 17台（1F 12台・2F の おかし キャッチャー 5台）が こわれない・日がわりの けいひん（まいにち かわる・ぜんぶ でる・台の ようすは その日だけ）・ちゃんと ねらえば とれる・よわい アームは たいてい はずれる・トライポッド／スウィートランド／リング／コイン プッシャーの しくみ・
// セーブと つづきから（台の id・いれかわった 台の ふるい セーブ）・100コインと ごほうびは 1かいだけ・形ごとの 景品・コインの 景品と 1にちの 上限・
// おなじ たねは おなじ けっか・画面の ことば・SvgCache の キー。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { CraneMachines: CM, PrizeArcade: PA, CraneArt: CA } = R;
const DAY = "2026-9-30"; // 日がわりの 台は この日の ならびで しらべる（ほかの 台には かんけい ない）
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

// ---- 1. 17台（1F 12台・2F 5台）: 5しゅるい（コイン プッシャーは 1台）・こわれない・台の 中・おもすぎない ----
ok(PA.machines.length === 17 && CM.DEFS.length === 17, "クレーンは 17台");
for (const [t, min] of [["claw", 2], ["sweet", 1], ["tripod", 2], ["ring", 2], ["pusher", 1]]) ok(PA.machines.filter((m) => m.type === t).length >= min && CM.DEFS.filter((d) => d.type === t).length === PA.machines.filter((m) => m.type === t).length, `${t} は ${min}台 いじょう`);
ok(PA.machines.filter((m) => m.type === "pusher").length === 1 && PA.machines[3].type === "pusher" && CM.DEFS[3].id === "pusher", "コイン プッシャーは 台 3");
ok(new Set(CM.DEFS.map((d) => d.id)).size === 17 && PA.machines.every((m, i) => m.id === CM.DEFS[i].id), "台の id が ない・かさなる・PrizeArcade と ちがう");
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
for (let i = 0; i < CM.DEFS.length; i++) {
  const t0 = performance.now(), r = new CM.CraneRound(i, null, { seed: 11, day: DAY }), build = performance.now() - t0, M = r.def.box;
  ok(r.list().length >= 1, `台 ${i}: 景品が ない`);
  for (const p of r.W.P) if (!p.dead) ok(finite(p.x) && finite(p.y) && finite(p.z), `台 ${i}: 位置が NaN`);
  for (const b of r.list()) { const c = r.W.centroid(b); ok(c[0] > 0 && c[0] < M.w && c[2] > 0 && c[2] < M.d && c[1] > -1 && c[1] < M.h, `台 ${i}: 景品が 台の 外 ${c.map((v) => v.toFixed(1))}`); }
  const t1 = performance.now(); for (let f = 0; f < 120; f++) r.step(1 / 60); const per = (performance.now() - t1) / 120;
  ok(per < 6, `台 ${i}: 1フレームの 物理が おもい（${per.toFixed(2)}ms）`);
  ok(build < 3000, `台 ${i}: はじめの ならべが おそい（${build.toFixed(0)}ms）`);
}

// ---- 2. アーム: つよい ＋ よい ねらい → とれる・よわい → たいてい はずれる（3本アーム: ちいさな ぬいぐるみの 山 3台・おかしの ふくろ と はこ） ----
for (const i of [0, 8, 9, 12, 13]) {
  let strong = 0, weak = 0; const tries = 6;
  for (let k = 0; k < tries; k++) { if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: true, day: DAY }), k).got.length) strong++; if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: false, day: DAY }), k).got.length) weak++; }
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
// 2本アーム（大きい ぬいぐるみ: ごじ・くま・ビッグ おかしの ふくろ 3しゅ）: つよい アームなら どこかで とれる
for (const i of [1, 10]) { let w = 0; for (const [dx, dz] of [[0, 0], [0, 4], [0, -4], [4, 0], [-4, 0]]) if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: true }), 0, dx, dz).got.length) w++; ok(w >= 1, `2本アーム ${i}: つよい アームでも とれない`); }
for (const day of ["2026-9-30", "2026-10-1", "2026-10-2"]) { let w = 0; const sh = CM.lineup(CM.DEFS[16], day)[0]; for (const [dx, dz] of [[0, 0], [0, 4], [0, -4], [4, 0], [-4, 0]]) if (aimAndGrab(new CM.CraneRound(16, null, { seed: 5, strong: true, day }), 0, dx, dz).got.length) w++; ok(w >= 1, `ビッグ おかし（${sh}）: つよい アームでも とれない`); }

// ---- 3. リングフック: リングに かければ とれる（アームの つよさは かんけい ない）・はずせば とれない ----
for (const i of [6, 7, 11, 14]) {
  let w = 0; const k0 = new CM.CraneRound(i, null, { seed: 5, day: DAY }).list().length;
  for (let k = 0; k < k0; k++) if (aimAndGrab(new CM.CraneRound(i, null, { seed: 5, strong: false, day: DAY }), k).got.length) w++;
  ok(w >= Math.ceil(k0 / 2), `リング ${i}: リングに あわせても とれない（${w}/${k0}）`);
  const miss = aimAndGrab(new CM.CraneRound(i, null, { seed: 5, day: DAY }), 0, 9, 0);
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
for (const i of [2, 15]) {
  let board = null, total = 0, scooped = 0;
  for (let play = 0; play < 2; play++) {
    const r = new CM.CraneRound(i, board, { seed: 9, day: DAY }), o = r.rig.o;
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

// ---- 5b. コイン プッシャー: メダルが みえる・ただでは おちない・10まい いれる・てまえ = もらえる／よこ = おみせ・チャンスと スロット・つづきから ----
{
  const I = 3, F = CM.DEFS[I].field, cp = (r) => JSON.parse(JSON.stringify(r.snap()));
  const r0 = new CM.CraneRound(I, null, { seed: 7 }), n0 = r0.list().length;
  ok(n0 >= F.keep && n0 <= F.fill, `プッシャー: はじめの メダル ${n0}まい`);
  ok(r0.list().every((b) => b.data.slab && b.data.look === "medal"), "プッシャー: メダルに slab が ない（絵が かけない）");
  for (const b of r0.list()) { const c = r0.W.centroid(b), n = R.CranePhys.qrot(b.q, [0, 0, 1]); ok(c[0] > F.x0 - 1 && c[0] < F.x1 + 1 && c[2] > F.ze && c[1] > F.top && c[1] < F.top + 12, `プッシャー: メダルが フィールドの 外 ${c.map((v) => v.toFixed(1))}`); ok(Math.abs(n[1]) > 0.6 || c[1] > F.top + 2.5, "プッシャー: メダルが たって いる"); }
  // なにも いれないと おちない（おみせの 人が じゅんび ずみ）
  { const r = new CM.CraneRound(I, null, { seed: 7 }); r.left = 0; for (let f = 0; f < 60 * 12 && !r.done; f++) r.step(1 / 60); ok(r.done && r.got.length <= 1 && r.lost <= 1, `プッシャー: なにも いれないのに ${r.got.length}まい おちた`); }
  // 10まい いれる（まを あけないと いれられない）・11まいめは ない
  { const r = new CM.CraneRound(I, null, { seed: 7 }); r.rig.lx = 30; ok(r.press() === "drop" && r.press() === null && r.left === F.medals - 1, "プッシャー: つづけて 2まい はいる／はいらない");
    let n = 1; for (let f = 0; f < 60 * 30 && n < F.medals; f++) { if (r.press() === "drop") n++; r.step(1 / 60); }
    ok(n === F.medals && r.left === 0 && r.press() === null, "プッシャー: 10まい いれられない／11まい はいる");
    for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60); ok(r.done, "プッシャー: おわらない"); }
  // てまえの ふちの むこう → もらえる・よこの あな → おみせの もの（かぞえるのは 1かいだけ）
  { const r = new CM.CraneRound(I, null, { seed: 7 }), g0 = r.got.length; r.add("medal", [30, F.top + 1.5, F.ze - 2], r.flat()); r.add("medal", [F.x0 - 3, F.top + 1.5, F.ze + 4], r.flat());
    for (let f = 0; f < 60; f++) r.step(1 / 60);
    ok(r.got.length === g0 + 1 && r.lost === 1 && r.gotShapes.every((s) => s === "medal"), `プッシャー: てまえ／よこの かぞえかた got ${r.got.length} lost ${r.lost}`);
    ok(r.list().every((b) => !b.data.fell) && r.board().b.every((e) => e[4] > F.top - 1), "プッシャー: おちた メダルが のこる／セーブに はいる"); }
  // チャンスの わ: ま上から おとすと スロット → 2.3びょうで けっか・メダルが ふる
  { const r = new CM.CraneRound(I, null, { seed: 7 }), R0 = r.rig; R0.hold = true; R0.lx = Math.max(F.lim[0], Math.min(F.lim[1], R0.gateX())); const gx = R0.gateX(); r.press();
    for (let f = 0; f < 30; f++) { r.step(1 / 60); R0.hold = true; }
    ok(Math.abs(gx - R0.lx) < F.gateR && r.hits === 1 && r.slot, "プッシャー: わの ま上から おとしても チャンスに ならない");
    const n = r.list().length, res = r.slot.res, win = r.slot.win; R0.hold = false;
    for (let f = 0; f < 60 * 4; f++) r.step(1 / 60);
    ok(r.slot === null || r.slot.paid, "プッシャー: スロットが とまらない");
    ok(win === (new Set(res).size === 1 ? F.bonus.big : new Set(res).size === 2 ? F.bonus.small : 0), `プッシャー: スロットの め ${res} と メダル ${win}`);
    ok(r.list().length + r.got.length + r.lost >= n + win, "プッシャー: スロットの メダルが ふらない"); }
  { // わから はなれて おとすと チャンスに ならない
    const r = new CM.CraneRound(I, null, { seed: 7 }), R0 = r.rig; R0.hold = true; const gx = R0.gateX(); R0.lx = gx < 30 ? F.lim[1] : F.lim[0]; r.press(); for (let f = 0; f < 30; f++) { r.step(1 / 60); R0.hold = true; } ok(r.hits === 0 && !r.slot, "プッシャー: わから はなれても チャンス"); }
  // スロットの でかた（きまった たねで 400かい）: そろう 1/8・2つ 1/4 くらい・メダルの かず
  { const r = new CM.CraneRound(I, null, { seed: 9 }); let big = 0, small = 0; for (let k = 0; k < 400; k++) { r.slot = null; r.queue = 0; r.chance(); const S = r.slot, u = new Set(S.res).size; ok(S.res.every((v) => v >= 0 && v < 3) && S.win === (u === 1 ? F.bonus.big : u === 2 ? F.bonus.small : 0), "プッシャー: スロットの め"); if (u === 1) big++; else if (u === 2) small++; }
    ok(big > 25 && big < 80 && small > 65 && small < 140, `プッシャー: スロットの でかた big ${big} small ${small}`);
    r.slot = { t: 0, res: [0, 1, 2], win: 0, paid: false }; r.queue = 0; r.chance(); r.chance(); r.chance(); ok(r.queue === 2, "プッシャー: まつ チャンスは 2つまで"); }
  // あそびを 8かい（ボット: ばらばらの ばしょ・タイミング）: 100コインあたり だいたい 40〜140コイン・よこの あなにも おちる・メダルの かずが ふえすぎない
  { let board = null, got = 0, lost = 0; const rnd = CM.rng(77);
    for (let p = 0; p < 8; p++) { const r = new CM.CraneRound(I, board, { seed: 50 + p }); let wait = 0;
      for (let f = 0; f < 60 * 90 && !r.done; f++) { if (r.phase === "play" && r.left > 0 && wait-- <= 0) { r.rig.lx = F.lim[0] + rnd() * (F.lim[1] - F.lim[0]); r.press(); wait = 25 + Math.floor(rnd() * 70); } r.step(1 / 60); }
      ok(r.done, "プッシャー: ボットの あそびが おわらない"); got += r.got.length; lost += r.lost; board = JSON.parse(JSON.stringify(r.board())); ok(board.b.length >= 15 && board.b.length <= 60, `プッシャー: フィールドの メダル ${board.b.length}まい`); }
    ok(got >= 8 * 4 && got <= 8 * 14 && lost >= 1, `プッシャー: 8かいで ${got}まい（よこ ${lost}まい）`); }
  // つづきから: のこりの メダル・とれた かず・おちて いる とちゅうの メダルは のこりに もどる
  { const r = new CM.CraneRound(I, null, { seed: 7 }); r.rig.lx = 20; r.press(); r.step(1 / 60); r.got = [5, 6]; r.gotShapes = ["medal", "medal"]; const c1 = cp(r), again = new CM.CraneRound(I, c1.board, { seed: 7, cp: c1 });
    ok(c1.left === F.medals && again.left === F.medals && again.got.length === 2 && again.phase === "play", `つづきから: プッシャーの のこり ${c1.left}・とれた かず`);
    r.shower = 3; const c2 = cp(r), b2 = new CM.CraneRound(I, c2.board, { seed: 7, cp: c2 }); ok(b2.shower === 3, "つづきから: スロットの メダル"); }
  // おなじ たね・おなじ そうさ → おなじ けっか
  { const go = () => { const r = new CM.CraneRound(I, null, { seed: 12 }); let k = 0; for (let f = 0; f < 60 * 60 && !r.done; f++) { if (f % 40 === 0 && r.left > 0) { r.rig.lx = 14 + (k++ * 7) % 34; r.press(); } r.step(1 / 60); } return r; };
    const a = go(), b = go(); ok(a.got.join() === b.got.join() && a.lost === b.lost && JSON.stringify(a.board()) === JSON.stringify(b.board()), "プッシャー: おなじ たねで けっかが ちがう"); }
}

// ---- 6. セーブ: board() から おなじ 台に もどる・つづきから（おりる とちゅう → もういちど おろす）・ほかの 台の ようすは つかわない ----
for (let i = 0; i < CM.DEFS.length; i++) {
  const a = new CM.CraneRound(i, null, { seed: 4, day: DAY }), bd = JSON.parse(JSON.stringify(a.board())), b = new CM.CraneRound(i, bd, { seed: 4, day: DAY });
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

// ---- 6b. 2F の おかし キャッチャー: 日がわりの けいひん（pool から pick しゅ）・台の ようすは その日だけ・とちゅうの 1かいは はじめた 日の まま ----
{
  const days = Array.from({ length: 400 }, (_, n) => { const t = new Date(Date.UTC(2026, 8, 1) + n * 86400000); return `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`; });
  const daily = CM.DEFS.map((d, i) => [d, i]).filter(([d]) => d.pool);
  ok(daily.length === 5 && daily.every(([d, i]) => i >= 12 && PA.machines[i].daily), "日がわりの 台は 2F の 5台");
  ok(CM.DEFS.slice(0, 12).every((d) => !d.pool) && PA.machines.slice(0, 12).every((m) => !m.daily), "1F の 台は 日がわりに しない（この PR では）");
  const all = new Set();
  for (const [d, i] of daily) {
    const seen = new Set(); let prev = null, same = 0;
    for (const day of days) { const a = CM.lineup(d, day); ok(a.length === Math.min(d.pick, d.pool.length) && new Set(a).size === a.length && a.every((sh) => d.pool.includes(sh)), `${d.id}: ${day} の ならび ${a}`); if (prev && a.every((sh) => prev.includes(sh))) same++; prev = a; a.forEach((sh) => seen.add(sh)); }
    ok(same === 0, `${d.id}: つづけて おなじ ならびの 日が ${same}日`);
    ok(seen.size === d.pool.length, `${d.id}: 400日で でない けいひんが ある`);
    for (let k = 0; k + d.pool.length <= 60; k += 7) { const s = new Set(); for (let j = 0; j < d.pool.length; j++) CM.lineup(d, days[k + j]).forEach((sh) => s.add(sh)); ok(s.size === d.pool.length, `${d.id}: ${d.pool.length}日で ぜんぶ でない`); }
    ok(JSON.stringify(CM.lineup(d, DAY)) === JSON.stringify(CM.lineup(d, DAY)) && JSON.stringify(PA.prizeList(i, DAY)) === JSON.stringify(CM.lineup(d, DAY).map((sh) => CM.SHAPES[sh]().prize)), `${d.id}: おなじ 日で ならびが ちがう`);
    d.pool.forEach((sh) => all.add(sh));
    // 台の ようす: おなじ 日は つかう・つぎの 日は はじめから（その日の ならび）・とちゅうの 1かいは はじめた 日の まま
    const r = new CM.CraneRound(i, null, { seed: 3, day: DAY }), bd = JSON.parse(JSON.stringify(r.board())), next = days[days.indexOf("2026-10-1")];
    ok(bd.day === DAY && bd.id === d.id, `${d.id}: 台の ようすに 日が ない`);
    const same2 = new CM.CraneRound(i, bd, { day: DAY }); ok(same2.sid === bd.n && same2.list().length === r.list().length, `${d.id}: おなじ 日の 台の ようすを つかわない`);
    const r2 = new CM.CraneRound(i, bd, { day: next }), want = CM.lineup(d, next);
    ok(r2.day === next && JSON.stringify(r2.mix) === JSON.stringify(want) && r2.list().every((b) => want.includes(b.data.shape)), `${d.id}: つぎの 日に きのうの けいひんが のこる`);
    const cp = JSON.parse(JSON.stringify(r.snap())), r3 = new CM.CraneRound(i, cp.board, { cp, day: next });
    ok(cp.day === DAY && r3.day === DAY && JSON.stringify(r3.mix) === JSON.stringify(CM.lineup(d, DAY)) && r3.list().length === r.list().length, `${d.id}: とちゅうの 1かいが つぎの 日に かわる`);
  }
  // けいひんは おかし 23しゅ（たべもの・絵・テクスチャ）。どの おかしも どこかの 台に でる
  const snacks = R.SnackArt.ITEMS;
  ok(snacks.length === 23 && all.size === snacks.length && snacks.every((it) => all.has("snack_" + it.key)), `おかしの けいひん ${snacks.length}しゅ・台に でない おかし`);
  for (const it of snacks) {
    const f = R.BAG_INDEX[it.id]; ok(f && f.kind === "food" && f.rare && f.exclusive === "ikebukuro" && f.hunger > 0 && f.mood > 0 && !/[一-鿿]/.test(f.name + f.desc) && f.name.length <= 14, `おかし ${it.id} の たべもの`);
    ok(/^<svg /.test(R.Art.iconSvg("bag", it.id)) && /<(path|rect|circle)\b/.test(R.FOOD_ART[it.id]) && !/undefined|NaN/.test(R.FOOD_ART[it.id]), `おかし ${it.id} の もちものの 絵`);
    const S = CM.SHAPES["snack_" + it.key](); ok(S.prize === it.id && (S.slab || S.box || S.art), `おかし ${it.id} の かたち`);
    for (const face of S.slab ? ["front", "back", "side", "rim"] : S.box ? ["front", "back", "side", "top"] : ["front", "back"]) ok(CA.TEX[S.look + "-" + face] && CA.SIZE[S.look + "-" + face], `おかし ${it.id} の テクスチャ ${face}`);
    ok(!/ id="/.test(CA.TEX[S.look + "-front"]().replace(/href="[^"]*"/g, "")), `おかし ${it.id} の 絵に id（ほかの 絵と ぶつかる）`);
  }
  ok(new Set(snacks.map((it) => it.name)).size === snacks.length, "おなじ なまえの おかし");
  // とれた おかしは もちもの（たべもの）に はいる・かず は 形ごと
  const S = R.Save; S.d = S.fresh(); S.d.coins = 1000; const back = { venue: "arcade", floor: 2, back: { map: "city", x: 12, y: 62 } };
  const run = PA.start(12, back), sh = CM.lineup(CM.DEFS[12])[0], id = CM.SHAPES[sh]().prize;
  ok(run && PA.finish(run, { got: [1, 2], gotShapes: [sh, sh], board: () => ({ v: 1, id: "snack-bag", n: 3, b: [], s: {}, day: CM.today() }) }) && S.d.bag[id] === 2 && !S.d.furn[id], `おかしが もちものに はいらない（${id}）`);
  ok(PA.picture(12, { got: [1], gotShapes: [sh] }) === id && /<svg/.test(PA.pictureSvg(id)), "けっかの まどの おかしの 絵");
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
  // コイン: プッシャーの メダルは 1まい 10・たからばこは 300。1にち 600 まで（たりない ときは はじまらない・こえた ぶんは もらえない）
  const c0 = S.d.coins, medal = PA.start(3, back); PA.finish(medal, { got: [1, 2, 3, 4, 5, 6], gotShapes: Array(6).fill("medal"), board: empty }); ok(S.d.coins === c0 - 100 + 60 && S.d.arcade.coinToday === 60 && medal.paid === 60 && medal.capped === 0, "コイン プッシャーの コイン");
  const chest = PA.start(7, back); PA.finish(chest, { got: [1], gotShapes: ["chest"], board: empty }); ok(S.d.coins === c0 - 200 + 360 && S.d.arcade.coinToday === 360 && !(S.d.bag.chest || S.d.furn.chest), "たからばこの コイン");
  ok(R.ArcadePrizes.coinLeft() === 240 && PA.start(7, back) === null && PA.coinOpen(3), "コインの 上限（300 のこって いない）");
  S.d.arcade.coinToday = 450; { const c1 = S.d.coins, lucky = PA.start(3, back); PA.finish(lucky, { got: Array.from({ length: 20 }, (_, k) => k), gotShapes: Array(20).fill("medal"), board: empty }); ok(lucky.paid === 150 && lucky.capped === 50 && S.d.coins === c1 - 100 + 150 && S.d.arcade.coinToday === 600, "コインの 上限を こえて もらえる"); }
  S.d.arcade.coinToday = 510; ok(PA.start(3, back) === null && !PA.coinOpen(3) && PA.coinOpen(0), "コインの 上限（プッシャーは 100 のこって いない と あそべない）");
  S.d.arcade.coinDay = "2000-01-01"; ok(R.ArcadePrizes.coinLeft() === 600, "つぎの 日に 上限が もどらない");
  // 台を いれかえる まえの とちゅうの 1かい: いれかわった 台は 100コインを かえす・おなじ 台（legacy）は つづきから
  S.d.coins = 500; S.d.arcade.active = { id: "old-0", machine: 0, back, strong: true, cp: null }; PA.norm(); ok(S.d.arcade.active === null && S.d.coins === 600 && S.d.arcade.refunded === 1, "いれかわった 台の とちゅうの 100コイン");
  PA.norm(); ok(S.d.coins === 600, "かえす のは 1かいだけ");
  S.d.arcade.active = { id: "old-1", machine: 1, back, strong: true, cp: null }; PA.norm(); ok(S.d.arcade.active && S.d.arcade.active.def === "goji-big" && S.d.coins === 600, "おなじ 台の とちゅうが きえる");
  // まえの コイン メダル（台 3）の とちゅう: 台が プッシャーに かわったので 100コインを かえす
  S.d.arcade.active = { id: "old-3", machine: 3, def: "medal", back, strong: true, cp: null }; S.d.arcade.refunded = 0; PA.norm(); ok(S.d.arcade.active === null && S.d.coins === 700 && S.d.arcade.refunded === 1, "コイン メダルの とちゅうの 100コイン");
  S.d.arcade.active = { id: "new-3", machine: 3, def: "pusher", back, strong: true, cp: null }; PA.norm(); ok(S.d.arcade.active && S.d.coins === 700, "プッシャーの とちゅうが きえる");
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
console.log(`Crane: 17 machines (claw/2-claw/sweet/tripod/ring/coin pusher; 5 daily snack catchers on 2F), plush/coin/snack prizes, daily lineups, physics outcomes, pusher medals/chance/slot/payout, save/resume and machine ids, fees, rewards and coin cap, determinism, text — ${n} checks OK`);
