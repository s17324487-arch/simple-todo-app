// レベルの おいわいの 会（js/home-lv-party.js・UI-120）の 検査（ブラウザ なし）
// セーブ（ふるい セーブに たす・こわれた かたちを なおす）・まちに いれる（10 ごと・あがった ときだけ・2かい いれない・いっぺんに 2つ）・
// つぎの 会（いちばん ひくい レベルの なかま）・たれまく・じゅんばん（Lv.100 の ことば）・ことば（ひらがな・3人は じぶんを なまえで・ながさ）・登録
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";
const R = gameContext();
const { HomeLvParty: L, Save, Stats } = R;
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const IDS = ["wanko", "gachan", "goji"];

// ---- 1. セーブ ----
{
  const f = Save.fresh();
  ok(JSON.stringify(f.lvParty) === JSON.stringify({ pend: [], done: { wanko: 0, gachan: 0, goji: 0 }, log: [] }), "Save.fresh().lvParty");
  const old = Save.fresh(); delete old.lvParty; old.v = Save.SCHEMA;
  const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.lvParty && Array.isArray(m.lvParty.pend) && m.lvParty.done.goji === 0, "ふるい セーブにも lvParty が はいる");
  Save.d = Save.fresh(); Save.d.lvParty = { pend: [{ who: "x", lv: 10 }, { who: "wanko", lv: 15 }, { who: "gachan", lv: 30 }, null], done: null, log: "x" };
  const P = L.save();
  ok(P.pend.length === 1 && P.pend[0].who === "gachan" && IDS.every((id) => P.done[id] === 0) && Array.isArray(P.log), "こわれた かたちを なおす " + JSON.stringify(P));
}
// ---- 2. まちに いれる（Stats.gainExp の あと）----
{
  Save.d = Save.fresh();
  const c = Save.d.chars.wanko; c.lv = 9; c.exp = Stats.expNeed(9) - 1;
  ok(JSON.stringify(Stats.gainExp("wanko", 1).map((u) => u.lv)) === "[10]" && L.save().pend.length === 1 && L.save().pend[0].lv === 10 && L.save().done.wanko === 10, "Lv.10 で まちに はいる");
  c.exp = Stats.expNeed(10) - 1; Stats.gainExp("wanko", 1);
  ok(c.lv === 11 && L.save().pend.length === 1, "Lv.11 では はいらない");
  // いっぺんに 2つ（Lv.18 → 21）
  const g = Save.d.chars.goji; g.lv = 18; g.exp = 0;
  let need = 0; for (let lv = 18; lv < 21; lv++) need += Stats.expNeed(lv);
  Stats.gainExp("goji", need);
  ok(g.lv === 21 && L.save().pend.filter((x) => x.who === "goji").map((x) => x.lv).join() === "20" && L.save().done.goji === 20, "Lv.18 → 21 で Lv.20 だけ");
  // いちど いわった レベルは もう いれない（レベルを じかに さげて また あげても）
  g.lv = 19; g.exp = Stats.expNeed(19) - 1; Stats.gainExp("goji", 1);
  ok(L.save().pend.filter((x) => x.who === "goji").length === 1, "おなじ レベルを 2かい いれない");
  // PokaDebug.level では はいらない（gainExp を とおらない）
  Save.d = Save.fresh(); R.PokaDebug.level(30);
  ok(!L.save().pend.length, "レベルを じかに かえても はいらない");
  // Lv.100 まで（UI-119）
  const k = Save.d.chars.gachan; k.lv = 99; k.exp = Stats.expNeed(99) - 1; Stats.gainExp("gachan", 1);
  ok(k.lv === 100 && L.save().pend.some((x) => x.who === "gachan" && x.lv === 100), "Lv.100 も いわう");
  ok(!L.leveled("papa", [{ lv: 10 }]) && !L.leveled("wanko", []), "しらない 子・あがって いない");
}
// ---- 3. つぎの 会・たれまく・じゅんばん ----
{
  Save.d = Save.fresh();
  Save.d.lvParty.pend = [{ who: "goji", lv: 30 }, { who: "wanko", lv: 20 }, { who: "gachan", lv: 20 }];
  const g = L.nextGroup();
  ok(g.lv === 20 && g.who.join() === "wanko,gachan", "いちばん ひくい レベルの なかま（3人の じゅん）" + JSON.stringify(g));
  ok(L.banner(g) === "わんこ・がちゃん レベル20 おめでとう！" && L.banner({ lv: 50, who: IDS }) === "みんな レベル50 おめでとう！" && L.banner({ lv: 10, who: ["goji"] }) === "ごじ レベル10 おめでとう！", "たれまく");
  Save.d.chars.wanko.name = "ポチ";
  ok(L.banner({ lv: 10, who: ["wanko"] }) === "ポチ レベル10 おめでとう！", "たれまくは つけた なまえ");
  Save.d.chars.wanko.name = "わんこ";
  ok(L.fill("{name}、レベル{lv}・つぎは {next}", { lv: 90, who: ["wanko", "goji"] }) === "わんこと ごじ、レベル90・つぎは 100" && L.fill("{next}", { lv: 100, who: ["goji"] }) === "100", "ことばの うめこみ");
  for (let i = 0; i < 30; i++) {
    for (const who of [["wanko"], ["gachan", "goji"], IDS]) {
      const G = { lv: 40, who }, host = L.hostOf(G), plan = L.plan(G, host), keys = plan.map((x) => x[0]);
      ok(who.length === 3 || !who.includes(host), "はじめる 子は いわわれない 子");
      ok(keys.slice(0, 5).join() === "congrats,thanks,kanpai,candle,blow" && keys.filter((k) => k === "fun").length === 2 && plan.every((x) => Array.isArray(x[1]) && x[1].length && x[1].every((id) => IDS.includes(id))), "じゅんばん " + JSON.stringify(plan));
      ok(plan.find((x) => x[0] === "blow")[1].every((id) => who.includes(id)) && plan.find((x) => x[0] === "thanks")[1].every((id) => who.length === 3 || who.includes(id)), "ふーっ・ありがとう は いわわれる 子");
      ok(who.length === 3 || plan.find((x) => x[0] === "congrats")[1].every((id) => !who.includes(id)), "おめでとう は ほかの 子");
    }
    const top = L.plan({ lv: 100, who: ["goji"] }, "wanko");
    ok(top[2][0] === "max" && top.length === 8, "Lv.100 は とくべつな ことば");
  }
  ok(L.STEP === 10 && Stats.LV_MAX === 100, "10 ごと・100 まで");
}
// ---- 4. ことば ----
{
  const kanji = /[一-鿿]/, all = [];
  const walk = (v, where) => { if (typeof v === "string") all.push([where, v]); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, where + "." + i)); else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, where + "." + k); };
  walk(L.LINES, "LINES");
  ok(all.length >= 50, "ことばの かず " + all.length);
  for (const [w, t] of all) {
    ok(!kanji.test(t), `${w}: かんじ「${t}」`);
    ok(t.replace(/\{[a-z]+\}/g, "XX").length <= 26, `${w}: ながすぎる「${t}」`);
    ok(!/ぼく|わたし|おれ/.test(t), `${w}: 3人は じぶんを なまえで よぶ「${t}」`);
  }
  for (const key of ["start", "ready", "congrats", "congratsAll", "thanks", "thanksAll", "kanpai", "candle", "blow", "max", "end", "stop"]) ok(IDS.every((id) => typeof L.LINES[key][id] === "string"), `${key}: 3人ぶん`);
  for (const key of ["fun", "cheer"]) ok(IDS.every((id) => Array.isArray(L.LINES[key][id]) && L.LINES[key][id].length >= 2), `${key}: 3人ぶん`);
  ok(L.LINES.parent.papa && L.LINES.parent.mama, "ぱぱ ままの おめでとう");
  ok(Object.values(L.LINES.congrats).every((t) => t.includes("{name}") && t.includes("{lv}")) && Object.values(L.LINES.congratsAll).every((t) => t.includes("{lv}")), "おめでとう に なまえ・レベル");
  ok(/ごじ/.test(L.LINES.thanks.goji) && /わんこ/.test(L.LINES.thanks.wanko), "ありがとう で じぶんの なまえ");
}
// ---- 5. 登録・つなぎ ----
{
  const html = read("index.html"), sw = read("sw.js"), dbg = read("js/debug.js"), src = read("js/home-lv-party.js");
  ok(html.indexOf('src="js/home-play.js"') < html.indexOf('src="js/home-lv-party.js"') && html.indexOf('src="js/home-lv-party.js"') < html.indexOf('src="js/debug.js"') && sw.includes('"./js/home-lv-party.js"'), "index.html（home-play.js の あと）と sw.js");
  ok(/lvParty\(\)/.test(dbg) && /lvPartyQueue\(who,lv,next\)/.test(dbg) && /lvPartyStart\(\)/.test(dbg) && /lvPartyNext\(sec=1\)/.test(dbg) && /gainExp\(id,n=1\)/.test(dbg) && /HomeLvParty\.st\(sc\);if\(L\.phase\)HomeLvParty\.stop\(sc,'stir'\);L\.next=3600;/.test(dbg), "PokaDebug（homeBubbleFixture で とめる）");
  ok(/HomeDoze\.can = function \(sc\) \{ return !HomeLvParty\.on\(sc\)/.test(src) && /HomePlay\.can = function \(sc\) \{ return !HomeLvParty\.on\(sc\)/.test(src) && /Stats\.gainExp = function/.test(src), "おひるね・あそぶ を おやすみ・gainExp を つつむ");
  ok(!/setTimeout|setInterval|SvgCache/.test(src), "タイマーを つかわない・SvgCache の キーを ふやさない（canvas で 描く）");
}
console.log(`✓ おいわいの 会（UI-120）: ${n} 項目`);
