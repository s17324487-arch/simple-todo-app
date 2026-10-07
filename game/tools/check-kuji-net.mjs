// みんなの くじ（いちばんくじを オンラインの みんなで おなじ ロット・UI-100・js/kuji-net.js）の 検査（ブラウザ なし。ネットは にせの Firebase〔tests/online-fake.mjs〕を 127.0.0.1 で）:
// 1. よみこみ・ネットに じぶんで つながない・Online.parts・セーブ（Save.d.kuji.net・こわれた ときも）
// 2. derive（でた 賞の けいさん）: みんな おなじ・ロットの ほんすう どおり・80まいめが ラストワン・とちゅうが ない ところで とまる・のこりの おもみ・
//    D〜Fしょうは えらんだ じゅん（o）で さきの 人から・ない しゅるいは のこりの はじめ・へんな えらびかたは つかわない・timeFor
// 3. ひく・えらぶ（にせの サーバー）: コインは ひけた ときだけ・だれかが さきに ひいた → よみなおして つぎの ばんごう・へんじが こない → たしかめる・つながらない → コインは へらない・
//    ほかの 人が さきに えらんだ しゅるい・80まいめで ラストワンしょうと つぎの ロット・まえの ロットでも えらべる・へんじが こなかった じぶんの くじを あとで うけとる（since より まえは しない）・
//    ID が かわる・「みせた データを けす」（じぶんの くじの なまえを けす・ほかの 人の くじは そのまま）・
//    ルールを はりなおす まえ（みんなの くじは よめない・「けす」は くじの ぶんを たさずに ほかの データを けす）
// 4. ルール（database.rules.json の kuji・kujime）と にせの サーバーの きまりが おなじ かず・おみせ（くわしくは 本物の エミュレーターで tools/rules-emulator.mjs）
// 5. ことば（ひらがな中心）・同意の まどの おくる もの
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
import { startOnlineFake } from "../tests/online-fake.mjs";
const R = gameContext();
const { KujiNet: KN, IchibanKuji: K, Online: O, OnlineNet: N, Save: S, PokaDebug: D } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const KANJI = /[一-鿿]/;
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

// ---- 1. よみこみ・セーブ ----
const scripts = [...read("index.html").matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]), at = (f) => scripts.indexOf("js/" + f);
ok(at("kuji-net.js") === at("online-visit.js") + 1 && ["ichiban-kuji.js", "kuji-ui.js", "online-net.js", "online.js"].every((f) => at(f) >= 0 && at(f) < at("kuji-net.js")) && at("kuji-net.js") < at("debug.js") && read("sw.js").includes('"./js/kuji-net.js"'), "kuji-net.js は online-visit.js の すぐ あと（いちばんくじ・オンラインの あと）・sw.js にも");
const src = read("js/kuji-net.js");
ok(!/\bfetch\s*\(|EventSource|XMLHttpRequest|sendBeacon|WebSocket|localStorage|https?:\/\//.test(src), "kuji-net.js は じぶんで ネットに つながない（OnlineNet だけ）");
const part = O.parts.find((p) => p.id === "kuji");
ok(part && typeof part.wipe === "function" && typeof part.account === "function" && !part.render && O.parts.at(-1) === part, "Online.parts の いちばんくじ（けす・ID・すまほの タブは ない）");
const NET0 = '{"on":0,"since":0,"uid":"","rec":{}}';
ok(JSON.stringify(S.fresh().kuji.net) === NET0 && JSON.stringify(K.cleanNet(undefined)) === NET0, "Save.d.kuji.net の はじめ");
const fixed = K.cleanNet({ on: 1, since: 5.5, uid: "a b", rec: { lawson_1_0: 1, lawson_1_79: 3, sevenbun_2_5: 0, nope_1_1: 1, lawson_x_1: 1, lawson_1_2: 4, lawson_1_3: "1", __proto__: 1 }, extra: 1 });
ok(fixed.on === 1 && fixed.since === 5 && fixed.uid === "" && JSON.stringify(fixed.rec) === '{"lawson_1_0":1,"lawson_1_79":3,"sevenbun_2_5":0}' && !("extra" in fixed), "こわれた net を なおす " + JSON.stringify(fixed));
ok(Object.keys(K.cleanNet({ rec: Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`lawson_${i}_1`, 1])) }).rec).length === K.NET_MAX && K.NET_MAX === 400, "rec は あたらしい 400 けん まで");
S.d = S.fresh(); S.d.kuji = { ...S.d.kuji, net: { on: 1, since: 9, uid: "u1", rec: { lawson_3_4: 1 } } };
ok(JSON.stringify(K.st().net) === '{"on":1,"since":9,"uid":"u1","rec":{"lawson_3_4":1}}', "IchibanKuji.clean は net を のこす");
const old = JSON.parse(JSON.stringify(S.fresh())); delete old.kuji.net; S.d = S.migrate(old);
ok(JSON.stringify(K.st().net) === NET0 && S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "まえの セーブにも net（SCHEMA・KEY は そのまま）");

// ---- 2. derive ----
const STORES = K.STORES;
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const mkLot = (count, t0 = 1700000000000, gap = () => 1 + Math.floor(rnd() * 900)) => { const d = {}; let t = t0; for (let k = 0; k < count; k++) { t += gap(); d["k" + k] = { u: k % 2 ? "uB" : "uA", t }; } return { n: count, d }; };
for (const s of STORES) {
  const S0 = K.NET_BY[s], v0 = KN.derive(s, 1, {});
  ok(v0.n === 0 && v0.total === 80 && JSON.stringify(v0.tickets) === JSON.stringify(Object.fromEntries(K.GRADES.map((g) => [g, sum(K.PLAN[g])]))) && JSON.stringify(v0.left) === JSON.stringify(S0.plan) && !v0.sold, `${s}: から の ロット（80まい）`);
  for (let rep = 0; rep < 40; rep++) {
    const lot = mkLot(80, 1700000000000 + rep * 99991), v = KN.derive(s, 7, lot), g = {};
    for (const x of v.draws) g[x.g] = (g[x.g] || 0) + 1;
    ok(v.n === 80 && v.sold && v.total === 0 && K.GRADES.every((G) => g[G] === sum(K.PLAN[G])), `${s} ${rep}: 80まいで 賞の ほんすう どおり ` + JSON.stringify(g));
    const kinds = {}; for (const x of v.draws) if (x.id) kinds[x.id] = (kinds[x.id] || 0) + 1;
    ok(Object.entries(S0.plan).every(([id, c]) => K.PICK[K.INDEX[id].grade] ? !kinds[id] && v.left[id] === c : kinds[id] === c && v.left[id] === 0), `${s} ${rep}: A〜C・G〜I の しゅるいも ほんすう どおり・D〜F は えらぶ まで のこる`);
    ok(v.draws.filter((x) => x.last).length === 1 && v.draws[79].last && v.draws.filter((x) => x.pick).length === 18 && v.draws.every((x) => x.pick === !!K.PICK[x.g]), `${s} ${rep}: 80まいめが ラストワン・D〜F は 18まい`);
    if (rep < 5) {
      ok(JSON.stringify(KN.derive(s, 7, JSON.parse(JSON.stringify(lot)))) === JSON.stringify(v), `${s} ${rep}: おなじ ロットは おなじ けっか（だれが けいさんしても）`);
      const shuffled = { ...lot, d: Object.fromEntries(Object.entries(lot.d).reverse()) };
      ok(JSON.stringify(KN.derive(s, 7, shuffled).draws) === JSON.stringify(v.draws), `${s} ${rep}: キーの じゅんばんに よらない`);
      ok(JSON.stringify(KN.derive(s, 8, lot).draws.map((x) => x.g)) !== JSON.stringify(v.draws.map((x) => x.g)), `${s} ${rep}: ロットの ばんごうが ちがえば ちがう`);
    }
  }
  // とちゅうが ない → そこまで・へんな くじ
  const gapLot = mkLot(10); delete gapLot.d.k4;
  ok(KN.derive(s, 1, gapLot).n === 4, `${s}: とちゅうが ない ところで とまる`);
  const bad = mkLot(3); bad.d.k1.t = "x";
  ok(KN.derive(s, 1, bad).n === 1 && KN.derive(s, 1, { d: { k0: { t: 5, u: "<b>" } } }).draws[0].u === "", `${s}: へんな じこく・へんな ID`);
  ok(KN.derive(s, 1, null).n === 0 && KN.derive(s, 1, { d: [] }).n === 0 && KN.derive(s, 1, { d: { __proto__: { t: 1 } } }).n === 0, `${s}: から・へんな かたち`);
}
// 1まいめの 賞は のこりの まい数の おもみ（A は 1/80・I は 27/80）
const first = {}; seed = 777;
for (let i = 0; i < 24000; i++) { const g = KN.derive("lawson", 1, { d: { k0: { u: "u", t: 1700000000000 + Math.floor(rnd() * 1e9) } } }).draws[0].g; first[g] = (first[g] || 0) + 1; }
for (const g of K.GRADES) { const e = 24000 * sum(K.PLAN[g]) / 80, sd = Math.sqrt(e * (1 - sum(K.PLAN[g]) / 80)); ok(Math.abs((first[g] || 0) - e) < 5 * sd, `1まいめの ${g}しょうは ${(sum(K.PLAN[g]) / 80 * 100).toFixed(1)}% くらい（${first[g]} / ${e.toFixed(0)}）`); }
// D〜F の えらびかた
const pickLot = (want) => { // want: [[k, 賞]] に なる ロット
  const d = {}; let t = 1700000000000;
  for (const [k, g] of want) { t = KN.timeFor("lawson", 3, { d }, g, t + 1); d["k" + k] = { u: k % 2 ? "uB" : "uA", t }; }
  return { n: want.length, d };
};
const PL = pickLot([[0, "D"], [1, "D"], [2, "D"], [3, "H"]]);
let V = KN.derive("lawson", 3, PL);
ok(V.draws.slice(0, 3).every((x) => x.g === "D" && x.pick && !x.id) && V.draws[3].g === "H", "timeFor で 賞を きめた ロット（D・D・D・H）" + JSON.stringify(V.draws.map((x) => x.g)));
const D0 = K.NET_BY.lawson.ids.D;
PL.d.k1.p = 2; PL.d.k1.o = 0; PL.d.k0.p = 2; PL.d.k0.o = 1; PL.d.k2.p = 3; PL.d.k2.o = 2; PL.pc = 3;
V = KN.derive("lawson", 3, PL);
ok(V.draws[1].id === D0[2] && !V.draws[1].fixed && V.draws[0].id === D0[0] && V.draws[0].fixed && V.draws[2].id === null && V.draws[2].p === null && V.left[D0[1]] === 1 && V.left[D0[2]] === 0 && V.left[D0[0]] === 0, "D〜F: えらんだ じゅん（o）の さきの 人から・ない しゅるいは のこりの はじめ（fixed）・へんな しゅるいの ばんごう（3）は つかわない " + JSON.stringify(V.draws.slice(0, 3)));
PL.d.k3.p = 0; PL.d.k3.o = 3;
ok(KN.derive("lawson", 3, PL).draws[3].id && KN.derive("lawson", 3, PL).draws[3].g === "H" && KN.derive("lawson", 3, PL).left[D0[1]] === 1, "D〜F で ない くじの えらびかたは つかわない");
for (let rep = 0; rep < 6; rep++) {
  const lot = mkLot(3 + rep * 7), v = KN.derive("sevenbun", 2, lot);
  ok(K.GRADES.every((g) => { const t = KN.timeFor("sevenbun", 2, lot, g); return v.tickets[g] > 0 ? t && KN.derive("sevenbun", 2, { d: { ...lot.d, ["k" + v.n]: { u: "x", t } } }).draws[v.n].g === g : t === null; }), "timeFor（つぎの くじが その 賞に なる じこく・もう ない 賞は null）" + rep);
}

// ---- 3. ひく・えらぶ（にせの サーバー）----
const fake = await startOnlineFake();
let failNext = null; // (url, opt) → "before" つながらない（とどかない）・"after" とどいた あと へんじが こない
// oldRules: くじの きまりを はる まえの ルール（main の database.rules.json）。v1/kuji・v1/kujime を よむ／かく と 401・PATCH は どこか 1つでも だめなら ぜんぶ 401（本物の エミュレーターで たしかめた こたえ）
let oldRules = false;
N.fetchFn = async (url, opt = {}) => {
  if (oldRules && (/\/db\/v1\/kuji(me)?\//.test(url) || (/\/db\/v1\.json/.test(url) && /"kuji(me)?\//.test(String(opt.body || ""))))) return new Response('{"error":"Permission denied"}', { status: 401 });
  const f = failNext && failNext(url, opt);
  if (f === "before") throw new Error("offline");
  const r = await fetch(url, opt);
  if (f === "after") throw new Error("lost");
  return r;
};
const HTTP = async (method, path, body, tok) => { const r = await fetch(`${fake.base}/db/${path}.json?auth=${encodeURIComponent(tok || "")}`, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); let j = null; try { j = await r.json(); } catch (e) { /* 204 */ } return { status: r.status, body: j }; };
const sign = async () => { const r = await (await fetch(`${fake.base}/auth/accounts:signUp?key=${fake.conf.apiKey}`, { method: "POST", body: "{}" })).json(); return { uid: r.localId, tok: r.idToken }; };
const SVT = { ".sv": "timestamp" };
// ほかの 人が ルールどおりに ひく（k: なんまいめ・g: 賞〔kujiT で きめる〕）
const other = async (U, s, lotNo, k, g = null) => {
  if (g) { const lot = fake.at(`v1/kuji/${s}/lots/l${lotNo}`) || {}; fake.kujiT(KN.timeFor(s, lotNo, lot, g)); }
  return HTTP("PATCH", "v1", { [`kuji/${s}/lots/l${lotNo}/n`]: k + 1, [`kuji/${s}/lots/l${lotNo}/d/k${k}`]: { u: U.uid, t: SVT }, [`kujime/${U.uid}/${s}_l${lotNo}`]: true }, U.tok);
};
const reset = () => { fake.reset(); S.d = S.fresh(); S.d.coins = 200000; N.over = { ...fake.conf }; N.auth = null; N.pending = null; O.reg = ""; O.syncP = null; R.localStorage.removeItem(N.KEY); KN.reset(); failNext = null; oldRules = false; const s = O.st(); s.on = true; s.agreed = 1; s.ver = O.VER; s.nick = [3, 4]; };
reset();
ok(KN.available() && !KN.using() && KN.setMode(true) === undefined && KN.using() && KN.st().since > 0, "オンラインで みんなの くじ を つかう（はじめて つかった とき）");
const since0 = KN.st().since;
KN.setMode(false); KN.setMode(true);
ok(KN.st().since === since0, "since は はじめての とき だけ");
O.st().on = false; ok(!KN.available() && !KN.using(), "オンラインを とめると つかえない"); O.st().on = true;
// 1まい（A しょうを きめて）
let L = await KN.load("lawson");
ok(L.cur === 1 && L.view.n === 0 && L.view.total === 80, "はじめの ロット 1（サーバーに まだ ない）");
fake.kujiT(KN.timeFor("lawson", 1, {}, "A"));
const c0 = S.d.coins, CC = R.ConbiniCard, p0 = CC.card("lawson").pts;
let r = await KN.draw("lawson", 1);
const me = N.uid();
ok(r && r.tickets.length === 1 && r.tickets[0].g === "A" && r.tickets[0].id === "kj_mlaw_a" && r.tickets[0].first && S.d.coins === c0 - 1000 && S.d.furn.kj_mlaw_a === 1 && K.got("kj_mlaw_a") === 1 && r.left === 79, "1まい ひく → Aしょう（コイン 1000・家具）" + JSON.stringify(r && r.tickets));
ok(fake.at("v1/kuji/lawson/lots/l1/n") === 1 && fake.at("v1/kuji/lawson/lots/l1/d/k0/u") === me && typeof fake.at("v1/kuji/lawson/lots/l1/d/k0/t") === "number" && fake.at(`v1/kujime/${me}/lawson_l1`) === true && fake.at(`v1/players/${me}`).n === "3-4", "サーバー: 1まいめ・じぶんの ID・サーバーの じこく・じぶんの きろく・なまえ");
ok(JSON.stringify(Object.keys(fake.at("v1/kuji/lawson/lots/l1/d/k0")).sort()) === '["t","u"]', "おくるのは ID と じこく だけ（なまえは v1/players）");
ok(K.st().net.rec.lawson_1_0 === 1 && K.st().net.uid === me && K.st().draws === 1 && K.st().spent === 1000 && K.st().stubs.lawson === 1, "てもとの きろく（もらった・ひいた まい数・はんけん）");
ok(K.lot("lawson").log.length === 0 && K.total("lawson") === 80, "ひとりの くじの ロットは かわらない");
ok(CC.card("lawson").pts === p0 + 50 && CC.card("lawson").has && CC.card("sevenbun").pts === 0, "ローリソンの ポイントカードに 50ポイント（1000コインの かいもの・js/conbini-card.js）");
// ほかの 人
const B = await sign(), C = await sign();
await HTTP("PUT", `v1/players/${B.uid}`, { n: "5-7", t: SVT }, B.tok);
ok((await other(B, "lawson", 1, 1, "B")).status === 200, "ほかの 人（B）が 2まいめ（Bしょう）");
L = await KN.load("lawson");
ok(L.view.n === 2 && L.view.draws[1].u === B.uid && L.view.draws[1].g === "B" && L.view.left.kj_mlaw_b === 0 && L.view.total === 78, "ほかの 人の くじで のこりが へる・Bしょうが でた");
ok(!K.got("kj_mlaw_b"), "ほかの 人の けいひんは もらわない");
// みんなの けっか（なまえ）
ok(KN.nameOf(me) === "あなた" && KN.nameOf("") === "だれか" && KN.nameOf(B.uid) === "…", "なまえ（あなた・だれか・よみこみ中）");
for (let i = 0; i < 100 && KN.nameOf(B.uid) === "…"; i++) await new Promise((ok2) => setTimeout(ok2, 20)); // なまえを よむ まで
ok(KN.nameOf(B.uid) === "わくわく ぺんぎんさん" && KN.feed(L.view).map((f) => f.name).join() === "わくわく ぺんぎんさん,あなた" && KN.feed(L.view)[0].g === "B" && KN.feed(L.view)[1].me, "みんなの けっか（あたらしい じゅん・なまえ）" + JSON.stringify(KN.feed(L.view)));
// だれかが さきに ひいた（てもとの n が ふるい）→ よみなおして つぎの ばんごう
await other(C, "lawson", 1, 2);
const before = S.d.coins;
fake.kujiT(KN.timeFor("lawson", 1, fake.at("v1/kuji/lawson/lots/l1"), "D"));
r = await KN.draw("lawson", 1);
ok(r.tickets.length === 1 && r.tickets[0].k === 3 && fake.at("v1/kuji/lawson/lots/l1/d/k3/u") === me && fake.at("v1/kuji/lawson/lots/l1/d/k2/u") === C.uid && S.d.coins === before - 1000, "だれかが さきに ひいた → 4まいめを ひく（コインは 1かい ぶん）");
ok(r.tickets[0].g === "D" && r.tickets[0].pick && !r.tickets[0].id && KN.pending("lawson").length === 1 && K.st().net.rec.lawson_1_3 === 0, "Dしょう → えらぶ まち");
let P = KN.pending("lawson")[0];
ok(P.lot === 1 && P.k === 3 && P.g === "D" && JSON.stringify(KN.choices("lawson", P)) === JSON.stringify(K.NET_BY.lawson.ids.D) && KN.leftOf("lawson", P, "kj_mlaw_d1") === 1, "えらべる しゅるい（のこり）");
// ほかの 人が さきに おなじ しゅるいを えらぶ
fake.kujiT(KN.timeFor("lawson", 1, fake.at("v1/kuji/lawson/lots/l1"), "D"));
await other(B, "lawson", 1, 4);
ok((await HTTP("PATCH", "v1/kuji/lawson/lots/l1", { pc: 1, "d/k4/p": 1, "d/k4/o": 0 }, B.tok)).status === 200, "B が さきに d1 を えらぶ");
r = await KN.pick("lawson", P, "kj_mlaw_d1");
ok(r && r.taken && !S.d.furn.kj_mlaw_d1, "おなじ しゅるいは とれない（taken）");
ok(JSON.stringify(KN.choices("lawson", P)) === JSON.stringify(["kj_mlaw_d0", "kj_mlaw_d2"]), "のこりの しゅるいだけ えらべる");
r = await KN.pick("lawson", P, "kj_mlaw_d2");
ok(r && r.id === "kj_mlaw_d2" && !r.fixed && S.d.furn.kj_mlaw_d2 === 1 && fake.at("v1/kuji/lawson/lots/l1/d/k3/p") === 2 && fake.at("v1/kuji/lawson/lots/l1/d/k3/o") === 1 && fake.at("v1/kuji/lawson/lots/l1/pc") === 2 && K.st().net.rec.lawson_1_3 === 1 && !KN.pending("lawson").length, "えらぶ → もらう（えらんだ じゅん 2ばんめ）");
ok(await KN.pick("lawson", P, "kj_mlaw_d0") && fake.at("v1/kuji/lawson/lots/l1/d/k3/p") === 2 && S.d.furn.kj_mlaw_d0 === undefined, "えらんだ あとは かわらない（おなじ ものを かえす）");
// へんじが こない（とどいて いる）→ たしかめて ひけた ことに
failNext = (url, opt) => (opt.method === "PATCH" && /\/db\/v1\.json/.test(url) ? "after" : null);
const b2 = S.d.coins, p2 = CC.card("lawson").pts; r = await KN.draw("lawson", 1); failNext = null;
ok(r.tickets.length === 1 && r.tickets[0].k === 5 && S.d.coins === b2 - 1000 && CC.card("lawson").pts === p2 + 50 && fake.at("v1/kuji/lawson/lots/l1/n") === 6, "へんじが こなくても とどいて いれば ひけた ことに（コイン・ポイント 1かい）");
// つながらない → コインは へらない・あとで
failNext = () => "before";
const b3 = S.d.coins, p3 = CC.card("lawson").pts; let threw = false; try { await KN.draw("lawson", 1); } catch (e) { threw = true; } failNext = null;
ok(threw && S.d.coins === b3 && CC.card("lawson").pts === p3 && fake.at("v1/kuji/lawson/lots/l1/n") === 6 && !Object.keys(K.st().net.rec).some((k) => k === "lawson_1_6"), "つながらない → コインは へらない（ポイントも ふえない）");
// 10まい
const b4 = S.d.coins, steps = [], p4 = CC.card("lawson").pts;
r = await KN.draw("lawson", 10, (i, m) => steps.push(`${i}/${m}`));
ok(r.tickets.length === 10 && CC.card("lawson").pts === p4 + 500 && S.d.coins === b4 - 10000 && steps.join() === "1/10,2/10,3/10,4/10,5/10,6/10,7/10,8/10,9/10,10/10" && fake.at("v1/kuji/lawson/lots/l1/n") === 16 && r.tickets.every((t, i) => t.k === 6 + i), "10まい（1まいずつ・すすみぐあい・ポイント +500）");
for (const p of KN.pending("lawson")) { const ch = KN.choices("lawson", p); const got = await KN.pick("lawson", p, ch[0]); ok(got && got.id === ch[0], "10まいの なかの D〜F を えらぶ " + p.k); }
ok(!KN.pending("lawson").length, "ぜんぶ えらんだ");
// のこり 1まいまで ほかの 人 → 80まいめ（ラストワン）を じぶんで
for (let k = fake.at("v1/kuji/lawson/lots/l1/n"); k < 79; k++) ok((await other(k % 2 ? B : C, "lawson", 1, k)).status === 200, "ほかの 人が ひく " + (k + 1));
L = await KN.load("lawson");
ok(L.view.n === 79 && L.view.total === 1 && !L.view.sold, "のこり 1まい");
fake.kujiT(KN.timeFor("lawson", 1, fake.at("v1/kuji/lawson/lots/l1"), K.GRADES.find((g) => L.view.tickets[g] > 0)));
const b5 = S.d.coins; r = await KN.draw("lawson", 3);
ok(r.tickets.length >= 1 && r.tickets[0].k === 79 && r.tickets[0].last && r.tickets[0].lastPrize && r.tickets[0].lastPrize.item.id === "kj_mlaw_l" && S.d.furn.kj_mlaw_l === 1 && (K.st().net.rec.lawson_1_79 & 2), "80まいめで ラストワンしょう " + JSON.stringify(r.tickets.map((t) => [t.lot, t.k])));
ok(r.tickets.length === 3 && r.tickets[1].lot === 2 && r.tickets[1].k === 0 && r.tickets[2].lot === 2 && r.tickets[2].k === 1 && S.d.coins === b5 - 3000, "うりきれたら つぎの ロット 2 で のこりを ひく");
ok(fake.at("v1/kuji/lawson/cur") === 2 && fake.at("v1/kuji/lawson/lots/l1/n") === 80 && KN.cur("lawson") === 2 && KN.view("lawson").n === 2, "サーバーの いまの ロットは 2");
ok((await other(B, "lawson", 1, 80)).status === 401 && (await other(B, "lawson", 2, 0)).status === 401, "まえの ロット・おなじ ばんごうには かけない");
// まえの ロットの えらぶ まち（80まいめが D〜F）: ほかの 人の 79まいの 賞を きめて、のこりの 1まいを Eしょうに する
reset();
await KN.load("sevenbun");
const U2 = await sign(), seq = [];
for (const g of K.GRADES) for (let i = 0; i < sum(K.PLAN[g]); i++) seq.push(g);
seq.splice(seq.indexOf("E"), 1);
for (let k = 0; k < 79; k++) ok((await other(U2, "sevenbun", 1, k, seq[(k * 37) % 79])).status === 200, "ほかの 人が ひく（賞を きめて）" + (k + 1));
const SL = KN.derive("sevenbun", 1, fake.at("v1/kuji/sevenbun/lots/l1"));
ok(SL.n === 79 && SL.total === 1 && SL.tickets.E === 1, "のこりの 1まいは Eしょう");
await KN.load("sevenbun"); r = await KN.draw("sevenbun", 1);
for (let i = 0; i < 50 && fake.at("v1/kuji/sevenbun/cur") !== 2; i++) await new Promise((ok2) => setTimeout(ok2, 20)); // うりきれた あとの つぎの ロット（またない）
ok(r.tickets[0].k === 79 && r.tickets[0].g === "E" && r.tickets[0].pick && r.tickets[0].lastPrize && r.tickets[0].lastPrize.item.id === "kj_msev_l" && fake.at("v1/kuji/sevenbun/cur") === 2, "80まいめが D〜F（ラストワンは すぐ・しゅるいは あとで）・つぎの ロットへ");
await KN.load("sevenbun");
P = KN.pending("sevenbun")[0];
ok(KN.cur("sevenbun") === 2 && P && P.lot === 1 && P.k === 79 && P.g === "E", "つぎの ロットを よんでも まえの ロットの えらぶ まちは のこる");
const ch = KN.choices("sevenbun", P);
ok(ch.length === 3 && ch.every((id) => K.INDEX[id].grade === "E"), "Eしょうの しゅるい（ほかの 人は まだ えらんで いない ので 3つ とも えらべる） " + ch);
r = await KN.pick("sevenbun", P, ch[0]);
ok(r && r.id === ch[0] && K.st().net.rec.sevenbun_1_79 === 3 && !KN.pending("sevenbun").length, "まえの ロットでも えらべる（ラストワンと けいひん）");
// へんじが こなかった じぶんの くじを あとで うけとる（since より あと）・まえの くじは じぶんの ものに しない
reset(); KN.setMode(true);
await KN.load("lawson"); await O.ensure(); KN.account(N.uid());
const meA = N.uid(), tokA = (await N.token());
const oldT = KN.st().since - 60000;
ok((await HTTP("PATCH", "v1", { "kuji/lawson/lots/l1/n": 1, "kuji/lawson/lots/l1/d/k0": { u: meA, t: SVT } }, tokA)).status === 200, "じぶんの ID で かいた くじ（へんじが こなかった）");
fake.write("v1/kuji/lawson/lots/l1/d/k0/t", oldT);
await KN.load("lawson");
const b6 = S.d.coins, p6 = CC.card("lawson").pts; let rc = await KN.reconcile("lawson");
ok(rc.adopted === 0 && S.d.coins === b6, "since より まえの じぶんの くじは うけとらない（あたらしく はじめた セーブ）");
await HTTP("PATCH", "v1", { "kuji/lawson/lots/l1/n": 2, "kuji/lawson/lots/l1/d/k1": { u: meA, t: SVT } }, tokA);
await KN.load("lawson"); rc = await KN.reconcile("lawson");
const x1 = KN.view("lawson").draws[1];
ok(rc.adopted === 1 && S.d.coins === b6 - 1000 && CC.card("lawson").pts === p6 + 50 && "lawson_1_1" in K.st().net.rec && (x1.pick ? KN.pending("lawson").length === 1 : K.got(x1.id) >= 1 && rc.got.length === 1), "へんじが こなかった じぶんの くじを あとで うけとる（コイン 1000・ポイント 50）" + JSON.stringify(rc));
rc = await KN.reconcile("lawson");
ok(rc.adopted === 0 && S.d.coins === b6 - 1000, "2かい うけとらない");
// ID が かわる
KN.account("someone-else");
ok(K.st().net.uid === "someone-else" && JSON.stringify(K.st().net.rec) === "{}", "ID が かわると rec を わすれる");
// けす: じぶんの くじの なまえ（u）を ""・ほかの 人の くじは のこる・kujime も けす
reset(); KN.setMode(true);
await KN.load("lawson");
r = await KN.draw("lawson", 3);
const meW = N.uid(), W2 = await sign();
await other(W2, "lawson", 1, 3);
await KN.load("sevenbun"); await KN.draw("sevenbun", 1);
ok(fake.at(`v1/kujime/${meW}`) && Object.keys(fake.at(`v1/kujime/${meW}`)).sort().join() === "lawson_l1,sevenbun_l1", "じぶんの きろく（kujime）");
await O.wipe();
const lw = fake.at("v1/kuji/lawson/lots/l1/d");
ok(["k0", "k1", "k2"].every((k) => lw[k].u === "" && typeof lw[k].t === "number") && lw.k3.u === W2.uid && fake.at("v1/kuji/sevenbun/lots/l1/d/k0/u") === "" && !fake.at(`v1/kujime/${meW}`) && fake.at("v1/kuji/lawson/lots/l1/n") === 4 && !fake.users.includes(meW), "けす: じぶんの くじは だれか わからなく（はこの なかみは そのまま）・ほかの 人の くじは のこる・アカウントも");
ok(KN.derive("lawson", 1, fake.at("v1/kuji/lawson/lots/l1")).n === 4, "けした あとも ロットの けいさんは おなじ");
// ルールを はりなおす まえ（まえの きまり）: みんなの くじは よめない・「けす」は くじの ぶんを たさずに ほかの データを けす（たすと 1かいの PATCH ごと とおらない）
reset(); KN.setMode(true); oldRules = true;
KN.watch("lawson", () => {});
for (let i = 0; i < 100 && KN.state() !== "denied"; i++) await new Promise((ok2) => setTimeout(ok2, 20));
ok(KN.state() === "denied", "まえの きまり: みんなの くじは よめない（denied）");
KN.unwatch();
const meO = await O.ensure(), sent = [], keepFetch = N.fetchFn;
N.fetchFn = async (url, opt = {}) => { if (opt.method === "PATCH") sent.push(String(opt.body)); return keepFetch(url, opt); };
let wiped = true; try { await O.wipe(); } catch (e) { wiped = false; }
N.fetchFn = keepFetch; oldRules = false;
ok(wiped && fake.at(`v1/players/${meO}`) == null && !fake.users.includes(meO) && sent.length >= 1 && !sent.some((b) => /"kuji(me)?\//.test(b)), "まえの きまり: 「けす」は くじの ぶんを たさずに ほかの データと アカウントを けす " + sent.join(" "));

// ---- 4. ルール ----
const rules = JSON.parse(read("firebase/database.rules.json")).rules.v1, KR = rules.kuji.$store, KM = rules.kujime.$uid;
const storeRe = new RegExp(/matches\(\/(.+?)\/\)/.exec(KR[".validate"])[1]);
ok(K.STORES.every((s) => storeRe.test(s)) && !storeRe.test("family") && !storeRe.test("lawsonx"), "ルール: おみせは ローリソン・せぶんぶん だけ");
ok(KR[".read"] === "auth != null" && !(".write" in KR) && !(".read" in rules.kuji) && !(".write" in rules.kuji), "ルール: くじは ログインした 人が おみせごとに よめる・まとめて かけない");
ok(new RegExp(`newData\\.val\\(\\) <= ${KN.MAX} `).test(KR.lots.$lot.n[".write"]) && KR.cur[".write"].includes(`.child('n').val() === ${KN.MAX}`), "ルール: 1ロット 80まい（KujiNet.MAX）・うりきれたら つぎの ロット");
const KD = KR.lots.$lot.d.$k;
ok(KD[".write"].includes("newData.child('t').val() === now") && KD[".write"].includes("newData.child('u').val() === auth.uid") && KD[".write"].includes("$k === 'k' + ") && KD[".write"].includes("!data.exists()"), "ルール: くじは じぶんの ID・サーバーの いま・ひいた まい数の ばんごう・1かいだけ");
ok(KD.u[".write"].includes("newData.val() === ''") && KD.p[".write"].includes("!data.exists()") && KD.o[".validate"].includes("child('pc').val() === newData.val() + 1") && KD.$other[".validate"] === false && KR.lots.$lot.$other[".validate"] === false && KR.$other[".validate"] === false, "ルール: なまえを けす・えらぶのは 1かい・えらんだ じゅん・ほかの こうもくは かけない");
ok(KM[".read"] === "auth != null && auth.uid === $uid" && KM[".write"] === "auth != null && auth.uid === $uid" && /lawson\|sevenbun/.test(KM.$key[".validate"]), "ルール: じぶんの きろく（kujime）は じぶんだけ");
const fakeSrc = read("tests/online-fake.mjs");
ok(fakeSrc.includes(`KUJI_STORE = /${storeRe.source}/`) && fakeSrc.includes(`KUJI_MAX = ${KN.MAX}`) && fakeSrc.includes("KUJI_ME = /^(lawson|sevenbun)_l[0-9]{1,6}$/") && KM.$key[".validate"].includes("/^(lawson|sevenbun)_l[0-9]{1,6}$/"), "にせの サーバーも おなじ きまり（くわしくは tools/rules-emulator.mjs で 本物の エミュレーターと くらべる）");
ok(read("tools/rules-emulator.mjs").includes("いちばんくじ（みんなの くじ・UI-100）") && read("firebase/README.md").includes("v1/kuji/"), "エミュレーターの ためし・README の データの かたち");
N.fetchFn = null; N.over = null; N.auth = null; N.pending = null;
await fake.close();

// ---- 5. ことば ----
const code = src.split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ [^"`]*$/, "")).join("\n");
for (const m of code.matchAll(/"([^"\n]*)"|`([^`\n]*)`/g)) { const t = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ""); ok(!KANJI.test(t), `kuji-net.js の ことばに 漢字: ${t.slice(0, 40)}`); }
const ui = read("js/kuji-ui.js");
for (const t of ["ひとりの くじ", "みんなの くじ", "みんなの けっか（あたらしい じゅん）", "みんなの くじの はこから ひいて いるよ…", "ほかの ひとが さきに えらんだよ。べつの ものを えらんでね", "ひいた くじ（なんまいめ・じこく・えらんだ しゅるい）を おくるよ"]) ok(ui.includes(t), "がめんの ことば: " + t);
ok(read("js/online.js").includes("いちばんくじの けっか（「みんなの くじ」で ひいた とき だけ。なんまいめ・じこく・えらんだ しゅるい）") && read("js/online.js").includes("みんなの くじは だれが ひいたか わからなく するよ"), "同意の まどの おくる もの・けす ときの せつめい");
ok(D.kujiNet("lawson") && "pending" in D.kujiNet("lawson") && typeof D.kujiNetT === "function" && typeof D.kujiNetMode === "function", "PokaDebug.kujiNet・kujiNetT・kujiNetMode");

console.log(`✓ みんなの くじ（UI-100）: ${n} 項目`);
process.exit(0);
