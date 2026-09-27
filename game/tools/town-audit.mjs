// 町の 検査（ネット・ブラウザ不要）。ゲームの マップを 読み込んで「にぎやかさ」と「道の 自然さ」を 数える。
//   npm run audit:town                 … すべての 町の 表を 出す
//   npm run audit:town -- --check heiwadai   … heiwadai が めやすに 届かなければ 失敗（exit 1）
// めやすは docs/design/TOWN_GUIDE.md（「置きかたの めやす」）と 同じ。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
const GAME = new URL("..", import.meta.url).pathname;
const TARGET = { propsPer100: 8, propKinds: 20, emptyPct: 10, maxModelShare: 30, roadIslands: 1, jaggedCorners: 0 };
const args = process.argv.slice(2), ci = args.indexOf("--check"), checkIds = ci >= 0 ? args.slice(ci + 1).filter((a) => !a.startsWith("--")) : [];
// ゲームの スクリプトを index.html の 順に 読む（画面の 部品は 空の にせもの）
const html = readFileSync(join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const noop = () => {}, store = new Map();
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const ctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
ctx.window = ctx; vm.createContext(ctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), ctx, { filename: f });
const R = vm.runInContext("({ MAP_DEFS, WorldMap })", ctx);
const ROAD = new Set(["=", "-", "v", "z", "b", "p", "D", "g"]);
const towns = Object.keys(R.MAP_DEFS).filter((id) => !R.MAP_DEFS[id].area || ["town", "city", "heiwadai", "harbor", "airport"].includes(id));
const rows = [];
for (const id of towns) {
  const d = R.MAP_DEFS[id]; let m; try { m = new R.WorldMap(id); } catch { continue; }
  const W = m.w, H = m.h, inside = (x, y) => x >= 2 && y >= 2 && x < W - 2 && y < H - 2;
  let walk = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && !m.isSolid(x, y)) walk++;
  const props = m.sprites.filter((s) => s.kind !== "building" && s.kind !== "tree" && s.kind !== "pine"), kinds = new Set(props.map((s) => s.kind));
  const occ = new Set();
  for (const s of m.sprites) { const sx = s.bx != null ? s.bx : s.x; for (let i = 0; i < (s.tw || 1); i++) occ.add(sx + i + "," + s.y); }
  for (const b of d.buildings || []) for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) occ.add(xx + "," + yy);
  for (const o of d.objects || []) for (let yy = o.y; yy < o.y + (o.h || 1); yy++) for (let xx = o.x; xx < o.x + (o.w || 1); xx++) occ.add(xx + "," + yy);
  const near = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (occ.has(x + dx + "," + (y + dy))) return true; return false; };
  let empty = 0; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (!m.isSolid(x, y) && !near(x, y)) empty++;
  const models = {}; for (const b of d.buildings || []) { const k = (b.style || b.kind || "b") + " " + b.w + "x" + b.h; models[k] = (models[k] || 0) + 1; }
  const nb = (d.buildings || []).length, maxShare = nb ? Math.round((Math.max(...Object.values(models)) / nb) * 100) : 0;
  const isRoad = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d.rows && ROAD.has(d.rows[y][x]);
  let jag = 0, comps = 0; const seen = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isRoad(x, y)) {
    if (isRoad(x + 1, y + 1) && !isRoad(x + 1, y) && !isRoad(x, y + 1)) jag++;
    if (isRoad(x - 1, y + 1) && !isRoad(x - 1, y) && !isRoad(x, y + 1)) jag++;
    if (!seen.has(x + "," + y)) { comps++; const st = [[x, y]]; seen.add(x + "," + y); while (st.length) { const [cx, cy] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = cx + dx + "," + (cy + dy); if (isRoad(cx + dx, cy + dy) && !seen.has(k)) { seen.add(k); st.push([cx + dx, cy + dy]); } } } }
  }
  rows.push({ id, size: `${W}x${H}`, buildings: nb, propsPer100: +((props.length / Math.max(1, walk)) * 100).toFixed(1), propKinds: kinds.size, emptyPct: Math.round((empty / Math.max(1, walk)) * 100), maxModelShare: maxShare, roadIslands: comps, jaggedCorners: jag });
}
const ok = (r) => ({ propsPer100: r.propsPer100 >= TARGET.propsPer100, propKinds: r.propKinds >= TARGET.propKinds, emptyPct: r.emptyPct <= TARGET.emptyPct, maxModelShare: r.maxModelShare <= TARGET.maxModelShare, roadIslands: r.roadIslands <= TARGET.roadIslands, jaggedCorners: r.jaggedCorners <= TARGET.jaggedCorners });
const cols = ["propsPer100", "propKinds", "emptyPct", "maxModelShare", "roadIslands", "jaggedCorners"];
console.log("町の 検査（めやす: 小物/100マス≥8・種類≥20・なにもない場所≤10%・同じ建物の型≤30%・道の島=1・ギザギザ=0）\n");
console.log(["id".padEnd(10), "size".padEnd(7), "bld".padStart(4), ...cols.map((c) => c.padStart(14))].join(" "));
for (const r of rows) { const o = ok(r); console.log([r.id.padEnd(10), r.size.padEnd(7), String(r.buildings).padStart(4), ...cols.map((c) => ((o[c] ? " " : "✗") + r[c]).padStart(14))].join(" ")); }
let fail = 0; for (const id of checkIds) { const r = rows.find((x) => x.id === id); if (!r) { console.log(`\n✗ ${id}: マップが ない`); fail++; continue; } const bad = Object.entries(ok(r)).filter(([, v]) => !v).map(([k]) => k); if (bad.length) { console.log(`\n✗ ${id}: めやすに 届かない → ${bad.join(", ")}`); fail++; } else console.log(`\n✓ ${id}: めやすを 満たす`); }
process.exit(fail ? 1 : 0);
