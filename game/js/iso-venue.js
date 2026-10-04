// 斜め上から 見る 屋内（おうちと おなじ 投影 HomeDesign.A・B）。
// VenueScene の あるく（タイル）・フロア・しらべる・エレベーターは そのまま つかい、def.iso の 館だけ 描きかた・タップ・カメラを かえる。
// 部屋: { w, h（タイル）, rows（'#' は とおれない・'o' は ふきぬけ・ほかは 床の 材質）, wallH, fixtures, art }
// 什器: { kind, x, y, w, h（床の マス）, z?, height?, label?, action?, walk?, over?（頭の 上に ある）, hidden? }
const IsoVenue = {
  T: 48, // 1マスの 大きさ（おうちの 単位。3人の 足もとの はば くらい）
  get A() { return HomeDesign.A; },
  get B() { return HomeDesign.B; },
  // タイル (x, y) と 高さ z → 投影（おうちの 単位）
  p(x, y, z = 0) { const X = x * this.T, Y = y * this.T; return { x: (X - Y) * this.A, y: (X + Y) * this.B - z }; },
  // 投影 → 床（z=0）の タイル座標
  inv(sx, sy) { const X = (sx / this.A + sy / this.B) / 2, Y = (sy / this.B - sx / this.A) / 2; return { x: X / this.T, y: Y / this.T }; },
  // 部屋の 静止画の はんい（投影の 単位）
  bounds(r) { const T = this.T, m = 24, top = (r.wallH || 260) + 150; return { x: -r.h * T * this.A - m, y: -top - m, w: (r.w + r.h) * T * this.A + m * 2, h: (r.w + r.h) * T * this.B + top + 40 + m * 2 }; },
  // 床の まわり: 奥の 2まい（北 y=0・西 x=0）だけ かべ、手前は 床の あつみ
  solidAt(r, x, y) { x = Math.floor(x); y = Math.floor(y); if (!(x >= 0 && y >= 0 && x < r.w && y < r.h)) return true; const ch = r.rows ? r.rows[y][x] : "."; return ch === "#" || ch === "o"; },
  // 箱の 8かどを 投影した かたち（タップの あたり・かさなりの 判定）
  hull(f) {
    const z0 = f.z || 0, z1 = z0 + (f.height ?? 40), pts = [];
    for (const [x, y] of [[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]]) pts.push(this.p(x, y, z0), this.p(x, y, z1));
    return pts;
  },
  // 什器 でない もの（町の 人・てすり）の はこ
  shape(o) { return o.hit || (o.f ? this.hull(o.f) : this.hull({ x: o.x0, y: o.y0, w: o.x1 - o.x0, h: o.y1 - o.y0, height: o.height ?? 120 })); },
  rectOf(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of pts) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; },
  // 凸な かたちの 中か（投影の 8点の 凸包）
  inHull(pts, x, y) {
    const h = this.convex(pts); let sign = 0;
    for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length], c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); if (Math.abs(c) < 1e-9) continue; const s = c > 0 ? 1 : -1; if (!sign) sign = s; else if (s !== sign) return false; }
    return true;
  },
  convex(pts) {
    const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y), cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  },
  // 奥から 手前への じゅんばん。a が b の 奥（x か y で まるごと 小さい）なら a を さきに。頭の 上の ものは さいごに
  order(list) {
    const n = list.length, behind = (a, b) => a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6, indeg = new Array(n).fill(0), next = list.map(() => []);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = list[i], b = list[j]; if (a.layer !== b.layer) continue;
      const ab = behind(a, b), ba = behind(b, a);
      if (ab && !ba) { next[i].push(j); indeg[j]++; } else if (ba && !ab) { next[j].push(i); indeg[i]++; }
    }
    const key = (o) => o.layer * 1e6 + (o.x0 + o.x1 + o.y0 + o.y1), ready = [], out = [];
    for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
    while (out.length < n) {
      if (!ready.length) { const rest = list.map((o, i) => i).filter((i) => !out.includes(list[i])); rest.sort((a, b) => key(list[a]) - key(list[b])); ready.push(rest[0]); indeg[rest[0]] = 0; }
      ready.sort((a, b) => key(list[a]) - key(list[b])); const i = ready.shift(); if (out.includes(list[i])) continue; out.push(list[i]);
      for (const j of next[i]) if (--indeg[j] === 0) ready.push(j);
    }
    return out;
  },
  // 静止画（床・かべ）を 部屋ごとに 1まい 描いて、TILE の 四角に きりわける（大きすぎる canvas は まいかい 描くのが とても おそい）
  cache: [],
  TILE: 1024,
  async build(sc, r) {
    const hit = this.cache.find((c) => c.room === r && c.k === sc.k); if (hit) return hit;
    // こまかさに 上限（3ばいの 画面でも 1.2）。メモリは 1フロア 45MB くらいまで
    const art = sc.def.art, b = this.bounds(r), k = Math.min(sc.k, 1.2), cv = document.createElement("canvas");
    if (art && art.prepare) await art.prepare(r, sc);
    cv.width = Math.ceil(b.w * k); cv.height = Math.ceil(b.h * k);
    const g = cv.getContext("2d"); g.setTransform(k, 0, 0, k, -b.x * k, -b.y * k);
    if (art && art.paint) art.paint(g, r, sc); else this.plainPaint(g, r);
    const tiles = [], T = this.TILE;
    for (let y = 0; y < cv.height; y += T) for (let x = 0; x < cv.width; x += T) {
      const t = document.createElement("canvas"); t.width = Math.min(T, cv.width - x); t.height = Math.min(T, cv.height - y);
      t.getContext("2d").drawImage(cv, x, y, t.width, t.height, 0, 0, t.width, t.height); tiles.push({ x, y, cv: t });
    }
    cv.width = cv.height = 0;
    const out = { room: r, k: sc.k, b, px: k, tiles };
    this.cache.push(out); if (this.cache.length > 2) this.cache.shift();
    return out;
  },
  // 静止画を 画面に（見える タイルだけ）。q は 静止画の 左上の 画面の 位置、s は 投影 → 画面
  drawStatic(ctx, hit, q, s) {
    const f = s / hit.px;
    for (const t of hit.tiles) {
      const x = q.x + t.x * f, y = q.y + t.y * f, w = t.cv.width * f, h = t.cv.height * f;
      if (x > G.W || y > G.H || x + w < 0 || y + h < 0) continue;
      ctx.drawImage(t.cv, x, y, w + 0.5, h + 0.5);
    }
  },
  plainPaint(g, r) {
    const P = (x, y, z) => this.p(x, y, z), poly = (pts, fill) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); };
    poly([P(0, 0, 0), P(r.w, 0, 0), P(r.w, r.h, 0), P(0, r.h, 0)], "#E6DDCB");
    poly([P(0, 0, 0), P(r.w, 0, 0), P(r.w, 0, r.wallH || 260), P(0, 0, r.wallH || 260)], "#EFE8DA");
    poly([P(0, 0, 0), P(0, r.h, 0), P(0, r.h, r.wallH || 260), P(0, 0, r.wallH || 260)], "#E1D9C8");
  },
};

class IsoVenueScene extends VenueScene {
  async enter(p) {
    this.isoZoom = 1; this.enterAt = p.at || null;
    await super.enter(p);
    if (this.def.iso) {
      UI.showHud(true, this.def.name + " " + this.floor + "F");
      if (this.room.bgm) Sound.bgm(this.room.bgm);
      this.bar?.querySelector("span")?.replaceChildren("スライド・タップで あるく・おみせや ものを しらべる");
      await this.prepareIso();
    }
  }
  // 斜めの 館か（部屋ごとに room.iso。検査は def なしで 部屋だけ わたす）
  get iso() { return !!(this.room && this.room.iso); }
  // 画面の 大きさで 見える はばを きめる（たて画面で 18マスくらい）
  get s() { return (this.room && this.room.scale || 0.5) * (this.isoZoom || 1); }
  get k() { return this.s * G.px; }
  async prepareIso() {
    if (!this.iso) return;
    const r = this.room; this.isoReady = false;
    const jobs = [IsoVenue.build(this, r)];
    if (this.def.art && this.def.art.preload) jobs.push(this.def.art.preload(r, this));
    await Promise.all(jobs); if (this.room === r) this.isoReady = true;
  }
  loadFloor(floor, spawn) {
    if (!spawn && this.enterAt) { spawn = this.enterAt; this.enterAt = null; }
    super.loadFloor(floor, spawn);
    if (this.iso) { this.prepareIso(); this.snap(); }
  }
  guideMenu() { if (this.iso && this.def.guide) return this.def.guide.open(this); return super.guideMenu(); }
  // f.spots が あれば その マスから しらべる（エスカレーターの のりば など）
  request(f) {
    if (this.iso && f.spots && !Game.inputLocked && !this.busy && !f.hidden) { const c = f.spots.map(([x, y]) => ({ x, y, p: this.route(x, y) })).filter((c) => c.p).sort((a, b) => a.p.length - b.p.length)[0]; if (c) { this.walkTo(c.x, c.y, f); return true; } }
    return super.request(f);
  }
  // フロアごとの BGM（12F・13F は すいぞくかんの 曲）
  changeFloor(floor, spawn) { super.changeFloor(floor, spawn); if (this.iso) Sound.bgm(this.room.bgm || this.def.bgm || "house"); }
  walkable(x, y) {
    if (!this.iso) return super.walkable(x, y);
    const r = this.room; if (IsoVenue.solidAt(r, x, y)) return false;
    return !this.fixtures.some((f) => !f.hidden && !f.walk && !f.over && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  }
  // 足もとの 投影（タイルの まんなか）
  feet(x, y) { return IsoVenue.p(x + 0.5, y + 0.5, 0); }
  cameraTarget() {
    if (!this.iso) return super.cameraTarget();
    const L = this.party[0], q = this.feet(L.x, L.y), b = IsoVenue.bounds(this.room), s = this.s, top = 70 / s, bottom = 120 / s;
    const hw = G.W / 2 / s, hh = (G.H / 2) / s;
    const x = b.w <= hw * 2 ? b.x + b.w / 2 : U.clamp(q.x, b.x + hw, b.x + b.w - hw);
    // 3人は 画面の すこし 下に（すすむ さきの 店が よく 見える）
    let y = b.h + top + bottom <= hh * 2 ? b.y + b.h / 2 + (bottom - top) / 2 : U.clamp(q.y - hh * 0.22, b.y + hh - top, b.y + b.h - hh + bottom);
    return { x, y };
  }
  // 投影 → 画面（論理の 単位）
  toScreen(q, offset = 0) { return { x: (q.x - this.cam.x) * this.s + G.W / 2, y: (q.y - this.cam.y) * this.s + G.H / 2 + offset }; }
  screen(x, y) { if (!this.iso) return super.screen(x, y); return this.toScreen(this.feet(x, y)); }
  // 画面 → 床の タイル
  floorAt(px, py) { const q = IsoVenue.inv((px - G.W / 2) / this.s + this.cam.x, (py - G.H / 2) / this.s + this.cam.y); return { x: Math.floor(q.x), y: Math.floor(q.y), fx: q.x, fy: q.y }; }
  up(p, cancel) {
    if (!this.iso) return super.up(p, cancel);
    if (!IndoorWalk.release(this, p, cancel)) return;
    const f = this.fixtureAt(p.x, p.y);
    if (f) { this.request(f); return; }
    const t = this.floorAt(p.x, p.y); if (!this.walkTo(t.x, t.y)) this.walkNear(t.fx, t.fy);
  }
  // とおれない ところを タップしたら、いちばん ちかい とおれる マスへ
  walkNear(fx, fy) {
    let best = null;
    for (let y = Math.floor(fy) - 3; y <= Math.floor(fy) + 3; y++) for (let x = Math.floor(fx) - 3; x <= Math.floor(fx) + 3; x++) {
      if (!this.walkable(x, y)) continue; const d = Math.hypot(x + 0.5 - fx, y + 0.5 - fy); if (!best || d < best.d) best = { x, y, d };
    }
    if (best) this.walkTo(best.x, best.y);
  }
  // タップした ところに ある 什器（手前から）。かたちは 箱の 投影
  fixtureAt(px, py) {
    const q = { x: (px - G.W / 2) / this.s + this.cam.x, y: (py - G.H / 2) / this.s + this.cam.y };
    const list = (this.drawn || []).filter((o) => o.f && o.f.action && !o.f.hidden).reverse();
    for (const o of list) { const hull = o.hit || IsoVenue.hull(o.f); if (IsoVenue.inHull(hull, q.x, q.y)) return o.f; }
    return null;
  }
  async interact(f) {
    if (!this.iso || this.busy || this.closed) return super.interact(f);
    if (f.action === "buy" && f.shopId) { this.busy = true; try { ShopUI.detail(f.shopId, f.buyKind, VenueHalls.item(f.item), () => UI.updateHud()); } finally { this.busy = false; } return; }
    if (f.action === "shop" && f.shopId) { this.busy = true; try { await ShopUI.open(f.shopId, f.tab); } finally { this.busy = false; } return; }
    const art = this.def.art; if (art && art.interact && (await art.interact(this, f))) return;
    return super.interact(f);
  }
  update(dt) {
    const lifting = this.lift > 0;
    super.update(dt);
    if (lifting && !(this.lift > 0) && this.afterLift) { const fn = this.afterLift; this.afterLift = null; setTimeout(fn, 50); }
    if (this.iso && this.def.art && this.def.art.tick) this.def.art.tick(this, dt);
  }
  // 描く もの の 一覧（奥行きの はこ つき）
  drawables(room, fixtures, party, floor) {
    const art = this.def.art, out = [], dine = this.dine && this.dine.room === room && typeof DineSeats !== "undefined" ? this.dine : null;
    for (const f of fixtures) {
      if (f.hidden) continue;
      const hit = art.hit ? art.hit(f) : null;
      // 3人が すわって いる テーブルは そうに わけて あいだに 3人を 描く（O7・js/dine-seats.js）
      out.push({ f, layer: f.over ? 1 : 0, x0: f.x, y0: f.y, x1: f.x + f.w, y1: f.y + f.h, ...(hit ? { hit } : {}), draw: dine && dine.f === f ? (ctx, o) => DineSeats.draw(ctx, this, f, o) : (ctx, o) => art.fixture(ctx, this, f, o) });
    }
    party.forEach((p, i) => {
      const w = dine ? DineSeats.walker(this, i) : p, x = w.x + 0.5, y = w.y + 0.5, id = Save.d.order[i];
      // いすの うえの 子は テーブルと いっしょに 描く（ghost は まえの 大きな ものを すかす ため だけ）
      out.push({ who: id, p: w, ghost: !!w.ghost, layer: 0, x0: x - 0.3, y0: y - 0.3, x1: x + 0.3, y1: y + 0.3, draw: w.ghost ? () => {} : (ctx, o) => this.drawMember(ctx, w, id, o) });
    });
    if (art.extras) for (const e of art.extras(this, room, floor)) out.push(e);
    return out;
  }
  // 3人（おうちと おなじ 大きさの わりあい）
  charSize() { return 118 * this.s; }
  drawMember(ctx, p, id, o) {
    const q = this.toScreen(this.feet(p.x, p.y), o.offset || 0), c = Save.d.chars[id], s = this.s, sit = this.sitting > 0;
    ctx.fillStyle = "rgba(31,29,27,0.16)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 30 * s, 9 * s, 0, 0, 7); ctx.fill();
    Chara.draw(ctx, id, { pose: p.pose(), dir: p.dir, face: this.happyFace ? "happy" : sit ? "happy" : "normal", outfit: c.outfit, color: c.color }, q.x, q.y + (sit ? 4 * s : 0), this.charSize());
  }
  // 1フロアぶんを 描く（offset は エスカレーターで うつる ときの ずれ）
  layerIso(ctx, room, fixtures, party, cam, floor, offset) {
    const keep = this.cam; this.cam = cam;
    const hit = IsoVenue.cache.find((c) => c.room === room && c.k === this.k), s = this.s;
    if (hit) IsoVenue.drawStatic(ctx, hit, this.toScreen({ x: hit.b.x, y: hit.b.y }, offset), s);
    const art = this.def.art;
    if (art.under) art.under(ctx, this, room, floor, offset);
    const view = { x0: cam.x - G.W / 2 / s - 200, x1: cam.x + G.W / 2 / s + 200, y0: cam.y - G.H / 2 / s - 400, y1: cam.y + G.H / 2 / s + 400 };
    const list = this.drawables(room, fixtures, party, floor).filter((o) => {
      if (o.who) return true; const r = IsoVenue.rectOf(IsoVenue.shape(o)); return r.x < view.x1 && r.x + r.w > view.x0 && r.y < view.y1 && r.y + r.h > view.y0;
    });
    const sorted = IsoVenue.order(list);
    // 3人の まえに ある 大きな もの（と 頭の 上の いた fadeOver）は すける（うしろに かくれて 見えなく ならない ように）
    const members = sorted.filter((o) => o.who).map((o) => ({ o, r: this.memberRect(o.p || party[Save.d.order.indexOf(o.who)]) }));
    for (const o of sorted) {
      o.offset = offset; o.alpha = 1;
      if (!o.who && o.f && ((o.f.height ?? 40) > 70 || o.f.fadeOver) && !o.f.noFade && !(this.dine && this.dine.f === o.f)) {
        const r = IsoVenue.rectOf(IsoVenue.shape(o)), i = sorted.indexOf(o);
        if (members.some((m) => sorted.indexOf(m.o) < i && m.r.x < r.x + r.w && m.r.x + m.r.w > r.x && m.r.y < r.y + r.h && m.r.y + m.r.h > r.y && this.coversMember(o, m))) o.alpha = 0.42;
      }
      ctx.save(); if (o.alpha < 1) ctx.globalAlpha = o.alpha; o.draw(ctx, o); ctx.restore();
    }
    if (art.over) art.over(ctx, this, room, floor, offset);
    this.cam = keep;
    return sorted;
  }
  memberRect(p) { const q = this.feet(p.x, p.y), h = 118, z = p.z || 0; return { x: q.x - 28, y: q.y - z - h, w: 56, h }; }
  // ほんとうに かぶって いるか（足もとが 什器の 投影の 中）
  coversMember(o, m) { const hull = IsoVenue.shape(o), r = m.r; return IsoVenue.inHull(hull, r.x + r.w / 2, r.y + r.h * 0.45) || IsoVenue.inHull(hull, r.x + r.w / 2, r.y + r.h * 0.9); }
  render(ctx) {
    if (!this.iso) return super.render(ctx);
    const art = this.def.art;
    const bd = (art.backdrop && art.backdrop(this.room, this.floor)) || "#2F2A36";
    if (Array.isArray(bd)) { const gr = ctx.createLinearGradient(0, 0, 0, G.H); gr.addColorStop(0, bd[0]); gr.addColorStop(1, bd[1]); ctx.fillStyle = gr; } else ctx.fillStyle = bd;
    ctx.fillRect(0, 0, G.W, G.H);
    if (art.sky) art.sky(ctx, this, this.room, this.floor);
    let offset = 0;
    if (this.lift > 0 && this.previous) {
      const t = U.clamp(1 - this.lift / 1.2, 0, 1), ease = t * t * (3 - 2 * t), p = this.previous;
      offset = (1 - ease) * G.H * this.liftDirection;
      this.layerIso(ctx, p.room, p.fixtures, p.party, p.cam, p.floor, -ease * G.H * this.liftDirection);
    }
    this.drawn = this.layerIso(ctx, this.room, this.fixtures, this.party, this.cam, this.floor, offset);
    if (!this.isoReady) { ctx.fillStyle = "rgba(47,42,54,.55)"; ctx.fillRect(0, 0, G.W, G.H); }
    if (art.hud) art.hud(ctx, this);
    IndoorWalk.render(this, ctx);
  }
  resize() { super.resize(); if (this.iso) this.prepareIso(); }
}
SCENES.venue = IsoVenueScene;
