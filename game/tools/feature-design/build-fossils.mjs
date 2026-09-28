// ④ 化石: 恐竜 10種の 元データ（fossil-data.mjs）を 検査して、JSON・ゲームに そのまま 入れられる JS・一覧（Markdown）に する。
// ・恐竜 10種・部品（骨）2〜10こ・部品の id・せぼねの 番号が もれなく 1回ずつ つかわれて いるか
// ・化石が 出る 場所の マップが ある・文の 長さ
// ・部品ごとの 絵の はんい（partBox）を 骨の パスから 計算して データに 入れる（アイテムの 絵が ぴったり 入る）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { DINOS, SITES, PICK, EXTRAS } from "./fossil-data.mjs";
export const OUT = new URL("../../docs/design/features/fossils/", import.meta.url).pathname;
const GAME = new URL("../../", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });
const ctx = { console, Math }; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL("./fossil-art-ref.js", import.meta.url), "utf8") + ";globalThis.FossilArtRef=FossilArtRef;", ctx);
const Ref = ctx.FossilArtRef;
const html = readFileSync(join(GAME, "index.html"), "utf8"), noop = () => {}, store = new Map();
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const gctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
gctx.window = gctx; vm.createContext(gctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), gctx, { filename: f });
const allMaps = new Set(vm.runInContext("Object.keys(MAP_DEFS)", gctx));
const npcs = new Set(vm.runInContext("Object.values(MAP_DEFS).flatMap((d) => (d.npcs || []).map((n) => n.id))", gctx));
const bagIds = new Set(vm.runInContext("Object.keys(BAG_INDEX)", gctx));

const errors = [];
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const text = (t, where, rows = 2, maxW = 23) => { const r = String(t || "").split("\n"); if (!t) errors.push(`${where}: 文が ない`); if (r.length > rows) errors.push(`${where}: ${r.length}行`); for (const x of r) if (width(x) > maxW) errors.push(`${where}: 1行が 長い（${width(x)}）「${x}」`); if (/[a-zA-Z]{2,}/.test(t)) errors.push(`${where}: 英字「${t}」`); };
if (DINOS.length !== 10) errors.push(`恐竜は 10しゅ（いま ${DINOS.length}）`);
const ids = new Set();
let bones = 0;
// パスの 数字を 2つずつ 読んで はんいを 出す（ベジェの 制御点も ふくむので すこし 大きめ）
const boxOf = (d, tf) => { const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number), b = [Infinity, Infinity, -Infinity, -Infinity]; for (let i = 0; i + 1 < n.length; i += 2) { let [x, y] = [n[i], n[i + 1]]; if (tf) [x, y] = tf(x, y); b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); } return b; };
const join2 = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
for (const d of DINOS) {
  const w = `dino ${d.id}`, a = d.art;
  if (ids.has(d.id)) errors.push(`${w}: id の 重複`); ids.add(d.id);
  if (!(a.parts.length >= 2 && a.parts.length <= 10)) errors.push(`${w}: 骨は 2〜10こ（いま ${a.parts.length}）`);
  bones += a.parts.length;
  const pid = new Set(), used = new Map();
  for (const p of a.parts) {
    if (pid.has(p.id)) errors.push(`${w}: 部品 id の 重複 ${p.id}`); pid.add(p.id);
    text(p.name, `${w} part ${p.id}`, 1, 12);
    for (const el of p.el) { if (used.has(el)) errors.push(`${w}: ${el} が 2つの 部品に ある`); used.set(el, p.id); }
  }
  // せぼねの 区間が つながって いるか（前の 区間の おわり = つぎの はじめ）
  a.spine.forEach((sg, i) => { if (!(sg.n >= 2)) errors.push(`${w}: ${sg.el} の n`); if (i && (sg.pts[0][0] !== a.spine[i - 1].pts.at(-1)[0] || sg.pts[0][1] !== a.spine[i - 1].pts.at(-1)[1])) errors.push(`${w}: せぼね ${a.spine[i - 1].el} と ${sg.el} が つながって いない`); });
  const known = new Set(["skull", "ribs", ...a.spine.map((sg) => sg.el), ...(a.limbs || []).map((l) => l.id), ...(a.extras || []).map((x) => x.id)]);
  for (const [el] of used) if (!known.has(el)) errors.push(`${w}: ${el} は 骨格に ない`);
  for (const k of known) if (!used.has(k)) errors.push(`${w}: ${k} が どの 部品にも ない`);
  if (a.ribs && !a.spine.some((sg) => sg.el === a.ribs.on)) errors.push(`${w}: ribs.on ${a.ribs.on} が ない`);
  if (!SITES[d.site]) errors.push(`${w}: site ${d.site}`);
  for (const k of ["desc", "fact"]) text(d[k], `${w} ${k}`);
  if (!(d.rarity >= 1 && d.rarity <= 4)) errors.push(`${w}: rarity 1〜4`);
  // 部品の はんい
  const els = Ref.build(a); a.partBox = {};
  for (const p of a.parts) {
    const e = els[p.id]; if (!e) { errors.push(`${w}: ${p.id} の 絵が ない`); continue; }
    let b = [Infinity, Infinity, -Infinity, -Infinity];
    if (e.d) b = join2(b, boxOf(e.d)); if (e.far) b = join2(b, boxOf(e.far));
    if (e.skull) {
      const k = e.skull.k, r = ((k.rot || 0) * Math.PI) / 180, tf = (x, y) => [k.x + x * Math.cos(r) - y * Math.sin(r), k.y + x * Math.sin(r) + y * Math.cos(r)], S = e.skull.S;
      for (const dd of [S.d, S.jaw, S.crest].filter(Boolean)) b = join2(b, boxOf(dd, tf));
      for (const [hx, hy, an, len] of S.horns || []) { const p1 = tf(hx, hy), p2 = tf(hx + Math.cos(an) * len, hy + Math.sin(an) * len); b = join2(b, [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1])]); }
    }
    const pad = Math.max(2, (b[2] - b[0]) * 0.06);
    a.partBox[p.id] = [b[0] - pad, b[1] - pad, b[2] - b[0] + pad * 2, b[3] - b[1] + pad * 2].map((v) => Math.round(v * 10) / 10);
  }
}
if (!npcs.has(PICK.get.npc)) errors.push(`ピッケルを くれる 人 ${PICK.get.npc} が いない`);
for (const x of EXTRAS) if (x.bag && !bagIds.has(x.bag)) errors.push(`おまけ ${x.bag} が かばんに ない`);
for (const [k, s] of Object.entries(SITES)) { for (const m of s.maps) if (!allMaps.has(m)) errors.push(`site ${k}: マップ ${m} が ない`); if (!DINOS.some((d) => d.site === k)) errors.push(`site ${k}: 恐竜が いない`); }
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

const DATA = { version: 1, dinos: DINOS, sites: SITES, pick: PICK, extras: EXTRAS, rule: { boneChance: 0.7, newFirst: 0.7 } };
writeFileSync(OUT + "fossils.json", JSON.stringify(DATA, null, 1));
writeFileSync(OUT + "fossil-data.js", `// 化石の データ（④ 恐竜 10種・骨 ${bones}こ・化石が 出る 場所・ピッケル）。docs/design/features/fossils/ から 自動生成。手で 直さず、tools/feature-design/fossil-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/fossil-data.js に 置き、index.html と sw.js の 両方に 登録（fossils.js より 前）。\nconst FOSSIL_DATA = ${JSON.stringify(DATA)};\n`);
const SITE = Object.fromEntries(Object.entries(SITES).map(([k, v]) => [k, v.name]));
let md = `# 恐竜 10種と 骨 ${bones}こ の 一覧（自動生成）\n\n- 骨は 恐竜ごとに 2〜10こ。ぜんぶ そろうと ⑤ 恐竜博物館で 1ぴきの 骨格に なる（たりない 骨は 点線の かげで 見える）。\n- 絵は \`img/dino-sheet.png\`（骨格）・\`img/bone-sheet-1〜2.png\`（骨 1こずつ）。\`fossil-art-ref.js\` で 描いた もの。\n\n| # | id | なまえ | じだい | 見つかった ところ | 大きさ | たべもの | 骨の 数 | 出る 場所 | めずらしさ | 説明 | まめちしき |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
md += DINOS.map((d, i) => `| ${i + 1} | ${d.id} | ${d.name} | ${d.era}（${d.ago}） | ${d.where} | ${d.len}m | ${d.food} | ${d.art.parts.length} | ${SITE[d.site]} | ${"★".repeat(d.rarity)} | ${d.desc.replace(/\n/g, "")} | ${d.fact.replace(/\n/g, "")} |`).join("\n");
md += `\n\n## 骨（化石の アイテム）\n\n| 恐竜 | 部品 id | なまえ |\n| --- | --- | --- |\n` + DINOS.flatMap((d) => d.art.parts.map((p) => `| ${d.name} | ${d.id}.${p.id} | ${d.name.replace(/サウルス$/, "")}の ${p.name} |`)).join("\n");
md += `\n\n## 説明の 出典（たしかめた こと）\n\n- フクイラプトル（2000年に 日本で はじめて 新種として 命名・北谷層・全長 4m 台）: [福井県立恐竜博物館](https://www.dinosaur.pref.fukui.jp/news/archives/116)・[FPDM 標本データベース](http://www.dinosaur.pref.fukui.jp/dino/database/detail.php?id=702)\n- スピノサウルスの 尾（とても 長い 神経棘の 尾・泳ぎに つかった／Ibrahim ほか 2020, Nature）: [Nature ハイライト](https://www.natureasia.com/ja-jp/research/highlight/13297)・[ナショナル ジオグラフィック](https://natgeo.nikkeibp.co.jp/atcl/news/20/050100271/)\n- コンプソグナトゥスの 胃の トカゲ（バヴァリサウルス）: [Wikipedia](https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%B3%E3%83%97%E3%82%BD%E3%82%B0%E3%83%8A%E3%83%88%E3%82%A5%E3%82%B9)\n- ヴェロキラプトルの 羽軸こぶ（2007年 Science）・七面鳥くらいの 大きさ: [ナショナル ジオグラフィック](https://natgeo.nikkeibp.co.jp/atcl/news/20/112000674/)・[Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%B4%E3%82%A7%E3%83%AD%E3%82%AD%E3%83%A9%E3%83%97%E3%83%88%E3%83%AB)\n- そのほかの 時代・大きさ・特徴は 一般的な 図鑑の 値（ティラノサウルス 約 12m・トリケラトプス 約 8m・ステゴサウルス 約 9m・ブラキオサウルス 約 22m・アンキロサウルス 約 7m・パラサウロロフス 約 9.5m）。\n`;
writeFileSync(OUT + "FOSSIL_LIST.md", md);
console.log(`fossils: 恐竜 ${DINOS.length}しゅ・骨 ${bones}こ（${DINOS.map((d) => d.id + " " + d.art.parts.length).join("・")}）`);
