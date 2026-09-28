// ⑤ 水族館と 恐竜博物館の 元データ（build-museum.mjs が 検査して MUSEUM_DATA に する）。
// へや（rooms）を ならべて 地図を つくる。へやと へやの あいだの 1マスは かべ。doors で かべに 出入り口を あける。
// objects: 展示物（MuseumArtRef.prop の kind）。fish / dino が 寄贈で ふえる 展示。walk: true は 上を 歩ける かざり（トンネル・エスカレーター・矢印）。
// 順路は 実際の 館を 参考に（出典は MUSEUM_LIST.md）:
//   水族館 … 入口の アクアトンネル → エスカレーターで 上へ → やまの さわ → さとの かわ → いけと たんぼ → 大水槽の まわりを ぐるっと 下る → いその ひろば → よるの うみ（しんかい）→ おみやげ
//   博物館 … 入口 → きょうりゅうの とう を 見ながら エスカレーターで 下へ → かせきの みち → きょうりゅうの せかい（ホール）→ けんきゅうしつ（寄贈）→ たまごの へや → おみやげ
// 館の 中の マスの 文字（ゲームの いまの タイル文字と ぶつからない 文字だけを つかう。build-museum.mjs が たしかめる）
// ゲームでは tiles.js の GROUND に 床の しゅるい、SOLID_CH に "X" を 足す（CODEX_TASK.md の 3）
export const TILES = {
  X: { name: "かべ", ground: "museum_wall", solid: true, color: "#5E5868" },
  E: { name: "出入り口の マット", ground: "museum_mat", color: "#C8B89A" },
  0: { name: "タイルの ゆか", ground: "museum_tile", color: "#E8E2D6" },
  1: { name: "トンネルの ゆか", ground: "museum_tunnel", color: "#2E5E86" },
  2: { name: "エスカレーター", ground: "museum_escalator", color: "#8C949C" },
  3: { name: "こけの いしだたみ", ground: "museum_moss", color: "#A8BC98" },
  4: { name: "かわらの すな", ground: "museum_sand", color: "#D8CCA8" },
  5: { name: "くさの ゆか", ground: "museum_grass", color: "#BCCB94" },
  6: { name: "うみの じゅうたん", ground: "museum_sea", color: "#34507A" },
  7: { name: "いたの ゆか", ground: "museum_board", color: "#C8A070" },
  8: { name: "よるの じゅうたん", ground: "museum_night", color: "#1E2A48" },
  9: { name: "もくの ゆか", ground: "museum_wood", color: "#C8A06A" },
  S: { name: "いしの ゆか", ground: "museum_stone", color: "#B8AEA0" },
  H: { name: "しろい ゆか", ground: "museum_lab", color: "#EEF2F4" },
};

export const BUILDINGS = {
  aquarium: {
    name: "ぽかぽか すいぞくかん", W: 36, H: 39, outside: { map: "harbor", id: "harbor_aquarium", replace: "harbor_customs", x: 2, y: 29, w: 7, h: 3, label: "ぽかぽか すいぞくかん", roof: "#7EC8E0", facility: "aquarium", style: "harbor_aquarium" },
    rooms: [
      { id: "entrance", name: "いりぐち", x: 1, y: 33, w: 8, h: 5, f: "0", intro: "ようこそ！ みずの たびに でかけよう。" },
      { id: "tunnel", name: "アクアトンネル", x: 2, y: 12, w: 4, h: 21, f: "1", intro: "あたまの うえを さかなが およいで いるよ。" },
      { id: "esc", name: "エスカレーター", x: 2, y: 9, w: 4, h: 3, f: "2", intro: "エスカレーターで やまの うえへ のぼろう。" },
      { id: "stream", name: "やまの さわ", x: 1, y: 1, w: 11, h: 8, f: "3", intro: "つめたくて きれいな みずに すむ さかなたち。" },
      { id: "river", name: "さとの かわ", x: 13, y: 1, w: 11, h: 8, f: "4", intro: "ながれに まけずに およぐ かわの さかなたち。" },
      { id: "pond", name: "いけと たんぼ", x: 25, y: 1, w: 10, h: 10, f: "5", intro: "いけや たんぼで のんびり くらす さかなたち。" },
      { id: "ring", name: "だいすいそう「しおかぜの うみ」", x: 9, y: 11, w: 19, h: 19, f: "6", intro: "うみの さかなが いっしょに およぐ だいすいそう。" },
      { id: "tide", name: "いその ひろば", x: 29, y: 14, w: 6, h: 15, f: "7", intro: "いわの かげに かくれる いその さかなたち。" },
      { id: "deep", name: "よるの うみ・しんかい", x: 10, y: 31, w: 11, h: 7, f: "8", intro: "くらくて ふかい うみに すむ ふしぎな さかな。" },
      { id: "shop", name: "おみやげ", x: 22, y: 31, w: 13, h: 7, f: "0", intro: "おみやげ コーナー。きょうの おもいでに どうぞ。" },
    ],
    doors: [[12, 4], [12, 5], [24, 4], [24, 5], [28, 20], [28, 21], [15, 30], [16, 30], [21, 34], [21, 35]],
    exits: [{ x: 4, y: 38, w: 2, to: "harbor", role: "in" }, { x: 28, y: 38, w: 2, to: "harbor", role: "out" }],
    objects: [
      { id: "aq_falls", kind: "walltank", x: 2, y: 1, w: 6, h: 2, theme: "stream", falls: true, label: "たきの すいそう", fish: ["iwana", "amago", "sakuramasu"] },
      { id: "aq_rock", kind: "walltank", x: 8, y: 1, w: 4, h: 2, theme: "stream", label: "いしの した", fish: ["kajika"] },
      { id: "aq_ito", kind: "islandtank", x: 4, y: 5, w: 5, h: 2, theme: "stream", label: "まぼろしの イトウ", fish: ["ito"] },
      { id: "aq_flow", kind: "walltank", x: 13, y: 1, w: 11, h: 2, theme: "river", label: "かわの ながれ", fish: ["ayu", "oikawa", "ugui", "kawamutsu", "yamame", "nijimasu", "sake"] },
      { id: "aq_bed", kind: "islandtank", x: 15, y: 5, w: 6, h: 2, theme: "river", label: "かわの そこ", fish: ["yoshinobori", "donko", "kamatsuka", "unagi"] },
      { id: "aq_pond", kind: "walltank", x: 25, y: 1, w: 6, h: 2, theme: "pond", label: "いけの すいそう", fish: ["magoi", "nishikigoi", "ginbuna", "namazu"] },
      { id: "aq_lake", kind: "walltank", x: 31, y: 1, w: 4, h: 2, theme: "river", label: "みずうみ", fish: ["wakasagi"] },
      { id: "aq_paddy", kind: "islandtank", x: 26, y: 6, w: 4, h: 2, theme: "pond", label: "たんぼと おがわ", fish: ["dojo", "yaritanago", "motsugo"] },
      { id: "aq_bowl", kind: "islandtank", x: 31, y: 5, w: 3, h: 2, theme: "pond", label: "メダカと キンギョ", fish: ["medaka", "kingyo"] },
      { id: "aq_big", kind: "bigtank", x: 13, y: 14, w: 11, h: 13, depth: 78, label: "しおかぜの うみ", fish: ["aji", "saba", "iwashi", "madai", "ishidai", "kurodai", "suzuki", "buri", "sayori", "kisu", "hirame", "makogarei", "manbo"] },
      { id: "aq_iso", kind: "lowtank", x: 30, y: 16, w: 4, h: 3, label: "いその すいそう", fish: ["kasago", "haze", "kusafugu", "kawahagi"] },
      { id: "aq_reef", kind: "lowtank", x: 30, y: 22, w: 4, h: 3, label: "いわばの すいそう", fish: ["kyusen", "ainame", "mebaru"] },
      { id: "aq_night", kind: "walltank", x: 10, y: 31, w: 5, h: 2, theme: "deep", label: "よるの うみ", fish: ["tachiuo", "anago"] },
      { id: "aq_abyss", kind: "walltank", x: 16, y: 31, w: 5, h: 2, theme: "deep", label: "しんかい", fish: ["ryugunotsukai"] },
      { id: "aq_coela", kind: "pedestal", x: 14, y: 35, w: 3, h: 2, label: "いきている かせき", fish: ["shirakansu"] },
      { id: "aq_jelly1", kind: "jelly", x: 11, y: 35, w: 2, h: 2, label: "くらげ" },
      { id: "aq_jelly2", kind: "jelly", x: 18, y: 35, w: 2, h: 2, label: "くらげ" },
      { id: "aq_tunnel", kind: "tunnel", x: 2, y: 12, w: 4, h: 21, walk: true },
      { id: "aq_esc", kind: "escalator", x: 2, y: 9, w: 4, h: 3, walk: true },
      { id: "aq_desk", kind: "desk", x: 5, y: 33, w: 3, h: 1, label: "うけつけ" },
      { id: "aq_shelf1", kind: "shelf", x: 23, y: 31, w: 3, h: 1 }, { id: "aq_shelf2", kind: "shelf", x: 27, y: 31, w: 3, h: 1 }, { id: "aq_reg", kind: "desk", x: 31, y: 33, w: 3, h: 1, label: "レジ" },
      { id: "aq_bench1", kind: "bench", x: 15, y: 28, w: 2, h: 1 }, { id: "aq_bench2", kind: "bench", x: 20, y: 28, w: 2, h: 1 },
      { id: "aq_plant1", kind: "plant", x: 1, y: 36, w: 1, h: 1 }, { id: "aq_plant2", kind: "plant", x: 34, y: 36, w: 1, h: 1 },
      { id: "aq_sign_st", kind: "sign", x: 9, y: 7, w: 3, h: 1, text: "やまの さわ", col: "#DDEFD6" }, { id: "aq_sign_ri", kind: "sign", x: 21, y: 7, w: 3, h: 1, text: "さとの かわ", col: "#F2E8CC" },
      { id: "aq_sign_po", kind: "sign", x: 32, y: 8, w: 3, h: 1, text: "いけ", col: "#E6EFCC" }, { id: "aq_sign_ti", kind: "sign", x: 29, y: 27, w: 3, h: 1, text: "いその ひろば", col: "#F4E2C4" },
      { id: "aq_arrow1", kind: "arrow", x: 26, y: 13, dir: 180, walk: true }, { id: "aq_arrow2", kind: "arrow", x: 25, y: 22, dir: 180, walk: true }, { id: "aq_arrow3", kind: "arrow", x: 18, y: 28, dir: 270, walk: true }, { id: "aq_arrow4", kind: "arrow", x: 11, y: 20, dir: 0, walk: true }, { id: "aq_arrow5", kind: "arrow", x: 4, y: 26, dir: 0, walk: true },
    ],
    npcs: [{ id: "aq_curator", talk: "aq_curator", name: "かんちょうの マリン", sp: "penguin", outfit: { face: "glasses", neck: "bowtie_blue" }, x: 3, y: 35, role: "donate" }],
    route: ["entrance", "tunnel", "esc", "stream", "river", "pond", "ring", "tide", "deep", "shop"],
  },
  museum: {
    name: "きょうりゅう はくぶつかん", W: 36, H: 34, outside: { map: "city", id: "city_museum", replace: "city_gallery", x: 15, y: 16, w: 6, h: 4, label: "きょうりゅう はくぶつかん", roof: "#D9B47A", facility: "museum", style: "city_museum" },
    rooms: [
      { id: "entrance", name: "いりぐち", x: 14, y: 28, w: 8, h: 5, f: "0", intro: "ようこそ！ きょうりゅうの じだいへ でかけよう。" },
      { id: "esc", name: "エスカレーター", x: 16, y: 20, w: 4, h: 8, f: "2", intro: "ながい エスカレーターで むかしへ おりて いこう。" },
      { id: "street", name: "かせきの みち", x: 2, y: 17, w: 32, h: 3, f: "S", intro: "いしの なかに むかしの いきものが いるよ。" },
      { id: "hall", name: "きょうりゅうの せかい", x: 2, y: 1, w: 32, h: 14, f: "9", intro: "じだいごとに きょうりゅうが ならんで いるよ。" },
      { id: "lab", name: "けんきゅうしつ", x: 25, y: 22, w: 9, h: 6, f: "H", intro: "ほった ほねを きれいに して くみたてる へや。" },
      { id: "eggs", name: "たまごの へや", x: 2, y: 22, w: 9, h: 5, f: "9", intro: "きょうりゅうも たまごから うまれたんだ。" },
      { id: "shop", name: "おみやげ", x: 2, y: 28, w: 10, h: 5, f: "0", intro: "おみやげ コーナー。きょうの おもいでに どうぞ。" },
    ],
    doors: [[16, 15], [17, 15], [18, 15], [19, 15], [16, 16], [17, 16], [18, 16], [19, 16], [32, 20], [32, 21], [6, 20], [6, 21], [6, 27]],
    exits: [{ x: 17, y: 33, w: 2, to: "city", role: "in" }, { x: 6, y: 33, w: 2, to: "city", role: "out" }],
    objects: [
      { id: "mu_stego", kind: "stand", x: 3, y: 4, w: 6, h: 2, dino: "stego", label: "ステゴサウルス" },
      { id: "mu_trex", kind: "stand", x: 12, y: 4, w: 7, h: 2, dino: "trex", label: "ティラノサウルス" },
      { id: "mu_tricera", kind: "stand", x: 21, y: 4, w: 6, h: 2, dino: "tricera", label: "トリケラトプス" },
      { id: "mu_para", kind: "stand", x: 27, y: 4, w: 7, h: 2, dino: "para", label: "パラサウロロフス" },
      { id: "mu_brachio", kind: "stand", x: 3, y: 9, w: 9, h: 2, dino: "brachio", label: "ブラキオサウルス" },
      { id: "mu_raptor", kind: "stand", x: 14, y: 9, w: 4, h: 2, dino: "raptor", label: "ヴェロキラプトル" },
      { id: "mu_spino", kind: "stand", x: 19, y: 9, w: 8, h: 2, dino: "spino", label: "スピノサウルス" },
      { id: "mu_ankylo", kind: "stand", x: 28, y: 9, w: 6, h: 2, dino: "ankylo", label: "アンキロサウルス" },
      { id: "mu_compso", kind: "stand", x: 5, y: 13, w: 3, h: 2, dino: "compso", label: "コンプソグナトゥス" },
      { id: "mu_fukui", kind: "stand", x: 24, y: 13, w: 5, h: 2, dino: "fukui", label: "フクイラプトル" },
      { id: "mu_sign_j", kind: "sign", x: 9, y: 13, w: 3, h: 1, text: "ジュラき", col: "#DDEFD6" }, { id: "mu_sign_k", kind: "sign", x: 20, y: 13, w: 3, h: 1, text: "はくあき", col: "#F4E2C4" },
      { id: "mu_sign_jp", kind: "sign", x: 30, y: 13, w: 3, h: 1, text: "にほん", col: "#FDE2E2" },
      { id: "mu_f1", kind: "fossilwall", x: 3, y: 17, w: 3, h: 1, fossil: "ammonite", label: "アンモナイト" }, { id: "mu_f2", kind: "fossilwall", x: 7, y: 17, w: 3, h: 1, fossil: "fishfossil", label: "さかなの かせき" },
      { id: "mu_f3", kind: "fossilwall", x: 11, y: 17, w: 3, h: 1, fossil: "footprint", label: "あしあと" }, { id: "mu_f4", kind: "fossilwall", x: 22, y: 17, w: 3, h: 1, fossil: "amber", label: "こはく" },
      { id: "mu_f5", kind: "fossilwall", x: 26, y: 17, w: 3, h: 1, fossil: "trilobite", label: "さんようちゅう" }, { id: "mu_f6", kind: "fossilwall", x: 30, y: 17, w: 3, h: 1, fossil: "ammonite", label: "アンモナイト" },
      { id: "mu_esc", kind: "escalator", x: 16, y: 21, w: 4, h: 5, walk: true },
      { id: "mu_tower", kind: "tower", x: 20, y: 28, w: 2, h: 2, label: "きょうりゅうの とう" },
      { id: "mu_desk", kind: "desk", x: 14, y: 29, w: 3, h: 1, label: "うけつけ" },
      { id: "mu_lab", kind: "lab", x: 26, y: 22, w: 6, h: 2, label: "ほねを きれいに する へや", boneOf: "trex.skull" },
      { id: "mu_give", kind: "desk", x: 27, y: 25, w: 4, h: 1, label: "きふの まどぐち" },
      { id: "mu_nest", kind: "nest", x: 4, y: 23, w: 4, h: 3, label: "きょうりゅうの たまご" },
      { id: "mu_shelf1", kind: "shelf", x: 3, y: 28, w: 3, h: 1 }, { id: "mu_shelf2", kind: "shelf", x: 7, y: 28, w: 3, h: 1 }, { id: "mu_reg", kind: "desk", x: 3, y: 31, w: 3, h: 1, label: "レジ" },
      { id: "mu_plant1", kind: "plant", x: 2, y: 1, w: 1, h: 1 }, { id: "mu_plant2", kind: "plant", x: 33, y: 1, w: 1, h: 1 },
      { id: "mu_arrow1", kind: "arrow", x: 17, y: 18, dir: 0, walk: true }, { id: "mu_arrow2", kind: "arrow", x: 18, y: 7, dir: 90, walk: true }, { id: "mu_arrow3", kind: "arrow", x: 24, y: 18, dir: 90, walk: true }, { id: "mu_arrow4", kind: "arrow", x: 10, y: 18, dir: 270, walk: true },
    ],
    npcs: [{ id: "mu_doctor", talk: "mu_doctor", name: "くまの はかせ ドン", sp: "bear", outfit: { face: "glasses", neck: "bowtie_red" }, x: 29, y: 26, role: "donate" }],
    route: ["entrance", "esc", "street", "hall", "street", "lab", "eggs", "shop"],
  },
};
// 寄贈の ときの ことば（町の人の ことばと 同じ きまり: 1ページ 2行・1行 30 まで）
// 展示を タップした ときの 説明（魚・恐竜の 展示は FISHING_DATA / FOSSIL_DATA の 説明を つかう）。
// objects の fossil（化石の かべ）か kind が ここの キーと おなじなら、build-museum.mjs が その 展示に info: キー を つける。
// 出典は MUSEUM_LIST.md の「展示の 説明の 出典」
export const INFO = {
  ammonite: { name: "アンモナイト", text: "イカや タコの なかま。\nうずまきの からで うみを およいだ。\nきょうりゅうと おなじ ころに いなくなった。" },
  fishfossil: { name: "さかなの かせき", text: "むかしの さかなが どろに うまって、\nながい じかんを かけて いしに なった。\nほねの ならびが よく わかるよ。" },
  footprint: { name: "あしあとの かせき", text: "きょうりゅうが あるいた あとが\nいしに のこった もの。\nあしあとの おおきさと あいだの ながさで\nあるく はやさも わかるんだ。" },
  amber: { name: "こはく", text: "きの やにが ながい じかんを かけて\nかたまった もの。\nむしが とじこめられて いる ことも あるよ。" },
  trilobite: { name: "さんようちゅう", text: "きょうりゅうより ずっと まえの\nうみに いた いきもの。\nかたい からで みを まもって いた。" },
  jelly: { name: "くらげ", text: "ほねも のうも ない ふしぎな いきもの。\nからだの ほとんどが みずで できて いる。\nながれに のって ふわふわ ただようよ。" },
  tunnel: { name: "アクアトンネル", text: "あたまの うえを さかなが およいで いく\nみずの トンネル。うえも みてね！" },
  nest: { name: "きょうりゅうの たまご", text: "きょうりゅうも たまごから うまれた。\nすに たまごを ならべて\nあたためる なかまも いたよ。" },
  tower: { name: "きょうりゅうの とう", text: "にほんで みつかった きょうりゅうを\nつみあげた とう。\nいちばん うえまで かぞえて みよう！" },
  lab: { name: "ほねを きれいに する へや", text: "ほった ほねに ついた いしを\nすこしずつ けずって きれいに するよ。\nとても じかんが かかる しごとなんだ。" },
};

export const TALK = {
  aq_curator: {
    first: "ようこそ、ぽかぽか すいぞくかんへ！\nつった さかなを きふして くれたら、すいそうに ふえるよ。",
    ask: "どの さかなを きふして くれる？", thanks: "ありがとう！ すいそうで げんきに およいで いるよ。", none: "いけすに まだ きふできる さかなが いないみたい。", all: "50しゅ ぜんぶ そろった！ すごい すいぞくかんに なったね。",
    lines: ["すいそうを しらべると、なかの さかなが わかるよ。", "まだ いない さかなは「？？？」に なって いるの。", "おおきな すいそうの まわりを ぐるっと まわってね。", "よるの うみの へやは、ちょっと くらいから ゆっくりね。"],
  },
  mu_doctor: {
    first: "ここは きょうりゅう はくぶつかん。\nほった ほねを きふして くれたら、くみたてるよ。",
    ask: "どの ほねを きふして くれる？", thanks: "りっぱな ほねじゃ！ さっそく くみたてよう。", done: "ぜんぶ そろった！ {dino}の がいこつが かんせいじゃ！", none: "まだ きふできる ほねが ないようじゃ。", all: "10しゅ ぜんぶ かんせい！ せかいいちの はくぶつかんじゃ。",
    lines: ["ほねは どうくつや がけの いわに ねむって おる。", "たりない ほねは、だいの うえで てんせんに なって おるぞ。", "ホールの きょうりゅうは、じだいの じゅんに ならんで おる。", "かせきを ほる ときは、こつこつ ていねいに じゃ。"],
  },
};
// 館の BGM（sound.js の SONGS と 同じ 書きかた。1トークン = 8分音符・"." のばす・"_" やすみ・"|" は 小せつの くぎり）。オリジナル
export const SONGS = {
  aquarium: {
    bpm: 76,
    tracks: [
      { wave: "sine", vol: 0.13, gate: 0.7, rel: 0.35, notes: "D5 . F#5 . A5 . . . | B5 . A5 . F#5 . E5 . | D5 . E5 . F#5 . A5 . | E5 . . . . . _ . | G5 . F#5 . E5 . D5 . | F#5 . E5 . D5 . B4 . | C#5 . D5 . E5 . A4 . | D5 . . . . . _ ." },
      { wave: "triangle", vol: 0.14, notes: "D3 . A3 . F#3 . A3 . | G2 . D3 . B2 . D3 . | D3 . A3 . F#3 . A3 . | A2 . E3 . C#3 . E3 . | G2 . D3 . B2 . D3 . | D3 . A3 . F#3 . A3 . | A2 . E3 . C#3 . E3 . | D3 . A2 . D3 . _ ." },
      { wave: "sine", vol: 0.04, gate: 0.5, rel: 0.5, notes: "_ _ _ _ _ _ A6 _ | _ _ _ _ _ _ F#6 _ | _ _ _ _ _ _ B6 _ | _ _ _ _ _ _ E6 _ | _ _ _ _ _ _ G6 _ | _ _ _ _ _ _ D6 _ | _ _ _ _ _ _ C#6 _ | _ _ _ _ _ _ D6 _" },
    ],
  },
  museum: {
    bpm: 96,
    tracks: [
      { wave: "triangle", vol: 0.16, gate: 0.55, notes: "A4 . C5 . E5 . D5 C5 | B4 . G4 . E4 . G4 . | A4 . C5 . E5 . A5 . | G5 . . . E5 . _ . | F5 . E5 . D5 . C5 . | B4 . C5 . D5 . G4 . | A4 . B4 . C5 . E5 . | A4 . . . _ . _ ." },
      { wave: "triangle", vol: 0.2, notes: "A2 . E3 . A2 . E3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . D3 . | F2 . C3 . E2 . B2 . | A2 . E3 . A2 . _ ." },
      { drum: true, vol: 0.035, notes: "k _ _ _ h _ _ _ | k _ _ _ h _ h _" },
    ],
  },
};
