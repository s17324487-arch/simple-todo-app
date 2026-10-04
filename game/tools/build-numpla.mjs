// ナンプレの 問題の たば（js/numpla-data.js）を つくる（UI-81）。
// 使い方: node tools/build-numpla.mjs [--per 40] [--seed 20261004]（--check: つくりなおして いまの js/numpla-data.js と おなじか だけ みる。npm run check）
//  1. すきまの ない 盤: ななめの 3つの ブロックに でたらめの 数字 → のこりを とく（js/numpla-rules.js の count）
//  2. 点対称に 2マスずつ ぬく。解が 1つで なくなったら もどす（初級・中級は めあての かずで とめる）
//  3. 人の 解き方で とけるか・いちばん むずかしい 解き方は なにか（grade）で むずかしさに わける（NumplaRules.LEVELS・fits）
// おなじ seed なら おなじ たばが できる。ゲームは 1もんずつ 数字・行・列を いれかえて だす（NumplaRules.transform）
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "js", "numpla-data.js");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const PER = arg("per", 40), SEED = arg("seed", 20261004);

const ctx = {}; vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, "js", "numpla-rules.js"), "utf8") + "\n;this.NumplaRules = NumplaRules;", ctx);
const R = ctx.NumplaRules;

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function fullGrid() {
  const g = new Array(81).fill(0);
  for (let b = 0; b < 3; b++) { const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]); for (let j = 0; j < 9; j++) g[(b * 3 + ((j / 3) | 0)) * 9 + b * 3 + (j % 3)] = ds[j]; }
  return R.count(g, 1).sol;
}
function dig(sol, target) {
  const g = sol.slice();
  let n = 81;
  for (const i of shuffle([...Array(41).keys()])) {
    if (n <= target) break;
    const j = 80 - i, a = g[i], b = g[j];
    g[i] = 0; g[j] = 0;
    if (R.count(g, 2).n !== 1) { g[i] = a; g[j] = b; } else n -= i === j ? 1 : 2;
  }
  return R.format(g);
}

const bank = {}, seen = new Set(), stat = {};
const t0 = Date.now();
for (const L of R.LEVELS) {
  bank[L.id] = []; stat[L.id] = { tries: 0, tech: {} };
  const exact = L.id === "easy" || L.id === "normal";
  while (bank[L.id].length < PER) {
    if (++stat[L.id].tries > 200000) throw Error(L.id + ": たりない（" + bank[L.id].length + "）");
    const target = exact ? L.givens[0] + Math.floor(rnd() * (L.givens[1] - L.givens[0] + 1)) : 0;
    const p = dig(fullGrid(), target);
    if (seen.has(p) || !R.fits(p, L.id)) continue;
    seen.add(p); bank[L.id].push(p);
    const m = R.grade(R.parse(p)).max; stat[L.id].tech[m] = (stat[L.id].tech[m] || 0) + 1;
  }
}
const lines = R.LEVELS.map((L) => `  // ${L.name}（${L.id}）: はじめの 数字 ${L.givens[0]}〜${L.givens[1]}・${L.note}\n  ${L.id}: [\n${bank[L.id].map((p) => `    "${p}",`).join("\n")}\n  ],`);
const out = `// 自動生成（node tools/build-numpla.mjs --per ${PER} --seed ${SEED}）。手で なおさない。
// ナンプレの 問題の たば（パズル こうぼう・UI-81）。1もん = 81もじ（"." が あき・行ごとに 9もじ）。
// どれも 解は 1つだけ・点対称・その むずかしさの 解き方で とける（NumplaRules.fits。tools/check-numpla.mjs が たしかめる）。
// ゲームでは 数字・行・列を いれかえて だす（NumplaRules.transform）ので、おなじ もんだいに みえない。
const NUMPLA_BANK = {
${lines.join("\n")}
};
`;
if (process.argv.includes("--check")) {
  if (!existsSync(OUT) || readFileSync(OUT, "utf8") !== out) { console.error("✗ js/numpla-data.js が tools/build-numpla.mjs の けっかと ちがう（node tools/build-numpla.mjs で つくりなおす）"); process.exit(1); }
  console.log(`✓ numpla-data: tools/build-numpla.mjs と おなじ（${R.LEVELS.map((L) => `${L.id} ${bank[L.id].length}`).join("・")}）`);
  process.exit(0);
}
writeFileSync(OUT, out);
console.log(`js/numpla-data.js: ${R.LEVELS.map((L) => `${L.id} ${bank[L.id].length}（${stat[L.id].tries} こ ためした・解き方 ${JSON.stringify(stat[L.id].tech)}）`).join(" / ")}・${Date.now() - t0}ms`);
