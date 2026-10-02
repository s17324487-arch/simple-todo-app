// おトイレ（js/home-toilet.js・UI-47。オーナーの FB 2026-10-02「おトイレにも行かせたい」）の 検査。
// ブラウザ なしで: いきたさ（じかん・たべもの・のみもの・0〜100）・セーブ（Save.d.toilet は つかう ときに できる・こわれた ものを なおす）・
// ドア（おくの かべ・まどと「おへや」の ドアに かさならない・おにわには ない・へやの 絵）・タップ（いちばん いきたい 子・だれも いきたく ない・はいって いる）・
// はいる → でる（いきたさが 0・ごきげん）・もじもじ・がまんの げんかい・まつ とき（きがえ など）・とちゅうで やめる・ぱぱ ままの おせわ・ことば・とうろく・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomeToilet: T, HomeDoors, HomeLife, HomeDesign, HomeGarden, ParentCare, Save: S, Care, UI, Game, G, ROOM, CHARA_FACE_EXTRA, SCENES, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const near = (a, b, e = 0.6) => Math.abs(a - b) <= e;
const IDS = ["wanko", "gachan", "goji"];

// ---- 1. いきたさ と セーブ ----
{
  const f = S.fresh();
  ok(!("toilet" in f) && S.SCHEMA === 2, "Save.fresh() に toilet は ない・SCHEMA は 2");
  const d = fresh(), t = T.st();
  ok(d.toilet === t && IDS.every((id) => Number.isFinite(t.at[id]) && t.add[id] === 0) && t.n === 0, "はじめて つかう ときに できる");
  ok(near(T.need("wanko"), 0) && near(T.need("gachan"), 8 / 90 * 100, 1) && near(T.need("goji"), 16 / 90 * 100, 1), "はじめは すこし ずらす（ごじが いちばん）: " + IDS.map((id) => T.need(id)));
  ok(T.need("goji") >= T.MIN && T.need("wanko") < T.MIN, "はじめから ごじは いける・わんこは まだ");
  t.at.wanko = Date.now() - 45 * 60000; ok(near(T.need("wanko"), 50), "45ふんで 50（90ぷんで 100）");
  t.at.wanko = Date.now() - 500 * 60000; ok(T.need("wanko") === 100, "100 で とまる");
  t.at.wanko = Date.now() + 60 * 60000; ok(T.need("wanko") === 0, "とけいが もどっても 0 より したに ならない");
  ok(T.set("gachan", 72) && near(T.need("gachan"), 72) && t.add.gachan === 0 && !T.set("papa", 50) && T.need("papa") === 0, "set（テスト・PokaDebug）・3人だけ");
  d.toilet = "こわれた"; ok(T.st().n === 0 && IDS.every((id) => Number.isFinite(T.st().at[id])), "こわれた セーブを なおす");
  d.toilet = { at: { wanko: "x", gachan: 5 }, add: { wanko: 500, goji: -3 }, n: -2 };
  const u = T.st(); ok(Number.isFinite(u.at.wanko) && u.at.gachan === 5 && u.add.wanko === 100 && u.add.goji === 0 && u.add.gachan === 0 && u.n === 0, "へんな かずを なおす " + JSON.stringify(u));
}

// ---- 2. たべもの・のみもの（Care.feed の あと）----
{
  for (const id of ["milk", "juice", "katatea", "cocoa", "ike_cafe_0", "ike_boba_1", "bm_shake_vanilla", "deza_berrymilk", "soup", "pumpkinsoup"]) ok(R.BAG_INDEX[id] && T.drink(id), `のみもの: ${id}`);
  for (const id of ["burger", "cake", "onigiri", "apple", "curry", "karaage", "pancake"]) ok(R.BAG_INDEX[id] && !T.drink(id), `たべもの: ${id}`);
  fresh(); T.set("wanko", 0); T.set("goji", 0);
  S.d.bag.milk = 2; S.d.bag.burger = 1;
  const a = T.need("wanko"); ok(Care.feed("wanko", "milk") && near(T.need("wanko"), a + T.DRINK), "ぎゅうにゅうで +12");
  const b = T.need("goji"); ok(Care.feed("goji", "burger") && near(T.need("goji"), b + T.EAT), "バーガーで +5");
  ok(!Care.feed("goji", "burger") && near(T.need("goji"), b + T.EAT), "たべられなかった ときは ふえない");
  ok(T.ate("wanko", "milk") && !T.ate("papa", "milk") && !T.ate("wanko", "nope"), "ate は 3人の たべもの だけ");
  for (let i = 0; i < 20; i++) T.ate("gachan", "milk");
  ok(T.st().add.gachan === 100 && T.need("gachan") === 100, "たべもので 100 まで");
}

// ---- 3. ドアと へやの 絵 ----
{
  fresh();
  const win = R.FURN_INDEX.window, w0 = S.d.room.items.find((it) => it.id === "window");
  for (const size of Object.values(HomeDesign.sizes)) {
    ok(T.TX - T.W / 2 > w0.x + win.w / 2 + 8 && T.TX + T.W / 2 < size.w - 124 - 8, `まど（はじめの へや）と「おへや」の ドアに かさならない（はば ${size.w}）`);
    const svg = HomeDesign.roomSvg("wp_cream", "fl_wood", size);
    ok((svg.match(/class="wc-door"/g) || []).length === 1, `へやの 絵に トイレの ドア（はば ${size.w}）`);
  }
  ok(T.H < HomeDesign.H - 40 && T.TX - T.W / 2 > 94, "ドアは かべの なか（ふだが かける たかさ）");
  let ds = HomeDoors.list(); const d = ds.find((x) => x.id === "toilet");
  ok(ds.map((x) => x.id).join() === "out,room,toilet" && d.side === "right" && d.u0 === T.TX - T.W / 2 && d.u1 === T.TX + T.W / 2 && d.h === T.H && d.label === "おトイレ", "ドアの いちらんに おトイレ " + JSON.stringify(ds.map((x) => x.id)));
  ok(d.front.x === T.TX && d.front.y > ROOM.WALL && d.front.y < ROOM.WALL + 60, "ドアの まえ");
  S.d.rooms.active = "yard"; ok(HomeGarden.active() && !HomeDoors.list().some((x) => x.id === "toilet"), "おにわには ない");
  S.d.rooms.active = "main";
  const lamp = T.doorSvg(HomeDesign.H);
  ok(!/\sid=/.test(lamp) && /#BFE3D8/.test(lamp) && /stroke="#1F1D1B"/.test(lamp), "ドアの 絵（id なし・パステル・INK の せん）");
  ok(!kanji.test("おトイレ") && T.door({ wc: { who: "goji", inside: true } }).label === "つかってるよ" && T.door({ wc: { who: "goji", inside: false } }).label === "おトイレ", "ふだ: おトイレ／つかってるよ");
}

// ---- 4. おうち（にせの シーン）----
const kid = (id, i) => ({ id, x: 160 + i * 80, y: 430, dir: "down", state: "idle", t: 2, anim: 0, emo: null, hidden: false, jumpT: -1 });
const mk = () => {
  const sc = { mode: null, s: 0.6, actorScale: 0.8, view: { top: 0, bottom: 1000 }, life: { quarrel: false, next: 0, queue: [], bubbles: [], log: [] }, work: { phase: "home" }, parents: [], chars: IDS.map(kid), fxs: [], care: 0,
    fx(kind, c) { this.fxs.push(kind); }, react(c, emo, fx) { c.state = "jump"; c.t = 1.2; c.emo = emo; if (fx) this.fx(fx, c); }, updateCare() { this.care++; },
    toScreen: (x, y, z = 0) => HomeDesign.project(x, y - ROOM.WALL, z) };
  sc.react = SCENES.house.prototype.react.bind(sc); // つつんだ react（トイレの とちゅうは とびはねない）を つかう
  return sc;
};
const run = (sc, sec, step = 0.1) => { for (let t = 0; t < sec - 1e-9; t += step) T.update(sc, step); };
const until = (sc, fn, max = 10, step = 0.05) => { for (let t = 0; t < max; t += step) { if (fn()) return true; T.update(sc, step); } return fn(); };
const said = (sc, kind) => sc.life.log.filter((x) => x.wc === kind);
UI.layers = 0; Game.trans = null; G.W = 390; G.H = 844;
{
  fresh(); IDS.forEach((id) => T.set(id, 0));
  let sc = mk();
  ok(!T.tap(sc) && said(sc, "fine").length === 1 && !sc.wc.who && sc.chars.every((c) => c.state === "idle" && !c.wc), "だれも いきたく ない: いまは だいじょうぶ");
  T.set("gachan", 40); T.set("goji", 55);
  ok(T.tap(sc) && sc.wc.who === "goji" && sc.chars[2].state === "wc" && sc.chars[2].wc.phase === "go" && said(sc, "go").length === 1, "いちばん いきたい 子（ごじ）が いく");
  ok(!T.go(sc, sc.chars[1], "go") && T.tap(sc) && said(sc, "knock").length === 0, "ひとりずつ・あるいて いる あいだの タップは なにも しない");
  const g = sc.chars[2], m0 = S.d.chars.goji.mood; S.d.chars.goji.mood = Math.min(m0, 80);
  const mood = S.d.chars.goji.mood;
  ok(until(sc, () => g.wc && g.wc.phase === "in"), "ドアまで あるいて いく");
  ok(g.hidden && g.wc.phase === "in" && sc.wc.inside && T.need("goji") < 1 && T.st().n === 1 && near(g.x, T.TX, 0.01), "ドアまで あるいて はいる・いきたさ 0・かず +1");
  ok(HomeDoors.list().find((x) => x.id === "toilet").label === "おトイレ", "シーンが ない ときの ふだ");
  ok(T.door(sc).label === "つかってるよ", "はいって いる あいだの ふだ");
  ok(T.tap(sc) && said(sc, "knock").length === 1 && said(sc, "knock")[0].id === "goji", "はいって いる ときの タップ: はいってる ガウ！");
  const hd = T.head(sc); ok(hd && hd.r > 0 && HomeLife.heads(sc).goji && near(HomeLife.heads(sc).goji.x, hd.x, 0.01), "なかから はなす ふきだしは ドアの うえ");
  ok(sc.life.next >= 2, "トイレの あいだは ほかの できごとを まつ");
  run(sc, T.IN + 0.2);
  ok(!g.hidden && !g.wc && g.state === "jump" && !sc.wc.who && said(sc, "in").length === 1 && said(sc, "done").length === 1 && S.d.chars.goji.mood === Math.min(100, mood + T.MOOD) && sc.care >= 1, "でて きて すっきり（ごきげん +6）");
  // つぎは がちゃん（40）
  run(sc, 1.5); ok(T.tap(sc) && sc.wc.who === "gachan", "つぎは がちゃん");
  // とちゅうで やめる: ドアへ（HomeDoors.walk が state を かえる）
  const c = sc.chars[1]; ok(until(sc, () => c.wc && c.wc.phase === "in") && c.hidden, "がちゃんが はいる");
  c.state = "door"; run(sc, 0.1);
  ok(!c.hidden && !c.wc && c.state === "door" && !sc.wc.who, "ほかの うごきに なったら でて くる（state は そのまま）");
  // とちゅうで きがえ（mode）
  T.set("wanko", 60); sc = mk(); T.tap(sc); const w = sc.chars[0]; ok(until(sc, () => w.hidden) && w.wc.phase === "in", "わんこが はいる");
  sc.mode = "dress"; run(sc, 0.1); ok(!w.hidden && !w.wc && w.state === "idle" && !sc.wc.who, "きがえ などの ときは でて くる");
  // かくれんぼ: ほかの ばしょに うごかされて いたら かくれた まま
  sc.mode = null; T.set("wanko", 60); T.tap(sc); ok(until(sc, () => w.hidden) && w.wc.phase === "in", "もういちど はいる");
  w.x = 30; w.y = ROOM.WALL + 62; w.state = "idle"; run(sc, 0.1); ok(w.hidden && !w.wc, "かくれんぼで うごかされた 子は かくれた まま");
  // トイレの とちゅうは react で とびはねない
  sc = mk(); T.set("goji", 50); T.tap(sc); sc.react(sc.chars[2], "happy", "note");
  ok(sc.chars[2].state === "wc" && sc.chars[2].wc.phase === "go", "トイレへ いく とちゅうは とびはねない");
}

// ---- 5. もじもじ・がまんの げんかい・まつ とき ----
{
  fresh(); IDS.forEach((id) => T.set(id, 0));
  let sc = mk(); T.set("wanko", 85);
  ok(IDS.every((id) => T.scene(sc).nag[id] >= 6 && T.scene(sc).nag[id] <= 12), "はじめの もじもじは おうちに はいって 6〜12びょう");
  T.scene(sc).nag.wanko = 6;
  run(sc, 5.9); ok(!said(sc, "nag").length, "はいって 6びょう までは もじもじ しない");
  run(sc, 0.3); const nag = said(sc, "nag");
  ok(nag.length === 1 && nag[0].id === "wanko" && sc.chars[0].state === "moji" && sc.fxs.includes("sweat"), "70 いじょうで もじもじ（あせ・ことば）");
  run(sc, 2); ok(sc.chars[0].state === "idle", "もじもじは すこしで おわる");
  run(sc, 20); ok(said(sc, "nag").length === 1, "つぎの もじもじは 25びょう いじょう あと");
  run(sc, 25); ok(said(sc, "nag").length === 2, "また もじもじ");
  ok(SCENES.house.prototype.baseFace.call({}, sc.chars[0]) === T.face("wanko") && T.face("wanko") === (CHARA_FACE_EXTRA.wanko.fs_doki ? "fs_doki" : "surprise"), "いきたい 子は こまった かお");
  ok(IDS.every((id) => CHARA_FACE_EXTRA[id] && CHARA_FACE_EXTRA[id].fs_doki), "3人とも どきどきの かお が ある");
  // かけあいの とちゅうは もじもじ しない
  sc = mk(); T.set("wanko", 85); T.scene(sc).nag.wanko = 0; sc.life.queue = [{ who: "gachan", text: "まって" }]; run(sc, 3);
  ok(!said(sc, "nag").length, "かけあいの とちゅうは まつ");
  // がまんの げんかい
  sc = mk(); T.set("goji", 100); run(sc, T.HOLD - 0.5); ok(!sc.wc.who, "100 でも 30びょうは がまん");
  run(sc, 1); ok(sc.wc.who === "goji" && said(sc, "hold").length === 1 && said(sc, "hold")[0].kind === "shout", "30びょうで じぶんで いく（がまん できない）");
  // まつ とき
  for (const [what, set] of [["きがえ・もようがえ", (s) => { s.mode = "dress"; }], ["けんか", (s) => { s.life.quarrel = true; }], ["ぱぱ・ままが かえる", (s) => { s.work.phase = "arriving"; }], ["ドアへ あるく", (s) => { s.doorWalk = {}; }], ["かいだん", (s) => { s.climb = {}; }], ["おねがいの おれい", (s) => { s.wishFx = { busy: true, amae: 0 }; }], ["あまえる", (s) => { s.wishFx = { busy: false, amae: 5 }; }], ["まど", () => { UI.layers = 1; }]]) {
    sc = mk(); T.set("goji", 100); T.set("wanko", 90); T.scene(sc).nag.wanko = 0; set(sc); run(sc, T.HOLD + 2);
    ok(!sc.wc.who && !said(sc, "nag").length, `${what}の あいだは もじもじ・がまんの げんかいを まつ`);
    UI.layers = 0;
  }
  sc = mk(); T.set("goji", 100); sc.work.phase = "away"; run(sc, T.HOLD + 0.5); ok(sc.wc.who === "goji", "ぱぱ・ままが おしごとの あいだも いく");
  // ぱぱ・ままが おせわに くる 子・あそんで いる 子は じぶんから いかない
  sc = mk(); T.set("goji", 100); sc.parents = [{ id: "mama", target: "goji" }]; run(sc, T.HOLD + 1); ok(!sc.wc.who, "ぱぱ・ままが むかって いる 子は いかない");
  sc = mk(); T.set("goji", 100); sc.chars[2].activity = { id: "dance" }; run(sc, T.HOLD + 1); ok(!sc.wc.who, "しぐさの とちゅうの 子は いかない");
  ok(T.canGo(sc, Object.assign(kid("wanko", 0), { state: "amae" })) && !T.canGo(sc, Object.assign(kid("wanko", 0), { state: "eat" })) && !T.canGo(sc, Object.assign(kid("wanko", 0), { state: "sleep" })) && !T.canGo(sc, Object.assign(kid("wanko", 0), { hidden: true })), "タップで いける 子（たべる・ねる・かくれて いる 子は いけない）");
}

// ---- 6. ぱぱ・ままの おせわは トイレの 子を あとまわし ----
{
  fresh(); const sc = mk(); T.set("goji", 50); T.tap(sc);
  sc.parents = [{ id: "papa", x: 90, y: 350, queue: ["goji", "wanko"], target: null, state: "idle" }];
  ParentCare.next(sc, sc.parents[0]);
  ok(sc.parents[0].target === "wanko" && sc.parents[0].queue.join() === "goji" && sc.chars[2].state === "wc", "トイレの 子の まえに ほかの 子");
  const p = { id: "mama", x: 375, y: 345, queue: ["goji"], target: null, state: "walk" }; sc.parents.push(p);
  ParentCare.next(sc, p); ok(!p.target && p.state === "idle" && !p.queue.length && sc.chars[2].state === "wc", "トイレの 子 だけなら こんかいは やめる");
}

// ---- 7. ことば・とうろく・PokaDebug ----
{
  for (const [k, v] of Object.entries(T.LINES)) for (const id of IDS) for (const t of [].concat(v[id])) ok(typeof t === "string" && t.length >= 2 && !kanji.test(t) && [...t].length <= 26, `${k}.${id}: ひらがなで 26もじ まで「${t}」`);
  const idx = read("index.html"), sw = read("sw.js"), at = (f) => idx.indexOf(`js/${f}`);
  ok(at("home-toilet.js") > 0 && ["scene-house.js", "home-life.js", "home-doors.js", "home-floors.js", "home-design.js", "parent-care.js", "save.js", "sound.js", "fashion-art.js", "gowaga-wish.js"].every((f) => at(f) > 0 && at(f) < at("home-toilet.js")) && at("home-toilet.js") < at("world-zoom.js") && at("world-zoom.js") < at("debug.js"), "index.html: くみこむ ものの あと・world-zoom.js の まえ");
  ok(sw.includes('"./js/home-toilet.js"') && sw.indexOf('"./js/home-toilet.js"') < sw.indexOf('"./js/world-zoom.js"'), "sw.js の FILES");
  const hd = read("js/home-design.js"); ok(/typeof HomeToilet!=="undefined"\)s\+=HomeToilet\.doorSvg\(H\)/.test(hd), "へやの 絵から doorSvg を よぶ（HomeToilet が ない ときは よばない）");
  fresh(); T.set("goji", 80);
  const pt = PokaDebug.toilet();
  ok(pt && near(pt.need.goji, 80) && pt.n === 0 && pt.who === null && Array.isArray(pt.kids), "PokaDebug.toilet " + JSON.stringify(pt));
  ok(near(PokaDebug.toiletNeed("wanko", 33), 33) && PokaDebug.toiletNeed("papa", 10) === 0, "PokaDebug.toiletNeed");
}

console.log(`✓ home toilet: ${n} checks（いきたさ・ドア・はいる／でる・もじもじ・がまん・まつ とき・ぱぱ まま）`);
