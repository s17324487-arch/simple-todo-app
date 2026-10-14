// LINE れんけい（UI-126。オーナーの 指示 2026-10-14「③にしたいので許可する。」。AGENTS.md 4-10 の 例外）。
// わんこ・がちゃん・ごじ の ようすを オーナーの GAS（game/line/Code.gs）へ おくり、ながく あそばないと 3人から LINE に おしらせが とどく。
// - つなぎかた: ≡ の せってい →「LINE と つなぐ」→ 18さい いじょうの 同意 → 6もじの ばんごうが でる → LINE で ともだちに なって ばんごうを おくる →「つながったか たしかめる」。
// - おくる もの: 6もじの ばんごう・あいことば（どちらも ここで ランダムに つくる）・3人の [おなか, ごきげん]（0〜100 の せいすう）だけ。
//   おくらない もの: つけた なまえ・ほんとうの なまえ・メール・いばしょ・セーブの ほかの データ。LINE の ID は ゲームには こない（GAS に のこる）。
// - つうしんは OnlineNet.gas（js/online-net.js）だけ。おくるのは つないだ あと・あそんで いる あいだ 10ぷん ごと と ページを とじる とき。
// - つなぎさきは ONLINE_CONFIG.lineUrl・lineFriend（js/online-config.js。から なら「じゅんびちゅう」）。テストは over（PokaDebug.lineServer）。
// - セーブ（Save.d.line）: on・agreed 同意した とき・ver・code・sec・linked つながったか・sent さいごに おくった とき。
const LineLink = {
  VER: 1,
  ALPHA: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  SEC_ALPHA: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  SEND_MS: 10 * 60000,
  URL_RE: /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,120}\/exec$/,
  FRIEND_RE: /^https:\/\/(lin\.ee\/[\w-]{4,40}|line\.me\/R\/ti\/p\/(@|%40)[\w.-]{2,40})$/,
  TEST_RE: /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}(\/[\w-]+)*$/,
  over: null,
  busy: null,

  fresh() { return { on: false, agreed: 0, ver: 0, code: "", sec: "", linked: false, sent: 0 }; },
  st() {
    const d = Save.d;
    if (!d.line || typeof d.line !== "object" || Array.isArray(d.line)) d.line = this.fresh();
    const s = d.line, f = this.fresh();
    for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
    for (const k of Object.keys(s)) if (!(k in f)) delete s[k];
    s.on = !!s.on; s.linked = !!s.linked;
    for (const k of ["agreed", "sent"]) if (!Number.isFinite(s[k]) || s[k] < 0) s[k] = 0;
    if (!Number.isInteger(s.ver)) s.ver = 0;
    if (typeof s.code !== "string" || !/^[A-HJ-NP-Z2-9]{6}$/.test(s.code)) s.code = "";
    if (typeof s.sec !== "string" || !/^[A-Za-z0-9]{32}$/.test(s.sec)) s.sec = "";
    if (!s.code || !s.sec) { s.on = false; s.linked = false; }
    return s;
  },
  conf() {
    const c = this.over || (typeof ONLINE_CONFIG !== "undefined" ? ONLINE_CONFIG : {});
    return { url: String(c.lineUrl || "").trim(), friend: String(c.lineFriend || "").trim() };
  },
  // つなぎさきが ある（本番は GAS の ウェブアプリ だけ・テストは 127.0.0.1 も）
  ready() { const c = this.conf(); return this.URL_RE.test(c.url) || (!!this.over && this.TEST_RE.test(c.url)); },
  friendUrl() { const f = this.conf().friend; return this.FRIEND_RE.test(f) || (!!this.over && this.TEST_RE.test(f)) ? f : ""; },
  on() { const s = this.st(); return s.on && s.agreed > 0 && s.ver >= this.VER && !!s.code && this.ready(); },

  rand(n, alpha) {
    const a = new Uint32Array(n);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return Array.from(a, (x) => alpha[x % alpha.length]).join("");
  },
  // おくる ようす: 3人の [おなか, ごきげん]（せいすう）だけ
  state() {
    const out = {};
    for (const [k, id] of [["w", "wanko"], ["g", "gachan"], ["j", "goji"]]) {
      const c = Save.d.chars[id], n = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
      out[k] = [n(c.hunger), n(c.mood)];
    }
    return out;
  },
  // サーバーへ おくる かたち（op ごとに きまった もの だけ）
  payload(op) {
    const s = this.st(), b = { op, code: s.code, sec: s.sec };
    if (op === "state") b.s = this.state();
    return b;
  },
  async call(op, keepalive = false) {
    const r = await OnlineNet.gas(this.conf().url, this.payload(op), keepalive);
    if (!r || typeof r !== "object") throw new Error("line bad");
    const s = this.st();
    if (r.ok && typeof r.linked === "boolean" && s.linked !== r.linked) { s.linked = r.linked; Save.mark(); }
    if (!r.ok && r.err === "nocode") { s.linked = false; Save.mark(); }
    return r;
  },

  // ---- つなぐ・たしかめる・おくる・はなす ----
  async begin() {
    if (!this.ready()) { UI.toast("LINE れんけいは じゅんびちゅう だよ"); return false; }
    if (!(await this.consent())) return false;
    const s = this.st();
    if (!s.code || !s.sec) { s.code = this.rand(6, this.ALPHA); s.sec = this.rand(32, this.SEC_ALPHA); }
    s.on = true; s.agreed = Date.now(); s.ver = this.VER; s.linked = false; Save.mark(); Save.write();
    let r = null;
    try { r = await this.call("hello"); } catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); return true; }
    if (!r.ok && r.err === "used") { s.code = this.rand(6, this.ALPHA); s.sec = this.rand(32, this.SEC_ALPHA); Save.mark(); try { r = await this.call("hello"); } catch (e) { r = null; } }
    if (!r || !r.ok) { UI.toast(r && r.err === "full" ? "いまは いっぱいで つなげないよ" : "いまは つながらないよ。あとで もういちど ためしてね"); return true; }
    await this.pairView();
    return true;
  },
  async check() {
    try { const r = await this.call("check"); if (this.st().linked) await this.sync(true); return !!(r.ok && r.linked); }
    catch (e) { UI.toast("いまは つながらないよ"); return false; }
  },
  // ようすを おくる（つないだ あと だけ・force なしは 10ぷん ごと）
  sync(force = false, keepalive = false) {
    if (this.busy) return this.busy;
    const s = this.st();
    if (!this.on() || !s.linked) return Promise.resolve(false);
    if (!force && Date.now() - s.sent < this.SEND_MS) return Promise.resolve(false);
    s.sent = Date.now(); Save.mark();
    this.busy = this.call("state", keepalive).then((r) => !!r.ok, () => false).finally(() => { this.busy = null; });
    return this.busy;
  },
  async testPush() {
    try { const r = await this.call("test"); UI.toast(r.sent ? "LINE に テストの おしらせを おくったよ" : r.linked ? "こんげつは もう おくれないよ" : "まだ LINE と つながって いないよ", r.sent ? "good" : ""); return r; }
    catch (e) { UI.toast("いまは つながらないよ"); return null; }
  },
  // はなす: サーバーの ばんごう・LINE の ID・ようすを けす（つながらなくても てもとは わすれる）
  async stop() {
    const s = this.st(); let ok = true;
    if (s.code && s.sec && this.ready()) { try { const r = await this.call("bye"); ok = !!r.ok || r.err === "nocode"; } catch (e) { ok = false; } }
    Object.assign(s, this.fresh()); Save.mark(); Save.write();
    return ok;
  },
  // あそんで いる あいだ（1ぷん ごとに しらべて 10ぷん ごとに おくる）・ページを かくす とき
  tick() { if (typeof Save !== "undefined" && Save.d && Save.d.chars) this.sync(false); },
  hide() { if (document.visibilityState === "hidden" && Save.d && Save.d.chars) this.sync(true, true); },

  // ---- まど ----
  consent() {
    return new Promise((resolve) => {
      const list = (title, items, cls = "") => {
        const box = U.el("div", { class: "onl-box " + cls }, [U.el("b", { text: title })]), ul = U.el("ul");
        for (const t of items) ul.append(U.el("li", { text: t }));
        box.append(ul); return box;
      };
      const body = U.el("div", { class: "onl-consent line-consent" }, [
        U.el("p", { class: "onl-adult", text: "この きのうは 18さい いじょうの かただけ つかえます。" }),
        U.el("p", { class: "onl-lead", text: "LINE と つなぐと、しばらく あそばない ときに わんこ・がちゃん・ごじ から LINE に おしらせが とどくよ（1にち 1かい まで・よるは おくらない）。" }),
        list("おくる もの", ["つなぐ ための 6もじの ばんごうと あいことば（じどうで できる）", "3人の おなかと ごきげんの すうじ", "さいごに あそんだ じかん（おくった じかんで わかる）"]),
        list("おくらない もの", ["ほんとうの なまえ・メール・いばしょ", "3人に つけた なまえ・セーブの ほかの データ"], "no"),
        U.el("p", { class: "muted", text: "LINE の ID は ゲームには のこらず、ゲームの つくりての Google（Apps Script）に ばんごうと いっしょに のこるよ。むりょうの はんいで つかうよ。" }),
        U.el("p", { class: "muted", text: "ここの「LINE を はなす」か、LINE で「やめる」と おくると けせるよ。" }),
      ]);
      let m = null;
      const done = (v) => { if (!m) return; const mm = m; m = null; mm.close(); resolve(v); };
      const yes = UI.btn("18さい いじょうです。<br>どういして つなぐ", () => { Sound.se("ok"); done(true); }, "wide yellow onl-agree line-agree");
      const no = UI.btn("やめる", () => { Sound.se("cancel"); done(false); }, "wide onl-cancel");
      m = UI.modal({ title: "LINE と つなぐ まえに", body, cls: "onl-modal", footer: U.el("div", { class: "onl-foot" }, [yes, no]), onClose: () => { if (m) { m = null; resolve(false); } } });
    });
  },
  // ばんごうと ともだち ついかの まど（とじると おわり）
  pairView() {
    return new Promise((resolve) => {
      const s = this.st(), f = this.friendUrl();
      const body = U.el("div", { class: "line-pair" });
      body.append(U.el("p", { class: "line-step", text: "1. LINE で「ぽかぽかタウン」と ともだちに なってね。" }));
      if (f) body.append(U.el("a", { class: "btn wide green line-friend", href: f, target: "_blank", rel: "noopener noreferrer", text: "LINE で ともだちに なる" }));
      body.append(U.el("p", { class: "line-step", text: "2. LINE の トークに この ばんごうを おくってね。" }));
      body.append(U.el("div", { class: "line-code", "aria-label": "ひもづけの ばんごう", text: s.code }));
      const msg = U.el("p", { class: "muted line-msg", text: "おくったら「つながったか たしかめる」を おしてね。" });
      body.append(U.el("p", { class: "line-step", text: "3. つながったか たしかめる。" }), msg);
      let m = null;
      const done = () => { if (!m) return; const mm = m; m = null; mm.close(); resolve(); };
      const chk = UI.btn("つながったか たしかめる", async () => {
        Sound.se("tap"); const ok = await this.check();
        if (ok) { Sound.se("ok"); UI.toast("LINE と つながったよ！", "good"); done(); }
        else msg.textContent = "まだ つながって いないよ。ばんごうを おくってから もういちど おしてね。";
      }, "wide yellow line-check");
      const later = UI.btn("あとで", () => { Sound.se("cancel"); done(); }, "wide");
      m = UI.modal({ title: "LINE と つなぐ", body, cls: "onl-modal line-modal", footer: U.el("div", { class: "onl-foot" }, [chk, later]), onClose: () => { if (m) { m = null; resolve(); } } });
    });
  },
  // ≡ の せってい の なか
  settings(el, refresh) {
    const box = U.el("div", { class: "onl-settings line-settings" });
    box.append(U.el("div", { class: "note", text: "LINE（3人から おしらせ）" }));
    if (!this.ready()) { box.append(U.el("div", { class: "muted line-soon", text: "LINE れんけいは じゅんびちゅう だよ。" })); el.append(box); return; }
    const s = this.st();
    if (!this.on()) {
      box.append(U.el("div", { class: "muted", text: "しばらく あそばない ときに 3人から LINE に おしらせが とどくよ（18さい いじょうの かただけ）。" }));
      box.append(UI.btn("LINE と つなぐ", async () => { await this.begin(); refresh(); }, "wide yellow line-begin"));
    } else if (!s.linked) {
      box.append(U.el("div", { class: "onl-state" }, [U.el("span", { text: "ばんごう: " }), U.el("b", { text: s.code }), U.el("span", { text: "（まだ つながって いないよ）" })]));
      box.append(UI.btn("ばんごうと つなぎかたを みる", async () => { await this.pairView(); refresh(); }, "wide yellow line-pair-open"));
    } else {
      box.append(U.el("div", { class: "onl-state on" }, [U.el("span", { text: "LINE と つながって いるよ" })]));
      box.append(UI.btn("テストの おしらせを おくる", async () => { await this.testPush(); }, "wide line-test"));
    }
    if (s.on) box.append(UI.btn("LINE を はなす", async () => {
      if (!(await UI.confirm("LINE を はなす？\n（ばんごう・LINE の ID・おくった ようすを けすよ）", "はなす", "やめる"))) return;
      const ok = await this.stop(); UI.toast(ok ? "LINE を はなしたよ" : "てもとは はなしたよ。サーバーの ほうは LINE で「やめる」と おくってね", ok ? "good" : ""); refresh();
    }, "wide line-stop"));
    el.append(box);
  },
};
// 1ぷん ごとに しらべる（Node の 検査では プロセスを とめない ように unref）
{ const t = setInterval(() => LineLink.tick(), 60000); if (t && typeof t.unref === "function") t.unref(); }
document.addEventListener("visibilitychange", () => LineLink.hide());
