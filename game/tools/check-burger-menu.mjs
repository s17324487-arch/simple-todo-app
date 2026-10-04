// バーガーやさんの メニュー（js/burger-menu.js・UI-34）の 検査。ブラウザ なしで たしかめる。
// 4つの タブ（バーガー 8・サイド 4・のみもの 5・セット 1）・あたらしい 食べ物 15（なまえと ことばは 漢字なし・スーパーに ならばない・絵）・
// ポテト S＜M＜L・シェイクは デザ・にこにこ セットの おまけの おもちゃ 6しゅ（フィギュア だいに かざれる・まだ もって いない ものから・かぐやに ならばない・いれこの svg なし）・
// たべる・ずかんの ヒント・セーブ（あたらしい ば は ない）・PokaDebug。
import { gameContext } from "./game-context.mjs";

const R = gameContext(), S = R.Save, B = R.BurgerMenu, shop = R.BUY_SHOPS.burger;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/, ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const svgOk = (s) => /^<svg[\s\S]*<\/svg>$/.test(s) && !/NaN|undefined|null|Infinity/.test(s);

// ---- 1. タブ と しなもの ----
ok(shop && shop.tabs.map((t) => t[0]).join() === "burger,side,drink,set" && shop.tabs.map((t) => t[1]).join() === "バーガー,サイド,のみもの,セット", "タブは バーガー・サイド・のみもの・セット " + JSON.stringify(shop && shop.tabs));
const tab = (k) => shop.items(k);
ok(tab("burger").length === 8 && tab("side").length === 4 && tab("drink").length === 5 && tab("set").length === 1, `しなものの かず（バーガー 8・サイド 4・のみもの 5・セット 1）: ${["burger", "side", "drink", "set"].map((k) => tab(k).length)}`);
ok(tab("burger").some((it) => it.id === "burger") && tab("drink").some((it) => it.id === "juice") && tab("drink").some((it) => it.id === "milk"), "いままでの チーズバーガー・ジュース・ぎゅうにゅう も ならぶ");
ok(shop.kind === "bag" && shop.hello.every((t) => !kanji.test(t)) && shop.name === R.SHOPS.burger.name, "おみせの ことば（漢字なし）・もちものの おみせ");
const all = shop.tabs.flatMap(([k]) => tab(k));
ok(new Set(all.map((it) => it.id)).size === all.length, "おなじ しなものが 2かい ならぶ");
for (const it of all) ok(it && it.kind === "food" && R.BAG_INDEX[it.id] === it && it.price > 0 && it.hunger > 0, `${it && it.id}: たべもの・ねだん・おなか`);

// ---- 2. あたらしい 食べ物 15 ----
const NEW = all.filter((it) => it.burgerMenu);
ok(NEW.length === 15 && NEW.every((it) => it.id.startsWith("bm_")), "あたらしい 食べ物は 15（bm_）: " + NEW.length);
const market = new Set(R.BUY_SHOPS.market.items("food").map((it) => it.id));
const arts = new Set();
for (const it of NEW) {
  ok(it.exclusive === "burger" && !market.has(it.id) && !it.rare, `${it.id}: スーパーには ならばない`);
  ok(!kanji.test(it.name) && [...it.name].length <= 12, `${it.id}: なまえ（漢字なし・12もじ まで）「${it.name}」`);
  ok(!kanji.test(it.desc) && [...it.desc].length <= 52, `${it.id}: せつめい（漢字なし・52もじ まで）「${it.desc}」`);
  ok(["price", "hunger", "mood"].every((k) => Number.isFinite(it[k]) && it[k] >= 0) && (it.hp == null || it.hp > 0) && (it.sp == null || it.sp > 0), `${it.id}: すうじ`);
  const svg = R.Art.iconSvg("bag", it.id);
  ok(svgOk(svg) && svg.length > 600, `${it.id}: 絵`);
  ok(!/<svg[\s\S]*<svg/.test(svg), `${it.id}: いれこの svg が ない`);
  ok(new Set(ids(svg)).size === ids(svg).length, `${it.id}: 絵の id が かさなる`);
  arts.add(R.FOOD_ART[it.id]);
}
ok(arts.size === NEW.length, "15の 絵は ぜんぶ ちがう");
const P = (id) => R.BAG_INDEX[id];
ok(P("bm_fries_s").price < P("bm_fries_m").price && P("bm_fries_m").price < P("bm_fries_l").price && P("bm_fries_s").hunger < P("bm_fries_m").hunger && P("bm_fries_m").hunger < P("bm_fries_l").hunger, "ポテト S＜M＜L（ねだん・おなか）");
ok(["bm_shake_vanilla", "bm_shake_berry", "bm_shake_choco"].every((id) => P(id).deza && P(id).sp > 0) && NEW.filter((it) => it.deza).length === 3, "シェイク 3しゅは デザ（SP が もどる）・ほかは デザ で ない");
const burgers = tab("burger");
ok(burgers[0].id === "bm_hamburger" && burgers.every((it) => it.price >= burgers[0].price) && burgers[burgers.length - 1].id === "bm_big" && burgers.every((it) => it.price <= P("bm_big").price), "ハンバーガーが いちばん やすく、ビッグ バーガーが いちばん たかい");
ok(P(B.SET_ID).price > P("bm_hamburger").price + P("bm_fries_s").price && P(B.SET_ID).hunger >= P("bm_hamburger").hunger, "にこにこ セットは ハンバーガー＋ポテト S より たかい（おもちゃ つき）");
ok(!/ハッピー/.test(JSON.stringify(R.FOODS.map((f) => [f.name, f.desc]))), "なまえに「ハッピー」を つかわない（登録商標）");

// ---- 3. おまけの おもちゃ 6しゅ ----
const furnShop = new Set(R.BUY_SHOPS.furniture.items("floor").map((it) => it.id));
ok(B.TOYS.length === 6 && new Set(B.TOYS.map((t) => t.id)).size === 6, "おもちゃは 6しゅ");
for (const t of B.TOYS) {
  const f = R.FURN_INDEX[t.id];
  ok(f && R.FURNITURE.includes(f) && f.kind === "floor" && f.price === 0 && f.exclusive === "burger" && f.w > 0 && f.h > 0 && f.depth > 0, `${t.id}: 家具に とうろく`);
  ok(!furnShop.has(t.id), `${t.id}: かぐやに ならぶ`);
  ok(R.FigureStand.isFigure(t.id) && f.figure === true && R.FigureStand.figures().includes(t.id), `${t.id}: フィギュア だいに かざれる`);
  ok(!kanji.test(t.name) && [...t.name].length <= 12 && !kanji.test(t.desc) && [...t.desc].length <= 50, `${t.id}: なまえ・せつめい「${t.name}」「${t.desc}」`);
  const big = B.toySvg(t.id), small = R.Art.furnSvg(t.id), flip = R.Art.furnSvg(t.id, { flip: true });
  ok(svgOk(big) && svgOk(small) && svgOk(flip) && big.length > 1500, `${t.id}: 絵`);
  ok(!/<svg[\s\S]*<svg/.test(big) && !/<svg[\s\S]*<svg/.test(small), `${t.id}: いれこの svg が ない（CSS の「.ico svg」で 大きさが かわらない）`);
  ok(new Set(ids(big)).size === ids(big).length, `${t.id}: 絵の id が かさなる`);
  const a = ids(B.toySvg(t.id)), b = ids(B.toySvg(t.id));
  ok(!a.length || a.every((x) => !b.includes(x)), `${t.id}: 2まい ならべても id が かさならない`);
  const m = R.HomeDesign.model(t.id); ok([m.x, m.y, m.w, m.h].every(Number.isFinite) && m.w > 0 && m.h > 0, `${t.id}: へやの 立体`);
  ok(R.ItemDexSources.source("furn", f) === B.source(t.id) && /にこにこ セット/.test(B.source(t.id)) && !kanji.test(B.source(t.id)), `${t.id}: ずかんの ヒント`);
}
// 3人の おもちゃは だいて いる ものが みえる（バーガー〔いまの FOOD_ART.burger。js/shop-goods-art.js が かきなおす〕・ポテト・シェイクの 絵が はいる）
ok(B.toySvg("bm_toy_wanko").includes(R.FOOD_ART.burger) && B.toySvg("bm_toy_gachan").includes("#F0625A") && B.toySvg("bm_toy_goji").includes("#A06A48"), "3人の おもちゃに バーガー・ポテト・シェイク");

// ---- 4. かった とき（おまけ）・たべる ----
{
  S.d = S.fresh();
  const set = P(B.SET_ID);
  ok(shop.bought(P("bm_teriyaki"), 3) === null && Object.keys(S.d.furn).every((id) => !B.TOY_INDEX[id]), "セット いがいは おまけ なし");
  ok(/6しゅ/.test(shop.note(set)) && /もってる: 0しゅ/.test(shop.note(set)) && !kanji.test(shop.note(set)) && shop.note(P("burger")) === "", "セットの せつめい（ぜんぶで 6しゅ・もってる 0しゅ）");
  let show = shop.bought(set, 1);
  const got1 = B.TOYS.filter((t) => S.d.furn[t.id] === 1);
  ok(typeof show === "function" && got1.length === 1 && B.count() === 1, "1こ かうと おもちゃ 1こ");
  show = shop.bought(set, 5);
  ok(typeof show === "function" && B.TOYS.every((t) => S.d.furn[t.id] === 1) && B.count() === 6, "あと 5こで のこりの 5しゅ（おなじ ものは でない）");
  shop.bought(set, 2);
  ok(B.TOYS.reduce((a, t) => a + S.d.furn[t.id], 0) === 8 && B.TOYS.every((t) => S.d.furn[t.id] >= 1), "ぜんぶ ある ときは どれかが ふえる");
  ok(/もってる: 6しゅ/.test(shop.note(set)), "もってる 6しゅ");
  // つぎの おもちゃは まだ もって いない もの（さいころを かえても）
  S.d = S.fresh(); S.d.furn.bm_toy_wanko = 1; S.d.furn.bm_toy_goji = 2;
  ok([0, 0.3, 0.6, 0.99].every((r) => !["bm_toy_wanko", "bm_toy_goji"].includes(B.nextToy(() => r).id)), "まだ もって いない ものから でる");
  // たべる: にこにこ セット・シェイク
  S.d = S.fresh(); const who = S.d.order[0]; S.d.chars[who].hunger = 20; S.addBag(B.SET_ID, 1); S.addBag("bm_shake_berry", 1);
  const h0 = S.d.chars[who].hunger, r1 = R.Care.feed(who, B.SET_ID);
  ok(r1 && S.d.chars[who].hunger > h0 && !S.d.bag[B.SET_ID] && S.d.chars[who].wantsDeza === true, "にこにこ セットを たべる（おなかが ふえる・つぎは デザ）");
  const r2 = R.Care.feed(who, "bm_shake_berry");
  ok(r2 && S.d.chars[who].wantsDeza === false && /べつばら/.test(r2.text || JSON.stringify(r2)), "シェイクは デザ（べつばら）");
}

// ---- 5. セーブ・PokaDebug ----
{
  const fresh = S.fresh();
  ok(S.SCHEMA === 2 && !("burger" in fresh) && !JSON.stringify(fresh).includes("bm_"), "セーブに あたらしい ば は ない（SCHEMA は そのまま）");
  S.d = S.fresh(); S.d.furn.bm_toy_shake = 1; S.addBag(B.SET_ID, 2);
  const st = R.PokaDebug.burgerMenu();
  ok(st && st.tabs.length === 4 && st.tabs[0].ids.length === 8 && st.toys.length === 6 && st.count === 1 && st.set === 2 && st.toys.find((t) => t.id === "bm_toy_shake").n === 1, "PokaDebug.burgerMenu() " + JSON.stringify(st && { count: st.count, set: st.set }));
}

if (bad.length) { console.error(`✗ burger menu: ${bad.length} 件（${n} 項目中）`); for (const b of bad) console.error("  - " + b); process.exit(1); }
console.log(`Burger menu: 4 tabs (8 burgers, 4 sides, 5 drinks, the kids set), 15 new foods (kana names, burger shop only, distinct art), fries S<M<L, shakes are desserts, 6 bonus toys (figure stand, unowned first, not sold, no nested SVG), eating, item dex, save, PokaDebug — ${n} checks OK`);
