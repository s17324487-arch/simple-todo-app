// サンシャインいけぶの フードコートと マルシェの たべもの（js/mall-food.js・UI-78）の 検査。ブラウザ なしで たしかめる。
// 1. メニュー: すばーたっくす・でぃっぱーどん・たぴ は 6しゅずつ（まえからの 3 ＋ あたらしい 3）・3F の マルシェは 3
// 2. なまえ・せつめいは 漢字なし・まえからの ねだんは そのまま・あたらしい たべものの ねだん・おなか・ごきげん・デザの しるし・池袋 だけ
// 3. 絵 21しゅ（SVG の かけら・id なし・INK の せん・あとから 上がき されない・ぜんぶ ちがう）
// 4. メニューの まど（ちいさな 絵・ねだんは まるごと おりかえす・44px）・「やめておく」で もどる・館の たべものの メニューは ぜんぶ 絵が ある
// 5. いっしょに たべても「たべたい」の おねがいが かなう（クレープ 6しゅ）・PokaDebug
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext(), M = R.MallFood;
let n = 0; const bad = [];
const ok = (c, m) => { n++; if (!c) bad.push(m); return !!c; };
const kanji = /[一-鿿]/;
const fragOk = (s) => typeof s === "string" && s.length > 150 && !/NaN|undefined|null|Infinity/.test(s) && !/\sid="/.test(s) && s.includes(R.INK || "#1F1D1B");
const tagsBalanced = (s) => { const open = (s.match(/<(g|svg)\b/g) || []).length, close = (s.match(/<\/(g|svg)>/g) || []).length; return open === close; };
const src = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// ---- 1. メニュー ----
const groups = R.IkebukuroCatalog.groups;
for (const shop of ["cafe", "crepes", "boba"]) {
  const g = groups[shop] || [];
  ok(g.length === 6 && new Set(g).size === 6, `${shop}: メニューは 6しゅ（${g.join()}）`);
  ok([0, 1, 2, 3, 4, 5].every((i) => g[i] === `ike_${shop}_${i}`), `${shop}: まえからの 3しゅの あとに あたらしい 3しゅ`);
}
ok((groups.marche || []).join() === "ike_marche_0,ike_marche_1,ike_marche_2", "マルシェは 3しゅ の まま");
ok(M.NEW.length === 9 && M.REDRAWN.length === 12 && Object.keys(M.ART).length === 21, "あたらしい 9しゅ・かきなおし 12しゅ・絵 21しゅ");

// ---- 2. なまえ・ねだん・おなか ----
for (const id of [...M.REDRAWN, ...M.NEW]) {
  const f = R.BAG_INDEX[id], F = R.FOODS.find((x) => x.id === id);
  ok(f && F && f.kind === "food" && f.name === F.name && f.desc === F.desc, `${id}: もちもの と FOODS が そろう`);
  ok(!kanji.test(f.name + f.desc) && [...f.name].length <= 14 && f.desc.length >= 8, `${id}: なまえ・せつめいは 漢字なし（${f.name}／${f.desc}）`);
  ok(f.exclusive === "ikebukuro" && !f.rare, `${id}: 池袋 だけ`);
  ok(f.mood >= R.FoodBalance.moodFloor(f.price) && f.hunger > 0, `${id}: ごきげんは ねだんの したの ほう いじょう（${f.price} → ${f.mood}）`);
}
for (const id of M.REDRAWN) {
  const i = Number(id.at(-1)), f = R.BAG_INDEX[id];
  ok(f.price === 390 + i * 150, `${id}: まえからの ねだんは そのまま（${f.price}）`);
}
for (const [id, name, price, hunger, mood, hp, sp, deza, desc] of M.FOOD) {
  const f = R.BAG_INDEX[id];
  ok(f.name === name && f.desc === desc && f.price === price && f.mallFood === true, `${id}: なまえ・ねだん`);
  ok(price >= 400 && price <= 600 && f.hunger === hunger && f.mood >= mood && (f.hp || 0) === hp && (f.sp || 0) === sp, `${id}: ねだん ${price}・おなか ${f.hunger}・ごきげん ${f.mood}`);
  ok(f.deza === deza, `${id}: デザの しるし ${f.deza}`);
  ok(!/^ike_(cafe_[35]|boba_)/.test(id) || f.sp >= 10, `${id}: のみものは げんき(SP)が もどる`);
}
ok(R.BAG_INDEX.ike_crepes_2.deza === false && R.BAG_INDEX.ike_crepes_4.deza === false && R.FOODS.find((x) => x.id === "ike_crepes_2").deza === false, "おかずの クレープ（アボカド チーズ・ツナコーン）は デザ じゃない");
ok(["ike_cafe_0", "ike_cafe_1", "ike_cafe_2", "ike_crepes_0", "ike_crepes_1", "ike_boba_0", "ike_marche_2"].every((id) => R.BAG_INDEX[id].deza === true), "まえからの デザは デザの まま");
// 館の はこ（3F の マルシェ）の なまえも あたらしい なまえ
const crates = Object.values(R.VenueHalls.defs).flatMap((d) => Object.values(d.floors || {}).flatMap((fl) => fl.fixtures || [])).filter((fx) => fx.item && M.REDRAWN.includes(fx.item));
ok(crates.length >= 3 && crates.every((fx) => fx.label === R.BAG_INDEX[fx.item].name), "マルシェの はこの なまえ " + crates.map((fx) => fx.label).join());
// ほかの おみせ（まちの おみせ・池袋の おみせ）では うらない。マルシェの 3しゅは マルシェ だけ
const sold = new Map();
for (const [sid, s] of Object.entries(R.BUY_SHOPS)) for (const t of (s.tabs && s.tabs.length ? s.tabs.map((x) => x[0]) : [undefined])) for (const it of (s.items(t) || [])) if (it && it.id) { if (!sold.has(it.id)) sold.set(it.id, new Set()); sold.get(it.id).add(sid); }
for (const id of [...M.REDRAWN, ...M.NEW]) {
  const at = [...(sold.get(id) || [])];
  ok(id.startsWith("ike_marche_") ? at.join() === "ike_marche" : at.length === 0, `${id}: うって いる おみせ（${at.join() || "なし"}）`);
}

// ---- 3. 絵 ----
const arts = new Set();
for (const [id, svg] of Object.entries(M.ART)) {
  ok(fragOk(svg) && tagsBalanced(svg), `${id}: 絵の SVG（NaN・id なし・INK の せん）`);
  ok(R.FOOD_ART[id] === svg, `${id}: あとから 絵が 上がき されない`);
  const icon = R.Art.iconSvg("bag", id);
  ok(typeof icon === "string" && icon.includes(svg.slice(0, 60)) && !/NaN|undefined/.test(icon), `${id}: もちものの アイコン`);
  arts.add(svg);
}
ok(arts.size === 21, "21しゅの 絵は ぜんぶ ちがう");

// ---- 4. メニューの まど ----
for (const id of [...groups.cafe, ...groups.crepes, ...groups.boba]) {
  const c = M.choice(id), f = R.BAG_INDEX[id];
  ok(c.includes('class="menu-ico" aria-hidden="true"') && c.includes("<svg") && c.includes(`${f.name}<span class="menu-price">（${f.price}コイン／3にん）</span>`), `${id}: メニューの まどに ちいさな 絵・なまえ・ねだん`);
}
ok(M.choice("nothing_here") === "", "ない たべものは からっぽ");
const css = src("css/style.css");
ok(/\.btn\.choice \{[^}]*min-height: 44px/.test(css) && /\.choice \.menu-price \{[^}]*white-space: nowrap/.test(css) && /\.choice \.menu-txt \{[^}]*word-break: keep-all/.test(css), "メニューの まど: 44px・ねだんは まるごと おりかえす・ことばの とちゅうで おりかえさない");
const venue = src("js/venue-hall.js");
ok(/MallFood\.choice\(id\)/.test(venue) && /\[\.\.\.ids\.map\(label\),'やめておく'\]\);if\(i<0\|\|i>=ids\.length\)return;/.test(venue) && !/\/\/[^\n]*if\(i<0\|\|i>=ids\.length\)return;/.test(venue), "館の メニュー: 絵つき・「やめておく」で もどる（コメントに のみこまれない）");
// 館の たべものの メニュー（はくぶつかんの カフェ ジュラ など）も ぜんぶ 絵が ある
const menus = [...src("js/dino-museum.js").matchAll(/menu: \[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/"([a-z0-9_]+)"/g)].map((x) => x[1]));
ok(menus.length >= 4, "はくぶつかんの カフェの メニュー " + menus.join());
for (const id of new Set(menus)) ok(R.BAG_INDEX[id] && R.FOOD_ART[id] && M.choice(id).includes("<svg"), `${id}: はくぶつかんの メニューに 絵`);

// ---- 5. おねがい・PokaDebug ----
const crepe = R.GowagaWish.INDEX.eat_crepe;
ok(crepe && [0, 1, 2, 3, 4, 5].every((i) => crepe.foods.includes("ike_crepes_" + i)) && /サンシャインいけぶ/.test(crepe.hint), "クレープの おねがい: いけぶの クレープ 6しゅ・ヒント");
ok(/GowagaWish\.signal\('eat',food\.id\)/.test(venue) && /GowagaWish\.signal\("eat", food\.id\)/.test(src("js/neri-bikkupo.js")), "館・びっくぽで いっしょに たべても おねがいが かなう");
const st = M.state();
ok(st.total === 21 && st.menus.cafe.length === 6 && st.names.ike_boba_5 === "チーズ ティー" && st.NEW.length === 9, "PokaDebug.shopGoods('mall') の state");
ok(/shopGoods\(shop = "cake"\) \{ if \(shop === "mall"\) return typeof MallFood/.test(src("js/debug.js")), "PokaDebug.shopGoods('mall')");

if (bad.length) { console.error("✗ mall-food:\n  " + bad.slice(0, 40).join("\n  ")); process.exit(1); }
console.log(`✓ mall-food OK（${n} 項目）: いけぶの メニュー カフェ 6・クレープ 6・たぴ 6・マルシェ 3（あたらしい 9・かきなおし 12）・メニューの 絵・おねがい`);
