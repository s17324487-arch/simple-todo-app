// Meeときょれじゃ 3F の こういしつ（UI-22。オーナーの FB 2026-10-01「3Fには、更衣室を 設置し、服を 着替えられる ように せよ」）。
// こういしつ（カーテンの こしつ 3つ）か かしだしの ラックを しらべると、きがえの 画面（DressUp）が ひらく。じぶんの ふくに くわえて、
// かしだしの いしょう 6しゅ（MeeRentalWear。ほんものの プリクラの おみせの ように ただで かりられる）も きられる。
// かりた いしょうは おみせの なか だけ。町・おうちに でる ときに、まえに きて いた ふくに もどして かえす
// （Save.d.arcade.rental = { だれ: { ばしょ: まえの ふく | null } }）。ぷりくらの しゃしんには かりた いしょうの まま のこる。
const MeeFitting = {
  // かりて いる いしょう（もって いる ふくは かしだしに しない。PokaDebug で ぜんぶ もって いる とき など）
  isRental(id) { return !!(id && MeeRentalWear.INDEX[id] && !(Save.d.wardrobe && Save.d.wardrobe[id])); },
  st() {
    const a = Save.d.arcade || (Save.d.arcade = {});
    if (!a.rental || typeof a.rental !== "object" || Array.isArray(a.rental)) a.rental = {};
    return a.rental;
  },
  // いま かりて いる いしょうの かず
  count() { let n = 0; for (const id of Chara.IDS) for (const v of Object.values(Save.d.chars[id].outfit || {})) if (this.isRental(v)) n++; return n; },
  // きがえの あと: かりた いしょうを きた ばしょに、まえの ふくを おぼえる（まえも かりた いしょう なら、さいしょの ふくの まま）
  track(before) {
    const R = this.st();
    for (const id of Chara.IDS) {
      const o = Save.d.chars[id].outfit || {}, b = (before && before[id]) || {}, rec = R[id] && typeof R[id] === "object" ? R[id] : {};
      for (const slot of Object.keys(SLOT_NAMES)) {
        if (!this.isRental(o[slot])) { delete rec[slot]; continue; }
        if (!Object.hasOwn(rec, slot)) rec[slot] = this.isRental(b[slot]) ? null : b[slot] || null;
      }
      if (Object.keys(rec).length) R[id] = rec; else delete R[id];
    }
  },
  // おみせを でる とき: かりた いしょうを ぬいで、まえの ふくに もどす（もって いない ふくには もどさない）。かえした かずを かえす
  giveBack() {
    if (typeof Save === "undefined" || !Save.d || !Save.d.chars) return 0;
    const R = this.st(); let n = 0;
    for (const id of Chara.IDS) {
      const o = Save.d.chars[id].outfit || (Save.d.chars[id].outfit = {}), rec = (R[id] && typeof R[id] === "object" && R[id]) || {};
      for (const slot of Object.keys(SLOT_NAMES)) {
        if (!this.isRental(o[slot])) continue;
        // 1こで 1人（js/wear-stock.js）: まえの ふくを ほかの 人が つかって いて のこりが なければ もどさない
        const prev = rec[slot], ok = prev && ITEM_INDEX[prev] && ITEM_INDEX[prev].slot === slot && Save.d.wardrobe[prev] && !this.isRental(prev) && WearStock.can(prev, id);
        o[slot] = ok ? prev : null; n++;
      }
    }
    Save.d.arcade.rental = {};
    return n;
  },
  // こういしつ・かしだしの ラックを しらべた とき
  async open() {
    const d = Save.d, a = d.arcade || (d.arcade = {});
    if (!a.fitSeen) {
      a.fitSeen = 1;
      await UI.say([{ name: "こういしつ", text: "こういしつ だよ。じぶんの ふくの ほかに、かしだしの いしょうが ただで きられるよ。\n" + MeeRentalWear.ITEMS.map((it) => it.name).join("・") + "。" },
        { name: "こういしつ", text: "かりた いしょうは おみせの なか だけ。おみせを でる ときに かえしてね。\nぷりくらの しゃしんには のこるよ！" }]);
    }
    const before = Object.fromEntries(Chara.IDS.map((id) => [id, { ...(d.chars[id].outfit || {}) }]));
    const changed = await DressUp.open(null, { title: "こういしつ", extra: MeeRentalWear.ITEMS.map((it) => ITEM_INDEX[it.id]), tag: "かしだし", note: "「かしだし」は おみせの なか だけ。ぷりくらで とって みよう！" });
    this.track(before); Save.write();
    if (changed) {
      Sound.se("sparkle");
      const n = this.count();
      UI.toast(n ? "きがえ できたよ！ かりた いしょうは おみせを でる ときに かえしてね" : "きがえ できたよ！", "good");
    }
    return changed;
  },
  install() {
    // 町・おうちに でる ときに かえす（ぷりくら・クレーン・カウンターは おみせの なか なので そのまま）
    for (const S of [WorldScene, HouseScene]) {
      const P = S.prototype, orig = P.enter;
      P.enter = function (...args) {
        const n = MeeFitting.giveBack();
        if (n) { Save.write(); setTimeout(() => UI.toast("かりた いしょうは Meeときょれじゃ に かえしたよ"), 400); }
        return orig.apply(this, args);
      };
    }
  },
};
MeeFitting.install();
