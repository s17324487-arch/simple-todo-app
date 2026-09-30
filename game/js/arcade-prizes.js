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
  for (const [who, list] of Object.entries(HERO)) list.forEach(([word, face, pose, outfit, crop, feet], v) => ITEMS.push({
    id: `ike_chibi_${who}_${v}`, name: `${word} ${NAME[who]}の ぬいぐるみ`, spec: { who, face, pose, outfit }, crop, feet, size: "chibi", w: 76, h: 76, depth: 40,
    look: `chibi-${who}-${v}`, shape: `chibi_${who}_${v}`, series: `${NAME[who]}の ぬいぐるみ`, word,
    desc: `${word} かおの ${NAME[who]}の ぬいぐるみ。Meeときょれじゃ の クレーンの けいひん。`,
  }));
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
    return Chara.svg(sp.who, { pose: sp.pose, face: sp.face, dir, outfit: sp.outfit || {}, color: "soft" });
  };
  const svg = (id, dir = "down") => {
    const it = INDEX[id]; if (!it) return "";
    const [x, y, w, h] = it.crop;
    let s = raw(it, dir).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "");
    return s.replace(/<\/svg>\s*$/, deco(it, dir) + "</svg>");
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
      // sparkle: おうちで まわりに ほしを だすか（ミニマスコットは ださない）
      const f = { id: it.id, name: it.name, price: 0, kind: "floor", w: it.w, h: it.h, depth: it.depth, comfort: it.size === "big" ? 10 : 5, rare: true, interactive: true, exclusive: "ikebukuro", arcadePrize: true, sparkle: it.size !== "mini", cityItem: { type: "arcadeplush", variant: it.id }, desc: it.desc };
      FURNITURE.push(f); FURN_INDEX[it.id] = f; FURN_ART[it.id] = () => nest(it.id, 0, 0, it.w, it.h);
    }
    // おうちの 立体: 池袋の おしなもの（cityItem）の なかで ぬいぐるみの 景品だけ ここで つくる
    const model0 = IkebukuroItemArt.model;
    IkebukuroItemArt.model = function (id, opts = {}) { return INDEX[id] ? model(id) : model0.call(this, id, opts); };
  };
  return { NAME, HERO, MINI, MINI_SP, GROUP, FOLK, ITEMS, INDEX, svg, nest, model, install, COIN_DAY_MAX, coinState, coinLeft, group };
})();
ArcadePrizes.install();
