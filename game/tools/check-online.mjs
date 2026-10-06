// オンライン（E5・UI-94・js/online-config.js・js/online-net.js・js/online.js）の 検査（ブラウザ・ネット なし。fetch・EventSource は いれかえる）:
// 1. つなぎさき: から（じゅんびちゅう）か Firebase の かたち・ひみつの 値を かかない・ネットを つかうのは online-net.js だけ・あて先は Google の ログインと Firebase だけ
// 2. セーブ: Save.fresh().online・ふるい セーブに たす（migrate）・こわれた データを なおす（st）
// 3. なまえ: ことば 24 × 24（ひらがな・かさならない）・nickCode ↔ parseNick・へんな コードは「なまえ なし」
// 4. ボード: おみせ・ゲーム・むずかしさ（ナンプレ・英語）ごと・id の かたち・ShopScene からの きめかた
// 5. record（オフでも のこす・よい ときだけ・はんい）・sync（オンの ときだけ・まとめて 1かいの PATCH・おくった ものは おくらない・ID が かわると おくりなおす・おなじ Promise）・
//    rename（しっぱいしたら つぎに ぜんぶ おくりなおす）・stop・wipe（アカウントを つくらない・サーバーの データ → アカウント → てもと）
// 6. ready()・place()・token（リフレッシュ・きえた アカウント）・401 で 1かい つなぎなおす・listen（ストリーム・よみなおし）・apply（put・patch・あぶない キー）
// 7. game/firebase/database.rules.json: かたち・ボードと なまえが ルールの 正規表現に あう・にせの サーバー（tests/online-fake.mjs）も おなじ
// 8. ことば: 同意の まど（18さい いじょう・おくる もの・おくらない もの）・すまほの アプリ・ShopScene・ころころの きろく
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { Online: O, OnlineNet: N, ONLINE_CONFIG: CFG, Save: S, SHOPS, MG_TASKS, SHOP_GAMES, GameEconomy, NumplaRules, NumplaTask, BrainEngTask, ENG_LEVELS, ENG_MODES, Smaho, U, ShopScene } = R;
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/;
const tick = () => new Promise((r) => setTimeout(r, 0));
const flush = async (k = 8) => { for (let i = 0; i < k; i++) await tick(); };

// ---- 1. つなぎさき ----
ok(Object.isFrozen(CFG) && JSON.stringify(Object.keys(CFG)) === '["apiKey","databaseURL","projectId"]', "ONLINE_CONFIG は apiKey・databaseURL・projectId だけ（こおらせる）");
const empty = !CFG.apiKey && !CFG.databaseURL && !CFG.projectId;
ok(empty || (/^AIza[\w-]{35}$/.test(CFG.apiKey) && /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)?\.(firebaseio\.com|firebasedatabase\.app)$/.test(CFG.databaseURL) && /^[a-z0-9-]{4,40}$/.test(CFG.projectId)), "ONLINE_CONFIG の かたちが ちがう " + JSON.stringify(CFG));
ok(N.ready() === !empty, "ONLINE_CONFIG が から なら じゅんびちゅう・あれば つながる");
ok(empty || !["テストの サーバー", ""].includes(N.place()), "ONLINE_CONFIG の データの おきば（同意の まどに でる）: " + N.place());
const cfgSrc = read("js/online-config.js");
ok(!/private_key|client_secret|BEGIN [A-Z ]*PRIVATE|serviceAccount|databaseSecret|password/i.test(cfgSrc), "online-config.js に ひみつの 値を かかない");
const scripts = [...read("index.html").matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const NET = /\bfetch\s*\(|EventSource|XMLHttpRequest|sendBeacon|WebSocket|importScripts/;
for (const f of scripts) if (f !== "js/online-net.js") ok(!NET.test(read(f)), f + ": ネットに つなぐのは js/online-net.js だけ");
const netSrc = read("js/online-net.js");
const hosts = [...new Set([...netSrc.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]))].sort();
ok(JSON.stringify(hosts) === '["identitytoolkit.googleapis.com","securetoken.googleapis.com"]', "online-net.js の あて先は Google の 匿名ログインだけ（データベースは ONLINE_CONFIG）: " + hosts);
const iOn = scripts.indexOf("js/online-config.js");
ok(iOn > 0 && scripts[iOn + 1] === "js/online-net.js" && scripts[iOn + 2] === "js/online.js" && scripts.indexOf("js/smaho.js") < iOn && scripts.indexOf("js/minigames.js") < iOn && scripts.indexOf("js/menu.js") < iOn && scripts.at(-1) === "js/debug.js", "index.html の よみこみ じゅん（smaho・menu・minigames の あと・config → net → online）");
const sw = read("sw.js");
for (const f of ["js/online-config.js", "js/online-net.js", "js/online.js"]) ok(sw.includes(`"./${f}"`), "sw.js の FILES に " + f);
ok(/if \(req\.method !== "GET"\) return;/.test(sw) && /url\.origin === location\.origin/.test(sw), "sw.js は ほかの サイト（Firebase）の つうしんを キャッシュしない");

// ---- 2. セーブ ----
const f0 = S.fresh();
ok(JSON.stringify(f0.online) === JSON.stringify(O.fresh()), "Save.fresh().online と Online.fresh() が ちがう");
ok(S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "セーブの ばんごう・キーは そのまま");
const old = JSON.parse(JSON.stringify(S.fresh())); delete old.online;
ok(JSON.stringify(S.migrate(old).online) === JSON.stringify(O.fresh()), "ふるい セーブに online を たす");
S.d = S.fresh();
S.d.online = { on: "x", agreed: -5, ver: "1", nick: [99, -1], best: [], sent: null, sentUid: 7, extra: 1 };
let st = O.st();
ok(st.on === true && st.agreed === 0 && st.ver === 0 && st.nick.join() === "0,0" && !Array.isArray(st.best) && JSON.stringify(st.sent) === "{}" && st.sentUid === "", "こわれた online を なおす " + JSON.stringify(st));
ok(!O.on(), "同意して いなければ オンに ならない");
S.d.online = null; ok(JSON.stringify(O.st()) === JSON.stringify(O.fresh()), "online が ない セーブ");

// ---- 3. なまえ ----
ok(O.NICK_A.length === 24 && O.NICK_B.length === 24 && new Set([...O.NICK_A, ...O.NICK_B]).size === 48, "なまえの ことばは 24 × 24（かさならない）");
for (const w of [...O.NICK_A, ...O.NICK_B]) ok(/^[ぁ-んー]{2,5}$/.test(w), "なまえの ことばは ひらがな 5もじ まで: " + w);
for (let a = 0; a < 24; a++) for (let b = 0; b < 24; b++) {
  const c = O.nickCode([a, b]);
  ok(/^\d{1,2}-\d{1,2}$/.test(c) && JSON.stringify(O.parseNick(c)) === JSON.stringify([a, b]) && O.nickText([a, b]) === `${O.NICK_A[a]} ${O.NICK_B[b]}`, "なまえの コード " + c);
}
for (const bad of ["24-0", "0-24", "1-2-3", "-1-2", "<b>1-2</b>", "", null, "01-002"]) ok(O.parseNick(bad) === null, "へんな なまえの コード " + bad);
ok(O.nickText(null) === "なまえ なし" && O.nickText(O.parseNick("<img>")) === "なまえ なし", "へんな コードは なまえ なし");
for (let i = 0; i < 50; i++) { const r = O.randomNick(); ok(O.parseNick(O.nickCode(r)), "おまかせの なまえ"); }

// ---- 4. ボード ----
const B = O.boards(), ids = B.map((b) => b.id);
ok(new Set(ids).size === ids.length && B.length >= 25, "ボードが かさなる／すくない " + ids.length);
const expect = [];
for (const [shop] of Object.entries(SHOPS)) {
  if (shop === "link" || !MG_TASKS[shop]) continue;
  const G = SHOP_GAMES[shop];
  if (G) for (const g of G.GAMES) { if (g.boards) for (const b of g.boards) expect.push(`${shop}_${g.id}_${b.id}`); else expect.push(`${shop}_${g.id}`); }
  else expect.push(shop);
  if (shop === "burger") expect.push("burger_mac");
  if (shop === "korokoro") expect.push("korokoro_score");
}
ok(JSON.stringify(ids) === JSON.stringify(expect), "ボードは おみせ（ゲーム・むずかしさ）ごと: " + ids);
for (const need of ["crepe", "burger_mac", "relay", "korokoro", "korokoro_score", "brain_spot", "brain_pair", "brain_math", "kobo_slide", "kobo_shape", "kobo_logic", "gasstand", "postoffice"]) ok(ids.includes(need), "ボード " + need);
for (const L of NumplaRules.LEVELS) ok(ids.includes("kobo_numpla_" + L.id), "ナンプレは むずかしさごと " + L.id);
for (const L of ENG_LEVELS) for (const M of ENG_MODES) ok(ids.includes(`brain_eng_${L.id}_${M.id}`), "英語は レベル × あそびかた ごと " + L.id + M.id);
ok(!ids.includes("link") && !ids.includes("kobo_numpla") && !ids.includes("brain_eng"), "なかよしパズル・まとめた ナンプレ／英語の ボードは ない");
for (const b of B) {
  ok(O.BOARD_RE.test(b.id) && O.isBoard(b.id) && SHOPS[b.shop] && b.name && O.boardName(b.id) === b.name, "ボード " + b.id);
  ok(b.name.length <= 26 && !/undefined|null/.test(b.name), "ボードの なまえ " + b.name);
}
for (const bad of ["crepe_x", "Crepe", "__proto__", "link", "", "brain_eng", "kobo_numpla_zzz", null, 5]) ok(!O.isBoard(bad), "へんな ボード " + bad);
ok(O.board("crepe") === "crepe" && O.board("burger", "mac") === "burger_mac" && O.board("brain", "spot") === "brain_spot" && O.board("brain", null) === "brain_spot" && O.board("kobo", "logic") === "kobo_logic", "ShopScene からの ボード");
ok(O.board("brain", "eng", "hs_fill") === "brain_eng_hs_fill" && O.board("kobo", "numpla", "expert") === "kobo_numpla_expert" && O.board("brain", "eng", "") === "" && O.board("kobo", "numpla", "zzz") === "", "むずかしさの くぎり（boardKey）");
const keyGet = (C) => Object.getOwnPropertyDescriptor(C.prototype, "boardKey")?.get;
ok(keyGet(NumplaTask) && keyGet(BrainEngTask) && keyGet(NumplaTask).call({ lvId: "hard" }) === "hard" && keyGet(BrainEngTask).call({ lvId: "jh", mode: "fill" }) === "jh_fill", "ナンプレ・英語の boardKey");
const sceneSrc = ShopScene.toString();
ok(/this\.points \+= score/.test(sceneSrc) && /Online\.record\(Online\.board\(this\.shopId, this\.variant, this\.boardKey\), this\.points/.test(sceneSrc) && /!interrupted && this\.ranks\.length/.test(sceneSrc), "ShopScene: てんすうの ごうけい・さいごまで した ときだけ きろく");
ok(/てんすう/.test(sceneSrc) && /じこベスト/.test(sceneSrc) && /みんなの ランキングに おくったよ/.test(sceneSrc), "ShopScene の けっかの ことば");
ok(/Online\.record\("korokoro_score", score, \{ m: "" \}\)/.test(read("js/korokoro-score.js")), "ころころの スコア モードも きろく");

// ---- 5. record・sync・rename・stop・wipe（にせの fetch）----
const conf = { apiKey: "test-key-0000000001", databaseURL: "http://127.0.0.1:9099/db", authURL: "http://127.0.0.1:9099/auth", tokenURL: "http://127.0.0.1:9099/token" };
const srv = { calls: [], users: {}, next: 1, db: {}, fail: null, holdPatch: null, denyRead: false };
const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => { if (status === 204) throw new Error("no body"); return body; } });
N.fetchFn = async (url, opt = {}) => {
  const u = new URL(url), method = opt.method || "GET", call = { path: u.pathname, method, q: Object.fromEntries(u.searchParams), body: opt.body };
  srv.calls.push(call);
  if (srv.fail && srv.fail(call)) return res(500, { error: "down" });
  if (u.searchParams.get("key") && u.searchParams.get("key") !== conf.apiKey) return res(400, { error: { message: "API_KEY_INVALID" } });
  if (u.pathname === "/auth/accounts:signUp") { const uid = "u" + srv.next++; srv.users[uid] = { refresh: "r-" + uid, tok: "id-" + uid + "-" + srv.next }; return res(200, { localId: uid, idToken: srv.users[uid].tok, refreshToken: "r-" + uid, expiresIn: "3600" }); }
  if (u.pathname === "/token/token") {
    const rt = new URLSearchParams(opt.body).get("refresh_token"), uid = Object.keys(srv.users).find((k) => srv.users[k].refresh === rt);
    if (!uid) return res(400, { error: { message: "INVALID_REFRESH_TOKEN" } });
    srv.users[uid].tok = "id-" + uid + "-" + srv.next++;
    return res(200, { id_token: srv.users[uid].tok, refresh_token: rt, expires_in: "3600", user_id: uid });
  }
  if (u.pathname === "/auth/accounts:delete") { const t = JSON.parse(opt.body).idToken, uid = Object.keys(srv.users).find((k) => srv.users[k].tok === t); if (!uid) return res(400, { error: { message: "INVALID_ID_TOKEN" } }); delete srv.users[uid]; return res(200, {}); }
  if (u.pathname.startsWith("/db/")) {
    const tok = u.searchParams.get("auth"), uid = Object.keys(srv.users).find((k) => srv.users[k].tok === tok);
    if (!uid) return res(401, { error: "Permission denied" });
    const path = u.pathname.slice(4, -5);
    if (method === "GET") return srv.denyRead ? res(401, { error: "Permission denied" }) : res(200, srv.db[path] ?? null);
    if (srv.holdPatch && method === "PATCH") await srv.holdPatch;
    const body = JSON.parse(opt.body);
    if (method === "PUT") srv.db[path] = body;
    else if (method === "PATCH") for (const [k, v] of Object.entries(body)) { if (v === null) delete srv.db[path + "/" + k]; else srv.db[path + "/" + k] = v; }
    return u.searchParams.get("print") === "silent" ? res(204) : res(200, body);
  }
  return res(404, {});
};
const reset = () => { S.d = S.fresh(); N.over = { ...conf }; N.auth = null; N.pending = null; O.reg = ""; O.syncP = null; O.again = false; srv.calls.length = 0; srv.db = {}; srv.users = {}; srv.next = 1; srv.fail = null; srv.denyRead = false; R.localStorage.removeItem(N.KEY); };
reset();
ok(N.ready() && N.place() === "テストの サーバー", "テストの つなぎさき（over）");
// オフ: てもとだけ
let r = O.record("crepe", 250.6, { lv: 3 });
ok(r && r.best && r.s === 251 && !r.sent && st !== null, "オフでも きろく");
st = O.st();
ok(st.best.crepe.s === 251 && st.best.crepe.l === 3 && st.best.crepe.m === "normal" && st.best.crepe.d === U.today() && srv.calls.length === 0, "てもとの きろく（つうしん なし） " + JSON.stringify(st.best.crepe));
ok(!O.record("crepe", 100).best && st.best.crepe.s === 251, "よく ない ときは のこさない");
ok(O.record("nope", 5) === null && O.record("link", 5) === null && O.record("__proto__", 5) === null, "ボード で ない");
ok(O.record("cake", 1e12).s === O.MAX && O.record("groom", -5).s === 0 && !O.record("groom", NaN).best && !("groom" in st.best), "スコアの はんい");
O.record("korokoro_score", 5000, { m: "" });
ok(!("m" in st.best.korokoro_score) && !("l" in st.best.korokoro_score), "ころころの スコア モードは あそびかた なし");
S.d.settings.difficulty = "hard"; O.record("bakery", 300, { lv: 40 }); S.d.settings.difficulty = "normal";
ok(st.best.bakery.m === "hard" && st.best.bakery.l === 40, "あそびかた・おみせ Lv");
// オン: まとめて おくる
st.on = true; st.agreed = Date.now(); st.ver = O.VER; st.nick = [3, 4];
ok(O.on(), "同意して オン");
let sent = await O.sync();
const seq = srv.calls.map((c) => c.method + " " + c.path);
ok(sent === 4 && JSON.stringify(seq) === JSON.stringify(["POST /auth/accounts:signUp", "PUT /db/v1/players/u1.json", "PATCH /db/v1.json"]), "はじめての sync: ログイン → なまえ → まとめて 1かい " + JSON.stringify([sent, seq]));
const patch = JSON.parse(srv.calls[2].body);
ok(JSON.stringify(Object.keys(patch).sort()) === JSON.stringify(["scores/bakery/u1", "scores/cake/u1", "scores/crepe/u1", "scores/korokoro_score/u1"]), "おくる ボード " + Object.keys(patch));
ok(JSON.stringify(patch["scores/crepe/u1"]) === JSON.stringify({ s: 251, n: "3-4", t: { ".sv": "timestamp" }, l: 3, m: "normal" }) && JSON.stringify(patch["scores/korokoro_score/u1"]) === JSON.stringify({ s: 5000, n: "3-4", t: { ".sv": "timestamp" } }) && patch["scores/bakery/u1"].l === 40, "おくる かたち（スコア・なまえの コード・サーバーの じこく・Lv・あそびかた だけ） " + JSON.stringify(patch));
ok(JSON.stringify(JSON.parse(srv.calls[1].body)) === JSON.stringify({ n: "3-4", t: { ".sv": "timestamp" } }) && srv.calls.every((c) => c.path.startsWith("/auth") || c.q.auth === srv.users.u1.tok) && srv.calls.slice(1).every((c) => c.q.print === "silent"), "なまえ・トークン・print=silent");
ok(st.sentUid === "u1" && st.sent.crepe === 251 && st.sent.cake === O.MAX, "おくった きろく");
const stored = JSON.parse(R.localStorage.getItem(N.KEY));
ok(stored && stored.uid === "u1" && stored.refresh === "r-u1" && stored.db === conf.databaseURL && !("id" in stored) && !JSON.stringify(S.d).includes("r-u1"), "ログインの きろくは セーブと べつ（ID トークンは のこさない）");
srv.calls.length = 0;
ok(await O.sync() === 0 && srv.calls.length === 0, "おくった ものは もう おくらない（つうしん なし）");
// よい きろく → すぐ おくる（おなじ Promise）
r = O.record("crepe", 300, { lv: 3 });
ok(r.best && r.sent && O.syncP, "オンの よい きろくは おくる");
const p1 = O.sync(), p2 = O.sync();
ok(p1 === p2 && p1 === O.syncP, "sync は おくって いる とちゅうなら おなじ Promise");
await p1;
ok(srv.calls.filter((c) => c.method === "PATCH").length === 1 && JSON.stringify(Object.keys(JSON.parse(srv.calls.find((c) => c.method === "PATCH").body))) === '["scores/crepe/u1"]' && st.sent.crepe === 300 && O.syncP === null, "1つだけ おくる " + JSON.stringify(srv.calls.map((c) => c.method + " " + c.path)));
// とちゅうで もう 1つ → おわってから もう 1かい
srv.calls.length = 0;
let release; srv.holdPatch = new Promise((ok2) => (release = ok2));
O.record("dentist", 120, { lv: 2 });
await flush();
O.record("florist", 130, { lv: 2 });
srv.holdPatch = null; release();
await O.sync();
const pts = srv.calls.filter((c) => c.method === "PATCH").map((c) => Object.keys(JSON.parse(c.body)).join());
ok(JSON.stringify(pts) === '["scores/dentist/u1","scores/florist/u1"]' && st.sent.dentist === 120 && st.sent.florist === 130, "とちゅうの きろくも あとで おくる " + JSON.stringify(pts));
// トークンが きれた（401）→ 1かい つなぎなおす
srv.calls.length = 0; srv.users.u1.tok = "changed-on-server";
O.record("bakery", 400, { lv: 2 }); await O.sync();
const seq2 = srv.calls.map((c) => c.method + " " + c.path);
ok(JSON.stringify(seq2) === JSON.stringify(["PATCH /db/v1.json", "POST /token/token", "PATCH /db/v1.json"]) && st.sent.bakery === 400, "401 → リフレッシュ → もう いちど " + JSON.stringify(seq2));
// アカウントが きえた → あたらしい ID → ぜんぶ おくりなおす
srv.calls.length = 0; delete srv.users.u1; N.auth.exp = 0;
O.record("crepe", 301, { lv: 3 }); await O.sync();
const seq3 = srv.calls.map((c) => c.method + " " + c.path);
const u2 = N.uid();
ok(u2 && u2 !== "u1" && JSON.stringify(seq3) === JSON.stringify(["POST /token/token", "POST /auth/accounts:signUp", `PUT /db/v1/players/${u2}.json`, "PATCH /db/v1.json"]) && st.sentUid === u2 && Object.keys(JSON.parse(srv.calls[3].body)).length === Object.keys(st.best).length, "きえた アカウント → あたらしく つくって ぜんぶ おくる " + JSON.stringify(seq3));
// なまえを かえる
srv.calls.length = 0;
await O.rename([5, 6]);
const rn = JSON.parse(srv.calls.at(-1).body);
ok(rn[`players/${u2}`].n === "5-6" && Object.keys(rn).length === 1 + Object.keys(st.best).length && Object.entries(rn).filter(([k]) => k.startsWith("scores/")).every(([, v]) => v.n === "5-6"), "なまえを かえると おくった きろくの なまえも かわる");
srv.fail = (c) => c.method === "PATCH";
let threw = false; try { await O.rename([6, 6]); } catch (e) { threw = true; }
ok(threw && JSON.stringify(st.sent) === "{}" && O.reg === "" && st.nick.join() === "6,6", "なまえを かえられない とき → つぎに ぜんぶ おくりなおす");
srv.fail = null; srv.calls.length = 0;
await O.sync();
ok(srv.calls.some((c) => c.method === "PUT" && JSON.parse(c.body).n === "6-6") && Object.keys(JSON.parse(srv.calls.find((c) => c.method === "PATCH").body)).length === Object.keys(st.best).length, "つながったら なまえと ぜんぶの きろく");
// とめる → おくらない
O.stop(); srv.calls.length = 0;
r = O.record("crepe", 999, { lv: 3 });
ok(!O.on() && r.best && !r.sent && await O.sync() === 0 && srv.calls.length === 0 && st.agreed > 0, "とめたら おくらない（同意は のこる）");
// けす: サーバーの データ → アカウント → てもと（アカウントは つくらない）
st.on = true; await O.sync(); srv.calls.length = 0;
await O.wipe();
const wp = JSON.parse(srv.calls.find((c) => c.method === "PATCH").body);
ok(wp[`players/${u2}`] === null && ids.every((b) => wp[`scores/${b}/${u2}`] === null) && wp[`rooms/${u2}`] === null && wp[`roomlist/${u2}`] === null && wp[`kujime/${u2}`] === null && Object.keys(wp).length === 4 + ids.length, "けす: なまえ・ぜんぶの ボード・おへや・くじの きろくに null " + Object.keys(wp).length);
ok(JSON.stringify(srv.calls.map((c) => c.method + " " + c.path)) === JSON.stringify(["GET /db/v1/photos.json", `GET /db/v1/kujime/${u2}.json`, "PATCH /db/v1.json", "POST /auth/accounts:delete"]) && !srv.users[u2], "けす じゅんばん（みせた ぷりくら・ひいた くじを さがす → データ → アカウント） " + srv.calls.map((c) => c.method + " " + c.path));
ok(!O.on() && st.agreed === 0 && st.ver === 0 && JSON.stringify(st.sent) === "{}" && st.sentUid === "" && !N.uid() && !R.localStorage.getItem(N.KEY) && st.best.crepe.s === 999, "けした あと（てもとの きろくは のこる・つぎは 同意から）");
// サーバーで もう きえて いる アカウント → つくらずに てもとだけ
reset(); st = O.st(); st.on = true; st.agreed = 1; st.ver = O.VER;
O.record("crepe", 50); await O.sync();
delete srv.users.u1; N.auth.exp = 0; srv.calls.length = 0;
await O.wipe();
ok(!srv.calls.some((c) => c.path === "/auth/accounts:signUp") && !N.uid() && st.agreed === 0, "きえた アカウントを けす ときは あたらしく つくらない " + JSON.stringify(srv.calls.map((c) => c.path)));
// ID が ない ときは なにも おくらない
reset(); srv.calls.length = 0; await O.wipe();
ok(srv.calls.length === 0, "ID が ない ときの けす は つうしん なし");
// つながらない ときは なげる（ゲームは とまらない）
reset(); st = O.st(); st.on = true; st.agreed = 1; st.ver = O.VER; srv.fail = () => true;
threw = false; try { O.record("crepe", 10); await O.sync(); } catch (e) { threw = e.status === 500 || e.status === 0; }
ok(threw && O.syncP === null && !st.sent.crepe, "つながらない ときの sync");
srv.fail = null;

// ---- 6. ready・place・listen・apply ----
const readyOf = (c) => { N.over = c; const v = N.ready(); N.over = null; return v; };
ok(readyOf({ apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "https://pokapoka-town-default-rtdb.asia-southeast1.firebasedatabase.app" }), "Firebase の つなぎさき（シンガポール）");
ok(readyOf({ apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "https://pokapoka-town-default-rtdb.firebaseio.com/" }), "Firebase の つなぎさき（アメリカ・うしろの /）");
for (const bad of [{ apiKey: "short", databaseURL: "https://a.firebaseio.com" }, { apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "https://evil.example.com" }, { apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "http://a.firebaseio.com" },
  { apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "https://a.firebaseio.com", authURL: "https://evil.example.com" }, { apiKey: "AIzaSyA-123456789012345678901234567890", databaseURL: "https://a.firebaseio.com.evil.com" }, {}])
  ok(!readyOf(bad), "つなげない つなぎさき " + JSON.stringify(bad));
N.over = { apiKey: "x".repeat(20), databaseURL: "https://p-default-rtdb.asia-southeast1.firebasedatabase.app" }; ok(N.place() === "シンガポール", "place シンガポール");
N.over = { apiKey: "x".repeat(20), databaseURL: "https://p-default-rtdb.europe-west1.firebasedatabase.app" }; ok(N.place() === "ベルギー", "place ベルギー");
N.over = { apiKey: "x".repeat(20), databaseURL: "https://p.firebaseio.com" }; ok(N.place() === "アメリカ", "place アメリカ");
N.over = null;
ok(N.stored() === null || !empty, "べつの つなぎさきの ログインは つかわない");
R.localStorage.setItem(N.KEY, JSON.stringify({ uid: "u9", refresh: "r", db: "https://other.firebaseio.com" })); N.auth = null; N.over = { ...conf };
ok(N.uid() === "", "ほかの データベースの ログインは つかわない");
R.localStorage.setItem(N.KEY, "{bad json"); ok(N.stored() === null, "こわれた ログインの きろく");
R.localStorage.removeItem(N.KEY);
// apply
let d = N.apply({}, { type: "put", path: "/", data: { a: { s: 1 } } });
d = N.apply(d, { type: "put", path: "/b", data: { s: 2 } });
d = N.apply(d, { type: "put", path: "/a", data: null });
d = N.apply(d, { type: "patch", path: "/", data: { c: { s: 3 }, b: null } });
d = N.apply(d, { type: "patch", path: "/c", data: { s: 4, "x/y": 5 } });
ok(JSON.stringify(d) === '{"c":{"s":4,"x":{"y":5}}}', "apply put・patch " + JSON.stringify(d));
d = N.apply(d, { type: "put", path: "/__proto__/polluted", data: 1 });
d = N.apply(d, { type: "patch", path: "/", data: { "__proto__/polluted": 1, "constructor/prototype/polluted": 1 } });
ok(({}).polluted === undefined && JSON.stringify(d) === '{"c":{"s":4,"x":{"y":5}}}', "apply: あぶない キーは つかわない");
ok(JSON.stringify(N.apply(d, { type: "put", path: "/", data: null })) === "{}" && JSON.stringify(N.apply(null, { type: "put", path: "/a/b", data: 1 })) === '{"a":{"b":1}}', "apply: から・null");
// listen（ストリーム）
reset(); await N.token();
class FakeES { constructor(url) { this.url = url; this.readyState = 0; this.l = {}; FakeES.all.push(this); } addEventListener(t, fn) { (this.l[t] = this.l[t] || []).push(fn); } emit(t, data) { for (const fn of this.l[t] || []) fn({ data: JSON.stringify(data) }); } close() { this.readyState = 2; this.closed = true; } }
FakeES.all = [];
N.ESFn = FakeES;
let evs = [];
let h = N.listen("v1/scores/crepe", (ev) => evs.push(ev));
await flush();
const es = FakeES.all[0];
ok(es && es.url === `${conf.databaseURL}/v1/scores/crepe.json?auth=${encodeURIComponent(N.auth.id)}`, "ストリームの URL " + (es && es.url));
es.emit("open"); es.emit("put", { path: "/", data: { u1: { s: 5 } } }); es.emit("patch", { path: "/", data: { u2: { s: 6 } } }); es.emit("put", { bad: 1 });
ok(JSON.stringify(evs) === JSON.stringify([{ type: "state", state: "live" }, { type: "put", path: "/", data: { u1: { s: 5 } } }, { type: "patch", path: "/", data: { u2: { s: 6 } } }]), "ストリームの できごと " + JSON.stringify(evs));
es.emit("cancel");
ok(es.closed && evs.at(-1).state === "denied", "cancel → よめない");
h.close();
// つながらない（2かい）→ よみなおし（ポーリング）
evs = []; FakeES.all = []; srv.db["v1/scores/cake"] = { u1: { s: 9 } };
h = N.listen("v1/scores/cake", (ev) => evs.push(ev));
await flush();
FakeES.all[0].readyState = 2; FakeES.all[0].onerror();
ok(evs.at(-1).state === "retry" && FakeES.all.length === 1, "1かいめは つなぎなおし");
h.close();
evs = []; FakeES.all = [];
h = N.listen("v1/scores/cake", (ev) => evs.push(ev));
await flush();
FakeES.all[0].onerror(); // CONNECTING の あいだは ブラウザに まかせる
ok(!evs.length, "CONNECTING の エラーは まつ");
h.close();
// EventSource が ない → よみなおし
N.ESFn = null; evs = [];
h = N.listen("v1/scores/cake", (ev) => evs.push(ev));
await flush(12);
ok(JSON.stringify(evs) === JSON.stringify([{ type: "state", state: "poll" }, { type: "put", path: "/", data: { u1: { s: 9 } } }]), "EventSource が ない ときは よみなおし " + JSON.stringify(evs));
h.close();
// きまりで よめない（401 が つづく）→ 1かい つなぎなおして だめなら denied（よみなおしも やめる）
evs = []; srv.denyRead = true; srv.calls.length = 0;
h = N.listen("v1/scores/cake", (ev) => evs.push(ev));
await flush(30);
ok(JSON.stringify(evs) === '[{"type":"state","state":"denied"}]' && JSON.stringify(srv.calls.map((c) => c.method + " " + c.path)) === JSON.stringify(["GET /db/v1/scores/cake.json", "POST /token/token", "GET /db/v1/scores/cake.json"]), "よめない ときは denied " + JSON.stringify([evs, srv.calls.map((c) => c.path)]));
h.close(); srv.denyRead = false;
// 2かい つながらない ストリーム → よみなおしに かえる
N.ESFn = FakeES; FakeES.all = []; evs = [];
h = N.listen("v1/scores/cake", (ev) => evs.push(ev));
await flush();
FakeES.all[0].readyState = 2; FakeES.all[0].onerror();
ok(evs.at(-1).state === "retry", "1かいめの しっぱい");
h.close(); // 2かいめ（tries 1）は つぎの open で → ここでは listen の なかの かずを たしかめる かわりに、とじた あと なにも おこらない ことを みる
await flush();
ok(FakeES.all.length === 1 && evs.at(-1).state === "retry", "とじた あとは つなぎなおさない");
N.ESFn = null; N.over = null; N.fetchFn = null; N.auth = null; N.pending = null;

// ---- 7. ルール ----
const rules = JSON.parse(read("firebase/database.rules.json"));
ok(rules.rules[".read"] === false && rules.rules[".write"] === false && JSON.stringify(Object.keys(rules.rules).sort()) === '[".read",".write","v1"]', "ルール: ほかの ばしょは よめない・かけない");
const v1 = rules.rules.v1, P = v1.players.$uid, SB = v1.scores.$board, SU = SB.$uid;
ok(JSON.stringify(Object.keys(v1).sort()) === '["kuji","kujime","photos","players","reportcount","reportlog","roomlist","rooms","scores"]' && Object.keys(v1.players).join() === "$uid" && Object.keys(v1.scores).join() === "$board", "ルール: v1 は players・scores・rooms・roomlist・photos・reportcount・reportlog・kuji・kujime だけ（rooms は tools/check-online-rooms.mjs・photos と ほうこくは tools/check-online-photos.mjs・kuji は tools/check-kuji-net.mjs）");
ok(P[".read"] === "auth != null" && P[".write"] === "auth != null && auth.uid === $uid" && SB[".read"] === "auth != null" && !(".write" in SB) && JSON.stringify(SB[".indexOn"]) === '["s"]', "ルール: よむのは ログインした 人・かくのは じぶんの ところ だけ");
ok(/^auth != null && auth\.uid === \$uid && /.test(SU[".write"]), "ルール: スコアは じぶんの ところ だけ");
ok(P.$other[".validate"] === false && SU.$other[".validate"] === false && /hasChildren\(\['n', 't'\]\)/.test(P[".validate"]) && /hasChildren\(\['s', 'n', 't'\]\)/.test(SU[".validate"]), "ルール: ほかの こうもくは かけない");
const reOf = (s) => new RegExp(/matches\(\/(.+?)\/\)/.exec(s)[1]);
const boardRe = reOf(SU[".write"]), boardLen = +/\$board\.length <= (\d+)/.exec(SU[".write"])[1];
for (const id of ids) ok(boardRe.test(id) && id.length <= boardLen, "ルールの ボードの かたち " + id);
for (const bad of ["Crepe", "crepe-1", "_crepe", "crepe_", "a b"]) ok(!boardRe.test(bad), "ルールが へんな ボードを とめる " + bad);
const nickRe = reOf(P.n[".validate"]), nickLen = +/length <= (\d+)/.exec(P.n[".validate"])[1];
ok(P.n[".validate"] === SU.n[".validate"] && P.t[".validate"] === SU.t[".validate"], "ルール: なまえ・じこくは おなじ");
for (let a = 0; a < 24; a++) for (let b = 0; b < 24; b++) { const c = O.nickCode([a, b]); ok(nickRe.test(c) && c.length <= nickLen, "ルールの なまえ " + c); }
ok(/<= now/.test(P.t[".validate"]) && /isNumber\(\)/.test(P.t[".validate"]), "ルール: じこくは サーバーの いま");
ok(new RegExp(`<= ${O.MAX}$`).test(SU.s[".validate"]) && />= 0/.test(SU.s[".validate"]), "ルール: スコアの はんい");
const modeRe = reOf(SU.m[".validate"]);
ok(Object.keys(GameEconomy.modes).every((m) => modeRe.test(m)) && !modeRe.test("easyx") && /<= 99/.test(SU.l[".validate"]) && />= 1/.test(SU.l[".validate"]), "ルール: あそびかた・Lv");
const fakeSrc = read("tests/online-fake.mjs");
ok(fakeSrc.includes(`BOARD_RE = /${boardRe.source}/`) && fakeSrc.includes(`NICK_RE = /${nickRe.source}/`) && fakeSrc.includes(`keys[2].length <= ${boardLen}`) && fakeSrc.includes(`v.length <= ${nickLen}`) && fakeSrc.includes(`v.s > ${O.MAX}`), "にせの サーバーの きまりも ルールと おなじ");
ok(!/\/\//.test(read("firebase/database.rules.json").replace(/https?:\/\//g, "")), "ルールの JSON に コメントを かかない（コンソールに そのまま はる）");

// ---- 8. ことば ----
const src = read("js/online.js");
for (const t of ["18さい いじょう", "おくる もの", "おくらない もの", "ほんとうの なまえ・メール・いばしょ・カメラの しゃしん", "18さい いじょうです。<br>どういして はじめる", "やめる", "みせた データを けす", "オンラインを とめる"]) ok(src.includes(t), "オンラインの ことば: " + t);
const app = Smaho.APPS.find((a) => a.id === "online");
ok(app && app.name === "みんな" && Smaho.ICON.online && Smaho.APPS.at(-1) === app && /^#[0-9A-F]{6}$/i.test(app.color), "すまほの「みんな」アプリ（いちばん うしろ）");
for (const t of Object.values(O.STATE_TEXT)) ok(!KANJI.test(t) && t.length <= 30, "つながりの ことば: " + t);
const texts = [...src.matchAll(/text: "([^"]+)"/g)].map((m) => m[1]);
for (const t of texts) ok(!KANJI.test(t.replace(/18さい/g, "")), "オンラインの ことばは ひらがな中心: " + t);

console.log(`✓ オンライン（E5・UI-94）: ${n} 項目`);
