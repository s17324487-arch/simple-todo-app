// あき・ふゆの かぐと ハイクオリティの ひがわり かぐ（js/furniture-collection.js・UI-40）の 検査。ブラウザ なしで たしかめる。
// データ（ねだん 4ばい・ひらがな・大きさ・もようがえの しゅるい・ずかんの ヒント）・クイズの だんろ・2にちごとの ひがわり（10にちで ひとまわり・
// かぐやの まえに 2つずつ・ほかの ひがわりは ならばない・どの 日も ねだんの まんなかが かわらない）・立体と かべの 絵（4とおり・id・live）・さわる・ことば。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FurnCollection: C, FURN_INDEX, FURNITURE, FURN_ART, HomeDesign, FurnLive, FurnModels, BUY_SHOPS, ItemDexSources, SlowLifePrices, FurnTray, DayTint, QuizPrizes, Art, Seasonal } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const norm = (svg) => svg.replace(/\bid="[^"]+"|url\(#[^)]+\)|href="#[^"]+"/g, "");
const at = (y, m, d) => new Date(y, m - 1, d, 12);

// ---- 1. データ ----
ok(C.AUTUMN.length === 4 && C.FLOOR.length === 10 && C.WALL.length === 10 && C.ROWS.length === 24, "あき・ふゆ 4・ひがわりの ゆか 10・かべ 10");
const shopFloor0 = BUY_SHOPS.furniture.items("floor").map((f) => f.id);
for (const [id, name, base, kind, w, depth, h, comfort, desc, more = {}] of C.ROWS) {
  const f = FURN_INDEX[id];
  ok(f && FURNITURE.includes(f) && f.kind === kind && f.name === name && f.desc === desc && f.w === w && f.h === h && f.comfort === comfort && (kind === "wall" ? f.depth === undefined : f.depth === depth), `${id}: データ`);
  ok(f.price === SlowLifePrices.price("furniture", base) && !f.rare && !f.exclusive && f.price >= 1000 && f.price <= 6000, `${id}: ねだん ${f.price}（もとの ${base} の 4ばい）`);
  ok(!kanji.test(name) && name.length <= 13 && !kanji.test(desc) && desc.length <= 24 && /[。！]$/.test(desc), `${id}: なまえ・せつめいは ひらがなで みじかく`);
  ok(FURNITURE.filter((x) => x.name === name).length === 1, `${id}: なまえが かぶらない`);
  ok(kind === "rug" ? w >= 120 && w <= 200 && depth >= 110 && depth <= 150 && h <= 4 : kind === "wall" ? w >= 40 && w <= 100 && h >= 40 && h <= 100 : w <= 150 && depth <= 100 && h >= 60 && h <= 180, `${id}: 大きさ`);
  const c = FurnTray.cats(f), want = kind === "wall" ? ["wall"] : kind === "rug" ? ["rug"] : more.cat;
  ok(want.every((k) => c.has(k)) && c.size === want.length, `${id}: もようがえの しゅるい（${[...c]}）`);
  ok(f.interactive, `${id}: さわれる`);
  ok(!!f.daily === !C.AUTUMN.includes(id) && C.DAILY.has(id) === !!f.daily, `${id}: ひがわり`);
  const hint = ItemDexSources.source("furn", f);
  ok(f.daily ? /2にちごとに/.test(hint) : /かぐや/.test(hint), `${id}: ずかんの ヒント「${hint}」`);
  if (!f.daily) ok(shopFloor0.includes(id), `${id}: かぐやで いつでも かえる`);
}
ok(FURN_INDEX.hq_canopy_bed.sleep === 2, "てんがいの ベッドで ねられる");
// クイズの だんろ
const q = FURN_INDEX[C.QUIZ], qp = QuizPrizes.items.find((p) => p.id === C.QUIZ);
ok(q && qp && qp.tier === "luxury" && q.rare && q.quizPrize && q.price >= 10000 && q.kind === "floor", "ほしぞらの だんろ: クイズの ごうか");
ok(QuizPrizes.items.filter((p) => p.tier === "luxury").length === 4 && !BUY_SHOPS.furniture.items("floor").some((f) => f.id === C.QUIZ), "ごうか 4つ・かぐやに ならばない");
ok(/クイズ/.test(ItemDexSources.source("furn", q)) && !kanji.test(q.name + q.desc) && FurnTray.cats(q).has("special"), "だんろの ヒント・ひらがな・とくべつ");
ok(QuizPrizes.rollLuxury(() => 0.99).furn === C.QUIZ, "クイズで だんろが でる");

// ---- 2. ひがわり ----
const seen = { floor: new Map(), wall: new Map() };
const d0 = at(2026, 10, 2), base = C.dayNum(d0);
ok(base % 2 === 0, "2026-10-02 は くぎりの はじめ");
const medians = new Set(), small = new Set();
for (let i = 0; i < 20; i++) {
  const d = at(2026, 10, 2 + i), day = C.dayNum(d);
  ok(day === base + i, `日の かず（${i}）`);
  ok(C.daysLeft(d) === (i % 2 ? 1 : 2), `あと なんにち（${i}）`);
  for (const tab of ["floor", "wall"]) {
    const f = C.featured(tab, d), L = tab === "floor" ? C.FLOOR : C.WALL;
    ok(f.length === 2 && f[0] !== f[1] && f.every((id) => L.includes(id)), `${tab}: 2つ（${i}）`);
    if (i % 2) ok(JSON.stringify(f) === JSON.stringify(C.featured(tab, at(2026, 10, 1 + i))), `${tab}: 2にちは おなじ（${i}）`);
    else f.forEach((id) => seen[tab].set(id, (seen[tab].get(id) || 0) + 1));
    // かぐやの ならび: まえに きょうの 2つ・ほかの ひがわりは ない
    Seasonal.override = d;
    const list = BUY_SHOPS.furniture.items(tab), daily = list.filter((x) => C.DAILY.has(x.id)).map((x) => x.id);
    ok(JSON.stringify(daily) === JSON.stringify(f) && list[0].id === f[0] && list[1].id === f[1], `${tab}: かぐやの まえに きょうの 2つ（${i}）`);
    if (tab === "floor") {
      const p = list.map((x) => x.price).filter((x) => x > 0).sort((a, b) => a - b);
      medians.add(p[Math.floor(p.length / 2)]);
      small.add(Math.max(...list.filter((x) => x.w <= 60 && x.price < 2000).map((x) => x.price)));
    }
    const note = BUY_SHOPS.furniture.note(FURN_INDEX[f[0]]);
    ok(/ひがわり/.test(note) && (i % 2 ? /きょう だけ/ : /あした まで/).test(note) && !kanji.test(note), `${tab}: くわしくの ひとこと（${i}）`);
    Seasonal.override = null;
  }
}
for (const tab of ["floor", "wall"]) ok(seen[tab].size === 10 && [...seen[tab].values()].every((k) => k === 2), `${tab}: 10にちで ぜんぶ 1かいずつ（20にちで 2かい）`);
// すいぞくかんの おみやげの ねだん（check-aqua-gifts.mjs）が 日に よって かわらない
const [med] = medians;
ok(medians.size === 1 && med >= 1490, `かぐやの まんなかの ねだんは どの 日も ${med}（コラボの おみやげ 2980 が 2ばい まで）`);
ok(small.size === 1 && [...small][0] < 1280, `ちいさな かざりは どの 日も ${[...small][0]} まで（すいぞくかんの フィギュア 1280〜 より やすい）`);
ok(BUY_SHOPS.furniture.note(FURN_INDEX.aw_knit_sofa) === "" && BUY_SHOPS.furniture.items("wp").length > 0, "ひがわり で ない かぐ・かべがみは そのまま");
ok(JSON.stringify(R.PokaDebug.furnDaily()) === JSON.stringify(C.state()), "PokaDebug.furnDaily");

// ---- 3. 絵: 4とおり・id・live ----
const LIVE = ["aw_snow_tree", "quiz_starry_fireplace", "hq_silver_clock", "hq_sunflower_art", "hq_cuckoo_clock", "hq_heart_neon", "hq_gold_wreath"];
const art = new Set();
for (const id of [...C.ROWS.map((r) => r[0]), C.QUIZ]) {
  const f = FURN_INDEX[id], wall = f.kind === "wall";
  const get = (o) => (wall ? { full: Art.furnSvg(id, o), w: f.w, h: f.h, x: 0, y: 0 } : HomeDesign.model(id, o));
  const a = get({}), b = get({ flip: true }), lv = get({ live: true }), lvf = get({ live: true, flip: true });
  if (!wall) ok(FurnModels.has(id), `${id}: FurnModels`);
  for (const [k, m] of [["ふつう", a], ["はんてん", b], ["live", lv], ["live はんてん", lvf]]) {
    ok(m.w > 0 && m.h > 0 && Number.isFinite(m.x) && Number.isFinite(m.y) && !/NaN|undefined|Infinity/.test(m.full), `${id}: ${k} の 絵`);
    const list = ids(m.full); ok(new Set(list).size === list.length, `${id}: ${k} の id`);
  }
  ok(a.full.length > (wall ? 2000 : 4000) && a.full.length < 60000 && a.full !== b.full, `${id}: 絵の こまかさ・はんてん`);
  ok(wall ? FURN_ART[id]({}).length > 1000 && !/<svg/.test(FURN_ART[id]({})) && norm(a.full).includes(norm(FURN_ART[id]({})).slice(0, 80)) : FURN_ART[id]() === a.full, `${id}: アイコン`);
  ok(!art.has(norm(a.full)), `${id}: ほかと おなじ 絵`); art.add(norm(a.full));
  ok(FurnLive.LIVE.has(id) === LIVE.includes(id) && (norm(lv.full) !== norm(a.full)) === LIVE.includes(id), `${id}: live の とうろく と 絵の ぬきかた`);
}
// ---- 4. さわる ----
R.UI.toast = () => {};
const fake = { s: 1, chars: [], anchor: () => ({ x: 0, y: 0 }), react: () => {}, wallPoint: () => ({ x: 0, y: 0 }) };
const hour0 = DayTint.hour;
for (const [label, hr] of [["ひる", 11], ["よる", 21]]) {
  DayTint.hour = () => hr;
  for (const [i, id] of [...C.ROWS.map((r) => r[0]), C.QUIZ].entries()) {
    const f = FURN_INDEX[id], it = { uid: (hr === 11 ? 900 : 950) + i, id, x: 240, y: f.kind === "wall" ? 100 : 470, flip: false }, before = FurnLive.state(it);
    if (C.LAMPS.includes(id)) ok(before.on === (hr === 21), `${id}: ${label}の はじめは ${hr === 21 ? "ついて いる" : "きえて いる"}`);
    ok(FurnLive.tap(fake, it), `${id}: タップ`);
    const after = FurnLive.state(it);
    ok(C.LAMPS.includes(id) ? after.on === !before.on : after.n === before.n + 1, `${id}: ${label}に タップで ようすが かわる`);
  }
}
DayTint.hour = hour0;
// ピアノは ひいて いる あいだは つぎの きょくに ならない・テレビは 4ばんぐみ → おしまい・はとどけいは ことりが でる
{
  const p = { uid: 990, id: "hq_crystal_piano", x: 240, y: 470 }; FurnLive.tap(fake, p); const s1 = FurnLive.state(p); FurnLive.tap(fake, p);
  ok(FurnLive.state(p).n === s1.n && s1.song === "きらきらぼし", "ピアノ: 1きょく ひいて いる あいだは つぎに ならない");
  const tv = { uid: 991, id: "hq_home_theater", x: 240, y: 470 }, chs = [];
  for (let k = 0; k < 5; k++) { FurnLive.tap(fake, tv); chs.push(FurnLive.state(tv).ch); }
  ok(chs.join() === "1,2,3,4,0", `テレビ: ばんぐみ ${chs}`);
  const ck = { uid: 992, id: "hq_cuckoo_clock", x: 240, y: 100 }; FurnLive.tap(fake, ck);
  ok(FurnLive.state(ck).bird === true, "はとどけい: タップで ことりが でる");
}

// ---- 5. ことば ----
// 文字列を 1つずつ とりだす（コメントは とばす・テンプレートの ${...} は ${} に する）。SVG（< を ふくむ）は のぞく
const src = readFileSync(new URL("../js/furniture-collection.js", import.meta.url), "utf8"), strs = [];
for (let i = 0; i < src.length; ) {
  const c = src[i];
  if (c === "/" && src[i + 1] === "/") { const e = src.indexOf("\n", i); i = e < 0 ? src.length : e; continue; }
  if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i) + 2; continue; }
  if (c !== '"' && c !== "'" && c !== "`") { i++; continue; }
  let j = i + 1, out = "";
  while (j < src.length && src[j] !== c) {
    if (src[j] === "\\") { out += src[j + 1]; j += 2; continue; }
    if (c === "`" && src[j] === "$" && src[j + 1] === "{") { let k = j + 2, lvl = 1; while (k < src.length && lvl) { if (src[k] === "{") lvl++; else if (src[k] === "}") lvl--; k++; } out += "${}"; j = k; continue; }
    out += src[j++];
  }
  strs.push(out); i = j + 1;
}
const lines = strs.filter((l) => /[ぁ-んァ-ヶ]/.test(l) && !/[<>]/.test(l));
ok(lines.length >= 100, `ことば ${lines.length}`);
for (const l of lines) ok(!kanji.test(l) && l.replace(/\$\{\}/g, "").length <= 30, `ことば ${l}`);

console.log(`✓ furniture collection: ${n} checks（あき・ふゆ ${C.AUTUMN.length}・ひがわり ゆか ${C.FLOOR.length}・かべ ${C.WALL.length}・クイズの だんろ・ことば ${lines.length}・まんなかの ねだん ${med}）`);
