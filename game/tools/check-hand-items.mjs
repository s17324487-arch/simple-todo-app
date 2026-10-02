// もちもの（js/hand-items.js・UI-48。オーナーの FB 2026-10-02「持ち物で風船を持てたり…バックを持てたりしたい」）の 検査。
// ブラウザ なしで: 7しゅ（ふうせん 4・バッグ 3）の データ・ことば・ねだん・つよさ・あたらしい きがえの しゅるい「もちもの」（outfit.hand）・
// 絵（3人 × 4むき × ポーズで 描ける・いろが でる・id なし・はこの なか）・キャッシュの キー・ようふくやさんの たな・きがえの タブ・ステータス・WearStock・とうろく・セーブ
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HandItems: HI, Save: S, Chara, ITEM_INDEX, WEAR_ITEMS, WEAR, BUY_SHOPS, Stats, WearStock, SLOT_NAMES, PROFILE } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const IDS = ["wanko", "gachan", "goji"];

// ---- 1. データ ----
{
  const L = HI.ITEMS, balloons = L.filter((x) => x.wear === "hi_balloon"), bags = L.filter((x) => x.wear !== "hi_balloon");
  ok(L.length === 7 && balloons.length === 4 && bags.length === 3 && new Set(L.map((x) => x.id)).size === 7, "ふうせん 4・バッグ 3");
  ok(new Set(balloons.map((x) => x.col[1])).size === 4, "ふうせんの かたちは 4しゅ（まる・ハート・ほし・くま）");
  for (const x of L) {
    const w = ITEM_INDEX[x.id];
    ok(w && w.slot === "hand" && WEAR_ITEMS.includes(w) && WEAR[w.wear], `${x.id}: もちもの・絵が ある`);
    ok(!kanji.test(w.name) && [...w.name].length <= 10 && !kanji.test(w.desc) && w.desc.length >= 4, `${x.id}: ことばは ひらがな「${w.name}」「${w.desc}」`);
    ok(w.price === R.SlowLifePrices.price("wear", x.price) && w.price >= 250 && w.price <= 1000 && !w.rare && Object.keys(w.st || {}).length >= 1, `${x.id}: ねだん ${w.price}（ふくと おなじ 2.5ばい）・つよさ`);
  }
}

// ---- 2. あたらしい しゅるい「もちもの」 ----
{
  ok(R.SLOT_ORDER.at(-1) === "hand" && !R.WEAR_SLOT_KEYS.includes("hand"), "SLOT_ORDER（いちばん うえ）に hand・WEAR_SLOT_KEYS（かしだしの いしょう）は かわらない");
  ok(!("hand" in SLOT_NAMES), "ぱぱ・ままの きがえ（SLOT_NAMES）には いれない");
  const tabs = BUY_SHOPS.clothes.tabs;
  const shelf = BUY_SHOPS.clothes.items("hand").map((w) => w.id);
  ok(tabs.at(-1)[0] === "hand" && tabs.at(-1)[1] === "もちもの" && HI.ITEMS.every((x) => shelf.includes(x.id)) && shelf.every((id) => ITEM_INDEX[id].slot === "hand"), "ようふくやさんの「もちもの」の たな（7しゅ ぜんぶ・もちもの だけ） " + shelf);
  const dress = read("js/dressup.js");
  ok(/HandItems\.SLOT, HandItems\.TAB/.test(dress), "きがえの タブに「もちもの」");
  const f = S.fresh(); ok(IDS.every((id) => !("hand" in f.chars[id].outfit)) && S.SCHEMA === 2, "セーブは かわらない（outfit.hand は もった とき だけ）");
  const css = read("css/style.css");
  ok(/\.shop-wear \.tabs, \.tabs\.wear-tabs \{ flex-wrap: wrap;/.test(css) && /tabs\.classList\.add\("wear-tabs"\)/.test(dress) && /shop-wear/.test(BUY_SHOPS.clothes.cls), "ふくの タブは 2だんに おりかえす（ようふくやさん・きがえ）");
  for (const x of HI.ITEMS) { const ic = R.Art.iconSvg("wear", x.id); ok(/viewBox="-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+"/.test(ic) && ic.includes(x.col[0]), `${x.id}: アイコン（viewBox は かず・いろ）`); }
}

// ---- 3. 絵 ----
{
  fresh();
  const views = ["down", "left", "right", "up"], poses = ["idle_01", "walk_01", "walk_02", "jump_01", "land_01"];
  for (const x of HI.ITEMS) for (const id of IDS) for (const dir of views) for (const pose of poses) {
    const svg = Chara.svg(id, { outfit: { hand: x.id }, dir, pose, face: "happy" }), base = Chara.svg(id, { outfit: {}, dir, pose, face: "happy" });
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    if (pose !== "idle_01" && pose !== "jump_01") continue; // ことばの かずを おさえる（ほかの ポーズは いろだけ）
    ok(svg.includes(x.col[0]) && svg.length > base.length + 200 && new Set(ids).size === ids.length, `${x.id} ${id} ${dir} ${pose}: 描ける・id が かさならない`);
  }
  // はこ（VB: x -10〜210・y -40〜220）の なか: ふうせんの まんなかと はんけい・バッグの した
  const VB = Chara.VB;
  for (const id of IDS) for (const view of ["front", "back", "side"]) {
    const ctx = { p: PROFILE[id], a: PROFILE[id].a, view, dx: view === "side" ? -PROFILE[id].faceShift : 0, col: [] }, h = HI.hand(ctx);
    const bx = Math.min(186, Math.max(14, h.x + h.side * 18)), by = Math.min(30, Math.max(4, ctx.a.hat.y - 28)), r = 24, jump = (y) => (y - 206) * 1.05 + 186; // とぶ ポーズ（jump_01）の からだの うごき
    ok(bx - r >= VB.x - 2 && bx + r <= VB.x + VB.w + 2 && jump(by - r) >= VB.y, `${id} ${view}: ふうせんが はこの なか（とんでも） ${bx},${by}`);
    ok(h.y + 8 + 28 + 2 <= VB.y + VB.h && h.x >= VB.x && h.x <= VB.x + VB.w, `${id} ${view}: バッグが はこの なか`);
    ok((view === "back") === (h.k === 0), `${id} ${view}: うしろむきは はんたいの 手`);
  }
  const k1 = Chara.key("wanko", { outfit: { hand: "hi_balloon_red" } }), k2 = Chara.key("wanko", { outfit: { hand: "hi_tote" } }), k0 = Chara.key("wanko", { outfit: {} });
  ok(k1 !== k2 && k1 !== k0, "キャッシュの キーに もちもの が はいる");
}

// ---- 4. つよさ・1こで ひとり ----
{
  const d = fresh();
  const hp0 = Stats.max("wanko", "hp");
  d.wardrobe.hi_balloon_bear = 1; d.chars.wanko.outfit.hand = "hi_balloon_bear";
  ok(Stats.max("wanko", "hp") === hp0 + 4, "くまの ふうせんで HP +4");
  ok(HI.held("wanko") === "hi_balloon_bear" && HI.held("gachan") === null, "held");
  ok(WearStock.count("hi_balloon_bear") === 1 && !WearStock.can("hi_balloon_bear", "gachan") && WearStock.can("hi_balloon_bear", "wanko"), "1こで ひとり（WearStock）");
  d.wardrobe.hi_balloon_bear = 2; ok(WearStock.can("hi_balloon_bear", "gachan"), "2こ あれば ふたり");
  d.chars.goji.outfit.hand = "strawhat"; ok(HI.held("goji") === null, "もちもの で ない ものは もって いない");
}

// ---- 5. とうろく ----
{
  const idx = read("index.html"), sw = read("sw.js"), at = (f) => idx.indexOf(`js/${f}`);
  ok(at("hand-items.js") > 0 && ["data.js", "chara.js", "shop.js", "dressup.js", "wear-stock.js"].every((f) => at(f) > 0 && at(f) < at("hand-items.js")) && at("hand-items.js") < at("debug.js"), "index.html の じゅんばん");
  ok(sw.includes('"./js/hand-items.js"'), "sw.js の FILES");
}

console.log(`✓ hand items: ${n} checks（もちもの 7しゅ・3人 × 4むき・ようふくやさん・きがえ）`);
