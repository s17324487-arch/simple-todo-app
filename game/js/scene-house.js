// おうち（たまごっち風の へや）。ごはん・なでる・あそぶ・きがえ・もようがえ・ねる
const ROOM = { W: 360, H: 460, WALL: 230 };
const HOUSE_SIZE = 84; // へやの中のキャラの大きさ

const Room = {
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
    this.mode = null;
    this.fxs = [];
    HomeLife.init(this);
    this.chars = Save.d.order.map((id, i) => ({ id, x: 120 + i * 62, y: 360 + (i % 2) * 24, dir: "down", state: "idle", t: U.rand(0.5, 2.5), anim: Math.random() * 2, emo: null, hidden: false, jumpT: -1 }));
    this.layout();
    await Promise.all([this.preloadChars(), this.preloadFurn(), this.buildBg()]);
    Sound.bgm("house");
    UI.showHud(true, "おうち");
    Save.d.world = { map: "town", x: 4, y: 6, dir: "down", house: true };
    this.buildUI();
    this.statusTimer = setInterval(() => this.updateCare(), 1500);
    if (p.intro) setTimeout(() => this.intro(), 500);
    else if (p.msg) setTimeout(() => UI.toast(p.msg), 400);
  }
  exit() {
    clearInterval(this.statusTimer);
    if (this.ui) this.ui.remove();
    if (this.editUI) this.editUI.remove();
    if (this.tools) this.tools.remove();
    UI.showHud(false);
  }
  layout() {
    const top = 112, bottom = this.watching ? 40 : 138;
    const availH = G.H - top - bottom;
    this.s = Math.min(G.W / ROOM.W, Math.max(0.62, availH / ROOM.H));
    this.ox = (G.W - ROOM.W * this.s) / 2;
    this.oy = G.H - bottom + 8 - ROOM.H * this.s;
  }
  resize() { this.layout(); this.buildBg(); }
  toScreen(x, y) { return { x: this.ox + x * this.s, y: this.oy + y * this.s }; }
  toRoom(sx, sy) { return { x: (sx - this.ox) / this.s, y: (sy - this.oy) / this.s }; }

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
    return Chara.preload(list, HOUSE_SIZE * this.s);
  }
  furnCanvas(it, ensure) {
    const f = FURN_INDEX[it.id];
    const opts = { flip: !!it.flip };
    if (it.id === "window") opts.sky = Weather.sky();
    const key = "furn:" + it.id + ":" + JSON.stringify(opts);
    const pad = Art.FURN_PAD;
    const pw = Math.ceil((f.w + pad * 2) * this.s * G.px), ph = Math.ceil((f.h + pad * 2) * this.s * G.px);
    const fn = () => Art.furnSvg(it.id, opts);
    return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph);
  }
  preloadFurn() { return Promise.all(Save.d.room.items.map((it) => this.furnCanvas(it, true))); }
  buildBg() {
    const r = Save.d.room;
    const wp = WALL_INDEX[r.wall] || WALLPAPERS[0], fl = FLOOR_INDEX[r.floor] || FLOORS[0];
    const W = G.W, H = G.H, s = this.s;
    const wallY = this.oy + ROOM.WALL * s;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f2(W)} ${f2(H)}"><defs>
      <pattern id="wp" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="translate(${f2(this.ox)},${f2(this.oy)}) scale(${f2(s)})">${Art.patternSvg(wp, 64, 64)}</pattern>
      <pattern id="fl" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="translate(${f2(this.ox)},${f2(wallY)}) scale(${f2(s)})">${Art.patternSvg(fl, 64, 64)}</pattern>
      <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F1D1B" stop-opacity="0.18"/><stop offset="1" stop-color="#1F1D1B" stop-opacity="0"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="${f2(W)}" height="${f2(wallY)}" fill="url(#wp)"/>
      <rect x="0" y="${f2(wallY)}" width="${f2(W)}" height="${f2(H - wallY)}" fill="url(#fl)"/>
      <rect x="0" y="${f2(wallY)}" width="${f2(W)}" height="${f2(26 * s)}" fill="url(#sh)"/>
      <rect x="0" y="${f2(wallY - 8 * s)}" width="${f2(W)}" height="${f2(10 * s)}" fill="#FFFFFF" stroke="${INK}" stroke-width="${f2(2 * s)}"/>
      <rect x="0" y="0" width="${f2(W)}" height="${f2(this.oy)}" fill="#EAD9BD"/>
      ${Array.from({ length: Math.ceil(W / 40) + 1 }, (_, i) => `<path d="M${f2(i * 40)},0 L${f2(i * 40)},${f2(this.oy)}" stroke="#DCC7A6" stroke-width="2"/>`).join("")}
      <rect x="0" y="${f2(this.oy - 10 * s)}" width="${f2(W)}" height="${f2(14 * s)}" fill="#C98A52" stroke="${INK}" stroke-width="${f2(2 * s)}"/>
      <g transform="translate(${f2(this.ox + 290 * s)},${f2(this.oy + 4 * s)}) scale(${f2(s)})">
        <path d="M0,0 L0,26" stroke="${INK}" stroke-width="2"/>
        <path d="M-16,40 C-16,26 16,26 16,40 Z" fill="#FFE9A8" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="0" cy="42" r="4" fill="#FFF6C8" stroke="${INK}" stroke-width="1.6"/>
      </g>
      <g transform="translate(${f2(this.ox + 8 * s)},${f2(wallY - 100 * s)}) scale(${f2(s)})">
        <rect x="0" y="0" width="46" height="92" rx="4" fill="#C98A52" stroke="${INK}" stroke-width="2.2"/>
        <rect x="6" y="8" width="34" height="30" rx="3" fill="#E2B982" stroke="${INK}" stroke-width="1.6"/>
        <rect x="6" y="46" width="34" height="38" rx="3" fill="#E2B982" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="38" cy="44" r="3" fill="#F7C948" stroke="${INK}" stroke-width="1.4"/>
      </g></svg>`;
    this.bgKey = "housebg:" + r.wall + ":" + r.floor + ":" + f2(W) + "x" + f2(H) + ":" + f2(s) + ":" + f2(this.oy);
    const pw = Math.round(W * G.px), ph = Math.round(H * G.px);
    this.bgArgs = [this.bgKey, () => svg, pw, ph];
    return SvgCache.ensure(...this.bgArgs);
  }

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
  showBar(on) { this.bar.classList.toggle("hidden", !on); this.care.classList.toggle("hidden", !on); }

  async intro() {
    HomeLife.say(this,"wanko","ここが ぼくたちの おうち！");
    HomeLife.say(this,"gachan","ごはんボタンで ごはんを たべよう♪");
    HomeLife.say(this,"goji","ぼくたちを タップして なでてね！");
  }

  // ---- ごはん ----
  menuFood() {
    const bag = Save.d.bag;
    const foods = FOODS.filter((f) => bag[f.id] > 0);
    const body = U.el("div");
    if (!foods.length) body.append(U.el("div", { class: "note", text: "たべものが ないよ……。まちの スーパーで かってこよう！" }));
    const grid = U.el("div", { class: "grid" });
    for (const f of foods) {
      const card = U.el("button", { class: "card", html: `<span class="cnt">×${bag[f.id]}</span>${UI.icon("bag", f.id, 46)}<div>${f.name}</div><div class="muted">おなか+${f.hunger || 0}</div>` });
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
    const spots = ids.length === 1 ? [180] : [110, 180, 250];
    ids.forEach((id, k) => {
      const c = this.chars.find((x) => x.id === id);
      c.state = "walk"; c.tx = spots[k]; c.ty = 410;
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
    const items = Save.d.room.items.filter((it) => { const f = FURN_INDEX[it.id]; return f && f.kind === "floor" && f.h >= 40; });
    const spots = items.map((it) => ({ it, x: it.x, y: it.y }));
    spots.push({ door: true, x: 31, y: ROOM.WALL - 4 });
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
      const f = sp.door ? { w: 46, h: 92 } : FURN_INDEX[sp.it.id];
      const cx = sp.x, cy = sp.y - f.h / 2;
      const inside = Math.abs(rx - cx) < f.w / 2 + 8 && Math.abs(ry - cy) < f.h / 2 + 10;
      const d = Math.hypot(rx - cx, ry - cy);
      if (inside && d < bd) { bd = d; best = sp; }
    }
    if (!best) return;
    const who = this.chars.filter((c) => c.hidden && ((best.door && c.spot.door) || (!best.door && c.spot.it === best.it)));
    H.tries--;
    if (who.length) {
      for (const c of who) {
        c.hidden = false;
        c.x = U.clamp(best.x + (best.door ? 40 : 30), 30, 330); c.y = Math.max(300, best.door ? 310 : best.y + 8);
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
    for (const c of left) { c.hidden = false; c.x = U.clamp(c.spot.x + 34, 30, 330); c.y = Math.max(310, c.spot.y + 6); this.react(c, "happy", "note"); }
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
    this.ball = { x: 180, y: 300, vx: U.rand(-60, 60), vy: -440, t: 22, hits: 0, spin: 0 };
    this.chars.forEach((c, i) => { c.state = "walk"; c.tx = 90 + i * 90; c.ty = 425; });
    UI.toast("ボールを タップして おとさないように しよう！");
  }
  ballTap(rx, ry) {
    const b = this.ball;
    if (Math.hypot(rx - b.x, ry - b.y) > 42) return;
    b.vy = -U.rand(360, 430); b.vx = U.clamp((b.x - rx) * 6 + U.rand(-80, 80), -160, 160);
    b.hits++;
    Sound.se("pop");
    const c = this.chars.reduce((a, x) => (Math.abs(x.x - b.x) < Math.abs(a.x - b.x) ? x : a));
    this.react(c, "happy", "note");
    c.tx = U.clamp(b.x + U.rand(-30, 30), 40, 320);
  }
  updateBall(dt) {
    const b = this.ball;
    b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt * 0.05; b.t -= dt;
    if (b.x < 16) { b.x = 16; b.vx = Math.abs(b.vx); }
    if (b.x > ROOM.W - 16) { b.x = ROOM.W - 16; b.vx = -Math.abs(b.vx); }
    if (b.y < 24) { b.y = 24; b.vy = Math.abs(b.vy) * 0.5; }
    for (const c of this.chars) if (c.state !== "jump") { c.state = "walk"; c.tx = U.clamp(b.x + (c.id === "wanko" ? -50 : c.id === "gachan" ? 0 : 50), 40, 320); c.ty = 425; }
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
    const bx = bed ? bed.x : 180, by = bed ? bed.y + 16 : 380;
    this.chars.forEach((c, i) => { c.state = "walk"; c.tx = U.clamp(bx + (i - 1) * 44, 40, 320); c.ty = U.clamp(by + (i % 2) * 10, 300, 444); });
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
    Game.goto("world", { map: "town", x: 4, y: 6, dir: "down" }, "circle");
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
    const tabs = U.el("div", { class: "tabs", style: "margin:0;flex:1" });
    for (const [k, label] of [["furn", "かぐ"], ["wall", "かべがみ"], ["floor", "ゆか"]]) {
      const b = U.el("button", { class: "tab" + (this.editTab === k ? " on" : ""), text: label });
      b.addEventListener("click", () => { this.editTab = k; Sound.se("tap"); this.renderEditBar(); });
      tabs.append(b);
    }
    head.append(tabs, UI.btn("おわる", () => this.endEdit(), "small yellow"));
    const info = U.el("div", { class: "muted", html: `いごこち ${"★".repeat(Room.stars())}${"☆".repeat(5 - Room.stars())}（${Room.comfort()}）　かぐは ドラッグで うごかせるよ` });
    const tray = U.el("div", { class: "tray" });
    if (this.editTab === "furn") {
      const ids = FURNITURE.filter((f) => Room.available(f.id) > 0);
      if (!ids.length) tray.append(U.el("div", { class: "note", text: "おける かぐが ないよ。まちの かぐやさんで かえるよ！" }));
      for (const f of ids) {
        const c = U.el("button", { class: "card", html: `<span class="cnt">×${Room.available(f.id)}</span>${UI.icon("furn", f.id, 50)}<div>${f.name}</div>` });
        c.addEventListener("click", () => this.placeNew(f.id));
        tray.append(c);
      }
    } else {
      const own = this.editTab === "wall" ? WALLPAPERS.filter((w) => Save.d.room.wallpapers[w.id]) : FLOORS.filter((w) => Save.d.room.floors[w.id]);
      for (const w of own) {
        const on = this.editTab === "wall" ? Save.d.room.wall === w.id : Save.d.room.floor === w.id;
        const c = U.el("button", { class: "card" + (on ? " on" : ""), html: `${UI.icon(this.editTab, w.id, 50)}<div>${w.name}</div>` });
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
    e.append(head, info, tray);
  }
  async placeNew(id) {
    if (Room.available(id) <= 0 || Save.d.room.items.length >= 64) { UI.toast("おける かぐが ないよ（1へや 64こまで）"); return; }
    const f = FURN_INDEX[id];
    const r = Save.d.room;
    const it = { uid: r.nextUid++, id, x: 180, y: f.kind === "wall" ? 110 : f.kind === "rug" ? 420 : 380, flip: false };
    // なるべく ほかの家具と かさならない場所をさがす
    const same = r.items.filter((o) => (FURN_INDEX[o.id].kind === "wall") === (f.kind === "wall"));
    let best = null, bestScore = 1e9;
    const ys = f.kind === "wall" ? [60, 110, 160] : f.kind === "rug" ? [400, 440] : [300, 340, 380, 420];
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
      const score = ov + Math.abs(x - 180) * 0.5;
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
    it.x = U.clamp(it.x, f.w / 2, ROOM.W - f.w / 2);
    if (f.kind === "wall") it.y = U.clamp(it.y, f.h / 2 + 4, ROOM.WALL - f.h / 2 - 12);
    else it.y = U.clamp(it.y, ROOM.WALL + (f.kind === "rug" ? f.h - 4 : 20), ROOM.H + 6);
  }
  itemRect(it) {
    const f = FURN_INDEX[it.id];
    if (f.kind === "wall") return { x: it.x - f.w / 2, y: it.y - f.h / 2, w: f.w, h: f.h };
    return { x: it.x - f.w / 2, y: it.y - f.h, w: f.w, h: f.h };
  }
  hitItem(rx, ry) {
    const order = this.drawOrder().reverse();
    for (const it of order) {
      const r = this.itemRect(it);
      if (rx >= r.x - 4 && rx <= r.x + r.w + 4 && ry >= r.y - 4 && ry <= r.y + r.h + 4) return it;
    }
    return null;
  }
  drawOrder() {
    const items = Save.d.room.items;
    const kind = (it) => FURN_INDEX[it.id].kind;
    return [...items.filter((i) => kind(i) === "wall"), ...items.filter((i) => kind(i) === "rug").sort((a, b) => a.y - b.y), ...items.filter((i) => kind(i) === "floor").sort((a, b) => a.y - b.y)];
  }
  select(it) {
    this.sel = it;
    if (this.tools) this.tools.remove();
    this.tools = null;
    if (!it) return;
    this.tools = U.el("div", { class: "edit-tools" });
    this.tools.append(
      UI.btn("はんてん", async () => { it.flip = !it.flip; Save.mark(); Sound.se("tap"); await this.furnCanvas(it, true); }, "small"),
      UI.btn("しまう", () => {
        Save.d.room.items = Save.d.room.items.filter((x) => x !== it);
        Save.mark(); Sound.se("cancel"); this.select(null); this.renderEditBar();
      }, "small pink"),
    );
    document.getElementById("ui").append(this.tools);
    this.placeTools();
  }
  placeTools() {
    if (!this.tools || !this.sel) return;
    const r = this.itemRect(this.sel);
    const p = this.toScreen(r.x + r.w / 2, r.y);
    this.tools.style.left = p.x * G.cssPerUnit + "px";
    this.tools.style.top = Math.max(60, (p.y - 6) * G.cssPerUnit) + "px";
  }
  endEdit() {
    Sound.se("ok");
    this.select(null);
    this.editUI.remove(); this.editUI = null;
    this.mode = null;
    this.showBar(true);
    UI.toast(`いごこち ${"★".repeat(Room.stars())}（${Room.comfort()}）<br>いごこちが いいと ごきげんが へりにくいよ`, "good");
    this.chars.forEach((c) => { c.state = "idle"; c.t = 0.3; });
  }

  // ---- 入力 ----
  down(p) {
    const r = this.toRoom(p.x, p.y);
    if (this.mode === "edit") {
      const it = this.hitItem(r.x, r.y);
      if (it) { this.drag = { it, dx: r.x - it.x, dy: r.y - it.y, moved: false, sx: p.x, sy: p.y }; this.select(it); }
      else this.select(null);
      return;
    }
    if (this.mode === "ball") { this.ballTap(r.x, r.y); return; }
  }
  move(p) {
    if (this.mode !== "edit" || !this.drag) return;
    const r = this.toRoom(p.x, p.y);
    const d = this.drag;
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 6) return;
    d.moved = true;
    d.it.x = r.x - d.dx; d.it.y = r.y - d.dy;
    this.clampItem(d.it);
    this.placeTools();
  }
  up(p) {
    if (this.mode === "edit") {
      if (this.drag && this.drag.moved) { Save.mark(); Sound.se("tap"); }
      this.drag = null;
      return;
    }
    if (!p.tap) return;
    const r = this.toRoom(p.x, p.y);
    if (this.mode === "hide") { this.hideTap(r.x, r.y); return; }
    if (this.mode) return;
    if (this.life.quarrel && HomeLife.settle(this)) return;
    for (const parent of this.parents) if (Math.abs(r.x-parent.x)<32 && r.y<parent.y+12 && r.y>parent.y-100) {
      ParentCare.open(this,parent.id); return;
    }
    // キャラを なでる
    const c = [...this.chars].sort((a, b) => b.y - a.y).find((c) => Math.abs(r.x - c.x) < 32 && r.y < c.y + 6 && r.y > c.y - 86);
    if (c) this.pet(c);
    else {
      const it = this.hitItem(r.x, r.y);
      if (it && FURN_INDEX[it.id].interactive) { this.life.furniture[it.uid] = 6; Sound.se(it.id === "musicbox" || it.id === "piano" ? "fanfare" : "pop"); HomeLife.say(this, U.pick(this.chars).id, "わあ！ うごいた♪"); }
    }
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
    c.anim += dt;
    if (c.jumpT >= 0) { c.jumpT += dt; if (c.jumpT > 0.7) c.jumpT = -1; }
    if (c.hidden) return;
    switch (c.state) {
      case "walk": {
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d < 2) { c.state = "idle"; c.t = U.rand(1.5, 4.5); c.dir = "down"; break; }
        const sp = this.mode === "ball" ? 120 : 52;
        c.x += (dx / d) * Math.min(d, sp * dt); c.y += (dy / d) * Math.min(d, sp * dt);
        c.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        break;
      }
      case "idle":
        if(this.parents.some(p=>p.target===c.id))break;
        c.t -= dt;
        if (c.t <= 0 && !this.mode) {
          const r = Math.random();
          if (r < 0.58) { c.state = "walk"; c.tx = U.rand(50, 310); c.ty = U.rand(300, 440); }
          else if (r < 0.72 && Save.d.chars[c.id].mood > 50) this.react(c, "happy", "note");
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
    const bg = SvgCache.get(...this.bgArgs);
    if (bg) ctx.drawImage(bg, 0, 0, G.W, G.H);
    else { ctx.fillStyle = "#FFF4DC"; ctx.fillRect(0, 0, G.W, G.H); }
    const s = this.s;
    const list = [];
    const items = this.drawOrder();
    if (this.mode !== "edit") for (const p of this.parents) list.push({ z:p.y,draw:()=>ParentCare.draw(this,ctx,p) });
    for (const it of items) {
      const f = FURN_INDEX[it.id];
      const z = f.kind === "wall" ? -2000 : f.kind === "rug" ? -1000 + it.y : it.y;
      list.push({ z, draw: () => this.drawFurn(ctx, it) });
    }
    for (const c of this.chars) {
      if (c.hidden) continue;
      list.push({ z: c.y + 0.5, draw: () => this.drawChar(ctx, c) });
    }
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
    if (this.mode === "edit") this.drawEditOverlay(ctx);
    if (this.mode === "hide") this.drawHideHint(ctx);
    HomeLife.draw(this, ctx);
  }
  drawFurn(ctx, it) {
    const f = FURN_INDEX[it.id];
    const c = this.furnCanvas(it, false);
    const s = this.s, pad = Art.FURN_PAD;
    const r = this.itemRect(it);
    const p = this.toScreen(r.x - pad, r.y - pad);
    if (f.kind === "floor") {
      ctx.fillStyle = "rgba(31,29,27,0.13)";
      const b = this.toScreen(it.x, it.y);
      ctx.beginPath(); ctx.ellipse(b.x, b.y - 2 * s, (f.w / 2) * s, 6 * s, 0, 0, 7); ctx.fill();
    }
    ctx.save();
    const moving = this.life.furniture[it.uid] > 0;
    if (moving) { const q = this.toScreen(it.x, it.y); ctx.translate(q.x, q.y); ctx.rotate(Math.sin(G.t * 9) * 0.045); ctx.translate(-q.x, -q.y); }
    if (c) ctx.drawImage(c, p.x, p.y, (f.w + pad * 2) * s, (f.h + pad * 2) * s);
    if (moving) { FX.note(ctx, p.x + f.w * s / 2, p.y - 6); FX.star(ctx, p.x + f.w * s, p.y + 10, 5, "#FFE066"); }
    ctx.restore();
    if (this.mode === "edit" && this.sel === it) {
      const q = this.toScreen(r.x, r.y);
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = "#F29A1F"; ctx.lineWidth = 2.5;
      U.rr(ctx, q.x - 4, q.y - 4, r.w * s + 8, r.h * s + 8, 8); ctx.stroke(); ctx.restore();
    }
  }
  drawChar(ctx, c) {
    const s = this.s;
    const [pose, dy] = this.pose(c);
    const p = this.toScreen(c.x, c.y);
    const face = c.state === "sleep" ? "sleep" : c.emo || this.baseFace(c);
    ctx.fillStyle = "rgba(31,29,27,0.16)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y, (24 - dy * 0.2) * s, 7 * s, 0, 0, 7); ctx.fill();
    const alpha = this.mode === "edit" ? 0.35 : 1;
    Chara.draw(ctx, c.id, this.charOpts(c, pose, c.state === "sleep" ? "down" : c.dir, face), p.x, p.y - dy * s, HOUSE_SIZE * s, alpha);
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
  drawBall(ctx) {
    const b = this.ball, s = this.s;
    const p = this.toScreen(b.x, b.y);
    ctx.fillStyle = "rgba(31,29,27,0.14)";
    const g = this.toScreen(b.x, 442);
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
    ctx.fillText(`${b.hits} かい　のこり ${Math.ceil(b.t)}びょう`, G.W / 2, this.oy + 34);
  }
  drawFx(ctx) {
    const s = this.s;
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
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    const a = this.toScreen(0, ROOM.WALL);
    ctx.beginPath(); ctx.moveTo(0, a.y); ctx.lineTo(G.W, a.y); ctx.stroke();
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
