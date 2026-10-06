// おじゃま（E5・UI-97・js/online-visit.js）の 検査（ブラウザ・ネット なし）:
// 1. よみこみ（online-photos.js の すぐ あと・sw.js）・SCENES.visit・じぶんで ネットに つながない・セーブに かかない
// 2. ほかの ファイルが HouseScene に つつんだ うごき（ドア・2かい・トイレ・おねがい・きがえの かえし）は おじゃまでは うごかない（HOUSE_SCENE_BASE）
// 3. よんだ おへや → この 画面の へや（guest）: コピー・uid・むき・かべ・フィギュア・へんな かべがみ／ゆか・ひろさ
// 4. へやを つかう ところ: Room.of・HomeDesign.guestSize（ROOM）・HomeNav（よその 家具・かいだん なし）・HomeActions・HomeLife.nearFurn・FurnLive（forget）
// 5. よその おうちは かえない: フィギュア だいの まどが でない・もようがえ／ねる／おでかけ／みまもる／おへや の ボタンが ない
// 6. もどる ところ（backOf）・go（よみこみ・よめない・とちゅうで すまほを とじる）・start
// 7. ことば（ひらがな中心・きまった いれもの）・すまほ・CSS・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { OnlineVisit: V, VisitScene, HOUSE_SCENE_BASE: BASE, HouseScene, SCENES, Room, ROOM, HomeDesign, HomeNav, HomeActions, HomeLife, HomeFloors, FurnLive, FigureStand,
  OnlineRooms: OR, OnlineNet: N, Save: S, FURN_INDEX, WALLPAPERS, FLOORS, UI, Game, G, Smaho } = R;
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/;
const src = read("js/online-visit.js");

// ---- 1. よみこみ ----
const scripts = [...read("index.html").matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
ok(scripts.indexOf("js/online-visit.js") === scripts.indexOf("js/online-photos.js") + 1 && scripts.indexOf("js/online-visit.js") < scripts.indexOf("js/debug.js") && read("sw.js").includes('"./js/online-visit.js"'), "online-visit.js は online-photos.js の すぐ あと・sw.js にも");
ok(["scene-house.js", "home-doors.js", "home-floors.js", "home-toilet.js", "gowaga-wish.js", "pet-walk.js", "play-records.js", "mee-fitting.js", "online-rooms.js"].every((f) => scripts.indexOf("js/" + f) >= 0 && scripts.indexOf("js/" + f) < scripts.indexOf("js/online-visit.js")), "HouseScene を つつむ ファイルは みんな まえに よむ");
ok(SCENES.visit === VisitScene && Object.getPrototypeOf(VisitScene.prototype) === HouseScene.prototype, "SCENES.visit は HouseScene を うけつぐ");
ok(!/\bfetch\s*\(|EventSource|XMLHttpRequest|OnlineNet\.(put|patch|post|del|get|stream)/.test(src), "online-visit.js は じぶんで ネットに つながない（よむのは OnlineRooms.fetchRoom → OnlineNet）");
ok(!/Save\.(mark|write|d\.(room|rooms|world|furn)\b\s*=)/.test(src) && !/Save\.d\.room\b/.test(src), "online-visit.js は じぶんの おへや・セーブに かかない");

// ---- 2. つつむ まえの うごき ----
const P = VisitScene.prototype, own = (k) => Object.prototype.hasOwnProperty.call(P, k);
const OVERRIDE = ["enter", "exit", "insets", "buildUI", "showBar", "goBack", "update", "up", "doorAt", "askBack", "pet"];
ok(OVERRIDE.every(own) && OVERRIDE.every((k) => typeof P[k] === "function"), "おじゃまの うごき " + OVERRIDE.filter((k) => !own(k)));
ok(Object.isFrozen(BASE) && Object.keys(BASE).length > 60 && !Object.prototype.hasOwnProperty.call(BASE, "constructor") && typeof BASE.render === "function", "HOUSE_SCENE_BASE（つつむ まえの おうちの うごき）" + Object.keys(BASE).length);
for (const [k, fn] of Object.entries(BASE)) if (!OVERRIDE.includes(k)) ok(P[k] === fn, "おじゃまは つつむ まえの " + k);
// ほかの ファイルが つつんだ もの（ドア・2かい・トイレ・こいぬ・おねがい・なでなでの きろく・きがえの かえし）
const WRAPPED = ["enter", "exit", "layout", "up", "update", "pose", "drawChar", "drawFurn", "clampItem", "baseFace", "react", "pet"];
for (const k of WRAPPED) ok(HouseScene.prototype[k] !== BASE[k], "おうちの " + k + " は ほかの ファイルが つつんで いる（スナップショットは つつむ まえ）");
ok(["pose", "drawChar", "drawFurn", "clampItem", "baseFace", "react", "layout"].every((k) => P[k] === BASE[k] && P[k] !== HouseScene.prototype[k]), "おじゃまでは ドア・2かい・トイレの つつみを つかわない");
ok(/HOUSE_SCENE_BASE\.up\.call\(this, p\)/.test(P.up.toString()) && /PetWalk\.houseTap\(this, p\)/.test(P.up.toString()) && /PetWalk\.houseUpdate\(this, dt\)/.test(P.update.toString()), "こいぬ（PetWalk）は おうちと おなじ");
ok(/HOUSE_SCENE_BASE\.pet\.call\(this, c\)/.test(P.pet.toString()) && /PlayRecords\.add\(c\.id, "pat"\)/.test(P.pet.toString()), "なでなでの きろくは おうちと おなじ");
ok(!/GowagaWish|HomeToilet|HomeDoors|HomeFloors|ParentCare|ParentWork|MeeFitting|DailyPlay/.test(src.replace(/\/\/.*$/gm, "")), "おねがい・トイレ・ドア・2かい・ぱぱ まま・きがえの かえしは よばない");
ok(!/HomeLife\.(init|update|event|toggle)\(/.test(src) && /HomeLife\.blank\(\)/.test(src), "おうちの できごと（HomeLife.init／update）は つかわない・かたちは HomeLife.blank");

// ---- 3. guest ----
S.d = S.fresh(); S.d.online.nick = [1, 2];
const stand = Object.keys(FigureStand.STANDS)[0], figs = FigureStand.figures().slice(0, 2);
const raw = { n: [5, 7], t: 123, k: "study", wall: "wp_star", floor: "fl_carpet", size: "expanded",
  items: [{ uid: "v0", id: "sofa", x: 300, y: 560, flip: true }, { uid: "v1", id: "window", x: 200, y: 110, wallSide: "left" }, { uid: "v2", id: stand, x: 420, y: 420, figs: [figs[0], null, figs[1]] }, { uid: "v3", id: "zzz_future", x: 1, y: 1 },
    { uid: "v4", id: "__proto__", x: 1, y: 1 }, { uid: "v5", id: "constructor", x: 1, y: 1 }, { uid: "v6", id: "sofa", x: NaN, y: 1 }, null] };
const back = { scene: "world", p: { map: "town", x: 3, y: 4, dir: "up" } };
let g = V.guest({ room: raw, uid: "hostA", back });
ok(g && g.name === "わくわく ぺんぎん" && g.roomName === "ひだまりの アトリエ" && g.uid === "hostA" && !g.mine && g.back === back, "guest " + JSON.stringify({ name: g.name, room: g.roomName }));
ok(JSON.stringify(g.room.items.map((it) => [it.uid, it.id, it.flip, it.wallSide || ""])) === JSON.stringify([["v0", "sofa", true, ""], ["v1", "window", false, "left"], ["v2", stand, false, ""]]), "かぐの コピー（しらない かぐ・__proto__・constructor・へんな ばしょは すてる）" + JSON.stringify(g.room.items));
ok(g.room.items[2].figs !== raw.items[2].figs && JSON.stringify(g.room.items[2].figs) === JSON.stringify(raw.items[2].figs) && g.room.items[0] !== raw.items[0] && g.room.size === "expanded" && g.room.wall === "wp_star", "もとの データは かえない（コピー）");
g.room.items[0].x = 1; ok(raw.items[0].x === 300, "コピーを かえても もとは そのまま");
g = V.guest({ room: { n: null, k: "nope", wall: "__proto__", floor: "constructor", size: "big", items: [] } });
ok(g.room.wall === WALLPAPERS[0].id && g.room.floor === FLOORS[0].id && g.room.size === "standard" && g.name === "" && V.title(g) === "だれかの おうち" && g.roomName === "おへや" && g.back.scene === "house", "へんな へやは なおす・なまえが ない ときは だれかの おうち");
ok(V.guest(null) === null && V.guest({ room: { items: "x" } }) === null, "へや で ない");
ok(V.title({ name: "わくわく ぺんぎん", mine: false }) === "わくわく ぺんぎんさんの おうち" && V.title({ name: "わくわく ぺんぎん", mine: true }) === "わくわく ぺんぎんさんの おうち（あなた）", "ひょうさつの なまえ");
const uid0 = N.uid; N.uid = () => "meX"; ok(V.guest({ room: raw, uid: "meX" }).mine === true && V.guest({ room: raw, uid: "hostA" }).mine === false, "じぶんが みせた おへや（mine）"); N.uid = uid0;

// ---- 4. へやを つかう ところ ----
const scene = (room, size = "standard") => {
  HomeDesign.guestSize = size;
  const sc = Object.create(VisitScene.prototype);
  Object.assign(sc, { guest: { room, name: "わくわく ぺんぎん", roomName: "ひだまりの アトリエ", uid: "hostA", back }, parents: [], mode: null, fxs: [], life: HomeLife.blank() });
  HomeActions.init(sc);
  sc.chars = S.d.order.map((id, i) => ({ id, x: 120 + i * 60, y: ROOM.WALL + 200, dir: "down", state: "idle", t: 9, anim: 0, emo: null, hidden: false, jumpT: -1 }));
  return sc;
};
S.d = S.fresh();
const ownW = ROOM.W;
const guestRoom = V.guest({ room: raw, uid: "hostA", back }).room;
let sc = scene(guestRoom, "expanded");
ok(ROOM.W === HomeDesign.sizes.expanded.w && HomeDesign.D === HomeDesign.sizes.expanded.d && ownW === HomeDesign.sizes.standard.w, "おじゃまの あいだは よその おへやの ひろさ（ROOM）");
ok(Room.of(sc) === guestRoom && Room.of({}) === S.d.room && Room.of(null) === S.d.room, "Room.of: おじゃまは よその おへや・おうちは じぶんの おへや");
ok(JSON.stringify(sc.drawOrder().map((it) => it.uid)) === JSON.stringify(["v1", "v0", "v2"].filter((u) => u === "v1").concat(sc.drawOrder().filter((it) => it.uid !== "v1").map((it) => it.uid))) && sc.drawOrder().length === 3 && sc.drawOrder()[0].uid === "v1", "描く かぐは よその おへや（かべ → ゆか）");
ok(sc.hideSpots().filter((s) => !s.door).every((s) => guestRoom.items.includes(s.it)), "かくれんぼの ばしょも よその おへやの かぐ");
// HomeNav: よその 家具の 足もと・2かいの かいだんは ない（じぶんの おうちに 2かいが あっても）
S.d.rooms.owned.upstairs = true; S.d.rooms.stored.upstairs = S.d.rooms.stored.upstairs || { wall: "wp_cream", floor: "fl_wood", items: [], wallpapers: {}, floors: {}, nextUid: 1 };
const navG = HomeNav.info(sc), sofaFoot = navG.feet.find((f) => f.uid === "v0");
ok(navG.feet.length === 2 && !!sofaFoot && !navG.feet.some((f) => f.id === "stairs") && navG.sig.startsWith(ROOM.W + "x" + ROOM.H + ":0:"), "HomeNav: よその 家具だけ・かいだん なし " + JSON.stringify(navG.feet.map((f) => f.id)));
ok(HomeNav.signature(sc).includes("sofa@") && !HomeNav.signature(sc).includes("window@1") && HomeNav.signature(sc) !== HomeNav.signature({ anchor: (it) => BASE.anchor.call({}, it) }), "HomeNav の かたちは よその おへや");
const q = HomeNav.near(sc, (sofaFoot.x0 + sofaFoot.x1) / 2, sofaFoot.y1 - 4);
ok(!HomeNav.blockedAt(sc, q.x, q.y) && !(q.x > sofaFoot.x0 && q.x < sofaFoot.x1 && q.y > sofaFoot.y0 && q.y < sofaFoot.y1), "HomeNav.near: よその ソファの うえには ならばない");
// HomeActions・HomeLife.nearFurn
const sit = HomeActions.kinds.find((k) => k.id === "sit");
ok(HomeActions.furniture(sc, sit).map((it) => it.uid).join() === "v0" && HomeActions.available(sc).some((k) => k.id === "sit"), "しぐさは よその 家具で（ソファで ひとやすみ）");
const c0 = sc.chars[0]; c0.x = sofaFoot.x1 + 6; c0.y = sofaFoot.y1;
ok(HomeLife.nearFurn(sc, c0).some((x) => x.it === guestRoom.items[0]), "そばの 家具は よその おへやの もの");
ok(HomeActions.start(sc, c0, "sit") && c0.activity && c0.activity.uid === "v0", "よその ソファへ あるいて すわる");
// FurnLive: うごきは この 画面の あいだ だけ（forget で よその かぐ だけ わすれる）
const lampG = { uid: "v9", id: "lamp", x: 200, y: 500, flip: false }, lampO = { uid: 9, id: "lamp", x: 200, y: 500, flip: false };
guestRoom.items.push(lampG);
FurnLive.tap(sc, lampG); FurnLive.tap({ ...sc, guest: null, chars: sc.chars, anchor: sc.anchor.bind(sc), react: () => {}, life: sc.life }, lampO);
const onG = FurnLive.state(lampG).on, onO = FurnLive.state(lampO).on;
FurnLive.forget();
ok(onG !== FurnLive.state(lampG).on && FurnLive.state(lampO).on === onO, "FurnLive.forget: よその かぐの じょうたい だけ わすれる");
ok(/FurnLive\.forget\(\)/.test(P.exit.toString()) && /HomeDesign\.guestSize = null/.test(P.exit.toString()) && /HOUSE_SCENE_BASE\.exit\.call\(this\)/.test(P.exit.toString()), "でる ときに ひろさ・かぐの じょうたいを もどす");
guestRoom.items.pop();
HomeDesign.guestSize = null;
ok(ROOM.W === ownW && Room.of({}) === S.d.room, "おわったら じぶんの おうちの ひろさ");

// ---- 5. よその おうちは かえない ----
sc = scene(V.guest({ room: raw, uid: "hostA", back }).room);
let modals = 0;
const modal0 = UI.modal; UI.modal = (...a) => { modals++; return modal0.apply(UI, a); };
const st = sc.guest.room.items.find((it) => it.id === stand), before = JSON.stringify(st.figs);
FurnLive.tap(sc, st);
UI.modal = modal0;
ok(modals === 0 && JSON.stringify(st.figs) === before && sc.life.log.length === 1, "よその フィギュア だいは 見るだけ（いれかえの まどを ださない）" + modals);
ok(/if \(sc\.guest\) \{ say\(/.test(read("js/figure-stand.js")), "フィギュア だい: sc.guest の ときは まどを ださない");
const bar = P.buildUI.toString();
ok(["ごはん", "あそぶ", "きがえ", "かえる"].every((t) => bar.includes(`"${t}"`)) && !/もようがえ|"ねる"|おでかけ|みまもる|"おへや"|ParentCare|startEdit|sleep\(|HomeRooms\.open/.test(bar), "おじゃまの ボタンは ごはん・あそぶ・きがえ・かえる だけ（もようがえ・ねる など は ない）");
ok(!/startEdit|placeNew|Save\.d\.room/.test(src), "もようがえ の しくみを よばない");
const house = read("js/scene-house.js");
ok(/const own = !this\.guest;[^\n]*\n\s*if \(own && typeof HomeFloors !== "undefined"\) HomeFloors\.drawUnder/.test(house) && /if \(own && typeof HomeFloors !== "undefined"\) HomeFloors\.drawAfterBg/.test(house) && /if \(own && typeof HomeDoors !== "undefined"\) HomeDoors\.drawSigns/.test(house), "おじゃまでは じぶんの おうちの 2かい・ドアの ふだを 描かない");
ok(/yard = !this\.guest && HomeGarden\.active\(\)/.test(house) && /"house-design:" \+ \(this\.guest \? "guest" : Save\.d\.rooms\.active\)/.test(house), "おじゃまの へやの 絵は よその かべがみ・ゆか（おにわ に ならない・キーは きまった かず）");

// ---- 6. もどる ところ・いく ----
const walker = { tx: 7, ty: 9, dir: "left" };
const at = (name, sc) => { G.sceneName = name; G.scene = sc; return V.backOf(); };
ok(JSON.stringify(at("world", { mapId: "nerikasu", party: [walker] })) === JSON.stringify({ scene: "world", p: { map: "nerikasu", x: 7, y: 9, dir: "left" } }), "まち・フィールド: いた ばしょ");
ok(JSON.stringify(at("venue", { id: "mall", def: {}, floor: 3, back: { map: "ikebukuro", x: 1, y: 2 }, party: [walker], closed: false })) === JSON.stringify({ scene: "venue", p: { venue: "mall", floor: 3, back: { map: "ikebukuro", x: 1, y: 2 }, at: [7, 9] } }), "たてものの なか: その かいの その ばしょ");
ok(JSON.stringify(at("store", { shopId: "cake", back: { map: "town", x: 5, y: 6 }, party: [walker], closed: false })) === JSON.stringify({ scene: "store", p: { shop: "cake", back: { map: "town", x: 5, y: 6 } } }), "おみせの なか");
ok(JSON.stringify(at("house", {})) === JSON.stringify({ scene: "house", p: {} }), "おうち");
ok(at("visit", { guest: { back } }) === back, "おじゃまから つづけて いく ときは さいしょの ところ");
ok(at("battle", { party: [walker] }) === null && at("venue", { id: "mall", def: {}, closed: true, party: [walker] }) === null && at("world", { mapId: "x", party: [] }) === null && at("title", null) === null, "バトル・でる とちゅう などからは いけない");
// go: よむ → start（Game.goto）。よめない → いかない。とちゅうで すまほを とじる → いかない
const gotos = [], goto0 = Game.goto, toast0 = UI.toast, fetch0 = OR.fetchRoom, toasts = [];
Game.goto = (name, p, type) => { gotos.push({ name, p, type }); };
UI.toast = (t) => { toasts.push(t); };
G.sceneName = "world"; G.scene = { mapId: "town", party: [walker] }; Game.trans = null;
let release = null;
OR.fetchRoom = (uid) => new Promise((res) => { release = () => res(uid === "gone" ? null : OR.decode({ n: "5-7", t: 1, k: "main", w: "wp_star", f: "fl_wood", z: "s", i: [{ a: "sofa", x: 200, y: 450 }] })); });
const row = { disabled: false, classList: { add() {}, remove() {} }, querySelector: () => ({ textContent: "いつもの おへや・かぐ 1こ" }) };
let pr = V.go({ uid: "hostB" }, row);
ok(V.wait > 0 && row.disabled === true, "よみこみ中（ぎょうは おせない）");
ok(await V.go({ uid: "hostC" }) === false, "よみこみ中は ほかの おうちを えらばない");
release(); ok(await pr === true && V.wait === 0 && row.disabled === false && gotos.length === 1, "よめたら いく");
const gp = gotos[0];
ok(gp.name === "visit" && gp.type === "circle" && gp.p.uid === "hostB" && gp.p.room.items.length === 1 && JSON.stringify(gp.p.back) === JSON.stringify({ scene: "world", p: { map: "town", x: 7, y: 9, dir: "left" } }), "Game.goto(\"visit\", { room, uid, back }) " + JSON.stringify(gp.p.back));
pr = V.go({ uid: "gone" }); release(); ok(await pr === false && gotos.length === 1 && toasts.at(-1).includes("もう みられないよ"), "よめない おへやには いかない");
pr = V.go({ uid: "hostD" }); V.cancel(); release(); ok(await pr === false && gotos.length === 1, "とちゅうで すまほを とじたら いかない");
G.sceneName = "battle"; G.scene = {}; ok(await V.go({ uid: "hostE" }) === false && toasts.at(-1).includes("ここからは おじゃま できないよ"), "いけない ところからは いかない");
G.sceneName = "house"; G.scene = {}; Game.trans = { phase: "out" }; ok(V.start({ items: [] }, "x") === false && gotos.length === 1, "画面の きりかえ中は いかない"); Game.trans = null;
// かえる: きた ところへ
G.scene = { guest: { back: { scene: "venue", p: { venue: "mall", floor: 2 } } } }; V.home(G.scene);
ok(JSON.stringify(gotos.at(-1)) === JSON.stringify({ name: "venue", p: { venue: "mall", floor: 2 }, type: "circle" }), "かえる: きた ところへ");
V.home({ guest: { back: { scene: "nope", p: { a: 1 } } } }); ok(gotos.at(-1).name === "house" && JSON.stringify(gotos.at(-1).p) === "{}", "もどる ところが へん なら おうちへ");
Game.goto = goto0; UI.toast = toast0; OR.fetchRoom = fetch0; G.sceneName = "title"; G.scene = null;

// ---- 7. ことば・すまほ・CSS・PokaDebug ----
const lines = [...Object.values(V.LINES).flat(), ...Object.values(V.NEAR).flat(), ...V.TALKS.flat().map((t) => t[1]), ...V.MINE.map((t) => t[1])];
ok(lines.length >= 40 && Object.keys(V.LINES).join() === "wanko,gachan,goji" && Object.keys(V.NEAR).join() === "wanko,gachan,goji", "3人の ことば " + lines.length);
for (const t of lines) ok(!KANJI.test(t) && t.length <= 26 && !/\{(?!host\}|furn\})/.test(t), "ことばは ひらがな中心・みじかい・きまった いれもの: " + t);
for (const t of Object.values(V.NEAR).flat()) ok(t.includes("{furn}"), "そばの 家具の ことばには {furn}: " + t);
ok(V.TALKS.every((t) => t.length === 3 && new Set(t.map((x) => x[0])).size === 3), "かけあいは 3人で");
for (const t of [...src.matchAll(/(?:text|toast)\(?[:,]?\s*"([^"]+)"/g)].map((m) => m[1])) ok(!KANJI.test(t.replace(/3人/g, "")), "画面の ことばは ひらがな中心: " + t);
ok(src.includes('"おじゃましました！"') && src.includes("おじゃまします！") && src.includes('"おうちを でて かえる？"'), "あいさつ・かえる まえに きく（ドア）");
const smaho = read("js/smaho.js");
ok(/\(name === "house" \|\| name === "visit"\) && !sc\?\.mode && !sc\?\.watching/.test(smaho) && /G\.sceneName === "visit"\) el\.append\(UI\.btn\("おうちへ かえる"/.test(smaho), "すまほ: おじゃまでも ひらける・ちずから おうちへ かえる");
const css = read("css/style.css");
ok(/\.visit-plate \{[^}]*max-width: calc\(100% - 24px\)/.test(css) && /\.visit-plate b \{[^}]*overflow-wrap: anywhere/.test(css) && /\.visit-bar \.btn \{ min-height: 56px; \}/.test(css) && !css.includes(".onl-visit"), "CSS: ひょうさつは はみ出さない・ボタンは 44px いじょう・まえの まどの CSS は ない");
const dbg = read("js/debug.js");
ok(/^\s{2}visit\(\) \{/m.test(dbg) && /^\s{2}visitRoom\(data, uid = "testHost"\)/m.test(dbg) && /G\.sceneName !== 'house'&&G\.sceneName !== 'visit'|G\.sceneName!=='house'&&G\.sceneName!=='visit'/.test(dbg), "PokaDebug.visit・visitRoom・おうちの 入口は おじゃまでも");
ok(P.insets.call({})[0] >= 100 && P.insets.call({})[1] >= 80, "へやの 絵は ひょうさつと ボタンに かさならない");

console.log(`✓ おじゃま（E5・UI-97）: ${n} 項目`);
