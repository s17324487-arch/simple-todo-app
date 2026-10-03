// UI-58: ネリカス でんき 10F の けいば ちゅうけい コーナー（js/keiba-*.js）の 検査。ブラウザ なしで
// ばけんの きまり（しきべつ 8しゅ・はらいもどし りつ・わくばん・ふくしょう 2ちゃく まで・わくれん 9とう いじょう・10コイン みまん きりすて・プラス10・とくべつ ばらい・ふくしょうの しき）・
// ハービルの たしかさ・ばんぐみ・うまの なまえ・きまった けっか・はしりかた（もどらない・ゴールの じゅんばん）・ほんものに にた かず（1ばん にんき・3ちゃく いない・もどり）・
// かう／しめきる／うけとる／つぎの 日・セーブ・10F の 配置・絵・ことば
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const C = gameContext();
const { KeibaRules: R, KeibaRace: K, KeibaArt: A, KeibaCorner: KC, KeibaUI: KU, Save: S } = C;
C.UI.updateHud = () => {}; C.UI.toast = () => {};
S.d = S.fresh();
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const comb = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = (r * (a - i)) / (i + 1); return r; };

// ---- 1. しきべつ・りつ ----
ok(R.IDS.join() === "tan,fuku,waku,umaren,wide,umatan,trio,tierce", "しきべつ 8しゅ（WIN5 は つかわない）");
ok(R.IDS.map((t) => R.BY[t].rate).join() === "800,800,775,775,775,750,750,725", "はらいもどし りつ（80・80・77.5・77.5・77.5・75・75・72.5%）");
ok(R.TYPES.every((t) => t.name && !kanji.test(t.name) && t.desc && !kanji.test(t.desc)), "しきべつの なまえと せつめいは かな");
ok(R.UNIT === 100, "1まい 100コイン");
// ---- 2. わくばん（8とう いかは わく = うまばん・9とう いじょうは そとの わくから 2とう・17・18とうは 3とう）----
for (let k = 5; k <= 18; k++) {
  const w = R.wakuOf(k), c = R.wakuCounts(k);
  ok(w.length === k + 1 && w.slice(1).every((v, i, a) => v >= 1 && v <= 8 && (i === 0 || v >= a[i - 1])) && c.reduce((a, b) => a + b, 0) === k, `${k}とう: わくばんの ならび`);
  if (k <= 8) ok(w.slice(1).every((v, i) => v === i + 1), `${k}とう: わく = うまばん`);
  else ok(c.slice(1).every((v, i) => v === Math.floor(k / 8) + (i + 1 > 8 - (k % 8) ? 1 : 0)), `${k}とう: そとの わくから おおく`);
}
ok(R.wakuOf(10).slice(1).join() === "1,2,3,4,5,6,7,7,8,8" && R.wakuOf(16).filter((v) => v === 8).length === 2 && R.wakuCounts(17)[8] === 3 && R.wakuCounts(18)[7] === 3 && R.wakuCounts(18)[8] === 3 && R.wakuCounts(18)[6] === 2, "10・16・17・18とうの わく");
// ---- 3. うる／うらない・ふくしょうの ちゃく ----
ok(R.places(7) === 2 && R.places(8) === 3 && R.places(5) === 2, "ふくしょうは 7とう いかで 2ちゃく まで");
ok(R.sold("waku", 8) && !R.sold("waku", 9) && R.sold("fuku", 4) && !R.sold("fuku", 5) && !R.sold("tierce", 7), "わくれんは 9とう いじょう・ふくしょうは 5とう いじょう");
// ---- 4. くみあわせ ----
for (const k of [7, 12, 16]) {
  const w = R.wakuOf(k), cnt = R.wakuCounts(k);
  ok(R.combos("tan", k).length === k && R.combos("umaren", k).length === comb(k, 2) && R.combos("wide", k).length === comb(k, 2) && R.combos("umatan", k).length === k * (k - 1) && R.combos("trio", k).length === comb(k, 3) && R.combos("tierce", k).length === k * (k - 1) * (k - 2), `${k}とう: くみあわせの かず`);
  let wk = 0; for (let a = 1; a <= 8; a++) for (let b = a; b <= 8; b++) if (cnt[a] && cnt[b] && (a !== b || cnt[a] >= 2)) wk++;
  ok(R.combos("waku", k, w).length === wk, `${k}とう: わくれんの くみあわせ（ゾロめ ふくむ）`);
  for (const t of R.IDS) { const cs = R.combos(t, k, w); ok(new Set(cs).size === cs.length && cs.every((x) => R.key(t, R.parse(x)) === x), `${k}とう ${t}: key が ただしい`); }
}
// あたり
{
  const k = 12, w = R.wakuOf(k), ord = [5, 3, 8, 1, 2, 4, 6, 7, 9, 10, 11, 12];
  const W = (t) => R.winners(t, ord, k, w).join();
  ok(W("tan") === "5" && W("fuku") === "5,3,8" && W("umaren") === "3-5" && W("wide") === "3-5,5-8,3-8" && W("umatan") === "5>3" && W("trio") === "3-5-8" && W("tierce") === "5>3>8" && W("waku") === R.key("waku", [w[5], w[3]]), "あたりの くみあわせ（12とう）");
  ok(R.winners("fuku", ord.slice(0, 7), 7, R.wakuOf(7)).join() === "5,3", "7とうの ふくしょうは 2つ");
}
// かいかた（ボックス・ふつう）
for (const t of ["umaren", "wide", "umatan", "trio", "tierce"]) for (let k = 3; k <= 7; k++) ok(R.expand(t, [1, 2, 3, 4, 5, 6, 7].slice(0, k), "box", 12).length === R.boxCount(t, k), `${t} ボックス ${k}とう`);
ok(R.expand("tan", [3, 5, 3], "one", 12).join() === "3,5" && R.expand("tan", [13], "one", 12).length === 0 && R.expand("umatan", [4, 4], "one", 12).length === 0 && R.expand("umatan", [4, 2], "one", 12).join() === "4>2" && R.expand("umaren", [4, 2], "one", 12).join() === "2-4" && R.expand("trio", [1, 2], "one", 12).length === 0 && R.expand("tan", [1, 2], "box", 12).length === 0, "ふつうの かいかたの たしかめ");
ok(R.expand("waku", [7, 7], "one", 12).join() === "7-7" && R.expand("waku", [1, 1], "one", 12).length === 0 && R.expand("waku", [3, 6], "one", 12).join() === "3-6" && R.expand("waku", [3, 9], "one", 12).length === 0, "わくれん（ゾロめは 2とう いる わく だけ）");
// ---- 5. はらいもどしの けいさん（て で けいさん した れい）----
const V = (o) => new Map(Object.entries(o));
let s = R.settle("tan", V({ 1: 1000, 2: 3000, 3: 6000 }), ["1"]); ok(s.per.get("1") === 800 && !s.toku, "たんしょう: 1000000 × 0.8 ÷ 100000 = 8.0ばい → 800");
s = R.settle("tan", V({ 1: 1000, 2: 3000, 3: 6000 }), ["2"]); ok(s.per.get("2") === 260, "10コイン みまん きりすて（2.66 → 260）");
s = R.settle("tan", V({ 1: 9500, 2: 300, 3: 200 }), ["1"]); ok(s.per.get("1") === 110, "100コイン いかは 110コイン（もとがえし ＋ プラス10）");
s = R.settle("tan", V({ 1: 8000, 2: 1000, 3: 1000 }), ["1"]); ok(s.per.get("1") === 110, "ちょうど 100コイン も 110コイン");
s = R.settle("tierce", V({ "1>2>3": 50, "2>1>3": 50 }), ["3>2>1"]); ok(s.toku && s.per.get("3>2>1") === 70, "だれも かって いない くみあわせ → 70コイン（とくべつ ばらい）");
s = R.settle("fuku", V({ 1: 2000, 2: 3000, 3: 1000, 4: 2500, 5: 1500 }), ["1", "2", "3"]);
ok(s.per.get("1") === 130 && s.per.get("2") === 110 && s.per.get("3") === 180, "ふくしょう:（あたり ＋ はずれ ÷ 3）× 0.8 ÷ あたり（130・110・180）");
s = R.settle("wide", V({ "1-2": 400, "1-3": 0, "2-3": 600, "4-5": 9000 }), ["1-2", "1-3", "2-3"]);
ok(s.per.get("1-2") === Math.floor(((400 * 2 + 9000) * 775) / (100 * 2 * 400)) * 10 && !s.per.has("1-3") && !s.toku, "ワイド: かった ひとの いない あたりは のぞいて わける");
{ let big = new Map([["1", 4e7], ["2", 6e7]]); s = R.settle("tan", big, ["2"]); ok(s.per.get("2") === 130, "おおきな かずでも ずれない"); }
ok(R.idiv(10, 3) === 3 && R.idiv(9, 3) === 3 && R.idiv(1e15 + 1, 7) === Math.floor((1e15 + 1) / 7), "わりざん");
// オッズの はば
{ const m = V({ 1: 4000, 2: 3000, 3: 1500, 4: 1000, 5: 500 }), r = R.range("fuku", m, "5", 10000, 8); ok(r && r.lo <= r.hi && r.lo >= 1.1, "ふくしょうの オッズの はば"); }
// ---- 6. ハービルの たしかさ ----
for (const k of [7, 10, 16]) {
  const q = [0, ...Array.from({ length: k }, (_, i) => (k - i) / ((k * (k + 1)) / 2))], w = R.wakuOf(k), sum = (t) => { let x = 0; for (const v of R.probs(t, q, k, w).values()) x += v; return x; };
  ok(Math.abs(sum("tan") - 1) < 1e-9 && Math.abs(sum("umaren") - 1) < 1e-9 && Math.abs(sum("umatan") - 1) < 1e-9 && Math.abs(sum("trio") - 1) < 1e-9 && Math.abs(sum("tierce") - 1) < 1e-9 && Math.abs(sum("waku") - 1) < 1e-9, `${k}とう: たしかさの ごうけい 1`);
  ok(Math.abs(sum("fuku") - R.places(k)) < 1e-9 && Math.abs(sum("wide") - 3) < 1e-9, `${k}とう: ふくしょう・ワイドの ごうけい`);
}
// ちゃくさ
ok(R.marginText(0.05) === "ハナ" && R.marginText(0.15) === "アタマ" && R.marginText(0.3) === "クビ" && R.marginText(0.5) === "1/2" && R.marginText(1) === "1" && R.marginText(12) === "たいさ", "ちゃくさの ことば");

// ---- 7. ばんぐみ・うま ----
const DAYS = Array.from({ length: 40 }, (_, i) => "2027-" + (1 + (i % 12)) + "-" + (1 + Math.floor(i / 12) * 7));
let small = 0;
for (const day of DAYS) {
  const card = K.card(day), names = new Set();
  ok(card.length === 12 && card.every((h, i) => h.no === i + 1 && h.n >= 7 && h.n <= 16 && [1200, 1400, 1600, 1800, 2000, 2100, 2400, 3000, 3200].includes(h.dist) && ["turf", "dirt"].includes(h.surf)), `${day}: 12レース`);
  ok(card.every((h) => !kanji.test(K.title(h)) && !kanji.test(K.course(h)) && !kanji.test(h.going) && !kanji.test(h.weather)), `${day}: レースの ことばは かな`);
  ok(card[10].grade && ["G1", "G2", "G3"].includes(card[10].grade) && card.filter((h) => h.grade).length === 1, `${day}: 11R が メイン`);
  if (card.some((h) => h.n <= 9)) small++;
  for (const h of card) {
    const rc = K.race(day, h.no);
    ok(rc.horses.length === h.n && rc.horses.every((x, i) => x.no === i + 1 && x.waku === rc.w[i + 1] && K.nameOk(x.name) && /^[゠-ヿ]+$/.test(x.name) && !names.has(x.name) && names.add(x.name) && x.kg >= 54 && x.kg <= 58 && x.style >= 0 && x.style <= 3), `${day} ${h.no}R: うま（なまえは カタカナ 2〜9もじ・その日 1かい）`);
    ok(Math.abs(rc.horses.reduce((a, x) => a + x.p, 0) - 1) < 1e-9 && Math.abs(rc.horses.reduce((a, x) => a + x.q, 0) - 1) < 1e-9, `${day} ${h.no}R: たしかさの ごうけい`);
  }
}
ok(small >= DAYS.length * 0.9, "まいにち すくない とうすうの レースが ある（ふくしょう 2ちゃく まで・わくれん なし）");
// きまった けっか（よむ じゅんばんで かわらない）
{
  const day = DAYS[3], a = K.card(day).map((h) => JSON.stringify([K.race(day, h.no).horses.map((x) => x.name + x.r), K.result(K.race(day, h.no)).order]));
  K.cache.clear(); const b = []; for (let no = 12; no >= 1; no--) b[no - 1] = JSON.stringify([K.race(day, no).horses.map((x) => x.name + x.r), K.result(K.race(day, no)).order]);
  ok(a.join() === b.join(), "ばんぐみ・うま・けっかは よむ じゅんばんで かわらない");
}
// けっか・はしりかた
for (const day of DAYS.slice(0, 6)) for (let no = 1; no <= 12; no++) {
  const rc = K.race(day, no), res = K.result(rc);
  ok(res.order.slice().sort((x, y) => x - y).join() === rc.horses.map((x) => x.no).join() && res.margins[0] === "" && res.cum.every((c, i) => i === 0 || c >= res.cum[i - 1]) && res.time.every((t, i) => i === 0 || t >= res.time[i - 1]), `${day} ${no}R: けっかの かたち`);
  let prev = null, back = 0, out = 0;
  for (let t = 0; t <= res.tw + 6; t += 0.25) { const ps = K.pos(rc, t); ps.forEach((p, i) => { if (prev && p.s < prev[i].s - 1e-6) back++; if (!(p.lane >= 0 && p.lane <= 1) || !Number.isFinite(p.s)) out++; }); prev = ps; }
  const cross = rc.horses.map((x) => [x.no, K.finishAt(rc, x.no)]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
  ok(!back && !out && cross.join() === res.order.join(), `${day} ${no}R: うまは もどらない・ゴールの じゅんばんが けっかと おなじ`);
  const pays = K.payouts(rc);
  ok(R.IDS.every((t) => (R.sold(t, rc.n) ? !pays[t].sold : pays[t].sold && pays[t].wins.length >= 1 && pays[t].wins.every((w) => w.per === null || w.per >= 70))), `${day} ${no}R: はらいもどし`);
  ok(pays.fuku.wins.length === R.places(rc.n) && (rc.n >= 9) === pays.waku.sold, `${day} ${no}R: ふくしょうの かず・わくれん`);
}
// ほんものに にた かず（1ばん にんき やく 30%・3ちゃく いない 6〜7わり・たんしょうを ぜんぶ かうと やく 75%）
{
  let races = 0, fw = 0, f3 = 0, back = 0, stake = 0; const tier = [];
  for (let d = 0; d < 60; d++) {
    const day = "2028-" + (1 + (d % 12)) + "-" + (1 + Math.floor(d / 12) * 5);
    for (let no = 1; no <= 12; no++) {
      const rc = K.race(day, no), res = K.result(rc), b = K.board(rc), fav = b.slice().sort((x, y) => x.pop - y.pop)[0].no, p = K.payouts(rc);
      races++; if (res.order[0] === fav) fw++; if (res.order.slice(0, 3).includes(fav)) f3++;
      stake += rc.n; back += p.tan.wins[0].per / 100; tier.push(p.tierce.wins[0].per || 0);
    }
    K.cache.clear();
  }
  tier.sort((a, b) => a - b);
  const fwr = fw / races, f3r = f3 / races, ret = back / stake, med = tier[tier.length >> 1];
  ok(fwr > 0.24 && fwr < 0.38, "1ばん にんきの かつ わりあい " + fwr.toFixed(3));
  ok(f3r > 0.55 && f3r < 0.76, "1ばん にんきの 3ちゃく いない " + f3r.toFixed(3));
  ok(ret > 0.66 && ret < 0.84, "たんしょうを ぜんぶ かった ときの もどり " + ret.toFixed(3));
  ok(med > 5000 && med < 90000, "3れんたんの まんなかの はらいもどし " + med);
  console.log(`  ほんものに にた かず: 1ばん にんき ${(fwr * 100).toFixed(1)}%・3ちゃく いない ${(f3r * 100).toFixed(1)}%・たんしょう ぜんぶ ${(ret * 100).toFixed(1)}%・3れんたん まんなか ${med}（${races}レース）`);
}

// ---- 8. かう・しめきる・うけとる・つぎの 日・セーブ ----
{
  S.d = S.fresh(); S.d.coins = 10000; K.clock.shift = 0; KC.sync();
  const day = KC.today(), rc = K.race(day, 1), res = K.result(rc), [a, b, c] = res.order;
  ok(KC.next() === 1 && KC.state().open === 0, "はじめは 1R から");
  ok(KC.buy(1, "tan", [], "one", 1).err && KC.buy(1, "tierce", [1, 2], "one", 1).err && KC.buy(13, "tan", [1], "one", 1).err && S.d.coins === 10000, "えらびかたが たりない ときは かえない");
  let r = KC.buy(1, "tan", [a, b], "one", 2); ok(r.ticket && r.ticket.keys.length === 2 && r.ticket.cost === 400 && S.d.coins === 9600, "たんしょう 2とう × 2まい = 400");
  r = KC.buy(1, "tierce", [a, b, c], "box", 1); ok(r.ticket && r.ticket.keys.length === 6 && S.d.coins === 9000, "3れんたん ボックス 3とう = 6てん");
  ok(KC.buy(1, "trio", [1, 2, 3, 4, 5, 6, 7], "box", 1).err && KC.spentOn(1) === 10, "1レース 30まい まで（あと 20まいの ときに 35てんは かえない）");
  S.d.coins = 50; ok(KC.buy(1, "tan", [a], "one", 1).err === "コインが たりないよ", "コインが たりない"); S.d.coins = 9000;
  const pays = K.payouts(rc, KC.ticketsOf(day, 1)), want = pays.tan.wins[0].per * 2 + pays.tierce.wins[0].per;
  const st = KC.start(day, 1);
  ok(st.won === want && st.tickets.every((t) => t.st === "hit") && st.horses.includes(a) && KC.runToday(1) && KC.next() === 2, "しめきって はらいもどしを きめる（たんしょう 1とう あたり・3れんたん あたり）");
  ok(KC.buy(1, "tan", [a], "one", 1).err === "この レースは もう はじまったよ", "はじまった レースは かえない");
  const c0 = S.d.coins, cl = KC.claim(); ok(cl.sum === want && S.d.coins === c0 + want && KC.unpaid().length === 0 && KC.claim().sum === 0 && S.d.keiba.won === want, "うけとる（2かい めは 0）");
  ok(S.d.keiba.hist.length === 1 && S.d.keiba.hist[0].order.join() === [a, b, c].join(), "けっかの きろく");
  // つぎの 日: まだ はしって いない レースの ばけんを しめきる
  r = KC.buy(2, "fuku", [1, 2, 3], "one", 1); ok(r.ticket && KC.open().length === 1, "2R の ふくしょうを かう");
  K.clock.shift = 1; const nx = KC.state();
  ok(nx.next === 1 && !nx.run.length && nx.open === 0 && S.d.keiba.tickets.filter((t) => t.no === 2).every((t) => t.st === "hit" || t.st === "miss") && S.d.keiba.hist.length === 2, "つぎの 日に なると まえの 日の ばけんを しめきる");
  K.clock.shift = 0;
  // こわれた セーブ
  S.d.keiba = "x"; ok(KC.st().tickets.length === 0 && KC.st().day === "", "こわれた セーブは あたらしく");
  S.d.keiba = { tickets: [{ t: "nope", keys: ["1"], day: "2027-1-1", no: 1 }, null, { t: "tan", keys: ["1"], day: "2027-1-1", no: 1, st: "open", u: 1, sel: [1], cost: 100 }], run: [], seq: "a" };
  ok(KC.st().tickets.length === 1 && typeof KC.st().run === "object" && !Array.isArray(KC.st().run) && KC.st().seq === 0, "へんな ばけんは すてる");
  ok(JSON.stringify(S.fresh().keiba) === JSON.stringify(KC.fresh()), "Save.fresh() の keiba は KeibaCorner.fresh() と おなじ");
  // ばけんが ふえすぎない
  S.d = S.fresh(); S.d.coins = 1e7; KC.sync();
  for (let no = 1; no <= 12; no++) for (let i = 0; i < 9; i++) KC.buy(no, "tan", [1 + (i % 7)], "one", 1);
  for (let no = 1; no <= 12; no++) KC.start(KC.today(), no);
  ok(S.d.keiba.tickets.length <= 108 && S.d.keiba.hist.length === 12, "きろくは 12レース まで");
  KC.claim(); for (let i = 0; i < 3; i++) { K.clock.shift = i + 1; KC.sync(); for (let no = 1; no <= 12; no++) for (let j = 0; j < 4; j++) KC.buy(no, "tan", [1 + j], "one", 1); }
  ok(S.d.keiba.tickets.length <= 80 + 48, "ふるい ばけんは すてる");
  K.clock.shift = 0;
}

// ---- 9. 10F の コーナー ----
{
  const r = C.VenueHalls.defs.electronics.floors[10], z = r.zones.find((x) => x.shop === "kd_keiba"), F = r.fixtures.filter((f) => f.action === "keiba");
  ok(z && z.label === "けいば ちゅうけい" && z.x === 17 && z.y === 15 && z.w === 21 && z.h === 13, "10F の ゾーン");
  ok(F.length === 16 && ["watch", "buy", "refund", "help", "news", "board", "odds", "staff"].every((k) => F.some((f) => f.keiba === k)), "什器 16（みる・かう・はらいもどし・あそびかた・しんぶん・けっか・オッズ・かかりの ひと）");
  ok(F.every((f) => f.x >= z.x && f.y >= z.y && f.x + f.w <= z.x + z.w && f.y + f.h <= z.y + z.h && f.label && !kanji.test(f.label)), "什器は ゾーンの なか・なまえは かな");
  ok(C.MallGuide.places(r).some((p) => p.label === "けいば ちゅうけい"), "フロアマップに けいば ちゅうけい");
  ok(r.rows.slice(z.y, z.y + z.h).every((row) => row.slice(z.x, z.x + z.w) === "e".repeat(z.w)) && r.mats.e === "kkeiba" && C.KadenHallArt.MAT.kkeiba && C.MallArt.SHOP.kd_keiba, "みどりの じゅうたん・いろ");
  for (const kind of ["kbvision", "kbodds", "kbboard", "kbseat", "kbseller", "kbrefund", "kbdesk", "kbnews"]) {
    const f = F.find((x) => x.kind === kind), m = C.KadenHallArt.model(f);
    ok(m && m.svg.startsWith("<svg") && !/NaN|undefined|Infinity/.test(m.svg) && m.vb.w > 0 && m.vb.h > 0, `什器の 絵 ${kind}`);
  }
  ok(["kbvision", "kbodds", "kbboard", "kbseller", "kbrefund"].every((k) => typeof C.KadenHallArt.L[k] === "function"), "がめんが うごく 什器");
  ok(C.KadenHall.keibaHook && C.SCENES.keiba === C.KeibaScene && C.SONGS.keiba_fanfare && C.SONGS.keiba_fanfare.tracks.length === 3, "しらべる・ちゅうけいの がめん・ファンファーレ");
}
// ---- 10. うまの 絵 ----
{
  let bad = 0, idBad = 0; const keys = new Set();
  for (let fr = 0; fr < 4; fr++) for (let co = 0; co < A.COATS.length; co++) for (let si = 0; si < A.SILKS.length; si++) for (let wk = 1; wk <= 8; wk++) {
    const sv = A.horseSvg(fr, co, si, wk), ids = [...sv.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    if (!sv.startsWith("<svg") || /NaN|undefined|Infinity|<text/.test(sv) || !sv.includes('viewBox="0 0 140 106"')) bad++;
    if (new Set(ids).size !== ids.length) idBad++;
    keys.add(A.horseKey(fr, co, si, wk));
  }
  ok(!bad && !idBad && keys.size === 4 * 5 * 16 * 8, "うまの 絵 2560（4コマ × けいろ 5 × しょうぶふく 16 × わく 8）・キーの かずが きまって いる");
}
// ---- 11. ことば（コメント いがいに 漢字 なし・けっかは Math.random を つかわない）----
for (const f of ["js/keiba-rules.js", "js/keiba-race.js", "js/keiba-art.js", "js/keiba-ui.js", "js/keiba-scene.js", "js/keiba-corner.js"]) {
  const src = readFileSync(new URL("../" + f, import.meta.url), "utf8"), code = src.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  ok(!kanji.test(code), f + ": がめんの ことばに 漢字 なし");
  if (/rules|race/.test(f)) ok(!/Math\.random/.test(code), f + ": きまった らんすう だけ");
}
ok(!kanji.test(KU.NOTE) && /20さい/.test(KU.NOTE), "20さいの おしらせ");
const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
ok([".kb-ui", ".kb-row", ".kb-types", ".kb-ticket", ".kb-pays", ".kb-news-row"].every((c) => css.includes(c)), "CSS");
console.log(`✓ keiba (UI-58): ${n} checks — 8 bet types (real JRA payout rates), frame numbers, place 2 for ≤7 runners, bracket quinella from 9, 10-coin truncation, +10, 70 special payout, place formula, Harville sums, 12 races a day, katakana names, fixed results, monotonic running and finish order, favourite stats, buy/settle/claim/next day, save repair, 10F corner (16 fixtures, floor map), 2560 horse sprites, kana texts`);
