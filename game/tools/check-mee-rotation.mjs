// Meeときょれじゃ の ガチャの しゅうがわり（js/mee-rotation.js・UI-62）の 検査。ブラウザ なしで
// しゅうの ばんごう・4F の しま 6つ（3だい・4シリーズ）と 2F の ガチャ コーナーの 4くみ（UI-63。3だい・5シリーズ〔UI-79 で へいせい じょじ ふうを 1つずつ たした〕）の わ・まいしゅう 1だいずつ いれかわる（ほかの 台は そのまま）・やすみは 4しゅうに 1かい・
// さいしょの しゅうの ならび・館の 台（apply・loadFloor）・NEW の はた（絵と キー）・ガチャの がめんの ふだ・おしらせ・あんないの ことば・セーブ を たしかめる。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Gacha: GA, GachaForest: GF, GachaForestMore: GM, GachaCornerMore: CM, MeeRotation: MR, VenueHalls: VH, ArcadeArt: AA, Save: S } = R;
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
ok(MR.RINGS.length === 10 && rings.length === 6 && rings.map((r) => r.id).join() === GF.ISLES.map((I) => "4f-" + I.id).join(), "4F の しま 6つが わ");
// UI-80: へいせい じょじ ふうの 5シリーズ（js/gacha-heisei-more.js）が 5つの しまの 5ばんめ（まちぼうけの しまは 4シリーズの まま）
const heiseiOf = (I) => (R.GachaHeiseiMore ? R.GachaHeiseiMore.SERIES.find((S) => S.isle === I.id) : null);
ok(GF.ISLES.filter((I) => heiseiOf(I)).map((I) => I.id).join() === "squish,pouch,meji,mini,goods", "へいせいの 5シリーズは まちぼうけ いがいの 5つの しまに 1つずつ");
for (const Rg of rings) {
  const I = GF.ISLES.find((x) => "4f-" + x.id === Rg.id), P = MR.pool(Rg), H = heiseiOf(I), n = H ? 5 : 4;
  ok(Rg.ids.join() === I.ids.join() && Rg.add.length === n - 3 && Rg.add.join() === I.add.join() && P.length === n && new Set(P).size === n && P.every((id) => GA.byId(id) && GA.byId(id).forest), `${Rg.name}: 3だい・${n}シリーズ`);
  ok(P[3] === I.add[0] && P[0] === I.ids[I.rest] && !GA.byId(I.add[0]).heisei, `${Rg.name}: さいしょに やすむのは ${I.ids[I.rest]}`);
  if (H) ok(P[4] === H.id && GA.byId(H.id).heisei && GA.byId(H.id).forest, `${Rg.name}: 5ばんめは へいせい じょじ ふうの ${H.id}（UI-80）`);
  ok(!kanji.test(Rg.name), `${Rg.name}: なまえ`);
}
// 2F の ガチャ コーナーの 4くみ（js/gacha-corner-more.js の RINGS・UI-63）
const rings2 = MR.RINGS.filter((r) => r.floor === 2), ALL = [...rings, ...rings2];
const src = (Rg) => (Rg.floor === 4 ? GF.ISLES.find((x) => "4f-" + x.id === Rg.id) : CM.RINGS.find((c) => c.id === Rg.id));
ok(rings2.length === 4 && rings2.map((r) => r.id).join() === CM.RINGS.map((c) => c.id).join() && MR.RINGS.every((r) => r.floor === 2 || r.floor === 4), "2F の ガチャ コーナーの 4くみが わ（ほかの 階は ない）");
for (const Rg of rings2) {
  const C = src(Rg), P = MR.pool(Rg);
  ok(Rg.ids.join() === C.ids.join() && Rg.add.join() === C.add.join() && Rg.add.length === 2 && P.length === 5 && new Set(P).size === 5 && P.every((id) => GA.byId(id) && !GA.byId(id).forest && !GA.byId(id).sticker) && Rg.from === 1, `${Rg.name}: 3だい・5シリーズ（2F の シリーズ）`);
  ok(P[3] === C.add[0] && P[0] === C.ids[C.rest] && GA.byId(C.add[0]).corner, `${Rg.name}: さいしょに やすむのは ${C.ids[C.rest]}・あたらしいのは ${C.add[0]}`);
  ok(P[4] === C.add[1] && GA.byId(C.add[1]).heisei && !GA.byId(C.add[1]).forest, `${Rg.name}: 5ばんめは へいせい じょじ ふうの ${C.add[1]}（UI-79）`);
  ok(!kanji.test(Rg.name), `${Rg.name}: なまえ`);
}
ok(new Set(ALL.flatMap((Rg) => MR.pool(Rg))).size === ALL.reduce((a, Rg) => a + MR.pool(Rg).length, 0), "おなじ シリーズは 2つの わに はいらない");
// ---- 3. まいしゅうの ならび ----
const W0 = -12, W1 = 80;
for (const Rg of ALL) {
  const P = MR.pool(Rg), lines = {};
  for (let w = W0; w <= W1; w++) {
    const L = MR.lineup(Rg, w); lines[w] = L;
    ok(L.length === 3 && L.map((x) => x.slot).join() === "0,1,2" && new Set(L.map((x) => x.id)).size === 3 && L.every((x) => P.includes(x.id) && x.si === GA.byId(x.id).index), `${Rg.name} ${w}しゅう: 3だいに ちがう シリーズ`);
    ok(L.filter((x) => x.fresh).length === (w >= 1 ? 1 : 0) && L.filter((x) => x.leaving).length === 1, `${Rg.name} ${w}しゅう: NEW は 1つ（0しゅう までは なし）・らいしゅう やすむのは 1つ`);
    ok(L.filter((x) => x.debut).length === (w >= 1 && w <= P.length - 3 ? 1 : 0) && L.every((x) => !x.debut || (x.fresh && Rg.add.includes(x.id))), `${Rg.name} ${w}しゅう: はじめて はいるのは あたらしい シリーズ（1しゅうめ・5シリーズの わは 2しゅうめも）だけ`);
    ok(MR.resting(Rg, w).length === P.length - 3 && !L.some((x) => MR.resting(Rg, w).includes(x.id)), `${Rg.name} ${w}しゅう: やすみは ${P.length - 3}シリーズ`);
  }
  // 0しゅう まえは さいしょの ならび（ids の とおり）
  for (let w = W0; w <= 0; w++) ok(lines[w].map((x) => x.id).join() === Rg.ids.join(), `${Rg.name} ${w}しゅう: さいしょの ならび`);
  // 1しゅうごとに 1だい だけ いれかわる・いれかわった 台は まえの しゅうの「らいしゅう やすむ」・あたらしいのは NEW
  for (let w = 0; w < W1; w++) {
    const a = lines[w], b = lines[w + 1], ch = [0, 1, 2].filter((k) => a[k].id !== b[k].id);
    ok(ch.length === 1 && a[ch[0]].leaving && b[ch[0]].fresh && !a.some((x) => x.id === b[ch[0]].id), `${Rg.name} ${w}→${w + 1}しゅう: 1だい だけ いれかわる（ほかは おなじ 台の まま）`);
  }
  // どの シリーズも L しゅう（わの シリーズの かず）の うち 3しゅう でる・ずっと やすむ シリーズは ない
  for (let w = 1; w + P.length - 1 <= W1; w++) for (const id of P) ok([...Array(P.length).keys()].filter((d) => lines[w + d].some((x) => x.id === id)).length === 3, `${Rg.name}: ${id} は ${P.length}しゅうに 3しゅう でる（${w}しゅう から）`);
  // さいしょの いれかえ（1しゅうめ）: やすむ 台に あたらしい シリーズ・のこりの 2だいは おなじ ばしょ
  const I = src(Rg), L1 = lines[1];
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
// 2F の ガチャ コーナー（12だい・くみごとに 3だい。UI-63）
const f2 = VH.defs.arcade.floors[2], g2 = () => f2.fixtures.filter((f) => f.kind === "gacha" && f.ring);
ok(g2().length === 12 && f2.fixtures.filter((f) => f.kind === "gacha").length === 12 && rings2.every((Rg) => [0, 1, 2].every((k) => g2().filter((f) => f.ring === Rg.id && f.slot === k).length === 1)), "2F の 12だいは くみ 4つ × 3だい");
ok(["2f-a", "2f-b"].every((id) => g2().filter((f) => f.ring === id).every((f) => f.y === 6)) && ["2f-c", "2f-d"].every((id) => g2().filter((f) => f.ring === id).every((f) => f.y === 9)) && g2().every((f) => f.x === [9, 10, 11, 14, 15, 16][(["2f-a", "2f-c"].includes(f.ring) ? 0 : 3) + f.slot]), "くみは おくの れつ・てまえの れつの ひだり・みぎ（slot は ひだりから）");
ok(g2().find((f) => f.label === "カプセルトイ").ring === "2f-a" && g2().find((f) => f.label === "カプセルトイ").slot === 0 && g2().find((f) => f.label === "アクセサリー").ring === "2f-d" && g2().find((f) => f.label === "アクセサリー").slot === 0 && MR.pool(rings2[3]).every((id) => GA.byId(id).acc), "ふだ: カプセルトイ（おく ひだりの はじ）・アクセサリー（てまえ みぎの はじ・くみは ぜんぶ アクセサリー）");
for (const day of ["2026-9-24", "2026-9-28", "2026-10-5", "2026-10-12", "2026-10-19", "2026-12-24", "2027-3-1"]) {
  const w = MR.apply(day), list = g2();
  ok(new Set(list.map((f) => f.series)).size === 12 && list.every((f) => f.variant === f.series && f.action === "gacha"), `${day}: 2F の 12だいに ちがう シリーズ`);
  for (const Rg of rings2) for (const it of MR.lineup(Rg, w)) {
    const f = list.find((q) => q.ring === Rg.id && q.slot === it.slot);
    ok(f && f.series === it.si && !!f.fresh === it.fresh && !!f.leaving === it.leaving, `${day}: ${Rg.name} の ${it.slot}ばんの 台`);
  }
  ok(list.filter((f) => f.fresh).length === (w >= 1 ? 4 : 0), `${day}: 2F の NEW は くみごとに 1だい`);
}
MR.apply("2026-9-24"); ok(g2().map((f) => f.series).sort((a, b) => a - b).join() === "0,1,2,3,4,5,6,7,8,9,10,11", "さいしょの しゅう（2026-09-21〜）の 2F は まえと おなじ 12シリーズ");
ok(![1, 3].some((k) => VH.defs.arcade.floors[k].fixtures.some((f) => f.ring)), "1F・3F の 台は わに はいって いない");
// ---- 5. 館に はいる・かいを うつる（VenueScene.prototype.loadFloor）----
{
  R.Seasonal.override = new Date(2026, 9, 12, 12); // 3しゅうめ
  const sc = Object.create(R.VenueScene.prototype); Object.assign(sc, { def: VH.defs.arcade, id: "arcade", cancel() {}, snap() {} });
  sc.loadFloor(4);
  const w = MR.week(), want = rings.flatMap((Rg) => MR.lineup(Rg, w).map((x) => Rg.id + ":" + x.slot + ":" + x.si)).sort().join();
  ok(w === 3 && sc.fixtures.filter((f) => f.ring).map((f) => f.ring + ":" + f.slot + ":" + f.series).sort().join() === want && sc.fixtures !== f4.fixtures, "4F に はいると その しゅうの ならび（へやの 台は コピー）");
  R.Seasonal.override = new Date(2026, 9, 20, 12); sc.loadFloor(3); sc.loadFloor(4);
  ok(sc.fixtures.filter((f) => f.ring).map((f) => f.ring + ":" + f.slot + ":" + f.series).sort().join() === rings.flatMap((Rg) => MR.lineup(Rg, 4).map((x) => Rg.id + ":" + x.slot + ":" + x.si)).sort().join(), "かいを うつると あたらしい しゅうの ならび");
  sc.loadFloor(2);
  ok(sc.fixtures.filter((f) => f.ring).map((f) => f.ring + ":" + f.slot + ":" + f.series).sort().join() === rings2.flatMap((Rg) => MR.lineup(Rg, 4).map((x) => Rg.id + ":" + x.slot + ":" + x.si)).sort().join() && sc.fixtures !== f2.fixtures, "2F に はいると その しゅうの ならび");
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
  ok(keys.size <= 29 * 2, "台の 絵の キーは シリーズ（29: もりの 24・UI-80 の へいせい 5）× NEW の ある・なし だけ " + keys.size);
  const keys2 = new Set(); for (let w = -2; w <= 60; w++) { MR.apply(MR.monday(w)); for (const f of g2()) keys2.add(AA.modelKey(f)); }
  ok(keys2.size <= 20 * 2 && [...keys2].some((k) => k.endsWith(":new")), "2F の 台の キーも シリーズ（20: もとの 12・UI-63 の 4・UI-79 の へいせい 4）× NEW だけ " + keys2.size);
}
// ---- 7. ガチャの がめんの ふだ（Gacha.tagOf）----
{
  at(2026, 10, 5); const w = MR.week(), L = ALL.flatMap((Rg) => MR.lineup(Rg, w));
  ok(typeof GA.tagOf === "function", "Gacha.tagOf");
  for (const x of L) ok(GA.tagOf(x.si) === (x.debut ? "NEW！ あたらしい ガチャ" : x.fresh ? "NEW！ また きた ガチャ" : x.leaving ? "らいしゅうは おやすみ" : ""), `ふだ ${x.id}`);
  // 1しゅうめは あたらしい 6シリーズが「はじめて」・5しゅうめに もどって きた ときは「また」
  at(2026, 10, 1); for (const S2 of [...GM.SERIES, ...CM.SERIES]) ok(GA.tagOf(S2.index) === "NEW！ あたらしい ガチャ", `1しゅうめの ${S2.id} は はじめて`);
  // L シリーズの わでは 1+L しゅうめに また（へいせい の 5ばんめが ある しまは 6しゅうめ・まちぼうけの しまは 5しゅうめ）
  const atMonday = (w) => { const [y, m, d] = MR.monday(w).split("-").map(Number); at(y, m, d); };
  for (const S2 of GM.SERIES) { const L = MR.pool(ALL.find((Rg) => MR.pool(Rg).includes(S2.id))).length; atMonday(1 + L); ok(GA.tagOf(S2.index) === "NEW！ また きた ガチャ", `${1 + L}しゅうめの ${S2.id} は また`); atMonday(L); ok(GA.tagOf(S2.index) !== "NEW！ また きた ガチャ", `${L}しゅうめの ${S2.id} は まだ`); }
  // 4F の へいせい じょじ ふうの 5シリーズ（UI-80）: 2しゅうめに はじめて → 7しゅうめに また
  if (R.GachaHeiseiMore) { atMonday(2); for (const S2 of R.GachaHeiseiMore.SERIES) ok(GA.tagOf(S2.index) === "NEW！ あたらしい ガチャ", `2しゅうめの ${S2.id} は はじめて`); atMonday(7); for (const S2 of R.GachaHeiseiMore.SERIES) ok(GA.tagOf(S2.index) === "NEW！ また きた ガチャ", `7しゅうめの ${S2.id} は また`); }
  // 2F の くみは 5シリーズ（UI-79）: UI-63 の 4つは 6しゅうめに また・へいせい の 4つは 2しゅうめに はじめて → 7しゅうめに また
  at(2026, 11, 2); for (const S2 of CM.SERIES) ok(GA.tagOf(S2.index) === "NEW！ また きた ガチャ", `6しゅうめの ${S2.id} は また`);
  at(2026, 10, 5); for (const S2 of R.GachaHeisei.SERIES) ok(GA.tagOf(S2.index) === "NEW！ あたらしい ガチャ", `2しゅうめの ${S2.id} は はじめて`);
  at(2026, 11, 9); for (const S2 of R.GachaHeisei.SERIES) ok(GA.tagOf(S2.index) === "NEW！ また きた ガチャ", `7しゅうめの ${S2.id} は また`);
  at(2026, 10, 5);
  for (const id of ALL.flatMap((Rg) => MR.resting(Rg, w))) ok(GA.tagOf(GA.byId(id).index) === "", `やすみの シリーズ ${id} の ふだは なし`);
  ok(GA.tagOf(30) === "" && GA.tagOf(31) === "" && GA.tagOf(0) === "らいしゅうは おやすみ", "シールの 台は ふだ なし・2F の 台にも ふだ");
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
  at(2026, 11, 3); const sc3 = { floor: 2, closed: false }; R.G.scene = sc3; MR.notice(sc3); await wait(); ok(S.d.gacha.week === 6 && toasts.length === 2 && /いれかわったよ/.test(toasts[1]), "2F でも おしらせ（UI-63）");
  const sc4 = { floor: 4, closed: false }; R.G.scene = sc4; MR.notice(sc4); await wait(); ok(toasts.length === 2, "おなじ しゅうに 4F へ いっても 2かいめは なし");
}
// ---- 9. あんない・ことば ----
{
  const dir = f4.fixtures.find((f) => f.kind === "directory");
  ok(dir && /まいしゅう げつようびに しまごとに 1だいずつ いれかわる/.test(dir.text) && /NEW の はた/.test(dir.text) && !kanji.test(dir.text) && (dir.text.match(/いれかわる/g) || []).length === 1, "もりの あんないに いれかえの こと（1かい だけ）");
  // 2F の かんばん・1F の あんない（こんしゅうの NEW・らいしゅう やすむ・つぎの いれかえの 日・きせつの ぬいぐるみ）
  for (const day of ["2026-10-5", "2026-12-1", "2027-4-12", "2026-9-23"]) {
    const w = MR.apply(day), F = VH.defs.arcade.floors, b2 = F[2].fixtures.find((f) => f.rotInfo === 2), d1 = F[1].fixtures.find((f) => f.kind === "directory"), d4 = F[4].fixtures.find((f) => f.kind === "directory");
    const L = rings2.flatMap((Rg) => MR.lineup(Rg, w)), nm = (x) => GA.SERIES[x.si].name, next = MR.md(MR.monday(w + 1));
    ok(b2 && b2.kind === "gachaboard" && b2.action === "info" && b2.label === "ガチャ コーナー" && b2.text.startsWith(b2.baseText) && L.filter((x) => x.fresh).every((x) => b2.text.includes(nm(x))) && L.filter((x) => x.leaving).every((x) => b2.text.includes(nm(x))) && b2.text.includes(`つぎの いれかえは ${next}`) && (w >= 1) === /こんしゅうの NEW/.test(b2.text) && !kanji.test(b2.text), `${day}: 2F の かんばんの おしらせ`);
    const se = ["wanko", "gachan", "goji"].map((who) => R.ArcadePrizes.seasonal(who, day));
    ok(d1.rotInfo === 1 && d1.text.startsWith(d1.baseText) && /Meeときょれじゃ の あんない/.test(d1.text) && d1.text.includes(`つぎの いれかえは ${next}`) && se.every((it) => it && d1.text.includes(it.name.replace(/の ぬいぐるみ$/, ""))) && !kanji.test(d1.text) && d1.text.split("\n").length === d1.baseText.split("\n").length + 2, `${day}: 1F の あんないに しゅうがわり・きせつの ぬいぐるみ`);
    ok(d4.rotInfo === 4 && d4.text.startsWith(d4.baseText) && d4.text.endsWith(`つぎの いれかえは ${next}（げつようび）。`) && (d4.text.match(/いれかわる/g) || []).length === 1, `${day}: 4F の あんないに つぎの いれかえの 日`);
  }
  ok(MR.md("2026-10-12") === "10がつ 12にち" && MR.md("2027-1-4") === "1がつ 4にち", "日づけの よみかた");
  MR.apply();
  for (const f of ["../js/mee-rotation.js", "../js/gacha-forest-more.js", "../js/gacha-corner-more.js"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん しない`);
  }
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const ix = (s, k) => s.indexOf(k);
  ok(ix(html, "js/sticker-book.js") < ix(html, "js/gacha-forest-more.js") && ix(html, "js/gacha-forest-more.js") < ix(html, "js/gacha-corner-more.js") && ix(html, "js/gacha-corner-more.js") < ix(html, "js/mee-rotation.js") && ix(html, "js/mee-rotation.js") < ix(html, "js/debug.js") && sw.includes('"./js/gacha-forest-more.js"') && sw.includes('"./js/gacha-corner-more.js"') && sw.includes('"./js/mee-rotation.js"'), "index.html・sw.js に とうろく（sticker-book.js の あと・gacha-corner-more.js は mee-rotation.js の まえ）");
}
// ---- 10. PokaDebug ----
{
  at(2026, 10, 5); const D = R.PokaDebug, i = D.meeRotation("2026-10-5"), j = D.meeRotation();
  ok(i && i.week === 2 && i.rings.length === MR.RINGS.length && i.rings.every((r) => r.slots.length === 3 && r.resting.length === r.pool.length - 3 && r.slots.every((x) => x.name && x.id)) && j.week === 2, "PokaDebug.meeRotation");
  ok(typeof D.gachaVisit === "function" && D.gachaVisit("machi3") === false, "PokaDebug.gachaVisit（館の そとでは false）");
  const gf = D.gachaForest(); ok(gf.series.length === 24 && gf.series.filter((s) => s.more).length === 6 && gf.machines.length === 18, "PokaDebug.gachaForest（24シリーズ・台は 18）");
}
R.Seasonal.override = null; MR.apply();
console.log(`Mee rotation: weeks from Monday 2026-09-21, six 4F island rings (3 machines, 4 series; 5 with the Heisei ones on five islands, UI-80) and four 2F corner rings (3 machines, 5 series with the Heisei ones), exactly one machine swaps each Monday (others stay put), every series out 3 of L weeks, first swap puts the new series in the resting slot, apply/loadFloor use this week's line-up, NEW flag (art + finite keys), gacha screen tags, arrival notice + save (gacha.week), 2F board / 1F and 4F directory texts, files registered, PokaDebug — ${n} checks OK`);
