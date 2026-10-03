// UI-56: ネリカス電機（池袋）の 家電を 作りなおす。オーナーの FB 2026-10-03「池袋の家電屋さんを、もっとハイクオリティにせよ。…家電ももっとクオリティアップせよ」。
// ・これまでの 21しゅ（せんたくき・れいぞうこ・テレビ・そうじき・でんしレンジ・でんわ・あかり × 3）の 絵を、FurnModels の 立体（INK の 線・パステル・つや）に かえる。
//   ID・ねだん・大きさ（78×52×88。れいぞうこは たかさ 120）・セーブは そのまま。なまえは ひらがな まじりに なおした。
// ・あたらしい 家電 9しゅ（すいはんき・トースター・コーヒーメーカー・せんぷうき・くうきせいじょうき・エアコン〔かべ〕・パソコン・スピーカー・マッサージチェア）を
//   IkebukuroCatalog.furniture で ネリカス電機に ならべる（groups.electronics）。
// ・どれも おうちで さわると うごく（FurnLive）。テレビの ばんぐみ・せんたくきの ドラム・れいぞうこの ドア・ロボットそうじき・レンジの「チン！」・でんわの ベル・
//   あかり・せんぷうきの はね・エアコンの かぜ・パソコンの がめん・スピーカーの おと など。うごく ところは live の とき 絵から ぬいて canvas に 描く。
// ・テレビの ばんぐみの 絵（tvShow）は 館の かべの テレビ（js/kaden-hall-art.js）でも つかう。SvgCache は つかわない（キーが ふえない）。
const KadenItems = (() => {
  const TAU = Math.PI * 2;
  const { rect, rr, ov, arc, arch, star, heart } = FurnModels.shapes;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // いろ（まえ・よこ・うえ）
  const WHITE = ["#F8F6F1", "#DCD7CD", "#FFFFFF"], SILVER = ["#DCE1E6", "#B6BEC7", "#F0F3F6"], CHAMP = ["#E8DAC2", "#CCBA9E", "#F4EBDC"];
  const DARK = ["#5A616D", "#474D57", "#717986"], BLACK = ["#3E434C", "#30343B", "#555B66"], WOOD = ["#C9A26E", "#A88457", "#DDBD8A"], OAK = ["#D8B98C", "#B89568", "#E7CFA6"];
  const GLASS = "#A9D4DF", SCREEN = "#2C3848", LED = "#9FE6F2", GOLD = "#E3C06B";
  const M = {};

  // ---- なまえ と せつめい（これまでの 21しゅ・スマホ 3しゅ。ID は かえない）----
  const OLD = {
    ike_washer_0: ["ドラム せんたくき", "まるい まどの なかで ドラムが ぐるぐる。タップで せんたく かいし！"],
    ike_washer_1: ["にそうしき せんたくき", "あらう そうと しぼる そうが ならんだ レトロな せんたくき。"],
    ike_washer_2: ["かんそうつき せんたくき", "あらって、かわかす ところまで おまかせ。シャンパン いろ。"],
    ike_fridge_0: ["レトロ れいぞうこ", "まるい あたまの ミントいろ。ドアを あけると なかが ひかるよ。"],
    ike_fridge_1: ["りょうびらき れいぞうこ", "ドアが 2まい。こおりが でる ところも ついて いるよ。"],
    ike_fridge_2: ["スマート れいぞうこ", "ドアの がめんで おてんきや なかみが わかる れいぞうこ。"],
    ike_tv_0: ["きわくの テレビ", "きの はこに はいった むかしの テレビ。ダイヤルで チャンネル。"],
    ike_tv_1: ["シネマ テレビ", "おおきな がめんで アニメも うみも たのしめる テレビ。"],
    ike_tv_2: ["かべかけ テレビ", "うすい テレビを きの かべに かけた おしゃれな テレビ。"],
    ike_vacuum_0: ["キャニスター そうじき", "ころころ ころがる からだに ホース。すいこむ ちからが つよい。"],
    ike_vacuum_1: ["スティック そうじき", "スタンドで じゅうでん する、かるい そうじき。"],
    ike_vacuum_2: ["ロボット そうじき", "タップすると へやを ひとりで おそうじして もどって くるよ。"],
    ike_microwave_0: ["コンパクト レンジ", "ダイヤルを まわして あたためる、まるっこい でんしレンジ。"],
    ike_microwave_1: ["オーブン レンジ", "あたためも オーブンも できる ぎんいろの でんしレンジ。"],
    ike_microwave_2: ["スチーム レンジ", "みずの タンクで ゆげを だす、ふっくら しあげの レンジ。"],
    ike_telephone_0: ["ダイヤル でんわ", "ジーコ ジーコ まわす むかしの でんわ。ベルが なるよ。"],
    ike_telephone_1: ["コードレス でんわ", "うけきを もって あるける でんわ。ボタンが ひかる。"],
    ike_telephone_2: ["テレビ でんわ", "がめんで かおを みながら おはなし できる でんわ。"],
    ike_lighting_0: ["ステンドグラスの ランプ", "いろガラスの かさが きれいな ランプ。よるは あかりが つく。"],
    ike_lighting_1: ["スリム フロアライト", "ほそい ポールに まるい かさ。へやを やさしく てらす。"],
    ike_lighting_2: ["シャンデリア", "きんの アーチに さがった クリスタルの シャンデリア。"],
    ike_phone_0: ["ほしあかり スマホ", "くびから かけて おでかけ。いけぶくろ だけの レアアイテム。"],
    ike_phone_1: ["おりたたみ スマホ", "ぱたんと おれる スマホ。いけぶくろ だけの レアアイテム。"],
    ike_phone_2: ["クリスタル スマホ", "きらりと すきとおる スマホ。いけぶくろ だけの レアアイテム。"],
  };
  for (const [id, [name, desc]] of Object.entries(OLD)) { const f = FURN_INDEX[id] || ITEM_INDEX[id]; if (f) Object.assign(f, { name, desc }); }
  // ---- あたらしい 家電 9しゅ（[id, なまえ, ねだん, type, extra, せつめい]）----
  const NEW = [
    ["ike_kaden_rice", "すいはんき", 6800, "ricecooker", { w: 66, h: 92, depth: 44, cat: ["table"] }, "ほかほかの ごはんが たける。タップで ゆげが でるよ。"],
    ["ike_kaden_toaster", "ポップアップ トースター", 5200, "toaster", { w: 66, h: 90, depth: 44, cat: ["table"] }, "タップすると パンが ポン！と とびだす トースター。"],
    ["ike_kaden_coffee", "コーヒーメーカー", 6400, "coffee", { w: 66, h: 96, depth: 44, cat: ["table"] }, "ぽた ぽた おとして コーヒーを いれる きかい。いい におい。"],
    ["ike_kaden_fan", "せんぷうき", 5800, "fan", { w: 56, h: 108, depth: 40 }, "はねが まわって そよそよ かぜ。リボンも ゆれるよ。"],
    ["ike_kaden_purifier", "くうきせいじょうき", 9800, "purifier", { w: 50, h: 86, depth: 38 }, "へやの くうきを きれいに する。ひかりの わの いろが かわる。"],
    ["ike_kaden_aircon", "かべかけ エアコン", 16800, "aircon", { kind: "wall", w: 100, h: 40 }, "かべに かける エアコン。タップで ひんやりした かぜ。"],
    ["ike_kaden_pc", "パソコン デスク", 15800, "pc", { w: 108, h: 112, depth: 58, cat: ["table"] }, "つくえと パソコンの セット。おえかきや ゲームが できるよ。"],
    ["ike_kaden_speaker", "スピーカー セット", 8800, "speaker", { w: 110, h: 100, depth: 44 }, "おおきな スピーカーと アンプ。タップで おんがくが ながれる。"],
    ["ike_kaden_massage", "マッサージチェア", 24800, "massage", { w: 84, h: 112, depth: 92, comfort: 14, cat: ["sit"] }, "すわると もみ もみ。からだが ぽかぽか ほぐれる いす。"],
  ];
  for (const [id, name, price, type, extra, desc] of NEW) if (!FURN_INDEX[id]) IkebukuroCatalog.furniture(id, name, price, type, 0, "electronics", { desc, ...extra });

  // ---- 2D の 絵の 道具（画面の 上の 小さな 絵。下の まん中が 0,0）----
  const dot = (x, y, r, c) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${c}"/>`;

  // =========================== せんたくき ===========================
  // ドラムの なかの ふく（static）。live の ときは canvas が まわす
  const CLOTHES = [["#F2A7B8", -6, -5, 7, 4.6, 0.4], ["#9FC7E8", 5, -2, 6.4, 4.2, -0.5], ["#F7D56A", -1, 6, 6.8, 4, 0.1], ["#B8DCA6", 7, 7, 4.6, 3.4, 0.9]];
  const drumClothes = (k, m, cx, cz) => CLOTHES.map(([c, x, y, a, b]) => k.shape(m, ov(cx + x, cz - y, a, b, 16), c, 1)).join("");
  M.ike_washer_0 = (k) => {
    const { box, shape, FR, TP, lineOn, shadow, L } = k, fy = -6;
    let s = shadow(0.12, 4, 8);
    s += box(-28, -10, 5, 4, 0, 3, DARK, 1) + box(23, -10, 5, 4, 0, 3, DARK, 1);
    s += box(-30, -48, 60, 42, 2, 82, WHITE);
    s += lineOn(TP(84.1), [[-28, -22], [28, -22]], "#E3DED4", 1.2);
    // そうさの ところ（せんざいの ひきだし・がめん・ダイヤル）
    s += shape(FR(fy + 0.05), rr(-28, 66, 56, 15, 3), "#EEF3F6", 1.2);
    s += shape(FR(fy + 0.1), rr(-26, 69, 15, 9, 2), "#FFFFFF", 1) + lineOn(FR(fy + 0.15), [[-24, 71.5], [-13, 71.5]], "#C9D3DA", 1);
    s += shape(FR(fy + 0.1), rr(-6, 70, 18, 7, 1.6), "#3E5664", 1.1) + [0, 1, 2].map((i) => shape(FR(fy + 0.15), rect(-4 + i * 5, 71.6, 3.4, 3.8), LED, 0)).join("");
    s += shape(FR(fy + 0.1), ov(20, 73.5, 4.6, 4.6, 20), SILVER[2], 1.1) + shape(FR(fy + 0.15), rect(19.4, 74, 1.2, 3.4), "#7D8892", 0);
    // まるい ドア（クロームの わ・ガラス・ふく・つや）と とって
    s += shape(FR(fy + 0.05), ov(0, 36, 23, 23, 40), SILVER[2], 1.6) + shape(FR(fy + 0.1), ov(0, 36, 19.5, 19.5, 40), "#C7CED5", 1.1);
    s += shape(FR(fy + 0.15), ov(0, 36, 16, 16, 40), GLASS, 1.2) + L(drumClothes(k, FR(fy + 0.18), 0, 36));
    s += shape(FR(fy + 0.22), [[-10, 46], [-3, 50], [-1, 48], [-8, 43]], "#FFFFFF", 0, 'fill-opacity=".6"');
    s += shape(FR(fy + 0.2), rr(17, 30, 4, 12, 2), SILVER[1], 1);
    return s;
  };
  M.ike_washer_1 = (k) => {
    // にそうしき: みずいろの はこ・うえに 2つの ふた（ひだりは すきとおる・なかの みずが まわる）・おくの そうさばん
    const { box, shape, FR, TP, lineOn, shadow, L, prism } = k, AQUA = ["#BFE3E8", "#9FC9D0", "#DDF2F5"];
    let s = shadow(0.12, 3, 8);
    s += box(-37, -48, 74, 42, 0, 3, DARK, 1) + box(-37, -48, 74, 42, 2, 66, AQUA);
    s += shape(FR(-6 + 0.05), rect(-37, 20, 74, 5), "#FFFFFF", 1.1) + shape(FR(-5.9), ov(-24, 46, 6, 6, 18), "#FFFFFF", 1.1) + shape(FR(-5.85), ov(-24, 46, 2.6, 2.6, 12), "#F2A7B8", 0);
    s += lineOn(FR(-5.9), [[-14, 46], [30, 46]], "#8FBCC4", 1.4) + lineOn(FR(-5.9), [[-14, 40], [30, 40]], "#8FBCC4", 1.4);
    // おくの そうさばん（ダイヤル 3つ）
    s += box(-37, -48, 74, 8, 68, 13, ["#F4F7F8", "#D6DDE0", "#FFFFFF"]);
    for (const x of [-26, -10, 18]) s += shape(FR(-40 + 0.05), ov(x, 74.5, 3.8, 3.8, 18), x === 18 ? "#F2A7B8" : "#9FC9D0", 1) + shape(FR(-39.9), rect(x - 0.5, 75, 1, 3), INK, 0);
    // ふた
    s += prism(TP(68.6), rr(-34, -38, 38, 30, 4), [0, 0, -1.4], "#E8F7FA", "#B6D9DE", 1.2);
    s += shape(TP(68.7), ov(-15, -23, 12, 10, 28), "#9FD3E0", 1.1) + L(shape(TP(68.8), ov(-15, -23, 7, 5.6, 20), "#C9ECF3", 0) + shape(TP(68.8), [[-21, -23], [-15, -26], [-9, -23], [-15, -20]], "#FFFFFF", 0, 'fill-opacity=".7"'));
    s += prism(TP(68.6), rr(8, -38, 25, 30, 4), [0, 0, -1.4], "#FFFFFF", "#CFE4E8", 1.2) + shape(TP(68.7), rr(16, -14, 9, 4, 2), "#9FC9D0", 1);
    return s;
  };
  M.ike_washer_2 = (k) => {
    // かんそうつき: シャンパンいろ・まえの くらい パネル・きんの わの ドア・あおい がめん
    const { box, shape, FR, TP, lineOn, shadow, L } = k, fy = -6;
    let s = shadow(0.13, 4, 8);
    s += box(-29, -10, 5, 4, 0, 3, DARK, 1) + box(24, -10, 5, 4, 0, 3, DARK, 1);
    s += box(-31, -50, 62, 44, 2, 82, CHAMP);
    s += shape(FR(fy + 0.05), rr(-28, 8, 56, 70, 5), "#D9C8AC", 1.2);
    s += shape(FR(fy + 0.1), rr(-24, 66, 48, 9, 2), "#2F3B49", 1.1) + [0, 1, 2, 3, 4].map((i) => shape(FR(fy + 0.15), ov(-18 + i * 9, 70.5, 1.6, 1.6, 10), i === 2 ? "#F7D56A" : LED, 0)).join("");
    s += shape(FR(fy + 0.1), ov(0, 34, 23, 23, 40), GOLD, 1.6) + shape(FR(fy + 0.15), ov(0, 34, 19, 19, 40), "#B9A27C", 1.1);
    s += shape(FR(fy + 0.2), ov(0, 34, 15.5, 15.5, 40), "#5D6C78", 1.2) + L(drumClothes(k, FR(fy + 0.22), 0, 34));
    s += shape(FR(fy + 0.26), [[-10, 44], [-3, 48], [-1, 46], [-8, 41]], "#FFFFFF", 0, 'fill-opacity=".45"');
    // かんそうの しるし（おひさま）
    s += shape(FR(fy + 0.15), ov(-21, 17, 3, 3, 14), "#F7C548", 1) + lineOn(FR(fy + 0.15), [[-21, 21.5], [-21, 23]], "#F7C548", 1.2) + lineOn(FR(fy + 0.15), [[-25.5, 17], [-27, 17]], "#F7C548", 1.2);
    return s;
  };

  // =========================== れいぞうこ ===========================
  const FOODS = (k, m, x0, x1, levels) => {
    // れいぞうこの なかの たべもの（たなの うえ）
    let s = "";
    const items = [["milk", "#FFFFFF"], ["apple", "#E8453C"], ["jelly", "#F2A7B8"], ["egg", "#FFF6E0"], ["bottle", "#9FD3A0"], ["cake", "#F7E1B5"]];
    levels.forEach((t, j) => items.slice(j * 2, j * 2 + 3).forEach(([kind, c], i) => {
      const x = x0 + 8 + i * ((x1 - x0 - 16) / 2);
      if (kind === "milk" || kind === "bottle") s += k.shape(m, rr(x - 3, t, 6, 12, 1.5), c, 1);
      else if (kind === "apple") s += k.shape(m, ov(x, t + 4, 4, 4, 14), c, 1);
      else if (kind === "egg") s += k.shape(m, ov(x - 3, t + 3, 2.4, 3, 12), c, 0.9) + k.shape(m, ov(x + 3, t + 3, 2.4, 3, 12), c, 0.9);
      else s += k.shape(m, rr(x - 4, t, 8, 6, 1.5), c, 1);
    }));
    return s;
  };
  M.ike_fridge_0 = (k) => {
    // レトロ: ミントいろ・まるい あたま・2まいの ドア・クロームの とって・エンブレム
    const { box, shape, FR, prism, lineOn, shadow, L } = k, MINT = ["#BFE3D2", "#9CC9B5", "#DDF2E8"], fy = -6;
    let s = shadow(0.12, 4, 10);
    for (const x of [-25, 21]) s += box(x, -12, 4, 4, 0, 5, SILVER, 1);
    s += box(-28, -48, 56, 42, 5, 92, MINT);
    s += prism(FR(fy), arch(-28, 28, 97, 97, 116), [0, -42, 0], MINT[0], MINT[1], 1.5);
    s += shape(FR(fy + 0.05), rect(-26, 84, 52, 0.8), "#8DBBA7", 0);
    s += L(shape(FR(fy + 0.06), rr(-26, 8, 52, 74, 4), "#C9EADB", 1.3) + shape(FR(fy + 0.1), rr(-23, 40, 3.2, 26, 1.6), SILVER[2], 1) + shape(FR(fy + 0.1), ov(14, 74, 5, 3.2, 16), "#F2A7B8", 1) + shape(FR(fy + 0.12), ov(14, 74, 2, 1.3, 12), "#FFFFFF", 0));
    s += shape(FR(fy + 0.06), arch(-26, 26, 86, 96, 113), "#C9EADB", 1.3) + shape(FR(fy + 0.1), rr(-23, 88, 3.2, 14, 1.6), SILVER[2], 1);
    return s;
  };
  M.ike_fridge_1 = (k) => {
    // りょうびらき: ステンレス・うえの 2まいの ドア・したの ひきだし 2つ・こおりの でぐち
    const { box, shape, FR, lineOn, shadow, lg } = k, fy = -6;
    let s = shadow(0.12, 3, 8);
    s += box(-34, -50, 68, 44, 2, 114, SILVER);
    const sheen = lg([[0, "#FFFFFF", 0.5], [0.5, "#FFFFFF", 0], [1, "#FFFFFF", 0.25]], 0, 0, 1, 1);
    s += shape(FR(fy + 0.05), rr(-32, 52, 31.4, 60, 2), "#E4E8EC", 1.3) + shape(FR(fy + 0.05), rr(0.6, 52, 31.4, 60, 2), "#E4E8EC", 1.3);
    s += shape(FR(fy + 0.08), rr(-32, 52, 64, 60, 2), sheen, 0);
    s += shape(FR(fy + 0.1), rr(-5, 62, 2.6, 34, 1.3), SILVER[1], 1) + shape(FR(fy + 0.1), rr(2.4, 62, 2.6, 34, 1.3), SILVER[1], 1);
    s += shape(FR(fy + 0.1), rr(-26, 70, 14, 20, 3), "#3C4652", 1.2) + shape(FR(fy + 0.14), rr(-21, 82, 4, 5, 1), "#B6BEC7", 0.8) + shape(FR(fy + 0.14), rr(-24, 72, 10, 2.4, 1), "#6E7A86", 0);
    s += shape(FR(fy + 0.1), rr(14, 100, 12, 5, 1.4), "#2F3B49", 1) + shape(FR(fy + 0.14), rect(16, 101.6, 8, 1.8), LED, 0);
    for (const [z0, hh] of [[30, 20], [5, 23]]) s += shape(FR(fy + 0.05), rr(-32, z0, 64, hh, 2), "#E4E8EC", 1.3) + shape(FR(fy + 0.1), rr(-14, z0 + hh - 6, 28, 2.6, 1.3), SILVER[1], 1);
    return s;
  };
  M.ike_fridge_2 = (k) => {
    // スマート: くろい ガラス・ドアに がめん（live で うごく）・したの ひきだし
    const { box, shape, FR, shadow, L, lg } = k, fy = -6;
    let s = shadow(0.13, 4, 8);
    s += box(-30, -48, 60, 42, 2, 112, BLACK);
    s += shape(FR(fy + 0.05), rr(-28, 40, 56, 72, 3), "#454B55", 1.3) + shape(FR(fy + 0.06), rr(-28, 40, 56, 72, 3), lg([[0, "#FFFFFF", 0.18], [0.45, "#FFFFFF", 0], [1, "#FFFFFF", 0.08]], 0, 0, 1, 1), 0);
    s += shape(FR(fy + 0.1), rr(-22, 66, 26, 38, 3), "#1E2733", 1.2) + L(fridgeScreenSvg(k, FR(fy + 0.14), -22, 66, 26, 38));
    s += shape(FR(fy + 0.1), rr(22, 52, 2.6, 40, 1.3), "#9AA3AD", 1);
    s += shape(FR(fy + 0.05), rr(-28, 5, 56, 33, 3), "#454B55", 1.3) + shape(FR(fy + 0.1), rr(-16, 32, 32, 2.6, 1.3), "#9AA3AD", 1);
    return s;
  };
  // スマート れいぞうこの がめん（static: てんきと たべものの しるし）
  function fridgeScreenSvg(k, m, x0, z0, w, h) {
    let s = k.shape(m, rr(x0 + 2, z0 + h - 12, 10, 9, 2), "#F7D56A", 0) + k.shape(m, ov(x0 + 7, z0 + h - 7.5, 3, 3, 14), "#FFE9A0", 0);
    s += k.shape(m, rr(x0 + 14, z0 + h - 10, 10, 2, 1), "#9FE6F2", 0) + k.shape(m, rr(x0 + 14, z0 + h - 6, 7, 2, 1), "#9FE6F2", 0);
    for (let i = 0; i < 3; i++) s += k.shape(m, rr(x0 + 2 + i * 8, z0 + 4, 6, 10, 1.5), ["#F2A7B8", "#B8DCA6", "#FFFFFF"][i], 0);
    return s;
  }

  // =========================== テレビ ===========================
  const screenStatic = (k, m, x0, z0, w, h, ch = 0) => {
    // 絵（icon・店の 展示）の がめん: そらと 3にんの おか
    let s = k.shape(m, rr(x0, z0, w, h, Math.min(4, h / 6)), ["#9FD3F0", "#7FC6E0", "#F4C9A8"][ch % 3], 1.2);
    s += k.shape(m, [[x0 + 1, z0 + 1], [x0 + w - 1, z0 + 1], [x0 + w - 1, z0 + h * 0.34], [x0 + w * 0.7, z0 + h * 0.42], [x0 + w * 0.35, z0 + h * 0.3], [x0 + 1, z0 + h * 0.38]], "#9ED08C", 0);
    s += k.shape(m, ov(x0 + w * 0.78, z0 + h * 0.76, h * 0.12, h * 0.12, 16), "#FFE9A0", 0);
    for (const [u, c] of [[0.3, "#FFFFFF"], [0.48, "#F7D56A"], [0.64, "#9ED08C"]]) s += k.shape(m, ov(x0 + w * u, z0 + h * 0.42, h * 0.1, h * 0.1, 14), c, 0.9);
    return s + k.shape(m, [[x0 + 3, z0 + h - 3], [x0 + w * 0.3, z0 + h - 3], [x0 + 3, z0 + h * 0.55]], "#FFFFFF", 0, 'fill-opacity=".35"');
  };
  M.ike_tv_0 = (k) => {
    // きわくの テレビ: きの はこ・4ほんの あし・まるい がめん・ダイヤル・スピーカー・アンテナ
    const { box, shape, FR, SD, lineOn, shadow, L, rod, ball } = k, fy = -8;
    let s = shadow(0.12, 6, 10);
    for (const [x, y] of [[-26, -40], [22, -40], [-26, -12], [22, -12]]) s += k.line([[x + 2, y + 2, 0], [x + 1, y + 1, 18]], INK, 4.2) + k.line([[x + 2, y + 2, 0], [x + 1, y + 1, 18]], WOOD[1], 2.4);
    s += box(-30, -44, 60, 36, 18, 54, WOOD);
    s += shape(FR(fy + 0.05), rr(-27, 22, 54, 46, 4), "#B48A5C", 1.2);
    s += shape(FR(fy + 0.1), rr(-25, 25, 36, 40, 8), "#3A3530", 1.3) + L(screenStatic(k, FR(fy + 0.15), -23, 27, 32, 36, 0));
    s += shape(FR(fy + 0.18), [[-21, 60], [-12, 62], [-13, 58]], "#FFFFFF", 0, 'fill-opacity=".45"');
    for (const z of [55, 43]) s += shape(FR(fy + 0.1), ov(19, z, 4.4, 4.4, 18), "#E7D3B0", 1.1) + shape(FR(fy + 0.15), rect(18.5, z, 1, 3.4), INK, 0);
    for (let i = 0; i < 4; i++) s += lineOn(FR(fy + 0.1), [[14, 30 + i * 2.6], [24, 30 + i * 2.6]], "#7B5B3E", 1);
    s += k.cyl(0, -26, 72, 4, 2.4, DARK[1], DARK[0], 1) + rod([[-1, -26, 74], [-14, -32, 104]], "#AEB5BC", 1.6) + rod([[1, -26, 74], [15, -22, 102]], "#AEB5BC", 1.6) + ball(-14, -32, 104, 1.6, "#E3C06B", 1, 0) + ball(15, -22, 102, 1.6, "#E3C06B", 1, 0);
    return s;
  };
  M.ike_tv_1 = (k) => {
    // シネマ: ひくい テレビだい（ひきだし 2つ）・おおきな うすい がめん・サウンドバー
    const { box, shape, FR, lineOn, shadow, L } = k;
    let s = shadow(0.12, 2, 6);
    s += box(-37, -40, 74, 30, 0, 22, OAK) + shape(FR(-10 + 0.05), rr(-34, 4, 33, 14, 2), "#E7CFA6", 1.1) + shape(FR(-10 + 0.05), rr(1, 4, 33, 14, 2), "#E7CFA6", 1.1);
    s += shape(FR(-9.9), rr(-20, 10, 6, 2, 1), "#8C6848", 0) + shape(FR(-9.9), rr(14, 10, 6, 2, 1), "#8C6848", 0);
    s += box(-4, -28, 8, 6, 22, 6, DARK, 1.1);
    s += box(-36, -27, 72, 4, 27, 50, BLACK);
    s += shape(FR(-23 + 0.05), rr(-34, 29, 68, 46, 1.5), SCREEN, 1.1) + L(screenStatic(k, FR(-23 + 0.1), -33, 30, 66, 44, 1));
    s += shape(FR(-22.85), [[-31, 72], [-18, 74], [-20, 68]], "#FFFFFF", 0, 'fill-opacity=".35"');
    s += box(-22, -20, 44, 6, 22, 5, DARK, 1) + lineOn(FR(-13.9), [[-18, 24.5], [18, 24.5]], "#8E96A1", 0.8);
    return s;
  };
  M.ike_tv_2 = (k) => {
    // かべかけ: きの かべいた・うすい テレビ・したの たな（うえきと スピーカー）
    const { box, shape, FR, lineOn, shadow, L } = k;
    let s = shadow(0.12, 2, 6);
    s += box(-34, -44, 68, 6, 0, 86, ["#E2C79E", "#C7A97C", "#F0DDBC"]);
    for (let i = 1; i < 6; i++) s += lineOn(FR(-37.9), [[-34 + i * 11.3, 2], [-34 + i * 11.3, 84]], "#CDAF83", 1);
    s += box(-36, -38, 72, 22, 0, 14, ["#F6F3EC", "#DAD4C8", "#FFFFFF"]) + shape(FR(-16 + 0.05), rect(-36, 6, 72, 1), "#C9C2B5", 0);
    s += box(-30, -37, 60, 3, 34, 38, BLACK) + shape(FR(-34 + 0.05), rr(-28.5, 35.5, 57, 35, 1.2), SCREEN, 1) + L(screenStatic(k, FR(-33.9), -28, 36, 56, 34, 2));
    s += shape(FR(-33.85), [[-26, 68], [-14, 70], [-16, 64]], "#FFFFFF", 0, 'fill-opacity=".35"');
    s += box(16, -32, 14, 10, 14, 10, DARK, 1) + k.shape(FR(-21.9), ov(23, 19, 2.6, 2.6, 14), "#7D8590", 0.8);
    s += k.cyl(-24, -27, 14, 5, 7, "#F2B8A0", "#F7CDB8", 1.1) + k.at(-24, -27, 21, FurnModels.SPR.monstera(), 14, 26);
    return s;
  };

  // =========================== そうじき ===========================
  M.ike_vacuum_0 = (k) => {
    // キャニスター: まるい からだ（くるま）・ホース・パイプ・ゆかの ヘッド（スタンドに たてかけ）
    const { box, shape, FR, egg, cyl, rod, shadow, ball, line } = k, PINK = "#F2B8C6";
    let s = shadow(0.12, 6, 14);
    s += box(6, -34, 24, 22, 0, 4, ["#E9E4DA", "#CFC8BB", "#F4F0E8"], 1) + box(16, -30, 6, 6, 4, 62, SILVER, 1);
    s += box(4, -16, 30, 9, 0, 6, DARK, 1.1) + shape(FR(-7 + 0.05), rect(6, 1.6, 26, 2), "#9AA3AD", 0);
    s += rod([[19, -12, 6], [19, -14, 66]], "#C9CED3", 3.2) + rod([[19, -14, 66], [20, -14, 76]], DARK[0], 4.4);
    s += line([[19, -14, 72], [12, -16, 82], [2, -20, 78], [-6, -24, 60], [-12, -24, 40], [-16, -22, 26]], INK, 6.6) + line([[19, -14, 72], [12, -16, 82], [2, -20, 78], [-6, -24, 60], [-12, -24, 40], [-16, -22, 26]], "#A9B3BD", 4.2);
    for (const [x, y] of [[-30, -16], [-6, -16]]) s += cyl(x, y, 0, 5, 4, DARK[1], DARK[0], 1);
    s += egg(-17, -26, 18, 17, 14, 15, PINK, 1.6) + ball(-28, -14, 6, 5, DARK[0], 1.1, 0.3) + ball(-6, -14, 6, 5, DARK[0], 1.1, 0.3);
    s += shape(FR(-12), ov(-17, 22, 6, 4, 16), "#FFFFFF", 1) + shape(FR(-11.9), ov(-17, 22, 2.6, 1.8, 12), "#9FC7E8", 0) + k.at(-23, -24, 32, `<ellipse cx="0" cy="0" rx="4" ry="2" fill="#FFFFFF" opacity=".6"/>`, 6, 4);
    return s;
  };
  M.ike_vacuum_1 = (k) => {
    // スティック: じゅうでんの スタンド・ほそい パイプ・ごみの つつ（すきとおる）・ゆかの ヘッド
    const { box, shape, FR, cyl, rod, shadow, ball, L } = k;
    let s = shadow(0.12, 10, 12);
    s += cyl(0, -26, 0, 15, 4, "#D6DDE2", "#F0F3F6", 1.2) + box(-3, -36, 6, 6, 4, 70, ["#F6F3EC", "#DAD4C8", "#FFFFFF"], 1.1);
    s += box(-14, -24, 28, 10, 4, 6, ["#7E8D9C", "#647280", "#97A6B5"], 1.1) + shape(FR(-14 + 0.05), rect(-12, 5.6, 24, 1.6), "#4A5562", 0);
    s += rod([[0, -20, 10], [0, -24, 58]], "#C9CED3", 3);
    s += cyl(0, -25, 56, 5.6, 14, "#B6E0EA", "#D9F1F6", 1.2) + cyl(0, -25, 70, 6.6, 8, "#6D86A8", "#89A2C2", 1.2);
    s += rod([[0, -26, 78], [3, -27, 86], [0, -28, 90]], "#6D86A8", 3.4);
    s += L([0, 1, 2].map((i) => k.shape(FR(-29.9), ov(-5 + i * 4, 18, 1.3, 1.3, 10), "#9ED08C", 0)).join(""));
    return s;
  };
  M.ike_vacuum_2 = (k) => {
    // ロボット: うしろの じゅうでん ステーション（みどりの ランプ）・まえの まるい ロボット（live で うごく）
    const { box, shape, FR, cyl, shadow, L } = k;
    let s = shadow(0.08, 6, 14);
    s += box(-14, -48, 28, 12, 0, 16, ["#F4F2EC", "#D8D3C8", "#FFFFFF"], 1.2) + shape(FR(-36 + 0.05), rr(-6, 9, 12, 3.4, 1.6), "#9ED08C", 1);
    s += shape(k.TP(0.2), rr(-12, -36, 24, 6, 2), "#C9C2B5", 0);
    s += L(robotSvg(k, 0, -18));
    return s;
  };
  function robotSvg(k, cx, cy) {
    return k.shape(k.TP(0.1), ov(cx, cy, 17, 17, 28), INK, 0, 'fill-opacity=".12"') + k.cyl(cx, cy, 0, 16, 7, "#B9C2CB", "#E9EDF0", 1.4) + k.shape(k.TP(7.2), ov(cx, cy, 10, 10, 24), "#D3DAE0", 1.1) + k.shape(k.TP(7.3), ov(cx + 5, cy + 5, 2.6, 2.6, 14), "#7FC6E0", 0.9) + k.shape(k.TP(7.3), rr(cx - 6, cy - 12, 12, 3, 1.4), "#3E4652", 0);
  }

  // =========================== でんしレンジ（だいの うえ）===========================
  const RACK = (k, col = WOOD) => {
    // レンジの だい: 2だんの たな・したの だんに かご
    const { box, shape, FR } = k;
    let s = k.shadow(0.12, 4, 8);
    for (const x of [-33, 29]) for (const y of [-46, -12]) s += box(x, y, 4, 4, 0, 44, col, 1.1);
    s += box(-33, -46, 66, 38, 18, 3, col, 1.1) + box(-33, -46, 66, 38, 41, 4, col, 1.2);
    s += box(-22, -38, 26, 20, 21, 10, ["#E8C89A", "#C9A26E", "#F2DDB5"], 1.1) + k.ball(-14, -28, 33, 4, "#E8453C", 1, 0.5) + k.ball(-6, -26, 32, 3.6, "#F7C548", 1, 0.5);
    s += k.cyl(16, -26, 21, 6, 5, "#FFFFFF", "#F4EFE6", 1) + k.cyl(16, -26, 26, 5, 4, "#9FC7E8", "#C3DDF2", 1);
    return s;
  };
  const windowStatic = (k, m, x0, z0, w, h) => k.shape(m, rr(x0, z0, w, h, 3), "#3F4954", 1.2) + k.shape(m, ov(x0 + w / 2, z0 + h * 0.32, w * 0.3, h * 0.12, 18), "#E7DCC9", 0.9) + k.shape(m, [[x0 + 2, z0 + h - 2], [x0 + w * 0.3, z0 + h - 2], [x0 + 2, z0 + h * 0.5]], "#FFFFFF", 0, 'fill-opacity=".25"');
  M.ike_microwave_0 = (k) => {
    const { box, shape, FR, L } = k, BUT = ["#F7E2A8", "#E3C88A", "#FCEFC8"];
    let s = RACK(k) + box(-28, -42, 56, 32, 45, 30, BUT);
    s += L(windowStatic(k, FR(-10 + 0.05), -25, 49, 34, 22)) + shape(FR(-9.9), rr(10, 50, 2.6, 20, 1.3), SILVER[2], 1);
    for (const z of [66, 56]) s += shape(FR(-9.9), ov(20, z, 3.6, 3.6, 16), "#FFFFFF", 1) + shape(FR(-9.85), rect(19.6, z, 0.8, 2.8), INK, 0);
    s += shape(FR(-9.9), rr(15, 47, 10, 3, 1.2), "#F2A7B8", 0.9);
    return s;
  };
  M.ike_microwave_1 = (k) => {
    const { box, shape, FR, L } = k;
    let s = RACK(k, OAK) + box(-31, -44, 62, 34, 45, 36, SILVER);
    s += shape(FR(-10 + 0.05), rr(-29, 48, 44, 30, 2), "#C9D0D7", 1.2) + L(windowStatic(k, FR(-9.9), -26, 50, 38, 22)) + shape(FR(-9.9), rr(-26, 74.5, 38, 2.2, 1.1), "#8E98A2", 1);
    s += shape(FR(-9.9), rr(18, 66, 10, 7, 1.4), "#2F3B49", 1) + shape(FR(-9.85), rect(19.5, 68, 7, 3), LED, 0);
    for (let i = 0; i < 6; i++) s += shape(FR(-9.9), rr(18 + (i % 2) * 5.4, 50 + Math.floor(i / 2) * 5, 4.4, 3.6, 1), "#EEF1F4", 0.8);
    return s;
  };
  M.ike_microwave_2 = (k) => {
    const { box, shape, FR, SD, L } = k;
    let s = RACK(k) + box(-30, -44, 54, 34, 45, 34, WHITE);
    s += box(24, -42, 7, 26, 45, 26, ["#B6E0EA", "#9CCAD6", "#D9F1F6"], 1.2) + shape(SD(31.05), rr(-38, 50, 18, 8, 2), "#7FC6E0", 0);
    s += L(windowStatic(k, FR(-9.9), -27, 49, 36, 24)) + shape(FR(-9.9), rr(12, 50, 9, 26, 2), "#EEF1F4", 1) + shape(FR(-9.85), rr(13.4, 68, 6.2, 5, 1), "#2F3B49", 0.8);
    for (let i = 0; i < 4; i++) s += k.lineOn(k.TP(79.1), [[-22 + i * 6, -36], [-22 + i * 6, -26]], "#C9C2B5", 1.4);
    return s;
  };

  // =========================== でんわ（でんわだいの うえ）===========================
  const PHONE_TABLE = (k) => {
    const { cyl, shape, TP } = k;
    let s = k.shadow(0.12, 10, 18);
    for (const a of [0.6, 2.7, 4.8]) { const x = Math.cos(a) * 12, y = -26 + Math.sin(a) * 12; s += k.rod([[x * 0.4, -26 + (y + 26) * 0.4, 52], [x, y, 0]], WOOD[1], 2.8); }
    s += cyl(0, -26, 50, 22, 4, WOOD[1], WOOD[2], 1.3) + shape(TP(54.2), ov(0, -26, 17, 17, 36), "#FFFFFF", 1);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; s += shape(TP(54.25), ov(Math.cos(a) * 17, -26 + Math.sin(a) * 17, 2.2, 2.2, 10), "#FFFFFF", 0.8); }
    return s;
  };
  M.ike_telephone_0 = (k) => {
    // ダイヤル: あかい からだ・まるい ダイヤル（あな 10こ）・うけき（live で ゆれる）
    const { box, shape, prism, FR, TP, tilt, L } = k, RED = ["#E57A7A", "#C65E5E", "#F29C9C"];
    let s = PHONE_TABLE(k) + box(-11, -34, 22, 16, 55, 10, RED);
    s += prism(tilt([-11, -18, 65], [1, 0, 0], [0, -0.55, 0.45]), rr(0, 0, 22, 12, 2), [0, -0.5, -1.5], RED[2], RED[1], 1.3);
    const dm = tilt([0, -22.5, 69.2], [1, 0, 0], [0, -0.55, 0.45]);
    s += shape(dm, ov(0, 0, 6.4, 6.4, 24), "#FFF6E8", 1.1);
    for (let i = 0; i < 10; i++) { const a = -0.9 + (i / 10) * 4.6; s += shape(dm, ov(Math.cos(a) * 4.4, Math.sin(a) * 4.4, 0.9, 0.9, 8), RED[1], 0.6); }
    s += L(handsetSvg(k, 0, 0, 0, RED));
    return s;
  };
  // うけき（ダイヤル でんわ）: dx・dz は live で ゆらす とき
  function handsetSvg(k, dx, dz, rot, col) {
    const z = 72 + dz, y = -28, a = rot;
    const P = (x, zz) => [dx + x * Math.cos(a) - (zz - z) * Math.sin(a) * 0.3, y, zz + x * Math.sin(a) * 0.3];
    return k.rod([P(-9, z), P(-5, z + 3), P(5, z + 3), P(9, z)], col[0], 4.6) + k.ball(...P(-10, z - 1), 3.6, col[0], 1.1, 0.4) + k.ball(...P(10, z - 1), 3.6, col[0], 1.1, 0.4);
  }
  M.ike_telephone_1 = (k) => {
    // コードレス: しろい おやき（ボタン・ランプ）・たてた こき（がめん）
    const { box, shape, FR, TP, prism, tilt, L } = k;
    let s = PHONE_TABLE(k) + box(-14, -34, 28, 16, 55, 7, WHITE);
    s += prism(tilt([-14, -18, 62], [1, 0, 0], [0, -0.7, 0.3]), rr(0, 0, 28, 10, 2), [0, -0.3, -1.2], "#F3F1EC", "#D9D4CA", 1.2);
    const pm = tilt([-12, -18.5, 62.5], [1, 0, 0], [0, -0.7, 0.3]);
    for (let i = 0; i < 12; i++) s += shape(pm, rr(2 + (i % 4) * 4, 1.5 + Math.floor(i / 4) * 2.6, 3, 1.8, 0.8), "#DCE1E6", 0.6);
    s += box(8, -30, 7, 6, 62, 2, DARK, 1) + L(box(9, -29, 5, 4, 64, 20, ["#F6F3EC", "#DAD4C8", "#FFFFFF"], 1.1) + shape(FR(-24.9), rr(9.6, 76, 3.8, 5, 0.8), "#3E5664", 0.6));
    s += shape(FR(-17.9), ov(-10, 59, 1.4, 1.4, 10), "#9ED08C", 0);
    return s;
  };
  M.ike_telephone_2 = (k) => {
    // テレビでんわ: がめん（カメラつき・live で かおが うつる）・ボタンの だい・うけき
    const { box, shape, FR, prism, tilt, L } = k;
    let s = PHONE_TABLE(k) + box(-16, -36, 32, 18, 55, 6, ["#E9E4DA", "#CFC8BB", "#F4F0E8"]);
    s += box(-12, -36, 24, 4, 61, 20, DARK, 1.2) + shape(FR(-32 + 0.05), rr(-10, 63, 20, 15, 1.5), SCREEN, 1) + L(shape(FR(-31.9), ov(0, 68, 5, 5, 18), "#F7E0C0", 0.9) + shape(FR(-31.85), ov(0, 74, 6, 2.6, 14), "#9FC7E8", 0)) + shape(FR(-31.9), ov(0, 79.6, 0.9, 0.9, 8), "#9ED08C", 0);
    const pm = tilt([-14, -18, 61], [1, 0, 0], [0, -0.8, 0.2]);
    for (let i = 0; i < 9; i++) s += shape(pm, rr(4 + (i % 3) * 4, 1 + Math.floor(i / 3) * 2.4, 3, 1.6, 0.7), "#FFFFFF", 0.6);
    s += k.rod([[8, -24, 63], [12, -24, 66], [18, -24, 66], [20, -24, 63]], "#5A616D", 3.6);
    return s;
  };

  // =========================== あかり ===========================
  M.ike_lighting_0 = (k) => {
    // ステンドグラスの ランプ: まるい サイドテーブル・ブロンズの あし・いろガラスの かさ（ドーム）
    const { cyl, shape, TP, frustum, lathe, rod, shadow, L } = k, BR = ["#A7834E", "#8A6A3C", "#C9A56C"];
    let s = shadow(0.12, 12, 18);
    s += rod([[0, -26, 2], [0, -26, 40]], WOOD[1], 4) + cyl(0, -26, 0, 12, 3, WOOD[1], WOOD[2], 1.1) + cyl(0, -26, 40, 20, 4, WOOD[1], WOOD[2], 1.3);
    s += cyl(0, -26, 44, 6, 3, BR[1], BR[0], 1.1) + rod([[0, -26, 47], [0, -26, 64]], BR[0], 2.4);
    s += lathe(0, -26, [[19, 64], [18, 68], [14, 76], [8, 82], [2, 85]], "#C9A56C", 1.5);
    const cols = ["#F2A7B8", "#9FD3A0", "#F7D56A", "#9FC7E8", "#E8A57A", "#C9B6E0"];
    for (let i = 0; i < 6; i++) { const a0 = -Math.PI * 0.25 + i * 0.52, a1 = a0 + 0.46; s += k.poly([[Math.cos(a0) * 17.6, -26 + Math.sin(a0) * 17.6, 66], [Math.cos(a1) * 17.6, -26 + Math.sin(a1) * 17.6, 66], [Math.cos(a1) * 9.5, -26 + Math.sin(a1) * 9.5, 79], [Math.cos(a0) * 9.5, -26 + Math.sin(a0) * 9.5, 79]], cols[i], 1); }
    s += k.ball(0, -26, 86, 2, BR[0], 1, 0);
    return s;
  };
  M.ike_lighting_1 = (k) => {
    // スリム フロアライト: まるい だいりせきの だい・ほそい ポール・つつの かさ
    const { cyl, frustum, rod, shadow } = k;
    let s = shadow(0.1, 18, 18);
    s += cyl(0, -26, 0, 13, 4, "#E7E2DA", "#F6F3EE", 1.3) + rod([[0, -26, 4], [0, -26, 74]], "#B9974A", 2.2);
    s += frustum(0, -26, 66, 15, 88, 12, "#FBF1DC", "#FFF8EA", 1.4) + k.shape(k.TP(88.1), ov(0, -26, 9, 9, 24), "#F7E7C2", 0.9);
    return s;
  };
  M.ike_lighting_2 = (k) => {
    // シャンデリア: きんの アーチの スタンド・くさり・うでと ろうそく・クリスタルの しずく
    const { cyl, rod, ball, line, shadow, lathe } = k, G0 = "#E3C06B", G1 = "#B9974A";
    let s = shadow(0.1, 6, 12);
    s += cyl(-26, -26, 0, 7, 3, G1, G0, 1.1) + cyl(26, -26, 0, 7, 3, G1, G0, 1.1);
    s += rod([[-26, -26, 3], [-26, -26, 70], [-20, -26, 84], [0, -26, 90], [20, -26, 84], [26, -26, 70], [26, -26, 3]], G0, 2.4);
    s += line([[0, -26, 90], [0, -26, 74]], G1, 1.4);
    s += lathe(0, -26, [[2, 74], [4, 70], [3, 64], [5, 60], [2, 57]], G0, 1.2);
    for (const a of [0.3, 1.35, 2.4, 3.45, 4.5, 5.55]) {
      const x = Math.cos(a) * 14, y = -26 + Math.sin(a) * 9;
      s += line([[0, -26, 62], [x * 0.6, -26 + (y + 26) * 0.6, 58], [x, y, 62]], G0, 1.6) + cyl(x, y, 62, 1.8, 6, "#FFFFFF", "#FFF8EA", 0.9) + ball(x, y, 70, 1.3, "#FFE9A0", 0.8, 0);
      s += line([[x, y, 61], [x, y, 56]], "#C9D3DA", 0.8) + k.at(x, y, 56, `<path d="M0,-1 L1.6,2 L0,5 L-1.6,2 Z" fill="#E8F4F8" ${S(0.7)}/>`, 3, 6);
    }
    return s;
  };

  // =========================== あたらしい 家電 ===========================
  const CART = (k, col = OAK) => {
    // キッチン ワゴン（2だん・くるま）
    const { box } = k;
    let s = k.shadow(0.12, 4, 6);
    for (const x of [-30, 26]) for (const y of [-40, -8]) s += box(x, y, 4, 4, 4, 48, col, 1.1) + k.cyl(x + 2, y + 2, 0, 2.2, 4, DARK[1], DARK[0], 0.9);
    s += box(-30, -40, 60, 36, 14, 3, col, 1.1) + box(-30, -40, 60, 36, 48, 4, col, 1.2);
    return s;
  };
  M.ike_kaden_rice = (k) => {
    // すいはんき: まるい しろい からだ・ふたの とって・ゆげの あな・まえの がめん。したの だんに おちゃわんと しゃもじ
    const { egg, shape, FR, cyl, lathe, prism, TP, L } = k;
    let s = CART(k) + cyl(-14, -22, 17, 6, 3, "#FFFFFF", "#F4EFE6", 1) + cyl(-14, -22, 20, 5.2, 4, "#F7F3EA", "#FFFFFF", 0.9) + cyl(12, -24, 17, 7, 2, "#E8C89A", "#F2DDB5", 1);
    s += lathe(0, -22, [[19, 52], [21, 58], [21, 70], [19, 76], [12, 80], [4, 81]], "#F8F6F1", 1.5);
    s += shape(FR(-1.5), rr(-8, 60, 16, 8, 2), "#3E5664", 1) + shape(FR(-1.4), rect(-6, 62, 6, 3.6), LED, 0) + shape(FR(-1.4), ov(4.5, 64, 1.6, 1.6, 10), "#F7C548", 0);
    s += cyl(0, -22, 78, 9, 2, "#DCD7CD", "#EFEBE3", 1) + k.box(-5, -24, 10, 4, 80, 3, SILVER, 1) + L(cyl(10, -30, 78, 2, 1.2, "#C9C2B5", "#E3DED4", 0.8));
    return s;
  };
  M.ike_kaden_toaster = (k) => {
    // トースター: クロームの はこ・うえに 2つの あな（パンが すこし みえる）・よこの レバー。したの だんに ジャムと バター
    const { box, shape, FR, SD, TP, L } = k;
    let s = CART(k) + k.cyl(-12, -22, 17, 5, 9, "#E8453C", "#F06A60", 1) + k.cyl(-12, -22, 26, 5.4, 2, "#F7F2EA", "#FFFFFF", 0.9) + box(6, -28, 14, 9, 17, 5, ["#FFF4CC", "#E9D9A0", "#FFF9E2"], 1);
    s += box(-17, -32, 34, 20, 52, 24, SILVER) + shape(FR(-12 + 0.05), rect(-17, 66, 34, 2), "#9AA3AD", 0);
    for (const x of [-12, 3]) s += shape(TP(76.1), rr(x, -28, 9, 12, 2), "#3A3F47", 1) + L(shape(TP(76.15), rr(x + 1, -26.5, 7, 9, 1.5), "#E7B672", 0.8));
    s += box(17, -24, 3, 3, 64, 3, DARK, 1) + shape(SD(17.05), rr(-26, 58, 4, 14, 1), "#5A616D", 0);
    s += shape(FR(-11.9), ov(10, 58, 2.6, 2.6, 14), "#FFFFFF", 0.9) + shape(FR(-11.85), rect(9.6, 58, 0.8, 2), INK, 0);
    return s;
  };
  M.ike_kaden_coffee = (k) => {
    // コーヒーメーカー: くろい ほんたい・みずの タンク・ガラスの ポット（live で コーヒーが たまる）・マグカップ
    const { box, shape, FR, SD, cyl, lathe, L } = k;
    let s = CART(k) + cyl(14, -22, 17, 5, 7, "#9FC7E8", "#C3DDF2", 1) + cyl(-12, -22, 17, 7, 3, "#C9A26E", "#DDBD8A", 1);
    s += box(-18, -34, 30, 24, 52, 4, BLACK) + box(-18, -34, 12, 24, 56, 36, BLACK) + box(-18, -34, 30, 24, 88, 6, BLACK);
    s += box(-15, -32, 6, 18, 60, 26, ["#B6E0EA", "#9CCAD6", "#D9F1F6"], 1) + shape(SD(-9 + 0.05), rect(-30, 62, 14, 14), "#9CCAD6", 0);
    s += lathe(2, -22, [[7, 56], [8.5, 62], [8, 70], [6, 74], [5.4, 77]], "#E8F4F8", 1.3, 'fill-opacity=".85"') + L(lathe(2, -22, [[7.2, 56.5], [8.2, 62], [7.6, 66]], "#6B4A33", 0, 'fill-opacity=".9"'));
    s += box(-6, -27, 16, 10, 86, 3, DARK, 1) + shape(FR(-9.9), ov(-12, 92, 1.4, 1.4, 10), "#E8453C", 0);
    s += k.rod([[9.5, -21, 60], [13, -21, 62], [13, -21, 70], [9.5, -21, 72]], "#3E434C", 2.2);
    s += cyl(22, -22, 52, 4, 7, "#FFFFFF", "#F4EFE6", 1) + k.rod([[26, -22, 57], [29, -22, 57], [29, -22, 54], [26, -22, 54]], "#FFFFFF", 1.6);
    return s;
  };
  M.ike_kaden_fan = (k) => {
    // せんぷうき: まるい だい・ポール・モーター・まるい あみ（はねは live で まわる）・リボン
    const { cyl, rod, shape, FR, shadow, L, ball } = k, BL = "#9FC7E8";
    let s = shadow(0.1, 10, 16);
    s += cyl(0, -20, 0, 15, 5, "#E9EDF0", "#F6F8FA", 1.3) + shape(k.TP(5.1), ov(-6, -12, 2.4, 1.6, 12), BL, 0.9) + shape(k.TP(5.1), ov(0, -10, 2.4, 1.6, 12), "#F2A7B8", 0.9) + shape(k.TP(5.1), ov(6, -12, 2.4, 1.6, 12), "#9ED08C", 0.9);
    s += rod([[0, -20, 5], [0, -20, 64]], "#DCE1E6", 3.4) + k.egg(0, -22, 72, 6, 8, 6, "#F6F8FA", 1.3);
    s += shape(FR(-12.2), ov(0, 74, 21, 21, 40), "#FFFFFF", 1.4, 'fill-opacity=".55"');
    s += L(fanBlades(k, FR(-12.6), 0, 74, 0, BL));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; s += k.lineOn(FR(-12.1), [[0, 74], [Math.cos(a) * 21, 74 + Math.sin(a) * 21]], "#C9D3DA", 0.8); }
    s += shape(FR(-12.05), ov(0, 74, 21, 21, 40), "none", 1.6) + shape(FR(-12), ov(0, 74, 4, 4, 18), BL, 1.1) + L(shape(FR(-11.9), [[18, 88], [26, 92], [27, 86]], "#F2A7B8", 0.9));
    return s;
  };
  function fanBlades(k, m, cx, cz, a0, col) {
    let s = "";
    for (let i = 0; i < 3; i++) { const a = a0 + (i / 3) * TAU, p = (t, r) => [cx + Math.cos(a + t) * r, cz + Math.sin(a + t) * r]; s += k.shape(m, [p(0, 3), p(-0.5, 12), p(-0.35, 18), p(0.1, 19), p(0.45, 14), p(0.35, 4)], col, 1); }
    return s;
  }
  M.ike_kaden_purifier = (k) => {
    // くうきせいじょうき: しろい まるみの ある たかい はこ・うえの ふきだし ぐち・まえの ひかりの わ・すいこみの みぞ
    const { box, shape, FR, TP, prism, shadow, L } = k;
    let s = shadow(0.1, 6, 10);
    s += prism(TP(80), rr(-18, -32, 36, 26, 8), [0, 0, -80], "#FBFAF6", "#DAD5CB", 1.5);
    for (let i = 0; i < 7; i++) s += k.lineOn(TP(80.1), [[-14, -28 + i * 3.4], [14, -28 + i * 3.4]], "#CFC9BE", 1.1);
    for (let i = 0; i < 8; i++) s += k.lineOn(FR(-5.9), [[-12, 10 + i * 4], [12, 10 + i * 4]], "#E2DDD3", 1.2);
    s += L(shape(FR(-5.85), ov(0, 58, 7, 7, 28), "#9FD3E0", 1.3) + shape(FR(-5.8), ov(0, 58, 4.4, 4.4, 24), "#FFFFFF", 0));
    s += shape(FR(-5.85), rr(-6, 70, 12, 3, 1.2), "#3E5664", 0.9);
    return s;
  };
  M.ike_kaden_pc = (k) => {
    // パソコン デスク: きの つくえ（ひきだし）・モニター（がめんは live）・キーボード・マウス・したに パソコンの はこ
    const { box, shape, FR, TP, shadow, L, cyl } = k;
    let s = shadow(0.12, 4, 6);
    for (const x of [-50, 46]) s += box(x, -50, 4, 44, 0, 62, OAK, 1.2);
    s += box(-52, -54, 104, 52, 62, 5, OAK) + box(18, -50, 28, 40, 44, 18, OAK, 1.2) + shape(FR(-10 + 0.05), rr(26, 50, 12, 2.6, 1.2), "#8C6848", 0);
    s += box(-44, -44, 18, 34, 0, 40, BLACK) + shape(FR(-10 + 0.05), rr(-41, 30, 3, 6, 1), "#7FC6E0", 0) + shape(FR(-10 + 0.05), rect(-40, 8, 12, 1.4), "#30343B", 0);
    s += box(-6, -46, 12, 8, 67, 3, DARK, 1) + box(-2, -44, 4, 4, 70, 14, DARK, 1);
    s += box(-30, -44, 60, 4, 80, 34, BLACK) + shape(FR(-40 + 0.05), rr(-28, 82, 56, 30, 1.2), SCREEN, 1) + L(pcScreenSvg(k, FR(-39.9), -27.5, 82.5, 55, 29));
    s += k.prism(TP(67.6), rr(-22, -30, 36, 11, 1.5), [0, 0, -1.5], "#F3F1EC", "#CFC9BE", 1.1);
    for (let i = 0; i < 3; i++) s += k.lineOn(TP(67.7), [[-20, -27 + i * 3], [12, -27 + i * 3]], "#CFC9BE", 0.9);
    s += k.egg(24, -24, 68.5, 3.2, 4.6, 1.8, "#F3F1EC", 1) + cyl(-40, -36, 67, 4, 10, "#FFFFFF", "#F4EFE6", 1) + k.at(-40, -36, 77, FurnModels.SPR.cactus ? FurnModels.SPR.cactus() : "", 10, 18);
    return s;
  };
  function pcScreenSvg(k, m, x0, z0, w, h) {
    // static: デスクトップ（そらいろ・アイコン 3つ・まどが 1まい）
    let s = k.shape(m, rect(x0, z0, w, h), "#BFE0F0", 0) + k.shape(m, rect(x0, z0, w, 4), "#6D86A8", 0);
    for (let i = 0; i < 3; i++) s += k.shape(m, rr(x0 + 3, z0 + h - 8 - i * 7, 5, 5, 1), ["#F2A7B8", "#F7D56A", "#9ED08C"][i], 0);
    s += k.shape(m, rr(x0 + 14, z0 + 8, w * 0.55, h * 0.6, 1.5), "#FFFFFF", 0.8) + k.shape(m, rect(x0 + 14, z0 + 8 + h * 0.6 - 3, w * 0.55, 3), "#9FC7E8", 0);
    return s;
  }
  M.ike_kaden_speaker = (k) => {
    // スピーカー セット: きの スピーカー 2つ（ウーファー・ツイーター）・まんなかの アンプ（ダイヤル・メーター）
    const { box, shape, FR, shadow, L } = k;
    let s = shadow(0.12, 2, 6);
    s += box(-36, -38, 72, 30, 0, 10, ["#4A4F58", "#3A3E46", "#5C626C"], 1.2);
    s += box(-18, -34, 36, 22, 10, 18, SILVER) + shape(FR(-12 + 0.05), rr(-14, 14, 12, 10, 1.5), "#F7EDD0", 1) + L(k.lineOn(FR(-11.9), [[-8, 15], [-11, 22]], "#E8453C", 1));
    for (const x of [6, 12]) s += shape(FR(-11.9), ov(x, 19, 2.6, 2.6, 14), "#EEF1F4", 1) + shape(FR(-11.85), rect(x - 0.4, 19, 0.8, 2), INK, 0);
    for (const x0 of [-54, 32]) {
      s += box(x0, -42, 22, 34, 0, 96, WOOD);
      const cx = x0 + 11, m = FR(-8 + 0.05);
      s += shape(m, rr(x0 + 1.5, 4, 19, 88, 2), "#3E3730", 1.1);
      s += L(shape(FR(-7.9), ov(cx, 30, 8.6, 8.6, 28), "#5A524A", 1.1) + shape(FR(-7.85), ov(cx, 30, 4.4, 4.4, 20), "#7D746A", 1) + shape(FR(-7.8), ov(cx, 30, 1.6, 1.6, 12), "#2E2924", 0));
      s += shape(FR(-7.9), ov(cx, 56, 5.4, 5.4, 24), "#5A524A", 1) + shape(FR(-7.85), ov(cx, 56, 2.2, 2.2, 14), "#B9974A", 0.8) + shape(FR(-7.9), ov(cx, 76, 3, 3, 16), "#5A524A", 0.9);
    }
    return s;
  };
  M.ike_kaden_massage = (k) => {
    // マッサージチェア: あつい ざぶ・せもたれ（live で もみだまが うごく）・ひじかけ・あしの ところ・リモコン
    const { box, shape, TP, prism, tilt, shadow, L } = k, LE = ["#C99A6E", "#A87C54", "#DDB58C"], CR = ["#F4E9D6", "#DCCFB8", "#FBF4E8"];
    let s = shadow(0.14, 4, 14);
    s += box(-30, -60, 60, 58, 0, 14, ["#6E625A", "#5A5049", "#857870"], 1.3);
    s += prism(tilt([-36, -6, 14], [1, 0, 0], [0, 0.55, -1]), rr(0, -2, 72, 20, 4), [0, 0, 0], LE[0], LE[1], 1.3) + prism(TP(30), rr(-24, -58, 48, 46, 8), [0, 0, -16], CR[0], CR[1], 1.4);
    s += prism(tilt([-24, -58, 28], [1, 0, 0], [0, 0.22, 1]), rr(0, 0, 48, 82, 10), [0, -10, 0], CR[2], CR[1], 1.4);
    const back = tilt([-24, -57.9, 28], [1, 0, 0], [0, 0.22, 1]);
    s += shape(back, rr(8, 8, 32, 64, 8), "#E9DCC4", 1.1) + L(shape(back, ov(18, 40, 3.4, 3.4, 16), "#C9B48E", 0.9) + shape(back, ov(30, 40, 3.4, 3.4, 16), "#C9B48E", 0.9));
    s += shape(back, ov(24, 76, 11, 6, 24), CR[0], 1.1);
    for (const x of [-37, 25]) s += box(x, -58, 12, 52, 14, 30, LE) + prism(TP(44.1), rr(x, -58, 12, 52, 5), [0, 0, -1.4], LE[2], LE[1], 1.1);
    s += box(27, -18, 6, 9, 44.5, 3, ["#F6F3EC", "#DAD4C8", "#FFFFFF"], 1) + shape(TP(47.6), ov(30, -14, 1.2, 1.2, 10), "#E8453C", 0);
    return s;
  };

  for (const [id, fn] of Object.entries(M)) if (FURN_INDEX[id]) FurnModels.register(id, fn);

  // ---- かべかけ エアコン（かべの 家具・2D。100×40）----
  FURN_ART.ike_kaden_aircon = (o = {}) => {
    let s = `<rect x="2" y="3" width="96" height="30" rx="9" fill="#FBFAF6" ${S(1.8)}/>`;
    s += `<path d="M10,8 H90" stroke="#E2DDD3" stroke-width="2" stroke-linecap="round"/><path d="M10,12 H90" stroke="#E2DDD3" stroke-width="2" stroke-linecap="round"/>`;
    s += `<rect x="70" y="16" width="16" height="6" rx="2" fill="#3E5664"/>` + dot(74, 19, 1.3, LED) + dot(79, 19, 1.3, "#9ED08C") + dot(84, 19, 1.3, "#F7C548");
    s += o.live ? "" : `<path d="M8,30 Q50,34 92,30 L90,34 Q50,37 10,34 Z" fill="#E9E5DC" ${S(1.2)}/>`;
    return s;
  };

  // ======================= テレビの ばんぐみ（canvas・館でも つかう）=======================
  // ch: 0 ニュース・1 3にんの アニメ・2 うみ・3 よぞら・4 カラーバー。(0,0)〜(w,h) に 描く（y は した むき）
  const CH = ["ぽかぽか ニュース", "3にんの アニメ", "うみの なかま", "ほしぞら", "カラーバー"];
  function trio(ctx, x, y, r, t, i) {
    // 3にんの かお（わんこ・がちゃん・ごじ）。ちいさい まる
    const cols = ["#FFFFFF", "#F7D56A", "#9ED08C"], bob = Math.abs(Math.sin(t * 5 + i)) * r * 0.5;
    ctx.save(); ctx.translate(x, y - bob);
    ctx.fillStyle = cols[i]; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.6, r * 0.14);
    if (i === 0) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.8, -r * 0.2, r * 0.32, r * 0.6, s * 0.3, 0, TAU); ctx.fillStyle = "#C9A06A"; ctx.fill(); ctx.stroke(); } ctx.fillStyle = cols[i]; }
    if (i === 2) { ctx.fillStyle = "#7FB06A"; for (const s of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(s * r - r * 0.2, -r * 0.8); ctx.lineTo(s * r, -r * 1.3); ctx.lineTo(s * r + r * 0.2, -r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.fillStyle = cols[i]; }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    if (i === 1) { ctx.fillStyle = "#F29A5B"; ctx.beginPath(); ctx.moveTo(-r * 0.25, r * 0.15); ctx.lineTo(r * 0.25, r * 0.15); ctx.lineTo(0, r * 0.45); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = INK; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.35, -r * 0.1, r * 0.12, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function tvShow(ctx, ch, t, w, h) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    const c = ((ch % CH.length) + CH.length) % CH.length;
    if (c === 0) {
      // ニュース: そら・おひさま・くも・したに ながれる もじの おび
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#8FCDEB"); g.addColorStop(1, "#D6EEF7"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#FFE9A0"; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.3, h * 0.15, 0, TAU); ctx.fill();
      ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 3; i++) { const x = ((t * 6 + i * w * 0.45) % (w * 1.3)) - w * 0.15, y = h * (0.2 + i * 0.13); ctx.beginPath(); ctx.ellipse(x, y, h * 0.16, h * 0.07, 0, 0, TAU); ctx.ellipse(x + h * 0.1, y - h * 0.04, h * 0.1, h * 0.06, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#9ED08C"; ctx.fillRect(0, h * 0.62, w, h * 0.2);
      ctx.fillStyle = "#E8453C"; ctx.fillRect(0, h * 0.82, w * 0.22, h * 0.18); ctx.fillStyle = "#3E5664"; ctx.fillRect(w * 0.22, h * 0.82, w * 0.78, h * 0.18);
      ctx.fillStyle = "#FFFFFF"; ctx.font = `900 ${f2(h * 0.12)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillText("ニュース", w * 0.02, h * 0.91, w * 0.19);
      const msg = "あしたも はれ　ぽかぽか タウンは きょうも げんき！　", tw = ctx.measureText(msg).width, x0 = w * 0.24 - ((t * h * 0.5) % tw);
      ctx.save(); ctx.beginPath(); ctx.rect(w * 0.22, h * 0.82, w * 0.78, h * 0.18); ctx.clip(); ctx.fillText(msg, x0, h * 0.91); ctx.fillText(msg, x0 + tw, h * 0.91); ctx.restore();
    } else if (c === 1) {
      // 3にんの アニメ: おかを はしる 3にん
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#FFD9C2"); g.addColorStop(1, "#FFF2D6"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#B7DDA2"; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += w / 16) ctx.lineTo(x, h * 0.66 + Math.sin(x / w * 7 + t * 1.6) * h * 0.06); ctx.lineTo(w, h); ctx.fill();
      for (let i = 0; i < 3; i++) trio(ctx, ((t * w * 0.18 + i * w * 0.22) % (w * 1.2)) - w * 0.1, h * 0.6, h * 0.11, t, i);
      ctx.fillStyle = "#F7A9C8"; for (let i = 0; i < 4; i++) { const x = (i * w * 0.27 + t * 8) % w; ctx.beginPath(); ctx.arc(x, h * 0.2 + Math.sin(t * 2 + i) * h * 0.05, h * 0.04, 0, TAU); ctx.fill(); }
    } else if (c === 2) {
      // うみ: あおい グラデーション・さかな・あわ
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#7CC7E0"); g.addColorStop(1, "#2F7FA8"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        const dir = i % 2 ? -1 : 1, x = ((dir * t * w * 0.1 + i * w * 0.3) % (w * 1.4) + w * 1.4) % (w * 1.4) - w * 0.2, y = h * (0.25 + (i % 3) * 0.22), r = h * (0.06 + (i % 2) * 0.03);
        ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.fillStyle = ["#F29A5B", "#F7D56A", "#F2A7B8"][i % 3]; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.6, r * 0.12);
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.lineTo(-r * 2.2, -r * 0.8); ctx.lineTo(-r * 2.2, r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.2, r * 0.16, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 6; i++) { const y = h - ((t * h * 0.25 + i * h * 0.19) % h); ctx.beginPath(); ctx.arc(w * (0.1 + i * 0.16) + Math.sin(t * 3 + i) * w * 0.02, y, h * 0.025, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#6FAE7C"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(w * (0.15 + i * 0.25), h, w * 0.03, h * (0.2 + Math.sin(t * 2 + i) * 0.04), 0, 0, TAU); ctx.fill(); }
    } else if (c === 3) {
      // よぞら: ほし（またたかない ちいさな てん）・つき・ながれぼし
      ctx.fillStyle = "#26324A"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#FFF3C4"; ctx.beginPath(); ctx.arc(w * 0.75, h * 0.3, h * 0.14, 0, TAU); ctx.fill(); ctx.fillStyle = "#26324A"; ctx.beginPath(); ctx.arc(w * 0.75 + h * 0.07, h * 0.26, h * 0.12, 0, TAU); ctx.fill();
      ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 14; i++) ctx.fillRect((i * 37) % 97 / 97 * w, (i * 53) % 61 / 61 * h * 0.7, Math.max(1, h * 0.012), Math.max(1, h * 0.012));
      const k0 = (t * 0.4) % 1; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = Math.max(0.8, h * 0.012); ctx.beginPath(); ctx.moveTo(w * (0.2 + k0 * 0.5), h * (0.1 + k0 * 0.3)); ctx.lineTo(w * (0.12 + k0 * 0.5), h * (0.05 + k0 * 0.3)); ctx.stroke();
      ctx.fillStyle = "#3A4A66"; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += w / 8) ctx.lineTo(x, h * (0.8 - ((x * 7) % 11) / 60)); ctx.lineTo(w, h); ctx.fill();
    } else {
      // カラーバー（むかしの テレビ）
      const cols = ["#F4F4F4", "#F2E35B", "#6FD4E4", "#6FD48A", "#D46FC0", "#E05A5A", "#5A6FE0"];
      cols.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect((i * w) / cols.length, 0, w / cols.length + 1, h * 0.72); });
      ctx.fillStyle = "#26324A"; ctx.fillRect(0, h * 0.72, w, h * 0.28); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(w * 0.1, h * 0.78, w * 0.2, h * 0.15);
    }
    ctx.restore();
  }
  // チャンネルを かえた ときの ざざっ（t は かえて からの びょう）
  function tvNoise(ctx, w, h, t) {
    if (t > 0.35) return;
    ctx.save(); ctx.globalAlpha = 1 - t / 0.35;
    for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 2 ? "#FFFFFF" : "#8E96A1"; ctx.fillRect(((i * 41 + Math.floor(G.t * 60) * 13) % 100) / 100 * w, ((i * 29 + Math.floor(G.t * 60) * 7) % 100) / 100 * h, w * 0.12, Math.max(1, h * 0.03)); }
    ctx.restore();
  }

  return { OLD, NEW, ids: Object.keys(M), CH, tvShow, tvNoise, trio, fanBlades, robotSvg, handsetSvg, screenStatic };
})();
