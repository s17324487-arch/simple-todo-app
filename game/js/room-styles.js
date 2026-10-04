// かべがみ 15しゅ・ゆか 15しゅ（UI-90。オーナーの FB 2026-10-04「壁紙とゆかについて、15種類ずつ増やして。もっと可愛い系、かっこいい系、コンセプト系がほしい」）
// かわいい・かっこいい・コンセプトの 3つの なかま × 5しゅずつ。もようは HomeDesign.texture に たす（へやの かべ・ゆか と かぐやの 見本の 絵）。
// かべは 左右の かべごとに L × H（へやの がわで きりぬく）・ゆかは W × D（きりぬきが ない ので 自分で clipPath）・見本は 64 × 64（もようを 半分の 大きさで）。
// ねだんは slow-life-prices.js で 3ばいに なる（ほかの かべがみと おなじ）。かぐやの 一覧は あたらしい ものが さき・なかまの ふだつき。
// セーブは かわらない（Save.d.room.wallpapers・floors に id が ふえる だけ）。SVG の id は よぶ たびに ちがう（RoomStyles.uid）。
const RoomStyles = (() => {
  const GROUPS = { cute: "かわいい", cool: "かっこいい", concept: "コンセプト" };
  const PRICE = { cute: 380, cool: 420, concept: 520 }, COMFORT = { cute: 4, cool: 4, concept: 5 };
  // [id, なまえ, なかま, base, c2, もよう]
  const WALLS = [
    ["wp_heart", "ハートの かべ", "cute", "#FFE4EC", "#F393B1", "rs_heart"],
    ["wp_candy", "キャンディ しま", "cute", "#FFFDF8", "#F8C6D8", "rs_candy"],
    ["wp_flowers", "おはなばたけ", "cute", "#FFF6E3", "#F7A7C0", "rs_flowers"],
    ["wp_rainbow", "パステルの にじ", "cute", "#FFE6C7", "#D3E9FA", "rs_rainbow"],
    ["wp_yumekawa", "ゆめかわ ナイト", "cute", "#D4C2F2", "#FFC8DD", "rs_yumekawa"],
    ["wp_concrete", "コンクリート", "cool", "#B5B9BA", "#999EA0", "rs_concrete"],
    ["wp_marble", "くろい マーブル", "cool", "#2B2D33", "#C8B37A", "rs_marble"],
    ["wp_neon", "ネオンの よる", "cool", "#1D2142", "#6FF3FF", "rs_neon"],
    ["wp_steel", "てつの パネル", "cool", "#8D98A2", "#6C7680", "rs_steel"],
    ["wp_geo", "きかがく もよう", "cool", "#2D3E5C", "#C9A85A", "rs_geo"],
    ["wp_sea", "うみの なか", "concept", "#5FB4E0", "#2C78B5", "rs_sea"],
    ["wp_space", "うちゅう", "concept", "#1A1D45", "#F29A6B", "rs_space"],
    ["wp_forest", "もりの なか", "concept", "#DDF1D2", "#6FAE5F", "rs_forest"],
    ["wp_sweets", "おかしの いえ", "concept", "#E9C48F", "#F7A9C4", "rs_sweets"],
    ["wp_castle", "おしろの かべ", "concept", "#D4CDBF", "#C9474B", "rs_castle"],
  ];
  const FLOORS_NEW = [
    ["fl_heart", "ハートの タイル", "cute", "#FFF5F8", "#F28DAE", "rs_fheart"],
    ["fl_pastel", "パステル タイル", "cute", "#F9D0DC", "#CDEEDF", "rs_fpastel"],
    ["fl_cloud", "くもの ゆか", "cute", "#D9EEFB", "#FFFFFF", "rs_fcloud"],
    ["fl_berry", "いちごの ゆか", "cute", "#FBD3DA", "#E84F5E", "rs_fberry"],
    ["fl_candydot", "カラフル ドット", "cute", "#FFFDF8", "#F6A2BE", "rs_fcandy"],
    ["fl_concrete", "セメントの ゆか", "cool", "#A8ACAE", "#8F9395", "rs_fconcrete"],
    ["fl_marble", "マーブルの ゆか", "cool", "#25272D", "#BFA266", "rs_fmarble"],
    ["fl_chevron", "やばねの ゆか", "cool", "#6E4A32", "#5A3C29", "rs_fchevron"],
    ["fl_steel", "てつの しきいた", "cool", "#9AA4AC", "#B9C2C9", "rs_fsteel"],
    ["fl_hex", "ハニカム タイル", "cool", "#34383F", "#3E7174", "rs_fhex"],
    ["fl_seabed", "うみの そこ", "concept", "#F0DDB0", "#F49A6B", "rs_fseabed"],
    ["fl_space", "うちゅうせん", "concept", "#151B3A", "#3FD3F5", "rs_fspace"],
    ["fl_forest", "もりの こみち", "concept", "#9ACD72", "#D8B37A", "rs_fforest"],
    ["fl_cookie", "クッキーの ゆか", "concept", "#8A5A3A", "#E2B06A", "rs_fcookie"],
    ["fl_castle", "おしろの ゆか", "concept", "#BDB6A8", "#C23B44", "rs_fcastle"],
  ];

  // ---- かく どうぐ ----
  const R = (x, y, w, h, fill, ex = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}"${ex}/>`;
  const C = (x, y, r, fill, ex = "") => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${fill}"${ex}/>`;
  const E = (x, y, rx, ry, fill, ex = "") => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${fill}"${ex}/>`;
  const P = (d, fill, ex = "") => `<path d="${d}" fill="${fill}"${ex}/>`;
  const pts = (list) => list.map(([x, y]) => `${f2(x)},${f2(y)}`).join(" ");
  const G = (list, fill, ex = "") => `<polygon points="${pts(list)}" fill="${fill}"${ex}/>`;
  const op = (a) => ` opacity="${a}"`;
  const line = (c, w, extra = "") => ` stroke="${c}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}`;
  const h1 = (i, s) => U.hash(i, s); // 0〜1（きまった ばしょ）
  // ハート（まんなか x・うえ y・はば s）
  const heartD = (x, y, s) => `M${f2(x)},${f2(y + s * .25)} C${f2(x)},${f2(y - s * .05)} ${f2(x - s * .5)},${f2(y - s * .1)} ${f2(x - s * .5)},${f2(y + s * .22)} C${f2(x - s * .5)},${f2(y + s * .5)} ${f2(x - s * .12)},${f2(y + s * .66)} ${f2(x)},${f2(y + s * .86)} C${f2(x + s * .12)},${f2(y + s * .66)} ${f2(x + s * .5)},${f2(y + s * .5)} ${f2(x + s * .5)},${f2(y + s * .22)} C${f2(x + s * .5)},${f2(y - s * .1)} ${f2(x)},${f2(y - s * .05)} ${f2(x)},${f2(y + s * .25)} Z`;
  const heart = (x, y, s, fill, ex = "") => P(heartD(x, y, s), fill, ex);
  const flower = (x, y, r, petal, mid) => { let s = ""; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; s += C(x + Math.cos(a) * r, y + Math.sin(a) * r, r * .72, petal); } return s + C(x, y, r * .58, mid); };
  const sparkle = (x, y, r, fill, ex = "") => P(`M${f2(x)},${f2(y - r)} Q${f2(x + r * .18)},${f2(y - r * .18)} ${f2(x + r)},${f2(y)} Q${f2(x + r * .18)},${f2(y + r * .18)} ${f2(x)},${f2(y + r)} Q${f2(x - r * .18)},${f2(y + r * .18)} ${f2(x - r)},${f2(y)} Q${f2(x - r * .18)},${f2(y - r * .18)} ${f2(x)},${f2(y - r)} Z`, fill, ex);
  const moon = (x, y, r, fill) => P(`M${f2(x)},${f2(y - r)} A${f2(r)},${f2(r)} 0 1 0 ${f2(x)},${f2(y + r)} A${f2(r * .74)},${f2(r)} 0 1 1 ${f2(x)},${f2(y - r)} Z`, fill);
  const star = (x, y, r, fill, ex = "") => P(starPath(x, y, r, r * .45), fill, ex);
  const uid = () => "rs" + (++API.uid);
  const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`;
  // ゆかは きりぬきが ない ので じぶんで きる（ゆかの もようは ぜんぶ）
  const clip = (w, h, body) => { const id = uid(); return `<defs><clipPath id="${id}"><rect width="${f2(w)}" height="${f2(h)}"/></clipPath></defs><g clip-path="url(#${id})">${body}</g>`; };

  // ---- もよう（p: かべがみ・ゆか、w × h、k: もようの 大きさ）----
  const PATS = {
    // かわいい
    rs_heart(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let x = 22 * k; x < w; x += 48 * k) s += R(x, 0, 4 * k, h, "#FFFFFF", op(.5));
      for (let y = 14 * k, r = 0; y < h; y += 34 * k, r++) for (let x = (r % 2 ? 24 : 0) * k + 10 * k, i = 0; x < w + 10; x += 48 * k, i++) {
        s += heart(x, y, 15 * k, (i + r) % 3 ? p.c2 : "#F7BCD0") + C(x - 3 * k, y + 3 * k, 1.6 * k, "#FFFFFF", op(.75));
        s += C(x + 24 * k, y + 8 * k, 2 * k, "#FFFFFF");
      }
      return s;
    },
    rs_candy(p, w, h, k) {
      const cols = ["#F8C6D8", "#C8EBDD", "#FFF1B8", "#DCD3F4"], st = 30 * k, sl = h * .55;
      let s = R(0, 0, w, h, p.base);
      for (let x = -sl, i = 0; x < w + st; x += st, i++) {
        s += G([[x, 0], [x + st * .62, 0], [x + st * .62 + sl, h], [x + sl, h]], cols[i % 4]);
        for (let y = 10 * k; y < h; y += 26 * k) s += C(x + st * .81 + sl * (y / h), y, 1.5 * k, "#FFFFFF", op(.9));
      }
      return s;
    },
    rs_flowers(p, w, h, k) {
      const cols = ["#F7A7C0", "#FFD36E", "#9FC9F2", "#F4B183", "#C9B4EC"], cell = 44 * k;
      let s = R(0, 0, w, h, p.base);
      for (let gy = 0, j = 0; gy < h + cell; gy += cell, j++) for (let gx = 0, i = 0; gx < w + cell; gx += cell, i++) {
        const n = i * 37 + j * 11, x = gx + (j % 2 ? cell / 2 : 0) + (h1(n, 3) - .5) * 14 * k, y = gy + (h1(n, 4) - .5) * 12 * k, r = (4.5 + h1(n, 5) * 2) * k;
        s += E(x - r * 1.6, y + r * 1.4, r * .9, r * .42, "#9BCB86", ` transform="rotate(-28 ${f2(x - r * 1.6)} ${f2(y + r * 1.4)})"`);
        s += flower(x, y, r, cols[Math.floor(h1(n, 6) * cols.length)], "#FFF4B0");
        s += C(x + cell * .45, y - cell * .3, 1.6 * k, "#F3C9A4");
      }
      return s;
    },
    rs_rainbow(p, w, h, k) {
      const bands = ["#FFD6E0", "#FFE6C7", "#FFF6C2", "#DDF3D2", "#D3E9FA", "#E5DAF6"], bh = h / bands.length;
      let s = bands.map((c, i) => R(0, i * bh, w, bh + .5, c)).join("");
      for (let i = 0; i < w / (70 * k) + 1; i++) { const x = i * 70 * k + h1(i, 7) * 20 * k, y = h - 30 * k - h1(i, 8) * 30 * k; s += E(x, y, 16 * k, 7 * k, "#FFFFFF", op(.95)) + C(x - 6 * k, y - 5 * k, 7 * k, "#FFFFFF", op(.95)) + C(x + 6 * k, y - 4 * k, 6 * k, "#FFFFFF", op(.95)); }
      for (let i = 0; i < w * h / (2200 * k * k); i++) s += star(h1(i, 9) * w, h1(i, 10) * h * .7, 3.2 * k, "#FFFFFF", op(.9));
      return s;
    },
    rs_yumekawa(p, w, h, k) {
      const g = uid();
      let s = `<defs>${grad(g, [[0, "#BFAEF0"], [.55, "#E4C4F2"], [1, "#FFC8DD"]])}</defs>` + R(0, 0, w, h, `url(#${g})`);
      for (let i = 0; i < w * h / (900 * k * k); i++) { const x = h1(i, 11) * w, y = h1(i, 12) * h; s += h1(i, 13) < .5 ? C(x, y, (.8 + h1(i, 14)) * k, "#FFFFFF", op(.85)) : sparkle(x, y, (3 + h1(i, 14) * 2) * k, "#FFFFFF", op(.9)); }
      for (let x = 40 * k, i = 0; x < w; x += 120 * k, i++) {
        const y = (40 + (i % 2) * 70) * k;
        s += i % 3 === 0 ? moon(x, y, 13 * k, "#FFF2B8") : star(x, y, 9 * k, i % 3 === 1 ? "#FFF2B8" : "#FFFFFF");
        s += heart(x + 50 * k, y + 50 * k, 12 * k, "#FFFFFF", op(.55));
      }
      return s;
    },
    // かっこいい
    rs_concrete(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let i = 0; i < w * h / (260 * k * k); i++) s += C(h1(i, 15) * w, h1(i, 16) * h, (1 + h1(i, 17) * 2.2) * k, h1(i, 18) < .5 ? "#C8CCCD" : "#9DA2A4", op(.35));
      const pw = 152 * k, ph = Math.max(40 * k, h / 3);
      for (let y = 0; y < h; y += ph) for (let x = 0; x < w; x += pw) {
        s += R(x, y, pw, ph, h1(x, y) < .5 ? "#FFFFFF" : "#7F8486", op(.05));
        for (const [dx, dy] of [[.17, .26], [.83, .26], [.17, .74], [.83, .74]]) s += C(x + pw * dx, y + ph * dy, 3.6 * k, "#8C9193", line("#C9CDCE", 1.2 * k)) + C(x + pw * dx - .8 * k, y + ph * dy - .8 * k, 1.1 * k, "#6F7476");
      }
      for (let y = ph; y < h; y += ph) s += R(0, y - .7 * k, w, 1.4 * k, "#8E9395");
      for (let x = pw; x < w; x += pw) s += R(x - .7 * k, 0, 1.4 * k, h, "#8E9395");
      return s;
    },
    rs_marble(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let i = 0; i < w / (60 * k) + 2; i++) s += E(h1(i, 19) * w, h1(i, 20) * h, (50 + h1(i, 21) * 60) * k, (24 + h1(i, 22) * 30) * k, "#3A3D46", op(.45));
      for (let i = 0; i < w / (90 * k) + 2; i++) {
        const x = h1(i, 23) * w, y = -10, d = `M${f2(x)},${y} C${f2(x + (h1(i, 24) - .5) * 160 * k)},${f2(h * .3)} ${f2(x + (h1(i, 25) - .5) * 160 * k)},${f2(h * .6)} ${f2(x + (h1(i, 26) - .5) * 120 * k)},${f2(h + 10)}`;
        s += P(d, "none", line(i % 3 ? "#E9E6DF" : p.c2, (i % 3 ? .7 : 1.4) * k, op(i % 3 ? .45 : .8)));
        s += P(`M${f2(x + 10 * k)},${f2(h * .2)} q${f2(30 * k)},${f2(20 * k)} ${f2(60 * k)},${f2(14 * k)}`, "none", line("#E9E6DF", .5 * k, op(.35)));
      }
      return s;
    },
    rs_neon(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let y = 0, r = 0; y < h; y += 22 * k, r++) { s += R(0, y, w, 1 * k, "#2B3166"); for (let x = (r % 2) * 22 * k; x < w; x += 44 * k) s += R(x, y, 1 * k, 22 * k, "#2B3166"); }
      // ネオン管: ひろい ひかり 2そう ＋ いろの 管 ＋ しろい しん
      const glow = (d, c) => P(d, "none", line(c, 13 * k, op(.14))) + P(d, "none", line(c, 6.5 * k, op(.3))) + P(d, "none", line(c, 2.8 * k)) + P(d, "none", line("#FFFFFF", 1 * k, op(.9)));
      let z = `M0,${f2(h * .34)}`; for (let x = 0, i = 0; x <= w + 40 * k; x += 40 * k, i++) z += ` L${f2(x)},${f2(h * .34 + (i % 2 ? -14 : 14) * k)}`;
      s += glow(z, p.c2) + glow(`M0,${f2(h * .14)} H${f2(w)}`, "#B98CFF");
      for (let x = 70 * k, i = 0; x < w; x += 150 * k, i++) s += i % 2 ? glow(starPath(x, h * .64, 17 * k, 7.5 * k), "#FFE36E") : glow(heartD(x, h * .64 - 15 * k, 34 * k), "#FF6FC0");
      return s;
    },
    rs_steel(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      const pw = 118 * k, ph = Math.max(36 * k, h / 2);
      for (let y = 0; y < h; y += ph) for (let x = 0; x < w; x += pw) {
        s += R(x + 1.5 * k, y + 1.5 * k, pw - 3 * k, ph - 3 * k, h1(x, y + 3) < .5 ? "#95A0AA" : "#8A949E", line("#6C7680", 2 * k));
        s += G([[x + pw * .1, y + ph - 3 * k], [x + pw * .32, y + 3 * k], [x + pw * .46, y + 3 * k], [x + pw * .24, y + ph - 3 * k]], "#FFFFFF", op(.1));
        for (const [dx, dy] of [[9, 9], [pw / k - 9, 9], [9, ph / k - 9], [pw / k - 9, ph / k - 9]]) s += C(x + dx * k, y + dy * k, 2.6 * k, "#C7CED4", line("#5E6770", .9 * k));
      }
      return s;
    },
    rs_geo(p, w, h, k) {
      const cols = ["#2D3E5C", "#34507A", "#3E6C8A", "#22314C", "#3A5472"], t = 40 * k;
      let s = R(0, 0, w, h, p.base);
      for (let y = 0, j = 0; y < h; y += t, j++) for (let x = -t, i = 0; x < w + t; x += t, i++) {
        const n = i * 13 + j * 7, a = h1(n, 27) < .07 ? p.c2 : cols[Math.floor(h1(n, 28) * cols.length)], b = h1(n, 29) < .07 ? p.c2 : cols[Math.floor(h1(n, 30) * cols.length)], o = (j % 2) * t / 2;
        s += G([[x + o, y], [x + o + t, y], [x + o + t / 2, y + t]], a, line("#1A2438", .8 * k)) + G([[x + o + t / 2, y + t], [x + o + t, y], [x + o + t * 1.5, y + t]], b, line("#1A2438", .8 * k));
      }
      return s;
    },
    // コンセプト
    rs_sea(p, w, h, k) {
      const g = uid();
      let s = `<defs>${grad(g, [[0, "#8FDCF3"], [.5, "#4FA8DA"], [1, "#2C6FAE"]])}</defs>` + R(0, 0, w, h, `url(#${g})`);
      for (let x = 30 * k, i = 0; x < w; x += 110 * k, i++) s += G([[x, 0], [x + 34 * k, 0], [x + 90 * k, h], [x + 40 * k, h]], "#FFFFFF", op(.1));
      for (let i = 0; i < w * h / (1600 * k * k); i++) { const x = h1(i, 31) * w, y = h1(i, 32) * h * .8, r = (2 + h1(i, 33) * 4) * k; s += C(x, y, r, "none", line("#FFFFFF", 1 * k, op(.75))) + C(x - r * .35, y - r * .35, r * .25, "#FFFFFF", op(.9)); }
      for (let x = 60 * k, i = 0; x < w; x += 130 * k, i++) {
        const y = (50 + (i % 3) * 36) * k, c = ["#FFA25A", "#FFD45A", "#FF8FA3"][i % 3], d = i % 2 ? -1 : 1, t = `translate(${f2(x)} ${f2(y)}) scale(${d * k} ${k})`;
        s += `<g transform="${t}">${E(0, 0, 14, 8, c, line(INK, 1.6))}${G([[-12, 0], [-22, -8], [-22, 8]], c, line(INK, 1.6))}${C(7, -2, 1.8, INK)}<path d="M2,-6 Q4,0 2,6" fill="none"${line("#FFFFFF", 1.2, op(.8))}/></g>`;
      }
      for (let x = 10 * k, i = 0; x < w; x += 46 * k, i++) {
        const hh = (40 + h1(i, 34) * 50) * k, y0 = h - 14 * k; let d = `M${f2(x)},${f2(y0)}`;
        for (let t = 1; t <= 4; t++) d += ` Q${f2(x + (t % 2 ? 9 : -9) * k)},${f2(y0 - hh * (t - .5) / 4)} ${f2(x)},${f2(y0 - hh * t / 4)}`;
        s += P(d, "none", line(i % 2 ? "#3E9E6B" : "#5DB97F", 5 * k));
      }
      return s;
    },
    rs_space(p, w, h, k) {
      const g = uid();
      let s = `<defs>${grad(g, [[0, "#10163A"], [1, "#2E1F57"]])}</defs>` + R(0, 0, w, h, `url(#${g})`);
      for (let i = 0; i < w * h / (300 * k * k); i++) s += C(h1(i, 35) * w, h1(i, 36) * h, (.5 + h1(i, 37) * 1.1) * k, "#FFFFFF", op(.5 + h1(i, 38) * .5));
      for (let i = 0; i < w * h / (6000 * k * k) + 1; i++) s += star(h1(i, 39) * w, h1(i, 40) * h * .8, (3 + h1(i, 41) * 2) * k, "#FFE58A");
      const px = w * .72, py = h * .32, pr = 24 * k;
      s += E(px, py, pr * 1.9, pr * .5, "none", line("#F7D58C", 3 * k, op(.9))) + C(px, py, pr, p.c2, line(INK, 1.8 * k)) + P(`M${f2(px - pr)},${f2(py - pr * .2)} Q${f2(px)},${f2(py + pr * .15)} ${f2(px + pr)},${f2(py - pr * .2)}`, "none", line("#D9774F", 3 * k)) + P(`M${f2(px - pr * 1.85)},${f2(py + pr * .12)} A${f2(pr * 1.9)},${f2(pr * .5)} 0 0 0 ${f2(px + pr * 1.85)},${f2(py + pr * .12)}`, "none", line("#F7D58C", 3 * k));
      const mx = w * .2, my = h * .26, mr = 14 * k;
      s += C(mx, my, mr, "#ECE7D2", line(INK, 1.6 * k)) + C(mx - 4 * k, my - 3 * k, 3 * k, "#D3CCB2") + C(mx + 5 * k, my + 4 * k, 2.2 * k, "#D3CCB2");
      s += P(`M${f2(w * .45)},${f2(h * .16)} l${f2(-46 * k)},${f2(18 * k)}`, "none", line("#FFFFFF", 3 * k, op(.35))) + C(w * .45, h * .16, 3 * k, "#FFFFFF");
      return s;
    },
    rs_forest(p, w, h, k) {
      const g = uid();
      let s = `<defs>${grad(g, [[0, "#EAF7DF"], [1, "#C7E8B8"]])}</defs>` + R(0, 0, w, h, `url(#${g})`);
      for (let i = 0; i < w / (60 * k); i++) s += C(h1(i, 42) * w, h1(i, 43) * h * .45, (2 + h1(i, 44) * 3) * k, "#FFFFFF", op(.6));
      for (const [layer, col, trunk, base, size] of [[0, "#A9D58F", "#B98E62", .62, 34], [1, "#7DBB66", "#9C7049", .78, 40]]) {
        for (let x = (layer ? 30 : 0) * k, i = 0; x < w + 40 * k; x += (layer ? 78 : 64) * k, i++) {
          const r = (size + h1(i + layer * 50, 45) * 12) * k, y = h * base - h1(i + layer * 50, 46) * 14 * k;
          s += R(x - 4 * k, y, 8 * k, h - y, trunk, line(INK, 1.2 * k)) + C(x, y - r * .5, r * .82, col, line(INK, 1.4 * k)) + C(x - r * .45, y - r * .1, r * .55, col) + C(x + r * .45, y - r * .1, r * .55, col);
        }
      }
      for (let x = 40 * k, i = 0; x < w; x += 120 * k, i++) { const y = h - 24 * k; s += R(x - 2.5 * k, y, 5 * k, 9 * k, "#FFF3DE", line(INK, 1 * k)) + P(`M${f2(x - 9 * k)},${f2(y + 1 * k)} Q${f2(x)},${f2(y - 12 * k)} ${f2(x + 9 * k)},${f2(y + 1 * k)} Z`, "#E5574F", line(INK, 1.2 * k)) + C(x - 3 * k, y - 4 * k, 1.4 * k, "#FFFFFF") + C(x + 3 * k, y - 2 * k, 1.2 * k, "#FFFFFF"); }
      return s;
    },
    rs_sweets(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let y = 34 * k, r = 0; y < h - 60 * k; y += 26 * k, r++) for (let x = (r % 2 ? 13 : 0) * k + 12 * k; x < w; x += 26 * k) s += C(x, y, 2.2 * k, "#C9965C");
      const ch = 58 * k, y0 = h - ch;
      s += R(0, y0, w, ch, "#7A4A33");
      for (let x = 0; x < w; x += 40 * k) for (let y = y0 + 6 * k; y < h - 4 * k; y += 24 * k) s += R(x + 4 * k, y, 32 * k, 18 * k, "#8C5A3F", line("#5E3824", 1.2 * k)) + R(x + 6 * k, y + 2 * k, 28 * k, 3 * k, "#A87556", op(.8));
      let d = `M0,0 H${f2(w)} V${f2(14 * k)}`;
      for (let x = w, i = 0; x > 0; x -= 30 * k, i++) { const dh = (8 + h1(i, 47) * 18) * k; d += ` Q${f2(x - 7 * k)},${f2(14 * k + dh)} ${f2(x - 15 * k)},${f2(14 * k + dh * .6)} Q${f2(x - 22 * k)},${f2(14 * k)} ${f2(x - 30 * k)},${f2(14 * k)}`; }
      s += P(d + " Z", p.c2, line("#E27FA3", 1.2 * k));
      const sp = ["#FFFFFF", "#8FD3F0", "#FFE36E", "#9EDB8E"];
      for (let i = 0; i < w / (12 * k); i++) { const x = h1(i, 48) * w, y = (3 + h1(i, 49) * 9) * k; s += R(x, y, 5 * k, 1.8 * k, sp[i % 4], ` rx="${f2(.9 * k)}" transform="rotate(${Math.round(h1(i, 50) * 180)} ${f2(x + 2.5 * k)} ${f2(y + .9 * k)})"`); }
      for (let x = 60 * k, i = 0; x < w; x += 150 * k, i++) { const y = h * .42; s += R(x - 1.5 * k, y, 3 * k, 34 * k, "#FFFFFF", line(INK, 1 * k)) + C(x, y, 13 * k, i % 2 ? "#9FD7F2" : "#F59CBF", line(INK, 1.4 * k)) + P(`M${f2(x)},${f2(y)} m${f2(-8 * k)},0 a${f2(8 * k)},${f2(8 * k)} 0 0 1 ${f2(16 * k)},0`, "none", line("#FFFFFF", 2.6 * k)); }
      return s;
    },
    rs_castle(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      const bh = 24 * k, bw = 50 * k, sh = ["#CFC7B8", "#D9D2C4", "#C8C0B0", "#D3CBBC"];
      for (let y = 0, r = 0; y < h; y += bh, r++) for (let x = (r % 2 ? -bw / 2 : 0); x < w; x += bw) s += R(x + 1 * k, y + 1 * k, bw - 2 * k, bh - 2 * k, sh[Math.floor(h1(Math.round(x), r) * 4)], ` rx="${f2(3 * k)}"` + line("#A79F90", 1.2 * k));
      for (let x = 70 * k, i = 0; x < w - 20 * k; x += 170 * k, i++) {
        const bwid = 40 * k, top = 22 * k, bot = Math.min(h - 40 * k, 130 * k), mid = x;
        s += R(mid - bwid / 2 - 4 * k, top - 4 * k, bwid + 8 * k, 6 * k, "#8A6A3E", line(INK, 1.2 * k));
        s += G([[mid - bwid / 2, top], [mid + bwid / 2, top], [mid + bwid / 2, bot], [mid, bot - 14 * k], [mid - bwid / 2, bot]], p.c2, line(INK, 1.6 * k));
        s += G([[mid - bwid / 2 + 4 * k, top], [mid + bwid / 2 - 4 * k, top], [mid + bwid / 2 - 4 * k, bot - 6 * k], [mid, bot - 19 * k], [mid - bwid / 2 + 4 * k, bot - 6 * k]], "none", line("#E8C25A", 1.6 * k));
        const cy = top + (bot - top) * .4;
        s += P(`M${f2(mid - 10 * k)},${f2(cy + 6 * k)} L${f2(mid - 10 * k)},${f2(cy - 5 * k)} L${f2(mid - 5 * k)},${f2(cy)} L${f2(mid)},${f2(cy - 8 * k)} L${f2(mid + 5 * k)},${f2(cy)} L${f2(mid + 10 * k)},${f2(cy - 5 * k)} L${f2(mid + 10 * k)},${f2(cy + 6 * k)} Z`, "#F2CF63", line(INK, 1.2 * k));
      }
      return s;
    },
    // ---- ゆか（かわいい）----
    rs_fheart(p, w, h, k) {
      const t = 40 * k;
      let s = R(0, 0, w, h, p.base);
      for (let y = 0, j = 0; y < h; y += t, j++) for (let x = 0, i = 0; x < w; x += t, i++) {
        const ww = Math.min(t, w - x), hh = Math.min(t, h - y);
        if ((i + j) % 2) s += R(x, y, ww, hh, "#F8C8D6"); else if (ww === t && hh === t) s += heart(x + t / 2, y + t * .28, t * .5, p.c2) + C(x + t * .4, y + t * .4, t * .05, "#FFFFFF", op(.8));
      }
      return s;
    },
    rs_fpastel(p, w, h, k) {
      const t = 40 * k, cols = ["#F9D0DC", "#CDEEDF", "#FFF0B5", "#DCD2F5"];
      let s = R(0, 0, w, h, "#FFFFFF");
      for (let y = 0, j = 0; y < h; y += t, j++) for (let x = 0, i = 0; x < w; x += t, i++) s += R(x + 1.2 * k, y + 1.2 * k, Math.max(0, Math.min(t, w - x) - 2.4 * k), Math.max(0, Math.min(t, h - y) - 2.4 * k), cols[(i + j * 3) % 4], ` rx="${f2(3 * k)}"`);
      return s;
    },
    rs_fcloud(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      const cell = 92 * k;
      for (let gy = 0, j = 0; gy < h; gy += cell, j++) for (let gx = 0, i = 0; gx < w; gx += cell, i++) {
        const n = i * 17 + j * 5, x = U.clamp(gx + cell / 2 + (h1(n, 51) - .5) * 30 * k, 22 * k, w - 22 * k), y = U.clamp(gy + cell / 2 + (h1(n, 52) - .5) * 30 * k, 14 * k, h - 10 * k);
        s += E(x, y, 20 * k, 9 * k, p.c2) + C(x - 8 * k, y - 6 * k, 9 * k, p.c2) + C(x + 6 * k, y - 8 * k, 11 * k, p.c2) + E(x, y + 6 * k, 18 * k, 3 * k, "#BFDDF2", op(.7));
        if (h1(n, 53) < .7) s += star(U.clamp(x + cell * .42, 6 * k, w - 6 * k), U.clamp(y + cell * .3, 6 * k, h - 6 * k), 4 * k, "#FFE58A");
      }
      return s;
    },
    rs_fberry(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      const cell = 46 * k;
      for (let y = cell / 2, j = 0; y < h - 8 * k; y += cell, j++) for (let x = cell / 2 + (j % 2 ? cell / 2 : 0); x < w - 10 * k; x += cell) {
        s += P(`M${f2(x)},${f2(y + 11 * k)} C${f2(x - 12 * k)},${f2(y + 2 * k)} ${f2(x - 11 * k)},${f2(y - 8 * k)} ${f2(x)},${f2(y - 7 * k)} C${f2(x + 11 * k)},${f2(y - 8 * k)} ${f2(x + 12 * k)},${f2(y + 2 * k)} ${f2(x)},${f2(y + 11 * k)} Z`, p.c2, line(INK, 1.2 * k));
        for (const [dx, dy] of [[-4, -2], [3, -3], [0, 3], [-3, 6], [4, 3]]) s += E(x + dx * k, y + dy * k, .9 * k, 1.4 * k, "#FFE58A");
        s += G([[x - 7 * k, y - 7 * k], [x, y - 11 * k], [x + 7 * k, y - 7 * k], [x, y - 5 * k]], "#6DBB5C", line(INK, 1 * k));
        s += C(x + cell / 2, y + cell / 2 - 4 * k, 1.8 * k, "#FFFFFF");
      }
      return s;
    },
    rs_fcandy(p, w, h, k) {
      const cols = ["#F6A2BE", "#FFD86E", "#9EDFC5", "#9CCBF3", "#C9B4EC"], cell = 36 * k;
      let s = R(0, 0, w, h, p.base);
      for (let y = cell / 2, j = 0; y < h - 6 * k; y += cell, j++) for (let x = cell / 2 + (j % 2 ? cell / 2 : 0), i = 0; x < w - 8 * k; x += cell, i++) s += C(x, y, 9 * k, cols[(i + j * 2) % cols.length]) + C(x - 3 * k, y - 3 * k, 2.4 * k, "#FFFFFF", op(.75));
      return s;
    },
    // ---- ゆか（かっこいい）----
    rs_fconcrete(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let i = 0; i < w * h / (240 * k * k); i++) s += C(U.clamp(h1(i, 54) * w, 3, w - 3), U.clamp(h1(i, 55) * h, 3, h - 3), (1 + h1(i, 56) * 2.4) * k, h1(i, 57) < .5 ? "#BFC3C5" : "#959A9C", op(.35));
      const t = 160 * k;
      for (let x = t; x < w; x += t) s += R(x - k, 0, 2 * k, h, "#8A8F91");
      for (let y = t; y < h; y += t) s += R(0, y - k, w, 2 * k, "#8A8F91");
      return s;
    },
    rs_fmarble(p, w, h, k) {
      const t = 120 * k;
      let s = R(0, 0, w, h, p.c2);
      for (let y = 0, j = 0; y < h; y += t, j++) for (let x = 0, i = 0; x < w; x += t, i++) {
        const ww = Math.min(t, w - x) - 2 * k, hh = Math.min(t, h - y) - 2 * k; if (ww <= 0 || hh <= 0) continue;
        const n = i * 7 + j * 3, x0 = x + k, y0 = y + k;
        s += R(x0, y0, ww, hh, h1(n, 58) < .5 ? "#25272D" : "#2C2F36");
        s += P(`M${f2(x0 + ww * h1(n, 59))},${f2(y0)} C${f2(x0 + ww * h1(n, 60))},${f2(y0 + hh * .35)} ${f2(x0 + ww * h1(n, 61))},${f2(y0 + hh * .65)} ${f2(x0 + ww * h1(n, 62))},${f2(y0 + hh)}`, "none", line("#D8C48C", 1.2 * k, op(.7)));
        s += P(`M${f2(x0)},${f2(y0 + hh * h1(n, 63))} Q${f2(x0 + ww * .5)},${f2(y0 + hh * h1(n, 64))} ${f2(x0 + ww)},${f2(y0 + hh * h1(n, 65))}`, "none", line("#ECE8E0", .6 * k, op(.4)));
      }
      return s;
    },
    rs_fchevron(p, w, h, k) {
      const cw = 44 * k, t = 16 * k, d = cw * .55, wood = ["#6E4A32", "#7C563A", "#5F3F2B", "#856041"];
      let s = R(0, 0, w, h, p.base);
      for (let x = 0, c = 0; x < w; x += cw, c++) for (let y = -d - t, r = 0; y < h + d; y += t, r++) {
        const up = c % 2 === 0, q = up ? [[x, y + d], [x + cw, y], [x + cw, y + t], [x, y + d + t]] : [[x, y], [x + cw, y + d], [x + cw, y + d + t], [x, y + t]];
        s += G(q, wood[Math.floor(h1(c * 31 + r, 66) * wood.length)], line("#3E2A1E", .8 * k, op(.6)));
      }
      return s;
    },
    rs_fsteel(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      const g = 18 * k;
      for (let y = g / 2, j = 0; y < h - 4 * k; y += g, j++) for (let x = g / 2, i = 0; x < w - 4 * k; x += g, i++) {
        const a = (i + j) % 2 ? 45 : -45, tr = ` transform="translate(${f2(x)} ${f2(y)}) rotate(${a})"`;
        s += `<g${tr}>${R(-4.6 * k, -1 * k, 9.2 * k, 3 * k, "#7E8890", ` rx="${f2(1.5 * k)}"`)}${R(-4.6 * k, -1.8 * k, 9.2 * k, 3 * k, p.c2, ` rx="${f2(1.5 * k)}"`)}</g>`;
      }
      const t = 160 * k;
      for (let x = t; x < w; x += t) s += R(x - 1.2 * k, 0, 2.4 * k, h, "#6F7880");
      for (let y = t; y < h; y += t) s += R(0, y - 1.2 * k, w, 2.4 * k, "#6F7880");
      return s;
    },
    rs_fhex(p, w, h, k) {
      const r = 18 * k, hw = Math.sqrt(3) * r;
      let s = R(0, 0, w, h, "#5B616A");
      for (let y = 0, j = 0; y < h + r * 2; y += r * 1.5, j++) for (let x = (j % 2 ? hw / 2 : 0), i = 0; x < w + hw; x += hw, i++) {
        const q = []; for (let a = 0; a < 6; a++) { const t = (a / 6) * Math.PI * 2 + Math.PI / 6; q.push([x + Math.cos(t) * (r - 1.2 * k), y + Math.sin(t) * (r - 1.2 * k)]); }
        const n = i * 19 + j * 3;
        s += G(q, h1(n, 67) < .12 ? p.c2 : h1(n, 68) < .5 ? p.base : "#3A3F47");
      }
      return s;
    },
    // ---- ゆか（コンセプト）----
    rs_fseabed(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let y = 18 * k, i = 0; y < h; y += 26 * k, i++) { let d = `M0,${f2(y)}`; for (let x = 0; x <= w; x += 30 * k) d += ` q${f2(15 * k)},${f2((i % 2 ? -5 : 5) * k)} ${f2(30 * k)},0`; s += P(d, "none", line("#E0C792", 1.6 * k, op(.8))); }
      const cell = 80 * k;
      for (let gy = 0, j = 0; gy < h; gy += cell, j++) for (let gx = 0, i = 0; gx < w; gx += cell, i++) {
        const n = i * 23 + j * 9, x = U.clamp(gx + cell * (.2 + h1(n, 69) * .6), 14 * k, w - 14 * k), y = U.clamp(gy + cell * (.2 + h1(n, 70) * .6), 14 * k, h - 14 * k), kind = Math.floor(h1(n, 71) * 4);
        if (kind === 0) s += P(starPath(x, y, 10 * k, 4.4 * k), p.c2, line(INK, 1.2 * k)) + C(x, y, 1.5 * k, "#FFD3B0");
        else if (kind === 1) { s += P(`M${f2(x - 9 * k)},${f2(y + 4 * k)} A${f2(9 * k)},${f2(9 * k)} 0 0 1 ${f2(x + 9 * k)},${f2(y + 4 * k)} Z`, "#FBE3E6", line(INK, 1.2 * k)); for (const a of [-60, -30, 0, 30, 60]) s += P(`M${f2(x)},${f2(y + 4 * k)} l${f2(Math.sin(a * Math.PI / 180) * 8 * k)},${f2(-Math.cos(a * Math.PI / 180) * 8 * k)}`, "none", line("#E9A9B4", 1 * k)); }
        else if (kind === 2) s += E(x, y, 6 * k, 4 * k, "#B9B4AA", line(INK, 1 * k)) + E(x + 9 * k, y + 3 * k, 4 * k, 3 * k, "#CFCAC0", line(INK, 1 * k));
        else s += P(`M${f2(x)},${f2(y + 6 * k)} q${f2(-3 * k)},${f2(-8 * k)} 0,${f2(-14 * k)} M${f2(x)},${f2(y + 6 * k)} q${f2(5 * k)},${f2(-6 * k)} ${f2(6 * k)},${f2(-11 * k)}`, "none", line("#5DB97F", 2.4 * k));
      }
      return s;
    },
    rs_fspace(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let i = 0; i < w * h / (360 * k * k); i++) s += C(U.clamp(h1(i, 72) * w, 2, w - 2), U.clamp(h1(i, 73) * h, 2, h - 2), (.5 + h1(i, 74)) * k, "#FFFFFF", op(.4 + h1(i, 75) * .5));
      const t = 60 * k;
      for (let x = t; x < w; x += t) s += R(x - 3 * k, 0, 6 * k, h, p.c2, op(.12)) + R(x - .7 * k, 0, 1.4 * k, h, p.c2, op(.6));
      for (let y = t; y < h; y += t) s += R(0, y - 3 * k, w, 6 * k, p.c2, op(.12)) + R(0, y - .7 * k, w, 1.4 * k, p.c2, op(.6));
      for (let y = t; y < h; y += t) for (let x = t; x < w; x += t) s += C(x, y, 3 * k, "#BFF4FF") + C(x, y, 7 * k, p.c2, op(.25));
      return s;
    },
    rs_fforest(p, w, h, k) {
      let s = R(0, 0, w, h, p.base);
      for (let i = 0; i < w * h / (140 * k * k); i++) { const x = U.clamp(h1(i, 76) * w, 4, w - 4), y = U.clamp(h1(i, 77) * h, 6, h - 2); s += P(`M${f2(x)},${f2(y)} l${f2(2 * k)},${f2(-5 * k)} l${f2(2 * k)},${f2(5 * k)}`, "none", line("#7EB65A", 1.3 * k)); }
      const cx = (y) => w * .5 + Math.sin((y / h) * Math.PI * 1.6) * w * .16, pw = 34 * k, L = [], Rr = [];
      for (let y = 0; y <= h + 1; y += h / 24) { L.push([cx(y) - pw, y]); Rr.push([cx(y) + pw, y]); }
      s += G([...L, ...Rr.reverse()], p.c2, line("#B48A55", 2 * k));
      for (let y = 30 * k, i = 0; y < h - 10 * k; y += 56 * k, i++) s += E(cx(y) + (i % 2 ? 10 : -10) * k, y, 14 * k, 8 * k, "#C9C2B4", line(INK, 1.2 * k)) + E(cx(y) + (i % 2 ? 7 : -13) * k, y - 2 * k, 6 * k, 2.4 * k, "#E2DCCF");
      const cols = ["#FFFFFF", "#FFD36E", "#F7A7C0"];
      for (let i = 0; i < w * h / (5000 * k * k); i++) { const y = U.clamp(h1(i, 78) * h, 8, h - 8), side = h1(i, 79) < .5 ? -1 : 1, x = U.clamp(cx(y) + side * (pw + 14 * k + h1(i, 80) * w * .25), 8, w - 8); s += flower(x, y, 3 * k, cols[i % 3], "#FFF4B0"); }
      for (let i = 0; i < w * h / (9000 * k * k); i++) { const x = U.clamp(h1(i, 81) * w, 8, w - 8), y = U.clamp(h1(i, 82) * h, 8, h - 8); s += E(x, y, 4 * k, 2 * k, i % 2 ? "#E99B4C" : "#D8693E", ` transform="rotate(${Math.round(h1(i, 83) * 180)} ${f2(x)} ${f2(y)})"`); }
      return s;
    },
    rs_fcookie(p, w, h, k) {
      const t = 56 * k;
      let s = R(0, 0, w, h, p.base);
      for (let y = 0, j = 0; y < h; y += t, j++) for (let x = 0, i = 0; x < w; x += t, i++) {
        const ww = Math.min(t, w - x) - 4 * k, hh = Math.min(t, h - y) - 4 * k; if (ww <= 4 || hh <= 4) continue;
        const n = i * 11 + j * 5, x0 = x + 2 * k, y0 = y + 2 * k, kind = Math.floor(h1(n, 84) * 3);
        s += R(x0, y0 + 2 * k, ww, hh, "#B07A3E", ` rx="${f2(9 * k)}"`) + R(x0, y0, ww, hh, p.c2, ` rx="${f2(9 * k)}"` + line("#9C6A35", 1.4 * k));
        if (kind === 0 && ww > t * .7 && hh > t * .7) s += R(x0 + 4 * k, y0 + 4 * k, ww - 8 * k, hh * .48, "#F6A9C2", ` rx="${f2(7 * k)}"`) + [[.3, .2], [.6, .3], [.45, .12], [.75, .16]].map(([a, b], q) => R(x0 + ww * a, y0 + hh * b, 4 * k, 1.6 * k, ["#FFFFFF", "#8FD3F0", "#FFE36E", "#9EDB8E"][q], ` rx="${f2(.8 * k)}"`)).join("");
        else if (kind === 1) s += [[.3, .3], [.65, .4], [.4, .7], [.72, .72]].map(([a, b]) => E(x0 + ww * a, y0 + hh * b, 3.4 * k, 2.6 * k, "#5A3424")).join("");
        else s += [[.3, .3], [.7, .3], [.3, .7], [.7, .7]].map(([a, b]) => C(x0 + ww * a, y0 + hh * b, 1.8 * k, "#B9813F")).join("");
      }
      return s;
    },
    rs_fcastle(p, w, h, k) {
      let s = R(0, 0, w, h, "#9B9384");
      const sw = 80 * k, sh = 60 * k, shades = ["#BDB6A8", "#C6BFB1", "#B4AD9F", "#C1BAAC"];
      for (let y = 0, r = 0; y < h; y += sh, r++) for (let x = (r % 2 ? -sw / 2 : 0); x < w; x += sw) {
        const x0 = Math.max(0, x) + 1.5 * k, x1 = Math.min(w, x + sw) - 1.5 * k, y1 = Math.min(h, y + sh) - 1.5 * k; if (x1 - x0 < 3 || y1 - (y + 1.5 * k) < 3) continue;
        s += R(x0, y + 1.5 * k, x1 - x0, y1 - y - 1.5 * k, shades[Math.floor(h1(Math.round(x + 400), r) * 4)], ` rx="${f2(4 * k)}"`);
      }
      const cw = Math.min(w * .32, 130 * k), x0 = w / 2 - cw / 2;
      s += R(x0, 0, cw, h, "#7E2A30", op(.35)) + R(x0 + 2 * k, 0, cw - 4 * k, h, p.c2) + R(x0 + 6 * k, 0, 5 * k, h, "#E5BF55") + R(x0 + cw - 11 * k, 0, 5 * k, h, "#E5BF55");
      for (let y = 26 * k; y < h - 12 * k; y += 52 * k) s += G([[w / 2, y - 10 * k], [w / 2 + 8 * k, y], [w / 2, y + 10 * k], [w / 2 - 8 * k, y]], "#E5BF55", op(.9));
      return s;
    },
  };

  const FLOOR_PATS = new Set(FLOORS_NEW.map((r) => r[5]));
  const API = {
    GROUPS, uid: 0,
    WALLS: WALLS.map((r) => r[0]), FLOORS: FLOORS_NEW.map((r) => r[0]),
    PATS: Object.keys(PATS),
    groupOf(id) { const r = [...WALLS, ...FLOORS_NEW].find((q) => q[0] === id); return r ? r[2] : null; },
    has(pat) { return !!PATS[pat]; },
    // 見本（64 × 64）は もようを 半分の 大きさで。ゆかは わくの そとに でない ように きる
    texture(p, w, h) { const k = Math.max(w, h) <= 96 ? .5 : 1, body = PATS[p.pat](p, w, h, k); return this.isFloor(p.pat) ? clip(w, h, body) : body; },
    isFloor(pat) { return FLOOR_PATS.has(pat); },
    // かぐやの ならび: あたらしい もの（かわいい → かっこいい → コンセプト）が さき
    order(list) {
      const rank = (it) => { const g = this.groupOf(it.id); return g ? Object.keys(GROUPS).indexOf(g) : 9; };
      return list.map((it, i) => [it, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([it]) => it);
    },
  };

  for (const [id, name, group, base, c2, pat] of WALLS) { const f = { id, name, price: PRICE[group], comfort: COMFORT[group], base, c2, pat, style: group }; WALLPAPERS.push(f); WALL_INDEX[id] = f; }
  for (const [id, name, group, base, c2, pat] of FLOORS_NEW) { const f = { id, name, price: PRICE[group], comfort: COMFORT[group], base, c2, pat, style: group }; FLOORS.push(f); FLOOR_INDEX[id] = f; }

  // もようを HomeDesign.texture に たす（Art.patternSvg も HomeDesign.texture を よぶ）
  const tex = HomeDesign.texture;
  HomeDesign.texture = function (p, w, h) { return p && API.has(p.pat) ? API.texture(p, w, h) : tex.call(this, p, w, h); };
  // かぐやの かべがみ・ゆか: あたらしい ものが さき・なかまの ふだ
  const shop = BUY_SHOPS.furniture, items = shop.items;
  shop.items = (tab) => { const list = items(tab); return tab === "wp" || tab === "fl" ? API.order(list) : list; };
  const baseCard = ShopUI.card;
  ShopUI.card = function (shopId, tab, it, onBuy) {
    const c = baseCard.call(this, shopId, tab, it, onBuy), g = (tab === "wp" || tab === "fl") && API.groupOf(it.id);
    if (g) { c.classList.add("rs-card"); c.append(U.el("span", { class: "rs-tag rs-" + g, text: GROUPS[g] })); }
    return c;
  };
  return API;
})();
