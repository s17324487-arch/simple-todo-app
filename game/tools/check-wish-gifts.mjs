// おねがいの おれいの しな（js/wish-gifts.js・js/wish-gift-art.js・UI-70）の 検査。
// ブラウザ なしで: おてがみ 24まい（ひらがな だけ・2ぎょう・ぶんせつの スペース）・いし 9・アクセサリー 6・てづくり 3・
// でる かくりつ（15%・8かい なければ つぎは かならず ＝ だいたい 5かいに 1かい）・まだ ない ものから えらぶ・ぜんぶ もって いたら てがみ・
// もらう（家具・服・きろく）・セーブ（なくても こわれて いても なおす）・家具と 服の とうろく（おみせに ならばない・フィギュア だい・ヘアピン）・
// 絵（ふうとう・らくがき・いし・つる・え・けん・3人 × 4むきの アクセサリー・NaN と id）・すまほの「たからもの」・くみこみ・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { WishGifts: W, WishGiftArt: A, GowagaWish: GW, Save: S, FURN_INDEX, ITEM_INDEX, WEAR, Art, Chara, HeadPair, FigureStand, BUY_SHOPS, Smaho, ItemDexSources, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = () => { S.d = S.fresh(); return S.d; };
const svgOk = (s, m) => ok(/^<svg[\s\S]*<\/svg>$/.test(s) && !/NaN|undefined|null/.test(s) && !/ id="/.test(s), m + ": 絵（NaN・id なし）");
// きまった らんすう（0〜1）
const lcg = (seed = 7) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// ---- 1. おてがみ ----
{
  const L = W.ALL.filter((it) => it.kind === "letter");
  ok(L.length === 24 && W.WHO.every((who) => L.filter((it) => it.who === who).length === 8), "おてがみは 3人 × 8まい");
  for (const it of L) {
    const lines = it.text.split("\n");
    ok(lines.length === 2 && lines.every((l) => l.trim().length >= 5 && [...l].length <= 24), `${it.id}: 2ぎょう（24もじ まで）`);
    ok(/^[ぁ-んー〜、。！？♪…\s]+$/.test(it.text), `${it.id}: ひらがな だけ「${it.text.replace("\n", "／")}」`);
    ok(lines.every((l) => l.includes(" ")), `${it.id}: ぶんせつごとに スペース`);
  }
  ok(new Set(L.map((it) => it.text)).size === 24, "おてがみの ことばは ぜんぶ ちがう");
}

// ---- 2. いし・アクセサリー・てづくり ----
{
  const T = W.THINGS;
  const by = (k) => T.filter((it) => it.kind === k);
  ok(by("stone").length === 9 && by("acc").length === 6 && by("hand").length === 3 && W.ALL.length === 42, "いし 9・アクセサリー 6・てづくり 3（ぜんぶで 42）");
  ok(W.WHO.every((who) => by("stone").filter((it) => it.who === who).length === 3 && by("acc").filter((it) => it.who === who).length === 2 && by("hand").filter((it) => it.who === who).length === 1), "3人 それぞれ いし 3・アクセサリー 2・てづくり 1");
  ok(new Set(W.ALL.map((it) => it.id)).size === 42 && W.ALL.every((it) => W.INDEX[it.id] === it), "id は かさならない");
  for (const it of T) for (const t of [it.name, it.say, it.desc]) ok(t && !kanji.test(t), `${it.id}: ことばは ひらがな・カタカナ「${t}」`);
  ok(by("acc").filter((it) => it.slot === "head").length === 3 && by("acc").filter((it) => it.slot === "neck").length === 3, "アクセサリー: ヘアピン 3・くびかざり 3");
  ok(/ねがいが かなう/.test(W.INDEX.wg_stone_ring.say) && /おこづかい/.test(W.INDEX.wg_bonepin.say + W.INDEX.wg_flowerpin.say + W.INDEX.wg_dinopin.say), "しろい わの いし（ねがいいし）・おこづかいで かった");
}

// ---- 3. でる かくりつ・えらびかた ----
{
  fresh();
  ok(W.CHANCE === 0.15 && W.PITY === 8, "15%・8かい なければ つぎは かならず");
  let out = 0, rolls = 0, run = 0, maxRun = 0;
  const r = lcg(11);
  for (let i = 0; i < 20000; i++) {
    const id = W.roll("gachan", r); rolls++;
    if (id) { out++; maxRun = Math.max(maxRun, run); run = 0; W.st().miss = 0; } else run++;
  }
  const rate = out / rolls;
  ok(rate > 0.17 && rate < 0.23, `でる わりあい ${(rate * 100).toFixed(1)}%（だいたい 5かいに 1かい）`);
  ok(maxRun <= W.PITY, `なにも ない のは つづけて ${maxRun}かい まで（8かい まで）`);
  fresh(); W.st().miss = W.PITY;
  ok(!!W.roll("wanko", () => 0.99), "8かい なにも なければ つぎは かならず");
  fresh(); ok(W.roll("wanko", () => 0.99) === null && W.st().miss === 1, "はずれは miss を かぞえる");
  W.force = "none"; ok(W.roll("wanko", () => 0) === null && W.force === "none", "PokaDebug: none は でない（ずっと）");
  W.force = "wg_stone_ring"; ok(W.roll("goji", () => 0.99) === "wg_stone_ring" && W.force === undefined, "PokaDebug: id は つぎ だけ");
  W.force = "acc"; const a = W.roll("gachan", () => 0.99); ok(W.INDEX[a].kind === "acc" && W.INDEX[a].who === "gachan", "PokaDebug: しゅるい（その 子の）");
  W.force = undefined;
  // その 子の もの・まだ もって いない もの
  fresh();
  const seen = new Set(), r2 = lcg(3);
  for (let i = 0; i < 400; i++) { const id = W.choose("goji", r2); seen.add(id); }
  ok([...seen].every((id) => W.INDEX[id].who === "goji"), "おねがいした 子の もの だけ");
  ok(["letter", "stone", "acc", "hand"].every((k) => [...seen].some((id) => W.INDEX[id].kind === k)), "4しゅるい ぜんぶ でる");
  for (const it of W.ALL.filter((x) => x.who === "goji" && x.kind !== "letter")) W.give(it.id);
  const r3 = lcg(5); ok(Array.from({ length: 50 }, () => W.choose("goji", r3)).every((id) => W.INDEX[id].kind === "letter" && !W.has(id)), "もって いない ものから（いし・アクセ・てづくり を ぜんぶ もって いれば てがみ）");
  for (const it of W.ALL.filter((x) => x.who === "goji")) if (!W.has(it.id)) W.give(it.id);
  const again = W.choose("goji", () => 0.5); ok(W.INDEX[again].kind === "letter" && W.INDEX[again].who === "goji", "ぜんぶ もって いたら その 子の てがみを もう いちど");
}

// ---- 4. もらう・セーブ ----
{
  const d = fresh();
  ok(!d.wish, "Save.fresh() には wish が ない（はじめて つかう ときに できる）");
  const g = W.st(); ok(g.miss === 0 && JSON.stringify(g.got) === "{}" && Array.isArray(g.log), "はじめての st()");
  W.st().miss = 5;
  W.give("wg_stone_ring", Date.UTC(2026, 9, 3, 3)); W.give("wg_bonepin"); W.give("wg_l_wanko_3"); W.give("wg_coupon");
  ok(d.furn.wg_stone_ring === 1 && R.WearStock.count("wg_bonepin") === 1 && W.has("wg_l_wanko_3") && W.has("wg_coupon") && !d.furn.wg_coupon && W.st().miss === 0, "いしは 家具・ヘアピンは 服（1こ）・てがみと けんは きろく・miss は 0 に");
  ok(W.st().log.map((x) => x.id).join() === "wg_stone_ring,wg_bonepin,wg_l_wanko_3,wg_coupon" && W.when("wg_stone_ring") === "10がつ 3にち", "きろくと もらった 日");
  ok(W.count() === 4, "もって いる かず");
  ok(W.give("nope") === null, "しらない id は もらえない");
  // こわれた セーブ
  d.wish.gift = { miss: -3, got: [], log: "x", used: null };
  const h = W.st(); ok(h.miss === 0 && !Array.isArray(h.got) && Array.isArray(h.log) && typeof h.used === "object", "こわれた gift は なおす");
  d.wish.gift = 5; ok(typeof W.st() === "object" && W.st().miss === 0, "gift が かず でも なおす");
  // まえの セーブ（wish が ない・gift が ない）
  const old = S.fresh(); old.wish = { cur: null, last: 0, n: 3, log: [{ id: "eat_cake", t: 1, how: "hug" }] };
  S.d = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(W.st().miss === 0 && S.d.wish.n === 3 && S.d.wish.log.length === 1, "まえの セーブにも gift が できる（おねがいの きろくは そのまま）");
  // かたたたき けん: 10かい
  fresh(); W.give("wg_coupon"); ok(W.COUPON === 10 && /10かい/.test(W.use(W.INDEX.wg_coupon)), "かたたたき けんは 10かい");
}

// ---- 5. 家具と 服の とうろく ----
{
  fresh();
  const furn = W.THINGS.filter((it) => it.kind === "stone" || it.id === "wg_crane" || it.id === "wg_drawing");
  ok(furn.length === 11 && furn.every((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].price === 0 && FURN_INDEX[it.id].rare && FURN_INDEX[it.id].exclusive === "wish"), "いし 9・つる・え は 家具（0コイン・レア・exclusive）");
  ok(FURN_INDEX.wg_drawing.kind === "wall" && furn.filter((it) => it.id !== "wg_drawing").every((it) => FURN_INDEX[it.id].kind === "floor" && FURN_INDEX[it.id].depth > 0), "クレヨンの え は かべ・ほかは ゆか");
  ok(furn.filter((it) => it.id !== "wg_drawing").every((it) => FigureStand.isFigure(it.id)), "いしと つるは フィギュア だいにも かざれる");
  ok(!FURN_INDEX.wg_coupon, "かたたたき けん は 家具に しない");
  const acc = W.THINGS.filter((it) => it.kind === "acc");
  ok(acc.every((it) => ITEM_INDEX[it.id] && ITEM_INDEX[it.id].exclusive === "wish" && ITEM_INDEX[it.id].price === 0 && typeof WEAR[it.id] === "function"), "アクセサリーは 服（WEAR の かたち）");
  ok(acc.filter((it) => it.slot === "head").every((it) => HeadPair.kind(it.id) === "pin" && HeadPair.ok("strawhat", it.id)), "ヘアピンは ぼうしとも いっしょに つけられる（pin）");
  for (const tab of ["floor", "wall"]) ok(BUY_SHOPS.furniture.items(tab).every((f) => !W.INDEX[f.id]), `かぐやさん（${tab}）に ならばない`);
  for (const tab of ["head", "neck"]) ok(BUY_SHOPS.clothes.items(tab).every((f) => !W.INDEX[f.id]), `ようふくやさん（${tab}）に ならばない`);
  const names = new Set([...R.FURNITURE, ...R.WEAR_ITEMS].filter((f) => !W.INDEX[f.id]).map((f) => f.name));
  ok(W.THINGS.every((it) => !names.has(it.name)), "なまえが ほかの 家具・服と かさならない");
  for (const it of W.THINGS.filter((x) => x.kind !== "letter")) {
    const s = ItemDexSources.source(it.kind === "acc" ? "wear" : "furn", it.kind === "acc" ? ITEM_INDEX[it.id] : FURN_INDEX[it.id] || { id: it.id });
    if (it.id !== "wg_coupon") ok(/おねがいを かなえると/.test(s) && !kanji.test(s), `${it.id}: ずかんの ヒント「${s}」`);
  }
}

// ---- 6. 絵 ----
{
  fresh();
  for (const who of W.WHO) {
    for (const f of ["envBack", "envFront", "envFlap", "envSmall"]) svgOk(A[f](who), `${who}: ${f}`);
    for (let i = 0; i < 8; i++) svgOk(A.doodle(who, i), `${who}: らくがき ${i}`);
    ok(new Set([0, 1, 2].map((i) => A.doodle(who, i))).size === 3, `${who}: らくがきは 3しゅ`);
  }
  for (const it of W.THINGS.filter((x) => FURN_INDEX[x.id])) { const s = Art.furnSvg(it.id); svgOk(s, it.id); ok(s.length > 500, it.id + ": 絵が ちいさすぎない"); }
  svgOk(A.coupon(0, 10), "けん（まだ）"); svgOk(A.coupon(10, 10), "けん（ぜんぶ）");
  ok((A.coupon(3, 10).match(/fill="#FF7BA8" stroke="#E0598B"/g) || []).length === 3, "けん: つかった かずだけ ハートが うまる");
  for (const it of W.THINGS.filter((x) => x.kind === "acc")) {
    for (const who of Chara.IDS) for (const dir of ["down", "left", "up", "right"]) {
      const s = Chara.svg(who, { dir, face: "happy", outfit: { [it.slot]: it.id } });
      ok(/^<svg[\s\S]*<\/svg>$/.test(s) && !/NaN|undefined|null/.test(s), `${it.id}/${who}/${dir}: 絵`);
    }
    const plain = Chara.svg("wanko", { dir: "down" }), on = Chara.svg("wanko", { dir: "down", outfit: { [it.slot]: it.id } });
    ok(on.length > plain.length + 200, `${it.id}: つけると みえる`);
    const ic = Art.iconSvg("wear", it.id); ok(/<svg/.test(ic) && !/NaN|undefined/.test(ic), `${it.id}: アイコン`);
  }
  // キャッシュの キーに なる もの（id）は かぎられて いる・ほしの キラキラは まわりに つけない
  const src = read("js/wish-gift-art.js") + read("js/wish-gifts.js");
  ok(!/Math\.random|Date\.now\(\)\s*[%*]/.test(read("js/wish-gift-art.js")), "絵に らんすう・じかんを つかわない");
  ok(!/FX\.star|FX\.sparkles|twinkle/.test(src), "まわりに ちらちら ひかる ほしを つけない（UI-50）");
}

// ---- 7. すまほ・くみこみ・ことば・PokaDebug ----
{
  fresh();
  const app = Smaho.APPS.find((a) => a.id === "treasure"), i = Smaho.APPS.findIndex((a) => a.id === "treasure");
  ok(app && app.name === "たからもの" && Smaho.ICON.treasure && Smaho.APPS[i - 1].id === "wish", "すまほの「たからもの」（「おねがい」の つぎ）");
  ok(W.SECTIONS.map((s) => s[0]).join() === "letter,stone,acc,hand" && W.SECTIONS.every((s) => !kanji.test(s[1])), "たからものの みだし");
  const gw = read("js/gowaga-wish.js"), html = read("index.html"), sw = read("sw.js");
  ok(/h\.amae = this\.AMAE; h\.beat = ids\.length \* 1\.3 \+ 1\.5;\s*if \(typeof WishGifts !== "undefined"\) await WishGifts\.after\(sc, x\);/.test(gw), "おねがいの おれいの あと（あまえる まえ）に おれいの しな");
  ok(/WishGifts\.icon\(\)/.test(gw), "すまほの「おねがい」の きろくに プレゼントの しるし");
  ok(html.indexOf("js/wish-gift-art.js") > html.indexOf("js/gowaga-wish.js") && html.indexOf("js/wish-gifts.js") > html.indexOf("js/wish-gift-art.js") && html.indexOf("js/wish-gifts.js") < html.indexOf("js/debug.js") && sw.includes('"./js/wish-gift-art.js", "./js/wish-gifts.js"'), "index.html と sw.js に とうろく（gowaga-wish.js の あと）");
  ok(/family=Hachi\+Maru\+Pop/.test(html) && /Hachi Maru Pop/.test(read("css/style.css")), "てがみの もじは てがき ふうの フォント（Google Fonts・なくても M PLUS Rounded 1c）");
  for (const who of W.WHO) for (const t of [W.ASK.letter[who], W.ASK.thing[who], W.AFTER[who]]) ok(t && !kanji.test(t), `${who}: ひとこと「${t}」`);
  for (const t of W.TAP) ok(!kanji.test(t), "かたたたき: " + t);
  const texts = [...read("js/wish-gifts.js").matchAll(/(?:text|textContent) = [`"]([^`"]*)[`"]/g), ...read("js/wish-gifts.js").matchAll(/UI\.btn\("([^"]*)"/g)].map((m) => m[1]);
  ok(texts.length >= 6 && texts.every((t) => !kanji.test(t.replace(/\$\{[^}]*\}/g, ""))), "がめんの ことばは ひらがな（" + texts.length + "）");
  ok(typeof PokaDebug.wishGift === "function" && typeof PokaDebug.wishGifts === "function" && typeof PokaDebug.wishGiftGive === "function" && typeof PokaDebug.wishLetter === "function", "PokaDebug: wishGift・wishGifts・wishGiftGive・wishLetter");
  const st = PokaDebug.wishGift("letter"); ok(st.force === "letter" && st.total === 42, "PokaDebug.wishGift " + JSON.stringify(st));
  PokaDebug.wishGift(null); ok(PokaDebug.wishGifts().force === null, "PokaDebug.wishGift(null) で ふつうに もどる");
  ok(PokaDebug.wishGiftGive("wg_crane") && S.d.furn.wg_crane === 1, "PokaDebug.wishGiftGive");
  ok(GW && GW.st().gift, "おねがいの セーブの なかに gift");
}

console.log(`✓ wish gifts (UI-70): ${n} checks（おてがみ 24・いし 9・アクセサリー 6・てづくり 3・15%／8かい・えらびかた・セーブ・とうろく・絵・すまほ・くみこみ）`);
