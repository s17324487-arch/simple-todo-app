// ガチャガチャの もり（Meeときょれじゃ 4F・UI-52。オーナーの FB 2026-10-02「4階を増設して…新しい景品のガチャガチャ18台…4階はガチャガチャの森の名称にして（待ちぼうけや、スクイーズ、ポーチ、目印アクセサリー、面白いグッズなど）」）。
// ・ほんものの カプセルトイ専門店「ガチャガチャの森」の ように、木目の パネル・みどり・しょくぶつ・どうぶつの オブジェの 森の フロアに ガチャ 18台（あたらしい けいひん）。
// ・けいひんは ほんものの はやりから: まちぼうけ（ひざを かかえて すわる フィギュア）・スクイーズ（ふかふか。へやで タップすると むにっ）・ポーチ・
//   めじるし アクセサリー（すいとうの ひもに つける マスコット）・おもしろ グッズ（ミニチュア かでん・しょくひん サンプル・まちの ミニチュア・どうぶつの おしり・かぶりもの・ミニ がっき・ミニ ぶんぼうぐ）・もりの なかま・きのこの おうち。
// ・しくみは 2F の ガチャと おなじ（js/gacha.js。1かい 200コイン・ふつう 3しゅ 30%ずつ・レア 10%・あける まで わからない）。Gacha.add で シリーズを たす（ばんごうは 12〜29）。
// ・3F の 南東の すみ（ベンチの よこ）に 4F への エスカレーター（IkeArcade.ESC4）。4F は その うえの ふきぬけ。
// ・セーブ: Save.d.gacha（2F と おなじ）。あたらしい ばしょは ない。絵は js/gacha-forest-art.js。
const GachaForest = (() => {
  // [なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … 服・もちもの
  const SERIES = [
    { id: "machi3", name: "まちぼうけ ぽかぽか", kind: "furn", color: "#E9B97A", caps: ["#FFE07A", "#FFFFFF", "#F7A9C8"], wide: [3], items: [
      ["まちぼうけ わんこ", "ひざを かかえて だれかを まって いる わんこ。なみだが ぽろり。"],
      ["まちぼうけ がちゃん", "ちょこんと すわって じっと まつ がちゃん。"],
      ["まちぼうけ ごじ", "ひざを かかえて しょんぼり まつ ごじ。"],
      ["まちぼうけ 3にん", "ベンチに ならんで みんなで まちぼうけ。レアの フィギュア。"],
    ] },
    { id: "machizoo", name: "まちぼうけ どうぶつ", kind: "furn", color: "#B9D8A0", caps: ["#C8E6A0", "#FFFFFF", "#FFE07A"], items: [
      ["まちぼうけ ねこ", "くさの うえで ひざを かかえる ねこ。"],
      ["まちぼうけ うさぎ", "ながい みみを たらして まつ うさぎ。"],
      ["まちぼうけ くま", "しょんぼり すわる くま。だれを まって いるのかな。"],
      ["まちぼうけ パンダ", "くろい てで ひざを かかえる パンダ。レアの フィギュア。"],
    ] },
    { id: "squishbread", name: "パン スクイーズ", kind: "furn", squish: true, color: "#E8B06A", caps: ["#F6D3A8", "#FFFFFF", "#FFE07A"], items: [
      ["しょくパン スクイーズ", "にっこり かおの しょくパン。さわると ふかっ。"],
      ["メロンパン スクイーズ", "あみめもようの メロンパン。さわると ふかっ。"],
      ["クロワッサン スクイーズ", "くるっと まいた クロワッサン。さわると ふかっ。"],
      ["くまパン スクイーズ", "くまの かおの パン。レアの スクイーズ。"],
    ] },
    { id: "squishmochi", name: "もちもち スクイーズ", kind: "furn", squish: true, color: "#F2C1D2", caps: ["#FBD3E6", "#FFFFFF", "#D7C6EE"], items: [
      ["もちもち ねこ", "おもちみたいな ねこ。さわると もちっ。"],
      ["もちもち ぶた", "まんまるの ぶた。さわると もちっ。"],
      ["もちもち あざらし", "ねそべった あざらし。さわると もちっ。"],
      ["もちもち パンダ", "まるい パンダ。レアの スクイーズ。"],
    ] },
    { id: "squishsweet", name: "おかし スクイーズ", kind: "furn", squish: true, color: "#FF9FB8", caps: ["#FBD3E6", "#FFFFFF", "#BFE6F7"], items: [
      ["マシュマロ スクイーズ", "ふわふわの マシュマロ。さわると ぷにっ。"],
      ["ドーナツ スクイーズ", "ピンクの チョコの ドーナツ。さわると ぷにっ。"],
      ["マカロン スクイーズ", "ミントいろの マカロン。さわると ぷにっ。"],
      ["ホットケーキ スクイーズ", "バターの のった 3だんの ホットケーキ。レアの スクイーズ。"],
    ] },
    { id: "pouchzoo", name: "どうぶつ ポーチ", kind: "wear", hand: true, color: "#B8A2E8", caps: ["#D7C6EE", "#FFFFFF", "#F7A9C8"], items: [
      ["ねこの ポーチ", "かたから かける しろねこの ポーチ。", "hand", "gacha_pouch", ["#FFFFFF", "#F59AC0", "cat"]],
      ["うさぎの ポーチ", "ながい みみの ピンクの ポーチ。", "hand", "gacha_pouch", ["#F8D2E0", "#F59AC0", "rabbit"]],
      ["くまの ポーチ", "ちゃいろの くまの ポーチ。", "hand", "gacha_pouch", ["#C98E5C", "#8A6A48", "bear"]],
      ["ユニコーンの ポーチ", "きんの つのと むらさきの たてがみ。レアの ポーチ。", "hand", "gacha_pouch", ["#FFFFFF", "#B79BEA", "unicorn"]],
    ] },
    { id: "pouchsnack", name: "おやつ ポーチ", kind: "wear", hand: true, color: "#F5B971", caps: ["#FFB25B", "#FFFFFF", "#FFE07A"], items: [
      ["メロンパン ポーチ", "メロンパンの かたちの ポーチ。", "hand", "gacha_pouch", ["#F7D774", "#C98E5C", "melonpan"]],
      ["おにぎり ポーチ", "のりを まいた おにぎりの ポーチ。", "hand", "gacha_pouch", ["#FFFFFF", "#2F3B35", "onigiri"]],
      ["ドーナツ ポーチ", "いちごチョコの ドーナツの ポーチ。", "hand", "gacha_pouch", ["#F59AC0", "#C98E5C", "donut"]],
      ["ショートケーキ ポーチ", "いちごの ショートケーキ。レアの ポーチ。", "hand", "gacha_pouch", ["#F59AC0", "#F59AC0", "cake"]],
    ] },
    { id: "mejitrio", name: "ぽかぽか めじるし", kind: "wear", hand: true, color: "#7FC6E4", caps: ["#BFE6F7", "#FFFFFF", "#FFE07A"], items: [
      ["わんこの めじるし", "すいとうの ひもに つける わんこの マスコット。", "hand", "gacha_mejirushi", ["#9FD3F0", "wanko"]],
      ["がちゃんの めじるし", "すいとうの ひもに つける がちゃんの マスコット。", "hand", "gacha_mejirushi", ["#FFE07A", "gachan"]],
      ["ごじの めじるし", "すいとうの ひもに つける ごじの マスコット。", "hand", "gacha_mejirushi", ["#C9B6EE", "goji"]],
      ["3にんの めじるし", "3にん いっしょの マスコット。レアの めじるし。", "hand", "gacha_mejirushi", ["#9ED3A8", "trio"]],
    ] },
    { id: "mejiforest", name: "もりの めじるし", kind: "wear", hand: true, color: "#8FD1B5", caps: ["#C8E6A0", "#FFFFFF", "#F6D3A8"], items: [
      ["りすの めじるし", "すいとうの ひもに つける りすの マスコット。", "hand", "gacha_mejirushi", ["#F2C28B", "squirrel"]],
      ["ふくろうの めじるし", "まんまるの めの ふくろうの マスコット。", "hand", "gacha_mejirushi", ["#B9E3C9", "owl"]],
      ["きのこの めじるし", "あかい きのこの マスコット。", "hand", "gacha_mejirushi", ["#FFFFFF", "mushroom"]],
      ["しかの めじるし", "つのの ある しかの マスコット。レアの めじるし。", "hand", "gacha_mejirushi", ["#F7A9C8", "deer"]],
    ] },
    { id: "minikaden", name: "ミニチュア かでん", kind: "furn", color: "#9FD3F0", caps: ["#BFE6F7", "#FFFFFF", "#E6E9F2"], items: [
      ["ミニ れいぞうこ", "てのひらサイズの れいぞうこ。とびらに マグネット。"],
      ["ミニ せんたくき", "まるい まどの せんたくき。なかで あわが くるくる。"],
      ["ミニ でんしレンジ", "おさらの まわる でんしレンジ。"],
      ["ミニ じどうはんばいき", "のみものが ならぶ じどうはんばいき。レアの ミニチュア。"],
    ] },
    { id: "foodsample", name: "しょくひん サンプル", kind: "furn", color: "#F2C84B", caps: ["#FFE07A", "#FFFFFF", "#F6D3A8"], items: [
      ["ラーメンの サンプル", "おはしが うかんで いる ラーメン。たべられないよ。"],
      ["オムライスの サンプル", "ケチャップで ハートの オムライス。"],
      ["おすしの サンプル", "まぐろと サーモンの おすし。"],
      ["おこさまランチの サンプル", "はたの たった おこさまランチ。レアの サンプル。"],
    ] },
    { id: "townmini", name: "まちの ミニチュア", kind: "furn", color: "#E8434F", caps: ["#F7A9C8", "#FFFFFF", "#9FD3F0"], items: [
      ["ミニ ポスト", "まっかな ゆうびん ポスト。"],
      ["ミニ しんごうき", "あお・きいろ・あかの しんごうき。"],
      ["ミニ バスてい", "ベンチの ある バスてい。"],
      ["ミニ ふみきり", "カンカン なる ふみきり。レアの ミニチュア。"],
    ] },
    { id: "oshiri", name: "どうぶつの おしり", kind: "furn", color: "#F7C98A", caps: ["#F6D3A8", "#FFFFFF", "#F7A9C8"], items: [
      ["ねこの おしり", "しましまの しっぽの ねこの おしり。"],
      ["いぬの おしり", "くるんと した しっぽの いぬの おしり。"],
      ["ぶたの おしり", "くるくる しっぽの ぶたの おしり。"],
      ["パンダの おしり", "まるい しっぽの パンダの おしり。レアの フィギュア。"],
    ] },
    { id: "kaburi", name: "おもしろ かぶりもの", kind: "wear", acc: true, color: "#FFB27A", caps: ["#FFB25B", "#FFFFFF", "#FFE07A"], items: [
      ["えびフライの かぶりもの", "あたまに のせる えびフライ。みんな びっくり。", "head", "gacha_ebifry", ["#E7A94E"]],
      ["おすしの かぶりもの", "サーモンの おすしの ぼうし。", "head", "gacha_sushihat", ["#FFA36B"]],
      ["きのこの かぶりもの", "あかい きのこの ぼうし。もりに ぴったり。", "head", "gacha_kinokohat", ["#E8434F"]],
      ["ケーキの かぶりもの", "ろうそくの たった いちごの ケーキ。レアの かぶりもの。", "head", "gacha_cakehat", ["#F59AC0"]],
    ] },
    { id: "minigakki", name: "ミニ がっき", kind: "furn", color: "#B79BEA", caps: ["#D7C6EE", "#FFFFFF", "#FFE07A"], items: [
      ["ミニ ピアノ", "ちいさな アップライト ピアノ。"],
      ["ミニ ギター", "ちいさな アコースティック ギター。"],
      ["ミニ たいこ", "ばちの ついた あかい たいこ。"],
      ["ミニ ハープ", "きんいろの ハープ。レアの ミニチュア。"],
    ] },
    { id: "minibungu", name: "ミニ ぶんぼうぐ", kind: "furn", color: "#74B9E8", caps: ["#BFE6F7", "#FFFFFF", "#9ED3A8"], items: [
      ["ミニ えんぴつたて", "いろえんぴつが 4ほん たった えんぴつたて。"],
      ["ミニ けしごむ", "かおの ある けしごむと ふつうの けしごむ。"],
      ["ミニ ノート", "ハートの ついた みどりの ノート。"],
      ["ミニ ちきゅうぎ", "くるくる まわせそうな ちきゅうぎ。レアの ミニチュア。"],
    ] },
    { id: "forestpal", name: "もりの なかま", kind: "furn", color: "#7DBF5A", caps: ["#C8E6A0", "#FFFFFF", "#F6D3A8"], items: [
      ["きりかぶの りす", "どんぐりを もった りす。"],
      ["きりかぶの はりねずみ", "りんごを みつけた はりねずみ。"],
      ["きりかぶの たぬき", "あたまに はっぱを のせた たぬき。"],
      ["えだの しろふくろう", "えだに とまった しろい ふくろう。レアの フィギュア。"],
    ] },
    { id: "kinoko", name: "きのこの おうち", kind: "furn", color: "#D9655B", caps: ["#F7A9C8", "#FFFFFF", "#FFE07A"], items: [
      ["あかい きのこの おうち", "しろい みずたまの あかい きのこの いえ。"],
      ["ちゃいろ きのこの おうち", "えんとつの ある ちゃいろの きのこの いえ。"],
      ["きいろい きのこの おうち", "まどの まるい きいろの きのこの いえ。"],
      ["きのこの おしろ", "きんの おうかんを のせた きのこの おしろ。レアの ミニチュア。"],
    ] },
  ].map((S) => ({ ...S, forest: true }));
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  const index = Object.fromEntries(SERIES.map((S) => [S.id, S.index]));

  // ---- スクイーズ: へやで タップすると むにっと つぶれて もどる ----
  // おうちの 立体は FurnModels（かげ ＋ たった 絵。live の ときは 絵を ぬいて FurnLive が つぶして 描く。aqua-gifts の ぬいぐるみと おなじ）
  const SQUISH = new Set(SERIES.filter((S) => S.squish).flatMap((S) => S.list.map((it) => it.id)));
  const since = (st) => G.t - st.t0;
  const squash = (t) => (t >= 0 && t < 1.1 ? Math.exp(-t * 4.2) * Math.cos(t * 15) : 0); // 1 → 0 へ ゆれながら もどる
  const fig = (id, w, h) => GachaArt.figure(id).replace("<svg ", `<svg x="${-w / 2}" y="${-h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const Pm = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    Pm.s = s; Pm.d = dm.d; return Pm;
  };
  for (const id of SQUISH) {
    const f = FURN_INDEX[id];
    FurnModels.register(id, (k) => k.shadow(0.12, 4, 14) + k.L(k.at(0, -k.d / 2, 0, fig(id, f.w, f.h), f.w / 2 + 2, f.h + 2)));
    FurnLive.register(id, {
      tap(sc, it, st) {
        st.t0 = G.t; st.n = (st.n || 0) + 1;
        if (Sound.ctx && Save.d?.settings?.se) { Sound.tone(Sound.seGain, { f: 330, f2: 180, t: 0, dur: 0.14, type: "sine", vol: 0.16, a: 0.005, r: 0.2 }); Sound.tone(Sound.seGain, { f: 260, f2: 420, t: 0.16, dur: 0.12, type: "sine", vol: 0.1, a: 0.005, r: 0.2 }); }
        const kids = (sc.chars || []).filter((c) => !c.hidden), who = kids[st.n % Math.max(1, kids.length)];
        if (who && typeof HomeLife !== "undefined") HomeLife.say(sc, who.id, ["むにっ！ やわらかーい", "ふかふか〜♪", "ぎゅっと しても もどるよ", "ぷにぷに きもちいい！"][st.n % 4], false, "say");
      },
      draw(ctx, sc, it, r, st) {
        const Pm = mapper(sc, it, r), q = Pm(0, -Pm.d / 2, 0), s = Pm.s, k = squash(since(st)) * 0.26, w = f.w * s, h = f.h * s;
        const px = Math.max(8, Math.ceil((f.w * s * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * 110) / 100));
        const img = SvgCache.get("gachasq:" + id + ":" + px, () => GachaArt.figure(id), px, py);
        if (!img) return;
        // 足もとを ささえに たてに つぶれて よこに ひろがる
        ctx.save(); ctx.translate(q.x, q.y); if (it.flip) ctx.scale(-1, 1); ctx.scale(1 + k * 0.7, 1 - k);
        ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
      },
    }, true);
  }

  // ---- 4F（ガチャガチャの もり）の 配置。28×22 マス（ほかの 階と おなじ）。南東の すみに 3F から のぼって くる エスカレーター（ふきぬけ）----
  // まんなかが「ガチャの しま」（オーナーの FB 2026-10-03「4階の配置が悪い。真ん中の木は消して、ガチャをメインにもってこい」）。
  // ・カプセルもようの ゆか（'g'。2F の ガチャ コーナーと おなじ）に 3だいずつの くみ 6つ（18だい。テーマごと）。おくの れつの うしろに テーマの かんばん、
  //   てまえの れつの うしろに ひくい しきり。まんなかに あった おおきな もりの き は けした（かべぎわの しげみと き・どうぶつの オブジェで もりの ふんいき）。
  //   にしの しま（x 3〜11 × y 4〜10）: おく まちぼうけ・スクイーズ／てまえ ミニチュア・ミニ グッズ。ひがしの しま（x 14〜22 × y 4〜6）: ポーチ・ぼうし／めじるし・もり。
  // ・きたの ひがしの かべ（x 14〜27）は シールの ガチャ（16〜18・js/sticker-book.js の patch4）と クレーンゲーム 3台（20〜25。たこやき・バーバーカット・バウンドボール。UI-54）。
  //   ひがしの しまの まえ（y 7〜10）と ひがしの すみは もりの ひろば（きのこの いす・きりかぶの ベンチ）。
  // ・3F の エスカレーターは 南東の すみ（IkeArcade.ESC4）。1F→2F と おなじ ひがしの ばしょ だと 3F の おめかし コーナー・おかし タワーが 4F の ゆかの ふちに かくれる（tools/check-ikebukuro.mjs）。
  const ESC = IkeArcade.ESC4;
  // ガチャの しまの くみ（シリーズの id 3つ・かんばんの ばんごう〔ArcadeArt.gachaboard の variant〕・おく〔back〕か てまえか・しまの なかの x）
  const ISLES = [
    { name: "まちぼうけ", ids: ["machi3", "machizoo", "oshiri"], board: 2, x: 4, back: true }, { name: "スクイーズ", ids: ["squishbread", "squishmochi", "squishsweet"], board: 3, x: 8, back: true },
    { name: "ポーチ・ぼうし", ids: ["pouchzoo", "pouchsnack", "kaburi"], board: 4, x: 15, back: true }, { name: "めじるし・もり", ids: ["mejitrio", "mejiforest", "forestpal"], board: 5, x: 19, back: true },
    { name: "ミニチュア", ids: ["minikaden", "foodsample", "townmini"], board: 6, x: 4, back: false }, { name: "ミニ グッズ", ids: ["minigakki", "minibungu", "kinoko"], board: 7, x: 8, back: false },
  ];
  const floor4 = () => {
    const W = IkeArcade.W, H = IkeArcade.H, rows = Array.from({ length: H }, () => Array(W).fill(".")), e = ESC;
    const paint = (ch, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rows[y][x] = ch; };
    // 木の とおりみち（'w'）: きたの かべの まえ・にしの かべの まえ・まんなかの じゅうじ・みなみ・ひがしの ひろばと エスカレーターの まわり
    paint("w", 1, 1, 27, 3); paint("w", 1, 1, 3, 20); paint("w", 1, 11, 27, 12); paint("w", 12, 1, 13, 20); paint("w", 1, 18, e.x - 1, 19);
    paint("w", e.x - 1, 3, e.x - 1, 20); paint("w", e.x + e.w, 11, e.x + e.w, 20); paint("w", e.x - 1, e.y + e.h, e.x + e.w, e.y + e.h);
    // ガチャの しまの ゆか（カプセルもよう）
    paint("g", 3, 4, 11, 10); paint("g", 14, 4, 22, 6);
    for (let y = e.y + 1; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) rows[y][x] = "o";
    const fixtures = [];
    // ガチャの しま: おくの れつ（y 5・うしろ y 4 に かんばん）・てまえの れつ（y 8・うしろ y 7 に ひくい しきり）。台の まえ（+y）に たって まわす
    for (const I of ISLES) {
      const y = I.back ? 5 : 8;
      I.ids.forEach((id, k) => { const si = index[id], x = I.x + k; fixtures.push({ kind: "gacha", x, y, w: 1, h: 1, dir: "y", variant: si, series: si, height: 112, label: k === 0 ? I.name : "", action: "gacha", spots: [[x, y + 1]] }); });
      if (I.back) fixtures.push({ kind: "gachaboard", x: I.x, y: 4, w: 3, h: 1, dir: "y", height: 170, variant: I.board });
      else fixtures.push({ kind: "divider", x: I.x, y: 7, w: 3, h: 1, height: 45 });
    }
    fixtures.push({ kind: "capbin", x: 11, y: 8, w: 1, h: 1, dir: "y", height: 78, label: "カプセル かいしゅう", action: "info", text: "あけた カプセルは ここに いれてね。きれいに して また つかうよ。", spots: [[11, 9]] });
    // もりの あんない（きたの かべ。いたの 絵は 4F に「いま ここ」）
    fixtures.push({ kind: "directory", variant: "forest", here: "4F", x: 10, y: 0, w: 3, h: 1, dir: "y", height: 176, label: "もりの あんない", action: "info", text: "ガチャガチャの もり（4F）\nまんなかの ガチャの しま: まちぼうけ・スクイーズ・ミニチュア・ミニ グッズ（にし）、ポーチ・ぼうし・めじるし（ひがし）。ぜんぶで 18だい\nきたの ひがし: クレーンゲーム 3だい（たこやき・バーバーカット・バウンドボール。1かい 100コイン）\nガチャは 1かい 200コイン。どれが でるかは カプセルを あけて からの おたのしみ！", spots: [[11, 1]] });
    // かべぎわの もりの かざり（きたの にし・にしの かべ。ひくい しげみ と かべの き）
    for (const x of [1, 3, 5, 7, 9]) fixtures.push({ kind: "fbush", x, y: 0, w: 1, h: 1, height: 52 });
    for (const y of [4, 6, 8, 10, 12]) fixtures.push({ kind: "fbush", x: 0, y, w: 1, h: 1, height: 52 });
    fixtures.push({ kind: "ftree", x: 0, y: 14, w: 2, h: 2, height: 300, variant: 0 });
    // きたの ひがしの かべ: おおきな き（14）・シールの ガチャ（16〜18）・クレーンゲーム 3台（20〜25。台の ばんごうは CraneMachines.DEFS の id から）。
    // クレーンは せが たかいので シールの ガチャ との あいだを 1マス あける（すぐ よこだと 18 の ガチャが かくれる）。みぎの すみ（26〜27）は ひくい しげみ
    fixtures.push({ kind: "ftree", x: 14, y: 0, w: 2, h: 2, height: 300, variant: 0 });
    ["tako", "barber", "bound"].forEach((id, k) => { const i = CraneMachines.DEFS.findIndex((d) => d.id === id); if (i >= 0) IkeArcade.crane(fixtures, i, 20 + k * 2, 0, "y"); });
    for (const [x, y] of [[26, 0], [27, 1]]) fixtures.push({ kind: "fbush", x, y, w: 1, h: 1, height: 52 });
    // もりの ひろば（くさはら）: きのこの いす（ひがしの しまの まえ）・きりかぶの ベンチ・しげみ
    for (const [x, y, v] of [[15, 8, 0], [16, 8, 1], [17, 8, 2]]) fixtures.push({ kind: "fmush", x, y, w: 1, h: 1, height: 56, variant: v, label: "きのこの いす", action: "sit", text: "ふかふかの きのこの いす。すわって カプセルを あけよう。", spots: [[x, y + 1]] });
    fixtures.push({ kind: "fhedge", x: 19, y: 8, w: 3, h: 1, height: 40 });
    fixtures.push({ kind: "fstump", x: 24, y: 6, w: 2, h: 1, height: 40, label: "きりかぶの ベンチ", action: "sit", text: "きりかぶの ベンチで ひとやすみ。とった カプセルを あけて みよう。", spots: [[24, 7], [25, 7], [24, 5], [25, 5]] });
    for (const [x, y] of [[24, 4], [27, 8], [23, 9]]) fixtures.push({ kind: "fbush", x, y, w: 1, h: 1, height: 52 });
    // みなみ: どうぶつの オブジェ・おおきな カプセル（もりの しるし。なかに まちぼうけの 3にん）
    fixtures.push({ kind: "fstatue", x: 9, y: 14, w: 1, h: 1, height: 170, variant: "deer", label: "しかの オブジェ", action: "info", text: "もりの いりぐちで まって いる しかの オブジェ。いっしょに しゃしんを とろう！", spots: [[10, 14]] });
    fixtures.push({ kind: "fstatue", x: 19, y: 14, w: 1, h: 1, height: 170, variant: "owl", label: "ふくろうの オブジェ", action: "info", text: "きりかぶに とまった ふくろう。よるに なると めが ぱっちり ひらくんだって。", spots: [[19, 15]] });
    fixtures.push({ kind: "fstatue", x: 5, y: 15, w: 1, h: 1, height: 170, variant: "bear", label: "くまの オブジェ", action: "info", text: "はちみつの つぼを もった くまの オブジェ。", spots: [[6, 15]] });
    fixtures.push({ kind: "fcapsule", x: 16, y: 15, w: 2, h: 2, height: 136, variant: 0, fig: "gacha_machi3_3", label: "おおきな カプセル", action: "info", text: "ガチャガチャの もりの しるしの おおきな カプセル。なかで まちぼうけの 3にんが すわって いるよ。", spots: [[16, 17], [17, 17]] });
    // やすむ ところ（みなみ）: きりかぶの ベンチ・しげみ
    for (const [x, y] of [[6, 20], [16, 20]]) fixtures.push({ kind: "fstump", x, y, w: 2, h: 1, height: 40, label: "きりかぶの ベンチ", action: "sit", text: "きりかぶの ベンチで ひとやすみ。", spots: [[x, y - 1], [x + 1, y - 1]] });
    for (const [x, y] of [[4, 20], [9, 20], [14, 20], [19, 20], [21, 14]]) fixtures.push({ kind: "fbush", x, y, w: 1, h: 1, height: 52 });
    // 町の人（ガチャを まわしに きた おきゃくさん。しまの はしに たつ・台の まえは あける）
    fixtures.push({ kind: "npc", sp: "squirrel", ci: 0, x: 3, y: 9, w: 1, h: 1, dir: "up", emo: "happy", label: "おきゃくさん", action: "info", text: "まちぼうけの フィギュア、ひざを かかえて すわって いて かわいいの！ ぜんぶ あつめたいな。", spots: [[2, 9]] });
    fixtures.push({ kind: "npc", sp: "rabbit", ci: 1, x: 22, y: 6, w: 1, h: 1, dir: "left", emo: "happy", label: "おきゃくさん", action: "info", text: "スクイーズは へやに かざって さわると むにっと するんだって！", spots: [[22, 7]] });
    fixtures.push({ kind: "npc", sp: "fox", ci: 2, x: 13, y: 15, w: 1, h: 1, dir: "up", emo: "normal", label: "おきゃくさん", action: "info", text: "めじるし アクセサリーは すいとうに つける マスコット。じぶんの すいとうが すぐ わかるよ。", spots: [[12, 15]] });
    // エスカレーター（3F へ くだる）と つりさげの あんない
    fixtures.push({ kind: "escalator", pair: true, dir: "down", x: e.x, y: e.y, w: e.w, h: e.h, rise: 210, height: 40, label: "3Fへ おりる", action: "floor", to: 3, spawn: [e.x + 3, e.y + e.h] });
    fixtures.push({ kind: "hangsign", x: e.x, y: e.y - 1, w: e.w, h: 1, z: 232, text: "3F ぷりくら", col: "#B07CD8", over: true, walk: true, fadeOver: true });
    return {
      id: "arcade4", iso: true, w: W, h: H, rows: rows.map((r) => r.join("")), wallH: 330, scale: 0.5, spawn: [e.x + 1, e.y - 1], elevatorSpawn: [e.x + 1, e.y - 1], crowd: 3, carpet: "forest", theme: "forest", below: "puri", bgm: "arcade_hall", short: "ガチャガチャの もり",
      title: "Meeときょれじゃ 4F", fixtures, holes: [{ kind: "rect", x: e.x, y: e.y + 1, w: e.w, h: e.h - 1 }],
      zones: [
        { x: 3, y: 4, w: 9, h: 7, shop: "arcForestIsle", label: "ガチャの しま（にし）", map: "ガチャの しま" }, { x: 14, y: 4, w: 9, h: 3, shop: "arcForestIsle2", label: "ガチャの しま（ひがし）", map: "ガチャ" },
        { x: 10, y: 0, w: 3, h: 2, shop: "arcForestInfo", label: "もりの あんない", map: "あんない" }, { x: 20, y: 0, w: 6, h: 3, shop: "arcForestCrane", label: "クレーンゲーム", map: "クレーン" },
        { x: 14, y: 7, w: 14, h: 4, shop: "arcForestRest", label: "もりの ひろば", map: "ひろば" }, { x: 15, y: 14, w: 4, h: 4, shop: "arcForestCap", label: "おおきな カプセル", map: "カプセル" },
      ],
      walls: {
        north: [{ kind: "neon", from: 0.5, to: 9.5, z: 300, size: 32, text: "ガチャガチャの もり", col: "#9ED36A" }, { kind: "sign", from: 10, to: 13, z: 236, text: "4F", col: "#F6E7C8" }, { kind: "neon", from: 13.6, to: 27.4, z: 300, size: 30, text: "もりの ひろば", col: "#F7D774" }],
        west: [{ kind: "neon", from: 8, to: 17.8, z: 300, size: 28, text: "まんなかは ガチャの しま", col: "#F7A9C8" }, { kind: "sign", from: 4, to: 7.6, z: 236, text: "200コイン", col: "#F6E7C8" }],
      },
    };
  };
  // 3F に 4F への エスカレーター（南東の すみ・ベンチの よこ）。そこに あった はしらは とる・エスカレーターまで 木目の とおりみち
  const patch3 = (r) => {
    const e = ESC, pillar = r.fixtures.findIndex((f) => f.kind === "apillar" && f.x + f.w > e.x - 1 && f.x <= e.x + e.w && f.y + f.h > e.y - 1 && f.y <= e.y + e.h);
    if (pillar >= 0) r.fixtures.splice(pillar, 1);
    r.rows = r.rows.map((row, y) => [...row].map((c, x) => ((x === e.x - 1 && y >= e.y && y <= e.y + e.h) || (y === e.y + e.h && x >= e.x - 1) ? "w" : c)).join(""));
    r.fixtures.push({ kind: "escalator", pair: true, x: e.x, y: e.y, w: e.w, h: e.h, rise: 176, height: 200, label: "4Fへ のぼる", action: "floor", to: 4, spawn: [e.x + 1, e.y - 1] });
    r.fixtures.push({ kind: "slab", x: e.x - 0.3, y: e.y - 0.4, w: e.w + 0.6, h: 2.2, z: 172, height: 30, over: true, walk: true, fadeOver: true });
    r.fixtures.push({ kind: "hangsign", x: e.x, y: e.y + e.h, w: e.w, h: 1, z: 232, text: "4F ガチャの もり", col: "#6FAE5A", over: true, walk: true, fadeOver: true });
  };
  const install = () => {
    const def = VenueHalls.defs.arcade; if (!def || !def.floors || !def.floors[3]) return;
    patch3(def.floors[3]); def.floors[4] = floor4();
    Object.assign(MallArt.SHOP, {
      arcForestIsle: { name: "ガチャの しま", c: ["#CFE9E4", "#9FD1C8", "#5FA99C"] }, arcForestIsle2: { name: "ガチャの しま", c: ["#D9EEE9", "#AEDAD1", "#6FB5A8"] },
      arcForestInfo: { name: "あんない", c: ["#FFF3C4", "#FFE07A", "#E0B640"] }, arcForestRest: { name: "ひろば", c: ["#F2E3CF", "#E1C7A6", "#C9A27A"] },
      arcForestCrane: { name: "クレーン", c: ["#FFE2C4", "#F7B98A", "#E08A54"] },
      arcForestCap: { name: "カプセル", c: ["#FBD3E6", "#F7A9C8", "#E07AA6"] },
    });
  };
  install();

  return { SERIES, SQUISH, first, index, squash, floor4, patch3, ISLES };
})();
