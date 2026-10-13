// Meeときょれじゃ の 景品（ぬいぐるみ・マスコット・コイン）。台は js/crane-machines.js・あそぶ 画面は js/crane-scene.js。
// 3人の ぬいぐるみは Chara.svg（表情・ポーズ・こもの が ちがう 8しゅずつ）、町の人は Art.npcSvg から 絵を つくり、
// ぬのの タグ・つや を たす。家具として へやに おける（おうちの 立体は IkebukuroItemArt.model から ArcadePrizes.model）。
// 1F の 台の 多くは 日がわり（CraneMachines の pool）。けいひんの なかま（series）ごとに 台が きまって いる:
// 3人の ぬいぐるみ（3本アーム）・ミニマスコット（スウィートランド）・ビッグ ぬいぐるみ（2本アーム）・どうぶつえん（トライポッド）・みずべの なかま（リングフック）。
// コインの 景品（メダル・たからばこ）は もちものに ならず、その場で コインが ふえる（1にちの 上限 つき）。
const ArcadePrizes = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const heart = (x, y, s, c) => `<path d="M${x} ${y + s * 0.9} C${x - s * 1.3} ${y} ${x - s * 0.9} ${y - s * 0.9} ${x} ${y - s * 0.25} C${x + s * 0.9} ${y - s * 0.9} ${x + s * 1.3} ${y} ${x} ${y + s * 0.9}Z" fill="${c}"/>`;
  const NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
  const spName = (sp) => (NpcArt.SP[sp] ? NpcArt.SP[sp].name : sp);
  // 3人の ぬいぐるみ（8しゅずつ）: [ことば, 表情, ポーズ, こもの, 絵の はんい（viewBox x y w h）, 足もとの y]
  // はんいは まえ・うしろの 絵が ぜんぶ はいる 大きさ（0〜3 は getBBox + 6、4〜7 と わんこの 2 は 見える ピクセル + 4。getBBox は 見えない ぶひんも はいって ひろく なる）
  // 4〜7 は 日がわりで ふえた ぶん（UI-16。ほんものの プライズの「おでかけ」「コスチューム」の ような きせかえ ちがい）
  const HERO = {
    wanko: [
      ["にっこり", "smile", "idle_01", { head: "ribbon_pink" }, [5, 13, 190, 200], 207],
      ["びっくり", "surprise", "jump_01", { face: "blush" }, [10, -30, 180, 219], 183],
      ["すやすや", "sleep", "land_01", { body: "pajama" }, [-2, 26, 204, 188], 207], // 見える ピクセル（getBBox では ひろすぎて 絵が ちいさかった）
      ["ぷんぷん", "angry", "idle_02", { head: "hachimaki" }, [3, 25, 194, 188], 207],
      ["ぬくぬく", "normal", "idle_02", { head: "knit", neck: "muffler" }, [3, -5, 195, 219], 207],
      ["あめふり", "cry", "land_01", { body: "raincoat" }, [-2, 36, 204, 178], 207],
      ["むぎわら", "smile", "walk_01", { head: "strawhat", body: "overalls" }, [-7, 8, 189, 206], 207],
      ["かっこいい", "smile", "idle_01", { face: "sunglasses", neck: "scarf_red" }, [6, 18, 189, 196], 207],
    ],
    gachan: [
      ["きらきら", "sparkle", "jump_01", { head: "crown" }, [41, -21, 118, 210], 183],
      ["にっこり", "smile", "idle_01", { head: "flowercrown" }, [39, 35, 122, 178], 207],
      ["えーん", "cry", "land_01", { neck: "bib" }, [34, 53, 132, 161], 208],
      ["すやすや", "sleep", "idle_02", { head: "knit" }, [37, 13, 145, 200], 207],
      ["おしゃれ", "normal", "walk_01", { head: "beret", neck: "bowtie_blue" }, [29, 18, 123, 196], 207],
      ["わっしょい", "angry", "idle_02", { head: "hachimaki", body: "happi" }, [37, 43, 145, 171], 207],
      ["ようせい", "sparkle", "jump_01", { head: "ribbon_blue", back: "fairywings" }, [25, 6, 150, 184], 183],
      ["るんるん", "smile", "walk_02", { face: "heartglasses" }, [48, 37, 123, 177], 207],
    ],
    goji: [
      ["らぶらぶ", "love", "idle_01", { neck: "bowtie_red" }, [1, 18, 200, 199], 211],
      ["がおー", "shout", "jump_01", { back: "cape" }, [-2, -37, 207, 231], 188],
      ["のんびり", "calm", "land_01", { head: "strawhat" }, [-6, 29, 214, 188], 211],
      ["びっくり", "surprise", "idle_02", { head: "partyhat" }, [-2, -19, 205, 237], 212],
      ["おひげ", "normal", "idle_01", { head: "tophat", face: "mustache" }, [2, -13, 199, 231], 211],
      ["さむがり", "cry", "land_01", { head: "knit", neck: "scarf_green" }, [-5, 13, 213, 205], 211],
      ["たんけん", "shout", "walk_02", { head: "helmet", back: "backpack" }, [10, -4, 196, 222], 211],
      ["てんし", "love", "jump_01", { back: "wings" }, [-10, -12, 225, 206], 187],
    ],
  };
  // きせつの ぬいぐるみ（UI-63。オーナーの FB 2026-10-03「ときょれじゃの景品やガチャガチャの中身は、定期的に変わるようにしろ」）。
  // HERO の 8〜11 ばん（[ことば, 表情, ポーズ, こもの, はんい, 足もと, つき]）。その きせつの あいだ 3人の ぬいぐるみの 台の めだまに なる（js/crane-machines.js の lineup）。
  // 日がわりの ふつうの ならび（heroPool）には はいらない。
  // ぬいぐるみ だけの ぼうし（サンタ・まじょ。ITEM_INDEX だけ・おみせ・きがえには でない）。かたちは chara.js と おなじ hatWrap（つばの まんなかが 0,0・あたまの はば 100）
  WEAR.season_santahat = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#E8434F", b = ctx.col[1] || "#FFFFFF";
      return `<path d="M-48,0 C-46,-40 -12,-64 22,-58 C42,-54 58,-40 64,-22 C54,-28 42,-30 34,-24 C30,-14 32,-6 36,0 Z" fill="${c}" ${stroke(s)}/>`
        + `<path d="M-22,-42 q10 -8 24 -10" fill="none" stroke="#FFFFFF" stroke-width="${f2(s * 1.2)}" stroke-linecap="round" opacity="0.45"/>`
        + `<rect x="-54" y="-12" width="108" height="20" rx="10" fill="${b}" ${stroke(s)}/><circle cx="66" cy="-18" r="12" fill="${b}" ${stroke(s)}/>`;
    }),
  });
  WEAR.season_witchhat = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#6B4FA0", band = ctx.col[1] || "#F7A84E";
      return `<ellipse cx="0" cy="0" rx="74" ry="13" fill="${c}" ${stroke(s)}/>`
        + `<path d="M-36,-2 C-30,-30 -14,-58 4,-84 C10,-92 22,-96 30,-90 C20,-86 16,-76 18,-62 C22,-40 30,-20 36,-2 Z" fill="${c}" ${stroke(s)}/>`
        + `<path d="M-35,-11 C-12,-7 14,-7 35,-11 L36,-2 C14,2 -14,2 -36,-2 Z" fill="${band}" ${stroke(s)}/>`
        + `<path d="M0,-40 l3.6,7.2 8,1.2 -5.8,5.6 1.4,8 -7.2,-3.8 -7.2,3.8 1.4,-8 -5.8,-5.6 8,-1.2 Z" fill="#FFE07A" ${stroke(s * 0.6)}/>`;
    }),
  });
  for (const [id, name, wear, col] of [["season_santahat", "サンタの ぼうし", "season_santahat", ["#E8434F", "#FFFFFF"]], ["season_witchhat", "まじょの ぼうし", "season_witchhat", ["#6B4FA0", "#F7A84E"]]])
    if (!ITEM_INDEX[id]) ITEM_INDEX[id] = { id, name, slot: "head", wear, col, price: 0, plushOnly: true };
  const SEASONS = [["はる", [3, 4, 5]], ["なつ", [6, 7, 8]], ["あき", [9, 10, 11]], ["ふゆ", [12, 1, 2]]];
  const SEASON_HERO = {
    wanko: [
      ["おはなみ", "smile", "idle_01", { head: "sakura_wreath" }, [5, 12, 190, 202], 207],
      ["ゆかた", "smile", "walk_01", { body: "mee_yukata" }, [-7, 17, 189, 197], 207],
      ["ハロウィン", "smile", "idle_01", { head: "season_witchhat", back: "cape" }, [5, -48, 190, 262], 207],
      ["サンタ", "smile", "idle_01", { head: "season_santahat", neck: "muffler" }, [5, -17, 190, 231], 207],
    ],
    gachan: [
      ["さくら", "sparkle", "jump_01", { head: "sakura_wreath" }, [41, 2, 118, 188], 183],
      ["ゆかた", "smile", "walk_02", { body: "mee_yukata" }, [48, 37, 123, 177], 207],
      ["こうもり", "sparkle", "jump_01", { back: "batwings" }, [9, 8, 182, 182], 183],
      ["ゆきあかり", "smile", "idle_02", { head: "snow_knit", neck: "muffler" }, [37, 13, 126, 201], 207],
    ],
    goji: [
      ["はるかぜ", "love", "idle_01", { head: "sakura_wreath", neck: "scarf_green" }, [2, 14, 199, 204], 211],
      ["なつまつり", "shout", "idle_02", { head: "hachimaki", body: "star_happi" }, [-1, 2, 205, 216], 212],
      ["もみじ", "calm", "idle_01", { neck: "maple_scarf" }, [2, 21, 199, 197], 211],
      ["サンタ", "love", "jump_01", { head: "season_santahat", neck: "scarf_red" }, [6, -42, 190, 236], 187],
    ],
  };
  for (const who of Object.keys(HERO)) SEASON_HERO[who].forEach((e, i) => HERO[who].push([...e, SEASONS[i][1]]));
  // ふえた ふつうの ぬいぐるみ（UI-124。オーナーの 指示 2026-10-13「ゲームセンターの景品の種類を追加してほしい。単純に種類を増やしつつ…」）。HERO の 12〜15 ばん（日がわりの なかまに はいる）
  const MORE_HERO = {
    wanko: [
      ["パティシエ", "smile", "idle_01", { head: "chefhat", body: "apron" }, [5, -31, 189, 244]],
      ["ねこみみ", "love", "idle_02", { head: "catears", neck: "bell" }, [2, 5, 195, 208]],
      ["マリン", "smile", "walk_01", { head: "beret", body: "marine_stripe" }, [-7, -1, 189, 215]],
      ["ねむねむ", "sleep", "land_01", { head: "moon_hat", body: "night_pajama" }, [-2, -9, 204, 223]],
    ],
    gachan: [
      ["はなかざり", "smile", "idle_01", { head: "sakura_wreath", body: "mint_dress" }, [38, 30, 123, 183]],
      ["うさぎさん", "love", "idle_02", { head: "bunnyhood" }, [37, 17, 126, 197]],
      ["コックさん", "smile", "walk_01", { head: "chefhat", body: "lavender_apron" }, [29, -10, 123, 223]],
      ["おめかし", "normal", "idle_01", { head: "pearl_bow", neck: "necklace" }, [38, 33, 124, 180]],
    ],
    goji: [
      ["こぐま", "love", "idle_01", { body: "ike_animal_1" }, [2, 17, 199, 200]],
      ["おまつり", "shout", "idle_02", { head: "hachimaki", body: "festival_happi" }, [-1, 2, 205, 215]],
      ["ほしぞら", "calm", "land_01", { head: "moon_hat", back: "night_cape" }, [-15, -3, 234, 220]],
      ["おしゃれ", "normal", "walk_02", { head: "beret", neck: "purple_bow" }, [9, 2, 197, 215]],
    ],
  };
  for (const who of Object.keys(HERO)) for (const e of MORE_HERO[who]) HERO[who].push(e);
  // レアの ぬいぐるみ（UI-124）: いろちがい（ひやけ・ピンク・にじいろ。からだの いろだけ かえる）と、まえの いちばんくじの ビッグ／とくだい ぬいぐるみ（A〜Cしょう）。
  // ふだんの 日がわりの なかまには はいらない。3人の ぬいぐるみの 台に ときどき（rareShape）1しゅ まざる
  const TINT = {
    tan: { word: "ひやけ", name: (n) => `ひやけ ${n}`, col: { wanko: "#E7C29A", gachan: "#E6AE4C", goji: "#6E6157" } },
    pink: { word: "ピンク", name: (n) => `ピンクの ${n}`, col: { wanko: "#FFD1E0", gachan: "#FFBCD3", goji: "#E7A3BC" } },
    rainbow: { word: "にじいろ", name: (n) => `にじいろ ${n}`, col: null },
  };
  const RAINBOW = ["#F7A1A1", "#FBC98A", "#FFE88A", "#A9DE96", "#94CBEF", "#C2A6EC"];
  const TINT_CROP = { wanko: [5, 17, 189, 196], gachan: [38, 36, 123, 177], goji: [2, 17, 199, 200] };
  // いちばんくじの ぬいぐるみ: [家具の id, だれ, 絵の はば, たかさ]（KujiArt.PLUSH と おなじ。tools/check-arcade-rare.mjs が たしかめる）
  const KUJI_RARE = [
    ["kj_law_a", "goji", 120, 130], ["kj_law_b", "wanko", 120, 130], ["kj_law_c", "gachan", 120, 126], ["kj_sev_a", "wanko", 120, 128], ["kj_sev_b", "gachan", 124, 118], ["kj_sev_c", "goji", 120, 130],
    ["kj_law2_a", "goji", 120, 130], ["kj_law2_b", "wanko", 120, 130], ["kj_law2_c", "gachan", 120, 126], ["kj_sev2_a", "wanko", 120, 128], ["kj_sev2_b", "gachan", 120, 126], ["kj_sev2_c", "goji", 120, 130],
    ["kj_mlaw_a", "goji", 132, 150], ["kj_mlaw_b", "wanko", 124, 144], ["kj_mlaw_c", "gachan", 120, 134], ["kj_msev_a", "goji", 130, 146], ["kj_msev_b", "wanko", 126, 142], ["kj_msev_c", "gachan", 118, 140],
    ["kj_mlaw2_a", "goji", 132, 150], ["kj_mlaw2_b", "wanko", 124, 144], ["kj_mlaw2_c", "gachan", 120, 134], ["kj_msev2_a", "goji", 130, 146], ["kj_msev2_b", "wanko", 126, 142], ["kj_msev2_c", "gachan", 118, 140],
  ];
  const seasonOf = (months) => SEASONS.find(([, m]) => m.join() === months.join()) || null;
  // ミニマスコット（スウィートランドの ちいさな 景品。あたまに キーホルダーの わ）。3人と 町の ちいさな どうぶつ 7しゅ（UI-16）
  const MINI = { wanko: [5, 1, 190, 212], gachan: [39, 21, 122, 192], goji: [1, 8, 200, 209] };
  const MINI_SP = [["hamster", [34, 26, 133, 189]], ["frog", [32, 26, 137, 189]], ["pig", [39, 22, 123, 193]], ["mouse", [20, 16, 161, 199]], ["squirrel", [40, 7, 132, 208]], ["hedgehog", [19, 11, 163, 204]], ["bird", [40, 11, 122, 204]]];
  // 町の人の ぬいぐるみ: [種, 絵の はんい, なかま]。なかまごとに 台と へやでの 大きさ・形の なまえ（crane-machines.js の SHAPES）が きまる。
  // さいしょの 1しゅ（くま・パンダ・ぺんぎん）は まえからの 景品（形の なまえも そのまま）
  const GROUP = {
    big: { series: "ビッグ ぬいぐるみ", size: [150, 150, 70], suffix: "の おおきな ぬいぐるみ", desc: (n) => `だきしめられる おおきさの ${n}の ぬいぐるみ。2ほんの アームで つかむ けいひん。`, shape: (sp) => (sp === "bear" ? "bearBig" : "big_" + sp), look: (sp) => sp + "-big" },
    zoo: { series: "どうぶつえん", size: [150, 150, 70], suffix: "の おおきな ぬいぐるみ", desc: (n) => `どうぶつえんの なかま、${n}の おおきな ぬいぐるみ。トライポッドの けいひん。`, shape: (sp) => (sp === "panda" ? "pandaBig" : "zoo_" + sp), look: (sp) => sp + "-big" },
    water: { series: "みずべの なかま", size: [96, 110, 50], suffix: "の ぬいぐるみ", desc: (n) => `みずべの なかま、${n}の ぬいぐるみ。あたまの リングを ひっかけて とる けいひん。`, shape: (sp) => (sp === "penguin" ? "penguinRing" : "water_" + sp), look: (sp) => (sp === "penguin" ? "penguin" : sp + "-ring") },
  };
  const FOLK = [
    ["bear", [33, 21, 134, 193], "big"], ["panda", [36, 22, 128, 192], "zoo"], ["penguin", [38, 26, 124, 188], "water"],
    // UI-16: ビッグ ぬいぐるみ 8しゅ・どうぶつえん 5しゅ・みずべの なかま 4しゅ（見える ピクセル + 4）
    ["cat", [39, 14, 123, 201], "big"], ["dog", [35, 25, 130, 190], "big"], ["rabbit", [40, -30, 121, 245], "big"], ["lion", [15, 5, 171, 210], "big"],
    ["sheep", [24, 11, 152, 204], "big"], ["fox", [40, 8, 129, 207], "big"], ["raccoon", [37, 25, 127, 190], "big"], ["tiger", [37, 23, 127, 192], "big"],
    ["koala", [16, 26, 169, 189], "zoo"], ["redpanda", [39, 20, 129, 195], "zoo"], ["elephant", [11, 28, 178, 187], "zoo"], ["hippo", [40, 24, 121, 191], "zoo"], ["monkey", [23, 28, 155, 187], "zoo"],
    ["duck", [40, 12, 121, 203], "water"], ["seal", [38, 26, 125, 189], "water"], ["otter", [40, 30, 132, 185], "water"], ["croc", [36, 33, 143, 182], "water"],
  ];
  // 景品の 一覧（家具）。spec: 絵の つくりかた・crop: viewBox・size: 'chibi' | 'mini' | 'big'
  // look: クレーンの テクスチャの なまえ・shape: クレーンの 形の なまえ・series と word: 台の せつめいで まとめて よぶ（「わんこの ぬいぐるみ 4しゅ（にっこり・…）」）
  const ITEMS = [];
  for (const [who, list] of Object.entries(HERO)) list.forEach(([word, face, pose, outfit, crop, feet, months], v) => { const se = months && seasonOf(months); ITEMS.push({
    id: `ike_chibi_${who}_${v}`, name: `${word} ${NAME[who]}の ぬいぐるみ`, spec: { who, face, pose, outfit }, crop, feet, size: "chibi", w: 76, h: 76, depth: 40,
    look: `chibi-${who}-${v}`, shape: `chibi_${who}_${v}`, series: `${NAME[who]}の ぬいぐるみ`, word,
    ...(se ? { season: months, seasonName: se[0] } : {}),
    desc: se ? `${se[0]}（${months[0]}〜${months[2]}がつ）だけの ${word}の ${NAME[who]}の ぬいぐるみ。Meeときょれじゃ の クレーンの けいひん。` : `${word} かおの ${NAME[who]}の ぬいぐるみ。Meeときょれじゃ の クレーンの けいひん。`,
  }); });
  // いろちがい（レア）: 3人 × 3しゅ
  for (const who of Object.keys(HERO)) for (const [tint, T] of Object.entries(TINT)) ITEMS.push({
    id: `ike_chibi_${who}_${tint}`, name: `${T.name(NAME[who])}の ぬいぐるみ`, spec: { who, face: who === "goji" ? "love" : "smile", pose: "idle_01", outfit: {}, tint }, crop: TINT_CROP[who], size: "chibi", w: 76, h: 76, depth: 40,
    look: `chibi-${who}-${tint}`, shape: `chibi_${who}_${tint}`, series: `${NAME[who]}の ぬいぐるみ`, word: T.word, rare: true,
    desc: `めったに でない レアの ${T.name(NAME[who])}の ぬいぐるみ。Meeときょれじゃ の クレーンで ときどき みつかる。`,
  });
  // まえの いちばんくじの ぬいぐるみ（レア）: とれると その くじの 家具（kj_…）が もらえる。この 景品じたいは 家具に しない（noFurn）
  for (const [kid, who, w, h] of KUJI_RARE) ITEMS.push({
    id: `ike_kuji_${kid}`, name: kid, spec: { who, kuji: kid }, crop: [0, 0, w, h], size: "kuji", w: 76, h: 76, depth: 40,
    look: `kuji-${kid.replace(/_/g, "-")}`, shape: `kuji_${kid}`, series: "いちばんくじの ぬいぐるみ", rare: true, noFurn: true, prize: kid,
  });
  // なまえ・せつめいは くじの 家具から（くじは この あとで よみこむ）
  for (const it of ITEMS) if (it.size === "kuji") for (const [k, get] of [["name", () => (FURN_INDEX[it.prize] ? FURN_INDEX[it.prize].name : "いちばんくじの ぬいぐるみ")], ["word", () => it.name], ["desc", () => `まえの いちばんくじの ${it.name}。Meeときょれじゃ の クレーンで ときどき みつかる レア。`]]) Object.defineProperty(it, k, { get, enumerable: true });
  const mini = (key, name, spec, crop) => ITEMS.push({
    id: `ike_mini_${key}`, name: `${name}の ミニマスコット`, spec: { ...spec, mini: true }, crop, size: "mini", w: 48, h: 52, depth: 28,
    look: `mini-${key}`, shape: `mini_${key}`, series: "ミニマスコット", word: name,
    desc: `てのひらに のる ${name}の マスコット。スウィートランドで すくえるよ。`,
  });
  for (const [who, crop] of Object.entries(MINI)) mini(who, NAME[who], { who, face: who === "goji" ? "love" : "smile", pose: "idle_01", outfit: {} }, crop);
  for (const [sp, crop] of MINI_SP) mini(sp, spName(sp), { sp, emo: "happy" }, crop);
  for (const [sp, crop, group] of FOLK) { const G = GROUP[group], n = spName(sp), [w, h, depth] = G.size; ITEMS.push({
    id: `ike_plush_${sp}`, name: n + G.suffix, spec: { sp, emo: "happy" }, crop, size: "big", w, h, depth,
    look: G.look(sp), shape: G.shape(sp), group, series: G.series, word: n, desc: G.desc(n),
  }); }
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  // けいひんの ならびを みじかく よぶ（おなじ なかまなら「わんこの ぬいぐるみ 4しゅ（にっこり・ぬくぬく・…）」・1しゅなら その なまえ・ちがう なかまは null）
  const group = (ids) => {
    const list = ids.map((id) => INDEX[id]);
    if (list.length < 2 || !list.every((it) => it && it.series && it.series === list[0].series)) return null;
    return `${list[0].series} ${list.length}しゅ（${list.map((it) => it.word).join("・")}）`;
  };

  // ---- 絵 ----
  // ぬのの タグ（ハート）・ふんわり つや・ミニは キーホルダーの わ
  const deco = (it, dir) => {
    const [x, y, w, h] = it.crop, back = dir === "up", s = w / 190;
    const tx = back ? x + w * 0.22 : x + w * 0.8, ty = y + h * 0.84;
    const tag = `<g transform="translate(${f1(tx)} ${f1(ty)}) rotate(${back ? -12 : 12}) scale(${f1(Math.max(0.8, s))})"><rect x="-10" y="-7" width="20" height="15" rx="2.5" fill="#FFFDF5" stroke="${K}" stroke-width="2.4"/>${heart(0, 0.8, 4.4, "#F09AB4")}<path d="M-6 5.2h12" stroke="#E9DCC4" stroke-width="1.4" stroke-linecap="round"/></g>`;
    const sheen = back ? "" : `<ellipse cx="${f1(x + w * 0.36)}" cy="${f1(y + h * 0.3)}" rx="${f1(w * 0.13)}" ry="${f1(h * 0.06)}" fill="#FFFFFF" opacity="0.28" transform="rotate(-24 ${f1(x + w * 0.36)} ${f1(y + h * 0.3)})"/>`;
    const ring = it.spec.mini ? `<circle cx="100" cy="${f1(y + 13)}" r="9" fill="none" stroke="${K}" stroke-width="6.6"/><circle cx="100" cy="${f1(y + 13)}" r="9" fill="none" stroke="#E8C66A" stroke-width="3.4"/><path d="M95 ${f1(y + 6)} q5 -3 10 0" fill="none" stroke="#FFF6D0" stroke-width="1.6" stroke-linecap="round"/>` : "";
    return sheen + tag + ring;
  };
  // 景品の 絵（svg もじれつ）。dir: 'down'（まえ）| 'up'（うしろ）
  const raw = (it, dir) => {
    const sp = it.spec;
    if (sp.sp) return Art.npcSvg({ sp: sp.sp, emo: sp.emo || "happy", dir });
    // いちばんくじの ぬいぐるみ: くじの 絵（KujiArt。まえも うしろも おなじ 絵）を 絵の はんいに いれる
    if (sp.kuji) return typeof KujiArt !== "undefined" ? KujiArt.plush(sp.kuji) : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${it.crop.join(" ")}"></svg>`; // 絵の はんいは くじの 絵と おなじ（0 0 はば たかさ）
    const s = Chara.svg(sp.who, { pose: sp.pose, face: sp.face, dir, outfit: sp.outfit || {}, color: "soft" });
    if (!sp.tint) return s;
    // いろちがい: からだの いろ（PROFILE の fill）を かえる。にじいろは ななめの グラデーション（id は 景品ごとに 1つ）
    const base = PROFILE[sp.who].fill, T = TINT[sp.tint];
    if (T.col) return s.split(`fill="${base}"`).join(`fill="${T.col[sp.who]}"`);
    const gid = `rb_${sp.who}_${dir}`, grad = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${RAINBOW.map((c, i) => `<stop offset="${f1((i / (RAINBOW.length - 1)) * 100)}%" stop-color="${c}"/>`).join("")}</linearGradient></defs>`;
    return s.split(`fill="${base}"`).join(`fill="url(#${gid})"`).replace(/(<svg[^>]*>)/, `$1${grad}`);
  };
  const svg = (id, dir = "down") => {
    const it = INDEX[id]; if (!it) return "";
    const [x, y, w, h] = it.crop;
    let s = raw(it, dir).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "");
    return it.spec.kuji ? s : s.replace(/<\/svg>\s*$/, deco(it, dir) + "</svg>"); // いちばんくじの ぬいぐるみは くじの タグが ある
  };
  // ほかの SVG の 中に 1つ おく（x y w h に 足もとを そろえて おさめる）
  const nest = (id, x, y, w, h, dir = "down") => svg(id, dir).replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMax meet" `);
  // おうちの 立体（ぬいぐるみは たって いる 絵・足もとに かげ）
  const model = (id) => {
    const f = FURN_INDEX[id], w = f.w, h = f.h;
    return { x: -w / 2, y: -h, w, h: h + 12, footW: w, footD: f.depth || 40, height: h, full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h} ${w} ${h + 12}"><ellipse cy="3" rx="${f1(w * 0.42)}" ry="${f1(Math.max(5, w * 0.06))}" fill="#4F465622"/>${nest(id, -w / 2, -h, w, h)}</svg>` };
  };

  // ---- コインの 景品（1にちの 上限）----
  const COIN_DAY_MAX = 600;
  const coinState = () => { const a = Save.d.arcade; const day = U.today(); if (a.coinDay !== day) { a.coinDay = day; a.coinToday = 0; } return a; };
  const coinLeft = () => Math.max(0, COIN_DAY_MAX - (coinState().coinToday || 0));

  const install = () => {
    for (const it of ITEMS) {
      if (it.noFurn) continue; // いちばんくじの ぬいぐるみは その くじの 家具を わたす
      const f = { id: it.id, name: it.name, price: 0, kind: "floor", w: it.w, h: it.h, depth: it.depth, comfort: it.size === "big" ? 10 : 5, rare: true, interactive: true, exclusive: "ikebukuro", arcadePrize: true, cityItem: { type: "arcadeplush", variant: it.id }, desc: it.desc };
      FURNITURE.push(f); FURN_INDEX[it.id] = f; FURN_ART[it.id] = () => nest(it.id, 0, 0, it.w, it.h);
    }
    // おうちの 立体: 池袋の おしなもの（cityItem）の なかで ぬいぐるみの 景品だけ ここで つくる
    const model0 = IkebukuroItemArt.model;
    IkebukuroItemArt.model = function (id, opts = {}) { return INDEX[id] ? model(id) : model0.call(this, id, opts); };
  };
  // その日の きせつの ぬいぐるみ（day は "2026-10-3" の かたち・who は 3人）
  const seasonal = (who, day) => { const m = Number(String(day).split("-")[1]); return ITEMS.find((it) => it.season && it.spec.who === who && it.season.includes(m)) || null; };
  // レアの ぬいぐるみ（UI-124）: 3人の ぬいぐるみの 台（machine）ごとに、5にちに 1にち くらい（日づけと 台で きまる）その子の レアが 1しゅ まざる
  const RARE_EVERY = 5;
  const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rarePool = (who) => ITEMS.filter((it) => it.rare && it.spec.who === who);
  const rareOf = (who, machine, day) => { if (hash(`${machine}:${day}`) % RARE_EVERY) return null; const L = rarePool(who); return L.length ? L[hash(`${who}:${day}:rare`) % L.length] : null; };
  const prizeOf = (it) => (it && (it.prize || it.id)) || null; // とれた ときに もらう もの（いちばんくじの ぬいぐるみは くじの 家具）
  return { NAME, HERO, SEASONS, SEASON_HERO, MORE_HERO, MINI, MINI_SP, GROUP, FOLK, TINT, KUJI_RARE, RARE_EVERY, ITEMS, INDEX, svg, nest, model, install, COIN_DAY_MAX, coinState, coinLeft, group, seasonal, rarePool, rareOf, prizeOf };
})();
ArcadePrizes.install();
