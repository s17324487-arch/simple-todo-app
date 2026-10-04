// ごわがの おねがい（js/gowaga-wish.js・UI-46。オーナーの FB 2026-10-02「お家で、ごわがからのお願いというイベントを追加して。…お願いを実現できたら、たくさん感謝して甘えて。」）の 検査。
// ブラウザ なしで: おねがい 20しゅ（しゅるい・3人・ことばは ひらがな・たべもの・ばしょ）・えらびかた・うける／やめる・かなう（たべさせる・ついた ばしょ・あそびの おわり）・
// おうちで きく じかん（12ふん・ことわったら 6ふん）・おれいを まつ・あまえる あいだ・セーブ（Save.d.wish は つかう ときに できる）・すまほの アプリ・とうろく・PokaDebug・
// おねだり（UI-88: 家電・シール・ガチャ・クレーンの 9しゅ・ガチャと クレーンは でやすい・館の その かいで おねだり・クレーン／シール／マッサージ／ためしの だいで かなう）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { GowagaWish: W, Save: S, BAG_INDEX, MAP_DEFS, VenueHalls, Smaho, PokaDebug, Care, Purikura, Gacha, UI, Game, SCENES, VenueScene, WorldScene, PrizeArcade: PA, StickerBook, KadenHall, PlayRecords, G } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. おねがい 29しゅ（UI-88 で 9しゅ ふえた）----
const L = W.WISHES, by = (k) => L.filter((x) => x.kind === k);
ok(L.length === 29 && new Set(L.map((x) => x.id)).size === 29, "おねがい 29しゅ・id が かさならない");
ok(by("go").length === 8 && by("eat").length === 8 && by("do").length === 13, "つれてって 8・たべたい 8・あそびたい 13");
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
  if (x.kind === "do") ok(["purikura", "fashion", "fishing", "gacha", "harvest", "crane", "sticker", "massage", "demo"].includes(x.act), `${x.id}: あそび ${x.act}`);
  if (x.begAsk !== undefined) ok(typeof x.begAsk === "string" && x.begAsk.length >= 2 && !kanji.test(x.begAsk) && [...x.begAsk].length <= 44 && x.begAsk.split("\n").length === 2 && x.begAsk.split("\n").every((t) => t.length >= 4 && [...t].length <= 14) && Array.isArray(x.beg) && x.beg.length, `${x.id}.begAsk: ひらがなで 2ぎょう（1ぎょう 14もじ まで）「${x.begAsk}」`);
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
  ok(p && p.cur && p.cur.id === "go_museum" && p.cur.kind === "go" && p.cur.who === "goji" && p.ids.length === 29 && p.n === 0 && p.begs.length === 10 && Array.isArray(p.begHere), "PokaDebug.wish " + JSON.stringify(p));
}

// ---- 8. おねだり（UI-88。オーナーの 指示 2026-10-04「おねだりは家電やシール、ガチャガチャ、クレーンゲームも対象にして。とくにガチャガチャとクレーンゲームはよくやりたくなるようだ」）----
{
  const act = (a) => L.filter((x) => x.act === a);
  ok(act("crane").length === 3 && act("gacha").length === 3 && new Set([...act("crane"), ...act("gacha")].map((x) => x.who)).size === 3, "クレーン 3・ガチャ 3（3にん それぞれ）");
  ok(W.INDEX.go_kaden && W.INDEX.go_kaden.at[0].venue === "electronics" && act("massage").length === 1 && act("demo").length === 1 && act("sticker").length === 1, "家電（ネリカス でんきへ・マッサージチェア・ためしの だい）・シール");
  ok(L.every((x) => (x.act === "crane" || x.act === "gacha" ? x.w === 3 : !x.w)), "ガチャと クレーンは でやすさ 3（ほかは 1）");
  // でやすさ: まえが つれてって・たべたい の とき、ガチャと クレーンが はんぶん いじょう
  const share = (logId) => { fresh(); W.st().log = logId ? [{ id: logId, t: 1 }] : []; const N = 600, n = Array.from({ length: N }, (_, i) => W.pick(() => (i + 0.5) / N)).filter((x) => x.act === "crane" || x.act === "gacha").length; return n / N; };
  const s0 = share(null), sGo = share("go_beach"), sEat = share("eat_cake"), sDo = share("do_fishing");
  ok(s0 > 0.38 && sGo > 0.5 && sEat > 0.5 && sDo === 0, `ガチャと クレーンが でやすい（ぜんぶ ${s0.toFixed(2)}・つれてっての あと ${sGo.toFixed(2)}・たべたいの あと ${sEat.toFixed(2)}・あそびたいの あとは ${sDo}）`);
  // おねだりの ばしょ: 館・かいが ある・その かいで できる
  const fix = (v, f) => VenueHalls.defs[v].floors[f].fixtures;
  const can = { crane: (v, f) => fix(v, f).some((x) => x.action === "crane" && PA.machines[x.machine] && PA.machines[x.machine].type !== "pusher"), gacha: (v, f) => fix(v, f).some((x) => x.action === "gacha"), purikura: (v, f) => fix(v, f).some((x) => x.action === "photo"), massage: (v, f) => fix(v, f).some((x) => x.action === "massage"), demo: (v, f) => fix(v, f).some((x) => x.action === "demo"),
    sticker: (v, f) => fix(v, f).some((x) => x.action === "stickers" || (x.action === "gacha" && Gacha.SERIES[x.series] && Gacha.SERIES[x.series].list.every((it) => it.kind === "sticker"))) };
  for (const x of L.filter((y) => y.beg)) for (const a of x.beg) for (const f of a.floors) ok(VenueHalls.defs[a.venue] && VenueHalls.defs[a.venue].floors[f] && can[x.act] && can[x.act](a.venue, f), `${x.id}: ${a.venue} ${f}かいで ${x.act} が できる`);
  ok(L.filter((x) => x.beg).map((x) => x.id).sort().join() === ["do_crane", "do_crane_goji", "do_crane_snack", "do_gacha", "do_gacha_forest", "do_gacha_goji", "do_kaden_try", "do_massage", "do_purikura", "do_sticker"].sort().join(), "おねだり する おねがい 10");
  ok(W.begList({ venue: "arcade", floor: 2 }).map((x) => x.id).join() === "do_gacha,do_gacha_forest,do_gacha_goji,do_crane,do_crane_snack,do_crane_goji" && W.begList({ venue: "electronics", floor: 10 }).map((x) => x.id).join() === "do_massage" && !W.begList({ venue: "electronics", floor: 2 }).length && !W.begList({ venue: "mall", floor: 1 }).length && !W.begList(null).length, "その かいで できる おねだり");
  // 館の まいフレーム（W.beg を すりかえて よばれた か だけ みる）
  const calls = [], realBeg = W.beg;
  W.beg = (sc, id) => { calls.push([sc.id, sc.floor, id]); return Promise.resolve(false); };
  const mk = (id, floor) => ({ id, floor, busy: false, closed: false, lift: 0 }), run = (sc, n, r = () => 0) => { for (let i = 0; i < n; i++) W.venue(sc, 0.1, r); };
  UI.layers = 0; Game.trans = null;
  ok(!Game.inputLocked, "（けんさ）にゅうりょくを とめて いない");
  fresh(); let sc = mk("arcade", 1); run(sc, 120);
  ok(!calls.length && sc.begFx.at === null, "はじめて つかってから 5ふんは おねだり しない");
  W.st().last = Date.now() - W.BEG_COOL - 1000; sc = mk("arcade", 1); run(sc, 39);
  ok(!calls.length, "4びょう までは おねだり しない");
  run(sc, 3); ok(calls.length === 1 && calls[0].join() === "arcade,1,", "4びょうで おねだり（その かい）");
  run(sc, 200); ok(calls.length === 1, "おなじ かいでは 1かい だけ");
  sc.floor = 2; run(sc, 50); ok(calls.length === 2 && calls[1][1] === 2, "かいを かえると また おねだり できる");
  calls.length = 0; sc = mk("arcade", 1); run(sc, 120, () => 0.7); ok(!calls.length, "はんぶんの かくりつ（はずれ）");
  sc = mk("arcade", 1); sc.busy = true; run(sc, 80); ok(!calls.length, "しらべて いる あいだは まつ"); sc.busy = false; run(sc, 2); ok(calls.length === 1, "おわったら おねだり");
  calls.length = 0; W.start("eat_cake"); sc = mk("arcade", 1); run(sc, 80); ok(!calls.length, "おねがいが ある ときは おねだり しない"); W.st().cur = null; W.st().last = Date.now() - W.BEG_COOL - 1000;
  sc = mk("mall", 1); run(sc, 80); sc = mk("electronics", 2); run(sc, 80); ok(!calls.length, "おねだりの ない 館・かいでは しない");
  sc = mk("electronics", 10); run(sc, 80); ok(calls.length === 1 && calls[0].join() === "electronics,10,", "ネリカス でんき 10かい（マッサージチェア）");
  W.beg = realBeg;
  // おねだりの まど（UI.ask を すりかえる）: いいよ → おねがいに なる・きろく／また こんどね → 5ふん まつ
  const realAsk = UI.ask, asked = [];
  for (const [ans, id] of [[0, "do_crane"], [1, "do_gacha_goji"]]) {
    fresh(); W.st().last = 0; sc = mk("arcade", 2); G.scene = sc;
    UI.ask = (text, btns, o) => { asked.push([text, btns.join(), o.name, o.who]); return Promise.resolve(ans); };
    const before = (S.d.records && S.d.records.kids && S.d.records.kids[W.INDEX[id].who]) ? { ...S.d.records.kids[W.INDEX[id].who] } : {};
    const r = await W.beg(sc, id), after = PlayRecords.st().kids[W.INDEX[id].who];
    if (ans === 0) ok(r === true && W.st().cur && W.st().cur.id === id && !W.st().cur.done && !sc.busy && !W.asking && (after.ask || 0) === (before.ask || 0) + 1 && (after.yes || 0) === (before.yes || 0) + 1, "いいよ！ → おねがいに なる・きろく");
    else ok(r === false && !W.st().cur && Date.now() - W.st().last < 2000 && !sc.busy, "また こんどね → おねがいに ならない・5ふん まつ");
  }
  ok(asked[0][0] === W.INDEX.do_crane.begAsk && asked[0][1] === "いいよ！,また こんどね" && asked[0][2] === "わんこの おねだり" && asked[0][3] === "wanko" && asked[1][2] === "ごじの おねだり", "おねだりの まど（ことば・ボタン・なまえ・かお）");
  UI.ask = realAsk;
  // かなう: クレーン（プッシャーは のぞく）・シール（うりば・シールの ガチャ）・マッサージチェア・ためしの だい
  const back = { venue: "arcade", floor: 1, back: { map: "city", x: 1, y: 1, dir: "down" } }, push = PA.machines.findIndex((m) => m.type === "pusher");
  fresh(); S.d.coins = 1000; W.start("do_crane");
  let rn = PA.start(push, back); ok(rn && PA.finish(rn, { got: [] }) && !W.st().cur.done, "コイン プッシャーでは かなわない");
  rn = PA.start(0, back); ok(rn && PA.finish(rn, { got: [] }) && W.st().cur.done, "クレーンを 1かい あそぶと かなう（とれなくても）");
  fresh(); W.start("do_sticker"); ok(StickerBook.add(StickerBook.IDX ? Object.keys(StickerBook.INDEX)[0] : Object.keys(StickerBook.INDEX)[0], 1) && W.st().cur.done, "シールを もらうと かなう（うりば）");
  fresh(); S.d.coins = 1000; W.start("do_sticker"); const ss = Gacha.SERIES.findIndex((x) => x.list.every((it) => it.kind === "sticker"));
  ok(ss >= 0 && Gacha.spin(ss, 0.5) && W.st().cur.done, "シールの ガチャで かなう");
  fresh(); S.d.coins = 1000; W.start("do_gacha_goji"); ok(Gacha.spin(ss, 0.5) && W.st().cur.done, "シールの ガチャも ガチャ");
  const realSay = UI.say; UI.say = () => Promise.resolve();
  const ksc = { busy: false };
  fresh(); W.start("do_massage"); await KadenHall.interact(ksc, { action: "demo", demo: "game" }); ok(!W.st().cur.done, "ためしの だいでは マッサージは かなわない");
  await KadenHall.interact(ksc, { action: "massage" }); ok(W.st().cur.done && !ksc.busy, "マッサージチェアで かなう");
  fresh(); W.start("do_kaden_try"); await KadenHall.interact(ksc, { action: "demo", demo: "camera" }); ok(W.st().cur.done, "ためしの だいで かなう");
  UI.say = realSay;
  const src = read("js/gowaga-wish.js");
  ok(src.includes("VP.update = function (dt) { vup.call(this, dt); if (G.sceneName === \"venue\" && G.scene === this) GowagaWish.venue(this, dt); };"), "館の まいフレームで おねだり");
}

console.log(`✓ gowaga wish: ${n} checks（おねがい 29・つれてって 8・たべたい 8・あそびたい 13〔ガチャ 3・クレーン 3 は でやすさ 3〕・館の おねだり 10）`);
