// おうちの そとの 絵（O9・UI-74。オーナーの FB 2026-10-03「お家の外見カスタマイズ機能もつけて。それに伴い、工務店をネリカスタウンに追加して、
// そこでパーツや塗装を購入してカスタマイズできるようにして。」）
// ネリカスタウンの「みんなの おうち」（6×4 マス・入口 3）と おなじ 大きさ・線・光で、やね・かべ・まど・ドア・えんとつ・やねの かざり・あかり・ポスト・
// まえの かざり と 4か所の ペンキ（やね・かべ・ドア・まどわく）を くみあわせて 描く。もとの 絵は tools/town-design/nerikasu-buildings.mjs の home()。
// 町の 絵の キーは えらんだ パーツと ペンキ だけ（有限。js/house-ext.js の HouseExt.key）。id は つかわない（ほかの 絵と ぶつからない）。
const HouseExtArt = (() => {
  const W = 192, H = 128, D = 112, BOX = [-10, -49, 207, 140]; // 6×4 マス・入口の まんなか・足もとの まわり（町の 絵と おなじ）
  const INKC = "#1F1D1B", ink = "#31594E", cream = "#F3EAD9", copper = "#BC795C";
  const f = (n) => +(+n).toFixed(1);
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };
  const st = (w = 1.2, c = INKC) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const op = (o) => (o.op != null ? ` opacity="${o.op}"` : "");
  const R = (x, y, w, h, fill, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INKC)}${op(o)}/>`;
  const Rn = (x, y, w, h, fill, o = {}) => R(x, y, w, h, fill, { ...o, sw: 0 });
  const C = (x, y, r, fill, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INKC)}${op(o)}/>`;
  const E = (x, y, rx, ry, fill, o = {}) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INKC)}${op(o)}/>`;
  const Pth = (d, fill, o = {}) => `<path d="${d}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INKC)}${op(o)}/>`;
  const L = (x1, y1, x2, y2, c, w = 1, o = {}) => `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${op(o)} fill="none"/>`;
  const T = (x, y, text, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-size="${o.size || 8}" font-weight="800" fill="${o.fill || "#FFF"}" text-anchor="middle" font-family="'Noto Sans CJK JP','Noto Sans JP',sans-serif">${text}</text>`;
  // まど（ガラス・ひかり・わく）。n は よる（あかりが つく）
  const glass = (n) => (n ? "#EACB89" : "#94BEC2"), shine = (n) => (n ? "#FFF0C5" : "#E5F3EC");
  const pane = (x, y, w, h, n, frame = cream) => R(x, y, w, h, glass(n), { sw: 0.8, stroke: ink }) + Pth(`M${f(x + 2)},${f(y + h - 2)} L${f(x + w * 0.6)},${f(y + 2)} h${f(w * 0.2)} L${f(x + w * 0.2)},${f(y + h - 2)}Z`, shine(n), { sw: 0, op: 0.7 }) + L(x + w / 2, y, x + w / 2, y + h, frame, 1.1) + L(x, y + h * 0.58, x + w, y + h * 0.58, frame, 0.8);
  function brick(x, y, w, h, c = "#BD8E77", m = "#E2C9AA") {
    let s = R(x, y, w, h, c, { sw: 0.7, stroke: "#82634F" });
    for (let j = 0; j < h / 6; j++) { s += L(x, y + j * 6, x + w, y + j * 6, m, 0.6); for (let i = 1; i < w / 14; i++) s += L(x + i * 14 - (j % 2 ? 7 : 0), y + j * 6, x + i * 14 - (j % 2 ? 7 : 0), y + Math.min(h, j * 6 + 6), m, 0.6); }
    return s;
  }
  function flower(x, y, col = "#D79AAF") { return L(x, y + 10, x, y - 2, "#5B7D51", 0.8) + E(x - 3, y + 5, 3, 1.3, "#87A269", { sw: 0 }) + E(x + 3, y + 2, 3, 1.3, "#73925A", { sw: 0 }) + [0, 1, 2, 3, 4].map((i) => C(x + Math.sin(i * 1.256) * 2.6, y + Math.cos(i * 1.256) * 2.6, 1.9, col, { sw: 0.3, stroke: shade(col, -0.25) })).join("") + C(x, y, 1, "#F5D88B", { sw: 0 }); }
  function planter(x, y, w = 28) { let s = R(x, y, w, 10, "#C59A76", { sw: 0.7 }) + Pth(`M${x},${y} l3,-4 h${w - 6} l3,4Z`, "#E0BD97", { sw: 0.6 }) + Rn(x + 3, y - 3, w - 6, 3, "#716C4C"); for (let i = 6; i < w - 2; i += 8) s += flower(x + i, y - 7 - (i % 3) * 2); return s; }
  const drain = (t0 = 35) => L(6, t0, 6, H - 9, copper, 1.6) + L(W - 10, t0, W - 10, H - 10, copper, 1.6) + Pth(`M6,${H - 9} l4,5 M${W - 10},${H - 10} l-4,5`, "none", { sw: 1.6, stroke: copper });

  // ---- かべ（そざい × ペンキ）----
  // t0: かべの うえの はし（いつもは 28。3かいだては もっと うえ）
  function wall(p, c, t0 = 28) {
    let s = Pth(`M${W - 6},${t0 - 1} l13,9 V${H + 7} H13 L3,${H - 3}Z`, "#312619", { sw: 0, op: 0.14 }) + R(4, t0, W - 10, H - 1 - t0, c, { sw: 1.2 }) + Pth(`M${W - 6},${t0} l6,-6 V${H - 6} l-6,5Z`, shade(c, -0.18), { sw: 0.8 });
    const x0 = 6, x1 = W - 8, top = t0 + 2, base = H - 21;
    if (p.siding === "brick") {
      for (let j = 0, y = top + 2; y < base; j++, y += 7) { s += L(x0, y, x1, y, shade(c, -0.22), 0.7); for (let x = x0 + (j % 2 ? 9 : 2); x < x1; x += 18) s += L(x, y, x, Math.min(base, y + 7), shade(c, -0.22), 0.6); }
      s += Rn(x0, top + 3, x1 - x0, 3, shade(c, 0.25), { op: 0.35 });
    } else if (p.siding === "board") {
      for (let x = x0 + 9; x < x1; x += 10) s += L(x, top, x, base, shade(c, -0.2), 0.8) + L(x + 1.2, top, x + 1.2, base, shade(c, 0.22), 0.5);
      for (let x = x0 + 4; x < x1; x += 20) s += C(x, top + 6, 0.7, shade(c, -0.35), { sw: 0 }) + C(x, base - 5, 0.7, shade(c, -0.35), { sw: 0 });
    } else if (p.siding === "tile") {
      for (let y = top + 9; y < base; y += 10) s += L(x0, y, x1, y, shade(c, -0.16), 0.7);
      for (let x = x0 + 10; x < x1; x += 10) s += L(x, top, x, base, shade(c, -0.16), 0.7);
      for (let y = top + 1; y < base - 8; y += 20) for (let x = x0 + 1; x < x1 - 8; x += 20) s += Rn(x, y, 8, 8, shade(c, 0.18), { op: 0.6 });
    } else if (p.siding === "log") {
      for (let y = top + 4; y < base; y += 10) { s += Pth(`M${x0},${y} H${x1}`, "none", { sw: 1.1, stroke: shade(c, -0.28) }) + L(x0, y + 3, x1, y + 3, shade(c, 0.2), 1.6); s += C(x0 + 1, y - 4, 4.3, shade(c, -0.08), { sw: 0.7, stroke: shade(c, -0.35) }) + C(x0 + 1, y - 4, 1.8, "none", { sw: 0.5, stroke: shade(c, -0.35) }); }
    } else for (let y = t0 + 7; y < H - 18; y += 9) s += L(6, y, W - 8, y, shade(c, -0.13), 0.45); // しっくい（もとの 絵）
    return s + (p.siding === "brick" ? brick(4, H - 21, W - 10, 20, "#9C6E5C", "#C9A98E") : brick(4, H - 21, W - 10, 20));
  }

  // ---- やね（かたち × ペンキ）とまえの まど（ドーマー）----
  function slope(x, y, w, h, c, tile) {
    let s = Pth(`M${x + 18},${y} H${x + w - 18} L${x + w + 4},${y + h} H${x - 4}Z`, c, { sw: 1.3 });
    for (let i = 1; i < Math.ceil(w / 13); i++) { const t = i / Math.ceil(w / 13); s += L(x + 18 + t * (w - 36), y + 1, x - 4 + t * (w + 8), y + h - 2, shade(c, -0.22), 0.7) + L(x + 19 + t * (w - 36), y + 1, x - 3 + t * (w + 8), y + h - 2, shade(c, 0.24), 0.5); }
    if (tile) for (let yy = 8; yy < h; yy += 8) s += L(x + 18 - 22 * yy / h, y + yy, x + w - 18 + 22 * yy / h, y + yy, shade(c, -0.2), 0.8);
    return s + R(x - 5, y + h, w + 10, 4, shade(c, -0.34), { sw: 0.9 }) + Rn(x, y + h + 4, w, 4, "#332B20", { op: 0.16 });
  }
  // ドーマーの まど（まどの かたちに あわせる）
  function dormerPane(p, x, y, w, h, n, trim) {
    if (p.window === "round") return C(x + w / 2, y + h / 2, h / 2, glass(n), { sw: 1.2, stroke: trim }) + L(x + w / 2, y + 1, x + w / 2, y + h - 1, cream, 1) + L(x + w / 2 - h / 2, y + h / 2, x + w / 2 + h / 2, y + h / 2, cream, 0.8);
    if (p.window === "arch") return Pth(`M${x},${y + h} V${y + h * 0.45} A${w / 2},${h * 0.45} 0 0 1 ${x + w},${y + h * 0.45} V${y + h}Z`, glass(n), { sw: 0.9, stroke: ink }) + L(x + w / 2, y + 2, x + w / 2, y + h, cream, 1.1);
    if (p.window === "lattice") { let s = R(x, y, w, h, glass(n), { sw: 0.8, stroke: ink }); for (let k = 1; k < 3; k++) s += L(x + (w * k) / 3, y, x + (w * k) / 3, y + h, trim, 1); return s + L(x, y + h / 2, x + w, y + h / 2, trim, 1); }
    return pane(x, y, w, h, n);
  }
  function roof(p, c, n, trim, wallC) {
    const dormer = (top, half, tall, edge = ink) => Pth(`M${D - half},35 V${top + tall} L${D},${top} L${D + half},${top + tall} V35Z`, wallC, { sw: 1 }) + Pth(`M${D - half - 4},${top + tall + 2} L${D},${top - 6} L${D + half + 4},${top + tall + 2}`, "none", { sw: 3.5, stroke: edge });
    if (p.roof === "steep") {
      let s = Pth(`M22,-36 H${W - 22} L${W + 4},32 H-4Z`, c, { sw: 1.3 });
      for (let i = 1; i < 14; i++) { const t = i / 14; s += L(22 + t * (W - 44), -35, -4 + t * (W + 8), 30, shade(c, -0.2), 0.7); }
      for (let yy = -28; yy < 32; yy += 9) { const k = (yy + 36) / 68; s += L(22 - 26 * k, yy, W - 22 + 26 * k, yy, shade(c, 0.2), 0.5); }
      s += R(-5, 32, W + 10, 4, shade(c, -0.34), { sw: 0.9 }) + Rn(0, 36, W, 4, "#332B20", { op: 0.16 });
      return s + dormer(-30, 26, 26, shade(c, -0.45)) + dormerPane(p, D - 13, -2, 26, 26, n, trim);
    }
    if (p.roof === "round") {
      let s = Pth(`M-4,33 Q-4,-24 ${W / 2},-24 Q${W + 4},-24 ${W + 4},33Z`, c, { sw: 1.3 });
      for (let x = 12; x < W; x += 15) { const k = Math.abs(x - W / 2) / (W / 2), top = -24 + 57 * k * k * 0.85; s += L(x, top + 2, x, 31, shade(c, 0.28), 0.8) + L(x + 1.5, top + 3, x + 1.5, 31, shade(c, -0.2), 0.6); }
      s += R(-5, 32, W + 10, 4, shade(c, -0.34), { sw: 0.9 }) + Rn(0, 36, W, 4, "#332B20", { op: 0.16 });
      return s + C(D, 6, 16, wallC, { sw: 1 }) + C(D, 6, 16, "none", { sw: 3, stroke: shade(c, -0.45) }) + dormerPane({ window: "round" }, D - 12, -6, 24, 24, n, trim);
    }
    if (p.roof === "flat") {
      let s = R(-2, 18, W + 4, 15, c, { sw: 1.2 }) + L(-2, 22, W + 2, 22, shade(c, 0.3), 1.4) + R(8, -20, W * 0.6, 38, wallC, { sw: 1 }) + R(5, -25, W * 0.6 + 6, 6, shade(c, -0.15), { sw: 0.9 });
      for (let x = 16; x < W * 0.6 - 10; x += 26) s += dormerPane(p, x, -12, 20, 20, n, trim);
      s += R(W - 70, 3, 56, 14, shade(c, -0.25), { sw: 0.7 }); for (let x = W - 66; x < W - 16; x += 10) s += L(x, 5, x, 15, shade(c, 0.35), 0.6);
      return s + Rn(0, 33, W, 4, "#332B20", { op: 0.16 });
    }
    return slope(0, -13, W, 45, c, p.roof === "tile") + dormer(-23, 33, 26) + dormerPane(p, D - 19, 3, 38, 25, n, trim);
  }

  // ---- えんとつ・やねの かざり（やねの うえ）----
  function chimney(p, roofC) {
    const x = W - 52, top = p.roof === "steep" ? -44 : p.roof === "round" ? -32 : p.roof === "flat" ? -16 : -34, bot = p.roof === "flat" ? 18 : 8;
    return chimneyAt(p, x, top, bot);
  }
  // x: ひだりの はし・top: いちばん うえ・bot: やねに かくれる した（きのこの かさにも つかう）
  function chimneyAt(p, x, top, bot) {
    if (p.chimney === "brick") return brick(x, top + 4, 16, bot - top - 4, "#B5765E", "#E2C3A8") + R(x - 3, top, 22, 5, "#93604D", { sw: 0.8 });
    if (p.chimney === "stone") { let s = R(x - 1, top + 4, 18, bot - top - 4, "#B9B4A8", { sw: 0.8 }); for (let y = top + 8; y < bot; y += 7) for (let i = 0; i < 2; i++) s += E(x + 4 + i * 8 + ((y / 7) % 2) * 3, y, 3.6, 2.4, i % 2 ? "#CFCABF" : "#A9A395", { sw: 0.4, stroke: "#7D776B" }); return s + R(x - 4, top, 24, 5, "#8E887C", { sw: 0.8 }); }
    if (p.chimney === "tin") return R(x + 3, top + 6, 9, bot - top - 6, "#C8CDD2", { sw: 0.8 }) + L(x + 5, top + 8, x + 5, bot - 2, "#EEF1F4", 1.2) + Pth(`M${x - 2},${top + 6} l4,-6 h13 l4,6Z`, "#A9B0B6", { sw: 0.8 }) + R(x + 1, top + 14, 13, 3, "#9EA5AB", { sw: 0.5 });
    return "";
  }
  function rooftop(p, n) {
    const ridge = p.roof === "steep" ? -36 : p.roof === "round" ? -24 : p.roof === "flat" ? -25 : -13;
    if (p.top === "vane") {
      const x = 38;
      return L(x, ridge + 2, x, ridge - 22, INKC, 1.2) + L(x - 9, ridge - 12, x + 9, ridge - 12, INKC, 0.8) + T(x - 12, ridge - 9.5, "W", { size: 4, fill: INKC }) + T(x + 12, ridge - 9.5, "E", { size: 4, fill: INKC }) +
        Pth(`M${x - 8},${ridge - 22} q4,-8 10,-6 l3,-4 l2,5 q4,1 1,5 h-12Z`, "#C9A24E", { sw: 0.8 }) + C(x + 4, ridge - 27, 0.8, INKC, { sw: 0 }) + Pth(`M${x - 8},${ridge - 22} l-4,-3 l1,4Z`, "#C9A24E", { sw: 0.6 });
    }
    if (p.top === "solar") {
      if (p.roof === "flat") { let s = ""; for (let i = 0; i < 3; i++) s += Pth(`M${W - 66 + i * 18},2 l14,0 l-3,-12 h-14Z`, "#3E5C82", { sw: 0.8 }) + L(W - 63 + i * 18, -4, W - 52 + i * 18, -4, "#8FB2D6", 0.5); return s; }
      let s = ""; // ひだりの やねの めん（まえの まどと えんとつを よける）
      for (let i = 0; i < 3; i++) { const x0 = 14 + i * 21, y0 = ridge + 12, y1 = ridge + 32; s += Pth(`M${x0},${y0} h18 l3,${y1 - y0} h-19Z`, "#3E5C82", { sw: 0.8 }) + L(x0 + 1, (y0 + y1) / 2, x0 + 20, (y0 + y1) / 2, "#8FB2D6", 0.5) + L(x0 + 9, y0, x0 + 10.5, y1, "#8FB2D6", 0.5) + Pth(`M${x0 + 3},${y0 + 2} l5,0 l-2,6 h-4Z`, "#FFFFFF", { sw: 0, op: 0.35 }); }
      return s;
    }
    if (p.top === "skylight") {
      if (p.roof === "flat") return R(W - 60, -2, 24, 8, glass(n), { sw: 0.8, stroke: ink });
      const x0 = 26, y0 = ridge + 9;
      return Pth(`M${x0},${y0} h26 l2,15 h-30Z`, "#F3EAD9", { sw: 0.9 }) + Pth(`M${x0 + 3},${y0 + 2} h20 l1.5,11 h-23Z`, glass(n), { sw: 0.6, stroke: ink }) + L(x0 + 13, y0 + 2, x0 + 13.5, y0 + 13, cream, 0.8);
    }
    return "";
  }

  // ---- まど（ひだり おおきい・みぎ ちいさい）----
  // y: まどの うえ・slots: [ひだり, はば]（いつもは 1かいの 2つ）
  function windows(p, n, trim, wallC, y = 49, slots = [[17, D - 44], [D + 29, W - D - 46]]) {
    let s = "";
    for (const [x, ww] of slots) {
      if (p.window === "round") {
        const k = ww > 40 ? 2 : 1;
        for (let i = 0; i < k; i++) { const cx = x + (ww / k) * (i + 0.5); s += C(cx, y + 17, 15, trim, { sw: 1 }) + C(cx, y + 17, 11.5, glass(n), { sw: 0.8, stroke: ink }) + Pth(`M${cx - 7},${y + 22} l9,-12 h3 l-9,12Z`, shine(n), { sw: 0, op: 0.7 }) + L(cx, y + 6, cx, y + 28, cream, 1) + L(cx - 11, y + 17, cx + 11, y + 17, cream, 0.8); }
        continue;
      }
      if (p.window === "arch") {
        s += Pth(`M${x - 3},${y + 38} V${y + 10} A${ww / 2 + 3},${12} 0 0 1 ${x + ww + 3},${y + 10} V${y + 38}Z`, trim, { sw: 0.9 }) + Pth(`M${x},${y + 35} V${y + 11} A${ww / 2},${10} 0 0 1 ${x + ww},${y + 11} V${y + 35}Z`, glass(n), { sw: 0.8, stroke: ink });
        s += L(x + ww / 2, y + 2, x + ww / 2, y + 35, cream, 1.1) + L(x, y + 22, x + ww, y + 22, cream, 0.8) + Pth(`M${x + 3},${y + 32} L${x + ww * 0.5},${y + 6} h${ww * 0.18} L${x + ww * 0.2},${y + 32}Z`, shine(n), { sw: 0, op: 0.6 }) + R(x - 4, y + 38, ww + 8, 4, shade(trim, -0.2), { sw: 0.6 });
        continue;
      }
      if (p.window === "bay" && ww > 40) {
        s += Pth(`M${x - 6},${y + 42} V${y - 2} H${x + ww + 6} V${y + 42}Z`, shade(wallC, -0.06), { sw: 1 }) + Pth(`M${x - 9},${y - 1} l5,-9 H${x + ww + 4} l5,9Z`, shade(trim, -0.15), { sw: 0.9 });
        const third = ww / 3; for (let i = 0; i < 3; i++) s += pane(x + i * third + 1, y + 2, third - 2, 30, n);
        s += R(x - 7, y + 33, ww + 14, 9, "#C59A76", { sw: 0.8 }); for (let i = 6; i < ww; i += 9) s += flower(x + i, y + 29, ["#E59AAE", "#F2CF6A", "#B6A1D6"][(i / 9) % 3 | 0]);
        continue;
      }
      if (p.window === "lattice") {
        s += R(x - 2, y - 2, ww + 4, 39, trim, { sw: 0.9 }) + R(x + 1, y + 1, ww - 2, 33, glass(n), { sw: 0.6, stroke: ink });
        const cols = ww > 40 ? 4 : 2; for (let i = 1; i < cols; i++) s += L(x + 1 + ((ww - 2) * i) / cols, y + 1, x + 1 + ((ww - 2) * i) / cols, y + 34, trim, 1.4);
        s += L(x + 1, y + 12, x + ww - 1, y + 12, trim, 1.4) + L(x + 1, y + 23, x + ww - 1, y + 23, trim, 1.4) + R(x - 3, y + 37, ww + 6, 4, shade(trim, -0.2), { sw: 0.6 });
        continue;
      }
      // しかく（もとの 絵）: まど・まどだい・よろいど
      s += pane(x, y, ww, 35, n) + R(x - 2, y + 35, ww + 4, 4, "#A97850", { sw: 0.6 }); // まどだいは 木の いろ（もとの 絵）
      for (const side of [x - 5, x + ww + 1]) s += R(side, y, 4, 34, trim, { sw: 0.4 });
      s += Rn(x + 3, y + 2, 5, 30, "#EBDBBA", { op: 0.65 });
    }
    return s;
  }

  // ---- ドア（かたち × ペンキ）----
  function door(p, n, c) {
    const x = D, b = H - 2, mat = R(x - 23, b, 46, 3, "#CCC2AA", { sw: 0.6 }), knob = (kx) => C(kx, b - 27, 1.8, "#E2B85C", { sw: 0.5 });
    if (p.door === "plank") {
      let s = R(x - 18, b - 58, 36, 58, shade(c, -0.15), { sw: 0.9 }) + Pth(`M${x - 15},${b} V${b - 44} Q${x - 15},${b - 55} ${x},${b - 55} Q${x + 15},${b - 55} ${x + 15},${b - 44} V${b}Z`, c, { sw: 0.9 });
      for (let k = -9; k <= 9; k += 6) s += L(x + k, b - 52, x + k, b - 1, shade(c, -0.25), 0.8);
      return s + R(x - 13, b - 40, 26, 3, shade(c, -0.3), { sw: 0 }) + R(x - 13, b - 16, 26, 3, shade(c, -0.3), { sw: 0 }) + C(x, b - 45, 4, glass(n), { sw: 0.7, stroke: ink }) + knob(x + 10) + mat;
    }
    if (p.door === "arch") {
      return Pth(`M${x - 20},${b} V${b - 40} A20,20 0 0 1 ${x + 20},${b - 40} V${b}Z`, shade(c, -0.15), { sw: 0.9 }) + Pth(`M${x - 16},${b} V${b - 40} A16,16 0 0 1 ${x + 16},${b - 40} V${b}Z`, c, { sw: 0.8 }) +
        Pth(`M${x - 10},${b - 38} A10,10 0 0 1 ${x + 10},${b - 38} V${b - 30} H${x - 10}Z`, glass(n), { sw: 0.7, stroke: ink }) + L(x, b - 48, x, b - 30, cream, 0.9) + R(x - 10, b - 24, 20, 16, shade(c, -0.12), { sw: 0.6 }) + knob(x + 11) + mat;
    }
    if (p.door === "double") {
      let s = R(x - 26, b - 60, 52, 60, shade(c, -0.15), { sw: 0.9 });
      for (const k of [-1, 1]) { const x0 = k < 0 ? x - 23 : x + 1; s += R(x0, b - 57, 22, 56, c, { sw: 0.8 }) + pane(x0 + 4, b - 53, 14, 30, n) + R(x0 + 4, b - 18, 14, 13, shade(c, -0.12), { sw: 0.5 }); }
      return s + knob(x - 4) + knob(x + 4) + Pth(`M${x - 30},${b - 60} h60 l-4,-6 h-52Z`, shade(c, -0.25), { sw: 0.8 }) + R(x - 30, b, 60, 3, "#CCC2AA", { sw: 0.6 });
    }
    if (p.door === "heart") {
      let s = R(x - 19, b - 58, 38, 58, shade(c, -0.15), { sw: 0.9 }) + R(x - 16, b - 55, 32, 54, c, { sw: 0.8 });
      s += Pth(`M${x},${b - 30} C${x - 13},${b - 38} ${x - 9},${b - 50} ${x},${b - 43} C${x + 9},${b - 50} ${x + 13},${b - 38} ${x},${b - 30}Z`, n ? "#F6C4C4" : "#F2A7B4", { sw: 0.8 }) + Pth(`M${x - 5},${b - 42} q2,-3 4,-1`, "none", { sw: 0.8, stroke: "#FFFFFF" });
      return s + R(x - 11, b - 22, 22, 14, shade(c, -0.12), { sw: 0.5 }) + knob(x + 11) + mat;
    }
    // ガラスの ドア（もとの 絵）
    return R(x - 19, b - 58, 38, 58, c, { sw: 0.9 }) + pane(x - 16, b - 55, 32, 51, n) + L(x, b - 54, x, b - 4, ink, 1.2) + L(x + 11, b - 30, x + 11, b - 22, copper, 1.4) + R(x - 23, b - 2, 46, 3, "#CCC2AA", { sw: 0.6 });
  }

  // ---- あかり・ポスト・まえの かざり ----
  function lamp(p, n) {
    const x = D - 25, y = H - 60;
    if (p.lamp === "lantern") return L(x + 4, y - 2, x - 3, y - 2, INKC, 1.2) + L(x - 3, y - 2, x - 3, y + 3, INKC, 1) + Pth(`M${x - 8},${y + 4} h10 l-2,4 h-6Z`, "#5E6B66", { sw: 0.7 }) + R(x - 7, y + 8, 8, 10, n ? "#FFD98A" : "#EFE3BC", { sw: 0.7 }) + (n ? C(x - 3, y + 13, 9, "#FFE6A6", { sw: 0, op: 0.35 }) : "") + Pth(`M${x - 8},${y + 18} h10 l-1,3 h-8Z`, "#5E6B66", { sw: 0.7 });
    if (p.lamp === "string") {
      let s = Pth(`M2,37 Q${W / 4},45 ${W / 2},37 Q${(W * 3) / 4},45 ${W - 4},37`, "none", { sw: 0.8, stroke: "#4E5A55" });
      const cols = ["#F6B6C4", "#F7DC7A", "#9FD3E6", "#B9E3A6", "#D9C2F0"];
      for (let i = 0; i < 13; i++) { const t = (i + 0.5) / 13, xx = 2 + t * (W - 6), yy = 37 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * -4 + 4; s += L(xx, yy - 1, xx, yy + 1, "#4E5A55", 0.6) + E(xx, yy + 3.2, 1.8, 2.4, n ? "#FFF2B8" : cols[i % 5], { sw: 0.4, stroke: "#4E5A55" }) + (n ? C(xx, yy + 3, 4.5, cols[i % 5], { sw: 0, op: 0.45 }) : ""); }
      return s;
    }
    if (p.lamp === "none") return "";
    return L(x, y, x, y + 9, ink, 1) + Pth(`M${x - 4},${y + 10} l2,-5 h4 l2,5Z`, "#648975", { sw: 0.7 }) + R(x - 3, y + 10, 6, 8, n ? "#F7D589" : "#EDE0B3", { sw: 0.6 }) + L(x - 4, y + 18, x + 4, y + 18, ink, 1) + (n ? C(x, y + 14, 8, "#FFE6A6", { sw: 0, op: 0.3 }) : "");
  }
  // x: ひだりの はし（いつもは ドアの みぎ）・pole: かべに つける ポストに ぼうを つける（かべの ない ところ）
  function post(p, x = D + 24, pole = false) {
    const y = H - 31;
    if (p.post === "red") return R(x + 5, y + 12, 3, 17, "#6B4A3A", { sw: 0.6 }) + Pth(`M${x - 1},${y + 13} V${y + 1} Q${x + 6.5},${y - 7} ${x + 14},${y + 1} V${y + 13}Z`, "#D9574A", { sw: 0.8 }) + R(x + 2, y + 4, 9, 2.4, "#3A2B25", { sw: 0 }) + T(x + 6.5, y + 11.5, "〒", { size: 5, fill: "#FFFFFF" });
    if (p.post === "bird") return R(x + 5, y + 10, 3, 19, "#7A5A42", { sw: 0.6 }) + Pth(`M${x - 2},${y + 1} L${x + 6.5},${y - 7} L${x + 15},${y + 1}Z`, "#C27C5A", { sw: 0.8 }) + R(x, y + 1, 13, 10, "#F3D7A0", { sw: 0.8 }) + C(x + 6.5, y + 6, 2.2, "#4A3A30", { sw: 0 }) + Pth(`M${x + 13},${y + 4} q5,-2 6,2 q-2,1 -3,0Z`, "#9FC7E0", { sw: 0.5 }) + C(x + 17.5, y + 3.6, 0.5, INKC, { sw: 0 });
    if (p.post === "wood") return R(x + 5, y + 10, 3, 19, "#7A5A42", { sw: 0.6 }) + R(x - 1, y, 15, 11, "#B98A5E", { sw: 0.8 }) + L(x - 1, y + 4, x + 14, y + 4, "#8E6640", 0.6) + R(x + 2, y + 6, 9, 2, "#5A4232", { sw: 0 }) + Pth(`M${x - 2},${y} h17 l-2,-3 h-13Z`, "#8E6640", { sw: 0.6 });
    return (pole ? R(x + 5, y + 8, 3, 21, "#6B4A3A", { sw: 0.6 }) : "") + R(x, y, 13, 9, "#8C9E85", { sw: 0.6 }) + L(x + 2, y + 3, x + 11, y + 3, cream, 0.6) + T(x + 6, y + 12, "〒", { size: 5, fill: ink });
  }
  function yard(p) {
    const y = H - 12;
    if (p.yard === "tree") return R(18, y - 2, 22, 12, "#C08A62", { sw: 0.8 }) + R(16, y - 4, 26, 4, "#A9744E", { sw: 0.6 }) + L(29, y - 4, 29, y - 26, "#7A5A3E", 2.2) + C(29, y - 36, 15, "#7FAF6A", { sw: 0.9 }) + C(21, y - 30, 8, "#8DBD76", { sw: 0.7 }) + C(37, y - 31, 8, "#6E9E5C", { sw: 0.7 }) + C(25, y - 42, 2, "#E58B8B", { sw: 0 }) + C(35, y - 38, 2, "#E58B8B", { sw: 0 });
    if (p.yard === "bench") { let s = R(12, y - 14, 44, 5, "#B98A5E", { sw: 0.8 }) + R(12, y - 22, 44, 4, "#C99A6B", { sw: 0.7 }) + R(12, y - 28, 44, 4, "#C99A6B", { sw: 0.7 }); for (const x of [15, 51]) s += R(x, y - 9, 3, 11, "#6F5641", { sw: 0.5 }) + R(x, y - 30, 3, 16, "#6F5641", { sw: 0.5 }); return s + C(46, y - 18, 3.2, "#F6D7A2", { sw: 0.6 }); }
    if (p.yard === "bike") return C(20, y - 2, 8, "none", { sw: 1.6, stroke: INKC }) + C(48, y - 2, 8, "none", { sw: 1.6, stroke: INKC }) + Pth(`M20,${y - 2} L30,${y - 16} L43,${y - 16} L48,${y - 2} M30,${y - 16} L34,${y - 2} L20,${y - 2} M43,${y - 16} L45,${y - 20} h4 M28,${y - 18} h6`, "none", { sw: 1.6, stroke: "#E46F62" }) + R(28, y - 20, 7, 2.5, INKC, { sw: 0 }) + R(39, y - 12, 9, 6, "#F2D16B", { sw: 0.6 });
    if (p.yard === "doghouse") return R(14, y - 22, 34, 24, "#D9A066", { sw: 0.9 }) + Pth(`M10,${y - 21} L31,${y - 38} L52,${y - 21}Z`, "#C2574E", { sw: 0.9 }) + Pth(`M24,${y + 2} V${y - 10} Q31,${y - 18} 38,${y - 10} V${y + 2}Z`, "#4A3A30", { sw: 0.7 }) + R(26, y - 30, 10, 5, "#FFF6E0", { sw: 0.5 }) + T(31, y - 26.2, "ぽち", { size: 3.6, fill: INKC }) + E(56, y + 1, 5, 2, "#C9C2B3", { sw: 0.5 });
    if (p.yard === "pumpkin") return E(24, y - 4, 10, 8, "#E8963E", { sw: 0.8 }) + L(24, y - 11, 24, y + 3, "#C9762A", 0.7) + L(19, y - 10, 19, y + 2, "#C9762A", 0.6) + L(29, y - 10, 29, y + 2, "#C9762A", 0.6) + R(23, y - 15, 2.4, 4, "#6E8A4E", { sw: 0.4 }) + E(44, y - 1, 7, 5.5, "#F0B04E", { sw: 0.7 }) + L(44, y - 6, 44, y + 4, "#D08A33", 0.6) + R(43, y - 9, 2, 3, "#6E8A4E", { sw: 0.3 }) + Pth(`M8,${y + 2} q4,-8 8,0 M50,${y + 3} q3,-6 6,0`, "#B9C77A", { sw: 0.5 });
    return planter(14, y, 40); // はなの プランター（もとの 絵）
  }

  // ---- いつもの おうち ----
  // p: { form, roof, siding, window, door, chimney, top, lamp, post, yard, paint: { roof, wall, door, trim } }（いろは #rrggbb）。n: よる
  const unit = () => { let s = R(W - 35, H - 49, 23, 22, "#D1D5C2", { sw: 0.6 }) + C(W - 24, H - 38, 7, "#BDC5B5", { sw: 0.5 }); for (let y = H - 44; y < H - 31; y += 3) s += L(W - 30, y, W - 18, y, "#8F9E90", 0.5); return s; }; // そとの きかい（もとの 絵の まま）
  function basicBody(p, n) {
    const c = p.paint;
    let s = "";
    s += wall(p, c.wall);
    s += chimney(p, c.roof);
    s += roof(p, c.roof, n, c.trim, c.wall);
    s += rooftop(p, n);
    s += windows(p, n, c.trim, c.wall);
    s += door(p, n, c.door) + drain() + lamp(p, n);
    s += yard(p);
    s += unit();
    s += post(p);
    return s;
  }
  // いつもの おうちの いちばん うえ（やね・まえの まど・えんとつ・かざみどり で きまる）
  function peakBasic(p) {
    const ridge = p.roof === "steep" ? -36 : p.roof === "round" ? -24 : p.roof === "flat" ? -25 : -13;
    let y = p.roof === "steep" ? -36 : p.roof === "round" ? -24 : p.roof === "flat" ? -25 : -29;
    if (p.chimney && p.chimney !== "none") y = Math.min(y, p.roof === "steep" ? -44 : p.roof === "round" ? -32 : p.roof === "flat" ? -16 : -34);
    if (p.top === "vane") y = Math.min(y, ridge - 32);
    return y;
  }

  // ---- たてものの かたち（UI-91）で つかう 小物 ----
  // かべの そざいの もよう（x0〜x1・y0〜y1 の なか。いつもの かべと おなじ かきかた）
  function texture(sid, x0, y0, x1, y1, c) {
    let s = "";
    if (sid === "brick") for (let j = 0, y = y0 + 3; y < y1; j++, y += 7) { s += L(x0, y, x1, y, shade(c, -0.22), 0.7); for (let x = x0 + (j % 2 ? 9 : 2); x < x1; x += 18) s += L(x, y, x, Math.min(y1, y + 7), shade(c, -0.22), 0.6); }
    else if (sid === "board") for (let x = x0 + 9; x < x1; x += 10) s += L(x, y0, x, y1, shade(c, -0.2), 0.8) + L(x + 1.2, y0, x + 1.2, y1, shade(c, 0.22), 0.5);
    else if (sid === "tile") { for (let y = y0 + 9; y < y1; y += 10) s += L(x0, y, x1, y, shade(c, -0.16), 0.7); for (let x = x0 + 10; x < x1; x += 10) s += L(x, y0, x, y1, shade(c, -0.16), 0.7); }
    else if (sid === "log") for (let y = y0 + 5; y < y1 - 2; y += 10) s += L(x0, y, x1, y, shade(c, -0.28), 1.1) + L(x0, y + 3, x1, y + 3, shade(c, 0.2), 1.6);
    else for (let y = y0 + 6; y < y1; y += 9) s += L(x0, y, x1, y, shade(c, -0.13), 0.45);
    return s;
  }
  // ちいさな まど（cx・cy が まんなか。えらんだ まどの かたちに あわせる）
  function miniWin(p, cx, cy, w, h, n, trim) {
    const x = cx - w / 2, y = cy - h / 2;
    if (p.window === "round") {
      const r = Math.min(w, h) / 2;
      return C(cx, cy, r + 2.6, trim, { sw: 1 }) + C(cx, cy, r, glass(n), { sw: 0.8, stroke: ink }) + Pth(`M${f(cx - r * 0.55)},${f(cy + r * 0.35)} l${f(r * 0.65)},${f(-r * 0.85)} h${f(r * 0.22)} l${f(-r * 0.65)},${f(r * 0.85)}Z`, shine(n), { sw: 0, op: 0.7 }) + L(cx, cy - r, cx, cy + r, cream, 0.9) + L(cx - r, cy, cx + r, cy, cream, 0.7);
    }
    if (p.window === "arch") {
      const a = w / 2;
      return Pth(`M${f(x - 2.5)},${f(y + h + 2)} V${f(y + a)} A${f(a + 2.5)},${f(a + 2.5)} 0 0 1 ${f(x + w + 2.5)},${f(y + a)} V${f(y + h + 2)}Z`, trim, { sw: 0.9 }) + Pth(`M${f(x)},${f(y + h)} V${f(y + a)} A${f(a)},${f(a)} 0 0 1 ${f(x + w)},${f(y + a)} V${f(y + h)}Z`, glass(n), { sw: 0.8, stroke: ink }) +
        Pth(`M${f(x + 2)},${f(y + h - 2)} L${f(x + w * 0.55)},${f(y + a * 0.6)} h${f(w * 0.18)} L${f(x + w * 0.2)},${f(y + h - 2)}Z`, shine(n), { sw: 0, op: 0.6 }) + L(cx, y + 1, cx, y + h, cream, 1) + L(x, y + h * 0.62, x + w, y + h * 0.62, cream, 0.7);
    }
    if (p.window === "lattice") {
      let s = R(x - 2, y - 2, w + 4, h + 4, trim, { sw: 0.9 }) + R(x + 0.5, y + 0.5, w - 1, h - 1, glass(n), { sw: 0.6, stroke: ink });
      for (let k = 1; k < 3; k++) s += L(x + (w * k) / 3, y + 0.5, x + (w * k) / 3, y + h - 0.5, trim, 1.1);
      return s + L(x + 0.5, y + h / 2, x + w - 0.5, y + h / 2, trim, 1.1);
    }
    return R(x - 2, y - 2, w + 4, h + 4, trim, { sw: 0.9 }) + pane(x, y, w, h, n) + R(x - 3, y + h + 2, w + 6, 3, shade(trim, -0.2), { sw: 0.5 }); // しかく・でまど
  }
  // ひもの ライト（x0〜x1 に 2つ たるむ。いつもの おうちと 3かいだては lamp() の まま）
  function garland(n, x0, x1, y) {
    const w = x1 - x0, cols = ["#F6B6C4", "#F7DC7A", "#9FD3E6", "#B9E3A6", "#D9C2F0"], k = Math.max(5, Math.round(w / 15));
    let s = Pth(`M${f(x0)},${f(y)} Q${f(x0 + w / 4)},${f(y + 8)} ${f(x0 + w / 2)},${f(y)} Q${f(x0 + (w * 3) / 4)},${f(y + 8)} ${f(x1)},${f(y)}`, "none", { sw: 0.8, stroke: "#4E5A55" });
    for (let i = 0; i < k; i++) { const t = (i + 0.5) / k, u = (t * 2) % 1, xx = x0 + t * w, yy = y + 16 * u * (1 - u); s += L(xx, yy, xx, yy + 1.4, "#4E5A55", 0.6) + E(xx, yy + 3.6, 1.8, 2.4, n ? "#FFF2B8" : cols[i % 5], { sw: 0.4, stroke: "#4E5A55" }) + (n ? C(xx, yy + 3.4, 4.5, cols[i % 5], { sw: 0, op: 0.45 }) : ""); }
    return s;
  }
  const lampOf = (p, n, g) => (p.lamp === "string" ? garland(n, ...g) : lamp(p, n));
  const star = (x, y, r, fill) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + f(x + Math.cos(a) * rr) + "," + f(y + Math.sin(a) * rr); } return Pth(d + "Z", fill, { sw: 0.7 }); };
  const shadowE = (cx, rx) => E(cx, H + 1, rx, 6, "#312619", { sw: 0, op: 0.13 });

  // ---- 3かいだて: いつもの おうちに 2かい（52）と 3かい（60）を たす ----
  const LIFT3 = 112;
  function balcony(trim, x0, x1, y) {
    let s = R(x0 - 2, y, x1 - x0 + 4, 4, shade(trim, -0.18), { sw: 0.8 }) + Rn(x0, y + 4, x1 - x0, 3, "#332B20", { op: 0.14 }) + R(x0, y - 13, x1 - x0, 2.5, trim, { sw: 0.7 });
    for (let x = x0 + 3; x < x1 - 1; x += 6) s += L(x, y - 10.5, x, y, shade(trim, -0.1), 1.1);
    return s + R(x0 + 4, y - 7, 8, 7, "#C59A76", { sw: 0.6 }) + C(x0 + 8, y - 10, 4.5, "#7FAF6A", { sw: 0.6 }) + R(x1 - 12, y - 7, 8, 7, "#C59A76", { sw: 0.6 }) + C(x1 - 8, y - 10, 4.5, "#8DBD76", { sw: 0.6 }) + C(x1 - 9, y - 12, 1.4, "#E59AAE", { sw: 0 });
  }
  function three(p, n) {
    const c = p.paint, t0 = 28 - LIFT3;
    let s = wall(p, c.wall, t0);
    for (const y of [28, -24]) s += R(4, y - 2, W - 10, 4, shade(c.wall, -0.14), { sw: 0.7 }) + Pth(`M${W - 6},${y - 2} l6,-6 v4 l-6,6Z`, shade(c.wall, -0.32), { sw: 0.5 }); // かいの さかいの おび
    s += windows(p, n, c.trim, c.wall, -68, [[40, 38], [122, 38]]); // 3かい
    s += windows(p, n, c.trim, c.wall, -20, [[22, 40], [93, 38], [148, 30]]); // 2かい
    s += balcony(c.trim, 84, 140, 22);
    s += `<g transform="translate(0,${-LIFT3})">${chimney(p, c.roof)}${roof(p, c.roof, n, c.trim, c.wall)}${rooftop(p, n)}</g>`;
    s += windows(p, n, c.trim, c.wall); // 1かい
    s += door(p, n, c.door) + drain(t0 + 7) + lamp(p, n);
    return s + yard(p) + unit() + post(p);
  }

  // ---- おしろ: ひだりの おおきな とう・まんなかの もん・みぎの とう（やねの かたちで とうの やねが かわる）----
  const CAPK = { gable: 2, tile: 2, steep: 2.9, round: 1.7 };
  const capH = (style, hw, k = 1) => (CAPK[style] ?? 2) * hw * k;
  const pennant = (x, y, len) => L(x, y, x, y - len, INKC, 1.1) + Pth(`M${f(x)},${f(y - len)} l13,4 l-13,4Z`, "#E8706A", { sw: 0.8 });
  // とうの やね（cx: まんなか・hw: とうの はんぶんの はば・top: とうの うえ・k: たかさの わりあい・flag: はたの ぼうの ながさ）
  function cap(style, cx, hw, top, c, k = 1, flag = 0) {
    const x0 = cx - hw - 4, x1 = cx + hw + 4, h = capH(style, hw, k), ap = top - h;
    let s = "";
    if (style === "flat") {
      s += R(cx - hw - 3, top - 5, 2 * hw + 6, 6, shade(c, -0.12), { sw: 1 });
      const m = Math.max(3, Math.round((2 * hw + 6) / 11)), mw = (2 * hw + 6) / (2 * m - 1);
      for (let i = 0; i < m; i++) s += R(cx - hw - 3 + i * 2 * mw, top - 12, mw, 7.5, c, { sw: 1 });
      return s + (flag ? pennant(cx, top - 12, flag) : "");
    }
    if (style === "round") {
      s += Pth(`M${f(x0)},${f(top)} C${f(x0 - 2)},${f(top - h * 0.55)} ${f(cx - hw * 0.25)},${f(top - h * 0.62)} ${f(cx)},${f(ap)} C${f(cx + hw * 0.25)},${f(top - h * 0.62)} ${f(x1 + 2)},${f(top - h * 0.55)} ${f(x1)},${f(top)}Z`, c, { sw: 1.3 });
      s += Pth(`M${f(cx + hw * 0.25)},${f(top - h * 0.6)} C${f(x1 - 1)},${f(top - h * 0.5)} ${f(x1 + 1)},${f(top - h * 0.2)} ${f(x1 - 1)},${f(top - 1)} H${f(cx + hw * 0.45)}Z`, shade(c, -0.2), { sw: 0, op: 0.55 });
      s += Pth(`M${f(cx - hw * 0.6)},${f(top - 3)} C${f(cx - hw * 0.8)},${f(top - h * 0.45)} ${f(cx - hw * 0.35)},${f(top - h * 0.62)} ${f(cx - 2)},${f(ap + 4)}`, "none", { sw: 1.6, stroke: shade(c, 0.35), op: 0.7 });
      return s + R(x0 - 1, top - 1, x1 - x0 + 2, 4, shade(c, -0.3), { sw: 0.8 }) + L(cx, ap, cx, ap - 6, INKC, 1.1) + C(cx, ap - 8, 2.4, "#E8C35A", { sw: 0.7 });
    }
    const d = style === "steep" ? `M${f(x0)},${f(top)} Q${f(cx - hw * 0.3)},${f(top - h * 0.3)} ${f(cx)},${f(ap)} Q${f(cx + hw * 0.3)},${f(top - h * 0.3)} ${f(x1)},${f(top)}Z` : `M${f(x0)},${f(top)} L${f(cx)},${f(ap)} L${f(x1)},${f(top)}Z`;
    s += Pth(d, c, { sw: 1.3 }) + Pth(`M${f(cx)},${f(ap + 1)} L${f(x1 - 1)},${f(top - 0.5)} H${f(cx + hw * 0.35)}Z`, shade(c, -0.2), { sw: 0, op: 0.55 });
    if (style === "tile") for (let i = 1; i < 6; i++) { const t = i / 6, half = (hw + 4) * t; s += L(cx - half, ap + t * h, cx + half, ap + t * h, shade(c, -0.25), 0.7); }
    s += L(cx - 2, ap + 6, x0 + 7, top - 3, shade(c, 0.35), 1.4, { op: 0.6 });
    return s + R(x0 - 1, top - 1, x1 - x0 + 2, 4, shade(c, -0.3), { sw: 0.8 }) + (flag ? pennant(cx, ap, flag) : "");
  }
  // まるい とう（まえから 見た つつ。かべの そざいの もよう・したは いしの だい）
  function tower(p, cx, hw, top, c) {
    const x = cx - hw, w = 2 * hw;
    return R(x, top, w, H - 1 - top, c, { sw: 1.2 }) + texture(p.siding, x + 1, top + 1, x + w - 1, H - 22, c) + Rn(x + w * 0.68, top + 1, w * 0.32 - 1, H - 2 - top, shade(c, -0.16), { op: 0.55 }) + Rn(x + w * 0.12, top + 1, w * 0.12, H - 23 - top, "#FFFFFF", { op: 0.25 }) + brick(x, H - 21, w, 20, "#A9A395", "#CFCABF");
  }
  const CASTLE_L = [26, 21, -34], CASTLE_G = [112, 30, -6], CASTLE_R = [172, 16, 2];
  function castle(p, n) {
    const c = p.paint, wc = c.wall, st = p.roof;
    let s = Pth(`M${W - 2},16 l11,9 V${H + 7} H10 L2,${H - 3}Z`, "#312619", { sw: 0, op: 0.14 });
    // ひろま（うしろの かべ）と のこぎりの は
    s += R(44, 20, 112, H - 21, wc, { sw: 1.2 }) + texture(p.siding, 45, 21, 155, H - 22, wc) + brick(44, H - 21, 112, 20, "#A9A395", "#CFCABF");
    for (let x = 46; x < 152; x += 15) s += R(x, 9, 10, 12, wc, { sw: 1.1 }) + Rn(x + 1, 10, 8, 2.5, shade(wc, 0.25), { op: 0.6 });
    s += Rn(45, 21, 110, 4, "#332B20", { op: 0.12 }) + miniWin(p, 64, 58, 22, 30, n, c.trim) + R(147, 44, 4, 16, "#4A3A30", { sw: 0.6, rx: 2 });
    // とう 2つ
    s += tower(p, ...CASTLE_R, wc) + miniWin(p, 172, 30, 12, 18, n, c.trim) + miniWin(p, 172, 74, 14, 22, n, c.trim);
    s += tower(p, ...CASTLE_L, wc) + miniWin(p, 26, -6, 14, 20, n, c.trim) + miniWin(p, 26, 56, 16, 26, n, c.trim);
    // まんなかの もん（ドア）
    const gc = shade(wc, 0.06);
    s += R(82, -6, 60, H - 1 + 6, gc, { sw: 1.2 }) + texture(p.siding, 83, -5, 141, H - 22, gc) + brick(82, H - 21, 60, 20, "#A9A395", "#CFCABF") + Pth(`M142,-6 l5,-4 V${H - 5} l-5,4Z`, shade(wc, -0.2), { sw: 0.8 });
    s += miniWin(p, 112, 28, 24, 28, n, c.trim) + C(112, 3, 7, c.trim, { sw: 0.9 }) + star(112, 3.4, 4.6, "#F4D35E");
    // やね（とうの かたち）
    s += cap(st, ...CASTLE_R, c.roof, 1, 12) + cap(st, ...CASTLE_L, c.roof, 1, 16) + cap(st, ...CASTLE_G, c.roof, 0.7, 0);
    s += door(p, n, c.door) + lampOf(p, n, [47, 153, 44]);
    return s + yard(p) + post(p);
  }
  const castleTop = (p) => { const [, hw, top] = CASTLE_L; return p.roof === "flat" ? top - 12 - 16 : p.roof === "round" ? top - capH("round", hw) - 10.4 : top - capH(p.roof, hw) - 16; };

  // ---- きのこ: おおきな かさ（やねの いろ・しろい てんてん）と じく（かべの いろ）----
  const MUSH_SPOTS = [[26, 10, 9], [56, -24, 10], [100, -38, 7], [148, -20, 10], [180, 12, 8], [66, 18, 6], [140, 20, 7], [176, -12, 5], [20, -12, 5]];
  function mushroom(p, n) {
    const c = p.paint, stem = c.wall, capC = c.roof;
    let s = shadowE(110, 80);
    s += Pth(`M38,${H - 1} C32,98 44,62 56,36 H162 C174,62 186,98 180,${H - 1}Z`, stem, { sw: 1.2 }) + Pth(`M152,40 C162,64 170,98 168,${H - 2} H179 C185,98 172,62 161,37Z`, shade(stem, -0.13), { sw: 0, op: 0.8 });
    for (const [x, k] of [[66, -3], [88, -2], [136, 2], [150, 3]]) s += Pth(`M${x},46 Q${x + k},86 ${x + k * 2},${H - 4}`, "none", { sw: 0.6, stroke: shade(stem, -0.12) });
    s += Pth(`M36,${H - 1} q6,-7 12,-1 q6,-8 12,0 M160,${H - 1} q6,-8 12,-1 q5,-6 10,1`, "#8DBD76", { sw: 0.7 }) + E(50, H - 2, 4, 2.4, "#C9C2B3", { sw: 0.5 }) + E(172, H - 2, 3.4, 2, "#C9C2B3", { sw: 0.5 });
    s += chimneyAt(p, 136, -62, -30); // かさに ささる
    s += E(100, 45, 86, 9, shade(stem, -0.28), { sw: 1 }); for (let x = 24; x < 180; x += 9) s += L(x, 42, 100 + (x - 100) * 0.8, 51, shade(stem, -0.45), 0.5); // かさの うら（ひだ）
    s += Pth(`M-4,36 C-4,-24 42,-54 100,-54 C158,-54 204,-24 204,36 Q196,46 180,41 Q164,48 148,42 Q132,49 116,43 Q100,50 84,43 Q68,49 52,42 Q36,48 20,41 Q4,46 -4,36Z`, capC, { sw: 1.4 });
    s += Pth(`M150,-46 C186,-28 202,-4 202,30 Q196,40 182,38 C188,8 176,-24 150,-46Z`, shade(capC, -0.15), { sw: 0, op: 0.6 }) + Pth(`M14,4 Q22,-32 76,-48`, "none", { sw: 5, stroke: "#FFFFFF", op: 0.3 });
    for (const [x, y, r] of MUSH_SPOTS) s += C(x, y, r, "#FFF8EE", { sw: 0.9 }) + C(x - r * 0.3, y - r * 0.3, r * 0.35, "#FFFFFF", { sw: 0, op: 0.8 });
    s += miniWin({ window: "round" }, 100, 8, 20, 20, n, c.trim); // やねうらの まど
    s += miniWin(p, 62, 74, 22, 28, n, c.trim) + miniWin(p, 156, 72, 18, 24, n, c.trim);
    s += door(p, n, c.door) + lampOf(p, n, [4, 196, 46]);
    return s + yard(p) + post(p);
  }

  // ---- ケーキ: 3だんの ケーキ（スポンジ＝かべの いろ・クリーム＝やねの いろ・いちごと ろうそく）----
  function cake(p, n) {
    const c = p.paint, sp = c.wall, fr = c.roof, cr = "#FFF8EE";
    const tier = (x0, x1, y0, y1, k) => {
      let t = R(x0, y0, x1 - x0, y1 - y0, sp, { sw: 1.2 }) + Pth(`M${x1},${y0} l6,-5 V${y1 - 5} l-6,5Z`, shade(sp, -0.18), { sw: 0.8 });
      t += Rn(x0 + 1, (y0 + y1) / 2 + 3, x1 - x0 - 2, 3, "#E8A0A8", { op: 0.6 }) + Rn(x0 + 1, (y0 + y1) / 2 + 7, x1 - x0 - 2, 1.5, "#FFFFFF", { op: 0.45 }); // ジャムと クリームの そう
      let d = `M${f(x0 - 2)},${f(y0 - 4)} H${f(x1 + 2)} V${f(y0 + 5)}`;
      for (let x = x1 - 2, i = 0; x - 8 > x0; x -= 12, i++) { const len = [10, 5, 14, 7, 11, 4][(i + k) % 6]; d += ` L${f(x)},${f(y0 + 5)} q-3,${len} -6,0`; }
      d += ` L${f(x0 - 2)},${f(y0 + 5)}Z`;
      return t + Pth(`M${f(x0 - 2)},${f(y0 - 4)} l6,-5 H${f(x1 + 8)} l-6,5Z`, shade(fr, 0.2), { sw: 1 }) + Pth(d, fr, { sw: 1 }) + Pth(`M${f(x1 + 2)},${f(y0 - 4)} l6,-5 v8 l-6,6Z`, shade(fr, -0.18), { sw: 0.8 });
    };
    const dollops = (x0, x1, y) => { let t = ""; for (let x = x0 + 5; x < x1 - 2; x += 10) t += C(x, y, 4.2, cr, { sw: 0.8 }) + C(x - 1.2, y - 1.4, 1.4, "#FFFFFF", { sw: 0 }); return t; };
    const berry = (x, y) => Pth(`M${f(x)},${f(y + 8)} C${f(x - 8)},${f(y + 2)} ${f(x - 7)},${f(y - 6)} ${f(x)},${f(y - 5)} C${f(x + 7)},${f(y - 6)} ${f(x + 8)},${f(y + 2)} ${f(x)},${f(y + 8)}Z`, "#E5545E", { sw: 0.9 }) + [[-3, -1], [2, 0], [-1, 3], [3, 4], [0, -3]].map(([a, b]) => E(x + a, y + b, 0.5, 0.8, "#FFE7A0", { sw: 0 })).join("") + Pth(`M${f(x - 5)},${f(y - 5)} l3,2 l2,-3 l2,3 l3,-2 l-1,3 h-8Z`, "#6E9E5C", { sw: 0.6 });
    const candle = (x, y, h, col) => R(x - 2.5, y - h, 5, h, col, { sw: 0.8 }) + L(x - 2.5, y - h + 4, x + 2.5, y - h + 8, "#FFFFFF", 1.2, { op: 0.7 }) + L(x, y - h, x, y - h - 3, INKC, 0.8) + (n ? C(x, y - h - 7, 6, "#FFE9A8", { sw: 0, op: 0.55 }) : "") + Pth(`M${f(x)},${f(y - h - 12)} q4,5 0,8 q-4,-3 0,-8Z`, n ? "#FFD25E" : "#FFC24A", { sw: 0.6 });
    let s = shadowE(96, 100) + Pth(`M-6,${H - 6} H198 L192,${H} H0Z`, "#F4F1EA", { sw: 1 }) + L(2, H - 3, 190, H - 3, "#DAD3C6", 0.8); // おさら
    s += tier(6, 186, 48, H - 4, 0) + windows(p, n, c.trim, sp, 64, [[20, 54], [143, 30]]);
    s += tier(28, 162, 8, 48, 2) + dollops(28, 162, 46) + miniWin(p, 52, 30, 18, 20, n, c.trim) + miniWin(p, 95, 30, 20, 22, n, c.trim) + miniWin(p, 138, 30, 18, 20, n, c.trim);
    s += tier(50, 140, -30, 8, 4) + dollops(50, 140, 6) + miniWin(p, 95, -10, 18, 18, n, c.trim);
    s += candle(80, -34, 20, "#9FD3E6") + candle(110, -34, 18, "#F6B6C4") + berry(64, -38) + berry(95, -42) + berry(126, -38);
    s += door(p, n, c.door) + lampOf(p, n, [8, 186, 58]);
    return s + yard(p) + post(p);
  }

  // ---- ツリーハウス: おおきな きの うえの こや（こやは かべの いろと そざい・やねは やねの いろ）。ドアは みきの なか ----
  const LEAF = ["#7FAF6A", "#8DBD76", "#6E9E5C", "#94C47E"];
  function treehouse(p, n) {
    const c = p.paint, bark = "#9A6B47", barkD = "#7A5236";
    let s = shadowE(108, 92);
    for (const [x, y, r, k] of [[22, -30, 24, 2], [56, -66, 28, 0], [104, -76, 30, 1], [152, -62, 28, 2], [184, -28, 20, 0], [10, 0, 16, 1], [190, 6, 13, 3]]) s += C(x, y, r, LEAF[k], { sw: 1 }); // うしろの は
    s += Pth(`M98,26 Q76,6 40,-14`, "none", { sw: 7, stroke: bark }) + Pth(`M126,26 Q150,4 178,-10`, "none", { sw: 6, stroke: bark }); // えだ
    s += Pth(`M86,20 C84,60 82,98 58,${H - 1} H166 C142,98 140,60 138,20Z`, bark, { sw: 1.2 }) + Pth(`M130,22 C132,60 134,96 152,${H - 2} H164 C141,98 139,60 137,21Z`, barkD, { sw: 0, op: 0.35 });
    s += Pth(`M58,${H - 1} q8,-10 18,-12 M166,${H - 1} q-8,-10 -18,-12`, "none", { sw: 1, stroke: barkD });
    for (const [x, y, l] of [[96, 30, 18], [128, 36, 14], [94, 84, 16], [134, 90, 12]]) s += Pth(`M${x},${y} q2,${l / 2} 0,${l}`, "none", { sw: 0.8, stroke: barkD });
    s += miniWin(p, 112, 44, 16, 18, n, c.trim); // みきの まど
    // はしご（ロープ）・デッキと ささえ
    s += L(27, 20, 25, H - 4, "#C9A46B", 1.2) + L(39, 20, 41, H - 4, "#C9A46B", 1.2); for (let y = 30; y < H - 6; y += 12) s += L(26, y, 40, y, "#A9744E", 1.6);
    s += Pth(`M42,22 L90,48 M182,22 L134,48`, "none", { sw: 3, stroke: "#8E6640" }) + R(22, 16, 168, 6, "#B98A5E", { sw: 1 }) + Rn(22, 22, 168, 3, "#332B20", { op: 0.15 });
    // こや
    s += R(34, -40, 128, 56, c.wall, { sw: 1.2 }) + texture(p.siding, 35, -39, 161, 15, c.wall) + Pth(`M162,-40 l6,-5 V12 l-6,4Z`, shade(c.wall, -0.18), { sw: 0.8 });
    s += windows(p, n, c.trim, c.wall, -32, [[44, 38], [116, 38]]) + R(84, -24, 28, 12, "#FFF6E0", { sw: 0.7, rx: 2 }) + T(98, -16, "ひみつきち", { size: 5, fill: INKC });
    s += Pth(`M24,-38 L98,-70 L172,-38Z`, c.roof, { sw: 1.3 }) + Pth(`M98,-69 L171,-38.5 H122Z`, shade(c.roof, -0.2), { sw: 0, op: 0.5 });
    for (let i = 1; i < 4; i++) { const y = -70 + i * 8, half = (74 * (i * 8)) / 32; s += L(98 - half, y, 98 + half, y, shade(c.roof, -0.25), 0.7); }
    s += R(20, -40, 156, 4, shade(c.roof, -0.34), { sw: 0.9 });
    s += R(22, 3, 168, 2.5, "#C99A6B", { sw: 0.6 }); for (let x = 24; x <= 188; x += 10) s += L(x, 5.5, x, 16, "#8E6640", 1.2); // てすり
    s += L(184, -6, 184, 34, "#C9A46B", 1) + Pth(`M178,34 h12 l-2,9 h-8Z`, "#C59A76", { sw: 0.7 }); // つるべ
    for (const [x, y, r, k] of [[18, -42, 14, 1], [178, -40, 15, 3], [40, -62, 12, 3], [158, -58, 12, 1]]) s += C(x, y, r, LEAF[k], { sw: 1 }); // まえの は
    for (const [x, y] of [[26, -50], [62, -84], [150, -76], [190, -30], [120, -96]]) s += C(x, y, 2.6, "#E5645E", { sw: 0.6 });
    s += door(p, n, c.door) + lampOf(p, n, [22, 190, 7]);
    return s + yard(p) + post(p);
  }

  // ---- ユーフォー: そらとぶ えんばん（したは かべの いろ・うえは やねの いろ・ふちは まどわくの いろ）----
  function ufo(p, n) {
    const c = p.paint, hull = c.wall, upper = c.roof, rim = c.trim, cx = 104;
    let s = E(cx, H + 1, 92, 7, "#312619", { sw: 0, op: 0.14 });
    for (const [x0, x1] of [[48, 24], [160, 184]]) s += L(x0, 58, x1, H - 5, INKC, 4.6) + L(x0, 58, x1, H - 5, "#C8CDD2", 2.6) + E(x1, H - 3, 9, 3, "#9EA5AB", { sw: 0.8 }); // あし
    s += R(82, 52, 60, H - 53, shade(hull, -0.05), { sw: 1.2, rx: 6 }) + Rn(126, 54, 14, H - 57, shade(hull, -0.2), { op: 0.5 }) + Rn(86, 54, 6, H - 57, "#FFFFFF", { op: 0.3 }); // いりぐちの つつ
    for (const y of [64, 76]) s += L(83, y, 141, y, shade(hull, -0.25), 0.7);
    s += Pth(`M8,44 A96,22 0 0 0 200,44Z`, hull, { sw: 1.3 }) + Pth(`M24,46 A80,11 0 0 0 184,46Z`, shade(hull, 0.2), { sw: 0, op: 0.6 }) + Pth(`M34,58 Q104,74 174,58 Q104,67 34,58Z`, shade(hull, -0.16), { sw: 0, op: 0.6 }); // したの ふね
    s += E(cx, 44, 98, 6, rim, { sw: 1.2 });
    for (const x of [32, 56, 152, 176]) s += C(x, 54, 5, rim, { sw: 0.8 }) + C(x, 54, 3.3, glass(n), { sw: 0.6, stroke: ink }) + C(x - 1, 53, 1.1, shine(n), { sw: 0 }); // まるい まど
    s += Pth(`M18,42 A86,22 0 0 1 190,42Z`, upper, { sw: 1.3 }) + Pth(`M120,21.6 A86,22 0 0 1 190,42 H150Z`, shade(upper, -0.18), { sw: 0, op: 0.5 }); // うえの ふね
    const lit = ["#F6B6C4", "#F7DC7A", "#9FD3E6", "#B9E3A6", "#D9C2F0"];
    for (let i = 0; i < 9; i++) { const a = (0.1 + (0.8 * i) / 8) * Math.PI, x = cx + 98 * Math.cos(a), y = 44 + 6 * Math.sin(a); s += (n ? C(x, y, 5, lit[i % 5], { sw: 0, op: 0.45 }) : "") + C(x, y, 2.2, n ? "#FFF2B8" : lit[i % 5], { sw: 0.5 }); }
    // ドーム（ガラス）
    s += Pth(`M60,26 A44,42 0 0 1 148,26Z`, glass(n), { sw: 1.2, stroke: ink }) + Pth(`M70,24 Q66,-4 92,-12 Q76,4 80,24Z`, shine(n), { sw: 0, op: 0.6 });
    s += R(80, 14, 8, 8, "#C59A76", { sw: 0.6, op: 0.75 }) + C(84, 10, 5, "#7FAF6A", { sw: 0.6, op: 0.75 }) + star(124, 4, 5, "#F4D35E");
    s += Pth(`M84,26 Q86,-6 104,-16 M124,26 Q122,-6 104,-16`, "none", { sw: 1, stroke: cream, op: 0.7 }) + R(58, 23, 92, 5, shade(upper, -0.22), { sw: 0.9, rx: 2.5 });
    s += L(cx, -16, cx, -31, INKC, 1.2) + (n ? C(cx, -35, 8, "#FFE680", { sw: 0, op: 0.4 }) : "") + C(cx, -35, 3.5, n ? "#FFE680" : "#F2A7B4", { sw: 0.8 }); // アンテナ
    s += door(p, n, c.door);
    return s + yard(p) + post(p, D + 34, true);
  }

  // ---- たてものの かたち ----
  // draw: 絵・top: いちばん うえの y（絵の わくを きめる）
  const FORM = {
    basic: { draw: basicBody, top: peakBasic },
    three: { draw: three, top: (p) => peakBasic(p) - LIFT3 },
    castle: { draw: castle, top: castleTop },
    mushroom: { draw: mushroom, top: (p) => (p.chimney && p.chimney !== "none" ? -62 : -54.7) },
    cake: { draw: cake, top: () => -66.3 },
    tree: { draw: treehouse, top: () => -106.5 },
    ufo: { draw: ufo, top: () => -38.9 },
  };
  const FORMS = Object.keys(FORM);
  const formOf = (p) => FORM[p.form] || FORM.basic;
  function body(p, n) { return formOf(p).draw(p, n); }
  // 絵の わく [x0, y0, x1, y1]（いつもは BOX。たかい たてもの・かざみどりは うえを ひろげる）
  function box(p) { return [BOX[0], Math.min(BOX[1], Math.floor(formOf(p).top(p) - 4)), BOX[2], BOX[3]]; }
  // 町の 絵（HeiwadaiArt.model と おなじ かたち）
  function model(p, n) {
    const [x0, y0, x1, y1] = box(p);
    return { w: x1 - x0, h: y1 - y0, top: -y0, originX: x0, originY: y0, footW: 6, footH: 4, svg: `<g transform="translate(${-x0},${-y0})">${body(p, n)}</g>` };
  }
  // がめん よう（そらと じめん つき。zoom は いちぶを 大きく: [x, y, w, h]）
  function picture(p, n, zoom) {
    const [x0, y0, x1, y1] = box(p), vb = zoom || [x0 - 14, y0 - 6, x1 - x0 + 28, y1 - y0 + 16];
    const sky = n ? "#3E4C78" : "#CFE8F4", ground = n ? "#5E7A5A" : "#A9CF8C";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(" ")}" preserveAspectRatio="xMidYMid meet"><rect x="${x0 - 40}" y="${y0 - 40}" width="${x1 - x0 + 80}" height="${y1 - y0 + 80}" fill="${sky}"/>${n ? C(170, y0 + 17, 7, "#FFF3C4", { sw: 0 }) : C(-4, y0 + 19, 9, "#FFF0A6", { sw: 0 })}<rect x="${x0 - 40}" y="${H - 2}" width="${x1 - x0 + 80}" height="60" fill="${ground}"/><rect x="${D - 16}" y="${H + 1}" width="32" height="40" fill="${n ? "#8C8778" : "#D9CFB8"}"/>${body(p, n)}</svg>`;
  }
  // パーツの ちいさな 絵（その パーツの ところを 大きく。たてものの かたちで ばしょが かわる）
  const ZOOM = {
    roof: [-12, -50, 216, 92], paint: [-12, -50, 216, 190], siding: [2, 26, 80, 80], window: [8, 40, 80, 52], door: [D - 40, H - 72, 80, 80],
    chimney: [W - 96, -50, 96, 70], top: [-6, -50, 210, 90], lamp: [D - 60, H - 72, 88, 64], post: [D + 6, H - 50, 46, 46], yard: [0, H - 64, 72, 70],
  };
  const FORM_ZOOM = {
    castle: { roof: (y0) => [-12, y0 - 1, 216, 31 - y0], siding: [40, 4, 112, 96], window: [0, -24, 196, 112] },
    mushroom: { chimney: (y0) => [96, y0 - 1, 100, 52], window: [36, 48, 140, 60] },
    cake: { window: [6, -24, 186, 130] },
    tree: { siding: [28, -46, 144, 66], window: [28, -46, 144, 104] },
  };
  function zoomOf(p, cat) {
    const [x0, y0, x1, y1] = box(p), all = [x0 - 2, y0 - 1, x1 - x0 - 1, y1 - y0 + 1], fz = FORM_ZOOM[p.form]?.[cat];
    if (cat === "paint" || cat === "form") return all;
    if (fz) return typeof fz === "function" ? fz(y0) : fz;
    if (!FORM_ZOOM[p.form] && (cat === "roof" || cat === "chimney" || cat === "top")) { const lift = p.form === "three" ? LIFT3 : 0, [zx, zy, zw, zh] = ZOOM[cat]; return [zx, y0 - 1, zw, zy + zh - lift - (y0 - 1)]; }
    return ZOOM[cat] || all;
  }
  const icon = (p, cat) => picture(p, false, zoomOf(p, cat));
  return { W, H, D, BOX, ZOOM, FORMS, LIFT3, model, picture, icon, body, box, zoomOf, shade };
})();
