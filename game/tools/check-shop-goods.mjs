// お店の しなもの（js/shop-goods.js・js/shop-goods-art.js・UI-76）の 検査。ブラウザ なしで たしかめる。
// 1. あたらしい 食べ物 32しゅ（なまえと せつめいは 漢字なし・デザの しるし・スーパーに ならばない・ねだん・ごきげんの したの ほう）
// 2. 5けんの おみせの タブと しなもの（ケーキ 12・クレープ 9・パン 11・ころころ 10・ガソリンスタンド 8・はたけの ものは うらない）
// 3. 絵（あたらしい 32しゅ ＋ かきなおし 26しゅ・SVG の かけら・id なし・INK の せん・あとから 上がき されない・おうちの ボタン）
// 4. 店内の みほん（ケーキ・クレープ・パン・ころころ・スーパー）は うって いる たべもので 絵が ある
import { gameContext } from "./game-context.mjs";

const R = gameContext(), G = R.ShopGoods, A = R.ShopGoodsArt;
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/;
const fragOk = (s) => typeof s === "string" && s.length > 200 && !/NaN|undefined|null|Infinity/.test(s) && !/\sid="/.test(s) && s.includes(R.INK || "#1F1D1B");
const tagsBalanced = (s) => { const open = (s.match(/<(g|svg)\b/g) || []).length, close = (s.match(/<\/(g|svg)>/g) || []).length; return open === close; };

// ---- 1. あたらしい 食べ物 ----
const market = new Set(R.BUY_SHOPS.market.tabs.flatMap(([k]) => R.BUY_SHOPS.market.items(k)).map((it) => it.id));
ok(G && G.FOOD.length === 32 && new Set(G.NEW).size === 32, "あたらしい 食べ物は 32しゅ: " + (G && G.FOOD.length));
const SHOP_IDS = ["cake", "crepe", "bakery", "korokoro", "gasstand"];
for (const [id, name, price, hunger, mood, hp, sp, shop, desc] of G.FOOD) {
  const f = R.BAG_INDEX[id], F = R.FOODS.find((x) => x.id === id);
  ok(f && F && f.kind === "food" && f.name === name && F.name === name, `${id}: もちもの と FOODS に ある`);
  ok(!kanji.test(name + desc) && name.length <= 14, `${id}: なまえ・せつめいは 漢字なし・14もじ まで（${name}）`);
  ok(f.deza === name.startsWith("デザ・"), `${id}: デザの しるし`);
  ok(f.exclusive === shop && SHOP_IDS.includes(shop) && f.shopGoods && !f.rare, `${id}: その おみせ だけ（${shop}）`);
  ok(!market.has(id), `${id}: スーパーには ならばない`);
  ok(price >= 10 && price <= 300 && hunger > 0 && f.price === price, `${id}: ねだん・おなか`);
  ok(f.mood >= R.FoodBalance.moodFloor(price) && f.mood >= mood, `${id}: ごきげんは ねだんの したの ほう いじょう（${f.mood}）`);
  ok(!/^drink_|_mixjuice$/.test(id) || (f.sp || 0) >= 12, `${id}: のみものは げんき(SP)が もどる`);
}
// ねだんの じゅん（ホールケーキは ケーキの なかで いちばん たかい・みかん ＜ さくらんぼ）
const P = (id) => R.BAG_INDEX[id].price;
ok(P("deza_wholecake") > Math.max(P("cake"), P("deza_chococake"), P("deza_montblanc"), P("deza_cheese")) && P("fruit_mikan") < P("fruit_cherry") && P("snack_gum") < P("chips_small"), "ねだんの じゅん");

// ---- 2. 5けんの おみせ ----
const WANT = { cake: 12, crepe: 9, bakery: 11, korokoro: 10, gasstand: 8 };
const farm = new Set(R.FOODS.filter((f) => f.exclusive === "farm").map((f) => f.id));
for (const [shop, total] of Object.entries(WANT)) {
  const S = R.BUY_SHOPS[shop], L = G.LINEUP[shop];
  ok(S && L && S.kind === "bag" && S.tabs.length === 2 && S.tabs.every(([k, label]) => k && label && !kanji.test(label) && label.length <= 9), `${shop}: タブは 2つ（ひらがな・9もじ まで）`);
  const all = S.tabs.flatMap(([k]) => S.items(k));
  ok(all.length === total && G.ids(shop).length === total, `${shop}: しなものは ${total}（${all.length}）`);
  ok(new Set(all.map((it) => it.id)).size === all.length, `${shop}: おなじ しなものが 2かい ならばない`);
  ok(S.tabs.every(([k]) => S.items(k).length >= 3), `${shop}: どの タブも 3つ いじょう`);
  ok(S.items(undefined).map((it) => it.id).join() === S.items(S.tabs[0][0]).map((it) => it.id).join(), `${shop}: タブなしは さいしょの タブ`);
  for (const it of all) ok(it && R.BAG_INDEX[it.id] === it && it.price > 0 && R.FOOD_ART[it.id] && !farm.has(it.id) && !it.rare, `${shop}: ${it && it.id} は かえる たべもの（絵・はたけの ものでは ない）`);
  ok(G.FOOD.filter((f) => f[7] === shop).every((f) => all.some((it) => it.id === f[0])), `${shop}: あたらしい しなものが ぜんぶ ならぶ`);
  ok(/\bshop-goods\b/.test(S.cls || "") && S.icoSize === 56, `${shop}: なまえの おりかえし・アイコン 56`);
  ok(S.hello.length >= 2 && S.hello.every((t) => !kanji.test(t)), `${shop}: あいさつ（漢字なし）`);
  ok(G.state(shop).total === total && G.state(shop).tabs.length === 2, `${shop}: PokaDebug 用の state`);
}
// まえからの しなものも のこる（ショートケーキ・メロンパン・りんご・げんきドリンク）
ok(["cake", "pudding", "milk"].every((id) => G.ids("cake").includes(id)) && ["bread", "bone", "milk"].every((id) => G.ids("bakery").includes(id)) && ["apple", "juice", "candy"].every((id) => G.ids("korokoro").includes(id)) && ["drink", "juice", "candy"].every((id) => G.ids("gasstand").includes(id)), "まえからの しなものも かえる");
// ほかの おみせ（スーパー・ようふく・かぐ）には ならばない
for (const shop of ["market", "clothes", "furniture"]) ok(!R.BUY_SHOPS[shop].tabs.some(([k]) => R.BUY_SHOPS[shop].items(k).some((it) => it && it.shopGoods)), `${shop}: あたらしい 食べ物が まざらない`);

// ---- 3. 絵 ----
ok(Object.keys(A.ART).length === 58 && A.NEW.length === 32 && A.REDRAWN.length === 26, `絵は あたらしい 32・かきなおし 26（${Object.keys(A.ART).length}）`);
ok(A.NEW.every((id) => G.NEW.includes(id)) && G.NEW.every((id) => A.NEW.includes(id)), "あたらしい 食べ物と 絵が 1つずつ");
for (const [id, svg] of Object.entries(A.ART)) {
  ok(fragOk(svg) && tagsBalanced(svg), `${id}: SVG の かけら（id なし・INK・とじた タグ）`);
  ok(R.BAG_INDEX[id], `${id}: もちものに ある`);
  ok(R.FOOD_ART[id] === svg, `${id}: あとの ファイルで 上がき されない`);
  ok(/^<svg[\s\S]*<\/svg>$/.test(R.Art.iconSvg("bag", id)), `${id}: アイコンに なる`);
}
ok(R.HOUSE_ICONS.food.includes(A.ART.onigiri), "おうちの「ごはん」の ボタンも あたらしい おにぎり");
ok(typeof R.CHARA_GESTURES.bm_hug_burger.under === "function" && R.CHARA_GESTURES.bm_hug_burger.under("wanko").includes(A.ART.burger), "にこにこ セットの おもちゃの バーガーも あたらしい 絵");

// ---- 4. 店内の みほん ----
const SOLD = (shop) => new Set(R.BUY_SHOPS[shop].tabs.flatMap(([k]) => R.BUY_SHOPS[shop].items(k)).map((it) => it.id));
for (const shop of ["cake", "crepe", "bakery", "korokoro", "market"]) {
  const D = R.STORE_INTERIORS[shop], sold = SOLD(shop), refs = [];
  for (const w of Object.values(D.walls || {})) for (const p of w) { for (const id of [...(p.foods || []), ...(p.items || [])]) refs.push(id); if (p.food) refs.push(p.food); }
  for (const f of D.fixtures) { const o = f[6] || {}; for (const id of o.foods || []) refs.push(id); }
  for (const id of refs) ok(R.BAG_INDEX[id] && R.FOOD_ART[id] && (sold.has(id) || (shop === "korokoro" && ["watermelon", "strawberry"].includes(id)) || (shop === "market" && id === "watermelon")), `${shop}: 店内の みほん ${id} は うって いる たべもの`);
  ok(refs.length >= 3, `${shop}: 店内の みほんが ある`);
}

if (bad.length) { console.error("✗ shop-goods:\n  " + bad.slice(0, 40).join("\n  ")); process.exit(1); }
console.log(`✓ shop-goods OK（${n} 項目）: あたらしい 食べ物 ${G.FOOD.length}・かきなおし ${A.REDRAWN.length}・` + Object.entries(WANT).map(([s, t]) => `${R.BUY_SHOPS[s].name} ${t}`).join("・"));
