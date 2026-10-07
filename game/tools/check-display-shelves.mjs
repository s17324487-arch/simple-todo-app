// かざりだな（js/display-shelves.js・UI-104）の 検査。ブラウザ なしで たしかめる。
// 8しゅ（ゆか 6・かべ 2）の とうろく・かぐやさんの タブ・ばしょ（だいの なか・うえの だんから）・のせられる もの（フィギュアと しょっき。ステージは フィギュア だけ）・
// のる 大きさ・そう（したの だんから フィギュア → うえの いた → まえ。どの ばしょも 1かい だけ・絵の はんいは おなじ）・かべの たな（あしもとが 絵の なか・はんてんは ならびだけ）・
// おいた かず・いごこち・プリセット・セーブ・オンラインの おへや（g・かべ）・タップ（かざる まど の ことば・おじゃま）・よるの あかり・ことば。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { DisplayShelves: DS, FigureStand: FS, TableWare: TW, FURN_INDEX, FURNITURE, BUY_SHOPS, HomeDesign, FurnLive, FurnModels, Room, RoomPresets, Save, SaveBackup, OnlineRooms, ItemDexSources, Art } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const vb = (svg) => svg.match(/viewBox="([^"]+)"/)[1];

// ---- 1. 8しゅ（ゆか 6・かべ 2）----
const SLOTS = { figstand_cupboard: 9, figstand_sideboard: 9, figstand_ladder: 8, figstand_curio: 6, figstand_stage: 5, figstand_tree: 7, figstand_wall: 6, figstand_hex: 5 };
const OLD = ["figstand_step", "figstand_case", "figstand_cube", "figstand_house", "figstand_acryl", "figstand_turn", "figstand_tower"];
ok(DS.IDS.join() === Object.keys(SLOTS).join() && DS.WALL_IDS.join() === "figstand_wall,figstand_hex", "かざりだなは 8しゅ（かべ 2） " + DS.IDS.join());
ok(Object.keys(FS.STANDS).join() === [...OLD, ...DS.IDS].join(), "フィギュア だいの さきに まえからの 7しゅ・あとに かざりだな 8しゅ");
ok(new Set(Object.values(FS.STANDS).map((S) => S.name)).size === OLD.length + DS.IDS.length, "だいの なまえが かさならない");
for (const id of DS.IDS) {
  const S = FS.STANDS[id], f = FURN_INDEX[id], N = SLOTS[id], wall = !!S.wall;
  ok(f && FURNITURE.includes(f) && f.kind === (wall ? "wall" : "floor") && f.price === S.price && !f.rare && !f.exclusive && f.interactive && f.figureStand === N && FS.isStand(id) && FS.isHolder(id) && !FS.isFigure(id) && DS.isShelf(id), `${id}: 家具の とうろく（ばしょ ${N}）`);
  ok(BUY_SHOPS.furniture.items(wall ? "wall" : "floor").some((x) => x.id === id) && /かぐや/.test(ItemDexSources.source("furn", f)), `${id}: かぐやの「${wall ? "かべかざり" : "かぐ"}」で かえる・ずかんの ヒント`);
  ok(S.name && !kanji.test(S.name) && S.name.length <= 15 && S.desc && !kanji.test(S.desc) && S.desc.length <= 60, `${id}: なまえ・せつめい`);
  ok(S.price >= 1000 && S.price <= 4000 && S.comfort >= 3 && S.comfort <= 6, `${id}: ねだん ${S.price}・いごこち ${S.comfort}`);
  ok(S.slots.length === N && (S.names ? S.names.length === N : S.rows.length * 3 === N), `${id}: ばしょの かず と なまえ`);
  const names = S.slots.map((_, i) => FS.slotName(S, i));
  ok(new Set(names).size === N && names.every((x) => !kanji.test(x) && x.length <= 14), `${id}: ばしょの なまえ ${names.join("・")}`);
  ok(new Set(S.slots.map((p) => p.join())).size === N, `${id}: ばしょが かさならない`);
  ok(S.cap >= 22 && S.cap <= 40 && S.capW >= 22 && S.capW <= 28, `${id}: のせる 大きさ ${S.cap}・${S.capW}`);
  if (!wall) {
    const dm = HomeDesign.dimensions(id);
    // ゆかの たな: ばしょは だいの なか（よこ・おくゆき・たかさ。サイドボードは うえの いたの うえも）。うえの だんから ならぶ（描く じゅん）
    ok(S.slots.every(([x, y, z]) => Math.abs(x) <= dm.w / 2 - S.capW / 2 && y < 0 && y > -dm.d && z > 0 && z <= dm.h + 0.5), `${id}: ばしょは だいの なか`);
    ok(S.slots.every((p, i) => i === 0 || p[2] <= S.slots[i - 1][2] + 1e-9), `${id}: うえの だんから ならぶ`);
  } else {
    const W = FURN_INDEX[id], at0 = S.wall.at(false), at1 = S.wall.at(true);
    ok(at0.length === N && at1.length === N && at0.every(([u, v], i) => u === S.slots[i][0] && v === S.slots[i][1]), `${id}: かべの ばしょ（slots と おなじ）`);
    // あしもとは 絵の なか・フィギュアの うえも かべの なか（f.h の うえに 30 まで）
    ok([...at0, ...at1].every(([u, v]) => u > 6 && u < W.w - 4 && v > S.cap * 0.6 && v < W.h), `${id}: かべの たなの あしもとが 絵の なか`);
    if (id === "figstand_wall") {
      // 2だんの いたは さゆう おなじ かたち: はんてんしても 絵も ばしょも かわらない
      ok(at1.every(([u, v], i) => u === at0[i][0] && v === at0[i][1]) && Art.furnSvg(id, { flip: true }).replace(/<g transform="matrix\(-1,0,0,1,[^"]*\)">/g, "") .replace(/<\/g>/g, "") === Art.furnSvg(id).replace(/<\/g>/g, ""), `${id}: はんてんしても おなじ`);
    } else {
      // ハニカム: はんてんは ならびだけ かがみに（かべに つく ところ dd..w の まんなかで）
      const dd = DS.HX.dd;
      ok(at0.every(([u, v], i) => { const [u1, v1] = at1[i]; return Math.abs(u1 + dd / 2 - (W.w + dd - (u + dd / 2))) < 1e-9 && Math.abs(v1 - v) < 1e-9; }), `${id}: はんてんは ならびを かがみに`);
    }
  }
}
// ---- 2. のせられる もの・のる 大きさ ----
const figs = FS.figures(), dishes = TW.DISHES;
ok(figs.length >= 80 && dishes.length === 30, `フィギュア ${figs.length}しゅ・しょっき ${dishes.length}しゅ`);
for (const id of DS.IDS) {
  const S = FS.STANDS[id], dishOk = id !== "figstand_stage";
  ok(figs.every((x) => FS.accepts(id, x)) && dishes.every((x) => FS.accepts(id, x) === (dishOk || FS.isFigure(x))), `${id}: フィギュア${dishOk ? "と しょっき" : " だけ（マグ・コップは フィギュアでも ある）"} のせられる`);
  ok(["teddy", "figstand_step", "figstand_wall", "tbl_cafe", "table_wood", "nothing", 3].every((x) => !FS.accepts(id, x)), `${id}: ぬいぐるみ・だい・テーブルは のせない`);
  const pool = S.pool ? S.pool() : FS.figures();
  ok(pool.length === new Set(pool).size && (dishOk ? pool.length === new Set([...figs, ...dishes]).size : pool.length === figs.length), `${id}: えらべる もの ${pool.length}しゅ（かさならない）`);
  for (const x of dishOk ? new Set([...figs, ...dishes]) : figs) { const f = FURN_INDEX[x], k = FS.scaleOf(S, x); ok(k >= 0.15 && k <= 0.7 && f.h * k <= S.cap + 1e-6 && f.w * k <= S.capW + 1e-6, `${x}: ${id} に のる 大きさ（${k.toFixed(2)}）`); }
}
ok(["figstand_cupboard", "figstand_sideboard", "figstand_wall"].every((id) => TW.isDish(FS.STANDS[id].pool()[0])) && ["figstand_ladder", "figstand_curio", "figstand_tree", "figstand_hex"].every((id) => FS.isFigure(FS.STANDS[id].pool()[0])), "しょっきだな・サイドボード・かべの たなは しょっきから ならべる");
ok(dishes.every((d) => FS.heldable(d)) && figs.every((x) => FS.heldable(x)) && !FS.heldable("teddy"), "フィギュアと しょっきは どれも だいに のせられる もの");
// ---- 3. そう（したの だんから フィギュア → その うえの いた → まえ）----
for (const id of DS.IDS) {
  const S = FS.STANDS[id], N = SLOTS[id];
  if (!S.layers) { ok(id === "figstand_tree" && !S.front && FurnLive.state({ id, uid: 9 }).live === false, `${id}: そうの ない たなは きの たな だけ（いつもの 絵）`); continue; }
  const all = S.layers.flatMap((L) => L.slots);
  ok(all.length === N && new Set(all).size === N && all.every((i) => i >= 0 && i < N), `${id}: どの ばしょも 1かい だけ 描く`);
  // したの だん（z が ひくい）から じゅんに（かべ・ゆか ともに slots は うえから → layers は ぎゃく）
  ok(S.layers.every((L, j) => j === 0 || Math.max(...L.slots) < Math.min(...S.layers[j - 1].slots)), `${id}: したの だんから じゅんに`);
  const names = [...S.layers.map((L) => L.over).filter(Boolean), ...(S.front ? ["front"] : [])];
  ok(names.length >= 1 && new Set(names).size === names.length && FurnLive.state({ id, uid: 9 }).live === true, `${id}: そう ${names.join("・")}（へやでは live）`);
  for (const flip of [false, true]) {
    const wall = !!S.wall, full = wall ? Art.furnSvg(id, { flip }) : HomeDesign.model(id, { flip }).full, live = wall ? Art.furnSvg(id, { flip, live: true }) : FurnModels.build(id, { flip, live: true }).full;
    ok(live.length < full.length - 200, `${id}${flip ? "（はんてん）" : ""}: へやの 絵（live）は かさねる ぶぶんを ぬく`);
    for (const nm of names) {
      const svg = wall ? Art.furnSvg(id, { flip, live: true, layer: nm }) : FurnModels.build(id, { flip, live: true, layer: nm }).full;
      ok(/<(polygon|path|rect|circle|ellipse|polyline)/.test(svg) && !/NaN|undefined|Infinity/.test(svg) && vb(svg) === vb(full), `${id}${flip ? "（はんてん）" : ""}: そう ${nm} の 絵（はんいは おなじ）`);
      const list = ids(svg); ok(new Set(list).size === list.length, `${id}: そう ${nm} の id が かさならない`);
    }
    if (!wall) { const m = HomeDesign.model(id, { flip }), lv = HomeDesign.model(id, { flip, live: true }); ok(["x", "y", "w", "h"].every((k) => Math.abs(m[k] - lv[k]) < 1e-6), `${id}: live でも 絵の はんいが おなじ`); }
  }
}
// ---- 4. 立体と かべの 絵 ----
for (const id of DS.IDS) for (const flip of [false, true]) {
  const wall = !!FS.STANDS[id].wall, svg = wall ? Art.furnSvg(id, { flip }) : HomeDesign.model(id, { flip }).full;
  ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && svg.match(/<svg/g).length === 1 && !/NaN|undefined|Infinity/.test(svg) && svg.includes('stroke="#1F1D1B"'), `${id}${flip ? "（はんてん）" : ""}: 絵`);
  const list = ids(svg); ok(new Set(list).size === list.length, `${id}${flip ? "（はんてん）" : ""}: id が かさならない`);
  if (!wall) { const m = HomeDesign.model(id, { flip }); ok(FurnModels.has(id) && m.w > 60 && m.h > 60 && m.w < 260 && m.h < 300, `${id}: 立体の 大きさ ${m.w.toFixed(0)}×${m.h.toFixed(0)}`); }
  else {
    // はんてんしても おくゆきの むきは かわらない（Art.furnSvg の かがみを さきに かえす: かがみが 2かい）
    ok(!flip || (svg.match(/matrix\(-1,0,0,1,/g) || []).length === 2, `${id}: はんてんの かがみを うちけす`);
  }
}
// ---- 5. おいた かず・いごこち・プリセット・セーブ ----
const st = (id, f, uid, x = 200, y = 450, more = {}) => ({ uid, id, x, y, figs: f, ...more });
Save.d = Save.fresh();
for (const id of [...DS.IDS, ...TW.TABLES, ...figs, ...dishes]) Save.d.furn[id] = 1;
Save.d.furn.tw_teaset = 2;
Save.d.room.items = [st("figstand_cupboard", ["tw_teaset", "tw_teaset", "gacha_friends_0"], 1), st("figstand_wall", ["tw_soup", null, "aqfig_penguin"], 2, 150, 100), st("figstand_stage", ["aqfig_orca"], 3, 320, 500), st("table_wood", ["tw_pancake"], 4, 100, 520)];
Save.d.room.nextUid = 5;
ok(Room.placed("tw_teaset") === 2 && Room.available("tw_teaset") === 0 && Room.available("tw_soup") === 0 && Room.available("aqfig_penguin") === 0 && Room.available("aqfig_orca") === 0 && Room.available("tw_pancake") === 0 && Room.available("tw_cakestand") === 1, "たなの うえの フィギュア・しょっきも おいた かずに なる（テーブルと いっしょに）");
{
  const c0 = Room.comfort(), keep = Save.d.room.items.map((it) => it.figs);
  Save.d.room.items.forEach((it) => { it.figs = []; });
  const base = Room.comfort(); Save.d.room.items.forEach((it, i) => { it.figs = keep[i]; });
  const add = ["tw_teaset", "tw_teaset", "gacha_friends_0", "tw_soup", "aqfig_penguin", "aqfig_orca", "tw_pancake"].reduce((a, x) => a + (FURN_INDEX[x].comfort || 0), 0);
  ok(c0 === base + add, "かざった ものも いごこちに なる");
}
ok(FS.figsOf(st("figstand_stage", ["tw_soup", "aqfig_orca"], 9)).join() === ",aqfig_orca,,,", "ステージに しょっきは のらない（よむ ときに すてる）");
ok(FS.figsOf(st("figstand_hex", ["aqfig_orca", "tw_soup", "teddy", "aqfig_jelly", "kj_law_e0", "gacha_friends_0"], 9)).join() === "aqfig_orca,tw_soup,,aqfig_jelly,kj_law_e0", "ハニカムは 5こ まで・ぬいぐるみは のらない");
{
  Save.d.rooms.presets = {};
  const p = RoomPresets.snapshot("テスト");
  ok(p.items[0].figs.join() === FS.figsOf(Save.d.room.items[0]).join() && p.items[1].figs.join() === "tw_soup,,aqfig_penguin,,," && RoomPresets.problem(p) === null, "プリセットは たなの ものを おぼえる・よびだせる");
  const p2 = JSON.parse(JSON.stringify(p)); p2.items.push({ id: "tw_soup", x: 60, y: 520, flip: false });
  ok(/スープの おなべ/.test(RoomPresets.problem(p2) || ""), "たなと ゆかの りょうほうで つかうと たりない");
  const m = Save.migrate(JSON.parse(JSON.stringify(Save.d)));
  ok(m.room.items[1].figs.join() === Save.d.room.items[1].figs.join() && m.v === Save.SCHEMA && Save.SCHEMA === 2, "migrate で figs が のこる（SCHEMA は 2 の まま）");
  const back = SaveBackup.validate ? SaveBackup.validate(JSON.parse(JSON.stringify(Save.d))) : null;
  if (back) ok(back.room.items[1].figs.join() === Save.d.room.items[1].figs.join(), "セーブを よみなおしても かべの たなの figs が のこる");
}
// ---- 6. オンラインの おへや（g・ひだりの かべ）----
{
  const keep = Save.d.rooms;
  Save.d.room.items[1].wallSide = "left";
  Save.d.rooms.owned = { ...(Save.d.rooms.owned || {}), main: true }; Save.d.rooms.active = "main";
  const enc = OnlineRooms.encode("main"), e = enc && enc.i.find((o) => o.a === "figstand_wall");
  ok(e && e.g === "tw_soup,,aqfig_penguin,,," && e.s === "l" && /^[a-z0-9_,]*$/.test(e.g) && e.g.length <= 600, "オンラインに おくる かべの たな（g・ひだりの かべ）" + JSON.stringify(e));
  const dec = OnlineRooms.decode({ n: 0, k: "main", w: "wp_cream", f: "fl_wood", i: [{ a: "figstand_wall", x: 150, y: 100, s: "l", g: "tw_soup,teddy,aqfig_penguin" }, { a: "figstand_stage", x: 320, y: 500, g: "tw_soup,aqfig_orca" }] });
  // よんだ figs は みじかい まま（へやで 描く ときに figsOf で ばしょの かずに そろう）
  ok(dec.items[0].figs.join() === "tw_soup,,aqfig_penguin" && dec.items[0].wallSide === "left" && dec.items[1].figs.join() === ",aqfig_orca" && FS.figsOf(dec.items[1]).length === 5, "よむ ときは その たなに のせられる もの だけ（ステージに しょっきは のらない）");
  Save.d.rooms = keep; delete Save.d.room.items[1].wallSide;
}
// ---- 7. タップ（かざる まどの ことば・おじゃま）・よるの あかり ----
{
  const opened = [], said = [], say0 = FS.say;
  FS.say = (sc, it, line) => { said.push(line); };
  const sc = { chars: [], parents: [], life: { furniture: {} }, anchor: (it) => ({ x: it.x, y: it.y }), react() {} };
  // まどの なかみ（DOM）は スモークで みる。ここでは まどの なまえ だけ（UI.modal で とめる）
  const STOP = new Error("stop"), modal0 = R.UI.modal; R.UI.modal = (o) => { opened.push(o.title); throw STOP; };
  const tap = (s, it) => { try { return FurnLive.tap(s, it); } catch (e) { if (e !== STOP) throw e; return true; } };
  for (const id of DS.IDS) { opened.length = 0; ok(tap(sc, { id, uid: 60 + id.length, x: 200, y: 400, figs: [] }) && opened[0] === (id === "figstand_stage" ? "フィギュアを かざる" : "たなに かざる"), `${id}: タップで かざる まど「${opened[0]}」`); }
  // よその おうち（おじゃま）: まどは ださない・いちばん ちかい 子の ことば だけ
  const hl0 = R.HomeLife.say; R.HomeLife.say = (s, who, line) => { said.push(line); };
  const guest = { ...sc, guest: { room: {} }, chars: [{ id: "wanko", x: 200, y: 420 }] };
  said.length = 0; opened.length = 0; tap(guest, { id: "figstand_hex", uid: 77, x: 200, y: 100, figs: ["aqfig_orca"] }); tap(guest, { id: "figstand_ladder", uid: 78, x: 200, y: 400, figs: [] }); tap(guest, { id: "figstand_stage", uid: 79, x: 200, y: 400, figs: [] });
  ok(opened.length === 0 && said.length === 3 && DS.WORDS.seen.includes(said[0]) && said[1] === DS.WORDS.empty && said[2] === FS.WORDS.empty, "よその おうちの たなは 見るだけ（ことば）" + JSON.stringify(said));
  R.UI.modal = modal0; FS.say = say0; R.HomeLife.say = hl0;
  // よるは あかり（しょっきだな・まるい ガラスの たな・ステージ）。タップで かえない（ばしょを えらぶ まど）
  for (const id of DS.IDS) ok(FurnLive.state({ id, uid: 9 }).on === (["figstand_cupboard", "figstand_curio", "figstand_stage"].includes(id) ? R.DayTint.isNight() : false), `${id}: よるの あかり`);
}
// ---- 8. ことば ----
for (const [k, v] of Object.entries(DS.WORDS)) for (const t of [].concat(typeof v === "function" ? v(30) : v)) ok(!kanji.test(t) && t.length <= 60, `ことば ${k}: ${t}`);

console.log(`✓ check-display-shelves: ${n} 件`);
