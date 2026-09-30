// エリアの ちず（js/area-map.js・js/area-map-art.js）の 検査。ブラウザ なしで たてもの・でぐち・なまえの ならび・SVG を たしかめる。
// ぜんぶの エリアで: たてものの しゅるいと めじるし・ひらがなの なまえ・でぐちの いきさき・のりば・なまえが かさならない・はみ出さない・2ばいで ぜんぶ でる・SVG・おなじ 入力で おなじ 絵。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { AreaMap: AM, AreaMapArt: A, MAP_DEFS, AtlasArt, Transit } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const over = (a, b) => a.x0 < b.x1 - 0.01 && a.x1 > b.x0 + 0.01 && a.y0 < b.y1 - 0.01 && a.y1 > b.y0 + 0.01;
// なまえの はこは ふちの よゆう（よこ 3・たて 1）を ふくむ。はこ どうしは よこ 2・たて 1 まで かさなって よい（もじは かさならない）
const tight = (b) => ({ x0: b.x0 + 2, x1: b.x1 - 2, y0: b.y0 + 1, y1: b.y1 - 1 });

// ---- 1. めじるしと しゅるい ----
for (const [k, c] of Object.entries(A.CATS)) ok(c.name && !kanji.test(c.name) && /^#[0-9A-F]{6}$/i.test(c.fill) && /^#[0-9A-F]{6}$/i.test(c.ring) && Number.isInteger(c.order), `しゅるい ${k}`);
for (const [k, d] of Object.entries(A.ICON)) {
  ok(typeof d === "string" && d.startsWith("<") && !/NaN|undefined|\bid=/.test(d), `めじるし ${k}: SVG の かけら（id なし）`);
  const s = A.svg(k, 24, "shop"); ok(s.startsWith("<svg") && s.endsWith("</svg>") && s.includes('aria-hidden="true"'), `めじるし ${k} の SVG`);
}
for (const v of [...Object.values(AM.SHOP_ICON), ...Object.values(AM.VENUE_ICON), ...AM.VISIT.map((x) => x[1]), ...AM.LANDMARKS.map((l) => l.icon), "home", "train", "ship", "plane", "target", "dino", "stairs", "arrow", "here", "crown", "farm", "tree"]) ok(A.ICON[v], `めじるし ${v} が ない`);
for (const t of [...Object.values(AM.NAMES), ...Object.values(AM.STREETS), ...AM.LANDMARKS.map((l) => l.name), ...AM.DIRS]) ok(t && !kanji.test(t), `ちずの ことばに 漢字: ${t}`);

// ---- 2. エリア ごとの データ ----
const areas = Object.keys(AtlasArt.places);
ok(areas.length >= 9 && areas.every((id) => MAP_DEFS[id]), "ちずの エリアが MAP_DEFS に ない");
const stats = {};
for (const id of areas) {
  const d = MAP_DEFS[id], m = AM.model(id, null), W = d.rows[0].length, H = d.rows.length;
  ok(m.W === W && m.H === H && m.cls.length === W * H, `${id}: ますの かず`);
  ok(AM.placeName(id) && !kanji.test(AM.placeName(id)), `${id}: エリアの なまえが ひらがな でない（${AM.placeName(id)}）`);
  ok(A.CATS[m.base] === undefined && AM.PAL[m.base], `${id}: じめんの いろ ${m.base}`);
  for (const c of m.cls) if (c) ok(AM.PAL[c] && AM.LAYERS.includes(c), `${id}: しらない じめん ${c}`);
  // たてもの
  const blds = m.places.filter((p) => p.type === "building");
  ok(blds.length === (d.buildings || []).length, `${id}: たてものの かず`);
  for (const p of blds) {
    ok(A.CATS[p.cat] && A.ICON[p.icon], `${id}: ${p.key} の しゅるい・めじるし`);
    if (p.cat !== "house") ok(p.name && !kanji.test(p.name) && p.name.length <= 14, `${id}: たてものの なまえ「${p.name}」（ひらがな・14もじ まで）`);
    ok(p.door >= p.x && p.door <= p.x + p.w, `${id}: ${p.name} の いりぐち`);
  }
  // のりば: Transit の しゅるいと めじるし
  for (const b of d.buildings || []) if (b.act && b.act.type === "transit") {
    const p = blds.find((q) => q.x === b.x && q.y === b.y), k = Transit.stops[b.act.stop].kind;
    ok(p && p.cat === "ride" && p.icon === ({ train: "train", ferry: "ship", plane: "plane" })[k], `${id}: のりば ${b.label} の めじるし`);
  }
  // でぐち: ワープ ごとに ひとつ・いきさきの なまえは 1かい
  const exits = m.places.filter((p) => p.type === "exit");
  ok(exits.length === (d.warps || []).length, `${id}: でぐちの かず`);
  for (const w of d.warps || []) {
    const p = exits.find((q) => q.x === w.x && q.y === w.y);
    ok(p && p.to === w.to && p.full === AM.placeName(w.to) && !kanji.test(p.full), `${id}: でぐち → ${w.to}`);
    const gap = { up: w.y, down: H - (w.y + w.h), left: w.x, right: W - (w.x + w.w) };
    ok(gap[p.side] === Math.min(...Object.values(gap)), `${id}: でぐち ${w.to} の むき ${p.side}（いちばん ちかい はし）`);
  }
  for (const to of new Set((d.warps || []).map((w) => w.to))) ok(exits.filter((p) => p.to === to && p.name).length === 1, `${id}: ${to} への でぐちの なまえは 1つ`);
  // こもの・はたけ
  for (const o of d.objects || []) if (o.busStop) ok(m.places.some((p) => p.icon === "bus" && p.obj === o), `${id}: バスてい`);
  stats[id] = { places: m.places.length };
}
{
  const t = AM.model("town", null);
  const home = t.places.find((p) => p.cat === "home" && p.type === "building");
  ok(home && home.icon === "home" && home.name === "おうち", "ネリカスタウン: おうち");
  const farm = t.places.find((p) => p.type === "farm");
  ok(farm && farm.plots.length === MAP_DEFS.town.objects.filter((o) => o.kind === "farm_plot").length && farm.cat === "home", "ネリカスタウン: はたけは ひとつに まとめる");
  ok(t.places.some((p) => p.icon === "board" && p.name === "けいじばん") && t.places.some((p) => p.icon === "bus"), "ネリカスタウン: けいじばん・バスてい");
  ok(t.places.filter((p) => p.cat === "house").length >= 5 && t.places.filter((p) => p.cat === "house").every((p) => !p.name), "まちの いえ には なまえを かかない");
  ok(t.trees.length > 20 && t.bg.length > 20 && t.roads.length === MAP_DEFS.town.roads.length, "ネリカスタウン: 木・まちなみ・道");
  const h = AM.model("heiwadai", null);
  ok(h.cls.includes("rail") && h.cls.includes("street") && h.cls.includes("lane") && h.ring, "へいわだい: せんろ・しょうてんがい・ろじ・ロータリー");
  ok(AM.model("city", null).cls.slice(0, 4).every((c) => c === "rail"), "いけぶくろ: せんろ（ひだりの 4ます）");
  const cave = AM.model("cave", null);
  ok(cave.base === "wall" && cave.cls.includes("floor") && cave.places.some((p) => p.icon === "crown"), "どうくつ: かべ・ゆか・ボス");
  ok(AM.model("forest", null).places.some((p) => p.icon === "drop" && p.name === "いやしの いずみ"), "もり: いやしの いずみ");
  ok(AM.model("harbor", null).cls.includes("pier") && AM.model("airport", null).cls.includes("tarmac"), "みなと・くうこう: さんばし・かっそうろ");
}

// ---- 3. なまえの ならび（390・375・2ばい）----
const widths = { 390: 348, 375: 333 };
for (const id of areas) for (const [vw, px] of Object.entries(widths)) for (const z of [1, 2]) {
  const d = MAP_DEFS[id]; let k = px / d.rows[0].length;
  if (d.rows.length * k > 460) k = 460 / d.rows.length;
  k *= z;
  const here = { x: 20.5, y: Math.min(d.rows.length - 2, 30) + 0.5 };
  const m = AM.model(id, here), L = AM.layout(m, k), tag = `${id} ${vw}${z > 1 ? "×2" : ""}`;
  ok(L.W === m.W * k && L.H === m.H * k, `${tag}: おおきさ`);
  const boxes = [...L.labels];
  if (L.hereBox) boxes.push(L.hereBox);
  for (const b of boxes) ok(b.x0 >= 1.9 && b.y0 >= 1.9 && b.x1 <= L.W - 1.9 && b.y1 <= L.H - 1.9, `${tag}: なまえが はみ出す ${b.key || "いま ここ"}`);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) ok(!over(tight(boxes[i]), tight(boxes[j])), `${tag}: なまえが かさなる ${boxes[i].key || "here"} / ${boxes[j].key || "here"}`);
  // だいじで ない なまえは ほかの めじるしに かからない
  for (const b of L.labels) {
    const p = m.places.find((q) => q.key === b.key);
    if (["home", "exit", "ride", "enter"].includes(p.cat)) continue;
    for (const q of m.places) if (q !== p && q.r) ok(!over(tight(b), { x0: q.px - q.r, y0: q.py - q.r, x1: q.px + q.r, y1: q.py + q.r }), `${tag}: 「${b.lines.join("")}」が ${q.name || q.key} の めじるしに かかる`);
  }
  for (const t of L.streets) for (const [, x, y] of t.pts) for (const b of boxes) ok(!(x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1), `${tag}: みちの なまえ ${t.name} が なまえに かかる`);
  ok(L.labels.some((b) => m.places.find((q) => q.key === b.key).cat === "exit") || !(d.warps || []).length, `${tag}: でぐちの なまえ`);
  if (z === 2) ok(L.hidden.length === 0, `${tag}: 2ばいで でない なまえ ${L.hidden.map((key) => m.places.find((q) => q.key === key).name).join("・")}`);
  if (id === "town" && z === 1) ok(L.labels.some((b) => b.lines.join(" ") === "おうち"), `${tag}: おうちの なまえ`);
  stats[id][`${vw}x${z}`] = L.hidden.length;
}
// いま ここ と おうち が となり（はじめの ばしょ）でも かさならない
{
  const m = AM.model("town", { x: 21.5, y: 61.5 }), L = AM.layout(m, 4.46);
  const home = L.labels.find((b) => b.lines.join("") === "おうち");
  ok(home && L.hereBox && !over(tight(home), tight(L.hereBox)), "おうちの まえ: おうちの なまえと いま ここ が かさなる");
}

// ---- 4. SVG ----
for (const id of areas) {
  const draw = () => { const m = AM.model(id, { x: 5.5, y: 5.5 }), L = AM.layout(m, 5); return { m, L, s: AM.svg(m, L, "t-" + id) }; };
  const { m, L, s } = draw(), s2 = draw().s; // layout は model に いちを かきこむ ので まいかい つくる
  ok(s.startsWith("<svg") && s.endsWith("</svg>") && !/NaN|undefined|Infinity/.test(s), `${id}: SVG`);
  ok(s.includes(`aria-label="${MAP_DEFS[id].name}の詳細地図"`) && s.includes('role="img"'), `${id}: SVG の なまえ`);
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
  ok(new Set(ids).size === ids.length && ids.every((x) => x.startsWith("t-" + id)), `${id}: SVG の id`);
  ok(s === s2, `${id}: おなじ 入力で おなじ 絵に ならない`);
  ok((s.match(/<text /g) || []).length >= L.labels.length && s.includes('class="amap-sel"'), `${id}: なまえ と えらぶ しるし`);
  ok((s.match(/class="amap-pin"/g) || []).length === m.places.filter((p) => p.r).length, `${id}: めじるしの かず`);
}
{
  const draw = (here) => { const m = AM.model("town", here); return AM.svg(m, AM.layout(m, 4.46), "a"); };
  ok(!draw(null).includes("amap-here") && draw({ x: 21.5, y: 61.5 }).includes('class="amap-here"'), "いま ここ が 絵に でない");
}

// ---- 5. ふちの パス（マスの あつまり）----
{
  const W = 5, H = 5, g = new Array(W * H).fill(null);
  for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) g[y * W + x] = "water";
  g[2 * W + 2] = null; // まんなかに あな
  const d = AM.outline(g, W, H, "water", 10);
  ok((d.match(/M/g) || []).length === 2 && (d.match(/Z/g) || []).length === 2 && !/NaN/.test(d), "ふち: そとがわ と あな の 2つ");
  const c = new Array(4).fill(null); c[0] = "rock"; c[3] = "rock"; // ななめに となりあう（しんがた）
  const d2 = AM.outline(c, 2, 2, "rock", 10);
  ok((d2.match(/Z/g) || []).length === 2, "ふち: ななめの マスは べつべつ");
  ok(AM.outline(new Array(9).fill(null), 3, 3, "water", 10) === "", "ふち: なにも ない");
}

// ---- 6. せつめいの ことば・むき ----
{
  const here = { x: 10, y: 10 }, P = (cx, cy) => ({ cx, cy });
  ok(AM.dirFrom(here, P(20, 10)) === "いま いる ところから みて みぎの ほう。" && AM.dirFrom(here, P(10, 0)) === "いま いる ところから みて うえの ほう。" && AM.dirFrom(here, P(0, 20)) === "いま いる ところから みて ひだりしたの ほう。", "むき");
  ok(AM.dirFrom(here, P(11, 11)).includes("すぐ ちかく") && AM.dirFrom(null, P(1, 1)) === "", "むき: ちかく・いない とき");
  // たてものの ことば（act.text・マップの データ）は その まま。ちずが つくる ことばだけ しらべる
  for (const id of areas) for (const p of AM.model(id, null).places) { const t = AM.what(p); ok(t && (t === p.text || !kanji.test(t)), `${id}: せつめいに 漢字「${t}」`); }
}

// ---- 7. そとへの つうしん なし・キャッシュ なし ----
for (const f of ["../js/area-map.js", "../js/area-map-art.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|SvgCache/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん する／SvgCache を つかう`);
}
{
  const src = readFileSync(new URL("../js/area-map.js", import.meta.url), "utf8");
  for (const [, t] of src.matchAll(/(?:text|textContent)\s*[:=]\s*"([^"]*)"/g)) ok(!kanji.test(t), `ちずの がめんに 漢字: ${t}`);
  const atlas = readFileSync(new URL("../js/world-atlas.js", import.meta.url), "utf8");
  ok(/AreaMap\.render\(areaPane,current\)/.test(atlas) && !/localMap/.test(atlas), "せかい ちず から AreaMap を つかう");
}
console.log(`AreaMap: ${areas.length} areas (${Object.entries(stats).map(([id, s]) => `${id} ${s.places}`).join(", ")}), categories and pictograms, kana names, exits and stops, label layout at 390/375/x2 (no overlaps, all names at x2), SVG ids/determinism, outline tracer, texts, no network — ${n} checks OK`);
