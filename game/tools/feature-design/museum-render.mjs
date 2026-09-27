// ⑤ 館内の 見本を SVG で 描く（町の 見本 tools/town-design と 同じ 3/4 ビュー・1マス 32px）。
// renderBuilding(bid, { fish, bones, party, labels, crop }) → SVG 文字列
//   fish: 寄贈ずみの 魚 id の Set ／ bones: { dinoId: [部品 id, ...] }（ない 恐竜は 空）／ party: { x, y, dir } 3にんの 先頭の マス
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { heroSvg, npcSvg } from "../town-design/heroes.mjs";
const HERE = new URL(".", import.meta.url).pathname, TS = 32, INK = "#1F1D1B";
const DATA = JSON.parse(readFileSync(new URL("../../docs/design/features/museum/museum.json", import.meta.url), "utf8"));
const FISH = JSON.parse(readFileSync(new URL("../../docs/design/features/fishing/fishing.json", import.meta.url), "utf8")).fish;
const DINOS = JSON.parse(readFileSync(new URL("../../docs/design/features/fossils/fossils.json", import.meta.url), "utf8")).dinos;
const ctx = { Math, JSON, console }; vm.createContext(ctx);
for (const f of ["fish-art-ref.js", "fossil-art-ref.js", "museum-art-ref.js"]) vm.runInContext(readFileSync(HERE + f, "utf8") + `;globalThis.${{ "fish-art-ref.js": "FishArtRef", "fossil-art-ref.js": "FossilArtRef", "museum-art-ref.js": "MuseumArtRef" }[f]}=${{ "fish-art-ref.js": "FishArtRef", "fossil-art-ref.js": "FossilArtRef", "museum-art-ref.js": "MuseumArtRef" }[f]};`, ctx, { filename: f });
const FA = ctx.FishArtRef, FO = ctx.FossilArtRef, MA = ctx.MuseumArtRef;
const r1 = (n) => Math.round(n * 10) / 10;
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + k)))); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };

// 床の もよう
function floorTile(ch, x, y, rows) {
  const c = (DATA.tiles[ch] || {}).color || "#E8E2D6", X = x * TS, Y = y * TS, h = hash(x, y, 7);
  let s = `<rect x="${X}" y="${Y}" width="${TS}" height="${TS}" fill="${c}"/>`;
  if (ch === "9" || ch === "7") { s += `<path d="M${X},${Y + 10.5} L${X + TS},${Y + 10.5} M${X},${Y + 21.5} L${X + TS},${Y + 21.5}" stroke="${shade(c, -0.14)}" stroke-width="1"/><path d="M${X + ((x * 13 + y * 7) % 4) * 8},${Y} L${X + ((x * 13 + y * 7) % 4) * 8},${Y + 10.5} M${X + ((x * 5 + y * 3) % 4) * 8 + 4},${Y + 10.5} L${X + ((x * 5 + y * 3) % 4) * 8 + 4},${Y + 21.5}" stroke="${shade(c, -0.14)}" stroke-width="1"/>`; }
  else if (ch === "0" || ch === "H") s += `<rect x="${X + 0.5}" y="${Y + 0.5}" width="${TS - 1}" height="${TS - 1}" fill="none" stroke="${shade(c, -0.08)}" stroke-width="1"/>`;
  else if (ch === "S") s += `<path d="M${X},${Y + 16} L${X + TS},${Y + 16} M${X + (y % 2 ? 8 : 20)},${Y} L${X + (y % 2 ? 8 : 20)},${Y + 16} M${X + (y % 2 ? 24 : 4)},${Y + 16} L${X + (y % 2 ? 24 : 4)},${Y + 32}" stroke="${shade(c, -0.12)}" stroke-width="1.2"/>`;
  else if (ch === "6" || ch === "8") { for (let i = 0; i < 3; i++) s += `<circle cx="${r1(X + 5 + hash(x, y, i) * 22)}" cy="${r1(Y + 5 + hash(y, x, i) * 22)}" r="${ch === "8" ? 0.8 : 1}" fill="${ch === "8" ? "#9FC4FF" : shade(c, 0.18)}" opacity="${ch === "8" ? 0.7 : 0.8}"/>`; }
  else if (ch === "3") { s += `<circle cx="${r1(X + 8 + h * 16)}" cy="${r1(Y + 10 + h * 10)}" r="3" fill="${shade(c, -0.1)}"/><circle cx="${r1(X + 22 - h * 10)}" cy="${r1(Y + 24 - h * 8)}" r="2" fill="${shade(c, 0.12)}"/>`; }
  else if (ch === "4") { for (let i = 0; i < 4; i++) s += `<circle cx="${r1(X + 4 + hash(x, y, i + 3) * 24)}" cy="${r1(Y + 4 + hash(y, x, i + 3) * 24)}" r="0.9" fill="${shade(c, -0.2)}"/>`; }
  else if (ch === "5") s += `<path d="M${X + 6 + h * 10},${Y + 22} l1,-5 M${X + 9 + h * 10},${Y + 22} l-1,-4 M${X + 20 - h * 6},${Y + 12} l1,-4" stroke="${shade(c, -0.2)}" stroke-width="1.2" stroke-linecap="round"/>`;
  else if (ch === "2") s += `<rect x="${X}" y="${Y}" width="${TS}" height="${TS}" fill="#8C949C"/>` + [4, 12, 20, 28].map((d) => `<path d="M${X},${Y + d} L${X + TS},${Y + d}" stroke="#6E767E" stroke-width="2"/>`).join("");
  else if (ch === "E") s += `<rect x="${X}" y="${Y}" width="${TS}" height="${TS}" fill="#C8B89A"/><path d="M${X + 4},${Y + 6} L${X + 28},${Y + 6}" stroke="#8C7A62" stroke-width="3"/>`;
  return s;
}
// かべ（上の 面 ＋ 床に めんした 前の 面）
function wallSprite(x, y, rows, H) {
  const X = x * TS, Y = y * TS, below = y + 1 < H && rows[y + 1][x] !== "X";
  let s = `<rect x="${X}" y="${Y - 14}" width="${TS}" height="${TS}" fill="#5E5868"/>`;
  if (hash(x, y, 2) < 0.2) s += `<rect x="${X + 6}" y="${Y - 8}" width="10" height="3" fill="#6E6878"/>`;
  if (below) s += `<rect x="${X}" y="${Y + 18}" width="${TS}" height="14" fill="#9A94A6"/><rect x="${X}" y="${Y + 28}" width="${TS}" height="4" fill="#6E6878"/><path d="M${X},${Y + 18} L${X + TS},${Y + 18}" stroke="${INK}" stroke-width="1.2"/>`;
  return s;
}
const fishById = Object.fromEntries(FISH.map((f) => [f.id, f])), dinoById = Object.fromEntries(DINOS.map((d) => [d.id, d]));
// 展示 1つの 絵（寄贈の ようすで 中身が かわる）→ { w, h, svg }
function propOf(o, { fish = new Set(), bones = {}, full = false } = {}) {
  const opts = { ...o };
  if (o.fish) opts.fish = o.fish.map((id) => { const f = fishById[id]; return { id, svg: FA.svg(f.art, { uid: "m" + id, flip: !!f.flip }), have: full || fish.has(id), scale: Math.min(1.8, 0.7 + f.size[1] / 120), big: f.size[1] > 90, noflip: !!f.flip }; });
  if (o.dino) { const d = dinoById[o.dino], have = full ? d.art.parts.map((p) => p.id) : bones[o.dino] || []; opts.dino = d; opts.have = have; opts.left = d.art.parts.length - have.length || 0; }
  if (o.boneOf) { const [di, pi] = o.boneOf.split("."); opts.bone = FO.partSvg(dinoById[di], pi); }
  return MA.prop(o.kind, opts);
}
export function exhibitSvg(bid, id, opts = {}) { return propOf(DATA.buildings[bid].objects.find((x) => x.id === id), opts).svg; }
export function renderBuilding(bid, { fish = new Set(), bones = {}, party = null, labels = false, crop = null, full = false } = {}) {
  const b = DATA.buildings[bid], rows = b.rows, W = b.W * TS, H = b.H * TS;
  let floor = "", decal = "";
  for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++) if (rows[y][x] !== "X") floor += floorTile(rows[y][x], x, y, rows);
  const sprites = [];
  for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++) if (rows[y][x] === "X") sprites.push({ z: (y + 1) * TS - 0.5, s: wallSprite(x, y, rows, b.H) });
  for (const o of b.objects) {
    const p = propOf(o, { fish, bones, full }), X = o.x * TS, bottom = (o.y + (o.h || 1)) * TS;
    const svg = p.svg.replace("<svg ", `<svg x="${X}" y="${r1(bottom - p.h)}" width="${p.w}" height="${r1(p.h)}" `);
    if (o.walk && o.kind !== "escalator") decal += svg; else sprites.push({ z: bottom - (o.walk ? 40 : 1), s: svg });
  }
  for (const n of b.npcs) sprites.push({ z: (n.y + 1) * TS - 2, s: npcSvg({ sp: n.sp, outfit: n.outfit, dir: "down" }, n.x * TS + 16, (n.y + 1) * TS - 4) });
  if (party) { const pos = [[0, 0], [-1, 1], [1, 1]], ids = ["wanko", "gachan", "goji"]; ids.forEach((id, i) => { const px = party.x + pos[i][0], py = party.y + pos[i][1]; sprites.push({ z: (py + 1) * TS - 3, s: heroSvg(id, px * TS + 16, (py + 1) * TS - 5, { dir: party.dir || "up", face: party.face }) }); }); }
  sprites.sort((a, c) => a.z - c.z);
  let lab = "";
  if (labels) for (const r of b.rooms) { const t = r.name, w = [...t].length * 11 + 16; lab += `<rect x="${r.x * TS + 6}" y="${r.y * TS + 6}" width="${w}" height="20" rx="10" fill="#FFFDF6" fill-opacity="0.92" stroke="${INK}" stroke-width="1.6"/><text x="${r.x * TS + 6 + w / 2}" y="${r.y * TS + 20}" font-size="11" font-weight="900" fill="#3C352E" text-anchor="middle" font-family="'Noto Sans CJK JP',sans-serif">${t}</text>`; }
  const vb = crop ? crop.map((v, i) => (i < 2 ? v * TS : v)) : [0, -16, W, H + 16];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" width="${vb[2]}" height="${vb[3]}"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#2A2630"/>${floor}${decal}${sprites.map((x) => x.s).join("")}${lab}</svg>`;
}
export { DATA, FISH, DINOS };
