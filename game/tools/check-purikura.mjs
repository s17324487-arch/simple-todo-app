// ぷりくら（js/purikura.js）と すまほの「しゃしん」アプリの 検査。ブラウザ なしで データ・セーブ・お金・しゃしんの かたちを たしかめる。
// えらべる もの（はいけい・ポーズ・かお・スタンプ・ことば）・ことばに 漢字なし・SVG・せんの データの いきき・こわれた しゃしん・300コイン と できあがり（1かいだけ）・60まい まで・ふるい セーブ・キャッシュの キー。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Purikura: P, PurikuraArt: A, Save: S } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {}; // HUD は ブラウザ だけ
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;

// ---- 1. えらべる もの ----
ok(P.BGS.length === 18 && P.POSES.length === 11 && P.FACES.length === 8 && P.STAMPS.length === 12 && P.WORDS.length === 8 && P.PENS.length === 6, "えらべる ものの かず");
// ブース 3台（Meeときょれじゃ 3F・UI-21）: ブースごとに はいけい 6つ（かさならない・ぜんぶで BGS）・わくの いろ・ロゴ・ことば。js/ike-arcade.js の IkeArcade.BOOTHS と id・なまえ・じゅんばんが おなじ
ok(P.BOOTHS.length === 3 && P.BOOTHS.map((b) => b.id).join() === "yume,school,odekake" && JSON.stringify(R.IkeArcade.BOOTHS) === JSON.stringify(P.BOOTHS.map((b) => ({ id: b.id, name: b.name }))), "ブースの id・なまえが IkeArcade.BOOTHS と ちがう");
ok(P.BOOTHS.every((b) => b.bgs.length === 6 && b.bgs.every((id) => P.BG[id])) && new Set(P.BOOTHS.flatMap((b) => b.bgs)).size === P.BGS.length, "ブースの はいけい 6つ（ほかの ブースと かさならない・ぜんぶ つかう）");
for (const b of P.BOOTHS) {
  ok(!kanji.test(b.name) && !kanji.test(b.logo) && /^#[0-9A-F]{6}$/.test(b.col) && /^#[0-9A-F]{6}$/.test(b.line), `ブース ${b.id} の なまえ・ロゴ・いろ`);
  for (const w of b.words) ok(!kanji.test(w) && w.length <= P.LIMIT.word && !P.WORDS.includes(w), `ブース ${b.id} の ことば「${w}」`);
  ok(JSON.stringify(P.wordsOf(b.id)) === JSON.stringify([...b.words, ...P.WORDS]), `ブース ${b.id} で つかえる ことば`);
}
ok(P.BOOTHS[0].bgs.join() === "yume,hana,hoshi,umi,heart,mee" && P.boothOf("hoshi").id === "yume" && P.boothOf("taiiku").id === "school" && P.boothOf("uchu").id === "odekake" && P.boothOf("nazo").id === "yume", "はいけいの ブース（まえからの 6つは ゆめかわ）");
{ const fl = R.VenueHalls.defs.arcade.floors, booths = fl[3].fixtures.filter((f) => f.kind === "photobooth");
  ok(booths.length === 3 && booths.map((f) => f.booth).join() === "yume,school,odekake" && booths.every((f, v) => f.variant === v && f.action === "photo" && f.label === P.BOOTHS[v].name + " ぷりくら"), "3F の ぷりくらの ブース 3台");
  ok(!fl[1].fixtures.some((f) => f.kind === "photobooth") && !fl[2].fixtures.some((f) => f.kind === "photobooth"), "1F・2F に ぷりくらが のこる"); }
for (const [name, list] of [["はいけい", P.BGS], ["ポーズ", P.POSES], ["かお", P.FACES], ["スタンプ", P.STAMPS]]) {
  ok(new Set(list.map((x) => x.id)).size === list.length, `${name}の id が かさなる`);
  for (const x of list) ok(x.name && !kanji.test(x.name) && x.name.length <= 6, `${name}「${x.name}」`);
}
for (const w of P.WORDS) ok(!kanji.test(w) && w.length <= P.LIMIT.word, `ことば「${w}」`);
for (const x of P.POSES) ok(["idle_01", "idle_02", "walk_01", "walk_02", "jump_01", "land_01"].includes(x.pose), `ポーズ ${x.id} が キャラ素材に ない`);
for (const x of P.FACES) for (const id of R.Chara.IDS) ok(typeof R.Chara.faceOf(id, x.id) === "string", `かお ${x.id}（${id}）`);
ok(P.PRICE === 300 && P.SHOTS === 4 && P.MAX === 60, "300コイン・4まい・60まい まで");

// ---- 2. 絵（SVG・キャッシュの キー）----
for (const b of P.BGS) { const s = A.BG_SVG[b.id](); ok(s.startsWith("<svg") && s.includes('viewBox="0 0 300 400"') && !/undefined|NaN/.test(s), `はいけい ${b.id} の SVG`); const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]); ok(new Set(ids).size === ids.length && ids.every((id) => id.startsWith("pk-")), `はいけい ${b.id} の id`); }
for (const x of P.STAMPS) { const s = A.STAMP_SVG[x.id](); ok(s.startsWith("<svg") && s.includes('viewBox="0 0 64 64"') && !/undefined|NaN/.test(s), `スタンプ ${x.id} の SVG`); }
ok(A.keys().length === P.BGS.length + P.STAMPS.length && A.keys().every((k) => /^puri:(bg|stamp):[a-z]+$/.test(k)), "キャッシュの キーは しゅるい だけ");
// はいけいの id は ほかの はいけいと かさならない（SvgCache で べつべつに ラスタ に する ので、id は 1まいの 中で 一意なら よい）。ブースの はいけいは 2かい つくっても おなじ 絵
for (const b of P.BGS) ok(A.BG_SVG[b.id]() === A.BG_SVG[b.id](), `はいけい ${b.id} が まいかい かわる`);
ok(A.LAYOUT.length === 2 && A.LAYOUT.every((L) => L.xs.length === 3 && L.order.slice().sort().join() === "0,1,2"), "3人の ならび（ぜんしん・アップ）");

// ---- 3. せんの データ ----
{
  const st = { c: 3, w: 1, pts: [[0, 0], [150, 200], [300, 400], [12, 399]] }, s = P.packStroke(st), u = P.unpackStroke(s);
  ok(typeof s === "string" && s.length === 2 + 4 * 4 && JSON.stringify(u) === JSON.stringify(st), "せんの データが もどらない");
  for (const bad of [null, 5, "", "9x", "00AB", "0<ABCD", "61AAAA"]) ok(P.unpackStroke(bad) === null, `こわれた せん ${JSON.stringify(bad)}`);
}

// ---- 4. しゃしんの かたち（こわれた ところは すてる）----
S.d = S.fresh(); S.d.coins = 1000;
const ph = (extra = {}) => ({ id: "ptest-0", t: 1790000000000, bg: "hoshi", z: 1, r: ["gachan", "wanko", "goji"], c: { wanko: ["jump", "surprise"], gachan: ["side", "love"], goji: ["crouch", "angry"] }, o: P.outfits(), d: { p: [P.packStroke({ c: 0, w: 1, pts: [[10, 10], [20, 30]] })], s: [["heart", 100, 120, 2]], x: [["なかよし", 150, 60, 1]] }, ...extra });
{
  const c = P.clean(ph());
  ok(c && c.bg === "hoshi" && c.k === "yume" && c.z === 1 && c.r.join() === "gachan,wanko,goji" && c.c.gachan[0] === "side" && c.d.p.length === 1 && c.d.s[0][0] === "heart" && c.d.x[0][0] === "なかよし", "ただしい しゃしんが かわる");
  // ブース（k）: ない（UI-21 より まえの しゃしん）・こわれた・はいけいと あわない ときは はいけいの ブース
  ok(P.clean(ph({ bg: "kyoshitsu", k: "school" })).k === "school" && P.clean(ph({ bg: "kyoshitsu" })).k === "school" && P.clean(ph({ bg: "uchu", k: "school" })).k === "odekake" && P.clean(ph({ k: "<x>" })).k === "yume", "しゃしんの ブース");
  ok(P.clean(null) === null && P.clean({}) === null && P.clean({ id: "<b>" }) === null, "こわれた しゃしんが のこる");
  const b = P.clean(ph({ bg: "nazo", r: ["wanko", "wanko", "goji"], c: { wanko: ["fly", "happy"] }, d: { p: ["xx", 5], s: [["bomb", 1, 1, 0], ["star", "a", 1, 0], ["star", 9999, -5, 7]], x: [["<script>ab</script>", 5, 5, 0], [12, 1, 1, 0]] } }));
  ok(b && b.bg === "yume" && b.r.join() === R.Chara.IDS.join() && b.c.wanko.join() === "stand,happy" && b.d.p.length === 0, "こわれた ところを なおす");
  ok(b.d.s.length === 1 && b.d.s[0][1] === 300 && b.d.s[0][2] === 0 && b.d.s[0][3] === 2, "スタンプを しゃしんの 中に");
  ok(b.d.x.length === 1 && !/[<>]/.test(b.d.x[0][0]) && b.d.x[0][0].length <= P.LIMIT.word, "ことばの きごうを のぞく");
  const many = P.clean(ph({ d: { p: Array.from({ length: 60 }, () => P.packStroke({ c: 1, w: 0, pts: Array.from({ length: 40 }, (_, i) => [i, i]) })), s: Array.from({ length: 50 }, () => ["star", 1, 1, 1]), x: Array.from({ length: 9 }, () => ["Mee", 1, 1, 1]) } }));
  ok(many.d.p.length <= P.LIMIT.strokes && many.d.p.reduce((s, x) => s + P.unpackStroke(x).pts.length, 0) <= P.LIMIT.points && many.d.s.length === P.LIMIT.stamps && many.d.x.length === P.LIMIT.texts, "らくがきの 上限");
  const v = P.view(c); ok(v.d.p[0].pts.length === 2 && P.view(c) === v, "描く ための かたち（1かい だけ つくる）");
  ok(JSON.stringify(P.clean(P.clean(ph()))) === JSON.stringify(P.clean(ph())), "2かい なおしても おなじ");
}

// ---- 5. セーブ・300コイン・できあがり ----
{
  ok(Array.isArray(S.d.photos) && S.d.photos.length === 0 && S.d.purikura && S.d.purikura.active === null, "Save.fresh に しゃしんが ない");
  const old = S.migrate({ ...S.fresh(), photos: undefined, purikura: undefined, coins: 777 }); ok(Array.isArray(old.photos) && old.purikura && old.purikura.plays === 0 && old.coins === 777, "ふるい セーブに たせない");
  S.d.coins = 250; ok(!P.pay() && S.d.coins === 250 && !S.d.purikura.active, "コインが たりなくても はじまる");
  S.d.coins = 1000; ok(P.pay() && S.d.coins === 700 && S.d.purikura.active && S.d.purikura.plays === 1, "300コインで はじまらない");
  ok(!P.pay() && S.d.coins === 700, "とちゅうで もう1かい はらえる");
  const shots = [0, 1, 2, 3].map((i) => ph({ id: "ps-" + i }));
  ok(P.finish(shots) && S.d.photos.length === 4 && S.d.purikura.active === null && S.d.purikura.taken === 4, "できあがりで 4まい はいらない");
  ok(!P.finish(shots) && S.d.photos.length === 4, "できあがりが 2かい できる");
  ok(P.list().length === 4 && P.list()[0].id === "ps-0", "しゃしんの じゅんばん");
  ok(P.remove("ps-1") && P.list().length === 3 && !P.remove("ps-1"), "しゃしんを けす");
  // セーブの 中の こわれた しゃしんは よむ ときに のぞく
  S.d.photos.push({ id: "<x>" }, 42); ok(P.list().length === 3, "こわれた しゃしんが のこる");
  // 60まい まで（いっぱいの ときは はじめない）
  S.d.photos = Array.from({ length: P.MAX - P.SHOTS }, (_, i) => P.clean(ph({ id: "pf-" + i }))); ok(!P.full(), "56まいで いっぱい");
  S.d.photos.push(P.clean(ph({ id: "pf-x" }))); ok(P.full(), "57まいで いっぱいに ならない");
  S.d.coins = 1000; S.d.purikura.active = "s1"; P.finish([0, 1, 2, 3].map((i) => ph({ id: "pz-" + i }))); ok(S.d.photos.length === P.MAX && S.d.photos[S.d.photos.length - 1].id === "pz-3", "60まいを こえる");
  // セーブの 大きさ（60まい・らくがき いっぱい でも 小さい）
  const big = P.clean(ph({ id: "pbig", d: { p: Array.from({ length: 40 }, () => P.packStroke({ c: 2, w: 1, pts: Array.from({ length: 37 }, (_, i) => [i * 8, 400 - i * 10]) })), s: Array.from({ length: 30 }, (_, i) => ["kira", i * 10, i * 13, i % 3]), x: Array.from({ length: 6 }, () => ["ずっと いっしょ", 150, 200, 3]) } }));
  ok(JSON.stringify(big).length < 9000 && JSON.stringify(big).length * P.MAX < 540000, `しゃしん 1まいが 大きすぎる（${JSON.stringify(big).length}）`);
}

// ---- 6. すまほの「しゃしん」アプリ・そとへの つうしん なし ----
{
  const app = R.Smaho.APPS.find((a) => a.id === "photos");
  ok(app && app.name === "しゃしん" && app.when() === true && R.Smaho.ICON.photos && R.Smaho.apps().includes(app), "すまほに「しゃしん」アプリが ない");
  ok(typeof P.phoneView === "function" && typeof P.phoneOne === "function" && typeof P.download === "function", "しゃしんの 一覧・1まいの 画面・ほぞん");
  const src = readFileSync(new URL("../js/purikura.js", import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.share|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), "ぷりくらが そとへ つうしん する／セーブを じかに さわる");
}
// ---- 7. はっきりした ポーズ・かお・3人の ばしょ（UI-24）----
{
  const C = R.Chara, PP = R.PuriPose, GS = R.CHARA_GESTURES, svg = (id, o) => C.svg(id, o);
  const gestures = P.POSES.filter((x) => x.gesture);
  ok(gestures.map((x) => x.id).join() === "peace,shakin,wai,heart,nyan" && gestures.map((x) => x.name).join() === "ピース,しゃきーん,わーい,ハート,にゃん" && P.POSES[0].id === "stand", "あたらしい ポーズ 5しゅ（たつ の つぎに ならぶ）");
  const idsOf = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  // 手の さき（まわした あと）: かたを まん中に rot ど まわす（chara.js と おなじ。うでを のばす len も）
  const handAt = (id, g, k) => { const def = GS[g], a = def.arms[id][k] || {}, L = (def.len && def.len[id]) || 1, P0 = C.PROFILE[id], ar = P0.arms[k], PA = L === 1 || ar.path ? P0 : { ...P0, arms: P0.arms.map((q) => { if (q.path) return q; const t = (q.rot * Math.PI) / 180, d = q.ry * (L - 1); return { ...q, cx: q.cx - Math.sin(t) * d, cy: q.cy + Math.cos(t) * d, ry: q.ry * L }; }) }, E = R.charaArmEnds(PA, k), t = ((a.rot || 0) * Math.PI) / 180, dx = E.hand[0] - E.shoulder[0], dy = E.hand[1] - E.shoulder[1]; return [E.shoulder[0] + dx * Math.cos(t) - dy * Math.sin(t), E.shoulder[1] + dx * Math.sin(t) + dy * Math.cos(t)]; };
  for (const id of C.IDS) {
    const stand = svg(id, { face: "happy" });
    for (const x of gestures) {
      ok(GS[x.gesture] && GS[x.gesture].arms[id] && GS[x.gesture].arms[id].length === 2, `ポーズ ${x.id}（${id}）の うで`);
      const s = svg(id, { pose: x.pose, face: "happy", gesture: x.gesture });
      ok(s.startsWith("<svg") && !/undefined|NaN/.test(s) && s !== stand && new Set(idsOf(s)).size === idsOf(s).length, `ポーズ ${x.id}（${id}）の 絵（id が かさならない）`);
      // 服を きても id が かさならない・よこむき・うしろむき では うでの ポーズは つかわない
      for (const outfit of [{ body: "tshirt_star" }, { body: "mee_sailor", head: "mee_schoolhat", back: "mee_randoseru" }, { body: "ike_gothic_1", back: "cape" }]) { const o = svg(id, { pose: x.pose, gesture: x.gesture, outfit }); ok(!/undefined|NaN/.test(o) && new Set(idsOf(o)).size === idsOf(o).length, `ポーズ ${x.id}（${id}・${Object.values(outfit).join("+")}）の id`); }
      ok(svg(id, { dir: "left", gesture: x.gesture }).replace(/u\d+/g, "") === svg(id, { dir: "left" }).replace(/u\d+/g, ""), `ポーズ ${x.id}（${id}）: よこむきは うでの ポーズ なし`);
      // うごいた 手: すくなくとも 1つの 手が もとの ばしょから 14 いじょう うごく
      const moved = [0, 1].map((k) => { const E = R.charaArmEnds(C.PROFILE[id], k), h = handAt(id, x.gesture, k); return Math.hypot(h[0] - E.hand[0], h[1] - E.hand[1]); });
      ok(Math.max(...moved) > 14, `ポーズ ${x.id}（${id}）の 手が うごかない（${moved.map((v) => v.toFixed(1))}）`);
    }
    // 5しゅの ポーズは 手の ばしょが ちがう（2つの 手の ばしょの ちがいが 8 いじょう）
    for (let i = 0; i < gestures.length; i++) for (let j = i + 1; j < gestures.length; j++) {
      const a = [0, 1].map((k) => handAt(id, gestures[i].gesture, k)), b = [0, 1].map((k) => handAt(id, gestures[j].gesture, k));
      ok(Math.max(Math.hypot(a[0][0] - b[0][0], a[0][1] - b[0][1]), Math.hypot(a[1][0] - b[1][0], a[1][1] - b[1][1])) > 8, `${id}: ${gestures[i].id} と ${gestures[j].id} の 手が おなじ`);
    }
    // かおの ボタン 8つは 3人とも ちがう かお（まえは わんこ・がちゃん・ごじ で おなじ かおに なる ボタンが あった）
    const faces = P.FACES.map((f) => svg(id, { face: PP.faceOf(id, f.id) }).replace(/u\d+/g, ""));
    ok(new Set(faces).size === P.FACES.length, `${id}: かおの ボタンで おなじ かおに なる（${P.FACES.filter((f, i) => faces.indexOf(faces[i]) !== i).map((f) => f.id)}）`);
    for (const f of P.FACES) { const s = svg(id, { face: PP.faceOf(id, f.id) }); ok(!/undefined|NaN/.test(s) && new Set(idsOf(s)).size === idsOf(s).length, `かお ${f.id}（${id}）の 絵`); }
  }
  ok(PP.faceOf("wanko", "love") === "pk_heart" && PP.faceOf("gachan", "surprise") === "pk_odoroki" && PP.faceOf("goji", "happy") === "pk_nikori" && PP.faceOf("wanko", "sad") === "sad", "かおの ボタン → 3人の かお");
  // ごじの こぶの 目は よこむきで ずれない（data-anchor="eye"）
  ok(/data-anchor="eye"/.test(svg("goji", { face: "pk_nikori", dir: "left" })), "ごじの こぶの 目");
  // キャッシュの キー: うでの ポーズ・かおは しゅるい だけ（ある ポーズだけ キーに いれる）
  ok(C.key("wanko", { gesture: "peace" }) !== C.key("wanko", {}) && C.key("wanko", { gesture: "nazo" }) === C.key("wanko", {}) && C.key("goji", { face: "pk_nikori" }).includes("pk_nikori"), "キャッシュの キー");
  // しゃしんの ばしょ m: うごかして いなければ なし・はんい・2かい なおしても おなじ・まえの しゃしんは そのまま
  const base = ph();
  ok(!("m" in P.clean(base)) && !("m" in P.clean(ph({ m: { wanko: [0, 0] } }))), "うごかして いない しゃしんに m");
  const mv = P.clean(ph({ m: { wanko: [40, -30], gachan: [999, 999], goji: ["x", 5] } }));
  ok(mv.m && mv.m.wanko.join() === "40,-30" && mv.m.gachan.join() === `${P.MOVE.x},${P.MOVE.down}` && mv.m.goji.join() === "0,5", "3人の ばしょの はんい");
  ok(JSON.stringify(P.clean(P.clean(mv))) === JSON.stringify(mv) && JSON.stringify(P.clean(base)) === JSON.stringify(P.clean(P.clean(base))), "ばしょを 2かい なおしても おなじ");
  // あしもとは しゃしんの 中・したに いる 人ほど まえ
  const pl = A.placed(P.clean(ph({ m: { wanko: [-300, 0], gachan: [0, -100], goji: [0, 30] } })));
  ok(pl.every((q) => q.x >= 24 && q.x <= P.PW - 24) && pl[0].id === "gachan" && pl[pl.length - 1].id === "goji", "あしもとと 描く じゅん");
  ok(A.placed(P.clean(base)).map((q) => q.i).join() === A.LAYOUT[1].order.join(), "うごかして いない ときの じゅんばんは いままでと おなじ");
  // ポーズの ある しゃしん: 3人の 絵は うでの ポーズと かおの ボタンの かお
  const po = A.charaOpts(P.clean(ph({ c: { wanko: ["peace", "love"], gachan: ["nyan", "surprise"], goji: ["heart", "happy"] } })), 1);
  ok(po.gesture === "peace" && po.face === "pk_heart", "しゃしんの 3人の 絵");
}
console.log(`Purikura: 3 booths (ゆめかわ・がっこう・おでかけ) × 6 backgrounds = 18 / 11 poses (5 arm gestures) / 8 faces (all different for the three) / 12 stamps / 8 words + booth words, movable positions, stroke codec, photo repair and limits, 300-coin session paid once and finished once, 60-photo album, old saves and finite art keys — ${n} checks OK`);
