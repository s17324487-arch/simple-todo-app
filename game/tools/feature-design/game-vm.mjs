// ゲームを node の vm に 読みこむ（index.html の じゅんに js/ を 実行。DOM は かんたんな 代わり）。⑤⑥ の 検査で つかう。
// gctx … ゲームの グローバル（MAP_DEFS・SOLID_CH・ITEM_INDEX・Sound など）／ run(式) … その 中で 式を 実行
// probeOutside(o) … 町の マップ o.map の (o.x, o.y) に o.w×o.h の 建物を たてて みて、あいた 地面か・たてた あとも 町の 入口から ほかの ドア・ワープ・人・宝箱に 行けるかを しらべる
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
const GAME = new URL("../../", import.meta.url).pathname;
const html = readFileSync(join(GAME, "index.html"), "utf8"), noop = () => {}, store = new Map();
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, getContext: () => null, setAttribute: noop, dataset: {} });
const gctx = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, requestAnimationFrame: noop, navigator: {}, location: { protocol: "http:", origin: "http://localhost", search: "" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null }, Image: class { set src(v) {} }, addEventListener: noop };
export { gctx };
gctx.window = gctx; vm.createContext(gctx);
for (const f of scripts) vm.runInContext(readFileSync(join(GAME, f), "utf8"), gctx, { filename: f });
export const gameChars = new Set(vm.runInContext("[...Object.keys(GROUND), ...SOLID_CH, ...Object.keys(OBJ_CH), ...Object.values(MAP_DEFS).flatMap((d) => d.rows.join('').split(''))]", gctx));
export const itemIds = new Set(vm.runInContext("Object.keys(ITEM_INDEX)", gctx));
// 町に 建物を たてて みて、歩いて 行けるかを しらべる（tools/check.mjs の 到達性と 同じ 考え）
export const probeOutside = vm.runInContext(`(o) => {
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
export const run = (expr) => vm.runInContext(expr, gctx);
