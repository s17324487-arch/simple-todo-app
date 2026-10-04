// おうちの そとの カスタマイズと 工務店（js/house-ext*.js・js/koumuten.js・UI-74。オーナーの FB 2026-10-03「お家の外見カスタマイズ機能もつけて。
// それに伴い、工務店をネリカスタウンに追加して、そこでパーツや塗装を購入してカスタマイズできるようにして。」）の 検査。
// ブラウザ なしで: パーツ 9しゅと ペンキ 18いろ（id・なまえ・ねだん・はじめから もって いる もの）・セーブ（つかう ときに できる・こわれた ものを なおす）・
// かう（コイン・たりない・2どめは ただ）・つける（もって いる もの だけ）・町の 絵の キー（有限・もどせる）・絵（ぜんぶの パーツ × ひる／よる・
// id なし・NaN なし・タグの かず）・町の「みんなの おうち」の きりかえ・工務店（町の 建物・館の かたち・とおれる マス・みほん → タブ・もけいの キー）・
// 建物の 原画・とうろく・PokaDebug・文書
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HouseExt: X, HouseExtArt: A, HouseExtUI: XU, Koumuten: K, VenueHalls, MAP_DEFS, Save: S, WorldArt, Art, HeiwadaiTown, PokaDebug, IsoVenue } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = (coins = 0) => { S.d = S.fresh(); S.d.coins = coins; return S.d; };

// ---- 1. パーツと ペンキ ----
ok(X.CATS.map((c) => c.id).join() === "roof,siding,window,door,chimney,top,lamp,post,yard", "パーツは 9しゅ（やね・かべ・まど・ドア・えんとつ・やねの うえ・あかり・ポスト・にわ）");
let parts = 0;
for (const c of X.CATS) {
  ok(c.parts.length >= 4 && c.parts[0].price === 0 && new Set(c.parts.map((p) => p.id)).size === c.parts.length, `${c.name}: 4しゅ いじょう・さいしょは ただ・id が ちがう`);
  ok(!kanji.test(c.name) && c.parts.every((p) => !kanji.test(p.name) && p.name.length <= 9), `${c.name}: なまえは ひらがな・カタカナ（9もじ まで）`);
  ok(c.parts.every((p) => p.price === 0 || (p.price >= 800 && p.price <= 3000 && p.price % 100 === 0)), `${c.name}: ねだんは 800〜3000（100 きざみ）`);
  ok(c.parts.every((p) => p.key === c.id + ":" + p.id), `${c.name}: もちものの キー`);
  parts += c.parts.length;
}
ok(parts >= 40, `パーツ ぜんぶで ${parts}`);
ok(X.PAINTS.length === 18 && new Set(X.PAINTS.map((p) => p.id)).size === 18 && X.PAINTS.every((p) => /^#[0-9A-F]{6}$/.test(p.hex) && !kanji.test(p.name)), "ペンキ 18いろ（id・いろ・なまえ）");
ok(X.PAINTS.filter((p) => p.price === 0).map((p) => p.id).sort().join() === Object.values(X.DEFAULT_PAINT).sort().join(), "ただの いろは はじめの 4いろ（やね・かべ・ドア・まどわく）");
ok(X.PAINTS.every((p) => [0, 300, 500].includes(p.price)), "ペンキは 300・500 コイン");
ok(X.TARGETS.map((t) => t.id).join() === "roof,wall,door,trim" && X.TARGETS.every((t) => !kanji.test(t.name)), "ぬる ところ 4か所");

// ---- 2. セーブ ----
{
  fresh();
  ok(!("exterior" in S.fresh()) && S.SCHEMA === 2, "Save.fresh() に exterior は ない（つかう ときに できる）・SCHEMA は 2");
  ok(!X.custom() && X.key() === X.DEFAULT_KEY && !("exterior" in S.d), "はじめは もとの おうち（しらべても つくらない）");
  const e = X.st(); ok(S.d.exterior === e && JSON.stringify(e.parts) === JSON.stringify(X.DEFAULT_PARTS) && JSON.stringify(e.paint) === JSON.stringify(X.DEFAULT_PAINT), "st() で できる");
  S.d.exterior = "こわれた"; ok(X.st().parts.roof === "gable", "こわれた セーブを なおす");
  S.d.exterior = { parts: { roof: "steep", door: "nope" }, paint: { wall: "sora", roof: 5 }, owned: { "roof:steep": true, "roof:gable": true, "x:y": true }, paints: { sora: true, cream: true, zzz: true } };
  const c = X.st();
  ok(c.parts.roof === "steep" && c.parts.door === "glass" && c.paint.wall === "sora" && c.paint.roof === "akacha", "へんな パーツ・いろは はじめの もの " + JSON.stringify(c));
  ok(Object.keys(c.owned).join() === "roof:steep" && Object.keys(c.paints).join() === "sora", "もちものは かえる もの だけ（ただの もの・へんな id は のこさない）");
  S.d.exterior = { parts: { roof: "round" }, paint: { wall: "ao" }, owned: {}, paints: {} };
  ok(X.st().parts.roof === "gable" && X.st().paint.wall === "cream", "もって いない ものは つけて いない ことに");
}

// ---- 3. かう・つける ----
{
  fresh(3000);
  ok(X.buy("roof", "steep") && S.d.coins === 600 && X.has("roof", "steep"), "とんがり（2400）を かう");
  ok(X.buy("roof", "steep") && S.d.coins === 600, "2どめは ただ");
  ok(!X.buy("siding", "log") && S.d.coins === 600 && !X.has("siding", "log"), "コインが たりない ときは かえない");
  ok(X.buyPaint("sora") && S.d.coins === 300 && X.hasPaint("sora") && X.hasPaint("cream"), "そら（300）を かう・クリームは はじめから");
  ok(!X.buy("roof", "nope") && !X.buyPaint("nope"), "ない ものは かえない");
  ok(!X.apply({ parts: { siding: "log" } }) && X.view().parts.siding === "plaster", "もって いない ものは つけられない");
  ok(X.apply({ parts: { roof: "steep" }, paint: { wall: "sora", door: "kinoiro" } }) && X.custom(), "もって いる ものを つける");
  const v = X.view(); ok(v.parts.roof === "steep" && v.paint.wall === "sora" && v.parts.door === "glass", "つけた ところ だけ かわる");
  ok(X.total() === 2, "かった かず");
  ok(X.apply({ parts: { ...X.DEFAULT_PARTS }, paint: { ...X.DEFAULT_PAINT } }) && !X.custom() && X.has("roof", "steep"), "もとに もどしても もちものは のこる");
  // がめんの けいさん（まだ かって いない もの・ごうけい）
  const d = { parts: { ...X.DEFAULT_PARTS, roof: "round", yard: "tree" }, paint: { ...X.DEFAULT_PAINT, wall: "sakura", roof: "sakura" } };
  ok(XU.cost(d) === 2200 + 1200 + 300 && XU.unpaid(d).length === 3, "まだ かって いない もの（おなじ いろは 1かい）・ごうけい " + XU.cost(d));
}

// ---- 4. 町の 絵の キー ----
{
  fresh();
  ok(/^[a-z]+(\.[a-z]+){8}\|[a-z]+(\.[a-z]+){3}$/.test(X.DEFAULT_KEY), "キーは パーツ 9つ と いろ 4つ の id だけ: " + X.DEFAULT_KEY);
  let combos = 1; for (const c of X.CATS) combos *= c.parts.length; combos *= X.PAINTS.length ** 4;
  ok(Number.isFinite(combos) && combos > 1, `キーは 有限（${combos.toExponential(2)} とおり）`);
  for (const c of X.CATS) for (const p of c.parts) {
    const d = { parts: { ...X.DEFAULT_PARTS, [c.id]: p.id }, paint: { ...X.DEFAULT_PAINT } };
    const k = X.key(d), back = X.parse(k);
    ok(back.parts[c.id] === p.id && X.key(back) === k, `キーから もどせる: ${c.id}:${p.id}`);
  }
  ok(X.key(X.parse("こわれた|キー")) === X.DEFAULT_KEY, "こわれた キーは はじめの おうち");
}

// ---- 5. 絵 ----
{
  const check = (p, n, tag) => {
    const m = A.model(p, n), svg = m.svg;
    ok(m.w === 217 && m.h === 189 && m.originX === -10 && m.originY === -49 && m.footW === 6 && m.footH === 4, tag + ": 町の 絵と おなじ 大きさ（6×4 マス）");
    ok(!/NaN|undefined|Infinity/.test(svg), tag + ": かずが こわれて いない");
    ok(!/ id="/.test(svg) && !/url\(#/.test(svg), tag + ": id を つかわない（ほかの 絵と ぶつからない）");
    ok((svg.match(/<g[ >]/g) || []).length === (svg.match(/<\/g>/g) || []).length, tag + ": g の かず");
    ok(svg.includes('stroke="#1F1D1B"'), tag + ": 線は INK");
    return svg;
  };
  const base = X.resolve(X.parse(X.DEFAULT_KEY));
  const day = check(base, false, "はじめの おうち"), night = check(base, true, "はじめの おうち（よる）");
  ok(day !== night && night.includes("#EACB89"), "よるは まどに あかり");
  for (const c of X.CATS) for (const p of c.parts) for (const nn of [false, true]) {
    const r = X.resolve({ parts: { ...X.DEFAULT_PARTS, [c.id]: p.id }, paint: { ...X.DEFAULT_PAINT } });
    const s = check(r, nn, `${c.id}:${p.id}${nn ? "（よる）" : ""}`);
    if (p.price > 0 && !nn) ok(s !== day, `${c.id}:${p.id}: はじめの おうちと ちがう 絵`);
  }
  for (const t of X.TARGETS) { const r = X.resolve({ parts: { ...X.DEFAULT_PARTS }, paint: { ...X.DEFAULT_PAINT, [t.id]: "ao" } }); ok(check(r, false, "ペンキ " + t.id).includes(X.PAINT.ao.hex), `ペンキ（${t.name}）の いろが うつる`); }
  // 2つ いじょう かえても こわれない
  const all = X.resolve({ parts: { roof: "round", siding: "log", window: "bay", door: "double", chimney: "stone", top: "skylight", lamp: "string", post: "bird", yard: "doghouse" }, paint: { roof: "sumi", wall: "lemon", door: "renga", trim: "shiro" } });
  check(all, true, "ぜんぶ かえた おうち");
  ok(A.picture(base, false).startsWith("<svg") && A.picture(base, true).includes("#3E4C78"), "がめんの 絵（そら・よる）");
  for (const cat of [...X.CATS.map((c) => c.id), "paint"]) ok(A.ZOOM[cat] && A.icon(base, cat).includes(`viewBox="${A.ZOOM[cat].join(" ")}"`), `パーツの ちいさな 絵: ${cat}`);
  const w = WorldArt.house_ext({ ext: X.DEFAULT_KEY, night: true }); ok(w.svg === A.model(base, true).svg, "WorldArt.house_ext（キー → 絵）");
  ok(Art.worldSvg("house_ext", { ext: X.DEFAULT_KEY }).full.startsWith("<svg"), "Art.worldSvg で つかえる");
}

// ---- 6. 町の「みんなの おうち」の きりかえ ----
{
  const calls = [], sc = { objCanvas: (kind, opt, ensure) => { calls.push([kind, JSON.stringify(opt), !!ensure]); return ensure ? Promise.resolve() : { c: {}, a: {} }; } };
  const home = MAP_DEFS.town.buildings.find((b) => b.id === "home");
  ok(home && home.asset === X.HOME_ASSET, "町の おうちの 絵は nerikasu.bld_home");
  fresh(); HeiwadaiTown.canvas(sc, { ...home }, false);
  ok(calls.at(-1)[0] === "heiwadai_nerikasu_bld_home", "かえて いない ときは もとの 絵 " + calls.at(-1));
  fresh(10000); X.buy("roof", "steep"); X.apply({ parts: { roof: "steep" } });
  calls.length = 0; HeiwadaiTown.canvas(sc, { ...home }, false);
  ok(calls.length === 1 && calls[0][0] === "house_ext" && calls[0][1].includes(X.key()), "かえたら あたらしい 絵（キーは いまの おうち）");
  calls.length = 0; HeiwadaiTown.canvas(sc, { ...home }, true);
  ok(calls.length === 2 && calls.every((c) => c[0] === "house_ext" && c[2]) && calls.some((c) => c[1].includes('"night":true')), "よみこみは ひる・よるの 2まい");
  calls.length = 0; const other = MAP_DEFS.town.buildings.find((b) => b.id === "furniture"); HeiwadaiTown.canvas(sc, { ...other }, false);
  ok(calls[0][0] !== "house_ext", "ほかの 建物は そのまま");
}

// ---- 7. 工務店 ----
{
  const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home7");
  ok(b && b.label === "ぽかぽか こうむてん" && b.act.type === "venue" && b.act.venue === "koumuten" && b.asset === "nerikasu.bld_nerikasu_home7", "ネリカスタウンの nerikasu_home7 が 工務店（館へ）");
  ok(b.w === 8 && b.h === 5 && b.door === 4 && b.x === 1 && b.y === 27, "足もと・入口・大きさは そのまま（大通りの 北の にしの はし）");
  ok(R.NERIKASU_TOWN_ART?.assets?.["nerikasu.bld_nerikasu_home7"]?.name?.includes("こうむてん") ?? read("js/nerikasu-town-art.js").includes("ぽかぽか こうむてん（おうちの そとの パーツと ペンキ）"), "建物の 原画は 工務店");
  const def = VenueHalls.defs.koumuten, r = def.floors[1];
  ok(def && def.iso && def.name === "ぽかぽか こうむてん" && Object.keys(def.floors).join() === "1" && r.w === 16 && r.h === 12, "館: 16×12・1かい");
  const solidF = r.fixtures.filter((f) => !f.walk && !f.hidden && !f.over);
  const walkable = (x, y) => !IsoVenue.solidAt(r, x, y) && !solidF.some((f) => x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  ok(r.fixtures.every((f) => f.x >= 0 && f.y >= 0 && f.x + f.w <= r.w && f.y + f.h <= r.h), "什器は へやの なか");
  for (let i = 0; i < solidF.length; i++) for (let j = i + 1; j < solidF.length; j++) { const a = solidF[i], c = solidF[j]; ok(!(a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h), `什器が かさならない: ${a.kind} と ${c.kind}`); }
  // とおれる マス（入口から）
  const seen = new Set([r.spawn.join()]), q = [r.spawn];
  ok(walkable(...r.spawn), "入口は とおれる");
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = [x + dx, y + dy]; if (walkable(...k) && !seen.has(k.join())) { seen.add(k.join()); q.push(k); } } }
  const acts = r.fixtures.filter((f) => f.action);
  ok(acts.length >= 12, `しらべる もの ${acts.length}`);
  for (const f of acts) ok(f.spots && f.spots.some((s) => seen.has(s.join())), `${f.label}: いりぐちから いける`);
  ok(acts.every((f) => !kanji.test(f.label) && (!f.text || !kanji.test(f.text)) && (!f.lines || f.lines.every((t) => !kanji.test(t)))), "ことばは ひらがな");
  const tabs = acts.filter((f) => f.action === "hx").map((f) => f.tab).sort().join();
  ok(tabs === "door,paint,roof,window", "みほんを タップすると その タブ（ペンキ・ドア・やね・まど）: " + tabs);
  ok(acts.some((f) => f.action === "koumuten" && f.kind === "npc" && f.sp === "bear") && acts.some((f) => f.action === "koumuten" && f.kind === "kcounter"), "とうりょうさん（くま）と うけつけ");
  ok(acts.some((f) => f.action === "model" && f.kind === "modelhouse") && acts.some((f) => f.action === "leave"), "もけいの おうち・でぐち");
  for (const f of r.fixtures.filter((f) => f.kind !== "npc" && f.kind !== "exitMat")) ok(!!def.art.model(f), `${f.kind}: 立体の 絵`);
  const mh = r.fixtures.find((f) => f.kind === "modelhouse");
  fresh(); const k0 = def.art.modelKey(mh); fresh(10000); X.buy("roof", "round"); X.apply({ parts: { roof: "round" } });
  ok(def.art.modelKey(mh) !== k0 && def.art.modelKey(mh).includes(X.key()), "もけいの おうちは いまの おうちで かわる（キーに いまの おうち・有限）");
  ok(def.art.modelKey(r.fixtures[0]).startsWith("koumu:paintshelf:"), "什器の キーは しゅるい・大きさ だけ");
  const w = def.art.wallSvg(r, "north"), w2 = def.art.wallSvg(r, "west");
  ok(w.svg.includes("ぽかぽか こうむてん") && w.svg.includes("いろみほん") && !/NaN/.test(w.svg + w2.svg), "かべ: かんばん・いろみほん・どうぐ");
}

// ---- 8. とうろく・PokaDebug・文書 ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("house-ext-art.js") > at("nerikasu-town.js") && at("house-ext-art.js") < at("house-ext.js") && at("house-ext.js") < at("house-ext-ui.js") && at("house-ext-ui.js") < at("koumuten.js"), "index.html: nerikasu-town.js → house-ext-art → house-ext → house-ext-ui → koumuten");
  ok(at("koumuten.js") > at("mall-art.js") && at("koumuten.js") > at("nerikasu-layout.js") && at("koumuten.js") < at("debug.js"), "koumuten.js は mall-art.js・nerikasu-layout.js の あと");
  for (const f of ["house-ext-art.js", "house-ext.js", "house-ext-ui.js", "koumuten.js"]) ok(sw.includes(`"./js/${f}"`), "sw.js の FILES: " + f);
  ok(typeof PokaDebug.exterior === "function" && typeof PokaDebug.exteriorSet === "function", "PokaDebug.exterior・exteriorSet");
  fresh(); const e = PokaDebug.exteriorSet({ roof: "steep", yard: "tree" }, { wall: "sakura" });
  ok(e && e.custom && e.parts.roof === "steep" && e.paint.wall === "sakura" && e.owned.includes("roof:steep"), "exteriorSet で つける");
  ok(PokaDebug.exteriorSet({}, {}).custom === false, "exteriorSet({}, {}) で もとの おうち");
  for (const f of ["js/house-ext-art.js", "js/house-ext.js", "js/house-ext-ui.js", "js/koumuten.js"]) {
    const s = read(f), top = s.split("\n").filter((l) => /^(const|let|var|function|class) /.test(l));
    ok(top.length === 1 && !/\bimport\b|\bexport\b/.test(s), f + ": トップレベルの 名前は 1つ・classic script");
  }
  ok(!/localStorage|fetch\(|XMLHttpRequest/.test(read("js/house-ext.js") + read("js/house-ext-ui.js") + read("js/koumuten.js")), "そとへの 通信・じぶんで ほぞん しない（Save だけ）");
  const ui = read("js/house-ext-ui.js"); ok(!/SvgCache/.test(ui.replace(/\/\/[^\n]*/g, "")), "がめんの 絵は SvgCache に いれない（ためした かずだけ ふえない）");
  const road = read("docs/ROADMAP_V2.md"), ch = read("CHANGELOG.md");
  ok((road.split("\n").find((l) => l.includes("UI-74")) || "").includes("✅"), "ROADMAP_V2 に UI-74 ✅");
  ok((ch.split("\n## [")[1] || "").includes("UI-74"), "CHANGELOG の いちばん うえの 版に UI-74");
  ok(read("tools/town-design/nerikasu-buildings.mjs").includes("function koumuten(w,h,d,n)"), "建物の 原画 koumuten");
}

console.log(`✓ おうちの そと・工務店（HouseExt・Koumuten）: ${n} 項目`);
