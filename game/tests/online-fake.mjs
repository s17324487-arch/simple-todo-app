// オンライン（E5・UI-94）の テスト用の にせの Firebase。ネットに つながらない CI でも ゲームの つうしん（js/online-net.js）を そのまま ためす。
// - 匿名ログイン（Identity Toolkit・Secure Token の REST と おなじ かたち）: POST /auth/accounts:signUp・POST /auth/accounts:delete・POST /token/token
// - Realtime Database の REST: /db/<path>.json?auth=<ID トークン> の GET（Accept: text/event-stream なら SSE の ストリーム: put・patch）・
//   PUT・PATCH（{ "a/b": 1, "c": null } の いくつもの ばしょ）・DELETE・print=silent（204）・{ ".sv": "timestamp" }
// - きまりは game/firebase/database.rules.json と おなじ ことを JS で する（tools/check-online.mjs が ルールの もじと くらべる）
// - テストからは もどりの オブジェクトで しらべる・かえる: data（ぜんぶ）・users・log（とどいた リクエスト）・write（ほかの 人の かきこみ）・reset・close
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

export const ONLINE_FAKE_KEY = "test-fake-api-key-0001";
const BOARD_RE = /^[a-z]+(_[a-z]+)*$/, NICK_RE = /^[0-9]+-[0-9]+$/, MODES = ["easy", "normal", "hard"];

export async function startOnlineFake({ key = ONLINE_FAKE_KEY } = {}) {
  let root = {};
  const users = new Map(), tokens = new Map(), streams = new Set(), log = [];
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
  const canRead = (keys, uid) => !!uid && keys[0] === "v1" && ((keys[1] === "players" && keys.length >= 3) || (keys[1] === "scores" && keys.length >= 3));
  // かきこむ ばしょの .write（v1/players/$uid か v1/scores/$board/$uid と その した だけ）
  const canWrite = (keys, uid) => {
    if (!uid || keys[0] !== "v1") return false;
    if (keys[1] === "players") return keys.length >= 3 && keys[2] === uid;
    if (keys[1] === "scores") return keys.length >= 4 && keys[3] === uid && keys[2].length <= 40 && BOARD_RE.test(keys[2]);
    return false;
  };
  const nickOk = (v) => typeof v === "string" && v.length <= 5 && NICK_RE.test(v);
  const timeOk = (v, now) => typeof v === "number" && v <= now && v > now - 300000;
  const validNode = (kind, v, now) => {
    if (v === null || v === undefined) return true; // けす ときは .validate を みない
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    const allow = kind === "player" ? ["n", "t"] : ["s", "n", "t", "l", "m"];
    if (Object.keys(v).some((k) => !allow.includes(k))) return false;
    if (!nickOk(v.n) || !timeOk(v.t, now)) return false;
    if (kind === "player") return true;
    if (typeof v.s !== "number" || v.s < 0 || v.s > 10000000) return false;
    if ("l" in v && (typeof v.l !== "number" || v.l < 1 || v.l > 99)) return false;
    if ("m" in v && !MODES.includes(v.m)) return false;
    return true;
  };
  // writes: [[keys, value]]。ぜんぶ とおれば あたらしい root、だめなら null
  const apply = (writes, uid, now) => {
    if (!writes.every(([k]) => canWrite(k, uid))) return null;
    let next = clone(root);
    for (const [k, v] of writes) next = setIn(next, k, sv(v, now));
    const touched = new Set(writes.map(([k]) => k.slice(0, k[1] === "players" ? 3 : 4).join("/")));
    for (const p of touched) {
      const k = split(p), v = (() => { let c = next; for (const x of k) { if (!c || typeof c !== "object") return null; c = c[x]; } return c ?? null; })();
      if (!validNode(k[1] === "players" ? "player" : "score", v, now)) return null;
    }
    return next;
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
    const keys = split(path.slice(4, -5)), uid = uidOf(u.searchParams.get("auth")), now = Date.now(), silent = u.searchParams.get("print") === "silent";
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
      return json(res, 200, getAt(keys));
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
    const next = apply(writes, uid, now);
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
    // つぎの ID トークンを きれた ことに する（リフレッシュの ためし）
    expireTokens() { for (const t of tokens.values()) t.exp = 0; },
    reset() { root = {}; users.clear(); tokens.clear(); log.length = 0; for (const s of streams) { try { s.res.end(); } catch (e) { /* */ } } streams.clear(); },
    close() { for (const s of streams) { try { s.res.end(); } catch (e) { /* */ } } streams.clear(); server.closeAllConnections?.(); return new Promise((ok) => server.close(() => ok())); },
  };
}
