// おてつだいの ごほうび 44こ の 立体と さわった ときの うごき（UI-38・js/shop-rewards.js の 家具）。
// どれも FurnModels の くみたて（INK の 線・パステル・まるい つなぎめ）。id・大きさ・ねだん（0）・セーブは shop-rewards.js の まま。
// うごく ぶぶん（ネオン・サインポールの しま・プロペラ・ブランコ・ほのお など）は live の とき 絵から ぬいて FurnLive が canvas に 描く。
// SvgCache は つかわない（キーが ふえない）。音は WebAudio で その場で つくる。
const ShopRewardArt = (() => {
  const TAU = Math.PI * 2;
  const { rect, rr, ov, arc, arch, star, heart, scallop, moon, close, rot2 } = FurnModels.shapes;
  const SPR = FurnModels.SPR;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const CHROME = ["#D5DCE2", "#AEB8C1", "#EEF2F5"], GOLD = "#E3C06B", GOLDD = "#B9974A";
  const M = {};
  const FurnModelsNorm = (v) => { const L = Math.hypot(...v) || 1; return v.map((c) => c / L); };
  // なみなみの まる（レタス・フリル）
  const wavy = (cx, cy, r, amp, n, ry = 1) => Array.from({ length: n * 8 }, (_, i) => { const t = (i / (n * 8)) * TAU, q = r + Math.sin(t * n) * amp; return [cx + Math.cos(t) * q, cy + Math.sin(t) * q * ry]; });
  // つつの まわりの しま（サインポール・ききゅう）: a0 から まわる はばの おびを、見える はんぶんだけ。z は z0〜z1 に おさめる
  const band = (k, cx, cy, r, z0, z1, lo, wd, pitch, fill, sy = 1) => {
    const n = 24, A = -Math.PI / 4, B = (3 * Math.PI) / 4; // 見る 人の ほうを むく はんぶん（-45°〜135°。まんなかは +x と +y の あいだ）
    const z = (a, off) => Math.max(z0, Math.min(z1, lo + off + pitch * a));
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = A + ((B - A) * i) / n; pts.push(k.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy, z(a, 0))); }
    for (let i = n; i >= 0; i--) { const a = A + ((B - A) * i) / n; pts.push(k.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy, z(a, wd))); }
    return `<polygon points="${pts.map(k.xy).join(" ")}" fill="${fill}" stroke="none"/>`;
  };
  // たれる しずく（チーズ・クリーム）
  const drip = (col, len = 7, w = 3.2) => `<path d="M${-w},0 Q${-w},${len * 0.75} 0,${len} Q${w},${len * 0.75} ${w},0 Z" fill="${col}" ${S(1.1)}/>`;

  // ================= バーガーやさん =================
  M.shop_burger_5 = (k) => {
    // バーガーの スツール: した の バンズ・ハンバーグ（こげめ）・トマト・レタス・チーズ（かどが たれる）・ごまの バンズ（すわる ところ）
    const { cyl, dome, prism, TP, at, eggAt, line, shadow, rg } = k, cx = 0, cy = -23;
    let s = shadow(0.14, 3, 22);
    s += cyl(cx, cy, 0, 19.5, 9, "#C27F44", "#DFA466");
    s += cyl(cx, cy, 9, 21, 7.5, "#6E412A", "#875236");
    for (const a of [-0.5, 0.2, 0.9, 1.6, 2.3]) { const x = cx + Math.cos(a) * 21.2, y = cy + Math.sin(a) * 21.2; s += line([[x, y, 11], [x, y, 15]], "#4A2A1A", 1.4); }
    s += cyl(cx, cy, 16.5, 20, 2.4, "#D9493F", "#EE6A5C", 1.2);
    s += prism(TP(20.5), wavy(cx, cy, 23, 1.7, 14), [0, 0, -1.8], "#A4D884", "#7FBC62", 1.2);
    const cheese = rot2(rect(cx - 17.5, cy - 17.5, 35, 35), cx, cy, Math.PI / 4);
    s += prism(TP(21.8), cheese, [0, 0, -1.2], "#F7CD4E", "#E2B23A", 1.2);
    s += at(cx + 24.6, cy, 20.6, drip("#F7CD4E", 8), 4, 2) + at(cx, cy + 24.6, 20.6, drip("#F7CD4E", 10), 4, 2);
    s += cyl(cx, cy, 22, 20.5, 5.5, "#C9874A", "#E3A86A");
    s += dome(cx, cy, 27.5, 20.5, 20.5, 18, rg([[0, "#F4C98A"], [0.55, "#E0A160"], [1, "#B8773E"]], 0.36, 0.28, 0.85));
    for (const [a, b] of [[0.25, 0.95], [0.95, 0.75], [1.65, 0.9], [-0.35, 0.62], [0.6, 0.4], [1.3, 0.36], [2.15, 0.5], [0.05, 0.28], [1.95, 0.25], [-0.6, 0.25]]) {
      const p = eggAt(cx, cy, 27.5, 20.5, 20.5, 18, a, b);
      s += at(p[0], p[1], p[2], `<ellipse rx="1.7" ry="0.95" transform="rotate(${-20 + a * 18})" fill="#FFF4D6" stroke="#C99A62" stroke-width=".55"/>`, 2, 2);
    }
    return s;
  };
  const FRIES = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) FRIES.push([-12 + i * 7.4 + (j % 2) * 2, -31 + j * 8.2, 18 + ((i * 7 + j * 5) % 11) * 1.9]);
  M.shop_burger_10 = (k) => {
    // ポテトの スタンドライト: あかい はこ（すこし ひろがる）から ポテトが ならんで ひかる。まえに にこにこの マーク
    const { poly, box, shape, FR, onP, cyl, shadow } = k, Y0 = -38, top = 62;
    let s = shadow(0.13, 4, 8) + cyl(0, -19, 0, 17, 4, "#B23A33", "#D9564C", 1.3);
    // はこの なか（うえから 見える くらい ところ）
    s += poly([[-19, -34, top], [19, -34, top], [19, -4, top], [-19, -4, top]], "#8E2A26", 1.4);
    for (const [x, y, L] of FRIES.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) s += box(x, y, 4.4, 4.4, top - 22, 22 + L, ["#F6CE58", "#DDAE36", "#FFE79A"], 1.1);
    // はこ（みぎ・まえ）
    s += poly([[15, -31, 4], [15, -7, 4], [19, -4, top], [19, -34, top]], "#B8342E", 1.5);
    s += poly([[-15, -7, 4], [15, -7, 4], [19, -4, top], [-19, -4, top]], "#E04B42", 1.5);
    s += poly([[-17.6, -5, 40], [17.6, -5, 40], [18.4, -4.4, 48], [-18.4, -4.4, 48]], "#F6CE58", 0);
    s += onP(FR(-5.2), -9, 34, 18, 16, `<circle cx="9" cy="8" r="7.4" fill="#FFF6E0" ${S(1.2)}/><circle cx="6.4" cy="6.8" r="1" fill="${INK}"/><circle cx="11.6" cy="6.8" r="1" fill="${INK}"/><path d="M5.6,9.4 Q9,12.6 12.4,9.4" fill="none" ${S(1.1)}/><circle cx="4.6" cy="9.6" r="1.1" fill="#F2A7B8"/><circle cx="13.4" cy="9.6" r="1.1" fill="#F2A7B8"/>`);
    s += poly([[-19, -4, top], [19, -4, top], [19, -4, top - 3], [-19, -4, top - 3]], "#F06A5E", 1.1);
    return s;
  };
  M.shop_burger_15 = (k) => {
    // ダイナーの ボックスせき（Lの じの せき）: おくと ひだりに あかい ソファ（しろい ふち・たての みぞ）・ミントの テーブル・ケチャップ・マスタード・ナプキン・シェイク
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, ball, rod, at, shadow } = k;
    const RED = ["#D9473F", "#B5352F", "#EC6A60"], CREAM = "#FFF1D6";
    let s = shadow(0.12, 2, 8);
    // おくの せき
    s += box(-64, -72, 128, 8, 26, 50, RED) + box(-64, -72, 128, 8, 76, 3, ["#FFF1D6", "#E9D8B8", "#FFF8E8"]);
    for (let x = -46; x < 64; x += 12) s += lineOn(FR(-63.9), [[x, 30], [x, 72]], "#B5352F", 1.3);
    s += box(-64, -64, 128, 24, 0, 22, ["#C9CFD6", "#A7AFB8", "#E1E6EA"]) + box(-64, -64, 128, 24, 22, 8, RED) + lineOn(FR(-39.9), [[-64, 24.5], [64, 24.5]], CREAM, 2);
    // ひだりの せき
    s += box(-64, -40, 8, 40, 26, 50, RED) + box(-64, -40, 8, 40, 76, 3, ["#FFF1D6", "#E9D8B8", "#FFF8E8"]);
    for (let y = -30; y < 0; y += 10) s += lineOn(SD(-55.9), [[y, 30], [y, 72]], "#B5352F", 1.3);
    s += box(-56, -40, 22, 40, 0, 22, ["#C9CFD6", "#A7AFB8", "#E1E6EA"]) + box(-56, -40, 22, 40, 22, 8, RED) + lineOn(FR(0.1), [[-56, 24.5], [-34, 24.5]], CREAM, 2) + lineOn(SD(-33.9), [[-40, 24.5], [0, 24.5]], CREAM, 2);
    // テーブル（はしらと ミントの いた）
    s += cyl(6, -24, 0, 12, 2.5, CHROME[1], CHROME[0], 1.2) + cyl(6, -24, 2.5, 3, 40, CHROME[1], CHROME[0], 1.2);
    s += prism(TP(46), rr(-26, -42, 64, 36, 6), [0, 0, -4], "#A9DECF", CHROME[1]) + k.lineOn(TP(46.1), close(rr(-24, -40, 60, 32, 5)), "#E4F6F0", 1.1);
    // うえの もの
    s += cyl(-14, -32, 46, 3.4, 13, "#D93A31", "#E8574C", 1.1) + cyl(-14, -32, 59, 2.2, 3, "#FFFFFF", "#F1F1F1", 1) + rod([[-14, -32, 62], [-14, -32, 65]], "#D93A31", 1.4);
    s += cyl(-6, -34, 46, 3.4, 12, "#F2C433", "#F8D85E", 1.1) + cyl(-6, -34, 58, 2.2, 3, "#D93A31", "#E8574C", 1) + rod([[-6, -34, 61], [-6, -34, 64]], "#F2C433", 1.4);
    s += box(4, -38, 10, 6, 46, 9, CHROME) + box(5, -37.6, 8, 5, 55, 3, ["#FFFFFF", "#ECECEC", "#FFFFFF"], 1);
    s += frustum(24, -26, 46, 4.2, 62, 6.4, "#F7C6D6", "#FFFFFF", 1.2) + dome(24, -26, 62, 6.4, 6.4, 5, "#FFFFFF", 1.1) + ball(24, -26, 69, 1.8, "#E0453D", 0.9, 0.6) + rod([[26, -27, 64], [29, -29, 76]], "#F28FA6", 1.2);
    s += cyl(-12, -16, 46, 9, 1.4, "#FFFFFF", "#FFFFFF", 1) + cyl(-12, -16, 47.4, 6, 2.4, "#C98A4E", "#E3A86A", 1) + cyl(-12, -16, 49.8, 6.4, 1.6, "#6E412A", "#875236", 1) + dome(-12, -16, 51.4, 6, 6, 4, "#E3A86A", 1.1);
    return s;
  };
  // カウンターの うえの シェイクの マシン（live の とき カップを FurnLive が ゆらす）
  const MIXER = { x: -48, y: -30, z: 60 };
  M.shop_burger_30 = (k) => {
    // ネオンの バーガー カウンター: うしろの かべに ネオンの バーガーと ほし・カップの たな。ミントの カウンター（クロームの おび）・シェイクの マシン・ガラスの ドーム・レジ・まえに まるい いす
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, lg } = k;
    const MINT = ["#9FD9C6", "#7DBBA7", "#C2EADC"], WALL = ["#3B3655", "#2C2842", "#4C4668"];
    let s = shadow(0.12, 2, 6);
    // うしろの かべ（よるの いろ）と たな
    s += box(-76, -66, 152, 10, 0, 136, WALL);
    s += box(-70, -56, 40, 8, 76, 3, ["#C9CFD6", "#A7AFB8", "#E1E6EA"]) + box(30, -56, 40, 8, 76, 3, ["#C9CFD6", "#A7AFB8", "#E1E6EA"]);
    for (const [x, c] of [[-64, "#F7C6D6"], [-54, "#FFFFFF"], [-44, "#BFE3EE"], [36, "#FFF1B8"], [46, "#F7C6D6"], [56, "#FFFFFF"]]) s += frustum(x, -52, 79, 3, 88, 4.2, c, shade(c, 0.1), 1.1);
    // ネオン（live の ときは FurnLive が ひかりを かさねる）
    const neon = (col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
    const sign = (glowOn) => `<path d="M6,26 Q6,8 28,8 Q50,8 50,26 Z" ${neon(glowOn ? "#FFB3D1" : "#E77FA9", 3.2)}/><path d="M4,32 Q16,28 28,32 Q40,36 52,32" ${neon(glowOn ? "#B9F3A6" : "#8BCB78", 3)}/><path d="M6,40 H50" ${neon(glowOn ? "#FFE58A" : "#E0B84C", 3.2)}/><path d="M7,46 Q28,54 49,46" ${neon(glowOn ? "#FFB3D1" : "#E77FA9", 3.2)}/>` +
      `<path d="${starPath(-8, 12, 6, 2.6)}" ${neon(glowOn ? "#FFF3A8" : "#E6C65C", 2)}/><path d="${starPath(64, 40, 5, 2.2)}" ${neon(glowOn ? "#B7E8FF" : "#7FC1DE", 2)}/>`;
    s += onP(FR(-55.9), -28, 128, 56, 56, sign(false));
    // カウンター
    s += box(-76, -42, 152, 34, 0, 54, MINT);
    for (const z of [8, 46]) s += lineOn(FR(-7.9), [[-76, z], [76, z]], CHROME[2], 3.4) + lineOn(SD(76.1), [[-42, z], [-8, z]], CHROME[1], 3);
    for (let x = -64; x < 76; x += 16) s += shape(FR(-7.85), rr(x, 16, 10, 24, 3), "#B5E5D6", 1.1);
    s += prism(TP(58), rr(-78, -44, 156, 38, 3), [0, 0, -4], "#FFF6F1", "#E7D7D0");
    // シェイクの マシン
    s += box(MIXER.x - 9, MIXER.y - 7, 18, 14, 58, 6, CHROME) + box(MIXER.x - 4, MIXER.y - 6, 8, 8, 64, 30, CHROME) + box(MIXER.x - 10, MIXER.y - 7, 20, 14, 94, 8, ["#F28FA6", "#D9708A", "#F7B4C4"]);
    for (const dx of [-6, 0, 6]) s += rod([[MIXER.x + dx, MIXER.y + 4, 94], [MIXER.x + dx, MIXER.y + 4, 80]], CHROME[1], 1.2);
    s += L([-6, 0, 6].map((dx, i) => frustum(MIXER.x + dx, MIXER.y + 4, 64, 2.6, 78, 3.4, ["#F7C6D6", "#FFF1B8", "#BFE3EE"][i], "#FFFFFF", 1)).join(""));
    // ガラスの ドーム（なかに バーガー）
    s += cyl(-6, -26, 58, 16, 2, CHROME[1], CHROME[0], 1.1);
    s += cyl(-6, -26, 60, 7, 2.4, "#C98A4E", "#E3A86A", 1) + cyl(-6, -26, 62.4, 7.6, 2, "#6E412A", "#875236", 1) + k.prism(TP(64.6), wavy(-6, -26, 8.4, 0.8, 9), [0, 0, -0.8], "#A4D884", "#7FBC62", 0.9) + dome(-6, -26, 64.6, 7.2, 7.2, 5.4, "#E3A86A", 1.1);
    s += dome(-6, -26, 60, 15, 15, 24, "#DDF4FB", 1.3, 'fill-opacity=".38"') + ball(-6, -26, 85.5, 2, CHROME[0], 1, 0.6);
    s += lineOn(FR(-14), [[-16, 70], [-14, 78]], "#FFFFFF", 2, 'stroke-opacity=".9"');
    // レジ
    s += box(28, -36, 30, 22, 58, 16, ["#F28FA6", "#D9708A", "#F7B4C4"]) + slabTop(k, 30, -34, 74, 26, 10);
    s += box(30, -18, 26, 3, 61, 8, ["#FFF6E0", "#E9DCC0", "#FFFFFF"], 1);
    for (let i = 0; i < 4; i++) s += k.shape(TP(74.2), rr(32 + i * 6, -28, 4.4, 4, 1), i % 2 ? "#FFFFFF" : "#FFE8A0", 0.8);
    // まるい いす（クロームの あし・あかい ざぶとん）
    for (const x of [-40, 0, 40]) s += cyl(x, -2, 0, 9, 2, CHROME[1], CHROME[0], 1.1) + cyl(x, -2, 2, 2.4, 26, CHROME[1], CHROME[0], 1.1) + cyl(x, -2, 28, 10, 5, "#C9382F", "#E5574C", 1.3) + k.lineOn(TP(33.1), close(ov(x, -2, 7, 7, 20)), "#F48A80", 1, 'stroke-dasharray="1.6 1.6"');
    return s;
  };
  // レジの うえの ななめの いた
  function slabTop(k, x, y, z, w, d) { const { m, s } = k.slab([x, y + d, z], [1, 0, 0], [0, -0.7, 0.7], rr(0, 0, w, d, 2), 2, "#FFFDF4", "#E0D6C2", 1.1); return s + k.shape(m, rr(3, 2, w - 6, d - 5, 1.5), "#9ED0C0", 0.9); }

  // ================= びようしつ =================
  M.shop_groom_5 = (k) => {
    // くるくる サインポール: クロームの だい・ガラスの つつに あか・あお・しろの しま（live は FurnLive が まわす）・うえの まるい かざり
    const { cyl, dome, ball, shadow, L, lineOn, TP } = k, cx = 0, cy = -16, r = 10.5;
    let s = shadow(0.13, 4, 14) + cyl(cx, cy, 0, 13, 4, CHROME[1], CHROME[0]) + cyl(cx, cy, 4, 12, 12, CHROME[1], CHROME[0]);
    s += lineOn(TP(10), close(ov(cx, cy, 12.1, 12.1, 28)), "#FFFFFF", 1, 'stroke-opacity=".7"');
    s += cyl(cx, cy, 16, r, 72, "#FFFFFF", "#FFFFFF", 1.4);
    s += L(poleStripes(k, cx, cy, r, 16, 88, 0));
    s += cyl(cx, cy, 16, r, 72, "#DDF4FB", "none", 1.4, 28).replace(/fill="#DDF4FB"/, 'fill="#DDF4FB" fill-opacity=".22"');
    s += cyl(cx, cy, 88, 12, 7, CHROME[1], CHROME[0]) + dome(cx, cy, 95, 12, 12, 6, CHROME[0]) + ball(cx, cy, 103.5, 3.2, GOLD, 1.1, 0.6);
    return s;
  };
  const poleStripes = (k, cx, cy, r, z0, z1, off) => {
    let s = "";
    for (let i = -3; i < 9; i++) s += band(k, cx, cy, r, z0, z1, z0 + i * 12 + off, 5, -7.5, i % 2 ? "#3F6FC9" : "#E0473F");
    return s;
  };
  M.shop_groom_10 = (k) => {
    // ねこみみ ドライヤー チェア: ピンクの ひじかけいす・うしろの クロームの ぼう・ねこみみの フード（なかは くらい）
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, egg, dome, ball, rod, at, onP, shadow, slab } = k;
    const PK = ["#F2B7C6", "#D995A8", "#F8D0DA"], PKD = "#D88AA0";
    let s = shadow(0.12, 4, 12);
    // うしろの ぼうと うで
    s += cyl(0, -56, 0, 10, 3, CHROME[1], CHROME[0], 1.2) + rod([[0, -56, 3], [0, -56, 98]], CHROME[1], 2.6) + rod([[0, -56, 98], [0, -40, 100]], CHROME[1], 2.4);
    // いす
    s += box(-28, -50, 56, 44, 0, 6, ["#C9CFD6", "#A7AFB8", "#E1E6EA"]);
    s += box(-26, -50, 52, 10, 26, 34, PK) + box(-26, -48, 52, 44, 6, 22, PK);
    s += prism(TP(32), rr(-20, -42, 40, 36, 8), [0, 0, -6], "#FFE3EA", PK[1]);
    for (const x of [-30, 18]) s += box(x, -48, 12, 44, 6, 32, PK) + prism(TP(40), rr(x, -48, 12, 44, 5), [0, 0, -3], PK[2], PK[1]);
    for (let x = -18; x <= 18; x += 9) s += lineOn(FR(-39.9), [[x, 32], [x, 58]], PKD, 1.1);
    // フード（ねこみみ・まえの くらい くち・ボタン）
    s += egg(0, -34, 96, 22, 20, 17, k.rg([[0, "#FFFFFF"], [0.6, "#EBDDF3"], [1, "#C9B5DE"]], 0.35, 0.3, 0.85), 1.5);
    for (const sx of [-1, 1]) { const { s: ear } = slab([sx * 13 - 6, -38, 108], [1, 0, 0], [0, -0.2, 1], [[0, 0], [12, 0], [6, 12]], 3, "#EBDDF3", "#C9B5DE", 1.3); s += ear; }
    s += shape(FR(-18.5), ov(0, 88, 15, 9.5, 28), "#5A4D66", 1.3) + shape(FR(-18.4), ov(0, 89.6, 11, 6.4, 24), "#7A6C88", 0);
    s += at(18, -26, 96, `<circle r="3" fill="${GOLD}" ${S(1)}/>`, 4, 4) + at(-4, -16, 108, `<path d="M-4,0 q4,-3 8,0" fill="none" ${S(1.1)}/>`, 5, 3);
    return s;
  };
  // かがみの まわりの まるい ライト（live の とき FurnLive が ひからせる）
  const BULBS = [];
  for (let i = 0; i < 6; i++) BULBS.push([-44 + i * 17.6, 124]);
  for (let i = 1; i < 4; i++) BULBS.push([-46, 124 - i * 13], [46, 124 - i * 13]);
  M.shop_groom_15 = (k) => {
    // ライトつきの かがみだい: ラベンダーの ひきだし・しろい てんばん・まるい ライトの かがみ・くし・はさみ・スプレー・ブラシ・あおい えきの びん
    const { box, prism, shape, FR, TP, lineOn, cyl, frustum, dome, ball, rod, at, onP, shadow, lg } = k;
    const LAV = ["#CDB8E6", "#AE97CC", "#DDCDF0"];
    let s = shadow(0.12, 2, 6);
    s += box(-54, -48, 108, 6, 64, 64, ["#F4EEF9", "#D9CFE6", "#FFFFFF"]);
    s += shape(FR(-41.9), rr(-46, 72, 92, 52, 6), lg([[0, "#EAF8FC"], [1, "#B9E1EC"]]), 1.4) + lineOn(FR(-41.8), [[-30, 116], [-12, 84]], "#FFFFFF", 3, 'stroke-opacity=".8"') + lineOn(FR(-41.8), [[-18, 118], [-4, 96]], "#FFFFFF", 1.8, 'stroke-opacity=".6"');
    for (const [x, z] of BULBS) s += shape(FR(-41.7), ov(x, z, 3.6, 3.6, 14), "#FFF3C4", 1.1);
    s += box(-58, -42, 116, 36, 0, 60, LAV);
    for (const [x, wd] of [[-54, 34], [-17, 34], [20, 34]]) for (const z of [8, 32]) s += shape(FR(-5.9), rr(x, z, wd, 18, 2.5), "#E3D6F3", 1.2) + ball(x + wd / 2, -5.6, z + 9, 1.4, GOLD, 0.9, 0);
    s += prism(TP(64), rr(-60, -44, 120, 40, 3), [0, 0, -4], "#FFFFFF", "#E1D9EA");
    s += cyl(-40, -26, 64, 5.4, 16, "#7FC4E3", "#A9DBF0", 1.2) + cyl(-40, -26, 80, 5.8, 2.4, "#FFFFFF", "#F2F2F2", 1);
    for (const dx of [-2.4, 0, 2.4]) s += rod([[-40 + dx, -26, 72], [-40 + dx * 1.6, -26, 88]], ["#F2A7B8", "#FFFFFF", "#F7D56A"][Math.round(dx / 2.4) + 1], 1.2);
    s += cyl(-22, -18, 64, 3.4, 14, "#F2A7B8", "#F8C6D2", 1.1) + cyl(-22, -18, 78, 1.6, 4, "#FFFFFF", "#FFFFFF", 1) + rod([[-22, -18, 82], [-18, -18, 83]], "#FFFFFF", 1.2);
    s += at(4, -16, 64.2, `<path d="M-10,0 H10 V-3 H-10 Z" fill="#F7D56A" ${S(1)}/>${Array.from({ length: 9 }, (_, i) => `<path d="M${-9 + i * 2.2},-3 V-7" ${S(0.8)}/>`).join("")}`, 12, 9);
    s += at(24, -22, 64.2, `<circle cx="-4" cy="-2.6" r="2.6" fill="none" ${S(1.2)}/><circle cx="4" cy="-2.6" r="2.6" fill="none" ${S(1.2)}/><path d="M-2,-4.4 L8,-14 M2,-4.4 L-8,-14" ${S(1.3)}/><path d="M-2,-4.4 L8,-14 M2,-4.4 L-8,-14" stroke="#D5DCE2" stroke-width=".6"/>`, 10, 16);
    s += at(40, -24, 64.2, SPR.brush(), 12, 8);
    return s;
  };
  M.shop_groom_30 = (k) => {
    // チョキさんの ゆめの サロン: きんの わくの まるい かがみ・ふかふかの チェア（あしの ペダル・クロームの だい）・どうぐの ワゴン・はちうえ
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, lg, slab } = k;
    const PLUM = ["#B784C6", "#9466A6", "#CFA6DC"];
    let s = shadow(0.12, 3, 10);
    // かがみ（うしろ）
    for (const x of [-26, 26]) s += rod([[x, -87, 0], [x * 0.9, -87, 50]], GOLDD, 2.6) + k.egg(x, -87, 1.6, 5, 4, 2, GOLD, 1.1);
    s += k.prism(FR(-84), ov(0, 92, 34, 54, 48), [0, -5, 0], GOLD, GOLDD) + shape(FR(-83.9), ov(0, 92, 30, 50, 44), lg([[0, "#EEF9FC"], [1, "#BDE2EC"]]), 1.2);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; s += shape(FR(-83.85), ov(Math.cos(a) * 32, 92 + Math.sin(a) * 52, 2.2, 2.2, 10), "#FFF3C4", 0.9); }
    s += onP(FR(-83.8), -10, 156, 20, 14, `<path d="M10,14 L2,4 L6,6 L10,0 L14,6 L18,4 Z" fill="${GOLD}" ${S(1)}/><circle cx="10" cy="0" r="2" fill="#F2A7B8" ${S(0.8)}/>`);
    s += lineOn(FR(-83.7), [[-16, 120], [-4, 98]], "#FFFFFF", 3, 'stroke-opacity=".8"');
    // はちうえ（ひだり）
    s += cyl(-62, -70, 0, 9, 16, "#E48A6E", "#EFA58C", 1.2) + at(-62, -70, 16, `<g transform="scale(1.9)">${SPR.monstera()}</g>`, 30, 50);
    // チェア
    s += cyl(0, -40, 0, 18, 3, CHROME[1], CHROME[0], 1.3) + cyl(0, -40, 3, 5.4, 22, CHROME[1], CHROME[0], 1.3);
    s += rod([[0, -24, 8], [0, -14, 6], [6, -10, 6]], CHROME[1], 2.4) + box(-12, -14, 24, 8, 4, 3, CHROME, 1.1);
    s += box(-22, -62, 44, 12, 34, 56, PLUM) + dome(0, -56, 90, 22, 6, 8, PLUM[2], 1.3) + prism(FR(-49.9), rr(-14, 50, 28, 36, 8), [0, -2, 0], "#E8D3F0", PLUM[1]);
    s += box(-24, -50, 48, 32, 25, 12, PLUM) + prism(TP(39), rr(-20, -48, 40, 28, 7), [0, 0, -3], "#E8D3F0", PLUM[1]);
    for (const x of [-28, 20]) s += box(x, -52, 8, 34, 37, 14, PLUM) + rod([[x + 4, -20, 37], [x + 4, -20, 51]], GOLD, 1.6);
    s += egg(0, -60, 98, 10, 4, 5, "#F8E7F2", 1.2);
    // ワゴン（みぎ）
    s += cyl(52, -28, 0, 3, 4, "#555", "#777", 1) + box(42, -36, 24, 18, 4, 4, CHROME) + rod([[44, -34, 8], [44, -34, 56]], CHROME[1], 1.6) + rod([[64, -20, 8], [64, -20, 56]], CHROME[1], 1.6);
    s += box(42, -36, 24, 18, 30, 3, ["#FFFFFF", "#E5E5E5", "#FFFFFF"], 1.1) + box(42, -36, 24, 18, 56, 3, ["#FFFFFF", "#E5E5E5", "#FFFFFF"], 1.1);
    s += at(52, -26, 59, `<circle cx="-4" cy="-2.6" r="2.6" fill="none" ${S(1.2)}/><circle cx="4" cy="-2.6" r="2.6" fill="none" ${S(1.2)}/><path d="M-2,-4.4 L8,-14 M2,-4.4 L-8,-14" ${S(1.3)}/>`, 10, 16) + cyl(60, -24, 59, 2.6, 10, "#F2A7B8", "#F8C6D2", 1) + at(48, -22, 33, SPR.brush(), 12, 8) + cyl(58, -26, 33, 3, 8, "#7FC4E3", "#A9DBF0", 1);
    return s;
  };

  // ================= ケーキやさん =================
  M.shop_cake_5 = (k) => {
    // マカロンの クッション: ミントの マカロンの うえに ピンクの マカロン（ふちの ギザギザ・まんなかの クリーム）
    const { cyl, dome, prism, TP, shadow, rg, lineOn } = k, cy = -24;
    const mac = (x, y, z, r, c) => {
      let s = cyl(x, y, z, r * 0.94, 4, shade(c, -0.12), c) + prism(TP(z + 6), wavy(x, y, r, 0.9, 16), [0, 0, -2], shade(c, 0.12), shade(c, -0.1), 1.1);
      s += cyl(x, y, z + 6, r * 0.86, 4.4, "#FFF8EC", "#FFFFFF", 1.2) + prism(TP(z + 12.4), wavy(x, y, r, 0.9, 16), [0, 0, -2], shade(c, 0.12), shade(c, -0.1), 1.1);
      s += dome(x, y, z + 12.4, r * 0.96, r * 0.96, 6.5, rg([[0, shade(c, 0.3)], [1, shade(c, -0.08)]], 0.35, 0.3, 0.8), 1.4);
      return s;
    };
    let s = shadow(0.13, 4, 20) + mac(0, cy, 0, 22, "#9ED9C3") + mac(1.5, cy + 1, 19, 18.5, "#F4A9BE");
    s += lineOn(TP(38.6), [[-6, cy - 4], [-1, cy - 7]], "#FFFFFF", 1.6, 'stroke-opacity=".8"');
    return s;
  };
  M.shop_cake_10 = (k) => {
    // カップケーキの ランプ: ひだの ある ピンクの カップ・スポンジ・クリームの かさ（3だん の うずまき）・つぶつぶ・さくらんぼ（ひかる）
    const { frustum, dome, cyl, lathe, ball, at, rod, shadow, rg, line, eggAt, L } = k, cy = -23;
    let s = shadow(0.13, 5, 18) + frustum(0, cy, 0, 15, 32, 20.5, "#F2A7BC", "#E58FA8", 1.5);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 4 - 1.25 + i * 0.31; s += line([[Math.cos(a) * 15, cy + Math.sin(a) * 15, 1], [Math.cos(a) * 20.4, cy + Math.sin(a) * 20.4, 31.5]], "#D9839B", 1.2); }
    s += dome(0, cy, 32, 20.5, 20.5, 6, "#C98A52", 1.3);
    const cream = rg([[0, "#FFFFFF"], [0.7, "#FFF2E4"], [1, "#F2D8C4"]], 0.4, 0.3, 0.8);
    s += lathe(0, cy, [[22, 36], [22.6, 40], [21, 44], [17, 46]], cream, 1.4);
    s += lathe(0, cy, [[17.5, 46], [18, 50], [16, 54], [12, 56]], cream, 1.4);
    s += lathe(0, cy, [[12.5, 56], [13, 60], [10, 64], [4, 70]], cream, 1.4);
    for (const [a, b, c] of [[0.1, 0.25, "#F7D56A"], [0.9, 0.2, "#9CC7E6"], [1.7, 0.3, "#F2A7B8"], [-0.5, 0.35, "#A9D6C2"], [0.5, 0.6, "#C9B6E0"], [1.3, 0.55, "#F7D56A"], [2.2, 0.4, "#9CC7E6"]]) {
      const p = eggAt(0, cy, 40, 21, 21, 26, a, b); s += at(p[0], p[1], p[2], `<rect x="-2" y="-0.8" width="4" height="1.6" rx=".8" transform="rotate(${a * 40})" fill="${c}" stroke="${INK}" stroke-width=".5"/>`, 3, 2);
    }
    s += ball(0, cy, 76, 6, "#E0453D", 1.3, 0.6) + rod([[0, cy, 82], [3, cy - 1, 90]], "#7A5634", 1.4);
    return s;
  };
  // ショーケースの ケーキ（[x, y, だん, しゅるい]）
  const CASE_CAKES = [[-40, -30, 0, "short"], [-16, -30, 0, "choco"], [10, -30, 0, "roll"], [34, -30, 0, "tart"], [-40, -30, 1, "tart"], [-14, -30, 1, "macaron"], [12, -30, 1, "short"], [36, -30, 1, "choco"]];
  M.shop_cake_15 = (k) => {
    // ケーキの ショーケース: しろと ピンクの だい・ななめの ガラス・2だんの たなに ショートケーキ・チョコ・ロール・タルト・マカロンの とう
    const { box, prism, poly, shape, FR, SD, TP, lineOn, cyl, frustum, dome, ball, at, shadow, L } = k;
    const PK = ["#F7C6D6", "#E2A7BB", "#FBDDE6"];
    let s = shadow(0.12, 2, 6);
    s += box(-58, -54, 116, 46, 0, 44, ["#FFFFFF", "#E9E3E0", "#FFFFFF"]) + k.shape(FR(-7.9), rr(-54, 6, 108, 30, 4), PK[0], 1.3);
    for (let x = -50; x < 54; x += 14) s += k.lineOn(FR(-7.85), [[x, 10], [x, 32]], PK[2], 2.2);
    s += box(-58, -54, 116, 4, 44, 52, ["#FFF6F8", "#E8D6DC", "#FFFFFF"]);
    // たなと ケーキ
    for (const lv of [0, 1]) {
      const z = 46 + lv * 26;
      s += box(-56, -50, 112, 28, z, 2, ["#FFFFFF", "#E0E0E0", "#FFFFFF"], 1.1);
      for (const [x, y, l, kind] of CASE_CAKES) if (l === lv) s += caseCake(k, x, y + 14, z + 2, kind);
    }
    // ガラス（まえは ななめ）と ひかり
    s += poly([[-58, -8, 44], [58, -8, 44], [58, -24, 96], [-58, -24, 96]], "#DDF4FB", 1.4, 'fill-opacity=".3"');
    s += poly([[58, -54, 44], [58, -8, 44], [58, -24, 96], [58, -54, 96]], "#CDEBF3", 1.4, 'fill-opacity=".28"');
    s += k.line([[-46, -10, 50], [-38, -20, 88]], "#FFFFFF", 2.4, 'stroke-opacity=".8"') + k.line([[-36, -10, 50], [-32, -16, 68]], "#FFFFFF", 1.4, 'stroke-opacity=".7"');
    s += box(-60, -56, 120, 34, 96, 5, PK) + shape(FR(-21.9), [[-60, 101], [60, 101], ...scallop(-60, 60, 96, 3.4)], PK[0], 1.2);
    return s;
  };
  function caseCake(k, x, y, z, kind) {
    const { box, cyl, dome, ball, at, prism, TP } = k;
    if (kind === "short") return box(x - 7, y - 5, 14, 9, z, 9, ["#FFF8EE", "#EADFCF", "#FFFFFF"], 1) + k.lineOn(k.FR(y + 4.1), [[x - 7, z + 4.5], [x + 7, z + 4.5]], "#E0453D", 1.2) + ball(x, y - 0.5, z + 11, 2.2, "#E0453D", 0.9, 0.6);
    if (kind === "choco") return box(x - 7, y - 5, 14, 9, z, 9, ["#8B5A3C", "#6E4430", "#A9744F"], 1) + k.lineOn(k.FR(y + 4.1), [[x - 7, z + 3], [x + 7, z + 3], [x + 7, z + 6], [x - 7, z + 6]], "#C99A6B", 1) + ball(x + 2, y - 1, z + 10.5, 1.6, "#F7D56A", 0.8, 0.5);
    if (kind === "roll") return k.prism(k.SD(x + 7), ov(y - 0.5, z + 5, 4.6, 5, 18), [-14, 0, 0], "#FFF1D6", "#F2C98A", 1.1) + k.shape(k.SD(x + 7.1), ov(y - 0.5, z + 5, 2.4, 2.6, 14), "#FFFFFF", 0.8);
    if (kind === "tart") return cyl(x, y, z, 6.8, 3.4, "#D9A35E", "#E9C07C", 1) + ball(x - 2.6, y, z + 4.8, 1.8, "#E0453D", 0.8, 0.5) + ball(x + 2.6, y + 0.8, z + 4.8, 1.8, "#7FB06A", 0.8, 0.5) + ball(x, y - 2.4, z + 4.8, 1.8, "#9B6FC9", 0.8, 0.5);
    return [0, 1, 2, 3].map((i) => cyl(x, y, z + i * 3.4, 5.6 - i * 1.1, 2.8, ["#F4A9BE", "#9ED9C3", "#F7D56A", "#C9B6E0"][i], shade(["#F4A9BE", "#9ED9C3", "#F7D56A", "#C9B6E0"][i], 0.15), 0.9)).join("");
  }
  M.shop_cake_30 = (k) => {
    // ショートケーキの ベッド: スポンジ と クリーム と いちごジャムの そう・クリームの ふち・いちごの まくら・ピンクの ふとん（しろい みずたま）・うしろは ケーキの かべ（クリームと いちご）
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, dome, egg, ball, at, shadow, lg, eggAt } = k;
    const SPONGE = ["#F6D58A", "#E3BC6C", "#FBE4A8"], CREAM = ["#FFFDF6", "#EFE6D6", "#FFFFFF"];
    let s = shadow(0.12, 2, 10);
    // うしろの ケーキの かべ（あたまの いた）
    s += box(-68, -98, 136, 14, 0, 70, SPONGE);
    for (const z of [22, 46]) s += shape(FR(-83.9), rect(-68, z, 136, 5), "#FFFDF6", 1.1) + shape(FR(-83.85), rect(-68, z + 1.6, 136, 1.8), "#E0453D", 0) + shape(SD(68.1), rect(-98, z, 14, 5), "#F2EAD9", 1.1);
    s += box(-68, -98, 136, 14, 70, 6, CREAM);
    for (let x = -60; x <= 60; x += 15) s += dome(x, -91, 76, 6, 6, 6, "#FFFFFF", 1.2) + ball(x, -91, 86, 4, "#E0453D", 1.1, 0.6) + at(x, -91, 89.6, `<path d="M-3,0 L0,-3 L3,0 L0,-1 Z" fill="#7FB06A" ${S(0.8)}/>`, 4, 4);
    // ベッドの だい（スポンジの そう）
    s += box(-68, -84, 136, 82, 0, 30, SPONGE);
    for (const z of [9, 20]) s += shape(FR(-1.9), rect(-68, z, 136, 4.6), "#FFFDF6", 1.1) + shape(FR(-1.85), rect(-68, z + 1.5, 136, 1.6), "#E0453D", 0) + shape(SD(68.1), rect(-84, z, 82, 4.6), "#F2EAD9", 1.1);
    s += box(-66, -82, 132, 78, 30, 8, CREAM);
    // ふち の クリーム
    for (let x = -62; x <= 62; x += 8.6) s += dome(x, -4, 38, 4.2, 4.2, 3.6, "#FFFFFF", 1);
    for (let y = -78; y <= -8; y += 8.6) s += dome(64, y, 38, 4.2, 4.2, 3.6, "#FFFFFF", 1);
    // まくら（いちご）と ふとん
    for (const x of [-48, -24]) {
      s += egg(x, -70, 44, 11, 9, 6.5, lg([[0, "#F4675C"], [1, "#D9473F"]]), 1.3);
      for (const [a, b] of [[0.3, 0.3], [0.9, 0.5], [1.5, 0.25], [-0.3, 0.45], [0.6, 0.8]]) { const p = eggAt(x, -70, 44, 11, 9, 6.5, a, b); s += at(p[0], p[1], p[2], `<ellipse rx=".9" ry=".6" fill="#FFF3B0"/>`, 1, 1); }
      s += at(x, -76, 50, `<path d="M-6,0 Q-3,-4 0,-1 Q3,-4 6,0 Q3,-1 0,1 Q-3,-1 -6,0 Z" fill="#7FB06A" ${S(0.9)}/>`, 7, 5);
    }
    s += prism(TP(44), rr(-14, -80, 76, 76, 6), [0, 0, -5], "#F7B9C9", "#E295AA");
    for (let x = -6; x < 60; x += 12) for (let y = -72; y < -8; y += 12) s += shape(TP(44.1), ov(x + ((y / 12) % 2 ? 6 : 0), y, 2.6, 2.6, 12), "#FFFFFF", 0);
    s += shape(FR(-4), [[-14, 44], [62, 44], ...scallop(-14, 62, 36, 3)], "#F7B9C9", 1.3);
    return s;
  };

  // ================= クレープやさん =================
  M.shop_crepe_5 = (k) => {
    // クレープの メニュー ボード: きの わくの こくばん（Aの かたち）・チョークの クレープ・いちご・ハート・ほし
    const { poly, shape, onP, tilt, lineOn, rod, shadow, slab } = k;
    let s = shadow(0.12, 4, 8);
    // うしろの いた（すこし 見える）
    s += poly([[-20, -30, 0], [20, -30, 0], [20, -18, 76], [-20, -18, 76]], "#8C6848", 1.4);
    const { m, s: board } = slab([-22, -2, 0], [1, 0, 0], [0, -0.155, 1], rect(0, 0, 44, 77), 2.4, "#B08457", "#8C6848", 1.5);
    s += board + shape(m, rect(4, 6, 36, 62), "#3E5A4C", 1.2);
    s += k.onP(m, 4, 68, 36, 62, `<path d="M18,10 L10,30 L26,30 Z" fill="none" stroke="#FFF3D9" stroke-width="1.4" stroke-linejoin="round"/><path d="M10,30 Q12,24 18,24 Q24,24 26,30" fill="none" stroke="#F7B9C9" stroke-width="1.4"/><circle cx="14" cy="24" r="2" fill="none" stroke="#F28B8B" stroke-width="1.2"/><circle cx="21" cy="23" r="2" fill="none" stroke="#F28B8B" stroke-width="1.2"/>` +
      `<path d="M6,44 H30 M6,50 H24 M6,56 H28" stroke="#FFF3D9" stroke-width="1.3" stroke-dasharray="2.4 1.6"/><path d="${heartPath(30, 40, 0.42)}" fill="none" stroke="#F7B9C9" stroke-width="1.2"/><path d="${starPath(30, 8, 3.4, 1.4)}" fill="none" stroke="#FFE58A" stroke-width="1"/><path d="${starPath(6, 12, 2.6, 1.1)}" fill="none" stroke="#FFE58A" stroke-width="1"/>`);
    s += rod([[-21, -1, 2], [-21, -4, 18]], "#8C6848", 1.6) + rod([[21, -1, 2], [21, -4, 18]], "#8C6848", 1.6);
    return s;
  };
  M.shop_crepe_10 = (k) => {
    // いちごの パラソル テーブル: まるい しろい テーブル・まんなかの ぼう・いちごの かさ（あかに しろい つぶ・みどりの へた）・テーブルの うえの クレープと カップ
    const { cyl, frustum, dome, lathe, ball, rod, at, shadow, eggAt, shape, TP, prism, lineOn } = k, cy = -45;
    let s = shadow(0.1, 6, 40) + cyl(0, cy, 0, 14, 3, "#E9E3DA", "#FFFFFF", 1.3) + cyl(0, cy, 3, 3, 46, "#E9E3DA", "#FFFFFF", 1.2);
    s += prism(TP(52), ov(0, cy, 30, 30, 40), [0, 0, -4], "#FFFFFF", "#E5DED3", 1.4) + lineOn(TP(52.1), close(ov(0, cy, 26, 26, 40)), "#F2B7C6", 1.2, 'stroke-dasharray="2 2"');
    s += cyl(14, cy + 10, 52, 3.6, 7, "#9CC7E6", "#C7E3F2", 1.1) + at(-12, cy + 8, 52.2, `<path d="M0,0 L-5,-12 L5,-12 Z" fill="#EED8A5" ${S(1)}/><path d="M-5,-12 Q-5,-17 0,-16 Q5,-17 5,-12 Z" fill="#FFFFFF" ${S(1)}/><circle cx="-1.6" cy="-15.6" r="2" fill="#E0453D" ${S(.8)}/>`, 7, 18);
    s += rod([[0, cy, 52], [0, cy, 104]], "#E9E3DA", 2.4);
    // かさ（しろと ピンクに いちごの もよう・あかい なみの ふち・てっぺんに いちご）
    s += lathe(0, cy, [[44, 92], [40, 99], [31, 106], [19, 112], [8, 116], [2, 117]], k.rg([[0, "#FFFFFF"], [0.6, "#FDEFF3"], [1, "#F4C9D5"]], 0.38, 0.3, 0.85), 1.5);
    const berry = `<path d="M0,3.6 C-3.6,1 -3.4,-2.4 0,-2 C3.4,-2.4 3.6,1 0,3.6 Z" fill="#E0473F" stroke="${INK}" stroke-width=".6"/><path d="M-2,-2.2 L0,-3.6 L2,-2.2 L0,-1.4 Z" fill="#7FB06A" stroke="${INK}" stroke-width=".45"/><circle cx="-1" cy="0" r=".35" fill="#FFE27A"/><circle cx="1" cy=".6" r=".35" fill="#FFE27A"/><circle cx="0" cy="2" r=".35" fill="#FFE27A"/>`;
    for (const [r, z, n, o] of [[38, 99.5, 7, 0.15], [27, 107, 5, 0.45], [14, 113.5, 3, 0.3]]) for (let i = 0; i < n; i++) { const a = -Math.PI / 4 - 1.3 + o + (i * 2.6) / (n - 1); s += at(Math.cos(a) * r, cy + Math.sin(a) * r, z, berry, 4, 4); }
    s += k.egg(0, cy, 121, 4.4, 4.4, 5, "#E0473F", 1.2) + shape(TP(125), star(0, cy, 5, 2.4, 6), "#7FB06A", 1) + rod([[0, cy, 125], [0, cy, 129]], "#6F9A5E", 1.4);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; if (Math.cos(a) + Math.sin(a) < -0.5) continue; s += at(Math.cos(a) * 44, cy + Math.sin(a) * 44, 92, `<path d="M-5,0 Q0,6 5,0" fill="#E0473F" ${S(1)}/>`, 6, 1); }
    return s;
  };
  M.shop_crepe_15 = (k) => {
    // クレープの やたい: きの だい（ピンクの いた）・おおきな くるま・まるい てっぱん（クレープ）・とんぼ・ボウル・トッピングの びん・しましまの やね・メニューの はた
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, ball, rod, at, onP, shadow, L, plane } = k;
    const WOOD = ["#D9B27C", "#B99060", "#E8C89A"];
    let s = shadow(0.12, 3, 8);
    for (const [x, y] of [[-60, -62], [58, -62]]) s += rod([[x, y, 0], [x, y, 122]], "#B99060", 2.4);
    s += box(-58, -58, 116, 50, 12, 52, WOOD) + shape(FR(-7.9), rr(-52, 18, 104, 38, 4), "#F7C6D6", 1.3) + shape(FR(-7.85), rr(-46, 24, 92, 26, 3), "#FBDDE6", 0);
    s += onP(FR(-7.8), -14, 46, 28, 20, `<path d="M14,20 L6,4 L22,4 Z" fill="#EED8A5" ${S(1.1)}/><path d="M6,4 Q6,-2 14,-1 Q22,-2 22,4 Z" fill="#FFFFFF" ${S(1)}/><circle cx="11" cy="0" r="2.6" fill="#E0453D" ${S(0.9)}/>`);
    for (const x of [-46, 46]) s += k.prism(SD(x + 4), ov(-8, 14, 13, 13, 28), [-6, 0, 0], "#8C6848", "#6F5238", 1.3) + shape(SD(x + 4.1), ov(-8, 14, 5, 5, 16), WOOD[0], 1) + shape(SD(x + 4.2), ov(-8, 14, 1.6, 1.6, 8), INK, 0);
    s += prism(TP(68), rr(-60, -60, 120, 54, 3), [0, 0, -4], "#E8C89A", "#B99060");
    s += cyl(-22, -34, 68, 19, 3, "#4A4550", "#5E5864", 1.3) + shape(TP(71.1), ov(-22, -34, 15, 15, 32), "#F2CF8B", 1) + k.lineOn(TP(71.2), close(ov(-22, -34, 10, 10, 24)), "#E4B56C", 1, 'stroke-dasharray="2 2"');
    s += rod([[-2, -18, 71], [8, -12, 72]], "#C99A62", 1.6) + rod([[8, -16, 72], [8, -8, 72]], "#C99A62", 2.2);
    s += frustum(22, -36, 68, 6, 76, 8.4, "#FFFFFF", "#F6EDE0", 1.2) + k.shape(TP(76.1), ov(22, -36, 6.4, 6.4, 20), "#FFF1D6", 0);
    for (const [x, c] of [[36, "#E0453D"], [44, "#F7D56A"], [52, "#8B5A3C"]]) s += cyl(x, -48, 68, 3.4, 9, c, shade(c, 0.2), 1.1) + cyl(x, -48, 77, 3.6, 2, "#FFFFFF", "#F2F2F2", 1);
    // やね
    const AWL = 30, aw = plane([-64, -64, 122], [1, 0, 0], FurnModelsNorm([0, 1, -0.5])), av = FurnModelsNorm([0, 1, -0.5]);
    for (let i = 0; i < 12; i++) s += shape(aw, rect(i * 128 / 12, 0, 128 / 12, AWL), i % 2 ? "#FFFFFF" : "#F2A7B8", 0);
    s += shape(aw, rect(0, 0, 128, AWL), "none", 1.4);
    const fr = plane([-64, -64 + AWL * av[1], 122 + AWL * av[2]], [1, 0, 0], [0, 0, 1]);
    for (let i = 0; i < 12; i++) s += shape(fr, arc(i * 128 / 12 + 128 / 24, 0, 128 / 24, 4.4, Math.PI, TAU, 8), i % 2 ? "#FFFFFF" : "#F2A7B8", 1.1);
    s += rod([[56, -6, 70], [56, -6, 104]], "#B99060", 1.4) + onP(FR(-6), 56, 104, 18, 12, `<path d="M0,0 H18 L14,6 L18,12 H0 Z" fill="#FFF3B0" ${S(1)}/><path d="${heartPath(8, 6, 0.32)}" fill="#F2A7B8"/>`);
    return s;
  };
  M.shop_crepe_30 = (k) => {
    // ゆめいろ クレープ カー: ミントと クリームの くるま・まえの まどの おみせ（しましまの ひさし・カウンター）・うんてんせき・タイヤ・やねの おおきな クレープ
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, plane, lathe } = k;
    const MINT = ["#A6DCCB", "#86BCAB", "#C6ECDE"], CR = ["#FFF6E6", "#E8DCC6", "#FFFFFF"];
    let s = shadow(0.14, 2, 16);
    const wheel = (x, y) => k.prism(SD(x), ov(y, 12, 12, 12, 24), [-8, 0, 0], "#4A4550", "#38343E", 1.4) + shape(SD(x + 0.1), ov(y, 12, 6, 6, 16), CHROME[0], 1.1) + shape(SD(x + 0.2), ov(y, 12, 2, 2, 8), CHROME[1], 0);
    s += wheel(-52, -70) + wheel(60, -70);
    s += box(-80, -80, 140, 76, 10, 40, MINT) + box(-80, -80, 140, 76, 50, 60, CR);
    s += box(60, -80, 20, 76, 10, 40, MINT) + prism(SD(80), [[-80, 10], [-4, 10], [-4, 64], [-14, 84], [-80, 84]], [-20, 0, 0], MINT[0], MINT[1], 1.5);
    s += shape(SD(80.1), [[-74, 56], [-10, 56], [-16, 78], [-74, 78]], k.lg([[0, "#DDF4FB"], [1, "#9FD3E6"]]), 1.3) + shape(SD(80.1), ov(-6, 28, 4, 3.4, 14), "#FFF3B0", 1.2);
    // まどの おみせ
    s += shape(FR(-3.9), rr(-70, 58, 104, 40, 4), "#5A4D66", 1.4) + shape(FR(-3.8), rr(-66, 62, 96, 32, 3), "#FFE9C8", 0);
    for (const [x, c] of [[-56, "#F2A7B8"], [-40, "#F7D56A"], [-24, "#9CC7E6"]]) s += at(x, -6, 64, `<path d="M0,0 L-5,-12 L5,-12 Z" fill="#EED8A5" ${S(1)}/><path d="M-5,-12 Q-5,-17 0,-16 Q5,-17 5,-12 Z" fill="${c}" ${S(1)}/>`, 7, 18);
    s += box(-72, -6, 108, 8, 56, 3, ["#F7C6D6", "#E2A7BB", "#FBDDE6"]);
    const aw = plane([-74, -4, 104], [1, 0, 0], FurnModelsNorm([0, 1, -0.45]));
    for (let i = 0; i < 9; i++) s += shape(aw, rect(i * 12, 0, 12, 16), i % 2 ? "#FFFFFF" : "#F2A7B8", 0);
    s += shape(aw, rect(0, 0, 108, 16), "none", 1.3);
    for (let x = -64; x < 60; x += 14) s += (ball(x, -2, 110, 2, ["#FFF3B0", "#F7C6D6", "#C6ECDE"][Math.abs(Math.round(x / 14)) % 3], 0.9, 0.6));
    // やねの クレープ
    s += box(-50, -56, 60, 30, 110, 4, CR);
    s += lathe(-20, -42, [[2, 114], [16, 146]], "#EED8A5", 1.5) + k.dome(-20, -42, 146, 17, 17, 10, "#FFFFFF", 1.4);
    for (const [dx, dy, c] of [[-6, 2, "#E0453D"], [6, -3, "#E0453D"], [0, 6, "#F7D56A"]]) s += ball(-20 + dx, -42 + dy, 156, 4, c, 1.1, 0.6);
    s += rod([[-12, -40, 152], [-6, -36, 164]], "#8B5A3C", 1.8);
    return s;
  };

  // ================= はいしゃさん =================
  M.shop_dentist_5 = (k) => {
    // はブラシの スタンド: ミントの コップ（にこにこ）・あおい はブラシ（しろい け）・はみがきこ
    const { cyl, frustum, rod, box, at, shadow, slab, shape, onP, FR, prism, TP } = k, cy = -16;
    let s = shadow(0.13, 4, 12) + frustum(0, cy, 0, 12, 30, 14.5, "#9ED9C3", "#C3EADD", 1.5) + shape(TP(30.1), ov(0, cy, 11, 11, 24), "#7FBFA9", 0);
    s += onP(FR(cy + 13), -7, 22, 14, 10, `<circle cx="4" cy="3" r="1.1" fill="${INK}"/><circle cx="10" cy="3" r="1.1" fill="${INK}"/><path d="M4,6 Q7,9 10,6" fill="none" ${S(1.1)}/><circle cx="2.4" cy="6.4" r="1.2" fill="#F2A7B8"/><circle cx="11.6" cy="6.4" r="1.2" fill="#F2A7B8"/>`);
    s += rod([[-3, cy, 26], [-8, cy, 80]], "#6FA9DE", 4.4) + box(-12, cy - 2, 9, 4, 78, 5, ["#FFFFFF", "#E5EEF4", "#FFFFFF"], 1.1);
    for (let i = 0; i < 4; i++) s += k.line([[-11 + i * 2.2, cy + 2, 83], [-11 + i * 2.2, cy + 2, 87]], "#9CC7E6", 1.4);
    s += rod([[4, cy, 26], [8, cy, 62]], "#FFFFFF", 6) + rod([[8, cy, 62], [9, cy, 68]], "#4E8FD0", 4.4) + rod([[4, cy, 40], [6, cy, 48]], "#F2A7B8", 3);
    return s;
  };
  M.shop_dentist_10 = (k) => {
    // にこにこ はの いす: かどの まるい おくば（うえに 4つの やま・したに 2ほんの ねっこ）・まんなかに ピンクの ざぶとん・まえに にっこり かお
    const { prism, shape, FR, TP, at, onP, shadow, rg, egg, dome, lineOn } = k, cy = -27;
    const WH = "#FFFFFF", SIDE = "#DCE6EC";
    let s = shadow(0.13, 4, 18);
    for (const x of [-12, 12]) s += prism(TP(14), ov(x, cy + 2, 8, 7, 20), [0, 0, -14], "#F2F6F8", SIDE, 1.4) + shape(TP(0.2), ov(x, cy + 2, 6, 5, 16), SIDE, 0);
    s += prism(TP(46), rr(-28, cy - 24, 56, 48, 16), [0, 0, -32], "#FBFDFE", SIDE, 1.6);
    for (const [x, y, r, hz] of [[-14, cy - 12, 13, 13], [14, cy - 12, 13, 13]]) s += dome(x, y, 46, r, r * 0.85, hz, rg([[0, "#FFFFFF"], [1, "#E1E9EE"]], 0.35, 0.3, 0.8), 1.4);
    for (const x of [-17, 17]) s += dome(x, cy + 11, 46, 8, 7, 6, rg([[0, "#FFFFFF"], [1, "#E1E9EE"]], 0.35, 0.3, 0.8), 1.3);
    s += egg(0, cy + 6, 47, 12, 9, 2.8, "#F7B9C9", 1.2) + lineOn(TP(49.6), close(ov(0, cy + 6, 8.4, 6, 20)), "#FBD3DF", 1, 'stroke-dasharray="1.6 1.6"');
    s += onP(FR(cy + 24.1), -14, 38, 28, 18, `<circle cx="8" cy="6" r="1.7" fill="${INK}"/><circle cx="20" cy="6" r="1.7" fill="${INK}"/><path d="M9,10.5 Q14,15.5 19,10.5" fill="none" ${S(1.4)}/><ellipse cx="4.6" cy="11" rx="2.8" ry="1.7" fill="#F7B9C9"/><ellipse cx="23.4" cy="11" rx="2.8" ry="1.7" fill="#F7B9C9"/>`);
    s += lineOn(FR(cy + 24.1), [[-22, 40], [-18, 32]], "#FFFFFF", 2.4) + at(22, cy + 18, 54, `<path d="${starPath(0, -4, 4, 1.6)}" fill="#FFF3B0" ${S(0.8)}/>`, 5, 8);
    return s;
  };
  const CUPS = [[-34, "#FFFFFF", "#3F3F48"], [-22, "#F7D56A", "#F29A5B"], [-10, "#C9C9D2", "#7C7C88"]];
  M.shop_dentist_15 = (k) => {
    // 3にんの せんめんだい: ミントの たな（とびら）・しろい ボウル・じゃぐち・まるい かがみ・3にんの いろの コップと はブラシ・せっけん
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, ball, rod, at, shadow, lg, L } = k;
    const MINT = ["#B6E2D3", "#93C4B3", "#D2F0E6"];
    let s = shadow(0.12, 2, 6);
    s += box(-50, -50, 100, 6, 70, 40, ["#F4FBF8", "#D9E8E2", "#FFFFFF"]) + k.prism(FR(-43.9), ov(0, 96, 18, 16, 36), [0, -2, 0], "#FFFFFF", "#E0E8E4") + shape(FR(-43.8), ov(0, 96, 15, 13, 32), lg([[0, "#EAF8FC"], [1, "#B9E1EC"]]), 1.2) + lineOn(FR(-43.7), [[-8, 100], [-2, 106]], "#FFFFFF", 2.2);
    s += box(-54, -46, 108, 40, 0, 62, MINT);
    for (const x of [-50, 2]) s += shape(FR(-5.9), rr(x, 8, 48, 48, 4), "#D2F0E6", 1.3) + ball(x + (x < 0 ? 44 : 4), -5.6, 32, 1.6, GOLD, 0.9, 0);
    s += prism(TP(66), rr(-56, -48, 112, 44, 4), [0, 0, -4], "#FFFFFF", "#DCE4E2");
    s += shape(TP(66.1), ov(6, -28, 20, 12, 32), "#E6EFF2", 1.3) + shape(TP(66.2), ov(6, -27, 16, 9, 28), "#C9DCE2", 0) + shape(TP(66.25), ov(6, -27, 2, 1.4, 10), "#7D8A93", 0);
    s += rod([[6, -44, 66], [6, -44, 80], [6, -36, 82], [6, -32, 78]], CHROME[1], 3) + ball(0, -44, 74, 2.2, "#F2A7B8", 1, 0.6) + ball(12, -44, 74, 2.2, "#9CC7E6", 1, 0.6);
    for (const [x, cup, brush] of CUPS) s += cyl(x, -14, 66, 4, 9, cup, shade(cup, 0.1), 1.1) + rod([[x - 1, -14, 72], [x - 3, -16, 86]], brush, 2) + k.box(x - 5, -18, 4, 3, 85, 3, ["#FFFFFF", "#E5EEF4", "#FFFFFF"], 0.9);
    s += k.box(38, -18, 10, 7, 66, 4, ["#F7C6D6", "#E2A7BB", "#FBDDE6"], 1.1) + ball(43, -14.5, 71.5, 1.6, "#FFFFFF", 0.8, 0.6);
    return s;
  };
  const CASTLE_WIN = [[-28, -20, 70], [0, -20, 70], [28, -20, 70], [0, -40, 118]];
  M.shop_dentist_30 = (k) => {
    // はの ようせいの おしろ: くもの だい・しろい おしろ（おくばの かたちの とう 3つ・ピンクの やね）・しんじゅ（まんなかの いちばん うえ）・まど（よるは ひかる）・はた
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, lg, rg, L, lathe } = k;
    const WH = rg([[0, "#FFFFFF"], [0.75, "#F3F7F9"], [1, "#D8E2E8"]], 0.36, 0.3, 0.85), ROOF = rg([[0, "#FBD3DF"], [1, "#E995AE"]], 0.38, 0.3, 0.8);
    let s = shadow(0.12, 2, 30);
    for (const [x, y, r] of [[-44, -40, 22], [-10, -70, 26], [30, -64, 24], [46, -26, 20], [0, -18, 24], [-30, -14, 20]]) s += egg(x, y, 6, r, r * 0.8, 8, "#EAF4FB", 1.3);
    // おしろの たてもの
    s += box(-40, -70, 80, 50, 12, 46, ["#FFFFFF", "#E2EAEE", "#FFFFFF"]);
    s += shape(FR(-19.9), arch(-9, 9, 12, 30, 38), "#E995AE", 1.3) + shape(FR(-19.8), arch(-6, 6, 12, 27, 33), "#C26E89", 0) + ball(4, -19.7, 22, 1.2, GOLD, 0.8, 0);
    for (const x of [-28, 28]) s += shape(FR(-19.9), arch(x - 6, x + 6, 36, 50, 55), "#BFE3EE", 1.2);
    // とう（おくばの かたち）
    const tower = (x, y, r, z0, hh) => {
      let t = cyl(x, y, z0, r, hh, "#E8EEF2", "#FFFFFF", 1.4);
      for (const [dx, dy] of [[-r * 0.45, -r * 0.3], [r * 0.45, -r * 0.3], [-r * 0.45, r * 0.35], [r * 0.45, r * 0.35]]) t += egg(x + dx, y + dy, z0 + hh, r * 0.55, r * 0.55, r * 0.42, WH, 1.2);
      t += lathe(x, y, [[r * 0.95, z0 + hh + r * 0.35], [r * 0.2, z0 + hh + r * 1.9]], ROOF, 1.4);
      return t;
    };
    s += tower(-40, -50, 14, 12, 66) + tower(0, -46, 17, 58, 52) + tower(40, -50, 14, 12, 66);
    s += shape(FR(-31.9), arch(-6, 6, 104, 116, 121), "#BFE3EE", 1.2);
    // しんじゅ と はた
    s += ball(0, -46, 150, 8, rg([[0, "#FFFFFF"], [0.6, "#F4EEF8"], [1, "#D9CDEB"]], 0.35, 0.3, 0.8), 1.4, 0.8);
    for (const x of [-40, 40]) s += rod([[x, -50, 107], [x, -50, 120]], "#B9974A", 1.2) + at(x, -50, 120, `<path d="M0,0 L9,3 L0,6 Z" fill="#F2A7B8" ${S(0.9)}/>`, 10, 2);
    return s;
  };

  // ================= パンやさん =================
  M.shop_bakery_5 = (k) => {
    // しょくパンの クッション: やまの ある こんがりの みみ・まえの きりくちは ふわふわの しろ（ねむそうな かお）
    const { prism, shape, FR, SD, TP, onP, shadow, lineOn, plane } = k, d = 46;
    const loaf = (sx) => [[-23 * sx, 0], [23 * sx, 0], [23 * sx, 24], ...arc(11.5 * sx, 24, 11.5, 13, 0, Math.PI, 12), ...arc(-11.5 * sx, 24, 11.5, 13, 0, Math.PI, 12).slice(1), [-23 * sx, 24]];
    const front = loaf(1);
    let s = shadow(0.13, 3, 12);
    s += prism(FR(-2), front, [0, -(d - 4), 0], "#F3E2C2", "#C98A4E", 1.5);
    s += shape(FR(-1.9), front.map(([x, z]) => [x * 0.86, 3 + z * 0.82]), "#FFF8EA", 0);
    s += onP(FR(-1.8), -10, 26, 20, 12, `<path d="M3,5 Q5,3.4 7,5 M13,5 Q15,3.4 17,5" fill="none" ${S(1.2)}/><path d="M8,9 Q10,10.6 12,9" fill="none" ${S(1.1)}/><ellipse cx="2.6" cy="8" rx="2" ry="1.2" fill="#F7B9C9"/><ellipse cx="17.4" cy="8" rx="2" ry="1.2" fill="#F7B9C9"/>`);
    for (const x of [-14, 0, 14]) s += lineOn(FR(-1.7), [[x - 2, 14], [x + 2, 15]], "#EBD9B8", 1);
    return s;
  };
  M.shop_bakery_10 = (k) => {
    // パンかごの ワゴン: きの 2だんの ワゴン（くるま・とって）・うえは バゲットと クロワッサンの かご・したは メロンパン・あかい チェックの ぬの
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, eggAt } = k;
    const WOOD = ["#C9A26E", "#A88457", "#DDBD8A"], WICK = ["#D9B27C", "#B99060", "#E8C89A"];
    let s = shadow(0.12, 3, 6);
    const wheel = (x, y) => k.prism(SD(x + 1), ov(y, 5, 5, 5, 16), [-2.4, 0, 0], "#7A5634", "#5E4128", 1.2) + shape(SD(x + 1.1), ov(y, 5, 1.6, 1.6, 10), GOLD, 0.8);
    s += wheel(-40, -44) + wheel(40, -44);
    s += box(-42, -46, 4, 4, 8, 60, WOOD) + box(38, -46, 4, 4, 8, 60, WOOD);
    s += box(-42, -46, 84, 42, 12, 4, WOOD) + frustum(-14, -25, 16, 16, 28, 19, WICK[0], WICK[2], 1.3) + frustum(18, -25, 16, 14, 26, 17, WICK[0], WICK[2], 1.3);
    for (const [x, y] of [[-20, -28], [-10, -22], [-16, -16], [-6, -30]]) s += dome(x, y, 28, 6, 6, 4.6, "#F2CF8B", 1.1) + k.lineOn(TP(31), [[x - 3, y - 2], [x + 3, y + 2]], "#D9A35E", 0.8) + k.lineOn(TP(31), [[x - 3, y + 2], [x + 3, y - 2]], "#D9A35E", 0.8);
    for (const [x, y] of [[14, -24], [22, -20], [18, -30]]) s += egg(x, y, 30, 6.4, 5, 4.4, "#E3A863", 1.1);
    s += box(-42, -46, 84, 42, 46, 4, WOOD);
    s += prism(TP(50.2), rr(-40, -44, 80, 38, 3), [0, 0, -1], "#F7F2EA", "#E5DED3", 1) ;
    for (let x = -40; x < 40; x += 8) for (let y = -44; y < -6; y += 8) if (((x + y) / 8) % 2 === 0) s += shape(TP(50.3), rect(x, y, 8, Math.min(8, -6 - y)), "#F2A7A0", 0);
    s += frustum(-4, -24, 50, 24, 62, 27, WICK[0], WICK[2], 1.3);
    for (const [x0, y0, x1, y1, z1] of [[-20, -30, -26, -36, 84], [-12, -26, -16, -34, 88], [-4, -22, -2, -30, 86], [4, -28, 8, -36, 82]]) s += k.rod([[x0, y0, 56], [x1, y1, z1]], "#E3A863", 5.4) + k.line([[x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3, 56 + (z1 - 56) * 0.3], [x0 + (x1 - x0) * 0.36, y0 + (y1 - y0) * 0.36, 56 + (z1 - 56) * 0.36 + 2]], "#FFF3D0", 1.1);
    for (const [x, y] of [[12, -18], [18, -30]]) s += at(x, y, 62, `<path d="M-9,0 Q-10,-6 -5,-7 Q-2,-11 0,-11 Q2,-11 5,-7 Q10,-6 9,0 Q0,3 -9,0 Z" fill="#E9B266" ${S(1.1)}/><path d="M-5,-7 Q-3,-3 -4,0 M0,-11 V-1 M5,-7 Q3,-3 4,0" fill="none" stroke="#C9874A" stroke-width=".9"/>`, 11, 12);
    s += rod([[42, -44, 64], [48, -44, 66], [48, -6, 66], [42, -6, 64]], "#A88457", 2.2);
    s += box(-42, -6, 4, 4, 8, 60, WOOD) + box(38, -6, 4, 4, 8, 60, WOOD) + wheel(-40, -5) + wheel(40, -5);
    return s;
  };
  // かまの くち（live の とき FurnLive が ほのおを 描く）
  const OVEN = { x: 0, y: -2, z0: 46, w: 20 };
  M.shop_bakery_15 = (k) => {
    // レンガの パンがま: いしの だい・れんがの ドーム（アーチの くち・なかの ほのお）・うしろの えんとつ・パンを のせた へら・まきの やま
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, lathe, lg } = k;
    const STONE = ["#C9C2B4", "#A9A193", "#DDD7CB"];
    let s = shadow(0.12, 2, 8);
    s += box(26, -60, 14, 14, 70, 50, ["#B97A62", "#9A6250", "#CF927A"]) + box(24, -62, 18, 18, 118, 4, STONE);
    s += box(-54, -62, 108, 58, 0, 44, STONE);
    for (let z = 8; z < 44; z += 11) s += lineOn(FR(-3.9), [[-54, z], [54, z]], "#B7AF9F", 1.1) + lineOn(SD(54.1), [[-62, z], [-4, z]], "#9C9486", 1.1);
    s += dome(0, -33, 44, 46, 28, 46, lg([[0, "#D99A80"], [1, "#B5705A"]], 0, 0, 0, 1), 1.6);
    for (const [a, b] of [[0.0, 0.3], [0.6, 0.25], [1.2, 0.3], [-0.6, 0.35], [0.3, 0.62], [0.95, 0.6], [1.6, 0.55], [-0.3, 0.68]]) { const p = k.eggAt(0, -33, 44, 46, 28, 46, a, b); s += at(p[0], p[1], p[2], `<rect x="-5" y="-2" width="10" height="4" rx="1" fill="#C9826A" stroke="#9A6250" stroke-width=".8"/>`, 6, 3); }
    s += shape(FR(-4.6), arch(-20, 20, 44, 68, 80), "#E8DFD0", 1.5) + shape(FR(-4.5), arch(-14, 14, 44, 62, 72), "#3B2B2B", 1.3);
    s += shape(FR(-4.4), arch(-11, 11, 44, 58, 66), lg([[0, "#FFB24A"], [1, "#E0602F"]]), 0);
    s += box(-16, -6, 32, 6, 40, 4, ["#7A6A5A", "#5E5145", "#8C7C6B"]);
    // へらと パン
    s += rod([[-60, -2, 2], [-36, -10, 62]], "#B99060", 2.4) + k.slab([-46, 4, 0], [1, 0, 0], [0, -0.35, 0.94], rr(0, 0, 16, 26, 4), 1.6, "#D9B27C", "#B99060", 1.2).s + egg(-38, -3, 13, 6, 3.4, 3.2, "#D9A35E", 1.1);
    // まき
    for (const [x, z] of [[40, 4], [48, 4], [44, 10], [52, 10], [48, 16]]) s += k.prism(SD(58), ov(-12 + (x - 44), z, 3.2, 3.2, 12), [-16, 0, 0], "#B07A52", "#8C5E3C", 1.1) + shape(SD(58.1), ov(-12 + (x - 44), z, 1.6, 1.6, 8), "#E3C08E", 0);
    return s;
  };
  M.shop_bakery_30 = (k) => {
    // こんがり パンの おうち: しょくパンの かべ（こげめの ふち）・メロンパンの まるい やね・クッキーの ドア・まど（よるは ひかる）・えんとつは スティック パン・よこに パンの かんばん
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, lg, rg, eggAt } = k;
    const TOAST = ["#F3E2C2", "#D9C29A", "#FFF0D8"];
    let s = shadow(0.12, 2, 12);
    s += box(-62, -100, 124, 84, 0, 80, TOAST);
    for (const [pl, len, ps] of [[FR(-15.9), 124, -62], [SD(62.1), 84, -100]]) s += lineOn(pl, [[ps, 2], [ps + len, 2], [ps + len, 78], [ps, 78], [ps, 2]], "#C98A4E", 4) + lineOn(pl, [[ps, 2], [ps + len, 2], [ps + len, 78], [ps, 78], [ps, 2]], "#E3A86A", 1.6);
    s += shape(FR(-15.8), arch(-14, 14, 0, 40, 48), "#A0663E", 1.5) + shape(FR(-15.7), arch(-11, 11, 0, 37, 44), "#C08050", 0);
    for (const [x, z] of [[-6, 10], [5, 18], [-4, 28], [6, 34], [0, 6]]) s += shape(FR(-15.6), ov(x, z, 1.8, 1.4, 10), "#5E3E26", 0);
    s += ball(8, -15.5, 24, 1.6, GOLD, 0.9, 0);
    for (const x of [-46, 30]) s += shape(FR(-15.8), rr(x, 38, 18, 20, 4), "#FFFFFF", 1.4) + shape(FR(-15.7), rr(x + 2.5, 40.5, 13, 15, 3), lg([[0, "#DDF4FB"], [1, "#A9D8EA"]]), 0) + lineOn(FR(-15.6), [[x + 9, 40], [x + 9, 56]], "#FFFFFF", 1.6) + lineOn(FR(-15.6), [[x + 2, 48], [x + 16, 48]], "#FFFFFF", 1.6);
    s += shape(SD(62.2), rr(-74, 36, 26, 22, 5), "#FFFFFF", 1.4) + shape(SD(62.3), rr(-71, 39, 20, 16, 4), lg([[0, "#DDF4FB"], [1, "#A9D8EA"]]), 0);
    // メロンパンの やね（ななめの こうしの もよう）
    const RX = 66, RY = 46, HZ = 44, RZ0 = 80, on = (a, b) => k.P(...eggAt(0, -58, RZ0, RX, RY, HZ, a, b));
    s += dome(0, -58, RZ0, RX, RY, HZ, rg([[0, "#FFF2B8"], [0.6, "#F6D98A"], [1, "#D9B062"]], 0.36, 0.28, 0.85), 1.6);
    for (const dir of [1, -1]) for (let c = -2.6; c <= 3.4; c += 0.42) {
      const ps = [];
      for (let j = 0; j <= 16; j++) { const u = (j / 16) * 1.45, a = c + dir * u; if (a < -0.95 || a > 2.5) continue; ps.push(on(a, 0.06 + u)); }
      if (ps.length > 1) s += `<polyline points="${ps.map(k.xy).join(" ")}" fill="none" stroke="#E2B865" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    for (const [a, b] of [[0.2, 0.5], [0.9, 0.35], [1.5, 0.6], [-0.4, 0.4], [0.5, 0.9], [1.2, 0.85]]) { const p = eggAt(0, -58, RZ0, RX, RY, HZ, a, b); s += at(p[0], p[1], p[2], `<circle r="1.3" fill="#FFFFFF" fill-opacity=".9"/>`, 2, 2); }
    // えんとつ（スティック パン）
    s += k.rod([[30, -78, 104], [34, -80, 146]], "#D9A35E", 7) + k.line([[31, -78.5, 116], [32, -79, 118]], "#FFF3D0", 1.4) ;
    // かんばん
    s += rod([[70, -10, 0], [70, -10, 40]], "#A88457", 1.8) + onP(SD(70.2), -24, 52, 28, 16, `<rect x="1" y="1" width="26" height="14" rx="3" fill="#FFF3D0" ${S(1.1)}/><path d="M7,11 Q6,5 10,4 Q13,2 16,4 Q20,5 19,11 Z" fill="#E3A863" ${S(0.9)}/>`);
    return s;
  };

  // ================= おはなやさん =================
  const BUCKET_FLOWERS = ["blooms", "rose", "sprig", "blooms", "rose", "sprig"];
  M.shop_florist_5 = (k) => {
    // はなの バケツ スタンド: うしろほど たかい 3だんの きの だい・ぎんの バケツに チューリップ・ばら・デイジー
    const { box, cyl, at, shadow } = k;
    const WOOD = ["#C9A26E", "#A88457", "#DDBD8A"];
    let s = shadow(0.12, 2, 6);
    const steps = [[-40, -14, 44], [-26, -14, 26], [-12, -14, 8]];
    steps.forEach(([y, dd, z], i) => {
      s += box(-27, y, 54, dd, 0, z + 4, WOOD);
      for (const x of [-14, 14]) {
        const c = i * 2 + (x > 0 ? 1 : 0);
        s += cyl(x, y + 7, z + 4, 6.4, 11, "#C9D2DA", "#E7ECF0", 1.2) + k.lineOn(k.TP(z + 13), close(ov(x, y + 7, 6.6, 6.6, 20)), "#9AA6B0", 1);
        const spr = BUCKET_FLOWERS[c] === "blooms" ? SPR.blooms() : BUCKET_FLOWERS[c] === "rose" ? SPR.rose() + `<g transform="translate(-4 2)">${SPR.rose()}</g>` : SPR.sprig(["#F7D56A", "#FFFFFF", "#C9B6E0", "#F2A7B8"][c % 4]) + `<g transform="translate(4 1)">${SPR.sprig("#F2A7B8")}</g>`;
        s += at(x, y + 7, z + 13, `<g transform="scale(1.25)">${spr}</g>`, 12, 26);
      }
    });
    return s;
  };
  M.shop_florist_10 = (k) => {
    // はなかざりの ベンチ: しろい きの ベンチ（いたの すきま）・せもたれの うえの はなの わ・よこの じょうろ
    const { box, prism, shape, FR, SD, TP, lineOn, rod, at, shadow } = k;
    const WH = ["#FFFFFF", "#E3DDD3", "#FFFFFF"];
    let s = shadow(0.12, 3, 8);
    for (const x of [-48, 44]) s += box(x, -44, 5, 5, 0, 70, WH) + box(x, -10, 5, 5, 0, 30, WH);
    for (let z = 34; z <= 60; z += 9) s += box(-50, -44, 100, 3, z, 5, WH);
    for (let y = -40; y < -6; y += 8) s += box(-50, y, 100, 6, 26, 3, WH);
    s += box(-50, -46, 100, 4, 68, 4, WH);
    for (let i = 0; i < 13; i++) { const x = -46 + i * 7.6, c = ["#F2A7B8", "#F7D56A", "#C9B6E0", "#FFFFFF"][i % 4]; s += at(x, -45, 72, `<ellipse cx="-3" cy="-1" rx="3" ry="1.6" transform="rotate(-25 -3 -1)" fill="#8DB87A" ${S(0.7)}/>` + flowerSvg(1, -2, 3.4, c, "#F29A5B", 0.8), 6, 6); }
    for (const x of [-48, 44]) s += box(x, -10, 5, 5, 0, 30, WH);
    s += at(-58, -6, 0, `<g transform="scale(1.6)">${SPR.can()}</g>`, 20, 22);
    return s;
  };
  // おんしつの なかの ちょうちょ（live）
  M.shop_florist_15 = (k) => {
    // ガラスの おんしつ: しろい わく・ガラスの かべと やね（すけて みえる）・なかの たなに はちうえ（モンステラ・はな・サボテン）・つるの アイビー
    const { box, prism, poly, shape, FR, SD, TP, lineOn, cyl, rod, at, shadow, line } = k;
    const FRAME = "#FFFFFF";
    let s = shadow(0.12, 2, 6);
    s += box(-54, -64, 108, 60, 0, 10, ["#E9E3DA", "#CFC7BA", "#F4EFE8"]);
    // おくの かべの ガラス
    s += poly([[-52, -62, 10], [52, -62, 10], [52, -62, 96], [-52, -62, 96]], "#E3F4EC", 1.2, 'fill-opacity=".5"');
    // なかの たなと しょくぶつ
    s += box(-50, -58, 100, 26, 46, 3, ["#D9B27C", "#B99060", "#E8C89A"]);
    s += cyl(-30, -46, 10, 8, 12, "#E48A6E", "#EFA58C", 1.2) + at(-30, -46, 22, `<g transform="scale(1.7)">${SPR.monstera()}</g>`, 28, 46);
    s += cyl(26, -44, 10, 7, 11, "#9CC7E6", "#BFDDF0", 1.1) + at(26, -44, 21, `<g transform="scale(1.6)">${SPR.blooms()}</g>`, 18, 26);
    for (const [x, c] of [[-32, "#F2B8C6"], [-6, "#E48A6E"], [20, "#F2F0EA"]]) s += cyl(x, -46, 49, 5, 7, c, shade(c, 0.15), 1.1);
    s += at(-32, -46, 56, `<g transform="scale(1.3)">${SPR.cactus()}</g>`, 12, 26) + at(-6, -46, 56, `<g transform="scale(1.3)">${SPR.rosette()}</g>`, 12, 16) + at(20, -46, 56, `<g transform="scale(1.3)">${SPR.sprout()}</g>`, 10, 14);
    s += at(-46, -60, 94, `<g transform="scale(1.4)">${SPR.ivy()}</g>`, 14, 4) + at(40, -60, 94, `<g transform="scale(1.2)">${SPR.ivy()}</g>`, 14, 4);
    // ガラスの かべ（まえ・みぎ）と わく
    s += poly([[-54, -4, 10], [54, -4, 10], [54, -4, 96], [-54, -4, 96]], "#E3F4EC", 1.4, 'fill-opacity=".22"') + poly([[54, -64, 10], [54, -4, 10], [54, -4, 96], [54, -64, 96]], "#D6EEE3", 1.4, 'fill-opacity=".28"');
    for (const x of [-54, -18, 18, 54]) s += rod([[x, -4, 10], [x, -4, 96]], FRAME, 2.6);
    for (const y of [-64, -34, -4]) s += rod([[54, y, 10], [54, y, 96]], FRAME, 2.6);
    s += rod([[-54, -4, 50], [54, -4, 50], [54, -64, 50]], FRAME, 2.2) + rod([[-54, -4, 96], [54, -4, 96], [54, -64, 96]], FRAME, 2.6);
    s += line([[-40, -4, 20], [-28, -4, 44]], "#FFFFFF", 2.2, 'stroke-opacity=".8"') + line([[30, -4, 60], [40, -4, 80]], "#FFFFFF", 1.6, 'stroke-opacity=".7"');
    // やね
    s += poly([[-54, -64, 96], [54, -64, 96], [54, -34, 130], [-54, -34, 130]], "#E3F4EC", 1.4, 'fill-opacity=".4"') + poly([[-54, -4, 96], [54, -4, 96], [54, -34, 130], [-54, -34, 130]], "#E9F7F0", 1.4, 'fill-opacity=".35"') + poly([[54, -64, 96], [54, -4, 96], [54, -34, 130]], "#D6EEE3", 1.4, 'fill-opacity=".45"');
    s += rod([[-54, -34, 130], [54, -34, 130]], FRAME, 2.6) + rod([[54, -4, 96], [54, -34, 130], [54, -64, 96]], FRAME, 2.2) + rod([[-54, -4, 96], [-54, -34, 130]], FRAME, 2.2);
    s += at(54, -34, 131, `<circle cy="-3" r="3" fill="${GOLD}" ${S(1)}/>`, 4, 6);
    return s;
  };
  // ブランコ（live の とき FurnLive が ゆらす）
  const SWING = { top: 150, seatZ: 40, x: 0, y: -40, w: 40 };
  M.shop_florist_30 = (k) => {
    // ばらの ブランコ アーチ: しろい アーチ（こうし）に ばらの つる・まんなかの きの ブランコ・りょうがわの はちうえ
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, rod, at, shadow, L, line, ball } = k;
    let s = shadow(0.1, 4, 20);
    const post = (x) => box(x - 4, -48, 8, 16, 0, 140, ["#FFFFFF", "#E3DDD3", "#FFFFFF"]);
    s += post(-62) + post(62);
    // アーチ（2まいの いた）
    for (const y of [-48, -32]) {
      const pts = Array.from({ length: 25 }, (_, i) => { const t = Math.PI - (i / 24) * Math.PI; return [Math.cos(t) * 62, 140 + Math.sin(t) * 30]; });
      s += line(pts.map(([x, z]) => [x, y, z]), INK, 6) + line(pts.map(([x, z]) => [x, y, z]), "#FFFFFF", 3.6);
    }
    for (let i = 1; i < 12; i++) { const t = Math.PI - (i / 12) * Math.PI, x = Math.cos(t) * 62, z = 140 + Math.sin(t) * 30; s += line([[x, -48, z], [x, -32, z]], "#FFFFFF", 2.2); }
    // つると ばら
    const vine = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; if (u < 0.3) vine.push([-62 + Math.sin(u * 40) * 4, -32, u / 0.3 * 140]); else if (u < 0.7) { const t = Math.PI - ((u - 0.3) / 0.4) * Math.PI; vine.push([Math.cos(t) * 62, -32, 140 + Math.sin(t) * 30 + Math.sin(u * 50) * 3]); } else vine.push([62 + Math.sin(u * 40) * 4, -32, (1 - (u - 0.7) / 0.3) * 140]); }
    s += line(vine, "#5F8F55", 2.2);
    vine.forEach(([x, y, z], i) => { if (i % 2) s += at(x, y + 1, z, i % 4 === 1 ? `<circle r="4.2" fill="${["#E77E8E", "#F2A7B8", "#FFFFFF"][i % 3]}" ${S(1)}/><path d="M-2,-0.4 q2,-2 4,0 q-2,1.6 -4,0" fill="none" stroke="#C2566A" stroke-width=".9"/>` : `<ellipse cx="0" cy="0" rx="3.6" ry="2" transform="rotate(${i * 37})" fill="#7FAE6C" ${S(0.8)}/>`, 5, 5); });
    // ブランコ
    s += L(rod([[-18, -40, 168], [-18, -40, 44]], "#B99060", 1.4) + rod([[18, -40, 168], [18, -40, 44]], "#B99060", 1.4) + box(-22, -48, 44, 16, 40, 4, ["#D9B27C", "#B99060", "#E8C89A"]));
    // はちうえ
    for (const x of [-74, 74]) s += cyl(x, -12, 0, 9, 16, "#E48A6E", "#EFA58C", 1.2) + at(x, -12, 16, `<g transform="scale(1.6)">${SPR.blooms()}</g>`, 18, 26);
    return s;
  };

  // ================= そらの はいたつ =================
  M.shop_relay_5 = (k) => {
    // にもつの ダンボール いす: ちゃいろの はこ・テープ・うえむきの やじるし・ほしの シール・ペンギンの はねの マーク
    const { box, shape, FR, SD, TP, lineOn, onP, shadow } = k;
    const CB = ["#D9AE76", "#B98F58", "#E8C590"];
    let s = shadow(0.13, 2, 4) + box(-23, -47, 46, 45, 0, 42, CB);
    s += shape(TP(42.1), rect(-4, -47, 8, 45), "#C9A15E", 0.9) + shape(FR(-1.9), rect(-4, 26, 8, 16), "#C9A15E", 0.9);
    s += lineOn(TP(42.15), [[-23, -24.5], [23, -24.5]], "#B98F58", 1);
    s += onP(FR(-1.8), -20, 22, 14, 14, `<path d="M4,13 V4 M4,2 L1,6 M4,2 L7,6 M10,13 V4 M10,2 L7,6 M10,2 L13,6" fill="none" stroke="#5E4128" stroke-width="1.2" stroke-linecap="round"/>`);
    s += onP(FR(-1.8), 8, 34, 14, 14, `<circle cx="7" cy="7" r="6.4" fill="#6FA9DE" ${S(1)}/><path d="M3,8 Q7,2 11,7 Q8,6 7,9 Q5,7 3,8 Z" fill="#FFFFFF" stroke="none"/>`);
    s += onP(SD(23.1), -36, 30, 14, 14, `<path d="${starPath(7, 7, 6, 2.6)}" fill="#F7D56A" ${S(1)}/>`);
    return s;
  };
  M.shop_relay_10 = (k) => {
    // ききゅうの ランプ: まるい だい・ぼう・あみかごの ゴンドラ・ロープ・しましまの ききゅう（よるは ひかる）
    const { cyl, box, egg, eggAt, rod, at, shadow, line, P, xy } = k, cx = 0, cy = -28, C = { z: 94, rx: 24, rz: 26 };
    let s = shadow(0.12, 6, 22) + cyl(cx, cy, 0, 14, 4, "#B99060", "#D9B27C", 1.3) + rod([[cx, cy, 4], [cx, cy, 44]], "#B99060", 2);
    s += box(-9, cy - 9, 18, 18, 44, 12, ["#C99A62", "#A67C4C", "#DDB27C"]);
    for (let z = 47; z < 56; z += 3) s += k.lineOn(k.FR(cy + 9.1), [[-9, z], [9, z]], "#A67C4C", 0.8);
    for (const [dx, dy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) s += line([[dx, cy + dy, 56], [dx * 1.6, cy + dy * 1.6, C.z - 18]], "#8C6848", 1);
    s += egg(cx, cy, C.z, C.rx, C.rx, C.rz, "#FFFFFF", 1.5);
    const cols = ["#F2A7B8", "#F7D56A", "#A9D6C2", "#9CC7E6"];
    for (let i = 0; i < 12; i++) {
      const a0 = -Math.PI / 4 - Math.PI / 2 + (i * Math.PI) / 6, a1 = a0 + Math.PI / 6;
      if (Math.cos((a0 + a1) / 2 - Math.PI / 4) < -0.1) continue;
      const pts = [];
      for (let j = 0; j <= 10; j++) pts.push(P(...eggAt(cx, cy, C.z, C.rx, C.rx, C.rz, a0, -Math.PI / 2 + (j / 10) * Math.PI)));
      for (let j = 10; j >= 0; j--) pts.push(P(...eggAt(cx, cy, C.z, C.rx, C.rx, C.rz, a1, -Math.PI / 2 + (j / 10) * Math.PI)));
      s += `<polygon points="${pts.map(xy).join(" ")}" fill="${cols[i % 4]}" stroke="none"/>`;
    }
    s += egg(cx, cy, C.z, C.rx, C.rx, C.rz, "none", 1.5);
    s += k.ball(cx - 8, cy - 2, C.z + 12, 3.4, "#FFFFFF", 0, 0.6).replace('fill="#FFFFFF"', 'fill="#FFFFFF" fill-opacity=".5"');
    return s;
  };
  M.shop_relay_15 = (k) => {
    // そらの ちずの つくえ: あおい つくえ・ななめの ちず（くも・ほし・てんてんの みち・ひこうき）・ちきゅうぎ・パイロットの ぼうしと ゴーグル・こづつみ
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, ball, rod, at, onP, shadow, slab, rg, L } = k;
    const BL = ["#9CC7E6", "#7EAAD0", "#BCDBF0"];
    let s = shadow(0.12, 3, 6);
    for (const [x, y] of [[-58, -58], [52, -58], [-58, -10], [52, -10]]) s += box(x, y, 6, 6, 0, 66, BL);
    s += box(-58, -58, 116, 52, 56, 6, BL) + shape(FR(-5.9), rr(-50, 57.5, 100, 3.5, 1.5), "#E7F3FA", 0);
    s += prism(TP(70), rr(-61, -61, 122, 58, 3), [0, 0, -8], "#E7F3FA", "#7EAAD0");
    const { m, s: board } = slab([-52, -14, 70.5], [1, 0, 0], [0, -0.7, 0.7], rr(0, 0, 66, 40, 3), 2.4, "#FFF6E0", "#D9C9A8", 1.4);
    s += lineOn(TP(70.2), [[-50, -42], [-50, -36]], INK, 1.2) + board + shape(m, rect(3, 3, 60, 34), "#CFE9F7", 1);
    s += (onP(m, 3, 37, 60, 34, `<path d="M6,26 q4,-6 9,-3 q3,-5 8,-1 q5,1 4,5 Z" fill="#FFFFFF" ${S(0.8)}/><path d="M36,14 q3,-4 7,-2 q3,-3 6,0 q3,1 2,4 Z" fill="#FFFFFF" ${S(0.8)}/><path d="M10,10 Q26,4 34,16 T56,26" fill="none" stroke="#E77E6E" stroke-width="1.2" stroke-dasharray="2 2"/><path d="${starPath(48, 8, 2.6, 1.1)}" fill="#F7D56A"/><path d="${starPath(18, 28, 2, 0.9)}" fill="#F7D56A"/><path d="M52,24 l6,-2 l-2,4 Z" fill="#6FA9DE" ${S(0.6)}/>`));
    // ちきゅうぎ
    s += cyl(30, -40, 70, 6, 2, GOLDD, GOLD, 1.1) + rod([[30, -40, 72], [30, -40, 78]], GOLD, 1.4) + ball(30, -40, 87, 9, rg([[0, "#BFE3F2"], [1, "#4F92C2"]]), 1.3, 0.3);
    s += at(30, -40, 80, `<path d="M-5,-12 q3,-4 7,-1 q2,3 -1,5 q-4,1 -6,-4 Z M2,-4 q3,-1 4,2 q-1,3 -4,2 Z" fill="#9ED08C" stroke="none"/>`, 8, 16) + rod([[22, -40, 80], [30, -40, 98], [38, -40, 80]], GOLDD, 1.1);
    // ぼうしと ゴーグル・こづつみ
    s += k.dome(4, -24, 70, 9, 8, 6, "#8C6848", 1.2) + k.lineOn(TP(70.3), arc(4, -24, 11, 9.5, 0.2, 2.9, 12), "#6F5238", 2) + at(4, -16, 72, `<circle cx="-3.4" r="2.4" fill="#BFE3EE" ${S(0.9)}/><circle cx="3.4" r="2.4" fill="#BFE3EE" ${S(0.9)}/><path d="M-1,0 h2" ${S(0.9)}/>`, 7, 4);
    s += box(36, -16, 16, 12, 70, 9, ["#D9AE76", "#B98F58", "#E8C590"], 1.2) + box(40, -15, 10, 9, 79, 6, ["#F2A7B8", "#D98AA0", "#F7C6D6"], 1.1) + shape(TP(85.1), rect(44, -15, 2, 9), "#FFFFFF", 0);
    return s;
  };
  // プロペラ（live の とき FurnLive が まわす）
  const PROP = { x: 74, y: -56, z: 56 };
  M.shop_relay_30 = (k) => {
    // くもの はいたつ ひこうき: のれる おおきな ひこうき（そらいろ・しろい くもの もよう）・まえの プロペラ・つばさ・うしろの はね・タイヤ・うしろの にもつ・したの くも
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, egg, ball, rod, at, onP, shadow, L, slab, rg, eggAt, dome } = k;
    const SKY = rg([[0, "#D8EEFB"], [0.6, "#9CC7E6"], [1, "#6F9CC4"]], 0.35, 0.28, 0.85);
    let s = shadow(0.12, 2, 28);
    for (const [x, y, r] of [[-56, -30, 18], [-20, -16, 22], [24, -18, 20], [56, -34, 16], [-40, -84, 16], [10, -92, 18], [50, -80, 16]]) s += egg(x, y, 4, r, r * 0.75, 7, "#F4FAFF", 1.2);
    // うしろの はね・つばさ（おく）
    s += slab([-70, -70, 52], [1, 0, 0], [0, 0, 1], [[0, 0], [22, 0], [8, 34], [0, 34]], 4, "#F28B8B", "#D46A6A", 1.3).s;
    s += prism(TP(46), [[-12, -112], [22, -112], [26, -56], [-16, -56]], [0, 0, -5], "#BCDBF0", "#7EAAD0", 1.4);
    // どう
    s += egg(0, -56, 46, 72, 24, 24, SKY, 1.6);
    for (const [a, b, r] of [[0.5, 0.3, 6], [0.9, -0.1, 5], [0.2, 0.6, 4]]) { const p = eggAt(0, -56, 46, 72, 24, 24, a, b); s += at(p[0], p[1], p[2], `<path d="M-6,1 q1,-5 6,-4 q3,-4 7,0 q4,1 2,4 Z" fill="#FFFFFF" ${S(0.8)}/>`, 9, 6); }
    s += egg(-4, -56, 66, 22, 15, 6, "#4A4F5E", 1.3) + egg(-4, -56, 66.5, 18, 12, 4, "#F2A7B8", 0);
    s += slab([8, -46, 66], [0, 1, 0], [0.3, 0, 1], [[0, 0], [20, 0], [18, 12], [2, 12]], 1.5, "#DDF4FB", "#A9D8EA", 1.2).s;
    // にもつ
    s += box(-46, -66, 22, 20, 64, 12, ["#D9AE76", "#B98F58", "#E8C590"], 1.2) + shape(FR(-45.9), heart(-35, 70, 3.2, 18), "#F2A7B8", 0.9);
    // つばさ（てまえ）
    s += prism(TP(46), [[-16, -56], [26, -56], [22, 0], [-12, 0]], [0, 0, -5], "#BCDBF0", "#7EAAD0", 1.4) + k.lineOn(TP(46.1), [[-10, -8], [20, -8]], "#E77E6E", 2);
    s += slab([-70, -42, 52], [1, 0, 0], [0, 0, 1], [[0, 0], [22, 0], [8, 18], [0, 18]], 3, "#F28B8B", "#D46A6A", 1.3).s;
    // タイヤ
    for (const y of [-74, -38]) s += rod([[14, y, 22], [14, y, 10]], "#7EAAD0", 1.6) + k.prism(SD(17), ov(y, 8, 7, 7, 18), [-6, 0, 0], "#4A4550", "#38343E", 1.3) + shape(SD(17.1), ov(y, 8, 2.6, 2.6, 10), CHROME[0], 0.8);
    // はなと プロペラ
    s += egg(70, -56, 46, 9, 10, 10, "#F7D56A", 1.4) + ball(PROP.x + 2, PROP.y, PROP.z - 10, 3, "#E0473F", 1.1, 0.5);
    s += L(propeller(k, 0));
    return s;
  };
  function propeller(k, ang) {
    // プロペラの 2まいの はね（よこから 見た まえの 面: y-z の 平面）
    const { shape, SD } = k;
    let s = "";
    for (const off of [0, Math.PI]) {
      const a = ang + off, len = 26, ux = Math.cos(a), uz = Math.sin(a);
      const pts = [[PROP.y + ux * 3 - uz * 3, PROP.z - 10 + uz * 3 + ux * 3], [PROP.y + ux * len - uz * 5, PROP.z - 10 + uz * len + ux * 5], [PROP.y + ux * (len + 2), PROP.z - 10 + uz * (len + 2)], [PROP.y + ux * len + uz * 5, PROP.z - 10 + uz * len - ux * 5], [PROP.y + ux * 3 + uz * 3, PROP.z - 10 + uz * 3 - ux * 3]];
      s += shape(SD(PROP.x + 4), pts, "#F4F0E8", 1.2);
    }
    return s;
  }

  // ================= ころころ フルーツ =================
  M.shop_korokoro_5 = (k) => {
    // どんぐりの スツール: つやつやの どんぐり（ちゃいろ）・ぼうしは すわる ところ（こうしの もよう）・てっぺんの じく
    const { egg, dome, cyl, rod, at, shadow, rg, eggAt, P, xy } = k, cy = -22;
    let s = shadow(0.13, 4, 18);
    s += egg(0, cy, 20, 18, 18, 20, rg([[0, "#D9A06A"], [0.6, "#B9784A"], [1, "#8C5634"]], 0.35, 0.3, 0.85), 1.5);
    s += k.lineOn(k.FR(cy + 18), [[-8, 26], [-4, 12]], "#F2CFA6", 2.2, 'stroke-opacity=".7"');
    s += cyl(0, cy, 32, 21, 5, "#8C6848", "#A98563", 1.4) + dome(0, cy, 37, 21, 21, 9, rg([[0, "#B89270"], [1, "#7E5E40"]], 0.35, 0.3, 0.85), 1.4);
    for (const dir of [1, -1]) for (let c = -2.4; c <= 3.2; c += 0.5) {
      const ps = []; for (let j = 0; j <= 10; j++) { const u = (j / 10) * 1.4, a = c + dir * u; if (a < -0.9 || a > 2.45) continue; ps.push(P(...eggAt(0, cy, 37, 21, 21, 9, a, u))); }
      if (ps.length > 1) s += `<polyline points="${ps.map(xy).join(" ")}" fill="none" stroke="#6B4E33" stroke-width="1" stroke-linecap="round"/>`;
    }
    s += rod([[0, cy, 45], [1, cy, 50]], "#6B4E33", 2.6);
    return s;
  };
  // ぶどうの つぶ（[x, y, z]）。live の とき FurnLive が ひからせる
  const GRAPES = [];
  for (const [n, z, r] of [[4, 92, 13], [3, 82, 10], [2, 72, 6.5], [1, 63, 0]]) for (let i = 0; i < n; i++) { const a = -Math.PI / 4 + (n > 1 ? -1.3 + (i * 2.6) / (n - 1) : 0); GRAPES.push([Math.cos(a) * r, -26 + Math.sin(a) * r * 0.7, z]); }
  M.shop_korokoro_10 = (k) => {
    // ぶどうの ランプ: はっぱの だい・まがった つるの スタンド・はっぱ・ぶどうの ふさ（ひかる つぶ）
    const { cyl, rod, ball, at, shadow, prism, TP, shape, line } = k, cy = -26;
    let s = shadow(0.12, 5, 20) + prism(TP(4), star(0, cy, 22, 15, 5, 0.3), [0, 0, -4], "#8DB87A", "#6F9A5E", 1.4);
    s += line([[-14, cy - 6, 4], [-16, cy - 6, 40], [-12, cy - 6, 80], [-4, cy - 6, 106], [6, cy - 4, 114], [12, cy - 2, 108]], INK, 5.4) + line([[-14, cy - 6, 4], [-16, cy - 6, 40], [-12, cy - 6, 80], [-4, cy - 6, 106], [6, cy - 4, 114], [12, cy - 2, 108]], "#8C6848", 3.4);
    s += rod([[0, cy, 104], [0, cy, 98]], "#6B4E33", 1.4);
    for (const [x, z, r] of [[-10, 108, -30], [8, 116, 20], [-18, 70, -60]]) s += at(x, cy - 6, z, `<g transform="rotate(${r})"><path d="M0,0 C-9,-3 -10,-12 -4,-15 C-2,-11 2,-11 4,-15 C10,-12 9,-3 0,0 Z" fill="#7FB06A" ${S(1.1)}/><path d="M0,-1 V-12" stroke="#5F8F55" stroke-width=".9"/></g>`, 12, 16);
    s += (GRAPES.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || b[2] - a[2]).map(([x, y, z]) => ball(x, y, z, 5.4, k.rg([[0, "#C9A0E6"], [0.6, "#8E5FC0"], [1, "#6B3F9A"]], 0.35, 0.3, 0.85), 1.2, 0.55)).join(""));
    return s;
  };
  M.shop_korokoro_15 = (k) => {
    // すいかの ソファ: まるい すいかを きった はんぶんの せもたれ（みどりの かわ・しろ・あかい み・くろい たね）・あかい ざぶとん・みどりの ひじかけ
    const { box, prism, shape, FR, SD, TP, lineOn, at, shadow, egg, lg } = k;
    let s = shadow(0.12, 2, 14);
    const rind = Array.from({ length: 25 }, (_, i) => { const t = Math.PI - (i / 24) * Math.PI; return [Math.cos(t) * 62, 22 + Math.sin(t) * 46]; });
    s += prism(FR(-50), [[-62, 22], [62, 22], ...rind.slice().reverse()], [0, -14, 0], "#6FAE5A", "#4F8E42", 1.6);
    s += shape(FR(-49.9), [[-56, 22], [56, 22], ...rind.map(([x, z]) => [x * 0.9, 22 + (z - 22) * 0.88]).reverse()], "#F5F2E2", 0);
    s += shape(FR(-49.8), [[-52, 22], [52, 22], ...rind.map(([x, z]) => [x * 0.84, 22 + (z - 22) * 0.8]).reverse()], lg([[0, "#F66B6B"], [1, "#E04848"]]), 1.2);
    for (const [x, z] of [[-30, 36], [-14, 50], [4, 56], [22, 48], [36, 34], [-38, 26], [-4, 36], [14, 32], [-22, 30], [30, 26]]) s += shape(FR(-49.7), ov(x, z, 1.5, 2.4, 10), "#2A2224", 0);
    s += box(-56, -50, 112, 42, 0, 20, ["#F5F2E2", "#DCD6C0", "#FFFFFF"]) + prism(TP(30), rr(-56, -50, 112, 44, 12), [0, 0, -10], "#EF5A5A", "#C94444");
    for (const [x, y] of [[-40, -30], [-20, -18], [0, -34], [20, -22], [40, -32], [-30, -14], [10, -12], [30, -12]]) s += shape(TP(30.1), ov(x, y, 1.6, 2.6, 10), "#2A2224", 0);
    for (const x of [-64, 50]) s += egg(x + 7, -26, 26, 9, 22, 14, "#6FAE5A", 1.4) + k.lineOn(TP(39.5), [[x + 7, -44], [x + 7, -8]], "#9ACB86", 2);
    return s;
  };
  // りすの まど（live の とき FurnLive が コロンを だす）
  const TREE = { winX: 6, winY: -56, winZ: 120 };
  M.shop_korokoro_30 = (k) => {
    // コロンの きのうえの おうち: ふとい みき（ねっこ・まるい ドア）・きの デッキ・あかい やねの こや（まるい まど）・はっぱの かたまり・なわばしご・くだもの
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, lathe, lg, rg, line } = k, cy = -56;
    const BARK = lg([[0, "#B07A52"], [1, "#8C5E3C"]], 0, 0, 1, 0);
    let s = shadow(0.12, 2, 40);
    for (const a of [0.2, 1.4, 2.6, 3.8, 5.0]) s += k.rod([[Math.cos(a) * 18, cy + Math.sin(a) * 18, 8], [Math.cos(a) * 30, cy + Math.sin(a) * 30, 0]], "#8C5E3C", 5);
    s += lathe(0, cy, [[24, 0], [20, 14], [17, 40], [16, 96]], BARK, 1.6);
    for (const [x0, z0, z1] of [[-6, 20, 70], [6, 34, 84], [-2, 60, 92]]) s += line([[x0, cy + 16.5, z0], [x0 + 1.5, cy + 16.4, z1]], "#6E4730", 1.2);
    s += k.shape(FR(cy + 17.5), arch(-7, 7, 2, 22, 28), "#5E3E26", 1.3) + ball(4, cy + 17.6, 13, 1.2, GOLD, 0.8, 0);
    // デッキ
    s += cyl(0, cy, 92, 46, 5, "#B99060", "#D9B27C", 1.5);
    for (let a = -1.6; a < 1.9; a += 0.4) s += rod([[Math.cos(a - 0.8) * 45, cy + Math.sin(a - 0.8) * 45, 97], [Math.cos(a - 0.8) * 45, cy + Math.sin(a - 0.8) * 45, 108]], "#A88457", 1.4);
    // こや
    // はっぱ（うしろ）
    for (const [x, y, z, r] of [[-30, cy - 34, 150, 26], [20, cy - 38, 160, 28], [-4, cy - 26, 176, 24], [-46, cy - 8, 140, 18]]) s += egg(x, y, z, r, r * 0.8, r * 0.72, rg([[0, "#A9D69A"], [0.7, "#7FB06A"], [1, "#5F8F55"]], 0.35, 0.3, 0.85), 1.3);
    s += box(-20, cy - 22, 36, 30, 97, 30, ["#F3E2C2", "#D9C29A", "#FFF0D8"]);
    const RG = cy - 7, RZ = 146;
    s += k.poly([[16, cy - 24, 125], [16, cy + 10, 125], [16, RG, RZ]], "#D9C29A", 1.4) + k.poly([[-24, cy + 10, 125], [18, cy + 10, 125], [18, RG, RZ], [-24, RG, RZ]], "#E0473F", 1.5) + k.poly([[18, cy + 10, 125], [18, RG, RZ], [19, RG, RZ - 1], [19, cy + 10, 124]], "#B8342E", 1.1);
    for (let u = 0.25; u < 1; u += 0.25) s += k.line([[-24, cy + 10 - u * 17, 125 + u * 21], [18, cy + 10 - u * 17, 125 + u * 21]], "#C9382F", 1.1);
    s += shape(FR(cy + 8.1), ov(TREE.winX - 4, TREE.winZ - 2, 6, 6, 20), "#5E3E26", 1.3);
    s += lineOn(FR(cy + 8.2), close(ov(TREE.winX - 4, TREE.winZ - 2, 6.6, 6.6, 20)), "#FFFFFF", 1.6);
    // はっぱ（うしろ と まえ）
    for (const [x, y, z, r] of [[38, cy - 6, 142, 18], [-38, cy + 10, 132, 14]]) s += egg(x, y, z, r, r * 0.8, r * 0.75, rg([[0, "#A9D69A"], [0.7, "#7FB06A"], [1, "#5F8F55"]], 0.35, 0.3, 0.85), 1.3);
    for (const [x, y, z, c] of [[30, cy + 10, 128, "#E0453D"], [-36, cy + 14, 122, "#F29A3B"], [44, cy - 2, 124, "#E0453D"]]) s += line([[x, y, z + 8], [x, y, z + 3]], "#6B4E33", 1.2) + ball(x, y, z, 4, c, 1.2, 0.55);
    // なわばしご
    for (const x of [24, 34]) s += line([[x, cy + 44, 94], [x + 2, cy + 46, 0]], "#C9A16E", 1.6);
    for (let z = 12; z < 92; z += 12) s += line([[24 + (z / 94) * 0, cy + 44 + (1 - z / 94) * 2, z], [34 + (1 - z / 94) * 2, cy + 44 + (1 - z / 94) * 2, z]], "#A88457", 2);
    return s;
  };

  // ================= ガソリンスタンド =================
  M.shop_gasstand_5 = (k) => {
    // タイヤの スツール: タイヤを 2つ（みぞ・ホイール）・うえに あかい まるい ざぶとん（ボタン）
    const { cyl, dome, shape, TP, lineOn, at, shadow, ball, egg } = k, cy = -24;
    let s = shadow(0.14, 3, 22);
    for (const z of [0, 15]) {
      s += cyl(0, cy, z, 22, 14, "#4A4550", "#5E5864", 1.5);
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 4 - 1.4 + i * 0.35; s += k.line([[Math.cos(a) * 22.1, cy + Math.sin(a) * 22.1, z + 2], [Math.cos(a) * 22.1, cy + Math.sin(a) * 22.1, z + 12]], "#2E2B33", 1.6); }
      s += shape(TP(z + 14.1), ov(0, cy, 13, 13, 28), "#7C7684", 1.1) + shape(TP(z + 14.15), ov(0, cy, 9, 9, 24), CHROME[0], 1) + shape(TP(z + 14.2), ov(0, cy, 3, 3, 12), CHROME[1], 0.9);
    }
    s += egg(0, cy, 33, 20, 20, 6, "#E0473F", 1.5) + ball(0, cy, 38.5, 1.8, "#B8342E", 0.9, 0) + lineOn(TP(36), close(ov(0, cy, 15, 15, 24)), "#F07A70", 1, 'stroke-dasharray="1.6 1.6"');
    return s;
  };
  M.shop_gasstand_10 = (k) => {
    // きゅうゆきの ランプ: あかい レトロな きゅうゆき（しろい まど・まるい メーター）・くろい ホースと ノズル・うえの まるい ガラス（ひかる）
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, egg, ball, rod, at, onP, shadow, L, line } = k;
    let s = shadow(0.13, 3, 8) + box(-22, -38, 44, 36, 0, 8, ["#9AA6B0", "#7C8892", "#BAC4CC"]);
    s += box(-19, -35, 38, 30, 8, 76, ["#E0473F", "#B8342E", "#EC6A60"]) + box(-21, -37, 42, 34, 84, 4, ["#FFFFFF", "#E5E5E5", "#FFFFFF"]);
    s += shape(FR(-4.9), rr(-14, 50, 28, 26, 4), "#FFF8EC", 1.3) + shape(FR(-4.8), ov(0, 63, 9, 9, 28), "#FFFFFF", 1.2);
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.15 + (i / 6) * 0.7); s += lineOn(FR(-4.75), [[Math.cos(a) * 7, 63 + Math.sin(a) * 7], [Math.cos(a) * 8.4, 63 + Math.sin(a) * 8.4]], INK, 0.9); }
    s += L(lineOn(FR(-4.7), [[0, 63], [4, 68]], "#E0473F", 1.4));
    s += shape(FR(-4.9), rr(-12, 24, 24, 16, 3), "#FFF3B0", 1.2) + onP(FR(-4.8), -9, 37, 18, 10, `<path d="M3,9 Q2,4 5,2 Q8,0 9,4 Q10,1 13,2 Q16,4 15,9 Z" fill="#F29A3B" ${S(0.8)}/>`);
    s += line([[19, -20, 50], [26, -20, 40], [28, -16, 18], [24, -12, 8]], INK, 4) + line([[19, -20, 50], [26, -20, 40], [28, -16, 18], [24, -12, 8]], "#3F3B44", 2.4);
    s += box(19, -24, 4, 8, 56, 12, ["#3F3B44", "#2E2B33", "#55505C"], 1.1) + rod([[23, -20, 62], [27, -20, 58]], "#9AA6B0", 2);
    s += cyl(0, -20, 88, 8, 3, CHROME[1], CHROME[0], 1.2);
    s += egg(0, -20, 103, 14, 14, 13, k.rg([[0, "#FFFFFF"], [0.7, "#FFF6E0"], [1, "#F2DFC0"]], 0.35, 0.3, 0.8), 1.5) + band(k, 0, -20, 14.1, 99, 107, 99, 6, 0, "#E0473F");
    return s;
  };
  M.shop_gasstand_15 = (k) => {
    // くるまの ベッド: あかい レーシングカー（まえの ライト・よこの ナンバー・タイヤ・うしろの はね）・なかに ふとんと まくら
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, ball, rod, at, onP, shadow, egg, slab, lg } = k;
    const RED = ["#E0473F", "#B8342E", "#EC6A60"];
    let s = shadow(0.14, 2, 16);
    const wheel = (x, y) => k.prism(SD(x), ov(y, 12, 12, 12, 24), [-10, 0, 0], "#3F3B44", "#2E2B33", 1.4) + shape(SD(x + 0.1), ov(y, 12, 6.4, 6.4, 18), CHROME[0], 1.1) + shape(SD(x + 0.2), ov(y, 12, 2.4, 2.4, 10), CHROME[1], 0) + k.lineOn(SD(x + 0.15), close(ov(y, 12, 9.6, 9.6, 20)), "#5E5864", 1);
    s += wheel(-40, -76) + wheel(44, -76);
    // うしろの はね
    s += box(-68, -70, 6, 4, 22, 22, ["#3F3B44", "#2E2B33", "#55505C"]) + box(-68, -12, 6, 4, 22, 22, ["#3F3B44", "#2E2B33", "#55505C"]) + box(-70, -74, 14, 68, 42, 5, RED);
    s += box(-62, -72, 124, 68, 6, 26, RED);
    s += prism(SD(62), [[-72, 6], [-4, 6], [-4, 24], [-14, 32], [-62, 32], [-72, 24]], [-10, 0, 0], RED[0], RED[1], 1.5);
    s += box(-58, -68, 98, 60, 32, 6, ["#FFFFFF", "#E5E5E5", "#FFFFFF"]);
    s += prism(TP(46), rr(-30, -66, 70, 56, 6), [0, 0, -8], "#7EAAD0", "#5E8AB0") + k.lineOn(TP(46.1), [[-30, -40], [40, -40]], "#FFFFFF", 2) + shape(FR(-9.9), [[-30, 38], [40, 38], ...scallop(-30, 40, 32, 3)], "#7EAAD0", 1.2);
    s += egg(-46, -38, 42, 10, 22, 6, "#FFFFFF", 1.3);
    s += shape(FR(-3.9), rr(-54, 8, 108, 6, 2), "#FFFFFF", 0) + onP(FR(-3.8), -10, 26, 20, 18, `<circle cx="10" cy="9" r="8" fill="#FFFFFF" ${S(1.2)}/><path d="M8,4 L11,3 V15" fill="none" ${S(1.8)}/>`);
    s += onP(SD(62.1), -64, 26, 12, 8, `<rect x="0" y="0" width="12" height="7" rx="2" fill="#FFF3B0" ${S(1)}/>`) + onP(SD(62.1), -14, 26, 12, 8, `<rect x="0" y="0" width="12" height="7" rx="2" fill="#FFF3B0" ${S(1)}/>`);
    s += wheel(-40, -6) + wheel(44, -6);
    return s;
  };
  // スロープを ころがる ミニカー（live の とき FurnLive が うごかす）
  const RAMP = [[54, -32, 74], [54, 0, 6]];
  // ライオンの かお（2D の え。たてがみ・みみ・ほっぺ）: よこ はば 2R、した はしが 0
  const lionSvg = (R) => {
    const cy = -R, f = R * 0.64, mane = Array.from({ length: 50 }, (_, i) => { const t = (i / 50) * TAU, r = R * (1 + 0.1 * Math.cos(t * 10)); return `${(Math.cos(t) * r).toFixed(1)},${(cy + Math.sin(t) * r).toFixed(1)}`; }).join(" ");
    return `<polygon points="${mane}" fill="#E8913A" ${S(1.4)}/>` +
      [-1, 1].map((sx) => `<circle cx="${sx * f * 0.78}" cy="${cy - f * 0.78}" r="${f * 0.3}" fill="#F7D56A" ${S(1.1)}/><circle cx="${sx * f * 0.78}" cy="${cy - f * 0.78}" r="${f * 0.14}" fill="#F2A7B8"/>`).join("") +
      `<circle cy="${cy}" r="${f}" fill="#F7D56A" ${S(1.3)}/>` +
      [-1, 1].map((sx) => `<circle cx="${sx * f * 0.36}" cy="${cy - f * 0.14}" r="${f * 0.1}" fill="${INK}"/><ellipse cx="${sx * f * 0.58}" cy="${cy + f * 0.26}" rx="${f * 0.16}" ry="${f * 0.1}" fill="#F7A1B0" opacity=".8"/>`).join("") +
      `<ellipse cy="${cy + f * 0.36}" rx="${f * 0.36}" ry="${f * 0.26}" fill="#FFF3CF"/><path d="M${-f * 0.14},${cy + f * 0.16} h${f * 0.28} l${-f * 0.14},${f * 0.15} Z" fill="${INK}"/>` +
      `<path d="M0,${cy + f * 0.31} v${f * 0.12} M${-f * 0.2},${cy + f * 0.5} Q0,${cy + f * 0.62} ${f * 0.2},${cy + f * 0.5}" fill="none" ${S(1)}/>`;
  };
  M.shop_gasstand_30 = (k) => {
    // ライオンの ガレージ: はいいろの だい（みちの せん）・3だんの ちゅうしゃじょう（だんごとに ふちの いろ・はしら・ミニカー）・ななめの スロープ・エレベーター・
    // おくじょうの ライオンの え・きゅうゆき・うえの ライオンの かんばん
    const { box, shape, FR, TP, lineOn, rod, at, shadow, L, poly, egg } = k;
    const TOP = "#DCDFE4", EDGE = ["#F7D56A", "#F2A7B8", "#A9D6C2"];
    let s = shadow(0.12, 2, 8) + box(-76, -102, 152, 100, 0, 6, ["#9AA6B0", "#7C8892", "#BAC4CC"]);
    for (let x = -66; x < 70; x += 18) s += shape(TP(6.1), rect(x, -10, 10, 2.4), "#FFFFFF", 0);
    const car = (x, y, z, c) => box(x - 7, y - 4, 14, 8, z + 2, 4, [c, shade(c, -0.18), shade(c, 0.15)], 1) + box(x - 4, y - 3.4, 8, 6.8, z + 6, 3.4, ["#BFE3EE", "#9CC7E6", "#DDF4FB"], 0.9) + shape(FR(y + 4.1), ov(x - 4, z + 2, 1.8, 1.8, 8), INK, 0) + shape(FR(y + 4.1), ov(x + 4, z + 2, 1.8, 1.8, 8), INK, 0);
    // エレベーター（おく）
    s += box(-72, -96, 22, 22, 6, 110, ["#F7D56A", "#D9B240", "#FBE59A"]) + shape(FR(-73.9), rr(-68, 14, 14, 92, 2), "#5E5864", 1.2);
    for (const z of [30, 64, 98]) s += shape(FR(-73.8), rr(-65, z, 8, 4, 1.5), "#FFF3CF", 0.9);
    for (const [lv, z] of [[0, 6], [1, 40], [2, 74]]) {
      s += box(-46, -96, 92, 72, z, 4, [EDGE[lv], shade(EDGE[lv], -0.16), TOP]);
      if (lv) for (const [x, y] of [[-44, -94], [42, -94], [-44, -28], [42, -28]]) s += box(x, y, 3, 3, z - 30, 30, ["#C9CFD6", "#A7AFB8", "#E1E6EA"], 1.1);
      for (const x of [-30, -6, 18]) s += lineOn(TP(z + 4.1), [[x, -90], [x, -60]], "#FFFFFF", 1.4);
      s += lineOn(TP(z + 4.1), [[-40, -42], [36, -42]], "#F7D56A", 1.2);
      s += car(-18 + lv * 12, -76, z + 4, ["#9CC7E6", "#F2A7B8", "#A9D6C2"][lv]) + car(14 - lv * 8, -50, z + 4, ["#F7D56A", "#E0473F", "#C9B6E0"][lv]);
    }
    // おくじょう: あかい ふち・まんなかに ライオンの かお（うえから 見た え）
    s += box(-46, -96, 92, 72, 108, 4, ["#E0473F", "#B8342E", TOP]) + box(-50, -98, 100, 6, 112, 4, ["#FFFFFF", "#E1E6EA", "#F4EFE8"]);
    const lc = [6, -58], z1 = 112.1, R = 21;
    s += shape(TP(z1), Array.from({ length: 50 }, (_, i) => { const t = (i / 50) * TAU, r = R * (1 + 0.1 * Math.cos(t * 10)); return [lc[0] + Math.cos(t) * r, lc[1] + Math.sin(t) * r]; }), "#E8913A", 1.3);
    for (const sx of [-1, 1]) s += shape(TP(z1), ov(lc[0] + sx * 10.5, lc[1] - 10.5, 4.6, 4.6, 16), "#F7D56A", 1.1) + shape(TP(z1), ov(lc[0] + sx * 10.5, lc[1] - 10.5, 2.2, 2.2, 12), "#F2A7B8", 0);
    s += shape(TP(z1), ov(lc[0], lc[1], 13.5, 13.5, 32), "#F7D56A", 1.3) + shape(TP(z1), ov(lc[0], lc[1] + 5, 6, 4.4, 20), "#FFF3CF", 0);
    for (const sx of [-1, 1]) s += shape(TP(z1), ov(lc[0] + sx * 5, lc[1] - 2.4, 1.5, 1.5, 10), INK, 0) + shape(TP(z1), ov(lc[0] + sx * 8, lc[1] + 3.6, 2.2, 1.4, 12), "#F7A1B0", 0);
    s += shape(TP(z1), [[lc[0] - 2.2, lc[1] + 2.2], [lc[0] + 2.2, lc[1] + 2.2], [lc[0], lc[1] + 4.4]], INK, 0) + lineOn(TP(z1), [[lc[0] - 3, lc[1] + 7], [lc[0], lc[1] + 8.4], [lc[0] + 3, lc[1] + 7]], INK, 1);
    // スロープ（まえ みぎ）
    s += poly([[48, -34, 74], [60, -34, 74], [60, 2, 6], [48, 2, 6]], "#DDD7CB", 1.4) + poly([[60, -34, 74], [60, 2, 6], [60, 2, 3], [60, -34, 71]], "#A9A193", 1.3);
    for (let i = 1; i < 6; i++) { const u = i / 6; s += k.line([[48, -34 + u * 36, 74 - u * 68], [60, -34 + u * 36, 74 - u * 68]], "#FFFFFF", 1.1); }
    s += rod([[61, -34, 80], [61, 2, 12]], "#E0473F", 1.6) + rod([[61, -34, 74], [61, -34, 80]], "#E0473F", 1.4) + rod([[61, 2, 6], [61, 2, 12]], "#E0473F", 1.4);
    s += L(car(54, -16, 40, "#F29A3B"));
    // きゅうゆき と ライオンの かんばん
    s += box(-70, -26, 10, 10, 6, 22, ["#E0473F", "#B8342E", "#EC6A60"], 1.2) + egg(-65, -21, 32, 5, 5, 4, "#FFFFFF", 1.1);
    s += rod([[-30, -97, 116], [-30, -97, 128]], "#7C8892", 2) + at(-30, -97, 128, lionSvg(15), 18, 32);
    return s;
  };

  // ================= ゆうびんきょく =================
  M.shop_postoffice_5 = (k) => {
    // まるい ポストの ちょきんばこ: あかい まるい ポスト・てがみの いれぐち・〒の ふだ・うえの まるい ぼうし
    const { cyl, dome, shape, FR, onP, shadow, egg, lineOn, TP } = k, cy = -17;
    let s = shadow(0.14, 4, 14) + cyl(0, cy, 0, 15, 4, "#4A4550", "#5E5864", 1.3) + cyl(0, cy, 4, 13, 56, "#E0473F", "#EC6A60", 1.5);
    s += lineOn(k.FR(cy + 12.4), [[-8, 30], [-6, 54]], "#F28B82", 2.4);
    s += cyl(0, cy, 60, 15.5, 4, "#C9382F", "#E5574C", 1.4) + dome(0, cy, 64, 14.5, 14.5, 12, "#E0473F", 1.4);
    s += onP(FR(cy + 13.1), -7, 52, 14, 6, `<rect x="0" y="0" width="14" height="5" rx="1.5" fill="#3B2B2B" ${S(1)}/>`);
    s += onP(FR(cy + 13.1), -6, 38, 12, 12, `<rect x="0" y="0" width="12" height="12" rx="2" fill="#FFFFFF" ${S(1)}/><path d="M3,3 H9 M3,5.4 H9 M6,5.4 V10" fill="none" stroke="#E0473F" stroke-width="1.4" stroke-linecap="round"/>`);
    return s;
  };
  M.shop_postoffice_10 = (k) => {
    // てがみの かきもの づくえ: きの つくえ・うしろの てがみの たな（いろとりどりの ふうとう）・びんせん・インクと はね・きっての シート・ハートの ふうとう
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, ball, rod, at, onP, shadow, slab } = k;
    const WOOD = ["#C9A26E", "#A88457", "#DDBD8A"];
    let s = shadow(0.12, 3, 6);
    for (const [x, y] of [[-46, -50], [40, -50], [-46, -8], [40, -8]]) s += box(x, y, 6, 6, 0, 62, WOOD);
    s += box(-44, -48, 88, 40, 52, 8, WOOD) + shape(FR(-7.9), rr(-14, 54, 28, 4.5, 1.5), "#B99060", 1) + ball(0, -7.6, 56, 1.2, GOLD, 0.8, 0);
    s += prism(TP(64), rr(-48, -52, 96, 50, 3), [0, 0, -4], "#DDBD8A", "#A88457");
    // てがみの たな
    s += box(-40, -50, 80, 14, 64, 26, WOOD);
    const cols = ["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2", "#FFFFFF", "#C9B6E0"];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const x = -38 + i * 15.6, z = 66 + j * 12;
      s += shape(FR(-35.9), rect(x, z, 13.6, 10.4), "#7A5634", 1) + shape(FR(-35.8), rect(x + 2, z, 9.6, 6 + ((i + j) % 3) * 1.4), cols[(i + j * 2) % cols.length], 0.9);
    }
    s += box(-40, -50, 80, 14, 90, 3, WOOD);
    // つくえの うえ
    const { m, s: pad } = slab([-30, -10, 64.5], [1, 0.08, 0], [0, -0.7, 0.05], rr(0, 0, 24, 18, 1.5), 0.8, "#FFFDF6", "#E5DED0", 1);
    s += pad + k.lineOn(m, [[3, 4], [20, 4]], "#9CC7E6", 0.8) + k.lineOn(m, [[3, 8], [20, 8]], "#9CC7E6", 0.8) + k.lineOn(m, [[3, 12], [16, 12]], "#9CC7E6", 0.8);
    s += cyl(6, -24, 64, 3.6, 6, "#3F3B55", "#5A5570", 1.1) + at(6, -24, 70, `<path d="M0,0 Q-3,-10 -1,-20 Q3,-12 0,0 Z" fill="#FFFFFF" ${S(0.9)}/><path d="M-0.4,-2 Q-1,-10 -0.6,-17" fill="none" stroke="#C9C9D2" stroke-width=".7"/>`, 5, 22);
    s += k.box(16, -28, 18, 12, 64, 0.8, ["#FFF3D0", "#E5D8B5", "#FFF8E6"], 0.8);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += shape(TP(64.9), rect(17.5 + i * 5.6, -26.5 + j * 5.6, 4.4, 4.4), ["#F2A7B8", "#9CC7E6", "#A9D6C2"][(i + j) % 3], 0.6);
    s += box(-6, -20, 18, 12, 64, 1.2, ["#FFFFFF", "#E5E5E5", "#FFFFFF"], 0.9) + shape(TP(65.3), heart(3, -14, 2.6, 16), "#E0473F", 0.7);
    return s;
  };
  M.shop_postoffice_15 = (k) => {
    // しわけの たな: たかい きの たな（4だん × 6れつ の こべや）・いろとりどりの てがみと こづつみ・うえの ふうとうの かんばん
    const { box, prism, shape, FR, SD, TP, lineOn, at, onP, shadow } = k;
    const WOOD = ["#B39767", "#8C704B", "#CAAE7E"], CW = 19, CH = 27;
    let s = shadow(0.1, 2, 4) + shape(FR(-40), rect(-59, 3, 118, 108), "#6E5039", 1.5);
    const cols = ["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2", "#FFFFFF", "#C9B6E0", "#F29A5B"];
    // れつごとに ひだりの いた → だんの いた → なかみ（まえの いたが あとから かさなる）
    for (let i = 0; i < 6; i++) {
      const x0 = -60 + i * CW;
      s += box(x0, -40, 2.6, 40, 0, 111, WOOD);
      for (let j = 0; j < 4; j++) {
        const z = j * CH, c = cols[(i * 3 + j * 2) % cols.length];
        s += box(x0 + 2.6, -40, CW - 2.6, 40, z, 3, WOOD);
        if ((i + j) % 4 === 3) s += box(x0 + 4, -30, 14, 22, z + 3, 13, ["#D9AE76", "#B98F58", "#E8C590"], 1.1) + shape(FR(-7.9), rect(x0 + 9.4, z + 5, 3, 11), "#C9A15E", 0);
        else for (let n = 0; n < 3; n++) s += box(x0 + 4.4 + n * 4.6, -28, 3.6, 20, z + 3, 14 + ((i + n) % 3) * 2.4, [c, shade(c, -0.15), "#FFFFFF"], 0.9);
      }
    }
    s += box(54, -40, 6, 40, 0, 111, WOOD) + box(-62, -42, 124, 42, 108, 6, WOOD);
    s += onP(FR(-1), -16, 128, 32, 14, `<rect x="0" y="0" width="32" height="13" rx="3" fill="#E0473F" ${S(1.2)}/><rect x="9" y="2.6" width="14" height="8" rx="1" fill="#FFFFFF" ${S(0.9)}/><path d="M9,2.6 L16,7.4 L23,2.6" fill="none" ${S(0.9)}/>`);
    s += k.rod([[-12, -1, 114], [-12, -1, 116]], INK, 1) + k.rod([[12, -1, 114], [12, -1, 116]], INK, 1);
    return s;
  };
  // とけいの はり（live の とき FurnLive が ほんとうの じこくで 描く）・かね
  const TOWER = { cx: 0, cy: -47, clockZ: 132, r: 13 };
  M.shop_postoffice_30 = (k) => {
    // あかい とけいとうの ポスト: いしの だん・あかい とう（いれぐち・〒・ちいさな ドア）・まえと みぎの とけい・かねの へや（きんの かね）・とんがり やね・ふうとうの かざみどり
    const { box, prism, shape, FR, SD, TP, lineOn, cyl, frustum, dome, egg, ball, rod, at, onP, shadow, L, lathe, poly } = k, { cx, cy, clockZ, r } = TOWER;
    const RED = ["#E0473F", "#B8342E", "#EC6A60"], STONE = ["#C9C2B4", "#A9A193", "#DDD7CB"];
    let s = shadow(0.12, 2, 10);
    s += box(-50, -94, 100, 90, 0, 6, STONE) + box(-42, -86, 84, 76, 6, 6, STONE);
    s += box(-30, -77, 60, 60, 12, 138, RED);
    for (const z of [40, 100]) s += lineOn(FR(-16.9), [[-30, z], [30, z]], "#C9382F", 2.4) + lineOn(SD(30.1), [[-77, z], [-17, z]], "#A8302A", 2.4);
    s += onP(FR(-16.8), -12, 92, 24, 8, `<rect x="0" y="0" width="24" height="6" rx="2" fill="#3B2B2B" ${S(1.1)}/>`);
    s += onP(FR(-16.8), -8, 80, 16, 16, `<rect x="0" y="0" width="16" height="16" rx="3" fill="#FFFFFF" ${S(1.1)}/><path d="M4,4 H12 M4,7 H12 M8,7 V13" fill="none" stroke="#E0473F" stroke-width="1.8" stroke-linecap="round"/>`);
    s += shape(FR(-16.85), arch(-10, 10, 12, 40, 48), "#8C2A25", 1.3) + ball(6, -16.7, 26, 1.4, GOLD, 0.9, 0);
    // とけい
    for (const [pl, c0] of [[FR(-16.7), cx], [SD(30.1), cy]]) s += shape(pl, ov(c0, clockZ, r + 3, r + 3, 32), GOLD, 1.4) + shape(pl, ov(c0, clockZ, r, r, 32), "#FFFDF4", 1.2);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; s += shape(FR(-16.65), ov(cx + Math.sin(a) * (r - 2.6), clockZ + Math.cos(a) * (r - 2.6), i % 3 ? 0.7 : 1.2, i % 3 ? 0.7 : 1.2, 8), INK, 0) + shape(SD(30.15), ov(cy + Math.sin(a) * (r - 2.6), clockZ + Math.cos(a) * (r - 2.6), i % 3 ? 0.7 : 1.2, i % 3 ? 0.7 : 1.2, 8), INK, 0); }
    s += L(clockHands(k, 10, 10));
    // かねの へや
    s += box(-32, -79, 64, 64, 150, 4, ["#FFF3D0", "#E5D8B5", "#FFF8E6"]);
    for (const [x, y] of [[-30, -77], [26, -77]]) s += box(x, y, 4, 4, 154, 34, ["#FFF3D0", "#E5D8B5", "#FFF8E6"], 1.2);
    s += L(rod([[cx, cy + 10, 186], [cx, cy + 10, 182]], "#7A6A5A", 1.2) + frustum(cx, cy + 10, 166, 9, 181, 4, GOLDD, GOLD, 1.3) + ball(cx, cy + 10, 165, 2.4, GOLDD, 1, 0));
    for (const [x, y] of [[-30, -21], [26, -21]]) s += box(x, y, 4, 4, 154, 34, ["#FFF3D0", "#E5D8B5", "#FFF8E6"], 1.2);
    s += box(-36, -83, 72, 72, 188, 4, RED);
    const E = 38, apex = [cx, cy, 220];
    s += poly([[cx + E, cy - E, 192], [cx + E, cy + E, 192], apex], RED[1], 1.5) + poly([[cx - E, cy + E, 192], [cx + E, cy + E, 192], apex], RED[2], 1.5);
    for (let i = 1; i < 5; i++) { const u = i / 5; s += k.line([[cx - E * (1 - u), cy + E * (1 - u), 192 + 28 * u], [cx + E * (1 - u), cy + E * (1 - u), 192 + 28 * u]], "#C9382F", 1.1); }
    s += rod([[cx, cy, 220], [cx, cy, 232]], "#7A6A5A", 1.6) + at(cx, cy, 230, `<rect x="-6" y="-8" width="12" height="8" rx="1" fill="#FFFFFF" ${S(1)}/><path d="M-6,-8 L0,-4 L6,-8" fill="none" ${S(0.9)}/>`, 7, 9);
    return s;
  };
  function clockHands(k, hr, mn) {
    const { cx, cy, clockZ } = TOWER, a1 = (hr % 12 + mn / 60) / 12 * TAU, a2 = mn / 60 * TAU;
    return k.lineOn(k.FR(-16.6), [[cx, clockZ], [cx + Math.sin(a1) * 6.4, clockZ + Math.cos(a1) * 6.4]], INK, 1.8) + k.lineOn(k.FR(-16.6), [[cx, clockZ], [cx + Math.sin(a2) * 9.4, clockZ + Math.cos(a2) * 9.4]], INK, 1.2) +
      k.lineOn(k.SD(30.2), [[cy, clockZ], [cy + Math.sin(a1) * 6.4, clockZ + Math.cos(a1) * 6.4]], INK, 1.8) + k.lineOn(k.SD(30.2), [[cy, clockZ], [cy + Math.sin(a2) * 9.4, clockZ + Math.cos(a2) * 9.4]], INK, 1.2);
  }

  for (const [id, fn] of Object.entries(M)) if (FURN_INDEX[id]) FurnModels.register(id, fn);

  // ================= さわる（FurnLive）=================
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; P.d = dm.d; return P;
  };
  const since = (st) => G.t - st.t0;
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };
  const tone = (list, step = 0.09, type = "triangle", vol = 0.11) => { if (typeof Sound !== "undefined" && Sound.ctx && Save.d?.settings?.se) list.forEach((f, i) => f && Sound.tone(Sound.seGain, { ...(Array.isArray(f) ? { f: f[0], f2: f[1] } : { f }), t: i * step, dur: 0.14, type, vol, a: 0.005, r: 0.28 })); };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const lampOn = (st) => (st.on == null ? typeof DayTint !== "undefined" && DayTint.isNight() : st.on);
  const ink = (ctx, w) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round"; };
  const path = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
  // タップの あとの こうか（dur びょう）
  const FXS = {
    heart(ctx, P, st, x, y, z, dur = 1.4) { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { const c = P(x - 10 + i * 10, y, z + k * 26 + i * 4); FX.heart(ctx, c.x + Math.sin(k * 7 + i) * 4 * P.s, c.y, 6 * P.s, ["#F06292", "#F7A1B0", "#FFB3C1"][i]); } ctx.restore(); },
    note(ctx, P, st, x, y, z, dur = 1.6) { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k; for (let i = 0; i < 2; i++) { const c = P(x - 6 + i * 12, y, z + k * 30 + i * 8); FX.note(ctx, c.x + Math.sin(k * 6 + i * 2) * 5 * P.s, c.y); } ctx.restore(); },
    spark(ctx, P, st, x, y, z, dur = 1.1) { const k = since(st) / dur; if (k < 0 || k >= 1) return; const c = P(x, y, z); ctx.save(); ctx.globalAlpha = 1 - k; FX.sparkles(ctx, c.x, c.y, k); ctx.restore(); },
    puff(ctx, P, st, x, y, z, dur = 1.8) { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); for (let i = 0; i < 4; i++) { const u = (k * 1.4 + i / 4) % 1, c = P(x + Math.sin(u * 5 + i) * 5, y, z + u * 30); ctx.globalAlpha = (1 - u) * (1 - k * 0.6) * 0.9; ctx.fillStyle = "#FFFFFF"; ink(ctx, 1.1); ctx.beginPath(); ctx.arc(c.x, c.y, (2.4 + u * 4) * P.s, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); },
    bubble(ctx, P, st, x, y, z, dur = 2) { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); for (let i = 0; i < 6; i++) { const u = (k * 1.3 + i / 6) % 1, c = P(x + Math.sin(u * 7 + i * 2) * 8, y, z + u * 34); ctx.globalAlpha = (1 - u) * 0.9; ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.strokeStyle = "#9CC7E6"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, (1.6 + (i % 3)) * P.s, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); },
    petal(ctx, P, st, x, y, z, dur = 2.2) { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); for (let i = 0; i < 7; i++) { const u = (k + i / 7) % 1, c = P(x - 30 + i * 10 + Math.sin(u * 6 + i) * 6, y, z - u * 40); ctx.globalAlpha = (1 - k) * 0.95; ctx.fillStyle = ["#F7B9C9", "#FFFFFF", "#F2A7B8"][i % 3]; ink(ctx, 0.8); ctx.beginPath(); ctx.ellipse(c.x, c.y, 2.6 * P.s, 1.5 * P.s, u * 6 + i, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); },
  };
  // かんたんな さわりかた: ひとこと・おと・こうか
  const simple = (id, lines, fx, pt, notes = [523, 659, 784]) => FurnLive.register(id, {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone(notes); say(sc, it, lines[st.n % lines.length], fx === "heart" || fx === "petal" ? "heart" : "note"); },
    draw(ctx, sc, it, r, st) { if (since(st) < 2.4) FXS[fx](ctx, mapper(sc, it, r), st, ...pt); },
  });
  // あかり: タップで つく／きえる（よるは はじめから つく）。ひかる ところ pts・まわりを てらす light
  const lamp = (id, { pts, rgb, lines, rr = 30, big = 110, extra = null, live = false }) => FurnLive.register(id, {
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [784, 988, 1175] : [659, 523], 0.07, "sine", 0.09); say(sc, it, st.on ? lines[0] : lines[1], st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), on = lampOn(st), k = st.t0 < 0 ? 1 : Math.min(1, since(st) * 3);
      if (extra) extra(ctx, P, st, on);
      if (!on) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [x, y, z, rad = rr] of pts) { const c = P(x, y, z); glow(ctx, c.x, c.y, rad * P.s, rgb, 0.42 * k); }
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const P = mapper(sc, it, r), [x, y, z] = pts[0], c = P(x, y, z); glow(ctx, c.x, c.y, big * P.s, rgb, 0.28); },
  }, live);
  // つやの ある たま（canvas）
  const shiny = (ctx, x, y, r, c0, c1) => { const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ink(ctx, Math.max(1, r * 0.14)); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.3, r * 0.17, -0.6, 0, TAU); ctx.fill(); };

  // ---- バーガーやさん ----
  simple("shop_burger_5", ["もちもちの バンズ！", "チーズが とろ〜り", "おなかが すいて きちゃう"], "heart", [0, -23, 50]);
  lamp("shop_burger_10", { pts: [[0, -19, 84, 26], [0, -19, 66, 18]], rgb: "255,214,110", lines: ["ポテトが ぴかっ！", "ポテト おやすみ"] });
  simple("shop_burger_15", ["いらっしゃいませ〜！", "ここで シェイク のもう", "あかい ソファ ふかふか"], "note", [6, -24, 70], [988, 784]);
  // ネオン: タップで つく／きえる（よるは はじめから）。ついて いる ときは シェイクの マシンが まわる
  FurnLive.register("shop_burger_30", {
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [523, 659, 784, 1047] : [784, 523], 0.1, "square", 0.05); say(sc, it, st.on ? "ネオンが ぴかぴか！" : "おみせ おやすみ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), on = lampOn(st), t = G.t, s = P.s;
      ["#F7C6D6", "#FFF1B8", "#BFE3EE"].forEach((c, i) => {
        const dx = [-6, 0, 6][i], wob = on ? Math.sin(t * 22 + i * 2) * 0.9 : 0, b = P(MIXER.x + dx + wob, MIXER.y + 4, 64), tp = P(MIXER.x + dx + wob, MIXER.y + 4, 78);
        ctx.fillStyle = c; ink(ctx, 1); ctx.beginPath(); ctx.moveTo(b.x - 2.6 * s, b.y); ctx.lineTo(tp.x - 3.4 * s, tp.y); ctx.lineTo(tp.x + 3.4 * s, tp.y); ctx.lineTo(b.x + 2.6 * s, b.y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(tp.x, tp.y, 3.4 * s, 1.6 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      });
      if (!on) return;
      const flick = since(st) < 0.6 ? (Math.sin(since(st) * 60) > 0 ? 1 : 0.3) : 0.85 + Math.sin(t * 3) * 0.1;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [x, z, rgb, rad] of [[0, 104, "255,140,190", 34], [0, 92, "180,240,160", 20], [-34, 116, "255,230,140", 10], [34, 88, "160,220,255", 10]]) { const c = P(x, -55.5, z); glow(ctx, c.x, c.y, rad * s, rgb, 0.5 * flick); }
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const P = mapper(sc, it, r), c = P(0, -50, 100); glow(ctx, c.x, c.y, 130 * P.s, "255,150,200", 0.26); },
  }, true);

  // ---- びようしつ ----
  // サインポール: しまは いつも ゆっくり まわる（タップで はやく）。よるは ほんのり ひかる
  const stripePts = (P, cx, cy, r, z0, z1, lo, wd, pitch) => {
    const n = 18, A = -Math.PI / 4, B = (3 * Math.PI) / 4, z = (a, off) => Math.max(z0, Math.min(z1, lo + off + pitch * a)), pts = [];
    for (let i = 0; i <= n; i++) { const a = A + ((B - A) * i) / n; pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z(a, 0))); }
    for (let i = n; i >= 0; i--) { const a = A + ((B - A) * i) / n; pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z(a, wd))); }
    return pts;
  };
  FurnLive.register("shop_groom_5", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 784, 988, 784], 0.08, "sine", 0.08); say(sc, it, ["くるくる まわってる〜", "かみを きる おみせの しるし！", "あか・あお・しろ！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), fast = since(st) < 3 ? 4 : 1, off = ((G.t * 9 * fast) % 24 + 24) % 24;
      for (let i = -4; i < 9; i++) { path(ctx, stripePts(P, 0, -16, 10.5, 16, 88, 16 + i * 12 + off, 5, -7.5)); ctx.fillStyle = (i + 40) % 2 ? "#3F6FC9" : "#E0473F"; ctx.fill(); }
      const a = P(-3, -10, 84), b = P(-3, -10, 22); ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2.4 * P.s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      FXS.spark(ctx, P, st, 0, -16, 100);
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(0, -16, 52); glow(ctx, c.x, c.y, 30 * P.s, "255,255,240", 0.3); },
  }, true);
  simple("shop_groom_10", ["ぶお〜ん、あったかい", "ねこみみ ドライヤー！", "ふわふわに なるよ"], "puff", [0, -12, 84], [392, 440, 392]);
  lamp("shop_groom_15", { pts: BULBS.map(([x, z]) => [x, -41.6, z, 9]), rgb: "255,236,170", rr: 9, big: 120, lines: ["かがみの ライト ぴかっ", "ライト おやすみ"] });
  simple("shop_groom_30", ["チョキチョキ… できあがり！", "おひめさまの いす みたい", "きんの かがみ ぴかぴか"], "spark", [0, -40, 70], [988, 1175, 988, 1175]);

  // ---- ケーキやさん ----
  simple("shop_cake_5", ["マカロン あまい におい〜", "ふかふかの マカロン", "ピンクと ミント！"], "heart", [0, -24, 44]);
  lamp("shop_cake_10", { pts: [[0, -23, 76, 18], [0, -23, 54, 26]], rgb: "255,200,190", lines: ["さくらんぼが ぴかっ！", "カップケーキ おやすみ"] });
  lamp("shop_cake_15", { pts: [[-20, -28, 70, 30], [20, -28, 70, 30]], rgb: "255,240,220", rr: 30, big: 100, lines: ["どれに しようかな〜", "ショーケース おやすみ"] });
  simple("shop_cake_30", ["あまい ゆめが みられそう", "いちごの まくら ふかふか", "ケーキの ベッドだ！"], "heart", [0, -50, 56]);

  // ---- クレープやさん ----
  simple("shop_crepe_5", ["きょうの おすすめは いちご！", "マダムの え、かわいい", "クレープ たべたいな"], "note", [0, -10, 84]);
  simple("shop_crepe_10", ["いちごの かさ かわいい", "ここで おやつに しよう", "いいね、ピクニック みたい"], "spark", [0, -45, 128]);
  // やたい: タップで てっぱんに きじが ひろがって じゅわ〜（ゆげ）
  FurnLive.register("shop_crepe_15", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[330, 220]], 0.1, "sawtooth", 0.03); setTimeout(() => tone([784, 988], 0.1, "sine", 0.08), 900); say(sc, it, ["じゅわ〜、いい におい！", "うすく まあるく やけたよ", "つぎは いちごを のせよう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 3) return;
      const P = mapper(sc, it, r), k = Math.min(1, t / 1.1), rad = 15 * k, col = t < 1.6 ? "#FBEFD0" : "#F2CF8B";
      const pts = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * TAU; return P(-22 + Math.cos(a) * rad, -34 + Math.sin(a) * rad, 71.3); });
      ctx.save(); ctx.globalAlpha = t > 2.4 ? (3 - t) / 0.6 : 1; path(ctx, pts); ctx.fillStyle = col; ctx.fill(); ink(ctx, 1); ctx.stroke(); ctx.restore();
      FXS.puff(ctx, P, st, -22, -34, 76, 2.6);
    },
  });
  // クレープ カー: ライトが ちかちか（よるは まどが ひかる）・タップで ベル
  const bulbs = (ctx, P, a0) => { for (let x = -64, i = 0; x < 60; x += 14, i++) { const c = P(x, -2, 110); glow(ctx, c.x, c.y, 7 * P.s, "255,240,180", a0 + 0.25 * Math.sin(G.t * 3 + i * 1.3)); } };
  FurnLive.register("shop_crepe_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1568, 1319, 1568, 1319], 0.12, "sine", 0.07); say(sc, it, ["クレープ カーが きたよ〜！", "やねの クレープ おおきい！", "ちりりん、いらっしゃい！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; bulbs(ctx, P, 0.25); ctx.restore();
      FXS.heart(ctx, P, st, -18, -6, 100);
    },
    // よる: まどと ライトが ひかる（くらさの うえ）
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), w = P(-18, -3, 78), c = P(-18, 0, 70); bulbs(ctx, P, 0.45); glow(ctx, w.x, w.y, 60 * P.s, "255,220,160", 0.32); glow(ctx, c.x, c.y, 120 * P.s, "255,220,160", 0.22); },
  });

  // ---- はいしゃさん ----
  simple("shop_dentist_5", ["しゅわしゅわ あわ〜", "はみがき しようね", "ぴかぴかの は に なるよ"], "bubble", [0, -16, 70], [880, 988, 1175]);
  simple("shop_dentist_10", ["ぴかぴか！", "にっこり はの いす", "はみがき がんばったね"], "spark", [0, -27, 60], [1175, 1568]);
  // せんめんだい: タップで じゃぐちから みず（あわ）
  FurnLive.register("shop_dentist_15", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[660, 990], [700, 1050]], 0.16, "sine", 0.05); say(sc, it, ["しゃかしゃか はみがき！", "みずが じゃーっ", "3にんの はブラシ なかよし"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 2.4) return;
      const P = mapper(sc, it, r), a = P(6, -32.5, 77), b = P(6, -30, 66.5), s = P.s;
      ctx.save(); ctx.globalAlpha = t > 1.8 ? (2.4 - t) / 0.6 : 1; ctx.strokeStyle = "rgba(150,205,240,.85)"; ctx.lineWidth = 2.6 * s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 0.9 * s; ctx.beginPath(); ctx.moveTo(a.x - 0.6 * s, a.y); ctx.lineTo(b.x - 0.6 * s, b.y); ctx.stroke(); ctx.restore();
      FXS.bubble(ctx, P, st, 6, -26, 68, 2.4);
    },
  });
  // おしろ: ようせいが まわりを とぶ（タップで きらきら）・よるは まどが ひかる
  FurnLive.register("shop_dentist_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1319, 1568, 1760, 2093], 0.09, "sine", 0.07); say(sc, it, ["はの ようせいさん、こんにちは！", "しんじゅが きらきら", "はを だいじに してね だって"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = G.t, fast = since(st) < 2.5 ? 2.4 : 1, a = t * 0.9 * fast;
      const c = P(Math.cos(a) * 52, -46 + Math.sin(a) * 34, 120 + Math.sin(a * 2) * 14), flap = Math.sin(t * 18) * 0.5 + 0.5;
      ctx.save(); ctx.translate(c.x, c.y); ink(ctx, 1);
      ctx.fillStyle = "rgba(220,240,255,.85)"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 4 * s, -2 * s, (3 + flap * 1.5) * s, 2.2 * s, sx * 0.6, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, 0, 3.2 * s, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#F7B9C9"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 1.4 * s, -4 * s, 0.9 * s, 2.2 * s, sx * 0.2, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.7; FX.star(ctx, c.x - Math.cos(a) * 8 * s, c.y + 4 * s, 2.4 * s, "#FFF2AF"); ctx.restore();
      FXS.spark(ctx, P, st, 0, -46, 150, 1.4);
    },
    // よるは まどが ひかる
    light(ctx, sc, it, r) { const P = mapper(sc, it, r); for (const [x, y, z] of [[-28, -19.9, 44], [28, -19.9, 44], [0, -31.9, 111]]) { const c = P(x, y, z); glow(ctx, c.x, c.y, 14 * P.s, "255,236,170", 0.6); } const c = P(0, -30, 60); glow(ctx, c.x, c.y, 110 * P.s, "255,230,170", 0.2); },
  });

  // ---- パンやさん ----
  simple("shop_bakery_5", ["ふわふわの しょくパン", "いい におい…すやすや", "やきたて みたい！"], "puff", [0, -23, 40], [392, 523]);
  simple("shop_bakery_10", ["パンの いい におい〜", "バゲット ながい！", "どれから たべようかな"], "puff", [0, -24, 70], [523, 659]);
  // パンがま: ほのおが ゆれる（タップで ぼっと おおきく・パンが やける）。よるは へやを てらす
  FurnLive.register("shop_bakery_15", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[200, 120]], 0.1, "sawtooth", 0.03); setTimeout(() => tone([784, 1047], 0.12, "sine", 0.08), 1200); say(sc, it, ["パンが こんがり やけたよ！", "ぱちぱち、あったかい", "まきを くべよう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = G.t, big = since(st) < 2 ? 1.4 : 1, base = P(0, -4.3, 45);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, base.x, base.y - 8 * s, 22 * s * big, "255,160,70", 0.45); ctx.restore();
      for (const [dx, h, ph] of [[-6, 12, 0], [0, 16, 1.7], [6, 11, 3.1]]) {
        const c = P(dx, -4.3, 45), hh = h * big * (0.85 + 0.15 * Math.sin(t * 9 + ph)), w = 3.4 * s;
        ctx.beginPath(); ctx.moveTo(c.x - w, c.y); ctx.bezierCurveTo(c.x - w * 1.2, c.y - hh * 0.45 * s, c.x - w * 0.2, c.y - hh * 0.6 * s, c.x + Math.sin(t * 7 + ph) * s, c.y - hh * s); ctx.bezierCurveTo(c.x + w * 0.2, c.y - hh * 0.6 * s, c.x + w * 1.2, c.y - hh * 0.45 * s, c.x + w, c.y); ctx.closePath();
        ctx.fillStyle = "#F7A24B"; ctx.fill(); ink(ctx, 0.9); ctx.stroke();
      }
      FXS.puff(ctx, P, st, 33, -53, 122, 2.2);
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(0, 0, 52); glow(ctx, c.x, c.y, 110 * P.s, "255,150,80", 0.26); },
  });
  // パンの おうち: えんとつから けむり（ずっと）・よるは まどが ひかる・タップで いい におい
  const breadWin = (ctx, P) => { for (const [x, y, z] of [[-37, -15.7, 48], [39, -15.7, 48], [62.3, -61, 47]]) { const c = P(x, y, z); glow(ctx, c.x, c.y, 16 * P.s, "255,220,140", 0.55); } };
  FurnLive.register("shop_bakery_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 784, 659], 0.11, "triangle", 0.09); say(sc, it, ["パンの おうち、いい におい！", "メロンパンの やね たべたい", "おじゃましま〜す"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = G.t;
      for (let i = 0; i < 3; i++) { const u = (t * 0.35 + i / 3) % 1, c = P(34 + Math.sin(u * 4 + i) * 4, -80, 150 + u * 30); ctx.save(); ctx.globalAlpha = (1 - u) * 0.85; ctx.fillStyle = "#FFFFFF"; ink(ctx, 1); ctx.beginPath(); ctx.arc(c.x, c.y, (3 + u * 5) * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (since(st) < 3 && !lampOn({ on: null })) { ctx.save(); ctx.globalCompositeOperation = "lighter"; breadWin(ctx, P); ctx.restore(); }
      FXS.heart(ctx, P, st, 0, -16, 64);
    },
    // よるは まどが ひかる（くらさの うえ）
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(0, -10, 50); breadWin(ctx, P); glow(ctx, c.x, c.y, 120 * P.s, "255,210,140", 0.24); },
  });

  // ---- おはなやさん ----
  simple("shop_florist_5", ["おはなが いっぱい！", "いい かおり〜", "どの はなが すき？"], "petal", [0, -26, 80], [659, 784, 880]);
  simple("shop_florist_10", ["ひと やすみ しよう", "はなかざり かわいい", "ベンチで ぽかぽか"], "heart", [0, -26, 56]);
  // おんしつ: ちょうちょが 2ひき とぶ（タップで きりふき）・よるは ほんのり
  FurnLive.register("shop_florist_15", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[880, 660]], 0.1, "sine", 0.05); say(sc, it, ["しゅっしゅっ、きりふき！", "ちょうちょが いるよ！", "みどりが げんき"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = G.t;
      for (const [i, c0] of [[0, "#F7D56A"], [1, "#F2A7B8"]]) {
        const a = t * (0.7 + i * 0.25) + i * 2, c = P(Math.cos(a) * 34, -34 + Math.sin(a * 1.3) * 18, 60 + Math.sin(a * 2) * 20), flap = Math.abs(Math.sin(t * 14 + i));
        ctx.save(); ctx.translate(c.x, c.y); ink(ctx, 0.8); ctx.fillStyle = c0;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 2.4 * s * flap, -1 * s, 2.4 * s * flap + 0.4, 2.8 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
      FXS.puff(ctx, P, st, 0, -30, 80, 1.6);
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(0, -34, 60); glow(ctx, c.x, c.y, 56 * P.s, "200,255,210", 0.24); },
  });
  // ブランコ: ゆっくり ゆれる（タップで おおきく）・はなびらが ちる
  FurnLive.register("shop_florist_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 587, 659, 784], 0.16, "sine", 0.08); say(sc, it, ["ゆら〜ん、ゆら〜ん", "ばらの いい かおり", "たかく こげそう！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = since(st), amp = t < 4 ? 0.06 + 0.32 * Math.exp(-t * 0.6) : 0.06, th = Math.sin(G.t * 2.1) * amp, L = 124;
      const seat = (dx) => [dx, -40 + Math.sin(th) * L, 168 - Math.cos(th) * L];
      ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * s; ctx.lineCap = "round";
      for (const dx of [-18, 18]) { const a = P(dx, -40, 168), b = P(...seat(dx)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.strokeStyle = "#B99060"; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * s; }
      const [, y, z] = seat(0), top = [P(-22, y - 8, z), P(22, y - 8, z), P(22, y + 8, z), P(-22, y + 8, z)], fr = [P(-22, y + 8, z), P(22, y + 8, z), P(22, y + 8, z - 4), P(-22, y + 8, z - 4)], rt = [P(22, y - 8, z), P(22, y + 8, z), P(22, y + 8, z - 4), P(22, y - 8, z - 4)];
      ink(ctx, 1.4); for (const [q, c] of [[rt, "#B99060"], [fr, "#D9B27C"], [top, "#E8C89A"]]) { path(ctx, q); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); }
      FXS.petal(ctx, P, st, 0, -40, 168, 2.6);
    },
  }, true);

  // ---- そらの はいたつ ----
  simple("shop_relay_5", ["どこに とどけようかな？", "にもつ、まかせて！", "ソラさんの シールだ"], "spark", [0, -24, 50], [784, 1047]);
  lamp("shop_relay_10", { pts: [[0, -28, 94, 34]], rgb: "255,230,200", big: 120, lines: ["ききゅうが ふわっと ひかった", "ききゅう おやすみ"] });
  simple("shop_relay_15", ["つぎは どこへ いこう？", "ちきゅうぎ くるくる", "そらの ちず、すてき"], "spark", [30, -40, 96], [659, 880, 1175]);
  // ひこうき: プロペラが まわる（タップで ぶーん と はやく・くもが でる）
  FurnLive.register("shop_relay_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[110, 220], [130, 260], [150, 300]], 0.25, "sawtooth", 0.025); say(sc, it, ["ぶーん、しゅっぱつ！", "そらの はいたつ いってきます", "くもの うえ まで とぼう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, fast = since(st) < 3 ? 1 : 0, ang = G.t * (fast ? 28 : 3), cyz = PROP.z - 10;
      ink(ctx, 1.2);
      for (const off of [0, Math.PI]) {
        const a = ang + off, ux = Math.cos(a), uz = Math.sin(a), q = (yy, zz) => P(PROP.x + 4, PROP.y + yy, cyz + zz);
        path(ctx, [q(ux * 3 - uz * 3, uz * 3 + ux * 3), q(ux * 26 - uz * 5, uz * 26 + ux * 5), q(ux * 28, uz * 28), q(ux * 26 + uz * 5, uz * 26 - ux * 5), q(ux * 3 + uz * 3, uz * 3 - ux * 3)]);
        ctx.fillStyle = fast ? "rgba(244,240,232,.55)" : "#F4F0E8"; ctx.fill(); ctx.stroke();
      }
      const hub = P(PROP.x + 4.2, PROP.y, cyz); ctx.fillStyle = "#E0473F"; ctx.beginPath(); ctx.arc(hub.x, hub.y, 3 * s, 0, TAU); ctx.fill(); ctx.stroke();
      FXS.puff(ctx, P, st, 40, -56, 30, 2.6);
    },
  }, true);

  // ---- ころころ フルーツ ----
  simple("shop_korokoro_5", ["ころん、どんぐり！", "コロンさんの すきな もの", "ぼうしの いす かわいい"], "heart", [0, -22, 54], [523, 392]);
  lamp("shop_korokoro_10", { pts: GRAPES.map(([x, y, z]) => [x, y, z, 12]), rgb: "205,160,255", rr: 12, big: 110, lines: ["ぶどうが ぴかぴか！", "ぶどう おやすみ"] });
  simple("shop_korokoro_15", ["すいかの ソファ、つめたそう", "たねも ちゃんと ある！", "なつの いろ〜"], "heart", [0, -30, 46]);
  // きのうえの おうち: タップで コロンが まどから ひょっこり・どんぐりが ぽとん
  FurnLive.register("shop_korokoro_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([784, 988, 784], 0.1, "square", 0.05); say(sc, it, ["コロンさんが ひょっこり！", "どんぐり ぽとん！", "きの うえの おうち いいな"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 3) return;
      const P = mapper(sc, it, r), s = P.s, k = t < 0.4 ? t / 0.4 : t > 2.4 ? (3 - t) / 0.6 : 1, w = P(TREE.winX - 4, -47.85, TREE.winZ - 2 + (k - 1) * 6);
      ctx.save(); ctx.beginPath(); const lo = P(TREE.winX - 4, -47.85, TREE.winZ - 8); ctx.rect(w.x - 10 * s, w.y - 14 * s, 20 * s, lo.y - (w.y - 14 * s)); ctx.clip();
      ctx.translate(w.x, w.y); ink(ctx, 1.1); ctx.fillStyle = "#E7A66A";
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 3.6 * s, -5.4 * s, 1.8 * s, 2.6 * s, sx * 0.3, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 5 * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#FFF1DD"; ctx.beginPath(); ctx.ellipse(0, 1.6 * s, 2.6 * s, 2 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = INK; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 1.8 * s, -0.8 * s, 0.7 * s, 0, TAU); ctx.fill(); }
      ctx.restore();
      if (t > 0.5) { const u = Math.min(1, (t - 0.5) / 0.9), c = P(30, -36, 96 - u * u * 90); ctx.save(); ctx.globalAlpha = t > 2.6 ? (3 - t) / 0.4 : 1; ctx.fillStyle = "#B9784A"; ink(ctx, 0.9); ctx.beginPath(); ctx.ellipse(c.x, c.y, 2.4 * s, 3 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#7E5E40"; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2.2 * s, 2.8 * s, 1.4 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    },
    // よるは まどに あかり
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), c = P(TREE.winX - 4, -47.85, TREE.winZ - 4), g = P(0, -40, 110); glow(ctx, c.x, c.y, 15 * P.s, "255,226,160", 0.6); glow(ctx, g.x, g.y, 90 * P.s, "255,220,160", 0.18); },
  });

  // ---- ガソリンスタンド ----
  simple("shop_gasstand_5", ["ぽよん、ぽよん！", "タイヤの いす、はずむ〜", "ブンさんの おみせの いす"], "spark", [0, -24, 46], [392, 523, 392]);
  lamp("shop_gasstand_10", {
    pts: [[0, -20, 103, 28]], rgb: "255,236,190", big: 110, lines: ["きゅうゆきが ぴかっ！", "あかり おやすみ"], live: true,
    extra(ctx, P, st, on) { const a = Math.PI * (0.25 + (on ? 0.45 + Math.sin(G.t * 0.8) * 0.2 : 0.05)), c = P(0, -4.7, 63), e = P(-Math.cos(a) * 7, -4.7, 63 + Math.sin(a) * 7); ctx.strokeStyle = "#E0473F"; ctx.lineWidth = 1.4 * P.s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.stroke(); },
  });
  // くるまの ベッド: タップで ライトが ぴかぴか・プップー
  FurnLive.register("shop_gasstand_15", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[440, 440], null, [440, 440]], 0.18, "square", 0.05); say(sc, it, ["ぶるるん、プップー！", "ねむい ときは ここで ねよう", "レーシングカーの ベッドだ！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 1.8) return;
      const P = mapper(sc, it, r), on = Math.floor(t * 5) % 2 === 0;
      if (!on) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; for (const y of [-58, -8]) { const c = P(62.2, y, 22); glow(ctx, c.x, c.y, 18 * P.s, "255,240,170", 0.8); } ctx.restore();
    },
  });
  // ガレージ: タップで ミニカーが スロープを ころころ（したに ついたら うえに もどる）
  FurnLive.register("shop_gasstand_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 587, 523, 494, 440], 0.12, "triangle", 0.08); say(sc, it, ["ミニカーが ころころ〜！", "スロープ たのしい！", "ライオンの ガレージ、かっこいい"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, t = since(st), u = t < 0 || t > 3 ? 0.42 : t < 1.6 ? Math.min(1, 0.42 + (t / 1.6) * 0.58) : 1;
      if (t >= 2.2 && t <= 3) return;
      const x = RAMP[0][0], y = RAMP[0][1] + (RAMP[1][1] - RAMP[0][1]) * u, z = RAMP[0][2] + (RAMP[1][2] - RAMP[0][2]) * u + 2;
      const q = (dx, dy, dz) => P(x + dx, y + dy, z + dz);
      ink(ctx, 1);
      for (const [pts, c] of [[[q(4, -7, 0), q(4, 7, 0), q(4, 7, 4), q(4, -7, 4)], "#D97E2E"], [[q(-4, 7, 0), q(4, 7, 0), q(4, 7, 4), q(-4, 7, 4)], "#F29A3B"], [[q(-4, -7, 4), q(4, -7, 4), q(4, 7, 4), q(-4, 7, 4)], "#F7B66A"], [[q(-3, -3, 4), q(3, -3, 4), q(3, 3, 7.4), q(-3, 3, 7.4)], "#BFE3EE"]]) { path(ctx, pts); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); }
      for (const dy of [-4.5, 4.5]) { const w = q(4.2, dy, 1); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(w.x, w.y, 1.7 * s, 0, TAU); ctx.fill(); }
    },
  }, true);

  // ---- ゆうびんきょく ----
  // まるい ポスト: タップで てがみが ぽこっ
  FurnLive.register("shop_postoffice_5", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([988, 1319], 0.1, "sine", 0.08); say(sc, it, ["おてがみ ぽこっ！", "だれから かな？", "ちょきんも できるんだって"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 1.6) return;
      const P = mapper(sc, it, r), s = P.s, k = t / 1.6, c = P(0, -4, 50 + Math.sin(k * Math.PI) * 26);
      ctx.save(); ctx.globalAlpha = 1 - Math.max(0, k - 0.7) / 0.3; ctx.translate(c.x, c.y); ctx.rotate(Math.sin(t * 8) * 0.25); ink(ctx, 1); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-6 * s, -4 * s, 12 * s, 8 * s); ctx.strokeRect(-6 * s, -4 * s, 12 * s, 8 * s);
      ctx.beginPath(); ctx.moveTo(-6 * s, -4 * s); ctx.lineTo(0, 0.6 * s); ctx.lineTo(6 * s, -4 * s); ctx.stroke(); ctx.fillStyle = "#E0473F"; ctx.beginPath(); ctx.arc(0, 1.6 * s, 1.4 * s, 0, TAU); ctx.fill(); ctx.restore();
    },
  });
  simple("shop_postoffice_10", ["おてがみ かこう！", "きって、どれに しよう", "メエさんに だしに いこう"], "heart", [0, -26, 80]);
  simple("shop_postoffice_15", ["しわけ かんりょう！", "いろんな てがみが ある", "こづつみも とどいてる"], "spark", [0, -20, 120], [784, 988, 1175]);
  // とけいとう: はりは ほんとうの じこく・タップで かねが なって はねの ある てがみが とぶ
  FurnLive.register("shop_postoffice_30", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1047, 784, 880, 523, null, 523, 880, 1047, 784], 0.28, "sine", 0.08); say(sc, it, ["かーん、こーん！", "てがみが とんで いく〜", "あかい とけいとう、きれい"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, now = new Date(), hr = now.getHours(), mn = now.getMinutes(), { cx, cy, clockZ } = TOWER;
      const a1 = ((hr % 12) + mn / 60) / 12 * TAU, a2 = (mn / 60) * TAU;
      for (const [y, x0, onSide] of [[-16.6, cx, false], [null, cy, true]]) {
        const pt = (a, len) => (onSide ? P(30.25, x0 + Math.sin(a) * len, clockZ + Math.cos(a) * len) : P(x0 + Math.sin(a) * len, y, clockZ + Math.cos(a) * len)), o = pt(0, 0);
        ctx.strokeStyle = INK; ctx.lineCap = "round";
        ctx.lineWidth = 1.8 * s; let e = pt(a1, 6.4); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.lineWidth = 1.2 * s; e = pt(a2, 9.4); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      }
      // かね
      const t = since(st), ang = t >= 0 && t < 3 ? Math.sin(t * 9) * 0.45 * Math.exp(-t * 0.8) : 0, top = P(cx, cy + 10, 182), bot = P(cx, cy + 10, 166);
      const hgt = Math.hypot(bot.x - top.x, bot.y - top.y);
      ctx.save(); ctx.translate(top.x, top.y); ctx.rotate(ang); ink(ctx, 1.2);
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(-3 * s, 0); ctx.quadraticCurveTo(-4 * s, hgt * 0.5, -9 * s, hgt); ctx.lineTo(9 * s, hgt); ctx.quadraticCurveTo(4 * s, hgt * 0.5, 3 * s, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = GOLDD; ctx.beginPath(); ctx.arc(0, hgt + 1.6 * s, 2.2 * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      // はねの ある てがみ
      if (t >= 0 && t < 3) for (let i = 0; i < 3; i++) {
        const u = Math.min(1, t / 2.6 + i * 0.12), c = P(cx + 20 + u * 50 * (i - 1), cy + 40, 120 + u * 70 + Math.sin(u * 9 + i) * 6), fl = Math.sin(G.t * 16 + i) * 0.5 + 0.5;
        ctx.save(); ctx.globalAlpha = 1 - Math.max(0, u - 0.75) / 0.25; ctx.translate(c.x, c.y); ink(ctx, 0.9);
        ctx.fillStyle = "#FFFFFF"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 6 * s, -2 * s, 3 * s, (1.4 + fl * 1.6) * s, sx * 0.5, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.fillRect(-4.5 * s, -3 * s, 9 * s, 6 * s); ctx.strokeRect(-4.5 * s, -3 * s, 9 * s, 6 * s); ctx.beginPath(); ctx.moveTo(-4.5 * s, -3 * s); ctx.lineTo(0, 0.4 * s); ctx.lineTo(4.5 * s, -3 * s); ctx.stroke(); ctx.restore();
      }
    },
    // よるは とけいの もじばんが ひかる
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), { cx, cy, clockZ } = TOWER; for (const c of [P(cx, -16.6, clockZ), P(30.25, cy, clockZ)]) glow(ctx, c.x, c.y, 20 * P.s, "255,240,190", 0.5); },
  }, true);
  return {
    ids: Object.keys(M),
    model(id, opts = {}) { return FurnModels.build(id, opts); },
  };
})();
