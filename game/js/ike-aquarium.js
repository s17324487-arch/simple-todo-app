// UI-05: すいぞくかんを みなとから サンシャインいけぶの 12F へ うつす（エレベーターで いく・13F と そとの テラスまで ぐるっと 一周できる）。
// 順路は サンシャイン水族館の 館内マップ（本館1F 大海の旅・本館2F 水辺の旅・屋外 マリンガーデン 天空の旅）を 参考:
//   12F: エレベーター → うけつけと かんちょう → いその ひろば → だいすいそう「しおかぜの うみ」→ くらげの へや → よるの うみ・しんかい → うみの トンネル → かいだん（13F）
//   13F: かわと たき（やまの さわ・さとの かわ）→ いけと たんぼ → そとの「てんくうの テラス」（ペンギン・アシカの リング・ペリカン）→ かいだん（12F）
//   12F: おみやげ → でぐち → エレベーター
// 水そうの 魚・寄贈・かんちょうの ことば・展示の 説明は これまでの MUSEUM_DATA と Museum を つかう（どの 水そうに どの 魚は かえない）。
const IkeAquarium = {
  W: 34, H: 28,
  obj(id) { return id && typeof MUSEUM_DATA !== "undefined" ? MUSEUM_DATA.buildings.aquarium.objects.find((o) => o.id === id) || null : null; },
  // トンネルの 天じょうを とおる 魚（うみの 魚から 大きい ものを えらぶ）
  tunnelFish() { return ["manbo", "buri", "suzuki", "madai", "saba", "aji", "iwashi", "hirame"]; },
  // 12F・13F の へや（案内の ことば。はじめて 入った ときだけ）
  ZONES: {
    12: [
      { id: "lobby", name: "すいぞくかんの いりぐち", short: "いりぐち", intro: "ようこそ！ ぐるっと ひとまわり、みずの たびに でかけよう。", x: 1, y: 8, w: 6, h: 10 },
      { id: "iso", name: "いその ひろば", intro: "いわの かげに かくれる いその さかなたち。", x: 1, y: 0, w: 6, h: 7 },
      { id: "sea", name: "だいすいそう「しおかぜの うみ」", intro: "うみの さかなが いっしょに およぐ だいすいそう。", x: 7, y: 0, w: 14, h: 8 },
      { id: "jelly", name: "くらげの へや", intro: "ふわふわ ただよう くらげを ゆっくり ながめてね。", x: 21, y: 0, w: 13, h: 8 },
      { id: "reef", name: "なんごくの まるい すいそう", short: "まるい すいそう", intro: "まわりを ぐるっと まわって みてね。", x: 8, y: 8, w: 15, h: 11 },
      { id: "deep", name: "よるの うみ・しんかい", intro: "くらくて ふかい うみに すむ ふしぎな さかな。", x: 24, y: 8, w: 10, h: 12 },
      { id: "tunnel", name: "うみの トンネル", intro: "あたまの うえを さかなが およいで いるよ。", x: 24, y: 20, w: 10, h: 4 },
      { id: "shop", name: "おみやげ", intro: "きょうの おもいでに どうぞ。", x: 1, y: 19, w: 11, h: 9 },
    ],
    13: [
      { id: "river", name: "かわと たき", intro: "やまの さわから さとの かわへ。ながれに まけずに およぐよ。", x: 10, y: 0, w: 24, h: 8 },
      { id: "pond", name: "いけと たんぼ", intro: "いけや たんぼで のんびり くらす さかなたち。", x: 11, y: 8, w: 15, h: 15 },
      { id: "sky", name: "てんくうの テラス", intro: "そらの した。ペンギンが そらを とぶ ように およぐよ。", x: 0, y: 0, w: 10, h: 28 },
      { id: "path", name: "みずべの みち", intro: "やじるしの じゅんに かわと たきを みて、そとの テラスへ いこう。", x: 26, y: 8, w: 8, h: 16 },
    ],
  },
  mats: { ".": "aqua", l: "white", w: "wood", d: "deep", t: "tunnelF", k: "deck", m: "mat", p: "plaza" },
  room(floor, title, extra) {
    const W = this.W, H = this.H;
    return { id: "ike" + floor, iso: true, aqua: true, w: W, h: H, wallH: 300, scale: 0.44, title, mall: true, bgm: "aquarium", short: "すいぞくかん", rows: Array.from({ length: H }, () => ".".repeat(W)), mats: this.mats, walls: { north: [], west: [] }, fixtures: [], decals: [], zones: [], ...extra };
  },
  fill(r, x0, y0, w, h, mat) { IkeMall.fill(r, x0, y0, w, h, mat); },
  tank(r, kind, obj, x, y, w, h, height, zone) { const o = this.obj(obj); r.fixtures.push({ kind, obj, x, y, w, h, height, label: (o && o.label) || "すいそう", action: "tank", zone, noFade: kind === "lowtank" }); },
  arrow(r, x, y, dir, back) { r.decals.push({ kind: "arrow", x, y, dir, back, col: "#9FE0EECC" }); },
  zoneMap(r, floor) {
    // フロアマップの いろ（店の いろの かわり）と みじかい なまえ
    for (const z of this.ZONES[floor]) r.zones.push({ shop: "aq_" + z.id, x: z.x, y: z.y, w: z.w, h: z.h, label: z.short || z.name.replace(/「.*」/, "") });
  },
  floor12() {
    const r = this.room(12, "12F すいぞくかん・おおうみの たび", { spawn: [2, 12], elevatorSpawn: [2, 12] });
    // ゆか: ロビーと みせは あかるく、しんかいは くらく、トンネルは あおく
    this.fill(r, 1, 8, 6, 10, "white"); this.fill(r, 1, 19, 11, 9, "wood"); this.fill(r, 24, 8, 10, 12, "deep"); this.fill(r, 24, 20, 10, 4, "tunnelF"); this.fill(r, 0, 9, 1, 7, "white");
    // 北の かべ: いその え・だいすいそう・くらげの パノラマ
    r.walls.north.push({ kind: "mural", style: "shore", from: 0, to: 6 }, { kind: "tank", obj: "aq_big", style: "sea", from: 6, to: 21, label: "しおかぜの うみ" }, { kind: "jellywall", from: 21, to: 33, label: "くらげの へや" });
    // 西の かべ: ようこその え・エレベーター・おみやげの たな
    r.walls.west.push({ kind: "mural", style: "welcome", from: 1, to: 8 }, { kind: "elevator", from: 9, to: 15, doors: 2, label: "エレベーター" }, { kind: "shop", shop: "aq_shop", from: 18, to: 27 });
    r.fixtures.push({ kind: "elevatorCall", x: 0, y: 10, w: 1, h: 4, height: 180, label: "エレベーター", action: "elevator", noFade: true });
    // うけつけ・かんちょう（寄贈）
    r.fixtures.push({ kind: "welcome", x: 3, y: 10, w: 3, h: 1, height: 70, label: "うけつけ", action: "info", text: "すいぞくかんは 12F と 13F と そとの テラス。\nやじるしの じゅんに ぐるっと まわってね。" });
    const cur = MUSEUM_DATA.buildings.aquarium.npcs.find((n) => n.role === "donate");
    r.fixtures.push({ kind: "npc", sp: cur.sp, outfit: cur.outfit, npc: cur.id, x: 4, y: 9, w: 1, h: 1, height: 110, label: cur.name, action: "curator" });
    r.fixtures.push({ kind: "gate", x: 1, y: 7, w: 5, h: 1, height: 60, walk: true }, { kind: "gate", x: 1, y: 18, w: 5, h: 1, height: 60, walk: true });
    // いその ひろば（ひくい 水そう）
    this.tank(r, "lowtank", "aq_iso", 1, 2, 3, 2, 44, "iso"); this.tank(r, "lowtank", "aq_reef", 3, 4, 3, 2, 44, "iso");
    // だいすいそうの まえの ベンチ
    for (const x of [9, 13, 17]) r.fixtures.push({ kind: "bench", x, y: 6, w: 2, h: 1, height: 46, label: "ベンチ", action: "sit" });
    r.fixtures.push({ kind: "tankTap", obj: "aq_big", x: 7, y: 0, w: 14, h: 1, height: 240, label: "しおかぜの うみ", action: "tank", zone: "sea", noFade: true });
    // くらげの へや
    for (const [x, id] of [[23, "aq_jelly1"], [28, "aq_jelly2"]]) r.fixtures.push({ kind: "jellycol", obj: id, x, y: 3, w: 2, h: 2, height: 180, label: "くらげ", action: "tank", zone: "jelly" });
    r.fixtures.push({ kind: "tankTap", info: "jelly", x: 21, y: 0, w: 12, h: 1, height: 240, label: "くらげの パノラマ", action: "tank", obj: "aq_jelly1", zone: "jelly", noFade: true });
    // まんなかの まるい 水そう（なんごくの うみ・かざり）
    r.fixtures.push({ kind: "roundtank", x: 13, y: 10, w: 5, h: 5, height: 210, label: "なんごくの まるい すいそう", action: "info", text: "なんごくの あたたかい うみの さかな。\nまわりを ぐるっと まわって みてね。" });
    for (const [x, y, w, h] of [[11, 11, 1, 2], [19, 11, 1, 2], [14, 16, 3, 1]]) r.fixtures.push({ kind: "bench", x, y, w, h, height: 46, label: "ベンチ", action: "sit" });
    // よるの うみ・しんかい（くらい へや）
    this.tank(r, "xtank", "aq_night", 24, 9, 1, 4, 190, "deep"); this.tank(r, "xtank", "aq_abyss", 24, 14, 1, 5, 190, "deep");
    this.tank(r, "pedestal2", "aq_coela", 28, 12, 2, 2, 130, "deep");
    // うみの トンネル（頭の 上）→ かいだん
    r.fixtures.push({ kind: "tunnel", obj: null, x: 27, y: 19, w: 5, h: 4, rise: 175, height: 180, over: true, walk: true });
    r.fixtures.push({ kind: "tankTap", info: "tunnel", obj: "aq_tunnel", x: 25, y: 20, w: 1, h: 3, height: 150, label: "うみの トンネル", action: "tank", zone: "tunnel" });
    r.fixtures.push({ kind: "stairs", x: 29, y: 24, w: 4, h: 4, height: 190, label: "13Fへ のぼる", action: "floor", to: 13, spawn: [30, 23], spots: [[30, 23], [31, 23]] });
    // 13F から おりて くる かいだん（おみやげの よこ。のぼると 13F の テラスの かえり道へ もどる）
    r.fixtures.push({ kind: "stairs", x: 20, y: 24, w: 4, h: 4, height: 190, label: "13Fへ もどる かいだん", action: "floor", to: 13, spawn: [21, 23], spots: [[21, 23], [22, 23]] });
    // おみやげ（js/aqua-gifts.js）: うみの いきもの フィギュア 10しゅ・ごわが コラボ 5しゅの 台と レジ
    AquaGifts.shopFixtures(r);
    // やじるし（順路）
    for (const [x, y, d, b] of [[3.5, 7.5, "y", true], [8, 4.5, "x"], [15, 4.5, "x"], [22, 5.5, "x"], [29.5, 9.5, "y"], [29.5, 16, "y"], [29.5, 21.5, "y"], [18.5, 23.5, "x", true], [13, 22, "x", true], [3.5, 18.5, "y", true]]) this.arrow(r, x, y, d, b);
    r.fixtures.push({ kind: "hangsign", x: 1, y: 6, w: 4, h: 1, z: 232, text: "いりぐち ↑", col: "#3E8FB0", over: true, walk: true });
    r.fixtures.push({ kind: "hangsign", x: 1, y: 19, w: 4, h: 1, z: 232, text: "でぐち", col: "#6BAA75", over: true, walk: true });
    this.zoneMap(r, 12);
    return r;
  },
  floor13() {
    const r = this.room(13, "13F すいぞくかん・みずべと てんくうの たび", { spawn: [30, 22], noElevator: true, sky: true, noFade: true });
    this.fill(r, 0, 0, 10, 28, "deck");
    // 北の かべ: そら（テラス）・たき・いしの した・かわの ながれ
    r.walls.north.push({ kind: "sky", from: 0, to: 10 }, { kind: "tank", obj: "aq_falls", style: "falls", from: 10, to: 17, label: "たきの すいそう" }, { kind: "tank", obj: "aq_rock", style: "rock", from: 17, to: 20, label: "いしの した" }, { kind: "tank", obj: "aq_flow", style: "river", from: 20, to: 31, label: "かわの ながれ" }, { kind: "plain", from: 31, to: 34 });
    // 西の かべ: てんくうの ペンギン（そらに うかぶ 水そう）・そら
    r.walls.west.push({ kind: "penguintank", from: 2, to: 15, label: "てんくうの ペンギン" }, { kind: "sky", from: 15, to: 28 });
    for (const [x, y, w, h, obj, label] of [[11, 0, 6, 1, "aq_falls"], [17, 0, 3, 1, "aq_rock"], [20, 0, 11, 1, "aq_flow"]]) r.fixtures.push({ kind: "tankTap", obj, x, y, w, h, height: 240, label: this.obj(obj).label, action: "tank", zone: "river", noFade: true });
    // しまの 水そう（イトウ・かわの そこ・いけ・みずうみ・たんぼ・メダカと キンギョ）
    this.tank(r, "islandtank", "aq_ito", 13, 4, 3, 2, 130, "river"); this.tank(r, "islandtank", "aq_bed", 23, 4, 3, 2, 130, "river");
    this.tank(r, "islandtank", "aq_pond", 13, 10, 3, 2, 130, "pond"); this.tank(r, "islandtank", "aq_lake", 19, 10, 3, 2, 130, "pond");
    this.tank(r, "islandtank", "aq_paddy", 13, 16, 3, 2, 130, "pond"); this.tank(r, "islandtank", "aq_bowl", 19, 16, 2, 2, 130, "pond");
    for (const [x, y] of [[16, 13], [20, 13]]) r.fixtures.push({ kind: "bench", x, y, w: 2, h: 1, height: 46, label: "ベンチ", action: "sit" });
    // テラスとの ガラスの かべ（出入り口は 北と 南）
    r.fixtures.push({ kind: "glasswall", x: 10, y: 0, w: 1, h: 4, height: 220, noFade: false }, { kind: "glasswall", x: 10, y: 7, w: 1, h: 16, height: 220 }, { kind: "glasswall", x: 10, y: 26, w: 1, h: 2, height: 220 });
    // テラス: アシカの リング（頭の 上）・ペリカンの いけ・てんくうの ペンギン
    r.fixtures.push({ kind: "aquaring", x: 3, y: 15, w: 5, h: 5, height: 210, over: true, walk: true });
    r.fixtures.push({ kind: "tankTap", info: "ring", x: 3, y: 15, w: 5, h: 1, height: 200, label: "アシカの リング", action: "info", text: "あたまの うえの ドーナツの すいそう。\nアシカが そらを とぶ ように およぐよ。", noFade: true, walk: true, over: true });
    r.fixtures.push({ kind: "pond", x: 2, y: 22, w: 5, h: 4, height: 40, label: "ペリカンの いけ", action: "info", text: "ペリカンは のどの ふくろで さかなを すくうよ。" });
    r.fixtures.push({ kind: "tankTap", info: "penguin", x: 0, y: 2, w: 1, h: 13, height: 240, label: "てんくうの ペンギン", action: "info", text: "そらに うかぶ すいそう。\nペンギンが まちの うえを とぶ ように およぐよ。", noFade: true });
    // かいだん（12F から のぼって くる ところ・12F へ おりる ところ）
    r.fixtures.push({ kind: "stairs", dir: "down", x: 29, y: 24, w: 4, h: 4, height: 60, label: "12Fへ もどる かいだん", action: "floor", to: 12, spawn: [30, 23], spots: [[30, 23], [31, 23]] });
    r.fixtures.push({ kind: "stairs", dir: "down", x: 20, y: 24, w: 4, h: 4, height: 60, label: "12Fへ おりる", action: "floor", to: 12, spawn: [21, 23], spots: [[21, 23], [22, 23]] });
    // みずべの みち: ベンチ・のみもの・フロアマップ・木
    for (const y of [12, 16]) r.fixtures.push({ kind: "bench", x: 32, y, w: 1, h: 2, height: 46, label: "ベンチ", action: "sit" });
    r.fixtures.push({ kind: "vending", x: 33, y: 9, w: 1, h: 1, height: 150, label: "じどうはんばいき", action: "info", text: "つめたい のみものが ならんで いるよ。\nテラスは おひさまが あたって あついから、のみものを もって いこう。" });
    r.fixtures.push({ kind: "guide", x: 27, y: 21, w: 1, h: 1, height: 150, label: "フロアマップ", action: "guide" });
    for (const [x, y] of [[33, 20], [26, 9]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    for (const [x, y, d, b] of [[29.5, 18, "y", true], [29.5, 10, "y", true], [26, 6.5, "x", true], [17, 6.5, "x", true], [11.5, 5.5, "x", true], [5, 9, "y"], [5, 20.5, "y"], [12.5, 25, "x"], [18, 25, "x"]]) this.arrow(r, x, y, d, b);
    r.fixtures.push({ kind: "hangsign", face: "x", x: 11, y: 4, w: 1, h: 3, z: 232, text: "テラスへ", col: "#3E8FB0", over: true, walk: true });
    for (const [x, y] of [[8, 1], [8, 26]]) r.fixtures.push({ kind: "planter", variant: "tree", x, y, w: 1, h: 1, height: 150 });
    this.zoneMap(r, 13);
    return r;
  },
  // ---- ゲームへの くみこみ ----
  install() {
    const mall = VenueHalls.defs.mall; if (!mall || typeof MUSEUM_DATA === "undefined") return;
    Object.assign(MallArt.MAT, {
      aqua: { c: ["#5F8397", "#5A7D91"], line: "#4E6E80", pat: "carpet" }, deep: { c: ["#343A4E", "#30364A"], line: "#2A2F41", pat: "carpet" }, tunnelF: { c: ["#3F7291", "#3B6C8A"], line: "#34617D", pat: "tile" },
    });
    for (const [id, name, c] of [["lobby", "いりぐち", "#E6F2F5"], ["iso", "いその ひろば", "#E3D6BD"], ["sea", "しおかぜの うみ", "#BFE0EA"], ["jelly", "くらげの へや", "#D9D2EC"], ["reef", "まるい すいそう", "#CFE7EC"], ["deep", "しんかい", "#B8BCCB"], ["tunnel", "うみの トンネル", "#B5D6E3"], ["shop", "おみやげ", "#EFDDBF"], ["river", "かわと たき", "#CFE6D6"], ["pond", "いけと たんぼ", "#DCEBC6"], ["sky", "てんくうの テラス", "#D6EDF7"], ["path", "みずべの みち", "#DDE8EA"]]) MallArt.SHOP["aq_" + id] = { name, c: [c, MallArt.shade(c, -0.12), MallArt.shade(c, -0.3)], floor: "aqua", logo: "cup", wall: "gift" };
    mall.floors[12] = this.floor12(); mall.floors[13] = this.floor13();
    // 1F〜3F: エレベーターの まえに「12F すいぞくかん」の あんない
    for (const fl of [1, 2, 3]) mall.floors[fl].fixtures.push({ kind: "hangsign", face: "x", x: 2, y: 10, w: 1, h: 4, z: 236, text: "12F すいぞくかん", col: "#3E8FB0", over: true, walk: true });
    const pen = mall.floors[1].fixtures.find((f) => f.kind === "npc" && f.sp === "penguin"); if (pen) pen.text = "エレベーターで 12F の すいぞくかんへ いけるよ。\nつった さかなを きふすると すいそうで およぐよ。";
    // みなとの 旧館: 12F へ おひっこし の おしらせ
    const hb = MAP_DEFS.harbor && MAP_DEFS.harbor.buildings.find((b) => b.id === "harbor_aquarium");
    if (hb) { hb.label = "すいぞくかん（おひっこし）"; hb.act = { type: "visit", text: "すいぞくかんは いけぶくろの サンシャインいけぶ 12かいに おひっこし したよ。\nでんしゃで いけぶくろへ いって、エレベーターで 12かいへ！" }; }
    // みなとの 町の人の ことば（TOWNSFOLK_DATA は 自動生成なので ここで かえる）
    const tf = typeof TOWNSFOLK_DATA !== "undefined" && TOWNSFOLK_DATA.lines.find((l) => l.id === "tf0381"); if (tf) tf.text = "すいぞくかんは いけぶくろの 12かいへ おひっこし したよ";
    // セーブが 旧館の 中なら、サンシャインいけぶの まえ（池袋）から
    const was = WorldScene.prototype.enter;
    WorldScene.prototype.enter = function (p = {}) { if (p && p.map === "aquarium") { const b = MAP_DEFS.city.buildings.find((b) => b.id === "ike_mall"); p = { map: "city", x: b.x + b.door, y: b.y + b.h, dir: "down" }; Save.d.world = { ...p }; } return was.call(this, p); };
  },
  // 12F・13F で はじめて 入った へやの 案内（Museum の しくみ）。へやを 出たら 案内は けす
  tick(sc) {
    const r = sc.room; if (!r || !r.aqua || !Save.d.museum || sc.busy || sc.lift > 0) return;
    const L = sc.party[0], fl = sc.floor, z = (this.ZONES[fl] || []).find((z) => L.tx >= z.x && L.tx < z.x + z.w && L.ty >= z.y && L.ty < z.y + z.h), key = z ? "aquarium.ike" + fl + "_" + z.id : null;
    if (key !== this.here) { if (this.here) Museum.hideIntro(); this.here = key; }
    if (!z || Save.d.museum.rooms[key]) return;
    Save.d.museum.rooms[key] = true; Save.mark(); Museum.showIntro({ name: z.name, intro: z.intro });
  },
  // 水そうを しらべる（Museum の 説明の 画面）。へやの なまえは あたらしい へや
  show(f) {
    const zone = (this.ZONES[12].concat(this.ZONES[13]).find((z) => z.id === f.zone) || {}).name || "";
    const o = this.obj(f.obj); if (!o) return null;
    if (o.fish) return Museum.showTank({ ...o, map: "aquarium" }, zone);
    if (o.info) return Museum.showInfo({ ...o, map: "aquarium" }, zone);
    return null;
  },
  async interact(sc, f) {
    if (f.action === "tank") { sc.busy = true; try { const m = this.show(f); if (m) await new Promise((res) => { const iv = setInterval(() => { if (!m.el.isConnected || m.el.closest(".out")) { clearInterval(iv); res(); } }, 120); }); } finally { sc.busy = false; } return true; }
    if (f.action === "curator") { sc.busy = true; try { const n = MUSEUM_DATA.buildings.aquarium.npcs.find((n) => n.id === f.npc); await Museum.talk(n, { mapId: "aquarium", map: null }); } finally { sc.busy = false; } return true; }
    return false;
  },
};
IkeAquarium.install();
