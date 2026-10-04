// コンビニの ポイントカード（js/conbini-card.js・js/conbini-card-art.js・UI-85）の 検査。ブラウザ なしで:
// とうろく・セーブ（Save.d.conbiniCard・まえの セーブ・こわれた かず）・ポイント（200コインで 10・もちこし・みせごと・クーポンは 0・いちばんくじ）・
// こうかん（ねだん・たりない・オーナーは 1かい・ひみつ）・オーナー（10%びき・ていねいな てんいんさん・みせごと）・クレーン チケット（プッシャー いがい・コインは へらない・かえす）・
// おてつだい レベル けん（+10／+25・30 まで・ごほうび）・バスの ていきけん（はんとし・のばす・ただ）・くみこみ（てんいん・もちもの・おみせに はいる）・絵・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ConbiniCard: C, ConbiniCardArt: A, ConbiniGoods: CG, Save: S, BUY_SHOPS, ShopRewards, SHOP_LV_REP, PrizeArcade: PA, IchibanKuji: K, Transit, Menu, StoreScene, PokaDebug, U } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/, INK = "#1F1D1B";
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = (coins = 0) => { S.d = S.fresh(); S.d.coins = coins; return S.d; };
const item = (shop, id) => BUY_SHOPS[shop].items().find((i) => i.id === id);
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && !/\sid="/.test(s) && s.includes(INK) &&
  (s.match(/<g\b/g) || []).length === (s.match(/<\/g>/g) || []).length && (s.match(/<text\b/g) || []).length === (s.match(/<\/text>/g) || []).length;

// ---- 1. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("conbini-card-art.js") > at("store-iso.js") && at("conbini-card.js") > at("conbini-card-art.js") && at("store-iso.js") > at("ichiban-kuji.js") && at("ichiban-kuji.js") > at("conbini-goods.js") && at("conbini-goods.js") > at("menu.js") && at("menu.js") > 0 && at("conbini-card.js") < at("debug.js"),
    "index.html: conbini-goods.js・ichiban-kuji.js・store-iso.js・menu.js の あと（絵 → しくみ）");
  ok(sw.includes('"./js/conbini-card-art.js"') && sw.includes('"./js/conbini-card.js"'), "sw.js の FILES に 2つ");
  ok(C.STORES.join() === "lawson,sevenbun" && C.PER === 200 && C.PTS === 10 && C.OFF === 0.9 && C.BUS_MONTHS === 6, "2つの コンビニ・200コインで 10ポイント・オーナーは 10%びき・ていきけんは 6かげつ");
}

// ---- 2. セーブ ----
{
  const f = S.fresh();
  ok(JSON.stringify(f.conbiniCard) === JSON.stringify(C.fresh()) && S.SCHEMA === 2, "Save.fresh() の conbiniCard は ConbiniCard.fresh() と おなじ・SCHEMA は 2 の まま");
  const old = S.fresh(); delete old.conbiniCard; old.v = 2;
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.conbiniCard && m.conbiniCard.shops.lawson.pts === 0 && m.conbiniCard.tickets.crane === 0 && m.conbiniCard.bus.until === "", "まえの セーブ（conbiniCard なし）にも できる");
  fresh(); S.d.conbiniCard = { shops: { lawson: { has: 1, pts: "x", carry: 999, total: -5, got: [] }, sevenbun: null }, tickets: { crane: 2.7, lv10: -1 }, bus: { until: "あした" }, log: {} };
  const d = C.st();
  ok(d.shops.lawson.has === true && d.shops.lawson.pts === 0 && d.shops.lawson.carry === 199 && d.shops.lawson.total === 0 && !Array.isArray(d.shops.lawson.got) && d.shops.sevenbun.has === false, "こわれた カードは なおす");
  ok(d.tickets.crane === 2 && d.tickets.lv10 === 0 && d.tickets.lv25 === 0 && d.bus.until === "" && Array.isArray(d.log), "こわれた チケット・ていきけん・きろくも なおす");
  fresh(); S.d.conbiniCard = "?"; ok(C.st().shops.sevenbun.pts === 0, "conbiniCard が おかしくても つくりなおす");
}

// ---- 3. ポイント ----
{
  fresh();
  let r = C.earn("lawson", 150);
  ok(r.first && r.pts === 0 && r.carry === 150 && r.need === 50 && C.card("lawson").has, "はじめての かいもので カードを つくる・200 に たりない ぶんは もちこし");
  r = C.earn("lawson", 60);
  ok(!r.first && r.pts === 10 && r.now === 10 && r.carry === 10, "もちこしと あわせて 200 → 10ポイント");
  r = C.earn("lawson", 1000);
  ok(r.pts === 50 && r.now === 60 && r.carry === 10 && C.card("lawson").total === 60 && C.card("lawson").spent === 1210, "1000コイン → 50ポイント・これまで・つかった コイン");
  ok(C.card("sevenbun").pts === 0 && !C.card("sevenbun").has, "せぶんぶんの カードは べつ");
  ok(C.earn("lawson", 0) === null && C.earn("lawson", -50) === null && C.earn("market", 500) === null && C.card("lawson").pts === 60, "0・マイナス・ほかの おみせは ポイントなし");
  C.card("lawson").pts = 90; C.card("lawson").carry = 0;
  r = C.earn("lawson", 200);
  ok(r.opened.length === 1 && r.opened[0].id === "crane", "こうかん できる ように なった けいひんを しらせる");
  // おみせの まどで かう（ShopUI → bought）
  fresh();
  const kara = item("lawson", "karaage"), done = BUY_SHOPS.lawson.bought(kara, 4);
  ok(typeof done === "function" && C.card("lawson").pts === 10 && C.card("lawson").carry === 40, "おみせの まど: からあげ 60 × 4 = 240コイン → 10ポイント（のこり 40）");
  BUY_SHOPS.sevenbun.bought(item("sevenbun", "oden"), 3);
  ok(C.card("sevenbun").pts === 10 && C.card("sevenbun").carry === 4 && C.card("lawson").pts === 10, "せぶんぶんで かうと せぶんぶんの カード（おでん 68 × 3 = 204）");
  // クーポン（むりょう）は かいもの では ない
  R.IchibanKuji.st().coupons.kj_law_h0 = 1;
  const cp = BUY_SHOPS.lawson.coupon(kara);
  ok(cp && cp.use() && C.card("lawson").pts === 10 && C.card("lawson").carry === 40, "クーポンで もらっても ポイントは ふえない");
  ok(/if \(coupon\) body\.append\(UI\.btn\(coupon\.label, \(\) => \{\s*if \(!coupon\.use\(\)\)[^}]*\}\s*Sound\.se\("buy"\); Save\.mark\(\); m\.close\(\); onBuy\(\);/.test(read("js/shop.js")), "クーポンの ボタンは bought を よばない（shop.js）");
  // いちばんくじ（1000コイン）
  fresh(5000); K.next = null;
  const k = K.draw("lawson", 2);
  ok(k && k.price === 2000 && k.points && k.points.pts === 100 && C.card("lawson").pts === 100, "いちばんくじ 2まい（2000コイン）→ 100ポイント");
  S.d.coins = 10; ok(K.draw("sevenbun", 1) === null && C.card("sevenbun").pts === 0, "コインが たりない くじは ポイントなし");
}

// ---- 4. こうかん ----
{
  fresh();
  const P = C.prizes("lawson");
  // 200・500・800・3000 の ごわが コラボ（みせごとに ちがう）は js/conbini-collab.js（UI-86・tools/check-conbini-collab.mjs）
  const base = P.filter((p) => !p.collab);
  ok(JSON.stringify(base.map((p) => [p.id, p.cost])) === JSON.stringify([["crane", 100], ["lv10", 1000], ["lv25", 2000], ["bus", 5000], ["owner", 10000]]), "けいひん: 100 クレーン チケット・1000 レベル +10・2000 レベル +25・5000 ていきけん・10000 ひみつ");
  ok(JSON.stringify(C.prizes("sevenbun").map((p) => p.id)) === JSON.stringify(P.map((p) => p.id)) && P.filter((p) => p.secret).map((p) => p.id).join() === "owner" && P.every((p, i) => !i || P[i - 1].cost < p.cost), "2つの みせで おなじ だん・ひみつは 10000 だけ・ねだんの じゅん");
  ok(C.exchange("lawson", "crane") === null, "カードが ない ときは こうかん できない");
  C.card("lawson").has = true; C.card("lawson").pts = 99;
  ok(C.exchange("lawson", "crane") === null && C.card("lawson").pts === 99, "ポイントが たりない");
  C.card("lawson").pts = 30000;
  const t = C.exchange("lawson", "crane");
  ok(t && t.left === 29900 && C.tickets("crane") === 1 && C.card("lawson").used === 100 && C.card("lawson").got.crane === 1 && S.d.conbiniCard.log[0][2] === "crane", "クレーン チケット: 100 へって チケット 1まい・きろく");
  ok(C.exchange("lawson", "lv10") && C.exchange("lawson", "lv25") && C.tickets("lv10") === 1 && C.tickets("lv25") === 1, "レベル けんは もちものに");
  ok(C.exchange("lawson", "nope") === null, "しらない けいひん");
  const o = C.exchange("lawson", "owner");
  ok(o && C.owner("lawson") && C.card("lawson").owner === U.today() && !C.owner("sevenbun"), "ひみつ = オーナー けん: その みせの オーナーに なる（せぶんぶんは まだ）");
  ok(C.exchange("lawson", "owner") === null && C.card("lawson").pts === 30000 - 100 - 1000 - 2000 - 10000, "オーナーは 1かい だけ");
  ok(C.cardName("lawson") === "ローリソン オーナー カード" && C.cardName("sevenbun") === "せぶんぶん ポイントカード", "カードは 4しゅ（ポイントカード → オーナー カード）");
}

// ---- 5. オーナー: 10%びき・ていねいな てんいんさん ----
{
  fresh();
  const base = (shop, id) => item(shop, id).price;
  const before = { kara: base("lawson", "karaage"), bento: base("lawson", "cv_bento_karaage"), oden: base("sevenbun", "oden") };
  ok(before.kara === 60 && before.bento === 135 && before.oden === 68, "ふだんは コンビニの ねだん（1.5ばい）");
  ok(BUY_SHOPS.lawson.hello[0] === "いらっしゃいませ〜！ あげたての からあげ、いかが？", "ふだんの あいさつ");
  C.card("lawson").has = true; C.card("lawson").owner = U.today();
  ok(base("lawson", "karaage") === 54 && base("lawson", "cv_bento_karaage") === 122 && base("sevenbun", "oden") === 68, "オーナーの みせだけ 10%びき（60 → 54・135 → 122）");
  ok(BUY_SHOPS.lawson.items().every((it) => it.price === Math.max(1, Math.round(Math.round(it.basePrice * 1.5) * 0.9))) && CG.price0 && CG.price("lawson", { price: 40 }) === 54, "ぜんぶの しなものが 10%びき（ConbiniGoods.price を つつむ）");
  ok(BUY_SHOPS.lawson.hello === C.POLITE.lawson && BUY_SHOPS.sevenbun.hello !== C.POLITE.sevenbun && C.POLITE.lawson.every((t) => /オーナー/.test(t) && /ございます|くださいませ|おります/.test(t)), "オーナーには とても ていねいな あいさつ（その みせ だけ）");
  ok(/10%びき（いつもは 60コイン）/.test(BUY_SHOPS.lawson.note(item("lawson", "karaage"))) && BUY_SHOPS.sevenbun.note(item("sevenbun", "oden")) === "", "しなものの せつめいに 10%びき");
  const keep = BUY_SHOPS.sevenbun.hello; BUY_SHOPS.sevenbun.hello = ["テスト"]; ok(BUY_SHOPS.sevenbun.hello[0] === "テスト", "あいさつを かきかえても こわれない"); BUY_SHOPS.sevenbun.hello = keep;
  // オーナーで かうと ポイントは はらった コイン（10%びきの あと）
  const r = BUY_SHOPS.lawson.bought(item("lawson", "cv_bento_karaage"), 2);
  ok(typeof r === "function" && C.card("lawson").carry === 44 && C.card("lawson").pts === 10, "ポイントは はらった コイン（122 × 2 = 244）");
  const iso = read("js/conbini-card.js");
  ok(/StoreScene\.prototype\.enter = async function/.test(iso) && StoreScene.prototype.enter.toString().includes("POLITE"), "おみせに はいると オーナーに ていねいな あいさつ");
}

// ---- 6. クレーン チケット ----
{
  fresh(1000);
  const back = { venue: "arcade", floor: 1, back: { map: "city", x: 1, y: 1, dir: "down" } }, push = PA.machines.findIndex((m) => m.type === "pusher");
  ok(push >= 0 && PA.ticketsFor(0) === 0, "チケットが ない ときは 0");
  C.giveTicket("crane", 2);
  ok(PA.ticketsFor(0) === 2 && PA.ticketsFor(push) === 0, "コイン プッシャー いがいの 台で つかえる");
  ok(PA.start(push, back, "ticket") === null && C.tickets("crane") === 2 && S.d.coins === 1000, "プッシャーは チケットで はじめられない");
  const run = PA.start(0, back, "ticket");
  ok(run && run.ticket === true && C.tickets("crane") === 1 && S.d.coins === 1000 && S.d.arcade.active.id === run.id, "チケットで はじめる: コインは へらない・チケット 1まい へる");
  ok(PA.finish(run, { got: [] }) && S.d.arcade.active === null, "チケットの 1かいも ふつうに おわる");
  const run2 = PA.start(1, back);
  ok(run2 && !run2.ticket && S.d.coins === 900 && C.tickets("crane") === 1, "コインで あそぶ ときは いつもの 100コイン");
  PA.finish(run2, { got: [] });
  S.d.arcade.active = { id: "old-t", machine: 0, back, strong: true, cp: null, ticket: true }; PA.norm();
  ok(S.d.arcade.active === null && C.tickets("crane") === 2 && S.d.coins === 900 && S.d.arcade.refundedTicket === 1 && !S.d.arcade.refunded, "台が いれかわった チケットの 1かいは チケットを かえす");
  C.st().tickets.crane = 0;
  ok(PA.start(0, back, "ticket") === null && S.d.coins === 900, "チケットが ない ときは はじめない");
  const src = read("js/crane-scene.js");
  ok(/UI\.ask\(text, \[this\.PRICE \+ "コインで あそぶ", `チケットで あそぶ（のこり \$\{tickets\}まい）`, "やめる"\]\)/.test(src) && /チケットで もういちど/.test(src) && /refundedTicket/.test(src), "台の まど: チケットで あそぶ・けっか: チケットで もういちど・かえした しらせ");
}

// ---- 7. おてつだい レベル けん ----
{
  fresh();
  ok(C.useLv("lv10", "crepe") === null, "けんが ない ときは つかえない");
  C.giveTicket("lv10", 2); C.giveTicket("lv25", 1);
  const T = C.lvTargets("lv10");
  ok(T.length === Object.keys(ShopRewards.themes).length && T.length >= 13 && T.every((t) => t.from === 1 && t.to === 11 && !kanji.test(t.name)), "えらべる おみせ（ぜんぶ Lv.1 → Lv.11）: " + T.length);
  let r = C.useLv("lv10", "crepe");
  ok(r && r.from === 1 && r.to === 11 && ShopRewards.level(S.d.shops.crepe) === 11 && S.d.shops.crepe.rep === SHOP_LV_REP[11] && C.tickets("lv10") === 1, "+10: Lv.1 → Lv.11・ひょうばんも そろえる");
  ok(r.prizes.map((p) => p.level).join() === "5,10" && S.d.shopRewards.shop_crepe_5 && S.d.furn.shop_crepe_10 === 1, "とどいた レベルの ごほうび（Lv5・10）も もらえる");
  r = C.useLv("lv25", "crepe");
  ok(r && r.from === 11 && r.to === 30 && r.prizes.map((p) => p.level).join() === "15,30" && C.tickets("lv25") === 0, "+25: Lv.11 → 30（30 まで）・Lv15・30 の ごほうび");
  ok(C.useLv("lv10", "crepe") === null && C.tickets("lv10") === 1, "Lv.30 の おみせには つかえない（けんは のこる）");
  S.d.shops.bakery.rep = SHOP_LV_REP[8]; S.d.shops.bakery.lv = 8;
  r = C.useLv("lv10", "bakery");
  ok(r && r.from === 8 && r.to === 18 && C.tickets("lv10") === 0, "とちゅうの レベルからも +10");
  ok(C.useLv("lv10", "nope") === null && C.useLv("lv99", "cake") === null, "しらない おみせ・しらない けん");
}

// ---- 8. バスの ていきけん ----
{
  fresh();
  const d = (y, m, dd) => new Date(y, m - 1, dd);
  ok(C.dstr(C.lastDay(d(2026, 10, 4), 6)) === "2027-4-3" && C.dstr(C.lastDay(d(2026, 8, 31), 6)) === "2027-2-27" && C.dstr(C.lastDay(d(2027, 1, 1), 6)) === "2027-6-30", "はんとし: 10/4 → 4/3・8/31 → 2/27・1/1 → 6/30");
  ok(!C.busFree() && C.busText() === "" && Transit.busPass() === "", "ていきけんが ない ときは バス 100コイン");
  C.card("lawson").has = true; C.card("lawson").pts = 12000;
  const r = C.exchange("lawson", "bus"), last = C.dstr(C.lastDay(new Date(), 6));
  ok(r && r.until === last && C.busFree() && C.busFree(last) && !C.busFree(C.dstr(new Date(Date.now() + 400 * 864e5))), "ていきけん: きょうから はんとし ただ（" + last + " まで）");
  ok(/^\d{4}ねん \d{1,2}がつ \d{1,2}にち まで$/.test(C.busText()) && Transit.busPass() === C.busText(), "のこりの ことば: " + C.busText());
  const r2 = C.exchange("lawson", "bus"), next = new Date(+r.until.split("-")[0], +r.until.split("-")[1] - 1, +r.until.split("-")[2] + 1);
  ok(r2 && r2.until === C.dstr(C.lastDay(next, 6)), "もって いる うちに こうかんすると その つぎの 日から はんとし のばす（" + r2.until + "）");
  S.d.conbiniCard.bus.until = "2000-1-1"; ok(!C.busFree(), "きれた ていきけん");
  const src = read("js/transit.js");
  ok(/const pass = !!this\.busPass\(\);/.test(src) && /if \(!pass && Save\.d\.coins < this\.BUS_FARE\)/.test(src) && /if \(pass\) UI\.toast\("バスの ていきけんで のったよ", "good"\); else Save\.d\.coins -= this\.BUS_FARE;/.test(src), "バス: ていきけんが あれば はらわない（transit.js）");
}

// ---- 9. くみこみ（てんいんさん・もちもの）----
{
  fresh();
  const iso = read("js/store-iso.js");
  ok(/const card=typeof ConbiniCard!=="undefined"&&ConbiniCard\.talkChoice\(this\);/.test(iso) && /\.\.\.\(card\?\[card\.label\]:\[\]\)/.test(iso) && /else if\(card&&picked===card\.label\)\{await card\.run\(\);Save\.write\(\);\}/.test(iso), "てんいんさんに はなす: 「ポイントカード」（store-iso.js）");
  ok(C.talkChoice({ shopId: "lawson" }).label === "ポイントカード" && C.talkChoice({ shopId: "sevenbun" }) && C.talkChoice({ shopId: "bakery" }) === null, "コンビニ 2つ だけ");
  ok(Menu.bag.toString().includes("bagKeys") && typeof C.bagKeys === "function", "もちものの「だいじな もの」に カード・チケット・ていきけん");
  ok(C.make("sevenbun") && C.card("sevenbun").has && !C.make("sevenbun"), "カードを つくる（むりょう・1かい）");
}

// ---- 10. 絵 ----
{
  const cards = ["lawson", "sevenbun"].flatMap((s) => [A.big(s, false), A.big(s, true)]);
  ok(cards.every(svgOk) && new Set(cards).size === 4 && cards.every((s) => s.includes('viewBox="0 0 200 126"')), "カードの 絵 4しゅ（ちがう・id なし・INK）");
  const icons = ["lawson", "sevenbun"].flatMap((s) => [A.icon(s, false), A.icon(s, true)]);
  ok(icons.every(svgOk) && new Set(icons).size === 4 && icons.every((s) => s.includes('viewBox="0 0 64 64"')), "もちものの アイコン 4しゅ");
  ok(/ローリソン/.test(cards[0]) && /オーナー カード/.test(cards[1]) && /せぶんぶん/.test(cards[2]) && /ポイントカード/.test(cards[2]), "カードに みせの なまえ");
  const pz = C.prizes("lawson").map((p) => C.icon("lawson", p)).concat(A.prize("secret"));
  ok(pz.every(svgOk) && new Set(pz).size === pz.length, "けいひんの アイコン（" + pz.length + "しゅ・ひみつ）");
}

// ---- 11. ことば ----
{
  const words = [...C.PRIZES.flatMap((p) => [p.name, p.desc]), ...Object.values(C.POLITE).flat()];
  ok(words.every((t) => !kanji.test(t)), "けいひん・ていねいな あいさつは ひらがな・カタカナ");
  const code = read("js/conbini-card.js").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  ok(!kanji.test(code), "conbini-card.js の がめんの ことばに 漢字が ない（コメントの ほか）");
  ok(!kanji.test(read("js/conbini-card-art.js").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n")), "conbini-card-art.js の もじも ひらがな・カタカナ");
  const css = read("css/style.css");
  ok(/\.cc-trade \{[^}]*min-height: 44px/.test(css) && /\.cc-lv-btn \{[^}]*min-height: 44px/.test(css) && /\.cc-key \.cc-use \{[^}]*min-height: 44px/.test(css), "ボタンは 44px いじょう");
}

// ---- 12. PokaDebug ----
{
  fresh();
  const a = PokaDebug.conbiniCard("lawson", { pts: 1500, tickets: { crane: 3 }, busUntil: "2099-1-1" });
  ok(a.has && a.pts === 1500 && a.tickets.crane === 3 && a.bus.free && a.prizes.filter((p) => p.can && !p.kinds).map((p) => p.id).join() === "crane,lv10" && a.sample.price === 60, "PokaDebug.conbiniCard: きめる・ようす");
  const b = PokaDebug.conbiniCard("lawson", { owner: true });
  ok(b.owner && b.sample.price === 54 && /オーナー/.test(b.hello) && b.name === "ローリソン オーナー カード", "PokaDebug.conbiniCard: オーナー");
  ok(PokaDebug.conbiniCard("nope") === null, "しらない おみせは null");
}

console.log(`✓ conbini card (UI-85): ${n} checks（とうろく・セーブ・ポイント〔200で 10・もちこし・くじ・クーポンは 0〕・こうかん・オーナー〔10%びき・ていねい〕・クレーン チケット・レベル けん・ていきけん・くみこみ・絵・ことば・PokaDebug）`);
