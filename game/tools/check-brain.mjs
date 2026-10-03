// のうトレの おてつだい「あたまの たいそう」（js/brain-art.js・js/mg-brain.js・UI-64）の 検査。ブラウザ なしで たしかめる。
// とうろく（おみせ・店主・セーブ・店内・BGM・ディスク・ごほうび・ちずの めじるし・町の 建物）・3しゅの ゲーム（えらぶ・せつめい）・
// まちがい さがし（ちがいの かず と しゅるい・ほんとうに ちがう・おなじ ところは おなじ・はずれ と ヒントの 減点・タップの はんい）・
// おなじ え さがし（カードは 2まいずつ・Lv.4 から いろだけ ちがう くみ・さいしょに みせる あいだは めくれない・ちがうと もどる・みのがしの かず）・
// くだもの けいさん（Lv ごとの かずの はんい・こたえの 4つ・おなじ もんだいが ない・まちがえると ボタンが きえて 0.5 てん）・
// 2つの スマホの 画面（390×844・375×667）で はみださない・44px・絵（NaN なし・id なし・キャッシュの キーは 有限）・ことばは ひらがな。
import assert from "node:assert/strict";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { BrainArt: A, BrainGames: BG, BrainSpotTask: Spot, BrainPairTask: Pair, BrainMathTask: Mth, BRAIN_TASKS, BrainTask, SHOPS, SHOP_OWNERS, HOWTO, MG_TASKS, Save, STORE_INTERIORS, StoreArt, SONGS, GameEconomy, AreaMap, AreaMapArt, SIGN_ICON, MAP_DEFS, ShopRewards, MusicDiscs } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
const fake = (variant) => ({ timePenalty: () => 0, finish() {}, mistake() {}, addFx() {}, bubbleRect: null, orderT: 0, variant });
const svgOk = (svg, where) => ok(typeof svg === "string" && svg.length > 40 && !/NaN|undefined|Infinity|\bid=/.test(svg), `${where}: 絵（NaN・id なし）`);
// ShopScene と おなじ 作業エリア（js/minigames.js の layout）: 390×844・375×667（dpr 1）
const area = (cw, ch) => { const tile = Math.max(16, Math.round((32 * cw) / 360)), px = tile / 32, W = cw / px, H = ch / px, viewH = Math.round(Math.min(H * 0.4, 330)); return { R: { x: 10, y: viewH + 40, w: W - 20, h: H - viewH - 52 }, px }; };
const PHONES = [[390, 844], [375, 667]].map(([w, h]) => ({ name: `${w}×${h}`, ...area(w, h) }));
const inside = (b, R) => b.x >= R.x - 0.5 && b.y >= R.y - 0.5 && b.x + b.w <= R.x + R.w + 0.5 && b.y + b.h <= R.y + R.h + 0.5;

// ---- 1. とうろく ----
ok(SHOPS.brain && SHOPS.brain.name === "あたまの たいそう" && SHOPS.brain.rounds === 4 && SHOPS.brain.lines.length === 4 && SHOPS.brain.lines.every((l) => !kanji.test(l)), "おみせ（4にん・ことば）");
ok(MG_TASKS.brain === BrainTask && Object.keys(BRAIN_TASKS).join() === "spot,pair,math", "MG_TASKS.brain は 3しゅの ゲームを えらぶ");
ok(new BrainTask(fake("pair"), 1) instanceof Pair && new BrainTask(fake("math"), 1) instanceof Mth && new BrainTask(fake(null), 1) instanceof Spot && new BrainTask(fake("spot"), 1) instanceof Spot, "variant で ゲームが きまる（なければ まちがい さがし）");
ok(SHOP_OWNERS.brain.sp === "owl" && SHOP_OWNERS.brain.name === "ふくろうの ホーせんせい", "店主は ふくろうの ホーせんせい");
const fresh = Save.fresh().shops.brain;
ok(fresh && fresh.lv === 1 && fresh.plays === 0 && JSON.stringify(fresh.games) === '{"spot":0,"pair":0,"math":0}' && fresh.last === "", "セーブ（ゲームごとの かず）");
{ // ふるい セーブ（brain が ない）を よむと たりない ところを おぎなう
  const old = Save.fresh(); delete old.shops.brain; const m = Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(m.shops.brain) === JSON.stringify(fresh) && m.v === Save.SCHEMA, "ふるい セーブに brain を おぎなう（SCHEMA は そのまま）");
}
ok(GameEconomy.shopBase.brain === 40 && GameEconomy.pay("brain", 1, 3) > GameEconomy.pay("brain", 1, 2), "ほうしゅう");
ok(SONGS.shop_brain && SONGS.shop_brain.title === "かんがえる きらきらぼし" && SONGS.shop_brain.source && /Mozart/.test(SONGS.shop_brain.source.composer) && SONGS.shop_brain.disc === false, "BGM（きらきらぼし・パブリックドメイン・出典）");
ok(MusicDiscs.DISCS.some((d) => d.id === "disc_shop_brain" && d.song === "shop_brain" && d.from.shop === "brain"), "おてつだいの ディスク");
ok(AreaMap.SHOP_ICON.brain === "owl" && AreaMapArt.ICON.owl, "ちずの めじるし（ふくろう）");
svgOk(SIGN_ICON.brain(0, 0), "かんばんの しるし");
{
  const I = STORE_INTERIORS.brain;
  ok(I && I.fixtures.length === 6 && !kanji.test(I.caption) && I.fixtures.every((f) => !kanji.test(f[5])), "店内（6つの 什器・ひらがな）");
  for (const kind of ["chalkboard", "desks", "spotboard", "globe", "puzzleshelf"]) { const s = StoreArt.prop(kind); ok(s.startsWith("<svg") && s.length > 400 && !/NaN|undefined/.test(s), `店内の 絵 ${kind}`); }
}
{
  const b = MAP_DEFS.town.buildings.find((x) => x.id === "nerikasu_home6");
  ok(b && b.act.type === "work" && b.act.shop === "brain" && b.label === "あたまの たいそう" && b.asset === "nerikasu.bld_nerikasu_home6", "ネリカスタウンの お店（nerikasu_home6）");
}
ok(ShopRewards.prizes.filter((p) => p.shop === "brain").map((p) => p.id).join() === "shop_brain_5,shop_brain_10,shop_brain_15,shop_brain_30", "ごほうびの かぐ 4つ");

// ---- 2. えらぶ・せつめい ----
ok(BG.GAMES.map((g) => g.id).join() === "spot,pair,math" && BG.GAMES.every((g) => !kanji.test(g.name + g.desc) && g.name.length <= 9 && width(`・${g.name}：${g.desc}`) <= 19.5), "3しゅの なまえと ひとこと（ひらがな・みじかく）");
for (const v of ["spot", "pair", "math", null]) {
  const lines = HOWTO.brain({ variant: v });
  ok(Array.isArray(lines) && lines.length === 4 && lines[0] === BG.HELLO && lines.slice(1).join() === BG.game(v).howto.join(), `せつめい（${v}）は えらんだ ゲームの ぶん`);
  for (const l of lines) { ok(!kanji.test(l), "せつめいに 漢字: " + l); for (const row of l.split("\n")) ok(width(row) <= 26, `せつめいの 1行が ながい「${row}」`); }
}
ok(BG.howto("pair").some((l) => /カード/.test(l)) && BG.howto("math").some((l) => /くだもの/.test(l)) && BG.howto("spot").some((l) => /ヒント/.test(l)), "せつめいの なかみ");

// ---- 3. まちがい さがし ----
const TYPES = [["gone", "color", "kind"], ["gone", "color", "kind", "extra"], ["gone", "color", "kind", "extra", "size"], ["gone", "color", "kind", "extra", "size", "flip"], ["gone", "color", "kind", "extra", "size", "flip"]];
for (let lv = 1; lv <= 5; lv++) {
  const seen = new Set();
  for (let rep = 0; rep < 150; rep++) {
    const t = new Spot(fake("spot"), lv), k = [3, 3, 4, 4, 5][lv - 1], pieces = [7, 8, 8, 9, 10][lv - 1];
    t.layout(PHONES[rep % 2].R);
    ok(t.k === k && t.diffs.length === k && new Set(t.diffs.map((d) => d.cell)).size === k, `spot Lv${lv}: ちがいは ${k}つ（ばしょが ちがう）`);
    ok(t.left.filter(Boolean).length === pieces, `spot Lv${lv}: ひだりの えの こもの ${pieces}こ`);
    // さいしょは ちがう しゅるいを 1つずつ（しゅるいが たりる あいだ）
    const ts = t.diffs.map((d) => d.type), first = ts.slice(0, Math.min(k, TYPES[lv - 1].length));
    ok(ts.every((x) => TYPES[lv - 1].includes(x)) && new Set(first).size === first.length, `spot Lv${lv}: ちがいの しゅるい ${ts}`);
    ts.forEach((x) => seen.add(x));
    t.left.forEach((L, c) => {
      const Rr = t.right[c], d = t.diffs.find((q) => q.cell === c);
      if (!d) { ok(JSON.stringify(L) === JSON.stringify(Rr), `spot Lv${lv}: ちがいでない ところは おなじ`); return; }
      const why = { gone: L && !Rr, extra: !L && Rr, color: L && Rr && L.kind === Rr.kind && L.v !== Rr.v && L.s === Rr.s && L.flip === Rr.flip, kind: L && Rr && L.kind !== Rr.kind && L.v === Rr.v,
        size: L && Rr && L.kind === Rr.kind && Rr.s < 0.7 && L.s === 1, flip: L && Rr && L.kind === Rr.kind && Rr.flip && !L.flip && A.flips(L.kind) }[d.type];
      ok(why, `spot Lv${lv}: ${d.type} の ちがいが 見て わかる`);
    });
    // 絵の キャッシュの キーは しゅるいと いろ だけ（有限）
    ok([...t.left, ...t.right].every((q) => !q || (A.KINDS.includes(q.kind) && (q.v === 0 || q.v === 1))), `spot Lv${lv}: こもの`);
  }
  ok(TYPES[lv - 1].every((x) => seen.has(x)), `spot Lv${lv}: どの しゅるいの ちがいも でる ${[...seen]}`);
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) {
  const t = new Spot(fake("spot"), lv); t.layout(ph.R);
  for (const pic of t.pics) ok(inside(pic, ph.R), `spot ${ph.name}: えが はみだす`);
  ok(t.pics[0].x + t.pics[0].w < t.pics[1].x && Math.abs(t.pics[0].h - t.pics[1].h) < 1e-6, `spot ${ph.name}: 2まいの えが ならぶ`);
  ok(t.cw * ph.px >= 44 && t.ch * ph.px >= 44 && t.size * ph.px >= 30, `spot ${ph.name}: タップする マスが 44px いじょう（${(t.cw * ph.px).toFixed(1)}×${(t.ch * ph.px).toFixed(1)}）`);
  for (const b of t.btns) ok(inside(b, ph.R) && b.w * ph.px >= 44 && b.h * ph.px >= 44, `spot ${ph.name}: ヒントの ボタン`);
}
{
  const t = new Spot(fake("spot"), 3); t.layout(PHONES[1].R);
  const same = t.left.map((q, c) => c).find((c) => !t.diffs.some((d) => d.cell === c));
  t.downArea(t.center(t.pics[0], same)); ok(t.misses === 1 && t.marks.length === 1 && t.score() === -6, "spot: おなじ ところを タップすると はずれ（6てん）");
  t.downArea(t.center(t.pics[0], same)); ok(t.misses === 1, "spot: はずれの あと すこし まつ（れんだ できない）");
  t.tick(0.5); t.downArea({ x: t.R.x + 2, y: t.R.y + 2 }); ok(t.misses === 1, "spot: えの そとは なにも おきない");
  t.hint(); ok(t.hints === 1 && t.hintT > 0 && t.diffs.some((d) => d.cell === t.hintCell && !d.found), "spot: ヒントは まだの ちがいを おしえる");
  t.hint(); ok(t.hints === 1, "spot: ヒントの あいだは もう いちど おせない");
  t.downArea(t.center(t.pics[0], t.diffs[0].cell)); ok(t.found === 1 && t.diffs[0].found, "spot: ひだりの えでも みつけられる");
  t.downArea(t.center(t.pics[1], t.diffs[0].cell)); ok(t.found === 1 && t.misses === 1, "spot: みつけた ところは もう かぞえない");
  for (const d of t.diffs) t.downArea(t.center(t.pics[1], d.cell));
  ok(t.found === t.k && t.score() === 100 - 6 - 10, `spot: はずれ 1・ヒント 1 で 84てん（${t.score()}）`);
  const u = new Spot(fake("spot"), 2); u.layout(PHONES[0].R); u.downArea(u.center(u.pics[1], u.diffs[0].cell));
  ok(u.timeout() < 45 && u.timeout() <= Math.min(40, u.score() - 20), "spot: 時間ぎれは ひくい てん");
}

// ---- 4. おなじ え さがし ----
for (let lv = 1; lv <= 5; lv++) for (let rep = 0; rep < 60; rep++) {
  const t = new Pair(fake("pair"), lv), [pairs, cols, twins] = [[6, 4, 0], [6, 4, 0], [8, 4, 0], [8, 4, 2], [10, 5, 3]][lv - 1];
  const keys = {}; for (const c of t.cards) keys[c.key] = (keys[c.key] || 0) + 1;
  ok(t.pairs === pairs && t.cols === cols && t.cards.length === pairs * 2 && Object.values(keys).every((k) => k === 2) && Object.keys(keys).length === pairs, `pair Lv${lv}: ${pairs}くみ（2まいずつ）`);
  const kinds = {}; for (const k of Object.keys(keys)) { const kind = k.split(":")[0]; kinds[kind] = (kinds[kind] || 0) + 1; }
  ok(Object.values(kinds).filter((k) => k === 2).length === twins, `pair Lv${lv}: いろだけ ちがう くみ ${twins}`);
  ok(t.cards.every((c) => A.KINDS.includes(c.kind)), `pair Lv${lv}: カードの え`);
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) {
  const t = new Pair(fake("pair"), lv); t.layout(ph.R);
  ok(t.cardW * ph.px >= 44 && t.cardH * ph.px >= 44, `pair ${ph.name} Lv${lv}: カードが 44px いじょう（${(t.cardW * ph.px).toFixed(1)}）`);
  for (const c of t.cards) ok(inside({ x: c.x - t.cardW / 2, y: c.y - t.cardH / 2, w: t.cardW, h: t.cardH }, ph.R) && c.y - t.cardH / 2 >= ph.R.y + 28, `pair ${ph.name}: カードが はみだす`);
  for (const a of t.cards) for (const b of t.cards) if (a !== b) ok(Math.abs(a.x - b.x) >= t.cardW + 4 || Math.abs(a.y - b.y) >= t.cardH + 4, `pair ${ph.name}: カードが かさなる`);
}
{
  const t = new Pair(fake("pair"), 4); t.layout(PHONES[1].R);
  const c0 = t.cards[0], other = t.cards.find((c) => c.key !== c0.key), mate = t.cards.find((c) => c !== c0 && c.key === c0.key);
  t.downArea({ x: c0.x, y: c0.y }); ok(!c0.open, "pair: さいしょに みせて いる あいだは めくれない");
  t.tick(t.peek + 0.01); ok(t.peek <= 0, "pair: みせる じかんが おわる");
  t.downArea({ x: c0.x, y: c0.y }); t.downArea({ x: other.x, y: other.y });
  ok(c0.open && other.open && t.misses === 1 && t.lock > 0, "pair: ちがう えは みのがし 1");
  t.downArea({ x: mate.x, y: mate.y }); ok(!mate.open, "pair: もどる まえは めくれない");
  t.tick(0.85); ok(!c0.open && !other.open, "pair: ちがう えは もとに もどる");
  t.downArea({ x: c0.x, y: c0.y }); t.downArea({ x: mate.x, y: mate.y }); ok(c0.done && mate.done && t.done === 1, "pair: おなじ えは そろう");
  t.downArea({ x: c0.x, y: c0.y }); ok(t.open().length === 0, "pair: そろった カードは めくれない");
  ok(t.free === Math.ceil(8 * 0.8) && t.score() === 100 / 8, "pair: みのがし 7まいまでは へらない");
  t.misses = t.free + 2; ok(t.score() === 100 / 8 - 10, "pair: みのがしが おおいと 5てんずつ");
  const u = new Pair(fake("pair"), 1); u.layout(PHONES[0].R); ok(u.timeout() < 45, "pair: 時間ぎれは ひくい てん");
}

// ---- 5. くだもの けいさん ----
const LIM = [5, 10, 10, 15, 20];
for (let lv = 1; lv <= 5; lv++) {
  const ops = new Set();
  for (let rep = 0; rep < 400; rep++) {
    const q = Mth.make(lv);
    ops.add(q.op);
    const total = q.op === "-" ? q.a : q.a + q.b;
    ok(q.a >= 1 && q.b >= 1 && total <= LIM[lv - 1] && q.ans >= 1 && q.ans <= 20, `math Lv${lv}: かずの はんい ${JSON.stringify(q)}`);
    ok(q.ans === (q.op === "+" ? q.a + q.b : q.op === "-" ? q.a - q.b : q.b), `math Lv${lv}: こたえ`);
    ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.ans) && q.choices.every((v) => Number.isInteger(v) && v >= 0 && v <= 20), `math Lv${lv}: えらぶ こたえ 4つ ${q.choices}`);
    ok(A.FRUIT_KINDS.includes(q.fruit), `math Lv${lv}: くだもの`);
  }
  const want = [["+"], ["+"], ["+", "-"], ["+", "-"], ["+", "-", "?"]][lv - 1];
  ok([...ops].sort().join() === [...want].sort().join(), `math Lv${lv}: もんだいの しゅるい ${[...ops]}`);
}
for (let lv = 1; lv <= 5; lv++) for (let rep = 0; rep < 40; rep++) {
  const t = new Mth(fake("math"), lv);
  ok(t.qs.length === [3, 3, 4, 4, 5][lv - 1] && new Set(t.qs.map((q) => q.op + q.a + "," + q.b)).size === t.qs.length, `math Lv${lv}: おなじ もんだいが ない`);
  for (const q of t.qs) { const [l1, l2] = t.text(q); ok(!kanji.test(l1 + l2) && width(l1) <= 24 && width(l2) <= 24, `math: もんだいの ことば「${l1}${l2}」`); }
}
for (const ph of PHONES) for (let lv = 1; lv <= 5; lv++) {
  const t = new Mth(fake("math"), lv); t.layout(ph.R);
  for (const b of t.btns) ok(inside(b, ph.R) && b.w * ph.px >= 44 && b.h * ph.px >= 44, `math ${ph.name}: こたえの ボタン`);
  ok(t.choiceY - 52 - (ph.R.y + 48) >= 60, `math ${ph.name}: くだものの え の ばしょ`);
}
{
  const t = new Mth(fake("math"), 3); t.layout(PHONES[1].R);
  const q = t.cur, wrong = q.choices.find((v) => v !== q.ans);
  t.btns.find((b) => b.label === String(wrong)).cb();
  ok(t.misses === 1 && q.tries === 1 && !q.ok && t.btns.find((b) => b.label === String(wrong)).disabled && t.index === 0, "math: まちがえると その ボタンが きえて もういちど");
  t.btns.find((b) => b.label === String(q.ans)).cb(); ok(q.ok && q.tries === 2 && t.wait > 0, "math: 2かいめで あたり");
  t.btns.find((b) => b.label === String(q.ans)).cb(); ok(q.tries === 2, "math: つぎの もんだいまで おせない");
  t.tick(1); ok(t.index === 1 && t.btns.every((b) => !b.disabled), "math: つぎの もんだい");
  while (t.cur) { t.btns.find((b) => b.label === String(t.cur.ans)).cb(); t.tick(1); }
  ok(t.score() === (100 * (t.nq - 0.5)) / t.nq, `math: 1もん 2かいめ → ${t.score()}てん`);
  const u = new Mth(fake("math"), 1); u.layout(PHONES[0].R); ok(u.timeout() < 45, "math: 時間ぎれは ひくい てん");
}

// ---- 6. 絵 ----
for (const k of A.KINDS) for (const v of [0, 1]) svgOk(A.piece(k, v), `こもの ${k}:${v}`);
ok(A.KINDS.length === 12 && A.KINDS.every((k) => !kanji.test(A.name(k)) && A.PIECES[k][1] !== A.PIECES[k][2]), "こもの 12しゅ × いろ 2つ（ちがう いろ）");
ok(A.KINDS.filter((k) => A.flips(k)).length >= 5, "むきの ちがいが わかる こもの");
for (const k of A.FRUIT_KINDS) svgOk(A.fruit(k), `くだもの ${k}`);
for (const [nm, f] of [["カードの うら", A.cardBack], ["むしめがね", A.lens], ["まる", A.ring], ["ばつ", A.miss]]) svgOk(f(), nm);
console.log(`✓ brain: ${n} checks（まちがい さがし・おなじ え さがし・くだもの けいさん × Lv1〜5・2つの がめん）`);
