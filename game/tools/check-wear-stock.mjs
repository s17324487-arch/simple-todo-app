// 服の かず（js/wear-stock.js・UI-31「1アイテム1人まで」）の 検査。ブラウザ なしで かず・つかう 人・わたす・セーブの なおし・
// おみせ／ガチャ／もらいもの／おまつり／コラボ／ぱぱ・まま／こういしつ／ずかん／PokaDebug を たしかめる。
import { gameContext } from "./game-context.mjs";

const R = gameContext(), S = R.Save, W = R.WearStock;
R.UI.updateHud = () => {}; // ブラウザ なし（HUD が ない）
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const fresh = () => { S.d = S.fresh(); return S.d; };
const kids = ["wanko", "gachan", "goji"];

// ---- 1. かず（true は 1こ・かずは 5こ まで・こわれた あたいは 0）----
{
  const d = fresh();
  ok(W.CAP === 5, "CAP は 5（3人 ＋ ぱぱ・まま）");
  ok(d.wardrobe.ribbon_pink === true && W.count("ribbon_pink") === 1, "まえからの true は 1こ");
  d.wardrobe.x1 = 3; d.wardrobe.x2 = "3"; d.wardrobe.x3 = -2; d.wardrobe.x4 = 9; d.wardrobe.x5 = 2.7; d.wardrobe.x6 = NaN;
  ok(W.count("x1") === 3 && W.count("x2") === 0 && W.count("x3") === 0 && W.count("x4") === 5 && W.count("x5") === 2 && W.count("x6") === 0 && W.count("nope") === 0, "こわれた かずは 0・5こ より おおくは 5");
  ok(W.set("x1", 1) === 1 && d.wardrobe.x1 === true, "1こは true で のこす（ふるい ゲームでも よめる）");
  ok(W.set("x1", 0) === 0 && !("x1" in d.wardrobe), "0こは けす");
  ok(W.add("tshirt_red", 2) === 2 && d.wardrobe.tshirt_red === 3 && W.room("tshirt_red") === 2, "2こ たして 3こ・あと 2こ");
  ok(W.add("tshirt_red", 9) === 2 && d.wardrobe.tshirt_red === 5 && W.room("tshirt_red") === 0 && W.add("tshirt_red", 1) === 0, "5こ より おおくは ふえない");
  ok(W.add("dress", 1) === 1 && d.wardrobe.dress === true, "はじめての 1こは true");
}

// ---- 2. つかう 人・のこり・わたす（3人と ぱぱ・まま）----
{
  const d = fresh();
  ok(W.wearers("ribbon_pink").length === 0 && W.free("ribbon_pink", "wanko") === 1, "だれも つかって いない");
  let r = W.put("wanko", "head", "ribbon_pink");
  ok(r.ok && !r.from && d.chars.wanko.outfit.head === "ribbon_pink", "のこりが あれば つける");
  ok(W.wearers("ribbon_pink").join() === "wanko" && W.free("ribbon_pink", "wanko") === 1 && W.free("ribbon_pink", "gachan") === 0, "わんこの 1こは わんこの ぶん");
  ok(!W.can("ribbon_pink", "gachan") && W.holder("ribbon_pink", "gachan") === "wanko", "がちゃんは つけられない（わんこが つかって いる）");
  const bd = W.badge("ribbon_pink", "gachan");
  ok(bd.n === 1 && bd.from === "wanko" && bd.text === "わんこが つかってる" && !W.badge("ribbon_pink", "wanko").from, "カードの ふだ（つかって いる 人）");
  r = W.put("gachan", "head", "ribbon_pink");
  ok(r.ok && r.from === "wanko" && d.chars.gachan.outfit.head === "ribbon_pink" && d.chars.wanko.outfit.head === null, "わたす（わんこは はずれる）");
  ok(W.wearers("ribbon_pink").join() === "gachan", "いまは がちゃん だけ");
  // ぱぱ・まま も かぞえる
  W.add("ribbon_pink", 1);
  r = W.put("papa", "head", "ribbon_pink");
  ok(r.ok && !r.from && d.parents.papa.equipment.head === "ribbon_pink" && W.wearers("ribbon_pink").join() === "gachan,papa", "ぱぱも 1こ つかう");
  ok(!W.can("ribbon_pink", "goji") && !W.can("ribbon_pink", "mama"), "2こ とも つかって いる");
  ok(!R.ParentWardrobe.equip("mama", "head", "ribbon_pink") && d.parents.mama.equipment.head === null, "ままは つけられない（ParentWardrobe.equip）");
  W.add("ribbon_pink", 1);
  ok(R.ParentWardrobe.equip("mama", "head", "ribbon_pink") && W.wearers("ribbon_pink").join() === "gachan,papa,mama", "3こ あれば ままも");
  ok(W.put("gachan", "head", null).ok && d.chars.gachan.outfit.head === null && W.free("ribbon_pink", "goji") === 1, "はずすと 1こ あく");
  ok(!W.put("goji", "head", "crown").ok && d.chars.goji.outfit.head === null, "もって いない 服は つけられない");
  ok(!W.put("nobody", "head", "ribbon_pink").ok, "しらない 人");
}

// ---- 3. セーブ: SCHEMA 2・ふるい セーブ（1こを みんなで きて いた）は きて いる 人の かずに・いまの みためは かわらない ----
{
  ok(S.SCHEMA === 2 && S.fresh().v === 2, "SCHEMA 2");
  const old = S.fresh(); old.v = 1;
  old.wardrobe = { ribbon_pink: true, tshirt_red: true, scarf_green: true, crown: true, dress: 2 };
  for (const id of kids) old.chars[id].outfit = { head: "ribbon_pink", face: null, neck: null, body: id === "goji" ? "dress" : null, back: null };
  old.chars.wanko.outfit.neck = "scarf_green";
  old.parents.papa.equipment.head = "ribbon_pink";
  old.chars.gachan.outfit.body = "mee_sailor"; // かしだし（もって いない）は かず に いれない
  const before = JSON.stringify({ chars: old.chars, parents: old.parents });
  const m = S.migrate(JSON.parse(JSON.stringify(old)));
  ok(m.v === 2 && m.wardrobe.ribbon_pink === 4, "1こを 4人 → 4こ " + JSON.stringify(m.wardrobe));
  ok(m.wardrobe.scarf_green === true && m.wardrobe.tshirt_red === true && m.wardrobe.crown === true && m.wardrobe.dress === 2, "ほかの 服は そのまま");
  ok(!("mee_sailor" in m.wardrobe), "かしだしの いしょうは もちものに しない");
  ok(JSON.stringify({ chars: m.chars, parents: m.parents }) === before, "みためは かわらない");
  ok(JSON.stringify(S.migrate(JSON.parse(JSON.stringify(m)))) === JSON.stringify(m), "なんど migrate しても おなじ");
  // 5人 ぜんいん → 5こ
  const all = JSON.parse(JSON.stringify(old)); all.parents.mama.equipment.head = "ribbon_pink";
  ok(S.migrate(all).wardrobe.ribbon_pink === 5, "5人 → 5こ");
  // SCHEMA 2 の セーブは なおさない（つかう 人の かずは ゲームが まもる）
  const v2 = JSON.parse(JSON.stringify(old)); v2.v = 2;
  ok(S.migrate(v2).wardrobe.ribbon_pink === true, "SCHEMA 2 の セーブは かえない");
  // v1.0.0 の セーブ（parents が ない）
  const v1 = JSON.parse(JSON.stringify(old)); delete v1.parents; v1.v = undefined;
  const m1 = S.migrate(v1);
  ok(m1.wardrobe.ribbon_pink === 3 && m1.parents && m1.parents.papa.equipment.head === null, "parents の ない ふるい セーブ（3人 → 3こ）");
  ok(S.repairWear({}) === 0 && S.repairWear({ wardrobe: "x" }) === 0, "こわれた セーブでも とまらない");
}

// ---- 4. もらいもの・おまつり・コラボ・ガチャ ----
{
  const d = fresh();
  let t = R.Loot.give({ wear: "crown" });
  ok(W.count("crown") === 1 && /てにいれた/.test(t), "はじめての 服 " + t);
  const c0 = d.coins; t = R.Loot.give({ wear: "crown" });
  ok(W.count("crown") === 2 && d.coins === c0 && /もう 1こ/.test(t) && /2にんで/.test(t), "2こめ " + t);
  W.set("crown", 5); t = R.Loot.give({ wear: "crown" });
  ok(W.count("crown") === 5 && d.coins === c0 + 60 && /5こ もっている/.test(t), "5こ もって いたら コイン " + t);
  // コラボ（ころころ・パズル）の 服は 1こ
  const L = R.CollabGoods.LINES.puzzle, wear = L && L.items.find((it) => it.kind === "wear");
  if (ok(!!wear, "コラボの 服が ない")) { R.CollabGoods.give(wear); ok(W.count(wear.id) === 1, "コラボの 服は 1こ"); R.CollabGoods.give(wear); ok(W.count(wear.id) === 2, "もう いちど もらえば 2こ"); }
  // ガチャ: ダブりは 5こ まで
  d.coins = 5000; R.Gacha.next = 0; const g1 = R.Gacha.spin(4, 0.1); R.Gacha.next = 0; const g2 = R.Gacha.spin(4, 0.1);
  ok(g1 && g2 && g1.copies === 1 && g2.copies === 2 && !g2.refund && W.count(g1.item.id) === 2, "ガチャの ダブりは 2こめ");
}

// ---- 5. おみせ・ずかん・こういしつ ----
{
  const d = fresh();
  const it = R.ITEM_INDEX.tshirt_red;
  ok(R.ShopUI.owned("wear", it) === 1, "おみせの もって いる かず（1こ）");
  W.add("tshirt_red", 2); ok(R.ShopUI.owned("wear", it) === 3, "おみせの もって いる かず（3こ）");
  const dex = R.ItemDex.owned("wear", d);
  ok(dex.tshirt_red === 3 && dex.ribbon_pink === 1 && !dex.crown, "ずかんの かず");
  d.chars.goji.outfit.body = "mee_sailor"; ok(R.ItemDex.owned("wear", d).mee_sailor === 1 || !("mee_sailor" in R.ItemDex.owned("wear", d)), "かしだしは ずかんの そと（または 1）");
  // こういしつ: まえの ふくを ほかの 人が つかって いれば もどさない（くわしくは check-fitting.mjs）
  fresh(); S.d.chars.wanko.outfit.body = "tshirt_red";
  const b = Object.fromEntries(kids.map((id) => [id, { ...S.d.chars[id].outfit }]));
  S.d.chars.wanko.outfit.body = "mee_gym"; R.MeeFitting.track(b); S.d.chars.gachan.outfit.body = "tshirt_red";
  ok(R.MeeFitting.giveBack() === 1 && S.d.chars.wanko.outfit.body === null && S.d.chars.gachan.outfit.body === "tshirt_red", "こういしつを でても 1こを 2人に しない");
}

// ---- 6. PokaDebug（unlockAll は 5こずつ・wearStock・wearSet）----
{
  fresh(); R.PokaDebug.unlockAll();
  ok(R.WEAR_ITEMS.every((w) => W.count(w.id) === 5), "unlockAll は 5こずつ");
  const st = R.PokaDebug.wearSet("ribbon_pink", 2);
  ok(st.count === 2 && st.raw === 2 && st.room === 3 && st.cap === 5 && st.wearers.length === 0, "wearSet / wearStock " + JSON.stringify(st));
  W.put("goji", "head", "ribbon_pink"); ok(R.PokaDebug.wearStock("ribbon_pink").wearers.join() === "goji", "wearStock の つかう 人");
  let threw = false; try { R.PokaDebug.wearStock("nope"); } catch (e) { threw = true; } ok(threw, "しらない 服は エラー");
}

// ---- 7. ことば（漢字なし・ひらがな）----
{
  const src = ["js/wear-stock.js", "js/dressup.js", "js/parent-wardrobe.js", "js/shop.js", "js/talk.js", "js/item-dex.js", "js/gacha.js"];
  const { readFileSync } = await import("node:fs");
  const texts = [];
  for (const f of src) { const s = readFileSync(new URL("../" + f, import.meta.url), "utf8"); for (const m of s.matchAll(/[`"']([^`"'\n]*(?:1こで|つかって いる|つかってる|わたす|こめ！|もう 1こ)[^`"'\n]*)[`"']/g)) texts.push([f, m[1]]); }
  ok(texts.length >= 8, "ことばが みつからない " + texts.length);
  for (const [f, t] of texts) ok(!/[一-鿿]/.test(t.replace(/\$\{[^}]*\}/g, "")), `${f}: ことばに 漢字「${t}」`);
}

if (bad.length) { console.error(`✗ wear stock: ${bad.length} 件（${n} 項目中）`); for (const b of bad) console.error("  - " + b); process.exit(1); }
console.log(`Wear stock: one copy per wearer (3 children + papa + mama, up to 5), true = 1 copy, move between wearers, SCHEMA 2 migration keeps every outfit, shop/gacha/loot/collab copies, parents, fitting room, item dex, PokaDebug — ${n} checks OK`);
