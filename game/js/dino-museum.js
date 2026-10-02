// UI-42: きょうりゅう はくぶつかん を すいぞくかんと おなじ 斜め上の 館（IsoVenueScene・絵は DinoHallArt）に 作りなおす。
// オーナーの FB 2026-10-02「博物館のつくりを、水族館レベルにクオリティアップしてくれ。内部の構造も実際の博物館を参考にして欲しい」。
// つくりは 福井県立恐竜博物館を もとに した: いりぐちは 3F。うけつけと ゲートの さきの ながい エスカレーターで ドームの 1F へ おりる →
//   1F: かせきの みち（ダイノストリート。かべに ほんものの かせき）→ はっくつげんばの ジオラマ → ドームの「きょうりゅうの せかい」（ほねの 台 10・まんなかに うごく ロボット）→
//   2F: ちきゅうと いのちの れきし（ゆかの いのちの みち・ちきゅうの かがく・たまご・ガラスごしの けんきゅうしつ・キッズ ひろば）→ かいだんで 3F に もどる。
// ほかの 館からも とりいれた: ふきぬけに つるした 大きな ほね（ロンドン自然史博物館）・ゆかの いのちの みち（アメリカ自然史博物館）・ガラスごしの けんきゅうしつ（シカゴ フィールド博物館）・
//   ティラノサウルスと トリケラトプスが にらみあう 台（国立科学博物館）。
// 寄贈・ほねの 台・はかせの ことば・展示の 説明は これまでの MUSEUM_DATA・Museum・Fossils を つかう（どの 台に どの 恐竜は かえない）。セーブは Save.d.museum の まま（へやの 案内の キーが ふえる だけ）。
const DinoMuseum = {
  // 1F の ながい エスカレーター（3F ⇔ 1F。2F は ふきぬけ）と 1F ⇔ 2F の エスカレーター・2F ⇔ 3F の かいだん
  ESC: { x: 1, y: 2, w: 4, h: 10 },
  ESC2: { x: 29, y: 19, w: 4, h: 7 },
  STAIRS: { x: 6, y: 2, w: 3, h: 4 },
  // ほねの 台（x y は 台の 奥の かど。len は ほねの ながさ〔マス〕・flip は あたまを みぎ〔+x〕に）
  STANDS: [
    { dino: "brachio", x: 7, y: 2, w: 9, h: 3, len: 8.4 },
    { dino: "stego", x: 7, y: 7, w: 5, h: 2, len: 4.6 },
    { dino: "compso", x: 13, y: 7, w: 2, h: 2, len: 1.6 },
    { dino: "para", x: 18, y: 2, w: 5, h: 2, len: 4.6 },
    { dino: "spino", x: 25, y: 2, w: 7, h: 2, len: 6.4 },
    { dino: "ankylo", x: 24, y: 7, w: 4, h: 2, len: 3.8 },
    { dino: "raptor", x: 29, y: 7, w: 2, h: 2, len: 1.9 },
    { dino: "trex", x: 13, y: 13, w: 6, h: 2, len: 5.8, flip: true },
    { dino: "tricera", x: 21, y: 13, w: 5, h: 2, len: 4.6 },
    { dino: "fukui", x: 24, y: 23, w: 3, h: 2, len: 2.8 },
  ],
  // へや（案内の ことば。はじめて 入った ときだけ。フロアマップの いろ わけにも）
  ZONES: {
    3: [
      { id: "lobby", name: "いりぐち ホール", intro: "ようこそ！ いりぐちは 3かい。\nながい エスカレーターで\n1かいの ドームへ おりて いこう。", x: 17, y: 12, w: 11, h: 10 },
      { id: "atrium", name: "ふきぬけの ひろば", intro: "うえを みあげて！\nうみに いた くびながりゅう\nフタバスズキリュウの ほねだよ。", x: 5, y: 1, w: 16, h: 11 },
      { id: "cafe", name: "カフェ ジュラ", intro: "ひとやすみ。カレーや パフェを\n3にんで たべよう。", x: 0, y: 14, w: 10, h: 8 },
      { id: "rest", name: "やすみどころ", intro: "まどから いけぶくろの\nまちが みえるよ。", x: 21, y: 1, w: 7, h: 9 },
    ],
    1: [
      { id: "street", name: "かせきの みち", intro: "かべの いしに ほんものの\nかせきが うまって いるよ。\nゆかの あしあとも みてね。", x: 1, y: 12, w: 5, h: 13 },
      { id: "digsite", name: "はっくつげんばの ジオラマ", short: "はっくつげんば", intro: "かせきを ほりだす ところを\nジオラマに したよ。", x: 0, y: 25, w: 7, h: 3 },
      { id: "jura", name: "ジュラきの きょうりゅう", short: "ジュラき", intro: "くびの ながい おおきな\nきょうりゅうが いた じだい。", x: 6, y: 1, w: 10, h: 10 },
      { id: "hall", name: "きょうりゅうの せかい", intro: "ドームの なかに きょうりゅうの\nほねが ならんで いるよ。\nほねを きふすると くみあがるよ。", x: 16, y: 1, w: 18, h: 17 },
      { id: "forest", name: "ジュラきの もりの ジオラマ", short: "もりの ジオラマ", intro: "シダの もりで コンプソグナトゥスが\nトカゲを おいかけて いるよ。", x: 7, y: 19, w: 6, h: 6 },
      { id: "japan", name: "にほんの きょうりゅう", short: "にほん", intro: "にほんでも きょうりゅうの\nかせきが みつかって いるよ。", x: 21, y: 21, w: 8, h: 7 },
    ],
    2: [
      { id: "life", name: "いのちの れきし", intro: "ゆかの みちを ひがしから にしへ\nあるくと、46おくねん まえから\nいままで たびが できるよ。", x: 9, y: 1, w: 25, h: 6 },
      { id: "earth", name: "ちきゅうの かがく", intro: "ちきゅうは どうやって\nできて いるのかな？", x: 1, y: 13, w: 11, h: 15 },
      { id: "lab", name: "けんきゅうしつ", intro: "ガラスの むこうで ほんとうに\nほねを きれいに して いるよ。", x: 17, y: 8, w: 11, h: 7 },
      { id: "eggs", name: "たまごの へや", intro: "きょうりゅうも たまごから\nうまれたんだ。", x: 12, y: 15, w: 6, h: 7 },
      { id: "kids", name: "キッズ ひろば", intro: "かせきを ほったり、\nさわったり して みよう！", x: 18, y: 17, w: 10, h: 11 },
    ],
  },
  // あたらしい 展示の 説明（MUSEUM_DATA.info に ない もの。ことばは ひらがな・事実は 文書 docs/ROADMAP_V2.md の UI-42 の 出典）
  INFO: {
    futaba: { name: "フタバスズキリュウ", icon: "futaba", text: "きょうりゅう では なく、うみに いた くびながりゅう。\nやく 8500まんねん まえの ちそうから でた。\n1968ねんに ふくしまけんで こうこうせいが みつけたよ。" },
    kabutogani: { name: "カブトガニの かせき", icon: "kabutogani", text: "カブトガニは 4おくねん いじょう まえから いる なかま。\nいまも にほんの うみで くらして いる\n「いきた かせき」だよ。" },
    gyoryu: { name: "ぎょりゅうの かせき", icon: "gyoryu", text: "イルカに にた かたちの うみの はちゅうるい。\nおなかで こどもを そだてて うんだ ことが\nかせきから わかって いるよ。" },
    shida: { name: "シダの かせき", icon: "shida", text: "きょうりゅうの じだいの もりには\nシダが たくさん はえて いた。\nくさを たべる きょうりゅうの ごはんにも なったよ。" },
    tooth: { name: "きょうりゅうの は", icon: "tooth", text: "にくを たべる きょうりゅうの はは\nナイフの ように ふちが ぎざぎざ。\nくさを たべる なかまの はは すりつぶす かたちだよ。" },
    umiyuri: { name: "ウミユリの かせき", icon: "umiyuri", text: "なまえは ユリでも しょくぶつ では なく どうぶつ。\nヒトデや ウニの なかまだよ。" },
    coprolite: { name: "ふんの かせき", icon: "coprolite", text: "うんちも かせきに なる！\nなかを しらべると、なにを たべて いたか わかるんだ。" },
    digsite: { name: "はっくつげんば", icon: "pick", text: "がけや ちそうを すこしずつ けずって かせきを さがす。\nみつけたら しゃしんを とって、ばしょを きろくしてから\nせっこうで つつんで はこぶよ。" },
    jura: { name: "ジュラき", icon: "fern", text: "やく 2おく100まんねん まえから 1おく4500まんねん まえ。\nくびの ながい おおきな きょうりゅうが たくさん いたよ。" },
    kreta: { name: "はくあき", icon: "tooth", text: "やく 1おく4500まんねん まえから 6600まんねん まえ。\nティラノサウルスや トリケラトプスが いた じだい。\nおわりに おおきな いんせきが おちたよ。" },
    japan: { name: "にほんの きょうりゅう", icon: "japan", text: "にほんでも きょうりゅうの かせきが みつかって いる。\nフクイラプトルは ふくいけんで みつかった\nにくを たべる きょうりゅうだよ。" },
    forest: { name: "ジュラきの もり", icon: "fern", text: "シダや ソテツの もり。\nちいさな コンプソグナトゥスは すばしこくて、\nトカゲを つかまえて たべて いたよ。" },
    robot: { name: "うごく ティラノサウルス", icon: "tooth", text: "ほんものと おなじ 12m の ながさで うごく ロボット。\nくびと しっぽを ふって、ときどき ほえるよ。" },
    // 2F いのちの れきし（ゆかの みちの 8つの ケース）
    stromatolite: { name: "ストロマトライト", icon: "stromatolite", text: "シアノバクテリアと いう ちいさな いきものが\nつくった いしの かたまり。\nさんそを つくって ちきゅうの くうきを かえたよ。" },
    anomalocaris: { name: "アノマロカリス", icon: "anomalocaris", text: "やく 5おくねん まえの うみで\nいちばん おおきかった いきもの。\nめが おおきくて、えものを つかまえて いたよ。" },
    dunkle: { name: "ダンクルオステウス", icon: "dunkle", text: "やく 3おく7000まんねん まえの さかな。\nあたまを かたい よろいの ような ほねで\nまもって いたよ。" },
    ichthyostega: { name: "イクチオステガ", icon: "ichthyostega", text: "あしの ある さかなの なかま。\nこの なかまが みずから りくへ あがって、\nりくの いきものの もとに なったよ。" },
    archaeo: { name: "しそちょう", icon: "archaeo", text: "とりと きょうりゅうの とくちょうを もつ。\nはねが あって、くちには はが あったよ。\nとりは きょうりゅうの なかまなんだ。" },
    meteorite: { name: "いんせき", icon: "meteorite", text: "うちゅうから おちて きた いし。\n6600まんねん まえに おおきな いんせきが おちて、\nとり いがいの きょうりゅうは いなく なったよ。" },
    mammoth: { name: "マンモスの きば", icon: "mammoth", text: "さむい じだいに いた ながい けの ゾウの なかま。\nきばは 4m に なる ものも あったよ。" },
    earth: { name: "ちきゅうが できた", icon: "globe", text: "ちきゅうは やく 46おくねん まえに できた。\nはじめは どろどろに とけた ほしだったよ。" },
    // 2F ちきゅうの かがく
    globe: { name: "まわる ちきゅう", icon: "globe", text: "ちきゅうは 1にちに 1かい くるっと まわって いる。\nだから ひると よるが あるんだ。" },
    volcano: { name: "かざんの もけい", icon: "volcano", text: "ちきゅうの なかには とけた いわ（マグマ）が ある。\nそれが そとに でて くると かざんに なるよ。" },
    strata: { name: "ちそうの かべ", icon: "strata", text: "ちそうは したに ある ほど ふるい。\nかせきが どの ちそうから でたかで、\nいつ ごろの いきものか わかるよ。" },
    mineral: { name: "いしと こうぶつ", icon: "crystal", text: "すいしょうは いしの なかで ゆっくり そだった けっしょう。\nこはくは きの やにが かたまった ものだよ。" },
    skull: { name: "ほねの ひみつ", icon: "skull", text: "シーティー スキャンで ほねの なかを しらべると、\nのうや みみの かたちが わかるんだ。\nほねを こわさずに なかが みられるよ。" },
    dig: { name: "かせきほり たいけん", icon: "pick", text: "すなを そっと はらって、\nかくれて いる ほねの レプリカを さがそう！" },
    touch: { name: "さわれる かせき", icon: "ammonite", text: "ほんものの かせきに さわれる テーブル。\nアンモナイトは つるつる、ほねは ざらざらだよ。" },
  },
  // ほんとうに ある 展示（MUSEUM_DATA.info）の なまえ
  info(key) { const n = this.INFO[key] || (typeof MUSEUM_DATA !== "undefined" && MUSEUM_DATA.info[key]); return n ? { icon: key, ...n } : null; },
  zone(floor, x, y) { return (this.ZONES[floor] || []).find((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || null; },
  mats: { ".": "mstone", w: "mwood", c: "mcafe", m: "mat", "#": "mstone", s: "msand", d: "mdome", l: "mlab", k: "mkids", e: "mearth", t: "mlife" },
  room(floor, title, extra) {
    const W = 34, H = 28;
    return { id: "mu" + floor, iso: true, museum: true, w: W, h: H, wallH: 300, scale: 0.44, title, bgm: "museum", rows: Array.from({ length: H }, () => Array(W).fill(".")), mats: this.mats, walls: { north: [], west: [] }, fixtures: [], decals: [], zones: [], holes: [], ...extra };
  },
  paint(r, ch, x0, y0, w, h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (y >= 0 && x >= 0 && y < r.h && x < r.w) r.rows[y][x] = ch; },
  arrow(r, x, y, dir, back) { r.decals.push({ kind: "arrow", x, y, dir, back, col: "#C9A56ACC" }); },
  hang(r, x, y, w, text, col, face) { r.fixtures.push({ kind: "hangsign", face, x, y, w: face === "x" ? 1 : w, h: face === "x" ? w : 1, z: 232, text, col, over: true, walk: true, fadeOver: true }); },
  npc(r, sp, ci, x, y, dir, text, extra = {}) { r.fixtures.push({ kind: "npc", sp, ci, x, y, w: 1, h: 1, dir, emo: "happy", height: 110, ...(text ? { label: "おきゃくさん", action: "info", text, spots: extra.spots } : {}), ...extra }); },
  zoneMap(r, floor) { for (const z of this.ZONES[floor]) r.zones.push({ shop: "mu_" + z.id, x: z.x, y: z.y, w: z.w, h: z.h, label: z.short || z.name, map: z.map }); },
  finish(r) { r.rows = r.rows.map((row) => row.join("")); return r; },

  // ---- 3F いりぐち（うけつけ・ゲート・ふきぬけの ひろば・ながい エスカレーター・カフェ・やすみどころ）----
  floor3() {
    const r = this.room(3, "3F いりぐち・ふきぬけの ひろば", { w: 28, h: 22, wallH: 330, scale: 0.46, spawn: [23, 19], crowd: 3, short: "いりぐち" }), e = this.ESC, s = this.STAIRS;
    r.rows = Array.from({ length: r.h }, () => Array(r.w).fill("."));
    this.paint(r, "w", 9, 1, 12, 11); this.paint(r, "c", 0, 14, 10, 8); this.paint(r, "m", 22, 20, 4, 2);
    for (let y = e.y + 1; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) r.rows[y][x] = "o";
    r.holes.push({ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 });
    for (let y = s.y + 1; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) r.rows[y][x] = "o";
    r.holes.push({ kind: "rect", x: s.x, y: s.y + 1, w: s.w, h: s.h - 1 });
    // うけつけの うしろ・カフェの カウンターの うしろは とおれない
    this.paint(r, "#", 20, 11, 6, 1); this.paint(r, "#", 0, 15, 1, 5);
    r.walls.north.push({ kind: "mutunnel", from: 0, to: 6, label: "1F へ" }, { kind: "mubanner", from: 9, to: 21 }, { kind: "window", from: 21.5, to: 27.5 });
    r.walls.west.push({ kind: "mudescend", from: 0, to: 13 }, { kind: "mucafewall", from: 14, to: 22 });
    // ながい エスカレーター（1F の ドームへ おりる）と かいだん（2F へ）
    r.fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e.x, y: e.y, w: e.w, h: e.h, rise: 380, height: 40, label: "1Fへ おりる", action: "floor", to: 1, spawn: [e.x + 3, e.y + e.h], spots: [[e.x + 1, e.y - 1], [e.x + 2, e.y - 1]] });
    r.fixtures.push({ kind: "stairs", dir: "down", x: s.x, y: s.y, w: s.w, h: s.h, height: 60, label: "2Fへ おりる", action: "floor", to: 2, spawn: [s.x + 1, s.y - 1], spots: [[s.x + 1, s.y - 1]] });
    this.hang(r, e.x, e.y - 1, e.w, "1F きょうりゅうの せかい", "#6E8F4E"); this.hang(r, s.x, s.y - 1, s.w, "2F", "#5A87A8");
    // ふきぬけに つるした フタバスズキリュウ（頭の 上）と ゆかの かげ・まるい もよう
    r.fixtures.push({ kind: "futaba", x: 10, y: 3, w: 9, h: 4, z: 205, height: 110, label: "フタバスズキリュウ", action: "info", info: "futaba", over: true, walk: true, noFade: true });
    r.decals.push({ kind: "rings", x: 14.5, y: 5, rings: [[3.2, "#C9AE85", 3], [2.4, "#DCC59E", 2], [1.2, "#C9AE85", 2]] }, { kind: "shadow", x: 14.5, y: 5.4, rx: 4.4, ry: 1.7 });
    // ゲートから エスカレーターへ つづく 大きな あしあと
    const trail = [[13.2, 11.4], [12.0, 10.7], [10.8, 9.9], [9.6, 9.1], [8.4, 8.3], [7.2, 7.6], [6.0, 6.9], [5.4, 5.8], [5.2, 4.5], [5.0, 3.2], [4.6, 1.9]];
    trail.forEach(([x, y], i) => { const [nx, ny] = trail[Math.min(trail.length - 1, i + 1)], [px, py] = trail[Math.max(0, i - 1)]; r.decals.push({ kind: "foot", x, y, ang: Math.atan2(ny - py, nx - px), left: i % 2 === 0, size: 0.62 }); });
    // ゲート・うけつけ（うしろに たな と スタッフ）
    r.fixtures.push({ kind: "gate", x: 9, y: 12, w: 9, h: 1, height: 60, walk: true });
    r.fixtures.push({ kind: "mubackshelf", x: 20, y: 10, w: 6, h: 1, height: 150 });
    r.fixtures.push({ kind: "mureception", x: 20, y: 12, w: 6, h: 1, height: 84, label: "うけつけ", action: "info", text: "ようこそ！ にゅうかんは むりょうだよ。\nながい エスカレーターで 1かいの ドーム → 2かい → かいだんで 3かいに もどる じゅんばんで まわってね。", spots: [[21, 13], [23, 13], [24, 13]] });
    r.fixtures.push({ kind: "npc", sp: "owl", ci: 0, x: 21, y: 11, w: 1, h: 1, dir: "down", emo: "happy", height: 110, outfit: { neck: "bowtie_red" } }, { kind: "npc", sp: "deer", ci: 1, x: 24, y: 11, w: 1, h: 1, dir: "down", emo: "happy", height: 110 });
    r.fixtures.push({ kind: "mudirectory", x: 13, y: 15, w: 3, h: 1, height: 170, label: "フロア あんない", action: "info", text: "きょうりゅう はくぶつかん の あんない\n3F いりぐち・カフェ・ふきぬけの ひろば\n2F ちきゅうと いのちの れきし・けんきゅうしつ\n1F きょうりゅうの せかい（ドーム）・かせきの みち", spots: [[14, 16], [13, 16]] });
    r.fixtures.push({ kind: "guide", x: 18, y: 15, w: 1, h: 1, height: 150, label: "フロアマップ", action: "guide" });
    // カフェ ジュラ（かべぞいの カウンターと テーブル）
    r.fixtures.push({ kind: "mucafebar", x: 1, y: 15, w: 1, h: 5, height: 110, label: "カフェ ジュラ", action: "eat", menu: ["curry", "sandwich", "parfait", "cocoa"], spots: [[2, 16], [2, 18]] });
    r.fixtures.push({ kind: "npc", sp: "hippo", ci: 0, x: 0, y: 17, w: 1, h: 1, dir: "right", emo: "happy", height: 110, outfit: { body: "apron" } });
    for (const [x, y, i] of [[4, 15, 0], [7, 15, 1], [4, 18, 2], [7, 18, 3]]) r.fixtures.push({ kind: "mucafetable", x, y, w: 2, h: 2, variant: i, height: 70, label: "カフェの テーブル", action: "eat", menu: ["curry", "sandwich", "parfait", "cocoa"], spots: [[x + 2, y + 1], [x, y + 2], [x + 1, y + 2]] });
    // やすみどころ（まどの まえの ベンチ・のみもの・うえき）
    for (const x of [22, 25]) r.fixtures.push({ kind: "bench", x, y: 3, w: 2, h: 1, height: 46, label: "ベンチ", action: "sit", text: "まどから まちを ながめて ひとやすみ。" });
    r.fixtures.push({ kind: "vending", x: 27, y: 6, w: 1, h: 1, height: 150, label: "のみもの", action: "info", text: "つめたい のみものが ならんで いるよ。" });
    for (const [x, y, v] of [[21, 1, "tree"], [27, 1, "tree"], [19, 20, ""], [8, 12, ""], [26, 14, "tree"]]) r.fixtures.push({ kind: "planter", variant: v, x, y, w: 1, h: 1, height: v ? 150 : 70 });
    for (const [x, y] of [[14, 18], [10, 18]]) r.fixtures.push({ kind: "bench", x, y, w: 3, h: 1, height: 46, label: "ベンチ", action: "sit", text: "ベンチで ひとやすみ。" });
    // おきゃくさん
    this.npc(r, "rabbit", 1, 16, 7, "up", "うわあ、くびが ながーい！\nあれは きょうりゅう じゃ なくて、くびながりゅう なんだって。", { spots: [[16, 8]] });
    this.npc(r, "fox", 0, 6, 9, "left", "この エスカレーター、ずーっと したまで つづいて いるよ！", { spots: [[6, 10]] });
    // 入口（マット・でぐちの つりさげ）
    r.fixtures.push({ kind: "exitMat", x: 22, y: 21, w: 4, h: 1, height: 20, label: "たてものを でる", action: "leave", noFade: true, spots: [[23, 20], [24, 20]] });
    this.hang(r, 22, 20, 4, "でぐち", "#6BAA75");
    for (const [x, y, d, b] of [[23.5, 17, "y", true], [20, 13.5, "x", true], [13, 12.6, "y", true], [5.5, 3, "y", true]]) this.arrow(r, x, y, d, b);
    this.zoneMap(r, 3);
    return this.finish(r);
  },

  // ---- 1F きょうりゅうの せかい（ダイノストリート・はっくつげんば・ドームの ほねの 台・ロボット）----
  floor1() {
    const r = this.room(1, "1F きょうりゅうの せかい（ドーム）", { wallH: 360, spawn: [4, 12], crowd: 5, dome: true, short: "きょうりゅう" }), e = this.ESC, e2 = this.ESC2;
    this.paint(r, "d", 0, 0, 34, 28); this.paint(r, "s", 0, 12, 5, 16); this.paint(r, "s", 0, 0, 5, 12);
    // ながい エスカレーター（3F の いりぐちへ。かべの トンネルへ のぼる）
    r.walls.north.push({ kind: "mutunnel", from: 0, to: 6, label: "3F へ", up: true }, { kind: "dome", from: 6, to: 34 });
    r.walls.west.push({ kind: "mustone", from: 0, to: 12 }, ...["ammonite", "trilobite", "fishfossil", "kabutogani", "gyoryu", "shida"].map((k, i) => ({ kind: "fossilslab", fossil: k, from: 13 + i * 2, to: 15 + i * 2 })), { kind: "mustone", from: 25, to: 28 });
    r.fixtures.push({ kind: "escalator", pair: true, x: e.x, y: e.y, w: e.w, h: e.h, rise: 300, height: 320, label: "3Fへ のぼる", action: "floor", to: 3, spawn: [e.x + 1, e.y - 1], spots: [[e.x + 1, e.y + e.h], [e.x + 2, e.y + e.h]] });
    // かせきの みち: かべの かせき（しらべる）・ガラスの ケース・ゆかの あしあと
    ["ammonite", "trilobite", "fishfossil", "kabutogani", "gyoryu", "shida"].forEach((k, i) => r.fixtures.push({ kind: "walltap", x: 0, y: 13 + i * 2, w: 1, h: 2, height: 220, label: (this.info(k) || {}).name, action: "info", info: k, noFade: true, zone: "street" }));
    ["tooth", "umiyuri", "coprolite"].forEach((k, i) => r.fixtures.push({ kind: "fossilcase", x: 5, y: 13 + i * 3, w: 1, h: 3, variant: k, height: 84, label: this.info(k).name, action: "info", info: k }));
    for (let i = 0; i < 6; i++) r.decals.push({ kind: "foot", x: 2.4 + (i % 2) * 0.9, y: 13.2 + i * 1.7, ang: Math.PI / 2, left: i % 2 === 0, size: 0.62, fossil: true });
    this.hang(r, 1, 12, 4, "かせきの みち", "#8C6A44");
    // はっくつげんばの ジオラマ（みちの おわり）
    r.fixtures.push({ kind: "digsite", x: 0, y: 25, w: 6, h: 3, height: 40, label: "はっくつげんばの ジオラマ", action: "info", info: "digsite", spots: [[3, 24], [6, 26]] });
    // ほねの 台（寄贈で くみあがる）
    for (const st of this.STANDS) { const d = typeof Fossils !== "undefined" && Fossils.dino(st.dino); r.fixtures.push({ kind: "dinostand", ...st, height: this.standHeight(st), label: d ? d.name : st.dino, action: "stand", obj: "mu_" + st.dino, noFade: false }); }
    // まんなかの うごく ティラノサウルス（ロボット）・じだいの かんばん・もりの ジオラマ・にほんの コーナー
    r.fixtures.push({ kind: "robotrex", x: 17, y: 7, w: 3, h: 3, height: 230, label: "うごく ティラノサウルス", action: "robot", info: "robot", spots: [[18, 10], [20, 9]] });
    r.fixtures.push({ kind: "erasign", x: 12, y: 10, w: 1, h: 1, variant: "jura", height: 130, label: "ジュラき", action: "info", info: "jura" });
    r.fixtures.push({ kind: "erasign", x: 21, y: 10, w: 1, h: 1, variant: "kreta", height: 130, label: "はくあき", action: "info", info: "kreta" });
    r.fixtures.push({ kind: "erasign", x: 28, y: 23, w: 1, h: 1, variant: "japan", height: 130, label: "にほん", action: "info", info: "japan" });
    r.fixtures.push({ kind: "jdiorama", x: 8, y: 20, w: 4, h: 3, height: 90, label: "ジュラきの もり", action: "info", info: "forest", spots: [[10, 23], [12, 21]] });
    r.fixtures.push({ kind: "japanboard", x: 22, y: 22, w: 1, h: 2, height: 160, label: "にほんの きょうりゅう", action: "info", info: "japan" });
    // ベンチ・はしら
    for (const [x, y, w] of [[15, 18, 3], [8, 15, 3], [26, 16, 2]]) r.fixtures.push({ kind: "bench", x, y, w, h: 1, height: 46, label: "ベンチ", action: "sit", text: "ほねを ながめて ひとやすみ。" });
    // 2F へ のぼる エスカレーター（ひがしの みなみ）
    r.fixtures.push({ kind: "escalator", pair: true, x: e2.x, y: e2.y, w: e2.w, h: e2.h, rise: 176, height: 200, label: "2Fへ のぼる", action: "floor", to: 2, spawn: [e2.x + 1, e2.y - 1], spots: [[e2.x + 1, e2.y + e2.h], [e2.x + 2, e2.y + e2.h]] });
    r.fixtures.push({ kind: "slab", x: e2.x - 0.3, y: e2.y - 0.4, w: e2.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    this.hang(r, e2.x, e2.y + e2.h, e2.w, "2F いのちの れきし", "#5A87A8");
    // おきゃくさん
    this.npc(r, "bear", 2, 12, 16, "right", "ティラノサウルスと トリケラトプスが にらみあって いる！\nどっちが つよいのかなあ。", { spots: [[12, 17]] });
    this.npc(r, "pig", 1, 20, 5, "up", "ブラキオサウルスは きりんより ずっと せが たかかったんだって。", { spots: [[21, 5]] });
    this.npc(r, "mouse", 0, 6, 24, "left", "かべの アンモナイト、くるくるで きれいだね。", { spots: [[7, 24]] });
    for (const [x, y, d, b] of [[2.5, 14, "y"], [2.5, 20, "y"], [6.5, 23.5, "x"], [12, 19, "x"], [14, 11.5, "x"], [23, 11.5, "x"], [27.5, 13, "y"], [30.5, 17.5, "y", true]]) this.arrow(r, x, y, d, b);
    this.zoneMap(r, 1);
    return this.finish(r);
  },

  // ---- 2F ちきゅうと いのちの れきし（いのちの みち・ちきゅうの かがく・たまご・けんきゅうしつ・キッズ ひろば）----
  floor2() {
    const r = this.room(2, "2F ちきゅうと いのちの れきし", { spawn: [30, 18], crowd: 4, short: "ちきゅうと いのち" }), e = this.ESC, e2 = this.ESC2, s = this.STAIRS;
    this.paint(r, "t", 9, 1, 25, 6); this.paint(r, "e", 0, 12, 12, 16); this.paint(r, "l", 17, 8, 11, 7); this.paint(r, "k", 18, 17, 10, 11);
    // ながい エスカレーターの ふきぬけ（1F ⇔ 3F）と 1F へ おりる エスカレーター
    for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) r.rows[y][x] = "o";
    r.holes.push({ kind: "rect", x: e.x, y: e.y, w: e.w, h: e.h });
    for (let y = e2.y + 1; y < e2.y + e2.h; y++) for (let x = e2.x; x < e2.x + e2.w; x++) r.rows[y][x] = "o";
    r.holes.push({ kind: "rect", x: e2.x, y: e2.y + 1, w: e2.w, h: e2.h - 1 });
    // けんきゅうしつの なか（ガラスの むこう）は とおれない
    this.paint(r, "#", 18, 8, 9, 5); this.paint(r, "#", 24, 13, 3, 1);
    r.walls.north.push({ kind: "mustone", from: 0, to: 9, light: true }, { kind: "timeline", from: 9, to: 34 });
    r.walls.west.push({ kind: "mustone", from: 0, to: 12, light: true }, { kind: "strata", from: 12, to: 28 });
    r.fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e2.x, y: e2.y, w: e2.w, h: e2.h, rise: 210, height: 40, label: "1Fへ おりる", action: "floor", to: 1, spawn: [e2.x + 3, e2.y + e2.h], spots: [[e2.x + 1, e2.y - 1], [e2.x + 2, e2.y - 1]] });
    r.fixtures.push({ kind: "stairs", x: s.x, y: s.y, w: s.w, h: s.h, height: 190, label: "3Fへ のぼる", action: "floor", to: 3, spawn: [s.x + 1, s.y - 1], spots: [[s.x + 1, s.y - 1]] });
    this.hang(r, s.x, s.y + s.h, s.w, "3F でぐち・カフェ", "#C98A52");
    this.hang(r, e.x, e.y + e.h, e.w, "ながい エスカレーター", "#8C8A92");
    // いのちの みち（ゆかの せんと ふし）と 8つの ケース（ひがし → にし が むかし → いま）
    r.decals.push({ kind: "lifeline", x0: 33.2, x1: 9.4, y: 5.6, nodes: [31.5, 28.5, 25.5, 22.5, 19.5, 16.5, 13.5, 10.6] });
    ["earth", "stromatolite", "anomalocaris", "dunkle", "ichthyostega", "archaeo", "meteorite", "mammoth"].forEach((k, i) => r.fixtures.push({ kind: "lifecase", x: 31 - i * 3, y: 2, w: 2, h: 1, variant: k, height: 112, label: this.info(k).name, action: "info", info: k, spots: [[31 - i * 3, 3], [32 - i * 3, 3]] }));
    // ちきゅうの かがく（にしの みなみ）: まわる ちきゅう・かざん・こうぶつ・ちそうの かべ
    r.fixtures.push({ kind: "globe", x: 3, y: 15, w: 2, h: 2, height: 150, label: "まわる ちきゅう", action: "info", info: "globe" });
    r.fixtures.push({ kind: "volcano", x: 7, y: 15, w: 3, h: 3, height: 120, label: "かざんの もけい", action: "info", info: "volcano" });
    r.fixtures.push({ kind: "mineralcase", x: 3, y: 21, w: 3, h: 1, height: 100, label: "いしと こうぶつ", action: "info", info: "mineral" });
    r.fixtures.push({ kind: "walltap", x: 0, y: 13, w: 1, h: 14, height: 220, label: "ちそうの かべ", action: "info", info: "strata", noFade: true });
    // けんきゅうしつ（ガラスの へや。なかで ほねを きれいに して いる）と きふの まどぐち（くまの はかせ）
    r.fixtures.push({ kind: "labback", x: 18, y: 8, w: 8, h: 1, height: 170 });
    r.fixtures.push({ kind: "labtable", x: 20, y: 10, w: 3, h: 2, height: 90 });
    r.fixtures.push({ kind: "npc", sp: "hedgehog", ci: 0, x: 23, y: 10, w: 1, h: 1, dir: "left", emo: "normal", height: 110, outfit: { face: "glasses" } });
    // ガラス（みなみ と ひがし。マスの はしに 描く）
    r.fixtures.push({ kind: "labglass", x: 18, y: 12, w: 8, h: 1, height: 210, label: "けんきゅうしつ", action: "info", info: "lab", noFade: true, side: "s", spots: [[20, 13], [21, 13], [22, 13]] }, { kind: "labglass", x: 26, y: 8, w: 1, h: 5, height: 210, noFade: true, side: "e" });
    const cur = typeof MUSEUM_DATA !== "undefined" && MUSEUM_DATA.buildings.museum.npcs.find((n) => n.role === "donate");
    if (cur) r.fixtures.push({ kind: "npc", sp: cur.sp, outfit: cur.outfit, npc: cur.id, x: 25, y: 13, w: 1, h: 1, dir: "down", emo: "happy", height: 110 });
    // きふの まどぐち（タップの はこは うしろの はかせまで たかく）
    r.fixtures.push({ kind: "mudesk", x: 24, y: 14, w: 3, h: 1, height: 150, noFade: true, label: cur ? cur.name : "きふの まどぐち", action: "curator", spots: [[25, 15], [24, 15], [26, 15]] });
    r.fixtures.push({ kind: "skullscan", x: 13, y: 9, w: 2, h: 2, height: 150, label: "ほねの ひみつ", action: "info", info: "skull" });
    // たまごの へや・キッズ ひろば
    r.fixtures.push({ kind: "eggnest", x: 13, y: 16, w: 3, h: 2, height: 60, label: "きょうりゅうの たまご", action: "info", info: "nest" });
    r.fixtures.push({ kind: "digbox", x: 19, y: 19, w: 4, h: 3, height: 40, label: "かせきほり たいけん", action: "dig", info: "dig", spots: [[21, 22], [23, 20], [20, 22]] });
    r.fixtures.push({ kind: "touchtable", x: 24, y: 19, w: 2, h: 2, height: 70, label: "さわれる かせき", action: "touch", info: "touch", spots: [[25, 21], [26, 20]] });
    for (const [x, y, w] of [[19, 25, 3], [13, 23, 3], [5, 25, 3]]) r.fixtures.push({ kind: "bench", x, y, w, h: 1, height: 46, label: "ベンチ", action: "sit", text: "ひとやすみ。つぎは どこを みようかな。" });
    for (const [x, y, v] of [[33, 7, "tree"], [27, 26, ""], [12, 26, "tree"], [16, 13, ""]]) r.fixtures.push({ kind: "planter", variant: v, x, y, w: 1, h: 1, height: v ? 150 : 70 });
    // おきゃくさん
    this.npc(r, "squirrel", 1, 30, 7, "left", "この せんを たどると、ちきゅうの はじまりから いままで いけるんだって！", { spots: [[30, 8]] });
    this.npc(r, "cat", 2, 22, 15, "up", "ガラスの むこうで、ほねを ちいさな ドリルで きれいに して いるよ。", { spots: [[22, 16]] });
    this.npc(r, "koala", 0, 9, 20, "left", "ちそうは したの ほうが ふるいんだって。", { spots: [[10, 20]] });
    for (const [x, y, d, b] of [[30.5, 16, "y", true], [31, 9, "y", true], [27, 5.6, "x", true], [18, 5.6, "x", true], [10, 5.6, "x", true]]) this.arrow(r, x, y, d, b);
    this.zoneMap(r, 2);
    return this.finish(r);
  },
  // ほねの 台の 高さ（タップの はこ）: ほねの 絵の たかさ ＋ 台
  standHeight(st) { const d = typeof Fossils !== "undefined" && Fossils.dino(st.dino); if (!d) return 120; const [, , bw, bh] = d.art.box; return Math.round(26 + Math.min(300, (st.len * IsoVenue.T * bh) / bw)); },

  // ---- ゲームへの くみこみ ----
  install() {
    if (typeof MUSEUM_DATA === "undefined" || typeof VenueHalls === "undefined") return;
    VenueHalls.defs.museum = { name: "きょうりゅう はくぶつかん", iso: true, art: DinoHallArt, guide: MallGuide, bgm: "museum", start: 3, floors: { 3: this.floor3(), 1: this.floor1(), 2: this.floor2() } };
    // フロアマップの いろ（へやごと）
    for (const [id, name, c] of [["lobby", "いりぐち", "#EEE6D6"], ["atrium", "ふきぬけ", "#F1E1C2"], ["esc", "エスカレーター", "#DCD9D2"], ["cafe", "カフェ", "#F3DCC3"], ["rest", "やすみどころ", "#DDE9D3"],
      ["street", "かせきの みち", "#E6D2AE"], ["digsite", "はっくつげんば", "#D9C29A"], ["jura", "ジュラき", "#D6E6C6"], ["hall", "きょうりゅうの せかい", "#E9DCC5"], ["forest", "もり", "#CFE3C0"], ["japan", "にほん", "#F4D9D9"],
      ["life", "いのちの れきし", "#E8E1F2"], ["earth", "ちきゅう", "#D3E4EE"], ["lab", "けんきゅうしつ", "#E6F1F3"], ["eggs", "たまご", "#F4E9C9"], ["kids", "キッズ", "#DCEFD0"]]) MallArt.SHOP["mu_" + id] = { name, c: [c, MallArt.shade(c, -0.12), MallArt.shade(c, -0.3)] };
    // 町の 入口（act.type === "indoor"・map "museum"）→ この 館の 3F
    const enter = Museum.enter.bind(Museum);
    Museum.enter = function (sc, act) {
      if (act && act.map === "museum" && VenueHalls.defs.museum) { const o = MUSEUM_DATA.buildings.museum.outside; sc.busy = true; return VenueHalls.enter("museum", { map: sc.mapId, x: o.front[0], y: o.front[1], dir: "down" }); }
      return enter(sc, act);
    };
    // セーブが まえの 館（MAP_DEFS.museum）の 中なら、館の まえ（池袋）から
    const was = WorldScene.prototype.enter;
    WorldScene.prototype.enter = function (p = {}) { if (p && p.map === "museum") { const o = MUSEUM_DATA.buildings.museum.outside; p = { map: "city", x: o.front[0], y: o.front[1], dir: "down" }; Save.d.world = { ...p }; } return was.call(this, p); };
  },
  // はじめて 入った へやの 案内（Museum の しくみ。キーは "museum.mu" + 階 + "_" + へや）。へやを 出たら 案内は けす
  tick(sc) {
    const r = sc.room; if (!r || !r.museum || !Save.d.museum || sc.busy || sc.lift > 0) return;
    const L = sc.party[0], z = this.zone(sc.floor, L.tx, L.ty), key = z ? "museum.mu" + sc.floor + "_" + z.id : null;
    if (key !== this.here) { if (this.here) Museum.hideIntro(); this.here = key; }
    if (!z || Save.d.museum.rooms[key]) return;
    Save.d.museum.rooms[key] = true; Save.mark(); Museum.showIntro({ name: z.name, intro: z.intro });
  },
  // 説明の まど（絵・へやの なまえ・ことば）。MUSEUM_DATA の 展示（かせき・たまご・けんきゅうしつ）も おなじ まど
  card(key, floor) {
    const n = this.info(key); if (!n) return null;
    const z = this.ZONES[floor] ? this.ZONES[floor].find((q) => q.id === (this.zoneOf(key) || "")) : null, body = U.el("div", { class: "ex-card rock mu-card" });
    body.innerHTML = `<div class="art">${DinoHallArt.iconSvg(n.icon || key, 160, "mc" + key)}</div><span class="plate"></span><div class="say"></div>`;
    body.querySelector(".plate").textContent = (z && z.name) || "きょうりゅう はくぶつかん"; body.querySelector(".say").textContent = n.text;
    Sound.se("tap");
    return UI.modal({ title: n.name, body });
  },
  zoneOf(key) { for (const [fl, list] of Object.entries(this.ZONES)) for (const f of VenueHalls.defs.museum.floors[fl].fixtures) if (f.info === key) { const z = this.zone(+fl, f.x + Math.floor(f.w / 2), f.y + Math.floor(f.h / 2)); if (z) return z.id; } return null; },
  // まどが とじるまで まつ
  waitClose(m) { return new Promise((res) => { const iv = setInterval(() => { if (!m.el.isConnected || m.el.closest(".out")) { clearInterval(iv); res(); } }, 120); }); },
  // その 階の 展示を しらべる（PokaDebug.museumShow からも）。obj は MUSEUM_DATA の id（mu_trex など）か info の キー
  show(f, floor) {
    if (f.action === "stand" || f.dino) return Museum.showStand({ dino: f.dino });
    if (f.info) return this.card(f.info, floor);
    return null;
  },
  async interact(sc, f) {
    if (!sc.room || !sc.room.museum) return false;
    if (f.action === "stand" || (f.action === "info" && f.info)) { sc.busy = true; try { const m = this.show(f, sc.floor); if (m) await this.waitClose(m); } finally { sc.busy = false; } return true; }
    if (f.action === "curator") { sc.busy = true; try { const n = MUSEUM_DATA.buildings.museum.npcs.find((n) => n.role === "donate"); await Museum.talk(n, { mapId: "museum", map: null }); } finally { sc.busy = false; } return true; }
    if (f.action === "robot") {
      sc.busy = true;
      try {
        DinoHallArt.roarT = G.t; DinoHallArt.roars = (DinoHallArt.roars || 0) + 1; Sound.se("gao");
        await UI.say([{ name: f.label, text: "ガオー！" }, { who: "goji", emo: "happy", text: "ガゥー！ ゴジも まけないよ！" }, { who: "wanko", emo: "surprise", text: "わわっ、うごいた！ …ロボットだった！" }, { who: "gachan", emo: "happy", text: (this.info("robot") || {}).text || "" }]);
        for (const id of Save.d.order) Save.care(id, { mood: 1 }); Save.write();
      } finally { sc.busy = false; }
      return true;
    }
    if (f.action === "dig") {
      sc.busy = true;
      try {
        DinoHallArt.digT = G.t; Sound.se("swish"); sc.sitting = 3;
        const finds = ["アンモナイトの レプリカ", "きょうりゅうの はの レプリカ", "さんようちゅうの レプリカ", "ほねの かけらの レプリカ"], got = finds[Math.floor(Math.random() * finds.length)];
        for (const id of Save.d.order) Save.care(id, { mood: 2 }); Save.write();
        await UI.say([{ name: f.label, text: "すなを そっと はらうと…" }, { who: "wanko", emo: "happy", text: "あった！ " + got + "だ！" }, { who: "gachan", emo: "happy", text: "ほんものの はっくつも、こんな ふうに すこしずつ ほるんだって。" }, { who: "goji", emo: "happy", text: "ガゥ♪ もっと ほりたい！" }]);
      } finally { sc.busy = false; }
      return true;
    }
    if (f.action === "touch") {
      sc.busy = true;
      try {
        Sound.se("sparkle"); for (const id of Save.d.order) Save.care(id, { mood: 1 }); Save.write();
        await UI.say([{ name: f.label, text: (this.info("touch") || {}).text || "" }, { who: "gachan", emo: "happy", text: "つるつるしてる！ 1おくねん いじょう まえの いきものなんだね。" }]);
      } finally { sc.busy = false; }
      return true;
    }
    return false;
  },
  // PokaDebug: いまの ようす（階・へや・ほねの 台・絵が できたか）
  state(sc) {
    if (!sc || !sc.room || !sc.room.museum) return null;
    const L = sc.party[0], z = this.zone(sc.floor, L.tx, L.ty);
    return {
      floor: sc.floor, zone: z && z.id, ready: !!sc.isoReady,
      stands: sc.fixtures.filter((f) => f.kind === "dinostand").map((f) => { const d = Fossils.dino(f.dino), have = d.art.parts.filter((p) => Museum.gaveBone(d.id + "." + p.id)).length; return { dino: f.dino, have, total: d.art.parts.length, drawn: !!DinoHallArt.skelImg(sc, d, DinoHallArt.bits(d), DinoHallArt.standW(f, d), false), x: f.x, y: f.y }; }),
      robot: { roar: G.t - (DinoHallArt.roarT || -99) < 1.6, roars: DinoHallArt.roars || 0 }, labels: sc.fixtures.filter((f) => f.action).map((f) => f.label),
    };
  },
};
