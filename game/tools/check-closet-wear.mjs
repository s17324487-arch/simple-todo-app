// ようふく 50しゅ（js/closet-wear.js・UI-125）の 検査（ブラウザ なし）: データ・ことば・ねだん・ようふくやさんの「トレンド」の たな・
// 3人 × 4むき・ぱぱ まま・町の人・アイコンの 絵（id の かさなり・NaN）・登録
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { ClosetWear: CW, ITEM_INDEX, WEAR_ITEMS, BUY_SHOPS, Chara, Save } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const kanji = /[一-鿿]/, hex = /^#[0-9A-F]{6}$/i;
const L = CW.ITEMS;
ok(L.length === 50 && new Set(L.map((x) => x.id)).size === 50 && new Set(L.map((x) => x.name)).size === 50, "50しゅ・id と なまえが かさならない");
const names = new Set(WEAR_ITEMS.filter((w) => !w.closet).map((w) => w.name));
const shelf = BUY_SHOPS.clothes.items(CW.TAB).map((w) => w.id), body = BUY_SHOPS.clothes.items("body").map((w) => w.id);
ok(BUY_SHOPS.clothes.tabs.findIndex((t) => t[0] === CW.TAB) === BUY_SHOPS.clothes.tabs.findIndex((t) => t[0] === "body") + 1 && BUY_SHOPS.clothes.tabs.find((t) => t[0] === CW.TAB)[1] === "トレンド", "「トレンド」の たなは「ふく」の つぎ");
ok(shelf.length === 50 && !body.some((id) => ITEM_INDEX[id].closet) && body.length >= 15, "トレンドの たなに 50しゅ・ふくの たなには まざらない");
const kinds = { skirt: 0, sl: new Set(), collar: new Set(), pat: new Set() };
for (const x of L) {
  const w = ITEM_INDEX[x.id], sp = CW.SPEC[x.id];
  ok(w === x && WEAR_ITEMS.includes(w) && w.slot === "body" && w.wear === "cw_wear" && w.col[3] === x.id && sp, `${x.id}: からだの ふく`);
  ok(!kanji.test(x.name + x.desc) && x.name.length <= 16 && x.desc.length <= 40 && !names.has(x.name), `${x.id}: なまえ・せつめい「${x.name}」「${x.desc}」`);
  ok(x.price >= 300 && x.price <= 700 * 8 && x.st && Object.values(x.st).every((v) => v > 0 && v <= 3), `${x.id}: ねだん ${x.price}・つよさ`);
  for (const k of ["c", "a", "i", "pc", "pc2", "a2", "ribc"]) if (sp[k] !== undefined) ok(hex.test(sp[k]), `${x.id}: いろ ${k}=${sp[k]}`);
  if (sp.skirt) kinds.skirt++; kinds.sl.add(sp.sl); if (sp.collar) kinds.collar.add(sp.collar); if (sp.pat) kinds.pat.add(sp.pat);
  for (const id of Chara.IDS) for (const dir of ["down", "left", "right", "up"]) for (const pose of ["idle_01", "walk_01"]) {
    const s = Chara.svg(id, { dir, pose, face: "happy", outfit: { ...Save.fresh().chars[id].outfit, body: x.id } });
    ok(s.includes("<svg") && !/NaN|undefined|Infinity/.test(s) && s.includes(`fill="${sp.c}"`), `${x.id} ${id} ${dir} ${pose}: 絵`);
    const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    ok(new Set(ids).size === ids.length, `${x.id} ${id} ${dir}: id が かさなる`);
    ok([...s.matchAll(/url\(#([^)]+)\)/g)].every((m) => ids.includes(m[1])), `${x.id} ${id} ${dir}: url(#…) の さきが ない`);
  }
  // うでの ポーズ（ぷりくら など）・ぱぱ まま・町の人・アイコン
  const g = Chara.svg("wanko", { gesture: "peace", outfit: { body: x.id } });
  ok(!/NaN|undefined/.test(g), `${x.id}: うでの ポーズ`);
  const P = R.ParentWardrobe.layers({ body: x.id });
  ok(P.torso.includes(sp.c) && !/NaN|undefined/.test(P.torso + P.top), `${x.id}: ぱぱ まま`);
  const npc = R.Art.npcSvg({ sp: "cat", outfit: { body: x.id } }); ok(npc.includes(sp.c) && !/NaN|undefined/.test(npc), `${x.id}: 町の人`);
  const ic = R.Art.iconSvg("wear", x.id); ok(ic.includes("<svg") && ic.includes(sp.c) && !/NaN|undefined/.test(ic), `${x.id}: アイコン`);
}
ok(kinds.skirt >= 10 && kinds.sl.size === 4 && kinds.collar.size >= 12 && kinds.pat.size >= 18, `いろいろな かたち ${kinds.skirt} ${[...kinds.sl]} ${kinds.collar.size} ${kinds.pat.size}`);
// SvgCache の キーは 服の id だけ（絵は きまった データ・乱数・時刻を つかわない）
const src = read("js/closet-wear.js").replace(/^\s*\/\/.*$/gm, "");
ok(!/Math\.random|Date\.now|new Date|SvgCache/.test(src), "乱数・時刻・SvgCache を つかわない");
ok(Chara.svg("goji", { outfit: { body: "cw_nordic" } }).replace(/u\d+/g, "") === Chara.svg("goji", { outfit: { body: "cw_nordic" } }).replace(/u\d+/g, ""), "おなじ 絵");
// 登録
const html = read("index.html"), sw = read("sw.js");
ok(html.indexOf('src="js/umbrella-items.js"') < html.indexOf('src="js/closet-wear.js"') && html.indexOf('src="js/closet-wear.js"') < html.indexOf('src="js/slow-life-prices.js"') && sw.includes('"./js/closet-wear.js"'), "index.html（umbrella-items.js の あと・slow-life-prices.js の まえ）と sw.js");
ok(/closetWear\(\)/.test(read("js/debug.js")) && /closetPut\(who,id\)/.test(read("js/debug.js")), "PokaDebug.closetWear・closetPut");
console.log(`✓ ようふく 50しゅ（UI-125）: ${n} 項目`);
