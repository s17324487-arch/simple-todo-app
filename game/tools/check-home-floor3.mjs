// おうちの 3かい（js/home-floors.js・UI-115。オーナーの 指示 2026-10-09「80万円で3階を増やして」）の 検査。
// ブラウザ なしで: かう（800000・2かいを かってから・ほしぞら）・いっしょに 見える かい（1・2かい／2・3かい）・2かいの かいだん・
// 3かいは 2かいの みぎ うえ（かさならない・くっつく）・3人の みち（2かい → 3かい → 2かい）・かいだんの ところの かぐ・みち（HomeNav）・ドア・オンライン。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { Save: S, HomeFloors: F, HomeRooms: HR, HomeDesign: HD, HomeDoors, OnlineRooms: OR, ROOM } = R;
R.UI.updateHud = () => {}; R.UI.toast = () => {};
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const inPoly = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], q = poly[j]; if ((a.y > p.y) !== (q.y > p.y) && p.x < ((q.x - a.x) * (p.y - a.y)) / (q.y - a.y) + a.x) c = !c; } return c; };
const inner = (poly) => { const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length, cy = poly.reduce((s, p) => s + p.y, 0) / poly.length, out = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; for (let t = 0; t <= 20; t++) { const x = a.x + ((b.x - a.x) * t) / 20, y = a.y + ((b.y - a.y) * t) / 20, d = Math.hypot(cx - x, cy - y) || 1; out.push({ x: x + ((cx - x) / d) * 0.5, y: y + ((cy - y) / d) * 0.5 }); } }
  return out; };
const apart = (A, B) => !inner(A).some((p) => inPoly(B, p)) && !inner(B).some((p) => inPoly(A, p));
const room = (wall = "wp_cream") => ({ wall, floor: "fl_wood", items: [], wallpapers: { [wall]: true }, floors: { fl_wood: true }, nextUid: 1 });

// ---- 1. かう ----
S.d = S.fresh(); S.write = () => {}; S.d.coins = 2000000;
ok(F.CHAIN.join() === "main,upstairs,third" && F.TOP_PRICE === 800000, "かいは 3つ・3かいは 800000 コイン");
const cat = HR.catalog.find((r) => r.id === "third");
ok(cat && cat.name === "3かいの おへや" && cat.price === 800000 && HR.catalog.findIndex((r) => r.id === "third") === HR.catalog.findIndex((r) => r.id === "upstairs") + 1, "おへやの いちらんに 3かい（2かいの つぎ）");
ok(!HR.purchase("third") && S.d.coins === 2000000 && !S.d.rooms.owned.third, "2かいの まえに 3かいは かえない");
ok(HR.purchase("upstairs") && HR.purchase("third") && S.d.coins === 2000000 - 3000 - 800000, "2かい → 3かい");
ok(S.d.rooms.stored.third.wall === "wp_star" && S.d.room.wallpapers.wp_star && S.d.rooms.stored.upstairs.wall === "wp_cloud", "3かいは ほしぞらの かべがみ");
ok(!HR.purchase("third") && S.d.coins === 1197000, "2かい かわない");
ok(!HomeDoors.rooms().some((r) => r.id === "third" || r.id === "upstairs"), "ドアの「おへや」では 2かい・3かいに いかない");
ok(OR.decode({ n: "5-7", t: 1, k: "third", w: "wp_star", f: "fl_wood", z: "s" }).k === "third", "オンラインで 3かいの おへやを みせられる");

// ---- 2. いっしょに 見える かい・かいだん ----
const at = (id) => { S.d.rooms.active = id; };
at("main"); ok(F.pair().join() === "main,upstairs" && !F.upper() && F.stairsHere(), "1かい: 1・2かい・かいだん あり");
at("upstairs"); ok(F.pair().join() === "main,upstairs" && F.upper() && F.stairsHere() && F.stairsAt("upstairs"), "2かい: 1・2かい・3かいへの かいだん あり");
at("third"); ok(F.pair().join() === "upstairs,third" && F.upper() && !F.stairsHere() && F.on(), "3かい: 2・3かい・かいだん なし");
at("garden"); ok(!F.on(), "べつの おへやでは かいが ない");
S.d.rooms.owned.third = false; at("upstairs"); ok(!F.stairsHere() && !F.stairsAt("upstairs"), "3かいが なければ 2かいに かいだんは ない");
S.d.rooms.owned.third = true;

// ---- 3. かたち（ひろさ 2×2 とおり）----
for (const e2 of [false, true]) for (const e3 of [false, true]) for (const cur of ["upstairs", "third"]) {
  S.d.rooms.expanded = { main: false, upstairs: e2, third: e3 }; at(cur);
  const tag = JSON.stringify({ e2, e3, cur });
  const sc = { s: 1, ox: 0, oy: 0, chars: [], life: {} };
  if (cur === "third") {
    const lo = F.roomPoly(sc, "upstairs"), hi = F.roomPoly(sc, "third"), fl = F.floorPoly(sc, "third"), st = F.stairsPoly(sc, F.base(sc), "upstairs"), top = F.roomAt(sc, "upstairs");
    const cx = (ps) => ps.reduce((s, p) => s + p.x, 0) / ps.length, cy = (ps) => ps.reduce((s, p) => s + p.y, 0) / ps.length;
    ok(cx(hi) > cx(lo) && cy(hi) < cy(lo) && apart(fl, lo) && apart(hi, lo), "3かいは 2かいの みぎ うえ・かさならない " + tag);
    const w0 = top(0, 0, HD.H), f0 = fl[4];
    ok(Math.hypot(f0.x - w0.x, f0.y - w0.y) < 1e-6 && !st.some((p) => inPoly(fl, p)), "3かいの ゆかが 2かいの かべの うえ・かいだんの タップが 3かいに かからない " + tag);
    const w = F.path(sc, "down"), last = w[w.length - 1];
    ok(w[0].z === 0 && last.z === -(HD.H + F.LIFT), "3かい → 2かいの みち " + tag);
  } else {
    // 2かいに いる: いる かいの かいだん（3かいへ）と したの かいの かいだん（1かいへ）は べつの ところ
    const mine = F.stairsPoly(sc, F.floorAt(sc, "upstairs"), "upstairs"), down = F.stairsPoly(sc, F.base(sc), "main");
    ok(apart(mine, down), "2かいの かいだんと 1かいの かいだんの タップが かさならない " + tag);
    const w = F.path(sc, "up"), last = w[w.length - 1], D2 = F.size("upstairs").d;
    ok(w[0].z === 0 && last.z === HD.H + F.LIFT && last.y < ROOM.WALL && w[0].y > ROOM.WALL + D2 - 40, "2かい → 3かいの みち（2かいの かいだんの した から）" + tag);
  }
}

// ---- 4. 2かいの かいだんの ところ（かぐ・みち）----
{
  S.d.rooms.expanded = {}; at("upstairs");
  const sc = Object.create(R.HouseScene.prototype); sc.guest = null;
  const it = { uid: 1, id: "bookshelf", x: 30, y: 470 }; F.keepOut(sc, it);
  ok(it.x >= F.STAIR.x1 + 10, "2かいの かいだんの ところに かぐを おかない " + it.x);
}
{
  const src = readFileSync(new URL("../js/home-nav.js", import.meta.url), "utf8");
  ok(/stairsOn = \(sc\) => [^\n]*HomeFloors\.stairsHere\(\)/.test(src), "みち（HomeNav）は かいだんの ある かいで かいだんを よける（2かいも）");
}

// ---- 5. のぼる・おりる（いく さき）----
{
  at("upstairs");
  const sc = { climb: { dir: "up", t: 99 }, chars: [] }; let went = null;
  const g0 = R.Game.goto; R.Game.goto = (scene, p) => { went = [scene, p.floor]; };
  F.update(sc, 0.1); ok(S.d.rooms.active === "third" && went && went[1] === "up", "2かいの かいだん → 3かい");
  sc.climb = { dir: "down", t: 99 }; F.update(sc, 0.1); ok(S.d.rooms.active === "upstairs", "3かいの かいだん → 2かい");
  sc.climb = { dir: "down", t: 99 }; F.update(sc, 0.1); ok(S.d.rooms.active === "main", "2かい → 1かい");
  R.Game.goto = g0;
}
console.log(`✓ おうちの 3かい（UI-115）: ${n} 項目`);
