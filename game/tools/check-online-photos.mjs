// オンライン PR3（E5・UI-96・js/online-photos.js）の 検査（ブラウザ なし。ネットは にせの Firebase〔tests/online-fake.mjs〕を 127.0.0.1 で）:
// 1. よみこみ・すまほの「みんな」の「ぷりくら」タブ（Online.parts）・セーブ（Save.d.online.photo）
// 2. encode: おくるのは ぷりくらの 絵の データ だけ（ASCII の もじれつ・ことばは ばんごう・とった じこくは おくらない）・しらない ことばは おくらない・ながすぎる ものは おくらない
// 3. decode: encode → decode が もどる・しらない ポーズ／かお／ふく／スタンプ／ことば・__proto__・ブースの ちがう ことば・へんな キー は すてる か なおす
// 4. ルール（database.rules.json の photos・reportcount・reportlog）: かたち・正規表現に ぜんぶの はいけい・ブース・ポーズ・かお・ふく・スタンプ・キラキラが あう・ながさが OnlinePhotos.LEN と おなじ・にせの サーバーも おなじ
// 5. にせの サーバーの きまり: じぶんの キー だけ・ほかの こうもく／にほんごの もじは かけない・ほうこくは 1人 1かい（かずと きろくは いっしょ）・じぶんの しゃしんは ほうこく できない・ほうこくの きろくは よめない
// 6. みせる・やめる・けした しゃしんも サーバーから・いちらん（かくす・ほうこく・3にん いじょう）・なまえを かえる・けす（ほうこくの とりけし・じぶんの しゃしん ぜんぶ）・ID が かわる
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
import { startOnlineFake } from "../tests/online-fake.mjs";
const R = gameContext();
const { Online: O, OnlineNet: N, OnlinePhotos: OP, Purikura: P, Save: S, Chara, ITEM_INDEX, PokaDebug: D } = R;
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/;

// ---- 1. よみこみ・タブ・セーブ ----
const scripts = [...read("index.html").matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
ok(scripts.indexOf("js/online-photos.js") === scripts.indexOf("js/online-rooms.js") + 1 && scripts.indexOf("js/purikura.js") < scripts.indexOf("js/online-photos.js") && read("sw.js").includes('"./js/online-photos.js"'), "online-photos.js は online-rooms.js の すぐ あと（purikura.js より あと）・sw.js にも");
ok(!/\bfetch\s*\(|EventSource|XMLHttpRequest|sendBeacon|WebSocket/.test(read("js/online-photos.js")), "online-photos.js は じぶんで ネットに つながない（OnlineNet だけ）");
const part = O.parts.find((p) => p.id === "photos");
ok(part && part.name === "ぷりくら" && ["render", "leave", "wipe", "renamed", "account"].every((k) => typeof part[k] === "function") && O.parts.map((p) => p.id).join() === "rooms,photos,kuji" && O.parts.filter((p) => p.render).map((p) => p.id).join() === "rooms,photos", "「みんな」の「ぷりくら」タブ（Online.parts の 2つめ。3つめの いちばんくじ〔js/kuji-net.js〕は タブ なし）");
const FRESH = '{"uid":"","shown":{},"sid":{},"hide":[],"hideU":[],"rep":{}}';
ok(JSON.stringify(S.fresh().online.photo) === FRESH && JSON.stringify(O.fresh().photo) === FRESH, "Save.d.online.photo");
S.d = S.fresh();
S.d.online.photo = { uid: 5, shown: { "ok-1": 3, "Bad": 1, "__proto__": 1, "no-2": "x", "gone-3": -1, "neg-4": -5 }, sid: JSON.parse('{"ok-1":"abcdefgh12","Bad":"abcdefgh12","__proto__":"abcdefgh12","no-2":5,"p-3":"ABCDEFGH12","p-4":"short"}'), hide: ["u1_p-1", "bad key", 3, "a_b_c-d"], hideU: ["u2", "x y", null], rep: { "u3_p-2": "bad", "u4_p-3": "evil", "u5_p-4": "spam" }, extra: 1 };
let st = O.st().photo;
ok(st.uid === "" && JSON.stringify(st.shown) === '{"ok-1":3,"gone-3":-1}' && JSON.stringify(st.sid) === '{"ok-1":"abcdefgh12"}' && JSON.stringify(st.hide) === '["u1_p-1","a_b_c-d"]' && JSON.stringify(st.hideU) === '["u2"]' && JSON.stringify(st.rep) === '{"u3_p-2":"bad","u5_p-4":"spam"}' && !("extra" in st), "こわれた photo を なおす " + JSON.stringify(st));
S.d.online.photo = null; ok(JSON.stringify(O.st().photo) === FRESH, "photo が ない セーブ");
S.d.online.photo = { hide: Array.from({ length: 400 }, (_, i) => `u_p-${i}`), hideU: Array.from({ length: 150 }, (_, i) => "u" + i) };
ok(O.st().photo.hide.length === 300 && O.st().photo.hide[0] === "u_p-100" && O.st().photo.hideU.length === 100, "かくした ものは あたらしい 300・100 まで");

// ---- 2. encode ----
S.d = S.fresh(); S.d.online.nick = [5, 7];
const seeded = D.photoSeed(3), src = P.list().find((p) => p.id === seeded[0]);
let e = OP.encode(src);
ok(e && JSON.stringify(Object.keys(e).sort()) === '["b","c","e","k","m","n","o","p","r","s","t","x","z"]', "おくる こうもく " + JSON.stringify(e && Object.keys(e)));
ok(e.n === "5-7" && JSON.stringify(e.t) === '{".sv":"timestamp"}' && !JSON.stringify(e).includes(String(src.t)), "なまえの コード・サーバーの じこく（とった じこくは おくらない）");
ok(/^[\x20-\x7e]*$/.test(JSON.stringify(e)), "おくる データは ASCII だけ（にほんごの もじ・じゆうな もじが ない） " + JSON.stringify(e));
ok(e.b === src.bg && e.k === src.k && e.z === src.z && e.r === src.r.join(",") && e.c === Chara.IDS.map((id) => src.c[id].join(".")).join(","), "はいけい・ブース・アップ・ならび・ポーズと かお");
ok(e.x.split(",").every((t) => /^\d+(\.-?\d+){3,4}$/.test(t)) && e.x.split(",").map((t) => +t.split(".")[0]).every((c) => OP.wordOf(c, src.k)), "もじは きまった ことばの ばんごう " + e.x);
for (const b of P.BOOTHS) for (const w of P.wordsOf(b.id)) { const c = OP.wordCode(w, b.id); ok(c >= 0 && OP.wordOf(c, b.id) === w, "ことばの ばんごう " + b.id + " " + w); }
ok(OP.wordCode("じゆうな もじ", "yume") === -1 && OP.wordCode("おなじ クラス", "yume") === -1 && OP.wordOf(200, "yume") === "" && OP.wordOf(200, "school") === "おなじ クラス" && OP.wordOf(-1, "yume") === "" && OP.wordOf(1.5, "yume") === "" && OP.wordOf(99, "yume") === "", "ことばの ばんごうの はんい（ブースの ことばは その ブース だけ）");
// しらない ことば（まえの バージョンや こわれた セーブ）は おくらない
const odd = JSON.parse(JSON.stringify(src)); odd.d.x = [["じゆうな もじ", 10, 10, 0], [P.WORDS[1], 20, 20, 1]];
e = OP.encode(odd);
ok(e.x === `1.20.20.1` && !JSON.stringify(e).includes("じゆう"), "しらない ことばは おくらない " + e.x);
// ペン・スタンプ・キラキラが ない しゃしん
const plain = JSON.parse(JSON.stringify(src)); plain.d = { p: [], s: [], x: [] }; delete plain.m;
e = OP.encode(plain);
ok(JSON.stringify(Object.keys(e).sort()) === '["b","c","k","n","o","r","t","z"]', "らくがきの ない しゃしん " + Object.keys(e));
ok(OP.encode(null) === null && OP.encode({ id: "x" }) === null, "しゃしん で ない もの");
// ながさ: いちばん おおきい らくがき（せん 40本・1500点・スタンプ 30・ことば 6）でも ルールの なか
const big = JSON.parse(JSON.stringify(src));
big.d.p = Array.from({ length: 40 }, (_, i) => P.packStroke({ c: 5, w: 1, pts: Array.from({ length: 37 }, (_, j) => [4095, 4095]) })).slice(0, 40);
big.d.s = Array.from({ length: 30 }, () => ["nekomimi", 300, 400, 2, -180, 1]);
big.d.x = Array.from({ length: 6 }, () => ["ずっと いっしょ", 300, 400, 5, -180]);
big.m = { wanko: [-240, -150], gachan: [-240, -150], goji: [-240, -150] };
e = OP.encode(big);
ok(e && e.p.length <= OP.LEN.p && e.s.length <= OP.LEN.s && e.x.length <= OP.LEN.x && e.m.length <= OP.LEN.m, "いちばん おおきい らくがきも おくれる " + JSON.stringify(e && { p: e.p.length, s: e.s.length, x: e.x.length, m: e.m.length }));
const fits = Object.values(ITEM_INDEX).filter((it) => it.slot && OP.SLOTS.includes(it.slot)), longest = (sl) => fits.filter((it) => it.slot === sl).sort((a, b) => b.id.length - a.id.length)[0];
const full = JSON.parse(JSON.stringify(src));
for (const id of Chara.IDS) full.o[id] = [Object.fromEntries(OP.SLOTS.map((sl) => [sl, longest(sl === "head2" ? "head" : sl)]).filter(([, it]) => it).map(([sl, it]) => [sl, it.id])), "dark"];
e = OP.encode(full);
ok(e && e.o.length <= OP.LEN.o && e.o.split("|").every((x) => x.split(";").length >= 5), "ふくを ぜんぶ きても おくれる " + (e && e.o.length));

// ---- 3. decode ----
S.d = S.fresh(); S.d.online.nick = [1, 2];
const s1 = P.list()[0] || P.clean({ id: "zz-1" });
D.photoSeed(1);
const a = P.list().at(-1), ea = JSON.parse(JSON.stringify(OP.encode(a)));
let d = OP.decode("uidA_" + a.id, { ...ea, t: 777 });
ok(d && d.key === "uidA_" + a.id && d.uid === "uidA" && d.sid === a.id && d.t === 777 && JSON.stringify(d.n) === "[1,2]", "decode の キーと なまえ");
ok(JSON.stringify({ ...d.photo, t: 0 }) === JSON.stringify({ ...P.clean(a), t: 0 }), "encode → decode が もどる");
ok(d.photo.t === 777 && P.dateText(777) === P.dateText(d.photo.t), "わくの 日づけは みせた 日");
ok(OP.decode("uid_with_under_" + a.id, ea).uid === "uid_with_under" && OP.decode("u-1_p-0", ea).uid === "u-1", "キーは さいごの _ で わける");
for (const bad of ["", "nouid", "_p-1", "u_", "u_P-1", "u_p_1x", "u/x_p-1", "__proto__", "constructor", "u_" + "a".repeat(41)]) ok(OP.decode(bad, ea) === null, "へんな キー " + bad);
ok(OP.decode("u_p-1", null) === null && OP.decode("u_p-1", "x") === null && OP.decode("u_p-1", [1]) === null, "しゃしん で ない");
const evil = { n: "<b>", t: "x", b: "__proto__", k: "constructor", z: 7, r: "goji,goji,goji",
  c: "__proto__.happy,peace.toString,stand.love", o: "soft:head=__proto__;body=constructor;face=" + Object.keys(ITEM_INDEX).find((k) => ITEM_INDEX[k].slot === "body") + ";zzz=ribbon_pink|dark:hand=nope|evil:head=",
  m: "9999.9999,a.b,1", p: "01AAAA,zz,<script>,01" + "A".repeat(8), s: "heart.1.2.0,__proto__.1.2.0,star.1.2,ichigo.9999.-9999.9.720.1,kira.1.2.3.4.5.6.7", x: "0.10.10.0,200.10.10.0,99.1.1.1,abc,7.1.1.1.1.1,1.-5.9999.99.400",
  e: "kira,__proto__,yuki,zzz", extra: "x" };
d = OP.decode("u9_p-9", evil);
ok(d && d.n === null && d.t === 0 && d.photo.bg === "yume" && d.photo.k === "yume" && d.photo.z === 0 && d.photo.r.join() === Chara.IDS.join(), "へんな しゃしんを なおす " + JSON.stringify(d && d.photo));
ok(JSON.stringify(d.photo.c) === '{"wanko":["stand","happy"],"gachan":["stand","happy"],"goji":["stand","love"]}', "しらない ポーズ・かおは もとに " + JSON.stringify(d.photo.c));
ok(JSON.stringify(d.photo.o.wanko[0]) === "{}" && JSON.stringify(d.photo.o.gachan) === '[{},"dark"]' && d.photo.o.goji[1] === "soft", "しらない ふく・ちがう ばしょの ふく・__proto__ は すてる " + JSON.stringify(d.photo.o));
ok(JSON.stringify(d.photo.m || null) === JSON.stringify({ wanko: [P.MOVE.x, -0] , gachan: [0, 0], goji: [0, 0] }) || (d.photo.m && d.photo.m.wanko[0] === P.MOVE.x && d.photo.m.gachan.join() === "0,0"), "うごかした ばしょの はんい " + JSON.stringify(d.photo.m));
ok(d.photo.d.p.length === 2 && d.photo.d.p.every((x) => /^[0-5][01](?:[A-Za-z0-9_-]{4})+$/.test(x)), "へんな せんは すてる " + JSON.stringify(d.photo.d.p));
ok(JSON.stringify(d.photo.d.s.map((q) => q[0])) === '["heart","ichigo"]' && d.photo.d.s[1][1] === P.PW && d.photo.d.s[1][2] === 0 && d.photo.d.s[1][3] === 2, "しらない スタンプ・__proto__・へんな かずは すてる／なおす " + JSON.stringify(d.photo.d.s));
ok(JSON.stringify(d.photo.d.x.map((q) => q[0])) === JSON.stringify([P.WORDS[0], P.WORDS[1]]), "ブースの ちがう ことば・ない ことばは すてる " + JSON.stringify(d.photo.d.x));
ok(JSON.stringify(d.photo.d.e) === '["kira","yuki"]', "しらない キラキラは すてる");
d = OP.decode("u9_p-8", { ...ea, k: "school", b: "kyoshitsu", x: "200.1.1.1,300.1.1.1" });
ok(JSON.stringify(d.photo.d.x.map((q) => q[0])) === '["おなじ クラス"]' && d.photo.k === "school", "ブースの ことばは その ブースの しゃしん だけ " + JSON.stringify(d.photo.d.x));
d = OP.decode("u9_p-7", { ...ea, p: "01AAAA".repeat(2000) });
ok(d && d.photo.d.p.length === 0, "ながすぎる せんは よまない");
d = OP.decode("u9_p-6", { ...ea, s: Array.from({ length: 50 }, () => "heart.1.1.0").join(",") });
ok(d.photo.d.s.length === P.LIMIT.stamps, "スタンプは " + P.LIMIT.stamps + "こ まで");

// ---- 4. ルール ----
const rules = JSON.parse(read("firebase/database.rules.json")).rules.v1, PH = rules.photos, PK = PH.$key, RC = rules.reportcount, RL = rules.reportlog;
ok(PH[".read"] === "auth != null" && JSON.stringify(PH[".indexOn"]) === '["t"]' && !(".write" in PH), "ルール: しゃしんは ログインした 人が よめる・t の じゅん");
ok(PK[".write"] === "auth != null && $key.beginsWith(auth.uid + '_') && $key.replace(auth.uid + '_', '').matches(/^[a-z0-9-]+$/) && $key.length <= 180", "ルール: かくのは じぶんの キー（uid_しゃしんの ばんごう）だけ");
ok(PK[".validate"] === "newData.hasChildren(['n', 't', 'b', 'k', 'z', 'r', 'c', 'o'])" && PK.$other[".validate"] === false, "ルール: いる こうもく・ほかの こうもくは かけない");
ok(PK.n[".validate"] === rules.players.$uid.n[".validate"] && PK.t[".validate"] === rules.players.$uid.t[".validate"], "ルール: なまえ・じこくは おなじ");
const reOf = (s) => new RegExp(/matches\(\/(.+?)\/\)/.exec(s)[1]), lenOf = (s) => +/length <= (\d+)/.exec(s)[1];
for (const [k, len] of Object.entries(OP.LEN)) ok(lenOf(PK[k][".validate"]) === len, "ルールの ながさ " + k + " = OnlinePhotos.LEN");
for (const b of P.BGS) ok(reOf(PK.b[".validate"]).test(b.id) && b.id.length <= lenOf(PK.b[".validate"]), "ルールの はいけい " + b.id);
for (const b of P.BOOTHS) ok(reOf(PK.k[".validate"]).test(b.id) && b.id.length <= lenOf(PK.k[".validate"]), "ルールの ブース " + b.id);
const cRe = reOf(PK.c[".validate"]), cLen = lenOf(PK.c[".validate"]), longPose = [...P.POSES].sort((x, y) => y.id.length - x.id.length)[0].id, longFace = [...P.FACES].sort((x, y) => y.id.length - x.id.length)[0].id;
for (const p of P.POSES) for (const f of P.FACES) ok(cRe.test([p.id + "." + f.id, "stand.happy", "side.sleep"].join(",")), "ルールの ポーズと かお " + p.id + "." + f.id);
ok([longPose + "." + longFace, longPose + "." + longFace, longPose + "." + longFace].join(",").length <= cLen && reOf(PK.r[".validate"]).test(Chara.IDS.join(",")) && Chara.IDS.join(",").length <= lenOf(PK.r[".validate"]), "ルールの ながさ（ポーズ・ならび）");
for (const it of fits) ok(reOf(PK.o[".validate"]).test(`soft:${it.slot}=${it.id}|dark:|soft:`), "ルールの ふく " + it.id);
for (const s of P.STAMPS) ok(reOf(PK.s[".validate"]).test(`${s.id}.1.2.0,${s.id}.300.400.2.-180.1`), "ルールの スタンプ " + s.id);
for (const f of P.EFFECTS) ok(reOf(PK.e[".validate"]).test(f.id + "," + f.id), "ルールの キラキラ " + f.id);
ok(!reOf(PK.x[".validate"]).test("なかよし.1.1.0") && !reOf(PK.x[".validate"]).test("a.1.1.0") && reOf(PK.x[".validate"]).test("0.1.1.0,312.-5.9.5.-180"), "ルール: もじは ばんごう だけ（にほんごの もじは かけない）");
ok(!reOf(PK.p[".validate"]).test("01AA AA") && reOf(PK.p[".validate"]).test("01AAAA,10_-z9") && !reOf(PK.o[".validate"]).test("soft:head=<b>") && !reOf(PK.s[".validate"]).test("Heart.1.1.0"), "ルール: せん・ふく・スタンプの もじ");
ok(/newData\.val\(\) === 0 \|\| newData\.val\(\) === 1/.test(PK.z[".validate"]), "ルール: アップは 0 か 1");
ok(RC[".read"] === "auth != null" && Object.keys(RC).sort().join() === "$key,.read" && /data\.exists\(\) \? data\.val\(\) : 0\) \+ 1/.test(RC.$key[".write"]) && /newData\.val\(\) === data\.val\(\) - 1/.test(RC.$key[".write"]) && /!root\.child\('v1\/reportlog'\)\.child\(\$key\)\.child\(auth\.uid\)\.exists\(\)/.test(RC.$key[".write"]), "ルール: ほうこくの かずは きろくと いっしょに 1 だけ かわる");
ok(!(".read" in RL) && !(".read" in RL.$key) && !(".read" in RL.$key.$rid) && /auth\.uid === \$rid/.test(RL.$key.$rid[".write"]) && /!\$key\.beginsWith\(auth\.uid \+ '_'\)/.test(RL.$key.$rid[".write"]) && /root\.child\('v1\/photos'\)\.child\(\$key\)\.exists\(\)/.test(RL.$key.$rid[".write"]) && /\^\(bad\|spam\)\$/.test(RL.$key.$rid[".write"]), "ルール: ほうこくの きろくは よめない・1人 1かい・じぶんの しゃしんは だめ・ある しゃしん だけ");
ok(OP.REASONS.map((r) => r.id).join("|") === "bad|spam", "ほうこくの りゆうは ルールと おなじ");
const fakeSrc = read("tests/online-fake.mjs");
for (const [k, len] of Object.entries(OP.LEN)) ok(fakeSrc.includes(`${k}: [${len}, /${reOf(PK[k][".validate"]).source}/]`), "にせの サーバーも ルールと おなじ " + k);
ok(fakeSrc.includes(`b: [16, /${reOf(PK.b[".validate"]).source}/]`) && fakeSrc.includes(`c: [90, /${cRe.source}/]`) && fakeSrc.includes("key.length <= 180") && fakeSrc.includes("reportlog: { depth: 4, read: Infinity"), "にせの サーバーの しゃしん・ほうこく");

// ---- 5. にせの サーバーの きまり（HTTP で ちょくせつ）----
const fake = await startOnlineFake();
const H = async (method, path, body, tok, q = "") => {
  const r = await fetch(`${fake.base}/db/${path}.json?auth=${encodeURIComponent(tok || "")}${q ? "&" + q : ""}`, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  let j = null; try { j = await r.json(); } catch (e) { /* 204 */ }
  return { status: r.status, body: j };
};
const sign = async () => { const r = await (await fetch(`${fake.base}/auth/accounts:signUp?key=${fake.conf.apiKey}`, { method: "POST", body: "{}" })).json(); return { uid: r.localId, tok: r.idToken }; };
const A = await sign(), B = await sign(), C = await sign();
const good = { ...ea, t: { ".sv": "timestamp" } }, kA = `${A.uid}_p-1`, kA2 = `${A.uid}_p-2`;
ok((await H("PUT", `v1/photos/${kA}`, good, A.tok)).status === 200 && (await H("PUT", `v1/photos/${kA2}`, good, A.tok)).status === 200, "じぶんの しゃしんを かける");
ok((await H("PUT", `v1/photos/${B.uid}_p-1`, good, A.tok)).status === 401, "ほかの 人の キーは かけない");
ok((await H("PUT", `v1/photos/${A.uid}_x_p-1`, good, A.tok)).status === 401 && (await H("PUT", `v1/photos/${A.uid}_P-1`, good, A.tok)).status === 401 && (await H("PUT", `v1/photos/${A.uid}`, good, A.tok)).status === 401, "へんな キーは かけない");
for (const [k, v] of [["x", "なかよし.1.1.0"], ["o", "soft:head=<b>"], ["p", "01 AAAA"], ["z", 2], ["b", "Yume"], ["extra", "1"], ["n", "<b>"], ["t", 5]]) ok((await H("PUT", `v1/photos/${A.uid}_p-3`, { ...good, [k]: v }, A.tok)).status === 401, "へんな こうもくは かけない " + k);
const miss = { ...good }; delete miss.c; ok((await H("PUT", `v1/photos/${A.uid}_p-3`, miss, A.tok)).status === 401, "いる こうもくが ない");
ok((await H("PATCH", `v1/photos/${kA}`, { n: "9-9" }, A.tok)).status === 200 && fake.at(`v1/photos/${kA}/n`) === "9-9", "なまえだけ かきかえ");
ok((await H("PATCH", "v1/photos", { [`${A.uid}_p-9/n`]: "9-9" }, A.tok)).status === 401, "ない しゃしんに なまえだけ は かけない");
ok((await H("GET", "v1/photos", undefined, B.tok, `orderBy=${encodeURIComponent('"t"')}&limitToLast=24`)).status === 200 && (await H("GET", "v1/photos", undefined, "")).status === 401, "しゃしんは ログインした 人だけ よめる");
const q$ = `orderBy=${encodeURIComponent('"$key"')}&startAt=${encodeURIComponent(JSON.stringify(A.uid + "_"))}&endAt=${encodeURIComponent(JSON.stringify(A.uid + "_\uf8ff"))}`;
ok(JSON.stringify(Object.keys((await H("GET", "v1/photos", undefined, A.tok, q$)).body).sort()) === JSON.stringify([kA, kA2].sort()), "$key で じぶんの しゃしんを さがす");
// ほうこく
const rep = (U, key, count, reason = "bad") => H("PATCH", "v1", { [`reportlog/${key}/${U.uid}`]: reason, [`reportcount/${key}`]: count }, U.tok);
ok((await rep(B, kA, 1)).status === 200 && fake.at(`v1/reportcount/${kA}`) === 1 && fake.at(`v1/reportlog/${kA}/${B.uid}`) === "bad", "ほうこく（きろく ＋ かず 1）");
ok((await rep(B, kA, 2)).status === 401, "1人 1かい");
ok((await rep(C, kA, 3)).status === 401 && (await rep(C, kA, 1)).status === 401, "かずは 1 だけ ふえる");
ok((await rep(A, kA, 2)).status === 401, "じぶんの しゃしんは ほうこく できない");
ok((await rep(C, `${A.uid}_p-404`, 1)).status === 401, "ない しゃしんは ほうこく できない");
ok((await rep(C, kA, 2, "evil")).status === 401, "りゆうは きまった もの だけ");
ok((await H("PUT", `v1/reportcount/${kA}`, 2, C.tok)).status === 401 && (await H("PUT", `v1/reportcount/${kA}`, 0, A.tok)).status === 401 && (await H("DELETE", `v1/reportcount/${kA}`, undefined, A.tok)).status === 401, "かずだけ かえる・けす ことは できない");
ok((await H("PUT", `v1/reportlog/${kA}/${C.uid}`, "bad", C.tok)).status === 401, "きろくだけ かく ことは できない");
ok((await H("GET", `v1/reportlog/${kA}`, undefined, A.tok)).status === 401 && (await H("GET", "v1/reportlog", undefined, B.tok)).status === 401, "ほうこくの きろくは だれも よめない");
ok((await H("GET", `v1/reportcount/${kA}`, undefined, A.tok)).body === 1 && (await H("GET", "v1/reportcount", undefined, C.tok)).status === 200, "ほうこくの かずは よめる");
ok((await rep(C, kA, 2, "spam")).status === 200 && fake.at(`v1/reportcount/${kA}`) === 2, "ほかの 人も ほうこく できる");
ok((await H("PATCH", "v1", { [`reportlog/${kA}/${A.uid}`]: null, [`reportcount/${kA}`]: 1 }, A.tok)).status === 401, "ほうこく して いない 人は へらせない");
ok((await H("PATCH", "v1", { [`reportlog/${kA}/${B.uid}`]: null, [`reportcount/${kA}`]: 1 }, C.tok)).status === 401, "ほかの 人の きろくは けせない");
ok((await H("PATCH", "v1", { [`reportlog/${kA}/${B.uid}`]: null, [`reportcount/${kA}`]: 0 }, B.tok)).status === 401 && (await H("PATCH", "v1", { [`reportlog/${kA}/${B.uid}`]: null }, B.tok)).status === 401, "とりけしは かずを 1 へらす ときだけ");
ok((await H("PATCH", "v1", { [`reportlog/${kA}/${B.uid}`]: null, [`reportcount/${kA}`]: 1 }, B.tok)).status === 200 && fake.at(`v1/reportcount/${kA}`) === 1 && fake.at(`v1/reportlog/${kA}/${B.uid}`) === null, "じぶんの ほうこくを とりけす");
ok((await H("PATCH", "v1", { [`photos/${kA}`]: null, [`reportcount/${kA}`]: null }, A.tok)).status === 401 && (await H("DELETE", `v1/photos/${kA2}`, undefined, A.tok)).status === 200, "しゃしんは けせるが ほうこくの かずは けせない");
fake.reset();

// ---- 6. みせる・いちらん・ほうこく・けす（OnlineNet → にせの サーバー）----
N.fetchFn = (url, opt) => fetch(url, opt);
const reset = () => { S.d = S.fresh(); N.over = { ...fake.conf }; N.auth = null; N.pending = null; O.reg = ""; R.localStorage.removeItem(N.KEY); OP.list = null; OP.counts = {}; const s = O.st(); s.on = true; s.agreed = 1; s.ver = O.VER; s.nick = [3, 4]; };
reset();
const mine = D.photoSeed(3);
ok(OP.available() && OP.shownIds().length === 0, "はじめは みせて いない");
await OP.share(mine[0]);
const uid = N.uid(), k0 = OP.key(uid, mine[0]);
st = O.st().photo;
ok(fake.at(`v1/photos/${k0}`) && OP.isShown(mine[0]) && st.uid === uid && st.shown[mine[0]] > 0, "みせる → サーバーに 1まい");
// サーバーの キーに しゃしんの id（とった じこく）を いれない: しゃしんごとに ランダムな ばんごう
const sid0 = st.sid[mine[0]], when = mine[0].slice(1).split("-")[0];
ok(k0 === `${uid}_${sid0}` && /^[a-z0-9]{21}$/.test(sid0) && OP.KEY_RE.test(k0) && !k0.includes(mine[0]) && !k0.includes(when) && Object.keys(fake.at("v1/photos")).every((k) => !k.includes(when)), "サーバーの キーは ランダムな ばんごう（とった じこくが わからない） " + k0);
ok(OP.key(uid, mine[1]) === "" && OP.key("", mine[0]) === "" && OP.sidOf(mine[1]) === "" && JSON.stringify(Object.keys(O.st().photo.sid)) === JSON.stringify([mine[0]]), "ばんごうは みせる とき だけ きめる");
ok(new Set(Array.from({ length: 200 }, () => OP.newSid())).size === 200 && Array.from({ length: 50 }, () => OP.newSid()).every((x) => /^[a-z0-9]{21}$/.test(x)), "ばんごうは ばらばら・かたち（ここは crypto が ない ので Math.random。ブラウザの crypto.getRandomValues は スモークで）");
ok(OP.newSid(new Set(["x"])) !== "x" && read("js/online-photos.js").includes("crypto.getRandomValues"), "ばんごうは crypto.getRandomValues で きめる");
const sent = fake.at(`v1/photos/${k0}`);
ok(JSON.stringify(Object.keys(sent).sort()) === '["b","c","e","k","m","n","o","p","r","s","t","x","z"]' && sent.n === "3-4" && typeof sent.t === "number" && /^[\x20-\x7e]*$/.test(JSON.stringify(sent)), "サーバーの しゃしん " + JSON.stringify(sent));
await OP.share(mine[0]);
ok(OP.shownIds().length === 1, "おなじ しゃしんを もう いちど みせても 1まい");
await OP.share(mine[1]);
const k1 = OP.key(uid, mine[1]);
ok(k1 && k1 !== k0 && fake.at(`v1/photos/${k1}`), "2まいめは べつの ばんごう");
st.shown = Object.fromEntries(Array.from({ length: OP.MAX }, (_, i) => ["x" + i + "-0", 1])); // ほかに 8まい みせて いる ことに
let err = null; try { await OP.share(mine[2]); } catch (e2) { err = e2; }
ok(err && err.code === "max" && OP.key(uid, mine[2]) === "" && Object.keys(fake.at("v1/photos")).length === 2, `みせられるのは ${OP.MAX}まい まで`);
st.shown = { [mine[0]]: 5, [mine[1]]: 6 };
// ほかの 人の しゃしん
fake.write(`v1/photos/otherA_p-1`, { ...ea, n: "5-7", t: { ".sv": "timestamp" } });
fake.write(`v1/photos/otherA_p-2`, { ...ea, n: "5-7", t: { ".sv": "timestamp" } });
fake.write(`v1/photos/otherB_p-1`, { ...ea, n: "6-8", t: { ".sv": "timestamp" } });
fake.write(`v1/photos/otherC_p-1`, { ...ea, n: "1-1", t: { ".sv": "timestamp" } });
fake.write("v1/photos/badkey", { ...ea });
fake.write("v1/reportcount/otherC_p-1", 3);
let rows = await OP.load();
ok(rows.length === 6 && !rows.some((r) => r.key === "badkey") && rows.every((r, i) => i === 0 || rows[i - 1].t >= r.t), "いちらん（あたらしい じゅん・へんな キーは すてる） " + rows.map((r) => r.key));
const vis = () => (OP.list || []).filter((it) => !OP.hidden(it)).map((it) => it.key).sort().join();
ok(OP.counts["otherC_p-1"] === 3 && vis() === [k0, k1, "otherA_p-1", "otherA_p-2", "otherB_p-1"].sort().join(), "ほうこくが 3にん いじょうの しゃしんは みえない " + vis());
// かくす
OP.hide("otherA_p-2"); ok(!vis().includes("otherA_p-2") && vis().includes("otherA_p-1"), "この しゃしんを かくす");
OP.hideUser("otherA"); ok(!vis().includes("otherA_p-1"), "この 人の しゃしんを ぜんぶ かくす");
OP.unhideAll(); ok(vis().includes("otherA_p-1") && vis().includes("otherA_p-2"), "かくした ものを もどす");
// ほうこく
ok(await OP.report(rows.find((r) => r.key === "otherB_p-1"), "spam") && fake.at("v1/reportcount/otherB_p-1") === 1 && O.st().photo.rep["otherB_p-1"] === "spam" && !vis().includes("otherB_p-1"), "ほうこく → かず 1・じぶんには みえない");
ok(await OP.report(rows.find((r) => r.key === "otherB_p-1"), "spam") && fake.at("v1/reportcount/otherB_p-1") === 1, "おなじ しゃしんは 1かい だけ");
ok(await OP.report(rows.find((r) => r.key === k0), "bad") === false && !fake.at(`v1/reportcount/${k0}`), "じぶんの しゃしんは ほうこく しない");
ok(await OP.report(rows.find((r) => r.key === "otherA_p-1"), "evil") === false, "りゆうは きまった もの だけ");
fake.write("v1/reportcount/otherA_p-1", 1); // だれかが さきに ほうこくして いた
ok(await OP.report(rows.find((r) => r.key === "otherA_p-1"), "bad") && fake.at("v1/reportcount/otherA_p-1") === 2, "まえの かずに 1 たす");
// けした しゃしんは サーバーからも
P.remove(mine[1]);
for (let i = 0; i < 40 && fake.at(`v1/photos/${k1}`); i++) await new Promise((r) => setTimeout(r, 10));
ok(!fake.at(`v1/photos/${k1}`) && !(mine[1] in O.st().photo.shown), "「しゃしん」アプリで けすと サーバーからも けす");
for (let i = 0; i < 40 && OP.sidOf(mine[1]); i++) await new Promise((r) => setTimeout(r, 10));
ok(OP.sidOf(mine[1]) === "" && OP.sidOf(mine[0]) === sid0, "けした しゃしんの ばんごうは わすれる（ほかの しゃしんは のこす）");
// つながらない ときは あとで（オフの とき）
O.st().on = false; await OP.share(mine[0]).catch(() => {}); O.st().on = true;
st = O.st().photo; st.shown[mine[2]] = -1; // けす まち（サーバーには ない しゃしん）
ok(await OP.flush() === 1 && !(mine[2] in st.shown), "けす まちの しゃしんを あとで けす");
// やめる
await OP.unshare(mine[0]);
ok(!fake.at(`v1/photos/${k0}`) && !OP.isShown(mine[0]) && OP.sidOf(mine[0]) === sid0, "みせるのを やめる（ばんごうは おぼえて おく）");
// みんなの いちらんの じぶんの しゃしんを やめる（サーバーの キーで。てもとに ない ものも）
await OP.share(mine[0]); await OP.unshareKey(k0);
ok(!fake.at(`v1/photos/${k0}`) && !OP.isShown(mine[0]), "いちらんから やめる（キーで）");
fake.write(`v1/photos/${uid}_orphan-1`, { ...ea, n: "3-4", t: { ".sv": "timestamp" } });
await OP.unshareKey(`${uid}_orphan-1`); await OP.unshareKey("otherA_p-1"); await OP.unshareKey("bad key");
ok(!fake.at(`v1/photos/${uid}_orphan-1`) && fake.at("v1/photos/otherA_p-1"), "てもとに ない じぶんの しゃしんも やめられる・ほかの 人の ものは さわらない");
// なまえを かえる → みせて いる しゃしんの なまえも（サーバーに ない しゃしんは わすれる）
await OP.share(mine[0]); O.st().photo.shown["ghost-1"] = 9;
ok(OP.key(uid, mine[0]) === k0 && fake.at(`v1/photos/${k0}`), "みせなおしても おなじ ばんごう（ほうこくの かずも おなじ しゃしんに のこる）");
await O.rename([7, 7]);
ok(fake.at(`v1/photos/${k0}/n`) === "7-7" && !("ghost-1" in O.st().photo.shown) && fake.at(`v1/players/${uid}`).n === "7-7", "なまえを かえると しゃしんの なまえも・ない しゃしんは わすれる");
// けす: ほうこくを とりけす・じぶんの しゃしん ぜんぶ（てもとに ない ものも さがす）
fake.write(`v1/photos/${uid}_lost-1`, { ...ea, n: "7-7", t: { ".sv": "timestamp" } }); // ほかの セーブで みせた もの
const before = { b: fake.at("v1/reportcount/otherB_p-1"), a: fake.at("v1/reportcount/otherA_p-1") };
await O.wipe();
ok(!fake.at(`v1/photos/${k0}`) && !fake.at(`v1/photos/${uid}_lost-1`) && fake.at("v1/photos/otherA_p-1"), "けす → じぶんの しゃしん ぜんぶ（ほかの 人の ものは のこる）");
ok(before.b === 1 && fake.at("v1/reportcount/otherB_p-1") === 0 && before.a === 2 && fake.at("v1/reportcount/otherA_p-1") === 1, "けす → じぶんの ほうこくを とりけす " + JSON.stringify(before));
st = O.st().photo;
ok(st.uid === "" && JSON.stringify(st.shown) === "{}" && JSON.stringify(st.rep) === "{}" && st.hide.includes("otherB_p-1") && st.hide.includes("otherA_p-1") && !fake.users.includes(uid), "けした あと: てもとの きろく・かくした ものは のこる・アカウントは ない " + JSON.stringify(st));
// ID が かわったら まえの ID の きろくを わすれる
reset(); st = O.st().photo; Object.assign(st, { uid: "old", shown: { "a-1": 5 }, rep: { "x_p-1": "bad" } });
await O.sync();
ok(st.uid === N.uid() && JSON.stringify(st.shown) === "{}" && JSON.stringify(st.rep) === "{}" && st.hide.includes("x_p-1"), "ID が かわった ときは みせた きろくを わすれる（ほうこくした ものは かくした ものに）");
N.over = null; N.fetchFn = null; N.auth = null; N.pending = null;
await fake.close();

// ---- 7. ことば ----
const srcJs = read("js/online-photos.js");
for (const t of [...srcJs.matchAll(/text: "([^"]+)"/g)].map((m) => m[1])) ok(!KANJI.test(t), "ことばは ひらがな中心: " + t);
ok(srcJs.includes("ゲームの 中の えの データ だけ おくるよ") && srcJs.includes("もじは きまった ことば だけ") && srcJs.includes("だれが ほうこくしたかは ほかの 人には わからないよ") && srcJs.includes("じぶんの すまほ だけ"), "みせる まえに おくる ものを いう・ほうこくと かくすの せつめい");
ok(read("js/online.js").includes("ぷりくら（ゲームの 中の え。みせると きめた もの だけ・もじは きまった ことば だけ）"), "同意の まどの おくる ものに ぷりくら");

console.log(`✓ オンラインの ぷりくら（E5・UI-96）: ${n} 項目`);
process.exit(0);
