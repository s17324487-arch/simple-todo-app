// 道の模様と検証用データだけを移す。建物・小物のSVGの移植は TOWN-02/03。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { defs } from "./town-design/lib.mjs";
import { ROADS, CENTER } from "./town-design/heiwadai-v02.mjs";
const root = new URL("../", import.meta.url);
const source = JSON.parse(readFileSync(new URL("docs/design/towns/heiwadai/heiwadai-v02.json", root), "utf8"));
const patterns = {};
for (const m of defs().matchAll(/<pattern id="([^"]+)"[^>]*width="([^"]+)" height="([^"]+)">([\s\S]*?)<\/pattern>/g)) {
  if (!["p-paver", "p-asphalt", "p-lawn", "p-concrete"].includes(m[1])) continue;
  patterns[m[1]] = { w: +m[2], h: +m[3], svg: m[4] };
}
const fixture = Object.fromEntries(["roads", "ring", "fillets", "crosswalks", "marks", "driveways"].map(k => [k, source[k]]));
for (const r of fixture.roads) {
  const original = ROADS.find(o => o.id === r.id);
  if (original.extendStart) r.extendStart = original.extendStart;
  r.center = CENTER.filter(c => c.road === r.id).map(c => ({ from: c.from - 26, to: c.to - 26 }));
  if (r.id === "avenue") r.edges = [{ from: 4, to: 11 }, { from: 21, to: 99 }];
}
const header = "// 自動生成: node tools/build-road-fixture.mjs。見本の色・SVGを変更しない。\n";
const outputs = [
  ["js/road-patterns.js", header + "const ROAD_PATTERNS = " + JSON.stringify(patterns, null, 2) + ";\n"],
  ["tests/fixtures/roads-v02.js", header + "const ROAD_FIXTURE = " + JSON.stringify({ name: "どうろの けんしょう", bgm: "town", rows: Array(source.H).fill(".".repeat(source.W)), ...fixture }, null, 2) + ";\n"],
];
for (const [path, value] of outputs) {
  const url = new URL(path, root);
  if (process.argv.includes("--check")) {
    if (readFileSync(url, "utf8").replace(/\r\n/g, "\n") !== value) throw new Error(path + " を再生成してください");
  } else { mkdirSync(new URL(".", url), { recursive: true }); writeFileSync(url, value); }
}
console.log("road patterns / v0.2 fixture: OK");
