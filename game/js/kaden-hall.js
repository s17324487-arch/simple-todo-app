// UI-56: ネリカス電機（池袋の 家電の 館）を サンシャインいけぶと おなじ 斜め上の 館（IsoVenueScene・絵は KadenHallArt）に 作りなおす。
// オーナーの FB 2026-10-03「池袋の家電屋さんを、もっとハイクオリティにせよ。内装をサンシャインいけぶレベルまでよくして、家電ももっとクオリティアップせよ」。
// つくりは 池袋の 大きな 家電の みせ（かいごとに うりばが わかれる・まんなかに エスカレーター・にしの かべに エレベーター）を もとに した:
//   1F スマホ・カメラ・イヤホン（いりぐち・あたらしい スマホの ステージ・サービス カウンター）
//   2F くらしの かでん（エアコン・せんたくき・れいぞうこ・そうじき・キッチン・きせつの かでん）
//   3F テレビ・オーディオ・パソコン・ゲーム・でんわ（テレビの かべ）
//   10F あかり・マッサージチェア・シアター（まどから いけぶくろの まち）
// うる 家電は js/kaden-items.js（これまでの ID・ねだん・BUY_SHOPS.ike_electronics は そのまま）。だいを タップすると その場で かえる。
const KadenHall = {
  W: 38, H: 28,
  // エスカレーター（ESC1: 1F ⇔ 2F・ESC2: 2F ⇔ 3F。まんなかに ならぶ）
  ESC: { 1: { x: 18, y: 12, w: 4, h: 7 }, 2: { x: 23, y: 12, w: 4, h: 7 } },
  mats: { ".": "kwhite", p: "kpink", c: "kgray", a: "klav", g: "kmint", y: "klemon", k: "korange", b: "kblue", w: "kwood", d: "kdark", m: "mat", r: "kred", t: "ktheater" },
  room(floor, title, extra = {}) {
    const W = this.W, H = this.H;
    return { id: "kaden" + floor, iso: true, w: W, h: H, wallH: 340, scale: 0.48, title, bgm: "shop_kaden", crowd: 6, rows: Array.from({ length: H }, () => ".".repeat(W)), mats: this.mats, walls: { north: [], west: [] }, fixtures: [], decals: [], zones: [], ...extra };
  },
  put(r, x, y, ch) { const row = r.rows[y]; r.rows[y] = row.slice(0, x) + ch + row.slice(x + 1); },
  fill(r, x0, y0, w, h, ch) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < r.w && y < r.h) this.put(r, x, y, ch); },
  zone(r, shop, x, y, w, h, ch, map) { r.zones.push({ shop, x, y, w, h, label: KadenHallArt.SHOPS[shop].name, map }); if (ch) this.fill(r, x, y, w, h, ch); },
  // 家電の だい（タップで その場で かえる）。家具は 2×2・ひろい 家電は 3×2
  stand(r, shop, item, x, y, w = 2, h = 2) {
    const it = VenueHalls.item(item); if (!it) throw Error("kaden: しなものが ない " + item);
    r.fixtures.push({ kind: "kstand", shop, item, x, y, w, h, height: 70, itemZ: 12.4, label: it.name, action: "buy", shopId: "ike_electronics", buyKind: FURN_INDEX[item] ? "furn" : "wear" });
  },
  clerk(r, sp, x, y, text, label = "てんいん") { r.fixtures.push({ kind: "npc", sp, x, y, w: 1, h: 1, height: 110, label, action: "info", text, outfit: { body: "apron" } }); },
  hang(r, x, y, w, text, col, face) { r.fixtures.push({ kind: "hangsign", face, x, y, w: face === "x" ? 1 : w, h: face === "x" ? w : 1, z: 236, text, col, over: true, walk: true, fadeOver: true }); },
  escVoid(r, e) { this.fill(r, e.x, e.y + 1, e.w, e.h - 1, "o"); r.holes = r.holes || []; r.holes.push({ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 }); },
  escUp(r, e, to) {
    r.fixtures.push({ kind: "escalator", pair: true, x: e.x, y: e.y, w: e.w, h: e.h, rise: 176, height: 200, label: to + "Fへ のぼる", action: "floor", to, spawn: [e.x + 1, e.y - 1] });
    r.fixtures.push({ kind: "slab", x: e.x - 0.3, y: e.y - 0.4, w: e.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
  },
  escDown(r, e, to) { this.escVoid(r, e); r.fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e.x, y: e.y, w: e.w, h: e.h, rise: 210, height: 40, label: to + "Fへ おりる", action: "floor", to, spawn: [e.x + 3, e.y + e.h] }); },
  // にしの かべ: エレベーター（どの かいも）・トイレ・AED
  westHall(r, toilet = true) {
    r.walls.west.push({ kind: "elevator", from: 9, to: 15, doors: 2, label: "エレベーター" });
    r.fixtures.push({ kind: "elevatorCall", x: 0, y: 10, w: 1, h: 4, height: 180, label: "エレベーター", action: "elevator", noFade: true });
    if (toilet) { r.walls.west.push({ kind: "toilet", from: 16, to: 19, label: "トイレ" }); r.fixtures.push({ kind: "toiletDoor", x: 0, y: 16, w: 1, h: 3, height: 150, label: "トイレ", action: "info", text: "トイレは きれいに つかおうね。", noFade: true }); }
    r.elevatorSpawn = [2, 12];
  },
  register(r, x, y, sp) {
    this.zone(r, "kd_register", x - 1, y - 1, 8, 3);
    r.fixtures.push({ kind: "kcounter", shop: "kd_register", x, y, w: 6, h: 1, height: 90, label: "おかいけい（ぜんぶの しなもの）", action: "shop", shopId: "ike_electronics" });
    this.clerk(r, sp, x + 2, y - 1, "おかいけいは こちら。\nぜんぶの しなものを ここでも かえるよ。");
  },
  guide(r, x, y) { r.fixtures.push({ kind: "guide", x, y, w: 1, h: 1, height: 150, label: "フロアマップ", action: "guide" }); },

  // ---- 1F スマホ・カメラ・イヤホン（いりぐち）----
  floor1() {
    const r = this.room(1, "1F スマホ・カメラ", { short: "スマホ・カメラ", spawn: [2, 23], crowd: 7 }), e = this.ESC[1];
    r.walls.north.push({ kind: "kbrand", from: 1, to: 13, label: "ネリカス でんき", lines: ["スマホ", "カメラ", "テレビ", "かでん"] }, { kind: "tvwall", from: 13.4, to: 24.6, rows: 2, cols: 4, z0: 96, z1: 270 }, { kind: "caseswall", from: 25, to: 37 });
    r.walls.west.push({ kind: "kposter", from: 1, to: 5, icon: "phone", label: "あたらしい スマホ", col: "#F9D6E2" }, { kind: "door", from: 20, to: 26, label: "いりぐち", col: "#CFE3EA" });
    this.westHall(r, false);
    r.fixtures.push({ kind: "aed", x: 0, y: 16, w: 1, h: 1, height: 130, label: "AED", action: "info", text: "AEDは しんぞうを たすける きかい。\nこまったら おとなの ひとを よんでね。" });
    this.fill(r, 0, 21, 2, 5, "m");
    r.fixtures.push({ kind: "exitMat", x: 0, y: 21, w: 1, h: 5, height: 170, label: "たてものを でる", action: "leave", noFade: true });
    // スマホ（くびから かける スマホ 3しゅは マネキンの だい）
    this.zone(r, "kd_phone", 1, 1, 12, 8, "p");
    for (const x of [2, 7]) r.fixtures.push({ kind: "phonetable", shop: "kd_phone", x, y: 2, w: 4, h: 2, height: 80, label: "スマホの ためしの だい", action: "demo", demo: "phone" });
    ["ike_phone_0", "ike_phone_1", "ike_phone_2"].forEach((id, i) => r.fixtures.push({ kind: "pedestal", shop: "kd_phone", item: id, x: 3 + i * 3, y: 6, w: 1, h: 1, height: 150, label: VenueHalls.item(id).name, action: "buy", shopId: "ike_electronics", buyKind: "wear" }));
    this.clerk(r, "rabbit", 11, 2, "スマホは くびから かけて おでかけ できるよ。\nマネキンの だいを タップして えらんでね。");
    this.hang(r, 4, 9, 4, "スマホ", "#D9879F");
    // カメラ
    this.zone(r, "kd_camera", 13, 1, 12, 8, "c");
    r.fixtures.push({ kind: "camcase", shop: "kd_camera", x: 14, y: 2, w: 4, h: 1, height: 80, label: "カメラの ショーケース", action: "demo", demo: "camera" });
    r.fixtures.push({ kind: "camcase", shop: "kd_camera", variant: 1, x: 19, y: 2, w: 4, h: 1, height: 80, label: "レンズの ショーケース", action: "info", text: "とおくを おおきく うつす レンズ、\nひろく うつす レンズ。\nつけかえて つかう カメラも あるよ。" });
    this.clerk(r, "fox", 23, 5, "カメラは 1まいの しゃしんに\nおもいでを とじこめる どうぐ だよ。");
    this.hang(r, 16, 9, 4, "カメラ", "#8C9CAE");
    // イヤホン・とけい
    this.zone(r, "kd_audio", 25, 1, 12, 8, "a");
    r.fixtures.push({ kind: "hpwall", shop: "kd_audio", x: 26, y: 2, w: 5, h: 1, height: 150, label: "ヘッドホンの かべ", action: "demo", demo: "music" });
    r.fixtures.push({ kind: "camcase", shop: "kd_audio", variant: 2, x: 32, y: 2, w: 4, h: 1, height: 80, label: "スマートウォッチ", action: "info", text: "うでに つける ちいさな コンピューター。\nあるいた かずや じかんが わかるよ。" });
    this.clerk(r, "sheep", 35, 5, "ヘッドホンで いい おとを\nためしに きいて みてね。");
    this.hang(r, 28, 9, 5, "イヤホン・とけい", "#9D8BC0");
    // まんなか: エスカレーター・あたらしい スマホの ステージ
    this.escUp(r, e, 2);
    r.fixtures.push({ kind: "promo", shop: "kd_phone", x: 9, y: 12, w: 4, h: 4, height: 140, label: "あたらしい スマホの ステージ", action: "info", text: "きょう でた ばかりの あたらしい スマホ！\nがめんが おおきくて、しゃしんも きれい。" });
    // スマホ アクセサリー（ケース・ケーブル・じゅうでんき）
    this.zone(r, "kd_acc", 25, 12, 12, 8, "y");
    for (const [x, y] of [[26, 13], [31, 13], [26, 17], [31, 17]]) r.fixtures.push({ kind: "accrack", shop: "kd_acc", x, y, w: 4, h: 1, height: 140, label: "スマホ ケースの ラック", action: "info", text: "いろんな いろの スマホ ケース。\nじゅうでんの ケーブルも あるよ。" });
    this.clerk(r, "hamster", 35, 15, "ケースは ねこみみ・いちご・ほしぞら。\nどれも にんき だよ！");
    this.hang(r, 28, 20, 6, "スマホ アクセサリー", "#D9A66A");
    // サービス カウンター・かご・フロアマップ・おかいけい
    this.zone(r, "kd_service", 2, 16, 5, 3);
    r.fixtures.push({ kind: "info", shop: "kd_service", x: 3, y: 17, w: 3, h: 1, height: 160, label: "サービス カウンター", action: "info", text: "ようこそ ネリカス でんきへ！\nエレベーターで 2F・3F・10F へ いけるよ。\n「フロアマップ」で うりばを さがしてね。" });
    this.clerk(r, "penguin", 4, 16, "おおきな かでんも おうちに とどけるよ。\nどの かいも みてね！", "サービスの ひと");
    r.fixtures.push({ kind: "basket", x: 3, y: 20, w: 1, h: 1, height: 46, label: "かいものかご", action: "info", text: "かごに いれて… と おもったら、\nだいを タップすれば そのばで かえるよ。" });
    this.guide(r, 7, 20);
    // いりぐちの セールの ワゴン（いりぐちから まっすぐの みちは あける）
    for (const [x, y, t] of [[5, 21, "でんちや ケーブルが おやすく なって いるよ。\nいろんな いろが あって たのしいね。"], [5, 25, "イヤホンや スマホの ケースが おやすく なって いるよ。\nどれに しようかな？"]]) r.fixtures.push({ kind: "wagon", x, y, w: 2, h: 1, height: 116, label: "セールの ワゴン", action: "info", text: t });
    this.register(r, 27, 23, "cat");
    for (const [x, y] of [[16, 26], [36, 26], [13, 20]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    for (const [x, y] of [[23, 22], [15, 22]]) r.fixtures.push({ kind: "pillar", x, y, w: 1, h: 1, height: 330 });
    return r;
  },

  // ---- 2F くらしの かでん ----
  floor2() {
    const r = this.room(2, "2F くらしの かでん", { short: "くらしの かでん", spawn: [2, 12], crowd: 6 }), e1 = this.ESC[1], e2 = this.ESC[2];
    r.walls.north.push({ kind: "acwall", from: 0.4, to: 8.6, n: 3 }, { kind: "kposter", from: 10, to: 14, icon: "washer", label: "せんたくき", col: "#D3EEF2" }, { kind: "kposter", from: 15, to: 19, icon: "washer", label: "かんそうも おまかせ", col: "#B3DEE5" }, { kind: "kposter", from: 21, to: 25, icon: "fridge", label: "れいぞうこ", col: "#D4EFE2" }, { kind: "kposter", from: 26, to: 30, icon: "fridge", label: "ひんやり しんせん", col: "#B5E0CB" }, { kind: "kposter", from: 32, to: 37, icon: "vacuum", label: "そうじき", col: "#FFF3C4" });
    this.westHall(r, true);
    r.walls.west.push({ kind: "kposter", from: 1, to: 5, icon: "oven", label: "キッチン かでん", col: "#FFE1CC" }, { kind: "kposter", from: 21, to: 25, icon: "fan", label: "きせつの かでん", col: "#DDF0D2" });
    // エアコン（かべに かけた エアコン・まえの ねふだで かう）
    this.zone(r, "kd_aircon", 0, 0, 9, 6, "b");
    r.fixtures.push({ kind: "kpop", shop: "kd_aircon", item: "ike_kaden_aircon", ownArt: true, x: 3, y: 3, w: 1, h: 1, height: 120, label: VenueHalls.item("ike_kaden_aircon").name, action: "buy", shopId: "ike_electronics", buyKind: "furn" });
    this.clerk(r, "penguin", 6, 2, "かべの エアコンは ひんやり・しずか・パワフル。\nねふだを タップすると かえるよ。");
    // せんたくき・れいぞうこ・そうじき（おくの かべに そって）
    this.zone(r, "kd_wash", 9, 0, 11, 6, "b");
    ["ike_washer_0", "ike_washer_1", "ike_washer_2"].forEach((id, i) => this.stand(r, "kd_wash", id, 10 + i * 3, 1));
    this.zone(r, "kd_fridge", 20, 0, 11, 6, "g");
    ["ike_fridge_0", "ike_fridge_1", "ike_fridge_2"].forEach((id, i) => this.stand(r, "kd_fridge", id, 21 + i * 3, 1));
    this.zone(r, "kd_clean", 31, 0, 7, 11, "y");
    this.stand(r, "kd_clean", "ike_vacuum_0", 32, 1); this.stand(r, "kd_clean", "ike_vacuum_1", 35, 1); this.stand(r, "kd_clean", "ike_vacuum_2", 32, 4);
    r.fixtures.push({ kind: "vacpen", shop: "kd_clean", x: 34, y: 4, w: 3, h: 3, height: 24, label: "ロボット そうじきの ためし", action: "info", text: "ロボットが ひとりで おそうじ ちゅう！\nかべに ぶつかると むきを かえるよ。" });
    this.clerk(r, "pig", 36, 8, "そうじきは すいこむ ちからが じまん。\nロボットは かってに おそうじ するよ。");
    this.clerk(r, "bear", 19, 7, "せんたくきも れいぞうこも、\nだいを タップすると そのばで かえるよ。");
    this.hang(r, 12, 7, 4, "せんたくき", "#7FBCC6"); this.hang(r, 23, 7, 4, "れいぞうこ", "#83BFA2"); this.hang(r, 33, 11, 4, "そうじき", "#D9BC52");
    // キッチン かでん
    this.zone(r, "kd_kitchen", 1, 9, 13, 10, "k");
    ["ike_microwave_0", "ike_microwave_1", "ike_microwave_2"].forEach((id, i) => this.stand(r, "kd_kitchen", id, 2 + i * 3, 10));
    ["ike_kaden_rice", "ike_kaden_toaster", "ike_kaden_coffee"].forEach((id, i) => this.stand(r, "kd_kitchen", id, 2 + i * 3, 14));
    r.fixtures.push({ kind: "kshelf", shop: "kd_kitchen", x: 11, y: 10, w: 3, h: 1, height: 140, label: "キッチン こものの たな", action: "info", text: "ケトル・ミキサー・ホットプレート。\nおりょうりが たのしく なる どうぐ。" });
    this.clerk(r, "rabbit", 12, 14, "レンジは「チン！」で あたたまるよ。\nトースターは パンが ポン！");
    this.hang(r, 4, 18, 5, "キッチン かでん", "#D99A6A");
    // きせつの かでん
    this.zone(r, "kd_season", 28, 12, 9, 7, "g");
    this.stand(r, "kd_season", "ike_kaden_fan", 29, 13); this.stand(r, "kd_season", "ike_kaden_purifier", 32, 13);
    this.clerk(r, "sheep", 35, 14, "せんぷうきは そよそよ、\nくうきせいじょうきは へやを すっきり。");
    this.hang(r, 30, 19, 5, "きせつの かでん", "#8DBA74");
    // エスカレーター
    this.escDown(r, e1, 1); this.escUp(r, e2, 3);
    this.guide(r, 15, 21);
    this.register(r, 27, 23, "cat");
    for (const [x, y] of [[16, 26], [36, 26]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    r.fixtures.push({ kind: "vending", x: 0, y: 21, w: 1, h: 1, height: 150, label: "じどうはんばいき", action: "info", text: "つめたい のみものが ならんで いるよ。" });
    return r;
  },

  // ---- 3F テレビ・オーディオ・パソコン・ゲーム・でんわ ----
  floor3() {
    const r = this.room(3, "3F テレビ・パソコン", { short: "テレビ・パソコン", spawn: [2, 12], crowd: 6 }), e2 = this.ESC[2];
    r.walls.north.push({ kind: "tvwall", from: 1, to: 17, rows: 2, cols: 6, z0: 86, z1: 270 }, { kind: "kposter", from: 18, to: 22, icon: "speaker", label: "いい おとを おうちで", col: "#E6DAF0" }, { kind: "kposter", from: 28, to: 32, icon: "pc", label: "パソコン", col: "#CFEAE8" }, { kind: "kposter", from: 33, to: 37, icon: "pc", label: "おえかきも ゲームも", col: "#AEDBD7" });
    this.westHall(r, true);
    r.walls.west.push({ kind: "kposter", from: 1, to: 5, icon: "tv", label: "おおきな がめん", col: "#D2DAEE" }, { kind: "kposter", from: 21, to: 25, icon: "game", label: "ゲーム", col: "#F8D3CF" });
    // テレビ
    this.zone(r, "kd_tv", 1, 0, 17, 10, "d");
    ["ike_tv_0", "ike_tv_1", "ike_tv_2"].forEach((id, i) => this.stand(r, "kd_tv", id, 3 + i * 4, 5));
    r.fixtures.push({ kind: "bench", x: 6, y: 8, w: 3, h: 1, height: 46, label: "テレビを みる ベンチ", action: "watch", text: "おおきな テレビの かべ。\nアニメや うみの ばんぐみが ながれて いるよ。" });
    this.clerk(r, "dog", 15, 6, "テレビは チャンネルで ばんぐみが かわるよ。\nおうちで タップして みてね。");
    this.hang(r, 7, 10, 5, "テレビ", "#7F8FBF");
    // オーディオ
    this.zone(r, "kd_speaker", 18, 0, 9, 9, "a");
    this.stand(r, "kd_speaker", "ike_kaden_speaker", 19, 2, 3, 2);
    r.fixtures.push({ kind: "hpwall", shop: "kd_speaker", x: 23, y: 1, w: 3, h: 1, height: 150, label: "ヘッドホンの かべ", action: "demo", demo: "music" });
    this.clerk(r, "panda", 25, 5, "スピーカーで おんがくを ならすと\nからだが ずんずん するよ。");
    this.hang(r, 20, 9, 4, "オーディオ", "#A28BBF");
    // パソコン
    this.zone(r, "kd_pc", 27, 0, 11, 10, "b");
    r.fixtures.push({ kind: "pcdesk", shop: "kd_pc", x: 28, y: 2, w: 4, h: 1, height: 110, label: "ためしの パソコン", action: "demo", demo: "pc" });
    this.stand(r, "kd_pc", "ike_kaden_pc", 33, 2, 3, 2);
    this.clerk(r, "owl", 31, 6, "パソコンで おえかきや ゲーム。\nつくえと セットで おうちへ どうぞ。");
    this.hang(r, 31, 10, 4, "パソコン", "#76B4AE");
    // ゲーム
    this.zone(r, "kd_game", 1, 11, 12, 9, "r");
    r.fixtures.push({ kind: "gamedemo", shop: "kd_game", x: 4, y: 13, w: 4, h: 3, height: 110, label: "ゲームの ためしあそび", action: "demo", demo: "game" });
    r.fixtures.push({ kind: "gamerack", shop: "kd_game", x: 9, y: 13, w: 3, h: 1, height: 120, label: "ゲームソフトの たな", action: "info", text: "ぼうけん・パズル・レース。\nいろんな ゲームが ならんで いるよ。" });
    r.fixtures.push({ kind: "npc", sp: "cat", ci: 1, x: 5, y: 17, w: 1, h: 1, dir: "up", height: 110, label: "あそんでる こ", action: "info", text: "このゲーム たのしい！\nいっしょに あそぼう！" });
    r.fixtures.push({ kind: "npc", sp: "dog", ci: 2, x: 7, y: 17, w: 1, h: 1, dir: "up", height: 110 });
    this.hang(r, 6, 19, 4, "ゲーム", "#CF7F76");
    // でんわ
    this.zone(r, "kd_tel", 28, 12, 10, 8, "k");
    ["ike_telephone_0", "ike_telephone_1", "ike_telephone_2"].forEach((id, i) => this.stand(r, "kd_tel", id, 29 + i * 3, 13));
    this.clerk(r, "deer", 36, 17, "ダイヤル でんわは ジーコ ジーコ。\nテレビ でんわは かおが みえるよ。");
    this.hang(r, 30, 19, 4, "でんわ", "#D9A273");
    this.escDown(r, e2, 2);
    this.guide(r, 15, 21);
    this.register(r, 27, 23, "cat");
    for (const [x, y] of [[16, 26], [36, 26]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    return r;
  },

  // ---- 10F あかり・マッサージチェア・シアター（まどから いけぶくろの まち）----
  floor10() {
    const r = this.room(10, "10F あかり・シアター", { short: "あかり・シアター", spawn: [2, 12], crowd: 4, sky: true });
    r.walls.north.push({ kind: "lightwall", from: 1, to: 13 }, { kind: "kposter", from: 15, to: 19, icon: "chair", label: "もみ もみ", col: "#E8DDF2" }, { kind: "theater", from: 24, to: 37, label: "ネリカス シアター" });
    r.walls.west.push({ kind: "skyline", from: 1, to: 8 }, { kind: "skyline", from: 16, to: 27 });
    this.westHall(r, false);
    // あかり（あたまの うえに ペンダント ライト）
    this.zone(r, "kd_light", 1, 0, 13, 11, "w");
    r.fixtures.push({ kind: "pendants", shop: "kd_light", x: 1, y: 1, w: 12, h: 3, over: true, walk: true, noFade: true, height: 120, z: 190 });
    ["ike_lighting_0", "ike_lighting_1", "ike_lighting_2"].forEach((id, i) => this.stand(r, "kd_light", id, 2 + i * 4, 5));
    this.clerk(r, "fox", 12, 8, "あかりは よる、おうちで つくよ。\nタップで つけたり けしたり できるの。");
    this.hang(r, 5, 9, 4, "あかり", "#CFB45C");
    // マッサージチェア（1だいは かえる・2だいは ためせる）
    this.zone(r, "kd_health", 14, 0, 10, 11, "a");
    this.stand(r, "kd_health", "ike_kaden_massage", 15, 2);
    for (const x of [18, 21]) r.fixtures.push({ kind: "kmat", shop: "kd_health", item: "ike_kaden_massage", x, y: 2, w: 2, h: 2, height: 110, itemZ: 0.6, label: "ためせる マッサージチェア", action: "massage" });
    this.clerk(r, "koala", 22, 6, "ためしに すわって みてね。\nかたが ぽかぽか ほぐれるよ。");
    this.hang(r, 17, 9, 5, "マッサージチェア", "#A891C9");
    // シアター（おおきな がめん・ソファ）
    this.zone(r, "kd_theater", 24, 0, 14, 14, "t");
    for (const [x, y] of [[25, 6], [29, 6], [33, 6], [25, 10], [29, 10], [33, 10]]) r.fixtures.push({ kind: "tsofa", x, y, w: 3, h: 1, height: 60, label: "シアターの ソファ", action: "theater" });
    this.hang(r, 29, 14, 5, "シアター", "#B07A86");
    this.guide(r, 15, 21);
    r.fixtures.push({ kind: "vending", x: 0, y: 21, w: 1, h: 1, height: 150, label: "じどうはんばいき", action: "info", text: "つめたい のみものが ならんで いるよ。" });
    this.zone(r, "kd_view", 1, 18, 12, 9);
    for (const [x, y, w] of [[4, 20, 3], [9, 24, 3]]) r.fixtures.push({ kind: "bench", x, y, w, h: 1, height: 46, label: "まどの まえの ベンチ", action: "sit", text: "まどから いけぶくろの まちが みえるよ。\nサンシャインの たかい ビルも！" });
    for (const [x, y] of [[16, 26], [36, 26], [1, 26]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    return r;
  },

  // ---- しらべる（ためしの だい・マッサージ・シアター）----
  DEMO: {
    phone: ["スマホで 3にんの しゃしんを とったよ！", "がめんを すいすい。ゲームも できるね", "おおきな がめんで どうがも きれい"],
    camera: ["カメラを のぞくと まちが おおきく みえる！", "パシャッ！ いい しゃしんが とれたよ", "レンズを かえると ちがう けしき"],
    music: ["ヘッドホンから ぽかぽかの きょく♪", "いい おと〜！", "ずんずん ひびく！"],
    pc: ["パソコンで おえかき したよ", "キーボード カタカタ", "ゲームが うごいた！"],
    game: ["3にんで ゲーム たいかい！", "もう 1かい！", "ジャンプで ゴール！"],
  },
  async interact(sc, f) {
    if (f.action === "demo") {
      sc.busy = true;
      try {
        const list = this.DEMO[f.demo] || this.DEMO.phone, n = (this.demoN = (this.demoN || 0) + 1);
        if (f.demo === "music" && typeof Sound !== "undefined" && Sound.ctx) [523, 659, 784, 1047, 784, 659].forEach((hz, i) => Sound.tone(Sound.seGain, { f: hz, t: i * 0.18, dur: 0.16, type: "triangle", vol: 0.07 }));
        else Sound.se("pop");
        await UI.say(Save.d.order.map((id, i) => ({ who: id, emo: "happy", text: list[(n + i) % list.length] })).slice(0, 2));
      } finally { sc.busy = false; }
      return true;
    }
    if (f.action === "massage") {
      sc.busy = true;
      try {
        this.massageT = G.t; sc.happyFace = true; Sound.se("tap");
        for (const id of Save.d.order) Save.care(id, { mood: 2 });
        Save.write();
        await UI.say(Save.d.order.map((id) => ({ who: id, emo: "happy", text: id === "goji" ? "ガゥ〜… もみ もみ きもちいい…" : id === "gachan" ? "ピヨ〜 かたが ぽかぽか♪" : "わふ〜 ねむく なっちゃう…" })));
      } finally { sc.busy = false; sc.happyFace = false; }
      return true;
    }
    if (f.action === "theater") {
      sc.busy = true;
      try { Sound.se("pop"); await UI.say([{ name: "シアター", text: "おおきな がめんで「" + KadenItems.CH[Math.floor(G.t / 12) % 4] + "」を ながして いるよ。\nソファで ゆっくり みていってね。" }]); }
      finally { sc.busy = false; }
      return true;
    }
    if (f.action === "watch") { sc.busy = true; try { await UI.say([{ name: f.label, text: f.text }]); } finally { sc.busy = false; } return true; }
    return false;
  },
  tick(sc, dt) {},
  // PokaDebug: いまの ようす（階・うりば・だいの しなもの・エスカレーター）
  state(sc) {
    const r = sc && sc.room; if (!r || sc.id !== "electronics") return null;
    return { floor: sc.floor, title: r.title, zones: r.zones.map((z) => z.label), stands: r.fixtures.filter((f) => f.action === "buy").map((f) => ({ item: f.item, label: f.label, x: f.x, y: f.y })), demos: r.fixtures.filter((f) => f.action === "demo").map((f) => f.demo), escalators: r.fixtures.filter((f) => f.kind === "escalator").map((f) => f.label), ready: !!sc.isoReady };
  },
  install() {
    const old = VenueHalls.defs.electronics;
    VenueHalls.defs.electronics = { name: "ネリカス でんき", iso: true, art: KadenHallArt, guide: MallGuide, bgm: "shop_kaden", start: 1, floors: { 1: this.floor1(), 2: this.floor2(), 3: this.floor3(), 10: this.floor10() }, before: old ? Object.keys(old.floors) : [] };
    if (BUY_SHOPS.ike_electronics) BUY_SHOPS.ike_electronics.name = "ネリカス でんき";
  },
};

// 店内 BGM（この ゲームの ために つくった きょく。あかるい 4/4・1トークン = 8分音符）
SONGS.shop_kaden = {
  title: "ネリカス でんきの うた", bpm: 128, key: "C", modern: true, groove: "classic", swing: 0,
  tracks: [
    { instrument: "mallet", vol: 0.16, gate: 0.75, pan: 0.1, notes: "C5 . E5 . G5 . E5 . | F5 . A5 . G5 . _ E5 | D5 . F5 . E5 . C5 . | D5 . G4 . C5 . _ _ | E5 E5 F5 G5 A5 . G5 . | F5 F5 E5 D5 E5 . C5 . | D5 . E5 F5 G5 . E5 C5 | D5 . B4 . C5 . _ _" },
    { instrument: "piano", vol: 0.09, gate: 0.6, pan: -0.12, notes: "_ C4+E4+G4 _ C4+E4+G4 _ C4+E4+G4 _ C4+E4+G4 | _ F4+A4+C5 _ F4+A4+C5 _ E4+G4+C5 _ E4+G4+C5 | _ D4+F4+A4 _ D4+F4+A4 _ C4+E4+G4 _ C4+E4+G4 | _ B3+D4+G4 _ B3+D4+G4 _ C4+E4+G4 _ _ | _ C4+E4+A4 _ C4+E4+A4 _ C4+F4+A4 _ C4+E4+G4 | _ D4+F4+A4 _ D4+F4+A4 _ C4+E4+G4 _ C4+E4+G4 | _ B3+D4+G4 _ B3+D4+G4 _ C4+E4+G4 _ C4+E4+G4 | _ B3+D4+G4 _ B3+D4+F4 _ C4+E4+G4 _ _" },
    { instrument: "bass", vol: 0.15, gate: 0.65, pan: 0, notes: "C3 . G2 . C3 . G2 . | F2 . C3 . C3 . G2 . | D3 . A2 . C3 . G2 . | G2 . D3 . C3 . G2 . | A2 . E3 . F2 . C3 . | D3 . A2 . C3 . G2 . | G2 . B2 . C3 . E3 . | G2 . G2 . C3 . _ ." },
    { drum: true, vol: 0.035, notes: "k _ h _ s _ h h" },
  ],
};
KadenHall.install();
