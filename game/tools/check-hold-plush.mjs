// ぬいぐるみ・フィギュアを もつ（js/hold-plush.js・UI-113。オーナーの 指示 2026-10-09「ぬいぐるみなどを持てるようにして。」）の 検査。
// ブラウザ なしで: もてる しゅるい（ぬいぐるみ・フィギュア・かべ／ラグは だめ）・ITEM_INDEX だけ・もって いる ぶん・1こで ひとり（わたす）・
// もって いない ものを はずす・3人の 絵・きがえの くみこみ・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HoldPlush: HP, Save: S, FURNITURE, FURN_INDEX, ITEM_INDEX, WEAR_ITEMS, WEAR, Chara, FigureStand } = R;
R.UI.updateHud = () => {}; let toast = ""; R.UI.toast = (t) => { toast = t; };
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const INK = R.INK || "#1F1D1B";

// ---- 1. もてる しゅるい ----
const plush = FURNITURE.filter((f) => /ぬいぐるみ/.test(f.name) && f.kind !== "wall" && f.kind !== "rug").map((f) => f.id);
ok(HP.ids.length >= 200 && plush.every((id) => HP.ids.includes(id)) && HP.ids.includes("teddy") && HP.ids.includes("kj_law_a") && HP.ids.includes("kj_law2_a"), `ぬいぐるみ ${plush.length}・ぜんぶで ${HP.ids.length}しゅ`);
ok(FigureStand.figures().every((id) => HP.ids.includes(id)), "フィギュア だいに かざれる ものは みんな もてる");
ok(HP.ids.every((id) => FURN_INDEX[id] && FURN_INDEX[id].kind !== "wall" && FURN_INDEX[id].kind !== "rug") && new Set(HP.ids).size === HP.ids.length, "かべ・ラグは もてない・かさならない");
ok(HP.ids.indexOf(plush[plush.length - 1]) < HP.ids.findIndex((id) => !/ぬいぐるみ/.test(FURN_INDEX[id].name)), "ぬいぐるみが さき");
for (const id of HP.ids) {
  const w = ITEM_INDEX["hold_" + id];
  ok(w && w.slot === "hand" && w.wear === "hold_plush" && w.col[0] === id && w.hold && w.price === 0 && w.name === FURN_INDEX[id].name, `${id}: もちものの ふく`);
}
ok(!WEAR_ITEMS.some((w) => w.hold) && typeof WEAR.hold_plush === "function", "WEAR_ITEMS には いれない（おみせ・ずかん・ふくの かずに でない）");

// ---- 2. もつ・わたす・はずす ----
S.d = S.fresh();
ok(HP.owned().length === 0, "なにも もって いない ときは でない");
S.d.furn.teddy = 1; S.d.furn.kj_law_a = 2;
const own = HP.owned().map((x) => x.id);
ok(own.length === 2 && own.includes("hold_teddy") && own.includes("hold_kj_law_a"), "もって いる 家具だけ " + own);
const W = S.d.chars;
ok(HP.take("wanko", "hold_teddy") && W.wanko.outfit.hand === "hold_teddy" && HP.free("hold_teddy") === 0, "わんこが くまの ぬいぐるみを もつ");
ok(HP.badge("hold_teddy", "gachan").from === W.wanko.name && HP.badge("hold_teddy", "gachan").text === `${W.wanko.name}が もってる` && HP.badge("hold_teddy", "wanko").from === null, "のこりが ない ときは もって いる 子の なまえ");
toast = "";
ok(HP.take("gachan", "hold_teddy") && W.gachan.outfit.hand === "hold_teddy" && !W.wanko.outfit.hand && /わたして もらったよ/.test(toast), "1こ だけ なら わんこから わたす");
ok(HP.take("wanko", "hold_kj_law_a") && HP.take("goji", "hold_kj_law_a") && W.wanko.outfit.hand === W.goji.outfit.hand && HP.free("hold_kj_law_a") === 0 && HP.badge("hold_kj_law_a", "gachan").n === 2, "2こ あれば 2人");
ok(!HP.take("wanko", "hold_nope") && !HP.take("wanko", "hi_tote") && (S.d.furn.teddy = 0, !HP.take("wanko", "hold_teddy")), "もって いない・ちがう ものは もてない");
ok(HP.fix() === 1 && W.gachan.outfit.hand === null && W.wanko.outfit.hand === "hold_kj_law_a", "もって いない ぬいぐるみは はずす（ほかは そのまま）");
S.d.furn.kj_law_a = 1; ok(HP.fix() === 1 && [W.wanko, W.goji].filter((c) => c.outfit.hand === "hold_kj_law_a").length === 1, "かずより おおい ぶんを はずす");
W.goji.outfit.hand = "hi_tote"; ok(HP.fix() === 0 && W.goji.outfit.hand === "hi_tote", "ふつうの もちものは さわらない");

// ---- 3. 3人の 絵 ----
S.d = S.fresh(); S.d.furn.kj_sev2_a = 1;
for (const who of Chara.IDS) {
  const svg = Chara.svg(who, { outfit: { hand: "hold_kj_sev2_a" }, color: S.d.chars[who].color });
  ok(svg.includes('preserveAspectRatio="xMidYMax meet"') && svg.includes(INK) && !/NaN|undefined/.test(svg), `${who}: 手に いちご わんこ`);
}
const r = WEAR.hold_plush({ p: R.PROFILE.wanko, a: R.PROFILE.wanko.a, view: "front", col: ["teddy"] });
ok(/<svg x="[\d.]+" y="[\d.]+" width="76" height="76"/.test(r.top), "たかさ 76 の 絵");
ok(R.Art.iconSvg("wear", "hold_teddy").includes("<svg") && R.Art.iconSvg("wear", "hold_teddy").includes("preserveAspectRatio"), "きがえの カードの アイコン");

// ---- 4. きがえ・とうろく ----
{
  const du = read("js/dressup.js"), html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`js/${f}`);
  ok(du.includes("HoldPlush.owned()") && du.includes("HoldPlush.take(who, it.id)") && du.includes("HoldPlush.badge(it.id, who)") && du.includes("HoldPlush.fix()") && du.includes("HoldPlush.free(item)"), "きがえ: もちものの タブ・もつ・ふだ・ひらく ときに なおす・みんな おそろい");
  ok(at("hold-plush.js") > Math.max(at("figure-stand.js"), at("ichiban-kuji.js"), at("crane-machines.js"), at("gacha.js"), at("hand-items.js")) && at("hold-plush.js") < at("world-zoom.js") && sw.includes('"./js/hold-plush.js"'), "index.html（家具の あと・world-zoom.js の まえ）と sw.js");
}
console.log(`✓ ぬいぐるみ・フィギュアを もつ（UI-113）: ${n} 項目`);
