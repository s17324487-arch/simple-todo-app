// いちばんくじ（ネリカスタウンの コンビニ 2つ・js/ichiban-kuji.js・js/kuji-art.js・js/kuji-ui.js・UI-55）の 検査。ブラウザ なしで
// ほんものと おなじ しくみ（1ロット 80まい・もどさない・賞ごとの ほんすう・ラストワン・はりつけ ひょう・D〜F は えらべる・G〜I は ランダム・はんけんの ダブルチャンス・ほかの おきゃくさん・つぎの ロット）、
// 1かい 1000コイン、2つの コンビニで ちがう けいひん、けいひんの いれさき（家具・もちもの・クーポン・シール）、クーポンの つかいかた、セーブ（こわれた ときも）、店の たな、絵（SVG）、ことばを しらべる。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { IchibanKuji: K, KujiArt: A, StickerBook: SB, Save: S } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/, INK = R.INK || "#1F1D1B";
const dupAttr = (s) => { for (const m of s.matchAll(/<[a-zA-Z][^<>]*>/g)) { const names = [...m[0].matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 90); } return ""; };
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && !dupAttr(s) && s.includes(INK);
const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const fresh = (coins = 0) => { S.d = S.fresh(); S.d.coins = coins; K.next = null; K.dcNext = null; };
const fmt = (no) => { const t = new Date(no * 864e5); return t.getUTCFullYear() + "-" + (t.getUTCMonth() + 1) + "-" + t.getUTCDate(); };
const back = (s, days) => { const d = K.st(), L = K.lot(s), b = (v) => (v ? fmt(K.dayNo(v) - days) : v); L.seen = b(L.seen); L.sold = b(L.sold); if (L.news) L.news.day = b(L.news.day); if (d.dc[s]) d.dc[s].day = b(d.dc[s].day); };
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

// ---- 1. しくみの かず（ほんものの いちばんくじと おなじ: 1ロット 80まい・A〜Cは 1ほん・ラストワン）----
ok(K.PRICE === 1000 && K.GRADES.join("") === "ABCDEFGHI" && Object.keys(K.PICK).join("") === "DEF", "1かい 1000コイン・賞は A〜I・えらべるのは D〜F");
ok(JSON.stringify(K.PLAN) === JSON.stringify({ A: [1], B: [1], C: [1], D: [1, 1, 1], E: [2, 2, 2], F: [3, 3, 3], G: [3, 3, 3, 3], H: [5, 5, 5, 5], I: [9, 9, 9] }) && sum(Object.fromEntries(Object.entries(K.PLAN).map(([g, a]) => [g, a.reduce((x, y) => x + y, 0)]))) === 80, "賞の ほんすう（A1 B1 C1 D3 E6 F9 G12 H20 I27 = 80まい）");
ok(K.KEEP === 10 && K.OTHERS_MAX === 4 && K.CATCHUP === 7 && K.DC_RATE === 0.02, "ほかの おきゃくさん（1にち 0〜4まい・のこり 10まい まで・7にちぶん）・ダブルチャンス 2%");
ok(K.STORES.join() === "lawson,sevenbun" && K.SERIES.every((x) => x.total === 80) && K.ITEMS.length === 50, "コンビニ 2つ・どちらも 80まい・けいひん 50しゅ（25しゅ ＋ ダブルチャンスしょう × 2）");
ok(new Set(K.ITEMS.map((it) => it.id)).size === K.ITEMS.length && K.ITEMS.every((it) => K.INDEX[it.id] === it && /^kj_(law|sev)_[a-z0-9]+$/.test(it.id)), "けいひんの id（かさならない・kj_<みせ>_）");
for (const X of K.SERIES) {
  const mine = K.ITEMS.filter((it) => it.store === X.id);
  ok(mine.length === 25 && X.lineup.length === 24 && X.lineup.every((id) => K.INDEX[id].store === X.id) && !X.lineup.includes(X.dcId) && X.lineup.includes(X.lastId), `${X.shop}: 25しゅ（コンプリートは 24しゅ・ダブルチャンスしょうは べつ）`);
  for (const g of K.GRADES) ok(X.ids[g].length === K.PLAN[g].length && X.ids[g].every((id, k) => X.plan[id] === K.PLAN[g][k] && K.INDEX[id].grade === g), `${X.shop} ${g}しょう: しゅるいと ほんすう`);
  ok(["A", "B", "C"].every((g) => K.INDEX[X.ids[g][0]].kind === "plush") && new Set(["A", "B", "C"].map((g) => K.INDEX[X.ids[g][0]].who)).size === 3 && ["goji", "wanko", "gachan"].every((w) => ["A", "B", "C"].some((g) => K.INDEX[X.ids[g][0]].who === w)), `${X.shop}: A〜Cしょうは ごじ・わんこ・がちゃんの ビッグ ぬいぐるみ`);
  ok(K.INDEX[X.lastId].kind === "plush" && K.INDEX[X.lastId].who === "trio" && K.INDEX[X.dcId].kind === "tapestry", `${X.shop}: ラストワンしょうは 3にんの ビッグ ぬいぐるみ・ダブルチャンスしょうは タペストリー`);
  ok(X.ids.D.every((id) => K.INDEX[id].kind === "cushion") && X.ids.F.every((id) => K.INDEX[id].kind === "bag") && X.ids.H.every((id) => K.INDEX[id].kind === "coupon") && X.ids.I.every((id) => K.INDEX[id].kind === "sheet"), `${X.shop}: D クッション・F エコバッグ・H クーポン・I シール`);
  ok(X.ids.H.filter((id) => !K.INDEX[id].item).length === 1 && X.ids.H.filter((id) => K.INDEX[id].item).every((id) => R.BUY_SHOPS[X.id].items("goods").some((f) => f.id === K.INDEX[id].item)), `${X.shop}: クーポンは その みせの しなもの 3しゅ ＋ なんでも 1こ`);
  for (const it of mine) {
    ok(it.name && !kanji.test(it.name) && it.name.length <= 20 && it.desc && !kanji.test(it.desc) && it.desc.length <= 60, `${it.id}: なまえ・せつめい（かな・ながさ）`);
  }
  for (const g of K.GRADES) ok(X.cats[g] && !kanji.test(X.cats[g]) && X.cats[g].length <= 12, `${X.shop} ${g}しょうの しゅるいの なまえ`);
}
// 2つの コンビニで けいひんが ちがう
const [LW, SV] = K.SERIES;
ok(LW.lineup.every((id, i) => K.INDEX[id].name !== K.INDEX[SV.lineup[i]].name) && LW.stickers.every(([id]) => !SV.stickers.some(([x]) => x === id)) && LW.ids.E.every((id) => K.INDEX[id].kind === "mug") && SV.ids.E.every((id) => K.INDEX[id].kind === "blanket") && LW.ids.G.every((id) => K.INDEX[id].kind === "acsta") && SV.ids.G.every((id) => K.INDEX[id].kind === "chibi"), "ローリソン と せぶんぶん で けいひんが ちがう（E: マグ／ブランケット・G: アクリル スタンド／ちび ぬいぐるみ）");
ok(K.INDEX[LW.ids.A[0]].who === "goji" && K.INDEX[SV.ids.A[0]].who === "wanko", "Aしょうは ローリソンが ごじ・せぶんぶんが わんこ");

// ---- 2. ゲームに いれる（家具・もちもの・シール・おみせに ならばない）----
for (const it of K.ITEMS) {
  if (it.furn) {
    const f = R.FURN_INDEX[it.id], kind = it.kind === "blanket" ? "rug" : it.kind === "tapestry" ? "wall" : "floor";
    ok(f && f.kind === kind && f.price === 0 && f.rare && f.exclusive === "kuji" && f.kujiPrize === it.store && f.w > 0 && f.h > 0 && f.comfort > 0 && typeof R.FURN_ART[it.id] === "function" && !R.ITEM_INDEX[it.id], `${it.id}: 家具（${kind}・おみせに ならばない）`);
    ok(!!f.figure === it.fig && R.FigureStand.isFigure(it.id) === it.fig, `${it.id}: フィギュア だいに ${it.fig ? "かざれる" : "かざれない"}`);
    ok(/いちばんくじ/.test(R.ItemDexSources.source("furn", f)) && R.ItemDexSources.source("furn", f).includes(K.BY[it.store].shop), `${it.id}: ずかんの ヒント`);
  } else if (it.kind === "bag") {
    const w = R.ITEM_INDEX[it.id];
    ok(w && w.slot === "hand" && w.wear === "kuji_bag" && w.col[0] === it.store && w.col[1] === it.who && w.price === 0 && w.exclusive === "kuji" && typeof R.WEAR.kuji_bag === "function" && !R.FURN_INDEX[it.id], `${it.id}: もちもの（エコバッグ）`);
    ok(/いちばんくじ/.test(R.ItemDexSources.source("wear", w)), `${it.id}: ずかんの ヒント`);
  } else ok(!R.FURN_INDEX[it.id] && !R.ITEM_INDEX[it.id], `${it.id}: 家具・服に はいらない（${it.kind}）`);
}
for (const shop of Object.values(R.BUY_SHOPS)) for (const tab of ["head", "face", "neck", "body", "back", "hand", "floor", "wall", "food", "tool", "goods", ""]) {
  let list = []; try { list = shop.items(tab) || []; } catch (e) { list = []; }
  ok(!list.some((i) => i && K.INDEX[i.id]), `おみせ ${shop.name} に いちばんくじの けいひんが ならぶ`);
}
// シール 12しゅ（シールちょう）
for (const X of K.SERIES) {
  ok(X.stickers.length === 6 && X.stickers.every(([id, name]) => SB.INDEX[id] && SB.INDEX[id].series === X.id && SB.INDEX[id].name === name && !kanji.test(name) && name.length <= 10 && /いちばんくじ/.test(SB.INDEX[id].hint)), `${X.shop}: シール 6しゅが シールちょうに ある（ヒントつき）`);
  for (const id of X.ids.I) { const it = K.INDEX[id]; ok(it.stickers.reduce((a, [, k]) => a + k, 0) === 4 && it.stickers.every(([sid]) => X.stickers.some(([x]) => x === sid)), `${id}: シールが 4まい（その みせの シール）`); }
  ok(X.stickers.every(([sid]) => X.ids.I.some((id) => K.INDEX[id].stickers.some(([x]) => x === sid))), `${X.shop}: 6しゅ ぜんぶが どれかの シートに ある`);
}
ok(SB.DESIGNS.filter((d) => /^stk_kj/.test(d.id)).length === 12 && SB.DESIGNS.slice(18, 30).every((d) => /^stk_kj(law|sev)_[a-z]+$/.test(d.id)), "シールちょうは 18しゅ ＋ いちばんくじの 12しゅ（ネリカス でんきの シールは その あと）");

// ---- 3. ひく（1000コイン・もどさない・はりつけ ひょう・はんけん）----
fresh(0);
ok(K.total("lawson") === 80 && JSON.stringify(K.tickets("lawson")) === JSON.stringify({ A: 1, B: 1, C: 1, D: 3, E: 6, F: 9, G: 12, H: 20, I: 27 }) && K.lot("lawson").no === 1, "はじめの ロット: 80まい");
ok(K.draw("lawson", 1) === null && K.st().draws === 0, "コインが たりないと ひけない");
fresh(5000); K.next = "A";
let r = K.draw("lawson", 1), L = K.lot("lawson");
ok(r && r.tickets.length === 1 && r.tickets[0].g === "A" && r.tickets[0].id === "kj_law_a" && r.tickets[0].first && S.d.coins === 4000 && S.d.furn.kj_law_a === 1, "1まい ひく: 1000コイン・Aしょうが 家具に");
ok(K.total("lawson") === 79 && K.tickets("lawson").A === 0 && L.left.kj_law_a === 0 && L.log.length === 1 && L.log[0][0] === "A" && L.log[0][1] === 1 && L.mine === 1 && K.st().stubs.lawson === 1 && K.st().draws === 1 && K.st().spent === 1000, "ひいた くじは もどらない・はりつけ ひょう・はんけん 1まい");
K.next = "A"; r = K.draw("lawson", 1);
ok(r && r.tickets[0].g !== "A", "もう ない 賞は でない（つぎの 賞の しらせは のこりが ある ときだけ）");
// D〜F は えらべる（あとで）
fresh(9000); K.next = "D"; r = K.draw("lawson", 1);
ok(r.tickets[0].g === "D" && r.tickets[0].pick && r.tickets[0].id === null && K.pendingOf("lawson").length === 1 && K.lot("lawson").hold.D === 1 && K.tickets("lawson").D === 2 && !Object.keys(S.d.furn).some((k) => k.startsWith("kj_law_d")), "Dしょう: ひいた あと えらぶ（まだ もらわない）");
ok(K.choices("lawson", "D").length === 3 && K.choose("lawson", "kj_law_e0") === null && K.choose("lawson", "kj_sev_d0") === null, "えらべるのは その賞の のこり だけ");
let c = K.choose("lawson", "kj_law_d1");
ok(c && c.id === "kj_law_d1" && S.d.furn.kj_law_d1 === 1 && K.lot("lawson").left.kj_law_d1 === 0 && !K.lot("lawson").hold.D && !K.pendingOf("lawson").length && K.choices("lawson", "D").join() === "kj_law_d0,kj_law_d2", "えらぶと もらえる・その しゅるいは のこりから へる");
ok(K.choose("lawson", "kj_law_d0") === null, "えらんで いない くじが ない ときは えらべない");
// ぜんぶ ひく → ラストワン・コンプリート
fresh(80000); r = K.draw("lawson", 80);
ok(r && r.tickets.length === 80 && S.d.coins === 0 && K.total("lawson") === 0 && r.tickets.filter((t) => t.last).length === 1 && r.tickets[79].last && r.tickets[79].lastPrize.item.id === "kj_law_l" && S.d.furn.kj_law_l === 1, "のこりを ぜんぶ ひくと さいごの 1まいで ラストワンしょう");
ok(K.lot("lawson").sold === R.U.today() && K.lot("lawson").log.length === 80 && K.st().stubs.lawson === 80, "うりきれ・はりつけ ひょう 80まい・はんけん 80まい");
for (const p of [...K.pendingOf("lawson")]) K.choose("lawson", K.choices("lawson", p[1])[0]);
ok(!K.pendingOf("lawson").length && K.complete("lawson") && K.st().done.lawson === R.U.today() && K.gotCount("lawson") === 24 && !K.got("kj_law_dc"), "1ロットを まるごと ひくと コンプリート（80000コイン・ダブルチャンスしょうは べつ）");
ok(K.draw("lawson", 1) === null, "うりきれの ひは ひけない");
K.sync("lawson"); ok(K.lot("lawson").no === 1 && K.total("lawson") === 0, "おなじ 日は つぎの ロットが こない");
back("lawson", 1); K.sync("lawson");
ok(K.lot("lawson").no === 2 && K.total("lawson") === 80 && !K.lot("lawson").log.length && K.lot("lawson").others === 0, "うりきれた つぎの 日に あたらしい ロット（ロット 2）");
// えらんで いない くじが のこって いる あいだは つぎの ロットに しない
fresh(80000); K.draw("lawson", 80);
ok(K.pendingOf("lawson").length === 18, "D〜F の 18まい（3＋6＋9）は えらぶ まで のこる");
back("lawson", 2); K.sync("lawson"); ok(K.lot("lawson").no === 1, "えらんで いない くじが あると つぎの ロットに しない");
for (const p of [...K.pendingOf("lawson")]) K.choose("lawson", K.choices("lawson", p[1])[0]);
K.sync("lawson"); ok(K.lot("lawson").no === 2, "えらび おわると つぎの ロット");

// ---- 4. ほかの おきゃくさん（まいにち 0〜4まい・のこり 10まい いかでは ひかない・7にちぶん まで）----
fresh(0); K.sync("sevenbun"); back("sevenbun", 3); K.sync("sevenbun");
let V = K.lot("sevenbun");
ok(V.others <= 12 && K.total("sevenbun") === 80 - V.others && V.log.every((e) => e[1] === 0) && V.log.length === V.others && V.news && V.news.n === V.others && V.news.day === R.U.today() && V.seen === R.U.today(), "3にち たつと ほかの おきゃくさんが ひく（0〜12まい・はりつけ ひょうは ほかの ひと）");
const snap = JSON.stringify(V); K.sync("sevenbun"); ok(JSON.stringify(K.lot("sevenbun")) === snap, "おなじ 日に 2かい みても かわらない");
fresh(0); K.sync("sevenbun"); back("sevenbun", 40); K.sync("sevenbun"); V = K.lot("sevenbun");
ok(V.others <= 28 && K.total("sevenbun") >= K.KEEP, "ながく こなくても 7にちぶん まで（28まい いか）");
// おなじ 日・おなじ ロット なら おなじ（たね つき）
const nOthers = V.others; fresh(0); K.sync("sevenbun"); back("sevenbun", 40); K.sync("sevenbun"); ok(K.lot("sevenbun").others === nOthers, "ほかの おきゃくさんの まい数は 日と ロットで きまる");
fresh(0); for (let i = 0; i < 60; i++) { K.sync("sevenbun"); back("sevenbun", 7); } K.sync("sevenbun");
ok(K.total("sevenbun") === K.KEEP && K.lot("sevenbun").sold === null, "のこり 10まいに なると ほかの おきゃくさんは ひかない（ラストワンは じぶんで）");

// ---- 5. ダブルチャンス（はんけん → おうぼ → つぎの 日に けっか）----
fresh(10000); K.draw("lawson", 3);
ok(K.st().stubs.lawson === 3 && K.enter("lawson") === 3 && !K.st().stubs.lawson && K.st().dc.lawson.n === 3 && K.st().dc.lawson.day === R.U.today(), "はんけん 3まいで おうぼ");
K.sync("lawson"); ok(K.st().dc.lawson && !K.st().dcLast.lawson, "おなじ 日は けっかが でない");
K.draw("lawson", 2); ok(K.enter("lawson") === 2 && K.st().dc.lawson.n === 5, "おなじ 日に また おうぼ すると たす");
K.rand = () => 0.99; back("lawson", 1); K.sync("lawson");
ok(!K.st().dc.lawson && K.st().dcLast.lawson.n === 5 && K.st().dcLast.lawson.win === false && !S.d.furn.kj_law_dc, "つぎの 日に けっか（はずれ）");
K.draw("lawson", 1); K.enter("lawson"); K.rand = () => 0.01; back("lawson", 1); K.sync("lawson");
ok(K.st().dcLast.lawson.win === true && S.d.furn.kj_law_dc === 1 && K.got("kj_law_dc") === 1, "あたり（2%）: タペストリーが とどく");
K.rand = () => Math.random();
K.draw("lawson", 1); K.enter("lawson"); K.dcNext = true; back("lawson", 1); K.sync("lawson");
ok(S.d.furn.kj_law_dc === 2 && K.dcNext === null, "PokaDebug の kujiDc（つぎの けっか）");
ok(K.enter("lawson") === 0, "はんけんが ない ときは おうぼ できない");

// ---- 6. クーポン（その コンビニで 1こ むりょう）----
fresh(0); K.st().coupons = { kj_law_h0: 1, kj_law_h3: 2, kj_sev_h0: 1 };
const karaage = R.BAG_INDEX.karaage, milk = R.BAG_INDEX.milk, oden = R.BAG_INDEX.oden;
let cp = K.couponFor("lawson", karaage);
ok(cp && cp.id === "kj_law_h0" && /からあげ むりょう けんで もらう/.test(cp.label), "からあげには からあげの クーポンが さき");
ok(cp.use() && S.d.bag.karaage === 1 && !K.st().coupons.kj_law_h0 && K.st().used === 1 && S.d.coins === 0, "クーポンで からあげ 1こ（コインは へらない）");
cp = K.couponFor("lawson", karaage); ok(cp && cp.id === "kj_law_h3", "からあげの クーポンが なくなると なんでも 1こ むりょう");
cp = K.couponFor("lawson", milk); ok(cp && cp.id === "kj_law_h3" && cp.use() && S.d.bag.milk === 1 && K.st().coupons.kj_law_h3 === 1, "なんでも 1こ むりょうは ほかの しなものにも");
ok(K.couponFor("lawson", oden) === null && K.couponFor("sevenbun", oden).id === "kj_sev_h0" && K.couponFor("sevenbun", karaage) === null, "クーポンは その コンビニの しなもの だけ");
ok(!K.useCoupon("kj_law_h0", "karaage") && !K.useCoupon("kj_sev_h0", "karaage") && !K.useCoupon("kj_law_a", "karaage"), "ない クーポン・ちがう しなもの・クーポンで ない ものは つかえない");
ok(typeof R.BUY_SHOPS.lawson.coupon === "function" && typeof R.BUY_SHOPS.sevenbun.coupon === "function" && !R.BUY_SHOPS.market.coupon, "コンビニの かいものに クーポンの いりぐち");
const shopSrc = readFileSync(new URL("../js/shop.js", import.meta.url), "utf8");
ok(/BUY_SHOPS\[shopId\]\.coupon\(it\)/.test(shopSrc) && /coupon\.use\(\)/.test(shopSrc), "かいものの まど（ShopUI.detail）で クーポンが つかえる");
// エコバッグ: 5こ もって いれば 100コイン もどる
fresh(0); for (let i = 0; i < 5; i++) K.grant("kj_law_f0");
const g6 = K.grant("kj_law_f0");
ok(R.WearStock.count("kj_law_f0") === 5 && g6.refund === 100 && S.d.coins === 100 && K.got("kj_law_f0") === 6, "エコバッグは 5こ まで（6こめは 100コイン もどる）");
const sh = K.grant("kj_sev_i1");
ok(SB.have("stk_kjsev_gachan") === 2 && SB.have("stk_kjsev_cocoa") === 1 && SB.have("stk_kjsev_oden") === 1 && /シールが 4まい/.test(sh.note), "シール シートは シールちょうの てもとに 4まい");
ok(K.grant("kj_sev_h2").note && K.st().coupons.kj_sev_h2 === 1, "クーポンけんは もちものの クーポンに");

// ---- 7. セーブ（たす だけ・こわれた ときも うごく）----
const F = S.fresh();
ok(F.kuji && JSON.stringify(F.kuji) === JSON.stringify({ lots: {}, got: {}, draws: 0, spent: 0, coupons: {}, used: 0, stubs: {}, dc: {}, dcLast: {}, done: {}, pending: [] }) && S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "Save.fresh に kuji・SCHEMA 2・KEY は そのまま");
const old = S.fresh(); delete old.kuji; old.v = 2; const mig = S.migrate(old); ok(mig.kuji && Array.isArray(mig.kuji.pending) && mig.kuji.lots && mig.v === 2, "まえの セーブに migrate が kuji を たす");
fresh(0); S.d.kuji = { lots: { lawson: { no: "x", left: { kj_law_a: 9, kj_law_d0: -3, kj_nope: 4 }, hold: { D: 5, A: 2 }, seen: "bad", log: [["A", 1], ["Z", 0], "x", ["B", 0]], others: 999, mine: -5, sold: 12 }, nope: {} }, got: { kj_law_a: 2, kj_x: 4, kj_law_b: "3" }, coupons: { kj_law_h0: 2, kj_law_a: 3 }, stubs: { lawson: 4, nope: 3 }, dc: { lawson: { n: 3, day: "bad" } }, pending: [["lawson", "D", 1], ["lawson", "Z", 1], ["nope", "D", 1], "x"], draws: "q" };
const Q = K.st();
ok(Q.lots.lawson.left.kj_law_a === 1 && Q.lots.lawson.left.kj_law_d0 === 0 && !("kj_nope" in Q.lots.lawson.left) && !Q.lots.nope && Q.lots.lawson.no === 1 && Q.lots.lawson.seen === R.U.today() && Q.lots.lawson.sold === null, "こわれた ロットを なおす（かずは 0〜ほんすう・しらない けいひん・ひにち）");
ok(Q.lots.lawson.log.length === 2 && Q.lots.lawson.log.every((e) => ["A", "B"].includes(e[0])) && Q.lots.lawson.others === 80 && Q.lots.lawson.mine === 0, "はりつけ ひょう・まい数を なおす");
ok(Q.pending.length === 1 && Q.lots.lawson.hold.D === 1 && !Q.lots.lawson.hold.A, "えらんで いない くじと hold を あわせる");
ok(Q.got.kj_law_a === 2 && Q.got.kj_law_b === 3 && !Q.got.kj_x && Q.coupons.kj_law_h0 === 2 && !Q.coupons.kj_law_a && Q.stubs.lawson === 4 && !Q.stubs.nope && !Q.dc.lawson && Q.draws === 0, "もらった かず・クーポン・はんけん・ダブルチャンスを なおす");

// ---- 8. 店の なか（レジの みぎの たな・てんいんの ことば・たなの タップ）----
for (const X of K.SERIES) {
  const I = R.STORE_INTERIORS[X.id], f = I.fixtures.find((x) => x[0] === "kuji_" + X.id);
  ok(f && f[1] === 7 && f[2] === 0 && f[3] === 3 && f[4] === 1 && f[5] === "いちばんくじ", `${X.shop}: レジの みぎの かべに くじの たな（3ます）`);
  // たなと ほかの 什器が かさならない・入口から レジ と たなの まえ（8,1・8,3）に あるいて いける
  const cells = new Set(); let clash = false;
  for (const [, x, y, w, d] of I.fixtures.concat([["counter", 4, 2, 3, 1]])) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const k = x + i + "," + (y + j); if (cells.has(k)) clash = true; cells.add(k); }
  ok(!clash, `${X.shop}: 什器が かさならない`);
  const walk = (x, y) => x >= 0 && x < 10 && y >= 0 && y < 12 && !(x === 5 && y === 1) && !cells.has(x + "," + y);
  const seen = new Set(["5,11"]), q = [[5, 11]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + "," + (y + dy); if (walk(x + dx, y + dy) && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy]); } } }
  ok(seen.has("8,1") && seen.has("8,3") && seen.has("5,3"), `${X.shop}: 入口から たなの まえ と レジの まえへ いける`);
  const svg = R.StoreIsoArt.model(R.StoreIso.fixtures(X.id).find((x) => x.kind === "kuji_" + X.id)).svg;
  ok(svgOk(svg) && /いちばんくじ/.test(svg) && /1000コイン/.test(svg), `${X.shop}: たなの 絵（いちばんくじ・1000コイン）`);
  const sc = { shopId: X.id, closed: false };
  const tc = K.talkChoice(sc); ok(tc && tc.label === "いちばんくじを ひく" && typeof tc.run === "function", `${X.shop}: てんいんさんに「いちばんくじを ひく」`);
  ok(K.isFixture({ kind: "kuji_" + X.id }) && !K.isFixture({ kind: "reachin" }), `${X.shop}: たなの しるし`);
}
ok(!K.talkChoice({ shopId: "market" }) && !K.tapFixture({ shopId: "market" }, { kind: "kuji_lawson" }), "ほかの おみせには くじが ない");
const storeSrc = readFileSync(new URL("../js/store-iso.js", import.meta.url), "utf8");
ok(/IchibanKuji\.talkChoice\(this\)/.test(storeSrc) && /IchibanKuji\.tapFixture\(this, f\)/.test(storeSrc) && /typeof f === "function"\) return f\(\)/.test(storeSrc), "StoreScene（js/store-iso.js）: てんいんの ことば・たなの タップ・あるいた あとの しごと");

// ---- 9. 絵（SVG）----
for (const it of K.ITEMS) {
  const s = A.pic(it.id), s2 = A.pic(it.id);
  ok(svgOk(s), `${it.id}: 絵の SVG（NaN なし・おなじ 属性が 2かい ない・線は INK）`);
  const a = ids(s); ok(new Set(a).size === a.length && ids(s2).every((x) => !a.includes(x)), `${it.id}: SVG の id（かさならない・よぶ たびに あたらしい）`);
  if (it.kind === "plush") ok(/viewBox="0 0 (1[0-9]{2}) (1[0-9]{2})"/.test(s) && !/<text/.test(s) && /#FFFDF5/.test(s), `${it.id}: ビッグ ぬいぐるみ（タグつき・もじ なし）`);
  if (it.furn && it.kind !== "blanket") { const fa = R.FURN_ART[it.id](); ok(fa.startsWith("<svg") && !/NaN|undefined/.test(fa) && !dupAttr(fa), `${it.id}: へやの 絵（FURN_ART）`); }
}
for (const X of K.SERIES) for (const [id] of X.stickers) {
  const s = R.StickerArt.piece(id);
  ok(svgOk(s) && /viewBox="0 0 100 100"/.test(s) && !/<text/.test(s) && s.includes('fill="#FFFFFF" stroke="#FFFFFF"'), `シール ${id}（100×100・しろい ふち・もじ なし）`);
}
for (const s of K.STORES) { const b = A.box(s); ok(svgOk(b), `${s}: くじの はこの 絵`); }
// エコバッグ: 3人 × 4むき で もてる
for (const id of [...LW.ids.F, ...SV.ids.F]) for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
  const s = R.Chara.svg(who, { pose: "idle_01", dir, outfit: { hand: id }, color: "soft" });
  ok(svgOk(s) && s.length > R.Chara.svg(who, { pose: "idle_01", dir, outfit: {}, color: "soft" }).length, `${id}: ${who} ${dir} で もてる`);
}
// へやの 立体（ブランケットは ラグの かたち）と さわる うごき
for (const it of K.ITEMS.filter((x) => ["plush", "cushion", "blanket"].includes(x.kind))) {
  const m = R.HomeDesign.model(it.id, { id: it.id });
  ok(m && m.full && svgOk(m.full) && m.w > 0 && m.h > 0, `${it.id}: へやの 立体`);
  if (it.kind !== "blanket") ok(R.FurnLive.has ? R.FurnLive.has(it.id) : R.FURN_INDEX[it.id].interactive, `${it.id}: さわると うごく`);
}
const artSrc = readFileSync(new URL("../js/kuji-art.js", import.meta.url), "utf8");
ok(/"kuji:" \+ it\.id \+ ":" \+ px/.test(artSrc) && /Math\.ceil\(\(f\.w \* s \* \(G\.px \|\| 2\)\) \/ 8\) \* 8/.test(artSrc), "さわる ときの 絵の キャッシュは しゅるいと ピクセル（8 の ばいすう）だけ");
const uiSrc = readFileSync(new URL("../js/kuji-ui.js", import.meta.url), "utf8");
ok(/URLS\[id\] \|\| \(URLS\[id\] = U\.svgUrl\(KujiArt\.pic\(id\)\)\)/.test(uiSrc) && !/SvgCache\.get\(/.test(uiSrc), "がめんの 絵は けいひん 1しゅ 1つ（かずが ふえない）");
ok(!/kira|sparkle|twinkle|glitter/i.test(artSrc + uiSrc), "キラキラの えんしゅつは ない（UI-50）");

// ---- 10. PokaDebug ----
const D = R.PokaDebug;
fresh(3000);
ok(D.kujiNext("B") && !D.kujiNext("Z") && D.kuji("lawson").left === 80 && D.kuji("nope") === null, "PokaDebug.kuji・kujiNext");
K.draw("lawson", 1); let st = D.kuji("lawson");
ok(st.left === 79 && st.got.includes("kj_law_b") && st.log[0][0] === "B" && st.stubs === 1 && st.lineup.length === 24 && st.ids.A[0] === "kj_law_a" && st.price === 1000, "PokaDebug.kuji の ようす");
ok(D.kujiLeft("lawson", 2) === 2 && D.kuji("lawson").others === 77 && D.kujiDays("lawson", 1) && D.kujiDc(false) && K.dcNext === false && D.kujiFast(5) && R.KujiUI.ui.speed === 5, "PokaDebug.kujiLeft・kujiDays・kujiDc・kujiFast");
K.dcNext = null; R.KujiUI.ui.speed = 1;

// ---- 11. そとへの つうしん なし・ことば ----
for (const f of ["../js/ichiban-kuji.js", "../js/kuji-art.js", "../js/kuji-ui.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん しない`);
  const code = src.split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ [^"`]*$/, "")).join("\n");
  for (const m of code.matchAll(/"([^"\n]*)"|`([^`\n]*)`/g)) { const t = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ""); ok(!kanji.test(t), `${f} の ことばに 漢字: ${t.slice(0, 40)}`); }
}
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const pos = (f) => html.indexOf(`<script src="js/${f}"></script>`);
ok(["kuji-art.js", "ichiban-kuji.js", "kuji-ui.js"].every((f) => pos(f) > 0 && sw.includes(`"./js/${f}"`)) && pos("neri-shops.js") < pos("kuji-art.js") && pos("sticker-book.js") < pos("kuji-art.js") && pos("figure-stand.js") < pos("kuji-art.js") && pos("kuji-art.js") < pos("ichiban-kuji.js") && pos("ichiban-kuji.js") < pos("kuji-ui.js") && pos("kuji-ui.js") < pos("debug.js"), "index.html と sw.js に とうろく（じゅんばん）");
console.log(`Ichiban kuji (Nerikasu convenience stores): ${n} checks — 2 stores x 80-ticket lots (A1 B1 C1 D3 E6 F9 G12 H20 I27 + last one), 1000 coins per ticket, no replacement, stub board, D-F picked from what is left, G-I random, last one on the final ticket, whole lot = 80000 coins = complete, next lot the day after sold out, other customers 0-4 a day (stop at 10 left, 7-day catch-up, seeded), double chance from stubs (next day, 2%), coupons only in their store, bags (5 cap, refund), sticker sheets into the sticker book, save repair, store shelf/talk/tap, SVG art, kana text.`);
