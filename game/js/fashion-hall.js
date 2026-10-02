// ファッションショーの 会場（UI-36）。池袋の「ほんの ギャラリー」の なかを ごうかな ホールに（オーナーの FB 2026-10-01「建物の内装も豪華で
// クオリティの高い仕様にして。建物に入ると、受付と着替えスペースがあって、過去のショーの写真も飾ってある。参加費500円もとる」）。
// サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・VenueHalls.defs.fashion）。きまりは js/fashion-show.js・ランウェイは js/fashion-scene.js。
// ・入口（みなみ）から 赤い じゅうたんが おくの「ランウェイ」の 入口まで。りょうがわに ロープの さく・天じょうに シャンデリア。
// ・うけつけ（入口の みぎ・ねこの うけつけの 人）: きょうの テーマを きいて、さんかひ 500コインを はらう。
// ・きがえ スペース（にしの かべ）: カーテンの こしつ 3つ と かがみの ドレッサー。きがえの 画面で おしゃれ レベル（★）と テーマに あう ふくの ふだ。
// ・しゃしんの かべ（きたの かべ）: これまでの ショーの しゃしん 4まい（町の 人）と、じぶんたちの ショーの しゃしん（あたらしい 4まい）。
// ・トロフィーの たな・けいひんの マネキン（4つの ランクの 服）・ラウンジ（ソファ）・ファッションの ほんの コーナー・きねん さつえいの かべ。
// 絵: 什器は 種類ごとの SVG（キーは 種類・大きさ・トロフィーの もって いる ぶん だけ → 有限）。字・ひかり・きらきら・じぶんの しゃしんは canvas で 毎フレーム。
const FashionHall = (() => {
  const W = 22, H = 18, ID = "fashion1";
  const GATE = { x: 11, y: 0, w: 6, h: 1 }, AT_GATE = [13, 1], AT_DOOR = [13, 16];
  // かべの しゃしん（きたの かべ・u は タイル）
  const FRAME = { w: 54, h: 72, b: 5 }, ROWS = [196, 102], GALLERY = [2.6, 9.8];
  const frameXs = () => { const n = 4, span = (GALLERY[1] - GALLERY[0]) * IsoVenue.T, gap = (span - n * (FRAME.w + FRAME.b * 2)) / (n - 1); return Array.from({ length: n }, (_, i) => GALLERY[0] * IsoVenue.T + i * (FRAME.w + FRAME.b * 2 + gap) + FRAME.b); };
  // これまでの ショー（町の 人の しゃしん。かべの 絵）
  const PAST = [
    { th: "kawaii", rk: "grand", sp: "rabbit", ci: 0, outfit: { head: "ribbon_pink", neck: "necklace", body: "dress" }, no: 1 },
    { th: "cool", rk: "gold", sp: "fox", ci: 1, outfit: { head: "tophat", face: "sunglasses", back: "cape" }, no: 2 },
    { th: "natsu", rk: "silver", sp: "bear", ci: 0, outfit: { head: "strawhat", body: "tshirt_star" }, no: 3 },
    { th: "yumekawa", rk: "grand", sp: "sheep", ci: 2, outfit: { head: "starclip", neck: "bowtie_blue", back: "fairywings" }, no: 4 },
  ];
  const GOLD = ["#F7DB86", "#E2B34A", "#C79531"], CREAM = ["#FFF9EE", "#F3E6CF", "#E4D2B3"], MARBLE = ["#FDFAF4", "#EEE6D8", "#DDD1BE"];
  const VELVET = ["#CF4A6B", "#AE3152", "#8C2340"], PLUM = ["#7A3F78", "#623266", "#4D2752"], ROSE = ["#F6C3D2", "#EAA0B6", "#CF7F98"];
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${fill}" ${extra}>${t}</text>`;
  const star = (x, y, r, fill, extra = "") => `<path d="${starPath(x, y, r, r * 0.45)}" fill="${fill}" ${extra}/>`;
  const img = (svg, x, y, w, h, extra = "", fit = "xMidYMax meet") => `<image href="${U.svgUrl(svg)}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="${fit}" ${extra}/>`;
  // いろの ちがう ふちの 線（S.poly・S.ellipse の w は 0 に して こちらを わたす。おなじ 属性を 2かい かかない）
  const ln = (col, w = 1.6) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // S.at（画面むきの 絵）の はみだす ぶんも 絵の はんいに いれる（いれないと viewBox で きれる）
  const atG = (S, x, y, z, inner, [x0, y0, x1, y1]) => { const q = S.P(x, y, z); S.grow(q.x + x0, q.y + y0, q.x + x1, q.y + y1); return S.at(x, y, z, inner); };
  const rose = (x, y, r, col) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${col}" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(x - r * 0.45)},${f2(y)} a${f2(r * 0.45)},${f2(r * 0.45)} 0 1 1 ${f2(r * 0.6)},${f2(r * 0.3)}" fill="none" stroke="${MallArt.shade(col, -0.3)}" stroke-width="1.1"/>`;

  // ---- 部屋 ----
  const room = () => {
    const rows = Array.from({ length: H }, () => Array(W).fill("."));
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    paint("r", 12, 1, 15, 17); paint("w", 1, 12, 3, 17); paint("m", 12, 17, 15, 17);
    const F = [];
    // ランウェイの 入口（きたの かべの まんなか）と りょうがわの スタンド花
    F.push({ kind: "gate", x: GATE.x, y: GATE.y, w: GATE.w, h: GATE.h, height: 286, label: "ランウェイの いりぐち", action: "gate", noFade: true, spots: [AT_GATE, [14, 1], [12, 1], [15, 1]] });
    for (const x of [10, 17]) F.push({ kind: "fstand", x, y: 0, w: 1, h: 1, height: 196, variant: x === 10 ? "l" : "r" });
    // 赤い じゅうたんの りょうがわの ロープ（とちゅうで よこぎれる）
    for (const x of [11, 16]) for (const y of [3, 9]) F.push({ kind: "rope", x, y, w: 1, h: 3, height: 74 });
    // うけつけ（入口の みぎ）: うしろの パネル・ねこの うけつけの 人・カウンター
    F.push({ kind: "backpanel", x: 17, y: 11, w: 5, h: 1, height: 214 });
    F.push({ kind: "npc", sp: "cat", ci: 0, x: 19, y: 12, w: 1, h: 1, dir: "down", emo: "happy", outfit: { neck: "bowtie_red" }, label: "うけつけ", action: "reception", spots: [[19, 14], [18, 14], [20, 14]] });
    F.push({ kind: "reception", x: 18, y: 13, w: 3, h: 1, height: 78, label: "うけつけ", action: "reception", spots: [[19, 14], [18, 14], [20, 14]] });
    // きがえ スペース（にしの かべ）: カーテンの こしつ 3つ・ドレッサー・スタイリスト
    F.push({ kind: "booth", x: 0, y: 1, w: 2, h: 6, dir: "x", height: 236, label: "きがえ スペース", action: "dress", spots: [[2, 4], [2, 2], [2, 6]] });
    F.push({ kind: "vanity", x: 0, y: 8, w: 1, h: 3, dir: "x", height: 236, label: "ドレッサー", action: "dress", spots: [[1, 9], [1, 8], [1, 10]] });
    F.push({ kind: "npc", sp: "sheep", ci: 1, x: 3, y: 2, w: 1, h: 1, dir: "left", emo: "happy", outfit: { face: "glasses", neck: "scarf_red" }, label: "スタイリストの メイ", action: "stylist", spots: [[3, 3], [4, 2], [3, 1]] });
    // ファッションの ほんの コーナー（にしの かべの てまえ。もとの 本やさん）
    F.push({ kind: "bookshelf", x: 0, y: 13, w: 1, h: 4, dir: "x", height: 206, label: "ファッションの ほん", action: "books", spots: [[1, 14], [1, 15], [1, 13], [1, 16]] });
    F.push({ kind: "armchair", x: 3, y: 16, w: 1, h: 1, height: 66, label: "ひとりがけ ソファ", action: "sit", text: "ふかふかの ソファ。ファッションの ほんを ひらいて ひとやすみ。", spots: [[3, 15], [4, 16]] });
    // しゃしんの かべ（きたの かべ）を みる ところ・けいひんの マネキン（4つの ランク）
    F.push({ kind: "gallery", x: 2, y: 0, w: 8, h: 1, walk: true, height: 300, label: "しゃしんの かべ", action: "gallery", noFade: true, spots: [[6, 1], [5, 1], [7, 1], [4, 1], [8, 1]] });
    ["bronze", "silver", "gold", "grand"].forEach((rk, i) => F.push({ kind: "gpedestal", x: 3 + i * 2, y: 5, w: 1, h: 1, height: 170, variant: rk, item: FashionShow.PRIZES[rk].wear, itemZ: 28, label: FashionShow.RANK[rk].name + "の けいひん", action: "prize", rank: rk, spots: [[3 + i * 2, 6], [3 + i * 2, 4]] }));
    // トロフィーの たな（きたの かべの みぎ）
    F.push({ kind: "trophycase", x: 18, y: 0, w: 3, h: 1, height: 206, label: "トロフィーの たな", action: "trophies", spots: [[19, 1], [18, 1], [20, 1]] });
    // きねん さつえいの かべ（ロゴの もよう）と カメラマン
    F.push({ kind: "photospot", x: 18, y: 5, w: 4, h: 1, height: 200, label: "さつえいの かべ", action: "photospot", spots: [[19, 7], [20, 7], [18, 7]] });
    F.push({ kind: "npc", sp: "dog", ci: 2, x: 21, y: 8, w: 1, h: 1, dir: "up", emo: "happy", outfit: { head: "beret" }, label: "カメラマンの ハル", action: "photospot", spots: [[20, 8], [21, 9]] });
    // ラウンジ（ソファ・まるい テーブル・はな）
    F.push({ kind: "lsofa", x: 4, y: 10, w: 4, h: 1, height: 74, label: "ソファ", action: "sit", text: "ビロードの ソファ。ショーの まえに ひとやすみ。", spots: [[5, 11], [6, 11], [4, 11], [7, 11]] });
    F.push({ kind: "lsofa", x: 8, y: 11, w: 1, h: 3, variant: "y", height: 74, label: "ソファ", action: "sit", text: "ビロードの ソファ。ショーの まえに ひとやすみ。", spots: [[7, 12], [7, 13]] });
    F.push({ kind: "ctable", x: 5, y: 12, w: 2, h: 1, height: 64 });
    // 入口: マットと でぐちの かんばん・りょうがわの はしら・きょうの テーマの かんばん
    F.push({ kind: "exitMat", x: 12, y: 17, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[13, 16], [14, 16]] });
    for (const x of [10, 17]) F.push({ kind: "column", x, y: 16, w: 1, h: 1, height: 300 });
    F.push({ kind: "easel", x: 10, y: 14, w: 1, h: 1, height: 150, label: "きょうの テーマ", action: "theme", spots: [[10, 15], [11, 14], [9, 14]] });
    F.push({ kind: "fstand", x: 21, y: 15, w: 1, h: 1, height: 196, variant: "r" });
    // シャンデリア（あたまの うえ）
    for (const [x, y] of FashionHall.LIGHTS) F.push({ kind: "chandelier", x: x - 0.75, y: y - 0.75, w: 1.5, h: 1.5, z: 196, height: 84, over: true, walk: true, fadeOver: true });
    // おきゃくさん（ショーを みに きた 町の 人）
    F.push({ kind: "npc", sp: "rabbit", ci: 2, x: 9, y: 2, w: 1, h: 1, dir: "up", emo: "happy", outfit: { head: "ribbon_blue" }, label: "おきゃくさん", action: "info", text: "かべの しゃしん、みんな すてき！ わたしも いつか ランウェイを あるいて みたいな。", spots: [[9, 3], [8, 2]] });
    F.push({ kind: "npc", sp: "panda", ci: 0, x: 3, y: 12, w: 1, h: 1, dir: "right", emo: "happy", label: "おきゃくさん", action: "info", text: "ポーズは カメラの わが ボタンの わに かさなった ときに おすんだって。はやすぎても だめ なんだよ。", spots: [[3, 13], [3, 11]] });
    return {
      id: ID, iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 300, scale: 0.5, spawn: AT_DOOR, crowd: 2, bgm: "fashion_hall", fashionHall: true,
      title: "ほんの ギャラリー", fixtures: F, mats: { ".": "fsMarble", r: "fsCarpet", w: "wood", m: "fsMat" },
      zones: [
        { x: 11, y: 0, w: 6, h: 2, shop: "fsGate", label: "ランウェイの いりぐち", map: "ランウェイ" },
        { x: 17, y: 11, w: 5, h: 4, shop: "fsDesk", label: "うけつけ" },
        { x: 0, y: 1, w: 3, h: 10, shop: "fsDress", label: "きがえ スペース", map: "きがえ" },
        { x: 2, y: 0, w: 8, h: 2, shop: "fsGallery", label: "しゃしんの かべ", map: "しゃしん" },
        { x: 3, y: 4, w: 7, h: 2, shop: "fsPrize", label: "けいひんの マネキン", map: "けいひん" },
        { x: 18, y: 0, w: 4, h: 2, shop: "fsTrophy", label: "トロフィーの たな", map: "トロフィー" },
        { x: 18, y: 5, w: 4, h: 4, shop: "fsPhoto", label: "さつえいの かべ", map: "さつえい" },
        { x: 4, y: 10, w: 5, h: 4, shop: "fsLounge", label: "ラウンジ" },
        { x: 0, y: 12, w: 4, h: 6, shop: "fsBooks", label: "ファッションの ほん", map: "ほん" },
      ],
    };
  };

  // ---- 絵 ----
  const art = Object.create(MallArt);
  const M = {
    // ランウェイの 入口: 金の はしら・アーチの でんきゅう・ビロードの カーテン・おくに ひかる ランウェイ
    gate(S, f) {
      const w = f.w, top = 250;
      let s = S.poly([[0.7, 0.18, 0], [w - 0.7, 0.18, 0], [w - 0.7, 0.18, top], [0.7, 0.18, top]], "#221A38", 1.6);
      // おくの ランウェイ（ひかる ゆか）と ライトの すじ
      s += S.poly([[2.3, 0.18, 1], [w - 2.3, 0.18, 1], [w - 2.0, 1, 1], [2.0, 1, 1]], "#F6F0FB", 1.4) + S.line([[w / 2, 0.2, 1.5], [w / 2, 1, 1.5]], "#FF9EC4", 3);
      for (const u of [1.4, w / 2, w - 1.4]) s += S.poly([[u - 0.12, 0.2, top - 4], [u + 0.12, 0.2, top - 4], [u + 0.5, 0.2, 10], [u - 0.5, 0.2, 10]], "#FFF5D6", 0, `opacity="0.16"`);
      // ビロードの カーテン（りょうがわに まとめて ある）と うえの ひだ
      for (const side of [0, 1]) {
        const a = side ? w - 0.7 : 0.7, b = side ? w - 1.75 : 1.75, tie = 112, k = side ? -1 : 1;
        s += S.poly([[a, 0.26, top], [b, 0.26, top], [a + k * 0.62, 0.26, tie + 8], [a + k * 0.5, 0.26, 4], [a, 0.26, 4]], VELVET[1], 1.6);
        for (let i = 1; i < 4; i++) { const t = i / 4; s += S.line([[a + (b - a) * t, 0.26, top - 2], [a + k * 0.52 * t + k * 0.06, 0.26, tie + 6], [a + k * 0.42 * t, 0.26, 8]], VELVET[2], 1.4); }
        s += S.at(a + k * 0.6, 0.26, tie, `<ellipse rx="7" ry="5" fill="${GOLD[0]}" ${S.st(1.4)}/><path d="M-2,4 L-5,20 M2,4 L5,20" stroke="${GOLD[1]}" stroke-width="2.4" stroke-linecap="round"/>`);
      }
      for (let i = 0; i < 6; i++) { const u0 = 0.7 + ((w - 1.4) / 6) * i, u1 = u0 + (w - 1.4) / 6, um = (u0 + u1) / 2; s += S.poly([[u0, 0.3, top], [u1, 0.3, top], [u1, 0.3, top - 16], [um, 0.3, top - 30], [u0, 0.3, top - 16]], VELVET[0], 1.4); s += S.at(um, 0.3, top - 30, `<circle r="3.2" fill="${GOLD[0]}" ${S.st(1)}/>`); }
      // 金の はしら（りょうがわ）と アーチの はり
      for (const u of [0, w - 0.7]) {
        s += S.box(u + 0.04, 0.12, 0.62, 0.76, 0, 14, GOLD) + S.box(u + 0.1, 0.18, 0.5, 0.64, 14, top - 14, ["#FFFBF3", "#F4EBDC", "#E5D7BF"]);
        for (const z of [60, 120, 180]) s += S.poly([[u + 0.1, 0.82, z], [u + 0.6, 0.82, z], [u + 0.6, 0.82, z + 4], [u + 0.1, 0.82, z + 4]], GOLD[1], 0.8);
        s += S.box(u, 0.08, 0.7, 0.84, top - 6, 12, GOLD);
      }
      s += S.box(0, 0.06, w, 0.88, top + 6, 30, ["#F9E6A9", "#E8BE58", "#C99A35"]);
      s += S.poly([[0.5, 0.94, top + 12], [w - 0.5, 0.94, top + 12], [w - 0.5, 0.94, top + 30], [0.5, 0.94, top + 30]], "#2A2140", 1.2);
      return s;
    },
    // スタンド花（ピンクと しろの ばら・リボン）
    fstand(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.34, "#00000016", 0);
      for (const [x, y] of [[0.25, 0.35], [0.75, 0.35], [0.5, 0.78]]) s += S.line([[0.5, 0.5, 96], [x, y, 0]], GOLD[2], 2.6);
      s += S.line([[0.5, 0.5, 96], [0.5, 0.5, 120]], "#7DA36B", 3);
      const cols = ["#FFFFFF", "#F6B2C6", "#FF8FB0", "#FFE3EC", "#F9CBDA"];
      let r = "";
      for (let i = 0; i < 16; i++) { const a = i * 2.4, rad = 6 + (i % 4) * 7, x = Math.cos(a) * rad * 1.15, y = Math.sin(a) * rad * 0.9; r += rose(x, y - 30 + (i % 3) * 2, 7.2 - (i % 4) * 0.5, cols[i % cols.length]); }
      s += atG(S, 0.5, 0.5, 120, `<ellipse cx="0" cy="-30" rx="38" ry="32" fill="#8DB97A" ${S.st(1.4)}/>${r}<path d="M-6,4 L-14,30 L-4,26 Z M6,4 L14,30 L4,26 Z" fill="${VELVET[0]}" ${S.st(1.2)}/><circle cx="0" cy="2" r="5" fill="${VELVET[0]}" ${S.st(1.2)}/>`, [-42, -66, 42, 34]);
      return s;
    },
    // ロープの さく（金の ポール・あかい ロープ）
    rope(S, f) {
      const along = f.h >= f.w, n = 3, pts = Array.from({ length: n }, (_, i) => (along ? [0.5, 0.25 + i * ((f.h - 0.5) / (n - 1))] : [0.25 + i * ((f.w - 0.5) / (n - 1)), 0.5]));
      let s = "";
      for (const [x, y] of pts) s += S.ellipse(x, y, 0, 0.16, "#00000018", 0) + S.cyl(x, y, 0.14, 0, 6, GOLD) + S.cyl(x, y, 0.045, 6, 58, [GOLD[0], GOLD[1]], 1.2) + S.at(x, y, 66, `<circle r="5.5" fill="${GOLD[0]}" ${S.st(1.3)}/>`);
      for (let i = 0; i < n - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; s += S.line([[x0, y0, 60], [(x0 + x1) / 2, (y0 + y1) / 2, 40], [x1, y1, 60]], VELVET[1], 4.2) + S.line([[x0, y0, 60], [(x0 + x1) / 2, (y0 + y1) / 2, 40], [x1, y1, 60]], VELVET[0], 1.6); }
      return s;
    },
    // うけつけの カウンター（大理石の てんばん・ビロードの まえいた・金の ふち・ベル・はな・パンフレット）
    reception(S, f) {
      const w = f.w;
      let s = S.box(0.02, 0.12, w - 0.04, 0.8, 0, 8, GOLD) + S.box(0.08, 0.18, w - 0.16, 0.68, 8, 56, ["#F8F1E6", VELVET[1], VELVET[2]]);
      for (let i = 0; i < 3; i++) { const u0 = 0.25 + i * ((w - 0.5) / 3), u1 = u0 + (w - 0.5) / 3 - 0.12; s += S.poly([[u0, 0.87, 16], [u1, 0.87, 16], [u1, 0.87, 56], [u0, 0.87, 56]], "none", 0, ln(GOLD[0], 1.6)); }
      s += S.at(w / 2, 0.87, 37, `<circle r="12" fill="${GOLD[1]}" ${S.st(1.4)}/>${star(0, 0, 7.5, "#FFF4C8", S.st(1))}`);
      s += S.box(0, 0.1, w, 0.84, 64, 8, MARBLE) + S.box(-0.02, 0.08, w + 0.04, 0.88, 71, 3, GOLD, 1);
      s += S.at(w - 0.45, 0.5, 74, `<ellipse cx="0" cy="0" rx="9" ry="3.5" fill="${GOLD[2]}" ${S.st(1)}/><path d="M-7,0 A7,8 0 0 1 7,0 Z" fill="${GOLD[0]}" ${S.st(1.2)}/><circle cy="-9" r="2" fill="${GOLD[1]}" ${S.st(0.8)}/>`);
      s += atG(S, 0.4, 0.45, 74, `<path d="M-6,0 L-8,-22 L8,-22 L6,0 Z" fill="#CFE7EC" ${S.st(1.2)}/>${rose(-5, -26, 5, "#FF8FB0")}${rose(4, -28, 5, "#FFFFFF")}${rose(0, -34, 4.4, "#F6B2C6")}`, [-12, -42, 12, 2]);
      s += S.box(1.15, 0.35, 0.5, 0.25, 74, 22, ["#FFFFFF", "#E8E0F2", "#D2C7E3"], 1.2);
      return s;
    },
    // うけつけの うしろの パネル（ロゴは L で 字）
    backpanel(S, f) {
      const w = f.w;
      let s = S.box(0, 0.38, w, 0.26, 0, 12, GOLD) + S.box(0.06, 0.42, w - 0.12, 0.18, 12, 190, ["#F3E4C4", PLUM[1], PLUM[2]]) + S.box(0, 0.36, w, 0.3, 202, 12, GOLD);
      s += S.poly([[0.3, 0.61, 30], [w - 0.3, 0.61, 30], [w - 0.3, 0.61, 186], [0.3, 0.61, 186]], "none", 0, ln(GOLD[0], 2.2));
      for (let i = 0; i < 7; i++) s += S.at(0.6 + i * ((w - 1.2) / 6), 0.61, i % 2 ? 60 : 168, star(0, 0, 6, "#F7DB86", S.st(0.9)));
      return s;
    },
    // きがえの こしつ 3つ（まえは +x。金の ぼう・ビロードの カーテン・ばんごうの ほし。まんなかは すこし あいて かがみが みえる）
    booth(S, f) {
      const D = f.w, L = f.h, n = 3, bw = L / n, top = 226;
      let s = S.box(0, 0, D, L, 0, 6, ["#E9D7B6", "#D8C29C", "#C6AE86"]);
      for (let k = 0; k < n; k++) {
        const y0 = k * bw, y1 = y0 + bw;
        // おくの かべ（こしつの なか）
        s += S.poly([[0.1, y0 + 0.08, 6], [0.1, y1 - 0.08, 6], [0.1, y1 - 0.08, top], [0.1, y0 + 0.08, top]], "#F6EAF2", 1.2);
        if (k === 1) s += S.poly([[0.12, y0 + 0.5, 50], [0.12, y1 - 0.5, 50], [0.12, y1 - 0.5, 196], [0.12, y0 + 0.5, 196]], "#D7EEF4", 0, ln(GOLD[1], 1.8)) + S.poly([[0.13, y0 + 0.62, 150], [0.13, y0 + 0.8, 186], [0.13, y0 + 0.9, 186], [0.13, y0 + 0.72, 150]], "#FFFFFF", 0, `opacity="0.7"`);
        // しきり
        s += S.box(0, y0, D - 0.1, 0.1, 6, top, ["#FFF6E6", "#F1E2C6", "#E0CCA6"]);
        // カーテン（ひだの 線）。まんなかは はんぶん あけて ある
        const cy0 = y0 + 0.12, cy1 = k === 1 ? y0 + bw * 0.45 : y1 - 0.12, col = [VELVET, PLUM, VELVET][k];
        s += S.poly([[D - 0.12, cy0, 14], [D - 0.12, cy1, 14], [D - 0.12, cy1, top - 8], [D - 0.12, cy0, top - 8]], col[1], 1.6);
        for (let i = 1; i < 6; i++) { const y = cy0 + ((cy1 - cy0) * i) / 6; s += S.line([[D - 0.12, y, 16], [D - 0.12, y, top - 10]], col[2], 1.2); }
        s += S.poly([[D - 0.12, cy0, 14], [D - 0.12, cy1, 14], [D - 0.12, cy1, 24], [D - 0.12, cy0, 24]], GOLD[1], 1);
      }
      s += S.box(0, L - 0.1, D - 0.1, 0.1, 6, top, ["#FFF6E6", "#F1E2C6", "#E0CCA6"]);
      // うえの はり（金）と ばんごうの ほし
      s += S.box(D - 0.2, 0, 0.16, L, top - 6, 16, GOLD) + S.box(0, 0, D - 0.04, L, top + 10, 8, ["#F9E6A9", "#E8BE58", "#C99A35"]);
      for (let k = 0; k < n; k++) s += S.at(D - 0.12, k * bw + bw / 2, top - 22, `${star(0, 0, 11, GOLD[0], S.st(1.3))}<text y="4.5" font-size="11" font-weight="900" text-anchor="middle" font-family="sans-serif" fill="${INK}">${k + 1}</text>`);
      return s;
    },
    // ドレッサー（でんきゅうの わくの かがみ・けしょう どうぐ・まるい いす）
    vanity(S, f) {
      const L = f.h;
      let s = S.poly([[0.08, 0.3, 84], [0.08, L - 0.3, 84], [0.08, L - 0.3, 226], [0.08, 0.3, 226]], GOLD[1], 1.6) + S.poly([[0.09, 0.42, 96], [0.09, L - 0.42, 96], [0.09, L - 0.42, 214], [0.09, 0.42, 214]], "#D9EEF5", 1.4);
      s += S.poly([[0.1, 0.6, 160], [0.1, 0.95, 205], [0.1, 1.15, 205], [0.1, 0.8, 160]], "#FFFFFF", 0, `opacity="0.75"`);
      for (let i = 0; i <= 6; i++) { const y = 0.36 + ((L - 0.72) * i) / 6; s += S.at(0.1, y, 220, `<circle r="4.2" fill="#FFF6C8" ${S.st(1.1)}/>`); }
      for (let i = 1; i < 5; i++) for (const y of [0.36, L - 0.36]) s += S.at(0.1, y, 90 + i * 25, `<circle r="4.2" fill="#FFF6C8" ${S.st(1.1)}/>`);
      // つくえ（白い 大理石・金の あし）
      for (const y of [0.2, L - 0.35]) s += S.box(0.52, y, 0.1, 0.12, 0, 62, GOLD, 1.2);
      s += S.box(0.06, 0.12, 0.62, L - 0.24, 62, 10, ["#FFFFFF", "#F1E9DD", "#E2D7C6"]) + S.box(0.1, 0.4, 0.5, 0.9, 40, 22, ["#F8EFF3", "#EAD8E1", "#D9C2CF"], 1.2) + S.box(0.1, L - 1.3, 0.5, 0.9, 40, 22, ["#F8EFF3", "#EAD8E1", "#D9C2CF"], 1.2);
      // けしょう どうぐ（こうすいの びん・パフ・はこ）
      s += S.at(0.3, 0.7, 72, `<rect x="-4" y="-14" width="8" height="14" rx="2" fill="#F6B2C6" ${S.st(1)}/><rect x="-1.6" y="-19" width="3.2" height="5" fill="${GOLD[0]}" ${S.st(0.8)}/>`);
      s += S.at(0.3, 1.25, 72, `<ellipse rx="7" ry="3" fill="#FFE3EC" ${S.st(1)}/>`) + S.at(0.3, 2.1, 72, `<rect x="-7" y="-8" width="14" height="8" rx="2" fill="#B79BEA" ${S.st(1)}/><rect x="-7" y="-10" width="14" height="3" rx="1" fill="#D6C6F3" ${S.st(0.8)}/>`);
      // まるい いす（ピンクの ビロード）
      s += S.cyl(0.86, 1.5, 0.12, 0, 26, [GOLD[0], GOLD[1]], 1.2) + S.cyl(0.86, 1.5, 0.22, 26, 14, [ROSE[0], ROSE[1]], 1.3);
      return s;
    },
    // ファッションの ほんの たな（まえは +x。いろとりどりの ほん・ざっしの 表紙）
    bookshelf(S, f) {
      const L = f.h, cols = ["#F29BB8", "#9FD3F0", "#FFE07A", "#B79BEA", "#7CCB6B", "#FFB36B", "#E8434F", "#5B6CC9"];
      let s = S.box(0.04, 0.04, 0.82, L - 0.08, 0, 206, ["#D7B78C", "#B98F5E", "#A57B4D"]);
      s += S.poly([[0.87, 0.12, 8], [0.87, L - 0.12, 8], [0.87, L - 0.12, 196], [0.87, 0.12, 196]], "#6E4B2E", 1.4);
      for (let row = 0; row < 4; row++) {
        const z0 = 12 + row * 46; s += S.poly([[0.87, 0.12, z0 - 4], [0.87, L - 0.12, z0 - 4], [0.87, L - 0.12, z0], [0.87, 0.12, z0]], "#C9A374", 1);
        let y = 0.18;
        for (let i = 0; y < L - 0.3; i++) {
          const h = 28 + ((row * 7 + i * 5) % 12), bw = 0.1 + ((row + i) % 3) * 0.03, c = cols[(row * 3 + i) % cols.length];
          if ((row * 5 + i) % 7 === 3) { s += S.poly([[0.88, y, z0], [0.88, y + 0.36, z0], [0.88, y + 0.36, z0 + 38], [0.88, y, z0 + 38]], "#FFFDF6", 1.1) + S.poly([[0.89, y + 0.05, z0 + 18], [0.89, y + 0.31, z0 + 18], [0.89, y + 0.31, z0 + 34], [0.89, y + 0.05, z0 + 34]], c, 0.8); y += 0.42; continue; }
          s += S.poly([[0.88, y, z0], [0.88, y + bw, z0], [0.88, y + bw, z0 + h], [0.88, y, z0 + h]], c, 1); y += bw + 0.015;
        }
      }
      return s;
    },
    // ひとりがけの ソファ（ビロード・金の あし）
    armchair(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.42, "#00000016", 0);
      for (const [x, y] of [[0.18, 0.18], [0.72, 0.18], [0.18, 0.72], [0.72, 0.72]]) s += S.box(x, y, 0.1, 0.1, 0, 12, GOLD, 1);
      s += S.box(0.1, 0.1, 0.8, 0.8, 12, 22, ROSE) + S.box(0.1, 0.1, 0.8, 0.2, 34, 34, ROSE) + S.box(0.1, 0.3, 0.16, 0.6, 34, 14, ROSE) + S.box(0.74, 0.3, 0.16, 0.6, 34, 14, ROSE);
      return s;
    },
    // けいひんの マネキンの 台（金の ふち・ランクの いろ）
    gpedestal(S, f) {
      const R = FashionShow.RANK[f.variant] || FashionShow.RANKS[0];
      let s = S.ellipse(0.5, 0.5, 0, 0.48, "#00000018", 0) + S.cyl(0.5, 0.5, 0.44, 0, 8, GOLD) + S.cyl(0.5, 0.5, 0.38, 8, 18, [R.col, MallArt.shade(R.col, -0.18)]) + S.ellipse(0.5, 0.5, 26, 0.3, "#FFFFFF55", 0);
      s += S.box(0.2, 0.9, 0.6, 0.06, 4, 18, ["#FFFDF6", "#FFFDF6", "#E8E0D0"], 1);
      return s;
    },
    // トロフィーの たな（ガラスの たな 3だん。もって いる トロフィーは いろ・まだの ものは かげ）
    trophycase(S, f) {
      const w = f.w, got = FashionHall.trophiesGot(), list = FashionShow.FURN;
      let s = S.box(0.04, 0.12, w - 0.08, 0.76, 0, 18, GOLD) + S.poly([[0.1, 0.16, 18], [w - 0.1, 0.16, 18], [w - 0.1, 0.16, 196], [0.1, 0.16, 196]], "#3B2D55", 1.4);
      for (const z of [80, 140]) s += S.box(0.1, 0.18, w - 0.2, 0.68, z, 3, ["#E9F5F8", "#CFE7EC", "#B9DCE3"], 1);
      list.forEach((T, i) => {
        const z = i < 2 ? 21 : i < 3 ? 83 : 143, u = i < 2 ? 0.75 + i * (w - 1.5) : w / 2, A = FashionArt.TROPHY[T.id], has = got.includes(T.id);
        const cup = FashionArt.cupSvg(A, T.id === "fs_trophy_grand");
        s += S.at(u, 0.5, z, has ? img(cup, -18, -50, 36, 50) : `<g opacity="0.34">${img(cup, -18, -50, 36, 50, `style="filter:brightness(0.25)"`)}</g><text y="-18" font-size="14" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">?</text>`);
      });
      s += S.box(0.02, 0.1, w - 0.04, 0.8, 196, 10, GOLD) + S.poly([[0.1, 0.88, 18], [w - 0.1, 0.88, 18], [w - 0.1, 0.88, 196], [0.1, 0.88, 196]], "#DDF2F7", 1.6, `fill-opacity="0.22"`);
      s += S.poly([[0.3, 0.89, 120], [0.55, 0.89, 186], [0.7, 0.89, 186], [0.45, 0.89, 120]], "#FFFFFF", 0, `opacity="0.45"`);
      return s;
    },
    // きねん さつえいの かべ（しろい パネルに ロゴの もよう・りょうがわに ライト）
    photospot(S, f) {
      const w = f.w;
      let s = S.box(0.1, 0.4, w - 0.2, 0.2, 0, 8, GOLD) + S.box(0.14, 0.44, w - 0.28, 0.12, 8, 176, ["#FFFFFF", "#FBF7FF", "#E6DDF0"]) + S.box(0.1, 0.4, w - 0.2, 0.2, 184, 8, GOLD);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const u = 0.45 + c * ((w - 0.9) / 5) + (r % 2 ? 0.2 : 0), z = 40 + r * 38; if (u > w - 0.3) continue; s += S.at(u, 0.57, z, (r + c) % 2 ? star(0, 0, 6, "#E9B8D4", S.st(0.8)) : `<text y="4" font-size="11" font-weight="900" text-anchor="middle" font-family="sans-serif" fill="#B79BEA">PK</text>`); }
      // ライト（スタンドと しろい かさ）
      for (const u of [0.1, w - 0.1]) s += S.line([[u, 0.95, 0], [u, 0.95, 150]], "#5A5560", 3) + S.at(u, 0.95, 160, `<path d="M-14,-14 L14,-14 L10,8 L-10,8 Z" fill="#FFFFFF" ${S.st(1.3)}/><ellipse cy="8" rx="10" ry="3" fill="#FFF6C8" ${S.st(1)}/>`);
      return s;
    },
    // ビロードの ソファ（ボタンじめ・金の あし）
    lsofa(S, f) {
      const ax = f.variant !== "y", Wd = f.w, D = f.h;
      let s = "";
      const legs = ax ? [[0.15, 0.2], [Wd - 0.25, 0.2], [0.15, D - 0.3], [Wd - 0.25, D - 0.3]] : [[0.2, 0.15], [0.2, D - 0.25], [D - 0.3 + Wd - 1, 0.15], [Wd - 0.3, D - 0.25]];
      for (const [x, y] of legs) s += S.box(x, y, 0.1, 0.1, 0, 12, GOLD, 1);
      if (ax) {
        s += S.box(0.05, 0.1, Wd - 0.1, D - 0.15, 12, 24, VELVET) + S.box(0.05, 0.05, Wd - 0.1, 0.28, 36, 34, VELVET) + S.box(0.05, 0.3, 0.22, D - 0.4, 36, 16, VELVET) + S.box(Wd - 0.27, 0.3, 0.22, D - 0.4, 36, 16, VELVET);
        for (let i = 0; i < Wd * 2 - 1; i++) s += S.at(0.45 + i * 0.5, 0.33, 54, `<circle r="2" fill="${VELVET[2]}"/>`);
      } else {
        s += S.box(0.1, 0.05, Wd - 0.15, D - 0.1, 12, 24, VELVET) + S.box(Wd - 0.33, 0.05, 0.28, D - 0.1, 36, 34, VELVET) + S.box(0.3, 0.05, Wd - 0.6, 0.22, 36, 16, VELVET) + S.box(0.3, D - 0.27, Wd - 0.6, 0.22, 36, 16, VELVET);
        for (let i = 0; i < D * 2 - 1; i++) s += S.at(Wd - 0.33, 0.45 + i * 0.5, 54, `<circle r="2" fill="${VELVET[2]}"/>`);
      }
      return s;
    },
    // まるい テーブル（大理石・金の あし・はなの かびん）
    ctable(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.ellipse(cx, cy, 0, 0.7, "#00000014", 0) + S.cyl(cx, cy, 0.42, 0, 4, GOLD, 1.2) + S.cyl(cx, cy, 0.07, 4, 34, [GOLD[0], GOLD[1]], 1.2) + S.cyl(cx, cy, 0.72, 38, 6, MARBLE);
      s += atG(S, cx, cy, 44, `<path d="M-5,0 L-7,-18 L7,-18 L5,0 Z" fill="#CFE7EC" ${S.st(1.1)}/>${rose(-6, -23, 5.5, "#FF8FB0")}${rose(5, -25, 5.5, "#FFFFFF")}${rose(0, -31, 5, "#F6B2C6")}<path d="M-10,-20 Q-16,-30 -12,-34 M10,-20 Q16,-30 12,-34" stroke="#7DA36B" stroke-width="2" fill="none"/>`, [-18, -40, 18, 2]);
      return s;
    },
    // 入口の はしら（大理石・金の かざり）
    column(S, f) {
      const h = f.height || 300;
      let s = S.ellipse(0.5, 0.5, 0, 0.48, "#00000016", 0) + S.box(0.08, 0.08, 0.84, 0.84, 0, 18, GOLD) + S.cyl(0.5, 0.5, 0.3, 18, h - 46, ["#FFFBF4", "#EEE5D6"]);
      for (const z of [80, 160, 220]) s += S.cyl(0.5, 0.5, 0.315, z, 4, [GOLD[0], GOLD[1]], 0.8);
      s += S.box(0.06, 0.06, 0.88, 0.88, h - 28, 28, GOLD);
      return s;
    },
    // きょうの テーマの かんばん（イーゼル。テーマの 字は L）
    easel(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.36, "#00000016", 0);
      for (const [x, y] of [[0.25, 0.75], [0.75, 0.75], [0.5, 0.2]]) s += S.line([[x, y, 0], [0.5, 0.55, 140]], "#9A6B3E", 3);
      s += S.poly([[0.12, 0.72, 52], [0.88, 0.72, 52], [0.88, 0.72, 138], [0.12, 0.72, 138]], GOLD[1], 1.6) + S.poly([[0.17, 0.73, 57], [0.83, 0.73, 57], [0.83, 0.73, 133], [0.17, 0.73, 133]], "#2E2448", 1.2);
      return s;
    },
    // シャンデリア（金の わ・クリスタル・ろうそくの でんきゅう。くさりは 天じょうへ）
    chandelier(S, f) {
      const cx = f.w / 2, cy = f.h / 2, z = f.z || 196;
      let s = S.line([[cx, cy, z + 40], [cx, cy, z + 120]], GOLD[2], 2.4);
      for (const [r, zz] of [[0.62, z + 4], [0.4, z + 26]]) {
        s += S.ellipse(cx, cy, zz, r, "none", 0, ln(GOLD[1], 3.4));
        const n = r > 0.5 ? 10 : 7;
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; s += atG(S, x, y, zz, `<path d="M0,0 L-2.6,7 L0,13 L2.6,7 Z" fill="#E9F6FF" ${S.st(0.9)}/>`, [-4, -1, 4, 14]) + atG(S, x, y, zz + 2, `<rect x="-1.6" y="-10" width="3.2" height="10" fill="#FFFDF2" ${S.st(0.7)}/><ellipse cy="-13" rx="2.6" ry="3.6" fill="#FFE07A" ${S.st(0.7)}/>`, [-4, -18, 4, 1]); }
      }
      s += S.at(cx, cy, z + 38, `<circle r="7" fill="${GOLD[0]}" ${S.st(1.2)}/>`) + atG(S, cx, cy, z - 6, `<path d="M0,0 L-4,10 L0,18 L4,10 Z" fill="#E9F6FF" ${S.st(1)}/>`, [-5, -1, 5, 19]);
      return s;
    },
  };
  // 動く ところ（毎フレーム）: 字・でんきゅう・きらきら
  const L = {
    gate(ctx, sc, f, off) {
      const s = sc.s, P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), t = G.t, w = f.w, top = 250;
      // アーチの でんきゅう（ながれる）
      for (let i = 0; i <= 16; i++) { const q = P(f.x + 0.35 + ((w - 0.7) * i) / 16, f.y + 0.94, top + 21), on = (i + Math.floor(t * 6)) % 3 === 0; ctx.fillStyle = on ? "#FFF6B0" : "#E7B954"; ctx.beginPath(); ctx.arc(q.x, q.y, (on ? 3.4 : 2.6) * s * 2, 0, 7); ctx.fill(); }
      this.faceText(ctx, sc, off, "y", f.x + w / 2, f.y + 0.95, top + 21, "ランウェイ", 19, (w - 1.4) * IsoVenue.T, "#FFE9A8");
      // さんかの うけつけが すんで いる ときは 入口が ひかる
      if (FashionShow.hasEntry()) {
        const a = 0.25 + 0.2 * Math.sin(t * 4), q = P(f.x + w / 2, f.y + 0.6, 90);
        ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 110 * s); g.addColorStop(0, `rgba(255,236,160,${a.toFixed(3)})`); g.addColorStop(1, "rgba(255,236,160,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 110 * s, 0, 7); ctx.fill(); ctx.restore();
        this.faceText(ctx, sc, off, "y", f.x + w / 2, f.y + 0.9, 150 + Math.sin(t * 3) * 4, "ここから ショーへ！", 17, (w - 2) * IsoVenue.T, "#FFFFFF");
      }
    },
    backpanel(ctx, sc, f, off) {
      this.faceText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.62, 148, "ぽかぽか コレクション", 24, (f.w - 0.8) * IsoVenue.T, "#FFE9A8");
      this.faceText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.62, 108, "うけつけ ・ さんかひ 500コイン", 14, (f.w - 0.8) * IsoVenue.T, "#FFFFFF");
    },
    easel(ctx, sc, f, off) {
      const T = FashionShow.theme();
      this.faceText(ctx, sc, off, "y", f.x + 0.5, f.y + 0.74, 121, "きょうの テーマ", 9, 0.62 * IsoVenue.T, "#FFE9A8");
      this.faceText(ctx, sc, off, "y", f.x + 0.5, f.y + 0.74, 96, T.name, T.name.length > 4 ? 11 : 14, 0.62 * IsoVenue.T, "#FFFFFF");
      const q = sc.toScreen(IsoVenue.p(f.x + 0.5, f.y + 0.74, 72), off); ctx.fillStyle = T.col; ctx.beginPath(); ctx.arc(q.x, q.y, 5 * sc.s * 2, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * sc.s * 2; ctx.stroke();
    },
    gpedestal(ctx, sc, f, off) { this.faceText(ctx, sc, off, "y", f.x + 0.5, f.y + 0.97, 13, FashionShow.RANK[f.variant].name.replace("がんばったで しょう", "がんばった"), 6.5, 0.56 * IsoVenue.T, INK); },
    photospot(ctx, sc, f, off) { this.faceText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.58, 190, "ぽかぽか コレクション", 12, (f.w - 0.6) * IsoVenue.T, INK); },
    chandelier(ctx, sc, f, off) {
      const s = sc.s, cx = f.x + f.w / 2, cy = f.y + f.h / 2, z = f.z || 196, t = G.t;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const q = sc.toScreen(IsoVenue.p(cx, cy, z + 10), off), g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 70 * s); g.addColorStop(0, "rgba(255,240,190,0.35)"); g.addColorStop(1, "rgba(255,240,190,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 70 * s, 0, 7); ctx.fill();
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + Math.floor(t * 1.5 + i) * 0.7, k = (t * 1.5 + i * 0.37) % 1, p = sc.toScreen(IsoVenue.p(cx + Math.cos(a) * 0.55, cy + Math.sin(a) * 0.55, z + 6), off), r = Math.sin(k * Math.PI) * 4 * s * 2; if (r > 0.4) FashionHall.twinkle(ctx, p.x, p.y, r); }
      ctx.restore();
    },
    trophycase(ctx, sc, f, off) {
      const got = FashionHall.trophiesGot(); if (!got.length) return;
      const t = G.t; ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i * 0.29) % 1, p = sc.toScreen(IsoVenue.p(f.x + 0.4 + ((i * 0.83) % 2.2), f.y + 0.6, 60 + ((i * 53) % 120)), off), r = Math.sin(k * Math.PI) * 4.5 * sc.s * 2; if (r > 0.4) FashionHall.twinkle(ctx, p.x, p.y, r); }
      ctx.restore();
    },
  };
  Object.assign(art, {
    M: { ...MallArt.M, ...M }, L: { ...MallArt.L, ...L }, models: new Map(),
    // キーは 種類・大きさ・向き・ランク・トロフィーの もって いる ぶん（4つ → 16とおり）だけ
    // タップの あたり: しゃしんの かべは かべの 面（がくぶち の ところ）だけ
    hit(f) { if (f.kind === "gallery") return IsoVenue.hull({ x: GALLERY[0], y: 0, w: GALLERY[1] - GALLERY[0], h: 0.08, z: 92, height: 200 }); return MallArt.hit.call(this, f); },
    modelKey(f) { return "fhall:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant || "") + ":" + (f.dir || "") + ":" + (f.z || "") + (f.kind === "trophycase" ? ":" + FashionHall.trophiesGot().join(",") : ""); },
    // 面の 上に 字（+y の 面は 右下へ、+x の 面は 右上へ よむ）
    faceText(ctx, sc, off, face, x, y, z, text, size, width, col = INK) {
      const q = sc.toScreen(IsoVenue.p(x, y, z), off), s = sc.s, A = IsoVenue.A, B = IsoVenue.B;
      ctx.save(); ctx.translate(q.x, q.y); face === "x" ? ctx.transform(A * s, -B * s, 0, s, 0, 0) : ctx.transform(A * s, B * s, 0, s, 0, 0);
      ctx.font = `900 ${size}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineJoin = "round"; ctx.lineWidth = Math.max(2, size * 0.22); ctx.strokeStyle = col === INK ? "#FFFFFF" : INK; ctx.strokeText(text, 0, 0, width); ctx.fillStyle = col; ctx.fillText(text, 0, 0, width); ctx.restore();
    },
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = this.wallSvg(r, side); jobs.push(SvgCache.ensure("fhallwall:" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
    },
    // じぶんの しゃしん（かべの したの だん）を さきに よむ
    preload(r, sc) { return Promise.all([MallArt.preload.call(this, r, sc), ...FashionHall.myPhotos().map((ph) => FashionArt.preloadPhoto(ph, FRAME.w))]); },
    paint(g, r, sc) { this.paintFloor(g, r); this.paintWalls(g, r); },
    // ゆか: 大理石（金の ひしがた）・赤い じゅうたん（金の ふち）・木（ほんの コーナー）・入口の マット
    paintFloor(g, r) {
      const P = (x, y, z = 0) => IsoVenue.p(x, y, z), quad = (pts) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); };
      for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
        const ch = r.rows[y][x], h = U.hash(x, y, 9);
        quad([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)]);
        if (ch === "r") { g.fillStyle = (x + y) & 1 ? "#B42746" : "#AC2242"; g.fill(); g.strokeStyle = "rgba(120,20,45,.35)"; g.lineWidth = 0.8; g.stroke(); const c = P(x + 0.5, y + 0.5); g.fillStyle = "rgba(255,200,120,.22)"; g.beginPath(); g.ellipse(c.x, c.y, 7, 3.5, 0, 0, 7); g.fill(); }
        else if (ch === "w") { g.fillStyle = h < 0.5 ? "#DDBF95" : "#D5B588"; g.fill(); g.strokeStyle = "#B99567"; g.lineWidth = 0.8; for (let i = 1; i < 4; i++) { const a = P(x, y + i / 4), b = P(x + 1, y + i / 4); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } }
        else if (ch === "m") { g.fillStyle = "#7A2440"; g.fill(); }
        else {
          g.fillStyle = (x + y) & 1 ? "#F7F2EA" : "#FFFDF8"; g.fill(); g.strokeStyle = "#E3D6C2"; g.lineWidth = 1; g.stroke();
          // 大理石の すじ
          if (h > 0.55) { const a = P(x + 0.15 + h * 0.3, y + 0.2), b = P(x + 0.5, y + 0.55 + h * 0.2), c = P(x + 0.85, y + 0.75); g.strokeStyle = "rgba(190,175,150,.45)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(b.x, b.y, c.x, c.y); g.stroke(); }
        }
      }
      // 大理石の 金の ひしがた（マスの かど）
      for (let y = 0; y <= r.h; y += 2) for (let x = 0; x <= r.w; x += 2) {
        if (x > 0 && x < r.w && y > 0 && y < r.h && r.rows[Math.min(r.h - 1, y)][Math.min(r.w - 1, x)] !== ".") continue;
        quad([P(x, y - 0.18), P(x + 0.18, y), P(x, y + 0.18), P(x - 0.18, y)]); g.fillStyle = "#E2B34A"; g.fill(); g.strokeStyle = "#B88A2C"; g.lineWidth = 0.8; g.stroke();
      }
      // じゅうたんの 金の ふち
      for (const x of [12.12, 15.88]) { const a = P(x, 1), b = P(x, r.h); g.strokeStyle = "#F2C75B"; g.lineWidth = 3; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      // シャンデリアの したの あかりの わ（どこに さがって いるか わかる ように）
      for (const [x, y] of FashionHall.LIGHTS) { const c = P(x, y), rx = 2.4 * IsoVenue.T * Math.SQRT2 * IsoVenue.A, ry = 2.4 * IsoVenue.T * Math.SQRT2 * IsoVenue.B; g.save(); g.translate(c.x, c.y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, "rgba(255,236,170,0.42)"); gr.addColorStop(1, "rgba(255,236,170,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore(); }
      // ラウンジの まるい しきもの
      { const c = P(6, 12.5), T = IsoVenue.T; for (const [rr, col] of [[2.3, "#E9D9F2"], [2.05, "#D8C2EA"], [1.5, "#E9D9F2"]]) { g.beginPath(); g.ellipse(c.x, c.y, rr * T * Math.SQRT2 * IsoVenue.A, rr * T * Math.SQRT2 * IsoVenue.B, 0, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = "#B89BCF"; g.lineWidth = 1.4; g.stroke(); } }
      // 入口の マット（金の ふち・「ようこそ」）
      { const q = [P(12.1, 17.1), P(15.9, 17.1), P(15.9, 17.9), P(12.1, 17.9)]; quad(q); g.strokeStyle = "#F2C75B"; g.lineWidth = 2; g.stroke(); const c = P(14, 17.5); g.save(); g.transform(IsoVenue.A, IsoVenue.B, -IsoVenue.A, IsoVenue.B, c.x, c.y); g.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#F7DB86"; g.fillText("ようこそ", 0, 0); g.restore(); }
      g.strokeStyle = INK; g.lineWidth = 1.8; quad([P(0, 0), P(r.w, 0), P(r.w, r.h), P(0, r.h)]); g.stroke();
    },
    // かべ: クリームの かべがみ（もよう）・ビロードの こしいた（金の わく）・金の はしら と てんじょうの ふち・しゃしんの わく
    wallSvg(r, side) {
      const T = IsoVenue.T, L = (side === "north" ? r.w : r.h) * T, Hh = r.wallH || 300, V = (z) => Hh - z, id = "fhw" + side;
      let s = `<defs><pattern id="${id}d" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#FBF1E1"/><path d="M24,8 C30,16 30,22 24,28 C18,22 18,16 24,8 Z M24,28 L24,40 M16,34 Q24,30 32,34" fill="#F3E2C4" stroke="#EAD5AF" stroke-width="1"/><circle cx="0" cy="0" r="3" fill="#F0DDBA"/><circle cx="48" cy="0" r="3" fill="#F0DDBA"/><circle cx="0" cy="48" r="3" fill="#F0DDBA"/><circle cx="48" cy="48" r="3" fill="#F0DDBA"/></pattern>`;
      s += `<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8C2E4E"/><stop offset="1" stop-color="#6A1F3A"/></linearGradient><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE7A6"/><stop offset="0.5" stop-color="#E5B852"/><stop offset="1" stop-color="#C08E2E"/></linearGradient></defs>`;
      s += `<rect width="${L}" height="${Hh}" fill="url(#${id}d)"/>`;
      // こしいた（ビロードいろ・金の わく）
      s += `<rect y="${V(96)}" width="${L}" height="96" fill="url(#${id}w)"/>`;
      for (let u = 12; u + 60 < L; u += 72) s += `<rect x="${u}" y="${V(84)}" width="60" height="64" rx="3" fill="none" stroke="#E2B34A" stroke-width="2.2"/>`;
      s += `<rect y="${V(100)}" width="${L}" height="8" fill="url(#${id}g)" stroke="${INK}" stroke-width="1"/><rect y="${V(6)}" width="${L}" height="6" fill="#C08E2E"/>`;
      // てんじょうの ふち（金・はこの もよう）
      s += `<rect y="0" width="${L}" height="22" fill="url(#${id}g)" stroke="${INK}" stroke-width="1"/>`;
      for (let u = 6; u < L; u += 16) s += `<rect x="${u}" y="22" width="9" height="7" fill="#D9A945" stroke="#A97A22" stroke-width="0.8"/>`;
      // 金の はしら（かざりの すじ）。なにも ない ところ だけ
      const busy = side === "north" ? [[GALLERY[0] - 0.2, GALLERY[1] + 0.2], [GATE.x - 1, GATE.x + GATE.w + 1], [17.6, 22]] : [[0.8, 7.2], [7.8, 11.2], [12.8, 17.2]].map(([a, b]) => [r.h - b, r.h - a]);
      for (let u = T * 1.5; u < L - 20; u += T * 2.5) { const tile = u / T; if (busy.some(([a, b]) => tile > a && tile < b)) continue; s += `<rect x="${u - 9}" y="${V(272)}" width="18" height="170" rx="3" fill="#FFF7E8" stroke="#D9B66A" stroke-width="2"/><rect x="${u - 12}" y="${V(282)}" width="24" height="12" rx="2" fill="url(#${id}g)" stroke="${INK}" stroke-width="1"/><path d="M${u},${V(258)} V${V(116)}" stroke="#EBD3A0" stroke-width="2"/>` + `<circle cx="${u}" cy="${V(206)}" r="9" fill="#FFF6C8" stroke="#D9B66A" stroke-width="2"/><path d="M${u - 6},${V(214)} L${u + 6},${V(214)} L${u + 3},${V(196)} L${u - 3},${V(196)} Z" fill="#FFF0B8" stroke="#D9B66A" stroke-width="1.4"/>`; }
      if (side === "north") {
        // しゃしんの かべ: うえの だんは これまでの ショー（町の 人）、したの だんは じぶんたちの ショー（L で 描く）
        const xs = frameXs();
        xs.forEach((x, i) => {
          for (const [k, z1] of ROWS.entries()) {
            const y = V(z1 + FRAME.h);
            s += `<rect x="${x - FRAME.b}" y="${y - FRAME.b}" width="${FRAME.w + FRAME.b * 2}" height="${FRAME.h + FRAME.b * 2}" rx="3" fill="url(#${id}g)" stroke="${INK}" stroke-width="1.6"/><rect x="${x}" y="${y}" width="${FRAME.w}" height="${FRAME.h}" fill="${k ? "#3A2F55" : "#231C42"}" stroke="#8C6A2A" stroke-width="1"/>`;
            if (k === 0) s += img(FashionHall.pastSvg(PAST[i]), x, y, FRAME.w, FRAME.h, "", "none");
            else s += star(x + FRAME.w / 2, y + FRAME.h / 2, 9, "#5A4C80");
          }
        });
        // トロフィーの たなの うえの かざり
        const u0 = 18 * T, u1 = 21 * T;
        s += `<rect x="${u0 + 8}" y="${V(282)}" width="${u1 - u0 - 16}" height="56" rx="10" fill="url(#${id}w)" stroke="url(#${id}g)" stroke-width="4"/>` + star(u0 + 24, V(254), 9, "#F7DB86", `stroke="${INK}" stroke-width="1"`) + star(u1 - 24, V(254), 9, "#F7DB86", `stroke="${INK}" stroke-width="1"`);
      } else {
        // きがえ スペース・ほんの コーナーの かんばん（字は paintWalls）
        for (const [a, b] of [[1, 7], [13, 17]]) { const u0 = (r.h - b) * T, u1 = (r.h - a) * T; s += `<rect x="${u0 + 16}" y="${V(288)}" width="${u1 - u0 - 32}" height="40" rx="12" fill="url(#${id}w)" stroke="url(#${id}g)" stroke-width="4"/>`; }
      }
      return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${Hh}">${s}</svg>`, L, H: Hh };
    },
    paintWalls(g, r) {
      const A = IsoVenue.A, B = IsoVenue.B, Hh = r.wallH || 300, T = IsoVenue.T, V = (z) => Hh - z;
      for (const side of ["west", "north"]) {
        const w = r._walls && r._walls[side]; if (!w || !w.c) continue;
        g.save(); if (side === "north") g.transform(A, B, 0, 1, 0, -Hh); else g.transform(A, -B, 0, 1, -w.L * A, w.L * B - Hh);
        g.drawImage(w.c, 0, 0, w.L, w.H);
        if (side === "west") { g.fillStyle = "rgba(60,30,50,.08)"; g.fillRect(0, 0, w.L, w.H); }
        g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
        const label = (t, x, y, size, col = "#FFE9A8") => { g.font = `900 ${size}px 'M PLUS Rounded 1c', sans-serif`; g.lineWidth = 4; g.strokeStyle = INK; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y); };
        if (side === "north") {
          const xs = frameXs(), mid = (xs[0] + xs[xs.length - 1] + FRAME.w) / 2;
          label("これまでの ショー", mid, V(ROWS[0] + FRAME.h + 13), 12);
          label("わたしたちの ショー", mid, V(ROWS[1] - 9), 12);
          xs.forEach((x, i) => { g.font = "900 9px 'M PLUS Rounded 1c', sans-serif"; g.fillStyle = "#FFFFFF"; g.fillText(`だい${PAST[i].no}かい`, x + FRAME.w / 2, V(ROWS[0]) + 9); });
          label("ゆうしょうの トロフィー", 19.5 * T, V(254), 13);
        } else {
          label("きがえ スペース", (r.h - 4) * T, V(268), 17);
          label("ファッションの ほん", (r.h - 15) * T, V(268), 15);
        }
        g.lineWidth = 1.8; g.strokeStyle = INK; g.strokeRect(0, 0, w.L, w.H); g.restore();
      }
      const a = IsoVenue.p(0, 0, 0), b = IsoVenue.p(0, 0, Hh); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      // 天じょうの くらがり（ごうかな よるの ホール）
      const F = 150, steps = 12;
      for (const [x0, y0, x1, y1] of [[0, 0, r.w, 0], [0, 0, 0, r.h]]) for (let i = 0; i < steps; i++) {
        const t0 = i / steps, t1 = (i + 1) / steps, A0 = IsoVenue.p(x0, y0, Hh + F * t0), A1 = IsoVenue.p(x1, y1, Hh + F * t0), B1 = IsoVenue.p(x1, y1, Hh + F * t1), B0 = IsoVenue.p(x0, y0, Hh + F * t1);
        g.beginPath(); g.moveTo(A0.x, A0.y); g.lineTo(A1.x, A1.y); g.lineTo(B1.x, B1.y); g.lineTo(B0.x, B0.y); g.closePath(); g.fillStyle = `rgba(52,30,48,${(0.85 * (1 - t1)).toFixed(3)})`; g.fill();
      }
    },
    // じぶんたちの ショーの しゃしん（かべの したの だん。あたらしい 4まい）
    under(ctx, sc, r, floor, off) {
      const list = FashionHall.myPhotos(); if (!list.length) return;
      const Hh = r.wallH || 300, s = sc.s, o = sc.toScreen(IsoVenue.p(0, 0, Hh), off), xs = frameXs(), y = Hh - (ROWS[1] + FRAME.h);
      ctx.save(); ctx.translate(o.x, o.y); ctx.transform(IsoVenue.A * s, IsoVenue.B * s, 0, s, 0, 0);
      list.forEach((ph, i) => { if (xs[i] != null) FashionArt.drawPhoto(ctx, ph, xs[i], y, FRAME.w); });
      ctx.restore();
    },
    // 手前の ふち（金の ライン）
    over(ctx, sc, r, floor, off) {
      const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), band = (a, b, c, d, fill) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * sc.s * 2; ctx.stroke(); };
      band(P(0, r.h, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(0, r.h, 16), "#6A1F3A");
      band(P(r.w, 0, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(r.w, 0, 16), "#561A31");
      band(P(0, r.h - 0.12, 16), P(r.w - 0.12, r.h - 0.12, 16), P(r.w, r.h, 16), P(0, r.h, 16), "#E2B34A");
      band(P(r.w - 0.12, 0, 16), P(r.w, 0, 16), P(r.w, r.h, 16), P(r.w - 0.12, r.h - 0.12, 16), "#E2B34A");
    },
    backdrop() { return ["#2A1830", "#4A2A44"]; },
    extras(sc, r) { return this.crowdDrawables(sc); },
    async interact(sc, f) {
      if (f.action === "leave") { sc.leave(); return true; }
      const fn = FashionHall.ACT[f.action]; if (!fn) return false;
      sc.busy = true; try { await fn.call(FashionHall, sc, f); } finally { sc.busy = false; } return true;
    },
  });
  // シャンデリアと トロフィーの きらきら（4つの とがり）
  const twinkle = (ctx, x, y, r) => { ctx.fillStyle = "#FFF7D0"; ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2); ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2); ctx.fill(); };

  // ---- しらべる ----
  const say = (name, text) => UI.say([{ name, text }]);
  const RECEPT = "うけつけの ミケ";
  const ACT = {
    // うけつけ: きょうの テーマ → さんかひ 500コイン（もう はらって いれば ランウェイへの あんない）
    async reception(sc) {
      const T = FashionShow.theme(), paid = FashionShow.hasEntry(), first = !FashionShow.st().shows;
      if (first && !this.metReception) { this.metReception = true; await UI.say([{ name: RECEPT, text: "ようこそ、ぽかぽか コレクションへ！\nここは ファッションショーの かいじょう です。" }, { name: RECEPT, text: "3にんで ランウェイを あるいて、さきで カメラに むかって ポーズ！\nおしゃれと ポーズで てんすうが きまるよ。" }]); }
      const i = await UI.ask(`${RECEPT}「きょうの テーマは「${T.name}」。\n${T.hint} が おすすめ です。」` + (paid ? "\n（さんかの うけつけは すんで いるよ）" : ""), paid ? ["ランウェイへ いく", "きまりを きく", "やめておく"] : [`さんかする（${FashionShow.FEE}コイン）`, "きまりを きく", "やめておく"]);
      if (i === 1) { await this.rules(); return; }
      if (i !== 0) return;
      if (paid) { await this.toGate(sc); return; }
      const r = FashionShow.pay();
      if (!r.ok) { Sound.se("bad"); await say(RECEPT, `コインが ${r.short} たりないよ。\nおてつだいで コインを ためて また きてね。`); return; }
      Sound.se("coin"); UI.updateHud();
      await say(RECEPT, "さんか うけつけ しました！\nきがえ スペースで ふくを えらんで、おくの ランウェイの いりぐちへ どうぞ。");
    },
    async rules() {
      await UI.say([
        { name: RECEPT, text: "てんすうは 1にん 100てん。\nおしゃれ 60てん ＋ ポーズ 30てん ＋ ぜんぶ ぴったりで 10てん。" },
        { name: RECEPT, text: "おしゃれは ふくの かず・ねだん・テーマに あう ふく・いろの そろえかた で きまるよ。\nあたまから せなかまで 5かしょ ぜんぶ きると いいよ。" },
        { name: RECEPT, text: "ポーズは ランウェイの さきで 3かい。\nカメラの わが ちぢんで、ボタンの わに かさなった ときに「ポーズ！」。\nはやすぎても おそすぎても ミス だよ。" },
        { name: RECEPT, text: "3にんの へいきんで ランクが きまって コインが もらえるよ。\nグランプリ 2000・ゴールド 1200・シルバー 800・ブロンズ 500・がんばったで しょう 200。" },
        { name: RECEPT, text: "はじめての ランクには トロフィーと ふくの けいひん！\nきねん しゃしんは すまほの「しゃしん」に はいるよ。" },
      ]);
    },
    async toGate(sc) { sc.walkTo(AT_GATE[0], AT_GATE[1], sc.fixtures.find((x) => x.kind === "gate")); },
    // ランウェイの いりぐち: うけつけが すんで いれば ショーへ
    async gate(sc) {
      if (!FashionShow.hasEntry()) { Sound.se("cancel"); await say("ランウェイの いりぐち", `うけつけで さんかひ ${FashionShow.FEE}コインを はらうと、ここから ショーに でられるよ。`); return; }
      const lv = Save.d.order.map((id) => `${Save.d.chars[id].name} ${"★".repeat(FashionShow.level(id, FashionShow.theme().id).stars)}`).join("　");
      const i = await UI.ask(`ショーに でる？\nテーマ「${FashionShow.theme().name}」\n${lv}`, ["でる！", "きがえる", "まだ"]);
      if (i === 1) { await this.dress(sc); return; }
      if (i !== 0) return;
      Sound.se("fanfare");
      Game.goto("fashion", { back: { venue: sc.id, floor: sc.floor, back: sc.back, at: AT_GATE } }, "circle");
    },
    // きがえ（おしゃれ レベルと テーマに あう ふくの ふだ）
    async dress() {
      const T = FashionShow.theme();
      const changed = await DressUp.open(null, {
        title: "きがえ スペース", note: `きょうの テーマは「${T.name}」。「テーマ」の ふだの ふくが テーマに あう ふく だよ。5かしょ ぜんぶ きると おしゃれ レベルが あがるよ。`,
        info: (id) => { const L = FashionShow.level(id, T.id); return `おしゃれ <b>${"★".repeat(L.stars)}${"☆".repeat(5 - L.stars)}</b><br>テーマ ${L.matched.length}こ・${L.worn.length}/5かしょ`; },
        mark: (it) => (FashionShow.tagsOf(it.id).includes(T.id) ? "テーマ" : ""),
      });
      if (changed) { Sound.se("sparkle"); UI.toast("きがえ できたよ！", "good"); Save.write(); }
    },
    // スタイリスト: 3人の おしゃれ レベルと ひとこと アドバイス
    async stylist() {
      const T = FashionShow.theme(), lines = [];
      for (const id of Save.d.order) {
        const c = Save.d.chars[id], L = FashionShow.level(id, T.id), slot = { head: "あたま", face: "かお", neck: "くび", body: "ふく", back: "せなか" }[L.empty[0]];
        const tip = !L.worn.length ? "まずは きがえ スペースで ふくを きて みて。" : L.empty.length ? `${slot}にも なにか つけると もっと よく なるよ。` : !L.matched.length ? `テーマ「${T.name}」に あう ふくを ためして みて。` : L.harmony < 10 ? "ふくの いろを 3つ そろえると もっと すてき！" : "かんぺきな コーデ！ あとは ポーズ だけ！";
        lines.push({ name: "スタイリストの メイ", text: `${c.name}は おしゃれ ${"★".repeat(L.stars)}${"☆".repeat(5 - L.stars)}。\n${tip}` });
      }
      await UI.say([{ name: "スタイリストの メイ", text: `きょうの テーマは「${T.name}」。\n${T.hint} が にあうわよ。` }, ...lines]);
    },
    // ファッションの ほん（こつ）
    async books() {
      const T = FashionShow.theme(), tips = [
        `「${T.name}」の ページ…… ${T.hint} が のって いる。`,
        "「いろの そろえかた」の ページ…… おなじ いろの なかまの ふくを 2つ・3つ そろえると、しんさいんの メリーさんが よろこぶ らしい。",
        "「ポーズの コツ」の ページ…… カメラの わは だんだん はやく なる。あせらず、わが かさなる しゅんかんを まとう。",
        "「ほんものの ファッションショー」の ページ…… モデルは ランウェイの さきで とまって ポーズを きめ、くるっと まわって もどって いく。",
      ];
      Sound.se("tap"); await say("ファッションの ほん", tips[Math.floor(Math.random() * tips.length)]);
    },
    // けいひんの マネキン
    async prize(sc, f) {
      const P = FashionShow.PRIZES[f.rank], R = FashionShow.RANK[f.rank], got = FashionShow.st().got[P.furn];
      await say(f.label, `${R.name}（${R.min}てん いじょう）に はじめて なると もらえる けいひん。\n「${ITEM_INDEX[P.wear].name}」と「${FURN_INDEX[P.furn].name}」。` + (got ? "\nもう もって いるよ！" : ""));
    },
    // しゃしんの かべ（じぶんの しゃしんを 大きく みる）
    async gallery() {
      const list = FashionShow.photos().reverse();
      if (!list.length) { await say("しゃしんの かべ", "これまでの ショーの しゃしんが かざって ある。\nしたの だんは まだ からっぽ。ショーに でると、きねん しゃしんが ここに かざられるよ。"); return; }
      const body = U.el("div", { class: "fs-album" }), w = 150, px = G.px || 2;
      for (const ph of list) {
        const cv = U.el("canvas", { class: "fs-album-photo" }); cv.width = Math.round(w * px); cv.height = Math.round(((w * FashionArt.PH) / FashionArt.PW) * px);
        body.append(cv); FashionArt.preloadPhoto(ph, w).then(() => { const g = cv.getContext("2d"); g.scale(px, px); FashionArt.drawPhoto(g, ph, 0, 0, w); });
      }
      Sound.se("ok");
      await new Promise((res) => UI.modal({ title: "わたしたちの ショー", body, cls: "fs-album-panel", onClose: res }));
    },
    // トロフィーの たな（きろく）
    async trophies() {
      const f = FashionShow.st(), rows = FashionShow.RANKS.map((R) => `${R.name} ${f.ranks[R.id] || 0}かい`).join("\n");
      await say("トロフィーの たな", `ショーに でた かず ${f.shows}かい・いちばん ${f.best}てん\n${rows}`);
    },
    // さつえいの かべ（3人で きめポーズ。しゃしんは ショーで もらえる）
    async photospot(sc) {
      Sound.se("fs_shutter"); sc.happyFace = true; setTimeout(() => (sc.happyFace = false), 2400);
      for (const id of Save.d.order) Save.care(id, { mood: 1 }); Save.write();
      await say("カメラマンの ハル", "はい、ポーズ！ パシャ！\nいい かお！ ほんばんの ランウェイでも その えがおで ね。\nきねん しゃしんは ショーの あとで わたすよ。");
    },
    async theme() { const T = FashionShow.theme(); await say("きょうの テーマ", `きょうの テーマは「${T.name}」。\n${T.hint} が テーマに あう ふく。\nテーマは まいにち かわるよ。`); },
  };

  // ---- これまでの ショー（かべの しゃしんの 絵。キーは 4まいの ばんごう だけ）----
  const pastCache = new Map();
  const pastSvg = (p) => {
    if (pastCache.has(p.no)) return pastCache.get(p.no);
    const PW = FashionArt.PW, PH = FashionArt.PH, cols = (NpcArt.SP[p.sp] || {}).cols || [], col = cols.length ? cols[p.ci % cols.length] : null;
    const npc = Art.npcSvg({ sp: p.sp, emo: "happy", dir: "down", pose: "idle_01", gesture: "none", outfit: p.outfit, ...(col ? { col: col[0], col2: col[1] } : {}) });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}">${img(FashionArt.bgSvg(p.th, p.rk), 0, 0, PW, PH, "", "none")}${img(npc, 50, 140, 200, 236)}</svg>`;
    pastCache.set(p.no, svg); return svg;
  };

  // ---- BGM（この ゲームの ために つくった 2きょく）----
  // ホール: しずかで ごうかな ラウンジの ジャズ（エレピの 和音・ベース・ブラシ）。ランウェイ: はずむ ダンス ビート（キラキラの リード）
  SONGS.fashion_hall = {
    title: "ぽかぽか ラウンジ", bpm: 92, key: "F", modern: true, groove: "classic", swing: 0.12,
    tracks: [
      { instrument: "epiano", vol: 0.075, gate: 0.9, pan: -0.15, notes: "F3+A3+C4+E4 . . . . . . . | D3+F3+A3+C4 . . . . . . . | G3+A#3+D4+F4 . . . . . . . | C3+E3+G3+A#3 . . . . . . . | F3+A3+C4+E4 . . . . . . . | A3+C4+E4+G4 . . . . . . . | A#3+D4+F4+A4 . . . C3+E3+G3+A#3 . . . | F3+A3+C4+E4 . . . . . . ." },
      { instrument: "mallet", vol: 0.12, gate: 0.82, pan: 0.18, notes: "C5 . A4 . C5 D5 E5 . | F5 . E5 D5 C5 . A4 . | A#4 . D5 . F5 . E5 D5 | C5 . . . G4 . A4 A#4 | C5 . A4 . C5 D5 E5 . | G5 . F5 E5 D5 . C5 . | D5 . F5 . E5 . G5 . | F5 . . . . . _ ." },
      { instrument: "bass", vol: 0.15, gate: 0.7, pan: 0, notes: "F2 . A2 . C3 . A2 . | D2 . F2 . A2 . F2 . | G2 . A#2 . D3 . A#2 . | C2 . E2 . G2 . E2 . | F2 . A2 . C3 . A2 . | A2 . C3 . E3 . C3 . | A#2 . D3 . C3 . E3 . | F2 . C3 . F2 . _ ." },
      { drum: true, vol: 0.03, notes: "k h h h s h h h" },
    ],
  };
  SONGS.fashion_show = {
    title: "ランウェイ ぽかぽか", bpm: 122, key: "Am", modern: true, groove: "classic", swing: 0,
    tracks: [
      { instrument: "lead", vol: 0.1, gate: 0.8, pan: 0.12, notes: "A4 . C5 E5 . D5 C5 . | B4 . G4 . B4 C5 D5 . | C5 . A4 . E5 . D5 C5 | B4 . . . E4 . G#4 B4 | A4 . C5 E5 . D5 C5 . | F5 . E5 D5 . C5 D5 . | E5 . D5 C5 . B4 C5 D5 | E5 . . . A5 . _ ." },
      { instrument: "pluck", vol: 0.07, gate: 0.5, pan: -0.2, notes: "_ A3+C4+E4 _ A3+C4+E4 _ A3+C4+E4 _ A3+C4+E4 | _ G3+B3+D4 _ G3+B3+D4 _ G3+B3+D4 _ G3+B3+D4 | _ F3+A3+C4 _ F3+A3+C4 _ F3+A3+C4 _ F3+A3+C4 | _ E3+G#3+B3 _ E3+G#3+B3 _ E3+G#3+B3 _ E3+G#3+B3 | _ A3+C4+E4 _ A3+C4+E4 _ A3+C4+E4 _ A3+C4+E4 | _ D4+F4+A4 _ D4+F4+A4 _ D4+F4+A4 _ D4+F4+A4 | _ C4+E4+G4 _ C4+E4+G4 _ E3+G#3+B3 _ E3+G#3+B3 | _ A3+C4+E4 _ A3+C4+E4 _ E3+G#3+B3 _ E3+G#3+B3" },
      { instrument: "bass", vol: 0.16, gate: 0.6, pan: 0, notes: "A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 E2 E3 E2 E3 | A2 A3 A2 A3 E2 E3 E2 E3" },
      { drum: true, vol: 0.06, notes: "k h s h k k s o" },
    ],
  };

  // ---- 館の とうろく ----
  const install = () => {
    VenueHalls.defs.fashion = { name: "ほんの ギャラリー", iso: true, art, guide: MallGuide, bgm: "fashion_hall", floors: { 1: room() } };
    Object.assign(MallArt.MAT, { fsMarble: { c: ["#FFFDF8", "#F7F2EA"], line: "#E3D6C2", pat: "tile" }, fsCarpet: { c: ["#B42746", "#AC2242"], line: "#7A1A33", pat: "carpet" }, fsMat: { c: ["#7A2440", "#6A1F3A"], line: "#561A31", pat: "mat" } });
    Object.assign(MallArt.SHOP, {
      fsGate: { name: "ランウェイ", c: ["#F6D9E3", "#EAA0B6", "#CF7F98"] }, fsDesk: { name: "うけつけ", c: ["#F3E4C4", "#E2C58A", "#C9A35A"] }, fsDress: { name: "きがえ", c: ["#EEDDF2", "#D6B8E3", "#B391C8"] },
      fsGallery: { name: "しゃしん", c: ["#FFF3D6", "#F6D78F", "#E0B85A"] }, fsPrize: { name: "けいひん", c: ["#FFE9B8", "#F7C948", "#D9A82E"] }, fsTrophy: { name: "トロフィー", c: ["#FFF0C4", "#F2C84B", "#D6A231"] },
      fsPhoto: { name: "さつえい", c: ["#F3EFFA", "#D9CFEE", "#B5A6DA"] }, fsLounge: { name: "ラウンジ", c: ["#F6DCE4", "#E8B4C4", "#CF8EA3"] }, fsBooks: { name: "ほん", c: ["#F1E2CC", "#DDBF95", "#B99567"] },
    });
    // うけつけの ねこは うしろの パネルの まえ（カウンターの おく）に たつ
  };
  return { W, H, ID, AT_GATE, AT_DOOR, PAST, LIGHTS: [[13.5, 5], [13.5, 12], [5.5, 12.5]], FRAME, ROWS, art, room, ACT, pastSvg, twinkle, install, metReception: false,
    // もって いる トロフィー（たなの 絵の キー）
    trophiesGot() { const d = typeof Save !== "undefined" && Save.d; if (!d || !d.furn) return []; return FashionShow.FURN.map((f) => f.id).filter((id) => (d.fashion && d.fashion.got && d.fashion.got[id]) || d.furn[id] > 0); },
    // かべに かざる じぶんたちの しゃしん（あたらしい 4まい）
    myPhotos() { return typeof Save !== "undefined" && Save.d ? FashionShow.photos().slice(-4).reverse() : []; },
  };
})();
FashionHall.install();
// すまほの「しゃしん」アプリ: ショーの きねん しゃしんが あれば「ぷりくら」「ファッションショー」の タブ（ぷりくらの がめんは そのまま）
(() => {
  if (typeof Purikura === "undefined") return;
  const pv0 = Purikura.phoneView;
  Purikura.phoneView = function (el, ph, openId = null) {
    if ((el.dataset && el.dataset.fsTab) || !FashionShow.photos().length) return pv0.call(this, el, ph, openId);
    el.replaceChildren();
    const tabs = U.el("div", { class: "fs-ph-tabs" }), box = U.el("div", { class: "fs-ph-box" }); box.dataset.fsTab = "1";
    const draw = () => {
      tabs.replaceChildren(...[["puri", "ぷりくら"], ["fs", "ファッションショー"]].map(([id, label]) => UI.btn(label, () => { FashionHall.photoTab = id; Sound.se("tap"); draw(); }, "small" + ((FashionHall.photoTab || "fs") === id ? " yellow" : ""))));
      if ((FashionHall.photoTab || "fs") === "fs") FashionHall.phoneShow(box, ph); else pv0.call(Purikura, box, ph, openId);
    };
    el.append(tabs, box); draw();
  };
  Object.assign(FashionHall, {
    photoTab: null,
    // ショーの しゃしん いちらん（あたらしい じゅん）→ タップで 大きく
    phoneShow(el, ph, at = -1) {
      el.replaceChildren();
      const list = FashionShow.photos().reverse(), px = G.px || 2, paint = (cv, p, w) => { const h = (w * FashionArt.PH) / FashionArt.PW; cv.width = Math.round(w * px); cv.height = Math.round(h * px); cv.style.width = w + "px"; cv.style.height = h + "px"; FashionArt.preloadPhoto(p, w).then(() => { const g = cv.getContext("2d"); if (!g) return; g.setTransform(px, 0, 0, px, 0, 0); FashionArt.drawPhoto(g, p, 0, 0, w); }); };
      if (at >= 0 && list[at]) {
        const p = list[at], room = el.clientHeight ? el.clientHeight - 120 : 400, w = Math.floor(Math.max(150, Math.min(280, (el.clientWidth || 300) - 24, room * 0.75)));
        const box = U.el("div", { class: "puri-viewer" }), cv = U.el("canvas", { class: "fs-ph-big", role: "img", "aria-label": "ファッションショーの しゃしん" }); paint(cv, p, w);
        const nav = U.el("div", { class: "puri-nav" }), prev = UI.btn("‹ まえ", () => { Sound.se("tap"); this.phoneShow(el, ph, at - 1); }, "small"), next = UI.btn("つぎ ›", () => { Sound.se("tap"); this.phoneShow(el, ph, at + 1); }, "small");
        prev.disabled = at <= 0; next.disabled = at >= list.length - 1;
        nav.append(prev, U.el("span", { class: "puri-pos", text: `${at + 1} / ${list.length}` }), next);
        const acts = U.el("div", { class: "puri-nav" }); acts.append(UI.btn("いちらん", () => { Sound.se("cancel"); this.phoneShow(el, ph); }, "small"), UI.btn("ほぞん", () => this.download(p), "small yellow"));
        box.append(cv, nav, acts); el.append(box); return;
      }
      el.append(U.el("p", { class: "note", text: `ファッションショーの きねん しゃしん ${list.length}まい（${FashionShow.MAX_PHOTOS}まい まで）。タップで おおきく みられるよ。` }));
      const grid = U.el("div", { class: "puri-album" });
      list.forEach((p, i) => { const b = U.el("button", { class: "puri-photo", "aria-label": "ファッションショーの しゃしん " + (i + 1) }), cv = U.el("canvas"); paint(cv, p, 90); b.append(cv); b.addEventListener("click", () => { Sound.se("tap"); this.phoneShow(el, ph, i); }); grid.append(b); });
      el.append(grid);
    },
    // たんまつに 画像で ほぞん（PNG・この 端末の 中だけ）
    async download(p) {
      const w = 300, k = 2, cv = document.createElement("canvas"), ctx = cv.getContext("2d"); if (!ctx) return;
      cv.width = w * k; cv.height = ((w * FashionArt.PH) / FashionArt.PW) * k;
      try { await FashionArt.preloadPhoto(p, w); } catch (e) {}
      ctx.setTransform(k, 0, 0, k, 0, 0); FashionArt.drawPhoto(ctx, p, 0, 0, w);
      const d = new Date(p.t || Date.now()), name = `pokapoka-fashion-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.png`;
      try { const a = U.el("a", { href: cv.toDataURL("image/png"), download: name }); document.body.append(a); a.click(); a.remove(); UI.toast("がぞうを ほぞん したよ"); } catch (e) { UI.toast("ほぞん できなかったよ"); }
    },
  });
})();
