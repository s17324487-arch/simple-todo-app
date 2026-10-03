// おてつだいの ごほうび 48こ（js/shop-rewards.js・js/shop-reward-art.js・UI-38。あたまの たいそうの 4こは UI-64）の 検査。ブラウザ なしで たしかめる。
// id は まえの まま（セーブの うけとりの きろく）・なまえと せつめいは ひらがな・おみせごとに ちがう 立体（はんてん・live）・
// さわる うごき（FurnLive）・live で ぬく ぶぶんが ある ものだけ live・いごこちは レベルで ふえる・ベッド・もようがえの しゅるい・ずかんの ヒント。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { ShopRewards: SR, ShopRewardArt, FURN_INDEX, FURNITURE, FURN_ART, HomeDesign, FurnLive, FurnModels, SHOPS, ItemDexSources, BUY_SHOPS } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const norm = (svg) => svg.replace(/\bid="[^"]+"|url\(#[^)]+\)|href="#[^"]+"/g, "");
const SHOP_IDS = ["burger", "groom", "cake", "crepe", "dentist", "bakery", "florist", "relay", "korokoro", "gasstand", "postoffice", "brain"];

// ---- 1. id・かず（まえの セーブの うけとりの きろくが そのまま つかえる）----
ok(Object.keys(SR.themes).join() === SHOP_IDS.join() && Object.keys(SR.ITEMS).join() === SHOP_IDS.join(), "おみせ 12");
const want = SHOP_IDS.flatMap((s) => [5, 10, 15, 30].map((lv) => `shop_${s}_${lv}`));
ok(SR.prizes.map((p) => p.id).join() === want.join(), "id は shop_<おみせ>_<レベル> の 48こ（まえの 44こは まえの まま）");
ok(SR.levels.join() === "5,10,15,30" && SR.COMFORT.join() === "5,7,9,12", "レベル と いごこち");
const names = new Set();
for (const p of SR.prizes) {
  const f = FURN_INDEX[p.id], row = SR.ITEMS[p.shop][SR.levels.indexOf(p.level)];
  ok(f && FURNITURE.includes(f) && f.kind === "floor" && f.price === 0 && f.rare && f.shopPrize && f.interactive, `${p.id}: 非売品の ゆかの 家具・さわれる`);
  ok(!BUY_SHOPS.furniture.items("floor").some((x) => x.id === p.id), `${p.id}: かぐやで うって いない`);
  ok(p.name === row[0] && f.name === row[0] && f.desc === row[1] && f.w === row[2] && f.depth === row[3] && f.h === row[4], `${p.id}: データの ならび`);
  ok(!kanji.test(f.name) && f.name.length <= 15 && !kanji.test(f.desc) && f.desc.length <= 30 && /[。！]$/.test(f.desc), `${p.id}: なまえ・せつめいは ひらがなで みじかく（${f.name} / ${f.desc}）`);
  ok(!names.has(f.name) && FURNITURE.filter((x) => x.name === f.name).length === 1, `${p.id}: なまえが ほかの 家具と かぶらない（${f.name}）`);
  names.add(f.name);
  ok(f.comfort === SR.COMFORT[SR.levels.indexOf(p.level)], `${p.id}: いごこち ${f.comfort}`);
  ok(f.w >= 30 && f.w <= 170 && f.depth >= 30 && f.depth <= 115 && f.h >= 36 && f.h <= 240, `${p.id}: 大きさ ${f.w}×${f.depth}×${f.h}`);
  ok(Array.isArray(f.cat) ? f.cat.length : typeof f.cat === "string", `${p.id}: もようがえの しゅるい（cat）`);
  ok(/おてつだいで レベル \d+に すると もらえるよ/.test(ItemDexSources.source("furn", f)) && ItemDexSources.source("furn", f).startsWith(SHOPS[p.shop].name), `${p.id}: ずかんの ヒント`);
}
// レベルが あがるほど 大きく（Lv30 は いちばん 大きい）
for (const s of SHOP_IDS) {
  const vol = SR.prizes.filter((p) => p.shop === s).map((p) => { const f = FURN_INDEX[p.id]; return f.w * f.depth * f.h; });
  ok(vol[3] === Math.max(...vol) && vol[0] === Math.min(...vol), `${s}: Lv5 が いちばん ちいさく Lv30 が いちばん 大きい`);
}
// ベッド（ショートケーキ・くるま）は ねられる
for (const id of ["shop_cake_30", "shop_gasstand_15"]) ok(FURN_INDEX[id].sleep === 2, `${id}: ベッド（sleep 2）`);
ok(SR.prizes.filter((p) => FURN_INDEX[p.id].sleep).length === 2, "ベッドは 2つ");
// もようがえの しゅるい: あかりは 6・すわる／ねる も ある
const cats = {};
for (const p of SR.prizes) for (const c of [].concat(FURN_INDEX[p.id].cat)) cats[c] = (cats[c] || 0) + 1;
ok(cats.light === 6 && cats.sit === 16 && cats.table === 11 && cats.toy === 5 && cats.plant === 2 && cats.misc === 8, "しゅるい " + JSON.stringify(cats));
if (R.FurnTray) for (const p of SR.prizes) { const c = R.FurnTray.cats(FURN_INDEX[p.id]); ok(c.has("special") && [].concat(FURN_INDEX[p.id].cat).every((k) => c.has(k)), `${p.id}: もようがえの 一覧で しゅるい と とくべつ`); }

// ---- 2. 立体（FurnModels）: おみせごとに ちがう・はんてん・live・id ----
ok(ShopRewardArt && ShopRewardArt.ids.join() === want.join(), "ShopRewardArt の 立体 48");
const seen = new Map();
for (const p of SR.prizes) {
  const id = p.id;
  ok(FurnModels.has(id), `${id}: FurnModels に とうろく`);
  const a = HomeDesign.model(id), b = HomeDesign.model(id, { flip: true }), lv = HomeDesign.model(id, { live: true }), lvf = HomeDesign.model(id, { live: true, flip: true });
  for (const [k, m] of [["ふつう", a], ["はんてん", b], ["live", lv], ["live はんてん", lvf]]) {
    ok(m.w > 0 && m.h > 0 && Number.isFinite(m.x) && Number.isFinite(m.y) && !/NaN|undefined|Infinity/.test(m.full), `${id}: ${k} の 絵`);
    const list = ids(m.full); ok(new Set(list).size === list.length, `${id}: ${k} の id が かさならない`);
  }
  ok(a.full.length > 1500 && a.full.length < 120000, `${id}: 絵の こまかさ（${a.full.length}）`);
  ok(a.full !== b.full, `${id}: はんてんで かわる`);
  ok(FURN_ART[id]() === a.full, `${id}: アイコンも 立体`);
  // 絵が ほかの ごほうびと かぶらない（id の ちがいは みない）
  const key = norm(a.full);
  ok(!seen.has(key), `${id}: ${seen.get(key)} と おなじ 絵`);
  seen.set(key, id);
  // live の とき うごく ぶぶんを ぬく ものだけ live に する（ぬかないのに live だと 絵が かわらない）
  ok(FurnLive.LIVE.has(id) === (norm(lv.full) !== key), `${id}: live の とうろく と 絵の ぬきかた`);
  ok(lv.w === a.w && lv.h === a.h && lv.x === a.x && lv.y === a.y, `${id}: live でも 絵の わくは おなじ`);
}
const LIVE = SR.prizes.map((p) => p.id).filter((id) => FurnLive.LIVE.has(id));
ok(LIVE.join() === "shop_burger_30,shop_groom_5,shop_florist_30,shop_relay_30,shop_gasstand_10,shop_gasstand_30,shop_postoffice_30", "live（ネオンの カップ・サインポール・ブランコ・プロペラ・メーター・ミニカー・とけいと かね）: " + LIVE.join());

// ---- 3. さわる（FurnLive）: タップの あとの ようす ----
R.UI.toast = () => {};
const tapped = { on: 0, n: 0 };
const fake = { s: 1, chars: [], anchor: () => ({ x: 0, y: 0 }), react: () => {} };
for (const p of SR.prizes) {
  const it = { uid: 900 + SR.prizes.indexOf(p), id: p.id, x: 240, y: 470, flip: false };
  const before = FurnLive.state(it);
  ok(FurnLive.tap(fake, it), `${p.id}: タップで うごく`);
  const after = FurnLive.state(it);
  ok(after.t >= 0 && after.t < 1 && (after.on !== before.on || after.n === before.n + 1), `${p.id}: タップで ようすが かわる`);
  if (after.on !== before.on) tapped.on++; else tapped.n++;
}
ok(tapped.on === 9 && tapped.n === 39, `あかりが つく・きえる 9（ポテト・ネオン・かがみの ライト・カップケーキ・ショーケース・ききゅう・ぶどう・きゅうゆき・ちきゅうぎ）: ${JSON.stringify(tapped)}`);

// ---- 4. がめんの ことば（ひらがな）----
const src = readFileSync(new URL("../js/shop-reward-art.js", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
const lines = [...src.matchAll(/"([^"\n]*[ぁ-んァ-ヶ][^"\n]*)"/g)].map((m) => m[1]);
ok(lines.length >= 120, `さわった ときの ことば ${lines.length}`);
for (const l of lines) ok(!kanji.test(l) && l.length <= 18, `ことば ${l}`);
const srs = readFileSync(new URL("../js/shop-rewards.js", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
for (const m of srs.matchAll(/(?:text|"aria-label"):\s*["`]([^"`]+)["`]/g)) ok(!kanji.test(m[1].replace(/\$\{[^}]+\}/g, "")), `ごほうびの がめんの ことば ${m[1]}`);
ok(/さわると うごく/.test(srs), "ごほうびの がめんで さわると うごく ことを いう");

// ---- 素材プレビュー（tools/preview.html）でも 描ける ----
// プレビューは index.html の 一部の js だけを よむ。ごほうびの 立体（shop-reward-art.js）を よまないと、
// かぐの 絵で ShopRewardArt が みつからず ページが とまる（スモーク「落ち葉・背景に固定」が まつ 見出しが でない）。
const pv = [...readFileSync(new URL("./preview.html", import.meta.url), "utf8").matchAll(/<script src="\.\.\/(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
for (const f of ["js/furniture-models.js", "js/furniture-live.js", "js/shop-rewards.js", "js/shop-reward-art.js"]) ok(pv.includes(f), `プレビューが ${f} を よむ`);
ok(pv.indexOf("js/shop-reward-art.js") > Math.max(pv.indexOf("js/shop-rewards.js"), pv.indexOf("js/furniture-live.js")), "プレビューは shop-rewards.js・furniture-live.js の あとに shop-reward-art.js");
{
  const noop = () => {}, el = () => ({ style: {}, append: noop, addEventListener: noop, getContext: () => null, setAttribute: noop, dataset: {} });
  const P = { console: { log: noop, warn: noop, error: noop, info: noop }, performance, setTimeout, clearTimeout, URL, location: { search: "" }, document: { getElementById: el, createElement: el, addEventListener: noop }, addEventListener: noop };
  P.window = P;
  vm.createContext(P);
  for (const f of pv) vm.runInContext(readFileSync(new URL("../" + f, import.meta.url), "utf8"), P, { filename: f });
  const bad = vm.runInContext("FURNITURE.filter((f) => { try { return !/<svg/.test(Art.furnSvg(f.id)); } catch { return true; } }).map((f) => f.id)", P);
  ok(!bad.length, "プレビューで 描けない かぐ: " + bad.join(" "));
  ok(vm.runInContext("ShopRewards.prizes.every((p) => /<svg/.test(ShopRewardArt.model(p.id).full))", P), "プレビュー（?shop-rewards）で 48こ とも 描ける");
}

console.log(`✓ shop rewards: ${n} checks（12 おみせ × 4・live ${LIVE.length}・あかり ${tapped.on}・ことば ${lines.length}）`);
