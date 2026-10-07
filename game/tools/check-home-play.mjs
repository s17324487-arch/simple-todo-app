// おうちで あそぶ・よむ・しゅくだい（js/home-play.js・js/home-play-data.js・UI-106。オーナーの 依頼 2026-10-07「3人で遊んだり、本を読んだり、宿題をしたりさせてくれ。
// …誰かが遊び道具(トランプや縄跳び、ゲーム機など)や本、国語や数学のドリル、のアイテムを持っている必要があるようにしろ。…種類によっても行動・会話パターンを変えよう」）の 検査。
// ブラウザ なしで: とうろく・30しゅ（あそびどうぐ・ほん・ドリル ごとの ならび・うごき・会話）・ことば（ながさ・ひらがな・だれが いっても おかしく ない）・ならびの かたち・
// だれ（H・A・B・P・W・L・ALL・not:）・なわとびの なわ・ドリルの ページ・ほんの ひょうし・「あそぶ」の まど（かくれんぼ・ボールあそびの ばんごうは そのまま）・
// もって いない ときは できない・はじめられない とき・じぶんたちで はじめる → あつまる → すわる → うごき → ぱぱ ままの ひとこと → おわり（ごきげん）・
// あそんで いる あいだの つつみかた（ほかの できごと・おトイレ・おひるね・おねがい・ぱぱ ままの おせわ）・てに もつ ものを かくす・やめる（ボタン・ほかの うごき・きがえ）・セーブしない・
// おうちに ある もの（だれも もって いない のこり。オーナーの 追加 2026-10-07「何も指示しなくても自律的にごわがが行う」）: とりだす 子・もちものは かえない・
// じぶんたちで えらぶ おもみ（じかん・てんき・もって いる・すき・まえと おなじ）・こころの こえ・「あそぶ」の しゅるい。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomePlay: HP, HOME_PLAY_DATA: D, PlayGoods: PG, HouseScene, HomeActions, HomeLife, ParentCare, HomeDoze, HomeToilet, GowagaWish, WearStock, HandItems, Save: S, UI, Game, G, PokaDebug, ROOM, U } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const IDS = ["wanko", "gachan", "goji"], NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
const kanji = /[一-鿿]/, width = (t) => [...t].reduce((a, ch) => a + (ch.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const KIND = new Set(["say", "shout", "whisper", "think", "cry", "rare"]), FORMS = new Set(["circle", "row", "show"]), GENERIC = new Set(["H", "A", "B", "P", "W", "L"]);
const isWho = (w) => GENERIC.has(w) || w === "ALL" || IDS.includes(w) || (typeof w === "string" && w.startsWith("not:") && IDS.includes(w.slice(4)));
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. とうろく ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(at("home-play-data.js") > at("home-doze.js") && at("home-play.js") === at("home-play-data.js") + `<script src="js/home-play-data.js"></script>`.length + 1 && at("home-play-data.js") > at("play-goods.js") && at("home-play.js") < at("debug.js"), "index.html: play-goods → home-doze → home-play-data → home-play → debug の じゅん");
  ok(sw.includes('"./js/home-play-data.js"') && sw.includes('"./js/home-play.js"'), "sw.js の FILES に home-play-data.js・home-play.js");
  ok(["homePlay", "homePlayStart", "homePlayNext", "homePlayHouse", "playStock"].every((k) => typeof PokaDebug[k] === "function"), "PokaDebug.homePlay・homePlayStart・homePlayNext・homePlayHouse・playStock");
  const f = S.fresh();
  ok(!("play" in f) && !/home-?play/i.test(JSON.stringify(f)) && S.SCHEMA === 2, "セーブしない（Save.fresh() に ない・SCHEMA は 2）");
}
// ---- 2. 30しゅ（PlayGoods の あそびかた ごとに 1つ）----
const kinds = Object.keys(D).filter((k) => D[k] && D[k].form);
ok(kinds.length === 30 && PG.ITEMS.every((it) => D[it.play] && D[it.play].form) && new Set(PG.ITEMS.map((it) => it.play)).size === 30, "あそびかた 30しゅ（あそびどうぐ・ほん・ドリル 10ずつ）");
ok(kinds.every((k) => PG.ITEMS.some((it) => it.play === k)), "つかわない あそびかたが ない");
ok(["reply", "stop"].every((k) => IDS.every((id) => typeof D[k][id] === "string" && D[k][id])) && IDS.every((id) => Array.isArray(D.cheer[id]) && D.cheer[id].length >= 3), "ぱぱ ままへの へんじ・なでた ときの ひとこと（3つずつ）・やめる ことば");
const lines = [], line = (where, t, who) => { for (const [id, x] of typeof t === "string" ? [[who, t]] : Object.entries(t)) lines.push({ where, who: id, text: x, raw: typeof t === "string" }); };
IDS.forEach((id) => { line("reply", D.reply[id], id); line("stop", D.stop[id], id); D.cheer[id].forEach((t) => line("cheer", t, id)); });
ok(Object.keys(PG.CATS).every((cat) => IDS.every((id) => typeof D.think[cat][id] === "string" && D.think[cat][id])) && new Set(Object.values(D.think).flatMap((t) => Object.values(t))).size === 9, "じぶんたちで はじめる まえの こころの こえ（しゅるい 3 × 3人・ぜんぶ ちがう）");
for (const cat of Object.keys(PG.CATS)) IDS.forEach((id) => line("think." + cat, D.think[cat][id], id));
ok(Object.keys(HP.CAT_ASK).join() === Object.keys(PG.CATS).join() && Object.values(HP.CAT_ASK).every((t) => t && !kanji.test(t) && width(t) <= 12), "「あそぶ」の おうちに ある ものの しゅるい 3つ（あそびどうぐ・ほん・ドリル）");
ok(IDS.every((id) => PG.CATS[HP.LIKE[id].cat] && HP.LIKE[id].kinds.every((k) => kinds.includes(k))) && new Set(IDS.map((id) => HP.LIKE[id].cat)).size === 3, "3人の すきな もの（しゅるいは 3人 ちがう・あそびかたは ある もの）");
const evs = new Set();
for (const it of PG.ITEMS) {
  const K = D[it.play], k = it.play, cat = it.playCat;
  ok(FORMS.has(K.form), `${k}: ならび ${K.form}`);
  ok(Number.isFinite(K.len) && K.len >= 26 && K.len <= 50, `${k}: ながさ ${K.len}びょう`);
  ok(!!K.book === (cat === "book") && !!K.drill === (cat === "drill"), `${k}: ほん・ドリルの しるし`);
  ok((cat !== "book" && cat !== "drill") || K.form === "row", `${k}: ほん・ドリルは よこに ならんで いっしょに みる`);
  ok(IDS.every((id) => typeof K.start[id] === "string" && K.start[id] && typeof K.agree[id] === "string" && K.agree[id]), `${k}: さそう・こたえる ことば（3人）`);
  IDS.forEach((id) => { line(k + ".start", K.start[id], id); line(k + ".agree", K.agree[id], id); });
  ok(Array.isArray(K.beats) && K.beats.length === 5 && K.beats.filter((b) => b.ev).length >= 2, `${k}: うごきの かたまり 5つ（うごき 2つ いじょう）`);
  K.beats.forEach((b, i) => {
    ok(Array.isArray(b.t) && b.t.length >= 2 && b.t.length <= 3, `${k}.beat${i}: かけあい 2〜3`);
    if (b.ev) { ok(HP.EVENTS.includes(b.ev), `${k}.beat${i}: うごき ${b.ev}`); evs.add(b.ev); }
    for (const [w, t, kind] of b.t) { ok(isWho(w) && (kind === undefined || KIND.has(kind)), `${k}.beat${i}: だれ ${w}・ふきだし ${kind}`); line(`${k}.beat${i}.${w}`, t, w); }
  });
  ok(Array.isArray(K.end) && HP.turns({ order: IDS, P: 0, kind: k }, K.end, "end").length >= 2, `${k}: おわりの かけあい（ALL は 3人）`);
  for (const [w, t, kind] of K.end) { ok(isWho(w) && (kind === undefined || KIND.has(kind)), `${k}.end: ${w}`); line(`${k}.end.${w}`, t, w); }
  ok(["papa", "mama"].every((p) => Array.isArray(K.parent[p]) && K.parent[p].length >= 2), `${k}: ぱぱ・ままの ひとこと 2つずつ`);
  for (const p of ["papa", "mama"]) K.parent[p].forEach((t) => line(`${k}.parent.${p}`, t, p));
  if (["cards", "sugoroku", "reversi"].includes(k)) ok(K.end.some(([w]) => w === "W"), `${k}: かった 子（W）が おわりに いう`);
  if (cat === "drill") ok(K.beats.some((b) => b.ev === "write") && K.end.some(([w]) => w === "H"), `${k}: ドリルを かく（write）`);
  if (cat === "book") ok(K.beats.some((b) => ["page", "trace", "goal"].includes(b.ev)), `${k}: ページを めくる`);
}
ok(evs.size === HP.EVENTS.length, `うごきの しゅるい ${evs.size}（ぜんぶ つかう）`);
// しゅるいで うごきと 会話が かわる（オーナーの「種類によっても行動・会話パターンを変えよう」）
const sig = (k) => D[k].beats.map((b) => (b.ev || "") + ":" + b.t.map((x) => (typeof x[1] === "string" ? x[1] : Object.values(x[1]).join("/"))).join("|")).join("#");
ok(new Set(kinds.map(sig)).size === 30 && new Set(kinds.map((k) => IDS.map((id) => D[k].start[id]).join())).size === 30, "30しゅ ぜんぶ ちがう 会話");
ok(new Set(lines.map((l) => l.text)).size >= 600, `ちがう ことば ${new Set(lines.map((l) => l.text)).size}`);
ok(kinds.filter((k) => D[k].form === "show").length >= 4 && kinds.filter((k) => D[k].form === "circle").length >= 3 && kinds.filter((k) => D[k].form === "row").length >= 20, "ならびは 3しゅ（まるく すわる・よこに ならぶ・して みせる）");
// ---- 3. ことば ----
for (const L of lines) {
  ok(typeof L.text === "string" && L.text.length > 0 && L.text.trim() === L.text && !/ {2}/.test(L.text), `${L.where}: から・スペース「${L.text}」`);
  ok(width(L.text) <= 26, `${L.where}: ながすぎる（${width(L.text)}）「${L.text}」`);
  ok(!kanji.test(L.text), `${L.where}: かんじ「${L.text}」`);
  // だれが いっても おかしく ない（H・A・B などは 3人の だれにも なる）: なまえ・「ぼく」「わたし」・ごじの「ガゥ」を つかわない
  const w = L.where.split(".").pop(), not = w.startsWith("not:") ? w.slice(4) : null;
  if (L.raw && (GENERIC.has(w) || not)) {
    const can = not ? IDS.filter((id) => id !== not) : IDS;
    ok(!can.some((id) => new RegExp(NAME[id] + "(?![ゃゅょぁぃぅぇぉっ])").test(L.text)), `${L.where}: じぶんの なまえを いう かも「${L.text}」`);
    ok(!/ぼく|わたし/.test(L.text), `${L.where}: 「ぼく」「わたし」は だれが いうか きまらない「${L.text}」`);
    ok(!(can.includes("wanko") || can.includes("gachan")) || !/ガ[ゥォ]/.test(L.text), `${L.where}: 「ガゥ」は ごじ だけ「${L.text}」`);
  }
  // 3人の くせ（home-lines.mjs と おなじ）: わんこ・ごじは「ぼく」・がちゃんは じぶんを「がちゃん」と よぶ・「わたし」は つかわない・「ガゥ」は ごじ だけ
  if (IDS.includes(L.who)) ok(!/わたし/.test(L.text) && (L.who === "goji" || !/ガ[ゥォ]/.test(L.text)) && (L.who !== "gachan" || !/ぼく/.test(L.text)), `${L.where}: ${L.who} の くせ「${L.text}」`);
  if (L.who === "wanko" || L.who === "goji") ok(!new RegExp(NAME[L.who] + "(は|が|も|の|、)").test(L.text), `${L.where}: じぶんの なまえ「${L.text}」`);
}
ok(lines.length >= 30 * 22, `ことばの かず ${lines.length}`);
// ---- 4. ならびの かたち（へやの ざひょう。よこ u = x − y・おく v = x + y）----
const C = { x: 220, y: 420 };
for (const f of FORMS) {
  const P = HP.layout(f, C), uv = P.map((p) => ({ u: p.x - p.y - (C.x - C.y), v: p.x + p.y - (C.x + C.y) }));
  ok(P.length === 3 && P.every((p) => Number.isInteger(p.x) && Number.isInteger(p.y) && ["down", "left", "right"].includes(p.dir) && typeof p.sit === "boolean"), `${f}: 3つの ばしょ`);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) ok(Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) >= 40, `${f}: ${i}と${j}が ちかすぎる`);
  ok(P.every((p) => Math.hypot(p.x - C.x, p.y - C.y) <= 80), `${f}: まんなかから とおすぎる`);
  if (f === "circle") ok(uv[0].v < 0 && uv[1].u < 0 && uv[2].u > 0 && P[1].dir === "right" && P[2].dir === "left" && P.every((p) => p.sit), "circle: うしろ・ひだり まえ（みぎむき）・みぎ まえ（ひだりむき）に すわる");
  if (f === "show") ok(uv[0].v > uv[1].v && uv[0].v > uv[2].v && !P[0].sit && P[1].sit && P[2].sit && P[1].dir === "right" && P[2].dir === "left", "show: もって いる 子が まえで たつ・ふたりは うしろで みる");
  if (f === "row") ok(uv[1].u < uv[0].u && uv[0].u < uv[2].u && P.every((p) => p.dir === "down" && p.sit && Math.abs(p.x + p.y - C.x - C.y) <= 1), "row: よこ 一列（まんなかが もって いる 子）");
}
// ---- 5. だれ ----
{
  const S0 = { order: ["goji", "wanko", "gachan"], P: 0, winner: null, kind: "cards" };
  ok(HP.whoOf(S0, "H") === "goji" && HP.whoOf(S0, "A") === "wanko" && HP.whoOf(S0, "B") === "gachan" && HP.whoOf(S0, "P") === "goji" && HP.whoOf({ ...S0, P: 4 }, "P") === "wanko", "H・A・B・P（じゅんばん）");
  ok(HP.whoOf(S0, "W") === "goji" && HP.whoOf({ ...S0, winner: "gachan" }, "W") === "gachan" && HP.whoOf({ ...S0, winner: "gachan" }, "L") !== "gachan", "W（かった 子）・L（ほかの 子）");
  ok(HP.whoOf(S0, "not:goji") === "wanko" && HP.whoOf({ ...S0, order: ["wanko", "goji", "gachan"] }, "not:wanko") === "goji" && HP.whoOf(S0, "wanko") === "wanko", "not: と なまえ");
  const T = HP.turns(S0, [["ALL", "せーの！"], ["H", { wanko: "わん", gachan: "ぴよ", goji: "ガゥ" }, "shout"]], "beat");
  ok(T.length === 4 && T.slice(0, 3).map((t) => t.who).join() === S0.order.join() && T[3].who === "goji" && T[3].text === "ガゥ" && T[3].kind === "shout" && T.every((t) => t.meta.play === "cards" && t.meta.at === "beat"), "ALL は 3人・ことばは 子ごとに えらべる");
}
// ---- 6. なわとびの なわ・ドリルの ページ・ほんの ひょうし ----
{
  const f = 1.05 * Math.PI * 2, at = (ph) => ({ activity: { elapsed: ph / f } }), Q = { ev: null, evT: 9 };
  const top = HP.rope(Q, at(0.001)), bot = HP.rope(Q, at(Math.PI)), down = HP.rope(Q, at(Math.PI / 2)), up = HP.rope(Q, at(Math.PI * 1.5));
  ok(top.air === 0 && bot.air === 1 && down.front && !up.front && down.air === 0 && up.air === 0, "なわは あたまの うえ → まえ → あしの した（とぶ）→ うしろ");
  ok(HP.rope({ ev: "trip", evT: 0.2 }, at(1)).trip && HP.rope({ ev: "trip", evT: 0.2 }, at(1)).air === 0 && !HP.rope({ ev: "trip", evT: 2 }, at(1)).trip, "ひっかかる（すこしの あいだ）");
  for (const it of PG.of("drill")) { const P = HP.DRILL_PAGE[it.play]; ok(P && (P.clock || (Array.isArray(P.grid) && P.grid.length === 4) || (Array.isArray(P.rows) && P.rows.length === 3)) && (it.subject === "kokugo" ? !P.clock : !P.grid), `${it.id}: ドリルの ページ（ますは こくご・とけいは さんすう）`); }
  ok(new Set(PG.of("drill").map((it) => JSON.stringify(HP.DRILL_PAGE[it.play]))).size === 10 && HP.DRILL_PAGE.tokei.clock && ["hiragana", "katakana", "kanji"].every((k) => HP.DRILL_PAGE[k].grid), "ドリルの ページは 10しゅ ちがう（もじは ます・とけいは とけいの え）");
  { const S = { discs: HP.reversiStart(), seed: 3, beat: 1, turn: 2 }, d0 = S.discs;
    ok(d0.length === 64 && d0.filter(Boolean).length === 4 && d0[27] === d0[36] && d0[28] === d0[35] && d0[27] !== d0[28] && HP.reversiMoves(d0, 1).length === 4, "リバーシ: 8×8・まんなかに 4つ（ななめに おなじ いろ）・くろの はじめの ては 4とおり");
    const n0 = S.discs.filter(Boolean).length; HP.reversiFlip(S);
    ok(S.discs.filter(Boolean).length === n0 + 3 && S.turn === 1, "リバーシ: ほんとうの きまりで 3て すすむ（くろ・しろ・くろ）");
    S.beat = 2; HP.reversiFlip(S);
    ok(S.discs.filter(Boolean).length === n0 + 6 && S.turn === 2 && S.discs.filter((v) => v === 1).length + S.discs.filter((v) => v === 2).length === n0 + 6, "リバーシ: つづけて 3て（しろ・くろ・しろ）"); }
  ok(PG.of("book").every((it) => /^#[0-9A-F]{6}$/i.test(HP.BOOK_COVER[it.play] || "")) && new Set(PG.of("book").map((it) => HP.BOOK_COVER[it.play])).size === 10, "ほんの ひょうしは 10いろ");
}

// ---- 7. うごき（にせの へや。js/home-doze.js の 検査と おなじ つくり）----
const fresh = () => { S.d = S.fresh(); S.d.parents.auto = true; return S.d; };
const mk = (o = {}) => {
  const sc = Object.create(HouseScene.prototype);
  Object.assign(sc, { mode: null, s: 0.6, ox: 195, oy: 120, actorScale: 0.8, view: { top: 0, bottom: 1000 }, life: HomeLife.blank(), work: { away: false, phase: "home", t: 0, next: 1e9, queue: [], turn: 0, fade: 1, clock: U.hourNow, labeled: true }, fxs: [], care: 0, doze: null, play: null,
    parents: [{ id: "papa", x: 160, y: ROOM.WALL + 120 }, { id: "mama", x: 380, y: ROOM.WALL + 250 }].map((p) => ({ ...p, tx: p.x, ty: p.y, anim: 0, state: "idle", time: 0, target: null, queue: [] })),
    chars: IDS.map((id, i) => ({ id, x: 150 + i * 90, y: ROOM.WALL + 200, tx: 0, ty: 0, dir: "down", state: "idle", t: 3, anim: 0, emo: null, hidden: false, jumpT: -1 })),
    parentTimer: 8, parentTurn: 0, careTurn: 0, parentSpeechTurn: 0, ...o });
  sc.fx = function (kind) { this.fxs.push(kind); };
  sc.updateCare = function () { this.care++; };
  HomeActions.init(sc);
  return sc;
};
const hold = (who, id) => { if (id && !WearStock.can(id, who)) WearStock.add(id, 1); WearStock.put(who, HandItems.SLOT, id); };
const said = (sc, at) => sc.life.log.filter((l) => l.play && (!at || l.at === at));
const run = (sc, sec, step = 0.25) => { for (let t = 0; t < sec - 1e-9; t += step) { HomeLife.advance(sc, step); HomeActions.update(sc, step); HP.update(sc, step); } };
const arrive = (sc) => { for (const c of sc.chars) if (c.state === "walk") { c.x = c.tx; c.y = c.ty; c.state = "idle"; c.t = 3; } for (const p of sc.parents) if (p.state === "walk") { p.x = p.tx; p.y = p.ty; p.state = "idle"; } };
UI.layers = 0; Game.trans = null; Game.paused = false; G.W = 390; G.H = 844; G.t = 0;
// 7-1. もって いない ときは できない・「あそぶ」の まど
{
  fresh();
  const ask = async (sc, pick = -1) => { let q = null, ch = null; const a = UI.ask; UI.ask = async (t, c) => { q = t; ch = c; return pick < 0 ? c.length - 1 : pick; }; try { await HouseScene.prototype.menuPlay.call(sc); } finally { UI.ask = a; } return { q, ch }; };
  let sc = mk(); sc.startHide = () => (sc.hid = 1); sc.startBall = () => (sc.ball = 1);
  ok(HP.options(sc).length === 0, "なにも もって いない ときは あそべる ものが ない");
  let r = await ask(sc);
  ok(r.ch.join() === "かくれんぼ,ボールあそび,やめる" && /コンビニ/.test(r.q) && /Meeときょれじゃ/.test(r.q), "もって いない とき: かくれんぼ・ボールあそび と かいかたの ヒント " + r.q);
  WearStock.add("pg_cards", 1);
  r = await ask(sc);
  ok(HP.options(sc).length === 1 && HP.options(sc)[0].house && HP.options(sc)[0].who === "wanko" && r.ch.join() === "かくれんぼ,ボールあそび,あそびどうぐで あそぶ,やめる", "かったけど もたせて いない とき: おうちに ある ものの しゅるい（とりだすのは あそびどうぐが すきな わんこ） " + r.ch.join(" / "));
  { const st = HP.start, calls = []; HP.start = (s, who, id, via) => (calls.push(`${who}:${id}:${via}`), true); await ask(sc, 2); HP.start = st;
    ok(calls.join() === "wanko:pg_cards:menu", "「あそびどうぐで あそぶ」→ おうちの トランプを わんこが とりだして はじめる " + calls); }
  await ask(sc, 0); await ask(sc, 1);
  ok(sc.hid === 1 && sc.ball === 1, "かくれんぼ・ボールあそびの ばんごうは そのまま");
  hold("wanko", "pg_cards"); hold("gachan", "bk_dino"); hold("goji", "dr_kuku");
  r = await ask(sc);
  ok(r.ch.length === 6 && r.ch[0] === "かくれんぼ" && r.ch[1] === "ボールあそび" && r.ch[5] === "やめる" && r.ch.includes(`トランプ（${S.d.chars.wanko.name}）`) && r.ch.includes(`${PG.INDEX.bk_dino.name}（${S.d.chars.gachan.name}）`) && r.ch.includes(`${PG.INDEX.dr_kuku.name}（${S.d.chars.goji.name}）`), "もって いる もの（だれが もって いるか）: " + r.ch.join(" / "));
  const st = HP.start, calls = []; HP.start = (s, who, id, via) => (calls.push(`${who}:${id}:${via}`), true);
  for (let i = 2; i < 5; i++) await ask(sc, i);
  HP.start = st;
  ok(calls.length === 3 && ["wanko:pg_cards:menu", "gachan:bk_dino:menu", "goji:dr_kuku:menu"].every((c) => calls.includes(c)), "えらんだ もので はじまる " + calls);
  hold("goji", "pg_cards");
  ok(HP.options(sc).filter((o) => o.item.id === "pg_cards").length === 1, "おなじ ものは 1つ だけ ならぶ");
  ok(HP.options(mk({ guest: { room: S.d.room } })).length === 0, "おじゃま では できない");
  ok(!HP.start(sc, "goji", "pg_rope") && !HP.start(sc, "wanko", "bk_dino"), "もって いない もの・ほかの 子が もって いて のこりが ない もの では はじめない");
  // ごじが トランプに もちかえた: くくの ドリルは おうちに ある（だれも もって いない）→ ごじが とりだす・「あそぶ」は「しゅくだいを する」
  const kuku = HP.options(sc).find((o) => o.item.id === "dr_kuku");
  ok(kuku && kuku.house && kuku.who === "goji", "てばなした ドリルは おうちに ある もの（ドリルが すきな ごじが とりだす）");
  r = await ask(sc);
  ok(r.ch.length === 6 && r.ch[4] === "しゅくだいを する" && r.ch[5] === "やめる", "もって いる もの → おうちに ある ものの しゅるい の じゅん " + r.ch.join(" / "));
  { const st = HP.start, calls = []; HP.start = (s, who, id, via) => (calls.push(`${who}:${id}:${via}`), true); await ask(sc, 4); HP.start = st;
    ok(calls.join() === "goji:dr_kuku:menu", "「しゅくだいを する」→ ごじが くくの ドリル " + calls); }
  // ぜんぶ もって いても「あそぶ」の まどは 9こ まで（もって いる 3・しゅるい 3）
  for (const id of PG.IDS) WearStock.add(id, 1);
  hold("goji", "dr_kuku");
  r = await ask(sc);
  ok(r.ch.length === 9 && r.ch.slice(5, 8).join() === Object.values(HP.CAT_ASK).join() && HP.options(sc).length === 30, "30しゅ ぜんぶ あっても まどは 9こ（しゅるいを えらぶと どれかは 3人が きめる） " + r.ch.join(" / "));
}
// 7-2. はじめられない とき・じぶんたちで はじめる（しずかな じかん だけ かぞえる）
{
  fresh(); hold("gachan", "pg_sugoroku");
  const sc = mk();
  ok(HP.can(sc), "しずかな へやで はじめられる");
  for (const [k, set, undo] of [
    ["mode", (s) => (s.mode = "food"), (s) => (s.mode = null)],
    ["けんか", (s) => (s.life.quarrel = true), (s) => (s.life.quarrel = false)],
    ["かけあいの とちゅう", (s) => s.life.queue.push({ who: "wanko", text: "x" }), (s) => (s.life.queue.length = 0)],
    ["おトイレ", (s) => (s.wc = { who: "goji" }), (s) => (s.wc = null)],
    ["おねがい", (s) => (s.wishFx = { busy: true, amae: 0 }), (s) => (s.wishFx = null)],
    ["ドアへ", (s) => (s.doorWalk = {}), (s) => (s.doorWalk = null)],
    ["かいだん", (s) => (s.climb = {}), (s) => (s.climb = null)],
    ["ぱぱ ままの でかける", (s) => (s.work.phase = "leave"), (s) => (s.work.phase = "home")],
    ["おひるね", (s) => (s.doze = { phase: "sleep" }), (s) => (s.doze = null)],
    ["かくれた 子", (s) => (s.chars[1].hidden = true), (s) => (s.chars[1].hidden = false)],
    ["たべて いる 子", (s) => (s.chars[2].state = "eat"), (s) => (s.chars[2].state = "idle")],
    ["まど", () => (UI.layers = 1), () => (UI.layers = 0)],
    ["おじゃま", (s) => (s.guest = { room: S.d.room }), (s) => delete s.guest],
  ]) { set(sc); ok(!HP.can(sc) && !HP.start(sc, "gachan", "pg_sugoroku"), `はじめない: ${k}`); undo(sc); }
  ok(HP.can(sc), "もとに もどすと はじめられる");
  const st = HP.st(sc);
  ok(st.next >= HP.FIRST[0] && st.next <= HP.FIRST[1] && HP.FIRST[0] >= 40 && HP.FIRST[1] <= 120 && HP.AGAIN[0] > HP.FIRST[1] && HP.AGAIN[1] <= 360, "さいしょは 45びょう〜1ふん40びょう あと・そのあとは 2ふん半〜5ふん ごと " + st.next);
  st.next = 1; sc.mode = "food"; run(sc, 2); ok(!HP.on(sc) && st.next === 1, "mode の あいだは かぞえない");
  sc.mode = null; Game.paused = true; run(sc, 2); ok(!HP.on(sc) && st.next === 1, "とめて すすめる テストの あいだは かぞえない"); Game.paused = false;
  run(sc, 1.5);
  ok(st.phase === "gather" && st.via === "self" && st.holder === "gachan" && st.kind === "sugoroku" && !st.house && sc.chars.every((c) => c.state === "walk"), "じかんに なると もって いる 子が さそって あつまる");
  const th = said(sc, "think");
  run(sc, 2);
  const log = sc.life.log, iT = log.findIndex((l) => l.at === "think"), iS = log.findIndex((l) => l.at === "start");
  ok(th.length === 1 && th[0].id === "gachan" && th[0].text === D.think.toy.gachan && th[0].kind === "think" && iT >= 0 && iS > iT && log[iS].id === "gachan", "じぶんたちで はじめる まえに こころの こえ（しゅるいで かわる）→ さそう");
}
// 7-3. あそぶ ながれ（トランプ: まるく すわる・ぱぱ ままの ひとこと・かった 子・ごきげん）
{
  fresh(); hold("wanko", "pg_cards");
  const sc = mk(), mood0 = IDS.map((id) => S.d.chars[id].mood);
  IDS.forEach((id) => (S.d.chars[id].mood = 50));
  ok(HP.start(sc, "wanko", "pg_cards", "menu"), "トランプで はじめる");
  const st = HP.st(sc), K = D.cards;
  ok(st.phase === "gather" && st.order[0] === "wanko" && st.form === undefined && HP.state(sc).form === "circle", "あつまる（まるく すわる）");
  ok(said(sc, "start").length === 1 && said(sc, "start")[0].id === "wanko" && said(sc, "start")[0].text === K.start.wanko, "もって いる 子が さそう");
  run(sc, 3);
  ok(said(sc, "agree").length === 2 && said(sc, "agree").every((l) => l.id !== "wanko" && l.text === K.agree[l.id]), "ふたりが こたえる");
  ok(sc.chars.every((c) => Math.hypot(c.tx - st.pos[c.id].x, c.ty - st.pos[c.id].y) < 1), "3人とも じぶんの ばしょへ あるく");
  ok(sc.parents.filter((p) => p.state === "walk").every((p) => !HP.inWay(st.spot, p.tx, p.ty)) && sc.parents.every((p) => p.state === "walk" || !HP.inWay(st.spot, p.x, p.y)), "ぱぱ・ままは あそぶ ばしょの まえ・ちかくから よける " + JSON.stringify(sc.parents.map((p) => [p.state, p.x, p.y, p.tx, p.ty])));
  ok(HomeDoze.cover(sc, Object.values(st.pos)) === 0 || st.spot.bad > 0, "すわる ばしょは 家具の なか・かげ では ない");
  arrive(sc); run(sc, 0.5);
  ok(st.phase === "play" && sc.chars.every((c) => HP.playing(c) && c.state === "activity" && c.dir === st.pos[c.id].dir), "ついたら すわって あそびはじめる");
  // あそんで いる あいだ: ほかの できごとを まつ・おトイレ・おひるね・おねがい・ぱぱ ままの おせわは おやすみ
  sc.life.next = 0; sc.actions.next = 0; run(sc, 0.25);
  ok(sc.life.next >= 3.5 && sc.actions.next >= 2.5, "けんか・かけあい・しぐさの タイマーを まつ");
  ok(!HomeToilet.calm(sc) && !HomeDoze.can(sc), "おトイレの もじもじ・おひるねは おやすみ");
  sc.parents.forEach((p) => { p.state = "idle"; p.target = null; p.queue = []; }); sc.parentTimer = 0; ParentCare.update(sc, 0.25);
  ok(sc.parents.every((p) => !p.target && !p.queue.length) && sc.parentTimer > 0, "ぱぱ ままの おせわは おやすみ");
  delete sc.wishFx; GowagaWish.house(sc, 1); ok(!sc.wishFx, "おねがいは おやすみ");
  // てに もつ ものは canvas で 描く（スプライトの 手から けす）・からだ
  G.scene = sc;
  hold("gachan", "bk_dino"); hold("goji", "hi_balloon_red");
  const o = sc.charOpts(sc.chars[0], "sit_01", "down", "happy"), o2 = sc.charOpts(sc.chars[1], "sit_01", "down", "happy"), o3 = sc.charOpts(sc.chars[2], "sit_01", "down", "happy");
  ok(o.outfit.hand === null && o2.outfit.hand === null && o3.outfit.hand === "hi_balloon_red", "つかって いる トランプは 手から けす（canvas で 描く）・ほかの 子の ほんも おく・ふうせんは そのまま");
  hold("gachan", null); hold("goji", null);
  ok(IDS.every((id) => { const v = HomeActions.visual(sc.chars.find((c) => c.id === id)); return v && v.pose === "sit_01" && v.dir === st.pos[id].dir; }), "3人とも すわって まんなかを むく");
  // うごきの かたまり 5つ（その しゅるいの ことば）→ ぱぱ ままの ひとこと → おわり
  run(sc, st.BEAT * 5 + 1);
  const beat = said(sc, "beat").map((l) => l.text), all = K.beats.flatMap((b) => b.t.map((x) => x[1])).flatMap((t) => (typeof t === "string" ? [t] : Object.values(t)));
  ok(beat.length >= 9 && beat.every((t) => all.includes(t)), `トランプの かけあい ${beat.length}`);
  const pa = said(sc, "parent");
  ok(pa.length === 1 && [...K.parent.papa, ...K.parent.mama].includes(pa[0].text) && said(sc, "reply").length === 1 && said(sc, "reply")[0].text === D.reply[said(sc, "reply")[0].id], "ぱぱ・ままの ひとこと → だれかが こたえる（1かい）");
  ok(st.phase === "end" && IDS.includes(st.winner), "おわり（かった 子が いる）");
  ok(IDS.every((id) => S.d.chars[id].mood > 50) && sc.care >= 1, "3人の ごきげんが あがる");
  ok(HomeActions.visual(sc.chars.find((c) => c.id !== st.winner)).face === "normal", "まけた 子は ふつうの かお");
  for (let i = 0; i < 80 && HP.on(sc); i++) run(sc, 0.25);
  ok(!HP.on(sc) && st.why === "done" && st.plays === 1 && st.last === "cards" && st.next >= HP.AGAIN[0] - 0.5 && sc.chars.every((c) => !HP.playing(c) && c.state === "idle"), "おわって たちあがる・つぎは しばらく あと " + JSON.stringify([st.why, st.next, sc.chars.map((c) => c.state)]));
  ok(st.t === 0 && sc.life.next >= 8, "おわった あとは すこし しずかに");
  ok(said(sc, "end").length >= 2 && said(sc, "end").some((l) => l.id === st.winner), "おわりの かけあい（かった 子）");
  G.scene = null; IDS.forEach((id, i) => (S.d.chars[id].mood = mood0[i]));
}
// 7-4. ドリル（もって いる 子は もっと ごきげん）・ほん・して みせる（なわとび）
{
  fresh(); hold("goji", "dr_kuku");
  let sc = mk(); IDS.forEach((id) => (S.d.chars[id].mood = 40));
  ok(HP.start(sc, "goji", "dr_kuku"), "くくの ドリル");
  arrive(sc); run(sc, 3.5); arrive(sc); run(sc, 0.5);
  const st = HP.st(sc);
  ok(st.phase === "play" && HP.state(sc).form === "row" && st.pos.goji && HP.layout("row", st.spot)[0].x === st.pos.goji.x, "ドリルは よこ 一列（まんなかで かく）");
  run(sc, st.BEAT * 5 + 1);
  ok(st.phase === "end" && st.ev === "stamp" && S.d.chars.goji.mood >= S.d.chars.wanko.mood + 4 && !st.winner, "おわると はなまる・かいた 子は もっと ごきげん");
  fresh(); hold("gachan", "pg_rope"); sc = mk();
  ok(HP.start(sc, "gachan", "pg_rope"), "なわとび");
  arrive(sc); run(sc, 3.5); arrive(sc); run(sc, 0.5);
  ok(HP.state(sc).form === "show" && !HP.st(sc).pos.gachan.sit && HP.st(sc).pos.wanko.sit, "なわとびは とぶ 子が まえで たつ・ふたりは すわって みる");
}
// 7-5. やめる（したの ボタン・もようがえ・ひとり たつ・きがえで はずす）・なでても やめない
{
  const play = (who, id) => { fresh(); hold(who, id); const sc = mk(); ok(HP.start(sc, who, id), "はじめる " + id); arrive(sc); run(sc, 3.5); arrive(sc); run(sc, 0.5); ok(HP.st(sc).phase === "play", "あそぶ " + id); return sc; };
  let sc = play("wanko", "bk_space");
  HP.stop(sc, "button");
  ok(!HP.on(sc) && HP.st(sc).why === "button" && said(sc, "stop").length === 1 && said(sc, "stop")[0].text === D.stop.wanko && sc.chars.every((c) => !HP.playing(c)), "したの ボタン: もって いる 子が「また あとでね」");
  sc = play("gachan", "pg_kendama"); sc.mode = "edit"; run(sc, 0.25);
  ok(!HP.on(sc) && HP.st(sc).why === "stir" && said(sc, "stop").length === 0, "もようがえ（mode）が はじまったら やめる");
  sc = play("goji", "pg_game"); HomeActions.cancel(sc.chars[0]); sc.chars[0].state = "walk"; run(sc, 0.25);
  ok(!HP.on(sc) && sc.chars.every((c) => !HP.playing(c)), "ひとり たったら みんな やめる（3人は いっしょ）");
  sc = play("wanko", "bk_maze"); WearStock.put("wanko", HandItems.SLOT, null); run(sc, 0.25);
  ok(!HP.on(sc) && HP.st(sc).why === "stir", "きがえで はずしたら やめる");
  sc = play("gachan", "pg_bubbles"); ok(!HP.start(sc, "gachan", "pg_bubbles"), "あそんで いる ときは もう ひとつ はじめない");
}
// 7-6. おうちに ある もの（だれも もって いない のこり。オーナーの 追加 2026-10-07「何も指示しなくても自律的にごわがが行う」）:
// とりだす 子・あつまる あいだ もって あるく・もちものは かえない・なくなったら やめる・だれも もって いなくても じぶんたちで はじめる
{
  fresh(); WearStock.add("bk_dino", 1); WearStock.add("pg_rope", 1); WearStock.add("dr_kuku", 1);
  const sc = mk(), op = HP.options(sc), by = Object.fromEntries(op.map((o) => [o.item.id, o]));
  ok(op.length === 3 && op.every((o) => o.house) && by.bk_dino.who === "goji" && by.pg_rope.who === "wanko" && by.dr_kuku.who === "goji", "おうちに ある もの 3つ（きょうりゅう ずかん・ドリルは ごじ・なわとびは わんこが とりだす） " + JSON.stringify(op.map((o) => [o.item.id, o.who, o.house])));
  ok(HP.taker(sc, PG.INDEX.bk_momo) === "gachan" && HP.taker(sc, PG.INDEX.pg_otedama) === "gachan" && HP.taker(sc, PG.INDEX.pg_cards) === "wanko" && HP.taker(sc, PG.INDEX.dr_math) === "goji", "とりだす 子は すきな もの（えほん・おてだまは がちゃん・トランプは わんこ・すうがくは ごじ）");
  hold("gachan", "hi_balloon_red"); ok(HP.taker(sc, PG.INDEX.bk_momo) !== "gachan", "ふうせん・バッグ・リードを もって いる 子は とりださない"); hold("gachan", null);
  hold("wanko", "pg_cards"); ok(HP.taker(sc, PG.INDEX.pg_otedama) === "gachan" && HP.options(sc).find((o) => o.item.id === "pg_cards").house === false, "もって いる ものは もって いる 子が さそう（おうちの ものに ならない）"); hold("wanko", null);
  const keep = () => JSON.stringify([S.d.wardrobe, IDS.map((id) => S.d.chars[id].outfit)]), before = keep();
  G.scene = sc;
  ok(HP.start(sc, "goji", "bk_dino", "menu"), "おうちに ある ずかんで はじめる");
  const st = HP.st(sc);
  ok(st.house && st.holder === "goji" && HP.state(sc).house && said(sc, "start")[0].id === "goji", "とりだした ごじが さそう");
  ok(sc.charOpts(sc.chars[2], "walk_01", "down", "happy").outfit.hand === "bk_dino" && sc.charOpts(sc.chars[0], "walk_01", "down", "happy").outfit.hand == null && S.d.chars.goji.outfit.hand == null, "あつまる あいだ とりだした 子が ずかんを もって あるく（絵だけ・もちものは かえない）");
  arrive(sc); run(sc, 3.5); arrive(sc); run(sc, 0.5);
  ok(st.phase === "play" && HP.state(sc).form === "row" && sc.chars.every((c) => HP.playing(c) && sc.charOpts(c, "sit_01", "down", "happy").outfit.hand == null), "すわったら canvas で ひらいた ほんを 描く（手には もたない）");
  run(sc, st.BEAT * 5 + 1); for (let i = 0; i < 80 && HP.on(sc); i++) run(sc, 0.25);
  ok(!HP.on(sc) && st.why === "done" && st.plays === 1 && keep() === before, "おわっても もちもの・かずは かわらない（セーブしない）");
  sc.life.queue.length = 0;
  ok(HP.start(sc, "wanko", "pg_rope", "menu"), "おうちに ある なわとび");
  arrive(sc); run(sc, 3.5); arrive(sc); run(sc, 0.5);
  ok(st.phase === "play" && HP.state(sc).form === "show" && !st.pos.wanko.sit, "なわとびは とりだした わんこが まえで とぶ");
  WearStock.set("pg_rope", 0); run(sc, 0.25);
  ok(!HP.on(sc) && st.why === "stir", "おうちから なくなったら やめる");
  G.scene = null;
}
// 7-7. じぶんたちで えらぶ（じかん・てんき・もって いる・すき・まえと おなじ）・だれも もって いなくても じぶんたちで はじめる
{
  fresh();
  const o = (id, house = true, who = "wanko") => ({ item: PG.INDEX[id], kind: PG.INDEX[id].play, house, who }), w = (x, h, wx = "clear", last = null) => HP.weight(x, last, h, wx);
  ok(w(o("dr_kuku"), 16) >= 2 * w(o("pg_cards"), 16) && w(o("dr_kuku"), 16) >= 3 * w(o("bk_momo"), 16) && w(o("dr_kuku"), 16) === 3 * w(o("dr_kuku"), 11), "15〜19じは しゅくだいが でやすい（3ばい）");
  ok(w(o("bk_momo"), 20) > w(o("pg_cards"), 20) && w(o("bk_moon"), 22) > 5 * w(o("pg_cards"), 22) && w(o("dr_kuku"), 22) < w(o("dr_kuku"), 11), "よるは ほん（ねる まえ）・あそびどうぐと しゅくだいは でにくい");
  ok(w(o("bk_momo"), 11, "rain") === 2 * w(o("bk_momo"), 11) && w(o("bk_momo"), 11, "snow") === 2 * w(o("bk_momo"), 11) && w(o("pg_cards"), 11, "rain") === w(o("pg_cards"), 11), "あめ・ゆきの 日は ほんが 2ばい");
  ok(w(o("pg_cards"), 11) === 1.5 * w(o("pg_cards"), 20), "ひる（9〜18じ）は あそびどうぐが 1.5ばい");
  ok(w(o("pg_cards", false), 11) === 1.5 * w(o("pg_cards"), 11), "もって いる ものは 1.5ばい（もって いる 子が「これ やろう！」）");
  ok(w(o("pg_rope", true, "wanko"), 11) === 2 * w(o("pg_rope", true, "gachan"), 11) && w(o("bk_dino", true, "goji"), 11) === 2 * w(o("bk_dino", true, "gachan"), 11), "その 子の とくに すきな もの（わんこの なわとび・ごじの きょうりゅう ずかん）は 2ばい");
  ok(w(o("pg_cards"), 11, "clear", "cards") < 0.2 * w(o("pg_cards"), 11), "まえと おなじ ものは でにくい");
  const sc = mk(), ops = [o("dr_kuku"), o("pg_cards"), o("bk_momo")], seen = new Set();
  for (let r = 0; r < 1; r += 0.01) seen.add(HP.choose(sc, ops, r).item.id);
  ok(seen.size === 3 && HP.choose(sc, [], 0.5) === null, "どれも えらばれる ことが ある（おもみの わりあいで）");
  // だれも もって いない: 15じに たしざん ドリル と トランプ が おうちに ある → ドリルが おおい・ごじが とりだす・こころの こえ
  WearStock.add("dr_tashi", 1); WearStock.add("pg_cards", 1);
  // ゲームの Math（vm の なか）の random を きまった じゅんの かずに（けっかが いつも おなじ）
  const GMath = U.pick.constructor("return Math")(), random = GMath.random; let seed = 12345; GMath.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hourNow = U.hourNow; U.hourNow = () => 16;
  let drill = 0;
  for (let i = 0; i < 40; i++) {
    const s2 = mk(), st = HP.st(s2); st.next = 0.2; run(s2, 0.5);
    ok(st.phase === "gather" && st.via === "self" && st.house, "だれも もって いなくても じぶんたちで はじめる " + i);
    if (st.cat === "drill") { drill++; const th = said(s2, "think"); ok(st.holder === "goji" && th.length === 1 && th[0].id === "goji" && th[0].text === D.think.drill.goji, "ごじが ドリルを とりだす（こころの こえ）"); }
    else ok(st.holder === "wanko" && said(s2, "think")[0].text === D.think.toy.wanko, "わんこが トランプを とりだす");
  }
  U.hourNow = hourNow; GMath.random = random;
  ok(drill >= 20 && drill <= 36, `ゆうがたは しゅくだいが おおい・トランプも ある（40かいで ドリル ${drill}かい・おもみ 3 たい 1.5）`);
}
IDS.forEach((id) => S.d && S.d.chars[id] && PG.isPlay(S.d.chars[id].outfit.hand) && WearStock.put(id, HandItems.SLOT, null));
console.log(`✓ check-home-play: ${n} こ（あそびかた ${kinds.length}・ことば ${lines.length}〔ちがう ${new Set(lines.map((l) => l.text)).size}〕・うごき ${evs.size}）`);
