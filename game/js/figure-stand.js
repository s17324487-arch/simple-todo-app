// フィギュア台（オーナーの FB 2026-10-01「家具として、各種フィギュアを置ける、フィギュア台を作りなさい」）。
// かぐやで かう 家具 2しゅ: ひなだんの フィギュア だい（3だん × 3）・ガラスの フィギュア ケース（3だん × 3・よるは あかり）。
// UI-93（オーナーの FB 2026-10-04「もっと棚の種類を増やせ」）で 5しゅ たした: キューブの たな（9）・おうちの たな（9）・アクリルの ひなだん（6）・
// まわる ターンテーブル（6・いつも ゆっくり まわる）・コレクション タワー（12・よるは あかり）。
// まえに いたが ある たな（キューブ・おうち）は フィギュアを まえの ほうに おいて、画面で うえの いたに かからない ように する（win）。
// タップすると「フィギュアを かざる」: ばしょを えらんで、もって いる フィギュア（ガチャガチャ・はしわたし・すいぞくかんの おみやげ・バーガーやさんの おまけ）を おく。
// おいた フィギュアは へやの 家具と おなじに かぞえる（Room.placed・いごこち）。だいを しまうと フィギュアは もちものに もどる。
// セーブ: だいの へやの アイテムに figs（ばしょの かず ぶんの フィギュアの id か null）を たす だけ（Save.SCHEMA は そのまま）。
// プリセット（RoomPresets）も figs を おぼえる（よびだす ときは ほかの へやで つかって いる かずも かぞえる）。
const FigureStand = (() => {
  const TAU = Math.PI * 2, Sh = FurnModels.shapes;
  // ---- だいの しゅるい（ばしょは [x, y, z]・左から右・うしろ／うえの だんから）----
  const STEP_Z = [46, 30, 14], STEP_Y = [-55, -33, -11], CASE_Z = [88.6, 50.6, 10.4], XS = [-34, 0, 34], CASE_XS = [-29, 0, 29];
  const STANDS = {
    figstand_step: { name: "ひなだんの フィギュア だい", price: 1280, w: 108, depth: 66, h: 60, comfort: 3, cap: 34, capW: 32,
      desc: "フィギュアを 9こ かざれる 3だんの だい。タップして ならべてね。", rows: ["うしろの だん", "まんなかの だん", "まえの だん"],
      slots: STEP_Z.flatMap((z, r) => XS.map((x) => [x, STEP_Y[r], z])) },
    figstand_case: { name: "ガラスの フィギュア ケース", price: 2480, w: 96, depth: 46, h: 132, comfort: 5, cap: 33, capW: 27,
      desc: "ガラスの たなに フィギュアを 9こ かざれる ケース。よるは あかりが つくよ。", rows: ["うえの たな", "まんなかの たな", "したの たな"], ceil: [124, 86, 48],
      slots: CASE_Z.flatMap((z) => CASE_XS.map((x) => [x, -23, z])) },
    // ---- UI-93 ----
    // キューブ 3 × 3。ばしょは まえから 6（画面で うえの いたに かからない）・x は その ぶん ひだりへ（画面で キューブの まんなか）
    figstand_cube: { name: "キューブの たな", price: 1680, w: 102, depth: 30, h: 104, comfort: 4, cap: 26, capW: 26, win: { y: -6, cols: [[-48, -18.5], [-15.5, 15.5], [18.5, 48]] },
      desc: "パステルいろの キューブ 9こに 1こずつ かざれる たな。", rows: ["うえの だん", "まんなかの だん", "したの だん"], ceil: [100, 67, 34],
      slots: [70, 37, 4].flatMap((z) => [-33.25, 0, 33.25].map((x) => [x - 6, -6, z])) },
    figstand_house: { name: "おうちの たな", price: 1980, w: 96, depth: 24, h: 142, comfort: 4, cap: 28, capW: 26, win: { y: -6, cols: [[-44, -14], [-14, 14], [14, 44]] },
      desc: "やねと えんとつの ある おうちの かたちの たな。3だんに 9こ かざれる。", rows: ["うえの だん", "まんなかの だん", "したの だん"], ceil: [112, 76, 40],
      slots: [80, 44, 8].flatMap((z) => [-27, 0, 27].map((x) => [x - 6, -6, z])) },
    figstand_acryl: { name: "アクリルの ひなだん", price: 1480, w: 96, depth: 50, h: 30, comfort: 3, cap: 34, capW: 30,
      desc: "すきとおった 2だんの だい。6こ かざれて すっきり みえる。", rows: ["うしろの だん", "まえの だん"],
      slots: [[30, -37], [14, -13]].flatMap(([z, y]) => [-31, 0, 31].map((x) => [x, y, z])) },
    // まるい さらの うえで 6こが まわる（ばしょ i は 60どずつ。ring.speed は 1びょうの かくど）
    figstand_turn: { name: "まわる ターンテーブル", price: 2880, w: 88, depth: 88, h: 14, comfort: 5, cap: 34, capW: 26, ring: { y: -44, r: 26, z: 11, speed: 0.45 },
      desc: "フィギュアが ゆっくり まわる まるい だい。6こ かざれる。", names: ["1ばん", "2ばん", "3ばん", "4ばん", "5ばん", "6ばん"],
      slots: Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU + Math.PI / 2; return [Math.cos(a) * 26, -44 + Math.sin(a) * 26, 11]; }) },
    figstand_tower: { name: "コレクション タワー", price: 3680, w: 66, depth: 44, h: 178, comfort: 6, cap: 30, capW: 19,
      desc: "ガラスの 4だんの タワー。12こ かざれて、よるは あかりが つくよ。", rows: ["いちばん うえ", "2だんめ", "3だんめ", "いちばん した"], ceil: [170, 126, 88, 50],
      slots: [128.6, 90.6, 52.6, 10.4].flatMap((z) => [-20, 0, 20].map((x) => [x, -22, z])) },
  };
  const isStand = (id) => !!STANDS[id];
  const COLS = ["ひだり", "まんなか", "みぎ"];
  const slotName = (S, i) => (S.names ? S.names[i] : `${S.rows[Math.floor(i / 3)]}の ${COLS[i % 3]}`);
  const lights = (id) => id === "figstand_case" || id === "figstand_tower"; // よるは あかりが つく だい

  // ---- かざれる フィギュア（ガチャガチャの へやに かざる もの・はしわたしの フィギュア・すいぞくかんの フィギュア・にこにこ セットの おもちゃ）----
  const isFigure = (id) => {
    if (!FURN_INDEX[id] || isStand(id)) return false;
    if (typeof Gacha !== "undefined" && Gacha.INDEX[id]) return Gacha.INDEX[id].kind === "furn";
    if (typeof BridgePrizes !== "undefined" && BridgePrizes.INDEX[id]) return BridgePrizes.INDEX[id].kind === "fig";
    if (typeof AquaGifts !== "undefined" && AquaGifts.INDEX[id]) return FURN_INDEX[id].aquaGift === "fig";
    if (typeof BurgerMenu !== "undefined" && BurgerMenu.TOY_INDEX[id]) return true; // バーガーやさんの にこにこ セットの おまけ
    return EXTRA.has(id); // あとから たした フィギュア（いちばんくじの マグ・アクリル スタンド・ちび ぬいぐるみ。js/ichiban-kuji.js）
  };
  // ほかの ファイルの フィギュアを たす（この ファイルより あとで よむ ファイル から）
  const EXTRA = new Set();
  const addFigures = (list) => { for (const id of list) if (FURN_INDEX[id] && !isStand(id)) { EXTRA.add(id); FURN_INDEX[id].figure = true; } };
  const figures = () => FURNITURE.filter((f) => isFigure(f.id)).map((f) => f.id);
  // だいの figs を ばしょの かず に そろえる（しらない id・フィギュアで ない ものは からっぽ）
  const figsOf = (it) => { const S = STANDS[it && it.id]; if (!S) return []; const a = Array.isArray(it.figs) ? it.figs : []; return S.slots.map((_, i) => (typeof a[i] === "string" && isFigure(a[i]) ? a[i] : null)); };
  // へやの アイテムの ならびの なかで、だいに かざって いる かず
  const onStands = (items, id) => (items || []).reduce((n, it) => n + (isStand(it.id) ? figsOf(it).filter((x) => x === id).length : 0), 0);

  // ---- 家具に いれる ----
  for (const [id, S] of Object.entries(STANDS)) {
    const f = { id, name: S.name, price: S.price, kind: "floor", w: S.w, h: S.h, depth: S.depth, comfort: S.comfort, interactive: true, figureStand: S.slots.length, desc: S.desc };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = () => HomeDesign.model(id).full;
  }
  for (const id of figures()) FURN_INDEX[id].figure = true;
  // おいた かず に だいの うえの フィギュアも いれる（もようがえで 2こめを おけない・だいを しまうと もどる）
  const placed0 = Room.placed;
  Room.placed = function (id) { return placed0.call(this, id) + (isFigure(id) ? HomeRooms.all().reduce((n, r) => n + onStands(r.items, id), 0) : 0); };
  // いごこち: かざった フィギュアも その へやの いごこちに なる
  const comfort0 = Room.comfort;
  Room.comfort = function () { return comfort0.call(this) + (Save.d.room.items || []).reduce((n, it) => n + (isStand(it.id) ? figsOf(it).reduce((m, x) => m + (x ? FURN_INDEX[x].comfort || 0 : 0), 0) : 0), 0); };
  // プリセット: figs も おぼえる・よびだす ときは ほかの へやで つかって いる かずも かぞえる
  const snap0 = RoomPresets.snapshot;
  RoomPresets.snapshot = function (name) { const p = snap0.call(this, name); Save.d.room.items.forEach((it, i) => { if (isStand(it.id) && p.items[i] && p.items[i].id === it.id) { const a = figsOf(it); if (a.some(Boolean)) p.items[i].figs = a; } }); return p; };
  const problem0 = RoomPresets.problem;
  RoomPresets.problem = function (p) {
    const why = problem0.call(this, p); if (why) return why;
    const need = {};
    for (const it of p.items) if (isStand(it.id)) for (const x of figsOf(it)) if (x) need[x] = (need[x] || 0) + 1;
    for (const [id, n] of Object.entries(need)) {
      const used = Object.values(Save.d.rooms.stored).reduce((a, r) => a + r.items.filter((it) => it.id === id).length + onStands(r.items, id), 0);
      const inPreset = p.items.filter((it) => it.id === id).length;
      if (n + inPreset + used > (Save.d.furn[id] || 0)) return FURN_INDEX[id].name + "が たりないよ。べつの おへやで かざって いないか みてね。";
    }
    return null;
  };

  // ---- 立体（FurnModels）----
  const WOOD = ["#E9D3AE", "#CDB287", "#F4E4C6"], FELT = "#F6C3CE", FELTD = "#E7A3B3", GOLD = "#E3C06B";
  const M = {};
  // 1. ひなだん: うしろ → まえ の じゅんに 3だん。うえに ピンクの フェルト・まえの ふちに きんの せん
  M.figstand_step = (k) => {
    const { box, shape, TP, FR, lineOn } = k;
    let s = k.shadow(0.12, 4, 8);
    [[-66, 46], [-44, 30], [-22, 14]].forEach(([y, z]) => {
      s += box(-54, y, 108, 22, 0, z, WOOD);
      s += shape(TP(z + 0.1), Sh.rect(-52, y + 2, 104, 18), FELT, 1) + lineOn(TP(z + 0.15), [[-52, y + 19], [52, y + 19]], FELTD, 1.2);
      s += lineOn(FR(y + 22.05), [[-54, z - 2.5], [54, z - 2.5]], GOLD, 1.6);
    });
    // まえの だんの ねふだ
    s += k.onP(FR(0.1), -14, 10, 28, 7, `<rect x="0" y="0" width="28" height="7" rx="2" fill="#FFF8EA" stroke="${INK}" stroke-width="0.9"/><path d="M5,3.5 H23" stroke="${GOLD}" stroke-width="1.2"/>`);
    return s;
  };
  // 2. ガラスの ケース: きの だいと やね・おくの かべ・ガラスの たな 2まい・みぎと まえの ガラスと はしら（live の ときは FurnLive が フィギュアの あとに 描く）
  const CW = ["#B98E5F", "#97704A", "#D4AC7C"], GLASS = ["#D7EEF5", "#BFDDE7", "#E9F7FB"];
  M.figstand_case = (k) => {
    const { box, shape, FR, SD, TP, lineOn, L } = k;
    let s = k.shadow(0.12, 3, 6);
    s += box(-48, -46, 96, 46, 0, 10, CW);
    s += shape(FR(-45.5), Sh.rect(-46, 10, 92, 114), "#F4EFE7", 1.2) + lineOn(FR(-45.4), [[-46, 122], [46, 122]], "#FFF6D8", 2.2, 'opacity=".8"');
    for (const z of [48, 86]) s += box(-46, -44, 92, 42, z, 2.4, GLASS, 1);
    s += shape(TP(10.1), Sh.rect(-46, -44, 92, 42), "#EFE6D6", 0);
    s += box(-48, -46, 96, 46, 124, 8, CW);
    s += box(44, -46, 4, 4, 10, 114, CW);
    s += L(glassSvg(k));
    return s;
  };
  // みぎと まえの ガラス・まえの はしら（2D の 絵で。live では canvas で おなじ ものを 描く）
  const glassSvg = (k) => {
    const { shape, FR, SD, lineOn, box } = k;
    return shape(SD(48), Sh.rect(-46, 10, 46, 114), GLASS[0], 1.2, 'fill-opacity=".3"') + shape(FR(0), Sh.rect(-48, 10, 96, 114), GLASS[2], 1.2, 'fill-opacity=".14"') +
      lineOn(FR(0.1), [[-30, 18], [-6, 110]], "#FFFFFF", 2.2, 'opacity=".6"') + lineOn(FR(0.1), [[-20, 18], [-8, 64]], "#FFFFFF", 1.4, 'opacity=".5"') +
      box(-48, -4, 4, 4, 10, 114, CW) + box(44, -4, 4, 4, 10, 114, CW);
  };
  // ---- UI-93 の だい ----
  // 3. キューブの たな: キューブの なかは 1こずつ パステル（おく・ひだりの かべ・ゆか）。たての いた → その みぎの キューブ の じゅん
  //    （キューブの ゆかは ひだりの いたの みぎの めんより まえ・おくの いたとは かさならない）
  const WH = ["#FFFDF7", "#E6DFD1", "#FFFFFF"], PASTEL = ["#F9C9D6", "#CDEBDD", "#FFF0B3", "#D9D0F2", "#C9E4F7", "#FFD9B8", "#D7EFC9", "#F6D2E8", "#FCE3B4"];
  M.figstand_cube = (k) => {
    const { box, shape, FR, SD, TP } = k, S = STANDS.figstand_cube, D = S.depth, cols = S.win.cols, rows = [[4, 34], [37, 67], [70, 100]], V = [-51, -18.5, 15.5, 48];
    let s = k.shadow(0.12, 3, 6);
    V.forEach((x, i) => {
      s += box(x, -D, 3, D, 0, 100, WH);
      if (i > 2) return;
      const [x0, x1] = cols[i];
      rows.forEach(([z0, z1], r) => {
        const c = PASTEL[(2 - r) * 3 + i];
        s += shape(FR(-D + 0.5), Sh.rect(x0, z0, x1 - x0, z1 - z0), c, 1) + shape(SD(x0 + 0.05), Sh.rect(-D, z0, D, z1 - z0), shade(c, -0.1), 0.8);
        s += box(x0, -D, x1 - x0, D, z0 - (r ? 3 : 4), r ? 3 : 4, WH) + shape(TP(z0 + 0.05), Sh.rect(x0 + 0.5, -D + 0.5, x1 - x0 - 1, D - 1), shade(c, 0.08), 0);
      });
    });
    s += box(-51, -D, 102, D, 100, 4, WH);
    return s;
  };
  // 4. おうちの たな: だい・ひだりの かべ・たな 2まい・みぎの かべ・てんじょう・やね（ひだり → みぎ → まえの さんかく）・まるい まど・えんとつ
  const HW = ["#F3DDB5", "#D8BC8E", "#FBEBCB"], ROOF = ["#E07078", "#C9555E", "#F08C92"], TRIM = "#FFF6EA";
  M.figstand_house = (k) => {
    const { box, shape, FR, SD, poly, onP, lineOn } = k, D = STANDS.figstand_house.depth, ridge = 142, rows = [[8, 40], [44, 76], [80, 112]];
    // ハートの もよう（w × h の 2D の 絵）
    const hearts = (w, h) => Array.from({ length: Math.ceil(h / 13) }, (_, r) => Array.from({ length: Math.ceil(w / 13) }, (_, c) => { const x = 6 + c * 13 + (r % 2) * 6, y = 6 + r * 13; return x > w - 3 ? "" : `<path d="M${x},${y + 1.6} c0,-2.4 -4,-2.4 -4,0.4 c0,2 2.4,3.2 4,4.8 c1.6,-1.6 4,-2.8 4,-4.8 c0,-2.8 -4,-2.8 -4,-0.4 z" fill="#F4A9BE" opacity=".85"/>`; }).join("")).join("");
    let s = k.shadow(0.12, 3, 6);
    s += shape(FR(-D + 0.5), Sh.rect(-44, 8, 88, 104), "#BFE6D3", 1) + onP(FR(-D + 0.6), -44, 112, 88, 104, hearts(88, 104));
    s += box(-48, -D, 96, D, 0, 8, HW);
    s += box(-48, -D, 4, D, 8, 104, HW);
    // ひだりの かべの うちがわ（だんごとに ミントの かべがみ）→ たな
    for (const [z0, z1] of rows) s += shape(SD(-43.95), Sh.rect(-D, z0, D, z1 - z0), "#AEDCC6", 0.8) + onP(SD(-43.9), -D, z1, D, z1 - z0, hearts(D, z1 - z0));
    for (const z of [40, 76]) s += box(-44, -D, 88, D, z, 4, HW);
    s += box(44, -D, 4, D, 8, 104, HW);
    s += box(-48, -D, 96, D, 112, 4, HW);
    s += poly([[-53, 2, 113], [0, 2, ridge], [0, -D - 3, ridge], [-53, -D - 3, 113]], ROOF[1], 1.5);
    s += poly([[0, 2, ridge], [53, 2, 113], [53, -D - 3, 113], [0, -D - 3, ridge]], ROOF[0], 1.5);
    for (let i = 1; i < 4; i++) s += lineOn((a, b) => [a, b, ridge - (Math.abs(a) / 53) * (ridge - 113)], [[53 * i / 4, 2], [53 * i / 4, -D - 3]], "#B84952", 1, 'opacity=".7"');
    // えんとつ（みぎの やねの うえ。やねの あとに 描く）
    s += box(24, -D + 4, 8, 8, 126, 15, ["#C99572", "#A87656", "#DDB08E"]);
    s += poly([[-48, 2, 116], [48, 2, 116], [0, 2, ridge - 3]], TRIM, 1.5);
    s += onP(FR(2.1), -7, 132, 14, 14, `<circle cx="7" cy="7" r="6" fill="#A8DAF2" stroke="${INK}" stroke-width="1.1"/><path d="M7,1.2 V12.8 M1.2,7 H12.8" stroke="${INK}" stroke-width=".9"/>`);
    return s;
  };
  // 5. アクリルの ひなだん: すきとおった はこ 2つ（まえ・みぎ・うえの めんだけ）と まえの ひかりの すじ・したの LED
  const AC = "#DDF3FB", ACE = "#A9D7EA";
  M.figstand_acryl = (k) => {
    const { poly, lineOn, FR } = k;
    const clear = (x, y, w, d, z, h) => poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], AC, 1.2, 'fill-opacity=".45"') +
      poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], ACE, 1.2, 'fill-opacity=".45"') +
      poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], "#F3FCFF", 1.2, 'fill-opacity=".65"');
    let s = k.shadow(0.1, 3, 6);
    s += clear(-48, -50, 96, 26, 0, 30) + clear(-48, -24, 96, 22, 0, 14);
    s += lineOn(FR(-23.9), [[-40, 6], [-33, 26]], "#FFFFFF", 1.6, 'opacity=".85"') + lineOn(FR(-1.9), [[-42, 3], [-37, 11]], "#FFFFFF", 1.6, 'opacity=".85"');
    s += lineOn(FR(-1.8), [[-45, 1.4], [45, 1.4]], "#7FD8FF", 1.8);
    return s;
  };
  // 6. まわる ターンテーブル: だい・さら・きんの わ・まんなかの じく（まわる しるしと フィギュアは FurnLive）
  M.figstand_turn = (k) => {
    const { cyl, lineOn, TP, onP, FR } = k, S = STANDS.figstand_turn, cy = S.ring.y;
    let s = k.shadow(0.12, 4, 40);
    s += cyl(0, cy, 0, 40, 6, "#5F6677", "#7C8597") + cyl(0, cy, 6, 37, 5, "#D9CBB4", "#FFF8EC");
    s += lineOn(TP(11.05), Sh.close(Sh.ov(0, cy, 34, 34, 48)), GOLD, 1.4);
    s += cyl(0, cy, 11, 5, 2.5, "#D9B45C", "#F4DA8E");
    s += onP(FR(-4.5), -6, 5, 12, 4, `<rect x="0" y="0" width="12" height="4" rx="2" fill="#9FE3B5" stroke="${INK}" stroke-width=".7"/>`);
    return s;
  };
  // 7. コレクション タワー: くろい だいと やね・おくの かがみ・ガラスの たな 3まい・みぎと まえの ガラスと はしら（live では FurnLive が フィギュアの あとに 描く）
  const TC = ["#3A3F4A", "#2B2F38", "#4D5360"];
  M.figstand_tower = (k) => {
    const { box, shape, FR, TP, L } = k;
    let s = k.shadow(0.12, 3, 6);
    s += box(-33, -44, 66, 44, 0, 10, TC);
    s += shape(FR(-43.5), Sh.rect(-31, 10, 62, 160), "#EAF0F5", 1.2) + k.lineOn(FR(-43.4), [[-31, 168], [31, 168]], "#FFF6D8", 2.2, 'opacity=".8"');
    for (const z of [50, 88, 126]) s += box(-31, -42, 62, 40, z, 2.4, GLASS, 1);
    s += shape(TP(10.1), Sh.rect(-31, -42, 62, 40), "#E2E7EC", 0);
    s += box(-33, -44, 66, 44, 170, 8, TC);
    s += box(29, -44, 4, 4, 10, 160, TC);
    s += L(towerGlassSvg(k));
    return s;
  };
  const towerGlassSvg = (k) => {
    const { shape, FR, SD, lineOn, box } = k;
    return shape(SD(33), Sh.rect(-44, 10, 44, 160), GLASS[0], 1.2, 'fill-opacity=".3"') + shape(FR(0), Sh.rect(-33, 10, 66, 160), GLASS[2], 1.2, 'fill-opacity=".14"') +
      lineOn(FR(0.1), [[-22, 20], [-6, 150]], "#FFFFFF", 2.2, 'opacity=".6"') + lineOn(FR(0.1), [[-14, 20], [-5, 80]], "#FFFFFF", 1.4, 'opacity=".5"') +
      box(-33, -4, 4, 4, 10, 160, TC) + box(29, -4, 4, 4, 10, 160, TC);
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- へやで 描く（FurnLive）: だいの うえの フィギュア・ケースの ガラス・よるの あかり ----
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  // フィギュアの 立体の 足もと（FurnModels の 2D の 絵は だいの まんなか・池袋の おしなもの〔ガチャ・はしわたし〕は 0, 0）
  const foot = (id) => { const f = FURN_INDEX[id]; if (FurnModels.has(id)) { const d = HomeDesign.dimensions(id).d; return HomeDesign.project(0, -d / 2, 0); } return { x: 0, y: 0 }; };
  // だいの ばしょに おく 大きさ（たかさ cap・はば capW に おさめる）
  const scaleOf = (S, id) => { const f = FURN_INDEX[id], k = Math.min(0.7, S.cap / f.h, S.capW / f.w); return S.win ? Math.min(k, winScale(S, id)) : k; };
  // まえに いたが ある たな（win）: 画面で フィギュアの 絵が まえの いた（よこの しきり・うえの いた）に かからない 大きさ（UI-93）。
  // あしもと F から 絵の ひだり L・みぎ Rr・うえ T（k = 1）。しきりの まえの めんは x0・x1、うえの いたの まえの したの ふちは y = (X / A) B − ceil
  const WIN = new Map();
  const winScale = (S, id) => {
    const key = S.name + "|" + id; if (WIN.has(key)) return WIN.get(key);
    const m = HomeDesign.model(id), ft = foot(id), A = HomeDesign.A, B = HomeDesign.B, L = ft.x - m.x, Rr = m.x + m.w - ft.x, T = ft.y - m.y;
    let k = Infinity;
    S.slots.forEach(([x, y, z], i) => {
      const [x0, x1] = S.win.cols[i % 3], ceil = S.ceil[Math.floor(i / 3)], Fx = (x - y) * A, Fy = (x + y) * B - z;
      k = Math.min(k, L > 0 ? (Fx - x0 * A) / L : Infinity, Rr > 0 ? (x1 * A - Fx) / Rr : Infinity, (Fy + ceil - (Fx * B) / A) / (T + (Rr * B) / A));
    });
    k *= 0.97; WIN.set(key, k); return k;
  };
  const sprite = (id, k, s) => {
    const m = HomeDesign.model(id), px = Math.max(8, Math.ceil((m.w * k * s * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * m.h) / m.w));
    const c = SvgCache.get(`figstand:${id}:${px}`, () => m.full, px, py); return c ? { c, m } : null;
  };
  // ターンテーブルの いまの ばしょ（G.t で まわる。ばしょ i は 60どずつ）
  const ringAt = (S, t = G.t) => S.slots.map((_, i) => { const a = (i / S.slots.length) * TAU + Math.PI / 2 + t * S.ring.speed; return [Math.cos(a) * S.ring.r, S.ring.y + Math.sin(a) * S.ring.r, S.ring.z]; });
  const drawFigs = (ctx, sc, it, r) => {
    const S = STANDS[it.id], P = mapper(sc, it, r), a = figsOf(it);
    // うしろの だんから（ならびが うしろ → まえ）・おなじ だんは ひだりから。ターンテーブルは そのときの おくゆきの じゅん
    const at = S.ring ? ringAt(S) : S.slots, order = a.map((_, i) => i);
    if (S.ring) order.sort((i, j) => P(...at[i]).y - P(...at[j]).y);
    for (const i of order) {
      const id = a[i]; if (!id) continue;
      const k = scaleOf(S, id), sp = sprite(id, k, P.s); if (!sp) continue;
      const q = P(...at[i]), ft = foot(id), s = P.s * k;
      ctx.drawImage(sp.c, q.x + (sp.m.x - ft.x) * s, q.y + (sp.m.y - ft.y) * s, sp.m.w * s, sp.m.h * s);
    }
  };
  // ターンテーブルの さらの ふちの しるし（まわって いるのが わかる）
  const drawRing = (ctx, sc, it, r) => {
    const S = STANDS[it.id], P = mapper(sc, it, r);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + G.t * S.ring.speed, c = P(Math.cos(a) * 34, S.ring.y + Math.sin(a) * 34, 11.1);
      ctx.fillStyle = i % 2 ? "#F4DA8E" : "#F7B8C9"; ctx.strokeStyle = INK; ctx.lineWidth = 0.8 * P.s;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, 2.4 * P.s, 1.3 * P.s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
  };
  const poly = (ctx, pts, fill, stroke) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = INK; ctx.lineWidth = stroke; ctx.lineJoin = "round"; ctx.stroke(); } };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const caseOn = (st) => (st.on == null ? typeof DayTint !== "undefined" && DayTint.isNight() : st.on);
  // コレクション タワー: たなの あかり・ガラスと はしら（ケースと おなじ しくみ・たかさと はばが ちがう）
  const drawTowerGlow = (ctx, sc, it, r, st) => {
    if (!caseOn(st)) return;
    const P = mapper(sc, it, r);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const z of [160, 120, 82, 44]) { const c = P(0, -26, z); glow(ctx, c.x, c.y, 30 * P.s, "255,226,160", 0.2); }
    ctx.restore();
  };
  const drawTowerGlass = (ctx, sc, it, r) => {
    const P = mapper(sc, it, r), s = P.s;
    poly(ctx, [P(33, -44, 10), P(33, 0, 10), P(33, 0, 170), P(33, -44, 170)], "rgba(215,238,245,0.3)", 1.2 * s);
    poly(ctx, [P(-33, 0, 10), P(33, 0, 10), P(33, 0, 170), P(-33, 0, 170)], "rgba(233,247,251,0.14)", 1.2 * s);
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineCap = "round";
    for (const [a, b, w] of [[[-22, 20], [-6, 150], 2.2], [[-14, 20], [-5, 80], 1.4]]) { const p = P(a[0], 0.1, a[1]), q = P(b[0], 0.1, b[1]); ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    for (const x0 of [-33, 29]) {
      poly(ctx, [P(x0, 0, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 170), P(x0, 0, 170)], TC[0], 1.2 * s);
      poly(ctx, [P(x0 + 4, -4, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 170), P(x0 + 4, -4, 170)], TC[1], 1.2 * s);
    }
  };
  // たなの あかり（フィギュアの うしろに 描く ので フィギュアは しろく ならない）
  const drawCaseGlow = (ctx, sc, it, r, st) => {
    if (!caseOn(st)) return;
    const P = mapper(sc, it, r);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const z of [118, 80, 42]) { const c = P(0, -30, z); glow(ctx, c.x, c.y, 40 * P.s, "255,226,160", 0.2); }
    ctx.restore();
  };
  const drawGlass = (ctx, sc, it, r) => {
    const P = mapper(sc, it, r), s = P.s;
    poly(ctx, [P(48, -46, 10), P(48, 0, 10), P(48, 0, 124), P(48, -46, 124)], "rgba(215,238,245,0.3)", 1.2 * s);
    poly(ctx, [P(-48, 0, 10), P(48, 0, 10), P(48, 0, 124), P(-48, 0, 124)], "rgba(233,247,251,0.14)", 1.2 * s);
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineCap = "round";
    for (const [a, b, w] of [[[-30, 18], [-6, 110], 2.2], [[-20, 18], [-8, 64], 1.4]]) { const p = P(a[0], 0.1, a[1]), q = P(b[0], 0.1, b[1]); ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    // まえの はしら（2本）
    for (const x0 of [-48, 44]) {
      poly(ctx, [P(x0, 0, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 124), P(x0, 0, 124)], CW[0], 1.2 * s);
      poly(ctx, [P(x0 + 4, -4, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 124), P(x0 + 4, -4, 124)], CW[1], 1.2 * s);
    }
  };
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };

  // ---- かざる 画面 ----
  // もって いて、どこにも おいて いない かず（いま かざって いる ばしょの ぶんは のぞく）
  const free = (id) => Room.available(id);
  const icon = (id, size = 46) => `<span class="figst-ico" style="width:${size}px;height:${size}px">${Art.furnSvg(id)}</span>`;
  let view = null;
  const save = () => { Save.mark(); Save.write(); };
  function open(sc, it) {
    const S = STANDS[it.id]; if (!S) return null;
    const body = U.el("div", { class: "figst" }), m = UI.modal({ title: "フィギュアを かざる", body, cls: "full figst-panel", onClose: () => { view = null; } });
    view = { sc, it, m, body, pick: null };
    const render = () => {
      const a = figsOf(it), have = figures().filter((id) => (Save.d.furn[id] || 0) > 0);
      body.replaceChildren(U.el("p", { class: "note figst-lead", text: `${S.name}。かざる ばしょを タップしてね（${a.filter(Boolean).length} / ${a.length}）。` }));
      const grid = U.el("div", { class: "figst-grid" });
      a.forEach((id, i) => {
        const b = U.el("button", { class: "figst-slot" + (id ? " on" : ""), "aria-label": slotName(S, i) + (id ? "・" + FURN_INDEX[id].name : "・あいて いる"), "data-slot": i, html: id ? icon(id, 60) : `<span class="figst-plus">＋</span>` });
        b.addEventListener("click", () => { Sound.se("tap"); choose(i); });
        grid.append(b);
      });
      body.append(grid);
      const row = U.el("div", { class: "row wrap figst-acts" });
      row.append(UI.btn("ぜんぶ ならべる", () => fill(), "yellow"), UI.btn("ぜんぶ もどす", () => clear(), "pink"));
      body.append(row, U.el("p", { class: "note", text: have.length ? `もって いる フィギュア ${have.length}しゅ。だいを しまうと フィギュアは もちものに もどるよ。` : "フィギュアが まだ ないよ。ガチャガチャ・はしわたし・すいぞくかんの おみやげで てに いれよう。" }));
    };
    const set = (i, id) => { const a = figsOf(it); a[i] = id; it.figs = a; save(); };
    const fill = () => {
      const a = figsOf(it); let n = 0;
      for (const id of figures()) { let k = free(id); while (k-- > 0) { const i = a.indexOf(null); if (i < 0) break; a[i] = id; n++; } }
      if (!n) { Sound.se("bad"); UI.toast(a.indexOf(null) < 0 ? "もう ぜんぶ かざって いるよ" : "かざれる フィギュアが ないよ"); return; }
      it.figs = a; save(); Sound.se("ok"); say(sc, it, "ずらっと ならんだ！", "heart"); render();
    };
    const clear = () => { if (!figsOf(it).some(Boolean)) return; it.figs = figsOf(it).map(() => null); save(); Sound.se("cancel"); render(); };
    // ばしょ i に かざる フィギュアを えらぶ
    const choose = (i) => {
      const cur = figsOf(it)[i], list = figures().filter((id) => free(id) > 0 || id === cur), pb = U.el("div", { class: "figst-pick" });
      if (!list.length) pb.append(U.el("p", { class: "note", text: "かざれる フィギュアが ないよ。ほかの だいや へやに おいて いないか みてね。" }));
      const g = U.el("div", { class: "grid figst-list" });
      for (const id of list) {
        const n = free(id), c = U.el("button", { class: "card" + (id === cur ? " on" : ""), "aria-label": FURN_INDEX[id].name, html: `${n > 0 ? `<span class="cnt">×${n}</span>` : ""}${icon(id, 52)}<div>${FURN_INDEX[id].name}</div>` });
        c.addEventListener("click", () => { Sound.se("ok"); set(i, id); pm.close(); render(); say(sc, it, ["かざったよ！", "いい ばしょ だね", "にあう〜！"][i % 3], "heart"); });
        g.append(c);
      }
      pb.append(g);
      const foot = U.el("div", { class: "row", style: "width:100%" });
      if (cur) foot.append(UI.btn("とりだす", () => { Sound.se("cancel"); set(i, null); pm.close(); render(); }, "pink"));
      const pm = UI.modal({ title: slotName(S, i), body: pb, cls: "full figst-panel", footer: cur ? foot : null });
      view.pick = { i, m: pm };
    };
    render();
    return m;
  }

  for (const id of Object.keys(STANDS)) {
    const tower = id === "figstand_tower";
    FurnLive.register(id, {
      ...(lights(id) ? { isOn: caseOn } : {}),
      tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; open(sc, it); },
      draw(ctx, sc, it, r, st) {
        if (id === "figstand_case") drawCaseGlow(ctx, sc, it, r, st); else if (tower) drawTowerGlow(ctx, sc, it, r, st);
        if (STANDS[id].ring) drawRing(ctx, sc, it, r);
        drawFigs(ctx, sc, it, r);
        if (id === "figstand_case") drawGlass(ctx, sc, it, r); else if (tower) drawTowerGlass(ctx, sc, it, r);
      },
      ...(lights(id) ? { light(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r), p = P(0, tower ? -26 : -23, tower ? 100 : 80); glow(ctx, p.x, p.y, (tower ? 110 : 100) * P.s, "255,214,140", 0.22); } } : {}),
    }, lights(id));
  }
  return { STANDS, isStand, isFigure, addFigures, figures, figsOf, onStands, slotName, scaleOf, foot, ringAt, open, get view() { return view; } };
})();
