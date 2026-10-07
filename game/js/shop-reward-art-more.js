// おてつだいの ごほうび Lv40・50 の 26こ（UI-109。js/shop-rewards.js の ITEMS の 5・6ばんめ）の 立体と さわった ときの うごき。
// つくりかたは js/shop-reward-art.js（ShopRewardArt）と おなじ: FurnModels の くみたて（INK の 線・パステル・まるい つなぎめ）。
// うごく ぶぶん（メリーゴーランドの かざり・かんらんしゃ・ふうしゃの はね・プロペラ・せんしゃの ブラシ・はぐるまと ふりこ）は
// live の とき 絵から ぬいて FurnLive が canvas に 描く。さわる 道具（mapper・say・tone・lamp など）は ShopRewardArt.liveKit。
// 小さな 絵（メリーゴーランドの かざり 6・かんらんしゃの ゴンドラ 4）は SvgCache に しゅるいごと 1つ・おおきさ きまり（キーは 10こで ふえない）。音は WebAudio で その場で つくる。
const ShopRewardArtMore = (() => {
  const TAU = Math.PI * 2;
  const { rect, rr, ov, arc, arch, star, heart, scallop, close, rot2 } = FurnModels.shapes;
  const SPR = FurnModels.SPR;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const CHROME = ["#D5DCE2", "#AEB8C1", "#EEF2F5"], GOLD = "#E3C06B", GOLDD = "#B9974A", WOOD = ["#C9A26E", "#A88457", "#DDBD8A"];
  const M = {};
  // なみなみの まる（レタス・フリル・くも）
  const wavy = (cx, cy, r, amp, n, ry = 1) => Array.from({ length: n * 8 }, (_, i) => { const t = (i / (n * 8)) * TAU, q = r + Math.sin(t * n) * amp; return [cx + Math.cos(t) * q, cy + Math.sin(t) * q * ry]; });
  // たれる しずく（チーズ・クリーム）
  const drip = (col, len = 7, w = 3.2) => `<path d="M${-w},0 Q${-w},${len * 0.75} 0,${len} Q${w},${len * 0.75} ${w},0 Z" fill="${col}" ${S(1.1)}/>`;
  // つつの 見える はんぶんの たての おび（ブラシ・しまの はしら）: a0〜a1 の むき・z0〜z1
  const vband = (k, cx, cy, r, a0, a1, z0, z1, n = 6) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(k.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0)); }
    for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; pts.push(k.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z1)); }
    return pts;
  };
  const VIS = [-Math.PI / 4, (3 * Math.PI) / 4]; // 見る 人の ほうを むく はんぶん（+x と +y の あいだが まんなか）
  const arcPts = (cx, cy, r, z, n = 16, a0 = VIS[0], a1 = VIS[1]) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]; });
  // つつの 見える はんぶんの よこの わ（しまの せん）
  const ring = (k, cx, cy, r, z, col, w = 1.5) => k.line(arcPts(cx, cy, r, z), col, w);
  // つつの ふちから たれる クリーム（見える はんぶん。はしは 見かけが ほそく なる）: n こ・ながさ len
  const creamBand = (k, cx, cy, r, z, col, n = 12, len = 6) => {
    const N = n * 6, top = arcPts(cx, cy, r + 0.4, z, N), bot = top.map(([x, y], i) => { const ph = (i % 6) / 6; return [x, y, z - 1.6 - len * Math.pow(Math.sin(ph * Math.PI), 2.5) * (0.75 + 0.25 * Math.sin(i * 1.7))]; });
    return k.poly(top.concat(bot.reverse()), col, 1.1);
  };
  // つつの おもて（見る 人の ほう）に はる 面（s は みぎへ・t は うえへ）
  const frontOf = (k, cx, cy, r) => k.tilt([cx + Math.SQRT1_2 * (r + 0.2), cy + Math.SQRT1_2 * (r + 0.2), 0], [Math.SQRT1_2, -Math.SQRT1_2, 0], [0, 0, 1]);

  // ================= バーガーやさん =================
  // ジュークボックスの にじいろの あかり（live では ない。ついて いる ときは FurnLive が いろを まわす）
  const JUKE = { y: -6, z0: 84, top: 116 };
  M.shop_burger_40 = (k) => {
    // ダイナーの ジュークボックス: あかい はこ・アーチの あたま（にじいろの おび）・まどの なかの レコード・えらぶ ボタン・クロームの スピーカー・てっぺんの バーガー
    const { box, prism, shape, FR, SD, TP, lineOn, onP, cyl, dome, at, shadow, lg } = k, { y, z0, top } = JUKE;
    const RED = ["#E45A4F", "#C24438", "#F07A6E"];
    let s = shadow(0.13, 3, 10) + box(-32, -46, 64, 42, 0, 6, ["#5E5A66", "#4A4652", "#77727F"]);
    s += box(-30, -44, 60, 38, 6, z0 - 6, RED);
    s += prism(FR(y), arch(-30, 30, z0, z0, top), [0, -38, 0], "#F07A6E", "#C24438", 1.5);
    // にじいろの アーチ
    [["#F2A7B8", 28, 113.5], ["#F7D56A", 25, 110.5], ["#A9D6C2", 22, 107.5], ["#9CC7E6", 19, 104.5]].forEach(([c, r, t2]) => { s += shape(FR(y + 0.1), arch(-r, r, z0 + 2, z0 + 2, t2), c, 1.1); });
    s += shape(FR(y + 0.2), arch(-16, 16, z0 + 2, z0 + 2, 101.5), "#3A3550", 1.2);
    // レコードと はり
    s += onP(FR(y + 0.3), -14, 101, 28, 15, `<ellipse cx="14" cy="9.5" rx="10" ry="4.6" fill="#1F1D1B" stroke="#55505F" stroke-width=".8"/><ellipse cx="14" cy="9.5" rx="6.4" ry="2.9" fill="none" stroke="#4A4652" stroke-width=".6"/><ellipse cx="14" cy="9.5" rx="2.6" ry="1.2" fill="#E45A4F"/><path d="M25,3 L19,8.6" stroke="${CHROME[0]}" stroke-width="1.4" stroke-linecap="round"/><circle cx="25" cy="3" r="1.2" fill="${CHROME[1]}"/>`);
    // よこの にじいろの つつ
    for (const x0 of [-28, 22]) s += shape(FR(y + 0.1), rr(x0, 14, 6, z0 - 12, 3), lg([[0, "#F2A7B8"], [0.33, "#F7D56A"], [0.66, "#A9D6C2"], [1, "#9CC7E6"]]), 1.1);
    // えらぶ ボタン
    s += shape(FR(y + 0.1), rr(-19, 60, 38, 18, 2.5), "#FFF4DC", 1.2);
    s += onP(FR(y + 0.2), -17, 76, 34, 14, Array.from({ length: 10 }, (_, i) => `<rect x="${1.6 + (i % 5) * 6.6}" y="${2 + Math.floor(i / 5) * 6}" width="4.8" height="3.6" rx="1" fill="${["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2", "#C9B6E0"][i % 5]}" stroke="${INK}" stroke-width=".6"/>`).join(""));
    // スピーカー（クローム）と まんなかの バーガーの マーク
    s += shape(FR(y + 0.1), rr(-18, 14, 36, 40, 5), CHROME[2], 1.3);
    for (let x = -14; x <= 14; x += 4) s += lineOn(FR(y + 0.2), [[x, 18], [x, 50]], CHROME[1], 1.2);
    s += onP(FR(y + 0.3), -7, 40, 14, 12, `<path d="M1.5,6 Q7,-1 12.5,6 Z" fill="#E0A160" stroke="${INK}" stroke-width=".8"/><rect x="1.5" y="6" width="11" height="2" rx="1" fill="#7FBC62"/><rect x="1.5" y="8" width="11" height="2.2" rx="1" fill="#6E412A"/><path d="M1.5,10.2 h11 q0,2 -2,2 h-7 q-2,0 -2,-2 Z" fill="#E0A160" stroke="${INK}" stroke-width=".8"/>`);
    // コインの いれぐち・クロームの ふち
    s += shape(SD(30.1), rr(-26, 62, 8, 12, 2), CHROME[0], 1) + lineOn(SD(30.2), [[-22, 64], [-22, 72]], INK, 1.4);
    s += lineOn(FR(y + 0.15), [[-30, z0], [30, z0]], CHROME[0], 2.2) + lineOn(FR(y + 0.15), [[-30, 8], [30, 8]], CHROME[0], 2.2);
    s += lineOn(FR(y + 0.12), arch(-30, 30, z0, z0, top).slice(2), CHROME[2], 2.4) + lineOn(FR(y + 0.12), arch(-30, 30, z0, z0, top).slice(2), CHROME[1], 0.8);
    // てっぺんの バーガー
    s += cyl(0, -25, top - 1, 7, 3, "#6E412A", "#875236", 1.1) + dome(0, -25, top + 2, 7.4, 7.4, 6, "#E0A160", 1.2);
    for (const [dx, dz] of [[-2.6, 6.2], [2, 6.8], [0, 4.6]]) s += at(dx, -22, top + dz, `<ellipse rx="1" ry=".55" fill="#FFF4D6"/>`, 1, 1);
    return s;
  };
  // すべりだい（さわると ポテトが すべる。live では ない）
  const SLIDE = { s: [-12, -50, 50], e: [70, -14, 4], hw: 13, n: 18, bend: 12 };
  const SLIDE_N = (() => { const dx = SLIDE.e[0] - SLIDE.s[0], dy = SLIDE.e[1] - SLIDE.s[1], L = Math.hypot(dx, dy); return [-dy / L, dx / L]; })();
  // すべる ところの まんなか（t: 0〜1）。よこに すこし まがって、さいごは たいらに なる
  const slideAt = (t) => { const [x0, y0, z0] = SLIDE.s, [x1, y1, z1] = SLIDE.e, u = Math.min(1, t / 0.82), b = Math.sin(Math.PI * t) * SLIDE.bend; return [x0 + (x1 - x0) * t + SLIDE_N[0] * b, y0 + (y1 - y0) * t + SLIDE_N[1] * b, z1 + (z0 - z1) * Math.pow(1 - u, 1.6)]; };
  M.shop_burger_50 = (k) => {
    // バーガーの すべりだい: おおきな バーガーの とう（バンズ・ハンバーグ・トマト・レタス・チーズ）・うえの デッキと ポテトの はしら・ごまの バンズの やね・まえの はしご・きいろい すべりだい
    const { cyl, dome, prism, shape, TP, at, line, rod, shadow, rg, eggAt, P, xy, box } = k, cx = -40, cy = -62, R = 32;
    let s = shadow(0.12, 3, 28);
    s += cyl(cx, cy, 0, R, 20, "#C27F44", "#DFA466") + cyl(cx, cy, 20, R + 1.5, 16, "#6E412A", "#875236");
    for (let a = -0.7; a < 2.4; a += 0.45) { const x = cx + Math.cos(a) * (R + 1.7), y = cy + Math.sin(a) * (R + 1.7); s += line([[x, y, 24], [x, y, 32]], "#4A2A1A", 1.6); }
    s += cyl(cx, cy, 36, R - 1, 5, "#D9493F", "#EE6A5C", 1.2);
    s += prism(TP(43), wavy(cx, cy, R + 3, 2, 16), [0, 0, -2], "#A4D884", "#7FBC62", 1.2);
    const cheese = rot2(rect(cx - 27, cy - 27, 54, 54), cx, cy, Math.PI / 4);
    s += prism(TP(45.5), cheese, [0, 0, -1.6], "#F7CD4E", "#E2B23A", 1.2);
    s += at(cx + 38, cy, 44, drip("#F7CD4E", 11, 4), 5, 3) + at(cx, cy + 38, 44, drip("#F7CD4E", 13, 4), 5, 3) + at(cx + 27, cy + 27, 44, drip("#F7CD4E", 8, 3.4), 5, 3);
    // デッキ（チーズの うえ）と てすり
    s += cyl(cx, cy, 46, R - 3, 3, "#E3A86A", "#F2C98F", 1.2);
    const rail = Array.from({ length: 13 }, (_, i) => { const a = -0.55 + (i / 12) * 2.6; return [cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4)]; });
    // はしら（ポテト）: うしろ 2ほん → デッキ → まえ 2ほん
    const posts = [[-2.2, 0], [-0.75, 0], [0.75, 1], [2.2, 1]].map(([a, f]) => [cx + Math.cos(a + Math.PI / 4) * (R - 6), cy + Math.sin(a + Math.PI / 4) * (R - 6), f]);
    const post = ([x, y]) => box(x - 3, y - 3, 6, 6, 49, 52, ["#F6CE58", "#DDAE36", "#FFE79A"], 1.2);
    for (const p of posts.filter((p) => !p[2])) s += post(p);
    for (const [x, y] of rail) s += line([[x, y, 49], [x, y, 60]], "#C24438", 1.4);
    s += line(rail.map(([x, y]) => [x, y, 60]), INK, 3.6) + line(rail.map(([x, y]) => [x, y, 60]), "#E45A4F", 2);
    for (const p of posts.filter((p) => p[2])) s += post(p);
    // やね（ごまの バンズ）と はた
    s += cyl(cx, cy, 101, R + 4, 5, "#C9874A", "#E3A86A");
    s += dome(cx, cy, 106, R + 4, R + 4, 30, rg([[0, "#F4C98A"], [0.55, "#E0A160"], [1, "#B8773E"]], 0.36, 0.28, 0.85));
    for (const [a, b] of [[0.25, 0.9], [0.95, 0.75], [1.7, 0.85], [-0.35, 0.6], [0.6, 0.4], [1.3, 0.36], [2.2, 0.5], [0.05, 0.25], [1.9, 0.22], [-0.65, 0.25], [0.9, 0.12], [1.55, 0.6]]) {
      const p = eggAt(cx, cy, 106, R + 4, R + 4, 30, a, b);
      s += at(p[0], p[1], p[2], `<ellipse rx="2.2" ry="1.2" transform="rotate(${-20 + a * 18})" fill="#FFF4D6" stroke="#C99A62" stroke-width=".6"/>`, 3, 2);
    }
    s += rod([[cx, cy, 136], [cx, cy, 150]], "#8C6848", 1.4) + at(cx + 1, cy, 149, `<path d="M0,0 L11,3 L0,6 Z" fill="#E45A4F" ${S(1)}/>`, 12, 8);
    // まえの はしご
    const lad = [1.95, 2.25].map((a) => [cx + Math.cos(a) * (R + 2.4), cy + Math.sin(a) * (R + 2.4)]);
    for (const [x, y] of lad) s += rod([[x, y, 0], [x, y, 58]], "#E45A4F", 1.6);
    for (let z = 8; z <= 50; z += 8.5) s += line([[lad[0][0], lad[0][1], z], [lad[1][0], lad[1][1], z]], "#FFFFFF", 2.6) + line([[lad[0][0], lad[0][1], z], [lad[1][0], lad[1][1], z]], INK, 0.7, 'stroke-opacity=".5"');
    // すべりだい: あし → おくの かべ → すべる ところ → てまえの かべ
    const [nx, ny] = SLIDE_N, T = Array.from({ length: SLIDE.n + 1 }, (_, i) => i / SLIDE.n), C = T.map(slideAt);
    for (const t of [0.35, 0.7]) { const [x, y, z] = slideAt(t); s += rod([[x, y, 0], [x, y, z - 1]], "#E45A4F", 2); }
    const edge = (sgn, dz = 0) => C.map(([x, y, z]) => [x + nx * SLIDE.hw * sgn, y + ny * SLIDE.hw * sgn, z + dz]);
    const wall = (sgn) => `<polygon points="${[...edge(sgn), ...edge(sgn, 7).reverse()].map((v) => xy(P(...v))).join(" ")}" fill="#E45A4F" ${S(1.3)}/>`;
    s += wall(-1);
    s += `<polygon points="${[...edge(-1, 1), ...edge(1, 1).reverse()].map((v) => xy(P(...v))).join(" ")}" fill="${k.lg([[0, "#FFE79A"], [1, "#F6B93B"]], 0, 0, 1, 0)}" ${S(1.4)}/>`;
    for (const t of [0.18, 0.42, 0.66]) { const a = slideAt(t), b = slideAt(t + 0.08); s += line([[a[0] - nx * 6, a[1] - ny * 6, a[2] + 1.2], [b[0] - nx * 6, b[1] - ny * 6, b[2] + 1.2]], "#FFFFFF", 1.4, 'stroke-opacity=".8"'); }
    s += wall(1);
    s += line(edge(1, 7), "#FF8A7E", 1.2, 'stroke-opacity=".9"');
    return s;
  };


  // ================= びようしつ =================
  M.shop_groom_40 = (k) => {
    // あわあわ シャンプー チェア: クロームの あし・ラベンダーの いすと ひじかけ・うしろに たおれる せもたれ・うしろの シャンプー だい（しろい ボウルと あわ）・シャワー・ボトル
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, ball, rod, slab, shadow, at } = k, LAV = ["#C7B3DD", "#A995C4", "#DCCDEB"];
    let s = shadow(0.12, 3, 14);
    // シャンプー だい（いちばん おく）
    s += box(-30, -92, 60, 20, 0, 60, ["#FFFFFF", "#E3DDD3", "#FFFFFF"]) + shape(FR(-71.9), rr(-24, 8, 48, 40, 3), "#F4EFF8", 1.1) + lineOn(FR(-71.8), [[0, 10], [0, 46]], "#D8CFE3", 1);
    s += frustum(0, -80, 60, 15, 74, 24, "#FFFFFF", "#F7F7F7", 1.4) + shape(TP(74.1), ov(0, -80, 19, 9.5, 28), "#BFE3EE", 1.1);
    for (const [x, y, r] of [[-14, -78, 4.2], [-8, -74, 5], [0, -73, 5.4], [8, -74, 4.8], [15, -78, 4], [-4, -86, 4], [6, -86, 4.4]]) s += ball(x, y, 76, r, "#FFFFFF", 1.1, 0.7);
    s += rod([[22, -90, 60], [22, -90, 96], [10, -90, 100], [6, -84, 96]], CHROME[1], 2) + cyl(6, -84, 90, 3.6, 4, CHROME[1], CHROME[0], 1.1);
    s += cyl(-22, -86, 60, 4, 14, "#F2A7B8", "#F7C6D6", 1.1) + cyl(-22, -86, 74, 1.6, 3, "#FFFFFF", "#FFFFFF", 0.9) + cyl(-13, -88, 60, 3.6, 12, "#A9D6C2", "#C9E8DA", 1.1);
    // いすの あし
    s += cyl(0, -32, 0, 18, 4, CHROME[1], CHROME[0], 1.3) + cyl(0, -32, 4, 5, 22, CHROME[1], CHROME[2], 1.2);
    // せもたれ（たおれて いる）・いす・ひじかけ
    s += slab([-22, -52, 36], [1, 0, 0], [0, -0.62, 0.78], rr(0, 0, 44, 46, 9), 8, "#DCCDEB", "#A995C4", 1.4).s;
    s += slab([-11, -80.5, 72], [1, 0, 0], [0, -0.62, 0.78], rr(0, 0, 22, 9, 4), 3, "#FFFFFF", "#E3DDD3", 1.2).s;
    s += prism(TP(38), rr(-24, -54, 48, 44, 9), [0, 0, -12], LAV[2], LAV[1], 1.4) + lineOn(TP(38.1), [[-18, -32], [18, -32]], "#BBA6D2", 1.1, 'stroke-dasharray="2 2"');
    for (const x of [-31, 25]) s += rod([[x + 3, -20, 26], [x + 3, -20, 38]], CHROME[1], 1.6) + box(x, -50, 6, 38, 38, 7, LAV, 1.2);
    s += at(-6, -40, 50, `<path d="M0,0 c-2,-3 -2,-6 1,-7 c3,1 3,4 -1,7 Z" fill="#9CC7E6" ${S(0.8)}/>`, 4, 8);
    return s;
  };
  // メリーゴーランドの かざり（live の とき FurnLive が まわす）: まんなか・はんけい・つりさげの たかさ
  const CAROUSEL = { cx: 0, cy: -55, r: 35, top: 136, hang: 88, n: 6 };
  const ACCS = [["ribbon", "#F2A7B8"], ["star", "#F7D56A"], ["heart", "#E77E8E"], ["flower", "#C9B6E0"], ["crown", "#F0CF6E"], ["berry", "#E45A4F"]];
  const accSvg = (kind, c) => ({
    ribbon: `<path d="M0,0 Q-9,-6 -10,0 Q-9,6 0,0 Z M0,0 Q9,-6 10,0 Q9,6 0,0 Z" fill="${c}" ${S(1.1)}/><path d="M-1,1 L-4,8 M1,1 L4,8" ${S(1.6)}/><path d="M-1,1 L-4,8 M1,1 L4,8" stroke="${c}" stroke-width=".9"/><circle r="2" fill="${shade(c, -0.12)}" ${S(0.9)}/>`,
    star: `<path d="${starPath(0, 0, 8, 3.6)}" fill="${c}" ${S(1.1)}/><circle cx="-2" cy="-1" r=".9" fill="${INK}"/><circle cx="2" cy="-1" r=".9" fill="${INK}"/>`,
    heart: `<path d="M0,6 C-9,0 -8,-7 -3.5,-7 C-1.5,-7 0,-5.5 0,-4 C0,-5.5 1.5,-7 3.5,-7 C8,-7 9,0 0,6 Z" fill="${c}" ${S(1.1)}/><path d="M-4.5,-3.5 q1,-1.6 2.6,-1.4" fill="none" stroke="#FFFFFF" stroke-width="1"/>`,
    flower: `${[0, 1, 2, 3, 4].map((i) => `<circle cx="${(Math.cos((i / 5) * TAU - Math.PI / 2) * 4.4).toFixed(2)}" cy="${(Math.sin((i / 5) * TAU - Math.PI / 2) * 4.4).toFixed(2)}" r="3.4" fill="${c}" ${S(0.9)}/>`).join("")}<circle r="2.6" fill="#F7D56A" ${S(0.9)}/>`,
    crown: `<path d="M-8,4 L-9,-5 L-4.5,-1 L0,-8 L4.5,-1 L9,-5 L8,4 Z" fill="${c}" ${S(1.1)}/><circle cy="-1" r="1.4" fill="#F2A7B8" ${S(0.7)}/>`,
    berry: `<circle r="5.6" fill="#F7C6D6" stroke="#E77E8E" stroke-width="1.6"/><path d="M0,-1 C-4,-1 -4,6 0,7 C4,6 4,-1 0,-1 Z" fill="${c}" ${S(1)}/><path d="M-3,-1 L0,-4 L3,-1 Z" fill="#7FB06A" ${S(0.8)}/>`,
  })[kind];
  const accAt = (i, ang) => { const a = ang + (i / CAROUSEL.n) * TAU; return [CAROUSEL.cx + Math.cos(a) * CAROUSEL.r, CAROUSEL.cy + Math.sin(a) * CAROUSEL.r, a]; };
  M.shop_groom_50 = (k) => {
    // ヘアアクセの メリーゴーランド: まるい だい（しんじゅの ふち）・きんの はしら・しましまの やね（フリルと リボンの てっぺん）・つりさげた リボン・ほし・ハート・はな・かんむり・いちごの ゴム
    const { cyl, shape, TP, lathe, rod, ball, at, shadow, L, P, xy } = k, { cx, cy, r, top, hang } = CAROUSEL;
    let s = shadow(0.12, 4, 40) + cyl(cx, cy, 0, 54, 8, "#E7B7C8", "#FFF1F5") + cyl(cx, cy, 8, 48, 5, "#F2C6D6", "#FFFFFF", 1.3);
    for (let a = VIS[0]; a <= VIS[1] + 0.01; a += 0.26) s += ball(cx + Math.cos(a) * 54, cy + Math.sin(a) * 54, 4, 2.4, "#FFFFFF", 0.9, 0.6);
    s += shape(TP(13.1), ov(cx, cy, 30, 30, 32), "#FCE4EC", 0.9);
    // はしらと かざり（live では FurnLive）。おくの かざり → はしら → てまえの かざり
    const item = (i) => { const [x, y] = accAt(i, 0.4), [kind, c] = ACCS[i]; return rod([[x, y, top], [x, y, hang + 8]], GOLD, 1.1) + at(x, y, hang, accSvg(kind, c), 11, 12); };
    const order = Array.from({ length: CAROUSEL.n }, (_, i) => i).sort((a, b) => { const p = accAt(a, 0.4), q = accAt(b, 0.4); return p[0] + p[1] - (q[0] + q[1]); });
    const pole = cyl(cx, cy, 13, 5, top - 13, GOLDD, GOLD, 1.3) + [40, 70, 100].map((z) => cyl(cx, cy, z, 6.2, 3, "#F2A7B8", "#F7C6D6", 1)).join("");
    s += L(order.filter((i) => { const p = accAt(i, 0.4); return p[0] - cx + (p[1] - cy) < 0; }).map(item).join("") + pole + order.filter((i) => { const p = accAt(i, 0.4); return p[0] - cx + (p[1] - cy) >= 0; }).map(item).join(""));
    // やね: しましまの かさ・フリルの ふち・てっぺんの リボン
    const prof = [[56, top], [52, top + 8], [42, top + 18], [26, top + 27], [10, top + 32], [0, top + 33]];
    s += lathe(cx, cy, prof, "#FFFFFF", 1.5);
    const rad = (z) => { for (let i = 0; i < prof.length - 1; i++) { const [r0, z0] = prof[i], [r1, z1] = prof[i + 1]; if (z <= z1) return r0 + ((r1 - r0) * (z - z0)) / (z1 - z0); } return 0; };
    for (let j = 0; j < 12; j++) {
      const a0 = (j / 12) * TAU, a1 = a0 + TAU / 24;
      if (Math.cos((a0 + a1) / 2 - Math.PI / 4) < -0.15) continue;
      const pts = [];
      for (let i = 0; i <= 8; i++) { const z = top + (i / 8) * 32; pts.push(P(cx + Math.cos(a0) * rad(z), cy + Math.sin(a0) * rad(z), z)); }
      for (let i = 8; i >= 0; i--) { const z = top + (i / 8) * 32; pts.push(P(cx + Math.cos(a1) * rad(z), cy + Math.sin(a1) * rad(z), z)); }
      s += `<polygon points="${pts.map(xy).join(" ")}" fill="#F7B9C9" stroke="none"/>`;
    }
    s += lathe(cx, cy, prof, "none", 1.5);
    for (let a = VIS[0] - 0.1; a <= VIS[1] + 0.1; a += 0.3) s += at(cx + Math.cos(a) * 56, cy + Math.sin(a) * 56, top, `<path d="M-5,0 Q-5,6 0,6 Q5,6 5,0 Z" fill="${Math.round(a * 3.4) % 2 ? "#F7B9C9" : "#FFFFFF"}" ${S(1)}/>`, 6, 2);
    s += at(cx, cy, top + 33, `<g transform="translate(0 -6) scale(1.6)">${SPR.bow()}</g>`, 16, 18);
    return s;
  };

  // ================= ケーキやさん =================
  // うずまき（ロールケーキ）: (s0, t0) を まんなかに r まで
  const spiral = (s0, t0, r, turns = 2.4, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, a = u * turns * TAU, q = 1.5 + (r - 1.5) * u; return [s0 + Math.cos(a) * q, t0 + Math.sin(a) * q]; });
  M.shop_cake_40 = (k) => {
    // ロールケーキの ソファ: うしろの よこに ねた ロールケーキ（みぎの きりくちに うずまき）・いちごと クリームの のった せもたれ・フルーツサンドの ざぶとん・うずまきの ひじかけ
    const { prism, shape, FR, SD, TP, lineOn, box, dome, ball, at, shadow, lg } = k, SK = lg([[0, "#E8B464"], [1, "#B9803E"]]);
    let s = shadow(0.12, 2, 16);
    s += prism(SD(56), ov(-50, 42, 20, 20, 40), [-112, 0, 0], "#F6D58A", SK, 1.5);
    s += lineOn(SD(56.1), spiral(-50, 42, 18), "#FFFDF6", 3.6) + lineOn(SD(56.1), spiral(-50, 42, 18), "#F2E6CF", 1);
    for (let x = -50; x <= 46; x += 8) s += at(x, -46, 61.5, `<ellipse rx="1.2" ry=".6" fill="#FFFFFF" fill-opacity=".9"/>`, 1, 1);
    for (const x of [-44, -22, 0, 22, 44]) s += dome(x, -50, 61, 6.4, 6.4, 6, "#FFFFFF", 1.2) + ball(x, -50, 70, 4.2, "#E0453D", 1.1, 0.6) + at(x, -50, 73.5, `<path d="M-3,0 L0,-3 L3,0 L0,-1 Z" fill="#7FB06A" ${S(0.8)}/>`, 4, 4);
    // ざぶとん（フルーツサンド）
    const SP = ["#F6D58A", "#E3BC6C", "#FBE4A8"];
    s += box(-38, -42, 76, 34, 0, 12, SP) + box(-38, -42, 76, 34, 12, 8, ["#FFFDF6", "#EFE6D6", "#FFFFFF"], 1.2) + box(-38, -42, 76, 34, 20, 9, SP);
    for (const [x, c] of [[-28, "#E0453D"], [-12, "#F2C14E"], [4, "#8BCB6B"], [20, "#E0453D"], [32, "#F29A5B"]]) s += shape(FR(-7.9), arc(x, 12, 5.4, 5.4, 0, Math.PI, 10), c, 1);
    s += shape(TP(29.1), rr(-34, -38, 68, 26, 6), "#FBE9BD", 0) + lineOn(TP(29.15), [[-30, -25], [30, -25]], "#E8C98A", 1, 'stroke-dasharray="3 3"');
    // ひじかけ（たてた ロールケーキ）
    for (const x of [-52, 52]) s += prism(FR(-6), ov(x, 26, 14, 14, 32), [0, -26, 0], "#F6D58A", SK, 1.4) + lineOn(FR(-5.9), spiral(x, 26, 12, 2.2), "#FFFDF6", 3) + lineOn(FR(-5.9), spiral(x, 26, 12, 2.2), "#F2E6CF", 0.8) + dome(x, -19, 40, 4.6, 4.6, 4, "#FFFFFF", 1) + ball(x, -19, 46.5, 3, "#E0453D", 1, 0.6);
    return s;
  };
  // ケーキの おしろの ろうそく（よるは はじめから つく）
  const CANDLES = [[-14, -58], [-7, -66], [0, -50], [7, -66], [14, -58]].map(([x, y]) => [x, y, 150]);
  M.shop_cake_50 = (k) => {
    // ケーキの おしろ: 3だんの ケーキ（ピンク・クリーム・ミント）・クリームの しずく・チョコの とびら・ハートの まど・ワッフル コーンの やねの とう 2つ・いちご・ろうそく 5ほん・てっぺんの はた
    const { cyl, frustum, lathe, shape, TP, tilt, lineOn, at, ball, dome, rod, shadow, lg, P, xy } = k, cx = 0, cy = -58;
    let s = shadow(0.12, 3, 36);
    const side = (r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const face = (r, a, z) => { const [x, y] = side(r + 0.2, a); return tilt([x, y, z], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]); };
    const drips = (r, z, col, n) => creamBand(k, cx, cy, r, z, col, n);
    // とう（どちらも 1だんめより てまえ。上の だんとは かさならない）
    const tower = (a) => {
      const [x, y] = side(60, a);
      let t = cyl(x, y, 0, 13, 86, lg([[0, "#F7C6D6"], [0.5, "#FFFFFF"], [1, "#F7C6D6"]], 0, 0, 1, 0), "#FFF1F5", 1.4);
      for (const z of [20, 44, 68]) t += ring(k, x, y, 13.3, z, "#F2A7B8", 2);
      t += shape(frontOf(k, x, y, 13), arch(-4, 4, 50, 56, 62), "#7B4B33", 1);
      t += lathe(x, y, [[15, 86], [0, 118]], "#D9A35E", 1.4);
      for (let i = 1; i < 4; i++) t += line3(k, x, y, 15 * (1 - i / 4), 86 + i * 8);
      return t + ball(x, y, 121, 4.4, "#E0453D", 1.1, 0.6) + rod([[x, y, 125], [x + 2, y, 130]], "#5F8F55", 1);
    };
    // 1だんめ（ピンク）・とびら・まど
    s += cyl(cx, cy, 0, 56, 56, lg([[0, "#F2B8C6"], [0.55, "#F7D3DE"], [1, "#E8A3B6"]], 0, 0, 1, 0), "#FFE6EE", 1.5) + drips(56, 56, "#FFFFFF", 16);
    s += shape(face(56, Math.PI / 4, 0), arch(-10, 10, 0, 22, 34), "#7B4B33", 1.4) + shape(face(56, Math.PI / 4, 0), arch(-7, 7, 0, 21, 30), "#9A6446", 0.9) + at(...side(57, Math.PI / 4 + 0.08), 14, `<circle r="1.4" fill="${GOLD}" ${S(0.7)}/>`, 2, 2);
    for (const a of [0.05, 1.5]) s += shape(face(56, a, 0), heart(0, 34, 7, 24), "#BFE3EE", 1.2) + lineOn(face(56, a, 0), [[0, 29], [0, 39]], "#FFFFFF", 1);
    s += tower(2.05) + tower(-0.45);
    // 2だんめ（クリーム）
    s += cyl(cx, cy, 56, 40, 44, lg([[0, "#FFF8EE"], [0.6, "#FFFFFF"], [1, "#F4EAD8"]], 0, 0, 1, 0), "#FFFFFF", 1.5) + drips(40, 100, "#F7B9C9", 12);
    for (let a = VIS[0]; a <= VIS[1] + 0.01; a += 0.55) { const [x, y] = side(36, a); s += ball(x, y, 104, 4, "#E0453D", 1.1, 0.6); }
    for (const a of [0.4, 1.2]) s += shape(face(40, a, 0), rr(-5, 68, 10, 14, 5), "#BFE3EE", 1.1);
    // 3だんめ（ミント）・クリーム・ろうそく
    s += cyl(cx, cy, 100, 25, 36, lg([[0, "#BFE6D6"], [0.6, "#D9F2E8"], [1, "#A7D6C1"]], 0, 0, 1, 0), "#E6F7EF", 1.5) + drips(25, 136, "#FFFFFF", 9);
    // ろうそくと はた（はたの ぼうより おくの ろうそくを さきに）
    const candle = ([x, y]) => cyl(x, y, 136, 1.8, 14, "#F2A7B8", "#FFFFFF", 1) + rod([[x, y, 150], [x, y, 152]], INK, 0.6), pole = cx + cy + 4;
    s += CANDLES.filter(([x, y]) => x + y < pole).map(candle).join("");
    s += rod([[cx, cy + 4, 136], [cx, cy + 4, 182]], GOLDD, 1.3) + at(cx + 1, cy + 4, 181, `<path d="M0,0 L13,4 L0,8 Z" fill="#F2A7B8" ${S(1)}/><path d="M4,3 l2,1 l-2,1 Z" fill="#FFFFFF"/>`, 14, 10);
    s += CANDLES.filter(([x, y]) => x + y >= pole).map(candle).join("");
    return s;
  };
  // とうの ワッフル コーンの こうし（よこの せん）
  function line3(k, x, y, r, z) { return k.line(ov(x, y, r, r, 20).filter(([s, t]) => Math.cos(Math.atan2(t - y, s - x) - Math.PI / 4) > -0.2).map(([s, t]) => [s, t, z]), "#B9803E", 0.9); }


  // ================= クレープやさん =================
  // びんの なかみ（いちご・チョコ・カラフル スプレー・バナナ・ブルーベリー・ナッツ）: [なかみ, なかみの うえ, ふた, つぶ]
  const JARS = [["#F7C6D6", "#E0453D", "#F2A7B8", "berry"], ["#C8A27C", "#7A4A2E", "#8E5A3C", "choco"], ["#FFFDF6", "#FFF6E8", "#9CC7E6", "sprinkle"], ["#FFF4C2", "#F7E08A", "#F7D56A", "banana"], ["#A9B4E8", "#5B63B8", "#C9B6E0", "blue"], ["#E8CFA8", "#C99A62", "#A9D6C2", "nut"]];
  const jarBit = (kind, j) => ({
    berry: `<circle r="1.7" fill="#E0453D" stroke="#9E2F28" stroke-width=".5"/>`,
    choco: `<rect x="-1.3" y="-1.3" width="2.6" height="2.6" rx=".6" fill="#5A3420"/>`,
    sprinkle: `<path d="M-1.5,-.6 L1.5,.6" stroke="${["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2"][j % 4]}" stroke-width="1.3" stroke-linecap="round"/>`,
    banana: `<circle r="1.8" fill="#FFF4C2" stroke="#D9B85A" stroke-width=".5"/><circle r=".45" fill="#B9974A"/>`,
    blue: `<circle r="1.5" fill="#3E4A9E"/><circle cx="-.4" cy="-.5" r=".45" fill="#9CA8E8"/>`,
    nut: `<ellipse rx="1.6" ry="1.1" fill="#B07A4A" stroke="#7A5232" stroke-width=".4"/>`,
  })[kind];
  M.shop_crepe_40 = (k) => {
    // トッピングの カウンター: ピンクと しろの しまの カウンター・しろい てんばん・フリルの ふち・うしろの だんに ガラスの びん 6つ・クレープの スタンド・ソースの ボトル・いちごの ボウル・ちいさな こくばん
    const { box, cyl, shape, FR, SD, TP, lineOn, onP, ball, dome, frustum, at, shadow, slab } = k;
    let s = shadow(0.12, 3, 8) + box(-62, -54, 124, 50, 0, 5, WOOD) + box(-60, -52, 120, 46, 5, 55, ["#FFF6E8", "#EADBC4", "#FFFDF6"]);
    // まえの しまと まんなかの クレープの マーク
    const panel = rr(-55, 9, 110, 42, 4);
    s += shape(FR(-5.9), panel, "#F7C6D6", 0);
    for (let x = -49; x < 52; x += 12) s += shape(FR(-5.85), rect(x, 10, 6, 40), "#FFFFFF", 0);
    s += lineOn(FR(-5.8), close(panel), INK, 1.1);
    s += onP(FR(-5.7), -13, 43, 26, 26, `<circle cx="13" cy="13" r="12" fill="#FFFFFF" ${S(1.2)}/><circle cx="13" cy="13" r="9.6" fill="none" stroke="#F2A7B8" stroke-width="1.1" stroke-dasharray="2 2"/><path d="M7,12 L19,12 L13,23 Z" fill="#F2CF8B" ${S(0.9)}/><path d="M9.5,16 L16.5,16 L13,23 Z" fill="#F7B9C9" ${S(0.7)}/><circle cx="9.8" cy="11" r="2.6" fill="#FFFFFF" ${S(0.8)}/><circle cx="16.2" cy="11" r="2.6" fill="#FFFFFF" ${S(0.8)}/><circle cx="13" cy="9.4" r="2.9" fill="#FFFFFF" ${S(0.8)}/><circle cx="13.6" cy="6.4" r="2" fill="#E0453D" ${S(0.7)}/>`);
    // みぎの よこ: ハート
    s += shape(SD(60.1), rr(-48, 10, 38, 40, 4), "#F7C6D6", 1.1) + shape(SD(60.2), heart(-29, 31, 9), "#FFFFFF", 1);
    // てんばんと フリル
    s += box(-64, -56, 128, 52, 60, 5, ["#FFFFFF", "#E6E1DA", "#FFFFFF"], 1.4);
    s += shape(FR(-3.9), [...scallop(-64, 64, 58, 3), [-64, 60], [64, 60]], "#F2A7B8", 1);
    // うしろの だんと びん
    s += box(-58, -54, 116, 15, 65, 8, WOOD);
    JARS.forEach(([c, top, lid, kind], i) => {
      const x = -46 + i * 18.4, y = -46.5;
      s += cyl(x, y, 73.5, 6.3, 11.5, c, top, 0.9);
      for (let j = 0; j < (kind === "sprinkle" ? 7 : 4); j++) { const a = -0.25 + j * (kind === "sprinkle" ? 0.33 : 0.62), z = 76 + ((j * 5) % 7); s += at(x + Math.cos(a) * 6.4, y + Math.sin(a) * 6.4, z, jarBit(kind, j), 2, 2); }
      s += cyl(x, y, 73, 7.2, 16, "rgba(225,242,250,.38)", "rgba(240,250,255,.5)", 1.2) + cyl(x, y, 89, 7.6, 3.6, lid, shade(lid, 0.18), 1.1);
      s += at(x + 3.6, y + 6.2, 84, `<path d="M-1,-2.6 q2,-1 3,0" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>`, 3, 3);
    });
    // クレープの スタンド（3ぼん）
    s += box(-26, -30, 32, 12, 65, 6, WOOD);
    [["#E0453D", "#F7B9C9"], ["#F7D56A", "#BFE3EE"], ["#7A4A2E", "#C9B6E0"]].forEach(([fruit, paper], i) => {
      const x = -19 + i * 9, y = -24;
      s += frustum(x, y, 71, 1.4, 86, 5.6, "#F2CF8B", "#FFF6E0", 1.1) + frustum(x, y, 71, 1.8, 79, 4.2, paper, paper, 1);
      s += dome(x, y, 85.5, 5.4, 5.4, 4.6, "#FFFFFF", 1) + ball(x + 0.6, y, 91.4, 2.2, fruit, 1, 0.6);
    });
    // ソースの ボトル（チョコ・いちご）
    for (const [x, c] of [[-52, "#7A4A2E"], [-43, "#E0453D"]]) s += cyl(x, -22, 65, 3.8, 13, c, shade(c, 0.2), 1.1) + frustum(x, -22, 78, 3, 84, 0.9, "#FFFFFF", "#FFFFFF", 1);
    // いちごの ボウル
    s += frustum(24, -22, 65, 6, 71, 9.5, "#FFFFFF", "#FCE4EC", 1.2);
    for (const [dx, dy] of [[-3.5, -2], [2.5, -3], [0, 1.5], [4.5, 1.2], [-4, 2.4]]) s += ball(24 + dx, -22 + dy, 72.6, 2.5, "#E0453D", 1, 0.6) + at(24 + dx, -22 + dy, 75.2, `<path d="M-1.6,0 L0,-1.4 L1.6,0" fill="#7FB06A" stroke="#5F8F55" stroke-width=".6"/>`, 2, 2);
    // ちいさな こくばん
    const b = slab([40, -14, 65], [1, 0, 0], [0, -0.34, 0.94], rr(0, 0, 16, 17, 2), 1.4, "#3E5A4A", WOOD[1], 1.1);
    s += b.s + onP(b.m, 2, 15, 12, 13, `<circle cx="6" cy="5" r="2.6" fill="#F2A7B8"/><path d="M4.6,2.6 L6,1.4 L7.4,2.6" fill="none" stroke="#9ED08C" stroke-width=".8"/><path d="M1.5,9.6 H10.5 M2.5,11.8 H9.5" stroke="#FFFFFF" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`);
    return s;
  };
  // かんらんしゃ（live の とき FurnLive が まわす）。わは 見る 人の ほうを むく ななめの 面（s は みぎへ・t は うえへ・f は てまえへ）
  const WHEEL = { cx: 0, cy: -55, cz: 116, R: 62, n: 8, spokes: 16 };
  const wheelPt = (s, t, f = 0) => [WHEEL.cx + (s + f) * Math.SQRT1_2, WHEEL.cy + (f - s) * Math.SQRT1_2, t];
  const GONDOLAS = [["#F7B9C9", "#E0453D"], ["#BFE3EE", "#F7D56A"], ["#FFF1B8", "#7A4A2E"], ["#C9B6E0", "#4F5BB3"]]; // つつみ がみ・くだもの（いちご・バナナ・チョコ・ブルーベリー）
  // クレープの ゴンドラ（うえの 0,0 で つる）
  const gondolaSvg = (i) => {
    const [paper, fruit] = GONDOLAS[i % 4];
    return `<path d="M0,0 V7" ${S(1.4)}/><path d="M-9,11 Q0,13.5 9,11 L1.2,27 Q0,28.6 -1.2,27 Z" fill="#F2CF8B" ${S(1.2)}/><path d="M-6,14.5 Q-1,17.5 5,13.6" fill="none" stroke="#D9A85C" stroke-width=".9"/>` +
      `<path d="M-6.2,18 Q0,19.5 6.2,18 L1.2,27 Q0,28.6 -1.2,27 Z" fill="${paper}" ${S(1.1)}/><path d="M-3.6,21.4 H3.6" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity=".8"/>` +
      `<circle cx="-5" cy="10" r="3.6" fill="#FFFFFF" ${S(1)}/><circle cx="5" cy="10" r="3.6" fill="#FFFFFF" ${S(1)}/><circle cx="0" cy="8.4" r="4" fill="#FFFFFF" ${S(1)}/><circle cx="1.4" cy="4.6" r="2.8" fill="${fruit}" ${S(1)}/><circle cx=".6" cy="3.7" r=".8" fill="#FFFFFF" opacity=".7"/><circle cx="0" cy="0" r="1.4" fill="${GOLD}" ${S(0.8)}/>`;
  };
  const WHEEL_ANG = 0.2;
  // かんらんしゃの まわりの ガス とう（よるは ひかる）
  const POSTS = [[-48, -14], [50, -96]];
  M.shop_crepe_50 = (k) => {
    // クレープの かんらんしゃ: ピンクの まるい だい（フリル）・うしろの しろい あし・パステルの わ（ほねと でんきゅう）・はなの まんなか・クレープの ゴンドラ 8つ・りょうはしの あかりの ぼう
    const { prism, shape, FR, SD, TP, line, at, shadow, rod, ball, L, P } = k, { cy, cz, R } = WHEEL;
    let s = shadow(0.12, 3, 26);
    s += prism(TP(10), rr(-58, -104, 116, 98, 22), [0, 0, -10], "#FFF1F5", "#F2C6D6", 1.4);
    s += shape(TP(10.1), rr(-50, -96, 100, 82, 16), "#FCE4EC", 0.9);
    s += shape(FR(-5.9), [...scallop(-36, 36, 7.5, 2.4), [-36, 9.5], [36, 9.5]], "#FFFFFF", 0.9) + shape(SD(57.9), [...scallop(-82, -28, 7.5, 2.4), [-82, 9.5], [-28, 9.5]], "#FFFFFF", 0.9);
    // うしろの あし・よこの ぼう・じく
    for (const sx of [-1, 1]) s += rod([wheelPt(sx * 50, 10, -14), wheelPt(sx * 2.5, cz - 2, -14)], "#FFFFFF", 3.6);
    s += rod([wheelPt(-27, 60, -14), wheelPt(27, 60, -14)], "#FFFFFF", 2.4) + rod([wheelPt(0, cz, -14), wheelPt(0, cz, -1)], CHROME[1], 3);
    // あかりの ぼう（しましま・まるい あかり）
    for (const [x, y] of POSTS) { s += rod([[x, y, 10], [x, y, 52]], "#FFFFFF", 2.4); for (let z = 16; z < 50; z += 8) s += line([[x, y, z], [x, y, z + 3.4]], "#F2A7B8", 2.2); s += ball(x, y, 56, 4.6, "#FFF1B8", 1.2, 0.6); }
    // わ（live では FurnLive）。はんいは まわっても おなじに なる よう 点を かぞえる
    for (const [ss, t] of [[-R - 12, cz + R + 6], [R + 12, cz + R + 6], [-R - 12, cz - R - 32], [R + 12, cz - R - 32]]) P(...wheelPt(ss, t));
    s += L(wheelSvg(k, WHEEL_ANG));
    return s;
  };
  // かんらんしゃの わ（SVG。live では おなじ ものを canvas に 描く: wheelDraw）
  function wheelSvg(k, ang) {
    const { line, at } = k, { cz, R, n, spokes } = WHEEL;
    const circ = (r, f = 0, N = 48) => Array.from({ length: N + 1 }, (_, i) => { const a = (i / N) * TAU; return wheelPt(Math.cos(a) * r, cz + Math.sin(a) * r, f); });
    let s = "";
    for (let i = 0; i < spokes; i++) { const a = ang + (i / spokes) * TAU, e = wheelPt(Math.cos(a) * R, cz + Math.sin(a) * R); s += line([wheelPt(0, cz), e], INK, 2.8) + line([wheelPt(0, cz), e], "#FFFFFF", 1.2); }
    s += line(circ(R - 18), INK, 4) + line(circ(R - 18), "#FFF4DC", 2.2);
    s += line(circ(R), INK, 8) + line(circ(R), "#F7B9C9", 5.4);
    for (let i = 0; i < spokes; i++) { const a = ang + ((i + 0.5) / spokes) * TAU; s += at(...wheelPt(Math.cos(a) * R, cz + Math.sin(a) * R, 0.6), `<circle r="1.9" fill="#FFF1B8" ${S(0.8)}/>`, 2, 2); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + ang; s += k.poly(Array.from({ length: 14 }, (_, j) => { const b = (j / 14) * TAU; return wheelPt(Math.cos(a) * 7.5 + Math.cos(b) * 4.4, cz + Math.sin(a) * 7.5 + Math.sin(b) * 4.4, 0.5); }), "#FFFFFF", 1); }
    s += k.poly(Array.from({ length: 16 }, (_, j) => { const b = (j / 16) * TAU; return wheelPt(Math.cos(b) * 5.2, cz + Math.sin(b) * 5.2, 0.7); }), "#F7D56A", 1.1);
    for (let i = 0; i < n; i++) { const a = ang + (i / n) * TAU; s += at(...wheelPt(Math.cos(a) * R, cz + Math.sin(a) * R, 3), gondolaSvg(i), 11, 2); }
    return s;
  }

  // ================= はいしゃさん =================
  M.shop_dentist_40 = (k) => {
    // ピカピカ はの ランプ: ミントの だい・クロームの ぼう・おくばの かたちの おおきな は（ねっこ 2ほん・あたまに ふくらみ 2つ）・にこにこの かお
    const { cyl, frustum, egg, eggAt, lathe, at, shadow, rod, rg } = k, cy = -23;
    let s = shadow(0.12, 4, 18) + cyl(0, cy, 0, 18, 6, "#A9D6C2", "#C9E8DA", 1.4) + frustum(0, cy, 6, 9, 10, 5, "#BFE3D3", "#D9F2E8", 1.1);
    s += rod([[0, cy, 10], [0, cy, 52]], CHROME[2], 2.6);
    // ねっこ（さきが ほそい）→ あたまの ふくらみ → は の あたま。ねっこと ふくらみは 見る 人から みて よこに ならべる（ななめの むき u）
    // ぜんぶを 1つの かたちに する: さきに ふちどり（くろ）を まとめて 描き、うえから ぬりを 線なしで
    const u = (d) => [d * Math.SQRT1_2, cy - d * Math.SQRT1_2], WH = rg([[0, "#FFFFFF"], [0.7, "#F6FAFC"], [1, "#DCEBF2"]], 0.38, 0.3, 0.85);
    const parts = (fill, sw) => [-10, 10].map((d) => lathe(...u(d), [[8.5, 76], [7.5, 62], [3.2, 50]], fill || "#F2F8FA", sw)).join("") + [-11, 11].map((d) => egg(...u(d), 90, 11, 9.5, 7.5, fill || "#FFFFFF", sw)).join("") + egg(0, cy, 80, 22.5, 15.5, 15, fill || WH, sw);
    s += parts(INK, 3.2) + parts(null, 0);
    const [fx, fy, fz] = eggAt(0, cy, 80, 22.5, 15.5, 15, Math.PI / 4, 0.05);
    s += at(fx, fy, fz, `<ellipse cx="-5.6" cy="-1.6" rx="1.6" ry="2.3" fill="${INK}"/><ellipse cx="5.6" cy="-1.6" rx="1.6" ry="2.3" fill="${INK}"/><circle cx="-5.2" cy="-2.4" r=".6" fill="#FFFFFF"/><circle cx="6" cy="-2.4" r=".6" fill="#FFFFFF"/><path d="M-3.6,2.8 Q0,6.6 3.6,2.8" fill="#F28B9B" ${S(1.2)}/><ellipse cx="-10" cy="2.4" rx="2.6" ry="1.6" fill="#F7A9B8" opacity=".8"/><ellipse cx="10" cy="2.4" rx="2.6" ry="1.6" fill="#F7A9B8" opacity=".8"/>`, 12, 8);
    s += at(fx - 11, fy - 5, fz + 9, `<ellipse rx="2.6" ry="4.6" transform="rotate(38)" fill="#FFFFFF" opacity=".95"/>`, 4, 6);
    return s;
  };
  // しんじゅの かいがら ベッド（まんなかの おおきな しんじゅ）
  const PEARL = { x: 0, y: -96, z: 50, r: 10 };
  M.shop_dentist_50 = (k) => {
    // しんじゅの かいがら ベッド: しんじゅの あし・ひらいた かいがらの したの はんぶん（すじ・なみの ふち）・ふかふかの マット・うしろに たつ うえの かいがら・まくら 2つ・まんなかの おおきな しんじゅ・ふちの しんじゅの つぶ
    const { lathe, shape, TP, line, lineOn, ball, egg, slab, shadow, rg, at } = k, cx = 0, cy = -54, sy = 0.7;
    let s = shadow(0.12, 3, 40);
    for (const [x, y] of [[-48, -30], [48, -30], [-48, -80], [48, -80]]) s += ball(x, y, 3, 3.4, "#FFFFFF", 1, 0.7);
    // うしろの かいがら（たって いる）
    const fan = [];
    for (let i = 0; i <= 64; i++) { const a = (18 + (144 * i) / 64) * (Math.PI / 180), q = 80 + Math.abs(Math.sin(i * Math.PI / 8)) * 4.5; fan.push([Math.cos(a) * q, Math.sin(a) * q]); }
    const back = slab([0, -100, 24], [1, 0, 0], [0, -0.34, 0.94], [[12, 0], ...fan, [-12, 0]], 6, rg([[0, "#FFF7FB"], [0.55, "#F6DDEA"], [1, "#DCD3F0"]], 0.5, 0.95, 1.1), "#D9C4E6", 1.5);
    s += back.s;
    for (let i = 1; i < 8; i++) { const a = (18 + (144 * i) / 8) * (Math.PI / 180); s += lineOn(back.m, [[Math.cos(a) * 10, Math.sin(a) * 10], [Math.cos(a) * 80, Math.sin(a) * 80]], "#E7C9DC", 2.2); }
    s += shape(back.m, ov(0, 0, 13, 9, 20), "#F6DDEA", 1.3);
    // したの かいがら（ボウル）・すじ
    s += lathe(cx, cy, [[60, 4], [70, 26]], k.lg([[0, "#F6DDEA"], [1, "#FFF4F8"]], 0, 1, 0, 0), 1.5, "", sy);
    for (let a = VIS[0] + 0.12; a < VIS[1]; a += 0.3) s += line([[cx + Math.cos(a) * 60, cy + Math.sin(a) * 60 * sy, 5], [cx + Math.cos(a) * 70, cy + Math.sin(a) * 70 * sy, 25]], "#E7C9DC", 1.6);
    s += shape(TP(26), wavy(cx, cy, 70, 2.4, 14, sy), "#FFF4F8", 1.4);
    // マット・まくら・しんじゅ
    s += k.prism(TP(33), ov(cx, cy, 60, 40, 36), [0, 0, -7], "#FDF2F7", "#F2C6D6", 1.4) + lineOn(TP(33.1), close(ov(cx, cy, 48, 31, 36)), "#F2C6D6", 1.1, 'stroke-dasharray="3 3"');
    for (const [x, c] of [[-28, "#D7F0F0"], [28, "#E6DDF6"]]) s += egg(x, -78, 40, 17, 9, 6.5, c, 1.3);
    s += ball(PEARL.x, PEARL.y, PEARL.z, PEARL.r, rg([[0, "#FFFFFF"], [0.45, "#FBEFF6"], [1, "#D9CBE8"]], 0.34, 0.3, 0.8), 1.4, 0.75);
    for (let a = VIS[0] + 0.06; a <= VIS[1] - 0.05; a += 0.2) s += ball(cx + Math.cos(a) * 71, cy + Math.sin(a) * 71 * sy, 27.5, 2.2, "#FFFFFF", 0.9, 0.7);
    // ふちで ひとやすみの ヒトデ
    s += at(-40, -27, 34, `<path d="${starPath(0, -3, 6.4, 2.8)}" fill="#F7A08A" ${S(1)}/><circle cx="0" cy="-3" r=".8" fill="#FFF1E8"/><circle cx="0" cy="-6.6" r=".55" fill="#FFF1E8"/><circle cx="-3.4" cy="-4.1" r=".55" fill="#FFF1E8"/><circle cx="3.4" cy="-4.1" r=".55" fill="#FFF1E8"/>`, 7, 9);
    return s;
  };

  // ================= パンやさん =================
  M.shop_bakery_40 = (k) => {
    // クロワッサンの ソファ: うしろを ぐるっと かこむ こんがりの クロワッサン（まんなかが ふとい・はしは ほそい）・クリームいろの ざぶとん・バターと ジャムの クッション
    const { prism, shape, TP, lineOn, egg, at, shadow, rg, box } = k, cx = 0, cy = -38;
    let s = shadow(0.12, 4, 26);
    const N = 11, segs = Array.from({ length: N }, (_, i) => {
      const u = i / (N - 1), a = (150 + 240 * u) * (Math.PI / 180), r = 9 + 13 * Math.sin(Math.PI * u), x = cx + Math.cos(a) * 56, y = cy + Math.sin(a) * 28;
      return { x, y, r, i, back: y < -54 || x < -40 };
    });
    const CR = [rg([[0, "#F8D598"], [0.55, "#E3A55A"], [1, "#B9722F"]], 0.38, 0.3, 0.85), rg([[0, "#F4C47E"], [0.55, "#D99245"], [1, "#A9652A"]], 0.38, 0.3, 0.85)];
    const seg = ({ x, y, r, i }) => egg(x, y, r * 1.25 + 2, r, r, r * 1.25, CR[i % 2], 1.4) + at(x - r * 0.25, y + r * 0.2, r * 2.1 + 2, `<ellipse rx="${f2(r * 0.42)}" ry="${f2(r * 0.16)}" transform="rotate(-22)" fill="#FFFFFF" opacity=".38"/>`, 4, 3);
    const order = segs.slice().sort((p, q) => p.x + p.y - (q.x + q.y));
    s += order.filter((q) => q.back).map(seg).join("");
    // ざぶとん
    s += prism(TP(22), rr(-44, -56, 88, 40, 16), [0, 0, -18], "#FBE7C0", "#E9C98E", 1.4) + prism(TP(30), rr(-40, -53, 80, 34, 14), [0, 0, -8], "#FFF8E6", "#F2DDAE", 1.3);
    s += lineOn(TP(30.1), close(rr(-34, -48, 68, 24, 10)), "#EBCF96", 1, 'stroke-dasharray="2.6 2.6"');
    // バター（しかくい）と ジャム（まるい）の クッション
    s += box(-30, -50, 18, 12, 30, 12, ["#FFF1A8", "#EBD67A", "#FFF8CF"], 1.2) + at(-21, -38, 38, `<path d="M-3,0 q0,4 2,4 q1,0 1,-2" fill="#FFF8CF" ${S(0.8)}/>`, 4, 4);
    s += egg(18, -46, 38, 10, 7, 9, rg([[0, "#F58A8A"], [0.6, "#E0453D"], [1, "#B5322C"]], 0.36, 0.3, 0.8), 1.3) + at(18, -40, 46, `<path d="M-3,-1 L0,-3.4 L3,-1" fill="#8DBA78" ${S(0.8)}/>`, 4, 4);
    s += order.filter((q) => !q.back).map(seg).join("");
    return s;
  };
  // ふうしゃの はね（live の とき FurnLive が まわす）: まんなか hub・はねの ながさ R
  const MILL = { cx: 0, cy: -52, R: 84, hubZ: 142, hubF: 31, n: 4 };
  const millPt = (s, t, f = 0) => [MILL.cx + (MILL.hubF + f + s) * Math.SQRT1_2, MILL.cy + (MILL.hubF + f - s) * Math.SQRT1_2, MILL.hubZ + t];
  // はね 1まいの かたち（めんの s, t）: ぼう・ぬのの わく・こうし
  const sailPolys = (a) => {
    const c = Math.cos(a), sn = Math.sin(a), q = (r, w) => [r * c - w * sn, r * sn + w * c];
    return { spar: [q(6, 0), q(MILL.R, 0)], cloth: [q(18, 1.5), q(MILL.R, 1.5), q(MILL.R, 17), q(18, 15)], rungs: [30, 42, 54, 66, 78].map((r) => [q(r, 1.5), q(r, 16.5)]), rail: [q(18, 9), q(MILL.R, 9.4)] };
  };
  const millSailsSvg = (k, ang) => {
    let s = "";
    const L3 = (ps, f = 0) => ps.map(([a, b]) => millPt(a, b, f));
    for (let i = 0; i < MILL.n; i++) {
      const { spar, cloth, rungs, rail } = sailPolys(ang + (i / MILL.n) * TAU);
      s += k.poly(L3(cloth, 0.4), "#FFF4DE", 1.2, 'fill-opacity=".92"');
      for (const r of rungs) s += k.line(L3(r, 0.5), "#B98A55", 1.1);
      s += k.line(L3(rail, 0.5), "#B98A55", 1.1) + k.line(L3(spar, 1), INK, 4.2) + k.line(L3(spar, 1), "#A8743F", 2.4);
    }
    return s + k.ball(...millPt(0, 0, 2), 5, "#E3C06B", 1.2, 0.5);
  };
  // こむぎの たば・こなの ふくろ（ゆかに たてる 小さな 絵）
  const WHEAT = Array.from({ length: 9 }, (_, i) => { const a = (i - 4) * 0.13, x = Math.sin(a) * 26, y = -Math.cos(a) * 26; return `<path d="M${f2(x * 0.12)},-2 Q${f2(x * 0.3)},-14 ${f2(x)},${f2(y)}" fill="none" stroke="#C99A3E" stroke-width="1.3" stroke-linecap="round"/>` + [0, 1, 2].map((j) => `<ellipse cx="${f2(x * (1 - j * 0.07))}" cy="${f2(y + 1.5 + j * 3)}" rx="1.4" ry="2.4" transform="rotate(${f2((a * 180) / Math.PI)} ${f2(x * (1 - j * 0.07))} ${f2(y + 1.5 + j * 3)})" fill="#E8C46A" stroke="#B98A3A" stroke-width=".5"/>`).join(""); }).join("") +
    `<path d="M-4,-12 Q0,-10 4,-12" fill="none" stroke="#F2A7B8" stroke-width="2.6" stroke-linecap="round"/><path d="M0,-11.4 l-3,4 M0,-11.4 l3,4" stroke="#F2A7B8" stroke-width="1.4" stroke-linecap="round"/>`;
  const SACK = `<path d="M-7,0 Q-9,-9 -4.5,-13 L-3,-15.5 Q0,-14 3,-15.5 L4.5,-13 Q9,-9 7,0 Z" fill="#FFF8EC" ${S(1.2)}/><path d="M-4,-13 Q0,-11.6 4,-13" fill="none" stroke="#C9A26E" stroke-width="1.4"/><path d="M0,-3 V-9 M0,-7 l-2,-1.6 M0,-5.4 l2,-1.6 M0,-7 l2,-1.6 M0,-5.4 l-2,-1.6" fill="none" stroke="#D9A85C" stroke-width=".9" stroke-linecap="round"/>`;
  M.shop_bakery_50 = (k) => {
    // こむぎの ふうしゃ: レンガの どだい・クリームいろの とう（まど 3つ・パンの とびら）・パンの やねの ぼうし・まえの はね 4まい（ぬのと こうし）・こむぎの たば・こなの ふくろ
    const { frustum, lathe, cyl, at, shadow, rod, line, rg, L, P, egg } = k, { cx, cy } = MILL;
    let s = shadow(0.12, 4, 30);
    s += frustum(cx, cy, 0, 38, 16, 36.5, "#E7A08A", "#F2BBA6", 1.4);
    for (let a = VIS[0] + 0.15; a < VIS[1]; a += 0.32) for (const z of [5, 11]) s += at(cx + Math.cos(a + (z > 6 ? 0.16 : 0)) * 37.6, cy + Math.sin(a + (z > 6 ? 0.16 : 0)) * 37.6, z, `<path d="M-2.4,0 H2.4" stroke="#C9806A" stroke-width="1" stroke-linecap="round"/>`, 3, 2);
    s += frustum(cx, cy, 16, 34, 128, 25, rg([[0, "#FFF9EE"], [0.55, "#FFF1DC"], [1, "#EBD7B8"]], 0.3, 0.4, 1), "#F2E2C6", 1.5);
    for (const z of [48, 84]) s += ring(k, cx, cy, 34 - ((z - 16) / 112) * 9 + 0.3, z, "#E6D2B0", 1.4);
    // とびら（パンの かたち）と まど
    const front = (z) => { const r = 34 - ((z - 16) / 112) * 9 + 0.4; return [cx + r * Math.SQRT1_2, cy + r * Math.SQRT1_2, z]; };
    s += at(...front(16), `<path d="M-9,0 V-16 Q-9,-26 0,-26 Q9,-26 9,-16 V0 Z" fill="#B97A45" ${S(1.3)}/><path d="M-6,-1 V-15 Q-6,-22 0,-22 Q6,-22 6,-15 V-1" fill="#D9A35E" stroke="#9A6238" stroke-width="1"/><path d="M-3,-17 q3,-2 6,0 M-3.4,-11 q3.4,-2 6.8,0" fill="none" stroke="#9A6238" stroke-width=".9"/><circle cx="4" cy="-8" r="1.1" fill="${GOLD}"/>`, 10, 27);
    for (const [z, dx] of [[58, -12], [64, 13], [100, 0]]) s += at(front(z)[0] + dx * Math.SQRT1_2, front(z)[1] - dx * Math.SQRT1_2, z, `<path d="M-5,4 V-3 Q-5,-8 0,-8 Q5,-8 5,-3 V4 Z" fill="#BFE3EE" ${S(1.1)}/><path d="M0,-8 V4 M-5,-1 H5" stroke="#FFFFFF" stroke-width="1.1"/><rect x="-6.5" y="4" width="13" height="3" rx="1" fill="#B97A45" ${S(0.8)}/><circle cx="-3.4" cy="3.4" r="1.4" fill="#F2A7B8"/><circle cx="0" cy="3" r="1.4" fill="#F7D56A"/><circle cx="3.4" cy="3.4" r="1.4" fill="#F2A7B8"/>`, 8, 9);
    // パンの やね・じく
    s += cyl(cx, cy, 126, 27.5, 4, "#C9874A", "#E3A86A", 1.3) + lathe(cx, cy, Array.from({ length: 9 }, (_, i) => { const t = (i / 8) * (Math.PI / 2); return [27 * Math.cos(t), 130 + 30 * Math.sin(t)]; }), rg([[0, "#F6CF93"], [0.55, "#E0A160"], [1, "#B8773E"]], 0.36, 0.28, 0.85), 1.5);
    for (const [a, b] of [[0.2, 0.55], [0.85, 0.5], [1.5, 0.55]]) { const p0 = [cx + Math.cos(a) * 27 * Math.cos(b), cy + Math.sin(a) * 27 * Math.cos(b), 130 + 30 * Math.sin(b)]; s += at(...p0, `<path d="M-5,1 Q0,-3 5,1" fill="none" stroke="#9A6238" stroke-width="1.3" stroke-linecap="round"/>`, 6, 4); }
    s += rod([[cx, cy, MILL.hubZ], millPt(0, 0, 0)], "#8C6848", 2.6);
    // こむぎの たば・こなの ふくろ
    for (const [x, y] of [[-40, -14], [44, -40]]) s += at(x, y, 0, WHEAT, 12, 34);
    for (const [x, y] of [[22, -8], [33, -17]]) s += at(x, y, 0, SACK, 9, 18);
    // はね（live では FurnLive）。はんいは まわっても おなじに なる よう 点を かぞえる
    for (const [a, b] of [[-MILL.R - 6, MILL.R + 6], [MILL.R + 6, MILL.R + 6], [-MILL.R - 6, -MILL.R - 6], [MILL.R + 6, -MILL.R - 6]]) P(...millPt(a, b));
    s += L(millSailsSvg(k, Math.PI / 4));
    return s;
  };

  // ================= おはなやさん =================
  // ひまわりの かお（あかりの まんなか）
  const SUN = { y: -26, z: 104 };
  M.shop_florist_40 = (k) => {
    // ひまわりの ランプ: テラコッタの はちうえ・みどりの くき・は 2まい・見る 人の ほうを むいた おおきな ひまわり（はなびら 2だん・ちゃいろの まんなか・にこにこ）
    const { frustum, cyl, shape, tilt, rod, ball, at, shadow } = k, cy = SUN.y;
    let s = shadow(0.12, 4, 18) + frustum(0, cy, 0, 12, 22, 16, "#E89A6A", "#C97A4C", 1.4) + cyl(0, cy, 20, 17, 4, "#F2AE80", "#7A5232", 1.3);
    s += rod([[0, cy, 23], [0, cy, SUN.z - 4]], "#7FB06A", 3.4);
    const face = (dz) => tilt([0, cy, dz], [Math.SQRT1_2, -Math.SQRT1_2, 0], [0, 0, 1]);
    for (const [z, sx, rot] of [[50, -1, -0.7], [70, 1, 0.7]]) { const m = face(z); s += shape(m, rot2([[0, 0], [sx * 6, 4], [sx * 14, 6], [sx * 20, 3], [sx * 14, -2], [sx * 6, -2]], 0, 0, rot * 0.3), "#8DBA78", 1.2) + k.lineOn(m, [[0, 0], [sx * 16, 3]], "#6E9C5B", 1); }
    const m = tilt([0, cy, SUN.z], [Math.SQRT1_2, -Math.SQRT1_2, 0], [0.18, 0.18, 0.97]);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.11; s += shape(m, rot2(ov(0, 17, 4.6, 9.5, 14), 0, 0, a), "#F2B53A", 1.1); }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.11 + TAU / 28; s += shape(m, rot2(ov(0, 14.5, 4.4, 8.6, 14), 0, 0, a), "#F7D56A", 1.1); }
    s += shape(m, ov(0, 0, 10.5, 10.5, 28), "#8A5A33", 1.3) + shape(m, ov(0, 0, 7.6, 7.6, 24), "#6E4528", 0);
    s += k.onP(m, -7, 6, 14, 12, `<circle cx="4" cy="5" r="1.2" fill="${INK}"/><circle cx="10" cy="5" r="1.2" fill="${INK}"/><path d="M4.6,8.2 Q7,10.4 9.4,8.2" fill="none" stroke="#F7D56A" stroke-width="1.1" stroke-linecap="round"/><circle cx="2.4" cy="8" r="1.1" fill="#F29A5B" opacity=".8"/><circle cx="11.6" cy="8" r="1.1" fill="#F29A5B" opacity=".8"/>`);
    return s;
  };
  // ガゼボ（まんなか・はしらの はんけい）
  const GAZ = { cx: 0, cy: -55, r: 46, eave: 150 };
  M.shop_florist_50 = (k) => {
    // おはなの ガゼボ: しろい まるい ゆか（2だん）・はなの つるが まく しろい はしら 6ぽん・うしろ はんぶんの まるい ベンチ（ピンクの ざぶとん）・ミントの まるい やね（フリルと はなの ふち）・つりさげの はなかご・はちうえ
    const { cyl, line, poly, ball, at, lathe, rod, shadow, rg } = k, { cx, cy, r, eave } = GAZ;
    let s = shadow(0.12, 4, 44) + cyl(cx, cy, 0, 56, 4, "#E6DED2", "#FFFDF8", 1.4) + cyl(cx, cy, 4, 51, 5, "#EFE8DC", "#FFFFFF", 1.3);
    for (let x = -40; x <= 40; x += 10) { const h = Math.sqrt(50 * 50 - x * x); s += line([[cx + x, cy - h, 9.1], [cx + x, cy + h, 9.1]], "#EEE6DA", 1); }
    const arcPts3 = (rad, z, a0 = (3 * Math.PI) / 4 - 0.02, a1 = (7 * Math.PI) / 4 + 0.02, n = 20) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, z]; });
    const colAt = (i) => { const a = Math.PI / 6 + (i / 6) * TAU; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const col = (i) => {
      const [x, y] = colAt(i);
      let c = cyl(x, y, 9, 3.4, eave - 9, "#F4EFE6", "#FFFFFF", 1.3) + cyl(x, y, 9, 5, 4, "#EFE8DC", "#FFFFFF", 1.1);
      const vine = Array.from({ length: 25 }, (_, j) => { const z = 12 + j * 5.4, a = j * 0.9; return [x + Math.cos(a) * 3.8, y + Math.sin(a) * 3.8, z]; }).filter(([px, py]) => Math.cos(Math.atan2(py - y, px - x) - Math.PI / 4) > -0.1);
      for (const v of vine) c += at(...v, `<circle r="1.8" fill="${["#F2A7B8", "#FFFFFF", "#F7B9C9"][Math.round(v[2]) % 3]}" ${S(0.6)}/>`, 2, 2);
      return c + line([[x, y, 14], [x, y, eave - 8]], "#8DBA78", 1, 'stroke-dasharray="1.2 4.2" stroke-opacity=".9"');
    };
    const isBack = (i) => { const [x, y] = colAt(i); return x - cx + (y - cy) < 0; };
    for (let i = 0; i < 6; i++) if (isBack(i)) s += col(i);
    // ベンチ（うしろ はんぶん）
    s += poly([...arcPts3(41, 26), ...arcPts3(41, 56).reverse()], "#FFFFFF", 1.4) + poly([...arcPts3(41, 56), ...arcPts3(44, 56).reverse()], "#EFE8DC", 1.2);
    for (let i = 1; i < 10; i++) { const a = (3 * Math.PI) / 4 + (i / 10) * Math.PI; s += line([[cx + Math.cos(a) * 41, cy + Math.sin(a) * 41, 30], [cx + Math.cos(a) * 41, cy + Math.sin(a) * 41, 52]], "#E6DED2", 1.2); }
    s += poly([...arcPts3(31, 26), ...arcPts3(41, 26).reverse()], "#F7C6D6", 1.3) + poly([...arcPts3(31, 14), ...arcPts3(31, 26).reverse()], "#FFFFFF", 1.3);
    for (let i = 0; i < 5; i++) { const a = (3 * Math.PI) / 4 + ((i + 0.5) / 5) * Math.PI; s += k.egg(cx + Math.cos(a) * 37, cy + Math.sin(a) * 37, 31, 6, 6, 4.6, ["#FCE4EC", "#E6DDF6", "#D7F0F0"][i % 3], 1.1); }
    for (let i = 0; i < 6; i++) if (!isBack(i)) s += col(i);
    // やね
    s += cyl(cx, cy, eave, 62, 5, "#BFE6D6", "#D9F2E8", 1.4);
    s += lathe(cx, cy, [[60, eave + 5], [55, eave + 15], [44, eave + 27], [28, eave + 37], [12, eave + 43], [0, eave + 44]], rg([[0, "#E6F7EF"], [0.6, "#BFE6D6"], [1, "#94CDB4"]], 0.36, 0.28, 0.9), 1.5);
    for (let a = VIS[0] + 0.2; a < VIS[1] - 0.1; a += 0.42) s += line([[cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, eave + 5], [cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, eave + 42]], "#FFFFFF", 1.4, 'stroke-opacity=".8"');
    for (let a = VIS[0] - 0.05; a <= VIS[1] + 0.05; a += 0.26) s += at(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, eave, `<path d="M-5,0 Q-5,6 0,6 Q5,6 5,0 Z" fill="#FFFFFF" ${S(1)}/>`, 6, 2);
    for (let a = VIS[0] + 0.1; a <= VIS[1]; a += 0.52) s += at(cx + Math.cos(a) * 62.5, cy + Math.sin(a) * 62.5, eave + 3, `<circle r="2.6" fill="${["#F2A7B8", "#F7D56A", "#C9B6E0"][Math.round(a * 3) % 3 < 0 ? 0 : Math.round(a * 3) % 3]}" ${S(0.8)}/><circle r="1" fill="#FFFFFF"/>`, 3, 3);
    s += rod([[cx, cy, eave + 44], [cx, cy, eave + 54]], GOLDD, 1.4) + ball(cx, cy, eave + 57, 3.6, GOLD, 1.1, 0.5);
    // つりさげの はなかご（てまえの はしらの あいだ）
    for (const a of [Math.PI / 4 - 0.52, Math.PI / 4 + 0.52]) { const x = cx + Math.cos(a) * 54, y = cy + Math.sin(a) * 54; s += line([[x, y, eave], [x, y, 124]], INK, 0.9) + at(x, y, 120, `<path d="M-7,-4 Q0,6 7,-4 Z" fill="#C9A26E" ${S(1)}/>${[[-4, -6, "#F2A7B8"], [0, -8, "#F7D56A"], [4, -6, "#C9B6E0"], [-2, -3, "#FFFFFF"], [3, -3, "#F2A7B8"]].map(([x2, y2, c2]) => `<circle cx="${x2}" cy="${y2}" r="2.4" fill="${c2}" ${S(0.6)}/>`).join("")}<path d="M-6,-3 q-2,5 -1,8 M6,-3 q2,5 1,8" fill="none" stroke="#7FB06A" stroke-width="1.1"/>`, 9, 10); }
    // はちうえ（まえの りょうはし）
    for (const [x, y] of [[-46, -8], [52, -64]]) s += k.frustum(x, y, 0, 6, 12, 8, "#F2BBA6", "#7A5232", 1.2) + at(x, y, 12, SPR.blooms(), 8, 14);
    return s;
  };

  // ================= そらの はいたつ =================
  // くもの かたまり: さきに ふちどりを まとめて 描き、うえから ぬりを 線なしで（1つの くもに なる）
  const cloud = (k, puffs, fill, sw = 1.5) => puffs.map(([x, y, z, r, rz]) => k.egg(x, y, z, r, r * 0.86, rz || r * 0.8, INK, sw * 2)).join("") + puffs.map(([x, y, z, r, rz]) => k.egg(x, y, z, r, r * 0.86, rz || r * 0.8, fill, 0)).join("");
  M.shop_relay_40 = (k) => {
    // くもの ソファ: ふわふわの くもの せもたれ・ざぶとん・ひじかけ・にじの クッション・あまつぶの クッション
    const { rg, egg, at, shadow, prism, FR, TP, shape } = k, W = rg([[0, "#FFFFFF"], [0.7, "#F4FAFF"], [1, "#D5E9F7"]], 0.36, 0.3, 0.9);
    let s = shadow(0.1, 3, 26);
    s += cloud(k, [[-46, -56, 40, 18, 18], [-22, -60, 48, 20, 20], [4, -60, 50, 21, 21], [28, -58, 46, 19, 19], [50, -54, 38, 16, 16], [-34, -58, 60, 13, 12], [16, -60, 64, 14, 12]], W);
    s += cloud(k, [[-34, -34, 14, 18, 12], [-10, -36, 15, 19, 13], [14, -36, 15, 19, 13], [36, -34, 14, 18, 12], [-24, -16, 11, 15, 9], [2, -16, 12, 16, 9], [28, -16, 11, 15, 9]], W);
    // ざぶとん（うすい そらいろ）・ひじかけの くも
    s += prism(TP(27), rr(-44, -50, 88, 38, 16), [0, 0, -6], "#EEF7FD", "#C9E2F3", 1.4) + k.lineOn(TP(27.1), close(rr(-38, -45, 76, 28, 12)), "#C9E2F3", 1, 'stroke-dasharray="3 3"');
    s += cloud(k, [[-54, -40, 30, 13, 12], [-54, -22, 26, 12, 11], [-56, -56, 34, 12, 11]], W) + cloud(k, [[56, -38, 30, 13, 12], [56, -20, 26, 12, 11], [54, -54, 34, 12, 11]], W);
    // にじの クッション（せもたれに もたれる）
    const m = k.tilt([-30, -44, 26], [1, 0, 0], [0, -0.42, 0.9]);
    ["#F2A7B8", "#F7D56A", "#A9D6C2", "#9CC7E6"].forEach((c, i) => { s += shape(m, arc(15, 0, 15 - i * 3.2, 15 - i * 3.2, Math.PI, 0, 18).concat(arc(15, 0, 11.8 - i * 3.2, 11.8 - i * 3.2, 0, Math.PI, 18)), c, 1.1); });
    s += egg(1, -42, 34, 4, 4, 4, "#FFFFFF", 1) + egg(29, -42, 34, 4, 4, 4, "#FFFFFF", 1);
    // あまつぶの クッション
    s += at(22, -40, 26, `<path d="M0,-22 C-5,-14 -11,-8 -11,-2 C-11,5 -6,9 0,9 C6,9 11,5 11,-2 C11,-8 5,-14 0,-22 Z" fill="#BFE3EE" ${S(1.3)}/><path d="M-5,-4 q0,-5 3,-8" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/><circle cx="-3.4" cy="0" r="1" fill="${INK}"/><circle cx="3.4" cy="0" r="1" fill="${INK}"/><path d="M-1.6,3 Q0,4.6 1.6,3" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`, 12, 24);
    return s;
  };
  // ひこうせんの プロペラ（live の とき FurnLive が まわす）: ゴンドラの まえ
  const AIRPROP = { x: 50, y: -46, z: 32, len: 13 };
  const airPropPts = (a) => { const ux = Math.cos(a), uz = Math.sin(a), { y, z, len } = AIRPROP; return [[y + ux * 2 - uz * 2.2, z + uz * 2 + ux * 2.2], [y + ux * len - uz * 3.4, z + uz * len + ux * 3.4], [y + ux * (len + 1.6), z + uz * (len + 1.6)], [y + ux * len + uz * 3.4, z + uz * len - ux * 3.4], [y + ux * 2 + uz * 2.2, z + uz * 2 - ux * 2.2]]; };
  M.shop_relay_50 = (k) => {
    // くじらの ひこうせん: したの くも・きの ゴンドラ（てすり・まど・はた）・ロープ・そらいろの くじらの ききゅう（しろい おなか・め・ひれ・しっぽ・しおふき）・まえの プロペラ
    const { prism, shape, TP, FR, SD, line, rod, egg, eggAt, at, ball, shadow, rg, lg, L } = k;
    let s = shadow(0.1, 3, 30);
    s += cloud(k, [[-56, -30, 5, 18, 8], [-30, -18, 5, 20, 9], [0, -16, 5, 20, 9], [30, -20, 5, 20, 9], [54, -32, 5, 18, 8], [60, -58, 5, 16, 8], [-60, -60, 5, 16, 8], [-36, -76, 5, 18, 8], [-4, -82, 5, 18, 8], [28, -78, 5, 18, 8], [0, -48, 6, 24, 9]], rg([[0, "#FFFFFF"], [1, "#DCEEFA"]], 0.4, 0.3, 0.9), 1.3);
    // ゴンドラ
    const hull = [[-38, -58], [30, -58], [46, -46], [30, -34], [-38, -34], [-44, -46]];
    s += prism(TP(40), hull, [0, 0, -16], "#E9C590", "#B98F58", 1.4) + shape(TP(40.1), [[-34, -55], [28, -55], [40, -46], [28, -37], [-34, -37], [-39, -46]], "#C9A26E", 1);
    s += line([[-44, -46, 32], [-38, -34, 32], [30, -34, 32], [46, -46, 32]], "#A88457", 1.2) + line([[-38, -34, 28], [30, -34, 28]], "#A88457", 1);
    for (const x of [-26, -6, 14]) s += shape(FR(-33.9), rr(x, 30, 10, 7, 2.5), "#BFE3EE", 1);
    for (const [x, y] of [[-38, -34], [30, -34], [46, -46], [-44, -46]]) s += rod([[x, y, 40], [x, y, 48]], "#A88457", 1.2);
    s += line([[-44, -46, 48], [-38, -34, 48], [30, -34, 48], [46, -46, 48]], INK, 3) + line([[-44, -46, 48], [-38, -34, 48], [30, -34, 48], [46, -46, 48]], "#E3C391", 1.4);
    s += rod([[-36, -46, 40], [-36, -46, 62]], "#8C6848", 1.2) + at(-35, -46, 61, `<path d="M0,0 L10,3 L0,6 Z" fill="#F2A7B8" ${S(0.9)}/>`, 11, 7);
    // ロープ
    for (const [x0, y0, x1, y1] of [[-30, -56, -24, -52], [24, -56, 20, -52], [-30, -36, -24, -40], [24, -36, 20, -40]]) s += line([[x0, y0, 40], [x1, y1, 92]], INK, 2.2) + line([[x0, y0, 40], [x1, y1, 92]], "#E8D2A8", 1);
    // くじら
    const B = { x: 2, y: -46, z: 122, rx: 58, ry: 30, rz: 33 };
    const BODY = lg([[0, "#8EC5EA"], [0.55, "#78B4E0"], [0.8, "#BFE0F5"], [1, "#EAF5FC"]], 0, 0, 0, 1);
    // しっぽ（おく）
    s += egg(-52, -46, 132, 14, 10, 11, BODY, 1.4);
    s += prism(FR(-44), [[-60, 138], [-68, 141], [-78, 154], [-72, 154], [-66, 148], [-63, 157], [-57, 155], [-58, 144]], [0, -4, 0], "#8EC5EA", "#5E9CC8", 1.4);
    s += egg(B.x, B.y, B.z, B.rx, B.ry, B.rz, BODY, 1.6);
    const on = (a, b) => eggAt(B.x, B.y, B.z, B.rx, B.ry, B.rz, a, b);
    // おなかの すじ・ひれ・め・くち・ほっぺ・せなかの もよう・しおふき
    for (const a of [0.15, 0.45, 0.75, 1.05]) s += at(...on(a, -0.62), `<path d="M-7,0 Q0,2.2 7,0" fill="none" stroke="#9CC7E6" stroke-width="1.2" stroke-linecap="round"/>`, 8, 3);
    s += at(...on(0.95, -0.42), `<path d="M0,0 C6,2 12,8 10,14 C6,13 1,8 -2,3 Z" fill="#6FA9D6" ${S(1.2)}/>`, 12, 4);
    s += at(...on(0.3, 0.08), `<circle r="5.2" fill="#FFFFFF" ${S(1.1)}/><circle cx="1" cy=".6" r="3" fill="${INK}"/><circle cx="2" cy="-.6" r="1" fill="#FFFFFF"/>`, 6, 6);
    s += at(...on(0.22, -0.18), `<path d="M-2,0 Q6,6 14,1" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`, 14, 4) + at(...on(0.42, -0.2), `<ellipse rx="3.6" ry="2.2" fill="#F7A9B8" opacity=".85"/>`, 4, 3);
    for (const [a, b] of [[0.9, 0.55], [1.5, 0.5], [1.2, 0.85], [0.55, 0.72]]) s += at(...on(a, b), `<ellipse rx="3.4" ry="2" fill="#FFFFFF" opacity=".55"/>`, 4, 3);
    s += at(...on(0.25, 1.05), `<path d="M0,0 Q-1,-7 -6,-12 M0,0 Q0,-8 0,-15 M0,0 Q1,-7 6,-12" fill="none" stroke="#BFE3EE" stroke-width="2.6" stroke-linecap="round"/><circle cx="-6.5" cy="-13" r="2" fill="#E6F5FB" ${S(0.6)}/><circle cx="0" cy="-16" r="2.2" fill="#E6F5FB" ${S(0.6)}/><circle cx="6.5" cy="-13" r="2" fill="#E6F5FB" ${S(0.6)}/>`, 9, 19);
    // プロペラ（live では FurnLive）
    s += rod([[AIRPROP.x - 6, AIRPROP.y, AIRPROP.z], [AIRPROP.x + 1, AIRPROP.y, AIRPROP.z]], "#8C6848", 1.6);
    s += L([0.4, 0.4 + Math.PI].map((a) => shape(SD(AIRPROP.x + 1.5), airPropPts(a), "#F4F0E8", 1.1)).join(""));
    for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) k.P(AIRPROP.x + 1.5, AIRPROP.y + Math.cos(a) * 16, AIRPROP.z + Math.sin(a) * 16);
    s += ball(AIRPROP.x + 2.4, AIRPROP.y, AIRPROP.z, 2.6, "#E0473F", 1.1, 0.5);
    return s;
  };

  // ================= ころころ フルーツ =================
  M.shop_korokoro_40 = (k) => {
    // メロンの ハンモック: はっぱの ある きの はしら 2ほん・ロープ・たれさがる メロンの きれはし（みどりの あみめの かわ・しろい ところ・あわい みどりの み・たね）・いちごの まくら
    const { box, ball, line, poly, egg, at, shadow, rg } = k, y0 = -15, y1 = -47, X = 44;
    let s = shadow(0.1, 3, 18);
    const zt = (x) => 56 - 24 * (1 - (x / X) ** 2), zb = (x) => zt(x) - 1 - 10 * Math.sqrt(Math.max(0, 1 - (x / (X + 2)) ** 2));
    const xs = Array.from({ length: 23 }, (_, i) => -X + (2 * X * i) / 22);
    const post = (x) => box(x - 8, -40, 16, 18, 0, 4, WOOD) + box(x - 3, -34, 6, 6, 4, 88, WOOD) + ball(x - 5, -31, 94, 7.5, "#7FB06A", 1.2, 0.3) + ball(x + 5, -28, 95, 7.5, "#8DBA78", 1.2, 0.3) + ball(x, -31, 101, 8.5, "#9ED08C", 1.2, 0.4);
    const rope = (x, sx) => line([[x, -31, 88], [sx * X, y0 + 2, zt(X) + 1]], INK, 2.4) + line([[x, -31, 88], [sx * X, y0 + 2, zt(X) + 1]], "#E8D2A8", 1.1) + line([[x, -31, 88], [sx * X, y1 - 2, zt(X) + 1]], INK, 2.4) + line([[x, -31, 88], [sx * X, y1 - 2, zt(X) + 1]], "#E8D2A8", 1.1);
    s += post(-58) + rope(-58, -1);
    // み（うえ）→ かわ（まえ）
    s += poly([...xs.map((x) => [x, y0, zt(x)]), ...xs.slice().reverse().map((x) => [x, y1, zt(x)])], rg([[0, "#EAF6C4"], [0.6, "#D2EA9C"], [1, "#B9DB80"]], 0.5, 0.4, 0.9), 1.4);
    for (let i = 3; i < 20; i += 2.2) { const x = -X + (2 * X * i) / 22; s += at(x, -31 + Math.sin(i) * 4, zt(x) + 0.3, `<ellipse rx="1.5" ry=".8" transform="rotate(${(i * 37) % 180})" fill="#F2F0D8" stroke="#B9C98A" stroke-width=".5"/>`, 2, 2); }
    s += poly([...xs.map((x) => [x, y0, zt(x)]), ...xs.slice().reverse().map((x) => [x, y0, zb(x)])], k.lg([[0, "#9ED08C"], [1, "#5F9A50"]]), 1.4);
    s += line(xs.map((x) => [x, y0 + 0.2, zt(x) - 0.8]), "#F4FAE0", 2.2);
    for (let i = 1; i < 11; i++) { const x = -X + (2 * X * i) / 11, d = 3.6; s += line([[x - d, y0 + 0.3, zt(x - d) - 2.4], [x + d, y0 + 0.3, zb(x + d) + 1.2]], "#E6F2D2", 0.9) + line([[x + d, y0 + 0.3, zt(x + d) - 2.4], [x - d, y0 + 0.3, zb(x - d) + 1.2]], "#E6F2D2", 0.9); }
    s += egg(30, -31, zt(30) + 6, 9, 8, 5.5, rg([[0, "#F58A8A"], [0.6, "#E0453D"], [1, "#B5322C"]], 0.36, 0.3, 0.8), 1.2) + at(30, -26, zt(30) + 12, `<path d="M-3,0 L0,-2.6 L3,0" fill="#8DBA78" stroke="#5F8F55" stroke-width=".7"/>`, 4, 4);
    s += rope(58, 1) + post(58) + ball(52, -20, 84, 3.4, "#F29A3B", 1, 0.5) + line([[52, -20, 87.4], [55, -24, 92]], "#6E9C5B", 0.9);
    return s;
  };
  M.shop_korokoro_50 = (k) => {
    // くだものの きかんしゃ: せんろ・すいかの ボイラー（きりくちの かお）・いちごの うんてんせき（はっぱの やね）・パイナップルの えんとつ・オレンジの しゃりん・ぶどうの かしゃ・いちごの きゃくしゃ（キウイの しゃりん）
    const { box, prism, shape, FR, SD, TP, line, lineOn, rod, ball, egg, cyl, at, shadow, rg } = k;
    let s = shadow(0.1, 3, 10);
    for (let x = -78; x <= 78; x += 12) s += box(x - 2.5, -58, 5, 46, 0, 2.2, WOOD, 1);
    for (const y of [-24, -46]) s += line([[-82, y, 2.8], [82, y, 2.8]], INK, 2.6) + line([[-82, y, 2.8], [82, y, 2.8]], CHROME[0], 1.2);
    const kiwi = (x, r = 6.5) => shape(FR(-21.8), ov(x, 8, r, r, 22), "#8D6B45", 1.2) + shape(FR(-21.7), ov(x, 8, r - 1.4, r - 1.4, 22), "#9ED08C", 0) + shape(FR(-21.6), ov(x, 8, r * 0.36, r * 0.36, 14), "#F4FAE0", 0) + Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU; return lineOn(FR(-21.55), [[x + Math.cos(a) * r * 0.5, 8 + Math.sin(a) * r * 0.5], [x + Math.cos(a) * r * 0.58, 8 + Math.sin(a) * r * 0.58]], INK, 1.2); }).join("");
    const orange = (x, r = 8) => shape(FR(-21.8), ov(x, 9, r, r, 24), "#F29A3B", 1.3) + shape(FR(-21.7), ov(x, 9, r - 1.6, r - 1.6, 24), "#FFE0A8", 0) + Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU; return lineOn(FR(-21.6), [[x, 9], [x + Math.cos(a) * (r - 1.8), 9 + Math.sin(a) * (r - 1.8)]], "#F7B65A", 1.1); }).join("") + shape(FR(-21.5), ov(x, 9, 1.4, 1.4, 10), "#FFFFFF", 0.6);
    // いちごの きゃくしゃ（いちばん うしろ）
    s += box(-80, -48, 38, 26, 5, 7, ["#B9784A", "#9A6238", "#D09060"], 1.2);
    s += egg(-61, -35, 30, 19, 13, 17, rg([[0, "#F58A8A"], [0.6, "#E0453D"], [1, "#B5322C"]], 0.36, 0.3, 0.8), 1.4);
    for (const [a, b] of [[0.3, 0.2], [0.8, 0.4], [1.2, 0.1], [0.55, -0.3], [1.0, -0.25], [0.1, -0.1], [1.4, 0.45]]) s += at(...k.eggAt(-61, -35, 30, 19, 13, 17, a, b), `<ellipse rx="1" ry="1.5" fill="#F7E08A"/>`, 2, 2);
    s += at(...k.eggAt(-61, -35, 30, 19, 13, 17, Math.PI / 4, 0.05), `<rect x="-6" y="-5" width="12" height="9" rx="4" fill="#FFFFFF" ${S(1.1)}/><rect x="-4.4" y="-3.6" width="8.8" height="6" rx="3" fill="#BFE3EE"/>`, 7, 6);
    s += prism(TP(47), star(-61, -35, 11, 6, 6, 0.3), [0, 0, -2], "#8DBA78", "#6E9C5B", 1.2) + rod([[-61, -35, 47], [-61, -35, 53]], "#6E9C5B", 1.4);
    s += kiwi(-72) + kiwi(-50) + rod([[-42, -35, 9], [-36, -35, 9]], "#7A6A5A", 1.6);
    // ぶどうの かしゃ
    s += box(-36, -48, 38, 26, 5, 7, ["#B9784A", "#9A6238", "#D09060"], 1.2) + box(-34, -47, 34, 24, 12, 14, ["#C9A26E", "#A88457", "#DDBD8A"], 1.3) + shape(TP(26.1), rr(-32, -45, 30, 20, 2), "#7A5638", 1);
    for (const [x, y, z] of [[-26, -40, 28], [-18, -40, 28], [-10, -40, 28], [-26, -30, 28], [-18, -30, 28], [-10, -30, 28], [-22, -36, 34], [-14, -35, 34], [-18, -36, 39]]) s += ball(x, y, z, 4.4, rg([[0, "#C9A8EE"], [0.5, "#8E6AC8"], [1, "#5E3F98"]], 0.36, 0.3, 0.8), 1.1, 0.5);
    s += at(-18, -36, 44, `<path d="M0,0 q-1,-5 2,-7" fill="none" stroke="#6E9C5B" stroke-width="1.4"/><path d="M1,-6 q5,-4 8,0 q-4,3 -8,0 Z" fill="#8DBA78" ${S(0.8)}/>`, 9, 9);
    s += kiwi(-26) + kiwi(-8) + rod([[2, -35, 9], [10, -35, 9]], "#7A6A5A", 1.6);
    // きかんしゃ
    s += box(10, -48, 70, 26, 5, 9, ["#E45A4F", "#C24438", "#F07A6E"], 1.3);
    s += box(12, -50, 24, 30, 14, 30, ["#F28B9B", "#D96E80", "#F7A9B8"], 1.4) + shape(FR(-19.9), rr(16, 26, 16, 12, 3), "#BFE3EE", 1.1) + shape(SD(36.1), rr(-44, 28, 18, 10, 3), "#BFE3EE", 1.1);
    s += prism(TP(47), star(24, -35, 21, 14, 7, 0.2), [0, 0, -3], "#8DBA78", "#6E9C5B", 1.3) + ball(24, -35, 49, 3, "#E0453D", 1, 0.5);
    // すいかの ボイラー
    s += prism(SD(78), ov(-35, 30, 13, 13, 28), [-42, 0, 0], "#5FA05A", "#4E8E4A", 1.5);
    for (const th of [-0.25, 0.3, 0.85, 1.4, 1.95]) s += line(Array.from({ length: 15 }, (_, i) => { const x = 37 + i * 2.9, t = th + 0.14 * Math.sin(i * 1.3); return [x, -35 + Math.cos(t) * 13.3, 30 + Math.sin(t) * 13.3]; }), "#2F6B3A", 2);
    s += shape(SD(78.1), ov(-35, 30, 11.2, 11.2, 28), "#FFFFFF", 0) + shape(SD(78.2), ov(-35, 30, 9.8, 9.8, 28), "#F26B6B", 0.9);
    s += shape(SD(78.3), ov(-38.6, 32.6, 1.3, 2, 10), INK, 0) + shape(SD(78.3), ov(-31.4, 32.6, 1.3, 2, 10), INK, 0) + lineOn(SD(78.3), [[-38, 27], [-35, 25.4], [-32, 27]], INK, 1.2);
    for (const [y, z] of [[-41, 25], [-29, 25], [-35, 36.5]]) s += shape(SD(78.3), ov(y, z, 0.8, 1.3, 8), "#5A3420", 0);
    // パイナップルの えんとつ・ライト・まえの カバー
    s += cyl(64, -35, 42, 5.6, 15, "#F2C14E", "#F7D56A", 1.3);
    for (const z of [46, 51]) s += at(64 + 4, -35 + 4, z, `<path d="M-3,-2 L3,2 M-3,2 L3,-2" stroke="#C9922E" stroke-width=".9"/>`, 4, 3);
    s += at(64, -35, 57, `<path d="M0,0 L-6,-9 L-2,-4 L0,-12 L2,-4 L6,-9 Z" fill="#7FB06A" ${S(1)}/>`, 7, 13);
    s += ball(76, -35, 46, 3.4, "#FFF1B8", 1.1, 0.6) + prism(TP(10), [[78, -46], [84, -35], [78, -24]], [0, 0, -6], "#F7D56A", "#D9B23A", 1.2);
    s += orange(22) + orange(46) + orange(68) + line([[22, -21.4, 9], [68, -21.4, 9]], "#C24438", 1.8);
    return s;
  };

  // ================= ガソリンスタンド =================
  const band3 = (cx, cy, r, z0, z1, a0 = VIS[0], a1 = VIS[1], n = 16) => [...arcPts(cx, cy, r, z0, n, a0, a1), ...arcPts(cx, cy, r, z1, n, a0, a1).reverse()];
  M.shop_gasstand_40 = (k) => {
    // ドラムかんの テーブル: あかい ドラムかん（ふちの わ・しろい おび・オイルの しずくの マーク）・まるい きの てんばん・ミニカーと コーン・タイヤの スツール 2つ
    const { cyl, frustum, shape, TP, line, poly, at, shadow, box, lg } = k, cx = 0, cy = -36;
    let s = shadow(0.12, 3, 26);
    const tire = (x) => { let t = cyl(x, cy, 0, 15, 12, "#4A4550", "#5E5864", 1.4); for (let a = VIS[0] + 0.12; a < VIS[1]; a += 0.3) t += line([[x + Math.cos(a) * 15.2, cy + Math.sin(a) * 15.2, 2], [x + Math.cos(a + 0.12) * 15.2, cy + Math.sin(a + 0.12) * 15.2, 10]], "#2F2B34", 1.3); return t + shape(TP(12.1), ov(x, cy, 8.4, 8.4, 24), "#2F2B34", 1.1) + cyl(x, cy, 12, 10.5, 3, "#C24438", "#E45A4F", 1.2); };
    s += tire(-42);
    s += cyl(cx, cy, 0, 20, 52, lg([[0, "#C9382F"], [0.45, "#F07A6E"], [1, "#B5322C"]], 0, 0, 1, 0), "#E45A4F", 1.5);
    s += poly(band3(cx, cy, 20.3, 21, 31), "#FFFFFF", 1.1);
    for (const z of [11, 41]) s += ring(k, cx, cy, 20.4, z, "#9E2F28", 2.6) + ring(k, cx, cy, 20.5, z + 1, "#F28B82", 0.9);
    s += at(cx + 20.6 * Math.SQRT1_2, cy + 20.6 * Math.SQRT1_2, 26, `<circle r="4.6" fill="#FFF1E0" ${S(0.9)}/><path d="M0,-3.4 C-1.6,-1 -2.6,.6 -2.6,1.6 C-2.6,3 -1.4,3.8 0,3.8 C1.4,3.8 2.6,3 2.6,1.6 C2.6,.6 1.6,-1 0,-3.4 Z" fill="#F29A3B" stroke="#C97A2C" stroke-width=".6"/>`, 5, 5);
    // てんばん
    s += cyl(cx, cy, 52, 32, 5, WOOD[1], WOOD[2], 1.5);
    for (const d of [-16, -6, 4, 14]) { const h = Math.sqrt(30 * 30 - d * d); s += line([[cx - h * Math.SQRT1_2 + d * Math.SQRT1_2, cy + h * Math.SQRT1_2 + d * Math.SQRT1_2, 57.1], [cx + h * Math.SQRT1_2 + d * Math.SQRT1_2, cy - h * Math.SQRT1_2 + d * Math.SQRT1_2, 57.1]], "#C9A26E", 1, 'stroke-opacity=".8"'); }
    // ミニカー・コーン
    s += box(-20, -48, 18, 10, 57, 5, ["#6FA9D6", "#4F87B8", "#9CC7E6"], 1.1) + box(-16, -47, 9, 8, 62, 4, ["#DDF4FB", "#A9D8EA", "#FFFFFF"], 1);
    for (const x of [-16, -6]) s += at(x, -38, 57.6, `<circle r="2" fill="${INK}"/><circle r=".7" fill="${CHROME[0]}"/>`, 3, 3);
    s += box(10, -35, 10, 10, 57, 1.6, ["#F29A3B", "#D97E2E", "#F7B66A"], 1) + frustum(15, -30, 58.6, 4.6, 72, 1.1, "#F29A3B", "#F7B66A", 1.1);
    for (const [z, r] of [[62.5, 3.4], [66.6, 2.4]]) s += poly(band3(15, -30, r + 0.2, z, z + 2), "#FFFFFF", 0);
    s += tire(42);
    return s;
  };
  // せんしゃきの たての ブラシ（live の とき FurnLive が しまを まわす）
  const WASH = { y: -55, bx: 46, r: 12, z0: 10, z1: 116, cols: ["#9CC7E6", "#FFFFFF", "#F2A7B8", "#FFFFFF"] };
  // ブラシの しま（つつの おもての はんぶん）: [いろ, 3Dの 点]。ang で まわる
  const brushStripes = (x, ang) => {
    const n = 12, out = [];
    for (let j = 0; j < n; j++) {
      const a0 = ang + (j / n) * TAU, w = TAU / n;
      let lo = ((a0 - VIS[0]) % TAU + TAU) % TAU + VIS[0], hi = lo + w;
      if (lo > VIS[1]) { if (hi - TAU > VIS[0]) { lo = VIS[0]; hi = hi - TAU; } else continue; }
      hi = Math.min(hi, VIS[1]);
      if (hi - lo < 0.02) continue;
      out.push([WASH.cols[j % 4], band3(x, WASH.y, WASH.r + 0.3, WASH.z0, WASH.z1, lo, hi, 4)]);
    }
    return out;
  };
  M.shop_gasstand_50 = (k) => {
    // くるくる せんしゃき: タイルの ゆか（はいすいこう・みずたまり）・しろと あおの もんの はしら 2ほん・うえの はり（くるまと あわの マーク）・たての ブラシ 2ほん・うえの よこの ブラシ・あわの ついた ちいさな くるま・しんごう
    const { box, cyl, prism, shape, FR, SD, TP, line, lineOn, poly, onP, at, shadow, rod, L } = k, { y, bx, r, z0, z1 } = WASH;
    let s = shadow(0.1, 3, 10);
    s += box(-74, -106, 148, 102, 0, 3, ["#D5DCE2", "#B8C2CB", "#E8EDF1"], 1.4);
    for (let x = -60; x <= 60; x += 20) s += line([[x, -104, 3.1], [x, -6, 3.1]], "#C9D2DA", 1);
    for (let yy = -90; yy <= -20; yy += 20) s += line([[-72, yy, 3.1], [72, yy, 3.1]], "#C9D2DA", 1);
    s += shape(TP(3.2), rr(-14, -60, 28, 10, 2), "#8C96A0", 1) + [...Array(6)].map((_, i) => lineOn(TP(3.3), [[-11 + i * 4.4, -58], [-11 + i * 4.4, -52]], "#5E6670", 1)).join("");
    for (const [x, yy, rx] of [[-30, -24, 12], [36, -86, 10], [22, -30, 8]]) s += shape(TP(3.2), ov(x, yy, rx, rx * 0.6, 20), "#BFE3EE", 0.9, 'fill-opacity=".85"');
    const pillar = (x0) => box(x0, -64, 12, 18, 3, 125, ["#FFFFFF", "#E3E8EC", "#FFFFFF"], 1.4) + [24, 56, 88].map((z) => box(x0 - 0.2, -64.2, 12.4, 18.4, z, 8, ["#6FA9D6", "#4F87B8", "#9CC7E6"], 1.1)).join("");
    s += pillar(-74);
    // ブラシ: からだ（いつも）→ しま（live では FurnLive）
    const brush = (x) => cyl(x, y, 6, 4, 4, CHROME[1], CHROME[0], 1) + cyl(x, y, z0, r, z1 - z0, "#BFE3EE", "#DDF0F8", 1.4) + rod([[x, y, z1], [x, y, 128]], CHROME[1], 2.4) + L(brushStripes(x, 0.3).map(([c, pts]) => poly(pts, c, 0)).join("") + ring(k, x, y, r + 0.4, z0, INK, 1.4));
    s += brush(-bx);
    // うえの よこの ブラシ
    s += prism(SD(30), ov(y, 112, 8, 8, 24), [-60, 0, 0], "#F7C6D6", "#F2A7B8", 1.4);
    for (let x = -26; x <= 26; x += 8) s += line([[x, y + 8 * 0.6, 112 + 8 * 0.8], [x + 4, y + 8 * 0.95, 112 - 8 * 0.3]], "#FFFFFF", 2.2);
    s += rod([[0, y, 120], [0, y, 128]], CHROME[1], 2.4);
    // くるま（まえを むく）・あわ
    s += box(-15, -68, 30, 26, 5, 12, ["#E45A4F", "#C24438", "#F07A6E"], 1.4) + box(-11, -64, 22, 16, 17, 10, ["#F07A6E", "#C24438", "#F28B82"], 1.3);
    s += shape(FR(-47.9), rr(-9, 18.5, 18, 7, 2), "#BFE3EE", 1) + shape(SD(11.1), rr(-62, 18.5, 12, 7, 2), "#BFE3EE", 1);
    for (const x of [-9, 9]) s += shape(FR(-41.9), ov(x, 11, 2.6, 2.6, 12), "#FFF1B8", 1);
    s += lineOn(FR(-41.9), [[-3.4, 8], [0, 6.4], [3.4, 8]], INK, 1.1);
    for (const yy of [-62, -48]) s += shape(SD(15.1), ov(yy, 5.5, 4.4, 4.4, 14), "#3A3540", 1.2) + shape(SD(15.2), ov(yy, 5.5, 1.6, 1.6, 10), CHROME[0], 0.7);
    for (const [x, yy, z, rr2] of [[-6, -56, 29, 4.4], [2, -58, 30, 5], [9, -54, 28, 3.6], [-12, -50, 18, 3], [12, -44, 16, 3.4], [-4, -40, 9, 2.6]]) s += at(x, yy, z, `<circle r="${rr2}" fill="#FFFFFF" stroke="#9CC7E6" stroke-width="1"/><circle cx="${-rr2 * 0.35}" cy="${-rr2 * 0.35}" r="${rr2 * 0.25}" fill="#FFFFFF" stroke="#BFE3EE" stroke-width=".6"/>`, rr2 + 1, rr2 + 1);
    s += brush(bx);
    s += pillar(62);
    // しんごう（みぎの はしら）
    s += shape(FR(-45.9), rr(64, 98, 8, 20, 2), "#4A4550", 1.1) + shape(FR(-45.8), ov(68, 113, 2.4, 2.4, 12), "#E77E6E", 0.8) + shape(FR(-45.8), ov(68, 103, 2.4, 2.4, 12), "#9ED08C", 0.8);
    // うえの はり・マーク
    s += box(-74, -64, 148, 18, 128, 14, ["#6FA9D6", "#4F87B8", "#9CC7E6"], 1.5);
    s += shape(FR(-45.9), rr(-30, 130, 60, 10, 3), "#FFFFFF", 1.1) + onP(FR(-45.8), -26, 139, 52, 8, `<path d="M8,6 V4 Q8,1.6 10.6,1.6 H16 L18.4,4 H21 V6 Z" fill="#E45A4F" stroke="${INK}" stroke-width=".7"/><circle cx="11" cy="6.4" r="1.2" fill="${INK}"/><circle cx="18" cy="6.4" r="1.2" fill="${INK}"/>${[[28, 4, 2], [33, 2.4, 1.6], [37, 5, 1.8], [42, 3, 2.2]].map(([x, y2, r2]) => `<circle cx="${x}" cy="${y2}" r="${r2}" fill="#FFFFFF" stroke="#6FA9D6" stroke-width=".7"/>`).join("")}`);
    return s;
  };

  // ================= ゆうびんきょく =================
  M.shop_postoffice_40 = (k) => {
    // ふうとうの ソファ: ふうとうの せもたれ（ひらいた ふたと ハートの シール）・ふうとうの ざぶとん（おりめ）・きっての ひじかけ・ハートと エアメールの クッション
    const { box, prism, shape, FR, SD, TP, lineOn, slab, onP, shadow } = k, ENV = ["#FFF8EE", "#EADFCF", "#FFFDF8"];
    let s = shadow(0.12, 3, 10);
    const back = slab([0, -62, 22], [1, 0, 0], [0, -0.28, 0.96], [[-60, 0], [60, 0], [60, 30], [0, 52], [-60, 30]], 6, ENV[2], ENV[1], 1.4);
    s += back.s + shape(back.m, [[-60, 30], [60, 30], [0, 52]], "#FCE4EC", 1.2) + lineOn(back.m, [[-60, 0], [0, 18], [60, 0]], "#E3D6C2", 1.2);
    s += shape(back.m, heart(0, 33, 10), "#E0473F", 1.3) + lineOn(back.m, [[-3, 34], [0, 31.6], [3, 34]], "#F28B82", 1.1);
    // ざぶとん（ふうとう）
    s += box(-58, -62, 116, 54, 0, 22, ENV, 1.4);
    s += lineOn(FR(-7.9), [[-58, 22], [0, 10], [58, 22]], "#D9CCB8", 1.3) + lineOn(FR(-7.9), [[-58, 1], [-14, 11.5]], "#D9CCB8", 1.2) + lineOn(FR(-7.9), [[58, 1], [14, 11.5]], "#D9CCB8", 1.2);
    s += prism(TP(28), rr(-52, -58, 104, 46, 10), [0, 0, -6], "#FFFFFF", "#EFE4D4", 1.3) + lineOn(TP(28.1), close(rr(-46, -53, 92, 36, 7)), "#E3D6C2", 1, 'stroke-dasharray="3 3"');
    // きっての ひじかけ
    const stamp = (w, h, c, pic) => `<rect x=".8" y=".8" width="${w - 1.6}" height="${h - 1.6}" fill="#FFFFFF" stroke="${INK}" stroke-width="1" stroke-dasharray="1.6 1.2"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="${c}" stroke="${INK}" stroke-width=".7"/>${pic}`;
    s += box(-66, -62, 8, 54, 0, 40, ["#FFFFFF", "#E3DDD3", "#FFFFFF"], 1.3) + onP(FR(-7.9), -65.5, 38, 7, 34, `<rect x=".6" y=".6" width="5.8" height="32.8" fill="#9CC7E6" stroke="${INK}" stroke-width=".6"/>`);
    s += box(58, -62, 8, 54, 0, 40, ["#FFFFFF", "#E3DDD3", "#FFFFFF"], 1.3);
    s += onP(SD(66.1), -56, 37, 42, 34, stamp(42, 34, "#BFE3EE", `<path d="M21,26 C11,19 12,11 17,11 C19.4,11 21,13 21,14.6 C21,13 22.6,11 25,11 C30,11 31,19 21,26 Z" fill="#F2A7B8" stroke="${INK}" stroke-width=".8"/><circle cx="9" cy="9" r="2.6" fill="#F7D56A"/>`));
    s += onP(FR(-7.9), 58.5, 38, 7, 34, `<rect x=".6" y=".6" width="5.8" height="32.8" fill="#F7C6D6" stroke="${INK}" stroke-width=".6"/>`);
    // クッション: ハート・エアメール
    const hc = slab([-26, -46, 28], [1, 0, 0], [0, -0.3, 0.95], heart(0, 13, 14), 5, "#F28B9B", "#D96E80", 1.3);
    s += hc.s + lineOn(hc.m, [[-6, 16], [-2, 20]], "#FFFFFF", 1.6);
    const am = slab([10, -44, 28], [1, 0, 0], [0, -0.3, 0.95], rr(0, 0, 30, 20, 3), 4, "#FFFFFF", "#E3DDD3", 1.2);
    s += am.s;
    for (let i = 0; i < 9; i++) { const t = i * 4; s += lineOn(am.m, [[t + 1, 1.2], [t + 3, 1.2]], i % 2 ? "#6FA9D6" : "#E0473F", 2.2) + lineOn(am.m, [[t + 1, 18.8], [t + 3, 18.8]], i % 2 ? "#E0473F" : "#6FA9D6", 2.2); }
    s += lineOn(am.m, [[4, 15], [16, 15]], "#B8AFA4", 1.1) + lineOn(am.m, [[4, 11.5], [13, 11.5]], "#B8AFA4", 1.1) + shape(am.m, rr(21, 12, 6, 6, 1), "#F2A7B8", 0.8);
    return s;
  };
  M.shop_postoffice_50 = (k) => {
    // ゆうびんの じてんしゃ: くろい タイヤ・ぎんの スポーク・あかい フレームと どろよけ・うしろの はいたつの はこ（〒）・まえの かご（てがみ）・サドル・ハンドルと きんの ベル・ライト・スタンド
    const { box, rod, line, lineOn, shape, FR, SD, TP, at, ball, dome, shadow, onP, cyl } = k, y = -28, R = 23, RED = ["#E0473F", "#C9382F", "#EC6A60"];
    const W = [[-44, 25], [44, 25]];
    let s = shadow(0.12, 3, 16);
    const circ = (x, z, r, a0 = 0, a1 = TAU, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; });
    // スタンド
    s += rod([[-8, y + 1, 24], [-15, y + 9, 0]], CHROME[1], 1.6);
    // しゃりん
    for (const [x, z] of W) {
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; s += lineOn(FR(y), [[x, z], [x + Math.cos(a) * (R - 4), z + Math.sin(a) * (R - 4)]], CHROME[1], 0.9); }
      s += lineOn(FR(y), circ(x, z, R), INK, 7) + lineOn(FR(y), circ(x, z, R), "#4A4550", 4.4) + lineOn(FR(y), circ(x, z, R - 3.4), CHROME[0], 1.6);
      s += shape(FR(y + 0.2), ov(x, z, 3.2, 3.2, 12), CHROME[2], 1);
      s += lineOn(FR(y + 0.4), circ(x, z, R + 4, 0.35, 2.75, 20), INK, 4.6) + lineOn(FR(y + 0.4), circ(x, z, R + 4, 0.35, 2.75, 20), RED[0], 2.6);
    }
    // フレーム
    const F = (pts, w = 3.2, c = RED[0]) => lineOn(FR(y + 0.6), pts, INK, w + 2) + lineOn(FR(y + 0.6), pts, c, w);
    s += F([[-44, 25], [-8, 23], [-16, 62], [-44, 25]]) + F([[-16, 62], [30, 66]]) + F([[-8, 23], [34, 52]]) + F([[30, 66], [34, 52], [44, 25]], 3);
    s += shape(FR(y + 0.8), ov(-8, 23, 6, 6, 18), CHROME[1], 1.1) + F([[-8, 23], [-3, 15]], 1.6, CHROME[1]) + shape(FR(y + 0.9), rr(-6.5, 13.5, 7, 3, 1), "#4A4550", 0.9);
    // サドル
    s += F([[-16, 62], [-18, 68]], 2, CHROME[1]) + k.egg(-20, y, 70, 9, 5, 3, "#4A4550", 1.3);
    // うしろの はいたつの はこ
    s += box(-66, y - 2, 6, 4, 46, 6, CHROME, 1) + box(-72, y - 16, 40, 32, 52, 24, RED, 1.4);
    s += onP(FR(y + 16.1), -58, 72, 14, 14, `<rect x="0" y="0" width="14" height="14" rx="2" fill="#FFFFFF" ${S(1)}/><path d="M3.5,3.5 H10.5 M3.5,6.2 H10.5 M7,6.2 V11.5" fill="none" stroke="#E0473F" stroke-width="1.6" stroke-linecap="round"/>`);
    s += onP(SD(-31.9), -6, 72, 12, 8, `<path d="M1,1 H11 V7 H1 Z M1,1 L6,4.6 L11,1" fill="#FFFFFF" stroke="${INK}" stroke-width=".8"/>`);
    // まえの かご（てがみ）
    s += box(36, y - 12, 22, 24, 54, 14, ["#FFFFFF", "#E3E8EC", "#FFFFFF"], 1.2);
    for (let x = 39; x < 58; x += 4) s += lineOn(FR(y + 12.1), [[x, 55], [x, 67]], "#B8C2CB", 0.9);
    for (const [x, yy, c, t] of [[42, -30, "#FFFFFF", -8], [48, -26, "#FCE4EC", 6], [53, -31, "#BFE3EE", -4]]) s += at(x, yy, 66, `<g transform="rotate(${t})"><rect x="-4" y="-10" width="8" height="11" rx="1" fill="${c}" ${S(0.9)}/><path d="M-4,-10 L0,-6.6 L4,-10" fill="none" stroke="${INK}" stroke-width=".7"/></g>`, 6, 12);
    // ハンドル・ベル・ライト
    s += rod([[30, y - 13, 76], [30, y + 13, 76]], CHROME[1], 2) + F([[30, 66], [30, 76]], 2.4, CHROME[1]);
    for (const yy of [y - 14, y + 14]) s += rod([[30, yy, 76], [30, yy + (yy < y ? -3 : 3), 76]], "#4A4550", 2.6);
    s += dome(30, y - 9, 77, 3, 3, 3, GOLD, 1.1) + ball(30, y - 9, 80.6, 0.9, GOLDD, 0.7, 0);
    s += ball(40, y, 62, 3.6, "#FFF1B8", 1.1, 0.6);
    return s;
  };

  // ================= あたまの たいそう =================
  const BULB = { y: -29, z: 66, r: 22, rz: 28 };
  M.shop_brain_40 = (k) => {
    // ひらめきの でんきゅう: ほん 2さつの だい・ぎんの ソケット・きんの ねじ・すきとおった おおきな たま・ハートの フィラメント
    const { box, cyl, frustum, egg, tilt, lineOn, line, at, shadow, rg } = k, cy = BULB.y;
    let s = shadow(0.12, 4, 14);
    s += box(-21, -46, 42, 32, 0, 7, ["#FFF6E0", "#4F87B8", "#6FA9D6"], 1.3) + box(-18, -43, 36, 26, 7, 6, ["#FFF6E0", "#C24438", "#E45A4F"], 1.3);
    for (const z of [2.4, 4.6]) s += line([[-19, -14, z], [19, -14, z]], "#E6D8BC", 0.8);
    s += line([[-16, -17, 10], [16, -17, 10]], "#E6D8BC", 0.8);
    s += cyl(0, cy, 13, 8, 4, CHROME[1], CHROME[0], 1.2) + cyl(0, cy, 17, 9, 14, GOLDD, GOLD, 1.3);
    for (const z of [20, 24, 28]) s += ring(k, 0, cy, 9.3, z, "#B9974A", 1.4);
    s += frustum(0, cy, 31, 9, 40, 12.5, "rgba(255,248,214,.7)", "rgba(255,250,228,.8)", 1.2);
    s += egg(0, cy, BULB.z, BULB.r, BULB.r, BULB.rz, rg([[0, "rgba(255,255,255,.95)"], [0.55, "rgba(255,246,200,.75)"], [1, "rgba(242,214,130,.7)"]], 0.38, 0.32, 0.85), 1.5);
    const m = tilt([0, cy, 0], [Math.SQRT1_2, -Math.SQRT1_2, 0], [0, 0, 1]);
    s += lineOn(m, [[-3, 40], [-5, 58]], CHROME[1], 1) + lineOn(m, [[3, 40], [5, 58]], CHROME[1], 1);
    s += lineOn(m, close(heart(0, 64, 9)).slice(0, 29), "#E3A23B", 1.8) + lineOn(m, close(heart(0, 64, 9)).slice(0, 29), "#FFF1B8", 0.7);
    s += at(-9, cy - 6, BULB.z + 14, `<ellipse rx="3.2" ry="7" transform="rotate(30)" fill="#FFFFFF" opacity=".9"/>`, 4, 8);
    return s;
  };
  M.shop_brain_50 = (k) => {
    // ふくろうの どくしょ チェア: ふくろうの せもたれ（みみ・おおきな め・くちばし・おなかの はね）・はねの ひじかけ・クリームの ざぶとん・ひらいた ほん・オレンジの あし
    const { box, prism, shape, SD, TP, lineOn, slab, at, shadow, rg, egg } = k, BR = ["#B07A52", "#8E5E3C", "#C99A6E"];
    let s = shadow(0.12, 3, 20);
    // せもたれ（みみ → からだ → かお）
    const o = [0, -82, 28], u = [1, 0, 0], v = [0, -0.16, 0.99], m = k.tilt(o, u, v);
    for (const sx of [-1, 1]) s += shape(m, [[sx * 26, 104], [sx * 44, 104], [sx * 46, 128]], "#8E5E3C", 1.4);
    s += slab(o, u, v, rr(-44, 0, 88, 112, 36), 12, rg([[0, "#C99A6E"], [0.6, "#B07A52"], [1, "#8E5E3C"]], 0.4, 0.3, 0.9), "#7A4E30", 1.5).s;
    for (const [t, n] of [[44, 5], [56, 4], [68, 3]]) for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 13; s += lineOn(m, arc(x, t, 6, 4.6, Math.PI, TAU, 10), "#E6C08C", 1.6); }
    s += shape(m, ov(-17, 86, 17, 16, 28), "#F2D9B0", 1.2) + shape(m, ov(17, 86, 17, 16, 28), "#F2D9B0", 1.2);
    for (const sx of [-1, 1]) s += shape(m, ov(sx * 17, 86, 11, 11, 24), "#F7D56A", 1.2) + shape(m, ov(sx * 17, 86, 8, 8, 20), "#FFFFFF", 0.9) + shape(m, ov(sx * 17 + sx * 1, 85, 5, 5, 16), INK, 0) + shape(m, ov(sx * 17 - 1.6, 87.6, 1.6, 1.6, 10), "#FFFFFF", 0);
    s += shape(m, [[-5, 76], [5, 76], [0, 66]], "#F29A3B", 1.2);
    // ざぶとんの だい
    s += box(-44, -74, 88, 66, 0, 28, BR, 1.5);
    // ひじかけ（はね）
    const wing = [[-82, 86], [-60, 72], [-34, 58], [-12, 46], [-7, 36], [-14, 28], [-50, 28], [-80, 42]];
    const feathers = (x) => [[-70, 70], [-52, 60], [-34, 50], [-60, 46], [-40, 40], [-22, 36]].map(([y, z]) => lineOn(SD(x + 0.1), arc(y, z, 7, 5, Math.PI * 1.05, Math.PI * 1.95, 8), "#E6C08C", 1.5)).join("");
    s += prism(SD(-34), wing, [-10, 0, 0], "#B07A52", "#7A4E30", 1.4) + feathers(-34);
    s += prism(TP(36), rr(-33, -70, 66, 58, 12), [0, 0, -8], "#FFF4DC", "#E9D3A8", 1.4) + lineOn(TP(36.1), [[-26, -40], [26, -40]], "#E9D3A8", 1.1, 'stroke-dasharray="3 3"');
    // ひらいた ほん
    s += prism(TP(38.4), [[-4, -50], [24, -50], [24, -30], [-4, -30]], [0, 0, -2.4], "#FFFFFF", "#6FA9D6", 1.2) + lineOn(TP(38.5), [[10, -50], [10, -30]], "#C9D2DA", 1.1);
    for (const yy of [-46, -42, -38, -34]) s += lineOn(TP(38.5), [[-1, yy], [7, yy]], "#B8C2CB", 0.8) + lineOn(TP(38.5), [[13, yy], [21, yy]], "#B8C2CB", 0.8);
    s += prism(SD(46), wing, [-10, 0, 0], "#C99A6E", "#8E5E3C", 1.4) + feathers(46);
    // あし
    for (const x of [-16, 16]) s += at(x, -7, 0, `<path d="M-6,0 Q-6,-4 -3,-4 Q0,-6 3,-4 Q6,-4 6,0 Q4,1 3,-1 Q1.5,1 0,-1 Q-1.5,1 -3,-1 Q-4,1 -6,0 Z" fill="#F29A3B" ${S(1)}/>`, 7, 6);
    return s;
  };

  // ================= パズル こうぼう =================
  M.shop_kobo_40 = (k) => {
    // ブロックの パズル だな: いろいろな いろの ブロックを くんだ 3×3 の たな（うえに ぽちぽち）・ほん・パズル キューブ・はちうえ・ジグソーの え・ボール・トロフィー・つみき・サイコロ
    const { box, cyl, ball, frustum, slab, onP, at, shadow, shape, lineOn, FR, SD, TP } = k, Y0 = -38, D = 32;
    const PAL = [["#F28B8B", "#D46A6A", "#F7A9A9"], ["#F7D56A", "#D9B23A", "#FBE7A1"], ["#9CC7E6", "#6FA9D6", "#BFE3EE"], ["#9ED08C", "#7FB06A", "#C3E4B3"], ["#C9B6E0", "#A995C4", "#DCCDEB"], ["#F2B07A", "#D9904E", "#F7C9A0"]];
    const blk = (x0, x1, z0, z1, ci) => box(x0, Y0, x1 - x0, D, z0, z1 - z0, PAL[ci % PAL.length], 1.3);
    const COLS = [[-50, -18], [-12, 12], [18, 50]], ROWS = [[8, 44], [50, 86], [92, 122]];
    let s = shadow(0.12, 3, 6) + box(-50, Y0 - 2, 100, 2, 8, 114, ["#E9DCC6", "#D8C9B0", "#F2E8D8"], 1.2);
    const items = {
      "0,0": () => [["#6FA9D6", -46], ["#F28B8B", -40], ["#9ED08C", -34], ["#F7D56A", -28]].map(([c, x], i) => box(x, -36, 5, 22, 8, 26 + (i % 2) * 4, [c, shade(c, -0.18), shade(c, 0.18)], 1.1)).join(""),
      "0,1": () => { let t = box(-8, -32, 16, 16, 8, 16, ["#FFFFFF", "#FFFFFF", "#FFFFFF"], 1.3); const C = ["#F28B8B", "#F7D56A", "#9CC7E6", "#9ED08C", "#C9B6E0", "#F2B07A"]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { t += shape(FR(-15.9), rr(-7.4 + i * 5, 8.6 + j * 5, 4.4, 4.4, 1), C[(i + j * 2) % 6], 0.6) + shape(SD(8.1), rr(-31.4 + i * 5, 8.6 + j * 5, 4.4, 4.4, 1), C[(i * 2 + j + 3) % 6], 0.6) + shape(TP(24.1), rr(-7.4 + i * 5, -31.4 + j * 5, 4.4, 4.4, 1), C[(i + j + 1) % 6], 0.6); } return t; },
      "0,2": () => frustum(34, -24, 8, 7, 20, 9, "#E89A6A", "#7A5232", 1.2) + at(34, -24, 20, SPR.monstera(), 14, 26),
      "1,0": () => { const b = slab([-46, -30, 50], [1, 0, 0], [0, -0.3, 0.95], rr(0, 0, 26, 30, 2), 2, "#FFFFFF", WOOD[1], 1.2); return b.s + onP(b.m, 2, 28, 22, 26, `<rect width="22" height="26" fill="#BFE3EE"/><circle cx="7" cy="9" r="4" fill="#F7D56A"/><path d="M0,20 Q6,12 11,18 Q16,12 22,19 V26 H0 Z" fill="#9ED08C"/><path d="M11,0 V26 M0,13 H22" stroke="${INK}" stroke-width=".7" stroke-dasharray="2.4 1.6" opacity=".7"/>`); },
      "1,1": () => ball(0, -24, 59, 8.6, k.rg([[0, "#FFFFFF"], [0.4, "#F7A9B8"], [1, "#D96E80"]], 0.35, 0.3, 0.8), 1.3, 0.5) + at(0, -24, 59, `<path d="M-9,0 Q0,-4 9,0" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>`, 9, 3),
      "1,2": () => [["#C9B6E0", 22, 0], ["#9ED08C", 28, 0], ["#F28B8B", 36, 0.35]].map(([c, x, lean]) => { const b = slab([x, -36, 50], [0, 1, 0], [lean, 0, 1], rr(0, 0, 22, 28, 1), 5, c, shade(c, -0.2), 1.1); return b.s; }).join(""),
      "2,0": () => box(-40, -30, 14, 12, 92, 4, ["#B07A52", "#8E5E3C", "#C99A6E"], 1.1) + frustum(-33, -24, 96, 3, 104, 2, GOLDD, GOLD, 1) + k.lathe(-33, -24, [[2.5, 104], [8, 108], [8.5, 116], [6, 120]], GOLD, 1.2) + ball(-33, -24, 112, 3, "#FFF1B8", 0.8, 0.6),
      "2,1": () => box(-10, -32, 9, 9, 92, 9, PAL[0], 1.1) + box(1, -32, 9, 9, 92, 9, PAL[2], 1.1) + box(-4.5, -32, 9, 9, 101, 9, PAL[1], 1.1),
      "2,2": () => box(24, -32, 10, 10, 92, 10, ["#FFFFFF", "#E3DDD3", "#FFFFFF"], 1.1) + shape(FR(-21.9), ov(29, 97, 1.3, 1.3, 8), INK, 0) + shape(TP(102.1), ov(29, -27, 1.3, 1.3, 8), "#E0473F", 0) + box(38, -30, 9, 9, 92, 9, ["#FFFFFF", "#E3DDD3", "#FFFFFF"], 1.1) + shape(FR(-20.9), ov(40.5, 94.5, 1, 1, 8), INK, 0) + shape(FR(-20.9), ov(44.5, 98.5, 1, 1, 8), INK, 0),
    };
    let ci = 0;
    for (let r = 0; r < 3; r++) {
      const [z0, z1] = ROWS[r];
      s += blk(-58, -50, r ? z0 - 6 : 0, z1, 3 + r);
      for (let c = 0; c < 3; c++) {
        const [x0, x1] = COLS[c], right = c < 2 ? COLS[c + 1][0] : 50;
        s += blk(r ? x0 : (c ? x0 : -50), right, r ? z0 - 6 : 0, z0, ci++);
        s += items[`${r},${c}`]();
        if (c < 2) s += blk(x1, right, z0, z1, ci++ + 2);
      }
      s += blk(50, 58, r ? z0 - 6 : 0, z1, 5 - r);
    }
    for (let c = 0; c < 3; c++) s += blk(c ? COLS[c][0] - (c ? 6 : 0) : -58, c < 2 ? COLS[c + 1][0] - 6 : 58, 122, 130, c + 1);
    for (let x = -52; x <= 52; x += 10.4) for (const yy of [-34, -14]) s += cyl(x, yy, 130, 3, 2.4, shade(PAL[Math.floor((x + 58) / 39)][0], -0.1), PAL[Math.floor((x + 58) / 39)][0], 0.9);
    return s;
  };
  // からくり どけい（live の とき はり・ふりこ・はぐるまを FurnLive が うごかす）
  const CLOCK = { front: -13.8, side: 34.1, dial: [0, 166, 25], pivot: [0, 126], len: 64, bob: 9 };
  const GEARS = [["side", -34, 150, 13, 1], ["side", -16, 132, 9, -1.44], ["side", -38, 112, 11, -1.18], ["front", -15, 24, 8, 1], ["front", 4, 22, 6, -1.33]];
  // はぐるまの かたち（めんの 2D の 点）: まんなか (a, b)・はんけい r・まわる かく ang
  const gearPts = (a, b, r, ang) => { const n = Math.max(8, Math.round(r * 0.95)), out = []; for (let i = 0; i < n * 4; i++) { const t = ang + (i / (n * 4)) * TAU, q = i % 4 < 2 ? r : r - 2.6; out.push([a + Math.cos(t) * q, b + Math.sin(t) * q]); } return out; };
  const clockParts = (k, ang, now) => {
    const { shape, lineOn, FR, SD } = k, [dx, dz] = CLOCK.dial;
    let s = "";
    for (const [face, a, b, r, sp] of GEARS) { const m = face === "side" ? SD(CLOCK.side + 0.1) : FR(CLOCK.front + 0.1), g = ang * sp; s += shape(m, gearPts(a, b, r, g), GOLD, 1.2) + shape(m, ov(a, b, r * 0.32, r * 0.32, 12), GOLDD, 0.9) + [0, 1].map((i) => lineOn(m, [[a + Math.cos(g + i * Math.PI / 2) * r * 0.62, b + Math.sin(g + i * Math.PI / 2) * r * 0.62], [a - Math.cos(g + i * Math.PI / 2) * r * 0.62, b - Math.sin(g + i * Math.PI / 2) * r * 0.62]], "#B9974A", 1.2)).join(""); }
    const th = Math.sin(ang * 2) * 0.22, [px, pz] = CLOCK.pivot, bx = px + Math.sin(th) * CLOCK.len, bz = pz - Math.cos(th) * CLOCK.len, mp = FR(CLOCK.front - 2);
    s += lineOn(mp, [[px, pz], [bx, bz]], INK, 3.2) + lineOn(mp, [[px, pz], [bx, bz]], GOLD, 1.6) + shape(mp, ov(bx, bz, CLOCK.bob, CLOCK.bob, 24), GOLD, 1.3) + shape(mp, ov(bx - 2, bz + 2, CLOCK.bob * 0.4, CLOCK.bob * 0.4, 12), "#F7E3A1", 0);
    const hr = now ? now[0] : 10, mn = now ? now[1] : 10, a1 = (((hr % 12) + mn / 60) / 12) * TAU, a2 = (mn / 60) * TAU, mh = FR(CLOCK.front + 0.3);
    s += lineOn(mh, [[dx, dz], [dx + Math.sin(a1) * 12, dz + Math.cos(a1) * 12]], INK, 2.6) + lineOn(mh, [[dx, dz], [dx + Math.sin(a2) * 18, dz + Math.cos(a2) * 18]], INK, 1.6) + shape(FR(CLOCK.front + 0.4), ov(dx, dz, 2, 2, 10), GOLDD, 0.8);
    return s;
  };
  M.shop_kobo_50 = (k) => {
    // はぐるまの からくり どけい: きの だい・ながい きの はこ・まるい もじばん（きんの ふち・12の しるし）・ガラスの まどの ふりこ・みぎの よこと まえの はぐるま・アーチの やねと からくりの ちいさな とびら・きんの かざり
    const { box, prism, shape, FR, SD, lineOn, ball, shadow, L } = k, f = CLOCK.front, [dx, dz, dr] = CLOCK.dial, WD = ["#B07A52", "#8E5E3C", "#C99A6E"];
    let s = shadow(0.12, 3, 8) + box(-38, -58, 76, 48, 0, 12, ["#8E5E3C", "#6E4528", "#A87850"], 1.4);
    s += box(-34, -54, 68, 40, 12, 184, WD, 1.5);
    for (const z of [32, 136]) s += lineOn(FR(f), [[-34, z], [34, z]], "#7A4E30", 1.4);
    s += lineOn(SD(34.05), [[-54, 98], [-14, 98]], "#7A4E30", 1.2);
    // まどと ふりこの へや
    s += shape(FR(f + 0.05), rr(-20, 38, 40, 92, 8), "#3A3046", 1.4) + shape(FR(f + 0.05), ov(0, 126, 3, 3, 10), GOLDD, 0.8);
    // もじばん
    s += shape(FR(f + 0.05), ov(dx, dz, dr, dr, 40), GOLD, 1.4) + shape(FR(f + 0.1), ov(dx, dz, dr - 3, dr - 3, 40), "#FFF8E7", 1.1);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, q = i % 3 ? 1.1 : 1.8; s += shape(FR(f + 0.2), ov(dx + Math.sin(a) * 17.5, dz + Math.cos(a) * 17.5, q, q, 8), i % 3 ? "#B9974A" : INK, 0); }
    // アーチの やね・からくりの とびら・かざり
    s += prism(FR(f), arch(-38, 38, 196, 202, 216), [0, -44, 0], "#C99A6E", "#8E5E3C", 1.5) + lineOn(FR(f + 0.05), arch(-38, 38, 196, 202, 216).slice(2), "#7A4E30", 1.2);
    s += shape(FR(f + 0.1), arch(-7, 7, 199, 207, 211), "#6E4528", 1.2) + shape(FR(f + 0.15), ov(4, 204, 0.9, 0.9, 8), GOLD, 0);
    s += ball(0, -34, 219, 3.6, GOLD, 1.1, 0.5) + ball(-30, -34, 199, 2.4, GOLD, 0.9, 0.5) + ball(30, -34, 199, 2.4, GOLD, 0.9, 0.5);
    // うごく ところ（live では FurnLive）
    s += L(clockParts(k, 0.5, null) + lineOn(FR(f + 0.4), [[-16, 120], [-6, 128]], "#FFFFFF", 1.6, 'stroke-opacity=".5"') + lineOn(FR(f + 0.4), [[-17, 106], [-2, 118]], "#FFFFFF", 1.2, 'stroke-opacity=".4"'));
    return s;
  };

  for (const [id, fn] of Object.entries(M)) if (FURN_INDEX[id]) FurnModels.register(id, fn);

  // ================= さわる（FurnLive）=================
  const { mapper, since, say, tone, glow, lampOn, ink, path, FXS, simple, lamp, shiny } = ShopRewardArt.liveKit;
  // 線を ひく（とじない）
  const strokeL = (ctx, pts, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); };
  // まわる かく（いつもは slow・タップの あと 3びょうは fast）
  const spin = (st, slow, fast, a0 = 0) => { const now = G.t, dt = Math.min(0.1, Math.max(0, now - (st.lt ?? now))); st.lt = now; st.ang = (st.ang ?? a0) + dt * (since(st) < 3 ? fast : slow); return st.ang; };
  // 小さな 絵（SVG）を canvas に はる。キーは しゅるいごとに 1つ・おおきさも きまり（SvgCache の キーは ふえない）
  const SPX = 3, SPRITES = {};
  const sprite = (key, hw, hh, fn) => { SPRITES[key] = { hw, hh, fn }; };
  const spriteImg = (key, ensure) => { const p = SPRITES[key], f = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p.hw} ${-p.hh} ${p.hw * 2} ${p.hh * 2}">${p.fn()}</svg>`, w = p.hw * 2 * SPX, h = p.hh * 2 * SPX; return ensure ? SvgCache.ensure("srmore:" + key, f, w, h) : SvgCache.get("srmore:" + key, f, w, h); };
  const drawSprite = (ctx, key, x, y, s, flip) => { const c = spriteImg(key, false); if (!c) return; const p = SPRITES[key]; ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(c, -p.hw * s, -p.hh * s, p.hw * 2 * s, p.hh * 2 * s); ctx.restore(); };
  const warm = (keys) => (st) => { st.len = 0; for (const key of keys) spriteImg(key, true); };
  ACCS.forEach(([kind, c], i) => sprite("acc" + i, 12, 12, () => accSvg(kind, c)));
  GONDOLAS.forEach((_, i) => sprite("gon" + i, 11, 30, () => gondolaSvg(i)));

  // ---- バーガーやさん ----
  // ジュークボックス: タップで つく／きえる（よるは はじめから）。ついて いる ときは にじいろが ながれて メロディ
  FurnLive.register("shop_burger_40", {
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; if (st.on) tone([523, 659, 784, 659, 880, 784, 1047], 0.13, "square", 0.045); else tone([784, 523], 0.08, "sine", 0.08); say(sc, it, st.on ? "ミュージック スタート！" : "レコード おやすみ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      if (!lampOn(st)) return;
      const P = mapper(sc, it, r), t = G.t, cols = ["255,150,190", "255,226,120", "150,230,200", "140,200,255"];
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 9; i++) { const a = Math.PI - (i / 8) * Math.PI, c = P(Math.cos(a) * 24, JUKE.y, JUKE.z0 + 2 + Math.sin(a) * 26); glow(ctx, c.x, c.y, 9 * P.s, cols[(i + Math.floor(t * 4)) % 4], 0.5); }
      for (const x of [-25, 25]) for (let z = 20; z < 80; z += 14) { const c = P(x, JUKE.y, z), ph = Math.floor(t * 4 + z / 14) % 4; glow(ctx, c.x, c.y, 7 * P.s, cols[ph], 0.42); }
      ctx.restore();
      FXS.note(ctx, P, { t0: G.t - ((t * 0.6) % 1.6) }, 0, JUKE.y, 108, 1.6);
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const P = mapper(sc, it, r), c = P(0, -20, 80); glow(ctx, c.x, c.y, 120 * P.s, "255,170,200", 0.24); },
  });
  // すべりだい: タップで ポテトが しゅーっと すべる
  FurnLive.register("shop_burger_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[880, 330]], 0.1, "sine", 0.07); setTimeout(() => tone([659, 880], 0.08, "triangle", 0.08), 900); say(sc, it, ["しゅーっ！", "ポテトも すべって いく〜", "もう いっかい すべりたい！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 1.8) return;
      const P = mapper(sc, it, r), s = P.s, u = Math.min(1, t / 1.1), e = u * u, [x, y, z] = slideAt(e), q = P(x, y, z + 5), a = Math.atan2(P(...slideAt(Math.min(1, e + 0.05))).y - P(x, y, z).y, P(...slideAt(Math.min(1, e + 0.05))).x - P(x, y, z).x);
      ctx.save(); ctx.globalAlpha = t > 1.4 ? (1.8 - t) / 0.4 : 1; ctx.translate(q.x, q.y); ctx.rotate(a); ink(ctx, 1.1);
      ctx.fillStyle = "#F6CE58"; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.rect((dx - 1.6) * s, -9 * s, 3.2 * s, 9 * s); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#E45A4F"; ctx.beginPath(); ctx.moveTo(-8 * s, -4 * s); ctx.lineTo(8 * s, -4 * s); ctx.lineTo(6.5 * s, 3 * s); ctx.lineTo(-6.5 * s, 3 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (u >= 1) FXS.puff(ctx, P, { t0: st.t0 + 1.1 }, SLIDE.e[0], SLIDE.e[1], SLIDE.e[2] + 4, 0.7);
    },
  });

  // ---- びようしつ ----
  simple("shop_groom_40", ["あわあわ〜 きもちいい", "シャンプー してもらおう", "いい におい！"], "bubble", [0, -80, 82], [880, 988, 1175]);
  // メリーゴーランド: かざりが いつも ゆっくり まわる（タップで はやく・オルゴール）。やねに かくれる ところは かかない
  FurnLive.register("shop_groom_50", {
    init: warm(ACCS.map((_, i) => "acc" + i)),
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([784, 988, 1175, 988, 784, 659, 784], 0.16, "sine", 0.07); say(sc, it, ["くるくる〜 オルゴール みたい", "どの かざりに しようかな", "リボンが まわってる！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, { cx, cy, top, hang } = CAROUSEL, ang = spin(st, 0.35, 1.4, 0.4);
      ctx.save();
      const rim = Array.from({ length: 25 }, (_, i) => { const a = VIS[0] + ((VIS[1] - VIS[0]) * i) / 24, q = P(cx + Math.cos(a) * 56, cy + Math.sin(a) * 56, top); return { x: q.x, y: q.y + 5 * s }; }), A = rim[0], B = rim[rim.length - 1], far = 400 * s;
      ctx.beginPath(); ctx.moveTo(A.x + (A.x > B.x ? far : -far), A.y); rim.forEach((q) => ctx.lineTo(q.x, q.y)); ctx.lineTo(B.x + (A.x > B.x ? -far : far), B.y); ctx.lineTo(B.x + (A.x > B.x ? -far : far), B.y + far * 2); ctx.lineTo(A.x + (A.x > B.x ? far : -far), A.y + far * 2); ctx.closePath(); ctx.clip();
      const items = ACCS.map((_, i) => { const [x, y] = accAt(i, ang); return { i, x, y, z: hang + Math.sin(ang * 2 + i * 1.3) * 3, d: x - cx + (y - cy) }; }).sort((p, q) => p.d - q.d);
      const item = (q) => { const t = P(q.x, q.y, top), b = P(q.x, q.y, q.z + 8), c = P(q.x, q.y, q.z); strokeL(ctx, [t, b], INK, 3.1 * s); strokeL(ctx, [t, b], GOLD, 1.1 * s); drawSprite(ctx, "acc" + q.i, c.x, c.y, s, it.flip); };
      for (const q of items) if (q.d < 0) item(q);
      // まんなかの はしら（きん・ピンクの わ）
      const band = (z0, z1, rad, side, capC) => { const b = P(cx, cy, z0), t = P(cx, cy, z1), rx = rad * 1.245 * s, ry = rad * 0.679 * s; ctx.beginPath(); ctx.moveTo(t.x - rx, t.y); ctx.lineTo(b.x - rx, b.y); ctx.ellipse(b.x, b.y, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(t.x + rx, t.y); ctx.closePath(); ctx.fillStyle = side; ink(ctx, 1.2 * s); ctx.fill(); ctx.stroke(); if (capC) { ctx.fillStyle = capC; ctx.beginPath(); ctx.ellipse(t.x, t.y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke(); } };
      band(13, top, 5, GOLDD, null);
      { const b = P(cx, cy, 14), t = P(cx, cy, top); strokeL(ctx, [{ x: t.x - 2.2 * s, y: t.y }, { x: b.x - 2.2 * s, y: b.y }], GOLD, 2.2 * s); }
      for (const z of [40, 70, 100]) band(z, z + 3, 6.2, "#F2A7B8", "#F7C6D6");
      for (const q of items) if (q.d >= 0) item(q);
      ctx.restore();
    },
  }, true);

  // ---- ケーキやさん ----
  simple("shop_cake_40", ["ふわふわ ロールケーキ", "クリームが たっぷり", "うずまき かわいい！"], "heart", [0, -40, 60]);
  // ケーキの おしろ: ろうそくが ともる（タップで つく／きえる・よるは はじめから）
  lamp("shop_cake_50", {
    pts: CANDLES.map(([x, y, z]) => [x, y, z + 5, 11]), rgb: "255,205,130", rr: 11, big: 120, lines: ["ろうそくが ともった！", "ふーっ。ろうそく おやすみ"],
    extra(ctx, P, st, on) {
      if (!on) return;
      const s = P.s;
      CANDLES.forEach(([x, y, z], i) => { const c = P(x, y, z + 2), h = (5.4 + Math.sin(G.t * 9 + i * 1.7) * 0.8) * s; ctx.beginPath(); ctx.moveTo(c.x - 1.9 * s, c.y); ctx.quadraticCurveTo(c.x - 2.3 * s, c.y - h * 0.6, c.x + Math.sin(G.t * 7 + i) * 0.5 * s, c.y - h); ctx.quadraticCurveTo(c.x + 2.3 * s, c.y - h * 0.6, c.x + 1.9 * s, c.y); ctx.closePath(); ctx.fillStyle = "#FFB347"; ink(ctx, 0.8 * s); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#FFF1B8"; ctx.beginPath(); ctx.ellipse(c.x, c.y - h * 0.35, 0.8 * s, 1.6 * s, 0, 0, TAU); ctx.fill(); });
    },
  });

  // ---- クレープやさん ----
  simple("shop_crepe_40", ["どれを のせようかな？", "いちごと チョコ！", "トッピング だいすき"], "heart", [0, -40, 96], [659, 784, 988]);
  // かんらんしゃ: いつも ゆっくり まわる（タップで すこし はやく）・よるは でんきゅうと あかりの ぼうが ひかる
  const wheelDraw = (ctx, P, s, ang, flip) => {
    const { cz, R, n, spokes } = WHEEL, Q = (ss, t, f = 0) => P(...wheelPt(ss, t, f)), circ = (rad, N = 48) => Array.from({ length: N + 1 }, (_, i) => { const a = (i / N) * TAU; return Q(Math.cos(a) * rad, cz + Math.sin(a) * rad); });
    const hub = Q(0, cz);
    for (let i = 0; i < spokes; i++) { const a = ang + (i / spokes) * TAU, e = Q(Math.cos(a) * R, cz + Math.sin(a) * R); strokeL(ctx, [hub, e], INK, 2.8 * s); strokeL(ctx, [hub, e], "#FFFFFF", 1.2 * s); }
    const c2 = circ(R - 18), c1 = circ(R);
    strokeL(ctx, c2, INK, 4 * s); strokeL(ctx, c2, "#FFF4DC", 2.2 * s); strokeL(ctx, c1, INK, 8 * s); strokeL(ctx, c1, "#F7B9C9", 5.4 * s);
    for (let i = 0; i < spokes; i++) { const a = ang + ((i + 0.5) / spokes) * TAU, q = Q(Math.cos(a) * R, cz + Math.sin(a) * R, 0.6); ctx.fillStyle = "#FFF1B8"; ink(ctx, 0.8 * s); ctx.beginPath(); ctx.arc(q.x, q.y, 1.9 * s, 0, TAU); ctx.fill(); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + ang; path(ctx, Array.from({ length: 14 }, (_, j) => { const b = (j / 14) * TAU; return Q(Math.cos(a) * 7.5 + Math.cos(b) * 4.4, cz + Math.sin(a) * 7.5 + Math.sin(b) * 4.4, 0.5); })); ctx.fillStyle = "#FFFFFF"; ink(ctx, 1 * s); ctx.fill(); ctx.stroke(); }
    path(ctx, Array.from({ length: 16 }, (_, j) => { const b = (j / 16) * TAU; return Q(Math.cos(b) * 5.2, cz + Math.sin(b) * 5.2, 0.7); })); ctx.fillStyle = "#F7D56A"; ink(ctx, 1.1 * s); ctx.fill(); ctx.stroke();
    for (let i = 0; i < n; i++) { const a = ang + (i / n) * TAU, q = Q(Math.cos(a) * R, cz + Math.sin(a) * R, 3); drawSprite(ctx, "gon" + (i % GONDOLAS.length), q.x, q.y, s, flip); }
  };
  FurnLive.register("shop_crepe_50", {
    init: warm(GONDOLAS.map((_, i) => "gon" + i)),
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 784, 1047, 784, 659], 0.18, "sine", 0.07); say(sc, it, ["てっぺん たかい！", "クレープの ゴンドラ のりたい", "ゆっくり まわるね〜"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) { const P = mapper(sc, it, r); wheelDraw(ctx, P, P.s, spin(st, 0.16, 0.7, WHEEL_ANG), it.flip); },
    light(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), ang = st.ang ?? WHEEL_ANG;
      for (let i = 0; i < WHEEL.spokes; i += 2) { const a = ang + ((i + 0.5) / WHEEL.spokes) * TAU, q = P(...wheelPt(Math.cos(a) * WHEEL.R, WHEEL.cz + Math.sin(a) * WHEEL.R)); glow(ctx, q.x, q.y, 10 * P.s, "255,230,170", 0.5); }
      for (const [x, y] of POSTS) { const q = P(x, y, 56); glow(ctx, q.x, q.y, 26 * P.s, "255,230,170", 0.5); }
    },
  }, true);

  // ---- はいしゃさん ----
  lamp("shop_dentist_40", { pts: [[0, -23, 80, 34]], rgb: "220,245,255", lines: ["はが ピカピカ ひかった！", "はの ランプ おやすみ"] });
  // かいがらの ベッド: タップで しんじゅが ぽわっと ひかって あわ・よるは ほんのり
  FurnLive.register("shop_dentist_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1047, 1319, 1568, 2093], 0.12, "sine", 0.07); say(sc, it, ["しんじゅが ぽわっと ひかった", "かいがらの ベッド ふかふか", "うみの ゆめが みられそう"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 3) return;
      const P = mapper(sc, it, r), c = P(PEARL.x, PEARL.y, PEARL.z), k2 = t < 0.3 ? t / 0.3 : t > 2.2 ? (3 - t) / 0.8 : 1;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, c.x, c.y, 34 * P.s, "255,235,250", 0.55 * k2); ctx.restore();
      FXS.bubble(ctx, P, st, PEARL.x, PEARL.y, PEARL.z + 10, 2.6);
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(PEARL.x, PEARL.y, PEARL.z); glow(ctx, c.x, c.y, 60 * P.s, "255,225,245", 0.3); },
  });

  // ---- パンやさん ----
  simple("shop_bakery_40", ["さくさくの クロワッサン", "バターの いい におい", "ふかふかで ねむく なる〜"], "puff", [0, -40, 60], [523, 659, 523]);
  // ふうしゃ: はねが いつも ゆっくり まわる（タップで はやく・とびらから こなが ふわっ）
  const millDraw = (ctx, P, s, ang) => {
    const Q = ([a, b], f = 0) => P(...millPt(a, b, f));
    for (let i = 0; i < MILL.n; i++) {
      const { spar, cloth, rungs, rail } = sailPolys(ang + (i / MILL.n) * TAU);
      path(ctx, cloth.map((q) => Q(q, 0.4))); ctx.fillStyle = "rgba(255,244,222,.92)"; ink(ctx, 1.2 * s); ctx.fill(); ctx.stroke();
      for (const rg of rungs) strokeL(ctx, rg.map((q) => Q(q, 0.5)), "#B98A55", 1.1 * s);
      strokeL(ctx, rail.map((q) => Q(q, 0.5)), "#B98A55", 1.1 * s);
      const sp = spar.map((q) => Q(q, 1)); strokeL(ctx, sp, INK, 4.2 * s); strokeL(ctx, sp, "#A8743F", 2.4 * s);
    }
    const h = Q([0, 0], 2); shiny(ctx, h.x, h.y, 5 * 1.23 * s, "#FFF1B8", "#E3C06B");
  };
  FurnLive.register("shop_bakery_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([392, 523, 659, 523, 392], 0.2, "triangle", 0.07); say(sc, it, ["はねが くるくる！", "こむぎこを ひいて いるよ", "おいしい パンに なあれ"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) { const P = mapper(sc, it, r); millDraw(ctx, P, P.s, spin(st, 0.3, 1.6, Math.PI / 4)); FXS.puff(ctx, P, st, 24, -28, 20, 2.4); },
  }, true);

  // ---- おはなやさん ----
  lamp("shop_florist_40", { pts: [[0, SUN.y, SUN.z, 30]], rgb: "255,220,120", lines: ["ひまわりが ぱっと ひかった！", "ひまわり おやすみ"] });
  simple("shop_florist_50", ["おはなに かこまれて しあわせ", "ここで おちゃ しよう", "いい かおり〜"], "petal", [0, -55, 160], [659, 784, 880, 1047]);

  // ---- そらの はいたつ ----
  simple("shop_relay_40", ["ふわふわ〜 くもの うえ", "そらを とんでる みたい", "にじの クッション すき"], "heart", [0, -40, 60], [784, 988, 1175]);
  // くじらの ひこうせん: プロペラが まわる（タップで ぶーん・くじらが しおふき）
  FurnLive.register("shop_relay_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[220, 330], [262, 392], [294, 440]], 0.22, "triangle", 0.05); say(sc, it, ["くじらさん、しゅっぱつ！", "しおふき ぷしゅー！", "くもの うみへ いこう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, fast = since(st) < 3, ang = spin(st, 2.6, 26, 0.4);
      for (const off of [0, Math.PI]) { path(ctx, airPropPts(ang + off).map(([yy, zz]) => P(AIRPROP.x + 1.5, yy, zz))); ctx.fillStyle = fast ? "rgba(244,240,232,.6)" : "#F4F0E8"; ink(ctx, 1.1 * s); ctx.fill(); ctx.stroke(); }
      const hub = P(AIRPROP.x + 2.4, AIRPROP.y, AIRPROP.z); shiny(ctx, hub.x, hub.y, 2.6 * 1.23 * s, "#F7A0A0", "#E0473F");
      FXS.bubble(ctx, P, st, 30, -42, 160, 2.4);
    },
  }, true);

  // ---- ころころ フルーツ ----
  simple("shop_korokoro_40", ["ゆら〜り ゆら〜り", "メロンの いい におい", "おひるね したく なる"], "heart", [0, -31, 50], [523, 587, 659]);
  simple("shop_korokoro_50", ["しゅっぽっぽ！", "くだもの れっしゃ、しゅっぱつ！", "つぎは いちご えき〜"], "puff", [64, -35, 66], [[660, 990], null, [660, 990], [660, 990]]);

  // ---- ガソリンスタンド ----
  simple("shop_gasstand_40", ["ドラムかんの テーブル！", "ミニカー ぶーん", "ここで ひとやすみ"], "heart", [0, -36, 70], [392, 523, 392]);
  // せんしゃき: たての ブラシが いつも まわる（タップで はやく・あわ）。みぎの はしらの まえは かかない
  const PILLAR_R = [[62, -46, 3], [74, -46, 3], [74, -64, 3], [74, -64, 128], [62, -64, 128], [62, -46, 128]];
  FurnLive.register("shop_gasstand_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[300, 900], [320, 1000], [340, 1100]], 0.2, "sine", 0.05); say(sc, it, ["あわあわ〜 ぴかぴか！", "ブラシが くるくる！", "くるまが きれいに なった"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, ang = spin(st, 1.2, 6, 0.3);
      for (const sx of [-1, 1]) {
        const x = sx * WASH.bx;
        ctx.save();
        if (sx > 0) { ctx.beginPath(); ctx.rect(-1e4, -1e4, 2e4, 2e4); PILLAR_R.forEach((v, i) => { const q = P(...v); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.closePath(); ctx.clip("evenodd"); }
        for (const [c, pts] of brushStripes(x, ang * sx)) { path(ctx, pts.map((v) => P(...v))); ctx.fillStyle = c; ctx.fill(); }
        strokeL(ctx, arcPts(x, WASH.y, WASH.r + 0.4, WASH.z0).map((v) => P(...v)), INK, 1.4 * s);
        ctx.restore();
      }
      FXS.bubble(ctx, P, st, 0, -55, 40, 2.4);
    },
  }, true);

  // ---- ゆうびんきょく ----
  simple("shop_postoffice_40", ["おてがみの ソファ！", "ハートの シール かわいい", "だれかに おてがみ かこう"], "heart", [0, -50, 70], [988, 1319]);
  FurnLive.register("shop_postoffice_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1568, 1319, 1568, 1319], 0.11, "sine", 0.08); say(sc, it, ["ちりんちりん！", "てがみを とどけに いこう", "あかい じてんしゃ かっこいい"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) { if (since(st) < 2) FXS.note(ctx, mapper(sc, it, r), st, 30, -37, 88, 1.8); },
  });

  // ---- あたまの たいそう ----
  lamp("shop_brain_40", { pts: [[0, BULB.y, BULB.z, 36]], rgb: "255,236,150", lines: ["ひらめいた！ ぴかっ！", "でんきゅう おやすみ"] });
  simple("shop_brain_50", ["ホーホー、よく きたね", "ふくろうの はねに つつまれる", "ほんを よむのに ぴったり"], "note", [0, -80, 130], [392, 330, 392, 523]);

  // ---- パズル こうぼう ----
  simple("shop_kobo_40", ["ブロックの たな！", "パズル キューブ そろうかな", "いろいろ かざろう"], "heart", [0, -22, 136], [659, 784, 988]);
  // からくり どけい: はりは ほんとうの じこく・ふりこと はぐるまが うごく（タップで はやく・とびらから ことりが でる）
  const clockDraw = (ctx, P, s, ang, hr, mn) => {
    const onPl = (face, a, b, d = 0) => (face === "side" ? P(CLOCK.side + 0.1 + d, a, b) : P(a, CLOCK.front + 0.1 + d, b));
    for (const [face, a, b, r, sp] of GEARS) {
      const g = ang * sp;
      path(ctx, gearPts(a, b, r, g).map(([u, v]) => onPl(face, u, v))); ctx.fillStyle = GOLD; ink(ctx, 1.2 * s); ctx.fill(); ctx.stroke();
      path(ctx, ov(a, b, r * 0.32, r * 0.32, 12).map(([u, v]) => onPl(face, u, v))); ctx.fillStyle = GOLDD; ink(ctx, 0.9 * s); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 2; i++) { const c = Math.cos(g + (i * Math.PI) / 2) * r * 0.62, d = Math.sin(g + (i * Math.PI) / 2) * r * 0.62; strokeL(ctx, [onPl(face, a + c, b + d), onPl(face, a - c, b - d)], "#B9974A", 1.2 * s); }
    }
    const th = Math.sin(G.t * 2.4) * 0.22, [px, pz] = CLOCK.pivot, bx = px + Math.sin(th) * CLOCK.len, bz = pz - Math.cos(th) * CLOCK.len, Fp = (x, z) => P(x, CLOCK.front - 2, z);
    strokeL(ctx, [Fp(px, pz), Fp(bx, bz)], INK, 3.2 * s); strokeL(ctx, [Fp(px, pz), Fp(bx, bz)], GOLD, 1.6 * s);
    path(ctx, ov(bx, bz, CLOCK.bob, CLOCK.bob, 24).map(([u, v]) => Fp(u, v))); ctx.fillStyle = GOLD; ink(ctx, 1.3 * s); ctx.fill(); ctx.stroke();
    path(ctx, ov(bx - 2, bz + 2, CLOCK.bob * 0.4, CLOCK.bob * 0.4, 12).map(([u, v]) => Fp(u, v))); ctx.fillStyle = "#F7E3A1"; ctx.fill();
    const [dx, dz] = CLOCK.dial, a1 = (((hr % 12) + mn / 60) / 12) * TAU, a2 = (mn / 60) * TAU, Fh = (x, z) => P(x, CLOCK.front + 0.3, z);
    strokeL(ctx, [Fh(dx, dz), Fh(dx + Math.sin(a1) * 12, dz + Math.cos(a1) * 12)], INK, 2.6 * s); strokeL(ctx, [Fh(dx, dz), Fh(dx + Math.sin(a2) * 18, dz + Math.cos(a2) * 18)], INK, 1.6 * s);
    path(ctx, ov(dx, dz, 2, 2, 10).map(([u, v]) => Fh(u, v))); ctx.fillStyle = GOLDD; ink(ctx, 0.8 * s); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.5; strokeL(ctx, [Fh(-16, 120), Fh(-6, 128)], "#FFFFFF", 1.6 * s); ctx.globalAlpha = 0.4; strokeL(ctx, [Fh(-17, 106), Fh(-2, 118)], "#FFFFFF", 1.2 * s); ctx.restore();
  };
  FurnLive.register("shop_kobo_50", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([784, 659, 784, 659, null, 523], 0.32, "sine", 0.08); say(sc, it, ["ぽっぽー！ からくりの ことり", "はぐるまが くるくる", "ちくたく ちくたく"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, d = new Date();
      clockDraw(ctx, P, s, spin(st, 0.6, 2.4, 0.5), d.getHours(), d.getMinutes());
      // からくりの ことり（タップの あと）
      const t = since(st); if (t < 0 || t > 2.6) return;
      const k2 = t < 0.4 ? t / 0.4 : t > 2 ? (2.6 - t) / 0.6 : 1, F = (x, z) => P(x, CLOCK.front + 0.3, z);
      path(ctx, arch(-7, 7, 199, 207, 211).map(([u, v]) => F(u, v))); ctx.fillStyle = "#2E2430"; ink(ctx, 1.2 * s); ctx.fill(); ctx.stroke();
      const c = P(0, CLOCK.front + 4 * k2, 205);
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(k2, k2); ink(ctx, 1);
      ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.ellipse(0, 0, 6 * s, 5 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#F29A3B"; ctx.beginPath(); ctx.moveTo(5 * s, -1 * s); ctx.lineTo(9.5 * s, 0.4 * s); ctx.lineTo(5 * s, 1.8 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.4 * s, -1.4 * s, 0.9 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = "#F2A7B8"; ctx.beginPath(); ctx.ellipse(-1.6 * s, 1.6 * s, 3 * s, 1.8 * s, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
  }, true);

  return { ids: Object.keys(M), model(id, opts = {}) { return FurnModels.build(id, opts); } };
})();
