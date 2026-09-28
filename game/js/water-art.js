// 水の 絵（川・海・湖・どうくつの いずみ）。どの マスが 水かは これまでと おなじ（通れる・通れない・釣りの 場所も かわらない）。
// 見た目だけ マスの かどを なめらかな 岸に して、水の かたまりごとに 川・海・湖を 形から 見わけて 描きわける。
//  ・しずかな ところ（ふかさの 色・ながれの すじ・岸・はしの いた・はす・あし）は Tiles.chunk の キャッシュに 1かいだけ（chunk）
//  ・うごく ところ（ながれ・波うちぎわの あわ・波がしら・波紋・きらめき・雨の わ）は WorldScene.renderWater で 毎フレーム（frame）
// マップを 作りなおしても そのまま ついていく（かたまりの 形で 見わける。def.waterKind で 1つに きめる ことも できる）。
const WaterArt = (() => {
  const Q = 4, STEP = TS / Q; // 岸の 線は 1マスを 4×4 に わけて もとめる（8 論理px ごと）
  const WET = (t) => t === "water" || t === "bridge";
  const GREEN = new Set(["grass", "flower", "tall", "forest", "fflower"]);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // ふかさの 色（あさい → ふかい）。D: この ふかさ（マス）で いちばん こい 色。muted は 町（つくりなおした 町の しずかな 色あい）
  const PAL = {
    river: { ramp: ["#B3E2DF", "#86C9D8", "#5DA9CC"], D: 1.8 },
    sea: { ramp: ["#AFE6D6", "#72C9CF", "#479FC8", "#2F7DB2"], D: 5.5 },
    lake: { ramp: ["#BDE4D2", "#8DCBCB", "#5FA4BF"], D: 2.6 },
    cave: { ramp: ["#79ABAE", "#437E8A", "#29586A"], D: 2.2 },
  };
  const MUTED = {
    river: { ramp: ["#AFD8D3", "#83BFCB", "#5F9FBE"], D: 1.8 },
    sea: { ramp: ["#A6DCD0", "#6FBBC6", "#4A91B7", "#35729E"], D: 5.5 },
    lake: { ramp: ["#B6DACB", "#8BC0C4", "#6199B4"], D: 2.6 },
  };
  for (const set of [PAL, MUTED]) for (const k in set) set[k].rgb = set[k].ramp.map(rgb);
  const SAND = rgb("#E9D9A6");
  const maps = new WeakMap();

  // なめらかな ノイズ（0〜1）。世界の 座標で きめるので チャンクの さかいめでも つながる
  function noise(x, y, k) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = U.hash(xi, yi, k), b = U.hash(xi + 1, yi, k), c = U.hash(xi, yi + 1, k), d = U.hash(xi + 1, yi + 1, k);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // 2じの B スプライン（マスの まんなかで 1 の 水を なめらかに ぼかす。まっすぐな 岸は マスの さかいめに のこる）
  const B2 = (d) => { d = Math.abs(d); return d <= 0.5 ? 0.75 - d * d : d < 1.5 ? 0.5 * (1.5 - d) * (1.5 - d) : 0; };
  function ramp(stops, t) {
    t = clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i, a = stops[i], b = stops[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  // 岸の 陸がわ: beach（すな）・grass（くさ・もり）・earth（つち・みち）・rock（どうくつ）・quay（石だたみ・どうろ・いしがき）
  function styleOf(t, urban = false) {
    if (t === "sand") return "beach";
    if (GREEN.has(t)) return "grass";
    if (t === "dirt" || t === "path") return urban ? "quay" : "earth";
    if (t === "cave" || t === "cavewall") return "rock";
    return "quay";
  }
  // 岸から 水へ はいった すぐの ふかさ（すなはま は あさく、いしがきは すぐ ふかい）
  const DROP = { beach: 0, grass: 0.3, earth: 0.4, rock: 0.6, quay: 3.4 };

  // ---- マップごとの したごしらえ（1かいだけ）----
  function prep(map) {
    let P = maps.get(map);
    if (P) return P;
    const w = map.w, h = map.h, n = w * h, wet = new Uint8Array(n);
    let count = 0;
    if (!map.def.indoor) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = map.groundAt(x, y); if (WET(t)) { wet[y * w + x] = t === "bridge" ? 2 : 1; count++; } } // 2: はしの 下の 水
    P = { any: count > 0, w, h, wet, count, muted: !!map.def.renewal };
    maps.set(map, P);
    if (!P.any) return P;
    const at = (x, y) => wet[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
    P.at = at;
    // 1) 水の かたまり（4方向で つながる マス）
    const comp = new Int32Array(n).fill(-1), comps = [];
    for (let i = 0; i < n; i++) {
      if (!wet[i] || comp[i] >= 0) continue;
      const c = { id: comps.length, tiles: [], x0: w, y0: h, x1: 0, y1: 0, edge: false };
      const q = [i]; comp[i] = c.id;
      while (q.length) {
        const k = q.pop(), x = k % w, y = (k - x) / w;
        c.tiles.push(k); c.x0 = Math.min(c.x0, x); c.y0 = Math.min(c.y0, y); c.x1 = Math.max(c.x1, x); c.y1 = Math.max(c.y1, y);
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) c.edge = true;
        for (const [dx, dy] of N4) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const kk = yy * w + xx;
          if (wet[kk] && comp[kk] < 0) { comp[kk] = c.id; q.push(kk); }
        }
      }
      comps.push(c);
    }
    P.comp = comp; P.comps = comps;
    // 2) 川・海・湖を 見わける
    for (const c of comps) c.kind = kindOf(map, P, c);
    if (!map.def.waterKind) for (const c of comps) {
      if (c.kind !== "lake" || c.tiles.length > 8) continue;
      if (comps.some((r) => r.kind === "river" && ((r.x0 <= c.x1 && c.x0 <= r.x1 && c.x1 - c.x0 < 3) || (r.y0 <= c.y1 && c.y0 <= r.y1 && c.y1 - c.y0 < 3)))) c.kind = "river";
    }
    for (const c of comps) c.pal = map.baseGround === "cave" ? PAL.cave : (P.muted && MUTED[c.kind]) || PAL[c.kind];
    // 3) ふかさ（岸からの マスの かず。いしがきの そばは はじめから ふかい）
    const depth = new Float32Array(n);
    for (let k = 0; k < n; k++) depth[k] = wet[k] ? 1e9 : 0;
    for (let k = 0; k < n; k++) {
      if (!wet[k]) continue;
      const x = k % w, y = (k - x) / w, river = comps[comp[k]].kind === "river";
      for (const [dx, dy] of N4) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h || wet[yy * w + xx]) continue;
        const drop = DROP[styleOf(map.groundAt(xx, yy), P.muted)];
        depth[k] = Math.min(depth[k], 1 + (river ? Math.min(drop, 0.5) : drop));
      }
    }
    for (let pass = 0; pass < w + h; pass++) {
      let changed = false;
      for (let k = 0; k < n; k++) {
        if (!wet[k]) continue;
        const x = k % w, y = (k - x) / w;
        for (const [dx, dy] of N4) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const kk = yy * w + xx;
          if (wet[kk] && depth[kk] + 1 < depth[k]) { depth[k] = depth[kk] + 1; changed = true; }
        }
      }
      if (!changed) break;
    }
    for (let k = 0; k < n; k++) if (depth[k] > 1e8) depth[k] = 6; // 岸の ない 水（マップ ぜんぶが 水）
    // いしがきの 陸にも となりの 水の ふかさを もたせる（きわまで ふかい 色。すなはま・どては 0 の まま → あさく 見える）
    for (let k = 0; k < n; k++) {
      if (wet[k]) continue;
      const x = k % w, y = (k - x) / w;
      if (styleOf(map.groundAt(x, y), P.muted) !== "quay") continue;
      for (const [dx, dy] of N4) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && wet[yy * w + xx]) depth[k] = Math.max(depth[k], depth[yy * w + xx]); }
    }
    P.depth = depth;
    for (const c of comps) {
      let sx = 0, sy = 0;
      for (const k of c.tiles) {
        const x = k % w, y = (k - x) / w;
        for (const [dx, dy] of N4) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && !wet[yy * w + xx]) { sx += dx; sy += dy; } }
      }
      const l = Math.hypot(sx, sy);
      c.swell = l > 1e-6 ? [sx / l, sy / l] : [-1, 0];
    }
    // 4) 川の ながれ（上流の はしからの みちのり が ふえる むき）
    const flow = new Float32Array(n * 2);
    for (const c of comps) if (c.kind === "river") riverFlow(P, c, flow);
    P.flow = flow;
    // 5) 岸の 線の もとに なる 場（B スプライン ＋ すこしの ゆらぎ）と、こまかい 点ごとの ふかさ
    const W1 = w * Q + 1, H1 = h * Q + 1, f = new Float32Array(W1 * H1), dep = new Float32Array(W1 * H1);
    const depthAt = (x, y) => depth[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
    for (let j = 0; j < H1; j++) {
      const v = j / Q, ya = Math.floor(v - 2);
      for (let i = 0; i < W1; i++) {
        const u = i / Q, xa = Math.floor(u - 2);
        let s = 0;
        for (let y = ya; y <= ya + 3; y++) {
          const by = B2(v - (y + 0.5));
          if (!by) continue;
          for (let x = xa; x <= xa + 3; x++) { const bx = B2(u - (x + 0.5)); if (bx && at(x, y)) s += bx * by; }
        }
        // ゆらぎ: マスの まんなかでは ちいさく（水の マスは かならず 水・陸の マスは かならず 陸に 見える）、さかいめで 大きく
        const cu = u - Math.floor(u) - 0.5, cv = v - Math.floor(v) - 0.5, dc = Math.min(1, (cu * cu + cv * cv) / 0.25);
        const nz = 0.65 * noise(u * 0.8, v * 0.8, 51) + 0.35 * noise(u * 2.1, v * 2.1, 52) - 0.5;
        f[j * W1 + i] = s + nz * 2 * (0.05 + 0.15 * dc);
        const gx = u - 0.5, gy = v - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
        const d00 = depthAt(x0, y0), d10 = depthAt(x0 + 1, y0), d01 = depthAt(x0, y0 + 1), d11 = depthAt(x0 + 1, y0 + 1);
        dep[j * W1 + i] = (d00 * (1 - fx) + d10 * fx) * (1 - fy) + (d01 * (1 - fx) + d11 * fx) * fy;
      }
    }
    Object.assign(P, { W1, H1, f, dep });
    // 6) 岸の 線（マーチング スクエアの 線を つないだ もの。世界の 座標）
    P.shores = shores(map, P);
    // 7) うごく もの（チャンク 8×8 マスごとに わける）
    P.parts = particles(map, P);
    return P;
  }

  function kindOf(map, P, c) {
    const fixed = map.def.waterKind;
    if (fixed === "river" || fixed === "sea" || fixed === "lake") return fixed;
    // ほそながい（はば 2.6 マスより ほそく、ながさが はばの 2.2 ばい いじょう）→ 川。ふとくて 大きい（または マップの はしへ ひろがる）→ 海
    const area = c.tiles.length, { L } = longest(P, c);
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1, long = Math.max(bw, bh), short = Math.min(bw, bh);
    if (area >= 4 && area / L <= 2.6 && (L >= 8 || long >= 2.2 * short)) return "river";
    if (area >= 150 || (c.edge && area >= 60)) return "sea";
    return "lake";
  }
  // かたまりの なかで いちばん とおい 2つの はし（みちのり）
  function bfs(P, c, from) {
    const dist = new Map([[from, 0]]), q = [from];
    let far = from;
    for (let qi = 0; qi < q.length; qi++) {
      const k = q[qi], x = k % P.w, y = (k - x) / P.w, d = dist.get(k);
      if (d > dist.get(far)) far = k;
      for (const [dx, dy] of N4) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= P.w || yy >= P.h) continue;
        const kk = yy * P.w + xx;
        if (P.comp[kk] === c.id && !dist.has(kk)) { dist.set(kk, d + 1); q.push(kk); }
      }
    }
    return { dist, far };
  }
  function longest(P, c) {
    if (c.longest) return c.longest;
    const a = bfs(P, c, c.tiles[0]).far, b = bfs(P, c, a);
    return (c.longest = { u: a, v: b.far, L: b.dist.get(b.far) + 1 });
  }
  function riverFlow(P, c, flow) {
    const { u, v } = longest(P, c), w = P.w;
    const up = u % w + (u / w | 0) * 1000 <= v % w + (v / w | 0) * 1000 ? u : v; // 上（ひだり）の はしが 上流
    const { dist } = bfs(P, c, up);
    for (const k of c.tiles) {
      const x = k % w, y = (k - x) / w, d = dist.get(k);
      let fx = 0, fy = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= P.h) continue;
        const dd = dist.get(yy * w + xx);
        if (dd == null) continue;
        const l = Math.hypot(dx, dy);
        fx += ((dd - d) * dx) / l; fy += ((dd - d) * dy) / l;
      }
      const l = Math.hypot(fx, fy) || 1;
      flow[k * 2] = fx / l; flow[k * 2 + 1] = fy / l;
    }
    // となりと ならして まがりかどを なめらかに
    for (let pass = 0; pass < 2; pass++) {
      const next = new Map();
      for (const k of c.tiles) {
        const x = k % w, y = (k - x) / w;
        let fx = flow[k * 2] * 2, fy = flow[k * 2 + 1] * 2;
        for (const [dx, dy] of N4) {
          const xx = x + dx, yy = y + dy, kk = yy * w + xx;
          if (xx < 0 || yy < 0 || xx >= w || yy >= P.h || P.comp[kk] !== c.id) continue;
          fx += flow[kk * 2]; fy += flow[kk * 2 + 1];
        }
        const l = Math.hypot(fx, fy) || 1;
        next.set(k, [fx / l, fy / l]);
      }
      for (const [k, [fx, fy]] of next) { flow[k * 2] = fx; flow[k * 2 + 1] = fy; }
    }
  }

  // こまかい 点の 場（世界の 座標 x, y → 0〜1 の 水らしさ）
  function field(P, x, y) {
    const gi = clamp(x / STEP, 0, P.W1 - 1.001), gj = clamp(y / STEP, 0, P.H1 - 1.001), i = Math.floor(gi), j = Math.floor(gj), fx = gi - i, fy = gj - j, W1 = P.W1, f = P.f;
    return (f[j * W1 + i] * (1 - fx) + f[j * W1 + i + 1] * fx) * (1 - fy) + (f[(j + 1) * W1 + i] * (1 - fx) + f[(j + 1) * W1 + i + 1] * fx) * fy;
  }
  function depthField(P, x, y) {
    const gi = clamp(x / STEP, 0, P.W1 - 1.001), gj = clamp(y / STEP, 0, P.H1 - 1.001), i = Math.floor(gi), j = Math.floor(gj), fx = gi - i, fy = gj - j, W1 = P.W1, d = P.dep;
    return (d[j * W1 + i] * (1 - fx) + d[j * W1 + i + 1] * fx) * (1 - fy) + (d[(j + 1) * W1 + i] * (1 - fx) + d[(j + 1) * W1 + i + 1] * fx) * fy;
  }
  // x, y の いちばん ちかい 水の かたまり
  function compNear(P, x, y) {
    const tx = clamp(Math.floor(x / TS), 0, P.w - 1), ty = clamp(Math.floor(y / TS), 0, P.h - 1);
    for (let r = 0; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = tx + dx, yy = ty + dy;
      if (xx < 0 || yy < 0 || xx >= P.w || yy >= P.h) continue;
      const c = P.comp[yy * P.w + xx];
      if (c >= 0) return P.comps[c];
    }
    return P.comps[0];
  }

  // x, y に いちばん ちかい 陸の マスの 地面（岸の 陸がわの しゅるい）
  function landNear(map, P, x, y) {
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    let best = null, bd = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = clamp(tx + dx, 0, P.w - 1), yy = clamp(ty + dy, 0, P.h - 1);
      if (P.wet[yy * P.w + xx]) continue;
      const d = Math.hypot((xx + 0.5) * TS - x, (yy + 0.5) * TS - y);
      if (d < bd) { bd = d; best = map.groundAt(xx, yy); }
    }
    return best || "grass";
  }

  // 海の 波が すすむ むき（岸へ）。とおくは かたまりの うねり、ふかさ 1.2〜3.7 で 岸の むきへ まがる
  function waveDir(P, c, x, y) {
    const e = 6, gx = depthField(P, x + e, y) - depthField(P, x - e, y), gy = depthField(P, x, y + e) - depthField(P, x, y - e), gl = Math.hypot(gx, gy);
    const s = gl > 1e-3 ? clamp(1 - (depthField(P, x, y) - 1.2) / 2.5, 0, 1) : 0;
    const vx = c.swell[0] * (1 - s) + (gl > 1e-3 ? -gx / gl : 0) * s, vy = c.swell[1] * (1 - s) + (gl > 1e-3 ? -gy / gl : 0) * s, l = Math.hypot(vx, vy) || 1;
    return [vx / l, vy / l];
  }

  // ---- マーチング スクエア ----
  // 1つの ます目（こまかい 点 4つ）の 水の がわの 形。pts: [x, y, 辺の 番号 or -1]。boundary: 岸の 線の ぶぶん（辺 → 辺）
  function cell(P, i, j, out) {
    const W1 = P.W1, f = P.f;
    const v = [f[j * W1 + i], f[j * W1 + i + 1], f[(j + 1) * W1 + i + 1], f[(j + 1) * W1 + i]];
    const inside = v.map((x) => x >= 0.5), m = inside[0] | (inside[1] << 1) | (inside[2] << 2) | (inside[3] << 3);
    out.length = 0;
    if (m === 0) return 0;
    if (m === 15) return 15;
    const cx = [i, i + 1, i + 1, i], cy = [j, j, j + 1, j + 1];
    // 辺の 番号（となりの ます目と おなじ 番号）: 上 2*(j*W1+i)、右 2*(j*W1+i+1)+1、下 2*((j+1)*W1+i)、左 2*(j*W1+i)+1
    const eid = [2 * (j * W1 + i), 2 * (j * W1 + i + 1) + 1, 2 * ((j + 1) * W1 + i), 2 * (j * W1 + i) + 1];
    const saddle = m === 5 || m === 10, apart = saddle && (v[0] + v[1] + v[2] + v[3]) / 4 < 0.5;
    const point = (k) => { const k2 = (k + 1) % 4, t = (0.5 - v[k]) / (v[k2] - v[k]); return [cx[k] + (cx[k2] - cx[k]) * t, cy[k] + (cy[k2] - cy[k]) * t, eid[k]]; };
    if (apart) {
      // はなれた 2つの 水（さかいめ で つながらない）: かどごとに 三角
      for (const k of m === 5 ? [0, 2] : [1, 3]) { const pk = (k + 3) % 4; out.push([[cx[k], cy[k], -1], point(k), point(pk)]); }
      return m;
    }
    const poly = [];
    for (let k = 0; k < 4; k++) {
      if (inside[k]) poly.push([cx[k], cy[k], -1]);
      if (inside[k] !== inside[(k + 1) % 4]) poly.push(point(k));
    }
    out.push(poly);
    return m;
  }
  // 岸の 線: ます目ごとの 線を つないで、陸の しゅるい・水の しゅるいごとに わけた 線にする
  function shores(map, P) {
    const segs = new Map(), polys = [];
    for (let j = 0; j < P.H1 - 1; j++) for (let i = 0; i < P.W1 - 1; i++) {
      const m = cell(P, i, j, polys);
      if (m === 0 || m === 15) continue;
      for (const poly of polys) {
        for (let a = 0; a < poly.length; a++) {
          const p = poly[a], q = poly[(a + 1) % poly.length];
          if (p[2] >= 0 && q[2] >= 0) segs.set(p[2], { from: p[2], to: q[2], x0: p[0] * STEP, y0: p[1] * STEP, x1: q[0] * STEP, y1: q[1] * STEP });
        }
      }
    }
    // つなぐ（はじまりの 辺 → おわりの 辺）
    const ends = new Set([...segs.values()].map((s) => s.to)), used = new Set(), lines = [];
    const walk = (start) => {
      const pts = [];
      let s = segs.get(start);
      pts.push(s.x0, s.y0);
      while (s && !used.has(s.from)) { used.add(s.from); pts.push(s.x1, s.y1); s = segs.get(s.to); }
      return { pts, closed: !!s && s.from === start };
    };
    for (const s of segs.values()) if (!ends.has(s.from) && !used.has(s.from)) lines.push(walk(s.from));
    for (const s of segs.values()) if (!used.has(s.from)) lines.push(walk(s.from));
    // 点ごとの むき（水の がわ）と 岸の しゅるい。おなじ しゅるいの つづきで きる
    const out = [];
    for (const line of lines) {
      const p = line.pts, cnt = p.length / 2;
      if (cnt < 2) continue;
      const nx = new Float32Array(cnt), ny = new Float32Array(cnt);
      for (let a = 0; a < cnt; a++) {
        const b = Math.max(0, a - 1), c = Math.min(cnt - 1, a + 1);
        let dx = p[c * 2] - p[b * 2], dy = p[c * 2 + 1] - p[b * 2 + 1];
        if (line.closed && (a === 0 || a === cnt - 1)) { dx = p[2] - p[(cnt - 2) * 2]; dy = p[3] - p[(cnt - 2) * 2 + 1]; }
        const l = Math.hypot(dx, dy) || 1;
        nx[a] = -dy / l; ny[a] = dx / l;
      }
      // むきの たしかめ（水の がわが 0.5 より 大きい はず）
      const mid = cnt >> 1;
      if (field(P, p[mid * 2] + nx[mid] * 4, p[mid * 2 + 1] + ny[mid] * 4) < field(P, p[mid * 2] - nx[mid] * 4, p[mid * 2 + 1] - ny[mid] * 4)) for (let a = 0; a < cnt; a++) { nx[a] = -nx[a]; ny[a] = -ny[a]; }
      const tagOf = (a) => {
        const x = p[a * 2], y = p[a * 2 + 1];
        return { style: styleOf(landNear(map, P, x - nx[a] * TS * 0.5, y - ny[a] * TS * 0.5), P.muted), comp: compNear(P, x + nx[a] * TS * 0.5, y + ny[a] * TS * 0.5) };
      };
      let a0 = 0, tag = tagOf(0);
      for (let a = 1; a <= cnt; a++) {
        const t = a < cnt ? tagOf(a) : null;
        if (t && t.style === tag.style && t.comp === tag.comp && a - a0 < 48) continue;
        const b = Math.min(cnt - 1, a); // つぎの きれはしと 1点 かさねる（線が とぎれない）
        const pts = p.slice(a0 * 2, b * 2 + 2), nn = [nx.slice(a0, b + 1), ny.slice(a0, b + 1)];
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let k = 0; k < pts.length; k += 2) { x0 = Math.min(x0, pts[k]); x1 = Math.max(x1, pts[k]); y0 = Math.min(y0, pts[k + 1]); y1 = Math.max(y1, pts[k + 1]); }
        out.push({ pts, nx: nn[0], ny: nn[1], style: tag.style, kind: tag.comp.kind, pal: tag.comp.pal, box: [x0, y0, x1, y1], seed: out.length });
        a0 = b; tag = t || tag;
      }
    }
    return out;
  }

  // ---- うごく もの ----
  function particles(map, P) {
    const parts = new Map(), w = P.w;
    const bucket = (x, y) => { const k = Math.floor(y / (8 * TS)) * 1000 + Math.floor(x / (8 * TS)); let b = parts.get(k); if (!b) parts.set(k, (b = { flow: [], crest: [], glint: [], ring: [] })); return b; };
    for (let k = 0; k < P.wet.length; k++) {
      if (!P.wet[k]) continue;
      const tx = k % w, ty = (k - tx) / w, c = P.comps[P.comp[k]], H = (s) => U.hash(tx, ty, 700 + s);
      const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS, d = P.depth[k];
      const inW = (x, y, m = 0.62) => field(P, x, y) >= m;
      if (c.kind === "river") {
        const fx = P.flow[k * 2], fy = P.flow[k * 2 + 1];
        for (let s = 0; s < 2; s++) {
          const bx = cx + (H(s) - 0.5) * TS * 0.7, by = cy + (H(s + 5) - 0.5) * TS * 0.7;
          let span = TS * (0.7 + H(s + 9) * 0.5);
          while (span > TS * 0.2 && !(inW(bx - fx * span / 2, by - fy * span / 2) && inW(bx + fx * span / 2, by + fy * span / 2))) span *= 0.7;
          if (span <= TS * 0.2 || !inW(bx, by)) continue;
          bucket(bx, by).flow.push({ x: bx, y: by, dx: fx, dy: fy, span, len: TS * (0.22 + H(s + 13) * 0.2), speed: TS * (0.55 + H(s + 17) * 0.45), ph: H(s + 21), bend: (H(s + 25) - 0.5) * 0.5 });
        }
      }
      if (c.kind === "sea" && d >= 1.3 && H(30) < (P.muted ? 0.07 : 0.16)) { // 港の 中（町の 海）は おだやか
        const bx = cx + (H(31) - 0.5) * TS * 0.6, by = cy + (H(32) - 0.5) * TS * 0.6, [dx, dy] = waveDir(P, c, bx, by);
        if (inW(bx, by, 0.7)) bucket(bx, by).crest.push({ x: bx, y: by, dx, dy, len: TS * (0.55 + H(33) * 0.5), life: 5 + H(34) * 4, ph: H(35), travel: TS * 0.8 });
      }
      const glintRate = c.pal === PAL.cave ? 0.35 : c.kind === "sea" ? 0.4 : c.kind === "lake" ? 0.25 : 0.18;
      if (H(40) < glintRate) {
        const bx = cx + (H(41) - 0.5) * TS * 0.7, by = cy + (H(42) - 0.5) * TS * 0.7;
        if (inW(bx, by)) bucket(bx, by).glint.push({ x: bx, y: by, period: 2.4 + H(43) * 3, ph: H(44), size: 1.6 + H(45) * 1.6, cave: c.pal === PAL.cave });
      }
      if (c.kind === "lake" && d >= 1 && H(50) < 0.12) {
        const bx = cx + (H(51) - 0.5) * TS * 0.5, by = cy + (H(52) - 0.5) * TS * 0.5, R = TS * (0.3 + H(53) * 0.35);
        if (inW(bx - R, by) && inW(bx + R, by)) bucket(bx, by).ring.push({ x: bx, y: by, R, period: 4 + H(54) * 4, ph: H(55) });
      }
    }
    return parts;
  }

  // ---- チャンク（しずかな ところ）----
  const tmp = typeof document !== "undefined" ? document.createElement("canvas") : null;
  function on(map) { return !!map && !map.def.indoor && prep(map).any; }
  // 水の マスの 下地（岸の 線の そとがわに 見える ところ）: となりの 陸と おなじ 地面を 描く
  function under(g, map, tx, ty, x, y, s) {
    const P = prep(map);
    let best = null, bestN = 0;
    const counts = {};
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const xx = tx + dx, yy = ty + dy;
      if (xx < 0 || yy < 0 || xx >= P.w || yy >= P.h || P.wet[yy * P.w + xx]) continue;
      const t = map.groundAt(xx, yy);
      counts[t] = (counts[t] || 0) + 1;
      if (counts[t] > bestN) { bestN = counts[t]; best = t; }
    }
    if (!best) return; // まわりも 水（水の 絵で ぜんぶ おおう）
    const fake = Object.create(map);
    fake.groundAt = (xx, yy) => (xx === tx && yy === ty ? best : WET(map.groundAt(xx, yy)) ? best : map.groundAt(xx, yy));
    Tiles.drawGround(g, fake, tx, ty, x, y, s);
  }
  function chunk(g, map, cx, cy, s, N) {
    const P = prep(map);
    if (!P.any || !tmp) return;
    const tx0 = cx * N - 1, ty0 = cy * N - 1, tx1 = (cx + 1) * N, ty1 = (cy + 1) * N;
    let near = false;
    for (let y = Math.max(0, ty0); y <= Math.min(P.h - 1, ty1) && !near; y++) for (let x = Math.max(0, tx0); x <= Math.min(P.w - 1, tx1); x++) if (P.wet[y * P.w + x]) { near = true; break; }
    if (!near) return;
    const k = s / TS, X0 = cx * N * TS, Y0 = cy * N * TS, X1 = X0 + N * TS, Y1 = Y0 + N * TS, box = [X0 - TS, Y0 - TS, X1 + TS, Y1 + TS];
    g.save(); g.scale(k, k); g.translate(-X0, -Y0);
    g.lineCap = "round"; g.lineJoin = "round";
    const water = waterPath(P, box), pieces = P.shores.filter((p) => p.box[0] < box[2] && p.box[2] > box[0] && p.box[1] < box[3] && p.box[3] > box[1]);
    // 1) 岸の 陸がわ（ぬれた すな・どての 線・いしがきの ふち）
    for (const p of pieces) {
      const st = bankStyle(p);
      if (!st.band) continue;
      g.strokeStyle = st.band; g.lineWidth = st.bandW * 2; stroke(g, p.pts);
    }
    // 2) 水面
    g.save(); g.clip(water);
    paintDepth(g, P, map, cx, cy, N);
    decorate(g, P, map, X0, Y0, X1, Y1);
    for (const p of pieces) { const st = bankStyle(p); if (!st.rim) continue; g.strokeStyle = st.rim; g.lineWidth = st.rimW * 2; stroke(g, p.pts); }
    g.restore();
    // 3) 岸の 線（あわ・どての ふち）
    for (const p of pieces) {
      const st = bankStyle(p);
      g.strokeStyle = st.line; g.lineWidth = st.lineW; stroke(g, p.pts);
      if (p.kind === "sea" && p.style === "beach") { g.save(); g.setLineDash([3, 5]); g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 1.2; stroke(g, p.pts, 3.5, p); g.restore(); }
    }
    // 4) あし（くさの 岸）
    for (const p of pieces) if (p.style === "grass" && p.kind !== "sea") reeds(g, p, box);
    g.restore();
    // 5) はしの いた（水の うえ）
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const tx = cx * N + i, ty = cy * N + j;
      if (tx < P.w && ty < P.h && map.groundAt(tx, ty) === "bridge") Tiles.bridgeDeck(g, i * s, j * s, s);
    }
  }
  function stroke(g, pts, off = 0, p = null) {
    g.beginPath();
    for (let a = 0; a < pts.length; a += 2) {
      const x = pts[a] + (p ? p.nx[a / 2] * off : 0), y = pts[a + 1] + (p ? p.ny[a / 2] * off : 0);
      if (a) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  function bankStyle(p) {
    const cave = p.pal === PAL.cave, pal = SeasonPalette.get();
    switch (p.style) {
      case "beach": return p.kind === "sea"
        ? { band: "#DCC48E", bandW: 5.5, rim: "rgba(255,255,255,0.32)", rimW: 3, line: "rgba(255,255,255,0.92)", lineW: 1.8 }
        : { band: "#DECA96", bandW: 3.5, rim: "rgba(255,255,255,0.28)", rimW: 2.5, line: "rgba(255,255,255,0.6)", lineW: 1.2 };
      case "grass": return { band: pal.forestDark, bandW: 2.4, rim: "rgba(255,255,255,0.26)", rimW: 2.2, line: "rgba(70,96,52,0.55)", lineW: 1.3 };
      case "earth": return { band: "#B79467", bandW: 2.6, rim: "rgba(255,255,255,0.22)", rimW: 2, line: "rgba(110,80,48,0.55)", lineW: 1.2 };
      case "rock": return { band: "#4D443D", bandW: 2.6, rim: "rgba(10,20,25,0.28)", rimW: 3, line: cave ? "rgba(191,246,255,0.35)" : "rgba(40,34,30,0.7)", lineW: 1.2 };
      default: return { band: "#A7AAA4", bandW: 3, rim: "rgba(12,40,62,0.26)", rimW: 5, line: "#6C706E", lineW: 1.4 };
    }
  }
  // ます目の 水の 形を 1つの パスに（まるごと 水の ます目は 横に つなげて 四角に）
  function waterPath(P, box) {
    const path = new Path2D(), polys = [];
    const i0 = clamp(Math.floor(box[0] / STEP), 0, P.W1 - 2), i1 = clamp(Math.ceil(box[2] / STEP), 0, P.W1 - 2);
    const j0 = clamp(Math.floor(box[1] / STEP), 0, P.H1 - 2), j1 = clamp(Math.ceil(box[3] / STEP), 0, P.H1 - 2);
    for (let j = j0; j <= j1; j++) {
      let run = -1;
      for (let i = i0; i <= i1 + 1; i++) {
        const m = i <= i1 ? cell(P, i, j, polys) : 0;
        if (m === 15) { if (run < 0) run = i; continue; }
        if (run >= 0) { path.rect(run * STEP, j * STEP, (i - run) * STEP, STEP); run = -1; }
        if (m === 0 || i > i1) continue;
        for (const poly of polys) {
          path.moveTo(poly[0][0] * STEP, poly[0][1] * STEP);
          for (let a = 1; a < poly.length; a++) path.lineTo(poly[a][0] * STEP, poly[a][1] * STEP);
          path.closePath();
        }
      }
    }
    return path;
  }
  // ふかさの 色（こまかい 点 1つ = 1ピクセルの 小さい 絵を なめらかに ひろげる）
  function paintDepth(g, P, map, cx, cy, N) {
    const cnt = N * Q + 3, i0 = cx * N * Q - 1, j0 = cy * N * Q - 1;
    tmp.width = cnt; tmp.height = cnt;
    const t = tmp.getContext("2d"), img = t.createImageData(cnt, cnt), px = img.data;
    for (let b = 0; b < cnt; b++) for (let a = 0; a < cnt; a++) {
      const x = (i0 + a) * STEP, y = (j0 + b) * STEP, c = compNear(P, x, y), pal = c.pal, d = depthField(P, x, y);
      let col = ramp(pal.rgb, d / pal.D);
      if (c.kind === "sea" && d < 0.9) { const m = (1 - d / 0.9) * 0.4; col = col.map((v, q) => v + (SAND[q] - v) * m); } // あさい 海は すなが すける
      const u = x / TS, v = y / TS;
      const shade = (noise(u * 0.35, v * 0.35, 61) - 0.5) * 0.1 + (noise(u * 1.3, v * 1.3, 62) - 0.5) * 0.05 + (c.kind === "sea" ? (noise(u * 0.18 + 3, v * 0.18, 63) - 0.5) * 0.12 : 0);
      const o = (b * cnt + a) * 4;
      px[o] = clamp(col[0] * (1 + shade), 0, 255); px[o + 1] = clamp(col[1] * (1 + shade), 0, 255); px[o + 2] = clamp(col[2] * (1 + shade * 0.7), 0, 255); px[o + 3] = 255;
    }
    t.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(tmp, i0 * STEP - STEP / 2, j0 * STEP - STEP / 2, cnt * STEP, cnt * STEP);
  }
  // しずかな もよう（川の すじ・海の 波・湖の うつりこみ・はす・川の いし）
  function decorate(g, P, map, X0, Y0, X1, Y1) {
    const tx0 = Math.max(0, Math.floor(X0 / TS) - 1), ty0 = Math.max(0, Math.floor(Y0 / TS) - 1), tx1 = Math.min(P.w - 1, Math.ceil(X1 / TS)), ty1 = Math.min(P.h - 1, Math.ceil(Y1 / TS));
    const lines = { light: [], dark: [], crest: [], shade: [], refl: [] }, pads = [], stones = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const k = ty * P.w + tx;
      if (!P.wet[k]) continue;
      const c = P.comps[P.comp[k]], H = (s) => U.hash(tx, ty, 800 + s), cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS, d = P.depth[k];
      if (c.kind === "river") {
        const fx = P.flow[k * 2], fy = P.flow[k * 2 + 1];
        for (let s = 0; s < 3; s++) {
          const bx = cx + (H(s) - 0.5) * TS * 0.9, by = cy + (H(s + 3) - 0.5) * TS * 0.9, L = TS * (0.3 + H(s + 6) * 0.4), a = (H(s + 9) - 0.5) * 0.3;
          const dx = fx * Math.cos(a) - fy * Math.sin(a), dy = fx * Math.sin(a) + fy * Math.cos(a);
          (s === 2 ? lines.dark : lines.light).push([bx - dx * L / 2, by - dy * L / 2, bx + dx * L / 2, by + dy * L / 2, -dy * (H(s + 12) - 0.5) * 5, dx * (H(s + 12) - 0.5) * 5]);
        }
        if (d <= 1.6 && H(20) < 0.1) stones.push([cx + (H(21) - 0.5) * TS * 0.5, cy + (H(22) - 0.5) * TS * 0.5, 3 + H(23) * 3, fx, fy]);
      } else if (c.kind === "sea") {
        if (d >= 1.2 && H(0) < (P.muted ? 0.09 : 0.22)) {
          const bx = cx + (H(1) - 0.5) * TS * 0.6, by = cy + (H(2) - 0.5) * TS * 0.6, [wx, wy] = waveDir(P, c, bx, by), px = -wy, py = wx, L = TS * (0.4 + H(3) * 0.55), bulge = 2.5 + H(4) * 2.5;
          lines.crest.push([bx - px * L / 2, by - py * L / 2, bx + px * L / 2, by + py * L / 2, wx * bulge, wy * bulge]);
          lines.shade.push([bx - px * L / 2 - wx * 2.4, by - py * L / 2 - wy * 2.4, bx + px * L / 2 - wx * 2.4, by + py * L / 2 - wy * 2.4, wx * bulge, wy * bulge]);
        }
      } else {
        if (d >= 1 && H(0) < 0.35) { const bx = cx + (H(1) - 0.5) * TS * 0.6, by = cy + (H(2) - 0.5) * TS * 0.6, L = TS * (0.25 + H(3) * 0.4); lines.refl.push([bx - L / 2, by, bx + L / 2, by, 0, -1]); }
        if (c.pal !== PAL.cave && d >= 0.8 && d <= 2.4 && H(10) < 0.2) pads.push([cx + (H(11) - 0.5) * TS * 0.5, cy + (H(12) - 0.5) * TS * 0.5, 4.5 + H(13) * 2.5, H(14) * Math.PI * 2, H(15) < 0.3]);
      }
    }
    const draw = (list, style, width) => {
      if (!list.length) return;
      g.strokeStyle = style; g.lineWidth = width; g.beginPath();
      for (const [x0, y0, x1, y1, bx, by] of list) { g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + bx, (y0 + y1) / 2 + by, x1, y1); }
      g.stroke();
    };
    draw(lines.dark, "rgba(34,86,118,0.16)", 2.2);
    draw(lines.light, "rgba(255,255,255,0.4)", 1.3);
    draw(lines.shade, "rgba(24,70,110,0.14)", 1.8);
    draw(lines.crest, P.muted ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.34)", 1.5);
    draw(lines.refl, "rgba(255,255,255,0.3)", 2.2);
    for (const [x, y, r, fx, fy] of stones) {
      g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(x - fx * r * 0.7, y - fy * r * 0.7, r * 1.25, r * 0.95, Math.atan2(fy, fx), 0, Math.PI * 2); g.fill();
      g.fillStyle = "#9FA39A"; g.strokeStyle = "rgba(31,29,27,0.55)"; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, r, r * 0.78, 0.4, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.22, 0.4, 0, Math.PI * 2); g.fill();
    }
    for (const [x, y, r, a, flower] of pads) {
      g.fillStyle = "#78B866"; g.strokeStyle = "#4C7D3E"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r, r * 0.8, 0, a + 0.35, a + Math.PI * 2 - 0.35); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "rgba(58,98,48,0.5)"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + Math.PI) * r * 0.8, y + Math.sin(a + Math.PI) * r * 0.64); g.stroke();
      if (flower) { g.fillStyle = "#F6B3C8"; g.strokeStyle = "#C9708E"; g.beginPath(); g.arc(x + r * 0.2, y - r * 0.15, 2.4, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#FFF3B0"; g.beginPath(); g.arc(x + r * 0.2, y - r * 0.15, 0.9, 0, Math.PI * 2); g.fill(); }
    }
  }
  // あし（岸の くさの がわに すこしだけ）
  function reeds(g, p, box) {
    const pts = p.pts;
    let run = 0;
    for (let a = 2; a < pts.length; a += 2) {
      const x = pts[a], y = pts[a + 1];
      run += Math.hypot(x - pts[a - 2], y - pts[a - 1]);
      if (run < TS * 1.3) continue;
      run = 0;
      const tx = Math.floor(x / TS), ty = Math.floor(y / TS), H = (s) => U.hash(tx * 7 + (a >> 1), ty, 900 + s);
      if (H(0) > 0.45) continue;
      const bx = x - p.nx[a / 2] * 5, by = y - p.ny[a / 2] * 5;
      if (bx < box[0] || bx > box[2] || by < box[1] || by > box[3]) continue;
      g.lineWidth = 1.5;
      for (let r = 0; r < 4; r++) {
        const lean = (r - 1.5) * 1.6 + (H(r + 1) - 0.5) * 2, h = 8 + H(r + 5) * 6, x0 = bx + (r - 1.5) * 1.8;
        g.strokeStyle = r % 2 ? "#5F9448" : "#7AAE58";
        g.beginPath(); g.moveTo(x0, by); g.quadraticCurveTo(x0 + lean * 0.3, by - h * 0.6, x0 + lean, by - h); g.stroke();
        if (r === 1 || (r === 2 && H(9) < 0.5)) { g.fillStyle = "#8B5E3C"; g.beginPath(); g.ellipse(x0 + lean * 0.85, by - h * 0.85, 1.4, 2.8, lean * 0.08, 0, Math.PI * 2); g.fill(); }
      }
    }
  }

  // ---- 毎フレーム（うごく ところ）----
  function frame(ctx, map, ox, oy) {
    const P = prep(map);
    if (!P.any) return false;
    const t = G.t, vx0 = -ox - TS, vy0 = -oy - TS, vx1 = G.W - ox + TS, vy1 = G.H - oy + TS;
    const rain = typeof Weather !== "undefined" && Weather.kind() === "rain" && map.baseGround !== "cave";
    ctx.save(); ctx.translate(ox, oy); ctx.lineCap = "round"; ctx.lineJoin = "round";
    // 波うちぎわの あわ（よせて かえす）
    for (const p of P.shores) {
      if (p.kind !== "sea" || p.style !== "beach" || p.box[2] < vx0 || p.box[0] > vx1 || p.box[3] < vy0 || p.box[1] > vy1) continue;
      const pts = p.pts;
      for (const [wave, alpha, width, speed, gap] of [[0, 0.75, 2, 1.1, 0], [1, 0.35, 1.4, 0.8, 4]]) {
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = width; ctx.beginPath();
        let arc = 0;
        for (let a = 0; a < pts.length; a += 2) {
          if (a) arc += Math.hypot(pts[a] - pts[a - 2], pts[a + 1] - pts[a - 1]);
          const o = gap + (0.5 + 0.5 * Math.sin(t * speed + arc * 0.06 + p.seed + wave * 1.7)) * 5, x = pts[a] + p.nx[a / 2] * o, y = pts[a + 1] + p.ny[a / 2] * o;
          if (a) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }
    const lv = [[], [], [], []], put = (alpha, item) => { if (alpha > 0.04) lv[Math.min(3, Math.floor(alpha * 4))].push(item); };
    const flush = (style, width, draw) => {
      ctx.lineWidth = width;
      for (let q = 0; q < 4; q++) {
        if (!lv[q].length) continue;
        ctx.strokeStyle = style((q + 0.6) / 4); ctx.beginPath();
        for (const it of lv[q]) draw(it);
        ctx.stroke(); lv[q].length = 0;
      }
    };
    const bx0 = Math.floor(vx0 / (8 * TS)), bx1 = Math.floor(vx1 / (8 * TS)), by0 = Math.floor(vy0 / (8 * TS)), by1 = Math.floor(vy1 / (8 * TS)), buckets = [];
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) { const b = P.parts.get(by * 1000 + bx); if (b) buckets.push(b); }
    // 川の ながれ
    for (const b of buckets) for (const s of b.flow) {
      const prog = (((t * s.speed) / s.span + s.ph) % 1 + 1) % 1, off = (prog - 0.5) * s.span, x = s.x + s.dx * off, y = s.y + s.dy * off;
      put(Math.sin(Math.PI * prog) * 0.7, [x - s.dx * s.len / 2, y - s.dy * s.len / 2, x + s.dx * s.len / 2, y + s.dy * s.len / 2, -s.dy * s.bend * 4, s.dx * s.bend * 4]);
    }
    flush((a) => `rgba(255,255,255,${a})`, 1.5, ([x0, y0, x1, y1, bx, by]) => { ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + bx, (y0 + y1) / 2 + by, x1, y1); });
    // 海の 波がしら（岸へ よってくる）
    for (const b of buckets) for (const s of b.crest) {
      const prog = ((t / s.life + s.ph) % 1 + 1) % 1, x = s.x + s.dx * prog * s.travel, y = s.y + s.dy * prog * s.travel, px = -s.dy, py = s.dx;
      put(Math.sin(Math.PI * prog) * 0.55, [x - px * s.len / 2, y - py * s.len / 2, x + px * s.len / 2, y + py * s.len / 2, s.dx * 4, s.dy * 4]);
    }
    flush((a) => `rgba(255,255,255,${a})`, 1.7, ([x0, y0, x1, y1, bx, by]) => { ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + bx, (y0 + y1) / 2 + by, x1, y1); });
    // 湖の 波紋（雨の ときは あちこちに ちいさな わ）
    for (const b of buckets) {
      for (const s of b.ring) { const prog = ((t / s.period + s.ph) % 1 + 1) % 1; if (prog < 0.7) put((1 - prog / 0.7) * 0.5, [s.x, s.y, s.R * (0.15 + prog / 0.7 * 0.85)]); }
      if (rain) for (const s of b.glint) { const prog = ((t / (0.9 + s.period * 0.25) + s.ph) % 1 + 1) % 1; if (prog < 0.6) put((1 - prog / 0.6) * 0.6, [s.x, s.y, 1.5 + prog * 9]); }
    }
    flush((a) => `rgba(255,255,255,${a})`, 1.2, ([x, y, r]) => { ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2); });
    // きらめき
    if (!rain) {
      for (const b of buckets) for (const s of b.glint) { const k = Math.max(0, Math.sin(2 * Math.PI * (t / s.period + s.ph))); if (k > 0.6) put(Math.pow(k, 6), [s.x, s.y, s.size * (0.6 + k * 0.6), s.cave]); }
      for (let q = 0; q < 4; q++) {
        if (!lv[q].length) continue;
        const a = (q + 0.6) / 4;
        for (const cave of [false, true]) {
          ctx.strokeStyle = cave ? `rgba(191,246,255,${a})` : `rgba(255,255,255,${a})`; ctx.lineWidth = 1.2; ctx.beginPath();
          for (const [x, y, r, c] of lv[q]) if (!!c === cave) { ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r * 0.8); ctx.lineTo(x, y + r * 0.8); }
          ctx.stroke();
        }
        lv[q].length = 0;
      }
    }
    ctx.restore();
    return true;
  }

  // テスト・PokaDebug 用の ようす。shore: その 水べに 立てる マスと となりの 水の マス。mismatch: マスの まんなかの 見た目と 水の マスが ちがう かず
  function info(map) {
    const P = prep(map);
    if (!P.any) return { any: false, bodies: [], mismatch: 0 };
    let parts = 0, mismatch = 0;
    for (const b of P.parts.values()) parts += b.flow.length + b.crest.length + b.glint.length + b.ring.length;
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) if (!!P.wet[y * P.w + x] !== looksWet(map, x, y)) mismatch++;
    const shoreOf = (c) => {
      if (typeof map.isSolid !== "function") return null;
      for (const k of c.tiles) {
        if (P.wet[k] === 2) continue; // はしの 上は 見えるのが いた
        const x = k % P.w, y = (k - x) / P.w;
        for (const [dx, dy] of N4) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && !P.wet[yy * P.w + xx] && !map.isSolid(xx, yy)) return { x: xx, y: yy, wx: x, wy: y }; }
      }
      return null;
    };
    return {
      any: true, tiles: P.count, mismatch,
      bodies: P.comps.map((c) => ({ kind: c.kind, cave: c.pal === PAL.cave, tiles: c.tiles.length, edge: c.edge, x: c.x0, y: c.y0, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, shore: shoreOf(c) })),
      shores: P.shores.length, styles: [...new Set(P.shores.map((p) => p.kind + ":" + p.style))].sort(), parts,
    };
  }
  // マスの まんなかの 見た目が 水か（水の マス ↔ 見た目も 水）
  function looksWet(map, x, y) { const P = prep(map); return P.any ? field(P, (x + 0.5) * TS, (y + 0.5) * TS) >= 0.5 : false; }
  return { on, prep, under, chunk, frame, info, looksWet, kindOf };
})();
