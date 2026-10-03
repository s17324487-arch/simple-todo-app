// Meeときょれじゃ の ガチャの しゅうがわり（js/mee-rotation.js・UI-62）の 検査。ブラウザ なしで
// しゅうの ばんごう・4F の しま 6つの わ（3だい・4シリーズ）・まいしゅう 1だいずつ いれかわる（ほかの 台は そのまま）・やすみは 4しゅうに 1かい・
// さいしょの しゅうの ならび・館の 台（apply・loadFloor）・NEW の はた（絵と キー）・ガチャの がめんの ふだ・おしらせ・セーブ を たしかめる。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Gacha: GA, GachaForest: GF, GachaForestMore: GM, MeeRotation: MR, VenueHalls: VH, ArcadeArt: AA, Save: S } = R;
const toasts = []; R.UI.updateHud = () => {}; R.UI.toast = (m) => toasts.push(m);
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const at = (y, m, d) => { R.Seasonal.override = new Date(y, m - 1, d, 12); return `${y}-${m}-${d}`; };
S.d = S.fresh();

// ---- 1. しゅうの ばんごう（2026-09-21 げつようび から）----
ok(MR.EPOCH === "2026-9-21" && new Date(2026, 8, 21).getDay() === 1, "はじまりは げつようび");
ok(MR.week("2026-9-21") === 0 && MR.week("2026-9-27") === 0 && MR.week("2026-9-28") === 1 && MR.week("2026-10-4") === 1 && MR.week("2026-10-5") === 2 && MR.week("2026-9-20") === -1 && MR.week("2027-1-4") === 15, "しゅうの ばんごう（げつようびで かわる）");
ok(MR.monday(1) === "2026-9-28" && MR.monday(2) === "2026-10-5" && MR.monday(15) === "2027-1-4", "その しゅうの げつようび");
at(2026, 10, 5); ok(MR.week() === 2 && MR.info().week === 2 && MR.info().monday === "2026-10-5" && MR.info().next === "2026-10-12", "きょうの しゅう（Seasonal.override・PokaDebug.calendar）");
at(2026, 10, 3); ok(MR.week() === 1, "2026-10-03 は 1しゅうめ");

// ---- 2. わ（4F の しま 6つ）----
const rings = MR.RINGS.filter((r) => r.floor === 4);
ok(MR.RINGS.length >= 6 && rings.length === 6 && rings.map((r) => r.id).join() === GF.ISLES.map((I) => "4f-" + I.id).join(), "4F の しま 6つが わ");
for (const Rg of rings) {
  const I = GF.ISLES.find((x) => "4f-" + x.id === Rg.id), P = MR.pool(Rg);
  ok(Rg.ids.join() === I.ids.join() && Rg.add.length === 1 && Rg.add[0] === I.add[0] && P.length === 4 && new Set(P).size === 4 && P.every((id) => GA.byId(id) && GA.byId(id).forest), `${Rg.name}: 3だい・4シリーズ`);
  ok(P[3] === I.add[0] && P[0] === I.ids[I.rest], `${Rg.name}: さいしょに やすむのは ${I.ids[I.rest]}`);
  ok(!kanji.test(Rg.name), `${Rg.name}: なまえ`);
}
// ---- 3. まいしゅうの ならび ----
const W0 = -12, W1 = 80;
for (const Rg of rings) {
  const P = MR.pool(Rg), lines = {};
  for (let w = W0; w <= W1; w++) {
    const L = MR.lineup(Rg, w); lines[w] = L;
    ok(L.length === 3 && L.map((x) => x.slot).join() === "0,1,2" && new Set(L.map((x) => x.id)).size === 3 && L.every((x) => P.includes(x.id) && x.si === GA.byId(x.id).index), `${Rg.name} ${w}しゅう: 3だいに ちがう シリーズ`);
    ok(L.filter((x) => x.fresh).length === (w >= 1 ? 1 : 0) && L.filter((x) => x.leaving).length === 1, `${Rg.name} ${w}しゅう: NEW は 1つ（0しゅう までは なし）・らいしゅう やすむのは 1つ`);
    ok(L.filter((x) => x.debut).length === (w === 1 ? 1 : 0) && L.every((x) => !x.debut || (x.fresh && Rg.add.includes(x.id))), `${Rg.name} ${w}しゅう: はじめて はいるのは 1しゅうめの あたらしい シリーズ だけ`);
    ok(MR.resting(Rg, w).length === 1 && !L.some((x) => x.id === MR.resting(Rg, w)[0]), `${Rg.name} ${w}しゅう: やすみは 1シリーズ`);
  }
  // 0しゅう まえは さいしょの ならび（ids の とおり）
  for (let w = W0; w <= 0; w++) ok(lines[w].map((x) => x.id).join() === Rg.ids.join(), `${Rg.name} ${w}しゅう: さいしょの ならび`);
  // 1しゅうごとに 1だい だけ いれかわる・いれかわった 台は まえの しゅうの「らいしゅう やすむ」・あたらしいのは NEW
  for (let w = 0; w < W1; w++) {
    const a = lines[w], b = lines[w + 1], ch = [0, 1, 2].filter((k) => a[k].id !== b[k].id);
    ok(ch.length === 1 && a[ch[0]].leaving && b[ch[0]].fresh && !a.some((x) => x.id === b[ch[0]].id), `${Rg.name} ${w}→${w + 1}しゅう: 1だい だけ いれかわる（ほかは おなじ 台の まま）`);
  }
  // どの シリーズも 4しゅうの うち 3しゅう でる（やすみは 1しゅう）・ずっと やすむ シリーズは ない
  for (let w = 1; w + 3 <= W1; w++) for (const id of P) ok([0, 1, 2, 3].filter((d) => lines[w + d].some((x) => x.id === id)).length === 3, `${Rg.name}: ${id} は 4しゅうに 3しゅう でる（${w}しゅう から）`);
  // さいしょの いれかえ（1しゅうめ）: やすむ 台に あたらしい シリーズ・のこりの 2だいは おなじ ばしょ
  const I = GF.ISLES.find((x) => "4f-" + x.id === Rg.id), L1 = lines[1];
  ok(L1[I.rest].id === I.add[0] && L1[I.rest].fresh && [0, 1, 2].filter((k) => k !== I.rest).every((k) => L1[k].id === I.ids[k] && !L1[k].fresh), `${Rg.name}: 1しゅうめは ${I.ids[I.rest]} の 台に ${I.add[0]}`);
}
// ---- 4. 館の 台（apply）----
const f4 = VH.defs.arcade.floors[4], g4 = () => f4.fixtures.filter((f) => f.kind === "gacha" && f.ring);
for (const day of ["2026-9-24", "2026-9-28", "2026-10-5", "2026-10-12", "2026-10-19", "2026-12-24", "2027-3-1"]) {
  const w = MR.apply(day), list = g4();
  ok(w === MR.week(day) && list.length === 18 && new Set(list.map((f) => f.series)).size === 18, `${day}: 4F の 18だいに ちがう シリーズ`);
  for (const Rg of rings) for (const it of MR.lineup(Rg, w)) {
    const f = list.find((q) => q.ring === Rg.id && q.slot === it.slot);
    ok(f && f.series === it.si && f.variant === it.si && !!f.fresh === it.fresh && !!f.leaving === it.leaving && f.action === "gacha", `${day}: ${Rg.name} の ${it.slot}ばんの 台`);
  }
  ok(list.filter((f) => f.fresh).length === (w >= 1 ? 6 : 0), `${day}: NEW の 台は しまごとに 1だい`);
  const sticker = f4.fixtures.filter((f) => f.kind === "gacha" && !f.ring);
  ok(sticker.length === 3 && sticker.every((f) => GA.SERIES[f.series].kind === "sticker" && !f.fresh), `${day}: シールの 台は かわらない`);
}
// ほかの 階の ガチャ（2F）は この しくみで かわらない（N2b まで）
ok(![1, 2, 3].some((k) => VH.defs.arcade.floors[k].fixtures.some((f) => f.ring)), "4F いがいの 台は わに はいって いない");
// ---- 5. 館に はいる・かいを うつる（VenueScene.prototype.loadFloor）----
{
  R.Seasonal.override = new Date(2026, 9, 12, 12); // 3しゅうめ
  const sc = Object.create(R.VenueScene.prototype); Object.assign(sc, { def: VH.defs.arcade, id: "arcade", cancel() {}, snap() {} });
  sc.loadFloor(4);
  const w = MR.week(), want = rings.flatMap((Rg) => MR.lineup(Rg, w).map((x) => Rg.id + ":" + x.slot + ":" + x.si)).sort().join();
  ok(w === 3 && sc.fixtures.filter((f) => f.ring).map((f) => f.ring + ":" + f.slot + ":" + f.series).sort().join() === want && sc.fixtures !== f4.fixtures, "4F に はいると その しゅうの ならび（へやの 台は コピー）");
  R.Seasonal.override = new Date(2026, 9, 20, 12); sc.loadFloor(3); sc.loadFloor(4);
  ok(sc.fixtures.filter((f) => f.ring).map((f) => f.ring + ":" + f.slot + ":" + f.series).sort().join() === rings.flatMap((Rg) => MR.lineup(Rg, 4).map((x) => Rg.id + ":" + x.slot + ":" + x.si)).sort().join(), "かいを うつると あたらしい しゅうの ならび");
  const other = Object.create(R.VenueScene.prototype); Object.assign(other, { def: VH.defs.mall, cancel() {}, snap() {} });
  ok(VH.defs.mall && (() => { other.loadFloor(1); return true; })(), "ほかの 館の loadFloor は そのまま");
}
// ---- 6. NEW の はた（館の 台の 絵）と キー ----
{
  MR.apply("2026-10-5");
  const fr = g4().find((f) => f.fresh), st = g4().find((f) => !f.fresh);
  const a = AA.model(fr), b = AA.model(st);
  ok(a && a.svg.includes(">NEW<") && !b.svg.includes(">NEW<") && AA.modelKey(fr).endsWith(":new") && !AA.modelKey(st).endsWith(":new"), "NEW の 台だけ はた・キーに :new");
  ok(!/NaN|undefined/.test(a.svg) && a.vb.h >= b.vb.h, "NEW の はたが 絵の はんいに はいる");
  const keys = new Set();
  for (let w = -2; w <= 60; w++) { MR.apply(MR.monday(w)); for (const f of g4()) keys.add(AA.modelKey(f)); }
  ok(keys.size <= 24 * 2, "台の 絵の キーは シリーズ × NEW の ある・なし だけ " + keys.size);
}
// ---- 7. ガチャの がめんの ふだ（Gacha.tagOf）----
{
  at(2026, 10, 5); const w = MR.week(), L = rings.flatMap((Rg) => MR.lineup(Rg, w));
  ok(typeof GA.tagOf === "function", "Gacha.tagOf");
  for (const x of L) ok(GA.tagOf(x.si) === (x.debut ? "NEW！ あたらしい ガチャ" : x.fresh ? "NEW！ また きた ガチャ" : x.leaving ? "らいしゅうは おやすみ" : ""), `ふだ ${x.id}`);
  // 1しゅうめは あたらしい 6シリーズが「はじめて」・5しゅうめに もどって きた ときは「また」
  at(2026, 10, 1); for (const S2 of GM.SERIES) ok(GA.tagOf(S2.index) === "NEW！ あたらしい ガチャ", `1しゅうめの ${S2.id} は はじめて`);
  at(2026, 10, 26); for (const S2 of GM.SERIES) ok(GA.tagOf(S2.index) === "NEW！ また きた ガチャ", `5しゅうめの ${S2.id} は また`);
  at(2026, 10, 5);
  for (const id of rings.flatMap((Rg) => MR.resting(Rg, w))) ok(GA.tagOf(GA.byId(id).index) === "", `やすみの シリーズ ${id} の ふだは なし`);
  ok(GA.tagOf(0) === "" && GA.tagOf(30) === "", "2F・シールの 台は ふだ なし");
  const src = readFileSync(new URL("../js/gacha.js", import.meta.url), "utf8");
  ok(/this\.tagOf \? this\.tagOf\(si\)/.test(src) && /gacha-week/.test(src), "ガチャの がめんに ふだ");
  const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
  ok(/\.gacha-week\{/.test(css) && /\.gacha-week\.new\{/.test(css), "ふだの いろ（css）");
}
// ---- 8. おしらせ（4F に きた とき）・セーブ ----
{
  ok(S.fresh().gacha.week === 0, "Save.fresh の gacha.week は 0");
  const old = S.migrate({ ...S.fresh(), gacha: { plays: 3, got: { gacha_friends_0: 1 }, done: {} } });
  ok(old.gacha.week === 0 && old.gacha.plays === 3 && old.gacha.got.gacha_friends_0 === 1, "ふるい セーブに gacha.week が たされる（まえの きろくは そのまま）");
  S.d = S.fresh(); at(2026, 10, 5);
  const sc = { floor: 4, closed: false }; R.G.scene = sc;
  const wait = () => new Promise((r) => setTimeout(r, 1000));
  toasts.length = 0; MR.notice(sc); await wait();
  ok(S.d.gacha.week === 2 && toasts.length === 0, "はじめて 4F に きた ときは きろく だけ");
  MR.notice(sc); await wait(); ok(toasts.length === 0, "おなじ しゅうは おしらせ なし");
  at(2026, 10, 13); MR.notice(sc); await wait();
  ok(S.d.gacha.week === 3 && toasts.length === 1 && /いれかわったよ/.test(toasts[0]) && !kanji.test(toasts[0]), "しゅうが かわって いたら おしらせ");
  at(2026, 10, 20); MR.notice({ floor: 3, closed: false }); await wait(); ok(S.d.gacha.week === 3 && toasts.length === 1, "4F いがいでは おしらせ しない");
  at(2026, 10, 27); const sc2 = { floor: 4, closed: false }; R.G.scene = null; MR.notice(sc2); await wait(); ok(S.d.gacha.week === 5 && toasts.length === 1, "館を でて いたら おしらせ しない");
}
// ---- 9. あんない・ことば ----
{
  const dir = f4.fixtures.find((f) => f.kind === "directory");
  ok(dir && /まいしゅう げつようびに しまごとに 1だいずつ いれかわる/.test(dir.text) && /NEW の はた/.test(dir.text) && !kanji.test(dir.text) && (dir.text.match(/いれかわる/g) || []).length === 1, "もりの あんないに いれかえの こと（1かい だけ）");
  for (const f of ["../js/mee-rotation.js", "../js/gacha-forest-more.js"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん しない`);
  }
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const ix = (s, k) => s.indexOf(k);
  ok(ix(html, "js/sticker-book.js") < ix(html, "js/gacha-forest-more.js") && ix(html, "js/gacha-forest-more.js") < ix(html, "js/mee-rotation.js") && ix(html, "js/mee-rotation.js") < ix(html, "js/debug.js") && sw.includes('"./js/gacha-forest-more.js"') && sw.includes('"./js/mee-rotation.js"'), "index.html・sw.js に とうろく（sticker-book.js の あと）");
}
// ---- 10. PokaDebug ----
{
  at(2026, 10, 5); const D = R.PokaDebug, i = D.meeRotation("2026-10-5"), j = D.meeRotation();
  ok(i && i.week === 2 && i.rings.length === MR.RINGS.length && i.rings.every((r) => r.slots.length === r.pool.length - 1 && r.resting.length === 1 && r.slots.every((x) => x.name && x.id)) && j.week === 2, "PokaDebug.meeRotation");
  ok(typeof D.gachaVisit === "function" && D.gachaVisit("machi3") === false, "PokaDebug.gachaVisit（館の そとでは false）");
  const gf = D.gachaForest(); ok(gf.series.length === 24 && gf.series.filter((s) => s.more).length === 6 && gf.machines.length === 18, "PokaDebug.gachaForest（24シリーズ・台は 18）");
}
R.Seasonal.override = null; MR.apply();
console.log(`Mee rotation: weeks from Monday 2026-09-21, six 4F island rings (3 machines, 4 series), exactly one machine swaps each Monday (others stay put), every series out 3 of 4 weeks, first swap puts the new series in the resting slot, apply/loadFloor use this week's line-up, NEW flag (art + finite keys), gacha screen tags, arrival notice + save (gacha.week), directory text, files registered, PokaDebug — ${n} checks OK`);
