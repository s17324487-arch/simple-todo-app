// ③ 魚の 絵（docs/design/features/fishing の 見本 tools/feature-design/fish-art-ref.js の FishArtRef を そのまま 移した もの。⑤ も この 名前で つかう）。
// FISHING_DATA.fish[i].art の パラメータから、横から 見た 魚の SVG を つくる。canvas に 描く ときの SvgCache の キーは "fish:" + id と "fishshadow:" + kind（有限個）。DOM では uid を かえて じかに 入れる。
// 座標: 鼻先 x=0 → 尾の はし x=200。体の まんなかの 線が y=0。D = 体高（art.h × 200）。
// 描く 順: うしろの ひれ（背・しり・はら・尾）→ 体（ぬり・もよう・うろこ・かげ）→ 胸びれ → 目・口・えら・ひげ → ふちの 線。
const FishArt = (() => {
  const INK = "#1F1D1B", L = 200;
  const r1 = (n) => Math.round(n * 10) / 10;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = (seed) => { let s = hash(seed) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  // なめらかな 線（Catmull-Rom → ベジェ）
  function smooth(pts, move = true) {
    let d = (move ? "M" : "L") + r1(pts[0][0]) + "," + r1(pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
    }
    return d;
  }
  function mix(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); }

  // 体の 上下の 輪郭（x は 0〜ped）
  function body(a) {
    const D = a.h * L, ped = (a.ped == null ? 0.82 : a.ped) * L, hx = a.hx == null ? 0.38 : a.hx, s0 = a.s0 == null ? 0.12 : a.s0, p = a.p == null ? 0.26 : a.p;
    const up = a.up == null ? 0.5 : a.up, ea = a.ea == null ? 0.8 : a.ea, eb = a.eb == null ? 1.25 : a.eb, sy = (a.sy || 0) * D, N = 32, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = t * ped;
      const v = t < hx ? s0 + (1 - s0) * Math.pow(Math.sin((Math.PI / 2) * (t / hx)), ea) : p + (1 - p) * Math.pow(Math.cos((Math.PI / 2) * ((t - hx) / (1 - hx))), eb);
      let mid = sy * (1 - t) * (1 - t);
      if (a.wave) mid += a.wave[0] * D * Math.sin(t * Math.PI * 2 * a.wave[1] + (a.wave[2] || 0));
      const hump = a.hump ? a.hump[0] * D * Math.exp(-Math.pow((t - a.hump[1]) / 0.16, 2)) : 0; // 背中の もりあがり（ナマズの 頭・キンギョの 背）
      const belly = a.belly ? a.belly[0] * D * Math.exp(-Math.pow((t - a.belly[1]) / 0.2, 2)) : 0;  // おなかの ふくらみ
      top.push([x, mid - up * D * v - hump]); bot.push([x, mid + (1 - up) * D * v + belly]);
    }
    const yAt = (arr, x) => { const i = Math.max(0, Math.min(N - 1, Math.floor((x / ped) * N))), k = (x - arr[i][0]) / (arr[i + 1][0] - arr[i][0] || 1); return arr[i][1] + (arr[i + 1][1] - arr[i][1]) * Math.max(0, Math.min(1, k)); };
    const midAt = (x) => (yAt(top, x) + yAt(bot, x)) / 2;
    return { D, ped, top, bot, N, topAt: (x) => yAt(top, Math.min(x, ped)), botAt: (x) => yAt(bot, Math.min(x, ped)), midAt };
  }

  function svg(a, { uid = "f", flip = false } = {}) {
    const B = body(a), D = B.D, ped = B.ped, R = rng(uid + JSON.stringify(a).length), box = [0, 0, 0, 0];
    const bb = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
    B.top.forEach(([x, y]) => bb(x, y)); B.bot.forEach(([x, y]) => bb(x, y));
    const C = { back: "#6F8E8A", side: "#C9D6CF", belly: "#F4F1E6", fin: "#B9C7C0", ...(a.col || {}) };
    const finFill = C.fin, finOp = a.finOp == null ? 0.92 : a.finOp;
    let behind = "", front = "", overlay = "", rays = "";
    const fin = (d, fill = finFill, extra = "") => `<path d="${d}" fill="${fill}" fill-opacity="${finOp}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" ${extra}/>`;
    const ray = (x1, y1, x2, y2, col) => (rays += `<path d="M${r1(x1)},${r1(y1)} L${r1(x2)},${r1(y2)}" stroke="${col || mix(finFill, INK, 0.35)}" stroke-width="0.9" stroke-opacity="0.55"/>`);

    // ---- 背びれ・しりびれ（体の 上下の 線に そって） ----
    const edgeFin = (f, top) => {
      const x0 = f.at[0] * L, x1 = Math.min(f.at[1] * L, ped + 6), H = (f.hgt || 0.3) * D * (top ? -1 : 1), n = 10, base = [];
      const yb = (x) => (top ? B.topAt(x) : B.botAt(x)) + (top ? 2 : -2);
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; base.push([x, yb(x)]); }
      const outer = [];
      const k = f.kind || "soft";
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t;
        let h;
        if (k === "spiny") h = (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.25 + 0.08))) * (i % 2 ? 0.78 : 1);
        else if (k === "soft") h = Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)), 0.7) * (f.rake ? 1 - t * f.rake : 1);
        else if (k === "sail") h = Math.pow(Math.sin(Math.PI * (0.05 + t * 0.9)), 0.45) * (1 - t * 0.25);
        else if (k === "long") h = (0.78 + 0.22 * Math.sin(t * Math.PI) - (i % 2 ? 0.05 : 0)) * (f.rake ? 1 - t * f.rake : 1) * (t < 0.06 ? 0.4 + t * 10 : 1);
        else if (k === "adipose") h = Math.sin(Math.PI * t);
        else if (k === "low") h = 0.45 + 0.55 * Math.sin(Math.PI * t);
        else if (k === "tri") h = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) * 1.1;
        else if (k === "lobe") h = Math.sin(Math.PI * t);
        else h = Math.sin(Math.PI * t);
        const lean = (f.lean == null ? 0.18 : f.lean) * Math.abs(H) * h; // うしろに ねかせる
        outer.push([x + lean, yb(x) + H * h]);
      }
      if (k === "lobe") { // シーラカンスの「うで」のような ひれ: 肉の こぶ ＋ 先に ひれ
        const cx = (x0 + x1) / 2, y0 = yb(cx);
        const d = `M${r1(x0)},${r1(yb(x0))} Q${r1(cx - 4)},${r1(y0 + H * 0.9)} ${r1(x1 + Math.abs(H) * 0.9)},${r1(y0 + H * 1.25)} Q${r1(x1 + Math.abs(H) * 0.3)},${r1(y0 + H * 0.5)} ${r1(x1)},${r1(yb(x1))} Z`;
        behind += fin(d, f.col || finFill);
        behind += `<path d="M${r1(x0 + 3)},${r1(yb(x0 + 3))} Q${r1(cx)},${r1(y0 + H * 0.55)} ${r1(x1 + Math.abs(H) * 0.3)},${r1(y0 + H * 0.8)}" fill="none" stroke="${mix(f.col || finFill, INK, 0.3)}" stroke-width="1.2"/>`;
        bb(x1 + Math.abs(H) * 0.9, y0 + H * 1.25);
        return;
      }
      outer.forEach(([x, y]) => bb(x, y));
      // spiny は とげの 先を とがらせる（折れ線）。ほかは なめらかに
      const dd = k === "spiny"
        ? `M${r1(base[0][0])},${r1(base[0][1])} ` + outer.map(([x, y]) => `L${r1(x)},${r1(y)}`).join(" ") + ` L${r1(base[n][0])},${r1(base[n][1])} ` + base.slice().reverse().map(([x, y]) => `L${r1(x)},${r1(y)}`).join(" ") + "Z"
        : `M${r1(base[0][0])},${r1(base[0][1])} ` + smooth(outer, false) + ` L${r1(base[n][0])},${r1(base[n][1])} ` + smooth(base.slice().reverse(), false) + "Z";
      behind += fin(dd, f.col || finFill);
      if (k !== "adipose") for (let i = 1; i < n; i += k === "spiny" ? 1 : 2) ray(base[i][0], base[i][1], outer[i][0], outer[i][1], f.ray);
      if (f.edge) behind += `<path d="${smooth(outer)}" fill="none" stroke="${f.edge}" stroke-width="2.4" stroke-opacity="0.9"/>`; // ふちの 色（イワナの 白・ウグイの 赤 など）
    };
    (a.dorsal || []).forEach((f) => edgeFin(f, true));
    (a.anal || []).forEach((f) => edgeFin(f, false));

    // ---- はらびれ（体の 下から うしろ下へ） ----
    for (const f of a.pelvic || []) {
      const x = f.at * L, y = B.botAt(x) - 2, len = (f.len || 0.28) * D, ang = ((f.ang == null ? 35 : f.ang) * Math.PI) / 180;
      const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len;
      if (f.kind === "thread") { // リュウグウノツカイ: 長い すじ ＋ 先に うちわ
        behind += `<path d="M${r1(x)},${r1(y)} Q${r1(x + len * 0.5)},${r1(y + len * 0.9)} ${r1(tx)},${r1(ty + len * 0.2)}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M${r1(x)},${r1(y)} Q${r1(x + len * 0.5)},${r1(y + len * 0.9)} ${r1(tx)},${r1(ty + len * 0.2)}" fill="none" stroke="${f.col || "#E0525B"}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="${r1(tx + 2)}" cy="${r1(ty + len * 0.2 + 2)}" rx="4.2" ry="2.8" fill="${f.col || "#E0525B"}" stroke="${INK}" stroke-width="1.6"/>`;
        bb(tx + 7, ty + len * 0.2 + 6); continue;
      }
      const w = len * (f.kind === "fan" ? 0.8 : 0.42);
      const d = `M${r1(x - w * 0.3)},${r1(y)} Q${r1(x + len * 0.2)},${r1(y + w)} ${r1(tx)},${r1(ty)} Q${r1(x + len * 0.55)},${r1(y + w * 0.05)} ${r1(x + w * 0.6)},${r1(y - 1)} Z`;
      behind += fin(d, f.col || finFill); ray(x, y, tx, ty, f.ray); bb(tx, ty);
    }

    // ---- 尾びれ ----
    const t = a.tail || { kind: "fork" }, pt = B.topAt(ped), pb = B.botAt(ped), pm = (pt + pb) / 2, TL = L - ped, TH = (t.h || 0.55) * D;
    let td = "";
    const tk = t.kind;
    if (tk === "fork" || tk === "emarg") {
      const dep = (t.depth == null ? (tk === "fork" ? 0.55 : 0.18) : t.depth) * TL;
      td = `M${r1(ped - 2)},${r1(pt)} Q${r1(ped + TL * 0.45)},${r1(pm - TH * 0.35)} ${r1(L)},${r1(pm - TH)} Q${r1(L - dep * 0.35)},${r1(pm - TH * 0.35)} ${r1(L - dep)},${r1(pm)} Q${r1(L - dep * 0.35)},${r1(pm + TH * 0.35)} ${r1(L)},${r1(pm + TH)} Q${r1(ped + TL * 0.45)},${r1(pm + TH * 0.35)} ${r1(ped - 2)},${r1(pb)} Z`;
      for (const s of [-1, -0.55, 0.55, 1]) ray(ped + 2, pm + s * (pb - pt) * 0.35, L - dep * 0.2 * (1 - Math.abs(s)), pm + s * TH * 0.92, t.ray);
      bb(L, pm - TH); bb(L, pm + TH);
    } else if (tk === "trunc" || tk === "round") {
      const bulge = tk === "round" ? TL * 0.55 : TL * 0.12;
      td = `M${r1(ped - 2)},${r1(pt)} Q${r1(ped + TL * 0.4)},${r1(pm - TH * 0.8)} ${r1(L - bulge * 0.6)},${r1(pm - TH)} Q${r1(L + bulge * 0.35)},${r1(pm)} ${r1(L - bulge * 0.6)},${r1(pm + TH)} Q${r1(ped + TL * 0.4)},${r1(pm + TH * 0.8)} ${r1(ped - 2)},${r1(pb)} Z`;
      for (const s of [-0.8, -0.3, 0.3, 0.8]) ray(ped + 2, pm + s * (pb - pt) * 0.4, L - bulge * 0.3, pm + s * TH, t.ray);
      bb(L + bulge * 0.2, pm - TH); bb(L, pm + TH);
    } else if (tk === "fan") { // キンギョの ながい 尾（ひらひら）
      const sp = TH * 1.1;
      td = `M${r1(ped - 3)},${r1(pt)} C${r1(ped + TL * 0.4)},${r1(pm - sp * 0.9)} ${r1(L + 8)},${r1(pm - sp * 1.25)} ${r1(L + 14)},${r1(pm - sp * 0.95)} C${r1(L + 4)},${r1(pm - sp * 0.6)} ${r1(L + 10)},${r1(pm - sp * 0.3)} ${r1(L - TL * 0.25)},${r1(pm - 2)} C${r1(L + 8)},${r1(pm + sp * 0.2)} ${r1(L + 2)},${r1(pm + sp * 0.62)} ${r1(L + 12)},${r1(pm + sp * 0.98)} C${r1(L + 6)},${r1(pm + sp * 1.25)} ${r1(ped + TL * 0.4)},${r1(pm + sp * 0.95)} ${r1(ped - 3)},${r1(pb)} Z`;
      for (const s of [-1, -0.6, -0.25, 0.25, 0.6, 1]) ray(ped + 2, pm + s * (pb - pt) * 0.3, L + 6, pm + s * sp * 0.95, t.ray);
      bb(L + 16, pm - sp * 1.2); bb(L + 14, pm + sp * 1.2);
    } else if (tk === "clavus") { // マンボウの「かじびれ」: 体の うしろの なみなみの おび
      const n = 7, pts = [];
      for (let i = 0; i <= n; i++) { const k = i / n, y = pt + (pb - pt) * k; pts.push([ped + TL * (0.55 + 0.25 * Math.sin(Math.PI * k)) + (i % 2 ? -TL * 0.18 : 0), y]); }
      td = `M${r1(ped - 4)},${r1(pt)} ` + smooth(pts, false) + ` L${r1(ped - 4)},${r1(pb)} Z`;
      pts.forEach(([x, y]) => bb(x, y));
      for (let i = 1; i < n; i++) ray(ped, pt + ((pb - pt) * i) / n, pts[i][0] - 2, pts[i][1], t.ray);
    } else if (tk === "coela") { // シーラカンス: 上下の ひれ ＋ まんなかの 小さな しっぽ
      td = `M${r1(ped - 2)},${r1(pt)} Q${r1(ped + TL * 0.4)},${r1(pm - TH * 1.05)} ${r1(ped + TL * 0.78)},${r1(pm - TH * 0.95)} Q${r1(ped + TL * 0.7)},${r1(pm - TH * 0.35)} ${r1(ped + TL * 0.8)},${r1(pm - D * 0.05)} Q${r1(L + 8)},${r1(pm - D * 0.1)} ${r1(L + 10)},${r1(pm)} Q${r1(L + 8)},${r1(pm + D * 0.1)} ${r1(ped + TL * 0.8)},${r1(pm + D * 0.05)} Q${r1(ped + TL * 0.7)},${r1(pm + TH * 0.35)} ${r1(ped + TL * 0.78)},${r1(pm + TH * 0.95)} Q${r1(ped + TL * 0.4)},${r1(pm + TH * 1.05)} ${r1(ped - 2)},${r1(pb)} Z`;
      bb(L + 12, pm - TH * 1.05); bb(L, pm + TH * 1.05);
      for (const s of [-0.9, -0.5, 0.5, 0.9]) ray(ped + 2, pm + s * (pb - pt) * 0.4, ped + TL * 0.75, pm + s * TH * 0.95, t.ray);
    } else if (tk === "eel") { // ウナギ・アナゴ: 背・しり びれが 尾の まわりで つながる
      const ex0 = ped - 24; td = `M${r1(ex0)},${r1(B.topAt(ex0) - D * 0.3)} Q${r1(L - 6)},${r1(pm - D * 0.5)} ${r1(L + 3)},${r1(pm)} Q${r1(L - 6)},${r1(pm + D * 0.5)} ${r1(ex0)},${r1(B.botAt(ex0) + D * 0.3)} Q${r1(ex0 + 10)},${r1(pm)} ${r1(ex0)},${r1(B.topAt(ex0) - D * 0.3)} Z`;
      bb(L + 3, pm - D * 0.45); bb(L + 3, pm + D * 0.45);
    }
    if (td) behind += fin(td, t.col || finFill);
    if (td && t.spots) { const Rn = rng(uid + "tail"); let sp = ""; for (let i = 0; i < 16; i++) sp += `<circle cx="${r1(ped + TL * (0.15 + Rn() * 0.8))}" cy="${r1(pm + (Rn() - 0.5) * TH * 1.6)}" r="${r1(1 + Rn() * 0.8)}" fill="${t.spots}"/>`; behind += `<g clip-path="url(#${uid}-tailclip)">${sp}</g>`; }
    if (t.stripe) behind += `<path d="${td}" fill="none" stroke="${t.stripe}" stroke-width="3" stroke-opacity="0.8" clip-path="url(#${uid}-tailclip)"/>`;

    // ---- 体 ----
    const tp = B.top, bt = B.bot, sn = a.snout == null ? 0.45 : a.snout, gap = bt[0][1] - tp[0][1];
    const bodyD = smooth(tp) + ` L${r1(bt[B.N][0])},${r1(bt[B.N][1])} ` + smooth(bt.slice().reverse(), false) + ` C${r1(-gap * sn)},${r1(bt[0][1] - gap * 0.05)} ${r1(-gap * sn)},${r1(tp[0][1] + gap * 0.05)} ${r1(tp[0][0])},${r1(tp[0][1])} Z`;
    bb(-gap * sn * 0.75, 0);
    const y0 = Math.min(...tp.map((p) => p[1])), y1 = Math.max(...bt.map((p) => p[1]));
    const defs = `<clipPath id="${uid}-clip"><path d="${bodyD}"/></clipPath><linearGradient id="${uid}-g" gradientUnits="userSpaceOnUse" x1="0" y1="${r1(y0)}" x2="0" y2="${r1(y1)}"><stop offset="0" stop-color="${C.back}"/><stop offset="${a.gs || 0.48}" stop-color="${C.side}"/><stop offset="${a.gb || 0.78}" stop-color="${C.belly}"/><stop offset="1" stop-color="${C.belly2 || C.belly}"/></linearGradient>`;
    // もよう（体の 形で きりぬく）
    let pat = "";
    for (const m of a.pat || []) {
      const k = m.k;
      if (k === "stripe") { // よこの すじ（y: -1 せなか 〜 1 おなか）
        const x0 = (m.from || 0.1) * L, x1 = (m.to || 0.95) * L, pts = [], w = (m.w || 0.08) * D;
        for (let i = 0; i <= 12; i++) { const x = x0 + ((x1 - x0) * i) / 12; const tt = B.topAt(x), bb2 = B.botAt(x); pts.push([x, tt + (bb2 - tt) * ((m.y + 1) / 2)]); }
        pat += `<path d="${smooth(pts)}" fill="none" stroke="${m.c}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-opacity="${m.o || 0.9}"/>`;
      } else if (k === "bars") { // たての しま
        for (let i = 0; i < m.n; i++) {
          const x = (m.from + ((m.to - m.from) * (i + 0.5)) / m.n) * L, w = (m.w || 0.045) * L * (m.taper ? 1 - (i / m.n) * m.taper : 1), tt = B.topAt(x) - 2, b2 = m.full ? B.botAt(x) + 2 : B.topAt(x) + (B.botAt(x) - B.topAt(x)) * (m.len || 0.75);
          pat += `<path d="M${r1(x - w / 2)},${r1(tt)} Q${r1(x - w * 0.2)},${r1((tt + b2) / 2)} ${r1(x - w / 2 + (m.slant || 0))},${r1(b2)} L${r1(x + w / 2 + (m.slant || 0))},${r1(b2)} Q${r1(x + w * 0.8)},${r1((tt + b2) / 2)} ${r1(x + w / 2)},${r1(tt)} Z" fill="${m.c}" fill-opacity="${m.o || 0.85}"/>`;
        }
      } else if (k === "parr") { // パーマーク（だえんの もよう）
        for (let i = 0; i < m.n; i++) { const x = (m.from + ((m.to - m.from) * (i + 0.5)) / m.n) * L, y = B.midAt(x) + (m.y || 0) * D; pat += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1((m.rx || 0.035) * L)}" ry="${r1((m.ry || 0.2) * D)}" fill="${m.c}" fill-opacity="${m.o || 0.55}"/>`; }
      } else if (k === "spots") { // てんてん
        const Rn = rng(uid + k + (m.seed || 1) + m.c);
        for (let i = 0; i < m.n; i++) {
          const x = (m.x[0] + (m.x[1] - m.x[0]) * Rn()) * L, tt = B.topAt(x), b2 = B.botAt(x), y = tt + (b2 - tt) * (m.y[0] + (m.y[1] - m.y[0]) * Rn()), r = (m.r || 0.02) * L * (0.7 + Rn() * 0.6);
          pat += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${m.c}" fill-opacity="${m.o || 0.9}"${m.ring ? ` stroke="${m.ring}" stroke-width="${r1(r * 0.5)}"` : ""}/>`;
        }
      } else if (k === "dotrow") { // 1れつの てん（マイワシの 七つ星・アナゴの はかりめ）
        for (let i = 0; i < m.n; i++) { const x = (m.from + ((m.to - m.from) * i) / Math.max(1, m.n - 1)) * L, tt = B.topAt(x), b2 = B.botAt(x), y = tt + (b2 - tt) * ((m.y + 1) / 2); pat += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1((m.r || 0.012) * L)}" fill="${m.c}" fill-opacity="${m.o || 0.95}"/>`; }
      } else if (k === "wavy") { // マサバの せなかの なみもよう
        for (let i = 0; i < m.n; i++) {
          const x = (m.from + ((m.to - m.from) * i) / m.n) * L, tt = B.topAt(x), b2 = B.botAt(x), h = (b2 - tt) * (m.len || 0.45), pts = [];
          for (let j = 0; j <= 6; j++) pts.push([x + (j % 2 ? 3.2 : -1.6) + j * 0.6, tt - 2 + (h * j) / 6]);
          pat += `<path d="${smooth(pts)}" fill="none" stroke="${m.c}" stroke-width="${m.w || 2.2}" stroke-linecap="round" stroke-opacity="0.9"/>`;
        }
      } else if (k === "mottle") { // まだら
        const Rn = rng(uid + "m" + (m.seed || 1) + m.c);
        for (let i = 0; i < m.n; i++) {
          const x = (m.x[0] + (m.x[1] - m.x[0]) * Rn()) * L, tt = B.topAt(x), b2 = B.botAt(x), y = tt + (b2 - tt) * (m.y[0] + (m.y[1] - m.y[0]) * Rn()), r = (m.r || 0.04) * L * (0.6 + Rn() * 0.8), pts = [];
          for (let j = 0; j < 7; j++) { const an = (j / 7) * Math.PI * 2, rr = r * (0.65 + Rn() * 0.5); pts.push([x + Math.cos(an) * rr * 1.25, y + Math.sin(an) * rr * 0.8]); }
          pts.push(pts[0]); pat += `<path d="${smooth(pts)}Z" fill="${m.c}" fill-opacity="${m.o || 0.6}"/>`;
        }
      } else if (k === "patch") { // もよう（ニシキゴイの 赤 など）: [x, y(-1〜1), rx, ry]
        for (const [px, py, rx, ry, rot] of m.at) { const x = px * L, tt = B.topAt(x), b2 = B.botAt(x), y = tt + (b2 - tt) * ((py + 1) / 2); pat += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx * L)}" ry="${r1(ry * D)}" transform="rotate(${rot || 0} ${r1(x)} ${r1(y)})" fill="${m.c}" fill-opacity="${m.o || 0.95}"/>`; }
      } else if (k === "scutes") { // マアジの ぜいご
        const pts = [];
        for (let i = 0; i <= 16; i++) { const x = (m.from + ((m.to - m.from) * i) / 16) * L; pts.push([x, B.midAt(x) + (m.y || 0) * D]); }
        pat += `<path d="${smooth(pts)}" fill="none" stroke="${m.c}" stroke-width="${r1(D * 0.07)}" stroke-linecap="round" stroke-opacity="0.8"/>`;
        for (let i = 1; i < 16; i++) { const [x, y] = pts[i]; pat += `<path d="M${r1(x - 1.5)},${r1(y - D * 0.035)} L${r1(x + 1.2)},${r1(y)} L${r1(x - 1.5)},${r1(y + D * 0.035)}" fill="none" stroke="${INK}" stroke-width="0.8" stroke-opacity="0.5"/>`; }
      } else if (k === "scales") { // うろこ（うすく）
        const s = (m.s || 0.05) * L, op = m.o || 0.28;
        for (let x = (m.from || 0.2) * L; x < (m.to || 0.8) * L; x += s * 0.85) for (let yy = -D; yy < D; yy += s * 0.62) {
          const oy = ((Math.round(x / (s * 0.85)) % 2) * s) / 3.2;
          pat += `<path d="M${r1(x - s / 2)},${r1(yy + oy)} Q${r1(x)},${r1(yy + oy + s * 0.55)} ${r1(x + s / 2)},${r1(yy + oy)}" fill="none" stroke="${m.c || INK}" stroke-width="0.9" stroke-opacity="${op}"/>`;
        }
      } else if (k === "lateral") { // そくせん（よこの 線）
        const n2 = m.n || 1;
        for (let j = 0; j < n2; j++) {
          const pts = [], yy = (m.y == null ? -0.15 : m.y) + j * (m.gap || 0);
          for (let i = 0; i <= 12; i++) { const x = ((m.from || 0.22) + (((m.to || 0.97) - (m.from || 0.22)) * i) / 12) * L, tt = B.topAt(x), b2 = B.botAt(x); pts.push([x, tt + (b2 - tt) * ((yy + 1) / 2)]); }
          pat += `<path d="${smooth(pts)}" fill="none" stroke="${m.c || mix(C.side, INK, 0.5)}" stroke-width="${m.w || 1.1}" stroke-opacity="0.7"/>`;
        }
      } else if (k === "glow") { // つや
        pat += `<ellipse cx="${r1((m.x || 0.35) * L)}" cy="${r1(B.topAt((m.x || 0.35) * L) + D * 0.22)}" rx="${r1((m.rx || 0.2) * L)}" ry="${r1(D * (m.ry || 0.12))}" fill="#FFFFFF" fill-opacity="${m.o || 0.28}"/>`;
      } else if (k === "band") { // からだの 一部を べつの 色で（ブリの 黄色い おび・ヒラメの うら）
        const x0 = m.from * L, x1 = m.to * L, pts = [], pts2 = [];
        for (let i = 0; i <= 12; i++) { const x = x0 + ((x1 - x0) * i) / 12, tt = B.topAt(x), b2 = B.botAt(x); pts.push([x, tt + (b2 - tt) * ((m.y0 + 1) / 2)]); pts2.push([x, tt + (b2 - tt) * ((m.y1 + 1) / 2)]); }
        pat += `<path d="${smooth(pts)} ${smooth(pts2.reverse(), false)} Z" fill="${m.c}" fill-opacity="${m.o || 0.85}"/>`;
      } else if (k === "blot") { // えらぶたの 黒い てん など: x, y(-1〜1), r
        const x = m.x * L, tt = B.topAt(x), b2 = B.botAt(x); pat += `<ellipse cx="${r1(x)}" cy="${r1(tt + (b2 - tt) * ((m.y + 1) / 2))}" rx="${r1(m.r * L)}" ry="${r1(m.r * L * (m.sq || 0.8))}" fill="${m.c}" fill-opacity="${m.o || 0.9}"/>`;
      }
    }
    // 体の かげ（下半分を すこし こく）と ふちの つや
    const shade = `<path d="${smooth(bt)} L${r1(ped)},${r1(B.midAt(ped))} ${smooth(B.top.map(([x]) => [x, B.midAt(x) + (B.botAt(x) - B.midAt(x)) * 0.35]).reverse(), false)} Z" fill="${INK}" fill-opacity="0.06"/>`;
    overlay += `<g clip-path="url(#${uid}-clip)"><path d="${bodyD}" fill="url(#${uid}-g)"/>${pat}${shade}</g>`;

    // ---- 胸びれ（体の 上） ----
    for (const f of a.pect || [{ at: [0.27, 0.25] }]) {
      const x = f.at[0] * L, y = B.midAt(x) + f.at[1] * D, len = (f.len || 0.32) * D * (f.kind === "fan" ? 1.2 : 1), ang = ((f.ang == null ? 20 : f.ang) * Math.PI) / 180;
      const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len, w = len * (f.kind === "fan" ? 0.75 : f.kind === "lobe" ? 0.5 : 0.36);
      let d;
      if (f.kind === "lobe") d = `M${r1(x)},${r1(y - w * 0.4)} Q${r1(x + len * 0.5)},${r1(y - w * 0.6)} ${r1(tx)},${r1(ty)} Q${r1(x + len * 0.55)},${r1(y + w * 0.9)} ${r1(x)},${r1(y + w * 0.4)} Z`;
      else d = `M${r1(x)},${r1(y - w * 0.35)} Q${r1(x + len * 0.55)},${r1(y - w * 0.75)} ${r1(tx)},${r1(ty)} Q${r1(x + len * 0.4)},${r1(y + w * 0.8)} ${r1(x)},${r1(y + w * 0.35)} Z`;
      front += fin(d, f.col || finFill);
      for (const k2 of [-0.25, 0.05, 0.35]) front += `<path d="M${r1(x + 2)},${r1(y + k2 * w)} L${r1(tx - len * 0.1)},${r1(ty + k2 * w * 0.8)}" stroke="${mix(f.col || finFill, INK, 0.35)}" stroke-width="0.9" stroke-opacity="0.55"/>`;
      if (f.kind === "lobe") front += `<path d="M${r1(x + 1)},${r1(y)} Q${r1(x + len * 0.4)},${r1(y + w * 0.1)} ${r1(x + len * 0.62)},${r1(y + (ty - y) * 0.62)}" fill="none" stroke="${mix(f.col || finFill, INK, 0.3)}" stroke-width="1.3"/>`;
    }

    // ---- 目・口・えら・ひげ ----
    const e = a.eye || {}, ex = (e.x == null ? 0.1 : e.x) * L, ey = B.midAt(ex) + (e.y == null ? -0.12 : e.y) * D, er = e.r || 5;
    let head = "";
    if (a.gill !== false) { const gx = (a.gill || 0.22) * L, gt = B.topAt(gx), gb = B.botAt(gx); head += `<path d="M${r1(gx - 1)},${r1(gt + (gb - gt) * 0.18)} Q${r1(gx + (gb - gt) * 0.16)},${r1((gt + gb) / 2)} ${r1(gx - 2)},${r1(gb - (gb - gt) * 0.1)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-opacity="0.75" stroke-linecap="round"/>`; }
    const m = a.mouth || {}, mk = m.k || "terminal", mx = tp[0][0] - gap * sn * 0.62, my = B.midAt(2) + (m.y || 0.1) * D, ml = (m.len || 0.05) * L;
    if (mk === "terminal") head += `<path d="M${r1(mx + 1)},${r1(my)} Q${r1(mx + ml * 0.6)},${r1(my + 1.6)} ${r1(mx + ml)},${r1(my - 0.4)}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`;
    else if (mk === "big") head += `<path d="M${r1(mx)},${r1(my - 1)} Q${r1(mx + ml * 0.5)},${r1(my + ml * 0.28)} ${r1(mx + ml)},${r1(my + ml * 0.12)}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M${r1(mx + ml * 0.9)},${r1(my + ml * 0.1)} q2,1.2 1.5,3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
    else if (mk === "up") head += `<path d="M${r1(mx)},${r1(my - 2)} Q${r1(mx + ml * 0.5)},${r1(my + 1.5)} ${r1(mx + ml)},${r1(my + 2.5)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
    else if (mk === "sub") { const sx = mx + ml * 0.9, sy2 = B.botAt(sx) - 2; head += `<path d="M${r1(sx - ml * 0.6)},${r1(sy2)} Q${r1(sx)},${r1(sy2 + 2)} ${r1(sx + ml * 0.5)},${r1(sy2 - 0.5)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`; }
    else if (mk === "beak") head += `<path d="M${r1(mx - 1)},${r1(my - 2.4)} L${r1(mx + ml)},${r1(my - 0.6)} M${r1(mx - 1)},${r1(my + 1.6)} L${r1(mx + ml)},${r1(my + 0.4)}" stroke="${m.c || "#F5EFE0"}" stroke-width="3" stroke-linecap="round"/><path d="M${r1(mx - 1)},${r1(my - 0.4)} L${r1(mx + ml * 0.9)},${r1(my)}" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;
    else if (mk === "lowjaw") { const jl = (m.jaw || 0.12) * L; head += `<path d="M${r1(mx + 4)},${r1(my + 0.6)} L${r1(mx - jl)},${r1(my + 1.6)} L${r1(mx + 4)},${r1(my + 2.6)} Z" fill="${INK}"/><path d="M${r1(mx - jl * 0.3)},${r1(my + 1.2)} L${r1(mx - jl)},${r1(my + 1.6)}" stroke="${m.c || "#F08A3C"}" stroke-width="2" stroke-linecap="round"/>`; bb(mx - jl - 2, my); }
    else if (mk === "hook") head += `<path d="M${r1(mx - 3)},${r1(my - 3)} Q${r1(mx - 5)},${r1(my + 3)} ${r1(mx + 1)},${r1(my + 4)}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M${r1(mx)},${r1(my + 1)} Q${r1(mx + ml * 0.5)},${r1(my + 3.5)} ${r1(mx + ml)},${r1(my + 1)}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${r1(mx + 2)},${r1(my + 2.4)} l1.2,1.8 M${r1(mx + 5)},${r1(my + 3)} l1,1.8" stroke="#FFF" stroke-width="1"/>`;
    else if (mk === "fang") head += `<path d="M${r1(mx)},${r1(my - 1)} Q${r1(mx + ml * 0.5)},${r1(my + 2)} ${r1(mx + ml)},${r1(my + 1)}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${r1(mx + 3)},${r1(my + 0.2)} l0.8,2.4 l0.8,-2.2 M${r1(mx + 7)},${r1(my + 0.8)} l0.8,2.2 l0.8,-2" fill="#FFF" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
    for (const b of a.barbels || []) { const bx = b[0] * L, by = B.midAt(bx) + b[1] * D, an = (b[3] * Math.PI) / 180, bl = b[2] * L, tx = bx + Math.cos(an) * bl, ty = by + Math.sin(an) * bl; head += `<path d="M${r1(bx)},${r1(by)} Q${r1(bx + Math.cos(an) * bl * 0.5 + 2)},${r1(by + Math.sin(an) * bl * 0.5 + 3)} ${r1(tx)},${r1(ty)}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M${r1(bx)},${r1(by)} Q${r1(bx + Math.cos(an) * bl * 0.5 + 2)},${r1(by + Math.sin(an) * bl * 0.5 + 3)} ${r1(tx)},${r1(ty)}" fill="none" stroke="${b[4] || "#E9D9B5"}" stroke-width="0.8" stroke-linecap="round"/>`; bb(tx, ty); }
    // 目（白目の ふち → 虹彩 → ひとみ → ひかり）
    const eyes = a.eyes2 ? [[ex, ey], [ex + a.eyes2[0] * L, ey + a.eyes2[1] * D]] : [[ex, ey]];
    for (const [x, y] of eyes) head += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(er + 1.2)}" fill="${e.ring || "#F2E6C8"}" stroke="${INK}" stroke-width="1.6"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(er * 0.78)}" fill="${e.iris || "#C9A64A"}"/><circle cx="${r1(x + er * 0.08)}" cy="${r1(y)}" r="${r1(er * 0.52)}" fill="${INK}"/><circle cx="${r1(x - er * 0.25)}" cy="${r1(y - er * 0.3)}" r="${r1(Math.max(0.9, er * 0.2))}" fill="#FFFFFF"/>`;
    // とくべつな かざり
    for (const x2 of a.extra || []) {
      if (x2.k === "crest") { // リュウグウノツカイの 頭の かざり（赤い すじ）
        for (let i = 0; i < 6; i++) { const bx = (0.04 + i * 0.012) * L, by = B.topAt(bx), l2 = (0.5 + i * 0.08) * D * 3.2, an = (-100 - i * 7) * Math.PI / 180, tx = bx + Math.cos(an) * l2 * 0.3 - i * 3, ty = by + Math.sin(an) * l2; head += `<path d="M${r1(bx)},${r1(by)} Q${r1(bx - 6)},${r1(by - l2 * 0.5)} ${r1(tx)},${r1(ty)}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M${r1(bx)},${r1(by)} Q${r1(bx - 6)},${r1(by - l2 * 0.5)} ${r1(tx)},${r1(ty)}" fill="none" stroke="#E0525B" stroke-width="1.6" stroke-linecap="round"/>`; bb(tx - 3, ty - 3); }
      } else if (x2.k === "spine") { // カワハギの つの（せなかの とげ 1本）
        const bx = x2.x * L, by = B.topAt(bx), l2 = x2.len * D; head += `<path d="M${r1(bx - 2)},${r1(by + 1)} L${r1(bx + 1)},${r1(by - l2)} L${r1(bx + 3)},${r1(by + 1)} Z" fill="${x2.c || "#8C7A5A"}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`; bb(bx, by - l2);
      } else if (x2.k === "filament") { // のびた すじ（カワハギの オスの 背びれ）
        const bx = x2.x * L, by = B.topAt(bx), l2 = x2.len * L; head += `<path d="M${r1(bx)},${r1(by)} Q${r1(bx + l2 * 0.4)},${r1(by - l2 * 0.5)} ${r1(bx + l2)},${r1(by - l2 * 0.35)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`; bb(bx + l2, by - l2 * 0.5);
      } else if (x2.k === "cheek") { // ほおの もよう（ヨシノボリの あお・ベラの すじ）
        head += `<path d="M${r1(x2.x0 * L)},${r1(B.midAt(x2.x0 * L) + x2.y * D)} Q${r1(((x2.x0 + x2.x1) / 2) * L)},${r1(B.midAt(x2.x0 * L) + (x2.y + 0.08) * D)} ${r1(x2.x1 * L)},${r1(B.midAt(x2.x1 * L) + (x2.y + 0.02) * D)}" fill="none" stroke="${x2.c}" stroke-width="${x2.w || 1.6}" stroke-linecap="round" stroke-opacity="0.9"/>`;
      } else if (x2.k === "yellowspot") { // アユの「おいぼし」（えらの うしろの 黄色）
        const bx = x2.x * L; head += `<ellipse cx="${r1(bx)}" cy="${r1(B.midAt(bx) + x2.y * D)}" rx="${r1(x2.r * L)}" ry="${r1(x2.r * L * 0.7)}" fill="#F2C94C" fill-opacity="0.95"/>`;
      } else if (x2.k === "teeth") { // イシダイの くちばし
        head += `<path d="M${r1(mx - 1)},${r1(my - 1.5)} q3,-0.5 5,0.5 M${r1(mx - 1)},${r1(my + 1.5)} q3,0.5 5,-0.5" stroke="#F5EFE0" stroke-width="2.4" stroke-linecap="round"/>`;
      }
    }
    // ---- ふちの 線 ----
    const outline = `<path d="${bodyD}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    const pad = 8, vb = [box[0] - pad, box[1] - pad, box[2] - box[0] + pad * 2, box[3] - box[1] + pad * 2];
    const tailClip = td ? `<clipPath id="${uid}-tailclip"><path d="${td}"/></clipPath>` : "";
    let inner = `<defs>${defs}${tailClip}</defs><g>${behind}${rays}</g>${overlay}${outline}${front}${head}`;
    if (flip) inner = `<g transform="translate(${r1(vb[0] * 2 + vb[2])},0) scale(-1,1)">${inner}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(r1).join(" ")}">${inner}</svg>`;
  }
  // 魚の かげ（水の 中で 近づく とき）。大きさ S / M / L / XL と ほそながい かたち
  function shadow(kind) {
    const s = { S: [34, 12], M: [52, 18], L: [74, 26], XL: [104, 36], thin: [84, 12] }[kind] || [52, 18];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s[0] / 2 - 10} ${-s[1] / 2 - 4} ${s[0] + 20} ${s[1] + 8}"><path d="M${-s[0] / 2},0 C${-s[0] / 2},${-s[1] / 2} ${s[0] * 0.2},${-s[1] / 2} ${s[0] * 0.34},${-s[1] * 0.1} L${s[0] / 2 + 8},${-s[1] * 0.4} L${s[0] / 2 + 5},0 L${s[0] / 2 + 8},${s[1] * 0.4} L${s[0] * 0.34},${s[1] * 0.1} C${s[0] * 0.2},${s[1] / 2} ${-s[0] / 2},${s[1] / 2} ${-s[0] / 2},0 Z" fill="#1B3A4B" fill-opacity="0.42"/></svg>`;
  }
  return { svg, shadow, body };
})();
