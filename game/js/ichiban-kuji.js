// いちばんくじ（ネリカスタウンの コンビニ 2つ・UI-55。オーナーの FB 2026-10-03「一回1000円のクジ(一番くじ)を実装…仕組みは、実際の一番くじと同じに」）。
// ・ほんものの いちばんくじと おなじ しくみ（出典は docs/ROADMAP_V2.md の UI-55）:
//   1ロット 80まいの くじ（ひいた くじは もどらない）。賞ごとに ほんすうが きまって いて（A・B・Cしょうは 1ほんずつ）、ハズレは ない。
//   さいごの 1まいを ひいた 人は その賞と いっしょに「ラストワンしょう」も もらえる（のこりを ぜんぶ ひけば かならず もらえる）。
//   レジの よこの ボード（くじけんの はりつけ ひょう）に ひいた 賞が はられて いき、のこりの かずが わかる。
//   くじけんは めくる まで なにしょうか わからない。D〜Fしょうは のこって いる なかから すきな ものを えらべる・G〜Iしょうは なにが でるか おたのしみ。
//   はんけん（くじけんの のこりの はんぶん）で ダブルチャンスに おうぼ できる（けっかは つぎの ひ）。
//   ほかの おきゃくさんも まいにち すこし ひく（1にち 0〜4まい。のこりが 10まい いかなら ひかない）。うりきれた つぎの ひに あたらしい ロットが はいる。
// ・1かい 1000コイン。ローリソン と せぶんぶん で けいひんが ちがう（どちらも 25しゅ ＋ ダブルチャンスしょう）。ぜんぶ そろえるには ロットを まるごと（80000コイン）ひく くらい いる。
// ・けいひん: A〜Cしょう ビッグ ぬいぐるみ（ごじ・わんこ・がちゃん）・Dしょう クッション・Eしょう マグカップ（ローリソン）／ブランケット（せぶんぶん）・Fしょう エコバッグ（もちもの）・
//   Gしょう アクリル スタンド（ローリソン）／ちび ぬいぐるみ（せぶんぶん。どちらも フィギュア だいに かざれる）・Hしょう クーポンけん（その コンビニで 1こ むりょう）・
//   Iしょう シール シート（シールちょうに はれる）・ラストワンしょう 3にんの ビッグ ぬいぐるみ・ダブルチャンスしょう タペストリー（かべ）。絵は js/kuji-art.js、がめんは js/kuji-ui.js。
// ・「みんなの くじ」（js/kuji-net.js）は べつの ごうかな けいひん（DELUXE・UI-101）: ローリソン「ロイヤル パーティー」・せぶんぶん「ごうか おしょうがつ」。絵は js/kuji-deluxe-art.js。
// ・セーブ: Save.d.kuji（くわしくは st() の うえ）。Save.SCHEMA は 2 の まま。
const IchibanKuji = (() => {
  const PRICE = 1000, KEEP = 10, CATCHUP = 7, OTHERS_MAX = 4, DC_RATE = 0.02, BAG_REFUND = 100, LOG_MAX = 80;
  const GRADES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  // 賞の ほんすう（しゅるいごと）。2つの コンビニで おなじ・ぜんぶで 80まい（A1 B1 C1 D3 E6 F9 G12 H20 I27）
  const PLAN = { A: [1], B: [1], C: [1], D: [1, 1, 1], E: [2, 2, 2], F: [3, 3, 3], G: [3, 3, 3, 3], H: [5, 5, 5, 5], I: [9, 9, 9] };
  const PICK = { D: true, E: true, F: true }; // のこりから えらべる 賞（ほかは ランダム）
  const GRADE_COL = { A: "#E8434F", B: "#F28C28", C: "#E8B10C", D: "#5DB35D", E: "#3FA7C9", F: "#4A72C9", G: "#8E6BD0", H: "#D35FA0", I: "#8A8F99", L: "#C9792A" };

  // ---- けいひん（コンビニごと）。[id の しっぽ, なまえ, せつめい, くわしい こと] ----
  // kind: plush（ビッグ ぬいぐるみ）・cushion・mug・blanket（ラグ）・bag（もちもの）・acsta・chibi（フィギュア だい）・coupon・sheet（シール）・tapestry（かべ）
  const SERIES = [
    {
      id: "lawson", key: "law", shop: "ローリソン", title: "ローリソンの てんいんさん", color: "#4A8CC9", light: "#DDEBF6", dark: "#2F6CA8",
      cats: { A: "ビッグ ぬいぐるみ", B: "ビッグ ぬいぐるみ", C: "ビッグ ぬいぐるみ", D: "ごはん クッション", E: "しましま マグカップ", F: "エコバッグ", G: "アクリル スタンド", H: "クーポンけん", I: "シール シート" },
      items: {
        A: [["a", "てんいん ごじ ビッグ ぬいぐるみ", "ローリソンの あおい しましまの せいふくを きた ごじ。あげたての からあげを だいじに かかえて いる。", { kind: "plush", who: "goji", w: 112, d: 84, h: 124, comfort: 14 }]],
        B: [["b", "おにぎり わんこ ビッグ ぬいぐるみ", "おにぎりの きぐるみを きた わんこ。のりの マフラーが ポイント。", { kind: "plush", who: "wanko", w: 100, d: 76, h: 112, comfort: 13 }]],
        C: [["c", "プリン がちゃん ビッグ ぬいぐるみ", "カラメルの ぼうしを かぶった プリンの がちゃん。スプーンを もって わくわく。", { kind: "plush", who: "gachan", w: 96, d: 74, h: 104, comfort: 12 }]],
        D: [
          ["d0", "からあげ クッション", "あげたての からあげの かたちの まんまる クッション。", { kind: "cushion", w: 68, d: 56, h: 46, comfort: 6 }],
          ["d1", "おにぎり クッション", "のりを まいた さんかくの おにぎりの クッション。", { kind: "cushion", w: 66, d: 54, h: 54, comfort: 6 }],
          ["d2", "ロールケーキ クッション", "くるくるの うずまきが かわいい ロールケーキの クッション。", { kind: "cushion", w: 70, d: 56, h: 48, comfort: 6 }],
        ],
        E: [
          ["e0", "しましま マグ わんこ", "あおい しましまに わんこの かおの マグカップ。", { kind: "mug", who: "wanko", w: 40, d: 30, h: 42, comfort: 2 }],
          ["e1", "しましま マグ がちゃん", "あおい しましまに がちゃんの かおの マグカップ。", { kind: "mug", who: "gachan", w: 40, d: 30, h: 42, comfort: 2 }],
          ["e2", "しましま マグ ごじ", "あおい しましまに ごじの かおの マグカップ。", { kind: "mug", who: "goji", w: 40, d: 30, h: 42, comfort: 2 }],
        ],
        F: [
          ["f0", "ローリソン バッグ わんこ", "ローリソンの あおい エコバッグ。わんこの イラスト いり。", { kind: "bag", who: "wanko", st: { def: 1 } }],
          ["f1", "ローリソン バッグ がちゃん", "ローリソンの あおい エコバッグ。がちゃんの イラスト いり。", { kind: "bag", who: "gachan", st: { spd: 1 } }],
          ["f2", "ローリソン バッグ ごじ", "ローリソンの あおい エコバッグ。ごじの イラスト いり。", { kind: "bag", who: "goji", st: { hp: 3 } }],
        ],
        G: [
          ["g0", "アクリル スタンド わんこ", "せいふくの わんこの アクリル スタンド。", { kind: "acsta", who: "wanko", w: 40, d: 22, h: 58, comfort: 2 }],
          ["g1", "アクリル スタンド がちゃん", "せいふくの がちゃんの アクリル スタンド。", { kind: "acsta", who: "gachan", w: 40, d: 22, h: 58, comfort: 2 }],
          ["g2", "アクリル スタンド ごじ", "せいふくの ごじの アクリル スタンド。", { kind: "acsta", who: "goji", w: 40, d: 22, h: 58, comfort: 2 }],
          ["g3", "アクリル スタンド アオ", "ローリソンの てんいん くまの アオの アクリル スタンド。", { kind: "acsta", who: "keeper", w: 40, d: 22, h: 58, comfort: 2 }],
        ],
        H: [
          ["h0", "からあげ むりょう けん", "ローリソンで からあげが 1こ むりょうで もらえる。", { kind: "coupon", item: "karaage" }],
          ["h1", "プリン むりょう けん", "ローリソンで プリンが 1こ むりょうで もらえる。", { kind: "coupon", item: "pudding" }],
          ["h2", "おにぎり むりょう けん", "ローリソンで おにぎりが 1こ むりょうで もらえる。", { kind: "coupon", item: "onigiri" }],
          ["h3", "ローリソン なんでも むりょう けん", "ローリソンの しなものが どれでも 1こ むりょう。", { kind: "coupon", item: null }],
        ],
        I: [
          ["i0", "てんいん わんこの シール", "てんいんさんの わんこ 2まいと からあげ・おにぎりの シール。", { kind: "sheet", stickers: [["stk_kjlaw_wanko", 2], ["stk_kjlaw_karaage", 1], ["stk_kjlaw_onigiri", 1]] }],
          ["i1", "てんいん がちゃんの シール", "てんいんさんの がちゃん 2まいと プリン・からあげの シール。", { kind: "sheet", stickers: [["stk_kjlaw_gachan", 2], ["stk_kjlaw_pudding", 1], ["stk_kjlaw_karaage", 1]] }],
          ["i2", "てんいん ごじの シール", "てんいんさんの ごじ 2まいと おにぎり・プリンの シール。", { kind: "sheet", stickers: [["stk_kjlaw_goji", 2], ["stk_kjlaw_onigiri", 1], ["stk_kjlaw_pudding", 1]] }],
        ],
      },
      last: ["l", "3にんの レジ ビッグ ぬいぐるみ", "ラストワンしょう。せいふくの 3にんが ちいさな レジの うしろに ならんだ おおきな ぬいぐるみ。", { kind: "plush", who: "trio", w: 150, d: 84, h: 118, comfort: 16 }],
      dc: ["dc", "ローリソン タペストリー", "ダブルチャンスしょう。てんいんさんの 3にんの ぬのの タペストリー。", { kind: "tapestry", w: 70, h: 96, comfort: 5 }],
      stickers: [["stk_kjlaw_wanko", "てんいん わんこ"], ["stk_kjlaw_gachan", "てんいん がちゃん"], ["stk_kjlaw_goji", "てんいん ごじ"], ["stk_kjlaw_karaage", "からあげ"], ["stk_kjlaw_onigiri", "おにぎり"], ["stk_kjlaw_pudding", "プリン"]],
    },
    {
      id: "sevenbun", key: "sev", shop: "せぶんぶん", title: "せぶんぶんの ほかほか", color: "#E86F3A", light: "#FCEFE3", dark: "#B9532A",
      cats: { A: "ビッグ ぬいぐるみ", B: "ビッグ ぬいぐるみ", C: "ビッグ ぬいぐるみ", D: "おでん クッション", E: "ほかほか ブランケット", F: "エコバッグ", G: "ちび ぬいぐるみ", H: "クーポンけん", I: "シール シート" },
      items: {
        A: [["a", "メロンパン わんこ ビッグ ぬいぐるみ", "メロンパンの フードを かぶった わんこ。あみめの もようも ふかふか。", { kind: "plush", who: "wanko", w: 108, d: 80, h: 120, comfort: 14 }]],
        B: [["b", "おでん がちゃん ビッグ ぬいぐるみ", "おでんの おわんに つかった たまごの がちゃん。ゆげまで ぬのの ししゅう。", { kind: "plush", who: "gachan", w: 104, d: 80, h: 100, comfort: 13 }]],
        C: [["c", "ココア ごじ ビッグ ぬいぐるみ", "ニットぼうと マフラーの ごじ。あったか ココアを りょうてで もつ。", { kind: "plush", who: "goji", w: 104, d: 78, h: 118, comfort: 12 }]],
        D: [
          ["d0", "だいこん クッション", "あじの しみた だいこんの まあるい クッション。", { kind: "cushion", w: 68, d: 58, h: 42, comfort: 6 }],
          ["d1", "たまご クッション", "おでんの ゆでたまごの クッション。きみが ちょこっと。", { kind: "cushion", w: 62, d: 50, h: 46, comfort: 6 }],
          ["d2", "こんにゃく クッション", "さんかくの こんにゃくの クッション。つぶつぶ もよう。", { kind: "cushion", w: 66, d: 54, h: 48, comfort: 6 }],
        ],
        E: [
          ["e0", "わんこの ブランケット", "せぶんぶんの しましまと わんこの ほかほか ブランケット。", { kind: "blanket", who: "wanko", w: 150, d: 104, h: 6, comfort: 4 }],
          ["e1", "がちゃんの ブランケット", "せぶんぶんの しましまと がちゃんの ほかほか ブランケット。", { kind: "blanket", who: "gachan", w: 150, d: 104, h: 6, comfort: 4 }],
          ["e2", "ごじの ブランケット", "せぶんぶんの しましまと ごじの ほかほか ブランケット。", { kind: "blanket", who: "goji", w: 150, d: 104, h: 6, comfort: 4 }],
        ],
        F: [
          ["f0", "せぶんぶん バッグ わんこ", "3しょくの しましまの エコバッグ。わんこの イラスト いり。", { kind: "bag", who: "wanko", st: { def: 1 } }],
          ["f1", "せぶんぶん バッグ がちゃん", "3しょくの しましまの エコバッグ。がちゃんの イラスト いり。", { kind: "bag", who: "gachan", st: { spd: 1 } }],
          ["f2", "せぶんぶん バッグ ごじ", "3しょくの しましまの エコバッグ。ごじの イラスト いり。", { kind: "bag", who: "goji", st: { hp: 3 } }],
        ],
        G: [
          ["g0", "ちび ぬいぐるみ わんこ", "はちまきと エプロンの ちいさな わんこの ぬいぐるみ。", { kind: "chibi", who: "wanko", w: 44, d: 34, h: 50, comfort: 3 }],
          ["g1", "ちび ぬいぐるみ がちゃん", "はちまきと エプロンの ちいさな がちゃんの ぬいぐるみ。", { kind: "chibi", who: "gachan", w: 44, d: 34, h: 50, comfort: 3 }],
          ["g2", "ちび ぬいぐるみ ごじ", "はちまきと エプロンの ちいさな ごじの ぬいぐるみ。", { kind: "chibi", who: "goji", w: 44, d: 34, h: 50, comfort: 3 }],
          ["g3", "ちび ぬいぐるみ ナナ", "せぶんぶんの てんいん きつねの ナナの ちいさな ぬいぐるみ。", { kind: "chibi", who: "keeper", w: 44, d: 34, h: 50, comfort: 3 }],
        ],
        H: [
          ["h0", "おでん むりょう けん", "せぶんぶんで おでんが 1こ むりょうで もらえる。", { kind: "coupon", item: "oden" }],
          ["h1", "メロンパン むりょう けん", "せぶんぶんで メロンパンが 1こ むりょうで もらえる。", { kind: "coupon", item: "bread" }],
          ["h2", "ココア むりょう けん", "せぶんぶんで ココアが 1ぱい むりょうで もらえる。", { kind: "coupon", item: "cocoa" }],
          ["h3", "せぶんぶん なんでも むりょう けん", "せぶんぶんの しなものが どれでも 1こ むりょう。", { kind: "coupon", item: null }],
        ],
        I: [
          ["i0", "はちまき わんこの シール", "はちまきの わんこ 2まいと おでん・メロンパンの シール。", { kind: "sheet", stickers: [["stk_kjsev_wanko", 2], ["stk_kjsev_oden", 1], ["stk_kjsev_melon", 1]] }],
          ["i1", "はちまき がちゃんの シール", "はちまきの がちゃん 2まいと ココア・おでんの シール。", { kind: "sheet", stickers: [["stk_kjsev_gachan", 2], ["stk_kjsev_cocoa", 1], ["stk_kjsev_oden", 1]] }],
          ["i2", "はちまき ごじの シール", "はちまきの ごじ 2まいと メロンパン・ココアの シール。", { kind: "sheet", stickers: [["stk_kjsev_goji", 2], ["stk_kjsev_melon", 1], ["stk_kjsev_cocoa", 1]] }],
        ],
      },
      last: ["l", "おでん なべ 3にん ビッグ ぬいぐるみ", "ラストワンしょう。おおきな おでんの なべに 3にんが ぽかぽか つかった ぬいぐるみ。", { kind: "plush", who: "trio", w: 150, d: 92, h: 104, comfort: 16 }],
      dc: ["dc", "せぶんぶん タペストリー", "ダブルチャンスしょう。はちまきの 3にんの ぬのの タペストリー。", { kind: "tapestry", w: 70, h: 96, comfort: 5 }],
      stickers: [["stk_kjsev_wanko", "はちまき わんこ"], ["stk_kjsev_gachan", "はちまき がちゃん"], ["stk_kjsev_goji", "はちまき ごじ"], ["stk_kjsev_oden", "おでん"], ["stk_kjsev_melon", "メロンパン"], ["stk_kjsev_cocoa", "ココア"]],
    },
  ];
  // ---- みんなの くじ（js/kuji-net.js）の けいひん。ひとりの くじ より ごうか（UI-101。オーナーの 指示 2026-10-06「ひとりのくじとみんなのくじの景品を変えて。みんなのくじの方が、豪華にしたい。」）----
  // 賞の ほんすうは おなじ（80まい）。id は kj_m<みせ>_。どの 賞も ひとりの くじ より おおきい・いごこちが よい・もちものは つよい・クーポンは 3まい・シールは 6まい。絵は js/kuji-deluxe-art.js。
  // kind: plush（とくだい ぬいぐるみ）・chair（ベルベットの いす）・zabuton（きんらんの ざぶとん）・teacup（ティーカップ）・frame（がくぶち スタンド）・maneki（ふくまねき。この 3つは フィギュア だい）・
  //   brocade（きんらんの ラグ）・bag（もちもの: ポシェット・がまぐち）・coupon（uses まい つづり）・sheet（シール 6まい）
  const DELUXE = [
    {
      id: "lawson", key: "mlaw", shop: "ローリソン", title: "ローリソンの ロイヤル パーティー", color: "#2E4A8C", light: "#F6ECCB", dark: "#B8862B",
      cats: { A: "とくだい ぬいぐるみ", B: "とくだい ぬいぐるみ", C: "とくだい ぬいぐるみ", D: "ベルベット チェア", E: "ゴールド ティーカップ", F: "ロイヤル ポシェット", G: "がくぶち スタンド", H: "ゴールド クーポン", I: "ゴールド シール" },
      items: {
        A: [["a", "おうかん ごじ とくだい ぬいぐるみ", "きんの おうかんと あかい マントの ごじ。きんいろの からあげを だいて ベルベットの だいに すわる。", { kind: "plush", who: "goji", w: 132, d: 96, h: 150, comfort: 22 }]],
        B: [["b", "タキシード わんこ とくだい ぬいぐるみ", "シルクハットと タキシードの わんこ。きんぱくの おにぎりを そっと もって いる。", { kind: "plush", who: "wanko", w: 124, d: 92, h: 144, comfort: 21 }]],
        C: [["c", "ティアラ がちゃん とくだい ぬいぐるみ", "ティアラと しんじゅの がちゃん。クリスタルの グラスの プリン アラモードを もつ。", { kind: "plush", who: "gachan", w: 120, d: 90, h: 134, comfort: 20 }]],
        D: [
          ["d0", "ベルベット チェア わんこ", "きんの あしの ふかふかの ひとりがけ チェア。せもたれに わんこの ししゅう。", { kind: "chair", who: "wanko", w: 76, d: 66, h: 92, comfort: 10 }],
          ["d1", "ベルベット チェア がちゃん", "きんの あしの ふかふかの ひとりがけ チェア。せもたれに がちゃんの ししゅう。", { kind: "chair", who: "gachan", w: 76, d: 66, h: 92, comfort: 10 }],
          ["d2", "ベルベット チェア ごじ", "きんの あしの ふかふかの ひとりがけ チェア。せもたれに ごじの ししゅう。", { kind: "chair", who: "goji", w: 76, d: 66, h: 92, comfort: 10 }],
        ],
        E: [
          ["e0", "ゴールド ティーカップ わんこ", "きんの ふちの ティーカップと ソーサー。わんこの かおの えつけ。", { kind: "teacup", who: "wanko", w: 46, d: 36, h: 34, comfort: 3 }],
          ["e1", "ゴールド ティーカップ がちゃん", "きんの ふちの ティーカップと ソーサー。がちゃんの かおの えつけ。", { kind: "teacup", who: "gachan", w: 46, d: 36, h: 34, comfort: 3 }],
          ["e2", "ゴールド ティーカップ ごじ", "きんの ふちの ティーカップと ソーサー。ごじの かおの えつけ。", { kind: "teacup", who: "goji", w: 46, d: 36, h: 34, comfort: 3 }],
        ],
        F: [
          ["f0", "ロイヤル ポシェット わんこ", "きんの かなぐの ベルベットの ポシェット。わんこの エンブレム つき。", { kind: "bag", who: "wanko", st: { def: 2 } }],
          ["f1", "ロイヤル ポシェット がちゃん", "きんの かなぐの ベルベットの ポシェット。がちゃんの エンブレム つき。", { kind: "bag", who: "gachan", st: { spd: 2 } }],
          ["f2", "ロイヤル ポシェット ごじ", "きんの かなぐの ベルベットの ポシェット。ごじの エンブレム つき。", { kind: "bag", who: "goji", st: { hp: 6 } }],
        ],
        G: [
          ["g0", "がくぶち スタンド わんこ", "きんの がくぶちに シルクハットの わんこ。フィギュア だいに かざれる。", { kind: "frame", who: "wanko", w: 46, d: 22, h: 62, comfort: 3 }],
          ["g1", "がくぶち スタンド がちゃん", "きんの がくぶちに ティアラの がちゃん。フィギュア だいに かざれる。", { kind: "frame", who: "gachan", w: 46, d: 22, h: 62, comfort: 3 }],
          ["g2", "がくぶち スタンド ごじ", "きんの がくぶちに おうかんの ごじ。フィギュア だいに かざれる。", { kind: "frame", who: "goji", w: 46, d: 22, h: 62, comfort: 3 }],
          ["g3", "がくぶち スタンド アオ", "きんの がくぶちに てんいん くまの アオ。フィギュア だいに かざれる。", { kind: "frame", who: "keeper", w: 46, d: 22, h: 62, comfort: 3 }],
        ],
        H: [
          ["h0", "からあげ むりょう けん 3まい", "ローリソンで からあげが 3こ むりょう。きんいろの 3まい つづり。", { kind: "coupon", item: "karaage", uses: 3 }],
          ["h1", "プリン むりょう けん 3まい", "ローリソンで プリンが 3こ むりょう。きんいろの 3まい つづり。", { kind: "coupon", item: "pudding", uses: 3 }],
          ["h2", "おにぎり むりょう けん 3まい", "ローリソンで おにぎりが 3こ むりょう。きんいろの 3まい つづり。", { kind: "coupon", item: "onigiri", uses: 3 }],
          ["h3", "なんでも むりょう けん 3まい", "ローリソンの しなものが どれでも 3こ むりょう。きんいろの 3まい つづり。", { kind: "coupon", item: null, uses: 3 }],
        ],
        I: [
          ["i0", "ロイヤル わんこの シール", "シルクハットの わんこ 2まいと おうかん・からあげ・ケーキの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmlaw_wanko", 2], ["stk_kjmlaw_crown", 2], ["stk_kjmlaw_karaage", 1], ["stk_kjmlaw_cake", 1]] }],
          ["i1", "ロイヤル がちゃんの シール", "ティアラの がちゃん 2まいと ケーキ・おうかん・からあげの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmlaw_gachan", 2], ["stk_kjmlaw_cake", 2], ["stk_kjmlaw_crown", 1], ["stk_kjmlaw_karaage", 1]] }],
          ["i2", "ロイヤル ごじの シール", "おうかんの ごじ 2まいと からあげ・ケーキ・おうかんの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmlaw_goji", 2], ["stk_kjmlaw_karaage", 2], ["stk_kjmlaw_cake", 1], ["stk_kjmlaw_crown", 1]] }],
        ],
      },
      last: ["l", "ロイヤル ソファ 3にん ぬいぐるみ", "ラストワンしょう。きんの ソファに おめかしの 3にんが ならぶ とくだいの ぬいぐるみ。", { kind: "plush", who: "trio", w: 170, d: 98, h: 134, comfort: 28 }],
      stickers: [["stk_kjmlaw_wanko", "ハット わんこ"], ["stk_kjmlaw_gachan", "ティアラ がちゃん"], ["stk_kjmlaw_goji", "おうかん ごじ"], ["stk_kjmlaw_crown", "おうかん"], ["stk_kjmlaw_karaage", "きんの からあげ"], ["stk_kjmlaw_cake", "ロイヤル ケーキ"]],
    },
    {
      id: "sevenbun", key: "msev", shop: "せぶんぶん", title: "せぶんぶんの ごうか おしょうがつ", color: "#C8323A", light: "#FFF0D2", dark: "#B8862B",
      cats: { A: "とくだい ぬいぐるみ", B: "とくだい ぬいぐるみ", C: "とくだい ぬいぐるみ", D: "きんらん ざぶとん", E: "きんらん ラグ", F: "がまぐち ポーチ", G: "ふくまねき", H: "ぽちぶくろ クーポン", I: "おしょうがつ シール" },
      items: {
        A: [["a", "だるま ごじ とくだい ぬいぐるみ", "あかい だるまの ずきんの ごじ。きんの こばんを だいじに かかえて いる。", { kind: "plush", who: "goji", w: 130, d: 98, h: 146, comfort: 22 }]],
        B: [["b", "はれぎ わんこ とくだい ぬいぐるみ", "きんの もようの はれぎの わんこ。はごいたを もって にっこり。", { kind: "plush", who: "wanko", w: 126, d: 92, h: 142, comfort: 21 }]],
        C: [["c", "おもち がちゃん とくだい ぬいぐるみ", "かがみもちの うえに ちょこんと のった がちゃん。きんの だいで ぽかぽか。", { kind: "plush", who: "gachan", w: 118, d: 92, h: 140, comfort: 20 }]],
        D: [
          ["d0", "きんらん ざぶとん わんこ", "きんいろの ふさが ついた あかい ざぶとん。まんなかに わんこの ししゅう。", { kind: "zabuton", who: "wanko", w: 80, d: 76, h: 40, comfort: 9 }],
          ["d1", "きんらん ざぶとん がちゃん", "きんいろの ふさが ついた あかい ざぶとん。まんなかに がちゃんの ししゅう。", { kind: "zabuton", who: "gachan", w: 80, d: 76, h: 40, comfort: 9 }],
          ["d2", "きんらん ざぶとん ごじ", "きんいろの ふさが ついた あかい ざぶとん。まんなかに ごじの ししゅう。", { kind: "zabuton", who: "goji", w: 80, d: 76, h: 40, comfort: 9 }],
        ],
        E: [
          ["e0", "きんらん ラグ わんこ", "あかと きんの きんらんの ラグ。まんなかに わんこの まるい もん。", { kind: "brocade", who: "wanko", w: 172, d: 118, h: 6, comfort: 6 }],
          ["e1", "きんらん ラグ がちゃん", "あかと きんの きんらんの ラグ。まんなかに がちゃんの まるい もん。", { kind: "brocade", who: "gachan", w: 172, d: 118, h: 6, comfort: 6 }],
          ["e2", "きんらん ラグ ごじ", "あかと きんの きんらんの ラグ。まんなかに ごじの まるい もん。", { kind: "brocade", who: "goji", w: 172, d: 118, h: 6, comfort: 6 }],
        ],
        F: [
          ["f0", "がまぐち ポーチ わんこ", "きんの くちがねの きんらんの がまぐち。わんこの ししゅう いり。", { kind: "bag", who: "wanko", st: { def: 2 } }],
          ["f1", "がまぐち ポーチ がちゃん", "きんの くちがねの きんらんの がまぐち。がちゃんの ししゅう いり。", { kind: "bag", who: "gachan", st: { spd: 2 } }],
          ["f2", "がまぐち ポーチ ごじ", "きんの くちがねの きんらんの がまぐち。ごじの ししゅう いり。", { kind: "bag", who: "goji", st: { hp: 6 } }],
        ],
        G: [
          ["g0", "ふくまねき わんこ", "すずの くびわで ねこの ての ポーズの ちいさな わんこ。きんの こばん つき。", { kind: "maneki", who: "wanko", w: 48, d: 36, h: 58, comfort: 4 }],
          ["g1", "ふくまねき がちゃん", "すずの くびわで ねこの ての ポーズの ちいさな がちゃん。きんの こばん つき。", { kind: "maneki", who: "gachan", w: 48, d: 36, h: 58, comfort: 4 }],
          ["g2", "ふくまねき ごじ", "すずの くびわで ねこの ての ポーズの ちいさな ごじ。きんの こばん つき。", { kind: "maneki", who: "goji", w: 48, d: 36, h: 58, comfort: 4 }],
          ["g3", "ふくまねき ナナ", "てを あげた てんいん きつねの ナナ。きんの こばんと ざぶとん つき。", { kind: "maneki", who: "keeper", w: 48, d: 36, h: 58, comfort: 4 }],
        ],
        H: [
          ["h0", "おでん むりょう けん 3まい", "せぶんぶんで おでんが 3こ むりょう。ぽちぶくろに 3まい いり。", { kind: "coupon", item: "oden", uses: 3 }],
          ["h1", "メロンパン むりょう けん 3まい", "せぶんぶんで メロンパンが 3こ むりょう。ぽちぶくろに 3まい いり。", { kind: "coupon", item: "bread", uses: 3 }],
          ["h2", "ココア むりょう けん 3まい", "せぶんぶんで ココアが 3ばい むりょう。ぽちぶくろに 3まい いり。", { kind: "coupon", item: "cocoa", uses: 3 }],
          ["h3", "なんでも むりょう けん 3まい", "せぶんぶんの しなものが どれでも 3こ むりょう。ぽちぶくろに 3まい いり。", { kind: "coupon", item: null, uses: 3 }],
        ],
        I: [
          ["i0", "はれぎ わんこの シール", "はれぎの わんこ 2まいと かがみもち・たい・こばんの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmsev_wanko", 2], ["stk_kjmsev_kagami", 2], ["stk_kjmsev_tai", 1], ["stk_kjmsev_koban", 1]] }],
          ["i1", "おもち がちゃんの シール", "おもちの がちゃん 2まいと たい・かがみもち・こばんの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmsev_gachan", 2], ["stk_kjmsev_tai", 2], ["stk_kjmsev_kagami", 1], ["stk_kjmsev_koban", 1]] }],
          ["i2", "だるま ごじの シール", "だるまの ごじ 2まいと こばん・かがみもち・たいの シール 6まい。", { kind: "sheet", stickers: [["stk_kjmsev_goji", 2], ["stk_kjmsev_koban", 2], ["stk_kjmsev_kagami", 1], ["stk_kjmsev_tai", 1]] }],
        ],
      },
      last: ["l", "おせち じゅうばこ 3にん ぬいぐるみ", "ラストワンしょう。きんの もんの じゅうばこから 3にんが かおを だす とくだいの ぬいぐるみ。", { kind: "plush", who: "trio", w: 168, d: 100, h: 136, comfort: 28 }],
      stickers: [["stk_kjmsev_wanko", "はれぎ わんこ"], ["stk_kjmsev_gachan", "おもち がちゃん"], ["stk_kjmsev_goji", "だるま ごじ"], ["stk_kjmsev_kagami", "かがみもち"], ["stk_kjmsev_tai", "めでたい たい"], ["stk_kjmsev_koban", "こばん"]],
    },
  ];
  const STORES = SERIES.map((S) => S.id);
  // ---- いれかわる けいひん（UI-112。js/kuji-rotation.js）: みせごとに セットが ならぶ（はじめは まえからの SERIES）。2しゅうかん ごとに つぎの セット ----
  const ROTA = typeof KUJI_ROTATION !== "undefined" ? KUJI_ROTATION : [];
  for (const S of SERIES) S.base = true;
  const THEMES = Object.fromEntries(STORES.map((s) => [s, [SERIES.find((S) => S.id === s), ...ROTA.filter((S) => S.id === s)]]));
  const THEME_BY = Object.fromEntries([...SERIES, ...ROTA].map((S) => [S.key, S]));
  const PERIOD = 14, EPOCH = "2026-10-05"; // げつようびから 2しゅうかん。2026-10-05〜18 は あたらしい セット（2ばんめ）から
  // BY[みせ]: いまの ロットの セット（ロットが まだ ない・セーブが ない ときは まえからの セット）
  const BY = {};
  for (const s of STORES) Object.defineProperty(BY, s, { enumerable: true, get: () => (typeof Save !== "undefined" && Save.d ? THEME_BY[lot(s).th] || THEMES[s][0] : THEMES[s][0]) });
  const NET_BY = Object.fromEntries(DELUXE.map((S) => [S.id, S]));

  // ---- けいひんの いちらん（id: kj_<みせ>_<しっぽ>・みんなの くじは kj_m<みせ>_<しっぽ>）----
  const ITEMS = [], INDEX = {};
  const FIG_KINDS = ["mug", "acsta", "chibi", "teacup", "frame", "maneki"]; // フィギュア だいに かざれる
  const add = (S, grade, [tail, name, desc, o], k = 0, net = false) => {
    const it = { id: `kj_${S.key}_${tail}`, store: S.id, theme: S.key, grade, k, name, desc, ...o, net };
    it.fig = FIG_KINDS.includes(it.kind);
    it.furn = !["bag", "coupon", "sheet"].includes(it.kind);
    ITEMS.push(it); INDEX[it.id] = it; return it;
  };
  const build = (S, net) => {
    S.ids = {}; S.plan = {};
    for (const g of GRADES) {
      S.ids[g] = S.items[g].map((row, k) => add(S, g, row, k, net).id);
      S.ids[g].forEach((id, k) => (S.plan[id] = PLAN[g][k]));
    }
    S.lastId = add(S, "L", S.last, 0, net).id;
    if (S.dc) S.dcId = add(S, "DC", S.dc).id; // ダブルチャンスしょうは ひとりの くじ だけ（はんけんは どちらの くじでも おなじ）
    S.lineup = [...GRADES.flatMap((g) => S.ids[g]), S.lastId]; // コンプリートに いる もの（ダブルチャンスしょうは べつ）
    S.total = Object.values(S.plan).reduce((a, b) => a + b, 0);
    S.net = net;
  };
  for (const S of SERIES) build(S, false);
  for (const S of ROTA) build(S, false);
  for (const S of DELUXE) { build(S, true); S.dcId = THEMES[S.id][0].dcId; }
  const seriesOf = (it) => (it.net ? NET_BY[it.store] : THEME_BY[it.theme]);
  // Save.d.kuji.done の キー（みんなの くじは net_<みせ>・いれかわる セットは その key）
  const doneKey = (S) => (S.net ? "net_" + S.id : S.base ? S.id : S.key);
  // いまの きかんの セット（EPOCH から 2しゅうかん ごと）と その きかんの さいごの 日
  const periodNo = (day) => Math.floor((dayNo(day) - dayNo(EPOCH)) / PERIOD) + 1;
  const FIX = {}; // PokaDebug.kujiTheme で きめた セット（テスト用・よみこみなおす まで）
  // themeOf: こよみ だけで きまる セット（くじの がめんの「つぎは」）・themeNow: テストで きめた セットが あれば それ
  const themeOf = (s, day = U.today()) => { const L = THEMES[s], p = periodNo(day); return L[((p % L.length) + L.length) % L.length]; };
  const themeNow = (s, day = U.today()) => { if (FIX[s] && THEME_BY[FIX[s]]) return THEME_BY[FIX[s]]; const L = THEMES[s], p = periodNo(day); return L[((p % L.length) + L.length) % L.length]; };
  const themeUntil = (day = U.today()) => { const end = dayNo(EPOCH) + (periodNo(day) - 1) * PERIOD + PERIOD - 1, d = new Date(end * 864e5); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
  const gradeLabel = (g) => (g === "L" ? "ラストワンしょう" : g === "DC" ? "ダブルチャンスしょう" : `${g}しょう`);

  // ---- セーブ ----
  // Save.d.kuji: lots { みせ: ロット }・got { けいひん: もらった かず }・draws ひいた まい数・spent つかった コイン・coupons { クーポン: まい数 }・used クーポンを つかった かず・
  //   stubs { みせ: はんけん }・dc { みせ: { n: おうぼ した まい数, day: おうぼ した 日 } }・dcLast { みせ: { day, n, win, seen } }・done { みせ: コンプリートした 日・net_みせ: みんなの くじの けいひんを そろえた 日 }・
  //   pending [[みせ, 賞, ロット], …]（ひいたけど まだ えらんで いない D〜Fしょう）
  // ロット: no ばんごう・left { けいひん: のこり }・hold { 賞: えらんで いない まい数 }・seen ほかの おきゃくさんを すすめた 日・others／mine ひいた まい数・
  //   log [[賞, 1=じぶん／0=ほかの おきゃくさん], …]（はりつけ ひょう）・sold うりきれた 日・news { day, n }（きょう しった ほかの おきゃくさんの まい数）
  const int = (v, a, b) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.floor(+v))) : a);
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const dayStr = (v) => (typeof v === "string" && /^\d{4}-\d{1,2}-\d{1,2}$/.test(v) ? v : null);
  // th: ロットの セット（key）。ふるい セーブの ロットは まえからの セット
  const freshLot = (s, no, th = themeNow(s).key) => { const S = THEME_BY[th] && THEME_BY[th].id === s ? THEME_BY[th] : THEMES[s][0]; return { th: S.key, no, left: { ...S.plan }, hold: {}, seen: U.today(), others: 0, mine: 0, log: [], sold: null, news: null }; };
  const cleanLot = (s, L) => {
    if (!L || typeof L !== "object") return freshLot(s, 1);
    const S = THEME_BY[L.th] && THEME_BY[L.th].id === s && !THEME_BY[L.th].net ? THEME_BY[L.th] : THEMES[s][0];
    const left = {}; for (const id of Object.keys(S.plan)) left[id] = int(obj(L.left)[id] ?? S.plan[id], 0, S.plan[id]);
    const hold = {}; for (const g of Object.keys(PICK)) { const n = int(obj(L.hold)[g], 0, 99); const room = S.ids[g].reduce((a, id) => a + left[id], 0); if (n) hold[g] = Math.min(n, room); }
    const log = (Array.isArray(L.log) ? L.log : []).filter((x) => Array.isArray(x) && GRADES.includes(x[0])).map((x) => [x[0], x[1] ? 1 : 0]).slice(0, LOG_MAX);
    return { th: S.key, no: int(L.no, 1, 99999) || 1, left, hold, seen: dayStr(L.seen) || U.today(), others: int(L.others, 0, LOG_MAX), mine: int(L.mine, 0, LOG_MAX), log, sold: dayStr(L.sold), news: L.news && dayStr(L.news.day) ? { day: L.news.day, n: int(L.news.n, 0, LOG_MAX) } : null, fresh: dayStr(L.fresh) };
  };
  const counts = (o, ok, max = 9999) => Object.fromEntries(Object.entries(obj(o)).filter(([id, n]) => ok(id) && int(n, 0, max) > 0).map(([id, n]) => [id, int(n, 0, max)]));
  // みんなの くじ（js/kuji-net.js・UI-100）: on 1 = つかう・since はじめて つかった とき・uid つかった ID・
  //   rec { "みせ_ロット_なんまいめ": 1 = 賞を もらった ＋ 2 = ラストワンしょうを もらった（0 は コインを はらって えらぶ まち など）}（あたらしい 400 まで）
  const NET_REC = /^(lawson|sevenbun)_\d{1,6}_\d{1,2}$/, NET_MAX = 400;
  const cleanNet = (v) => {
    const o = obj(v), rec = Object.entries(obj(o.rec)).filter(([k, x]) => NET_REC.test(k) && Number.isInteger(x) && x >= 0 && x <= 3).slice(-NET_MAX);
    return { on: o.on === 1 ? 1 : 0, since: Number.isFinite(o.since) && o.since > 0 ? Math.floor(o.since) : 0, uid: typeof o.uid === "string" && /^[\w-]{0,128}$/.test(o.uid) ? o.uid : "", rec: Object.fromEntries(rec) };
  };
  const clean = (d) => {
    d = obj(d);
    const lots = {}; for (const s of STORES) if (d.lots && d.lots[s]) lots[s] = cleanLot(s, d.lots[s]);
    const pending = (Array.isArray(d.pending) ? d.pending : []).filter((p) => Array.isArray(p) && THEMES[p[0]] && PICK[p[1]]).map((p) => [p[0], p[1], int(p[2], 1, 99999)]);
    // えらんで いない かずと あわせる（ロットが ちがう・おおすぎる ものは すてる）
    const keep = []; for (const s of STORES) for (const g of Object.keys(PICK)) { const L = lots[s], n = L ? L.hold[g] || 0 : 0; keep.push(...pending.filter((p) => p[0] === s && p[1] === g && L && p[2] === L.no).slice(0, n)); if (L) { const m = keep.filter((p) => p[0] === s && p[1] === g).length; if (m) L.hold[g] = m; else delete L.hold[g]; } }
    const dc = {}; for (const s of STORES) { const e = obj(d.dc)[s]; if (e && dayStr(e.day) && int(e.n, 0, 9999) > 0) dc[s] = { n: int(e.n, 0, 9999), day: e.day }; }
    const dcLast = {}; for (const s of STORES) { const e = obj(d.dcLast)[s]; if (e && dayStr(e.day)) dcLast[s] = { day: e.day, n: int(e.n, 0, 9999), win: !!e.win, seen: !!e.seen }; }
    const done = {}; for (const k of [...Object.values(THEME_BY).map(doneKey), ...STORES.map((s) => "net_" + s)]) if (dayStr(obj(d.done)[k])) done[k] = d.done[k];
    return {
      lots, got: counts(d.got, (id) => !!INDEX[id], 99999), draws: int(d.draws, 0, 1e7), spent: int(d.spent, 0, 1e10),
      coupons: counts(d.coupons, (id) => INDEX[id] && INDEX[id].kind === "coupon", 999), used: int(d.used, 0, 1e7),
      stubs: counts(d.stubs, (s) => !!THEMES[s], 99999), dc, dcLast, done, pending: keep, net: cleanNet(d.net),
    };
  };
  const okSet = new WeakSet();
  const st = () => {
    let d = Save.d.kuji;
    if (!d || typeof d !== "object" || !okSet.has(d)) { d = Save.d.kuji = clean(d); okSet.add(d); }
    return d;
  };
  const got = (id) => st().got[id] || 0;

  // ---- ひにち ----
  const dayNo = (str) => { const m = dayStr(str) && str.split("-").map(Number); return m ? Math.round(Date.UTC(m[0], m[1] - 1, m[2]) / 864e5) : 0; };
  // たね つきの でたらめ（ほかの おきゃくさん。おなじ 日・おなじ ロットなら おなじ）
  const seeded = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (...xs) => { let h = 2166136261; for (const ch of xs.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---- ロット ----
  const lot = (s) => { const d = st(); if (!d.lots[s]) d.lots[s] = freshLot(s, 1); return d.lots[s]; };
  // のこりの くじ（まだ ひいて いない まい数）: 賞 → まい数（えらんで いない ぶんは のぞく）
  const tickets = (s) => { const S = BY[s], L = lot(s), out = {}; for (const g of GRADES) out[g] = Math.max(0, S.ids[g].reduce((a, id) => a + (L.left[id] || 0), 0) - (L.hold[g] || 0)); return out; };
  const total = (s) => Object.values(tickets(s)).reduce((a, b) => a + b, 0);
  const pendingOf = (s) => st().pending.filter((p) => p[0] === s);
  const API = {
    PRICE, KEEP, CATCHUP, OTHERS_MAX, DC_RATE, BAG_REFUND, GRADES, PLAN, PICK, GRADE_COL, SERIES, STORES, BY, ITEMS, INDEX, FIG_KINDS,
    DELUXE, NET_BY, seriesOf, // みんなの くじの けいひん（KujiNet・KujiUI の みんなの くじ）
    THEMES, THEME_BY, PERIOD, EPOCH, themeNow, themeOf, themeUntil, doneKey, // いれかわる けいひん（UI-112）
    next: null, // PokaDebug.kujiNext（つぎに ひく 賞）
    dcNext: null, // PokaDebug.kujiDc（つぎの ダブルチャンスの けっか true／false）
    rand: () => Math.random(),
    st, clean, cleanNet, got, lot, tickets, total, dayNo, gradeLabel, pendingOf, hash, seeded, NET_MAX,
    isPick: (g) => !!PICK[g],
    has: (s) => !!THEMES[s],
    // ひいた 賞の くじ 1まい（by: "me" じぶん・"other" ほかの おきゃくさん）。D〜Fしょうを じぶんが ひいた ときは あとで えらぶ（hold）
    drawOne(s, by, rnd = this.rand) {
      const S = BY[s], L = lot(s), T = tickets(s), n = Object.values(T).reduce((a, b) => a + b, 0);
      if (!n) return null;
      let g = null;
      if (by === "me" && this.next && T[this.next] > 0) g = this.next;
      else { let r = rnd() * n; for (const x of GRADES) { if (T[x] <= 0) continue; g = x; if ((r -= T[x]) < 0) break; } }
      if (by === "me") this.next = null;
      L.log.push([g, by === "me" ? 1 : 0]); if (L.log.length > LOG_MAX) L.log.length = LOG_MAX;
      if (by === "me") L.mine++; else L.others++;
      if (by === "me" && PICK[g]) { L.hold[g] = (L.hold[g] || 0) + 1; st().pending.push([s, g, L.no]); return { g, id: null, pick: true }; }
      // ランダムの 賞（と ほかの おきゃくさん）: のこって いる しゅるいから（のこりの かずで おもみ）。えらんで いない ぶんは のこす
      const ids = S.ids[g].filter((id) => (L.left[id] || 0) > 0);
      let r = rnd() * ids.reduce((a, id) => a + L.left[id], 0), id = ids[ids.length - 1];
      for (const x of ids) { if ((r -= L.left[x]) < 0) { id = x; break; } }
      L.left[id]--;
      return { g, id, pick: false };
    },
    // じぶんが n まい ひく（1まい 1000コイン）。でた 賞を かえす。コインが たりない・のこりが ない ときは null
    draw(s, n = 1) {
      if (!THEMES[s]) return null;
      this.sync(s);
      const L = lot(s), left = total(s); n = Math.max(1, Math.min(Math.floor(n) || 1, left));
      if (!left || Save.d.coins < PRICE * n) return null;
      const cost = PRICE * n, out = [];
      this.pay(s, n);
      for (let i = 0; i < n; i++) {
        const t = this.drawOne(s, "me"); if (!t) break;
        t.no = L.log.length; // はりつけ ひょうの なんまいめ
        if (t.id) Object.assign(t, this.grant(t.id));
        if (total(s) === 0) { t.last = true; Object.assign(t, { lastPrize: this.grant(BY[s].lastId) }); L.sold = U.today(); }
        out.push(t);
      }
      Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
      return { store: s, tickets: out, price: cost, lot: L.no, left: total(s) };
    },
    // n まいぶん はらう（1まい 1000コイン・ひいた まい数・つかった コイン・はんけん。みんなの くじ〔js/kuji-net.js〕も おなじ）
    pay(s, n = 1) { const d = st(), cost = PRICE * n; Save.addCoins(-cost); d.draws += n; d.spent += cost; d.stubs[s] = (d.stubs[s] || 0) + n; },
    // えらんで いない D〜Fしょうを えらぶ（いちばん ふるい ものから）。id は その賞の しゅるいで、のこりが ある もの
    choose(s, id) {
      const it = INDEX[id], d = st(); if (!it || it.store !== s || !PICK[it.grade]) return null;
      const L = lot(s), i = d.pending.findIndex((p) => p[0] === s && p[1] === it.grade && p[2] === L.no);
      if (i < 0 || !((L.left[id] || 0) > 0)) return null;
      d.pending.splice(i, 1); L.left[id]--; L.hold[it.grade] = Math.max(0, (L.hold[it.grade] || 0) - 1); if (!L.hold[it.grade]) delete L.hold[it.grade];
      const r = this.grant(id); Save.write(); return { g: it.grade, id, ...r };
    },
    // えらべる しゅるい（のこりが ある もの）
    choices(s, g) { const S = BY[s], L = lot(s); return (S.ids[g] || []).filter((id) => (L.left[id] || 0) > 0); },
    // けいひんを もちものに いれる（家具・もちもの・クーポン・シール）。ことばを かえす
    grant(id) {
      const it = INDEX[id], d = st(); if (!it) return {};
      const first = !d.got[id]; d.got[id] = (d.got[id] || 0) + 1;
      let note = "", refund = 0, sheet = null;
      if (it.furn) Save.d.furn[id] = (Save.d.furn[id] || 0) + 1;
      else if (it.kind === "bag") { if (!WearStock.add(id, 1)) { refund = BAG_REFUND; Save.addCoins(BAG_REFUND); note = `もう ${WearStock.CAP}こ もって いる ので ${BAG_REFUND}コイン もどったよ`; } else note = "きがえの「もちもの」で もてるよ"; }
      else if (it.kind === "coupon") { const n = it.uses || 1; d.coupons[id] = Math.min(999, (d.coupons[id] || 0) + n); note = `${BY[it.store].shop}の かいもので ${n > 1 ? n + "かい " : ""}つかえるよ`; }
      else if (it.kind === "sheet") {
        // シール: なんまい・はじめての シール（10まい ひいた ときに がめんで まとめる）
        const g0 = StickerBook.st().got;
        sheet = { n: it.stickers.reduce((a, [, k]) => a + k, 0), fresh: it.stickers.map(([x]) => x).filter((x, i, l) => l.indexOf(x) === i && !(g0[x] > 0)) };
        note = StickerBook.give(it);
      }
      if (it.furn) note = it.fig ? "もようがえで おけるよ。フィギュア だいにも かざれるよ" : "おうちの「もようがえ」で おけるよ";
      // コンプリート: ひとりの くじ と みんなの くじ で べつべつ（ダブルチャンスしょうは ひとりの くじの ほうに いれない）
      const S = it.grade === "DC" ? null : seriesOf(it), done = !!S && !d.done[doneKey(S)] && S.lineup.every((x) => d.got[x] > 0);
      if (done) d.done[doneKey(S)] = U.today();
      return { item: it, first, note, refund, complete: done, sheet };
    },
    // net: みんなの くじの けいひん
    complete(s, net = false) { const S = (net ? NET_BY : BY)[s]; return !!S && S.lineup.every((id) => got(id) > 0); },
    gotCount(s, net = false) { const S = (net ? NET_BY : BY)[s]; return S ? S.lineup.filter((id) => got(id) > 0).length : 0; },
    // ひにちを すすめる: うりきれた つぎの 日に あたらしい ロット・ほかの おきゃくさん（さいごに みた 日から さいだい 7にちぶん）・ダブルチャンスの けっか
    sync(s) {
      if (!THEMES[s]) return null;
      const d = st(), today = U.today(), d1 = dayNo(today);
      let L = lot(s);
      if (L.sold && dayNo(L.sold) < d1 && total(s) === 0 && !pendingOf(s).length) { d.lots[s] = L = freshLot(s, L.no + 1); }
      // いれかわり（UI-112）: きかんの セットと ちがう ロットは、えらんで いない D〜Fしょうが なければ あたらしい セットの ロットに（ひいた けいひんは のこる）
      const want = themeNow(s).key;
      if (L.th !== want && !pendingOf(s).length) { d.lots[s] = L = freshLot(s, L.no + 1, want); L.fresh = today; }
      const d0 = dayNo(L.seen);
      if (d1 > d0) {
        let n = 0;
        for (let day = Math.max(d0 + 1, d1 - CATCHUP + 1); day <= d1; day++) {
          const rnd = seeded(hash(s, L.no, day)), k = Math.floor(rnd() * (OTHERS_MAX + 1));
          for (let j = 0; j < k && total(s) > KEEP; j++) if (this.drawOne(s, "other", rnd)) n++;
        }
        L.seen = today; L.news = { day: today, n };
      }
      // ダブルチャンス: まえの 日の おうぼを ちゅうせん（1まいごとに 2%・あたりは 1こ）
      const e = d.dc[s];
      if (e && dayNo(e.day) < d1) {
        let win = this.dcNext != null ? !!this.dcNext : false; this.dcNext = null;
        if (!win) for (let i = 0; i < e.n && !win; i++) win = this.rand() < DC_RATE;
        if (win) this.grant(BY[s].dcId);
        d.dcLast[s] = { day: today, n: e.n, win, seen: false }; delete d.dc[s];
      }
      return L;
    },
    // ダブルチャンスに おうぼ（はんけんを ぜんぶ）。けっかは つぎの 日
    enter(s) {
      if (!THEMES[s]) return 0;
      this.sync(s);
      const d = st(), n = d.stubs[s] || 0; if (!n) return 0;
      const e = d.dc[s]; d.dc[s] = { n: (e ? e.n : 0) + n, day: U.today() }; delete d.stubs[s];
      Save.write(); return n;
    },
    // ---- クーポン（その コンビニの かいもので 1こ むりょう。みんなの くじの クーポンは 3まい つづり）----
    coupons(s) { const d = st(); return THEMES[s] ? [...THEMES[s].flatMap((T) => T.ids.H), ...NET_BY[s].ids.H].map((id) => ({ id, item: INDEX[id], n: d.coupons[id] || 0 })).filter((c) => c.n > 0) : []; },
    couponFor(s, it) {
      if (!THEMES[s] || !it) return null;
      const sold = BUY_SHOPS[s] && BUY_SHOPS[s].items ? BUY_SHOPS[s].items().some((x) => x && x.id === it.id) : false; // タブ（ごはん・おやつ・のみもの。js/conbini-goods.js）を まとめて
      if (!sold) return null;
      const list = this.coupons(s), c = list.find((x) => x.item.item === it.id) || list.find((x) => !x.item.item);
      if (!c) return null;
      return { id: c.id, n: c.n, name: c.item.name, label: `${c.item.name}で もらう（のこり ${c.n}まい）`, use: () => this.useCoupon(c.id, it.id) };
    },
    useCoupon(id, itemId) {
      const c = INDEX[id], d = st();
      if (!c || c.kind !== "coupon" || !(d.coupons[id] > 0) || !BAG_INDEX[itemId] || (c.item && c.item !== itemId)) return false;
      d.coupons[id]--; if (!d.coupons[id]) delete d.coupons[id]; d.used++;
      Save.addBag(itemId, 1); Save.write(); return true;
    },
    // どこで でるか（ずかんの ヒント）
    // いれかわる セット（UI-112）を いまの ロットに して、よみこみなおす まで その セットに きめる（PokaDebug.kujiTheme・テスト用。えらんで いない D〜Fしょうが ある ときは しない）
    setTheme(s, key) { const T = THEME_BY[key]; if (!THEMES[s] || !T || T.id !== s || pendingOf(s).length) return false; FIX[s] = key; const d = st(), L = lot(s); if (L.th === key) return true; d.lots[s] = freshLot(s, L.no + 1, key); d.lots[s].fresh = U.today(); return true; },
    source(id) { const it = INDEX[id]; if (!it) return ""; const S = THEMES[it.store][0], T = THEME_BY[it.theme]; return `ネリカスタウンの ${S.shop}の いちばんくじ${it.net ? "「みんなの くじ」" : T && !T.base ? "（2しゅうかん ごとに いれかわる「" + T.title.replace(S.shop + "の ", "") + "」）" : ""}（${gradeLabel(it.grade)}）で でるよ。`; },
  };

  // ---- ゲームに いれる ----
  // 家具（ビッグ ぬいぐるみ・クッション・マグ・ブランケット・アクリル スタンド・ちび ぬいぐるみ・タペストリー。みんなの くじの とくだい ぬいぐるみ・チェア・ざぶとん・ティーカップ・がくぶち・ふくまねき・きんらんの ラグ）
  const RUG = ["blanket", "brocade"];
  for (const it of ITEMS) {
    if (it.furn) {
      const kind = RUG.includes(it.kind) ? "rug" : it.kind === "tapestry" ? "wall" : "floor";
      const f = { id: it.id, name: it.name, price: 0, kind, w: it.w, h: it.h, ...(kind === "floor" ? { depth: it.d } : {}), comfort: it.comfort, rare: true, exclusive: "kuji", kujiPrize: it.store, desc: it.desc };
      if (it.fig) f.figure = true;
      if (RUG.includes(it.kind)) f.depth = it.d;
      FURNITURE.push(f); FURN_INDEX[it.id] = f;
      FURN_ART[it.id] = RUG.includes(it.kind) ? (opts = {}) => HomeDesign.model(it.id, opts).full : () => KujiArt.furn(it.id);
    } else if (it.kind === "bag") {
      const rota = !it.net && !THEME_BY[it.theme].base; // いれかわる セットの ポーチ・トート（js/kuji-rotation-art.js）
      const w = { id: it.id, name: it.name, slot: HandItems.SLOT, wear: it.net ? "kuji_dbag" : rota ? "kuji_rbag" : "kuji_bag", col: [rota ? it.theme : it.store, it.who], price: 0, rare: true, exclusive: "kuji", kujiPrize: it.store, st: it.st, desc: it.desc };
      WEAR_ITEMS.push(w); ITEM_INDEX[it.id] = w;
    }
  }
  WEAR.kuji_bag = (ctx) => KujiArt.bag(ctx);
  WEAR.kuji_dbag = (ctx) => KujiDeluxeArt.bag(ctx); // みんなの くじの ポシェット・がまぐち
  WEAR.kuji_rbag = (ctx) => KujiRotationArt.bag(ctx); // いれかわる セットの パジャマ ポーチ・フルーツ トート（UI-112）
  // シール（シールちょう）: コンビニごとに 6しゅ（みんなの くじは べつの 6しゅ）。I しょうの シートは StickerBook.give で てもとに
  for (const S of [...SERIES, ...ROTA]) StickerBook.addDesigns(S.stickers.map(([id, name]) => ({ id, name, series: S.id, hint: `まだ でて いない シールだよ。${S.shop}の いちばんくじ（Iしょう）で でるよ`, art: () => KujiArt.sticker(id) })));
  for (const S of DELUXE) StickerBook.addDesigns(S.stickers.map(([id, name]) => ({ id, name, series: S.id, hint: `まだ でて いない シールだよ。${S.shop}の いちばんくじ「みんなの くじ」（Iしょう）で でるよ`, art: () => KujiArt.sticker(id) })));
  // へやの 立体と さわる うごき（ビッグ ぬいぐるみ: ぎゅっ・クッション: ぽふっ・ブランケット: ラグの かたち。みんなの くじの チェア・ざぶとん・きんらんの ラグは js/kuji-deluxe-art.js）
  KujiArt.install(API);
  KujiDeluxeArt.install(API);
  // フィギュア だいに かざれる もの（マグ・アクリル スタンド・ちび ぬいぐるみ）。ずかんの ヒントは js/item-dex-sources.js が API.source を よぶ
  FigureStand.addFigures(ITEMS.filter((it) => it.fig).map((it) => it.id));

  // ---- コンビニの なか: レジの みぎの かべに くじの たな（3ます。絵は js/store-iso-props.js の kuji_*）・てんいんの「いちばんくじを ひく」・クーポン ----
  for (const S of SERIES) {
    const I = STORE_INTERIORS[S.id];
    if (I && !I.fixtures.some((f) => f[0] === "kuji_" + S.id)) I.fixtures.push(["kuji_" + S.id, 7, 0, 3, 1, "いちばんくじ"]);
    if (BUY_SHOPS[S.id]) BUY_SHOPS[S.id].coupon = (it) => API.couponFor(S.id, it);
  }
  API.isFixture = (f) => !!f && /^kuji_(lawson|sevenbun)$/.test(f.kind);
  // てんいんの はなしの えらぶ ことば（js/store-iso.js の StoreScene.talk）
  API.talkChoice = (sc) => (THEMES[sc.shopId] ? { label: "いちばんくじを ひく", run: () => KujiUI.open(sc.shopId, sc) } : null);
  // たなを タップ: たなの まえまで あるいて くじの ボード
  API.tapFixture = (sc, f) => {
    if (!API.isFixture(f) || !THEMES[sc.shopId]) return false;
    Sound.se("tap");
    const go = async () => { if (sc.closed || sc.interacting) return; sc.interacting = true; sc.party[0].dir = "up"; try { await KujiUI.open(sc.shopId, sc); } finally { sc.interacting = false; } };
    if (!sc.walkTo(8, 1, go)) go();
    return true;
  };
  return API;
})();
