// ② 町の人の 会話・物々交換・サブイベント（おねがい）の 元データ。build-townsfolk.mjs が 検査して JSON / JS / 一覧に する。
// 会話の 条件は ① と 同じ 書きかた（t: 時間 / w: 天気 / s: 季節 / f: おまつり / e: できごと）。e:boss は ボスを たおした あと。
// x: は「その しせつ・あそびが ゲームに できてから」（x:!aquarium は「まだ ない あいだ」）。b:5 は なかよし ポイントが 5 いじょう。
// 文は 吹き出しでは なく 会話まど（UI.say）に 出るので、1ページ 2行（\n）まで。

export const NPC_LINES = {
  mayor: { voice: "〜じゃ・〜のう", lines: [
    ["おはよう。はやおきは まちの じまんじゃ", "t:morning"], ["ひるの まちは にぎやかで いいのう", "t:day"], ["ゆうやけの まちも なかなか じゃろう？", "t:evening"],
    ["よるは あかりが きれいじゃ。はやく おかえり", "t:night"], ["あめの ひは、みちが すべる。きを つけるんじゃぞ", "w:rain"], ["ゆきの ひは、わしが ゆきかきを するぞい", "w:snow"],
    ["はるは さくら。まちじゅうが ももいろじゃ", "s:spring"], ["なつまつりの じゅんびで いそがしいのう", "s:summer"], ["あきは みのりの きせつ。いもほりが たのしみじゃ", "s:autumn"],
    ["ふゆは こたつに かぎるのう", "s:winter"], ["あけまして おめでとう。ことしも なかよくな", "f:newyear"], ["キングを たおすとは、まちの ほこりじゃ！", "e:boss"],
    ["みなとに すいぞくかんが できたら、わしも いきたいのう", "x:!aquarium"], ["すいぞくかんの おおきな すいそう、みごとじゃった", "x:aquarium"], ["はくぶつかんの きょうりゅう、みたことが あるかの？", "x:museum"], ["なにか こまったら、まちの ひとに はなしかけて みるんじゃ", ""],
  ] },
  cat: { voice: "〜にゃ・うわさ話", lines: [
    ["にゃあ… あさは ねむいにゃ", "t:morning"], ["ひなたぼっこ、さいこうにゃ", "w:clear"], ["あめは にがて… けが しめるにゃ", "w:rain"], ["よるの まちは、ねこの じかん にゃ", "t:night"],
    ["クレープの あたらしい あじ、しってる？", ""], ["うわさだと、いけに おおきな さかなが いるらしいにゃ", ""], ["つりざお、ほしいにゃ… おさかな…", ""],
    ["はるは ちょうちょを おいかけたく なるにゃ", "s:spring"], ["なつは ひかげで おひるねにゃ", "s:summer"], ["あきの さんま、たべたいにゃ", "s:autumn"],
    ["こたつの なかは ねこの ばしょにゃ", "s:winter"], ["ハロウィンの かそう、くろねこに するにゃ", "f:halloween"], ["ボスを たおしたの？ まちで うわさにゃ！", "e:boss"],
  ] },
  rabbit: { voice: "〜わ・〜の（やさしい）", lines: [
    ["おはよう。おはなに あさつゆが ついてるわ", "t:morning"], ["おひさまを あびて、おはなも げんきよ", "w:clear"], ["あめは おはなの ごはん なの", "w:rain"],
    ["かぜが つよいと、はなびらが とんで いっちゃう", "w:wind"], ["さくらの きせつね。いっしょに みに いきましょ", "s:spring"], ["あさがおが さいたわ。あおくて きれい", "s:summer"],
    ["コスモスが ゆれてる… あきの おはなね", "s:autumn"], ["ふゆは パンジーが がんばってるの", "s:winter"], ["あじさいの いろ、つちで かわるのよ", "f:hydrangea"],
    ["ひなまつりには、ももの はなを かざるの", "f:hina"], ["おはなやさんの おてつだい、たのしかった？", ""], ["はなかんむり、にあってるわ", ""], ["ゆうがたの おはなも、すてきでしょ", "t:evening"],
  ] },
  penguin: { voice: "ペンペン・クール", lines: [
    ["ペンペン。あさの いけは しずかだね", "t:morning"], ["いけの さかな、きょうは よく はねてる", "w:cloudy"], ["あめの ひは、さかなが よく つれるんだ", "w:rain"],
    ["ゆきの ひは… ぼくの てんき！", "w:snow"], ["なつは あついね… こおり たべたい", "s:summer"], ["つりは まつのが だいじ。あわてない、あわてない", ""],
    ["この いけには、きんいろの コイが いるって うわさ", ""], ["すいぞくかん、ぼくの なかまも いるかな", ""], ["ペンペン。ふゆの いけは こおりそうだね", "s:winter"],
    ["ゆうがたは、さかなが えさを さがす じかん", "t:evening"], ["よるの いけ、ほしが うつって きれい", "t:night"], ["クリスマス、ペンギンの かざりを みたよ", "f:christmas"],
  ] },
  frog: { voice: "ケロ・のんびり", lines: [
    ["ケロケロ！ あめだ、あめだ〜！", "w:rain"], ["ケロ〜。はれの ひは ひかげで ひとやすみ", "w:clear"], ["あさの さんぽ、きもちいい ケロ", "t:morning"],
    ["よるの ひろば、しずかで すき ケロ", "t:night"], ["つゆの じきは、ぼくの きせつ ケロ！", "f:hydrangea"], ["なつの よるは、みんなで うたう ケロ", "s:summer"],
    ["ケロ… ふゆは ねむく なる…", "s:winter"], ["はるに なったら、おたまじゃくしが いっぱい", "s:spring"], ["はいしゃさん、こわく ないよ ケロ", ""],
    ["パンやさんの におい、ここまで する ケロ", ""], ["ぴょんと とんで、まちを いっしゅう！", ""], ["いしの したに むかしの ほねが ねむってるかも ケロ", ""],
  ] },
  sheep: { voice: "メェ〜・おしゃれ", lines: [
    ["メェ〜。きょうの ふく、すてきね", ""], ["あさは なにを きようか まよっちゃう", "t:morning"], ["あめの ひは、レインコートが いちばん", "w:rain"],
    ["ゆきの ひは マフラーで おしゃれ しましょ", "w:snow"], ["はるは パステルいろが かわいいの", "s:spring"], ["なつは むぎわらぼうしが にあうわ", "s:summer"],
    ["あきは セーターの きせつ ね", "s:autumn"], ["ふゆの けいとは、わたしの じまんよ メェ〜", "s:winter"], ["3にん おそろいも かわいいわ", ""],
    ["ハロウィンの かそう、もう きめた？", "f:halloween"], ["おしょうがつは はれぎを きたいわね", "f:newyear"], ["ゆうがたの ショーウィンドウ、きらきら", "t:evening"],
  ] },
  mouse: { voice: "チュウ・たんけんの こつ", lines: [
    ["チュウ！ あさの はらっぱは つゆで ぬれてる", "t:morning"], ["はらっぱの まもの、よるは すこし つよい チュウ", "t:night"], ["あめの ひは、どろに きを つけて", "w:rain"],
    ["かぜが つよいと、くさむらが ざわざわ チュウ", "w:wind"], ["ポケットに おにぎり、いれて いくと あんしん", ""], ["もりの おくで、へんな いしを みたんだ… ほね かな？", ""],
    ["チュウ… ピッケルが あれば、いわを わって みたい", ""], ["はるの はらっぱ、おはなが いっぱい", "s:spring"], ["なつは むしが いっぱい チュウ", "s:summer"],
    ["あきは どんぐりが おちてる よ", "s:autumn"], ["ふゆの はらっぱは まっしろ チュウ", "s:winter"], ["キングを たおしたって？ すごい チュウ！", "e:boss"],
  ] },
  pig: { voice: "ブーブー・たべもの", lines: [
    ["ブーブー！ あさごはん たべた？", "t:morning"], ["おひるは、カレーの きぶん ブー", "t:day"], ["ゆうごはんの かいもの、いそがなきゃ", "t:evening"],
    ["あめの ひは、あったかい スープが いいブー", "w:rain"], ["なつは スイカ！ まるごと ブー", "s:summer"], ["あきは おいもと くりの きせつ ブー！", "s:autumn"],
    ["ふゆは おでん。だいこん すき ブー", "s:winter"], ["はるは たけのこごはん ブー", "s:spring"], ["はたけの とうもろこし、あまいよ", ""],
    ["スーパーの とくばい、みのがせない ブー", ""], ["おつきみだんご、10こ たべた ブー", "f:moon"], ["おせち、ぜんぶ すき ブー", "f:newyear"],
  ] },
  parkcat: { voice: "のんびり・さんぽ", lines: [
    ["かわの おと、ずっと きいて いられるね", ""], ["あさの さんぽは、かぜが すずしい", "t:morning"], ["ゆうやけの かわも、いいもんだよ", "t:evening"],
    ["あめの あとは、かわが にごるね", "w:rain"], ["この かわ、アユが のぼって くるんだって", "s:summer"], ["はしの したは、さかなの かくれが", ""],
    ["はるは つくし、あきは すすき", "s:spring"], ["ふゆの かわは、いきが しろい", "s:winter"], ["つりを する なら、ゆうがたが いいよ", ""],
    ["いしを ひっくりかえすと、むしが いるよ", ""], ["おつきさま、かわに うつってる", "t:night"], ["のんびり いこうよ。いそがない いそがない", ""],
  ] },
  traveler: { voice: "たびの はなし", lines: [
    ["たびの とちゅうで、いろんな まちを みたよ", ""], ["みなみの しまでは、あおい さかなが およいでた", ""], ["きたの まちでは、ゆきで かまくらを つくったよ", "s:winter"],
    ["もりの いずみ、もう みつけたかい？", ""], ["あさの はらっぱは、とりの こえで いっぱい", "t:morning"], ["よるの はらっぱは、ほしが ちかいんだ", "t:night"],
    ["あめの もりは、きのこが にょきにょき", "w:rain"], ["とおくの はくぶつかんで、おおきな ほねを みたよ", ""], ["はるの たびは、さくらを おいかける たび", "s:spring"],
    ["あきの もりは、はっぱが じゅうたん みたい", "s:autumn"], ["たびの おともは、おにぎりと ゆうき", ""], ["なつの もりは すずしくて いい", "s:summer"],
  ] },
  explorer: { voice: "たんけんか・かせき", lines: [
    ["どうくつの おくには、むかしの ほねが ねむって いる！", ""], ["ピッケルで ひびの ある いわを わって みな", "x:fossil"], ["かせきは きれいに すると、ほねの かたちが わかるぞ", "x:fossil"],
    ["きょうりゅうの ほね、ぜんぶ そろえたら すごいぞ", ""], ["おなじ ほねが 2こ あったら、ぼくと こうかん しよう", "x:fossil"], ["あさの もりは、あしあとが よく みえる", "t:morning"],
    ["あめの あとは、いわの ひびが みつけやすい", "w:rain"], ["よるの どうくつは… まっくら。ランプを わすれずに", "t:night"], ["ふゆの もりは、しずかで たんけん びより", "s:winter"],
    ["キングプルンを たおしたか！ たいした ものだ", "e:boss"], ["はくぶつかんの はかせに、ほねを みせて ごらん", "x:museum"], ["なつの どうくつは、ひんやり して きもちいい", "s:summer"],
  ] },
  cityguide: { voice: "あんない・げんき", lines: [
    ["ようこそ シティへ！ きょうも にぎやかだよ", ""], ["あさの シティは、パンの においが するよ", "t:morning"], ["よるの シティは、ネオンが きれい！", "t:night"],
    ["あめの ひは、デパートで あそぼう", "w:rain"], ["シティの しゃてきじょう、もう あそんだ？ まとあて たのしいよ", "x:range"], ["しゃてきじょうでは、ゴーグルを わすれずに！", "x:range"],
    ["はくぶつかんで、きょうりゅうに あえるよ", "x:museum"], ["クリスマスの イルミネーション、みた？", "f:christmas"], ["なつの シティは、ふんすいが にんき", "s:summer"],
    ["はるの こうえんで、おはなみ できるよ", "s:spring"], ["あきの シティは、おいしい もの フェア！", "s:autumn"], ["ふゆの シティ、ホットココアが おすすめ", "s:winter"],
  ] },
  beachpenguin: { voice: "うみ・かいがら", lines: [
    ["なみの おと、きこえる？ ざざーん", ""], ["あさの うみは、きらきら ひかる", "t:morning"], ["ゆうがたの うみは、オレンジいろ", "t:evening"],
    ["あめの うみは、なみが たかいから きを つけて", "w:rain"], ["かぜの ひは、なみが おおきい ペン", "w:wind"], ["なつの うみ、みんなで およぎたいね", "s:summer"],
    ["すなはまで かいがら さがし しよう！", ""], ["つりざおが あれば、ていぼうで アジが つれるよ", ""], ["よるの うみで、ひかる さかなを みたんだ", "t:night"],
    ["ふゆの うみは、つめたいけど きれい", "s:winter"], ["はなびの よるは、うみが いちばん！", "f:fireworks"], ["すいぞくかんの おおきな すいそう、みた？", "x:aquarium"],
  ] },
  heiwadai_local: { voice: "まちの あんない・した町", lines: [
    ["えきまえの とけい、まちの めじるし なんだ", ""], ["しょうてんがいの たいやき、たべた？", "x:heiwadai2"], ["あさの えきまえは、つうきんの ひとで いっぱい", "t:morning"],
    ["ゆうがたの しょうてんがい、いい においが するよ", "t:evening"], ["あめの ひは、おみせの やねの したを あるこう", "w:rain"], ["さくらの きせつ、こうえんが ももいろに なるよ", "s:spring"],
    ["なつまつりには、しょうてんがいに やたいが でるよ", "s:summer x:heiwadai2"], ["あきの こうえん、どんぐりが いっぱい", "s:autumn"], ["ふゆの よる、えきまえが イルミネーションで きらきら", "s:winter"],
    ["じんじゃの まつの き、とっても ふるいんだって", "x:heiwadai2"], ["ろじうらの おじぞうさん、まいにち おはなが かざって あるの", "x:heiwadai2"], ["せんとうの えんとつ、とおくからでも みえるよ", "x:heiwadai2"],
  ] },
  portguide: { voice: "みなと・ふね", lines: [
    ["ふねの きてき、ぼーっ！ げんきな おと でしょ", ""], ["あさの みなとは、りょうしさんで にぎやか", "t:morning"], ["ゆうがたの みなと、ふねが かえって くるよ", "t:evening"],
    ["あめの ひは、ふねが ゆれるよ。きを つけて", "w:rain"], ["かぜが つよい ひは、ふねが おやすみ", "w:wind"], ["ていぼうで サバや イワシが つれるよ", ""],
    ["すいぞくかんは、みなとの となりに できる よてい！", "x:!aquarium"], ["つった さかなを すいぞくかんに あげると、よろこばれるよ", "x:aquarium"], ["なつの みなとは、カモメが いっぱい", "s:summer"],
    ["ふゆの みなと、さむいけど さかなが おいしい", "s:winter"], ["よるの みなと、とうだいの あかりが きれい", "t:night"], ["おしょうがつは、ふねに はたを かざるよ", "f:newyear"],
  ] },
  airguide: { voice: "パイロット・そら", lines: [
    ["きょうの そら、とびやすそう！", "w:clear"], ["くもの うえは、いつも はれ なんだよ", "w:cloudy"], ["あめの ひは、ひこうきも しんちょうに とぶよ", "w:rain"],
    ["かぜが つよい ひは、ちゃくりくが むずかしい", "w:wind"], ["あさの くうこうは、いちばん いそがしい", "t:morning"], ["よるの かっそうろ、ひかりの みち みたい", "t:night"],
    ["そらから みた まち、おもちゃ みたいに ちいさいよ", ""], ["なつの そらは、にゅうどうぐもが おおきい", "s:summer"], ["ふゆの そらは、とおくまで よく みえる", "s:winter"],
    ["いつか 3にんも、そうじゅうせきに すわって みる？", ""], ["はなびを そらから みたこと、ある？", "f:fireworks"], ["ゆうやけの そら、いちばん すきな いろ", "t:evening"],
  ] },
};

// 物々交換（町の人が たまに もちかける）。give = こちらが わたす / get = もらえる。fish: / bone: は ③④ の アイテム
export const BARTER = [
  { id: "bt-pig-corn", npc: "pig", give: { bag: "corn", n: 2 }, get: { bag: "bread", n: 1 }, text: "とうもろこし 2ほんと、メロンパン 1こ。こうかん しない ブー？" },
  { id: "bt-pig-pepper", npc: "pig", give: { bag: "pepper", n: 1 }, get: { bag: "mild_curry", n: 1 }, text: "ピーマン、ブーは だいすき！ あまくちカレーと こうかん ブー" },
  { id: "bt-rabbit-apple", npc: "rabbit", give: { bag: "apple", n: 2 }, get: { bag: "deza_sakura", n: 1 }, text: "りんごを 2こ くれたら、さくらもちを あげるわ" },
  { id: "bt-cat-milk", npc: "cat", give: { bag: "milk", n: 1 }, get: { bag: "candy", n: 2 }, text: "ぎゅうにゅう 1ぽんで、キャンディ 2こ にゃ。どう？" },
  { id: "bt-penguin-fish", npc: "penguin", give: { bag: "fish", n: 1 }, get: { bag: "juice", n: 2 }, text: "やきざかな 1こと、ジュース 2ほん。ペンペン？" },
  { id: "bt-frog-onigiri", npc: "frog", give: { bag: "onigiri", n: 1 }, get: { bag: "bandaid", n: 2 }, text: "おにぎり ほしい ケロ… ばんそうこう 2まいと こうかん！" },
  { id: "bt-sheep-juice", npc: "sheep", give: { bag: "juice", n: 2 }, get: { wear: "ribbon_blue" }, once: true, text: "ジュース 2ほんで、みずいろの リボンを あげる メェ〜" },
  { id: "bt-mouse-bread", npc: "mouse", give: { bag: "bread", n: 1 }, get: { bag: "drink", n: 1 }, text: "メロンパン 1こと、げんきドリンク 1ぽん。どう？ チュウ" },
  { id: "bt-mayor-apple", npc: "mayor", give: { bag: "apple", n: 3 }, get: { furn: "clock" }, once: true, text: "りんご 3こで、はとどけいを ゆずろう。どうじゃ？" },
  { id: "bt-traveler-milk", npc: "traveler", give: { bag: "milk", n: 2 }, get: { bag: "feather", n: 1 }, text: "ぎゅうにゅう 2ほんで、ふっかつのはねを 1まい あげよう" },
  { id: "bt-explorer-bone", npc: "explorer", give: { bone: "dup", n: 1 }, get: { bone: "missing-same-dino", n: 1 }, repeat: true, text: "おなじ ほねが あるね！ まだ ない ほねと こうかん しよう" },
  { id: "bt-beach-aji", npc: "beachpenguin", give: { fish: "aji", n: 2 }, get: { bag: "deza_ice", n: 1 }, text: "アジ 2ひきで、デザ・アイス！ つめたいよ ペン" },
  { id: "bt-port-saba", npc: "portguide", give: { fish: "saba", n: 1 }, get: { bag: "fish", n: 2 }, text: "サバ 1ぴきと、やきざかな 2こ。やきたてだよ" },
  { id: "bt-city-candy", npc: "cityguide", give: { bag: "candy", n: 2 }, get: { bag: "deza_jelly", n: 1 }, text: "キャンディ 2こで、デザ・ゼリー 1こ！ どう？" },
  { id: "bt-heiwa-bread", npc: "heiwadai_local", give: { bag: "bread", n: 1 }, get: { bag: "sandwich", n: 1 }, text: "メロンパンと、たまごサンド。こうかん しない？" },
  { id: "bt-air-juice", npc: "airguide", give: { bag: "juice", n: 1 }, get: { bag: "deza_ice", n: 1 }, text: "ジュース 1ぽんで、そらの アイス… じゃなくて デザ・アイス！" },
];

// サブイベント（おねがい）20種。chance は 話しかけた ときに もちかけられる かくりつ（10〜20%）
// steps の do: buy かう（かばんに n こ あれば すむ）/ give わたす / talk はなす（say は 3にんが つたえる ことば）
//   find さがす（spots こ の きらきらの どれかに ある）/ follow ついて くる（みつけた 子と いっしょに to へ）/ tap さわる（n かしょ）
//   photo しゃしん（near の 小物の r マス いないで）/ catch つる（③）/ dig ほる（④）/ quiz なぞなぞ / trade わらしべ（start を chain の じゅんに こうかん）
// 手順の さいごの 人が lines.done を 言う（とどけものなら とどけた あいて）。reward.first は はじめての ときだけ
export const EVENTS = [
  { id: "ev-milk", kind: "buy", title: "ぎゅうにゅうを かって きて", giver: "sheep", map: "town", chance: 0.15, limit: "daily",
    steps: [{ do: "buy", item: "milk", n: 1 }, { do: "give", to: "sheep", item: "milk", n: 1 }], reward: { coins: 80 },
    lines: { offer: "メェ〜、ぎゅうにゅうを きらしちゃったの。\nマーケットで 1ぽん かって きて くれる？", remind: "ぎゅうにゅう、まってるわ メェ〜", done: "ありがとう！ おれいに コインを どうぞ" } },
  { id: "ev-bread3", kind: "buy", title: "メロンパンを 3こ", giver: "penguin", map: "town", chance: 0.12, limit: "daily",
    steps: [{ do: "buy", item: "bread", n: 3 }, { do: "give", to: "penguin", item: "bread", n: 3 }], reward: { coins: 150 },
    lines: { offer: "ペンペン。みんなで おやつに したいんだ。\nメロンパンを 3こ、おねがい できる？", remind: "メロンパン 3こ だよ", done: "わあ、ふわふわ！ ありがとう" } },
  { id: "ev-msg-flower", kind: "message", title: "ミミへの でんごん", giver: "cat", map: "town", chance: 0.18, limit: "daily",
    steps: [{ do: "talk", to: "rabbit", say: "ミケが『あした いっしょに おはなを みに いこう』って" }, { do: "talk", to: "cat" }], reward: { coins: 60, bond: { cat: 2, rabbit: 2 } },
    lines: { offer: "にゃあ… ミミに でんごん、たのめる？\n『あした おはなを みに いこう』って", remind: "ミミは おはなやさんの ちかくに いるにゃ", done: "つたえて くれたにゃ？ ありがとにゃ！" } },
  { id: "ev-msg-poster", kind: "message", title: "おまつりの ポスター", giver: "mayor", map: "town", chance: 0.12, limit: "once",
    steps: [{ do: "talk", to: "cityguide", map: "city", say: "そんちょうが『おまつりの ポスターが できた』って" }, { do: "talk", to: "mayor" }], reward: { coins: 120 },
    lines: { offer: "シティの ルルに、おまつりの ポスターが\nできたと つたえて くれんかの？", remind: "ルルは シティの まんなかに おるぞ", done: "ごくろうさん！ たすかったわい" } },
  { id: "ev-letter", kind: "deliver", title: "おてがみを みなとへ", giver: "mouse", map: "town", chance: 0.15, limit: "daily",
    steps: [{ do: "give", to: "portguide", map: "harbor", item: "letter", n: 1, carry: true }, { do: "talk", to: "mouse" }], reward: { coins: 100 },
    lines: { offer: "チュウ！ みなとの ペペに、この おてがみを\nとどけて くれない？", remind: "みなとの ペペだよ。ビーチの みなみから いけるよ", done: "とどいた？ ありがとう チュウ！" } },
  { id: "ev-lunch-air", kind: "deliver", title: "おべんとうを くうこうへ", giver: "pig", map: "town", chance: 0.12, limit: "daily",
    steps: [{ do: "give", to: "airguide", map: "airport", item: "bento", n: 1, carry: true }], reward: { coins: 130, bag: "onigiri", n: 1 },
    lines: { offer: "ブー！ パイロットの ソラに、おべんとうを\nとどけて ほしいんだ", remind: "ソラは くうこうに いるブー", done: "わあ、ブーの おべんとう！ ありがとう" } },
  { id: "ev-lost-hat", kind: "find", title: "ぼうしを さがして", giver: "rabbit", map: "town", chance: 0.15, limit: "daily",
    steps: [{ do: "find", item: "hat", map: "meadow", spots: 3 }, { do: "give", to: "rabbit", item: "hat", n: 1 }], reward: { coins: 90, bond: { rabbit: 3 } },
    lines: { offer: "はらっぱで ぼうしを おとしちゃったの…\nさがして くれる？ きいろい ぼうしよ", remind: "はらっぱの どこかに あると おもうの", done: "あった！ ありがとう、たいせつな ぼうしなの" } },
  { id: "ev-lost-map", kind: "find", title: "たんけんの ちず", giver: "explorer", map: "forest", chance: 0.12, limit: "daily",
    steps: [{ do: "find", item: "map", map: "forest", spots: 4 }, { do: "give", to: "explorer", item: "map", n: 1 }], reward: { coins: 150 },
    lines: { offer: "しまった、ちずを おとした！ もりの どこかに\nある はずなんだ。さがして くれ！", remind: "もりの きの ねもとを よく みて", done: "これだ！ おれいに コインを やろう" } },
  { id: "ev-lost-kitten", kind: "follow", title: "まいごの こねこ", giver: "cat", map: "town", chance: 0.1, limit: "daily",
    steps: [{ do: "find", npc: "kitten", map: "town", spots: 3 }, { do: "follow", npc: "kitten", to: "cat" }], reward: { coins: 120, bond: { cat: 4 } },
    lines: { offer: "こねこが いなくなっちゃったにゃ…！\nまちの どこかに いるはず。つれて きて！", remind: "しげみの かげに かくれてるかも にゃ", done: "よかった〜！ ほんとに ありがとにゃ" } },
  { id: "ev-find-mint", kind: "find", title: "ミントを さがして", giver: "traveler", map: "meadow", chance: 0.1, limit: "daily",
    steps: [{ do: "talk", to: "parkcat", map: "town" }, { do: "talk", to: "traveler" }], reward: { coins: 80 },
    lines: { offer: "さんぽの ミントに あいたいんだけど、\nどこに いるか しらないかい？", remind: "まちの かわの ちかくが すきらしいよ", done: "おしえて くれて ありがとう" } },
  { id: "ev-cleanup", kind: "tap", title: "こうえんの おそうじ", giver: "heiwadai_local", map: "heiwadai", chance: 0.15, limit: "daily",
    steps: [{ do: "tap", target: "litter", map: "heiwadai", n: 5 }, { do: "talk", to: "heiwadai_local" }], reward: { coins: 100 },
    lines: { offer: "こうえんに ごみが おちてるの。\n5こ ひろって くれたら うれしいな", remind: "ベンチの ちかくを みてね", done: "ぴかぴか！ まちが よろこんでるよ" } },
  { id: "ev-water", kind: "tap", title: "はなだんに みずやり", giver: "rabbit", map: "town", chance: 0.18, limit: "daily", when: "w:clear",
    steps: [{ do: "tap", target: "flowerbed", map: "town", n: 3 }, { do: "talk", to: "rabbit" }], reward: { coins: 70, bag: "apple", n: 1 },
    lines: { offer: "はれが つづいて、おはなが のどかわいてるの。\nはなだん 3かしょに おみず あげて くれる？", remind: "あと すこしよ", done: "おはなが にっこり！ ありがとう" } },
  { id: "ev-harvest", kind: "tap", title: "とうもろこしの しゅうかく", giver: "pig", map: "town", chance: 0.15, limit: "daily", when: "s:summer",
    steps: [{ do: "tap", target: "crop", map: "meadow", n: 3 }, { do: "talk", to: "pig" }], reward: { bag: "corn", n: 3 },
    lines: { offer: "はらっぱの とうもろこし、とりきれない ブー！\n3ぼん とって きて くれる？", remind: "はらっぱに とうもろこしが 3ぼん はえてるよ", done: "ありがとう！ 3ぼん どうぞ ブー" } },
  { id: "ev-acorns", kind: "tap", title: "どんぐり あつめ", giver: "traveler", map: "meadow", chance: 0.15, limit: "daily", when: "s:autumn",
    steps: [{ do: "tap", target: "acorn", map: "forest", n: 5 }, { do: "talk", to: "traveler" }], reward: { coins: 90, bag: "annual_harvest_deza", n: 1 },
    lines: { offer: "どんぐりで かざりを つくりたいんだ。\n5こ ひろって きて くれるかい？", remind: "もりの きの したに おちてるよ", done: "ぴかぴかの どんぐり！ ありがとう" } },
  { id: "ev-fish-ayu", kind: "catch", title: "アユを 1ぴき", giver: "parkcat", map: "town", chance: 0.15, limit: "daily", when: "s:summer",
    steps: [{ do: "catch", fish: "ayu", n: 1 }, { do: "give", to: "parkcat", fish: "ayu", n: 1 }], reward: { coins: 160 },
    lines: { offer: "かわの アユを 1ぴき、みて みたいなあ。\nつりざおで つって きて くれる？", remind: "アユは はらっぱの かわの、ながれの はやい ところ", done: "きれいな アユ！ かわの かおりが するね" } },
  { id: "ev-bone-show", kind: "dig", title: "ほねを みせて", giver: "explorer", map: "forest", chance: 0.12, limit: "daily",
    steps: [{ do: "dig", n: 1 }, { do: "talk", to: "explorer" }], reward: { coins: 150 },
    lines: { offer: "どうくつで ほねを ほったら、ぼくに みせて くれ！\nピッケルで ひびの いわを わるんだ", remind: "ひびの ある いわを さがして", done: "おお、これは りっぱな ほね！ はくぶつかんに もって いこう" } },
  { id: "ev-quiz", kind: "quiz", title: "チュウの なぞなぞ", giver: "mouse", map: "town", chance: 0.15, limit: "daily",
    steps: [{ do: "quiz", q: [["パンは パンでも たべられない パンは？", ["フライパン", "メロンパン", "あんパン"], 0], ["あさは 4ほん、ひるは 2ほん。なあに？ …ヒント: ひと", ["いぬ", "ひと", "とり"], 1], ["うえは おおきく、したは ちいさく なる ふねは？", ["ほかけぶね", "とうだい", "ふうせん"], 0]] }], reward: { coins: 80 },
    lines: { offer: "チュウ！ なぞなぞ だすよ。3もん ぜんぶ\nあてたら コインを あげる！", remind: "もう いっかい ちょうせん する？", done: "ぜんぶ せいかい！ あたまが いいね チュウ" } },
  { id: "ev-photo", kind: "photo", title: "ふんすいの まえで しゃしん", giver: "cityguide", map: "city", chance: 0.12, limit: "daily",
    steps: [{ do: "photo", map: "city", near: "city_fountain", r: 2 }, { do: "talk", to: "cityguide" }], reward: { coins: 100, first: { furn: "poster" } },
    lines: { offer: "シティの パンフレットに のせる しゃしんを\nとりたいの！ ふんすいの まえで ポーズ して！", remind: "ふんすいの まえに いって ね", done: "いい しゃしん！ ありがとう！" } },
  { id: "ev-umbrella", kind: "deliver", title: "かさを とどけて", giver: "frog", map: "town", chance: 0.2, limit: "daily", when: "w:rain",
    steps: [{ do: "give", to: "heiwadai_local", map: "heiwadai", item: "umbrella", n: 1, carry: true }], reward: { coins: 90 },
    lines: { offer: "ハルが かさを わすれて でかけたって ケロ！\nへいわだいまで とどけて あげて", remind: "ハルは へいわだいに いるよ ケロ", done: "かさ！ たすかった〜 ケロに ありがとうって つたえてね" } },
  { id: "ev-warashibe", kind: "trade", title: "わらしべ こうかん", giver: "traveler", map: "meadow", chance: 0.1, limit: "once",
    steps: [{ do: "trade", start: "straw", chain: [["rabbit", "seeds", "わらしべ？ ちょうど ほしかったの！\nおはなの たねと こうかん しましょ"], ["pig", "bigcorn", "おはなの たね！ はたけに まきたい ブー。\nりっぱな とうもろこしと こうかん！"], ["mayor", "cuckoo", "おお、りっぱな とうもろこし！\nでは、この はとどけいを ゆずろう"]] }, { do: "talk", to: "traveler" }], reward: { furn: "clock", coins: 200 },
    lines: { offer: "むかしばなしの『わらしべちょうじゃ』を しってる？\nこの わらしべ 1ぽんで、こうかんの たびに でてごらん", remind: "わらしべ → ミミ → ブー → そんちょう の じゅんだよ", done: "わらしべが、はとどけいに なった！ すごい たびだ" } },
];

// なかよし ポイントが たまると 出る セリフ（b:5 / b:10）。ポイントは おねがいを かなえると ふえる
export const BOND_LINES = {
  mayor: [["きみたちが きてから、まちが あかるく なったのう", "b:5"], ["わしの わかい ころの はなし… また こんど ゆっくりな", "b:10"]],
  cat: [["とくべつに おしえるにゃ。ここが いちばんの ひなたにゃ", "b:5"], ["3にんとは、もう ともだち にゃ", "b:10"]],
  rabbit: [["いつも ありがとう。あなたたちが くると うれしいわ", "b:5"], ["こんど いっしょに おはなを うえましょ", "b:10"]],
  penguin: [["ペンペン。きみたちと いると たのしいな", "b:5"], ["ぼくの ひみつの つりばしょ、こんど おしえるね", "b:10"]],
  frog: [["ケロ！ きみたちの こと、うたに したよ", "b:5"], ["ケロケロ〜 なかよしの うた、いっしょに うたおう", "b:10"]],
  sheep: [["3にんの ふく、わたしが えらんで みたいわ", "b:5"], ["あなたたちは じまんの ともだちよ メェ〜", "b:10"]],
  mouse: [["チュウ！ たんけんの ひみつ、きみたちだけに おしえる", "b:5"], ["いつか いっしょに たんけん しよう チュウ", "b:10"]],
  pig: [["きみたちの ぶんも、おやつ とって おいた ブー", "b:5"], ["ブーの ひみつの レシピ、おしえて あげる", "b:10"]],
  parkcat: [["きみたちと さんぽ すると、じかんを わすれるね", "b:5"], ["のんびりが いちばん。きみたちも そう おもう？", "b:10"]],
  traveler: [["きみたちの ことは、たびの にっきに かいて あるよ", "b:5"], ["つぎの たびの おみやげ、なにが いい？", "b:10"]],
  explorer: [["きみたちは りっぱな たんけんたい だ！", "b:5"], ["いつか いっしょに だいはっけん しような", "b:10"]],
  cityguide: [["シティの ひみつの けしき、おしえて あげる！", "b:5"], ["3にんは シティの じまんの おきゃくさん！", "b:10"]],
  beachpenguin: [["きみたちの ために、きれいな かいがらを とって おいたよ", "b:5"], ["ぼくの すきな うみ、ずっと いっしょに みようね", "b:10"]],
  heiwadai_local: [["この まちの ことなら、なんでも きいてね", "b:5"], ["3にんが くると、まちが にぎやかに なるね", "b:10"]],
  portguide: [["きみたちの ために きてきを ならすね！ ぼーっ！", "b:5"], ["こんど ふねの そうじゅうせき、みせて あげる", "b:10"]],
  airguide: [["そらの うえでも、きみたちの こと おもいだすよ", "b:5"], ["いつか 3にんで そらの たびに いこうね", "b:10"]],
};

// 町の人と 話した あとの 3にんの ひとこと（いまの「ときどき なかまが ひとこと」を おきかえる）。p: は 話した 相手
export const REACT = {
  wanko: [
    ["クンクン… この ひと、やさしい においが する！", ""], ["まかせて！ こまってる ひとは ほっとけない", ""], ["ふむふむ… いい こと きいちゃった", ""],
    ["クンクン… パンの におい！ ポケットに はいってる？", "p:pig"], ["わうーん！ よろしくね！", ""], ["おれいの コイン、はんぶん おやつに… なんてね", ""],
    ["この まちの ひと、みんな やさしいね", ""], ["あとで おふろで きょうの はなし しよう", "t:evening"], ["クンクン… おはなの におい！", "p:rabbit"],
    ["せいぎの みかた わんこ、しっかり おぼえた！", ""], ["ねこさん、また ねむそう だね", "p:cat"], ["たんけんの はなし、もっと ききたい！", "p:explorer"],
  ],
  gachan: [
    ["…ちょっと きんちょう しちゃった", ""], ["やさしい ひとで よかった…", ""], ["みんなが いるから、はなしかけられたよ", ""],
    ["ぴよっ！ おぼえたよ！", ""], ["おはな、きれい… わたしも そだてて みたいな", "p:rabbit"], ["よるの そとは… こわいね。はやく かえろ？", "t:night"],
    ["おてつだい、わたしも がんばる… たぶん", ""], ["くまさん、おおきくて… ちょっと びっくり", "p:mayor"], ["あめ… かみなり なりませんように", "w:rain"],
    ["ままにも おしえて あげよう", ""], ["てを つないで いこうね。はぐれないように", ""], ["ふふ、なかよく なれたかな", ""],
  ],
  goji: [
    ["ガウっ！（よろしく）", ""], ["……（こくり） …ガゥ", ""], ["ごじも おっきく なったら、たんけんかに なる", "p:explorer"],
    ["ひとりでも とどけられるよ。…でも みんなで いこ", ""], ["おさかな… おいしそう …ガゥ", "p:penguin"], ["ガウっ！ おなか すいた", "t:day"],
    ["ひこうき、ごじより おっきい？", "p:airguide"], ["ふね、ぼーっ！ ガウっ！", "p:portguide"], ["むずかしい はなし… でも わかった ふり …ガゥ", ""],
    ["ガウっ！ まかせて。ごじ、きようだから", ""], ["おっきく なる ひみつ、きけば よかった", ""], ["ねむい… …ガゥ", "t:late"],
  ],
};

// おねがいで つかう「もちもの」（かばんには はいらない。おねがいが おわると きえる）。art: folk:<id> は folk-ref.js の TownFolkArt.ITEM、bag:/furn: は いまの 絵を つかう
export const ITEMS = {
  letter: { name: "おてがみ", art: "folk:letter" }, bento: { name: "おべんとう", art: "folk:bento" }, umbrella: { name: "かさ", art: "folk:umbrella" },
  hat: { name: "きいろい ぼうし", art: "folk:hat" }, map: { name: "たんけんの ちず", art: "folk:map" }, straw: { name: "わらしべ", art: "folk:straw" },
  seeds: { name: "おはなの たね", art: "folk:seeds" }, photo: { name: "しゃしん", art: "folk:photo" },
  bigcorn: { name: "りっぱな とうもろこし", art: "bag:corn" }, cuckoo: { name: "はとどけい", art: "furn:clock" },
};
