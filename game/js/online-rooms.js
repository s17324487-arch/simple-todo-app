// オンライン PR2（E5・UI-95）: ほかの 人の おうち。すまほの「みんな」の「おうち」タブ。
// オーナーの 許可（2026-10-05）「Firebase に送るのは、…・おへやの家具の並び・…だけ」。
// - じぶんの おへや（おにわ いがいの もって いる おへや）を「みせる」と きめた とき だけ おくる: かべがみ・ゆか・ひろさ・おへやの しゅるい・
//   かぐの しゅるいと ばしょ・むき・かべの がわ・フィギュア だいの フィギュア・テーブルの しょっき（UI-103）・なまえの コード・サーバーの じこく。「みせるのを やめる」で けす。
// - みんなの おへや: あたらしい じゅんに LIST けん（v1/roomlist）→ タップで その おへや（v1/rooms/{uid}）を よんで、3人で おじゃまする
//   （おうちと おなじ 画面で あるける・UI-97・js/online-visit.js。まえは 見るだけの まど）。よその おへやは かわらない・じぶんの セーブにも はいらない。
// - よんだ データは しんじない: しらない かぐ・へんな ばしょ・へんな フィギュアは すてる（あたらしい バージョンの かぐは 見えない だけ）。
const OnlineRooms = {
  MAX: 80,
  LIST: 40,
  ID_RE: /^[a-z0-9_]{1,40}$/,
  Z: ["s", "e", "3", "4"], // へやの ひろさ（1・2・3・4ばい。HomeDesign.SIZE_KEYS の じゅん。3・4 は UI-114）
  list: null,
  own: (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k),
  st() { return Online.st().room; },
  // みせられる おへや（おにわ は 絵の しくみが ちがう ので のぞく）
  rooms() { return HomeRooms.catalog.filter((r) => r.id !== "yard" && Save.d.rooms.owned[r.id]); },
  roomName(id) { const r = HomeRooms.catalog.find((x) => x.id === id); return r ? r.name : "おへや"; },
  roomData(id) { const rs = Save.d.rooms; return id === rs.active ? Save.d.room : (rs.stored && rs.stored[id]) || null; },
  pick() { const a = Save.d.rooms.active; return this.rooms().some((r) => r.id === a) ? a : "main"; },
  shown() { const s = this.st(); return s.shown > 0 && !!s.uid && s.uid === OnlineNet.uid(); },
  num: (v) => Math.round(Math.max(-100, Math.min(1000, v)) * 10) / 10,
  when(t) { const d = new Date(t); return Number.isFinite(t) && t > 0 ? `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : ""; },

  // ---- おくる かたち（かぐの ならび だけ）----
  encode(id) {
    const r = this.roomData(id);
    if (!r || !this.rooms().some((x) => x.id === id)) return null;
    const items = [];
    for (const it of Array.isArray(r.items) ? r.items : []) {
      if (items.length >= this.MAX) break;
      if (!it || !this.ID_RE.test(it.id) || !this.own(FURN_INDEX, it.id) || !Number.isFinite(it.x) || !Number.isFinite(it.y)) continue;
      const o = { a: it.id, x: this.num(it.x), y: this.num(it.y) };
      if (it.flip) o.r = true;
      if (it.wallSide === "left") o.s = "l";
      if (typeof FigureStand !== "undefined" && FigureStand.isHolder(it.id)) { const g = FigureStand.figsOf(it); if (g.some(Boolean)) o.g = g.map((x) => x || "").join(","); } // フィギュア だいの フィギュア・テーブルの しょっき（UI-103）
      items.push(o);
    }
    return { n: Online.nickCode(), t: { ".sv": "timestamp" }, k: id, w: r.wall, f: r.floor, z: this.Z[HomeDesign.level(id) - 1], ...(items.length ? { i: items } : {}) };
  },
  // ---- よんだ データ → 見る ための へや（しんじない）----
  decode(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const room = {
      n: Online.parseNick(v.n), t: Number.isFinite(Number(v.t)) ? Number(v.t) : 0,
      k: typeof v.k === "string" && HomeRooms.catalog.some((r) => r.id === v.k) ? v.k : "main",
      wall: this.own(WALL_INDEX, v.w) ? v.w : WALLPAPERS[0].id, floor: this.own(FLOOR_INDEX, v.f) ? v.f : FLOORS[0].id,
      size: HomeDesign.SIZE_KEYS[this.Z.indexOf(v.z)] || "standard", items: [],
    };
    const raw = v.i && typeof v.i === "object" ? Object.values(v.i) : [];
    for (const o of raw.slice(0, 100)) {
      if (!o || typeof o !== "object" || !this.ID_RE.test(o.a) || !this.own(FURN_INDEX, o.a) || !Number.isFinite(o.x) || !Number.isFinite(o.y)) continue;
      const it = { uid: "v" + room.items.length, id: o.a, x: this.num(o.x), y: this.num(o.y), flip: o.r === true };
      if (o.s === "l") it.wallSide = "left";
      if (typeof FigureStand !== "undefined" && FigureStand.isHolder(o.a) && typeof o.g === "string") it.figs = o.g.slice(0, 600).split(",").slice(0, 12).map((x) => (this.ID_RE.test(x) && this.own(FURN_INDEX, x) && FigureStand.accepts(o.a, x) ? x : null));
      room.items.push(it);
    }
    return room;
  },

  // ---- サーバー ----
  async publish(id) {
    const data = this.encode(id);
    if (!data) throw new Error("no room");
    const uid = await Online.ensure(), c = data.i ? data.i.length : 0;
    await OnlineNet.patch("v1", { [`rooms/${uid}`]: data, [`roomlist/${uid}`]: { n: data.n, t: { ".sv": "timestamp" }, c, k: id } });
    Object.assign(this.st(), { shown: Date.now(), id, uid }); Save.mark(); Save.write();
    this.list = null;
    return c;
  },
  async unpublish() {
    const uid = OnlineNet.uid();
    if (uid) await OnlineNet.patch("v1", { [`rooms/${uid}`]: null, [`roomlist/${uid}`]: null });
    Object.assign(this.st(), { shown: 0, id: "", uid: "" }); Save.mark(); Save.write();
    this.list = null;
  },
  // あたらしい じゅんに LIST けん（{ uid, n, t, c, k }）
  async load() {
    const data = await OnlineNet.get("v1/roomlist", `orderBy=${encodeURIComponent('"t"')}&limitToLast=${this.LIST}`), out = [];
    for (const [uid, v] of Object.entries(data && typeof data === "object" ? data : {})) {
      if (!/^[\w-]{1,128}$/.test(uid) || !v || typeof v !== "object") continue;
      out.push({ uid, n: Online.parseNick(v.n), t: Number.isFinite(Number(v.t)) ? Number(v.t) : 0, c: Number.isInteger(v.c) && v.c >= 0 && v.c <= 100 ? v.c : 0,
        k: typeof v.k === "string" && HomeRooms.catalog.some((r) => r.id === v.k) ? v.k : "main" });
    }
    out.sort((a, b) => b.t - a.t || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
    return (this.list = out.slice(0, this.LIST));
  },
  async fetchRoom(uid) { return /^[\w-]{1,128}$/.test(uid) ? this.decode(await OnlineNet.get(`v1/rooms/${uid}`)) : null; },

  // ---- すまほの「みんな」の「おうち」タブ ----
  tabView(el) {
    const box = U.el("div", { class: "onl-rooms" }), st = this.st();
    // じぶんの おへや
    const sel = U.el("select", { class: "onl-room-sel", "aria-label": "みせる おへや" });
    for (const r of this.rooms()) sel.append(U.el("option", { value: r.id, text: r.name }));
    sel.value = this.shown() && this.rooms().some((r) => r.id === st.id) ? st.id : this.pick();
    const state = U.el("div", { class: "onl-room-state" });
    const show = UI.btn("", async () => {
      const id = sel.value;
      if (!(await UI.confirm(`「${this.roomName(id)}」の かぐの ならびを みんなに みせる？\n（かべがみ・ゆか・かぐの しゅるいと ばしょ だけ おくるよ）`, "みせる", "やめる"))) return;
      try { const c = await this.publish(id); UI.toast(`おへやを みせたよ（かぐ ${c}こ）`, "good"); } catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); }
      upd(); load();
    }, "wide yellow onl-room-show");
    const stop = UI.btn("みせるのを やめる", async () => {
      if (!(await UI.confirm("おへやを みせるのを やめる？\n（サーバーの おへやの データを けすよ）", "やめる", "もどる"))) return;
      try { await this.unpublish(); UI.toast("みせるのを やめたよ"); } catch (e) { UI.toast("いまは つながらないよ。あとで もういちど ためしてね"); }
      upd(); load();
    }, "wide onl-room-stop");
    const upd = () => {
      const on = this.shown();
      state.textContent = on ? `みせて いるよ（${this.roomName(this.st().id)}・${this.when(this.st().shown)}）` : "まだ みせて いないよ。";
      show.innerHTML = on ? "いまの かぐで みせなおす" : "この おへやを みせる";
      stop.hidden = !on;
    };
    box.append(U.el("div", { class: "note onl-room-note", text: "じぶんの おへや（かべがみ・ゆか・かぐの ならび だけ みせるよ）" }), sel, state, show, stop);
    // みんなの おへや
    const list = U.el("div", { class: "onl-room-list" });
    const reload = UI.btn("あたらしく する", () => { Sound.se("tap"); load(); }, "small onl-room-reload");
    box.append(U.el("div", { class: "onl-room-head" }, [U.el("b", { text: "みんなの おへや" }), reload]),
      U.el("div", { class: "note onl-room-visit-note", text: "タップすると 3人で おじゃま するよ（よその おへやは かわらないよ）" }), list);
    el.append(box);
    const render = (rows) => {
      list.replaceChildren();
      const me = OnlineNet.uid();
      if (!rows.length) { list.append(U.el("div", { class: "onl-empty", text: "まだ だれも みせて いないよ。" })); return; }
      for (const r of rows) {
        const b = U.el("button", { class: "onl-room-row" + (r.uid === me ? " me" : "") });
        b.dataset.uid = r.uid;
        b.append(U.el("span", { class: "onl-name", text: Online.nickText(r.n) + (r.uid === me ? "（あなた）" : "") }),
          U.el("span", { class: "onl-sub", text: `${this.roomName(r.k)}・かぐ ${r.c}こ${r.t ? "・" + this.when(r.t) : ""}` }));
        b.addEventListener("click", () => { Sound.se("ok"); OnlineVisit.go(r, b); });
        list.append(b);
      }
    };
    const load = async () => {
      list.replaceChildren(U.el("div", { class: "onl-empty", text: "よみこんで いるよ…" }));
      try { render(await this.load()); } catch (e) { list.replaceChildren(U.el("div", { class: "onl-empty", text: "よめなかったよ。あとで もういちど ためしてね。" })); }
    };
    upd();
    if (this.list) render(this.list); else load();
  },
};

// すまほの「みんな」に「おうち」タブ・けす／なまえを かえる ときの ぶん（js/online.js の Online.parts）
Online.parts.push({
  id: "rooms", name: "おうち",
  render: (el) => OnlineRooms.tabView(el),
  leave: () => { if (typeof OnlineVisit !== "undefined") OnlineVisit.cancel(); }, // よみこみ中に すまほを とじたら おじゃまに いかない
  wipe: (uid, up) => { up[`rooms/${uid}`] = null; up[`roomlist/${uid}`] = null; },
  rename: (uid, up, code) => { if (OnlineRooms.shown()) { up[`rooms/${uid}/n`] = code; up[`roomlist/${uid}/n`] = code; } },
});
