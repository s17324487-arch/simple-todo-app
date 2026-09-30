// サンシャインいけぶ（池袋の 3かいだての モール）を 斜め上から 見る 館に つくりなおす。
// 配置は サンシャインシティの フロアマップを 参考: 奥の かべに そって 店が ならぶ「おおどおり」、まんなかの「ふんすい ひろば」
// （3がいまでの ふきぬけ・ステージ・大きな がめん）、西の かべの エレベーター ホール・トイレ・ロッカー・インフォメーション・いりぐち。
// 館に 入れるのは 池袋の まちの サンシャインいけぶの 入口だけ（js/ikebukuro-town.js の NOT_MALL）。
// うる 品物・食事・マルシェ・パズルは これまでの IkebukuroVenues と おなじ（ID・ねだん・BUY_SHOPS は かえない）。
const IkeMall = {
  // 店を 見やすく する ため 店は はば 10〜14・おくゆき 6〜8 マス（まえは 7×5）。フロアも 45×31 に ひろげた
  W: 45, H: 31,
  // ふんすい（ふきぬけ）の まんなか と はんけい
  AT: { x: 24.5, y: 18.5, r: 5.6 },
  // エスカレーター（のぼり・くだり の 2れつ）。1F→2F は 西がわ、2F→3F は 東がわ
  ESC: { 1: { x: 9, y: 21, w: 4, h: 7 }, 2: { x: 34, y: 21, w: 4, h: 7 } },
  mats: { ".": "stone", p: "plaza", w: "wood", a: "carpetP", g: "carpetG", v: "carpetV", b: "carpetB", m: "mat", t: "tileP", u: "tileV", x: "white", k: "deck" },
  room(floor, title, extra = {}) {
    const W = this.W, H = this.H;
    return { id: "ike" + floor, iso: true, w: W, h: H, wallH: 300, scale: 0.5, title, mall: true, rows: Array.from({ length: H }, () => ".".repeat(W)), mats: this.mats, walls: { north: [], west: [] }, fixtures: [], decals: [], ...extra };
  },
  put(r, x, y, mat) { const key = Object.entries(r.mats).find(([, m]) => m === mat)?.[0] ?? mat; const row = r.rows[y]; r.rows[y] = row.slice(0, x) + key + row.slice(x + 1); },
  fill(r, x0, y0, w, h, mat) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.put(r, x, y, mat); },
  // 店の 入口: かどの はしら・頭の 上の 名前の いた（たかさは MallArt.FRONT。店の 中の マネキンに かからない）
  front(r, id, x0, w, depth, label) {
    const z = MallArt.FRONT;
    r.fixtures.push({ kind: "post", shop: id, x: x0, y: depth - 1, w: 1, h: 1, height: z }, { kind: "post", shop: id, x: x0 + w - 1, y: depth - 1, w: 1, h: 1, height: z });
    r.fixtures.push({ kind: "fascia", shop: id, x: x0, y: depth - 1, w, h: 1, z, height: 36, over: true, walk: true, fadeOver: true, label });
  },
  zone(r, shop, x, y, w, h) { (r.zones ||= []).push({ shop, x, y, w, h, label: MallArt.SHOP[shop].name }); },
  clerk(r, sp, x, y, text, label = "てんいん") { r.fixtures.push({ kind: "npc", sp, x, y, w: 1, h: 1, height: 110, label, action: "info", text }); },
  // 服・家具の 店（おくゆき 8）: 奥の かべ（店の いろ・かんばん・たな）＋ 床 ＋ 品物の 台・レジ・てんいん
  shop(r, id, x0, w) {
    const sh = MallArt.SHOP[id], items = IkebukuroCatalog.groups[id] || [], furn = items.length && FURN_INDEX[items[0]], depth = 8;
    r.walls.north.push({ kind: "shop", shop: id, from: x0, to: x0 + w });
    this.fill(r, x0, 0, w, depth, sh.floor); this.zone(r, id, x0, 0, w, depth);
    const buy = (it, x, y, kind, ww, hh) => r.fixtures.push({ kind, shop: id, item: it, x, y, w: ww, h: hh, low: kind === "stand" && !!furn, height: furn ? 100 : kind === "pedestal" ? 150 : 60, label: VenueHalls.item(it).name, action: "buy", shopId: "ike_" + id, buyKind: FURN_INDEX[it] ? "furn" : ITEM_INDEX[it] ? "wear" : "bag" });
    if (furn) {
      // 家具の ショールーム: おくに 3つ・まえに 3つ（あいだの 通路を とおれる）
      items.forEach((it, i) => buy(it, x0 + 1 + (i % 3) * 4, i < 3 ? 1 : 4, "stand", 3, 2));
      r.fixtures.push({ kind: "register", shop: id, x: x0 + w - 3, y: 0, w: 2, h: 1, height: 70, label: sh.name + "の レジ", action: "shop", shopId: "ike_" + id });
      this.clerk(r, "sheep", x0 + w - 1, 1, "おおきな かぐも おうちに とどけるよ。\nだいを タップして えらんでね。");
    } else {
      // 服の 店: 入口の まえに マネキンの 台 3つ（ウインドウの ように よこに ならぶ）・まんなかと おくに ラック・レジ
      items.forEach((it, i) => buy(it, x0 + 2 + i * 3, 6, ITEM_INDEX[it] ? "pedestal" : "stand", 1, 1));
      r.fixtures.push({ kind: "rack", shop: id, x: x0 + 1, y: 0, w: 3, h: 1, height: 110 }, { kind: "rack", shop: id, x: x0 + 4, y: 0, w: 2, h: 1, height: 110 }, { kind: "rack", shop: id, x: x0 + 2, y: 3, w: 3, h: 1, height: 110 });
      r.fixtures.push({ kind: "register", shop: id, x: x0 + 6, y: 1, w: 2, h: 1, height: 70, label: sh.name + "の レジ", action: "shop", shopId: "ike_" + id });
      this.clerk(r, { hane: "rabbit", animal: "bear", gothic: "cat" }[id] || "cat", x0 + 7, 0, "マネキンの だいを タップすると、その ばで かえるよ。");
    }
    this.front(r, id, x0, w, depth);
  },
  // 食べものの 店（おくゆき 6）: カウンター（メニュー）・てんいん・テーブル 3つ
  food(r, id, x0, w) {
    const sh = MallArt.SHOP[id], menu = IkebukuroCatalog.groups[id], depth = 6;
    r.walls.north.push({ kind: "shop", shop: id, from: x0, to: x0 + w });
    this.fill(r, x0, 0, w, depth, sh.floor); this.zone(r, id, x0, 0, w, depth);
    r.fixtures.push({ kind: "foodcounter", shop: id, x: x0 + 1, y: 1, w: w - 2, h: 1, height: 80, label: sh.name, action: "eat", menu });
    this.clerk(r, { cafe: "cat", crepes: "rabbit", boba: "pig" }[id] || "cat", x0 + Math.floor(w / 2), 0, "カウンターか テーブルで メニューを えらんでね。");
    for (const u of [1, 5, w - 3]) r.fixtures.push({ kind: "table", shop: id, x: x0 + u, y: 3, w: 2, h: 2, height: 60, label: sh.name + "の テーブル", action: "eat", menu });
    this.front(r, id, x0, w, depth);
  },
  // かざりの 店（しらべると ひとこと）
  decor(r, id, x0, w, depth, sp, text) {
    const sh = MallArt.SHOP[id];
    r.walls.north.push({ kind: "shop", shop: id, from: x0, to: x0 + w });
    this.fill(r, x0, 0, w, depth, sh.floor); this.zone(r, id, x0, 0, w, depth);
    const kind = sh.fixture || "shelf";
    for (let i = 0; i + 2 <= w - 2; i += 3) r.fixtures.push({ kind, shop: id, x: x0 + 1 + i, y: 1, w: 2, h: 1, height: kind === "shelf" ? 120 : 70 });
    if (kind !== "shelf") for (let i = 0; i + 2 <= w - 2; i += 4) r.fixtures.push({ kind, shop: id, x: x0 + 2 + i, y: 3, w: 2, h: 1, height: 70 });
    this.clerk(r, sp, x0 + w - 2, depth - 2, text);
    this.front(r, id, x0, w, depth);
  },
  // ふきぬけの あな（'o'）と ふちの ガラスの てすり は MallArt が 描く
  atrium(r) { const a = this.AT; for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) if (Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y) < a.r - 0.15) this.put(r, x, y, "o"); (r.holes ||= []).push({ kind: "ellipse", x: a.x, y: a.y, r: a.r }); },
  escVoid(r, e) { this.fill(r, e.x, e.y + 1, e.w, e.h - 1, "o"); (r.holes ||= []).push({ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 }); },
  westHall(r, floor) {
    // 西の かべ: エレベーター ホール・トイレ・ロッカー（1F は いりぐち）
    r.walls.west.push({ kind: "elevator", from: 9, to: 15, doors: 2, label: "エレベーター" }, { kind: "toilet", from: 16, to: 19, label: "トイレ" });
    r.fixtures.push({ kind: "elevatorCall", x: 0, y: 10, w: 1, h: 4, height: 180, label: "エレベーター", action: "elevator", noFade: true });
    r.fixtures.push({ kind: "toiletDoor", x: 0, y: 16, w: 1, h: 3, height: 150, label: "トイレ", action: "info", text: "トイレは きれいに つかおうね。", noFade: true });
    r.fixtures.push({ kind: "aed", x: 0, y: 15, w: 1, h: 1, height: 130, label: "AED", action: "info", text: "AEDは しんぞうを たすける きかい。\nこまったら おとなの ひとを よんでね。" });
    r.elevatorSpawn = [2, 12];
  },
  floor1() {
    const r = this.room(1, "1F ふんすい ひろば", { wallH: 420, balcony: 2, spawn: [2, 23] });
    // おおどおり の 店（奥の かべ）
    this.shop(r, "hane", 1, 10); this.shop(r, "animal", 11, 10); this.shop(r, "gothic", 21, 10); this.shop(r, "luxury", 31, 14);
    // ふんすい ひろば
    const a = this.AT;
    for (let y = 12; y < 26; y++) for (let x = 17; x < 33; x++) if (Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y) < 6.3) this.put(r, x, y, "plaza");
    r.decals.push({ kind: "rings", x: a.x, y: a.y, rings: [[3.2, "#D2BD98", 3], [4.5, "#D8C4A0", 2], [6.0, "#C9B28C", 3]] });
    r.fixtures.push({ kind: "fountain", x: a.x - 2.5, y: a.y - 2.5, w: 5, h: 5, height: 150, label: "ふんすい ひろば", action: "fountain", text: "3がいまで ふきぬけの ふんすい ひろば。\nみずの おとが きこえるね。" });
    r.walls.north.push({ kind: "screen", from: 19, to: 31, z0: 300, z1: 410 });
    r.fixtures.push({ kind: "stage", x: 21, y: 10, w: 7, h: 2, height: 30, label: "ステージ", action: "stage" });
    for (const [x, y, w, h] of [[19, 15, 1, 2], [30, 15, 1, 2], [19, 22, 1, 2], [30, 22, 1, 2], [23, 25, 3, 1]]) r.fixtures.push({ kind: "bench", x, y, w, h, height: 46, label: "ベンチ", action: "sit" });
    for (const [x, y] of [[18, 13], [31, 13], [18, 25], [31, 25]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    r.fixtures.push({ kind: "pillar", x: 40, y: 22, w: 1, h: 1, height: 300 });
    // エスカレーター（2Fへ）
    const e = this.ESC[1];
    r.fixtures.push({ kind: "escalator", pair: true, x: e.x, y: e.y, w: e.w, h: e.h, rise: 176, height: 200, label: "2Fへ のぼる", action: "floor", to: 2, spawn: [e.x + 1, e.y - 1] });
    r.fixtures.push({ kind: "slab", x: e.x - 0.3, y: e.y - 0.4, w: e.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    // 西の かべ
    this.westHall(r, 1);
    r.walls.west.push({ kind: "poster", from: 1, to: 4, col: "#F3D6A6", lines: ["いけぶ", "ふんすい ショー"] }, { kind: "door", from: 21, to: 26, label: "いりぐち", view: "walkway" });
    this.fill(r, 0, 21, 2, 5, "mat");
    r.fixtures.push({ kind: "info", x: 3, y: 9, w: 2, h: 1, height: 160, label: "インフォメーション", action: "info", text: "ようこそ サンシャインいけぶへ！\n「フロアマップ」で いきたい おみせを さがしてね。" });
    this.clerk(r, "penguin", 3, 8, "エレベーターは 1F・2F・3F に とまるよ。");
    r.fixtures.push({ kind: "guide", x: 5, y: 20, w: 1, h: 1, height: 150, label: "フロアマップ", action: "guide" });
    r.fixtures.push({ kind: "locker", x: 0, y: 19, w: 1, h: 2, height: 150, label: "コインロッカー", action: "info", text: "にもつを あずける ロッカー。\nきょうは からっぽ みたい。" });
    r.fixtures.push({ kind: "vending", x: 0, y: 7, w: 1, h: 1, height: 150, label: "じどうはんばいき", action: "info", text: "つめたい のみものが ならんで いるよ。" });
    r.fixtures.push({ kind: "exitMat", x: 0, y: 21, w: 1, h: 5, height: 170, label: "たてものを でる", action: "leave", noFade: true });
    // ひがしがわ: はなと アイスの キオスク・ベンチ
    r.fixtures.push({ kind: "kiosk", shop: "flower", goods: "flower", x: 37, y: 13, w: 3, h: 2, height: 170, label: "はなの こみち", action: "info", text: "きょうの おすすめは ピンクの はな。\nおうちに かざると きれいだよ。" });
    this.clerk(r, "hamster", 38, 12, "いい においでしょ？ ゆっくり みていってね。");
    r.fixtures.push({ kind: "kiosk", shop: "ice", goods: "ice", x: 37, y: 25, w: 3, h: 2, height: 170, label: "アイスの しろくま", action: "info", text: "つめたい アイスは ふんすいを みながら たべてね。" });
    this.clerk(r, "penguin", 38, 24, "いちご・バニラ・メロン・チョコ。どれに する？");
    for (const [x, y, w, h] of [[34, 19, 2, 1], [42, 17, 1, 2]]) r.fixtures.push({ kind: "bench", x, y, w, h, height: 46, label: "ベンチ", action: "sit" });
    r.fixtures.push({ kind: "planter", x: 42, y: 28, w: 1, h: 1, height: 70 }, { kind: "planter", x: 33, y: 29, w: 1, h: 1, height: 70 });
    // つりさげの あんない
    r.fixtures.push({ kind: "hangsign", x: 1, y: 10, w: 3, h: 1, z: 232, text: "おおどおり", col: "#5A8FB4", over: true, walk: true, fadeOver: true });
    r.fixtures.push({ kind: "hangsign", x: 34, y: 11, w: 3, h: 1, z: 232, text: "ふんすい ひろば", col: "#C98AA6", over: true, walk: true, fadeOver: true });
    r.fixtures.push({ kind: "hangsign", face: "x", x: 3, y: 12, w: 1, h: 3, z: 232, text: "ひろこうじ", col: "#6BAA75", over: true, walk: true, fadeOver: true });
    r.fixtures.push({ kind: "hangsign", face: "x", x: 3, y: 22, w: 1, h: 3, z: 232, text: "えき ほうめん", col: "#5A8FB4", over: true, walk: true, fadeOver: true });
    return r;
  },
  floor2() {
    const r = this.room(2, "2F グルメ", { balcony: 1, spawn: [2, 12] });
    this.food(r, "cafe", 1, 11); this.food(r, "crepes", 12, 11); this.food(r, "boba", 23, 11);
    this.decor(r, "ramen", 34, 11, 6, "dog", "らーめんの スープを ことこと にこんで いるよ。\nいいにおい！");
    this.atrium(r); this.escVoid(r, this.ESC[1]);
    const e1 = this.ESC[1], e2 = this.ESC[2];
    r.fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e1.x, y: e1.y, w: e1.w, h: e1.h, rise: 210, height: 40, label: "1Fへ おりる", action: "floor", to: 1, spawn: [e1.x + 3, e1.y + e1.h] });
    r.fixtures.push({ kind: "escalator", pair: true, x: e2.x, y: e2.y, w: e2.w, h: e2.h, rise: 176, height: 200, label: "3Fへ のぼる", action: "floor", to: 3, spawn: [e2.x + 1, e2.y - 1] });
    r.fixtures.push({ kind: "slab", x: e2.x - 0.3, y: e2.y - 0.4, w: e2.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    this.westHall(r, 2);
    r.walls.west.push({ kind: "window", from: 1, to: 7 }, { kind: "poster", from: 21, to: 25, col: "#CFE3E6", lines: ["2F", "グルメ"] });
    for (const [x, y] of [[4, 28], [42, 28]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    for (const [x, y] of [[2, 23], [5, 26], [37, 13], [41, 13]]) r.fixtures.push({ kind: "table", shop: "cafe", x, y, w: 2, h: 2, height: 60, label: "フードコートの テーブル", action: "sit" });
    return r;
  },
  floor3() {
    const r = this.room(3, "3F マルシェと あそび", { spawn: [2, 12] });
    // いけぶくろ マルシェ（たべものの 台）
    r.walls.north.push({ kind: "shop", shop: "marche", from: 1, to: 14 }); this.fill(r, 1, 0, 13, 7, "wood"); this.zone(r, "marche", 1, 0, 13, 7);
    IkebukuroCatalog.groups.marche.forEach((it, i) => r.fixtures.push({ kind: "crate", shop: "marche", item: it, x: 2 + i * 4, y: 3, w: 2, h: 1, height: 60, label: VenueHalls.item(it).name, action: "buy", shopId: "ike_marche", buyKind: "bag" }));
    this.clerk(r, "pig", 12, 1, "とれたての くだものと やきがしだよ。"); this.front(r, "marche", 1, 13, 7);
    // なかよしパズル（ゆうりょうの スコアアタック）
    r.walls.north.push({ kind: "shop", shop: "puzzle", from: 14, to: 24 }); this.fill(r, 14, 0, 10, 7, "carpetB"); this.zone(r, "puzzle", 14, 0, 10, 7);
    r.fixtures.push({ kind: "puzzleBooth", shop: "puzzle", x: 15, y: 2, w: 8, h: 2, height: 110, label: "なかよしパズル", action: "puzzle" });
    this.front(r, "puzzle", 14, 10, 7);
    this.decor(r, "books", 24, 10, 7, "owl", "えほんも ずかんも あるよ。\nしずかに よんでね。");
    this.decor(r, "toys", 34, 11, 7, "bear", "つみきや ぬいぐるみが いっぱい！");
    this.atrium(r); this.escVoid(r, this.ESC[2]);
    const e2 = this.ESC[2];
    r.fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e2.x, y: e2.y, w: e2.w, h: e2.h, rise: 210, height: 40, label: "2Fへ おりる", action: "floor", to: 2, spawn: [e2.x + 3, e2.y + e2.h] });
    this.westHall(r, 3);
    r.walls.west.push({ kind: "window", from: 1, to: 7 }, { kind: "window", from: 22, to: 30 });
    this.fill(r, 1, 23, 6, 6, "carpetG");
    for (const [x, y, w, h] of [[1, 24, 2, 3], [4, 27, 3, 2]]) r.fixtures.push({ kind: "sofa", x, y, w, h, height: 60, label: "ひとやすみ", action: "sit" });
    r.fixtures.push({ kind: "planter", variant: "tree", x: 6, y: 23, w: 1, h: 1, height: 150 });
    return r;
  },
  install() {
    const mall = VenueHalls.defs.mall; if (!mall) return;
    // かざりの 店の いろ
    Object.assign(MallArt.SHOP, {
      ramen: { name: "らーめん いけぶ", c: ["#F2D9B3", "#E6C18E", "#B98E57"], floor: "wood", logo: "cup", fixture: "stool", wall: "menu" },
      books: { name: "ほんの もり", c: ["#D9E3C8", "#C3D3AC", "#8FA873"], floor: "wood", logo: "leaf", fixture: "shelf", wall: "books" },
      toys: { name: "おもちゃの ゆめいろ", c: ["#F7E1B5", "#EBCB8E", "#C9A866"], floor: "carpetP", logo: "piece", fixture: "toyshelf", wall: "toys" },
      flower: { name: "はなの こみち", c: ["#F4D3DD", "#E9B3C4", "#C98AA0"], floor: "stone", logo: "heart" },
      ice: { name: "アイスの しろくま", c: ["#D9EEF3", "#BFE0E8", "#8FBFCB"], floor: "stone", logo: "cup" },
    });
    // お店の 画面の なまえも ひらがなに（ID は そのまま）
    if (BUY_SHOPS.ike_luxury) BUY_SHOPS.ike_luxury.name = "いいつか かぐ";
    if (BUY_SHOPS.ike_marche) BUY_SHOPS.ike_marche.name = "いけぶくろ マルシェ";
    mall.iso = true; mall.art = MallArt; mall.guide = MallGuide;
    mall.floors = { 1: this.floor1(), 2: this.floor2(), 3: this.floor3() };
    // 店内 BGM: フロアごとの 名曲（js/mall-music.js）
    mall.bgm = MallMusic.FLOOR[1];
    for (const fl of [1, 2, 3]) mall.floors[fl].bgm = MallMusic.FLOOR[fl];
  },
};
// フロアマップ（サンシャインシティの 案内図の ように 上から 見た 図・店の いろ・マーク）。えらぶと そこまで あるく（ちがう 階は エレベーターで）
const MallGuide = {
  MARK: { elevatorCall: "elev", toiletDoor: "wc", info: "info", aed: "aed", locker: "locker", exitMat: "exit", stage: "stage", fountain: "fountain", escalator: "esc", stairs: "stairs", guide: "here" },
  places(r) {
    const out = [];
    for (const z of r.zones || []) { const f = r.fixtures.find((f) => f.action && f.x >= z.x && f.x < z.x + z.w && f.y >= z.y && f.y < z.y + z.h && ["shop", "eat", "puzzle", "info", "buy", "tank", "curator", "sit", "crane", "photo", "counter"].includes(f.action)); if (f) out.push({ label: z.label, f, zone: z }); }
    for (const f of r.fixtures) if (this.MARK[f.kind] && f.label && f.kind !== "guide") out.push({ label: f.label, f });
    return out;
  },
  svg(r, here) {
    const S = 10, W = r.w * S, H = r.h * S, R = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="1.2" ${extra}/>`;
    let s = R(0, 0, W, H, "#F7F2E8", `rx="6"`);
    for (const h of r.holes || []) s += h.kind === "ellipse" ? `<circle cx="${h.x * S}" cy="${h.y * S}" r="${h.r * S}" fill="#DCEFF3" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 3"/>` : R(h.x * S, h.y * S, h.w * S, h.h * S, "#E5E0D6", `stroke-dasharray="3 2"`);
    if (r.id === "ike1") { const a = IkeMall.AT; s += `<circle cx="${a.x * S}" cy="${a.y * S}" r="${6.2 * S}" fill="#F0E3C9" stroke="#C9B28C" stroke-width="1.2"/><circle cx="${a.x * S}" cy="${a.y * S}" r="${2.4 * S}" fill="#9FD3E0" stroke="${INK}" stroke-width="1.2"/>`; }
    (r.zones || []).forEach((z, i) => { const sh = MallArt.SHOP[z.shop]; s += R(z.x * S + 1, z.y * S + 1, z.w * S - 2, z.h * S - 2, sh.c[0], `rx="3"`) + `<circle cx="${z.x * S + 9}" cy="${z.y * S + 9}" r="7" fill="#355C7D"/><text x="${z.x * S + 9}" y="${z.y * S + 12.5}" font-size="9" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">${i + 1}</text>`; });
    // 順路の やじるし（すいぞくかん）は 店の なまえの した
    for (const d of r.decals || []) if (d.kind === "arrow") { const ang = d.dir === "x" ? (d.back ? Math.PI : 0) : d.back ? -Math.PI / 2 : Math.PI / 2; s += `<g transform="translate(${d.x * S} ${d.y * S}) rotate(${(ang * 180) / Math.PI})"><path d="M8,0 L-4,-6 L-1,0 L-4,6 Z" fill="#E8575A"/></g>`; }
    (r.zones || []).forEach((z) => { const sh = MallArt.SHOP[z.shop], name = z.label.length > 7 ? z.label.split(" ") : [z.label]; s += name.map((t, k) => `<text x="${(z.x + z.w / 2) * S}" y="${(z.y + z.h / 2) * S + 4 + (k - (name.length - 1) / 2) * 11}" font-size="${z.w < 8 ? 8 : 10}" font-weight="800" text-anchor="middle" fill="${INK}" stroke="${sh.c[0]}" stroke-width="3" stroke-linejoin="round" paint-order="stroke" font-family="'M PLUS Rounded 1c',sans-serif">${t}</text>`).join(""); });
    // 通りの なまえ（サンシャインシティの 案内図の ように）
    if (r.id === "ike1") s += `<text x="${8 * S}" y="${9.8 * S}" font-size="9" font-weight="800" fill="#7C6B55" font-family="'M PLUS Rounded 1c',sans-serif">おおどおり</text><text x="${IkeMall.AT.x * S}" y="${(IkeMall.AT.y + 4.4) * S}" font-size="9" font-weight="800" text-anchor="middle" fill="#7C6B55" font-family="'M PLUS Rounded 1c',sans-serif">ふんすい ひろば</text>`;
    for (const f of r.fixtures) { const m = this.MARK[f.kind]; if (!m || m === "fountain" || m === "stage") continue; s += this.icon(m, (f.x + f.w / 2) * S, (f.y + f.h / 2) * S); }
    if (here) s += `<circle cx="${(here.x + 0.5) * S}" cy="${(here.y + 0.5) * S}" r="7" fill="#E8575A" stroke="#FFFFFF" stroke-width="2"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${W + 8} ${H + 8}" role="img" aria-label="フロアマップ">${s}</svg>`;
  },
  icon(m, x, y) {
    const box = (fill, inner) => `<g transform="translate(${x - 8} ${y - 8})"><rect width="16" height="16" rx="3" fill="${fill}"/>${inner}</g>`;
    if (m === "elev") return box("#3E4652", `<path d="M4,7 L8,3 L12,7 Z M4,9 L8,13 L12,9 Z" fill="#FFFFFF"/>`);
    if (m === "wc") return box("#5A8FB4", `<circle cx="5" cy="4" r="1.8" fill="#fff"/><rect x="3.6" y="6.2" width="2.8" height="7" fill="#fff"/><circle cx="11" cy="4" r="1.8" fill="#fff"/><path d="M11,6 L13.4,13 H8.6 Z" fill="#fff"/>`);
    if (m === "info") return box("#5A9BC4", `<text x="8" y="12.5" font-size="12" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">?</text>`);
    if (m === "aed") return box("#E86B6B", `<path d="${heartPath(8, 4, 0.34)}" fill="#fff"/>`);
    if (m === "locker") return box("#8D949B", `<rect x="3" y="3" width="4" height="10" fill="#fff"/><rect x="9" y="3" width="4" height="10" fill="#fff"/>`);
    if (m === "exit") return box("#6BAA75", `<path d="M3,8 H11 M8,4 L12,8 L8,12" stroke="#fff" stroke-width="2" fill="none"/>`);
    if (m === "esc") return box("#C98A52", `<path d="M3,12 H6 L11,5 H13" stroke="#fff" stroke-width="2" fill="none"/>`);
    if (m === "stairs") return box("#8C7A64", `<path d="M3,13 H6 V10 H9 V7 H12 V4 H13" stroke="#fff" stroke-width="2" fill="none"/>`);
    return "";
  },
  async open(sc) {
    if (sc.busy) return; sc.busy = true;
    let floor = sc.floor, m = null;
    const body = U.el("div", { class: "mall-guide" }), tabs = U.el("div", { class: "mg-tabs" }), map = U.el("div", { class: "mg-map" }), list = U.el("div", { class: "mg-list" });
    body.append(tabs, map, list);
    // えらんだ ところの まえ まで あるく（しらべるのは じぶんで タップ）
    const walk = (p) => {
      if (p.zone) { const z = p.zone, x = z.x + Math.floor(z.w / 2); for (let y = z.y + z.h; y < z.y + z.h + 4; y++) if (sc.walkTo(x, y)) return; }
      const f = sc.fixtures.find((q) => q.label === p.f.label && q.x === p.f.x && q.y === p.f.y) || p.f, spots = [];
      for (let y = Math.floor(f.y) - 1; y <= Math.ceil(f.y + f.h); y++) for (let x = Math.floor(f.x) - 1; x <= Math.ceil(f.x + f.w); x++) { const r = sc.route(x, y); if (r) spots.push({ x, y, n: r.length }); }
      spots.sort((a, b) => a.n - b.n); if (spots[0]) sc.walkTo(spots[0].x, spots[0].y);
    };
    const go = (p, fl) => {
      m && m.close(); sc.busy = false;
      if (fl === sc.floor) { walk(p); return; }
      // ちがう 階: エレベーターで いって から あるく
      // エレベーターの ない 階（13F）は、エレベーターで いける 階の かいだんを のぼった ところから
      const r = sc.def.floors[fl], up = r.noElevator && Object.values(sc.def.floors).flatMap((q) => (q.noElevator ? [] : q.fixtures)).find((q) => q.action === "floor" && q.to === fl);
      Sound.se("good"); if (up) UI.toast("かいだんで " + fl + "F へ");
      sc.changeFloor(fl, up ? up.spawn : r.elevatorSpawn || r.spawn); sc.afterLift = () => walk(p);
    };
    const render = () => {
      tabs.replaceChildren(...Object.keys(sc.def.floors).map((k) => { const b = UI.btn(k + "F", () => { floor = +k; Sound.se("tap"); render(); }, "small" + (+k === floor ? " yellow" : "")); return b; }));
      const r = sc.def.floors[floor], L = sc.party[0];
      map.innerHTML = this.svg(r, floor === sc.floor ? { x: L.tx, y: L.ty } : null);
      list.replaceChildren(...this.places(r).map((p, i) => { const z = p.zone ? (r.zones.indexOf(p.zone) + 1) + " " : ""; const b = UI.btn(z + p.label, () => go(p, floor), "mg-spot"); b.dataset.label = p.label; return b; }));
    };
    render();
    m = UI.modal({ title: "フロアマップ", body, onClose: () => { sc.busy = false; } });
    this.modal = m;
  },
};
IkeMall.install();
