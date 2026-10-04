// 4F の へいせい じょじ ふうの ガチャ 5シリーズ（js/gacha-heisei-more.js・UI-80）の 検査。ブラウザ なしで たしかめる。
// 1. シリーズ: 47〜51 ばん・なまえ（ひらがな・10もじ まで）・いろ・カプセル・4F の しま・もりの 台・家具 2 と 服 3 シリーズ・ほんものの しょうひんめいは つかわない
// 2. けいひん 20しゅ: なまえ・せつめいは 漢字なし・レアは 4ばんめ・家具（へやの 立体・ガチャ だけ・フィギュア だい・ぷにぷにの 4しゅは さわると むにっ）／
//    服（3人 × 4むき・id かさならない・あたらしい かたち・ヘッドセットは カチューシャ・ベレーは ぼうし・ペンダントは うしろ すがたに かかない）
// 3. 絵: フィギュア 8しゅ（SVG の かけら・id なし・INK の せん・ぜんぶ ちがう・まわりに キラキラなし）
// 4. しゅうがわり: 5つの しまが 5シリーズに・1しゅうめは まえと おなじ・2しゅうめに 5つ そろって はじめて・5しゅうに 3しゅう・4F の あんない
// 5. まわす（200コイン・レア）・ずかんの ヒント・ガチャの がめんの せつめい・PokaDebug・とうろく
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext(), H = R.GachaHeiseiMore, GA = R.Gacha, MR = R.MeeRotation, GF = R.GachaForest;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const clean = (s) => typeof s === "string" && s.length > 200 && !/NaN|undefined|Infinity/.test(s);
const tagsBalanced = (s) => (s.match(/<(g|svg)\b/g) || []).length === (s.match(/<\/(g|svg)>/g) || []).length;
const src = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const norm = (s) => s.replace(/u\d+/g, "u");

// ---- 1. シリーズ ----
const IDS = ["heiseijunior", "heiseijewel", "heiseipuni", "heiseistage", "heiseipoem"], ISLE = { heiseijunior: "pouch", heiseijewel: "mini", heiseipuni: "squish", heiseistage: "meji", heiseipoem: "goods" };
ok(H.SERIES.length === 5 && H.SERIES.map((S) => S.id).join() === IDS.join() && H.first === 47 && GA.SERIES.length === 52, "5シリーズ・47〜51 ばん（ガチャは ぜんぶで 52）");
for (const [i, S] of H.SERIES.entries()) {
  ok(S.index === 47 + i && GA.SERIES[47 + i] === S && GA.byId(S.id) === S && H.index[S.id] === S.index, `${S.id}: ばんごう ${S.index}`);
  ok(S.heisei && S.more && S.forest && !S.corner && !S.sticker && !S.ring && S.isle === ISLE[S.id] && GF.ISLES.some((I) => I.id === S.isle), `${S.id}: しるし・しま ${S.isle}`);
  ok(!kanji.test(S.name) && [...S.name].length <= 10 && /^#[0-9A-F]{6}$/i.test(S.color) && S.caps.length >= 2 && GA.priceOf(S.index) === 200, `${S.id}: なまえ（${S.name}）・いろ・200コイン`);
}
ok(new Set(GA.SERIES.map((S) => S.color.toUpperCase())).size === GA.SERIES.length, "台の いろが ぜんぶ ちがう");
ok(H.SERIES.filter((S) => S.kind === "furn").map((S) => S.id).join() === "heiseipuni,heiseipoem" && H.SERIES.filter((S) => S.kind === "wear").map((S) => S.id).join() === "heiseijunior,heiseijewel,heiseistage", "フィギュア 2シリーズ・服と アクセサリー 3シリーズ");
ok(H.SERIES.filter((S) => S.kindText).map((S) => S.id).join() === "heiseijunior,heiseistage" && H.SERIES.every((S) => !S.kindText || /ふくと アクセサリー/.test(S.kindText)) && H.SERIES.filter((S) => S.kind === "wear").every((S) => S.acc && !S.hand), "ふくが でる シリーズは「ふくと アクセサリー」・ペンダントは アクセサリー");
// ほんものの しょうひんめい・キャラクター・ブランドの なまえを つかわない（ゲームの もじにも ソースの もじにも）
{
  const NG = ["ナルミヤ", "エンジェルブルー", "メゾピアノ", "ナカムラ", "ベリエ", "たまごっち", "セボン", "ほっぺちゃん", "ラブ and ベリー", "ラブベリ", "一期一会", "いちごいちえ", "サン宝石", "カバヤ", "バンダイ", "セガ"];
  const text = H.SERIES.flatMap((S) => [S.name, ...S.list.flatMap((it) => [it.name, it.desc])]).join("\n");
  ok(NG.every((w) => !text.includes(w)), "なまえ・せつめいに ほんものの しょうひんめいが ない");
  ok(NG.every((w) => !src("js/gacha-heisei-more.js").split("\n").filter((l) => !l.startsWith("//")).join("\n").includes(w)), "ソースの コード（コメント いがい）に ほんものの しょうひんめいが ない");
}

// ---- 2. けいひん ----
const ITEMS = H.SERIES.flatMap((S) => S.list);
ok(ITEMS.length === 20 && new Set(ITEMS.map((it) => it.id)).size === 20 && ITEMS.every((it) => GA.INDEX[it.id] === it), "けいひん 20しゅ");
const mine = new Set(ITEMS.map((it) => it.id)), others = R.WEAR_ITEMS.filter((w) => !mine.has(w.id));
ok(new Set(ITEMS.map((it) => it.name)).size === 20 && ITEMS.every((it) => !R.WEAR_ITEMS.some((w) => !mine.has(w.id) && w.name === it.name) && !R.FURNITURE.some((f) => !mine.has(f.id) && f.name === it.name)), "なまえは ほかの 服・家具と かさならない");
for (const it of ITEMS) {
  const S = GA.SERIES[it.series];
  ok(!kanji.test(it.name + it.desc) && [...it.name].length <= 14 && it.desc.length >= 8, `${it.id}: なまえ・せつめいは 漢字なし（${it.name}）`);
  ok(it.rare === (it.k === 3) && it.kind === S.kind && (!it.rare || /レア/.test(it.desc)), `${it.id}: レアは 4ばんめ`);
  if (it.kind === "furn") {
    const f = R.FURN_INDEX[it.id];
    ok(f && R.FURNITURE.includes(f) && f.gachaPrize && f.exclusive === "gacha" && f.price === 0 && f.interactive && f.cityItem && f.cityItem.type === "gachafig", `${it.id}: 家具（ガチャ だけ）`);
    const m = R.HomeDesign.model(it.id);
    ok(m && m.footW === f.w && m.footD === f.depth && clean(m.full || m.svg || ""), `${it.id}: へやの 立体`);
    ok(R.FigureStand.isFigure(it.id), `${it.id}: フィギュア だいに かざれる`);
    if (S.squish) ok(GF.SQUISH.has(it.id) && R.FurnLive.LIVE.has(it.id), `${it.id}: さわると むにっ（スクイーズと おなじ）`);
  } else {
    const w = R.ITEM_INDEX[it.id];
    ok(w && R.WEAR_ITEMS.includes(w) && w.gachaPrize && w.exclusive === "gacha" && typeof R.WEAR[w.wear] === "function" && w.wear.startsWith("heisei_") && !others.some((o) => o.wear === w.wear) && w.slot === it.slot, `${it.id}: あたらしい かたちの 服（${w && w.wear}）`);
    for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
      const svg = R.Chara.svg(who, { outfit: { [w.slot]: it.id }, dir });
      ok(clean(svg) && new Set(ids(svg)).size === ids(svg).length && tagsBalanced(svg), `${it.id}: ${who} ${dir} の 絵`);
    }
    const bare = (dir) => norm(R.Chara.svg("goji", { pose: "idle_01", face: "happy", dir, outfit: {}, color: "soft" })), on = (dir) => norm(R.Chara.svg("goji", { pose: "idle_01", face: "happy", dir, outfit: { [w.slot]: it.id }, color: "soft" }));
    ok(on("down") !== bare("down") && on("left") !== bare("left"), `${it.id}: まえ・よこで きる`);
    if (w.slot === "face" || /^heisei_jewel_/.test(w.wear)) ok(on("up") === bare("up"), `${it.id}: うしろ すがたには かかない`);
    else ok(on("up") !== bare("up"), `${it.id}: うしろ すがたも かく`);
    ok(clean(R.Art.iconSvg("wear", it.id)), `${it.id}: アイコン`);
  }
  ok(R.ItemDexSources.source(it.kind, it.kind === "furn" ? R.FURN_INDEX[it.id] : R.ITEM_INDEX[it.id]) === `Meeときょれじゃ の ガチャガチャ「${S.name}」で でるよ${it.rare ? "（レア）" : ""}。`, `${it.id}: ずかんの ヒント`);
}
{
  const [tr, bere, collar, dress] = H.SERIES[0].list, [cap, mask, stole, sdress] = H.SERIES[3].list;
  ok(tr.slot === "body" && bere.slot === "head" && collar.slot === "neck" && dress.slot === "body" && dress.rare, "ゆめかわ ジュニア: ふく・あたま・くび・ふく（レア）");
  ok(H.SERIES[1].list.every((it) => it.slot === "neck") && new Set(H.SERIES[1].list.map((it) => it.wear)).size === 4, "おかしの ほうせき: くびの ペンダント 4しゅ（いしの かたちが ちがう）");
  ok(cap.slot === "head" && mask.slot === "face" && stole.slot === "neck" && sdress.slot === "body" && sdress.rare, "キラキラ ステージ: あたま・かお・くび・ふく（レア）");
  ok(R.HeadPair.kind(cap.id) === "band" && R.HeadPair.ok(cap.id, "ribbon_pink") && !R.HeadPair.ok(cap.id, "catears") && R.HeadPair.kind(bere.id) === "hat" && !R.HeadPair.ok(bere.id, cap.id), "ヘッドセットは カチューシャ（ピンと いっしょ）・ベレーは ぼうし");
  const all = { head: bere.id, neck: collar.id, body: dress.id }, g = norm(R.Chara.svg("wanko", { dir: "down", outfit: all }));
  ok(clean(g) && g.includes("hgb") && g.includes("hpd"), "ベレーの ギンガムと ワンピースの けんばんは uid つきの clipPath");
}

// ---- 3. 絵 ----
const arts = new Set();
for (const it of ITEMS.filter((x) => x.kind === "furn")) {
  const s = R.GachaArt.figure(it.id);
  ok(clean(s) && s.startsWith("<svg") && /viewBox="0 0 100 110"/.test(s) && !/\sid="/.test(s) && s.includes(R.INK || "#1F1D1B") && tagsBalanced(s), `${it.id}: フィギュアの 絵（id なし・INK）`);
  ok(H.FIG[it.id] && R.GachaArt.FIG[it.id] === H.FIG[it.id] && R.GachaForestArt.FIG[it.id] === H.FIG[it.id], `${it.id}: GachaArt.FIG・GachaForestArt.FIG に とうろく`);
  arts.add(s);
}
ok(arts.size === 8, "フィギュア 8しゅの 絵は ぜんぶ ちがう");
ok(!/glint|sparkle\(/.test(src("js/gacha-heisei-more.js")), "レアの まわりに キラキラ（ひかる ほし）を かかない（UI-50・UI-66）");

// ---- 4. しゅうがわり ----
const rings4 = MR.RINGS.filter((Rg) => Rg.floor === 4);
for (const S of H.SERIES) {
  const Rg = rings4.find((x) => x.id === "4f-" + S.isle), P = MR.pool(Rg);
  ok(Rg && Rg.add.length === 2 && Rg.add[1] === S.id && P.length === 5 && P[4] === S.id, `${S.id}: 4f-${S.isle} の 5ばんめ`);
  const before = { ...Rg, add: Rg.add.slice(0, 1) };
  ok([-3, 0, 1].every((w) => MR.lineup(Rg, w).map((x) => x.id).join() === MR.lineup(before, w).map((x) => x.id).join()), `${S.id}: 1しゅうめ までの ならびは まえと おなじ`);
  const L2 = MR.lineup(Rg, 2).find((x) => x.id === S.id);
  ok(L2 && L2.fresh && L2.debut && MR.lineup(Rg, 2).filter((x) => x.fresh).length === 1, `${S.id}: 2しゅうめ（10/5〜）に はじめて はいる`);
  for (let w = 2; w <= 40; w++) ok([0, 1, 2, 3, 4].filter((d) => MR.lineup(Rg, w + d).some((x) => x.id === S.id)).length === 3, `${S.id}: 5しゅうに 3しゅう でる（${w}しゅう から）`);
}
ok(rings4.filter((Rg) => MR.pool(Rg).some((id) => GA.byId(id).heisei)).length === 5 && rings4.every((Rg) => MR.pool(Rg).filter((id) => GA.byId(id).heisei).length <= 1), "へいせいの シリーズは しまに 1つずつ（まちぼうけの しまは なし）");
{ R.Seasonal.override = new Date(2026, 9, 5, 12); const info = MR.infoText(4, "2026-10-5", 2); R.Seasonal.override = null; ok(typeof info === "string" && H.SERIES.every((S) => info.includes(`「${S.name}」`)), "4F の あんないに こんしゅうの NEW（へいせい 5つ）"); }
{
  MR.apply("2026-10-5");
  const f4 = R.VenueHalls.defs.arcade.floors[4].fixtures.filter((f) => f.kind === "gacha" && f.ring), fresh = f4.filter((f) => f.fresh).map((f) => f.series);
  ok(f4.length === 18 && H.SERIES.every((S) => fresh.includes(S.index)) && fresh.length === 6, "10/5 の 4F: 18だいの うち へいせい 5だいと まちぼうけの 1だいが NEW");
  MR.apply("2026-9-30");
  const f4b = R.VenueHalls.defs.arcade.floors[4].fixtures.filter((f) => f.kind === "gacha" && f.ring);
  ok(H.SERIES.every((S) => !f4b.some((f) => f.series === S.index)), "1しゅうめ（9/28〜10/4）の 4F には まだ ない");
}

// ---- 5. まわす ----
R.Save.d = R.Save.fresh(); R.Save.d.coins = 5000;
for (const S of H.SERIES) {
  const c0 = R.Save.d.coins; GA.next = 3; const r = GA.spin(S.index);
  const own = S.kind === "furn" ? R.Save.d.furn[r.item.id] === 1 : R.WearStock.count(r.item.id) === 1;
  ok(r && r.rare && r.item.id === `gacha_${S.id}_3` && R.Save.d.coins === c0 - 200 && own && R.Save.d.gacha.got[r.item.id] === 1, `${S.id}: レアが でて もちものに はいる（200コイン）`);
}
ok(/gachaHeiseiMore\(\)/.test(src("js/debug.js")) && R.PokaDebug.gachaHeiseiMore().series.length === 5 && R.PokaDebug.gachaHeiseiMore().series.every((s) => s.isle && s.index >= 47), "PokaDebug.gachaHeiseiMore()");
{
  const html = src("index.html"), sw = src("sw.js"), at = (f) => html.indexOf(f);
  ok(/js\/gacha-heisei-more\.js/.test(html) && /\.\/js\/gacha-heisei-more\.js/.test(sw) && at("js/gacha-heisei.js") < at("js/gacha-heisei-more.js") && at("js/gacha-heisei-more.js") < at("js/mee-rotation.js"), "index.html と sw.js に とうろく（gacha-heisei.js の あと・mee-rotation.js の まえ）");
}

if (bad.length) { console.error("✗ gacha-heisei-more:\n  " + bad.slice(0, 40).join("\n  ")); process.exit(1); }
console.log(`✓ gacha-heisei-more OK（${n} 項目）: 4F の へいせい じょじ ふうの ガチャ 5シリーズ × 4しゅ（47〜51 ばん・フィギュア 8・服と アクセサリー 12）・しまに 1つずつ（2しゅうめから）`);
