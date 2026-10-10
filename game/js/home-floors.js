// おうちの 2かい（HOME-2F）: 3000 コインで 2かいを ふやす。
// ・2かいは 1かいの みぎ うえ（オーナーの FB 2026-09-30）。1かいの おくの ながい かべ（y=0）の うしろに おき、
//   2かいの ゆかの まえの ふち（ながい 辺）が 1かいの かべの うえの ふちに くっつく。ゆかの あつみの ぶん うえに のせるので、
//   画面で 2かいの ゆかと 1かいは かさならない。
// ・いつもの おへや（1かい）の ひだりの かべに そって 木の かいだん。うえは かべの うえの おどりば（おでかけの ドアの うえ）で、
//   おくの かどから 2かいの ゆかの ひだりまえに つながる。
//   いない ほうの かいは かぐごと 1まいの 絵に して 描く（うごかない）。いる ほうの かいは いつもの ように うごく。
//   その 1まいの 絵には フィギュア だいの フィギュアなど うごく かぐの 絵も はいる（よみこみを まってから 描く・UI-92）。
// ・かいだん・もう ひとつの かいを タップすると、3人が かいだんを のぼって（おりて）いく（ふだは 出さない）。
// HouseScene を 外から つつむ。scene-house.js は へやの 絵の まえと あとに よぶ 2行だけ。セーブの 形は かえない（rooms の 1へや）。
const HomeFloors = {
  ID: "upstairs", BASE: "main", PRICE: 3000,
  GIFT: { wall: "wp_cloud", floor: "fl_wood" }, // 2かいの はじめの かべがみ（あおぞら）
  // かいだん（1かいの ゆかの 座標。y は おくの かべから）: x0〜x1 の はば、まえ（D−6）から おく（top）へ n だん。
  // top から おくの かべ（y=0）までは おどりば（たかさ H・あつみ LT）
  STAIR: { x0: 6, x1: 58, top: 150, n: 13, LT: 12 },
  LIFT: 22, // 2かいの ゆかの あつみ（HomeDesign.roomSvg の ゆかの ふちと おなじ）
  SPEED: 120, R: 2, // あるく はやさ ／ いない かいの 絵の 1たんいの 画素
  owned() { return !!(Save.d && Save.d.rooms.owned[this.ID]); },
  on() { const a = Save.d.rooms.active; return this.owned() && (a === this.BASE || a === this.ID); },
  upper() { return Save.d.rooms.active === this.ID; },
  size(id) { return HomeDesign.sizes[HomeDesign.sizeKey(id, Save.d.rooms)]; },
  // 2かいの 原点（1かいの ゆかの 座標）: おくの かべの うしろ。2かいの ゆかの まえの ふち（y=D2）が かべの うえ（y=0・z=H）に のる
  origin() { const s2 = this.size(this.ID); return { x: 0, y: -s2.d, z: HomeDesign.H + this.LIFT }; },
  off2() { const o = this.origin(); return HomeDesign.project(o.x, o.y, o.z); },
  // 2かいに ついた ところ（2かいの へやの 座標）: まえの ふちの ひだり（おどりばの うしろ）
  landing() { const S = this.STAIR; return { x: (S.x0 + S.x1) / 2 + 30, y: ROOM.WALL + this.size(this.ID).d - 40 }; },
  // 1かいの ゆかの 点 → 2かいの へやの 座標（2かいに いる ときの みち）
  to2(x, y, z) { const o = this.origin(); return { x: x - o.x, y: ROOM.WALL + y - o.y, z: z - o.z }; },
  // 2つの かいを あわせた わく（1かいの 原点で）
  union() {
    const b1 = HomeDesign.bounds(this.size(this.BASE)), b2 = HomeDesign.bounds(this.size(this.ID)), o = this.off2();
    const x0 = Math.min(b1.x, b2.x + o.x), y0 = Math.min(b1.y, b2.y + o.y), x1 = Math.max(b1.x + b1.w, b2.x + o.x + b2.w), y1 = Math.max(b1.y + b1.h, b2.y + o.y + b2.h);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },

  // ---- かいだんの 絵（1かいの ゆかの 座標で 投影。大きさは 1かいの ひろさ 4しゅ だけ）----
  stairPoints(D1) {
    const S = this.STAIR, H = HomeDesign.H, yb = D1 - 6, r = (yb - S.top) / S.n, rise = H / S.n;
    return { yb, r, rise, steps: Array.from({ length: S.n }, (_, i) => ({ y: yb - (i + 1) * r, y2: yb - i * r, z: (i + 1) * rise, zb: i * rise })) };
  },
  stairsSvg(D1) {
    const S = this.STAIR, H = HomeDesign.H, P = (x, y, z = 0) => HomeDesign.project(x, y, z), { yb, r, rise, steps } = this.stairPoints(D1);
    const pts = (a) => a.map((v) => { const q = P(...v); return f2(q.x) + "," + f2(q.y); }).join(" ");
    const poly = (a, fill, w = 1.4) => `<polygon points="${pts(a)}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
    const line = (a, col, w) => `<polyline points="${pts(a)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const x0 = S.x0, x1 = S.x1, rail = 58, LT = S.LT;
    let s = "";
    // おどりば（かいだんの うえ → おくの かど。おでかけの ドアの うえ）: うえの いた・へやがわの はり・いたの めじ
    s += poly([[x1, 0, H - LT], [x1, S.top, H - LT], [x1, S.top, H], [x1, 0, H]], "#9C7552");
    s += poly([[x0, 0, H], [x1, 0, H], [x1, S.top, H], [x0, S.top, H]], "#D7B884");
    for (let y = 26; y < S.top; y += 26) s += line([[x0 + 3, y, H], [x1 - 3, y, H]], "#B8955F", 1);
    // へやがわの よこいた（だんの かたち）と した の しまう とびら
    const saw = [[x1, yb, 0]];
    for (const st of steps) saw.push([x1, st.y2, st.z], [x1, st.y, st.z]);
    saw.push([x1, S.top, 0]);
    s += poly(saw, "#9C7552");
    s += line([[x1, yb - 5, 3], [x1, S.top + 5, H - 8]], "#B38A5A", 1.1);
    const d0 = yb - r * 1.8, d1 = yb - r * 5.4;
    s += poly([[x1, d0, 2], [x1, d1, 2], [x1, d1, rise * 4.2], [x1, d0, rise * 1.9]], "#B58B5B", 1.2);
    const k = P(x1, d1 + 8, rise * 2.6); s += `<circle cx="${f2(k.x)}" cy="${f2(k.y)}" r="2.6" fill="#E0BD66" stroke="#5E4937" stroke-width="1.1"/>`;
    // だん（おくから てまえへ）: けあげ と ふみいた
    for (let i = steps.length - 1; i >= 0; i--) {
      const st = steps[i];
      s += poly([[x0, st.y2, st.zb], [x1, st.y2, st.zb], [x1, st.y2, st.z], [x0, st.y2, st.z]], "#A67F52", 1.2);
      s += poly([[x0, st.y, st.z], [x1, st.y, st.z], [x1, st.y2, st.z], [x0, st.y2, st.z]], i % 2 ? "#DDBF8C" : "#D7B884", 1.2);
      s += line([[x0 + 3, st.y + r * 0.72, st.z], [x1 - 3, st.y + r * 0.72, st.z]], "#B8955F", 1);
    }
    // てすり（へやがわ）: はしら と てすり
    for (let i = 0; i <= steps.length; i += 2) { const y = yb - i * r - r * 0.5, z = i * rise + rise; s += line([[x1 - 4, y, z], [x1 - 4, y, z + rail]], "#6B4934", 3.2); }
    // てすりは おどりばの とちゅう（y=RAIL0）まで。おくの かどの ところは 2かいへの いりぐち（2かいの ゆかに かからない）
    const R0 = this.RAIL0, top = [[x1 - 4, yb + 4, rail - 2], [x1 - 4, S.top - 4, H + rail + 2], [x1 - 4, R0, H + rail + 2]];
    for (const y of [S.top - 4 - (S.top - 4 - R0) / 2, R0]) s += line([[x1 - 4, y, H], [x1 - 4, y, H + rail]], "#6B4934", 3.2);
    s += line(top, "#5C3F2B", 5.5) + line(top, "#B98A58", 2.2);
    const b = this.stairsBox(D1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(b.x)} ${f2(b.y)} ${f2(b.w)} ${f2(b.h)}"><g stroke-linecap="round" stroke-linejoin="round">${s}</g></svg>`;
  },
  RAIL0: 64, // おどりばの てすりの おわり（これより おくは てすりなし。画面で 2かいの ゆかより ひだり）
  // かいだんの 絵の わく（1かいの ゆかの 投影で）
  stairsBox(D1) {
    const S = this.STAIR, H = HomeDesign.H, P = (x, y, z) => HomeDesign.project(x, y, z), ps = [];
    for (const x of [S.x0, S.x1]) for (const y of [D1 - 2, S.top - 8, 0]) for (const z of [0, H + 64]) ps.push(P(x, y, z));
    const x0 = Math.min(...ps.map((p) => p.x)) - 6, y0 = Math.min(...ps.map((p) => p.y)) - 6;
    return { x: x0, y: y0, w: Math.max(...ps.map((p) => p.x)) + 6 - x0, h: Math.max(...ps.map((p) => p.y)) + 6 - y0 };
  },
  stairsCanvas(ensure) {
    const D1 = this.size(this.BASE).d, b = this.stairsBox(D1), key = "house-stairs:" + D1;
    const fn = () => this.stairsSvg(D1), pw = Math.ceil(b.w * this.R), ph = Math.ceil(b.h * this.R);
    return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph);
  },
  // かいだんの 画面の かたち（タップの はんい）。o は 1かいの 原点の 画面の 位置
  stairsPoly(sc, o) {
    const S = this.STAIR, D1 = this.size(this.BASE).d, H = HomeDesign.H, s = sc.s;
    const P = (x, y, z) => { const q = HomeDesign.project(x, y, z); return { x: o.x + q.x * s, y: o.y + q.y * s }; };
    // かいだん と おどりば（おどりばは かべの うえより したに とどめる。2かいの ゆかの タップと かさならない）
    return [P(S.x1 + 6, D1, 0), P(S.x0 - 6, D1, 0), P(S.x0 - 6, S.top - 10, H + 70), P(S.x0 - 6, this.RAIL0, H + 64), P(S.x0 - 6, 2, H), P(S.x1 + 6, 2, H - 2), P(S.x1 + 6, 2, H - 30), P(S.x1 + 6, S.top - 10, H - 30), P(S.x1 + 6, D1, -4)];
  },
  // 1かいの 原点の 画面の 位置（いる かいが 2かいなら ずらして もどす）
  base(sc) { if (!this.upper()) return { x: sc.ox, y: sc.oy }; const o = this.off2(); return { x: sc.ox - o.x * sc.s, y: sc.oy - o.y * sc.s }; },
  // へやの ゆかの 座標 → 画面（id の かいの 原点から）
  roomAt(sc, id) {
    const b = this.base(sc), o = id === this.ID ? this.origin() : { x: 0, y: 0, z: 0 }, s = sc.s;
    return (x, y, z) => { const q = HomeDesign.project(o.x + x, o.y + y, o.z + z); return { x: b.x + q.x * s, y: b.y + q.y * s }; };
  },
  // へやの りんかく（ゆかと おくの かべ）の 画面の かたち
  roomPoly(sc, id) {
    const size = this.size(id), W = size.w, D = size.d, H = HomeDesign.H, P = this.roomAt(sc, id);
    return [P(W, D, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H), P(0, D, H), P(0, D, 0)];
  },
  // ゆかと ゆかの あつみ（まえと みぎの ふち）の 画面の かたち
  floorPoly(sc, id) {
    const size = this.size(id), W = size.w, D = size.d, T = -this.LIFT, P = this.roomAt(sc, id);
    return [P(0, 0, 0), P(W, 0, 0), P(W, 0, T), P(W, D, T), P(0, D, T), P(0, D, 0)];
  },
  inside(poly, p) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], q = poly[j]; if ((a.y > p.y) !== (q.y > p.y) && p.x < ((q.x - a.x) * (p.y - a.y)) / (q.y - a.y) + a.x) c = !c; }
    return c;
  },

  // ---- カメラ: 2つの かいが はいる ように（いる かいの 原点を ずらす）----
  layout(sc) {
    if (!this.on()) return;
    const B = this.union(), top = sc.view.top, bottom = G.H - sc.view.bottom, h = G.H - top - bottom;
    sc.baseScale = Math.min((G.W - 18) / B.w, Math.max(80, h) / B.h);
    sc.s = sc.baseScale * (sc.zoom || 1); sc.actorScale = sc.s * 1.35;
    const maxX = Math.max(0, B.w * sc.s - G.W + 36) / 2, maxY = Math.max(0, B.h * sc.s - h) / 2;
    sc.pan.x = U.clamp(sc.pan.x, -maxX, maxX); sc.pan.y = U.clamp(sc.pan.y, -maxY, maxY);
    const x = (G.W - B.w * sc.s) / 2 - B.x * sc.s + sc.pan.x, y = top + (h - B.h * sc.s) / 2 - B.y * sc.s + sc.pan.y, o = this.upper() ? this.off2() : { x: 0, y: 0 };
    sc.ox = x + o.x * sc.s; sc.oy = y + o.y * sc.s;
    sc.placeTools();
  },

  // ---- いない ほうの かい（かぐごと 1まいの 絵）----
  // いる へやを いっとき いれかえて、scene-house.js の 描きかた（drawOrder・drawFurn）で 描く
  swap(sc, id, fn) {
    const rs = Save.d.rooms, room = Save.d.room, active = rs.active, other = rs.stored[id], keep = { ox: sc.ox, oy: sc.oy, s: sc.s, furn: sc.life.furniture, mode: sc.mode, sel: sc.sel };
    if (!other) return null;
    rs.stored[active] = room; Save.d.room = other; rs.active = id;
    try { return fn(); }
    finally { rs.active = active; Save.d.room = room; delete rs.stored[active]; rs.stored[id] = other; Object.assign(sc, { ox: keep.ox, oy: keep.oy, s: keep.s, mode: keep.mode, sel: keep.sel }); sc.life.furniture = keep.furn; }
  },
  otherId() { return this.upper() ? this.BASE : this.ID; },
  async prepare(sc) {
    sc.floorImage = null;
    const seq = sc.floorSeq = (sc.floorSeq || 0) + 1; // あとから よんだ ほうが かち（よみこみの とちゅうで かいを うつったら まえの ぶんは やめる）
    if (!this.on()) return;
    const id = this.otherId(), room = Save.d.rooms.stored[id], stale = () => seq !== sc.floorSeq || this.otherId() !== id;
    if (!room) return;
    const size = this.size(id), b = HomeDesign.bounds(size);
    const bgKey = "house-design:" + id + ":" + room.wall + ":" + room.floor + ":" + size.w + "x" + size.d + ":" + HomeDoorColors.sig();
    const k0 = Math.min(2, Math.sqrt(4.5e6 / (b.w * b.h))); // 3ばい・4ばいの へやは ちいさめの 絵（scene-house.js の buildBg と おなじ）
    const jobs = [SvgCache.ensure(bgKey, () => HomeDesign.roomSvg(room.wall, room.floor, size), Math.ceil(b.w * k0), Math.ceil(b.h * k0)), ...room.items.map((it) => sc.furnCanvas(it, true))];
    if (id === this.BASE) jobs.push(this.stairsCanvas(true));
    const [bg] = await Promise.all(jobs);
    if (stale()) return;
    const R = this.R, cv = document.createElement("canvas"); cv.width = Math.ceil(b.w * R); cv.height = Math.ceil(b.h * R);
    const g = cv.getContext("2d");
    const draw = (ctx) => this.swap(sc, id, () => {
      Object.assign(sc, { ox: -b.x * R, oy: -b.y * R, s: R, mode: null, sel: null }); sc.life.furniture = {};
      const items = sc.drawOrder(), flat = (it) => ["wall", "rug"].includes(FURN_INDEX[it.id].kind);
      for (const it of items) if (flat(it)) sc.drawFurn(ctx, it);
      if (id === this.BASE) this.drawStairs(ctx, sc, { x: sc.ox, y: sc.oy }, R);
      for (const it of items) if (!flat(it)) sc.drawFurn(ctx, it);
    });
    // うごく かぐの 絵（フィギュア だいの フィギュア・もくば・おふろ グッズ など）は 描く ときに はじめて よみこむ（SvgCache.get）。
    // いちど ためしに 描いて、よみこみが おわってから ほんとうに 描く（UI-92: 1かいの だいの フィギュアが 2かいから 見ると きえて いた）
    draw(document.createElement("canvas").getContext("2d"));
    await Promise.all([...SvgCache.pending.values()]);
    if (stale()) return;
    if (bg) g.drawImage(bg, 0, 0, cv.width, cv.height);
    draw(g);
    sc.floorImage = { id, cv, b };
  },
  drawStairs(ctx, sc, o, s = sc.s) {
    const img = this.stairsCanvas(false); if (!img) return;
    const b = this.stairsBox(this.size(this.BASE).d);
    ctx.drawImage(img, o.x + b.x * s, o.y + b.y * s, b.w * s, b.h * s);
  },
  // へやの 絵の まえ: いない かいの 絵
  drawUnder(ctx, sc) {
    const F = sc.floorImage; if (!F || !this.on()) return;
    const b0 = this.base(sc), o = F.id === this.ID ? this.off2() : { x: 0, y: 0 }, s = sc.s;
    ctx.drawImage(F.cv, b0.x + (o.x + F.b.x) * s, b0.y + (o.y + F.b.y) * s, F.b.w * s, F.b.h * s);
  },
  // へやの 絵の あと（1かいに いる とき）: かべの かぐ・しきもの → かいだん（どちらも かいだんより おく・した）
  drawAfterBg(ctx, sc) {
    sc.floorSkip = null;
    if (!this.on() || this.upper()) return;
    const flat = sc.drawOrder().filter((it) => ["wall", "rug"].includes(FURN_INDEX[it.id].kind));
    for (const it of flat) sc.drawFurn(ctx, it);
    this.drawStairs(ctx, sc, { x: sc.ox, y: sc.oy });
    sc.floorSkip = new Set(flat);
  },
  // ---- かいだんを タップ ----
  at(sc, p) {
    if (!this.on() || sc.mode || sc.watching || sc.life.quarrel || !p.tap || sc.panDrag?.moved || sc.climb || sc.gesture) return null;
    if (sc.chars.some((c) => !c.hidden && sc.contains(sc.actorRect(c), p))) return null;
    const r = sc.toRoom(p.x, p.y), it = sc.hitItem(r.x, r.y);
    if (it && FURN_INDEX[it.id].interactive) return null;
    if (this.inside(this.stairsPoly(sc, this.base(sc)), p)) return this.upper() ? "down" : "up";
    if (typeof HomeDoors !== "undefined" && HomeDoors.list().some((d) => HomeDoors.hit(sc, d, p))) return null;
    // もう ひとつの かいの へや
    if (this.inside(this.roomPoly(sc, this.otherId()), p) && !this.inside(this.roomPoly(sc, Save.d.rooms.active), p)) return this.upper() ? "down" : "up";
    return null;
  },
  // 3人の みち（いる かいの へやの 座標・z は ゆかからの たかさ）: かいだん → おどりば → おくの かど → 2かいの ゆか
  path(sc, dir) {
    const S = this.STAIR, H = HomeDesign.H, mid = (S.x0 + S.x1) / 2, D1 = this.size(this.BASE).d, yb = D1 - 6, W = ROOM.WALL;
    if (dir === "up") return [{ x: mid + 42, y: W + yb - 16, z: 0 }, { x: mid, y: W + yb + 4, z: 0 }, { x: mid, y: W + yb - 2, z: 0 }, { x: mid, y: W + S.top + 2, z: H }, { x: mid, y: W + 14, z: H }, { x: mid + 18, y: W - 30, z: H + this.LIFT }];
    const L = this.landing(), t = (x, y, z) => this.to2(x, y, z);
    return [{ x: L.x, y: L.y, z: 0 }, t(mid + 18, -30, H + this.LIFT), t(mid, 14, H), t(mid, S.top + 2, H), t(mid, yb - 2, 0), t(mid + 20, yb - 8, 0)];
  },
  go(sc, dir) {
    if (sc.climb) return false;
    for (const c of sc.chars) HomeActions.cancel(c);
    sc.mode = "floor"; sc.showBar(false);
    const way = this.path(sc, dir);
    sc.chars.forEach((c, i) => { c.state = "floor"; c.emo = "happy"; c.z = c.z || 0; c.way = way.map((w) => ({ ...w })); c.wi = 0; c.wait = i * 0.42; });
    sc.climb = { dir, t: 0 };
    Sound.se("tap");
    return true;
  },
  update(sc, dt) {
    const C = sc.climb; if (!C) return;
    C.t += dt;
    let done = true;
    for (const c of sc.chars) {
      if (!c.way) continue;
      if ((c.wait -= dt) > 0) { done = false; continue; }
      let step = this.SPEED * dt;
      while (step > 0 && c.wi < c.way.length) {
        const w = c.way[c.wi], dx = w.x - c.x, dy = w.y - c.y, dz = w.z - c.z, d = Math.hypot(dx, dy, dz * 0.6);
        if (d <= step) { c.x = w.x; c.y = w.y; c.z = w.z; c.wi++; step -= d; continue; }
        const k = step / d; c.x += dx * k; c.y += dy * k; c.z += dz * k; step = 0;
        c.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      }
      if (c.wi < c.way.length) done = false;
    }
    if (done || C.t > 9) {
      sc.climb = null;
      const to = C.dir === "up" ? this.ID : this.BASE;
      if (HomeRooms.switchTo(to)) Game.goto("house", { floor: C.dir });
    }
  },
  // あたらしい かいに ついた: かいだんの はしから 中へ あるく
  arrive(sc, dir) {
    const S = this.STAIR, mid = (S.x0 + S.x1) / 2, D1 = this.size(this.BASE).d;
    sc.chars.forEach((c, i) => {
      c.z = 0;
      if (dir === "up") { const L = this.landing(); c.x = L.x - 12 + i * 12; c.y = L.y + 8 - (i % 2) * 12; c.tx = U.clamp(L.x + 50 + i * 46, 40, ROOM.W - 40); c.ty = U.clamp(L.y - 50 - (i % 2) * 40, ROOM.WALL + 40, ROOM.H - 30); }
      else { c.x = mid + 20 + i * 6; c.y = ROOM.WALL + D1 - 14 + (i - 1) * 4; c.tx = U.clamp(110 + i * 42, 40, ROOM.W - 40); c.ty = U.clamp(ROOM.WALL + D1 - 70 - (i % 2) * 28, ROOM.WALL + 40, ROOM.H - 30); }
      c.state = "walk"; c.dir = "down";
    });
  },

  // ---- かいだんの ところに かぐを おかない（ゆかの かぐ・ひだりの かべの かぐ）----
  keepOut(sc, it) {
    if (!this.on() || this.upper() || !it) return;
    const f = FURN_INDEX[it.id], S = this.STAIR, D1 = ROOM.H - ROOM.WALL;
    if (f.kind === "wall") { if (it.wallSide === "left") { if (it.x + f.w / 2 > S.top - 6) it.x = Math.max(f.w / 2 + 6, S.top - 6 - f.w / 2); it.y = Math.max(it.y, f.h / 2 + S.LT + 6); } return; } // おどりばの した
    if (f.kind === "rug") return;
    const m = HomeDesign.model(it.id, it), a = sc.anchor(it), left = a.x - m.footW / 2, back = a.y - ROOM.WALL - m.footD;
    if (left < S.x1 + 8 && a.y - ROOM.WALL > S.top - 4 && back < D1) it.x = S.x1 + 10 + m.footW / 2;
  },
  tidy(sc) {
    if (!this.on() || this.upper()) return false;
    let moved = false;
    for (const it of Save.d.room.items) { const k = JSON.stringify([it.x, it.y, it.wallSide]); this.keepOut(sc, it); if (k !== JSON.stringify([it.x, it.y, it.wallSide])) moved = true; }
    if (moved) Save.mark();
    return moved;
  },

  // テスト・PokaDebug 用
  state(sc) {
    const cv = G.canvas.getBoundingClientRect(), u = G.cssPerUnit, pt = (p) => ({ x: cv.left + p.x * u, y: cv.top + p.y * u });
    const box = (ps) => { const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y), a = pt({ x: Math.min(...xs), y: Math.min(...ys) }), b = pt({ x: Math.max(...xs), y: Math.max(...ys) }); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; };
    const on = this.on();
    const other = this.otherId(), so = on ? this.size(other) : null;
    return { owned: this.owned(), on, room: Save.d.rooms.active, upper: this.upper(), price: this.PRICE, ready: !!sc.floorImage, climbing: sc.climb ? sc.climb.dir : null, scale: sc.s,
      stairs: on ? box(this.stairsPoly(sc, this.base(sc))) : null, stairsTap: on ? pt(this.stairsTap(sc)) : null,
      rooms: on ? { main: box(this.roomPoly(sc, this.BASE)), upstairs: box(this.roomPoly(sc, this.ID)) } : null,
      // かさならない・くっつく の 検査用（画面の 位置）: 1かいの りんかく・2かいの りんかくと ゆか・1かいの おくの かべの うえの ふち
      polys: on ? { main: this.roomPoly(sc, this.BASE).map(pt), upstairs: this.roomPoly(sc, this.ID).map(pt), floor2: this.floorPoly(sc, this.ID).map(pt), stairs: this.stairsPoly(sc, this.base(sc)).map(pt),
        wallTop: [this.roomAt(sc, this.BASE)(0, 0, HomeDesign.H), this.roomAt(sc, this.BASE)(this.size(this.BASE).w, 0, HomeDesign.H)].map(pt) } : null,
      roomTap: on ? pt(this.roomAt(sc, other)(so.w / 2, so.d / 2, 0)) : null,
      chars: sc.chars.map((c) => ({ id: c.id, x: c.x, y: c.y, z: c.z || 0, state: c.state })) };
  },
  // かいだんの まんなかあたり（タップの テスト用）
  stairsTap(sc) {
    const S = this.STAIR, D1 = this.size(this.BASE).d, b = this.base(sc), q = HomeDesign.project((S.x0 + S.x1) / 2, (D1 + S.top) / 2, HomeDesign.H * 0.5);
    return { x: b.x + q.x * sc.s, y: b.y + q.y * sc.s };
  },
};

// ---- つなぎ ----
(() => {
  HomeRooms.catalog.push({ id: HomeFloors.ID, name: "2かいの おへや", price: HomeFloors.PRICE, wins: 0 });
  // 2かいを かったら: あおぞらの かべがみ・かいだんの ところの かぐを よける
  const purchase = HomeRooms.purchase;
  HomeRooms.purchase = function (id) {
    const ok = purchase.call(this, id);
    if (ok && id === HomeFloors.ID) {
      const rs = Save.d.rooms, g = HomeFloors.GIFT;
      rs.stored[id] = { wall: g.wall, floor: g.floor, items: [], wallpapers: { ...Save.d.room.wallpapers, [g.wall]: true }, floors: { ...Save.d.room.floors, [g.floor]: true }, nextUid: 1 };
      Save.d.room.wallpapers[g.wall] = true;
      Save.mark(); Save.write();
    }
    return ok;
  };
  // おへやの 画面: 2かいの せつめい
  const open = HomeRooms.open;
  HomeRooms.open = function (sc) {
    const r = open.call(this, sc);
    const card = document.querySelector(`.modal-wrap [data-room="${HomeFloors.ID}"]`);
    if (card) card.insertBefore(U.el("div", { text: "かいだんで のぼる 2かい。1かいの みぎ うえに いっしょに みえるよ。あおぞらの かべがみ つき。" }), card.lastChild);
    return r;
  };
  // ドアの「おへや」では 2かいに いかない（かいだんで いく）
  if (typeof HomeDoors !== "undefined") { const rooms = HomeDoors.rooms; HomeDoors.rooms = function () { return rooms.call(this).filter((r) => r.id !== HomeFloors.ID); }; }

  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("layout", function (orig) { const r = orig.call(this); HomeFloors.layout(this); return r; });
  wrap("enter", async function (orig, p = {}) {
    HomeFloors.tidy(this);
    const r = await orig.call(this, p);
    await HomeFloors.prepare(this);
    if (p.floor) HomeFloors.arrive(this, p.floor);
    return r;
  });
  wrap("exit", function (orig) { this.climb = null; this.floorImage = null; this.floorSeq = (this.floorSeq || 0) + 1; return orig.call(this); });
  wrap("up", function (orig, p) {
    const dir = HomeFloors.at(this, p);
    if (!dir) return orig.call(this, p);
    this.mode = "floor";
    const r = orig.call(this, p);
    this.mode = null; HomeFloors.go(this, dir);
    return r;
  });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); HomeFloors.update(this, dt); return r; });
  wrap("pose", function (orig, c) { if (c.state === "floor") return [["idle_01", "walk_01", "idle_01", "walk_02"][Math.floor(c.anim * 9) % 4], 0]; return orig.call(this, c); });
  // かいだんの うえ: z の ぶんだけ うえに 描く
  wrap("drawChar", function (orig, ctx, c) {
    if (!c.z) return orig.call(this, ctx, c);
    const oy = this.oy; this.oy -= c.z * this.s;
    try { return orig.call(this, ctx, c); } finally { this.oy = oy; }
  });
  // かべの かぐは かいだんの まえに 描いた（drawAfterBg）
  wrap("drawFurn", function (orig, ctx, it) { if (this.floorSkip && this.floorSkip.has(it)) return; return orig.call(this, ctx, it); });
  wrap("clampItem", function (orig, it) { const r = orig.call(this, it); HomeFloors.keepOut(this, it); return r; });
})();
