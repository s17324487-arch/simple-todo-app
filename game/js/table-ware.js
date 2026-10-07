// しょっきを テーブルに ならべる（UI-103。オーナーの 依頼 2026-10-07「食器系のアイテムについて、テーブルに置けるようにせよ。
// 既存のテーブルでも良いが、新たに4,5種類がくわわると望ましい。」）。
// ・しょっき 30しゅ: かぐやさんの「しょっき」の あたらしい 8しゅ（ティーセット・ケーキ スタンド・フルーツ ボウル・レモネード ピッチャー・
//   ごはんと おみそしる・きゅうすと ゆのみ・パンケーキ・スープの おなべ）と、まえからの 22しゅ（いちばんくじの しましま マグ 3・
//   ゴールド ティーカップ 3・コンビニ コラボの グラス 4・タンブラー 4・プレート 4・しましまざら 4）。
//   かべの おさら（プレート・しましまざら）は テーブルでは ちいさな おさらたてに たてる（その id の 立体。かべの 絵は かわらない）。
// ・テーブル 9しゅ: まえからの 4しゅ（きのテーブル・こたつ・おちゃの ワゴン・だいりせきの テーブル）と、かぐやさんの「かぐ」の あたらしい 5しゅ
//   （ダイニング テーブル・カフェ テーブル・ちゃぶだい・ガラスの ローテーブル・ハートの テーブル）。ならべる ばしょは 3〜6。
// ・ならべかた: へやで テーブルを タップ（タップで うごく こたつ・だいりせきの テーブルは その まま）か、もようがえで テーブルを えらんで「しょっき」。
//   ならべると テーブルの うえの かざり（ポット・かびん・みかんの かご など）は かたづけて、しょっきだけ に する（その ときだけ live の 絵）。
// ・しくみは フィギュア だい（js/figure-stand.js の addHolder）と おなじ: テーブルの アイテムの figs・おいた かず（Room.placed）・いごこち・
//   プリセット・オンラインの おへや（g）。テーブルを しまうと しょっきは もちものに もどる。
// セーブ: テーブルの へやの アイテムに figs を たす だけ（Save.SCHEMA は 2 の まま）。
// figure-stand.js・ichiban-kuji.js・conbini-collab.js・kaden-live.js の あとに よむ（さわる うごきの ある テーブルを みてから つなぐ）。
const TableWare = (() => {
  const { rect, rr, ov, heart, scallop, close } = FurnModels.shapes, SPR = FurnModels.SPR;
  const SW = (w = 1.2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const WOOD = ["#D9B583", "#B8915F", "#EACDA2"], CREAM = ["#FFF8EC", "#E6D9C2", "#FFFDF7"];

  // ---- あたらしい しょっき（かぐやさんの「しょっき」）----
  // [id, なまえ, ねだん, はば, おくゆき, たかさ, いごこち, せつめい]
  const NEW_DISHES = [
    ["tw_teaset", "はなの ティーセット", 1280, 46, 30, 30, 3, "ばらの もようの ポットと カップ 2こ。"],
    ["tw_cakestand", "ケーキ スタンド", 1180, 36, 36, 50, 3, "3だんの おさらに ちいさな ケーキ。"],
    ["tw_fruitbowl", "フルーツ ボウル", 880, 40, 40, 26, 2, "りんご・みかん・ぶどう・バナナ いっぱい。"],
    ["tw_pitcher", "レモネード ピッチャー", 780, 34, 28, 44, 2, "レモンが うかぶ ピッチャーと コップ。"],
    ["tw_ricebowl", "ごはんと おみそしる", 720, 44, 30, 22, 2, "ほかほか ごはんと おみそしると おはし。"],
    ["tw_yunomi", "きゅうすと ゆのみ", 820, 42, 30, 26, 2, "みどりの きゅうすと ゆのみ 2こ。"],
    ["tw_pancake", "パンケーキの おさら", 680, 36, 36, 22, 2, "ふわふわ 3まいに バターと いちご。"],
    ["tw_soup", "スープの おなべ", 960, 40, 32, 30, 3, "みずたまの おなべに あったかい スープ。"],
  ];
  // ---- あたらしい テーブル（かぐやさんの「かぐ」）----
  const NEW_TABLES = [
    ["tbl_dining", "ダイニング テーブル", 2980, 128, 76, 58, 7, "しろい クロスの おおきな テーブル。しょっきを 6こ ならべられる。"],
    ["tbl_cafe", "カフェ テーブル", 1680, 70, 70, 62, 4, "だいりせきの まるい いたと くろい あし。3こ ならべられる。"],
    ["tbl_chabudai", "ちゃぶだい", 1580, 92, 92, 32, 5, "ひくくて まるい きの テーブル。4こ ならべられる。"],
    ["tbl_glass", "ガラスの ローテーブル", 2380, 112, 60, 38, 6, "すきとおる いたの ひくい テーブル。4こ ならべられる。"],
    ["tbl_heart", "ハートの テーブル", 1980, 88, 80, 54, 5, "ピンクの ハートの いたの テーブル。3こ ならべられる。"],
  ];
  const NEW_IDS = NEW_DISHES.map(([id]) => id), NEW_SET = new Set(NEW_IDS);
  for (const [id, name, price, w, depth, h, comfort, desc] of NEW_DISHES) {
    const f = { id, name, price, kind: "floor", w, depth, h, comfort, cat: ["misc"], dish: true, desc };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = () => HomeDesign.model(id).full;
  }
  for (const [id, name, price, w, depth, h, comfort, desc] of NEW_TABLES) {
    const f = { id, name, price, kind: "floor", w, depth, h, comfort, cat: ["table"], desc };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = () => HomeDesign.model(id).full;
  }

  // ---- ならべられる しょっき（まえからの もの を たす）----
  const OLD = [
    ...(typeof IchibanKuji !== "undefined" ? IchibanKuji.ITEMS.filter((it) => it.kind === "mug" || it.kind === "teacup").map((it) => it.id) : []),
    ...(typeof ConbiniCollab !== "undefined" ? ConbiniCollab.ITEMS.filter((it) => it.cat === "cup" || it.cat === "plate").map((it) => it.id) : []),
  ].filter((id) => FURN_INDEX[id]);
  const DISHES = [...NEW_IDS, ...OLD], DISH_SET = new Set(DISHES);
  for (const id of DISHES) FURN_INDEX[id].dish = true;
  const isDish = (id) => DISH_SET.has(id);
  const PLATES = OLD.filter((id) => FURN_INDEX[id].kind === "wall");

  // ---- テーブルの ならべる ばしょ（[x, y] と うえの たかさ z。のせる 大きさ cap・capW）----
  const N4 = ["おくの ひだり", "おくの みぎ", "てまえの ひだり", "てまえの みぎ"], N3 = ["おくの ひだり", "おくの みぎ", "てまえ"];
  const N6 = ["おくの ひだり", "おくの まんなか", "おくの みぎ", "てまえの ひだり", "てまえの まんなか", "てまえの みぎ"];
  const SPOTS = {
    table_wood: { z: 53.2, cap: 24, capW: 26, xy: [[-22, -50], [22, -50], [-22, -18], [22, -18]], names: N4 },
    kotatsu: { z: 50.2, cap: 24, capW: 24, xy: [[-22, -36], [22, -36], [-22, -14], [22, -14]], names: N4 },
    teacart: { z: 53.2, cap: 22, capW: 22, xy: [[-25, -24], [0, -24], [25, -24]], names: ["ひだり", "まんなか", "みぎ"] },
    hq_marble_table: { z: 58.6, cap: 26, capW: 26, xy: [[-15, -55], [15, -55], [-15, -31], [15, -31]], names: N4 },
    tbl_dining: { z: 58.3, cap: 26, capW: 28, xy: [[-40, -58], [0, -58], [40, -58], [-40, -20], [0, -20], [40, -20]], names: N6 },
    tbl_cafe: { z: 62.2, cap: 24, capW: 24, xy: [[-13, -44], [13, -44], [0, -22]], names: N3 },
    tbl_chabudai: { z: 32.2, cap: 24, capW: 26, xy: [[-20, -62], [20, -62], [-20, -30], [20, -30]], names: N4 },
    tbl_glass: { z: 38.4, cap: 24, capW: 26, xy: [[-30, -42], [30, -42], [-30, -18], [30, -18]], names: N4 },
    tbl_heart: { z: 54.3, cap: 24, capW: 24, xy: [[-21, -44], [1, -66], [14, -30]], names: ["ひだりの まる", "みぎの まる", "てまえ"] },
  };
  const TABLES = Object.keys(SPOTS).filter((id) => FURN_INDEX[id]);
  const isTable = (id) => TABLES.includes(id);
  const WORDS = {
    title: "しょっきを ならべる", lead: "ならべる ばしょを タップしてね", fillLine: "おいしそうに ならんだ！", full: "もう ぜんぶ ならべて いるよ", noFill: "ならべられる しょっきが ないよ",
    have: (n) => `もって いる しょっき ${n}しゅ。テーブルを しまうと しょっきは もちものに もどるよ。`,
    none: "しょっきが まだ ないよ。かぐやさんの「しょっき」や いちばんくじ・コンビニの コラボで てに いれよう。",
    noPick: "ならべられる しょっきが ないよ。ほかの テーブルや へやに おいて いないか みてね。", put: ["おいたよ！", "おいしそう〜", "すてきな テーブル！"],
  };
  for (const id of TABLES) {
    const P = SPOTS[id];
    FigureStand.addHolder(id, { name: FURN_INDEX[id].name, slots: P.xy.map(([x, y]) => [x, y, P.z]), names: P.names, cap: P.cap, capW: P.capW, sorted: true, accept: isDish, pool: () => DISHES, words: WORDS });
    FURN_INDEX[id].dishTable = P.xy.length;
  }
  const hasDish = (it) => FigureStand.figsOf(it).some(Boolean);

  // ---- 立体（FurnModels）----
  const M = {};
  // 1. ダイニング テーブル: しろい クロス（まえと みぎに レースの すそ）・ピンクの ランナー・4ほんの あし・まんなかに はなびん（live で かたづける）
  M.tbl_dining = (k) => {
    const { box, cyl, shape, prism, TP, FR, SD, lineOn, at, shadow, byDepth, lathe } = k;
    let s = shadow(0.1, 6, 10);
    for (const [x, y] of byDepth([[-58, -70], [52, -70], [-58, -12], [52, -12]])) s += box(x, y, 6, 6, 0, 46, CREAM);
    s += prism(TP(58), rr(-64, -76, 128, 76, 5), [0, 0, -4], "#FFFFFF", "#EDE6DA");
    // クロスの すそ（まえ・みぎ）: なみなみの レース
    s += shape(FR(0.2), [[-64, 58], [64, 58], ...scallop(-64, 64, 46, 3.2)], "#FFFFFF", 1.2) + lineOn(FR(0.3), [[-62, 50], [62, 50]], "#F2B8C6", 1, 'stroke-dasharray="2.4 2"');
    s += shape(SD(64.2), [[-76, 58], [0, 58], ...scallop(-76, 0, 46, 3.2)], "#F6F1EA", 1.2) + lineOn(SD(64.3), [[-74, 50], [-2, 50]], "#F2B8C6", 1, 'stroke-dasharray="2.4 2"');
    // ランナー（よこに 1ぽん・みぎの すそまで）
    s += shape(TP(58.1), rect(-64, -46, 128, 16), "#F6C3CE", 1) + lineOn(TP(58.15), [[-64, -43], [64, -43]], "#E9A0B3", 0.9) + lineOn(TP(58.15), [[-64, -33], [64, -33]], "#E9A0B3", 0.9);
    s += shape(SD(64.35), rect(-46, 44, 16, 14), "#F2B4C3", 1);
    s += k.L(lathe(0, -38, [[3.6, 58.2], [5.6, 63], [4.2, 70], [2.8, 74], [3.8, 77]], "#BFDDF0", 1.2) + at(0, -38, 77, SPR.blooms(), 12, 16));
    return s;
  };
  // 2. カフェ テーブル: くろい いっぽんあし・まるい だい・だいりせきの いた・きんの ふち・ちいさな ばら（live で かたづける）
  M.tbl_cafe = (k) => {
    const { cyl, frustum, ball, shape, TP, lineOn, at, shadow, lathe } = k, cy = -35;
    let s = shadow(0.12, 14, 30);
    s += cyl(0, cy, 0, 17, 2.6, "#3E3A44", "#5A5562", 1.3) + frustum(0, cy, 2.6, 10, 8, 4, "#4A4652", "#5A5562", 1.2);
    s += cyl(0, cy, 8, 2.6, 46, "#3E3A44", "#5A5562", 1.1, 12) + ball(0, cy, 22, 3.6, "#4A4652", 1.1, 0.3) + ball(0, cy, 44, 3.2, "#4A4652", 1.1, 0.3);
    s += frustum(0, cy, 52, 4, 57, 12, "#3E3A44", "#5A5562", 1.2);
    s += cyl(0, cy, 57, 33, 5, "#E3DED6", "#FAF8F4", 1.4) + lineOn(TP(62.05), close(ov(0, cy, 30.5, 30.5, 40)), "#E9C873", 1.4);
    for (const pts of [[[-22, cy - 6], [-12, cy - 2], [-4, cy - 10], [8, cy - 6]], [[-4, cy + 18], [6, cy + 12], [18, cy + 16]], [[10, cy - 22], [16, cy - 14], [24, cy - 12]]]) s += lineOn(TP(62.08), pts, "#C4BFB8", 0.8);
    s += k.L(lathe(4, cy - 2, [[2.6, 62.1], [3.8, 66], [2.2, 71], [3, 73]], "#F7D9E1", 1.1) + at(4, cy - 2, 73, SPR.rose(), 6, 20));
    return s;
  };
  // 3. ちゃぶだい: ひくい まるい いた（もくめ）・みじかい あし 4ほん・おせんべいの かご（live で かたづける）
  M.tbl_chabudai = (k) => {
    const { box, cyl, shape, TP, lineOn, at, shadow, byDepth, ball } = k, cy = -46;
    let s = shadow(0.12, 10, 40);
    for (const [x, y] of byDepth([[-30, cy - 30], [24, cy - 30], [-30, cy + 24], [24, cy + 24]])) s += box(x, y, 6, 6, 0, 26, ["#A8754C", "#8A5E3B", "#BF8A5E"]);
    s += cyl(0, cy, 26, 44, 6, "#B07A52", "#D9A774", 1.4);
    for (const r of [34, 24, 13]) s += lineOn(TP(32.05), close(ov(0, cy, r, r * 0.92, 36)), "#C89260", 0.8, 'stroke-opacity=".75"');
    s += lineOn(TP(32.1), close(ov(0, cy, 41.5, 41.5, 44)), "#E8BF8C", 1.1);
    let top = cyl(6, cy - 4, 32.1, 9, 3.6, "#C9A064", "#E6C995", 1.1);
    for (const [x, y, z] of [[3, cy - 7, 36], [9, cy - 6, 36.2], [5, cy - 1, 36.4], [9, cy - 1, 37]]) top += cyl(x, y, z, 3.6, 1.1, "#B9773E", "#D99A55", 0.9, 14);
    s += k.L(top);
    return s;
  };
  // 4. ガラスの ローテーブル: したの いたに ほんと かご・きんいろの あし・すきとおる ガラスの いた・ちいさな うえき（live で かたづける）
  M.tbl_glass = (k) => {
    const { box, shape, TP, FR, SD, lineOn, at, shadow, cyl } = k, leg = (x, y) => box(x, y, 4, 4, 0, 34, ["#E3C06B", "#B9974A", "#F1D88E"]);
    let s = shadow(0.1, 6, 8) + leg(-54, -58) + leg(50, -58); // おくの あしは したの いたより さきに
    s += box(-52, -56, 104, 52, 8, 3, WOOD);
    s += box(-40, -44, 22, 16, 11, 2.6, ["#6D9BC3", "#557FA3", "#8DB5D6"]) + box(-39, -43, 20, 14, 13.6, 2.4, ["#E8C07A", "#C99F5C", "#F3D59C"]) + box(-40, -44, 21, 15, 16, 2.2, ["#E9A9A0", "#CC8A82", "#F2C1BA"]);
    s += cyl(26, -28, 11, 9, 9, "#D7B377", "#E7CB94", 1.1) + lineOn(TP(20.05), close(ov(26, -28, 6.5, 6.5, 20)), "#B9965F", 0.8);
    s += leg(-54, -6) + leg(50, -6);
    s += shape(TP(38), rect(-56, -60, 112, 60), "#DDF3FB", 1.4, 'fill-opacity=".5"') + shape(FR(0), rect(-56, 34, 112, 4), "#A9D7EA", 1.2, 'fill-opacity=".8"') + shape(SD(56), rect(-60, 34, 60, 4), "#BFE3F0", 1.2, 'fill-opacity=".8"');
    s += lineOn(TP(38.05), [[-48, -12], [-30, -50]], "#FFFFFF", 2, 'opacity=".7"') + lineOn(TP(38.05), [[-38, -10], [-26, -34]], "#FFFFFF", 1.3, 'opacity=".6"');
    s += k.L(cyl(0, -30, 38.1, 5.4, 6, "#E8A9A0", "#C9604F", 1.1) + at(0, -30, 44.1, SPR.rosette(), 7, 9));
    return s;
  };
  // 5. ハートの テーブル: しろい あし 3ぼん・ピンクの ハートの いた・レースの ふち・ハートの かびん（live で かたづける）。
  //    ハートは 45ど まわして、画面で まっすぐ（まるい ところが おく・さきが てまえ の かど）に 見える ように する
  const HC = [4.8, -42], R2 = Math.SQRT1_2, heartOn = (sz) => heart(0, 0, sz, 40).map(([hx, hy]) => [HC[0] + (hx - hy) * R2, HC[1] - (hx + hy) * R2]);
  const HEART = heartOn(36);
  M.tbl_heart = (k) => {
    const { shape, TP, lineOn, at, byDepth, rod, lathe } = k;
    let s = shape(TP(0), heartOn(29), INK, 0, 'fill-opacity=".12"');
    for (const [x, y] of byDepth([[-14, -46], [2, -62], [13, -32]])) s += rod([[x, y, 0], [x + (x < 0 ? -3 : 3), y, 26], [x, y, 49]], "#FFFFFF", 3.2);
    // いたの あつみ: したの ハート（こい ピンク）の うえに うえの ハート（へこみが ある ので hull に しない）
    s += shape(TP(49.5), HEART, "#E58FA8", 1.4) + shape(TP(54), HEART, "#F7B6C8", 1.4);
    s += lineOn(TP(54.05), close(heartOn(31.5)), "#FFFFFF", 1.3, 'stroke-dasharray="2.6 2"');
    s += k.L(lathe(-3, -50, [[3, 54.1], [5, 58], [3.4, 64], [2.6, 66], [3.4, 68]], "#FFFFFF", 1.1) + at(-3, -50, 68, SPR.sprig("#F2A7B8"), 7, 16));
    return s;
  };

  // ---- しょっきの 立体（ちいさい。テーブルの うえでは 0.5 ばい くらい）----
  // 1. はなの ティーセット: まるい トレー・ばらの ポット・カップと ソーサー 2こ
  M.tw_teaset = (k) => {
    const { prism, shape, TP, lineOn, cyl, at, shadow } = k, cy = -15;
    let s = shadow(0.1, 3, 10);
    s += prism(TP(2), ov(0, cy, 22, 14, 32), [0, 0, -2], "#F7EFE6", "#D9C9B6", 1.1) + lineOn(TP(2.05), close(ov(0, cy, 19, 11.6, 32)), "#E8B4BF", 1, 'stroke-dasharray="2 1.6"');
    s += at(-8, cy - 1, 2.1, SPR.teapot("#FFFFFF", "#F2A7B8"), 17, 18);
    for (const [x, y] of [[12, cy - 6], [13, cy + 6]]) s += shape(TP(2.2), ov(x, y, 5.6, 4.4, 20), "#FFFFFF", 1) + cyl(x, y, 2.4, 3.4, 4.4, "#FFFFFF", "#C98A62", 1) + lineOn(TP(6.8), close(ov(x, y, 3.4, 3.4, 16)), "#F2A7B8", 0.9);
    return s;
  };
  // 2. ケーキ スタンド: きんの じく・3だんの おさら（したから）・カップケーキ・マカロン・いちご
  M.tw_cakestand = (k) => {
    const { cyl, ball, at, shadow, lineOn, TP } = k, cy = -18;
    let s = shadow(0.1, 6, 16) + cyl(0, cy, 0, 6.4, 2, "#C9A24E", "#E9C873", 1.1);
    const rodTo = (z0, z1) => cyl(0, cy, z0, 1.2, z1 - z0, "#C9A24E", "#E9C873", 0.9, 10);
    const tier = (z, r, cakes) => cyl(0, cy, z, r, 1.6, "#F2B8C6", "#FFFFFF", 1.1) + lineOn(TP(z + 1.65), close(ov(0, cy, r - 2.2, r - 2.2, 28)), "#F2B8C6", 0.9) + cakes(z + 1.7);
    s += rodTo(2, 4) + tier(4, 16, (z) => at(-7, cy + 3, z, SPR.cupcake(), 5, 12) + at(6, cy - 4, z, SPR.macaron("#A8D3C0"), 4, 6) + at(7, cy + 6, z, SPR.macaron("#F3D98A"), 4, 6) + ball(-3, cy - 7, z + 2.4, 2.4, "#E35D5B", 0.9, 0.4));
    s += rodTo(5.6, 20) + tier(20, 12, (z) => at(-4, cy - 2, z, SPR.macaron("#F2B8C6"), 4, 6) + at(5, cy + 3, z, SPR.cupcake(), 5, 12));
    s += rodTo(21.6, 35) + tier(35, 8, (z) => ball(-2, cy + 1, z + 2.2, 2.4, "#E35D5B", 0.9, 0.4) + at(3, cy - 1, z, SPR.macaron("#C9B6E0"), 4, 6));
    s += rodTo(36.6, 44) + ball(0, cy, 46, 2, "#E9C873", 1, 0.5);
    return s;
  };
  // 3. フルーツ ボウル: みずいろの うつわ・ぶどう・りんご・みかん・あおりんご・バナナ
  M.tw_fruitbowl = (k) => {
    const { lathe, cyl, ball, at, shadow, shape, TP } = k, cy = -20;
    let s = shadow(0.1, 8, 16) + cyl(0, cy, 0, 7, 3, "#7FA9C9", "#9CC7E6", 1.1);
    s += lathe(0, cy, [[8, 3], [13, 7], [16.5, 12], [18, 15]], "#9CC7E6", 1.2) + shape(TP(15), ov(0, cy, 18, 18, 36), "#CFE6F4", 1.1);
    for (const [x, y, z] of [[-9, cy - 8, 17.5], [-5, cy - 9, 18], [-7, cy - 5, 19], [-11, cy - 4, 18], [-8, cy - 7, 21.5]]) s += ball(x, y, z, 2.3, "#A77BD6", 0.9, 0.35);
    s += ball(5, cy - 5, 19.5, 5.8, "#E35D5B", 1.1, 0.45) + at(5.5, cy - 5, 26.6, `<path d="M0,0 Q0.6,-2.6 0.4,-4" fill="none" stroke="#7B5B3E" stroke-width="1"/><path d="M0.4,-3 Q3.6,-5 5,-2.6 Q2.4,-1.8 0.4,-3 Z" fill="#7FB06A" ${SW(0.8)}/>`, 5, 5);
    s += ball(-6, cy + 5, 19, 5.4, "#F29A3B", 1.1, 0.45) + ball(7, cy + 6, 18.5, 5, "#A9D06E", 1.1, 0.45);
    s += at(0, cy + 1, 23, `<path d="M-10,-3 Q0,7 10,-4 Q8,-1.6 0,1.6 Q-6,1.2 -10,-3 Z" fill="#F7D56A" ${SW(1)}/><path d="M-10,-3 L-11.4,-4.6 M10,-4 L11,-5.6" stroke="#7B5B3E" stroke-width="1.2" stroke-linecap="round"/>`, 12, 8);
    return s;
  };
  // 4. レモネード ピッチャー: うしろの とって・きいろい なかみ・すきとおる ピッチャー・レモンの わぎり・コップ
  M.tw_pitcher = (k) => {
    const { lathe, cyl, shape, TP, at, shadow, rod, lineOn } = k, px = -5, py = -14;
    let s = shadow(0.1, 4, 10);
    s += rod([[px - 9, py, 32], [px - 14.5, py, 28], [px - 14.5, py, 14], [px - 9, py, 10]], "#D7EEF5", 2.2);
    s += lathe(px, py, [[7.6, 1], [9.2, 12], [8.8, 24], [7.4, 29]], "#F7E27A", 0) + shape(TP(29), ov(px, py, 7.4, 7.4, 28), "#FBEFA8", 0.9);
    s += lathe(px, py, [[8.4, 0], [10, 12], [9.6, 26], [7.8, 36], [8.6, 41]], "#E6F5FB", 1.2, 'fill-opacity=".45"');
    s += at(px + 3, py + 9, 16, `<circle r="4.2" fill="#FFF3A8" ${SW(0.9)}/><path d="M0,-3.6 V3.6 M-3.1,-1.8 L3.1,1.8 M-3.1,1.8 L3.1,-1.8" stroke="#E8CC4A" stroke-width="0.8"/>`, 5, 5);
    s += lineOn(TP(41.05), close(ov(px, py, 8.6, 8.6, 24)), "#A9D7EA", 1);
    s += lathe(11, -11, [[4.4, 0], [5.4, 15]], "#E6F5FB", 1.1, 'fill-opacity=".5"') + lathe(11, -11, [[4.1, 0.6], [4.9, 10]], "#F7E27A", 0) + shape(TP(10), ov(11, -11, 4.9, 4.9, 20), "#FBEFA8", 0.8);
    return s;
  };
  // 5. ごはんと おみそしる: うるしの おぼん・おちゃわん（ごはん）・おわん（とうふと わかめ）・おはしと はしおき
  M.tw_ricebowl = (k) => {
    const { box, lathe, dome, shape, TP, rod, lineOn, shadow } = k;
    let s = shadow(0.1, 3, 6) + box(-21, -29, 42, 28, 0, 2, ["#9A4A3A", "#7C3A2E", "#B5584A"]);
    s += lathe(-9, -18, [[4, 2], [7.4, 6], [9, 10.5]], "#FFFFFF", 1.2) + lineOn(TP(7), close(ov(-9, -18, 7.9, 7.9, 24)), "#6E9CBF", 0.9, 'stroke-dasharray="2 1.6"');
    s += dome(-9, -18, 10.5, 8.4, 8.4, 5, "#FFFDF6", 1.1);
    s += lathe(10, -18, [[3.8, 2], [7.2, 6], [8.8, 10]], "#B33A3A", 1.2) + shape(TP(10), ov(10, -18, 7.6, 7.6, 26), "#C9935A", 1);
    s += shape(TP(10.1), rect(7, -21, 3.6, 3.6), "#FFFDF6", 0.7) + shape(TP(10.1), rect(12, -17, 3.4, 3.4), "#FFFDF6", 0.7) + lineOn(TP(10.1), [[4.6, -15], [7.6, -14], [9.6, -16]], "#4E7A45", 1.4);
    s += box(-15, -7.5, 4, 3, 2, 1.8, ["#E3C06B", "#B9974A", "#F1D88E"]);
    s += rod([[-15, -6.2, 4.2], [15, -8, 2.4]], "#C98A52", 1.1) + rod([[-15, -4.8, 4.2], [15, -6.4, 2.4]], "#C98A52", 1.1);
    return s;
  };
  // 6. きゅうすと ゆのみ: きの おぼん・みどりの きゅうす・ゆのみ 2こ（おちゃいろの なかみ）
  M.tw_yunomi = (k) => {
    const { box, cyl, shape, TP, at, lineOn, shadow } = k;
    let s = shadow(0.1, 3, 6) + box(-20, -29, 40, 28, 0, 2.4, WOOD) + lineOn(TP(2.45), close(rr(-17, -26, 34, 22, 3)), "#B8915F", 0.8);
    s += at(-8, -16, 2.5, SPR.kyusu(), 17, 14);
    for (const [x, y] of [[11, -22], [13, -9]]) s += cyl(x, y, 2.5, 3.6, 6.4, "#8FB3A4", "#7A9A55", 1.1) + lineOn(TP(8.95), close(ov(x, y, 3.6, 3.6, 16)), "#6F8F80", 0.8) + lineOn(k.FR(y + 3.62), [[x - 3.2, 5.4], [x + 3.2, 5.4]], "#6F8F80", 0.8);
    return s;
  };
  // 7. パンケーキの おさら: しろい おさら・3まいの パンケーキ・バター・シロップ・いちご
  M.tw_pancake = (k) => {
    const { cyl, box, shape, TP, lineOn, ball, at, shadow } = k, cy = -18;
    let s = shadow(0.1, 3, 16) + cyl(0, cy, 0, 16, 1.6, "#E3EEF2", "#FFFFFF", 1.1) + lineOn(TP(1.65), close(ov(0, cy, 12.6, 12.6, 28)), "#D5E2EA", 1);
    for (let i = 0; i < 3; i++) s += cyl(0, cy, 1.7 + i * 3.1, 11.6 - i * 0.3, 3.1, "#C9843E", "#E8B26E", 1.1);
    s += shape(TP(11.05), [[-6, cy - 3], [-2, cy - 6], [5, cy - 5], [8, cy - 1], [5, cy + 4], [-3, cy + 5], [-7, cy + 2]], "#B66A26", 0.8, 'fill-opacity=".85"');
    s += box(-3, cy - 3, 6, 6, 11.1, 2.2, ["#FFF0A8", "#F0D978", "#FFF7C9"]);
    s += ball(8, cy + 9, 3.4, 3, "#E35D5B", 1, 0.4) + at(8, cy + 9, 7, `<path d="M-2.6,0 Q0,-2.4 2.6,0 Q0,-1 -2.6,0 Z" fill="#7FB06A" ${SW(0.7)}/>`, 4, 3);
    return s;
  };
  // 8. スープの おなべ: あかい ホーローの おなべ・しろい みずたま・とって・ふた・ゆげ
  M.tw_soup = (k) => {
    const { cyl, box, dome, ball, at, shadow } = k, cx = 0, cy = -16;
    let s = shadow(0.12, 4, 14);
    s += box(-17, cy - 2, 4, 4, 11, 2.6, ["#E57373", "#C95A5A", "#F08A8A"]) + cyl(cx, cy, 0, 13, 15, "#E57373", "#F08A8A", 1.3);
    for (const [a, z] of [[0.5, 4.5], [1.2, 9], [1.9, 5], [2.6, 10]]) s += at(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, z, `<ellipse rx="1.8" ry="1.5" fill="#FFFFFF"/>`, 2, 2);
    s += box(13, cy - 2, 4, 4, 11, 2.6, ["#E57373", "#C95A5A", "#F08A8A"]);
    s += cyl(cx, cy, 15, 13.6, 1.2, "#D96262", "#F49A9A", 1.1) + dome(cx, cy, 16.2, 12.4, 12.4, 4.4, "#F08A8A", 1.2) + ball(cx, cy, 22, 1.9, "#FFFFFF", 1, 0.4);
    s += at(cx + 2, cy, 25, `<path d="M-3,0 c-3,-3 3,-5 0,-9 M3,1 c-3,-3 3,-5 0,-9" fill="none" stroke="#C9D3D8" stroke-width="1.6" stroke-linecap="round"/>`, 6, 11);
    return s;
  };
  // かべの おさら（プレート・しましまざら）: テーブルでは ちいさな おさらたてに たてる（かべに かける 絵は いままで どおり）
  const plateModel = (id) => (k) => {
    const { tilt, onP, rod, box, shadow, d } = k;
    const art = String(FURN_ART[id]()).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", '<svg x="0" y="0" width="40" height="42" preserveAspectRatio="xMidYMid meet" ');
    let s = shadow(0.1, 6, 8) + rod([[0, -d + 5, 0], [0, -d / 2 - 3, 30]], "#B07A52", 1.6);
    s += onP(tilt([-20, -d / 2 + 1, 3], [1, 0, 0], [0, -0.28, 1]), 0, 42, 40, 42, art);
    s += box(-18, -d / 2 + 1, 36, 4, 0, 4, ["#C9A26E", "#A88457", "#DDBD8A"]);
    return s;
  };
  for (const id of PLATES) M[id] = plateModel(id);
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- へやで: タップ・しょっきの 絵・かざりを かたづける ----
  const GUEST = ["おいしそうな テーブル！", "すてきな しょっき だね", "おちゃかい みたい〜"];
  const hook = (id) => {
    const prev = FurnLive.get(id), call = (fn, a) => (prev && typeof prev[fn] === "function" ? prev[fn].apply(prev, a) : undefined), h = {
      // タップ: その テーブルの まえからの うごき（こたつの あたたかさ など）が あれば その まま。なければ ならべる まど。よその おうちでは ことば だけ
      tap(sc, it, st) {
        if (prev && prev.tap) return call("tap", [sc, it, st]);
        if (sc.guest) { st.n = (st.n || 0) + 1; FigureStand.say(sc, it, hasDish(it) ? GUEST[st.n % GUEST.length] : "すっきりした テーブル だね", "heart"); return; }
        FigureStand.open(sc, it);
      },
      draw(ctx, sc, it, r, st) { call("draw", [ctx, sc, it, r, st]); FigureStand.drawFigs(ctx, sc, it, r); },
    };
    for (const fn of ["isOn", "light", "init"]) if (prev && typeof prev[fn] === "function") h[fn] = (...a) => prev[fn].apply(prev, a);
    FurnLive.register(id, h, FurnLive.LIVE.has(id));
  };
  for (const id of TABLES) hook(id);
  // しょっきを ならべた テーブルは うえの かざりを ぬいた 絵（live）。キーは id・はんてん・live だけ
  const opts0 = FurnLive.opts;
  FurnLive.opts = function (it, o) { const r = opts0.call(this, it, o); if (it && isTable(it.id) && hasDish(it)) o.live = true; return r; };
  // もようがえ: テーブルを えらぶと「しょっき」（タップで うごく テーブルも ここから ならべられる）
  const select0 = HouseScene.prototype.select;
  HouseScene.prototype.select = function (it) {
    const r = select0.call(this, it);
    if (it && this.tools && !this.guest && isTable(it.id)) { this.tools.append(UI.btn("しょっき", () => { if (UI.busy) return; Sound.se("tap"); FigureStand.open(this, it); }, "small yellow")); this.placeTools(); }
    return r;
  };

  // ---- かぐやさん: 「しょっき」の タブ（あたらしい 8しゅ。「かぐ」には ならべない）----
  const B = BUY_SHOPS.furniture, items0 = B.items;
  if (!B.tabs.some(([k]) => k === "dish")) B.tabs.splice(1, 0, ["dish", "しょっき"]);
  B.cls = ((B.cls || "") + " shop-tabs-wrap").trim(); // タブ 5こ: せまい がめんでは 2だんに おりかえす（css の .shop-tabs-wrap）
  B.items = (tab) => (tab === "dish" ? NEW_IDS.map((id) => FURN_INDEX[id]) : items0(tab).filter((f) => !(f && NEW_SET.has(f.id))));
  if (typeof ItemDexSources !== "undefined") {
    const src0 = ItemDexSources.source;
    ItemDexSources.source = function (kind, item) { return kind === "furn" && item && NEW_SET.has(item.id) ? `${B.name}の「しょっき」で かえるよ。` : src0.apply(this, arguments); };
  }

  return { NEW: NEW_IDS, NEW_TABLES: NEW_TABLES.map(([id]) => id), DISHES, PLATES, TABLES, SPOTS, WORDS, isDish, isTable, hasDish };
})();
