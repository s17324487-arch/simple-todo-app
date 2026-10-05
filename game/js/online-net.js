// オンラインの つうしん（E5・UI-94）: Firebase の 匿名ログイン（Identity Toolkit・Secure Token の REST）と Realtime Database（REST と SSE の ストリーム）を、
// ゲームの ふつうの JavaScript から fetch・EventSource で よぶ（SDK・CDN・ES modules は つかわない）。
// - Online（js/online.js）が、18さい いじょうの 同意を おして オンに した ときだけ よぶ。ほかの ばしょからは よばない。
// - ログインの きろく（uid・リフレッシュ トークン・つなぎさき）は セーブとは べつの localStorage（KEY）。セーブの かきだしには はいらない。
// - ストリーム（SSE）が つかえない とき（EventSource が ない・はじめから 2かい つながらない）は POLL_MS ごとに よみなおす。
// - テストは にせの サーバー（tests/online-fake.mjs）へ つなぐ（PokaDebug.onlineServer → over）。tools/check-online.mjs は fetchFn・ESFn を いれかえる。
const OnlineNet = {
  KEY: "pokapoka-town-online-v1",
  AUTH: "https://identitytoolkit.googleapis.com/v1",
  TOKEN: "https://securetoken.googleapis.com/v1",
  POLL_MS: 8000,
  TIMEOUT_MS: 12000,
  over: null,
  fetchFn: null,
  ESFn: null,
  auth: null,
  pending: null,

  // つなぎさき（key・db・auth・token）。over（テスト）が あれば そちら
  conf() {
    const c = this.over || (typeof ONLINE_CONFIG !== "undefined" ? ONLINE_CONFIG : {});
    const trim = (s) => String(s || "").trim().replace(/\/+$/, "");
    return { key: String(c.apiKey || "").trim(), db: trim(c.databaseURL), auth: trim(c.authURL) || this.AUTH, token: trim(c.tokenURL) || this.TOKEN };
  },
  // 設定が そろって いるか（本番は https の Firebase の データベース だけ・テストは 127.0.0.1 の にせの サーバーも）
  ready() {
    const c = this.conf();
    const fire = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)?\.(firebaseio\.com|firebasedatabase\.app)$/;
    const local = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}(\/[\w-]+)*$/;
    if (!/^[\w-]{10,80}$/.test(c.key)) return false;
    if (fire.test(c.db)) return c.auth === this.AUTH && c.token === this.TOKEN || (!!this.over && local.test(c.auth) && local.test(c.token));
    return !!this.over && local.test(c.db) && local.test(c.auth) && local.test(c.token);
  },
  // データの おきば（データベースの URL から）
  place() {
    const db = this.conf().db, m = db.match(/\.([a-z]+-[a-z]+\d)\.firebasedatabase\.app$/);
    const R = { "asia-southeast1": "シンガポール", "asia-northeast1": "とうきょう", "europe-west1": "ベルギー", "us-central1": "アメリカ" };
    if (m) return R[m[1]] || m[1];
    return /\.firebaseio\.com$/.test(db) ? "アメリカ" : "テストの サーバー";
  },

  // ---- ログイン（匿名）----
  stored() {
    try {
      const a = JSON.parse(localStorage.getItem(this.KEY) || "null");
      return a && typeof a.uid === "string" && /^[\w-]{1,128}$/.test(a.uid) && typeof a.refresh === "string" && a.refresh && a.db === this.conf().db ? { uid: a.uid, refresh: a.refresh, db: a.db, id: "", exp: 0 } : null;
    } catch (e) { return null; }
  },
  keep(a) {
    this.auth = a;
    try { if (a) localStorage.setItem(this.KEY, JSON.stringify({ uid: a.uid, refresh: a.refresh, db: a.db })); else localStorage.removeItem(this.KEY); } catch (e) { /* プライベートモードなど */ }
    return a;
  },
  current() { const a = this.auth && this.auth.db === this.conf().db ? this.auth : this.stored(); if (a && a !== this.auth) this.auth = a; return a; },
  uid() { const a = this.current(); return a ? a.uid : ""; },
  hasAccount() { return !!this.uid(); },
  forget() { this.keep(null); },
  err(status, code) { const e = new Error("online " + status + " " + code); e.status = status; e.code = String(code || ""); return e; },
  async http(url, opt = {}) {
    const F = this.fetchFn || (typeof fetch === "function" ? fetch : null);
    if (!F) throw this.err(0, "nofetch");
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), this.TIMEOUT_MS) : 0;
    let res;
    try { res = await F(url, { cache: "no-store", ...opt, ...(ac ? { signal: ac.signal } : {}) }); }
    catch (e) { throw this.err(0, "network"); }
    finally { clearTimeout(timer); }
    let body = null;
    try { if (res.status !== 204) body = await res.json(); } catch (e) { body = null; }
    if (!res.ok) throw this.err(res.status, (body && body.error && (body.error.message || body.error)) || "http");
    return body;
  },
  // いま つかえる ID トークン（2ふん いじょう のこって いれば それ・なければ リフレッシュ・アカウントが なければ つくる）。
  // create: false なら つくらない（けす とき。アカウントが なければ code "noaccount"）
  token(force = false, create = true) {
    if (this.pending) return this.pending;
    this.pending = (async () => {
      let a = this.current();
      if (a && a.id && !force && a.exp - Date.now() > 120000) return a.id;
      if (a) {
        try { a = await this.refresh(a); }
        catch (e) { if (e.status >= 400 && e.status < 500) { a = null; if (!create) this.forget(); } else throw e; } // きえた・とめられた アカウント → あたらしく つくる
      }
      if (!a) { if (!create) throw this.err(401, "noaccount"); a = await this.signUp(); }
      return a.id;
    })();
    const p = this.pending;
    p.then(() => { if (this.pending === p) this.pending = null; }, () => { if (this.pending === p) this.pending = null; });
    return p;
  },
  async signUp() {
    const c = this.conf();
    const r = await this.http(`${c.auth}/accounts:signUp?key=${encodeURIComponent(c.key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!r || typeof r.localId !== "string" || !/^[\w-]{1,128}$/.test(r.localId) || typeof r.idToken !== "string" || typeof r.refreshToken !== "string") throw this.err(0, "signup");
    return this.keep({ uid: r.localId, id: r.idToken, refresh: r.refreshToken, exp: Date.now() + (Number(r.expiresIn) || 3600) * 1000, db: c.db });
  },
  async refresh(a) {
    const c = this.conf();
    const r = await this.http(`${c.token}/token?key=${encodeURIComponent(c.key)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(a.refresh) });
    if (!r || typeof r.id_token !== "string" || (r.user_id && r.user_id !== a.uid)) throw this.err(0, "refresh");
    return this.keep({ uid: a.uid, id: r.id_token, refresh: typeof r.refresh_token === "string" && r.refresh_token ? r.refresh_token : a.refresh, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000, db: c.db });
  },
  // アカウントを けす（データは さきに Online.wipe が けす）
  async removeAccount() {
    const c = this.conf(), tok = await this.token(false, false);
    await this.http(`${c.auth}/accounts:delete?key=${encodeURIComponent(c.key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: tok }) });
    this.forget();
  },

  // ---- データベース（REST）----
  url(path, tok, q = "") { return `${this.conf().db}/${path}.json?auth=${encodeURIComponent(tok)}${q ? "&" + q : ""}`; },
  async req(method, path, body, q = "", again = true, create = true) {
    const tok = await this.token(false, create);
    try {
      return await this.http(this.url(path, tok, q), body === undefined ? { method } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) {
      if (again && e.status === 401) { const a = this.current(); if (a) a.exp = 0; return this.req(method, path, body, q, false, create); }
      throw e;
    }
  },
  get(path, q = "") { return this.req("GET", path, undefined, q); }, // q: orderBy・limitToLast など（エンコードずみ）
  put(path, value) { return this.req("PUT", path, value, "print=silent"); },
  // { "a/b": 1, "c/d": null } の ように いくつもの ばしょを 1かいで（null は けす）。create: false は アカウントを つくらない（けす とき）
  patch(path, value, create = true) { return this.req("PATCH", path, value, "print=silent", true, create); },

  // ---- ストリーム（SSE）----
  // path の データを うけとりつづける。cb({ type: "put"|"patch", path, data }) と cb({ type: "state", state: "live"|"poll"|"retry"|"denied" })。もどりの close() で やめる
  listen(path, cb) {
    const h = { path, closed: false, es: null, timer: 0, tries: 0, state: "" };
    const ES = this.ESFn || (typeof EventSource === "function" ? EventSource : null);
    const set = (state) => { if (h.state !== state) { h.state = state; cb({ type: "state", state }); } };
    const later = (fn, ms) => { clearTimeout(h.timer); if (!h.closed) h.timer = setTimeout(fn, ms); };
    const backoff = () => Math.min(60000, 2000 * 2 ** Math.min(5, h.tries++));
    const poll = async () => {
      if (h.closed) return;
      try {
        const data = await this.get(path);
        if (h.closed) return;
        h.tries = 0; set("poll"); cb({ type: "put", path: "/", data }); later(poll, this.POLL_MS);
      } catch (e) {
        if (h.closed) return;
        if (e.status === 401 || e.status === 403) { set("denied"); return; }
        set("retry"); later(poll, backoff());
      }
    };
    const open = async () => {
      if (h.closed) return;
      if (!ES) return poll();
      let tok;
      try { tok = await this.token(); } catch (e) { set("retry"); return later(open, backoff()); }
      if (h.closed) return;
      let live = false;
      const es = new ES(this.url(path, tok));
      h.es = es;
      const on = (t, f) => es.addEventListener(t, f);
      on("open", () => { live = true; h.tries = 0; set("live"); });
      for (const t of ["put", "patch"]) on(t, (ev) => {
        let d = null;
        try { d = JSON.parse(ev.data); } catch (e) { return; }
        if (!h.closed && d && typeof d.path === "string") cb({ type: t, path: d.path, data: d.data });
      });
      on("cancel", () => { es.close(); if (!h.closed) set("denied"); });
      on("auth_revoked", () => { es.close(); const a = this.current(); if (a) a.exp = 0; later(open, 50); });
      es.onerror = () => {
        if (h.closed || es.readyState !== 2) return; // 2 = CLOSED（ブラウザが あきらめた）。CONNECTING の あいだは ブラウザが つなぎなおす
        es.close();
        if (!live && h.tries >= 1) return poll(); // はじめから 2かい つながらない → よみなおしに かえる
        const a = this.current(); if (a) a.exp = 0;
        set("retry"); later(open, backoff());
      };
    };
    h.close = () => { h.closed = true; clearTimeout(h.timer); if (h.es) h.es.close(); h.es = null; };
    open();
    return h;
  },
  // ストリームの put／patch を てもとの データに あてる（path は "/" か "/a/b"）。あたらしい てもとの データを かえす
  apply(root, ev) {
    const keys = String(ev.path || "/").split("/").filter(Boolean);
    if (keys.some((k) => k === "__proto__" || k === "constructor" || k === "prototype")) return root;
    if (ev.type === "patch") {
      let r = root;
      for (const [k, v] of Object.entries(ev.data && typeof ev.data === "object" ? ev.data : {})) r = this.apply(r, { type: "put", path: "/" + [...keys, ...k.split("/").filter(Boolean)].join("/"), data: v });
      return r;
    }
    if (!keys.length) return ev.data && typeof ev.data === "object" ? ev.data : {};
    const top = root && typeof root === "object" ? root : {};
    let cur = top;
    for (const k of keys.slice(0, -1)) { if (!cur[k] || typeof cur[k] !== "object") cur[k] = {}; cur = cur[k]; }
    const last = keys[keys.length - 1];
    if (ev.data == null) delete cur[last]; else cur[last] = ev.data;
    return top;
  },
};
