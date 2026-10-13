// ようふく 50しゅ（UI-125。オーナーの 指示 2026-10-13「洋服の種類を50種類増やして欲しい。もっと可愛いやつとか、実際にあるような服をリサーチして。」）。
// ・ほんとうに ある 服から えらんだ（2026年の はる なつ・あき ふゆの はやり〔ペプラム・シアー・バレエコアの チュール・テーラード・フライト ジャケット・ノルディック／フェアアイル〕と、
//   ていばん〔ブラウス・ニット・ベスト・カーディガン・ワンピース・ジャンパースカート・コート・ジャケット・スウェット・シャツ〕・きもの など）。からだ（body）の 服だけ。
// ・絵は 1つの くみたて（WEAR.cw_wear）。col は [おもな いろ, さしいろ, なかの いろ, SPEC の id]。そで・なかに きる もの・えり・まえの とめかた・もよう・すそ・スカート・エプロン を くみあわせる。
//   キャラの 座標（viewBox 220 はば）で 線は INK・4.5（こまかい ところは ほそく）。clipPath の id は ctx.uid を つける（そでは うでごと）。SvgCache の キーは ふえない（服の id だけ）。
// ・ようふくやさんの「トレンド」の たな（ふくの たなとは べつ）で かう。ねだんは ほかの 服と おなじに slow-life-prices.js が なおす（この ファイルは その まえ）。
// ・セーブ: Save.d.wardrobe に はいる だけ（Save.SCHEMA は 2 の まま）。
const ClosetWear = (() => {
  const TAB = "trend", TAB_NAME = "トレンド";
  const W = "#FFFFFF", GOLD = "#F2C14E";
  // [id, なまえ, せつめい, ねだん, st, SPEC]
  // SPEC: c おもな いろ・a さしいろ・i なかに きる ものの いろ（ない ときは なし）・hem すその たかさ（0〜1。1 は からだ ぜんぶ）・sl そで（short|long|puff|none）・slc そでの いろ（m|a|i）
  //   collar えり（round|sailor|frill|bow|shirt|turtle|crew|mandarin|hood|lapel|stand|cross）・front まえ（buttons|pearls|zip|double|toggle|frog|snap|placket|asym）
  //   pat もよう・pc もようの いろ・rib すそと そでぐちの リブ・open まえあき（なかの いろが みえる）・vest ベスト・wrap まえで かさねる・peplum・belt・pocket・patch・emb ししゅう
  //   skirt スカート（flare|tiered|pleats|tutu|maxi|straight）・cami キャミ（かたひも）・bib ジャンスカの むねあて・apron エプロン・poncho ポンチョ・fringe・slstripe そでの ライン
  const LIST = [
    // ---- ブラウス・シャツ ----
    ["cw_peterpan", "まるえりの ブラウス", "まるい えりの ブラウス。ちいさな リボンと パフスリーブ。", 380, { def: 1, sp: 1 }, { c: "#FCE4EC", a: W, a2: "#F06292", sl: "puff", collar: "round", front: "buttons", hem: 0.64 }],
    ["cw_sailor", "セーラーえりの ブラウス", "こんいろの セーラーえりに あかい スカーフ。マリンの きぶん。", 420, { def: 1, spd: 1 }, { c: "#F4F8FF", a: "#2F4B8F", a2: "#E35D5B", sl: "short", collar: "sailor", hem: 0.66 }],
    ["cw_frill", "フリルえりの ブラウス", "ふちが ふわふわの フリルの えり。ラベンダーいろ。", 400, { sp: 2 }, { c: "#D9C8F0", a: W, sl: "puff", collar: "frill", front: "pearls", hem: 0.64 }],
    ["cw_puff", "パフスリーブ ブラウス", "かたが ふんわり ふくらむ ミントいろの ブラウス。", 360, { sp: 1, hp: 1 }, { c: "#BFE8D6", a: W, sl: "puff", collar: "crew", hem: 0.62 }],
    ["cw_bowtie", "リボンタイ ブラウス", "むなもとで リボンを むすぶ クリームいろの ブラウス。", 400, { def: 1, sp: 1 }, { c: "#FFF3D6", a: "#8A5A3C", sl: "long", collar: "bow", hem: 0.64 }],
    ["cw_peplum", "ペプラム ブラウス", "ウエストから すそが ひらく ペプラム。2026ねんの なつの はやり。", 460, { spd: 1, sp: 1 }, { c: "#F8BBD0", a: "#E57399", sl: "puff", collar: "crew", peplum: true, belt: true, hem: 0.52 }],
    ["cw_sheer", "シアーの ブラウス", "すけた ブラウスを キャミに かさねる。かるい みずいろ。", 440, { spd: 2 }, { c: "#BFDDF5", a: W, i: W, sheer: true, sl: "long", collar: "crew", hem: 0.66 }],
    ["cw_rugby", "ラガー シャツ", "ふとい しましまに しろい えり。ラグビーの シャツが もとだよ。", 420, { atk: 1, hp: 1 }, { c: "#2F4B8F", a: W, pc: "#F2C14E", pat: "wide", sl: "long", collar: "shirt", front: "placket", hem: 0.68 }],
    ["cw_aloha", "アロハ シャツ", "ハイビスカスの もようの なつの シャツ。", 400, { spd: 1, hp: 1 }, { c: "#3FA7B5", a: "#F7A1C4", pc: "#F7A1C4", pat: "aloha", sl: "short", collar: "shirt", front: "buttons", hem: 0.68 }],
    ["cw_flannel", "チェックの ネルシャツ", "あったかい ネルの チェック。むねに ポケット。", 400, { def: 2 }, { c: "#C8453F", a: "#5A2626", pc: "#5A2626", pat: "check", sl: "long", collar: "shirt", front: "buttons", pocket: "chest", hem: 0.7 }],
    // ---- ニット ----
    ["cw_nordic", "ノルディック セーター", "ゆきの けっしょうと ギザギザの もよう。ふゆの ていばん。", 520, { def: 2, hp: 1 }, { c: "#D9534F", a: W, pc: W, pat: "nordic", sl: "long", collar: "crew", rib: true, hem: 0.72 }],
    ["cw_fairisle", "フェアアイル セーター", "こまかい もようが なんだんも ならぶ スコットランドの ニット。", 540, { def: 2, sp: 1 }, { c: "#E9D8B8", a: "#A35D4E", pc: "#5E8C6A", pc2: "#3F5AA8", pat: "fairisle", sl: "long", collar: "crew", rib: true, hem: 0.72 }],
    ["cw_cable", "ケーブル ニット", "なわの ような あみめが たてに ならぶ クリームいろの ニット。", 500, { def: 2 }, { c: "#F4EBD6", a: "#D9CBA8", pc: "#D9CBA8", pat: "cable", sl: "long", collar: "crew", rib: true, hem: 0.72 }],
    ["cw_mohair", "モヘアの ニット", "けが ふわふわ たった ピンクの ニット。", 520, { hp: 2 }, { c: "#F7C6D9", a: "#FFE3EE", pc: "#FFE3EE", pat: "fuzzy", sl: "long", collar: "crew", hem: 0.7 }],
    ["cw_turtle", "タートルネック ニット", "くびまで あったかい からしいろの ニット。", 480, { def: 2 }, { c: "#E3B04B", a: "#C99632", pc: "#C99632", pat: "ribv", sl: "long", collar: "turtle", rib: true, hem: 0.72 }],
    ["cw_heartknit", "ハートの ニット", "あかい ハートが ならぶ ももいろの ニット。", 480, { sp: 2 }, { c: "#FDE2E4", a: "#E35D5B", pc: "#E35D5B", pat: "hearts", sl: "long", collar: "crew", rib: true, hem: 0.7 }],
    // ---- ベスト ----
    ["cw_knitvest", "ニット ベスト", "しろい シャツに こんいろの Vネックの ベスト。", 420, { def: 1, sp: 1 }, { c: "#2F4B8F", a: W, i: W, vest: true, sl: "short", slc: "i", collar: "shirt", rib: true, hem: 0.7 }],
    ["cw_argyle", "アーガイルの ベスト", "ひしがたの もようの ベスト。ブラウンと クリーム。", 440, { def: 2 }, { c: "#C9A27A", a: "#7A4E2D", i: W, pc: "#7A4E2D", pc2: W, pat: "argyle", vest: true, sl: "long", slc: "i", collar: "shirt", rib: true, hem: 0.7 }],
    ["cw_downvest", "ダウン ベスト", "ふかふかの ダウンの ベスト。ニットの うえに。", 480, { def: 2, hp: 1 }, { c: "#E35D5B", a: "#B9433F", i: "#E8E2D6", pat: "quilt", pc: "#B9433F", sl: "long", slc: "i", collar: "stand", front: "zip", hem: 0.74 }],
    // ---- カーディガン・ボレロ ----
    ["cw_shortcardi", "ショート カーディガン", "たけの みじかい ピンクの カーディガン。パールの ボタン。", 440, { sp: 2 }, { c: "#F6B5C8", a: W, i: W, open: 0.22, sl: "long", front: "pearls", rib: true, hem: 0.5, innerHem: 0.64 }],
    ["cw_bolero", "レースの ボレロ", "かたに はおる みじかい レースの ボレロ。バレエの ような きぶん。", 460, { sp: 2, spd: 1 }, { c: W, a: "#E8D9C4", i: "#F2C6D2", pat: "lace", pc: "#E8D9C4", open: 0.42, sl: "puff", hem: 0.36, innerHem: 0.64 }],
    ["cw_wrapcardi", "ラップ カーディガン", "まえで かさねて よこで むすぶ バレエの カーディガン。", 460, { spd: 2 }, { c: "#F2C9CF", a: "#E3A7B0", i: W, wrap: true, sl: "long", rib: true, hem: 0.6 }],
    ["cw_longcardi", "ロング カーディガン", "ひざまで ある ながい カーディガン。ポケット つき。", 480, { def: 1, hp: 2 }, { c: "#D9C4A3", a: "#B9A27D", i: W, open: 0.2, sl: "long", front: "buttons", pocket: "low", rib: true, hem: 1 }],
    // ---- ワンピース・ジャンパースカート ----
    ["cw_gingham", "ティアード ワンピース", "ピンクの ギンガム チェックの キャミ ワンピース。3だんの フリル。", 560, { sp: 2, hp: 1 }, { c: "#F48FB1", a: W, i: W, pc: W, pat: "gingham", cami: true, sl: "short", slc: "i", skirt: "tiered" }],
    ["cw_polka", "みずたまの ワンピース", "こんいろに しろい みずたま。まるい えりの ワンピース。", 520, { sp: 2 }, { c: "#2F3E66", a: W, pc: W, pat: "dots", sl: "puff", collar: "round", skirt: "flare" }],
    ["cw_floralmaxi", "はながらの マキシ ワンピース", "あしもとまで ながい はながらの ワンピース。", 560, { hp: 2, sp: 1 }, { c: "#FFE7A8", a: "#F28B82", pc: "#F28B82", pc2: "#8BCB6B", pat: "flowers", sl: "puff", collar: "crew", skirt: "maxi" }],
    ["cw_pleatop", "プリーツ ワンピース", "こまかい ひだの スカートと しろい えり。セージいろ。", 520, { def: 1, sp: 1 }, { c: "#7FB7A4", a: W, sl: "short", collar: "shirt", belt: true, skirt: "pleats" }],
    ["cw_knitop", "ニット ワンピース", "タートルネックの あったかい ニットの ワンピース。", 540, { def: 2, hp: 1 }, { c: "#C98B6B", a: "#A96E52", pc: "#A96E52", pat: "ribv", sl: "long", collar: "turtle", rib: true, skirt: "straight" }],
    ["cw_tutu", "チュールの バレエ ワンピース", "ふわふわ かさなる チュールの スカート。バレエコアの ワンピース。", 600, { spd: 2, sp: 1 }, { c: "#F7D1DC", a: "#FBE3EA", cami: true, sl: "none", skirt: "tutu" }],
    ["cw_corduroyjsk", "コーデュロイの ジャンスカ", "たての うねが ある ブラウンの ジャンパースカート。まるえりの ブラウスと。", 520, { def: 2 }, { c: "#9C6B4A", a: W, i: W, pc: "#7E5236", pat: "cord", bib: true, sl: "puff", slc: "i", collar: "round", skirt: "flare" }],
    ["cw_checkjsk", "チェックの ジャンスカ", "あかい チェックの ジャンパースカート。むねに ボタン。", 520, { def: 1, sp: 1 }, { c: "#C94C4C", a: "#2E3A5C", i: "#FFF7E6", pc: "#2E3A5C", pat: "check", bib: true, sl: "long", slc: "i", collar: "shirt", skirt: "pleats" }],
    // ---- コート ----
    ["cw_duffle", "ダッフル コート", "きの トグルと ひもで とめる キャメルの コート。フード つき。", 620, { def: 3, hp: 1 }, { c: "#C99A62", a: "#F3E3C3", sl: "long", collar: "hood", front: "toggle", pocket: "low", hem: 1 }],
    ["cw_pea", "ピーコート", "こんいろの ダブルの コート。きんの ボタンが 2れつ。", 620, { def: 3 }, { c: "#2E3A5C", a: GOLD, sl: "long", collar: "lapel", front: "double", hem: 1 }],
    ["cw_trench", "トレンチ コート", "ベルトを むすぶ ベージュの コート。えりと ダブルの ボタン。", 640, { def: 2, spd: 1 }, { c: "#D8BE8E", a: "#8A6E45", sl: "long", collar: "lapel", front: "double", belt: true, hem: 1 }],
    ["cw_down", "ダウン ジャケット", "ぷっくり ふくらんだ ダウン。ゆきの ひも あったか。", 620, { def: 3, hp: 2 }, { c: "#6FA8DC", a: "#4D86BD", pc: "#4D86BD", pat: "puffer", sl: "long", collar: "stand", front: "zip", hem: 0.78 }],
    ["cw_boa", "ボアの ブルゾン", "もこもこの ボアの ブルゾン。ポケットは ブラウン。", 600, { def: 2, hp: 2 }, { c: "#F5EDE0", a: "#9C7656", pc: "#E2D6C2", pat: "boa", sl: "long", collar: "stand", front: "zip", pocket: "low", hem: 0.74 }],
    ["cw_poncho", "ノルディックの ポンチョ", "あたまから かぶる ニットの ポンチョ。すそに フリンジ。", 560, { def: 2, sp: 1 }, { c: "#5E8C6A", a: W, pc: W, poncho: true, sl: "none", hem: 0.7 }],
    // ---- ジャケット ----
    ["cw_sukajan", "スカジャン", "つやつやの サテンに はなの ししゅう。よこすかの ジャンパーが もとだよ。", 620, { atk: 2, spd: 1 }, { c: "#22305A", a: "#C64B5A", pc: GOLD, sl: "long", slc: "a", collar: "stand", front: "zip", rib: true, emb: "flower", hem: 0.72 }],
    ["cw_ma1", "MA-1 ジャケット", "オリーブいろの フライト ジャケット。うらは オレンジ。", 600, { atk: 2, def: 1 }, { c: "#6E7A4E", a: "#F28C28", sl: "long", collar: "stand", front: "zip", rib: true, ribc: "#3B3B3B", hem: 0.72 }],
    ["cw_gjean", "デニム ジャケット", "むねに ポケットの ある デニムの ジャケット。オレンジの ステッチ。", 560, { atk: 1, def: 2 }, { c: "#5B7DB8", a: "#F2B04A", sl: "long", collar: "shirt", front: "buttons", pocket: "flap", stitch: true, hem: 0.7 }],
    ["cw_tailored", "テーラード ジャケット", "グレンチェックの きちんと ジャケット。なかは しろい Tシャツ。", 620, { def: 2, sp: 1 }, { c: "#7D8597", a: "#5B6273", i: W, pc: "#5B6273", pat: "check", open: 0.2, sl: "long", collar: "lapel", front: "buttons", pocket: "low", hem: 0.8 }],
    ["cw_riders", "ライダース ジャケット", "ななめの ファスナーの くろい ジャケット。ぎんの スタッズ。", 640, { atk: 3 }, { c: "#2B2B2E", a: "#C9CED6", sl: "long", collar: "lapel", front: "asym", belt: true, hem: 0.68 }],
    ["cw_varsity", "スタジャン", "こんいろの からだに しろい そで。むねに ほしの ワッペン。", 600, { atk: 2, hp: 1 }, { c: "#2F4B8F", a: W, pc: "#E35D5B", sl: "long", slc: "a", collar: "stand", front: "snap", rib: true, ribs: true, patch: "star", hem: 0.72 }],
    // ---- スウェット・パーカー・ジャージ ----
    ["cw_college", "カレッジ スウェット", "むねに ほしと アーチの もようの グレーの スウェット。", 420, { atk: 1, hp: 1 }, { c: "#B9BEC8", a: "#2F4B8F", sl: "long", collar: "crew", rib: true, emb: "college", hem: 0.7 }],
    ["cw_zipparka", "ジップ パーカー", "ミントいろの ジップ パーカー。おなかに ポケット。", 440, { spd: 1, hp: 1 }, { c: "#9ED3C6", a: W, sl: "long", collar: "hood", front: "zip", pocket: "kanga", rib: true, hem: 0.72 }],
    ["cw_jersey", "ジャージ", "そでに しろい ライン。ピンクの ジャージ。", 400, { spd: 2 }, { c: "#F48FB1", a: W, sl: "long", collar: "stand", front: "zip", slstripe: true, hem: 0.72 }],
    // ---- きもの・コスチューム ----
    ["cw_maid", "メイドふく", "くろい ワンピースに しろい フリルの エプロン。", 620, { def: 1, sp: 2 }, { c: "#2B2B35", a: W, sl: "puff", collar: "round", apron: "frill", skirt: "flare" }],
    ["cw_china", "チャイナ ふく", "たちえりと くるみ ボタンの あかい チャイナ ドレス。", 620, { spd: 2, atk: 1 }, { c: "#D33C3C", a: GOLD, sl: "short", collar: "mandarin", front: "frog", pat: "china", pc: GOLD, skirt: "straight" }],
    ["cw_jinbei", "じんべい", "あいいろの なつの きもの。まえを ひもで むすぶ。", 440, { spd: 1, hp: 1 }, { c: "#4F6FA3", a: W, pc: "#7E98C4", pat: "asanoha", sl: "short", collar: "cross", hem: 0.72 }],
    ["cw_kappogi", "かっぽうぎ", "そでまで ある しろい エプロン。ちいさな はなの もよう。", 420, { def: 1, hp: 1 }, { c: "#FFF6F8", a: "#F48FB1", pc: "#F8BBD0", pc2: "#BFE8D6", pat: "minifl", sl: "long", collar: "crew", pocket: "low", hem: 0.86 }],
  ];
  const SPEC = Object.fromEntries(LIST.map((e) => [e[0], e[5]]));

  // ---- てつだい ----
  const K = (s) => (s === undefined ? "" : f2(s));
  const ln = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const side = (ctx) => ctx.view === "side";
  const cxOf = (ctx) => ctx.a.torso.cx + (side(ctx) ? ctx.dx * 0.45 : 0);
  // そで: うで（だ円）を まわした ざひょうで きる。frac は かたから どこまで（short 0.46・long 0.84）。パフは かたの ふくらみ
  const sleeveSvg = (ctx, sp, color) => {
    if (sp.sl === "none") return "";
    const frac = sp.sl === "long" ? 0.84 : sp.sl === "puff" ? 0.44 : 0.48, cuff = sp.rib ? sp.ribc || shade(color, -0.12) : null;
    return ctx.p.arms.map((ar, i) => {
      const id = `cwsl${i}${ctx.uid}`;
      if (ar.path) {
        // ごじ: よこに のびる うで（clipX が かたがわ）。ながそでは そとがわへ のばす
        const [x0, x1] = ar.clipX, L = x1 - x0, left = i === 0;
        const a = sp.sl === "long" ? (left ? x1 - L * 1.55 : x0) : x0, b = sp.sl === "long" ? (left ? x1 : x0 + L * 1.55) : x1;
        const end = left ? a : b;
        // うでの かたちで きって、かた〜そでぐちを ぬる（そでぐちの せんも うでの なか）
        let g = `<clipPath id="${id}"><path d="${ar.path}"/></clipPath><g clip-path="url(#${id})"><rect x="${f2(a)}" y="80" width="${f2(b - a)}" height="80" fill="${color}"/>`;
        if (sp.slstripe) g += ln(`M${f2(a)},104 H${f2(b)}`, sp.a, 4);
        if (cuff) g += `<rect x="${f2(left ? end : end - 6)}" y="80" width="6" height="80" fill="${cuff}"/>` + ln(`M${f2(left ? end + 6 : end - 6)},80 V160`, INK, 2.6);
        g += ln(`M${f2(end)},80 V160`, INK, 3.4) + `</g><path d="${ar.path}" fill="none" ${stroke()}/>`;
        if (sp.sl === "puff") g += `<ellipse cx="${f2((x0 + x1) / 2)}" cy="118" rx="${f2(L / 2 + 3)}" ry="21" fill="${color}" ${stroke()}/>`;
        return g;
      }
      const top = ar.cy - ar.ry - 3, h = (ar.ry * 2 + 6) * frac, rot = `rotate(${ar.rot} ${ar.cx} ${ar.cy})`;
      let g = `<clipPath id="${id}"><ellipse cx="${ar.cx}" cy="${ar.cy}" rx="${ar.rx}" ry="${ar.ry}" transform="${rot}"/></clipPath>`;
      g += `<g clip-path="url(#${id})"><g transform="${rot}"><rect x="${f2(ar.cx - ar.rx - 3)}" y="${f2(top)}" width="${f2(ar.rx * 2 + 6)}" height="${f2(h)}" fill="${color}"/>`;
      if (sp.slstripe) g += `<rect x="${f2(ar.cx - 1.6 + (i ? -ar.rx * 0.35 : ar.rx * 0.35))}" y="${f2(top)}" width="3.2" height="${f2(h)}" fill="${sp.a}"/>`;
      if (cuff) g += `<rect x="${f2(ar.cx - ar.rx - 3)}" y="${f2(top + h - 4.5)}" width="${f2(ar.rx * 2 + 6)}" height="4.5" fill="${cuff}"/>`;
      g += ln(`M${f2(ar.cx - ar.rx - 3)},${f2(top + h)} H${f2(ar.cx + ar.rx + 3)}`, INK, 3) + `</g></g>`;
      g += `<ellipse cx="${ar.cx}" cy="${ar.cy}" rx="${ar.rx}" ry="${ar.ry}" transform="${rot}" fill="none" ${stroke()}/>`;
      if (sp.sl === "puff") g += `<g transform="${rot}"><ellipse cx="${ar.cx}" cy="${f2(ar.cy - ar.ry * 0.5)}" rx="${f2(ar.rx * 1.3)}" ry="${f2(ar.ry * 0.55)}" fill="${color}" ${stroke(3.5)}/>${ln(`M${f2(ar.cx - ar.rx * 0.6)},${f2(ar.cy - ar.ry * 0.62)} q${f2(ar.rx * 0.3)},${f2(ar.ry * 0.3)} 0,${f2(ar.ry * 0.5)} M${f2(ar.cx + ar.rx * 0.6)},${f2(ar.cy - ar.ry * 0.62)} q${f2(-ar.rx * 0.3)},${f2(ar.ry * 0.3)} 0,${f2(ar.ry * 0.5)}`, shade(color, -0.18), 1.6)}</g>`;
      return g;
    }).join("");
  };
  // もよう（からだの 中。y0〜y1）
  const pattern = (ctx, sp, y0, y1) => {
    const T = ctx.a.torso, c = sp.pc || sp.a, c2 = sp.pc2 || c, cx = cxOf(ctx);
    let o = "";
    const rows = (gap, fn) => { for (let y = y0, j = 0; y < y1; y += gap, j++) o += fn(y, j); };
    switch (sp.pat) {
      case "wide": rows(20, (y) => `<rect x="0" y="${f2(y + 6)}" width="210" height="9" fill="${c}"/>`); break;
      case "check": case "gingham": {
        const g = sp.pat === "gingham" ? 10 : 12, op = sp.pat === "gingham" ? 0.55 : 0.45, w = sp.pat === "gingham" ? 5 : 3;
        for (let x = 4; x < 210; x += g) o += `<rect x="${x}" y="${f2(y0)}" width="${w}" height="${f2(y1 - y0)}" fill="${c}" opacity="${op}"/>`;
        rows(g, (y) => `<rect x="0" y="${f2(y + 3)}" width="210" height="${w}" fill="${c}" opacity="${op}"/>`);
        if (sp.pat === "check") for (let x = 10; x < 210; x += 24) o += `<rect x="${x}" y="${f2(y0)}" width="1.4" height="${f2(y1 - y0)}" fill="${sp.a}" opacity="0.7"/>`;
        break;
      }
      case "dots": rows(14, (y, j) => { let s = ""; for (let x = 6 + (j % 2) * 7; x < 210; x += 14) s += `<circle cx="${x}" cy="${f2(y + 7)}" r="2.8" fill="${c}"/>`; return s; }); break;
      case "hearts": rows(18, (y, j) => { let s = ""; for (let x = 10 + (j % 2) * 10; x < 210; x += 20) s += `<path d="${heartPath(x, y + 8, 0.75)}" fill="${c}"/>`; return s; }); break;
      case "flowers": case "minifl": case "aloha": {
        const big = sp.pat === "aloha", gap = big ? 26 : sp.pat === "minifl" ? 16 : 20, r = big ? 5.2 : sp.pat === "minifl" ? 2.2 : 3.2;
        rows(gap, (y, j) => { let s = ""; for (let x = 8 + (j % 2) * gap / 2; x < 210; x += gap) {
          const yy = y + gap / 2, col = (Math.round(x / gap) + j) % 2 && sp.pat !== "aloha" ? c2 : c;
          if (big) s += `<path d="M${f2(x + 3)},${f2(yy + 3)} q8,-2 10,6 q-8,2 -10,-6 Z" fill="#2E7D5B" opacity="0.85"/>`;
          for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2; s += `<circle cx="${f2(x + Math.cos(an) * r)}" cy="${f2(yy + Math.sin(an) * r)}" r="${f2(r * 0.72)}" fill="${col}"/>`; }
          s += `<circle cx="${x}" cy="${f2(yy)}" r="${f2(r * 0.5)}" fill="${big ? "#FFE07A" : W}"/>`;
        } return s; });
        break;
      }
      case "nordic": {
        // うえと したに ギザギザの おび・まんなかに ゆきの けっしょう
        const z = (y) => { let d = `M0,${f2(y)}`; for (let x = 0; x <= 210; x += 8) d += ` L${x + 4},${f2(y + ((x / 8) % 2 ? -4 : 4))}`; return ln(d, c, 2.6); };
        const ym = (y0 + y1) / 2;
        o += `<rect x="0" y="${f2(y0 + 2)}" width="210" height="5" fill="${c}"/>` + z(y0 + 13) + z(y1 - 12);
        for (let x = cx - 36; x <= cx + 36; x += 18) { o += ln(`M${f2(x - 5)},${f2(ym)} H${f2(x + 5)} M${f2(x)},${f2(ym - 5)} V${f2(ym + 5)} M${f2(x - 3.5)},${f2(ym - 3.5)} L${f2(x + 3.5)},${f2(ym + 3.5)} M${f2(x + 3.5)},${f2(ym - 3.5)} L${f2(x - 3.5)},${f2(ym + 3.5)}`, c, 1.8); }
        break;
      }
      case "fairisle": {
        const cols = [sp.a, c, c2];
        rows(9, (y, j) => {
          const col = cols[j % 3]; let s = "";
          if (j % 2) s += `<rect x="0" y="${f2(y + 3)}" width="210" height="2.4" fill="${col}"/>`;
          else for (let x = 3; x < 210; x += 7) s += `<path d="M${x},${f2(y + 4)} l3,-3 l3,3 l-3,3 Z" fill="${col}"/>`;
          return s;
        });
        break;
      }
      case "cable": for (let x = cx - 30; x <= cx + 30; x += 15) { let d = `M${f2(x)},${f2(y0)}`; for (let y = y0; y < y1; y += 8) d += ` q4,4 0,8`; o += ln(d, c, 2.2); o += ln(`M${f2(x - 6)},${f2(y0)} V${f2(y1)} M${f2(x + 6)},${f2(y0)} V${f2(y1)}`, c, 1.2); } break;
      case "fuzzy": rows(7, (y, j) => { let s = ""; for (let x = 3 + (j % 2) * 4; x < 210; x += 8) s += ln(`M${x},${f2(y + 3)} l${j % 2 ? 2 : -2},-2.6`, c, 1.4); return s; }); break;
      case "ribv": case "cord": for (let x = 4; x < 210; x += sp.pat === "cord" ? 5 : 7) o += ln(`M${x},${f2(y0)} V${f2(y1)}`, c, sp.pat === "cord" ? 1.6 : 1.3); break;
      case "argyle": rows(18, (y, j) => { let s = ""; for (let x = (j % 2) * 10; x < 220; x += 20) s += `<path d="M${x},${f2(y)} l10,9 l-10,9 l-10,-9 Z" fill="${c}" opacity="0.9"/>`; s += ln(`M0,${f2(y)} L210,${f2(y + 18 * 10.5)}`, c2, 0); return s; });
        for (let x = -200; x < 210; x += 20) o += ln(`M${x},${f2(y0)} l${f2(y1 - y0)},${f2(y1 - y0)}`, c2, 1) + ln(`M${x + 200},${f2(y0)} l${f2(-(y1 - y0))},${f2(y1 - y0)}`, c2, 1);
        break;
      case "quilt": case "puffer": rows(sp.pat === "puffer" ? 11 : 13, (y) => ln(`M0,${f2(y + 9)} H210`, c, sp.pat === "puffer" ? 2.4 : 1.8)); break;
      case "boa": rows(6, (y, j) => { let s = ""; for (let x = 2 + (j % 2) * 3; x < 210; x += 6) s += `<circle cx="${x}" cy="${f2(y + 3)}" r="1.9" fill="${c}"/>`; return s; }); break;
      case "lace": rows(9, (y, j) => { let s = ""; for (let x = (j % 2) * 5; x < 210; x += 10) s += `<circle cx="${x}" cy="${f2(y + 4)}" r="2.6" fill="none" stroke="${c}" stroke-width="1.2"/>`; return s; }); break;
      case "china": for (let k = 0; k < 3; k++) { const x = cx - 20 + k * 22, y = y0 + 14 + (k % 2) * 20; o += `<circle cx="${f2(x)}" cy="${f2(y)}" r="5" fill="none" stroke="${c}" stroke-width="1.6"/>` + ln(`M${f2(x - 3)},${f2(y)} h6 M${f2(x)},${f2(y - 3)} v6`, c, 1.4); } break;
      case "asanoha": rows(12, (y, j) => { let s = ""; for (let x = (j % 2) * 7; x < 210; x += 14) s += ln(`M${x},${f2(y)} l7,6 l-7,6 l-7,-6 Z M${x},${f2(y)} V${f2(y + 12)} M${x - 7},${f2(y + 6)} H${x + 7}`, c, 1); return s; }); break;
    }
    return o;
  };
  // えり（くびの まわり。neckWrap の ローカル: くびの まんなか 0,0・はば 100）
  const collarSvg = (ctx, sp) => {
    const back = ctx.view === "back", a = sp.a, c = sp.c;
    switch (sp.collar) {
      case "round": return neckWrap(ctx, (s) => back ? `<path d="M-46,-2 C-20,10 20,10 46,-2 L44,8 C20,20 -20,20 -44,8 Z" fill="${a}" ${stroke(s)}/>` :
        `<path d="M0,2 C-10,2 -38,-4 -46,2 C-52,22 -24,30 0,10 Z" fill="${a}" ${stroke(s)}/><path d="M0,2 C10,2 38,-4 46,2 C52,22 24,30 0,10 Z" fill="${a}" ${stroke(s)}/>` + (sp.a2 ? `<path d="M0,10 L-12,2 L-12,18 Z M0,10 L12,2 L12,18 Z" fill="${sp.a2}" ${stroke(s * 0.6)}/><circle cx="0" cy="10" r="3.5" fill="${sp.a2}" ${stroke(s * 0.5)}/>` : ""));
      case "sailor": return neckWrap(ctx, (s) => back
        ? `<path d="M-46,-6 L46,-6 L44,44 L-44,44 Z" fill="${a}" ${stroke(s)}/>${ln("M-38,36 H38 M-38,2 V36 M38,2 V36", W, s * 0.7)}`
        : `<path d="M-50,-4 L-6,46 L0,34 L6,46 L50,-4 C40,8 20,12 0,12 C-20,12 -40,8 -50,-4 Z" fill="${a}" ${stroke(s)}/>${ln("M-40,6 L-6,40 M40,6 L6,40", W, s * 0.6)}<path d="M0,30 L-14,24 L-12,40 Z M0,30 L14,24 L12,40 Z" fill="${sp.a2}" ${stroke(s * 0.7)}/><path d="M-4,32 L-9,58 L0,52 L9,58 L4,32 Z" fill="${sp.a2}" ${stroke(s * 0.7)}/>`);
      case "frill": return neckWrap(ctx, (s) => { let o = ""; const n = back ? 9 : 8; for (let i = 0; i < n; i++) { const t = i / (n - 1), x = -44 + t * 88, y = 4 + Math.sin(t * Math.PI) * (back ? 4 : 12); o += `<circle cx="${f2(x)}" cy="${f2(y)}" r="9" fill="${a}" ${stroke(s * 0.6)}/>`; } return o; });
      case "bow": return neckWrap(ctx, (s) => `<path d="M-46,-4 C-20,6 20,6 46,-4 L46,4 C20,14 -20,14 -46,4 Z" fill="${c}" ${stroke(s)}/>` + (back ? "" : `<path d="M-3,12 L-12,46 L-2,42 Z M3,12 L12,46 L2,42 Z" fill="${a}" ${stroke(s * 0.7)}/><path d="M0,12 C-12,0 -30,2 -28,12 C-30,22 -12,24 0,12 Z M0,12 C12,0 30,2 28,12 C30,22 12,24 0,12 Z" fill="${a}" ${stroke(s * 0.8)}/><circle cx="0" cy="12" r="5" fill="${shade(a, -0.12)}" ${stroke(s * 0.6)}/>`));
      case "shirt": { const sc = sp.i && (sp.vest || sp.bib) ? sp.i : sp.pat === "wide" ? sp.a : sp.collarc || (sp.i || c); return neckWrap(ctx, (s) => back ? `<path d="M-44,-6 C-20,4 20,4 44,-6 L42,10 C20,18 -20,18 -42,10 Z" fill="${sc}" ${stroke(s)}/>` : `<path d="M-2,4 L-42,-6 L-30,26 Z" fill="${sc}" ${stroke(s)}/><path d="M2,4 L42,-6 L30,26 Z" fill="${sc}" ${stroke(s)}/>`); }
      case "turtle": return neckWrap(ctx, (s) => `<path d="M-48,-14 C-20,-6 20,-6 48,-14 L50,12 C20,22 -20,22 -50,12 Z" fill="${c}" ${stroke(s)}/>${ln("M-36,-8 V14 M-18,-4 V18 M0,-3 V19 M18,-4 V18 M36,-8 V14", shade(c, -0.15), s * 0.45)}`);
      case "crew": return neckWrap(ctx, (s) => `<path d="M-46,-4 C-20,6 20,6 46,-4 L46,4 C20,14 -20,14 -46,4 Z" fill="${shade(c, -0.08)}" ${stroke(s * 0.8)}/>`);
      case "stand": return neckWrap(ctx, (s) => `<path d="M-46,-8 C-20,2 20,2 46,-8 L46,8 C20,18 -20,18 -46,8 Z" fill="${sp.ribc || c}" ${stroke(s)}/>` + (sp.rib && !sp.ribc ? ln("M-46,0 C-20,10 20,10 46,0", shade(c, -0.2), s * 0.5) : ""));
      case "mandarin": return neckWrap(ctx, (s) => `<path d="M-44,-8 C-20,2 20,2 44,-8 L44,6 C20,16 -20,16 -44,6 Z" fill="${c}" ${stroke(s)}/>${ln("M-42,2 C-20,12 20,12 42,2", a, s * 0.6)}`);
      case "hood": return neckWrap(ctx, (s) => back
        ? `<path d="M-50,-10 C-56,30 -30,58 0,58 C30,58 56,30 50,-10 C20,0 -20,0 -50,-10 Z" fill="${c}" ${stroke(s)}/>${ln("M-30,6 C-24,36 24,36 30,6", shade(c, -0.2), s * 0.6)}`
        : `<path d="M-52,-12 C-30,-2 -14,4 0,4 C14,4 30,-2 52,-12 L50,8 C24,20 -24,20 -50,8 Z" fill="${c}" ${stroke(s)}/>${sp.front === "zip" ? "" : ""}${ln("M-10,10 V36 M10,10 V36", sp.a, s * 0.55)}<circle cx="-10" cy="38" r="3" fill="${sp.a}"/><circle cx="10" cy="38" r="3" fill="${sp.a}"/>`);
      case "lapel": return back ? neckWrap(ctx, (s) => `<path d="M-46,-6 C-20,4 20,4 46,-6 L44,10 C20,18 -20,18 -44,10 Z" fill="${c}" ${stroke(s)}/>`) : neckWrap(ctx, (s) => `<path d="M-6,4 L-44,-6 L-36,22 L-22,26 L-8,58 Z" fill="${shade(c, -0.1)}" ${stroke(s)}/><path d="M6,4 L44,-6 L36,22 L22,26 L8,58 Z" fill="${shade(c, -0.1)}" ${stroke(s)}/>`);
      case "cross": return back ? neckWrap(ctx, (s) => `<path d="M-46,-6 C-20,4 20,4 46,-6 L46,4 C20,14 -20,14 -46,4 Z" fill="${shade(c, -0.15)}" ${stroke(s)}/>`) : "";
    }
    return "";
  };
  // まえの とめかた（からだの 中・まえと よこ）
  const frontSvg = (ctx, sp, y0, y1) => {
    if (ctx.view === "back" || !sp.front) return "";
    const cx = cxOf(ctx), n = 3, at = (k) => y0 + 8 + (k * (y1 - y0 - 16)) / Math.max(1, n - 1);
    const dots = (x, col, r = 3) => Array.from({ length: n }, (_, k) => `<circle cx="${f2(x)}" cy="${f2(at(k))}" r="${r}" fill="${col}" ${stroke(1.8)}/>`).join("");
    switch (sp.front) {
      case "buttons": return dots(cx, sp.open ? "#FFFFFF" : shade(sp.c, sp.c === W ? -0.1 : 0.45), 2.6) + (sp.open ? "" : ln(`M${f2(cx - 4)},${f2(y0 + 2)} V${f2(y1)}`, shade(sp.c, -0.2), 1.6));
      case "pearls": return dots(cx + (sp.open ? -ctx.a.torso.w * sp.open * 0.5 - 2 : 0), W, 3.2);
      case "placket": return `<rect x="${f2(cx - 5)}" y="${f2(y0)}" width="10" height="${f2((y1 - y0) * 0.36)}" fill="${W}" ${stroke(2)}/>` + `<circle cx="${f2(cx)}" cy="${f2(y0 + 8)}" r="2" fill="${INK}"/><circle cx="${f2(cx)}" cy="${f2(y0 + 16)}" r="2" fill="${INK}"/>`;
      case "zip": return ln(`M${f2(cx)},${f2(y0)} V${f2(y1)}`, INK, 2.6) + ln(`M${f2(cx)},${f2(y0)} V${f2(y1)}`, sp.pat === "boa" ? "#9C7656" : "#D7DCE3", 1.2) + `<rect x="${f2(cx - 2.5)}" y="${f2(y0 + 6)}" width="5" height="9" rx="1.5" fill="#D7DCE3" ${stroke(1.6)}/>` + (sp.a && sp.collar === "stand" && sp.ribc ? ln(`M${f2(cx + 3)},${f2(y0)} V${f2(y1)}`, sp.a, 2) : "");
      case "double": return dots(cx - 9, sp.a, 2.8) + dots(cx + 9, sp.a, 2.8);
      case "snap": return dots(cx, sp.a, 2.8) + ln(`M${f2(cx)},${f2(y0)} V${f2(y1)}`, INK, 1.8);
      case "toggle": return Array.from({ length: 3 }, (_, k) => { const y = at(k); return `<rect x="${f2(cx - 7)}" y="${f2(y - 2.2)}" width="14" height="4.4" rx="2.2" fill="${sp.a}" ${stroke(1.6)}/>` + ln(`M${f2(cx - 10)},${f2(y)} H${f2(cx - 7)} M${f2(cx + 7)},${f2(y)} H${f2(cx + 11)}`, "#6B4A2B", 1.6); }).join("") + ln(`M${f2(cx + 1)},${f2(y0)} V${f2(y1)}`, shade(sp.c, -0.25), 1.6);
      case "frog": return Array.from({ length: 3 }, (_, k) => { const y = y0 + 10 + k * 10, x = cx + 6 + k * 5; return ln(`M${f2(x - 6)},${f2(y)} H${f2(x + 6)}`, sp.a, 2.4) + `<circle cx="${f2(x - 6)}" cy="${f2(y)}" r="2.2" fill="${sp.a}" ${stroke(1)}/><circle cx="${f2(x + 6)}" cy="${f2(y)}" r="2.2" fill="${sp.a}" ${stroke(1)}/>`; }).join("") + ln(`M${f2(cx - 2)},${f2(y0)} C${f2(cx + 4)},${f2(y0 + 10)} ${f2(cx + 22)},${f2(y0 + 12)} ${f2(cx + 22)},${f2(y0 + 30)}`, INK, 2);
      case "asym": return ln(`M${f2(cx - 12)},${f2(y0 + 4)} L${f2(cx + 8)},${f2(y1)}`, INK, 2.6) + ln(`M${f2(cx - 12)},${f2(y0 + 4)} L${f2(cx + 8)},${f2(y1)}`, sp.a, 1.2) + [0, 1, 2].map((k) => `<circle cx="${f2(cx + 16)}" cy="${f2(y0 + 8 + k * 7)}" r="1.8" fill="${sp.a}" ${stroke(0.9)}/>`).join("");
    }
    return "";
  };
  // スカート（からだの そとに ひろがる。waist〜hem）
  const skirtSvg = (ctx, sp, waist) => {
    const T = ctx.a.torso, c = sp.c, a = sp.a, hw = T.w / 2 + 4, cx = T.cx;
    const kind = sp.skirt, hem = kind === "maxi" ? T.bottom + 6 : kind === "tutu" ? T.bottom - 12 : T.bottom - 6;
    const flare = T.w * (kind === "straight" ? 0.04 : kind === "tutu" ? 0.5 : kind === "maxi" ? 0.3 : 0.24);
    const shape = (fl, h, fill, extra = "") => `<path d="M${f2(cx - hw + 2)},${f2(waist)} C${f2(cx - hw - fl * 0.4)},${f2(waist + 14)} ${f2(cx - hw - fl)},${f2(h - 8)} ${f2(cx - hw - fl)},${f2(h)} C${f2(cx - hw / 2)},${f2(h + 8)} ${f2(cx + hw / 2)},${f2(h + 8)} ${f2(cx + hw + fl)},${f2(h)} C${f2(cx + hw + fl)},${f2(h - 8)} ${f2(cx + hw + fl * 0.4)},${f2(waist + 14)} ${f2(cx + hw - 2)},${f2(waist)} Z" fill="${fill}" ${stroke()} ${extra}/>`;
    const id = `cwsk${ctx.uid}`;
    let o = shape(flare, hem, c);
    // スカートの もよう（スカートの かたちで きる）
    if (sp.pat && !["nordic", "cable", "china", "fairisle"].includes(sp.pat)) o += `<clipPath id="${id}"><path d="M${f2(cx - hw - flare - 4)},${f2(waist)} H${f2(cx + hw + flare + 4)} V${f2(hem + 9)} H${f2(cx - hw - flare - 4)} Z"/></clipPath>` +
      `<clipPath id="${id}b">${shape(flare, hem, "#000").replace(/ stroke="[^"]*" stroke-width="[^"]*" stroke-linejoin="round" stroke-linecap="round"/, "")}</clipPath><g clip-path="url(#${id}b)">${pattern(ctx, sp, waist, hem + 9)}</g>` + shape(flare, hem, "none");
    if (kind === "tiered") { for (const r of [0.38, 0.7]) { const y = waist + (hem - waist) * r, w = hw + flare * (r * 1.05); o += ln(`M${f2(cx - w)},${f2(y)} C${f2(cx - w / 2)},${f2(y + 5)} ${f2(cx + w / 2)},${f2(y + 5)} ${f2(cx + w)},${f2(y)}`, INK, 3); } }
    if (kind === "pleats") for (let k = -3; k <= 3; k++) o += ln(`M${f2(cx + k * hw * 0.28)},${f2(waist + 4)} L${f2(cx + k * (hw + flare) * 0.3)},${f2(hem + 3)}`, shade(c, -0.22), 1.6);
    if (kind === "tutu") {
      // チュール: うすい だんを 2つ（すける）・ふちは なみなみ
      for (const [fl, h, op] of [[flare * 1.18, hem - 4, 0.55], [flare * 0.8, hem - 10, 0.75]]) o += shape(fl, h, a, `fill-opacity="${op}"`);
      let d = ""; for (let x = cx - hw - flare; x <= cx + hw + flare; x += 8) d += ` M${f2(x)},${f2(hem + 2)} q4,4 8,0`;
      o += ln(d, shade(c, -0.15), 1.6);
    }
    if (kind === "maxi" || kind === "flare") o += ln(`M${f2(cx - hw - flare + 4)},${f2(hem - 3)} C${f2(cx - hw / 2)},${f2(hem + 4)} ${f2(cx + hw / 2)},${f2(hem + 4)} ${f2(cx + hw + flare - 4)},${f2(hem - 3)}`, sp.pat === "dots" ? sp.a : shade(c, 0.4), 2);
    if (kind === "straight" && sp.collar === "mandarin" && ctx.view !== "back") o += ln(`M${f2(cx + hw - 6)},${f2(hem + 3)} L${f2(cx + hw - 8)},${f2(hem - 14)}`, INK, 2.4);
    return o;
  };
  // くみたて
  const draw = (ctx) => {
    const sp = SPEC[ctx.col[3]]; if (!sp) return {};
    const T = ctx.a.torso, H = T.bottom - T.top, Y = (r) => T.top + H * r, back = ctx.view === "back", cx = cxOf(ctx);
    const dress = !!sp.skirt, waist = dress ? Y(0.42) : null;
    const hem = dress ? waist + 2 : sp.hem >= 1 ? 220 : Y(sp.hem || 0.66);
    const slColor = sp.slc === "i" ? sp.i : sp.slc === "a" ? sp.a : sp.c;
    let inner = "", top = "", under = "";
    // 1. なかに きる もの（シャツ・キャミ・Tシャツ）
    if (sp.i) inner += garment(ctx, sp.innerHem ? Y(sp.innerHem) : dress ? waist + 2 : Math.max(hem, Y(0.66)), sp.i) + (sp.innerHem ? ln(`M0,${f2(Y(sp.innerHem))} H210`, INK, 3) : "");
    // 2. おもての ふく
    const body = sp.cami
      ? `<path d="M0,${f2(Y(0.2))} C${f2(cx - 20)},${f2(Y(0.14))} ${f2(cx + 20)},${f2(Y(0.14))} 210,${f2(Y(0.2))} L210,${f2(hem)} L0,${f2(hem)} Z" fill="${sp.c}"/>${ln(`M0,${f2(Y(0.2))} C${f2(cx - 20)},${f2(Y(0.14))} ${f2(cx + 20)},${f2(Y(0.14))} 210,${f2(Y(0.2))}`, INK, 3)}`
      : sp.bib
        ? `<path d="M${f2(cx - T.w * 0.24)},${f2(hem)} V${f2(Y(0.14))} H${f2(cx + T.w * 0.24)} V${f2(hem)} Z" fill="${sp.c}" ${stroke(3.2)}/>`
        : garment(ctx, hem, sp.c);
    inner += sp.sheer ? `<g opacity="0.62">${body}</g>` : body;
    const py0 = sp.cami ? Y(0.2) : T.top + 10;
    if (sp.pat && !sp.bib) inner += pattern(ctx, sp, py0, Math.min(hem, 214));
    if (sp.bib && sp.pat) inner += `<g clip-path="url(#cwbib${ctx.uid})">${pattern(ctx, sp, Y(0.14), hem)}</g>`;
    // すその リブ
    if (sp.rib && !dress && sp.hem < 1) inner += `<rect x="0" y="${f2(hem - 7)}" width="210" height="7" fill="${sp.ribc || shade(sp.c, -0.12)}"/>` + (sp.ribs ? `<rect x="0" y="${f2(hem - 5)}" width="210" height="1.6" fill="${sp.a}"/><rect x="0" y="${f2(hem - 2.6)}" width="210" height="1.6" fill="${sp.a}"/>` : "");
    if (!dress && sp.hem < 1) inner += ln(`M0,${f2(hem)} H210`, INK, 4.5);
    // ベスト（V の なかは シャツ）・まえあき・かさね
    if (!back && sp.vest) inner += `<path d="M${f2(cx - T.w * 0.2)},${f2(T.top - 2)} L${f2(cx)},${f2(Y(0.42))} L${f2(cx + T.w * 0.2)},${f2(T.top - 2)} Z" fill="${sp.i}" ${stroke(3)}/>`;
    if (!back && sp.open) { const w = T.w * sp.open; inner += `<rect x="${f2(cx - w / 2)}" y="${f2(T.top - 4)}" width="${f2(w)}" height="${f2((sp.hem >= 1 ? 220 : hem) - T.top + 4)}" fill="${sp.i}"/>` + ln(`M${f2(cx - w / 2)},${f2(T.top - 4)} V${f2(sp.hem >= 1 ? 220 : hem)} M${f2(cx + w / 2)},${f2(T.top - 4)} V${f2(sp.hem >= 1 ? 220 : hem)}`, INK, 3); if (sp.rib) inner += ln(`M${f2(cx - w / 2 - 2.5)},${f2(T.top)} V${f2(hem)} M${f2(cx + w / 2 + 2.5)},${f2(T.top)} V${f2(hem)}`, shade(sp.c, -0.14), 3.4); }
    if (!back && sp.wrap) inner += `<path d="M${f2(cx - T.w * 0.36)},${f2(T.top - 2)} L${f2(cx + T.w * 0.3)},${f2(hem)}" fill="none" ${stroke(3)}/><path d="M${f2(cx + T.w * 0.36)},${f2(T.top - 2)} L${f2(cx - T.w * 0.06)},${f2(Y(0.36))}" fill="none" ${stroke(3)}/><path d="M${f2(cx - T.w * 0.12)},${f2(T.top - 2)} L${f2(cx + T.w * 0.12)},${f2(T.top - 2)} L${f2(cx)},${f2(Y(0.18))} Z" fill="${sp.i}" ${stroke(2.6)}/>` + `<path d="M${f2(cx + T.w * 0.3)},${f2(Y(0.42))} l8,-5 l0,10 Z M${f2(cx + T.w * 0.3)},${f2(Y(0.42))} l2,14" fill="${sp.a}" ${stroke(2)}/>`;
    // ポケット・ベルト・ステッチ・ししゅう・ワッペン
    if (!back && sp.pocket === "chest") inner += `<rect x="${f2(cx - T.w * 0.36)}" y="${f2(Y(0.24))}" width="${f2(T.w * 0.2)}" height="${f2(H * 0.13)}" rx="2" fill="${sp.c}" ${stroke(2.2)}/>`;
    if (!back && sp.pocket === "flap") for (const s of [-1, 1]) inner += `<rect x="${f2(cx + s * T.w * 0.22 - T.w * 0.1)}" y="${f2(Y(0.22))}" width="${f2(T.w * 0.2)}" height="${f2(H * 0.14)}" rx="2" fill="${sp.c}" ${stroke(2.2)}/>` + `<path d="M${f2(cx + s * T.w * 0.22 - T.w * 0.1)},${f2(Y(0.22))} h${f2(T.w * 0.2)} l-${f2(T.w * 0.1)},6 Z" fill="${shade(sp.c, -0.12)}" ${stroke(2)}/>`;
    if (!back && sp.pocket === "low") for (const s of [-1, 1]) inner += `<rect x="${f2(cx + s * T.w * 0.26 - T.w * 0.11)}" y="${f2(Y(0.62))}" width="${f2(T.w * 0.22)}" height="${f2(H * 0.15)}" rx="2.5" fill="${sp.pat === "boa" ? sp.a : sp.c}" ${stroke(2.2)}/>`;
    if (!back && sp.pocket === "kanga") inner += `<path d="M${f2(cx - T.w * 0.3)},${f2(hem - 8)} L${f2(cx - T.w * 0.22)},${f2(Y(0.48))} H${f2(cx + T.w * 0.22)} L${f2(cx + T.w * 0.3)},${f2(hem - 8)} Z" fill="${sp.c}" ${stroke(2.4)}/>`;
    if (sp.stitch && !back) inner += ln(`M0,${f2(Y(0.42))} H210`, sp.a, 1.4) + ln(`M${f2(cx - T.w * 0.32)},${f2(Y(0.24))} h${f2(T.w * 0.2)} M${f2(cx + T.w * 0.12)},${f2(Y(0.24))} h${f2(T.w * 0.2)}`, sp.a, 1.2);
    if (sp.belt) { const by = dress ? waist - 4 : sp.peplum ? hem - 5 : Y(0.5); inner += `<rect x="0" y="${f2(by - 3.5)}" width="210" height="7" fill="${sp.belt === true ? shade(sp.c, -0.25) : sp.belt}"/>` + ln(`M0,${f2(by - 3.5)} H210 M0,${f2(by + 3.5)} H210`, INK, 1.8) + (back ? "" : `<rect x="${f2(cx - 5)}" y="${f2(by - 5)}" width="10" height="10" rx="1.5" fill="none" stroke="${sp.front === "asym" ? sp.a : GOLD}" stroke-width="2"/>`); }
    if (sp.emb === "flower") inner += back
      ? (() => { const y = Y(0.4); let s = ""; for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2; s += `<circle cx="${f2(cx + Math.cos(an) * 8)}" cy="${f2(y + Math.sin(an) * 8)}" r="5.6" fill="${sp.a}" ${stroke(1.4)}/>`; } return s + `<circle cx="${f2(cx)}" cy="${f2(y)}" r="4.4" fill="${GOLD}" ${stroke(1.4)}/>` + `<path d="${starPath(cx - 18, y - 12, 4, 1.8)}" fill="${GOLD}"/><path d="${starPath(cx + 18, y + 12, 4, 1.8)}" fill="${GOLD}"/>`; })()
      : [[-1, Y(0.3)], [1, Y(0.46)]].map(([s, y]) => { const x = cx + s * T.w * 0.24; let o = ""; for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2; o += `<circle cx="${f2(x + Math.cos(an) * 3.6)}" cy="${f2(y + Math.sin(an) * 3.6)}" r="2.6" fill="${sp.a}"/>`; } return o + `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.8" fill="${GOLD}"/>`; }).join("");
    if (sp.emb === "college" && !back) inner += ln(`M${f2(cx - T.w * 0.3)},${f2(Y(0.34))} Q${f2(cx)},${f2(Y(0.2))} ${f2(cx + T.w * 0.3)},${f2(Y(0.34))}`, sp.a, 4.5) + `<path d="${starPath(cx, Y(0.42), 6, 2.6)}" fill="${sp.a}"/>` + `<path d="M${f2(cx - 5)},${f2(T.top + 2)} L${f2(cx)},${f2(T.top + 9)} L${f2(cx + 5)},${f2(T.top + 2)}" fill="none" stroke="${shade(sp.c, -0.2)}" stroke-width="2"/>`;
    if (sp.patch === "star" && !back) inner += `<circle cx="${f2(cx - T.w * 0.22)}" cy="${f2(Y(0.3))}" r="${f2(T.w * 0.11)}" fill="${W}" ${stroke(2)}/><path d="${starPath(cx - T.w * 0.22, Y(0.3), T.w * 0.085, T.w * 0.038)}" fill="${sp.pc}"/>`;
    if (sp.patch === "star" && back) inner += `<path d="${starPath(cx, Y(0.36), T.w * 0.2, T.w * 0.09)}" fill="${sp.pc}" ${stroke(2.4)}/>`;
    // ジャンスカの かたひも（からだの 中）
    if (sp.bib) inner += back
      ? ln(`M${f2(cx)},${f2(waist)} L${f2(cx - T.w * 0.38)},${f2(T.top - 4)} M${f2(cx)},${f2(waist)} L${f2(cx + T.w * 0.38)},${f2(T.top - 4)}`, INK, 9) + ln(`M${f2(cx)},${f2(waist)} L${f2(cx - T.w * 0.38)},${f2(T.top - 4)} M${f2(cx)},${f2(waist)} L${f2(cx + T.w * 0.38)},${f2(T.top - 4)}`, sp.c, 4.4)
      : ln(`M${f2(cx - T.w * 0.24 + 3)},${f2(Y(0.16))} L${f2(cx - T.w * 0.4)},${f2(T.top - 6)} M${f2(cx + T.w * 0.24 - 3)},${f2(Y(0.16))} L${f2(cx + T.w * 0.4)},${f2(T.top - 6)}`, INK, 9) + ln(`M${f2(cx - T.w * 0.24 + 3)},${f2(Y(0.16))} L${f2(cx - T.w * 0.4)},${f2(T.top - 6)} M${f2(cx + T.w * 0.24 - 3)},${f2(Y(0.16))} L${f2(cx + T.w * 0.4)},${f2(T.top - 6)}`, sp.c, 4.4) + `<circle cx="${f2(cx - T.w * 0.2)}" cy="${f2(Y(0.2))}" r="2.8" fill="${GOLD}" ${stroke(1.6)}/><circle cx="${f2(cx + T.w * 0.2)}" cy="${f2(Y(0.2))}" r="2.8" fill="${GOLD}" ${stroke(1.6)}/>`;
    // キャミの かたひも
    if (sp.cami) inner += ln(`M${f2(cx - T.w * 0.26)},${f2(Y(0.18))} L${f2(cx - T.w * 0.3)},${f2(T.top - 6)} M${f2(cx + T.w * 0.26)},${f2(Y(0.18))} L${f2(cx + T.w * 0.3)},${f2(T.top - 6)}`, INK, 6) + ln(`M${f2(cx - T.w * 0.26)},${f2(Y(0.18))} L${f2(cx - T.w * 0.3)},${f2(T.top - 6)} M${f2(cx + T.w * 0.26)},${f2(Y(0.18))} L${f2(cx + T.w * 0.3)},${f2(T.top - 6)}`, sp.c, 2.4);
    // じんべいの かさねた えりと ひも
    if (sp.collar === "cross" && !back) inner += `<path d="M${f2(cx - T.w * 0.3)},${f2(T.top - 2)} L${f2(cx + T.w * 0.12)},${f2(Y(0.5))}" fill="none" stroke="${shade(sp.c, -0.2)}" stroke-width="6"/><path d="M${f2(cx + T.w * 0.3)},${f2(T.top - 2)} L${f2(cx - T.w * 0.04)},${f2(Y(0.34))}" fill="none" stroke="${shade(sp.c, -0.2)}" stroke-width="6"/>` + ln(`M${f2(cx + T.w * 0.12)},${f2(Y(0.44))} l7,6 M${f2(cx + T.w * 0.12)},${f2(Y(0.44))} l-2,9`, sp.a, 1.8);
    inner += frontSvg(ctx, sp, T.top + 2, sp.hem >= 1 ? Math.min(T.bottom - 6, Y(0.86)) : dress ? waist : hem - (sp.rib ? 7 : 2));
    // ジャンスカの むねあての きりぬき（もよう ようの clipPath）
    const defs = sp.bib && sp.pat ? `<clipPath id="cwbib${ctx.uid}"><path d="M${f2(cx - T.w * 0.24)},${f2(hem)} V${f2(Y(0.14))} H${f2(cx + T.w * 0.24)} V${f2(hem)} Z"/></clipPath>` : "";
    let torso = defs + torsoClip(ctx, inner);
    // ペプラム（すそが ひらく）
    if (sp.peplum) { const hw = T.w / 2 + 2, h2 = hem + H * 0.16; torso += `<path d="M${f2(cx - hw)},${f2(hem - 2)} C${f2(cx - hw - 6)},${f2(hem + 4)} ${f2(cx - hw - 12)},${f2(h2 - 2)} ${f2(cx - hw - 12)},${f2(h2)} C${f2(cx - hw / 2)},${f2(h2 + 6)} ${f2(cx + hw / 2)},${f2(h2 + 6)} ${f2(cx + hw + 12)},${f2(h2)} C${f2(cx + hw + 12)},${f2(h2 - 2)} ${f2(cx + hw + 6)},${f2(hem + 4)} ${f2(cx + hw)},${f2(hem - 2)} Z" fill="${sp.c}" ${stroke()}/>` + ln(`M${f2(cx - hw * 0.5)},${f2(hem + 2)} l-3,${f2(H * 0.14)} M${f2(cx + hw * 0.5)},${f2(hem + 2)} l3,${f2(H * 0.14)} M${f2(cx)},${f2(hem + 2)} v${f2(H * 0.15)}`, shade(sp.c, -0.2), 1.6); }
    // スカート・エプロン
    if (dress) torso += skirtSvg(ctx, sp, waist);
    if (sp.apron === "frill") {
      const aw = T.w * 0.36, y0 = waist + 2, y1 = T.bottom - 4;
      if (!back) { torso += `<path d="M${f2(cx - aw)},${f2(y0)} H${f2(cx + aw)} L${f2(cx + aw + 6)},${f2(y1)} H${f2(cx - aw - 6)} Z" fill="${sp.a}" ${stroke(3)}/>`; let d = ""; for (let x = cx - aw - 6; x < cx + aw + 6; x += 7) d += `<circle cx="${f2(x + 3.5)}" cy="${f2(y1 + 1.5)}" r="3.6" fill="${sp.a}" ${stroke(1.4)}/>`; torso += d + `<path d="M${f2(cx - T.w * 0.2)},${f2(waist)} L${f2(cx - T.w * 0.24)},${f2(Y(0.12))} H${f2(cx + T.w * 0.24)} L${f2(cx + T.w * 0.2)},${f2(waist)} Z" fill="${sp.a}" ${stroke(2.4)}/>`; }
      else torso += `<rect x="${f2(T.cx - T.w / 2 - 4)}" y="${f2(waist - 3)}" width="${f2(T.w + 8)}" height="6" fill="${sp.a}" ${stroke(2)}/><path d="M${f2(T.cx)},${f2(waist)} l-16,-9 l0,18 Z M${f2(T.cx)},${f2(waist)} l16,-9 l0,18 Z" fill="${sp.a}" ${stroke(2.6)}/><path d="M${f2(T.cx - 3)},${f2(waist + 2)} l-6,22 M${f2(T.cx + 3)},${f2(waist + 2)} l6,22" ${stroke(5)}/><path d="M${f2(T.cx - 3)},${f2(waist + 2)} l-6,22 M${f2(T.cx + 3)},${f2(waist + 2)} l6,22" stroke="${sp.a}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    // うしろの リボン（ワンピース）
    if (dress && back && !sp.apron && sp.skirt !== "straight") torso += `<path d="M${f2(T.cx)},${f2(waist)} l-11,-7 l0,14 Z M${f2(T.cx)},${f2(waist)} l11,-7 l0,14 Z" fill="${sp.a}" ${stroke(2.6)}/>`;
    // ポンチョ（くびから ひろがって うでの うえまで。すそに フリンジ）
    if (sp.poncho) {
      const N = ctx.a.neck, ncx = N.x + (side(ctx) ? ctx.dx * 0.25 : 0), y0 = N.y - 4, y1 = Y(0.74), w0 = N.w * 0.46, w1 = T.w * 0.88;
      const shape = `M${f2(ncx - w0)},${f2(y0)} L${f2(ncx - w1)},${f2(y1)} Q${f2(ncx)},${f2(y1 + 12)} ${f2(ncx + w1)},${f2(y1)} L${f2(ncx + w0)},${f2(y0)} Q${f2(ncx)},${f2(y0 + 8)} ${f2(ncx - w0)},${f2(y0)} Z`;
      let fr = ""; for (let k = 0; k <= 12; k++) { const t2 = k / 12, x = ncx - w1 + t2 * w1 * 2, y = y1 + Math.sin(t2 * Math.PI) * 6; fr += ln(`M${f2(x)},${f2(y)} v7`, sp.c, 2.4); }
      const zz = (y, w) => { let d = `M${f2(ncx - w)},${f2(y)}`; for (let x = -w; x <= w; x += 7) d += ` L${f2(ncx + x + 3.5)},${f2(y + ((Math.round(x / 7)) % 2 ? -3 : 3))}`; return ln(d, sp.pc, 2); };
      const yb = y0 + (y1 - y0) * 0.55, wb = w0 + (w1 - w0) * 0.55;
      top += `<g>${fr}<path d="${shape}" fill="${sp.c}" ${stroke()}/>${zz(yb, wb * 0.92)}${ln(`M${f2(ncx - wb * 0.95)},${f2(yb + 8)} H${f2(ncx + wb * 0.95)}`, sp.pc, 2.4)}${ln(`M${f2(ncx - w0 * 0.9)},${f2(y0 + 6)} Q${f2(ncx)},${f2(y0 + 14)} ${f2(ncx + w0 * 0.9)},${f2(y0 + 6)}`, sp.pc, 2)}</g>`;
    }
    top += collarSvg(ctx, sp);
    return { sleeve: sleeveSvg(ctx, sp, slColor), torso: under + torso, top };
  };

  const ITEMS = LIST.map(([id, name, desc, price, st, sp]) => ({ id, name, desc, price, st, slot: "body", wear: "cw_wear", col: [sp.c, sp.a, sp.i || sp.c, id], closet: true }));
  return { TAB, TAB_NAME, LIST, SPEC, ITEMS, draw, isCloset: (id) => !!SPEC[id] };
})();

// ---- ゲームに いれる（umbrella-items.js の あと・slow-life-prices.js の まえ）----
(() => {
  WEAR.cw_wear = (ctx) => ClosetWear.draw(ctx);
  for (const it of ClosetWear.ITEMS) { WEAR_ITEMS.push(it); ITEM_INDEX[it.id] = it; }
  // ようふくやさん: 「ふく」の たなには ださず、「トレンド」の たな（ふくの つぎ）に ならべる
  if (typeof BUY_SHOPS !== "undefined" && BUY_SHOPS.clothes) {
    const S = BUY_SHOPS.clothes, items0 = S.items;
    if (!S.tabs.some((t) => t[0] === ClosetWear.TAB)) S.tabs.splice(S.tabs.findIndex((t) => t[0] === "body") + 1, 0, [ClosetWear.TAB, ClosetWear.TAB_NAME]);
    S.items = (tab) => (tab === ClosetWear.TAB ? WEAR_ITEMS.filter((w) => w.closet && w.price > 0) : items0(tab).filter((w) => !w.closet));
  }
})();
