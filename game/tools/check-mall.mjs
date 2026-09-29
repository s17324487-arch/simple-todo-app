// サンシャインいけぶ（斜め上から 見る モール）の 検査: 配置・とおれる 道・エスカレーターと エレベーター・品物・ことば・絵の キー
import assert from 'node:assert/strict';
import { gameContext } from './game-context.mjs';
const R = gameContext();
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const mall = R.VenueHalls.defs.mall, floors = Object.keys(mall.floors).map(Number).sort((a, b) => a - b);
ok(mall.iso && mall.art === R.MallArt && mall.guide === R.MallGuide, 'モールが 斜めの 館に なって いない');
ok(floors.join() === '1,2,3', 'フロアは 1F・2F・3F: ' + floors.join());
const KANJI = /[㐀-鿿]/, FLAT = new Set(['npc', 'elevatorCall', 'toiletDoor', 'exitMat']);
// SVG の 属性の 二重（あると 画像が よみこめない）
const dupAttr = (svg) => [...svg.matchAll(/<[a-zA-Z]+([^>]*)>/g)].some((m) => { const names = [...m[1].matchAll(/\s([a-zA-Z:-]+)=/g)].map((x) => x[1]); return new Set(names).size !== names.length; });
const scene = (room) => { const sc = new R.SCENES.venue(); sc.room = room; sc.fixtures = room.fixtures; return sc; };
const reach = (sc, from, f) => { sc.party = [{ tx: from[0], ty: from[1] }]; sc.routeCache = null; for (let y = Math.floor(f.y) - 1; y <= Math.ceil(f.y + f.h); y++) for (let x = Math.floor(f.x) - 1; x <= Math.ceil(f.x + f.w); x++) if (sc.route(x, y) !== null) return true; return false; };
const keys = new Set();
for (const fl of floors) {
  const r = mall.floors[fl], sc = scene(r), tag = fl + 'F';
  ok(r.iso && r.rows.length === r.h && r.rows.every((row) => row.length === r.w), tag + ': 床の 行と 列');
  ok(r.rows.join('').split('').every((ch) => ch === 'o' || r.mats[ch]), tag + ': 床の 材質の 文字');
  ok(sc.walkable(...r.spawn), tag + ': はじめの 場所に たてる');
  ok(sc.walkable(...r.elevatorSpawn), tag + ': エレベーターを おりた 場所');
  // 什器
  for (const f of r.fixtures) {
    ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= r.w + 0.01 && f.y + f.h <= r.h + 0.01, tag + ': 什器が 床の そと ' + f.kind + ' ' + f.label);
    ok(FLAT.has(f.kind) || R.MallArt.M[f.kind], tag + ': 絵の ない 什器 ' + f.kind);
    if (R.MallArt.M[f.kind]) { const m = R.MallArt.model(f); ok(m && /^<svg /.test(m.svg) && !/NaN|undefined/.test(m.svg) && m.vb.w > 0 && m.vb.h > 0 && !dupAttr(m.svg), tag + ': 絵が こわれて いる ' + f.kind); keys.add(R.MallArt.modelKey(f)); }
    for (const t of [f.label, f.text, f.lines && f.lines.join('')].filter(Boolean)) if (f.action !== 'buy') ok(!KANJI.test(t), tag + ': 漢字が ある ' + t);
    if (f.action) ok(reach(sc, r.spawn, f), tag + ': とどかない ' + (f.label || f.kind));
  }
  // とおれない 什器どうしが かさならない
  const solid = r.fixtures.filter((f) => !f.walk && !f.over);
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) { const a = solid[i], b = solid[j]; ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h), tag + ': かさなって いる ' + a.kind + '/' + b.kind + ' ' + (a.label || '') + (b.label || '')); }
  // エスカレーター（のぼる・おりる の つく 場所）
  for (const f of r.fixtures.filter((f) => f.action === 'floor')) {
    const to = mall.floors[f.to]; ok(to, tag + ': ' + f.label + ' の いきさきが ない');
    ok(scene(to).walkable(...f.spawn), tag + ': ' + f.label + ' で ついた 場所に たてない ' + f.spawn);
    const pair = to.fixtures.find((g) => g.kind === 'escalator' && g.to === fl);
    ok(pair && pair.x === f.x && pair.y === f.y && pair.w === f.w && pair.h === f.h, tag + ': ' + f.label + ' と 上下の 階の エスカレーターの 位置が ちがう');
  }
  // かべの 絵（はんい・かさならない）
  for (const side of ['north', 'west']) {
    const L = side === 'north' ? r.w : r.h, parts = r.walls[side];
    for (const p of parts) ok(p.from >= 0 && p.to <= L && p.from < p.to, tag + ': かべの 絵の はんい ' + side + ' ' + p.kind);
    const w = R.MallArt.wallSvg(r, side); ok(!dupAttr(w.svg) && !/NaN|undefined/.test(w.svg), tag + ': かべの 絵が こわれて いる ' + side);
    const shops = parts.filter((p) => p.kind === 'shop').sort((a, b) => a.from - b.from);
    for (let i = 1; i < shops.length; i++) ok(shops[i].from >= shops[i - 1].to, tag + ': 店の かべが かさなる');
    for (const p of parts) for (const t of [p.label, p.lines && p.lines.join('')].filter(Boolean)) ok(!KANJI.test(t), tag + ': かべの 字に 漢字 ' + t);
  }
  // ふきぬけの あな（'o'）は あなの 中だけ。1F は あなが ない
  const holes = r.holes || [];
  ok(fl === 1 ? !holes.length : holes.some((h) => h.kind === 'ellipse'), tag + ': ふきぬけ');
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.rows[y][x] === 'o') ok(holes.some((h) => h.kind === 'ellipse' ? Math.hypot(x + 0.5 - h.x, y + 0.5 - h.y) < h.r : x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h), tag + ': あなの そとに あな ' + x + ',' + y);
  // フロアマップ
  const places = R.MallGuide.places(r); ok(places.length >= 6, tag + ': フロアマップの 行き先');
  for (const p of places) ok(!KANJI.test(p.label), tag + ': フロアマップに 漢字 ' + p.label);
  const svg = R.MallGuide.svg(r, { x: r.spawn[0], y: r.spawn[1] }); ok(/^<svg /.test(svg) && !/NaN|undefined/.test(svg), tag + ': フロアマップの 図');
  // 店の 名前
  for (const z of r.zones) ok(R.MallArt.SHOP[z.shop] && !KANJI.test(z.label), tag + ': 店の なまえ ' + z.label);
}
// 品物: 池袋の 専売品は ぜんぶ どこかの 台に ある（ID・店は かえない）
const exhibits = floors.flatMap((fl) => mall.floors[fl].fixtures.filter((f) => f.action === 'buy'));
for (const shop of ['hane', 'animal', 'gothic', 'luxury', 'marche']) for (const id of R.IkebukuroCatalog.groups[shop]) { const f = exhibits.find((f) => f.item === id); ok(f && f.shopId === 'ike_' + shop && R.BUY_SHOPS[f.shopId], 'かえない 品物 ' + id); ok(f.buyKind === (R.FURN_INDEX[id] ? 'furn' : R.ITEM_INDEX[id] ? 'wear' : 'bag'), '品物の しゅるい ' + id); }
for (const shop of ['cafe', 'crepes', 'boba']) { const eat = floors.flatMap((fl) => mall.floors[fl].fixtures).filter((f) => f.action === 'eat' && f.menu === R.IkebukuroCatalog.groups[shop]); ok(eat.length >= 3, 'たべられない ' + shop); }
ok(floors.flatMap((fl) => mall.floors[fl].fixtures).some((f) => f.action === 'puzzle'), 'なかよしパズル');
ok(R.BUY_SHOPS.ike_luxury.name === 'いいつか かぐ' && R.BUY_SHOPS.ike_marche.name === 'いけぶくろ マルシェ', 'お店の なまえ（ひらがな）');
// 絵の キー は 有限（種類・大きさ・店・品物 だけ）
ok(keys.size < 200 && [...keys].every((k) => /^mall:[a-zA-Z]+:[\d.]+x[\d.]+:/.test(k)), '絵の キー ' + keys.size);
// 奥行きの じゅん: 奥の ものが さき
const order = R.IsoVenue.order([{ layer: 0, x0: 5, y0: 5, x1: 6, y1: 6, id: 'front' }, { layer: 0, x0: 5, y0: 1, x1: 6, y1: 2, id: 'back' }, { layer: 1, x0: 0, y0: 0, x1: 9, y1: 9, id: 'over' }, { layer: 0, x0: 1, y0: 5, x1: 2, y1: 6, id: 'left' }]).map((o) => o.id);
ok(order.indexOf('back') < order.indexOf('front') && order[order.length - 1] === 'over', '奥行きの じゅん ' + order);
// 投影と もどし
for (const [x, y] of [[0, 0], [3.5, 7.25], [20, 11]]) { const p = R.IsoVenue.p(x, y), q = R.IsoVenue.inv(p.x, p.y); ok(Math.abs(q.x - x) < 1e-9 && Math.abs(q.y - y) < 1e-9, '投影の もどし'); }
console.log(`Mall: ${floors.length} iso floors, reachable fixtures, escalators/elevator, exclusive items, floor map, text and finite art keys — ${n} checks OK`);
