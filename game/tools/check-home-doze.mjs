// おひるね（js/home-doze.js・UI-99。オーナーの 依頼 2026-10-06「おうちで、たまに3人寝ていて(2分くらい)、寝言を言っている行動を追加して」）の 検査。
// ブラウザ なしで: とうろく・ことば（ひらがな・かず）・じかん（2ふん・つぎまで）・ねむく なれる とき・あつまる ばしょ（ベッド・ラグ・まんなか）・
// ねむく なる → あつまる → 3人とも ねる・ぱぱ ままは よけて「しーっ」・ねごと（かず・くもの ふきだし）・ほかの できごとを まつ・
// タップ（おきない・3かいで おきる）・おきる（2ふん・ボタン・ほかの うごき）・ごはんで はやめに・ねがおの え・おじゃまでは ねない・セーブしない。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomeDoze: D, HomeLife, HomeActions, ParentCare, GowagaWish, HomeToilet, PlayRecords, Care, HouseScene, HOUSE_SCENE_BASE, SCENES, FURN_INDEX, ROOM, Save: S, UI, Game, G, PokaDebug, U } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const IDS = ["wanko", "gachan", "goji"];
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("home-doze.js") > at("play-records.js") && at("play-records.js") > at("home-toilet.js") && at("home-toilet.js") > at("gowaga-wish.js") && at("home-doze.js") < at("online-config.js") && at("home-doze.js") < at("debug.js"), "index.html: gowaga-wish → home-toilet → play-records → home-doze → online → debug の じゅん");
  ok(sw.includes('"./js/home-doze.js"'), "sw.js の FILES に home-doze.js");
  ok(typeof PokaDebug.homeDoze === "function" && typeof PokaDebug.homeDozeStart === "function", "PokaDebug.homeDoze・homeDozeStart");
  const f = S.fresh();
  ok(!("doze" in f) && !JSON.stringify(f).includes("doze") && S.SCHEMA === 2, "セーブしない（Save.fresh() に ない・SCHEMA は 2）");
}

// ---- 2. ことば・じかん ----
{
  const L = D.LINES, lines = [];
  for (const k of ["start", "full", "agree", "wake", "woken"]) { ok(IDS.every((id) => typeof L[k][id] === "string" && L[k][id].length > 0), `ことば ${k}: 3人`); lines.push(...IDS.map((id) => L[k][id])); }
  for (const id of IDS) {
    ok(L.talk[id].length >= 9 && new Set(L.talk[id]).size === L.talk[id].length, `${id}: ねごと 9つ いじょう（かさならない）`);
    ok(L.poke[id].length >= 3, `${id}: タップの ねごと 3つ`);
    lines.push(...L.talk[id], ...L.poke[id]);
  }
  ok(L.pair.length >= 6 && L.pair.every((p) => p.length === 2 && IDS.includes(p[0][0]) && IDS.includes(p[1][0]) && p[0][0] !== p[1][0]), "ふたりの ねごと 6つ（ちがう 2人）");
  lines.push(...L.pair.flatMap((p) => p.map((t) => t[1])), L.parent.papa, L.parent.mama);
  ok(lines.every((t) => !kanji.test(t) && t.length <= 24 && !/[A-Za-z]/.test(t)), "ことばは ひらがな・カタカナ（漢字 なし・24もじ まで）: " + lines.filter((t) => kanji.test(t) || t.length > 24));
  ok(L.talk.goji.every((t) => /ガゥ|グゥ|ぐぅ|むにゃ|すぴ/.test(t)) || L.talk.goji.filter((t) => /ガゥ/.test(t)).length >= 4, "ごじは ガゥ");
  ok(L.talk.gachan.filter((t) => /ぴよ/.test(t)).length >= 3, "がちゃんは ぴよ");
  ok(D.LEN === 120, "ねる じかんは 120びょう（2ふん くらい）");
  ok(D.FIRST[0] >= 120 && D.FIRST[1] <= 360 && D.AGAIN[0] > D.FIRST[1] && D.AGAIN[1] <= 900 && D.FULL[1] < D.FIRST[0], "つぎまで: さいしょ 2〜6ふん・そのあと もっと あと・ごはんの あとは はやめ");
  ok(D.TALK[0] >= 6 && D.TALK[1] <= 20 && D.POKES === 3 && D.GATHER <= 15, "ねごとの あいだ・タップ 3かい・あつまる げんかい");
  // ゆうがた・よるは「おひるね」ではなく「うたたね」（ひるは そのまま）
  const hourNow = U.hourNow;
  for (const h of [8, 14]) { U.hourNow = () => h; ok(D.nap(L.start.gachan) === L.start.gachan && D.nap(L.parent.mama) === L.parent.mama && L.parent.mama.includes("おひるね"), `${h}じは「おひるね」`); }
  for (const h of [17, 20, 2]) {
    U.hourNow = () => h;
    const t = [D.nap(L.start.gachan), D.nap(L.parent.mama)];
    ok(t.every((x) => x.includes("うたたね") && !x.includes("おひるね") && !kanji.test(x) && x.length <= 24), `${h}じは「うたたね」 ` + t);
  }
  U.hourNow = hourNow;
}

// ---- 3. うごき（にせの へや）----
const fresh = () => { S.d = S.fresh(); S.d.parents.auto = true; return S.d; };
const mk = (o = {}) => {
  const sc = Object.create(HouseScene.prototype);
  Object.assign(sc, { mode: null, s: 0.6, actorScale: 0.8, view: { top: 0, bottom: 1000 }, life: HomeLife.blank(), work: { away: false, phase: "home", t: 0, next: 1e9, queue: [], turn: 0, fade: 1, clock: U.hourNow, labeled: true }, fxs: [], care: 0, doze: null,
    parents: [{ id: "papa", x: 160, y: ROOM.WALL + 120 }, { id: "mama", x: 380, y: ROOM.WALL + 250 }].map((p) => ({ ...p, tx: p.x, ty: p.y, anim: 0, state: "idle", time: 0, target: null, queue: [] })),
    chars: IDS.map((id, i) => ({ id, x: 150 + i * 90, y: ROOM.WALL + 200, tx: 0, ty: 0, dir: "down", state: "idle", t: 3, anim: 0, emo: null, hidden: false, jumpT: -1 })),
    parentTimer: 8, parentTurn: 0, careTurn: 0, parentSpeechTurn: 0, ...o });
  sc.fx = function (kind) { this.fxs.push(kind); };
  sc.updateCare = function () { this.care++; };
  HomeActions.init(sc);
  return sc;
};
const said = (sc, kind) => sc.life.log.filter((l) => l.doze === kind);
const run = (sc, sec, step = 0.25, f) => { for (let t = 0; t < sec - 1e-9; t += step) { HomeLife.advance(sc, step); HomeActions.update(sc, step); D.update(sc, step); if (f) f(); } };
const arrive = (sc) => { for (const c of sc.chars) if (c.state === "walk") { c.x = c.tx; c.y = c.ty; c.state = "idle"; c.t = 3; } };
const sleep = (sc) => { ok(D.start(sc), "ねむく なる"); arrive(sc); D.update(sc, 0.05); ok(D.asleep(sc) && sc.chars.every((c) => D.dozing(c)), "3人とも ねる"); };
UI.layers = 0; Game.trans = null; G.W = 390; G.H = 844; G.t = 0;
{
  // ねむく なれる とき
  fresh();
  let sc = mk();
  ok(D.can(sc), "しずかな へやで ねむく なれる");
  for (const [k, set, undo] of [
    ["mode", (s) => (s.mode = "food"), (s) => (s.mode = null)],
    ["けんか", (s) => (s.life.quarrel = true), (s) => (s.life.quarrel = false)],
    ["かけあいの とちゅう", (s) => s.life.queue.push({ who: "wanko", text: "x" }), (s) => (s.life.queue.length = 0)],
    ["おトイレ", (s) => (s.wc = { who: "goji" }), (s) => (s.wc = null)],
    ["おねがい", (s) => (s.wishFx = { busy: true, amae: 0 }), (s) => (s.wishFx = null)],
    ["ドアへ", (s) => (s.doorWalk = {}), (s) => (s.doorWalk = null)],
    ["かいだん", (s) => (s.climb = {}), (s) => (s.climb = null)],
    ["ぱぱ ままの でかける", (s) => (s.work.phase = "leave"), (s) => (s.work.phase = "home")],
    ["かくれた 子", (s) => (s.chars[1].hidden = true), (s) => (s.chars[1].hidden = false)],
    ["たべて いる 子", (s) => (s.chars[2].state = "eat"), (s) => (s.chars[2].state = "idle")],
    ["おじゃま", (s) => (s.guest = { room: S.d.room }), (s) => delete s.guest],
  ]) { set(sc); ok(!D.can(sc), `ねむく ならない: ${k}`); undo(sc); }
  ok(D.can(sc), "もとに もどすと ねむく なれる");
  const st = D.st(sc);
  ok(st.next >= D.FIRST[0] && st.next <= D.FIRST[1] && st.phase === null, "さいしょは 2ふん半〜5ふん あと " + st.next);
  // じかんが たつと ねむく なる（しずかな じかん だけ）
  st.next = 1; sc.mode = "food"; run(sc, 2); ok(!D.on(sc) && st.next === 1, "mode の あいだは かぞえない");
  sc.mode = null; run(sc, 1.5);
  ok(st.phase === "gather" && said(sc, "start").length === 1 && sc.chars.every((c) => c.state === "walk"), "じかんに なると ねむく なる・あつまる");
  // あつまる ばしょ（ベッドの まえ）と ぱぱ ままが よける
  const bed = S.d.room.items.find((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].sleep);
  ok(bed && st.spot.by === "bed" && st.spot.id === bed.id, "ベッドの まえに あつまる " + JSON.stringify(st.spot));
  const xs = sc.chars.map((c) => c.tx), ds = sc.chars.map((c) => c.tx + c.ty);
  ok(Math.max(...xs) - Math.min(...xs) === 2 * D.GAP && Math.max(...ds) - Math.min(...ds) <= 1 && sc.chars.every((c) => Math.hypot(c.tx - st.spot.x, c.ty - st.spot.y) <= Math.SQRT2 * D.GAP + 1), "3人は 画面で よこ 一列に ならんで ねる（x + y が おなじ）" + JSON.stringify(sc.chars.map((c) => [c.tx, c.ty])));
  const near = sc.parents.filter((p) => p.state === "walk");
  ok(near.every((p) => Math.hypot(p.tx - st.spot.x, p.ty - st.spot.y) >= 100), "ちかくの ぱぱ ままは よける " + JSON.stringify(sc.parents.map((p) => [p.id, p.state, p.tx, p.ty])));
  arrive(sc); run(sc, 0.25);
  ok(D.asleep(sc) && sc.chars.every((c) => D.dozing(c) && c.state === "activity" && c.dir === "down"), "ついたら 3人とも すわって ねる");
  ok(said(sc, "hush").length === 1 && ["papa", "mama"].includes(said(sc, "hush")[0].id) && said(sc, "hush")[0].kind === "whisper", "ぱぱ ままの「しーっ」（ひそひそ）");
  // ねて いる あいだ: ほかの できごとを まつ・ふだんの ひとことは ださない
  sc.life.next = 0; sc.actions.next = 0; run(sc, 0.25);
  ok(sc.life.next >= 3.5 && sc.actions.next >= 2.5, "けんか・かけあい・しぐさの タイマーを まつ");
  const log0 = sc.life.log.length;
  HomeLife.say(sc, "wanko", "わあ！ うごいた♪");
  ok(sc.life.log.length === log0, "ねて いる 子の ふだんの ひとことは ださない");
  HomeLife.say(sc, "mama", "おやすみ");
  ok(sc.life.log.length === log0 + 1, "ぱぱ ままは はなせる");
  sc.parents.forEach((p) => { p.state = "idle"; p.target = null; p.queue = []; });
  sc.parentTimer = 0; ParentCare.update(sc, 0.25);
  ok(sc.parents.every((p) => !p.target && !p.queue.length) && sc.parentTimer > 0, "ぱぱ ままの おせわは おやすみ");
  ok(!HomeToilet.calm(sc), "おトイレの もじもじは おやすみ");
  delete sc.wishFx; GowagaWish.house(sc, 1);
  ok(!sc.wishFx, "おねがいは おやすみ");
  // ねがおの え
  const v = HomeActions.visual(sc.chars[0]);
  ok(v && v.face === "sleep" && v.pose === "land_01" && v.sy < 0.9 && v.dir === "down", "ねがお（すわって うとうと）" + JSON.stringify(v));
  ok(HomeActions.visual({ id: "wanko" }) === null, "ねて いない 子は いつもどおり");
  // ねごと → 2ふんで おきる
  const pats0 = PlayRecords.state().kids.gachan.pat;
  ok(D.poke(sc, sc.chars[1]) && D.asleep(sc) && said(sc, "poke").length === 1 && said(sc, "poke")[0].kind === "think" && PlayRecords.state().kids.gachan.pat === pats0 + 1, "タップ: おきない・ねごと・なでなでの きろく");
  let talks = 0, pool = new Set(Object.values(D.LINES.talk).flat().concat(D.LINES.pair.flatMap((p) => p.map((t) => t[1]))));
  run(sc, D.LEN - 1);
  talks = said(sc, "talk");
  ok(D.asleep(sc) && st.talks >= 7 && st.talks <= 14 && talks.every((l) => l.kind === "think" && pool.has(l.text) && IDS.includes(l.id)), `2ふん の あいだに ねごと ${st.talks}かい（くもの ふきだし）`);
  ok(new Set(talks.map((l) => l.id)).size === 3, "3人とも ねごとを いう");
  run(sc, 1.5);
  ok(!D.on(sc) && st.last === "time" && st.wakes === 1 && sc.chars.every((c) => !D.dozing(c)) && st.next >= D.AGAIN[0] && st.next <= D.AGAIN[1], "2ふんで おきる・つぎは しばらく あと");
  ok(sc.chars.every((c) => c.activity && c.activity.id === "stretch"), "おきたら のびーっ");
  run(sc, 5);
  ok(IDS.every((id) => said(sc, "wake").some((l) => l.id === id)), "3人とも「よく ねた」");
  sc.work.phase = "home"; // ParentCare.update で ほんとうの じこくの「でかける」が はじまる ことが ある（9〜18じ）
  ok(HomeToilet.calm(sc), "おきたら おトイレの もじもじも もとどおり");
}
{
  // ボタン・ほかの うごき・3かい タップ・あつまる げんかい
  fresh();
  let sc = mk(); sleep(sc);
  D.wake(sc, "button");
  ok(!D.on(sc) && D.st(sc).last === "button" && said(sc, "woken").length === 1 && sc.chars.every((c) => !D.dozing(c) && c.state === "idle"), "したの ボタン:「ん… おはよう…」と おきる");
  sc = mk(); sleep(sc);
  sc.mode = "edit"; run(sc, 0.25);
  ok(!D.on(sc) && D.st(sc).last === "stir" && said(sc, "woken").length === 0, "もようがえ（mode）が はじまったら そのまま おきる（ことば なし）");
  sc = mk(); sleep(sc);
  HomeActions.cancel(sc.chars[2]); sc.chars[2].state = "walk"; run(sc, 0.25);
  ok(!D.on(sc) && D.st(sc).last === "stir" && sc.chars.every((c) => !D.dozing(c)), "ひとり うごいたら みんな おきる（3人は いっしょ）");
  sc = mk(); sleep(sc);
  for (let i = 0; i < 2; i++) D.poke(sc, sc.chars[0]);
  ok(D.asleep(sc) && D.st(sc).pokes === 2, "2かい タップでは おきない");
  D.poke(sc, sc.chars[2]);
  ok(!D.on(sc) && D.st(sc).last === "poke" && said(sc, "woken").length === 1, "3かい タップで おきる");
  sc = mk(); ok(D.start(sc), "ねむく なる");
  run(sc, D.GATHER + 0.5);
  ok(D.asleep(sc) && sc.chars.every((c) => D.dozing(c)), "あつまれ なくても その ばで ねる（あつまる げんかい）");
  ok(!D.start(sc), "ねて いる ときは もう いちど ねむく ならない");
}
{
  // ごはんで おなか いっぱい → はやめに
  fresh();
  const sc = mk(), st = D.st(sc);
  st.next = 280;
  for (const id of IDS) S.d.chars[id].hunger = 70;
  ok(!D.ate(sc) && st.next === 280, "おなか いっぱいで ない ときは かわらない");
  for (const id of IDS) S.d.chars[id].hunger = 90;
  ok(D.ate(sc) && st.next >= D.FULL[0] && st.next <= D.FULL[1] && st.full, "3人とも おなか いっぱい → はやめに ねむく なる");
  ok(D.start(sc) && said(sc, "start")[0].text === D.LINES.full[said(sc, "start")[0].id] && !st.full, "「おなか いっぱいで… ねむく なっちゃった…」");
  // Care.feed から（おうちに いる とき）
  const sc2 = mk(); G.sceneName = "house"; G.scene = sc2; D.st(sc2).next = 300;
  for (const id of IDS) S.d.chars[id].hunger = 84;
  S.d.bag.onigiri = 3;
  Care.feed("wanko", "onigiri"); Care.feed("gachan", "onigiri"); Care.feed("goji", "onigiri");
  ok(D.st(sc2).next <= D.FULL[1], "おうちで ごはん → はやめに " + D.st(sc2).next);
  G.sceneName = "title"; G.scene = null;
}
{
  // ねる ならびが 家具に かくれない（へやは ななめ上から 見る ので 描く じゅんは x + y。家具は anchor の じゅん）
  fresh();
  const sc = mk(), bed = S.d.room.items.find((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].sleep), a = sc.anchor(bed);
  const s = D.spot(sc), row = D.row(s);
  ok(s.by === "bed" && s.bad === 0 && D.cover(sc, row) === 0 && row.every((p) => p.y > a.y && p.x + p.y === row[0].x + row[0].y) && row[2].x - row[0].x === 2 * D.GAP, "はじめの へや: ベッドの まえに よこ 一列・かおが かくれない " + JSON.stringify([s, row]));
  ok(D.cover(sc, [{ x: 40, y: a.y + 16 }]) === 1, "ベッドの まえの はしっこ（x + y が ベッドより 小さい）は ベッドに かくれる と わかる");
  ok(D.cover(sc, [{ x: a.x, y: a.y - 20 }]) >= 100 && D.cover(sc, [{ x: 10, y: ROOM.WALL + 200 }]) >= 100, "家具の なか・へやの そとは だめ");
  // 家具の ばしょを かえた へや 60: いつも かくれない ならびが みつかる・3人は 家具の なかに いない
  let seed = 7, fails = [];
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 60; k++) {
    fresh();
    if (k % 3 === 2) S.d.rooms.expanded = { [S.d.rooms.active]: true };
    for (const it of S.d.room.items) { const f = FURN_INDEX[it.id]; if (f && f.kind !== "wall") { it.x = 60 + rnd() * (ROOM.W - 120); it.y = ROOM.WALL + 90 + rnd() * (ROOM.H - ROOM.WALL - 120); } }
    const sc2 = mk(); if (R.HomeNav && R.HomeNav.reset) R.HomeNav.reset();
    const s2 = D.spot(sc2), row2 = D.row(s2);
    if (s2.bad !== 0 || row2.some((p) => R.HomeNav.blockedAt(sc2, p.x, p.y))) fails.push([k, s2, row2]);
  }
  ok(fails.length === 0, "家具の ばしょを かえた へや 60: かくれない ならび " + JSON.stringify(fails.slice(0, 3)));
}
{
  // あつまる ばしょ: ラグ・へやの まんなか
  fresh();
  const sc = mk();
  S.d.room.items = S.d.room.items.filter((it) => !(FURN_INDEX[it.id] && FURN_INDEX[it.id].sleep));
  const rug = Object.keys(FURN_INDEX).find((id) => FURN_INDEX[id].kind === "rug");
  S.d.room.items.push({ uid: 99, id: rug, x: 300, y: ROOM.WALL + 220, flip: false });
  ok(D.spot(sc).by === "rug", "ベッドが なければ ラグ");
  S.d.room.items = S.d.room.items.filter((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].kind !== "rug");
  const s = D.spot(sc);
  ok(s.by === "room" && Math.abs(s.x - ROOM.W / 2) < 1, "どちらも なければ へやの まんなか");
}
// ---- 4. おじゃまでは ねない（つつむ まえの おうちの うごき）----
{
  const H = SCENES.house.prototype, V = SCENES.visit && SCENES.visit.prototype;
  for (const k of ["enter", "update", "up", "buildUI"]) ok(H[k] !== HOUSE_SCENE_BASE[k], `HouseScene.${k} を つつむ`);
  ok(V && V.update !== H.update && !Object.prototype.hasOwnProperty.call(V, "doze"), "おじゃま（VisitScene）は おひるねの update を つかわない");
  ok(read("js/online-visit.js").includes("HOUSE_SCENE_BASE") && !read("js/home-doze.js").includes("VisitScene.prototype"), "おじゃまには さわらない");
}
console.log(`✓ おひるね（UI-99）: ${n} 項目`);
