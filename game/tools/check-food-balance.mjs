// たべものの バランス（js/food-balance.js・UI-35）の 検査。ブラウザ なしで しらべる。
// オーナーの FB 2026-10-01「野菜単体のお腹の回復量を下げて。料理の回復量を少し上げて、ごきげんも回復するようにして。
// 他のアイテムについても、価格が高いものはごきげんも少し回復するようにバランス調整して」
// ・そのままの やさい 10しゅ: おなかは まえの はんぶん（ごきげんは そのまま）。くだもの（いちご・スイカ・メロン）は かわらない
// ・りょうり 10しゅ: おなかは すこし（+40% まで）ふえて、ごきげんは +6 いじょう。やさいの りょうりは ざいりょうを そのまま たべた ごうけい より おおい
// ・ほかの たべもの: 50コイン いじょうは ごきげん ≥ 6 × log2(ねだん ÷ 20)。さがる ものは ない
// ・じっさいに たべる（Care.feed）・おうちの ごはん と りょうりの まどの「おなか+N ごきげん+M」・PokaDebug・セーブは かわらない
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FoodBalance: B, BAG_INDEX, FOODS, FARM_RECIPES, FarmCook, Care, Save } = R;
let n = 0;
const ok = (v, msg) => { n++; assert.ok(v, msg); };
const F = (id) => BAG_INDEX[id];
const kana = (s) => /^[぀-ゟ゠-ヿー・ 　！？。、0-9A-Za-z（）()+\-]+$/.test(s);

// ---- 1. そのままの やさい ----
const RAW_BEFORE = { radish: [8, 4], carrot: [10, 4], potato: [16, 4], tomato: [10, 8], onion: [8, 2], eggplant: [10, 3], cabbage: [14, 4], pumpkin: [24, 8], corn: [22, 5], pepper: [10, -4] };
ok(B.RAW_VEG.length === 10 && B.RAW_VEG.every((id) => RAW_BEFORE[id]), "そのままの やさいは 10しゅ");
for (const [id, [h0, m0]] of Object.entries(RAW_BEFORE)) {
  const f = F(id);
  ok(f && f.kind === "food" && f.hunger === Math.round(h0 / 2) && f.mood === m0, `${id}: おなかは まえの はんぶん・ごきげんは そのまま ` + JSON.stringify(f && [f.hunger, f.mood]));
  ok(f.hunger > 0 && f.hunger <= 12 && B.isRawVeg(id) && !B.isDish(id), `${id}: すこし（12 いか）`);
  ok(FOODS.find((x) => x.id === id).hunger === f.hunger, `${id}: FOODS と もちものの かずが おなじ`);
}
for (const [id, h, m] of [["strawberry", 8, 14], ["watermelon", 20, 24], ["melon", 20, 28], ["apple", 12, 4]]) ok(F(id).hunger === h && F(id).mood === m && !B.isRawVeg(id), `${id}: くだものは かわらない`);

// ---- 2. りょうり ----
const DISH_BEFORE = { salad: [22, 12], soup: [24, 6], mild_curry: [42, 8], potsalad: [20, 10], yakicorn: [22, 12], nikuzume: [40, 14], nasugratin: [34, 14], pumpkinsoup: [26, 16], deza_berrymilk: [10, 22], deza_punch: [18, 32] };
ok(FARM_RECIPES.length === 10 && FARM_RECIPES.every((r) => DISH_BEFORE[r.id] && B.isDish(r.id)), "りょうりは 10しゅ");
const st = B.state();
for (const d of st.dishes) {
  const [h0, m0] = DISH_BEFORE[d.id], f = F(d.id);
  ok(d.hunger > h0 && d.hunger <= Math.round(h0 * 1.4), `${d.id}: おなかは すこし ふえる（+40% まで） ${h0} → ${d.hunger}`);
  ok(d.mood >= m0 + 6 && d.mood >= B.moodFloor(d.price), `${d.id}: ごきげんも おおめ ${m0} → ${d.mood}`);
  ok(FOODS.find((x) => x.id === d.id).mood === f.mood && FOODS.find((x) => x.id === d.id).hunger === f.hunger, `${d.id}: FOODS と もちものの かずが おなじ`);
  if (!d.deza) {
    // やさいの りょうり: つくった ほうが そのまま たべるより おなかも ごきげんも おおい
    ok(d.hunger >= d.raw.hunger && d.mood >= d.raw.mood, `${d.id}: ざいりょうの ごうけい（おなか ${d.raw.hunger}・ごきげん ${d.raw.mood}）より おおい ${d.hunger}・${d.mood}`);
  } else {
    // くだものの デザ: どの ざいりょう 1こ より おなかも ごきげんも おおい（くだものは ごきげんが たかい ので ごうけい では くらべない）
    ok(Object.keys(d.needs).every((id) => d.hunger > F(id).hunger && d.mood > F(id).mood), `${d.id}: どの ざいりょう 1こ より おおい`);
  }
}
ok(st.dishes.filter((d) => !d.deza).length === 8 && st.dishes.filter((d) => d.deza).length === 2, "やさいの りょうり 8・デザ 2");

// ---- 3. ねだんで ごきげん ----
ok(B.FLOOR_FROM === 50 && B.moodFloor(49) === 0 && B.moodFloor(0) === 0 && B.moodFloor(NaN) === 0, "50コイン より したは かわらない");
ok(JSON.stringify(st.floor) === JSON.stringify([[50, 8], [100, 14], [200, 20], [300, 23], [690, 31]]), "めやす 50 → 8・100 → 14・200 → 20・300 → 23・690 → 31 " + JSON.stringify(st.floor));
for (let p = 50; p < 1000; p++) ok(B.moodFloor(p + 1) >= B.moodFloor(p), "たかい ほど へらない " + p);
const foods = Object.values(BAG_INDEX).filter((f) => f.kind === "food");
for (const f of foods) {
  if (B.isRawVeg(f.id) || B.isDish(f.id)) continue;
  ok((f.mood || 0) >= B.moodFloor(f.price), `${f.id}: ねだん ${f.price} なら ごきげん ${B.moodFloor(f.price)} いじょう（いま ${f.mood}）`);
  const g = FOODS.find((x) => x.id === f.id);
  ok(!g || (g.mood || 0) === (f.mood || 0), `${f.id}: FOODS と もちものの ごきげんが おなじ`);
}
ok(st.raised.length >= 30 && st.raised.every((r) => r.from < r.to && F(r.id).mood === r.to && r.to === B.moodFloor(F(r.id).price)), "ねだんで あげた もの " + st.raised.length);
ok(st.raised.every((r) => !B.isRawVeg(r.id) && !B.isDish(r.id)), "やさい・りょうりは ねだんの きまりで かえない");
ok(Math.max(...foods.filter((f) => f.price <= 700).map((f) => B.moodFloor(f.price))) <= 31, "めやすは すこし（31 まで）");
// れい（PR の 表と おなじ）
const want = { ike_cafe_0: 26, ike_cafe_1: 29, ike_cafe_2: 31, protein: 23, katatea: 23, curry: 12, meat: 10, bm_hamburger: 10, hamburg: 16, bm_big: 17, ike_snack_senbei: 16 };
for (const [id, m] of Object.entries(want)) ok(F(id).mood === m, `${id}: ごきげん ${m}（いま ${F(id).mood}）`);
for (const id of ["pudding", "cake", "deza_tart", "kidsplate", "bm_nikoniko", "ike_snack_popcorn", "omurice", "bm_teriyaki"]) ok(!st.raised.some((r) => r.id === id), `${id}: もとから おおい ので そのまま`);

// ---- 4. じっさいに たべる ----
R.UI.updateHud = () => {};
const eat = (id, h0 = 20, m0 = 30) => {
  Save.d = Save.fresh(); const who = "gachan", c = Save.d.chars[who]; c.hunger = h0; c.mood = m0; Save.addBag(id, 1);
  const r = Care.feed(who, id); return { r, dh: c.hunger - h0, dm: c.mood - m0 };
};
let e = eat("tomato"); ok(e.r && e.dh === 5 && e.dm === 8, "トマトを そのまま: おなか +5・ごきげん +8 " + JSON.stringify(e));
e = eat("salad"); ok(e.r && e.dh === 28 && e.dm === 18, "やさいサラダ: おなか +28・ごきげん +18 " + JSON.stringify(e));
e = eat("pumpkin"); const pk = e; e = eat("pumpkinsoup"); ok(e.dh > pk.dh * 2 && e.dm > pk.dm, "かぼちゃは スープに した ほうが おおい " + JSON.stringify([pk, e]));
e = eat("ike_cafe_2"); ok(e.dm === 31, "ねだんの たかい デザ（690コイン）: ごきげん +31 " + JSON.stringify(e));
e = eat("protein"); ok(e.r && e.dm === 23, "きんにくクッキー（300コイン）も ごきげん +23 " + JSON.stringify(e));
e = eat("corn"); ok(e.dh === 11 && e.dm === 5 + 16, "がちゃんの だいこうぶつ とうもろこし: おなか +11・ごきげん +21 " + JSON.stringify(e));
e = eat("yakicorn"); ok(e.dh === 28 && e.dm === 18, "やきとうもろこし: おなか +28・ごきげん +18 " + JSON.stringify(e));
e = eat("salad", 97, 30); ok(e.dm <= 2, "おなか いっぱいの ときは ごきげんは ふえない（まえと おなじ） " + JSON.stringify(e));

// ---- 5. がめんの ことば ----
const strip = (h) => h.replace(/<[^>]+>/g, "");
ok(strip(B.gainHtml(F("salad"))) === "おなか+28 ごきげん+18", "サラダ: おなか+28 ごきげん+18 " + strip(B.gainHtml(F("salad"))));
ok(strip(B.gainHtml(F("pepper"))) === "おなか+5 ごきげん-4" && /fb-gain down/.test(B.gainHtml(F("pepper"))), "ピーマン: ごきげん-4（あかい いろ）");
ok(strip(B.gainHtml({ hunger: 6, mood: 0 })) === "おなか+6", "ごきげんが 0 なら おなか だけ");
for (const f of foods) { const t = strip(B.gainHtml(f)); ok(kana(t) && t.length <= 18 && !/NaN|undefined/.test(t), `${f.id}: ことば ${t}`); }
for (const r of FARM_RECIPES) ok(strip(FarmCook.gain(r.id)) === strip(B.gainHtml(F(r.id))), `${r.id}: りょうりの まどにも おなか・ごきげん`);
const src = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
ok(/class="muted food-gain">\$\{FoodBalance\.gainHtml\(f\)\}/.test(src("js/scene-house.js")), "おうちの ごはんの カードに おなか・ごきげん");
ok(/りょうりに すると、そのまま たべるより おなかも ごきげんも もっと もどるよ。/.test(src("js/farm-cook.js")), "りょうりの まどの せつめい");

// ---- 6. PokaDebug・セーブ ----
const dbg = R.PokaDebug || null;
ok(!dbg || typeof dbg.foodBalance === "function", "PokaDebug.foodBalance()");
ok(/foodBalance\(\) \{ return FoodBalance\.state\(\); \}/.test(src("js/debug.js")), "PokaDebug.foodBalance() は FoodBalance.state()");
ok(st.rawVeg.length === 10 && st.dishes.length === 10 && st.rawVeg.every((v) => v && v.name && v.hunger > 0), "state の かたち");
ok(Save.SCHEMA === 2 && !("foodBalance" in Save.fresh()), "セーブは かわらない（SCHEMA 2 の まま）");

console.log(`Food balance: raw vegetables halved (10), dishes up with mood (10; vegetable dishes beat their raw ingredients), price-based mood for ${st.raised.length} foods (50+ coins: 6·log2(p/20)), feeding, gain labels, PokaDebug — ${n} checks OK`);
