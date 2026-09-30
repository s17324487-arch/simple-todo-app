// はたけ（js/farm-art.js・js/farm.js）の 検査。ブラウザ なしで 作物の データ・そだつ しくみ・絵・町の はたけ・セーブを しらべる。
// ・作物 13しゅ（はじめ 5・しゅうかく 3かいで 5・8かいで 3）・食べ物は もちものに はいる（おみせには ならばない）・なまえは ひらがな／カタカナ
// ・たねまき（コイン）→ みず → め → はっぱ（のどが かわく）→ みず → はな → みのり → しゅうかく（ひりょう +2・たまに おおきい +1）。
//   みずが ない あいだは そだたない・くさらない・あめで かってに みずやり・おなじ はたけに 2かい まけない・コインが たりないと まけない
// ・絵: 13しゅ × 5だんかい・食べ物・つち・どうぐ・かんばんが こわれて いない（NaN・id なし）・キャッシュの キーが 有限
// ・町: やおや（neri_farmstand）と ハーブの うねは ない・はたけ 6まいと かんばんが おうちの ひだりに あって、となりまで あるいて いける
// ・セーブ: あたらしい 項目 farm だけ（Save.SCHEMA は そのまま）・ふるい セーブや こわれた はたけを なおす
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Farm, FarmArt: A, FARM_CROPS: C, FARM_RULES: RULES } = R;
let n = 0;
const ok = (v, msg) => { n++; assert.ok(v, msg); };
const kana = (s) => /^[぀-ゟ゠-ヿー・ 　！？。、0-9A-Za-z（）]+$/.test(s);
R.Save.d = R.Save.fresh(); R.Weather.override = "clear"; R.UI.updateHud = () => {}; // HUD は ブラウザ だけ
let clock = Date.UTC(2026, 8, 30, 3, 0, 0);
Farm.now = () => clock;
const min = (m) => { clock += m * 60000; Farm.update(); };

// ---- 1. データ ----
ok(C.length === 13 && new Set(C.map((c) => c.id)).size === 13, "作物は 13しゅ");
ok(RULES.plots === 6 && RULES.fert === 10 && RULES.fertBonus === 2 && JSON.stringify(RULES.waterAt) === "[0,2]" && JSON.stringify(RULES.tiers) === "[0,3,8]", "はたけの きまり");
for (const c of C) {
  ok(kana(c.name), "なまえは ひらがな・カタカナ " + c.name);
  ok(A.K[c.kind] && c.min > 0 && c.min <= 30 && c.seed > 0 && c.yield >= 1 && [0, 1, 2].includes(c.tier), "作物の データ " + c.id);
  ok(c.grid.every((v) => Number.isInteger(v) && v >= 1 && v <= 3) && c.town.every((v) => Number.isInteger(v) && v >= 1 && v <= 4), "ならべかた " + c.id);
  const f = R.BAG_INDEX[c.food];
  ok(f && f.kind === "food" && R.FOODS.includes(R.FOODS.find((x) => x.id === c.food)) && R.FOOD_ART[c.food], "食べ物と 絵 " + c.id);
  ok(f.hunger > 0 && f.price > 0 && kana(f.name) && kana(f.desc || "たべもの"), "食べ物の あたい " + c.id);
  if (!["corn", "pepper"].includes(c.id)) ok(f.exclusive === "farm" && !f.rare && !f.deza, "はたけの 食べ物は おみせに ならばない " + c.id);
}
ok(C.filter((c) => c.tier === 0).length === 5 && C.filter((c) => c.tier === 1).length === 5 && C.filter((c) => c.tier === 2).length === 3, "たねは 5・5・3");
ok(C.find((c) => c.id === "corn").food === "corn" && C.find((c) => c.id === "pepper").food === "pepper", "とうもろこし・ピーマンは まえからの 食べ物");
ok(R.FOODS.filter((f) => f.exclusive === "farm").length === 11, "あたらしい 食べ物は 11");
for (const s of Object.values(R.BUY_SHOPS)) for (const tab of ["food", "all", undefined]) { let list = []; try { list = s.items(tab) || []; } catch (e) { list = []; } ok(!list.some((i) => i.exclusive === "farm"), "おみせに はたけの 食べ物が ない " + s.name); }

// ---- 2. そだつ しくみ ----
const F = () => R.Save.d.farm;
R.Save.d.coins = 100;
ok(Farm.st().plots.length === 6 && F().plots.every((p) => !p.c) && Farm.tier() === 0, "はじめは からっぽの はたけ 6まい");
ok(Farm.info(0).state === "empty" && Farm.sow(0, "melon") === "bad" && R.Save.d.coins === 100, "メロンは まだ まけない");
ok(Farm.sow(0, "radish") === "ok" && R.Save.d.coins === 95 && F().plots[0].c === "radish" && F().plots[0].s === 0 && !F().plots[0].w, "はつかだいこんを まく（5コイン）");
ok(Farm.sow(0, "carrot") === "bad" && R.Save.d.coins === 95, "おなじ はたけに 2かい まけない");
ok(Farm.info(0).state === "dry", "まいたら みずが ほしい");
min(10); ok(F().plots[0].s === 0, "みずが ないと そだたない");
ok(Farm.water(0) && F().plots[0].w && !Farm.water(0), "みずやりは 1かい");
const radish = Farm.crops.radish, stage = radish.min / 4;
min(stage - 0.01); ok(F().plots[0].s === 0 && Farm.info(0).state === "grow", "まだ めが でない");
min(0.02); ok(F().plots[0].s === 1 && F().plots[0].w, "めが でる");
min(stage); ok(F().plots[0].s === 2 && !F().plots[0].w && Farm.info(0).state === "dry", "はっぱが ふえたら のどが かわく");
min(60); ok(F().plots[0].s === 2, "みずが ないと とまる（かれない）");
Farm.water(0); min(stage * 2); ok(F().plots[0].s === 4 && Farm.info(0).state === "ripe", "みのる");
min(60 * 24 * 7); ok(F().plots[0].s === 4 && F().plots[0].c === "radish", "くさらない（1しゅうかん たっても）");
const y = Farm.yieldOf(0), bag0 = R.Save.d.bag.radish || 0, h = Farm.harvest(0);
ok(h && h.n === y && y >= radish.yield && y <= radish.yield + 1 && R.Save.d.bag.radish === bag0 + y && !F().plots[0].c && F().harvests === 1 && F().got.radish === y && F().first.radish, "しゅうかく → もちもの");
ok(Farm.harvest(0) === null && Farm.harvest(1) === null, "からっぽは しゅうかく できない");
// ひりょう: +2・10コイン・1かいだけ・みのったら まけない
R.Save.d.coins = 30; Farm.sow(1, "tomato"); Farm.water(1);
const y0 = Farm.yieldOf(1);
ok(Farm.fertilize(1) === "ok" && R.Save.d.coins === 10 && Farm.yieldOf(1) === y0 + 2 && Farm.fertilize(1) === "bad" && F().fert === 1, "ひりょう");
R.Save.d.coins = 0; ok(Farm.sow(2, "radish") === "coins" && !F().plots[2].c, "コインが たりないと まけない");
R.Save.d.coins = 5; Farm.sow(2, "radish"); ok(Farm.fertilize(2) === "coins" && !F().plots[2].f, "ひりょうも コインが いる");
// あめ: かわいた はたけに かってに みず（ふった ときから そだつ）
R.Weather.override = "rain"; Farm.update(); ok(F().plots[2].w && F().plots[2].rain, "あめで みずやり");
R.Weather.override = "clear";
// てんきの よほう（端末の 日時）: かわいた あとで さいしょの あめの 3じかんの くぎり
R.Weather.override = null;
{ let T0 = null, hit = null; for (let d = 0; d < 120 && hit == null; d++) for (let b = 0; b < 8 && hit == null; b++) { const at = Date.UTC(2026, 5, 1 + d) + b * 3 * 3600000; if (R.Weather.forDate(new Date(at)) === "rain" && R.Weather.forDate(new Date(at - 3 * 3600000)) !== "rain") { hit = at; T0 = at - 3 * 3600000 + 1000; } }
  ok(hit != null, "あめの 日が ある");
  const at = Farm.rainAt(T0, T0 + 12 * 3600000), dd = new Date(at); ok(at != null && at >= T0 && R.Weather.forDate(dd) === "rain" && dd.getMinutes() === 0 && dd.getHours() % 3 === 0, "あめの はじまりを みつける");
  ok(Farm.rainAt(T0, T0 - 1) === null, "じかんが もどったら ふらない"); }
R.Weather.override = "clear";
// しゅうかく 3かいで たねが ふえる・8かいで さいごの 3しゅ
F().harvests = 2; ok(!Farm.unlocked(Farm.crops.pepper), "まだ ピーマンは まけない");
F().plots[3] = { c: "radish", s: 4, w: true, t: clock, f: false, n: 99 };
const h3 = Farm.harvest(3); ok(h3.unlocked.length === 5 && h3.unlocked.every((c) => c.tier === 1) && Farm.unlocked(Farm.crops.pepper) && !Farm.unlocked(Farm.crops.melon), "3かいで 5しゅ ふえる");
F().harvests = 7; F().plots[3] = { c: "radish", s: 4, w: true, t: clock, f: false, n: 100 };
ok(Farm.harvest(3).unlocked.length === 3 && Farm.unlocked(Farm.crops.melon), "8かいで 3しゅ ふえる");
// おおきく そだつ（+1）は はたけと まいた ばんごうで きまる（おなじ ばんごうなら おなじ）
{ let lucky = 0; for (let k = 1; k <= 200; k++) if (Farm.lucky(k % 6, { n: k })) lucky++; ok(lucky > 20 && lucky < 60, "おおきく そだつのは ときどき " + lucky); ok(Farm.lucky(2, { n: 7 }) === Farm.lucky(2, { n: 7 }), "おおきく そだつかは きまって いる"); }
// ぜんぶの 作物が 2かいの みずで みのる（min ぷん）
for (const c of C) {
  R.Save.d = R.Save.fresh(); R.Save.d.coins = 999; R.Save.d.farm.harvests = 8;
  ok(Farm.sow(0, c.id) === "ok", "まける " + c.id); let w = 0;
  for (let k = 0; k < 10 && F().plots[0].s < 4; k++) { if (!F().plots[0].w) { Farm.water(0); w++; } min(c.min / 4 + 0.001); }
  ok(F().plots[0].s === 4 && w === 2, `${c.name}は みず 2かいで みのる（${w}かい）`);
  const inf = []; for (let s = 1; s <= 4; s++) inf.push(Farm.stageName(c, s)); ok(inf.every(Boolean), "だんかいの なまえ " + c.id);
}
// ことば: ようす・ふだ・たねの ねだん
R.Save.d = R.Save.fresh(); R.Save.d.coins = 50; Farm.sow(0, "strawberry"); Farm.water(0);
ok(/^あと \d+ふんで めが でる$/.test(Farm.info(0).text) && /^あと \d+ふん$/.test(Farm.short(Farm.info(0))), "そだつ ようすの ことば " + Farm.info(0).text);
min(2.5 - 0.5 / 60); ok(/びょうで/.test(Farm.info(0).text), "のこり 1ぷん より すくないと びょう " + Farm.info(0).text);
for (let i = 0; i < 6; i++) ok(kana(Farm.info(i).text.replace(/\d/g, "")), "ようすは ひらがな " + Farm.info(i).text);

// ---- 3. こわれた はたけ・ふるい セーブ ----
R.Save.d = R.Save.fresh(); delete R.Save.d.farm; ok(Farm.st().plots.length === 6 && R.Save.d.farm.harvests === 0, "はたけの ない セーブ");
R.Save.d.farm = { plots: [{ c: "banana", s: 2 }, null, 7, { c: "radish", s: 1, w: true, t: clock }], got: null, harvests: "x" };
const fixed = Farm.st(); ok(fixed.plots.length === 6 && !fixed.plots[0].c && !fixed.plots[1].c && !fixed.plots[2].c && fixed.plots[3].c === "radish" && fixed.harvests === 0 && typeof fixed.got === "object", "こわれた はたけを なおす");
{ const old = R.Save.fresh(); delete old.farm; old.v = R.Save.SCHEMA; const m = R.Save.migrate(JSON.parse(JSON.stringify(old))); ok(m.farm && m.farm.plots.length === 6 && m.farm.plots.every((p) => p.c === null) && m.v === R.Save.SCHEMA, "migrate が はたけを おぎなう"); }
ok(R.Save.KEY === "pokapoka-town-save-v1", "セーブの キーは かえない");

// ---- 4. 絵 ----
const TAGS = ["svg", "g"];
const svgOk = (svg, what) => { ok(typeof svg === "string" && svg.startsWith("<svg") && svg.endsWith("</svg>") && !/NaN|undefined|Infinity/.test(svg) && !/\sid="/.test(svg), what + ": 絵が こわれている"); for (const t of TAGS) { const open = (svg.match(new RegExp(`<${t}[\\s>]`, "g")) || []).length, self = (svg.match(new RegExp(`<${t}\\b[^>]*/>`, "g")) || []).length, close = (svg.match(new RegExp(`</${t}>`, "g")) || []).length; ok(open - self === close, `${what}: <${t}> の かず`); } };
const seen = new Set();
for (const c of C) for (let s = 0; s <= 4; s++) { const svg = A.wrap(A.plant(c, s)); svgOk(svg, `${c.id} ${s}`); if (s >= 2) { ok(!seen.has(svg), `${c.id} ${s} の 絵が ほかと おなじ`); seen.add(svg); } }
ok(A.plant(C[0], 0) !== A.plant(C[1], 0) && A.plant(C[0], 1) === A.plant(Farm.crops.tomato, 1), "たねは なふだの いろ だけ・めは おなじ");
for (const c of C) svgOk(R.Art.iconSvg("bag", c.food), "食べ物 " + c.food);
for (const [w, h, town] of [[140, 130, false], [142, 158, false], [128, 64, true]]) for (const wet of [false, true]) svgOk(A.wrap(A.bed(w, h, wet, town), w, h), `つち ${w}×${h}`);
ok(A.bed(128, 64, false, true) !== A.bed(128, 64, true, true), "ぬれた つちは いろが ちがう");
for (const t of Object.keys(A.TOOLS)) svgOk(A.toolSvg(t), "どうぐ " + t);
svgOk(A.wrap(A.sign, 40, 56, "0 0 40 56"), "かんばん");
ok(R.WorldArt.farm_plot().w === 128 && R.WorldArt.farm_plot().h === 64 && R.WorldArt.farm_sign().w === 40, "町の はたけと かんばんの 絵");
// キャッシュの キー: 作物 × だんかい × 大きさ（大きさは 画面の きまった かず）だけ
{ const keys = new Set(), SC = R.SvgCache, get = SC.get, ens = SC.ensure; SC.get = (k, fn, w, h) => { keys.add(k + "@" + w + "x" + h); return null; }; SC.ensure = (k, fn, w, h) => { keys.add(k + "@" + w + "x" + h); return Promise.resolve(null); };
  for (let t = 0; t < 400; t++) for (const c of C) for (let s = 0; s <= 4; s++) { A.plantImg(c, s, 40 + (t % 3) * 10); A.bedImg(140, 130, t % 2 === 0); A.toolImg("drop", 20); A.foodImg(c.food, 34); }
  SC.get = get; SC.ensure = ens; ok(keys.size <= C.length * 5 * 3 + 2 + 1 + C.length, "キャッシュの キーが ふえつづけない " + keys.size); }

// ---- 5. 町の はたけ ----
const d = R.MAP_DEFS.town, m = new R.WorldMap("town"), home = d.buildings.find((b) => b.id === "home");
ok(!d.buildings.some((b) => b.id === "neri_farmstand"), "やおや（はたけの ちょくばいじょ）は ない");
ok(!d.objects.some((o) => o.kind === "town_herbs" && o.x >= 2 && o.x <= 10 && o.y >= 56 && o.y <= 65), "はたけの ばしょに ハーブの うねが ない");
const plots = d.objects.filter((o) => o.farmPlot != null).sort((a, b) => a.farmPlot - b.farmPlot), sign = d.objects.find((o) => o.farmSign);
ok(plots.length === 6 && plots.every((o, i) => o.farmPlot === i && o.kind === "farm_plot" && o.w === 4 && o.h === 2 && o.solid && o.text), "はたけ 6まい（4×2マス）");
ok(sign && sign.kind === "farm_sign" && sign.solid && sign.text, "はたけの かんばん");
ok(plots.every((o) => o.x + o.w <= home.x && home.x - (o.x + o.w) <= 16 && Math.abs(o.y - home.y) <= 8), "はたけは おうちの ひだり（ちかく）");
const cells = new Set(); for (const o of [...plots, sign]) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) { ok(!cells.has(xx + "," + yy), "はたけが かさなる " + xx + "," + yy); cells.add(xx + "," + yy); ok(m.isSolid(xx, yy), "はたけは とおれない " + xx + "," + yy); }
for (const o of d.objects) if (o.farmPlot == null && !o.farmSign && !o.background && o.solid !== false) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) ok(!cells.has(xx + "," + yy), "はたけに ほかの 小物が かさなる " + o.id);
for (const b of d.buildings) ok(!(b.x < 12 && b.x + b.w > 1 && b.y < 64 && b.y + b.h > 56), "はたけに 建物が かさなる " + b.id);
// となりの マスに あるいて いける（町の いりぐちから）
R.TownRenewal.safePosition(m, 0, 0);
const reach = (x, y) => m.publicTiles.seen.has(x + "," + y);
for (const o of plots) { const front = [[o.x + 1, o.y + o.h], [o.x + 2, o.y + o.h], [o.x - 1, o.y], [o.x + o.w, o.y]]; ok(front.some(([x, y]) => !m.isSolid(x, y) && reach(x, y)), "はたけの となりに いけない " + o.id); ok(!m.isSolid(o.x + 1, o.y + o.h) && reach(o.x + 1, o.y + o.h), "はたけの まえ（した）に たてる " + o.id); }
ok(!m.isSolid(sign.x, sign.y + 1) && reach(sign.x, sign.y + 1), "かんばんの まえに たてる");
// はたけの こや（建物・絵 farm.hut）と まわりの 小物（かかし・はこ・たる・ふくろ・わら・どうぐたて）
const hut = d.buildings.find((b) => b.id === "neri_farmhut");
ok(hut && hut.asset === "farm.hut" && hut.act.type === "visit" && kana(hut.label) && hut.x >= 2 && hut.x + hut.w <= 11 && hut.y >= 64, "はたけの こや");
{ const model = R.HeiwadaiArt.model("farm.hut", {}); ok(model.w > 90 && model.h > 90 && model.footW === 3 && model.footH === 2, "こやの 絵の 大きさ"); { const full = R.HeiwadaiArt.full("farm.hut", {}); ok(full.startsWith("<svg") && !/NaN|undefined|Infinity/.test(full) && [...full.matchAll(/id="([^"]+)"/g)].every(([, id]) => id.startsWith("hw")), "こやの 絵（id は HeiwadaiArt の なまえつき）"); } ok(reach(hut.x + hut.door, hut.y + hut.h), "こやの とびらの まえに いける"); }
for (const k of ["farm_scarecrow", "farm_crate", "farm_barrel", "farm_sack", "farm_hay", "farm_rack"]) { ok(d.objects.some((o) => o.kind === k && o.x <= 11 && o.y >= 55), "はたけの 小物 " + k); const a = R.WorldArt[k](); svgOk(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}">${a.svg}</svg>`, k); }

console.log(`Farm: ${C.length} crops (5 + 5 after 3 harvests + 3 after 8), 6 plots left of the home in Nerikasu town, water twice (sowing and leaves), rain waters, fertilizer +${RULES.fertBonus}, no rot; ${C.length * 5} growth pictures and ${R.FOODS.filter((f) => f.exclusive === "farm").length} new foods; ${n} checks OK`);
