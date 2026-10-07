// コンビニの しなぞろえと ねだん（js/conbini-goods.js・UI-84）の 検査。
// ブラウザ なしで: とうろく・2つの コンビニの しなもの（16しゅずつ・おなじ ものは うらない・タブ）・ねだん（もとの 1.5ばい・ほかの おみせは そのまま）・
// あたらしい たべもの 20しゅ（データ・ことば・絵）・たなの かざり・いちばんくじの クーポン・たべものの バランス・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ConbiniGoods: CG, BUY_SHOPS, BAG_INDEX, FOODS, FOOD_ART, NeriShops, PokaDebug, FoodBalance, IchibanKuji, Save, ShopUI } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const SHOPS = ["lawson", "sevenbun"];

// ---- 1. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("conbini-goods.js") > at("neri-shops.js") && at("conbini-goods.js") < at("food-balance.js") && at("neri-shops.js") > 0, "index.html: neri-shops.js の あと・food-balance.js の まえ");
  ok(sw.includes('"./js/conbini-goods.js"'), "sw.js の FILES に ある");
  ok(CG.MUL === 1.5, "コンビニの ねだんは 1.5ばい");
}

// ---- 2. しなぞろえ・タブ ----
{
  const all = {};
  for (const shop of SHOPS) {
    const B = BUY_SHOPS[shop], items = B.items();
    all[shop] = items.map((i) => i.id);
    ok(items.length === 16 && new Set(all[shop]).size === 16, `${shop}: しなものは 16しゅ（${items.length}）`);
    ok(JSON.stringify(NeriShops.SHOPS[shop].goods) === JSON.stringify(CG.goods(shop)), `${shop}: NeriShops の goods も おなじ`);
    // たべものの タブは さいしょの 3つ（そのあとは あそびどうぐ・ほん・ドリルの タブ。js/play-goods.js・UI-105）
    ok(JSON.stringify(B.tabs.slice(0, 3)) === JSON.stringify([["meal", "ごはん"], ["sweet", "おやつ"], ["drink", "のみもの"]]) && B.tabs.slice(3).every(([t]) => ShopUI.kindOf(shop, t) === "wear"), `${shop}: タブは ごはん・おやつ・のみもの（＋ もちものの タブ）`);
    ok(B.cls.split(" ").filter((c) => c === "shop-goods").length === 1, `${shop}: まどは shop-goods（なまえは ことばの きれめで おりかえす・タブは 44px）`);
    const byTab = B.tabs.slice(0, 3).map(([t]) => B.items(t).map((i) => i.id));
    ok(byTab.flat().length === 16 && byTab.flat().every((id) => all[shop].includes(id)), `${shop}: タブで わけると ぜんぶに なる`);
    ok(byTab[0].length >= 8 && byTab[1].length >= 4 && byTab[2].length >= 3, `${shop}: ごはん ${byTab[0].length}・おやつ ${byTab[1].length}・のみもの ${byTab[2].length}`);
    for (const it of items) {
      const b = BAG_INDEX[it.id];
      ok(b && b.kind === "food" && FOOD_ART[it.id], `${shop}: ${it.id} は たべもので 絵が ある`);
      ok(it.basePrice === b.price && it.price === Math.round(b.price * 1.5) && it.price > b.price, `${shop}: ${b.name} は ${b.price} → ${it.price}（1.5ばい）`);
      ok(CG.tabOf(shop, it.id) && (CG.tabOf(shop, it.id) === "sweet") === !!b.deza, `${shop}: ${b.name} の タブ（デザは おやつ）`);
    }
  }
  ok(!all.lawson.some((id) => all.sevenbun.includes(id)), "2つの コンビニで おなじ しなものは うらない");
  for (const id of ["karaage", "onigiri", "rollcake", "pudding", "sandwich", "milk"]) ok(all.lawson.includes(id), "ローリソンは まえの しなもの も うる: " + id);
  for (const id of ["oden", "cocoa", "bread", "deza_ice", "deza_jelly", "juice"]) ok(all.sevenbun.includes(id), "せぶんぶんは まえの しなもの も うる: " + id);
}

// ---- 3. ねだん（ほかの おみせ・もちものの ねだん は そのまま）----
{
  ok(BAG_INDEX.karaage.price === 40 && BAG_INDEX.onigiri.price === 20 && BAG_INDEX.bread.price === 25 && BAG_INDEX.oden.price === 45, "もとの ねだん（BAG_INDEX）は かわらない");
  const law = (id) => BUY_SHOPS.lawson.items().find((i) => i.id === id), sev = (id) => BUY_SHOPS.sevenbun.items().find((i) => i.id === id);
  ok(law("karaage").price === 60 && law("onigiri").price === 30 && law("sandwich").price === 53 && law("cv_bento_karaage").price === 135, "ローリソン: からあげ 60・おにぎり 30・たまごサンド 53・からあげ べんとう 135");
  ok(sev("oden").price === 68 && sev("bread").price === 38 && sev("cv_napolitan").price === 135, "せぶんぶん: おでん 68・メロンパン 38・ナポリタン 135");
  const bakeryBread = BUY_SHOPS.bakery.items("goods").concat(BUY_SHOPS.bakery.items()).find((i) => i && i.id === "bread");
  ok(!bakeryBread || bakeryBread.price === 25, "パンやさんの メロンパンは もとの ねだん（25）");
  const market = (BUY_SHOPS.market.items("food") || []).concat(BUY_SHOPS.market.items("goods") || []);
  ok(market.every((f) => !CG.FOOD.includes(f.id)), "スーパーの たなには コンビニの あたらしい たべものが ならばない");
}

// ---- 4. あたらしい たべもの 20しゅ ----
{
  ok(CG.FOOD.length === 20 && CG.FOOD.every((id) => /^cv_[a-z_]+$/.test(id)), "あたらしい たべもの 20しゅ（cv_）");
  ok(CG.FOOD.every((id) => FOODS.filter((f) => f.id === id).length === 1), "FOODS に 1つずつ");
  for (const id of CG.FOOD) {
    const f = BAG_INDEX[id], art = FOOD_ART[id];
    ok(f.exclusive === "nerikasu" && !f.rare && f.price >= 25 && f.price <= 90 && f.hunger > 0 && f.mood > 0, `${id}: データ（ねだん ${f.price}・おなか ${f.hunger}・きぶん ${f.mood}）`);
    ok(!kanji.test(f.name) && !kanji.test(f.desc.replace(/げんき\(SP\)/g, "")) && f.name.length <= 11 && f.desc.length >= 12, `${id}: ことばは ひらがな・カタカナ（${f.name}）`);
    ok(f.deza === f.name.startsWith("デザ・"), `${id}: デザの しるし`);
    ok(typeof art === "string" && art.length > 300 && art.includes("#1F1D1B") && !/\bid=|NaN|undefined/.test(art), `${id}: 絵（INK の 線・id なし）`);
    const opens = (art.match(/<g\b/g) || []).length, closes = (art.match(/<\/g>/g) || []).length;
    ok(opens === closes, `${id}: <g> の とじ`);
  }
  ok(new Set(CG.FOOD.map((id) => FOOD_ART[id])).size === 20, "絵は ぜんぶ ちがう");
  const names = CG.FOOD.map((id) => BAG_INDEX[id].name);
  ok(new Set(names).size === 20 && Object.values(BAG_INDEX).filter((b) => b.kind === "food" && names.includes(b.name)).length === 20, "なまえは ほかの たべものと かさならない");
}

// ---- 5. たなの かざり・クーポン・バランス ----
{
  for (const shop of SHOPS) {
    const fx = NeriShops.SHOPS[shop].design.fixtures, foods = fx.filter((f) => f[6] && f[6].foods).flatMap((f) => f[6].foods);
    ok(foods.every((id) => FOOD_ART[id]) && foods.filter((id) => id.startsWith("cv_")).length >= 4, `${shop}: たなに あたらしい しなもの（${foods.filter((id) => id.startsWith("cv_")).length}）`);
  }
  ok(NeriShops.SHOPS.lawson.design.fixtures.some((f) => f[5] === "おにぎりと おべんとう") && NeriShops.SHOPS.sevenbun.design.fixtures.some((f) => f[5] === "めんと パンと わらびもち"), "たなの なまえ");
  Save.d = Save.fresh();
  const law = BUY_SHOPS.lawson.items(), kara = law.find((i) => i.id === "karaage");
  Save.d.kuji = Save.d.kuji || {}; IchibanKuji.st().coupons.kj_law_h0 = 1;
  const cp = BUY_SHOPS.lawson.coupon(kara);
  ok(cp && cp.use() && (Save.d.bag.karaage || 0) === 1, "いちばんくじの クーポン（からあげ むりょう けん）は そのまま つかえる");
  ok(BAG_INDEX.cv_bento_karaage.mood >= Math.round(6 * Math.log2(90 / 20)) && BAG_INDEX.cv_napolitan.mood >= 13, "たべものの バランス（50コイン いじょうの ごきげん）も かかる");
  ok(FoodBalance && typeof FoodBalance === "object", "FoodBalance の まえに よむ");
}

// ---- 6. PokaDebug ----
{
  const r = PokaDebug.conbini("lawson");
  ok(r && r.mul === 1.5 && r.goods.length === 16 && r.goods.every((g) => g.price === Math.round(g.base * 1.5) && g.tab), "PokaDebug.conbini: しなもの・タブ・ねだん");
  ok(PokaDebug.conbini("nope") === null, "PokaDebug.conbini: しらない おみせは null");
}

console.log(`✓ conbini goods (UI-84): ${n} checks（とうろく・16しゅ × 2・タブ・1.5ばい・ほかの おみせ・あたらしい たべもの 20・絵・たな・クーポン・バランス・PokaDebug）`);
