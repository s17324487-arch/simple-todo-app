// UI-57: ネリカス でんき 1F の シール うりば（js/kaden-stickers.js・js/kaden-sticker-art.js）と シールちょうの あたらしい うごき（js/sticker-book.js）の 検査。ブラウザ なしで
// シール 46しゅ（ぷくぷく・ドロップ・シャカシャカ・フレーク・タイル・レトロ・そざい 6しゅ）・絵（SVG）・シャカシャカの 4まい・しなもの 12・かう・タイルを きる・まとまり・1F の うりば・ことば
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { StickerBook: SB, KadenStickers: KS, KadenStickerArt: KA, Save: S } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
S.d = S.fresh();
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const dupAttr = (s) => { for (const m of s.matchAll(/<[a-zA-Z][^<>]*>/g)) { const names = [...m[0].matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 90); } return ""; };
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined|null|Infinity/.test(s) && !dupAttr(s) && !/<text/.test(s) && !/Gradient/.test(s);
const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

// ---- 1. シール 46しゅ（30しゅ いじょう）・しゅるいを ぜんぶ ----
const NEW = SB.DESIGNS.filter((d) => d.series === "kaden");
ok(NEW.length === 46 && NEW.length >= 30 && SB.DESIGNS.length === 88, "ネリカス でんきの シールは 46しゅ（30しゅ いじょう。ぜんぶで 88しゅ）");
ok(new Set(NEW.map((d) => d.id)).size === NEW.length && NEW.every((d) => SB.INDEX[d.id] === d && typeof KA.FIG[d.id] === "function" && R.StickerArt.FIG[d.id] === KA.FIG[d.id] && /^stk_(mm|dp|sk|fk|tl|y2|mt)_[a-z]+$/.test(d.id)), "id・絵（StickerArt.FIG に はいる）");
ok(KS.IDS.join() === NEW.map((d) => d.id).join(), "KadenStickers.IDS と シールちょうの じゅんばん");
const by = (k) => NEW.filter((d) => d.kind === k);
ok(by("puku").length === 5 && by("puku").every((d) => d.fx === "squish" && d.tip), "マシュマロ・ぷくぷく 5しゅ（タップで ふにっ）");
ok(by("drop").length === 5 && by("drop").every((d) => d.fx === "jelly" && d.tip), "ドロップ 5しゅ（ぷるん）");
ok(by("shaka").length === 4 && by("shaka").every((d) => d.fx === "shaka" && typeof d.layers === "function" && d.tip), "シャカシャカ 4しゅ（4まい かさねる）");
ok(by("flake").length === 12 && by("flake").every((d) => d.size === 1 && !d.fx), "フレーク 12しゅ（ちいさめに はる）");
const tile = by("tile"), sheet = tile.find((d) => d.cut);
ok(sheet && sheet.id === "stk_tl_sheet" && sheet.fx === "tile" && sheet.size === 4 && sheet.cut.into.length === 9 && sheet.cut.cols === 3 && sheet.cut.into.join() === KS.TILES.join(), "タイル シート（3×3・おおきく はる）");
ok(KS.TILES.length === 9 && KS.TILES.every((id) => SB.INDEX[id] && SB.INDEX[id].kind === "tile" && SB.INDEX[id].size === 0 && !SB.INDEX[id].cut && /きる/.test(SB.INDEX[id].hint)), "タイル 9まい（きると でる・ヒント）");
ok(tile.filter((d) => /^stk_y2_/.test(d.id)).length === 4, "へいせい レトロ 4しゅ");
const mat = by("mat");
ok(mat.length === 6 && ["paper", "film", "washi", "clear", "mirror", "foil"].every((k) => mat.some((d) => d.id === "stk_mt_" + k)) && mat.every((d) => d.tip && !kanji.test(d.tip)), "そざい 6しゅ（かみ・フィルム・わし・とうめい・ミラー・はくおし）と せつめい");
ok(["puku", "drop", "shaka", "flake", "tile", "mat"].every((k) => by(k).length >= 4) && NEW.every((d) => KS.TABS.includes(d.kind)), "どの しゅるいも 4しゅ いじょう");
for (const d of NEW) {
  ok(d.name && !kanji.test(d.name) && d.name.length <= 11, `シール ${d.id}: なまえ（かな・11もじ まで）`);
  ok(d.hint && /ネリカス でんき/.test(d.hint) && !kanji.test(d.hint) && (!d.tip || !kanji.test(d.tip)), `シール ${d.id}: ヒント・ひとこと`);
}
ok(new Set(NEW.map((d) => d.name)).size === NEW.length, "なまえが かさならない");

// ---- 2. 絵（100×100・線は INK・しろい ふち・id は よぶ たびに あたらしい）----
for (const d of NEW) {
  const s = R.StickerArt.piece(d.id), s2 = R.StickerArt.piece(d.id);
  ok(svgOk(s) && /viewBox="0 0 100 100"/.test(s) && s.includes(R.INK || "#1F1D1B"), `シール ${d.id} の 絵（100×100・線は INK・もじ なし）`);
  // とうめいな シールと タイル（あつい タイルの かたち）は しろい ふちが ない
  const noRim = d.id === "stk_mt_clear" || KS.TILES.includes(d.id);
  ok(noRim ? !s.includes('fill="#FFFFFF" stroke="#FFFFFF"') : s.includes('fill="#FFFFFF" stroke="#FFFFFF"'), `シール ${d.id}: しろい ふちどり（とうめいと タイルは ふち なし）`);
  const a = ids(s); ok(new Set(a).size === a.length && ids(s2).every((x) => !a.includes(x)), `シール ${d.id} の SVG の id（かさならない・よぶ たびに あたらしい）`);
  ok(s.length < 60000, `シール ${d.id} の 絵が おおきすぎる（${s.length}）`);
}
// とうめいは まわりが すける（うすい ぬり）・ミラーと ホロは かたちの なかだけ（clipPath）
ok(/fill-opacity="0.16"/.test(R.StickerArt.piece("stk_mt_clear")) && /clipPath/.test(R.StickerArt.piece("stk_mt_mirror")) && /clipPath/.test(R.StickerArt.piece("stk_y2_phone")) && /clipPath/.test(R.StickerArt.piece("stk_mt_washi")), "とうめい・ミラー・ホロ・わしの もよう");
// シャカシャカ: 4まい・なかみは まどの なか・rest は したに たまる
for (const d of by("shaka")) {
  const L = d.layers(), w = KA.windowOf(d.id);
  ok(["base", "rest", "up", "top"].every((k) => svgOk(L[k]) && /viewBox="0 0 100 100"/.test(L[k])) && w, `${d.id}: 4まい と まど`);
  // まどの なかの つぶ（ラメ・あわ）。さかなの めは グループの なかの ざひょう（マイナス）なので のぞく
  const pts = (s) => [...s.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => [+m[1], +m[2], +m[3]]);
  for (const k of ["rest", "up"]) { const P = pts(L[k]); ok(P.length >= 20 && P.every(([x, y]) => KA.inWin(w, x, y, k === "up" ? 3 : 0.5)), `${d.id} の ${k}: なかみ ${P.length}こ が まどの なか`); }
  const avg = (s) => { const P = pts(s); return P.reduce((a, p) => a + p[1], 0) / P.length; };
  ok(avg(L.rest) > avg(L.up) + 6, `${d.id}: rest は したに たまる（${avg(L.rest).toFixed(1)} / ${avg(L.up).toFixed(1)}）`);
  ok(R.StickerArt.piece(d.id).length > L.base.length, `${d.id}: ぜんぶ かさねた 絵（シールちょうの したの ならび）`);
}

// ---- 3. しなもの 12（パック）----
ok(KS.PRODUCTS.length === 12 && new Set(KS.PRODUCTS.map((p) => p.id)).size === 12 && KS.TABS.join() === "puku,drop,shaka,flake,tile,mat", "しなもの 12・タブ 6");
for (const p of KS.PRODUCTS) {
  ok(KS.TABS.includes(p.kind) && p.price >= 200 && p.price <= 600 && p.price % 100 === 0 && /^#[0-9A-F]{6}$/i.test(p.color), `${p.id}: しゅるい・ねだん（200〜600）`);
  ok(p.name && !kanji.test(p.name) && p.desc && !kanji.test(p.desc) && p.desc.length <= 60, `${p.id}: なまえ・せつめい（かな）`);
  ok(p.stickers.length >= 1 && p.stickers.every(([id, k]) => SB.INDEX[id] && SB.INDEX[id].series === "kaden" && k >= 1) && KS.count(p) >= 1, `${p.id}: なかの シール`);
  ok(!R.FURN_INDEX[p.id] && !R.ITEM_INDEX[p.id] && !R.BAG_INDEX?.[p.id], `${p.id} は 家具・服・もちものに ならない`);
  const s = KA.pack(p), a = ids(s); ok(svgOk(s) && /viewBox="0 0 100 120"/.test(s) && new Set(a).size === a.length, `${p.id}: パックの 絵（100×120・id が かさならない）`);
}
ok(KS.TABS.every((k) => KS.PRODUCTS.filter((p) => p.kind === k).length >= 2), "どの タブにも 2つ いじょう");
ok(NEW.filter((d) => !KS.TILES.includes(d.id)).every((d) => KS.PRODUCTS.some((p) => p.stickers.some(([id]) => id === d.id))), "タイル（きって でる）の ほかは どれも うって いる");
ok(KS.P_INDEX.kst_fk1.stickers.reduce((a, [, k]) => a + k, 0) === 12 && KS.P_INDEX.kst_fk2.stickers.length === 6, "フレークは 1ふくろ 12まい（6しゅ × 2）");

// ---- 4. かう ----
S.d.coins = 250; ok(KS.buy("kst_dp1") === null && S.d.coins === 250 && !SB.have("stk_dp_heart"), "コインが たりない ときは かえない");
ok(KS.buy("kst_nothing") === null, "しらない しなもの");
S.d.coins = 5000; const note = KS.buy("kst_fk1");
ok(note && /^シールが 12まい ふえたよ。あたらしい シール: カップケーキ・ハートの クッキー/.test(note) && /すまほの「シール」で はれるよ/.test(note) && !kanji.test(note) && S.d.coins === 4800 && SB.have("stk_fk_cupcake") === 2 && SB.got("stk_fk_cupcake") === 2, "フレークを かう（200コイン・12まい・あたらしい シール）" + note);
const note2 = KS.buy("kst_fk1"); ok(note2 && !/あたらしい/.test(note2) && SB.have("stk_fk_cupcake") === 4 && S.d.coins === 4600, "2かいめは あたらしい シールの なまえが でない");
ok(KS.view.bought === 2 && KS.view.last === "kst_fk1", "かった かず");
for (const p of KS.PRODUCTS) { S.d.coins = 99999; ok(KS.buy(p.id) && S.d.coins === 99999 - p.price && p.stickers.every(([id]) => SB.have(id) >= 1), `${p.id} を かう`); }
ok(S.SCHEMA === 2 && S.KEY === "pokapoka-town-save-v1" && Object.keys(S.d.stickers).join() === "have,got,pages", "セーブの かたちは かわらない（have・got・pages）");

// ---- 5. はる（おおきさ）・タイルを きる ----
{
  const P = SB.page(0);
  const i = SB.put(0, "stk_tl_sheet", 150, 180), j = SB.put(0, "stk_fk_soda", 60, 70), k0 = SB.put(0, "stk_dp_heart", 240, 100);
  ok(P.s[i][4] === 4 && P.s[j][4] === 1 && P.s[k0][4] === SB.SIZES.indexOf(1), "タイル シートは おおきく・フレークは ちいさく・ほかは ふつう");
  ok(SB.cutTile(0, j) === -1 && SB.cutTile(0, 99) === -1, "タイルで ない シールは きれない");
  const before = P.s.length, k = SB.cutTile(0, i), T = P.s.slice(k);
  ok(k >= 0 && P.s.length === before - 1 + 9 && T.map((x) => x[0]).join() === KS.TILES.join() && !P.s.some((x) => x[0] === "stk_tl_sheet") && KS.TILES.every((id) => SB.got(id) === 1 && SB.have(id) === 0), "きると ページの 1まいが タイル 9まいに（もらった ことに なる）");
  ok(new Set(T.map((x) => x[1] + "," + x[2])).size === 9 && T[4][1] === 150 && T[4][2] === 180 && T.every((x) => x[4] === 0 && x[3] === 0) && T[0][1] < T[2][1] && T[0][2] < T[6][2], "シートの ならびの まま（まんなかが シートの ばしょ）");
  ok(SB.peel(0, P.s.length - 1) && SB.have(KS.TILES[8]) === 1, "はがした タイルは てもとに");
  // まわした シートは まわした まま きれる
  SB.add("stk_tl_sheet", 1); const r = SB.put(0, "stk_tl_sheet", 150, 180); for (let q = 0; q < 6; q++) SB.rotate(0, r, 1);
  const k2 = SB.cutTile(0, r), T2 = P.s.slice(k2); ok(T2.length === 9 && T2.every((x) => x[3] === 90) && Math.abs(T2[0][1] - T2[2][1]) <= 1 && T2[0][2] < T2[2][2], "まわした シート（90ど）を きると ならびも まわる");
  // ページが いっぱいの ときは きれない
  SB.add("stk_tl_sheet", 1); SB.add("stk_mm_cloud", 40); const pg2 = SB.page(2); while (pg2.s.length < SB.PER - 1) SB.put(2, "stk_mm_cloud");
  const r3 = SB.put(2, "stk_tl_sheet"); ok(pg2.s.length === SB.PER && SB.cutTile(2, r3) === -3 && pg2.s.some((x) => x[0] === "stk_tl_sheet"), "ページが いっぱいだと きれない（-3）");
  // セーブを なおしても かわらない（あたらしい シールの id は のこる）
  const back = JSON.parse(JSON.stringify(SB.st())); S.d.stickers = back;
  ok(JSON.stringify(SB.st()) === JSON.stringify(back) && SB.st().pages[0].s.some((x) => x[0] === "stk_tl_heart"), "なおした セーブも おなじ（あたらしい シールは のこる）");
}

// ---- 6. したの ならびの まとまり ----
{
  const G = SB.grouped();
  ok(G.map((g) => g.k).join() === "gacha,kuji,puku,drop,shaka,flake,tile,mat" && G.reduce((a, g) => a + g.list.length, 0) === SB.DESIGNS.length && new Set(G.flatMap((g) => g.list.map((d) => d.id))).size === SB.DESIGNS.length, "まとまり 8つ（どの シールも 1かい）");
  ok(G.find((g) => g.k === "gacha").list.length === 18 && G.find((g) => g.k === "kuji").list.length === 24 && G.every((g) => g.name && !kanji.test(g.name) && g.name.length <= 6), "ガチャ 18・くじ 24（ひとりの くじ 12・みんなの くじ 12）・なまえは かな");
}

// ---- 7. 1F の うりば ----
{
  const r1 = R.VenueHalls.defs.electronics.floors[1], z = r1.zones.find((q) => q.shop === "kd_sticker");
  ok(z && z.label === "シール" && z.x === KS.ZONE.x && z.y === KS.ZONE.y && R.MallArt.SHOP.kd_sticker && R.KadenHallArt.SHOPS.kd_sticker, "1F の うりば「シール」（いろ・フロアマップ）");
  const F = r1.fixtures.filter((f) => f.action === "stickers");
  ok(F.length === 6 && F.every((f) => KS.TABS.includes(f.tab) && f.x >= z.x && f.y >= z.y && f.x + f.w <= z.x + z.w && f.y + f.h <= z.y + z.h && f.label && !kanji.test(f.label) && f.shop === "kd_sticker") && KS.TABS.every((t) => F.some((f) => f.tab === t)), "たな 6つ（ぜんぶの タブ・うりばの なか）");
  ok(["stkshelf", "stkspin", "stktable", "stkcase"].every((k) => F.some((f) => f.kind === k)) && r1.fixtures.some((f) => f.kind === "npc" && f.label === "シールの てんいんさん") && r1.fixtures.some((f) => f.kind === "hangsign" && f.text === "シール うりば"), "たな・くるくる ラック・テーブル・ショーケース・てんいんさん・つりさげの ふだ");
  for (let y = z.y; y < z.y + z.h; y++) ok(r1.rows[y].slice(z.x, z.x + z.w) === "s".repeat(z.w), `うりばの ゆか（${y}）`);
  ok(r1.mats.s === "ksticker" && R.KadenHallArt.MAT.ksticker, "うりばの ゆかの いろ");
  ok(!r1.fixtures.some((f) => f.kind === "planter" && f.x === 13 && f.y === 20), "うりばの うえきばちを どけた");
  ok(R.MallGuide.places(r1).some((p) => p.zone && p.zone.shop === "kd_sticker"), "フロアマップに シール");
  ok(/シール うりば/.test(r1.fixtures.find((f) => f.label === "サービス カウンター").text), "サービス カウンターの ことば");
  KS.patch1(r1); ok(r1.zones.filter((q) => q.shop === "kd_sticker").length === 1 && r1.fixtures.filter((f) => f.action === "stickers").length === 6, "patch1 を 2かい よんでも ふえない");
  ok(R.KadenHall.stickerHook === true, "たなを タップすると うりばの がめん（KadenHall.interact）");
  for (const f of F) { const m = R.KadenHallArt.model(f); ok(m && svgOk(m.svg.replace(/<text[^>]*>[^<]*<\/text>/g, "")) && m.vb.h > 20, `${f.label} の 絵`); }
  ok(new Set(F.map((f) => R.KadenHallArt.modelKey(f))).size === 6, "たなの 絵の キーは 6つ（variant で ちがう）");
}

// ---- 8. ことば・そとへの つうしん・CSS ----
for (const f of ["../js/kaden-stickers.js", "../js/kaden-sticker-art.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|Math\.random|SvgCache\.get\(/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん しない・でたらめを つかわない`);
  const code = src.split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ [^"`]*$/, "")).join("\n");
  for (const m of code.matchAll(/"([^"\n]*)"|`([^`\n]*)`/g)) { const t = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ""); ok(!kanji.test(t), `${f} の ことばに 漢字: ${t.slice(0, 40)}`); }
}
{
  const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
  ok(/\.stk-shaka\.shake > \.stk-shk-up/.test(css) && /@keyframes stk-squish/.test(css) && /@keyframes stk-jelly/.test(css) && /\.stk-grp/.test(css) && /\.kst-card/.test(css) && /\.kst-buy \{ min-height:44px/.test(css) && /\.kst-tabs \.btn \{ min-height:44px/.test(css), "CSS（シャカシャカ・ふにっ・ぷるん・まとまり・うりば）");
  const sb = readFileSync(new URL("../js/sticker-book.js", import.meta.url), "utf8");
  ok(/LAYER_URLS\[key\] = L && L\[k\] \? U\.svgUrl\(L\[k\]\) : url\(id\)/.test(sb) && /sticker_shaka/.test(sb) && /sticker_puni/.test(sb) && /sticker_snip/.test(sb), "シャカシャカの 絵は シール 1しゅに 4まい まで（キャッシュ）・こうかおん");
}
console.log(`Kaden stickers (UI-57): ${n} checks — ${NEW.length} new stickers (marshmallow ${by("puku").length}, drop ${by("drop").length}, shaker ${by("shaka").length} with 4 layers, flake ${by("flake").length}, tile sheet 1 + tiles 9 + Heisei retro 4, materials 6), 12 packs (200-600 coins), buy, cut the tile sheet into 9, tray groups, 1F sticker corner (6 fixtures, floor map), kana texts`);
