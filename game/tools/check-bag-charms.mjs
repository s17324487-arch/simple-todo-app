// バッグ・ポーチの チャーム（js/bag-charms.js・UI-123）の 検査（ブラウザ なし）
// あたらしい チャーム 10しゅ・めじるし／ミニフィギュアの チャーム・バッグ 8しゅの わっか・絵（3人 × 4むき）・もって いる もの・はずす・登録
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { BagCharms: B, ITEM_INDEX, WEAR_ITEMS, BUY_SHOPS, Chara, Save, SLOT_ORDER, FURNITURE } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const kanji = /[一-鿿]/;
// ---- 1. データ ----
ok(B.ITEMS.length === 10 && new Set(B.ITEMS.map((x) => x.id)).size === 10, "あたらしい チャーム 10しゅ");
const shelf = BUY_SHOPS.clothes.items(B.SLOT).map((w) => w.id);
for (const x of B.ITEMS) {
  const w = ITEM_INDEX[x.id];
  ok(w && w.slot === B.SLOT && w.wear === "bc_charm" && WEAR_ITEMS.includes(w) && shelf.includes(x.id) && x.price > 0, `${x.id}: チャームの たな`);
  ok(!kanji.test(x.name + x.desc) && x.name.length <= 14 && x.desc.length <= 32, `${x.id}: ことば`);
}
ok(BUY_SHOPS.clothes.tabs.at(-1)[0] === B.SLOT && BUY_SHOPS.clothes.tabs.at(-1)[1] === "チャーム" && SLOT_ORDER.at(-1) === B.SLOT && SLOT_ORDER.indexOf("hand") === SLOT_ORDER.length - 2, "たなの タブ・絵の かさなり（もちものの つぎ）");
const meji = WEAR_ITEMS.filter((w) => w.wear === "gacha_mejirushi");
ok(meji.length >= 12 && meji.every((w) => B.proxies.includes(B.PREFIX + w.id)), "めじるし ぜんぶ（12しゅ）つけられる");
const minis = FURNITURE.filter((f) => R.ArcadePrizes.INDEX[f.id] && R.ArcadePrizes.INDEX[f.id].size === "mini");
ok(minis.length === 10 && minis.every((f) => B.proxies.includes(B.PREFIX + f.id)), "ミニマスコット 10しゅ ぜんぶ つけられる");
ok(FURNITURE.filter((f) => R.FigureStand.isFigure(f.id)).every((f) => B.proxies.includes(B.PREFIX + f.id)), "フィギュアだいの フィギュアも つけられる");
ok(B.proxies.every((id) => { const it = ITEM_INDEX[id]; return it.charmProxy && it.slot === B.SLOT && it.price === 0 && !WEAR_ITEMS.includes(it) && !shelf.includes(id); }), "めじるし・ミニフィギュアは おみせ・ずかんに でない");
// ---- 2. もって いる もの・はずす ----
{
  Save.d = Save.fresh();
  ok(!B.owned().length, "はじめは なし");
  Save.d.wardrobe[meji[0].id] = 1; Save.d.furn.ike_mini_goji = 1;
  const o = B.owned().map((x) => x.id);
  ok(o.length === 2 && o.includes(B.PREFIX + meji[0].id) && o.includes("charm_ike_mini_goji"), "もって いる めじるし・ミニマスコット " + o);
  Save.d.chars.wanko.outfit.charm = "charm_ike_mini_goji"; Save.d.chars.gachan.outfit.charm = "bc_star";
  delete Save.d.furn.ike_mini_goji;
  ok(B.fix() === 1 && Save.d.chars.wanko.outfit.charm === null && Save.d.chars.gachan.outfit.charm === "bc_star", "もって いない ミニマスコットは はずす・あたらしい チャームは そのまま");
}
// ---- 3. 絵 ----
const bagIds = Object.keys(B.BAGS).map((wear) => WEAR_ITEMS.find((w) => w.wear === wear));
ok(bagIds.every(Boolean) && bagIds.length === 8, "バッグ 8しゅ（もちもの・ガチャ・いちばんくじ）");
const pick = [...B.ITEMS.map((x) => x.id), B.PREFIX + meji[3].id, "charm_ike_mini_wanko", B.proxies.find((id) => R.FigureStand.isFigure(ITEM_INDEX[id].col[1]))];
for (const cid of pick) for (const bag of bagIds) for (const id of Chara.IDS) for (const dir of ["down", "left", "right", "up"]) {
  const s = Chara.svg(id, { dir, pose: "idle_01", face: "happy", outfit: { ...Save.fresh().chars[id].outfit, hand: bag.id, charm: cid } });
  ok(s.includes("<svg") && !/NaN|undefined|Infinity/.test(s) && s.includes('stroke="#9AA0AC"'), `${cid} ${bag.id} ${id} ${dir}: チャームが でる`);
}
for (const id of Chara.IDS) {
  const s = Chara.svg(id, { outfit: { ...Save.fresh().chars[id].outfit, hand: "hi_umb_dot", charm: "bc_star" } }), s0 = Chara.svg(id, { outfit: { ...Save.fresh().chars[id].outfit, hand: "hi_umb_dot" } });
  ok(!s.includes('stroke="#9AA0AC"') && s.length === s0.length, `${id}: バッグで ない ときは でない`);
}
for (const x of B.ITEMS) { const ic = R.Art.iconSvg("wear", x.id); ok(ic.includes("<svg") && !/NaN/.test(ic), `${x.id}: アイコン`); }
ok(R.Art.iconSvg("wear", "charm_ike_mini_goji") === R.Art.iconSvg("furn", "ike_mini_goji"), "ミニマスコットの チャームの アイコンは もとの アイコン");
// ---- 4. 登録 ----
const html = read("index.html"), sw = read("sw.js"), dress = read("js/dressup.js"), dbg = read("js/debug.js");
ok(html.indexOf('src="js/hold-plush.js"') < html.indexOf('src="js/bag-charms.js"') && sw.includes('"./js/bag-charms.js"'), "index.html（hold-plush.js の あと）と sw.js");
ok(/BagCharms\.SLOT, BagCharms\.TAB/.test(dress) && /BagCharms\.owned\(\)/.test(dress) && /it\.charmProxy\) c\.outfit\[slot\] = it\.id/.test(dress), "きがえの「チャーム」の タブ");
ok(/bagCharms\(\)/.test(dbg) && /charmSet\(who,id\)/.test(dbg), "PokaDebug");
ok(Save.SCHEMA === 2 && !("charm" in Save.fresh().chars.wanko.outfit), "セーブは かわらない");
console.log(`✓ バッグ・ポーチの チャーム（UI-123）: ${n} 項目`);
