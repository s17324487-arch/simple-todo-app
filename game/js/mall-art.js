// サンシャインいけぶ の 内装（斜め上から。投影は IsoVenue・おうちと おなじ）。
// 什器は 種類ごとの SVG（キーは 種類・いろ・大きさ だけ → 有限）、動く ところ（水・ステップ・扉・大画面）は canvas で 描く。
// 床と 奥の かべは 部屋ごとに 1まいの 静止画（IsoVenue.build → MallArt.paint）。
const MallArt = {
  // ---- いろ（パステル・線は INK）----
  C: {
    stone: ["#EEE6D6", "#E4D9C4", "#D3C6AE"], plaza: ["#F1E4CC", "#E6D3B2", "#C9B28C"], white: ["#F4F1EA", "#E9E4DA", "#D6CFC2"],
    wood: ["#D9B98E", "#CDA979", "#B28E62"], dark: ["#5D5566", "#4D4656", "#3C3645"], water: ["#8FCBDA", "#6FB5CB", "#B9E3EC"],
    wall: "#F5EFE3", wall2: "#E9E0CF", trim: "#B99E78", glass: "#CFE7EC", metal: ["#C9CED3", "#AEB5BC", "#E3E7EA"], leaf: ["#9DC08B", "#86AE78", "#B6D3A0"],
  },
  // 店の いろ（かべ・ゆか・かんばん）
  SHOP: {
    hane: { name: "はねーず", c: ["#F2C6D8", "#E9AFC7", "#C98AA6"], floor: "carpetP", logo: "heart", wall: "clothes" },
    animal: { name: "あにまるず", c: ["#C9DDB9", "#B2CD9F", "#87A873"], floor: "carpetG", logo: "paw", wall: "clothes" },
    gothic: { name: "ごしごし", c: ["#C9BCD9", "#B2A2C8", "#85739E"], floor: "carpetV", logo: "moon", wall: "clothes" },
    luxury: { name: "いいつか かぐ", c: ["#E8D6AE", "#D9C08E", "#AD915F"], floor: "wood", logo: "crown", wall: "furniture" },
    cafe: { name: "すばーたっくす", c: ["#C4D8C0", "#A9C5A3", "#6F9468"], floor: "wood", logo: "cup", wall: "menu" },
    crepes: { name: "でぃっぱーどん", c: ["#F3D1CC", "#E8B6AE", "#C88A80"], floor: "tileP", logo: "crepe", wall: "menu" },
    boba: { name: "たぴ", c: ["#D9C8E3", "#C6AFD6", "#9A7FB0"], floor: "tileV", logo: "boba", wall: "menu" },
    marche: { name: "いけぶくろ マルシェ", c: ["#D6E2BE", "#BFD3A0", "#8FA869"], floor: "wood", logo: "leaf", wall: "market" },
    puzzle: { name: "なかよしパズル", c: ["#C8D6EC", "#AFC3E3", "#7E97C2"], floor: "carpetB", logo: "piece", wall: "game" },
  },
  MAT: {
    stone: { c: ["#EEE6D6", "#E7DDCA"], line: "#D6CAB3", pat: "tile" },
    plaza: { c: ["#F3E7D0", "#EAD9BC"], line: "#D2BD98", pat: "tile" },
    white: { c: ["#F6F3EC", "#EEEAE1"], line: "#DDD6C9", pat: "tile" },
    wood: { c: ["#DDBF95", "#D2B284"], line: "#B99567", pat: "plank" },
    carpetP: { c: ["#F1D2DE", "#EBC6D4"], line: "#DDB0C2", pat: "carpet" },
    carpetG: { c: ["#D6E4C8", "#CCDDBC"], line: "#B9CCA6", pat: "carpet" },
    carpetV: { c: ["#D5CBE2", "#CBC0DA"], line: "#B6A8CB", pat: "carpet" },
    carpetB: { c: ["#D2DDEE", "#C7D4E9"], line: "#AFC0DE", pat: "carpet" },
    tileP: { c: ["#F6E1DC", "#EFD4CE"], line: "#E0BCB4", pat: "check" },
    tileV: { c: ["#E7DDEF", "#DDD0E8"], line: "#C9B7D8", pat: "check" },
    mat: { c: ["#8E8A86", "#85817D"], line: "#77736F", pat: "mat" },
    deck: { c: ["#CDB08A", "#C3A57E"], line: "#A98B63", pat: "plank" },
  },
  // ---- iso の SVG を くみたてる（原点は 什器の 床の かど f.x, f.y）----
  svgBuilder() {
    const T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B, b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    const P = (x, y, z = 0) => { const X = x * T, Y = y * T, q = { x: (X - Y) * A, y: (X + Y) * B - z }; b.x0 = Math.min(b.x0, q.x); b.y0 = Math.min(b.y0, q.y); b.x1 = Math.max(b.x1, q.x); b.y1 = Math.max(b.y1, q.y); return q; };
    const pts = (a) => a.map((q) => f2(q.x) + "," + f2(q.y)).join(" ");
    const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const o = {
      b, P, st,
      poly(list, fill, w = 1.6, extra = "") { return `<polygon points="${pts(list.map((v) => P(...v)))}" fill="${fill}" ${w ? st(w) : ""} ${extra}/>`; },
      line(list, col = INK, w = 1.6, extra = "") { return `<polyline points="${pts(list.map((v) => P(...v)))}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`; },
      // 箱: 上・南（+y）・東（+x）の 3まい
      box(x, y, w, d, z, h, col, line = 1.6) {
        const [top, south, east] = Array.isArray(col) ? col : [col, MallArt.shade(col, -0.1), MallArt.shade(col, -0.2)];
        return this.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], south, line) + this.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], east, line) + this.poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top, line);
      },
      // だ円（床に ねた 円。r は タイル）
      ellipse(cx, cy, z, r, fill, w = 1.6, extra = "") { const c = P(cx, cy, z), rx = r * T * Math.SQRT2 * A, ry = r * T * Math.SQRT2 * B; P(cx - r, cy + r, z); P(cx + r, cy - r, z); P(cx + r, cy + r, z); P(cx - r, cy - r, z); return `<ellipse cx="${f2(c.x)}" cy="${f2(c.y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${fill}" ${w ? st(w) : ""} ${extra}/>`; },
      // 円柱（まわりの 面は 左右の はしを むすぶ）
      cyl(cx, cy, r, z, h, col, w = 1.6) {
        const [top, side] = Array.isArray(col) ? col : [col, MallArt.shade(col, -0.14)], c0 = P(cx, cy, z), c1 = P(cx, cy, z + h), rx = r * T * Math.SQRT2 * A, ry = r * T * Math.SQRT2 * B;
        P(cx - r, cy + r, z); P(cx + r, cy - r, z + h); P(cx + r, cy + r, z);
        return `<path d="M${f2(c0.x - rx)},${f2(c0.y)} A${f2(rx)},${f2(ry)} 0 0 0 ${f2(c0.x + rx)},${f2(c0.y)} L${f2(c1.x + rx)},${f2(c1.y)} L${f2(c1.x - rx)},${f2(c1.y)} Z" fill="${side}" ${w ? st(w) : ""}/>` + `<ellipse cx="${f2(c1.x)}" cy="${f2(c1.y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${top}" ${w ? st(w) : ""}/>`;
      },
      // 投影した 点に 絵を おく（g の なかは 画面の むき）
      at(x, y, z, inner, sx = 1) { const q = P(x, y, z); return `<g transform="translate(${f2(q.x)} ${f2(q.y)}) scale(${sx})">${inner}</g>`; },
      grow(x0, y0, x1, y1) { b.x0 = Math.min(b.x0, x0); b.y0 = Math.min(b.y0, y0); b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1); },
      wrap(body, pad = 3) { const x = b.x0 - pad, y = b.y0 - pad, w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2; return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)}">${body}</svg>`, vb: { x, y, w, h } }; },
    };
    return o;
  },
  shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + k)))); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); },
  // ---- 什器の モデル（{ svg, vb }）。キーに 入れる ものは f.kind・f.w・f.h・f.variant・f.shop だけ ----
  modelKey(f) { return "mall:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant || "") + ":" + (f.shop || "") + ":" + (f.item || "") + ":" + (f.dir || ""); },
  models: new Map(),
  model(f) {
    const key = this.modelKey(f); if (this.models.has(key)) return this.models.get(key);
    const fn = this.M[f.kind]; if (!fn) { this.models.set(key, null); return null; }
    const S = this.svgBuilder(), body = fn.call(this, S, f), m = S.wrap(body);
    this.models.set(key, m); return m;
  },
  // 画面に おく 大きさ（端末の ピクセル）で ラスタライズ
  sprite(sc, f, ensure) {
    const m = this.model(f); if (!m) return null;
    const k = sc.k, pw = Math.max(4, Math.ceil(m.vb.w * k)), ph = Math.max(4, Math.ceil(m.vb.h * k)), key = this.modelKey(f);
    if (ensure) return SvgCache.ensure(key, () => m.svg, pw, ph);
    const c = SvgCache.get(key, () => m.svg, pw, ph); return c ? { c, m } : null;
  },
  preload(r, sc) { return Promise.all([...r.fixtures.map((f) => this.sprite(sc, f, true)).filter(Boolean), ...this.npcJobs(r, sc), ...this.itemJobs(r, sc)]); },
  npcJobs(r, sc) { return r.fixtures.filter((f) => f.kind === "npc").map((f) => this.npcSprite(sc, f, true)).filter(Boolean); },
  npcSprite(sc, f, ensure) {
    const size = sc.charSize(), pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w), sp = f.sp || "rabbit", cols = (NpcArt.SP[sp] || {}).cols || [], ci = f.ci || 0, col = cols.length ? cols[ci % cols.length] : null;
    const key = "mallnpc:" + sp + ":" + ci + ":" + (f.emo || "happy") + ":" + (f.dir || "down") + ":" + (f.pose || "idle_01");
    const svg = () => Art.npcSvg({ sp, emo: f.emo || "happy", dir: f.dir || "down", pose: f.pose || "idle_01", ...(col ? { col: col[0], col2: col[1] } : {}), ...(f.outfit ? { outfit: f.outfit } : {}) });
    if (ensure) return SvgCache.ensure(key, svg, pw, ph);
    return SvgCache.get(key, svg, pw, ph);
  },
  // タップの あたり（ななめの エスカレーターは 本体の 形だけ。ほかは 箱）
  hit(f) {
    if (f.kind !== "escalator") return null;
    const Z = f.rise || 200, down = f.dir === "down", yb = down ? f.y + 1 : f.y + f.h, yt = down ? f.y + f.h : f.y, zt = down ? -Z * ((f.h - 1) / f.h) : Z, pts = [];
    for (const x of [f.x, f.x + f.w]) pts.push(IsoVenue.p(x, yb, 0), IsoVenue.p(x, yb, 62), IsoVenue.p(x, yt, zt), IsoVenue.p(x, yt, zt + 62), IsoVenue.p(x, down ? f.y : f.y + f.h, 0));
    return pts;
  },
  // 什器を 描く（画面の 単位）
  fixture(ctx, sc, f, o) {
    const off = o.offset || 0, s = sc.s;
    if (f.kind === "npc") return this.drawNpc(ctx, sc, f, off);
    const sp = this.sprite(sc, f, false);
    if (sp) { const q = sc.toScreen(IsoVenue.p(f.x, f.y, 0), off); ctx.drawImage(sp.c, q.x + sp.m.vb.x * s, q.y + sp.m.vb.y * s, sp.m.vb.w * s, sp.m.vb.h * s); }
    const live = this.L[f.kind]; if (live) live.call(this, ctx, sc, f, off);
    if (f.item) this.drawItem(ctx, sc, f, off);
  },
  drawNpc(ctx, sc, f, off) {
    const c = this.npcSprite(sc, f, false), q = sc.toScreen(IsoVenue.p(f.x + 0.5, f.y + 0.5, f.z || 0), off), size = sc.charSize(), s = sc.s;
    ctx.fillStyle = "rgba(31,29,27,0.14)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 28 * s, 8 * s, 0, 0, 7); ctx.fill();
    if (!c) return;
    const w = size, h = (size * VB.h) / VB.w, bob = Math.sin(G.t * 2 + f.x * 1.3 + f.y) * 1.2 * s;
    ctx.drawImage(c, q.x - ((FOOT.x - VB.x) / VB.w) * w, q.y - ((FOOT.y - VB.y) / VB.h) * h + bob, w, h);
  },

  // ---- 床と かべ（静止画）----
  async prepare(r, sc) {
    const k = Math.min(sc.k, 1.2), jobs = [];
    for (const side of ["north", "west"]) { const w = this.wallSvg(r, side); if (!w) continue; jobs.push(SvgCache.ensure("mallwall:" + r.id + ":" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
    await Promise.all(jobs);
  },
  paint(g, r, sc) {
    this.paintFloor(g, r);
    this.paintHoles(g, r);
    this.paintWalls(g, r);
    if (r.paint) r.paint(g, r, sc);
  },
  matOf(r, x, y) { const ch = r.rows ? r.rows[y][x] : "."; return ch === "o" ? "stone" : (r.mats && r.mats[ch]) || "stone"; },
  paintFloor(g, r) {
    const P = (x, y, z = 0) => IsoVenue.p(x, y, z), tile = (x, y) => { const a = P(x, y), b = P(x + 1, y), c = P(x + 1, y + 1), d = P(x, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); };
    // 床の あつみ（手前の 2つの ふち）
    const slab = 26, edge = (pts, fill) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke(); };
    edge([P(0, r.h), P(r.w, r.h), P(r.w, r.h, -slab), P(0, r.h, -slab)], "#8D7F70");
    edge([P(r.w, 0), P(r.w, r.h), P(r.w, r.h, -slab), P(r.w, 0, -slab)], "#A39585");
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const m = this.MAT[this.matOf(r, x, y)] || this.MAT.stone, h = U.hash(x, y, 5);
      tile(x, y); g.fillStyle = m.pat === "check" ? m.c[(x + y) & 1] : m.c[h < 0.5 ? 0 : 1]; g.fill();
      if (m.pat === "tile") { g.strokeStyle = m.line; g.lineWidth = 1; g.stroke(); if (h > 0.86) { const c = P(x + 0.5, y + 0.5); g.fillStyle = "#FFFFFF66"; g.beginPath(); g.ellipse(c.x - 6, c.y - 2, 6, 2, -0.5, 0, 7); g.fill(); } }
      else if (m.pat === "plank") { g.strokeStyle = m.line; g.lineWidth = 0.8; for (let i = 1; i < 4; i++) { const a = P(x, y + i / 4), b = P(x + 1, y + i / 4); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } const j = (x * 7 + y * 3) % 4, a = P(x + (j + 1) / 5, y + (y % 4) / 4), b = P(x + (j + 1) / 5, y + (y % 4 + 1) / 4); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      else if (m.pat === "carpet") { if ((x + y * 2) % 5 === 0) { const c = P(x + 0.5, y + 0.5); g.fillStyle = m.line; g.beginPath(); g.ellipse(c.x, c.y, 5, 2.6, 0, 0, 7); g.fill(); } }
      else if (m.pat === "check") { g.strokeStyle = m.line; g.lineWidth = 0.7; g.stroke(); }
      else if (m.pat === "mat") { g.strokeStyle = m.line; g.lineWidth = 1; for (let i = 1; i < 4; i++) { const a = P(x + i / 4, y), b = P(x + i / 4, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } }
    }
    // 材質の さかい（店の ゆかの ふち）
    g.strokeStyle = "#B7A58A"; g.lineWidth = 1.6;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const m = this.matOf(r, x, y);
      if (x + 1 < r.w && this.matOf(r, x + 1, y) !== m) { const a = P(x + 1, y), b = P(x + 1, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      if (y + 1 < r.h && this.matOf(r, x, y + 1) !== m) { const a = P(x, y + 1), b = P(x + 1, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    }
    // 床の そとがわの 線
    g.strokeStyle = INK; g.lineWidth = 1.8; const o = [P(0, 0), P(r.w, 0), P(r.w, r.h), P(0, r.h)]; g.beginPath(); o.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.stroke();
    if (r.decals) for (const d of r.decals) this.decal(g, r, d);
  },
  // ふきぬけ（あな）の かたち（z の 高さで）。ellipse は まるい ふきぬけ、rect は エスカレーターの あな
  holePath(g, h, z = 0, dy = 0) {
    const T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B;
    g.beginPath();
    if (h.kind === "ellipse") { const c = IsoVenue.p(h.x, h.y, z); g.ellipse(c.x, c.y + dy, h.r * T * Math.SQRT2 * A, h.r * T * Math.SQRT2 * B, 0, 0, Math.PI * 2); }
    else { const ps = [IsoVenue.p(h.x, h.y, z), IsoVenue.p(h.x + h.w, h.y, z), IsoVenue.p(h.x + h.w, h.y + h.h, z), IsoVenue.p(h.x, h.y + h.h, z)]; ps.forEach((q, i) => (i ? g.lineTo(q.x, q.y + dy) : g.moveTo(q.x, q.y + dy))); g.closePath(); }
  },
  STOREY: 300,
  // ふきぬけから 見える 下の 階の ずれ（ほんとうの 300 だと 穴の そとに でて しまうので ちかく 見せる）
  VIEW: [190, 330],
  paintHoles(g, r) {
    for (const h of r.holes || []) {
      g.save(); this.holePath(g, h); g.clip();
      // したの 階（300 下）: 床の いろ と 石の わ
      const gr = g.createLinearGradient(0, IsoVenue.p(h.x, h.y).y - 200, 0, IsoVenue.p(h.x, h.y).y + 300); gr.addColorStop(0, "#8A8190"); gr.addColorStop(1, "#B9AE9C"); g.fillStyle = gr; g.fillRect(-4000, -4000, 8000, 8000);
      const shift = h.kind === "ellipse" ? this.VIEW[0] : this.VIEW[0];
      g.translate(0, shift);
      // 下の 階の 床の タイル（ずれる ぶん おくの マスまで）
      { const bx0 = Math.floor(h.kind === "ellipse" ? h.x - h.r : h.x) - 10, by0 = Math.floor(h.kind === "ellipse" ? h.y - h.r : h.y) - 10, bx1 = Math.ceil(h.kind === "ellipse" ? h.x + h.r : h.x + h.w) + 1, by1 = Math.ceil(h.kind === "ellipse" ? h.y + h.r : h.y + h.h) + 1;
        for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) { const a = IsoVenue.p(x, y), b = IsoVenue.p(x + 1, y), c = IsoVenue.p(x + 1, y + 1), d = IsoVenue.p(x, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fillStyle = (x + y) & 1 ? "#DED3BF" : "#D6CAB4"; g.fill(); g.strokeStyle = "#C6B9A1"; g.lineWidth = 1; g.stroke(); } }
      if (h.kind === "ellipse") { const c = IsoVenue.p(h.x, h.y); for (const [rr, col] of [[6.0, "#E6D3B2"], [4.5, "#EEE0C6"], [3.2, "#E6D3B2"]]) { g.beginPath(); g.ellipse(c.x, c.y, rr * IsoVenue.T * Math.SQRT2 * IsoVenue.A, rr * IsoVenue.T * Math.SQRT2 * IsoVenue.B, 0, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = "#C9B28C"; g.lineWidth = 2; g.stroke(); } }
      else { for (let y = Math.floor(h.y); y < h.y + h.h + 2; y++) for (let x = Math.floor(h.x) - 1; x < h.x + h.w + 1; x++) { const a = IsoVenue.p(x, y), b = IsoVenue.p(x + 1, y), c = IsoVenue.p(x + 1, y + 1), d = IsoVenue.p(x, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fillStyle = (x + y) & 1 ? "#DCD1BD" : "#D5C9B3"; g.fill(); g.strokeStyle = "#C3B69E"; g.lineWidth = 1; g.stroke(); } }
      g.translate(0, -shift);
      { const top = IsoVenue.p(h.kind === "ellipse" ? h.x - h.r * 0.7 : h.x, h.kind === "ellipse" ? h.y - h.r * 0.7 : h.y).y, gr2 = g.createLinearGradient(0, top - 60, 0, top + 260); gr2.addColorStop(0, "rgba(60,52,70,.55)"); gr2.addColorStop(1, "rgba(60,52,70,0)"); g.fillStyle = gr2; g.fillRect(-4000, -4000, 8000, 8000); }
      // 床の あつみ（おくの ふちの 内がわ）: あなの 中で、34 下に ずらした あなの そと
      g.beginPath(); g.rect(-4000, -4000, 8000, 8000);
      if (h.kind === "ellipse") { const c = IsoVenue.p(h.x, h.y); g.ellipse(c.x, c.y + 34, h.r * IsoVenue.T * Math.SQRT2 * IsoVenue.A, h.r * IsoVenue.T * Math.SQRT2 * IsoVenue.B, 0, 0, Math.PI * 2); }
      else { const ps = [IsoVenue.p(h.x, h.y), IsoVenue.p(h.x + h.w, h.y), IsoVenue.p(h.x + h.w, h.y + h.h), IsoVenue.p(h.x, h.y + h.h)]; ps.forEach((q, i) => (i ? g.lineTo(q.x, q.y + 34) : g.moveTo(q.x, q.y + 34))); g.closePath(); }
      g.fillStyle = "#E9E1D2"; g.fill("evenodd");
      g.restore();
      g.strokeStyle = INK; g.lineWidth = 1.8; this.holePath(g, h); g.stroke();
    }
  },
  decal(g, r, d) {
    const P = (x, y, z = 0) => IsoVenue.p(x, y, z), T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B;
    if (d.kind === "rings") {
      // ふんすいの まわりの 石の わ
      const c = P(d.x, d.y);
      for (const [rr, col, w] of d.rings) { g.beginPath(); g.ellipse(c.x, c.y, rr * T * Math.SQRT2 * A, rr * T * Math.SQRT2 * B, 0, 0, 7); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r0 = d.rings[0][0], r1 = d.rings[d.rings.length - 1][0]; const p0 = P(d.x + Math.cos(a) * r0, d.y + Math.sin(a) * r0), p1 = P(d.x + Math.cos(a) * r1, d.y + Math.sin(a) * r1); g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.strokeStyle = "#D4BE9A"; g.lineWidth = 1.2; g.stroke(); }
    } else if (d.kind === "arrow") {
      const c = P(d.x, d.y), a = d.dir === "x" ? P(d.x + 0.6, d.y) : P(d.x, d.y + (d.back ? -0.6 : 0.6)); const ang = Math.atan2(a.y - c.y, a.x - c.x) + (d.back && d.dir === "x" ? Math.PI : 0);
      g.save(); g.translate(c.x, c.y); g.scale(1, B / A); g.rotate(ang); g.fillStyle = d.col || "#E7C77FAA"; g.beginPath(); g.moveTo(16, 0); g.lineTo(-6, -12); g.lineTo(-2, 0); g.lineTo(-6, 12); g.closePath(); g.fill(); g.restore();
    } else if (d.kind === "line") {
      const a = P(d.x0, d.y0), b = P(d.x1, d.y1); g.strokeStyle = d.col; g.lineWidth = d.w || 3; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    } else if (d.kind === "text") {
      // 床に かいた 文字（ながめると ななめ）
      const c = P(d.x, d.y); g.save(); g.transform(A, B, -A, B, c.x, c.y); g.font = `900 ${d.size || 18}px 'M PLUS Rounded 1c', sans-serif`; g.textAlign = "center"; g.fillStyle = d.col || "#C9B28C"; g.fillText(d.text, 0, 0); g.restore();
    }
  },
  // 奥の かべ（北は x に そって、西は y に そって）。店の うしろの かべ・かんばん・エレベーター は かべの 絵。
  // かべの 中の 高さは z（床から）で きめる: v = H - z。店の かべは z 0〜250、その 上は 天じょうの ふち（1F は 2かい・3がいの てすり）
  ZTOP: 250,
  // 店の 入口の はしらと 名前の いたの 高さ（店の 中の マネキンや 家具に かからない ように 高め）
  FRONT: 236,
  wallSvg(r, side) {
    const L = (side === "north" ? r.w : r.h) * IsoVenue.T, H = r.wallH || 300, parts = (r.walls && r.walls[side]) || [], V = (z) => H - z, zt = this.ZTOP;
    let s = `<rect width="${L}" height="${H}" fill="${r.wallColor || this.C.wall}"/>`;
    s += this.upperBand(r, L, H, side);
    for (const p of parts) s += this.wallPart(side === "west" ? this.flipPart(p, r) : p, H, r, side);
    s += `<rect y="${V(12)}" width="${L}" height="12" fill="#CDBB9C"/><path d="M0,${V(12)} H${L}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}">${s}</svg>`, L, H };
  },
  // かべの 上の ほう。ふきぬけ（r.balcony）は 上の 階の 床の ふち・ガラスの てすり・上の 階の 店
  upperBand(r, L, H, side) {
    const V = (z) => H - z, zt = this.ZTOP, R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" ${extra}/>`;
    let s = R(0, 0, L, V(zt), r.upper || "#E7DDCB") + `<path d="M0,${V(zt)} H${L}" stroke="#B9A487" stroke-width="4"/>`;
    for (let u = 36; u < L; u += 96) s += `<circle cx="${u}" cy="${f2(V(zt) - 10)}" r="6" fill="#FFF3C9" stroke="#D8C08E" stroke-width="2"/>`;
    if (!r.balcony) return s;
    // 2かい と 3がい（上に つづく ふきぬけ）
    for (const [z0, tone] of [[zt + 16, 0], [zt + 16 + 150, 1]]) {
      if (z0 > H) break;
      const top = Math.min(H, z0 + 150);
      // 上の 階の 店（うすく）
      for (let u = 0, k = 0; u < L; u += 168, k++) { const c = ["#EFD3DF", "#D9E6CF", "#DDD3E8", "#F1E4C6", "#D3E3EA"][(k + tone * 2 + (side === "west" ? 3 : 0)) % 5]; s += R(u + 6, V(top), 156, top - z0 - 36, c, `stroke="${INK}" stroke-width="1.2" opacity="${tone ? 0.75 : 0.9}"`) + R(u + 40, V(top) + 8, 88, 16, "#FFF8EA", `rx="4" stroke="${INK}" stroke-width="1"`); }
      // 床の ふち（あかり）と ガラスの てすり
      s += R(0, V(z0 + 18), L, 18, "#F6F0E4", `stroke="${INK}" stroke-width="1.4"`);
      for (let u = 20; u < L; u += 48) s += `<circle cx="${u}" cy="${f2(V(z0 + 9))}" r="3" fill="#FFE9A8"/>`;
      s += R(0, V(z0 + 58), L, 40, "#CFE7EC", `opacity=".75" stroke="${INK}" stroke-width="1"`) + `<path d="M0,${f2(V(z0 + 58))} H${L}" stroke="#8D949B" stroke-width="5"/>`;
      for (let u = 0; u < L; u += 48) s += `<path d="M${u},${f2(V(z0 + 58))} V${f2(V(z0 + 18))}" stroke="#A7B3BA" stroke-width="1.5"/>`;
    }
    return s;
  },
  // 店の おくの かべ（店の しゅるいで かえる）。u0・w は かべの 中の はんい、V(z) は 高さ → かべの y
  shopWall(sh, u0, w, V, zt) {
    const c = sh.c, R = (x, y, ww, hh, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(ww)}" height="${f2(hh)}" fill="${fill}" stroke="${INK}"${/stroke-width/.test(extra) ? "" : ` stroke-width="1.4"`} ${extra}/>`, P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round" ${extra}/>`;
    const kind = sh.wall || "shelves", x0 = u0 + 14, x1 = u0 + w - 14;
    let s = "";
    if (kind === "clothes") {
      // ハンガーの ぼう と ふく、たたんだ ふくの たな、まるい かがみ
      s += `<path d="M${f2(x0)},${f2(V(zt - 60))} H${f2(x1 - 60)}" stroke="#8D8A92" stroke-width="4"/>`;
      for (let x = x0 + 14, i = 0; x < x1 - 70; x += 26, i++) { const col = [c[1], "#FFF1D9", c[2], "#CFE3E6", "#F4C7C3"][i % 5]; s += `<path d="M${f2(x)},${f2(V(zt - 60))} v6" stroke="#8D8A92" stroke-width="1.5"/>` + P(`M${f2(x - 11)},${f2(V(zt - 66))} L${f2(x + 11)},${f2(V(zt - 66))} L${f2(x + 14)},${f2(V(zt - 128))} L${f2(x - 14)},${f2(V(zt - 128))} Z`, col); }
      s += R(x1 - 52, V(zt - 40), 46, 100, "#E6F3F6", `rx="23"`) + `<path d="M${f2(x1 - 40)},${f2(V(zt - 70))} l14,-16" stroke="#FFFFFF" stroke-width="4"/>`;
      s += R(x0, V(92), x1 - x0 - 60, 8, "#FFFDF6");
      for (let x = x0 + 6, i = 0; x < x1 - 80; x += 22, i++) s += R(x, V(116), 18, 22, [c[0], "#FFF1D9", c[1]][i % 3], `rx="2"`) + `<path d="M${f2(x)},${f2(V(106))} h18" stroke="${c[2]}" stroke-width="1"/>`;
    } else if (kind === "furniture") {
      // がく・かべの あかり・おおきな かがみ
      for (let x = x0 + 20, i = 0; x < x1 - 60; x += 110, i++) { s += R(x, V(zt - 60), 70, 54, "#FFF8EA", `rx="2"`) + R(x + 6, V(zt - 66), 58, 42, ["#BFD9C5", "#E7C7B7", "#C9C3E0"][i % 3]) + P(`M${f2(x + 8)},${f2(V(zt - 100))} l16,-14 l12,8 l16,-16 l14,22 Z`, "#9DB38A"); s += `<circle cx="${f2(x + 90)}" cy="${f2(V(zt - 90))}" r="8" fill="#FFF1B8" stroke="${INK}" stroke-width="1.3"/><path d="M${f2(x + 90)},${f2(V(zt - 98))} v-12" stroke="#B9A487" stroke-width="3"/>`; }
      s += R(x1 - 44, V(zt - 30), 38, 150, "#E6F3F6", `rx="4"`) + `<path d="M${f2(x1 - 36)},${f2(V(zt - 60))} l20,-26" stroke="#FFFFFF" stroke-width="4"/>`;
      s += `<path d="M${f2(x0)},${f2(V(40))} H${f2(x1)}" stroke="${c[2]}" stroke-width="3" opacity=".7"/>`;
    } else if (kind === "menu") {
      // メニューの いた（3まい）と うしろの カウンター（きかい・カップ）
      const n = Math.max(2, Math.floor((x1 - x0) / 110)), bw = (x1 - x0 - (n - 1) * 10) / n;
      for (let i = 0; i < n; i++) { const x = x0 + i * (bw + 10), top = V(zt - 62); s += R(x, top, bw, 60, "#3E4A44", `rx="4"`); for (let k = 0; k < 3; k++) s += `<circle cx="${f2(x + 14)}" cy="${f2(top + 13 + k * 17)}" r="5.5" fill="${["#F4A4A9", "#F7D889", "#C79A76", "#B8D8A0"][(i + k) % 4]}"/><path d="M${f2(x + 26)},${f2(top + 13 + k * 17)} h${f2(bw - 56)}" stroke="#F3EEDF" stroke-width="3"/><path d="M${f2(x + bw - 22)},${f2(top + 13 + k * 17)} h12" stroke="#F7D889" stroke-width="3"/>`; }
      s += R(x0, V(96), x1 - x0, 12, "#E8DCC6") + R(x0, V(84), x1 - x0, 72, c[1]);
      for (let x = x0 + 16, i = 0; x < x1 - 30; x += 60, i++) s += i % 2 ? R(x, V(126), 34, 30, "#8C8890", `rx="4"`) + R(x + 6, V(118), 22, 10, "#3E4652", `rx="2"`) : [0, 1, 2].map((k) => R(x + k * 12, V(112), 10, 16, "#FFFFFF", `rx="2"`)).join("");
    } else if (kind === "books") {
      for (const zb of [24, 70, 116, 162]) { s += R(x0, V(zb + 40), x1 - x0, 42, "#E8D6B8"); for (let x = x0 + 4, i = 0; x < x1 - 8; x += 9 + (i % 3), i++) s += R(x, V(zb + 36 - (i % 4) * 2), 7 + (i % 3), 32 - (i % 4) * 2, ["#B87859", "#7F9D8B", "#CAAB69", "#9096A6", "#D99A9A", c[1]][i % 6], "stroke-width=\"0.8\""); }
    } else if (kind === "toys") {
      for (const zb of [40, 110]) s += R(x0, V(zb + 8), x1 - x0, 8, "#E3C996");
      for (let x = x0 + 20, i = 0; x < x1 - 20; x += 44, i++) { const col = ["#F4A4A9", "#9FD1D9", "#F7D889", "#B8D8A0", "#C9BCD9"][i % 5]; s += i % 3 === 0 ? `<circle cx="${f2(x)}" cy="${f2(V(66))}" r="16" fill="${col}" stroke="${INK}" stroke-width="1.4"/>` : i % 3 === 1 ? R(x - 14, V(80), 28, 28, col, `rx="3"`) : P(`M${f2(x - 14)},${f2(V(52))} L${f2(x)},${f2(V(84))} L${f2(x + 14)},${f2(V(52))} Z`, col); s += `<circle cx="${f2(x)}" cy="${f2(V(136))}" r="13" fill="#C79A76" stroke="${INK}" stroke-width="1.3"/><circle cx="${f2(x - 10)}" cy="${f2(V(146))}" r="5" fill="#C79A76" stroke="${INK}" stroke-width="1.1"/><circle cx="${f2(x + 10)}" cy="${f2(V(146))}" r="5" fill="#C79A76" stroke="${INK}" stroke-width="1.1"/>`; }
    } else if (kind === "market") {
      s += R(x0 + 10, V(zt - 20), 120, 64, "#3E4A44", `rx="4"`) + `<path d="M${f2(x0 + 24)},${f2(V(zt - 40))} h60 M${f2(x0 + 24)},${f2(V(zt - 56))} h80 M${f2(x0 + 24)},${f2(V(zt - 72))} h50" stroke="#F3EEDF" stroke-width="3"/>`;
      for (const zb of [60, 116]) { s += R(x0 + 140, V(zb + 8), x1 - x0 - 140, 8, "#C9A36B"); for (let x = x0 + 150, i = 0; x < x1 - 24; x += 34, i++) s += R(x, V(zb + 40), 26, 32, "#EFE6D2", `rx="6"`) + `<rect x="${f2(x + 3)}" y="${f2(V(zb + 26))}" width="20" height="14" fill="${["#E86B6B", "#F7B84D", "#9DC08B", "#F2D46B"][i % 4]}"/>`; }
    } else if (kind === "game") {
      for (let x = x0 + 10, i = 0; x < x1 - 30; x += 64, i++) { const top = V(zt - 66); s += R(x, top, 52, 64, "#2F3B55", `rx="6"`); for (let k = 0; k < 6; k++) s += `<rect x="${f2(x + 8 + (k % 3) * 13)}" y="${f2(top + 10 + Math.floor(k / 3) * 16)}" width="11" height="13" rx="2" fill="${["#F4A4A9", "#F7D889", "#9FD1D9", "#B8D8A0", "#C9BCD9", "#F7B84D"][(k + i) % 6]}"/>`; s += R(x + 8, top + 44, 36, 10, "#F7D889", `rx="3"`); }
    } else {
      for (const [z1, hh] of [[zt - 66, 34], [zt - 118, 34]]) { s += R(x0, V(z1), x1 - x0, hh, "#FFFDF6", `rx="3"`); for (let x = x0 + 10, i = 0; x < x1 - 16; x += 22, i++) s += R(x, V(z1) + 8, 14, hh - 10, [c[0], c[1], "#FBE6B8", "#CFE3E6"][i % 4], `rx="2"`); }
    }
    return s;
  },
  flipPart(p, r) { return { ...p, from: r.h - p.to, to: r.h - p.from }; },
  wallPart(p, H, r, side) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, zt = this.ZTOP, R = (x, y, ww, hh, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(ww)}" height="${f2(hh)}" fill="${fill}" stroke="${INK}" stroke-width="1.6" ${extra}/>`;
    let s = "";
    if (p.kind === "shop") {
      const sh = this.SHOP[p.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] }, c = sh.c;
      s += R(u0, V(zt), w, zt - 12, c[0]);
      for (let x = u0 + 18; x < u0 + w - 10; x += 36) s += `<path d="M${f2(x)},${f2(V(zt) + 6)} V${f2(V(18))}" stroke="${c[1]}" stroke-width="3" opacity=".6"/>`;
      s += this.shopWall(sh, u0, w, V, zt);
      // かんばん（名前は canvas で）。店の かべの 絵の 上に
      const bw = Math.min(w - 40, 200), bx = u0 + (w - bw) / 2;
      s += R(bx, V(zt - 14), bw, 40, "#FFF8EA", `rx="8"`) + R(bx + 6, V(zt - 20), 28, 28, c[1], `rx="6"`) + this.logo(sh.logo, bx + 20, V(zt - 34), c[2]);
      s += `<path d="M${f2(u0)},${f2(V(zt))} V${f2(V(12))} M${f2(u0 + w)},${f2(V(zt))} V${f2(V(12))}" stroke="${INK}" stroke-width="2"/>`;
    } else if (p.kind === "elevator") {
      const n = p.doors || 2, dw = 70, gap = (w - n * dw) / (n + 1), top = V(162);
      s += R(u0 + 6, V(206), w - 12, 194, "#D9DDE0");
      for (let i = 0; i < n; i++) { const x = u0 + gap + i * (dw + gap); s += R(x - 6, top - 4, dw + 12, 154, "#A9B2BA") + R(x, top, dw, 150, "#CBD3DA") + `<path d="M${f2(x + dw / 2)},${f2(top)} V${f2(top + 150)}" stroke="${INK}" stroke-width="1.4"/>` + R(x + dw / 2 - 18, top - 24, 36, 16, "#3E4652", `rx="3"`) + R(x + dw + 12, top + 60, 10, 22, "#F2F1EA", `rx="3"`) + `<circle cx="${f2(x + dw + 17)}" cy="${f2(top + 66)}" r="2.6" fill="#E7C877"/><circle cx="${f2(x + dw + 17)}" cy="${f2(top + 76)}" r="2.6" fill="#E7C877"/>`; }
    } else if (p.kind === "toilet") {
      const top = V(160);
      s += R(u0 + 8, top, w - 16, 148, "#E3E8EA") + R(u0 + 20, top + 22, (w - 52) / 2, 126, "#9FB7C9") + R(u0 + w / 2 + 6, top + 22, (w - 52) / 2, 126, "#E3AAB9");
      s += this.picto("man", u0 + 20 + (w - 52) / 4, top + 56, "#FFFFFF") + this.picto("woman", u0 + w / 2 + 6 + (w - 52) / 4, top + 56, "#FFFFFF");
    } else if (p.kind === "screen") {
      // ふきぬけの 大きな がめん（中みは canvas: MallArt.screen）
      const z0 = p.z0 || zt + 30, z1 = p.z1 || Math.min(H - 6, z0 + 120); s += R(u0 + 4, V(z1), w - 8, z1 - z0, "#2E2B36", `rx="6"`) + R(u0 + 12, V(z1) + 8, w - 24, z1 - z0 - 16, "#26324A", `rx="3"`);
    } else if (p.kind === "door") {
      const top = V(172);
      s += R(u0 + 10, top, w - 20, 160, "#9AA7AE");
      if (p.view === "walkway") {
        // ガラスの むこうの うごく ほどう（えきの ほう）
        const cx = u0 + w / 2, hz = top + 64;
        s += `<rect x="${f2(u0 + 16)}" y="${f2(top + 6)}" width="${f2(w - 32)}" height="154" fill="#E9EEF0"/>` + `<path d="M${f2(u0 + 16)},${f2(top + 160)} L${f2(cx - 10)},${f2(hz)} L${f2(cx + 10)},${f2(hz)} L${f2(u0 + w - 16)},${f2(top + 160)} Z" fill="#C3C9CE"/>` + `<path d="M${f2(cx - 44)},${f2(top + 160)} L${f2(cx - 4)},${f2(hz)} L${f2(cx + 4)},${f2(hz)} L${f2(cx + 44)},${f2(top + 160)} Z" fill="#7E878F"/>` + `<path d="M${f2(u0 + 16)},${f2(top + 6)} L${f2(cx - 10)},${f2(hz - 20)} L${f2(cx + 10)},${f2(hz - 20)} L${f2(u0 + w - 16)},${f2(top + 6)} Z" fill="#DADFE2"/>` + `<circle cx="${f2(cx)}" cy="${f2(hz - 8)}" r="5" fill="#FFF3C9"/>`;
      } else s += `<rect x="${f2(u0 + 16)}" y="${f2(top + 6)}" width="${f2(w - 32)}" height="154" fill="${p.col || "#BFD7DE"}"/>`;
      s += `<rect x="${f2(u0 + 16)}" y="${f2(top + 6)}" width="${f2(w - 32)}" height="154" fill="#CFE7EC" opacity=".35" stroke="${INK}" stroke-width="1.4"/><path d="M${f2(u0 + w / 2)},${f2(top + 6)} V${f2(V(12))}" stroke="${INK}" stroke-width="1.5"/>` + `<path d="M${f2(u0 + 26)},${f2(top + 40)} l24,-22 M${f2(u0 + 26)},${f2(top + 66)} l40,-36" stroke="#FFFFFF" stroke-width="4" opacity=".6"/>`;
      s += R(u0 + 10, V(200), w - 20, 22, "#FFF7E5", `rx="5"`);
    } else if (p.kind === "window") {
      const top = V(zt - 20); s += R(u0 + 8, top, w - 16, zt - 60, "#BFE0EA") + `<path d="M${f2(u0 + 16)},${f2(top + 40)} l30,-26 M${f2(u0 + 16)},${f2(top + 70)} l50,-44" stroke="#FFFFFF" stroke-width="5" opacity=".7"/>`;
    } else if (p.kind === "plain") {
      s += R(u0, V(zt), w, zt - 12, p.col || "#EFE6D6");
    } else if (p.kind === "poster") {
      s += R(u0 + 10, V(190), w - 20, 110, p.col || "#F3D6A6", `rx="4"`) + R(u0 + 18, V(182), w - 36, 70, "#FFF8EA", `rx="3"`);
    }
    return s;
  },
  logo(kind, x, y, col) {
    const st = `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`;
    if (kind === "heart") return `<path d="${heartPath(x, y - 7, 0.55)}" fill="#FFF3F7" ${st}/>`;
    if (kind === "paw") return `<g fill="#FFF8EC" ${st}><circle cx="${x}" cy="${y + 3}" r="5"/><circle cx="${x - 6}" cy="${y - 4}" r="2.6"/><circle cx="${x}" cy="${y - 7}" r="2.6"/><circle cx="${x + 6}" cy="${y - 4}" r="2.6"/></g>`;
    if (kind === "moon") return `<path d="M${x + 2},${y - 9} A9,9 0 1 0 ${x + 6},${y + 7} A7,7 0 1 1 ${x + 2},${y - 9} Z" fill="#FFF3C4" ${st}/>`;
    if (kind === "crown") return `<path d="M${x - 9},${y + 5} L${x - 9},${y - 6} L${x - 4},${y - 1} L${x},${y - 8} L${x + 4},${y - 1} L${x + 9},${y - 6} L${x + 9},${y + 5} Z" fill="#FFE9A8" ${st}/>`;
    if (kind === "cup") return `<path d="M${x - 7},${y - 6} H${x + 7} L${x + 5},${y + 7} H${x - 5} Z" fill="#FFF8EC" ${st}/><path d="M${x + 6},${y - 3} q5,1 2,6" fill="none" ${st}/>`;
    if (kind === "crepe") return `<path d="M${x - 8},${y - 6} L${x},${y + 9} L${x + 8},${y - 6} Z" fill="#F7DCA6" ${st}/><circle cx="${x}" cy="${y - 7}" r="4" fill="#F4A4A9" ${st}/>`;
    if (kind === "boba") return `<path d="M${x - 6},${y - 7} H${x + 6} L${x + 4},${y + 8} H${x - 4} Z" fill="#F3E6D8" ${st}/>` + [-2, 2].map((d) => `<circle cx="${x + d}" cy="${y + 4}" r="1.6" fill="${INK}"/>`).join("") + `<path d="M${x + 1},${y - 7} l3,-6" ${st}/>`;
    if (kind === "leaf") return `<path d="M${x - 8},${y + 7} Q${x - 8},${y - 8} ${x + 8},${y - 8} Q${x + 8},${y + 7} ${x - 8},${y + 7} Z" fill="#E9F3D7" ${st}/>`;
    if (kind === "piece") return `<path d="M${x - 7},${y - 7} h5 a3,3 0 1 1 4,0 h5 v5 a3,3 0 1 1 0,4 v5 h-14 Z" fill="#FFF7E6" ${st}/>`;
    return `<circle cx="${x}" cy="${y}" r="7" fill="#FFF8EC" ${st}/>`;
  },
  // ピクトグラム（トイレ・エレベーター など。白い 線なし）
  picto(kind, x, y, col) {
    if (kind === "man") return `<g fill="${col}"><circle cx="${x}" cy="${y - 14}" r="7"/><path d="M${x - 10},${y - 4} h20 v26 h-6 v24 h-8 v-24 h-6 Z"/></g>`;
    if (kind === "woman") return `<g fill="${col}"><circle cx="${x}" cy="${y - 14}" r="7"/><path d="M${x - 5},${y - 4} h10 l9,30 h-7 v20 h-14 v-20 h-7 Z"/></g>`;
    return "";
  },
  paintWalls(g, r) {
    const A = IsoVenue.A, B = IsoVenue.B, H = r.wallH || 260;
    for (const side of ["west", "north"]) {
      const w = r._walls && r._walls[side]; if (!w || !w.c) continue;
      // 西の かべは 手前（みなみ）から おくへ 左→右 に 読める ように、u = L - y で 描く
      g.save(); if (side === "north") g.transform(A, B, 0, 1, 0, -H); else g.transform(A, -B, 0, 1, -w.L * A, w.L * B - H);
      g.drawImage(w.c, 0, 0, w.L, w.H);
      if (side === "west") { g.fillStyle = "rgba(90,80,60,.07)"; g.fillRect(0, 0, w.L, w.H); }
      // 名前（かんばん）: ゲームの 字で
      for (const p of (r.walls && r.walls[side]) || []) this.wallText(g, side === "west" ? this.flipPart(p, r) : p, H);
      g.lineWidth = 1.8; g.strokeStyle = INK; g.strokeRect(0, 0, w.L, w.H);
      g.restore();
    }
    // かどの 線
    const a = IsoVenue.p(0, 0, 0), b = IsoVenue.p(0, 0, H); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    // かべの 上は 天じょうの かげ（上へ いくほど うすく、背景に なじむ）
    const F = 150, steps = 12;
    for (const [x0, y0, x1, y1] of [[0, 0, r.w, 0], [0, 0, 0, r.h]]) for (let i = 0; i < steps; i++) {
      const t0 = i / steps, t1 = (i + 1) / steps, A0 = IsoVenue.p(x0, y0, H + F * t0), A1 = IsoVenue.p(x1, y1, H + F * t0), B1 = IsoVenue.p(x1, y1, H + F * t1), B0 = IsoVenue.p(x0, y0, H + F * t1);
      g.beginPath(); g.moveTo(A0.x, A0.y); g.lineTo(A1.x, A1.y); g.lineTo(B1.x, B1.y); g.lineTo(B0.x, B0.y); g.closePath(); g.fillStyle = `rgba(214,204,186,${(0.8 * (1 - t1)).toFixed(3)})`; g.fill();
    }
  },
  wallText(g, p, H) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, zt = this.ZTOP;
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
    if (p.kind === "shop") { const sh = this.SHOP[p.shop] || {}, bw = Math.min(w - 40, 200), bx = u0 + (w - bw) / 2; g.font = `900 19px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || sh.name || "", bx + bw / 2 + 16, V(zt - 34), bw - 50); }
    else if (p.kind === "elevator") { g.font = `900 15px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "エレベーター", u0 + w / 2, V(190), w - 30); }
    else if (p.kind === "toilet") { g.font = `900 14px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "トイレ", u0 + w / 2, V(150), w - 20); }
    else if (p.kind === "door") { g.font = `900 14px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "", u0 + w / 2, V(189), w - 26); }
    else if (p.kind === "poster") { g.font = `900 13px 'M PLUS Rounded 1c', sans-serif`; (p.lines || [p.label || ""]).forEach((t, i) => g.fillText(t, u0 + w / 2, V(162) + i * 18, w - 40)); }
    g.textBaseline = "alphabetic";
  },
  // ---- モデル ----
  M: {
    // ふんすい（まるい いけ・2だんの うけざら・まんなかの はしら）。水は L.fountain
    fountain(S, f) {
      const cx = f.w / 2, cy = f.h / 2, R = Math.min(f.w, f.h) / 2 - 0.1;
      let s = S.ellipse(cx, cy, 0, R + 0.08, "#00000018", 0);
      s += S.cyl(cx, cy, R, 0, 26, ["#E3D7C2", "#CDBEA4"]) + S.ellipse(cx, cy, 26, R - 0.28, "#76B8CB", 1.4) + S.ellipse(cx, cy, 26, R - 0.5, "#8FCBDA", 0);
      s += S.cyl(cx, cy, 0.42, 26, 50, ["#E8DDC9", "#D1C3A9"]) + S.cyl(cx, cy, 1.3, 74, 12, ["#E7DBC6", "#CDBEA3"]) + S.ellipse(cx, cy, 86, 1.12, "#8FCBDA", 1.2);
      s += S.cyl(cx, cy, 0.26, 86, 40, ["#E8DDC9", "#D1C3A9"]) + S.cyl(cx, cy, 0.7, 124, 9, ["#E7DBC6", "#CDBEA3"]) + S.ellipse(cx, cy, 133, 0.55, "#9DD3E0", 1.2);
      s += S.cyl(cx, cy, 0.12, 133, 18, ["#E8DDC9", "#D1C3A9"]);
      return s;
    },
    // ベンチ（木の いた・てつの あし）
    bench(S, f) {
      const alongX = f.w >= f.h, w = f.w, d = f.h;
      let s = S.ellipse(w / 2, d / 2, 0, Math.max(w, d) * 0.42, "#00000014", 0);
      const legs = alongX ? [[0.15, 0.25], [w - 0.3, 0.25]] : [[0.25, 0.15], [0.25, d - 0.3]];
      for (const [x, y] of legs) s += S.box(x, y, 0.14, alongX ? d - 0.5 : 0.14, 0, 20, "#6E6A70");
      s += S.box(alongX ? 0.05 : 0.2, alongX ? 0.2 : 0.05, alongX ? w - 0.1 : d - 0.4 > 0 ? 0.6 : 0.6, alongX ? d - 0.4 : d - 0.1, 20, 6, ["#D9B686", "#C39E6E", "#A98657"]);
      if (alongX) s += S.box(0.05, 0.18, w - 0.1, 0.1, 26, 20, ["#D9B686", "#C39E6E", "#A98657"]); else s += S.box(0.18, 0.05, 0.1, d - 0.1, 26, 20, ["#D9B686", "#C39E6E", "#A98657"]);
      return s;
    },
    // うえきばち（はこ・木）
    planter(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.box(0.12, 0.12, f.w - 0.24, f.h - 0.24, 0, 30, ["#C9B08A", "#B49872", "#9C815D"]) + S.poly([[0.2, 0.2, 30], [f.w - 0.2, 0.2, 30], [f.w - 0.2, f.h - 0.2, 30], [0.2, f.h - 0.2, 30]], "#7B6A55", 1.2);
      const tall = f.variant === "tree";
      if (tall) { s += S.box(cx - 0.06, cy - 0.06, 0.12, 0.12, 30, 70, "#8C6E50"); for (const [dx, dy, z, r, c] of [[-0.3, 0.1, 96, 0.55, "#86AE78"], [0.3, -0.1, 104, 0.52, "#9DC08B"], [0, 0.3, 120, 0.5, "#B6D3A0"], [0, -0.3, 128, 0.45, "#9DC08B"], [0, 0, 140, 0.4, "#B6D3A0"]]) s += S.at(cx + dx, cy + dy, z, `<circle r="${f2(r * 38)}" fill="${c}" ${S.st(1.5)}/>`); }
      else for (const [dx, dy, z, r, c] of [[-0.2, 0.1, 42, 0.36, "#86AE78"], [0.22, -0.05, 46, 0.34, "#9DC08B"], [0, 0.2, 54, 0.3, "#B6D3A0"], [0.05, -0.2, 58, 0.28, "#9DC08B"]]) s += S.at(cx + dx, cy + dy, z, `<circle r="${f2(r * 38)}" fill="${c}" ${S.st(1.4)}/>`);
      return s;
    },
    // はしら（四角・あかり）
    pillar(S, f) {
      const h = f.height || 260;
      let s = S.box(0.1, 0.1, f.w - 0.2, f.h - 0.2, 0, h, ["#F1EBDF", "#E3DACB", "#D2C7B5"]);
      s += S.box(0.06, 0.06, f.w - 0.12, f.h - 0.12, 0, 14, ["#CDBB9C", "#BCA886", "#A99573"]);
      for (const z of [h * 0.55]) s += S.poly([[0.1, f.h - 0.1, z], [f.w - 0.1, f.h - 0.1, z], [f.w - 0.1, f.h - 0.1, z + 26], [0.1, f.h - 0.1, z + 26]], "#FFF4D0", 1.2);
      return s;
    },
    // 店の まえの 名前の いた（頭の 上。はしらは post）
    fascia(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] }, c = sh.c, z = f.z || MallArt.FRONT;
      return f.w >= f.h ? S.box(0, 0.3, f.w, 0.34, z, 36, ["#FFF8EA", c[0], c[1]]) + S.box(0.2, 0.62, f.w - 0.4, 0.04, z + 6, 24, ["#FFFDF6", "#FFFDF6", c[1]], 1.2) : S.box(0.3, 0, 0.34, f.h, z, 36, ["#FFF8EA", c[1], c[0]]);
    },
    // 店の かどの はしら
    post(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] }, c = sh.c;
      return S.box(0.34, 0.34, 0.32, 0.32, 0, MallArt.FRONT, [c[0], c[1], c[2]]) + S.box(0.28, 0.28, 0.44, 0.44, 0, 12, ["#CDBB9C", "#BCA886", "#A99573"]);
    },
    // 服の ラック
    rack(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E9B8CE", "#C9AFC7", "#A08AA6"] }, cols = [sh.c[0], "#FFF1D9", sh.c[1], "#CFE3E6", sh.c[2]];
      let s = S.ellipse(f.w / 2, f.h / 2, 0, f.w * 0.4, "#00000012", 0) + S.box(0.1, 0.35, 0.08, 0.08, 0, 104, "#8D8A92") + S.box(f.w - 0.18, 0.35, 0.08, 0.08, 0, 104, "#8D8A92") + S.line([[0.12, 0.4, 104], [f.w - 0.12, 0.4, 104]], "#6F6C74", 3);
      for (let i = 0; i < 6; i++) { const x = 0.32 + i * ((f.w - 0.6) / 5), c = cols[i % cols.length]; s += S.poly([[x - 0.12, 0.3, 100], [x + 0.12, 0.3, 100], [x + 0.16, 0.34, 58], [x - 0.16, 0.34, 58]], c, 1.3); }
      return s;
    },
    // レジ（カウンター・レジの 機械）
    register(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] };
      let s = S.box(0.05, 0.1, f.w - 0.1, f.h - 0.2, 0, 52, ["#FFF8EA", sh.c[0], sh.c[1]]) + S.box(0.02, 0.07, f.w - 0.04, f.h - 0.14, 52, 5, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
      s += S.box(f.w * 0.55, 0.25, 0.42, 0.34, 57, 16, ["#6E7480", "#5B616C", "#4B505A"]) + S.poly([[f.w * 0.55 + 0.05, 0.28, 73], [f.w * 0.55 + 0.37, 0.28, 73], [f.w * 0.55 + 0.37, 0.28, 88], [f.w * 0.55 + 0.05, 0.28, 88]], "#9FD1D9", 1.2);
      return s;
    },
    // 展示の 台（ひくい。上に 品物）。家具は 木の ステージに じゅうたん と ねふだ
    stand(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#F1E7D6", "#E1D3BC", "#C9B79B"] };
      if (f.low) return S.box(0.06, 0.06, f.w - 0.12, f.h - 0.12, 0, 10, ["#D9BD92", "#C3A375", "#AD8E63"]) + S.poly([[0.3, 0.3, 10.5], [f.w - 0.3, 0.3, 10.5], [f.w - 0.3, f.h - 0.3, 10.5], [0.3, f.h - 0.3, 10.5]], sh.c[0], 1.2) + S.box(f.w - 0.62, f.h - 0.34, 0.34, 0.06, 10, 18, ["#FFFFFF", "#FFFFFF", "#E8E0D0"], 1);
      return S.ellipse(f.w / 2, f.h / 2, 0, Math.max(f.w, f.h) * 0.45, "#00000012", 0) + S.box(0.08, 0.08, f.w - 0.16, f.h - 0.16, 0, 30, ["#FFFBF2", sh.c[0], sh.c[1]]);
    },
    // まるい 台（上に 服を きた マネキン）
    pedestal(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#F1E7D6", "#E1D3BC", "#C9B79B"] };
      return S.ellipse(0.5, 0.5, 0, 0.5, "#00000014", 0) + S.cyl(0.5, 0.5, 0.46, 0, 20, ["#FFFBF2", sh.c[0]]) + S.ellipse(0.5, 0.5, 20, 0.36, sh.c[1], 1.2) + S.ellipse(0.5, 0.5, 20, 0.2, "#FFFFFF66", 0);
    },
    // インフォメーション（まるい カウンター・「？」）
    info(S, f) {
      let s = S.box(0.1, 0.2, f.w - 0.2, f.h - 0.3, 0, 52, ["#FFF8EA", "#9FC3D8", "#86AFC8"]) + S.box(0.06, 0.16, f.w - 0.12, f.h - 0.22, 52, 5, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
      s += S.box(f.w / 2 - 0.1, 0.25, 0.2, 0.2, 57, 70, "#8D8A92") + S.at(f.w / 2, 0.35, 150, `<circle r="20" fill="#5A9BC4" ${S.st(1.6)}/><text y="8" text-anchor="middle" font-size="24" font-weight="900" font-family="sans-serif" fill="#FFFFFF">?</text>`);
      return s;
    },
    // フロアの 案内板（たって いる ボード）
    guide(S, f) {
      let s = S.box(0.3, 0.4, 0.4, 0.2, 0, 16, "#8D8A92") + S.box(0.42, 0.45, 0.16, 0.1, 16, 40, "#8D8A92");
      s += S.poly([[0.05, 0.5, 56], [0.95, 0.5, 56], [0.95, 0.5, 150], [0.05, 0.5, 150]], "#FFFDF6", 1.8);
      for (const [x0, x1, z0, z1, c] of [[0.12, 0.45, 110, 142, "#F2C6D8"], [0.5, 0.88, 110, 142, "#C9DDB9"], [0.12, 0.3, 66, 104, "#C9BCD9"], [0.35, 0.88, 66, 104, "#E8D6AE"]]) s += S.poly([[x0, 0.5, z0], [x1, 0.5, z0], [x1, 0.5, z1], [x0, 0.5, z1]], c, 1);
      s += S.at(0.72, 0.5, 90, `<circle r="7" fill="#8FCBDA" ${S.st(1.2)}/>`);
      return s;
    },
    // ロッカー（かべぎわ）
    locker(S, f) {
      let s = S.box(0, 0, f.w, f.h, 0, 150, ["#DDE2E6", "#C7CED4", "#B3BBC2"]);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x0 = 0.05 + i * ((f.w - 0.1) / 4), x1 = x0 + (f.w - 0.1) / 4 - 0.03, z0 = 6 + j * 36, z1 = z0 + 33; s += S.poly([[x0, f.h, z0], [x1, f.h, z0], [x1, f.h, z1], [x0, f.h, z1]], j === 1 && i === 2 ? "#E9D8A6" : "#EEF1F3", 1); }
      return s;
    },
    // ATM
    atm(S, f) {
      return S.box(0.1, 0.05, f.w - 0.2, f.h - 0.15, 0, 120, ["#E8EDF0", "#C9D2D8", "#B3BDC5"]) + S.poly([[0.2, f.h - 0.1, 70], [f.w - 0.2, f.h - 0.1, 70], [f.w - 0.2, f.h - 0.1, 104], [0.2, f.h - 0.1, 104]], "#7EC3D1", 1.2) + S.poly([[0.1, f.h - 0.1, 104], [f.w - 0.1, f.h - 0.1, 104], [f.w - 0.1, f.h - 0.1, 120], [0.1, f.h - 0.1, 120]], "#F2A65E", 1.2);
    },
    // じどうはんばいき
    vending(S, f) {
      let s = S.box(0.08, 0.05, f.w - 0.16, f.h - 0.12, 0, 150, ["#E8EDF0", "#E77B7B", "#C96565"]);
      s += S.poly([[0.16, f.h - 0.07, 80], [f.w - 0.16, f.h - 0.07, 80], [f.w - 0.16, f.h - 0.07, 140], [0.16, f.h - 0.07, 140]], "#DDF1F4", 1.2);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 0.24 + i * 0.16, z = 92 + j * 26; s += S.poly([[x, f.h - 0.07, z], [x + 0.1, f.h - 0.07, z], [x + 0.1, f.h - 0.07, z + 18], [x, f.h - 0.07, z + 18]], ["#F4A4A9", "#9FD1D9", "#F7D889", "#B8D8A0"][(i + j) % 4], 0.8); }
      return s;
    },
    // AED（はこ）
    aed(S, f) {
      return S.box(0.2, 0.05, f.w - 0.4, 0.3, 60, 60, ["#F4F4F2", "#E86B6B", "#C95555"]) + S.at(f.w / 2, 0.36, 95, `<path d="${heartPath(0, -8, 0.6)}" fill="#FFFFFF"/>`);
    },
    // ガラスの てすり（ふきぬけの ふち）
    rail(S, f) {
      const alongX = f.w >= f.h;
      let s = alongX ? S.poly([[0, 0.5, 0], [f.w, 0.5, 0], [f.w, 0.5, 58], [0, 0.5, 58]], "#CFE7EC88", 1.2) + S.line([[0, 0.5, 60], [f.w, 0.5, 60]], "#9AA3AA", 4) : S.poly([[0.5, 0, 0], [0.5, f.h, 0], [0.5, f.h, 58], [0.5, 0, 58]], "#CFE7EC88", 1.2) + S.line([[0.5, 0, 60], [0.5, f.h, 60]], "#9AA3AA", 4);
      return s;
    },
    // エスカレーター（のぼり と くだりの 2れつ。f.dir が "down" なら 上の 階から 下へ おりて いく 形）
    escalator(S, f) {
      const n = f.pair ? 2 : 1, lw = f.w / n, Z = f.rise || 200, down = f.dir === "down";
      let s = "";
      for (let i = 0; i < n; i++) {
        const x0 = f.x0 ?? 0, xa = i * lw + 0.08, xb = (i + 1) * lw - 0.08;
        // 下の 階から 見る: 手前 (y=h) が 床、奥 (y=0) が たかい。上の 階から 見る: 奥 (y=0) が 床、手前へ おりる
        const yLow = down ? 0 : f.h - 1, yHigh = down ? f.h : 0, zLow = down ? 0 : 0, zAt = (y) => down ? -Z * (y / f.h) : Z * ((f.h - 1 - y) / (f.h - 1));
        const yA = down ? 1 : f.h - 1, yB = down ? f.h : 0, zA = down ? 0 : 0, zB = down ? -Z * ((f.h - 1) / f.h) : Z;
        // のりばの いた（くし形）
        const py = down ? 0 : f.h - 1;
        s += S.poly([[xa - 0.04, py, 1], [xb + 0.04, py, 1], [xb + 0.04, py + 1, 1], [xa - 0.04, py + 1, 1]], "#B9C0C6", 1.4);
        for (let k = 1; k < 6; k++) { const x = xa + (xb - xa) * k / 6; s += S.line([[x, py + 0.1, 1.5], [x, py + 0.9, 1.5]], "#8E969D", 1); }
        // かたむいた 面（ステップ）
        const ya = down ? 1 : f.h - 1, yb = down ? f.h : 0, za = 0, zb = down ? -Z * ((f.h - 1) / f.h) : Z;
        s += S.poly([[xa, ya, za], [xb, ya, za], [xb, yb, zb], [xa, yb, zb]], "#8D949B", 1.4);
        for (let k = 1; k < 14; k++) { const t = k / 14, y = ya + (yb - ya) * t, z = za + (zb - za) * t; s += S.line([[xa + 0.02, y, z], [xb - 0.02, y, z]], "#B9C0C6", 1); }
        // 東の がわの よこばん（トラス）
        s += S.poly([[xb, ya, za], [xb, yb, zb], [xb, yb, zb - 46], [xb, ya + (down ? 0 : -0.6), za - 16]], "#DCD3C3", 1.4);
        // ガラスの てすり（西 と 東）
        for (const x of [xa, xb]) s += S.poly([[x, ya, za + 4], [x, yb, zb + 4], [x, yb, zb + 58], [x, ya, za + 58]], "#CFE7EC66", 1.1) + S.line([[x, ya + (down ? -0.3 : 0.3), za + 50], [x, ya, za + 60], [x, yb, zb + 60]], "#2F2D33", 3.2);
        // やじるし
        const up = down ? i === 1 : i === 0;
        s += S.at((xa + xb) / 2, py + 0.5, 2, `<path d="${up ? "M0,-7 L8,3 L-8,3 Z" : "M0,7 L8,-3 L-8,-3 Z"}" fill="${up ? "#7FC6A4" : "#F2A65E"}" ${S.st(1.2)}/>`);
      }
      return s;
    },
    // ステージ（ふんすい ひろばの イベント ステージ）
    stage(S, f) {
      let s = S.box(0, 0, f.w, f.h, 0, 26, ["#E9DFCB", "#C9B79B", "#B7A386"]);
      for (let x = 0.5; x < f.w; x += 1) s += S.line([[x, 0.08, 26.5], [x, f.h - 0.08, 26.5]], "#D8CBB3", 1);
      s += S.box(f.w / 2 - 1.2, f.h, 2.4, 0.4, 0, 13, ["#E9DFCB", "#C9B79B", "#B7A386"]);
      for (const x of [0.2, f.w - 0.35]) s += S.box(x, 0.15, 0.15, 0.15, 26, 110, "#6E6A70") + S.at(x + 0.08, 0.2, 140, `<ellipse rx="10" ry="7" fill="#FFF1B8" ${S.st(1.3)}/>`);
      return s;
    },
    // つりさげの かんばん（あたまの 上）
    hangsign(S, f) {
      const z = f.z || 230, alongX = f.face !== "x";
      let s = "";
      if (alongX) { for (const x of [0.2, f.w - 0.2]) s += S.line([[x, 0.5, z + 34], [x, 0.5, z + 120]], "#8E8A86", 1.4); s += S.box(0, 0.44, f.w, 0.12, z, 34, ["#FFFDF6", f.col || "#5A8FB4", MallArt.shade(f.col || "#5A8FB4", -0.2)]); }
      else { for (const y of [0.2, f.h - 0.2]) s += S.line([[0.5, y, z + 34], [0.5, y, z + 120]], "#8E8A86", 1.4); s += S.box(0.44, 0, 0.12, f.h, z, 34, ["#FFFDF6", MallArt.shade(f.col || "#5A8FB4", -0.2), f.col || "#5A8FB4"]); }
      return s;
    },
    // たべものの カウンター（ショーケース・レジ）
    foodcounter(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] }, c = sh.c, w = f.w;
      let s = S.box(0.05, 0.12, w - 0.1, 0.76, 0, 58, ["#FFF8EA", c[0], c[1]]) + S.box(0.02, 0.1, w - 0.04, 0.8, 58, 6, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
      // ショーケース（ガラス・なかの おかし）
      s += S.poly([[0.3, 0.2, 64], [w * 0.62, 0.2, 64], [w * 0.62, 0.5, 64], [0.3, 0.5, 64]], "#F5EFE0", 1.1);
      for (let i = 0; i < Math.floor(w * 2.2); i++) { const x = 0.42 + i * 0.26; if (x > w * 0.6) break; s += S.at(x, 0.35, 70, `<ellipse rx="6" ry="4" fill="${["#F4A4A9", "#F7D889", "#C79A76", "#B8D8A0", "#F3E6D8"][i % 5]}" ${S.st(1)}/>`); }
      s += S.poly([[0.28, 0.52, 64], [w * 0.64, 0.52, 64], [w * 0.64, 0.52, 96], [0.28, 0.52, 96]], "#CFE7EC77", 1.1) + S.poly([[0.28, 0.18, 96], [w * 0.64, 0.18, 96], [w * 0.64, 0.52, 96], [0.28, 0.52, 96]], "#CFE7EC55", 1.1);
      // レジ・カップ
      s += S.box(w - 0.9, 0.3, 0.46, 0.36, 64, 16, ["#6E7480", "#5B616C", "#4B505A"]) + S.poly([[w - 0.86, 0.33, 80], [w - 0.48, 0.33, 80], [w - 0.48, 0.33, 94], [w - 0.86, 0.33, 94]], "#9FD1D9", 1.1);
      return s;
    },
    // まるい テーブル と いす
    table(S, f) {
      const cx = f.w / 2, cy = f.h / 2, wood = f.shop === "cafe" ? ["#D9B686", "#C39E6E"] : ["#FFFBF3", "#E6DCCB"];
      let s = S.ellipse(cx, cy, 0, 0.9, "#00000012", 0);
      const chairs = [[cx - 0.72, cy], [cx + 0.72, cy], [cx, cy - 0.72], [cx, cy + 0.72]];
      const chair = ([x, y]) => S.box(x - 0.2, y - 0.2, 0.4, 0.4, 0, 28, ["#E8D3B0", "#D2B991", "#BCA277"]) + S.box(x - 0.2, y - 0.2, x < cx - 0.1 || y < cy - 0.1 ? 0.4 : 0.4, 0.08, 28, 26, ["#E8D3B0", "#D2B991", "#BCA277"]);
      for (const c of chairs.filter(([x, y]) => x + y < cx + cy)) s += chair(c);
      s += S.cyl(cx, cy, 0.08, 0, 44, ["#8C8890", "#77737B"]) + S.cyl(cx, cy, 0.5, 44, 6, wood);
      s += S.at(cx - 0.12, cy, 52, `<ellipse rx="7" ry="4" fill="#FFFFFF" ${S.st(1)}/><ellipse cy="-3" rx="4" ry="3" fill="${["#F4A4A9", "#C79A76", "#B8D8A0"][(f.x + f.y) % 3]}" ${S.st(1)}/>`);
      for (const c of chairs.filter(([x, y]) => x + y >= cx + cy)) s += chair(c);
      return s;
    },
    // かざりの たな（本・はこ）
    shelf(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#E7DDCB", "#DCCFB8", "#B9A487"] }, h = 120;
      let s = S.box(0.05, 0.25, f.w - 0.1, 0.5, 0, h, ["#E8D6B8", "#C9AE85", "#B39669"]);
      for (const z of [12, 48, 84]) { s += S.poly([[0.1, 0.75, z], [f.w - 0.1, 0.75, z]], "none", 1.2); for (let i = 0; i < 9; i++) { const x = 0.14 + i * ((f.w - 0.28) / 9); s += S.poly([[x, 0.76, z + 2], [x + 0.16, 0.76, z + 2], [x + 0.16, 0.76, z + 26 + (i % 3) * 3], [x, 0.76, z + 26 + (i % 3) * 3]], [sh.c[0], "#FBE6B8", sh.c[1], "#CFE3E6", "#F4C7C3"][(i + z) % 5], 0.9); } }
      return s;
    },
    // ひくい おもちゃの たな
    toyshelf(S, f) {
      let s = S.box(0.05, 0.2, f.w - 0.1, 0.6, 0, 40, ["#F4E3C2", "#E3C996", "#CFB37D"]);
      s += S.box(0.25, 0.35, 0.36, 0.36, 40, 30, ["#F4A4A9", "#E58C92", "#CC767C"]) + S.cyl(f.w * 0.55, 0.5, 0.18, 40, 30, ["#9FD1D9", "#86BCC6"]) + S.box(f.w - 0.62, 0.3, 0.3, 0.3, 40, 20, ["#F7D889", "#E7C46E", "#CFAC58"]) + S.box(f.w - 0.62, 0.38, 0.22, 0.22, 60, 18, ["#B8D8A0", "#A0C488", "#89AE72"]);
      s += S.at(f.w * 0.55, 0.5, 86, `<circle r="9" fill="#C79A76" ${S.st(1.2)}/><circle cx="-7" cy="-7" r="4" fill="#C79A76" ${S.st(1.1)}/><circle cx="7" cy="-7" r="4" fill="#C79A76" ${S.st(1.1)}/>`);
      return s;
    },
    // らーめんの カウンター と いす
    stool(S, f) {
      let s = S.box(0.05, 0.1, f.w - 0.1, 0.5, 0, 70, ["#E8D3B0", "#B98E57", "#A57C48"]) + S.box(0.02, 0.08, f.w - 0.04, 0.54, 70, 6, ["#6E5A45", "#5B4A38", "#4B3D2E"]);
      for (let i = 0; i < 2; i++) { const x = 0.5 + i * (f.w - 1); s += S.at(x, 0.4, 80, `<ellipse rx="11" ry="5" fill="#F7F1E4" ${S.st(1.1)}/><path d="M-9,-2 Q0,6 9,-2" fill="#F2C48A" ${S.st(1)}/>`) + S.cyl(x, 0.9, 0.05, 0, 36, ["#8C8890", "#77737B"]) + S.cyl(x, 0.9, 0.2, 36, 6, ["#E77B7B", "#C96565"]); }
      return s;
    },
    // マルシェの はこ（くだもの）
    crate(S, f) {
      let s = S.box(0.08, 0.1, f.w - 0.16, 0.8, 0, 22, ["#C9A36B", "#B38C57", "#9C7747"]) + S.box(0.12, 0.14, f.w - 0.24, 0.72, 22, 16, ["#DDBB86", "#C9A36B", "#B38C57"]);
      for (let i = 0; i < 8; i++) s += S.at(0.3 + (i % 4) * ((f.w - 0.6) / 3), 0.35 + Math.floor(i / 4) * 0.3, 40, `<circle r="6" fill="${["#E86B6B", "#F7B84D", "#9DC08B", "#F2D46B"][(i + f.x) % 4]}" ${S.st(1)}/>`);
      return s;
    },
    // パズルの ブース（3だいの きかい）
    puzzleBooth(S, f) {
      let s = S.box(0.05, 1.2, f.w - 0.1, 0.7, 0, 56, ["#FFF8EA", "#AFC3E3", "#7E97C2"]);
      for (let i = 0; i < 3; i++) { const x = 0.35 + i * ((f.w - 0.7) / 3); s += S.box(x, 0.1, 1.3, 0.9, 0, 110, ["#E6ECF6", "#AFC3E3", "#8FA7D1"]) + S.poly([[x + 0.12, 1.0, 58], [x + 1.18, 1.0, 58], [x + 1.18, 1.0, 100], [x + 0.12, 1.0, 100]], "#2F3B55", 1.2); for (let k = 0; k < 6; k++) s += S.poly([[x + 0.2 + (k % 3) * 0.32, 1.0, 64 + Math.floor(k / 3) * 16], [x + 0.46 + (k % 3) * 0.32, 1.0, 64 + Math.floor(k / 3) * 16], [x + 0.46 + (k % 3) * 0.32, 1.0, 76 + Math.floor(k / 3) * 16], [x + 0.2 + (k % 3) * 0.32, 1.0, 76 + Math.floor(k / 3) * 16]], ["#F4A4A9", "#F7D889", "#9FD1D9", "#B8D8A0", "#C9BCD9", "#F7B84D"][(k + i) % 6], 0.8); }
      return s;
    },
    // ソファ（ひとやすみ）
    sofa(S, f) {
      const alongX = f.w >= f.h;
      let s = S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 0, 26, ["#B8D8A0", "#9FC487", "#89AE72"]);
      s += alongX ? S.box(0.05, 0.05, f.w - 0.1, 0.3, 26, 30, ["#C9E3B4", "#9FC487", "#89AE72"]) : S.box(0.05, 0.05, 0.3, f.h - 0.1, 26, 30, ["#C9E3B4", "#89AE72", "#9FC487"]);
      for (let i = 0; i < 2; i++) s += alongX ? S.box(0.4 + i * (f.w - 0.9) / 2, 0.4, (f.w - 0.9) / 2 - 0.05, f.h - 0.5, 26, 8, ["#D6ECC3", "#B8D8A0", "#9FC487"]) : S.box(0.4, 0.4 + i * (f.h - 0.9) / 2, f.w - 0.5, (f.h - 0.9) / 2 - 0.05, 26, 8, ["#D6ECC3", "#B8D8A0", "#9FC487"]);
      return s;
    },
    // 上の 階の 床（エスカレーターが 入って いく ところ）
    slab(S, f) {
      const z = f.z || 170;
      let s = S.box(0, 0, f.w, f.h, z, f.height || 28, ["#F4EEE2", "#E3D9C6", "#D2C6B0"]);
      for (let x = 0.4; x < f.w; x += 0.8) s += S.at(x, f.h, z + 4, `<ellipse rx="5" ry="2" fill="#FFF1B8"/>`);
      return s;
    },
    // キオスク（しまの 小さい お店）
    kiosk(S, f) {
      const sh = MallArt.SHOP[f.shop] || { c: ["#F7E1B5", "#EBCB8E", "#C9A866"] };
      let s = S.box(0.1, 0.1, f.w - 0.2, f.h - 0.2, 0, 56, ["#FFF8EA", sh.c[0], sh.c[1]]) + S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 56, 5, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
      for (const [x, y] of [[0.12, 0.12], [f.w - 0.2, 0.12], [0.12, f.h - 0.2], [f.w - 0.2, f.h - 0.2]]) s += S.box(x, y, 0.08, 0.08, 61, 90, "#B7A386");
      // うりもの（はな・アイス）
      if (f.goods === "flower") for (let i = 0; i < 6; i++) { const x = 0.35 + (i % 3) * ((f.w - 0.7) / 2), y = 0.4 + Math.floor(i / 3) * (f.h - 0.8); s += S.cyl(x, y, 0.13, 61, 14, ["#7E93A6", "#6B8093"]) + S.at(x, y, 84, [0, 1, 2].map((k) => `<circle cx="${(k - 1) * 5}" cy="${-Math.abs(k - 1) * 3}" r="5" fill="${["#F4A4A9", "#F7D889", "#C9BCD9", "#FFFFFF"][(i + k) % 4]}" ${S.st(1)}/>`).join("") + `<path d="M-6,4 q6,6 12,0" fill="#9DC08B" ${S.st(1)}/>`); }
      if (f.goods === "ice") { s += S.box(0.2, 0.25, f.w - 0.4, f.h - 0.5, 61, 18, ["#EAF6F8", "#CFE7EC", "#B5D6DD"]); for (let i = 0; i < 4; i++) s += S.at(0.4 + i * ((f.w - 0.8) / 3), f.h * 0.5, 96, `<path d="M-4,0 L0,12 L4,0 Z" fill="#E7C27E" ${S.st(1)}/><circle cy="-3" r="5" fill="${["#F4A4A9", "#FFF4D8", "#B8D8A0", "#C79A76"][i]}" ${S.st(1)}/>`); }
      s += S.box(-0.05, -0.05, f.w + 0.1, f.h + 0.1, 151, 16, ["#FFFBF3", sh.c[1], sh.c[2]]);
      return s;
    },
  },
  // 面の 上に 字を 書く（y が いっていの 面 = +y むき、x が いっていの 面 = +x むき）
  planeText(ctx, sc, off, face, x, y, z, text, size, width, col = INK) {
    const q = sc.toScreen(IsoVenue.p(x, y, z), off), s = sc.s, A = IsoVenue.A, B = IsoVenue.B;
    ctx.save(); ctx.translate(q.x, q.y); face === "x" ? ctx.transform(-A * s, B * s, 0, s, 0, 0) : ctx.transform(A * s, B * s, 0, s, 0, 0);
    ctx.font = `900 ${size}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.fillText(text, 0, 0, width); ctx.restore();
  },
  // ---- 動く ところ（毎フレーム）----
  L: {
    kiosk(ctx, sc, f, off) { if (f.label) MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h + 0.05, 159, f.label, 15, (f.w - 0.1) * IsoVenue.T); },
    escalator(ctx, sc, f, off) {
      // うごく ステップの 線（のぼりは 奥へ、くだりは 手前へ）
      const n = f.pair ? 2 : 1, lw = f.w / n, Z = f.rise || 200, down = f.dir === "down", s = sc.s;
      ctx.save(); ctx.strokeStyle = "rgba(255,244,200,.85)"; ctx.lineWidth = 1.6 * s * 2;
      for (let i = 0; i < n; i++) {
        const xa = f.x + i * lw + 0.1, xb = f.x + (i + 1) * lw - 0.1, ya = f.y + (down ? 1 : f.h - 1), yb = f.y + (down ? f.h : 0), zb = down ? -Z * ((f.h - 1) / f.h) : Z, up = down ? i === 1 : i === 0;
        for (let k = 0; k < 5; k++) {
          let t = ((G.t * 0.35 + k / 5) % 1); if (!up) t = 1 - t; if (down) t = 1 - t;
          const y = ya + (yb - ya) * t, z = zb * t, a = sc.toScreen(IsoVenue.p(xa, y, z), off), b = sc.toScreen(IsoVenue.p(xb, y, z), off);
          ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.restore();
    },
    hangsign(ctx, sc, f, off) {
      const z = (f.z || 230) + 17;
      if (f.face !== "x") MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.57, z, f.text || "", 17, (f.w - 0.3) * IsoVenue.T, "#FFFFFF");
      else MallArt.planeText(ctx, sc, off, "x", f.x + 0.57, f.y + f.h / 2, z, f.text || "", 17, (f.h - 0.3) * IsoVenue.T, "#FFFFFF");
    },
    fascia(ctx, sc, f, off) {
      const z = (f.z || MallArt.FRONT) + 18, name = f.label || (MallArt.SHOP[f.shop] || {}).name || "";
      if (f.w >= f.h) MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.67, z, name, 20, (f.w - 0.6) * IsoVenue.T);
      else MallArt.planeText(ctx, sc, off, "x", f.x + 0.65, f.y + f.h / 2, z, name, 20, (f.h - 0.6) * IsoVenue.T);
    },
    fountain(ctx, sc, f, off) {
      const s = sc.s, cx = f.x + f.w / 2, cy = f.y + f.h / 2, t = G.t, P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), R = Math.min(f.w, f.h) / 2 - 0.1;
      // なみの わ
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.4 * s * 2;
      for (let i = 0; i < 3; i++) { const k = ((t * 0.5 + i / 3) % 1), rr = 0.6 + k * (R - 0.8), c = P(cx, cy, 26); ctx.globalAlpha = (1 - k) * 0.8; ctx.beginPath(); ctx.ellipse(c.x, c.y, rr * IsoVenue.T * Math.SQRT2 * IsoVenue.A * s, rr * IsoVenue.T * Math.SQRT2 * IsoVenue.B * s, 0, 0, 7); ctx.stroke(); }
      ctx.restore();
      // ふきあがる 水（まんなか と 8ほん）
      ctx.save(); ctx.strokeStyle = "rgba(225,247,252,.95)"; ctx.lineCap = "round";
      const show = (G.t % 40) < 7 || (MallArt.showT && G.t - MallArt.showT < 6), boost = show ? 1.9 : 1;
      if (show) { ctx.strokeStyle = ["rgba(255,214,230,.95)", "rgba(214,240,255,.95)", "rgba(255,243,196,.95)"][Math.floor(G.t * 2) % 3]; }
      const top = P(cx, cy, 151 + 60 * boost + Math.sin(t * 3) * 6), base = P(cx, cy, 151);
      ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(top.x, top.y); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.15, h = (58 + Math.sin(t * 2.4 + i) * 6) * boost;
        const p0 = P(cx, cy, 151 + 40), p1 = P(cx + Math.cos(a) * 0.6, cy + Math.sin(a) * 0.6, 151 + h), p2 = P(cx + Math.cos(a) * 1.05, cy + Math.sin(a) * 1.05, 88);
        ctx.lineWidth = 2.4 * s; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - t * 0.2, p0 = P(cx + Math.cos(a) * 1.25, cy + Math.sin(a) * 1.25, 80), p1 = P(cx + Math.cos(a) * 1.9, cy + Math.sin(a) * 1.9, 48), p2 = P(cx + Math.cos(a) * 2.15, cy + Math.sin(a) * 2.15, 27);
        ctx.lineWidth = 1.8 * s; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); ctx.stroke();
      }
      ctx.restore();
      // しぶき
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 10; i++) { const k = (t * 0.9 + i * 0.37) % 1, a = i * 2.3, q = P(cx + Math.cos(a) * (0.3 + k * 0.9), cy + Math.sin(a) * (0.3 + k * 0.9), 151 + 60 * Math.sin(k * Math.PI)); ctx.beginPath(); ctx.arc(q.x, q.y, 1.6 * s * 2, 0, 7); ctx.fill(); }
    },
  },
  // 手前の ふち（ひくい かべの きりくち）
  over(ctx, sc, r, floor, off) {
    const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), band = (a, b, c, d, fill) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * sc.s * 2; ctx.stroke(); };
    band(P(0, r.h, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(0, r.h, 16), "#E7DDCB");
    band(P(r.w, 0, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(r.w, 0, 16), "#D9CDB8");
    band(P(0, r.h - 0.12, 16), P(r.w - 0.12, r.h - 0.12, 16), P(r.w, r.h, 16), P(0, r.h, 16), "#F4EEE2");
    band(P(r.w - 0.12, 0, 16), P(r.w, 0, 16), P(r.w, r.h, 16), P(r.w - 0.12, r.h - 0.12, 16), "#F4EEE2");
  },
  // 服の マネキン（台の 上に たつ）の 大きさ。3人より すこし 大きく して 服を 見やすく
  mannequinSize(sc) { return sc.charSize() * 1.34; },
  // 品物（台の 上）: 家具は おうちと おなじ 立体、服は マネキンが きて いる（WearMannequin）、たべものは アイコン
  drawItem(ctx, sc, f, off) {
    const s = sc.s, it = VenueHalls.item(f.item); if (!it) return;
    const z = f.kind === "pedestal" ? 20 : f.low ? 10 : 30, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2, f.y + f.h / 2 + (f.kind === "stand" && FURN_INDEX[f.item] ? 0.35 : 0), z), off);
    if (FURN_INDEX[f.item]) {
      const m = HomeDesign.model(f.item), pw = Math.ceil(m.w * sc.k), ph = Math.ceil(m.h * sc.k), img = SvgCache.get("mallfurn:" + f.item, () => m.full, pw, ph);
      if (img) ctx.drawImage(img, q.x + m.x * s, q.y + m.y * s, m.w * s, m.h * s);
    } else if (ITEM_INDEX[f.item]) {
      const size = this.mannequinSize(sc), pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w), img = SvgCache.get("mannequin:" + f.item, () => WearMannequin.svg(f.item), pw, ph);
      if (img) { const w = size, h = (size * VB.h) / VB.w; ctx.drawImage(img, q.x - ((FOOT.x - VB.x) / VB.w) * w, q.y - ((FOOT.y - VB.y) / VB.h) * h, w, h); }
    } else {
      const sz = 34 * s, img = SvgCache.get("mallbag:" + f.item, () => Art.iconSvg("bag", f.item), Math.ceil(sz * G.px), Math.ceil(sz * G.px));
      if (img) ctx.drawImage(img, q.x - sz / 2, q.y - sz * 0.95, sz, sz);
    }
  },
  itemJobs(r, sc) {
    const out = [];
    for (const f of r.fixtures) {
      if (!f.item) continue; const it = VenueHalls.item(f.item); if (!it) continue;
      if (FURN_INDEX[f.item]) { const m = HomeDesign.model(f.item); out.push(SvgCache.ensure("mallfurn:" + f.item, () => m.full, Math.ceil(m.w * sc.k), Math.ceil(m.h * sc.k))); }
      else if (ITEM_INDEX[f.item]) { const pw = Chara.pxSize(this.mannequinSize(sc)); out.push(SvgCache.ensure("mannequin:" + f.item, () => WearMannequin.svg(f.item), pw, Math.round((pw * VB.h) / VB.w))); }
      else { const sz = 34 * sc.s; out.push(SvgCache.ensure("mallbag:" + f.item, () => Art.iconSvg("bag", f.item), Math.ceil(sz * G.px), Math.ceil(sz * G.px))); }
    }
    return out;
  },
  // ---- 買い物の 人（あるいて、店の まえで たちどまる）----
  CROWD: ["cat", "rabbit", "sheep", "dog", "bear", "pig", "fox", "panda", "hamster", "koala", "deer", "duck", "mouse", "squirrel"],
  crowd(sc) {
    const r = sc.room; if (!r || !r.iso) return [];
    if (sc._crowdRoom === r) return sc._crowd;
    const free = [];
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (sc.walkable(x, y)) free.push([x, y]);
    const n = r.crowd ?? 6, list = [];
    for (let i = 0; i < n && free.length; i++) {
      const [x, y] = free[Math.floor(U.hash(i, r.w * 7 + r.h, (r.id || "").length) * free.length)], sp = this.CROWD[(i * 5 + (r.id || "").charCodeAt(3)) % this.CROWD.length];
      list.push({ sp, ci: i % 3, fx: x, fy: y, tx: x, ty: y, t: 1, path: [], wait: 0.5 + i * 0.7, dir: "down", anim: i });
    }
    sc._crowdRoom = r; sc._crowd = list; return list;
  },
  // ちかくの とおれる マスへの 道（BFS・400マス まで）
  crowdRoute(sc, m) {
    const sx = m.tx, sy = m.ty, prev = new Map([[sx + "," + sy, null]]), q = [[sx, sy]], goals = [];
    for (let i = 0; i < q.length && q.length < 400; i++) { const [x, y] = q[i]; if (Math.abs(x - sx) + Math.abs(y - sy) > 5) goals.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (!prev.has(k) && sc.walkable(nx, ny)) { prev.set(k, x + "," + y); q.push([nx, ny]); } } }
    if (!goals.length) return [];
    let k = goals[Math.floor(Math.random() * goals.length)].join(","); const path = [];
    while (prev.get(k) !== null && prev.get(k) !== undefined) { path.unshift(k.split(",").map(Number)); k = prev.get(k); }
    return path;
  },
  tick(sc, dt) {
    for (const m of this.crowd(sc)) {
      m.anim += dt;
      if (m.t < 1) { m.t = Math.min(1, m.t + dt / 0.45); continue; }
      m.fx = m.tx; m.fy = m.ty;
      if (m.path.length) { const [x, y] = m.path.shift(); if (!sc.walkable(x, y)) { m.path = []; continue; } m.dir = x > m.tx ? "right" : x < m.tx ? "left" : y > m.ty ? "down" : "up"; m.tx = x; m.ty = y; m.t = 0; continue; }
      if ((m.wait -= dt) <= 0) { m.path = this.crowdRoute(sc, m).slice(0, 12); m.wait = 1.5 + Math.random() * 4; if (!m.path.length) m.dir = "down"; }
    }
  },
  crowdDrawables(sc) {
    return this.crowd(sc).map((m) => {
      const x = m.fx + (m.tx - m.fx) * m.t + 0.5, y = m.fy + (m.ty - m.fy) * m.t + 0.5, moving = m.t < 1;
      return { layer: 0, x0: x - 0.3, y0: y - 0.3, x1: x + 0.3, y1: y + 0.3, draw: (ctx, o) => {
        const pose = moving ? (Math.floor(m.anim * 6) % 2 ? "walk_01" : "walk_02") : "idle_01", f = { sp: m.sp, ci: m.ci, dir: m.dir, pose, emo: "normal" };
        const c = this.npcSprite(sc, f, false), q = sc.toScreen(IsoVenue.p(x, y, 0), o.offset || 0), size = sc.charSize(), s = sc.s;
        ctx.fillStyle = "rgba(31,29,27,0.13)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 26 * s, 8 * s, 0, 0, 7); ctx.fill();
        if (c) { const w = size, h = (size * VB.h) / VB.w; ctx.drawImage(c, q.x - ((FOOT.x - VB.x) / VB.w) * w, q.y - ((FOOT.y - VB.y) / VB.h) * h, w, h); }
      } };
    });
  },
  // ---- ふきぬけの てすり（奥行きの 順に まざる）----
  extras(sc, r) {
    const out = this.crowdDrawables(sc), T = IsoVenue.T;
    for (const h of r.holes || []) {
      if (h.kind === "ellipse") {
        const n = 44;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, x0 = h.x + Math.cos(a0) * h.r, y0 = h.y + Math.sin(a0) * h.r, x1 = h.x + Math.cos(a1) * h.r, y1 = h.y + Math.sin(a1) * h.r;
          out.push(this.railSeg(sc, x0, y0, x1, y1));
        }
      } else out.push(this.railSeg(sc, h.x, h.y + h.h, h.x + h.w, h.y + h.h));
    }
    return out;
  },
  railSeg(sc, x0, y0, x1, y1) {
    const o = { layer: 0, x0: Math.min(x0, x1) - 0.02, x1: Math.max(x0, x1) + 0.02, y0: Math.min(y0, y1) - 0.02, y1: Math.max(y0, y1) + 0.02, rail: true };
    o.hit = [IsoVenue.p(x0, y0, 0), IsoVenue.p(x1, y1, 0), IsoVenue.p(x1, y1, 64), IsoVenue.p(x0, y0, 64)];
    o.draw = (ctx, d) => {
      const off = d.offset || 0, P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), a = P(x0, y0, 0), b = P(x1, y1, 0), c = P(x1, y1, 58), e = P(x0, y0, 58), s = sc.s;
      ctx.fillStyle = "rgba(207,231,236,.5)"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(31,29,27,.55)"; ctx.lineWidth = 1.2 * s * 2; ctx.stroke();
      const t0 = P(x0, y0, 62), t1 = P(x1, y1, 62); ctx.strokeStyle = "#8D949B"; ctx.lineWidth = 5 * s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.stroke(); ctx.lineCap = "butt";
    };
    return o;
  },
  // ---- ふきぬけの 下の 階（うごく もの）と 大きな がめん ----
  under(ctx, sc, r, floor, off) {
    const s = sc.s;
    if (floor > 1 && r.holes) {
      const low = VenueHalls.defs.mall.floors[1], fountain = low && low.fixtures.find((f) => f.kind === "fountain");
      for (const h of r.holes) {
        if (h.kind !== "ellipse" || !fountain) continue;
        ctx.save(); const c = sc.toScreen(IsoVenue.p(h.x, h.y), off), T = IsoVenue.T; ctx.beginPath(); ctx.ellipse(c.x, c.y, h.r * T * Math.SQRT2 * IsoVenue.A * s, h.r * T * Math.SQRT2 * IsoVenue.B * s, 0, 0, 7); ctx.clip();
        const shift = this.VIEW[floor - 2] * s;
        if (floor > 2) { const q = sc.toScreen(IsoVenue.p(h.x, h.y), off + this.VIEW[0] * s), rx = h.r * T * Math.SQRT2 * IsoVenue.A * s, ry = h.r * T * Math.SQRT2 * IsoVenue.B * s; ctx.fillStyle = "rgba(233,225,210,.9)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, rx * 1.5, ry * 1.5, 0, 0, 7); ctx.ellipse(q.x, q.y, rx, ry, 0, 0, 7); ctx.fill("evenodd"); ctx.strokeStyle = "rgba(141,148,155,.9)"; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.ellipse(q.x, q.y - 60 * s, rx, ry, 0, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(207,231,236,.35)"; ctx.beginPath(); ctx.ellipse(q.x, q.y - 30 * s, rx, ry, 0, 0, 7); ctx.fill(); }
        this.fixture(ctx, sc, fountain, { offset: off + shift });
        ctx.restore();
      }
    }
    for (const p of (r.walls && r.walls.north) || []) if (p.kind === "screen") this.screen(ctx, sc, r, p, off);
  },
  // 1F の 大きな がめん（北の かべの 面に 描く）
  screen(ctx, sc, r, p, off) {
    const H = r.wallH || 300, T = IsoVenue.T, s = sc.s, o = sc.toScreen(IsoVenue.p(0, 0, H), off);
    const n = sc.def.floors[12] ? 4 : 3, u0 = p.from * T + 12, u1 = p.to * T - 12, v0 = H - p.z1 + 8, v1 = H - p.z0 - 8, w = u1 - u0, h = v1 - v0, t = G.t, slide = Math.floor(t / 6) % n, k = (t % 6) / 6;
    ctx.save(); ctx.translate(o.x, o.y); ctx.transform(IsoVenue.A * s, IsoVenue.B * s, 0, s, 0, 0);
    ctx.beginPath(); ctx.rect(u0, v0, w, h); ctx.clip();
    const bg = [["#3B5B8C", "#7B5EA7"], ["#2F7F95", "#68B7C9"], ["#B85C7A", "#F0A36B"], ["#1E5B86", "#4FA3C4"]][slide], gr = ctx.createLinearGradient(u0, v0, u1, v1); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); ctx.fillStyle = gr; ctx.fillRect(u0, v0, w, h);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#FFFFFF"; ctx.globalAlpha = Math.min(1, k * 6, (1 - k) * 6);
    if (slide === 0) { for (let i = 0; i < 14; i++) { const x = u0 + ((i * 97 + t * 30) % w), y = v0 + (i * 37) % h; FX.star(ctx, x, y, 5 + (i % 3) * 2, i % 2 ? "#FFF2AF" : "#FFFFFF"); } ctx.font = "900 34px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("ようこそ サンシャインいけぶへ", u0 + w / 2, v0 + h * 0.45, w - 40); ctx.font = "900 18px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("ふんすい ひろばで まってるよ", u0 + w / 2, v0 + h * 0.75, w - 40); }
    else if (slide === 1) { for (let i = 0; i < 9; i++) { const x = u0 + w * (0.1 + i * 0.1), y = v0 + h * (0.9 - ((t * 0.6 + i * 0.13) % 1) * 0.8); ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = "#DDF4FA"; ctx.fill(); } ctx.fillStyle = "#FFFFFF"; ctx.font = "900 32px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("ふんすい ショー", u0 + w / 2, v0 + h * 0.42, w - 40); ctx.font = "900 18px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("ときどき みずが たかく あがるよ", u0 + w / 2, v0 + h * 0.74, w - 40); }
    else if (slide === 3) { for (let i = 0; i < 6; i++) { const x = u0 + ((i * 140 + t * 50) % (w + 80)) - 40, y = v0 + h * (0.25 + (i % 3) * 0.22); if (typeof AquaArt !== "undefined") AquaArt.penguin(ctx, x, y, 0.9, true, Math.sin(t * 8 + i) * 0.5 + 0.5); } ctx.fillStyle = "#FFFFFF"; ctx.font = "900 32px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("12F すいぞくかん", u0 + w / 2, v0 + h * 0.4, w - 40); ctx.font = "900 18px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("エレベーターで そらの すいぞくかんへ", u0 + w / 2, v0 + h * 0.74, w - 40); }
    else { const shops = ["hane", "animal", "gothic", "luxury", "cafe", "crepes", "boba"]; shops.forEach((id, i) => { const x = u0 + ((i * 120 - t * 40) % (shops.length * 120) + shops.length * 120) % (shops.length * 120) - 60, sh = this.SHOP[id]; ctx.fillStyle = sh.c[0]; U.rr(ctx, x, v0 + h * 0.55, 104, 30, 8); ctx.fill(); ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText(sh.name, x + 52, v0 + h * 0.55 + 15, 96); }); ctx.fillStyle = "#FFFFFF"; ctx.font = "900 30px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("いけぶの おみせ", u0 + w / 2, v0 + h * 0.3, w - 40); }
    ctx.restore();
  },
  // ---- しらべる ----
  async interact(sc, f) {
    if (f.action === "leave") { sc.leave(); return true; }
    if (f.action === "guide") { await MallGuide.open(sc); return true; }
    if (f.action === "elevator") { await this.elevator(sc); return true; }
    if (f.action === "fountain") { sc.busy = true; try { this.showT = G.t; Sound.se("sparkle"); await UI.say([{ name: f.label, text: f.text }]); } finally { sc.busy = false; } return true; }
    if (f.action === "stage") { sc.busy = true; try { this.danceT = G.t; sc.happyFace = true; Sound.se("fanfare"); for (const id of Save.d.order) Save.care(id, { mood: 2 }); Save.write(); await UI.say(Save.d.order.map((id) => ({ who: id, emo: "happy", text: id === "goji" ? "ガゥー♪ ステージで おどったよ！" : id === "gachan" ? "みんな みてる？ ピヨ♪" : "わん！ ステージって たのしいね！" }))); } finally { sc.busy = false; sc.happyFace = false; } return true; }
    if (f.action === "puzzle") { sc.busy = true; try { const at = f.spot || [f.x + 2, f.y + f.h + 2]; await PuzzleArcade.open({ ...sc.back, venueReturn: { venue: sc.id, floor: sc.floor, back: sc.back, at } }); } finally { sc.busy = false; } return true; }
    return false;
  },
  async elevator(sc) {
    sc.busy = true;
    try {
      const levels = Object.keys(sc.def.floors).map(Number).filter((k) => !sc.def.floors[k].noElevator).sort((a, b) => a - b), labels = levels.map((k) => k + "F" + (sc.def.floors[k].short ? " " + sc.def.floors[k].short : ""));
      const i = await UI.ask("エレベーター\nなんかいへ いく？", [...labels, "やめておく"]);
      if (i >= 0 && i < levels.length && levels[i] !== sc.floor) { Sound.se("good"); const to = levels[i], r = sc.def.floors[to]; sc.busy = false; sc.changeFloor(to, r.elevatorSpawn || r.spawn); }
    } finally { sc.busy = false; }
  },
  backdrop(r) { return r && r.sky ? ["#9FD3F0", "#E6F4F8"] : ["#CFC6B6", "#E4DDD0"]; },
};
