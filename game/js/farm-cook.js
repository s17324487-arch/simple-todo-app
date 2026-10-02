// とれたて りょうり（FARM-02・オーナーの FB 2026-09-30「料理の 素材や フルーツを 育てられる ように して くれ」の つづき）。
// はたけで とれた やさい・くだもので りょうりを つくる。おうちの「ごはん」の いちばん うえ と、はたけの がめんの「りょうり」から。
// ざいりょうが そろって いれば「つくる」で もちものの ざいりょうが へって、りょうりが 1つ ふえる（しっぱい しない・コインは いらない）。
// あたらしい りょうり 8しゅ（おみせには ならばない・絵は 64×64 の FOOD_ART）。おやさいスープ・あまくちカレーは まえからの 食べ物。
// セーブは Save.d.farm.cooked（{ りょうり: つくった かず }）だけ ふえる。
// りょうりは ざいりょうを そのまま たべるより おなかも ごきげんも もっと もどる（UI-35。オーナーの FB 2026-10-01「野菜単体のお腹の回復量を下げて。料理の回復量を少し上げて、ごきげんも回復するようにして」）。
// やさいの りょうりは ざいりょうの おなか・ごきげんの ごうけい より おおきい（tools/check-food-balance.mjs が たしかめる）。
const FARM_RECIPES = [
  { id: "salad", name: "やさいサラダ", needs: { tomato: 1, cabbage: 1, radish: 1 }, price: 60, hunger: 28, mood: 18, hp: 26, desc: "しゃきしゃき とれたて やさいの サラダ" },
  { id: "soup", needs: { carrot: 1, onion: 1, cabbage: 1 } },
  { id: "mild_curry", needs: { potato: 1, carrot: 1, onion: 1, onigiri: 1 } },
  { id: "potsalad", name: "ポテトサラダ", needs: { potato: 2, carrot: 1 }, price: 55, hunger: 26, mood: 16, hp: 22, desc: "ほくほく じゃがいもの ポテトサラダ" },
  { id: "yakicorn", name: "やきとうもろこし", needs: { corn: 2 }, price: 60, hunger: 28, mood: 18, hp: 22, desc: "こんがり あまい やきとうもろこし" },
  { id: "nikuzume", name: "ピーマンの にくづめ", needs: { pepper: 2, meat: 1 }, price: 100, hunger: 54, mood: 20, hp: 44, desc: "にがい ピーマンも これなら ぱくぱく" },
  { id: "nasugratin", name: "なすの グラタン", needs: { eggplant: 1, tomato: 1, milk: 1 }, price: 90, hunger: 40, mood: 20, hp: 36, desc: "とろーり チーズと なすと トマト" },
  { id: "pumpkinsoup", name: "かぼちゃの スープ", needs: { pumpkin: 1, milk: 1 }, price: 80, hunger: 32, mood: 22, hp: 28, desc: "あまくて とろとろ かぼちゃの スープ" },
  { id: "deza_berrymilk", name: "デザ・いちごミルク", needs: { strawberry: 3, milk: 1 }, price: 80, hunger: 14, mood: 28, hp: 12, sp: 10, deza: true, desc: "つぶつぶ いちごの ミルク。げんき(SP)も もどる" },
  { id: "deza_punch", name: "デザ・フルーツポンチ", needs: { watermelon: 1, melon: 1, strawberry: 2 }, price: 200, hunger: 24, mood: 40, hp: 22, deza: true, desc: "スイカと メロンと いちごの ごちそう デザ" },
];
const FarmCook = (() => {
  const S = (w = 3) => IS(w);
  const hi = (x, y, rx, ry, rot = 0, a = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity="${a}"/>`;
  const bowl = (fill = "#FFFFFF", rim = "#D5E2EA") => `<path d="M8,34 H56 C55,48 45,57 32,57 C19,57 9,48 8,34 Z" fill="${fill}" ${S()}/><path d="M13,40 C20,43 44,43 51,40" fill="none" stroke="${rim}" stroke-width="2.4" stroke-linecap="round"/>`;
  const steam = (x, y) => `<path d="M${x},${y} c-4,-4 4,-6 0,-11 M${x + 9},${y + 1} c-4,-4 4,-6 0,-11" fill="none" stroke="#B9C6CF" stroke-width="2.6" stroke-linecap="round"/>`;
  const leafy = (x, y, r, rot, fill = "#8ACB6C") => `<path d="M${x},${y} c${-r},${-r * 0.4} ${-r * 0.9},${-r * 1.4} 0,${-r * 1.6} c${r * 0.9},${r * 0.2} ${r},${r * 1.2} 0,${r * 1.6} Z" transform="rotate(${rot} ${x} ${y})" fill="${fill}" ${S(2)}/>`;
  const berry = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,-5 C-7,-6 -8,2 0,9 C8,2 7,-6 0,-5 Z" fill="#E53935" ${S(1.6 / s)}/><ellipse cx="-2.5" cy="0" rx=".7" ry="1" fill="#FFE59A"/><ellipse cx="2.4" cy="-.6" rx=".7" ry="1" fill="#FFE59A"/><ellipse cx="0" cy="3" rx=".7" ry="1" fill="#FFE59A"/><path d="M-4,-5 L-1.5,-7.5 L0,-5.5 L1.5,-7.5 L4,-5 L0,-3.8 Z" fill="#4E9A3E" ${S(1.1 / s)}/></g>`;
  const ART = {
    // やさいサラダ: しろい おわんに レタス・トマト・はつかだいこん
    salad: `${leafy(18, 36, 9, -40)}${leafy(46, 36, 9, 40, "#62B052")}${leafy(32, 34, 10, 0)}<path d="M20,30 A7,7 0 0,1 30,24 L27,32 Z" fill="#E8412F" ${S(2)}/><path d="M36,26 A7,7 0 0,1 45,31 L37,33 Z" fill="#E8412F" ${S(2)}/><circle cx="15" cy="31" r="4.4" fill="#FFFFFF" stroke="#E2455A" stroke-width="2.4"/><circle cx="32" cy="27" r="4.2" fill="#FFFFFF" stroke="#E2455A" stroke-width="2.4"/><circle cx="49" cy="31" r="4" fill="#FFFFFF" stroke="#E2455A" stroke-width="2.4"/>${bowl()}${hi(18, 44, 3, 1.8, -20)}`,
    // ポテトサラダ: おさらに こんもり（にんじん・きゅうりの つぶ）
    potsalad: `<ellipse cx="32" cy="50" rx="26" ry="8" fill="#FFFFFF" ${S()}/><ellipse cx="32" cy="49" rx="18" ry="4.4" fill="none" stroke="#D5E2EA" stroke-width="2"/>${leafy(15, 46, 8, -60)}<path d="M13,47 C12,30 22,20 32,20 C44,20 53,31 51,47 C44,51 20,51 13,47 Z" fill="#F4E6B0" ${S()}/>${[[24, 32, "#F08A2C"], [36, 28, "#F08A2C"], [42, 38, "#7FB85A"], [28, 41, "#7FB85A"], [33, 36, "#F08A2C"]].map(([x, y, c]) => `<rect x="${x - 2}" y="${y - 2}" width="4.4" height="4.4" rx="1" fill="${c}" ${S(1.2)}/>`).join("")}${hi(24, 26, 4, 2.4, -25)}`,
    // やきとうもろこし: くしに さした とうもろこし・こげめ・バター
    yakicorn: `<path d="M32,62 V48" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/><path d="M32,62 V48" stroke="#D9A86E" stroke-width="3.6" stroke-linecap="round"/><path d="M32,50 C21,50 18,36 19,24 C20,12 26,6 32,6 C38,6 44,12 45,24 C46,36 43,50 32,50 Z" fill="#F2B83A" ${S()}/>${[14, 22, 30, 38].map((y) => `<path d="M22,${y} C27,${y + 2} 37,${y + 2} 42,${y}" fill="none" stroke="#C98A1E" stroke-width="2"/>`).join("")}<path d="M26,10 V46 M32,7 V49 M38,10 V46" stroke="#C98A1E" stroke-width="1.6"/><path d="M24,20 l4,-2 M35,28 l5,-2 M26,36 l4,-2" stroke="#8C4A1A" stroke-width="3" stroke-linecap="round"/><path d="M28.5,19.5 C27,22 27.4,25 29.2,25 C31,25 31.2,22 30,19.5 Z" fill="#FFE7A0" ${S(1.4)}/><rect x="27" y="11" width="11" height="9" rx="2.6" transform="rotate(-10 32.5 15.5)" fill="#FFE7A0" ${S(1.8)}/><path d="M29.4,13.6 h4" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" transform="rotate(-10 32.5 15.5)"/>${hi(24, 14, 2, 4, 15, 0.5)}`,
    // ピーマンの にくづめ: おさらに みどりの カップ 3つ（おにく・ケチャップ）
    nikuzume: `<ellipse cx="32" cy="48" rx="28" ry="9" fill="#FFFFFF" ${S()}/>${[[18, 40], [32, 36], [46, 40]].map(([x, y]) => `<path d="M${x - 10},${y} C${x - 10},${y + 9} ${x + 10},${y + 9} ${x + 10},${y} C${x + 7},${y - 5} ${x - 7},${y - 5} ${x - 10},${y} Z" fill="#48A843" ${S(2.4)}/><ellipse cx="${x}" cy="${y - 1}" rx="8" ry="4" fill="#9C5B34" ${S(2)}/><path d="M${x - 4},${y - 2} c2,-2 6,-2 8,0" fill="none" stroke="#E8412F" stroke-width="2.6" stroke-linecap="round"/>`).join("")}${hi(12, 46, 3, 1.4, -10, 0.6)}`,
    // なすの グラタン: だえんの おさら・こんがり チーズ・なすと トマト・ゆげ
    nasugratin: `${steam(24, 22)}<ellipse cx="32" cy="42" rx="27" ry="14" fill="#F2F2EC" ${S()}/><ellipse cx="32" cy="40" rx="22" ry="10" fill="#F6D06A" ${S(2.4)}/>${[[22, 38], [32, 36], [42, 39]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.4" fill="#6B4A9A" ${S(1.6)}/><ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.6" fill="#E9DDB0"/>`).join("")}<circle cx="27" cy="44" r="2.6" fill="#E8412F" ${S(1.2)}/><circle cx="38" cy="45" r="2.6" fill="#E8412F" ${S(1.2)}/>${[[18, 42], [30, 42], [44, 44], [36, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#C98A1E" fill-opacity=".7"/>`).join("")}`,
    // かぼちゃの スープ: オレンジの スープ・クリームの うず・スプーン
    pumpkinsoup: `${steam(22, 22)}<path d="M46,26 L58,10" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M46,26 L58,10" stroke="#D5DCE0" stroke-width="3.6" stroke-linecap="round"/>${bowl()}<ellipse cx="32" cy="35" rx="23" ry="5" fill="#F29A3A" ${S(2.4)}/><path d="M24,35 c3,-3 9,-3 10,0 c1,2 -4,3 -5,1" fill="none" stroke="#FFF6E0" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="34" r="1.6" fill="#6DA84A"/><circle cx="43" cy="35.5" r="1.3" fill="#6DA84A"/>`,
    // デザ・いちごミルク: ピンクの ミルクの グラス・ストロー・いちご
    deza_berrymilk: `<path d="M40,4 L34,26" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M40,4 L34,26" stroke="#F48FB1" stroke-width="3" stroke-linecap="round"/><path d="M16,18 H48 L44,58 H20 Z" fill="#FFFFFF" fill-opacity=".85" ${S()}/><path d="M17.4,28 H46.6 L44,58 H20 Z" fill="#F7B6C9"/><path d="M16,18 H48 L44,58 H20 Z" fill="none" ${S()}/>${[[24, 40], [36, 46], [30, 52], [40, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#E53935"/>`).join("")}${berry(46, 20, 1.2)}${hi(22, 32, 2, 8, 5, 0.5)}`,
    // デザ・フルーツポンチ: ガラスの うつわに スイカ・メロン・いちご
    deza_punch: `<path d="M8,26 H56 C55,44 45,52 32,52 C19,52 9,44 8,26 Z" fill="#E8F4FA" fill-opacity=".9" ${S()}/><path d="M26,52 H38 L40,60 H24 Z" fill="#E8F4FA" ${S(2.4)}/>` +
      `<circle cx="20" cy="30" r="6.4" fill="#F0605A" ${S(2)}/><circle cx="18" cy="29" r=".9" fill="${INK}"/><circle cx="22" cy="31" r=".9" fill="${INK}"/><circle cx="32" cy="28" r="6.4" fill="#BBD68A" ${S(2)}/><path d="M28,26 q4,3 8,0" fill="none" stroke="#FFFBEA" stroke-width="1.2"/>${berry(44, 29, 0.9)}<circle cx="27" cy="38" r="5.6" fill="#F0605A" ${S(2)}/><circle cx="39" cy="38" r="5.6" fill="#BBD68A" ${S(2)}/>${berry(33, 42, 0.8)}` +
      `<path d="M9,27 C20,31 44,31 55,27" fill="none" stroke="#A9D8EE" stroke-width="2.4" stroke-linecap="round"/>${hi(14, 38, 2, 5, 20, 0.6)}`,
  };
  for (const r of FARM_RECIPES) {
    if (BAG_INDEX[r.id]) continue; // まえからの 食べ物（おやさいスープ・あまくちカレー）
    const f = { id: r.id, name: r.name, price: r.price, hunger: r.hunger, mood: r.mood, hp: r.hp, ...(r.sp ? { sp: r.sp } : {}), deza: !!r.deza, rare: false, exclusive: "farm", desc: r.desc };
    FOODS.push(f); BAG_INDEX[f.id] = { ...f, kind: "food" }; FOOD_ART[f.id] = ART[r.id];
  }
  const cooked = () => { const f = Farm.st(); if (!f.cooked || typeof f.cooked !== "object") f.cooked = {}; return f.cooked; };
  return {
    ART,
    recipe(id) { return FARM_RECIPES.find((r) => r.id === id) || null; },
    nameOf(id) { return BAG_INDEX[id]?.name || id; },
    // おなか・ごきげんが どれだけ もどるか（おうちの ごはん・この まど）
    gain(id) { const f = BAG_INDEX[id]; return f ? FoodBalance.gainHtml(f) : ""; },
    // たりない ざいりょう（{ id: たりない かず }・そろって いれば {}）
    missing(r) { const m = {}; for (const [id, n] of Object.entries(r.needs)) { const have = Save.d.bag[id] || 0; if (have < n) m[id] = n - have; } return m; },
    can(r) { return Object.keys(this.missing(r)).length === 0; },
    // つくる: ざいりょうを へらして りょうりを 1つ。できなければ null
    cook(id) {
      const r = this.recipe(id);
      if (!r || !this.can(r)) return null;
      for (const [k, n] of Object.entries(r.needs)) Save.addBag(k, -n);
      Save.addBag(r.id, 1); const c = cooked(); c[r.id] = (c[r.id] || 0) + 1;
      Save.mark(); Save.write();
      return { id: r.id, name: this.nameOf(r.id), have: Save.d.bag[r.id] };
    },
    // りょうりの まど（after: とじた あとに よぶ）
    open(after = null) {
      UI.toastBox.replaceChildren();
      const body = U.el("div", { class: "farm-cook" }), list = U.el("div", { class: "farm-recipes" });
      let last = null; // いま つくった りょうり（その ぎょうに「できた！」。おしらせを まどの うえに かさねない）
      const draw = () => {
        list.replaceChildren();
        for (const r of FARM_RECIPES) {
          const ok = this.can(r), miss = this.missing(r), row = U.el("div", { class: "farm-recipe" + (ok ? " ok" : "") });
          const chips = Object.entries(r.needs).map(([id, n]) => `<span class="farm-chip${miss[id] ? " miss" : ""}" aria-label="${this.nameOf(id)} ${n}こ">${Art.iconSvg("bag", id)}<b>×${n}</b></span>`).join("");
          const done = last && last.id === r.id ? `<span class="farm-done" role="status">できた！ もちもの ${last.have}こ</span>` : "";
          row.innerHTML = `<span class="farm-seed-ico">${Art.iconSvg("bag", r.id)}</span><span class="farm-recipe-txt"><b>${this.nameOf(r.id)}</b>${done}<span class="farm-gain">${this.gain(r.id)}</span><span class="farm-chips">${chips}</span></span>`;
          const b = UI.btn("つくる", () => {
            const res = this.cook(r.id);
            if (!res) { Sound.se("cancel"); return; }
            Sound.se("bake"); last = res;
            if (G.sceneName === "farm") G.scene.team.forEach((t, k) => { t.hop = 0.35 + k * 0.05; });
            draw();
          }, ok ? "small yellow" : "small");
          b.setAttribute("aria-label", this.nameOf(r.id) + "を つくる");
          if (!ok) b.disabled = true;
          row.append(b); list.append(row);
        }
      };
      draw();
      body.append(U.el("p", { class: "farm-lead", text: "はたけで とれた やさいで りょうりを つくろう。ざいりょうが そろうと つくれるよ。りょうりに すると、そのまま たべるより おなかも ごきげんも もっと もどるよ。" }), list,
        U.el("p", { class: "note", text: "ぎゅうにゅう・おにぎり・ほねつきにくは おみせで かえるよ。できた りょうりは もちものに はいるよ。" }));
      return UI.modal({ title: "とれたて りょうり", body, onClose: () => { if (after) after(); } });
    },
  };
})();
