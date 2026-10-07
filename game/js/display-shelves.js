// かざりだな（UI-104。オーナーの 依頼 2026-10-07「また、飾り棚系の家具を増やしてほしい。」）。
// かぐやさんの「かぐ」に 6しゅ・「かべかざり」に 2しゅ。どれも フィギュアと しょっき（js/table-ware.js の 30しゅ）を かざれる（ミニ ステージは フィギュア だけ）。
//   しょっきだな（9・ガラスの とびら・よるは あかり）・レトロな サイドボード（9・ガラスの ひきどの なかと うえの いた）・はしごの たな（8）・
//   まるい ガラスの たな（6・よるは あかり）・ミニ ステージ（5・よるは スポットライト）・きの かたちの たな（7）・
//   かべの かざりだな（6・かべ）・ハニカムの かべだな（5・かべ）
// しくみは フィギュア だい（js/figure-stand.js の addStand）と おなじ: だいの figs・おいた かず・いごこち・プリセット・オンラインの おへや（g）。
// うえの いた・とびら・まえの はしらは フィギュアの あとに かさねる（layers・front: 立体を そうに わけた 絵）ので、たなの なかに はいって みえる。
// かべの たなは 2D の 絵に おくゆきを つけて 描く（かべから dd でる いたの まえの ふちは 絵の なかで（−dd, 2B·dd）ずれる。
// かべに はる ときの かたむきで ほんとうの おくゆきに みえる）。はんてんでは ならびだけ かえる（おくゆきの むきは かえない）。
// セーブ: だいの へやの アイテムに figs を たす だけ（Save.SCHEMA は 2 の まま）。table-ware.js の あとに よむ（しょっきを のせる）。
const DisplayShelves = (() => {
  const { rect, rr, ov, arc, arch, scallop } = FurnModels.shapes, B = HomeDesign.B, FS = FigureStand;
  const SW = (w = 1.2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const GOLD = "#E3C06B", GLASS = ["#D7EEF5", "#BFDDE7", "#E9F7FB"];
  const dish = (id) => typeof TableWare !== "undefined" && TableWare.isDish(id);
  const DISHES = () => (typeof TableWare !== "undefined" ? TableWare.DISHES : []);
  // そう: へや（live）では フィギュアの あとに かさねる ぶぶん（on("o1")・on("front") など）を ぬく。layer を えらんだ ときは その そう だけ。
  // 点は ぜんぶ かぞえる（文字列を つくってから えらぶ）ので、どの そうも 絵の はんいは おなじ
  const lay = (o = {}) => ({ base: (s) => (o.layer == null ? s : ""), on: (name) => (s) => (o.layer == null ? (o.live ? "" : s) : o.layer === name ? s : "") });
  const M = {};

  // ---- 1. しょっきだな: したは ひきだしと とびら・うえは ガラスの とびらの 3だん（なかの いたは まえの さんの うしろ）----
  const HONEY = ["#DDB07D", "#BB8C5B", "#EDCB9E"], HONEYD = ["#BF905F", "#9E7349", "#D5AA79"], HONEYT = ["#EBC899", "#C99F6E", "#F5DDB8"], HONEYL = "#E9C091";
  // おくの かべの こはなの もよう（w × h の 2D の 絵）
  const sprigs = (w, h) => {
    let s = "";
    for (let r = 0; r * 15 + 8 < h; r++) for (let c = 0; c * 15 + 8 < w; c++) {
      const x = 7 + c * 15 + (r % 2) * 7.5, y = 8 + r * 15; if (x > w - 4) continue;
      s += `<path d="M${x - 2.6},${y + 2.4} q2.4,-0.6 2.6,-3.2" fill="none" stroke="#A9CF93" stroke-width=".9"/><circle cx="${x}" cy="${y - 1}" r="1.5" fill="#F2B8C6"/>`;
    }
    return s;
  };
  // ガラスの まど 1まい（s0..s1 × t0..t1）と つや
  const pane = (k, y, s0, s1, t0, t1) => k.shape(k.FR(y), rect(s0, t0, s1 - s0, t1 - t0), GLASS[2], 0.8, 'fill-opacity=".16"') +
    k.lineOn(k.FR(y + 0.05), [[s0 + 8, t0 + 4], [s0 + 20, t1 - 4]], "#FFFFFF", 2, 'opacity=".55"') + k.lineOn(k.FR(y + 0.05), [[s0 + 16, t0 + 4], [s0 + 22, t0 + 15]], "#FFFFFF", 1.3, 'opacity=".45"');
  M.figstand_cupboard = (k) => {
    const { box, shape, FR, TP, lineOn, ball, onP } = k, { base, on } = lay(k.opts), front = on("front");
    let s = base(k.shadow(0.12, 3, 6));
    s += base(box(-52, -44, 104, 44, 0, 5, HONEYD) + box(-52, -44, 104, 44, 5, 43, HONEY));
    for (const x of [-48, 2]) {
      s += base(shape(FR(0.05), rr(x, 36, 46, 9, 2), HONEYL, 1.1) + ball(x + 23, 0.8, 40.5, 1.4, GOLD, 0.9, 0));
      s += base(shape(FR(0.05), rr(x, 8, 46, 25, 2.5), HONEYL, 1.1) + shape(FR(0.1), rr(x + 5, 12, 36, 17, 2), HONEY[0], 0.9) + ball(x < 0 ? -4.5 : 4.5, 0.8, 20.5, 1.4, GOLD, 0.9, 0));
    }
    s += base(box(-54, -46, 108, 47, 48, 4, HONEYT));
    // うえ: おくの かべ（こはな）・ひだりの かべ・なかの いた 2まい（おさらを たてる みぞ）
    s += base(shape(FR(-43.5), rect(-48, 52, 96, 114), "#F8F0E1", 1.2) + onP(FR(-43.4), -48, 166, 96, 114, sprigs(96, 114)));
    s += base(box(-52, -44, 4, 44, 52, 114, HONEY));
    for (const z of [89, 126]) s += base(box(-48, -43.5, 96, 42, z, 3, HONEYT, 1.2) + lineOn(TP(z + 3.05), [[-46, -37], [46, -37]], "#C99F6E", 1.1));
    // まえ（フィギュアの あと）: みぎの かべ・てんいた・かざり・ガラスの まど 3まい・わく・つまみ
    let f = box(48, -44, 4, 44, 52, 114, HONEY) + box(-52, -44, 104, 44, 166, 4, HONEYT) + box(-55, -47, 110, 48, 170, 5, HONEYD);
    f += shape(FR(0.6), arch(-24, 24, 175, 175, 184), HONEYD[0], 1.2) + onP(FR(0.7), -6, 182, 12, 7, `<path d="M6,6.5 C2,4 0.5,1.5 2.5,0.6 C4,0 5.4,1 6,2 C6.6,1 8,0 9.5,0.6 C11.5,1.5 10,4 6,6.5 Z" fill="${GOLD}" ${SW(0.8)}/>`);
    for (const [t0, t1] of [[55, 88], [92, 125], [129, 162]]) f += pane(k, -1, -47, 47, t0, t1);
    f += box(-52, -2, 5, 2, 52, 114, HONEY) + box(47, -2, 5, 2, 52, 114, HONEY);
    for (const [z, h] of [[52, 3], [88, 4], [125, 4], [162, 4]]) f += box(-47, -2, 94, 2, z, h, HONEY);
    f += ball(49.5, 0.6, 108, 1.5, GOLD, 0.9, 0);
    s += front(f);
    return s;
  };

  // ---- 2. レトロな サイドボード: ななめの あし・ガラスの ひきど（なかに 2だん）・きの とびら・うえの いたに レースの しきもの ----
  const WAL = ["#9C6F4D", "#7B553A", "#B5896A"], WALT = ["#A97B58", "#865E41", "#C49A78"], WALD = "#6E4B33";
  // まえ と みぎ だけの はこ（うえの めんは うえの いたの した で 見えない）
  const side2 = (k, x, y, w, d, z, h, c) => k.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], c[0], 1.5) + k.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], c[1], 1.5);
  // ガラスの ひきど 1まい（わく・ガラス・ゆびを かける まる）
  const slide = (k, y, s0, s1, pull) => {
    const { box, shape, FR, lineOn } = k;
    return shape(FR(y + 1.5), rect(s0 + 2, 18, s1 - s0 - 4, 63), GLASS[2], 0.8, 'fill-opacity=".18"') +
      lineOn(FR(y + 1.55), [[s0 + 7, 22], [s0 + 16, 76]], "#FFFFFF", 2, 'opacity=".55"') + lineOn(FR(y + 1.55), [[s0 + 13, 22], [s0 + 17, 34]], "#FFFFFF", 1.3, 'opacity=".45"') +
      box(s0, y, 2, 1.5, 16, 67, WALT, 1.1) + box(s1 - 2, y, 2, 1.5, 16, 67, WALT, 1.1) +
      shape(FR(y + 1.6), ov(pull, 50, 2.2, 2.2, 14), "#E7D3B6", 0.9);
  };
  M.figstand_sideboard = (k) => {
    const { box, shape, FR, TP, lineOn, onP, rod, byDepth } = k, { base, on } = lay(k.opts), o1 = on("o1"), o2 = on("o2");
    let s = base(k.shadow(0.12, 6, 6));
    for (const [x, y] of byDepth([[-68, -38], [64, -38], [-68, -6], [64, -6]])) {
      const tx = x < 0 ? -2.5 : 2.5, ty = y < -20 ? -1.5 : 1.5;
      s += base(rod([[x + 2, y + 2, 12], [x + 2 + tx, y + 2 + ty, 1.5]], WALD, 3) + k.ball(x + 2 + tx, y + 2 + ty, 1.2, 1.4, GOLD, 0.8, 0));
    }
    s += base(box(-75, -42, 150, 42, 12, 4, WAL));
    // ガラスの ほう（ひだり）: おくの かべ・ひだりの かべ・なかの いた
    s += base(shape(FR(-41.5), rect(-71, 16, 86, 70), "#F3E4CD", 1.2) + lineOn(FR(-41.4), [[-71, 84], [15, 84]], "#FFF6E0", 2, 'opacity=".7"'));
    s += base(box(-75, -42, 4, 42, 16, 70, WAL));
    s += o2(box(-71, -41.5, 86, 40, 49, 3, WALT, 1.2) + lineOn(TP(52.05), [[-69, -35], [13, -35]], WAL[1], 1));
    // まえ（なかの 2だんの フィギュアの あと・うえの いたの フィギュアの まえ）: しきり・みぎの かべ・きの とびら・ガラスの ひきど・うえの いた
    let f = side2(k, 15, -42, 4, 42, 16, 70, WAL) + side2(k, 71, -42, 4, 42, 16, 70, WAL);
    for (const [x0, x1, hx] of [[19, 45, 41], [45, 71, 49]]) {
      f += shape(FR(0), rect(x0, 16, x1 - x0, 70), WAL[0], 1.2) + shape(FR(0.05), rr(x0 + 3, 20, x1 - x0 - 6, 62, 2), WAL[2], 1);
      for (let i = 1; i < 4; i++) f += lineOn(FR(0.1), [[x0 + 3 + i * (x1 - x0 - 6) / 4, 24], [x0 + 3 + i * (x1 - x0 - 6) / 4 + (i % 2 ? 1 : -1), 78]], WAL[1], 0.8, 'opacity=".7"');
      f += shape(FR(0.2), rr(hx - 1.2, 42, 2.4, 16, 1.2), GOLD, 0.9);
    }
    f += box(-75, -3, 94, 3, 16, 3, WAL) + box(-75, -3, 94, 3, 83, 3, WAL);
    f += slide(k, -3, -71, -26, -31) + slide(k, -1.5, -30, 15, -25);
    f += box(-77, -43, 154, 44, 86, 6, WALT) + lineOn(FR(1.05), [[-77, 89], [77, 89]], WAL[1], 0.9, 'opacity=".6"');
    // レースの しきもの（まるい ふちの なみなみ・あなの もよう）
    const lace = [...scallop(-46, 46, -10, -3), ...scallop(46, -46, -32, 3)];
    f += shape(TP(92.05), lace, "#FFFFFF", 0.9) + onP(TP(92.1), -40, -12, 80, 18, Array.from({ length: 9 }, (_, i) => `<circle cx="${5 + i * 8.75}" cy="9" r="1.6" fill="none" stroke="#E9DCC8" stroke-width=".9"/>`).join(""));
    s += o1(f);
    return s;
  };

  // ---- 3. はしごの たな: かべに たてかける ななめの はしら 2本と、うえほど あさい いた 4まい ----
  const OAK = ["#E6CDA3", "#C8A97B", "#F2E1C1"], OAKD = ["#CBA978", "#AA8B5E", "#DEC394"], LEAN = 24 / 150, yf = (z) => -LEAN * z;
  const LADDER_Z = [10, 46, 82, 118];
  M.figstand_ladder = (k) => {
    const { box, poly, lineOn, TP } = k, { base, on } = lay(k.opts), front = on("front");
    // ななめの はしら（まえ・みぎ・うえの めん）
    const rail = (x0) => poly([[x0, 0, 0], [x0 + 4, 0, 0], [x0 + 4, yf(150), 150], [x0, yf(150), 150]], OAKD[0], 1.4) +
      poly([[x0 + 4, -4, 0], [x0 + 4, 0, 0], [x0 + 4, yf(150), 150], [x0 + 4, yf(150) - 4, 150]], OAKD[1], 1.4) +
      poly([[x0, yf(150) - 4, 150], [x0 + 4, yf(150) - 4, 150], [x0 + 4, yf(150), 150], [x0, yf(150), 150]], OAKD[2], 1.2);
    let s = base(k.shadow(0.1, 4, 6));
    s += base(rail(-36));
    s += base(k.rod([[-32, -2, 4], [32, -2, 4]], OAKD[0], 2.6));
    for (const z of LADDER_Z) s += base(box(-32, -40, 64, 40 + yf(z), z, 3, OAK, 1.3) + lineOn(TP(z + 3.05), [[-30, yf(z) - 2.5], [30, yf(z) - 2.5]], "#D9BC8E", 0.9));
    s += front(rail(32));
    return s;
  };

  // ---- 4. まるい ガラスの たな: きの だい・ガラスの つつ・まるい ガラスの いた 2まい・きんの はしら・まるい やね ----
  const CY = -36, CR = 33, CW = ["#B98E5F", "#D4AC7C"];
  const disc = (k, z) => k.lathe(0, CY, [[31, z], [31, z + 2.4]], GLASS[1], 1, 'fill-opacity=".6"') + k.shape(k.TP(z + 2.4), ov(0, CY, 31, 31, 40), GLASS[2], 1, 'fill-opacity=".5"') +
    k.lineOn(k.TP(z + 2.45), [[-18, CY + 20], [-6, CY + 27]], "#FFFFFF", 1.4, 'opacity=".7"');
  const post = (k, a) => { const x = Math.cos(a) * CR, y = CY + Math.sin(a) * CR; return k.rod([[x, y, 12], [x, y, 146]], GOLD, 1.6); };
  M.figstand_curio = (k) => {
    const { cyl, lathe, lineOn, TP, ball, dome, FR } = k, { base, on } = lay(k.opts), front = on("front");
    let s = base(k.shadow(0.12, 2, 36));
    s += base(cyl(0, CY, 0, 36, 12, CW[0], CW[1]) + lineOn(TP(6), arc(0, CY, 36.2, 36.2, -Math.PI / 4, (3 * Math.PI) / 4, 20), GOLD, 1.4));
    s += base(lathe(0, CY, [[CR, 12], [CR, 146]], GLASS[0], 1.1, 'fill-opacity=".3"'));
    s += base(post(k, Math.PI) + post(k, -Math.PI / 2));
    s += on("o2")(disc(k, 56)) + on("o1")(disc(k, 100));
    let f = post(k, 0) + post(k, Math.PI / 2) + post(k, Math.PI / 4);
    f += lineOn(FR(CY + 30), [[-14, 26], [-8, 132]], "#FFFFFF", 2.4, 'opacity=".5"') + lineOn(FR(CY + 30), [[-6, 30], [-3, 70]], "#FFFFFF", 1.4, 'opacity=".45"');
    f += cyl(0, CY, 146, 36, 5, CW[0], CW[1]) + dome(0, CY, 151, 30, 30, 9, CW[1], 1.3) + ball(0, CY, 163, 3, GOLD, 1, 0.5);
    s += front(f);
    return s;
  };

  // ---- 5. ミニ ステージ: きの ゆかと あかい まく・ほしぞらの かべ・カーテン・うえの まく・ほしの かんばん・あしもとの ライト ----
  const VELVET = "#D24B5A", VELVETD = "#A93746";
  const drape = (k, side) => {
    const { shape, lineOn, FR } = k, x0 = side < 0 ? -55 : 55, x1 = x0 - side * 18, y = -56.5;
    const edge = Array.from({ length: 9 }, (_, i) => { const t = i / 8, z = 104 - t * 88; return [x1 + side * (Math.sin(t * Math.PI * 3) * 2 - t * 6), z]; });
    let s = shape(FR(y), [[x0, 104], ...edge, [x0, 16]], VELVET, 1.4);
    for (let i = 1; i < 4; i++) s += lineOn(FR(y + 0.05), [[x0 - side * i * 4.5, 100], [x0 - side * (i * 4.5 + 2), 20]], VELVETD, 1, 'opacity=".8"');
    return s + lineOn(FR(y + 0.1), [[x0 - side * 3, 60], [x1 - side * 4, 58]], GOLD, 2.2);
  };
  M.figstand_stage = (k) => {
    const { box, shape, FR, TP, lineOn, onP, ball, at } = k, { base, on } = lay(k.opts), front = on("front");
    let s = base(k.shadow(0.14, 3, 8));
    s += base(box(-56, -60, 112, 60, 0, 16, [VELVET, VELVETD, "#E8C08A"]));
    for (const y of [-48, -36, -24, -12]) s += base(lineOn(TP(16.05), [[-56, y], [56, y]], "#C99A66", 1));
    s += base(shape(FR(0.05), [[-56, 16], [56, 16], ...scallop(-56, 56, 12.5, 2.4)], GOLD, 1));
    // ほしぞらの かべ
    const stars = [[10, 14], [30, 30], [52, 12], [76, 26], [96, 16], [20, 52], [64, 46], [88, 58], [40, 70], [104, 40]].map(([x, y], i) => `<path d="${starPath(x, y, i % 3 ? 2.4 : 3.6, i % 3 ? 1 : 1.5)}" fill="#F7E08A"/>`).join("");
    s += base(shape(FR(-59.5), rect(-54, 16, 108, 90), "#3E4475", 1.2) + onP(FR(-59.4), -54, 106, 108, 90, stars));
    s += base(drape(k, -1) + drape(k, 1));
    s += base(shape(FR(-55.5), [[-57, 116], [57, 116], ...scallop(-57, 57, 102, 5)], VELVET, 1.4) + lineOn(FR(-55.4), [[-57, 106], [57, 106]], GOLD, 1.8));
    s += base(onP(FR(-55.3), -13, 132, 26, 18, `<path d="${starPath(13, 9.5, 9.5, 4.2)}" fill="#F7D56A" ${SW(1.2)}/><circle cx="13" cy="10" r="2" fill="#FFF6D0"/>`));
    // スポットライト（うえの まくの した）
    for (const x of [-38, 38]) s += base(at(x, -54, 96, `<path d="M-4,-8 L4,-8 L5.5,0 L-5.5,0 Z" fill="#4B4F5A" ${SW(1)}/><ellipse cx="0" cy="0" rx="5.5" ry="1.6" fill="#FFF3B0" ${SW(0.8)}/>`, 7, 10));
    let f = "";
    for (const x of [-45, -27, -9, 9, 27, 45]) f += ball(x, -3, 17.6, 1.8, "#FFF3B0", 0.9, 0.6);
    s += front(f);
    return s;
  };

  // ---- 6. きの かたちの たな: くさの だい・みきと えだ（いたの 木を 2まい かさねて あつみ）・はっぱ・えだの さきの いた 7まい ----
  const BARK = "#BC8D61", BARKD = "#946A41", LEAF = ["#9ED08C", "#86BE74", "#B7DDA2"], PAINT = ["#FFF6E6", "#FCE3EA", "#E3F3E6", "#FFF3C8", "#E5E0F6", "#DDEFFA", "#FFE5D2"];
  // えだの さきの いた 6まい（ひだり・みぎ こうご）と くさの だいの うえ（いちばん した）
  const TREE_SH = [[-30, 144], [30, 122], [-30, 100], [30, 78], [-30, 56], [30, 34]];
  const limb = (x, z) => { const g = Math.sign(x), sx = g * 5; return [[sx, z - 26], [x - g * 6, z + 0.5], [x + g * 4, z + 0.5], [x + g * 4, z - 2], [sx, z - 13]]; };
  const TREE_PARTS = [[[-8, 6], [8, 6], [6, 154], [-6, 154]], ...TREE_SH.map(([x, z]) => limb(x, z))];
  const CROWN = [[0, 160, 16], [-18, 152, 12], [18, 154, 12], [-36, 142, 9], [38, 128, 9], [-38, 104, 7], [38, 86, 7]];
  M.figstand_tree = (k) => {
    const { box, shape, FR, lineOn, ball } = k, { base } = lay(k.opts);
    let s = base(k.shadow(0.12, 6, 6));
    s += base(box(-34, -26, 68, 26, 0, 6, ["#A8D08F", "#8BB874", "#C4E2B0"]));
    // あつみ（うしろの いた）→ まえの いた（ふちどり → ぬり で なかの せんを けす）
    for (const [y, c] of [[-24, BARKD], [-19, BARK]]) {
      s += base(TREE_PARTS.map((p) => shape(FR(y), p, INK, 2.8)).join("") + TREE_PARTS.map((p) => shape(FR(y), p, c, 0)).join(""));
    }
    s += base(lineOn(FR(-18.9), [[-2, 20], [-1, 60], [-3, 110]], BARKD, 1, 'opacity=".7"') + lineOn(FR(-18.9), [[2.5, 40], [3, 90]], BARKD, 1, 'opacity=".6"'));
    CROWN.forEach(([x, z, r], i) => { s += base(shape(FR(-18.5), ov(x, z, r, r * 0.9, 24), LEAF[i % 3], 1.3) + shape(FR(-18.4), ov(x - r * 0.3, z + r * 0.3, r * 0.35, r * 0.25, 14), "#FFFFFF", 0, 'fill-opacity=".35"')); });
    s += base(ball(-14, -17, 150, 2.6, "#E8665E", 1, 0.5) + ball(22, -17, 158, 2.4, "#E8665E", 1, 0.5));
    TREE_SH.forEach(([x, z], i) => { s += base(box(x - 13, -19, 26, 19, z, 3, PAINT[i], 1.2)); });
    return s;
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- かべの たな（2D の 絵。u: よこ・v: した。いたは かべから DD でる）----
  const off = (dd) => [-dd, 2 * B * dd];
  // いた 1まい（うしろの ふち u0..u1・たかさ v）: うえの めん・みぎの はしの めん・まえの めん
  const board = (u0, u1, v, dd, th, top, face) => {
    const [dx, dy] = off(dd);
    return `<path d="M${f2(u0)},${f2(v)} H${f2(u1)} L${f2(u1 + dx)},${f2(v + dy)} H${f2(u0 + dx)} Z" fill="${top}" ${SW(1.3)}/>` +
      `<path d="M${f2(u1)},${f2(v)} L${f2(u1)},${f2(v + th)} L${f2(u1 + dx)},${f2(v + dy + th)} L${f2(u1 + dx)},${f2(v + dy)} Z" fill="${shade(face, -0.16)}" ${SW(1.3)}/>` +
      `<rect x="${f2(u0 + dx)}" y="${f2(v + dy)}" width="${f2(u1 - u0)}" height="${th}" fill="${face}" ${SW(1.3)}/>`;
  };
  // ささえ（かべに そって した へ・おくゆきの むきに ななめ）
  const bracket = (u, v, dd, c) => { const [dx, dy] = off(dd * 0.8); return `<path d="M${f2(u)},${f2(v)} L${f2(u)},${f2(v + 15)} L${f2(u + dx)},${f2(v + dy)} Z" fill="${c}" ${SW(1.2)}/>`; };
  // かべの 絵を はんてん しても おくゆきの むきは かえない（Art.furnSvg が かえす ぶんを さきに かえして おく）
  const unflip = (w, art) => (o = {}) => (o.flip ? `<g transform="matrix(-1,0,0,1,${w},0)">${art(o)}</g>` : art(o));

  // ---- 7. かべの かざりだな: 2だんの いた・ささえ・おさらを たてる きんの てすり ----
  const WS = { w: 116, h: 100, dd: 15, th: 3.5, u0: 15, vs: [44, 82], us: [40, 68, 96] };
  const WS_TOP = "#EDD4AB", WS_FACE = "#D9B583", WS_BR = "#CFA672";
  const wallShelfArt = (o) => {
    const { base, on } = lay(o), rail = (v) => { const [rx, ry] = off(WS.dd * 0.82); return `<path d="M${f2(WS.u0 + rx + 2)},${f2(v + ry - 4.5)} H${f2(WS.w + rx - 2)}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M${f2(WS.u0 + rx + 2)},${f2(v + ry - 4.5)} H${f2(WS.w + rx - 2)}" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"/>` + [WS.u0 + rx + 2, WS.w + rx - 2].map((x) => `<path d="M${f2(x)},${f2(v + ry - 4.5)} V${f2(v + ry)}" ${SW(1.2)}/>`).join(""); };
    const level = (v) => bracket(30, v + WS.th, WS.dd, WS_BR) + bracket(104, v + WS.th, WS.dd, WS_BR) + board(WS.u0, WS.w, v, WS.dd, WS.th, WS_TOP, WS_FACE);
    return base(level(WS.vs[1])) + on("o1")(level(WS.vs[0])) + on("front")(rail(WS.vs[0]) + rail(WS.vs[1]));
  };
  const wallShelfAt = () => WS.vs.flatMap((v) => WS.us.map((u) => [u - WS.dd / 2, v + B * WS.dd]));

  // ---- 8. ハニカムの かべだな: はちの すの かたちの はこ 5こ（なかは パステル・まえの ふちは フィギュアの あと）----
  const HX = { w: 144, h: 106, R: 24, t: 3.6, dd: 12, cs: [[38, 26], [38, 72], [78, 49], [118, 26], [118, 72]] };
  const HX_BACK = ["#FCE3EA", "#E3F3E6", "#FFF3C8", "#E5E0F6", "#DDEFFA"], HX_WOOD = ["#F2E3C8", "#D9C29C", "#FBF1DE"];
  const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const P2 = (ps) => ps.map(([x, y]) => f2(x) + "," + f2(y)).join(" ");
  // とつの かたち どうしの かさなり（Sutherland–Hodgman）: なかの かべ・ゆか・おくの いたは まえの あなから 見える ところ だけ
  const clip = (subj, cl) => {
    const area = cl.reduce((a, p, i) => { const q = cl[(i + 1) % cl.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0), sg = Math.sign(area) || 1;
    let out = subj;
    for (let i = 0; i < cl.length && out.length; i++) {
      const a = cl[i], b = cl[(i + 1) % cl.length], side = (p) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
      const cut = (p, q) => { const sp = side(p), sq = side(q), t = sp / (sp - sq); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
      const inp = out; out = [];
      inp.forEach((q, j) => { const p = inp[(j + inp.length - 1) % inp.length], pin = side(p) >= 0, qin = side(q) >= 0; if (qin) { if (!pin) out.push(cut(p, q)); out.push(q); } else if (pin) out.push(cut(p, q)); });
    }
    return out;
  };
  // はんてんでは ならびを かがみに（u → w + dd − u: かべに つく ところの はんい dd..w の なかで）
  const hexCenters = (flip) => HX.cs.map(([u, v]) => [flip ? HX.w + HX.dd - u : u, v]).map((c, i) => [...c, i]).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const hexArt = (o) => {
    const { base, on } = lay(o), [dx, dy] = off(HX.dd), Rin = HX.R - (HX.t * 2) / Math.sqrt(3);
    let back = "", rims = "";
    for (const [cx, cy, i] of hexCenters(!!o.flip)) {
      const O0 = hexPts(cx, cy, HX.R), O1 = O0.map(([x, y]) => [x + dx, y + dy]), I0 = hexPts(cx, cy, Rin), I1 = I0.map(([x, y]) => [x + dx, y + dy]);
      // そとの めん（うえ・みぎうえ・みぎした が 見える）: へん j は ちょうてん j → j+1（0: みぎ、1: みぎした、2: ひだりした、3: ひだり、4: ひだりうえ、5: みぎうえ。y は した むき）
      const quadPts = (A0, A1, j) => [A0[j], A0[(j + 1) % 6], A1[(j + 1) % 6], A1[j]];
      const poly = (ps, c, w = 1.2) => (ps.length > 2 ? `<polygon points="${P2(ps)}" fill="${c}" ${SW(w)}/>` : "");
      back += poly(quadPts(O0, O1, 4), HX_WOOD[2]) + poly(quadPts(O0, O1, 5), HX_WOOD[1]) + poly(quadPts(O0, O1, 0), HX_WOOD[1]);
      back += poly(clip(I0, I1), HX_BACK[i], 1.1);
      // なかの めん（ひだりうえ・ひだりした・ゆか が 見える）
      back += poly(clip(quadPts(I0, I1, 3), I1), shade(HX_BACK[i], -0.08), 1.1) + poly(clip(quadPts(I0, I1, 2), I1), shade(HX_BACK[i], -0.12), 1.1) + poly(clip(quadPts(I0, I1, 1), I1), shade(HX_WOOD[0], 0.04), 1.1);
      rims += `<path d="M${P2(O1).replace(/ /g, " L")} Z M${P2(I1).replace(/ /g, " L")} Z" fill="${HX_WOOD[0]}" fill-rule="evenodd" ${SW(1.3)}/>`;
    }
    return base(back) + on("front")(rims);
  };
  // フィギュアの あしもと: ゆか（なかの したの へん）の おくゆきの まんなか
  const hexAt = (flip) => { const Rin = HX.R - (HX.t * 2) / Math.sqrt(3), h = (Math.sqrt(3) / 2) * Rin, out = []; for (const [cx, cy, i] of hexCenters(flip)) out[i] = [cx - HX.dd / 2, cy + h + B * HX.dd]; return out; };

  // ---- だいの しゅるい（ばしょは [x, y, z]・うえの だんから。かべの たなは [u, v, 0]）----
  const ROWS3 = ["うえの だん", "まんなかの だん", "したの だん"];
  const both = (id) => FS.isFigure(id) || dish(id);
  // えらべる もの（マグ・ティーカップ・コップは フィギュアでも しょっきでも ある ので 1かい だけ）
  const uniq = (a) => [...new Set(a)], dishFirst = () => uniq([...DISHES(), ...FS.figures()]), figFirst = () => uniq([...FS.figures(), ...DISHES()]);
  const WORDS = {
    title: "たなに かざる", fillLine: "すてきに ならんだ！", noFill: "かざれる ものが ないよ",
    have: (n) => `もって いる フィギュアと しょっき ${n}しゅ。たなを しまうと もちものに もどるよ。`,
    none: "フィギュアや しょっきが まだ ないよ。ガチャガチャや かぐやさんの「しょっき」で てに いれよう。",
    noPick: "かざれる ものが ないよ。ほかの たなや へやに おいて いないか みてね。", put: ["かざったよ！", "いい かんじ！", "にあう〜！"],
    seen: ["すてきな かざりだな！", "いっぱい かざってるね", "どれも かわいい〜"], empty: "まだ からっぽの たな だね",
  };
  const rowsOf = (n, per) => Array.from({ length: n / per }, (_, r) => Array.from({ length: per }, (_, c) => r * per + c));
  const bottomUp = (rows, overs) => rows.map((slots, r) => ({ slots, over: overs[r] || null })).reverse();
  const LADDER_ROWS = LADDER_Z.slice().reverse();
  const SHELVES = {
    figstand_cupboard: { name: "しょっきだな", price: 3480, w: 104, depth: 47, h: 186, comfort: 6, cap: 26, capW: 26, rows: ROWS3,
      desc: "ガラスの とびらの たな。しょっきや フィギュアを 9こ かざれる。よるは あかりが つくよ。",
      slots: [129.4, 92.4, 52.4].flatMap((z) => [-34, -4, 26].map((x) => [x, -6, z])), front: true, layers: bottomUp(rowsOf(9, 3), []), accept: both, pool: dishFirst },
    figstand_sideboard: { name: "レトロな サイドボード", price: 2680, w: 154, depth: 44, h: 92, comfort: 5, cap: 25, capW: 24, rows: ["うえの いた", "うえの だん", "したの だん"],
      desc: "ガラスの ひきどの なかと うえに しょっきや フィギュアを 9こ かざれる。",
      slots: [[-46, 0, 46].map((x) => [x, -22, 92.4]), ...[52.4, 16.4].map((z) => [-60, -36, -12].map((x) => [x, -6, z]))].flat(),
      layers: bottomUp(rowsOf(9, 3), [null, "o1", "o2"]), accept: both, pool: dishFirst },
    figstand_ladder: { name: "はしごの たな", price: 1580, w: 72, depth: 40, h: 150, comfort: 4, cap: 28, capW: 24,
      desc: "かべに たてかける はしごの たな。しょっきや フィギュアを 4だんに 8こ。",
      names: ["いちばん うえの ひだり", "いちばん うえの みぎ", "3だんめの ひだり", "3だんめの みぎ", "2だんめの ひだり", "2だんめの みぎ", "いちばん したの ひだり", "いちばん したの みぎ"],
      slots: LADDER_ROWS.flatMap((z) => [-15, 13].map((x) => [x, yf(z) - 9, z + 3.4])), front: true, layers: bottomUp(rowsOf(8, 2), []), accept: both, pool: figFirst },
    figstand_curio: { name: "まるい ガラスの たな", price: 2980, w: 72, depth: 72, h: 166, comfort: 5, cap: 34, capW: 24, rows: ROWS3,
      desc: "まるい ガラスの たな。6こ かざれて、よるは あかりが つくよ。",
      names: ["うえの だんの ひだり", "うえの だんの みぎ", "まんなかの だんの ひだり", "まんなかの だんの みぎ", "したの だんの ひだり", "したの だんの みぎ"],
      slots: [102.8, 58.8, 12.4].flatMap((z) => [-13, 13].map((x) => [x, -32, z])), front: true, layers: bottomUp(rowsOf(6, 2), [null, "o1", "o2"]), accept: both, pool: figFirst },
    figstand_stage: { name: "ミニ ステージ", price: 2280, w: 112, depth: 60, h: 132, comfort: 5, cap: 40, capW: 28, sorted: true,
      desc: "カーテンと ライトの ある ちいさな ぶたい。フィギュアを 5こ のせられる。",
      names: ["おくの ひだり", "おくの みぎ", "てまえの ひだり", "てまえの まんなか", "てまえの みぎ"],
      slots: [[-22, -42, 16.4], [22, -42, 16.4], [-36, -20, 16.4], [0, -20, 16.4], [36, -20, 16.4]], front: true, layers: [{ slots: [0, 1, 2, 3, 4], over: null }] },
    figstand_tree: { name: "きの かたちの たな", price: 2180, w: 96, depth: 26, h: 176, comfort: 4, cap: 27, capW: 24,
      desc: "えだの さきに ちいさな いたが ついた きの たな。7こ かざれる。",
      names: [1, 2, 3, 4, 5, 6].map((n) => `うえから ${n}ばんめ`).concat("くさの うえ"),
      slots: [...TREE_SH.map(([x, z]) => [x, -9.5, z + 3.4]), [0, -9.5, 6.4]], accept: both, pool: figFirst },
    figstand_wall: { name: "かべの かざりだな", price: 1280, w: WS.w, h: WS.h, comfort: 3, cap: 25, capW: 24, rows: ["うえの いた", "したの いた"],
      desc: "かべに つける 2だんの たな。しょっきや フィギュアを 6こ かざれる。",
      slots: wallShelfAt().map(([u, v]) => [u, v, 0]), front: true, layers: bottomUp(rowsOf(6, 3), [null, "o1"]), accept: both, pool: dishFirst,
      wall: { art: unflip(WS.w, wallShelfArt), at: () => wallShelfAt() } },
    figstand_hex: { name: "ハニカムの かべだな", price: 1880, w: HX.w, h: HX.h, comfort: 4, cap: 25, capW: 24,
      desc: "はちの すの かたちの かべの たな。5こ かざれる。",
      names: ["ひだりの うえ", "ひだりの した", "まんなか", "みぎの うえ", "みぎの した"],
      slots: hexAt(false).map(([u, v]) => [u, v, 0]), front: true, layers: [{ slots: [0, 1, 2, 3, 4], over: null }], accept: both, pool: figFirst,
      wall: { art: unflip(HX.w, hexArt), at: (flip) => hexAt(flip) } },
  };
  // しょっきも のせる たなは「たなに かざる」の ことば（ミニ ステージは フィギュア だいと おなじ ことば）
  for (const S of Object.values(SHELVES)) if (S.accept) S.words = WORDS;

  // ---- あかり（しょっきだな・まるい ガラスの たな・ミニ ステージ。よるは じぶんで つく）----
  const { mapper, glow, caseOn } = FS;
  const HOOK = {
    figstand_cupboard: { isOn: caseOn,
      under(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (const z of [148, 110, 72]) { const c = P(-4, -30, z); glow(ctx, c.x, c.y, 40 * P.s, "255,226,160", 0.18); } ctx.restore(); },
      light(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r), p = P(-4, -22, 110); glow(ctx, p.x, p.y, 110 * P.s, "255,214,140", 0.2); } },
    figstand_curio: { isOn: caseOn,
      under(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (const z of [128, 84, 40]) { const c = P(0, CY, z); glow(ctx, c.x, c.y, 34 * P.s, "255,232,180", 0.22); } ctx.restore(); },
      light(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r), p = P(0, CY, 90); glow(ctx, p.x, p.y, 100 * P.s, "255,220,150", 0.22); } },
    figstand_stage: { isOn: caseOn,
      // よるは ぶたいの ゆかに まるい ひかり（フィギュアの まえ）・スポットライトの ひかりの すじと あしもとの ライト
      under(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (const x of [-22, 22]) { const c = P(x, -30, 16.2); ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, 0.5); glow(ctx, 0, 0, 34 * P.s, "255,240,180", 0.35); ctx.restore(); } ctx.restore(); },
      light(ctx, sc, it, r, st) {
        if (!caseOn(st)) return;
        const P = mapper(sc, it, r), s = P.s;
        for (const x of [-38, 38]) {
          const a = P(x, -54, 92), b = P(x * 0.55 - 8, -30, 16), c = P(x * 0.55 + 8, -30, 16), g = ctx.createLinearGradient(a.x, a.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
          g.addColorStop(0, "rgba(255,240,180,0.32)"); g.addColorStop(1, "rgba(255,240,180,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a.x - 3 * s, a.y); ctx.lineTo(a.x + 3 * s, a.y); ctx.lineTo(c.x, c.y); ctx.lineTo(b.x, b.y); ctx.closePath(); ctx.fill();
        }
        for (const x of [-45, -27, -9, 9, 27, 45]) { const p = P(x, -3, 18); glow(ctx, p.x, p.y, 12 * s, "255,236,160", 0.4); }
      } },
  };
  for (const [id, S] of Object.entries(SHELVES)) FS.addStand(id, S, HOOK[id] || {});

  const IDS = Object.keys(SHELVES), WALL_IDS = IDS.filter((id) => SHELVES[id].wall);
  const isShelf = (id) => !!SHELVES[id];
  return { SHELVES, IDS, WALL_IDS, isShelf, WORDS, LEAN, yf, WS, HX, hexAt, wallShelfAt };
})();
