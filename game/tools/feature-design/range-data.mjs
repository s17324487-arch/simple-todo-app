// ⑥ 射撃場（エアガンの まとあて）の 元データ（build-range.mjs が 検査して RANGE_DATA に する）。
// じゅうは「実際に ある エアガンの かたち」を 参考に した 9しゅ（ハンドガン・ライフル・スナイパー ライフル 3しゅずつ）。
//   ゲームの 名前・絵は オリジナル（実在の 商品名・ロゴ・刻印は つかわない）。参考に した 形と 寸法の 出典は GUN_LIST.md。
//   len / h は 実物の 長さ・高さ（mm）。絵は この 比の まま 描く（gun-art-ref.js）。
// まとは 紙の まと・かん・ふうせん・ほし・かね だけ（人や どうぶつの 形は つかわない。AGENTS.md の 9）。
// 性能: mag たまの 数・rate 1びょうに うてる 数・auto おしっぱなしで れんしゃ・spread ばらつき（px）・recoil はねあがり（px）
//       reload たまを こめる 時間（びょう）・zoom スコープの ばいりつ・sway スコープの ゆれ（px）
export const CATS = {
  hand: { name: "ハンドガン", short: "ハンドガン", course: "near", unlock: null },
  rifle: { name: "ライフル", short: "ライフル", course: "mid", unlock: { cat: "hand", stars: 1 } },
  sniper: { name: "スナイパー ライフル", short: "スナイパー", course: "far", unlock: { cat: "rifle", stars: 1 } },
};

export const GUNS = [
  // ---- ハンドガン（ちかくの まと）----
  { id: "auto", cat: "hand", name: "オートマチック", power: "ガス", len: 186, h: 138,
    ref: "ポリマー フレームの じどう けんじゅう（グロック17 など）", mag: 15, rate: 5, auto: false, spread: 6, recoil: 12, reload: 1.2,
    desc: "かるくて あつかいやすい。\nつづけて どんどん うてるよ。",
    fact: "ガスの ちからで うえの スライドが\nうしろに うごく「ブローバック」。\nうつたびに ぽんと 手ごたえが あるよ。" },
  { id: "revolver", cat: "hand", name: "リボルバー", power: "ガス", len: 243, h: 152,
    ref: "4インチ ステンレスの リボルバー（S&W M686 など）", mag: 6, rate: 2.5, auto: false, spread: 3, recoil: 18, reload: 1.6,
    desc: "まるい シリンダーが くるっと まわる。\nたまは 6ぱつ。ねらいやすいよ。",
    fact: "ひきがねを ひくと シリンダーが まわって\nつぎの たまが じゅんばんに ならぶ。" },
  { id: "classic", cat: "hand", name: "クラシック", power: "ガス", len: 216, h: 140,
    ref: "1911がたの じどう けんじゅう（M1911A1 など）", mag: 8, rate: 3.5, auto: false, spread: 4, recoil: 14, reload: 1.3,
    desc: "100ねん いじょう まえから ある かたち。\nきの グリップが かっこいい。",
    fact: "1911ねんに できた かたちが いまも にんき。\nうしろの ハンマーが たまを うちだす。" },
  // ---- ライフル（まんなかの まと）----
  { id: "carbine", cat: "rifle", name: "カービン", power: "でんき", len: 840, h: 250,
    ref: "M4がたの カービン（M4A1 など・ストックを のばした ながさ）", mag: 30, rate: 8, auto: true, spread: 7, recoil: 5, reload: 1.8,
    desc: "ボタンを おしっぱなしで れんしゃ。\nたまが 30ぱつ はいるよ。",
    fact: "モーターで ピストンを うごかして\nくうきで たまを とばす「でんどうガン」。" },
  { id: "lever", cat: "rifle", name: "レバーアクション", power: "ガス", len: 977, h: 180,
    ref: "1873がたの レバー アクション カービン（ウィンチェスター M1873 など）", mag: 10, rate: 1.6, auto: false, spread: 3, recoil: 10, reload: 2.2,
    desc: "わっかの レバーを がちゃっと うごかして\n1ぱつずつ。むかしの せいぶの かたち。",
    fact: "ひきがねの まわりの わっかを さげて もどすと\nつぎの たまが じゅんびされる。" },
  { id: "match", cat: "rifle", name: "きょうぎ エアライフル", power: "くうき", len: 1080, h: 230,
    ref: "10m きょうぎ用 エアライフル（ワルサー LG400 など）", mag: 1, rate: 1.2, auto: false, spread: 1, recoil: 2, reload: 0.9,
    desc: "オリンピックの きょうぎでも つかう かたち。\n1ぱつずつ しずかに ねらう。",
    fact: "10メートル さきの まとの まんなか（10てん）は\nたった 0.5ミリ。とても こまかく ねらうよ。" },
  // ---- スナイパー ライフル（とおくの まと）----
  { id: "bolt", cat: "sniper", name: "ボルトアクション", power: "ばね", len: 1092, h: 205,
    ref: "ボルト アクションの ライフル（M24 SWS・VSR-10 など）", mag: 10, rate: 0.9, auto: false, spread: 1.5, recoil: 16, reload: 2.0, zoom: 3, sway: 8,
    desc: "ボルトを ひいて おして 1ぱつずつ。\nスコープで とおくが よく みえる。",
    fact: "ばねを ぎゅっと ちぢめて その ちからで\nくうきを おしだす「エアーコッキング」。\nでんきも ガスも いらない。" },
  { id: "heavy", cat: "sniper", name: "ヘビー ボルト", power: "ばね", len: 1120, h: 235,
    ref: "サムホール ストックの ボルト アクション（L96A1 など・サイレンサーつき）", mag: 8, rate: 0.8, auto: false, spread: 1, recoil: 12, reload: 2.4, zoom: 4, sway: 5,
    desc: "おおきくて おもい。そのぶん ゆれが すくない。\nにぎる ところに あなが あるよ。",
    fact: "にぎる ところに 手を とおす あなが ある\n「サムホール ストック」。ほおを のせる ところも。" },
  { id: "semi", cat: "sniper", name: "セミオート スコープ", power: "ガス", len: 1029, h: 240,
    ref: "AR-10がたの セミオート ライフル（M110・SR-25 など）", mag: 12, rate: 2, auto: false, spread: 2, recoil: 9, reload: 2.0, zoom: 2.5, sway: 10,
    desc: "ひきがねを ひくたびに 1ぱつ。\nスコープつきで つづけて うてる。",
    fact: "うった ときの ちからで つぎの たまを\nじゅんびする「セミオート」。" },
];

// まとの しゅるい（点・大きさは 1ばいの ときの 論理 px。z は おく ゆき: 大きいほど とおく 小さい）
// hit: "ring"（まるい まと。まんなか 3・つぎ 2・そと 1）／"box"／"circle"
export const TARGETS = {
  plate: { name: "まるい まと", r: 22, hit: "ring", pts: [3, 2, 1], se: "ding" },
  can: { name: "かん", w: 22, h: 30, hit: "box", pts: 1, se: "hit", fall: true },
  popup: { name: "ぴょこっと まと", r: 20, hit: "ring", pts: [3, 2, 1], se: "ding" },
  balloon: { name: "ふうせん", r: 16, hit: "circle", pts: 2, se: "pop" },
  star: { name: "きらきら ほし", r: 14, hit: "circle", pts: 5, se: "sparkle" },
  gong: { name: "かね", r: 12, hit: "circle", pts: 2, se: "ding" },
  far: { name: "とおくの まと", r: 10, hit: "ring", pts: [5, 3, 1], se: "ding" },
};

// コース（まとの でかた）。t: でる じかん（びょう）。motion:
//   rail … よこに うごく（x から vx px/びょう。はしで はねかえる）／swing … ふりこ（x を 中心に amp px・period びょう）
//   rise … したから うえへ（vy。ゆらゆら）／pop … win の どれかから ぴょこっと（life びょう）／stay … とまって いる（かんは あたると おちる）
// y は 床の おく ゆき（0 おく 〜 1 てまえ）、x は -1（ひだり）〜 1（みぎ）。every で くりかえし。
export const COURSES = {
  near: { name: "ちかくの まと（5m）", time: 30, stars: [18, 36, 56],
    items: [
      { kind: "can", motion: "stay", xs: [-0.62, -0.38, -0.14, 0.14, 0.38, 0.62], y: 0.62, t: 0, respawn: 5 },
      { kind: "popup", motion: "pop", win: [-0.7, -0.25, 0.25, 0.7], y: 0.42, t: 2, every: 1.3, life: 1.5 },
      { kind: "plate", motion: "rail", x: -0.9, vx: 0.28, y: 0.3, t: 0 },
      { kind: "star", motion: "rail", x: 1, vx: -0.9, y: 0.34, t: 12, every: 9 },
    ] },
  mid: { name: "まんなかの まと（15m）", time: 30, stars: [20, 40, 62],
    items: [
      { kind: "balloon", motion: "rise", xs: [-0.7, -0.35, 0, 0.35, 0.7], y: 0.7, vy: 0.07, t: 0.5, every: 1.2 },
      { kind: "plate", motion: "rail", x: -0.9, vx: 0.24, y: 0.3, t: 0 },
      { kind: "plate", motion: "rail", x: 0.9, vx: -0.32, y: 0.42, t: 1 },
      { kind: "plate", motion: "swing", x: -0.45, amp: 0.18, period: 3.2, y: 0.2, t: 0 },
      { kind: "plate", motion: "swing", x: 0.45, amp: 0.18, period: 3.8, y: 0.2, t: 0 },
      { kind: "star", motion: "rail", x: -1, vx: 1.1, y: 0.12, t: 8, every: 8 },
    ] },
  far: { name: "とおくの まと（50m）", time: 35, stars: [12, 26, 42],
    items: [
      { kind: "far", motion: "rail", x: -0.8, vx: 0.08, y: 0.12, t: 0 },
      { kind: "far", motion: "rail", x: 0.7, vx: -0.1, y: 0.2, t: 0 },
      { kind: "far", motion: "rail", x: 0, vx: 0.12, y: 0.06, t: 3 },
      { kind: "far", motion: "rail", x: -0.3, vx: -0.06, y: 0.26, t: 6 },
      { kind: "gong", motion: "swing", x: -0.5, amp: 0.06, period: 2.4, y: 0.16, t: 0 },
      { kind: "gong", motion: "swing", x: 0.5, amp: 0.06, period: 2.9, y: 0.16, t: 0 },
      { kind: "star", motion: "pop", win: [-0.6, -0.2, 0.2, 0.6], y: 0.04, t: 10, every: 10, life: 2.5 },
    ] },
};
// れんぞくで あてると ボーナス（combo 回め から 1ぱつ +1）
export const COMBO = { from: 5, bonus: 1 };
// ごほうび: GameEconomy.pay と 同じ 形（shopBase.range = 60 × [0, 0.45, 1, 1.5][★]）
export const PAY = { base: 60, rank: [0, 0.45, 1, 1.5] };

// 射撃場の 人（はじめての ときに 安全の やくそく）
export const STAFF = { id: "range_staff", talk: "range_staff", name: "しゃてきじょうの ラビ", sp: "rabbit", outfit: { face: "sunglasses" } };
export const TALK = {
  first: ["いらっしゃい！ ここは まとあての しゃてきじょう。", "やくそくが 3つ あるよ。\nゴーグルを つける。まとだけを ねらう。", "ひとや どうぶつには ぜったいに むけない。\nじゅんびが できたら はじめよう！"],
  lines: ["きょうは どの じゅうに する？", "ゴーグル、ちゃんと つけた？", "とおくの まとは、しずかに ねらうと あたるよ。", "かんを ぜんぶ おとすと きもちいいよ！"],
  lock: "{cat}で ★1を とると あそべるよ。",
  pick: "だれが うつ？",
  // えらんだ 子の ひとこと（はじめる とき）
  go: {
    wanko: ["まかせて！ せいぎの ねらいうち！", "クンクン… まとの においは しないけど、がんばる！"],
    gachan: ["こ、こわくない… がちゃん、がんばる！", "おと、びっくり しないように… えいっ！"],
    goji: ["ガウっ！ ぜんぶ あてる…ガゥ", "おっきく なる れんしゅう…ガゥ"],
  },
  // のこりの 2人の おうえん（あたり・れんぞく・のこり じかん・おわり）
  cheer: {
    wanko: { hit: ["ナイス！", "わうーん！ あたった！"], combo: ["すごい れんぞくだ！"], hurry: ["あと すこし！ いけー！"], end: ["かっこよかった！"] },
    gachan: { hit: ["あたった〜！", "すごい すごい！"], combo: ["ままー、みて！ すごいの！"], hurry: ["がんばって〜！"], end: ["がちゃんも どきどき した〜"] },
    goji: { hit: ["ガウっ！ ナイス", "いい ねらい…ガゥ"], combo: ["れんぞく…ガゥ！"], hurry: ["いそげ〜 ガウっ"], end: ["ぼくも やりたい…ガゥ"] },
  },
  result: { 0: "ざんねん… もう いちど やって みよう！", 1: "やったね！ ★1つ！", 2: "じょうず！ ★2つ！", 3: "すごい！ ★3つ！ めいじんだ！" },
};
// 町に たてる 場所（シティ。② の 町の人が「シティの しゃてきじょう」と 話す）
export const OUTSIDE = { map: "city", id: "city_range", x: 1, y: 11, w: 5, h: 4, label: "シティ しゃてきじょう", roof: "#E35D5B", facility: "range" };
