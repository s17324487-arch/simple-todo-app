// 歩いて 入る 店の 内装（O10・UI-75 から 斜め上の 館。シーンは js/store-iso.js・絵は js/store-iso-art.js・js/store-iso-props.js）。
// 10×12 マス: 店員（5,1）・レジ（4〜6,2）・はなす ところ（5,3）・でぐちの マット（4〜6,11）は どの 店も おなじ。セーブの 座標は 入口の 外に 保つ。
// wall・wallPat（stripe／dots／tile／brick／wood）・wainscot・wainPat（tile）・accent・wood: かべと 什器の いろ。mats・zones: 床（もじ → 材質）。
// counter: { body, top, items }（レジの いろと うえの こもの）。walls: 北・西の かべの パーツ（まど・かんばん・メニュー・ポスター など。a〜b は かべに そった マス）。
// fixtures: [kind, x, y, w, d, label, opts]。label が ある ものは タップで ひとこと（opts.action "sit" の テーブルは 3人が すわる）。
const STORE_HAIR_ART = (i) => `<circle cx="0" cy="2" r="9" fill="#FFE6CC" stroke="#1F1D1B" stroke-width="1.2"/>` + [`<path d="M-10,0 Q-10,-12 0,-12 Q10,-12 10,0 Q6,-6 0,-6 Q-6,-6 -10,0 Z" fill="#8A5A3C" stroke="#1F1D1B" stroke-width="1.2"/>`, `<path d="M-11,6 Q-12,-12 0,-12 Q12,-12 11,6 L8,2 Q6,-6 0,-6 Q-6,-6 -8,2 Z" fill="#E9B74E" stroke="#1F1D1B" stroke-width="1.2"/><circle cx="9" cy="-8" r="3" fill="#F28BB2"/>`, `<path d="M-10,-1 Q-8,-13 2,-12 Q11,-10 10,-1 Q4,-8 -2,-6 Z" fill="#3F3A44" stroke="#1F1D1B" stroke-width="1.2"/><circle cx="-11" cy="-4" r="4.6" fill="#3F3A44" stroke="#1F1D1B" stroke-width="1.2"/>`][i % 3] + `<circle cx="-3" cy="2" r="1" fill="#1F1D1B"/><circle cx="3" cy="2" r="1" fill="#1F1D1B"/>`;
const STORE_INTERIORS = {
  burger: {
    wall: "#FFF4E4", wallPat: "stripe", accent: "#E8553E", wainscot: "#EE7A62", wainPat: "tile", wood: "#C98A52", caption: "こんがり できたて バーガー",
    mats: { ".": { c: ["#F8EDDC", "#EFCDBE"], pat: "check" }, k: { c: ["#DDE2E5", "#D2D8DC"], pat: "tile" } }, zones: [["k", 3, 0, 7, 1]],
    counter: { body: "#E8553E", top: "#F6EEDF", items: ["tray", "menu"] },
    walls: {
      north: [{ t: "window", a: 0.25, b: 2.75, z0: 156, z1: 214, awning: "#E8553E" }, { t: "menu", a: 3.25, b: 7.75, z0: 156, z1: 226, title: "きょうの バーガー", items: ["bm_hamburger", "bm_teriyaki", "bm_double", "bm_fries_m", "bm_shake_berry"] }, { t: "poster", a: 7.9, b: 9.1, z0: 182, z1: 226, food: "bm_nikoniko", text: "にこにこ セット" }, { t: "clock", a: 9.1, z: 206 }],
      west: [{ t: "window", a: 2.9, b: 5.6, z0: 98, z1: 196, curtain: "#F4B95E" }, { t: "window", a: 6.9, b: 9.6, z0: 98, z1: 196, curtain: "#F4B95E" }, { t: "poster", a: 0.3, b: 1.5, z0: 120, z1: 196, food: "bm_shake_vanilla", text: "シェイク" }, { t: "poster", a: 10.3, b: 11.5, z0: 120, z1: 196, food: "bm_fries_l", text: "ポテト" }],
    },
    fixtures: [
      ["burgerkitchen", 4, 0, 3, 1, "じゅうじゅう てっぱん"], ["sodafountain", 4, 1, 1, 1, "ドリンクの きかい"], ["fryer", 6, 1, 1, 1, "あげたて ポテト"],
      ["wallshelf", 0, 0, 3, 1, "おまけの おもちゃ", { variant: "toys", sign: "おまけ", height: 150 }], ["fridge", 7, 0, 3, 1, "つめたい のみもの", { variant: "drinks", sign: "ドリンク" }],
      ["booth", 0, 3, 2, 3, "まどべの ボックスせき", { dir: "x", action: "sit", text: "ふかふかの ボックスせき。まどから まちが みえるね。" }], ["plant", 0, 6, 1, 1, null, { variant: "tall" }], ["booth", 0, 7, 2, 3, null, { dir: "x", variant: "b" }],
      ["table", 7, 4, 2, 2, "テーブルせき", { action: "sit", text: "できたての バーガーの いい におい！" }], ["table", 7, 7, 2, 2, "テーブルせき", { action: "sit", text: "ポテトは ふたりで わけっこ しよう。" }],
      ["board", 9, 3, 1, 1, "きょうの セット", { lines: ["きょうの", "にこにこ", "セット"], col: "#5A3A2E" }], ["trash", 9, 10, 1, 1, "ごみばこと トレイ", { col: "#C9A16E" }],
    ],
  },
  groom: {
    wall: "#EEF7F4", wallPat: "tile", accent: "#6FB3A8", wainscot: "#BFE0D8", wood: "#D9C3A5", caption: "ふんわり すっきり おしゃれ",
    mats: { ".": { c: ["#F8F8F3", "#DFE8E4"], pat: "check" } },
    counter: { body: "#7FBFB3", top: "#FFFFFF", items: ["bell", "plant"] },
    walls: {
      north: [{ t: "mirror", a: 0.3, b: 1.7, z0: 96, z1: 204 }, { t: "mirror", a: 2.3, b: 3.7, z0: 96, z1: 204 }, { t: "sign", a: 4.0, b: 7.0, z0: 170, z1: 216 }, { t: "frames", a: 7.3, b: 9.7, z0: 150, z1: 214, n: 3, art: STORE_HAIR_ART }],
      west: [{ t: "window", a: 3.0, b: 4.0, z0: 170, z1: 214 }, { t: "window", a: 7.0, b: 7.9, z0: 100, z1: 196, curtain: "#A8D5CB" }, { t: "clock", a: 10.2, z: 200 }, { t: "shelf", a: 10.1, b: 11.8, z: 150, goods: "tubes" }, { t: "poster", a: 1.0, b: 2.6, z0: 110, z1: 196, art: STORE_HAIR_ART(1).replace(/^/, '<g transform="scale(2.4)">') + "</g>", text: "あたらしい かみがた" }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "ヘアケアの たな", { variant: "tubes", sign: "ヘアケア", height: 150 }], ["towelcart", 4, 1, 1, 1, "ふかふか タオル"], ["haircart", 6, 1, 1, 1, "ドライヤーと ブラシ"],
      ["station", 0, 0, 2, 2, "カットの せき", { sp: "rabbit", ci: 1 }], ["station", 2, 0, 2, 2, "カットの せき", { sp: "bear", ci: 0 }], ["shampoo", 7, 0, 3, 2, "シャンプー だい"],
      ["wallshelf", 0, 4, 1, 3, "シャンプーの たな", { variant: "tubes", sign: "シャンプー" }], ["wallshelf", 0, 8, 1, 2, "リボンと かみかざり", { variant: "ribbons", sign: "リボン" }],
      ["seat", 7, 5, 2, 1, "まちあいの ソファ", { col: "#8FC7BC" }], ["magazines", 9, 5, 1, 1, "ざっしの ラック"], ["plant", 9, 10, 1, 1, null, { variant: "monstera" }], ["plant", 0, 11, 1, 1, null, { variant: "bush" }],
    ],
  },
  cake: {
    wall: "#FFF2F5", wallPat: "stripe", accent: "#E89AAF", wainscot: "#F8D7DF", wood: "#E2C49A", caption: "きねんびを いろどる デザ",
    mats: { ".": { c: ["#FFF9F5", "#F7E0E6"], pat: "check" } },
    counter: { body: "#F2B8C6", top: "#FFFFFF", items: ["dome", "ribbon"] },
    walls: {
      north: [{ t: "shelf", a: 0.3, b: 2.7, z: 172, goods: "cupcakes" }, { t: "sign", a: 4.0, b: 7.0, z0: 170, z1: 216 }, { t: "poster", a: 7.6, b: 8.8, z0: 182, z1: 226, food: "cake", text: "おたんじょうび" }, { t: "lights", a: 0, b: 10, z: 226 }],
      west: [{ t: "window", a: 3.0, b: 5.9, z0: 118, z1: 204, curtain: "#F2B8C6" }, { t: "window", a: 7.0, b: 8.9, z0: 118, z1: 204, curtain: "#F2B8C6" }, { t: "menu", a: 9.3, b: 11.7, z0: 120, z1: 196, title: "ケーキ", items: ["cake", "rollcake", "deza_tart", "pudding"], dark: false }, { t: "lights", a: 0, b: 12, z: 226 }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "ギフトの はこ", { variant: "boxes", sign: "ギフト", height: 150 }], ["cakestand", 4, 1, 1, 1, "カップケーキの スタンド"], ["giftboxes", 6, 1, 1, 1, "リボンの はこ"],
      ["wallshelf", 0, 0, 3, 1, "やきがしの たな", { variant: "jars", sign: "やきがし", height: 150 }], ["fridge", 7, 0, 3, 1, "ホールケーキの れいぞうこ", { variant: "cakes", sign: "ホールケーキ", body: "#F6DDE4", glow: "#FFF6F8" }],
      ["showcase", 0, 3, 1, 3, "ケーキの ショーケース", { variant: "cakes", sign: "ケーキ" }], ["showcase", 0, 7, 1, 2, "プチケーキ", { variant: "cupcakes", sign: "プチ" }],
      ["weddingcake", 2, 5, 2, 2, "おいわいの ケーキ", { text: "まっしろな 3だんの ケーキ。いつか たべて みたいな" }],
      ["table", 7, 4, 2, 2, "カフェの せき", { action: "sit", text: "あまい かおり。ケーキ、どれに しようかな。" }], ["table", 7, 7, 2, 2, "カフェの せき", { action: "sit", text: "いちごの ケーキ、だいすき！" }],
      ["board", 9, 3, 1, 1, "きょうの ケーキ", { lines: ["きょうの", "いちご", "ケーキ"], col: "#6E4A5A" }], ["plant", 9, 10, 1, 1, null, { variant: "flower" }],
    ],
  },
  clothes: {
    wall: "#FFF5F7", wallPat: "dots", accent: "#D98CA6", wainscot: "#F4D3DE", wood: "#D8B48C", caption: "とっておきの いちまい",
    mats: { ".": { c: ["#EBD7B8", "#E3CCAA"], pat: "plank" }, r: { c: ["#F7DFE7", "#F2D6DF"], pat: "carpet" } }, zones: [["r", 1, 7, 2, 8]],
    counter: { body: "#E7AFC2", top: "#FFFDF8", items: ["bags", "ribbon"] },
    walls: {
      north: [{ t: "frames", a: 0.3, b: 2.7, z0: 178, z1: 224, n: 3, cols: ["#F2C6D8", "#C8DEEF", "#F4E3A1"], art: (i) => `<g transform="scale(1.3)">${StoreIsoArt.SP.dress(["#E7AFC2", "#8EC5F4", "#F6D47A"][i % 3])}</g>` }, { t: "sign", a: 4.0, b: 7.0, z0: 168, z1: 214 }, { t: "lights", a: 6.8, b: 10, z: 226 }],
      west: [{ t: "window", a: 7.0, b: 9.8, z0: 100, z1: 200, curtain: "#E7AFC2", awning: "#D98CA6" }, { t: "poster", a: 10.3, b: 11.6, z0: 120, z1: 196, art: '<g transform="scale(2.2)">' + '<path d="M-6,-18 L-2,-20 Q0,-17 2,-20 L6,-18 L8,-12 L5,-11 L5,0 L-5,0 L-5,-11 L-8,-12 Z" fill="#8EC5F4" stroke="#1F1D1B" stroke-width=".8"/></g>', text: "あたらしい ふく" }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "たたんだ おようふく", { variant: "folded", sign: "おようふく", height: 150 }], ["hatstand", 4, 1, 1, 1, "ぼうしの スタンド"], ["showcase", 6, 1, 1, 1, "アクセサリーの ケース", { variant: "ribbons", height: 72 }],
      ["wallrack", 0, 0, 3, 1, "ハンガーの ふく"], ["fittingroom", 7, 0, 3, 2, "しちゃくしつ"],
      ["wallrack", 0, 3, 1, 4, "ワンピースの かべ"], ["mannequin", 2, 4, 1, 1, "きょうの おすすめ", { item: "ike_hane_0" }],
      ["clothesrack", 1, 7, 2, 2, "まるい ラック", { variant: "round" }], ["mirror", 0, 10, 1, 1, "おおきな かがみ"],
      ["clothesrack", 7, 4, 2, 1, "シャツの ラック"], ["foldtable", 7, 6, 2, 2, "セーターの テーブル"], ["mannequin", 8, 9, 1, 1, "ぼうしと コート", { item: "forest_coat" }],
    ],
  },
  furniture: {
    wall: "#F4EDE1", wallPat: "wood", accent: "#8FA88E", wainscot: "#D8C6A6", wood: "#B98B5E", caption: "くらしの どうぐと ぬくもり",
    mats: { ".": { c: ["#CFAA7C", "#C6A072"], pat: "plank" } },
    counter: { body: "#B98B5E", top: "#F1E3C8", items: ["cards", "plant"] },
    walls: {
      north: [{ t: "frames", a: 0.3, b: 2.7, z0: 168, z1: 220, n: 2, cols: ["#C9DDB9", "#E8D3B0"] }, { t: "sign", a: 4.0, b: 7.0, z0: 172, z1: 218, col: "#8FA88E" }, { t: "window", a: 7.2, b: 9.8, z0: 176, z1: 222 }],
      west: [{ t: "window", a: 3.2, b: 5.8, z0: 108, z1: 204, curtain: "#C9DDB9" }, { t: "frames", a: 7.2, b: 9.6, z0: 120, z1: 190, n: 2, cols: ["#F4E3A1", "#C8DEEF"] }, { t: "clock", a: 10.4, z: 196 }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "カタログの たな", { variant: "books", sign: "カタログ", height: 150 }], ["floorlamp", 4, 1, 1, 1, "あかりの みほん", { item: "lamp_tulip" }], ["plant", 6, 1, 1, 1, null, { variant: "bush" }],
      ["wallshelf", 0, 0, 3, 1, "ざっかの たな", { variant: "mugs", sign: "ざっか", height: 150 }], ["swatches", 7, 0, 3, 1, "かべがみの みほん"],
      ["vignette", 0, 3, 3, 3, "ベッドの おへや", { variant: "bedroom", text: "ふかふかの ベッド。ねころんで みたいな" }], ["vignette", 0, 7, 3, 3, "べんきょうの へや", { variant: "study" }],
      ["vignette", 7, 4, 3, 3, "くつろぎの へや", { variant: "living" }], ["vignette", 7, 8, 3, 3, "ダイニングの みほん", { variant: "dining" }],
      ["plant", 0, 6, 1, 1, null, { variant: "monstera" }],
    ],
  },
  market: {
    wall: "#EEF4E4", accent: "#5DA676", wainscot: "#CFE3C8", wainPat: "tile", wood: "#C99A6B", caption: "しんせん・おいしい・まいにち",
    mats: { ".": { c: ["#F6F6F0", "#EDEDE6"], pat: "tile" } },
    counter: { body: "#5DA676", top: "#F2F5F2", items: ["scale", "bags"] },
    walls: {
      north: [{ t: "board", a: 0.3, b: 2.7, z0: 178, z1: 222, lines: ["ぎゅうにゅう・チーズ"], col: "#FFFDF4" }, { t: "sign", a: 4.0, b: 7.0, z0: 172, z1: 218 }, { t: "board", a: 7.3, b: 9.7, z0: 178, z1: 222, lines: ["のみもの"], col: "#FFFDF4" }],
      west: [{ t: "board", a: 3.2, b: 6.8, z0: 176, z1: 220, lines: ["かんづめ・おかし"], col: "#FFFDF4" }, { t: "window", a: 8.1, b: 9.9, z0: 104, z1: 196 }, { t: "poster", a: 10.2, b: 11.6, z0: 120, z1: 196, food: "watermelon", text: "スイカ！" }],
    },
    fixtures: [
      ["fishtank", 4, 0, 3, 1, "いけすの さかな"], ["scalestand", 4, 1, 1, 1, "はかりの だい"], ["baskets", 6, 1, 1, 1, null, { col: "#5DA676" }],
      ["fridge", 0, 0, 3, 1, "ひんやり れいぞうこ", { foods: ["milk", "pudding", "deza_berrymilk", "deza_jelly"], sign: "ひんやり" }], ["fridge", 7, 0, 3, 1, "のみものの たな", { variant: "drinks", sign: "ドリンク" }],
      ["wallshelf", 0, 3, 1, 4, "たべものの たな", { variant: "cans", sign: "かんづめ" }], ["wallshelf", 0, 8, 1, 2, "パンの たな", { variant: "bread", sign: "パン" }],
      ["produce", 2, 4, 2, 2, "くだもの いちば"], ["produce", 2, 7, 2, 1, "やさいの はこ", { variant: "veg" }],
      ["gondola", 7, 4, 2, 1, "おかしの たな", { variant: "snacks", sign: "おかし" }], ["freezer", 7, 6, 2, 2, "アイスの れいとうこ", { variant: "candy", sign: "アイス" }],
      ["plant", 9, 9, 1, 1, "きせつの はな", { variant: "flower" }], ["baskets", 2, 10, 1, 1, "おかいもの かご"], ["cart", 1, 10, 1, 1, "カート"],
      ["npc", 3, 6, 1, 1, "おかいものの おきゃくさん", { sp: "duck", ci: 1, dir: "left", action: "chat", lines: ["きょうは りんごが やすいのよ。", "スイカも まるごと ひとつ ほしいわ〜"] }],
    ],
  },
  crepe: {
    wall: "#FFF0E6", wallPat: "stripe", accent: "#F09A8A", wainscot: "#FBD7C9", wood: "#E0B98E", caption: "あまい かおりの クレープや",
    mats: { ".": { c: ["#FFF7EF", "#F9DFD0"], pat: "check" } },
    counter: { body: "#F4A99A", top: "#FFFFFF", items: ["menu", "candy"] },
    walls: {
      north: [{ t: "shelf", a: 0.3, b: 2.7, z: 168, foods: ["ike_crepes_0", "ike_crepes_1", "ike_crepes_2"] }, { t: "menu", a: 3.3, b: 7.7, z0: 172, z1: 230, title: "クレープ", items: ["ike_crepes_0", "ike_crepes_1", "ike_crepes_2", "deza_ice"], dark: false, col: "#F09A8A" }, { t: "lights", a: 7.6, b: 10, z: 226 }],
      west: [{ t: "window", a: 3.0, b: 6.9, z0: 104, z1: 204, awning: "#F09A8A" }, { t: "poster", a: 8.0, b: 9.4, z0: 120, z1: 200, food: "ike_crepes_1", text: "いちご クレープ" }, { t: "clock", a: 10.4, z: 200 }],
    },
    fixtures: [
      ["crepekitchen", 4, 0, 3, 1, "クレープの てっぱん"], ["toppingbar", 4, 1, 1, 1, "トッピングの だい"], ["icecase", 6, 1, 1, 1, "アイスの ケース"],
      ["wallshelf", 0, 0, 3, 1, "クレープの みほん", { foods: ["ike_crepes_0", "ike_crepes_1", "ike_crepes_2", "deza_ice"], sign: "みほん", height: 150 }], ["fridge", 7, 0, 3, 1, "のみものの れいぞうこ", { variant: "drinks", sign: "ドリンク" }],
      ["barseat", 0, 3, 1, 4, "まどべの カウンターせき", { seat: "#F4A99A" }], ["plant", 0, 8, 1, 1, null, { variant: "flower" }],
      ["table", 7, 4, 2, 2, "テーブルせき", { action: "sit", text: "クリーム たっぷりの クレープ、たべたいな。" }], ["table", 7, 7, 2, 2, "テーブルせき", { action: "sit", text: "いちごと バナナ、どっちに しよう？" }],
      ["board", 9, 3, 1, 1, "きょうの メニュー", { lines: ["きょうの", "いちご", "クレープ"], col: "#7A4A4A" }], ["plant", 9, 10, 1, 1, null, { variant: "bush" }],
    ],
  },
  dentist: {
    wall: "#EEF7FA", wallPat: "tile", accent: "#6FB3D2", wainscot: "#D2E8F2", wainPat: "tile", wood: "#D9C3A5", caption: "にっこり しろい は",
    mats: { ".": { c: ["#F4F9F8", "#E7EFEE"], pat: "tile" } },
    counter: { body: "#8EC5DD", top: "#FFFFFF", items: ["brushes", "bell"] },
    walls: {
      north: [{ t: "poster", a: 0.4, b: 1.6, z0: 160, z1: 214, art: '<g transform="scale(1.8)"><path d="M0,-4 C-5,-8 -9,-4 -7,2 C-5,8 -4,7 -3,4 Q0,1 3,4 C4,7 5,8 7,2 C9,-4 5,-8 0,-4 Z" fill="#FFFFFF" stroke="#1F1D1B" stroke-width="1"/></g>', text: "はみがき" }, { t: "sign", a: 4.0, b: 7.0, z0: 172, z1: 218 }, { t: "window", a: 7.3, b: 9.7, z0: 172, z1: 222 }],
      west: [{ t: "poster", a: 4.0, b: 5.6, z0: 110, z1: 196, art: '<g transform="scale(1.6)">' + '<rect x="-1" y="-14" width="2" height="18" rx="1" fill="#8EC5F4" stroke="#1F1D1B" stroke-width=".8"/><rect x="-2" y="-17" width="4" height="5" rx="1" fill="#FFFFFF" stroke="#1F1D1B" stroke-width=".8"/></g>', text: "1にち 3かい" }, { t: "window", a: 7.0, b: 9.0, z0: 108, z1: 200, curtain: "#A8D5E2" }, { t: "clock", a: 10.3, z: 196 }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "カルテの たな", { variant: "boxes", sign: "カルテ", height: 150 }], ["plant", 4, 1, 1, 1, null, { variant: "tall" }], ["coffeemachine", 6, 1, 1, 1, "おくすりの たな", { col: "#DCEFF6" }],
      ["dentalchair", 0, 0, 3, 3, "しんさつの いす", { text: "ここで はを みて もらうよ。こわくないよ" }], ["dentcabinet", 7, 0, 3, 1, "きれいな どうぐ"],
      ["wallshelf", 0, 4, 1, 2, "えほんの たな", { variant: "books", sign: "えほん", height: 120, levels: 3 }], ["kidscorner", 0, 7, 2, 2, "キッズ コーナー"],
      ["seat", 7, 4, 2, 1, "まちあいの いす", { col: "#8EC5DD" }], ["seat", 7, 6, 2, 1, "まちあいの いす", { col: "#8EC5DD" }], ["aquarium", 8, 9, 2, 1, "すいそう"],
      ["plant", 0, 11, 1, 1, null, { variant: "monstera" }], ["magazines", 9, 4, 1, 1, "ざっしの ラック"],
    ],
  },
  bakery: {
    wall: "#FBF0DE", wallPat: "brick", accent: "#C98A52", wainscot: "#E8C9A0", wood: "#B98450", caption: "まいあさ こんがり やきたて",
    mats: { ".": { c: ["#E9C9A6", "#E1BE98"], pat: "tile" } },
    counter: { body: "#C98A52", top: "#F6E7CF", items: ["breadbasket", "bags"] },
    walls: {
      north: [{ t: "chalk", a: 0.3, b: 2.7, z0: 168, z1: 222, lines: ["やきたて", "メロンパン 120"] }, { t: "sign", a: 4.0, b: 7.0, z0: 172, z1: 218 }, { t: "shelf", a: 7.3, b: 9.7, z: 180, goods: "bread" }],
      west: [{ t: "window", a: 3.1, b: 5.9, z0: 168, z1: 214 }, { t: "window", a: 7.1, b: 8.9, z0: 104, z1: 200, curtain: "#E8C9A0" }, { t: "poster", a: 9.4, b: 11.0, z0: 120, z1: 196, food: "bread", text: "しょくぱん" }],
    },
    fixtures: [
      ["stoneoven", 4, 0, 3, 1, "いしがま オーブン"], ["coolingrack", 4, 1, 1, 1, "やきたての たな"], ["flourbags", 6, 1, 1, 1, "こむぎこの ふくろ"],
      ["wallshelf", 0, 0, 3, 1, "やきたての パン", { variant: "bread", sign: "やきたて", height: 150 }], ["wallshelf", 7, 0, 3, 1, "フランスパンの たな", { variant: "baguettes", sign: "フランスパン", height: 150, levels: 3 }],
      ["wallshelf", 0, 3, 1, 3, "そうざいパン", { foods: ["sandwich", "bread", "nikuzume", "yakicorn"], sign: "そうざい" }], ["wallshelf", 0, 7, 1, 2, "ジャムの たな", { variant: "jars", sign: "ジャム" }],
      ["breadtable", 2, 4, 2, 3, "パンの テーブル"], ["traystand", 7, 4, 1, 1, "トレイと トング"],
      ["table", 7, 6, 2, 2, "イートインの せき", { action: "sit", text: "やきたての パンの におい……おなか すいてきた！", shop: "cafe" }], ["plant", 9, 10, 1, 1, null, { variant: "tall" }],
    ],
  },
  florist: {
    wall: "#F3F8EE", wallPat: "brick", accent: "#7FAE6E", wainscot: "#D4E5C8", wood: "#B99B74", caption: "おはなと みどりの おくりもの",
    mats: { ".": { c: ["#E7DAC6", "#DECFB8"], pat: "tile" } },
    counter: { body: "#8DBB7C", top: "#F7F2E8", items: ["bouquet", "ribbon"] },
    walls: {
      north: [{ t: "garland", a: 0, b: 4, z: 222 }, { t: "sign", a: 4.0, b: 7.0, z0: 172, z1: 218 }, { t: "garland", a: 7, b: 10, z: 222 }],
      west: [{ t: "window", a: 3.1, b: 5.9, z0: 104, z1: 204, awning: "#7FAE6E" }, { t: "garland", a: 0, b: 12, z: 222 }, { t: "shelf", a: 7.2, b: 9.8, z: 168, goods: "pots" }, { t: "poster", a: 10.2, b: 11.6, z0: 120, z1: 196, art: '<g transform="scale(2.2)">' + '<circle r="4" fill="#F2A7B8" stroke="#1F1D1B" stroke-width=".7"/></g>', text: "はなたば" }],
    },
    fixtures: [
      ["fridge", 4, 0, 3, 1, "おはなの れいぞうこ", { variant: "flowers", sign: "おはな", body: "#DDE9D8", glow: "#F2FAF0" }], ["paperroll", 4, 1, 1, 1, "つつみがみの ロール"], ["ribbonrack", 6, 1, 1, 1, "リボンの たな"],
      ["bucketstand", 0, 0, 3, 1, "いろとりどりの はな"], ["trellis", 7, 0, 3, 1, "つるばらの トレリス"],
      ["wallshelf", 0, 3, 1, 3, "はちうえの たな", { variant: "pots", sign: "はちうえ", wood: "#C9B08E" }], ["bucketstand", 0, 7, 1, 2, "きりばなの バケツ"],
      ["bucketstand", 2, 5, 2, 1, "きょうの おはな"], ["plant", 8, 4, 1, 1, "おおきな かんようしょくぶつ", { variant: "monstera" }],
      ["bouquettable", 7, 6, 2, 1, "はなたばの テーブル"], ["wateringcans", 9, 8, 1, 1, "じょうろ"], ["plant", 9, 10, 1, 1, null, { variant: "flower" }], ["plant", 7, 8, 1, 1, null, { variant: "cactus" }],
    ],
  },
  link: {
    wall: "#EEEDFB", wallPat: "dots", accent: "#8D7BC9", wainscot: "#D8D3F0", wood: "#B9A6E0", caption: "みんなで つなごう パズルひろば",
    mats: { ".": { c: ["#D6D9EF", "#CDD1EA"], pat: "carpet" } },
    counter: { body: "#9C8CD6", top: "#FFFFFF", items: ["cards", "candy"] },
    walls: {
      north: [{ t: "lights", a: 0, b: 4, z: 226 }, { t: "sign", a: 4.0, b: 7.0, z0: 176, z1: 222 }, { t: "lights", a: 7, b: 10, z: 226 }, { t: "poster", a: 7.4, b: 8.6, z0: 178, z1: 220, art: '<g transform="scale(1.6)"><path d="M-6,-6 h4 q0,-3 2,-3 t2,3 h4 v4 q3,0 3,2 t-3,2 v4 h-12 Z" fill="#F3C24F" stroke="#1F1D1B" stroke-width=".8"/></g>', text: "パズル" }],
      west: [{ t: "poster", a: 3.2, b: 4.6, z0: 160, z1: 214, art: '<g transform="scale(1.6)"><circle r="6" fill="#F28B82" stroke="#1F1D1B" stroke-width=".8"/></g>', text: "つなげて" }, { t: "lights", a: 0, b: 12, z: 226 }, { t: "window", a: 8.1, b: 9.9, z0: 104, z1: 200 }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "けいひんの たな", { variant: "plush", sign: "けいひん", height: 150, wood: "#C9B8E8" }], ["trophy", 4, 1, 1, 1, "きらきら トロフィー"], ["candyjar", 6, 1, 1, 1, "あめの びん"],
      ["puzzlecab", 0, 0, 3, 1, "パズルの ゲームだい"], ["puzzlecab", 7, 0, 3, 1, "なかよし ゲームだい"],
      ["puzzlecab", 0, 3, 1, 3, "パズルの ゲームだい"], ["wallshelf", 0, 7, 1, 2, "ぬいぐるみの たな", { variant: "plush", sign: "ぬいぐるみ", wood: "#C9B8E8" }],
      ["seat", 2, 6, 2, 1, "ひとやすみ ベンチ", { col: "#B9A6E0" }], ["puzzletable", 7, 4, 2, 2, "おためし パズル"], ["showcase", 7, 7, 2, 1, "トロフィーの ケース", { variant: "cups", body: "#9C8CD6", sign: "トロフィー" }],
      ["plant", 9, 10, 1, 1, null, { variant: "bush" }], ["npc", 8, 9, 1, 1, "パズルの おともだち", { sp: "cat", ci: 2, dir: "left", action: "chat", lines: ["3つ つなげると きえるんだよ！", "なかよし パズル、いっしょに やろう♪"] }],
    ],
  },
  korokoro: {
    wall: "#FFF4E2", wallPat: "dots", accent: "#F0A04B", wainscot: "#FBD9B0", wood: "#D9A06A", caption: "おなじ ものを くっつけて まんまる",
    mats: { ".": { c: ["#FFF8EC", "#F6E0C0"], pat: "check" } },
    counter: { body: "#F6B26B", top: "#FFFFFF", items: ["candy", "cup"] },
    walls: {
      north: [{ t: "poster", a: 0.4, b: 1.6, z0: 176, z1: 222, food: "watermelon", text: "スイカ" }, { t: "poster", a: 1.8, b: 3.0, z0: 176, z1: 222, food: "strawberry", text: "いちご" }, { t: "sign", a: 4.0, b: 7.0, z0: 176, z1: 222 }, { t: "menu", a: 7.2, b: 9.8, z0: 170, z1: 228, title: "ジュース", items: ["juice", "deza_punch", "deza_berrymilk"], dark: false, col: "#F0A04B" }],
      west: [{ t: "window", a: 3.1, b: 5.9, z0: 168, z1: 214 }, { t: "window", a: 7.1, b: 9.9, z0: 104, z1: 200, awning: "#F0A04B" }, { t: "clock", a: 10.4, z: 200 }],
    },
    fixtures: [
      ["juicebar", 4, 0, 3, 1, "フルーツ ジュースの だい"], ["fruitbasket", 4, 1, 1, 1, "くだものの かご"], ["giftboxes", 6, 1, 1, 1, "フルーツの はこ"],
      ["fruitbox", 0, 0, 2, 1, "ころころ パズルの はこ"], ["fruitbox", 2, 0, 1, 1, "ちいさな はこ"], ["wallshelf", 7, 0, 3, 1, "くだものの たな", { variant: "fruit", sign: "くだもの", height: 150 }],
      ["fruitbox", 0, 3, 1, 2, "れんしゅうの はこ"], ["wallshelf", 0, 6, 1, 2, "まんまるの ぬいぐるみ", { variant: "plush", sign: "けいひん" }],
      ["table", 7, 4, 2, 2, "フルーツ ジュースの せき", { action: "sit", text: "あまい くだものの におい！" }], ["table", 7, 7, 2, 2, "フルーツ ジュースの せき", { action: "sit", text: "つぎは スイカを つくるぞ〜" }],
      ["produce", 2, 7, 2, 1, "くだものの はこ"], ["plant", 9, 10, 1, 1, null, { variant: "flower" }], ["board", 9, 3, 1, 1, "きょうの くだもの", { lines: ["きょうの", "メロン"], col: "#6A4A2E" }],
    ],
  },
  relay: {
    wall: "#EAF2F7", accent: "#5D8FB8", wainscot: "#CFE0EC", wood: "#C9A16E", caption: "そらへ とどける おくりもの",
    mats: { ".": { c: ["#E5E3DC", "#DCD9D1"], pat: "tile" }, y: { c: ["#F2D06B", "#EBC75F"], pat: "tile" } }, zones: [["y", 6, 4, 6, 9]],
    counter: { body: "#7FA7C9", top: "#F2F2EE", items: ["stamp", "scale"] },
    walls: {
      north: [{ t: "board", a: 0.3, b: 2.7, z0: 178, z1: 222, lines: ["はいたつ ロッカー"], col: "#FFFDF4" }, { t: "sign", a: 4.0, b: 7.0, z0: 176, z1: 222 }, { t: "window", a: 7.2, b: 9.8, z0: 176, z1: 222, sky: "#BFE3F7" }],
      west: [{ t: "poster", a: 3.0, b: 5.8, z0: 166, z1: 222, art: '<g transform="scale(1.4)"><ellipse rx="22" ry="12" fill="#BFE3F7" stroke="#1F1D1B" stroke-width=".8"/><path d="M-8,-4 q6,-6 12,0 q4,4 8,2 M-14,4 q8,2 12,-2" fill="none" stroke="#7DAF62" stroke-width="2"/></g>', text: "せかいの ちず" }, { t: "window", a: 7.1, b: 9.9, z0: 104, z1: 200, sky: "#BFE3F7" }, { t: "clock", a: 10.4, z: 200 }],
    },
    fixtures: [
      ["wallshelf", 4, 0, 3, 1, "にもつの たな", { variant: "parcels", sign: "にもつ", height: 150, wood: "#B7C2CB" }], ["parcelstack", 4, 1, 1, 1, "にもつの やま"], ["giftboxes", 6, 1, 1, 1, "ちいさな こづつみ"],
      ["lockers", 0, 0, 3, 1, "はいたつ ロッカー"], ["conveyor", 7, 0, 3, 1, "にもつの ベルト"],
      ["wallshelf", 0, 3, 1, 3, "にもつの たな", { variant: "parcels", sign: "にもつ", wood: "#B7C2CB" }], ["sortingtable", 0, 7, 2, 2, "しわけ コーナー"],
      ["cart", 8, 5, 1, 1, "はこぶ カート"], ["planemodel", 8, 8, 1, 1, "ひこうきの もけい"], ["parcelstack", 9, 10, 1, 1, null], ["plant", 0, 11, 1, 1, null, { variant: "tall" }],
      ["npc", 2, 5, 1, 1, "はいたつの なかま", { sp: "penguin", ci: 1, dir: "down", action: "chat", lines: ["そらの はいたつ、きょうも いそがしい！", "にもつは ていねいに ね。"] }],
    ],
  },
};
