// いちばんくじの いれかわる けいひん（js/kuji-rotation.js・js/kuji-rotation-art.js・js/ichiban-kuji.js の THEMES。UI-112。
// オーナーの 指示 2026-10-09「一番くじは定期的に景品を変えて。」）の 検査。ブラウザ なしで:
// セット（みせごとに 2つ・80まい・25しゅ）・いつ いれかわるか（2しゅうかん）・ロットの いれかわり（えらんで いない ときは まつ・ひいた けいひんは のこる）・
// ふるい セーブ・クーポンは まえの セットの ぶんも つかえる・コンプリートは セットごと・絵（SVG・id なし）・もちもの・シール・とうろく。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { IchibanKuji: K, Save: S, StickerBook: SB, KujiArt, KujiRotationArt: RA } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/, INK = R.INK || "#1F1D1B";
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && s.includes(INK);
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
let DAY = "2026-10-09";
R.U.today = () => DAY;
const fresh = (coins = 0) => { S.d = S.fresh(); S.d.coins = coins; K.next = null; K.dcNext = null; };

// ---- 1. セット ----
ok(K.STORES.every((s) => K.THEMES[s].length === 2 && K.THEMES[s][0].base && !K.THEMES[s][1].base && K.THEMES[s].every((T) => T.id === s && T.total === 80 && T.lineup.length === 24)), "みせごとに セット 2つ（まえからの ＋ あたらしい）・80まい・コンプリートは 24しゅ");
ok(Object.keys(K.THEME_BY).join() === "law,sev,law2,sev2", "セットの key " + Object.keys(K.THEME_BY));
for (const T of R.KUJI_ROTATION || []) ok(T, "x");
for (const s of K.STORES) {
  const [A0, A1] = K.THEMES[s], names0 = new Set(K.ITEMS.filter((it) => it.theme === A0.key).map((it) => it.name));
  const mine = K.ITEMS.filter((it) => it.theme === A1.key);
  ok(mine.length === 25 && mine.every((it) => it.id.startsWith(`kj_${A1.key}_`) && it.store === s && !it.net && !names0.has(it.name)), `${A1.title}: 25しゅ・id・まえの セットと なまえが ちがう`);
  ok(A1.title && !kanji.test(A1.title) && A1.title.startsWith(A1.shop + "の ") && A1.outfit && A1.outfit.head && A1.outfit.body && R.ITEM_INDEX[A1.outfit.head] && R.ITEM_INDEX[A1.outfit.body], `${A1.key}: なまえ・3人の ふく`);
  ok(A1.ids.H.filter((id) => K.INDEX[id].item).every((id) => R.BUY_SHOPS[s].items("goods").some((f) => f.id === K.INDEX[id].item)), `${A1.key}: クーポンは その みせの しなもの`);
}

// ---- 2. いつ いれかわるか（げつようびから 2しゅうかん）----
ok(K.PERIOD === 14 && K.EPOCH === "2026-10-05", "2しゅうかん ごと・2026-10-05 から");
const want = [["2026-10-05", 1], ["2026-10-09", 1], ["2026-10-18", 1], ["2026-10-19", 0], ["2026-11-01", 0], ["2026-11-02", 1], ["2026-11-16", 0], ["2026-9-30", 0], ["2027-1-4", 1], ["2027-1-11", 0]];
for (const [day, i] of want) ok(K.STORES.every((s) => K.themeNow(s, day) === K.THEMES[s][i]), `${day} は ${i ? "あたらしい" : "まえからの"} セット`);
ok(K.themeUntil("2026-10-09") === "2026-10-18" && K.themeUntil("2026-10-19") === "2026-11-1" && K.themeUntil("2026-11-1") === "2026-11-1", "いつまで " + K.themeUntil("2026-10-09"));

// ---- 3. ロット ----
fresh(20000);
ok(K.lot("lawson").th === "law2" && K.BY.lawson.key === "law2" && K.total("lawson") === 80, "あたらしい セーブは いまの セット（law2）");
K.next = "A"; let r = K.draw("lawson", 1);
ok(r && r.tickets[0].id === "kj_law2_a" && S.d.furn.kj_law2_a === 1 && K.got("kj_law2_a") === 1, "Aしょうは ナイトキャップ ごじ");
// ふるい セーブ（th が ない ロット）は まえからの セット → いまの きかんに なれば いれかわる（ひいた けいひんは のこる）
fresh(5000);
S.d.kuji = { lots: { lawson: { no: 4, left: { kj_law_a: 0 } } }, got: { kj_law_a: 1 } };
let L = K.lot("lawson");
ok(L.th === "law" && L.no === 4 && L.left.kj_law_a === 0, "ふるい ロットは まえからの セット");
K.sync("lawson"); L = K.lot("lawson");
ok(L.th === "law2" && L.no === 5 && L.fresh === DAY && K.total("lawson") === 80 && K.got("kj_law_a") === 1, "きかんが ちがえば あたらしい セットの ロットに（ばんごうは つづき・けいひんは のこる）");
// えらんで いない D〜Fしょうが ある ときは まつ
fresh(10000); DAY = "2026-10-18"; K.sync("sevenbun"); K.next = "D"; K.draw("sevenbun", 1);
ok(K.lot("sevenbun").th === "sev2" && K.pendingOf("sevenbun").length === 1, "D しょうを ひいて えらぶ まえ");
DAY = "2026-10-19"; K.sync("sevenbun");
ok(K.lot("sevenbun").th === "sev2" && K.pendingOf("sevenbun").length === 1, "えらんで いない ときは いれかわらない");
const pick = K.choices("sevenbun", "D")[0]; ok(pick.startsWith("kj_sev2_d") && K.choose("sevenbun", pick), "えらぶ（あたらしい セットの クッション）");
K.sync("sevenbun"); ok(K.lot("sevenbun").th === "sev" && K.BY.sevenbun.key === "sev" && K.lot("sevenbun").fresh === DAY, "えらんだら いれかわる");
// クーポンは まえの セットの ぶんも つかえる
fresh(0); DAY = "2026-10-09"; K.grant("kj_law2_h1"); DAY = "2026-10-20"; K.sync("lawson");
ok(K.BY.lawson.key === "law" && K.coupons("lawson").some((c) => c.id === "kj_law2_h1" && c.n === 1), "まえの セットの クーポンも のこる");
const tea = R.BAG_INDEX.cv_milktea, c = K.couponFor("lawson", tea);
ok(c && c.id === "kj_law2_h1" && c.use() && (S.d.bag.cv_milktea || 0) === 1 && !K.coupons("lawson").length, "ミルクティー むりょう けんで もらえる");
// コンプリートは セットごと（done の キーは law2）
fresh(0); DAY = "2026-10-09"; K.sync("lawson");
const T2 = K.THEMES.lawson[1];
for (const id of T2.lineup.slice(0, -1)) K.grant(id);
ok(!K.complete("lawson") && K.gotCount("lawson") === 23, "23しゅ では まだ");
const last = K.grant(T2.lastId);
ok(last.complete && K.complete("lawson") && K.st().done.law2 === DAY && !K.st().done.lawson, "あたらしい セットの 24しゅで コンプリート（done.law2）");
// セーブを なおす: th・fresh・done
const Q = K.clean({ lots: { lawson: { th: "sev2", no: 2 }, sevenbun: { th: "sev2", no: 3, fresh: "2026-10-9" } }, done: { law2: "2026-1-2", sev9: "2026-1-3" } });
ok(Q.lots.lawson.th === "law" && Q.lots.sevenbun.th === "sev2" && Q.lots.sevenbun.fresh === "2026-10-9" && JSON.stringify(Q.done) === '{"law2":"2026-1-2"}', "ちがう みせの セット・しらない done は なおす");
ok(S.SCHEMA === 2 && JSON.stringify(S.fresh().kuji || {}) === JSON.stringify(S.fresh().kuji || {}), "SCHEMA は 2 の まま");
// テストで セットを きめる（PokaDebug.kujiTheme）
fresh(0); DAY = "2026-10-09";
ok(K.setTheme("lawson", "law") && K.lot("lawson").th === "law" && (K.sync("lawson"), K.lot("lawson").th === "law") && !K.setTheme("lawson", "sev2"), "kujiTheme で きめた セットは いれかわらない・ちがう みせの セットは だめ");

// ---- 4. ゲームに いれる・絵 ----
for (const it of K.ITEMS.filter((x) => !x.net && !K.THEME_BY[x.theme].base)) {
  if (it.furn) {
    const f = R.FURN_INDEX[it.id];
    ok(f && f.exclusive === "kuji" && typeof R.FURN_ART[it.id] === "function", `${it.id}: 家具`);
    const svg = KujiArt.pic(it.id);
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    ok(svgOk(svg) && new Set(ids).size === ids.length && (["acsta", "chibi", "tapestry"].includes(it.kind) || !ids.length), `${it.id}: 絵（SVG・id は 3人の 絵の ぶん だけ・かさならない）`);
    ok(/2しゅうかん ごとに いれかわる/.test(K.source(it.id)), `${it.id}: ずかんの ヒント`);
  } else if (it.kind === "bag") {
    const w = R.ITEM_INDEX[it.id];
    ok(w && w.wear === "kuji_rbag" && w.col[0] === it.theme && w.col[1] === it.who && typeof R.WEAR.kuji_rbag === "function", `${it.id}: もちもの`);
  } else if (it.kind === "coupon") ok(svgOk(KujiArt.pic(it.id)) && R.KujiRotationArt.ART[it.id], `${it.id}: クーポンの 絵`);
  else if (it.kind === "sheet") ok(svgOk(KujiArt.pic(it.id)), `${it.id}: シートの 絵`);
}
for (const T of [K.THEMES.lawson[1], K.THEMES.sevenbun[1]]) {
  ok(T.stickers.length === 7 && T.stickers.every(([id, name]) => SB.INDEX[id] && SB.INDEX[id].name === name && svgOk(KujiArt.sticker(id)) && !/ id="/.test(KujiArt.sticker(id))), `${T.key}: シール 7しゅ（シールちょう・絵）`);
  for (const k of ["a", "b", "c", "l"]) ok(RA.PLUSH[`kj_${T.key}_${k}`], `${T.key}_${k}: ビッグ ぬいぐるみの 絵`);
}
// もちものの 絵（手に さげる）
{
  const hand = { x: 120, y: 120, side: 1 }, keep = R.HandItems.hand; R.HandItems.hand = () => hand;
  for (const col of [["law2", "wanko"], ["sev2", "goji"]]) { const o = R.WEAR.kuji_rbag({ col }); ok(o && typeof o.top === "string" && o.top.includes(INK) && !/NaN|undefined/.test(o.top), `ポーチ・トートの 絵 ${col}`); }
  R.HandItems.hand = keep;
}
// ---- 5. とうろく・がめん ----
{
  const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`js/${f}`);
  ok(at("kuji-art.js") < at("kuji-rotation.js") && at("kuji-rotation.js") < at("kuji-rotation-art.js") && at("kuji-rotation-art.js") < at("ichiban-kuji.js") && sw.includes('"./js/kuji-rotation.js"') && sw.includes('"./js/kuji-rotation-art.js"'), "index.html（kuji-art → kuji-rotation → kuji-rotation-art → ichiban-kuji）と sw.js");
  const ui = read("js/kuji-ui.js");
  ok(/K\.sync\(s\); Save\.write\(\);[^\n]*\n\s*const SO = K\.BY\[s\]/.test(ui) && ui.includes("rotaPart(L, today)") && ui.includes("K.themeUntil(today)") && ui.includes("K.themeOf(s,"), "くじの がめん: さきに すすめて から セット・いつまで・つぎの セット");
}
console.log(`✓ いちばんくじの いれかわる けいひん（UI-112）: ${n} 項目`);
