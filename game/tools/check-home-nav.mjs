// おうちの みち（js/home-nav.js・UI-73。オーナーの FB 2026-10-03「お家で、できるだけ家具とごわがやぱぱままが交差しないようにして。
// だだ、詰まることを避けるため、状況に応じて許されるものとする。」）の 検査。
// ブラウザ なしで: ふさぐ もの（ゆかの 家具だけ・ラグと かべの かざりは のぞく・2かいの かいだん）・マス（あいた マスは 家具から 4 いじょう はなれる）・
// みち（よく ある へやと たくさんの 家具の へや で 家具の 足もとを とおらない・いきさきに つく）・よこぎらずに まわりこむ・
// ゆるす とき（家具の うえから でる・いきさきが 家具の なか → ちかくで とまる・とどかない → さいごは まっすぐ・すすまない → まっすぐ）・
// あるく（いちの うつりかわり）・家具を うごかすと さがしなおす・うごく いきさき・はやさ・くみこみ・とうろく・PokaDebug・ことば
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { HomeNav: N, HomeDesign, HomeFloors, FURN_INDEX, FURNITURE, ROOM, Save: S, SCENES, PokaDebug } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const HS = SCENES.house.prototype;
const sc = { anchor: (it) => HS.anchor.call(sc, it) };
let seed = 20261003;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const fresh = () => { S.d = S.fresh(); N.reset(); return S.d; };
const FLOORS = FURNITURE.filter((f) => f.kind === "floor").map((f) => f.id);
// 家具の 足もと（ひろげない 四角）に はいって いるか（m: ふちの よゆう）
const inRaw = (F, x, y, m = 0.5) => F.some((r) => x > r.x0 + m && x < r.x1 - m && y > r.y0 + m && y < r.y1 - m);
// みちの 線を 1 ずつ たどって 家具の 足もとに はいる かず
const hits = (F, pts) => {
  let h = 0;
  for (let i = 1; i < pts.length; i++) {
    const A = pts[i - 1], B = pts[i], m = Math.max(1, Math.ceil(Math.hypot(B.x - A.x, B.y - A.y)));
    for (let s = 0; s <= m; s++) if (inRaw(F, A.x + ((B.x - A.x) * s) / m, A.y + ((B.y - A.y) * s) / m)) h++;
  }
  return h;
};
const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
const randPt = () => ({ x: 20 + rnd() * (ROOM.W - 40), y: ROOM.WALL + 26 + rnd() * (ROOM.H - ROOM.WALL - 36) });
// あるかせる（dt 1/30）。もどりは { arrived, t, track }
const simulate = (a, tx, ty, speed = 52, limit = 40, each) => {
  const track = [{ x: a.x, y: a.y }]; let t = 0;
  while (t < limit) { t += 1 / 30; if (each) each(a, t); if (N.walk(sc, a, speed, 1 / 30, tx, ty)) return { arrived: true, t, track }; track.push({ x: a.x, y: a.y }); }
  return { arrived: false, t, track };
};

// ---- 1. ふさぐ もの ----
fresh();
{
  const items = S.d.room.items, F = N.feet(sc);
  ok(items.some((it) => FURN_INDEX[it.id].kind === "rug") && items.some((it) => FURN_INDEX[it.id].kind === "wall"), "はじめの へやに ラグと かべの かざりが ある");
  ok(F.map((r) => r.id).join() === items.filter((it) => FURN_INDEX[it.id].kind === "floor").map((it) => it.id).join() && F.length >= 3, "ふさぐ のは ゆかの 家具だけ（ラグ・かべの かざりは のぞく）: " + F.map((r) => r.id));
  for (const r of F) {
    const it = items.find((x) => x.uid === r.uid), m = HomeDesign.model(it.id, it), a = HS.anchor.call(sc, it);
    ok(near(r.x1 - r.x0, m.footW) && near(r.y1 - r.y0, m.footD) && near(r.y1, a.y) && near((r.x0 + r.x1) / 2, a.x), `${it.id}: 足もとは 家具の 立体の 足もと（footW × footD・てまえの まんなかが anchor）`);
  }
  // ラグの うえは とおれる
  const rug = items.find((it) => FURN_INDEX[it.id].kind === "rug"), ra = HS.anchor.call(sc, rug);
  ok(!N.blockedAt(sc, ra.x, ra.y - 4) || inRaw(F, ra.x, ra.y - 4, 0), "ラグの うえは ふさがない（ほかの 家具が ない ところ）");
}
// 2かいの かいだん
{
  const d = fresh(); d.rooms.owned[HomeFloors.ID] = true; d.rooms.active = HomeFloors.BASE; N.reset();
  const st = N.feet(sc).find((r) => r.id === "stairs"), S2 = HomeFloors.STAIR;
  ok(HomeFloors.on() && !HomeFloors.upper() && st && st.x0 === S2.x0 && st.x1 === S2.x1 && st.y0 === ROOM.WALL + S2.top && st.y1 === ROOM.H - 6, "2かいが ある とき 1かいの かいだんの 足もとも ふさぐ " + JSON.stringify(st));
  ok(N.blockedAt(sc, (S2.x0 + S2.x1) / 2, ROOM.H - 30) && N.signature().split(":")[1] === "1", "かいだんの うえは ふさがる・かたちの しるし");
  const sig1 = N.signature(); d.rooms.active = HomeFloors.ID; if (!d.rooms.stored[HomeFloors.ID]) d.rooms.stored[HomeFloors.ID] = { items: [] };
  ok(HomeFloors.upper() && !N.feet(sc).some((r) => r.id === "stairs") && N.signature() !== sig1, "2かいでは かいだんを ふさがない（ちがう かたち）");
  const d2 = fresh();
  ok(!HomeFloors.on() && !N.feet(sc).some((r) => r.id === "stairs") && d2.rooms.active === "main", "2かいが ない ときは かいだんを ふさがない");
}

// ---- 2. マス ----
fresh();
{
  const g = N.build(sc), I = N.info(sc), F = N.feet(sc);
  ok(g.w === Math.ceil(ROOM.W / N.C) && g.h === Math.ceil((ROOM.H - ROOM.WALL) / N.C) && I.cell === N.C && I.pad === N.PAD && I.blocked > 0, `マス ${g.w}×${g.h}（${N.C}）・ふさいだ マス ${I.blocked}`);
  ok(N.PAD - N.C / 2 >= 4, "からだの はば（PAD）は マスの はんぶんより 4 いじょう おおきい（あいた マスの どこでも 家具から 4 はなれる）");
  let freeCells = 0, edge = 0;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
    const v = g.blocked[j * g.w + i], x0 = i * N.C, y0 = ROOM.WALL + j * N.C;
    if (v === 2) { edge++; continue; }
    if (v) continue;
    freeCells++;
    const corners = [[x0, y0], [x0 + N.C, y0], [x0, y0 + N.C], [x0 + N.C, y0 + N.C], [x0 + N.C / 2, y0 + N.C / 2]];
    if (corners.some(([x, y]) => F.some((r) => x > r.x0 - 4 && x < r.x1 + 4 && y > r.y0 - 4 && y < r.y1 + 4))) ok(false, `あいた マス (${i},${j}) が 家具に ちかい`);
  }
  ok(freeCells > g.w * g.h * 0.5 && edge > 0, `あいた マス ${freeCells}・へやの ふち ${edge}`);
  ok(N.sight(g, N.center(2, g.h - 2), N.center(g.w - 3, g.h - 2)) === (() => { for (let i = 2; i <= g.w - 3; i++) if (!N.free(g, i, g.h - 2)) return false; return true; })(), "見とおし（よこ 1れつ）");
  ok(N.build(sc) === g, "おなじ へやでは マスを つくりなおさない");
}

// ---- 3. みち（よく ある へや・たくさんの 家具の へや）----
const study = (label, pairs) => {
  N.reset();
  const F = N.feet(sc); let total = 0, loose = 0, bad = 0, end = 0;
  for (let k = 0; k < pairs; k++) {
    const a = randPt(), t = randPt();
    if (inRaw(F, a.x, a.y, -1) || inRaw(F, t.x, t.y, -1)) continue;
    const p = N.plan(sc, a, t.x, t.y); total++;
    ok(p.pts.length >= 2 && near(p.pts[0].x, a.x) && near(p.pts[0].y, a.y), label + ": みちは いまの ところから");
    if (p.loose) { loose++; continue; }
    if (hits(F, p.pts)) bad++;
    const e = p.pts[p.pts.length - 1]; if (Math.hypot(e.x - t.x, e.y - t.y) > 0.5) end++;
  }
  ok(bad === 0, `${label}: 家具の 足もとを とおらない（${bad} / ${total}）`);
  ok(end === 0, `${label}: いきさきに つく（${end}）`);
  ok(loose <= total * 0.05, `${label}: ゆるす みちは すくない（${loose} / ${total}）`);
  return { total, loose };
};
fresh();
study("はじめの へや", 1200);
fresh(); S.d.rooms.expanded[S.d.rooms.active] = true;
ok(ROOM.W === 640, "ひろい へや（640）");
for (let L = 0; L < 6; L++) {
  const items = [];
  for (let q = 0; q < 14; q++) items.push({ uid: q + 1, id: FLOORS[Math.floor(rnd() * FLOORS.length)], x: 40 + rnd() * (ROOM.W - 80), y: ROOM.WALL + 60 + rnd() * (ROOM.H - ROOM.WALL - 70), flip: rnd() < 0.3 });
  S.d.room.items = items;
  study(`ひろい へやの 家具 14こ（${L + 1}）`, 500);
}

// ---- 4. よこぎらずに まわりこむ・あるく ----
fresh();
{
  const F = N.feet(sc), tb = F.find((r) => r.id === "table_wood"), y = (tb.y0 + tb.y1) / 2;
  const a = { x: tb.x0 - 40, y }, t = { x: tb.x1 + 40, y };
  ok(!N.blockedAt(sc, a.x, a.y) && !N.blockedAt(sc, t.x, t.y) && hits(F, [a, t]) > 0, "テーブルの まんなかの たかさで ひだり → みぎ（まっすぐだと よこぎる）");
  const p = N.plan(sc, a, t.x, t.y);
  ok(!p.loose && p.pts.length >= 3 && hits(F, p.pts) === 0 && len(p.pts) > t.x - a.x + 10, `テーブルを まわりこむ（${p.pts.length}てん・${len(p.pts).toFixed(0)} > ${(t.x - a.x).toFixed(0)}）`);
  const w = { ...a }, sim = simulate(w, t.x, t.y);
  ok(sim.arrived && Math.hypot(w.x - t.x, w.y - t.y) < 2 && hits(F, sim.track) === 0, `あるいて テーブルを よけて つく（${sim.t.toFixed(1)}びょう）`);
  ok(sim.track.every((q, i) => i === 0 || Math.hypot(q.x - sim.track[i - 1].x, q.y - sim.track[i - 1].y) <= 52 / 30 + 0.01), "1フレームに すすむ のは はやさ × じかん まで");
  ok(["left", "right", "up", "down"].includes(w.dir), "あるく むき");
  ok(N.walk(sc, w, 52, 1 / 30, t.x, t.y) === true && w._nav === null, "ついた あとは すぐ true");
  // あるく シミュレーション（はじめの へや）: いちは 家具に はいらず、ぜんぶ つく
  let arrived = 0, tried = 0, bad = 0;
  for (let k = 0; k < 60; k++) {
    const s0 = randPt(), t0 = randPt();
    if (N.blockedAt(sc, s0.x, s0.y, N.PAD) || N.blockedAt(sc, t0.x, t0.y, N.PAD)) continue;
    tried++; const b = { ...s0 }, r = simulate(b, t0.x, t0.y);
    if (r.arrived) arrived++; if (hits(F, r.track)) bad++;
  }
  ok(tried >= 25 && arrived === tried && bad === 0, `あるいて つく ${arrived} / ${tried}・家具に はいった ${bad}`);
}

// ---- 5. ゆるす とき ----
fresh();
{
  const F = N.feet(sc), bed = F.find((r) => r.id === "bed_simple"), tb = F.find((r) => r.id === "table_wood");
  // いま 家具の うえ → いちばん ちかい あいた ところへ でてから
  const a = { x: (tb.x0 + tb.x1) / 2, y: (tb.y0 + tb.y1) / 2 }, t = { x: ROOM.W - 60, y: ROOM.H - 40 };
  const p = N.plan(sc, a, t.x, t.y), out = p.pts[1];
  ok(p.loose && N.blockedAt(sc, a.x, a.y) && !N.blockedAt(sc, out.x, out.y, 3) && hits(F, p.pts.slice(1)) === 0, "家具の うえから: まず ちかくの あいた ところへ（ゆるす）・その あとは よける");
  const w = { ...a }, sim = simulate(w, t.x, t.y), firstOut = sim.track.findIndex((q) => !inRaw(F, q.x, q.y));
  ok(sim.arrived && firstOut > 0 && hits(F, sim.track.slice(firstOut)) === 0, `家具の うえから でた あとは 家具に はいらない（${sim.t.toFixed(1)}びょう）`);
  // いきさきが 家具の なか → ちかくの あいた ところで とまる
  const g = { x: (bed.x0 + bed.x1) / 2, y: (bed.y0 + bed.y1) / 2 }, s0 = { x: ROOM.W - 60, y: ROOM.H - 40 };
  const q = N.plan(sc, s0, g.x, g.y), e = q.pts[q.pts.length - 1];
  ok(!q.loose && hits(F, q.pts) === 0 && !inRaw(F, e.x, e.y, -3) && Math.hypot(e.x - g.x, e.y - g.y) > 10, `いきさきが ベッドの なか → ちかくで とまる（${e.x.toFixed(0)}, ${e.y.toFixed(0)}）`);
  const nr = N.near(sc, g.x, g.y);
  ok(!N.blockedAt(sc, nr.x, nr.y, 3) && Math.hypot(nr.x - g.x, nr.y - g.y) < 120, "near: 家具の なかの 点 → ちかくの あいた ところ");
  ok(JSON.stringify(N.near(sc, s0.x, s0.y)) === JSON.stringify(s0), "near: あいた ところは そのまま");
  const w2 = { ...s0 }, sim2 = simulate(w2, g.x, g.y);
  ok(sim2.arrived && Math.hypot(w2.x - e.x, w2.y - e.y) < 2 && hits(F, sim2.track) === 0, "あるいて ちかくで とまる（ついたら true）");
  const keep = w2._nav, x2 = w2.x;
  ok(keep && keep.done && N.walk(sc, w2, 52, 1 / 30, g.x, g.y) === true && w2._nav === keep && w2.x === x2, "とまった あとも おなじ いきさきの あいだは そのまま（さがしなおさない）");
  // いきさきが 家具の そば（ひろげた ところ）→ さいごの まっすぐも 家具に かからない
  const side = { x: tb.x1 + 3, y: tb.y1 - 10 };
  const r2 = N.plan(sc, { x: 40, y: ROOM.H - 30 }, side.x, side.y);
  ok(N.blockedAt(sc, side.x, side.y, N.PAD) && !N.blockedAt(sc, side.x, side.y) && !r2.loose && hits(F, r2.pts) === 0 && Math.hypot(r2.pts.at(-1).x - side.x, r2.pts.at(-1).y - side.y) < 0.5, "いきさきが 家具の すぐ よこ → その 点まで（家具に かからない）");
}
// とどかない（家具で かこまれた ところ）→ いける ところまで いって さいごは まっすぐ
fresh();
{
  // へやを たてに わける 家具の かべ（すきま なし）
  const id = "bookshelf", m = HomeDesign.model(id, {}), items = [];
  for (let y = ROOM.WALL + m.footD + 6, k = 1; y < ROOM.H + m.footD; y += m.footD, k++) items.push({ uid: k, id, x: 240, y: Math.min(y, ROOM.H - 6), flip: false });
  S.d.room.items = items; N.reset();
  const F = N.feet(sc), a = { x: 60, y: ROOM.H - 60 }, t = { x: ROOM.W - 60, y: ROOM.H - 60 };
  const g = N.build(sc), [ci] = N.cellOf(g, 240, ROOM.H - 60);
  let wall = true; for (let j = 0; j < g.h; j++) if (N.free(g, ci, j)) wall = false;
  ok(items.length >= 3 && wall, `${id} ${items.length}こで へやを たてに わける`);
  const p = N.plan(sc, a, t.x, t.y);
  ok(p.loose && Math.hypot(p.pts.at(-1).x - t.x, p.pts.at(-1).y - t.y) < 0.5, "とどかない → さいごは まっすぐ（ゆるす）");
  const w = { ...a }, sim = simulate(w, t.x, t.y, 52, 30);
  ok(sim.arrived && Math.hypot(w.x - t.x, w.y - t.y) < 2, `とどかなくても つまらずに つく（${sim.t.toFixed(1)}びょう）`);
}
// すすまない（なにかに おしもどされる）→ まっすぐ
fresh();
{
  const a = { x: 60, y: ROOM.H - 40 }, t = { x: ROOM.W - 60, y: ROOM.H - 40 };
  for (let k = 0; k < Math.ceil((N.STUCK + 0.3) * 30); k++) { N.walk(sc, a, 52, 1 / 30, t.x, t.y); a.x = 60; a.y = ROOM.H - 40; }
  ok(a._nav && a._nav.straight && a._nav.loose, `${N.STUCK}びょう すすまないと まっすぐ（ゆるす）`);
}

// ---- 6. 家具を うごかすと さがしなおす・うごく いきさき ----
fresh();
{
  const s1 = N.signature(), g1 = N.build(sc), w = { x: 40, y: ROOM.H - 30 };
  N.walk(sc, w, 52, 1 / 30, ROOM.W - 40, ROOM.WALL + 60);
  const nav1 = w._nav; S.d.room.items.find((it) => it.id === "table_wood").x += 40;
  ok(N.signature() !== s1 && N.build(sc) !== g1, "家具を うごかすと かたちが かわる（マスを つくりなおす）");
  N.walk(sc, w, 52, 1 / 30, ROOM.W - 40, ROOM.WALL + 60);
  ok(w._nav !== nav1 && w._nav.sig === N.signature(), "あるいて いる とちゅうでも さがしなおす");
  const before = N.info(sc).blocked; S.d.room.items.push({ uid: 99, id: "rug_round", x: 300, y: 500, flip: false });
  ok(N.info(sc).blocked === before, "ラグを おいても ふさがない");
  // うごく いきさき（ボールあそび）: まいフレーム さがしなおさず、さいごの 点を うごかす
  const b = { x: 60, y: ROOM.H - 100 }; let tx = 200;
  N.walk(sc, b, 120, 1 / 30, tx, ROOM.H - 100); const first = b._nav;
  tx += 3; N.walk(sc, b, 120, 1 / 30, tx, ROOM.H - 100);
  ok(b._nav === first && b._nav.pts.at(-1).x === tx, "うごく いきさき: すこしの あいだは さいごの 点だけ うごかす");
  for (let k = 0; k < 12; k++) { tx += 2; N.walk(sc, b, 120, 1 / 30, tx, ROOM.H - 100); }
  ok(b._nav !== first && b._nav.tx === tx, "うごく いきさき: 0.25びょう たつと さがしなおす");
}

// ---- 7. はやさ ----
fresh(); S.d.rooms.expanded[S.d.rooms.active] = true;
{
  const items = []; for (let q = 0; q < 20; q++) items.push({ uid: q + 1, id: FLOORS[(q * 37) % FLOORS.length], x: 40 + rnd() * (ROOM.W - 80), y: ROOM.WALL + 60 + rnd() * (ROOM.H - ROOM.WALL - 70), flip: false });
  S.d.room.items = items; N.reset(); N.build(sc);
  const t0 = performance.now(); for (let k = 0; k < 300; k++) { const a = randPt(), t = randPt(); N.plan(sc, a, t.x, t.y); }
  const ms = (performance.now() - t0) / 300;
  ok(ms < 8, `みちを さがす じかん ${ms.toFixed(2)}ms（ひろい へや・家具 20こ）`);
}

// ---- 8. くみこみ ----
{
  const house = read("js/scene-house.js"), pc = read("js/parent-care.js"), pw = read("js/parent-work.js"), hd = read("js/home-doors.js"), ht = read("js/home-toilet.js"), ha = read("js/home-actions.js");
  ok(/case "walk": \{[\s\S]{0,200}if \(typeof HomeNav !== "undefined"\) \{ if \(HomeNav\.walk\(this, c, sp, dt\)\)/.test(house), "おうちの 3人の あるき（updateChar の walk）は HomeNav.walk");
  ok((house.match(/HomeNav\.near\(this, c\.tx, c\.ty\)/g) || []).length === 2, "ごはんに ならぶ・ねる まえの ばしょは 家具の うえに しない（HomeNav.near）");
  ok(pc.includes("HomeNav.walk(sc,p,90,dt)") && pw.includes("HomeNav.walk(sc, p, 90, dt)"), "ぱぱ・ままの あるき（おせわ・さんぽ・いってきます／ただいま）");
  ok(hd.includes("HomeNav.walk(sc, c, this.SPEED, dt, g.x, g.y)") && ht.includes("HomeNav.walk(sc, c, this.SPEED, dt, f.x, f.y)"), "ドア・おトイレまでの あるき");
  ok([house, pc, pw, hd, ht].every((s) => s.includes('typeof HomeNav !== "undefined"') || s.includes('typeof HomeNav!=="undefined"')), "HomeNav が ない ときは まえの まま（まっすぐ）");
  ok(ha.includes("id==='peek'?Math.min(p.y-60,p.y-m.footD-16):p.y+24"), "かくれて のぞく ときは 家具の うしろ（家具の なかに しない）");
  // かくれて のぞく: いきさきは 足もとの おく（へやの おくが あいて いれば）
  fresh(); const it = S.d.room.items.find((x) => x.id === "table_wood"), a = HS.anchor.call(sc, it), m = HomeDesign.model(it.id, it);
  const ty = Math.max(ROOM.WALL + 65, Math.min(a.y - 60, a.y - m.footD - 16));
  ok(!N.blockedAt(sc, a.x + 30, ty) && ty < a.y - m.footD, "テーブルの うしろで のぞく ばしょは 家具の そと");
}

// ---- 9. とうろく・PokaDebug・ことば ----
{
  const html = read("index.html"), sw = read("sw.js");
  const order = (f) => html.indexOf(`<script src="js/${f}"></script>`);
  ok(order("home-nav.js") > 0 && order("home-nav.js") > order("home-floors.js") && order("home-nav.js") < order("debug.js"), "index.html: home-floors.js の あと・debug.js の まえ");
  ok(sw.includes('"./js/home-nav.js"'), "sw.js の FILES");
  ok(typeof PokaDebug.homeNav === "function" && typeof PokaDebug.homeWalk === "function", "PokaDebug.homeNav・homeWalk");
  const dbg = read("js/debug.js");
  ok(/PokaDebug\.homeNav\(\)[^\n]*homeWalk\('goji', 300, 400\)/.test(dbg), "PokaDebug.help に homeNav・homeWalk");
  const nav = read("js/home-nav.js");
  ok(!/\bimport\b|\bexport\b/.test(nav) && /^const HomeNav = \(\(\) => \{/m.test(nav), "classic script・トップレベルは HomeNav だけ");
  const top = nav.split("\n").filter((l) => /^(const|let|var|function|class) /.test(l));
  ok(top.length === 1, "トップレベルの 名前は 1つ: " + top.map((l) => l.slice(0, 30)));
  ok(!/UI\.toast|UI\.say|textContent/.test(nav), "がめんの ことばは ださない（うごき だけ）");
  ok(!/Save\.mark|Save\.d\.[a-z]+ *=/.test(nav), "セーブは かえない");
  const road = read("docs/ROADMAP_V2.md"), ch = read("CHANGELOG.md");
  const row = road.split("\n").find((l) => l.includes("UI-73"));
  ok(row && row.includes("✅"), "ROADMAP_V2 に UI-73 ✅");
  const top2 = ch.split("\n## [")[1] || ""; ok(top2.includes("UI-73"), "CHANGELOG の いちばん うえの 版に UI-73");
}

console.log(`✓ おうちの みち（HomeNav）: ${n} 項目`);
