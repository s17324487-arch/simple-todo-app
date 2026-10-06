// オンライン PR2（E5・UI-95）: ほかの 人の おうちを 見に いく（見るだけ）。すまほの「みんな」の「おうち」タブ。
// オーナーの 許可（2026-10-05）「Firebase に送るのは、…・おへやの家具の並び・…だけ」。
// - じぶんの おへや（おにわ いがいの もって いる おへや）を「みせる」と きめた とき だけ おくる: かべがみ・ゆか・ひろさ・おへやの しゅるい・
//   かぐの しゅるいと ばしょ・むき・かべの がわ・フィギュア だいの フィギュア・なまえの コード・サーバーの じこく。「みせるのを やめる」で けす。
// - みんなの おへや: あたらしい じゅんに LIST けん（v1/roomlist）→ タップで その おへや（v1/rooms/{uid}）を よんで、おうちと おなじ 絵で 描く。
//   さわれない（見るだけ）。3人は いつも いっしょ なので、3人で あそびに いった ことに して ドアの まえに たつ。
// - よんだ データは しんじない: しらない かぐ・へんな ばしょ・へんな フィギュアは すてる（あたらしい バージョンの かぐは 見えない だけ）。
const OnlineRooms = {
  MAX: 80,
  LIST: 40,
  ID_RE: /^[a-z0-9_]{1,40}$/,
  list: null,
  view: null,
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
      if (typeof FigureStand !== "undefined" && FigureStand.isStand(it.id)) { const g = FigureStand.figsOf(it); if (g.some(Boolean)) o.g = g.map((x) => x || "").join(","); }
      items.push(o);
    }
    return { n: Online.nickCode(), t: { ".sv": "timestamp" }, k: id, w: r.wall, f: r.floor, z: Save.d.rooms.expanded[id] ? "e" : "s", ...(items.length ? { i: items } : {}) };
  },
  // ---- よんだ データ → 見る ための へや（しんじない）----
  decode(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const room = {
      n: Online.parseNick(v.n), t: Number.isFinite(Number(v.t)) ? Number(v.t) : 0,
      k: typeof v.k === "string" && HomeRooms.catalog.some((r) => r.id === v.k) ? v.k : "main",
      wall: this.own(WALL_INDEX, v.w) ? v.w : WALLPAPERS[0].id, floor: this.own(FLOOR_INDEX, v.f) ? v.f : FLOORS[0].id,
      size: v.z === "e" ? "expanded" : "standard", items: [],
    };
    const raw = v.i && typeof v.i === "object" ? Object.values(v.i) : [];
    for (const o of raw.slice(0, 100)) {
      if (!o || typeof o !== "object" || !this.ID_RE.test(o.a) || !this.own(FURN_INDEX, o.a) || !Number.isFinite(o.x) || !Number.isFinite(o.y)) continue;
      const it = { uid: "v" + room.items.length, id: o.a, x: this.num(o.x), y: this.num(o.y), flip: o.r === true };
      if (o.s === "l") it.wallSide = "left";
      if (typeof FigureStand !== "undefined" && FigureStand.isStand(o.a) && typeof o.g === "string") it.figs = o.g.slice(0, 600).split(",").slice(0, 12).map((x) => (this.ID_RE.test(x) && this.own(FURN_INDEX, x) && FigureStand.isFigure(x) ? x : null));
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

  // ---- 見る（おうちと おなじ 投影・絵。HouseScene の かわりの ちいさな「ば」）----
  stage(room, cw) {
    const size = HomeDesign.sizes[room.size] || HomeDesign.sizes.standard, b = HomeDesign.bounds(size), s = cw / b.w, WALL = HomeDesign.H, W = size.w, D = size.d;
    const vs = {
      room, size, b, s, cw, ch: Math.ceil(b.h * s), zoom: 1, dark: 0, music: null, chars: [], life: { furniture: {} }, ox: -b.x * s, oy: -b.y * s,
      toScreen(x, y, z = 0) { const p = HomeDesign.project(x, y - WALL, z); return { x: this.ox + p.x * s, y: this.oy + p.y * s }; },
      depth(p) { return p.x + p.y - WALL; },
      anchor(it) { const m = HomeDesign.model(it.id, it); return { x: U.clamp(it.x, m.footW / 2 + 6, W - m.footW / 2 - 6), y: U.clamp(it.y, WALL + m.footD + 6, WALL + D - 6) }; },
      wallPoint(it, x = it.x, y = it.y) { return it.wallSide === "left" ? this.toScreen(0, WALL + x, WALL - y) : this.toScreen(x, WALL, WALL - y); },
      itemRect(it) {
        const f = FURN_INDEX[it.id];
        if (f.kind === "wall") {
          const ps = [-1, 1].flatMap((x) => [-1, 1].map((y) => this.wallPoint(it, it.x + (x * f.w) / 2, it.y + (y * f.h) / 2)));
          const x = Math.min(...ps.map((p) => p.x)), y = Math.min(...ps.map((p) => p.y));
          return { x, y, w: Math.max(...ps.map((p) => p.x)) - x, h: Math.max(...ps.map((p) => p.y)) - y };
        }
        const a = this.anchor(it), p = this.toScreen(a.x, a.y), m = HomeDesign.model(it.id, it);
        return { x: p.x + m.x * s, y: p.y + m.y * s, w: m.w * s, h: m.h * s };
      },
    };
    // 3人は いっしょに あそびに きた（ひだりの ドアの まえ）
    vs.kids = Save.d.order.map((id, i) => ({ id, x: [62, 104, 70][i], y: WALL + [96, 70, 140][i] }));
    vs.kidSize = HOUSE_SIZE * s;
    return vs;
  },
  kidOpts(id, pose) { const d = Save.d.chars[id]; return { pose, dir: "down", face: "happy", outfit: d.outfit, color: d.color }; },
  furnCanvas(it) {
    const f = FURN_INDEX[it.id], opts = { flip: !!it.flip };
    if (it.id === "window" && typeof Weather !== "undefined") opts.sky = Weather.sky();
    if (typeof FurnLive !== "undefined") FurnLive.opts(it, opts);
    const key = "furn:" + it.id + ":" + JSON.stringify(opts), m = f.kind === "wall" ? { w: f.w + 24, h: f.h + 24 } : HomeDesign.model(it.id, opts);
    return [key, () => Art.furnSvg(it.id, opts), Math.ceil(m.w * 2), Math.ceil(m.h * 2)];
  },
  bgArgs(vs) { const r = vs.room, b = vs.b; return ["visit-room:" + r.wall + ":" + r.floor + ":" + r.size, () => HomeDesign.roomSvg(r.wall, r.floor, vs.size), Math.ceil(b.w * 2), Math.ceil(b.h * 2)]; },
  preload(vs) {
    const kids = vs.kids.flatMap((c) => ["idle_01", "idle_02"].map((p) => [c.id, this.kidOpts(c.id, p)]));
    return Promise.all([SvgCache.ensure(...this.bgArgs(vs)), ...vs.room.items.map((it) => SvgCache.ensure(...this.furnCanvas(it))), Chara.preload(kids, vs.kidSize)]);
  },
  // 1まい 描く（k: canvas の 1 px が なん ドットか）
  draw(ctx, vs, k = 1) {
    const { b, s, room } = vs, base = () => ctx.setTransform(k, 0, 0, k, 0, 0);
    base();
    ctx.fillStyle = "#E7E4D4"; ctx.fillRect(0, 0, vs.cw, vs.ch);
    const bg = SvgCache.get(...this.bgArgs(vs));
    if (bg) ctx.drawImage(bg, vs.ox + b.x * s, vs.oy + b.y * s, b.w * s, b.h * s);
    const list = [];
    for (const it of room.items) { const kd = FURN_INDEX[it.id].kind; list.push({ z: kd === "wall" ? -2000 : kd === "rug" ? -1000 : vs.depth(vs.anchor(it)), draw: () => this.drawFurn(ctx, vs, it) }); }
    for (const c of vs.kids) list.push({ z: vs.depth(c) + 0.5, draw: () => this.drawKid(ctx, vs, c) });
    list.sort((p, q) => p.z - q.z);
    for (const x of list) { x.draw(); base(); }
  },
  drawFurn(ctx, vs, it) {
    const f = FURN_INDEX[it.id], image = SvgCache.get(...this.furnCanvas(it)), r = vs.itemRect(it), s = vs.s;
    ctx.save();
    if (image && f.kind === "wall") {
      const p = vs.wallPoint(it, it.x - f.w / 2, it.y - f.h / 2), sign = it.wallSide === "left" ? -1 : 1, pad = Art.FURN_PAD;
      ctx.transform(sign * HomeDesign.A * s, HomeDesign.B * s, 0, s, p.x, p.y);
      ctx.drawImage(image, -pad, -pad, f.w + pad * 2, f.h + pad * 2);
    } else if (image) ctx.drawImage(image, r.x, r.y, r.w, r.h);
    ctx.restore();
    // うごく ぶぶん（とけい・さかな・フィギュア だいの フィギュア など）。かけない ものが あっても へやは みせる
    try {
      if (typeof FurnLive !== "undefined") FurnLive.draw(ctx, vs, it, r);
      if (f.puzzlePrize && typeof PuzzlePrizeArt !== "undefined") PuzzlePrizeArt.draw(ctx, it.id, r, G.t, false);
    } catch (e) { /* draw() が base() で もとに もどす */ }
  },
  drawKid(ctx, vs, c) {
    const p = vs.toScreen(c.x, c.y), s = vs.s, pose = Math.floor((G.t || 0) * 1.6 + vs.kids.indexOf(c)) % 2 ? "idle_02" : "idle_01";
    ctx.fillStyle = "rgba(31,29,27,0.16)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 24 * s, 7 * s, 0, 0, 7); ctx.fill();
    Chara.draw(ctx, c.id, this.kidOpts(c.id, pose), p.x, p.y, vs.kidSize);
  },
  // 見る まど
  async open(entry) {
    this.close();
    const name = Online.nickText(entry.n), body = U.el("div", { class: "onl-visit" });
    const msg = U.el("div", { class: "onl-empty onl-visit-msg", text: "よみこんで いるよ…" });
    body.append(msg);
    const v = { entry, room: null, vs: null, raf: 0, closed: false, cv: null, drawn: 0 };
    this.view = v;
    v.m = UI.modal({ title: `${name}さんの おへや`, body, cls: "onl-visit-panel", onClose: () => { v.closed = true; cancelAnimationFrame(v.raf); if (this.view === v) this.view = null; } });
    let room = null;
    try { room = await this.fetchRoom(entry.uid); } catch (e) { room = null; }
    if (v.closed) return v;
    if (!room) { msg.textContent = "この おへやは もう みられないよ（けされたか、よめなかったよ）。"; return v; }
    v.room = room;
    const cw = Math.max(240, Math.min(560, Math.floor(body.clientWidth || 320))), vs = this.stage(room, cw), k = Math.min(2, window.devicePixelRatio || 1);
    const cv = U.el("canvas", { class: "onl-visit-cv", role: "img", "aria-label": `${name}さんの おへやの え` });
    cv.width = Math.ceil(cw * k); cv.height = Math.ceil(vs.ch * k); cv.style.width = cw + "px"; cv.style.height = vs.ch + "px";
    const cap = U.el("div", { class: "onl-visit-cap" }, [
      U.el("b", { text: this.roomName(room.k) }), U.el("span", { text: `かぐ ${room.items.length}こ${room.t ? "・" + this.when(room.t) : ""}` }),
    ]);
    v.cv = cv; v.vs = vs;
    msg.textContent = "3人で あそびに きたよ（みるだけ）。";
    body.replaceChildren(cv, cap, msg);
    await this.preload(vs);
    const ctx = cv.getContext("2d");
    const loop = () => { if (v.closed) return; this.draw(ctx, vs, k); v.drawn++; v.raf = requestAnimationFrame(loop); };
    loop();
    return v;
  },
  close() { const v = this.view; this.view = null; if (v && !v.closed && v.m) v.m.close(); },

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
    box.append(U.el("div", { class: "onl-room-head" }, [U.el("b", { text: "みんなの おへや" }), reload]), list);
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
        b.addEventListener("click", () => { Sound.se("ok"); this.open(r); });
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
  leave: () => OnlineRooms.close(),
  wipe: (uid, up) => { up[`rooms/${uid}`] = null; up[`roomlist/${uid}`] = null; },
  rename: (uid, up, code) => { if (OnlineRooms.shown()) { up[`rooms/${uid}/n`] = code; up[`roomlist/${uid}/n`] = code; } },
});
