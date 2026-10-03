// ゲームデータ（アイテム・服・家具・食べ物・敵・とくぎ・お店）

// ---- 着せ替えアイテム ----
// slot: head/face/neck/body/back, wear: chara.js の描画関数名, col: 色, st: ステータス補正
const WEAR_ITEMS = [
  { id: "ribbon_pink", slot: "head", wear: "ribbon", col: ["#F48FB1"], name: "リボン（ピンク）", price: 60 },
  { id: "ribbon_blue", slot: "head", wear: "ribbon", col: ["#81D4FA"], name: "リボン（みずいろ）", price: 60 },
  { id: "strawhat", slot: "head", wear: "strawhat", col: ["#F2D48A", "#E35D5B"], name: "むぎわらぼうし", price: 120, st: { spd: 1 } },
  { id: "beret", slot: "head", wear: "beret", col: ["#E35D5B"], name: "ベレーぼう", price: 150, st: { sp: 2 } },
  { id: "knit", slot: "head", wear: "knit", col: ["#5C9DED", "#FFFFFF"], name: "ニットぼう", price: 140, st: { def: 1 } },
  { id: "hachimaki", slot: "head", wear: "hachimaki", col: ["#FFFFFF", "#E8262A"], name: "はちまき", price: 100, st: { atk: 1 } },
  { id: "partyhat", slot: "head", wear: "partyhat", col: ["#7E57C2", "#FFD54F"], name: "パーティーぼう", price: 150, st: { sp: 1 } },
  { id: "flowercrown", slot: "head", wear: "flowercrown", name: "はなかんむり", price: 180, st: { hp: 5 }, perk: "florist" },
  { id: "chefhat", slot: "head", wear: "chefhat", name: "コックぼう", price: 200, perk: "cook" },
  { id: "catears", slot: "head", wear: "catears", col: ["#3A3A48", "#F8A5C2"], name: "ねこみみ", price: 200, st: { spd: 2 } },
  { id: "helmet", slot: "head", wear: "helmet", col: ["#FFD54F"], name: "ヘルメット", price: 250, st: { def: 3 } },
  { id: "tophat", slot: "head", wear: "tophat", col: ["#3A3A48", "#E35D5B"], name: "シルクハット", price: 320, st: { sp: 3 } },
  { id: "crown", slot: "head", wear: "crown", col: ["#F7C948"], name: "おうかん", price: 0, st: { atk: 3, def: 3, sp: 3 }, rare: true },

  { id: "glasses", slot: "face", wear: "glasses", col: ["#1F1D1B"], name: "まるめがね", price: 120, st: { sp: 2 }, perk: "dentist" },
  { id: "sunglasses", slot: "face", wear: "sunglasses", name: "サングラス", price: 200, st: { spd: 1, atk: 1 } },
  { id: "heartglasses", slot: "face", wear: "heartglasses", col: ["#F06292"], name: "ハートめがね", price: 220, st: { hp: 6 } },
  { id: "blush", slot: "face", wear: "blush", col: ["#F8A5C2"], name: "ほっぺシール", price: 50 },
  { id: "bandage", slot: "face", wear: "bandage", name: "ばんそうこう", price: 40, st: { def: 1 } },
  { id: "mustache", slot: "face", wear: "mustache", col: ["#6B4A2B"], name: "おひげ", price: 150, st: { atk: 1 } },

  { id: "scarf_red", slot: "neck", wear: "scarf", col: ["#E35D5B"], name: "スカーフ（あか）", price: 100, st: { atk: 1 } },
  { id: "scarf_green", slot: "neck", wear: "scarf", col: ["#66BB6A"], name: "スカーフ（みどり）", price: 100, st: { def: 1 } },
  { id: "bowtie_red", slot: "neck", wear: "bowtie", col: ["#E8262A"], name: "ちょうネクタイ（あか）", price: 120 },
  { id: "bowtie_blue", slot: "neck", wear: "bowtie", col: ["#3F7FD9"], name: "ちょうネクタイ（あお）", price: 120 },
  { id: "bell", slot: "neck", wear: "bell", col: ["#E35D5B"], name: "すずのくびわ", price: 150, st: { spd: 1 } },
  { id: "bib", slot: "neck", wear: "bib", col: ["#FFFFFF", "#F48FB1"], name: "よだれかけ", price: 60, perk: "eat" },
  { id: "muffler", slot: "neck", wear: "muffler", col: ["#E35D5B", "#FFFFFF"], name: "しましまマフラー", price: 160, st: { def: 1, hp: 4 } },
  { id: "necklace", slot: "neck", wear: "necklace", col: ["#F06292"], name: "しんじゅのネックレス", price: 350, st: { sp: 4 } },

  { id: "tshirt_red", slot: "body", wear: "tshirt", col: ["#E35D5B"], name: "Tシャツ（あか）", price: 100, st: { atk: 1 } },
  { id: "tshirt_blue", slot: "body", wear: "tshirt", col: ["#5C9DED"], name: "Tシャツ（あお）", price: 100, st: { def: 1 } },
  { id: "tshirt_star", slot: "body", wear: "tshirt", col: ["#FFD54F", "#FFFFFF"], name: "ほしのTシャツ", price: 150, st: { spd: 1 } },
  { id: "stripe", slot: "body", wear: "stripe", col: ["#3A4A7A", "#FFFFFF"], name: "しましまシャツ", price: 160, st: { def: 1, spd: 1 } },
  { id: "sweater", slot: "body", wear: "sweater", col: ["#8D6E63", "#FFFFFF"], name: "もこもこセーター", price: 200, st: { def: 2 } },
  { id: "overalls", slot: "body", wear: "overalls", col: ["#5C8FD6"], name: "オーバーオール", price: 220, st: { def: 1, hp: 5 } },
  { id: "dress", slot: "body", wear: "dress", col: ["#F8A5C2", "#FFFFFF"], name: "ワンピース", price: 260, st: { sp: 3 } },
  { id: "apron", slot: "body", wear: "apron", col: ["#FFFFFF", "#F48FB1"], name: "エプロン", price: 180, perk: "shop" },
  { id: "raincoat", slot: "body", wear: "raincoat", col: ["#FFD54F"], name: "レインコート", price: 200, st: { def: 2 } },
  { id: "happi", slot: "body", wear: "happi", col: ["#3F7FD9"], name: "はっぴ", price: 240, st: { atk: 2 } },
  { id: "pajama", slot: "body", wear: "pajama", col: ["#A7D3F2", "#FFFFFF"], name: "パジャマ", price: 150, perk: "sleep" },
  { id: "armor", slot: "body", wear: "armor", col: ["#B8C4D6"], name: "ゆうしゃのよろい", price: 800, st: { def: 5, hp: 10 } },

  { id: "backpack", slot: "back", wear: "backpack", col: ["#F29A1F"], name: "たんけんリュック", price: 250, perk: "explore" },
  { id: "cape", slot: "back", wear: "cape", col: ["#E8262A", "#F7C948"], name: "ヒーローマント", price: 500, st: { atk: 3 } },
  { id: "shell", slot: "back", wear: "shell", col: ["#7CB342"], name: "かめのこうら", price: 400, st: { def: 4, spd: -1 } },
  { id: "wings", slot: "back", wear: "wings", col: ["#FFFFFF"], name: "てんしのはね", price: 600, st: { spd: 3, hp: 6 } },
  { id: "fairywings", slot: "back", wear: "fairywings", col: ["#B3E5FC"], name: "ようせいのはね", price: 700, st: { spd: 2, sp: 5 } },
  { id: "batwings", slot: "back", wear: "batwings", col: ["#5B4B8A"], name: "こうもりのはね", price: 0, st: { spd: 2, atk: 2 }, rare: true },
];

const SLOT_NAMES = { head: "あたま", face: "かお", neck: "くび", body: "ふく", back: "せなか" };
// outfit の キー（きがえの タブは SLOT_NAMES）。head2 は あたまの 2つめ（UI-43・js/chara.js の HeadPair）
const WEAR_SLOT_KEYS = ["head", "head2", "face", "neck", "body", "back"];
const PERK_TEXT = {
  cook: "クレープ・パンやさんで チップ+20%",
  florist: "おはなやさんで チップ+20%",
  dentist: "はいしゃさんで チップ+20%",
  shop: "ぜんぶの おみせで チップ+10%",
  sleep: "ねると ごきげんが もっとあがる",
  eat: "ごはんの ごきげん+50%",
  explore: "たからばこの コイン+50%",
};

const ITEM_INDEX = {};
for (const it of WEAR_ITEMS) ITEM_INDEX[it.id] = it;

// ---- キャラの基本ステータス [レベル1の値, 1レベルごとの伸び] ----
const CHARA_STATS = {
  wanko: { hp: [42, 8], sp: [12, 2], atk: [12, 3], def: [9, 2], spd: [10, 2] },
  gachan: { hp: [34, 6], sp: [18, 3], atk: [9, 2], def: [7, 2], spd: [14, 3] },
  goji: { hp: [56, 11], sp: [10, 2], atk: [14, 3], def: [12, 3], spd: [6, 1] },
};
const CHARA_INFO = {
  wanko: { role: "バランスタイプ", like: ["bone", "meat"], dislike: ["pepper"], desc: "げんきいっぱいの わんこ。みんなを ひっぱる リーダー。" },
  gachan: { role: "サポートタイプ", like: ["bread", "corn"], dislike: ["curry"], desc: "すばしっこい ひよこ。キズを なおすのが とくい。" },
  goji: { role: "パワータイプ", like: ["fish", "pudding"], dislike: ["curry"], desc: "おおきくて やさしい かいじゅう。ガォー、ガゥーと おしゃべり。からいのは にがて。" },
};

// ---- とくぎ ----
// target: enemy(1体) / enemies(全体) / ally(味方1人) / party(味方全員) / self / fallen(たおれた味方)
const SKILLS = {
  wan_punch: { user: "wanko", lv: 1, name: "ワンワンパンチ", sp: 3, target: "enemy", power: 1.6, fx: "punch", desc: "1たいに つよい パンチ" },
  howl: { user: "wanko", lv: 4, name: "とおぼえ", sp: 5, target: "party", buff: { atk: 1.3 }, turns: 3, fx: "howl", desc: "みんなの こうげきりょく アップ" },
  boomerang: { user: "wanko", lv: 8, name: "ほねブーメラン", sp: 6, target: "enemies", power: 1.0, fx: "bone", desc: "てき ぜんいんに こうげき" },
  wonderful: { user: "wanko", lv: 15, name: "ワンダフルアタック", sp: 10, target: "enemy", power: 2.7, fx: "star", desc: "1たいに すごい いちげき" },
  piyo_heal: { user: "gachan", lv: 1, name: "ぴよぴよヒール", sp: 4, target: "ally", heal: 0.45, fx: "heal", desc: "なかま1人の HPを かいふく" },
  flap: { user: "gachan", lv: 2, name: "はばたき", sp: 3, target: "enemies", power: 0.75, fx: "wind", desc: "かぜで てき ぜんいんに こうげき" },
  cheer: { user: "gachan", lv: 6, name: "おうえんダンス", sp: 7, target: "party", heal: 0.3, fx: "heal", desc: "みんなの HPを かいふく" },
  barrier: { user: "gachan", lv: 10, name: "ぴよバリア", sp: 6, target: "party", buff: { def: 1.45 }, turns: 3, fx: "shield", desc: "みんなの ぼうぎょりょく アップ" },
  revive: { user: "gachan", lv: 14, name: "ふっかつのうた", sp: 12, target: "fallen", revive: 0.5, fx: "heal", desc: "たおれた なかまを ふっかつ" },
  roar: { user: "goji", lv: 1, name: "ガオー！", sp: 4, target: "enemies", power: 0.8, scare: 0.3, fx: "roar", desc: "てき ぜんいん。ときどき すくませる" },
  tail: { user: "goji", lv: 3, name: "しっぽアタック", sp: 3, target: "enemy", power: 1.8, fx: "punch", desc: "1たいに おもい いちげき" },
  harden: { user: "goji", lv: 7, name: "かたくなる", sp: 3, target: "self", buff: { def: 1.7 }, turns: 3, taunt: true, fx: "shield", desc: "かたくなって みんなを まもる" },
  breath: { user: "goji", lv: 12, name: "ゴジブレス", sp: 10, target: "enemies", power: 1.7, fx: "fire", desc: "てき ぜんいんに はげしい いき" },
  // てきの わざ
  e_tackle: { name: "たいあたり", power: 1.0, fx: "punch" },
  e_bite: { name: "かみつき", power: 1.25, fx: "punch" },
  e_sleep: { name: "ねむりのこな", power: 0, sleep: 0.55, fx: "sleep", targetAll: false },
  e_spore: { name: "ふわふわほうし", power: 0.55, all: true, fx: "sleep" },
  e_leaf: { name: "はっぱカッター", power: 0.8, all: true, fx: "wind" },
  e_heal: { name: "ひなたぼっこ", heal: 0.3, fx: "heal" },
  e_sting: { name: "チクッとさす", power: 1.2, fx: "punch" },
  e_rock: { name: "いわおとし", power: 1.4, fx: "rock" },
  e_shine: { name: "キラキラビーム", power: 0.9, all: true, fx: "star" },
  e_wave: { name: "ちょうおんぱ", power: 0.7, all: true, fx: "wind" },
  e_press: { name: "ぷるぷるプレス", power: 1.3, all: true, fx: "rock" },
  e_royal: { name: "おうさまのいかり", power: 1.9, fx: "star" },
};

// ---- たべもの（ごはん・バトルでも使える） ----
// そのままの やさい（とうもろこし・ピーマン と はたけの やさい）は おなかが すくなめ。りょうりに すると おなかも ごきげんも もっと もどる（UI-35・js/food-balance.js）
const FOODS = [
  {id:"burger",name:"チーズバーガー",price:70,hunger:44,mood:10,hp:42,desc:"こんがり おにくと やさいの バーガー"},
  { id: "apple", name: "りんご", price: 15, hunger: 12, mood: 4, hp: 15, desc: "あまずっぱい りんご" },
  { id: "onigiri", name: "おにぎり", price: 20, hunger: 26, mood: 4, hp: 25, desc: "おなかが ふくれる" },
  { id: "bread", name: "メロンパン", price: 25, hunger: 22, mood: 6, hp: 20, desc: "がちゃんの だいこうぶつ" },
  { id: "corn", name: "とうもろこし", price: 30, hunger: 11, mood: 5, hp: 22, desc: "つぶつぶ あまい" },
  { id: "bone", name: "ほねっこクッキー", price: 35, hunger: 14, mood: 12, hp: 12, desc: "わんこの だいこうぶつ" },
  { id: "fish", name: "やきざかな", price: 45, hunger: 32, mood: 6, hp: 35, desc: "ごじの だいこうぶつ" },
  { id: "meat", name: "ほねつきにく", price: 60, hunger: 42, mood: 8, hp: 45, desc: "ボリューム まんてん" },
  { id: "curry", name: "カレーライス", price: 80, hunger: 55, mood: 8, hp: 60, spicy: true, desc: "からくて 3にんとも にがて" },
  { id: "pepper", name: "ピーマン", price: 12, hunger: 5, mood: -4, hp: 30, desc: "からだに いいけど にがい" },
  { id: "milk", name: "ぎゅうにゅう", price: 20, hunger: 8, mood: 5, sp: 8, desc: "げんき(SP)が すこし もどる" },
  { id: "juice", name: "オレンジジュース", price: 30, hunger: 6, mood: 8, sp: 15, desc: "げんき(SP)が もどる" },
  { id: "candy", name: "キャンディ", price: 10, hunger: 3, mood: 7, sp: 5, desc: "ちいさな しあわせ" },
  { id: "pudding", name: "プリン", price: 50, hunger: 12, mood: 18, hp: 15, desc: "とろける おいしさ" },
  { id: "cake", name: "ショートケーキ", price: 90, hunger: 20, mood: 28, hp: 25, desc: "とくべつな ごほうび" },
  { id: "protein", name: "きんにくクッキー", price: 300, hunger: 8, mood: 2, boost: { atk: 1 }, desc: "こうげき が ずっと +1" },
  { id: "katatea", name: "かちかちティー", price: 300, hunger: 5, mood: 2, boost: { def: 1 }, desc: "ぼうぎょ が ずっと +1" },
  { id: "byuname", name: "びゅんびゅんアメ", price: 300, hunger: 3, mood: 4, boost: { spd: 1 }, desc: "すばやさ が ずっと +1" },
  { id: "vitamin", name: "げんきビタミン", price: 300, hunger: 3, mood: 2, boost: { hp: 4, sp: 1 }, desc: "さいだいHP+4 SP+1" },
];
// ---- どうぐ（バトル用） ----
const TOOLS = [
  { id: "bandaid", name: "ばんそうこう", price: 20, hp: 30, desc: "HPを 30 かいふく" },
  { id: "bigbandaid", name: "でかばんそうこう", price: 70, hp: 120, desc: "HPを 120 かいふく" },
  { id: "drink", name: "げんきドリンク", price: 45, sp: 15, desc: "SPを 15 かいふく" },
  { id: "feather", name: "ふっかつのはね", price: 150, revive: 0.5, desc: "たおれた なかまを ふっかつ" },
  { id: "smoke", name: "にげだまくん", price: 40, escape: true, desc: "かならず にげられる" },
];
const BAG_INDEX = {};
for (const f of FOODS) BAG_INDEX[f.id] = { ...f, kind: "food" };
for (const t of TOOLS) BAG_INDEX[t.id] = { ...t, kind: "tool" };

// ---- かぐ・かべがみ・ゆか ----
// kind: floor(床に置く) / rug(床にしく・いちばん下) / wall(かべにかける)
const FURNITURE = [
  { id: "bed_simple", name: "ベッド", price: 300, kind: "floor", w: 104, h: 74, comfort: 5, sleep: 1 },
  { id: "bed_royal", name: "おひめさまベッド", price: 1400, kind: "floor", w: 118, h: 104, comfort: 12, sleep: 2 },
  { id: "table_wood", name: "きのテーブル", price: 150, kind: "floor", w: 76, h: 50, comfort: 3 },
  { id: "chair_wood", name: "きのいす", price: 80, kind: "floor", w: 34, h: 52, comfort: 1 },
  { id: "sofa", name: "ふかふかソファ", price: 450, kind: "floor", w: 104, h: 62, comfort: 6 },
  { id: "bookshelf", name: "ほんだな", price: 260, kind: "floor", w: 62, h: 92, comfort: 3 },
  { id: "tv", name: "テレビ", price: 520, kind: "floor", w: 70, h: 72, comfort: 5 },
  { id: "plant", name: "かんようしょくぶつ", price: 120, kind: "floor", w: 40, h: 70, comfort: 3 },
  { id: "lamp", name: "スタンドライト", price: 160, kind: "floor", w: 34, h: 88, comfort: 2 },
  { id: "toybox", name: "おもちゃばこ", price: 180, kind: "floor", w: 60, h: 44, comfort: 3 },
  { id: "piano", name: "ピアノ", price: 950, kind: "floor", w: 100, h: 84, comfort: 8 },
  { id: "kotatsu", name: "こたつ", price: 620, kind: "floor", w: 96, h: 56, comfort: 8 },
  { id: "mushroom", name: "きのこのいす", price: 100, kind: "floor", w: 40, h: 40, comfort: 2 },
  { id: "teddy", name: "くまのぬいぐるみ", price: 220, kind: "floor", w: 40, h: 44, comfort: 4 },
  { id: "fishbowl", name: "きんぎょばち", price: 240, kind: "floor", w: 44, h: 64, comfort: 4 },
  { id: "trophy", name: "キングのトロフィー", price: 0, kind: "floor", w: 40, h: 56, comfort: 10, rare: true },
  { id: "rug_round", name: "まるいラグ", price: 150, kind: "rug", w: 150, h: 46, comfort: 2 },
  { id: "rug_star", name: "ほしのラグ", price: 260, kind: "rug", w: 150, h: 50, comfort: 3 },
  { id: "window", name: "まど", price: 200, kind: "wall", w: 76, h: 64, comfort: 3 },
  { id: "clock", name: "はとどけい", price: 250, kind: "wall", w: 44, h: 60, comfort: 2 },
  { id: "painting", name: "やまのえ", price: 300, kind: "wall", w: 70, h: 52, comfort: 4 },
  { id: "shelf", name: "かべかけだな", price: 150, kind: "wall", w: 74, h: 36, comfort: 2 },
  { id: "garland", name: "ガーランド", price: 120, kind: "wall", w: 120, h: 34, comfort: 2 },
  { id: "poster", name: "3にんのポスター", price: 180, kind: "wall", w: 50, h: 66, comfort: 3 },
];
const FURN_INDEX = {};
for (const f of FURNITURE) FURN_INDEX[f.id] = f;

const WALLPAPERS = [
  { id: "wp_cream", name: "クリームいろ", price: 0, base: "#FFF4DC", c2: "#F6E6C4", pat: "plain", comfort: 0 },
  { id: "wp_stripe", name: "ピンクのしましま", price: 220, base: "#FFE3EC", c2: "#FFC9DA", pat: "stripe", comfort: 2 },
  { id: "wp_dots", name: "みずたま", price: 220, base: "#DDF1FF", c2: "#FFFFFF", pat: "dots", comfort: 2 },
  { id: "wp_check", name: "わかばチェック", price: 260, base: "#E6F5D8", c2: "#D2EABB", pat: "check", comfort: 2 },
  { id: "wp_wood", name: "ログハウス", price: 320, base: "#E8C49A", c2: "#D6AC7C", pat: "wood", comfort: 3 },
  { id: "wp_brick", name: "レンガ", price: 320, base: "#F2C6A8", c2: "#E3A987", pat: "brick", comfort: 3 },
  { id: "wp_star", name: "ほしぞら", price: 480, base: "#3B4A86", c2: "#FFE66D", pat: "star", comfort: 4 },
  { id: "wp_cloud", name: "あおぞら", price: 480, base: "#A8DBFF", c2: "#FFFFFF", pat: "cloud", comfort: 4 },
];
const FLOORS = [
  { id: "fl_wood", name: "フローリング", price: 0, base: "#D9A66C", c2: "#C99058", pat: "plank", comfort: 0 },
  { id: "fl_checker", name: "チェッカータイル", price: 240, base: "#FFFFFF", c2: "#F4B6C2", pat: "checker", comfort: 2 },
  { id: "fl_carpet", name: "ピンクカーペット", price: 260, base: "#F7B8C8", c2: "#F3A5B9", pat: "carpet", comfort: 3 },
  { id: "fl_tatami", name: "たたみ", price: 300, base: "#CFD98A", c2: "#B9C46F", pat: "tatami", comfort: 3 },
  { id: "fl_grass", name: "しばふ", price: 360, base: "#9ED67A", c2: "#86C463", pat: "grass", comfort: 4 },
  { id: "fl_stone", name: "いしだたみ", price: 300, base: "#C9C3BA", c2: "#B3ACA2", pat: "stone", comfort: 2 },
];
const WALL_INDEX = {}, FLOOR_INDEX = {};
for (const w of WALLPAPERS) WALL_INDEX[w.id] = w;
for (const f of FLOORS) FLOOR_INDEX[f.id] = f;

// ---- てき ----
// lv は基準レベル。実際のレベルで能力が伸びる
const ENEMIES = {
  purun: { name: "プルン", art: "slime", col: "#9BD77A", lv: 1, hp: 22, atk: 9, def: 4, spd: 6, exp: 5, coin: [5, 9], skills: ["e_tackle"], desc: "はらっぱの ぷるぷる。さわると ひんやり。" },
  moko: { name: "モコモコ", art: "fluff", col: "#F8C8DC", lv: 2, hp: 18, atk: 8, def: 3, spd: 12, exp: 6, coin: [6, 10], skills: ["e_tackle", "e_sleep"], desc: "ふわふわの けだま。ねむくなる こなを まく。" },
  bunbun: { name: "ブンブン", art: "bee", col: "#FFD54F", lv: 3, hp: 20, atk: 11, def: 4, spd: 15, exp: 8, coin: [7, 12], skills: ["e_tackle", "e_sting"], desc: "はなばたけの ハチ。おこると チクッと さす。" },
  kinokko: { name: "キノッコ", art: "mushroom", col: "#E35D5B", lv: 6, hp: 50, atk: 17, def: 11, spd: 8, exp: 16, coin: [11, 17], skills: ["e_tackle", "e_spore"], desc: "もりの きのこ。ほうしを ふわっと とばす。" },
  donguri: { name: "ドングリン", art: "acorn", col: "#B07A4A", lv: 6, hp: 44, atk: 19, def: 13, spd: 10, exp: 17, coin: [12, 18], skills: ["e_tackle", "e_bite"], desc: "ぼうしが じまんの どんぐり。" },
  happa: { name: "ハッパン", art: "leaf", col: "#7CB342", lv: 7, hp: 40, atk: 16, def: 9, spd: 14, exp: 18, coin: [12, 19], skills: ["e_leaf", "e_heal"], desc: "はっぱの ようせい。ひなたぼっこで げんきに なる。" },
  akapurun: { name: "アカプルン", art: "slime", col: "#F28B82", lv: 8, hp: 58, atk: 20, def: 12, spd: 10, exp: 22, coin: [14, 22], skills: ["e_tackle", "e_bite"], desc: "ちょっと おこりんぼの プルン。" },
  koumori: { name: "コウモリン", art: "bat", col: "#7E6BA8", lv: 11, hp: 70, atk: 26, def: 15, spd: 20, exp: 34, coin: [20, 30], skills: ["e_bite", "e_wave"], desc: "どうくつの コウモリ。ちょうおんぱで こうげき。" },
  iwagoro: { name: "イワゴロ", art: "rock", col: "#A8A29A", lv: 12, hp: 96, atk: 28, def: 26, spd: 6, exp: 40, coin: [24, 34], skills: ["e_tackle", "e_rock"], desc: "ゴロゴロ ころがる いわ。とっても かたい。" },
  kirakira: { name: "キラリン", art: "crystal", col: "#8FD3F4", lv: 13, hp: 78, atk: 30, def: 18, spd: 16, exp: 44, coin: [26, 38], skills: ["e_shine", "e_tackle"], desc: "どうくつの おくで ひかる すいしょう。" },
  king: { name: "キングプルン", art: "slime_king", col: "#6FC3E8", lv: 18, hp: 640, atk: 42, def: 26, spd: 12, exp: 420, coin: [500, 500], skills: ["e_press", "e_royal", "e_tackle"], boss: true, desc: "どうくつの おくに すむ プルンの おうさま。" },
};

// エリアごとの出現テーブル [id, 最小Lv, 最大Lv, 重み]
const AREAS = {
  meadow: { name: "ぽかぽかはらっぱ", bg: "meadow", table: [["purun", 1, 3, 5], ["moko", 2, 4, 4], ["bunbun", 3, 5, 3]], group: [1, 2] },
  forest: { name: "どんぐりのもり", bg: "forest", table: [["kinokko", 6, 8, 4], ["donguri", 6, 9, 4], ["happa", 7, 9, 3], ["akapurun", 8, 10, 3]], group: [1, 3] },
  cave: { name: "キラキラどうくつ", bg: "cave", table: [["koumori", 11, 14, 4], ["iwagoro", 12, 15, 3], ["kirakira", 13, 16, 3]], group: [1, 3] },
};

// ---- おてつだいの お店（ミニゲーム） ----
const SHOPS = {
  burger:{name:"バーガーやさん",color:"#E5C69F",desc:"じゅんばんを おぼえて ぐざいを つもう",perk:"cook"},
  groom: {name:"びようしつ",color:"#BFDED7",desc:"なぞって カット、ふんわり しあげよう",perk:"shop"},
  cake: { name: "ケーキやさん", color: "#EDBAC6", desc: "きねんびの ケーキを ちゅうもんどおりに", perk: "cook" },
  crepe: { name: "クレープやさん", color: "#F8A5C2", desc: "ちゅうもんどおりの クレープを つくろう", perk: "cook" },
  dentist: { name: "はいしゃさん", color: "#8FD3F4", desc: "ばいきんを やっつけて はを ピカピカに", perk: "dentist" },
  bakery: { name: "パンやさん", color: "#F2C27B", desc: "ちょうどいい やきかげんで パンを やこう", perk: "cook" },
  florist: { name: "おはなやさん", color: "#B5E08A", desc: "ちゅうもんどおりの はなたばを つくろう", perk: "florist" },
  // ころころ フルーツ（js/mg-korokoro.js）: おなじ もの どうしを くっつけて 大きく する おちもの パズル。ちゅうもん モードは 4にん・箱は あいだも つづく
  // スコア モードは js/korokoro-score.js（「おてつだいする」の あとで えらぶ）
  korokoro: { name: "ころころ フルーツ", color: "#F2C48D", desc: "おなじ ものを くっつけて おおきく しよう", perk: "shop", rounds: 4,
    lines: ["また こんど おねがいね", "ありがとう！", "まんまるで おいしそう！", "わぁ！ ぴかぴかの くだもの！"] },
  // ネリカス ガソリンスタンド（js/neri-gas.js）: きゅうゆ → せんしゃ →（Lv.3 から）タイヤ
  gasstand: { name: "ガソリンスタンド", color: "#F2A65A", desc: "きゅうゆと せんしゃで くるまを ぴかぴかに", perk: "shop",
    lines: ["また こんど おねがいね……", "うーん、まあまあかな", "ぴかぴか！ ありがとう！", "わぁ！ あたらしい くるま みたい！"] },
  // ネリカス ゆうびんきょく（js/neri-post.js）: けしいんを おして あてさきの はこへ
  postoffice: { name: "ゆうびんきょく", color: "#E8766A", desc: "けしいんを おして、あてさきの はこに わけよう", perk: "shop",
    lines: ["あてさきが ちがうよ……", "うーん、まあまあかな", "ちゃんと とどくね！ ありがとう！", "かんぺき！ すぐに とどくね！"] },
  // あたまの たいそう（js/mg-brain.js・UI-64）: のうトレの おてつだい。まちがい さがし・おなじ え さがし・くだもの けいさん から えらぶ
  brain: { name: "あたまの たいそう", color: "#9DB8E8", desc: "まちがい さがし・おなじ え さがし・くだもの けいさん", perk: "shop", rounds: 4,
    lines: ["また いっしょに かんがえようね", "うーん、もう すこし！", "よく できました！", "はなまる！ すごい ひらめき！"] },
  // パズル こうぼう（js/mg-kobo.js・UI-65）: パズルの おてつだい。スライド パズル・かたち はめ・おえかき ロジック から えらぶ
  kobo: { name: "パズル こうぼう", color: "#E9B872", desc: "スライド パズル・かたち はめ・おえかき ロジック", perk: "shop", rounds: 4,
    lines: ["また いっしょに とこうね", "うーん、もう すこし！", "よく とけたね！", "すっきり！ パズル めいじん！"] },
};
const SHOP_LV_REP = [0, 0, 120, 360, 800, 1600]; // レベルn に必要な評判
