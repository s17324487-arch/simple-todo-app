// コラボ グッズ（js/collab-goods.js・js/puzzle-collab.js）の 検査。ブラウザ なしで たしかめる。
// ライン・めやす・服と 家具の とうろく（おみせに ならばない）・なまえ・つみたて（はじめは まえの ベスト・なんかいも もらわない・いちどに いくつも）・
// パズルの けっかで つみたてる（れんしゅうは なし・おなじ 1かいは 1かい だけ・ほぞんに しっぱいしたら もとに もどす）・ふつうに あそんで とどく（パズルの ボット）・
// 服の 絵（3人 × まえ・よこ・うしろ・id）・家具の 立体（はんてん・id・さわる）・ずかんの ヒント。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";
import { simulate, profiles } from "./puzzle-sim.mjs";

const R = gameContext();
const { CollabGoods: CG, PuzzleCollab: PC, PuzzleArcade: PA, Save: S, WEAR_ITEMS, ITEM_INDEX, FURNITURE, FURN_INDEX, FURN_ART, WEAR, BUY_SHOPS, HomeDesign, Chara, ItemDexSources } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. ライン・めやす ----
const L = CG.LINES.puzzle;
ok(L && L.items.length === 5 && L.items === PC.ITEMS, "なかよしパズルの コラボは 5しゅ");
ok(L.items.map((it) => it.need).join() === "30000,50000,80000,100000,150000", "めやすは 30000・50000・80000・100000・150000 pt（オーナーの 指示）");
ok(L.items.some((it) => it.kind === "wear") && L.items.some((it) => it.kind === "furn"), "げんていの 服と 家具の りょうほう");
ok(L.unit === "pt" && L.game === "なかよしパズル" && /ごわが/.test(L.name), "ラインの なまえ");
for (const it of L.items) {
  ok(/^pc_[a-z]+$/.test(it.id) && it.name && !kanji.test(it.name) && it.name.length <= 14, `${it.id}: なまえは ひらがな・カタカナで 14もじ まで`);
  ok(it.desc && !kanji.test(it.desc) && it.desc.length <= 60, `${it.id}: せつめい`);
  if (it.kind === "wear") {
    const w = ITEM_INDEX[it.id];
    ok(w && WEAR_ITEMS.includes(w) && w.slot === it.slot && typeof WEAR[w.wear] === "function" && w.exclusive === "collab" && w.collab === "puzzle", `${it.id}: 服の とうろく`);
    ok(!BUY_SHOPS.clothes.items(w.slot).some((x) => x.id === it.id), `${it.id}: ようふくやに ならばない`);
  } else {
    const f = FURN_INDEX[it.id];
    ok(f && FURNITURE.includes(f) && f.exclusive === "collab" && f.collab === "puzzle" && f.interactive && typeof FURN_ART[it.id] === "function", `${it.id}: 家具の とうろく`);
    ok(!BUY_SHOPS.furniture.items("floor").some((x) => x.id === it.id), `${it.id}: かぐやに ならばない`);
  }
}
ok(new Set(L.items.map((it) => it.id)).size === 5 && new Set(L.items.map((it) => it.name)).size === 5, "id と なまえが かさならない");

// ---- 2. つみたて ----
S.d = S.fresh();
ok(S.d.collab && typeof S.d.collab === "object" && !S.d.collab.puzzle, "あたらしい セーブの collab は からっぽ（はじめて よむ ときに つくる）");
ok(CG.total("puzzle") === 0 && CG.next("puzzle").id === "pc_hoodie", "あたらしい セーブは 0 から");
{
  const old = S.fresh(); delete old.collab; old.puzzle.best = 42000; old.puzzle.plays = 9;
  S.d = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(S.d.collab && !S.d.collab.puzzle && CG.total("puzzle") === 42000, "まえの セーブ: つみたては まえの ベスト（42000）から");
  ok(CG.state("puzzle").got && Object.keys(CG.state("puzzle").got).length === 0, "まえの セーブ: まだ なにも もらって いない（つぎの けっかで わたす）");
}
S.d = S.fresh();
{
  let got = CG.add("puzzle", 29999);
  ok(got.length === 0 && CG.total("puzzle") === 29999 && !S.d.wardrobe.pc_hoodie, "29999 では まだ");
  got = CG.add("puzzle", 1);
  ok(got.map((it) => it.id).join() === "pc_hoodie" && S.d.wardrobe.pc_hoodie === true && CG.has("pc_hoodie"), "30000 で パーカー（ふくに はいる）");
  got = CG.add("puzzle", 125000);
  ok(got.map((it) => it.id).join() === "pc_cushion,pc_band,pc_table,pc_arcade" && S.d.furn.pc_cushion === 1 && S.d.furn.pc_table === 1 && S.d.furn.pc_arcade === 1 && S.d.wardrobe.pc_band === true, "いちどに いくつも とどく");
  ok(CG.add("puzzle", 500000).length === 0 && S.d.furn.pc_arcade === 1 && CG.next("puzzle") === null, "もらった ものは 2かい もらわない");
  ok(CG.add("puzzle", -500).length === 0 && CG.add("puzzle", NaN).length === 0 && CG.total("puzzle") === 655000, "マイナス・NaN は たさない");
  S.d.collab.puzzle.total = -3; ok(CG.total("puzzle") === 0, "こわれた つみたては 0 に");
}

// ---- 3. パズルの けっかで つみたてる ----
const run = (score, practice = false) => { const r = { id: "t" + Math.random().toString(36).slice(2), practice, back: {}, state: { ...new R.NakayoshiPuzzle(7).s, score, done: true } }; if (!practice) S.d.puzzle.active = r; return r; };
{
  S.d = S.fresh(); S.d.puzzle.best = 20000;
  const r1 = run(15000), res = PA.settle(r1);
  ok(res && res.collab.join() === "pc_hoodie" && CG.total("puzzle") === 35000 && S.d.wardrobe.pc_hoodie, "まえの ベスト 20000 ＋ 15000 = 35000 → パーカー");
  ok(PA.settle(r1) === res && CG.total("puzzle") === 35000, "おなじ 1かいは 2かい たさない");
  const before = CG.total("puzzle"), p = PA.settle(run(60000, true));
  ok(p.practice && CG.total("puzzle") === before, "れんしゅうは つみたてない");
  // ほぞんに しっぱい → もとに もどす（服・家具・つみたて・パズルの きろく）
  const set0 = R.localStorage.setItem, snap = JSON.stringify({ c: S.d.collab, w: S.d.wardrobe, f: S.d.furn, p: S.d.puzzle.best });
  R.localStorage.setItem = () => { throw new Error("quota"); };
  const r2 = run(80000); ok(PA.settle(r2) === null, "ほぞん できない ときは null");
  R.localStorage.setItem = set0;
  const now = JSON.parse(JSON.stringify({ c: S.d.collab, w: S.d.wardrobe, f: S.d.furn, p: S.d.puzzle.best }));
  ok(JSON.stringify(now) === snap, "ほぞんに しっぱい したら つみたて・服・家具が もとに もどる");
  const r3 = run(80000); const res3 = PA.settle(r3);
  ok(res3 && res3.collab.join() === "pc_cushion,pc_band,pc_table" && CG.total("puzzle") === 115000 && S.d.furn.pc_cushion === 1 && S.d.furn.pc_table === 1 && S.d.wardrobe.pc_band, "つぎの 1かいで 35000 → 115000（クッション・カチューシャ・テーブル）");
}

// ---- 4. ふつうに あそんで とどく（パズルの ボット・人の 実測では ない）----
{
  const plays = {};
  for (const id of ["learning", "skilled", "expert"]) {
    let total = 0, k = 0;
    while (total < 150000 && k < 60) total += simulate((k++ + 1) * 104729, profiles[id]).score;
    plays[id] = k;
  }
  ok(plays.expert <= 5 && plays.skilled <= 12 && plays.learning <= 30, "150000 pt まで とどく かいすう " + JSON.stringify(plays));
  console.log(`  ボットで 150000 pt まで: ${JSON.stringify(plays)} かい`);
}

// ---- 5. 服の 絵（3人 × まえ・よこ・うしろ）----
for (const it of L.items.filter((x) => x.kind === "wear")) {
  for (const who of Chara.IDS) for (const dir of ["down", "left", "up"]) {
    const svg = Chara.svg(who, { dir, face: "happy", outfit: { [it.slot]: it.id } });
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined/.test(svg), `${it.id}/${who}/${dir}: 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${it.id}/${who}/${dir}: id が かさなる`);
  }
  const a = Chara.svg("wanko", { outfit: { [it.slot]: it.id } }), b = Chara.svg("wanko", { outfit: { [it.slot]: it.id } });
  ok(ids(a).every((x) => !ids(b).includes(x)), `${it.id}: 2まい ならべても id が かさならない`);
}
// ---- 6. 家具の 立体（はんてん も）・さわる ----
for (const it of L.items.filter((x) => x.kind === "furn")) {
  for (const flip of [false, true]) {
    const m = HomeDesign.model(it.id, { flip }), svg = m.full;
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined/.test(svg) && m.w > 40 && m.h > 40, `${it.id}${flip ? "（はんてん）" : ""}: 立体の 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${it.id}${flip ? "（はんてん）" : ""}: id が かさなる`);
    ok(svg.match(/<svg/g).length === 1, `${it.id}${flip ? "（はんてん）" : ""}: なかに <svg> を いれない（CSS の svg { width: 100% } で くずれる）`);
  }
  ok(/<svg/.test(FURN_ART[it.id]()) && R.FurnLive && R.FurnLive.state({ id: it.id, uid: 1 }) !== undefined, `${it.id}: 部屋の 絵・さわる`);
}
// ---- 7. ずかんの ヒント ----
for (const it of L.items) {
  const t = ItemDexSources.source(it.kind === "wear" ? "wear" : "furn", it.kind === "wear" ? ITEM_INDEX[it.id] : FURN_INDEX[it.id]);
  ok(t.includes("なかよしパズル") && t.includes(it.need.toLocaleString()) && t.includes("コラボ"), `${it.id}: ずかんの ヒント「${t}」`);
}

console.log(`✓ collab OK（${n} 項目）: なかよしパズル ${L.items.map((it) => `${it.name} ${it.need}`).join("・")}`);
