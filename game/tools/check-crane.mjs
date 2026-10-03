// クレーンゲーム（crane-physics.js・crane-machines.js・crane-scene.js・snack-art.js・bridge-prizes.js）の 検査。ブラウザ なしで 物理を うごかす。
// 21台（1F 12台・2F の おかし キャッチャー 5台・はしわたし 2台・3F の ぼうで おす 台と おかし タワー）が こわれない・日がわりの けいひん（1F 7台・2F 7台。まいにち かわる・ぜんぶ でる・台の ようすは その日だけ・keep の 台は とれるまで そのまま）・1F の けいひん 54しゅ（UI-16 で 36しゅ ふえた）・ちゃんと ねらえば とれる・よわい アームは たいてい はずれる・トライポッド／スウィートランド／リング／コイン プッシャー／はしわたしの しくみ・
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

// ---- 1. 21台（1F 12台・2F 7台・3F 2台）: 7しゅるい（コイン プッシャーは 1台）・こわれない・台の 中・おもすぎない ----
ok(PA.machines.length === 21 && CM.DEFS.length === 21, "クレーンは 21台");
for (const [t, min] of [["claw", 2], ["sweet", 1], ["tripod", 2], ["ring", 2], ["pusher", 1], ["bridge", 2], ["road", 1]]) ok(PA.machines.filter((m) => m.type === t).length >= min && CM.DEFS.filter((d) => d.type === t).length === PA.machines.filter((m) => m.type === t).length, `${t} は ${min}台 いじょう`);
ok(PA.machines.filter((m) => m.type === "pusher").length === 1 && PA.machines[3].type === "pusher" && CM.DEFS[3].id === "pusher", "コイン プッシャーは 台 3");
ok(new Set(CM.DEFS.map((d) => d.id)).size === 21 && PA.machines.every((m, i) => m.id === CM.DEFS[i].id), "台の id が ない・かさなる・PrizeArcade と ちがう");
ok([1, 4, 6].every((i) => CM.DEFS[i].legacy && PA.machines[i].legacy) && CM.DEFS.filter((d) => d.legacy).length === 3, "まえの 8台と おなじ 台は 1・4・6");
PA.machines.forEach((m, i) => {
  ok(CM.DEFS[i].type === m.type, `台 ${i}: PrizeArcade と CraneMachines の しゅるいが ちがう`); ok(m.qty >= 1, `台 ${i}: qty`);
  const list = PA.prizeList(i); ok(m.coins > 0 ? !m.prize : list.length >= 1 && list.every((id) => R.FURN_INDEX[id] || R.BAG_INDEX[id]), `台 ${i}: けいひん ${list} が ない`);
  if (m.mix) ok(list.length === m.mix && new Set(list).size === m.mix, `台 ${i}: まぜた 景品の しゅるい`);
});
// 景品: 3人の ぬいぐるみ（表情・ポーズ・こもの ちがい 4しゅずつ）・ミニマスコット・町の人・コイン
{
  const plush = R.ArcadePrizes.ITEMS; ok(plush.length === 54 && plush.filter((it) => it.size === "chibi").length === 24 && plush.filter((it) => it.size === "mini").length === 10 && plush.filter((it) => it.group).length === 20, "景品の かず（3人の ぬいぐるみ 24・ミニマスコット 10・町の人 20）");
  for (const who of ["wanko", "gachan", "goji"]) { const v = plush.filter((it) => it.spec.who === who && it.size === "chibi"); ok(v.length === 8 && new Set(v.map((it) => it.spec.face)).size >= 5 && new Set(v.map((it) => it.spec.pose)).size >= 4 && new Set(v.map((it) => it.spec.face + it.spec.pose + JSON.stringify(it.spec.outfit))).size === 8 && new Set(v.map((it) => it.word)).size === 8, `${who}: 8しゅ・表情 5しゅ・ポーズ 4しゅ いじょう・おなじ ものが ない`); }
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

// ---- 6b. 日がわりの 台（1F 7台・2F 7台）: けいひんは pool から pick しゅ・台の ようすは その日だけ（keep の 台は とれるまで そのまま）・とちゅうの 1かいは はじめた 日の まま ----
{
  const days = Array.from({ length: 400 }, (_, n) => { const t = new Date(Date.UTC(2026, 8, 1) + n * 86400000); return `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`; });
  const daily = CM.DEFS.map((d, i) => [d, i]).filter(([d]) => d.pool);
  const F1 = [0, 2, 5, 8, 9, 10, 11];
  ok(daily.length === 16 && daily.every(([d, i]) => (i >= 12 || F1.includes(i)) && PA.machines[i].daily) && PA.machines.filter((m) => m.daily).length === 16, "日がわりの 台は 1F の 7台・2F の 7台（おかし 5・はしわたし 2）・3F の 2台");
  ok([1, 3, 4, 6, 7].every((i) => !CM.DEFS[i].pool && !PA.machines[i].daily), "1F の legacy の 3台（ごじ・わんこ・がちゃん）と コインの 2台は 日がわりに しない");
  ok(JSON.stringify(F1.map((i) => [CM.DEFS[i].pool.length, CM.DEFS[i].pick])) === JSON.stringify([[8, 4], [10, 3], [6, 1], [8, 4], [8, 4], [9, 1], [5, 3]]), "1F の 日がわりの かず（3人 8→4・ミニ 10→3・どうぶつえん 6→1・ビッグ 9→1・みずべ 5→3）");
  ok(CM.DEFS.filter((d) => d.keep).map((d) => d.id).join() === "panda-big,hashi-fig,hashi-goods", "keep の 台は トライポッドの どうぶつえん と はしわたし 2台");
  for (const [d, i] of daily) if (PA.machines[i].mix) ok(PA.machines[i].mix === Math.min(d.pick, d.pool.length), `${d.id}: mix と pick が ちがう`);
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
    if (d.keep) {
      // keep の 台: きのうの けいひんが のこって いれば とれるまで きのうの ならび（台の ようすも そのまま）・とれた あとは きょうの ならび
      ok(r2.day === DAY && JSON.stringify(r2.mix) === JSON.stringify(CM.lineup(d, DAY)) && r2.sid === bd.n && r2.list().length === r.list().length, `${d.id}: つぎの 日に とちゅうの けいひんが きえる`);
      const won = new CM.CraneRound(i, { ...bd, b: [] }, { day: next });
      ok(won.day === next && JSON.stringify(won.mix) === JSON.stringify(want) && won.list().length >= 1 && won.list().every((b) => want.includes(b.data.shape)), `${d.id}: とれた つぎの 日も きのうの けいひん`);
      ok(new CM.CraneRound(i, { ...bd, b: [] }, { day: DAY }).list().length >= 1, `${d.id}: とれた あと あたらしい けいひんが のらない`);
    // （おかし タワーの ペラわの はこ pera_<おかし> は tower_<おかし> と おなじ けいひん）
    } else ok(r2.day === next && JSON.stringify(r2.mix) === JSON.stringify(want) && r2.list().every((b) => want.includes(b.data.shape.replace(/^pera_/, "tower_"))), `${d.id}: つぎの 日に きのうの けいひんが のこる`);
    const cp = JSON.parse(JSON.stringify(r.snap())), r3 = new CM.CraneRound(i, cp.board, { cp, day: next });
    ok(cp.day === DAY && r3.day === DAY && JSON.stringify(r3.mix) === JSON.stringify(CM.lineup(d, DAY)) && r3.list().length === r.list().length, `${d.id}: とちゅうの 1かいが つぎの 日に かわる`);
  }
  // けいひんは おかし 23しゅ（たべもの・絵・テクスチャ）。どの おかしも どこかの 台に でる
  const snacks = R.SnackArt.ITEMS;
  ok(snacks.length === 23 && [...all].filter((sh) => sh.startsWith("snack_")).length === snacks.length && snacks.every((it) => all.has("snack_" + it.key)), `おかしの けいひん ${snacks.length}しゅ・台に でない おかし`);
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

// ---- 6d. 1F の けいひん（UI-16）: 3人の ぬいぐるみ 12しゅ・ミニマスコット 7しゅ・ビッグ 8しゅ・どうぶつえん 5しゅ・みずべの なかま 4しゅ（36しゅ）・
// 1F の 日がわりの 台で とれる・トライポッドは とれた あと アームが もどる・keep の 台は とちゅうの けいひんが のこる・台の せつめい ----
{
  const A = R.ArcadePrizes, items = A.ITEMS, kanji = /[一-鿿]/, F1 = [0, 2, 5, 8, 9, 10, 11];
  const added = items.filter((it) => (it.size === "chibi" && +it.id.slice(-1) >= 4) || (it.size === "mini" && it.spec.sp) || (it.group && !["bear", "panda", "penguin"].includes(it.spec.sp)));
  ok(added.length === 36 && added.filter((it) => it.size === "chibi").length === 12 && added.filter((it) => it.size === "mini").length === 7 && ["big", "zoo", "water"].map((g) => added.filter((it) => it.group === g).length).join() === "8,5,4", `ふえた けいひん ${added.length}しゅ`);
  ok(new Set(items.map((it) => it.id)).size === items.length && new Set(items.map((it) => it.name)).size === items.length && new Set(items.map((it) => it.look)).size === items.length && new Set(items.map((it) => it.shape)).size === items.length, "id・なまえ・look・形が かさなる");
  // まえからの 景品は id・look・形の なまえが そのまま（ふるい セーブの 台の ようす・もって いる 家具が つかえる）
  ok(["ike_chibi_wanko_0", "ike_chibi_goji_3", "ike_mini_gachan", "ike_plush_bear", "ike_plush_panda", "ike_plush_penguin"].every((id) => A.INDEX[id]) && A.INDEX.ike_plush_bear.shape === "bearBig" && A.INDEX.ike_plush_panda.shape === "pandaBig" && A.INDEX.ike_plush_penguin.shape === "penguinRing" && A.INDEX.ike_plush_penguin.look === "penguin" && A.INDEX.ike_mini_wanko.shape === "mini_wanko" && A.INDEX.ike_chibi_gachan_2.shape === "chibi_gachan_2", "まえからの 景品の なまえが かわった");
  const pools = new Set(F1.flatMap((i) => CM.DEFS[i].pool));
  ok(items.every((it) => pools.has(it.shape)) && [...pools].every((sh) => CM.SHAPES[sh] && A.INDEX[CM.SHAPES[sh]().prize]), "1F の 日がわりの 台に でない けいひん・台に けいひんで ない もの");
  for (const it of items) {
    ok(!kanji.test(it.name + it.desc + it.series + it.word) && it.name.length <= 19 && it.word.length <= 7, `${it.id}: なまえ「${it.name}」`);
    const S = CM.SHAPES[it.shape](); ok(S.prize === it.id && S.look === it.look && S.art.length === 4 && S.art.every(Number.isFinite) && S.art[2] > 0 && S.art[3] > 0, `${it.id}: 形`);
    for (const f of ["front", "back"]) ok(CA.TEX[it.look + "-" + f] && CA.SIZE[it.look + "-" + f].every((v) => v >= 32 && v <= 256), `${it.id}: テクスチャ ${f}`);
    ok(!("sparkle" in R.FURN_INDEX[it.id]) && R.FURN_INDEX[it.id].exclusive === "ikebukuro", `${it.id}: 家具（レアでも へやで ほしは ださない・UI-50）`);
  }
  // 絵の id は ほかの けいひんと かさならない（おなじ 画面に ならべても 絵が かけない）
  { const owner = new Map(); let clash = 0; for (const it of items) for (const m of A.svg(it.id).matchAll(/ id="([^"]+)"/g)) { if (owner.has(m[1]) && owner.get(m[1]) !== it.id) clash++; owner.set(m[1], it.id); } ok(clash === 0, `けいひんの 絵の id が かさなる（${clash}）`); }
  // おなじ 台の なかまは 物理が おなじ（絵と けいひんだけ ちがう）→ どの 日も おなじ むずかしさ
  const partsOf = (sh) => JSON.stringify(CM.SHAPES[sh]().parts);
  for (const i of F1) { const P = CM.DEFS[i].pool; ok(P.every((sh) => partsOf(sh) === partsOf(P[0])), `台 ${i}: なかまの 物理の 形が ちがう`); }
  // 絵の 大きさと 足もと: 町の人は さいしょの 1しゅと おなじ ちぢみで 足もとが そろう・3人は ポーズで すこし ちがう
  for (const g of ["big", "zoo", "water"]) {
    const list = items.filter((it) => it.group === g), b0 = CM.SHAPES[list[0].shape]().art, foot = b0[1] - b0[3] / 2;
    for (const it of list) { const a = CM.SHAPES[it.shape]().art; ok(Math.abs(a[1] - a[3] / 2 - foot) < 1.2 && a[3] > b0[3] * 0.85 && a[3] < b0[3] * 1.35 && a[2] < b0[2] * 1.4 && Math.abs(a[0]) < 3, `${it.id}: 絵の 大きさ・足もと ${a.map((v) => v.toFixed(1))}`); }
  }
  for (const who of ["wanko", "gachan", "goji"]) { const b0 = CM.SHAPES[`chibi_${who}_0`]().art; for (let v = 4; v < 8; v++) { const a = CM.SHAPES[`chibi_${who}_${v}`]().art; ok(a[3] > b0[3] * 0.8 && a[3] < b0[3] * 1.3 && a[2] < b0[2] * 1.35 && Math.abs(a[0]) < 2.5, `chibi_${who}_${v}: 絵の 大きさ ${a.map((q) => q.toFixed(1))}`); } }
  // 1F の 日がわりの 台は どの 日も とれる（日で たねが かわる ので 3日ぶん。つよい アームで ねらう・リングに かける・アームを ぜんぶ おとす・すくって おとす）
  const perfectTripod = (i, board, o) => { const r = new CM.CraneRound(i, board, o); for (let f = 0; f < 60 * 40 && !r.done; f++) { if (r.phase === "spin") { const a = r.rig.armAt(r.rig.cell()); if (a && a.up && r.rig.light % 1 > 0.45) r.press(); } r.step(1 / 60); } return r; };
  // 3本アームの 山は たねで とりやすさが かわる（まえからの きまった たねでも 6こ中 1〜4こ）→ どの 日も 1こ いじょう・へいきん 2こ いじょう
  let claws = 0, clawN = 0;
  for (const day of ["2026-10-1", "2026-10-2", "2026-10-3"]) {
    for (const i of [0, 8, 9]) { let w = 0; for (let k = 0; k < 6; k++) if (aimAndGrab(new CM.CraneRound(i, null, { strong: true, day }), k).got.length) w++; ok(w >= 1, `3本アーム ${i}（${day}）: つよい アームで ねらっても とれない（${w}/6）`); claws += w; clawN++; }
    { let w = 0; for (const [dx, dz] of [[0, 0], [0, 4], [0, -4], [4, 0], [-4, 0]]) if (aimAndGrab(new CM.CraneRound(10, null, { strong: true, day }), 0, dx, dz).got.length) w++; ok(w >= 1, `ビッグ ぬいぐるみ（${day}・${CM.lineup(CM.DEFS[10], day)}）: つよい アームでも とれない`); }
    { const k0 = new CM.CraneRound(11, null, { day }).list().length; let w = 0; for (let k = 0; k < k0; k++) if (aimAndGrab(new CM.CraneRound(11, null, { strong: false, day }), k).got.length) w++; ok(w >= Math.ceil(k0 / 2), `みずべの なかま（${day}）: リングに かけても とれない（${w}/${k0}）`); }
    { let board = null, won = false; for (let p = 0; p < 3 && !won; p++) { const r = perfectTripod(5, board, { day }); won = r.got.length > 0 && CM.lineup(CM.DEFS[5], day).includes(r.gotShapes[0]); board = JSON.parse(JSON.stringify(r.board())); } ok(won, `どうぶつえん（${day}）: アームを ぜんぶ おとしても とれない`); }
  }
  ok(claws / clawN >= 2, `3本アーム: 3日の へいきんが ${(claws / clawN).toFixed(2)}こ（6こ中）`);
  // トライポッド: とれた あとは おみせの 人が アームを ぜんぶ もどして あたらしい けいひんを のせる（まえは アームが おちた まま・からっぽ だった）
  for (const i of [4, 5]) {
    let board = null, won = false;
    for (let p = 0; p < 4 && !won; p++) { const r = perfectTripod(i, board, { seed: 3, day: DAY }); won = r.got.length > 0; board = JSON.parse(JSON.stringify(r.board())); }
    ok(won && board.b.length === 0 && board.s.up.includes("0"), `トライポッド ${i}: とれない`);
    const n2 = new CM.CraneRound(i, board, { seed: 3, day: DAY }); for (let f = 0; f < 120; f++) n2.step(1 / 60);
    ok(n2.list().length === 1 && n2.rig.arms.every((a) => a.up) && n2.got.length === 0 && n2.W.centroid(n2.list()[0])[1] > 5, `トライポッド ${i}: とれた あと けいひんが のらない・アームが もどらない`);
  }
  // keep: きのうの けいひんと おとした アームは つぎの 日も そのまま
  { const r = new CM.CraneRound(5, null, { seed: 3, day: DAY }); r.rig.arms[0].up = false; r.rig.arms[2].up = false; const bd = JSON.parse(JSON.stringify(r.board())), sh = bd.b[0][1];
    const t = new CM.CraneRound(5, bd, { day: "2026-10-1" }); ok(t.day === DAY && t.list().length === 1 && t.list()[0].data.shape === sh && t.rig.save().up === bd.s.up && bd.s.up.split("0").length === 3, "どうぶつえん: つぎの 日に とちゅうの けいひんと アームが きえる"); }
  // 館の 台の 絵の キーは かぎりが ある（pool の かず いか）
  for (const i of F1) { const keys = new Set(); for (let k = 0; k < 400; k++) { const t = new Date(Date.UTC(2026, 8, 1) + k * 86400000); keys.add(PA.prizeList(i, `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`).join()); } ok(keys.size <= CM.DEFS[i].pool.length, `台 ${i}: 館の 絵の キーが ${keys.size}`); }
  // 台の せつめい（おなじ なかまは まとめて よぶ）・いまの 日（とちゅうの 1かい・keep）・とれた けいひん
  const S0 = R.Save; S0.d = S0.fresh(); const a = PA.norm();
  ok(PA.todayText(0, DAY) === `わんこの ぬいぐるみ 4しゅ（${PA.prizeList(0, DAY).map((id) => A.INDEX[id].word).join("・")}）`, "わんこの 台の せつめい " + PA.todayText(0, DAY));
  ok(/^ミニマスコット 3しゅ（[^）]+・[^）]+・[^）]+）$/.test(PA.todayText(2, DAY)) && /^みずべの なかま 3しゅ（/.test(PA.todayText(11, DAY)) && PA.todayText(10, DAY) === A.INDEX[PA.prizeList(10, DAY)[0]].name && PA.todayText(5, DAY) === A.INDEX[PA.prizeList(5, DAY)[0]].name, `せつめい ${PA.todayText(2, DAY)} / ${PA.todayText(11, DAY)} / ${PA.todayText(10, DAY)}`);
  ok(PA.todayText(12, DAY) === PA.prizeList(12, DAY).map((id) => PA.item(id).name).join("・"), "おかしの 台の せつめいが かわった");
  ok(PA.dayOf(0) === CM.today() && PA.dayOf(5) === CM.today(), "dayOf: きょう");
  a.boards[5] = JSON.parse(JSON.stringify(new CM.CraneRound(5, null, { seed: 3, day: "2026-9-29" }).board())); ok(PA.dayOf(5) === "2026-9-29" && JSON.stringify(PA.prizeList(5)) === JSON.stringify(PA.prizeList(5, "2026-9-29")), "dayOf: keep の 台に きのうの けいひん");
  a.boards[5].b = []; ok(PA.dayOf(5) === CM.today(), "dayOf: とれた あとは きょう");
  a.boards[0] = JSON.parse(JSON.stringify(new CM.CraneRound(0, null, { seed: 3, day: "2026-9-29" }).board())); ok(PA.dayOf(0) === CM.today(), "dayOf: keep で ない 台は きょう");
  a.active = { id: "t", machine: 0, def: "chibi-wanko", cp: { day: "2026-9-28" } }; ok(PA.dayOf(0) === "2026-9-28" && PA.dayOf(8) === CM.today(), "dayOf: とちゅうの 1かいは はじめた 日"); a.active = null;
  const got = PA.prizesOf(10, { got: [1], gotShapes: ["big_cat"] }); ok(got.length === 1 && got[0].id === "ike_plush_cat" && got[0].n === 1, "ビッグ ぬいぐるみの ねこが もらえない");
  const gm = PA.prizesOf(2, { got: [1, 2], gotShapes: ["mini_hamster", "mini_goji"] }); ok(gm.length === 2 && gm.every((p) => A.INDEX[p.id]), "ミニマスコットの ハムスター");
}

// ---- 6c. 2F の はしわたし: 2本の ぼうの うえの はこ・アームで ずらして おとす・おみせの 人の たすけ・けいひん 14しゅ ----
{
  const bridges = CM.DEFS.map((d, i) => [d, i]).filter(([d]) => d.type === "bridge");
  ok(bridges.length === 2 && bridges.every(([d, i]) => i >= 17 && PA.machines[i].type === "bridge" && d.pool && d.pick === 1), "はしわたしは 2F の 2台（台 17・18・日がわり 1しゅ）");
  const pose = (r) => { const b = r.list()[0]; if (!b) return null; const c = r.W.centroid(b), ex = R.CranePhys.qrot(b.q, [1, 0, 0]); return { x: c[0], y: c[1], z: c[2], roll: Math.asin(Math.max(-1, Math.min(1, ex[1]))) * 180 / Math.PI, ax: ex }; };
  const play = (i, board, x, z, o = {}) => { const r = new CM.CraneRound(i, board, { seed: o.seed || 3, day: DAY, ...o }); r.rig.load({ x, z }); r.press(); let top = 0; for (let f = 0; f < 60 * 40 && !r.done; f++) { r.step(1 / 60); const b = r.list()[0]; if (b) top = Math.max(top, r.W.centroid(b)[1]); } ok(r.done, `はしわたし ${i}: あそびが おわらない`); return { r, top, board: JSON.parse(JSON.stringify(r.board())) }; };
  for (const [d, i] of bridges) {
    const B = d.bars, gap = B.x1 - B.x0 - 2 * B.r, S = CM.SHAPES[d.pool[0]](), [w, h, dep] = S.size;
    // ほんものの めやす: はしの すきまは はこの みじかい へん ＋ 1〜2cm
    ok(gap - Math.min(h, dep) >= 1 && gap - Math.min(h, dep) <= 2 && w > B.x1 - B.x0 + 2, `はしわたし ${i}: すきま ${gap.toFixed(1)}cm と はこ ${S.size}`);
    ok(d.pool.every((sh) => CM.SHAPES[sh]().size.join() === S.size.join()), `はしわたし ${i}: はこの 大きさが そろって いない`);
    // はじめは 2本の ぼうに まっすぐ のる
    const r0 = new CM.CraneRound(i, null, { seed: 5, day: DAY }), p0 = pose(r0), b0 = JSON.parse(JSON.stringify(r0.board()));
    ok(r0.list().length === 1 && Math.abs(p0.x - (B.x0 + B.x1) / 2) < 0.3 && Math.abs(p0.roll) < 2 && p0.y > B.y + B.r && p0.y < B.y + B.r + h, `はしわたし ${i}: はじめの はこ ${JSON.stringify(p0)}`);
    // まんなかを はさんでも はこは もちあがらない（アームが すぐ ゆるむ）・ぼうから おちない
    { const { r, top } = play(i, b0, p0.x, p0.z), p = pose(r); ok(!r.got.length && p && top < p0.y + 5 && Math.abs(p.x - p0.x) < 1.5 && p.y > B.y, `はしわたし ${i}: まんなかを はさむと もちあがる／おちる（top ${top.toFixed(1)}）`); }
    // こつ: はこの はしを ねらって ずらす（アームの まんなかへ よる）→ ななめに ハマる → うえに ういた はしを ねらう
    { let board = b0, won = 0; const inset = B.rubber ? 2 : 0;
      for (let k = 1; k <= 4 && !won; k++) { const p = pose(new CM.CraneRound(i, board, { seed: 3, day: DAY })), x = Math.abs(p.roll) < 10 ? p.x - 8 : p.x + (p.roll < 0 ? -1 : 1) * ((w / 2) * Math.cos((p.roll * Math.PI) / 180) - inset), q = play(i, board, x, p.z); board = q.board; if (q.r.got.length) won = k; }
      ok(won >= 2 && won <= 3, `はしわたし ${i}: こつを つかんでも 2〜3かいで とれない（${won}）`); }
    // はしを ねらうと はこが アームの ほうへ ずれる（ななめに なる ことも ある）
    { const { r } = play(i, b0, p0.x - 8, p0.z), p = pose(r); ok(!r.got.length && p.x < p0.x - 3, `はしわたし ${i}: はしを ねらっても ずれない ${JSON.stringify(p)}`); }
    // おみせの 人の たすけ: はこを たてむき（ながい へんが ぼうに そう）に すこし かたむけて おく・「ここを ねらってね」の しるし
    { const a = new CM.CraneRound(i, b0, { seed: 5, day: DAY, assist: true }), p = pose(a), H = a.hint;
      ok(a.staff === "assist" && a.events.some((e) => e.e === "staff" && e.what === "assist") && Math.abs(p.ax[2]) > 0.95 && Math.abs(p.x - (B.x0 + B.x1) / 2) < 1.5 && p.y > B.y && H && Math.abs(H[0] - p.x - d.assistAim) < 0.05 && Math.abs(H[1] - p.z) < 0.05, `はしわたし ${i}: おみせの 人が たてむきに しない・しるしが ない ${JSON.stringify(p)} ${H}`);
      const ab = JSON.parse(JSON.stringify(a.board()));
      // しるしを はさむと おちる（しるしの まわり ±1cm・おく ±5cm でも）
      let w2 = 0, n2 = 0; for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -5], [0, 5]]) { n2++; if (play(i, ab, H[0] + dx, H[1] + dz).r.got.length) w2++; }
      ok(w2 === n2, `はしわたし ${i}: しるしを はさんでも おちない（${w2}/${n2}）`);
      // しるしの 2.5cm いないで つかむ → しるしに ぴったり（アームが うごいて いても・ゆれて いても）→ とれる。とおい ところは そのまま
      { const r = new CM.CraneRound(i, b0, { seed: 5, day: DAY, assist: true }), R2 = r.rig; R2.load({ x: r.hint[0] - 1.8, z: r.hint[1] + 1.2 }); Object.assign(R2, { vx: 6, vz: -4, sx: 1.5, svx: 3 }); r.press();
        ok(r.snapped && Math.abs(R2.x - r.hint[0]) < 1e-6 && Math.abs(R2.z - r.hint[1]) < 1e-6 && R2.sx === 0, `はしわたし ${i}: しるしに あわせない`);
        for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60); ok(r.got.length === 1, `はしわたし ${i}: しるしに あわせても とれない`); }
      { const r = new CM.CraneRound(i, b0, { seed: 5, day: DAY, assist: true }); r.rig.load({ x: r.hint[0] - 6, z: r.hint[1] }); r.press(); ok(!r.snapped && Math.abs(r.rig.x - (r.hint[0] - 6)) < 1e-6, `はしわたし ${i}: とおくでも しるしに あわせる`); }
      // つづきから: しるしは のこる・2かい たすけない
      const cp = JSON.parse(JSON.stringify(a.snap())), again = new CM.CraneRound(i, cp.board, { cp, day: DAY, assist: true }); ok(!again.staff && Math.abs(pose(again).ax[2]) > 0.95 && again.hint && again.hint.join() === H.join(), `はしわたし ${i}: つづきから で 2かい たすける／しるしが きえる`);
      // どの 日の けいひんでも おなじ（はこの 大きさは おなじ）
      const day2 = "2026-10-3", r2 = new CM.CraneRound(i, null, { seed: 5, day: day2 }), a2 = new CM.CraneRound(i, JSON.parse(JSON.stringify(r2.board())), { seed: 5, day: day2, assist: true });
      ok(r2.mix[0] !== new CM.CraneRound(i, null, { seed: 5, day: DAY }).mix[0] && play(i, JSON.parse(JSON.stringify(a2.board())), a2.hint[0], a2.hint[1], { day: day2 }).r.got.length === 1, `はしわたし ${i}: ${day2} の けいひんで しるしを はさんでも とれない`); }
    // ぼうから おちて ゆかに ある はこは つぎの はじめに もとの ばしょへ
    { const r = new CM.CraneRound(i, b0, { seed: 5, day: DAY }), b = r.list()[0]; r.W.remove(b); r.bodies = r.bodies.filter((q) => q.alive); r.add(b.data.shape, [8, 6, 25], R.CranePhys.qaxis(0, 0, 1, Math.PI / 2), { sid: 99 }); r.settle(2);
      const bd = JSON.parse(JSON.stringify(r.board())), n = new CM.CraneRound(i, bd, { seed: 5, day: DAY }), p = pose(n); ok(n.staff === "back" && n.list().length === 1 && Math.abs(p.x - (B.x0 + B.x1) / 2) < 0.5 && Math.abs(p.roll) < 2, `はしわたし ${i}: おちた はこが もどらない`); }
    // でたらめに ねらっても（はずれ 4かいで たすけ）12かい いないに とれる
    { const rnd = CM.rng(40 + i); for (let s = 0; s < 3; s++) { let board = b0, miss = 0, won = 0;
        for (let k = 1; k <= 12 && !won; k++) { const assist = miss >= PA.ASSIST, p = pose(new CM.CraneRound(i, board, { seed: 3, day: DAY })), q = play(i, board, p.x + (rnd() - 0.5) * 24, p.z + (rnd() - 0.5) * 12, { seed: 20 + k, assist }); board = q.board; if (q.r.got.length) won = k; else miss = assist ? 0 : miss + 1; }
        ok(won >= 1, `はしわたし ${i}: でたらめに 12かい あそんでも とれない（${s}）`); } }
  }
  // けいひん 14しゅ（フィギュア 6・ざっか 8）: 家具・へやの 絵・おうちの 立体・はこの テクスチャ（id なし）・なまえ
  const items = R.BridgePrizes.ITEMS, pools = new Set(bridges.flatMap(([d]) => d.pool));
  ok(items.length === 14 && items.filter((it) => it.kind === "fig").length === 6 && items.filter((it) => it.kind === "goods").length === 8 && items.every((it) => pools.has("hashi_" + it.key)), "はしわたしの けいひんは 14しゅ（フィギュア 6・ざっか 8）・どれも 台に でる");
  ok(new Set(items.map((it) => it.name)).size === 14 && items.every((it) => !/[一-鿿]/.test(it.name + it.desc) && it.name.length <= 16), "はしわたしの けいひんの なまえ（漢字なし・かさならない）");
  for (const it of items) {
    const f = R.FURN_INDEX[it.id]; ok(f && f.rare && f.price === 0 && f.interactive && f.arcadePrize && f.exclusive === "ikebukuro" && f.cityItem.type === "hashiprize", `はしわたし ${it.id} の 家具`);
    const svg = R.Art.furnSvg(it.id), m = R.IkebukuroItemArt.model(it.id); ok(/<svg/.test(svg) && !/undefined|NaN/.test(svg) && m.full.includes("<svg") && m.w === f.w && m.footD === f.depth, `はしわたし ${it.id} の へやの 絵・立体`);
    for (const face of ["front", "back", "top", "side"]) { const k = "hashi-" + it.key + "-" + face, t = CA.TEX[k] && CA.TEX[k](); ok(t && CA.SIZE[k] && t.startsWith("<svg") && !/undefined|NaN/.test(t) && !/ id="/.test(t.replace(/href="[^"]*"/g, "")), `はしわたし ${it.id} の テクスチャ ${face}`); }
    ok(PA.pictureSvg(it.id).includes("<svg"), `はしわたし ${it.id} の けっかの 絵`);
  }
  // PrizeArcade: いつも おなじ アーム・はずれ 4かいで たすけ・たすけの あとは かぞえなおし・とれた けいひんは 家具
  const S0 = R.Save; S0.d = S0.fresh(); S0.d.coins = 5000; const back = { venue: "arcade", floor: 2, back: { map: "city", x: 12, y: 62 } }, empty = () => ({ v: 1, n: 1, b: [], s: {} });
  for (let k = 0; k < 4; k++) { const run = PA.start(17, back); ok(run && run.strong === true && !run.assist, `はしわたし: ${k + 1}かいめに たすけ／よわい アーム`); PA.finish(run, { got: [], board: empty }); }
  const help = PA.start(17, back); ok(help.assist === true && S0.d.arcade.miss[17] === 4, "はしわたし: はずれ 4かいで おみせの 人が たすけない"); PA.finish(help, { got: [], board: empty }); ok(S0.d.arcade.miss[17] === 0, "はしわたし: たすけの あとに はずれの かずが もどらない");
  const winRun = PA.start(18, back), sh = CM.lineup(CM.DEFS[18], CM.today())[0], pid = CM.SHAPES[sh]().prize; PA.finish(winRun, { got: [1], gotShapes: [sh], board: empty }); ok(S0.d.furn[pid] === 1 && !S0.d.bag[pid] && S0.d.arcade.miss[18] === 0, `はしわたし: とれた ${pid} が 家具に ならない`);
}

// ---- 6e. 3F の おかしの 台（UI-23）: おかし ロード（19。UI-29 の ベルトの トレジャーロード）・おかし タワー（20。ペラわの はこを ひっかけて くずす）----
{
  const P = 19, T = 20, dP = CM.DEFS[P], dT = CM.DEFS[T], S = dP.shelf, L = dP.lanes, lw = (S.x1 - S.x0) / L.n, food = (id) => R.BAG_INDEX[id] && R.BAG_INDEX[id].kind === "food";
  const yaw = (b) => { const M = R.CranePhys.qmat(b.q); return Math.atan2(M[0][2], M[0][0]) * 180 / Math.PI; };
  ok(dP.type === "road" && dP.id === "snack-road" && PA.machines[P].type === "road" && PA.machines[P].id === "snack-road" && dT.type === "ring" && dT.tower && PA.machines[T].rule === "tower" && PA.rules.road && PA.rules.tower && !PA.rules.poke, "3F の 2台（おかし ロード・おかし タワー）");
  ok(dP.pool.length === 5 && dP.pick === 3 && dT.pool.length === 5 && dT.pick === 2 && !dP.keep && !dT.keep, "3F の 日がわり（はこの おかし 5しゅ）");
  ok(L.n === 7 && L.lamps === 15 && L.low >= 1 && L.high < L.lamps && L.step > 0 && L.speed > 0 && L.sweep > 0 && dP.stops === 3, "7れつ・ランプ 15こ・3かい とめる");
  // けいひんは 2F の はこと おなじ たべもの（ねかせた はこ 11×4.2×7.5・その よこに ペラわ）
  for (const sh of dP.pool) { const A = CM.SHAPES[sh](), B = CM.SHAPES[sh.replace("tower_", "pera_")](); ok(food(A.prize) && B.prize === A.prize && B.ring && B.ring[0] > A.box[0] / 2 && A.box.join() === "11,4.2,7.5", `${sh}: たべもの・ペラわ`); }
  // ---- おかし ロード: ベルトの うえに 12こ（3ぎょう × 3こ ＋ まえの ぎょうの うえ 3こ）。どの はこも 2れつの さかいめ。さわらなければ うごかない ----
  const r0 = new CM.CraneRound(P, null, { seed: 3, day: DAY }), c0 = r0.list().map((b) => r0.W.centroid(b));
  ok(r0.list().length === 12 && r0.phase === "sweep" && r0.stops === 3 && c0.every((c) => c[0] > S.x0 && c[0] < S.x1 && c[2] > S.z0 + 3 && c[2] < S.z1 && c[1] > S.y), "ベルトの うえに 12こ・3かい とめられる");
  ok(c0.every((c) => Math.abs((c[0] - S.x0) / lw - Math.round((c[0] - S.x0) / lw)) < 0.05 && Math.round((c[0] - S.x0) / lw) >= 1 && Math.round((c[0] - S.x0) / lw) <= L.n - 1) && c0.filter((c) => c[1] > S.y + 4).length === 3, "はこは 2れつの さかいめ・まえの ぎょうは 2だん");
  ok(new Set(c0.map((c) => Math.round((c[0] - S.x0) / lw))).size === 6, "どの れつにも はこが ある（れんがの ように ずらす）");
  // ランプ: 7れつ・low〜high か 15・かならず 1れつは 15・とめる たびに かわる
  ok(r0.lit.length === L.n && r0.lit.every((v) => (v >= L.low && v <= L.high) || v === L.lamps) && r0.lit.includes(L.lamps), "ランプの かず " + r0.lit.join());
  for (let f = 0; f < 180; f++) { if (f % 6 === 0) for (const b of r0.list()) r0.W.wake(b); r0.step(1 / 60); }
  ok(r0.list().every((b, k) => Math.hypot(...r0.W.centroid(b).map((v, j) => v - c0[k][j])) < 0.1) && r0.got.length === 0, "おきて いても はこは うごかない");
  // ひかりは 0〜6 を いったり きたり（はしで おりかえす）
  { const r = new CM.CraneRound(P, null, { seed: 3, day: DAY }), seen = new Set(); let min = 9, max = -9;
    for (let f = 0; f < 60 * 5; f++) { r.step(1 / 60); seen.add(r.rig.at()); min = Math.min(min, r.rig.pos); max = Math.max(max, r.rig.pos); }
    ok(r.phase === "sweep" && seen.size === L.n && min >= 0 && max <= L.n - 1 && r.stops === 3, "ひかりが 7れつを いったり きたり"); }
  // とめる: ひかりの いる れつだけ ランプの かず × step cm うごく。その れつに かかる はこは まえへ・ななめに なる。ほかの はこは うごかない
  { const r = new CM.CraneRound(P, null, { seed: 3, day: DAY }), before = r.list().map((b) => [b.data.sid, r.W.centroid(b), yaw(b)]);
    r.rig.hold = 3; r.lit[3] = 15; ok(r.press() === "stop" && r.phase === "run" && r.lastLane === 3 && r.lastLit === 15 && r.stops === 2 && Math.abs(r.rig.left - 15 * L.step) < 1e-9, "とめる → 3れつめが 15こ ぶん");
    ok(r.press() === null, "うごいて いる あいだは おせない");
    for (let f = 0; f < 60 * 8 && r.phase !== "sweep"; f++) r.step(1 / 60);
    ok(r.phase === "sweep" && Math.abs(r.rig.moved[3] - 15 * L.step) < 1e-6 && r.rig.moved.every((v, k) => k === 3 || v === 0) && r.lit.includes(L.lamps), "ベルトは 15 × step cm・ほかの れつは うごかない・ランプが かわる");
    const on3 = (c) => c[0] + 5.5 > S.x0 + 3 * lw && c[0] - 5.5 < S.x0 + 4 * lw;
    let fwd = 0, turned = 0, still = true;
    for (const [sid, c, y0] of before) { const b = r.list().find((q) => q.data.sid === sid); if (!b) { fwd++; continue; } const d = c[2] - r.W.centroid(b)[2]; if (on3(c)) { if (d > 2) fwd++; if (Math.abs(yaw(b) - y0) > 15) turned++; } else if (Math.hypot(...r.W.centroid(b).map((v, j) => v - c[j])) > 0.3) still = false; }
    ok(fwd >= 3 && turned >= 2 && still, `れつに かかる はこは まえへ（${fwd}）・ななめに なる（${turned}）・ほかは そのまま`); }
  // はこの ない れつでも とまった ところは かならず うごく（はずれは ない）
  { const r = new CM.CraneRound(P, null, { seed: 3, day: DAY }); for (const b of r.list()) r.W.remove(b); r.bodies = []; r.rig.hold = 0; r.lit[0] = 4; r.press(); for (let f = 0; f < 60 * 8 && r.phase !== "sweep"; f++) r.step(1 / 60);
    ok(Math.abs(r.rig.moved[0] - 4 * L.step) < 1e-6 && r.stops === 2, "はこの ない れつも うごく"); }
  // ボット（ねらう: まえに でて いる はこの れつ × ランプ）。つづけて 8かい（台の ようすは つぎへ・へったら おみせの 人が たす）。
  // おみせの 人が たした はこは まっすぐ・ばしょの とおり・とれない かいが 4かい つづかない。でたらめに とめても ときどき とれる
  const aim = (r) => { let best = 0, bs = -1e9; for (let k = 0; k < L.n; k++) { const x0 = S.x0 + k * lw, x1 = x0 + lw, B = r.list().map((b) => r.W.centroid(b)).filter((c) => c[1] > S.y && c[0] + 5.5 > x0 && c[0] - 5.5 < x1); if (!B.length) continue; const front = Math.min(...B.map((c) => c[2])), sc = r.lit[k] * L.step - (front - S.z0) * 0.8 + B.filter((c) => c[2] < front + 3).length; if (sc > bs) { bs = sc; best = k; } } return best; };
  const spots = new CM.CraneRound(P, null, { seed: 3, day: DAY }).roadSpots();
  for (const mode of ["aim", "random"]) {
    let board = null, total = 0, restock = 0, prizes = true, added = 0, zero = 0, longest = 0;
    for (let p = 0; p < 8; p++) {
      const before = new Set(board ? board.b.map((q) => q[0]) : []), r = new CM.CraneRound(P, board, { seed: 40 + p, day: DAY }), pick = R.CraneMachines.rng(900 + p);
      if (r.staff === "restock") { restock++;
        for (const b of r.list()) if (!before.has(b.data.sid)) { const c = r.W.centroid(b), M = R.CranePhys.qmat(b.q); added++; ok(M[1][1] > 0.97 && spots.some(([x, , z]) => Math.abs(c[0] - x) < 1.5 && Math.abs(c[2] - z) < 1.5), `おみせの 人が たした はこが ななめ・ずれて いる（${c.map((v) => v.toFixed(1))}）`); } }
      for (let f = 0; f < 60 * 80 && !r.done; f++) { if (r.phase === "sweep") { r.rig.hold = mode === "aim" ? aim(r) : Math.floor(pick() * L.n); r.press(); } r.step(1 / 60); }
      ok(r.done && r.stops === 0, "3かい とめて おわる"); total += r.got.length; prizes = prizes && PA.prizesOf(P, r).every((q) => food(q.id) && q.n >= 1);
      zero = r.got.length ? 0 : zero + 1; longest = Math.max(longest, zero);
      board = JSON.parse(JSON.stringify(r.board()));
      const back = new CM.CraneRound(P, board, { seed: 99, day: DAY }), same = board.b.every(([sid, , x, y, z]) => back.list().some((q) => q.data.sid === sid && Math.hypot(...back.W.centroid(q).map((v, j) => v - [x, y, z][j])) < 0.8));
      ok(same && back.list().length >= Math.min(dP.fill.keep, board.b.length), "台の ようすが のこる・へったら たす");
    }
    if (mode === "aim") ok(total >= 6 && total <= 24 && restock >= 1 && added >= 1 && longest <= 3 && prizes, `おかし ロード（ねらう）: 8かいで ${total}こ（6〜24こ）・おみせの 人 ${restock}かい（${added}こ）・とれない かいが つづいた かず ${longest}`);
    else ok(total >= 1 && total <= 16 && prizes, `おかし ロード（でたらめ）: 8かいで ${total}こ（1〜16こ）`);
  }
  // つづきから: ひかりが うごいて いる とちゅう（のこり・ランプ・ひかりの ばしょ）・ベルトが うごいて いる とちゅう（その れつの のこりを うごかす）
  { const r = new CM.CraneRound(P, null, { seed: 3, day: DAY }); for (let f = 0; f < 50; f++) r.step(1 / 60); const cp = JSON.parse(JSON.stringify(r.snap())), r2 = new CM.CraneRound(P, cp.board, { cp, day: DAY });
    ok(r2.phase === "sweep" && r2.stops === 3 && r2.lit.join() === r.lit.join() && Math.abs(r2.rig.pos - r.rig.pos) < 0.01 && r2.list().length === 12, "つづきから（のこり・ランプ・ひかり）");
    r.rig.hold = 2; r.lit[2] = 12; r.press(); for (let f = 0; f < 20; f++) r.step(1 / 60); const cp2 = JSON.parse(JSON.stringify(r.snap())), r3 = new CM.CraneRound(P, cp2.board, { cp: cp2, day: DAY });
    ok(cp2.mid && cp2.lane === 2 && cp2.left > 0 && r3.phase === "run" && r3.rig.lane === 2 && Math.abs(r3.rig.left - cp2.left) < 0.01 && r3.stops === 2, "ベルトが うごく とちゅうの つづきは のこりを うごかす");
    for (let f = 0; f < 60 * 8 && r3.phase !== "sweep"; f++) r3.step(1 / 60); ok(r3.phase === "sweep" && Math.abs(r3.rig.moved[2] - cp2.left) < 0.05, "のこりの ぶん だけ うごく"); }
  // まえの「ぼうで おす」台の ようすは つかわない（はこの ならびが ちがう）
  { const old = { v: 1, id: "snack-poke", n: 9, b: [[1, "tower_choco", 28, 22.1, 20, 0, 0, 0, 1]], s: { x: 28, l: 0 }, day: DAY }, r = new CM.CraneRound(P, old, { seed: 3, day: DAY });
    ok(r.list().length === 12 && r.phase === "sweep", "ぼうで おす 台の ようすは つかわない（はじめから）"); }
  // ---- おかし タワー: 5だん（だんごとに 90ど）・まんなかの だんに ペラわの はこ。わの たかさに フックが とまる ----
  const t0 = new CM.CraneRound(T, null, { seed: 3, day: DAY }), pb = t0.list().find((b) => b.data.pera), ring = CM.toWorld(t0.W, pb, pb.data.ring.slice(0, 3));
  ok(t0.list().length === 5 && t0.towerOk() && t0.list().filter((b) => b.data.pera).length === 1 && t0.list().every((b) => food(CM.SHAPES[b.data.shape]().prize)), "タワー 5だん・ペラわの はこ 1つ");
  ok(Math.abs(ring[1] + 13.2 - dT.minY) < 0.6 && ring[0] > dT.tower.ped.x0 && ring[0] < dT.box.w - 6, `フックが わっかの あなに とまる たかさ（わ ${ring[1].toFixed(1)}・minY ${dT.minY}）`);
  { const c = t0.list().map((b) => t0.W.centroid(b)); for (let f = 0; f < 300; f++) { if (f % 6 === 0) for (const b of t0.list()) t0.W.wake(b); t0.step(1 / 60); }
    ok(t0.towerOk() && t0.list().every((b, k) => Math.hypot(...t0.W.centroid(b).map((v, j) => v - c[k][j])) < 0.3), "タワーは おきて いても くずれない"); }
  const towerPlay = (dx, dz, board = null, seed = 3) => { const r = new CM.CraneRound(T, board, { seed, day: DAY }), b = r.list().find((q) => q.data.pera), p = CM.toWorld(r.W, b, b.data.ring.slice(0, 3)); r.rig.load({ x: p[0] + dx, z: p[2] + dz }); r.press(); for (let f = 0; f < 60 * 40 && !r.done; f++) r.step(1 / 60); return r; };
  { let wins = 0, boxes = 0, pera = 0, many = 0;
    for (const [dx, dz] of [[0, 0], [0.8, 0], [-0.8, 0], [0, 1.5], [0, -1.5], [1.2, 0.8]]) { const r = towerPlay(dx, dz); if (r.got.length) wins++; boxes += r.got.length; if (r.gotShapes.some((sh) => sh.startsWith("pera_"))) pera++; if (r.got.length >= 2) many++; }
    ok(wins >= 4 && pera >= 3 && many >= 2, `わっかを ねらうと とれる・くずれて いっしょに おちる（${wins}/6・ペラわ ${pera}・2こ いじょう ${many}・${boxes}こ）`); }
  // はずす（わっかから 6cm）→ とれない・タワーは くずれない・つぎも つみなおさない
  { const r = towerPlay(6, 0), bd = JSON.parse(JSON.stringify(r.board())), n = new CM.CraneRound(T, bd, { seed: 4, day: DAY });
    ok(r.got.length === 0 && r.towerOk() && n.staff === null && n.towerOk() && n.list().length === 5, "はずすと とれない・タワーは そのまま"); }
  // とれた あとは つぎの 1かいの はじめに おみせの 人が つみなおす（staff: tower）
  { const r = towerPlay(0, 0), bd = JSON.parse(JSON.stringify(r.board())), n = new CM.CraneRound(T, bd, { seed: 4, day: DAY });
    ok(r.got.length >= 1 && !r.towerOk() && n.staff === "tower" && n.towerOk() && n.list().length === 5 && n.list().filter((b) => b.data.pera).length === 1, "とれた あと タワーを つみなおす"); }
  // おなじ たね・おなじ そうさ → おなじ けっか（タワー・ぼうで おす）
  { const a = towerPlay(0.8, 0.5), b = towerPlay(0.8, 0.5); ok(a.got.join() === b.got.join() && JSON.stringify(a.board().b) === JSON.stringify(b.board().b), "タワー: おなじ けっか"); }
  { const play = () => { const r = new CM.CraneRound(P, null, { seed: 8, day: DAY }); let n = 0; for (let f = 0; f < 60 * 60 && !r.done; f++) { if (r.phase === "sweep" && f > 30 + n * 40) { r.press(); n++; } r.step(1 / 60); } return r; };
    const a = play(), b = play(); ok(a.got.join() === b.got.join() && JSON.stringify(a.board().b) === JSON.stringify(b.board().b) && a.lastLane === b.lastLane, "おかし ロード: おなじ けっか"); }
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
console.log(`Crane: 21 machines (claw/2-claw/sweet/tripod/ring/coin pusher/bridge/treasure road; 7 daily machines on 1F, 5 daily snack catchers and 2 daily bridges on 2F, a 7-lane belt treasure road and a ring-hook snack tower on 3F, keep rule), 54 plush prizes (36 added), tripod refill after a win, coin/snack/boxed prizes, bridge technique/staff assist/tidy, daily lineups, physics outcomes, pusher medals/chance/slot/payout, road light/lamps/belts/restock, save/resume and machine ids, fees, rewards and coin cap, determinism, text — ${n} checks OK`);
