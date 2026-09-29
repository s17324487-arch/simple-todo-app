// ひだまり アパート（ネリカスタウン。オーナーの FB 2026-09-29「薄いグレーの 要素は、実際に 中に 入れたり …」）。
// サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・20×14 マス・2かいだて）。かべを ひくく した ドールハウスの ように、へやの 中が 見える。
// 1F: 101（ひつじの メリーさん・たたみと こたつ）・102（パンダの おやこ・ソファと おもちゃばこ）・ろうか・ゆうびんうけ・けいじばん・かんりにんさんの まどぐち・ちゅうりんじょう・かいだん。
// 2F: 201（いぬの ケンタ・ギター）・202（ことりの ピッコ・かきかけの え）・ベランダ（せんたくもの・ベンチ・てすりから 町を ながめる）。
// 家具は おうちと おなじ 立体（HomeDesign.model）を そのまま おく。モデルの キーは 家具の id・大きさ・むきだけ（有限）。
const NeriApart = (() => {
  const W = 20, H = 14, T = () => IsoVenue.T;
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${fill}" ${extra}>${t}</text>`;
  const ln = (d, w = 2.4, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const C = {
    wall: ["#E9DCC4", "#F6EEDC", "#E4D8C2"], wood: ["#D2A26F", "#B9885A", "#A2754B"], metal: ["#DCE2E6", "#BCC5CC", "#A5AFB7"],
    cork: ["#D9A066", "#C28A52", "#AD7A48"], step: ["#E6DDCB", "#CFC3AE", "#BBAE98"], white: ["#F7F4EE", "#DFD8CC", "#C9C1B3"],
  };
  // 立ったまま 見える 小物（画面の むきの 絵。S.at で 床の 点に おく）
  const SPRITE = {
    guitar: `<g transform="translate(0 -6)">${ln("M-10,0 L0,-26 L10,0", 3)}<ellipse cx="0" cy="-40" rx="15" ry="18" fill="#E8A45C" stroke="${INK}" stroke-width="2.6"/><ellipse cx="0" cy="-58" rx="11" ry="12" fill="#E8A45C" stroke="${INK}" stroke-width="2.6"/><circle cx="0" cy="-46" r="5" fill="#5E4632"/><rect x="-3" y="-100" width="6" height="40" rx="2" fill="#8C6A4A" stroke="${INK}" stroke-width="2.2"/><rect x="-5" y="-108" width="10" height="10" rx="2" fill="#5E4632" stroke="${INK}" stroke-width="2"/>${ln("M-1.5,-100 V-30 M1.5,-100 V-30", 0.8, "#F4EDE2")}</g>`,
    easel: `${ln("M-22,0 L-6,-96 M22,0 L6,-96 M0,-96 L0,6", 3.4, "#8C6A4A")}<rect x="-30" y="-92" width="60" height="50" rx="3" fill="#FFFDF5" stroke="${INK}" stroke-width="2.6"/><rect x="-26" y="-88" width="52" height="42" fill="#CDEBF7"/><path d="M-26,-54 Q-8,-72 8,-60 Q18,-54 26,-62 V-46 H-26 Z" fill="#8FD19E"/><circle cx="14" cy="-78" r="6" fill="#FFD54F"/><path d="M-12,-60 l0,-10 l6,0 l0,10 M-18,-66 h18" fill="none" stroke="#E8766A" stroke-width="2.2"/>${ln("M-34,-40 H34", 3.4, "#8C6A4A")}`,
    canvases: [0, 1, 2].map((i) => `<g transform="translate(${-26 + i * 24} ${-4 + i * 2}) rotate(${-8 + i * 6})"><rect x="-14" y="-52" width="28" height="44" rx="2" fill="#FFFDF5" stroke="${INK}" stroke-width="2.2"/><rect x="-11" y="-49" width="22" height="30" fill="${["#F4A6B8", "#8EC5F4", "#F7D56A"][i]}"/><circle cx="${[-3, 4, 0][i]}" cy="-38" r="5" fill="${["#FFFFFF", "#FFD54F", "#8FD19E"][i]}"/></g>`).join(""),
    bike: (col) => `<g><circle cx="-18" cy="-14" r="13" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="18" cy="-14" r="13" fill="none" stroke="${INK}" stroke-width="3"/>${ln("M-18,-14 L-4,-34 L12,-34 L18,-14 M-4,-34 L2,-14 L-18,-14 M12,-34 L10,-44 M4,-44 H16 M-6,-38 H4", 3.2, col)}<rect x="-10" y="-42" width="12" height="4" rx="2" fill="#5E5A60"/></g>`,
    shirt: (col) => `<path d="M-12,0 L-12,-18 L-18,-14 L-22,-22 L-10,-30 L10,-30 L22,-22 L18,-14 L12,-18 L12,0 Z" fill="${col}" stroke="${INK}" stroke-width="2"/>`,
    towel: (col) => `<rect x="-9" y="-30" width="18" height="30" rx="2" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M-9,-8 H9" stroke="#FFFFFF" stroke-width="2.4"/>`,
  };
  const M = {
    // おうちの 家具（HomeDesign.model。まえの ふちの まんなかを 床の マスの まんなかに あわせる）
    furn(S, f) {
      const m = HomeDesign.model(f.furn, { flip: !!f.flip }); if (!m) return "";
      const q = S.P(f.w / 2, (f.h * T() + m.footD) / 2 / T(), 0), x = q.x + m.x, y = q.y + m.y;
      S.grow(x, y, x + m.w, y + m.h);
      return S.ellipse(f.w / 2, f.h / 2, 0, Math.min(f.w, f.h) * 0.45, "#00000010", 0) + `<image href="${U.svgUrl(m.full)}" x="${f2(x)}" y="${f2(y)}" width="${f2(m.w)}" height="${f2(m.h)}"/>`;
    },
    // ひくい かべ（へやと ろうかの あいだ・へやと へやの あいだ）。plate が あれば へやの ばんごう
    aptwall(S, f) {
      const alongX = f.h === 1 && f.w >= 1 && f.dir !== "y";
      let s = alongX ? S.box(0, 0.36, f.w, 0.28, 0, 8, C.wood) + S.box(0, 0.38, f.w, 0.24, 8, 56, C.wall) : S.box(0.36, 0, 0.28, f.h, 0, 8, C.wood) + S.box(0.38, 0, 0.24, f.h, 8, 56, C.wall);
      if (f.plate) { const q = S.P(0.45, 0.62, 44); s += `<g transform="translate(${f2(q.x)} ${f2(q.y)})"><rect x="-14" y="-8" width="28" height="15" rx="3" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt(0, 4, 11, f.plate)}</g>`; }
      return s;
    },
    // ゆうびんうけ（ちいさな とびら 2だん×5）
    mailboxes(S, f) {
      let s = S.box(0.1, 0.3, f.w - 0.2, 0.5, 0, 104, C.metal);
      for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
        const x0 = 0.2 + i * ((f.w - 0.4) / 5), x1 = x0 + (f.w - 0.4) / 5 - 0.06, z0 = 18 + row * 42, z1 = z0 + 34;
        s += S.poly([[x0, 0.8, z0], [x1, 0.8, z0], [x1, 0.8, z1], [x0, 0.8, z1]], "#EEF2F5", 1.2) + S.line([[x0 + 0.06, 0.8, z1 - 8], [x1 - 0.06, 0.8, z1 - 8]], INK, 1.4);
      }
      return s + S.at(f.w / 2 - 0.3, 0.8, 70, `<rect x="-10" y="-8" width="20" height="10" rx="2" fill="#FFFFFF" stroke="${INK}" stroke-width="1"/>`);
    },
    // かんりにんさんの まどぐち（カウンターと ガラスの まど・よびりん）
    kanri(S, f) {
      let s = S.box(0, 0.3, f.w, 0.7, 0, 70, C.wood);
      s += S.poly([[0, 0.3, 70], [f.w, 0.3, 70], [f.w, 0.3, 150], [0, 0.3, 150]], "#CDEBF799", 1.6) + S.line([[f.w / 2, 0.3, 70], [f.w / 2, 0.3, 150]], INK, 2.2) + S.box(0, 0.25, f.w, 0.1, 150, 12, C.wood);
      s += S.cyl(f.w - 0.5, 0.65, 0.1, 70, 8, ["#F7C948", "#D9A12B"]) + S.at(0.9, 1.0, 34, `<rect x="-26" y="-10" width="52" height="18" rx="4" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt(0, 4, 12, "かんりにん")}`);
      return s;
    },
    // アパートの けいじばん（コルクと おしらせの かみ）
    noticeboard(S, f) {
      let s = S.box(0.2, 0.5, 0.08, 0.08, 0, 70, C.wood) + S.box(0.72, 0.5, 0.08, 0.08, 0, 70, C.wood) + S.box(0.08, 0.42, 0.84, 0.14, 70, 70, C.cork);
      ["#FFFDF5", "#F4A6B8", "#BDE3F4", "#FFF3B0"].forEach((col, i) => { const x0 = 0.14 + (i % 2) * 0.38, z0 = 80 + Math.floor(i / 2) * 30; s += S.poly([[x0, 0.56, z0], [x0 + 0.32, 0.56, z0], [x0 + 0.32, 0.56, z0 + 24], [x0, 0.56, z0 + 24]], col, 1.1); });
      return s;
    },
    // ちゅうりんじょう（ラックと じてんしゃ 3だい）
    bikes(S, f) {
      let s = S.box(0.1, 0.2, f.w - 0.2, 0.12, 0, 40, C.metal);
      ["#E8766A", "#8EC5F4", "#8FD19E"].forEach((col, i) => { s += S.at(0.7 + i * ((f.w - 1.2) / 2), 1.2, 0, SPRITE.bike(col)); });
      return s;
    },
    // かいだん（1F は きたへ のぼる・2F は てすりで かこんだ おりぐち）
    stairs(S, f) {
      let s = "";
      if (f.variant === "down") {
        s += S.poly([[0.1, 0.1, 0], [f.w - 0.1, 0.1, 0], [f.w - 0.1, f.h - 0.1, 0], [0.1, f.h - 0.1, 0]], "#6E6256", 1.6);
        for (let i = 0; i < 4; i++) s += S.poly([[0.2, 0.3 + i * 0.5, 0], [f.w - 0.2, 0.3 + i * 0.5, 0], [f.w - 0.2, 0.62 + i * 0.5, 0], [0.2, 0.62 + i * 0.5, 0]], ["#CFC3AE", "#B9AD98", "#A39784", "#8E8272"][i], 0.8);
        for (const [x, y] of [[0.1, 0.1], [f.w - 0.1, 0.1], [0.1, f.h - 0.1], [f.w - 0.1, f.h - 0.1]]) s += S.line([[x, y, 0], [x, y, 72]], INK, 2.6);
        s += S.line([[0.1, f.h - 0.1, 72], [0.1, 0.1, 72], [f.w - 0.1, 0.1, 72], [f.w - 0.1, f.h - 0.1, 72]], "#8C6A4A", 4);
        return s;
      }
      const n = 6, d = f.h / n;
      for (let i = n - 1; i >= 0; i--) s += S.box(0.1, f.h - (i + 1) * d, f.w - 0.2, d, 0, (i + 1) * 30, C.step, 1.3);
      s += S.line([[f.w - 0.08, f.h, 90], [f.w - 0.08, 0, 90 + n * 30]], "#8C6A4A", 4) + S.line([[f.w - 0.08, f.h, 0], [f.w - 0.08, f.h, 90]], INK, 2.4);
      return s;
    },
    guitar(S, f) { return S.ellipse(0.5, 0.5, 0, 0.32, "#00000014", 0) + S.at(0.5, 0.6, 0, SPRITE.guitar); },
    easel(S, f) { return S.ellipse(0.5, 0.5, 0, 0.38, "#00000014", 0) + S.at(0.5, 0.6, 0, SPRITE.easel); },
    canvases(S, f) { return S.box(0.1, 0.3, f.w - 0.2, 0.5, 0, 22, C.wood) + S.at(f.w / 2, 0.6, 22, SPRITE.canvases); },
    // せんたくもの（ものほしざお と シャツ・タオル）
    laundry(S, f) {
      let s = S.cyl(0.2, 0.5, 0.06, 0, 120, C.metal) + S.cyl(f.w - 0.2, 0.5, 0.06, 0, 120, C.metal) + S.line([[0.2, 0.5, 116], [f.w - 0.2, 0.5, 116]], "#8C8890", 3);
      const items = [["shirt", "#8EC5F4"], ["towel", "#F4A6B8"], ["shirt", "#FFD54F"], ["towel", "#FFFFFF"], ["shirt", "#8FD19E"]];
      items.slice(0, Math.max(2, Math.floor(f.w))).forEach(([k, col], i, a) => { s += S.at(0.5 + (i * (f.w - 1)) / Math.max(1, a.length - 1), 0.5, 116, `<g transform="translate(0 32)">${SPRITE[k](col)}</g>`); });
      return s;
    },
    // ベランダの てすり
    railing(S, f) {
      let s = "";
      for (let x = 0.05; x <= f.w; x += 0.5) s += S.line([[x, 0.5, 0], [x, 0.5, 58]], INK, 2);
      return s + S.line([[0, 0.5, 58], [f.w, 0.5, 58]], "#8C6A4A", 5) + S.line([[0, 0.5, 22], [f.w, 0.5, 22]], "#A5AFB7", 2.4);
    },
  };
  // ---- 床（たたみ・フローリング・ろうか・コンクリート・ベランダ・ラグ）----
  const MAT = {
    aptcorr: { c: ["#E6CFA8", "#DFC79E"], line: "#C2A57C", pat: "plank" },
    apttatami: { c: ["#D8D69C", "#D0CE92"], line: "#B5B27A", pat: "mat" },
    aptwood: { c: ["#DDB88E", "#D5AF84"], line: "#B98E66", pat: "plank" },
    aptrug: { c: ["#F2C9C2", "#EDC0B8"], line: "#D99C92", pat: "carpet" },
    aptconc: { c: ["#DCD8D0", "#D4D0C7"], line: "#BDB8AE", pat: "tile" },
    aptbalc: { c: ["#E4E0D6", "#D8D3C8"], line: "#C4BEB1", pat: "check" },
  };
  // ---- かべ（きた・にし。へやごとに かべがみ と まど）----
  const wallSvg = (r, side) => {
    const Tt = T(), Lw = (side === "north" ? r.w : r.h) * Tt, Hh = r.wallH || 260, V = (z) => Hh - z, u = (tile) => (side === "north" ? tile : r.h - tile) * Tt;
    const R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" ${extra}/>`;
    const span = (a, b) => [Math.min(u(a), u(b)), Math.max(u(a), u(b))];
    const paper = (a, b, col, dots) => { const [x0, x1] = span(a, b); let t = R(x0, 0, x1 - x0, Hh, col); if (dots) for (let x = x0 + 12; x < x1; x += 28) for (let z = 40; z < Hh - 20; z += 34) t += `<circle cx="${f2(x + ((z / 34) % 2) * 14)}" cy="${f2(V(z))}" r="2.4" fill="${dots}"/>`; return t; };
    const pillar = (a) => { const [x0] = span(a, a + 1); return R(x0 + 14, 0, 20, Hh, "#C99A6B", `stroke="${INK}" stroke-width="1.5"`); };
    const win = (a, b, kind = "glass") => {
      const [x0, x1] = span(a, b), top = V(214), bot = V(96), w = x1 - x0 - 16, h = bot - top, X = x0 + 8;
      let t = R(X - 5, top - 5, w + 10, h + 10, "#8C6A4A", `rx="4" stroke="${INK}" stroke-width="2"`) + R(X, top, w, h, kind === "shoji" ? "#FFF8E8" : "#CDEBF7");
      if (kind === "shoji") { for (let x = X + w / 4; x < X + w - 2; x += w / 4) t += ln(`M${f2(x)},${f2(top)} V${f2(bot)}`, 2, "#C9A87A"); for (let y = top + h / 3; y < bot - 2; y += h / 3) t += ln(`M${f2(X)},${f2(y)} H${f2(X + w)}`, 2, "#C9A87A"); return t; }
      t += `<circle cx="${f2(X + w * 0.3)}" cy="${f2(bot - 22)}" r="24" fill="#9CCB86" stroke="${INK}" stroke-width="1.2"/><circle cx="${f2(X + w * 0.75)}" cy="${f2(bot - 16)}" r="18" fill="#B6D3A0" stroke="${INK}" stroke-width="1.2"/>`;
      if (kind === "curtain") t += `<path d="M${f2(X)},${f2(top)} h${f2(w * 0.22)} q-6,${f2(h * 0.5)} 4,${f2(h)} h${f2(-w * 0.22 - 4)} Z M${f2(X + w)},${f2(top)} h${f2(-w * 0.22)} q6,${f2(h * 0.5)} -4,${f2(h)} h${f2(w * 0.22 + 4)} Z" fill="#F4A6B8" stroke="${INK}" stroke-width="1.5"/>`;
      return t + ln(`M${f2(X + w / 2)},${f2(top)} V${f2(bot)}`, 4, "#8C6A4A") + ln(`M${f2(X + 12)},${f2(top + h * 0.5)} l22,-22`, 4, "#FFFFFF");
    };
    const frame = (a, b, z0, z1, inner) => { const [x0, x1] = span(a, b), w = x1 - x0 - 12; return `<g transform="translate(${f2(x0 + 6)} ${f2(V(z1))})">${R(0, 0, w, z1 - z0, "#FFFDF5", `rx="4" stroke="${INK}" stroke-width="2"`)}${inner(w, z1 - z0)}</g>`; };
    const sign = (a, b, z, text, col = "#FFE07A") => { const [x0, x1] = span(a, b); return R(x0 + 6, V(z) - 22, x1 - x0 - 12, 32, col, `rx="10" stroke="${INK}" stroke-width="2"`) + txt((x0 + x1) / 2, V(z) + 2, 17, text); };
    let s = "";
    if (r.floorNo === 1 && side === "north") {
      s += paper(0, 9, "#EFE6C8", "#E0D3AE") + paper(9, 20, "#E4EEF2", "#CFDDE3") + pillar(9);
      s += win(1.2, 4.6, "shoji") + frame(5.6, 7.2, 120, 196, (w, h) => R(6, 6, w - 12, 18, "#E8766A") + txt(w / 2, 20, 11, "カレンダー", "#FFFFFF") + [0, 1, 2, 3].map((i) => R(8 + i * ((w - 16) / 4), 32, (w - 16) / 4 - 4, h - 42, "#F6EEDC")).join(""));
      s += `<circle cx="${f2(u(8.4))}" cy="${f2(V(170))}" r="18" fill="#FFFDF5" stroke="${INK}" stroke-width="2.4"/>` + ln(`M${f2(u(8.4))},${f2(V(170))} v-11 M${f2(u(8.4))},${f2(V(170))} h8`, 2.4);
      s += win(10.6, 14.4, "curtain") + frame(15, 16.6, 118, 200, (w, h) => R(6, 6, w - 12, h - 12, "#BDE3F4") + `<circle cx="${f2(w / 2)}" cy="${f2(h * 0.45)}" r="${f2(w * 0.2)}" fill="#FFFFFF"/><circle cx="${f2(w / 2 - 8)}" cy="${f2(h * 0.4)}" r="3" fill="${INK}"/><circle cx="${f2(w / 2 + 8)}" cy="${f2(h * 0.4)}" r="3" fill="${INK}"/>`);
      s += R(u(17), V(200), u(20) - u(17), 104, "#F7F8F5") + [0, 1, 2, 3, 4].map((k) => ln(`M${f2(u(17) + k * 30)},${f2(V(200))} V${f2(V(96))}`, 1.2, "#DCE2E0")).join("");
      s += txt(u(4.5), V(236), 22, "101", "#8C6A4A") + txt(u(15), V(236), 22, "102", "#8C6A4A");
    } else if (r.floorNo === 1) {
      s += paper(0, 6.5, "#EFE6C8", "#E0D3AE") + paper(6.5, 9, "#F3EBDD") + paper(9, 14, "#D9D4CC") + pillar(6) + pillar(8.6);
      s += win(1.4, 4.8, "shoji") + win(7, 8.6) + sign(9.8, 13.4, 200, "ちゅうりんじょう", "#FFFFFF");
      s += `<circle cx="${f2(u(11.6))}" cy="${f2(V(150))}" r="12" fill="#FFF3B0" stroke="${INK}" stroke-width="2"/>`;
    } else if (side === "north") {
      s += paper(0, 9, "#E8E4F4", "#D6D0EA") + paper(9, 20, "#F4EEE2") + pillar(9);
      s += win(1, 4.4, "curtain") + frame(5, 6.6, 110, 200, (w, h) => R(6, 6, w - 12, h - 12, "#3E4E72") + txt(w / 2, h / 2 + 4, 20, "♪", "#FFD54F")) + frame(7, 8.6, 130, 190, (w, h) => R(6, 6, w - 12, h - 12, "#F7D56A") + txt(w / 2, h / 2 + 6, 20, "★", "#E8766A"));
      s += win(10.4, 15, "glass") + frame(15.6, 17.4, 110, 204, (w, h) => R(6, 6, w - 12, h - 12, "#BDE3F4") + `<path d="M6,${f2(h - 26)} q${f2(w * 0.3)},-30 ${f2(w - 12)},-6 v20 h${f2(-(w - 12))} Z" fill="#8FD19E"/>`) + frame(17.8, 19.6, 124, 196, (w, h) => R(6, 6, w - 12, h - 12, "#FCE3C4") + `<circle cx="${f2(w / 2)}" cy="${f2(h / 2)}" r="${f2(w * 0.22)}" fill="#E8766A"/>`);
      s += txt(u(4.5), V(236), 22, "201", "#8C6A4A") + txt(u(15), V(236), 22, "202", "#8C6A4A");
    } else {
      // 2F の にし: 201 の よこの まど・ろうかの まど・ベランダの そと（そらと 町の やね）
      s += paper(0, 6.5, "#E8E4F4", "#D6D0EA") + paper(6.5, 9, "#F3EBDD") + pillar(6) + pillar(8.6);
      s += win(1.4, 4.8, "glass") + win(7, 8.6);
      const [x0, x1] = span(9, 14);
      s += R(x0, 0, x1 - x0, Hh, "#BDE3F4") + `<circle cx="${f2(x0 + 60)}" cy="${f2(V(210))}" r="22" fill="#FFF3B0"/><ellipse cx="${f2(x0 + 150)}" cy="${f2(V(200))}" rx="36" ry="12" fill="#FFFFFF"/>`;
      [[0, 70, "#E8766A"], [60, 96, "#F2A65A"], [120, 60, "#8EC5F4"], [170, 84, "#E8766A"]].forEach(([dx, hh, col]) => { s += R(x0 + 10 + dx, V(hh), 44, hh, "#F6EEDC", `stroke="${INK}" stroke-width="1.4"`) + `<path d="M${f2(x0 + 6 + dx)},${f2(V(hh))} L${f2(x0 + 32 + dx)},${f2(V(hh + 22))} L${f2(x0 + 58 + dx)},${f2(V(hh))} Z" fill="${col}" stroke="${INK}" stroke-width="1.4"/>`; });
      s += `<circle cx="${f2(x0 + 30)}" cy="${f2(V(40))}" r="26" fill="#9CCB86" stroke="${INK}" stroke-width="1.2"/>`;
    }
    s += R(0, 0, Lw, 10, "#8E6440") + R(0, V(10), Lw, 10, "#8E6440") + `<path d="M0,${V(10)} H${Lw}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Lw} ${Hh}">${s}</svg>`, L: Lw, H: Hh };
  };

  // ---- へやの くみたて（20×14）----
  const grid = (paint) => { const rows = Array.from({ length: H }, () => Array(W).fill(".")); paint((ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; }); return rows.map((r) => r.join("")); };
  const walls = (add, a, b) => {
    add({ kind: "aptwall", x: 9, y: 0, w: 1, h: 7, dir: "y", height: 64 });
    add({ kind: "aptwall", x: 0, y: 6, w: 4, h: 1, height: 64 }); add({ kind: "aptwall", x: 5, y: 6, w: 4, h: 1, height: 64, plate: a });
    add({ kind: "aptwall", x: 10, y: 6, w: 4, h: 1, height: 64 }); add({ kind: "aptwall", x: 15, y: 6, w: 5, h: 1, height: 64, plate: b });
  };
  const furn = (add, id, x, y, w, h, extra = {}) => add({ kind: "furn", furn: id, x, y, w, h, height: Math.min(140, HomeDesign.dimensions(id).h + 10), ...extra });
  const npc = (add, sp, ci, x, y, dir, label, lines, extra = {}) => add({ kind: "npc", sp, ci, x, y, w: 1, h: 1, dir, emo: "happy", label, action: "talk", lines, spots: [[x + (dir === "left" ? -1 : dir === "right" ? 1 : 0), y + (dir === "down" ? 1 : dir === "up" ? -1 : 0)]], ...extra });
  function floor1() {
    const F = [], add = (o) => (F.push(o), o);
    walls(add, "101", "102");
    // 101: たたみ・こたつ・テレビ・たんす・きんぎょばち（ひつじの メリーさん）
    furn(add, "tv", 0, 0, 2, 1, { label: "テレビ", action: "info", text: "どうぶつの ばんぐみを やって いる。\nペンギンの あかちゃんが よちよち あるいて いるよ。", spots: [[1, 1]] });
    furn(add, "wardrobe_oak", 5, 0, 2, 1);
    furn(add, "plant", 8, 0, 1, 1);
    furn(add, "kotatsu", 3, 2, 2, 2, { label: "こたつ", action: "tea", spots: [[3, 4], [2, 3], [4, 4]] });
    furn(add, "fishbowl", 0, 4, 1, 1, { label: "きんぎょばち", action: "info", text: "あかい きんぎょが 2ひき。\nメリーさんが まいあさ えさを あげて いる。", spots: [[1, 4]] });
    npc(add, "sheep", 0, 5, 2, "left", "ひつじの メリーさん", ["あら、いらっしゃい。101の メリーです。", "こたつで おちゃを いっぱい どうぞ。"], { outfit: { face: "glasses", neck: "scarf_red" } });
    // 102: ソファ・キッチン・テーブル・おもちゃばこ・くまの ぬいぐるみ（パンダの おやこ）
    furn(add, "sofa", 10, 0, 3, 2, { label: "102の ソファ", action: "sit", text: "ふかふかの ソファで ひとやすみ。", spots: [[11, 2]] });
    furn(add, "kitchen", 17, 0, 3, 1);
    furn(add, "table_wood", 15, 2, 2, 2);
    furn(add, "chair_wood", 14, 2, 1, 1); furn(add, "chair_wood", 17, 3, 1, 1);
    furn(add, "toybox", 11, 4, 2, 1, { label: "おもちゃばこ", action: "play", spots: [[12, 5], [11, 5]] });
    furn(add, "teddy", 13, 4, 1, 1);
    npc(add, "panda", 0, 12, 3, "down", "パンダの ポポ", ["ぼく ポポ！ 5さい！", "おもちゃばこの つみき、いっしょに あそぼう！"]);
    npc(add, "panda", 1, 16, 4, "left", "パンダの ママ", ["102の パンダです。ポポと あそんで くれて ありがとう。", "2かいの ベランダから 町が よく 見えるわよ。"], { outfit: { body: "apron" } });
    // ろうかの 南: ゆうびんうけ・けいじばん・かんりにんさん・ちゅうりんじょう・かいだん・でぐち
    add({ kind: "mailboxes", x: 7, y: 9, w: 3, h: 1, height: 110, label: "ゆうびんうけ", action: "info", text: "101・102・201・202の ゆうびんうけ。\nゆうびんきょくの メエさんが まいにち とどけて くれる。", spots: [[8, 10]] });
    add({ kind: "noticeboard", x: 11, y: 9, w: 1, h: 1, height: 146, label: "アパートの けいじばん", action: "info", text: "おしらせ:\nごみは きまった 日に だそうね。\nベランダの おはなに みずやり とうばん（ケンタ）。", spots: [[11, 10]] });
    add({ kind: "kanri", x: 8, y: 12, w: 3, h: 1, height: 70, label: "かんりにんさんの まどぐち", action: "talk", sp: "cat", ci: 2, lines: ["ようこそ ひだまり アパートへ。かんりにんの タマです。", "かいだんで 2かいへ いけるよ。ベランダは ながめが いいよ。"], spots: [[9, 13]] });
    add({ kind: "npc", sp: "cat", ci: 2, x: 9, y: 11, w: 1, h: 1, dir: "down", emo: "happy", outfit: { face: "glasses" } });
    add({ kind: "bikes", x: 0, y: 11, w: 4, h: 2, height: 60, label: "ちゅうりんじょう", action: "info", text: "じてんしゃが 3だい。\nあかいのは ケンタの、みずいろは ピッコの じてんしゃ。", spots: [[4, 12], [2, 10]] });
    add({ kind: "planter", x: 6, y: 13, w: 1, h: 1, height: 70 }); add({ kind: "planter", x: 12, y: 9, w: 1, h: 1, height: 150, variant: "tree" });
    add({ kind: "stairs", x: 18, y: 9, w: 2, h: 3, height: 180, label: "かいだん（2かいへ）", action: "floor", to: 2, spawn: [18, 8], spots: [[18, 12], [19, 12]] });
    add({ kind: "exitMat", x: 14, y: 13, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[14, 12], [15, 12], [16, 12]] });
    return {
      id: "apart1", floorNo: 1, iso: true, w: W, h: H, wallH: 260, scale: 0.5, spawn: [15, 12], crowd: 0, exit: [14, 13, 18, 14], title: "ひだまり アパート 1F", fixtures: F,
      rows: grid((p) => { p("t", 0, 0, 8, 5); p("w", 10, 0, 19, 5); p("r", 10, 2, 13, 3); p("c", 0, 9, 19, 13); }),
      mats: { ".": "aptcorr", t: "apttatami", w: "aptwood", r: "aptrug", c: "aptconc" },
    };
  }
  function floor2() {
    const F = [], add = (o) => (F.push(o), o);
    walls(add, "201", "202");
    // 201: ベッド・つくえ・ほんだな・スタンドライト・ギター（いぬの ケンタ）
    furn(add, "bed_simple", 0, 0, 3, 2, { label: "ケンタの ベッド", action: "info", text: "まくらの よこに まんがの ほん。\nケンタは よく ねぼうするらしい。", spots: [[1, 2]] });
    furn(add, "lamp", 3, 0, 1, 1);
    furn(add, "desk", 5, 0, 3, 2, { label: "つくえ", action: "info", text: "しゅくだいの ノートと えんぴつ。\n「おんがくの がっこうに いきたい」と かいて ある。", spots: [[6, 2]] });
    furn(add, "bookshelf", 0, 3, 1, 2, { flip: true });
    add({ kind: "guitar", x: 7, y: 3, w: 1, h: 1, height: 110, label: "ギター", action: "guitar", spots: [[7, 4], [6, 3]] });
    npc(add, "dog", 1, 4, 3, "right", "いぬの ケンタ", ["201の ケンタ！ だいがくせいで、ギターが すき。", "ギターを さわって みて。1きょく ひいて あげる！"], { outfit: { body: "tshirt_star" } });
    // 202: イーゼル・え の たな・ソファ・テーブル（ことりの ピッコ）
    furn(add, "plant", 10, 0, 1, 1);
    add({ kind: "easel", x: 13, y: 2, w: 1, h: 1, height: 110, label: "かきかけの え", action: "painting", spots: [[13, 3], [14, 2]] });
    add({ kind: "canvases", x: 10, y: 4, w: 2, h: 1, height: 70, label: "え の たな", action: "info", text: "ピッコの かいた え。\nはなばたけ・うみ・おひさま。", spots: [[11, 5]] });
    furn(add, "sofa", 16, 0, 3, 2, { label: "202の ソファ", action: "sit", text: "えの ぐの においが する ソファで ひとやすみ。", spots: [[17, 2]] });
    furn(add, "table_wood", 16, 3, 2, 2);
    npc(add, "bird", 0, 12, 2, "right", "ことりの ピッコ", ["202の ピッコよ。えを かくのが おしごと。", "かきかけの え、見て いって。"], { outfit: { head: "beret" } });
    // ベランダ: せんたくもの・うえきばち・ベンチ・てすり
    add({ kind: "laundry", x: 1, y: 10, w: 5, h: 1, height: 130, label: "せんたくもの", action: "info", text: "ケンタの Tシャツと タオルが かぜに ゆれて いる。\nきょうは よく かわきそう。", spots: [[3, 11]] });
    add({ kind: "planter", x: 0, y: 12, w: 1, h: 1, height: 70 }); add({ kind: "planter", x: 7, y: 12, w: 1, h: 1, height: 150, variant: "tree" }); add({ kind: "planter", x: 16, y: 12, w: 1, h: 1, height: 70 });
    add({ kind: "bench", x: 10, y: 11, w: 2, h: 1, height: 46, label: "ベランダの ベンチ", action: "sit", text: "そよかぜが きもちいい。\nネリカスタウンの やねが ならんで 見える。", spots: [[10, 12], [12, 11]] });
    add({ kind: "railing", x: 0, y: 13, w: 8, h: 1, height: 60 }); add({ kind: "railing", x: 12, y: 13, w: 6, h: 1, height: 60 });
    add({ kind: "railing", x: 8, y: 13, w: 4, h: 1, height: 60, label: "てすり（町を ながめる）", action: "info", text: "ネリカスタウンが 見わたせる！\n大きい 公園の ふんすい・池・ガソリンスタンドの やねも 見える。", spots: [[9, 12], [10, 12]] });
    add({ kind: "stairs", variant: "down", x: 18, y: 9, w: 2, h: 3, height: 72, label: "かいだん（1かいへ）", action: "floor", to: 1, spawn: [18, 12], spots: [[18, 8], [19, 8]] });
    return {
      id: "apart2", floorNo: 2, iso: true, w: W, h: H, wallH: 260, scale: 0.5, spawn: [18, 8], crowd: 0, title: "ひだまり アパート 2F", fixtures: F,
      rows: grid((p) => { p("w", 0, 0, 8, 5); p("r", 1, 2, 4, 4); p("w", 10, 0, 19, 5); p("b", 0, 9, 19, 13); }),
      mats: { ".": "aptcorr", w: "aptwood", r: "aptrug", b: "aptbalc" },
    };
  }

  // ---- しらべる（1かいの 訪問で 1回だけ げんきが でる）----
  const faceOf = (f) => Art.npcSvg({ sp: f.sp, emo: "happy", ...(f.outfit ? { outfit: f.outfit } : {}) });
  const once = async (sc, key, f, lines, care) => {
    const seen = (sc.aptDone ||= {});
    if (seen[key]) { await UI.say([{ name: f.label, text: "また あそびに きてね。" }]); return; }
    seen[key] = true; for (const id of Save.d.order) Save.care(id, care); Save.write(); UI.updateHud(); Sound.se("good"); sc.sitting = 4;
    await UI.say(lines);
  };
  const art = Object.create(MallArt);
  Object.assign(art, {
    M: { ...MallArt.M, ...M }, MAT: { ...MallArt.MAT, ...MAT }, models: new Map(),
    modelKey(f) { return "apart:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant || "") + ":" + (f.furn || "") + ":" + (f.flip ? 1 : 0) + ":" + (f.plate || "") + ":" + (f.dir || ""); },
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = wallSvg(r, side); jobs.push(SvgCache.ensure("apartwall:" + r.id + ":" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
    },
    paint(g, r) { this.paintFloor(g, r); this.paintWalls(g, r); },
    wallSvg,
    backdrop() { return ["#E4DCCB", "#F5EEE2"]; },
    async interact(sc, f) {
      if (f.action === "leave") { sc.leave(); return true; }
      if (!["talk", "tea", "play", "guitar", "painting"].includes(f.action)) return false;
      sc.busy = true;
      try {
        if (f.action === "talk") await UI.say(f.lines.map((text) => ({ name: f.label.replace("の まどぐち", ""), face: faceOf(f), text })));
        else if (f.action === "tea") await once(sc, "tea", f, [
          { name: "ひつじの メリーさん", face: faceOf({ sp: "sheep" }), text: "こたつで あったまって いきなさいな。\nあったかい おちゃと おせんべいを どうぞ。" },
          { who: "wanko", emo: "happy", text: "ぽかぽか〜！ おせんべい おいしい！" }, { who: "gachan", emo: "happy", text: "こたつって ねむく なっちゃうね……" }, { who: "goji", emo: "happy", text: "ガゥ♪ おちゃ、あちち！" }], { mood: 5, hunger: 3 });
        else if (f.action === "play") await once(sc, "play", f, [
          { name: "パンダの ポポ", face: faceOf({ sp: "panda" }), text: "つみきで おしろを つくろう！" },
          { who: "wanko", emo: "happy", text: "たかく つめたね！" }, { who: "goji", emo: "happy", text: "ガゥ！ ……あっ、くずれた〜" }, { who: "gachan", emo: "happy", text: "もう いっかい つくろう！" }], { mood: 4 });
        else if (f.action === "guitar") await once(sc, "guitar", f, [
          { name: "いぬの ケンタ", face: faceOf({ sp: "dog" }), text: "じゃあ 1きょく いくよ。\n♪ じゃかじゃーん！" },
          { who: "gachan", emo: "happy", text: "かっこいい〜！" }, { who: "wanko", emo: "happy", text: "わん わん♪ いっしょに うたおう！" }], { mood: 3 });
        else if (f.action === "painting") await once(sc, "painting", f, [
          { name: "ことりの ピッコ", face: faceOf({ sp: "bird" }), text: "ネリカスタウンの 大きい 公園の え。\nふんすいと すべりだいを かいたの。" },
          { who: "goji", emo: "happy", text: "ガゥ！ ぼくたちも かいて〜！" }, { who: "gachan", emo: "happy", text: "いろが きれいだね。" }], { mood: 3 });
      } finally { sc.busy = false; }
      return true;
    },
  });
  function install() { VenueHalls.defs.neri_apart = { name: "ひだまり アパート", iso: true, art, bgm: "house", floors: { 1: floor1(), 2: floor2() } }; }
  install();
  return { W, H, art, floor1, floor2 };
})();
