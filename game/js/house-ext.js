// おうちの そとの パーツと ペンキ（O9・UI-74。オーナーの FB 2026-10-03「お家の外見カスタマイズ機能もつけて。それに伴い、工務店をネリカスタウンに追加して、
// そこでパーツや塗装を購入してカスタマイズできるようにして。」）
// - パーツ 10しゅ（たてもの・やね・かべ・まど・ドア・えんとつ・やねの うえ・あかり・ポスト・にわ）と ペンキ 18いろ（やね・かべ・ドア・まどわく に ぬる）。
//   たてもの（UI-91。オーナーの FB 2026-10-04「工務店について、もっと建物の形から変わるような種類を増やして。3階建てにできたり、奇抜な建物にできたりしてよい。」）:
//   いつもの・3かいだて・おしろ・きのこ・ケーキ・ツリーハウス・ユーフォー。セーブは parts.form（ない ときは いつもの）。
//   さいしょの パーツと 4いろは はじめから もって いる。かったら なんどでも つけかえられる。
// - セーブは Save.d.exterior（つかう ときに できる。こわれた ものは なおす）: parts・paint（いろの id）・owned（"やね:かたち" の id）・paints。
// - 町の「みんなの おうち」（nerikasu.bld_home）は、はじめの まま なら もとの 絵・かえたら js/house-ext-art.js の 絵（キーは えらんだ もの だけ・有限）。
// - かう・つける がめんは js/house-ext-ui.js、工務店は js/koumuten.js。
const HouseExt = (() => {
  const PAINTS = [
    { id: "cream", name: "クリーム", hex: "#F2E5CB", price: 0 }, { id: "akacha", name: "あかちゃ", hex: "#B18775", price: 0 },
    { id: "kinoiro", name: "きの いろ", hex: "#A97850", price: 0 }, { id: "kusumi", name: "くすみ みどり", hex: "#91A795", price: 0 },
    { id: "shiro", name: "しろ", hex: "#F7F4EE", price: 300 }, { id: "sakura", name: "さくら", hex: "#F3CDD3", price: 300 },
    { id: "peach", name: "ピーチ", hex: "#F6D2B4", price: 300 }, { id: "lemon", name: "レモン", hex: "#F4E3A1", price: 300 },
    { id: "mint", name: "ミント", hex: "#CDE7D2", price: 300 }, { id: "sora", name: "そら", hex: "#C7DDEF", price: 300 },
    { id: "lavender", name: "ラベンダー", hex: "#DCD0EC", price: 300 }, { id: "renga", name: "れんが", hex: "#B5654F", price: 500 },
    { id: "kogecha", name: "こげちゃ", hex: "#7E5E4B", price: 500 }, { id: "midori", name: "みどり", hex: "#6E9278", price: 500 },
    { id: "ao", name: "あお", hex: "#5D84A8", price: 500 }, { id: "murasaki", name: "むらさき", hex: "#8B78A8", price: 500 },
    { id: "sumi", name: "すみ", hex: "#55565E", price: 500 }, { id: "yamabuki", name: "やまぶき", hex: "#E3AE4A", price: 500 },
  ];
  const TARGETS = [{ id: "roof", name: "やね" }, { id: "wall", name: "かべ" }, { id: "door", name: "ドア" }, { id: "trim", name: "まどわく" }];
  const DEFAULT_PAINT = { roof: "akacha", wall: "cream", door: "kinoiro", trim: "kusumi" };
  const CATS = [
    // たてものの かたち（UI-91）。いつもの おうち・3かいだて・きばつな たてもの 5つ（つかう パーツは FORM_USES）
    { id: "form", name: "たてもの", parts: [["basic", "いつもの", 0], ["three", "3かいだて", 6800], ["castle", "おしろ", 9800], ["mushroom", "きのこ", 7800], ["cake", "ケーキ", 8800], ["tree", "ツリーハウス", 8200], ["ufo", "ユーフォー", 9200]] },
    { id: "roof", name: "やね", parts: [["gable", "きりづま", 0], ["tile", "かわら", 1800], ["steep", "とんがり", 2400], ["round", "まるやね", 2200], ["flat", "ひらやね", 2000]] },
    { id: "siding", name: "かべ", parts: [["plaster", "しっくい", 0], ["brick", "れんが", 2200], ["board", "いたばり", 1600], ["tile", "タイル", 2000], ["log", "ログ", 2600]] },
    { id: "window", name: "まど", parts: [["square", "しかく", 0], ["round", "まる", 1400], ["arch", "アーチ", 1600], ["bay", "でまど", 2400], ["lattice", "こうし", 1500]] },
    { id: "door", name: "ドア", parts: [["glass", "ガラスの ドア", 0], ["plank", "きの ドア", 1200], ["arch", "アーチの ドア", 1600], ["double", "ふたつ とびら", 2200], ["heart", "ハートの ドア", 1800]] },
    { id: "chimney", name: "えんとつ", parts: [["none", "なし", 0], ["brick", "れんが", 1500], ["stone", "いし", 1700], ["tin", "ブリキ", 1200]] },
    { id: "top", name: "やねの うえ", parts: [["none", "なし", 0], ["vane", "かざみどり", 1300], ["solar", "ソーラーパネル", 2800], ["skylight", "てんまど", 1600]] },
    { id: "lamp", name: "あかり", parts: [["basic", "いつもの", 0], ["lantern", "ランタン", 900], ["string", "ひもの ライト", 1400], ["none", "なし", 0]] },
    { id: "post", name: "ポスト", parts: [["green", "みどりの ポスト", 0], ["red", "あかい ポスト", 800], ["bird", "ことりの ポスト", 1200], ["wood", "きの ポスト", 900]] },
    { id: "yard", name: "にわ", parts: [["planter", "はなの プランター", 0], ["tree", "ちいさな き", 1200], ["bench", "ベンチ", 1400], ["bike", "じてんしゃ", 1600], ["doghouse", "いぬごや", 2000], ["pumpkin", "かぼちゃ", 1000]] },
  ].map((c) => ({ ...c, parts: c.parts.map(([id, name, price]) => ({ id, name, price, key: c.id + ":" + id })) }));
  const CAT = Object.fromEntries(CATS.map((c) => [c.id, c])), PAINT = Object.fromEntries(PAINTS.map((p) => [p.id, p]));
  // きばつな たてものが つかう パーツ（ない もの は いつもの・3かいだて だけ。えらんで おいても よい・もどすと つかう）
  // おしろ: やねの かたちで とうの やね（とんがり・まるい たまねぎ・ひらは のこぎりの は）。ペンキは どの かたちでも 4か所
  const FORM_USES = {
    castle: ["roof", "siding", "window", "door", "lamp", "post", "yard"],
    mushroom: ["window", "door", "chimney", "lamp", "post", "yard"],
    cake: ["window", "door", "lamp", "post", "yard"],
    tree: ["siding", "window", "door", "lamp", "post", "yard"],
    ufo: ["door", "post", "yard"],
  };
  const uses = (form, cat) => cat === "form" || !FORM_USES[form] || FORM_USES[form].includes(cat);
  // ペンキの ところの なまえ（きのこ・ケーキは よびかたが ちがう）
  const TARGET_NAMES = { mushroom: { roof: "かさ", wall: "じく" }, cake: { roof: "クリーム", wall: "スポンジ" } };
  const targetName = (form, t) => TARGET_NAMES[form]?.[t] || TARGETS.find((x) => x.id === t)?.name || t;
  const DEFAULT_PARTS = Object.fromEntries(CATS.map((c) => [c.id, c.parts[0].id]));
  const part = (cat, id) => CAT[cat]?.parts.find((x) => x.id === id) || null;
  const blank = () => ({ parts: { ...DEFAULT_PARTS }, paint: { ...DEFAULT_PAINT }, owned: {}, paints: {} });
  // しらべる だけ（つくらない）。こわれた ところは はじめの もの
  function clean(e) {
    const o = blank();
    if (!e || typeof e !== "object") return o;
    for (const c of CATS) if (part(c.id, e.parts?.[c.id])) o.parts[c.id] = e.parts[c.id];
    for (const t of TARGETS) if (PAINT[e.paint?.[t.id]]) o.paint[t.id] = e.paint[t.id];
    for (const c of CATS) for (const p of c.parts) if (p.price > 0 && e.owned?.[p.key] === true) o.owned[p.key] = true;
    for (const p of PAINTS) if (p.price > 0 && e.paints?.[p.id] === true) o.paints[p.id] = true;
    // もって いない ものを つけて いたら はじめの ものに
    for (const c of CATS) if (!has(c.id, o.parts[c.id], o)) o.parts[c.id] = DEFAULT_PARTS[c.id];
    for (const t of TARGETS) if (!hasPaint(o.paint[t.id], o)) o.paint[t.id] = DEFAULT_PAINT[t.id];
    return o;
  }
  const view = () => clean(typeof Save !== "undefined" && Save.d ? Save.d.exterior : null);
  // かう・つける ときに つくる（なおして いれる）
  function st() { const o = clean(Save.d.exterior); Save.d.exterior = o; return o; }
  function has(cat, id, e = view()) { const p = part(cat, id); return !!p && (p.price === 0 || e.owned[p.key] === true); }
  function hasPaint(id, e = view()) { const p = PAINT[id]; return !!p && (p.price === 0 || e.paints[id] === true); }
  function pay(price) {
    if (!(price >= 0) || Save.d.coins < price) return false;
    Save.d.coins -= price; Save.mark?.(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
    return true;
  }
  // かう（もって いれば true・コインが たりなければ false）
  function buy(cat, id) {
    const p = part(cat, id); if (!p) return false;
    if (has(cat, id)) return true;
    if (!pay(p.price)) return false;
    st().owned[p.key] = true; Save.write?.(); return true;
  }
  function buyPaint(id) {
    const p = PAINT[id]; if (!p) return false;
    if (hasPaint(id)) return true;
    if (!pay(p.price)) return false;
    st().paints[id] = true; Save.write?.(); return true;
  }
  // つける（もって いる もの だけ）。d = { parts, paint }（たりない ところは いまの まま）
  function apply(d) {
    const e = st(), parts = { ...e.parts, ...(d.parts || {}) }, paint = { ...e.paint, ...(d.paint || {}) };
    if (!CATS.every((c) => has(c.id, parts[c.id], e)) || !TARGETS.every((t) => hasPaint(paint[t.id], e))) return false;
    e.parts = parts; e.paint = paint; Save.write?.(); return true;
  }
  // 絵に わたす かたち（いろは #rrggbb）
  const resolve = (d = view()) => ({ ...DEFAULT_PARTS, ...d.parts, paint: Object.fromEntries(TARGETS.map((t) => [t.id, (PAINT[d.paint?.[t.id]] || PAINT[DEFAULT_PAINT[t.id]]).hex])) });
  // 町の 絵の キー（パーツと いろの id だけ。有限）
  const key = (d = view()) => CATS.map((c) => (part(c.id, d.parts?.[c.id]) ? d.parts[c.id] : DEFAULT_PARTS[c.id])).join(".") + "|" + TARGETS.map((t) => (PAINT[d.paint?.[t.id]] ? d.paint[t.id] : DEFAULT_PAINT[t.id])).join(".");
  const DEFAULT_KEY = key(blank());
  function parse(k) {
    const [a = "", b = ""] = String(k || "").split("|"), ps = a.split("."), cs = b.split("."), o = blank();
    CATS.forEach((c, i) => { if (part(c.id, ps[i])) o.parts[c.id] = ps[i]; });
    TARGETS.forEach((t, i) => { if (PAINT[cs[i]]) o.paint[t.id] = cs[i]; });
    return o;
  }
  const custom = () => key() !== DEFAULT_KEY;
  const total = () => { const e = view(); return CATS.reduce((n, c) => n + c.parts.filter((p) => p.price > 0 && e.owned[p.key]).length, 0) + PAINTS.filter((p) => p.price > 0 && e.paints[p.id]).length; };

  // ---- 町の 絵 ----
  if (typeof WorldArt !== "undefined") WorldArt.house_ext = (opt = {}) => HouseExtArt.model(resolve(parse(opt.ext)), !!opt.night);
  const HOME_ASSET = "nerikasu.bld_home";
  function hook() {
    if (typeof HeiwadaiTown === "undefined" || HeiwadaiTown._houseExt) return;
    const canvas = HeiwadaiTown.canvas; HeiwadaiTown._houseExt = true;
    HeiwadaiTown.canvas = function (scene, it, ensure) {
      if (it.asset !== HOME_ASSET || !custom()) return canvas.call(this, scene, it, ensure);
      const ext = key();
      if (ensure) return Promise.all([scene.objCanvas("house_ext", { ext }, true), scene.objCanvas("house_ext", { ext, night: true }, true)]);
      return scene.objCanvas("house_ext", DayTint.isNight() ? { ext, night: true } : { ext }, false);
    };
  }
  hook();
  return { PAINTS, TARGETS, CATS, CAT, PAINT, DEFAULT_PARTS, DEFAULT_PAINT, DEFAULT_KEY, HOME_ASSET, FORM_USES, part, uses, targetName, clean, view, st, has, hasPaint, buy, buyPaint, apply, resolve, key, parse, custom, total };
})();
