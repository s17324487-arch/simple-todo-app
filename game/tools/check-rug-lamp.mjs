// ラグと ランプ（js/rug-lamp.js・UI-39）の 検査。ブラウザ なしで たしかめる。
// かぐやで かえる・ねだん（4ばい）・なまえと せつめいは ひらがな・もようがえの しゅるい（ラグ／あかり）・ずかんの ヒント・
// 立体（4とおり・id・live の とうろく）・ランプは タップで つく／きえる（よるは はじめから）・ラグは タップで ひとこと・どうろの ミニカーは どうろの うえ。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { RugLamp: RL, FURN_INDEX, FURNITURE, FURN_ART, HomeDesign, FurnLive, FurnModels, BUY_SHOPS, ItemDexSources, SlowLifePrices, FurnTray, DayTint } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const norm = (svg) => svg.replace(/\bid="[^"]+"|url\(#[^)]+\)|href="#[^"]+"/g, "");

// ---- 1. 家具の とうろく ----
ok(RL.ITEMS.length === 16 && RL.rugs.length === 8 && RL.lamps.length === 8, "ラグ 8・ランプ 8");
const shop = BUY_SHOPS.furniture.items("floor").map((f) => f.id);
const names = new Set(FURNITURE.map((f) => f.name));
ok(names.size === FURNITURE.length || [...RL.IDS].every((id) => FURNITURE.filter((f) => f.name === FURN_INDEX[id].name).length === 1), "なまえは ほかの 家具と かぶらない");
for (const [id, name, base, kind, w, depth, h, comfort, desc] of RL.ITEMS) {
  const f = FURN_INDEX[id];
  ok(f && FURNITURE.includes(f) && f.kind === kind && f.name === name && f.desc === desc && f.w === w && f.depth === depth && f.h === h && f.comfort === comfort, `${id}: データ`);
  ok(f.price === SlowLifePrices.price("furniture", base) && f.price >= 600 && f.price <= 1600 && !f.rare && !f.exclusive, `${id}: ねだん ${f.price}（もとの ${base} の 4ばい）`);
  ok(shop.includes(id), `${id}: かぐやで かえる`);
  ok(/かぐや/.test(ItemDexSources.source("furn", f)), `${id}: ずかんの ヒント`);
  ok(!kanji.test(name) && name.length <= 13 && !kanji.test(desc) && desc.length <= 24 && /[。！]$/.test(desc), `${id}: なまえ・せつめいは ひらがなで みじかく`);
  ok(FURNITURE.filter((x) => x.name === name).length === 1, `${id}: なまえが かぶらない`);
  ok(kind === "rug" ? w >= 120 && w <= 200 && depth >= 110 && depth <= 150 && h <= 4 : w <= 120 && depth <= 60 && h >= 50 && h <= 180, `${id}: 大きさ`);
  const c = FurnTray.cats(f);
  ok(kind === "rug" ? c.has("rug") && c.size === 1 : c.has("light") && !c.has("rug") && !c.has("wall"), `${id}: もようがえの しゅるい（${[...c]}）`);
  ok(f.interactive, `${id}: さわれる`);
}

// ---- 2. 立体: 4とおり・id・live ----
const seen = new Set();
for (const id of RL.IDS) {
  ok(FurnModels.has(id), `${id}: FurnModels`);
  const a = HomeDesign.model(id), b = HomeDesign.model(id, { flip: true }), lv = HomeDesign.model(id, { live: true }), lvf = HomeDesign.model(id, { live: true, flip: true });
  for (const [k, m] of [["ふつう", a], ["はんてん", b], ["live", lv], ["live はんてん", lvf]]) {
    ok(m.w > 0 && m.h > 0 && Number.isFinite(m.x) && Number.isFinite(m.y) && !/NaN|undefined|Infinity/.test(m.full), `${id}: ${k} の 絵`);
    const list = ids(m.full); ok(new Set(list).size === list.length, `${id}: ${k} の id`);
  }
  ok(a.full.length > 2000 && a.full.length < 60000 && a.full !== b.full && FURN_ART[id]() === a.full, `${id}: 絵の こまかさ・はんてん・アイコン`);
  ok(!seen.has(norm(a.full)), `${id}: ほかと おなじ 絵`); seen.add(norm(a.full));
  ok(FurnLive.LIVE.has(id) === (norm(lv.full) !== norm(a.full)), `${id}: live の とうろく と 絵の ぬきかた`);
}
ok([...RL.IDS].filter((id) => FurnLive.LIVE.has(id)).join() === "rug_road,lamp_lava,lamp_candle", "live は どうろ（ミニカー）・ラバランプ（たま）・しょくだい（ほのお）");

// ---- 3. さわる ----
R.UI.toast = () => {};
const fake = { s: 1, chars: [], anchor: () => ({ x: 0, y: 0 }), react: () => {} };
const hour0 = DayTint.hour;
for (const [label, hr] of [["ひる", 11], ["よる", 21]]) {
  DayTint.hour = () => hr;
  for (const [i, id] of RL.IDS.entries()) {
    const it = { uid: (hr === 11 ? 700 : 800) + i, id, x: 240, y: 470, flip: false }, before = FurnLive.state(it);
    if (RL.lamps.includes(id)) ok(before.on === (hr === 21), `${id}: ${label}の はじめは ${hr === 21 ? "ついて いる" : "きえて いる"}`);
    ok(FurnLive.tap(fake, it), `${id}: タップ`);
    const after = FurnLive.state(it);
    ok(RL.lamps.includes(id) ? after.on === !before.on : after.n === before.n + 1, `${id}: ${label}に タップで ようすが かわる`);
  }
}
DayTint.hour = hour0;
// どうろの ミニカー: どうろの まんなかの せんの うえを まわる
for (let u = 0; u < 1; u += 0.02) {
  const q = RL.roadAt(u), d = Math.min(Math.abs(q.x + 96 - 29), Math.abs(q.x - 96 + 29), Math.abs(q.y + 140 - 29), Math.abs(q.y + 29));
  ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.ang) && d < 17.5 && q.x > -96 + 18 && q.x < 96 - 18 && q.y > -140 + 18 && q.y < -18, `ミニカーは どうろの うえ（${u.toFixed(2)}）`);
}

// ---- 4. ことば ----
const src = readFileSync(new URL("../js/rug-lamp.js", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
const lines = [...src.matchAll(/"([^"\n]*[ぁ-んァ-ヶ][^"\n]*)"/g)].map((m) => m[1]);
ok(lines.length >= 60, `ことば ${lines.length}`);
for (const l of lines) ok(!kanji.test(l) && l.length <= 26, `ことば ${l}`);

console.log(`✓ rug & lamp: ${n} checks（ラグ ${RL.rugs.length}・ランプ ${RL.lamps.length}・ことば ${lines.length}）`);
