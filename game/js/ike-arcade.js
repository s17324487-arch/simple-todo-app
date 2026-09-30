// Meeときょれじゃ（池袋の ゲームセンター）の 館。サンシャインいけぶ と おなじ 斜め上の 館（IsoVenueScene・絵は ArcadeArt）。
// 12台の クレーン（ぬいぐるみ コーナー・スウィートランド・コイン プッシャー・トライポッド・リングフック）・ガチャ・ぷりくら・けいひん カウンター・りょうがえき。
// 台を タップすると その まえまで あるいて あそぶ 画面（SCENES.prize）へ。もどると 台の まえに たつ。
const IkeArcade = {
  W: 28, H: 22,
  floor1() {
    const W = this.W, H = this.H, rows = Array.from({ length: H }, () => Array(W).fill("."));
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    // とおりみち（あかるい ゆか）・入口の マット・カウンターの うちがわ
    paint("w", 1, 2, 27, 3); paint("w", 2, 2, 3, 20); paint("w", 2, 11, 27, 13); paint("w", 23, 11, 27, 20); paint("w", 12, 2, 13, 13);
    paint("m", 23, 19, 26, 20); paint("#", 18, 15, 23, 16);
    const fixtures = [];
    // クレーン: まえの ほうの マスで しらべる（spots）・もどる ときは その すこし まえ（back）
    const crane = (i, x, y, dir) => {
      const kind = ArcadeArt.specOf(i), wide = kind === "big" || kind === "sweet" || kind === "pusher" ? 3 : 2, w = dir === "x" ? 2 : wide, h = dir === "x" ? wide : 2, P = ArcadeArt.SPEC[kind], m = PrizeArcade.machines[i];
      const spot = dir === "x" ? [x + w, y + Math.floor(h / 2)] : [x + Math.floor(w / 2), y + h];
      fixtures.push({ kind: "crane", machine: i, x, y, w, h, dir, height: P.base + P.GH + P.HH, label: m.label, action: "crane", spots: [spot], back: dir === "x" ? [spot[0] + 2, spot[1]] : [spot[0] + 1, spot[1] + 1] });
    };
    // ぬいぐるみ コーナー（北の かべ）: ちいさな ぬいぐるみ 3台・おおきな ぬいぐるみ 2台
    crane(0, 1, 0, "y"); crane(8, 3, 0, "y"); crane(9, 5, 0, "y"); crane(1, 7, 0, "y"); crane(10, 14, 0, "y");
    // リングフック（西の かべ）
    crane(6, 0, 4, "x"); crane(11, 0, 6, "x"); crane(7, 0, 8, "x");
    // スウィートランド・コイン プッシャー と トライポッド（まんなかの 島。うしろに ひくい しきり）
    crane(2, 5, 8, "y"); crane(3, 8, 8, "y"); crane(4, 15, 8, "y"); crane(5, 18, 8, "y");
    fixtures.push({ kind: "divider", x: 5, y: 7, w: 6, h: 1, height: 45 }, { kind: "divider", x: 15, y: 7, w: 5, h: 1, height: 45 });
    // ぷりくら・ガチャ（北の かべの ひがし）
    fixtures.push({ kind: "photobooth", x: 10, y: 0, w: 4, h: 3, dir: "y", height: 240, label: "ぷりくら", action: "photo", spots: [[12, 3]] });
    for (let v = 0; v < 6; v++) fixtures.push({ kind: "gacha", x: 18 + v, y: 0, w: 1, h: 1, dir: "y", variant: v, height: 112, label: v === 0 ? "カプセルトイ" : "", action: "info", text: "カプセルトイの コーナー。あたらしい カプセルが とどくのを まって いるよ。", spots: [[18 + v, 1]] });
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
    fixtures.push({ kind: "npc", sp: "rabbit", ci: 1, x: 15, y: 3, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "おおきな くまの ぬいぐるみ、ほしいなあ。2本アームは ねらいが だいじ！", spots: [[16, 3]] });
    fixtures.push({ kind: "npc", sp: "sheep", ci: 0, x: 11, y: 11, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "コイン プッシャー、チャンスの わを ねらって いれると スロットが まわるよ！", spots: [[10, 11]] });
    fixtures.push({ kind: "npc", sp: "fox", ci: 1, x: 21, y: 2, w: 1, h: 1, dir: "up", emo: "normal", label: "おきゃくさん", action: "info", text: "つぎの カプセル、まだかなあ。", spots: [[21, 3]] });
    // 入口（マットと でぐちの かんばん。手前の ふちで そとへ）
    fixtures.push({ kind: "exitMat", x: 23, y: 21, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[24, 20], [25, 20]] });
    fixtures.push({ kind: "exitsign", x: 27, y: 19, w: 1, h: 1, height: 150, label: "でぐち", action: "leave", spots: [[26, 19]] });
    return {
      id: "arcade1", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 330, scale: 0.5, spawn: [25, 19], crowd: 3, logo: [15.5, 16.5], exit: [23, 19, 27, 21], bgm: "arcade_hall",
      title: "Meeときょれじゃ", fixtures,
      // フロアマップ（MallGuide）の コーナー
      zones: [
        { x: 1, y: 0, w: 9, h: 3, shop: "arcPlush", label: "ぬいぐるみ コーナー" }, { x: 10, y: 0, w: 4, h: 4, shop: "arcPhoto", label: "ぷりくら" }, { x: 14, y: 0, w: 3, h: 3, shop: "arcBear", label: "くまの ぬいぐるみ", map: "くまの ぬいぐるみ" },
        { x: 18, y: 0, w: 9, h: 2, shop: "arcGacha", label: "カプセルトイ" }, { x: 0, y: 4, w: 4, h: 6, shop: "arcRing", label: "リングフック" }, { x: 5, y: 7, w: 3, h: 4, shop: "arcSweet", label: "スウィートランド", map: "スウィート ランド" }, { x: 8, y: 7, w: 3, h: 4, shop: "arcPusher", label: "コイン プッシャー", map: "コイン プッシャー" },
        { x: 15, y: 7, w: 5, h: 4, shop: "arcTripod", label: "トライポッド" }, { x: 18, y: 14, w: 6, h: 5, shop: "arcCounter", label: "けいひん カウンター" }, { x: 0, y: 14, w: 2, h: 3, shop: "arcRest", label: "ソファ" },
      ],
      walls: {
        north: [{ kind: "neon", from: 0.5, to: 8, z: 300, size: 30, text: "ぬいぐるみ", col: "#7FD3F0", stars: true }, { kind: "neon", from: 14, to: 27.5, z: 300, size: 36, text: "Meeときょれじゃ", col: "#FF8FB8", stars: true }],
        west: [{ kind: "neon", from: 3.5, to: 11, z: 300, size: 30, text: "リングフック", col: "#FFE07A" }, { kind: "poster", from: 10.6, to: 13.8, z0: 176, z1: 318, col: "#FFE9A8", coin: true, lines: ["コインの けいひん", "1にち 600 まで"] }, { kind: "poster", from: 14.2, to: 18, z0: 100, z1: 300, col: "#CDE8F8", prize: "ike_chibi_goji_1", lines: ["しんけいひん", "にゅうか！"] }, { kind: "sign", from: 18.4, to: 21.6, z: 250, text: "スタッフ", col: "#C9B6EE" }],
      },
    };
  },
  // カウンターの こうかん（まえの 8台の ころの けいひん）。ねだんは カウンターで きめる
  EXCHANGE: { furn: [["ike_prize_0", 3000], ["ike_prize_2", 3000]], bag: [["prize_uma", 150], ["prize_pie", 150], ["prize_cookie", 150]] },
  install() {
    const def = VenueHalls.defs.arcade; if (!def) return;
    Object.assign(def, { iso: true, art: ArcadeArt, guide: MallGuide, bgm: "arcade_hall", floors: { 1: this.floor1() } });
    // 台を いれかえる まえの とちゅうの 1かいは、店に はいった ときに 100コインを かえして しらせる
    def.arrive = () => { const a = PrizeArcade.norm(); if (a.refunded) { UI.toast("台が あたらしく なったので、とちゅうだった 1かいの " + PrizeArcade.PRICE + "コインを かえしたよ"); a.refunded = 0; Save.write(); } };
    // フロアマップの コーナーの いろ
    Object.assign(MallArt.SHOP, {
      arcPlush: { name: "ぬいぐるみ", c: ["#CDE8F8", "#A9D3EE", "#7FB8E0"] }, arcPhoto: { name: "ぷりくら", c: ["#F8C8DA", "#F29BB8", "#D9789B"] }, arcBear: { name: "くま", c: ["#F2D3B0", "#E1B387", "#C98E5C"] },
      arcGacha: { name: "カプセルトイ", c: ["#D6EFD8", "#B6DFBA", "#86C08C"] }, arcRing: { name: "リングフック", c: ["#FFF0B8", "#F9D56E", "#E0B640"] }, arcSweet: { name: "スウィートランド", c: ["#FBD3E0", "#F2A7C0", "#E58BAA"] }, arcPusher: { name: "コイン プッシャー", c: ["#FFF3C4", "#F2C84B", "#D6A231"] },
      arcTripod: { name: "トライポッド", c: ["#FFE0C2", "#F7B98A", "#E58A3A"] }, arcCounter: { name: "けいひん カウンター", c: ["#E6DCF5", "#C9B6EE", "#9B7BD0"] }, arcRest: { name: "ソファ", c: ["#E3EFD6", "#C3DDAA", "#9CC47E"] },
    });
    // 館の BGM: トルコ こうしんきょく（モーツァルト・Mutopia #108 の 写し）を ゲームセンターの 音で。カウンター・あそぶ 画面も おなじ 曲
    const src = SONGS.disc_turkish, inst = ["mallet", "pluck", "bass", "pad"];
    SONGS.arcade_hall = { ...src, title: "Meeときょれじゃ（トルコ こうしんきょく）", disc: false, bpm: 196, tracks: src.tracks.map((t, k) => (t.drum ? { ...t, vol: t.vol * 1.3 } : { ...t, instrument: inst[k] || t.instrument })) };
    SONGS.arcade_hall.tracks.push({ drum: true, vol: 0.05, pan: -0.3, notes: "_ _ k _ _ _ k _" });
    SONGS.shop_ike_arcade = SONGS.arcade_hall;
    const ex = this.EXCHANGE, price = Object.fromEntries([...ex.furn, ...ex.bag]);
    BUY_SHOPS.ike_arcade = { name: "けいひん カウンター", keeper: { sp: "cat" }, keeperName: "てんいん", hello: ["まえの けいひんも コインで こうかん できるよ。"], tabs: [["furn", "かざり"], ["bag", "おかし"]], items: (tab) => (ex[tab] || []).map(([id]) => ({ ...VenueHalls.item(id), price: price[id] })) };
    const kind0 = ShopUI.kindOf;
    ShopUI.kindOf = function (shopId, tab) { return shopId === "ike_arcade" ? (tab === "bag" ? "bag" : "furn") : kind0.call(this, shopId, tab); };
  },
};
IkeArcade.install();
