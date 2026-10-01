// すいぞくかんの おみやげ（js/aqua-gifts.js）の 検査。ブラウザ なしで たしかめる。
// うみの いきもの フィギュア 10しゅ・ごわが コラボ 5しゅ（家具 3・服 2）・ねだん（すこし たかめ）・とうろく（ほかの おみせに ならばない）・
// おみせ（3つの タブ・服と 家具の わけ）・絵（フィギュア・家具の 立体〔はんてん・live〕・服〔3人 × 4むき・マネキン〕）・さわる うごき・
// 12F の おみやげの コーナー（台・レジ・とおれる）・ずかんの ヒント・かんばんの いろ（MallArt の キー）。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { AquaGifts: A, FURNITURE, FURN_INDEX, FURN_ART, WEAR_ITEMS, ITEM_INDEX, WEAR, BUY_SHOPS, ShopUI, HomeDesign, Chara, WearMannequin, FurnLive, ItemDexSources, VenueHalls, IsoVenue, MallArt, Gacha } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const clean = (svg) => !/NaN|undefined|Infinity/.test(svg);

// ---- 1. しなもの（フィギュア 10・コラボ 5）----
ok(A.FIGS.length === 10 && new Set(A.FIGS.map((f) => f.id)).size === 10, "うみの いきもの フィギュア 10しゅ");
ok(A.FIGS.map((f) => f.k).join() === "penguin,sealion,otter,dolphin,orca,whaleshark,turtle,mola,jelly,eel", "フィギュアの いきもの（ペンギン・アシカ・ラッコ・イルカ・シャチ・ジンベエザメ・ウミガメ・マンボウ・クラゲ・チンアナゴ）");
ok(A.GOODS.length === 5 && A.GOODS.filter((g) => g.kind === "furn").length === 3 && A.GOODS.filter((g) => g.kind === "wear").length === 2, "ごわが コラボ 5しゅ（家具 3・服 2）");
ok(A.GOODS.every((g) => /ごわが|わんこ|がちゃん|ごじ/.test(g.name + g.desc)), "コラボは どれも 3人（ごわが）が いる");
const ALL = [...A.FIGS, ...A.GOODS];
ok(new Set(ALL.map((x) => x.id)).size === 15 && new Set(ALL.map((x) => x.name)).size === 15, "id と なまえが かさならない");
for (const x of ALL) {
  ok(x.name && !kanji.test(x.name) && x.name.length <= 15, `${x.id}: なまえは ひらがな・カタカナで 15もじ まで`);
  ok(x.desc && !kanji.test(x.desc) && x.desc.length <= 72 && x.desc.endsWith("。"), `${x.id}: せつめい（ひらがな・カタカナ・72もじ まで）`);
  ok(!FURN_INDEX[x.id] !== !ITEM_INDEX[x.id] && A.INDEX[x.id], `${x.id}: 家具か 服の どちらか 1つ`);
}

// ---- 2. ねだん（オーナーの 指示「どれも 少し高めの価格」）----
// 「すこし たかめ」: おなじ なかまの ふつうの しなもの（ようふくや・かぐや）より たかく、その 2ばい まで。池袋の 専門店（いちばん やすくて 4800）よりは やすい
const prices = (list) => list.map((it) => it.price).filter((p) => p > 0).sort((a, b) => a - b), med = (a) => a[Math.floor(a.length / 2)];
const floor = BUY_SHOPS.furniture.items("floor"), small = prices(floor.filter((f) => f.w <= 60 && f.price < 2000)), floorP = prices(floor);
const head = prices(BUY_SHOPS.clothes.items("head")), back = prices(BUY_SHOPS.clothes.items("back"));
const ikeMin = Math.min(...Object.keys(BUY_SHOPS).filter((k) => k.startsWith("ike_") && k !== "ike_arcade" && k !== "ike_marche").flatMap((k) => (BUY_SHOPS[k].tabs || [["all"]]).flatMap(([t]) => BUY_SHOPS[k].items(t))).map((it) => it.price).filter((p) => p > 0));
ok(ikeMin >= 4800 && small.length >= 6, "くらべる しなもの（池袋の 専門店・かぐやの ちいさな かざり）");
const band = (p, ref) => p > ref && p <= ref * 2 && p < ikeMin;
for (const f of A.FIGS) ok(band(f.price, small[small.length - 1]) && f.price >= Gacha.PRICE * 5, `${f.id}: フィギュアの ねだん ${f.price}（かぐやの ちいさな かざり ${small[0]}〜${small[small.length - 1]} より すこし たかい）`);
for (const g of A.GOODS) {
  const ref = g.slot === "head" ? head[head.length - 1] : g.slot === "back" ? med(back) : med(floorP), what = g.slot === "head" ? "ようふくやの あたまの いちばん たかい" : g.slot === "back" ? "ようふくやの せなかの まんなか" : "かぐやの まんなか";
  ok(band(g.price, ref), `${g.id}: コラボの ねだん ${g.price}（${what} ${ref} より すこし たかい）`);
}
ok(new Set(A.FIGS.map((f) => f.price)).size >= 3, "フィギュアの ねだんは おおきさで ちがう");
// ---- 3. とうろく（ほかの おみせに ならばない）----
for (const f of A.FIGS) {
  const it = FURN_INDEX[f.id];
  ok(it && FURNITURE.includes(it) && it.kind === "floor" && it.exclusive === "aquarium" && it.aquaGift === "fig" && it.price === f.price && it.h === 55 && it.w === f.vw / 2 && it.depth > 0 && it.comfort >= 4, `${f.id}: 家具の とうろく`);
}
for (const g of A.GOODS) {
  if (g.kind === "wear") {
    const w = ITEM_INDEX[g.id];
    ok(w && WEAR_ITEMS.includes(w) && w.slot === g.slot && typeof WEAR[w.wear] === "function" && w.exclusive === "aquarium" && w.price === g.price && w.st, `${g.id}: 服の とうろく`);
    ok(!BUY_SHOPS.clothes.items(w.slot).some((x) => x.id === g.id), `${g.id}: ようふくやに ならばない`);
  } else {
    const f = FURN_INDEX[g.id];
    ok(f && FURNITURE.includes(f) && f.exclusive === "aquarium" && f.aquaGift === "collab" && f.interactive && typeof FURN_ART[g.id] === "function", `${g.id}: 家具の とうろく`);
  }
}
ok(ALL.filter((x) => FURN_INDEX[x.id]).every((x) => !BUY_SHOPS.furniture.items("floor").some((y) => y.id === x.id)), "かぐやに ならばない");
ok(["head", "back"].every((slot) => A.GOODS.some((g) => g.slot === slot)), "コラボの 服は あたま（ぼうし）と せなか（リュック）");

// ---- 4. おみせ（BUY_SHOPS.aq_shop）----
const S = BUY_SHOPS[A.SHOP];
ok(A.SHOP === "aq_shop" && S && S.name && !kanji.test(S.name) && S.name.length <= 13 && S.keeper.sp === "seal" && S.hello.length >= 2 && S.hello.every((t) => !kanji.test(t)), "おみせの なまえ（13もじ まで: タイトルが 1ぎょう）・てんいん");
ok(S.tabs.map((t) => t[0]).join() === "fig,goods,wear" && S.tabs.every((t) => !kanji.test(t[1]) && t[1].length <= 6), "タブは フィギュア・コラボ かぐ・コラボ ふく");
ok(S.items("fig").map((x) => x.id).join() === A.FIGS.map((f) => f.id).join(), "フィギュアの タブ: 10しゅ");
ok(S.items("goods").map((x) => x.id).join() === "aqc_penguin,aqc_jelly,aqc_eel" && S.items("wear").map((x) => x.id).join() === "aqc_whalehat,aqc_orcapack", "コラボの タブ（かぐ 3・ふく 2）");
ok(ShopUI.kindOf(A.SHOP, "fig") === "furn" && ShopUI.kindOf(A.SHOP, "goods") === "furn" && ShopUI.kindOf(A.SHOP, "wear") === "wear", "タブごとの しゅるい（家具・服）");
ok(ShopUI.kindOf("clothes", "head") === "wear" && ShopUI.kindOf("furniture", "floor") === "furn" && ShopUI.kindOf("market", "food") === "bag", "ほかの おみせの しゅるいは かわらない");
ok(S.cls === "shop-aq", "なまえは ことばの きれめで おりかえす（フィギュ／ア に ならない）・タブは 44px（css の .shop-aq）");
ok(!R.SONGS || R.SONGS["shop_" + A.SHOP] === R.SONGS.aquarium, "かいものの あいだも すいぞくかんの 曲");

// ---- 5. 絵: フィギュア（たて 110 の 絵）----
for (const f of A.FIGS) {
  const svg = A.figure(f.id);
  ok(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.vw} 110">`) && clean(svg) && svg.length > 1500 && ids(svg).length === 0, `${f.id}: フィギュアの 絵`);
  ok(/^<g transform="scale\(0\.5\)">/.test(FURN_ART[f.id]()) && !/<svg/.test(FURN_ART[f.id]()), `${f.id}: へやの 絵（なかに <svg> を いれない）`);
}
ok(new Set(A.FIGS.map((f) => A.figure(f.id))).size === 10, "フィギュアの 絵は ぜんぶ ちがう");
// ---- 6. 家具の 立体（はんてん も）・live ----
for (const id of [...A.FIGS.map((f) => f.id), "aqc_penguin", "aqc_jelly", "aqc_eel"]) {
  for (const flip of [false, true]) {
    const m = HomeDesign.model(id, { flip }), svg = m.full;
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && clean(svg) && m.w > 30 && m.h > 30 && svg.match(/<svg/g).length === 1, `${id}${flip ? "（はんてん）" : ""}: 立体の 絵（1まいの <svg>）`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${id}${flip ? "（はんてん）" : ""}: id が かさならない`);
    if (id.startsWith("aqc_")) { const lv = HomeDesign.model(id, { flip, live: true }); ok(["x", "y", "w", "h"].every((k) => Math.abs(m[k] - lv[k]) < 1e-6) && lv.full.length < svg.length, `${id}${flip ? "（はんてん）" : ""}: live でも 絵の はんいが おなじ（うごく ぶぶんは ぬく）`); }
  }
}
for (const id of ["aqc_penguin", "aqc_jelly", "aqc_eel"]) ok(FurnLive.LIVE.has(id) && FurnLive.state({ id, uid: 1 }).live, `${id}: さわれる（FurnLive）`);
// ---- 7. 服（3人 × 4むき・マネキン）----
for (const g of A.GOODS.filter((g) => g.kind === "wear")) {
  for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "left", "up", "right"]) {
    const svg = Chara.svg(who, { dir, face: "happy", outfit: { [g.slot]: g.id } }), base = Chara.svg(who, { dir, face: "happy" });
    ok(clean(svg) && svg.length > base.length + 400, `${g.id}/${who}/${dir}: 服の 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${g.id}/${who}/${dir}: id が かさならない`);
  }
  const mq = WearMannequin.svg(g.id); ok(clean(mq) && mq.length > WearMannequin.svg(null).length, `${g.id}: マネキンが きる`);
}
{
  // ぼうしは まえ・よこ・うしろで ちがう 絵（よこは おびれが うしろ・うしろは V の おびれ）・リュックは うしろで かおが 見える
  const hat = (dir) => Chara.svg("wanko", { dir, outfit: { head: "aqc_whalehat" } }), pack = (dir) => Chara.svg("goji", { dir, outfit: { back: "aqc_orcapack" } });
  ok(new Set(["down", "left", "up"].map(hat)).size === 3 && new Set(["down", "left", "up"].map(pack)).size === 3, "ぼうし・リュックは むきで 絵が かわる");
  ok(pack("up").includes("#E8262A") && !pack("down").includes('stroke="#E8262A"'), "リュックの ごじの くち（あかい ギザギザ）は うしろすがたで 見える");
}

// ---- 8. さわる うごき ----
{
  const st = { t0: -99 }; R.G.t = 10;
  ok([0, 1, 2].every((i) => A.eelOut(st, i) === 1), "チンアナゴ: ふだんは でて いる");
  st.t0 = 10; R.G.t = 10.11; ok([0, 1, 2].every((i) => A.eelOut(st, i) > 0.4 && A.eelOut(st, i) < 0.6), "チンアナゴ: タップで すなに もぐる");
  R.G.t = 10.5; ok([0, 1, 2].every((i) => A.eelOut(st, i) === 0), "チンアナゴ: かくれて いる");
  R.G.t = 10 + 0.22 + 1.1 + 0.2; const o = [0, 1, 2].map((i) => A.eelOut(st, i)); ok(o[0] > 0 && o[1] === 0 && o[2] === 0, "チンアナゴ: 1にんずつ でて くる（さいしょは わんこ）");
  R.G.t = 14; ok([0, 1, 2].every((i) => A.eelOut(st, i) === 1), "チンアナゴ: もどって くる");
}
ok(A.JELLY_LIGHT.length === 4 && A.JELLY_LIGHT.every(([nm, rgb]) => !kanji.test(nm) && /^\d+,\d+,\d+$/.test(rgb)), "ランプの あかりは 4いろ");

// ---- 9. 12F の おみやげの コーナー ----
const r = VenueHalls.defs.mall.floors[12], zone = R.IkeAquarium.ZONES[12].find((z) => z.id === "shop");
const shopFx = r.fixtures.filter((f) => f.shopId === A.SHOP);
ok(!r.fixtures.some((f) => f.kind === "giftshelf"), "まえの おみやげの たな（ながめるだけ）は ない");
ok(shopFx.filter((f) => f.kind === "figstand").map((f) => f.item).join() === A.FIGS.map((f) => f.id).join(), "フィギュアの ショーケース 10（しなものの じゅん）");
ok(A.GOODS.every((g) => shopFx.some((f) => f.item === g.id && f.action === "buy")), "コラボ 5しゅの 台");
ok(shopFx.filter((f) => f.action === "buy").every((f) => f.label === A.INDEX[f.item].name && f.buyKind === (ITEM_INDEX[f.item] && A.INDEX[f.item].slot ? "wear" : "furn")), "台の なまえ・しゅるい");
ok(shopFx.some((f) => f.kind === "register" && f.action === "shop"), "レジで ぜんぶ みられる");
ok(shopFx.every((f) => f.x >= zone.x && f.y >= zone.y && f.x + f.w <= zone.x + zone.w && f.y + f.h <= zone.y + zone.h), "台と レジは おみやげの へやの なか");
{
  // かさならない・とおれる マスから しらべられる（エレベーターの まえから あるいて いける）
  const solid = r.fixtures.filter((f) => !f.walk && !f.over && !f.hidden), cell = new Map();
  for (const f of [...solid.filter((f) => !shopFx.includes(f)), ...solid.filter((f) => shopFx.includes(f))]) for (let x = f.x; x < f.x + f.w; x++) for (let y = f.y; y < f.y + f.h; y++) { const k = x + "," + y; if (shopFx.includes(f)) ok(!cell.has(k), `${f.label}: ほかの ものと かさならない（${k}）`); cell.set(k, f); }
  const walk = (x, y) => x >= 0 && y >= 0 && x < r.w && y < r.h && !IsoVenue.solidAt(r, x, y) && !cell.has(x + "," + y);
  const seen = new Set([r.spawn.join()]), q = [r.spawn];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + "," + (y + dy); if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
  const around = (f) => [...Array(f.w).keys()].flatMap((i) => [[f.x + i, f.y - 1], [f.x + i, f.y + f.h]]).concat([...Array(f.h).keys()].flatMap((j) => [[f.x - 1, f.y + j], [f.x + f.w, f.y + j]]));
  for (const f of shopFx) ok(around(f).some(([x, y]) => seen.has(x + "," + y)), `${f.label}: となりの マスまで あるいて いける`);
  // おみやげを とおって でぐちへ（13F から おりて きた かいだんの まえ → でぐちの ゲート）
  ok(seen.has("21,23") && seen.has("3,18"), "かいだんの まえから でぐちまで とおれる");
}
ok(shopFx.filter((f) => f.action === "buy" && f.kind !== "pedestal").every((f) => f.noFade), "ひくい 台は うしろの 3人が いても すけない");
// ---- 10. かんばんの いろ（キーに いろ と たかさ）・ずかんの ヒント ----
{
  const a = MallArt.modelKey({ kind: "hangsign", w: 4, h: 1, col: "#3E8FB0", z: 232 }), b = MallArt.modelKey({ kind: "hangsign", w: 4, h: 1, col: "#6BAA75", z: 232 });
  ok(a !== b && MallArt.modelKey({ kind: "hangsign", w: 4, h: 1, col: "#3E8FB0", z: 232 }) === a, "おなじ おおきさで いろの ちがう かんばんは べつの 絵（いりぐち は あお・でぐち は みどり）");
  const signs = r.fixtures.filter((f) => f.kind === "hangsign"); ok(new Set(signs.map((f) => MallArt.modelKey(f))).size === new Set(signs.map((f) => [f.w, f.h, f.col, f.z, f.face].join())).size, "12F の かんばんの キー");
}
for (const x of ALL) { const kind = FURN_INDEX[x.id] ? "furn" : "wear", t = ItemDexSources.source(kind, A.INDEX[x.id]); ok(/すいぞくかん/.test(t) && /かえる/.test(t) && !kanji.test(t.replace("F", "")), `${x.id}: ずかんの ヒント`); }

console.log(`✓ check-aqua-gifts: ${n} 件`);
