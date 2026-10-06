// おうちの みち（O8・UI-73。オーナーの FB 2026-10-03「お家で、できるだけ家具とごわがやぱぱままが交差(重なり、通過してしまう)しないようにして。
// だだ、詰まることを避けるため、状況に応じて許されるものとする。」）
// 3人（ごわが）と ぱぱ・ままが おうちの なかを あるく とき、ゆかの 家具と 2かいの かいだんを よけて とおる。
// - ゆかを 16 の マスに わけ、ゆかの 家具（kind floor。ラグ・かべの かざりは のぞく）の 足もとの 四角を からだの はば（PAD）だけ ひろげて ふさぐ。
//   2かいが ある ときは 1かいの かいだんの 足もとも。
// - いきさきが かわったら A*（ななめ あり・かどは けずらない）で みちを さがし、見とおしの きく ところは まっすぐに する。
// - ゆるす とき（つまらない ため）: いま 家具の うえに いる → いちばん ちかい あいた ところへ まっすぐ／いきさきが 家具の そば → さいごだけ まっすぐ／
//   いきさきが 家具の なか → ちかくの あいた ところで とまる／とどかない → いける ところまで いって さいごは まっすぐ／
//   1.2びょう すすまない → まっすぐ。
// あるく ところ: scene-house.js の updateChar（walk）・parent-care.js・parent-work.js（いってきます／ただいま）・home-doors.js・home-toilet.js。セーブは かえない。
const HomeNav = (() => {
  const C = 16, PAD = 12, EDGE = 16, BACK = 24, FRONT = 8; // マス・からだの はば・へやの ふち（よこ・おく・てまえ）
  const STUCK = 1.2, REPLAN = 0.25;
  let grid = null;
  // あるく へや（おじゃま〔js/online-visit.js〕の ときは よその おへや・2かいの かいだんは ない）
  const roomOf = (sc) => (sc && sc.guest && sc.guest.room) || (Save.d && Save.d.room);
  const stairsOn = (sc) => !(sc && sc.guest) && typeof HomeFloors !== "undefined" && HomeFloors.on() && !HomeFloors.upper();
  // いまの へやの かたち（家具の いち・へやの ひろさ・かいだん）
  function signature(sc) {
    const r = roomOf(sc); if (!r) return "";
    return ROOM.W + "x" + ROOM.H + ":" + (stairsOn(sc) ? 1 : 0) + ":" + (r.items || []).map((it) => it.id + "@" + Math.round(it.x) + "," + Math.round(it.y) + (it.flip ? "f" : "")).join("|");
  }
  // ゆかの 家具の 足もと（へやの 座標の 四角）
  function feet(sc) {
    const out = [], r = roomOf(sc);
    for (const it of (r && r.items) || []) {
      const f = FURN_INDEX[it.id]; if (!f || f.kind !== "floor") continue;
      const m = HomeDesign.model(it.id, it), a = typeof sc.anchor === "function" ? sc.anchor(it) : HouseScene.prototype.anchor.call(sc, it); // 検査の かりの へやにも
      out.push({ id: it.id, uid: it.uid, x0: a.x - m.footW / 2, x1: a.x + m.footW / 2, y0: a.y - m.footD, y1: a.y });
    }
    if (stairsOn(sc)) {
      const S = HomeFloors.STAIR; out.push({ id: "stairs", x0: S.x0, x1: S.x1, y0: ROOM.WALL + S.top, y1: ROOM.H - 6 });
    }
    return out;
  }
  function build(sc) {
    const sig = signature(sc); if (grid && grid.sig === sig) return grid;
    const w = Math.ceil(ROOM.W / C), h = Math.ceil((ROOM.H - ROOM.WALL) / C), blocked = new Uint8Array(w * h), rects = feet(sc);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = (i + 0.5) * C, y = ROOM.WALL + (j + 0.5) * C;
      if (x < EDGE || x > ROOM.W - EDGE || y < ROOM.WALL + BACK || y > ROOM.H - FRONT) { blocked[j * w + i] = 2; continue; }
      if (rects.some((r) => x > r.x0 - PAD && x < r.x1 + PAD && y > r.y0 - PAD && y < r.y1 + PAD)) blocked[j * w + i] = 1;
    }
    grid = { sig, w, h, blocked, rects };
    return grid;
  }
  const cellOf = (g, x, y) => [Math.max(0, Math.min(g.w - 1, Math.floor(x / C))), Math.max(0, Math.min(g.h - 1, Math.floor((y - ROOM.WALL) / C)))];
  const center = (i, j) => ({ x: (i + 0.5) * C, y: ROOM.WALL + (j + 0.5) * C });
  const free = (g, i, j) => i >= 0 && j >= 0 && i < g.w && j < g.h && !g.blocked[j * g.w + i];
  // その 点が 家具の 足もと（ひろげない 四角）の なか か
  const inFoot = (g, x, y, pad = 0) => g.rects.some((r) => x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad);
  // 線の うえに 家具の 足もと（ひろげない 四角）が ない か
  const clear = (g, a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / 2)); for (let k = 0; k <= n; k++) if (inFoot(g, a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n)) return false; return true; };
  // いちばん ちかい あいた マス（(px, py) からの きょり。わの じゅんに さがし、みつけた つぎの わまで くらべる）。ok を わたすと それも みたす マス
  function nearestFree(g, i0, j0, px, py, ok) {
    if (px == null) ({ x: px, y: py } = center(i0, j0));
    if (free(g, i0, j0) && (!ok || ok(i0, j0))) return [i0, j0];
    let best = null, until = Infinity;
    for (let r = 1; r < Math.max(g.w, g.h) && r <= until; r++) {
      for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || !free(g, i, j) || (ok && !ok(i, j))) continue;
        const c = center(i, j), d = (c.x - px) ** 2 + (c.y - py) ** 2; if (!best || d < best.d) best = { i, j, d };
      }
      if (best && until === Infinity) until = r + 1;
    }
    return best ? [best.i, best.j] : null;
  }
  // A*（ななめ あり・かどは けずらない）。とどかない ときは いける なかで いきさきに いちばん ちかい マスまで（reach: false）
  function astar(g, s, t) {
    const N = g.w * g.h, idx = (i, j) => j * g.w + i, gs = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const hfn = (i, j) => { const dx = Math.abs(i - t[0]), dy = Math.abs(j - t[1]); return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); };
    const open = [[hfn(s[0], s[1]), s[0], s[1]]]; gs[idx(s[0], s[1])] = 0;
    let best = { k: idx(s[0], s[1]), h: hfn(s[0], s[1]) };
    while (open.length) {
      let m = 0; for (let q = 1; q < open.length; q++) if (open[q][0] < open[m][0]) m = q;
      const [, i, j] = open[m]; open[m] = open[open.length - 1]; open.pop();
      const k = idx(i, j); if (closed[k]) continue; closed[k] = 1;
      const hk = hfn(i, j); if (hk < best.h) best = { k, h: hk };
      if (i === t[0] && j === t[1]) { best = { k, h: 0 }; break; }
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = i + di, nj = j + dj;
        if (!free(g, ni, nj) || (di && dj && (!free(g, i + di, j) || !free(g, i, j + dj)))) continue;
        const nk = idx(ni, nj), ng = gs[k] + (di && dj ? Math.SQRT2 : 1);
        if (ng < gs[nk]) { gs[nk] = ng; prev[nk] = k; open.push([ng + hfn(ni, nj), ni, nj]); }
      }
    }
    const cells = []; for (let k = best.k; k !== -1; k = prev[k]) cells.unshift([k % g.w, Math.floor(k / g.w)]);
    return { cells, reach: best.h === 0 };
  }
  // 見とおし（線の うえが ぜんぶ あいた マス）
  function sight(g, a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / (C / 3)));
    for (let k = 0; k <= n; k++) { const x = a.x + ((b.x - a.x) * k) / n, y = a.y + ((b.y - a.y) * k) / n, [i, j] = cellOf(g, x, y); if (!free(g, i, j)) return false; }
    return true;
  }
  function smooth(g, pts) {
    if (pts.length <= 2) return pts;
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) { let b = pts.length - 1; while (b > a + 1 && !sight(g, pts[a], pts[b])) b--; out.push(pts[b]); a = b; }
    return out;
  }
  // a（x, y）から (tx, ty) への みち: { pts: [{x, y}...]（さいしょは いまの ところ）, loose（どこかで 家具に かかるのを ゆるした） }
  function plan(sc, a, tx, ty) {
    const g = build(sc), here = { x: a.x, y: a.y }, goal = { x: tx, y: ty }, pts = [here];
    let loose = false, [si, sj] = cellOf(g, a.x, a.y);
    const startFree = free(g, si, sj), out = inFoot(g, a.x, a.y);
    // いま 家具の うえ → まず いちばん ちかい あいた ところへ（ゆるす）。家具の そば（ひろげた ところ）だけ なら 家具に かからずに でられる マスへ
    if (!startFree) {
      const n = (!out && nearestFree(g, si, sj, a.x, a.y, (i, j) => clear(g, here, center(i, j)))) || nearestFree(g, si, sj, a.x, a.y);
      if (!n) return { pts: [here, goal], loose: true };
      [si, sj] = n; if (out) { pts.push(center(si, sj)); loose = true; } else if (!clear(g, here, center(si, sj))) loose = true;
    }
    // いきさき: 家具の そば → さいごの まっすぐが 家具に かからない マス／家具の なか → いちばん ちかい マスで とまる
    let [ti, tj] = cellOf(g, tx, ty); const goalFree = free(g, ti, tj), inside = inFoot(g, tx, ty);
    if (!goalFree) { const n = (!inside && nearestFree(g, ti, tj, tx, ty, (i, j) => clear(g, center(i, j), goal))) || nearestFree(g, ti, tj, tx, ty); if (n) [ti, tj] = n; }
    const r = astar(g, [si, sj], [ti, tj]);
    const mid = (startFree ? r.cells.slice(1) : r.cells).map(([i, j]) => center(i, j));
    const path = smooth(g, [pts[pts.length - 1], ...mid]).slice(1);
    // とどかない → いける ところまで いって さいごは まっすぐ（ゆるす）
    if (!r.reach) { path.push(goal); loose = true; }
    else if (goalFree || !inside) { path.push(goal); if (!goalFree && !clear(g, center(ti, tj), goal)) loose = true; }
    return { pts: [...pts, ...path].filter((p, k, arr) => k === 0 || Math.hypot(p.x - arr[k - 1].x, p.y - arr[k - 1].y) > 0.5), loose };
  }
  // あるく（もどりは ついたら true）。a に _nav を もつ。speed は へやの 単位／びょう
  function walk(sc, a, speed, dt, tx = a.tx, ty = a.ty) {
    if (Math.hypot(tx - a.x, ty - a.y) < 2) { a._nav = null; return true; } // もう ついて いる（ついた あとも よばれる ところ）
    let N = a._nav;
    const sig = signature(sc);
    // いきさきが 家具の なかで ちかくに とまった あとも、おなじ いきさきの あいだは そのまま（まいフレーム さがしなおさない）
    if (N && N.done && N.sig === sig && Math.abs(N.tx - tx) <= 1 && Math.abs(N.ty - ty) <= 1 && Math.hypot(a.x - N.ex, a.y - N.ey) < 2) return true;
    if (!N || N.done || Math.abs(N.tx - tx) > 1 || Math.abs(N.ty - ty) > 1 || N.sig !== sig) {
      // ボールあそびの ように いきさきが まいフレーム うごく ときは REPLAN びょうに 1かい
      if (N && !N.done && N.sig === sig && N.age < REPLAN && Math.hypot(N.tx - tx, N.ty - ty) < 40) { N.pts[N.pts.length - 1] = { x: tx, y: ty }; N.tx = tx; N.ty = ty; }
      else { const p = plan(sc, a, tx, ty); N = a._nav = { tx, ty, sig, pts: p.pts, i: 1, loose: p.loose, straight: false, best: Infinity, still: 0, age: 0 }; }
    }
    N.age += dt;
    const goal = N.straight ? { x: tx, y: ty } : N.pts[Math.min(N.i, N.pts.length - 1)];
    if (!goal) return true;
    const dx = goal.x - a.x, dy = goal.y - a.y, d = Math.hypot(dx, dy);
    if (d < 2) {
      if (N.straight || N.i >= N.pts.length - 1) { N.done = true; N.ex = a.x; N.ey = a.y; return true; }
      N.i++; N.best = Infinity; N.still = 0; return false;
    }
    const step = Math.min(d, speed * dt); a.x += (dx / d) * step; a.y += (dy / d) * step;
    a.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    // つまった（すすまない）ときは まっすぐ（ゆるす）
    if (d < N.best - 0.5) { N.best = d; N.still = 0; } else if ((N.still += dt) > STUCK) { N.straight = true; N.loose = true; }
    return false;
  }
  // その 点の ちかくの あいた ところ（ならぶ ばしょ・ねる まえ など）
  function near(sc, x, y) {
    const g = build(sc), [i, j] = cellOf(g, x, y);
    if (free(g, i, j)) return { x, y };
    const n = nearestFree(g, i, j); return n ? center(n[0], n[1]) : { x, y };
  }
  // PokaDebug・検査 用
  function blockedAt(sc, x, y, pad = 0) { const g = build(sc); return inFoot(g, x, y, pad); }
  function info(sc) { const g = build(sc); let n = 0; for (const v of g.blocked) if (v === 1) n++; return { w: g.w, h: g.h, cell: C, pad: PAD, blocked: n, feet: g.rects.map((r) => ({ ...r })), sig: g.sig }; }
  return { C, PAD, STUCK, signature, feet, build, plan, walk, near, blockedAt, info, nearestFree, cellOf, center, free, sight, clear, reset() { grid = null; } };
})();
