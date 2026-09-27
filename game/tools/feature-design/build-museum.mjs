// ⑤ 水族館と 恐竜博物館: へやの 元データ（museum-data.mjs）から 地図（rows）を つくり、検査して JSON・JS・一覧に する。
// ・魚 50しゅが どこかの 水そうに ちょうど 1回・恐竜 10しゅが どこかの 台に ちょうど 1回
// ・展示物が へやの 中に あり、ほかの 展示と 重ならない・どの 展示にも 歩いて 近づける（となりに 床が ある）
// ・入口から ぜんぶの へやに 歩いて 行ける・人の 場所が 床
// ・ことば（寄贈・へやの 案内・展示の 説明）が 1行 30もじ（半角は 0.5）まで
// ・館の マスの 文字が ゲームの いまの タイル文字と ぶつからない・人の 服が ゲームに ある
// ・町に たてる 場所（outside）が あいた 地面で、たてた あとも 町の 入口から 館の 入口・ほかの ドア・ワープ・人・宝箱に 歩いて 行ける
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { BUILDINGS, TILES, TALK, INFO, SONGS } from "./museum-data.mjs";
import { FISH } from "./fish-data.mjs";
import { DINOS } from "./fossil-data.mjs";
export const OUT = new URL("../../docs/design/features/museum/", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });
// ゲームを 読みこむ（地図・タイル文字・服を しらべる。build-fossils.mjs と 同じ やりかた）
const GAME = new URL("../../", import.meta.url).pathname;
const html = readFileSync(join(GAME, "index.html"), "utf8"), noop = () => {}, store = new Map();
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const gctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
gctx.window = gctx; vm.createContext(gctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), gctx, { filename: f });
const gameChars = new Set(vm.runInContext("[...Object.keys(GROUND), ...SOLID_CH, ...Object.keys(OBJ_CH), ...Object.values(MAP_DEFS).flatMap((d) => d.rows.join('').split(''))]", gctx));
const itemIds = new Set(vm.runInContext("Object.keys(ITEM_INDEX)", gctx));
// 町に 建物を たてて みて、歩いて 行けるかを しらべる（tools/check.mjs の 到達性と 同じ 考え）
const probeOutside = vm.runInContext(`(o) => {
  const d = MAP_DEFS[o.map], err = [];
  if (!d) return { err: ["町の マップ " + o.map + " が ない"] };
  const H = d.rows.length, W = d.rows[0].length, door = o.x + Math.floor(o.w / 2), busy = new Map();
  const mark = (x, y, w, h, what) => { for (let yy = y; yy < y + (h || 1); yy++) for (let xx = x; xx < x + (w || 1); xx++) busy.set(xx + "," + yy, what); };
  for (const b of d.buildings || []) mark(b.x, b.y, b.w, b.h + 1, b.id);
  for (const ob of d.objects || []) mark(ob.x, ob.y, ob.w, ob.h, ob.id);
  for (const n of d.npcs || []) mark(n.x, n.y, 1, 1, n.id);
  for (const sg of d.signs || []) mark(sg.x, sg.y, 1, 1, "かんばん");
  for (const c of d.chests || []) mark(c.x, c.y, 1, 1, c.id);
  for (const w of d.warps || []) mark(w.x, w.y, w.w, w.h, "ワープ");
  for (const [x, y] of d.spawns || []) mark(x, y, 1, 1, "敵の 出る 場所");
  for (let y = o.y; y <= o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
    if (y === o.y + o.h && x !== door) continue;
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) { err.push("(" + x + "," + y + ") が マップの はし"); continue; }
    const ch = d.rows[y][x];
    if (y < o.y + o.h && (SOLID_CH.has(ch) || "D=vzb~".includes(ch))) err.push("(" + x + "," + y + ") が あいた 地面で ない「" + ch + "」");
    if (y === o.y + o.h && SOLID_CH.has(ch)) err.push("入口の まえ (" + x + "," + y + ") が 通れない");
    if (busy.has(x + "," + y)) err.push("(" + x + "," + y + ") に " + busy.get(x + "," + y) + " が ある");
  }
  if (err.length) return { err };
  const rows = d.rows.map((r) => r.split(""));
  for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) rows[y][x] = "#";
  rows[o.y + o.h - 1][door] = "D";
  MAP_DEFS.__probe = { ...d, rows: rows.map((r) => r.join("")), buildings: [...(d.buildings || []), { id: o.id, x: o.x, y: o.y, w: o.w, h: o.h, door: Math.floor(o.w / 2), label: o.label, roof: o.roof, facility: o.facility, act: { type: "indoor" } }] };
  const m = new WorldMap("__probe"); delete MAP_DEFS.__probe;
  const start = [m.warps[0].x, m.warps[0].y], seen = new Set([start.join(",")]), q = [start];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + "," + (y + dy); if (seen.has(k) || m.isSolid(x + dx, y + dy)) continue; seen.add(k); q.push([x + dx, y + dy]); } }
  const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + "," + (y + dy)));
  for (const dr of m.doors) if (!near(dr.x, dr.y)) err.push(dr.b.id + " の ドアに 行けなく なる");
  for (const w of m.warps) if (!near(w.x, w.y)) err.push("ワープ(" + w.to + ") に 行けなく なる");
  for (const n of d.npcs || []) if (!near(n.x, n.y)) err.push(n.id + " に 行けなく なる");
  for (const c of m.chests) if (!near(c.x, c.y)) err.push(c.id + " に 行けなく なる");
  return { err, door: [door, o.y + o.h - 1], front: [door, o.y + o.h] };
}`, gctx);

const errors = [];
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const longRow = (where, t) => { for (const row of t.split("\n")) if (width(row) > 30) errors.push(`${where}: 1行が 長い「${row}」`); };
for (const [k, v] of Object.entries(TALK)) { for (const [kk, t] of Object.entries(v)) for (const one of [].concat(t)) longRow(`talk ${k}.${kk}`, one); for (const kk of ["first", "ask", "thanks", "none", "all", "lines"]) if (!v[kk]) errors.push(`talk ${k}: ${kk} が ない`); }
// BGM: 音の なまえが ゲームの Sound で ならせる・1小せつ 8トークン
const freqOk = vm.runInContext("(n) => Sound.freq(n) > 0", gctx);
for (const [k, song] of Object.entries(SONGS)) for (const [i, tr] of song.tracks.entries()) for (const [bi, bar] of tr.notes.split("|").entries()) {
  const toks = bar.trim().split(/\s+/);
  if (toks.length !== 8) errors.push(`song ${k} ${i}: ${bi + 1}小せつめが 8トークンで ない（${toks.length}）`);
  for (const tk of toks) if (!(tk === "." || tk === "_" || (tr.drum ? ["k", "s", "h"].includes(tk) : /^[A-G](#|b)?[0-8]$/.test(tk) && freqOk(tk)))) errors.push(`song ${k} ${i}: 「${tk}」が ならせない`);
}
if (vm.runInContext("Object.keys(SONGS)", gctx).some((k) => SONGS[k])) errors.push("BGM の なまえが いまの SONGS と ぶつかる");
for (const [k, v] of Object.entries(INFO)) { longRow(`info ${k}`, v.text); if (v.text.split("\n").length > 4) errors.push(`info ${k}: 4行まで`); }
const NEED_INFO = ["fossilwall", "jelly", "tunnel", "nest", "tower", "lab"];
for (const ch of Object.keys(TILES)) { if (ch.length !== 1) errors.push(`マスの 文字「${ch}」は 1もじに する`); if (gameChars.has(ch)) errors.push(`マスの 文字「${ch}」が ゲームの いまの タイル文字と ぶつかる`); }
const WALL = "X", EXIT = "E";
export function build(b) {
  const rows = Array.from({ length: b.H }, () => Array(b.W).fill(WALL));
  const roomAt = (x, y) => b.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  for (const r of b.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) rows[y][x] = r.f;
  for (const [x, y] of b.doors) { const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => roomAt(x + dx, y + dy)).find(Boolean); rows[y][x] = n ? n.f : "0"; }
  for (const e of b.exits) for (let i = 0; i < e.w; i++) rows[e.y][e.x + i] = EXIT;
  return rows.map((r) => r.join(""));
}
const fishIds = new Set(FISH.map((f) => f.id)), dinoIds = new Set(DINOS.map((d) => d.id));
const OUTB = {};
for (const [bid, b] of Object.entries(BUILDINGS)) {
  const w = bid, rows = build(b), walk = (x, y) => y >= 0 && x >= 0 && y < b.H && x < b.W && rows[y][x] !== WALL;
  for (const r of b.rooms) if (!TILES[r.f] || TILES[r.f].solid) errors.push(`${w} ${r.id}: 床の 文字「${r.f}」が TILES に ない`);
  const solid = new Set(), used = new Map();
  for (const r of b.rooms) { if (!r.intro) errors.push(`${w} ${r.id}: へやの 案内（intro）が ない`); else longRow(`${w} ${r.id}.intro`, r.intro); }
  const objects = b.objects.map((o) => { const key = o.fossil || o.kind; return INFO[key] ? { ...o, info: key } : o; });
  for (const o of objects) if (NEED_INFO.includes(o.kind) && !o.info) errors.push(`${w} ${o.id}: 説明（INFO）が ない`);
  for (const o of b.objects) {
    const ow = o.w || 1, oh = o.h || 1;
    for (let y = o.y; y < o.y + oh; y++) for (let x = o.x; x < o.x + ow; x++) {
      if (!walk(x, y) || rows[y][x] === EXIT) errors.push(`${w} ${o.id}: (${x},${y}) が 床の 外`);
      if (!o.walk) { const k = x + "," + y; if (solid.has(k)) errors.push(`${w} ${o.id}: (${x},${y}) が ほかの 展示と 重なる`); solid.add(k); }
    }
  }
  const free = (x, y) => walk(x, y) && !solid.has(x + "," + y);
  // 展示に 近づける（まわりに あいた 床が ある）
  for (const o of b.objects) if (!o.walk) { let ok = false; for (let y = o.y - 1; y <= o.y + (o.h || 1); y++) for (let x = o.x - 1; x <= o.x + (o.w || 1); x++) if (free(x, y)) ok = true; if (!ok) errors.push(`${w} ${o.id}: まわりに 歩ける 床が ない`); }
  for (const o of b.objects) { for (const f of o.fish || []) { if (!fishIds.has(f)) errors.push(`${w} ${o.id}: 魚 ${f} が ない`); if (used.has(f)) errors.push(`${w}: 魚 ${f} が 2つの 水そうに ある`); used.set(f, o.id); } if (o.dino) { if (!dinoIds.has(o.dino)) errors.push(`${w} ${o.id}: 恐竜 ${o.dino} が ない`); if (used.has(o.dino)) errors.push(`${w}: ${o.dino} が 2つ`); used.set(o.dino, o.id); } }
  if (bid === "aquarium") for (const f of fishIds) if (!used.has(f)) errors.push(`水族館: 魚 ${f} の 水そうが ない`);
  if (bid === "museum") for (const d of dinoIds) if (!used.has(d)) errors.push(`博物館: 恐竜 ${d} の 台が ない`);
  for (const n of b.npcs) { if (!free(n.x, n.y)) errors.push(`${w} ${n.id}: (${n.x},${n.y}) が 床で ない`); if (!TALK[n.talk]) errors.push(`${w} ${n.id}: ことば TALK.${n.talk} が ない`); for (const it of Object.values(n.outfit || {})) if (!itemIds.has(it)) errors.push(`${w} ${n.id}: 服 ${it} が ゲームに ない`); }
  // 町に たてる 場所
  const pr = probeOutside(b.outside);
  for (const e of pr.err) errors.push(`${w}（${b.outside.map} の ${b.outside.x},${b.outside.y}）: ${e}`);
  const start0 = b.exits.find((e) => e.role === "in");
  const arrive = { x: start0.x, y: start0.y - 1, dir: "up" };
  const warps = b.exits.map((e) => ({ x: e.x, y: e.y, w: e.w, h: 1, to: b.outside.map, tx: pr.front ? pr.front[0] : 0, ty: pr.front ? pr.front[1] : 0, dir: "down" }));
  // 入口から 行けるか
  const start = b.exits.find((e) => e.role === "in"), q = [[start.x, start.y - 1]], seen = new Set([q[0].join()]);
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (!seen.has(k) && free(nx, ny) && rows[ny][nx] !== EXIT) { seen.add(k); q.push([nx, ny]); } } }
  for (const r of b.rooms) { let ok = false; for (let y = r.y; y < r.y + r.h && !ok; y++) for (let x = r.x; x < r.x + r.w; x++) if (seen.has(x + "," + y)) { ok = true; break; } if (!ok) errors.push(`${w}: 入口から「${r.name}」に 行けない`); }
  for (const e of b.exits) if (!seen.has(`${e.x},${e.y - 1}`)) errors.push(`${w}: 出口 (${e.x},${e.y}) に 行けない`);
  for (const id of b.route) if (!b.rooms.some((r) => r.id === id)) errors.push(`${w}: 順路の ${id} が ない`);
  OUTB[bid] = { name: b.name, W: b.W, H: b.H, rows, rooms: b.rooms.map(({ id, name, x, y, w, h, intro }) => ({ id, name, x, y, w, h, intro })), objects, npcs: b.npcs, exits: b.exits, route: b.route, outside: { ...b.outside, door: Math.floor(b.outside.w / 2), doorAt: pr.door, front: pr.front }, arrive, warps, reach: seen.size };
}
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }
const DATA = { version: 1, tiles: TILES, buildings: OUTB, info: INFO, talk: TALK, songs: SONGS };
writeFileSync(OUT + "museum.json", JSON.stringify(DATA, null, 1));
writeFileSync(OUT + "museum-data.js", `// 水族館と 恐竜博物館の データ（⑤ 館内の 地図・展示・順路・寄贈の ことば）。docs/design/features/museum/ から 自動生成。手で 直さず、tools/feature-design/museum-data.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/museum-data.js に 置き、index.html と sw.js の 両方に 登録（museum.js より 前）。\nconst MUSEUM_DATA = ${JSON.stringify(DATA)};\n`);
// 一覧
const FN = Object.fromEntries(FISH.map((f) => [f.id, f.name])), DN = Object.fromEntries(DINOS.map((d) => [d.id, d.name]));
let md = `# 水族館と 恐竜博物館（自動生成）\n\n地図は \`museum.json\` の \`buildings.<館>.rows\`（1文字 = 1マス）。${Object.entries(TILES).map(([k, v]) => `\`${k}\` ${v.name}`).join("・")}（ゲームの いまの タイル文字と ぶつからない 文字。\`X\` だけ 通れない）。展示物は \`objects\`（足もとの 左上 x,y と 大きさ w,h）。\n`;
for (const [bid, b] of Object.entries(OUTB)) {
  md += `\n## ${b.name}（${b.W}×${b.H}）\n\n**町に たてる 場所**: \`${b.outside.map}\` の (${b.outside.x}, ${b.outside.y}) から ${b.outside.w}×${b.outside.h}マス（建物 id \`${b.outside.id}\`・入口 (${b.outside.doorAt.join(", ")})・入口の まえ (${b.outside.front.join(", ")})）。館に 入ると (${b.arrive.x}, ${b.arrive.y}) に 上むきで 立つ。\n\n**順路**: ${b.route.map((id) => b.rooms.find((r) => r.id === id).name).join(" → ")}\n\n| へや | 入った ときの 案内（intro） |\n| --- | --- |\n${b.route.map((id) => b.rooms.find((r) => r.id === id)).map((r) => `| ${r.name} | ${r.intro} |`).join("\n")}\n\n| 展示 id | しゅるい | なまえ | へや | 寄贈で ふえる もの |\n| --- | --- | --- | --- | --- |\n`;
  const roomOf = (o) => (b.rooms.find((r) => o.x >= r.x && o.x < r.x + r.w && o.y >= r.y && o.y < r.y + r.h) || {}).name || "";
  md += b.objects.filter((o) => !["arrow", "bench", "plant"].includes(o.kind)).map((o) => `| ${o.id} | ${o.kind} | ${o.label || o.text || ""} | ${roomOf(o)} | ${o.fish ? o.fish.map((f) => FN[f]).join("・") : o.dino ? DN[o.dino] + "（骨 " + DINOS.find((d) => d.id === o.dino).art.parts.length + "こ）" : o.info ? "（説明: " + INFO[o.info].name + "）" : "（かざり）"} |`).join("\n") + "\n";
  md += `\n\`\`\`text\n${b.rows.join("\n")}\n\`\`\`\n`;
}
md += `\n## 参考に した 実際の 館（順路の 考えかた）\n\n- 海遊館（大阪）: 入口の トンネル「アクアゲート」→ エスカレーターで 8階へ → 建物の まんなかの「太平洋」水槽（深さ 9m・水量 5,400t）の まわりを らせんの スロープで 下りながら 見る。[海遊館 館内マップ](https://www.kaiyukan.com/area/info/map/)・[nippon.com](https://www.nippon.com/ja/guide-to-japan/gu900193/)\n- 沖縄美ら海水族館: 浅い サンゴ礁（タッチプール）→ サンゴの 海 → 大水槽「黒潮の海」→ 深海へ と、浅い 海から 深い 海へ すすむ 順路。[館内マップ](https://churaumi.okinawa/sp/area/floormap/)・[海洋博公園](https://oki-park.jp/kaiyohaku/inst/73)\n- 福井県立恐竜博物館: 3階の 入口から 長い エスカレーター（33m）で 地下1階へ → 化石が ならぶ「ダイノストリート」→ ドームの 展示室（恐竜の世界・地球の科学・生命の歴史）。2023年の 新館には、1〜3階の 吹き抜けに 福井で 見つかった 恐竜 5体と 鳥 1羽を つみあげた 高さ 約13m の「恐竜の塔」が ある。[フロアマップ](https://www.dinosaur.pref.fukui.jp/guide/floormap.html)・[るるぶ＋](https://plus.rurubu.jp/article/xgx8vo0y4)・[JDN「恐竜の塔」](https://www.japandesign.ne.jp/interview/tanseisha-fpdm-1/)・[ふくいドットコム](https://www.fuku-e.com/fukutabi/detail_239.html)\n\nこの ゲームでは: 水族館は「やまの さわ → かわ → いけ → うみ → しんかい」と 水の たびを する 順路に、大水槽の まわりを ぐるっと まわる 回廊を くみあわせた。博物館は 入口から エスカレーターで おりて「かせきの みち」を とおり、時代ごとに ならぶ ホールへ 入る。どちらも 館の 名前・展示の 絵は オリジナル。\n`;
md += `\n## 展示の 説明（\`info\`・展示を タップした とき）\n\n| キー | なまえ | 説明 |\n| --- | --- | --- |\n${Object.entries(INFO).map(([k, v]) => `| ${k} | ${v.name} | ${v.text.replace(/\n/g, " ")} |`).join("\n")}\n\n### 展示の 説明の 出典\n\n- アンモナイト（イカ・タコ・オウムガイの なかま、白亜紀の おわりに 絶滅）: [東北大学総合学術博物館](https://www.museum.tohoku.ac.jp/past_kikaku/ammonoidea/whats/index.htm)・[神奈川県立生命の星・地球博物館](https://nh.kanagawa-museum.jp/www/contents/1611887517533/index.html)\n- 三葉虫（カンブリア紀に あらわれ、ペルム紀の おわりに 絶滅）: [東北大学総合学術博物館](https://www.museum.tohoku.ac.jp/exhibition_info/column/trilobite.html)・[三笠市立博物館](https://www.city.mikasa.hokkaido.jp/museum/detail/00012563.html)\n- 足あとの 化石（足あとの 大きさと 歩はばから 速さが わかる）: [福井県立恐竜博物館 Q&A](https://www.dinosaur.pref.fukui.jp/dino/faq/r02051.html)・[福井新聞](https://www.fukuishimbun.co.jp/articles/-/1326696)\n- くらげ（脳も 骨も ない・からだの 約95%が 水）: [umito.（Umios）](https://umito.umios.com/article164/)・[サンシャイン水族館 いきもの研究室](https://onlineshop.sunshinecity.jp/blog/post-2940/)\n- 恐竜の塔（福井で 見つかった 恐竜 5体と 鳥 1羽・高さ 約13m）: [JDN](https://www.japandesign.ne.jp/interview/tanseisha-fpdm-1/)\n`;
writeFileSync(OUT + "MUSEUM_LIST.md", md);
console.log(`museum: 水族館 ${OUTB.aquarium.W}×${OUTB.aquarium.H}（展示 ${BUILDINGS.aquarium.objects.filter((o) => o.fish).length}・魚 50）／博物館 ${OUTB.museum.W}×${OUTB.museum.H}（骨格の 台 ${BUILDINGS.museum.objects.filter((o) => o.dino).length}）`);
