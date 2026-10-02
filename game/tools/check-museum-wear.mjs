// すいぞくかん・はくぶつかんの きふの ごほうび（js/museum-wear.js・UI-33）の 検査。ブラウザ なしで たしかめる。
// 8つ（館ごとに かお・くび・ふく・せなか）・めやす（さかな 50しゅ・ほね 63こ の なか）・服の とうろく（おみせに ならばない）・なまえと ことば（漢字なし）・
// 絵（3人 × 4むき・アイコン・NaN・id）・わたしかた（めやすで 1こずつ・2かい わたさない・まえから きふして いる 人）・みだしの ことば・ずかんの ヒント・セーブ・PokaDebug。
import { gameContext } from "./game-context.mjs";

const R = gameContext(), S = R.Save, MW = R.MuseumWear;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/, ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const fish = R.FISHING_DATA.fish.map((f) => f.id), bones = R.FOSSIL_DATA.dinos.flatMap((d) => d.art.parts.map((p) => d.id + "." + p.id));

// ---- 1. 8つ・館ごとに 4つ（かお・くび・ふく・せなか）・めやす ----
ok(MW.ITEMS.length === 8, "げんていの 服は 8つ");
for (const hall of ["aquarium", "museum"]) {
  const L = MW.list(hall), max = hall === "aquarium" ? fish.length : bones.length;
  ok(L.map((it) => it.slot).join() === "face,neck,body,back", `${hall}: かお・くび・ふく・せなか の じゅん`);
  ok(L.every((it, i) => i === 0 || it.need > L[i - 1].need) && L[0].need >= 1 && L[L.length - 1].need <= max, `${hall}: めやすは だんだん たかく ${max} まで（${L.map((it) => it.need)}）`);
}
ok(MW.list("aquarium").map((it) => it.need).join() === "5,15,25,40" && MW.list("museum").map((it) => it.need).join() === "5,15,30,50", "めやす（さかな 5・15・25・40 しゅ／ほね 5・15・30・50 こ）");
ok(fish.length === 50 && bones.length === 63, "さかな 50しゅ・ほね 63こ");

// ---- 2. 服の とうろく・おみせに ならばない・なまえ ----
const shopIds = new Set();
for (const s of Object.values(R.BUY_SHOPS)) if (typeof s.items === "function") for (const tab of ["head", "face", "neck", "body", "back", "all", undefined]) { try { for (const it of s.items(tab) || []) shopIds.add(it.id); } catch (e) { /* タブが ない */ } }
for (const it of MW.ITEMS) {
  const w = R.ITEM_INDEX[it.id];
  ok(!!w && R.WEAR_ITEMS.includes(w) && w.slot === it.slot && w.exclusive === "museum" && w.price === 0 && !!R.WEAR[w.wear], `${it.id}: 服に とうろく`);
  ok(!shopIds.has(it.id), `${it.id}: おみせに ならぶ`);
  ok(!kanji.test(it.name) && [...it.name].length <= 12, `${it.id}: なまえ（ひらがな・カタカナ 12もじ まで）「${it.name}」`);
  ok(!kanji.test(it.desc) && [...it.desc].length <= 50, `${it.id}: せつめい（漢字なし・50もじ まで）「${it.desc}」`);
  ok(Object.keys(it.st).length >= 1, `${it.id}: のうりょく`);
}

// ---- 3. 絵: 3人 × 4むき・アイコン・2まい ならべても id が かさならない ----
for (const it of MW.ITEMS) {
  for (const who of R.Chara.IDS) for (const dir of ["down", "left", "up", "right"]) {
    const svg = R.Chara.svg(who, { dir, face: "happy", outfit: { [it.slot]: it.id } });
    ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && !/NaN|undefined|null/.test(svg), `${it.id}/${who}/${dir}: 絵`);
    const list = ids(svg); ok(new Set(list).size === list.length, `${it.id}/${who}/${dir}: id が かさなる`);
  }
  const a = R.Chara.svg("goji", { outfit: { [it.slot]: it.id } }), b = R.Chara.svg("goji", { outfit: { [it.slot]: it.id } });
  ok(ids(a).every((x) => !ids(b).includes(x)), `${it.id}: 2まい ならべても id が かさならない`);
  const ic = R.Art.iconSvg("wear", it.id); ok(/<svg/.test(ic) && !/NaN|undefined/.test(ic), `${it.id}: アイコン`);
  // まえと うしろで 絵が ちがう（うしろすがたも かく）・ふくと せなかは うしろでも みえる
  const front = R.Chara.svg("goji", { outfit: { [it.slot]: it.id }, dir: "down" }), back = R.Chara.svg("goji", { outfit: { [it.slot]: it.id }, dir: "up" }), none = R.Chara.svg("goji", { dir: "up" });
  if (it.slot === "body" || it.slot === "back") ok(back.replace(/\sid="[^"]+"/g, "").length > none.replace(/\sid="[^"]+"/g, "").length + 200, `${it.id}: うしろすがたで みえない`);
  ok(front !== back, `${it.id}: まえと うしろが おなじ`);
}

// ---- 4. わたしかた ----
{
  S.d = S.fresh();
  ok(S.d.museum.wear && typeof S.d.museum.wear === "object" && Object.keys(S.d.museum.wear).length === 0, "あたらしい セーブの museum.wear は からっぽ");
  ok(MW.claim("aquarium").length === 0 && MW.claim("museum").length === 0, "きふ 0 では なにも ない");
  for (const id of fish.slice(0, 4)) S.d.museum.fish[id] = "2026-10-1";
  ok(MW.count("aquarium") === 4 && MW.claim("aquarium").length === 0, "さかな 4しゅ では まだ");
  ok(/あと 1しゅ/.test(MW.hint("aquarium")) && /おさかな ゴーグル/.test(MW.hint("aquarium")) && !kanji.test(MW.hint("aquarium")), "みだし（あと 1しゅ）「" + MW.hint("aquarium") + "」");
  S.d.museum.fish[fish[4]] = "2026-10-1";
  let got = MW.claim("aquarium", "2026-10-2");
  ok(got.map((it) => it.id).join() === "mw_goggle" && R.WearStock.count("mw_goggle") === 1 && S.d.museum.wear.mw_goggle === "2026-10-2" && MW.has("mw_goggle"), "5しゅで おさかな ゴーグル（1こ）");
  ok(MW.claim("aquarium").length === 0 && R.WearStock.count("mw_goggle") === 1, "2かい わたさない");
  ok(MW.claim("museum").length === 0, "すいぞくかんの きふは はくぶつかんに まざらない");
  // まえから たくさん きふして いた 人: いちどに ぜんぶ
  for (const id of fish) S.d.museum.fish[id] = "2026-9-1";
  got = MW.claim("aquarium");
  ok(got.map((it) => it.id).join() === "mw_fishtie,mw_clownhood,mw_manta" && MW.next("aquarium") === null && /ぜんぶ/.test(MW.hint("aquarium")), "50しゅで のこり 3つ いっぺんに");
  for (const k of bones.slice(0, 29)) S.d.museum.bones[k] = "2026-9-1";
  got = MW.claim("museum");
  ok(got.map((it) => it.id).join() === "mw_boneglass,mw_fang" && MW.next("museum").id === "mw_stego" && /あと 1こ/.test(MW.hint("museum")), "ほね 29こで めがねと ネックレス（ステゴ パーカーは 30こ）");
  for (const k of bones) S.d.museum.bones[k] = "2026-9-1";
  ok(MW.claim("museum").map((it) => it.id).join() === "mw_stego,mw_ptera" && MW.ITEMS.every((it) => R.WearStock.count(it.id) === 1), "63こで のこり 2つ・ぜんぶ 1こずつ");
  // 5こ もって いても わたした ことに なる（かずは ふえない）
  S.d = S.fresh(); R.WearStock.set("mw_goggle", 5); for (const id of fish.slice(0, 5)) S.d.museum.fish[id] = "2026-10-1";
  ok(MW.claim("aquarium").length === 1 && R.WearStock.count("mw_goggle") === 5 && MW.has("mw_goggle"), "5こ もって いる とき");
  // こわれた セーブ
  S.d = S.fresh(); S.d.museum.wear = [1]; ok(MW.claim("aquarium").length === 0 && !Array.isArray(S.d.museum.wear), "こわれた museum.wear を なおす");
}

// ---- 5. ことば・ずかん・セーブ・PokaDebug ----
for (const it of MW.ITEMS) {
  const t = MW.source(it.id), dex = R.ItemDexSources.source("wear", R.ITEM_INDEX[it.id]);
  ok(t === dex && t.includes(String(it.need)) && t.includes(it.hall === "aquarium" ? "すいぞくかん" : "はくぶつかん") && !kanji.test(t), `${it.id}: ずかんの ヒント「${t}」`);
}
{
  const old = S.fresh(); delete old.museum.wear; old.museum.fish.ayu = "2026-9-1";
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.museum.wear && Object.keys(m.museum.wear).length === 0 && m.museum.fish.ayu && S.SCHEMA === 2, "ふるい セーブに museum.wear（SCHEMA は そのまま）");
  S.d = S.fresh(); for (const id of fish.slice(0, 6)) S.d.museum.fish[id] = "2026-10-1";
  const st = R.PokaDebug.museumWear();
  ok(st && st.aquarium.count === 6 && st.aquarium.next === "mw_goggle" && st.museum.count === 0 && st.museum.next === "mw_boneglass" && /あと/.test(st.museum.hint), "PokaDebug.museumWear()");
}

if (bad.length) { console.error(`✗ museum wear: ${bad.length} 件（${n} 項目中）`); for (const b of bad) console.error("  - " + b); process.exit(1); }
console.log(`Museum wear: 8 limited clothes (aquarium fish 5/15/25/40 of 50, museum bones 5/15/30/50 of 63; face/neck/body/back each), not sold, kana names, art for 3 characters × 4 directions, one copy each, no double gifts, older donors get them on the next talk, hints, item dex, save, PokaDebug — ${n} checks OK`);
