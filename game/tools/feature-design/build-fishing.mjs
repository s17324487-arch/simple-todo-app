// ③ 釣り: 魚 50種の 元データ（fish-data.mjs）を 検査して、JSON・ゲームに そのまま 入れられる JS・一覧（Markdown）に する。
// ・50種・id・場所・季節・時間・大きさ・文の 長さ
// ・どの 場所 × 季節 × 時間 でも、でんせつ いがいの 魚が 2しゅ いじょう つれる（つれない 時間を つくらない）
// ・釣り場の マップに、歩ける マスの となりの 水（'~'）が ある（ゲームの WorldMap で 調べる）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { FISH, SPOTS, RODS } from "./fish-data.mjs";
export const OUT = new URL("../../docs/design/features/fishing/", import.meta.url).pathname;
const GAME = new URL("../../", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });

const html = readFileSync(join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const noop = () => {}, store = new Map();
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const ctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
ctx.window = ctx; vm.createContext(ctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), ctx, { filename: f });
vm.runInContext(readFileSync(new URL("./fishing-ref.js", import.meta.url), "utf8") + ";globalThis.FishingRef=FishingRef;", ctx, { filename: "fishing-ref.js" });
const Ref = ctx.FishingRef;

const errors = [], PLACES = ["pond", "river", "stream", "beach", "harbor"], SEASONS = ["spring", "summer", "autumn", "winter"], TIMES = ["morning", "day", "evening", "night", "late"], WEATHERS = ["clear", "cloudy", "rain", "snow", "wind"];
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const text = (t, where, rows = 2, maxW = 22) => { const r = String(t || "").split("\n"); if (!t) errors.push(`${where}: 文が ない`); if (r.length > rows) errors.push(`${where}: ${r.length}行（${rows}行まで）`); for (const x of r) if (width(x) > maxW) errors.push(`${where}: 1行が 長い（${width(x)}）「${x}」`); if (/[a-zA-Z]{2,}/.test(t)) errors.push(`${where}: 英字「${t}」`); if (/[぀-ゟ]{12,}/.test(String(t).replace(/[、。！？…「」（）]/g, " "))) errors.push(`${where}: ひらがなが 長く つづく「${t}」`); };
const vals = (v, all, where) => { if (v === "all") return; if (!Array.isArray(v) || !v.length) errors.push(`${where}: "all" か 配列`); else for (const x of v) if (!all.includes(x)) errors.push(`${where}: ない 値 ${x}`); };
const ids = new Set();
if (FISH.length !== 50) errors.push(`魚は 50しゅ（いま ${FISH.length}）`);
for (const f of FISH) {
  const w = `fish ${f.id}`;
  if (ids.has(f.id)) errors.push(`${w}: id の 重複`); ids.add(f.id);
  if (!/^[a-z][a-z0-9_]*$/.test(f.id)) errors.push(`${w}: id は 英小文字`);
  if (!PLACES.includes(f.place)) errors.push(`${w}: place ${f.place}`);
  for (const a of f.also || []) if (!PLACES.includes(a) || a === f.place) errors.push(`${w}: also ${a}`);
  vals(f.season, SEASONS, w + " season"); vals(f.time, TIMES, w + " time"); if (f.weather) vals(f.weather, WEATHERS, w + " weather");
  if (!(f.rarity >= 1 && f.rarity <= 5)) errors.push(`${w}: rarity 1〜5`);
  if (!(f.power >= 1 && f.power <= 5)) errors.push(`${w}: power 1〜5`);
  if (!(f.size && f.size[0] > 0 && f.size[1] >= f.size[0])) errors.push(`${w}: size`);
  if (!(f.sell > 0)) errors.push(`${w}: sell`);
  if (!f.art || !(f.art.h > 0)) errors.push(`${w}: art`);
  if (!/^[ァ-ヶー（）]+$/.test(f.name.replace(/シロザケ/, ""))) errors.push(`${w}: なまえは カタカナ「${f.name}」`);
  text(f.desc, w + " desc"); text(f.fact, w + " fact", 2, 23);
}
// どの 時間でも つれる（でんせつ・unlock を のぞいて 2しゅ いじょう）
const cover = {};
for (const p of PLACES) for (const s of SEASONS) for (const t of TIMES) {
  const pool = Ref.pool({ fish: FISH }, p, { season: s, time: t, weather: "clear", rodPower: 1 }, 0).filter((x) => x.f.rarity <= 4);
  cover[`${p}/${s}/${t}`] = pool.length;
  if (pool.length < 2) errors.push(`${p} の ${s}・${t} に つれる 魚が ${pool.length}しゅ（2 いじょう）: ${pool.map((x) => x.f.id).join(",")}`);
}
// 釣り場の マップに 水べが ある
const spotInfo = {};
for (const [map, sp] of Object.entries(SPOTS)) {
  if (!PLACES.includes(sp.place)) errors.push(`spot ${map}: place`);
  const ok = vm.runInContext(`(() => { if (!MAP_DEFS[${JSON.stringify(map)}]) return -1; const m = new WorldMap(${JSON.stringify(map)}), d = MAP_DEFS[${JSON.stringify(map)}]; let n = 0;
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) { if (m.isSolid(x, y)) continue; if ([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => (d.rows[y+dy]||"")[x+dx] === "~")) n++; } return n; })()`, ctx);
  if (ok < 0) errors.push(`spot ${map}: マップが ない`); else if (ok < 3) errors.push(`spot ${map}: 水べの マスが ${ok}（3 いじょう）`);
  spotInfo[map] = ok;
}
for (const p of PLACES) if (!Object.values(SPOTS).some((s) => s.place === p)) errors.push(`place ${p} の 釣り場が ない`);
const counts = Object.fromEntries(PLACES.map((p) => [p, FISH.filter((f) => f.place === p).length]));
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

const DATA = { version: 1, fish: FISH.map(({ flip, ...f }) => ({ ...f, shadow: Ref.shadowOf(f), ...(flip ? { flip: true } : {}) })), spots: SPOTS, rods: RODS };
writeFileSync(OUT + "fishing.json", JSON.stringify({ ...DATA, cover, spotTiles: spotInfo }, null, 1));
writeFileSync(OUT + "fishing-data.js", `// 釣りの データ（③ 魚 50種・釣り場・釣りざお）。docs/design/features/fishing/ から 自動生成。手で 直さず、tools/feature-design/fish-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/fishing-data.js に 置き、index.html と sw.js の 両方に 登録（fishing.js より 前）。\nconst FISHING_DATA = ${JSON.stringify(DATA)};\n`);

// 一覧（Markdown）
const P = { pond: "いけ（タウン）", river: "かわ（はらっぱ）", stream: "さわ（もり）", beach: "うみべ（ビーチ）", harbor: "みなと" };
const SE = { spring: "はる", summer: "なつ", autumn: "あき", winter: "ふゆ" }, TI = { morning: "あさ", day: "ひる", evening: "ゆうがた", night: "よる", late: "しんや" }, WE = { rain: "あめ", clear: "はれ", cloudy: "くもり", snow: "ゆき", wind: "かぜ" };
const list = (v, M) => (v === "all" ? "いつでも" : v.map((x) => M[x]).join("・"));
const star = (n) => "★".repeat(n) + "☆".repeat(5 - n);
let md = `# 魚 50種の 一覧（自動生成）\n\n- 場所ごと: ${PLACES.map((p) => `${P[p]} ${counts[p]}`).join("、")}\n- めずらしさ: ${[1, 2, 3, 4, 5].map((r) => `${star(r)} ${FISH.filter((f) => f.rarity === r).length}`).join("、")}（★5 は でんせつ）\n- 絵は \`img/fish-sheet-1〜3.png\`（\`fish-art-ref.js\` で 描いた もの）。\n- どの 場所・季節・時間でも、でんせつ いがいの 魚が 2しゅ いじょう つれる（\`fishing.json\` の \`cover\`）。\n\n| # | id | なまえ | 場所 | 季節 | 時間 | 天気で ふえる | めずらしさ | 大きさ | ひき | うると | 説明 | まめちしき |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
md += FISH.map((f, i) => `| ${i + 1} | ${f.id} | ${f.name} | ${P[f.place]}${f.also ? "・" + f.also.map((a) => P[a]).join("・") : ""} | ${list(f.season, SE)} | ${list(f.time, TI)} | ${f.weather ? f.weather.map((w) => WE[w]).join("・") : ""} | ${star(f.rarity)}${f.unlock ? `（${f.unlock}しゅ つったら）` : ""} | ${f.size[0]}〜${f.size[1]}cm | ${f.power} | ${f.sell} | ${f.desc.replace(/\n/g, "")} | ${f.fact.replace(/\n/g, "")} |`).join("\n");
md += `\n\n## 説明の 出典（たしかめた こと）\n\n- マンボウの「3おくこ」: Schmidt (1921, Nature) の、体長 1.5m の 標本の 卵巣に あった 未成熟の 卵の 数（うむ 数では ない）。[マンボウの 卵数（Lab BRAINS）](https://lab-brains.as-1.co.jp/enjoy-learn/2022/09/38147/)・[レファレンス協同データベース](https://crd.ndl.go.jp/reference/detail?page=ref_view&id=1000221231)\n- アイナメの 側線 5本: [市場魚貝類図鑑](https://www.zukan-bouz.com/syu/%E3%82%A2%E3%82%A4%E3%83%8A%E3%83%A1)・[Honda 釣魚図鑑](https://www.honda.co.jp/fishing/picture-book/ainame/)\n- リュウグウノツカイ（硬骨魚で 世界最長・3〜5m、10m を こえる 記録）: [Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%AA%E3%83%A5%E3%82%A6%E3%82%B0%E3%82%A6%E3%83%8E%E3%83%84%E3%82%AB%E3%82%A4)\n- ニホンウナギの 産卵場（2009年、西マリアナ海嶺で 天然の 卵を 初めて 採集）: [東京大学 大気海洋研究所](https://www.aori.u-tokyo.ac.jp/research/news/2011/files/unagi20110202.pdf)\n- イトウ（日本最大の 淡水魚・1〜1.5m、2m 近い ものも・いまは 北海道だけ）: [北海道庁](https://www.pref.hokkaido.lg.jp/sr/gid/fis016.html)\n- シーラカンス（1938年 南アフリカで 発見・白亜紀末に 絶滅したと 考えられて いた）: [北九州市立いのちのたび博物館](https://www.kmnh.jp/exhibition/coelacanth/topic1.html)\n- マアナゴの「はかりめ」: [TOKYO GROWN](https://tokyogrown.jp/node/571332)\n- マイワシの「七つ星」: [大阪府立環境農林水産総合研究所](https://www.knsk-osaka.jp/zukan/zukan_database/osakawan/8050b3250f4abcc/9850c17d372970b.html)\n`;
writeFileSync(OUT + "FISH_LIST.md", md);
console.log(`fishing: 魚 ${FISH.length}しゅ（${PLACES.map((p) => p + " " + counts[p]).join("・")}）／ 釣り場 ${Object.keys(SPOTS).length}（水べ ${Object.entries(spotInfo).map(([k, v]) => k + ":" + v).join(" ")}）`);
