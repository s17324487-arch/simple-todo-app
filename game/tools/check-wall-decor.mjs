// かべかざり 24しゅ（js/wall-decor.js・UI-116。オーナーの 指示 2026-10-09「壁に飾れるアイテムを増やして。」）の 検査。
// ブラウザ なしで: しなもの（かべ・ねだん・なまえ・いごこち）・絵（id なし・INK・NaN なし・live の とき うごく ぶぶんを ぬく）・
// さわる（ぜんぶ・いつも うごく もの・あかり）・canvas に 描いても こわれない・かぐやの ならび と ふだ・ずかん・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { WallDecor: W, FURN_INDEX, FURNITURE, FurnLive, BUY_SHOPS, Art, Save: S, SlowLifePrices, FurnCollection, ItemDexSources } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const INK = R.INK || "#1F1D1B";

// ---- 1. しなもの ----
ok(W.IDS.length === 24 && new Set(W.IDS).size === 24 && W.IDS.every((id) => /^wd_[a-z_]+$/.test(id)), "かべかざりは 24しゅ");
for (const [id, name, base, w, h, comfort, desc] of W.ROWS) {
  const f = FURN_INDEX[id];
  ok(f && f.kind === "wall" && FURNITURE.includes(f) && f.w === w && f.h === h && w <= 140 && h <= 110, `${id}: かべの かぐ（${w}×${h}）`);
  ok(f.price === SlowLifePrices.price("furniture", base) && f.price >= 1000 && f.price <= 2600 && !f.rare, `${id}: ねだんは もとの 4ばい（${f.price}）`);
  ok(f.comfort === comfort && comfort >= 3 && comfort <= 6, `${id}: いごこち`);
  ok(!/[一-鿿]/.test(name + desc) && [...name].length <= 14 && [...desc].length <= 30 && f.name === name, `${id}: なまえ・せつめいは ひらがな・カタカナ（${name}）`);
}
ok(new Set(W.ROWS.map((r) => r[1])).size === 24 && !W.ROWS.some((r) => FURNITURE.some((f) => f.id !== r[0] && f.name === r[1])), "なまえは ほかの かぐと かさならない");

// ---- 2. 絵 ----
for (const id of W.IDS) {
  const f = FURN_INDEX[id], svg = Art.furnSvg(id), live = Art.furnSvg(id, { live: true });
  ok(svg.startsWith("<svg") && svg.includes(INK) && !/NaN|undefined|Infinity/.test(svg) && !/\bid="/.test(svg) && !/url\(#/.test(svg), `${id}: 絵（id・NaN なし・INK の 線）`);
  ok(svg.includes(`viewBox="-12 -12 ${f.w + 24} ${f.h + 24}"`) && !/NaN|undefined/.test(live), `${id}: わく・live の 絵`);
}
for (const id of ["wd_round_clock", "wd_moon_stars", "wd_fish_tank", "wd_pinwheel", "wd_star_neon", "wd_calendar", "wd_kite"]) ok(Art.furnSvg(id, { live: true }).length < Art.furnSvg(id).length, `${id}: live の ときは うごく ぶぶんを canvas に（絵から ぬく）`);

// ---- 3. さわる ----
for (const id of W.IDS) ok(FURN_INDEX[id].interactive && FurnLive.get(id) && typeof FurnLive.get(id).tap === "function" && typeof FurnLive.get(id).draw === "function", `${id}: さわると うごく`);
ok(W.LIVE.every((id) => FurnLive.LIVE.has(id)) && W.IDS.filter((id) => FurnLive.LIVE.has(id)).length === W.LIVE.length, "いつも うごく 7しゅ " + W.LIVE);
ok(W.LAMPS.every((id) => FurnLive.get(id).isOn && FurnLive.get(id).light), "あかり（ほしの ライト・ネオン）は つく／きえる・へやを てらす");
// canvas に 描く（にせの ctx・こわれない・タップ）
{
  const calls = [];
  const PROPS = new Set(["fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin", "font", "textAlign", "textBaseline", "globalAlpha", "globalCompositeOperation", "shadowBlur", "shadowColor"]);
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : PROPS.has(k) ? undefined : (...a) => { calls.push(k); if (k === "createRadialGradient" || k === "createLinearGradient") return { addColorStop() {} }; }), set: (t, k, v) => { t[k] = v; return true; } });
  const realm = W.art.constructor("return this")(); if (!realm.Path2D) realm.Path2D = class { constructor(d) { this.d = d; } }; // ネオン・かがみの くだの みち
  R.G.t = 12.5; S.d = S.fresh();
  const said = [];
  const sc = { s: 1.2, chars: [], wallPoint: (it, x, y) => ({ x: 100 + x, y: 50 + y }), react() {} };
  R.HomeLife.say = (s2, who, line) => said.push(line);
  sc.chars = [{ id: "wanko", x: 100, y: 300 }];
  for (const id of W.IDS) {
    const it = { uid: 1, id, x: 200, y: 110 }, h = FurnLive.get(id), st = { t0: -1 };
    assert.doesNotThrow(() => h.draw(ctx, sc, it, { x: 0, y: 0, w: 10, h: 10 }, st), id + " draw");
    assert.doesNotThrow(() => h.tap(sc, it, st), id + " tap");
    R.G.t += 0.5;
    assert.doesNotThrow(() => { h.draw(ctx, sc, it, { x: 0, y: 0, w: 10, h: 10 }, st); if (h.light) h.light(ctx, sc, it, {}, st); }, id + " draw after tap");
    it.wallSide = "left"; it.flip = true; assert.doesNotThrow(() => h.draw(ctx, sc, it, {}, st), id + " left wall");
    n += 3;
  }
  ok(said.length === 24 && said.every((t) => typeof t === "string" && t.length > 2 && !/[一-鿿]/.test(t)), "タップで 3人の ひとこと（ひらがな）");
  ok(said.some((t) => /^いまは \d+じ \d+ふん$/.test(t)) && said.some((t) => /^きょうは \d+がつ \d+にち$/.test(t)), "とけい・カレンダーは ほんとうの じこくと ひづけ");
  ok(calls.includes("fillText") && calls.includes("arc"), "canvas に 描いた");
}

// ---- 4. かぐや・ずかん ----
{
  const shop = BUY_SHOPS.furniture, wall = shop.items("wall"), ids = wall.map((f) => f.id);
  const daily = ids.filter((id) => FurnCollection.DAILY.has(id));
  ok(W.IDS.every((id) => ids.includes(id)) && daily.length === 2, "かぐやの「かべかざり」に 24しゅ（ひがわり 2つ）");
  ok(ids.slice(0, 2).every((id) => FurnCollection.DAILY.has(id)) && ids.slice(2, 26).every((id) => W.IDS.includes(id)), "ならび: ひがわり → あたらしい かべかざり → まえからの もの");
  ok(!shop.items("floor").some((f) => W.IDS.includes(f.id)), "「かぐ」には でない");
  ok(W.IDS.every((id) => ItemDexSources.source("furn", FURN_INDEX[id]) === `${BUY_SHOPS.furniture.name}で かえるよ。`), "ずかんの ヒント: かぐやさんで かえる");
  ok(/ShopUI\.card = function/.test(read("js/wall-decor.js")) && read("js/wall-decor.js").includes('text: "あたらしい"') && read("css/style.css").includes(".card .wd-tag"), "カードに「あたらしい」の ふだ");
}

// ---- 5. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`js/${f}`);
  ok(at("wall-decor.js") > Math.max(at("furniture-collection.js"), at("room-styles.js"), at("table-ware.js"), at("display-shelves.js"), at("slow-life-prices.js")) && at("wall-decor.js") < at("debug.js") && sw.includes('"./js/wall-decor.js"'), "index.html（furniture-collection.js・table-ware.js の あと）と sw.js");
  ok(typeof FurnCollection.wallKit.wallTf === "function" && typeof FurnCollection.wallKit.wallSimple === "function", "FurnCollection.wallKit");
}
console.log(`✓ かべかざり 24しゅ（UI-116）: ${n} 項目`);
