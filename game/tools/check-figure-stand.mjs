// フィギュア台（js/figure-stand.js）の 検査。ブラウザ なしで たしかめる。
// だい 2しゅ（かぐやで かえる・ばしょ 9）・かざれる フィギュア（ガチャ・はしわたし・すいぞくかん・バーガーやさんの おまけ）・figs の よみかた（しらない id・フィギュアで ない もの）・
// おいた かず（Room.placed・ほかの へや・もようがえ）・いごこち・プリセット（おぼえる・たりない とき）・セーブの ほぞん（SaveBackup）・立体（はんてん・live）・
// だいの ばしょ（だんの うえ・たかさに おさまる）・フィギュアの 足もと。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FigureStand: FS, FURN_INDEX, FURNITURE, BUY_SHOPS, HomeDesign, FurnLive, FurnModels, Room, RoomPresets, Save, SaveBackup, HomeRooms, Gacha, BridgePrizes, AquaGifts, BurgerMenu, ItemDexSources } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. だい 2しゅ ----
const STANDS = Object.keys(FS.STANDS);
ok(STANDS.join() === "figstand_step,figstand_case", "だいは ひなだん と ガラスの ケース");
for (const id of STANDS) {
  const S = FS.STANDS[id], f = FURN_INDEX[id];
  ok(f && FURNITURE.includes(f) && f.kind === "floor" && f.price === S.price && !f.rare && !f.exclusive && f.interactive && f.figureStand === 9, `${id}: 家具の とうろく（ばしょ 9）`);
  ok(BUY_SHOPS.furniture.items("floor").some((x) => x.id === id), `${id}: かぐやで かえる`);
  ok(/かぐや/.test(ItemDexSources.source("furn", f)), `${id}: ずかんの ヒントは かぐや`);
  ok(S.name && !kanji.test(S.name) && S.name.length <= 15 && S.desc && !kanji.test(S.desc) && S.desc.length <= 60, `${id}: なまえ・せつめい`);
  // ばしょは だいの うえ（ひなだんは だんの うえ・ケースは たなと たなの あいだに フィギュアが おさまる）
  ok(S.slots.length === 9 && S.rows.length === 3 && S.slots.every(([x, y, z], i) => Math.abs(x) <= S.w / 2 - S.capW / 2 && y < 0 && y > -S.depth && z > 0 && (!S.ceil || z + S.cap < S.ceil[Math.floor(i / 3)])), `${id}: ばしょは だいの なかで、フィギュアが たなに おさまる`);
  ok(new Set(S.slots.map((p) => p.join())).size === 9, `${id}: ばしょが かさならない`);
  for (let i = 0; i < 9; i++) ok(!kanji.test(FS.slotName(S, i)) && FS.slotName(S, i).length <= 14, `${id}: ばしょの なまえ ${FS.slotName(S, i)}`);
  // ならびは うしろ（うえ）の だんから: 描く じゅん で まえの フィギュアが うしろを かくす
  ok(S.slots.every((p, i) => i < 3 || p[1] + p[0] >= S.slots[i - 3][1] + S.slots[i - 3][0] - 1e-6 || p[2] < S.slots[i - 3][2]), `${id}: うしろ・うえの だんから ならぶ`);
}
ok(FS.STANDS.figstand_step.price < FS.STANDS.figstand_case.price && FS.STANDS.figstand_step.price >= 1000 && FS.STANDS.figstand_case.price <= 3000, "ねだん（ほんだな 1040・みどりの たな 1520 くらい）");
// ---- 2. かざれる フィギュア ----
const figs = FS.figures(), gf = Gacha.ITEMS.filter((it) => it.kind === "furn").map((it) => it.id), bf = BridgePrizes.ITEMS.filter((it) => it.kind === "fig").map((it) => it.id), af = AquaGifts.FIGS.map((f) => f.id), tf = BurgerMenu.TOYS.map((t) => t.id);
ok(figs.length === gf.length + bf.length + af.length + tf.length && [...gf, ...bf, ...af, ...tf].every((id) => figs.includes(id) && FURN_INDEX[id].figure === true), `かざれる フィギュア ${figs.length}しゅ（ガチャ ${gf.length}・はしわたし ${bf.length}・すいぞくかん ${af.length}・バーガーやさんの おまけ ${tf.length}）`);
ok(!FS.isFigure("teddy") && !FS.isFigure("figstand_step") && !FS.isFigure("aqc_penguin") && !FS.isFigure("gacha_ears_0") && !FS.isFigure(BridgePrizes.ITEMS.find((it) => it.kind !== "fig").id) && !FS.isFigure("nothing"), "ぬいぐるみ・だい・コラボ・服・ざっかは かざれない");
for (const id of figs) {
  const S = FS.STANDS.figstand_step, k = FS.scaleOf(S, id), f = FURN_INDEX[id], ft = FS.foot(id), m = HomeDesign.model(id);
  ok(k > 0.2 && k <= 0.7 && f.h * k <= S.cap + 1e-6 && f.w * k <= S.capW + 1e-6, `${id}: だいに のる 大きさ（${k.toFixed(2)}）`);
  ok(Number.isFinite(ft.x) && Number.isFinite(ft.y) && ft.x >= m.x && ft.x <= m.x + m.w && ft.y >= m.y && ft.y <= m.y + m.h, `${id}: 足もとが 絵の なか`);
}
// ---- 3. figs の よみかた ----
const stand = (figs, id = "figstand_step") => ({ uid: 1, id, x: 100, y: 500, figs });
ok(FS.figsOf(stand()).length === 9 && FS.figsOf(stand()).every((x) => x === null), "figs が ない だいは からっぽ 9");
ok(FS.figsOf(stand(["aqfig_penguin", "teddy", "nothing", 3, null, "gacha_friends_0", "aqfig_orca", "ike_hashi_hero", "aqfig_eel", "aqfig_mola"])).join() === "aqfig_penguin,,,,,gacha_friends_0,aqfig_orca,ike_hashi_hero,aqfig_eel", "しらない id・フィギュアで ない もの・10こめ は のぞく");
ok(FS.figsOf({ id: "teddy", figs: ["aqfig_penguin"] }).length === 0, "だいで ない 家具には figs が ない");
// ---- 4. おいた かず・いごこち ----
Save.d = Save.fresh();
for (const id of [...STANDS, ...figs]) Save.d.furn[id] = 1;
Save.d.furn.aqfig_penguin = 2;
Save.d.room.items = [stand(["aqfig_penguin", "aqfig_penguin", "gacha_friends_0"]), { uid: 2, id: "aqfig_orca", x: 300, y: 500 }];
Save.d.room.nextUid = 3;
ok(Room.placed("aqfig_penguin") === 2 && Room.available("aqfig_penguin") === 0 && Room.available("gacha_friends_0") === 0 && Room.available("aqfig_orca") === 0 && Room.available("aqfig_jelly") === 1, "だいの うえの フィギュアも おいた かずに なる");
{
  const c0 = Room.comfort(), base = (() => { const keep = Save.d.room.items[0].figs; Save.d.room.items[0].figs = []; const v = Room.comfort(); Save.d.room.items[0].figs = keep; return v; })();
  ok(c0 === base + FURN_INDEX.aqfig_penguin.comfort * 2 + FURN_INDEX.gacha_friends_0.comfort, "かざった フィギュアも いごこちに なる");
}
// ほかの へやの だいも かぞえる
Save.d.rooms.stored.upstairs = { wall: "wp_cream", floor: "fl_wood", items: [stand(["aqfig_jelly"], "figstand_case")], wallpapers: {}, floors: {}, nextUid: 2 };
ok(Room.placed("aqfig_jelly") === 1 && Room.available("aqfig_jelly") === 0 && HomeRooms.all().length >= 2, "ほかの へやの だいに かざった フィギュアも かぞえる");
// ---- 5. プリセット ----
{
  Save.d.rooms.presets = {};
  const p = RoomPresets.snapshot("テスト");
  ok(p.items[0].figs && p.items[0].figs.join() === FS.figsOf(Save.d.room.items[0]).join() && !p.items[1].figs, "プリセットは だいの フィギュアを おぼえる（ほかの 家具には つけない）");
  ok(RoomPresets.problem(p) === null, "いまの へやの プリセットは よびだせる");
  const p2 = JSON.parse(JSON.stringify(p)); p2.items[0].figs[3] = "aqfig_jelly";
  ok(/ミズクラゲ フィギュア/.test(RoomPresets.problem(p2) || ""), "ほかの へやで かざって いる フィギュアは たりない");
  const p3 = JSON.parse(JSON.stringify(p)); p3.items.push({ id: "aqfig_penguin", x: 50, y: 520, flip: false });
  ok(/ケープペンギン フィギュア/.test(RoomPresets.problem(p3) || ""), "だいと ゆかの りょうほうで つかうと たりない");
}
// ---- 6. セーブの ほぞん（SaveBackup の まえ・あと で figs が のこる）----
{
  const d = JSON.parse(JSON.stringify(Save.d)); Save.d.rooms.active = Save.d.rooms.active || "main";
  const back = SaveBackup.validate ? SaveBackup.validate(d) : null;
  if (back) ok(back.room.items[0].figs.join() === Save.d.room.items[0].figs.join(), "セーブを よみなおしても figs が のこる");
  const m = Save.migrate(JSON.parse(JSON.stringify(Save.d)));
  ok(m.room.items[0].figs.join() === Save.d.room.items[0].figs.join() && m.v === Save.SCHEMA, "migrate で figs が のこる（SCHEMA は そのまま）");
}
// ---- 7. 立体・さわる ----
for (const id of STANDS) {
  for (const flip of [false, true]) {
    const m = HomeDesign.model(id, { flip }), svg = m.full;
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined/.test(svg) && svg.match(/<svg/g).length === 1 && m.w > 60 && m.h > 50, `${id}${flip ? "（はんてん）" : ""}: 立体の 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${id}${flip ? "（はんてん）" : ""}: id が かさならない`);
    const lv = HomeDesign.model(id, { flip, live: true });
    ok(["x", "y", "w", "h"].every((k) => Math.abs(m[k] - lv[k]) < 1e-6), `${id}${flip ? "（はんてん）" : ""}: live でも 絵の はんいが おなじ`);
  }
  ok(FurnModels.has(id) && FurnLive.state({ id, uid: 9 }) !== undefined, `${id}: さわれる（FurnLive）`);
}
ok(HomeDesign.model("figstand_case", { live: true }).full.length < HomeDesign.model("figstand_case").full.length, "ケースの まえの ガラスは live では フィギュアの あとに 描く");

console.log(`✓ check-figure-stand: ${n} 件`);
