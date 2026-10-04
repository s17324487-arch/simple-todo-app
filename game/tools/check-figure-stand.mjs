// フィギュア台（js/figure-stand.js）の 検査。ブラウザ なしで たしかめる。
// だい 2しゅ（かぐやで かえる・ばしょ 9）・かざれる フィギュア（ガチャ・はしわたし・すいぞくかん・バーガーやさんの おまけ・いちばんくじ・おねがいの おれい・コンビニの コラボ コップ）・figs の よみかた（しらない id・フィギュアで ない もの）・
// おいた かず（Room.placed・ほかの へや・もようがえ）・いごこち・プリセット（おぼえる・たりない とき）・セーブの ほぞん（SaveBackup）・立体（はんてん・live）・
// だいの ばしょ（だんの うえ・たかさに おさまる）・フィギュアの 足もと。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FigureStand: FS, FURN_INDEX, FURNITURE, BUY_SHOPS, HomeDesign, FurnLive, FurnModels, Room, RoomPresets, Save, SaveBackup, HomeRooms, Gacha, BridgePrizes, AquaGifts, BurgerMenu, IchibanKuji, WishGifts, ConbiniCollab, ItemDexSources } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. だい 7しゅ（UI-93 で 5しゅ たした）----
const STANDS = Object.keys(FS.STANDS), SLOTS = { figstand_step: 9, figstand_case: 9, figstand_cube: 9, figstand_house: 9, figstand_acryl: 6, figstand_turn: 6, figstand_tower: 12 };
ok(STANDS.join() === Object.keys(SLOTS).join(), "だいは ひなだん・ガラスの ケース・キューブ・おうち・アクリル・ターンテーブル・タワー " + STANDS.join());
ok(new Set(STANDS.map((id) => FS.STANDS[id].name)).size === STANDS.length, "だいの なまえが かさなる");
for (const id of STANDS) {
  const S = FS.STANDS[id], f = FURN_INDEX[id], N = SLOTS[id];
  ok(f && FURNITURE.includes(f) && f.kind === "floor" && f.price === S.price && !f.rare && !f.exclusive && f.interactive && f.figureStand === N, `${id}: 家具の とうろく（ばしょ ${N}）`);
  ok(BUY_SHOPS.furniture.items("floor").some((x) => x.id === id), `${id}: かぐやで かえる`);
  ok(/かぐや/.test(ItemDexSources.source("furn", f)), `${id}: ずかんの ヒントは かぐや`);
  ok(S.name && !kanji.test(S.name) && S.name.length <= 15 && S.desc && !kanji.test(S.desc) && S.desc.length <= 60, `${id}: なまえ・せつめい`);
  // ばしょは だいの うえ（ひなだんは だんの うえ・ケースと タワーは たなと たなの あいだに フィギュアが おさまる・まえに いたが ある たなは 画面で しきりの なか・ターンテーブルは さらの うえ）
  ok(S.slots.length === N && (S.names ? S.names.length === N : S.rows.length * 3 === N), `${id}: ばしょの かず と だんの なまえ`);
  ok(S.slots.every(([x, y, z], i) => (S.win || S.ring || Math.abs(x) <= S.w / 2 - S.capW / 2) && y < 0 && y > -S.depth && z > 0 && (!S.ceil || z + S.cap < S.ceil[Math.floor(i / 3)])), `${id}: ばしょは だいの なかで、フィギュアが たなに おさまる`);
  if (S.ring) ok(S.slots.every(([x, y, z]) => Math.abs(Math.hypot(x, y - S.ring.y) - S.ring.r) < 1e-6 && z === S.ring.z) && S.ring.r + S.capW / 2 <= Math.min(S.w, S.depth) / 2 - 2, `${id}: ばしょは まるい さらの うえ`);
  if (S.win) ok(S.slots.every(([x, y], i) => { const [x0, x1] = S.win.cols[i % 3], X = x - y; return y === S.win.y && X - S.capW / 2 >= x0 - 1e-6 && X + S.capW / 2 <= x1 + 1e-6; }), `${id}: 画面で フィギュアの まんなかが しきりの なか`);
  ok(new Set(S.slots.map((p) => p.join())).size === N, `${id}: ばしょが かさならない`);
  for (let i = 0; i < N; i++) ok(!kanji.test(FS.slotName(S, i)) && FS.slotName(S, i).length <= 14, `${id}: ばしょの なまえ ${FS.slotName(S, i)}`);
  // ならびは うしろ（うえ）の だんから: 描く じゅん で まえの フィギュアが うしろを かくす（ターンテーブルは まいかい おくゆきで ならべる）
  if (!S.ring) ok(S.slots.every((p, i) => i < 3 || p[1] + p[0] >= S.slots[i - 3][1] + S.slots[i - 3][0] - 1e-6 || p[2] < S.slots[i - 3][2]), `${id}: うしろ・うえの だんから ならぶ`);
  ok(S.price >= 1000 && S.price <= 4000 && S.comfort >= 3 && S.comfort <= 6, `${id}: ねだん・いごこち`);
}
// ターンテーブル: 60どずつ・じかんで まわる（1びょうで speed）・いつも さらの うえ
{
  const S = FS.STANDS.figstand_turn, a0 = FS.ringAt(S, 0), a1 = FS.ringAt(S, 1), ang = (p) => Math.atan2(p[1] - S.ring.y, p[0]);
  ok(a0.length === 6 && a0.every((p, i) => Math.abs(Math.hypot(p[0], p[1] - S.ring.y) - S.ring.r) < 1e-6 && Math.abs(((ang(a0[(i + 1) % 6]) - ang(p) + 4 * Math.PI) % (2 * Math.PI)) - Math.PI / 3) < 1e-6), "ターンテーブルの ばしょは 60どずつ");
  ok(a0.every((p, i) => Math.abs(((ang(a1[i]) - ang(p) + 4 * Math.PI) % (2 * Math.PI)) - S.ring.speed) < 1e-6) && S.ring.speed > 0.2 && S.ring.speed < 1, "ターンテーブルは ゆっくり まわる");
  ok(a0.map((p) => p.map((v) => v.toFixed(6)).join()).join() === S.slots.map((p) => p.map((v) => v.toFixed(6)).join()).join(), "とまって いる ときの ばしょ（G.t = 0）は slots");
}
ok(FS.STANDS.figstand_step.price < FS.STANDS.figstand_case.price && FS.STANDS.figstand_step.price >= 1000 && FS.STANDS.figstand_case.price <= 3000, "ねだん（ほんだな 1040・みどりの たな 1520 くらい）");
// ---- 2. かざれる フィギュア ----
const figs = FS.figures(), gf = Gacha.ITEMS.filter((it) => it.kind === "furn").map((it) => it.id), bf = BridgePrizes.ITEMS.filter((it) => it.kind === "fig").map((it) => it.id), af = AquaGifts.FIGS.map((f) => f.id), tf = BurgerMenu.TOYS.map((t) => t.id), kf = IchibanKuji.ITEMS.filter((it) => it.fig).map((it) => it.id), wf = [...WishGifts.THINGS.filter((it) => it.kind === "stone").map((it) => it.id), "wg_crane"], cf = ConbiniCollab.ITEMS.filter((it) => it.cat === "cup").map((it) => it.id);
ok(kf.length === 11 && wf.length === 10 && cf.length === 8 && figs.length === gf.length + bf.length + af.length + tf.length + kf.length + wf.length + cf.length && [...gf, ...bf, ...af, ...tf, ...kf, ...wf, ...cf].every((id) => figs.includes(id) && FURN_INDEX[id].figure === true), `かざれる フィギュア ${figs.length}しゅ（ガチャ ${gf.length}・はしわたし ${bf.length}・すいぞくかん ${af.length}・バーガーやさんの おまけ ${tf.length}・いちばんくじ ${kf.length}〔マグ・アクリル スタンド・ちび ぬいぐるみ〕・おねがいの おれい ${wf.length}〔いし 9・おりがみの つる〕・コンビニの コラボ コップ ${cf.length}〔グラス・タンブラー〕）`);
ok(!FS.isFigure("teddy") && !FS.isFigure("figstand_step") && !FS.isFigure("aqc_penguin") && !FS.isFigure("gacha_ears_0") && !FS.isFigure(BridgePrizes.ITEMS.find((it) => it.kind !== "fig").id) && !FS.isFigure("nothing"), "ぬいぐるみ・だい・コラボ・服・ざっかは かざれない");
const A = HomeDesign.A, B = HomeDesign.B;
for (const id of figs) {
  const f = FURN_INDEX[id], ft = FS.foot(id), m = HomeDesign.model(id);
  ok(Number.isFinite(ft.x) && Number.isFinite(ft.y) && ft.x >= m.x && ft.x <= m.x + m.w && ft.y >= m.y && ft.y <= m.y + m.h, `${id}: 足もとが 絵の なか`);
  for (const sid of STANDS) {
    const S = FS.STANDS[sid], k = FS.scaleOf(S, id);
    ok(k >= (sid === "figstand_step" ? 0.2 : 0.15) && k <= 0.7 && f.h * k <= S.cap + 1e-6 && f.w * k <= S.capW + 1e-6, `${id}: ${sid} に のる 大きさ（${k.toFixed(2)}）`);
    // まえに いたが ある たな: 画面で 絵が しきりの まえの めんと うえの いたに かからない
    if (S.win) S.slots.forEach(([x, y, z], i) => {
      const [x0, x1] = S.win.cols[i % 3], ceil = S.ceil[Math.floor(i / 3)], Fx = (x - y) * A, Fy = (x + y) * B - z, l = Fx + (m.x - ft.x) * k, r = Fx + (m.x + m.w - ft.x) * k, t = Fy + (m.y - ft.y) * k;
      ok(l >= x0 * A - 1e-6 && r <= x1 * A + 1e-6 && t >= (r / A) * B - ceil - 1e-6, `${id}: ${sid} の ${FS.slotName(S, i)}で 絵が まえの いたに かかる`);
    });
  }
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
for (const id of ["figstand_case", "figstand_tower"]) ok(HomeDesign.model(id, { live: true }).full.length < HomeDesign.model(id).full.length, id + ": まえの ガラスは live では フィギュアの あとに 描く");
for (const id of STANDS) ok(FurnLive.state({ id, uid: 9 }).live === (id === "figstand_case" || id === "figstand_tower"), id + ": よるの あかりが つくのは ケースと タワー だけ");

console.log(`✓ check-figure-stand: ${n} 件`);
