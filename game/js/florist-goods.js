// おはなやさんの しなもの（O11b・UI-77。オーナーの FB 2026-10-03「各お店の売っているものが種類が少なく見た目もチープなので、作り直してほしい」）。
// 3しゅ だけ だった おはなやさんに、へやに おける うえきの かぐ 8しゅ（ひまわり・チューリップの プランター・サボテン・ぼんさい・
// ばらの かびん・あじさい・モンステラ・ハーブの プランター）。どれも FurnModels の 立体（INK の 線・パステル・まるい つなぎめ）で、
// さわると 3人が ひとこと（はなびらが まう・おとが なる）。おはなやさん だけ（exclusive）。ねだんは SlowLifePrices と おなじ 4ばい。
// セーブは 家具の かず（Save.d.furn）が ふえる だけ（Save.SCHEMA は そのまま）。
const FloristGoods = (() => {
  const TAU = Math.PI * 2, f1 = (v) => Math.round(v * 10) / 10;
  const { rect, ov } = FurnModels.shapes;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // [id, なまえ, もとの ねだん, はば, おくゆき, たかさ, いごこち, せつめい]
  const ITEMS = [
    ["flo_sunflower", "ひまわりの はちうえ", 160, 44, 40, 108, 3, "おひさまに むかって さく おおきな ひまわり。"],
    ["flo_tulip", "チューリップの プランター", 200, 74, 30, 58, 3, "あか・きいろ・ピンクの チューリップが 5ほん。"],
    ["flo_cactus", "サボテンの はちうえ", 120, 34, 34, 70, 2, "とげとげの サボテンに ピンクの はな。"],
    ["flo_bonsai", "ぼんさい", 400, 58, 40, 62, 4, "ちいさな だいの うえの まつの ぼんさい。"],
    ["flo_rosevase", "ばらの かびん", 220, 34, 34, 78, 3, "ガラスの かびんに あかい ばらが 3りん。"],
    ["flo_hydrangea", "あじさいの はち", 260, 50, 50, 64, 3, "あお・むらさき・ピンクの あじさい。"],
    ["flo_monstera", "モンステラ", 360, 62, 58, 128, 4, "あなの あいた おおきな はっぱの かんようしょくぶつ。"],
    ["flo_herb", "ハーブの プランター", 180, 68, 28, 46, 2, "バジル・ミント・ローズマリー。いい におい。"],
  ];
  const IDS = ITEMS.map((r) => r[0]);
  for (const [id, name, base, w, depth, h, comfort, desc] of ITEMS) {
    if (FURN_INDEX[id]) continue;
    const f = { id, name, price: SlowLifePrices.price("furniture", base), kind: "floor", w, depth, h, comfort, desc, cat: ["plant"], exclusive: "florist", floristGoods: true };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = (opts = {}) => HomeDesign.model(id, opts).full;
  }

  // ---------- ぶひん ----------
  // はち（したが ほそい）・くちの ふち・つち
  const pot = (k, cx, cy, r0, r1, hh, col = "#D98B5F", rim = "#E9A57A", soil = "#6B4A35") => {
    const { frustum, cyl, shape, TP } = k;
    return frustum(cx, cy, 0, r0, hh - 4, r1, shade(col, -0.12), col, 1.4) + cyl(cx, cy, hh - 4, r1 + 1.8, 4, shade(rim, -0.1), rim, 1.4) + shape(TP(hh), ov(cx, cy, r1 - 0.4, r1 - 0.4, 24), soil, 1.1);
  };
  // はっぱ（画面の うえの 絵。した まんなかが 0,0）
  const leaf = (len, rot, c = "#7CC46E", c2 = "#5E9E50", wd = 0.42) => `<g transform="rotate(${rot})"><path d="M0,0 C${f1(-len * wd)},${f1(-len * 0.3)} ${f1(-len * wd * 0.6)},${f1(-len * 0.85)} 0,${-len} C${f1(len * wd * 0.6)},${f1(-len * 0.85)} ${f1(len * wd)},${f1(-len * 0.3)} 0,0 Z" fill="${c}" ${S(1.1)}/><path d="M0,-2 L0,${f1(-len * 0.86)}" stroke="${c2}" stroke-width="0.9" stroke-linecap="round"/></g>`;
  const hi = (x, y, rx, ry, rot = -30, a = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity="${a}"/>`;
  // ひまわりの かお
  const sunHead = (() => {
    let s = "";
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, x = f1(Math.cos(a) * 12.5), y = f1(-21 + Math.sin(a) * 12.5); s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.4" transform="rotate(${f1((a * 180) / Math.PI)} ${x} ${y})" fill="${i % 2 ? "#FFC93C" : "#FFD95A"}" ${S(1)}/>`; }
    s += `<circle cx="0" cy="-21" r="9.5" fill="#8A5A2B" ${S(1.2)}/>`;
    for (const [x, y] of [[-4, -24], [0, -26], [4, -24], [-5, -20], [0, -21], [5, -20], [-3, -16.5], [2.5, -16.5]]) s += `<circle cx="${x}" cy="${y}" r="1.1" fill="#5E3A1C"/>`;
    return s + hi(-3, -25, 2.6, 1.3, -30, 0.35);
  })();
  // チューリップの はな（あかい まるい つぼみ。さきが ギザギザ）
  const tulipHead = (c) => `<path d="M-6,-4 C-7,-11 -6,-16 -5,-18 L-2.5,-14 L0,-19 L2.5,-14 L5,-18 C6,-16 7,-11 6,-4 C4,-1 -4,-1 -6,-4 Z" fill="${c}" ${S(1.1)}/><path d="M-2.5,-14 C-2,-9 -1,-5 0,-3 M2.5,-14 C2,-9 1,-5 0,-3" fill="none" stroke="${shade(c, -0.18)}" stroke-width="0.9"/>${hi(-3, -11, 1.4, 3, 0, 0.45)}`;
  // ばらの はな
  const rose = (c) => `<circle cx="0" cy="-6" r="6.4" fill="${c}" ${S(1.1)}/><path d="M-3.5,-7 q3.5,-4 7,0 q-1,3.5 -3.5,3.4 q-2.6,-0.2 -3.5,-3.4 Z M-1.4,-7.2 q1.4,-1.8 2.8,0" fill="none" stroke="${shade(c, -0.25)}" stroke-width="1"/><path d="M-6,-3 Q-3,0 0,0.4 Q3,0 6,-3" fill="none" stroke="${shade(c, -0.2)}" stroke-width="0.9"/>`;
  // あじさいの こばな
  const hydra = (c) => `<g>${[0, 90, 180, 270].map((a) => `<ellipse cx="0" cy="-2.6" rx="1.9" ry="2.6" transform="rotate(${a})" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width="0.6"/>`).join("")}<circle r="0.9" fill="#FFFFFF"/></g>`;
  // モンステラの はっぱ（きれこみ・あな）
  const monLeaf = (len, rot, c = "#5DAF5A") => {
    const w = len * 0.62, d = shade(c, -0.28);
    return `<g transform="rotate(${rot})"><path d="M0,0 C${f1(-w)},${f1(-len * 0.12)} ${f1(-w * 1.05)},${f1(-len * 0.8)} 0,${-len} C${f1(w * 1.05)},${f1(-len * 0.8)} ${f1(w)},${f1(-len * 0.12)} 0,0 Z" fill="${c}" ${S(1.2)}/>`
      + [0.3, 0.5, 0.7].map((t, i) => { const y = f1(-len * t), e = f1(w * (0.92 - i * 0.14)); return `<path d="M${-e},${f1(-len * t + 3)} L${f1(-w * 0.3)},${y} M${e},${f1(-len * t + 3)} L${f1(w * 0.3)},${y}" stroke="${d}" stroke-width="1.5" stroke-linecap="round"/>`; }).join("")
      + `<ellipse cx="${f1(-w * 0.2)}" cy="${f1(-len * 0.4)}" rx="1.5" ry="2.4" fill="${d}"/><ellipse cx="${f1(w * 0.22)}" cy="${f1(-len * 0.6)}" rx="1.4" ry="2.2" fill="${d}"/>`
      + `<path d="M0,-2 L0,${f1(-len * 0.92)}" stroke="${d}" stroke-width="1.1" stroke-linecap="round"/>${hi(f1(-w * 0.45), f1(-len * 0.55), 2, 5, 20, 0.3)}</g>`;
  };

  // ---------- 立体 ----------
  const M = {};
  M.flo_sunflower = (k) => {
    // ひまわりの はちうえ: テラコッタの はち・くき・おおきな はっぱ 3まい・おひさまの かお
    const { rod, at, shadow } = k, cy = -20;
    let s = shadow(0.12, 8, 16) + pot(k, 0, cy, 11.5, 15, 28);
    s += rod([[0, cy, 28], [1.5, cy, 58], [-0.5, cy, 86]], "#6AB35F", 3.2);
    s += at(-1, cy + 1, 44, leaf(26, -58), 26, 24) + at(1, cy, 56, leaf(24, 62, "#8BCF7A"), 24, 22) + at(0, cy + 1, 72, leaf(18, -40), 16, 18);
    s += at(-0.5, cy + 1, 84, sunHead, 24, 40);
    return s;
  };
  M.flo_tulip = (k) => {
    // チューリップの プランター: しろい きの ながい はこ・つち・はっぱ・くき・はな 5ほん
    const { box, rod, at, shadow, shape, TP } = k, x0 = -36, y0 = -28;
    let s = shadow(0.12, 2, 8) + box(x0, y0, 72, 26, 0, 20, ["#F6EFE4", "#DCCFBE", "#FFFAF2"], 1.4);
    s += shape(TP(20), rect(x0 + 3, y0 + 3, 66, 20), "#6B4A35", 1.1);
    for (const x of [-26, -13, 0, 13, 26]) s += k.lineOn(k.FR(y0 + 26.1), [[x + 6, 4], [x + 6, 16]], "#E8DCCB", 1);
    const T = [[-26, "#E8505B", 48], [-13, "#FFD23F", 54], [0, "#F59AB8", 50], [13, "#E8505B", 56], [26, "#FFD23F", 49]];
    for (const [x, , z] of T) s += at(x - 2, y0 + 15, 20, leaf(18, -30), 12, 18) + at(x + 2, y0 + 15, 20, leaf(16, 32, "#8BCF7A"), 12, 16);
    for (const [x, c, z] of T) s += rod([[x, y0 + 13, 20], [x, y0 + 13, z]], "#6AB35F", 2) + at(x, y0 + 13, z, tulipHead(c), 8, 20);
    return s;
  };
  M.flo_cactus = (k) => {
    // サボテンの はちうえ: みずいろの はち・たてながの サボテンと うで（ひだりは おく・みぎは てまえ）・とげ・ピンクの はな
    const { egg, rod, at, shadow } = k, cy = -17;
    let s = shadow(0.12, 6, 14) + pot(k, 0, cy, 10, 12.5, 22, "#8FC3E6", "#FFFFFF", "#C9A877");
    s += rod([[-6, cy, 38], [-12, cy, 40]], "#7DBE6A", 4.4) + egg(-13, cy, 46, 4.4, 4.4, 8.5, "#7DBE6A", 1.3);
    s += egg(0, cy, 44, 9, 9, 22, "#86C871", 1.4);
    s += rod([[6, cy, 42], [12, cy, 44]], "#7DBE6A", 4.4) + egg(13, cy, 51, 4.2, 4.2, 9, "#8FD07A", 1.3);
    const spine = `<path d="M-1.4,0 L1.4,0 M0,-1.4 L0,1.4" stroke="#F6EFD8" stroke-width="0.9" stroke-linecap="round"/>`;
    for (const [x, z] of [[-4, 36], [3, 42], [-3, 52], [4, 56], [0, 30], [-1, 61], [5, 33]]) s += at(x, cy + 8, z, spine, 2, 2);
    for (const [x, z] of [[-13, 44], [-13, 50], [13, 48], [13, 55]]) s += at(x, cy + 3.5, z, spine, 2, 2);
    s += at(0, cy, 65, `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.4" rx="2.4" ry="3.6" transform="rotate(${a} 0 -4)" fill="#F59AB8" ${S(0.9)}/>`).join("")}<circle cx="0" cy="-4" r="1.6" fill="#FFE07A"/>`, 6, 9);
    return s;
  };
  M.flo_bonsai = (k) => {
    // ぼんさい: きの ひくい だい・あおい ながほそい はち・まがった みき・まつの はの かたまり
    const { box, rod, egg, at, shape, TP, shadow } = k, x0 = -27, y0 = -38;
    let s = shadow(0.12, 2, 6) + box(x0, y0, 54, 36, 0, 10, ["#9C6B45", "#7E5536", "#B88157"], 1.4);
    for (const [x, y] of [[x0 + 2, y0 + 2], [x0 + 48, y0 + 2], [x0 + 2, y0 + 30], [x0 + 48, y0 + 30]]) s += box(x, y, 4, 4, 10, 2, ["#7E5536", "#664328", "#946241"], 1);
    s += box(x0 + 7, y0 + 8, 40, 20, 12, 10, ["#6F8FB2", "#587796", "#89A8C8"], 1.3) + shape(TP(22), rect(x0 + 9, y0 + 10, 36, 16), "#8A7458", 1);
    s += rod([[0, y0 + 18, 22], [-6, y0 + 18, 30], [2, y0 + 18, 38], [10, y0 + 18, 44], [4, y0 + 18, 50]], "#8C5E3C", 4.2) + rod([[-4, y0 + 18, 31], [-13, y0 + 18, 38]], "#8C5E3C", 2.6);
    for (const [x, z, rx, rz, c] of [[-17, 40, 8, 4.6, "#4F8F46"], [14, 46, 10, 5, "#4F8F46"], [1, 57, 11, 5.6, "#5E9E50"]]) {
      s += egg(x, y0 + 18, z, rx, rx * 0.7, rz, c, 1.3);
      s += at(x - rx * 0.3, y0 + 18, z + rz * 0.5, `<path d="M-4,0 q2,-2 4,0 q2,-2 4,0" fill="none" stroke="#7CC46E" stroke-width="1.1" stroke-linecap="round"/>`, 5, 3);
    }
    return s;
  };
  M.flo_rosevase = (k) => {
    // ばらの かびん: ガラスの かびん（すけて みずが みえる）・くき・はっぱ・ばら 3りん
    const { lathe, rod, at, shadow, lg } = k, cy = -17;
    let s = shadow(0.1, 8, 14);
    s += lathe(0, cy, [[7, 0], [10, 8], [10.5, 20], [7, 32], [5.5, 38], [7, 42]], lg([[0, "#DDF1F7", 0.85], [1, "#B9DEEA", 0.85]], 0, 0, 1, 0), 1.4);
    s += lathe(0, cy, [[7.4, 1], [9.8, 8], [10.1, 18]], "#A6D3E3", 0, 'fill-opacity=".55"');
    for (const [dx, z] of [[-6, 62], [0, 70], [6, 60]]) s += rod([[dx * 0.2, cy, 38], [dx, cy, z]], "#6AB35F", 1.8);
    s += at(-3, cy, 50, leaf(12, -50), 10, 12) + at(3, cy, 52, leaf(12, 48, "#8BCF7A"), 10, 12) + at(0, cy, 58, leaf(10, -10), 8, 10);
    for (const [dx, z, c] of [[-6, 62, "#E8505B"], [6, 60, "#F07C8A"], [0, 70, "#D9404D"]]) s += at(dx, cy, z, rose(c), 8, 13);
    s += at(2, cy + 9, 24, hi(0, -6, 1.6, 6, 8, 0.6), 3, 10);
    return s;
  };
  M.flo_hydrangea = (k) => {
    // あじさいの はち: こげちゃの はち・おおきな はっぱ・まるい はなの かたまり 3つ（こばなが いっぱい）
    const { ball, at, shadow } = k, cy = -25;
    let s = shadow(0.12, 6, 20) + pot(k, 0, cy, 14, 17, 24, "#9C6B45", "#B88157");
    s += at(-9, cy + 4, 26, leaf(20, -70, "#6AB35F", "#4E8A44", 0.5), 20, 16) + at(9, cy + 4, 26, leaf(20, 68, "#6AB35F", "#4E8A44", 0.5), 20, 16) + at(0, cy + 8, 26, leaf(16, 8, "#7CC46E", "#4E8A44", 0.5), 10, 18);
    const B = [[-12, cy - 3, 45, 9, "#8FA8E8"], [12, cy - 5, 47, 9, "#B79BE0"], [0, cy + 8, 40, 9.5, "#F2A7C4"]];
    for (const [x, y, z, r, c] of B) {
      s += ball(x, y, z, r, c, 1.3, 0.25);
      for (const [dx, dz] of [[-5, 3], [0, 6], [5, 3], [-6, -2], [0, 0], [6, -2], [-3, -6], [3, -6]]) s += at(x + dx * 0.5, y + dx * 0.5 + 2, z + dz, hydra(shade(c, dz > 0 ? 0.12 : -0.04)), 4, 4);
    }
    return s;
  };
  M.flo_monstera = (k) => {
    // モンステラ: あんだ かごの はち・ながい くき・あなの あいた おおきな はっぱ
    const { rod, at, shadow } = k, cy = -29;
    let s = shadow(0.12, 6, 22) + pot(k, 0, cy, 15, 18, 30, "#F4F1EA", "#FFFFFF", "#6B4A35") + k.frustum(0, cy, 12, 16.2, 17, 16.9, "#9CC7A4", "#B8DCC0", 1.1);
    const ST = [[-16, 78, -42], [14, 86, 38], [-3, 108, -8], [6, 70, 20]];
    for (const [x, z] of ST) s += rod([[0, cy, 30], [x * 0.6, cy, z - 18], [x, cy, z - 4]], "#5E9E50", 2.2);
    for (const [x, z, rot] of ST) s += at(x, cy, z - 4, monLeaf(x === 6 ? 26 : 34, rot), 30, 36);
    return s;
  };
  M.flo_herb = (k) => {
    // ハーブの プランター: テラコッタの ながい はこ・バジル・ミント・ローズマリー・なまえの ふだ
    const { box, at, shadow, shape, TP, onP, FR } = k, x0 = -33, y0 = -26;
    let s = shadow(0.12, 2, 8) + box(x0, y0, 66, 24, 0, 18, ["#D98B5F", "#BE7449", "#E9A57A"], 1.4);
    s += shape(TP(18), rect(x0 + 3, y0 + 3, 60, 18), "#6B4A35", 1.1);
    // バジル（まるい はっぱ）・ミント（ぎざぎざ）・ローズマリー（ほそい はの えだ）
    const basil = [[-6, -8, -30], [6, -9, 30], [0, -14, 0], [-8, -16, -40], [8, -17, 40], [0, -22, 0]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="6" transform="rotate(${r} ${x} ${y})" fill="#6FBF5F" ${S(1)}/>`).join("");
    const mint = [[-6, -7, -35], [6, -8, 35], [-4, -14, -15], [5, -15, 20], [0, -20, 0]].map(([x, y, r]) => `<path d="M${x},${y + 5} q-4,-3 -3,-7 q2,-3 3,-4 q1,1 3,4 q1,4 -3,7 Z" transform="rotate(${r} ${x} ${y})" fill="#9ED98A" ${S(0.9)}/>`).join("");
    const rosemary = [-8, -3, 2, 7].map((x, i) => `<path d="M${x},0 Q${x + (i % 2 ? 2 : -2)},-12 ${x + (i % 2 ? 1 : -1)},-24" fill="none" stroke="#557A4A" stroke-width="1.3" stroke-linecap="round"/>` + [-6, -11, -16, -21].map((y) => `<path d="M${x},${y} l-3,-2 M${x},${y} l3,-2" stroke="#6E9A63" stroke-width="1.2" stroke-linecap="round"/>`).join("")).join("");
    s += at(-20, y0 + 12, 18, basil, 14, 26) + at(0, y0 + 12, 18, mint, 12, 22) + at(20, y0 + 12, 18, rosemary, 12, 26);
    s += onP(FR(y0 + 24.1), x0 + 6, 13, 56, 8, [0, 20, 40].map((x, i) => `<rect x="${x + 1}" y="0" width="14" height="7" rx="2" fill="#FFF8EC" stroke="#B88157" stroke-width="0.8"/><path d="M${x + 4},3.5 h8" stroke="${["#6FBF5F", "#9ED98A", "#557A4A"][i]}" stroke-width="1.6" stroke-linecap="round"/>`).join(""));
    return s;
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---------- さわる（FurnLive）----------
  const { simple } = ShopRewardArt.liveKit;
  simple("flo_sunflower", ["ひまわり、おひさま だいすき！", "せが たかーい！", "たね、できるかな？"], "petal", [0, -20, 100], [523, 659, 784]);
  simple("flo_tulip", ["チューリップ、5ほん さいてる！", "あか・きいろ・ピンク！", "いい におい〜"], "petal", [0, -14, 60], [587, 698, 880]);
  simple("flo_cactus", ["とげとげ、さわらないでね", "ピンクの はなが さいた！", "おみず ちょっぴりで いいんだって"], "spark", [0, -17, 72], [659, 784, 988]);
  simple("flo_bonsai", ["ちいさい けど りっぱな き", "ぼんさい、かっこいい…", "ちょきちょき するんだって"], "note", [0, -20, 62], [392, 523, 659]);
  simple("flo_rosevase", ["ばら、きれい〜", "あかい ばら、すてき！", "ガラスの かびん ぴかぴか"], "heart", [0, -17, 78], [659, 784, 1047]);
  simple("flo_hydrangea", ["あじさい、いろいろ！", "あめの ひに さく はな だよ", "こばなが いっぱい"], "petal", [0, -25, 64], [523, 622, 784]);
  simple("flo_monstera", ["はっぱに あなが あいてる！", "おおきい はっぱ〜", "ジャングル みたい！"], "note", [0, -29, 124], [392, 494, 587]);
  simple("flo_herb", ["ハーブの いい におい", "ミント、すーっと する", "バジルで ピザ つくりたい！"], "puff", [0, -13, 44], [523, 659, 784]);

  // ---------- おはなやさんの タブ ----------
  const TABS = [
    ["pot", "はちうえ", ["plant", "flo_sunflower", "flo_cactus", "flo_hydrangea", "flo_monstera", "flo_bonsai"]],
    ["deco", "はな・かざり", ["flo_tulip", "flo_rosevase", "flo_herb", "plantshelf", "garland"]],
  ];
  const shop = BUY_SHOPS.florist;
  if (shop) {
    shop.hello = ["いらっしゃいませ！ おへやに みどりは いかが？", "あたらしい はちうえが はいったよ。"];
    shop.tabs = TABS.map(([k, label]) => [k, label]);
    shop.items = (tab) => (TABS.find((t) => t[0] === tab) || TABS[0])[2].map((id) => FURN_INDEX[id]).filter(Boolean);
    shop.cls = ((shop.cls || "") + " shop-goods").trim();
  }
  return {
    ITEMS, IDS, TABS,
    ids: () => TABS.flatMap((t) => t[2]),
    // PokaDebug 用
    state() { return { tabs: TABS.map(([k, label, ids]) => ({ k, label, ids: [...ids] })), total: TABS.reduce((a, t) => a + t[2].length, 0) }; },
  };
})();
