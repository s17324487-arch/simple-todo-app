// へいせい じょじ ふうの ガチャ 4シリーズ（js/gacha-heisei.js・UI-79）の 検査。ブラウザ なしで たしかめる。
// 1. シリーズ: 43〜46 ばん・なまえ（ひらがな・10もじ まで）・いろ・カプセル・2F の くみ・フィギュア 3シリーズ と 服 1シリーズ
// 2. けいひん 16しゅ: なまえ・せつめいは 漢字なし・レアは 4ばんめ・家具（へやの 立体・ガチャ だけ・うって いない）／服（3人 × 4むき・id かさならない・あたまは ぼうし）
// 3. 絵: フィギュア 12しゅ（SVG の かけら・id なし・INK の せん・ぜんぶ ちがう）
// 4. しゅうがわり: 2F の くみが 5シリーズに・1しゅうめは まえと おなじ・2しゅうめに 4つ そろって はじめて・5しゅうに 3しゅう でる
// 5. まわす（200コイン・レア）・ずかんの ヒント・ガチャの がめんの せつめい・PokaDebug
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext(), H = R.GachaHeisei, GA = R.Gacha, MR = R.MeeRotation;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const clean = (s) => typeof s === "string" && s.length > 200 && !/NaN|undefined|Infinity/.test(s);
const tagsBalanced = (s) => (s.match(/<(g|svg)\b/g) || []).length === (s.match(/<\/(g|svg)>/g) || []).length;
const src = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. シリーズ ----
const IDS = ["heiseibungu", "heiseiroom", "heiseitama", "heiseioshare"], RING = { heiseibungu: "2f-a", heiseiroom: "2f-b", heiseitama: "2f-c", heiseioshare: "2f-d" };
ok(H.SERIES.length === 4 && H.SERIES.map((S) => S.id).join() === IDS.join() && H.first === 43 && GA.SERIES.length === 47, "4シリーズ・43〜46 ばん（ガチャは ぜんぶで 47）");
for (const [i, S] of H.SERIES.entries()) {
  ok(S.index === 43 + i && GA.SERIES[43 + i] === S && GA.byId(S.id) === S && H.index[S.id] === S.index, `${S.id}: ばんごう ${S.index}`);
  ok(S.heisei && S.more && !S.corner && !S.forest && !S.sticker && S.ring === RING[S.id], `${S.id}: しるし・くみ ${S.ring}`);
  ok(!kanji.test(S.name) && [...S.name].length <= 10 && /^#[0-9A-F]{6}$/i.test(S.color) && S.caps.length >= 2 && GA.priceOf(S.index) === 200, `${S.id}: なまえ（${S.name}）・いろ・200コイン`);
}
ok(new Set(GA.SERIES.map((S) => S.color.toUpperCase())).size === GA.SERIES.length, "台の いろが ぜんぶ ちがう");
ok(H.SERIES.filter((S) => S.kind === "furn").length === 3 && H.SERIES[3].kind === "wear" && H.SERIES[3].kindText && /ふくと アクセサリー/.test(H.SERIES[3].kindText), "フィギュア 3シリーズ・服と アクセサリー 1シリーズ（がめんの せつめい）");

// ---- 2. けいひん ----
const ITEMS = H.SERIES.flatMap((S) => S.list);
ok(ITEMS.length === 16 && new Set(ITEMS.map((it) => it.id)).size === 16 && ITEMS.every((it) => GA.INDEX[it.id] === it), "けいひん 16しゅ");
const others = R.WEAR_ITEMS.filter((w) => !ITEMS.some((it) => it.id === w.id));
for (const it of ITEMS) {
  const S = GA.SERIES[it.series];
  ok(!kanji.test(it.name + it.desc) && [...it.name].length <= 14 && it.desc.length >= 8, `${it.id}: なまえ・せつめいは 漢字なし（${it.name}）`);
  ok(it.rare === (it.k === 3) && it.kind === S.kind, `${it.id}: レアは 4ばんめ`);
  if (it.kind === "furn") {
    const f = R.FURN_INDEX[it.id];
    ok(f && R.FURNITURE.includes(f) && f.gachaPrize && f.exclusive === "gacha" && f.price === 0 && f.interactive && f.cityItem && f.cityItem.type === "gachafig", `${it.id}: 家具（ガチャ だけ）`);
    const m = R.HomeDesign.model(it.id);
    ok(m && m.footW === f.w && m.footD === f.depth && clean(m.full), `${it.id}: へやの 立体`);
    ok(R.FigureStand.isFigure(it.id), `${it.id}: フィギュア だいに かざれる`);
  } else {
    const w = R.ITEM_INDEX[it.id];
    ok(w && R.WEAR_ITEMS.includes(w) && w.gachaPrize && w.exclusive === "gacha" && typeof R.WEAR[w.wear] === "function" && w.wear.startsWith("heisei_") && !others.some((o) => o.wear === w.wear), `${it.id}: あたらしい かたちの 服（${w && w.wear}）`);
    for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
      const svg = R.Chara.svg(who, { outfit: { [w.slot]: it.id }, dir });
      ok(clean(svg) && new Set(ids(svg)).size === ids(svg).length, `${it.id}: ${who} ${dir} の 絵`);
    }
    ok(clean(R.Art.iconSvg("wear", it.id)), `${it.id}: アイコン`);
  }
  ok(/ガチャガチャ「へいせい|ガチャガチャ「ぽけっと/.test(R.ItemDexSources.source(it.kind, it.kind === "furn" ? R.FURN_INDEX[it.id] : R.ITEM_INDEX[it.id]) || ""), `${it.id}: ずかんの ヒント`);
}
const [cap, shades, choker, jumper] = H.SERIES[3].list;
ok(cap.slot === "head" && shades.slot === "face" && choker.slot === "neck" && jumper.slot === "body" && jumper.rare, "おしゃれ: ぼうし・かお・くび・ふく（レア）");
ok(R.HeadPair.kind(cap.id) === "hat" && !R.HeadPair.ok(cap.id, "catears") && R.HeadPair.ok(cap.id, "ribbon_pink"), "キャスケットは ぼうし（カチューシャとは いっしょに しない・ピンは いっしょ）");
const goji = (o) => R.Chara.svg("goji", { pose: "idle_01", face: "happy", dir: "down", outfit: o, color: "soft" }).replace(/u\d+/g, "u");
ok(goji({ body: jumper.id }) !== goji({}) && goji({ face: shades.id }) !== goji({}) && R.Chara.svg("goji", { dir: "up", outfit: { face: shades.id } }).replace(/u\d+/g, "u") === R.Chara.svg("goji", { dir: "up", outfit: {} }).replace(/u\d+/g, "u"), "ジャンスカ・めがねが のる（めがねは うしろ すがたに かかない）");

// ---- 3. 絵 ----
const arts = new Set();
for (const it of ITEMS.filter((x) => x.kind === "furn")) {
  const s = R.GachaArt.figure(it.id);
  ok(clean(s) && s.startsWith("<svg") && /viewBox="0 0 100 110"/.test(s) && !/\sid="/.test(s) && s.includes(R.INK || "#1F1D1B") && tagsBalanced(s), `${it.id}: フィギュアの 絵（id なし・INK）`);
  ok(H.FIG[it.id] && R.GachaArt.FIG[it.id] === H.FIG[it.id], `${it.id}: GachaArt.FIG に とうろく`);
  arts.add(s);
}
ok(arts.size === 12, "フィギュア 12しゅの 絵は ぜんぶ ちがう");
ok(!/glint\(/.test(src("js/gacha-heisei.js")), "レアの フィギュアの まわりに キラキラ（ひかる ほし）を かかない（UI-50・UI-66）");
ok(Object.values(H.PIX).every((m) => m.length === 8 && m.every((row) => row.length === 8)) && new Set(Object.values(H.PIX).map((m) => m.join())).size === 4, "たまご ペットの ドット絵は 8×8 で 4しゅ");

// ---- 4. しゅうがわり ----
const rings2 = MR.RINGS.filter((Rg) => Rg.floor === 2);
for (const S of H.SERIES) {
  const Rg = rings2.find((x) => x.id === S.ring), P = MR.pool(Rg);
  ok(Rg && Rg.add.length === 2 && Rg.add[1] === S.id && P.length === 5 && P[4] === S.id, `${S.id}: ${S.ring} の 5ばんめ`);
  const before = { ...Rg, add: Rg.add.slice(0, 1) };
  ok([-3, 0, 1].every((w) => MR.lineup(Rg, w).map((x) => x.id).join() === MR.lineup(before, w).map((x) => x.id).join()), `${S.id}: 1しゅうめ までの ならびは まえと おなじ`);
  const L2 = MR.lineup(Rg, 2).find((x) => x.id === S.id);
  ok(L2 && L2.fresh && L2.debut && MR.lineup(Rg, 2).filter((x) => x.fresh).length === 1, `${S.id}: 2しゅうめ（10/5〜）に はじめて はいる`);
  for (let w = 2; w <= 40; w++) ok([0, 1, 2, 3, 4].filter((d) => MR.lineup(Rg, w + d).some((x) => x.id === S.id)).length === 3, `${S.id}: 5しゅうに 3しゅう でる（${w}しゅう から）`);
}
ok(rings2.every((Rg) => MR.pool(Rg).filter((id) => GA.byId(id).heisei).length === 1), "へいせいの シリーズは くみに 1つずつ");
{ R.Seasonal.override = new Date(2026, 9, 5, 12); const info = MR.infoText(2, "2026-10-5", 2); R.Seasonal.override = null; ok(H.SERIES.every((S) => info.includes(`「${S.name}」`)) && /こんしゅうの NEW/.test(info), "2F の かんばんに こんしゅうの NEW（へいせい 4つ）"); }

// ---- 5. まわす ----
R.Save.d = R.Save.fresh(); R.Save.d.coins = 5000;
for (const S of H.SERIES) {
  const c0 = R.Save.d.coins; GA.next = 3; const r = GA.spin(S.index);
  const own = S.kind === "furn" ? R.Save.d.furn[r.item.id] === 1 : R.WearStock.count(r.item.id) === 1;
  ok(r && r.rare && r.item.id === `gacha_${S.id}_3` && R.Save.d.coins === c0 - 200 && own && R.Save.d.gacha.got[r.item.id] === 1, `${S.id}: レアが でて もちものに はいる（200コイン）`);
}
ok(/kindText/.test(src("js/gacha.js")) && /gachaHeisei\(\)/.test(src("js/debug.js")) && R.PokaDebug.gachaHeisei().series.length === 4, "ガチャの がめんの せつめい・PokaDebug.gachaHeisei()");
ok(/js\/gacha-heisei\.js/.test(src("index.html")) && /\.\/js\/gacha-heisei\.js/.test(src("sw.js")) && src("index.html").indexOf("js/gacha-heisei.js") < src("index.html").indexOf("js/mee-rotation.js") && src("index.html").indexOf("js/gacha-corner-more.js") < src("index.html").indexOf("js/gacha-heisei.js"), "index.html と sw.js に とうろく（gacha-corner-more.js の あと・mee-rotation.js の まえ）");

if (bad.length) { console.error("✗ gacha-heisei:\n  " + bad.slice(0, 40).join("\n  ")); process.exit(1); }
console.log(`✓ gacha-heisei OK（${n} 項目）: へいせい じょじ ふうの ガチャ 4シリーズ × 4しゅ（43〜46 ばん・フィギュア 12・服と アクセサリー 4）・2F の くみに 1つずつ（2しゅうめから）`);
