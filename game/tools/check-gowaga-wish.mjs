// ごわがの おねがい（js/gowaga-wish.js・UI-46。オーナーの FB 2026-10-02「お家で、ごわがからのお願いというイベントを追加して。…お願いを実現できたら、たくさん感謝して甘えて。」）の 検査。
// ブラウザ なしで: おねがい 20しゅ（しゅるい・3人・ことばは ひらがな・たべもの・ばしょ）・えらびかた・うける／やめる・かなう（たべさせる・ついた ばしょ・あそびの おわり）・
// おうちで きく じかん（12ふん・ことわったら 6ふん）・おれいを まつ・あまえる あいだ・セーブ（Save.d.wish は つかう ときに できる）・すまほの アプリ・とうろく・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { GowagaWish: W, Save: S, BAG_INDEX, MAP_DEFS, VenueHalls, Smaho, PokaDebug, Care, Purikura, Gacha, UI, Game, SCENES, VenueScene, WorldScene } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. おねがい 20しゅ ----
const L = W.WISHES, by = (k) => L.filter((x) => x.kind === k);
ok(L.length === 20 && new Set(L.map((x) => x.id)).size === 20, "おねがい 20しゅ・id が かさならない");
ok(by("go").length === 7 && by("eat").length === 8 && by("do").length === 5, "つれてって 7・たべたい 8・あそびたい 5");
ok(["do_purikura", "do_fashion"].every((id) => W.INDEX[id]) && by("go").length && by("eat").length, "オーナーの れい（つれてって・たべたい・ぷりくら・ファッションショー）");
for (const who of ["wanko", "gachan", "goji"]) ok(L.filter((x) => x.who === who).length >= 6, `${who} の おねがいが 6つ いじょう`);
for (const x of L) {
  ok(["wanko", "gachan", "goji"].includes(x.who) && W.KIND[x.kind], `${x.id}: だれ・しゅるい`);
  for (const k of ["short", "ask", "hint", "thanks"]) ok(typeof x[k] === "string" && x[k].length >= 2 && !kanji.test(x[k]) && [...x[k]].length <= 44, `${x.id}.${k}: ひらがなで 44もじ まで「${x[k]}」`);
  if (x.kind === "eat") { ok(Array.isArray(x.foods) && x.foods.length >= 1, `${x.id}: たべもの`); for (const f of x.foods) ok(BAG_INDEX[f] && BAG_INDEX[f].kind === "food", `${x.id}: ${f} は たべもの`); }
  if (x.kind === "go") for (const a of x.at) {
    if (a.venue) { const d = VenueHalls.defs[a.venue]; ok(!!d, `${x.id}: 館 ${a.venue}`); for (const fl of a.floors || []) ok(d && d.floors[fl], `${x.id}: ${a.venue} の ${fl}かい`); }
    else ok(a.map && MAP_DEFS[a.map], `${x.id}: ちず ${a.map}`);
  }
  if (x.kind === "do") ok(["purikura", "fashion", "fishing", "gacha", "harvest"].includes(x.act), `${x.id}: あそび ${x.act}`);
}
for (const id of ["wanko", "gachan", "goji"]) for (const T of [W.OTHER[id], [W.AMAE_ASK[id]], [W.HUG[id]], [W.PAT[id]], W.AMAE_LINES[id]]) for (const t of T) ok(t && !kanji.test(t), `${id}: ことば「${t}」`);

// ---- 2. セーブ（つかう ときに できる）----
{
  const f = S.fresh();
  ok(!("wish" in f) && S.SCHEMA === 2, "Save.fresh() に wish は ない・SCHEMA は 2");
  const d = fresh(), w = W.st();
  ok(d.wish === w && w.cur === null && w.n === 0 && Array.isArray(w.log) && Math.abs(w.last - Date.now()) < 5000, "はじめて つかう ときに できる（last は いま）");
  d.wish = { cur: { id: "nope", t: 1, done: false }, last: 5, n: 2, log: null };
  ok(W.st().cur === null && Array.isArray(W.st().log) && W.st().n === 2 && W.st().last === 5, "しらない おねがい・こわれた log は なおす");
}

// ---- 3. えらびかた ----
{
  fresh(); const w = W.st(), seq = [0, 0.13, 0.37, 0.51, 0.77, 0.99];
  for (const r of seq) ok(W.INDEX[W.pick(() => r).id], "pick は おねがいを かえす");
  w.log = [{ id: "eat_cake", t: 1 }];
  ok(L.length && Array.from({ length: 30 }, (_, i) => W.pick(() => i / 30)).every((x) => x.kind !== "eat"), "まえと おなじ しゅるいは つづかない");
  w.log = L.slice(0, 8).map((x) => ({ id: x.id, t: 1 }));
  ok(Array.from({ length: 30 }, (_, i) => W.pick(() => i / 30)).every((x) => !w.log.some((y) => y.id === x.id)), "さいきんの 8つは でない");
  w.log = L.map((x) => ({ id: x.id, t: 1 }));
  ok(!!W.pick(() => 0.5), "ぜんぶ でても えらべる");
}

// ---- 4. うける・やめる・かなう ----
{
  fresh();
  ok(W.start("eat_cake") && !W.start("go_beach") && W.st().cur.id === "eat_cake", "うけると cur・2つめは うけない");
  ok(!W.signal("eat", "burger") && !W.signal("go", { venue: "mall", floor: 12 }) && !W.signal("do", "purikura") && !W.st().cur.done, "ちがう もの では かなわない");
  ok(W.signal("eat", "cake") && W.st().cur.done && W.st().cur.doneT > 0 && !W.signal("eat", "cake"), "ケーキで かなう（1かい だけ）");
  ok(!W.cancel(), "かなった おねがいは やめられない");
  fresh(); W.start("go_aquarium");
  ok(!W.arrive({ venue: "mall", floor: 3 }) && !W.arrive({ map: "coast" }) && W.arrive({ venue: "mall", floor: 13 }), "すいぞくかん: 12・13かい だけ");
  fresh(); W.start("go_beach"); ok(!W.arrive({ venue: "mall", floor: 1 }) && W.arrive({ map: "coast" }), "うみ: しおかぜビーチ");
  fresh(); W.start("do_purikura"); ok(!W.signal("do", "gacha") && W.signal("do", "purikura"), "ぷりくら");
  fresh(); W.start("eat_oden"); const t0 = Date.now(); ok(W.cancel() && !W.st().cur && W.st().last <= t0 - W.COOL / 2 + 50, "やめると つぎは はんぶんの じかんで");
  ok(!W.arrive({ map: "coast" }) && !W.signal("eat", "oden"), "おねがいが ない ときは なにも しない");
}

// ---- 5. くみこみ（たべさせる・ぷりくら・ガチャ・ほかは ソース）----
{
  const d = fresh(); W.start("eat_cake"); d.bag.cake = 1;
  ok(Care.feed("gachan", "cake") && W.st().cur.done, "Care.feed で ケーキを たべると かなう");
  fresh(); W.start("eat_cake"); S.d.bag.burger = 1; Care.feed("wanko", "burger"); ok(!W.st().cur.done, "ちがう たべもの では かなわない");
  fresh(); W.start("do_purikura"); S.d.coins = 5000; ok(Purikura.pay() && Purikura.finish([]) && W.st().cur.done, "ぷりくらの できあがりで かなう");
  fresh(); W.start("do_gacha"); S.d.coins = 5000; ok(Gacha.spin(0, 0.5) && W.st().cur.done, "ガチャを まわすと かなう");
  fresh(); W.start("do_gacha"); S.d.coins = 0; ok(!Gacha.spin(0, 0.5) && !W.st().cur.done, "コインが なくて まわせない ときは かなわない");
  const src = read("js/gowaga-wish.js");
  for (const [obj, fn, sig] of [["FashionShow", "finish", '"do", "fashion"'], ["Fishing", "record", '"do", "fishing"'], ["Farm", "harvest", '"do", "harvest"']]) ok(src.includes(`after(${obj}, "${fn}"`) && src.includes(`GowagaWish.signal(${sig})`), `${obj}.${fn} で かなう`);
  // WorldScene.prototype.enter は あとで world-zoom.js が つつむ ので ソースで たしかめる
  ok(src.includes("VP.loadFloor = function") && src.includes("GowagaWish.arrive({ venue: this.id, floor: this.floor })") && src.includes("WP.enter = async function") && src.includes("GowagaWish.arrive({ map: this.mapId })") && typeof VenueScene.prototype.loadFloor === "function" && typeof WorldScene.prototype.enter === "function", "館の かい・町と フィールドに はいると しらべる");
  // おうちの update は あとで home-toilet.js なども つつむ ので ソースで たしかめる
  ok(src.includes("HS.update = function (dt) { up.call(this, dt); GowagaWish.house(this, dt); };") && typeof SCENES.house.prototype.update === "function", "おうちの まいフレーム");
}

// ---- 6. おうち: きく じかん・おれいを まつ・あまえる ----
{
  const calls = [], realAsk = W.ask, realThank = W.thank;
  W.ask = (sc, id) => { calls.push(["ask", id]); return Promise.resolve(false); };
  W.thank = (sc) => { calls.push(["thank"]); return Promise.resolve(false); };
  const kid = (id) => ({ id, x: 100, y: 300, state: "idle", t: 2, hidden: false });
  const mk = () => ({ mode: null, life: { quarrel: false, next: 0, queue: [] }, work: { phase: "home" }, chars: ["wanko", "gachan", "goji"].map(kid), wishFx: { t: 0, ask: 6, busy: false, amae: 0, beat: 0 }, fx() {}, react() {} });
  UI.layers = 0; Game.trans = null;
  fresh(); let sc = mk();
  for (let i = 0; i < 80; i++) W.house(sc, 0.1);
  ok(!calls.length && sc.wishFx.ask === null, "はじめて つかってから 12ふんは きかない");
  W.st().last = Date.now() - W.COOL - 1000; sc = mk();
  for (let i = 0; i < 50; i++) W.house(sc, 0.1);
  ok(!calls.length, "6びょう までは きかない");
  for (let i = 0; i < 20; i++) W.house(sc, 0.1);
  ok(calls.length === 1 && calls[0][0] === "ask", "6びょうで きく（1かい だけ）");
  calls.length = 0; sc = mk(); sc.mode = "dress"; for (let i = 0; i < 80; i++) W.house(sc, 0.1);
  ok(!calls.length, "きがえ・もようがえの あいだは きかない");
  sc.mode = null; sc.work.phase = "arriving"; for (let i = 0; i < 10; i++) W.house(sc, 0.1);
  ok(!calls.length, "ぱぱ・ままが かえって くる あいだは きかない");
  sc.work.phase = "away"; sc.life.quarrel = true; for (let i = 0; i < 10; i++) W.house(sc, 0.1);
  ok(!calls.length, "けんかの あいだは きかない");
  sc.life.quarrel = false; for (let i = 0; i < 10; i++) W.house(sc, 0.1);
  ok(calls.length === 1, "ぱぱ・ままが おしごとの あいだも きく");
  calls.length = 0; W.start("eat_cake"); W.signal("eat", "cake"); sc = mk();
  for (let i = 0; i < 10; i++) W.house(sc, 0.1);
  ok(!calls.length, "かなったら 1.5びょう まって");
  for (let i = 0; i < 10; i++) W.house(sc, 0.1);
  ok(calls.some((c) => c[0] === "thank") && !calls.some((c) => c[0] === "ask"), "おれい（きかない）");
  // あまえる あいだ
  calls.length = 0; W.st().cur = null; sc = mk(); sc.wishFx.ask = null; sc.wishFx.amae = 2; sc.wishFx.beat = 99;
  W.house(sc, 0.1);
  ok(sc.chars.every((k) => k.state === "amae" && k.emo === "love") && sc.life.next >= 3, "あまえる あいだは そばに いる・ほかの かけあいは まつ");
  for (let i = 0; i < 25; i++) W.house(sc, 0.1);
  ok(sc.wishFx.amae === 0 && sc.chars.every((k) => k.state === "idle" && k.emo === null), "あまえる じかんが おわると いつもどおり");
  W.ask = realAsk; W.thank = realThank;
}

// ---- 7. すまほ・とうろく・PokaDebug ----
{
  const app = Smaho.APPS.find((a) => a.id === "wish");
  ok(app && app.name === "おねがい" && [...app.name].length <= 7 && Smaho.ICON.wish && app.when(), "すまほの アプリ「おねがい」と アイコン");
  const idx = read("index.html"), sw = read("sw.js"), at = (f) => idx.indexOf(`js/${f}`);
  ok(at("gowaga-wish.js") > 0 && ["scene-house.js", "scene-world.js", "venue-hall.js", "iso-venue.js", "save.js", "purikura.js", "fashion-show.js", "fishing.js", "gacha.js", "farm.js", "smaho.js"].every((f) => at(f) > 0 && at(f) < at("gowaga-wish.js")) && at("gowaga-wish.js") < at("debug.js") && sw.includes('"./js/gowaga-wish.js"'), "index.html と sw.js に とうろく（くみこむ ものの あと・debug.js の まえ）");
  fresh(); W.start("go_museum");
  const p = PokaDebug.wish();
  ok(p && p.cur && p.cur.id === "go_museum" && p.cur.kind === "go" && p.cur.who === "goji" && p.ids.length === 20 && p.n === 0, "PokaDebug.wish " + JSON.stringify(p));
}

console.log(`✓ gowaga wish: ${n} checks（おねがい 20・つれてって 7・たべたい 8・あそびたい 5）`);
