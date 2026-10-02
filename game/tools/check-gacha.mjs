// ガチャガチャ（js/gacha.js・js/gacha-art.js）の 検査。ブラウザ なしで シリーズ・かくりつ・もちもの・コイン・セーブ・絵を たしかめる。
// 12シリーズ × 4しゅ（レアは 1つ・10%。UI-28 で 6 → 12・アクセサリー 4シリーズ）・くじの わりあい・家具／服に はいる・200コイン・ダブりの ふくは 5こ まで もう 1こ（1こで 1人。UI-31）・6こめから 50コイン もどる・コンプリート・ふるい セーブ・おみせに ならばない・ずかんの ヒント・SVG。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Gacha: GA, GachaArt: A, Save: S } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {}; // HUD は ブラウザ だけ
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;

// ---- 1. シリーズと けいひん ----
ok(GA.SERIES.length === 12 && GA.ITEMS.length === 48, "12シリーズ・48しゅ（UI-28 で 2ばい）");
ok(GA.SERIES.filter((s) => s.kind === "furn").length === 7 && GA.SERIES.filter((s) => s.kind === "wear").length === 5, "へやに かざる もの 7シリーズ・服 5シリーズ");
ok(GA.SERIES.filter((s) => s.acc).map((s) => s.id).join() === "sparkle,hair,neck,party" && GA.SERIES.filter((s) => s.acc).every((s) => s.kind === "wear"), "アクセサリーの シリーズ 4つ（キラキラ アクセ・ヘアアクセ・ネックレス・パーティー）");
ok(GA.SERIES.slice(0, 6).map((s) => s.id).join() === "friends,sleepy,sweets,ride,ears,sparkle", "まえの 6シリーズの じゅんばんは そのまま（台の ばんごう・セーブの id）");
ok(new Set(GA.ITEMS.map((it) => it.id)).size === 48 && new Set(GA.SERIES.map((s) => s.id)).size === 12, "id が かさなる");
ok(new Set(GA.SERIES.map((s) => s.color.toUpperCase())).size === 12, "台の いろが ぜんぶ ちがう");
{
  const wears = GA.ITEMS.filter((it) => it.kind === "wear");
  ok(new Set(wears.map((it) => it.wear)).size === wears.length && wears.filter((it) => !it.wear.startsWith("gacha_")).map((it) => it.wear).join() === "catears", "アクセサリー・服の かたちが ぜんぶ ちがう（しろねこ だけ まえからの ねこみみ）");
  ok(GA.ITEMS.filter((it) => it.kind === "wear" && GA.SERIES[it.series].acc).length === 16, "アクセサリー 16しゅ");
}
for (const S0 of GA.SERIES) {
  ok(S0.list.length === 4 && S0.list.filter((it) => it.rare).length === 1 && S0.list[GA.RARE].rare, `${S0.name}: 4しゅで レアは 1つ`);
  ok(S0.name && !kanji.test(S0.name) && S0.name.length <= 10 && /^#[0-9A-F]{6}$/i.test(S0.color) && S0.caps.length >= 2, `${S0.name}: なまえ・いろ`);
  for (const it of S0.list) {
    ok(it.name && !kanji.test(it.name) && it.name.length <= 13, `けいひん「${it.name}」: ひらがな・カタカナで 13もじ まで`);
    ok(it.desc && !kanji.test(it.desc) && it.desc.length <= 40, `けいひん「${it.name}」の せつめい`);
    ok(it.id === `gacha_${S0.id}_${it.k}` && it.kind === S0.kind && GA.seriesOf(it.id) === S0, `${it.id} の シリーズ`);
  }
}
// ---- 2. かくりつ（ふつう 30%ずつ・レア 10%）----
ok(Math.abs(GA.RATE.reduce((a, b) => a + b, 0) - 1) < 1e-9 && GA.RATE.slice(0, 3).every((r) => r === 0.3) && GA.RATE[3] === 0.1, "かくりつの あわせ");
{
  const cnt = [0, 0, 0, 0], N = 10000;
  for (let i = 0; i < N; i++) cnt[GA.roll((i + 0.5) / N)]++;
  ok(cnt.join() === "3000,3000,3000,1000", "くじの わりあい " + cnt.join());
  ok(GA.roll(0) === 0 && GA.roll(0.2999) === 0 && GA.roll(0.3) === 1 && GA.roll(0.8999) === 2 && GA.roll(0.9) === 3 && GA.roll(0.99999) === 3 && GA.roll(1) === 3, "くじの さかいめ");
}
// ---- 3. 家具・服に はいって いる ----
for (const it of GA.ITEMS) {
  if (it.kind === "furn") {
    const f = R.FURN_INDEX[it.id];
    ok(f && R.FURNITURE.includes(f) && f.exclusive === "gacha" && f.gachaPrize && !("sparkle" in f) && f.kind === "floor" && f.w > 0 && f.h > 0 && f.depth > 0, `家具 ${it.id}`);
    const art = R.FURN_ART[it.id]();
    ok(typeof art === "string" && art.startsWith("<svg ") && art.includes(`width="${f.w}" height="${f.h}"`), `家具の 絵 ${it.id}`);
    const m = R.IkebukuroItemArt.model(it.id);
    ok(m && m.w === f.w && m.height === f.h && m.full.startsWith("<svg") && m.footD === f.depth, `へやの 立体 ${it.id}`);
  } else {
    const w = R.ITEM_INDEX[it.id];
    ok(w && R.WEAR_ITEMS.includes(w) && w.exclusive === "gacha" && w.gachaPrize && w.slot === it.slot && typeof R.WEAR[w.wear] === "function" && ["head", "face", "neck"].includes(w.slot), `服 ${it.id}`);
    ok(w.price > 0 && w.st && w.st.sp >= 1, `服 ${it.id} の ねだん・つよさ`);
  }
  ok(R.ItemDexSources.source(it.kind, it.kind === "wear" ? R.ITEM_INDEX[it.id] : R.FURN_INDEX[it.id]) === `Meeときょれじゃ の ガチャガチャ「${GA.seriesOf(it.id).name}」で でるよ${it.rare ? "（レア）" : ""}。`, `ずかんの ヒント ${it.id}`);
}
// おみせには ならばない
for (const shop of Object.values(R.BUY_SHOPS)) for (const tab of ["head", "face", "neck", "body", "back", "floor", "wall", "food", "tool", ""]) {
  let list = []; try { list = shop.items(tab) || []; } catch (e) { list = []; }
  ok(!list.some((i) => i && GA.INDEX[i.id]), `おみせ ${shop.name} に ガチャの けいひんが ならぶ`);
}
// ---- 4. 絵（SVG）----
const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
for (const it of GA.ITEMS.filter((x) => x.kind === "furn")) {
  const s = A.figure(it.id);
  ok(s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined/.test(s) && /viewBox="0 0 (100|180) 110"/.test(s), `フィギュアの 絵 ${it.id}`);
  const d = ids(s); ok(new Set(d).size === d.length, `フィギュア ${it.id} の id が かさなる`);
}
for (const it of GA.ITEMS.filter((x) => x.kind === "wear")) for (const who of R.Chara.IDS) for (const dir of ["down", "right", "left", "up"]) {
  const s = R.Chara.svg(who, { pose: "idle_01", face: "happy", dir, outfit: { [it.slot]: it.id }, color: "soft" });
  ok(s.startsWith("<svg") && !/NaN|undefined/.test(s), `服 ${it.id}（${who}・${dir}）`);
  const d = ids(s); ok(new Set(d).size === d.length, `服 ${it.id}（${who}・${dir}）の id`);
}
for (const col of ["#F7C948", "#BFE6F7"]) for (const o of [0, 1]) { const s = A.capsule(col, o, "t" + o); ok(s.startsWith("<svg") && !/NaN|undefined/.test(s) && s.includes(`id="gcap-t${o}"`), "カプセルの 絵"); }
for (const S0 of GA.SERIES) { const s = A.machine(S0, ""); ok(s.startsWith("<svg") && !/NaN|undefined/.test(s), `台の 絵 ${S0.id}`); }
ok(!/NaN|undefined/.test(A.knob("#F29BB2")), "つまみの 絵");

// ---- 5. まわす（200コイン）・もちもの・ダブり・コンプリート ----
S.d = S.fresh();
ok(S.d.gacha && S.d.gacha.plays === 0 && typeof S.d.gacha.got === "object" && typeof S.d.gacha.done === "object", "Save.fresh に gacha が ない");
{
  const old = S.migrate({ ...S.fresh(), gacha: undefined, coins: 321 }); ok(old.gacha && old.gacha.plays === 0 && old.coins === 321, "ふるい セーブに gacha が たされない");
  S.d.coins = 199; ok(GA.spin(0, 0.5) === null && S.d.coins === 199 && GA.st().plays === 0, "コインが たりなくても まわせる");
  S.d.coins = 1000; const r = GA.spin(0, 0.95);
  ok(r && r.k === 3 && r.rare && r.first && !r.refund && r.item.id === "gacha_friends_3" && S.d.coins === 800 && S.d.furn.gacha_friends_3 === 1 && GA.got("gacha_friends_3") === 1 && GA.st().plays === 1, "レアが でない／200コイン へらない／家具が ふえない");
  const r2 = GA.spin(0, 0.95); ok(r2 && !r2.first && !r2.refund && S.d.furn.gacha_friends_3 === 2 && S.d.coins === 600, "フィギュアの ダブりは ふたつ めも かざれる");
  // 服: はじめては ふくに・ダブりは 1こで 1人（UI-31）なので 5こ まで もう 1こ・それより おおいと 50コイン もどる
  S.d.coins = 1000; const w1 = GA.spin(4, 0.1);
  ok(w1 && w1.item.id === "gacha_ears_0" && S.d.wardrobe.gacha_ears_0 === true && S.d.coins === 800 && !w1.refund && w1.copies === 1, "服が ふくに はいらない");
  const w2 = GA.spin(4, 0.1); ok(w2 && !w2.refund && w2.copies === 2 && S.d.wardrobe.gacha_ears_0 === 2 && S.d.coins === 600 && GA.got("gacha_ears_0") === 2, "ダブった 服が 2こめに ならない");
  R.WearStock.set("gacha_ears_0", 5); S.d.coins = 1000;
  const w2b = GA.spin(4, 0.1); ok(w2b && w2b.refund === GA.DUP && S.d.coins === 850 && S.d.wardrobe.gacha_ears_0 === 5 && GA.got("gacha_ears_0") === 3, "5こ もって いる 服で 50コイン もどらない");
  S.d.coins = 600;
  // つぎに でる もの（PokaDebug.gachaNext）は 1かい だけ
  GA.next = 2; const w3 = GA.spin(4, 0.1); ok(w3.k === 2 && GA.next === null && S.d.wardrobe.gacha_ears_2, "gachaNext が きかない");
  ok(!GA.complete(4) && !GA.st().done.ears, "3しゅで コンプリート に なる");
  GA.next = 1; GA.spin(4); GA.next = 3; const w5 = GA.spin(4);
  ok(w5.complete && GA.complete(4) && GA.st().done.ears === R.U.today() && S.d.wardrobe.gacha_ears_3, "4しゅ そろっても コンプリート に ならない");
  S.d.coins = 1000; GA.next = 0; const w6 = GA.spin(4); ok(w6 && !w6.complete && GA.st().done.ears === R.U.today(), "コンプリートが 2かい でる");
  // こわれた セーブ
  S.d.gacha = { plays: "x", got: 5, done: null }; ok(GA.st().plays === 0 && typeof GA.st().got === "object" && typeof GA.st().done === "object" && GA.got("gacha_ears_0") === 0, "こわれた gacha を なおせない");
  S.d.gacha = null; ok(GA.st().plays === 0, "gacha が ない セーブ");
}
// ---- 6. そとへの つうしん なし・ことば ----
for (const f of ["../js/gacha.js", "../js/gacha-art.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|Math\.random\(\)\s*<\s*0\.0/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん する`);
}
{
  const src = readFileSync(new URL("../js/gacha.js", import.meta.url), "utf8");
  const texts = [...src.matchAll(/text: `?"?([^"`]*)["`]/g)].map((m) => m[1]).concat(Object.values(GA.REACT).flat());
  for (const t of texts) ok(!kanji.test(t.replace(/\$\{[^}]*\}/g, "")), `ガチャの ことばに 漢字: ${t}`);
}
// ---- レアの キラキラは ない（UI-50。オーナーの FB「レアアイテムのキラキラした演出は全て削除して」）----
{
  const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8"), house = read("js/scene-house.js"), css = read("css/style.css"), src = read("js/gacha.js");
  ok(!/f\.rare\s*&&/.test(house) && !/sparkle/.test(house), "おうち: レアの けいひんの まわりに ほしを ださない");
  ok(!R.FURNITURE.some((f) => "sparkle" in f), "家具に sparkle の しるしは ない");
  ok(!/gacha-cap\.gold|gacha-bigcap\.gold|gacha-prize\.rare|gacha-card\.rare\{background/.test(css) && !/item-dex-card\.rare[^}]*gradient/.test(css), "CSS: レアの カプセル・カードを ひからせない");
  ok(!/classList\.add\("gold"\)|" gold"|"gacha-prize" \+ \(r\.rare/.test(src), "ガチャ: 金の カプセル・レアの カードの クラスは つかわない");
}
console.log(`Gacha: 12 series x 4 (1 rare each, 30/30/30/10), roll split, furniture/clothes registration and room models, not sold in shops, dex hints, figure/clothes/capsule/machine SVG, 200-coin spin, duplicate clothes become copies up to 5 then refund, complete once, old and broken saves — ${n} checks OK`);
