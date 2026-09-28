// ⑥ 射撃場（本格 エアガン シューティング）の 元データ。build-range.mjs が 検査し、弾道の 表と ★の めやすを 足して RANGE_DATA に する。
// オーナーの 指示で ⑥ だけは AGENTS.md の 9（ほのぼの）を はずし、実際の エアガンと 射撃競技に ちかい、ゲーム性の 高い ものに する。
//   （文言は 5 の とおり ひらがな 中心。3にんの うち 1人が うち、2人は うしろで おうえん する のは そのまま）
// 単位: 長さ・大きさ・位置 m（x よこ・y たかさ・z きょり。うつ 人の 目は y = 1.5）／ 角度 mrad（1mrad = 10m で 1cm）／ 時間 びょう／ たま g／ 初速 m/s
// 数値の 出典は GUN_LIST.md（競技の ルール・BB弾の 初速・ホップアップ・風の えいきょう）。
export const CATS = {
  hand: { name: "ハンドガン", short: "ハンドガン", unlock: null },
  rifle: { name: "ライフル", short: "ライフル", unlock: { cat: "hand", stars: 1 } },
  sniper: { name: "スナイパー ライフル", short: "スナイパー", unlock: { cat: "rifle", stars: 1 } },
};

// じゅう（len / h は 実物の 長さ・高さ mm。絵は この 比で 描く・gun-art-ref.js）
//   power  gbb ガス ブローバック・gas ガス・aeg でんどう・spring エアー コッキング
//   action semi ひきがねを ひくたび・da ダブル アクション（ひきがねが おもい: pull びょう）・auto おしっぱなしで れんしゃ・lever・bolt（cycle びょう）・single 1ぱつずつ こめる
//   bb たまの 重さ・v0 初速・group 10m での まとまり（cm・ちょっけい・サイトを のぞいた とき）・hip のぞかない ときの ばらつき（mrad・ちょっけい）
//   rate いちばん はやい れんしゃ（1びょうに）・mag たまの 数・reload マガジン こうかん・empty スライドが とまった ときの 追加・perRound 1ぱつずつ こめる 時間
//   recoil はねあがり（mrad）・back 自然に もどる わりあい・weight おもさ（kg: ゆれ と のぞく はやさ）
//   sight notch3 / ramp / notch / peep / buckhorn / diopter / scope・zoom のぞいた ときの ばいりつ（scope は [さいしょう, さいだい]）
//   zero ゼロイン（m）・sh サイトの 高さ（m）・hop ホップの つよさ（1 = はじめ じゅうりょくと つりあう）
export const GUNS = [
  // ---- ハンドガン ----
  { id: "auto", cat: "hand", name: "オートマチック", power: "gbb", action: "semi", len: 186, h: 138,
    ref: "ポリマー フレームの じどう けんじゅう（グロック17 など）", bb: 0.2, v0: 70, group: 3.5, hip: 16, rate: 6, mag: 25, reload: 1.5, empty: 0.4,
    recoil: 9, back: 0.85, weight: 0.7, sight: "notch3", zoom: 1.4, zero: 10, sh: 0.02, hop: 1.1,
    desc: "かるくて たまが 25はつ。\nスライドが うごく 手ごたえで テンポよく うてる。",
    fact: "ガスの ちからで スライドが うしろに うごく\n「ガス ブローバック」。たまが なくなると\nスライドが とまって おしえて くれる。" },
  { id: "revolver", cat: "hand", name: "リボルバー", power: "gas", action: "da", pull: 0.22, len: 243, h: 152,
    ref: "4インチ ステンレスの リボルバー（S&W M686 など）", bb: 0.2, v0: 65, group: 2.5, hip: 14, rate: 3, mag: 6, reload: 2.6, empty: 0,
    recoil: 11, back: 0.8, weight: 1.1, sight: "ramp", zoom: 1.45, zero: 10, sh: 0.022, hop: 1.1,
    desc: "まとまりが よく、ねらった ところに いく。\nでも 6はつ しか なく、ひきがねが おもい。",
    fact: "ひきがねを ひくと ハンマーが おきて\nシリンダーが まわる「ダブル アクション」。\nこめる ときは スピード ローダーで 6はつ いっぺんに。" },
  { id: "classic", cat: "hand", name: "クラシック", power: "gbb", action: "semi", len: 216, h: 140,
    ref: "1911がたの じどう けんじゅう（M1911A1 など）", bb: 0.2, v0: 72, group: 3.0, hip: 16, rate: 5, mag: 26, reload: 1.5, empty: 0.4,
    recoil: 11, back: 0.85, weight: 0.85, sight: "notch", zoom: 1.4, zero: 10, sh: 0.018, hop: 1.1,
    desc: "ほそくて かるい ひきがねで ねらいやすい。\nはねあがりは すこし 大きい。",
    fact: "1911ねんに できた かたちが いまも\nきょうぎで にんき。ひきがねが まっすぐ\nうしろに うごくので ねらいが ぶれにくい。" },
  // ---- ライフル ----
  { id: "carbine", cat: "rifle", name: "カービン", power: "aeg", action: "auto", len: 840, h: 250,
    ref: "M4がたの カービン（M4A1 など・ストックを のばした ながさ）", bb: 0.25, v0: 82, group: 4.0, hip: 20, rate: 14, mag: 30, reload: 2.2, empty: 0,
    recoil: 2.5, back: 0.9, weight: 3.0, sight: "peep", zoom: 1.4, zero: 20, sh: 0.065, hop: 1.2,
    desc: "おしっぱなしで 1びょうに 14はつ。\nはねあがりが 小さく、つぎの 的へ すぐ うつれる。",
    fact: "モーターで ピストンを うごかして くうきで\nたまを とばす「でんどうガン」。うしろの\nまるい あなから のぞいて まえの サイトを あわせる。" },
  { id: "lever", cat: "rifle", name: "レバーアクション", power: "spring", action: "lever", cycle: 0.5, len: 977, h: 180,
    ref: "1873がたの レバー アクション カービン（ウィンチェスター M1873 など）", bb: 0.25, v0: 80, group: 2.8, hip: 18, rate: 3, mag: 10, reload: 0, perRound: 0.45, empty: 0,
    recoil: 6, back: 0.8, weight: 2.6, sight: "buckhorn", zoom: 1.35, zero: 20, sh: 0.03, hop: 1.2,
    desc: "1ぱつ ごとに レバーを がちゃっと。\nチューブに 1ぱつずつ こめる。とちゅうでも うてる。",
    fact: "ひきがねの まわりの わっかを さげて もどすと\nばねが ひかれて つぎの たまが おくられる。\nV字の サイトの そこに まえの たまを のせる。" },
  { id: "match", cat: "rifle", name: "きょうぎ エアライフル", power: "spring", action: "single", len: 1080, h: 230,
    ref: "10m きょうぎ用 エアライフル の かたち（ワルサー LG400 など）", bb: 0.2, v0: 75, group: 0.8, hip: 14, rate: 1, mag: 1, reload: 0, perRound: 1.0, empty: 0,
    recoil: 1, back: 0.95, weight: 4.4, sight: "diopter", zoom: 3, zero: 10, sh: 0.05, hop: 1.05,
    desc: "1ぱつずつ こめる。とても まとまりが よく\nおもくて ゆれが すくない。せいみつ しゃげき むき。",
    fact: "10m きょうぎの 10てんは ちょっけい 0.5mm の 点。\nうしろの リング（ダイオプター）と まえの リングを\nかさねて、くろい まとを まんなかに いれる。" },
  // ---- スナイパー ライフル ----
  { id: "bolt", cat: "sniper", name: "ボルトアクション", power: "spring", action: "bolt", cycle: 0.8, len: 1092, h: 205,
    ref: "ボルト アクションの ライフル（M24 SWS・VSR-10 など）", bb: 0.28, v0: 80, group: 1.2, hip: 16, rate: 5, mag: 30, reload: 2.4, empty: 0,
    recoil: 5, back: 0.7, weight: 2.0, sight: "scope", zoom: [3, 9], zero: 30, sh: 0.05, hop: 1.3,
    desc: "1ぱつ ごとに ボルトを ひいて おす。\nスコープは 3〜9ばい。ホップを あわせて とおくへ。",
    fact: "ばねを ちぢめて くうきを おしだす\n「エアー コッキング」。でんきも ガスも いらず\nいちばん とびが おちつく しくみ。" },
  { id: "heavy", cat: "sniper", name: "ヘビー ボルト", power: "spring", action: "bolt", cycle: 0.9, len: 1120, h: 235,
    ref: "サムホール ストックの ボルト アクション（L96A1 など・サイレンサーつき）", bb: 0.28, v0: 80, group: 1.0, hip: 17, rate: 5, mag: 30, reload: 2.6, empty: 0,
    recoil: 4, back: 0.75, weight: 3.5, sight: "scope", zoom: [4, 12], zero: 30, sh: 0.055, hop: 1.3,
    desc: "おもくて ゆれが すくない。スコープは 4〜12ばい。\nボルトは すこし おもい。",
    fact: "にぎる ところに 手を とおす あなが ある\n「サムホール ストック」。ほほ あてと\nバイポッド（2きゃく）で じゅうを ささえる。" },
  { id: "semi", cat: "sniper", name: "セミオート スコープ", power: "aeg", action: "semi", len: 1029, h: 240,
    ref: "AR-10がたの セミオート ライフル（M110・SR-25 など）", bb: 0.28, v0: 78, group: 1.6, hip: 16, rate: 4, mag: 20, reload: 2.3, empty: 0,
    recoil: 6, back: 0.8, weight: 3.3, sight: "scope", zoom: [2.5, 8], zero: 30, sh: 0.06, hop: 1.3,
    desc: "ボルトを うごかさず つづけて うてる。\nまとまりは ボルトより すこし ひろい。",
    fact: "モーターで ピストンを 1かい ずつ うごかす\n「セミオート」。はやく 2はつめを うてるので\nうごく まとや かぜの たしかめうちに つよい。" },
];

// しゅもく（コース）。じゅうの しゅるい ごとに 2つ。実際の 競技を もとに した ルール（出典は GUN_LIST.md）
export const COURSES = {
  steel: { cat: "hand", name: "スチール チャレンジ", env: "indoor", kind: "steel", score: "time",
    rule: "5まいの スチール プレートを はやく。\nきいろい ストップ プレートは さいご。\n5かい うって いちばん おそい 1かいを のぞく。",
    strings: 5, drop: 1, penalty: 3, standby: [1.2, 2.6], raise: 0.35,
    targets: [
      { id: "p1", shape: "round", d: 0.2, x: -1.8, y: 1.35, z: 6 },
      { id: "p2", shape: "round", d: 0.2, x: -0.7, y: 1.5, z: 9 },
      { id: "p3", shape: "round", d: 0.25, x: 0.7, y: 1.5, z: 9 },
      { id: "p4", shape: "round", d: 0.2, x: 1.8, y: 1.35, z: 6 },
      { id: "stop", shape: "stop", w: 0.3, h: 0.25, x: 0, y: 1.25, z: 7, stop: true },
    ] },
  bullseye: { cat: "hand", name: "APS がた ブルズアイ", env: "indoor", kind: "bull", score: "points",
    rule: "5m さきの まとを 5はつ × 2シリーズ（1かい 2ふん）。\nまんなかから X・10・8・5てん。線に かかれば 上。\nかたてで もち、いきを とめて しずかに うつ。",
    series: 2, shots: 5, time: 120,
    card: { x: 0, y: 1.45, z: 5, size: 0.17, gauge: 0.0015, rings: [{ d: 0.011, pts: 10, x: true }, { d: 0.022, pts: 10 }, { d: 0.035, pts: 8 }, { d: 0.05, pts: 5 }] } },
  practical: { cat: "rifle", name: "プラクティカル（IPSC がた）", env: "indoor", kind: "ipsc", score: "hf",
    rule: "かみの 的は 2はつずつ・ポッパーは たおす。\nNS（しろい 的）は うたない。60びょうまで。\nてん ÷ じかん の「ヒット ファクター」で きそう。",
    zones: { A: 5, C: 3, D: 1 }, popper: 5, perPaper: 2, miss: 10, ns: 10, limit: 60,
    targets: [
      { id: "t1", shape: "ipsc", x: -3.0, y: 0, z: 8 }, { id: "t2", shape: "ipsc", x: -1.4, y: 0, z: 10 },
      { id: "t3", shape: "ipsc", x: 1.4, y: 0, z: 10 }, { id: "t4", shape: "ipsc", x: 3.0, y: 0, z: 8 },
      { id: "t5", shape: "ipsc", x: -4.2, y: 0, z: 15 }, { id: "t6", shape: "ipsc", x: 4.2, y: 0, z: 15 },
      { id: "n1", shape: "ns", x: -1.05, y: 0, z: 9.8 }, { id: "n2", shape: "ns", x: 4.55, y: 0, z: 14.8 },
      { id: "pp1", shape: "popper", x: -0.45, y: 0, z: 12, act: "sw1" }, { id: "pp2", shape: "popper", x: 0.45, y: 0, z: 12 },
      { id: "pp3", shape: "popper", x: -2.4, y: 0, z: 13 }, { id: "pp4", shape: "popper", x: 2.4, y: 0, z: 13 },
      { id: "sw1", shape: "ipsc", x: 0, y: 0, z: 18, swing: { amp: 0.8, period: 3.0 }, wait: true },
      { id: "mv1", shape: "ipsc", x: -4, y: 0, z: 16, rail: { from: -4, to: 4, speed: 1.2 } },
    ] },
  precision: { cat: "rifle", name: "10m エアライフル", env: "hall", kind: "issf", score: "points",
    rule: "10m さきの 小さな まとを 10ぱつ（120びょう）。\nてんは 10.9 まで（まんなかほど 高い）。\nじゅうの ゆれと いきを よむ。",
    shots: 10, time: 120, card: { x: 0, y: 1.4, z: 10, size: 0.08, step: 0.0025 } },
  long: { cat: "sniper", name: "ロングレンジ", env: "field", kind: "long", score: "points",
    rule: "30〜70m の かね 5つを ちかい じゅんに 2はつずつ。\nとおいほど てんが 高い（1〜5てん）。\nかぜで ながれ、とおいと おちる。めもりで ずらす。",
    per: 2, shots: 10, time: 150, wind: [0, 1.2], gust: [6, 12],
    targets: [
      { id: "g30", shape: "gong", d: 0.25, x: -3, y: 1.0, z: 30, pts: 1 },
      { id: "g40", shape: "gong", d: 0.2, x: 2.5, y: 1.1, z: 40, pts: 2 },
      { id: "g50", shape: "gong", d: 0.3, x: -1.5, y: 1.2, z: 50, pts: 3 },
      { id: "g60", shape: "gong", d: 0.35, x: 3.5, y: 1.3, z: 60, pts: 4 },
      { id: "g70", shape: "gong", d: 0.45, x: -5, y: 1.6, z: 70, pts: 5 },
    ] },
  moving: { cat: "sniper", name: "ムービング ターゲット", env: "field", kind: "run", score: "points",
    rule: "20m さきを よこに はしる まとを 10かい（1かい 1ぱつ）。\nおそい（5びょう）5かい・はやい（2.5びょう）5かい。\nたまが とどく までに まとが すすむ ぶん まえを ねらう。",
    runs: [0.8, 0.8, 0.8, 0.8, 0.8, 1.6, 1.6, 1.6, 1.6, 1.6], window: 4, z: 20, y: 1.3, d: 0.3, wait: [1.0, 2.0] },
};
// 弾道の きまり（くうきの ていこう・ホップの 浮く 力・かぜ）
//   cd くうきの ていこう・liftExp ホップの 浮く 力の へりかた・spreadGrow ばらつきが きょりで ふえる（40m で 2ばい）・hop スナイパーの ホップ ダイヤル（0〜20・10 が いつもの ホップ）
export const BALLISTICS = { rho: 1.2, cd: 0.3, liftExp: 0.5, g: 9.81, dt: 0.002, maxD: 90, step: 1, spreadGrow: 40, hop: { steps: 20, min: 0.77, max: 1.23 } };
// のぞく・ゆれ（mrad）。さいしょ から 手が ぶれる 大きさ。おもい じゅうほど ちいさい（÷ √おもさ）
//   trigger ひきがねを ひく ときの ぶれ（mrad）: ダブル アクションは おもい・きょうぎ用は かるい
export const HOLD = { hand: 5.0, rifle: 2.4, sniper: 0.8, breath: 4, rest: 2.5, calm: 0.35, shake: 1.8, trigger: { semi: 0.45, da: 1.1, auto: 0.3, lever: 0.35, bolt: 0.25, single: 0.12 } };
// ごほうび: GameEconomy.pay と 同じ 形（shopBase.range = 60 × [0, 0.45, 1, 1.5][★]）
export const PAY = { base: 60, rank: [0, 0.45, 1, 1.5] };
// こうかおん（Sound.se の 名前）。紙の 的に あたった 音は ならさない（ほんものと 同じ。スコア モニターと けっかで わかる）
//   スチール・かねの 音は きょり ÷ 340m/s おくれて とどく（events の delay）
export const SOUND = {
  fire: { gbb: "rg_gbb", gas: "rg_gas", aeg: "rg_aeg", spring: "rg_spring" },
  hit: { round: "ding", stop: "ding", popper: "ding", gong: "rg_gong" },
  beep: "rg_beep", reload: "rg_mag", cycle: "rg_bolt", load: "tap", gasp: "whoosh", series: "ok", end: { 3: "fanfare", other: "good" },
};
// 新しく sound.js の se() に 足す 音（いまの tone = T・noise = N と 同じ 書き方の 引数）
export const NEW_SE = {
  rg_beep: [["T", { f: 2400, dur: 0.32, type: "square", vol: 0.08 }]],                                                                  // ショット タイマーの ブザー
  rg_gbb: [["N", { dur: 0.06, vol: 0.32, freq: 3000, q: 0.7 }], ["T", { f: 150, f2: 70, t: 0.01, dur: 0.05, type: "square", vol: 0.1 }], ["N", { t: 0.06, dur: 0.03, vol: 0.18, freq: 1400, q: 3 }]], // パシュッ・カシャ（スライド）
  rg_gas: [["N", { dur: 0.08, vol: 0.28, freq: 2200, q: 0.8 }], ["T", { f: 1300, dur: 0.02, type: "pulse", vol: 0.08 }]],                  // ポシュッ（ハンマーの カチ）
  rg_aeg: [["T", { f: 95, f2: 140, dur: 0.05, type: "sawtooth", vol: 0.1 }], ["N", { t: 0.02, dur: 0.05, vol: 0.24, freq: 1800, q: 1 }]], // ジッ・パスッ（モーターと ピストン）
  rg_spring: [["N", { dur: 0.1, vol: 0.3, freq: 900, q: 0.8 }], ["T", { f: 220, f2: 120, dur: 0.08, type: "triangle", vol: 0.14 }]],    // バスッ（ばね）
  rg_bolt: [["N", { dur: 0.05, vol: 0.22, freq: 1800, q: 3 }], ["N", { t: 0.18, dur: 0.05, vol: 0.22, freq: 1500, q: 3 }]],              // ガチャ・ガチャ（ボルト・レバー）
  rg_mag: [["N", { dur: 0.04, vol: 0.2, freq: 1300, q: 3 }], ["N", { t: 0.3, dur: 0.05, vol: 0.24, freq: 900, q: 3 }]],                  // マガジンを ぬいて さす
  rg_gong: [["T", { f: 620, dur: 0.9, type: "sine", vol: 0.16, vib: 4 }], ["T", { f: 1540, dur: 0.5, type: "sine", vol: 0.06 }]],         // とおくの かねの ゴーン
};

// 射撃場の 人（はじめての ときに レンジの きまり）
export const STAFF = { id: "range_staff", talk: "range_staff", name: "レンジ オフィサーの ラビ", sp: "rabbit", outfit: { face: "sunglasses" } };
export const TALK = {
  first: ["ようこそ、シティ シューティング レンジへ。\nわたしは レンジ オフィサー（RO）の ラビ。",
    "きまりは 4つ。ゴーグルを かならず つける。\nうつ とき いがいは ひきがねに ゆびを かけない。",
    "じゅうこうは いつも まとの ほうへ。\nおわったら マガジンを ぬいて「ショウ クリア」。"],
  lines: ["スチールは ストップ プレートを さいごに。", "かみの 的は Aゾーンに 2はつ ずつね。", "とおくは かぜを よんで。はたの ほうへ ながれるよ。",
    "ボルトアクションは うったら ボルトを ひく。", "いきを とめると ゆれが へる。でも ながくは むり。", "ホップを つよく すると とおくで たまが おちにくい。"],
  cmd: { ready: "メイク レディ（じゅんび して）", areYou: "アー ユー レディ？", standby: "スタンバイ…", done: "アンロード。ショウ クリア。" },
  lock: "{cat}で ★1を とると あそべるよ。",
  pick: "だれが うつ？",
  go: {
    wanko: ["まかせて！ クンクン… かぜの においは ひだり！", "せいぎの いちげき、きめるよ！"],
    gachan: ["こ、こわくない… ゴーグル よし！", "ままー、みてて… がちゃん、がんばる！"],
    goji: ["ガウっ… ねらいは ばっちり…ガゥ", "おっきく なったら スナイパーに なる ガゥ"],
  },
  cheer: {
    wanko: { hit: ["ナイス ヒット！", "わうーん！ あたった！"], combo: ["ぜんぶ Aゾーンだ！"], hurry: ["あと すこし！ いけー！"], end: ["いい タイムだった！"] },
    gachan: { hit: ["あたった〜！", "カーンって なった！"], combo: ["ままー、みて！ すごいの！"], hurry: ["いそいで〜！"], end: ["がちゃんも どきどき した〜"] },
    goji: { hit: ["ガウっ！ ナイス", "いい ねらい…ガゥ"], combo: ["れんぞく…ガゥ！"], hurry: ["いそげ〜 ガウっ"], end: ["つぎは ぼくの ばん…ガゥ"] },
  },
  result: { 0: "もう いちど、フォームから たしかめよう。", 1: "Cクラス の うでまえ！", 2: "Bクラス！ じょうずに なって きた。", 3: "Aクラス！ 大会に でられる うでまえだ。" },
};
// 町に たてる 場所（シティ。デパートと こうぼうの あいだ。入口は ほかの お店と 同じ 9行目で、まえが 大通り。② の 町の人が「シティの しゃてきじょう」と 話す）
//   style は town-renewal-art.js の facades に 足す 外がわの 名前（RangeRef.facade200）
export const OUTSIDE = { map: "city", id: "city_range", x: 10, y: 6, w: 5, h: 4, label: "シティ シューティング レンジ", roof: "#3E434B", facility: "range", style: "city_range" };
