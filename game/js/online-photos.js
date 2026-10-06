// オンライン PR3（E5・UI-96）: みせると きめた ぷりくらを みんなで 見せあう（かくす・ほうこく つき）。すまほの「みんな」の「ぷりくら」タブと「しゃしん」アプリの「みんなに みせる」。
// オーナーの 許可（2026-10-05）「Firebase に送るのは、…・見せると決めたぷりくら（ゲームの絵のデータ）だけ」。
// - おくる もの（1まいずつ・みせると きめた とき だけ・8まい まで）: はいけい・ブース・アップか・3人の ならびと ポーズ・かお・ふく・うごかした ばしょ・
//   ペンの せん・スタンプ・もじ（きまった ことばの ばんごう だけ。じゆうな もじは おくれない）・キラキラ・なまえの コード・サーバーの じこく（v1/photos/{uid}_{サーバーの ばんごう}）。
//   とった ときの じこくは おくらない（わくの 日づけは みせた 日）。しゃしんの id も とった じこくから できて いる ので おくらない:
//   サーバーの ばんごうは しゃしんごとに ランダムに きめて てもとに おぼえる（Save.d.online.photo.sid。みせなおしても おなじ ばんごう）。
// - みんなの ぷりくら: あたらしい じゅんに LIST まい。よんだ データは しんじない（しらない ポーズ・ふく・スタンプ・ことば・__proto__ は すてる・Purikura.clean で なおす）。
// - かくす: この しゃしん／この 人の しゃしん ぜんぶ（てもとだけ・Save.d.online.photo.hide・hideU）。「かくした ものを もどす」。
// - ほうこく: りゆう（いやな え・ことば／いたずら）を おくる。だれが ほうこくしたかは ほかの 人には よめない（v1/reportlog）。かずだけ よめる（v1/reportcount）。
//   HIDE_AT にん いじょうが ほうこくした しゃしんは みんなの いちらんから きえる。じぶんで ほうこくした ものも じぶんには みえない。
//   1人 1かい・かずは ルールで ふやす／へらす（ほうこくの きろくと いっしょ）だけ。「みせた データを けす」で じぶんの ほうこくも とりけす。
const OnlinePhotos = {
  MAX: 8,
  LIST: 24,
  HIDE_AT: 3,
  KEY_RE: /^([\w-]{1,128})_([a-z0-9-]{3,40})$/,
  REASONS: [{ id: "bad", name: "いやな え・ことば" }, { id: "spam", name: "いたずら・なんども おなじ" }],
  SLOTS: ["head", "head2", "face", "neck", "body", "back", "hand"],
  // おくる こうもくの ながさ（game/firebase/database.rules.json と おなじ）
  LEN: { o: 900, m: 40, p: 6200, s: 800, x: 140, e: 80 },
  list: null,
  counts: {},
  view: null,
  own: (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k),
  st() { return Online.st().photo; },
  // サーバーの ばんごう（make: まだ なければ きめる。みせる とき だけ）。ない ときは ""
  // （Online.st() は sid を つくりなおす ので、newSid は st() を よばない）
  sidOf(pid, make = false) {
    const all = this.st().sid;
    if (make && !this.own(all, pid)) { all[pid] = this.newSid(new Set(Object.values(all))); Save.mark(); }
    return this.own(all, pid) ? all[pid] : "";
  },
  newSid(used = new Set()) {
    const a = new Uint32Array(3);
    for (;;) {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 4294967296);
      const id = Array.from(a, (x) => x.toString(36).padStart(7, "0")).join("");
      if (!used.has(id)) return id;
    }
  },
  key(uid, pid, make = false) { const sid = this.sidOf(pid, make); return uid && sid ? `${uid}_${sid}` : ""; },
  parseKey(key) { const m = typeof key === "string" ? this.KEY_RE.exec(key) : null; return m ? { uid: m[1], sid: m[2] } : null; },
  // ID が かわったら（あたらしい アカウント）: まえの ID で みせた しゃしんは わすれる・ほうこくした ものは かくした ものに うつす
  account(uid) {
    const s = this.st();
    if (!uid || s.uid === uid) return s;
    for (const k of Object.keys(s.rep)) if (!s.hide.includes(k)) s.hide.push(k);
    Object.assign(s, { uid, shown: {}, rep: {} }); Save.mark();
    return s;
  },
  mine() { const s = this.st(); return s.uid && s.uid === OnlineNet.uid() ? s : null; },
  shownIds() { const s = this.mine(); return s ? Object.keys(s.shown).filter((id) => s.shown[id] > 0) : []; },
  isShown(pid) { const s = this.mine(); return !!s && this.own(s.shown, pid) && s.shown[pid] > 0; },

  // ---- きまった ことばの ばんごう（みんなの ことば 0〜99・ブースの ことば 100 ×（ブースの じゅん ＋ 1）＋ じゅん）。ない ことばは -1 ----
  wordCode(w, booth) {
    const P = Purikura, i = P.WORDS.indexOf(w);
    if (i >= 0) return i;
    const bi = P.BOOTHS.findIndex((b) => b.id === booth), j = bi >= 0 ? P.BOOTHS[bi].words.indexOf(w) : -1;
    return j >= 0 ? 100 * (bi + 1) + j : -1;
  },
  wordOf(code, booth) {
    const P = Purikura;
    if (!Number.isInteger(code) || code < 0) return "";
    if (code < 100) return P.WORDS[code] || "";
    const b = P.BOOTHS[Math.floor(code / 100) - 1];
    return b && b.id === booth ? b.words[code % 100] || "" : "";
  },
  slotOk(slot, item) { const it = ITEM_INDEX[item]; return !!it && it.slot === (slot === "head2" ? "head" : slot); },

  // ---- おくる かたち（ぷりくらの 絵の データ だけ・ぜんぶ もじれつ）----
  encode(src) {
    const P = Purikura, p = P.clean(src);
    if (!p) return null;
    const ids = Chara.IDS;
    const o = ids.map((id) => {
      const [fit, col] = p.o[id];
      return col + ":" + Object.entries(fit).filter(([s, it]) => this.SLOTS.includes(s) && /^[a-z0-9_]{1,40}$/.test(it)).map(([s, it]) => `${s}=${it}`).join(";");
    }).join("|");
    const out = { n: Online.nickCode(), t: { ".sv": "timestamp" }, b: p.bg, k: p.k, z: p.z, r: p.r.join(","), c: ids.map((id) => p.c[id].join(".")).join(","), o };
    if (p.m) out.m = ids.map((id) => p.m[id].join(".")).join(",");
    if (p.d.p.length) out.p = p.d.p.join(",");
    if (p.d.s.length) out.s = p.d.s.map((s) => s.join(".")).join(",");
    const xs = p.d.x.map((t) => { const w = this.wordCode(t[0], p.k); return w < 0 ? "" : [w, ...t.slice(1)].join("."); }).filter(Boolean);
    if (xs.length) out.x = xs.join(",");
    if (p.d.e && p.d.e.length) out.e = p.d.e.join(",");
    for (const [k, n] of Object.entries(this.LEN)) if (out[k] && out[k].length > n) return null; // ルールを こえる しゃしんは おくらない
    return out;
  },
  // ---- よんだ データ → しゃしん（しんじない）----
  decode(key, v) {
    const K = this.parseKey(key), P = Purikura;
    if (!K || !v || typeof v !== "object" || Array.isArray(v)) return null;
    const str = (x, n) => (typeof x === "string" && x.length <= n ? x : "");
    const nums = (s) => String(s).split(".").map((x) => (/^-?\d{1,5}$/.test(x) ? +x : NaN));
    const has = (o, k) => this.own(o, k), ids = Chara.IDS;
    const cs = str(v.c, 90).split(","), os = str(v.o, this.LEN.o).split("|"), mv = str(v.m, this.LEN.m), ms = mv ? mv.split(",") : null;
    const c = {}, o = {}, m = {};
    ids.forEach((id, i) => {
      const [pose, face] = String(cs[i] || "").split(".");
      c[id] = has(P.POSE, pose) && has(P.FACE, face) ? [pose, face] : ["stand", "happy"];
      const [col, items = ""] = String(os[i] || "").split(":"), fit = {};
      for (const pair of items.split(";").slice(0, 10)) {
        const [slot, item] = pair.split("=");
        if (this.SLOTS.includes(slot) && typeof ITEM_INDEX !== "undefined" && has(ITEM_INDEX, item) && this.slotOk(slot, item)) fit[slot] = item;
      }
      o[id] = [fit, col === "dark" ? "dark" : "soft"];
      if (ms) { const q = nums(ms[i] || ""); m[id] = q.length === 2 && q.every(Number.isFinite) ? q : [0, 0]; }
    });
    const list = (x, n) => (str(x, n) ? x.split(",") : []);
    const stamps = list(v.s, this.LEN.s).slice(0, P.LIMIT.stamps).map((s) => {
      const [id, ...rest] = s.split("."), q = rest.map((x) => (/^-?\d{1,5}$/.test(x) ? +x : NaN));
      return has(P.STAMP, id) && q.length >= 3 && q.length <= 5 && q.every(Number.isFinite) ? [id, ...q] : null;
    }).filter(Boolean);
    const texts = list(v.x, this.LEN.x).slice(0, P.LIMIT.texts).map((s) => {
      const q = nums(s), w = q.length >= 4 && q.length <= 5 && q.every(Number.isFinite) ? this.wordOf(q[0], v.k) : "";
      return w ? [w, ...q.slice(1)] : null;
    }).filter(Boolean);
    const fx = list(v.e, this.LEN.e).filter((id) => P.EFFECTS.some((e) => e.id === id));
    const t = Number.isFinite(Number(v.t)) && Number(v.t) > 0 ? Number(v.t) : 0;
    const raw = { id: K.sid, t, bg: has(P.BG, v.b) ? v.b : "yume", k: has(P.BOOTH, v.k) ? v.k : "", z: v.z === 1 ? 1 : 0, r: str(v.r, 40).split(","), c, o,
      d: { p: list(v.p, this.LEN.p), s: stamps, x: texts, e: fx }, ...(ms ? { m } : {}) };
    const photo = P.clean(raw);
    if (!photo) return null;
    const words = P.wordsOf(photo.k);
    photo.d.x = photo.d.x.filter((x) => words.includes(x[0])); // その ブースで えらべる ことば だけ
    return { key, uid: K.uid, sid: K.sid, n: Online.parseNick(v.n), t, photo };
  },

  // ---- サーバー ----
  async share(pid) {
    const src = Purikura.list().find((p) => p.id === pid), data = src && this.encode(src);
    if (!data) throw Object.assign(new Error("photo"), { code: "photo" });
    const uid = await Online.ensure(), s = this.account(uid);
    if (!this.isShown(pid) && this.shownIds().length >= this.MAX) throw Object.assign(new Error("max"), { code: "max" });
    await OnlineNet.put(`v1/photos/${this.key(uid, pid, true)}`, data);
    s.shown[pid] = Date.now(); Save.mark(); Save.write();
    this.list = null;
  },
  async unshare(pid) {
    const uid = OnlineNet.uid(), s = this.mine(), k = s && this.own(s.shown, pid) ? this.key(uid, pid) : "";
    if (k) await OnlineNet.patch("v1", { [`photos/${k}`]: null });
    if (s) { delete s.shown[pid]; Save.mark(); Save.write(); }
    this.list = null;
  },
  // みんなの いちらんの じぶんの しゃしんを やめる（サーバーの キーで。てもとに ない しゃしんも けせる）
  async unshareKey(key) {
    const K = this.parseKey(key), uid = OnlineNet.uid();
    if (!K || !uid || K.uid !== uid) return;
    await OnlineNet.patch("v1", { [`photos/${key}`]: null });
    const s = this.mine(), all = this.st().sid, pid = Object.keys(all).find((id) => all[id] === K.sid);
    if (s && pid && this.own(s.shown, pid)) { delete s.shown[pid]; Save.mark(); Save.write(); }
    this.list = null;
  },
  // 「しゃしん」アプリで けした しゃしん → サーバーからも けす（つながらない ときは つぎに）
  onRemove(pid) {
    const s = this.mine();
    if (!s || !this.own(s.shown, pid)) { this.forgetSid(); return; }
    s.shown[pid] = -1; Save.mark();
    this.flush().catch(() => {});
  },
  async flush() {
    const s = this.mine();
    if (!s || !Online.on()) return 0;
    const local = new Set(Purikura.list().map((p) => p.id)), gone = Object.keys(s.shown).filter((id) => s.shown[id] < 0 || !local.has(id));
    if (!gone.length) { this.forgetSid(); return 0; }
    const uid = OnlineNet.uid(), up = {};
    for (const id of gone) { const k = this.key(uid, id); if (k) up[`photos/${k}`] = null; }
    if (Object.keys(up).length) await OnlineNet.patch("v1", up);
    for (const id of gone) delete s.shown[id];
    this.forgetSid();
    Save.mark(); this.list = null;
    return gone.length;
  },
  // てもとにも サーバーにも ない しゃしんの ばんごうを わすれる（サーバーから けす まちの ものは のこす）
  forgetSid() {
    const s = this.st(), local = new Set(Purikura.list().map((p) => p.id));
    for (const id of Object.keys(s.sid)) if (!local.has(id) && !this.own(s.shown, id)) { delete s.sid[id]; Save.mark(); }
  },
  // あたらしい じゅんに LIST まい ＋ ほうこくの かず
  async load() {
    const [data, counts] = await Promise.all([
      OnlineNet.get("v1/photos", `orderBy=${encodeURIComponent('"t"')}&limitToLast=${this.LIST}`),
      OnlineNet.get("v1/reportcount").catch(() => null),
    ]);
    const out = [], cnt = {};
    for (const [key, v] of Object.entries(data && typeof data === "object" ? data : {})) { const it = this.decode(key, v); if (it) out.push(it); }
    out.sort((a, b) => b.t - a.t || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    for (const [k, n] of Object.entries(counts && typeof counts === "object" ? counts : {})) if (this.KEY_RE.test(k) && Number.isInteger(n) && n > 0) cnt[k] = Math.min(999, n);
    this.counts = cnt;
    return (this.list = out.slice(0, this.LIST));
  },
  // みえない しゃしん（じぶんの しゃしんは いつも みえる）
  hidden(it) {
    const s = this.st();
    if (it.uid === OnlineNet.uid()) return false;
    return s.hide.includes(it.key) || s.hideU.includes(it.uid) || this.own(s.rep, it.key) || (this.counts[it.key] || 0) >= this.HIDE_AT;
  },
  hide(key) { const s = this.st(); if (!s.hide.includes(key)) { s.hide.push(key); if (s.hide.length > 300) s.hide.splice(0, s.hide.length - 300); } Save.mark(); },
  hideUser(uid) { const s = this.st(); if (!s.hideU.includes(uid)) { s.hideU.push(uid); if (s.hideU.length > 100) s.hideU.splice(0, s.hideU.length - 100); } Save.mark(); },
  unhideAll() { const s = this.st(); s.hide = []; s.hideU = []; Save.mark(); Save.write(); },
  // ほうこく（1人 1かい・かずは いっしょに 1 ふやす。だれかと おなじ ときは よみなおして もう いちど）
  async report(it, reason) {
    if (!this.REASONS.some((r) => r.id === reason) || !this.parseKey(it.key)) return false;
    const uid = await Online.ensure(), s = this.account(uid);
    if (it.uid === uid) return false;
    if (this.own(s.rep, it.key)) return true;
    for (let i = 0; i < 3; i++) {
      const cur = await OnlineNet.get(`v1/reportcount/${it.key}`), n = Number.isInteger(cur) && cur > 0 ? cur : 0;
      try {
        await OnlineNet.patch("v1", { [`reportlog/${it.key}/${uid}`]: reason, [`reportcount/${it.key}`]: n + 1 });
        s.rep[it.key] = reason; Save.mark(); Save.write();
        this.counts[it.key] = n + 1;
        return true;
      } catch (e) { if (e.status !== 401 && e.status !== 403) throw e; }
    }
    throw Object.assign(new Error("report"), { code: "report" });
  },
  // じぶんの ほうこくを とりけす（けす とき。アカウントは つくらない）
  async retractAll(uid) {
    const s = this.st();
    if (s.uid !== uid) return;
    for (const key of Object.keys(s.rep)) {
      for (let i = 0; i < 3; i++) { // だれかと おなじ ときは よみなおして もう いちど（report と おなじ）
        try {
          const cur = await OnlineNet.get(`v1/reportcount/${key}`, "", false);
          if (Number.isInteger(cur) && cur > 0) await OnlineNet.patch("v1", { [`reportlog/${key}/${uid}`]: null, [`reportcount/${key}`]: cur - 1 }, false);
          break;
        } catch (e) { if (e.code === "noaccount") return; if (e.status !== 401 && e.status !== 403) break; }
      }
      if (!s.hide.includes(key)) s.hide.push(key); // とりけしても じぶんには みえない まま
      delete s.rep[key];
    }
    Save.mark();
  },
  // じぶんの しゃしん（てもとの きろくと サーバーで さがした もの）を けす ぶん
  async wipe(uid, up) {
    const s = this.st();
    await this.retractAll(uid).catch(() => {});
    const keys = new Set(s.uid === uid ? Object.keys(s.shown).map((id) => this.key(uid, id)).filter(Boolean) : []);
    try {
      const q = `orderBy=${encodeURIComponent('"$key"')}&startAt=${encodeURIComponent(JSON.stringify(uid + "_"))}&endAt=${encodeURIComponent(JSON.stringify(uid + "_\uf8ff"))}`;
      const mine = await OnlineNet.get("v1/photos", q, false);
      for (const k of Object.keys(mine && typeof mine === "object" ? mine : {})) { const K = this.parseKey(k); if (K && K.uid === uid) keys.add(k); }
    } catch (e) { /* よめなくても てもとの ぶんは けす */ }
    for (const k of keys) up[`photos/${k}`] = null;
  },
  // なまえを かえた あと（1まいずつ。サーバーに もう ない しゃしんは わすれる）
  async renamed(uid, code) {
    const s = this.mine();
    if (!s) return;
    for (const id of this.shownIds()) {
      const k = this.key(uid, id);
      if (!k) { delete s.shown[id]; continue; } // ばんごうが ない → サーバーには ない
      try { await OnlineNet.patch("v1", { [`photos/${k}/n`]: code }); }
      catch (e) { if ((e.status === 401 || e.status === 403) && !(await OnlineNet.get(`v1/photos/${k}`).catch(() => 1))) delete s.shown[id]; }
    }
    Save.mark();
  },

  // ---- 「しゃしん」アプリ: みんなに みせる／やめる ----
  available() { return typeof Online !== "undefined" && Online.on(); },
  photoActions(box, p, refresh) {
    const on = this.isShown(p.id), row = U.el("div", { class: "puri-nav onl-puri-share" });
    const b = UI.btn(on ? "みんなに みせるのを やめる" : "みんなに みせる", async () => {
      if (on) {
        if (!(await UI.confirm("この しゃしんを みんなに みせるのを やめる？\n（サーバーから けすよ）", "やめる", "もどる"))) return;
        try { await this.unshare(p.id); UI.toast("みせるのを やめたよ"); } catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); }
      } else {
        if (this.shownIds().length >= this.MAX) { UI.toast(`みせられるのは ${this.MAX}まい までだよ`); return; }
        if (!(await UI.confirm("この しゃしんを みんなに みせる？\n（ゲームの 中の えの データ だけ おくるよ。もじは きまった ことば だけ。いつでも やめられるよ）", "みせる", "やめる"))) return;
        try { await this.share(p.id); UI.toast("みんなに みせたよ", "good"); }
        catch (e) { UI.toast(e.code === "max" ? `みせられるのは ${this.MAX}まい までだよ` : e.code === "photo" ? "この しゃしんは おくれないよ" : "いまは つながらないよ。あとで もういちど ためしてね"); }
      }
      refresh();
    }, (on ? "" : "yellow ") + "onl-puri-btn");
    row.append(b);
    box.append(row);
  },

  // ---- 大きく みる まど（かくす・ほうこく）----
  open(it) {
    this.close();
    const me = it.uid === OnlineNet.uid(), name = Online.nickText(it.n), body = U.el("div", { class: "onl-photo-view" });
    const w = Math.floor(Math.max(150, Math.min(300, (document.documentElement.clientWidth || 360) - 80, ((window.innerHeight || 640) - 300) * 0.75)));
    const cv = U.el("canvas", { class: "puri-big onl-photo-big", role: "img", "aria-label": `${name}さんの ぷりくら` });
    const v = { it, closed: false, drawn: false };
    this.view = v;
    PurikuraArt.paint(cv, Purikura.view(it.photo), w).then(() => { v.drawn = true; });
    body.append(cv, U.el("div", { class: "onl-photo-cap" }, [U.el("b", { text: name + (me ? "（あなた）" : "") }), U.el("span", { text: it.t ? Purikura.dateText(it.t) : "" })]));
    const acts = U.el("div", { class: "puri-nav onl-photo-acts" });
    if (me) {
      acts.append(UI.btn("みせるのを やめる", async () => {
        if (!(await UI.confirm("この しゃしんを みんなに みせるのを やめる？", "やめる", "もどる"))) return;
        try { await this.unshareKey(it.key); UI.toast("みせるのを やめたよ"); this.close(); if (this.refresh) this.refresh(); } catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); }
      }, "onl-photo-stop"));
    } else {
      acts.append(
        UI.btn("かくす", async () => {
          const i = await UI.ask("どれを かくす？（じぶんの すまほ だけ）", ["この しゃしん", "この 人の しゃしん ぜんぶ", "やめる"]);
          if (i === 0) this.hide(it.key); else if (i === 1) this.hideUser(it.uid); else return;
          Save.write(); UI.toast("かくしたよ"); this.close(); if (this.refresh) this.refresh();
        }, "onl-photo-hide"),
        UI.btn("ほうこく", async () => {
          const i = await UI.ask("どうして ほうこく する？\n（だれが ほうこくしたかは ほかの 人には わからないよ）", [...this.REASONS.map((r) => r.name), "やめる"]);
          const r = this.REASONS[i];
          if (!r) return;
          try { await this.report(it, r.id); UI.toast("ほうこく したよ。ありがとう", "good"); } catch (e) { this.hide(it.key); UI.toast("いまは おくれなかったよ。この しゃしんは かくしたよ"); }
          this.close(); if (this.refresh) this.refresh();
        }, "onl-photo-report"),
      );
    }
    body.append(acts);
    v.m = UI.modal({ title: `${name}さんの ぷりくら`, body, cls: "onl-photo-panel", onClose: () => { v.closed = true; if (this.view === v) this.view = null; } });
    return v;
  },
  close() { const v = this.view; this.view = null; if (v && !v.closed && v.m) v.m.close(); },

  // ---- すまほの「みんな」の「ぷりくら」タブ ----
  tabView(el) {
    const box = U.el("div", { class: "onl-photos" }), n = this.shownIds().length;
    box.append(U.el("div", { class: "note onl-photos-note", text: `じぶんの ぷりくら: ${n}／${this.MAX}まい みせて いるよ。「しゃしん」アプリで えらんで「みんなに みせる」を おしてね。` }));
    const grid = U.el("div", { class: "puri-album onl-photo-grid" }), more = U.el("div", { class: "onl-photos-more" });
    const reload = UI.btn("あたらしく する", () => { Sound.se("tap"); load(); }, "small onl-photo-reload");
    box.append(U.el("div", { class: "onl-room-head" }, [U.el("b", { text: "みんなの ぷりくら" }), reload]), grid, more);
    el.append(box);
    const render = (rows) => {
      grid.replaceChildren(); more.replaceChildren();
      const me = OnlineNet.uid(), shown = rows.filter((it) => !this.hidden(it)), hid = rows.length - shown.length;
      if (!shown.length) grid.append(U.el("div", { class: "onl-empty", text: rows.length ? "みえる ぷりくらが ないよ。" : "まだ だれも みせて いないよ。" }));
      for (const it of shown) {
        const mine = it.uid === me, b = U.el("button", { class: "puri-photo onl-photo" + (mine ? " me" : ""), "aria-label": `${Online.nickText(it.n)}さんの ぷりくら` }), cv = U.el("canvas");
        b.dataset.key = it.key;
        b.append(cv, U.el("span", { class: "onl-photo-name", text: mine ? "あなた" : Online.nickText(it.n) }));
        PurikuraArt.paint(cv, Purikura.view(it.photo), 84);
        b.addEventListener("click", () => { Sound.se("ok"); this.open(it); });
        grid.append(b);
      }
      const s = this.st(), nHide = s.hide.length + s.hideU.length;
      if (hid) more.append(U.el("div", { class: "muted onl-photos-hid", text: `かくして いる ぷりくら ${hid}まい（ほうこくが おおい ものも かくれるよ）` }));
      if (nHide) more.append(UI.btn("かくした ものを もどす", () => { Sound.se("tap"); this.unhideAll(); render(this.list || []); }, "wide onl-photo-unhide"));
    };
    const load = async () => {
      grid.replaceChildren(U.el("div", { class: "onl-empty", text: "よみこんで いるよ…" }));
      try { await this.flush().catch(() => {}); render(await this.load()); } catch (e) { grid.replaceChildren(U.el("div", { class: "onl-empty", text: "よめなかったよ。あとで もういちど ためしてね。" })); }
    };
    this.refresh = () => (this.list ? render(this.list) : load());
    if (this.list) render(this.list); else load();
  },
};

// すまほの「みんな」に「ぷりくら」タブ・けす／なまえを かえる／ID が かわる ときの ぶん（js/online.js の Online.parts）
Online.parts.push({
  id: "photos", name: "ぷりくら",
  render: (el) => OnlinePhotos.tabView(el),
  leave: () => { OnlinePhotos.close(); OnlinePhotos.refresh = null; },
  wipe: (uid, up) => OnlinePhotos.wipe(uid, up),
  renamed: (uid, code) => OnlinePhotos.renamed(uid, code),
  account: (uid) => { OnlinePhotos.account(uid); OnlinePhotos.flush().catch(() => {}); }, // オフの あいだに けした しゃしんも つながったら けす
});
