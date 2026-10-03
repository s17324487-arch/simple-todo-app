// ごはんの せき（O7・UI-72。オーナーの FB 2026-10-03「ご飯を食べるショップ系に関して、ちゃんと3人が席に座って注文できるようにして。」）
// 斜めの 館（IsoVenueScene）の テーブル・ボックス席で、3人が じぶんの せきまで あるいて すわってから ちゅうもん する。
// - せき: びっくぽの ボックス席（booth）と 4にんがけ（fmtable）・サンシャインいけぶの カフェと フードコートの テーブル（table）・
//   はくぶつかんの カフェ ジュラ（mucafetable）。1つの テーブルに 3人ぶんの せき（いち・たかさ・むき・おさらの ばしょ）。
// - すわる: 3人 それぞれ いちばん ちかい いりぐちの マスまで あるいて（とおれる マスだけ）、いすへ ぴょんと すべりこむ（すわる ポーズ sit_01）。
//   たのむと テーブルに おさら（たべものの 絵）・たべおわると たって いりぐちの マスに もどる。
// - 描きかた: テーブルの 絵を おくから じゅんに そう（f._layer 0,1,2…。MallArt.svgBuilder の only）に わけ、そうの あいだに すわった 3人を 描く
//   （おくの せきの 子は テーブルの うしろ・てまえの せきの 子は せもたれの うしろ）。そう 9 は テーブルの かざり（すわって いる ときは 3人の おさら）。
// - ほかの おきゃくさんが いる 席（f.taken）や カウンター（foodcounter・mucafebar）を タップすると、あいている テーブルへ あるく。
// セーブは かえない（館の なかの うごき だけ）。
const DineSeats = (() => {
  // ---- すわる ポーズ（Chara の CHARA_POSE_EXTRA）: からだを すこし ちぢめて、あしを まえに だす（まえむき・よこむきは あしを からだの まえに 描く）----
  const SQUASH = "translate(100,206) scale(1.02,0.94) translate(-100,-206)";
  const feetOver = (a) => Object.assign(a, { feetOver: true });
  CHARA_POSE_EXTRA.sit_01 = (id, view) => view === "side" ? feetOver(["translate(-27,-14) rotate(-10 87 197)", "translate(-34,-12) rotate(-6 113 197)", "translate(100,206) rotate(-3) scale(1.01,0.94) translate(-100,-206)"])
    : view === "back" ? ["translate(-4,-6)", "translate(4,-6)", SQUASH] : feetOver(["translate(-9,-11) rotate(-24 88 197)", "translate(9,-11) rotate(24 112 197)", SQUASH]);

  // ---- せきの かたち（テーブルの かど f.x, f.y からの いち）----
  // n: そうの かず・plates: おさらを 描く そう（テーブルの あと）・top: テーブルの うえの たかさ
  // せき: x, y・z（ざめんの たかさ）・dir（むき）・layer（この そうの まえに 描く）・plate（おさらの いち）
  const KINDS = {
    // ボックス席（まどぎわ dir y: ソファ｜テーブル｜ソファ が x に・かべぞい dir x: y に）。おくの ソファに 2人・てまえに 1人
    booth: { n: 4, plates: 2, top: 72, seats: (f) => f.dir !== "x" ? [
      { x: 0.64, y: 0.55, z: 44, dir: "right", layer: 1, plate: [1.3, 0.6] },
      { x: 0.64, y: 1.45, z: 44, dir: "right", layer: 1, plate: [1.3, 1.4] },
      { x: 2.36, y: 1.0, z: 44, dir: "left", layer: 3, plate: [1.72, 1.0] },
    ] : [
      { x: 0.55, y: 0.64, z: 44, dir: "down", layer: 1, plate: [0.6, 1.3] },
      { x: 1.45, y: 0.64, z: 44, dir: "down", layer: 1, plate: [1.4, 1.3] },
      { x: 1.0, y: 2.36, z: 44, dir: "up", layer: 3, plate: [1.0, 1.72] },
    ] },
    // びっくぽの 4にんがけ（きた・にし・ひがしの いす）
    fmtable: { n: 4, plates: 2, top: 70, seats: () => [
      { x: 1.0, y: 0.27, z: 42, dir: "down", layer: 1, plate: [1.0, 0.72] },
      { x: 0.27, y: 1.0, z: 42, dir: "right", layer: 1, plate: [0.72, 1.0] },
      { x: 1.73, y: 1.0, z: 42, dir: "left", layer: 3, plate: [1.28, 1.0] },
    ] },
    // サンシャインいけぶの まるい テーブル（きた・にし・ひがしの いす）
    table: { n: 4, plates: 2, top: 50, seats: (f) => { const cx = f.w / 2, cy = f.h / 2; return [
      { x: cx, y: cy - 0.72, z: 28, dir: "down", layer: 1, plate: [cx, cy - 0.27] },
      { x: cx - 0.72, y: cy, z: 28, dir: "right", layer: 1, plate: [cx - 0.27, cy] },
      { x: cx + 0.72, y: cy, z: 28, dir: "left", layer: 3, plate: [cx + 0.27, cy] },
    ]; } },
    // はくぶつかんの カフェ（まるい いす 3つ。いちは DinoHallArt.CAFE_STOOLS）
    mucafetable: { n: 3, plates: 2, top: 68, seats: (f) => { const cx = f.w / 2, cy = f.h / 2, S = (typeof DinoHallArt !== "undefined" && DinoHallArt.CAFE_STOOLS) || [[-0.75, -0.2], [0.2, -0.78], [0.7, 0.45]]; return [
      { x: cx + S[0][0], y: cy + S[0][1], z: 36, dir: "right", layer: 1, plate: [cx - 0.36, cy - 0.06] },
      { x: cx + S[1][0], y: cy + S[1][1], z: 36, dir: "down", layer: 1, plate: [cx + 0.08, cy - 0.36] },
      { x: cx + S[2][0], y: cy + S[2][1], z: 36, dir: "left", layer: 3, plate: [cx + 0.32, cy + 0.2] },
    ]; } },
  };
  // カウンター → おなじ おみせの テーブル
  const COUNTERS = {
    foodcounter: (sc, f) => sc.fixtures.filter((o) => o.kind === "table" && o.shop === f.shop && o.action === "eat"),
    mucafebar: (sc) => sc.fixtures.filter((o) => o.kind === "mucafetable" && o.action === "eat"),
  };
  const SPEED = 4.2, SLIDE = 0.42, GAP = 0.14, SINK = 9; // マス/びょう・すべりこむ じかん・3人の ずれ・ざめんから あしの さきまで
  const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const LF = new WeakMap(); // f → そうごとの 什器（_layer つき）
  const layerFix = (f, k) => { let c = LF.get(f); if (!c) LF.set(f, (c = [])); return c[k] || (c[k] = { ...f, _layer: k }); };
  const ease = (v) => v * v * (3 - 2 * v), clamp = (v) => Math.max(0, Math.min(1, v));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const until = (fn, max = 5) => new Promise((res) => { const end = Date.now() + max * 1000, tick = () => { let ok = false; try { ok = fn(); } catch (e) { ok = true; } if (ok || Date.now() > end) res(); else setTimeout(tick, 40); }; tick(); });

  const isSeat = (f) => !!(f && KINDS[f.kind]);
  const can = (sc, f) => !!(sc && sc.iso && isSeat(f) && !f.taken && !f.hidden && !sc.dine);
  // テーブルの まわりの とおれる マス
  function ring(sc, f) {
    const out = [];
    for (let y = f.y - 1; y <= f.y + f.h; y++) for (let x = f.x - 1; x <= f.x + f.w; x++) {
      if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) continue;
      if (sc.walkable(x, y)) out.push([x, y]);
    }
    return out;
  }
  // マスから マスへの みち（たて・よこ。はじめと おわりの マスも いれる。みつからない ときは null）
  function path(sc, from, to) {
    const key = (x, y) => x + "," + y, prev = new Map([[key(from[0], from[1]), null]]), q = [from];
    for (let i = 0; i < q.length && i < 1600; i++) {
      const [x, y] = q[i];
      if (x === to[0] && y === to[1]) { const out = []; let k = key(x, y); while (k) { out.unshift(k.split(",").map(Number)); k = prev.get(k); } return out; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || !(sc.walkable(nx, ny) || (nx === to[0] && ny === to[1]))) continue;
        prev.set(k, key(x, y)); q.push([nx, ny]);
      }
    }
    return null;
  }
  // 3人の せきと いりぐち。おおきい 子ほど おくの せき（てまえの 子が うしろの 子を かくさない）・おなじ ときは あるく みちが みじかい くみあわせ
  const BIG = { goji: 2, wanko: 1, gachan: 0 };
  function plan(sc, f) {
    const seats = KINDS[f.kind].seats(f), cells = ring(sc, f); if (!cells.length) return null;
    const d2 = (c, st) => (c[0] + 0.5 - f.x - st.x) ** 2 + (c[1] + 0.5 - f.y - st.y) ** 2;
    const entry = seats.map((st) => cells.slice().sort((a, b) => d2(a, st) - d2(b, st))[0]);
    const kids = sc.party.map((p, i) => ({ i, id: Save.d.order[i], from: [Math.round(p.x), Math.round(p.y)] }));
    const routes = kids.map((k) => entry.map((e) => path(sc, k.from, e)));
    const depth = (st) => st.layer * 10 + st.x + st.y; // おおきいほど てまえ
    let best = null;
    for (const perm of PERMS) {
      let cost = 0;
      for (let j = 0; j < kids.length; j++) { const r = routes[j][perm[j]]; cost += r ? r.length : 99; cost += (BIG[kids[j].id] ?? 1) * depth(seats[perm[j]]) * 4; }
      if (!best || cost < best.cost) best = { perm, cost };
    }
    return kids.map((k, j) => { const n = best.perm[j]; return { ...k, n, seat: seats[n], entry: entry[n], route: routes[j][n] || [k.from, entry[n]] }; });
  }
  // いまの いち（t は G.t）: { x, y（ゆかの てん）, z, dir, pose, face, inside（テーブルと いっしょに 描く）, bob }
  function where(d, k) {
    const f = d.f, t = G.t, sx = f.x + k.seat.x, sy = f.y + k.seat.y, ex = k.entry[0] + 0.5, ey = k.entry[1] + 0.5, sz = Math.max(0, k.seat.z - SINK);
    const toSeat = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    if (d.phase === "up") {
      const v = clamp((t - d.upT - k.j * GAP * 0.6) / SLIDE), e = ease(v);
      if (v >= 1) return { x: ex, y: ey, z: 0, dir: k.seat.dir, pose: "idle_01", face: "happy", inside: false, bob: 0 };
      return { x: sx + (ex - sx) * e, y: sy + (ey - sy) * e, z: sz * (1 - e) + Math.sin(v * Math.PI) * 12, dir: toSeat(ex - sx, ey - sy), pose: v < 0.5 ? "jump_01" : "land_01", face: "happy", inside: true, bob: 0 };
    }
    const u = t - k.t0;
    if (u < k.walkT || u < 0) {
      const r = k.route, s = Math.max(0, u) * SPEED, i = Math.min(r.length - 1, Math.floor(s)), j = Math.min(r.length - 1, i + 1), fr = Math.min(1, s - i);
      const x = r[i][0] + (r[j][0] - r[i][0]) * fr + 0.5, y = r[i][1] + (r[j][1] - r[i][1]) * fr + 0.5;
      const dir = j > i ? toSeat(r[j][0] - r[i][0], r[j][1] - r[i][1]) : toSeat(sx - x, sy - y);
      return { x, y, z: 0, dir, pose: u < 0 ? "idle_01" : ["idle_01", "walk_01", "idle_01", "walk_02"][Math.floor(t * 9) % 4], face: "normal", inside: false, bob: 0 };
    }
    const v = clamp((u - k.walkT) / SLIDE);
    if (v < 1) { const e = ease(v); return { x: ex + (sx - ex) * e, y: ey + (sy - ey) * e, z: sz * e + Math.sin(v * Math.PI) * 14, dir: v < 0.6 ? toSeat(sx - ex, sy - ey) : k.seat.dir, pose: v < 0.55 ? "jump_01" : "sit_01", face: "happy", inside: true, bob: 0 }; }
    const eat = d.phase === "eat" ? t - d.eatT : -1;
    return { x: sx, y: sy, z: sz, dir: k.seat.dir, pose: "sit_01", face: d.phase === "eat" ? "happy" : "normal", inside: true, bob: eat >= 0 && eat < 3.2 ? -Math.abs(Math.sin(eat * 7 + k.j * 1.3)) * 2.4 : 0 };
  }
  // ---- 描く ----
  function drawLayer(ctx, sc, art, f, k, off) {
    const sp = art.sprite(sc, layerFix(f, k), false); if (!sp) return false;
    const q = sc.toScreen(IsoVenue.p(f.x, f.y, 0), off), s = sc.s;
    ctx.drawImage(sp.c, q.x + sp.m.vb.x * s, q.y + sp.m.vb.y * s, sp.m.vb.w * s, sp.m.vb.h * s); return true;
  }
  function drawKid(ctx, sc, k, w, off) {
    const c = Save.d.chars[k.id], q = sc.toScreen(IsoVenue.p(w.x, w.y, w.z), off), s = sc.s;
    if (w.z < 6) { ctx.fillStyle = "rgba(31,29,27,0.16)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 30 * s, 9 * s, 0, 0, 7); ctx.fill(); }
    Chara.draw(ctx, k.id, { pose: w.pose, dir: w.dir, face: w.face, outfit: c.outfit, color: c.color }, q.x, q.y + w.bob * s, sc.charSize());
  }
  const foodPx = (sc) => Math.max(16, Math.ceil((26 * sc.k) / 8) * 8);
  function drawPlates(ctx, sc, d, off) {
    const f = d.f, top = KINDS[f.kind].top, s = sc.s, px = foodPx(sc), c = SvgCache.get("dinefood:" + d.food, () => Art.iconSvg("bag", d.food), px, px);
    for (const st of d.kids.map((k) => k.seat).sort((a, b) => a.plate[0] + a.plate[1] - b.plate[0] - b.plate[1])) {
      const q = sc.toScreen(IsoVenue.p(f.x + st.plate[0], f.y + st.plate[1], top), off);
      ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.ellipse(q.x, q.y, 15 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#E3DCCF"; ctx.lineWidth = 1.1 * s; ctx.beginPath(); ctx.ellipse(q.x, q.y, 10 * s, 5.2 * s, 0, 0, Math.PI * 2); ctx.stroke();
      if (c) ctx.drawImage(c, q.x - 13 * s, q.y - 21 * s, 26 * s, 26 * s);
    }
  }
  // テーブル（そう）と すわった 3人と おさら
  function draw(ctx, sc, f, o) {
    const d = sc.dine, K = KINDS[f.kind], art = sc.def.art, off = o.offset || 0;
    const kids = d.kids.map((k) => ({ k, w: where(d, k) })).filter((x) => x.w.inside).sort((a, b) => a.w.x + a.w.y - b.w.x - b.w.y);
    if (!d.ready) { art.fixture(ctx, sc, f, o); for (const x of kids) drawKid(ctx, sc, x.k, x.w, off); if (d.food) drawPlates(ctx, sc, d, off); return; }
    for (let L = 0; L <= K.n; L++) {
      for (const x of kids) if (x.k.seat.layer === L) drawKid(ctx, sc, x.k, x.w, off);
      if (L === K.plates && d.food) drawPlates(ctx, sc, d, off);
      if (L < K.n) drawLayer(ctx, sc, art, f, L, off);
    }
    const live = art.L && art.L[f.kind]; if (live) live.call(art, ctx, sc, f, off);
  }
  // まだ テーブルに すわって いない 子（あるいて いる ところ）は いつもの 3人と おなじ ように（null は テーブルと いっしょに 描く）
  // ghost: いすの うえの 子（描かない。まえの 大きな もの を すかす ため だけ。z は すわった たかさ）
  function walker(sc, i) {
    const d = sc.dine, k = d && d.kids.find((k) => k.i === i); if (!k) return sc.party[i];
    const w = where(d, k);
    return { x: w.x - 0.5, y: w.y - 0.5, z: w.z, dir: w.dir, pose: () => w.pose, ghost: w.inside };
  }

  // ---- すわる・たべる・たつ ----
  async function sit(sc, f) {
    if (!can(sc, f)) return false;
    const kids = plan(sc, f); if (!kids) return false;
    const art = sc.def.art, K = KINDS[f.kind], size = sc.charSize(), jobs = [];
    for (let L = 0; L < K.n; L++) { const j = art.sprite(sc, layerFix(f, L), true); if (j) jobs.push(j); }
    jobs.push(Chara.preload(kids.flatMap((k) => { const c = Save.d.chars[k.id]; return ["normal", "happy"].flatMap((face) => ["sit_01", "jump_01"].map((pose) => [k.id, { pose, dir: k.seat.dir, face, outfit: c.outfit, color: c.color }])); }), size));
    await Promise.race([Promise.all(jobs).catch(() => {}), wait(1500)]);
    if (sc.closed || sc.dine) return false;
    const t0 = G.t; kids.forEach((k, j) => { k.j = j; k.t0 = t0 + j * GAP; k.walkT = Math.max(0, k.route.length - 1) / SPEED; });
    let ready = true; for (let L = 0; L < K.n; L++) if (!art.sprite(sc, layerFix(f, L), false)) ready = false;
    sc.dine = { f, room: sc.room, kids, phase: "down", food: null, ready, t0, upT: 0, eatT: 0 };
    const end = Math.max(...kids.map((k) => k.t0 + k.walkT + SLIDE));
    await until(() => G.t >= end || !sc.dine, 8);
    if (sc.dine && sc.dine.f === f) { sc.dine.phase = "sit"; Sound.se("pop"); }
    return !!sc.dine;
  }
  async function serve(sc, food) {
    const d = sc.dine; if (!d || !BAG_INDEX[food]) return;
    const px = foodPx(sc); await Promise.race([SvgCache.ensure("dinefood:" + food, () => Art.iconSvg("bag", food), px, px), wait(800)]);
    if (sc.dine !== d) return;
    d.food = food; d.phase = "eat"; d.eatT = G.t; d.served = (d.served || 0) + 1; Sound.se("eat");
  }
  async function stand(sc) {
    const d = sc.dine; if (!d) return;
    d.phase = "up"; d.upT = G.t; d.food = null;
    const end = d.upT + (d.kids.length - 1) * GAP * 0.6 + SLIDE;
    await until(() => G.t >= end || sc.dine !== d, 4);
    for (const k of d.kids) { const p = sc.party[k.i]; if (!p) continue; const [x, y] = k.entry; p.tx = p.fx = x; p.ty = p.fy = y; p.t = 1; p.moving = false; p.dir = "down"; }
    if (sc.dine === d) sc.dine = null;
    sc.path = []; sc.pending = null; sc.routeCache = null;
  }
  // ---- ほかの せきへ ----
  function reach(sc, f) { let m = null; for (const [x, y] of f.spots || ring(sc, f)) { const p = sc.route(x, y); if (p && (m == null || p.length < m)) m = p.length; } return m; }
  function nearest(sc, list) { let best = null; for (const o of list) { const n = reach(sc, o); if (n != null && (!best || n < best.n)) best = { o, n }; } return best ? best.o : null; }
  const later = (sc, t) => setTimeout(() => { if (!sc.closed && G.scene === sc && !sc.busy) sc.request(t); }, 30);
  // ほかの おきゃくさんが いる 席 → あいている 席
  function redirect(sc, f) {
    if (!sc || !sc.iso || !isSeat(f) || !f.taken) return false;
    const t = nearest(sc, sc.fixtures.filter((o) => o !== f && o.action === f.action && isSeat(o) && !o.taken && !o.hidden));
    UI.toast("ここは ほかの おきゃくさんの せきだよ。あいている せきへ いこう");
    if (t) later(sc, t);
    return true;
  }
  // カウンター → あいている テーブル（すわって から ちゅうもん）
  function counter(sc, f) {
    if (!sc || !sc.iso || !COUNTERS[f.kind]) return false;
    const t = nearest(sc, COUNTERS[f.kind](sc, f).filter((o) => isSeat(o) && !o.taken && !o.hidden)); if (!t) return false;
    UI.toast("テーブルに すわって ちゅうもん しよう♪");
    later(sc, t);
    return true;
  }
  // PokaDebug 用: いまの ようす
  function state(sc) {
    const d = sc && sc.dine; if (!d) return null;
    return { label: d.f.label, kind: d.f.kind, phase: d.phase, food: d.food, ready: d.ready, seated: d.phase === "sit" || d.phase === "eat", kids: d.kids.map((k) => { const w = where(d, k); return { id: k.id, seat: k.n, x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: Math.round(w.z), dir: w.dir, pose: w.pose, inside: w.inside, entry: k.entry.slice(), layer: k.seat.layer }; }) };
  }
  return { KINDS, COUNTERS, SPEED, SLIDE, GAP, SINK, isSeat, can, ring, path, plan, where, draw, walker, sit, serve, stand, redirect, counter, nearest, until, state, layerFix };
})();
