// ガチャガチャの もり（Meeときょれじゃ 4F・js/gacha-forest.js・js/gacha-forest-art.js・UI-52。js/gacha-forest-more.js の 6シリーズ・UI-62）の 検査。ブラウザ なしで
// 24シリーズ × 4しゅ・家具／もちもの／かぶりもの・スクイーズ（さわると むにっ）・4F の 配置（エスカレーター・台・まえに たてる・あんない・フロアマップ）・3F の のぼり エスカレーター・絵を たしかめる。
// しゅうがわり（どの 台に どの シリーズか）は tools/check-mee-rotation.mjs。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Gacha: GA, GachaForest: GF, GachaForestArt: FA, GachaForestMore: GM, MeeRotation: MR } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
// おなじ タグに おなじ 属性が 2かい あると SVG が こわれて なにも うつらない（きりかぶの ベンチの stroke で あった）
const dupAttr = (s) => { for (const m of s.matchAll(/<[a-zA-Z][^<>]*>/g)) { const names = [...m[0].matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return m[0].slice(0, 90); } return ""; };
const svgOk = (s) => typeof s === "string" && s.startsWith("<svg") && s.trim().endsWith("</svg>") && !/NaN|undefined/.test(s) && !dupAttr(s);

// ---- 1. シリーズ（2F の 12 の あとに 18・シールの 3 の あとに 6〔UI-62〕）----
const F = GA.SERIES.filter((s) => s.forest), F0 = F.filter((s) => !s.more), FM = F.filter((s) => s.more);
ok(GA.SERIES.length >= 39 && F0.length === 18 && GF.SERIES.length === 18 && GF.first === 12 && F0.every((S, i) => S.index === 12 + i && GA.SERIES[12 + i] === S && GF.index[S.id] === S.index), "4F の 18シリーズは 12〜29 ばん");
ok(FM.length === 6 && GM.SERIES.length === 6 && GM.first === 33 && FM.every((S, i) => S.index === 33 + i && GA.SERIES[33 + i] === S && GM.index[S.id] === S.index && GM.SERIES[i] === S), "4F の あたらしい 6シリーズは 33〜38 ばん（シールの あと）");
ok(GA.SERIES.slice(0, 12).every((s) => !s.forest), "2F の 12シリーズは そのまま");
ok(F0.map((s) => s.id).join() === "machi3,machizoo,squishbread,squishmochi,squishsweet,pouchzoo,pouchsnack,mejitrio,mejiforest,minikaden,foodsample,townmini,oshiri,kaburi,minigakki,minibungu,forestpal,kinoko", "シリーズの じゅんばん（台の ばんごう）");
ok(FM.map((s) => s.id).join() === "machisea,squishfruit,pouchsea,mejiyasai,minimatsuri,minisports", "あたらしい シリーズの じゅんばん");
ok(new Set(GA.SERIES.map((s) => s.id)).size === GA.SERIES.length && new Set(GA.ITEMS.map((it) => it.id)).size === GA.ITEMS.length && GA.ITEMS.length === GA.SERIES.length * 4, "id が かさなる");
ok(new Set(GA.SERIES.map((s) => s.color.toUpperCase())).size === GA.SERIES.length, "台の いろが ぜんぶ ちがう（ぜんぶの 台）");
ok(F0.filter((s) => s.kind === "furn").length === 13 && F0.filter((s) => s.kind === "wear").length === 5 && FM.filter((s) => s.kind === "furn").length === 4 && FM.filter((s) => s.kind === "wear").length === 2, "家具 13＋4シリーズ・もちもの／かぶりもの 5＋2シリーズ");
ok(F.filter((s) => s.hand).map((s) => s.id).join() === "pouchzoo,pouchsnack,mejitrio,mejiforest,pouchsea,mejiyasai" && F.filter((s) => s.acc).map((s) => s.id).join() === "kaburi", "ポーチ・めじるしは もちもの、かぶりものは アクセサリー");
ok(F.filter((s) => s.squish).map((s) => s.id).join() === "squishbread,squishmochi,squishsweet,squishfruit", "スクイーズ 4シリーズ");
// あたらしい シリーズは しま 1つに 1つずつ（しゅうがわりで まわる。ISLES の add・rest）
ok(GF.ISLES.every((I) => Array.isArray(I.add) && I.add.length === 1 && GM.index[I.add[0]] >= 33 && Number.isInteger(I.rest) && I.rest >= 0 && I.rest < 3 && I.id) && new Set(GF.ISLES.flatMap((I) => I.add)).size === 6 && FM.every((S) => GF.ISLES.some((I) => I.id === S.isle && I.add[0] === S.id)), "あたらしい 6シリーズは しまに 1つずつ");
for (const S of F) {
  ok(S.list.length === 4 && S.list.filter((it) => it.rare).length === 1 && S.list[GA.RARE].rare && S.list.every((it) => it.series === S.index && GA.seriesOf(it.id) === S), `${S.name}: 4しゅで レアは 1つ`);
  ok(S.name && !kanji.test(S.name) && S.name.length <= 10 && /^#[0-9A-F]{6}$/i.test(S.color) && S.caps.length >= 2 && GA.byId(S.id) === S, `${S.name}: なまえ（10もじ まで）・いろ`);
  for (const it of S.list) {
    ok(it.name && !kanji.test(it.name) && it.name.length <= 13 && it.desc && !kanji.test(it.desc) && it.desc.length <= 40, `けいひん「${it.name}」: ひらがな・カタカナ・ながさ`);
    ok(R.ItemDexSources.source(it.kind, it.kind === "wear" ? R.ITEM_INDEX[it.id] : R.FURN_INDEX[it.id]) === `Meeときょれじゃ の ガチャガチャ「${S.name}」で でるよ${it.rare ? "（レア）" : ""}。`, `ずかんの ヒント ${it.id}`);
  }
}
// ほんものの はやりの けいひん（オーナーの FB「待ちぼうけや、スクイーズ、ポーチ、目印アクセサリー、面白いグッズなど」）
const names = GA.ITEMS.map((it) => it.name).join(" ");
for (const w of ["まちぼうけ", "スクイーズ", "ポーチ", "めじるし", "サンプル", "おしり", "かぶりもの", "ミニチュア"]) ok(names.includes(w) || F.some((S) => S.name.includes(w)), `けいひんに「${w}」が ない`);

// ---- 2. 家具（へやに かざる）・スクイーズ ----
for (const it of F.flatMap((S) => S.list).filter((x) => x.kind === "furn")) {
  const f = R.FURN_INDEX[it.id];
  ok(f && R.FURNITURE.includes(f) && f.exclusive === "gacha" && f.gachaPrize && f.kind === "floor" && f.w > 0 && f.h > 0 && f.depth > 0 && !("sparkle" in f), `家具 ${it.id}`);
  ok((it.id === "gacha_machi3_3") === (f.w === 90), `ひろい フィギュアは 3にんの まちぼうけ だけ ${it.id}`);
  const art = R.FURN_ART[it.id]();
  ok(svgOk(art) && art.includes(`width="${f.w}" height="${f.h}"`), `家具の 絵 ${it.id}`);
  const s = FA.figure(it.id); ok(svgOk(s) && /viewBox="0 0 (100|180) 110"/.test(s), `フィギュアの 絵 ${it.id}`);
  const d = ids(s); ok(new Set(d).size === d.length, `フィギュア ${it.id} の id が かさなる`);
  const m = R.HomeDesign.model(it.id, { id: it.id, x: 300, y: 300 });
  ok(m && svgOk(m.svg || m.full || "<svg></svg>"), `へやの 立体 ${it.id}`);
}
ok(GF.SQUISH.size === 16 && [...GF.SQUISH].every((id) => /^gacha_squish(bread|mochi|sweet|fruit)_\d$/.test(id) && R.FurnLive.LIVE.has(id) && R.FURN_INDEX[id].interactive && R.FurnModels.has(id)), "スクイーズ 16しゅは さわれる（FurnLive）・たった 絵（FurnModels）");
ok(Math.abs(GF.squash(0) - 1) < 1e-9 && GF.squash(-0.1) === 0 && GF.squash(1.2) === 0 && Math.abs(GF.squash(0.6)) < 0.1 && Math.abs(GF.squash(1.05)) < 0.02, "むにっ（つぶれて ゆれて もどる）");
{
  const src = readFileSync(new URL("../js/gacha-forest.js", import.meta.url), "utf8");
  ok(/SvgCache\.get\("gachasq:" \+ id \+ ":" \+ px/.test(src) && /Math\.ceil\(\(f\.w \* s \* \(G\.px \|\| 2\)\) \/ 8\) \* 8/.test(src), "スクイーズの 絵の キーは 家具と 大きさ（8px きざみ）だけ");
}

// ---- 3. もちもの（ポーチ・めじるし）・かぶりもの ----
for (const it of F.flatMap((S) => S.list).filter((x) => x.kind === "wear")) {
  const w = R.ITEM_INDEX[it.id], S = GA.seriesOf(it.id);
  ok(w && R.WEAR_ITEMS.includes(w) && w.exclusive === "gacha" && w.gachaPrize && w.slot === (S.hand ? "hand" : "head") && typeof R.WEAR[w.wear] === "function" && w.price > 0 && w.st && w.st.sp >= 1, `もちもの・かぶりもの ${it.id}`);
  for (const who of R.Chara.IDS) for (const dir of ["down", "right", "left", "up"]) {
    const s = R.Chara.svg(who, { pose: "idle_01", face: "happy", dir, outfit: { [it.slot]: it.id }, color: "soft" });
    ok(svgOk(s), `${it.id}（${who}・${dir}）`);
    const d = ids(s); ok(new Set(d).size === d.length, `${it.id}（${who}・${dir}）の id`);
  }
  ok(svgOk(R.Art.iconSvg("wear", it.id)), `アイコン ${it.id}`);
}
ok(F.filter((s) => s.id === "kaburi").flatMap((s) => s.list).every((it) => R.HeadPair.kind(it.id) === "hat"), "かぶりものは ぼうしの なかま（2つめの あたまには つけない）");
// おみせには ならばない（もちものの たなも）
for (const shop of Object.values(R.BUY_SHOPS)) for (const tab of ["head", "face", "neck", "body", "back", "hand", "floor", "wall", "food", "tool", ""]) {
  let list = []; try { list = shop.items(tab) || []; } catch (e) { list = []; }
  ok(!list.some((i) => i && GA.INDEX[i.id]), `おみせ ${shop.name} に ガチャの けいひんが ならぶ`);
}

// ---- 4. 台の 絵（ガチャの がめん・館の 台）----
for (const S of F) {
  const s = R.GachaArt.machine(S, "");
  ok(svgOk(s) && s.includes("#7DBA4C") && s.includes("#C98E5C"), `台の 絵（はっぱ・どんぐり）${S.id}`);
}
for (const S of GA.SERIES.filter((s) => !s.forest)) ok(!R.GachaArt.machine(S, "").includes("#7DBA4C"), `2F の 台には はっぱを つけない ${S.id}`);

// ---- 5. 4F の 配置 ----
const fl = R.VenueHalls.defs.arcade.floors, f4 = fl[4], f3 = fl[3], I = R.IsoVenue, E = R.IkeArcade.ESC4;
ok(Object.keys(fl).join() === "1,2,3,4" && f4 && f4.id === "arcade4" && f4.iso && f4.w === 28 && f4.h === 22 && f4.rows.length === 22 && f4.rows.every((r) => r.length === 28), "4F（28×22）");
ok(f4.short === "ガチャガチャの もり" && f4.title === "Meeときょれじゃ 4F" && f4.carpet === "forest" && f4.theme === "forest" && f4.below === "puri", "4F の なまえ・もりの ゆかと かべ");
const walk = (r, [x, y]) => x >= 0 && y >= 0 && x < r.w && y < r.h && !I.solidAt(r, x, y) && !r.fixtures.some((f) => !f.walk && !f.over && f.kind !== "hangsign" && x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
const reach = (r, from) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = [x + dx, y + dy], k = p.join(); if (!seen.has(k) && walk(r, p)) { seen.add(k); q.push(p); } } } return seen; };
const g4 = f4.fixtures.filter((f) => f.kind === "gacha" && GA.SERIES[f.series] && GA.SERIES[f.series].forest); // シールの 台（30〜32）は tools/check-stickers.mjs
// 台に はいって いるのは その しゅうの 18シリーズ（js/mee-rotation.js。24シリーズの うち 6つは おやすみ）
const now = MR.info().rings.filter((r) => r.floor === 4).flatMap((r) => r.slots.map((x) => x.si)).sort((a, b) => a - b).join();
ok(g4.length === 18 && new Set(g4.map((f) => f.series)).size === 18 && [...g4.map((f) => f.series)].sort((a, b) => a - b).join() === now && g4.every((f) => f.variant === f.series && f.action === "gacha" && f.w === 1 && f.h === 1), "4F に ガチャ 18だい（1シリーズ 1だい・いまの しゅうの ならび）");
// まんなかの ガチャの しま（オーナーの FB 2026-10-03「真ん中の木は消して、ガチャをメインにもってこい」）: 3だいずつ 6くみ・カプセルもようの ゆか・おくの れつに テーマの かんばん・てまえに しきり
{
  const isles = GF.ISLES, at = (f) => f4.rows[f.y][f.x];
  ok(isles.length === 6 && isles.every((I) => I.ids.length === 3 && I.ids.every((id) => GF.index[id] >= GF.first)) && new Set(isles.flatMap((I) => I.ids)).size === 18, "ガチャの しまは 3だい × 6くみ（さいしょは 18しゅ）");
  ok(g4.every((f) => f.dir === "y" && at(f) === "g" && f.x >= 3 && f.x <= 22 && f.y >= 4 && f.y <= 10), "18だい ぜんぶ まんなかの ガチャの しま（カプセルもようの ゆか）");
  ok(!g4.some((f) => f.y === 0 || f.x === 0), "かべぎわに 4F の ガチャが のこって いない");
  for (const I of isles) {
    const ms = [0, 1, 2].map((k) => g4.find((f) => f.ring === "4f-" + I.id && f.slot === k)), pool = [...I.ids, ...I.add].map((id) => GA.byId(id).index);
    ok(ms.every((f, k) => f && f.x === I.x + k && f.y === (I.back ? 5 : 8) && f.spots.join() === [f.x, f.y + 1].join() && pool.includes(f.series)) && ms[0].label === I.name && !kanji.test(I.name), `しま「${I.name}」の 3だい（しまの シリーズ）`);
    ok(f4.fixtures.some((f) => (I.back ? f.kind === "gachaboard" && f.variant === I.board && f.y === 4 : f.kind === "divider" && f.y === 7) && f.x === I.x && f.w === 3), `しま「${I.name}」の うしろの ${I.back ? "かんばん" : "しきり"}`);
    if (I.back) { const b = f4.fixtures.find((f) => f.kind === "gachaboard" && f.variant === I.board), m = R.ArcadeArt.model(b); ok(m && m.svg.includes(I.name), `しま「${I.name}」の かんばんの もじ`); }
  }
  ok(!f4.fixtures.some((f) => f.kind === "ftree" && (f.big || (f.x > 2 && f.y > 2))) && !f4.zones.some((z) => /もりの き/.test(z.label)), "まんなかの おおきな もりの き は ない（フロアマップにも）");
  const places = R.MallGuide.places(f4).map((p) => p.label);
  ok(["ガチャの しま（にし）", "ガチャの しま（ひがし）"].every((l) => places.includes(l)), "フロアマップに ガチャの しま " + places.join("・"));
}
ok(![1, 2, 3].some((k) => fl[k].fixtures.some((f) => f.kind === "gacha" && f.series >= 12)), "4F の シリーズは ほかの 階に ない");
const down = f4.fixtures.find((f) => f.kind === "escalator" && f.to === 3), up = f3.fixtures.find((f) => f.kind === "escalator" && f.to === 4);
ok(down && up && down.dir === "down" && up.x === E.x && up.y === E.y && down.x === E.x && down.y === E.y && up.w === E.w && up.h === E.h, "3F ⇄ 4F の エスカレーター（南東の すみ・IkeArcade.ESC4）");
ok(f4.holes.length === 1 && f4.holes[0].x === E.x && f4.holes[0].y === E.y + 1 && f4.holes[0].h === E.h - 1, "4F の ふきぬけ");
ok(f3.fixtures.some((f) => f.kind === "slab" && f.over && Math.abs(f.x - (E.x - 0.3)) < 1e-9) && f3.fixtures.some((f) => f.kind === "hangsign" && f.text === "4F ガチャの もり") && f4.fixtures.some((f) => f.kind === "hangsign" && f.text === "3F ぷりくら"), "3F の うえの ゆかの ふち・つりさげの あんない");
ok(walk(f4, up.spawn) && walk(f3, down.spawn) && walk(f4, f4.spawn) && walk(f4, f4.elevatorSpawn), "エスカレーターの おりばに たてる");
{
  const R4 = reach(f4, up.spawn), acts = f4.fixtures.filter((f) => f.action && f.action !== "floor");
  for (const f of acts) ok(f.spots && f.spots.length && f.spots.some((p) => walk(f4, p) && R4.has(p.join())), `4F の ${f.label || f.kind}（${f.x},${f.y}）の まえに たてる`);
  // エスカレーターは まわりの いちばん ちかい マスまで あるいて のる（VenueScene.request）
  const ring = (f) => { const out = []; for (let y = f.y - 1; y <= f.y + f.h; y++) for (let x = f.x - 1; x <= f.x + f.w; x++) if (x === f.x - 1 || x === f.x + f.w || y === f.y - 1 || y === f.y + f.h) out.push([x, y]); return out; };
  ok(ring(down).some((p) => walk(f4, p) && R4.has(p.join())) && ring(down).filter((p) => p[1] === E.y - 1).every((p) => walk(f4, p) && R4.has(p.join())), "4F の くだり エスカレーターの のりば（きたがわ）に いける");
  const R3 = reach(f3, down.spawn);
  for (const f of f3.fixtures.filter((f) => f.action && f.action !== "floor")) ok(f.spots && f.spots.some((p) => walk(f3, p) && R3.has(p.join())), `3F の ${f.label || f.kind}（${f.x},${f.y}）の まえに たてる（4F の エスカレーターを たした あと）`);
}
// ゆかの 什器が かさならない・ゆかの なか
{
  const solid = f4.fixtures.filter((f) => !f.over && !f.walk && f.kind !== "hangsign" && f.kind !== "escalator");
  for (const f of solid) ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= 28 && f.y + f.h <= 22, `4F の ${f.kind}（${f.x},${f.y}）は ゆかの なか`);
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) { const a = solid[i], b = solid[j]; ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `4F の ${a.kind}（${a.x},${a.y}）と ${b.kind}（${b.x},${b.y}）が かさなる`); }
  const esc = { x: E.x, y: E.y, w: E.w, h: E.h };
  for (const f of f3.fixtures.filter((f) => !f.over && !f.walk && f.kind !== "hangsign" && f.kind !== "escalator")) ok(f.x + f.w <= esc.x || esc.x + esc.w <= f.x || f.y + f.h <= esc.y || esc.y + esc.h <= f.y, `3F の ${f.label || f.kind}（${f.x},${f.y}）が 4F への エスカレーターに かさなる`);
}
// あんない・おおきな カプセル・どうぶつの オブジェ・フロアマップ
{
  const dir = f4.fixtures.find((f) => f.kind === "directory"), cap = f4.fixtures.find((f) => f.kind === "fcapsule"), st = f4.fixtures.filter((f) => f.kind === "fstatue");
  ok(dir && dir.variant === "forest" && dir.here === "4F" && /200コイン/.test(dir.text) && /カプセルを あけて/.test(dir.text), "もりの あんない");
  ok(cap && cap.fig === "gacha_machi3_3" && FA.FIG[cap.fig] && st.map((f) => f.variant).sort().join() === "bear,deer,owl", "おおきな カプセル・どうぶつの オブジェ 3つ");
  ok(fl[1].fixtures.some((f) => f.kind === "directory" && /4F ガチャガチャの もり/.test(f.text) && /4F へは 3F の ベンチの よこの エスカレーター/.test(f.text)), "1F の フロア あんないに 4F");
  for (const z of f4.zones) ok(R.MallArt.SHOP[z.shop] && z.label && !kanji.test(z.label) && z.map && z.x >= 0 && z.y >= 0 && z.x + z.w <= 28 && z.y + z.h <= 22, `4F の フロアマップの へや ${z.label}`);
  ok(g4.every((f) => f4.zones.some((z) => f.x >= z.x && f.x < z.x + z.w && f.y >= z.y && f.y < z.y + z.h)), "フロアマップに ガチャの へや");
  for (const f of f4.fixtures) for (const t of [f.label, f.text]) if (t) ok(!kanji.test(t), `4F の ことばに 漢字: ${t}`);
  for (const side of ["north", "west"]) for (const p of f4.walls[side]) ok(!kanji.test(p.text || "") && p.from >= 0 && p.to <= 28 && p.from < p.to, `4F の かべ ${p.text}`);
}
// 4F の 什器の 絵（MallArt の しくみ・スプライトの はんいに はいる）
for (const f of f4.fixtures.filter((f) => f.kind !== "npc" && f.kind !== "escalator" && f.kind !== "hangsign")) {
  const m = R.ArcadeArt.model(f);
  ok(m && svgOk(m.svg) && m.vb.w > 0 && m.vb.h > 0 && !/NaN|undefined/.test(R.ArcadeArt.modelKey(f)), `4F の ${f.kind}（${f.x},${f.y}）の 絵`);
  if (["ftree", "fstatue", "fcapsule", "fmush", "fbush", "fhedge"].includes(f.kind)) ok(m.vb.h >= (f.height || 40) * 0.8, `4F の ${f.kind} の 絵の たかさが たりない（きれる）${m.vb.h}`);
}
ok(new Set(f4.fixtures.filter((f) => f.kind === "directory").map((f) => R.ArcadeArt.modelKey(f))).size === 1 && R.ArcadeArt.modelKey(f4.fixtures.find((f) => f.kind === "directory")) !== R.ArcadeArt.modelKey(fl[1].fixtures.find((f) => f.kind === "directory")), "あんないの 絵の キーは 1F と ちがう");
for (const side of ["north", "west"]) { const w = R.ArcadeArt.wallSvg(f4, side); ok(svgOk(w.svg) && w.svg.includes("#8A6142") && !w.svg.includes("#FF8FB8\" stroke-width=\"3\""), `4F の かべ（木の こしいた・LED なし）${side}`); }
for (const side of ["north", "west"]) ok(!R.ArcadeArt.wallSvg(f3, side).svg.includes("#8A6142"), `3F の かべは まえの まま ${side}`);
ok(R.ArcadeArt.backdrop(f4).join() === "#12241A,#24402C" && R.ArcadeArt.backdrop(f3).join() === "#15122A,#2B2447", "そとの いろ（4F は もり）");

// ---- 6. そとへの つうしん なし・ことば ----
for (const f of ["../js/gacha-forest.js", "../js/gacha-forest-art.js", "../js/gacha-forest-more.js", "../js/mee-rotation.js"]) {
  const src = readFileSync(new URL(f, import.meta.url), "utf8");
  ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage/.test(src) && (src.match(/https?:\/\/[^"'`\s]+/g) || []).every((u) => u === "http://www.w3.org/2000/svg"), `${f}: そとへ つうしん する`);
}
for (const f of ["../js/gacha-forest.js", "../js/gacha-forest-more.js", "../js/mee-rotation.js"]) {
  // コメント（// の あと）を のぞいた 1ぎょうの なかの もじれつ
  const src = readFileSync(new URL(f, import.meta.url), "utf8").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  for (const m of src.matchAll(/"([^"\n]*[ぁ-んァ-ヶ][^"\n]*)"/g)) ok(!kanji.test(m[1]), `${f}: ことばに 漢字: ${m[1]}`);
}
console.log(`Gacha forest (4F): 18 + 6 series x 4 (12-29 and 33-38, unique colours, kana names), furniture/hand items/head gear registered and not sold, 16 squishies (FurnLive + FurnModels, finite keys), leafy machines, 28x22 floor with this week's 18 machines on six central gacha islands (no centre tree), 3F<->4F escalator, everything reachable and not overlapping, forest floor/walls, directory and floor map — ${n} checks OK`);
