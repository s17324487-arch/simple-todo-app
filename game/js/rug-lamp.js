// ラグと ランプ（UI-39・オーナーの FB 2026-10-01「家具について、ラグ系、ランプ系の実装を増やしてほしい」）。
// かぐやで かえる ラグ 8 と ランプ 8。どれも FurnModels の 立体（INK の 線・パステル・まるい つなぎめ）。
// ランプは さわると つく／きえる（よるは はじめから つく・へやを てらす）。ラグも さわると 3人が ひとこと（どうろの マットは ミニカーが はしる・
// はちのすの ラグは はちが とぶ・おはなばたけは ちょうちょが まう など）。さわる うごきの 道具は ShopRewardArt.liveKit。
// ねだんは かぐやの もとの ねだん（slow-life-prices.js が 4ばいに する。この ファイルは その まえに よむ）。セーブは 家具の かずが ふえる だけ。
const RugLamp = (() => {
  const TAU = Math.PI * 2;
  const { rect, rr, ov, arc, star, close, rot2 } = FurnModels.shapes;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const BRASS = "#D4AE62", BRASSD = "#A9853F";
  // [id, なまえ, ねだん, しゅるい, はば, おくゆき, たかさ, いごこち, せつめい]
  const ITEMS = [
    ["rug_cloud", "もこもこ くもの ラグ", 380, "rug", 176, 124, 3, 3, "ねむそうな くもの ラグ。ふわふわ。"],
    ["rug_heart", "ハートの ふわふわ ラグ", 240, "rug", 140, 140, 3, 3, "ピンクの ハート。ぬいめも かわいい。"],
    ["rug_rainbow", "にじいろ しましま ラグ", 380, "rug", 184, 118, 3, 3, "7いろの しまと ふさふさの はし。"],
    ["rug_bear", "くまの かおの ラグ", 380, "rug", 168, 146, 3, 4, "まんまるの くま。おみみも ふかふか。"],
    ["rug_road", "まちの どうろ マット", 380, "rug", 192, 140, 3, 3, "どうろと おうちの マット。くるまが はしる！"],
    ["rug_honey", "はちのすの ラグ", 260, "rug", 156, 136, 3, 3, "はちみつ いろの はちのす。はちも いるよ。"],
    ["rug_berry", "いちごの ラグ", 240, "rug", 140, 138, 3, 3, "あかい いちごに つぶつぶ。へたは みどり。"],
    ["rug_flower", "おはなばたけの ラグ", 380, "rug", 188, 122, 3, 4, "デイジーと チューリップと ちょうちょ。"],
    ["lamp_mushroom", "きのこの ランプ", 180, "floor", 50, 50, 68, 2, "あかい きのこが ぽわっと ひかる。"],
    ["lamp_andon", "わしの あんどん", 260, "floor", 48, 48, 106, 3, "わしの かみごしに やさしい あかり。"],
    ["lamp_moon", "まんまる つきの ランプ", 280, "floor", 52, 52, 100, 3, "おつきさまが まるごと ひかる。"],
    ["lamp_lava", "とろとろ ラバランプ", 300, "floor", 36, 36, 98, 2, "つくと なかの たまが ゆっくり うごく。"],
    ["lamp_cat", "ねこの ナイトライト", 200, "floor", 48, 38, 64, 2, "すやすや ねこが ほんのり ひかる。"],
    ["lamp_arc", "アーチの フロアライト", 380, "floor", 112, 46, 178, 3, "おおきな アーチの さきに まるい かさ。"],
    ["lamp_candle", "キャンドルの しょくだい", 290, "floor", 58, 38, 92, 3, "3ぼんの ろうそくが ゆらゆら。"],
    ["lamp_tulip", "チューリップの スタンド", 240, "floor", 58, 46, 114, 2, "3つの チューリップが ひかる。"],
  ];
  const IDS = ITEMS.map((r) => r[0]);
  for (const [id, name, price, kind, w, depth, h, comfort, desc] of ITEMS) {
    if (FURN_INDEX[id]) continue;
    const f = { id, name, price, kind, w, depth, h, comfort, desc, cat: [kind === "rug" ? "rug" : "light"] };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = (opts = {}) => HomeDesign.model(id, opts).full;
  }

  // ---------- かたち ----------
  // した（ふちの いろ）と うえ（おもての いろ）の 2まい。へこみの ある 形でも よい
  const two = (k, ps, th, base, top, sw = 1.5) => k.shape(k.TP(0), ps, base, sw) + k.shape(k.TP(th), ps, top, sw);
  // くも（なみなみの ふち）
  const cloud = (cx, cy, A, B, n = 9, bump = 0.13, N = 108) => Array.from({ length: N }, (_, i) => { const t = (i / N) * TAU, b = 1 + bump * (Math.abs(Math.cos((n * t) / 2)) - 0.5); return [cx + Math.cos(t) * A * b, cy + Math.sin(t) * B * b]; });
  // 画面で まっすぐ（うえが 画面の うえ）に 見える むきの ゆかの 点: a は 画面の よこ、b は 画面の たて（した が ＋）
  const UP = (cx, cy) => (a, b) => [cx + (a + b) * 0.7071, cy + (b - a) * 0.7071];
  // ハート（画面で ふくらみが うえ・とがりが した）
  const heartP = (cx, cy, sc, N = 72) => { const F = UP(cx, cy); return Array.from({ length: N }, (_, i) => { const t = (i / N) * TAU, Y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return F(16 * Math.sin(t) ** 3 * sc, (-Y - 2.5) * sc); }); };
  const hex = (cx, cy, R, ry = R) => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return [cx + Math.cos(a) * R, cy + Math.sin(a) * ry]; });
  // いちご（おくが ひろく てまえが とがる）
  const berry = (cx, cy, A, B, N = 64) => Array.from({ length: N }, (_, i) => { const t = (i / N) * TAU, s = Math.sin(t), c = Math.cos(t); return [cx + A * s * (1 + 0.22 * c) * (1 - 0.18 * Math.max(0, -c) ** 3), cy - B * c]; });
  const dashed = 'stroke-dasharray="3 2.6"';

  const M = {};
  // ================= ラグ =================
  M.rug_cloud = (k) => {
    // もこもこ くも: あわい あおの ふち・しろい おもて・うちがわの そらいろ・ふわふわの けなみ・ねむそうな かお
    const { d, shape, TP, lineOn } = k, cy = -d / 2, A = 82, B = 56;
    let s = two(k, cloud(0, cy, A, B), 3, "#A9BFD6", "#F8FBFE");
    s += shape(TP(3.05), cloud(0, cy, A - 16, B - 13), "#E6EFF8", 0) + lineOn(TP(3.1), close(cloud(0, cy, A - 7, B - 6)), "#C7D6E6", 1.2, dashed);
    for (let i = 0; i < 22; i++) {
      const a = i * 2.39, r = 0.3 + ((i * 37) % 55) / 100, x = Math.cos(a) * (A - 18) * r, y = cy + Math.sin(a) * (B - 14) * r;
      if (Math.abs(x) < 34 && Math.abs(y - cy) < 18) continue;
      s += lineOn(TP(3.15), arc(x, y, 4.2, 2.6, Math.PI * 1.1, Math.PI * 1.9, 6), "#C9D9EA", 1.1);
    }
    for (const sx of [-1, 1]) s += lineOn(TP(3.2), arc(sx * 16, cy - 2, 6.5, 4, 0.12 * Math.PI, 0.88 * Math.PI, 9), INK, 1.7) + shape(TP(3.2), ov(sx * 27, cy + 9, 7, 4.2, 16), "#F7B6C8", 0);
    s += lineOn(TP(3.2), arc(0, cy + 7, 5, 3.6, 0.15 * Math.PI, 0.85 * Math.PI, 8), INK, 1.4);
    return s;
  };
  M.rug_heart = (k) => {
    // ハート: こい ピンクの ふち・ピンクの おもて・うちがわの うすい ハート・しろい ぬいめ・ちいさな ハートの もよう
    const { d, shape, TP, lineOn } = k, cy = -d / 2, F = UP(0, cy), at2 = (a, b) => F(a, b);
    let s = two(k, heartP(0, cy, 3.25), 3, "#D56C8A", "#F7B3C6");
    s += shape(TP(3.05), heartP(...at2(0, 2), 2.35), "#FBD2DE", 0) + lineOn(TP(3.1), close(heartP(0, cy, 2.95)), "#FFFFFF", 1.3, dashed);
    for (const [a, b, r] of [[-22, -18, 0.5], [22, -20, 0.45], [0, 4, 0.6], [-12, 22, 0.4], [12, 22, 0.4], [-30, -2, 0.36], [30, -4, 0.36]]) s += shape(TP(3.15), heartP(...at2(a, b), r, 28), "#FFFFFF", 0.9);
    for (const [a, b] of [[-38, -26], [38, -26], [0, -16], [0, 36], [-20, 8], [20, 8]]) { const [x, y] = at2(a, b); s += shape(TP(3.15), ov(x, y, 1.8, 1.8, 10), "#E98BA4", 0); }
    return s;
  };
  M.rug_rainbow = (k) => {
    // にじいろ しましま: 7いろの しま・しろい ふち・しまの あいだの ぬいめ・りょうはしの ふさ
    const { w, d, shape, TP, lineOn, line } = k, x0 = -w / 2 + 10, x1 = w / 2 - 10, y0 = -d + 6, y1 = -6, cols = ["#F4A3A8", "#F7C59F", "#F9E28F", "#B8E0B0", "#A6D8E8", "#AFC3EE", "#CDB4E6"];
    let s = "";
    // ふさ（はしの ひも）
    for (const [xe, dir] of [[x0, -1], [x1, 1]]) for (let y = y0 + 4; y <= y1 - 3; y += 6.5) s += line([[xe, y, 0.6], [xe + dir * 8, y + 0.6, 0.6]], INK, 3.4) + line([[xe, y, 0.6], [xe + dir * 8, y + 0.6, 0.6]], "#F6EBD3", 1.6);
    s += two(k, rr(x0, y0, x1 - x0, y1 - y0, 6), 3, "#B9A3C9", "#FFFFFF");
    const bw = (x1 - x0 - 8) / 7;
    cols.forEach((c, i) => { s += shape(TP(3.05), rect(x0 + 4 + i * bw, y0 + 4, bw, y1 - y0 - 8), c, 0); });
    for (let i = 1; i < 7; i++) s += lineOn(TP(3.1), [[x0 + 4 + i * bw, y0 + 6], [x0 + 4 + i * bw, y1 - 6]], "#FFFFFF", 1.2, dashed);
    s += lineOn(TP(3.1), close(rr(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8, 3)), INK, 1, 'stroke-opacity=".55"');
    // ちいさな くもと ほし
    for (const [x, y] of [[-48, -88], [52, -34]]) s += shape(TP(3.15), cloud(x, y, 12, 7, 6, 0.2, 36), "#FFFFFF", 0.9);
    s += shape(TP(3.15), star(8, -72, 7, 3), "#FFF3B0", 0.9);
    return s;
  };
  M.rug_bear = (k) => {
    // くまの かお: おみみ・まるい かお・はなの まわり・はな・め・ほっぺ・くち・ぬいめ
    const { d, shape, TP, lineOn } = k, cy = -d / 2 + 6, FA = 60, FB = 52;
    let s = "";
    for (const sx of [-1, 1]) s += two(k, ov(sx * 44, cy - 42, 21, 19, 32), 3, "#86553A", "#C38A5D");
    s += two(k, ov(0, cy, FA, FB, 64), 3, "#86553A", "#C38A5D");
    for (const sx of [-1, 1]) s += shape(TP(3.05), ov(sx * 44, cy - 43, 12, 11, 24), "#F2B7A6", 0.9);
    s += lineOn(TP(3.1), close(ov(0, cy, FA - 6, FB - 6, 64)), "#E6BE92", 1.3, dashed);
    s += shape(TP(3.1), ov(0, cy + 18, 25, 18, 36), "#EED2AE", 1.1);
    s += shape(TP(3.2), ov(0, cy + 9, 9.5, 6.5, 24), "#4A2E22", 1.1) + shape(TP(3.25), ov(-3, cy + 7.5, 3, 1.6, 12), "#FFFFFF", 0, 'fill-opacity=".8"');
    s += lineOn(TP(3.2), [[0, cy + 15], [0, cy + 20]], INK, 1.4) + lineOn(TP(3.2), arc(-5, cy + 20, 5, 4, 0, Math.PI, 8), INK, 1.4) + lineOn(TP(3.2), arc(5, cy + 20, 5, 4, 0, Math.PI, 8), INK, 1.4);
    for (const sx of [-1, 1]) s += shape(TP(3.2), ov(sx * 21, cy - 10, 5, 6.2, 16), INK, 0) + shape(TP(3.25), ov(sx * 21 - 1.5, cy - 12, 1.7, 1.7, 8), "#FFFFFF", 0) + shape(TP(3.2), ov(sx * 38, cy + 12, 9, 5.5, 18), "#F2A7B8", 0, 'fill-opacity=".9"');
    return s;
  };
  // どうろの マットの どうろ（まんなかの せん。ミニカーが はしる）
  const ROAD = { x0: -96 + 29, y0: -140 + 29, w: 192 - 58, d: 140 - 58, r: 16 };
  const roadLine = () => close(rr(ROAD.x0, ROAD.y0, ROAD.w, ROAD.d, ROAD.r, 6));
  M.rug_road = (k) => {
    // まちの どうろ マット: しばふ・まわる どうろ（しろい せん・おうだんほどう）・いけ・おうち・き・パーキング
    const { w, d, shape, TP, lineOn, L } = k, X = -w / 2, Y = -d;
    let s = two(k, rr(X + 4, Y + 4, w - 8, d - 8, 10), 3, "#6E9E5E", "#A9D48F");
    s += shape(TP(3.05), rr(X + 18, Y + 18, w - 36, d - 36, 22), "#A7AAB0", 1.1) + shape(TP(3.1), rr(X + 40, Y + 40, w - 80, d - 80, 10), "#B7DE9D", 1.1);
    s += lineOn(TP(3.15), roadLine(), "#FFFFFF", 1.4, 'stroke-dasharray="6 5"');
    for (let x = -14; x <= 12; x += 6.5) s += shape(TP(3.2), rect(x, -39, 3.4, 19), "#FFFFFF", 0);
    // いけ
    s += shape(TP(3.15), ov(-30, -70, 17, 12, 28), "#9CD3EA", 1.1) + lineOn(TP(3.2), arc(-32, -72, 8, 4, Math.PI * 1.1, Math.PI * 1.8, 8), "#FFFFFF", 1.1);
    // おうち（やねは おく）
    const house = (x, y, wall, roof) => shape(TP(3.2), rect(x - 8, y - 5, 16, 11), wall, 1.1) + shape(TP(3.25), [[x - 10, y - 5], [x + 10, y - 5], [x, y - 14]], roof, 1.1) + shape(TP(3.3), rect(x - 2, y, 4, 6), "#B98A5E", 0.8);
    s += house(14, -66, "#FFF3DC", "#E5746A") + house(36, -80, "#E9F3FF", "#6F9BD8") + house(40, -58, "#FFF0F4", "#F2A7B8");
    const tree = (x, y, r) => shape(TP(3.2), ov(x, y, r, r * 0.9, 16), "#6FBF73", 1.1) + shape(TP(3.25), ov(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3, 10), "#9AD69B", 0);
    for (const [x, y, r] of [[-62, -122, 7], [-80, -100, 6], [74, -122, 6.5], [80, -26, 7], [-80, -24, 6], [-6, -94, 5], [60, -96, 5]]) s += tree(x, y, r);
    // パーキング
    s += shape(TP(3.2), rr(62, -60, 14, 16, 2), "#4F7BD6", 1) + lineOn(TP(3.25), [[66, -48], [66, -57], [70.5, -57], [71.5, -55], [70.5, -53], [66, -53]], "#FFFFFF", 1.4);
    // とまって いる ミニカー（live の ときは FurnLive が はしらせる）
    s += L(shape(TP(3.4), rr(-60, -36, 14, 8, 2.5), "#F29A3B", 1.1) + shape(TP(3.45), rr(-57, -35, 7, 6, 1.5), "#BFE3EE", 0.8));
    return s;
  };
  M.rug_honey = (k) => {
    // はちのす: 6かくの ラグ・はちのすの もよう（はちみつの つぶ）・はち
    const { d, shape, TP, lineOn } = k, cy = -d / 2, R = 76, RY = 64;
    let s = two(k, hex(0, cy, R, RY), 3, "#C38A2E", "#F6C85A");
    s += shape(TP(3.05), hex(0, cy, R - 9, RY - 8), "#F9D774", 0);
    const r = 9, dx = r * 1.5, dy = r * Math.sqrt(3) * 0.86;
    for (let i = -6; i <= 6; i++) for (let j = -5; j <= 5; j++) {
      const x = i * dx, y = cy + j * dy + (i % 2 ? dy / 2 : 0);
      if (Math.abs(x) / (R - 14) + Math.abs(y - cy) / (RY - 12) > 1.05 || Math.abs(y - cy) > RY - 14) continue;
      const cell = hex(x, y, r - 1, (r - 1) * 0.86), honey = (i * 7 + j * 3 + 20) % 5 === 0;
      s += honey ? shape(TP(3.1), cell, "#F5B23C", 1) : lineOn(TP(3.1), close(cell), "#E0A33A", 1.1);
    }
    s += lineOn(TP(3.12), close(hex(0, cy, R - 5, RY - 5)), "#FFFFFF", 1.2, dashed);
    // はち（てまえの みぎ）
    const bx = 34, by = cy + 26;
    for (const sx of [-1, 1]) s += shape(TP(3.2), ov(bx + sx * 4, by - 7, 5, 3.4, 14), "#FFFFFF", 1, 'fill-opacity=".9"');
    s += shape(TP(3.25), ov(bx, by, 10, 7, 20), "#FFD94A", 1.2);
    for (const x of [-3, 2.5]) s += lineOn(TP(3.3), [[bx + x, by - 6], [bx + x, by + 6]], INK, 2.2);
    s += shape(TP(3.3), ov(bx + 7.5, by - 1, 1.4, 1.4, 8), INK, 0);
    return s;
  };
  M.rug_berry = (k) => {
    // いちご: あかい いちご・きいろい つぶつぶ・ひかり・みどりの へたと じく
    const { d, shape, TP, lineOn } = k, cy = -d / 2 + 6, A = 62, B = 60;
    let s = two(k, berry(0, cy, A, B), 3, "#B8333C", "#EC4C5E");
    s += shape(TP(3.05), berry(0, cy + 2, A - 10, B - 10), "#F1606F", 0);
    for (let j = 0; j < 6; j++) for (let i = -4; i <= 4; i++) {
      const y = cy - B + 26 + j * 15, x = i * 13 + (j % 2 ? 6.5 : 0), half = A * (1 - ((y - cy + B) / (2 * B)) ** 2 * 0.55) - 12;
      if (Math.abs(x) > half || y > cy + B - 14) continue;
      s += shape(TP(3.15), ov(x, y, 2.6, 3.6, 10), "#FBE38E", 0.8);
    }
    s += shape(TP(3.15), rot2(ov(-30, cy - 26, 13, 6, 18), -30, cy - 26, -0.5), "#FFFFFF", 0, 'fill-opacity=".45"');
    s += two(k, star(0, cy - B + 6, 30, 12, 6), 3.4, "#4E9A48", "#7CC46E", 1.3);
    s += lineOn(TP(3.6), [[0, cy - B + 6], [3, cy - B - 8]], INK, 4.2) + lineOn(TP(3.6), [[0, cy - B + 6], [3, cy - B - 8]], "#6AB35F", 2.4);
    return s;
  };
  // デイジー と チューリップ（ゆかに ぬった え）
  const daisy = (k, z, x, y, r, petal = "#FFFFFF") => Array.from({ length: 8 }, (_, i) => k.shape(k.TP(z), rot2(ov(x + r * 0.95, y, r * 0.62, r * 0.3, 12), x, y, (i * Math.PI) / 4), petal, 0.8)).join("") + k.shape(k.TP(z + 0.05), ov(x, y, r * 0.45, r * 0.42, 14), "#F7C548", 0.8);
  const tulipFlat = (k, z, x, y, s, col) => k.lineOn(k.TP(z), [[x, y], [x, y + 12 * s]], "#5E9E50", 1.8 * s) + k.shape(k.TP(z), rot2(ov(x - 4 * s, y + 8 * s, 4.5 * s, 2 * s, 12), x - 4 * s, y + 8 * s, -0.6), "#7CC46E", 0.7) +
    k.shape(k.TP(z + 0.05), [[x - 5 * s, y - 6 * s], [x - 2.5 * s, y - 2 * s], [x, y - 7 * s], [x + 2.5 * s, y - 2 * s], [x + 5 * s, y - 6 * s], [x + 4.4 * s, y + 1 * s], [x, y + 3 * s], [x - 4.4 * s, y + 1 * s]], col, 0.9);
  const FLOWERS = [["d", -58, -86, 7], ["d", 30, -96, 6], ["d", -4, -44, 7.5], ["d", 66, -50, 6], ["d", -72, -48, 5.5], ["t", -30, -70, 1.1, "#EE7E86"], ["t", 10, -78, 1, "#F7A8C4"], ["t", 46, -74, 1.1, "#F7D56A"], ["t", -46, -40, 1, "#F7D56A"], ["t", 30, -34, 1.05, "#EE7E86"], ["d", -20, -100, 5], ["t", 70, -86, 0.9, "#C9B6E0"]];
  M.rug_flower = (k) => {
    // おはなばたけ: みどりの だえんの ラグ・デイジー・チューリップ・ちょうちょ・ぬいめ
    const { w, d, shape, TP, lineOn } = k, cy = -d / 2, A = w / 2 - 5, B = d / 2 - 5;
    let s = two(k, ov(0, cy, A, B, 72), 3, "#6FA563", "#A8D88E");
    s += shape(TP(3.05), ov(0, cy, A - 12, B - 10, 72), "#BDE3A5", 0) + lineOn(TP(3.1), close(ov(0, cy, A - 6, B - 5, 72)), "#FFFFFF", 1.2, dashed);
    for (const f of FLOWERS) s += f[0] === "d" ? daisy(k, 3.2, f[1], f[2], f[3]) : tulipFlat(k, 3.2, f[1], f[2], f[3], f[4]);
    // ちょうちょ
    for (const [x, y, c] of [[-12, -64, "#F7B6C8"], [40, -88, "#9CC7E6"]]) {
      for (const sx of [-1, 1]) s += shape(TP(3.3), rot2(ov(x + sx * 4.2, y - 1.5, 4.2, 3.2, 12), x + sx * 4.2, y - 1.5, sx * 0.4), c, 0.9);
      s += lineOn(TP(3.35), [[x, y - 4], [x, y + 3]], INK, 1.6);
    }
    return s;
  };

  // ================= ランプ =================
  M.lamp_mushroom = (k) => {
    // きのこの ランプ: くさの だい・クリームの じく・ひだ・あかい かさと しろい みずたま
    const { cyl, frustum, dome, shape, TP, at, shadow, eggAt } = k, cx = 0, cy = -25;
    let s = shadow(0.12, 6, 20) + dome(cx, cy, 0, 22, 22, 6, "#A3D38C", 1.4);
    for (const a of [0.3, 1.4, 2.5]) s += at(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 4, `<path d="M-2,0 Q-1,-6 0,-8 Q1,-6 2,0 Z" fill="#7CC46E" ${S(0.9)}/>`, 3, 9);
    s += frustum(cx, cy, 4, 9.5, 34, 7.5, "#FFF1D8", "#FFF8EA", 1.4);
    s += frustum(cx, cy, 31, 24, 34, 24.5, "#F7E2C2", "#FBEBD2", 1.3);
    s += dome(cx, cy, 34, 24.5, 24.5, 28, "#E5574C", 1.5);
    for (const [a, b, r] of [[0.15, 0.55, 4.4], [0.85, 0.32, 4.6], [1.55, 0.55, 4], [0.45, 1.0, 3.4], [1.25, 0.95, 3.2], [-0.2, 0.95, 2.8], [1.9, 1.0, 2.8]]) {
      const [x, y, z] = eggAt(cx, cy, 34, 24.5, 24.5, 28, a, b);
      s += at(x, y, z, `<ellipse rx="${r}" ry="${(r * 0.72).toFixed(1)}" fill="#FFFFFF" ${S(0.9)}/>`, r + 1, r);
    }
    return s;
  };
  M.lamp_andon = (k) => {
    // わしの あんどん: きの わく（4ほんの はしら・よこの さん）・まえと みぎの わし（さくらの えだの もよう）・うえの ふた
    const { box, shape, FR, SD, TP, onP, shadow, lineOn } = k, x0 = -22, x1 = 22, y0 = -46, y1 = -2, WOOD = ["#8C5A3A", "#6E452C", "#A8714C"];
    let s = shadow(0.12, 4, 6);
    // おくの はしら
    s += box(x0, y0, 4, 4, 0, 98, WOOD, 1.2);
    // わし（まえ・みぎ）
    s += shape(FR(y1 - 2), rect(x0 + 3, 12, x1 - x0 - 6, 80), "#FFF3D6", 1.2, 'fill-opacity=".95"') + shape(SD(x1 - 2), rect(y0 + 3, 12, y1 - y0 - 6, 80), "#F4E3C0", 1.2, 'fill-opacity=".95"');
    s += onP(FR(y1 - 2.1), x0 + 6, 86, 32, 70, `<path d="M2,62 Q12,44 26,30 M14,46 Q20,40 24,42" fill="none" stroke="#8C5A3A" stroke-width="1.6" stroke-linecap="round"/>` + [[12, 46], [20, 36], [26, 28], [16, 52], [24, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#F7B6C8" ${S(0.6)}/>`).join(""));
    for (const z of [12, 52, 90]) s += lineOn(FR(y1 - 2.2), [[x0 + 3, z], [x1 - 3, z]], WOOD[0], 2.6) + lineOn(SD(x1 - 2.2), [[y0 + 3, z], [y1 - 3, z]], WOOD[1], 2.6);
    // てまえの はしら・あし・ふた
    for (const [x, y] of [[x0, y1 - 4], [x1 - 4, y0], [x1 - 4, y1 - 4]]) s += box(x, y, 4, 4, 0, 98, WOOD, 1.2);
    s += box(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4, 98, 4, WOOD, 1.3) + box(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12, 102, 3, ["#7A4E33", "#5E3B26", "#946141"], 1.1);
    return s;
  };
  M.lamp_moon = (k) => {
    // まんまる つきの ランプ: きの まるい だい・きんの ぼう・うけざら・クレーターの ある つき
    const { cyl, frustum, rod, ball, at, shadow, rg } = k, cx = 0, cy = -26;
    let s = shadow(0.12, 8, 22) + cyl(cx, cy, 0, 17, 6, "#B48557", "#D2A577", 1.4) + cyl(cx, cy, 6, 12, 2, "#9C7148", "#C29466", 1.2);
    s += rod([[cx, cy, 8], [cx, cy, 50]], BRASS, 2.2) + frustum(cx, cy, 48, 5, 52, 9, BRASSD, BRASS, 1.2);
    s += ball(cx, cy, 72, 22, rg([[0, "#FFFDF0"], [0.6, "#FBEFB8"], [1, "#E9D488"]], 0.38, 0.34, 0.8), 1.5, 0.45);
    for (const [dx, dz, r] of [[-8, 82, 4.6], [9, 76, 3.4], [-2, 64, 5.4], [12, 64, 2.6], [-13, 70, 2.4], [3, 86, 2]]) s += at(cx + dx * 0.55, cy - dx * 0.55, dz, `<ellipse rx="${r}" ry="${(r * 0.85).toFixed(1)}" fill="#E6CF84" stroke="#C9AE5E" stroke-width="0.9"/>`, r, r);
    return s;
  };
  // ラバランプの ガラス（たかさと はんけい）。live の とき FurnLive が なかの たまを うごかす
  const LAVA = { cx: 0, cy: -18, rings: [[7.5, 30], [9.6, 42], [10.2, 58], [8.8, 74], [6.2, 84]] };
  M.lamp_lava = (k) => {
    // とろとろ ラバランプ: ぎんいろの だい（すそが ひろい）・ガラスの なかの いろの みず・たま（live は FurnLive）・うえの ふた
    const { frustum, lathe, shadow, lg, L, at } = k, { cx, cy, rings } = LAVA;
    let s = shadow(0.12, 8, 14) + frustum(cx, cy, 0, 14, 30, 7.6, "#7C8B9B", "#A9B7C5", 1.4);
    s += lathe(cx, cy, rings, lg([[0, "#F8B8D8"], [0.55, "#E9A2E0"], [1, "#B9A4F0"]], 0, 0, 0, 1), 1.4);
    s += L([[-3, 34, 5.5], [3, 36, 4.2], [0, 46, 3.6]].map(([dx, z, r]) => at(cx + dx * 0.6, cy - dx * 0.6, z, `<ellipse rx="${r}" ry="${(r * 0.8).toFixed(1)}" fill="#FF7FB0" ${S(0.9)}/>`, r, r)).join(""));
    s += at(cx - 4, cy + 4, 70, `<path d="M-1.5,8 Q-2.5,0 -1,-8" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".7"/>`, 3, 9);
    s += frustum(cx, cy, 84, 6.4, 96, 3.6, "#7C8B9B", "#A9B7C5", 1.3);
    return s;
  };
  M.lamp_cat = (k) => {
    // ねこの ナイトライト: すわった ねこ（ミルクいろの からだ・まえあし・しっぽ・あたま・みみ）・ねむそうな かお・すずの くびわ
    const { egg, at, shadow, rod, dome, ball } = k, cx = 0, cy = -19, MILK = "#FFF6E8";
    let s = shadow(0.12, 6, 16) + dome(cx, cy, 0, 18, 14, 3, "#EADFCB", 1.2);
    s += egg(cx, cy, 18, 17, 14, 16, MILK, 1.5);
    s += rod([[cx + 12, cy + 6, 4], [cx + 6, cy + 13, 4], [cx - 4, cy + 15, 5], [cx - 11, cy + 12, 7]], MILK, 3.4);
    for (const dx of [-5.5, 5.5]) s += ball(cx + dx * 0.7, cy + 12 - dx * 0.7, 4, 3.4, MILK, 1.2, 0);
    s += egg(cx, cy + 4, 40, 15, 12, 12, MILK, 1.5);
    s += at(cx, cy + 4, 48, `<path d="M-14,-2 L-12,-15 L-4,-7 Z M14,-2 L12,-15 L4,-7 Z" fill="${MILK}" ${S(1.3)}/><path d="M-11.6,-4.5 L-10.6,-11.5 L-6.2,-7.2 Z M11.6,-4.5 L10.6,-11.5 L6.2,-7.2 Z" fill="#F7C6D2"/>`, 15, 16);
    s += egg(cx, cy + 4, 40, 15, 12, 12, MILK, 0, 'fill-opacity="0"');
    s += at(cx, cy + 15, 39, `<path d="M-7,-3 Q-4.5,-0.5 -2,-3 M2,-3 Q4.5,-0.5 7,-3" fill="none" ${S(1.3)}/><path d="M-1.4,0.3 L1.4,0.3 L0,1.9 Z" fill="#F29AA9"/><path d="M0,1.9 Q-1.5,3.6 -3,2.8 M0,1.9 Q1.5,3.6 3,2.8" fill="none" ${S(0.9)}/><path d="M-9,1 L-15,0 M-9,3 L-15,4 M9,1 L15,0 M9,3 L15,4" stroke="#C9B9A6" stroke-width="0.9" stroke-linecap="round"/><ellipse cx="-8.5" cy="2.8" rx="2.6" ry="1.5" fill="#F7B6C8" fill-opacity=".8"/><ellipse cx="8.5" cy="2.8" rx="2.6" ry="1.5" fill="#F7B6C8" fill-opacity=".8"/>`, 16, 8);
    s += at(cx, cy + 13, 30, `<path d="M-9,-1 Q0,3 9,-1" fill="none" stroke="#F2A7B8" stroke-width="2.6" stroke-linecap="round"/><circle cx="0" cy="2.4" r="2.4" fill="${BRASS}" ${S(0.9)}/>`, 10, 6);
    return s;
  };
  // アーチの さきの かさ（ランプの ひかる ところ）
  const ARC = { bx: -34, by: -23, tip: [30, -23, 132] };
  M.lamp_arc = (k) => {
    // アーチの フロアライト: しろい だいりせきの だい・きんの アーチ・おおきな まるい かさ（きんの ふち）・でんきゅう
    const { box, rod, lathe, ball, shape, TP, lineOn, FR } = k, { bx, by, tip } = ARC;
    let s = shape(TP(0), ov(bx, by, 22, 18, 24), INK, 0, 'fill-opacity=".12"') + shape(TP(0), ov(tip[0], tip[1], 26, 18, 24), INK, 0, 'fill-opacity=".06"');
    s += box(bx - 14, by - 14, 28, 28, 0, 12, ["#F2F0EC", "#D9D5CF", "#FFFFFF"], 1.4);
    s += lineOn(FR(by + 14.1), [[bx - 10, 3], [bx - 2, 8], [bx + 6, 5]], "#BDB7AE", 0.9) + lineOn(FR(by + 14.1), [[bx + 2, 2], [bx + 10, 9]], "#CFC9C0", 0.8);
    // まっすぐ たちあがって、まるい アーチで かさの うえに つく
    const top = tip[2] + 14, R = (tip[0] - bx) / 2, pts = [[bx, by, 12], ...Array.from({ length: 25 }, (_, n) => { const a = (n / 24) * Math.PI; return [bx + R - Math.cos(a) * R, by, top + Math.sin(a) * 40]; })];
    s += rod(pts, BRASS, 2.4);
    s += ball(tip[0], tip[1], tip[2] - 1, 4, "#FFF8D8", 1, 0.6);
    s += lathe(tip[0], tip[1], [[19, tip[2]], [17.5, tip[2] + 6], [13, tip[2] + 11], [6, tip[2] + 14], [2.5, tip[2] + 15]], "#F7F2E8", 1.5);
    s += lineOn(TP(tip[2] + 0.2), close(ov(tip[0], tip[1], 19, 19, 40)).filter(([x, y]) => (x - tip[0]) + (y - tip[1]) > -4), BRASSD, 2.2);
    return s;
  };
  // しょくだいの ろうそくの さき（ほのおの ばしょ）
  const CANDLES = [[0, -19, 70], [-19, -19, 58], [19, -19, 58]];
  M.lamp_candle = (k) => {
    // キャンドルの しょくだい: きんの だい・3ぼんの うで・うけざら・しろい ろうそく（たれた ろう）・ほのお（live は FurnLive）
    const { frustum, cyl, rod, at, shadow, L } = k, cy = -19;
    let s = shadow(0.12, 8, 12) + frustum(0, cy, 0, 13, 8, 6, BRASSD, BRASS, 1.4) + rod([[0, cy, 8], [0, cy, 46]], BRASS, 2.6);
    for (const sx of [-1, 1]) s += rod([[0, cy, 40], [sx * 9, cy, 38], [sx * 17, cy, 42], [sx * 19, cy, 46]], BRASS, 2.2);
    for (const [x, y, z] of CANDLES) {
      const z0 = z - 18;
      s += frustum(x, y, z0 - 3, 4.2, z0, 6.2, BRASSD, BRASS, 1.1) + cyl(x, y, z0, 3.4, 16, "#FFF6E6", "#FFFBF2", 1.2);
      s += at(x + 2, y + 2, z0 + 14, `<path d="M0,0 Q1,4 0,6 Q-1,4 0,0 Z" fill="#FFFBF2" ${S(0.8)}/>`, 2, 7);
      s += at(x, y, z - 2, `<path d="M0,0 L0,-3" ${S(1)}/>`, 1, 3);
      s += L(at(x, y, z - 4, `<path d="M0,-12 Q4,-6 3,-2 Q2,1 0,1 Q-2,1 -3,-2 Q-4,-6 0,-12 Z" fill="#FFB547" ${S(0.9)}/><path d="M0,-7 Q1.6,-4 1.2,-2 Q0,-0.6 -1.2,-2 Q-1.6,-4 0,-7 Z" fill="#FFF3B0"/>`, 4, 13));
    }
    return s;
  };
  // チューリップの かさ（ひかる ところ）
  const TULIPS = [[-15, -23, 96, "#F7A8C4"], [0, -23, 108, "#F7D56A"], [15, -23, 92, "#EE8A8A"]];
  M.lamp_tulip = (k) => {
    // チューリップの スタンド: みどりの まるい だい・くき・は・3つの チューリップの かさ
    const { cyl, rod, lathe, at, shadow } = k, cy = -23;
    let s = shadow(0.12, 8, 18) + cyl(0, cy, 0, 16, 4, "#5E9E50", "#7CC46E", 1.4);
    s += rod([[0, cy, 4], [0, cy, 66]], "#6AB35F", 2.6);
    for (const [x, y, z] of TULIPS) s += rod([[0, y, 64], [x * 0.5, y, z - 18], [x, y, z - 6]], "#6AB35F", 2);
    s += at(-3, cy + 3, 34, `<path d="M0,0 Q-14,-10 -10,-28 Q-2,-14 0,0 Z" fill="#7CC46E" ${S(1.1)}/><path d="M0,0 Q-6,-12 -9,-25" fill="none" stroke="#5E9E50" stroke-width="0.9"/>`, 12, 28);
    s += at(3, cy - 3, 44, `<path d="M0,0 Q13,-8 11,-26 Q3,-12 0,0 Z" fill="#8BCF7A" ${S(1.1)}/>`, 12, 26);
    for (const [x, y, z, c] of TULIPS) {
      s += lathe(x, y, [[3, z - 8], [7, z - 4], [8.4, z + 2], [8.2, z + 6]], c, 1.4);
      s += at(x, y, z + 6, `<path d="M-8.2,0 L-6,-6 L-3,-1.5 L0,-7.5 L3,-1.5 L6,-6 L8.2,0 Z" fill="${c}" ${S(1.1)}/>`, 9, 8);
    }
    return s;
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ================= さわる（FurnLive）=================
  const K = ShopRewardArt.liveKit, { mapper, since, say, tone, glow, ink, path, FXS, simple, lamp } = K;
  // ---- ラグ ----
  simple("rug_cloud", ["ふかふか〜、くもの うえ みたい", "ごろんって したく なる", "くもさん、ねむそう"], "puff", [0, -62, 6], [523, 659, 784]);
  simple("rug_heart", ["ハートの ラグ だいすき！", "ふわふわ ピンク", "なかよしの しるし！"], "heart", [0, -60, 6]);
  simple("rug_rainbow", ["にじの うえを あるいてる！", "7いろ ぜんぶ いえる？", "しましま きれい"], "spark", [0, -59, 6], [523, 587, 659, 698, 784, 880, 988]);
  simple("rug_berry", ["あまい いちごの ラグ", "つぶつぶ かわいい", "いちご たべたく なっちゃう"], "heart", [0, -63, 6]);
  // くま: タップで ウインク
  FurnLive.register("rug_bear", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([392, 523, 659]); say(sc, it, ["くまさん、こんにちは！", "くまさんが ウインク した！", "おみみ ふかふか"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 1.6) return;
      const P = mapper(sc, it, r), s = P.s, cy = -P.d / 2 + 6;
      if (t < 0.7) {
        // みぎの めを とじる（かおの いろで めを かくして ほそい せん）
        const c = P(21, cy - 10, 3.3); ctx.save(); ctx.fillStyle = "#C38A5D"; ctx.beginPath(); ctx.ellipse(c.x, c.y, 6.6 * s, 4.8 * s, 0, 0, TAU); ctx.fill();
        ink(ctx, 1.6 * s); ctx.beginPath(); ctx.moveTo(c.x - 5 * s, c.y); ctx.quadraticCurveTo(c.x, c.y + 2.6 * s, c.x + 5 * s, c.y); ctx.stroke(); ctx.restore();
      }
      FXS.heart(ctx, P, st, 0, cy, 10, 1.6);
    },
  });
  // どうろの マット: ミニカーが どうろを 1しゅう（タップの あと）。ふだんは とまって いる
  const roadPts = roadLine(), roadLen = roadPts.map((p, i) => Math.hypot(p[0] - roadPts[(i + 1) % roadPts.length][0], p[1] - roadPts[(i + 1) % roadPts.length][1]));
  const roadTotal = roadLen.reduce((a, b) => a + b, 0), ROAD0 = (() => { let best = 0, bd = 1e9; roadPts.forEach(([x, y], i) => { const dd = Math.hypot(x + 53, y + 32); if (dd < bd) { bd = dd; best = i; } }); return roadLen.slice(0, best).reduce((a, b) => a + b, 0); })();
  const roadAt = (u) => { let L = ((u % 1) + 1) % 1 * roadTotal; for (let i = 0; i < roadPts.length; i++) { if (L <= roadLen[i]) { const a = roadPts[i], b = roadPts[(i + 1) % roadPts.length], q = roadLen[i] ? L / roadLen[i] : 0; return { x: a[0] + (b[0] - a[0]) * q, y: a[1] + (b[1] - a[1]) * q, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; } L -= roadLen[i]; } return { x: roadPts[0][0], y: roadPts[0][1], ang: 0 }; };
  // むきの ある はこ（ミニカー）。P は 家具の ざひょう → 画面
  const carBox = (ctx, P, cx, cy, ang, L, W, z0, H, cols) => {
    const c = Math.cos(ang), s = Math.sin(ang), Q = (u, v, z) => P(cx + u * c - v * s, cy + u * s + v * c, z);
    ink(ctx, 1.1);
    for (const [u, v] of [[L / 2, 0], [-L / 2, 0], [0, W / 2], [0, -W / 2]]) {
      const nx = Math.sign(u) * c - Math.sign(v) * s, ny = Math.sign(u) * s + Math.sign(v) * c;
      if (nx + ny <= 0) continue;
      const e = u ? [[u, -W / 2], [u, W / 2]] : [[-L / 2, v], [L / 2, v]];
      path(ctx, [Q(e[0][0], e[0][1], z0), Q(e[1][0], e[1][1], z0), Q(e[1][0], e[1][1], z0 + H), Q(e[0][0], e[0][1], z0 + H)]); ctx.fillStyle = cols[1]; ctx.fill(); ctx.stroke();
    }
    path(ctx, [Q(-L / 2, -W / 2, z0 + H), Q(L / 2, -W / 2, z0 + H), Q(L / 2, W / 2, z0 + H), Q(-L / 2, W / 2, z0 + H)]); ctx.fillStyle = cols[0]; ctx.fill(); ctx.stroke();
  };
  FurnLive.register("rug_road", {
    tap(sc, it, st) { if (since(st) < 4.2) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[330, 440], null, [330, 440]], 0.16, "square", 0.04); say(sc, it, ["ぶっぶー、しゅっぱつ！", "どうろを ぐるっと 1しゅう", "おうだんほどうは とまってね"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), u = t >= 0 && t < 4 ? (t / 4) ** 1.1 : 0, q = roadAt(ROAD0 / roadTotal + u), bob = u ? Math.sin(G.t * 30) * 0.3 : 0;
      carBox(ctx, P, q.x, q.y, q.ang, 14, 8, 3.4 + bob, 4, ["#F7B66A", "#F29A3B"]);
      carBox(ctx, P, q.x - Math.cos(q.ang) * 1.5, q.y - Math.sin(q.ang) * 1.5, q.ang, 7, 6.4, 7.4 + bob, 3, ["#DDF4FB", "#BFE3EE"]);
    },
  }, true);
  // はちのす: タップで はちが ぶんぶん とぶ
  FurnLive.register("rug_honey", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; for (let i = 0; i < 6; i++) setTimeout(() => tone([[220 + i * 6, 240 + i * 6]], 0.1, "sawtooth", 0.015), i * 120); say(sc, it, ["はちさん、ぶんぶん！", "はちみつ あまそう", "はちの すの もよう！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 3) return;
      const P = mapper(sc, it, r), s = P.s, a = t * 4.2, c = P(34 + Math.sin(a) * 40, -68 + 26 + Math.sin(a * 2) * 24, 24 + Math.sin(t * 7) * 6), fl = Math.sin(G.t * 40) * 0.5 + 0.5;
      ctx.save(); ctx.globalAlpha = t > 2.6 ? (3 - t) / 0.4 : 1; ctx.translate(c.x, c.y); ctx.scale(Math.cos(a) > 0 ? 1 : -1, 1); ink(ctx, 1);
      ctx.fillStyle = "rgba(255,255,255,.9)"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 2.4 * s, -5 * s, 3 * s, (1.8 + fl * 1.6) * s, sx * 0.5, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#FFD94A"; ctx.beginPath(); ctx.ellipse(0, 0, 6 * s, 4.3 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.8 * s; for (const x of [-1.8, 1.4]) { ctx.beginPath(); ctx.moveTo(x * s, -3.6 * s); ctx.lineTo(x * s, 3.6 * s); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(4.4 * s, -0.8 * s, 0.9 * s, 0, TAU); ctx.fill(); ctx.restore();
    },
  });
  // おはなばたけ: タップで ちょうちょが 3びき まいあがる
  FurnLive.register("rug_flower", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 784, 880, 1047], 0.12, "sine", 0.08); say(sc, it, ["ちょうちょが とんだ！", "おはなばたけで ピクニック", "いい におい〜"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (t < 0 || t > 3) return;
      const P = mapper(sc, it, r), s = P.s;
      [["#F7B6C8", -30, -70], ["#9CC7E6", 30, -90], ["#F7D56A", 0, -40]].forEach(([c, x, y], i) => {
        const u = t / 3, p = P(x + Math.sin(t * 2.4 + i) * 16, y - u * 20, 6 + u * 70 + Math.sin(t * 5 + i) * 6), fl = Math.abs(Math.sin(G.t * 16 + i));
        ctx.save(); ctx.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1; ctx.translate(p.x, p.y); ink(ctx, 0.8); ctx.fillStyle = c;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 2.6 * s * fl, -1 * s, 2.6 * s * fl + 0.4, 3 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      });
      FXS.petal(ctx, P, st, 0, -61, 8, 2.4);
    },
  });
  // ---- ランプ ----
  lamp("lamp_mushroom", { pts: [[0, -25, 46, 26], [0, -25, 24, 16]], rgb: "255,200,170", big: 100, lines: ["きのこが ぽわっと ひかった", "きのこ おやすみ"] });
  lamp("lamp_andon", { pts: [[0, -24, 54, 30], [0, -24, 30, 22], [0, -24, 78, 22]], rgb: "255,214,150", big: 120, lines: ["あんどんの あかり、やさしいね", "あんどん おやすみ"] });
  lamp("lamp_moon", { pts: [[0, -26, 72, 30]], rgb: "255,246,200", big: 130, lines: ["おつきさまが ひかった！", "おつきさま おやすみ"] });
  lamp("lamp_cat", { pts: [[0, -19, 22, 20], [0, -13, 44, 15]], rgb: "255,228,180", big: 90, lines: ["ねこさんが ひかった！", "ねこさん、おやすみ"] });
  lamp("lamp_arc", { pts: [[ARC.tip[0], ARC.tip[1], ARC.tip[2], 26]], rgb: "255,224,170", big: 150, lines: ["アーチの ライト、ぱっ！", "ライト おやすみ"] });
  lamp("lamp_tulip", { pts: TULIPS.map(([x, y, z]) => [x, y, z, 14]), rgb: "255,228,200", rr: 14, big: 110, lines: ["チューリップが さいた みたい", "チューリップ おやすみ"] });
  // ラバランプ: ついて いる ときは たまが ゆっくり のぼって おりる。きえると したに しずむ
  const lavaR = (z) => { const R = LAVA.rings; for (let i = 0; i < R.length - 1; i++) if (z <= R[i + 1][1]) { const q = (z - R[i][1]) / (R[i + 1][1] - R[i][1]); return R[i][0] + (R[i + 1][0] - R[i][0]) * q; } return R[R.length - 1][0]; };
  lamp("lamp_lava", {
    pts: [[0, -18, 60, 22]], rgb: "255,150,210", big: 100, live: true, lines: ["とろとろ うごきだした！", "ラバランプ おやすみ"],
    extra(ctx, P, st, on) {
      const { cx, cy, rings } = LAVA, s = P.s, k = on ? Math.min(1, since(st) / 3) : 0, ring = rings.flatMap(([r, z]) => ov(cx, cy, r, r, 24).map(([x, y]) => P(x, y, z)));
      // ガラスの なかだけに 描く（りんかくの ないぶ）
      ctx.save(); ctx.beginPath(); const out = convex(ring); out.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.clip();
      [[5.6, 0], [4.4, 1.9], [3.8, 3.7], [3.2, 5.1], [4.8, 2.6]].forEach(([r, ph], i) => {
        const rest = 33 + i * 1.6, moving = 44 + Math.sin(G.t * (0.45 + i * 0.07) + ph) * 26, z = rest + (moving - rest) * k, rad = Math.min(r, lavaR(z) - 1.5), dx = Math.sin(G.t * 0.6 + ph) * (lavaR(z) - rad - 1) * k, c = P(cx + dx * 0.7, cy - dx * 0.7, z);
        ctx.fillStyle = "#FF6FA8"; ink(ctx, 0.9 * s); ctx.beginPath(); ctx.ellipse(c.x, c.y, rad * 1.1 * s, rad * 0.9 * s * (1 + Math.sin(G.t * 1.3 + ph) * 0.08 * k), 0, 0, TAU); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
    },
  });
  // しょくだい: ついて いる ときは ほのおが ゆれる。けすと すこし けむり
  lamp("lamp_candle", {
    pts: CANDLES.map(([x, y, z]) => [x, y, z - 6, 16]), rgb: "255,196,120", rr: 16, big: 120, live: true, lines: ["ろうそくの ひ、ゆらゆら", "ふーっ、けしたよ"],
    extra(ctx, P, st, on) {
      const s = P.s;
      CANDLES.forEach(([x, y, z], i) => {
        const c = P(x, y, z - 4);
        if (on) {
          const fl = 1 + Math.sin(G.t * 11 + i * 2) * 0.09 + Math.sin(G.t * 23 + i) * 0.05, sway = Math.sin(G.t * 5 + i) * 1.1 * s, h = 12 * s * fl;
          ctx.save(); ink(ctx, 0.9 * s);
          ctx.fillStyle = "#FFB547"; ctx.beginPath(); ctx.moveTo(c.x + sway, c.y - h); ctx.quadraticCurveTo(c.x + 4.4 * s, c.y - h * 0.5, c.x + 3 * s, c.y - 2 * s); ctx.quadraticCurveTo(c.x, c.y + 1.4 * s, c.x - 3 * s, c.y - 2 * s); ctx.quadraticCurveTo(c.x - 4.4 * s, c.y - h * 0.5, c.x + sway, c.y - h); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#FFF3B0"; ctx.beginPath(); ctx.ellipse(c.x + sway * 0.4, c.y - 4 * s, 1.5 * s, 3 * s, 0, 0, TAU); ctx.fill(); ctx.restore();
        } else if (since(st) < 1.6) {
          const u = since(st) / 1.6;
          ctx.save(); ctx.globalAlpha = (1 - u) * 0.8; ctx.strokeStyle = "#B9B2AA"; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(c.x, c.y - 2 * s); ctx.bezierCurveTo(c.x + 3 * s, c.y - 8 * s, c.x - 3 * s, c.y - 12 * s, c.x + Math.sin(u * 6) * 2 * s, c.y - (14 + u * 10) * s); ctx.stroke(); ctx.restore();
        }
      });
    },
  });
  // 点の あつまりを かこむ 凸な かたち（ラバランプの ガラスの なか）
  function convex(ps) {
    const a = ps.slice().sort((p, q) => p.x - q.x || p.y - q.y), cr = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x), lo = [], up = [];
    for (const p of a) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = a.length - 1; i >= 0; i--) { const p = a[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  return { ITEMS, IDS, rugs: IDS.filter((id) => FURN_INDEX[id].kind === "rug"), lamps: IDS.filter((id) => FURN_INDEX[id].kind !== "rug"), roadAt };
})();
