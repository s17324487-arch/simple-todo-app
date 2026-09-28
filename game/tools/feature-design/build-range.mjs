// ⑥ 射撃場（本格 エアガン シューティング）: 元データ（range-data.mjs）を 検査し、BB弾の 弾道を 計算し、じどうで あそんで ★の めやすを きめ、
//   JSON・ゲームに そのまま 入れられる JS・一覧（GUN_LIST.md）に する。
// ・じゅう 9しゅ（ハンドガン・ライフル・スナイパー ライフル 3しゅずつ）: 性能の はんい・うごく しくみ・サイト・エネルギー（0.98J 以下 = 日本の 18さい以上用）・ことばの 長さ
// ・弾道: ゼロインの きょりで ねらった 高さに あたる・ハンドガンは 5〜10m・ライフルは 10〜20m・スナイパーは 30〜50m で 大きく ずれない・70m では おちる
// ・しゅもく 6つ（しゅるい ごとに 2つ）: 的の 形・ルールの 数・参照・ことば
// ・こうかおん: SOUND の 名前が sound.js か NEW_SE に ある・NEW_SE は まだ sound.js に ない 名前
// ・せりふ（RO・えらんだ 子・おうえん）・射撃場の 人の 服・町に たてる 場所（OUTSIDE。game-vm.mjs で ゲームの 地図を しらべる）
// ・人に にせた じどう あそび（RangeRef.bot の kid / casual / good）で 1しゅ 8かいずつ あそび、しゅもく ごとに ★の めやすを きめる
//   ★1 = いちばん あう じゅうでの kid の へいきん（なんかいか やれば とどく。kid と casual の まんなか より むずかしく しない）・★2 = casual の すこし した・★3 = casual と good の あいだ
//   （casual・good・kid の まんなかの 値は じゅう 3しゅの へいきんの 中央値）
//   タイムは みじかいほど よい（≦）、てん・ヒット ファクターは 大きいほど よい（≧）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";
import { itemIds, probeOutside, run } from "./game-vm.mjs";
import { CATS, GUNS, COURSES, BALLISTICS, HOLD, PAY, SOUND, NEW_SE, STAFF, TALK, OUTSIDE } from "./range-data.mjs";
export const OUT = new URL("../../docs/design/features/range/", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });
const errors = [], width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const longRow = (where, t, max = 30) => { for (const row of String(t).split("\n")) if (width(row) > max) errors.push(`${where}: 1行が 長い（${width(row)}）「${row}」`); };
const between = (where, v, lo, hi) => { if (!(typeof v === "number" && v >= lo && v <= hi)) errors.push(`${where}=${v} が ${lo}〜${hi} の そと`); };
const r1 = (n) => Math.round(n * 10) / 10, r2 = (n) => Math.round(n * 100) / 100;
const energy = (g) => 0.5 * (g.bb / 1000) * g.v0 * g.v0;

// ---- じゅう ----
const POWER = { gbb: "ガス ブローバック", gas: "ガス", aeg: "でんどう", spring: "エアー コッキング" };
const ACTION = { semi: "セミオート", da: "ダブル アクション", auto: "フルオート", lever: "レバー アクション", bolt: "ボルト アクション", single: "1ぱつずつ こめる" };
const SIGHT = { notch3: "3ドット", ramp: "あかい ランプ", notch: "U の みぞ", peep: "ピープ（まるい あな）", buckhorn: "バックホーン（V）", diopter: "ダイオプター", scope: "スコープ" };
const ids = new Set();
for (const g of GUNS) {
  const w = `じゅう ${g.id}`;
  if (ids.has(g.id)) errors.push(`${w} が 2つ`); ids.add(g.id);
  if (!CATS[g.cat]) errors.push(`${w}: しゅるい ${g.cat} が ない`);
  if (!POWER[g.power]) errors.push(`${w}: power ${g.power}`);
  if (!ACTION[g.action]) errors.push(`${w}: action ${g.action}`);
  if (!SIGHT[g.sight]) errors.push(`${w}: sight ${g.sight}`);
  for (const [k, lo, hi] of [["len", 150, 1200], ["h", 100, 300], ["bb", 0.12, 0.4], ["v0", 50, 100], ["group", 0.3, 6], ["hip", 5, 30], ["rate", 0.5, 20], ["mag", 1, 40],
    ["reload", 0, 3], ["empty", 0, 1], ["recoil", 0.5, 15], ["back", 0, 1], ["weight", 0.3, 6], ["zero", 5, 50], ["sh", 0.01, 0.1], ["hop", 0.8, 1.5]]) between(`${w}.${k}`, g[k], lo, hi);
  if (energy(g) > 0.98) errors.push(`${w}: ${energy(g).toFixed(3)}J は 0.98J（18さい以上用の きまり）を こえる`);
  if (g.action === "da" && !(g.pull > 0 && g.pull < 0.5)) errors.push(`${w}: ダブル アクションは ひきがねの 時間 pull が いる`);
  if ((g.action === "bolt" || g.action === "lever") && !(g.cycle > 0 && g.cycle < 1.5)) errors.push(`${w}: ${g.action} は cycle が いる`);
  if ((g.action === "lever" || g.action === "single") && !(g.perRound > 0 && g.perRound < 2)) errors.push(`${w}: ${g.action} は 1ぱつずつ こめる 時間 perRound が いる`);
  if ((g.action === "lever" || g.action === "single") && g.reload) errors.push(`${w}: ${g.action} は マガジンが ない（reload は 0）`);
  if (g.action !== "lever" && g.action !== "single" && !(g.reload > 0)) errors.push(`${w}: reload が いる`);
  if (g.action === "auto" && !(g.rate >= 8)) errors.push(`${w}: フルオートは 1びょうに 8はつ いじょう`);
  if (g.power === "gbb" && !(g.empty > 0)) errors.push(`${w}: ガス ブローバックは たまが なくなると スライドが とまる（empty が いる）`);
  if (g.power !== "gbb" && g.empty) errors.push(`${w}: empty は ガス ブローバックだけ`);
  if (g.sight === "scope") { if (!(Array.isArray(g.zoom) && g.zoom[0] >= 1.5 && g.zoom[1] > g.zoom[0] && g.zoom[1] <= 16)) errors.push(`${w}: スコープの zoom は [さいしょう, さいだい]`); if (g.cat !== "sniper") errors.push(`${w}: スコープは スナイパーだけ`); }
  else if (!(typeof g.zoom === "number" && g.zoom >= 1 && g.zoom <= 4)) errors.push(`${w}: zoom は 1〜4`);
  if (g.cat === "sniper" && g.sight !== "scope") errors.push(`${w}: スナイパーは スコープ`);
  for (const k of ["name", "ref", "desc", "fact"]) { if (!g[k]) errors.push(`${w}: ${k} が ない`); else longRow(`${w}.${k}`, g[k], k === "ref" ? 40 : 30); }
  if (width(g.name) > 12) errors.push(`${w}: 名前が 長い「${g.name}」`);
  if ((g.desc || "").split("\n").length > 3 || (g.fact || "").split("\n").length > 3) errors.push(`${w}: desc / fact は 3行まで`);
}
for (const [c, v] of Object.entries(CATS)) {
  if (GUNS.filter((g) => g.cat === c).length !== 3) errors.push(`${c}: じゅうが 3しゅで ない`);
  if (v.unlock && !(CATS[v.unlock.cat] && v.unlock.stars >= 1 && v.unlock.stars <= 3)) errors.push(`${c}: unlock が おかしい`);
}

// ---- しゅもく ----
const KIND = { steel: "time", bull: "points", ipsc: "hf", issf: "points", long: "points", run: "points" }, ENV = ["indoor", "hall", "field"];
const tshape = { steel: ["round", "stop"], ipsc: ["ipsc", "ns", "popper"], long: ["gong"] };
for (const [cid, c] of Object.entries(COURSES)) {
  const w = `しゅもく ${cid}`;
  if (!CATS[c.cat]) errors.push(`${w}: しゅるい ${c.cat} が ない`);
  if (!ENV.includes(c.env)) errors.push(`${w}: env ${c.env}`);
  if (KIND[c.kind] !== c.score) errors.push(`${w}: kind ${c.kind} の てんの かぞえかたは ${KIND[c.kind]}`);
  if (!c.name || width(c.name) > 16) errors.push(`${w}: 名前が ない か 長い「${c.name}」`);
  if (!c.rule || c.rule.split("\n").length > 3) errors.push(`${w}: rule は 3行まで`); else longRow(`${w}.rule`, c.rule);
  const tids = new Set((c.targets || []).map((t) => t.id));
  if (tids.size !== (c.targets || []).length) errors.push(`${w}: 的の id が かさなる`);
  for (const t of c.targets || []) {
    if (!(tshape[c.kind] || []).includes(t.shape)) errors.push(`${w}: ${t.id} の 形 ${t.shape} は つかえない`);
    between(`${w}.${t.id}.z`, t.z, 3, 80); between(`${w}.${t.id}.x`, t.x, -8, 8);
    if (t.act && !(tids.has(t.act) && c.targets.find((x) => x.id === t.act).wait)) errors.push(`${w}: ${t.id} が うごかす ${t.act} が ない（wait: true の 的）`);
    if (t.swing && !(t.swing.amp > 0 && t.swing.period > 0)) errors.push(`${w}: ${t.id} の swing`);
    if (t.rail && !(t.rail.to > t.rail.from && t.rail.speed > 0)) errors.push(`${w}: ${t.id} の rail`);
  }
  if (c.kind === "steel") {
    if (!(c.strings >= 3 && c.drop >= 0 && c.drop < c.strings && c.penalty > 0 && c.standby[0] < c.standby[1] && c.raise > 0)) errors.push(`${w}: ストリングの 数・ペナルティ・スタンバイ`);
    if (c.targets.length !== 5 || c.targets.filter((t) => t.stop).length !== 1) errors.push(`${w}: プレート 5まい（ストップ 1まい）`);
  }
  if (c.kind === "bull") {
    if (!(c.series >= 1 && c.shots >= 1 && c.time > 0 && c.card.gauge >= 0)) errors.push(`${w}: series・shots・time・gauge`);
    const rs = c.card.rings; if (!rs.every((r, i) => !i || (r.d > rs[i - 1].d && r.pts <= rs[i - 1].pts))) errors.push(`${w}: リングは うちがわから じゅんに`);
  }
  if (c.kind === "issf" && !(c.shots >= 1 && c.time > 0 && c.card.step > 0 && c.card.size > 0)) errors.push(`${w}: shots・time・card`);
  if (c.kind === "ipsc") {
    const Z = c.zones; if (!(Z.A > Z.C && Z.C > Z.D && Z.D >= 0 && c.popper > 0 && c.perPaper >= 1 && c.miss > 0 && c.ns > 0 && c.limit > 0)) errors.push(`${w}: IPSC の てん`);
    if (!c.targets.some((t) => t.shape === "ns") || !c.targets.some((t) => t.rail) || !c.targets.some((t) => t.swing)) errors.push(`${w}: NS・うごく 的（rail）・ふりこの 的（swing）が いる`);
  }
  if (c.kind === "long") {
    if (!(c.per >= 1 && c.shots === c.per * c.targets.length && c.time > 0 && c.wind[1] > c.wind[0] && c.gust[1] > c.gust[0] && c.targets.every((t) => t.pts > 0 && t.d > 0))) errors.push(`${w}: かぜ・かねの てん・shots = per × かねの 数`);
    if (!c.targets.every((t, i) => !i || (t.z > c.targets[i - 1].z && t.pts > c.targets[i - 1].pts))) errors.push(`${w}: かねは ちかい じゅんに（とおいほど てんが 高い）`);
  }
  if (c.kind === "run" && !(c.runs.length >= 2 && c.runs.every((v) => v > 0) && c.window > 0 && c.z > 0 && c.d > 0 && c.wait[1] > c.wait[0])) errors.push(`${w}: はしる 的`);
}
for (const c of Object.keys(CATS)) if (Object.values(COURSES).filter((x) => x.cat === c).length !== 2) errors.push(`${c}: しゅもくが 2つで ない`);
between("BALLISTICS.cd", BALLISTICS.cd, 0.1, 0.6); between("HOLD.breath", HOLD.breath, 1, 10);
for (const a of Object.keys(ACTION)) if (!(HOLD.trigger[a] >= 0)) errors.push(`HOLD.trigger.${a} が ない`);

// ---- こうかおん ----
const SE = new Set([...readFileSync(new URL("../../js/sound.js", import.meta.url), "utf8").matchAll(/case "([a-z_]+)"/g)].map((m) => m[1]));
for (const [n, parts] of Object.entries(NEW_SE)) {
  if (SE.has(n)) errors.push(`NEW_SE.${n} は もう sound.js に ある`);
  if (!/^rg_[a-z]+$/.test(n)) errors.push(`NEW_SE.${n}: 名前は rg_ で はじめる`);
  for (const [fn, o] of parts) if (!(["T", "N"].includes(fn) && o.dur > 0 && o.dur <= 1.5 && o.vol > 0 && o.vol <= 0.4)) errors.push(`NEW_SE.${n}: ${fn} ${JSON.stringify(o)}`);
}
const seNames = (v) => (typeof v === "string" ? [v] : Object.values(v).flatMap(seNames));
for (const n of seNames(SOUND)) if (!SE.has(n) && !NEW_SE[n]) errors.push(`こうかおん ${n} が sound.js にも NEW_SE にも ない`);
for (const p of Object.keys(POWER)) if (!SOUND.fire[p]) errors.push(`SOUND.fire.${p} が ない`);
for (const s of ["round", "stop", "popper", "gong"]) if (!SOUND.hit[s]) errors.push(`SOUND.hit.${s} が ない`);

// ---- せりふ ----
for (const t of TALK.first.concat(TALK.lines, [TALK.lock, TALK.pick], Object.values(TALK.result))) { longRow("talk", t); if (t.split("\n").length > 3) errors.push(`talk: 3行まで「${t}」`); }
for (const [k, t] of Object.entries(TALK.cmd)) if (width(t) > 20) errors.push(`talk.cmd.${k}: 20もじ まで「${t}」`);
for (const who of ["wanko", "gachan", "goji"]) {
  if (!TALK.go[who] || !TALK.cheer[who]) { errors.push(`せりふ: ${who} が ない`); continue; }
  for (const t of TALK.go[who]) longRow(`go.${who}`, t, 24);
  for (const k of ["hit", "combo", "hurry", "end"]) { if (!TALK.cheer[who][k]) errors.push(`cheer.${who}.${k} が ない`); else for (const t of TALK.cheer[who][k]) if (width(t) > 14) errors.push(`cheer.${who}.${k}: おうえんは 14もじ まで「${t}」`); }
}
for (const it of Object.values(STAFF.outfit)) if (!itemIds.has(it)) errors.push(`射撃場の 人: 服 ${it} が ゲームに ない`);
if (run("typeof TALKS !== 'undefined' && !!TALKS[" + JSON.stringify(STAFF.talk) + "]")) errors.push(`TALKS.${STAFF.talk} が もう ある`);
// 町に たてる 場所
const pr = probeOutside(OUTSIDE);
for (const e of pr.err) errors.push(`射撃場（${OUTSIDE.map} の ${OUTSIDE.x},${OUTSIDE.y}）: ${e}`);
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

// ---- 弾道（RangeRef と 同じ 計算）----
const ctx = { Math, JSON, console }; vm.createContext(ctx);
for (const [f, n] of [["gun-art-ref.js", "GunArtRef"], ["range-ref.js", "RangeRef"]]) vm.runInContext(readFileSync(new URL("./" + f, import.meta.url), "utf8") + `;globalThis.${n}=${n};`, ctx, { filename: f });
const RR = ctx.RangeRef, DS = [5, 10, 20, 30, 40, 50, 60, 70], HOPS = [0, 5, 10, 15, 20];
const table = {}, hopTable = {};
for (const g of GUNS) {
  const b = RR.ballistics(g, g.hop, BALLISTICS), cm = (d) => b.at(d).y * 100;
  table[g.id] = DS.map((d) => { const a = b.at(d); return { d, y: r1(a.y * 100), t: r2(a.t), v: Math.round(a.v), wind: r1(RR.drift(g, d, a.t, 1) * 100) }; });
  if (Math.abs(cm(g.zero)) > 0.5) errors.push(`${g.id}: ゼロイン ${g.zero}m で ${r1(cm(g.zero))}cm ずれる`);
  // ライフルは サイトが たかい（AR がたは じゅうこうより 6.5cm 上）ので、ゼロインより ちかいと その ぶん したに あたる（ほんものと 同じ）
  const near = g.cat === "hand" ? [5, 10] : g.cat === "rifle" ? [10, 20] : [30, 40, 50], lim = g.cat === "hand" ? 2 : g.cat === "rifle" ? g.sh * 100 : 15;
  for (const d of near) if (Math.abs(cm(d)) > lim) errors.push(`${g.id}: ${d}m で ${r1(cm(d))}cm ずれる（${lim}cm まで）`);
  if (g.cat === "sniper" && !(cm(70) < -15 && cm(70) > -150)) errors.push(`${g.id}: 70m で ${r1(cm(70))}cm（-15〜-150cm に する: スコープの めもりで ねらいを 上げる あそびに なる）`);
  if (g.cat !== "hand") hopTable[g.id] = HOPS.map((st) => { const h = RR.ballistics(g, RR.hopAt(g, st, BALLISTICS), BALLISTICS); return { step: st, y: [20, 30, 50, 70].map((d) => r1(h.at(d).y * 100)) }; });
}
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

// ---- じどうで あそんで ★を きめる ----
const DATA0 = { cats: CATS, guns: GUNS, courses: COURSES, ballistics: BALLISTICS, hold: HOLD, pay: PAY };
const RUNS = 12, SK = ["kid", "casual", "good"], sim = {};
const play = (cid, gid, sk, i) => {
  // seed は うつ 人で かえない（かぜ・はしる 的の でかたが 同じ で くらべる）
  const G = new RR.Game(DATA0, cid, gid, { seed: `sim:${cid}:${gid}:${i}`, W: 360, H: 700 }); let n = 0;
  while (G.phase !== "end" && n++ < 60 * 600) G.update(1 / 60, RR.bot(G, sk));
  if (G.phase !== "end") errors.push(`${cid} / ${gid} / ${sk}: 10ぷん たっても おわらない`);
  return G.result;
};
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length, med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
for (const [cid, c] of Object.entries(COURSES)) {
  sim[cid] = {};
  for (const g of GUNS.filter((x) => x.cat === c.cat)) {
    sim[cid][g.id] = {};
    for (const sk of SK) { const r = Array.from({ length: RUNS }, (_, i) => play(cid, g.id, sk, i)); sim[cid][g.id][sk] = { avg: r2(mean(r)), min: Math.min(...r), max: Math.max(...r) }; }
  }
}
const courses = JSON.parse(JSON.stringify(COURSES)), mid = {};
const ROUND = { time: (v) => Math.round(v * 10) / 10, points: (v) => Math.round(v), hf: (v) => Math.round(v * 100) / 100 };
for (const [cid, c] of Object.entries(courses)) {
  const guns = Object.keys(sim[cid]), m = (sk) => med(guns.map((id) => sim[cid][id][sk].avg)), K = m("kid"), Cm = m("casual"), Gm = m("good");
  const rnd = c.kind === "issf" ? (v) => Math.round(v * 10) / 10 : ROUND[c.score], dir = c.score === "time" ? -1 : 1, ok = (v, s) => (dir > 0 ? v >= s : v <= s);
  const Kb = dir > 0 ? Math.max(...guns.map((id) => sim[cid][id].kid.avg)) : Math.min(...guns.map((id) => sim[cid][id].kid.avg));
  mid[cid] = { kid: r2(K), kidBest: r2(Kb), casual: r2(Cm), good: r2(Gm) };
  const easier = (a, b) => (dir > 0 ? Math.min(a, b) : Math.max(a, b));
  c.stars = [rnd(easier(Kb, K + (Cm - K) * 0.5)), rnd(Cm - (Cm - K) * 0.1), rnd(Cm + (Gm - Cm) * 0.55)];
  const [a, b, cc] = c.stars.map((v) => v * dir);
  if (!(a < b && b < cc)) errors.push(`${cid}: ★の めやすが じゅんに ならんで いない ${c.stars.join(" / ")}`);
  if (dir * (Gm - Cm) < dir * (Cm - K) * 0.08) errors.push(`${cid}: casual と good の さが 小さすぎる（${r2(Cm)} / ${r2(Gm)}）`);
  for (const id of guns) if (!ok(sim[cid][id].good.avg, c.stars[0])) errors.push(`${cid}: ${id} は good でも ★1 に とどかない（${sim[cid][id].good.avg}）`);
  if (!guns.some((id) => ok(sim[cid][id].good.avg, c.stars[2]))) errors.push(`${cid}: どの じゅうでも good の へいきんが ★3 に とどかない`);
  if (!guns.some((id) => ok(dir > 0 ? sim[cid][id].kid.max : sim[cid][id].kid.min, c.stars[0]))) errors.push(`${cid}: kid は どの じゅうでも ★1 に とどかない`);
}
// ライフル・スナイパーを あけられるか（kid でも ★1 が とれる しゅもくが その しゅるいに ある）
for (const [c, v] of Object.entries(CATS)) if (v.unlock) {
  const can = Object.entries(courses).filter(([, x]) => x.cat === v.unlock.cat).some(([cid, x]) => Object.values(sim[cid]).some((s) => (x.score === "time" ? s.kid.min <= x.stars[0] : s.kid.max >= x.stars[0])));
  if (!can) errors.push(`${c}: kid では ${v.unlock.cat} で ★1 が とれず、あけられない`);
}
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

const DATA = { version: 2, cats: CATS, guns: GUNS, courses, ballistics: BALLISTICS, hold: HOLD, pay: PAY, sound: SOUND, staff: STAFF, talk: TALK,
  outside: { ...OUTSIDE, door: Math.floor(OUTSIDE.w / 2), doorAt: pr.door, front: pr.front } };
writeFileSync(OUT + "range.json", JSON.stringify({ ...DATA, newSe: NEW_SE, table, hopTable, sim, mid }, null, 1));
writeFileSync(OUT + "range-data.js", `// 射撃場の データ（⑥ じゅう 9しゅ・しゅもく 6つ・弾道・ゆれ・★の めやす・こうかおん・せりふ・町に たてる 場所）。docs/design/features/range/ から 自動生成。手で 直さず、tools/feature-design/range-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/range-data.js に 置き、index.html と sw.js の 両方に 登録（range.js より 前）。\nconst RANGE_DATA = ${JSON.stringify(DATA)};\n`);

// ---- 一覧 ----
const catName = (c) => CATS[c].name, fmt = (c, v) => (c.score === "time" ? v.toFixed(1) + "びょう" : c.score === "hf" ? v.toFixed(2) : c.kind === "issf" ? v.toFixed(1) : String(v));
const cmp = (c) => (c.score === "time" ? "いか" : "いじょう");
const scoreName = { time: "タイム（みじかいほど よい）", points: "てん（大きいほど よい）", hf: "ヒット ファクター（てん ÷ びょう）" };
let md = `# 射撃場の じゅう・弾道・しゅもく（自動生成）

⑥ だけは オーナーの 指示で AGENTS.md の 9（ほのぼの）を はずし、**実際の エアソフトガンと 射撃競技に ちかい、ゲーム性の 高い もの** に した。
数は 実物・実際の ルールを もとに し、あわない ところは ゲームで ためして きめた（下の「出典」と「ゲームで きめた 値」）。名前・絵は オリジナル（刻印・ロゴなし）。

- たまは 6mm の BB弾。エネルギーは ぜんぶ 0.98J いか（日本の 18さい以上用の きまり）。
- じゅうこうの さきの オレンジは 描かない（日本の エアソフトガンには ない。\`GunArtRef.svg(gun, { tip: true })\` で 描ける）。

## じゅう 9しゅ

| id | しゅるい | ゲームの 名前 | 参考に した 形 | 長さ×高さ | 動力 | うごき | BB | 初速 | エネルギー | まとまり（10m） | れんしゃ | たま | リロード | はねあがり | おもさ | サイト | ばいりつ | ゼロイン | ホップ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;
md += GUNS.map((g) => `| ${g.id} | ${catName(g.cat)} | ${g.name} | ${g.ref} | ${g.len}×${g.h}mm | ${POWER[g.power]} | ${ACTION[g.action]}${g.pull ? `（ひきがね ${g.pull}びょう）` : ""}${g.cycle ? `（${g.cycle}びょう）` : ""} | ${g.bb}g | ${g.v0}m/s | ${energy(g).toFixed(2)}J | ${g.group}cm | ${g.rate}/びょう | ${g.mag} | ${g.reload ? g.reload + "びょう" + (g.empty ? `（とまった とき +${g.empty}）` : "") : `1ぱつ ${g.perRound}びょう`} | ${g.recoil}mrad（もどり ${Math.round(g.back * 100)}%） | ${g.weight}kg | ${SIGHT[g.sight]} | ${Array.isArray(g.zoom) ? g.zoom.join("〜") + "ばい" : "×" + g.zoom} | ${g.zero}m | ${g.hop} |`).join("\n");
md += `\n\n| id | せつめい | まめちしき |\n| --- | --- | --- |\n` + GUNS.map((g) => `| ${g.id} | ${g.desc.replace(/\n/g, " ")} | ${g.fact.replace(/\n/g, " ")} |`).join("\n");
md += `\n\n- まとまり: サイトを のぞいて しっかり かまえた ときの 10m での ちょっけい（ばらつきの 95%）。のぞかない ときは \`hip\`（mrad）。きょりが のびると ばらつきも ふえる（${BALLISTICS.spreadGrow}m で 2ばい）。
- はねあがり: 1ぱつ ごとに ねらいが 上へ ずれる（mrad）。\`back\` の わりあいは 0.12びょうで 自然に もどり、のこりは 自分で もどす。
- ひきがねの ぶれ（のぞいて いる とき）: ${Object.entries(HOLD.trigger).map(([k, v]) => `${ACTION[k]} ${v}`).join("・")} mrad。

## 弾道（BB弾・ホップ いつもの つよさ・ねらった 点からの 高さ cm）

くうきの ていこう（速さの 2じょう・cd ${BALLISTICS.cd}）＋ ホップアップの 浮く 力（逆回転の マグヌス効果。いつもの ホップ = うった しゅんかん じゅうりょくと ほぼ つりあう。回転は 速さほど はやく へらないので (速さ ÷ 初速)^${BALLISTICS.liftExp}）＋ じゅうりょく。サイトは ゼロインの きょりで あう ように じゅうこうを すこし 上に むけて ある。

| じゅう | ${DS.map((d) => d + "m").join(" | ")} | とぶ 時間 30m / 50m / 70m | かぜ 1m/s で ながれる 30m / 50m / 70m |
| --- | ${DS.map(() => "---").join(" | ")} | --- | --- |
`;
md += GUNS.map((g) => { const T = table[g.id], at = (d) => T.find((x) => x.d === d); return `| ${g.name} | ${T.map((x) => (x.y > 0 ? "+" : "") + x.y).join(" | ")} | ${[30, 50, 70].map((d) => at(d).t.toFixed(2)).join(" / ")}びょう | ${[30, 50, 70].map((d) => at(d).wind).join(" / ")}cm |`; }).join("\n");
md += `\n\n### ホップ ダイヤル（0〜${BALLISTICS.hop.steps}・まんなか ${BALLISTICS.hop.steps / 2} が いつもの つよさ ×${BALLISTICS.hop.min}〜×${BALLISTICS.hop.max}）: 20m / 30m / 50m / 70m での 高さ cm\n\n| じゅう | ${HOPS.map((s) => "ダイヤル " + s).join(" | ")} |\n| --- | ${HOPS.map(() => "---").join(" | ")} |\n`;
md += Object.entries(hopTable).map(([id, rows]) => `| ${GUNS.find((g) => g.id === id).name} | ${rows.map((r) => r.y.join(" / ")).join(" | ")} |`).join("\n");
md += `\n\nホップを つよく すると とおくで おちにくく なるが、ちかくでは 上に あがる。スナイパーは ダイヤルと スコープの めもり（1mrad = 10m で 1cm）で あわせる。

## ゆれ・いき（のぞいて いる とき）

- ゆれの 大きさ（mrad）= ${Object.entries({ hand: "ハンドガン", rifle: "ライフル", sniper: "スナイパー" }).map(([k, v]) => `${v} ${HOLD[k]}`).join("・")} ÷ √（おもさ ÷ もとの おもさ）。2つの ゆっくりした なみを かさねた うごき。
- いきを とめる（おしている あいだ）: ゆれ ×${HOLD.calm}。${HOLD.breath}びょうで いきが きれ、ゆれ ×${HOLD.shake} の ふるえが ${HOLD.rest}びょう つづく。
- ねらいを 大きく うごかした あとは ゆれが ふえ、0.45びょうで おちつく。

## しゅもく 6つ と ★の めやす（じどう あそび: 1しゅ ${RUNS}かい）

| しゅもく | しゅるい | もとの 競技 | ばしょ | てんの かぞえかた | ★1 | ★2 | ★3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
`;
const ORIGIN = { steel: "スティール チャレンジ（JSC）", bull: "APS カップ ブルズアイ", ipsc: "IPSC（プラクティカル シューティング）", issf: "ISSF 10m エアライフル（10.9 まで）", long: "ロングレンジの かね うち", run: "ISSF ランニング ターゲット（見える 時間 5 / 2.5びょう）" };
const ENVN = { indoor: "なかの レンジ", hall: "きょうぎ場", field: "そとの はら" };
md += Object.entries(courses).map(([cid, c]) => `| ${c.name}（\`${cid}\`） | ${catName(c.cat)} | ${ORIGIN[c.kind]} | ${ENVN[c.env]} | ${scoreName[c.score]} | ${fmt(c, c.stars[0])} ${cmp(c)} | ${fmt(c, c.stars[1])} ${cmp(c)} | ${fmt(c, c.stars[2])} ${cmp(c)} |`).join("\n");
md += `\n\n| しゅもく | ルール |\n| --- | --- |\n` + Object.entries(courses).map(([cid, c]) => `| ${c.name} | ${c.rule.replace(/\n/g, " ")} |`).join("\n");
md += `\n\n### じどう あそびの けっか（へいきん（さいしょう〜さいだい））\n\n| しゅもく | じゅう | kid（はじめて） | casual（ふつう） | good（じょうず） |\n| --- | --- | --- | --- | --- |\n`;
md += Object.entries(sim).map(([cid, byGun]) => Object.entries(byGun).map(([gid, s]) => `| ${courses[cid].name} | ${GUNS.find((g) => g.id === gid).name} | ${SK.map((k) => `${s[k].avg}（${s[k].min}〜${s[k].max}）`).join(" | ")} |`).join("\n")).join("\n");
md += `\n\n- ★の めやす: ★1 = いちばん あう じゅうでの kid の へいきん（なんかいか やれば とどく。kid と casual の 中央値の まんなか より むずかしく しない）・★2 = casual の 中央値より すこし した（kid の 中央値との さの 10%）・★3 = casual と good の 中央値の あいだ（55%）。中央値は じゅう 3しゅの へいきんの まんなか。
- じゅうには むき・ふむきが ある（れい: きょうぎ エアライフルは プラクティカルで おそい）。★は しゅもく × じゅう ごとに のこす。
- ごほうび: \`GameEconomy.pay\` と 同じ 形（\`shopBase.range = ${PAY.base}\` × ★0〜3 の ${PAY.rank.join(" / ")}）= ${PAY.rank.map((k) => Math.round(PAY.base * k)).join(" / ")} コイン。
- ロック: ライフルは ハンドガンの どれかの しゅもくで ★${CATS.rifle.unlock.stars}、スナイパーは ライフルで ★${CATS.sniper.unlock.stars}。

## こうかおん

| とき | 音（Sound.se） |
| --- | --- |
| うつ | ${Object.entries(SOUND.fire).map(([k, v]) => `${POWER[k]} \`${v}\``).join("・")} |
| スチール・ポッパー・かねに あたる（きょり ÷ 340m/s おくれて） | ${Object.entries(SOUND.hit).map(([k, v]) => `${k} \`${v}\``).join("・")}（紙の 的は 音なし） |
| ブザー・マガジン・ボルト／レバー・こめる・いきが きれる・シリーズ おわり | \`${SOUND.beep}\`・\`${SOUND.reload}\`・\`${SOUND.cycle}\`・\`${SOUND.load}\`・\`${SOUND.gasp}\`・\`${SOUND.series}\` |
| けっか | ★3 \`${SOUND.end[3]}\`・それ いがい \`${SOUND.end.other}\` |

\`sound.js\` の \`se(name)\` の \`switch\` に 足す case（\`T\` = tone・\`N\` = noise。いまの 書き方の まま）:

\`\`\`js
${Object.entries(NEW_SE).map(([n, parts]) => `      case "${n}": ${parts.map(([fn, o]) => `${fn}(${JSON.stringify(o).replace(/"([a-z0-9]+)":/g, "$1: ").replace(/,/g, ", ")})`).join("; ")}; break;`).join("\n")}
\`\`\`

## 町に たてる 場所

\`${OUTSIDE.map}\` の (${OUTSIDE.x}, ${OUTSIDE.y}) から ${OUTSIDE.w}×${OUTSIDE.h}マス（建物 id \`${OUTSIDE.id}\`・入口 (${pr.door.join(", ")})・入口の まえ (${pr.front.join(", ")})）。② の 町の人が「シティの しゃてきじょう」と 話す。

## ゲームで きめた 値（実物の 数が ない・そのままでは あそべない もの）

- くうきの ていこう cd ${BALLISTICS.cd}・ホップの へりかた ${BALLISTICS.liftExp}: 0.28g の BB弾が 50m まで ほぼ まっすぐ、70m で おちはじめる ように した（ホップが ないと 20m ほどで おちる・ある と 50m いじょう とぶ、と いう 説明に あわせた）。
- ゆれ・いき・ひきがねの ぶれ・はねあがり: スマホの ゆびで ねらえる 大きさに した。
- ロングレンジの かねの てん・ムービングの 的の 大きさ（ちょっけい ${COURSES.moving.d * 100}cm・20m）・スチールの プレートの 大きさと きょり（エアソフト用に 小さく・ちかく）。

## 出典

競技の ルール
- スティール チャレンジ（プレート 5まい・ストップ プレートは さいご・5ストリングで いちばん おそい 1かいを のぞく・あたらなかった プレートは +3びょう）: [Wikipedia: Steel Challenge](https://en.wikipedia.org/wiki/Steel_Challenge)・[SSUSA: Beginner's Guide To Steel Challenge](https://www.ssusa.org/content/beginner-s-guide-to-steel-challenge/)
- エアソフトの スティール チャレンジ（ストップ プレートは きいろ・ワーストを のぞく）: [JTSA 初心者入門ガイド 競技内容と道具編](https://jtsa-shooting.org/beginner/dougu)・[ジャパン スティール チャレンジ 公式](https://www.japansteelchallenge.org/)
- APS ブルズアイ（5m・5点 50mm / 8点 35mm / 10点 22mm / X 11mm・5はつ × 2・1ステージ 2ふん・かたて）: [サバゲーアーカイブ: 精密射撃APSの魅力](https://sabage-archive.com/blog/archives/11426)・[JASG APSカップ](https://airsportsgun.com/aps/)・[APSカップ 公式レギュレーション ハンドガンクラス（2022）](https://airsportsgun.com/wp-content/uploads/2022/09/4a48d73603bdea85d1966ea2b89ab822.pdf)・線に かかれば 上の てん（ちょっけい 3mm の ゲージ）: [あきゅらぼ「ひたすらブルズアイ」のルール](https://accu-labo.com/?p=2524)
- IPSC（ヒット ファクター = てん ÷ 時間・マイナー A5 / C3 / D1・ミス −10・NS −10・スチールは 5）: [Boss Components: IPSC Scoring](https://www.bosscomponents.com.au/blogs/ipsc/mastering-ipsc-scoring-a-comprehensive-guide-to-speed-accuracy-and-strategy)・[Wikipedia: IPSC](https://en.wikipedia.org/wiki/International_Practical_Shooting_Confederation)
- IPSC の 紙の 的（45×57cm・A ゾーン 15×32.5cm・C ゾーン 30×45cm）: [Shoot N Train: dimensions of an IPSC target](https://shootntrain.com/what-are-the-dimensions-of-an-ipsc-target/)・[Infinity Targets: USPSA Target Dimensions](https://infinitytargets.com/blogs/training-shooting-tips/uspsa-target-dimensions-guide)
- 10m エアライフル（10点は ちょっけい 0.5mm・10.9 まで・まとは 80×80mm）: [Wikipedia: ISSF 10 meter air rifle](https://en.wikipedia.org/wiki/ISSF_10_meter_air_rifle)・[JOC ライフル射撃](https://www.joc.or.jp/sports/rifle_shooting/index.html)
- ランニング ターゲット（10m で 2m の あいだを おそい 5びょう・はやい 2.5びょう）: [Wikipedia: 10 meter running target](https://en.wikipedia.org/wiki/10_meter_running_target)

エアソフトガン
- ホップアップ（逆回転 → マグヌス効果で 浮く・ホップが ないと 20m ほど・あると 50m いじょう）: [ハイパー道楽: BB弾の弾道学](https://www.hyperdouraku.com/colum/ballistics/index.html)・[サバゲーUPLIFT: 適正ホップ調整](https://zzinairsoft.blogspot.com/2020/04/hop-dandou-zeroin.html)
- 18さい以上用 0.98J・10さい以上用 0.135J・ゴーグル・人や 動物に むけない: [東京マルイ: 知っておきたい対象年齢のこと](https://www.tokyo-marui.co.jp/guide/age/)・[Wikipedia: エアソフトガン](https://ja.wikipedia.org/wiki/%E3%82%A8%E3%82%A2%E3%82%BD%E3%83%95%E3%83%88%E3%82%AC%E3%83%B3)・初速と 0.989J: [ハイパー道楽: エアガンの初速と規制について](https://www.hyperdouraku.com/blog/2025/03/18/shosoku/)
- かぜ（1m/s で 0.2g と 0.25g の さが 9cm）: [アームズマガジンウェブ: BB弾の重量と飛距離の関係](https://armsweb.jp/report/2359.html)・電動ガンの 有効射程 30m ぜんご: [サバイバルJP: エアガンの遠距離性能とは？](https://ameblo.jp/survival-jp/entry-12912988640.html)
- 動力の ちがい（エアー コッキング・ガス ブローバック・電動ガン）: [東京マルイ: エアソフトガン選びのポイント](https://www.tokyo-marui.co.jp/guide/choice/)
- グロック17 の ガス ブローバック（25はつ）: [東京マルイ 製品ページ](https://www.tokyo-marui.co.jp/products/gas/blowback/477)・ウィンチェスター M1873（エアー コッキングの レバー アクション）: [モケイパドック: KTW New ウィンチェスター M1873 カービン](https://www.mokei-paddock.net/shopdetail/000000005022/)
- VSR-10: [東京マルイ VSR-10 プロスナイパー Gスペック](https://www.tokyo-marui.co.jp/products/aircocking/boltaction/73)・L96 AWS（サプレッサーつき 1,120mm）: [ハイパー道楽: L96 AWS](https://www.hyperdouraku.com/airgun/l96aws/index.html)

形と 大きさ（もとに なった じゅう）
- グロック17: 長さ 186mm（[Wikipedia: Glock](https://en.wikipedia.org/wiki/Glock)）・M1911: 216mm（[Wikipedia: M1911 pistol](https://en.wikipedia.org/wiki/M1911_pistol)）・S&W M686（4インチ）: 約243mm（[Smith & Wesson M686 PLUS 4"](https://www.smith-wesson.com/product/l-frame-164194)・[Wikipedia](https://en.wikipedia.org/wiki/Smith_%26_Wesson_Model_686)）
- M4 カービン: ストックを のばして 約840mm（[Wikipedia: M4 carbine](https://en.wikipedia.org/wiki/M4_carbine)）・ウィンチェスター M1873 カービン: 約977mm（[Winchester Model 1873 Carbine](https://www.winchesterguns.com/products/rifles/model-1873/model-1873-carbine.html)）・ワルサー LG400: 約1,050〜1,110mm（[Wikipedia: Walther LG400](https://en.wikipedia.org/wiki/Walther_LG400_(16J))）
- M24 SWS: 約1,092mm（[Wikipedia: M24](https://en.wikipedia.org/wiki/M24_Sniper_Weapon_System)）・M110 SASS: 1,029〜1,181mm（[Wikipedia: M110](https://en.wikipedia.org/wiki/M110_Semi-Automatic_Sniper_System)）
`;
writeFileSync(OUT + "GUN_LIST.md", md);
console.log(`range: じゅう ${GUNS.length}しゅ（${Object.keys(CATS).map((c) => catName(c) + " " + GUNS.filter((g) => g.cat === c).length).join("・")}）／ ★ ${Object.entries(courses).map(([k, c]) => k + " " + c.stars.join("/")).join("・")}／ 町 ${OUTSIDE.map} (${OUTSIDE.x},${OUTSIDE.y})`);
