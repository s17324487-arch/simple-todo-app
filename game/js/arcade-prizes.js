// Meeときょれじゃ の 景品（ぬいぐるみ・マスコット・コイン）。台は js/crane-machines.js・あそぶ 画面は js/crane-scene.js。
// 3人の ぬいぐるみは Chara.svg（表情・ポーズ・こもの が ちがう 4しゅずつ）、町の人は Art.npcSvg から 絵を つくり、
// ぬのの タグ・つや を たす。家具として へやに おける（おうちの 立体は IkebukuroItemArt.model から ArcadePrizes.model）。
// コインの 景品（メダル・たからばこ）は もちものに ならず、その場で コインが ふえる（1にちの 上限 つき）。
const ArcadePrizes = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const heart = (x, y, s, c) => `<path d="M${x} ${y + s * 0.9} C${x - s * 1.3} ${y} ${x - s * 0.9} ${y - s * 0.9} ${x} ${y - s * 0.25} C${x + s * 0.9} ${y - s * 0.9} ${x + s * 1.3} ${y} ${x} ${y + s * 0.9}Z" fill="${c}"/>`;
  const NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
  // 3人の ぬいぐるみ（4しゅずつ）: [ことば, 表情, ポーズ, こもの, 絵の はんい（viewBox x y w h）, 足もとの y]
  // はんいは まえ・うしろの 絵が ぜんぶ はいる 大きさ（getBBox + 6）
  const HERO = {
    wanko: [
      ["にっこり", "smile", "idle_01", { head: "ribbon_pink" }, [5, 13, 190, 200], 207],
      ["びっくり", "surprise", "jump_01", { face: "blush" }, [10, -30, 180, 219], 183],
      ["すやすや", "sleep", "land_01", { body: "pajama" }, [-15, 25, 240, 200], 219],
      ["ぷんぷん", "angry", "idle_02", { head: "hachimaki" }, [3, 25, 194, 188], 207],
    ],
    gachan: [
      ["きらきら", "sparkle", "jump_01", { head: "crown" }, [41, -21, 118, 210], 183],
      ["にっこり", "smile", "idle_01", { head: "flowercrown" }, [39, 35, 122, 178], 207],
      ["えーん", "cry", "land_01", { neck: "bib" }, [34, 53, 132, 161], 208],
      ["すやすや", "sleep", "idle_02", { head: "knit" }, [37, 13, 145, 200], 207],
    ],
    goji: [
      ["らぶらぶ", "love", "idle_01", { neck: "bowtie_red" }, [1, 18, 200, 199], 211],
      ["がおー", "shout", "jump_01", { back: "cape" }, [-2, -37, 207, 231], 188],
      ["のんびり", "calm", "land_01", { head: "strawhat" }, [-6, 29, 214, 188], 211],
      ["びっくり", "surprise", "idle_02", { head: "partyhat" }, [-2, -19, 205, 237], 212],
    ],
  };
  // ミニマスコット（スウィートランドの ちいさな 景品。あたまに キーホルダーの わ）
  const MINI = { wanko: [5, 1, 190, 212], gachan: [39, 21, 122, 192], goji: [1, 8, 200, 209] };
  // 町の人の ぬいぐるみ: [種, なまえ, 絵の はんい, へやでの 大きさ w h depth]
  const FOLK = [
    ["bear", "くまの おおきな ぬいぐるみ", [33, 21, 134, 193], [150, 150, 70]],
    ["panda", "パンダの おおきな ぬいぐるみ", [36, 22, 128, 192], [150, 150, 70]],
    ["penguin", "ぺんぎんの ぬいぐるみ", [38, 26, 124, 188], [96, 110, 50]],
  ];
  // 景品の 一覧（家具）。spec: 絵の つくりかた・crop: viewBox・size: 'chibi' | 'mini' | 'big'
  const ITEMS = [];
  for (const [who, list] of Object.entries(HERO)) list.forEach(([word, face, pose, outfit, crop, feet], v) => ITEMS.push({
    id: `ike_chibi_${who}_${v}`, name: `${word} ${NAME[who]}の ぬいぐるみ`, spec: { who, face, pose, outfit }, crop, feet, size: "chibi", w: 76, h: 76, depth: 40,
    desc: `${word} かおの ${NAME[who]}の ぬいぐるみ。Meeときょれじゃ の クレーンの けいひん。`,
  }));
  for (const [who, crop] of Object.entries(MINI)) ITEMS.push({
    id: `ike_mini_${who}`, name: `${NAME[who]}の ミニマスコット`, spec: { who, face: who === "goji" ? "love" : "smile", pose: "idle_01", outfit: {}, mini: true }, crop, size: "mini", w: 48, h: 52, depth: 28,
    desc: `てのひらに のる ${NAME[who]}の マスコット。スウィートランドで すくえるよ。`,
  });
  for (const [sp, name, crop, [w, h, depth]] of FOLK) ITEMS.push({
    id: `ike_plush_${sp}`, name, spec: { sp, emo: "happy" }, crop, size: "big", w, h, depth,
    desc: `町の ${NpcArt.SP[sp] ? NpcArt.SP[sp].name : sp}の ふわふわ ぬいぐるみ。Meeときょれじゃ の けいひん。`,
  });
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

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
  return { NAME, HERO, MINI, FOLK, ITEMS, INDEX, svg, nest, model, install, COIN_DAY_MAX, coinState, coinLeft };
})();
ArcadePrizes.install();
