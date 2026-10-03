// おてつだいの「もういちど」と 1つの おみせで 1にち 20000コイン まで（js/shop-day-cap.js・UI-67）の 検査。
// ブラウザ なしで: セーブ（Save.d.shopDay・まえの セーブ）・おみせの キー（マックさん・びっくぽ）・のこりに おさめる けいさん・日づけで 0 から・
// ShopScene の しはらい（のこりを こえない・いっぱいで おしまい）・お店と ころころ フルーツの スコア モードの くみこみ・「もういちど」・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ShopDayCap: C, ShopScene, Save: S, SHOPS, SHOP_OWNERS, PokaDebug, G, U } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = () => { S.d = S.fresh(); return S.d; };

// ---- 1. セーブ ----
{
  const f = S.fresh();
  ok(f.shopDay && f.shopDay.day === "" && JSON.stringify(f.shopDay.earn) === "{}" && S.SCHEMA === 2, "Save.fresh() に shopDay（day・earn）・SCHEMA は 2 の まま");
  const old = S.fresh(); delete old.shopDay; old.v = 2;
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.shopDay && m.shopDay.day === "" && typeof m.shopDay.earn === "object", "まえの セーブ（shopDay なし）にも できる");
  fresh(); S.d.shopDay = { day: U.today(), earn: [] };
  ok(C.earned("crepe") === 0 && !Array.isArray(S.d.shopDay.earn), "こわれた earn（はいれつ）は なおす");
  S.d.shopDay = { day: U.today(), earn: { crepe: "x", bakery: -5, cake: 12.7 } };
  ok(C.earned("crepe") === 0 && C.earned("bakery") === 0 && C.earned("cake") === 12, "かずで ない・マイナス・はすうは 0 か きりすて");
}

// ---- 2. おみせの キー ----
{
  ok(C.key("crepe") === "crepe" && C.key("burger", "mac") === "burger_mac" && C.key("burger", null, "bikkupo") === "bikkupo_burger", "キー: ふつう・ヘイワダイの マックさん・びっくぽの キッチン は べつの おみせ");
  ok(C.key("brain", "spot") === "brain" && C.key("kobo", "logic") === "kobo", "あたまの たいそう・パズル こうぼうの 3しゅは おなじ おみせ");
}

// ---- 3. のこりに おさめる・たす・日づけ ----
{
  ok(C.MAX === 20000, "1にち 20000コイン（オーナーの FB で 10000 → 20000）");
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok(eq(C.clip(100, 40, 30), { pay: 40, tip: 30, cut: 0 }), "のこりが たりる ときは そのまま");
  ok(eq(C.clip(50, 40, 30), { pay: 40, tip: 10, cut: 20 }), "うりあげ から さきに・チップを へらす");
  ok(eq(C.clip(25, 40, 30), { pay: 25, tip: 0, cut: 45 }), "うりあげも へる");
  ok(eq(C.clip(0, 40, 30), { pay: 0, tip: 0, cut: 70 }) && eq(C.clip(-9, 40, 30), { pay: 0, tip: 0, cut: 70 }), "のこり 0・マイナスは 0");
  fresh();
  ok(C.left("crepe") === 20000 && !C.full("crepe"), "はじめは のこり 20000");
  C.add("crepe", 1500.9); C.add("crepe", -50); C.add("crepe", "abc");
  ok(C.earned("crepe") === 1500 && C.left("crepe") === 18500 && C.earned("bakery") === 0, "たす（はすうは きりすて・マイナスと かずで ない ものは たさない・おみせごと）");
  C.add("crepe", 99999);
  ok(C.earned("crepe") === 20000 && C.left("crepe") === 0 && C.full("crepe"), "20000 で とまる・いっぱい");
  S.d.shopDay.day = "2000-1-1";
  ok(C.earned("crepe") === 0 && S.d.shopDay.day === U.today() && C.left("crepe") === 20000, "日づけが かわると 0 から");
}

// ---- 4. ShopScene の しはらい（judge）----
{
  R.U.wait = async () => {}; // 1.7びょう まつ ところを とばす
  const judge = async (key, capped, score = 100, earn = 0) => {
    fresh(); S.d.shopDay.day = U.today(); if (capped != null) S.d.shopDay.earn[key] = capped;
    const sc = Object.create(ShopScene.prototype);
    Object.assign(sc, { shopId: "crepe", S: SHOPS.crepe, st: S.d.shops.crepe, lv: 5, workLv: 5, difficulty: "normal", variant: null, dailyBoost: 2, timeLeft: 30, timeLimit: 40,
      earn, tips: 0, rep: 0, ranks: [], team: [], cust: {}, coinsFx: [], fxs: [], capKey: key, capHit: false, task: null });
    await sc.judge(score);
    return sc;
  };
  const free = await judge("crepe", null);
  ok(free.earn + free.tips > 50 && !free.capHit, "ふだんは へらない: " + (free.earn + free.tips));
  const near = await judge("crepe", 19990);
  ok(near.earn + near.tips === 10 && near.capHit && near.ranks.length === 1, "のこり 10コイン → 10コイン だけ・この おきゃくさんで おしまい");
  const pend = await judge("crepe", 19900, 100, 95);
  ok(pend.earn + pend.tips === 100 && pend.capHit, "まだ もらって いない ぶん（この シフトの うりあげ）も かぞえる");
  const exact = await judge("crepe", 20000 - (free.earn + free.tips));
  ok(exact.earn + exact.tips === free.earn + free.tips && exact.capHit, "ちょうど いっぱいに なっても おしまい");
}

// ---- 5. くみこみ（ShopScene・お店・ころころ フルーツの スコア モード）----
{
  const mg = read("js/minigames.js"), store = read("js/scene-store.js"), koro = read("js/korokoro-score.js");
  ok(/ShopDayCap\.full\(this\.capKey\)[\s\S]{0,200}ShopDayCap\.fullText[\s\S]{0,120}this\.leaveTo\(\)/.test(mg), "ShopScene: いっぱいなら はじめずに もどる");
  ok(/ShopDayCap\.clip\(capLeft, pay, tip\)/.test(mg) && /if \(this\.capHit\) break;/.test(mg) && /ShopDayCap\.stopText/.test(mg), "ShopScene: のこりに おさめる・いっぱいで おしまい・ひとこと");
  ok(/Save\.addCoins\(total\);\s*ShopDayCap\.add\(this\.capKey, total\);/.test(mg), "ShopScene: もらった コインを きょうの ぶんに たす");
  ok(/UI\.btn\("もういちど", go\("again"\), "yellow"\)/.test(mg) && /Game\.goto\("shop", \{ shop: this\.shopId, back: this\.back, returnStore: this\.returnStore, returnVenue: this\.returnVenue, variant: this\.variant \}/.test(mg), "ShopScene: もういちど は おなじ おみせ・おなじ ゲーム・おなじ もどりさき");
  ok(/const again = !ShopDayCap\.full\(this\.capKey\)/.test(mg) && /hunger < 8/.test(mg.slice(mg.indexOf("async results("))), "ShopScene: いっぱい・おなかが ぺこぺこ の ときは もういちど できない");
  ok(/ShopDayCap\.full\(ShopDayCap\.key\(this\.shopId,this\.shopId==="burger"&&this\.back\.map==="heiwadai"\?"mac":null\)\)/.test(store), "お店: いっぱいなら おてつだいを はじめない（マックさんは べつの キー）");
  ok(/Math\.min\(earned, ShopDayCap\.left\("korokoro"\)\)/.test(koro) && /ShopDayCap\.add\("korokoro", coins\)/.test(koro) && /const again = !ShopDayCap\.full\("korokoro"\)/.test(koro), "ころころ フルーツの スコア モードも おなじ おみせ（korokoro）で かぞえる");
  const html = read("index.html"), sw = read("sw.js");
  ok(html.indexOf("js/shop-day-cap.js") > html.indexOf("js/economy.js") && html.indexOf("js/shop-day-cap.js") < html.indexOf("js/minigames.js") && sw.includes('"./js/shop-day-cap.js"'), "index.html（economy.js の あと・minigames.js の まえ）と sw.js に とうろく");
}

// ---- 6. ことば・PokaDebug ----
{
  fresh();
  for (const t of [C.fullText, C.stopText, C.leftText("crepe"), C.line("crepe")]) ok(!kanji.test(t) && t.length > 8, "ことばは ひらがな: " + t);
  ok(C.line("crepe") === "この おみせで きょう もらった コイン 0 / 20,000" && C.leftText("crepe").includes("20,000コイン"), "かずは 3けたごとに くぎる");
  const st = PokaDebug.shopCap("crepe", 19950);
  ok(st.max === 20000 && st.earn.crepe === 19950 && st.left === 50 && st.today === U.today(), "PokaDebug.shopCap: きめる・ようす");
  const back = PokaDebug.shopCap(null, null, "2000-1-1");
  ok(back.day === "2000-1-1" && C.earned("crepe") === 0, "PokaDebug.shopCap: 日づけを かえると 0 から");
  G.sceneName = "world";
  ok(PokaDebug.mgFinish(100) === false, "PokaDebug.mgFinish: おてつだいの とき だけ");
}

console.log(`✓ shop day cap (UI-67): ${n} checks（セーブ・キー・のこりに おさめる・日づけ・しはらい・もういちど・お店と スコア モード・ことば・PokaDebug）`);
