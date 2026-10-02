// たべものの バランス（UI-35・オーナーの FB 2026-10-01「野菜単体のお腹の回復量を下げて。料理の回復量を少し上げて、ごきげんも回復するようにして。
// 他のアイテムについても、価格が高いものはごきげんも少し回復するようにバランス調整して」）。
// ・そのままの やさい（はたけの やさい 8しゅ と とうもろこし・ピーマン）: おなかは まえの はんぶん（かずは js/farm.js・js/data.js）。
//   くだもの（いちご・スイカ・メロン）は そのまま。
// ・りょうり（はたけの りょうり 10しゅ。かずは js/farm-cook.js・js/home-catalog.js）: おなかを すこし ふやして、ごきげんも おおめ。
//   やさいの りょうりは ざいりょうを そのまま たべた ごうけい より、おなかも ごきげんも おおい（tools/check-food-balance.mjs）。
// ・ほかの たべもの: ねだんが 50コイン いじょうなら、ごきげんは すくなくとも moodFloor(ねだん) = 6 × log2(ねだん ÷ 20)。
//   たかい ほど すこしずつ ふえる（50 → 8・100 → 14・300 → 23・690 → 31）。SlowLifePrices と おなじ ように、
//   ぜんぶの たべものが そろった あと（farm-cook.js の あと）に 1かいだけ なおす。もとから おおい ものは そのまま。
// ・おうちの「ごはん」と りょうりの まどに「おなか+N ごきげん+M」を だす（gainHtml）。
// セーブは かわらない（もちものの かずだけ。Save.SCHEMA は そのまま）。
const FoodBalance = (() => {
  const RAW_VEG = Object.freeze(["radish", "carrot", "potato", "tomato", "onion", "eggplant", "cabbage", "pumpkin", "corn", "pepper"]);
  const FLOOR_FROM = 50;
  const moodFloor = (price) => (Number.isFinite(price) && price >= FLOOR_FROM ? Math.round(6 * Math.log2(price / 20)) : 0);
  const dishIds = () => (typeof FARM_RECIPES !== "undefined" ? FARM_RECIPES.map((r) => r.id) : []);
  const raised = []; // { id, from, to }（ねだんで ごきげんを あげた もの）
  const apply = () => {
    const skip = new Set([...RAW_VEG, ...dishIds()]);
    for (const it of Object.values(BAG_INDEX)) {
      if (it.kind !== "food" || skip.has(it.id)) continue;
      const want = moodFloor(it.price), from = it.mood || 0;
      if (from >= want) continue;
      it.mood = want;
      const f = FOODS.find((x) => x.id === it.id);
      if (f) f.mood = want;
      raised.push({ id: it.id, from, to: want });
    }
  };
  apply();
  const num = (n) => (n > 0 ? "+" + n : String(n));
  return {
    RAW_VEG, FLOOR_FROM, raised, moodFloor,
    isRawVeg(id) { return RAW_VEG.includes(id); },
    isDish(id) { return dishIds().includes(id); },
    // おなか・ごきげんの もどる かず（たべる まえに みせる）。ことばの きれめで おりかえす
    gainHtml(f) {
      const h = f.hunger || 0, m = f.mood || 0;
      return `<span class="fb-gain">おなか${num(h)}</span>` + (m ? ` <span class="fb-gain${m < 0 ? " down" : ""}">ごきげん${num(m)}</span>` : "");
    },
    // PokaDebug.foodBalance()・検査: そのままの やさい・りょうり（ざいりょうの ごうけい つき）・ねだんで あげた もの
    state() {
      const v = (id) => { const f = BAG_INDEX[id]; return f ? { id, name: f.name, price: f.price, hunger: f.hunger || 0, mood: f.mood || 0 } : null; };
      const dishes = typeof FARM_RECIPES === "undefined" ? [] : FARM_RECIPES.map((r) => {
        const raw = { hunger: 0, mood: 0 };
        for (const [id, n] of Object.entries(r.needs)) { const f = BAG_INDEX[id]; raw.hunger += (f.hunger || 0) * n; raw.mood += (f.mood || 0) * n; }
        return { ...v(r.id), deza: !!BAG_INDEX[r.id].deza, needs: { ...r.needs }, raw };
      });
      return { rawVeg: RAW_VEG.map(v), dishes, raised: raised.map((r) => ({ ...r })), floor: [50, 100, 200, 300, 690].map((p) => [p, moodFloor(p)]) };
    },
  };
})();
