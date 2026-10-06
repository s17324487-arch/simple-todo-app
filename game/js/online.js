// オンライン（E5・UI-94）。オーナーの 指示（2026-10-02）「E5について。ルール10を無視して良い。ただし、リアルタイム通信無料でできること。さらにその機能をオンにするには、18歳以上であることの同意ボタンを用意すること。」と 2026-10-05 の 許可。
// みんなと おてつだいの スコアを くらべる: すまほの「みんな」アプリ（おみせごとの ランキング・リアルタイムで かわる）と ≡ の せってい（はじめる・なまえ・とめる・けす）。
// - おくる もの: 匿名の ID（じどうで できる）・きまった ことばから えらぶ なまえ・おてつだいの スコア（と おみせの Lv・あそびかた）。
//   おへやの かぐの ならび（みせると きめた とき だけ。js/online-rooms.js）。あとで ふえる もの: みせると きめた ぷりくら。
// - おくらない もの: ほんとうの なまえ・メール・いばしょ・カメラの しゃしん。じゆうに うつ もじも ない（なまえは ことばの ばんごう「3-12」）。
// - 18さい いじょうの 同意を おして オンに した ときだけ つながる（js/online-net.js）。オンに する たびに 同意を きく。つなぎさきは js/online-config.js（から なら「じゅんびちゅう」）。
// - スコア: 1かいの おてつだいで おきゃくさん ひとりずつの てんすう（0〜100）の ごうけい（ShopScene.results）。ころころ フルーツの スコア モードは その スコア（KorokoroScore.record）。
//   ボードは おみせごと（あたまの たいそう・パズル こうぼうは ゲームごと・マックさん・ころころの スコア モード）。
// - セーブ（Save.d.online）: on オンか・agreed 同意した とき・ver 同意の ばんごう・nick [ことば1, ことば2]・best { ボード: { s スコア, d 日, l おみせ Lv, m あそびかた } }・
//   sent { ボード: おくった スコア }・sentUid おくった ときの ID（ID が かわったら おくりなおす）
// - データの かたち と きまりは game/firebase/database.rules.json（v1/players/{uid}・v1/scores/{ボード}/{uid}）。
const Online = {
  VER: 1,
  MAX: 10000000,
  TOP: 30,
  // なまえの ことば（ようす × もの・24 × 24）
  NICK_A: ["ぽかぽか", "きらきら", "ふわふわ", "にこにこ", "のんびり", "わくわく", "ぴかぴか", "ころころ", "そよそよ", "もぐもぐ", "すやすや", "るんるん",
    "ほかほか", "ぽわぽわ", "まったり", "ほっこり", "さくさく", "とことこ", "きらりん", "げんきな", "やさしい", "ゆうがな", "ふしぎな", "はるかぜ"],
  NICK_B: ["うさぎ", "くま", "ねこ", "いぬ", "ぱんだ", "ことり", "ひよこ", "ぺんぎん", "りす", "きつね", "たぬき", "こあら",
    "いちご", "めろん", "もも", "ぷりん", "おにぎり", "わたあめ", "くも", "ほし", "つき", "はな", "どんぐり", "きのこ"],
  STATE_TEXT: { "": "つないで いるよ…", live: "● リアルタイムで つながって いるよ", poll: "● ときどき あたらしく して いるよ", retry: "つなぎなおして いるよ…", denied: "よめなかったよ（つなぎさきの きまりを たしかめてね）" },
  watching: null,
  last: "",
  tab: "rank",
  reg: "",
  // ほかの ファイルが たす ぶぶん（js/online-rooms.js の おうち・つぎの ぷりくら）:
  // { id, name: すまほの タブ, render(el, ph), leave(), wipe(uid, up) けす ときの null, rename(uid, up, code) なまえを かえる ときの かきかえ }
  parts: [],
  syncP: null,
  again: false,

  fresh() { return { on: false, agreed: 0, ver: 0, nick: [0, 0], best: {}, sent: {}, sentUid: "", room: { shown: 0, id: "", uid: "" } }; },
  st() {
    const d = Save.d;
    if (!d.online || typeof d.online !== "object" || Array.isArray(d.online)) d.online = this.fresh();
    const s = d.online, f = this.fresh(), idx = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
    for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
    s.on = !!s.on; s.agreed = Number.isFinite(s.agreed) && s.agreed > 0 ? s.agreed : 0; s.ver = Number.isInteger(s.ver) ? s.ver : 0;
    if (!Array.isArray(s.nick) || s.nick.length !== 2 || !idx(s.nick[0], this.NICK_A.length) || !idx(s.nick[1], this.NICK_B.length)) s.nick = [0, 0];
    for (const k of ["best", "sent"]) if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k])) s[k] = {};
    if (typeof s.sentUid !== "string") s.sentUid = "";
    // みせて いる おへや（js/online-rooms.js）: shown みせた とき（0 は みせて いない）・id おへや・uid みせた ときの ID
    if (!s.room || typeof s.room !== "object" || Array.isArray(s.room)) s.room = { ...f.room };
    s.room.shown = Number.isFinite(s.room.shown) && s.room.shown > 0 ? s.room.shown : 0;
    for (const k of ["id", "uid"]) if (typeof s.room[k] !== "string") s.room[k] = "";
    return s;
  },
  // オンか（同意して オンに して いて、つなぎさきも ある）
  on() { const s = this.st(); return s.on && s.agreed > 0 && s.ver >= this.VER && OnlineNet.ready(); },

  // ---- なまえ（きまった ことばの くみあわせ）----
  nickCode(n = this.st().nick) { return `${n[0]}-${n[1]}`; },
  parseNick(code) { const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(code || "")); return m && +m[1] < this.NICK_A.length && +m[2] < this.NICK_B.length ? [+m[1], +m[2]] : null; },
  nickText(n) { return n && this.NICK_A[n[0]] && this.NICK_B[n[1]] ? `${this.NICK_A[n[0]]} ${this.NICK_B[n[1]]}` : "なまえ なし"; },
  randomNick() { return [Math.floor(Math.random() * this.NICK_A.length), Math.floor(Math.random() * this.NICK_B.length)]; },

  // ---- ボード（ランキングの ひとつ）----
  boards() {
    const out = [], G = typeof SHOP_GAMES !== "undefined" ? SHOP_GAMES : {};
    for (const [shop, S] of Object.entries(SHOPS)) {
      if (shop === "link" || !MG_TASKS[shop]) continue; // なかよしパズル（link）は おてつだい では ない
      // ゲームを えらぶ おみせは ゲームごと。むずかしさで てんすうの いみが かわる ゲーム（ナンプレ・英語）は その くぎりごと（GAMES の boards）
      if (G[shop] && Array.isArray(G[shop].GAMES)) for (const g of G[shop].GAMES) {
        if (Array.isArray(g.boards) && g.boards.length) for (const b of g.boards) out.push({ id: `${shop}_${g.id}_${b.id}`, name: `${S.name}・${g.name}（${b.name}）`, shop });
        else out.push({ id: `${shop}_${g.id}`, name: `${S.name}・${g.name}`, shop });
      }
      else out.push({ id: shop, name: S.name, shop });
      if (shop === "burger") out.push({ id: "burger_mac", name: "マックさん（ヘイワダイ）", shop });
      if (shop === "korokoro") out.push({ id: "korokoro_score", name: `${S.name}・スコア モード`, shop });
    }
    return out;
  },
  BOARD_RE: /^[a-z]{3,12}(_[a-z]{2,8}){0,3}$/, // game/firebase/database.rules.json の $board と おなじ
  isBoard(id) { return typeof id === "string" && this.BOARD_RE.test(id) && this.boards().some((b) => b.id === id); },
  boardName(id) { const b = this.boards().find((x) => x.id === id); return b ? b.name : ""; },
  // ShopScene の おみせ・ゲーム・くぎり（key: その ゲームの boards の id。ナンプレの 難しさ・英語の レベル_あそびかた）から ボード（なければ ""）
  board(shop, variant = null, key = "") {
    if (variant === "mac") return "burger_mac";
    const G = typeof SHOP_GAMES !== "undefined" && SHOP_GAMES[shop];
    if (!G || typeof G.game !== "function") return shop;
    const g = G.game(variant);
    if (!Array.isArray(g.boards) || !g.boards.length) return `${shop}_${g.id}`;
    return g.boards.some((b) => b.id === key) ? `${shop}_${g.id}_${key}` : "";
  },

  // ---- きろく（オフでも てもとに のこす。オンなら いちばん よい きろくを おくる）----
  // info: { lv: おみせ Lv, m: あそびかた（"" で なし・いわなければ いまの あそびかた）}
  record(board, score, info = {}) {
    if (!this.isBoard(board)) return null;
    const st = this.st(), s = Math.max(0, Math.min(this.MAX, Math.round(Number(score) || 0))), prev = st.best[board] && Number.isFinite(st.best[board].s) ? st.best[board].s : 0;
    const best = s > prev;
    if (best) {
      const m = info.m === undefined ? Save.d.settings.difficulty : info.m;
      st.best[board] = { s, d: U.today(), ...(info.lv > 0 ? { l: Math.min(99, Math.floor(info.lv)) } : {}), ...(GameEconomy.modes[m] ? { m } : {}) };
      Save.mark();
      if (this.on()) this.sync().catch(() => {});
    }
    return { board, s, prev, best, sent: best && this.on() };
  },
  entry(e) {
    const o = { s: e.s, n: this.nickCode(), t: { ".sv": "timestamp" } };
    if (Number.isInteger(e.l) && e.l > 0) o.l = e.l;
    if (GameEconomy.modes[e.m]) o.m = e.m;
    return o;
  },
  // サーバーに じぶんを とうろく（なまえ・とき）
  async ensure() {
    await OnlineNet.token();
    const uid = OnlineNet.uid();
    if (this.reg !== uid) { await OnlineNet.put(`v1/players/${uid}`, { n: this.nickCode(), t: { ".sv": "timestamp" } }); this.reg = uid; }
    return uid;
  },
  // まだ おくって いない いちばん よい きろくを まとめて おくる（いくつ おくったか）。おくって いる とちゅうなら おわってから もう 1かい（おなじ Promise）
  sync() {
    if (!this.on()) return Promise.resolve(0);
    if (this.syncP) { this.again = true; return this.syncP; }
    const p = (async () => {
      let n = 0;
      do {
        this.again = false;
        const uid = await this.ensure(), st = this.st(), up = {};
        if (st.sentUid !== uid) { st.sent = {}; st.sentUid = uid; }
        if (st.room.uid && st.room.uid !== uid) st.room = { shown: 0, id: "", uid: "" }; // まえの ID で みせた おへやは もう かえられない
        for (const [b, e] of Object.entries(st.best)) if (this.isBoard(b) && e && e.s > 0 && e.s > (st.sent[b] || 0)) up[`scores/${b}/${uid}`] = this.entry(e);
        const keys = Object.keys(up);
        if (keys.length) {
          await OnlineNet.patch("v1", up);
          for (const k of keys) { const b = k.split("/")[1]; st.sent[b] = up[k].s; }
          Save.mark(); n += keys.length;
        }
      } while (this.again && this.on());
      return n;
    })();
    this.syncP = p;
    const clear = () => { if (this.syncP === p) this.syncP = null; };
    p.then(clear, clear);
    return p;
  },

  // ---- はじめる・とめる・なまえ・けす ----
  // 18さい いじょうの 同意 → （はじめてなら）なまえ → オン
  async begin() {
    if (!OnlineNet.ready()) { UI.toast("オンラインは じゅんびちゅう だよ"); return false; }
    if (!(await this.consent())) return false;
    const st = this.st();
    if (!st.agreed) {
      const n = await this.pickName(st.nick[0] || st.nick[1] ? st.nick : this.randomNick());
      if (!n) return false;
      st.nick = n;
    }
    st.agreed = Date.now(); st.ver = this.VER; st.on = true;
    Save.mark(); Save.write();
    try { await this.ensure(); await this.sync(); UI.toast("オンラインに なったよ", "good"); }
    catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); }
    return true;
  },
  stop() {
    const st = this.st(); st.on = false;
    this.closeAll(); Save.mark(); Save.write();
  },
  // なまえを かえる（おくった きろくの なまえも かえる）。つながらない ときは つぎの sync で ぜんぶ おくりなおす
  async rename(nick) {
    const st = this.st(); st.nick = nick; Save.mark();
    if (!this.on()) return true;
    try {
      const uid = await this.ensure(), up = { [`players/${uid}`]: { n: this.nickCode(), t: { ".sv": "timestamp" } } };
      if (st.sentUid === uid) for (const [b, e] of Object.entries(st.best)) if (this.isBoard(b) && st.sent[b] && e) up[`scores/${b}/${uid}`] = this.entry(e);
      for (const p of this.parts) if (p.rename) p.rename(uid, up, this.nickCode());
      await OnlineNet.patch("v1", up);
      for (const k of Object.keys(up)) if (k.startsWith("scores/")) st.sent[k.split("/")[1]] = up[k].s;
    } catch (e) { st.sent = {}; this.reg = ""; Save.mark(); throw e; }
    Save.mark(); Save.write();
    return true;
  },
  // サーバーの じぶんの データと アカウントを けす（てもとの きろくは のこる）。もう いちど つかう ときは また 同意から
  async wipe() {
    const st = this.st();
    st.on = false; this.closeAll(); // もう おくらない（おくって いる とちゅうの ものは まつ）
    if (this.syncP) await this.syncP.catch(() => {});
    const uid = OnlineNet.uid();
    if (uid) {
      const up = { [`players/${uid}`]: null }, ids = new Set(this.boards().map((b) => b.id));
      for (const b of [...Object.keys(st.sent), ...Object.keys(st.best)]) if (this.BOARD_RE.test(b)) ids.add(b); // まえの バージョンの ボードも
      for (const b of ids) up[`scores/${b}/${uid}`] = null;
      for (const p of this.parts) if (p.wipe) p.wipe(uid, up);
      try { await OnlineNet.patch("v1", up, false); await OnlineNet.removeAccount(); }
      catch (e) { if (e.code !== "noaccount") throw e; } // アカウントが もう ない（データも けせない）→ てもとだけ わすれる
    }
    st.agreed = 0; st.ver = 0; st.sent = {}; st.sentUid = ""; st.room = { shown: 0, id: "", uid: "" };
    OnlineNet.forget(); this.reg = "";
    Save.mark(); Save.write();
    return true;
  },

  // ---- まど ----
  // 18さい いじょうの 同意（はい: true）
  consent() {
    return new Promise((resolve) => {
      const body = U.el("div", { class: "onl-consent" });
      const list = (title, items, cls = "") => {
        const box = U.el("div", { class: "onl-box " + cls }, [U.el("b", { text: title })]), ul = U.el("ul");
        for (const t of items) ul.append(U.el("li", { text: t }));
        box.append(ul); return box;
      };
      body.append(
        U.el("p", { class: "onl-adult", text: "この きのうは 18さい いじょうの かただけ つかえます。" }), // スクロール しなくても みえる ように いちばん うえ
        U.el("p", { class: "onl-lead", text: "オンラインに すると、ほかの ひとと おてつだいの スコアを くらべられるよ。ランキングは リアルタイムで かわるよ。" }),
        list("おくる もの", ["なまえの かわりの ばんごう（じどうで できる）", "えらんだ なまえ（きまった ことばの くみあわせ）", "おてつだいの スコア（おみせの レベル・あそびかた）", "おへやの かぐの ならび（みせると きめた とき だけ）", "あとで ふえる もの: ぷりくら（みせると きめた とき だけ）"]),
        list("おくらない もの", ["ほんとうの なまえ・メール・いばしょ・カメラの しゃしん"], "no"),
        U.el("p", { class: "muted", text: `データの おきばは Google の Firebase（${OnlineNet.place()}）。むりょうの はんいで つかうよ。` }),
        U.el("p", { class: "muted", text: "≡ の せっていで いつでも オフに できるよ。「みせた データを けす」で ぜんぶ けせるよ。" }),
      );
      let m = null;
      const done = (v) => { if (!m) return; const mm = m; m = null; mm.close(); resolve(v); };
      const yes = UI.btn("18さい いじょうです。<br>どういして はじめる", () => { Sound.se("ok"); done(true); }, "wide yellow onl-agree");
      const no = UI.btn("やめる", () => { Sound.se("cancel"); done(false); }, "wide onl-cancel");
      m = UI.modal({ title: "オンラインの まえに", body, cls: "onl-modal", footer: U.el("div", { class: "onl-foot" }, [yes, no]), onClose: () => { if (m) { m = null; resolve(false); } } });
    });
  },
  // なまえを えらぶ（[ことば1, ことば2]・やめたら null）
  pickName(cur = this.st().nick) {
    return new Promise((resolve) => {
      const sel = (words, v, label) => {
        const s = U.el("select", { class: "onl-nick-sel", "aria-label": label });
        words.forEach((w, i) => s.append(U.el("option", { value: String(i), text: w })));
        s.value = String(v); return s;
      };
      const a = sel(this.NICK_A, cur[0], "ようすの ことば"), b = sel(this.NICK_B, cur[1], "ものの ことば");
      const prev = U.el("div", { class: "onl-nick-prev" });
      const upd = () => { prev.textContent = this.nickText([+a.value, +b.value]); };
      a.addEventListener("change", upd); b.addEventListener("change", upd); upd();
      const dice = UI.btn("おまかせ", () => { Sound.se("tap"); const n = this.randomNick(); a.value = String(n[0]); b.value = String(n[1]); upd(); }, "small onl-dice");
      const body = U.el("div", { class: "onl-nick" }, [U.el("p", { class: "muted", text: "みんなに みえる なまえだよ。ことばを 2つ えらんでね。" }), prev, U.el("div", { class: "onl-nick-row" }, [a, b]), dice]);
      let m = null;
      const done = (v) => { if (!m) return; const mm = m; m = null; mm.close(); resolve(v); };
      const ok = UI.btn("けってい", () => { Sound.se("ok"); done([+a.value, +b.value]); }, "wide yellow onl-nick-ok");
      m = UI.modal({ title: "なまえを えらぶ", body, cls: "onl-modal", footer: U.el("div", { class: "onl-foot" }, [ok]), onClose: () => { if (m) { m = null; resolve(null); } } });
    });
  },
  // ≡ の せってい の なか（refresh: せってい を かきなおす）
  settings(el, refresh) {
    const box = U.el("div", { class: "onl-settings" });
    box.append(U.el("div", { class: "note", text: "オンライン（みんなと スコアを くらべる）" }));
    if (!OnlineNet.ready()) {
      box.append(U.el("div", { class: "muted onl-soon", text: "オンラインは じゅんびちゅう だよ。" }));
      el.append(box); return;
    }
    const st = this.st();
    if (this.on()) {
      const state = U.el("div", { class: "onl-state on" });
      state.append(U.el("span", { text: "オン・なまえ: " }), U.el("b", { text: this.nickText(st.nick) }));
      box.append(state);
      box.append(UI.btn("なまえを かえる", async () => {
        const n = await this.pickName(st.nick);
        if (!n) return;
        try { await this.rename(n); UI.toast("なまえを かえたよ", "good"); } catch (e) { UI.toast("いまは つながらないよ。なまえは つぎに つながった ときに かわるよ"); }
        refresh();
      }, "wide onl-rename"));
      box.append(UI.btn("オンラインを とめる", async () => {
        if (!(await UI.confirm("オンラインを とめる？\n（みせた データは のこるよ。けす ときは「みせた データを けす」）", "とめる", "やめる"))) return;
        this.stop(); UI.toast("オンラインを とめたよ"); refresh();
      }, "wide onl-stop"));
    } else {
      box.append(U.el("div", { class: "muted", text: "ほかの ひとと おてつだいの スコアを くらべられるよ（18さい いじょうの かただけ）。" }));
      box.append(UI.btn("オンラインを はじめる", async () => { if (await this.begin()) refresh(); }, "wide yellow onl-begin"));
    }
    if (OnlineNet.hasAccount()) box.append(UI.btn("みせた データを けす", async () => {
      if (!(await UI.confirm("みせた データ（なまえ・スコア）を ぜんぶ けす？\n（もとに もどせません。てもとの きろくは のこるよ）", "けす", "やめる"))) return;
      try { await this.wipe(); UI.toast("けしたよ", "good"); } catch (e) { UI.toast("いまは けせないよ。ネットに つないで もういちど ためしてね"); }
      refresh();
    }, "wide onl-wipe"));
    el.append(box);
  },

  // ---- すまほの「みんな」----
  phoneView(el, ph) {
    this.closeAll();
    const box = U.el("div", { class: "onl-app" });
    el.append(box);
    if (ph && typeof ph.onLeave === "function") ph.onLeave(() => this.closeAll());
    if (!OnlineNet.ready()) { box.append(U.el("div", { class: "note onl-soon", text: "オンラインは じゅんびちゅう だよ。もう すこし まってね。" })); return; }
    const st = this.st();
    if (!this.on()) {
      box.append(U.el("p", { class: "onl-lead", text: "オンラインに すると、ほかの ひとと おてつだいの スコアを くらべられるよ。ランキングは リアルタイムで かわるよ。" }));
      box.append(U.el("p", { class: "muted", text: "18さい いじょうの かただけ つかえます。" }));
      box.append(UI.btn("オンラインを はじめる", async () => { if (await this.begin()) { el.innerHTML = ""; this.phoneView(el, ph); } }, "wide yellow onl-start"));
      return;
    }
    // タブ: ランキング と ほかの ぶぶん（おうち など）
    const tabs = [{ id: "rank", name: "ランキング", render: (pane) => this.rankView(pane) }, ...this.parts.filter((p) => p.render)];
    const bar = U.el("div", { class: "tabs smaho-tabs onl-tabs" }), pane = U.el("div", { class: "onl-pane" });
    const leaveAll = () => { this.closeAll(); for (const p of this.parts) if (p.leave) p.leave(); };
    const show = (id) => {
      const t = tabs.find((x) => x.id === id) || tabs[0];
      this.tab = t.id; leaveAll();
      bar.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === t.id));
      pane.replaceChildren(); t.render(pane, ph);
    };
    if (tabs.length > 1) for (const t of tabs) {
      const b = U.el("button", { class: "tab onl-tab", text: t.name });
      b.dataset.k = t.id;
      b.addEventListener("click", () => { Sound.se("tap"); show(t.id); });
      bar.append(b);
    }
    box.append(U.el("div", { class: "onl-me" }, [U.el("span", { text: "あなた: " }), U.el("b", { text: this.nickText(st.nick) })]));
    if (tabs.length > 1) box.append(bar);
    box.append(pane);
    if (ph && typeof ph.onLeave === "function") ph.onLeave(leaveAll);
    show(this.tab);
    this.sync().catch(() => {});
  },
  // ランキングの タブ（おみせを えらぶ・上位 30・リアルタイム）
  rankView(box) {
    const st = this.st(), boards = this.boards();
    const sel = U.el("select", { class: "onl-board", "aria-label": "おみせを えらぶ" });
    for (const b of boards) sel.append(U.el("option", { value: b.id, text: b.name + (st.best[b.id] ? `（${U.fmt(st.best[b.id].s)}）` : "") }));
    const pick = boards.find((b) => b.id === this.last) || boards.find((b) => st.best[b.id]) || boards[0];
    sel.value = pick.id;
    const view = { status: U.el("div", { class: "onl-status", role: "status" }), list: U.el("ol", { class: "onl-rank" }), mine: U.el("div", { class: "onl-mine" }) };
    box.append(sel, view.status, view.list, view.mine);
    sel.addEventListener("change", () => { Sound.se("tap"); this.last = sel.value; this.watch(sel.value, view); });
    this.watch(sel.value, view);
  },
  // ボードを みはる（ストリーム）
  watch(board, view) {
    this.closeAll();
    const w = { board, view, data: {}, seen: null, loaded: false, h: null, state: "", toastAt: 0 };
    this.watching = w;
    this.showState(w);
    this.render(w);
    w.h = OnlineNet.listen(`v1/scores/${board}`, (ev) => {
      if (this.watching !== w) return;
      if (ev.type === "state") { w.state = ev.state; this.showState(w); return; }
      w.data = OnlineNet.apply(w.data, ev);
      const first = !w.loaded;
      w.loaded = true;
      this.render(w, first);
    });
  },
  closeAll() { const w = this.watching; this.watching = null; if (w && w.h) w.h.close(); },
  showState(w) { w.view.status.textContent = this.STATE_TEXT[w.state] || this.STATE_TEXT[""]; w.view.status.dataset.state = w.state; },
  // サーバーの ボードの データ → ならべた きろく
  rows(data) {
    const out = [];
    for (const [uid, v] of Object.entries(data && typeof data === "object" ? data : {})) {
      if (!/^[\w-]{1,128}$/.test(uid) || !v || typeof v !== "object") continue;
      const s = Number(v.s);
      if (!Number.isFinite(s) || s < 0) continue;
      out.push({ uid, s: Math.min(this.MAX, Math.floor(s)), n: typeof v.n === "string" ? v.n : "", t: Number.isFinite(Number(v.t)) ? Number(v.t) : 0,
        l: Number.isInteger(v.l) && v.l > 0 && v.l < 100 ? v.l : 0, m: GameEconomy.modes[v.m] ? v.m : "" });
    }
    return out.sort((a, b) => b.s - a.s || a.t - b.t || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  },
  render(w, first = false) {
    const { list, mine } = w.view, uid = OnlineNet.uid(), rows = this.rows(w.data);
    list.innerHTML = "";
    if (!w.loaded) { list.append(U.el("li", { class: "onl-empty", text: "よみこんで いるよ…" })); mine.textContent = ""; return; }
    rows.slice(0, this.TOP).forEach((r, i) => {
      const li = U.el("li", { class: "onl-row" + (r.uid === uid ? " me" : "") + (i < 3 ? " top" + (i + 1) : "") + (!first && w.seen && w.seen.get(r.uid) !== r.s ? " fresh" : "") });
      li.dataset.uid = r.uid;
      const sub = [r.l ? `Lv.${r.l}` : "", r.m ? GameEconomy.modes[r.m].name : ""].filter(Boolean).join("・");
      li.append(U.el("span", { class: "onl-no", text: String(i + 1) }), U.el("span", { class: "onl-name", text: this.nickText(this.parseNick(r.n)) + (r.uid === uid ? "（あなた）" : "") }),
        U.el("span", { class: "onl-score", text: U.fmt(r.s) }), U.el("span", { class: "onl-sub", text: sub }));
      list.append(li);
    });
    if (!rows.length) list.append(U.el("li", { class: "onl-empty", text: "まだ だれも いないよ。さいしょの きろくを つくろう！" }));
    const i = rows.findIndex((r) => r.uid === uid);
    mine.textContent = i < 0 ? "あなたの きろくは まだ ないよ。この おみせで おてつだいしよう！" : i >= this.TOP ? `あなたは ${i + 1}い（${U.fmt(rows[i].s)}）` : "";
    // ほかの ひとの あたらしい きろく（3びょうに 1かい まで）
    if (!first && w.seen) {
      const nw = rows.find((r) => r.uid !== uid && w.seen.get(r.uid) !== r.s);
      if (nw && Date.now() - w.toastAt > 3000) { w.toastAt = Date.now(); UI.toast(`${this.nickText(this.parseNick(nw.n))}さんが ${U.fmt(nw.s)}！`); }
    }
    w.seen = new Map(rows.map((r) => [r.uid, r.s]));
  },
};

// すまほの「みんな」アプリ（いちばん うしろ）
Smaho.ICON.online = `<circle cx="22" cy="23" r="14" fill="#9CD8F0" stroke="${INK}" stroke-width="2.6"/><path d="M8.4,23 H35.6 M22,9 C14.6,15 14.6,31 22,37 M22,9 C29.4,15 29.4,31 22,37" fill="none" stroke="${INK}" stroke-width="1.8"/><path d="M13,14.6 C16.6,15.6 27.4,15.6 31,14.6 M13,31.4 C16.6,30.4 27.4,30.4 31,31.4" fill="none" stroke="${INK}" stroke-width="1.6"/><path d="M32,4.6 C35.4,5.8 38,8.4 39.2,11.8 M30.8,8.4 C32.8,9.1 34.4,10.6 35.2,12.6" fill="none" stroke="#E35D5B" stroke-width="2.4" stroke-linecap="round"/>`;
Smaho.APPS.push({ id: "online", name: "みんな", color: "#A8DCEB", render(el, ph) { Online.phoneView(el, ph); } });
