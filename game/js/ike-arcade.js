// Meeときょれじゃ（池袋の ゲームセンター）の 館。サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・絵は ArcadeArt）。
// 1F: 12台の クレーン（ぬいぐるみ コーナー・スウィートランド・コイン プッシャー・トライポッド・リングフック）・フロア あんない・けいひん カウンター・りょうがえき。
// 2F: おかしの フロア。おかし キャッチャー 5台（ふくろ・はこ・リング・スウィートランド・ビッグ おかし）・はしわたし 2台（フィギュア・ざっか）・まんなかの ガチャ コーナー（6だい）・やすむ ところ。けいひんは 日がわり。
// 3F: ぷりくらの フロア。ぷりくら 3台（ゆめかわ・がっこう・おでかけ。はいけいが ちがう）・おめかし コーナー（かがみ）・こういしつ と かしだし いしょう（js/mee-fitting.js）。
// 1F と 2F は ひがしの エスカレーター、2F と 3F は 南西の すみの エスカレーター（サンシャインいけぶと おなじ 絵。うえの 階は ふきぬけ）。フロアマップは 1F・2F・3F の タブ。
// 台を タップすると その まえまで あるいて あそぶ 画面（SCENES.prize）へ。もどると 台の まえに たつ。
const IkeArcade = {
  W: 28, H: 22,
  // エスカレーター（1F の のぼり と 2F の くだり は おなじ ばしょ。2F は e.y+1 から ふきぬけ）
  ESC: { x: 23, y: 4, w: 4, h: 7 },
  // 2F と 3F の エスカレーター（南西の すみ。うえの 階の ゆかの ふちが おくの 台に かからない ところ）
  ESC3: { x: 0, y: 14, w: 4, h: 7 },
  // 3F の ぷりくら 3台（id と なまえは js/purikura.js の Purikura.BOOTHS と おなじ。この ファイルは purikura.js より まえに よむので ここにも もつ。tools/check-purikura.mjs が そろって いるか しらべる）
  BOOTHS: [{ id: "yume", name: "ゆめかわ" }, { id: "school", name: "がっこう" }, { id: "odekake", name: "おでかけ" }],
  // クレーンの 台（x y は 奥の かど・dir: 'y' は まえが +y・'x' は まえが +x）。spots: しらべる マス・back: もどる マス
  crane(fixtures, i, x, y, dir) {
    const kind = ArcadeArt.specOf(i), wide = kind === "big" || kind === "sweet" || kind === "pusher" || kind === "bridge" ? 3 : 2, w = dir === "x" ? 2 : wide, h = dir === "x" ? wide : 2, P = ArcadeArt.SPEC[kind], m = PrizeArcade.machines[i];
    const spot = dir === "x" ? [x + w, y + Math.floor(h / 2)] : [x + Math.floor(w / 2), y + h];
    fixtures.push({ kind: "crane", machine: i, x, y, w, h, dir, height: P.base + P.GH + P.HH, label: m.label, action: "crane", spots: [spot], back: dir === "x" ? [spot[0] + 2, spot[1]] : [spot[0] + 1, spot[1] + 1] });
  },
  floor1() {
    const W = this.W, H = this.H, rows = Array.from({ length: H }, () => Array(W).fill("."));
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    // とおりみち（あかるい ゆか）・入口の マット・カウンターの うちがわ
    paint("w", 1, 2, 27, 3); paint("w", 2, 2, 3, 20); paint("w", 2, 11, 27, 13); paint("w", 23, 11, 27, 20); paint("w", 12, 2, 13, 13);
    paint("m", 23, 19, 26, 20); paint("#", 18, 15, 23, 16);
    const fixtures = [], crane = (i, x, y, dir) => this.crane(fixtures, i, x, y, dir);
    // ぬいぐるみ コーナー（北の かべ）: ちいさな ぬいぐるみ 3台・おおきな ぬいぐるみ 2台
    crane(0, 1, 0, "y"); crane(8, 3, 0, "y"); crane(9, 5, 0, "y"); crane(1, 7, 0, "y"); crane(10, 14, 0, "y");
    // リングフック（西の かべ）
    crane(6, 0, 4, "x"); crane(11, 0, 6, "x"); crane(7, 0, 8, "x");
    // スウィートランド・コイン プッシャー と トライポッド（まんなかの 島。うしろに ひくい しきり）
    crane(2, 5, 8, "y"); crane(3, 8, 8, "y"); crane(4, 15, 8, "y"); crane(5, 18, 8, "y");
    fixtures.push({ kind: "divider", x: 5, y: 7, w: 6, h: 1, height: 45 }, { kind: "divider", x: 15, y: 7, w: 5, h: 1, height: 45 });
    // フロア あんない（北の かべ。ぷりくらは 3F・ガチャは 2F の まんなかの ガチャ コーナー）
    fixtures.push({ kind: "directory", x: 10, y: 0, w: 3, h: 1, dir: "y", height: 176, label: "フロア あんない", action: "info", text: "Meeときょれじゃ の あんない\n3F ぷりくら・おめかし コーナー\n2F おかし・はしわたし・ガチャ\n1F ぬいぐるみ・コイン プッシャー\n3F へは 2F の すみの エスカレーターで のぼってね。", spots: [[11, 1], [10, 1], [12, 1]] });
    // りょうがえき・のみもの（北の かべの ひがしの はし）。x 18〜23 は エスカレーターの うえの 2F の ゆかに かくれるので なにも おかない（tools/check-ikebukuro.mjs）
    fixtures.push({ kind: "changer", x: 25, y: 0, w: 1, h: 1, dir: "y", height: 154, label: "りょうがえき", action: "info", text: "この おみせは、もって いる コインで そのまま あそべるよ。1かい 100コイン。", spots: [[25, 1]] });
    fixtures.push({ kind: "drinks", x: 26, y: 0, w: 1, h: 1, dir: "y", height: 156, label: "のみもの", action: "info", text: "つめたい のみもの。ゲームの あいまに ひとやすみ しよう。", spots: [[26, 1]] });
    // けいひん カウンター（てんいん・うしろに 景品の たな）
    fixtures.push({ kind: "toyshelf", x: 18, y: 14, w: 6, h: 1, height: 150, shop: "toys" });
    fixtures.push({ kind: "counter", x: 18, y: 17, w: 6, h: 1, dir: "y", height: 108, label: "けいひん カウンター", action: "counter", spots: [[20, 18], [21, 18]] });
    fixtures.push({ kind: "npc", sp: "cat", ci: 2, x: 20, y: 16, w: 1, h: 1, dir: "down", emo: "happy" });
    // やすむ ところ（西の かべ）・ベンチ・うえきばち・はしら
    fixtures.push({ kind: "asofa", x: 0, y: 14, w: 1, h: 3, height: 52, label: "ソファ", action: "sit", text: "ふかふかの ソファ。ひとやすみ しよう。", spots: [[1, 15]] });
    fixtures.push({ kind: "bench", x: 7, y: 18, w: 3, h: 1, height: 46, label: "ベンチ", action: "sit", text: "ベンチで ひとやすみ。", spots: [[8, 19]] });
    for (const [x, y] of [[6, 18], [10, 18], [22, 13]]) fixtures.push({ kind: "planter", x, y, w: 1, h: 1, height: 70 });
    for (const [x, y] of [[4, 12], [21, 12]]) fixtures.push({ kind: "apillar", x, y, w: 1, h: 1, height: 330 });
    // 町の人（あそんで いる おきゃくさん）
    fixtures.push({ kind: "npc", sp: "rabbit", ci: 1, x: 15, y: 3, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "ビッグ ぬいぐるみは まいにち ちがう どうぶつ なんだって！ きょうは なにかなあ。2本アームは ねらいが だいじ！", spots: [[16, 3]] });
    fixtures.push({ kind: "npc", sp: "sheep", ci: 0, x: 11, y: 11, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "コイン プッシャー、チャンスの わを ねらって いれると スロットが まわるよ！", spots: [[10, 11]] });
    fixtures.push({ kind: "npc", sp: "fox", ci: 1, x: 22, y: 11, w: 1, h: 1, dir: "right", emo: "happy", label: "おきゃくさん", action: "info", text: "ガチャは 2F の まんなかの ガチャ コーナーに うつったんだって。この エスカレーターで いこう！", spots: [[21, 11]] });
    // エスカレーター（2F の おかしの フロアへ）と うえの 階の ゆかの ふち・つりさげの あんない
    const e = this.ESC;
    fixtures.push({ kind: "escalator", pair: true, x: e.x, y: e.y, w: e.w, h: e.h, rise: 176, height: 200, label: "2Fへ のぼる", action: "floor", to: 2, spawn: [e.x + 1, e.y - 1] });
    fixtures.push({ kind: "slab", x: e.x - 0.3, y: e.y - 0.4, w: e.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    fixtures.push({ kind: "hangsign", x: e.x, y: e.y + e.h, w: e.w, h: 1, z: 232, text: "2F おかし", col: "#E0668F", over: true, walk: true, fadeOver: true });
    // 入口（マットと でぐちの かんばん。手前の ふちで そとへ）
    fixtures.push({ kind: "exitMat", x: 23, y: 21, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[24, 20], [25, 20]] });
    fixtures.push({ kind: "exitsign", x: 27, y: 19, w: 1, h: 1, height: 150, label: "でぐち", action: "leave", spots: [[26, 19]] });
    return {
      id: "arcade1", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 330, scale: 0.5, spawn: [25, 19], crowd: 3, logo: [15.5, 16.5], exit: [23, 19, 27, 21], bgm: "arcade_hall", short: "ぬいぐるみ", elevatorSpawn: [e.x + 3, e.y + e.h],
      title: "Meeときょれじゃ", fixtures,
      // フロアマップ（MallGuide）の コーナー
      zones: [
        { x: 1, y: 0, w: 9, h: 3, shop: "arcPlush", label: "ぬいぐるみ コーナー" }, { x: 10, y: 0, w: 3, h: 3, shop: "arcInfo", label: "フロア あんない", map: "あんない" }, { x: 14, y: 0, w: 3, h: 3, shop: "arcBear", label: "ビッグ ぬいぐるみ", map: "ビッグ ぬいぐるみ" },
        { x: 0, y: 4, w: 4, h: 6, shop: "arcRing", label: "リングフック" }, { x: 5, y: 7, w: 3, h: 4, shop: "arcSweet", label: "スウィートランド", map: "スウィート ランド" }, { x: 8, y: 7, w: 3, h: 4, shop: "arcPusher", label: "コイン プッシャー", map: "コイン プッシャー" },
        { x: 15, y: 7, w: 5, h: 4, shop: "arcTripod", label: "トライポッド" }, { x: 18, y: 14, w: 6, h: 5, shop: "arcCounter", label: "けいひん カウンター" }, { x: 0, y: 14, w: 2, h: 3, shop: "arcRest", label: "ソファ" },
      ],
      walls: {
        north: [{ kind: "neon", from: 0.5, to: 8, z: 300, size: 30, text: "ぬいぐるみ", col: "#7FD3F0", stars: true }, { kind: "neon", from: 14, to: 27.5, z: 300, size: 36, text: "Meeときょれじゃ", col: "#FF8FB8", stars: true }],
        west: [{ kind: "neon", from: 3.5, to: 11, z: 300, size: 30, text: "リングフック", col: "#FFE07A" }, { kind: "poster", from: 10.6, to: 13.8, z0: 176, z1: 318, col: "#FFE9A8", coin: true, lines: ["コインの けいひん", "1にち 600 まで"] }, { kind: "poster", from: 14.2, to: 18, z0: 100, z1: 300, col: "#CDE8F8", prize: "ike_chibi_goji_1", lines: ["しんけいひん", "にゅうか！"] }, { kind: "sign", from: 18.4, to: 21.6, z: 250, text: "スタッフ", col: "#C9B6EE" }],
      },
    };
  },
  // 2F（おかしの フロア）。北の かべに おかし キャッチャー・西の かべに スウィートランド・ひがしに エスカレーター（くだり・ふきぬけ）
  floor2() {
    const W = this.W, H = this.H, rows = Array.from({ length: H }, () => Array(W).fill(".")), e = this.ESC;
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    // とおりみち（エスカレーターから おかし コーナー・やすむ ところへ）と ガチャ コーナーの ゆか（'g'）
    paint("w", 1, 2, 27, 3); paint("w", 2, 2, 3, 13); paint("w", 2, 11, 27, 13); paint("w", 12, 2, 13, 13); paint("g", 8, 5, 17, 8);
    // 3F への エスカレーターの のりばへ（南西の すみ）
    paint("w", 4, 13, 5, 21); paint("w", 0, 21, 5, 21);
    // ふきぬけ（'o'）
    for (let y = e.y + 1; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) rows[y][x] = "o";
    const fixtures = [], crane = (i, x, y, dir) => this.crane(fixtures, i, x, y, dir);
    // おかし キャッチャー（北の かべ）: ふくろ・はこ・ビッグ おかし・リング
    crane(12, 1, 0, "y"); crane(13, 3, 0, "y"); crane(16, 5, 0, "y"); crane(14, 8, 0, "y");
    // スウィートランド おかし（西の かべ）
    crane(15, 0, 4, "x");
    // はしわたし（北の かべの まんなか）: フィギュア・ざっか
    crane(17, 15, 0, "y"); crane(18, 18, 0, "y");
    // ガチャ コーナー（まんなか。js/gacha.js の 6シリーズ。variant = シリーズの ばんごう）: まんなかの とおりみちの りょうがわに 3だいずつ。
    // うしろに しきりと かんばん（つりさげの かんばんは おくの 台に かさなるので、台の うしろに たてる）
    [9, 10, 11, 14, 15, 16].forEach((x, v) => fixtures.push({ kind: "gacha", x, y: 6, w: 1, h: 1, dir: "y", variant: v, series: v, height: 112, label: v === 0 ? "カプセルトイ" : "", action: "gacha", spots: [[x, 7]] }));
    fixtures.push({ kind: "gachaboard", x: 9, y: 5, w: 3, h: 1, dir: "y", height: 170, variant: 0 }, { kind: "gachaboard", x: 14, y: 5, w: 3, h: 1, dir: "y", height: 170, variant: 1 });
    fixtures.push({ kind: "capbin", x: 17, y: 6, w: 1, h: 1, dir: "y", height: 78, label: "カプセル かいしゅう", action: "info", text: "あけた カプセルは ここに いれてね。きれいに して また つかうよ。", spots: [[17, 7]] });
    // エスカレーター（1F へ くだる）
    fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e.x, y: e.y, w: e.w, h: e.h, rise: 210, height: 40, label: "1Fへ おりる", action: "floor", to: 1, spawn: [e.x + 3, e.y + e.h] });
    // エスカレーター（3F の ぷりくらへ のぼる。南西の すみ）と うえの 階の ゆかの ふち・つりさげの あんない
    const e3 = this.ESC3;
    fixtures.push({ kind: "escalator", pair: true, x: e3.x, y: e3.y, w: e3.w, h: e3.h, rise: 176, height: 200, label: "3Fへ のぼる", action: "floor", to: 3, spawn: [e3.x + 1, e3.y - 1] });
    fixtures.push({ kind: "slab", x: e3.x, y: e3.y - 0.4, w: e3.w + 0.3, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    fixtures.push({ kind: "hangsign", x: e3.x, y: e3.y + e3.h, w: e3.w, h: 1, z: 232, text: "3F ぷりくら", col: "#B07CD8", over: true, walk: true, fadeOver: true });
    // のみもの・りょうがえき（北の かべの ひがし）
    fixtures.push({ kind: "changer", x: 25, y: 0, w: 1, h: 1, dir: "y", height: 154, label: "りょうがえき", action: "info", text: "この おみせは、もって いる コインで そのまま あそべるよ。1かい 100コイン。", spots: [[25, 1]] });
    fixtures.push({ kind: "drinks", x: 26, y: 0, w: 1, h: 1, dir: "y", height: 156, label: "のみもの", action: "info", text: "おかしの あとは つめたい のみもので ひとやすみ。", spots: [[26, 1]] });
    // やすむ ところ（南）: ベンチ・うえきばち。はしらの 1本は 1F より てまえ（1F と おなじ (21,12) だと ガチャ コーナーの 台を かくす）
    for (const [x, y] of [[7, 18], [16, 18]]) fixtures.push({ kind: "bench", x, y, w: 3, h: 1, height: 46, label: "ベンチ", action: "sit", text: "ベンチで ひとやすみ。", spots: [[x + 1, y + 1]] });
    for (const [x, y] of [[6, 18], [10, 18], [15, 18], [19, 18], [22, 13]]) fixtures.push({ kind: "planter", x, y, w: 1, h: 1, height: 70 });
    for (const [x, y] of [[4, 12], [24, 16]]) fixtures.push({ kind: "apillar", x, y, w: 1, h: 1, height: 330 });
    // 町の人（おかしを ねらう おきゃくさん）
    fixtures.push({ kind: "npc", sp: "pig", ci: 1, x: 7, y: 3, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "おかしの けいひんは まいにち かわるんだって！ きょうは なにかな？", spots: [[8, 3]] });
    fixtures.push({ kind: "npc", sp: "hamster", ci: 0, x: 3, y: 9, w: 1, h: 1, dir: "left", emo: "happy", label: "おきゃくさん", action: "info", text: "スウィートランドは ショベルで すくって、ステージに おとすと おちて くるよ。", spots: [[3, 10]] });
    fixtures.push({ kind: "npc", sp: "fox", ci: 1, x: 8, y: 7, w: 1, h: 1, dir: "right", emo: "normal", label: "おきゃくさん", action: "info", text: "レアの ユニコーン カチューシャ、でないかなあ。どの 台も 4しゅの うち 1つが レアなんだって。", spots: [[8, 8]] });
    fixtures.push({ kind: "npc", sp: "rabbit", ci: 2, x: 21, y: 3, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "はしわたしは はこの まんなかじゃ なくて、はしを ねらうと ずれるよ。ななめに なったら、うえに ういた はしを ねらって みて！", spots: [[21, 2]] });
    // つりさげの あんない（エスカレーターの のりばの うえ）
    fixtures.push({ kind: "hangsign", x: e.x, y: e.y - 1, w: e.w, h: 1, z: 232, text: "1F ぬいぐるみ", col: "#5A8FB4", over: true, walk: true, fadeOver: true });
    return {
      id: "arcade2", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 330, scale: 0.5, spawn: [e.x + 1, e.y - 1], elevatorSpawn: [e.x + 1, e.y - 1], crowd: 3, carpet: "candy", bgm: "arcade_hall", short: "おかし",
      title: "Meeときょれじゃ 2F", fixtures, holes: [{ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 }],
      zones: [
        { x: 1, y: 0, w: 9, h: 3, shop: "arcSnack", label: "おかし キャッチャー" }, { x: 0, y: 4, w: 3, h: 3, shop: "arcSnackSweet", label: "スウィートランド", map: "スウィート ランド" },
        { x: 15, y: 0, w: 6, h: 3, shop: "arcBridge", label: "はしわたし" }, { x: 8, y: 5, w: 10, h: 4, shop: "arcGacha", label: "ガチャ コーナー" },
      ],
      walls: {
        north: [{ kind: "neon", from: 0.5, to: 10, z: 300, size: 34, text: "おかし", col: "#FF8FB8", stars: true }, { kind: "poster", from: 11, to: 14, z0: 150, z1: 300, col: "#FFE9A8", lines: ["けいひんは", "まいにち かわる"] }, { kind: "neon", from: 14.6, to: 21.4, z: 300, size: 30, text: "はしわたし", col: "#FFE68A", stars: true }, { kind: "neon", from: 22.6, to: 27.4, z: 300, size: 26, text: "Mee 2F", col: "#9FD3F0" }],
        west: [{ kind: "neon", from: 3.5, to: 7.5, z: 300, size: 24, text: "スウィート", col: "#9ED3C6" }, { kind: "poster", from: 8, to: 11.5, z0: 120, z1: 300, col: "#FBD3E0", prize: null, snack: "ike_snack_chips", lines: ["ビッグ", "おかし"] }, { kind: "neon", from: 14.2, to: 21.6, z: 300, size: 26, text: "3F ぷりくら", col: "#D6A6F2", stars: true }],
      },
    };
  },
  // 3F（ぷりくらの フロア）。北の かべに ぷりくら 3台・ひがしに おめかし コーナー（かがみ）・西の かべに こういしつ・南西に 2F へ くだる エスカレーター（ふきぬけ）
  floor3() {
    const W = this.W, H = this.H, rows = Array.from({ length: H }, () => Array(W).fill(".")), e = this.ESC3;
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    // とおりみち（エスカレーターの おりばから ぷりくら・おめかし コーナーへ）
    paint("w", 0, 3, 27, 4); paint("w", 0, 11, 27, 13); paint("w", 12, 3, 13, 13); paint("w", 4, 4, 5, 13);
    // ふきぬけ（'o'。2F から のぼって くる エスカレーター）
    for (let y = e.y + 1; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) rows[y][x] = "o";
    const fixtures = [];
    // ぷりくら 3台（北の かべ。variant = ブースの ばんごう → this.BOOTHS）
    this.BOOTHS.forEach((b, v) => { const x = 1 + v * 6; fixtures.push({ kind: "photobooth", x, y: 0, w: 4, h: 3, dir: "y", height: 240, variant: v, booth: b.id, label: b.name + " ぷりくら", action: "photo", spots: [[x + 2, 3]] }); });
    // おめかし コーナー（北の かべの ひがし: かがみの ならぶ カウンターと いす）
    fixtures.push({ kind: "vanity", x: 20, y: 0, w: 5, h: 1, dir: "y", height: 168, label: "おめかし コーナー", action: "info", text: "かがみの まえで まえがみを なおそう♪ ぷりくらの まえに おめかし！", spots: [[22, 1]] });
    // こういしつ（西の かべ。カーテンの こしつ 3つ）と かしだし いしょうの ラック: しらべると きがえの 画面（じぶんの ふく ＋ かしだし 6しゅ）
    fixtures.push({ kind: "fitting", x: 0, y: 5, w: 2, h: 6, dir: "x", height: 244, label: "こういしつ", action: "fitting", spots: [[2, 8], [2, 6], [2, 10]] });
    fixtures.push({ kind: "costumerack", x: 6, y: 8, w: 3, h: 1, dir: "y", height: 190, label: "かしだし いしょう", action: "fitting", spots: [[7, 9], [6, 9], [8, 9]] });
    // エスカレーター（2F へ くだる）と つりさげの あんない
    fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e.x, y: e.y, w: e.w, h: e.h, rise: 210, height: 40, label: "2Fへ おりる", action: "floor", to: 2, spawn: [e.x + 3, e.y + e.h] });
    fixtures.push({ kind: "hangsign", x: e.x, y: e.y - 1, w: e.w, h: 1, z: 232, text: "2F おかし・ガチャ", col: "#E0668F", over: true, walk: true, fadeOver: true });
    // やすむ ところ・はしら・うえきばち
    for (const [x, y] of [[8, 18], [17, 18]]) fixtures.push({ kind: "bench", x, y, w: 3, h: 1, height: 46, label: "ベンチ", action: "sit", text: "とった ぷりくらを すまほで みせあおう。", spots: [[x + 1, y + 1]] });
    for (const [x, y] of [[7, 18], [11, 18], [16, 18], [20, 18]]) fixtures.push({ kind: "planter", x, y, w: 1, h: 1, height: 70 });
    // はしら（ひがし だけ。にしの (4,12) は こういしつの カーテンを かくすので おかない）
    for (const [x, y] of [[24, 16]]) fixtures.push({ kind: "apillar", x, y, w: 1, h: 1, height: 330 });
    // 町の人（ぷりくらを とりに きた おきゃくさん）
    fixtures.push({ kind: "npc", sp: "rabbit", ci: 0, x: 6, y: 4, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "ぷりくらは 3台とも はいけいが ちがうんだって！ きょうは がっこうに しようかな。", spots: [[7, 4]] });
    fixtures.push({ kind: "npc", sp: "cat", ci: 1, x: 21, y: 2, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "まえがみ よし！ リボンも よし！ さあ、とりに いこう。", spots: [[21, 3]] });
    fixtures.push({ kind: "npc", sp: "sheep", ci: 2, x: 15, y: 12, w: 1, h: 1, dir: "left", emo: "happy", label: "おきゃくさん", action: "info", text: "とった しゃしんは すまほの「しゃしん」アプリで みられるよ。", spots: [[14, 12]] });
    return {
      id: "arcade3", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 330, scale: 0.5, spawn: [e.x + 1, e.y - 1], elevatorSpawn: [e.x + 1, e.y - 1], crowd: 3, carpet: "puri", bgm: "arcade_hall", short: "ぷりくら",
      title: "Meeときょれじゃ 3F", fixtures, holes: [{ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 }],
      zones: [
        ...this.BOOTHS.map((b, v) => ({ x: 1 + v * 6, y: 0, w: 4, h: 4, shop: "arcPhoto" + v, label: b.name + " ぷりくら", map: b.name })),
        { x: 20, y: 0, w: 5, h: 4, shop: "arcVanity", label: "おめかし コーナー", map: "おめかし" },
        { x: 0, y: 5, w: 3, h: 6, shop: "arcFitting", label: "こういしつ" }, { x: 6, y: 8, w: 3, h: 2, shop: "arcRental", label: "かしだし いしょう", map: "かしだし" },
      ],
      walls: {
        north: [{ kind: "neon", from: 0.5, to: 17.5, z: 300, size: 40, text: "ぷりくら", col: "#FF8FB8", stars: true }, { kind: "neon", from: 19.2, to: 25.8, z: 300, size: 28, text: "おめかし", col: "#FFD2E6" }, { kind: "neon", from: 26, to: 27.6, z: 300, size: 22, text: "3F", col: "#9FD3F0" }],
        west: [{ kind: "neon", from: 5, to: 11, z: 310, size: 26, text: "きがえ", col: "#D6A6F2", stars: true }, { kind: "neon", from: 14.2, to: 21.6, z: 300, size: 24, text: "2F おかし", col: "#FF8FB8" }],
      },
    };
  },
  // カウンターの こうかん（まえの 8台の ころの けいひん）。ねだんは カウンターで きめる
  EXCHANGE: { furn: [["ike_prize_0", 3000], ["ike_prize_2", 3000]], bag: [["prize_uma", 150], ["prize_pie", 150], ["prize_cookie", 150]] },
  // 台の ある 階（1F・2F。3F は ぷりくら）
  floorOf(machine) { const fl = VenueHalls.defs.arcade && VenueHalls.defs.arcade.floors; if (!fl) return 1; return +(Object.keys(fl).find((k) => fl[k].fixtures.some((f) => f.machine === machine)) || 1); },
  install() {
    const def = VenueHalls.defs.arcade; if (!def) return;
    Object.assign(def, { iso: true, art: ArcadeArt, guide: MallGuide, bgm: "arcade_hall", floors: { 1: this.floor1(), 2: this.floor2(), 3: this.floor3() } });
    // 台を いれかえる まえの とちゅうの 1かいは、店に はいった ときに 100コインを かえして しらせる
    def.arrive = () => { const a = PrizeArcade.norm(); if (a.refunded) { UI.toast("台が あたらしく なったので、とちゅうだった 1かいの " + PrizeArcade.PRICE + "コインを かえしたよ"); a.refunded = 0; Save.write(); } };
    // フロアマップの コーナーの いろ
    Object.assign(MallArt.SHOP, {
      arcPlush: { name: "ぬいぐるみ", c: ["#CDE8F8", "#A9D3EE", "#7FB8E0"] }, arcInfo: { name: "あんない", c: ["#FFF3C4", "#FFE07A", "#E0B640"] },
      arcPhoto0: { name: "ゆめかわ", c: ["#F8C8DA", "#F29BB8", "#D9789B"] }, arcPhoto1: { name: "がっこう", c: ["#D3DEF2", "#9FB3DE", "#6F86C2"] }, arcPhoto2: { name: "おでかけ", c: ["#D2EEF7", "#9FD8EC", "#5FB3D3"] }, arcVanity: { name: "おめかし", c: ["#FCE3EE", "#F6C2D8", "#E59BBB"] }, arcFitting: { name: "こういしつ", c: ["#F3E9FB", "#E1CDF3", "#B996DC"] }, arcRental: { name: "かしだし", c: ["#EAF2FB", "#C9DCF2", "#8FB0DA"] }, arcBear: { name: "ビッグ", c: ["#F2D3B0", "#E1B387", "#C98E5C"] },
      arcGacha: { name: "ガチャ", c: ["#D6EFD8", "#B6DFBA", "#86C08C"] }, arcRing: { name: "リングフック", c: ["#FFF0B8", "#F9D56E", "#E0B640"] }, arcSweet: { name: "スウィートランド", c: ["#FBD3E0", "#F2A7C0", "#E58BAA"] }, arcPusher: { name: "コイン プッシャー", c: ["#FFF3C4", "#F2C84B", "#D6A231"] },
      arcTripod: { name: "トライポッド", c: ["#FFE0C2", "#F7B98A", "#E58A3A"] }, arcCounter: { name: "けいひん カウンター", c: ["#E6DCF5", "#C9B6EE", "#9B7BD0"] }, arcRest: { name: "ソファ", c: ["#E3EFD6", "#C3DDAA", "#9CC47E"] },
      arcSnack: { name: "おかし キャッチャー", c: ["#FFE2C4", "#FFB86B", "#F2944A"] }, arcSnackSweet: { name: "スウィートランド おかし", c: ["#D4F2E8", "#8ED1C0", "#5DB29B"] },
      arcBridge: { name: "はしわたし", c: ["#DDE3FA", "#9FAEE8", "#6F7FD0"] },
    });
    // 館の BGM（arcade_hall）と けいひん カウンター（shop_ike_arcade）は js/arcade-jpop.js の J-POP 5きょくの 再生リスト
    const ex = this.EXCHANGE, price = Object.fromEntries([...ex.furn, ...ex.bag]);
    BUY_SHOPS.ike_arcade = { name: "けいひん カウンター", keeper: { sp: "cat" }, keeperName: "てんいん", hello: ["まえの けいひんも コインで こうかん できるよ。"], tabs: [["furn", "かざり"], ["bag", "おかし"]], items: (tab) => (ex[tab] || []).map(([id]) => ({ ...VenueHalls.item(id), price: price[id] })) };
    const kind0 = ShopUI.kindOf;
    ShopUI.kindOf = function (shopId, tab) { return shopId === "ike_arcade" ? (tab === "bag" ? "bag" : "furn") : kind0.call(this, shopId, tab); };
  },
};
IkeArcade.install();
