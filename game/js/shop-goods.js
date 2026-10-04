// お店の しなもの（O11・UI-76。オーナーの FB 2026-10-03「各お店の売っているものが種類が少なく見た目もチープなので、作り直してほしい」）。
// 歩いて 入る たべものの お店 5けんの しなぞろえを ふやして、2つの タブに わける（js/shop.js の ShopUI が そのまま ひらく）。
//   ケーキやさん 3 → 12・クレープやさん 3 → 9・パンやさん 3 → 11・ころころ フルーツ 3 → 10・ガソリンスタンド 3 → 8。
// あたらしい 食べ物 32しゅは exclusive（スーパーには ならばない。exclusive は いちばんの おみせ）。絵は js/shop-goods-art.js（FOOD_ART）。
// おなか・ごきげんは この あとの js/food-balance.js が ねだんに あわせて なおす（50コイン いじょうの ごきげんの したの ほう）。
// はたけの やさい・りょうり（exclusive: "farm"）は うらない（はたけで そだてて つくる もの）。
// セーブは もちもの（Save.d.bag）が ふえる だけ（Save.SCHEMA は そのまま）。
const ShopGoods = (() => {
  // [id, なまえ, ねだん, おなか, ごきげん, HP, SP, いちばんの おみせ, せつめい]
  const FOOD = [
    // ケーキやさん
    ["deza_chococake", "デザ・チョコケーキ", 100, 22, 30, 24, 0, "cake", "ビターな チョコの スポンジと なまクリームの だん"],
    ["deza_cheese", "デザ・チーズケーキ", 95, 22, 28, 24, 0, "cake", "しっとり こくの ある やいた チーズケーキ"],
    ["deza_montblanc", "デザ・モンブラン", 110, 20, 32, 22, 0, "cake", "くりの クリームを くるくる しぼった ケーキ"],
    ["deza_wholecake", "デザ・ホールケーキ", 300, 50, 60, 60, 10, "cake", "まるい ケーキを まるごと 1こ。ろうそくを たてて みんなで おいわい"],
    ["deza_creampuff", "デザ・シュークリーム", 60, 14, 20, 14, 0, "cake", "さくっと した かわに カスタードが たっぷり"],
    ["deza_macaron", "デザ・マカロン", 70, 8, 24, 8, 6, "cake", "いちご・ピスタチオ・レモンの 3つの いろ"],
    ["deza_cupcake", "デザ・カップケーキ", 55, 14, 20, 14, 0, "cake", "ふわふわ クリームに カラフルな スプレー"],
    // クレープやさん
    ["crepe_berry", "デザ・いちご クレープ", 80, 18, 26, 18, 0, "crepe", "いちごと なまクリーム。いちばん にんきの クレープ"],
    ["crepe_choco", "デザ・チョコバナナ クレープ", 85, 20, 26, 18, 0, "crepe", "バナナと チョコソースと なまクリーム"],
    ["crepe_custard", "デザ・カスタード クレープ", 75, 18, 24, 16, 0, "crepe", "たまごの カスタードが とろっと あふれる"],
    ["crepe_ice", "デザ・アイス クレープ", 95, 16, 30, 14, 6, "crepe", "つめたい バニラ アイスを まるごと 1こ"],
    ["crepe_hamcheese", "ハムチーズ クレープ", 90, 30, 14, 30, 0, "crepe", "ハムと チーズと レタスの おかずの クレープ"],
    ["deza_softcream", "デザ・ソフトクリーム", 45, 8, 18, 6, 6, "crepe", "くるくる まいた ミルクの ソフトクリーム"],
    ["drink_lemonade", "レモネード", 40, 4, 12, 0, 16, "crepe", "しゅわっと すっぱい レモンの のみもの。げんき(SP)が もどる"],
    // パンやさん
    ["bread_croissant", "クロワッサン", 35, 18, 8, 18, 0, "bakery", "バターの かおりの さくさく パン"],
    ["bread_anpan", "あんぱん", 30, 20, 8, 20, 0, "bakery", "あまい あんこが ぎっしり。おへそに ごま"],
    ["bread_curry", "カレーパン", 40, 26, 8, 26, 0, "bakery", "さくっと あげた パンに あまくちの カレー"],
    ["bread_shoku", "しょくぱん", 45, 30, 6, 30, 0, "bakery", "ふわふわの 1きん。トーストにも サンドにも"],
    ["bread_cornet", "チョココロネ", 40, 18, 12, 16, 0, "bakery", "まきがいの かたちの パンに チョコクリーム"],
    ["bread_baguette", "フランスパン", 50, 32, 6, 32, 0, "bakery", "ながーい かりかりの パン。みんなで わけっこ"],
    ["bread_donut", "デザ・ドーナツ", 35, 12, 16, 10, 0, "bakery", "おさとうを まぶした ふわふわ ドーナツ"],
    // ころころ フルーツ
    ["fruit_mikan", "みかん", 15, 8, 6, 10, 0, "korokoro", "てで むける あまい みかん"],
    ["fruit_banana", "バナナ", 20, 14, 5, 14, 0, "korokoro", "あまくて おなかに たまる バナナ"],
    ["fruit_grape", "ぶどう", 40, 10, 12, 12, 4, "korokoro", "むらさきの つぶが ぎっしり"],
    ["fruit_peach", "もも", 45, 12, 14, 14, 0, "korokoro", "やわらかくて じゅわっと あまい もも"],
    ["fruit_cherry", "さくらんぼ", 50, 6, 16, 8, 4, "korokoro", "つやつやの ふたごの さくらんぼ"],
    ["fruit_sando", "フルーツサンド", 70, 22, 22, 20, 0, "korokoro", "いちご・キウイ・みかんと なまクリームの サンド"],
    ["fruit_mixjuice", "ミックスジュース", 45, 6, 14, 0, 18, "korokoro", "くだもの いっぱいの ジュース。げんき(SP)が もどる"],
    // ガソリンスタンド
    ["drink_sports", "スポーツドリンク", 35, 2, 6, 0, 20, "gasstand", "からだに しみこむ のみもの。げんき(SP)が もどる"],
    ["drink_tea", "むぎちゃ", 25, 2, 8, 0, 12, "gasstand", "こおりで ひえた むぎちゃ。げんき(SP)が もどる"],
    ["chips_small", "ポテトチップス", 40, 10, 14, 6, 0, "gasstand", "うすしおの ぱりぱり ポテトチップス"],
    ["snack_gum", "フーセンガム", 10, 1, 8, 0, 2, "gasstand", "ぷく〜っと ふくらむ 3つの あじの ガム"],
  ];
  for (const [id, name, price, hunger, mood, hp, sp, shop, desc] of FOOD) {
    const f = { id, name, price, hunger, mood, ...(hp ? { hp } : {}), ...(sp ? { sp } : {}), deza: name.startsWith("デザ・"), rare: false, exclusive: shop, shopGoods: true, desc };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" };
  }

  // おみせごとの タブ（[キー, なまえ, しなもの]）と あいさつ。まえからの しなもの（cake・bread・apple など）も そのまま ならぶ
  const LINEUP = {
    cake: {
      hello: ["いらっしゃいませ！ きょうも ケーキが やきあがったよ。", "おいわいには まるい ホールケーキも あるよ。"],
      tabs: [["cake", "ケーキ", ["cake", "deza_chococake", "deza_cheese", "deza_montblanc", "deza_tart", "deza_wholecake"]],
        ["sweets", "やきがし・プリン", ["pudding", "deza_creampuff", "deza_macaron", "deza_cupcake", "rollcake", "milk"]]],
    },
    crepe: {
      hello: ["いらっしゃい！ クレープは やきたてを くるっと まくよ。", "あつい ひは ソフトクリームと レモネードも どうぞ。"],
      tabs: [["crepe", "クレープ", ["crepe_berry", "crepe_choco", "crepe_custard", "crepe_ice", "crepe_hamcheese"]],
        ["ice", "アイス・のみもの", ["deza_softcream", "deza_ice", "drink_lemonade", "juice"]]],
    },
    bakery: {
      hello: ["いらっしゃいませ！ やきたての パンが ならんでるよ。", "フランスパンは みんなで わけっこ してね。"],
      tabs: [["bread", "パン", ["bread", "bread_croissant", "bread_anpan", "bread_curry", "bread_cornet", "bread_shoku", "bread_baguette", "sandwich"]],
        ["snack", "おやつ・のみもの", ["bread_donut", "bone", "milk"]]],
    },
    korokoro: {
      hello: ["いらっしゃい！ まんまるの くだもの、ゆっくり みていってね。", "ミックスジュースは しぼりたてだよ。"],
      tabs: [["fruit", "くだもの", ["apple", "fruit_mikan", "fruit_banana", "fruit_grape", "fruit_peach", "fruit_cherry"]],
        ["juice", "ジュース・おやつ", ["fruit_mixjuice", "juice", "fruit_sando", "candy"]]],
    },
    gasstand: {
      hello: ["いらっしゃい！ ドライブの おともに どうぞ。", "つめたい むぎちゃも ひえてるよ。"],
      tabs: [["drink", "のみもの", ["drink", "drink_sports", "drink_tea", "juice"]],
        ["snack", "おやつ", ["chips_small", "snack_gum", "candy", "onigiri"]]],
    },
  };
  for (const [id, L] of Object.entries(LINEUP)) {
    const shop = BUY_SHOPS[id];
    if (!shop) continue;
    shop.hello = L.hello;
    shop.tabs = L.tabs.map(([k, label]) => [k, label]);
    shop.items = (tab) => (L.tabs.find((t) => t[0] === tab) || L.tabs[0])[2].map((k) => BAG_INDEX[k]).filter(Boolean);
    shop.cls = ((shop.cls || "") + " shop-goods").trim(); // なまえは ことばの きれめで おりかえす・タブは 44px
    shop.icoSize = 56;
  }
  const ids = (shop) => (LINEUP[shop] ? LINEUP[shop].tabs.flatMap((t) => t[2]) : []);
  return {
    FOOD, LINEUP, ids,
    NEW: FOOD.map((f) => f[0]),
    // PokaDebug 用
    state(shop) { return LINEUP[shop] ? { shop, tabs: LINEUP[shop].tabs.map(([k, label, list]) => ({ k, label, ids: [...list] })), total: ids(shop).length } : null; },
  };
})();
