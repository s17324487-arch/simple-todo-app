// オンライン PR2（E5・UI-95・js/online-rooms.js）の 検査（ブラウザ・ネット なし）:
// 1. よみこみ・すまほの「みんな」の「おうち」タブ（Online.parts）・セーブ（Save.d.online.room）
// 2. encode: おくるのは かべがみ・ゆか・ひろさ・おへやの しゅるい・かぐの しゅるいと ばしょ・むき・かべの がわ・フィギュア だいの フィギュア・なまえの コード・じこく だけ
// 3. decode: しらない かぐ・__proto__・へんな ばしょ・へんな フィギュア・へんな かべがみ／ゆか は すてる か なおす
// 4. ルール（database.rules.json の rooms・roomlist）: かたち・正規表現に ぜんぶの かぐ・かべがみ・ゆか・おへやの id が あう・かずの はんい・にせの サーバーも おなじ
// 5. publish・unpublish・load（orderBy・limitToLast）・fetchRoom・けす・なまえを かえる（にせの fetch）
// 6. いちらんの タップで 3人で おじゃま（UI-97・js/online-visit.js。まえの 見るだけの まどは ない。おじゃまの 検査は tools/check-online-visit.mjs）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { Online: O, OnlineNet: N, OnlineRooms: OR, Save: S, FURN_INDEX, FURNITURE, WALLPAPERS, FLOORS, WALL_INDEX, FLOOR_INDEX, HomeRooms, FigureStand } = R;
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/;

// ---- 1. よみこみ・タブ・セーブ ----
const scripts = [...read("index.html").matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
ok(scripts.indexOf("js/online-rooms.js") === scripts.indexOf("js/online.js") + 1 && read("sw.js").includes('"./js/online-rooms.js"'), "online-rooms.js は online.js の すぐ あと・sw.js にも");
ok(!/\bfetch\s*\(|EventSource|XMLHttpRequest/.test(read("js/online-rooms.js")), "online-rooms.js は じぶんで ネットに つながない（OnlineNet だけ）");
const part = O.parts.find((p) => p.id === "rooms");
ok(part && part.name === "おうち" && typeof part.render === "function" && typeof part.wipe === "function" && typeof part.rename === "function" && typeof part.leave === "function", "「みんな」の「おうち」タブ（Online.parts）");
ok(JSON.stringify(S.fresh().online.room) === '{"shown":0,"id":"","uid":""}' && JSON.stringify(O.fresh().room) === JSON.stringify(S.fresh().online.room), "Save.d.online.room");
S.d = S.fresh(); S.d.online.room = { shown: "x", id: 5 };
ok(JSON.stringify(O.st().room) === '{"shown":0,"id":"","uid":""}', "こわれた room を なおす " + JSON.stringify(O.st().room));
S.d.online.room = null; ok(JSON.stringify(O.st().room) === '{"shown":0,"id":"","uid":""}', "room が ない セーブ");

// ---- 2. encode ----
S.d = S.fresh();
ok(JSON.stringify(OR.rooms().map((r) => r.id)) === '["main"]' && OR.pick() === "main", "はじめは いつもの おへや だけ");
S.d.rooms.owned.yard = true; S.d.rooms.owned.study = true; S.d.rooms.stored.study = { wall: "wp_star", floor: "fl_carpet", items: [{ uid: 1, id: "sofa", x: 200, y: 400, flip: true }], wallpapers: {}, floors: {}, nextUid: 2 };
ok(JSON.stringify(OR.rooms().map((r) => r.id)) === '["main","study"]', "おにわ（yard）は みせられない " + OR.rooms().map((r) => r.id));
ok(OR.encode("yard") === null && OR.encode("nope") === null && OR.encode("__proto__") === null, "みせられない おへや");
S.d.online.nick = [5, 7];
let e = OR.encode("main");
ok(e && e.n === "5-7" && JSON.stringify(e.t) === '{".sv":"timestamp"}' && e.k === "main" && e.w === "wp_cream" && e.f === "fl_wood" && e.z === "s" && e.i.length === 5, "いつもの おへや " + JSON.stringify(e));
ok(JSON.stringify(Object.keys(e).sort()) === '["f","i","k","n","t","w","z"]' && e.i.every((o) => Object.keys(o).every((k) => ["a", "x", "y", "r", "s", "g"].includes(k))), "おくる こうもく だけ");
ok(JSON.stringify(e.i[0]) === '{"a":"window","x":190,"y":116}', "かぐの かたち " + JSON.stringify(e.i[0]));
e = OR.encode("study");
ok(e.k === "study" && e.w === "wp_star" && JSON.stringify(e.i) === '[{"a":"sofa","x":200,"y":400,"r":true}]', "べつの おへや（stored）・むき " + JSON.stringify(e));
S.d.rooms.expanded.study = true; ok(OR.encode("study").z === "e", "ひろい おへや");
// かべの がわ・フィギュア だい・しらない かぐ・おおすぎ・へんな ばしょ
const figs = FigureStand.figures().slice(0, 2), stand = Object.keys(FigureStand.STANDS)[0];
S.d.room.items = [{ uid: 1, id: "window", x: 100, y: 120, wallSide: "left" }, { uid: 2, id: stand, x: 300, y: 450, figs: [figs[0], null, figs[1]] }, { uid: 3, id: "zzz_future", x: 1, y: 1 }, { uid: 4, id: "sofa", x: NaN, y: 3 }, { uid: 5, id: "__proto__", x: 1, y: 1 }, { uid: 6, id: "bed_simple", x: 1e9, y: -1e9 }];
e = OR.encode("main");
ok(e.i.length === 3 && e.i[0].s === "l" && typeof e.i[1].g === "string" && e.i[1].g.split(",")[0] === figs[0] && e.i[1].g.split(",")[2] === figs[1] && e.i[1].g.split(",").length === FigureStand.STANDS[stand].slots.length, "かべの がわ・フィギュア・しらない かぐは おくらない " + JSON.stringify(e.i));
ok(e.i[2].x === 1000 && e.i[2].y === -100, "ばしょの はんい " + JSON.stringify(e.i[2]));
S.d.room.items = Array.from({ length: 120 }, (_, i) => ({ uid: i + 1, id: "plant", x: 10 + i, y: 400 }));
ok(OR.encode("main").i.length === OR.MAX && OR.MAX <= 100, "かぐは " + OR.MAX + "こ まで");
S.d.room.items = [];
ok(!("i" in OR.encode("main")), "かぐが ない おへや");

// ---- 3. decode ----
let d = OR.decode({ n: "5-7", t: 123, k: "study", w: "wp_star", f: "fl_carpet", z: "e", i: [{ a: "sofa", x: 300, y: 500, r: true }, { a: "zzz_future", x: 1, y: 1 }, { a: "__proto__", x: 1, y: 1 }, { a: "constructor", x: 1, y: 1 }, { a: "window", x: 200, y: 110, s: "l" }, { a: "bookshelf", x: 99999, y: -99999 }, { a: stand, x: 300, y: 450, g: `${figs[0]},,<b>,__proto__,zzz,${figs[1]}` }, { a: "sofa", x: "1", y: 2 }, null, "x"] });
ok(d && JSON.stringify(d.n) === "[5,7]" && d.k === "study" && d.wall === "wp_star" && d.floor === "fl_carpet" && d.size === "expanded", "decode の へや " + JSON.stringify(d));
ok(JSON.stringify(d.items.map((it) => it.id)) === JSON.stringify(["sofa", "window", "bookshelf", stand]), "しらない かぐ・__proto__・constructor・へんな ばしょは すてる " + d.items.map((it) => it.id));
ok(d.items[0].flip === true && d.items[1].wallSide === "left" && d.items[2].x === 1000 && d.items[2].y === -100 && d.items.every((it, i) => it.uid === "v" + i), "むき・かべ・ばしょ・uid");
ok(JSON.stringify(d.items[3].figs) === JSON.stringify([figs[0], null, null, null, null, figs[1]]), "フィギュアは しって いる ものだけ " + JSON.stringify(d.items[3].figs));
d = OR.decode({ n: "<b>", t: "x", k: "__proto__", w: "__proto__", f: "constructor", z: "big", i: "zzz" });
ok(d && d.n === null && d.t === 0 && d.k === "main" && d.wall === WALLPAPERS[0].id && d.floor === FLOORS[0].id && d.size === "standard" && d.items.length === 0, "へんな へやは なおす " + JSON.stringify(d));
ok(OR.decode(null) === null && OR.decode("x") === null && OR.decode([1]) === null, "へや で ない");
ok(OR.decode({ i: Object.fromEntries(Array.from({ length: 150 }, (_, i) => [i, { a: "plant", x: 1, y: 400 }])) }).items.length === 100, "よむ かぐは 100こ まで");
// encode → decode が もどる
S.d = S.fresh(); S.d.online.nick = [1, 2];
const back = OR.decode(JSON.parse(JSON.stringify(OR.encode("main"))));
ok(JSON.stringify(back.items.map(({ id, x, y, flip }) => ({ id, x, y, flip }))) === JSON.stringify(S.d.room.items.map(({ id, x, y, flip }) => ({ id, x, y, flip: !!flip }))) && back.wall === S.d.room.wall && back.floor === S.d.room.floor, "encode → decode");

// ---- 4. ルール ----
const rules = JSON.parse(read("firebase/database.rules.json")).rules.v1, RM = rules.rooms.$uid, RL = rules.roomlist;
ok(RL[".read"] === "auth != null" && JSON.stringify(RL[".indexOn"]) === '["t"]' && RL.$uid[".write"] === "auth != null && auth.uid === $uid" && !(".read" in rules.rooms) && RM[".read"] === "auth != null" && RM[".write"] === "auth != null && auth.uid === $uid", "ルール: いちらんは よめる・おへやは 1けんずつ・かくのは じぶんだけ");
ok(RM.$other[".validate"] === false && RM.i.$k.$other[".validate"] === false && RL.$uid.$other[".validate"] === false, "ルール: ほかの こうもくは かけない");
ok(/hasChildren\(\['n', 't', 'k', 'w', 'f', 'z'\]\)/.test(RM[".validate"]) && /hasChildren\(\['n', 't', 'c', 'k'\]\)/.test(RL.$uid[".validate"]) && /hasChildren\(\['a', 'x', 'y'\]\)/.test(RM.i.$k[".validate"]), "ルール: いる こうもく");
const reOf = (s) => new RegExp(/matches\(\/(.+?)\/\)/.exec(s)[1]), lenOf = (s) => +/length <= (\d+)/.exec(s)[1];
const idRe = reOf(RM.i.$k.a[".validate"]), idLen = lenOf(RM.i.$k.a[".validate"]);
for (const f of FURNITURE) ok(idRe.test(f.id) && f.id.length <= idLen && OR.ID_RE.test(f.id), "ルールの かぐの id " + f.id);
for (const w of WALLPAPERS) ok(reOf(RM.w[".validate"]).test(w.id) && w.id.length <= lenOf(RM.w[".validate"]), "ルールの かべがみ " + w.id);
for (const f of FLOORS) ok(reOf(RM.f[".validate"]).test(f.id) && f.id.length <= lenOf(RM.f[".validate"]), "ルールの ゆか " + f.id);
for (const r of HomeRooms.catalog) ok(reOf(RM.k[".validate"]).test(r.id) && r.id.length <= lenOf(RM.k[".validate"]) && RM.k[".validate"] === RL.$uid.k[".validate"], "ルールの おへや " + r.id);
const keyRe = reOf(RM.i.$k[".validate"]);
ok(keyRe.test("0") && keyRe.test(String(OR.MAX - 1)) && keyRe.test("99") && !keyRe.test("100") && !keyRe.test("a"), "ルール: かぐは 100こ まで（0〜99）");
ok(/>= -100 && newData\.val\(\) <= 1000/.test(RM.i.$k.x[".validate"]) && RM.i.$k.x[".validate"] === RM.i.$k.y[".validate"] && /<= 100$/.test(RL.$uid.c[".validate"]), "ルール: ばしょと かずの はんい");
const gRe = reOf(RM.i.$k.g[".validate"]);
for (const f of FigureStand.figures()) ok(gRe.test(f + ",," + f) && idRe.test(f), "ルール: フィギュア " + f);
ok(lenOf(RM.i.$k.g[".validate"]) >= 12 * 41 && /^\^\(s\|e\|3\|4\)\$$/.test(reOf(RM.z[".validate"]).source) && OR.Z.every((z) => reOf(RM.z[".validate"]).test(z)) && reOf(RM.i.$k.s[".validate"]).source === "^l$", "ルール: フィギュア 12こ・ひろさ（1〜4ばい。UI-114）・かべの がわ");
ok(RM.n[".validate"] === rules.players.$uid.n[".validate"] && RM.t[".validate"] === rules.players.$uid.t[".validate"] && RL.$uid.n[".validate"] === RM.n[".validate"], "ルール: なまえ・じこくは おなじ");
const fake = read("tests/online-fake.mjs");
ok(fake.includes(`ID_RE = /${idRe.source}/`) && fake.includes('roomlist: { depth: 3, uidAt: 2, read: 2 }') && fake.includes('rooms: { depth: 3, uidAt: 2, read: 3 }') && fake.includes("num(o.x, -100, 1000)") && fake.includes("o.g.length <= 600") && fake.includes("num(v.c, 0, 100)"), "にせの サーバーも ルールと おなじ");

// ---- 5. サーバー（にせの fetch）----
const conf = { apiKey: "test-key-0000000001", databaseURL: "http://127.0.0.1:9099/db", authURL: "http://127.0.0.1:9099/auth", tokenURL: "http://127.0.0.1:9099/token" };
const srv = { calls: [], db: {}, list: null };
const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
N.fetchFn = async (url, opt = {}) => {
  const u = new URL(url), method = opt.method || "GET";
  srv.calls.push({ path: u.pathname, method, q: Object.fromEntries(u.searchParams), body: opt.body ? JSON.parse(opt.body) : null });
  if (u.pathname === "/auth/accounts:signUp") return res(200, { localId: "u1", idToken: "tok-u1", refreshToken: "r-u1", expiresIn: "3600" });
  if (u.pathname === "/auth/accounts:delete") return res(200, {});
  if (method === "GET" && u.pathname === "/db/v1/roomlist.json") return res(200, srv.list);
  if (method === "GET" && u.pathname.startsWith("/db/v1/rooms/")) return res(200, srv.db[u.pathname.slice(4, -5)] ?? null);
  return res(204, null);
};
S.d = S.fresh(); N.over = { ...conf }; N.auth = null; N.pending = null; O.reg = ""; R.localStorage.removeItem(N.KEY);
const st = O.st(); st.on = true; st.agreed = 1; st.ver = O.VER; st.nick = [3, 4];
const c = await OR.publish("main");
const pub = srv.calls.find((x) => x.method === "PATCH");
ok(c === 5 && JSON.stringify(Object.keys(pub.body).sort()) === '["roomlist/u1","rooms/u1"]' && pub.q.print === "silent", "みせる: 1かいの PATCH " + JSON.stringify(pub && Object.keys(pub.body)));
ok(JSON.stringify(pub.body["roomlist/u1"]) === JSON.stringify({ n: "3-4", t: { ".sv": "timestamp" }, c: 5, k: "main" }) && pub.body["rooms/u1"].i.length === 5 && pub.body["rooms/u1"].n === "3-4", "みせる データ");
ok(OR.shown() && st.room.id === "main" && st.room.uid === "u1" && st.room.shown > 0, "みせた きろく");
// なまえを かえる → おへやの なまえも
srv.calls.length = 0; await O.rename([6, 6]);
const rn = srv.calls.find((x) => x.method === "PATCH").body;
ok(rn["rooms/u1/n"] === "6-6" && rn["roomlist/u1/n"] === "6-6", "なまえを かえると おへやの なまえも " + JSON.stringify(rn));
// いちらん（orderBy・limitToLast・あたらしい じゅん・へんな ものは すてる）
srv.list = { u1: { n: "6-6", t: 100, c: 5, k: "main" }, u2: { n: "1-1", t: 300, c: 9, k: "study" }, "bad/uid": { n: "1-1", t: 1 }, u3: { n: "<b>", t: "x", c: 1e9, k: "__proto__" }, u4: null };
srv.calls.length = 0;
const rows = await OR.load(), q = srv.calls[0].q;
ok(q.orderBy === '"t"' && q.limitToLast === String(OR.LIST) && srv.calls[0].method === "GET", "いちらんの よみかた " + JSON.stringify(q));
ok(JSON.stringify(rows.map((r) => r.uid)) === '["u2","u1","u3"]' && rows[2].n === null && rows[2].c === 0 && rows[2].k === "main" && rows[0].c === 9 && rows[0].k === "study", "いちらん " + JSON.stringify(rows));
// 1けん よむ
srv.db["v1/rooms/u2"] = { n: "1-1", t: 300, k: "study", w: "wp_star", f: "fl_carpet", z: "s", i: [{ a: "sofa", x: 200, y: 400 }] };
d = await OR.fetchRoom("u2");
ok(d && d.items.length === 1 && d.k === "study" && srv.calls.at(-1).path === "/db/v1/rooms/u2.json", "おへやを 1けん よむ");
ok(await OR.fetchRoom("../x") === null && await OR.fetchRoom("") === null, "へんな uid は よまない");
// やめる → けす
srv.calls.length = 0; await OR.unpublish();
const un = srv.calls.find((x) => x.method === "PATCH").body;
ok(un["rooms/u1"] === null && un["roomlist/u1"] === null && Object.keys(un).length === 2 && !OR.shown() && st.room.shown === 0, "みせるのを やめる");
// やめた あとは なまえを かえても おへやは かきかえない
srv.calls.length = 0; await O.rename([7, 7]);
ok(!("rooms/u1/n" in srv.calls.find((x) => x.method === "PATCH").body), "みせて いない ときは おへやの なまえを かえない");
// けす（Online.wipe）にも おへや
await OR.publish("main"); srv.calls.length = 0; await O.wipe();
const wp = srv.calls.find((x) => x.method === "PATCH").body;
ok(wp["rooms/u1"] === null && wp["roomlist/u1"] === null && st.room.shown === 0, "けす ときは おへやも");
// ID が かわったら みせた きろくを わすれる
st.on = true; st.agreed = 1; st.ver = O.VER; st.room = { shown: 5, id: "main", uid: "old" };
await O.sync();
ok(st.room.shown === 0 && st.room.uid === "", "ID が かわった ときは みせた きろくを わすれる");
N.over = null; N.fetchFn = null; N.auth = null; N.pending = null;

// ---- 6. いちらんの タップで おじゃま ----
const src = read("js/online-rooms.js");
ok(!("open" in OR) && !("stage" in OR) && !("draw" in OR) && !("view" in OR) && !src.includes("onl-visit"), "見るだけの まどは もう ない（おじゃまに なった）");
ok(/b\.addEventListener\("click", \(\) => \{ Sound\.se\("ok"\); OnlineVisit\.go\(r, b\); \}\);/.test(src) && src.includes("タップすると 3人で おじゃま するよ（よその おへやは かわらないよ）"), "いちらんの タップで 3人で おじゃま");
ok(/leave: \(\) => \{ if \(typeof OnlineVisit !== "undefined"\) OnlineVisit\.cancel\(\); \}/.test(src), "すまほを とじたら よみこみ中の おじゃまを やめる");
// ことば
for (const t of [...src.matchAll(/text: "([^"]+)"/g)].map((m) => m[1])) ok(!KANJI.test(t.replace(/3人/g, "")), "ことばは ひらがな中心: " + t);
ok(src.includes("かべがみ・ゆか・かぐの しゅるいと ばしょ だけ おくるよ") && src.includes("みせるのを やめる"), "みせる まえに おくる ものを いう・やめられる");

console.log(`✓ オンラインの おへや（E5・UI-95）: ${n} 項目`);
