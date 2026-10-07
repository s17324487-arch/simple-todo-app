// あそびどうぐ・ほん・ドリル（UI-105。オーナーの 依頼 2026-10-07「遊ぶ、本を読む、宿題をする動作のためには、誰かが遊び道具(トランプや縄跳び、ゲーム機など)や本、
// 国語や数学のドリル、のアイテムを持っている必要があるようにしろ。これらのアイテムは、景品やコンビニなどであるようにしろ。遊び道具、本、ドリル、はそれぞれ8種類以上あると良い。」）。
// ・30しゅ: あそびどうぐ 10・ほん 10・ドリル 10（こくご 5・さんすう／すうがく 5）。どれも 3人が 手に もつ もちもの（outfit.hand・js/hand-items.js）。
//   1こで ひとり もてる（WearStock。ふうせん・バッグと おなじ）。もって いる 子が いると おうちで その あそび・どくしょ・しゅくだいが できる（js/home-play.js）。
// ・てに いれる ところ: ネリカスタウンの コンビニ 2つ（あたらしい タブ「あそび」「ほん・ドリル」。2つの みせで しなぞろえが ちがう・トランプは どちらにも ある・
//   ねだんは ほかの しなものと おなじ 1.5ばい〔ConbiniGoods.price。オーナーの 10%びきも〕・ポイントカードの ポイントも たまる）と、
//   Meeときょれじゃ 1F の けいひん カウンター（あたらしい タブ「おもちゃ」: ゲームき・けんだま・こま・リバーシ・いろあわせ キューブ。けいひんの こうかん）。ようふくやさんには ならばない。
// ・絵は js/play-goods-art.js（PlayGoodsArt）。ずかんの「てにいれる ヒント」は その みせ。
// ・セーブ: ふくと おなじ（Save.d.wardrobe・outfit.hand）。Save.SCHEMA は 2 の まま。conbini-card.js・ike-arcade.js・item-dex-sources.js・shop.js の あとに よむ。
const PlayGoods = (() => {
  const CATS = { toy: "あそびどうぐ", book: "ほん", drill: "ドリル" };
  const SUBJ = { kokugo: "こくご", sansu: "さんすう" };
  // [id, しゅるい, あそびかた（js/home-play.js が みる）, なまえ, もとの ねだん, つよさ, せつめい, いろ（ずかん・ためしぎの め じるし）, かもく]
  const LIST = [
    ["pg_cards", "toy", "cards", "トランプ", 200, { sp: 1 }, "ババぬきも しちならべも できる カード。3にんで まるく すわって あそぼう", "#E53935"],
    ["pg_rope", "toy", "rope", "なわとび", 360, { spd: 2 }, "ぴょんぴょん とぶ なわ。なんかい とべるか かぞえよう", "#F48FB1"],
    ["pg_bubbles", "toy", "bubbles", "シャボンだま", 160, { spd: 1 }, "ふーっと ふくと ふわふわの たまが とぶよ", "#F8BBD0"],
    ["pg_otedama", "toy", "otedama", "おてだま", 300, { spd: 1, sp: 1 }, "ちりめんの ちいさな ふくろ 3つ。なげて うけて、うたに あわせて", "#E8545E"],
    ["pg_sugoroku", "toy", "sugoroku", "すごろく", 400, { hp: 2 }, "サイコロを ふって すすむ。さきに あがりに ついたら かち", "#FFF3D6"],
    ["pg_game", "toy", "game", "ゲームき", 9800, { sp: 3 }, "てのひらサイズの ゲーム。3にんで かわりばんこに あそぼう", "#9FD9C8"],
    ["pg_kendama", "toy", "kendama", "けんだま", 1200, { spd: 1, sp: 1 }, "たまを おさらに のせる。もしかめに ちょうせん", "#E53935"],
    ["pg_koma", "toy", "koma", "こま", 800, { spd: 1 }, "ひもを まいて なげると くるくる まわる", "#F0D29E"],
    ["pg_reversi", "toy", "reversi", "リバーシ", 1500, { sp: 2 }, "くろと しろの いしで はさんで ひっくりかえす", "#3FA36B"],
    ["pg_cube", "toy", "cube", "いろあわせ キューブ", 1800, { sp: 2 }, "くるくる まわして 6めんの いろを そろえる", "#4F8FD8"],
    ["bk_dino", "book", "dino", "きょうりゅう ずかん", 1000, { sp: 2 }, "ティラノサウルスや トリケラトプスが いっぱい", "#8FCB82"],
    ["bk_fish", "book", "fish", "おさかな ずかん", 1000, { sp: 2 }, "うみや かわの さかなの くらしが わかる", "#7EC3E6"],
    ["bk_space", "book", "space", "うちゅうの ずかん", 1000, { sp: 2 }, "ほしや わくせい、ロケットの ことが わかる", "#3E4C82"],
    ["bk_animal", "book", "animal", "どうぶつ ずかん", 1000, { sp: 2 }, "ライオンから ハムスターまで。どうぶつの くらしが わかる", "#F6B26B"],
    ["bk_momo", "book", "momo", "ももたろうの えほん", 500, { sp: 1 }, "おおきな ももから うまれた ももたろうの おはなし", "#FCE4EC"],
    ["bk_moon", "book", "moon", "おつきさまの えほん", 500, { sp: 1 }, "よるの そらの おつきさまと ほしの やさしい おはなし", "#5865A8"],
    ["bk_riddle", "book", "riddle", "なぞなぞの ほん", 400, { sp: 1 }, "なぞなぞが 100もん。みんなで とこう", "#FFE082"],
    ["bk_manga", "book", "manga", "まんが", 300, { sp: 1 }, "わらえて どきどき する まんが", "#F4F1EA"],
    ["bk_recipe", "book", "recipe", "おりょうりの ほん", 600, { sp: 1 }, "かんたんで おいしい りょうりの つくりかた", "#FFF1D6"],
    ["bk_maze", "book", "maze", "めいろの ほん", 400, { sp: 1 }, "ゆびで たどって でぐちを さがす めいろ", "#C5E6B8"],
    ["dr_hiragana", "drill", "hiragana", "ひらがな ドリル", 400, { sp: 2 }, "あいうえおを ていねいに かく れんしゅう", "#EF7C8E", "kokugo"],
    ["dr_katakana", "drill", "katakana", "カタカナ ドリル", 400, { sp: 2 }, "アイウエオと のばす おとの れんしゅう", "#EF7C8E", "kokugo"],
    ["dr_kanji", "drill", "kanji", "かんじ ドリル", 400, { sp: 2 }, "やま・かわ・はな。かんじを よんで かく", "#EF7C8E", "kokugo"],
    ["dr_kotoba", "drill", "kotoba", "ことば ドリル", 400, { sp: 2 }, "はんたいの ことばや なかまの ことば", "#EF7C8E", "kokugo"],
    ["dr_bunsho", "drill", "bunsho", "ぶんしょう ドリル", 400, { sp: 2 }, "おはなしを よんで もんだいに こたえる", "#EF7C8E", "kokugo"],
    ["dr_tashi", "drill", "tashi", "たしざん ドリル", 400, { sp: 2 }, "1けたと 2けたの たしざん", "#5B9BE0", "sansu"],
    ["dr_hiki", "drill", "hiki", "ひきざん ドリル", 400, { sp: 2 }, "くりさがりの ある ひきざんも", "#5B9BE0", "sansu"],
    ["dr_kuku", "drill", "kuku", "くくの ドリル", 400, { sp: 2 }, "ににんが し。9の だんまで となえよう", "#5B9BE0", "sansu"],
    ["dr_tokei", "drill", "tokei", "とけいの ドリル", 400, { sp: 2 }, "ながい はりと みじかい はりで じこくを よむ", "#5B9BE0", "sansu"],
    ["dr_math", "drill", "math", "すうがく ドリル", 500, { sp: 3 }, "ちゅうがくせいの すうがく。xと yの しき", "#5B9BE0", "sansu"],
  ];
  // おみせの ことば（js/shop.js: ふくは「きる」・この 30しゅは「もつ」。かった あとの ひとことは しゅるいで かわる）
  const USE = Object.fromEntries(Object.entries({ toy: "わーい！ いっしょに あそぼう", book: "よむの たのしみ〜", drill: "しゅくだい がんばるぞ！" }).map(([cat, say]) => [cat, { can: "もてる", ask: "もつ", yes: "もつ！", say }]));
  const ITEMS = LIST.map(([id, cat, play, name, price, st, desc, mark, subj]) => ({ id, name, slot: HandItems.SLOT, wear: "pg_" + (cat === "toy" ? play : id), art: cat === "toy" ? play : id, col: [mark], price, st, desc, playCat: cat, play, ...(subj ? { subject: subj } : {}), use: USE[cat] }));
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const IDS = ITEMS.map((it) => it.id);

  // ---- しなぞろえ（[みせ, タブ, id…]）----
  const LINEUP = {
    lawson: { play: ["pg_cards", "pg_bubbles", "pg_rope"], book: ["bk_manga", "bk_riddle", "bk_recipe", "bk_space", "bk_animal", "dr_hiragana", "dr_katakana", "dr_tashi", "dr_hiki", "dr_tokei"] },
    sevenbun: { play: ["pg_cards", "pg_otedama", "pg_sugoroku"], book: ["bk_momo", "bk_moon", "bk_maze", "bk_dino", "bk_fish", "dr_kanji", "dr_kotoba", "dr_bunsho", "dr_kuku", "dr_math"] },
    ike_arcade: { toy: ["pg_game", "pg_kendama", "pg_koma", "pg_reversi", "pg_cube"] },
  };
  const TABS = { lawson: [["play", "あそび"], ["book", "ほん・ドリル"]], sevenbun: [["play", "あそび"], ["book", "ほん・ドリル"]], ike_arcade: [["toy", "おもちゃ"]] };
  const CONBINI = ["lawson", "sevenbun"];
  const isTab = (shop, tab) => !!(LINEUP[shop] && LINEUP[shop][tab]);
  // その みせで かう ねだん（コンビニは 1.5ばい〔オーナーは 10%びき〕・けいひん カウンターは そのまま）
  const price = (shop, id) => { const it = INDEX[id]; return CONBINI.includes(shop) && typeof ConbiniGoods !== "undefined" ? ConbiniGoods.price(shop, it) : it.price; };
  const shopItems = (shop, tab) => (isTab(shop, tab) ? LINEUP[shop][tab].map((id) => ({ ...INDEX[id], price: price(shop, id) })) : []);
  const shopsOf = (id) => Object.keys(LINEUP).filter((s) => Object.values(LINEUP[s]).some((l) => l.includes(id)));
  const shopName = (s) => (BUY_SHOPS[s] ? BUY_SHOPS[s].name : s);
  // ずかんの「てにいれる ヒント」
  const source = (id) => {
    const ss = shopsOf(id); if (!ss.length) return "";
    if (ss.includes("ike_arcade")) return "Meeときょれじゃ の けいひん カウンターで こうかん できるよ。";
    return `ネリカスタウンの コンビニ「${ss.map(shopName).join("」と「")}」で かえるよ。`;
  };
  // だれが なにを もって いるか（3人だけ。ぱぱ・ままは もたない）
  const heldBy = (who) => { const id = typeof HandItems !== "undefined" ? HandItems.held(who) : null; return id && INDEX[id] ? INDEX[id] : null; };
  const holders = (cat = null) => (Save.d ? Save.d.order : []).map((who) => ({ who, item: heldBy(who) })).filter((h) => h.item && (!cat || h.item.playCat === cat));
  const API = { CATS, SUBJ, ITEMS, INDEX, IDS, LINEUP, TABS, CONBINI, USE, isPlay: (id) => !!INDEX[id], catOf: (id) => (INDEX[id] ? INDEX[id].playCat : null), of: (cat) => ITEMS.filter((it) => it.playCat === cat), price, shopItems, shopsOf, source, heldBy, holders };

  // ---- ゲームに いれる ----
  for (const it of ITEMS) { WEAR_ITEMS.push(it); ITEM_INDEX[it.id] = it; }
  // 絵（WEAR。Chara の wearLayers は どの アイテムかを わたさない ので、1しゅに 1つの かんすう: pg_<あそびかた>・pg_<ほん／ドリルの id>）
  for (const it of ITEMS) WEAR[it.wear] = (ctx) => PlayGoodsArt.held(ctx, it.art);
  // ようふくやさんの「もちもの」には ならべない（コンビニ・けいひん カウンター だけ）
  if (BUY_SHOPS.clothes) { const items0 = BUY_SHOPS.clothes.items; BUY_SHOPS.clothes.items = (tab) => items0(tab).filter((w) => !INDEX[w.id]); }
  // コンビニ 2つ・けいひん カウンター: タブを たす（コンビニは 5こに なるので 2だんに おりかえす）
  for (const shop of Object.keys(LINEUP)) {
    const B = BUY_SHOPS[shop]; if (!B) continue;
    for (const t of TABS[shop]) if (!B.tabs.some((x) => x[0] === t[0])) B.tabs.push([...t]);
    const items0 = B.items;
    B.items = (tab) => (isTab(shop, tab) ? shopItems(shop, tab) : items0(tab));
    if (CONBINI.includes(shop)) {
      B.cls = ((B.cls || "") + " shop-tabs-wrap").trim();
      // オーナーの 10%びきの ひとこと（js/conbini-card.js の note は たべもの むけ: もとの ねだんは この 30しゅの ねだんで）
      const note0 = B.note;
      B.note = (it) => {
        if (!INDEX[it.id]) return note0 ? note0(it) : "";
        const own = typeof ConbiniCard !== "undefined" && ConbiniCard.owner(shop);
        return own ? `オーナー さまは 10%びき（いつもは ${ConbiniGoods.price0(shop, INDEX[it.id])}コイン）` : "";
      };
    }
  }
  // けいひん カウンター: あいさつ・タブは 44px（css の .shop-goods。なまえも ことばの きれめで おりかえす）
  if (BUY_SHOPS.ike_arcade) { const B = BUY_SHOPS.ike_arcade; B.hello = ["おもちゃや まえの けいひんも コインで こうかん できるよ。"]; B.cls = ((B.cls || "") + " shop-goods").trim(); }
  // かう ものの しゅるい: この タブは もちもの（wear）
  const kind0 = ShopUI.kindOf;
  ShopUI.kindOf = function (shopId, tab) { return isTab(shopId, tab) ? "wear" : kind0.call(this, shopId, tab); };
  // ずかんの ヒント
  if (typeof ItemDexSources !== "undefined") {
    const src0 = ItemDexSources.source;
    ItemDexSources.source = function (kind, item) { return kind === "wear" && item && INDEX[item.id] ? source(item.id) : src0.call(this, kind, item); };
  }
  return API;
})();
