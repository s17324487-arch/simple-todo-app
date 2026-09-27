// アセットの 見本シート（ゲームの 大きさの 1.25倍）。 img/asset_sheet_1〜4.png に 分けて 書き出す。
// 一部だけ 見たいとき: node tools/town-design/sheet.mjs /tmp/out.png id1,id2,...
import { writeFileSync } from "node:fs";
import { OUT, IMG, TMP, launch } from "./paths.mjs";
import { P, defs, esc } from "./lib.mjs";
import { REG } from "./assets_more.mjs";
const out = process.argv[2] || null;
const only = process.argv[3] ? new Set(process.argv[3].split(",")) : null;
const cats = ["建物", "神社", "公園", "小物", "自然", "乗り物", "線路", "背景", "地面"];
// 変化（バリエーション）を 1つの枠に 並べて見せる
const at = (x, y, svg) => `<g transform="translate(${x * P},${y * P})">${svg}</g>`;
const DEMOS = {
  "prop.wall": { w: 9, h: 3, draw: () => at(0, 0, REG["prop.wall"].draw({ len: 3, kind: "block" })) + at(0, 1.6, REG["prop.wall"].draw({ len: 3, kind: "fence" })) + at(4, 0, REG["prop.wall"].draw({ len: 3, kind: "wood" })) + at(4, 1.6, REG["prop.wall"].draw({ len: 3, kind: "stone" })) + at(8, 0.4, REG["prop.wall"].draw({ len: 2, dir: "v", kind: "block" })) },
  "nat.hedge": { w: 5, h: 2, draw: () => at(0, 1, REG["nat.hedge"].draw({ len: 3 })) + at(3.6, 0.3, REG["nat.hedge"].draw({ len: 2, dir: "v" })) },
  "veh.car": { w: 7, h: 2, draw: () => at(0, 0, REG["veh.car"].draw({ c: "#F1F3F4" })) + at(1, 0, REG["veh.car"].draw({ c: "#D8433C", dir: "s" })) + at(2, 0, REG["veh.car"].draw({ c: "#3A3F44" })) + at(3, 0, REG["veh.car"].draw({ c: "#8FC5E8", dir: "e" })) + at(5, 1, REG["veh.car"].draw({ c: "#C9CED3", dir: "w" })) + at(3, 1, REG["veh.car"].draw({ c: "#6FAE7E", dir: "e" })) },
  "veh.taxi": { w: 3, h: 2, draw: () => at(0, 0, REG["veh.taxi"].draw({})) + at(1, 0.5, REG["veh.taxi"].draw({ dir: "e" })) },
  "prop.nobori": { w: 4, h: 1, draw: () => ["セール", "やきたて", "だんご", "おすすめ"].map((t, i) => at(i, 0, REG["prop.nobori"].draw({ t, c: ["#E53935", "#F28C28", "#43A047", "#1E88E5"][i] }))).join("") },
  "prop.stall": { w: 7, h: 2, draw: () => at(0, 0, REG["prop.stall"].draw({ label: "たこやき", c: "#E53935" })) + at(2.4, 0, REG["prop.stall"].draw({ label: "たいやき", c: "#1E88E5" })) + at(4.8, 0, REG["prop.stall"].draw({ label: "だんご", c: "#43A047" })) },
  "park.spring": { w: 3, h: 1, draw: () => ["zou", "panda", "uma"].map((kind, i) => at(i, 0, REG["park.spring"].draw({ kind }))).join("") },
  "nat.tuft": { w: 4, h: 1, draw: () => ["grass", "clover", "dandelion", "stone"].map((kind, i) => at(i, 0, REG["nat.tuft"].draw({ kind, seed: i + 2 }))).join("") },
  "prop.manhole": { w: 2, h: 1, draw: () => at(0, 0, REG["prop.manhole"].draw({})) + at(1, 0, REG["prop.manhole"].draw({ plain: true })) },
  "bg.roofs": { w: 12, h: 2, draw: () => [1, 2, 3].map((seed, i) => at(i * 4, 0, REG["bg.roofs"].draw({ seed }))).join("") },
  "nat.pine": { w: 2, h: 1, draw: () => at(0, 0, REG["nat.pine"].draw({})) + at(1, 0, REG["nat.pine"].draw({ flip: true })) },
  "prop.bunting": { w: 8, h: 1, draw: () => at(0, 0.3, REG["prop.bunting"].draw({})) },
};
const MAXW = 1500, GAP = 22;
let x = 20, y = 20, rowH = 0, body = "";
const rowTops = [0];
const items = cats.flatMap((c) => Object.values(REG).filter((a) => a.cat === c && (!only || only.has(a.id))));
let lastCat = "";
for (const a of items) {
  const d = DEMOS[a.id], aw = d ? d.w : a.w, ah = d ? d.h : a.h;
  const w = aw * P, h = ah * P, top = 104, bottom = 34, cellW = Math.max(w + 48, 150), cellH = h + top + bottom;
  if (a.cat !== lastCat) { if (x > 20) { x = 20; y += rowH + GAP; rowH = 0; } rowTops.push(y - 4); body += `<text x="20" y="${y + 14}" font-size="18" font-weight="800" fill="#3C352E" font-family="'Noto Sans CJK JP',sans-serif">${esc(a.cat)}</text>`; y += 26; lastCat = a.cat; }
  if (x + cellW > MAXW) { x = 20; y += rowH + GAP; rowH = 0; rowTops.push(y - 4); }
  const ox = x + (cellW - w) / 2, oy = y + top;
  body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="8" fill="#FFFFFF" stroke="#E2DACB"/>`;
  body += `<rect x="${ox}" y="${oy}" width="${w}" height="${h}" fill="url(#p-grass)" opacity="0.55"/>` + (d ? "" : `<rect x="${ox}" y="${oy}" width="${w}" height="${h}" fill="none" stroke="#C0392B" stroke-dasharray="3 3" stroke-width="1"/>`);
  body += `<g transform="translate(${ox},${oy})">${d ? d.draw() : a.draw({})}</g>`;
  body += `<text x="${x + cellW / 2}" y="${y + cellH - 18}" font-size="11" font-weight="700" text-anchor="middle" fill="#3C352E" font-family="'Noto Sans CJK JP',sans-serif">${esc(a.name)}</text><text x="${x + cellW / 2}" y="${y + cellH - 5}" font-size="9" text-anchor="middle" fill="#8A7F70" font-family="monospace">${esc(a.id)}  ${a.w}×${a.h}${a.pass ? "  通れる" : ""}</text>`;
  x += cellW + GAP; rowH = Math.max(rowH, cellH);
}
const H = y + rowH + 30;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAXW + 20}" height="${H}" viewBox="0 0 ${MAXW + 20} ${H}">${defs()}<rect width="100%" height="100%" fill="#FBF8F1"/>${body}</svg>`;
writeFileSync(TMP + "asset_sheet.svg", svg);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: MAXW + 20, height: Math.min(H, 16000) }, deviceScaleFactor: +(process.env.SCALE || 1.5) });
await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0">${svg}</body>`);
await page.waitForTimeout(400);
if (out) await page.locator("svg").screenshot({ path: out });
else { // 行の さかい目で 4つに 分ける（1枚が 長すぎると 見にくい）
  const parts = 4, cuts = [0]; for (let k = 1; k < parts; k++) { const want = (H * k) / parts; cuts.push(rowTops.reduce((b, t) => (Math.abs(t - want) < Math.abs(b - want) ? t : b), rowTops[0])); } cuts.push(H);
  for (let i = 0; i < parts; i++) await page.screenshot({ path: IMG + `asset_sheet_${i + 1}.png`, clip: { x: 0, y: cuts[i], width: MAXW + 20, height: cuts[i + 1] - cuts[i] } }); }
// 各アセットの 描く範囲（足もとの 左上が 0,0。上や 右に はみ出す 量を ゲームの viewBox に 使う）
if (!out) { const groups = Object.values(REG).map((a) => `<g id="bb-${a.id.replace(/\./g, "_")}">${a.draw({})}</g>`).join("");
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">${defs()}${groups}</svg></body>`);
  const bb = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => { const b = document.getElementById("bb-" + id.replace(/\./g, "_")).getBBox(); return [id, [Math.floor(b.x), Math.floor(b.y), Math.ceil(b.x + b.width), Math.ceil(b.y + b.height)]]; })), Object.keys(REG));
  writeFileSync(OUT + "asset-bbox.json", JSON.stringify(bb, null, 0).replace(/\],"/g, '],\n"')); }
await browser.close();
console.log("sheet:", items.length, "assets", out || "img/asset_sheet_1-4.png");
