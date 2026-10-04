// ぽかぽか こうむてん（O9・UI-74。ネリカスタウンの 工務店。オーナーの FB 2026-10-03「工務店をネリカスタウンに追加して、そこでパーツや塗装を購入してカスタマイズできるようにして。」）
// 大通りの 北の いちばん にしの「まちの おうち」（nerikasu_home7・8×5・入口 4。家具工房の となり）を 工務店に する。足もと・入口・大きさは そのまま。
// 建物の 絵は tools/town-design/nerikasu-buildings.mjs の koumuten（js/nerikasu-town-art.js に 生成）。
// 中は サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・16×12 マス）: ペンキの たな・ドアの みほん・やねの みほん・まどの みほん・
// もけいの おうち（いまの おうちの そとが うつる）・さぎょうだい・ざいもく・はしご・バケツ・うけつけ（くまの とうりょう ガンさん）・まちあいの ベンチ。
// とうりょうさん・みほんを タップすると「おうちの そとを かえる」がめん（js/house-ext-ui.js）。
const Koumuten = (() => {
  const W = 16, H = 12, T = () => IsoVenue.T;
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${fill}" ${extra}>${t}</text>`;
  const ln = (d, w = 2.4, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const C = {
    wood: ["#D6A673", "#BE8C5C", "#A6764B"], dark: ["#9C7350", "#86603F", "#704F33"], metal: ["#DCE2E6", "#BCC5CC", "#A5AFB7"],
    steel: ["#9AA6AE", "#84909A", "#6E7A84"], white: ["#F7F4EE", "#DFD8CC", "#C9C1B3"], green: ["#8FB39A", "#7A9E85", "#668A71"],
  };
  const paintHex = () => HouseExt.PAINTS.map((p) => p.hex);
  // 立って 見える 小物（画面の むき）
  const SPRITE = {
    door: (col, kind) => {
      const body = kind === "arch" ? `<path d="M-11,0 V-30 A11,11 0 0 1 11,-30 V0 Z" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M-6,-30 A6,6 0 0 1 6,-30 V-24 H-6Z" fill="#CDEBF7" stroke="${INK}" stroke-width="1.4"/>`
        : kind === "heart" ? `<rect x="-11" y="-42" width="22" height="42" rx="2" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M0,-22 C-7,-26 -5,-33 0,-29 C5,-33 7,-26 0,-22Z" fill="#F2A7B4" stroke="${INK}" stroke-width="1.2"/>`
        : kind === "glass" ? `<rect x="-11" y="-42" width="22" height="42" rx="2" fill="${col}" stroke="${INK}" stroke-width="2"/><rect x="-7" y="-38" width="14" height="30" fill="#CDEBF7" stroke="${INK}" stroke-width="1.2"/><path d="M0,-38 V-8" stroke="${INK}" stroke-width="1"/>`
        : `<rect x="-11" y="-42" width="22" height="42" rx="2" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M-5,-40 V-2 M0,-40 V-2 M5,-40 V-2" stroke="${MallArt.shade(col, -0.25)}" stroke-width="1.2"/>`;
      return body + `<circle cx="7" cy="-18" r="1.8" fill="#E2B85C" stroke="${INK}" stroke-width="0.8"/>`;
    },
    win: (kind) => kind === "round" ? `<circle cx="0" cy="-16" r="13" fill="#F7F4EE" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-16" r="9" fill="#CDEBF7" stroke="${INK}" stroke-width="1.4"/><path d="M0,-25 V-7 M-9,-16 H9" stroke="#FFFFFF" stroke-width="1.6"/>`
      : kind === "arch" ? `<path d="M-12,0 V-20 A12,12 0 0 1 12,-20 V0 Z" fill="#F7F4EE" stroke="${INK}" stroke-width="2"/><path d="M-8,-3 V-20 A8,8 0 0 1 8,-20 V-3 Z" fill="#CDEBF7" stroke="${INK}" stroke-width="1.4"/><path d="M0,-27 V-3" stroke="#FFFFFF" stroke-width="1.6"/>`
      : `<rect x="-13" y="-30" width="26" height="28" rx="2" fill="#F7F4EE" stroke="${INK}" stroke-width="2"/><rect x="-9" y="-26" width="18" height="20" fill="#CDEBF7" stroke="${INK}" stroke-width="1.4"/><path d="M-3,-26 V-6 M3,-26 V-6 M-9,-16 H9" stroke="#8FB39A" stroke-width="1.6"/>`,
    saw: `<path d="M-16,-2 L12,-10 L14,-4 L-14,4 Z" fill="#D6DCE0" stroke="${INK}" stroke-width="1.6"/><path d="M-14,4 l3,-2 l1,2 l3,-2 l1,2 l3,-2 l1,2 l3,-2 l1,2 l3,-2" fill="none" stroke="${INK}" stroke-width="1"/><rect x="12" y="-14" width="10" height="12" rx="3" fill="#C2574E" stroke="${INK}" stroke-width="1.6" transform="rotate(-16 17 -8)"/>`,
    hammer: `<rect x="-2" y="-26" width="4" height="26" rx="1.5" fill="#C99A6B" stroke="${INK}" stroke-width="1.4"/><rect x="-9" y="-31" width="18" height="7" rx="2" fill="#8C959C" stroke="${INK}" stroke-width="1.6"/>`,
    brush: (col) => `<rect x="-2" y="-28" width="4" height="16" rx="1.5" fill="#C99A6B" stroke="${INK}" stroke-width="1.2"/><rect x="-5" y="-14" width="10" height="5" fill="#B9C2C8" stroke="${INK}" stroke-width="1.2"/><path d="M-5,-9 h10 l-1,9 h-8 Z" fill="${col}" stroke="${INK}" stroke-width="1.2"/>`,
    fan: `<g>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-3" y="-34" width="6" height="30" rx="2" fill="${["#F3CDD3", "#F4E3A1", "#CDE7D2", "#C7DDEF", "#DCD0EC", "#B5654F"][i]}" stroke="${INK}" stroke-width="1" transform="rotate(${-40 + i * 16} 0 -4)"/>`).join("")}<circle cx="0" cy="-4" r="2.4" fill="#E2B85C" stroke="${INK}" stroke-width="1"/></g>`,
    bell: `<path d="M-7,0 Q-7,-12 0,-12 Q7,-12 7,0 Z" fill="#E8C35A" stroke="${INK}" stroke-width="1.6"/><rect x="-9" y="0" width="18" height="3" rx="1.5" fill="#B99B4A" stroke="${INK}" stroke-width="1.2"/><circle cx="0" cy="-13" r="2" fill="#E8C35A" stroke="${INK}" stroke-width="1"/>`,
    ledger: `<path d="M-14,-2 L0,-6 L14,-2 L14,4 L0,0 L-14,4 Z" fill="#FFFDF5" stroke="${INK}" stroke-width="1.4"/><path d="M-10,-1 l8,-2 M-10,1.5 l8,-2 M3,-3 l8,2 M3,-0.5 l8,2" stroke="#9AA6AE" stroke-width="0.9"/>`,
  };
  // もけいの おうち（いまの おうちの そと。そらは なし）
  const houseImg = (scale = 0.62) => {
    const [x0, y0, x1, y1] = HouseExtArt.BOX, w = x1 - x0, h = y1 - y0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}">${HouseExtArt.body(HouseExt.resolve(), false)}</svg>`;
    return `<image href="${U.svgUrl(svg)}" x="${f2((-w * scale) / 2)}" y="${f2(-h * scale)}" width="${f2(w * scale)}" height="${f2(h * scale)}"/>`;
  };
  const M = {
    // ペンキの たな（3だん・18いろの かん・「ペンキ」の ふだ）
    paintshelf(S, f) {
      let s = S.box(0.05, 0.1, f.w - 0.1, 0.8, 0, 6, C.dark);
      for (const x of [0.05, f.w - 0.17]) s += S.box(x, 0.1, 0.12, 0.8, 0, 150, C.dark);
      const cols = paintHex();
      [0, 50, 100].forEach((z, row) => {
        s += S.box(0.05, 0.1, f.w - 0.1, 0.8, z + 6, 5, C.wood);
        const n = 6;
        for (let i = 0; i < n; i++) { const cx = 0.38 + (i * (f.w - 0.76)) / (n - 1), col = cols[(row * n + i) % cols.length]; s += S.cyl(cx, 0.5, 0.17, z + 11, 26, ["#E7EBEE", "#C9CFD4"]) + S.ellipse(cx, 0.5, z + 37, 0.13, col, 1) + S.poly([[cx - 0.17, 0.67, z + 18], [cx + 0.17, 0.67, z + 18], [cx + 0.17, 0.67, z + 30], [cx - 0.17, 0.67, z + 30]], col, 0.9); }
      });
      s += S.box(0.05, 0.1, f.w - 0.1, 0.8, 150, 5, C.wood);
      return s + S.at(f.w / 2, 0.9, 166, `<rect x="-30" y="-12" width="60" height="20" rx="6" fill="#FFE07A" stroke="${INK}" stroke-width="2"/>${txt(0, 4, 13, "ペンキ")}`);
    },
    // ドアの みほん（ひくい だいに 4まい）
    doorsamples(S, f) {
      let s = S.ellipse(f.w / 2, 0.5, 0, f.w * 0.42, "#00000012", 0) + S.box(0.1, 0.2, f.w - 0.2, 0.6, 0, 10, C.dark);
      [["#A97850", "glass"], ["#6E9278", "plank"], ["#5D84A8", "arch"], ["#F3CDD3", "heart"]].forEach(([col, kind], i) => { s += S.at(0.55 + (i * (f.w - 1.1)) / 3, 0.55, 10, `<g transform="scale(1.35)">${SPRITE.door(col, kind)}</g>`); });
      return s + S.at(f.w / 2, 0.85, 4, `<rect x="-30" y="-10" width="60" height="16" rx="5" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt(0, 3, 10, "ドアの みほん")}`);
    },
    // やねの みほん（だいの うえの ちいさな やね 3つ）
    roofsamples(S, f) {
      let s = S.box(0.1, 0.1, f.w - 0.2, f.h - 0.2, 0, 40, C.wood);
      const kinds = [["#B18775", 0], ["#5D84A8", 1], ["#6E9278", 2]];
      kinds.forEach(([col, k], i) => {
        const y0 = 0.25 + (i * (f.h - 0.5)) / 3, y1 = y0 + (f.h - 0.5) / 3 - 0.12, x0 = 0.3, x1 = f.w - 0.3, xm = (x0 + x1) / 2;
        if (k === 2) { s += S.poly([[x0, y0, 40], [x1, y0, 40], [x1, y1, 40], [x0, y1, 40]], MallArt.shade(col, -0.2), 1.2) + S.cyl(xm, (y0 + y1) / 2, 0.3, 40, 18, [col, MallArt.shade(col, -0.15)]); return; }
        s += S.poly([[x0, y1, 40], [x1, y1, 40], [x1, (y0 + y1) / 2, 64], [x0, (y0 + y1) / 2, 64]], col, 1.3) + S.poly([[x1, y0, 40], [x1, y1, 40], [x1, (y0 + y1) / 2, 64]], MallArt.shade(col, -0.25), 1.2);
        if (k === 1) for (let t = 0.25; t < 1; t += 0.25) s += S.line([[x0, y1 - (y1 - (y0 + y1) / 2) * t, 40 + 24 * t], [x1, y1 - (y1 - (y0 + y1) / 2) * t, 40 + 24 * t]], MallArt.shade(col, -0.25), 1.2);
      });
      return s + S.at(f.w / 2, f.h - 0.05, 30, `<rect x="-32" y="-10" width="64" height="16" rx="5" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt(0, 3, 10, "やねの みほん")}`);
    },
    // まどの みほん（たてかけた パネルに まど 3つ）
    windowstand(S, f) {
      let s = S.ellipse(f.w / 2, 0.5, 0, f.w * 0.4, "#00000012", 0);
      for (const x of [0.2, f.w - 0.32]) s += S.box(x, 0.3, 0.12, 0.4, 0, 110, C.dark);
      s += S.poly([[0.15, 0.5, 20], [f.w - 0.15, 0.5, 20], [f.w - 0.15, 0.5, 112], [0.15, 0.5, 112]], "#EDE4D2", 1.6);
      ["round", "arch", "lattice"].forEach((k, i) => { s += S.at(0.5 + (i * (f.w - 1)) / 2, 0.5, 34, `<g transform="scale(1.2)">${SPRITE.win(k)}</g>`); });
      return s + S.at(f.w / 2, 0.55, 118, `<rect x="-30" y="-12" width="60" height="18" rx="5" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt(0, 2, 10, "まどの みほん")}`);
    },
    // もけいの おうち（テーブルの うえに いまの おうち）
    modelhouse(S, f) {
      let s = S.ellipse(f.w / 2, f.h / 2, 0, Math.min(f.w, f.h) * 0.5, "#00000014", 0);
      for (const [x, y] of [[0.2, 0.2], [f.w - 0.32, 0.2], [0.2, f.h - 0.32], [f.w - 0.32, f.h - 0.32]]) s += S.box(x, y, 0.12, 0.12, 0, 62, C.dark);
      s += S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 62, 8, C.wood) + S.poly([[0.3, 0.3, 70], [f.w - 0.3, 0.3, 70], [f.w - 0.3, f.h - 0.3, 70], [0.3, f.h - 0.3, 70]], "#A9CF8C", 1.2);
      s += S.at(f.w / 2, f.h / 2 + 0.2, 70, houseImg(0.62));
      return s + S.at(f.w / 2, f.h - 0.02, 50, `<rect x="-36" y="-10" width="72" height="16" rx="5" fill="#FFE07A" stroke="${INK}" stroke-width="1.6"/>${txt(0, 3, 10, "あなたの おうち")}`);
    },
    // さぎょうだい（いたと のこぎり・かんな くず）
    workbench(S, f) {
      let s = S.ellipse(f.w / 2, f.h / 2, 0, f.w * 0.42, "#00000014", 0);
      for (const [x, y] of [[0.15, 0.15], [f.w - 0.3, 0.15], [0.15, f.h - 0.3], [f.w - 0.3, f.h - 0.3]]) s += S.box(x, y, 0.15, 0.15, 0, 56, C.dark);
      s += S.box(0.08, 0.1, f.w - 0.16, f.h - 0.2, 16, 5, C.dark) + S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 56, 9, C.wood);
      s += S.box(0.4, 0.35, 1.5, 0.35, 65, 5, ["#E9C99A", "#D4B07E", "#BF9A68"]) + S.at(f.w * 0.7, f.h * 0.45, 65, SPRITE.saw) + S.at(f.w * 0.3, f.h * 0.75, 65, SPRITE.hammer);
      for (let i = 0; i < 7; i++) s += S.ellipse(0.6 + ((i * 0.37) % (f.w - 1)), 0.4 + ((i * 0.53) % (f.h - 0.8)), 0, 0.08, "#E9C99A", 0.6);
      return s;
    },
    // ざいもく（ラックの いたと かくざい）
    lumber(S, f) {
      let s = "";
      for (const x of [0.1, f.w / 2 - 0.06, f.w - 0.22]) s += S.box(x, 0.2, 0.12, 0.6, 0, 120, C.steel);
      for (const z of [10, 50, 90]) {
        s += S.box(0.1, 0.2, f.w - 0.2, 0.6, z, 4, C.steel);
        for (let k = 0; k < 3; k++) s += S.box(0.15, 0.25 + k * 0.17, f.w - 0.3, 0.15, z + 4 + k * 0, 9, k % 2 ? ["#E2C08E", "#CBA772", "#B38F5D"] : ["#D9B07A", "#C29865", "#AA8150"]);
      }
      return s;
    },
    // はしご（A がた）
    ladder(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.36, "#00000012", 0);
      s += S.line([[0.2, 0.25, 0], [0.5, 0.5, 130]], "#C2574E", 4) + S.line([[0.8, 0.25, 0], [0.5, 0.5, 130]], "#C2574E", 4) + S.line([[0.2, 0.75, 0], [0.5, 0.5, 130]], "#C2574E", 4) + S.line([[0.8, 0.75, 0], [0.5, 0.5, 130]], "#C2574E", 4);
      for (const z of [30, 60, 90]) { const k = 1 - z / 130; s += S.line([[0.5 - 0.3 * k, 0.5 - 0.25 * k, z], [0.5 + 0.3 * k, 0.5 - 0.25 * k, z]], "#E8E2D6", 3); }
      return s;
    },
    // ペンキの バケツと はけ
    buckets(S, f) {
      let s = S.ellipse(f.w / 2, f.h / 2, 0, 0.5, "#0000000F", 0);
      [["#F3CDD3", 0.3, 0.35], ["#C7DDEF", 0.75, 0.6], ["#F4E3A1", 0.35, 0.8]].forEach(([col, x, y]) => { s += S.cyl(x, y, 0.2, 0, 24, ["#E7EBEE", "#C9CFD4"]) + S.ellipse(x, y, 24, 0.16, col, 1) + S.poly([[x - 0.2, y + 0.2, 6], [x - 0.05, y + 0.2, 6], [x - 0.05, y + 0.2, 22], [x - 0.2, y + 0.2, 22]], col, 0.8); });
      return s + S.at(0.75, 0.55, 24, SPRITE.brush("#C7DDEF")) + S.at(0.3, 0.3, 24, SPRITE.brush("#F3CDD3"));
    },
    // うけつけ カウンター（ちょうめん・よびりん・いろみほん）
    kcounter(S, f) {
      let s = S.box(0, 0.25, f.w, 0.75, 0, 72, C.wood) + S.box(-0.05, 0.2, f.w + 0.1, 0.85, 72, 7, ["#F0E2C8", "#D8C8AA", "#C2B08F"]);
      for (let x = 0.5; x < f.w; x += 1) s += S.poly([[x - 0.3, 1, 14], [x + 0.3, 1, 14], [x + 0.3, 1, 58], [x - 0.3, 1, 58]], "#C99A6B", 1.2);
      s += S.at(0.7, 0.6, 79, SPRITE.ledger) + S.at(f.w - 0.8, 0.6, 79, SPRITE.bell) + S.at(f.w / 2 + 0.2, 0.55, 79, SPRITE.fan);
      return s + S.at(f.w / 2, 1.0, 46, `<rect x="-30" y="-12" width="60" height="20" rx="6" fill="#FFFDF5" stroke="${INK}" stroke-width="2"/>${txt(0, 4, 12, "うけつけ")}`);
    },
  };
  // ---- 床 ----
  const MAT = {
    kwood: { c: ["#E1C29A", "#D9B98F"], line: "#BF9B70", pat: "plank" },
    kconc: { c: ["#D9D6CF", "#D1CDC5"], line: "#B9B4AA", pat: "tile" },
    kmat: { c: ["#9DB5A3", "#93AB99"], line: "#7E9A86", pat: "check" },
  };
  // ---- かべ（きた: いろみほんの かべ・かんばん・まどの え・とけい／にし: どうぐの かべ・おうちの ポスター）----
  const wallSvg = (r, side) => {
    const Tt = T(), Lw = (side === "north" ? r.w : r.h) * Tt, Hh = r.wallH || 240, V = (z) => Hh - z, u = (tile) => (side === "north" ? tile : r.h - tile) * Tt;
    const R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" ${extra}/>`;
    const span = (a, b) => [Math.min(u(a), u(b)), Math.max(u(a), u(b))];
    let s = R(0, 0, Lw, Hh, "#F3EBDD") + R(0, V(90), Lw, 90, "#C99A6B") + `<path d="M0,${f2(V(90))} H${f2(Lw)}" stroke="${INK}" stroke-width="2"/>`;
    for (let x = 18; x < Lw; x += 36) s += `<path d="M${f2(x)},${f2(V(88))} V${f2(V(10))}" stroke="#B5875A" stroke-width="1.4"/>`;
    if (side === "north") {
      // いろみほん（18いろ）
      const [a0, a1] = span(0.6, 5.2), cols = paintHex(), cw = (a1 - a0 - 20) / 6;
      s += R(a0, V(212), a1 - a0, 104, "#FFFDF5", `rx="6" stroke="${INK}" stroke-width="2"`) + `<text x="${f2((a0 + a1) / 2)}" y="${f2(V(196))}" font-size="13" font-weight="900" text-anchor="middle" fill="${INK}">いろみほん</text>`;
      cols.forEach((c, i) => { s += R(a0 + 10 + (i % 6) * cw, V(186) + Math.floor(i / 6) * 24, cw - 4, 20, c, `rx="3" stroke="${INK}" stroke-width="1.2"`); });
      // かんばん
      const [b0, b1] = span(5.8, 10.4);
      s += R(b0, V(224), b1 - b0, 46, "#6E9278", `rx="10" stroke="${INK}" stroke-width="2.4"`) + `<text x="${f2((b0 + b1) / 2)}" y="${f2(V(194))}" font-size="20" font-weight="900" text-anchor="middle" fill="#FFF7E0">ぽかぽか こうむてん</text>`;
      s += `<path d="M${f2(b0 + 20)},${f2(V(232))} l10,-12 l10,12 M${f2(b1 - 40)},${f2(V(232))} l10,-12 l10,12" stroke="#B5654F" stroke-width="3" fill="none"/>`;
      // まどの え（おうちの そとの いろいろ）
      const [c0, c1] = span(11, 15.4);
      s += R(c0, V(214), c1 - c0, 100, "#FFFDF5", `rx="6" stroke="${INK}" stroke-width="2"`);
      const ex = [
        { ...HouseExt.DEFAULT_PARTS, roof: "steep", window: "arch", paint: { roof: "#8B78A8", wall: "#F3CDD3", door: "#7E5E4B", trim: "#FFFFFF" } },
        { ...HouseExt.DEFAULT_PARTS, roof: "round", window: "round", yard: "tree", paint: { roof: "#6E9278", wall: "#C7DDEF", door: "#5D84A8", trim: "#F4E3A1" } },
      ];
      const [x0, y0, x1, y1] = HouseExtArt.BOX, hw = x1 - x0, hh = y1 - y0, sc = ((c1 - c0 - 30) / 2) / hw;
      ex.forEach((p, i) => { const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${hw} ${hh}">${HouseExtArt.body(p, false)}</svg>`; s += `<image href="${U.svgUrl(svg)}" x="${f2(c0 + 10 + i * ((c1 - c0 - 10) / 2))}" y="${f2(V(204))}" width="${f2(hw * sc)}" height="${f2(hh * sc)}"/>`; });
      s += `<text x="${f2((c0 + c1) / 2)}" y="${f2(V(126))}" font-size="12" font-weight="900" text-anchor="middle" fill="${INK}">こんな おうちにも できるよ</text>`;
    } else {
      // どうぐの かべ（あなあき ボードに かなづち・のこぎり・スパナ・さしがね）
      const [a0, a1] = span(1, 6);
      s += R(a0, V(214), a1 - a0, 110, "#D9B98F", `rx="4" stroke="${INK}" stroke-width="2"`);
      for (let x = a0 + 10; x < a1 - 4; x += 14) for (let z = 112; z < 210; z += 14) s += `<circle cx="${f2(x)}" cy="${f2(V(z))}" r="1.6" fill="#A7865E"/>`;
      s += `<g transform="translate(${f2(a0 + 30)} ${f2(V(120))})">${SPRITE.hammer}</g><g transform="translate(${f2(a0 + 80)} ${f2(V(150))}) rotate(-20)">${SPRITE.saw}</g>`;
      s += `<g transform="translate(${f2(a1 - 50)} ${f2(V(124))})"><path d="M-4,0 V-40 l-6,-8 h20 l-6,8 V0 Z" fill="#9AA6AE" stroke="${INK}" stroke-width="1.6"/></g>`;
      s += `<path d="M${f2(a1 - 30)},${f2(V(200))} V${f2(V(128))} H${f2(a1 - 10)}" stroke="#C2B04A" stroke-width="5" fill="none"/>`;
      // とけい
      const [cx] = span(8, 8); s += `<circle cx="${f2(cx)}" cy="${f2(V(180))}" r="20" fill="#FFFDF5" stroke="${INK}" stroke-width="2.4"/>` + ln(`M${f2(cx)},${f2(V(180))} v-12 M${f2(cx)},${f2(V(180))} h9`, 2.4);
      // あかるい まど
      const [w0, w1] = span(9.4, 11.6);
      s += R(w0, V(208), w1 - w0, 96, "#8C6A4A", `rx="4" stroke="${INK}" stroke-width="2"`) + R(w0 + 6, V(202), w1 - w0 - 12, 84, "#CDEBF7") + `<path d="M${f2((w0 + w1) / 2)},${f2(V(202))} V${f2(V(118))}" stroke="#8C6A4A" stroke-width="4"/>` + `<circle cx="${f2(w0 + 24)}" cy="${f2(V(132))}" r="16" fill="#9CCB86"/>`;
    }
    s += R(0, 0, Lw, 10, "#8E6440") + R(0, V(10), Lw, 10, "#8E6440") + `<path d="M0,${V(10)} H${Lw}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Lw} ${Hh}">${s}</svg>`, L: Lw, H: Hh };
  };
  // ---- へや（16×12）----
  const grid = (paint) => { const rows = Array.from({ length: H }, () => Array(W).fill(".")); paint((ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; }); return rows.map((r) => r.join("")); };
  const BOSS = { sp: "bear", ci: 1, name: "くまの とうりょう ガンさん", outfit: { head: "helmet", body: "overalls" } };
  function floor1() {
    const F = [], add = (o) => (F.push(o), o);
    add({ kind: "paintshelf", x: 1, y: 0, w: 4, h: 1, height: 170, label: "ペンキの たな", action: "hx", tab: "paint", spots: [[2, 1], [3, 1]] });
    add({ kind: "doorsamples", x: 6, y: 0, w: 4, h: 1, height: 70, label: "ドアの みほん", action: "hx", tab: "door", spots: [[7, 1], [8, 1]] });
    add({ kind: "lumber", x: 12, y: 0, w: 3, h: 1, height: 120, label: "ざいもく", action: "info", text: "いい においの きの いたと かくざい。\nやねや かべを なおす ときに つかうんだって。", spots: [[13, 1]] });
    add({ kind: "roofsamples", x: 0, y: 3, w: 2, h: 3, height: 70, label: "やねの みほん", action: "hx", tab: "roof", spots: [[2, 4], [2, 5]] });
    add({ kind: "windowstand", x: 0, y: 7, w: 2, h: 1, height: 120, label: "まどの みほん", action: "hx", tab: "window", spots: [[2, 7], [1, 8]] });
    add({ kind: "modelhouse", x: 5, y: 4, w: 3, h: 2, height: 90, label: "もけいの おうち", action: "model", spots: [[6, 6], [5, 6], [7, 6], [8, 5]] });
    add({ kind: "workbench", x: 11, y: 3, w: 3, h: 2, height: 70, label: "さぎょうだい", action: "info", text: "つくりかけの まどわくと のこぎり。\nかんなくずが ふわふわ ちらばって いる。", spots: [[12, 5], [10, 4]] });
    add({ kind: "npc", sp: "raccoon", ci: 0, x: 14, y: 4, w: 1, h: 1, dir: "left", emo: "happy", outfit: { head: "hachimaki" }, label: "たぬきの でし ポンた", action: "talk", lines: ["ポンたです！ とうりょうの でし です。", "ペンキの いろを ならべて、すきな いろを さがしてね。", "やねの かたちを かえると、おうちの ふんいきが がらっと かわるよ！"], spots: [[14, 5], [15, 4]] });
    add({ kind: "ladder", x: 15, y: 2, w: 1, h: 1, height: 130 });
    add({ kind: "buckets", x: 6, y: 1, w: 2, h: 1, height: 40, walk: false });
    add({ kind: "kcounter", x: 10, y: 7, w: 4, h: 1, height: 80, label: "うけつけ", action: "koumuten", spots: [[11, 8], [12, 8], [13, 8]] });
    add({ kind: "npc", ...BOSS, x: 12, y: 6, w: 1, h: 1, dir: "down", emo: "happy", label: BOSS.name, action: "koumuten", spots: [[11, 8], [12, 8], [13, 8]] });
    add({ kind: "bench", x: 1, y: 10, w: 3, h: 1, height: 46, label: "まちあいの ベンチ", action: "sit", text: "ペンキの いろみほんを ながめながら ひとやすみ。", spots: [[2, 9], [4, 10]] });
    add({ kind: "planter", x: 15, y: 10, w: 1, h: 1, height: 150, variant: "tree" }); add({ kind: "planter", x: 0, y: 10, w: 1, h: 1, height: 70 });
    add({ kind: "exitMat", x: 7, y: 11, w: 3, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[7, 10], [8, 10], [9, 10]] });
    return {
      id: "koumuten1", floorNo: 1, iso: true, w: W, h: H, wallH: 240, scale: 0.5, spawn: [8, 10], crowd: 0, exit: [7, 11, 10, 12], title: "ぽかぽか こうむてん", fixtures: F,
      rows: grid((p) => { p("c", 9, 2, 15, 6); p("m", 7, 10, 9, 11); }),
      mats: { ".": "kwood", c: "kconc", m: "kmat" },
    };
  }
  // ---- しらべる・はなす ----
  const bossFace = () => Art.npcSvg({ sp: BOSS.sp, emo: "happy", outfit: BOSS.outfit });
  const npcFace = (f) => Art.npcSvg({ sp: f.sp, emo: "happy", ...(f.outfit ? { outfit: f.outfit } : {}) });
  async function openUI(sc, tab) {
    const r = await HouseExtUI.open({ tab });
    if (r.changed) await UI.say([{ name: BOSS.name, face: bossFace(), text: r.spent > 0 ? `まいど あり！ ${r.spent.toLocaleString()}コイン いただきます。\nもう おうちの そとは できあがって いるよ。かえったら 見て ごらん！` : "よし、つけかえ かんりょう！\nかえったら 見て ごらん！" }, { who: "wanko", emo: "happy", text: "わあ、はやく 見に いきたい！" }]);
    sc.refreshModel?.();
  }
  const art = Object.create(MallArt);
  Object.assign(art, {
    M: { ...MallArt.M, ...M }, MAT: { ...MallArt.MAT, ...MAT }, models: new Map(),
    // もけいの おうちは いまの おうちの キーも（かえたら かわる・有限）
    modelKey(f) { return "koumu:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant || "") + (f.kind === "modelhouse" ? ":" + HouseExt.key() : ""); },
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = wallSvg(r, side); jobs.push(SvgCache.ensure("koumuwall:" + r.id + ":" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
    },
    paint(g, r) { this.paintFloor(g, r); this.paintWalls(g, r); },
    wallSvg,
    backdrop() { return ["#E6DCCB", "#F5EEE2"]; },
    async interact(sc, f) {
      if (f.action === "leave") { sc.leave(); return true; }
      if (!["koumuten", "hx", "model", "talk"].includes(f.action)) return false;
      sc.busy = true;
      try {
        if (f.action === "talk") await UI.say(f.lines.map((text) => ({ name: f.label, face: npcFace(f), text })));
        else if (f.action === "model") {
          await UI.say([{ name: BOSS.name, face: bossFace(), text: HouseExt.custom() ? "これは あんたたちの おうちの もけいさ。\nいまの やねと かべの いろ、よく にあって いるよ。" : "これは あんたたちの おうちの もけいさ。\nやねや かべを かえると、もけいも かわるんだ。" }]);
          await openUI(sc, "paint");
        } else if (f.action === "hx") await openUI(sc, f.tab);
        else {
          const k = await UI.ask("いらっしゃい！ ぽかぽか こうむてんの ガンさんだ。\nおうちの そとを すきな ように かえて あげるよ。", ["おうちの そとを かえる", "どんな ことが できるの？", "またね"], { face: bossFace(), name: BOSS.name });
          if (k === 0) await openUI(sc, "paint");
          else if (k === 1) await UI.say([
            { name: BOSS.name, face: bossFace(), text: "ペンキで やね・かべ・ドア・まどわくの いろを ぬりかえられる。\nやねの かたち・かべの そざい・まど・ドアも とりかえ OK だ。" },
            { name: BOSS.name, face: bossFace(), text: "えんとつ・かざみどり・ソーラーパネル・ライト・ポスト・にわの かざりも あるよ。\nいちど かった ものは、いつでも ただで つけかえて あげる！" },
            { who: "goji", emo: "happy", text: "ガゥ！ とんがり やねが いいな〜" },
          ]);
        }
      } finally { sc.busy = false; }
      return true;
    },
  });
  // 町の 建物（NerikasuLayout.install の あと。house の しるしで「まちの おうち」に なって いる ところを かえる）
  function townInstall() {
    const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home7");
    if (!b) throw Error("koumuten: ネリカスタウンの 工務店の 場所が ない");
    Object.assign(b, { label: "ぽかぽか こうむてん", act: { type: "venue", venue: "koumuten" } }); // style・絵（asset）は そのまま（絵は 原画の koumuten）
  }
  function install() { VenueHalls.defs.koumuten = { name: "ぽかぽか こうむてん", iso: true, art, bgm: "shop", floors: { 1: floor1() } }; townInstall(); }
  install();
  return { W, H, art, floor1, BOSS, M, wallSvg };
})();
