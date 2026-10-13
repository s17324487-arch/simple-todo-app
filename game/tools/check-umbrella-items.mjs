// かさ・ひがさ（js/umbrella-items.js・UI-122）の 検査（ブラウザ なし）: 8しゅの データ・ことば・ねだん・ようふくやさんの たな・3人 × 4むきの 絵・登録
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { UmbrellaItems: UI8, HandItems: HI, ITEM_INDEX, WEAR_ITEMS, BUY_SHOPS, Chara, Save } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const kanji = /[一-鿿]/;
const L = UI8.ITEMS;
ok(L.length === 8 && L.filter((x) => x.umb === "rain").length === 4 && L.filter((x) => x.umb === "sun").length === 4 && new Set(L.map((x) => x.id)).size === 8, "かさ 4・ひがさ 4");
const shelf = BUY_SHOPS.clothes.items("hand").map((w) => w.id);
for (const x of L) {
  const w = ITEM_INDEX[x.id];
  ok(w && w.slot === HI.SLOT && w.wear === "hi_umbrella" && WEAR_ITEMS.includes(w) && shelf.includes(x.id), `${x.id}: もちもの・ようふくやさんの たな`);
  ok(!kanji.test(x.name + x.desc) && x.name.length <= 10 && x.desc.length <= 32 && x.price > 0 && x.st && Object.keys(x.st).length, `${x.id}: なまえ・せつめい・ねだん・つよさ`);
  for (const id of Chara.IDS) for (const dir of ["down", "left", "right", "up"]) {
    const s = Chara.svg(id, { dir, pose: "idle_01", face: "happy", outfit: { ...Save.fresh().chars[id].outfit, hand: x.id } });
    ok(typeof s === "string" && s.includes("<svg") && !/NaN|undefined|Infinity/.test(s) && s.includes(x.col[0]), `${x.id} ${id} ${dir}: 絵`);
  }
  const ic = R.Art.iconSvg("wear", x.id); ok(ic.includes("<svg") && !/NaN/.test(ic), `${x.id}: アイコン`);
}
// かさは あたまの うえ（キャラの 絵の わく y −40 より した）
for (const id of Chara.IDS) {
  const r = R.WEAR.hi_umbrella({ p: R.PROFILE[id], a: R.PROFILE[id].a, view: "front", dx: 0, col: L[1].col, uid: "t" });
  const ys = [...r.top.matchAll(/translate\(([-0-9.]+) ([-0-9.]+)\)/g)].map((m) => +m[2]);
  ok(r.behind && r.top && ys.length === 1 && ys[0] < R.PROFILE[id].a.hat.y && ys[0] - 0.66 * Math.max(60, R.PROFILE[id].a.hat.w * 0.74) > -40, `${id}: かさは あたまの うえで わくの なか`);
}
const html = read("index.html"), sw = read("sw.js");
ok(html.indexOf('src="js/hand-items.js"') < html.indexOf('src="js/umbrella-items.js"') && sw.includes('"./js/umbrella-items.js"'), "index.html（hand-items.js の あと）と sw.js");
ok(/handHold\(who,id\)/.test(read("js/debug.js")), "PokaDebug.handHold");
console.log(`✓ かさ・ひがさ（UI-122）: ${n} 項目`);
