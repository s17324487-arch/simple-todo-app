// コラボ グッズ（js/collab-goods.js・js/puzzle-collab.js・js/korokoro-collab.js）の 検査。ブラウザ なしで たしかめる。
// ライン（なかよしパズル・ころころ フルーツ）・めやす・服と 家具の とうろく（おみせに ならばない）・なまえ・つみたて（はじめは まえの ベスト・なんかいも もらわない・いちどに いくつも）・
// パズルの けっかで つみたてる（れんしゅうは なし・おなじ 1かいは 1かい だけ・ほぞんに しっぱいしたら もとに もどす）・ふつうに あそんで とどく（パズルの ボット）・
// ころころの つみたての はじめ（ランキングの ごうけい）・ベッド・
// 服の 絵（3人 × まえ・よこ・うしろ・id）・家具の 立体（はんてん・id・さわる・live でも 絵の はんいが おなじ）・ずかんの ヒント。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";
import { simulate, profiles } from "./puzzle-sim.mjs";

const R = gameContext();
const { CollabGoods: CG, PuzzleCollab: PC, KorokoroCollab: KC, PuzzleArcade: PA, Save: S, WEAR_ITEMS, ITEM_INDEX, FURNITURE, FURN_INDEX, FURN_ART, WEAR, BUY_SHOPS, HomeDesign, Chara, ItemDexSources } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. ライン・めやす（なかよしパズル・ころころ フルーツ。めやすは オーナーの 指示）----
const L = CG.LINES.puzzle, KL = CG.LINES.korokoro;
ok(Object.keys(CG.LINES).join() === "puzzle,korokoro", "コラボの ラインは なかよしパズルと ころころ フルーツ");
ok(L && L.items.length === 5 && L.items === PC.ITEMS, "なかよしパズルの コラボは 5しゅ");
ok(L.items.map((it) => it.need).join() === "30000,50000,80000,100000,150000", "めやすは 30000・50000・80000・100000・150000 pt（オーナーの 指示）");
ok(L.unit === "pt" && L.game === "なかよしパズル" && /ごわが/.test(L.name), "ラインの なまえ");
ok(KL && KL.items.length === 5 && KL.items === KC.ITEMS, "ころころ フルーツの コラボは 5しゅ");
ok(KL.items.map((it) => it.need).join() === "5000,8000,10000,13000,15000", "めやすは 5000・8000・10000・13000・15000 てん（オーナーの 指示）");
ok(KL.unit === "てん" && KL.game === "ころころ フルーツ" && /ごわが/.test(KL.name) && /スコア モード/.test(KL.lead) && !kanji.test(KL.lead), "ころころの ラインの なまえ・せつめい");
for (const [line, pre] of [[L, "pc_"], [KL, "kc_"]]) {
  ok(line.items.some((it) => it.kind === "wear") && line.items.some((it) => it.kind === "furn"), `${line.id}: げんていの 服と 家具の りょうほう`);
  ok(line.items.every((it, i) => i === 0 || it.need > line.items[i - 1].need), `${line.id}: めやすは だんだん たかく`);
  for (const it of line.items) {
    ok(new RegExp(`^${pre}[a-z]+$`).test(it.id) && it.name && !kanji.test(it.name) && it.name.length <= 14, `${it.id}: なまえは ひらがな・カタカナで 14もじ まで`);
    ok(it.desc && !kanji.test(it.desc) && it.desc.length <= 60, `${it.id}: せつめい`);
    if (it.kind === "wear") {
      const w = ITEM_INDEX[it.id];
      ok(w && WEAR_ITEMS.includes(w) && w.slot === it.slot && typeof WEAR[w.wear] === "function" && w.exclusive === "collab" && w.collab === line.id, `${it.id}: 服の とうろく`);
      ok(!BUY_SHOPS.clothes.items(w.slot).some((x) => x.id === it.id), `${it.id}: ようふくやに ならばない`);
    } else {
      const f = FURN_INDEX[it.id];
      ok(f && FURNITURE.includes(f) && f.exclusive === "collab" && f.collab === line.id && f.interactive && typeof FURN_ART[it.id] === "function", `${it.id}: 家具の とうろく`);
      ok(!BUY_SHOPS.furniture.items("floor").some((x) => x.id === it.id), `${it.id}: かぐやに ならばない`);
    }
  }
}
const ALL = [...L.items, ...KL.items];
ok(new Set(ALL.map((it) => it.id)).size === 10 && new Set(ALL.map((it) => it.name)).size === 10, "id と なまえが かさならない（2つの ライン）");
// ころころ はこの ベッド: ねると ごきげんが ふえる（おうちの いちばん よい ベッドの えらびかたに のる）
ok(FURN_INDEX.kc_bed.sleep === 2 && !FURN_INDEX.kc_pool.sleep && !FURN_INDEX.pc_table.sleep, "ころころ はこの ベッドは ねられる（sleep 2）");

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

// ---- 3b. ころころ フルーツ: つみたての はじめは まえからの ランキング（5かい）の ごうけい・スコア モードの けっかで たす ----
{
  const old = S.fresh(); delete old.collab;
  Object.assign(old.shops.korokoro, { hi: 2400, games: 12, tops: [2400, 1800, 1500, 900, 600].map((v) => ({ s: v, d: "2026-9-20" })) });
  S.d = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(KC.seed() === 7200 && CG.total("korokoro") === 7200 && CG.next("korokoro").id === "kc_tee", "まえの セーブ: つみたては ランキングの ごうけい 7200 から（まだ なにも もらって いない）");
  ok(CG.add("korokoro", 900).map((it) => it.id).join() === "kc_tee,kc_pool" && S.d.wardrobe.kc_tee === true && S.d.furn.kc_pool === 1 && CG.total("korokoro") === 8100, "つぎの 1かい（900てん）で 8100 → Tシャツと ボールプール");
  ok(CG.total("puzzle") === 0 && !CG.has("pc_hoodie"), "ころころの つみたては なかよしパズルに まざらない");
  // ランキングが ない・こわれた セーブ（ハイスコアだけ）
  const o2 = S.fresh(); delete o2.collab; o2.shops.korokoro.hi = 1300; o2.shops.korokoro.tops = "x";
  S.d = S.migrate(JSON.parse(JSON.stringify(o2)));
  ok(KC.seed() === 1300 && CG.total("korokoro") === 1300, "ランキングが よめない ときは ハイスコアから");
  S.d = S.fresh();
  ok(KC.seed() === 0 && CG.total("korokoro") === 0, "はじめての セーブは 0 から");
  ok(CG.add("korokoro", 15000).map((it) => it.id).join() === "kc_tee,kc_pool,kc_cap,kc_bed,kc_plush" && ["kc_pool", "kc_bed", "kc_plush"].every((id) => S.d.furn[id] === 1) && S.d.wardrobe.kc_cap === true && CG.next("korokoro") === null, "15000てんで 5しゅ ぜんぶ");
  ok(CG.source("kc_bed").includes("13,000てん") && CG.source("kc_bed").includes("ころころ フルーツ"), "ずかんの ヒントの てん");
}

// ---- 4. ふつうに あそんで とどく（パズルの ボット・人の 実測では ない。ころころは tools/check-korokoro.mjs の こどもの ボット）----
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
for (const it of ALL.filter((x) => x.kind === "wear")) {
  for (const who of Chara.IDS) for (const dir of ["down", "left", "up"]) {
    const svg = Chara.svg(who, { dir, face: "happy", outfit: { [it.slot]: it.id } });
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined/.test(svg), `${it.id}/${who}/${dir}: 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${it.id}/${who}/${dir}: id が かさなる`);
  }
  const a = Chara.svg("wanko", { outfit: { [it.slot]: it.id } }), b = Chara.svg("wanko", { outfit: { [it.slot]: it.id } });
  ok(ids(a).every((x) => !ids(b).includes(x)), `${it.id}: 2まい ならべても id が かさならない`);
}
// ---- 6. 家具の 立体（はんてん も）・さわる ----
for (const it of ALL.filter((x) => x.kind === "furn")) {
  for (const flip of [false, true]) {
    const m = HomeDesign.model(it.id, { flip }), svg = m.full, lv = HomeDesign.model(it.id, { flip, live: true });
    ok(["x", "y", "w", "h"].every((k) => Math.abs(m[k] - lv[k]) < 1e-6), `${it.id}${flip ? "（はんてん）" : ""}: うごく 絵（live）でも 絵の はんいが おなじ`);
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined/.test(svg) && m.w > 40 && m.h > 40, `${it.id}${flip ? "（はんてん）" : ""}: 立体の 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${it.id}${flip ? "（はんてん）" : ""}: id が かさなる`);
    ok(svg.match(/<svg/g).length === 1, `${it.id}${flip ? "（はんてん）" : ""}: なかに <svg> を いれない（CSS の svg { width: 100% } で くずれる）`);
  }
  ok(/<svg/.test(FURN_ART[it.id]()) && R.FurnLive && R.FurnLive.state({ id: it.id, uid: 1 }) !== undefined, `${it.id}: 部屋の 絵・さわる`);
}
// ---- 7. ずかんの ヒント ----
for (const it of ALL) {
  const t = ItemDexSources.source(it.kind === "wear" ? "wear" : "furn", it.kind === "wear" ? ITEM_INDEX[it.id] : FURN_INDEX[it.id]), line = CG.LINES[it.line];
  ok(t.includes(line.game) && t.includes(it.need.toLocaleString()) && t.includes("コラボ"), `${it.id}: ずかんの ヒント「${t}」`);
}

console.log(`✓ collab OK（${n} 項目）: なかよしパズル ${L.items.map((it) => `${it.name} ${it.need}`).join("・")} ／ ころころ フルーツ ${KL.items.map((it) => `${it.name} ${it.need}`).join("・")}`);
