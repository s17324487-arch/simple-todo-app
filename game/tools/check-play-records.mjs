// きろく（js/play-records.js・UI-71）の 検査。
// ブラウザ なしで: セーブ（Save.fresh・まえの セーブ・こわれた 形）・add の きまり・ごはん（たべものごと・だいすき・デザの おねだり → もらえた）・
// トイレ・なでなで・つり・バトル（くみこみ）・おねがい（gowaga-wish.js）・せんとうに する（menu.js）・みんなの きろく・ずかんの「たべもの」・
// ようすの「きろく」タブ・ことば・index.html と sw.js・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { PlayRecords: P, Save: S, Care, CHARA_INFO, FOODS, BAG_INDEX, HomeToilet, Fishing, SCENES, Menu, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = () => { S.d = S.fresh(); return S.d; };

// ---- 1. セーブ ----
{
  const d = fresh();
  ok(d.records && d.records.since === "" && JSON.stringify(d.records.kids) === "{}" && JSON.stringify(d.records.food) === "{}" && d.records.battle.fled === 0 && d.records.battle.lost === 0, "Save.fresh().records");
  const st = P.st(); ok(st.since === R.U.today(), "はじめて つかった 日から かぞえる（since）");
  const old = S.fresh(); delete old.records;
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.records && m.records.battle && m.records.kids, "まえの セーブにも records が できる");
  S.d = m; P.add("wanko", "pat");
  ok(P.get("wanko", "pat") === 1 && P.KEYS.every((k) => P.kid("gachan")[k] === 0), "まえの セーブでも かぞえられる");
  S.d.records = []; ok(!Array.isArray(P.st()) && P.st().battle.fled === 0, "こわれた records を なおす");
  S.d.records = { kids: { wanko: [] }, food: 3, battle: null }; ok(P.kid("wanko").ate === 0 && typeof P.st().food === "object" && P.st().battle.lost === 0, "こわれた kids・food・battle を なおす");
  S.d.records.kids.goji = { ate: -5, pat: "x", hug: 2 }; const g = P.kid("goji"); ok(g.ate === 0 && g.pat === 0 && g.hug === 2, "こわれた かずは 0 に・ただしい かずは そのまま");
}

// ---- 2. add の きまり ----
{
  fresh();
  ok(P.KEYS.length === 15 && new Set(P.KEYS).size === 15, "きろくの キーは 15");
  ok(P.add("wanko", "pat") === 1 && P.add("wanko", "pat", 3) === 4, "かずを たす");
  ok(P.add("nobody", "pat") === 0 && P.add("wanko", "nope") === 0 && P.get("wanko", "pat") === 4, "しらない 子・しらない キーは かぞえない");
}

// ---- 3. ごはん ----
{
  const d = fresh();
  const likeW = CHARA_INFO.wanko.like.find((id) => BAG_INDEX[id] && BAG_INDEX[id].kind === "food" && !BAG_INDEX[id].deza) || CHARA_INFO.wanko.like[0];
  R.Save.addBag("apple", 3); R.Save.addBag(likeW, 1);
  Care.feed("wanko", "apple"); Care.feed("gachan", "apple"); Care.feed("wanko", likeW);
  ok(P.foodCount("apple") === 2 && P.foodCount("apple", "wanko") === 1 && P.foodCount("apple", "gachan") === 1, "たべものごとの かず（3人べつ）");
  ok(P.get("wanko", "ate") === 2 && P.get("gachan", "ate") === 1 && P.get("wanko", "fav") === 1 && P.get("gachan", "fav") === (CHARA_INFO.gachan.like.includes("apple") ? 1 : 0), "たべた・だいすきな もの: " + likeW);
  const before = P.get("goji", "ate"); ok(Care.feed("goji", "apple") && P.get("goji", "ate") === before + 1, "もって いる ぶん たべた");
  d.bag.apple = 0; ok(!Care.feed("goji", "apple") && P.get("goji", "ate") === before + 1, "たべられなかった ときは かぞえない");
  // デザの おねだり → もらえた
  const meal = FOODS.find((f) => (f.hunger || 0) >= 20 && !f.boost && !f.deza && !f.spicy), deza = FOODS.find((f) => f.deza);
  R.Save.addBag(meal.id, 2); R.Save.addBag(deza.id, 1);
  d.chars.goji.wantsDeza = false; Care.feed("goji", meal.id);
  ok(d.chars.goji.wantsDeza && P.get("goji", "deza") === 1, "ごはんの あと デザの おねだり: " + meal.id);
  Care.feed("goji", meal.id); ok(P.get("goji", "deza") === 1, "おねだり ちゅうは かさねて かぞえない");
  Care.feed("goji", deza.id); ok(!d.chars.goji.wantsDeza && P.get("goji", "dezaYes") === 1, "デザを もらえた: " + deza.id);
}

// ---- 4. トイレ・なでなで・つり ----
{
  const d = fresh();
  HomeToilet.done("gachan"); HomeToilet.done("gachan"); ok(P.get("gachan", "toilet") === 2, "トイレ（HomeToilet.done）");
  const sc = { react() {}, updateCare() {}, life: { bubbles: [], log: [], queue: [] } };
  SCENES.house.prototype.pet.call(sc, { id: "goji" }); ok(P.get("goji", "pat") === 1, "なでなで（おうちで タップ）");
  d.order = ["gachan", "wanko", "goji"];
  Fishing.record(R.FISHING_DATA.fish[0].id, 20); ok(P.get("gachan", "fish") === 1 && P.get("wanko", "fish") === 0, "つり（せんとうの 子）");
}

// ---- 5. バトル・おねがい・せんとう（くみこみの ばしょ）----
{
  const pr = read("js/play-records.js"), w = (fn, key) => new RegExp(`wrap\\(BP, "${fn}"[^\\n]*${key}`).test(pr);
  ok(w("enter", "leadBattle") && w("useSkill", '"skill"') && w("endFlee", "fled\\+\\+") && w("defeat", "lost\\+\\+") && /wrap\(BP, "hit"[\s\S]{0,260}PlayRecords\.add\(u\.id, "ko"\)/.test(pr), "バトル: せんとうで たたかった・たおした・とくぎ・にげた・まけ（くみこみ）");
  ok(["enter", "hit", "useSkill", "endFlee", "defeat"].every((k) => typeof R.BattleScene.prototype[k] === "function"), "バトルの くみこみ さき が ある");
  const gw = read("js/gowaga-wish.js");
  ok(/PlayRecords\.add\(x\.who, "ask"\);[^\n]*\n\s*const i = await UI\.ask\(x\.ask/.test(gw), "おねがい: まどを だす ときに おねがいした");
  ok(/this\.start\(x\.id\);\s*if \(typeof PlayRecords !== "undefined"\) PlayRecords\.add\(x\.who, "yes"\);/.test(gw), "おねがい: いいよ");
  ok(/PlayRecords\.add\(x\.who, "done"\); for \(const k of kids\) PlayRecords\.add\(k\.id, hug \? "hug" : "pat"\);/.test(gw), "おねがい: かなった・ぎゅー／なでなで（3人）");
  ok(/d\.order\.unshift\(id\); if \(typeof PlayRecords !== "undefined"\) PlayRecords\.add\(id, "lead"\);/.test(read("js/menu.js")), "ようすの「せんとうに する」で せんとうに なった");
}

// ---- 6. みんなの きろく ----
{
  const d = fresh();
  d.stats.battles = 12; d.stats.wins = 10; d.stats.shifts = 7; d.stats.perfects = 2; d.stats.coinsEarned = 12345; d.stats.fed = 30;
  P.st().battle.fled = 1; P.st().battle.lost = 1;
  d.wish = { cur: null, last: 0, n: 4, log: [] };
  const t = Object.fromEntries(P.team());
  ok(t["バトル"] === "12かい（かち 10・まけ 1・にげた 1）", "みんなの きろく: バトル " + t["バトル"]);
  ok(t["おてつだい"] === "7かい（パーフェクト 2）" && t["もらった コイン"] === "12,345コイン" && t["ごはんを あげた"] === "30かい" && /^4かい/.test(t["おねがいを かなえた"]), "みんなの きろく: おてつだい・コイン・ごはん・おねがい " + JSON.stringify(t));
  ok(Object.keys(t).every((k) => !kanji.test(k)) && Object.values(t).every((v) => !kanji.test(v)), "みんなの きろくは ひらがな");
}

// ---- 7. ずかんの「たべもの」・ようすの「きろく」・ことば ----
{
  fresh();
  const foods = P.foods();
  ok(foods.length >= 100 && foods.every((f) => BAG_INDEX[f.id].kind === "food") && new Set(foods.map((f) => f.id)).size === foods.length, `ずかんの たべもの ${foods.length}しゅ`);
  ok(foods.every((f) => R.Art.iconSvg("bag", f.id).startsWith("<svg")), "たべものの 絵");
  const menu = read("js/menu.js");
  ok(/\["food", "たべもの"\]/.test(menu) && /if \(kind === "food"\) return PlayRecords\.foodDex\(el\);/.test(menu) && /kinds\.length > 5 \? 3 : kinds\.length/.test(menu), "ずかんに「たべもの」タブ（6つ なら 3れつ × 2だん）");
  ok(/PlayRecords\.view\(el/.test(Menu.status.toString()) && /recBox/.test(Menu.status.toString()), "ようすに「ようす」「きろく」の タブ（かきなおしは なかの はこ だけ）");
  for (const [title, rows] of P.ROWS) { ok(!kanji.test(title), "みだし " + title); for (const [label, , unit] of rows) ok(!kanji.test(label + unit), "きろく " + label); }
  const src = read("js/play-records.js");
  const texts = [...src.matchAll(/text: "([^"]+)"/g), ...src.matchAll(/text: `([^`]+)`/g), ...src.matchAll(/textContent = `([^`]+)`/g), ...src.matchAll(/UI\.btn\("([^"]+)"/g), ...src.matchAll(/\["(?:most|list|status|rec)", "([^"]+)"\]/g)].map((m) => m[1]);
  ok(texts.length >= 6 && texts.every((t) => !kanji.test(t.replace(/\$\{[^}]*\}/g, ""))), "がめんの ことばは ひらがな（" + texts.length + "）");
  ok(/先頭/.test(src) && /戦闘/.test(src) && P.ROWS.flatMap(([, r]) => r).some((x) => x[1] === "lead") && P.ROWS.flatMap(([, r]) => r).some((x) => x[1] === "leadBattle"), "「先頭の回数」は せんとう（れつ）と バトルの どちらも のせる");
}

// ---- 8. くみこみ・PokaDebug ----
{
  const html = read("index.html"), sw = read("sw.js");
  const at = (f) => html.indexOf(`js/${f}`);
  ok(at("play-records.js") > at("home-toilet.js") && at("play-records.js") > at("gowaga-wish.js") && at("play-records.js") > at("scene-battle.js") && at("play-records.js") > at("menu.js") && at("play-records.js") < at("debug.js") && sw.includes('"./js/play-records.js"'), "index.html と sw.js に とうろく（くみこむ ものの あと）");
  ok(/records: \{ since: "", kids: \{\}, food: \{\}, battle: \{ fled: 0, lost: 0 \} \}/.test(read("js/save.js")), "save.js の fresh に records");
  fresh(); PokaDebug.recordsAdd("wanko", "toilet", 2);
  const st = PokaDebug.records(); ok(st && st.kids.wanko.toilet === 2 && Array.isArray(st.team) && st.since, "PokaDebug.records・recordsAdd " + JSON.stringify(st.kids.wanko));
}

console.log(`✓ play records (UI-71): ${n} checks（セーブ・ごはん・デザの おねだり・トイレ・なでなで・つり・バトル・おねがい・せんとう・みんなの きろく・ずかん・ようす）`);
