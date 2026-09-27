// ⑥ 射撃場: 元データ（range-data.mjs）を 検査し、じどうで あそんで ★の めやすを きめ、JSON・ゲームに そのまま 入れられる JS・一覧に する。
// ・じゅう 9しゅ（ハンドガン・ライフル・スナイパー ライフル 3しゅずつ）・性能の はんい・ことばの 長さ（1行 30もじ・半角 0.5）
// ・まとの しゅるい・コースの でかた・せりふ（えらんだ 子・おうえん）が 3人ぶん ある
// ・人に にせた じどう あそび（RangeRef.bot の kid / casual / good）で 1しゅ 8かいずつ あそび、
//   ★1 = kid の いちばん ひくい じゅうの 0.7ばい・★2 = casual の 0.85ばい・★3 = good の 0.9ばい に する（どの じゅうでも ★3 に とどく）
// ・町に たてる 場所（OUTSIDE）が あいた 地面で、たてた あとも 町の 入口から ほかの ドア・ワープ・人・宝箱に 行ける（game-vm.mjs）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";
import { itemIds, probeOutside, run } from "./game-vm.mjs";
import { CATS, GUNS, TARGETS, COURSES, COMBO, PAY, STAFF, TALK, OUTSIDE } from "./range-data.mjs";
export const OUT = new URL("../../docs/design/features/range/", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });
const errors = [], width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const longRow = (where, t) => { for (const row of String(t).split("\n")) if (width(row) > 30) errors.push(`${where}: 1行が 長い「${row}」`); };

// じゅう
const ids = new Set();
for (const g of GUNS) {
  if (ids.has(g.id)) errors.push(`じゅう ${g.id} が 2つ`); ids.add(g.id);
  if (!CATS[g.cat]) errors.push(`${g.id}: しゅるい ${g.cat} が ない`);
  for (const [k, lo, hi] of [["mag", 1, 40], ["rate", 0.5, 10], ["spread", 0.5, 10], ["recoil", 1, 20], ["reload", 0.5, 3], ["len", 150, 1200], ["h", 100, 300]]) if (!(g[k] >= lo && g[k] <= hi)) errors.push(`${g.id}: ${k}=${g[k]} が ${lo}〜${hi} の そと`);
  if (g.cat === "sniper" && !(g.zoom >= 2 && g.sway > 0)) errors.push(`${g.id}: スナイパーには zoom と sway が いる`);
  if (g.cat !== "sniper" && g.zoom) errors.push(`${g.id}: スコープは スナイパーだけ`);
  for (const k of ["name", "desc", "fact"]) { if (!g[k]) errors.push(`${g.id}: ${k} が ない`); else longRow(`${g.id}.${k}`, g[k]); }
  if (g.desc.split("\n").length > 3 || g.fact.split("\n").length > 3) errors.push(`${g.id}: desc / fact は 3行まで`);
}
for (const c of Object.keys(CATS)) if (GUNS.filter((g) => g.cat === c).length !== 3) errors.push(`${c}: じゅうが 3しゅで ない`);
// まと・コース
// こうかおんの 名前は sound.js の se() の case から とる
const SE = new Set([...readFileSync(new URL("../../js/sound.js", import.meta.url), "utf8").matchAll(/case "([a-z]+)"/g)].map((m) => m[1]));
for (const [k, T] of Object.entries(TARGETS)) { if (!SE.has(T.se)) errors.push(`まと ${k}: おと ${T.se} が ない`); if (T.hit === "ring" && !(Array.isArray(T.pts) && T.pts.length === 3)) errors.push(`まと ${k}: ring の pts は 3つ`); }
for (const [cid, c] of Object.entries(COURSES)) {
  if (!Object.values(CATS).some((x) => x.course === cid)) errors.push(`コース ${cid} を つかう しゅるいが ない`);
  for (const it of c.items) { if (!TARGETS[it.kind]) errors.push(`${cid}: まと ${it.kind} が ない`); if (!["rail", "swing", "rise", "pop", "stay"].includes(it.motion)) errors.push(`${cid}: うごき ${it.motion}`); if (!(it.y >= 0 && it.y <= 1)) errors.push(`${cid}: y が 0〜1 の そと`); }
  longRow(`コース ${cid}`, c.name);
}
// せりふ
for (const t of TALK.first.concat(TALK.lines, [TALK.lock, TALK.pick], Object.values(TALK.result))) longRow("talk", t);
for (const who of ["wanko", "gachan", "goji"]) {
  if (!TALK.go[who] || !TALK.cheer[who]) { errors.push(`せりふ: ${who} が ない`); continue; }
  for (const t of TALK.go[who]) longRow(`go.${who}`, t);
  for (const k of ["hit", "combo", "hurry", "end"]) { if (!TALK.cheer[who][k]) errors.push(`cheer.${who}.${k} が ない`); else for (const t of TALK.cheer[who][k]) { longRow(`cheer.${who}.${k}`, t); if (width(t) > 14) errors.push(`cheer.${who}.${k}: おうえんは 14もじ まで「${t}」`); } }
}
for (const it of Object.values(STAFF.outfit)) if (!itemIds.has(it)) errors.push(`しゃてきじょうの 人: 服 ${it} が ゲームに ない`);
if (run("typeof TALKS !== 'undefined' && !!TALKS[" + JSON.stringify(STAFF.talk) + "]")) errors.push(`TALKS.${STAFF.talk} が もう ある`);
// 町に たてる 場所
const pr = probeOutside(OUTSIDE);
for (const e of pr.err) errors.push(`射撃場（${OUTSIDE.map} の ${OUTSIDE.x},${OUTSIDE.y}）: ${e}`);
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

// じどうで あそんで ★を きめる
const ctx = { Math, JSON, console }; vm.createContext(ctx);
for (const [f, n] of [["gun-art-ref.js", "GunArtRef"], ["range-ref.js", "RangeRef"]]) vm.runInContext(readFileSync(new URL("./" + f, import.meta.url), "utf8") + `;globalThis.${n}=${n};`, ctx, { filename: f });
const RR = ctx.RangeRef, base = { cats: CATS, guns: GUNS, targets: TARGETS, courses: COURSES, combo: COMBO, pay: PAY };
const RUNS = 8, sim = {};
for (const g of GUNS) {
  sim[g.id] = {};
  for (const sk of ["kid", "casual", "good"]) {
    const sc = [];
    for (let i = 0; i < RUNS; i++) { const G = new RR.Game(base, g.id, { seed: `sim:${sk}:${i}`, W: 360, H: 700 }); let n = 0; while (G.phase !== "end" && n++ < 60 * 60) G.update(1 / 60, RR.bot(G, sk)); sc.push(G.score); }
    sim[g.id][sk] = { avg: Math.round(sc.reduce((a, b) => a + b, 0) / RUNS), min: Math.min(...sc), max: Math.max(...sc) };
  }
}
const courses = JSON.parse(JSON.stringify(COURSES));
for (const [cid, c] of Object.entries(courses)) {
  const guns = GUNS.filter((g) => CATS[g.cat].course === cid), low = (sk) => Math.min(...guns.map((g) => sim[g.id][sk].avg));
  c.stars = [Math.round(low("kid") * 0.7), Math.round(low("casual") * 0.85), Math.round(low("good") * 0.9)];
  if (!(c.stars[0] >= 5 && c.stars[1] >= c.stars[0] * 1.15 && c.stars[2] >= c.stars[1] * 1.08)) errors.push(`コース ${cid}: ★の めやす ${c.stars.join("/")} が ちかすぎる（まとの でかたを 見なおす）`);
  for (const g of guns) if (sim[g.id].good.avg < c.stars[2]) errors.push(`${g.id}: good でも ★3 に とどかない`);
}
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

const DATA = { version: 1, cats: CATS, guns: GUNS, targets: TARGETS, courses, combo: COMBO, pay: PAY, staff: STAFF, talk: TALK,
  outside: { ...OUTSIDE, door: Math.floor(OUTSIDE.w / 2), doorAt: pr.door, front: pr.front } };
writeFileSync(OUT + "range.json", JSON.stringify({ ...DATA, sim }, null, 1));
writeFileSync(OUT + "range-data.js", `// 射撃場の データ（⑥ じゅう 9しゅ・まと・コース・★の めやす・せりふ・町に たてる 場所）。docs/design/features/range/ から 自動生成。手で 直さず、tools/feature-design/range-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/range-data.js に 置き、index.html と sw.js の 両方に 登録（range.js より 前）。\nconst RANGE_DATA = ${JSON.stringify(DATA)};\n`);

// 一覧
const catName = (c) => CATS[c].name;
let md = `# 射撃場の じゅう・まと・コース（自動生成）\n\nゲームの 名前・絵は オリジナル。形と 大きさは 実際に ある エアガン（と その もとに なった じゅう）を 参考に した（下の 出典）。刻印・ロゴは 描かない。じゅうこうの さきは オレンジ（おもちゃの しるし）。\n\n## じゅう 9しゅ\n\n| id | しゅるい | ゲームの 名前 | 参考に した 形 | 長さ×高さ | うごく しくみ | たま | れんしゃ | ばらつき | はねあがり | リロード | スコープ |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
md += GUNS.map((g) => `| ${g.id} | ${catName(g.cat)} | ${g.name} | ${g.ref} | ${g.len}×${g.h}mm | ${g.power} | ${g.mag} | ${g.rate}/びょう${g.auto ? "（おしっぱなし）" : ""} | ${g.spread}px | ${g.recoil}px | ${g.reload}びょう | ${g.zoom ? `×${g.zoom}・ゆれ ${g.sway}px` : "—"} |`).join("\n");
md += `\n\n| id | せつめい | まめちしき |\n| --- | --- | --- |\n` + GUNS.map((g) => `| ${g.id} | ${g.desc.replace(/\n/g, " ")} | ${g.fact.replace(/\n/g, " ")} |`).join("\n");
md += `\n\n## コースと ★の めやす（じどう あそびで きめた。1しゅ ${RUNS}かいの へいきん）\n\n| コース | じかん | ★1 | ★2 | ★3 | つかう じゅう |\n| --- | --- | --- | --- | --- | --- |\n` + Object.entries(courses).map(([cid, c]) => `| ${c.name} | ${c.time}びょう | ${c.stars[0]} | ${c.stars[1]} | ${c.stars[2]} | ${catName(Object.keys(CATS).find((k) => CATS[k].course === cid))} |`).join("\n");
md += `\n\n| じゅう | kid（小さい 子） | casual（ふつう） | good（じょうず） |\n| --- | --- | --- | --- |\n` + GUNS.map((g) => `| ${g.name} | ${["kid", "casual", "good"].map((k) => `${sim[g.id][k].avg}（${sim[g.id][k].min}〜${sim[g.id][k].max}）`).join(" | ")} |`).join("\n");
md += `\n\n- ごほうび: \`GameEconomy.pay\` と 同じ 形（\`shopBase.range = ${PAY.base}\` × ★0〜3 の ${PAY.rank.join(" / ")}）= ${PAY.rank.map((k) => Math.round(PAY.base * k)).join(" / ")} コイン。れんぞく ${COMBO.from}かいめ から 1ぱつ +${COMBO.bonus}。\n- まと: ${Object.entries(TARGETS).map(([k, T]) => `${T.name}（${Array.isArray(T.pts) ? T.pts.join("/") : T.pts}てん）`).join("・")}。人や どうぶつの 形の まとは つかわない。\n`;
md += `\n## 町に たてる 場所\n\n\`${OUTSIDE.map}\` の (${OUTSIDE.x}, ${OUTSIDE.y}) から ${OUTSIDE.w}×${OUTSIDE.h}マス（建物 id \`${OUTSIDE.id}\`・入口 (${pr.door.join(", ")})・入口の まえ (${pr.front.join(", ")})）。② の 町の人が「シティの しゃてきじょう」と 話す。\n`;
md += `\n## 出典（形・大きさ・しくみ・安全）\n\n- グロック17: 長さ 186mm・バレル 114mm（[Wikipedia: Glock](https://en.wikipedia.org/wiki/Glock)）\n- M1911: 長さ 216mm・バレル 127mm・1911年 採用（[Wikipedia: M1911 pistol](https://en.wikipedia.org/wiki/M1911_pistol)）\n- S&W M686（4インチ）: 長さ 9.56in（約243mm）・高さ 6in（[Smith & Wesson M686 PLUS 4"](https://www.smith-wesson.com/product/l-frame-164194)・[Wikipedia](https://en.wikipedia.org/wiki/Smith_%26_Wesson_Model_686)）\n- M4 カービン: ストックを のばして 約840mm・ちぢめて 約757mm（[Wikipedia: M4 carbine](https://en.wikipedia.org/wiki/M4_carbine)）\n- ウィンチェスター M1873 カービン: 長さ 38.5in（約977mm）・バレル 20in（[Winchester Model 1873 Carbine](https://www.winchesterguns.com/products/rifles/model-1873/model-1873-carbine.html)）\n- ワルサー LG400: 長さ 約1,050〜1,110mm・10m きょうぎ用 の エアライフル（[Wikipedia: Walther LG400](https://en.wikipedia.org/wiki/Walther_LG400_(16J))）\n- 10m エアライフルの まと: 10てんは 直径 0.5mm（[ISSF 10 meter air rifle](https://en.wikipedia.org/wiki/ISSF_10_meter_air_rifle)・[JOC ライフル射撃](https://www.joc.or.jp/sports/rifle_shooting/index.html)）\n- M24 SWS: 長さ 約1,092mm（[Wikipedia: M24](https://en.wikipedia.org/wiki/M24_Sniper_Weapon_System)）・VSR-10（エアーコッキングの ボルトアクション・約950mm）（[東京マルイ VSR-10 プロスナイパー Gスペック](https://www.tokyo-marui.co.jp/products/aircocking/boltaction/73)）\n- L96 AWS: サプレッサーつき 1,120mm・3,460g（[東京マルイ L96 AWS レビュー（ハイパー道楽）](https://www.hyperdouraku.com/airgun/l96aws/index.html)）\n- M110 SASS: 1,029〜1,181mm（[Wikipedia: M110](https://en.wikipedia.org/wiki/M110_Semi-Automatic_Sniper_System)）\n- エアガンの しくみ（エアーコッキング・ガスブローバック・電動ガン）: [東京マルイ エアソフトガン選びの ポイント](https://www.tokyo-marui.co.jp/guide/choice/)\n- 安全と 対象年齢（10歳以上用 0.135J 以下・18歳以上用 0.98J 以下・ゴーグル・人や 動物に 向けない）: [東京マルイ 対象年齢の こと](https://www.tokyo-marui.co.jp/guide/age/)・[Wikipedia: エアソフトガン](https://ja.wikipedia.org/wiki/%E3%82%A8%E3%82%A2%E3%82%BD%E3%83%95%E3%83%88%E3%82%AC%E3%83%B3)\n`;
writeFileSync(OUT + "GUN_LIST.md", md);
console.log(`range: じゅう ${GUNS.length}しゅ（${Object.keys(CATS).map((c) => catName(c) + " " + GUNS.filter((g) => g.cat === c).length).join("・")}）／ ★ ${Object.entries(courses).map(([k, c]) => k + " " + c.stars.join("/")).join("・")}／ 町 ${OUTSIDE.map} (${OUTSIDE.x},${OUTSIDE.y})`);
