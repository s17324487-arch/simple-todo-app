// 3人（わんこ・がちゃん・ごじ）の ことばの 検査（オーナーの 指示 2026-10-13「ごわがは、一応女の子の設定だ。自身を呼ぶ時の主語も、ごじ、わんこ、がちゃん、に統一せよ」）
// - 3人は 女の子。じぶんの ことは なまえで よぶ（「ぼく」「おれ」「わたし」「あたし」を つかわない。みんなの ことは「わんこたち」「みんな」など）
// - 町の人は 3人を「くん」で よばない（「ちゃん」など）。3人は「おにいさん」に ならない
// しらべる ところ: game/js/*.js と tools/feature-design/*.mjs（自動生成の 元）の、だれが いうか きまって いる 文字列
//   [ "wanko", "…" ]・{ who: "goji", text: "…" }・wanko: "…"／wanko: [ … ]（3人ごとの ことば）・{ … who: "gachan" … } の なかの 文字列
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const ROOT = new URL("..", import.meta.url).pathname;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
// じぶんを さす ことば（まえは 文の はじめ・くぎり。うしろは「ぼくじょう」「わたして」「おれい」「オレンジ」などを のぞく）
const PRE = String.raw`(?:^|[\s"'\x60「『（(、。！？!?…♪〜ー：:]|\\n)`;
const POST = String.raw`(?!じょう|じゅう|し|めつ|せき|とう|さつ|ちく|ぜん|ど|か|そ|せ|た(?!ち)|て|ま|い|る|ず|ぬ|ん[^で]|ン|ゴ)`;
const SELF = new RegExp(PRE + "(ぼく|ボク|おれ|オレ|わたし|あたし)" + POST);
const STR = /(['"`])((?:\\.|(?!\1).)*)\1/g;
function matchEnd(s, i) {
  const close = s[i] === "[" ? "]" : "}"; let d = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '"' || c === "'" || c === "`") { j++; while (j < s.length && s[j] !== c) { if (s[j] === "\\") j++; j++; } continue; }
    if (c === "[" || c === "{") d++; else if (c === "]" || c === "}") { d--; if (!d) return j; }
  }
  return -1;
}
// だれが いうか きまって いる 文字列を あつめる → [{ f, who, t }]
function spoken(f, s) {
  const out = [], add = (who, seg) => { for (const m of seg.matchAll(STR)) out.push({ f, who, t: m[2] }); };
  for (const m of s.matchAll(/\[\s*(['"])(wanko|gachan|goji)\1\s*,\s*(['"`])((?:\\.|(?!\3).)*)\3/g)) out.push({ f, who: m[2], t: m[4] });
  for (const m of s.matchAll(/["']?who["']?\s*:\s*(['"])(wanko|gachan|goji)\1(?:(?![{}]).)*?["']?text["']?\s*:\s*(['"`])((?:\\.|(?!\3).)*)\3/g)) out.push({ f, who: m[2], t: m[4] });
  for (const m of s.matchAll(/(?<![\w$.])["']?(wanko|gachan|goji)["']?\s*:\s*/g)) {
    const st = m.index + m[0].length;
    if (s[st] === "[" || s[st] === "{") { const en = matchEnd(s, st); if (en > 0) add(m[1], s.slice(st, en + 1)); }
    else if (/['"`]/.test(s[st])) { STR.lastIndex = st; const x = STR.exec(s); if (x && x.index === st) out.push({ f, who: m[1], t: x[2] }); }
  }
  for (const m of s.matchAll(/\{[^{}]*?["']?who["']?\s*:\s*(['"])(wanko|gachan|goji)\1[^{}]*\}/g)) add(m[2], m[0]);
  return out;
}
const files = [
  ...readdirSync(ROOT + "js").filter((x) => x.endsWith(".js")).map((x) => "js/" + x),
  ...readdirSync(ROOT + "tools/feature-design").filter((x) => x.endsWith(".mjs")).map((x) => "tools/feature-design/" + x),
];
let all = [];
for (const f of files) {
  const s = readFileSync(ROOT + f, "utf8");
  all = all.concat(spoken(f, s));
  ok(!/(わんこ|がちゃん|ごじ)くん/.test(s), `${f}: 3人を「くん」で よんで いる（女の子）`);
}
// しらべた かず（しらべかたが こわれて いない）
for (const who of Object.keys(NAME)) ok(all.filter((x) => x.who === who).length >= 300, `${who} の ことばが みつからない（${all.filter((x) => x.who === who).length}）`);
for (const x of all) {
  ok(!SELF.test(x.t), `${x.f}: ${x.who} が じぶんを「ぼく」「わたし」などで よんで いる「${x.t}」（なまえで よぶ）`);
  ok(!/おにいさん|おにいちゃん|おとこのこ/.test(x.t), `${x.f}: ${x.who} は 女の子「${x.t}」`);
}
// なまえで よぶ ことばが ある（れい）
for (const [who, re] of [["wanko", /わんこ(が|も|の|は)/], ["gachan", /がちゃん(が|も|の|は)/], ["goji", /ごじ(が|も|の|は)/]]) ok(all.some((x) => x.who === who && re.test(x.t)), `${who} が じぶんを なまえで よぶ ことばが ない`);
// しらべかたの たしかめ
ok(SELF.test("ぼくも いく") && SELF.test("ガゥ… ぼくなら") && SELF.test("わたしたち") && !SELF.test("オレンジいろ") && !SELF.test("おれいを いう") && !SELF.test("てを わたして") && !SELF.test("はしわたし") && !SELF.test("ぼくじょう"), "じぶんを さす ことばの みつけかた");
console.log(`✓ 3人の ことば（じぶんを なまえで よぶ・女の子）: ${all.length} の ことば・${n} 項目`);
