// Meeときょれじゃ 3F の こういしつ（js/mee-fitting.js・js/mee-rental-wear.js）の 検査。ブラウザ なしで かしだしの いしょう・絵・
// きがえの あとの きろく・おみせを でる ときの かえしかた・ふるい セーブ・館の 配置を たしかめる。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { MeeRentalWear: MW, MeeFitting: MF, Save: S, ITEM_INDEX, WEAR_ITEMS, WEAR, Chara, SLOT_NAMES } = R;
R.UI.toast = () => {}; R.UI.updateHud = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;

// ---- 1. かしだしの いしょう 6しゅ（ITEM_INDEX だけ。ようふくやさん・ずかん・ふくの いちらんに でない）----
ok(MW.ITEMS.length === 6 && new Set(MW.IDS).size === 6, "いしょうは 6しゅ");
ok(MW.ITEMS.filter((it) => it.slot === "body").length === 4 && MW.ITEMS.filter((it) => it.slot === "head").length === 1 && MW.ITEMS.filter((it) => it.slot === "back").length === 1, "からだ 4・あたま 1・せなか 1");
for (const it of MW.ITEMS) {
  const w = ITEM_INDEX[it.id];
  ok(w && w.rental === true && w.exclusive === "rental" && w.price === 0 && w.rare === true && w.wear === it.id && typeof WEAR[w.wear] === "function" && SLOT_NAMES[w.slot], `${it.id}: ITEM_INDEX に とうろく`);
  ok(!WEAR_ITEMS.some((x) => x.id === it.id), `${it.id}: WEAR_ITEMS に いれない`);
  ok(it.name && !kanji.test(it.name) && it.name.length <= 10, `${it.id}: なまえ（ひらがな・カタカナ 10もじ まで）`);
  ok(it.desc && !kanji.test(it.desc) && it.desc.length <= 40, `${it.id}: せつめい`);
  ok(it.col.every((c) => /^#[0-9A-F]{6}$/i.test(c)), `${it.id}: いろ`);
}
ok(!R.ItemDex.catalog("wear").some((it) => MW.INDEX[it.id]), "ずかんに でない");
ok(!R.ShopRewards || !R.ShopRewards.prizes || !R.ShopRewards.prizes.some((p) => MW.INDEX[p.id]), "おてつだいの ごほうびに ない");

// ---- 2. 絵（3人 × 4むき・アイコン。NaN なし・id が かさならない）----
const idsOf = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
for (const id of MW.IDS) {
  const slot = ITEM_INDEX[id].slot;
  for (const who of Chara.IDS) for (const dir of ["down", "left", "right", "up"]) {
    const svg = Chara.svg(who, { outfit: { [slot]: id }, dir, pose: "idle_01", face: "happy" }), ids = idsOf(svg);
    ok(/^<svg /.test(svg) && !/NaN|undefined|Infinity/.test(svg), `${id}: ${who} ${dir} の 絵`);
    ok(new Set(ids).size === ids.length, `${id}: ${who} ${dir} の id が かさならない`);
  }
  const icon = R.Art.iconSvg("wear", id);
  ok(/^<svg /.test(icon) && !/NaN|undefined/.test(icon), `${id}: アイコン`);
}
{
  // 3つ いっしょに きても・2人 ならべても id が かさならない
  const full = { body: "mee_sailor", head: "mee_schoolhat", back: "mee_randoseru" };
  const a = Chara.svg("goji", { outfit: full, dir: "down" }), b = Chara.svg("wanko", { outfit: { body: "mee_yukata" }, dir: "up" }), ids = [...idsOf(a), ...idsOf(b)];
  ok(new Set(ids).size === ids.length && !/NaN/.test(a + b), "セーラーふく・ぼうし・ランドセルを いっしょに");
}

// ---- 3. きがえの きろくと おみせを でる ときの かえしかた ----
const reset = () => {
  S.d = S.fresh();
  for (const id of ["tshirt_red", "ribbon_pink", "dress", "backpack"]) S.d.wardrobe[id] = true;
  S.d.wardrobe.ribbon_pink = 2; // 服は 1こで 1人（UI-31）。したの おそろいで わんこと ごじが つける
  S.d.chars.wanko.outfit = { head: null, face: null, neck: null, body: "tshirt_red", back: null };
  S.d.chars.gachan.outfit = { head: null, face: null, neck: null, body: "dress", back: "backpack" };
  S.d.chars.goji.outfit = { head: null, face: null, neck: null, body: null, back: null };
};
const snap = () => Object.fromEntries(Chara.IDS.map((id) => [id, { ...S.d.chars[id].outfit }]));
reset();
ok(Object.keys(S.fresh().arcade.rental).length === 0, "あたらしい セーブの rental は からっぽ");
{
  let b = snap();
  S.d.chars.wanko.outfit.body = "mee_sailor"; S.d.chars.wanko.outfit.head = "mee_schoolhat"; S.d.chars.gachan.outfit.body = "mee_yukata"; S.d.chars.gachan.outfit.back = "mee_randoseru";
  MF.track(b);
  const r = S.d.arcade.rental;
  ok(r.wanko.body === "tshirt_red" && r.wanko.head === null && r.gachan.body === "dress" && r.gachan.back === "backpack" && !r.goji, "まえの ふくを おぼえる " + JSON.stringify(r));
  ok(MF.count() === 4, "かりて いる かず 4");
  // 2かいめ: セーラー → ブレザー（さいしょの ふくの まま）・ぼうし → じぶんの リボン（きろくを けす）
  b = snap();
  S.d.chars.wanko.outfit.body = "mee_blazer"; S.d.chars.wanko.outfit.head = "ribbon_pink";
  MF.track(b);
  ok(S.d.arcade.rental.wanko.body === "tshirt_red" && !("head" in S.d.arcade.rental.wanko), "かりなおしても さいしょの ふく・じぶんの ふくに したら きろくを けす");
  // おそろい（ごじに コピー）: きろくが なくても かえす
  b = snap();
  S.d.chars.goji.outfit = { ...S.d.chars.wanko.outfit };
  MF.track(b);
  ok(S.d.arcade.rental.goji && S.d.arcade.rental.goji.body === null, "おそろいで かりた ふくは まえが なし");
  const back = MF.giveBack();
  const w = S.d.chars.wanko.outfit, g = S.d.chars.gachan.outfit, z = S.d.chars.goji.outfit;
  ok(back === 4 && w.body === "tshirt_red" && w.head === "ribbon_pink" && g.body === "dress" && g.back === "backpack" && z.body === null && z.head === "ribbon_pink", "おみせを でると もとの ふくに もどる " + JSON.stringify([back, w, g, z]));
  ok(Object.keys(S.d.arcade.rental).length === 0 && MF.count() === 0 && MF.giveBack() === 0, "かえした あとは なにも ない");
}
{
  // まえの ふくを もう もって いない ときは なし・セーブの こわれた rental は なおす
  reset();
  const b = snap(); S.d.chars.wanko.outfit.body = "mee_gym"; MF.track(b);
  delete S.d.wardrobe.tshirt_red;
  ok(MF.giveBack() === 1 && S.d.chars.wanko.outfit.body === null, "もって いない ふくには もどさない");
  S.d.arcade.rental = "x"; ok(typeof MF.st() === "object" && !Array.isArray(MF.st()), "こわれた rental");
  S.d.arcade.rental = [1]; ok(!Array.isArray(MF.st()), "こわれた rental（はいれつ）");
  // きろくが こわれて いても かりた いしょうは かえす
  S.d.chars.gachan.outfit.body = "mee_yukata"; S.d.arcade.rental = { gachan: { body: "armor" } };
  ok(MF.giveBack() === 1 && S.d.chars.gachan.outfit.body === null, "もって いない まえの ふく（armor）には もどさない");
}
{
  // 1こで 1人（UI-31）: まえの ふくを いまは ほかの 人が つかって いて のこりが なければ もどさない・2こ あれば もどす
  reset();
  let b = snap(); S.d.chars.wanko.outfit.body = "mee_gym"; MF.track(b); S.d.chars.goji.outfit.body = "tshirt_red";
  ok(MF.giveBack() === 1 && S.d.chars.wanko.outfit.body === null && S.d.chars.goji.outfit.body === "tshirt_red", "のこりが ない まえの ふくには もどさない");
  reset(); S.d.wardrobe.tshirt_red = 2;
  b = snap(); S.d.chars.wanko.outfit.body = "mee_gym"; MF.track(b); S.d.chars.goji.outfit.body = "tshirt_red";
  ok(MF.giveBack() === 1 && S.d.chars.wanko.outfit.body === "tshirt_red" && S.d.chars.goji.outfit.body === "tshirt_red", "2こ あれば まえの ふくに もどす");
}
{
  // ぜんぶ もって いる とき（PokaDebug）は かしだしに しない
  reset(); S.d.wardrobe.mee_sailor = true; S.d.chars.wanko.outfit.body = "mee_sailor";
  ok(!MF.isRental("mee_sailor") && MF.count() === 0 && MF.giveBack() === 0 && S.d.chars.wanko.outfit.body === "mee_sailor", "もって いる ふくは かえさない");
}
{
  // ふるい セーブ（rental が ない）は migrate が おぎなう
  const old = S.fresh(); delete old.arcade.rental; const d = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(d.arcade && d.arcade.rental && typeof d.arcade.rental === "object", "ふるい セーブに rental");
}
// ---- 4. 町・おうちに でる ときに かえす（WorldScene・HouseScene の enter）----
// （enter の なかみは ブラウザが いるので、とちゅうで おちても よい。かえすのは さいしょ）
for (const [name, Sc, p] of [["町", R.WorldScene, { map: "city" }], ["おうち", R.HouseScene, {}]]) {
  reset(); const b = snap(); S.d.chars.wanko.outfit.body = "mee_sailor"; MF.track(b);
  try { const r = Sc.prototype.enter.call(Object.create(Sc.prototype), p); if (r && typeof r.catch === "function") r.catch(() => {}); } catch (e) { /* ブラウザが ない */ }
  ok(MF.count() === 0 && S.d.chars.wanko.outfit.body === "tshirt_red", `${name}に はいる ときに かえす`);
}

// ---- 5. 館の 配置: 3F に こういしつ と かしだしの ラック（しらべると きがえ）----
const fl = R.VenueHalls.defs.arcade.floors;
const walk = (r, [x, y]) => !R.IsoVenue.solidAt(r, x, y) && !r.fixtures.some((f) => !f.walk && !f.over && f.kind !== "hangsign" && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
{
  const fit = fl[3].fixtures.filter((f) => f.action === "fitting");
  ok(fit.length === 2 && fit.some((f) => f.kind === "fitting" && f.label === "こういしつ") && fit.some((f) => f.kind === "costumerack" && f.label === "かしだし いしょう"), "3F に こういしつ と かしだしの ラック");
  ok(fit.every((f) => f.spots && f.spots.length && f.spots.every((p) => walk(fl[3], p))), "しらべる ところに たてる");
  ok(!fl[1].fixtures.some((f) => f.action === "fitting") && !fl[2].fixtures.some((f) => f.action === "fitting"), "1F・2F には ない");
  ok(fl[3].zones.some((z) => z.shop === "arcFitting") && fl[3].zones.some((z) => z.shop === "arcRental") && R.MallArt.SHOP.arcFitting && R.MallArt.SHOP.arcRental, "フロアマップの コーナー");
  for (const f of fit) { const k = R.ArcadeArt.modelKey ? R.ArcadeArt.modelKey(f) : ""; ok(!/NaN|undefined/.test(k), `${f.kind} の キー`); }
}
console.log(`Mee fitting room: 6 rental costumes (ITEM_INDEX only, not in shops or the item dex), art for 3 characters × 4 directions, remember and restore outfits when leaving, old saves, 3F fitting room and rack — ${n} checks OK`);
