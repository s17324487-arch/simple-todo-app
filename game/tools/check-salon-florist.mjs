// びようしつ・おはなやさんの しなもの（js/salon-goods.js・js/florist-goods.js・UI-77）の 検査。ブラウザ なしで たしかめる。
// 1. びようしつ: リボン 6・ヘアアクセ 10（なまえは 漢字なし・その おみせ だけ・ねだん・あたまの くみあわせ・3人 × 4むき の 絵）
// 2. おはなやさん: はちうえ 6・はな・かざり 5（あたらしい うえきの かぐ 8: 立体・大きさ・さわる・しゅるいは みどり・その おみせ だけ）
// 3. ほかの おみせ（ようふく・かぐ）に まざらない・ずかんの ヒント・PokaDebug
import { gameContext } from "./game-context.mjs";

const R = gameContext(), SG = R.SalonGoods, FG = R.FloristGoods;
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/, clean = (s) => typeof s === "string" && s.length > 100 && !/NaN|undefined|Infinity/.test(s);
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. びようしつ ----
const G = R.BUY_SHOPS.groom;
ok(G && G.tabs.map((t) => t[1]).join() === "リボン,ヘアアクセ" && G.items("ribbon").length === 6 && G.items("acc").length === 10, "びようしつの タブ（リボン 6・ヘアアクセ 10）");
ok(G.items(undefined).length === 6 && /\bshop-goods\b/.test(G.cls) && G.hello.every((t) => !kanji.test(t)), "タブなしは リボン・なまえの おりかえし・あいさつ");
ok(SG.NEW.length === 14 && new Set(SG.NEW).size === 14, "あたらしい あたまの アクセは 14（リボン 4・ヘアアクセ 10）");
const KIND = { ribbon: "pin", salon_scrunchie: "pin", salon_flowerclip: "pin", salon_pompom: "pin", salon_cherrypin: "pin", salon_ribbonband: "band", salon_starband: "band" };
for (const id of SG.NEW) {
  const it = R.ITEM_INDEX[id];
  ok(it && R.WEAR_ITEMS.includes(it) && it.slot === "head" && typeof R.WEAR[it.wear] === "function", `${id}: あたまの 服として とうろく`);
  ok(!kanji.test(it.name + (it.desc || "")) && [...it.name].length <= 16, `${id}: なまえは 漢字なし・16もじ まで（${it.name}）`);
  ok(it.exclusive === "groom" && it.salonGoods && !it.rare && it.price >= 100 && it.price <= 400, `${id}: びようしつ だけ・ねだん ${it.price}`);
  ok(R.HeadPair.kind(id) === KIND[it.wear], `${id}: あたまの しゅるい ${R.HeadPair.kind(id)}`);
  for (const who of ["wanko", "gachan", "goji"]) for (const dir of ["down", "up", "left", "right"]) {
    const svg = R.Chara.svg(who, { outfit: { head: id }, dir });
    ok(clean(svg) && new Set(ids(svg)).size === ids(svg).length, `${id}: ${who} ${dir} の 絵`);
  }
  ok(clean(R.Art.iconSvg("wear", id)), `${id}: アイコン`);
}
// ピンどうしは はんたいがわに 2つ・カチューシャと ピンは いっしょ・カチューシャ どうしは だめ
ok(R.HeadPair.ok("salon_cherrypin", "salon_flowerclip_pink") && R.HeadPair.ok("salon_starband", "salon_scrunchie_pink") && !R.HeadPair.ok("salon_starband", "salon_ribbonband_red"), "あたまの くみあわせ");
const two = R.Chara.svg("gachan", { outfit: { head: "salon_flowerclip_yellow", head2: "salon_cherrypin" } });
ok(clean(two), "ピン 2つの 絵");
ok(["ribbon_pink", "ribbon_blue"].every((id) => G.items("ribbon").some((it) => it.id === id)), "まえからの リボン 2しゅも ならぶ");

// ---- 2. おはなやさん ----
const F = R.BUY_SHOPS.florist;
ok(F && F.tabs.map((t) => t[1]).join() === "はちうえ,はな・かざり" && F.items("pot").length === 6 && F.items("deco").length === 5, "おはなやさんの タブ（はちうえ 6・はな・かざり 5）");
ok(["plant", "plantshelf", "garland"].every((id) => FG.ids().includes(id)), "まえからの 3しゅも ならぶ");
ok(FG.IDS.length === 8 && new Set(FG.IDS).size === 8, "あたらしい うえきの かぐは 8");
for (const [id, name, base, w, depth, h] of FG.ITEMS) {
  const f = R.FURN_INDEX[id];
  ok(f && R.FURNITURE.includes(f) && f.kind === "floor" && f.w === w && f.depth === depth && f.h === h, `${id}: 家具として とうろく`);
  ok(!kanji.test(f.name + f.desc) && f.name === name, `${id}: なまえ・せつめいは 漢字なし`);
  ok(f.exclusive === "florist" && f.floristGoods && !f.rare && f.price === R.SlowLifePrices.price("furniture", base) && f.comfort >= 2, `${id}: おはなやさん だけ・ねだん ${f.price}・いごこち`);
  ok(R.FurnModels.has(id) && f.interactive === true, `${id}: 立体・さわる（FurnLive）`);
  const m = R.HomeDesign.model(id), m2 = R.HomeDesign.model(id, { flip: true });
  ok(m && [m.x, m.y, m.w, m.h].every(Number.isFinite) && m.footW === w && m.footD === depth && m2.footW === depth && clean(m.full) && clean(m2.full), `${id}: 立体の 大きさ・はんてん`);
  ok(new Set(ids(m.full)).size === ids(m.full).length, `${id}: 絵の id が かさならない`);
  ok(R.FurnTray.cats(f).has("plant"), `${id}: もようがえの しゅるいは みどり`);
}

// ---- 3. ほかの おみせ・ずかん ----
const all = (shop) => R.BUY_SHOPS[shop].tabs.flatMap(([k]) => R.BUY_SHOPS[shop].items(k)).map((it) => it.id);
ok(!all("clothes").some((id) => SG.NEW.includes(id)), "ようふくやさんに びようしつの アクセが まざらない");
ok(!all("furniture").some((id) => FG.IDS.includes(id)), "かぐやさんに うえきの かぐが まざらない");
ok(R.ItemDexSources.source("wear", R.ITEM_INDEX.salon_starband) === "びようしつで かえるよ。" && R.ItemDexSources.source("furn", R.FURN_INDEX.flo_bonsai) === "おはなやさんで かえるよ。", "ずかんの ヒント");
ok(SG.state().total === 16 && FG.state().total === 11, "PokaDebug 用の state");

if (bad.length) { console.error("✗ salon-florist:\n  " + bad.slice(0, 40).join("\n  ")); process.exit(1); }
console.log(`✓ salon-florist OK（${n} 項目）: びようしつ リボン 6・ヘアアクセ 10（あたらしい 14）／おはなやさん はちうえ 6・はな・かざり 5（あたらしい 8）`);
