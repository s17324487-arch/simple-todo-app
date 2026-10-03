// シールの ガチャ と シールちょう（Meeときょれじゃ 4F・js/sticker-book.js・js/sticker-art.js・UI-53）の 検査。ブラウザ なしで
// シール 18しゅ・シート 12まい（3台 × 4しゅ・レアは 1つ）・ガチャの 100コイン・シールちょう（はる・うごかす・まわす・おおきさ・はがす・かみ）・セーブ（こわれた ときも）・4F の 3台・すまほの アプリ・絵（SVG）・ことば
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Gacha: GA, StickerBook: SB, StickerArt: SA, Save: S } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const dupAttr = (s) => { for (const m of s.matchAll(/<[a-zA-Z][^<>]*>/g)) { const names = [...m[0].matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 90); } return ""; };
const svgAny = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null/.test(s) && !dupAttr(s);
const svgOk = (s) => svgAny(s) && !/<text/.test(s); // シール・シート・かみには もじを いれない（SVG の 絵では フォントが よめない）
const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. シール 18しゅ（3シリーズ × 6・レアは 3）----
// ガチャの シールは series が 0〜2 の 18しゅ。コンビニの いちばんくじ（js/ichiban-kuji.js・UI-55）の 12しゅは series が みせの id（くわしくは tools/check-kuji.mjs）
const D18 = SB.DESIGNS.filter((d) => typeof d.series === "number");
ok(D18.length === 18 && new Set(SB.DESIGNS.map((d) => d.id)).size === SB.DESIGNS.length && SB.DESIGNS.length === 18 + 12 && SB.DESIGNS.every((d) => SB.INDEX[d.id] === d), "シール 18しゅ ＋ いちばんくじの 12しゅ（id が かさならない）");
ok(SB.DESIGNS.slice(0, 18).every((d) => typeof d.series === "number") && SB.DESIGNS.slice(18).every((d) => typeof d.series === "string" && d.hint && /いちばんくじ/.test(d.hint)), "ガチャの 18しゅが さき・いちばんくじの シールは あと（ヒントつき）");
ok(D18.filter((d) => d.rare).map((d) => d.id).join() === "stk_trio,stk_unicorn,stk_parfait" && SB.DESIGNS.filter((d) => d.rare).length === 3, "レアの シール 3しゅ（なかよし 3にん・ユニコーン・にじいろ パフェ）");
for (let k = 0; k < 3; k++) ok(SB.DESIGNS.filter((d) => d.series === k).length === 6 && SB.DESIGNS.filter((d) => d.series === k && d.rare).length === 1, `シリーズ ${k} は 6しゅ（レア 1）`);
for (const d of D18) {
  ok(/^stk_[a-z]+$/.test(d.id) && d.name && !kanji.test(d.name) && d.name.length <= 8 && typeof SA.FIG[d.id] === "function", `シール ${d.id}: なまえ（かな・8もじ まで）・絵`);
  const s = SA.piece(d.id), s2 = SA.piece(d.id);
  ok(svgOk(s) && /viewBox="0 0 100 100"/.test(s) && s.includes(R.INK || "#1F1D1B") && s.includes('fill="#FFFFFF" stroke="#FFFFFF"'), `シール ${d.id} の 絵（100×100・しろい ふち・線は INK）`);
  const a = ids(s); ok(new Set(a).size === a.length && ids(s2).every((x) => !a.includes(x)), `シール ${d.id} の SVG の id（かさならない・よぶ たびに あたらしい）`);
}
ok(SA.piece("stk_nothing") === "", "しらない シールは からっぽ");

// ---- 2. シリーズ（ガチャの 台）3つ・30〜32 ばん・シート 4まい ----
ok(SB.SERIES.length === 3 && SB.first === 30 && SB.IDX.join() === "30,31,32" && SB.SERIES.every((S2, i) => S2.index === 30 + i && GA.SERIES[30 + i] === S2 && GA.byId(S2.id) === S2), "シールの 3シリーズは 30〜32 ばん");
ok(SB.SERIES.map((x) => x.id).join() === "stkpuku,stkfuwa,stkuru" && SB.SERIES.map((x) => x.name).join() === "ぷっくり シール,ふわふわ シール,うるうる シール", "シリーズの なまえ（ぷっくり・ふわふわ・うるうる）");
ok(GA.SERIES.length === 33 && GA.SERIES.slice(0, 30).every((x) => x.kind !== "sticker") && SB.SERIES.every((x) => x.kind === "sticker" && x.sticker && !x.forest), "まえの 30シリーズは そのまま・シールは kind sticker");
ok(new Set(GA.SERIES.map((x) => x.color.toUpperCase())).size === GA.SERIES.length, "台の いろが ぜんぶ ちがう（33だい）");
for (const S2 of SB.SERIES) {
  const si = S2.index, sid = SB.SERIES.indexOf(S2);
  ok(GA.priceOf(si) === 100 && S2.price === 100 && SB.PRICE === 100 && GA.priceOf(0) === 200 && GA.priceOf(12) === 200, `${S2.name}: 1かい 100コイン（ほかの 台は 200）`);
  ok(S2.list.length === 4 && S2.list.filter((it) => it.rare).length === 1 && S2.list[GA.RARE].rare && S2.list.every((it) => it.kind === "sticker" && it.series === si && GA.seriesOf(it.id) === S2), `${S2.name}: シート 4しゅ・レア 1`);
  ok(!kanji.test(S2.name) && S2.name.length <= 10 && S2.caps.length >= 2 && S2.paper.length === 4, `${S2.name}: なまえ・カプセルの いろ・だいしの いろ`);
  const mine = SB.DESIGNS.filter((d) => d.series === sid).map((d) => d.id), rareD = SB.DESIGNS.find((d) => d.series === sid && d.rare).id;
  for (const it of S2.list) {
    ok(it.name && !kanji.test(it.name) && it.name.length <= 11 && it.desc && !kanji.test(it.desc) && it.desc.length <= 40, `シート「${it.name}」: かな・ながさ`);
    ok(Array.isArray(it.stickers) && it.stickers.reduce((a, [, k]) => a + k, 0) === 4 && it.stickers.every(([id, k]) => mine.includes(id) && k >= 1), `シート ${it.id}: その シリーズの シールが 4まい`);
    ok(it.rare === it.stickers.some(([id]) => id === rareD), `シート ${it.id}: レアの シールは レアの シートにだけ`);
    ok(!R.FURN_INDEX[it.id] && !R.ITEM_INDEX[it.id] && !R.FURNITURE.some((f) => f.id === it.id) && !R.WEAR_ITEMS.some((w) => w.id === it.id), `シート ${it.id} は 家具・服に はいらない`);
    const s = GA.pic(it); ok(svgOk(s) && /viewBox="0 0 100 110"/.test(s) && (s.match(/viewBox="0 0 100 100"/g) || []).length === 4, `シート ${it.id} の 絵（だいしに シール 4まい）`);
    const a = ids(s); ok(new Set(a).size === a.length, `シート ${it.id} の SVG の id が かさなる`);
  }
  ok(mine.every((id) => S2.list.some((it) => it.stickers.some(([x]) => x === id))), `${S2.name}: 6しゅ ぜんぶが どれかの シートに ある`);
  const m = R.GachaArt.machine(S2, "");
  ok(svgAny(m) && m.includes(">100</text>") && m.includes("#FF8FB0") && !m.includes("#7DBA4C"), `${S2.name}: 台の 絵（100コイン・ハートの シール・はっぱ なし）`);
}
// おみせに ならばない
for (const shop of Object.values(R.BUY_SHOPS)) for (const tab of ["head", "face", "neck", "body", "back", "hand", "floor", "wall", "food", "tool", ""]) {
  let list = []; try { list = shop.items(tab) || []; } catch (e) { list = []; }
  ok(!list.some((i) => i && (SB.INDEX[i.id] || (GA.INDEX[i.id] && GA.INDEX[i.id].kind === "sticker"))), `おみせ ${shop.name} に シールが ならぶ`);
}

// ---- 3. まわす（100コイン）→ シートの シールが シールちょうの てもとに ----
S.d = S.fresh();
ok(S.d.stickers && typeof S.d.stickers.have === "object" && typeof S.d.stickers.got === "object" && Array.isArray(S.d.stickers.pages) && S.d.stickers.pages.length === 0, "Save.fresh に stickers（have・got・pages）");
{
  const old = S.migrate({ ...S.fresh(), stickers: undefined, coins: 321 }); ok(old.stickers && Array.isArray(old.stickers.pages) && old.coins === 321, "ふるい セーブに stickers が たされる");
  ok(S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1", "セーブの かたちは かわらない（SCHEMA 2・KEY）");
  const si = SB.IDX[0];
  S.d.coins = 99; ok(GA.spin(si, 0.1) === null && S.d.coins === 99 && GA.st().plays === 0, "99コインでは まわせない");
  S.d.coins = 1000; GA.next = 0; const r = GA.spin(si, 0.1);
  ok(r && r.k === 0 && r.item.id === "gacha_stkpuku_0" && r.price === 100 && S.d.coins === 900 && GA.got("gacha_stkpuku_0") === 1 && !S.d.furn.gacha_stkpuku_0 && !S.d.wardrobe.gacha_stkpuku_0, "シールの 台は 100コイン・シートは 家具・服に ならない");
  ok(SB.have("stk_wanko") === 2 && SB.have("stk_heart") === 1 && SB.have("stk_star") === 1 && SB.got("stk_wanko") === 2 && /シールが 4まい ふえたよ/.test(r.note) && /あたらしい シール: わんこ・ハート・おほしさま/.test(r.note) && !kanji.test(r.note), "シートの シール 4まいが てもとに・ことば " + r.note);
  GA.next = 1; const r2 = GA.spin(si); ok(/あたらしい シール: がちゃん。/.test(r2.note) && SB.have("stk_heart") === 2 && SB.have("stk_gachan") === 2, "2まいめの シート: あたらしい シールだけ なまえが でる " + r2.note);
  GA.next = 3; const r3 = GA.spin(si); ok(r3.rare && SB.have("stk_trio") === 1 && SB.have("stk_wanko") === 3, "レアの シート（なかよし 3にん）");
  GA.next = 2; const r4 = GA.spin(si); ok(r4.complete && GA.complete(si) && GA.st().done.stkpuku === R.U.today(), "4しゅ そろうと コンプリート");
  ok(S.d.coins === 600, "4かいで 400コイン");
  // ほかの 2台も
  for (const [k, ids2] of [[1, ["stk_unicorn", "stk_cat", "stk_rabbit", "stk_bear"]], [2, ["stk_parfait", "stk_strawberry", "stk_icecream", "stk_donut"]]]) { GA.next = 3; GA.spin(SB.IDX[k]); ok(ids2.every((id) => SB.have(id) >= 1), `${SB.SERIES[k].name} の レアの シート`); }
  ok(S.d.coins === 400, "シールの 台は どれも 100コイン");
}

// ---- 4. シールちょう（はる・うごかす・まわす・おおきさ・いちばん うえ・はがす・かみ）----
{
  const P = SB.page(0);
  ok(SB.st().pages.length === 6 && SB.st().pages.every((p, i) => p.bg === i % 6 && Array.isArray(p.s)) && SB.PAGES === 6 && SB.PER === 24, "ページ 6まい（かみは 1まいずつ ちがう）");
  const h0 = SB.have("stk_wanko"), i0 = SB.put(0, "stk_wanko", 120, 140);
  ok(i0 === 0 && P.s[0].join() === "stk_wanko,120,140,0,2" && SB.have("stk_wanko") === h0 - 1 && SB.placed("stk_wanko") === 1, "はると てもとが 1まい へる");
  ok(SB.put(0, "stk_nothing") === -1 && SB.have("stk_panda") === 0 && SB.put(0, "stk_panda") === -2, "しらない シール・もって いない シールは はれない");
  ok(SB.move(0, 0, -50, 999) && P.s[0][1] === 0 && P.s[0][2] === SB.PH && SB.move(0, 0, 150.4, 180.6) && P.s[0][1] === 150 && P.s[0][2] === 181 && !SB.move(0, 5, 1, 1), "うごかす（ページの なか・せいすう）");
  ok(SB.rotate(0, 0, 1) && P.s[0][3] === 15 && SB.rotate(0, 0, -2) && P.s[0][3] === -15, "まわす（15どずつ）");
  for (let k = 0; k < 11; k++) SB.rotate(0, 0, 1);
  ok(P.s[0][3] === 150 && SB.rotate(0, 0, 3) && P.s[0][3] === -165, "まわすと -180〜180 に もどる");
  ok(SB.resize(0, 0, 1) && P.s[0][4] === 3 && SB.resize(0, 0, 1) && P.s[0][4] === 4 && !SB.resize(0, 0, 1) && P.s[0][4] === 4, "おおきく（5だん まで）");
  for (let k = 0; k < 6; k++) SB.resize(0, 0, -1);
  ok(P.s[0][4] === 0 && SB.SIZES.length === 5 && SB.SIZES[0] < 1 && SB.SIZES[4] > 1, "ちいさく（いちばん ちいさい まで）");
  SB.put(0, "stk_heart"); SB.put(0, "stk_star");
  ok(SB.front(0, 0) === 2 && P.s[2][0] === "stk_wanko" && P.s.map((x) => x[0]).join() === "stk_heart,stk_star,stk_wanko", "さわった シールは いちばん うえ");
  const hh = SB.have("stk_wanko"); ok(SB.peel(0, 2) && SB.have("stk_wanko") === hh + 1 && P.s.length === 2 && !SB.peel(0, 9), "はがすと てもとに もどる");
  ok(SB.paperNext(0) === 1 && SB.page(0).bg === 1 && SB.paperNext(5) === 0, "かみを かえる（6しゅで ひとまわり）");
  // 1ページ 24まい まで
  SB.add("stk_cat", 40); let last = 0; for (let k = 0; k < 30; k++) last = SB.put(1, "stk_cat");
  ok(SB.page(1).s.length === 24 && last === -3 && SB.have("stk_cat") === 41 - 24, "1ページに 24まい まで");
  ok(SB.page(-3) === SB.page(0) && SB.page(99) === SB.page(5), "ページの ばんごうは 0〜5 に おさめる");
  // てもとは 99まい まで
  SB.add("stk_star", 500); ok(SB.have("stk_star") === SB.CAP && SB.CAP === 99 && !SB.add("stk_star", 0) && !SB.add("stk_nothing", 1), "てもとは 99まい まで");
}
// ---- 5. こわれた セーブを なおす ----
{
  S.d.stickers = { have: { stk_wanko: 3, stk_bad: 5, stk_heart: -2, stk_star: "x", stk_cat: 1e9 }, got: null, pages: [{ bg: 99, s: [["stk_wanko", 10, 20, 7, 2], ["stk_bad", 1, 1, 0, 2], ["stk_heart", NaN, 5, 0, 2], ["stk_star", 400, -9, 361, 9], "x"] }, null, { bg: 3, s: Array.from({ length: 40 }, () => ["stk_cat", 5, 5, 0, 1]) }] };
  const d = SB.st();
  ok(d.have.stk_wanko === 3 && !("stk_bad" in d.have) && !("stk_heart" in d.have) && !("stk_star" in d.have) && d.have.stk_cat === 999 && typeof d.got === "object", "てもとの かずを なおす（しらない シール・マイナス・もじ）");
  ok(d.pages.length === 6 && d.pages[0].bg === 5 && d.pages[0].s.length === 2 && d.pages[0].s[0].join() === "stk_wanko,10,20,0,2" && d.pages[0].s[1].join() === "stk_star,300,0,0,4", "ページの シールを なおす（ばしょ・まわす・おおきさ）");
  ok(d.pages[1].bg === 1 && d.pages[1].s.length === 0 && d.pages[2].bg === 3 && d.pages[2].s.length === 24, "ない ページ・おおすぎる シール");
  S.d.stickers = "broken"; ok(SB.st().pages.length === 6 && Object.keys(SB.st().have).length === 0, "stickers が こわれて いても うごく");
  S.d.stickers = undefined; ok(SB.st().pages.length === 6, "stickers が ない セーブ");
  const back = JSON.parse(JSON.stringify(SB.st())); S.d.stickers = back; ok(JSON.stringify(SB.st()) === JSON.stringify(back), "なおした あとの セーブは もう かわらない");
}

// ---- 6. 4F（ガチャガチャの もり）の きたの かべに 3台 ----
{
  const fl = R.VenueHalls.defs.arcade.floors, f4 = fl[4], I = R.IsoVenue;
  const st = f4.fixtures.filter((f) => f.kind === "gacha" && SB.isSticker(f.series));
  ok(st.length === 3 && st.map((f) => [f.x, f.y, f.dir, f.series].join()).join(";") === "16,0,y,30;17,0,y,31;18,0,y,32" && st.every((f) => f.w === 1 && f.h === 1 && f.variant === f.series && f.action === "gacha" && f.spots.length === 1 && f.spots[0][0] === f.x && f.spots[0][1] === 1), "4F の きたの かべ（16〜18）に シールの 台 3つ");
  ok(st[0].label === "シールの ガチャ" && ![1, 2, 3].some((k) => fl[k].fixtures.some((f) => f.kind === "gacha" && SB.isSticker(f.series))), "シールの 台は 4F だけ");
  const bench = f4.fixtures.filter((f) => f.kind === "fstump"), solid = f4.fixtures.filter((f) => !f.over && !f.walk && f.kind !== "hangsign" && f.kind !== "escalator");
  ok(!bench.some((f) => f.y <= 1 && f.x >= 15 && f.x <= 18), "シールの ガチャの まえに きりかぶの ベンチが ない（ベンチは もりの ひろば）");
  for (const a of st) for (const b of solid) if (a !== b) ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `シールの 台（${a.x},${a.y}）と ${b.kind}（${b.x},${b.y}）が かさなる`);
  const walk = (r, [x, y]) => x >= 0 && y >= 0 && x < r.w && y < r.h && !I.solidAt(r, x, y) && !r.fixtures.some((f) => !f.walk && !f.over && f.kind !== "hangsign" && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  const reach = (r, from) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = [x + dx, y + dy], k = p.join(); if (!seen.has(k) && walk(r, p)) { seen.add(k); q.push(p); } } } return seen; };
  const R4 = reach(f4, f4.spawn);
  for (const f of f4.fixtures.filter((f) => f.action && f.action !== "floor")) ok(f.spots.some((p) => walk(f4, p) && R4.has(p.join())), `4F の ${f.label || f.kind}（${f.x},${f.y}）の まえに たてる`);
  const z = f4.zones.find((q) => q.shop === "arcForestSticker"), rest = f4.zones.find((q) => q.shop === "arcForestRest");
  ok(z && z.label === "シールの ガチャ" && z.map === "シール" && st.every((f) => f.x >= z.x && f.x < z.x + z.w && f.y >= z.y && f.y < z.y + z.h) && rest && R.MallArt.SHOP.arcForestSticker, "フロアマップの へや「シールの ガチャ」");
  for (let i = 0; i < f4.zones.length; i++) for (let j = i + 1; j < f4.zones.length; j++) { const a = f4.zones[i], b = f4.zones[j]; ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `4F の へや ${a.label} と ${b.label} が かさなる`); }
  const places = R.MallGuide.places(f4).map((p) => p.label);
  ok(places.includes("シールの ガチャ") && places.includes("もりの ひろば"), "フロアマップに「シールの ガチャ」と「もりの ひろば」 " + places.join("・"));
  ok(f4.walls.north.some((w) => w.kind === "sign" && w.text === "シール 100コイン" && w.from >= 15 && w.to <= 20), "かべに「シール 100コイン」");
  const dir = f4.fixtures.find((f) => f.kind === "directory"), d1 = fl[1].fixtures.find((f) => f.kind === "directory");
  ok(/シールの ガチャ（きたの かべ）: 1かい 100コイン/.test(dir.text) && /ほかの ガチャは 1かい 200コイン/.test(dir.text) && /シールの ガチャ 3だい/.test(d1.text), "もりの あんない・1F の あんないに シールの ガチャ");
  SB.patch4(f4); ok(f4.fixtures.filter((f) => f.kind === "gacha" && SB.isSticker(f.series)).length === 3 && f4.zones.filter((q) => q.shop === "arcForestSticker").length === 1, "patch4 を 2かい よんでも ふえない");
  // 館の 台の 絵（ハートの シール）・モデルの キー
  for (const f of st) { const m = R.ArcadeArt.model(f); ok(m && svgAny(m.svg) && m.svg.includes("#FF8FB0") && m.vb.h >= 112, `4F の シールの 台（${f.x},${f.y}）の 絵`); }
  ok(new Set(st.map((f) => R.ArcadeArt.modelKey(f))).size === 3, "シールの 台の 絵の キーは 3つ");
  const w = R.ArcadeArt.wallSvg(f4, "north"); ok(svgAny(w.svg) && w.svg.includes("シール 100コイン"), "きたの かべの 絵に「シール 100コイン」");
}

// ---- 7. シートと ページの 絵・すまほの アプリ・PokaDebug ----
{
  ok(SA.PAPERS.length === 6 && SA.PAPERS.every((p) => p.name && !kanji.test(p.name) && /^#[0-9A-F]{6}$/i.test(p.base)), "かみ 6しゅ（なまえは かな）");
  for (let k = 0; k < 6; k++) { const s = SA.paper(k); ok(svgOk(s) && /viewBox="0 0 300 360"/.test(s) && (s.match(/<circle cx="13"/g) || []).length === 6 && s === SA.paper(k + 6) && s === SA.paper(k - 6), `かみ ${k}（300×360・ミニ 6あな）`); }
  ok(SA.SLOTS.length === 4 && SA.SLOTS.every(([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 100 && y + h <= 110), "シートの シールの ばしょ 4つ");
  ok(svgOk(SA.sheet({ stickers: [] })) && svgOk(SA.sheet({ stickers: [["stk_wanko", 9]] }, "#FFFFFF", true)), "からっぽの シート・レアの シートの 絵");
  const app = R.Smaho.APPS.find((a) => a.id === "stickers");
  ok(app && app.name === "シール" && app.name.length <= 7 && /^#[0-9A-F]{6}$/i.test(app.color) && app.when() && R.Smaho.apps().includes(app) && R.Smaho.ICON.stickers && !/NaN|undefined/.test(R.Smaho.svg("stickers")), "すまほの アプリ「シール」・アイコン");
  ok(R.Smaho.APPS.findIndex((a) => a.id === "stickers") === R.Smaho.APPS.findIndex((a) => a.id === "photos") + 1, "「シール」は「しゃしん」の となり");
  const D = R.PokaDebug;
  S.d = S.fresh(); S.d.coins = 500;
  ok(D.stickerGive("stk_wanko", 3) && !D.stickerGive("stk_nothing", 1) && D.stickers().have.stk_wanko === 3 && D.stickers().machines.length === 3 && D.stickers().series.every((x) => x.price === 100 && x.sheets.length === 4) && D.stickers().designs.length === 30, "PokaDebug.stickers・stickerGive");
  ok(D.gachaForest().machines.length === 18 && D.gachaForest().machines.every((si) => GA.SERIES[si].forest), "gachaForest() の 台は もりの 18だい だけ");
  // おなじ 絵は キャッシュ（シールちょうは 18しゅ ＋ かみ 6しゅ。ばしょや かずは キーに いれない）
  const src = readFileSync(new URL("../js/sticker-book.js", import.meta.url), "utf8");
  ok(/URLS\[id\] \|\| \(URLS\[id\] = U\.svgUrl\(StickerArt\.piece\(id\)\)\)/.test(src) && /PAPER_URLS\[n\] \|\| \(PAPER_URLS\[n\] = U\.svgUrl\(StickerArt\.paper\(n\)\)\)/.test(src) && !/SvgCache\.get\(/.test(src), "シールの 絵は シール 1しゅ 1つ（かずが ふえない）");
}

// ---- 8. そとへの つうしん なし・ことば ----
for (const f of ["../js/sticker-book.js", "../js/sticker-art.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|Math\.random/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん しない・でたらめを つかわない`);
  // コメントを のぞいた もじ（" " と ` `）に 漢字が ない
  const code = src.split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ [^"`]*$/, "")).join("\n");
  for (const m of code.matchAll(/"([^"\n]*)"|`([^`\n]*)`/g)) { const t = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ""); ok(!kanji.test(t), `${f} の ことばに 漢字: ${t.slice(0, 40)}`); }
}
console.log(`Stickers (4F): 18 stickers in 3 textures (puffy/fluffy/glossy, 3 rare), 3 machines x 4 sheets (30-32, 100 coins, 4 stickers per sheet, not furniture/clothes, not sold), spin gives stickers, sticker book (6 pages x 24, put/move/rotate/resize/front/peel/paper, 99 cap), broken saves repaired, 4F north wall (16-18) reachable with no bench in front, floor map/walls/directories, SVG (no duplicate attributes/ids), smaho app, PokaDebug — ${n} checks OK`);
