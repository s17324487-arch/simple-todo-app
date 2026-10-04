// コンビニ × ごわがの コラボ けいひん（js/conbini-collab.js・js/conbini-collab-art.js・UI-86）の 検査。ブラウザ なしで:
// とうろく・32しゅ（2つの みせ × 4だん × 4しゅ・みせで ちがう）・かんジュース（たべもの）・グラス／タンブラー（フィギュア だい）・プレート（かべ）・おふろ グッズ（さわると うごく）・
// ポイントカードの 9だん（100・200・500・800・1000・2000・3000・5000・10000）・4しゅから えらぶ こうかん・ずかんの ヒント・絵・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ConbiniCollab: X, ConbiniCollabArt: A, ConbiniCard: C, Save: S, BAG_INDEX, FURN_INDEX, FOODS, FOOD_ART, FURN_ART, FigureStand, FurnLive, FurnModels, ItemDexSources, BUY_SHOPS, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/, INK = "#1F1D1B";
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && !/\sid="/.test(s) && s.includes(INK) && (s.match(/<g\b/g) || []).length === (s.match(/<\/g>/g) || []).length;
const fresh = () => { S.d = S.fresh(); return S.d; };
const STORES = ["lawson", "sevenbun"], CATS = ["can", "cup", "plate", "bath"], WHO = ["wanko", "gachan", "goji", "trio"];

// ---- 1. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("conbini-collab-art.js") > at("conbini-card.js") && at("conbini-collab.js") > at("conbini-collab-art.js") && at("conbini-collab.js") < at("food-balance.js") && at("conbini-card.js") > at("figure-stand.js") && at("figure-stand.js") > 0, "index.html: conbini-card.js・figure-stand.js の あと（絵 → しなもの）・food-balance.js の まえ");
  ok(sw.includes('"./js/conbini-collab-art.js"') && sw.includes('"./js/conbini-collab.js"'), "sw.js の FILES に 2つ");
}

// ---- 2. 32しゅ ----
{
  ok(X.ITEMS.length === 32 && new Set(X.ITEMS.map((it) => it.id)).size === 32, "2つの みせ × 4だん × 4しゅ = 32しゅ");
  for (const store of STORES) for (const cat of CATS) {
    const list = X.ITEMS.filter((it) => it.store === store && it.cat === cat);
    ok(list.map((it) => it.who).join() === WHO.join() && list.every((it) => it.id === X.idOf(store, cat, it.who) && /^cvc_(law|sev)_(can|cup|plate|bath)_(wanko|gachan|goji|trio)$/.test(it.id)), `${store} ${cat}: わんこ・がちゃん・ごじ・なかよし`);
  }
  const names = X.ITEMS.map((it) => it.name);
  ok(new Set(names).size === 32 && names.every((t) => !kanji.test(t) && t.length <= 14), "なまえは 32 ぜんぶ ちがう・ひらがな・カタカナ");
  ok(X.ITEMS.every((it) => !kanji.test(it.desc) && it.desc.length >= 12), "せつめいも ひらがな・カタカナ");
  const others = [...Object.values(BAG_INDEX), ...Object.values(FURN_INDEX)].filter((b) => !X.INDEX[b.id]).map((b) => b.name);
  ok(names.every((t) => !others.includes(t)), "ほかの しなものと なまえが かさならない");
  for (const cat of CATS) {
    const law = X.ITEMS.filter((it) => it.store === "lawson" && it.cat === cat).map((it) => it.name), sev = X.ITEMS.filter((it) => it.store === "sevenbun" && it.cat === cat).map((it) => it.name);
    ok(!law.some((t) => sev.includes(t)) && A.pic(cat, "lawson", "wanko") !== A.pic(cat, "sevenbun", "wanko"), `${cat}: 2つの みせで ちがう（コラボは みせごと）`);
  }
}

// ---- 3. かんジュース（たべもの）・家具 ----
{
  for (const it of X.ITEMS) {
    if (it.cat === "can") {
      const f = BAG_INDEX[it.id];
      ok(f && f.kind === "food" && FOODS.filter((x) => x.id === it.id).length === 1 && f.price === 0 && f.exclusive === "conbini_card" && f.hunger > 0 && f.mood > 0 && typeof FOOD_ART[it.id] === "string" && FOOD_ART[it.id].includes(INK) && !FOOD_ART[it.id].startsWith("<svg"), `${it.id}: のめる かん（たべもの・FOOD_ART）`);
    } else {
      const f = FURN_INDEX[it.id], [w, h] = A.size(it.cat, it.store, it.who), svg = FURN_ART[it.id]();
      ok(f && f.price === 0 && f.exclusive === "conbini_card" && f.w === w && f.h === h && f.comfort > 0 && svgOk(svg), `${it.id}: 家具（${w}×${h}）`);
      ok(it.cat === "plate" ? f.kind === "wall" && !f.depth : f.kind === "floor" && f.depth > 0, `${it.id}: ${it.cat === "plate" ? "かべ" : "ゆか"}`);
      if (it.cat === "cup") ok(f.figure === true && FigureStand.isFigure(it.id), `${it.id}: フィギュア だいにも かざれる`);
      if (it.cat === "bath") ok(f.interactive === true && FurnModels.has(it.id), `${it.id}: さわると うごく（FurnLive・立体）`);
    }
  }
  const market = [...(BUY_SHOPS.market.items("food") || []), ...(BUY_SHOPS.lawson.items() || []), ...(BUY_SHOPS.sevenbun.items() || [])];
  ok(market.every((f) => !X.INDEX[f.id]), "おみせでは うって いない（ポイントで こうかん だけ）");
}

// ---- 4. ポイントカードの 9だん ----
{
  for (const store of STORES) {
    const P = C.prizes(store);
    ok(JSON.stringify(P.map((p) => [p.id, p.cost])) === JSON.stringify([["crane", 100], ["can", 200], ["cup", 500], ["plate", 800], ["lv10", 1000], ["lv25", 2000], ["bath", 3000], ["bus", 5000], ["owner", 10000]]), `${store}: こうかんは 9だん（100・200・500・800・1000・2000・3000・5000・10000）`);
    for (const p of P.filter((x) => x.kinds)) ok(p.kinds.length === 4 && p.kinds.every((id) => X.INDEX[id].store === store && X.INDEX[id].cat === p.id) && svgOk(p.icon(store)) && p.kinds.every((id) => svgOk(p.kindIcon(id)) && p.kindName(id) === X.INDEX[id].name), `${store} ${p.id}: 4しゅから えらぶ（みせの しなもの・絵）`);
    ok(!kanji.test(P.filter((x) => x.kinds).map((p) => p.name + p.desc).join("")), `${store}: だんの なまえと せつめいは ひらがな`);
  }
}

// ---- 5. こうかん ----
{
  fresh();
  const c = C.card("sevenbun"); c.has = true; c.pts = 4600;
  ok(C.exchange("sevenbun", "can") === null && C.exchange("sevenbun", "can", "cvc_law_can_wanko") === null && c.pts === 4600, "えらんで いない・ちがう みせの しなものは こうかん できない");
  let r = C.exchange("sevenbun", "can", "cvc_sev_can_trio");
  ok(r && r.kind === "cvc_sev_can_trio" && S.d.bag.cvc_sev_can_trio === 1 && c.pts === 4400 && c.got.can === 1 && c.got.cvc_sev_can_trio === 1 && S.d.conbiniCard.log[0][2] === "cvc_sev_can_trio", "かんジュース（200）: もちものに・ポイントが へる・きろく");
  r = C.exchange("sevenbun", "cup", "cvc_sev_cup_goji"); ok(r && S.d.furn.cvc_sev_cup_goji === 1 && c.pts === 3900, "タンブラー（500）: 家具に");
  r = C.exchange("sevenbun", "plate", "cvc_sev_plate_gachan"); ok(r && S.d.furn.cvc_sev_plate_gachan === 1 && c.pts === 3100, "しましまざら（800）: 家具（かべ）に");
  r = C.exchange("sevenbun", "bath", "cvc_sev_bath_wanko"); ok(r && S.d.furn.cvc_sev_bath_wanko === 1 && c.pts === 100, "おふろ グッズ（3000）: 家具に");
  ok(C.exchange("sevenbun", "bath", "cvc_sev_bath_goji") === null && c.pts === 100, "ポイントが たりない");
  ok(C.exchange("sevenbun", "crane", "cvc_sev_can_goji") === null, "えらばない けいひんに えらぶ ものを わたしても こうかん しない");
  const p = C.prize("sevenbun", "cup"); ok(p.have("cvc_sev_cup_goji") === 1 && p.have("cvc_sev_cup_wanko") === 0, "もって いる かず");
  const src = read("js/conbini-card.js");
  ok(/API\.pickKind = \(shop, p\) =>/.test(src) && /kind = p\.kinds \? await API\.pickKind\(shop, p\) : null/.test(src) && /もってる \$\{p\.kinds\.filter/.test(src), "カードの まど: 4しゅから えらぶ まど・もってる かず");
  ok(/\.cc-kind \{[^}]*min-height: 44px/.test(read("css/style.css")), "えらぶ ボタンは 44px いじょう");
}

// ---- 6. ずかん・絵・PokaDebug ----
{
  ok(X.ITEMS.filter((it) => it.cat !== "can").every((it) => /ポイントカードで こうかん できるよ（\d+ポイント）/.test(ItemDexSources.source("furn", FURN_INDEX[it.id]))), "ずかんの ヒント（どこで もらえるか）");
  const pics = X.ITEMS.map((it) => it.cat === "can" ? A.can(it.store, it.who) : A.pic(it.cat, it.store, it.who));
  ok(pics.every(svgOk) && new Set(pics).size === 32, "絵 32しゅ（ぜんぶ ちがう・id なし・INK）");
  const tiers = STORES.flatMap((s) => CATS.map((c) => A.tier(c, s)));
  ok(tiers.every(svgOk) && new Set(tiers).size === 8, "だんの アイコン 8しゅ");
  fresh();
  const d = PokaDebug.conbiniCard("lawson", { pts: 900 });
  ok(d.prizes.length === 9 && d.prizes.filter((p) => p.kinds).every((p) => p.kinds.length === 4 && p.kinds.every((k) => k.have === 0 && !kanji.test(k.name))) && d.prizes.filter((p) => p.can).map((p) => p.id).join() === "crane,can,cup,plate", "PokaDebug.conbiniCard: 9だん・4しゅ・もって いる かず");
}

console.log(`✓ conbini collab (UI-86): ${n} checks（とうろく・32しゅ・みせで ちがう・かん・グラス・プレート・おふろ グッズ・9だん・4しゅから えらぶ・ずかん・絵・PokaDebug）`);
