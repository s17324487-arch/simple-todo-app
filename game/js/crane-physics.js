// クレーンゲームの 物理（位置ベースの うごき・PBD）。景品は 小さな たまの あつまり（形は shape matching で たもつ）。
// たんい: cm・びょう。じゅうりょく 980cm/s²。machine の 中は x（左→右）・y（下→上）・z（手前→おく）。
// 当たり: 平面・箱（かたむき あり）・カプセル（アームの ぼう）・円ばん（まわる 台）・円い 穴の ある 床・つつの かべ。
// うごく もの（アーム・フック・ショベル・プッシャー）は 前の ばしょを おぼえて、まさつで 景品を いっしょに うごかす。
const CranePhys = (() => {
  const GRAV = 980;
  // ---- クォータニオン [w, x, y, z] ----
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
  const qaxis = (x, y, z, ang) => { const l = Math.hypot(x, y, z) || 1, s = Math.sin(ang / 2) / l; return [Math.cos(ang / 2), x * s, y * s, z * s]; };
  // 回転行列（列ベクトル 3本）
  const qmat = (q) => {
    const [w, x, y, z] = q;
    return [[1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y)], [2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x)], [2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)]];
  };
  const qrot = (q, v) => { const m = qmat(q); return [m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2], m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2], m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]]; };
  // 箱の 回転（y まわり yaw・x まわり pitch・z まわり roll）→ 行列（列 = ローカル軸の 向き）
  const rotYXZ = (yaw = 0, pitch = 0, roll = 0) => qmat(qmul(qmul(qaxis(0, 1, 0, yaw), qaxis(1, 0, 0, pitch)), qaxis(0, 0, 1, roll)));

  class World {
    constructor(o = {}) {
      this.P = []; this.B = []; this.C = [];
      this.sub = o.sub || 4; this.iter = o.iter || 2; this.damp = o.damp != null ? o.damp : 0.8;
      this.bounds = o.bounds || null; // { x0, x1, z0, z1, y1 }（ガラスの 箱）
      this.t = 0; this.cell = 2; this.grid = new Map(); this.events = []; this.outY = o.outY != null ? o.outY : -30; // まん中が outY より 下 = おちた
      this.maxTurn = o.maxTurn || 0.06; // shape matching で 1かいに まわれる 大きさ（ひらたい 形の うらがえりで はじけない ため）
      this.pre = null; this.post = null; // うごく ものの こうしん（1 サブステップ ごと）
    }
    // 景品: parts = [{ x, y, z, r, m }]（world の 位置）。stiff 1 = かたい・0.5 = ぬいぐるみ
    body(def) {
      const parts = def.parts, b = { id: this.B.length, i0: this.P.length, n: parts.length, stiff: def.stiff != null ? def.stiff : 1, q: def.q ? def.q.slice() : [1, 0, 0, 0], rest: [], mass: 0,
        still: 0, sleep: false, alive: true, kind: def.kind || "prize", data: def.data || {}, fr: def.fric != null ? def.fric : 0.6 };
      let cx = 0, cy = 0, cz = 0, m = 0;
      for (const p of parts) { const pm = p.m || 1; cx += p.x * pm; cy += p.y * pm; cz += p.z * pm; m += pm; }
      cx /= m; cy /= m; cz /= m; b.mass = m;
      // rest は 回転 q を もどした ローカルの 位置
      const inv = [b.q[0], -b.q[1], -b.q[2], -b.q[3]];
      for (const p of parts) {
        b.rest.push(qrot(inv, [p.x - cx, p.y - cy, p.z - cz]));
        this.P.push({ x: p.x, y: p.y, z: p.z, px: p.x, py: p.y, pz: p.z, r: p.r, im: 1 / (p.m || 1), m: p.m || 1, b: b.id, fr: b.fr });
        this.cell = Math.max(this.cell, p.r * 2.05); // となりの マスまでで かならず 当たりが みつかる 大きさ
      }
      this.B.push(b);
      return b;
    }
    // 当たり（type: plane・box・cap・disk・holefloor・cyl・sphere）。move: true は うごく もの
    collider(c) { c.push = 0; c.fr = c.fr != null ? c.fr : 0.6; if (c.k === "box" && !c.R) c.R = rotYXZ(c.yaw || 0, c.pitch || 0, c.roll || 0); this.save(c); this.box(c); this.C.push(c); return c; }
    // 当たりの まわりの はこ（とおい つぶは しらべない）。null = どこでも
    box(c) {
      let a = null;
      if (c.k === "box") { const R = c.R, h = c.h; a = [0, 1, 2].map((i) => Math.abs(R[0][i]) * h[0] + Math.abs(R[1][i]) * h[1] + Math.abs(R[2][i]) * h[2]); a = [c.c[0] - a[0], c.c[1] - a[1], c.c[2] - a[2], c.c[0] + a[0], c.c[1] + a[1], c.c[2] + a[2]]; }
      else if (c.k === "cap") a = [Math.min(c.a[0], c.b[0]) - c.r, Math.min(c.a[1], c.b[1]) - c.r, Math.min(c.a[2], c.b[2]) - c.r, Math.max(c.a[0], c.b[0]) + c.r, Math.max(c.a[1], c.b[1]) + c.r, Math.max(c.a[2], c.b[2]) + c.r];
      else if (c.k === "sphere") a = [c.c[0] - c.r, c.c[1] - c.r, c.c[2] - c.r, c.c[0] + c.r, c.c[1] + c.r, c.c[2] + c.r];
      else if (c.k === "disk") a = [c.c[0] - c.rad - 3, c.c[1] - c.h - 3, c.c[2] - c.rad - 3, c.c[0] + c.rad + 3, c.c[1] + 8, c.c[2] + c.rad + 3];
      else if (c.k === "cyl") a = [c.cx - c.rad - 1, c.y0, c.cz - c.rad - 1, c.cx + c.rad + 1, c.y1, c.cz + c.rad + 1];
      else if (c.k === "holefloor") a = [-1e9, c.y - c.th, -1e9, 1e9, c.y + 8, 1e9];
      c.bb = a;
    }
    // うごく ものの 前の ばしょを おぼえる（まさつで いっしょに うごかす ため）
    save(c) {
      if (c.k === "cap") { c.pa = c.a.slice(); c.pb = c.b.slice(); }
      else if (c.k === "box") { c.pc = c.c.slice(); c.pR = c.R.map((v) => v.slice()); }
      else if (c.k === "sphere") c.pc = c.c.slice();
      else if (c.k === "disk") c.pang = c.ang || 0;
    }
    // うごく ものが この サブステップで うごいたか（とまって いる アームで ねた 景品を おこさない）
    changed(c) {
      const d = (u, v) => Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) + Math.abs(u[2] - v[2]) > 1e-6;
      if (c.k === "cap") return d(c.a, c.pa) || d(c.b, c.pb);
      if (c.k === "box") return d(c.c, c.pc) || d(c.R[0], c.pR[0]) || d(c.R[1], c.pR[1]);
      if (c.k === "sphere") return d(c.c, c.pc);
      if (c.k === "disk") return (c.ang || 0) !== c.pang;
      return true;
    }
    centroid(b) {
      let x = 0, y = 0, z = 0, m = 0;
      for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i]; x += p.x * p.m; y += p.y * p.m; z += p.z * p.m; m += p.m; }
      return [x / m, y / m, z / m];
    }
    wake(b) { if (b.sleep) { b.sleep = false; b.still = 0; b.ride = null; for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i]; p.px = p.x; p.py = p.y; p.pz = p.z; } } }
    // ねむる（まわりの 大きさを おぼえて、うごく ものが 近づいたら おこせる ように する）
    nap(b, c, ride) {
      let R = 0; for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i]; R = Math.max(R, Math.hypot(p.x - c[0], p.y - c[1], p.z - c[2]) + p.r); }
      b.sleep = true; b.bc = c; b.br = R; b.ride = ride || null;
      for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i]; p.px = p.x; p.py = p.y; p.pz = p.z; }
    }
    // まわる 台に のって ねて いる 景品を 台と いっしょに まわす
    carry(b, D) {
      const da = (D.ang || 0) - (D.pang || 0); if (!da) return;
      const co = Math.cos(da), si = Math.sin(da), cx = D.c[0], cz = D.c[2];
      for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i], dx = p.x - cx, dz = p.z - cz; p.px = p.x; p.pz = p.z; p.py = p.y; p.x = cx + dx * co - dz * si; p.z = cz + dx * si + dz * co; }
      if (b.bc) { const dx = b.bc[0] - cx, dz = b.bc[2] - cz; b.bc = [cx + dx * co - dz * si, b.bc[1], cz + dx * si + dz * co]; }
      b.q = qnorm(qmul(qaxis(0, 1, 0, -da), b.q));
    }
    // ねて いる 景品に うごく もの（アーム・ショベル・おしだし）が ふれたか
    touch(b) {
      for (const c of this.C) {
        // まわる 台に のって いる ものは、とまって いる ショベルにも ぶつかる
        if (!c.move || c.off || c === b.ride || (c.moved === false && !b.ride)) continue;
        const bb = c.bb, R = (b.br || 0) + 0.5, q0 = b.bc;
        if (bb && q0 && (q0[0] < bb[0] - R || q0[0] > bb[3] + R || q0[1] < bb[1] - R || q0[1] > bb[4] + R || q0[2] < bb[2] - R || q0[2] > bb[5] + R)) continue;
        for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i], q = this.sdf(c, p.x, p.y, p.z); if (q && q.d < p.r + 0.05) { this.wake(b); return; } }
      }
    }
    remove(b) { b.alive = false; for (let i = b.i0; i < b.i0 + b.n; i++) { const p = this.P[i]; p.dead = true; } }
    step(dt) { const h = dt / this.sub; for (let s = 0; s < this.sub; s++) this.substep(h); }
    substep(h) {
      const P = this.P, gy = -GRAV * h * h, keep = 1 - this.damp * h;
      if (this.pre) this.pre(h);
      for (const c of this.C) c.push = 0;
      // 1. すすめる（ねて いる 景品は とめて おく。まわる 台の 上で ねて いる ものは 台と いっしょに まわす）
      for (const b of this.B) {
        if (!b.alive) continue;
        if (b.sleep) { if (b.ride) this.carry(b, b.ride); continue; }
        for (let i = b.i0; i < b.i0 + b.n; i++) {
          const p = P[i], vx = (p.x - p.px) * keep, vy = (p.y - p.py) * keep, vz = (p.z - p.pz) * keep;
          p.px = p.x; p.py = p.y; p.pz = p.z;
          p.x += vx; p.y += vy + gy; p.z += vz;
        }
      }
      // 2. かたち・当たり・たがいの 当たり（ねて いる 景品に うごく ものが ふれたら おこす）
      for (const b of this.B) if (b.alive && b.sleep) this.touch(b);
      this.buildGrid();
      for (let k = 0; k < this.iter; k++) {
        for (const b of this.B) if (b.alive && !b.sleep && b.n > 1) this.shape(b);
        this.pairs();
        for (const b of this.B) if (b.alive && !b.sleep) for (let i = b.i0; i < b.i0 + b.n; i++) this.collide(P[i], b);
      }
      // 3. ねむる（ほとんど うごかない 景品は 計算しない）・落ちた 景品
      for (const b of this.B) {
        if (!b.alive || b.sleep) continue;
        let mx = 0; const D = b.on && b.on.k === "disk" ? b.on : null;
        for (let i = b.i0; i < b.i0 + b.n; i++) {
          const p = P[i]; let ex = p.x - p.px, ey = p.y - p.py, ez = p.z - p.pz;
          if (D) { const v = this.vel(D, p.x, p.y, p.z); ex -= v[0]; ey -= v[1]; ez -= v[2]; }
          mx = Math.max(mx, Math.abs(ex), Math.abs(ey), Math.abs(ez));
        }
        b.still = mx < (D ? 0.009 : 0.0035) ? b.still + h : 0; // まわる 台の 上は すこし すべって いても ねかせる
        const c = this.centroid(b);
        if (b.still > 0.35 && !b.held) this.nap(b, c, D);
        b.on = null;
        if (c[1] < this.outY) { this.events.push({ e: "out", b, at: c }); this.remove(b); }
      }
      if (this.post) this.post(h);
      for (const c of this.C) if (c.move) { c.moved = this.changed(c); this.save(c); this.box(c); }
      this.t += h;
    }
    // shape matching（Müller 2016 の 回転の とりだし）
    shape(b) {
      const P = this.P, c = this.centroid(b);
      let a00 = 0, a01 = 0, a02 = 0, a10 = 0, a11 = 0, a12 = 0, a20 = 0, a21 = 0, a22 = 0;
      for (let j = 0; j < b.n; j++) {
        const p = P[b.i0 + j], q = b.rest[j], m = p.m, dx = (p.x - c[0]) * m, dy = (p.y - c[1]) * m, dz = (p.z - c[2]) * m;
        a00 += dx * q[0]; a01 += dx * q[1]; a02 += dx * q[2]; a10 += dy * q[0]; a11 += dy * q[1]; a12 += dy * q[2]; a20 += dz * q[0]; a21 += dz * q[1]; a22 += dz * q[2];
      }
      // A の 列: col0 = (a00,a10,a20) など
      const A = [[a00, a10, a20], [a01, a11, a21], [a02, a12, a22]];
      let q = b.q;
      for (let it = 0; it < 6; it++) {
        const R = qmat(q);
        const cr = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], dt = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
        const c0 = cr(R[0], A[0]), c1 = cr(R[1], A[1]), c2 = cr(R[2], A[2]);
        const den = Math.abs(dt(R[0], A[0]) + dt(R[1], A[1]) + dt(R[2], A[2])) + 1e-9;
        const wx = (c0[0] + c1[0] + c2[0]) / den, wy = (c0[1] + c1[1] + c2[1]) / den, wz = (c0[2] + c1[2] + c2[2]) / den, w = Math.hypot(wx, wy, wz);
        if (w < 1e-9) break;
        q = qnorm(qmul(qaxis(wx, wy, wz, w), q));
      }
      // 1かいで 大きく まわりすぎたら（ひらたい 形の うらがえり）すこしずつ に する
      const dq = qmul(q, [b.q[0], -b.q[1], -b.q[2], -b.q[3]]), dw = Math.min(1, Math.abs(dq[0])), ang = 2 * Math.acos(dw);
      if (ang > this.maxTurn) { const k = this.maxTurn / ang, s0 = Math.sign(dq[0]) || 1, l = Math.hypot(dq[1], dq[2], dq[3]) || 1; q = qnorm(qmul(qaxis(dq[1] * s0 / l, dq[2] * s0 / l, dq[3] * s0 / l, ang * k), b.q)); }
      b.q = q;
      const R = qmat(q), s = b.stiff;
      for (let j = 0; j < b.n; j++) {
        const p = P[b.i0 + j], r = b.rest[j];
        const gx = c[0] + R[0][0] * r[0] + R[1][0] * r[1] + R[2][0] * r[2], gy = c[1] + R[0][1] * r[0] + R[1][1] * r[1] + R[2][1] * r[2], gz = c[2] + R[0][2] * r[0] + R[1][2] * r[1] + R[2][2] * r[2];
        p.x += (gx - p.x) * s; p.y += (gy - p.y) * s; p.z += (gz - p.z) * s;
      }
    }
    buildGrid() {
      const g = this.grid, cs = this.cell; g.clear();
      this.P.forEach((p, i) => {
        if (p.dead) return;
        const k = (Math.floor(p.x / cs) & 1023) * 1048576 + (Math.floor(p.y / cs) & 1023) * 1024 + (Math.floor(p.z / cs) & 1023);
        let a = g.get(k); if (!a) g.set(k, (a = [])); a.push(i);
      });
    }
    // たがいの 当たり（ちがう 景品どうし）＋まさつ
    pairs() {
      const P = this.P, B = this.B, g = this.grid, cs = this.cell;
      for (const [k, list] of g) {
        const cx = Math.floor(k / 1048576), cy = Math.floor((k % 1048576) / 1024), cz = k % 1024;
        for (let dx = 0; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && (dy < 0 || (dy === 0 && dz < 0))) continue;
          const o = dx === 0 && dy === 0 && dz === 0 ? list : g.get((((cx + dx) & 1023) * 1048576) + (((cy + dy) & 1023) * 1024) + ((cz + dz) & 1023));
          if (!o) continue;
          for (let a = 0; a < list.length; a++) {
            const i = list[a], p = P[i];
            for (let c = o === list ? a + 1 : 0; c < o.length; c++) {
              const j = o[c], q = P[j];
              if (p.b === q.b || (B[p.b].sleep && B[q.b].sleep)) continue;
              const ex = p.x - q.x, ey = p.y - q.y, ez = p.z - q.z, rr = p.r + q.r, d2 = ex * ex + ey * ey + ez * ez;
              if (d2 >= rr * rr || d2 < 1e-10) continue;
              const bp = B[p.b], bq = B[q.b];
              const d = Math.sqrt(d2), pen = rr - d, nx = ex / d, ny = ey / d, nz = ez / d;
              // ねて いる 方は うごかない（かさなりが おおきい ときは おこす）
              let wp = bp.sleep ? 0 : p.im, wq = bq.sleep ? 0 : q.im;
              if (bq.sleep && bq.ride && ny > 0.5) bp.on = bq.ride; else if (bp.sleep && bp.ride && ny < -0.5) bq.on = bp.ride;
              if (pen > 0.25) { if (bp.sleep) { this.wake(bp); wp = p.im; } if (bq.sleep) { this.wake(bq); wq = q.im; } }
              const ws = wp + wq; if (ws <= 0) continue;
              p.x += nx * pen * wp / ws; p.y += ny * pen * wp / ws; p.z += nz * pen * wp / ws;
              q.x -= nx * pen * wq / ws; q.y -= ny * pen * wq / ws; q.z -= nz * pen * wq / ws;
              // まさつ（すべる うごきを へらす）
              const rx = (p.x - p.px) - (q.x - q.px), ry = (p.y - p.py) - (q.y - q.py), rz = (p.z - p.pz) - (q.z - q.pz), rn = rx * nx + ry * ny + rz * nz;
              const tx = rx - rn * nx, ty = ry - rn * ny, tz = rz - rn * nz, tl = Math.hypot(tx, ty, tz), mu = Math.min(p.fr, q.fr);
              if (tl > 1e-9) {
                const k2 = tl < mu * 1.3 * pen ? 1 : Math.min(1, (mu * pen) / tl);
                p.x -= tx * k2 * wp / ws; p.y -= ty * k2 * wp / ws; p.z -= tz * k2 * wp / ws;
                q.x += tx * k2 * wq / ws; q.y += ty * k2 * wq / ws; q.z += tz * k2 * wq / ws;
              }
            }
          }
        }
      }
    }
    // 1つぶ と 当たり（まさつ つき）
    collide(p, b) {
      const B = this.bounds;
      if (B) {
        if (p.x < B.x0 + p.r) this.push(p, 1, 0, 0, B.x0 + p.r - p.x, null); else if (p.x > B.x1 - p.r) this.push(p, -1, 0, 0, p.x - (B.x1 - p.r), null);
        if (p.z < B.z0 + p.r) this.push(p, 0, 0, 1, B.z0 + p.r - p.z, null); else if (p.z > B.z1 - p.r) this.push(p, 0, 0, -1, p.z - (B.z1 - p.r), null);
        if (B.y1 != null && p.y > B.y1 - p.r) this.push(p, 0, -1, 0, p.y - (B.y1 - p.r), null);
      }
      for (const c of this.C) {
        if (c.off) continue;
        const bb = c.bb, r = p.r;
        if (bb && (p.x < bb[0] - r || p.x > bb[3] + r || p.y < bb[1] - r || p.y > bb[4] + r || p.z < bb[2] - r || p.z > bb[5] + r)) continue;
        const h = this.sdf(c, p.x, p.y, p.z);
        if (!h || h.d >= p.r) continue;
        const pen = p.r - h.d;
        c.push += pen;
        if (c.k === "disk" && h.ny > 0.7) b.on = c;
        this.push(p, h.nx, h.ny, h.nz, pen, c);
      }
    }
    // おしだす ＋ まさつ（c が うごく ものなら その うごきに ついて いく。c.belt は うごかない ベルトの おもての 1サブステップの うごき）
    push(p, nx, ny, nz, pen, c) {
      p.x += nx * pen; p.y += ny * pen; p.z += nz * pen;
      let vx = 0, vy = 0, vz = 0;
      if (c && (c.move || c.spin)) { const v = this.vel(c, p.x - nx * p.r, p.y - ny * p.r, p.z - nz * p.r); vx = v[0]; vy = v[1]; vz = v[2]; }
      else if (c && c.belt) { vx = c.belt[0]; vy = c.belt[1]; vz = c.belt[2]; }
      const rx = (p.x - p.px) - vx, ry = (p.y - p.py) - vy, rz = (p.z - p.pz) - vz, rn = rx * nx + ry * ny + rz * nz;
      const tx = rx - rn * nx, ty = ry - rn * ny, tz = rz - rn * nz, tl = Math.hypot(tx, ty, tz), mu = c ? Math.min(p.fr, c.fr) * (c.grip || 1) : 0.3;
      if (tl < 1e-9) return;
      const k = tl < mu * 1.3 * pen ? 1 : Math.min(1, (mu * pen) / tl);
      p.x -= tx * k; p.y -= ty * k; p.z -= tz * k;
    }
    // うごく ものの その 点の 1サブステップの うごき
    vel(c, x, y, z) {
      if (c.k === "cap") {
        const t = this.segT(c.a, c.b, x, y, z);
        return [(c.a[0] - c.pa[0]) * (1 - t) + (c.b[0] - c.pb[0]) * t, (c.a[1] - c.pa[1]) * (1 - t) + (c.b[1] - c.pb[1]) * t, (c.a[2] - c.pa[2]) * (1 - t) + (c.b[2] - c.pb[2]) * t];
      }
      if (c.k === "box") {
        const R = c.R, pR = c.pR, dx = x - c.c[0], dy = y - c.c[1], dz = z - c.c[2];
        const lx = R[0][0] * dx + R[0][1] * dy + R[0][2] * dz, ly = R[1][0] * dx + R[1][1] * dy + R[1][2] * dz, lz = R[2][0] * dx + R[2][1] * dy + R[2][2] * dz;
        const ox = c.pc[0] + pR[0][0] * lx + pR[1][0] * ly + pR[2][0] * lz, oy = c.pc[1] + pR[0][1] * lx + pR[1][1] * ly + pR[2][1] * lz, oz = c.pc[2] + pR[0][2] * lx + pR[1][2] * ly + pR[2][2] * lz;
        return [x - ox, y - oy, z - oz];
      }
      if (c.k === "sphere") return [c.c[0] - c.pc[0], c.c[1] - c.pc[1], c.c[2] - c.pc[2]];
      if (c.k === "disk") { const da = (c.ang || 0) - c.pang, dx = x - c.c[0], dz = z - c.c[2], co = Math.cos(da), si = Math.sin(da); return [dx * co - dz * si - dx, 0, dx * si + dz * co - dz]; }
      if (c.k === "cyl" && c.spin) return this.vel(c.spin, x, y, z); // まわる 台と いっしょに まわる かべ
      return [0, 0, 0];
    }
    segT(a, b, x, y, z) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], l2 = ux * ux + uy * uy + uz * uz;
      return l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * ux + (y - a[1]) * uy + (z - a[2]) * uz) / l2));
    }
    // 符号つき きょり と 外むきの 向き（d は 表面から。中なら 負）
    sdf(c, x, y, z) {
      if (c.k === "plane") { const d = c.n[0] * x + c.n[1] * y + c.n[2] * z - c.d; return { d, nx: c.n[0], ny: c.n[1], nz: c.n[2] }; }
      if (c.k === "cap" || c.k === "sphere") {
        let qx, qy, qz;
        if (c.k === "sphere") { qx = c.c[0]; qy = c.c[1]; qz = c.c[2]; }
        else { const t = this.segT(c.a, c.b, x, y, z); qx = c.a[0] + (c.b[0] - c.a[0]) * t; qy = c.a[1] + (c.b[1] - c.a[1]) * t; qz = c.a[2] + (c.b[2] - c.a[2]) * t; }
        const dx = x - qx, dy = y - qy, dz = z - qz, l = Math.hypot(dx, dy, dz);
        if (l > c.r + 20) return null;
        return l < 1e-9 ? { d: -c.r, nx: 0, ny: 1, nz: 0 } : { d: l - c.r, nx: dx / l, ny: dy / l, nz: dz / l };
      }
      if (c.k === "box") {
        const R = c.R, dx = x - c.c[0], dy = y - c.c[1], dz = z - c.c[2];
        const lx = R[0][0] * dx + R[0][1] * dy + R[0][2] * dz, ly = R[1][0] * dx + R[1][1] * dy + R[1][2] * dz, lz = R[2][0] * dx + R[2][1] * dy + R[2][2] * dz;
        const h = c.h, ox = Math.abs(lx) - h[0], oy = Math.abs(ly) - h[1], oz = Math.abs(lz) - h[2];
        if (ox > 20 || oy > 20 || oz > 20) return null;
        let n, d;
        if (ox > 0 || oy > 0 || oz > 0) {
          const ex = Math.max(ox, 0), ey = Math.max(oy, 0), ez = Math.max(oz, 0); d = Math.hypot(ex, ey, ez);
          const nl = [ex * Math.sign(lx), ey * Math.sign(ly), ez * Math.sign(lz)], L = d || 1; n = [nl[0] / L, nl[1] / L, nl[2] / L];
        } else if (ox > oy && ox > oz) { d = ox; n = [Math.sign(lx) || 1, 0, 0]; }
        else if (oy > oz) { d = oy; n = [0, Math.sign(ly) || 1, 0]; }
        else { d = oz; n = [0, 0, Math.sign(lz) || 1]; }
        // ローカル → world
        return { d, nx: R[0][0] * n[0] + R[1][0] * n[1] + R[2][0] * n[2], ny: R[0][1] * n[0] + R[1][1] * n[1] + R[2][1] * n[2], nz: R[0][2] * n[0] + R[1][2] * n[1] + R[2][2] * n[2] };
      }
      if (c.k === "disk") { // まわる 円い 台（上の 面と まわり）
        const dx = x - c.c[0], dz = z - c.c[2], rr = Math.hypot(dx, dz), top = c.c[1];
        if (rr > c.rad + 3 || y > top + 8 || y < top - c.h - 3) return null;
        const dTop = y - top, dSide = rr - c.rad;
        if (dSide < 0 && dTop > -c.h) return dTop > dSide ? { d: dTop, nx: 0, ny: 1, nz: 0 } : { d: dSide, nx: dx / (rr || 1), ny: 0, nz: dz / (rr || 1) };
        if (dSide >= 0 && dTop <= 0 && dTop > -c.h) return { d: dSide, nx: dx / (rr || 1), ny: 0, nz: dz / (rr || 1) };
        if (dSide >= 0 && dTop > 0) { const l = Math.hypot(dSide, dTop); return { d: l, nx: (dx / (rr || 1)) * dSide / l, ny: dTop / l, nz: (dz / (rr || 1)) * dSide / l }; }
        return null;
      }
      if (c.k === "holefloor") { // 床（y = c.y）だが 円い 穴（cx, cz, rad）が あいて いる
        const dx = x - c.cx, dz = z - c.cz, rr = Math.hypot(dx, dz), dy = y - c.y;
        if (dy > 8 || dy < -c.th) return null;
        if (rr >= c.rad) return { d: dy, nx: 0, ny: 1, nz: 0 };
        // 穴の ふち（まるい かど）
        const e = c.rad - rr, l = Math.hypot(e, Math.max(dy, 0));
        if (dy > 0 && l < 8) return { d: l, nx: (-dx / (rr || 1)) * e / (l || 1), ny: Math.max(dy, 0) / (l || 1), nz: (-dz / (rr || 1)) * e / (l || 1) };
        return dy <= 0 ? { d: e, nx: -dx / (rr || 1), ny: 0, nz: -dz / (rr || 1) } : null;
      }
      if (c.k === "cyl") { // つつ（inside: 中に とじこめる かべ・ふつう: 中まで つまった はしら）
        if (y < c.y0 || y > c.y1) return null;
        const dx = x - c.cx, dz = z - c.cz, rr = Math.hypot(dx, dz) || 1e-6;
        if (!c.inside) return { d: rr - c.rad, nx: dx / rr, ny: 0, nz: dz / rr };
        return rr > c.rad + 4 ? null : { d: c.rad - rr, nx: -dx / rr, ny: 0, nz: -dz / rr }; // かべの 外 4cm より 先は かんけい ない
      }
      return null;
    }
    // その 景品の いまの まん中・回転
    pose(b) { return { c: this.centroid(b), q: b.q }; }
    // セーブ用（つぶの 位置だけ。0.01cm）
    snapshot() { return this.B.filter((b) => b.alive && b.data.save !== false).map((b) => ({ id: b.data.sid, p: Array.from({ length: b.n }, (_, j) => { const p = this.P[b.i0 + j]; return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, Math.round(p.z * 100) / 100]; }), q: b.q.map((v) => Math.round(v * 1e4) / 1e4) })); }
  }
  return { World, GRAV, qmul, qnorm, qaxis, qmat, qrot, rotYXZ };
})();
