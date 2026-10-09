// しょっきを テーブルに ならべる（js/table-ware.js・UI-103）の 検査。ブラウザ なしで たしかめる。
// しょっき 30しゅ（あたらしい 8・いちばんくじ 6・コンビニ コラボ 16）・テーブル 9しゅ（まえから 4・あたらしい 5）・
// ならべる ばしょ（テーブルの うえ・かさならない・のる 大きさ）・のせられる もの（しょっき だけ）・figs の よみかた・
// おいた かず（Room.placed・ほかの へや）・いごこち・プリセット・セーブ・オンラインの おへや（g）・
// タップ（まえからの うごきの ある テーブルは その まま）・かざりを かたづけた 絵（live）・かぐやさんの「しょっき」・ずかんの ヒント。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { TableWare: TW, FigureStand: FS, FURN_INDEX, FURNITURE, BUY_SHOPS, HomeDesign, FurnLive, FurnModels, Room, RoomPresets, Save, SaveBackup, HomeRooms, IchibanKuji, ConbiniCollab, ItemDexSources, OnlineRooms, Art } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. しょっき 30しゅ ----
const NEW = ["tw_teaset", "tw_cakestand", "tw_fruitbowl", "tw_pitcher", "tw_ricebowl", "tw_yunomi", "tw_pancake", "tw_soup"];
ok(TW.NEW.join() === NEW.join(), "あたらしい しょっき 8しゅ " + TW.NEW.join());
const kujiDish = IchibanKuji.ITEMS.filter((it) => it.kind === "mug" || it.kind === "teacup").map((it) => it.id);
const cvcDish = ConbiniCollab.ITEMS.filter((it) => it.cat === "cup" || it.cat === "plate").map((it) => it.id);
ok(kujiDish.length === 12 && cvcDish.length === 16 && TW.DISHES.length === 36 && [...NEW, ...kujiDish, ...cvcDish].every((id) => TW.DISHES.includes(id) && TW.isDish(id) && FURN_INDEX[id].dish === true), `しょっき 36しゅ（あたらしい 8・いちばんくじの マグと ティーカップ ${kujiDish.length}・コンビニの コップと おさら ${cvcDish.length}）`);
ok(new Set(TW.DISHES).size === 36, "しょっきの id が かさならない");
ok(TW.PLATES.length === 8 && TW.PLATES.every((id) => FURN_INDEX[id].kind === "wall"), "かべの おさら 8まい（プレート・しましまざら）");
for (const id of ["teddy", "figstand_step", "table_wood", "kj_law_a", "gacha_friends_0", "aqfig_penguin", "cvc_law_bath_wanko", "nothing"]) ok(!TW.isDish(id), `${id}: しょっきで ない`);
for (const id of NEW) {
  const f = FURN_INDEX[id];
  ok(f && FURNITURE.includes(f) && f.kind === "floor" && f.price >= 600 && f.price <= 1400 && f.comfort >= 2 && f.comfort <= 3 && !f.rare && f.cat.join() === "misc", `${id}: 家具の とうろく（ねだん ${f && f.price}・いごこち ${f && f.comfort}）`);
  ok(f.name && !kanji.test(f.name) && f.name.length <= 15 && f.desc && !kanji.test(f.desc) && f.desc.length <= 60, `${id}: なまえ・せつめい`);
  ok(f.w >= 30 && f.w <= 50 && f.depth >= 24 && f.depth <= 44 && f.h >= 18 && f.h <= 52, `${id}: 大きさ ${f.w}×${f.depth}×${f.h}`);
}
// ---- 2. テーブル 9しゅ ----
const NEW_T = ["tbl_dining", "tbl_cafe", "tbl_chabudai", "tbl_glass", "tbl_heart"], OLD_T = ["table_wood", "kotatsu", "teacart", "hq_marble_table"];
ok(TW.NEW_TABLES.join() === NEW_T.join() && TW.TABLES.join() === [...OLD_T, ...NEW_T].join(), "テーブル 9しゅ（まえから 4・あたらしい 5） " + TW.TABLES.join());
for (const id of NEW_T) {
  const f = FURN_INDEX[id];
  ok(f && FURNITURE.includes(f) && f.kind === "floor" && f.price >= 1400 && f.price <= 3200 && f.comfort >= 4 && f.comfort <= 8 && !f.rare && f.cat.join() === "table", `${id}: 家具の とうろく`);
  ok(f.name && !kanji.test(f.name) && f.name.length <= 15 && f.desc && !kanji.test(f.desc) && f.desc.length <= 60, `${id}: なまえ・せつめい`);
  ok(BUY_SHOPS.furniture.items("floor").some((x) => x.id === id) && /かぐや/.test(ItemDexSources.source("furn", f)), `${id}: かぐやの「かぐ」で かえる・ずかんの ヒント`);
}
const Nslot = { table_wood: 4, kotatsu: 4, teacart: 3, hq_marble_table: 4, tbl_dining: 6, tbl_cafe: 3, tbl_chabudai: 4, tbl_glass: 4, tbl_heart: 3 };
for (const id of TW.TABLES) {
  const S = FS.holderOf(id), dm = HomeDesign.dimensions(id), P = TW.SPOTS[id];
  ok(FS.isHolder(id) && !FS.isStand(id) && S && S.sorted && S.slots.length === Nslot[id] && FURN_INDEX[id].dishTable === Nslot[id], `${id}: ならべる ばしょ ${Nslot[id]}`);
  ok(S.names.length === S.slots.length && new Set(S.names).size === S.names.length && S.names.every((x) => !kanji.test(x) && x.length <= 14), `${id}: ばしょの なまえ`);
  for (let i = 0; i < S.slots.length; i++) ok(FS.slotName(S, i) === S.names[i], `${id}: ${i}ばんめの なまえ`);
  // テーブルの うえ（よこ・おくの なか）・たかさは テーブルの いた（だいたい たかさ h の ちかく）
  ok(S.slots.every(([x, y, z]) => Math.abs(x) <= dm.w / 2 - 8 && y < -8 && y > -dm.d + 8 && Math.abs(z - P.z) < 1e-9), `${id}: ばしょは テーブルの うえ`);
  ok(P.z > 25 && P.z <= dm.h + 1 && P.z >= dm.h * 0.7, `${id}: いたの たかさ ${P.z}（たかさ ${dm.h}。ワゴンは とっての したの うえの トレー）`);
  // となりと かさならない（のせる はばの 0.85 いじょう はなれる）
  for (let i = 0; i < S.slots.length; i++) for (let j = i + 1; j < S.slots.length; j++) ok(Math.hypot(S.slots[i][0] - S.slots[j][0], S.slots[i][1] - S.slots[j][1]) >= S.capW * 0.85, `${id}: ばしょ ${i} と ${j} が ちかすぎる`);
  ok(S.cap >= 20 && S.cap <= 28 && S.capW >= 20 && S.capW <= 30, `${id}: のせる 大きさ`);
  // のる 大きさ: どの しょっきも 0.3〜0.7 ばい・cap と capW に おさまる
  for (const d of TW.DISHES) { const f = FURN_INDEX[d], k = FS.scaleOf(S, d); ok(k >= 0.3 && k <= 0.7 && f.h * k <= S.cap + 1e-6 && f.w * k <= S.capW + 1e-6, `${d}: ${id} に のる 大きさ（${k.toFixed(2)}）`); }
  // のせられる もの
  ok(TW.DISHES.every((d) => FS.accepts(id, d)) && !FS.accepts(id, "gacha_friends_0") && !FS.accepts(id, "teddy") && !FS.accepts(id, "tbl_cafe") && !FS.accepts(id, "nothing") && !FS.accepts(id, 3), `${id}: のせられるのは しょっき だけ`);
}
// フィギュア だいは あたらしい しょっき・おさらを のせない（マグ・ティーカップ・コップは まえから フィギュア）
ok(NEW.every((d) => !FS.accepts("figstand_step", d) && !FS.isFigure(d)) && TW.PLATES.every((d) => !FS.accepts("figstand_case", d)) && [...kujiDish, ...cvcDish.filter((d) => !TW.PLATES.includes(d))].every((d) => FS.accepts("figstand_step", d)), "フィギュア だいに のるのは まえからの フィギュア だけ");
ok(TW.DISHES.every((d) => FS.heldable(d)) && !FS.heldable("teddy"), "しょっきは どれも だいに のせられる もの");
// ---- 3. figs の よみかた ----
const tbl = (figs, id = "table_wood", uid = 1) => ({ uid, id, x: 200, y: 450, figs });
ok(FS.figsOf(tbl()).length === 4 && FS.figsOf(tbl()).every((x) => x === null), "figs が ない テーブルは からっぽ 4");
ok(FS.figsOf(tbl(["tw_teaset", "teddy", "gacha_friends_0", "cvc_law_plate_wanko", "tw_soup"])).join() === "tw_teaset,,,cvc_law_plate_wanko", "しょっきで ない もの・5こめ は のぞく");
ok(FS.figsOf({ id: "chair_wood", figs: ["tw_teaset"] }).length === 0, "テーブルで ない 家具には figs が ない");
// ---- 4. おいた かず・いごこち ----
Save.d = Save.fresh();
for (const id of [...TW.TABLES, ...TW.DISHES]) Save.d.furn[id] = 1;
Save.d.furn.tw_teaset = 2;
Save.d.room.items = [tbl(["tw_teaset", "tw_teaset", "cvc_law_plate_wanko"]), tbl(["kj_law_e0"], "tbl_cafe", 2), { uid: 3, id: "cvc_law_cup_wanko", x: 300, y: 500 }];
Save.d.room.nextUid = 4;
ok(Room.placed("tw_teaset") === 2 && Room.available("tw_teaset") === 0 && Room.available("cvc_law_plate_wanko") === 0 && Room.available("kj_law_e0") === 0 && Room.available("cvc_law_cup_wanko") === 0 && Room.available("tw_soup") === 1, "テーブルの うえの しょっきも おいた かずに なる（おさらは かべに かけられない）");
{
  const c0 = Room.comfort(), keep = Save.d.room.items.map((it) => it.figs);
  Save.d.room.items.forEach((it) => { if (it.figs) it.figs = []; });
  const base = Room.comfort(); Save.d.room.items.forEach((it, i) => { if (keep[i]) it.figs = keep[i]; });
  ok(c0 === base + FURN_INDEX.tw_teaset.comfort * 2 + FURN_INDEX.cvc_law_plate_wanko.comfort + FURN_INDEX.kj_law_e0.comfort, "ならべた しょっきも いごこちに なる");
}
Save.d.rooms.stored.upstairs = { wall: "wp_cream", floor: "fl_wood", items: [tbl(["tw_soup"], "tbl_dining")], wallpapers: {}, floors: {}, nextUid: 2 };
ok(Room.placed("tw_soup") === 1 && Room.available("tw_soup") === 0 && HomeRooms.all().length >= 2, "ほかの へやの テーブルの しょっきも かぞえる");
// ---- 5. プリセット・セーブ ----
{
  Save.d.rooms.presets = {};
  const p = RoomPresets.snapshot("テスト");
  ok(p.items[0].figs && p.items[0].figs.join() === FS.figsOf(Save.d.room.items[0]).join() && p.items[1].figs.join() === "kj_law_e0,," && !p.items[2].figs, "プリセットは テーブルの しょっきを おぼえる");
  ok(RoomPresets.problem(p) === null, "いまの へやの プリセットは よびだせる");
  const p2 = JSON.parse(JSON.stringify(p)); p2.items[1].figs[1] = "tw_soup";
  ok(/スープの おなべ/.test(RoomPresets.problem(p2) || ""), "ほかの へやで ならべて いる しょっきは たりない");
  const m = Save.migrate(JSON.parse(JSON.stringify(Save.d)));
  ok(m.room.items[0].figs.join() === Save.d.room.items[0].figs.join() && m.v === Save.SCHEMA && Save.SCHEMA === 2, "migrate で figs が のこる（SCHEMA は 2 の まま）");
  const back = SaveBackup.validate ? SaveBackup.validate(JSON.parse(JSON.stringify(Save.d))) : null;
  if (back) ok(back.room.items[1].figs.join() === Save.d.room.items[1].figs.join(), "セーブを よみなおしても テーブルの figs が のこる");
}
// ---- 6. オンラインの おへや（おくる g・よむ ときは しょっき だけ）----
{
  const keepRooms = Save.d.rooms;
  Save.d.rooms.owned = { ...(Save.d.rooms.owned || {}), main: true }; Save.d.rooms.active = "main";
  const enc = OnlineRooms.encode("main");
  const e0 = enc && enc.i.find((o) => o.a === "table_wood"), e1 = enc && enc.i.find((o) => o.a === "tbl_cafe");
  ok(e0 && e0.g === "tw_teaset,tw_teaset,cvc_law_plate_wanko," && e1 && e1.g === "kj_law_e0,,", "オンラインに おくる おへやに テーブルの しょっき（g）" + JSON.stringify(enc && enc.i));
  ok(/^[a-z0-9_,]*$/.test(e0.g) && e0.g.length <= 600, "g は きまりの もじ だけ（database.rules.json の まま）");
  const dec = OnlineRooms.decode({ n: 0, k: "main", w: "wp_cream", f: "fl_wood", i: [{ a: "table_wood", x: 200, y: 450, g: "tw_teaset,teddy,gacha_friends_0,cvc_law_plate_wanko" }, { a: "figstand_step", x: 300, y: 400, g: "tw_teaset,kj_law_e0" }] });
  ok(dec.items[0].figs.join() === "tw_teaset,,,cvc_law_plate_wanko" && dec.items[1].figs.join() === ",kj_law_e0", "よむ ときは その だいに のせられる もの だけ（テーブルに ぬいぐるみ・フィギュア だいに ティーセットは すてる）");
  Save.d.rooms = keepRooms;
}
// ---- 7. 立体（テーブル・しょっき・おさらたて）----
for (const id of [...NEW_T, ...NEW, ...TW.PLATES]) for (const flip of [false, true]) {
  const m = HomeDesign.model(id, { flip }), svg = m.full;
  ok(FurnModels.has(id) && /^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined|Infinity/.test(svg) && svg.includes('stroke="#1F1D1B"') && m.w > 40 && m.h > 40 && m.w < 260 && m.h < 240, `${id}${flip ? "（はんてん）" : ""}: 立体の 絵 ${m.w.toFixed(0)}×${m.h.toFixed(0)}`);
  const list = ids(svg); ok(new Set(list).size === list.length, `${id}: id が かさならない`);
}
for (const id of TW.PLATES) ok(!/<polyline/.test(Art.furnSvg(id)) && Art.furnSvg(id) === R.HomeDesign.oldFurnSvg(id, {}), `${id}: かべに かける 絵は いままで どおり（おさらたては テーブルの うえ だけ）`);
// かざりを かたづけた 絵（live）: どの テーブルも 絵の はんいは おなじ・かざりが へる
for (const id of TW.TABLES) for (const flip of [false, true]) {
  const m = HomeDesign.model(id, { flip }), lv = HomeDesign.model(id, { flip, live: true });
  ok(["x", "y", "w", "h"].every((k) => Math.abs(m[k] - lv[k]) < 1e-6) && lv.full.length < m.full.length - 400, `${id}${flip ? "（はんてん）" : ""}: しょっきを ならべた ときは うえの かざりを かたづける（はんいは おなじ）`);
}
// しょっきが ある ときだけ live（キーは id・はんてん・live だけ）
{
  const o1 = FurnLive.opts({ id: "table_wood", uid: 1, figs: [] }, { flip: false }), o2 = FurnLive.opts({ id: "table_wood", uid: 1, figs: ["tw_teaset"] }, { flip: false }), o3 = FurnLive.opts({ id: "teddy", uid: 1, figs: ["tw_teaset"] }, { flip: false });
  ok(!o1.live && o2.live === true && !o3.live && JSON.stringify(o2) === '{"flip":false,"live":true}', "しょっきを ならべた テーブル だけ live の 絵");
  ok(FurnLive.LIVE.has("desk") && !TW.TABLES.some((id) => FurnLive.LIVE.has(id)), "テーブルは いつもは かざりの ある 絵（LIVE に いれない）");
}
// ---- 8. タップ（へやで）----
{
  const opened = [], said = [], open0 = FS.open, say0 = FS.say;
  FS.open = (sc, it) => { opened.push(it.id); return null; }; FS.say = (sc, it, line) => { said.push(line); };
  const sc = { chars: [], parents: [], life: { furniture: {} }, anchor: (it) => ({ x: it.x, y: it.y }), react() {} };
  for (const id of TW.TABLES) ok(FURN_INDEX[id].interactive === true, `${id}: さわれる`);
  for (const id of ["table_wood", "teacart", ...NEW_T]) { opened.length = 0; ok(FurnLive.tap(sc, { id, uid: 50 + id.length, x: 200, y: 400 }) && opened.join() === id, `${id}: タップで ならべる まど`); }
  // こたつ・だいりせきの テーブル: タップは まえからの うごき（こたつが つく・だいりせきは ひとこと）。ならべる まどは でない
  opened.length = 0; const kt = { id: "kotatsu", uid: 90, x: 200, y: 400 }; FurnLive.reset();
  R.HomeLife.say = () => {}; sc.chars = [{ id: "wanko", x: 200, y: 420 }];
  FurnLive.tap(sc, kt); ok(FurnLive.state(kt).on === true && opened.length === 0, "こたつは タップで つく（ならべる まどは もようがえから）");
  FurnLive.tap(sc, { id: "hq_marble_table", uid: 91, x: 200, y: 400 }); ok(opened.length === 0, "だいりせきの テーブルは タップで まえの うごき");
  // よその おうち（おじゃま）: まどは ださない・ことば だけ
  opened.length = 0; said.length = 0; FurnLive.tap({ ...sc, guest: { room: {} } }, { id: "tbl_heart", uid: 92, x: 200, y: 400, figs: ["tw_soup"] });
  ok(opened.length === 0 && said.length === 1, "よその おうちの テーブルは 見るだけ（ことば）");
  FS.open = open0; FS.say = say0;
}
// ---- 9. かぐやさんの「しょっき」----
{
  const B = BUY_SHOPS.furniture;
  ok(B.tabs.map(([k]) => k).join() === "floor,dish,wall,wp,fl" && B.tabs[1][1] === "しょっき" && /shop-tabs-wrap/.test(B.cls || ""), "かぐやの タブは かぐ・しょっき・かべかざり・かべがみ・ゆか（2だんに おりかえす）");
  ok(B.items("dish").map((f) => f.id).join() === NEW.join() && !B.items("floor").some((f) => NEW.includes(f.id)), "「しょっき」に あたらしい しょっき 8しゅ（「かぐ」には ない）");
  ok(R.ShopUI.kindOf("furniture", "dish") === "furn", "「しょっき」は 家具と して かう");
  for (const id of NEW) ok(ItemDexSources.source("furn", FURN_INDEX[id]) === "かぐやさんの「しょっき」で かえるよ。", `${id}: ずかんの ヒント`);
  ok(/いちばんくじ/.test(ItemDexSources.source("furn", FURN_INDEX.kj_law_e0)) && /コンビニ|ポイント/.test(ItemDexSources.source("furn", FURN_INDEX.cvc_law_plate_wanko)), "まえからの しょっきの ヒントは その まま");
}
// ---- 10. ことば ----
for (const [k, v] of Object.entries(TW.WORDS)) for (const t of [].concat(typeof v === "function" ? v(30) : v)) ok(!kanji.test(t) && t.length <= 60, `ことば ${k}: ${t}`);

console.log(`✓ check-table-ware: ${n} 件`);
