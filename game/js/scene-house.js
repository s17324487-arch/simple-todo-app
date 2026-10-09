// おうち（たまごっち風の へや）。ごはん・なでる・あそぶ・きがえ・もようがえ・ねる
const ROOM = { get W() { return HomeDesign.W; }, get H() { return HomeDesign.H + HomeDesign.D; }, WALL: HomeDesign.H };
const HOUSE_SIZE = 84; // へやの中のキャラの大きさ

const Room = {
  // その 画面で 描いて いる へや。おじゃま（js/online-visit.js）の ときは よんだ よその おへや（セーブには ない・かえない）
  of(sc) { return (sc && sc.guest && sc.guest.room) || Save.d.room; },
  comfort() {
    const r = Save.d.room;
    let c = ((WALL_INDEX[r.wall] || {}).comfort || 0) + ((FLOOR_INDEX[r.floor] || {}).comfort || 0);
    for (const it of r.items) c += (FURN_INDEX[it.id] || {}).comfort || 0;
    return c;
  },
  placed(id) { return HomeRooms.all().reduce((n, r) => n + r.items.filter(i => i.id === id).length, 0); },
  available(id) { return (Save.d.furn[id] || 0) - this.placed(id); },
  bestBed() {
    const beds = Save.d.room.items.filter((i) => FURN_INDEX[i.id] && FURN_INDEX[i.id].sleep);
    beds.sort((a, b) => FURN_INDEX[b.id].sleep - FURN_INDEX[a.id].sleep);
    return beds[0] || null;
  },
  stars() { const c = this.comfort(); return c >= 45 ? 5 : c >= 32 ? 4 : c >= 20 ? 3 : c >= 10 ? 2 : 1; },
};

const HOUSE_ICONS = {
  food: `<svg viewBox="0 0 64 64" width="30" height="30">${FOOD_ART.onigiri}</svg>`,
  play: `<svg viewBox="0 0 64 64" width="30" height="30"><circle cx="32" cy="32" r="22" fill="#FFF" ${IS()}/><path d="M12,26 C24,32 40,32 52,26 M14,42 C26,36 38,36 50,42" fill="none" stroke="#E35D5B" stroke-width="5"/><circle cx="32" cy="32" r="22" fill="none" ${IS()}/></svg>`,
  dress: `<svg viewBox="0 0 64 64" width="30" height="30"><path d="M20,10 L28,14 C30,18 34,18 36,14 L44,10 L58,20 L52,30 L46,26 L46,56 L18,56 L18,26 L12,30 L6,20 Z" fill="#7EC8F0" ${IS()}/><path d="${starPath(32, 36, 7, 3)}" fill="#FFE066" ${IS(2)}/></svg>`,
  deco: `<svg viewBox="0 0 64 64" width="30" height="30"><rect x="10" y="18" width="44" height="22" rx="9" fill="#F48FB1" ${IS()}/><rect x="6" y="32" width="52" height="16" rx="6" fill="#F8A5C2" ${IS()}/><path d="M14,48 L14,56 M50,48 L50,56" ${IS(4)}/></svg>`,
  sleep: `<svg viewBox="0 0 64 64" width="30" height="30"><path d="M40,8 C24,10 14,24 16,38 C18,52 32,60 46,56 C34,54 26,44 26,32 C26,20 32,12 40,8 Z" fill="#FFE066" ${IS()}/><path d="M44,20 h8 l-8,10 h8" fill="none" ${IS(2.6)}/></svg>`,
  out: `<svg viewBox="0 0 64 64" width="30" height="30"><rect x="14" y="6" width="36" height="52" rx="4" fill="#C98A52" ${IS()}/><rect x="20" y="12" width="24" height="18" rx="3" fill="#E2B982" ${IS(2)}/><circle cx="42" cy="36" r="3" fill="#F7C948" ${IS(1.6)}/><path d="${heartPath(32, 21, 1.1)}" fill="#F06292"/></svg>`,
};

class HouseScene {
  async enter(p = {}) {
    DailyPlay.visit();
    this.mode = null;
    this.zoom = 1; this.pan = { x: 0, y: 0 };
    this.fingers = new Map(); this.pinch = null; this.gesture = false;
    this.fxs = [];
    HomeLife.init(this);
    this.chars = Save.d.order.map((id, i) => ({ id, x: 160 + i * 80, y: 430 + (i % 2) * 35, dir: "down", state: "idle", t: U.rand(0.5, 2.5), anim: Math.random() * 2, emo: null, hidden: false, jumpT: -1 }));
    this.layout();
    await Promise.all([this.preloadChars(), this.preloadFurn(), this.buildBg()]);
    Sound.bgm("house");
    UI.showHud(true, HomeGarden.active()?"おにわ":"おうち");
    Save.d.world = { ...TownRenewal.homeExit(), house: true };
    this.buildUI();
    this.statusTimer = setInterval(() => this.updateCare(), 1500);
    // パソコンでは マウスの ホイール（トラックパッドの ピンチ）で ズーム
    this.onWheel = (e) => { e.preventDefault(); if (!this.pinchable() || Game.inputLocked) return; const r = G.canvas.getBoundingClientRect(); this.zoomAt(this.zoom * Math.exp(-U.clamp(e.deltaY, -120, 120) * 0.0022), ((e.clientX - r.left) / r.width) * G.W, ((e.clientY - r.top) / r.height) * G.H); };
    G.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    if (p.intro) setTimeout(() => this.intro(), 500);
    else if (p.msg) setTimeout(() => UI.toast(p.msg), 400);
  }
  exit() {
    clearInterval(this.statusTimer);
    if (this.onWheel) G.canvas.removeEventListener("wheel", this.onWheel);
    if (this.ui) this.ui.remove();
    if (this.editUI) this.editUI.remove();
    if (this.tools) this.tools.remove();
    UI.showHud(false);
  }
  // へやの 絵の うえと したの あき（うえの HUD・したの ボタンの ぶん）。[うえ, した]
  insets() {
    const editing = this.mode === "edit";
    // もようがえの 一覧を ひろげた ときは へやを うえの のこりに おさめる（ほぼ ぜんぶ の ときは したに かくれて よい。js/furn-tray.js）
    return [editing || this.watching ? 112 : 194, editing ? Math.max(174, Math.min(G.H * 0.62, (this.editUI?.getBoundingClientRect().height || 0) / G.cssPerUnit + 8)) : this.watching ? 65 : 142];
  }
  layout() {
    const b = HomeDesign.bounds(), [top, bottom] = this.insets();
    this.view = { top, bottom: G.H - bottom };
    this.baseScale = Math.min((G.W - 18) / b.w, Math.max(80, G.H - top - bottom) / b.h);
    this.s = this.baseScale * (this.zoom || 1);
    this.actorScale = this.s * 1.35;
    const maxX = Math.max(0, b.w * this.s - G.W + 36) / 2;
    const maxY = Math.max(0, b.h * this.s - (G.H - top - bottom)) / 2;
    this.pan.x = U.clamp(this.pan.x, -maxX, maxX); this.pan.y = U.clamp(this.pan.y, -maxY, maxY);
    this.ox = (G.W - b.w * this.s) / 2 - b.x * this.s + this.pan.x;
    this.oy = top + (G.H - top - bottom - b.h * this.s) / 2 - b.y * this.s + this.pan.y;
    this.parentButton?.classList.toggle("hidden", !!this.mode);
    this.placeTools();
  }
  resize() { if (this.editUI) FurnTray.apply(this); else this.layout(); }
  // ---- ズーム: 2本ゆびの ピンチ（オーナーの FB 2026-09-30。ボタンは ない）----
  // 1〜ZMAX ばい。ゆびの まんなかの ところを ゆびの 下に のこしたまま 大きく／小さく する（2本ゆびで うごかす ことも できる）。
  // いちばん 小さく すると ぜんたいが 見える もとの 画面（まんなか）に もどる。
  // さいだいは 3ばい（オーナーの FB 2026-10-02「もう少し上げて」。まえは 2ばい）。1.6ばいを こえると かぐ と へやは こまかい 絵（rasterK）。
  // 3ばい・4ばいの おへや（UI-114）は ぜんたいが ちいさく みえる ので 4ばい・5ばいまで
  get ZMAX() { return ({ x3: 4, x4: 5 })[this.guest ? HomeDesign.guestSize : HomeDesign.sizeKey(Save.d.rooms.active)] || 3; }
  pinchable() { return (!this.mode || this.mode === "edit") && !this.climb && !UI.busy; }
  zoomAt(z, cx, cy, q = null) {
    const s0 = this.s, p = q || { x: (cx - this.ox) / s0, y: (cy - this.oy) / s0 }; // ゆびの 下の 点（へやの 絵の 座標）
    this.zoom = U.clamp(z, 1, this.ZMAX);
    if (this.zoom < 1.01) { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.layout(); return; }
    this.layout();
    this.pan.x += cx - (this.ox + p.x * this.s); this.pan.y += cy - (this.oy + p.y * this.s);
    this.layout();
  }
  startPinch() {
    const [a, b] = [...this.fingers.values()], cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    if (this.drag?.moved) Save.mark();
    this.drag = null; this.panDrag = null; this.gesture = true;
    if (this.mode === "edit" && this.sel !== this.touchSel) this.select(this.touchSel || null);
    this.pinch = { ids: [a.id, b.id], d0: Math.max(24, Math.hypot(a.x - b.x, a.y - b.y)), z0: this.zoom, q: { x: (cx - this.ox) / this.s, y: (cy - this.oy) / this.s }, actor: HOUSE_SIZE * this.actorScale };
  }
  movePinch() {
    const P = this.pinch, [a, b] = P.ids.map((id) => this.fingers.get(id));
    this.zoomAt(P.z0 * Math.max(24, Math.hypot(a.x - b.x, a.y - b.y)) / P.d0, (a.x + b.x) / 2, (a.y + b.y) / 2, P.q);
  }
  toScreen(x, y, z = 0) { const p = HomeDesign.project(x, y - ROOM.WALL, z); return { x: this.ox + p.x * this.s, y: this.oy + p.y * this.s }; }
  toRoom(sx, sy) { const p = HomeDesign.inverse((sx - this.ox) / this.s, (sy - this.oy) / this.s); return { x: p.x, y: p.y + ROOM.WALL }; }
  depth(p) { return p.x + p.y - ROOM.WALL; }
  anchor(it) {
    const m = HomeDesign.model(it.id, it);
    return { x: U.clamp(it.x, m.footW / 2 + 6, ROOM.W - m.footW / 2 - 6), y: U.clamp(it.y, ROOM.WALL + m.footD + 6, ROOM.H - 6) };
  }
  wallPoint(it, x = it.x, y = it.y) {
    return it.wallSide === "left" ? this.toScreen(0, ROOM.WALL + x, ROOM.WALL - y) : this.toScreen(x, ROOM.WALL, ROOM.WALL - y);
  }
  wallRoom(it, p) {
    const sign = it.wallSide === "left" ? -1 : 1, u = (p.x - this.ox) / (sign * HomeDesign.A * this.s);
    return { x: u, y: ROOM.WALL + (p.y - this.oy) / this.s - HomeDesign.B * u };
  }
  actorRect(c, parent = false) {
    const p = this.toScreen(c.x, c.y), scale = this.actorScale;
    return { x: p.x - Math.max(22, 34 * scale), y: p.y - (parent ? 105 : 86) * scale, w: Math.max(44, 68 * scale), h: (parent ? 116 : 94) * scale };
  }
  contains(r, p, pad = 0) { return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad; }

  // ---- 読み込み ----
  charOpts(c, pose, dir, face) {
    const d = Save.d.chars[c.id];
    return { pose, dir, face, outfit: d.outfit, color: d.color };
  }
  baseFace(c) {
    const d = Save.d.chars[c.id];
    if (d.hunger < 20 || d.mood < 25) return "sad";
    if (d.mood > 72) return "happy";
    return "normal";
  }
  preloadChars() {
    const list = [];
    for (const c of this.chars) {
      const f = this.baseFace(c);
      for (const dir of ["down", "left", "right", "up"]) for (const pose of ["idle_01", "idle_02", "walk_01", "walk_02"]) list.push([c.id, this.charOpts(c, pose, dir, f)]);
      for (const pose of ["jump_01", "land_01", "idle_02"]) list.push([c.id, this.charOpts(c, pose, "down", "love")]);
    }
    return Chara.preload(list, HOUSE_SIZE * this.actorScale);
  }
  // 絵の こまかさ（へやの 1 が 絵の なん px か）。1.6ばいより 大きく ズームした ときは 3 の こまかい 絵に かえる。
  // 2しゅるい だけ なので SvgCache の キーは ふえすぎない。こまかい 絵が できる までは いつもの 絵で 描く（きえない）。
  rasterK() { return this.zoom > 1.6 ? 3 : 2; }
  furnCanvas(it, ensure, k = ensure ? 2 : this.rasterK()) {
    const f = FURN_INDEX[it.id];
    const opts = { flip: !!it.flip };
    if (it.id === "window") opts.sky = Weather.sky();
    if (typeof FurnLive !== "undefined") FurnLive.opts(it, opts);
    const key = "furn:" + it.id + ":" + JSON.stringify(opts);
    const m = f.kind === "wall" ? { w: f.w + 24, h: f.h + 24 } : HomeDesign.model(it.id, opts);
    // Fixed raster sizes keep zooming and dragging out of the cache key.
    const pw = Math.ceil(m.w * k), ph = Math.ceil(m.h * k);
    const fn = () => Art.furnSvg(it.id, opts);
    if (ensure) return SvgCache.ensure(key, fn, pw, ph);
    return SvgCache.get(key, fn, pw, ph) || (k !== 2 ? this.furnCanvas(it, false, 2) : null);
  }
  preloadFurn() { return Promise.all(Room.of(this).items.map((it) => this.furnCanvas(it, true))); }
  buildBg() {
    const r = Room.of(this), size = HomeDesign.size(), b = HomeDesign.bounds(size), yard = !this.guest && HomeGarden.active();
    // ドアの いろ（UI-111）も キーに（よその おへやは はじめの いろ）
    const doors = this.guest ? HomeDoorColors.DEFAULT : HomeDoorColors.cur();
    const key = "house-design:" + (this.guest ? "guest" : Save.d.rooms.active) + ":" + r.wall + ":" + r.floor + ":" + size.w + "x" + size.d + ":" + HomeDoorColors.sig(doors), fn = () => yard ? HomeGarden.svg(size) : HomeDesign.roomSvg(r.wall, r.floor, size, doors);
    // いつもの 絵は 2（3ばい・4ばいの おへやは 450まん px まで に おさえる。UI-114）
    const k0 = Math.min(2, Math.sqrt(4.5e6 / (b.w * b.h)));
    this.bgArgs = [key, fn, Math.ceil(b.w * k0), Math.ceil(b.h * k0)];
    // ズームの ときの こまかい 絵（3。ひろい へやは 900まん px まで に おさえる）
    const k = Math.min(3, Math.sqrt(9e6 / (b.w * b.h)));
    this.bgFine = [key, fn, Math.ceil(b.w * k), Math.ceil(b.h * k)];
    return SvgCache.ensure(...this.bgArgs);
  }
  bgImage() { return (this.rasterK() > 2 && SvgCache.get(...this.bgFine)) || SvgCache.get(...this.bgArgs); }

  // ---- UI ----
  buildUI() {
    this.ui = U.el("div");
    this.care = U.el("div", { class: "care-bar" });
    this.bar = U.el("div", { class: "house-bar" });
    const B = (icon, label, fn, cls = "") => {
      const b = U.el("button", { class: "btn " + cls, html: `${HOUSE_ICONS[icon]}<span>${label}</span>` });
      b.addEventListener("click", () => { if (this.mode || UI.busy || Game.trans) return; Sound.se("tap"); fn(); });
      return b;
    };
    this.bar.append(
      B("food", "ごはん", () => this.menuFood(), "yellow"),
      B("play", "あそぶ", () => this.menuPlay(), "pink"),
      B("dress", "きがえ", () => this.menuDress(), "blue"),
      B("deco", "もようがえ", () => this.startEdit(), "green"),
      B("sleep", "ねる", () => this.sleep()),
      B("out", "おでかけ", () => this.goOut()),
      B("play", "みまもる", () => HomeLife.toggle(this)),
      B("deco", "おへや", () => HomeRooms.open(this)),
    );
    this.ui.append(this.care, this.bar);
    this.watchExit = UI.btn("みまもりを おわる", () => HomeLife.toggle(this), "watch-exit hidden yellow");
    this.ui.append(this.watchExit);
    this.parentButton=UI.btn("ぱぱ・まま",()=>{if(!this.mode&&!UI.busy)ParentCare.open(this);},"parent-open small");
    this.ui.append(this.parentButton);
    document.getElementById("ui").append(this.ui);
    this.updateCare();
  }
  updateCare() {
    if (!this.care) return;
    this.care.innerHTML = Save.d.order.map((id) => {
      const c = Save.d.chars[id];
      return `<div class="mini"><div class="lbl"><span>${c.name}</span><span>Lv${c.lv}</span></div>
        <div class="lbl" style="font-size:9px"><span>${c.hunger>=90?(id==="gachan"?"はらぺん":"はらぱん"):"おなか"}</span></div>${UI.meter(c.hunger, 100, "hunger")}
        <div class="lbl" style="font-size:9px;margin-top:2px"><span>ごきげん</span></div>${UI.meter(c.mood, 100, "mood")}</div>`;
    }).join("");
  }
  showBar(on) { this.bar.classList.toggle("hidden", !on); this.care.classList.toggle("hidden", !on); this.parentButton.classList.toggle("hidden", !on); }

  async intro() {
    HomeLife.converse(this,[{who:'wanko',text:'ここが ぼくたちの おうち！'},{who:'gachan',text:'ごはんボタンで ごはんを たべよう♪'},{who:'goji',text:'ぼくたちを タップして なでてね！'}]);
  }

  // ---- ごはん ----
  menuFood() {
    const bag = Save.d.bag;
    const foods = FOODS.filter((f) => bag[f.id] > 0);
    const body = U.el("div");
    if (!foods.length) body.append(U.el("div", { class: "note", text: "たべものが ないよ……。まちの スーパーで かってこよう！" }));
    // はたけの やさいで りょうり（js/farm-cook.js）。まどを とじたら ごはんに もどる
    if (typeof FarmCook !== "undefined") body.prepend(UI.btn("とれたて りょうりを つくる", () => { m.close(); FarmCook.open(() => { if (G.scene === this) this.menuFood(); }); }, "farm-cook-btn"));
    const grid = U.el("div", { class: "grid" });
    for (const f of foods) {
      const card = U.el("button", { class: "card", html: `<span class="cnt">×${bag[f.id]}</span>${UI.icon("bag", f.id, 46)}<div>${f.name}</div><div class="muted food-gain">${FoodBalance.gainHtml(f)}</div>` });
      card.addEventListener("click", async () => {
        Sound.se("tap");
        const opts = Save.d.order.map((id) => Save.d.chars[id].name + (CHARA_INFO[id].like.includes(f.id) ? " ♥" : ""));
        if (bag[f.id] >= 3) opts.push("みんなに あげる");
        opts.push("やめる");
        const i = await UI.ask(`${f.name}を だれに あげる？`, opts);
        if (i < 0 || opts[i] === "やめる") return;
        m.close();
        const who = opts[i] === "みんなに あげる" ? [...Save.d.order] : [Save.d.order[i]];
        this.feed(who, f.id);
      });
      grid.append(card);
    }
    body.append(grid);
    const m = UI.modal({ title: "ごはん", body });
  }
  async feed(ids, foodId) {
    this.mode = "feed";
    const spots = ids.length === 1 ? [ROOM.W / 2] : [130, 240, 350];
    ids.forEach((id, k) => {
      const c = this.chars.find((x) => x.id === id);
      c.state = "walk"; c.tx = spots[k]; c.ty = ROOM.H - 90;
      if (typeof HomeNav !== "undefined") { const q = HomeNav.near(this, c.tx, c.ty); c.tx = q.x; c.ty = q.y; } // 家具の うえには ならばない
    });
    await U.wait(900);
    for (const id of ids) {
      const c = this.chars.find((x) => x.id === id);
      c.state = "eat"; c.t = 1.7; c.dir = "down"; c.food = foodId; c.emo = "happy";
      c.x = c.tx; c.y = c.ty;
    }
    for (let i = 0; i < 3; i++) { Sound.se("eat"); await U.wait(520); }
    const res = [];
    for (const id of ids) {
      const c = this.chars.find((x) => x.id === id);
      const r = Care.feed(id, foodId);
      c.food = null;
      if (!r) continue;
      res.push(`${Save.d.chars[id].name}: ${r.text.split("\n")[0]}`);
      HomeLife.say(this,id,r.dislike?"からいのは にがて……":(Save.d.chars[id].hunger>=90?Care.fullText(id):"おいしい！")+(Save.d.chars[id].wantsDeza?" デザ ほしいな♪":""));
      this.react(c, r.emo, r.dislike ? "anger" : "heart");
      if (r.like) Sound.voice(id);
    }
    Save.d.flags.fedOnce = true;
    this.updateCare();
    await U.wait(400);
    this.mode = null;
  }
  react(c, emo = "love", fx = "heart") {
    HomeActions.cancel(c);
    c.state = "jump"; c.t = 1.2; c.jumpT = 0; c.emo = emo; c.dir = "down";
    this.fx(fx, c);
    Sound.se("jump");
  }
  fx(kind, c, extra = {}) { this.fxs.push({ kind, c, t: 0, dur: 1.2, ...extra }); }

  // ---- あそぶ ----
  async menuPlay() {
    const i = await UI.ask("なにして あそぶ？", ["かくれんぼ", "ボールあそび", "やめる"]);
    if (i === 0) this.startHide();
    else if (i === 1) this.startBall();
  }
  hideSpots() {
    const items = Room.of(this).items.filter((it) => { const f = FURN_INDEX[it.id]; return f && f.kind === "floor" && f.h >= 40; });
    const spots = items.map((it) => ({ it, ...this.anchor(it) }));
    spots.push({ door: true, x: 0, y: ROOM.WALL + 62 });
    return U.shuffle(spots);
  }
  async startHide() {
    this.mode = "hide-wait";
    this.showBar(false);
    this.dark = 0;
    HomeLife.say(this,"wanko","かくれんぼ しよう！ ぼくたちを さがしてね。");await U.wait(1800);
    this.darkTarget = 0.92;
    await U.wait(700);
    const spots = this.hideSpots();
    this.chars.forEach((c, i) => { c.hidden = true; c.spot = spots[i % spots.length]; c.state = "idle"; });
    await U.wait(600);
    this.darkTarget = 0;
    Sound.se("pop");
    UI.toast("「もういいよ〜！」 かくれている ところを タップ！");
    this.hide = { tries: 6, found: 0 };
    this.mode = "hide";
  }
  hideTap(rx, ry) {
    const H = this.hide;
    // タップした場所に近い家具（またはドア）
    let best = null, bd = 1e9;
    const cands = this.hideSpots().concat();
    for (const sp of cands) {
      const r = sp.door ? this.doorRect() : this.itemRect(sp.it), p = this.toScreen(rx, ry);
      const inside = this.contains(r, p, 8), d = Math.hypot(p.x - r.x - r.w / 2, p.y - r.y - r.h / 2);
      if (inside && d < bd) { bd = d; best = sp; }
    }
    if (!best) return;
    const who = this.chars.filter((c) => c.hidden && ((best.door && c.spot.door) || (!best.door && c.spot.it === best.it)));
    H.tries--;
    if (who.length) {
      for (const c of who) {
        c.hidden = false;
        c.x = U.clamp(best.x + (best.door ? 40 : 30), 30, ROOM.W - 30); c.y = Math.max(300, best.door ? 310 : best.y + 8);
        this.react(c, "happy", "heart");
        Sound.voice(c.id);
        H.found++;
      }
      for(const c of who)HomeLife.say(this,c.id,"みつかった〜！");
      UI.toast(`あと ${this.chars.filter((c) => c.hidden).length}にん`);
    } else {
      Sound.se("miss");
      this.fx("puff", null, { x: best.x, y: best.y - 20 });
      UI.toast(`いないみたい……（のこり ${H.tries}かい）`);
    }
    const left = this.chars.filter((c) => c.hidden);
    if (!left.length || H.tries <= 0) this.endHide();
  }
  async endHide() {
    this.mode = "hide-end";
    const left = this.chars.filter((c) => c.hidden);
    await U.wait(700);
    for (const c of left) { c.hidden = false; c.x = U.clamp(c.spot.x + 34, 30, ROOM.W - 30); c.y = Math.max(310, c.spot.y + 6); this.react(c, "happy", "note"); }
    const found = this.hide.found;
    const mood = 6 + found * 5;
    Save.careAll({ mood, bond: 2, hunger: -3 });
    await U.wait(500);
    HomeLife.say(this,this.chars[0].id,found===3?"ぜんいん みつかっちゃった！ じょうずだね！":"ここに かくれてたんだよ〜！");UI.toast(`ごきげん +${mood}`,"good");
    this.updateCare();
    this.showBar(true);
    this.mode = null;
  }
  startBall() {
    this.mode = "ball";
    this.showBar(false);
    this.ball = { x: ROOM.W / 2, y: 300, vx: U.rand(-60, 60), vy: -440, t: 22, hits: 0, spin: 0 };
    this.chars.forEach((c, i) => { c.state = "walk"; c.tx = 120 + i * 110; c.ty = ROOM.H - 100; });
    UI.toast("ボールを タップして おとさないように しよう！");
  }
  ballTap(rx, ry) {
    const b = this.ball;
    const p = this.toScreen(rx, ry), q = this.ballPoint(b);
    if (Math.hypot(p.x - q.x, p.y - q.y) > Math.max(22, 24 * this.actorScale)) return;
    b.vy = -U.rand(360, 430); b.vx = U.clamp((q.x - p.x) / this.s * 6 + U.rand(-80, 80), -160, 160);
    b.hits++;
    Sound.se("pop");
    const c = this.chars.reduce((a, x) => (Math.abs(x.x - b.x) < Math.abs(a.x - b.x) ? x : a));
    this.react(c, "happy", "note");
    c.tx = U.clamp(b.x + U.rand(-30, 30), 40, ROOM.W - 40);
  }
  ballPoint(b) { return this.toScreen(b.x, ROOM.H - 100, 442 - b.y); }
  updateBall(dt) {
    const b = this.ball;
    b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt * 0.05; b.t -= dt;
    if (b.x < 16) { b.x = 16; b.vx = Math.abs(b.vx); }
    if (b.x > ROOM.W - 16) { b.x = ROOM.W - 16; b.vx = -Math.abs(b.vx); }
    if (b.y < 24) { b.y = 24; b.vy = Math.abs(b.vy) * 0.5; }
    for (const c of this.chars) if (c.state !== "jump") { c.state = "walk"; c.tx = U.clamp(b.x + (c.id === "wanko" ? -50 : c.id === "gachan" ? 0 : 50), 40, ROOM.W - 40); c.ty = ROOM.H - 100; }
    if (b.y > 442 || b.t <= 0) this.endBall();
  }
  async endBall() {
    if (this.mode !== "ball") return;
    this.mode = "ball-end";
    const hits = this.ball.hits;
    this.ball = null;
    const mood = Math.min(28, 4 + hits * 2);
    Save.careAll({ mood, bond: hits >= 6 ? 2 : 1, hunger: -3 });
    Sound.se(hits >= 10 ? "perfect" : "good");
    HomeLife.say(this,"gachan",`ボールを ${hits}かい つないだよ！`);UI.toast(`ごきげん +${mood}`,"good");
    this.updateCare();
    this.showBar(true);
    this.mode = null;
  }

  // ---- きがえ ----
  async menuDress() {
    this.mode = "dress";
    await DressUp.open();
    await this.preloadChars();
    this.mode = null;
    this.updateCare();
    const c = U.pick(this.chars);
    this.react(c, "love", "heart");
  }

  // ---- ねる ----
  async sleep() {
    this.mode = "sleep";
    this.showBar(false);
    const bed = Room.bestBed();
    const a = bed ? this.anchor(bed) : { x: ROOM.W / 2, y: ROOM.H - 120 }, bx = a.x, by = a.y + 16;
    this.chars.forEach((c, i) => { c.state = "walk"; c.tx = U.clamp(bx + (i - 1) * 44, 40, ROOM.W - 40); c.ty = U.clamp(by + (i % 2) * 10, ROOM.WALL + 60, ROOM.H - 20); if (typeof HomeNav !== "undefined") { const q = HomeNav.near(this, c.tx, c.ty); c.tx = q.x; c.ty = q.y; } });
    this.darkTarget = 0.62;
    await U.wait(1100);
    this.chars.forEach((c) => { c.state = "sleep"; c.dir = "down"; c.x = c.tx; c.y = c.ty; });
    Sound.se("sleep");
    Sound.bgm("house");
    await U.wait(2600);
    this.darkTarget = 0;
    const perk = Stats.perk("sleep");
    const bedBonus = bed ? FURN_INDEX[bed.id].sleep * 4 : 0;
    const mood = 4 + bedBonus + (perk ? 8 : 0);
    Save.healAll();
    Save.careAll({ mood, bond: 1, hunger: -4 });
    this.chars.forEach((c) => { c.state = "idle"; c.t = U.rand(0.5, 1.5); this.react(c, "happy", "note"); });
    Sound.se("fanfare");
    await UI.say([{ name: "おうち", text: `ぐっすり ねむった！\nみんなの HPと SPが ぜんかいした。\n（ごきげん +${mood}${bed ? "・" + FURN_INDEX[bed.id].name + "で ふかふか" : ""}）` }]);
    this.updateCare();
    this.showBar(true);
    this.mode = null;
  }

  goOut() {
    this.mode = "out";
    Sound.se("door");
    Game.goto("world", TownRenewal.homeExit(), "circle");
  }

  // ---- もようがえ ----
  startEdit() {
    this.mode = "edit";
    this.showBar(false);
    this.sel = null;
    this.editTab = "furn";
    this.editUI = U.el("div", { class: "edit-bar" });
    document.getElementById("ui").append(this.editUI);
    this.renderEditBar();
  }
  renderEditBar() {
    const e = this.editUI;
    e.innerHTML = "";
    const head = U.el("div", { class: "row", style: "margin-bottom:6px" });
    const tabs = U.el("div", { class: "tabs edit-tabs", style: "margin:0;flex:1" });
    for (const [k, label] of (HomeGarden.active()?[["furn", "かぐ"]]:[["furn", "かぐ"], ["wall", "かべがみ"], ["floor", "ゆか"], ["door", "ドア"]])) {
      const b = U.el("button", { class: "tab" + (this.editTab === k ? " on" : ""), text: label });
      b.addEventListener("click", () => { this.editTab = k; Sound.se("tap"); this.renderEditBar(); });
      tabs.append(b);
    }
    head.append(tabs, UI.btn("おわる", () => this.endEdit(), "small yellow"));
    const info = U.el("div", { class: "muted", html: `いごこち ${"★".repeat(Room.stars())}${"☆".repeat(5 - Room.stars())}（${Room.comfort()}）　かぐは ドラッグで うごかせるよ` });
    const tray = U.el("div", { class: "tray" });
    // かぐの カード・ひろげる つまみ・さがす／ならびかえ／しゅるい（js/furn-tray.js）
    const extra = FurnTray.build(this, { head, info, tray, furn: this.editTab === "furn" });
    let doorRow = null;
    if (this.editTab === "door") {
      // ドアの いろ（UI-111）: どの ドアか えらんで から いろの カード
      this.doorPick = this.doorPick || "toilet";
      const cur = HomeDoorColors.cur(), pick = U.el("div", { class: "row door-pick", style: "gap:6px;margin:0 0 6px" });
      for (const [k, label] of HomeDoorColors.DOORS) {
        const b = U.el("button", { class: "tab" + (this.doorPick === k ? " on" : ""), text: label, "data-door": k, style: "min-height:44px" });
        b.addEventListener("click", () => { this.doorPick = k; Sound.se("tap"); this.renderEditBar(); });
        pick.append(b);
      }
      doorRow = pick;
      for (const c of HomeDoorColors.PALETTE) {
        const card = U.el("button", { class: "card" + (cur[this.doorPick] === c.id ? " on" : ""), html: `${HomeDoorColors.icon(c.id, 50)}<div class="nm">${c.name}</div>`, "data-color": c.id });
        card.addEventListener("click", async () => {
          if (!HomeDoorColors.set(this.doorPick, c.id)) return;
          Sound.se("pop"); await this.buildBg(); if (typeof HomeFloors !== "undefined") HomeFloors.prepare(this);
          this.renderEditBar();
        });
        tray.append(card);
      }
    } else if (this.editTab !== "furn") {
      const own = this.editTab === "wall" ? WALLPAPERS.filter((w) => Save.d.room.wallpapers[w.id]) : FLOORS.filter((w) => Save.d.room.floors[w.id]);
      for (const w of own) {
        const on = this.editTab === "wall" ? Save.d.room.wall === w.id : Save.d.room.floor === w.id;
        const c = U.el("button", { class: "card" + (on ? " on" : ""), html: `${UI.icon(this.editTab, w.id, 50)}<div class="nm">${w.name}</div>` });
        c.addEventListener("click", async () => {
          if (this.editTab === "wall") Save.d.room.wall = w.id; else Save.d.room.floor = w.id;
          Save.mark(); Sound.se("pop");
          await this.buildBg();
          this.renderEditBar();
        });
        tray.append(c);
      }
      if (own.length <= 1) tray.append(U.el("div", { class: "note", text: "かぐやさんで あたらしい もようが かえるよ！" }));
    }
    e.append(head, info, ...(doorRow ? [doorRow] : []), ...extra, tray);
    FurnTray.apply(this);
  }
  async placeNew(id) {
    if (Room.available(id) <= 0 || Save.d.room.items.length >= 64) { UI.toast("おける かぐが ないよ（1へや 64こまで）"); return; }
    const f = FURN_INDEX[id];
    if(HomeGarden.active()&&f.kind==="wall")return;
    const r = Save.d.room;
    const it = { uid: r.nextUid++, id, x: ROOM.W / 2, y: f.kind === "wall" ? 110 : 440, flip: false };
    // なるべく ほかの家具と かさならない場所をさがす
    const same = r.items.filter((o) => (FURN_INDEX[o.id].kind === "wall") === (f.kind === "wall"));
    let best = null, bestScore = 1e9;
    const ys = f.kind === "wall" ? [60, 110, 160] : f.kind === "rug" ? [430, 500, 560] : [320, 380, 440, 500, 560];
    if (f.kind !== "wall") for (let y = 620; y <= ROOM.H - 30; y += 60) ys.push(y);
    for (const y of ys) for (let x = f.w / 2 + 6; x <= ROOM.W - f.w / 2 - 6; x += 24) {
      const cand = { ...it, x, y };
      this.clampItem(cand);
      const a = this.itemRect(cand);
      let ov = 0;
      for (const o of same) {
        const b = this.itemRect(o);
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (w > 0 && h > 0) ov += w * h;
      }
      const score = ov + Math.abs(x - ROOM.W / 2) * 0.5;
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    if (best) { it.x = best.x; it.y = best.y; }
    this.clampItem(it);
    r.items.push(it);
    Save.mark();
    Sound.se("pop");
    await this.furnCanvas(it, true);
    this.select(it);
    this.renderEditBar();
  }
  clampItem(it) {
    const f = FURN_INDEX[it.id];
    if (f.kind === "wall") {
      it.x = U.clamp(it.x, f.w / 2 + 6, (it.wallSide === "left" ? HomeDesign.D : ROOM.W) - f.w / 2 - 6);
      it.y = U.clamp(it.y, f.h / 2 + 8, ROOM.WALL - f.h / 2 - 20);
    } else Object.assign(it, this.anchor(it));
  }
  itemRect(it) {
    const f = FURN_INDEX[it.id];
    if (f.kind === "wall") {
      const ps = [-1, 1].flatMap(x => [-1, 1].map(y => this.wallPoint(it, it.x + x * f.w / 2, it.y + y * f.h / 2)));
      const x = Math.min(...ps.map(p => p.x)), y = Math.min(...ps.map(p => p.y));
      return { x, y, w: Math.max(...ps.map(p => p.x)) - x, h: Math.max(...ps.map(p => p.y)) - y };
    }
    const a = this.anchor(it), p = this.toScreen(a.x, a.y), m = HomeDesign.model(it.id, it);
    return { x: p.x + m.x * this.s, y: p.y + m.y * this.s, w: m.w * this.s, h: m.h * this.s };
  }
  doorRect() {
    const a = this.wallPoint({ wallSide: "left" }, 94, ROOM.WALL - 145), b = this.wallPoint({ wallSide: "left" }, 30, ROOM.WALL);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y + 64 * HomeDesign.B * this.s };
  }
  hitItem(rx, ry) {
    const p = this.toScreen(rx, ry);
    const order = this.drawOrder().reverse();
    for (const it of order) {
      const f = FURN_INDEX[it.id], r = this.itemRect(it);
      if (f.kind === "wall") {
        const q = this.wallRoom(it, p);
        if (Math.abs(q.x - it.x) <= f.w / 2 + 4 && Math.abs(q.y - it.y) <= f.h / 2 + 4) return it;
      } else if (this.contains(r, p)) {
        const img = this.furnCanvas(it, false);
        if (!img || img.getContext("2d").getImageData(Math.min(img.width-1, Math.floor((p.x-r.x)/r.w*img.width)), Math.min(img.height-1, Math.floor((p.y-r.y)/r.h*img.height)), 1, 1).data[3] > 24) return it;
      }
    }
    return order.find(it => FURN_INDEX[it.id].kind !== "rug" && this.contains(this.itemRect(it), p, Math.max(3, (44-Math.min(this.itemRect(it).w,this.itemRect(it).h))/2))) || null;
  }
  drawOrder() {
    const items = Room.of(this).items, kind = it => FURN_INDEX[it.id].kind;
    return [...items.filter(i => kind(i) === "wall"), ...items.filter(i => kind(i) === "rug"), ...items.filter(i => kind(i) === "floor").sort((a, b) => this.depth(this.anchor(a)) - this.depth(this.anchor(b)))];
  }
  select(it) {
    this.sel = it;
    if (this.tools) this.tools.remove();
    this.tools = null;
    if (!it) return;
    this.tools = U.el("div", { class: "edit-tools" });
    this.tools.append(
      UI.btn("はんてん", async () => { it.flip = !it.flip; this.clampItem(it); this.placeTools(); Save.mark(); Sound.se("tap"); await this.furnCanvas(it, true); }, "small"),
      UI.btn("しまう", () => {
        Save.d.room.items = Save.d.room.items.filter((x) => x !== it);
        Save.mark(); Sound.se("cancel"); this.select(null); this.renderEditBar();
      }, "small pink"),
    );
    if (FURN_INDEX[it.id].kind === "wall") this.tools.append(UI.btn("かべを かえる", () => {
      it.wallSide = it.wallSide === "left" ? "back" : "left"; this.clampItem(it); Save.mark(); this.placeTools(); Sound.se("tap");
    }, "small"));
    document.getElementById("ui").append(this.tools);
    this.placeTools();
  }
  placeTools() {
    if (!this.tools || !this.sel) return;
    const r = this.itemRect(this.sel), width = (this.tools.getBoundingClientRect().width || 180) / G.cssPerUnit;
    this.tools.style.left = U.clamp(r.x + r.w / 2, width / 2 + 8, G.W - width / 2 - 8) * G.cssPerUnit + "px";
    this.tools.style.top = U.clamp(r.y - 8, 160, this.view.bottom - 8) * G.cssPerUnit + "px";
  }
  endEdit() {
    Sound.se("ok");
    this.select(null);
    this.editUI.remove(); this.editUI = null;
    this.mode = null;
    this.showBar(true);
    this.layout();
    UI.toast(`いごこち ${"★".repeat(Room.stars())}（${Room.comfort()}）<br>いごこちが いいと ごきげんが へりにくいよ`, "good");
    this.chars.forEach((c) => { c.state = "idle"; c.t = 0.3; });
  }

  // ---- 入力 ----
  // 2本めの ゆびが ついたら ピンチ（かぐの ドラッグ・画面の ドラッグは やめる）。ピンチの あとは ゆびを ぜんぶ はなすまで タップに しない
  down(p) {
    for (const id of this.fingers.keys()) if (!Game.pointers.has(id)) this.fingers.delete(id); // はなした ことに きづかなかった ゆび
    if (!this.fingers.size) this.touchSel = this.sel; // ピンチに なったら えらんで いた かぐに もどす
    this.fingers.set(p.id, p);
    if (this.fingers.size >= 2) { if (!this.pinch && this.fingers.size === 2 && this.pinchable()) this.startPinch(); return; }
    if (this.gesture) return;
    const r = this.toRoom(p.x, p.y);
    if (this.mode === "ball") { this.ballTap(r.x, r.y); return; }
    if (this.mode === "edit") {
      const it = this.hitItem(r.x, r.y);
      this.select(it);
      if (it) {
        const q = FURN_INDEX[it.id].kind === "wall" ? this.wallRoom(it, p) : r;
        const a = FURN_INDEX[it.id].kind === "wall" ? it : this.anchor(it);
        this.drag = { it, dx: q.x - a.x, dy: q.y - a.y, moved: false, sx: p.x, sy: p.y }; return;
      }
    }
    if (!this.mode || this.mode === "edit") this.panDrag = { sx: p.x, sy: p.y, x: this.pan.x, y: this.pan.y, moved: false };
  }
  move(p) {
    if (this.pinch) { if (this.pinch.ids.includes(p.id)) this.movePinch(); return; }
    if (this.gesture || this.fingers.size > 1) return;
    if (this.panDrag) {
      const d = this.panDrag;
      if (Math.hypot(p.x - d.sx, p.y - d.sy) < 6 && !d.moved) return;
      d.moved = true; this.pan = { x: d.x + p.x - d.sx, y: d.y + p.y - d.sy }; this.layout(); return;
    }
    if (this.mode !== "edit" || !this.drag) return;
    const d = this.drag, r = FURN_INDEX[d.it.id].kind === "wall" ? this.wallRoom(d.it, p) : this.toRoom(p.x, p.y);
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 6) return;
    d.moved = true; d.it.x = r.x - d.dx; d.it.y = r.y - d.dy;
    this.clampItem(d.it); this.placeTools();
  }
  up(p) {
    this.fingers.delete(p.id);
    if (this.pinch && this.pinch.ids.includes(p.id)) { this.actorHold = this.pinch.actor; this.pinch = null; }
    if (this.gesture) { if (!this.fingers.size) this.gesture = false; return; }
    const panned = this.panDrag?.moved; this.panDrag = null;
    if (this.mode === "edit") {
      if (this.drag?.moved) { Save.mark(); Sound.se("tap"); }
      this.drag = null; return;
    }
    if (!p.tap || panned) return;
    const r = this.toRoom(p.x, p.y);
    if (this.mode === "hide") { this.hideTap(r.x, r.y); return; }
    if (this.mode) return;
    if (this.life.quarrel && HomeLife.settle(this)) return;
    const actors = [...this.chars, ...this.parents].filter(c => !c.hidden).sort((a, b) => this.depth(b) - this.depth(a));
    const c = actors.find(c => this.contains(this.actorRect(c, this.parents.includes(c)), p));
    if (c) { if (!this.parents.includes(c)) this.pet(c); return; }
    const it = this.hitItem(r.x, r.y);
    if (it && FURN_INDEX[it.id].interactive) {
      if (typeof FurnLive !== "undefined" && FurnLive.tap(this, it)) return;
      this.life.furniture[it.uid] = 6; Sound.se(it.id === "musicbox" || it.id === "piano" ? "fanfare" : "pop"); HomeLife.say(this, U.pick(this.chars).id, "わあ！ うごいた♪");
    }
  }
  // 入力が とまって いる あいだに ゆびを はなした（会話・画面の きりかえ）
  cancel(p) {
    this.fingers.delete(p.id); this.panDrag = null;
    if (this.drag?.moved) Save.mark();
    this.drag = null;
    if (this.pinch && this.pinch.ids.includes(p.id)) { this.actorHold = this.pinch.actor; this.pinch = null; }
    if (!this.fingers.size) this.gesture = false;
  }
  pet(c) {
    const d = Save.d.chars[c.id];
    const now = Date.now();
    this.react(c, "love", "heart");
    Sound.voice(c.id);
    if (now - (d.lastPet || 0) > 15000) { d.lastPet = now; Save.care(c.id, { mood: 3, bond: 1 }); this.updateCare(); }
    const lines = {
      wanko: ["えへへ、くすぐったい！", "もっと なでて〜", "ワン！ だいすき！"],
      gachan: ["ぴよぴよ〜♪", "ふわふわでしょ？", "えへへ、うれしい！"],
      goji: ["ガォー♪", "ガゥー♪", "ごろごろ……", "もっと〜"],
    }[c.id];
    HomeLife.say(this,c.id,d.hunger<25?"おなか すいた……":d.hunger>=90?Care.fullText(c.id):U.pick(lines));
  }
  key(k, down) {
    if (!down) return;
    if (k === "cancel" && !this.mode) Game.openMenu();
  }

  // ---- 更新 ----
  update(dt) {
    HomeLife.update(this, dt);
    ParentCare.update(this,dt);
    HomeActions.update(this,dt);
    for (const c of this.chars) this.updateChar(c, dt);
    this.fxs = this.fxs.filter((f) => (f.t += dt) < f.dur);
    if (this.darkTarget != null) this.dark = (this.dark || 0) + (this.darkTarget - (this.dark || 0)) * Math.min(1, dt * 4);
    if (this.mode === "ball" && this.ball) this.updateBall(dt);
    if (Math.random() < dt * 0.05 && !this.mode) {
      // ときどき ひとりごと
      const c = U.pick(this.chars);
      const d = Save.d.chars[c.id];
      if (c.state === "idle") this.fx(d.hunger < 25 ? "sweat" : d.mood > 70 ? "note" : "dots", c);
    }
  }
  updateChar(c, dt) {
    if (document.hidden || UI.busy) return;
    c.anim += dt;
    if (c.jumpT >= 0) { c.jumpT += dt; if (c.jumpT > 0.7) c.jumpT = -1; }
    if (c.hidden) return;
    switch (c.state) {
      case "walk": {
        const sp = this.mode === "ball" ? 120 : 52;
        // 家具を よけて あるく（js/home-nav.js。つまる ときだけ とおりぬけを ゆるす）
        if (typeof HomeNav !== "undefined") { if (HomeNav.walk(this, c, sp, dt)) { c.state = "idle"; c.t = U.rand(1.5, 4.5); c.dir = "down"; } break; }
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d < 2) { c.state = "idle"; c.t = U.rand(1.5, 4.5); c.dir = "down"; break; }
        c.x += (dx / d) * Math.min(d, sp * dt); c.y += (dy / d) * Math.min(d, sp * dt);
        c.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        break;
      }
      case "idle":
        if(this.parents.some(p=>p.target===c.id))break;
        c.t -= dt;
        if (c.t <= 0 && !this.mode) {
          const r = Math.random();
          if (r < 0.58) { c.state = "walk"; c.tx = U.rand(50, ROOM.W - 50); c.ty = U.rand(ROOM.WALL + 90, ROOM.H - 35); }
          // 大きなしぐさは HomeActions の15秒タイマーに任せる。
          else { c.t = U.rand(1.5, 3.5); c.dir = U.pick(["down", "down", "left", "right"]); }
        }
        break;
      case "jump": case "eat":
        c.t -= dt;
        if (c.t <= 0) { c.state = "idle"; c.t = U.rand(1, 3); c.emo = null; }
        break;
      case "sleep":
        break;
    }
  }
  pose(c) {
    if (c.jumpT >= 0) {
      const t = c.jumpT;
      if (t < 0.1) return ["idle_02", 0];
      if (t < 0.45) return ["jump_01", Math.sin(((t - 0.1) / 0.35) * Math.PI) * 26];
      if (t < 0.6) return ["land_01", 0];
      return ["idle_01", 0];
    }
    if (c.state === "walk") return [["idle_01", "walk_01", "idle_01", "walk_02"][Math.floor(c.anim * 8) % 4], 0];
    if (c.state === "eat") return [Math.floor(c.anim / 0.16) % 2 ? "idle_02" : "idle_01", 0];
    if (c.state === "sleep") return [Math.floor(c.anim / 1.1) % 2 ? "idle_02" : "idle_01", 0];
    return [Math.floor(c.anim / 0.5) % 2 ? "idle_02" : "idle_01", 0];
  }

  // ---- 描画 ----
  render(ctx) {
    ctx.fillStyle = "#E7E4D4"; ctx.fillRect(0, 0, G.W, G.H);
    const own = !this.guest; // おじゃま（js/online-visit.js）では じぶんの おうちの 2かい・ドアの ふだは 描かない
    if (own && typeof HomeFloors !== "undefined") HomeFloors.drawUnder(ctx, this); // 2かい: いない ほうの かい（へやの 絵の まえ）
    const bg = this.bgImage(), b = HomeDesign.bounds();
    if (bg) {
      ctx.save(); ctx.shadowColor = "rgba(69,49,29,.22)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
      ctx.drawImage(bg, this.ox + b.x * this.s, this.oy + b.y * this.s, b.w * this.s, b.h * this.s); ctx.restore();
    }
    if (own && typeof HomeFloors !== "undefined") HomeFloors.drawAfterBg(ctx, this); // 2かい: かべの かぐ・しきもの・かいだん
    if (own && typeof HomeDoors !== "undefined") HomeDoors.drawSigns(ctx, this); // ドアの うえの ふだ（かべに はる）
    if (this.mode === "edit") this.drawEditOverlay(ctx);
    const s = this.s;
    const list = [];
    const items = this.drawOrder();
    if (this.mode !== "edit") for (const p of this.parents) list.push({ z:this.depth(p),draw:()=>ParentCare.draw(this,ctx,p) });
    for (const it of items) {
      const f = FURN_INDEX[it.id];
      const z = f.kind === "wall" ? -2000 : f.kind === "rug" ? -1000 : this.depth(this.anchor(it));
      list.push({ z, draw: () => this.drawFurn(ctx, it) });
    }
    for (const c of this.chars) {
      if (c.hidden) continue;
      list.push({ z: this.depth(c) + 0.5, draw: () => this.drawChar(ctx, c) });
    }
    if (typeof PetWalk !== "undefined") PetWalk.houseDrawables(this, list, ctx); // いぬの さんぽ（UI-49・js/pet-walk.js）
    if (typeof HomePlay !== "undefined" && HomePlay.drawables) HomePlay.drawables(this, list, ctx); // あそぶ・よむ・しゅくだいの ゆかの ばん（UI-106・js/home-play.js）
    list.sort((a, b) => a.z - b.z);
    for (const x of list) x.draw();
    if (this.ball) this.drawBall(ctx);
    this.drawFx(ctx);
    // よる・かくれんぼ の暗さ
    const night = DayTint.isNight() ? 0.22 : 0;
    const dk = Math.max(night, this.dark || 0);
    if (dk > 0.01) {
      ctx.fillStyle = `rgba(20,24,60,${dk})`;
      ctx.fillRect(0, 0, G.W, G.H);
      if (this.mode === "sleep") for (const c of this.chars) { const p = this.toScreen(c.x, c.y); this.zzz(ctx, p.x + 18 * s, p.y - 80 * s); }
    }
    if (typeof FurnLive !== "undefined") FurnLive.lights(ctx, this);
    if (this.mode === "hide") this.drawHideHint(ctx);
    HomeLife.draw(this, ctx);
  }
  drawFurn(ctx, it) {
    const f = FURN_INDEX[it.id], image = this.furnCanvas(it, false), r = this.itemRect(it), s = this.s;
    ctx.save();
    const moving = this.life.furniture[it.uid] > 0;
    if (moving) { const x = r.x + r.w / 2, y = r.y + r.h; ctx.translate(x, y); ctx.rotate(Math.sin(G.t * 9) * .025); ctx.translate(-x, -y); }
    if (image && f.kind === "wall") {
      const p = this.wallPoint(it, it.x - f.w / 2, it.y - f.h / 2), sign = it.wallSide === "left" ? -1 : 1, pad = Art.FURN_PAD;
      ctx.transform(sign * HomeDesign.A * s, HomeDesign.B * s, 0, s, p.x, p.y);
      ctx.drawImage(image, -pad, -pad, f.w + pad * 2, f.h + pad * 2);
    } else if (image) ctx.drawImage(image, r.x, r.y, r.w, r.h);
    ctx.restore();
    if (typeof FurnLive !== "undefined") FurnLive.draw(ctx, this, it, r);
    if (f.puzzlePrize) PuzzlePrizeArt.draw(ctx, it.id, r, G.t, moving);
    if (moving) { FX.note(ctx, r.x + r.w / 2, r.y - 6); FX.star(ctx, r.x + r.w, r.y + 10, 5, "#FFE066"); }
    if (this.mode === "edit" && this.sel === it) {
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = "#F29A1F"; ctx.lineWidth = 2;
      U.rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 6); ctx.stroke(); ctx.restore();
    }
  }
  drawChar(ctx, c) {
    const s = this.actorScale;
    const [pose, dy] = this.pose(c);
    const p = this.toScreen(c.x, c.y);
    const motion = HomeActions.visual(c);
    const face = motion?.face || (c.state === "sleep" ? "sleep" : c.emo || this.baseFace(c));
    ctx.fillStyle = "rgba(31,29,27,0.16)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y, (24 - dy * 0.2) * s, 7 * s, 0, 0, 7); ctx.fill();
    const alpha = this.mode === "edit" ? 0.35 : 1;
    if (motion) {
      ctx.save();ctx.translate(p.x+motion.x*s,p.y+motion.y*s);ctx.rotate(motion.angle);ctx.scale(motion.sx,motion.sy);
      this.charSprite(ctx,c.id,this.charOpts(c,motion.pose,motion.dir,face),0,0,alpha*motion.alpha);ctx.restore();
      HomeActions.props(this,ctx,c,p,s);
    } else this.charSprite(ctx, c.id, this.charOpts(c, pose, c.state === "sleep" ? "down" : c.dir, face), p.x, p.y - dy * s, alpha);
    if (c.state === "eat" && c.food) {
      const k = 1 - Math.max(0, c.t) / 1.7;
      const sz = 30 * s * (1 - k * 0.6);
      const key = "icon:" + c.food;
      const pw = Math.ceil(sz * G.px);
      const ic = SvgCache.get(key, () => Art.iconSvg("bag", c.food), Math.max(8, Math.ceil(30 * s * G.px)), Math.max(8, Math.ceil(30 * s * G.px)));
      if (ic) ctx.drawImage(ic, p.x - sz / 2, p.y - 46 * s - sz / 2 + Math.sin(c.anim * 20) * 1.5, sz, sz);
      if (Math.floor(c.anim * 3) % 2) { ctx.font = `800 ${11 * s}px 'M PLUS Rounded 1c', sans-serif`; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.fillText("もぐもぐ", p.x, p.y - 96 * s); }
    }
  }
  // 3人の 絵（大きさ HOUSE_SIZE × actorScale）。ピンチの あいだは ピンチの まえの 大きさの 絵を のばして 描き、
  // おわった あとも いまの 大きさの 絵が できる まで それで 描く（ズームの とちゅうで 絵を 何まいも 作らない・きえない）。
  charSprite(ctx, id, o, x, y, alpha) {
    const size = HOUSE_SIZE * this.actorScale;
    let raster = this.pinch ? this.pinch.actor : size;
    if (!this.pinch && this.actorHold && !Chara.ready(id, o, size)) raster = this.actorHold;
    if (Math.abs(raster - size) < 0.5) return Chara.draw(ctx, id, o, x, y, size, alpha);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / raster, size / raster); Chara.draw(ctx, id, o, 0, 0, raster, alpha); ctx.restore();
  }
  drawBall(ctx) {
    const b = this.ball, s = this.actorScale;
    const p = this.ballPoint(b);
    ctx.fillStyle = "rgba(31,29,27,0.14)";
    const g = this.toScreen(b.x, ROOM.H - 100);
    ctx.beginPath(); ctx.ellipse(g.x, g.y, 14 * s, 4 * s, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.spin);
    ctx.fillStyle = "#FFF"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 16 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = "#E35D5B"; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.arc(0, -22 * s, 16 * s, 0.6, Math.PI - 0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 22 * s, 16 * s, Math.PI + 0.6, -0.6); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 16 * s, 0, 7); ctx.stroke();
    ctx.restore();
    ctx.font = "900 20px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = INK;
    ctx.fillText(`${b.hits} かい　のこり ${Math.ceil(b.t)}びょう`, G.W / 2, 94);
  }
  drawFx(ctx) {
    const s = this.actorScale;
    for (const f of this.fxs) {
      const k = f.t / f.dur;
      const base = f.c ? this.toScreen(f.c.x, f.c.y) : this.toScreen(f.x, f.y);
      const x = base.x, y = base.y - (f.c ? 92 * s : 0) - k * 18;
      ctx.save(); ctx.globalAlpha = 1 - k * k;
      if (f.kind === "heart") { FX.heart(ctx, x - 12, y + 4, 7); FX.heart(ctx, x + 12, y - 4, 6); }
      else if (f.kind === "note") FX.note(ctx, x + 10, y);
      else if (f.kind === "sweat") FX.sweat(ctx, x + 22 * s, y + 20);
      else if (f.kind === "anger") this.anger(ctx, x + 18 * s, y + 10);
      else if (f.kind === "dots") { ctx.fillStyle = INK; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 8 + i * 8, y + 10, 2.2, 0, 7); ctx.fill(); } }
      else if (f.kind === "puff") { ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (8 + k * 18), y + Math.sin(a) * (6 + k * 12), 7 * (1 - k * 0.5), 0, 7); ctx.fill(); ctx.stroke(); } }
      ctx.restore();
    }
  }
  anger(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = "#E8262A"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath();
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(x + dx * 3, y + dy * 3); ctx.quadraticCurveTo(x + dx * 3, y + dy * 9, x + dx * 9, y + dy * 3); }
    ctx.stroke(); ctx.restore();
  }
  zzz(ctx, x, y) {
    const t = G.t;
    ctx.save(); ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.font = "900 14px 'M PLUS Rounded 1c', sans-serif";
    for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; ctx.strokeText("Z", x + k * 12, y - k * 20); ctx.fillText("Z", x + k * 12, y - k * 20); }
    ctx.restore();
  }
  drawEditOverlay(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
    for (let x = 0; x <= ROOM.W; x += 60) {
      const a = this.toScreen(x, ROOM.WALL), b = this.toScreen(x, ROOM.H); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let y = ROOM.WALL; y <= ROOM.H; y += 60) {
      const a = this.toScreen(0, y), b = this.toScreen(ROOM.W, y); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
  drawHideHint(ctx) {
    const t = `のこり ${this.hide.tries}かい ／ みつけた ${this.hide.found}にん`;
    ctx.save();
    ctx.font = "800 14px 'M PLUS Rounded 1c', sans-serif";
    const w = ctx.measureText(t).width + 26;
    U.rr(ctx, G.W / 2 - w / 2, 64, w, 30, 15);
    ctx.fillStyle = "rgba(255,253,246,0.95)"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, G.W / 2, 79);
    ctx.restore();
  }
}
SCENES.house = HouseScene;
// ほかの ファイルが つつむ まえの おうちの うごき（ドア・2かい・トイレ・おねがい などは じぶんの おうちだけ）。
// おじゃま（js/online-visit.js の VisitScene）は これを つかって、よその おうちで じぶんの おうちの しくみが うごかない ように する
const HOUSE_SCENE_BASE = Object.freeze(Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(HouseScene.prototype))
  .filter(([k, d]) => k !== "constructor" && typeof d.value === "function").map(([k, d]) => [k, d.value])));
