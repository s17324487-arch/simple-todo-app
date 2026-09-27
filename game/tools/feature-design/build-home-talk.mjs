// ① おうちの 会話: 元データ（home-lines.mjs）を 検査して、JSON・ゲームに そのまま 入れられる JS・一覧（Markdown）に する。
import { writeFileSync, mkdirSync } from "node:fs";
import { CONTEXT, PERSONA, PARENTS, RARE, TALKS, VOICE } from "./home-lines.mjs";
export const OUT = new URL("../../docs/design/features/home-talk/", import.meta.url).pathname;
mkdirSync(OUT + "img", { recursive: true });

const KEYS = { t: "time", w: "weather", s: "season", f: "festival", r: "room", n: "near", st: "state", e: "event", k: "kind" };
const VALUES = {
  time: ["morning", "day", "evening", "night", "late"], weather: ["clear", "cloudy", "rain", "snow", "wind"], season: ["spring", "summer", "autumn", "winter"],
  festival: ["newyear", "setsubun", "hina", "picnic", "children", "hydrangea", "tanabata", "fireworks", "moon", "halloween", "harvest", "christmas"],
  room: ["main", "study", "garden"], state: ["hungry", "full", "deza", "happy", "sad"], event: ["return", "win", "work", "dress", "edit", "watch"],
  kind: ["say", "shout", "cry", "think", "whisper"],
  near: ["bed", "sofa", "tv", "piano", "bookshelf", "toybox", "kotatsu", "fishbowl", "aquarium", "fireplace", "kitchen", "desk", "tent", "window", "clock", "plant", "teddy", "trophy", "rockinghorse", "train", "musicbox", "snow_globe", "painting", "poster", "teacart", "vanity", "sakura_lamp", "star_lantern", "cloudsofa", "acorn_cart"],
};
const errors = [], seen = new Map();
function parseWhen(s, where) {
  const when = {}; let kind = "say", tag = null;
  for (const tok of (s || "").split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^([a-z]+):(.+)$/);
    if (!m) { tag = tok; continue; }                       // PERSONA の しるし（justice など）
    const key = KEYS[m[1]]; if (!key) { errors.push(`${where}: 知らない 条件 ${tok}`); continue; }
    if (!VALUES[key].includes(m[2])) errors.push(`${where}: ${key} に ない 値 ${m[2]}`);
    if (key === "kind") kind = m[2]; else (when[key] = when[key] || []).push(m[2]);
  }
  return { when, kind, tag };
}
// 1行の 長さ: 全角=1、半角=0.5。吹き出しは 1行 約14字 × 3行まで
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
function check(text, where) {
  if (seen.has(text)) errors.push(`${where}: 同じ 文が ${seen.get(text)} にも ある「${text}」`); else seen.set(text, where);
  if (width(text) > 26) errors.push(`${where}: 長すぎる（${width(text)}）「${text}」`);
  if (/[a-zA-Z]{3,}/.test(text)) errors.push(`${where}: 英字が ある「${text}」`);
  if (/[぀-ゟ]{12,}/.test(text.replace(/[、。！？…♪〜]/g, " "))) errors.push(`${where}: ひらがなが 長く つづく（文節で あける）「${text}」`);
}
const lines = [];
let n = 0;
const push = (who, group, text, whenStr) => { const id = `${who.slice(0, 2)}${String(++n).padStart(4, "0")}`; check(text, `${who}/${group}`); const p = parseWhen(whenStr, `${who}/${group}「${text}」`); lines.push({ id, who, group, text, kind: p.kind, when: p.when, ...(p.tag ? { tag: p.tag } : {}) }); };
for (const [who, arr] of Object.entries(CONTEXT)) for (const [t, w] of arr) push(who, "context", t, w);
for (const [who, arr] of Object.entries(PERSONA)) for (const [t, w] of arr) push(who, "persona", t, w);
for (const [who, arr] of Object.entries(PARENTS)) for (const [t, w] of arr) push(who, "parent", t, w);
for (const [who, arr] of Object.entries(RARE)) for (const t of arr) { check(t, `${who}/rare`); lines.push({ id: `${who.slice(0, 2)}${String(++n).padStart(4, "0")}`, who, group: "rare", text: t, kind: "say", when: {}, rare: true }); }
const talks = TALKS.map((tk) => { const p = parseWhen(tk.when, `talk ${tk.id}`); tk.turns.forEach(([who, t], i) => check(t, `talk ${tk.id}#${i}`)); return { id: tk.id, ...(tk.trigger ? { trigger: tk.trigger } : {}), when: p.when, turns: tk.turns.map(([who, text, kind]) => ({ who, text, kind: kind || "say" })) }; });
const ids = new Set(); for (const t of talks) { if (ids.has(t.id)) errors.push(`talk id の 重複 ${t.id}`); ids.add(t.id); }
for (const v of Object.values(VOICE)) for (const x of Object.values(v)) if (x.talk && !ids.has(x.talk)) errors.push(`VOICE の talk ${x.talk} が ない`);

// 数える
const count = {}; for (const l of lines) { const k = l.who + "/" + l.group; count[k] = (count[k] || 0) + 1; }
const total = lines.length + talks.length, turnCount = talks.reduce((a, t) => a + t.turns.length, 0);
const byKey = {}; for (const l of lines) for (const k of Object.keys(l.when)) byKey[k] = (byKey[k] || 0) + 1;
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }

const data = { version: 1, voice: VOICE, lines, talks };
writeFileSync(OUT + "home-talk-lines.json", JSON.stringify(data, null, 1));
// ゲームに そのまま 入れられる 形（classic script・グローバル名は 長めに）
writeFileSync(OUT + "home-talk-data.js", `// おうちの 会話データ（① 吹き出しと 会話）。docs/design/features/home-talk/ から 自動生成。手で 直さず、tools/feature-design/home-lines.mjs を 直して npm run design:features\n// ゲームに 入れるとき: js/home-talk-data.js に 置き、index.html と sw.js の 両方に 登録（home-life.js より 前）。\nconst HOME_TALK_DATA = ${JSON.stringify(data)};\n`);

// 一覧（Markdown）
const NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ", papa: "ぱぱ", mama: "まま" };
const GROUP = { context: "まわりに あわせた ひとこと", persona: "性格の セリフ", parent: "ぱぱ・まま", rare: "めずらしい ひとこと（金色）" };
const cond = (w) => Object.entries(w).map(([k, v]) => `${k}:${v.join("/")}`).join(" ") || "いつでも";
let md = `# おうちの 会話 一覧（自動生成）\n\n- ひとこと **${lines.length}** 種 ＋ かけあい **${talks.length}** 種（${turnCount} セリフ）＝ **${total}** 種\n- 内訳: ${Object.entries(count).map(([k, v]) => `${k.replace(/^(\w+)\//, (m, w) => NAME[w] + "／")} ${v}`).join("、")}\n- 条件ごとの 数: ${Object.entries(byKey).map(([k, v]) => `${k} ${v}`).join("、")}\n- 条件の 書きかたは [CODEX_TASK.md](CODEX_TASK.md) の「条件」を 見る。\n`;
for (const who of ["wanko", "gachan", "goji", "papa", "mama"]) {
  md += `\n## ${NAME[who]}\n`;
  for (const g of ["persona", "context", "parent", "rare"]) {
    const ls = lines.filter((l) => l.who === who && l.group === g); if (!ls.length) continue;
    md += `\n### ${GROUP[g]}（${ls.length}）\n\n| id | 文 | 条件 | 形 |\n| --- | --- | --- | --- |\n` + ls.map((l) => `| ${l.id} | ${l.text} | ${l.tag ? "〔" + l.tag + "〕 " : ""}${cond(l.when)} | ${l.kind} |`).join("\n") + "\n";
  }
}
md += `\n## かけあい（${talks.length}）\n\n| id | きっかけ・条件 | セリフ |\n| --- | --- | --- |\n` + talks.map((t) => `| ${t.id} | ${t.trigger ? "〔" + t.trigger + "〕 " : ""}${cond(t.when)} | ${t.turns.map((u) => `${NAME[u.who]}「${u.text}」`).join(" → ")} |`).join("\n") + "\n";
writeFileSync(OUT + "LINES.md", md);
console.log(`home-talk: ひとこと ${lines.length} ＋ かけあい ${talks.length}（${turnCount} セリフ）＝ ${total} 種`, count);
