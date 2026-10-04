// パズルの おてつだい「パズル こうぼう」（js/kobo-art.js・js/mg-kobo.js・UI-65）の 検査。ブラウザ なしで たしかめる。
// とうろく（おみせ・店主・セーブ・店内・BGM・ディスク・ごほうび・ちずの めじるし・町の 建物）・3しゅの ゲーム（えらぶ・せつめい）・
// スライド パズル（かならず とける・いちばん すくない てかずの はんい・タップの きまり・ヒントで とける・てかずの 減点）・
// かたち はめ（あなと ピースの かず・にた かたち・おおきさ ちがい・まわす かず・タップで まわる・ちがう あなは もどって 減点・むきだけ ちがうと もどる）・
// おえかき ロジック（もんだい 24 は ならびの ヒントだけで 1とおりに とける・すうじ・ちがう ますは ばつ・なぞる・おわった れつ）・
// 2つの スマホの 画面（390×844・375×667）で はみださない・44px・絵（NaN なし・id は 一意・キャッシュの キーは 有限）・ことばは ひらがな。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { KoboArt: A, KoboGames: KG, BrainGames, SHOP_GAMES, KoboSlideTask: Slide, KoboShapeTask: Shape, KoboLogicTask: Logic, KOBO_TASKS, KoboTask, SHOPS, SHOP_OWNERS, HOWTO, MG_TASKS, Save, STORE_INTERIORS, StoreIso, StoreIsoArt, SONGS, GameEconomy, AreaMap, AreaMapArt, SIGN_ICON, MAP_DEFS, ShopRewards, MusicDiscs } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const fake = (variant) => ({ timePenalty: () => 0, finish(s) { this.done = s; }, mistake(t) { this.said = t; }, addFx() {}, bubbleRect: null, orderT: 0, variant });
const svgOk = (svg, where) => {
  ok(typeof svg === "string" && svg.length > 40 && !/NaN|undefined|Infinity/.test(svg), `${where}: 絵（NaN なし）`);
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  ok(new Set(ids).size === ids.length, `${where}: id が かさなる`);
};
// ShopScene と おなじ 作業エリア（js/minigames.js の layout）: 390×844・375×667（dpr 1）
const area = (cw, ch) => { const tile = Math.max(16, Math.round((32 * cw) / 360)), px = tile / 32, W = cw / px, H = ch / px, viewH = Math.round(Math.min(H * 0.4, 330)); return { R: { x: 10, y: viewH + 40, w: W - 20, h: H - viewH - 52 }, px }; };
const PHONES = [[390, 844], [375, 667]].map(([w, h]) => ({ name: `${w}×${h}`, ...area(w, h) }));
const inside = (b, R) => b.x >= R.x - 0.5 && b.y >= R.y - 0.5 && b.x + b.w <= R.x + R.w + 0.5 && b.y + b.h <= R.y + R.h + 0.5;

// ---- 1. とうろく ----
ok(SHOPS.kobo && SHOPS.kobo.name === "パズル こうぼう" && SHOPS.kobo.rounds === 4 && SHOPS.kobo.lines.length === 4 && SHOPS.kobo.lines.every((l) => !kanji.test(l)) && !kanji.test(SHOPS.kobo.desc), "おみせ（4にん・ことば）");
ok(MG_TASKS.kobo === KoboTask && Object.keys(KOBO_TASKS).join() === "slide,shape,logic", "MG_TASKS.kobo は 3しゅの ゲームを えらぶ");
ok(new KoboTask(fake("shape"), 1) instanceof Shape && new KoboTask(fake("logic"), 1) instanceof Logic && new KoboTask(fake(null), 1) instanceof Slide && new KoboTask(fake("slide"), 1) instanceof Slide, "variant で ゲームが きまる（なければ スライド パズル）");
ok(SHOP_GAMES.kobo === KG && SHOP_GAMES.brain === BrainGames && KG.tasks === KOBO_TASKS && BrainGames.tasks.spot && Object.getPrototypeOf(KG) === BrainGames && KG.choose === BrainGames.choose, "ゲームを えらぶ しくみは あたまの たいそうと おなじ（SHOP_GAMES）");
ok(KG.shop === "kobo" && BrainGames.shop === "brain" && !kanji.test(KG.ASK + KG.HELLO), "えらぶ ときの ことば");
ok(SHOP_OWNERS.kobo.sp === "hedgehog" && SHOP_OWNERS.kobo.name === "はりねずみの チクタさん" && /<svg/.test(R.Art.npcSvg({ ...SHOP_OWNERS.kobo, emo: "happy" })), "店主は はりねずみの チクタさん");
const fresh = Save.fresh().shops.kobo;
ok(fresh && fresh.lv === 1 && fresh.plays === 0 && JSON.stringify(fresh.games) === '{"slide":0,"shape":0,"logic":0}' && fresh.last === "", "セーブ（ゲームごとの かず）");
{ // ふるい セーブ（kobo が ない）を よむと たりない ところを おぎなう
  const old = Save.fresh(); delete old.shops.kobo; const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(m.shops.kobo) === JSON.stringify(fresh) && m.v === Save.SCHEMA, "ふるい セーブに kobo を おぎなう（SCHEMA は そのまま）");
}
ok(GameEconomy.shopBase.kobo === 40 && GameEconomy.pay("kobo", 1, 3) > GameEconomy.pay("kobo", 1, 2), "ほうしゅう");
{ // BGM: この ゲームの ために つくった きょく（8小節 × 8トークン）
  const S = SONGS.shop_kobo;
  ok(S && S.title === "からくり こうぼう" && S.original === true && !S.source && S.modern && S.tracks.length === 6, "BGM（オリジナルの きょく）");
  for (const t of S.tracks) { const bars = t.notes.split("|").map((b) => b.trim().split(/\s+/)); ok(t.drum ? bars.length === 1 && bars[0].length === 8 : bars.length === 8 && bars.every((b) => b.length === 8), "BGM の ならび " + (t.instrument || "drum")); }
  for (const t of S.tracks) if (!t.drum) for (const tok of t.notes.split(/[\s|]+/).filter(Boolean)) ok(/^([._]|([A-G](#|b)?[1-7])(\+[A-G](#|b)?[1-7])*)$/.test(tok), "BGM の おと " + tok);
}
ok(MusicDiscs.DISCS.some((d) => d.id === "disc_shop_kobo" && d.song === "shop_kobo" && d.from.shop === "kobo"), "おてつだいの ディスク");
ok(AreaMap.SHOP_ICON.kobo === "jigsaw" && AreaMapArt.ICON.jigsaw, "ちずの めじるし（ジグソー）");
svgOk(SIGN_ICON.kobo(0, 0), "かんばんの しるし");
{
  const I = STORE_INTERIORS.kobo;
  ok(I && I.fixtures.length >= 12 && !kanji.test(I.caption) && I.fixtures.every((f) => !kanji.test(f[5] || "")), "店内（12 いじょうの 什器・ひらがな）");
  for (const kind of ["slideframe", "jigsawwall", "workbench", "shapesorter", "cubes", "picross"]) ok(I.fixtures.some((f) => f[0] === kind), `店内に ${kind}`);
  for (const f of StoreIso.fixtures("kobo")) if (f.kind !== "keeper" && f.kind !== "npc") { const m = StoreIsoArt.model(f); ok(m && m.svg.length > 400 && !/NaN|undefined/.test(m.svg), `店内の 絵 ${f.kind}`); }
}
{
  const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home2");
  ok(b && b.act.type === "work" && b.act.shop === "kobo" && b.label === "パズル こうぼう" && b.asset === "nerikasu.bld_nerikasu_home2" && b.sign === "kobo", "ネリカスタウンの お店（nerikasu_home2）");
}
ok(ShopRewards.prizes.filter((p) => p.shop === "kobo").map((p) => p.id).join() === "shop_kobo_5,shop_kobo_10,shop_kobo_15,shop_kobo_30", "ごほうびの かぐ 4つ");

// ---- 2. えらぶ・せつめい ----
ok(KG.GAMES.map((g) => g.id).join() === "slide,shape,logic" && KG.GAMES.every((g) => !kanji.test(g.name + g.desc) && g.name.length <= 9 && width(`・${g.name}：${g.desc}`) <= 19.5), "3しゅの なまえと ひとこと（ひらがな・みじかく）");
for (const v of ["slide", "shape", "logic", null]) {
  const lines = HOWTO.kobo({ variant: v });
  ok(Array.isArray(lines) && lines.length === 4 && lines[0] === KG.HELLO && lines.slice(1).join() === KG.game(v).howto.join(), `せつめい（${v}）は えらんだ ゲームの ぶん`);
  for (const l of lines) { ok(!kanji.test(l), "せつめいに 漢字: " + l); for (const row of l.split("\n")) ok(width(row) <= 26, `せつめいの 1行が ながい「${row}」`); }
}
ok(KG.howto("slide").some((l) => /おてほん/.test(l)) && KG.howto("shape").some((l) => /まわる/.test(l)) && KG.howto("logic").some((l) => /なぞる/.test(l)), "せつめいの なかみ");
ok(HOWTO.brain({ variant: "pair" }).some((l) => /カード/.test(l)), "あたまの たいそうの せつめいも かわらない");

// ---- 3. スライド パズル ----
// 3×3 の ぜんぶの ならびの いちばん すくない てかず（はばの ひろい たんさく）で、Slide.solve が いちばん すくない ことを たしかめる
const BFS3 = (() => {
  const start = "012345678", dist = new Map([[start, 0]]), q = [start];
  for (let i = 0; i < q.length; i++) { const s = q[i], b = s.indexOf("8"), d = dist.get(s); for (const p of Slide.nbrs(b, 3)) { const a = [...s]; a[b] = a[p]; a[p] = "8"; const t = a.join(""); if (!dist.has(t)) { dist.set(t, d + 1); q.push(t); } } }
  return dist;
})();
ok(BFS3.size === 181440, "3×3 は はんぶんの ならびだけ とける（9!/2）");
const RANGE = [[3, 3, 4], [3, 5, 7], [3, 8, 10], [3, 11, 13], [4, 10, 12]];
for (let lv = 1; lv <= 5; lv++) {
  const [nn, lo, hi] = RANGE[lv - 1], pars = new Set(), pics = new Set();
  for (let rep = 0; rep < 120; rep++) {
    const t = new Slide(fake("slide"), lv);
    ok(t.n === nn && t.tiles.length === nn * nn && new Set(t.tiles).size === nn * nn && !t.solved, `slide Lv${lv}: ${nn}×${nn} の いた（そろって いない）`);
    ok(t.par >= lo && t.par <= hi && t.allow === Math.ceil(t.par * 1.5) + 4, `slide Lv${lv}: てかず ${t.par}（${lo}〜${hi}）`);
    if (nn === 3) ok(BFS3.get(t.tiles.join("")) === t.par, `slide Lv${lv}: いちばん すくない てかず（${BFS3.get(t.tiles.join(""))} / ${t.par}）`);
    const s = Slide.solve(t.tiles, nn), u = [...t.tiles];
    for (const p of s.path) { const b = u.indexOf(nn * nn - 1); ok(Slide.nbrs(b, nn).includes(p), `slide Lv${lv}: とく てじゅんは となりの いた`); u[b] = u[p]; u[p] = nn * nn - 1; }
    ok(s.length === t.par && u.every((id, p) => id === p), `slide Lv${lv}: てじゅんどおりで そろう`);
    pars.add(t.par); pics.add(t.pic);
  }
  ok(pars.size === hi - lo + 1 && pics.size === 3, `slide Lv${lv}: てかず ${[...pars]}・え ${[...pics]}`);
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) {
  const t = new Slide(fake("slide"), lv); t.layout(ph.R);
  const B = t.board;
  ok(inside({ x: B.x - B.m, y: B.y - B.m, w: B.s + B.m * 2, h: B.s + B.m * 2 }, ph.R) && B.y - B.m >= ph.R.y + 22, `slide ${ph.name}: いたの わくが はみだす`);
  ok((B.s / t.n) * ph.px >= 56, `slide ${ph.name} Lv${lv}: いたが 56px いじょう（${((B.s / t.n) * ph.px).toFixed(1)}）`);
  for (const b of t.btns) ok(inside(b, ph.R) && b.w * ph.px >= 44 && b.h * ph.px >= 44 && b.y >= B.y + B.s + B.m + 4, `slide ${ph.name}: ヒントの ボタン`);
  ok(inside({ x: t.thumb.x - 2, y: t.thumb.y - 2, w: t.thumb.s + 4, h: t.thumb.s + 4 }, ph.R) && t.thumb.y - 2 >= B.y + B.s + B.m + 4 && t.thumb.x - 58 > t.btns[0].x + t.btns[0].w + 70, `slide ${ph.name}: おてほん`);
}
{
  const t = new Slide(fake("slide"), 3); t.layout(PHONES[1].R);
  // そろった ところから: あいた ところ（みぎ した）と おなじ ぎょうの 2つ ひだりを タップ → 2まい うごいて てかず 2
  t.tiles = [...Array(9).keys()]; t.place(); t.moves = 0;
  t.downArea(t.center(6)); ok(t.tiles.join("") === "012345867" && t.moves === 2, "slide: おなじ ぎょうの はなれた いたは まとめて うごく（てかず 2）" + t.tiles.join(""));
  t.downArea(t.center(4)); ok(t.tiles.join("") === "012345867" && t.moves === 2 && t.nudge && t.nudge.pos === 4, "slide: ななめの いたは うごかない（ゆれる）");
  const before = t.tiles.join(); t.downArea(t.center(t.tiles.indexOf(8))); ok(t.tiles.join() === before && t.moves === 2, "slide: あいた ところを タップしても かわらない");
  t.downArea({ x: t.board.x - 20, y: t.board.y }); ok(t.tiles.join() === before, "slide: わくの そとは なにも おきない");
  t.downArea(t.center(8)); ok(t.solved && t.done && t.moves === 4 && t.score() === 100, `slide: もどすと できあがり（${t.score()}）`);
  t.downArea(t.center(5)); ok(t.moves === 4, "slide: できあがった あとは うごかない");
}
for (let lv = 1; lv <= 5; lv++) {
  // ヒントの とおりに うごかすと いちばん すくない てかずで そろう（ヒントは 1かい 10てん）
  const t = new Slide(fake("slide"), lv); t.layout(PHONES[0].R);
  t.hint(); const first = t.hintPos; ok(t.hints === 1 && t.hintT > 0 && Slide.nbrs(t.tiles.indexOf(t.blank), t.n).includes(first), `slide Lv${lv}: ヒントは うごかせる いた`);
  t.hint(); ok(t.hints === 1, `slide Lv${lv}: ヒントの あいだは もう いちど おせない`);
  for (let i = 0; i < 40 && !t.done; i++) { const p = t.nextMove(); t.downArea(t.center(p)); }
  ok(t.done && t.moves === t.par && t.score() === 90 && t.sc.done === 90, `slide Lv${lv}: ヒントの いたで そろう（てかず ${t.moves}・${t.score()}てん）`);
}
{
  const t = new Slide(fake("slide"), 2); t.layout(PHONES[0].R);
  // わざと とおまわり: となりを いったり きたり（めやすを 6て こえる）→ 1て 2.5てん
  const b = t.tiles.indexOf(t.blank), p = Slide.nbrs(b, 3)[0];
  const extra = t.allow + 6 - t.par + ((t.allow + 6 - t.par) % 2);
  for (let i = 0; i < extra; i++) t.downArea(t.center(i % 2 ? b : p));
  for (let i = 0; i < 40 && !t.done; i++) t.downArea(t.center(t.nextMove()));
  ok(t.done && t.moves === t.par + extra && t.score() === 100 - (t.moves - t.allow) * 2.5, `slide: めやすを こえた てかず（${t.moves} / ${t.allow}・${t.score()}てん）`);
  const u = new Slide(fake("slide"), 4); u.layout(PHONES[1].R); ok(u.timeout() < 45 && u.timeout() <= Math.min(40, u.score() - 20), "slide: 時間ぎれは ひくい てん");
  const far = new Slide(fake("slide"), 5); far.layout(PHONES[1].R);
  for (let i = 0; i < 60; i++) { const bb = far.tiles.indexOf(far.blank), q = Slide.nbrs(bb, 4); far.downArea(far.center(q[(i * 7) % q.length])); }
  const t0 = Date.now(), nx = far.nextMove(); ok(Slide.nbrs(far.tiles.indexOf(far.blank), 4).includes(nx) && Date.now() - t0 < 4000, "slide: とおく はなれても ヒントは すぐ でる（4×4）");
}
for (const id of A.PIC_IDS) { svgOk(A.picSvg(id), `スライドの え ${id}`); ok(!kanji.test(A.PICTURES[id][0]), `えの なまえ ${id}`); }

// ---- 4. かたち はめ ----
const SIMILAR = R.KOBO_SIMILAR || [["triangle", "rtri"], ["circle", "hexagon"], ["heart", "drop"], ["square", "diamond"], ["semi", "drop"], ["house", "arrow"]];
const pairsIn = (kinds) => SIMILAR.filter(([a, b]) => kinds.includes(a) && kinds.includes(b)).length;
const SPEC = [[3, 0, 0, 0], [4, 0, 0, 0], [4, 2, 0, 0], [5, 3, 1, 0], [6, 4, 1, 1]];
for (let lv = 1; lv <= 5; lv++) {
  const [k, turns, similar, twin] = SPEC[lv - 1], kindsSeen = new Set();
  for (let rep = 0; rep < 150; rep++) {
    const t = new Shape(fake("shape"), lv);
    const kinds = t.holes.map((h) => h.kind), uniq = [...new Set(kinds)];
    ok(t.k === k && t.holes.length === k && t.pieces.length === k && kinds.every((x) => A.KINDS.includes(x)), `shape Lv${lv}: あな ${k}`);
    ok(uniq.length === k - twin && t.holes.filter((h) => h.size < 1).length === twin && t.holes.every((h) => h.size === 1 || (h.size === 0.68 && t.holes.some((o) => o !== h && o.kind === h.kind && o.size === 1))), `shape Lv${lv}: おおきさ ちがいの ふたご ${twin}`);
    ok(pairsIn(uniq) === similar, `shape Lv${lv}: にた かたちの くみ ${similar}（${uniq}）`);
    if (lv === 1) ok(uniq.every((x) => ["circle", "square", "triangle", "star", "heart", "house", "cross", "diamond"].includes(x)), "shape Lv1: わかりやすい かたち");
    const need = t.pieces.filter((p) => t.turnsTo(p, t.holes[p.hole]) > 0).length, turnable = t.holes.filter((h) => A.rots(h.kind) > 1).length;
    ok(need === Math.min(turns, turnable) && t.rotate === turns > 0, `shape Lv${lv}: まわす ピース ${need}`);
    ok(t.pieces.every((p, i) => p.hole === i && p.kind === t.holes[i].kind && p.size === t.holes[i].size && p.q === p.turn % 4), `shape Lv${lv}: ピースと あな`);
    kinds.forEach((x) => kindsSeen.add(x));
  }
  if (lv > 1) ok(kindsSeen.size === A.KINDS.length, `shape Lv${lv}: どの かたちも でる（${kindsSeen.size}）`);
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) for (let rep = 0; rep < 4; rep++) {
  const t = new Shape(fake("shape"), lv); t.layout(ph.R);
  ok(inside(t.boardR, ph.R) && inside(t.trayR, ph.R) && t.boardR.y >= ph.R.y + 22 && t.boardR.y + t.boardR.h < t.trayR.y, `shape ${ph.name}: いたと トレー`);
  const all = [...t.holes.map((h) => ({ x: h.x, y: h.y, r: t.s * h.size * 1.06, box: t.boardR })), ...t.pieces.map((p) => ({ x: p.hx, y: p.hy, r: t.s * p.size, box: t.trayR }))];
  for (const a of all) ok(a.x - a.r >= a.box.x && a.x + a.r <= a.box.x + a.box.w && a.y - a.r >= a.box.y && a.y + a.r <= a.box.y + a.box.h, `shape ${ph.name}: かたちが はみだす`);
  for (const a of all) for (const b of all) if (a !== b && a.box === b.box) ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r + 6, `shape ${ph.name}: かたちが かさなる`);
  ok(t.s * 0.68 * 2 * ph.px >= 30 && Math.max(24, t.s * 0.68 * 1.15) * 2 * ph.px >= 44, `shape ${ph.name} Lv${lv}: ちいさい ピースも つかめる（${(t.s * ph.px).toFixed(1)}）`);
}
const dragTo = (t, p, x, y) => { t.downArea({ x: p.x, y: p.y }); t.move({ x: p.x + 12, y: p.y + 12 }); t.move({ x, y }); t.up({ x, y }); };
const tapOn = (t, p) => { t.downArea({ x: p.x, y: p.y }); t.up({ x: p.x, y: p.y }); };
{
  const t = new Shape(fake("shape"), 5); t.layout(PHONES[1].R);
  // まわす ピース（おおきさ ちがいの ふたご では ない もの）
  const p0 = t.pieces.find((p) => t.turnsTo(p, t.holes[p.hole]) > 0 && !t.pieces.some((o) => o !== p && o.kind === p.kind)), wrong = t.holes.find((h) => h.kind !== p0.kind);
  dragTo(t, p0, wrong.x, wrong.y); ok(t.misses === 1 && !p0.placed && !wrong.filled && t.sc.said === "かたちが ちがうよ" && t.tip, "shape: ちがう あなは もどって 6てん");
  for (let i = 0; i < 30; i++) t.tick(0.05); ok(Math.hypot(p0.x - p0.hx, p0.y - p0.hy) < 1, "shape: トレーに もどる");
  const h0 = t.holes[p0.hole]; dragTo(t, p0, h0.x, h0.y);
  ok(!p0.placed && t.wrongTurn === 1 && t.misses === 1 && /むき/.test(t.tip.text), "shape: むきだけ ちがうと もどる（減点 なし）");
  for (let i = 0; i < 30; i++) t.tick(0.05);
  const q0 = p0.q; tapOn(t, p0); ok(p0.q === (q0 + 1) % 4 && t.misses === 1, "shape: タップで 90° まわる");
  while (t.turnsTo(p0, h0)) tapOn(t, p0);
  for (let i = 0; i < 10; i++) t.tick(0.05);
  dragTo(t, p0, h0.x + t.s * 0.4, h0.y - t.s * 0.3); ok(p0.placed && h0.filled && t.placed === 1 && p0.x === h0.x, "shape: あなの ちかくで はなすと はまる");
  dragTo(t, p0, p0.hx, p0.hy); ok(p0.placed && !t.drag, "shape: はまった ピースは うごかない");
  const twin = t.pieces.find((p) => p.size < 1), big = t.holes.find((h) => h.kind === twin.kind && h.size === 1);
  dragTo(t, twin, big.x, big.y); ok(t.misses === 2 && !twin.placed && t.sc.said === "おおきさが ちがうよ", "shape: おなじ かたちでも おおきさが ちがうと だめ");
  for (let i = 0; i < 30; i++) t.tick(0.05);
  const p1 = t.pieces.find((p) => !p.placed); t.downArea({ x: p1.x, y: p1.y }); t.move({ x: p1.x + 40, y: p1.y - 40 }); t.up(null, true); ok(!t.drag && !p1.placed, "shape: やめた ときは もどる");
  for (const p of t.pieces) if (!p.placed) { for (let i = 0; i < 30; i++) t.tick(0.05); while (t.turnsTo(p, t.holes[p.hole])) tapOn(t, p); const h = t.holes[p.hole]; dragTo(t, p, h.x, h.y); }
  ok(t.placed === t.k && t.score() === 100 - 12 && t.sc.done === 88, `shape: ぜんぶ はめると おわり（ちがい 2・${t.score()}てん）`);
}
{
  const t = new Shape(fake("shape"), 1); t.layout(PHONES[0].R);
  const p = t.pieces[0], q0 = p.q; tapOn(t, p); ok(p.q === q0 && p.wob > 0, "shape Lv1: タップしても まわらない（ゆれる だけ）");
  for (const pc of t.pieces) { for (let i = 0; i < 30; i++) t.tick(0.05); const h = t.holes[pc.hole]; dragTo(t, pc, h.x, h.y); }
  ok(t.placed === 3 && t.score() === 100, "shape Lv1: はめるだけで 100てん");
  const u = new Shape(fake("shape"), 3); u.layout(PHONES[1].R); ok(u.timeout() < 45, "shape: 時間ぎれは ひくい てん");
}
for (const k of A.KINDS) {
  ok(!kanji.test(A.shapeName(k)) && [1, 2, 4].includes(A.rots(k)) && /^#[0-9A-F]{6}$/i.test(A.SHAPES[k][3]), `かたち ${k}`);
  // rots: まわして おなじ に みえる むきの かず（点の あつまりが 90°・180° で かさなるか）
  const pts = A.SHAPES[k][1], key = (ps) => ps.map(([x, y]) => `${Math.round(x * 50)},${Math.round(y * 50)}`).sort().join(" ");
  const same = [1, 2, 3].filter((q) => key(A.turn(pts, q)) === key(pts));
  ok((A.rots(k) === 1) === same.includes(1) && (A.rots(k) <= 2) === same.includes(2), `かたち ${k}: rots ${A.rots(k)}（${same}）`);
  ok(pts.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1), `かたち ${k}: -1〜1 に おさまる`);
}
ok(A.KINDS.length === 13 && new Set(A.KINDS.map((k) => A.SHAPES[k][3])).size === 13, "かたち 13しゅ（ぜんぶ ちがう いろ）");

// ---- 5. おえかき ロジック ----
// ならびの ヒントだけで とく（1れつずつ、ありうる ならべかたの かさなりを きめる）→ ぜんぶ きまれば こたえは 1とおり
const runs = (c) => { const r = []; let k = 0; for (const v of c) { if (v) k++; else if (k) { r.push(k); k = 0; } } if (k) r.push(k); return r.length ? r : [0]; };
const placements = (len, clue) => {
  if (clue.length === 1 && clue[0] === 0) return [Array(len).fill(0)];
  const out = [], rec = (i, acc) => {
    if (i === clue.length) { out.push(acc.concat(Array(len - acc.length).fill(0))); return; }
    const rest = clue.slice(i + 1).reduce((s, x) => s + x + 1, 0);
    for (let p = acc.length; p + clue[i] + rest <= len; p++) { const a = acc.concat(Array(p - acc.length).fill(0), Array(clue[i]).fill(1)); if (i < clue.length - 1) a.push(0); rec(i + 1, a); }
  };
  rec(0, []); return out;
};
const lineSolve = (rc, cc) => {
  const H = rc.length, W = cc.length, g = Array.from({ length: H }, () => Array(W).fill(-1));
  for (let changed = true; changed;) {
    changed = false;
    const line = (get, set, len, clue) => { const cand = placements(len, clue).filter((p) => p.every((v, i) => get(i) < 0 || get(i) === v)); if (!cand.length) throw Error("むじゅん"); for (let i = 0; i < len; i++) if (get(i) < 0 && cand.every((p) => p[i] === cand[0][i])) { set(i, cand[0][i]); changed = true; } };
    for (let y = 0; y < H; y++) line((i) => g[y][i], (i, v) => (g[y][i] = v), W, rc[y]);
    for (let x = 0; x < W; x++) line((i) => g[i][x], (i, v) => (g[i][x] = v), H, cc[x]);
  }
  return g;
};
const allNames = new Set();
for (const [tier, size, count] of [["easy", 5, 8], ["normal", 5, 7], ["big", 6, 9]]) {
  const list = A.LOGIC[tier];
  ok(list.length === count, `ロジック ${tier}: ${count}もん`);
  for (const [name, color, rows] of list) {
    ok(!kanji.test(name) && !allNames.has(name) && /^#[0-9A-F]{6}$/i.test(color), `ロジック ${name}: なまえ・いろ`); allNames.add(name);
    ok(rows.length === size && rows.every((r) => r.length === size && /^[.#]+$/.test(r)), `ロジック ${name}: ${size}×${size}`);
    const C = A.clues(rows), g = lineSolve(C.rows, C.cols);
    ok(g.every((r, y) => r.every((v, x) => v === (C.grid[y][x] ? 1 : 0))), `ロジック ${name}: ヒントだけで 1とおりに とける`);
    ok(C.rows.every((c, y) => c.join() === runs(C.grid[y]).join()) && C.cols.every((c, x) => c.join() === runs(C.grid.map((r) => r[x])).join()), `ロジック ${name}: すうじ`);
    // 「0」の れつ（さいしょから ばつ）は 1つまで・すうじは 3つまで（ヒントの おびに はいる）
    const zero = [...C.rows, ...C.cols].filter((c) => c[0] === 0).length;
    ok(zero <= 1 && Math.max(...C.rows.map((c) => c.length), ...C.cols.map((c) => c.length)) <= 3, `ロジック ${name}: 0の れつ ${zero}・すうじは 3つまで`);
    const fill = C.grid.flat().filter(Boolean).length; ok(fill >= size * size * 0.3 && fill <= size * size * 0.82, `ロジック ${name}: ぬる ますの かず ${fill}`);
  }
}
ok(allNames.size === 24, "ロジックの もんだい 24");
for (let lv = 1; lv <= 5; lv++) {
  const [tier, pre] = [["easy", 3], ["easy", 1], ["normal", 0], ["big", 2], ["big", 0]][lv - 1], seen = new Set();
  for (let rep = 0; rep < 60; rep++) {
    const t = new Logic(fake("logic"), lv);
    ok(A.LOGIC[tier].some((p) => p[0] === t.name) && t.preset === pre && t.found === pre && t.cell.flat().filter((v) => v === 1).length === pre && t.misses === 0, `logic Lv${lv}: もんだい（${tier}・さいしょ ${pre}）`);
    ok(t.cell.every((r, y) => r.every((v, x) => v !== 1 || t.sol[y][x])), `logic Lv${lv}: さいしょの ますは こたえ`);
    seen.add(t.name);
  }
  ok(seen.size === A.LOGIC[tier].length, `logic Lv${lv}: どの もんだいも でる（${seen.size}）`);
}
{ // つづけて おなじ もんだいが でない（さいきんの 4つ）
  const names = Array.from({ length: 40 }, () => new Logic(fake("logic"), 3).name);
  ok(names.every((nm, i) => !names.slice(Math.max(0, i - 4), i).includes(nm)), "logic: おなじ もんだいが つづかない");
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) for (const [name, , rows] of A.LOGIC[["easy", "easy", "normal", "big", "big"][lv - 1]]) {
  const t = new Logic(fake("logic"), lv);
  Object.assign(t, (() => { const C = A.clues(rows); return { name, sol: C.grid, rowClues: C.rows, colClues: C.cols, rows: rows.length, cols: rows.length, cell: C.grid.map((r) => r.map(() => 0)) }; })()); t.lines();
  t.layout(ph.R);
  ok(inside({ x: t.gx - t.cw, y: t.gy - t.ch, w: t.cw + t.k * t.cols, h: t.ch + t.k * t.rows }, ph.R) && t.gy - t.ch >= ph.R.y + 4, `logic ${ph.name}: ${name} が はみだす`);
  ok(t.k * ph.px >= 44, `logic ${ph.name} Lv${lv}: ${name} の ますが 44px いじょう（${(t.k * ph.px).toFixed(1)}）`);
  ok(t.cw * ph.px >= 52 && t.ch * ph.px >= 46, `logic ${ph.name}: ひだり うえの すみに「のこり」が はいる`);
}
{
  const t = new Logic(fake("logic"), 3); t.layout(PHONES[1].R);
  const cells = []; t.sol.forEach((r, y) => r.forEach((v, x) => cells.push({ x, y, v })));
  const empty = cells.find((c) => !c.v), fillc = cells.find((c) => c.v);
  t.downArea(t.at(empty.x, empty.y)); ok(t.misses === 1 && t.cell[empty.y][empty.x] === 2 && !t.paint && t.sc.said === "そこは ぬらないよ", "logic: ちがう ますは ばつ（6てん）");
  t.downArea(t.at(empty.x, empty.y)); ok(t.misses === 1, "logic: ばつの ますは もう かぞえない");
  t.downArea(t.at(fillc.x, fillc.y)); t.up(); ok(t.found === 1 && t.cell[fillc.y][fillc.x] === 1, "logic: こたえの ますは ぬれる");
  t.downArea({ x: t.gx - 4, y: t.gy - 4 }); ok(!t.paint, "logic: ますの そとは なにも おきない");
  // なぞる: ひとつ めの ぎょうで、ぬる ますが 2つ いじょう つづく ところ
  let row = -1, x0 = -1;
  for (let y = 0; y < t.rows && row < 0; y++) for (let x = 0; x + 1 < t.cols; x++) if (t.sol[y][x] && t.sol[y][x + 1] && !t.cell[y][x] && !t.cell[y][x + 1]) { row = y; x0 = x; break; }
  let x1 = x0; while (x1 + 1 < t.cols && t.sol[row][x1 + 1]) x1++;
  const want = [...Array(x1 - x0 + 1).keys()].filter((i) => t.cell[row][x0 + i] !== 1).length, f0 = t.found;
  t.downArea(t.at(x0, row)); t.move({ x: t.at(x1, row).x, y: t.at(x1, row).y + t.k * 0.3 }); t.up();
  ok(want >= 2 && t.found === f0 + want && t.misses === 1, `logic: よこに なぞると あいだも まとめて ぬれる（${t.found - f0} / ${want}）`);
  // ななめに なぞっても ほかの ぎょうは ぬらない
  const before = t.found; t.downArea(t.at(x0, row)); t.move(t.at(Math.min(t.cols - 1, x0 + 1), Math.min(t.rows - 1, row + 1))); t.up(); ok(t.found === before, "logic: ななめは ぬらない");
  // ぜんぶ ぬる → おわり（ばつ 1）
  for (let y = 0; y < t.rows; y++) for (let x = 0; x < t.cols; x++) if (t.sol[y][x] && t.cell[y][x] !== 1) { t.downArea(t.at(x, y)); t.up(); }
  ok(t.done && t.found === t.total && t.score() === 94 && t.sc.done === 94 && t.rowDone.every(Boolean) && t.colDone.every(Boolean), `logic: ぜんぶ ぬると できあがり（${t.score()}てん）`);
  ok(t.cell.flat().every((v) => v === 1 || v === 2 || v === 3) && t.cell.flat().filter((v) => v === 3).length === t.rows * t.cols - t.total - 1, "logic: おわった れつの のこりは うすい ばつ");
}
{
  const t = new Logic(fake("logic"), 1); t.layout(PHONES[0].R);
  // おわった ぎょうの のこりは うすい ばつ（ぬれない）
  const y = t.sol.findIndex((r) => r.filter(Boolean).length >= 1);
  for (let x = 0; x < t.cols; x++) if (t.sol[y][x] && t.cell[y][x] !== 1) { t.downArea(t.at(x, y)); t.up(); }
  ok(t.rowDone[y] && t.cell[y].every((v, x) => (t.sol[y][x] ? v === 1 : v === 3)), "logic: ぬりおわった ぎょうは のこりが うすい ばつ");
  const ex = t.cell[y].findIndex((v) => v === 3); if (ex >= 0) { const m = t.misses; t.downArea(t.at(ex, y)); ok(t.misses === m, "logic: うすい ばつは タップしても なにも おきない"); }
  const u = new Logic(fake("logic"), 5); u.layout(PHONES[1].R); ok(u.timeout() < 45, "logic: 時間ぎれは ひくい てん");
}

// ---- 6. drawOrder・debug（ふきだしと テスト）----
for (const v of ["slide", "shape", "logic"]) for (let lv = 1; lv <= 5; lv++) {
  const t = new KoboTask(fake(v), lv); t.layout(PHONES[1].R);
  ok(typeof t.drawOrder === "function" && typeof t.debug === "function" && t.timeLimit > 5 && typeof t.title === "string" && !kanji.test(t.title), `${v} Lv${lv}: ふきだし・debug・timeLimit・title`);
  const d = t.debug((x, y) => ({ cx: x, cy: y }));
  ok(d.game === v, `${v} Lv${lv}: debug の game`);
  if (v === "slide") ok(d.path.length === t.par && d.next, `slide Lv${lv}: debug の てじゅん`);
  if (v === "shape") ok(d.holes.length === t.k && d.pieces.every((p) => p.turns >= 0 && p.turns < 4), `shape Lv${lv}: debug の あな と ピース`);
  if (v === "logic") ok(d.todo.length === t.total - t.preset && d.empty.length > 0, `logic Lv${lv}: debug の ます`);
}
console.log(`✓ kobo: ${n} checks（スライド パズル・かたち はめ・おえかき ロジック × Lv1〜5・2つの がめん・ロジック 24もんは 1とおりに とける）`);
