// かせきの ほねを うる・そんちょうさんの ひょうしょう（js/fossil-sell.js・UI-69）の 検査。
// ブラウザ なしで: ねだん（めずらしさ・あたまは 1.5ばい・さかなより たかい）・もって いる／まだ ない／あまり・うる・おみせの ことば・
// ひょうしょうの コイン（ぜんぶ うる より おおい）・1／5／10たいめの かざる もの・2ど もらえない・まえの セーブ・かざる ものの 絵・くみこみ・ことば・PokaDebug
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { FossilSell: F, DinoAward: A, Save: S, FOSSIL_DATA, FISHING_DATA, FURN_INDEX, FURNITURE, FURN_ART, Art, PokaDebug, U } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const fresh = () => { S.d = S.fresh(); return S.d; };
const D = FOSSIL_DATA.dinos, keys = D.flatMap((d) => d.art.parts.map((p) => d.id + "." + p.id));

// ---- 1. ねだん ----
{
  ok(F.price("compso.head") === 450 && F.price("compso.body") === 300 && F.price("trex.skull") === 1200 && F.price("trex.leg") === 800 && F.price("spino.skull") === 1800 && F.price("fukui.arm") === 1200, "ねだん: めずらしさ 1〜4 で 300〜1200・あたまは 1.5ばい");
  ok(F.price("nope.bone") === 0 && F.price("trex.nope") === 0, "しらない ほねは 0");
  const fish = FISHING_DATA.fish.map((f) => f.sell).sort((a, b) => a - b), med = fish[Math.floor(fish.length / 2)];
  ok(keys.every((k) => F.price(k) >= 300 && F.price(k) % 10 === 0) && keys.every((k) => F.price(k) > med * 2), `ほねは どれも 300 いじょう（さかなの まんなか ${med} の 2ばい より たかい）`);
}

// ---- 2. もって いる・まだ ない・あまり・うる ----
{
  const d = fresh();
  d.fossil.bones = { "compso.head": 2, "compso.body": 1, "trex.skull": 1, "raptor.arm": 0 };
  d.museum.bones = { "compso.body": U.today() };
  ok(JSON.stringify(F.held()) === JSON.stringify(["trex.skull", "compso.head", "compso.body"]), "もって いる ほね（データの じゅん・0こは のぞく）: " + F.held());
  ok(F.needed("trex.skull") && F.needed("compso.head") && !F.needed("compso.body"), "まだ はくぶつかんに ない ほね");
  ok(F.spare("compso.head") === 1 && F.spare("compso.body") === 1 && F.spare("trex.skull") === 0, "あまり: きふに いる 1こは のこす・きふずみは ぜんぶ");
  const c0 = d.coins, got = F.sellBone("compso.head", 1);
  ok(got === 450 && d.coins === c0 + 450 && d.fossil.bones["compso.head"] === 1 && d.stats.coinsEarned >= 450, "1こ うる → コイン・ほねが へる");
  ok(F.sellBone("compso.head", 5) === 450 && d.fossil.bones["compso.head"] === 0 && F.sellBone("compso.head", 1) === 0, "もって いる ぶん だけ・0こは うれない");
  ok(F.sellBone("trex.skull", 0) === 0 && F.sellBone("trex.skull", -2) === 0 && d.fossil.bones["trex.skull"] === 1, "0こ・マイナスは うらない");
  ok(F.choice({ shopId: "market" }) === "ほねを うる" && F.choice({ shopId: "bakery" }) === null, "スーパーだけ「ほねを うる」");
  d.fossil.bones = {};
  ok(F.choice({ shopId: "market" }) === null, "ほねが なければ ださない");
}

// ---- 3. ひょうしょう ----
{
  for (const d of D) {
    const sum = d.art.parts.reduce((a, p) => a + F.price(d.id + "." + p.id), 0);
    ok(A.coins(d.id) > sum && A.coins(d.id) % 100 === 0, `${d.name}: ひょうしょうの コイン ${A.coins(d.id)} は ぜんぶ うる ${sum} より おおい（きふする りゆう）`);
  }
  ok(A.coins("compso") === 1100 && A.coins("trex") === 10200 && A.coins("nope") === 0, "コイン: コンプソグナトゥス 1100・ティラノサウルス 10200");
  const d = fresh(); const c0 = d.coins;
  ok(A.pending().length === 0 && A.count() === 0, "はじめは なし");
  d.museum.done = { compso: U.today(), raptor: U.today() };
  ok(A.pending().join() === "raptor,compso", "かんせいして まだ ひょうしょうして いない（データの じゅん）: " + A.pending());
  const r1 = A.give("compso");
  ok(r1 && r1.coins === 1100 && r1.n === 1 && r1.gift === "dino_award_cert" && d.furn.dino_award_cert === 1 && d.coins === c0 + 1100 && d.museum.awards.compso, "1たいめ: コインと ひょうしょうじょう");
  ok(A.give("compso") === null && d.coins === c0 + 1100 && d.furn.dino_award_cert === 1, "おなじ きょうりゅうは 2ど もらえない");
  const r2 = A.give("raptor");
  ok(r2 && r2.n === 2 && r2.gift === null && A.pending().length === 0, "2たいめ: コイン だけ");
  for (const x of ["trex", "tricera"]) A.give(x);
  const r5 = A.give("stego");
  ok(r5.n === 5 && r5.gift === "dino_award_trophy" && d.furn.dino_award_trophy === 1, "5たいめ: きょうりゅう はかせ トロフィー");
  for (const x of ["brachio", "ankylo", "spino", "para"]) A.give(x);
  const r10 = A.give("fukui");
  ok(r10.n === 10 && r10.gift === "dino_award_gold" && d.furn.dino_award_gold === 1, "10たいめ（ぜんぶ）: きんの きょうりゅう トロフィー");
  ok(A.give("nope") === null, "しらない きょうりゅうは null");
  // まえの セーブ（awards が ない・こわれて いる）
  const old = S.fresh(); delete old.museum.awards; old.museum.done = { trex: "2026-9-1" };
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.museum.awards && JSON.stringify(m.museum.awards) === "{}" && m.museum.done.trex, "まえの セーブにも awards が できる");
  S.d = m; ok(A.pending().join() === "trex", "まえに かんせいした ぶんは まだ もらえる");
  S.d.museum.awards = []; ok(A.count() === 0 && !Array.isArray(S.d.museum.awards), "こわれた awards は なおす");
}

// ---- 4. かざる もの ----
{
  const ids = ["dino_award_cert", "dino_award_trophy", "dino_award_gold"];
  ok(ids.every((id) => FURN_INDEX[id] && FURNITURE.filter((f) => f.id === id).length === 1 && FURN_INDEX[id].price === 0 && FURN_INDEX[id].rare && FURN_INDEX[id].dinoAward), "3つ とも 家具に とうろく（うりものに しない）");
  ok(FURN_INDEX.dino_award_cert.kind === "wall" && FURN_INDEX.dino_award_trophy.kind === "floor" && FURN_INDEX.dino_award_gold.kind === "floor", "かべ 1・ゆか 2");
  for (const id of ids) {
    const svg = Art.furnSvg(id);
    ok(svg.startsWith("<svg") && !/NaN|undefined/.test(svg) && svg.length > 600 && !/ id="/.test(svg.replace(/<svg[^>]*>/, "")), id + ": 絵（NaN・id なし）");
    ok(!kanji.test(FURN_INDEX[id].name + FURN_INDEX[id].desc), id + ": なまえと せつめいは ひらがな");
  }
  const shop = R.BUY_SHOPS.furniture;
  ok(["floor", "wall"].every((tab) => shop.items(tab).every((f) => !ids.includes(f.id))), "かぐやさんに ならばない（0コインで かえない）");
  const src = ids.map((id) => R.ItemDexSources.source("furn", FURN_INDEX[id]));
  ok(src[0].includes("1たい") && src[1].includes("5たい") && src[2].includes("ぜんぶ（10たい）") && src.every((t) => !kanji.test(t)), "ずかんの ヒント: " + src.join(" / "));
  const others = new Set(FURNITURE.filter((f) => !ids.includes(f.id)).map((f) => f.name));
  ok(ids.every((id) => !others.has(FURN_INDEX[id].name)), "なまえが ほかの 家具と かさならない");
}

// ---- 5. くみこみ・ことば・PokaDebug ----
{
  const store = read("js/store-iso.js"), mu = read("js/museum.js"), html = read("index.html"), sw = read("sw.js"), save = read("js/save.js");
  ok(/FossilSell\.choice\(this\)/.test(store) && /FossilSell\.open\(\)/.test(store), "お店: スーパーで「ほねを うる」");
  ok(/if \(r\.done\) await this\.doneCard\(r\.done, n, face, T\);\s*if \(r\.done && typeof DinoAward !== "undefined"\) await DinoAward\.present\(r\.done\.id\);/.test(mu), "はくぶつかん: かんせいの あとで ひょうしょう");
  ok(/bid === "museum" && typeof DinoAward !== "undefined"\) await DinoAward\.catchUp\(\)/.test(mu), "はくぶつかん: はかせに はなすと まえの ぶんの ひょうしょう");
  ok(html.indexOf("js/fossil-sell.js") > html.indexOf("js/museum.js") && html.indexOf("js/fossil-sell.js") > html.indexOf("js/fossils.js") && html.indexOf("js/fossil-sell.js") < html.indexOf("js/item-dex-sources.js") && sw.includes('"./js/fossil-sell.js"'), "index.html と sw.js に とうろく");
  ok(/awards: \{\}/.test(save), "Save.fresh().museum.awards");
  for (const t of [F.WARN, "ほねを うる"]) ok(!kanji.test(t), "ことばは ひらがな: " + t.slice(0, 20));
  const src = read("js/fossil-sell.js"), texts = [...src.matchAll(/text: `([^`]*)`/g), ...src.matchAll(/text: "([^"]*)"/g)].map((m) => m[1]);
  ok(texts.length >= 8 && texts.every((t) => !kanji.test(t.replace(/\$\{[^}]*\}/g, ""))), "がめんの ことばは ひらがな（" + texts.length + "）");
  const d = fresh(); d.fossil.bones = { "trex.skull": 1, "compso.body": 2 }; d.museum.bones = { "compso.body": U.today() };
  const st = PokaDebug.fossilSell();
  ok(st && st.held.length === 2 && st.spareCoins === 600 && st.count === 0 && Array.isArray(st.pending), "PokaDebug.fossilSell " + JSON.stringify(st));
  const after = PokaDebug.museumDino("raptor");
  ok(after.pending.join() === "raptor" && D.find((x) => x.id === "raptor").art.parts.every((p) => S.d.museum.bones["raptor." + p.id]), "PokaDebug.museumDino: ぜんぶ きふ・かんせい・ひょうしょうは まだ");
}

console.log(`✓ fossil sell (UI-69): ${n} checks（ねだん・あまり・うる・ひょうしょう 1/5/10・まえの セーブ・かざる もの 3・くみこみ）`);
