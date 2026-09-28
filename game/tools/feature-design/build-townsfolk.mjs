// ② 町の人: 元データ（townsfolk-data.mjs）を ゲームの データと 照らして 検査し、JSON・ゲームに そのまま 入れられる JS・一覧（Markdown）に する。
// ・人・マップ・アイテム・家具・服・小物の id が ゲームに あるか
// ・おねがいを うける 人が そのマップに いるか、手順の あいてが どこに いるか
// ・さがす／さわる ばしょが 歩いて 行ける ところに とれるか（ゲームの WorldMap で 調べる）
// ・20 の おねがいを folk-ref.js の しくみで 1つずつ 動かして、さいごまで すすむか
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { NPC_LINES, CROWD_LINES, BOND_LINES, REACT, BARTER, EVENTS, ITEMS } from "./townsfolk-data.mjs";
export const OUT = new URL("../../docs/design/features/townsfolk/", import.meta.url).pathname;
const GAME = new URL("../../", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });

// ゲームを 読む（画面の 部品は 空の にせもの。town-audit.mjs と 同じ やりかた）
const html = readFileSync(join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const noop = () => {}, store = new Map();
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const ctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
ctx.window = ctx; vm.createContext(ctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), ctx, { filename: f });
vm.runInContext(readFileSync(new URL("./folk-ref.js", import.meta.url), "utf8") + ";globalThis.TownFolkRef=TownFolkRef;globalThis.TownFolkArt=TownFolkArt;", ctx, { filename: "folk-ref.js" });
const GD = vm.runInContext(`({
  maps: Object.keys(MAP_DEFS),
  npcs: Object.fromEntries(Object.entries(MAP_DEFS).flatMap(([m, d]) => (d.npcs || []).map((n) => [n.id, { map: m, x: n.x, y: n.y, name: n.name, sp: n.sp }]))),
  objects: Object.fromEntries(Object.entries(MAP_DEFS).map(([m, d]) => [m, (d.objects || []).map((o) => o.id).filter(Boolean)])),
  bag: Object.keys(BAG_INDEX), wear: Object.keys(ITEM_INDEX), furn: Object.keys(FURN_INDEX), talks: Object.keys(TALKS),
})`, ctx);
const Ref = ctx.TownFolkRef;

const errors = [], warns = [], seen = new Map();
const KEYS = { t: "time", w: "weather", s: "season", f: "festival", e: "event", x: "feature", b: "bond", p: "person" };
const VALUES = {
  time: ["morning", "day", "evening", "night", "late"], weather: ["clear", "cloudy", "rain", "snow", "wind"], season: ["spring", "summer", "autumn", "winter"],
  festival: ["newyear", "setsubun", "hina", "picnic", "children", "hydrangea", "tanabata", "fireworks", "moon", "halloween", "harvest", "christmas"],
  event: ["boss"], feature: ["fishing", "fossil", "aquarium", "museum", "range", "heiwadai2"], person: Object.keys(GD.npcs),
};
function parseWhen(s, where) {
  const when = {};
  for (const tok of (s || "").split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^([a-z]+):(.+)$/), key = m && KEYS[m[1]];
    if (!key) { errors.push(`${where}: 知らない 条件 ${tok}`); continue; }
    const v = m[2];
    if (key === "bond") { if (!/^\d+$/.test(v)) errors.push(`${where}: b: は 数 ${tok}`); }
    else if (!VALUES[key].includes(key === "feature" ? v.replace(/^!/, "") : v)) errors.push(`${where}: ${key} に ない 値 ${v}`);
    (when[key] = when[key] || []).push(v);
  }
  return when;
}
// 1行の 長さ: 全角=1、半角=0.5。会話まど（375px で 1行 約15字）に 4行まで: 1ページ 2行（\n）まで・1行 30 まで・見た目の 行（15字で おりかえし）の 合計 4 まで
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
function check(text, where, { unique = true, maxLines = 2, maxW = 30 } = {}) {
  if (typeof text !== "string" || !text) { errors.push(`${where}: 文が ない`); return; }
  if (unique) { if (seen.has(text)) errors.push(`${where}: 同じ 文が ${seen.get(text)} にも ある「${text}」`); else seen.set(text, where); }
  const rows = text.split("\n");
  if (rows.length > maxLines) errors.push(`${where}: ${rows.length}行 ある（${maxLines}行まで）「${text}」`);
  for (const r of rows) if (width(r) > maxW) errors.push(`${where}: 1行が 長すぎる（${width(r)}）「${r}」`);
  const visual = rows.reduce((a, r) => a + Math.max(1, Math.ceil(width(r) / 15)), 0);
  if (visual > 4) errors.push(`${where}: 会話まどで ${visual}行に なる（4行まで）「${text.replace(/\n/g, "⏎")}」`);
  if (/[a-zA-Z]{2,}/.test(text)) errors.push(`${where}: 英字が ある「${text}」`);
  if (/[぀-ゟ]{12,}/.test(text.replace(/[、。！？…♪〜]/g, " "))) errors.push(`${where}: ひらがなが 長く つづく（文節で あける）「${text}」`);
}

// ---- 会話 ----
const lines = [];
let n = 0;
// 町の なかま（town_walker0・heiwadai_walker_3 など）は id の うしろの 数字を とった 役（town_walker・heiwadai_walker）の セリフを つかう
const roleOf = (id) => id.replace(/_?\d+$/, "");
for (const [npc, v] of Object.entries(NPC_LINES)) {
  if (!GD.npcs[npc]) errors.push(`NPC_LINES: ゲームに いない 人 ${npc}`);
  const all = [...v.lines.map((l) => [...l, "line"]), ...(BOND_LINES[npc] || []).map((l) => [...l, "bond"])];
  for (const [text, w, group] of all) { check(text, `${npc}`); lines.push({ id: `tf${String(++n).padStart(4, "0")}`, npc, group, text, when: parseWhen(w, `${npc}「${text}」`) }); }
}
for (const [role, v] of Object.entries(CROWD_LINES)) {
  if (NPC_LINES[role]) errors.push(`CROWD_LINES: ${role} は NPC_LINES にも ある`);
  if (!Object.keys(GD.npcs).some((id) => !NPC_LINES[id] && roleOf(id) === role)) errors.push(`CROWD_LINES: ${role} の 人が ゲームに いない`);
  check(v.name, `crowd ${role} の 名前`, { unique: false, maxLines: 1, maxW: 14 });
  for (const [text, w] of v.lines) { check(text, `${role}`); lines.push({ id: `tf${String(++n).padStart(4, "0")}`, npc: role, group: "crowd", text, when: parseWhen(w, `${role}「${text}」`) }); }
  if (v.lines.length < 8) errors.push(`CROWD_LINES: ${role} は 8つ いじょう`);
}
for (const npc of Object.keys(GD.npcs)) if (!NPC_LINES[npc] && !CROWD_LINES[roleOf(npc)]) errors.push(`NPC_LINES: ${npc} の セリフが ない（CROWD_LINES の 役 ${roleOf(npc)} も ない）`);
const crowd = Object.fromEntries(Object.keys(GD.npcs).filter((id) => !NPC_LINES[id] && CROWD_LINES[roleOf(id)]).map((id) => [id, roleOf(id)]));
for (const npc of Object.keys(BOND_LINES)) if (!NPC_LINES[npc]) errors.push(`BOND_LINES: ${npc} は NPC_LINES に ない`);
const react = [];
for (const [who, arr] of Object.entries(REACT)) for (const [text, w] of arr) { check(text, `react/${who}`); react.push({ id: `tr${String(++n).padStart(4, "0")}`, who, text, when: parseWhen(w, `react/${who}「${text}」`) }); }

// ---- もの の id ----
const isFishOrBone = (o) => o && (o.fish || o.bone);
function checkThing(o, where) {
  if (!o) return;
  if (o.bag && !GD.bag.includes(o.bag)) errors.push(`${where}: かばんに ない id ${o.bag}`);
  if (o.wear && !GD.wear.includes(o.wear)) errors.push(`${where}: 服に ない id ${o.wear}`);
  if (o.furn && !GD.furn.includes(o.furn)) errors.push(`${where}: 家具に ない id ${o.furn}`);
}
const needsOf = (x) => { const s = JSON.stringify(x); return [...new Set([/"fish"|"catch"/.test(s) && "fishing", /"bone"|"dig"/.test(s) && "fossil"].filter(Boolean))]; };
const barter = BARTER.map((b) => {
  const where = `barter ${b.id}`;
  if (!GD.npcs[b.npc]) errors.push(`${where}: ゲームに いない 人 ${b.npc}`);
  checkThing(b.give, where + " give"); checkThing(b.get, where + " get"); check(b.text, where, { unique: false });
  if (b.give.bag && b.get.bag && b.give.bag === b.get.bag) errors.push(`${where}: 同じ ものの こうかん`);
  return { ...b, needs: needsOf([b.give, b.get]) };
});
const ids = new Set();
for (const x of [...BARTER, ...EVENTS]) { if (ids.has(x.id)) errors.push(`id の 重複 ${x.id}`); ids.add(x.id); }

// ---- おねがい ----
const mapOf = (npc) => GD.npcs[npc] && GD.npcs[npc].map;
const events = EVENTS.map((e) => {
  const where = `event ${e.id}`;
  if (!GD.npcs[e.giver]) errors.push(`${where}: ゲームに いない 人 ${e.giver}`);
  else if (mapOf(e.giver) !== e.map) errors.push(`${where}: ${e.giver} は ${mapOf(e.giver)} に いる（map: ${e.map} に なっている）`);
  if (!(e.chance >= 0.1 && e.chance <= 0.2)) errors.push(`${where}: chance は 0.1〜0.2（${e.chance}）`);
  if (!["daily", "once"].includes(e.limit)) errors.push(`${where}: limit は daily か once`);
  for (const k of ["offer", "remind", "done"]) check(e.lines[k], `${where} ${k}`, { unique: false });
  check(e.title, `${where} title`, { unique: false, maxLines: 1, maxW: 14 });
  checkThing(e.reward, where + " reward"); checkThing(e.reward.first, where + " reward.first");
  if (!e.reward.coins && !e.reward.bag && !e.reward.furn && !e.reward.wear) errors.push(`${where}: ごほうびが ない`);
  for (const [i, s] of e.steps.entries()) {
    const sw = `${where} #${i} ${s.do}`;
    if (s.to && !GD.npcs[s.to]) errors.push(`${sw}: いない 人 ${s.to}`);
    if (s.to && s.map && mapOf(s.to) !== s.map) errors.push(`${sw}: ${s.to} は ${mapOf(s.to)} に いる`);
    if (s.map && !GD.maps.includes(s.map)) errors.push(`${sw}: ない マップ ${s.map}`);
    if (s.near && !(GD.objects[s.map] || []).includes(s.near)) errors.push(`${sw}: ${s.map} に 小物 ${s.near} が ない`);
    if (s.item && !GD.bag.includes(s.item) && !ITEMS[s.item]) errors.push(`${sw}: アイテム ${s.item} が ない`);
    if (s.say) check(s.say, `${sw} say`, { unique: false });
    if (s.do === "trade") { if (!ITEMS[s.start]) errors.push(`${sw}: start ${s.start} が ITEMS に ない`); for (const [npc, item, say] of s.chain) { if (!GD.npcs[npc]) errors.push(`${sw}: いない 人 ${npc}`); if (item && !ITEMS[item]) errors.push(`${sw}: ${item} が ITEMS に ない`); check(say, `${sw} ${npc}`, { unique: false }); } }
    if (s.do === "quiz") for (const [q, opts, a] of s.q) { check(q, `${sw} q`, { unique: false }); if (!(a >= 0 && a < opts.length)) errors.push(`${sw}: こたえの 番号が ない`); for (const o of opts) check(o, `${sw} opt`, { unique: false, maxLines: 1, maxW: 10 }); }
    if (!["buy", "give", "talk", "find", "follow", "tap", "photo", "catch", "dig", "quiz", "trade"].includes(s.do)) errors.push(`${sw}: 知らない 手順`);
  }
  const last = e.steps[e.steps.length - 1];
  const doneBy = last.to || (last.do === "trade" ? last.chain[last.chain.length - 1][0] : e.giver);
  return { ...e, when: parseWhen(e.when, where), needs: needsOf(e.steps), doneBy };
});
const kinds = new Set(EVENTS.map((e) => e.kind));
if (events.length < 20) errors.push(`おねがいが ${events.length} しか ない（20 いじょう）`);

// ---- さがす／さわる ばしょ（歩けて 入口から 行ける マス） ----
const reachCache = {};
function reach(mapId) {
  if (reachCache[mapId]) return reachCache[mapId];
  const m = vm.runInContext(`new WorldMap(${JSON.stringify(mapId)})`, ctx), d = vm.runInContext(`MAP_DEFS[${JSON.stringify(mapId)}]`, ctx);
  const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.isSolid(x, y);
  const starts = [...(d.npcs || []).map((p) => [p.x, p.y + 1])];
  for (const od of Object.values(vm.runInContext("MAP_DEFS", ctx))) for (const w of od.warps || []) if (w.to === mapId) starts.push([w.tx, w.ty]);
  const warpTiles = new Set((d.warps || []).flatMap((w) => Array.from({ length: w.w * w.h }, (_, i) => `${w.x + (i % w.w)},${w.y + Math.floor(i / w.w)}`)));
  const seenT = new Set(), out = [], q = starts.filter(([x, y]) => walk(x, y));
  for (const [x, y] of q) seenT.add(x + "," + y);
  while (q.length) {
    const [x, y] = q.shift();
    if (!warpTiles.has(x + "," + y) && x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2) out.push([x, y]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (!seenT.has(k) && walk(x + dx, y + dy)) { seenT.add(k); q.push([x + dx, y + dy]); } }
  }
  return (reachCache[mapId] = { walk, tiles: out });
}
const spotInfo = {};
for (const e of events) for (const s of e.steps) if (s.do === "find" || s.do === "tap") {
  const R = reach(s.map), need = s.do === "find" ? s.spots : s.n;
  const giver = GD.npcs[e.giver], near = s.do === "tap" && giver.map === s.map ? { x: giver.x, y: giver.y, r: 12 } : null;
  const got = Ref.spots(s.map, need, e.id + ":2026-9-27", R.walk, R.tiles, near);
  if (got.length < need) errors.push(`event ${e.id}: ${s.map} に ${need} かしょ とれない（${got.length}）`);
  spotInfo[e.id] = { map: s.map, spots: got };
}

// ---- 20 の おねがいを 動かしてみる ----
const DATA = { version: 2, lines, crowd, crowdNames: Object.fromEntries(Object.entries(CROWD_LINES).map(([k, v]) => [k, v.name])), react, barter, events, items: ITEMS, tipShare: Ref.TIP_SHARE, maxActive: Ref.MAX_ACTIVE, barterChance: Ref.BARTER_CHANCE };
const sim = [];
for (const e of events) {
  const st = { bond: {}, req: [], done: {}, barter: {}, offered: {} }, have = { bag: {}, fish: {}, bone: {} }, today = "2026-9-27", log = [];
  const c = Ref.context(e.giver, st, { hour: 11, weather: (e.when.weather || ["clear"])[0], season: (e.when.season || ["summer"])[0], festival: "tanabata", boss: false, feature: { fishing: true, fossil: true } });
  let off = null;
  for (let i = 0; i < 400 && !off; i++) off = Ref.offer(e.giver, c, st, DATA, today, have, Math.random);
  // ほかの おねがいが 出たら、ことわって その日を すすめる（この テストでは 目あての ものが 出るまで）
  let tries = 0;
  while ((!off || off.type !== "event" || off.ev.id !== e.id) && tries++ < 3000) { st.offered = {}; off = Ref.offer(e.giver, c, st, DATA, today, have, Math.random); }
  if (!off || off.ev.id !== e.id) { errors.push(`sim ${e.id}: もちかけられない`); continue; }
  Ref.answer(off, true, st, today);
  const r = st.req[0];
  log.push(`うける（もちもの: ${r.carry || "なし"}）`);
  const send = (sig) => { const mv = Ref.signal(sig, st, DATA, have, today); for (const m of mv) if (m.stepDone && m.step.do === "give") { if (m.step.item && have.bag[m.step.item]) have.bag[m.step.item] -= m.step.n; if (m.step.fish) have.fish[m.step.fish] -= m.step.n; } return mv; };
  for (const s of e.steps) {
    const cur = st.req.find((x) => x.id === e.id);
    if (!cur) break;
    let mv = [];
    if (s.do === "buy") { have.bag[s.item] = (have.bag[s.item] || 0) + s.n; mv = send({ do: "have" }); }
    else if (s.do === "give") { if (!ITEMS[s.item]) { if (s.fish) have.fish[s.fish] = (have.fish[s.fish] || 0) + s.n; else have.bag[s.item] = Math.max(have.bag[s.item] || 0, s.n); } mv = send({ do: "talk", npc: s.to, map: s.map || mapOf(s.to) }); }
    else if (s.do === "talk" || s.do === "follow") mv = send({ do: "talk", npc: s.to, map: s.map || mapOf(s.to) });
    else if (s.do === "find") mv = send({ do: "find", map: s.map, item: s.item, npc: s.npc });
    else if (s.do === "tap") for (let k = 0; k < s.n; k++) mv = send({ do: "tap", target: s.target, map: s.map });
    else if (s.do === "photo") mv = send({ do: "photo", map: s.map, near: s.near });
    else if (s.do === "catch") for (let k = 0; k < s.n; k++) { have.fish[s.fish] = (have.fish[s.fish] || 0) + 1; mv = send({ do: "catch", fish: s.fish }); }
    else if (s.do === "dig") for (let k = 0; k < (s.n || 1); k++) mv = send({ do: "dig" });
    else if (s.do === "quiz") for (let k = 0; k < s.q.length; k++) mv = send({ do: "quiz", ok: true });
    else if (s.do === "trade") for (const [npc] of s.chain) mv = send({ do: "talk", npc, map: mapOf(npc) });
    if (!mv.length) { errors.push(`sim ${e.id}: 手順 ${s.do} が すすまない`); break; }
    log.push(`${s.do}${s.to ? "→" + s.to : ""} ${mv[mv.length - 1].done ? "おわり" : "ok"}`);
  }
  if (st.req.length) errors.push(`sim ${e.id}: さいごまで すすまない`);
  if (!st.done[e.id]) errors.push(`sim ${e.id}: おわった きろくが ない`);
  const again = Ref.offer(e.giver, c, { ...st, offered: {} }, DATA, today, have, () => 0);
  if (again && again.type === "event" && again.ev.id === e.id) errors.push(`sim ${e.id}: おわったのに また 出る（limit: ${e.limit}）`);
  sim.push({ id: e.id, log, rewards: Ref.rewards(e, true), bond: Ref.bondOf(e) });
}
// こうかんの シミュレーション（もっていれば 出る・もっていなければ 出ない）
for (const b of barter) {
  const st = { bond: {}, req: [{ id: "x" }, { id: "y" }, { id: "z" }], done: {}, barter: {}, offered: {} };
  const have = { bag: {}, fish: {}, bone: {} };
  const c = Ref.context(b.npc, st, { hour: 11, weather: "clear", season: "summer", festival: "tanabata", boss: false, feature: { fishing: true, fossil: true } });
  const pickBt = (h) => { for (let i = 0; i < 600; i++) { st.offered = {}; const o = Ref.offer(b.npc, c, st, DATA, "d", h, Math.random); if (o && o.type === "barter" && o.bt.id === b.id) return o; } return null; };
  if (pickBt(have)) errors.push(`barter ${b.id}: もっていないのに 出る`);
  if (b.give.bag) have.bag[b.give.bag] = b.give.n; else if (b.give.fish) have.fish[b.give.fish] = b.give.n; else if (b.give.bone) have.bone.trex_skull = 2;
  if (!pickBt(have)) errors.push(`barter ${b.id}: もっていても 出ない`);
}
const npcFreq = {}; for (const l of lines) npcFreq[l.npc] = (npcFreq[l.npc] || 0) + 1;
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

writeFileSync(OUT + "townsfolk.json", JSON.stringify({ ...DATA, spotsExample: spotInfo, sim }, null, 1));
writeFileSync(OUT + "townsfolk-data.js", `// 町の人の 会話・物々交換・おねがいの データ（② 住民）。docs/design/features/townsfolk/ から 自動生成。手で 直さず、tools/feature-design/townsfolk-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/townsfolk-data.js に 置き、index.html と sw.js の 両方に 登録（talk.js・world-expansion.js・town-design.js より あと、townsfolk.js より 前）。\nconst TOWNSFOLK_DATA = ${JSON.stringify(DATA)};\n`);

// ---- 一覧（Markdown） ----
const NAME = Object.fromEntries(Object.entries(GD.npcs).map(([k, v]) => [k, v.name]));
const HERO = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
const cond = (w) => Object.entries(w || {}).map(([k, v]) => `${k}:${v.join("/")}`).join(" ") || "いつでも";
const thing = (o) => !o ? "" : o.bag ? `${vm.runInContext(`BAG_INDEX[${JSON.stringify(o.bag)}].name`, ctx)}×${o.n || 1}` : o.wear ? `服「${vm.runInContext(`ITEM_INDEX[${JSON.stringify(o.wear)}].name`, ctx)}」` : o.furn ? `家具「${vm.runInContext(`FURN_INDEX[${JSON.stringify(o.furn)}].name`, ctx)}」` : o.fish ? `さかな ${o.fish}×${o.n}` : o.bone ? (o.bone === "dup" ? "だぶった ほね×1" : o.bone === "missing-same-dino" ? "おなじ きょうりゅうの まだ ない ほね×1" : `ほね ${o.bone}`) : "";
const stepText = (s) => ({ buy: () => `かう: ${thing({ bag: s.item, n: s.n })}`, give: () => `わたす → ${NAME[s.to]}（${s.fish ? "さかな " + s.fish : ITEMS[s.item] ? ITEMS[s.item].name : thing({ bag: s.item, n: s.n })}）`, talk: () => `はなす → ${NAME[s.to]}${s.say ? `「${s.say}」` : ""}`, find: () => `さがす: ${s.map} の ${s.spots}かしょ（${s.item ? ITEMS[s.item].name : "こねこ"}）`, follow: () => `つれていく → ${NAME[s.to]}`, tap: () => `さわる: ${s.map} の ${s.target}×${s.n}`, photo: () => `しゃしん: ${s.map} の ${s.near}（${s.r}マス いない）`, catch: () => `つる: ${s.fish}×${s.n}`, dig: () => `ほる: ほね×${s.n || 1}`, quiz: () => `なぞなぞ ${s.q.length}もん`, trade: () => `わらしべ: ${ITEMS[s.start].name} → ${s.chain.map(([n, it]) => `${NAME[n]}（${it ? ITEMS[it].name : ""}）`).join(" → ")}` })[s.do]();
let md = `# 町の人の 会話 一覧（自動生成）\n\n- 町の人の セリフ **${lines.length}** 種（${Object.keys(NPC_LINES).length}人・なかよし ${lines.filter((l) => l.group === "bond").length}・町の なかま ${Object.keys(CROWD_LINES).length}役 ${Object.keys(crowd).length}人ぶん ${lines.filter((l) => l.group === "crowd").length} を ふくむ）＋ 3にんの ひとこと **${react.length}** 種 ＝ **${lines.length + react.length}** 種\n- 人ごと: ${Object.entries(npcFreq).map(([k, v]) => `${NAME[k] || CROWD_LINES[k].name} ${v}`).join("、")}\n- 条件の 書きかたは [CODEX_TASK.md](CODEX_TASK.md) の「条件」を 見る。x: は しせつが できてから、b: は なかよし ポイント。\n`;
for (const [npc, v] of Object.entries(NPC_LINES)) {
  md += `\n## ${NAME[npc]}（${npc}・${GD.npcs[npc].map}）— ${v.voice}\n\n| id | 文 | 条件 |\n| --- | --- | --- |\n` + lines.filter((l) => l.npc === npc).map((l) => `| ${l.id} | ${l.text} | ${cond(l.when)} |`).join("\n") + "\n";
}
for (const [role, v] of Object.entries(CROWD_LINES)) {
  const who = Object.entries(crowd).filter(([, r]) => r === role).map(([id]) => `${id}（${GD.npcs[id].map}）`).join("・");
  md += `\n## ${v.name}（町の なかま \`${role}\`: ${who}）— ${v.voice}\n\n| id | 文 | 条件 |\n| --- | --- | --- |\n` + lines.filter((l) => l.npc === role).map((l) => `| ${l.id} | ${l.text} | ${cond(l.when)} |`).join("\n") + "\n";
}
md += `\n## 3にんの ひとこと（話した あと）\n\n| id | だれ | 文 | 条件 |\n| --- | --- | --- | --- |\n` + react.map((l) => `| ${l.id} | ${HERO[l.who]} | ${l.text} | ${cond(l.when)} |`).join("\n") + "\n";
writeFileSync(OUT + "LINES.md", md);
let ev = `# おねがい（サブイベント）と 物々交換 一覧（自動生成）\n\n- おねがい **${events.length}** 種（${[...kinds].join("・")}）／ 物々交換 **${barter.length}** 種\n- すべて folk-ref.js の しくみで さいごまで すすむことを 確かめた（build-townsfolk.mjs）。\n- needs が ある ものは、その あそび（fishing=③ 釣り・fossil=④ 化石）が できるまで 出さない。\n\n## おねがい\n\n| id | なまえ | たのむ人（マップ） | 出る かくりつ・回数 | 条件 | 手順 | ごほうび | needs |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
ev += events.map((e) => `| ${e.id} | ${e.title} | ${NAME[e.giver]}（${e.map}） | ${Math.round(e.chance * 100)}%・${e.limit === "daily" ? "1日1回" : "1回だけ"} | ${cond(e.when)} | ${e.steps.map(stepText).join("<br>")} | ${[e.reward.coins && `コイン ${e.reward.coins}`, e.reward.bag && thing({ bag: e.reward.bag, n: e.reward.n }), e.reward.furn && thing({ furn: e.reward.furn }), e.reward.first && `はじめて: ${thing(e.reward.first)}`, `なかよし ${Object.entries(Ref.bondOf(e)).map(([k, v]) => NAME[k] + "+" + v).join(" ")}`].filter(Boolean).join("<br>")} | ${e.needs.join(" ") || ""} |`).join("\n");
ev += `\n\n### セリフ\n\n| id | もちかける | まだの とき | おわり（${"言う人"}） |\n| --- | --- | --- | --- |\n` + events.map((e) => `| ${e.id} | ${e.lines.offer.replace(/\n/g, "<br>")} | ${e.lines.remind} | ${NAME[e.doneBy]}「${e.lines.done}」 |`).join("\n");
ev += `\n\n## 物々交換\n\n| id | 人 | わたす | もらう | 回数 | needs | セリフ |\n| --- | --- | --- | --- | --- | --- | --- |\n` + barter.map((b) => `| ${b.id} | ${NAME[b.npc]} | ${thing(b.give)} | ${thing(b.get)} | ${b.once ? "1回だけ" : "なんどでも"} | ${b.needs.join(" ")} | ${b.text} |`).join("\n") + "\n";
ev += `\n## おねがいの もちもの（かばんには はいらない）\n\n| id | なまえ | 絵 |\n| --- | --- | --- |\n` + Object.entries(ITEMS).map(([k, v]) => `| ${k} | ${v.name} | ${v.art} |`).join("\n") + "\n";
writeFileSync(OUT + "EVENTS.md", ev);
console.log(`townsfolk: セリフ ${lines.length} ＋ ひとこと ${react.length} ＝ ${lines.length + react.length} 種／おねがい ${events.length}（${[...kinds].length}種類）／こうかん ${barter.length}／シミュレーション ${sim.length} 件 ok`);
