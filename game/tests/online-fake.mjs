// オンライン（E5・UI-94）の テスト用の にせの Firebase。ネットに つながらない CI でも ゲームの つうしん（js/online-net.js）を そのまま ためす。
// - 匿名ログイン（Identity Toolkit・Secure Token の REST と おなじ かたち）: POST /auth/accounts:signUp・POST /auth/accounts:delete・POST /token/token
// - Realtime Database の REST: /db/<path>.json?auth=<ID トークン> の GET（Accept: text/event-stream なら SSE の ストリーム: put・patch）・
//   PUT・PATCH（{ "a/b": 1, "c": null } の いくつもの ばしょ）・DELETE・print=silent（204）・{ ".sv": "timestamp" }
// - きまりは game/firebase/database.rules.json と おなじ ことを JS で する（tools/check-online.mjs・check-online-rooms.mjs・check-online-photos.mjs が ルールの もじと くらべる）
// - テストからは もどりの オブジェクトで しらべる・かえる: data（ぜんぶ）・users・log（とどいた リクエスト）・write（ほかの 人の かきこみ）・kujiT（つぎの いちばんくじの じこく）・reset・close
// - いちばんくじ（UI-100）の きまりは kujiOk（tools/rules-emulator.mjs で 本物の エミュレーターと くらべる）
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

export const ONLINE_FAKE_KEY = "test-fake-api-key-0001";
const BOARD_RE = /^[a-z]+(_[a-z]+)*$/, NICK_RE = /^[0-9]+-[0-9]+$/, ID_RE = /^[a-z0-9_]+$/, MODES = ["easy", "normal", "hard"];

export async function startOnlineFake({ key = ONLINE_FAKE_KEY } = {}) {
  let root = {};
  const users = new Map(), tokens = new Map(), streams = new Set(), log = [];
  const kujiTimes = []; // つぎに ひかれる いちばんくじの サーバーの じこく（kujiT。テストで 賞を きめる）
  const id = (n) => randomBytes(n).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, n) || "x" + Date.now();
  const split = (p) => String(p || "").split("/").filter(Boolean);
  const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
  const getAt = (keys) => { let c = root; for (const k of keys) { if (!c || typeof c !== "object" || !(k in c)) return null; c = c[k]; } return c === undefined ? null : c; };
  const prune = (o) => { if (!o || typeof o !== "object") return o; for (const k of Object.keys(o)) { o[k] = prune(o[k]); if (o[k] === null || (typeof o[k] === "object" && !Object.keys(o[k]).length)) delete o[k]; } return o; };
  const setIn = (tree, keys, v) => {
    if (!keys.length) return v && typeof v === "object" ? prune(clone(v)) : v ?? {};
    const top = tree && typeof tree === "object" ? tree : {};
    let c = top;
    for (const k of keys.slice(0, -1)) { if (!c[k] || typeof c[k] !== "object") c[k] = {}; c = c[k]; }
    const last = keys[keys.length - 1];
    if (v === null || v === undefined) delete c[last]; else c[last] = v && typeof v === "object" ? prune(clone(v)) : v;
    return prune(top);
  };
  // { ".sv": "timestamp" } → いまの じこく
  const sv = (v, now) => {
    if (v && typeof v === "object") {
      if (v[".sv"] === "timestamp" && Object.keys(v).length === 1) return now;
      const o = Array.isArray(v) ? [] : {};
      for (const [k, x] of Object.entries(v)) o[k] = sv(x, now);
      return o;
    }
    return v;
  };

  // ---- きまり（database.rules.json と おなじ）----
  const uidOf = (tok) => { const t = tokens.get(tok); return t && t.exp > Date.now() && users.has(t.uid) ? t.uid : null; };
  // ノードの しゅるい: depth は 1つの ノードの ふかさ（v1/players/$uid → 3）・uidAt は $uid の ばしょ・read は よめる いちばん うえの ふかさ
  // ぷりくら（PR3）: photos/$key は $key が「じぶんの uid ＋ _ ＋ しゃしんの ばんごう（ランダム）」・reportcount/$key と reportlog/$key/$rid は かきこみの まえと あとを くらべる（cross）・reportlog は だれも よめない
  const photoOwn = (key, uid) => key.startsWith(uid + "_") && /^[a-z0-9-]+$/.test(key.split(uid + "_").join("")) && key.length <= 180;
  // いちばんくじ（UI-100）: kuji/$store は だれでも よめる・かく ことは kujiOk で（まえと あとを くらべる）・kujime/$uid は じぶんだけ よめる／かける
  const KINDS = {
    players: { depth: 3, uidAt: 2, read: 3 },
    scores: { depth: 4, uidAt: 3, read: 3, ok: (keys) => keys[2].length <= 40 && BOARD_RE.test(keys[2]) },
    roomlist: { depth: 3, uidAt: 2, read: 2 },
    rooms: { depth: 3, uidAt: 2, read: 3 },
    photos: { depth: 3, read: 2, own: (keys, uid) => photoOwn(keys[2], uid) },
    reportcount: { depth: 3, read: 2, exact: true, own: () => true },
    reportlog: { depth: 4, read: Infinity, exact: true, own: (keys, uid) => keys[3] === uid },
    kuji: { depth: 3, read: 3, own: () => true },
    kujime: { depth: 3, uidAt: 2, read: 3, readOwn: true },
  };
  const kindOf = (keys) => (keys[0] === "v1" && Object.prototype.hasOwnProperty.call(KINDS, keys[1]) ? keys[1] : null);
  const canRead = (keys, uid) => { const k = kindOf(keys); return !!uid && !!k && keys.length >= KINDS[k].read && (!KINDS[k].readOwn || keys[KINDS[k].uidAt] === uid); };
  // かきこむ ばしょの .write（じぶんの $uid の ノードと その した だけ。exact は その ノード ちょうどだけ）
  const canWrite = (keys, uid) => {
    const k = kindOf(keys), K = k && KINDS[k];
    if (!uid || !K || keys.length < K.depth || (K.exact && keys.length !== K.depth)) return false;
    if (K.own) return K.own(keys, uid);
    return keys[K.uidAt] === uid && (!K.ok || K.ok(keys));
  };
  const nickOk = (v) => typeof v === "string" && v.length <= 5 && NICK_RE.test(v);
  const timeOk = (v, now) => typeof v === "number" && v <= now && v > now - 300000;
  const id40 = (v) => typeof v === "string" && v.length <= 40 && ID_RE.test(v);
  const roomKind = (v) => typeof v === "string" && v.length <= 12 && /^[a-z]+$/.test(v);
  const num = (v, lo, hi) => typeof v === "number" && v >= lo && v <= hi;
  const only = (v, allow, need) => !!v && typeof v === "object" && Object.keys(v).every((k) => allow.includes(k)) && need.every((k) => k in v);
  const itemOk = (o) => only(o, ["a", "x", "y", "r", "s", "g"], ["a", "x", "y"]) && id40(o.a) && num(o.x, -100, 1000) && num(o.y, -100, 1000) &&
    (!("r" in o) || typeof o.r === "boolean") && (!("s" in o) || o.s === "l") && (!("g" in o) || (typeof o.g === "string" && o.g.length <= 600 && /^[a-z0-9_,]*$/.test(o.g)));
  const str = (v, n, re) => typeof v === "string" && v.length <= n && re.test(v);
  const PHOTO_FIELDS = { b: [16, /^[a-z]+$/], k: [12, /^[a-z]+$/], r: [40, /^[a-z]+,[a-z]+,[a-z]+$/], c: [90, /^[a-z]+[.][a-z]+,[a-z]+[.][a-z]+,[a-z]+[.][a-z]+$/],
    o: [900, /^[a-z0-9_=;:|]*$/], m: [40, /^[0-9.,-]+$/], p: [6200, /^[A-Za-z0-9_,-]*$/], s: [800, /^[a-z0-9.,-]*$/], x: [140, /^[0-9.,-]*$/], e: [80, /^[a-z,]*$/] };
  const validNode = (kind, v, now) => {
    if (v === null || v === undefined) return true; // けす ときは .validate を みない
    if (kind === "reportcount" || kind === "reportlog" || kind === "kuji" || kind === "kujime") return true; // .write で しらべる（cross・kujiOk）
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    if (kind === "photos") {
      if (!only(v, ["n", "t", ...Object.keys(PHOTO_FIELDS), "z"], ["n", "t", "b", "k", "z", "r", "c", "o"]) || !nickOk(v.n) || !timeOk(v.t, now) || !(v.z === 0 || v.z === 1)) return false;
      return Object.entries(PHOTO_FIELDS).every(([k, [n, re]]) => !(k in v) || str(v[k], n, re));
    }
    if (kind === "players") return only(v, ["n", "t"], ["n", "t"]) && nickOk(v.n) && timeOk(v.t, now);
    if (kind === "scores") {
      if (!only(v, ["s", "n", "t", "l", "m"], ["s", "n", "t"]) || !nickOk(v.n) || !timeOk(v.t, now)) return false;
      if (typeof v.s !== "number" || v.s < 0 || v.s > 10000000) return false;
      if ("l" in v && (typeof v.l !== "number" || v.l < 1 || v.l > 99)) return false;
      if ("m" in v && !MODES.includes(v.m)) return false;
      return true;
    }
    if (kind === "roomlist") return only(v, ["n", "t", "c", "k"], ["n", "t", "c", "k"]) && nickOk(v.n) && timeOk(v.t, now) && num(v.c, 0, 100) && roomKind(v.k);
    if (kind === "rooms") {
      if (!only(v, ["n", "t", "k", "w", "f", "z", "i"], ["n", "t", "k", "w", "f", "z"]) || !nickOk(v.n) || !timeOk(v.t, now) || !roomKind(v.k) || !id40(v.w) || !id40(v.f) || !["s", "e"].includes(v.z)) return false;
      if (!("i" in v)) return true;
      return !!v.i && typeof v.i === "object" && Object.entries(v.i).every(([k, o]) => /^[0-9][0-9]?$/.test(k) && itemOk(o));
    }
    return false;
  };
  // writes: [[keys, value]]。ぜんぶ とおれば あたらしい root、だめなら null
  const atIn = (tree, k) => { let c = tree; for (const x of k) { if (!c || typeof c !== "object") return null; c = c[x]; } return c ?? null; };
  // ほうこくの かずと きろく（database.rules.json の reportcount・reportlog の .write と おなじ）: old は まえ・next は あと
  const cross = (keys, uid, old, next) => {
    const kind = kindOf(keys), key = keys[2];
    if (kind === "reportcount") {
      const was = atIn(old, keys), now = atIn(next, keys), logWas = atIn(old, ["v1", "reportlog", key, uid]) !== null, logNow = atIn(next, ["v1", "reportlog", key, uid]) !== null;
      if (typeof now !== "number") return false;
      return (now === (was === null ? 0 : was) + 1 && !logWas && logNow) || (was !== null && now === was - 1 && logWas && !logNow);
    }
    if (kind === "reportlog") {
      const was = atIn(old, keys), now = atIn(next, keys), cWas = atIn(old, ["v1", "reportcount", key]), cNow = atIn(next, ["v1", "reportcount", key]);
      if (was === null) return typeof now === "string" && /^(bad|spam)$/.test(now) && !key.startsWith(uid + "_") && atIn(old, ["v1", "photos", key]) !== null && cNow === (cWas === null ? 0 : cWas) + 1;
      return now === null && typeof cWas === "number" && cNow === cWas - 1;
    }
    return true;
  };
  // いちばんくじ（database.rules.json の kuji・kujime と おなじ）。ひとつの かきこみの ばしょごとに .write（そこまでの どれかが とおせば よい）と、かいた ところの .validate
  const KUJI_STORE = /^(lawson|sevenbun)$/, KUJI_ME = /^(lawson|sevenbun)_l[0-9]{1,6}$/, KUJI_MAX = 80;
  const kHas = (v) => v !== null && v !== undefined, kNum = (v) => typeof v === "number";
  const kujiWrite = (k, uid, old, next, now) => {
    const S = k[2], at = (t, ...p) => atIn(t, ["v1", "kuji", S, ...p]);
    if (k.length === 4 && k[3] === "cur") { const c = at(old, "cur"), nv = at(next, "cur"), base = kHas(c) ? c : 1; return kNum(nv) && nv === base + 1 && at(old, "lots", "l" + base, "n") === KUJI_MAX; }
    if (k.length < 6 || k[3] !== "lots") return false;
    const lot = k[4], n0 = at(old, "lots", lot, "n"), n1 = at(next, "lots", lot, "n"), base = kHas(n0) ? n0 : 0;
    if (k.length === 6 && k[5] === "n") { const c = at(old, "cur"); return lot === "l" + (kHas(c) ? c : 1) && kNum(n1) && n1 === base + 1 && n1 <= KUJI_MAX && !kHas(at(old, "lots", lot, "d", "k" + (n1 - 1))) && at(next, "lots", lot, "d", "k" + (n1 - 1), "u") === uid; }
    if (k.length === 6 && k[5] === "pc") { const p0 = at(old, "lots", lot, "pc"), p1 = at(next, "lots", lot, "pc"); return kHas(n0) && kNum(p1) && p1 === (kHas(p0) ? p0 : 0) + 1; }
    if (k.length < 7 || k[5] !== "d") return false;
    const kk = k[6], was = at(old, "lots", lot, "d", kk), rec = at(next, "lots", lot, "d", kk);
    // くじの .write（あたらしい くじ: n を 1 ふやして その ばんごう・じぶん・サーバーの いま・しゅるいは まだ）
    if (!kHas(was) && kk === "k" + base && n1 === base + 1 && rec && rec.u === uid && rec.t === now && !("p" in rec) && !("o" in rec)) return true;
    if (k.length < 8) return false;
    const f = k[7];
    if (f === "u") return !!was && was.u === uid && rec && rec.u === "";
    if (f === "p" || f === "o") return !!was && !kHas(was[f]) && was.u === uid;
    return false;
  };
  const kujiValid = (k, old, next) => {
    const S = k[2], at = (t, ...p) => atIn(t, ["v1", "kuji", S, ...p]), v = atIn(next, k);
    if (!kHas(v)) return true; // けす ときは .validate を みない
    if (!KUJI_STORE.test(S)) return false;
    if (k.length === 3) return false; // おみせ ごと かく（.write が ない ので とおらない）
    if (k[3] !== "cur" && k[3] !== "lots") return false;
    if (k[3] === "cur") return kNum(v);
    if (k.length < 6) return false;
    if (!["n", "pc", "d"].includes(k[5])) return false;
    if (k[5] !== "d") return kNum(v);
    if (k.length < 7) return false;
    const lot = k[4], rec = at(next, "lots", lot, "d", k[6]);
    if (!rec || typeof rec !== "object" || !("u" in rec) || !("t" in rec)) return false;
    const field = (f, x) => {
      if (f === "u") return typeof x === "string" && x.length <= 128;
      if (f === "t") return kNum(x);
      if (f === "p") return kNum(x) && [0, 1, 2].includes(x) && kHas(rec.o);
      if (f === "o") { const p0 = at(old, "lots", lot, "pc"); return kNum(x) && x === (kHas(p0) ? p0 : 0) && at(next, "lots", lot, "pc") === x + 1 && kHas(rec.p); }
      return false;
    };
    if (k.length === 7) return Object.entries(rec).every(([f, x]) => field(f, x));
    return field(k[7], rec[k[7]]);
  };
  const kujiOk = (writes, uid, old, next, now) => writes.every(([k]) => {
    if (kindOf(k) === "kujime") {
      if (k.length < 3 || k[2] !== uid) return false;
      const v = atIn(next, k);
      if (!kHas(v)) return true;
      if (k.length === 3) return typeof v === "object" && Object.entries(v).every(([key, x]) => x === true && KUJI_ME.test(key));
      return k.length === 4 && v === true && KUJI_ME.test(k[3]);
    }
    if (kindOf(k) !== "kuji") return true;
    return k.length >= 3 && kujiWrite(k, uid, old, next, now) && kujiValid(k, old, next);
  });
  const apply = (writes, uid, now) => {
    if (!writes.every(([k]) => canWrite(k, uid))) return null;
    let next = clone(root);
    for (const [k, v] of writes) next = setIn(next, k, sv(v, now));
    if (!writes.every(([k]) => cross(k, uid, root, next))) return null;
    if (!kujiOk(writes, uid, root, next, now)) return null;
    const touched = new Set(writes.map(([k]) => k.slice(0, KINDS[kindOf(k)].depth).join("/")));
    for (const p of touched) {
      const k = split(p), v = atIn(next, k);
      if (!validNode(kindOf(k), v, now)) return null;
    }
    return next;
  };
  // GET の orderBy="子の なまえ"・limitToLast（.indexOn の ある ばしょ だけ）
  // orderBy="$key" は キーの じゅん（startAt・endAt で しぼる。インデックスは いらない）
  const query = (data, q) => {
    const by = q.get("orderBy"), last = Number(q.get("limitToLast"));
    if (!by) return data;
    const key = JSON.parse(by);
    let rows = Object.entries(data && typeof data === "object" ? data : {});
    if (key === "$key") {
      const a = q.has("startAt") ? JSON.parse(q.get("startAt")) : null, b = q.has("endAt") ? JSON.parse(q.get("endAt")) : null;
      rows = rows.filter(([k]) => (a === null || k >= a) && (b === null || k <= b)).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
    } else rows.sort((a, b) => ((a[1] && a[1][key]) || 0) - ((b[1] && b[1][key]) || 0));
    if (Number.isInteger(last) && last > 0) rows = rows.slice(-last);
    return rows.length ? Object.fromEntries(rows) : null;
  };

  // ---- ストリーム（SSE）----
  const send = (s, event, data) => { try { s.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) { /* きれた */ } };
  const notify = (writes) => {
    for (const s of streams) {
      const under = {}; let whole = false;
      for (const [k] of writes) {
        if (k.length >= s.keys.length && s.keys.every((x, i) => x === k[i])) under[k.slice(s.keys.length).join("/")] = getAt(k);
        else if (k.every((x, i) => x === s.keys[i])) whole = true;
      }
      if (whole) send(s, "put", { path: "/", data: getAt(s.keys) });
      else if (Object.keys(under).length === 1 && writes.length === 1) { const [p, v] = Object.entries(under)[0]; send(s, "put", { path: "/" + p, data: v }); }
      else if (Object.keys(under).length) send(s, "patch", { path: "/", data: under });
    }
  };
  const commit = (next, writes) => { root = next || {}; notify(writes); };

  // ---- HTTP ----
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, PATCH, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" };
  const json = (res, code, body) => { res.writeHead(code, { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" }); res.end(code === 204 ? undefined : JSON.stringify(body)); };
  const readBody = (req) => new Promise((ok) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); });
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, "http://127.0.0.1"), path = decodeURIComponent(u.pathname);
    if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }
    const raw = await readBody(req);
    log.push({ method: req.method, path, at: Date.now() });
    // 匿名ログイン
    if (path.startsWith("/auth/") || path.startsWith("/token/")) {
      if (req.method !== "POST") return json(res, 405, { error: { message: "METHOD" } });
      if (u.searchParams.get("key") !== key) return json(res, 400, { error: { message: "API_KEY_INVALID" } });
      const exp = 3600;
      if (path === "/auth/accounts:signUp") {
        const uid = id(28), refresh = id(40), tok = id(48);
        users.set(uid, { refresh, created: Date.now() }); tokens.set(tok, { uid, exp: Date.now() + exp * 1000 });
        return json(res, 200, { kind: "identitytoolkit#SignupNewUserResponse", idToken: tok, refreshToken: refresh, expiresIn: String(exp), localId: uid });
      }
      if (path === "/token/token") {
        const p = new URLSearchParams(raw), r = p.get("refresh_token"), uid = [...users].find(([, x]) => x.refresh === r)?.[0];
        if (p.get("grant_type") !== "refresh_token" || !uid) return json(res, 400, { error: { message: "INVALID_REFRESH_TOKEN" } });
        const tok = id(48); tokens.set(tok, { uid, exp: Date.now() + exp * 1000 });
        return json(res, 200, { access_token: tok, expires_in: String(exp), token_type: "Bearer", refresh_token: r, id_token: tok, user_id: uid, project_id: "fake" });
      }
      if (path === "/auth/accounts:delete") {
        let b = {}; try { b = JSON.parse(raw || "{}"); } catch (e) { /* */ }
        const uid = uidOf(b.idToken);
        if (!uid) return json(res, 400, { error: { message: "INVALID_ID_TOKEN" } });
        users.delete(uid); for (const [t, x] of tokens) if (x.uid === uid) tokens.delete(t);
        return json(res, 200, { kind: "identitytoolkit#DeleteAccountResponse" });
      }
      return json(res, 404, { error: { message: "NOT_FOUND" } });
    }
    // データベース
    if (!path.startsWith("/db/") || !path.endsWith(".json")) return json(res, 404, { error: "Not found" });
    const keys = split(path.slice(4, -5)), uid = uidOf(u.searchParams.get("auth")), silent = u.searchParams.get("print") === "silent";
    let now = Date.now();
    if (keys.some((k) => /[.#$\[\]]/.test(k))) return json(res, 400, { error: "Invalid path" });
    if (req.method === "GET") {
      if (!canRead(keys, uid)) return json(res, 401, { error: "Permission denied" });
      if (/text\/event-stream/.test(req.headers.accept || "")) {
        res.writeHead(200, { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        const s = { keys, uid, res };
        streams.add(s);
        res.on("close", () => streams.delete(s)); // つながりが きれた（req の close は からだを よみおわると すぐ くる）
        send(s, "put", { path: "/", data: getAt(keys) });
        return;
      }
      return json(res, 200, query(getAt(keys), u.searchParams));
    }
    let body = null;
    if (req.method !== "DELETE") { try { body = JSON.parse(raw || "null"); } catch (e) { return json(res, 400, { error: "Invalid data; couldn't parse JSON object." }); } }
    let writes;
    if (req.method === "PUT") writes = [[keys, body]];
    else if (req.method === "DELETE") writes = [[keys, null]];
    else if (req.method === "PATCH") {
      if (!body || typeof body !== "object" || Array.isArray(body)) return json(res, 400, { error: "Invalid data" });
      writes = Object.entries(body).map(([k, v]) => [[...keys, ...split(k)], v]);
    } else return json(res, 405, { error: "Method not allowed" });
    const kt = kujiTimes.length && writes.some(([k]) => k[1] === "kuji" && k[5] === "d" && k.length === 7); // いちばんくじを ひく かきこみ（とおった ときだけ つかう）
    if (kt) now = kujiTimes[0];
    const next = apply(writes, uid, now);
    if (next && kt) kujiTimes.shift();
    if (!next) return json(res, 401, { error: "Permission denied" });
    commit(next, writes);
    return silent ? json(res, 204) : json(res, 200, req.method === "PATCH" ? body : getAt(keys));
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    conf: { apiKey: key, databaseURL: `${base}/db`, authURL: `${base}/auth`, tokenURL: `${base}/token` },
    get data() { return clone(root); },
    get users() { return [...users.keys()]; },
    get streams() { return streams.size; },
    log,
    at(path) { return clone(getAt(split(path))); },
    // ほかの 人の かきこみ（きまりを とおさない）
    write(path, value) { const k = split(path), w = [[k, value]]; root = setIn(clone(root), k, sv(value, Date.now())); notify(w); },
    // つぎに ひかれる いちばんくじの サーバーの じこく（なんこでも。ひく かきこみ 1かいに 1つ）
    kujiT(...ts) { kujiTimes.push(...ts); return kujiTimes.length; },
    // つぎの ID トークンを きれた ことに する（リフレッシュの ためし）
    expireTokens() { for (const t of tokens.values()) t.exp = 0; },
    reset() { root = {}; users.clear(); tokens.clear(); log.length = 0; kujiTimes.length = 0; for (const s of streams) { try { s.res.end(); } catch (e) { /* */ } } streams.clear(); },
    close() { for (const s of streams) { try { s.res.end(); } catch (e) { /* */ } } streams.clear(); server.closeAllConnections?.(); return new Promise((ok) => server.close(() => ok())); },
  };
}
