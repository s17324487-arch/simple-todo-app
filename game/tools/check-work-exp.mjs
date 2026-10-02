// まいにちの いらい・おてつだい・町の人の おねがいで けいけんち（js/work-exp.js・UI-44。オーナーの FB 2026-10-02「日々のクエストやバイトで、少しずつ経験値が増えてレベルがアップするようにして欲しい」）の 検査。
// ブラウザ なしで: わりあい（おてつだい 2〜8%・いらい ★1〜5・おねがい 5%）・もらう かず（1 いじょう・Lv50 は 0）・3人 みんな・レベルアップ・
// 「すこしずつ」（どの レベルでも おてつだい 13〜50かいで 1つ）・バトルより すくない・まどの ことば・おみせ／いらい／おねがいに くみこんだ か・セーブは かわらない。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { WorkExp: X, Save: S, Stats, ENEMIES, PokaDebug } = R;
R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const fresh = () => { S.d = S.fresh(); return S.d; };
const src = (f) => readFileSync(new URL("../js/" + f, import.meta.url), "utf8");

// ---- 1. わりあい ----
ok(X.rate("shift", [[3, 3, 3, 3], 1]) === 0.08 && X.rate("shift", [[0, 1, 0], 1]) === 0.02, "おてつだい: ぜんぶ ○◎ 8%・○◎ なし 2%");
ok(Math.abs(X.rate("shift", [[3, 2, 1, 0], 1]) - 0.05) < 1e-9, "はんぶん ○◎ は 5%");
ok(Math.abs(X.rate("shift", [[3, 3], 0.5]) - 0.04) < 1e-9 && X.rate("shift", [[], 1]) === 0 && X.rate("shift", [[3], 0]) === 0, "とちゅうで やめたら その ぶん・0にんは 0");
for (const s of [1, 2, 3, 4, 5]) ok(Math.abs(X.rate("quest", s) - (0.04 + 0.03 * s)) < 1e-9, `いらい ★${s}`);
ok(X.rate("quest", 9) === X.rate("quest", 5) && X.rate("quest", 0) === X.rate("quest", 1), "★は 1〜5");
ok(X.rate("folk") === 0.05 && X.rate("nope") === 0, "おねがい 5%・しらない もの 0");

// ---- 2. もらう かず・3人・レベルアップ ----
{
  const d = fresh();
  for (const lv of [1, 5, 10, 20, 30, 49]) {
    d.chars.wanko.lv = lv; d.chars.wanko.exp = 0;
    const a = X.amount("wanko", 0.05);
    ok(a >= 1 && a === Math.max(1, Math.round(Stats.expNeed(lv) * 0.05)), `Lv${lv}: ${a}`);
    // すこしずつ: ぜんぶ ○◎ で 13かい いじょう、○◎ なしでも 50かい いないで 1つ
    ok(Math.ceil(Stats.expNeed(lv) / X.amount("wanko", 0.08)) >= 12 && Math.ceil(Stats.expNeed(lv) / X.amount("wanko", 0.02)) <= 51, `Lv${lv}: おてつだいで 1つ あがる かいすう`);
  }
  d.chars.wanko.lv = 50; ok(X.amount("wanko", 0.08) === 0, "Lv50 は もらわない");
  ok(X.amount("nobody", 0.08) === 0 && X.amount("gachan", 0) === 0, "しらない 子・0%");
}
{
  const d = fresh();
  for (const id of d.order) { d.chars[id].lv = 1; d.chars[id].exp = 0; }
  const rows = X.give("shift", [[3, 3, 3, 3, 3], 1]);
  ok(rows.length === 3 && rows.map((r) => r.id).join() === d.order.join() && rows.every((r) => r.n === 1 && r.lv === 1 && r.exp === 1 && r.need === 12), "3人 みんな もらう " + JSON.stringify(rows.map((r) => [r.n, r.exp])));
  ok(X.last && X.last.kind === "shift" && X.last.rows === rows, "last（PokaDebug）");
  // レベルアップ: つぎまで あと 1
  d.chars.goji.exp = 11;
  const up = X.give("quest", 3).find((r) => r.id === "goji");
  ok(up.lv === 2 && up.lv0 === 1 && up.ups.length === 1 && up.ups[0].lv === 2 && up.ups[0].diff && X.ups([up]).length === 1, "レベルアップ " + JSON.stringify(up));
  ok(d.chars.goji.lv === 2 && d.chars.goji.hp > 0, "セーブの lv が あがる");
  d.chars.wanko.lv = 50; const r50 = X.give("folk").find((r) => r.id === "wanko");
  ok(r50.n === 0 && r50.need === 0 && r50.lv === 50, "Lv50 は 0 で さいこう");
}
// バトル 1かいより すくない（いちばん よわい てき）・いらいの ★3 は ふつうの バトルぐらい
{
  const d = fresh(); d.chars.wanko.lv = 3; d.chars.wanko.exp = 0;
  const weak = Math.min(...Object.values(ENEMIES).map((e) => e.exp));
  ok(X.amount("wanko", X.rate("shift", [[3, 3, 3], 1])) <= weak * 2, "おてつだい 1かいは よわい てき 2ひき いか");
}

// ---- 3. がめんの ことば ----
{
  const d = fresh();
  for (const id of d.order) { d.chars[id].lv = 1; d.chars[id].exp = 11; } // あと 1（★2 は 12 × 10% = 1）
  const rows = X.give("quest", 2), html = X.html(rows), text = X.text(rows);
  ok(/wexp-row/.test(html) && (html.match(/wexp-row/g) || []).length === 3 && /Lv 2/.test(html) && /レベル2に あがった/.test(html), "まどの 3ぎょう・レベルアップ");
  ok(!kanji.test(html.replace(/<[^>]+>/g, "")) && !kanji.test(text), "ことばは ひらがな");
  ok(/^3にんに けいけんち \+\d+・\+\d+・\+\d+\n.+ あがった！$/.test(text), "トースト " + text);
  ok(X.text([{ id: "wanko", name: "わんこ", n: 0, ups: [] }]) === "", "0 の ときは なにも いわない");
  ok(!/NaN|undefined/.test(html), "NaN なし");
  const seen = [], toast0 = R.UI.toast; R.UI.toast = (m, c) => seen.push([m, c]);
  ok(X.toast(rows) === true && seen.length === 1 && seen[0][1] === "good" && /<br>/.test(seen[0][0]) && /wexp-toast/.test(seen[0][0]), "トーストは 2ぎょう " + JSON.stringify(seen));
  ok(X.toast([{ id: "wanko", name: "わんこ", n: 0, ups: [] }]) === false && seen.length === 1, "0 の ときは トーストしない");
  R.UI.toast = toast0;
}

// ---- 4. くみこみ ----
const mg = src("minigames.js"), nq = src("neri-quests.js"), tf = src("townsfolk.js"), idx = readFileSync(new URL("../index.html", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
ok(/WorkExp\.give\("shift", \[this\.ranks, fraction\]\)/.test(mg) && /WorkExp\.html\(xp\)/.test(mg) && /WorkExp\.cheer\(xp, \d+\)/.test(mg), "おてつだいの けっかで けいけんち");
ok(/WorkExp\.give\("quest", q\.stars\)/.test(nq) && /WorkExp\.toast\(/.test(nq), "いらいの ほうこくで けいけんち");
ok(/WorkExp\.give\("folk"\)/.test(tf) && /WorkExp\.toast\(/.test(tf), "町の人の おねがいで けいけんち");
ok(idx.indexOf("js/work-exp.js") > idx.indexOf("js/save.js") && idx.indexOf("js/work-exp.js") < idx.indexOf("js/minigames.js") && sw.includes('"./js/work-exp.js"'), "index.html と sw.js に とうろく（save.js の あと）");

// ---- 5. セーブは かわらない・PokaDebug ----
{
  const f = S.fresh(), d = fresh();
  ok(JSON.stringify(Object.keys(f.chars.wanko)) === JSON.stringify(Object.keys(d.chars.wanko)) && !("workExp" in f) && !("workExp" in f.stats), "セーブに あたらしい ばしょは ない");
  X.give("shift", [[3], 1]);
  const p = PokaDebug.workExp();
  ok(p && p.kind === "shift" && p.rows.length === 3 && p.levels.length === 3 && p.levels.every((l) => l.need > 0), "PokaDebug.workExp " + JSON.stringify(p));
}

console.log(`✓ work exp: ${n} checks（おてつだい 2〜8%・いらい ★1〜5 7〜19%・おねがい 5%）`);
