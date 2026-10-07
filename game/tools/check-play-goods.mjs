// あそびどうぐ・ほん・ドリル（js/play-goods.js・js/play-goods-art.js・UI-105）の 検査。ブラウザ なしで たしかめる。
// 30しゅ（あそびどうぐ 10・ほん 10・ドリル 10〔こくご 5・さんすう／すうがく 5〕）の とうろく（もちもの outfit.hand・ふくと おなじ かず）・なまえ・せつめい・つよさ・
// 絵（3人 × まえ／よこ／うしろ。わくから でない・うしろむきは うらがわで もじが ない・id が ない）・アイコン・みせ（コンビニ 2つの「あそび」「ほん・ドリル」・
// Meeときょれじゃ の けいひん カウンターの「おもちゃ」・ようふくやさんには ない・ねだん〔コンビニは 1.5ばい・オーナーは 10%びき〕・ポイントカード）・もたせる（1こで ひとり・わたす）・
// ずかんの ヒント・セーブ（かわらない）。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { PlayGoods: PG, PlayGoodsArt: PA, HandItems, WEAR, WEAR_ITEMS, ITEM_INDEX, BUY_SHOPS, ShopUI, ConbiniGoods, ConbiniCard, ItemDexSources, WearStock, Save, Art, PROFILE, Chara, U } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const STAT = new Set(["hp", "sp", "atk", "def", "spd"]);

// ---- 1. 30しゅ（しゅるいごとに 10）----
ok(PG.ITEMS.length === 30 && PG.IDS.length === 30 && new Set(PG.IDS).size === 30, "30しゅ・id が かさならない");
ok(JSON.stringify(Object.keys(PG.CATS)) === JSON.stringify(["toy", "book", "drill"]) && Object.keys(PG.CATS).every((c) => PG.of(c).length === 10), "あそびどうぐ・ほん・ドリル 10しゅずつ（オーナーの「8種類以上」）");
ok(PG.of("drill").filter((it) => it.subject === "kokugo").length === 5 && PG.of("drill").filter((it) => it.subject === "sansu").length === 5 && PG.of("drill").every((it) => PG.SUBJ[it.subject]), "ドリルは こくご 5・さんすう／すうがく 5");
ok(new Set(PG.ITEMS.map((it) => it.play)).size === 30, "あそびかた（home-play.js が みる）が かさならない");
ok(["pg_cards", "pg_rope", "pg_game"].every((id) => PG.INDEX[id] && PG.INDEX[id].playCat === "toy") && PG.INDEX.pg_cards.name === "トランプ" && PG.INDEX.pg_rope.name === "なわとび" && PG.INDEX.pg_game.name === "ゲームき", "オーナーの れい: トランプ・なわとび・ゲームき");
ok(PG.INDEX.dr_math.name === "すうがく ドリル" && PG.of("drill").some((it) => it.subject === "kokugo" && /かんじ/.test(it.name)), "こくごと すうがくの ドリル");
const names = new Set();
for (const it of PG.ITEMS) {
  ok(WEAR_ITEMS.includes(it) && ITEM_INDEX[it.id] === it && it.slot === HandItems.SLOT && it.slot === "hand", `${it.id}: もちもの（slot hand）`);
  ok(typeof WEAR[it.wear] === "function" && /^pg_/.test(it.wear), `${it.id}: 絵 WEAR.${it.wear}`);
  ok(!it.rare && !it.exclusive && Number.isInteger(it.price) && it.price >= 100 && it.price <= 12000, `${it.id}: ねだん ${it.price}`);
  ok(it.name && !kanji.test(it.name) && it.name.length <= 12 && !names.has(it.name), `${it.id}: なまえ「${it.name}」`); names.add(it.name);
  ok(it.desc && !kanji.test(it.desc) && it.desc.length <= 44, `${it.id}: せつめい「${it.desc}」`);
  ok(it.st && Object.keys(it.st).length && Object.entries(it.st).every(([k, v]) => STAT.has(k) && v > 0 && v <= 3), `${it.id}: つよさ`);
  ok(it.use && it.use.ask === "もつ" && it.use.yes === "もつ！" && it.use.can === "もてる" && it.use.say && !kanji.test(it.use.say), `${it.id}: おみせの ことば（もつ）`);
  ok(Array.isArray(it.col) && /^#[0-9A-F]{6}$/i.test(it.col[0]), `${it.id}: いろ`);
  ok(PG.isPlay(it.id) && PG.catOf(it.id) === it.playCat, `${it.id}: しゅるい`);
}
ok(!PG.isPlay("hi_balloon_red") && PG.catOf("hi_tote") === null, "ふうせん・バッグは あそびどうぐ では ない");
// ---- 2. 絵: 3人 × まえ／よこ／うしろ ----
const VB = Chara.VB;
for (const who of ["wanko", "gachan", "goji"]) for (const view of ["front", "side", "back"]) for (const it of PG.ITEMS) {
  const P = PROFILE[who], r = WEAR[it.wear]({ p: P, a: P.a, view, dx: 0, col: it.col, uid: "t" });
  ok(r && typeof r.top === "string" && r.top.startsWith("<g transform=") && !/undefined|NaN/.test(r.top) && !r.behind, `${who} ${view} ${it.id}: 絵`);
  ok(!/\bid="/.test(r.top), `${who} ${view} ${it.id}: id を つかわない`);
  ok(view !== "back" || !/<text/.test(r.top), `${who} ${view} ${it.id}: うしろむきは もじが ない（かがみに しない）`);
  const m = r.top.match(/^<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)">/);
  ok(m, `${who} ${view} ${it.id}: ばしょ`);
  const [x, y, sx, sy] = m.slice(1).map(Number), [x0, x1, y0, y1] = PA.box(it.art), h = HandItems.hand({ p: P, a: P.a, view });
  const xs = [x + sx * x0, x + sx * x1], ys = [y + sy * y0, y + sy * y1];
  ok(Math.min(...xs) >= VB.x + 1.5 && Math.max(...xs) <= VB.x + VB.w - 1.5 && Math.min(...ys) >= VB.y + 1.5 && Math.max(...ys) <= VB.y + VB.h - 1.5, `${who} ${view} ${it.id}: キャラの 絵の わくから でる ${xs.map(Math.round)} ${ys.map(Math.round)}`);
  ok(Math.sign(sx) === h.side && Math.abs(sx) === PA.SCALE && sy === PA.SCALE, `${who} ${view} ${it.id}: そとがわ（うしろむきは かがみ）`);
  ok(Math.hypot(x - h.x, y - h.y) <= 40, `${who} ${view} ${it.id}: 手から はなれすぎ`);
}
for (const it of PG.ITEMS) {
  const svg = Art.iconSvg("wear", it.id);
  ok(svg.startsWith("<svg") && svg.includes(it.col[0]) && !/undefined|NaN/.test(svg), `${it.id}: アイコン`);
}
// ---- 3. みせ ----
const law = BUY_SHOPS.lawson, sev = BUY_SHOPS.sevenbun, mee = BUY_SHOPS.ike_arcade;
ok(law.tabs.map((t) => t.join(":")).join() === "meal:ごはん,sweet:おやつ,drink:のみもの,play:あそび,book:ほん・ドリル" && sev.tabs.map((t) => t[0]).join() === "meal,sweet,drink,play,book", "コンビニの タブ 5こ（ごはん・おやつ・のみもの・あそび・ほん・ドリル）");
ok(/shop-tabs-wrap/.test(law.cls) && /shop-tabs-wrap/.test(sev.cls) && /shop-goods/.test(law.cls), "コンビニの タブは 2だんに おりかえす");
ok(mee.tabs.map((t) => t.join(":")).join() === "furn:かざり,bag:おかし,toy:おもちゃ" && /おもちゃ/.test(mee.hello[0]) && /shop-goods/.test(mee.cls), "けいひん カウンターの タブ「おもちゃ」（44px）");
ok(law.items().length === 16 && sev.items().length === 16 && law.items().every((x) => !PG.isPlay(x.id)), "タブ なしの しなもの（いちばんくじの クーポン）は たべもの 16 だけ");
for (const [shop, tabs] of Object.entries(PG.LINEUP)) for (const [tab, list] of Object.entries(tabs)) {
  const got = BUY_SHOPS[shop].items(tab);
  ok(got.map((x) => x.id).join() === list.join() && got.length, `${shop} ${tab}: しなもの`);
  ok(ShopUI.kindOf(shop, tab) === "wear", `${shop} ${tab}: もちもの として かう`);
  for (const x of got) {
    const base = PG.INDEX[x.id].price, want = PG.CONBINI.includes(shop) ? Math.round(base * ConbiniGoods.MUL) : base;
    ok(x.price === want && x.price === PG.price(shop, x.id) && x.slot === "hand" && x.wear === PG.INDEX[x.id].wear && x.use, `${shop} ${tab} ${x.id}: ねだん ${x.price}（${want}）`);
  }
}
ok(ShopUI.kindOf("lawson", "meal") === "bag" && ShopUI.kindOf("ike_arcade", "furn") === "furn" && ShopUI.kindOf("ike_arcade", "bag") === "bag" && ShopUI.kindOf("clothes", "hand") === "wear", "ほかの タブの しゅるいは そのまま");
for (const it of PG.ITEMS) ok(PG.shopsOf(it.id).length >= 1, `${it.id}: どこかで かえる`);
ok(PG.LINEUP.lawson.play.length === 3 && PG.LINEUP.sevenbun.play.length === 3 && PG.LINEUP.lawson.book.length === 10 && PG.LINEUP.sevenbun.book.length === 10 && PG.LINEUP.ike_arcade.toy.length === 5, "しなものの かず（あそび 3・ほん・ドリル 10・おもちゃ 5）");
ok(PG.LINEUP.lawson.book.every((id) => !PG.LINEUP.sevenbun.book.includes(id)) && PG.LINEUP.lawson.play.filter((id) => PG.LINEUP.sevenbun.play.includes(id)).join() === "pg_cards", "2つの コンビニで ほん・ドリルは ちがう（トランプ だけ どちらにも）");
for (const shop of PG.CONBINI) { const d = PG.LINEUP[shop].book.map((id) => PG.INDEX[id]); ok(d.filter((it) => it.subject === "kokugo").length >= 2 && d.filter((it) => it.subject === "sansu").length >= 2 && d.filter((it) => it.playCat === "book").length === 5, `${shop}: ほん 5・こくご と さんすうの ドリル`); }
ok(PG.LINEUP.ike_arcade.toy.includes("pg_game") && PG.LINEUP.ike_arcade.toy.every((id) => PG.catOf(id) === "toy"), "ゲームきは けいひん カウンター（けいひん）");
ok(BUY_SHOPS.clothes.items("hand").every((x) => !PG.isPlay(x.id)) && BUY_SHOPS.clothes.items("hand").some((x) => x.id === "hi_balloon_red"), "ようふくやさんの「もちもの」には ならばない（ふうせんは ある）");
// ---- 4. オーナーの 10%びき・ポイント ----
Save.d = Save.fresh();
const ownPrice = PG.price("lawson", "pg_cards");
ok(ownPrice === 300 && law.note(law.items("play")[0]) === "", "ふつうの ねだん 300・ひとこと なし");
ConbiniCard.card("lawson").has = true; ConbiniCard.card("lawson").owner = U.today();
const cards = law.items("play").find((x) => x.id === "pg_cards");
ok(ConbiniCard.owner("lawson") && cards.price === 270 && law.note(cards) === "オーナー さまは 10%びき（いつもは 300コイン）" && sev.items("play")[0].price === 300, "オーナーは 10%びき（その みせ だけ）・いつもの ねだん");
ok(/オーナー/.test(law.note(law.items("meal")[0])), "たべものの オーナーの ひとことは そのまま");
const pts0 = ConbiniCard.card("lawson").pts, extra = law.bought(cards, 2);
ok(typeof extra === "function" && ConbiniCard.card("lawson").pts > pts0, "かうと ポイントカードの ポイントが たまる");
// ---- 5. もたせる（1こで ひとり・わたす）----
Save.d = Save.fresh();
WearStock.add("pg_cards", 1);
ok(WearStock.put("wanko", "hand", "pg_cards").ok && HandItems.held("wanko") === "pg_cards" && PG.heldBy("wanko") === PG.INDEX.pg_cards, "わんこが トランプを もつ");
ok(PG.holders().map((h) => h.who + ":" + h.item.id).join() === "wanko:pg_cards" && PG.holders("toy").length === 1 && PG.holders("book").length === 0, "もって いる 子");
const pass = WearStock.put("gachan", "hand", "pg_cards");
ok(pass.ok && pass.from === "wanko" && HandItems.held("wanko") === null && HandItems.held("gachan") === "pg_cards", "1こ だけ なら わたす");
WearStock.add("bk_dino", 1); WearStock.put("goji", "hand", "bk_dino");
ok(PG.holders().map((h) => h.who).join() === "gachan,goji" && PG.holders("book")[0].item.id === "bk_dino", "ほんを もつ");
Save.d.chars.wanko.outfit.hand = "hi_balloon_red";
ok(PG.heldBy("wanko") === null, "ふうせんは あそびどうぐ では ない");
// ---- 6. ずかん・セーブ ----
for (const it of PG.ITEMS) {
  const s = ItemDexSources.source("wear", it);
  ok(s === PG.source(it.id) && s && !kanji.test(s.replace(/Meeときょれじゃ/, "")), `${it.id}: ずかんの ヒント「${s}」`);
  ok(PG.shopsOf(it.id).includes("ike_arcade") ? /けいひん カウンター/.test(s) : /コンビニ/.test(s) && PG.shopsOf(it.id).every((sh) => s.includes(BUY_SHOPS[sh].name)), `${it.id}: ヒントの みせ`);
}
const fresh = Save.fresh();
ok(Save.SCHEMA === 2 && Save.KEY === "pokapoka-town-save-v1" && !("playGoods" in fresh) && Object.values(fresh.chars).every((c) => !c.outfit.hand), "セーブの かたちは かわらない（もちものは outfit.hand）");

console.log(`✓ あそびどうぐ・ほん・ドリル（UI-105）: ${n} 項目`);
