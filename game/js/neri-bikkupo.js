// レストラン びっくぽ（ネリカスタウンの ファミレス。オーナーの FB 2026-09-29「レストランは 内装を 実際の ファミレス風に」）。
// サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・22×16 マス・絵は MallArt の くみたて）。
// まどぎわ と かべぞいの ボックス席（あかい ソファ・よびだし ボタン・メニュー立て）・4にんがけの テーブル・ドリンクバー・
// キッチン（コンロ・れいぞうこ・うけわたしの カウンターと ヒートランプ）・レジと デザートの ショーケース・キッズ コーナー・まちあいの いす・はいぜん ロボ。
// ボックス席や テーブルを タップすると メニューを えらんで 3人で たべる（ごはん・デザート）。ドリンクバーで のむ。
// キッチンの カウンターで バーガーの おてつだい（shop burger。おわると 店の 中に もどる）。レジで おもちかえり。
const Bikkupo = (() => {
  const W = 22, H = 16, T = () => IsoVenue.T;
  const MENU = { meal: ["hamburg", "omurice", "doria", "kidsplate", "mild_curry"], dessert: ["pancake", "parfait", "pudding", "deza_ice"], drink: 30 };
  const img = (svg, x, y, w, h) => `<image href="${U.svgUrl(svg)}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet"/>`;
  const food = (id, size = 30) => img(Art.iconSvg("bag", id), -size / 2, -size * 0.8, size, size);
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${fill}" ${extra}>${t}</text>`;
  const C = {
    seat: ["#E4665A", "#C4524A", "#AB463F"], back: ["#EE7A6E", "#D0584F", "#B84E46"], wood: ["#D2A26F", "#B9885A", "#A2754B"], top: ["#FBF3E6", "#E4D5BD", "#CDBB9F"],
    leg: ["#8C8890", "#77737B", "#66626A"], steel: ["#DCE2E6", "#BCC5CC", "#A5AFB7"], white: ["#F7F4EE", "#DFD8CC", "#C9C1B3"], cream: ["#FFF6E6", "#EADCC4", "#D5C5A9"],
  };
  // すわって いる おきゃくさん（ボックス席の おくの せき。テーブルで 下が かくれる）
  const guest = (sp, ci, dir) => { const cols = (NpcArt.SP[sp] || {}).cols || [], col = cols.length ? cols[ci % cols.length] : null; return Art.npcSvg({ sp, emo: "happy", dir, pose: "idle_01", ...(col ? { col: col[0], col2: col[1] } : {}) }); };
  const GUESTS = { a: [["rabbit", 1, "right"]], b: [["bear", 0, "right"], ["cat", 2, "right"]], c: [["sheep", 1, "down"]], d: [["panda", 0, "down"], ["duck", 1, "down"]] };
  const M = {
    // ボックス席: dir y は まどぎわ（北の かべ・w3×h2。ソファ｜テーブル｜ソファ が x に ならぶ）、dir x は かべぞい（西の かべ・w2×h3）
    // そう（O7・js/dine-seats.js）: 0 おくの ソファ（と すわって いる おきゃくさん）／1 テーブル／9 おきゃくさんの たべもの／2 てまえの ざめん／3 てまえの せもたれ
    booth(S, f) {
      const alongY = f.dir !== "x", g = GUESTS[f.variant] || [], L = (k, str) => S.only(k, str);
      let s = L(0, S.ellipse(f.w / 2, f.h / 2, 0, 1.25, "#00000012", 0));
      const people = (u, v) => g.map(([sp, ci, dir], i) => S.at(alongY ? u : u + (i - (g.length - 1) / 2) * 0.62, alongY ? v + (i - (g.length - 1) / 2) * 0.62 : v, 22, img(guest(sp, ci, dir), -30, -84, 60, 84))).join("");
      if (alongY) {
        s += L(0, S.box(0.06, 0.08, 0.3, 1.84, 0, 104, C.back) + S.box(0.36, 0.08, 0.58, 1.84, 0, 44, C.seat) + people(0.62, 1.0));
        s += L(1, S.box(1.42, 0.72, 0.16, 0.56, 0, 66, C.leg) + S.box(1.02, 0.1, 0.96, 1.8, 66, 6, C.top));
        s += L(1, S.box(1.14, 0.2, 0.18, 0.1, 72, 18, ["#FFFFFF", "#E95F4B", "#C9483A"]) + S.cyl(1.72, 0.32, 0.07, 72, 6, ["#F4B63F", "#D99A2B"]) + S.box(1.12, 1.55, 0.26, 0.2, 72, 12, C.white));
        if (g.length) s += L(9, S.at(1.45, 1.05, 72, food(f.variant === "b" ? "hamburg" : "parfait", 30)));
        s += L(2, S.box(2.06, 0.08, 0.58, 1.84, 0, 44, C.seat)) + L(3, S.box(2.64, 0.08, 0.3, 1.84, 0, 104, C.back));
      } else {
        s += L(0, S.box(0.08, 0.06, 1.84, 0.3, 0, 104, C.back) + S.box(0.08, 0.36, 1.84, 0.58, 0, 44, C.seat) + people(1.0, 0.62));
        s += L(1, S.box(0.72, 1.42, 0.56, 0.16, 0, 66, C.leg) + S.box(0.1, 1.02, 1.8, 0.96, 66, 6, C.top));
        s += L(1, S.box(0.2, 1.14, 0.1, 0.18, 72, 18, ["#FFFFFF", "#C9483A", "#E95F4B"]) + S.cyl(0.32, 1.72, 0.07, 72, 6, ["#F4B63F", "#D99A2B"]) + S.box(1.55, 1.12, 0.2, 0.26, 72, 12, C.white));
        if (g.length) s += L(9, S.at(1.05, 1.45, 72, food(f.variant === "d" ? "omurice" : "doria", 30)));
        s += L(2, S.box(0.08, 2.06, 1.84, 0.58, 0, 44, C.seat)) + L(3, S.box(0.08, 2.64, 1.84, 0.3, 0, 104, C.back));
      }
      return s;
    },
    // 4にんがけの テーブル（いすが 4つ。せもたれは テーブルと はんたいがわ）
    // そう: 0 おくの いす（きた・にし）／1 テーブル／9 テーブルの うえの たべもの／2 てまえの ざめん（ひがし・みなみ）／3 てまえの せもたれ
    fmtable(S, f) {
      const seat = (x, y) => S.box(x + 0.17, y + 0.17, 0.08, 0.08, 0, 36, C.leg) + S.box(x, y, 0.42, 0.42, 36, 6, C.seat);
      const back = (x, y, w, d) => S.box(x, y, w, d, 42, 40, C.wood), L = (k, str) => S.only(k, str);
      let s = L(0, S.ellipse(1, 1, 0, 0.95, "#00000012", 0));
      s += L(0, back(0.79, 0.04, 0.42, 0.07) + seat(0.79, 0.04) + back(0.04, 0.79, 0.07, 0.42) + seat(0.04, 0.79));
      s += L(1, S.cyl(1, 1, 0.07, 0, 64, C.leg) + S.box(0.42, 0.42, 1.16, 1.16, 64, 6, C.top) + S.box(0.62, 0.6, 0.16, 0.1, 70, 16, ["#FFFFFF", "#E95F4B", "#C9483A"]) + S.cyl(1.3, 0.7, 0.06, 70, 5, ["#F4B63F", "#D99A2B"]));
      if (f.variant) s += L(9, S.at(1.05, 1.1, 70, food(f.variant, 28)));
      s += L(2, seat(1.54, 0.79) + seat(0.79, 1.54)) + L(3, back(1.89, 0.79, 0.07, 0.42) + back(0.79, 1.89, 0.42, 0.07));
      return s;
    },
    // ドリンクバー（ジュースの きかい・コーヒー・コップ・こおり）
    drinkbar(S, f) {
      let s = S.box(0.02, 0.15, f.w - 0.04, 0.8, 0, 88, C.cream) + S.box(0, 0.12, f.w, 0.86, 88, 6, ["#8C7A6A", "#766455", "#655446"]);
      s += S.box(0.15, 0.2, 1.5, 0.55, 94, 96, ["#EEF2F5", "#CDD6DD", "#B7C2CB"]) + S.box(0.2, 0.2, 1.4, 0.2, 190, 14, ["#E95F4B", "#C9483A", "#B13F33"]);
      ["#F28B82", "#FFD54F", "#8FD19E", "#8EC5F4", "#F7B267", "#C7B8E8"].forEach((c, i) => { s += S.box(0.22 + i * 0.22, 0.74, 0.16, 0.04, 150, 22, [c, c, MallArt.shade(c, -0.2)]) + S.box(0.27 + i * 0.22, 0.6, 0.06, 0.1, 118, 12, C.leg); });
      s += S.box(1.9, 0.25, 0.7, 0.5, 94, 82, ["#5E5A60", "#4B474D", "#3E3A40"]) + S.box(2.0, 0.72, 0.5, 0.04, 150, 18, ["#F4ECE2", "#E0D6C8", "#CFC4B4"]);
      for (let k = 0; k < 3; k++) s += S.cyl(2.85 + (k % 2) * 0.28, 0.35 + Math.floor(k / 2) * 0.3, 0.12, 94, 30 + k * 4, ["#E6F4F8", "#C9E3EC"]);
      s += S.box(f.w - 0.9, 0.3, 0.7, 0.45, 94, 26, ["#D8EEF6", "#B9DCEA", "#A2CCDE"]);
      return s;
    },
    // キッチンの おく（コンロ・フライヤー・れいぞうこ・フード）
    kitchen(S, f) {
      let s = S.box(0.05, 0.1, f.w - 2.1, 0.85, 0, 86, C.steel);
      for (let i = 0; i < 3; i++) s += S.ellipse(0.5 + i * 1.2, 0.5, 86, 0.22, "#5B616C", 1.4) + S.ellipse(0.5 + i * 1.2, 0.5, 87, 0.12, "#E95F4B", 0);
      s += S.cyl(0.5, 0.52, 0.18, 88, 22, ["#8C8890", "#6E6A70"]) + S.box(2.6, 0.25, 0.9, 0.5, 86, 12, ["#E9C27B", "#C9A060", "#B08A4F"]);
      s += S.box(f.w - 2, 0.1, 1.9, 0.85, 0, 196, ["#F2F5F6", "#D6DDE2", "#C0C9D0"]) + S.line([[f.w - 1.1, 0.95, 60], [f.w - 1.1, 0.95, 170]], "#8C8890", 2.4) + S.line([[f.w - 0.95, 0.95, 60], [f.w - 0.95, 0.95, 170]], "#8C8890", 2.4);
      s += S.box(0.05, 0.08, f.w - 2.1, 0.7, 200, 40, C.steel);
      return s;
    },
    // うけわたしの カウンター（ヒートランプ・できた りょうり・ベル）
    pass(S, f) {
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.8, 0, 96, C.white) + S.box(0, 0.06, f.w, 0.88, 96, 6, C.steel);
      for (const u of [0.9, 2.3, 3.7, 5.1].filter((u) => u < f.w)) s += S.line([[u, 0.5, 102], [u, 0.5, 206]], "#8C8890", 2) + S.box(u - 0.3, 0.3, 0.6, 0.4, 184, 14, ["#F4B63F", "#D99A2B", "#C0871F"]);
      s += S.at(1.5, 0.55, 102, food("hamburg", 34)) + S.at(3.0, 0.55, 102, food("omurice", 34)) + S.at(4.4, 0.55, 102, food("kidsplate", 34));
      s += S.cyl(f.w - 0.45, 0.5, 0.12, 102, 10, ["#F4D35E", "#D4B03E"]);
      return s;
    },
    // デザートの ショーケース（ガラスの 中に パフェ・パンケーキ・プリン・ロールケーキ）
    dessertcase(S, f) {
      let s = S.box(0.04, 0.1, f.w - 0.08, 0.8, 0, 50, ["#F6E3D4", "#E3C8B2", "#CDB097"]);
      ["parfait", "pancake", "pudding", "rollcake", "deza_tart"].slice(0, Math.max(2, Math.floor(f.w * 1.6))).forEach((id, i, a) => { s += S.at(0.35 + (i * (f.w - 0.7)) / Math.max(1, a.length - 1), 0.5, 54, food(id, 28)); });
      s += S.poly([[0.04, 0.9, 50], [f.w - 0.04, 0.9, 50], [f.w - 0.04, 0.9, 112], [0.04, 0.9, 112]], "#DFF1F6", 1.4, `fill-opacity=".45"`) + S.poly([[0.04, 0.1, 112], [f.w - 0.04, 0.1, 112], [f.w - 0.04, 0.9, 112], [0.04, 0.9, 112]], "#EAF6FA", 1.4, `fill-opacity=".6"`);
      return s;
    },
    // レジ（おかねの きかい・ガムと あめの びん）
    fmregister(S, f) {
      let s = S.box(0.04, 0.12, f.w - 0.08, 0.76, 0, 96, C.wood) + S.box(0, 0.08, f.w, 0.84, 96, 6, C.top);
      s += S.box(f.w * 0.5, 0.25, 0.5, 0.4, 102, 20, ["#6E7480", "#5B616C", "#4B505A"]) + S.poly([[f.w * 0.5 + 0.06, 0.3, 122], [f.w * 0.5 + 0.44, 0.3, 122], [f.w * 0.5 + 0.44, 0.3, 140], [f.w * 0.5 + 0.06, 0.3, 140]], "#9FD1D9", 1.2);
      for (let k = 0; k < 3; k++) s += S.cyl(0.3 + k * 0.32, 0.5, 0.13, 102, 26, [["#F7C6D6", "#FFE29A", "#BDE3C8"][k], ["#E7A9BE", "#EFC876", "#9FCBAE"][k]]);
      return s;
    },
    // キッズ コーナー（いろの ある マット・つみき・えほんの たな・ぬいぐるみ）
    kidsmat(S, f) {
      let s = "";
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) s += S.poly([[x, y, 1], [x + 1, y, 1], [x + 1, y + 1, 1], [x, y + 1, 1]], ["#F7D8A8", "#BFE3D6", "#F4C2C8", "#C9D8F2"][(x + y * 2) % 4], 1);
      s += S.box(0.1, 0.08, 1.6, 0.4, 0, 70, C.wood) + [0, 1, 2, 3, 4].map((i) => S.box(0.18 + i * 0.3, 0.12, 0.2, 0.08, 70, 26, [["#F28B82", "#8EC5F4", "#FFD54F", "#8FD19E", "#C7B8E8"][i], "#D9D2C4", "#C4BCAD"])).join("");
      for (const [x, y, c] of [[1.2, 1.2, "#F28B82"], [1.5, 1.3, "#8EC5F4"], [1.35, 1.0, "#FFD54F"]]) s += S.box(x, y, 0.22, 0.22, 1, 18, [c, MallArt.shade(c, -0.1), MallArt.shade(c, -0.2)]);
      s += S.at(2.3, 1.2, 1, `<circle cy="-20" r="15" fill="#F7E3C8" stroke="${INK}" stroke-width="1.6"/><circle cx="-10" cy="-33" r="6" fill="#F7E3C8" stroke="${INK}" stroke-width="1.6"/><circle cx="10" cy="-33" r="6" fill="#F7E3C8" stroke="${INK}" stroke-width="1.6"/><circle cx="-5" cy="-22" r="1.8" fill="${INK}"/><circle cx="5" cy="-22" r="1.8" fill="${INK}"/>`);
      return s;
    },
    // はいぜん ロボ（ねこの かおの 画面・3だんの トレイ）
    robot(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.36, "#00000018", 0) + S.cyl(0.5, 0.5, 0.3, 0, 16, ["#F2F2F4", "#CFCFD6"]);
      s += S.cyl(0.5, 0.5, 0.1, 16, 80, ["#E8E8EE", "#C8C8D2"]);
      for (const z of [34, 58, 82]) s += S.cyl(0.5, 0.5, 0.28, z, 4, ["#FFFFFF", "#D8D8E0"]);
      s += S.at(0.5, 0.5, 60, food("hamburg", 22)) + S.cyl(0.5, 0.5, 0.26, 96, 30, ["#FDFDFE", "#DADAE4"]);
      s += S.at(0.5, 0.5, 108, `<ellipse rx="15" ry="10" fill="#3E3A40" stroke="${INK}" stroke-width="1.4"/><path d="M-7,-2 q2,-3 4,0 M3,-2 q2,-3 4,0" fill="none" stroke="#9FE3F7" stroke-width="1.8" stroke-linecap="round"/><path d="M-3,3 q3,2 6,0" fill="none" stroke="#F7A8C4" stroke-width="1.6" stroke-linecap="round"/><path d="M-15,-6 L-12,-16 L-6,-9 M15,-6 L12,-16 L6,-9" fill="#FDFDFE" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`);
      return s;
    },
    // 入口の たて看板（きょうの おすすめ）
    menuboard(S, f) {
      return S.ellipse(0.5, 0.5, 0, 0.35, "#00000014", 0) + S.poly([[0.2, 0.55, 0], [0.8, 0.55, 0], [0.7, 0.5, 110], [0.3, 0.5, 110]], "#3E4A44", 1.4) + S.at(0.5, 0.52, 66, `<rect x="-14" y="-26" width="28" height="30" rx="3" fill="#FFF8EA" stroke="${INK}" stroke-width="1.2"/>` + food("hamburg", 18).replace('y="-14.4"', 'y="-24"') + txt(0, 1, 6, "おすすめ", INK));
    },
    // ごあんないの 台
    podium(S, f) {
      return S.box(0.2, 0.2, 0.6, 0.5, 0, 92, C.wood) + S.box(0.15, 0.15, 0.7, 0.6, 92, 5, C.top) + S.box(0.35, 0.3, 0.3, 0.2, 97, 8, ["#FFFFFF", "#E0DAD0", "#C9C1B3"]);
    },
    // ひくい しきり（上に みどり）
    partition(S, f) {
      let s = S.box(0.3, 0.05, 0.4, f.h - 0.1, 0, 70, C.wood);
      for (let v = 0.3; v < f.h; v += 0.45) s += S.at(0.5, v, 70, `<circle r="12" fill="#9DC08B" stroke="${INK}" stroke-width="1.3"/><circle cx="-6" cy="-6" r="8" fill="#B6D3A0" stroke="${INK}" stroke-width="1.2"/>`);
      return s;
    },
  };
  // あかりの ついた ヒートランプ・ロボの うごき（毎フレーム）
  const L = {
    pass(ctx, sc, f, off) {
      const s = sc.s; for (const u of [0.9, 2.3, 3.7, 5.1].filter((u) => u < f.w)) { const q = sc.toScreen(IsoVenue.p(f.x + u, f.y + 0.5, 178), off), gr = ctx.createRadialGradient(q.x, q.y, 1, q.x, q.y, 34 * s * 2); gr.addColorStop(0, "rgba(255,200,110,0.55)"); gr.addColorStop(1, "rgba(255,200,110,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(q.x, q.y, 34 * s * 2, 0, 7); ctx.fill(); }
    },
  };
  // ---- 床と かべ ----
  const MAT = { fmwood: { c: ["#DDB88E", "#D5AF84"], line: "#B98E66", pat: "plank" }, fmtile: { c: ["#F4EFE6", "#E9E2D6"], line: "#D5CBBB", pat: "check" }, fmkids: { c: ["#CDEBDF", "#C3E4D7"], line: "#A9D3C3", pat: "tile" } };
  const wallSvg = (r, side) => {
    const Tt = IsoVenue.T, Lw = (side === "north" ? r.w : r.h) * Tt, Hh = r.wallH || 300, V = (z) => Hh - z, u = (tile) => (side === "north" ? tile : r.h - tile) * Tt;
    const R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" ${extra}/>`;
    let s = R(0, 0, Lw, Hh, "#FFF1DE") + R(0, V(300), Lw, 56, "#E95F4B") + `<path d="M0,${V(244)} H${Lw}" stroke="${INK}" stroke-width="2"/>`;
    for (let x = 12; x < Lw; x += 36) s += `<circle cx="${x}" cy="${V(272)}" r="5" fill="#FFE9A8" stroke="#B13F33" stroke-width="1.2"/>`;
    s += R(0, V(72), Lw, 72, "#C99A6B") + `<path d="M0,${V(72)} H${Lw}" stroke="#8E6440" stroke-width="4"/>`;
    for (let x = 24; x < Lw; x += 48) s += `<path d="M${x},${V(66)} V${V(8)}" stroke="#B58657" stroke-width="2"/>`;
    // まど（そとの みどりと そら・ブラインドが すこし おりて いる）
    const win = (a, b) => {
      const x0 = Math.min(u(a), u(b)) + 10, x1 = Math.max(u(a), u(b)) - 10, top = V(232), bot = V(96), w = x1 - x0, h = bot - top;
      let t = R(x0 - 6, top - 6, w + 12, h + 12, "#8C6A4A", `rx="4" stroke="${INK}" stroke-width="2"`) + R(x0, top, w, h, "#CDEBF7");
      for (let k = 0; k < Math.ceil(w / 60); k++) { const cx = x0 + 30 + k * 60 + ((k * 17) % 13); t += `<circle cx="${f2(Math.min(cx, x1 - 16))}" cy="${f2(bot - 26 - (k % 2) * 10)}" r="${22 + (k % 3) * 4}" fill="${["#9CCB86", "#B6D3A0", "#86AE78"][k % 3]}" stroke="${INK}" stroke-width="1.2"/>`; }
      t += R(x0, bot - 14, w, 14, "#E6D9C2");
      for (let y = top + 4; y < top + h * 0.34; y += 7) t += `<path d="M${f2(x0)},${f2(y)} H${f2(x1)}" stroke="#F4EDE2" stroke-width="5"/>`;
      for (let x = x0 + w / 3; x < x1 - 2; x += w / 3) t += `<path d="M${f2(x)},${f2(top)} V${f2(bot)}" stroke="#8C6A4A" stroke-width="5"/>`;
      return t + `<path d="M${f2(x0 + 12)},${f2(top + h * 0.45)} l26,-26 M${f2(x0 + 22)},${f2(top + h * 0.6)} l34,-34" stroke="#FFFFFF" stroke-width="4" opacity=".7"/>`;
    };
    const poster = (a, b, z0, z1, lines, id, col) => {
      const x0 = Math.min(u(a), u(b)) + 8, x1 = Math.max(u(a), u(b)) - 8, w = x1 - x0, cx = x0 + w / 2;
      return R(x0, V(z1), w, z1 - z0, "#FFFDF5", `rx="6" stroke="${INK}" stroke-width="2"`) + R(x0 + 6, V(z1) + 6, w - 12, (z1 - z0) * 0.56, col, `rx="4"`) + (id ? img(Art.iconSvg("bag", id), cx - 34, V(z1) + 8, 68, 60) : "") + lines.map((l, i) => txt(cx, V(z0) - 30 + i * 17, 14, l)).join("");
    };
    const sign = (a, b, z, text, col = "#FFE07A") => { const x0 = Math.min(u(a), u(b)) + 6, x1 = Math.max(u(a), u(b)) - 6; return R(x0, V(z) - 22, x1 - x0, 34, col, `rx="10" stroke="${INK}" stroke-width="2"`) + txt((x0 + x1) / 2, V(z) + 3, 18, text); };
    if (side === "north") {
      s += win(0.5, 3.5) + win(3.5, 6.5) + win(6.5, 9.5);
      s += sign(10.8, 15.2, 216, "ドリンクバー", "#BDE3F4") + poster(12.2, 14.2, 120, 196, ["おかわり", "じゆう！"], "cocoa", "#FCE3C4");
      // キッチンの しろい タイル・おさらの たな
      s += R(u(16), V(244), u(22) - u(16), 172, "#F7F8F5");
      for (let x = u(16); x < u(22); x += 24) s += `<path d="M${x},${V(244)} V${V(72)}" stroke="#DCE2E0" stroke-width="1.4"/>`;
      for (let z = 96; z < 244; z += 24) s += `<path d="M${u(16)},${V(z)} H${u(22)}" stroke="#DCE2E0" stroke-width="1.4"/>`;
      s += R(u(16.3), V(150), u(19.6) - u(16.3), 8, "#B9885A") + [0, 1, 2, 3, 4, 5].map((k) => `<ellipse cx="${f2(u(16.6) + k * 26)}" cy="${f2(V(164))}" rx="11" ry="12" fill="#FFFFFF" stroke="${INK}" stroke-width="1.4"/>`).join("") + sign(16.2, 19.8, 222, "キッチン", "#FFFFFF");
      s += txt(u(5), V(262), 30, "ファミリーレストラン びっくぽ", "#FFFFFF", `stroke="#B13F33" stroke-width="1.5"`);
    } else {
      s += win(13.5, 10.5) + win(10.5, 7.5) + win(7.5, 4.5);
      s += poster(3.9, 1.6, 104, 214, ["きょうの おすすめ", "じゅわっと ハンバーグ"], "hamburg", "#FCE3C4") + poster(15.8, 14.1, 110, 200, ["キッズ", "メニュー"], "kidsplate", "#D8EEF6");
    }
    s += R(0, V(10), Lw, 10, "#8E6440") + `<path d="M0,${V(10)} H${Lw}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Lw} ${Hh}">${s}</svg>`, L: Lw, H: Hh };
  };

  // ---- 館の 配置（22×16）----
  function room() {
    const rows = Array.from({ length: H }, () => Array(W).fill("."));
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    paint("t", 13, 10, 21, 15); paint("t", 15, 0, 21, 4); paint("#", 16, 1, 21, 2); paint("k", 0, 13, 2, 15);
    const F = [], add = (o) => (F.push(o), o);
    const order = (x, y, w, h, extra) => add({ x, y, w, h, action: "order", ...extra });
    // まどぎわの ボックス席（北）・かべぞいの ボックス席（西）
    // ほかの おきゃくさんが すわって いる 席は taken（タップすると あいている 席へ。js/dine-seats.js）
    [[1, "a"], [4, ""], [7, "b"]].forEach(([x, v], i) => order(x, 0, 3, 2, { kind: "booth", dir: "y", variant: v, taken: !!GUESTS[v], height: 104, label: "まどぎわの ボックス席 " + (i + 1), spots: [[x + 1, 2]] }));
    [[4, "c"], [7, ""], [10, "d"]].forEach(([y, v], i) => order(0, y, 2, 3, { kind: "booth", dir: "x", variant: v, taken: !!GUESTS[v], height: 104, label: "かべぞいの ボックス席 " + (i + 1), spots: [[2, y + 1]] }));
    // 4にんがけの テーブル
    [[5, 5, ""], [9, 5, "pancake"], [5, 9, ""], [9, 9, ""]].forEach(([x, y, v], i) => order(x, y, 2, 2, { kind: "fmtable", variant: v, height: 84, label: "テーブル " + (i + 1), spots: [[x - 1, y + 1], [x + 2, y], [x, y + 2]] }));
    add({ kind: "drinkbar", x: 11, y: 0, w: 4, h: 1, height: 204, label: "ドリンクバー", action: "drink", spots: [[12, 1], [13, 1]] });
    // キッチン（おくは はいれない）・うけわたしの カウンター（バーガーの おてつだい）
    add({ kind: "kitchen", x: 16, y: 0, w: 6, h: 1, height: 240 });
    add({ kind: "npc", sp: "pig", ci: 0, x: 17, y: 1, w: 1, h: 1, dir: "down", emo: "happy", outfit: { head: "chefhat", body: "apron" } });
    add({ kind: "npc", sp: "bear", ci: 1, x: 20, y: 2, w: 1, h: 1, dir: "left", emo: "happy", outfit: { head: "chefhat" } });
    add({ kind: "pass", x: 16, y: 3, w: 6, h: 1, height: 206, label: "キッチンの カウンター", action: "kitchen", spots: [[17, 4], [18, 4], [19, 4], [20, 4]] });
    // レジ・デザートの ショーケース・ごあんない・まちあいの いす・たて看板
    add({ kind: "dessertcase", x: 13, y: 11, w: 3, h: 1, height: 112, label: "デザートの ショーケース", action: "info", text: "パフェ・パンケーキ・プリン・ロールケーキ。\nテーブルで たのめるよ。", spots: [[14, 12]] });
    add({ kind: "fmregister", x: 16, y: 11, w: 3, h: 1, height: 140, label: "レジ（おもちかえり）", action: "register", spots: [[17, 12], [18, 12]] });
    add({ kind: "npc", sp: "cat", ci: 1, x: 17, y: 10, w: 1, h: 1, dir: "down", emo: "happy", outfit: { body: "apron" } });
    add({ kind: "podium", x: 20, y: 11, w: 1, h: 1, height: 100, label: "ごあんない", action: "info", text: "いらっしゃいませ！ おすきな おせきへ どうぞ。\nボックス席も テーブルも えらべるよ。", spots: [[20, 12]] });
    add({ kind: "bench", x: 20, y: 7, w: 2, h: 1, height: 46, label: "まちあいの いす", action: "sit", text: "まちあいの いすで ひとやすみ。", spots: [[20, 8]] });
    add({ kind: "menuboard", x: 15, y: 14, w: 1, h: 1, height: 110, label: "きょうの おすすめ", action: "info", text: "きょうの おすすめは じゅわっと ハンバーグ。\nおこさまランチには はたが たって いるよ。", spots: [[16, 14]] });
    // キッズ コーナー・しきり・うえきばち・はいぜん ロボ
    add({ kind: "kidsmat", x: 0, y: 13, w: 3, h: 2, walk: false, height: 70, label: "キッズ コーナー", action: "kids", spots: [[3, 13], [1, 15]] });
    add({ kind: "partition", x: 3, y: 5, w: 1, h: 2, height: 90 }); add({ kind: "partition", x: 3, y: 9, w: 1, h: 2, height: 90 });
    for (const [x, y, v] of [[10, 0, "tree"], [15, 5, "tree"], [21, 13, ""], [12, 14, ""]]) add({ kind: "planter", x, y, w: 1, h: 1, height: v ? 150 : 70, variant: v });
    add({ kind: "robot", x: 13, y: 5, w: 1, h: 1, walk: true, height: 120, label: "はいぜん ロボ", action: "info", text: "はいぜん ロボ「ごちゅうもんの おりょうりを はこびます ニャ〜」", robot: true });
    // おきゃくさん（立って いる 人）
    add({ kind: "npc", sp: "fox", ci: 0, x: 14, y: 1, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "ドリンクバーの メロンソーダ、だいすき！", spots: [[14, 2]] });
    add({ kind: "npc", sp: "deer", ci: 1, x: 19, y: 13, w: 1, h: 1, dir: "up", emo: "normal", label: "おきゃくさん", action: "info", text: "ハンバーグ、たのしみだなあ。", spots: [[18, 13]] });
    // 入口（マット。手前の ふちで そとへ）
    add({ kind: "exitMat", x: 17, y: 15, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[17, 14], [18, 14], [20, 14]] });
    return {
      id: "bikkupo1", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), mats: { ".": "fmwood", t: "fmtile", k: "fmkids", "#": "fmtile" }, wallH: 300, scale: 0.5, spawn: [18, 14], crowd: 2, exit: [17, 14, 21, 16], bgm: "bikkupo_hall",
      title: "レストラン びっくぽ", fixtures: F,
    };
  }

  // ---- しらべる・たべる ----
  const say = (id, f) => ({ wanko: f.deza ? "わん！ デザ、だいすき♡" : "わん！ " + f.name + "、おいしい〜！", gachan: f.deza ? "あまくて しあわせ〜♪" : "ほっぺが おちそう！", goji: "ガゥー♡ おいしい！" })[id] || "おいしいね！";
  const art = Object.create(MallArt);
  Object.assign(art, {
    M: { ...MallArt.M, ...M }, L: { ...MallArt.L, ...L }, MAT: { ...MallArt.MAT, ...MAT }, models: new Map(),
    modelKey(f) { return "bikkupo:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant || "") + ":" + (f.dir || "") + (f._layer != null ? ":L" + f._layer : ""); },
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = wallSvg(r, side); jobs.push(SvgCache.ensure("bikkupowall:" + side + ":" + r.w + "x" + r.h, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
    },
    paint(g, r) { this.paintFloor(g, r); this.paintWalls(g, r); },
    wallSvg,
    backdrop() { return ["#E4D6C2", "#F5EDE2"]; },
    over(ctx, sc, r, floor, off) {
      const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), band = (a, b, c, d, fill) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); };
      band(P(0, r.h, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(0, r.h, 16), "#A9754A");
      band(P(r.w, 0, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(r.w, 0, 16), "#93643E");
    },
    async interact(sc, f) {
      if (f.action === "leave") { sc.leave(); return true; }
      if (!["order", "drink", "kitchen", "register", "kids"].includes(f.action)) return false;
      sc.busy = true;
      try {
        if (f.action === "order") await this.order(sc, f);
        else if (f.action === "drink") await this.drink(sc);
        else if (f.action === "kitchen") await this.kitchen(sc);
        else if (f.action === "register") await ShopUI.open("bikkupo");
        else if (f.action === "kids") { sc.sitting = 4; for (const id of Save.d.order) Save.care(id, { mood: 2 }); Save.write(); Sound.se("good"); await UI.say([{ name: "キッズ コーナー", text: "つみきと えほんで ひとやすみ。\n3人とも にこにこ！" }]); }
      } finally { sc.busy = false; }
      return true;
    },
    // メニュー: ごはん か デザート → しなもの（3人 いっしょに たべる・ねだんは 3人ぶん）。
    // O7: 3人が ボックス席・テーブルの せきに すわってから メニューを ひらく → はいぜん ロボが きて おさらが でる → たべおわると たつ（js/dine-seats.js）。
    // ほかの おきゃくさんが いる 席は あいている 席へ
    async order(sc, f) {
      const D = typeof DineSeats !== "undefined" ? DineSeats : null; if (D && D.redirect(sc, f)) return;
      const seated = D && D.can(sc, f) ? await D.sit(sc, f) : false;
      try {
        const k = await UI.ask(f.label + "\nメニューを ひらいた。なにに する？", ["ごはん", "デザート", "やめておく"]); if (k !== 0 && k !== 1) return;
        const ids = k === 0 ? MENU.meal : MENU.dessert, i = await UI.ask(k === 0 ? "ごはんの メニュー\n3にん いっしょに たべよう。" : "デザートの メニュー\n3にん いっしょに たべよう。", [...ids.map((id) => `${BAG_INDEX[id].name}（${BAG_INDEX[id].price}コイン）`), "やめておく"]);
        if (i < 0 || i >= ids.length) return;
        const food = BAG_INDEX[ids[i]]; if (Save.d.coins < food.price) { UI.toast("コインが たりないよ"); return; }
        Save.d.coins -= food.price; for (const id of Save.d.order) Save.care(id, { hunger: food.hunger, mood: food.mood }); Save.write(); UI.updateHud();
        if (typeof GowagaWish !== "undefined") GowagaWish.signal("eat", food.id); // せきで たべても「たべたい」の おねがいが かなう（UI-78）
        this.robotGo(sc, f); Sound.se("good");
        if (seated) { const r = sc.fixtures.find((o) => o.robot); await D.until(() => !r || !r.goal, 5); await D.serve(sc, food.id); } else sc.sitting = 6;
        await UI.say([{ name: "はいぜん ロボ", text: "おまたせ しました ニャ〜。\n" + food.name + " です。" }, ...Save.d.order.map((id) => ({ who: id, emo: "happy", text: say(id, food) }))]);
        sc.lastMeal = food.id;
      } finally { if (seated) await D.stand(sc); }
    },
    async drink(sc) {
      const i = await UI.ask("ドリンクバー\nジュース・ココア・メロンソーダ。3にんで " + MENU.drink + "コイン。", ["のむ（" + MENU.drink + "コイン）", "やめておく"]); if (i !== 0) return;
      if (Save.d.coins < MENU.drink) { UI.toast("コインが たりないよ"); return; }
      Save.d.coins -= MENU.drink; for (const id of Save.d.order) Save.care(id, { mood: 6, hunger: 4 });
      Save.write(); UI.updateHud(); Sound.se("good"); sc.sitting = 4;
      await UI.say([{ who: "gachan", emo: "happy", text: "メロンソーダ、しゅわしゅわ〜！" }, { who: "wanko", emo: "happy", text: "ココアも あったかい！" }, { who: "goji", emo: "happy", text: "ガゥ♪ おかわり！" }]);
    },
    // キッチンの おてつだい（バーガー）。おわると 店の 中の カウンターの まえに もどる
    async kitchen(sc) {
      const lv = ShopRewards.level(Save.d.shops.burger), i = await UI.ask("コックの バンズさん\n" + SHOPS.burger.desc + "。\nおみせ Lv." + lv, ["おてつだいする", "また あとで"]); if (i !== 0) return;
      if (Chara.IDS.some((id) => Save.d.chars[id].hunger < 8)) { await UI.say([{ who: "wanko", emo: "sad", text: "おなかが ぺこぺこだよ〜。\nごはんを たべてから おてつだい しよう。" }]); return; }
      Game.goto("shop", { shop: "burger", back: sc.back, returnVenue: { venue: "bikkupo", floor: 1, back: sc.back, at: [18, 4] } });
    },
    // はいぜん ロボ: たのんだ せきの まえまで いって もどる（ゆかの マスを なめらかに）
    robotGo(sc, f) { const r = sc.fixtures.find((o) => o.robot); if (!r) return; const to = (f.spots && f.spots[0]) || [f.x, f.y + f.h]; r.goal = [to[0], to[1]]; r.home = r.home || [r.x, r.y]; r.wait = 0; },
    tick(sc, dt) {
      walkCrowd(sc, dt);
      const r = sc.fixtures && sc.fixtures.find((o) => o.robot); if (!r) return;
      const goal = r.goal || (r.home && (r.wait -= dt) <= 0 ? r.home : null); if (!goal) return;
      const dx = goal[0] - r.x, dy = goal[1] - r.y, d = Math.hypot(dx, dy), v = 2.4 * dt;
      if (d <= v) { r.x = goal[0]; r.y = goal[1]; if (r.goal) { r.goal = null; r.wait = 3; } else if (r.home && goal === r.home) r.home = null; return; }
      if (Math.abs(dx) > 0.01) r.x += Math.sign(dx) * Math.min(Math.abs(dx), v); else r.y += Math.sign(dy) * Math.min(Math.abs(dy), v);
    },
  });
  // あるく おきゃくさん（MallArt の crowd）。IkeArcade と おなじ 動かしかた
  function walkCrowd(sc, dt) {
    for (const m of art.crowd(sc)) {
      m.anim += dt;
      if (m.t < 1) { m.t = Math.min(1, m.t + dt / 0.45); continue; }
      m.fx = m.tx; m.fy = m.ty;
      if (m.path.length) { const [x, y] = m.path.shift(); if (!sc.walkable(x, y)) { m.path = []; continue; } m.dir = x > m.tx ? "right" : x < m.tx ? "left" : y > m.ty ? "down" : "up"; m.tx = x; m.ty = y; m.t = 0; continue; }
      if ((m.wait -= dt) <= 0) { m.path = art.crowdRoute(sc, m).slice(0, 10); m.wait = 2 + Math.random() * 4; if (!m.path.length) m.dir = "down"; }
    }
  }

  function install() {
    VenueHalls.defs.bikkupo = { name: "レストラン びっくぽ", iso: true, art, bgm: "bikkupo_hall", floors: { 1: room() } };
    const owner = { sp: "cat", name: "ねこの ミルフィ", outfit: { body: "apron" }, look: { eye: "smile", cheek: "pink" } };
    BUY_SHOPS.bikkupo = { name: "びっくぽ の レジ", keeper: owner, keeperName: "てんいんの ミルフィ", hello: ["ありがとうございました！ おもちかえりも できますよ。"], kind: "bag", tabs: [["goods", "おもちかえり"]], items: () => ["hamburg", "omurice", "kidsplate", "pancake", "candy"].map((id) => BAG_INDEX[id]).filter(Boolean) };
    // 店内 BGM: パッヘルベル「カノン」（パブリックドメイン。ディスクの 写し）を ファミレスの しずかな 音で
    const src = SONGS.disc_canon, inst = ["pad", "pluck", "bass", "mallet"];
    if (src) { SONGS.bikkupo_hall = { ...src, title: "びっくぽ（カノン）", disc: false, bpm: 84, tracks: src.tracks.map((t, k) => (t.drum ? t : { ...t, instrument: inst[k] || t.instrument })) }; SONGS.shop_bikkupo = SONGS.bikkupo_hall; }
  }
  install();
  return { W, H, MENU, art, room };
})();
