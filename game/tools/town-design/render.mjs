// 平和台 v0.2 を 描く（高精細アセット・ベクターの道）。 npm run design:heiwadai（build.mjs）から 呼ぶ
// 出力: img/plan.png（ラベルつき 全体図）・heiwadai-v02.json / .txt（Codex 用の 仕様）。スマホの 切り抜きは 途中ファイル（TMP）
import { writeFileSync } from "node:fs";
import { OUT, IMG, TMP, launch } from "./paths.mjs";
import { P, INK, f, esc, hash, R, Rn, C, E, L, T, defs } from "./lib.mjs";
import { REG } from "./assets_more.mjs";
import { heroSvg, npcSvg } from "./heroes.mjs";
import * as M from "./heiwadai-v02.mjs";
const { W, H, ground: G, ROADS, RING, FILLETS, CROSSWALKS, MARKS, CENTER } = M;
const MW = W * P, MH = H * P, X = (v) => f(v * P);

// ---------- 道の 形（中心線を サンプルして 左右に ずらす） ----------
function sample(rd) {
  const pts = [];
  for (const q of rd.pieces) {
    if (q.t === "seg") { const dx = q.b[0] - q.a[0], dy = q.b[1] - q.a[1], len = Math.hypot(dx, dy), t = [dx / len, dy / len], n = Math.max(1, Math.ceil(len / 0.5)); for (let i = 0; i <= n; i++) pts.push({ p: [q.a[0] + (dx * i) / n, q.a[1] + (dy * i) / n], t }); }
    else { const n = Math.max(2, Math.ceil(Math.abs(q.a1 - q.a0) / (Math.PI / 120))), s = Math.sign(q.a1 - q.a0); for (let i = 0; i <= n; i++) { const a = q.a0 + ((q.a1 - q.a0) * i) / n; pts.push({ p: [q.c[0] + q.r * Math.cos(a), q.c[1] + q.r * Math.sin(a)], t: [-Math.sin(a) * s, Math.cos(a) * s] }); } }
  }
  const out = pts.filter((o, i) => i === 0 || Math.hypot(o.p[0] - pts[i - 1].p[0], o.p[1] - pts[i - 1].p[1]) > 1e-6);
  let s = 0; out.forEach((o, i) => { if (i) s += Math.hypot(o.p[0] - out[i - 1].p[0], o.p[1] - out[i - 1].p[1]); o.s = s; });
  return out;
}
const off = (o, d) => [o.p[0] - o.t[1] * d, o.p[1] + o.t[0] * d];
const pathOf = (pts) => "M" + pts.map(([x, y]) => `${X(x)},${X(y)}`).join(" L") ;
function band(sm, d, ext = 0) { let s = sm; if (ext) { const o = sm[0]; s = [{ p: [o.p[0] - o.t[0] * ext, o.p[1] - o.t[1] * ext], t: o.t }, ...sm]; } return pathOf([...s.map((o) => off(o, d)), ...s.slice().reverse().map((o) => off(o, -d))]) + " Z"; }
const line = (sm, d, s0 = -1e9, s1 = 1e9) => pathOf(sm.filter((o) => o.s >= s0 - 1e-6 && o.s <= s1 + 1e-6).map((o) => off(o, d)));
const RS = Object.fromEntries(ROADS.map((r) => [r.id, sample(r)]));
// 角まる長方形（ロータリー）
function rr(x0, y0, x1, y1, r) { return `M${X(x0 + r)},${X(y0)} H${X(x1 - r)} A${X(r)},${X(r)} 0 0 1 ${X(x1)},${X(y0 + r)} V${X(y1 - r)} A${X(r)},${X(r)} 0 0 1 ${X(x1 - r)},${X(y1)} H${X(x0 + r)} A${X(r)},${X(r)} 0 0 1 ${X(x0)},${X(y1 - r)} V${X(y0 + r)} A${X(r)},${X(r)} 0 0 1 ${X(x0 + r)},${X(y0)} Z`; }
const ringBox = (d) => rr(RING.x0 - d, RING.y0 - d, RING.x1 + d, RING.y1 + d, Math.max(0.2, RING.r + d));
const hw = RING.w / 2;

// ---------- 地面 ----------
const GP = { R: "p-asphalt", g: "p-grass", l: "p-lawn", G: "p-granite", V: "p-paver", Z: "p-terrazzo", C: "p-concrete", P: "p-asphalt", S: "p-gravel", K: "p-stone", D: "p-dirt", O: "p-lot", B: "p-ballast", M: "p-concrete", X: "p-grass" };
const HARD = new Set(["G", "V", "Z", "C", "P", "K", "M", "R"]);
let sGround = "";
for (let y = 0; y < H; y++) { let x = 0; while (x < W) { const c = G[y][x]; let e = x; while (e + 1 < W && G[y][e + 1] === c) e++; sGround += `<rect x="${x * P}" y="${y * P}" width="${(e - x + 1) * P + 0.6}" height="${P + 0.6}" fill="url(#${GP[c] || "p-grass"})"/>`; x = e + 1; } }
// かたい地面と やわらかい地面の さかい（縁石の 線）
let sEdge = "";
const gat = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? "X" : G[y][x]);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = gat(x, y); if (!HARD.has(c)) continue;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = gat(x + dx, y + dy); if (HARD.has(n) || n === "X" || n === "B") continue;
    const x1 = dx === 1 ? x + 1 : x, y1 = dy === 1 ? y + 1 : y, x2 = dx === 0 ? x + 1 : x1, y2 = dy === 0 ? y + 1 : y1;
    sEdge += `<path d="M${X(x1)},${X(y1)} L${X(x2)},${X(y2)}" stroke="#D3CCBF" stroke-width="3.2"/><path d="M${X(x1) + dx * 1.6},${X(y1) + dy * 1.6} L${X(x2) + dx * 1.6},${X(y2) + dy * 1.6}" stroke="#A69F92" stroke-width="0.9"/>`; }
}
// 線路: まくら木と レール（2本）、ホームの へり
let sRail = "";
for (const cy of [4, 6]) { for (let x = 0; x < W; x += 0.5) sRail += Rn(x * P + 3, (cy - 0.68) * P, 7, 1.36 * P, "#BDB7AC") + L(x * P + 3, (cy - 0.68) * P, x * P + 3, (cy + 0.68) * P, "#A39C90", 0.8);
  for (const dy of [-0.36, 0.36]) sRail += L(0, (cy + dy) * P, MW, (cy + dy) * P, "#6F7478", 3) + L(0, (cy + dy) * P - 0.8, MW, (cy + dy) * P - 0.8, "#D0D4D6", 1); }
sRail += Rn(16 * P, 7 * P, 32 * P, 3, "#F4F4F0") + `<rect x="${16 * P}" y="${7 * P + 5}" width="${32 * P}" height="9" fill="url(#p-tactile-dot)"/>` + L(16 * P, 7 * P + 18, 48 * P, 7 * P + 18, "#FFFFFF", 1.4, { dash: "10 6", op: 0.9 });
// 点字ブロックの 道（駅 → バス停・商店街の門・横断歩道）
const TACT = [[[31.4, 14.55], [48.6, 14.55]], [[31.4, 14.55], [24.9, 14.55], [24.9, 27.8]], [[40.3, 26.9], [40.3, 27.6]], [[45.7, 26.9], [45.7, 27.6]]];
let sTact = "";
for (const pl of TACT) for (let i = 0; i + 1 < pl.length; i++) { const [a, b] = [pl[i], pl[i + 1]], hz = a[1] === b[1], x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]); sTact += `<rect x="${X(hz ? x0 : x0 - 0.16)}" y="${X(hz ? y0 - 0.16 : y0)}" width="${X(hz ? Math.abs(b[0] - a[0]) : 0.32)}" height="${X(hz ? 0.32 : Math.abs(b[1] - a[1]))}" fill="url(#p-tactile-line${hz ? "-h" : ""})"/>`; }
for (const [x, y] of [[31.4, 14.55], [42, 15.25], [47, 15.25], [24.9, 27.8], [24.9, 14.55]]) sTact += `<rect x="${X(x - 0.2)}" y="${X(y - 0.2)}" width="${X(0.4)}" height="${X(0.4)}" fill="url(#p-tactile-dot)"/>`;

// ---------- 道: 歩道 → 縁石 → 車道 → 島 → 隅切り → 切り下げ → 路面表示 ----------
const CURB = (d, w = 5.8) => `fill="none" stroke="#DCD6CA" stroke-width="${w}" stroke-linejoin="round"`;
let sRoad = "";
for (const r of ROADS) sRoad += `<path d="${band(RS[r.id], r.carriage / 2 + r.side)}" fill="url(#p-paver)"/>`;
for (const r of ROADS) for (const sg of [1, -1]) { const d = sg * (r.carriage / 2 + 0.09); sRoad += `<path d="${line(RS[r.id], d)}" ${CURB()}/><path d="${line(RS[r.id], sg * (r.carriage / 2 + 0.2))}" fill="none" stroke="#B3AC9F" stroke-width="0.9"/>`; }
sRoad += `<path d="${ringBox(hw + 0.09)}" ${CURB()}/><path d="${ringBox(hw + 0.2)}" fill="none" stroke="#B3AC9F" stroke-width="0.9"/>`;
for (const r of ROADS) sRoad += `<path d="${band(RS[r.id], r.carriage / 2, r.extendStart || 0)}" fill="url(#p-asphalt)"/>`;
sRoad += `<path d="${ringBox(hw)} ${ringBox(-hw)}" fill="url(#p-asphalt)" fill-rule="evenodd"/>`;
// ロータリーの 島（縁石つきの 植えこみ）
sRoad += `<path d="${ringBox(-hw)}" fill="url(#p-lawn)"/><path d="${ringBox(-hw - 0.09)}" ${CURB()}/><path d="${ringBox(-hw - 0.2)}" fill="none" stroke="#B3AC9F" stroke-width="0.9"/>`;
// 隅切り（角を まるく）
for (const q of FILLETS) { const [ax, ay] = q.at, { sx, sy, r } = q, cx = ax + sx * r, cy = ay + sy * r, sweep = sx * sy > 0 ? 0 : 1;
  sRoad += `<path d="M${X(ax)},${X(ay)} L${X(ax + sx * r)},${X(ay)} A${X(r)},${X(r)} 0 0 ${sweep} ${X(ax)},${X(ay + sy * r)} Z" fill="url(#p-asphalt)"/>`;
  const r2 = r - 0.09; sRoad += `<path d="M${X(cx)},${X(cy - sy * r2)} A${X(r2)},${X(r2)} 0 0 ${sweep} ${X(cx - sx * r2)},${X(cy)}" ${CURB()}/>`; }
// 切り下げ（車の 出入り口）
const AV = ROADS.find((r) => r.id === "avenue"), U = [Math.SQRT1_2, Math.SQRT1_2], NE = [Math.SQRT1_2, -Math.SQRT1_2];
const polyD = (pts) => `M${pts.map(([x, y]) => `${X(x)},${X(y)}`).join(" L")} Z`;
for (const d of M.DRIVE) {
  if (d.kind === "rect") { sRoad += `<rect x="${X(d.x0)}" y="${X(d.y0)}" width="${X(d.x1 - d.x0)}" height="${X(d.y1 - d.y0)}" fill="url(#p-concrete)"/>` + L(X(d.x0) + 1.5, X(d.y0), X(d.x0) + 1.5, X(d.y1), "#E9E5DD", 3) + L(X(d.x0), X(d.y0), X(d.x1), X(d.y0), "#B8B1A4", 0.8) + L(X(d.x0), X(d.y1), X(d.x1), X(d.y1), "#B8B1A4", 0.8); continue; }
  let q;
  if (d.kind === "arc") { const [cx, cy] = M.ARC_C, pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; q = [pt(M.RA - 2, d.a0), pt(M.RA - 4.02, d.a0), pt(M.RA - 4.02, d.a1), pt(M.RA - 2, d.a1)]; }
  else if (d.kind === "arcO") { const [cx, cy] = M.ARC_C, pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; q = [pt(M.RA + 2, d.a0), pt(M.RA + 4.02, d.a0), pt(M.RA + 4.02, d.a1), pt(M.RA + 2, d.a1)]; }
  else { const nv = d.kind === "diagSW" ? [-Math.SQRT1_2, Math.SQRT1_2] : NE, c = (t) => [M.P1[0] + U[0] * t, M.P1[1] + U[1] * t], o = (t, k) => [c(t)[0] + nv[0] * k, c(t)[1] + nv[1] * k]; q = [o(d.t0, 2), o(d.t0, 4.02), o(d.t1, 4.02), o(d.t1, 2)]; }
  sRoad += `<path d="${polyD(q)}" fill="url(#p-concrete)"/><path d="M${X(q[0][0])},${X(q[0][1])} L${X(q[3][0])},${X(q[3][1])}" stroke="#E9E5DD" stroke-width="4"/><path d="M${X(q[0][0])},${X(q[0][1])} L${X(q[1][0])},${X(q[1][1])} M${X(q[2][0])},${X(q[2][1])} L${X(q[3][0])},${X(q[3][1])}" stroke="#B8B1A4" stroke-width="0.8"/>`;
}
let sLane = "";
// 住宅地の 路地: 側溝（ふたの すきま）・外側線・止まれ
const laneEnd = (yy) => { for (let x = 27; x < 62; x += 0.02) if (M.roadDist(AV, [x, yy]) <= AV.carriage / 2 + AV.side) return x; return 62; };
for (const y of [50, 57, 64]) {
  for (const [ey, sgn] of [[y, 1], [y + 2, -1]]) { const xe = laneEnd(ey + sgn * 0.12), gy = sgn > 0 ? ey : ey - 0.26;
    sRoad += Rn(X(27), X(gy), X(xe - 27), X(0.26), "#CFC9BD") + L(X(27), X(sgn > 0 ? ey + 0.26 : ey - 0.26), X(xe), X(sgn > 0 ? ey + 0.26 : ey - 0.26), "#A69F92", 0.9);
    for (let x = 28; x < xe - 0.8; x += 2.2) { sRoad += Rn(X(x), X(gy) + 1.2, X(0.6), X(0.26) - 2.4, "#6F6A62"); for (let k = 1; k < 6; k++) sRoad += L(X(x) + k * 3.2, X(gy) + 1.4, X(x) + k * 3.2, X(gy + 0.26) - 1.4, "#A7A197", 0.7); }
    sLane += L(X(27.5), X(ey + sgn * 0.42), X(xe - 0.25), X(ey + sgn * 0.42), "#F7F7F2", 2, { op: 0.85 }); }
  const xe = laneEnd(y + 1);
  sLane += Rn(X(27.35), X(y + 0.3), 7, X(1.4), "#F7F7F2") + `<g transform="translate(${X(28.75)},${X(y + 1)}) rotate(-90) scale(1,1.8)">${T(0, 5, "止まれ", { size: 13.5, fill: "#F7F7F2" })}</g>`;
  sLane += Rn(X(xe - 0.55), X(y + 0.3), 7, X(1.4), "#F7F7F2") + `<g transform="translate(${X(xe - 1.9)},${X(y + 1)}) rotate(90) scale(1,1.8)">${T(0, 5, "止まれ", { size: 13.5, fill: "#F7F7F2" })}</g>`;
}
// マンホール（車道）など 地面の かざりは あとで
// 路面表示
const WHITE = "#F7F7F2";
let sMark = sLane;
for (const c of CENTER) { const s0 = c.from - 26, s1 = c.to - 26; sMark += `<path d="${line(RS[c.road], 0, s0, s1)}" fill="none" stroke="#F2C14E" stroke-width="4" stroke-linejoin="round"/>`; }
// 外側線（大通り）
for (const sg of [1, -1]) for (const [a, b] of [[4, 11], [21, 99]]) sMark += `<path d="${line(RS.avenue, sg * 1.62, a, b)}" fill="none" stroke="${WHITE}" stroke-width="2.4" opacity="0.9"/>`;
for (const cw of CROSSWALKS) {
  const bar = 0.28, gap = 0.28;
  if (cw.bars === "v") { const span = cw.x1 - cw.x0, n = Math.floor((span + gap) / (bar + gap)), used = n * bar + (n - 1) * gap, x0 = cw.x0 + (span - used) / 2; for (let i = 0; i < n; i++) sMark += Rn(X(x0 + i * (bar + gap)), X(cw.y0), X(bar), X(cw.y1 - cw.y0), WHITE, { op: 0.95 }); }
  else { const span = cw.y1 - cw.y0, n = Math.floor((span + gap) / (bar + gap)), used = n * bar + (n - 1) * gap, y0 = cw.y0 + (span - used) / 2; for (let i = 0; i < n; i++) sMark += Rn(X(cw.x0), X(y0 + i * (bar + gap)), X(cw.x1 - cw.x0), X(bar), WHITE, { op: 0.95 }); }
  for (let i = 0; i < 10; i++) sMark += Rn(X(cw.x0 + hash(i, cw.x0 * 7) * (cw.x1 - cw.x0)), X(cw.y0 + hash(i, cw.y0 * 5) * (cw.y1 - cw.y0)), 3, 1.4, "#9AA0A6", { op: 0.55 });   // すりへり
}
const arrowShape = (turn) => { let s = ""; const sh = `stroke="${WHITE}" stroke-width="5" fill="none" stroke-linecap="butt"`;
  if (turn !== "lr") s += `<path d="M0,34 V-14" ${sh}/><path d="M-9,-12 L0,-34 L9,-12 Z" fill="${WHITE}"/>`;
  for (const sg of turn === "lr" ? [-1, 1] : turn === "l" ? [-1] : turn === "r" ? [1] : []) s += `<path d="M0,${turn === "lr" ? 34 : 18} V0 Q0,-8 ${sg * 10},-8 H${sg * 14}" ${sh}/><path d="M${sg * 12},-16 L${sg * 26},-8 L${sg * 12},0 Z" fill="${WHITE}"/>` + (turn === "lr" && sg === 1 ? `<path d="M0,34 V0" ${sh}/>` : "");
  return s; };
const ROT = { n: 0, e: 90, s: 180, w: -90 };
for (const m of MARKS) {
  if (m.k === "stop") sMark += Rn(X(m.x0), X(m.y) - 3.5, X(m.x1 - m.x0), 7, WHITE);
  if (m.k === "stopv") sMark += Rn(X(m.x) - 3.5, X(m.y0), 7, X(m.y1 - m.y0), WHITE);
  if (m.k === "arrow") sMark += `<g transform="translate(${X(m.x)},${X(m.y)}) rotate(${ROT[m.dir]}) scale(0.9,1.25)" opacity="0.95">${arrowShape(m.turn)}</g>`;
  if (m.k === "ringArrow") sMark += `<g transform="translate(${X(m.x)},${X(m.y)}) rotate(${ROT[m.dir]}) scale(0.8)" opacity="0.9"><path d="M0,24 V-8" stroke="${WHITE}" stroke-width="5"/><path d="M-9,-6 L0,-26 L9,-6 Z" fill="${WHITE}"/></g>`;
  if (m.k === "diamond") sMark += `<path d="M${X(m.x)},${X(m.y - 0.8)} L${X(m.x + 0.3)},${X(m.y)} L${X(m.x)},${X(m.y + 0.8)} L${X(m.x - 0.3)},${X(m.y)} Z" fill="none" stroke="${WHITE}" stroke-width="3"/>`;
  if (m.k === "text") sMark += `<g transform="translate(${X(m.x)},${X(m.y)}) rotate(${m.rot || 0}) scale(1,2)">${T(0, 0, m.t, { size: (m.size || 0.55) * P, fill: WHITE, weight: 800 })}</g>`;
  if (m.k === "bay") { const c = m.c || WHITE; sMark += `<rect x="${X(m.x0)}" y="${X(m.y0)}" width="${X(m.x1 - m.x0)}" height="${X(m.y1 - m.y0)}" fill="none" stroke="${c}" stroke-width="2.2" stroke-dasharray="8 5" opacity="0.9"/>` + (m.label ? T(X(m.x1) - 18, X(m.y1) - 3, m.label, { size: 7, fill: c, weight: 800 }) : ""); }
}
// 駐車場の 白線・身障者用の 区画
for (let k = 0; k <= 7; k++) sMark += Rn(X(47.5 + k * 2) - 1.2, X(36.25), 2.4, X(2.6), WHITE, { op: 0.9 });
sMark += Rn(X(55.6), X(36.4), X(1.8), X(2.4), "#3F7CC4", { op: 0.75 }) + C(X(56.5), X(37.2), 3, "none", { sw: 1.6, stroke: WHITE }) + C(X(56.5), X(37.9) , 5.5, "none", { sw: 1.6, stroke: WHITE });
for (let k = 0; k <= 3; k++) sMark += Rn(X(56.5 + k * 2) - 1.2, X(56.2), 2.4, X(2.6), WHITE, { op: 0.9 });

// ---------- アセット（建物・小物）を 奥から 手前へ ----------
const selfFlip = new Set(["shrine.komainu", "nat.pine", "prop.signal"]);
function foot(it) { const a = REG[it.asset]; if (!a) return { w: 1, h: 1 }; const o = it.opts || {}; let w = a.w, h = a.h;
  if (o.len) { if (o.dir === "v") { w = 1; h = o.len; } else { w = o.len; h = 1; } }
  if (["veh.car", "veh.taxi", "veh.kei"].includes(it.asset) && (o.dir === "e" || o.dir === "w")) { w = 2; h = 1; }
  return { w, h }; }
const items = [...M.B.map((b) => ({ ...b, kind: "b" })), ...M.P.filter((p) => !p.over).map((p) => ({ ...p, kind: "p" }))];
const missing = new Set(); for (const it of [...items, ...M.DECAL, ...M.OVER]) if (!REG[it.asset]) missing.add(it.asset);
if (missing.size) console.log("MISSING assets:", [...missing]);
items.forEach((it) => { const fp = foot(it); it.w = fp.w; it.h = fp.h; it.key = it.y + fp.h + (it.z || 0) * 0.01; });
items.sort((a, b) => a.key - b.key || a.x - b.x);
const drawItem = (it) => { const a = REG[it.asset]; if (!a) return ""; let s = a.draw({ ...(it.opts || {}) }); if (it.opts && it.opts.flip && !selfFlip.has(it.asset)) s = `<g transform="matrix(-1,0,0,1,${it.w * P},0)">${s}</g>`; return `<g transform="translate(${X(it.x)},${X(it.y)})">${s}</g>`; };
let sDecal = M.DECAL.map((d) => drawItem({ ...d, w: 1, h: 1 })).join("");
// 信号: 反転の オプション（腕を 左へ）
REG["prop.signal"] = { ...REG["prop.signal"], draw: ((orig) => (o = {}) => (o.flip ? `<g transform="matrix(-1,0,0,1,32,0)">${orig(o)}</g>` : orig(o)))(REG["prop.signal"].draw) };
// 3人（横断歩道を わたっている）・町の人・通行人（ゲームの どうぶつ）
const heroes = [["wanko", 41.7, 29.25, "right"], ["gachan", 42.95, 29.25, "right"], ["goji", 44.2, 29.25, "right"]];
const people = [...heroes.map(([id, x, y, dir]) => ({ key: y, svg: heroSvg(id, X(x), X(y), { dir }) })),
  ...[...M.NPC, ...(M.WALKERS || [])].map((n) => ({ key: n.y + 0.85, svg: npcSvg({ sp: n.sp, col: n.col, outfit: n.outfit, dir: n.dir || "down" }, X(n.x + 0.5), X(n.y + 0.85)) }))];
const all = [...items.map((it) => ({ key: it.key, it })), ...people].sort((a, b) => a.key - b.key || (a.it ? a.it.x : 0) - (b.it ? b.it.x : 0));
let sItems = all.map((o) => (o.it ? drawItem(o.it) : o.svg)).join("");
// 上の層: ホームの屋根・旗かざり・電線・架線
let sOver = M.P.filter((p) => p.over).map((p) => drawItem({ ...p, w: 1, h: 1 })).join("");
for (const o of M.OVER) sOver += `<g transform="translate(${X(o.x)},${X(o.y - o.h)})">${REG[o.asset].draw(o.opts || {})}</g>`;
const wire = (a, b, dy) => { const ax = X(a[0]) + 16, ay = X(a[1]) - 60 + dy, bx = X(b[0]) + 16, by = X(b[1]) - 60 + dy, mx = (ax + bx) / 2, my = (ay + by) / 2 + Math.hypot(bx - ax, by - ay) * 0.04; return `<path d="M${f(ax)},${f(ay)} Q${f(mx)},${f(my + 6)} ${f(bx)},${f(by)}" stroke="#34322F" stroke-width="0.9" fill="none" opacity="0.75"/>`; };
for (const ch of M.WIRES) for (let i = 0; i + 1 < ch.length; i++) for (const dy of [0, 5]) sOver += wire(ch[i], ch[i + 1], dy);
for (const dy of [7, 12]) { let d = `M0,${dy}`; for (let x = 3; x < W + 8; x += 8) d += ` Q${X(x - 4) + 16},${dy + 5} ${X(x) + 16},${dy}`; sOver += `<path d="${d}" stroke="#34322F" stroke-width="0.8" fill="none" opacity="0.7"/>`; }

// ---------- ラベル（全体図だけ） ----------
let sLabel = "";
for (const lb of M.LABELS) { const size = lb.small ? 10 : 12.5; sLabel += `<g transform="translate(${X(lb.x)},${X(lb.y)}) rotate(${lb.rot || 0})">${T(0, 0, lb.text, { size, fill: "#FFFFFF", stroke: "#3C352E", sw: 3.4, weight: 800 })}</g>`; }
for (const n of M.NPC) sLabel += T(X(n.x + 0.5), X(n.y - 0.95), n.name, { size: 8.5, fill: "#3C352E", stroke: "#FFFFFF", sw: 2.8, weight: 800 });
for (const w of M.WARPS) sLabel += `<rect x="${X(w.x)}" y="${X(w.y)}" width="${X(w.w)}" height="${X(w.h)}" fill="#F2C14E" opacity="0.35" stroke="#C98A12" stroke-width="2" stroke-dasharray="6 4"/>`;
for (const b of M.B) if (b.door) for (const dx of b.door) sLabel += `<path d="M${X(dx + 0.5)},${X(b.y + REG[b.asset].h) + 2} l-5,7 h10 Z" fill="#E53935" stroke="#FFFFFF" stroke-width="1.2"/>`;

// ---------- まとめて SVG に ----------
const extraDefs = `<pattern id="p-tactile-line-h" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#EFC03A"/><path d="M2,4 H14 M2,8 H14 M2,12 H14" stroke="#D9A61E" stroke-width="1.6" stroke-linecap="round"/></pattern>`;
const svgOpen = (w, h, vb) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${defs().replace("</defs>", extraDefs + "</defs>")}`;
const body = sGround + sEdge + sRail + sRoad + sTact + sMark + sDecal + sItems + sOver;
const clean = svgOpen(MW, MH, `0 0 ${MW} ${MH}`) + body + "</svg>";
const HEAD = 64;
const plan = svgOpen(MW, MH + HEAD, `0 ${-HEAD} ${MW} ${MH + HEAD}`) + Rn(0, -HEAD, MW, HEAD, "#FBF8F1") + T(18, -30, "平和台（へいわだい） デザイン案 v0.2 ・ 64×68 マス（1マス 32px ≒ 1.5m）", { size: 22, fill: "#3C352E", anchor: "start" }) + T(18, -9, "大通りは 南から まっすぐ北へ → ロータリー（時計回り）の 南がわへ 直角に入る ／ さつき通りとは 信号つき T字路 ／ ▲=入口 ／ 黄色の点線=出口", { size: 13, fill: "#6B6153", anchor: "start", weight: 700 }) + body + sLabel + "</svg>";
writeFileSync(TMP + "clean.svg", clean);

// ---------- Codex 用の 仕様（歩ける マス・ASCII） ----------
const cover = Array.from({ length: H }, () => Array(W).fill(null));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = [x + 0.5, y + 0.5];
  for (const r of ROADS) { const d = M.roadDist(r, p); if (d <= r.carriage / 2) cover[y][x] = "="; else if (d <= r.carriage / 2 + r.side && cover[y][x] !== "=") cover[y][x] = cover[y][x] || "s"; }
  const sd = M.ringSd(p); if (Math.abs(sd) <= hw) cover[y][x] = "="; else if (sd < -hw) cover[y][x] = "i"; }
for (const cw of CROSSWALKS) for (let y = Math.floor(cw.y0); y < Math.ceil(cw.y1); y++) for (let x = Math.floor(cw.x0); x < Math.ceil(cw.x1); x++) if (cover[y] && cover[y][x] === "=") cover[y][x] = "z";
const solid = Array.from({ length: H }, () => Array(W).fill(false));
const mark = (x0, y0, w, h) => { for (let y = Math.floor(y0); y < Math.ceil(y0 + h - 1e-6); y++) for (let x = Math.floor(x0); x < Math.ceil(x0 + w - 1e-6); x++) if (y >= 0 && x >= 0 && y < H && x < W) solid[y][x] = true; };
for (const it of items) { const a = REG[it.asset]; if (!a || a.pass || it.moving) continue;
  if (it.asset === "nat.tree.big" || it.asset === "nat.tree.sakura") mark(Math.floor(it.x + it.w / 2), Math.floor(it.y + it.h - 0.5), 1, 1); else mark(it.x, it.y, it.w, it.h); }
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ("XBM".includes(G[y][x]) && !cover[y][x]) solid[y][x] = true;
// 島（ロータリーの中）は 入らない。車道は 歩ける（ゲームでは 横断歩道を 使うように 案内）
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cover[y][x] === "i") solid[y][x] = true;
const bchar = {}; M.B.forEach((b) => { for (let y = b.y; y < b.y + REG[b.asset].h; y++) for (let x = b.x; x < b.x + REG[b.asset].w; x++) bchar[x + "," + y] = "#"; if (b.door) for (const dx of b.door) bchar[dx + "," + (b.y + REG[b.asset].h - 1)] = "D"; });
const GA = { R: "n", g: ".", l: ",", G: "p", V: "w", Z: "a", C: "c", P: "q", S: "j", K: "k", D: "d", O: "e", B: "r", M: "m", X: "X" };
const ascii = G.map((row, y) => row.map((c, x) => bchar[x + "," + y] || (cover[y][x] === "=" ? "=" : cover[y][x] === "z" ? "z" : cover[y][x] === "i" ? "o" : solid[y][x] ? (c === "X" ? "X" : "t") : cover[y][x] === "s" ? "s" : GA[c] || "?")).join(""));
// 入口・出口に 歩いて 行けるか
const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !solid[y][x] && !bchar[x + "," + y];
const start = [27, 19], seen = new Set([start.join(",")]), stack = [start];
while (stack.length) { const [x, y] = stack.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + "," + (y + dy); if (!seen.has(k) && ok(x + dx, y + dy)) { seen.add(k); stack.push([x + dx, y + dy]); } } }
const targets = [...M.B.filter((b) => b.door).flatMap((b) => b.door.map((dx) => ({ name: REG[b.asset].name, x: dx, y: b.y + REG[b.asset].h }))), ...M.WARPS.map((w) => ({ name: "出口:" + w.to, x: w.x + Math.floor(w.w / 2), y: w.y }))];
const miss = targets.filter((t) => !seen.has(t.x + "," + t.y));
// 何もない場所（半径2マスに 建物・小物が ない 歩けるマス）の 割合・小物の 密度
const occ = new Set(); for (const it of items) { if (it.asset === "bg.roofs" || it.asset === "nat.tuft") continue; for (let y = Math.floor(it.y); y < Math.ceil(it.y + it.h - 1e-6); y++) for (let x = Math.floor(it.x); x < Math.ceil(it.x + it.w - 1e-6); x++) occ.add(x + "," + y); }
let walk = 0, empty = 0; const inside = (x, y) => x >= 2 && y >= 2 && x < W - 2 && y < H - 2;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && ok(x, y) && cover[y][x] !== "=" && cover[y][x] !== "z") { walk++; let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (occ.has(x + dx + "," + (y + dy))) { near = true; break; } if (!near) empty++; }
const propsOnly = items.filter((it) => it.kind === "p" && !it.asset.startsWith("nat.") && !["bg.roofs", "prop.wall"].includes(it.asset));
const kinds = new Set(items.filter((it) => it.kind === "p" && it.asset !== "bg.roofs").map((it) => it.asset));
const bModels = {}; for (const b of M.B) bModels[b.asset] = (bModels[b.asset] || 0) + 1;
const metrics = { size: `${W}x${H}`, buildings: M.B.length, buildingKinds: Object.keys(bModels).length, maxModelShare: Math.round((Math.max(...Object.values(bModels)) / M.B.length) * 100), props: propsOnly.length, propKinds: kinds.size, walkTiles: walk, propsPer100: +((propsOnly.length / walk) * 100).toFixed(1), emptyPct: Math.round((empty / walk) * 100), reachable: seen.size, unreachable: miss };
console.log(JSON.stringify(metrics));
const LEGEND = { "#": "建物（通れない）", D: "建物の 入口（下の はし）", "=": "車道（歩ける。ゲームでは 横断歩道へ 案内）", z: "横断歩道", s: "歩道", o: "ロータリーの 島（入らない）", t: "木・小物・へい（通れない）", X: "へり（通れない）",
  ".": "芝", ",": "手入れした芝・庭", p: "広場の 御影石", w: "敷石の 歩道・広場", a: "商店街の 床", c: "コンクリート（前庭・歩く道）", n: "路地（アスファルト・側溝つき）", q: "駐車場", j: "玉砂利（神社）", k: "参道の 石だたみ", d: "土（公園の 道・遊び場）", e: "空き地", r: "線路", m: "ホーム" };
writeFileSync(OUT + "heiwadai-v02.txt", `平和台 デザイン案 v0.2（${W}×${H}）\n\n` + ascii.map((r, y) => String(y).padStart(2, " ") + " " + r).join("\n") + "\n\n凡例:\n" + Object.entries(LEGEND).map(([k, v]) => `  ${k}  ${v}`).join("\n") + "\n");
writeFileSync(OUT + "heiwadai-v02.json", JSON.stringify({ version: "0.2", W, H, tile: P, ascii, ground: G.map((r) => r.join("")), roads: ROADS.map((r) => ({ id: r.id, name: r.name, carriage: r.carriage, side: r.side, pieces: r.pieces })), ring: RING, fillets: FILLETS, crosswalks: CROSSWALKS, marks: MARKS, buildings: M.B, props: M.P, overhead: M.OVER, decals: M.DECAL, wires: M.WIRES, driveways: M.DRIVE, npcs: M.NPC, warps: M.WARPS, labels: M.LABELS, metrics }, null, 1));

// ---------- PNG に ----------
const browser = await launch();
async function shot(svg, w, h, out, scale = 1, clip) { const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale }); await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FBF8F1">${svg}</body>`); await page.waitForTimeout(600); await page.screenshot({ path: out, clip: clip || { x: 0, y: 0, width: w, height: h } }); await page.close(); }
await shot(plan, MW, MH + HEAD, IMG + "plan.png", 1);
await shot(clean, MW, MH, TMP + "clean.png", 1);
// スマホ 1画面（ゲームと同じ 360×779 論理px。2倍で 書き出し）
const VIEWS = [["station", 43.2, 27.4, 779], ["junction", 43, 45, 779], ["shotengai", 20.5, 34, 779], ["residential", 28.2, 55.5, 779], ["plaza", 27.5, 20.2, 667 * 360 / 375]];
for (const [name, cx, cy, vh] of VIEWS) { const vw = 360, x0 = Math.round(cx * P - vw / 2), y0 = Math.round(cy * P - vh / 2); const vsvg = svgOpen(vw, vh, `${x0} ${y0} ${vw} ${vh}`) + body + "</svg>"; await shot(vsvg, vw, Math.round(vh), TMP + `phone_${name}.png`, 2); }
await browser.close();
console.log("done");
