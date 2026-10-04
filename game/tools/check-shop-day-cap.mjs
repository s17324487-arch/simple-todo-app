// おてつだいの「もういちど」（UI-67）と、きょう もらった コインの きろく（js/shop-day-cap.js）の 検査。
// 1にちの コインの じょうげん（UI-67 の 20000）は オーナーの FB 2026-10-04「お手伝いの上限金額について、やっぱりなしにして」で なくした（UI-83）。
// ブラウザ なしで: セーブ（Save.d.shopDay・まえの セーブ）・おみせの キー（マックさん・びっくぽ）・たす・日づけで 0 から・
// ShopScene の しはらい（まえの じょうげんの ちかくでも へらない）・お店と ころころ フルーツの スコア モードに じょうげんが ない こと・「もういちど」・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ShopDayCap: C, ShopScene, Save: S, SHOPS, PokaDebug, G, U } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const file = (f) => new URL("../" + f, import.meta.url);
const read = (f) => readFileSync(file(f), "utf8");
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
  S.d.shopDay = { day: U.today(), earn: { crepe: "x", bakery: -5, cake: 12.7, florist: 20000 } };
  ok(C.earned("crepe") === 0 && C.earned("bakery") === 0 && C.earned("cake") === 12 && C.earned("florist") === 20000, "かずで ない・マイナス・はすうは 0 か きりすて（まえの じょうげんまで ためた セーブも そのまま よめる）");
}

// ---- 2. おみせの キー ----
{
  ok(C.key("crepe") === "crepe" && C.key("burger", "mac") === "burger_mac" && C.key("burger", null, "bikkupo") === "bikkupo_burger", "キー: ふつう・ヘイワダイの マックさん・びっくぽの キッチン は べつの おみせ");
  ok(C.key("brain", "spot") === "brain" && C.key("kobo", "logic") === "kobo", "あたまの たいそう・パズル こうぼうの ゲームは おなじ おみせ");
}

// ---- 3. じょうげんが ない・たす・日づけ ----
{
  for (const k of ["MAX", "left", "full", "clip", "fullText", "stopText", "leftText"]) ok(!(k in C), `じょうげんの しくみ（${k}）が のこって いない`);
  fresh();
  C.add("crepe", 1500.9); C.add("crepe", -50); C.add("crepe", "abc");
  ok(C.earned("crepe") === 1500 && C.earned("bakery") === 0, "たす（はすうは きりすて・マイナスと かずで ない ものは たさない・おみせごと）");
  C.add("crepe", 99999);
  ok(C.earned("crepe") === 101499, "まえの じょうげん（20000）を こえても とまらない");
  S.d.shopDay.day = "2000-1-1";
  ok(C.earned("crepe") === 0 && S.d.shopDay.day === U.today(), "日づけが かわると 0 から");
}

// ---- 4. ShopScene の しはらい（judge）: まえの じょうげんの ちかくでも へらない ----
{
  R.U.wait = async () => {}; // 1.7びょう まつ ところを とばす
  const judge = async (key, before, score = 100, earn = 0) => {
    fresh(); S.d.shopDay.day = U.today(); if (before != null) S.d.shopDay.earn[key] = before;
    const sc = Object.create(ShopScene.prototype);
    Object.assign(sc, { shopId: "crepe", S: SHOPS.crepe, st: S.d.shops.crepe, lv: 5, workLv: 5, difficulty: "normal", variant: null, dailyBoost: 2, timeLeft: 30, timeLimit: 40,
      earn, tips: 0, rep: 0, ranks: [], team: [], cust: {}, coinsFx: [], fxs: [], capKey: key, task: null });
    await sc.judge(score);
    return sc;
  };
  const free = await judge("crepe", null), got = free.earn + free.tips;
  ok(got > 50 && free.ranks.length === 1, "ふだんの しはらい: " + got);
  const near = await judge("crepe", 19990);
  ok(near.earn + near.tips === got && !("capHit" in near), "きょう もう 19990コイン でも おなじだけ もらえる（まえは 10コイン だけ）");
  const over = await judge("crepe", 250000, 100, 95);
  ok(over.earn + over.tips === 95 + got, "もっと たくさん もらった 日も へらない");
}

// ---- 5. くみこみ（ShopScene・お店・ころころ フルーツの スコア モード）----
{
  const mg = read("js/minigames.js"), koro = read("js/korokoro-score.js");
  const store = read("js/scene-store.js") + (existsSync(file("js/store-iso.js")) ? read("js/store-iso.js") : "");
  const capUse = /ShopDayCap\.(full|left|clip|fullText|stopText|leftText|MAX)\b|capHit|capCut/;
  ok(!capUse.test(mg), "ShopScene: じょうげんで はじめない・へらす・とちゅうで おわる しくみが ない");
  ok(/Save\.addCoins\(total\);\s*ShopDayCap\.add\(this\.capKey, total\);/.test(mg), "ShopScene: もらった コインを きょうの きろくに たす");
  ok(/UI\.btn\("もういちど", go\("again"\), "yellow"\)/.test(mg) && /Game\.goto\("shop", \{ shop: this\.shopId, back: this\.back, returnStore: this\.returnStore, returnVenue: this\.returnVenue, variant: this\.variant \}/.test(mg), "ShopScene: もういちど は おなじ おみせ・おなじ ゲーム・おなじ もどりさき");
  ok(/hunger < 8/.test(mg.slice(mg.indexOf("async results("))), "ShopScene: おなかが ぺこぺこ の ときは もういちど できない");
  ok(/ShopDayCap\.line\(this\.capKey\)/.test(mg), "ShopScene: けっかに きょう この おみせで もらった コイン");
  ok(!capUse.test(store), "お店: じょうげんで おてつだいを ことわらない");
  ok(!capUse.test(koro) && /ShopDayCap\.add\("korokoro", coins\)/.test(koro) && /foot\.append\(UI\.btn\("もういちど", go\("again"\), "yellow"\)\)/.test(koro), "ころころ フルーツの スコア モード: じょうげん なし・きろくは おなじ おみせ（korokoro）・もういちど");
  const html = read("index.html"), sw = read("sw.js");
  ok(html.indexOf("js/shop-day-cap.js") > html.indexOf("js/economy.js") && html.indexOf("js/shop-day-cap.js") < html.indexOf("js/minigames.js") && sw.includes('"./js/shop-day-cap.js"'), "index.html（economy.js の あと・minigames.js の まえ）と sw.js に とうろく");
}

// ---- 6. ことば・PokaDebug ----
{
  fresh();
  ok(C.line("crepe") === "きょう この おみせで もらった コイン 0" && !kanji.test(C.line("crepe")), "ことばは ひらがな・じょうげんの かずは ださない: " + C.line("crepe"));
  C.add("crepe", 23456);
  ok(C.line("crepe") === "きょう この おみせで もらった コイン 23,456", "かずは 3けたごとに くぎる");
  const st = PokaDebug.shopCap("crepe", 19950);
  ok(st.earn.crepe === 19950 && st.earned === 19950 && st.today === U.today() && !("max" in st) && !("left" in st), "PokaDebug.shopCap: きめる・ようす（max・left は ない）");
  const back = PokaDebug.shopCap(null, null, "2000-1-1");
  ok(back.day === "2000-1-1" && C.earned("crepe") === 0, "PokaDebug.shopCap: 日づけを かえると 0 から");
  G.sceneName = "world";
  ok(PokaDebug.mgFinish(100) === false, "PokaDebug.mgFinish: おてつだいの とき だけ");
}

console.log(`✓ shop day record (UI-67・UI-83): ${n} checks（セーブ・キー・じょうげん なし・日づけ・しはらい・もういちど・お店と スコア モード・ことば・PokaDebug）`);
