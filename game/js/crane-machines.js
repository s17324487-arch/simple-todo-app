// クレーンゲームの 機械 8台（アーム・台・景品の おき方）と 1かいの あそび（CraneRound）。絵と ボタンは crane-scene.js。
// たんい: cm・びょう。x = 左→右・y = 下→上・z = 手前→おく。おとしぐちに 落ちた 景品が「とれた」。
// 物理は CranePhys（crane-physics.js）。おなじ ばめんからは おなじ けっかに なる（Math.random を つかわない）。
const CraneMachines = (() => {
  const CP = CranePhys, D2R = Math.PI / 180, DT = 1 / 60;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  // きまった たねの 乱数（mulberry32）
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---- 景品の かたち（たまの ならび）。ローカル: +x 右・+y 上・-z が おもて（顔）----
  const lattice = (w, h, d, n) => {
    const r = Math.max(w / n[0], h / n[1], d / n[2]) * 0.56, parts = [];
    for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let k = 0; k < n[2]; k++) {
      const u = n[0] > 1 ? i / (n[0] - 1) : 0.5, v = n[1] > 1 ? j / (n[1] - 1) : 0.5, s = n[2] > 1 ? k / (n[2] - 1) : 0.5;
      // 1れつの 向きは すこし ずらす（ひらたすぎると 回転が きまらない）
      const jig = ((i + j + k) % 2 ? 0.1 : -0.1);
      parts.push({ x: (u - 0.5) * (w - 2 * Math.min(r, w / 2)) + (n[0] === 1 ? jig : 0), y: (v - 0.5) * (h - 2 * Math.min(r, h / 2)) + (n[1] === 1 ? jig : 0), z: (s - 0.5) * (d - 2 * Math.min(r, d / 2)) + (n[2] === 1 ? jig : 0), r: Math.min(r, w / 2, h / 2, d / 2) * 1.02, m: 1 });
    }
    return parts;
  };
  // リング（あなの 向きは z。まえ・うしろから ツメが とおる）。すこし おもく する（かるいと フックで もちあげても 景品が ついて こない）
  const RING_N = 18, ringParts = (cy, R, r = 0.55, m = 0.5) => Array.from({ length: RING_N }, (_, i) => { const a = (i / RING_N) * Math.PI * 2; return { x: Math.cos(a) * R, y: cy + Math.sin(a) * R, z: 0, r, m }; });
  const SHAPES = {
    // ほしの クッション（ひらたい 星。まん中＋とがり 5＋くぼみ 5）
    star: () => {
      const parts = [{ x: 0, y: 0, z: -1, r: 3, m: 1 }, { x: 0, y: 0, z: 1, r: 3, m: 1 }]; // まん中は まえと うしろ（ひらたすぎると 回転が きまらない）
      for (let i = 0; i < 10; i++) { const a = (90 + i * 36) * D2R, R = i % 2 ? 3.9 : 6.3; parts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, z: 0, r: i % 2 ? 2.5 : 2.25, m: 0.6 }); }
      return { parts, stiff: 0.45, fric: 0.75, look: "star", size: [18, 18, 5.4] };
    },
    // ごじ（大きい ぬいぐるみ。まるい からだ・耳・うで・あし・しっぽ）
    goji: () => ({ parts: [
      { x: 0, y: -6, z: 0, r: 8, m: 4 }, { x: 0, y: 1, z: 0, r: 8.5, m: 4 }, { x: 0, y: 7.5, z: 0.4, r: 7.5, m: 3 },
      { x: -6, y: 13, z: 0.5, r: 2.4, m: 0.4 }, { x: 6, y: 13, z: 0.5, r: 2.4, m: 0.4 },
      { x: -12.8, y: -0.5, z: -0.6, r: 2.8, m: 0.6 }, { x: 12.8, y: -0.5, z: -0.6, r: 2.8, m: 0.6 },
      { x: -5, y: -12.5, z: -1, r: 2.8, m: 0.8 }, { x: 5, y: -12.5, z: -1, r: 2.8, m: 0.8 }, { x: 10.5, y: -9, z: 5, r: 2.8, m: 0.6 },
    ], stiff: 0.32, fric: 0.8, look: "goji", art: [0, 0.4, 31, 31], size: [31, 31, 17] }),
    // わんこ（あたまが 大きい。たれた 耳）
    wanko: () => ({ art: [0, -0.5, 23.6, 24.4], parts: [
      { x: 0, y: 5, z: 0, r: 7.6, m: 3 }, { x: 0, y: -5.5, z: 0.5, r: 5.4, m: 2.5 },
      { x: -8.4, y: 5.5, z: 0.5, r: 3.3, m: 0.5 }, { x: 8.4, y: 5.5, z: 0.5, r: 3.3, m: 0.5 },
      { x: -4.6, y: -4, z: -1.5, r: 2.4, m: 0.4 }, { x: 4.6, y: -4, z: -1.5, r: 2.4, m: 0.4 },
      { x: -2.9, y: -10.6, z: -0.8, r: 2.5, m: 0.5 }, { x: 2.9, y: -10.6, z: -0.8, r: 2.5, m: 0.5 }, { x: 4.5, y: -8, z: 4.4, r: 1.8, m: 0.2 },
    ], stiff: 0.34, fric: 0.8, look: "wanko", size: [23, 26, 16] }),
    // がちゃん（まるい ひよこ）＋あたまの リング
    gachan: () => ({ art: [0, -0.7, 14.4, 20.6], parts: [
      { x: 0, y: 3.2, z: 0.3, r: 6.4, m: 2.2 }, { x: 0, y: -5, z: 0.4, r: 5.5, m: 3.2 },
      { x: -5.2, y: -4.4, z: 0, r: 2, m: 0.3 }, { x: 5.2, y: -4.4, z: 0, r: 2, m: 0.3 },
      { x: -3.4, y: -8.7, z: -3.4, r: 2.2, m: 0.8 }, { x: 3.4, y: -8.7, z: -3.4, r: 2.2, m: 0.8 }, { x: 0, y: -8.2, z: 4, r: 2.6, m: 0.8 }, { x: -4, y: -8.6, z: 1.5, r: 2.3, m: 0.6 }, { x: 4, y: -8.6, z: 1.5, r: 2.3, m: 0.6 },
      { x: 0, y: 10.2, z: 0.3, r: 0.9, m: 0.15 }, ...ringParts(14.8, 2.9, 0.6),
    ], stiff: 0.7, fric: 0.8, look: "gachan", ring: [0, 14.8, 0, 2.9], size: [15, 30, 14] }),
    // メリーゴーランドの はこ（かたい はこ）
    carousel: () => ({ parts: lattice(22, 26, 22, [3, 3, 3]), stiff: 1, fric: 0.55, look: "carousel", box: [22, 26, 22], size: [22, 26, 22] }),
    // クッキーの はこ＋リング
    cookie: () => ({ parts: [...lattice(17, 8, 11, [3, 2, 2]), { x: 0, y: 4.6, z: 0, r: 0.9, m: 0.15 }, ...ringParts(9.3, 2.9, 0.6)], stiff: 1, fric: 0.5, look: "cookie", box: [17, 8, 11], ring: [0, 9.3, 0, 2.9], size: [17, 17, 11] }),
    // うまーぼう（ぼう）
    stick: () => ({ parts: Array.from({ length: 4 }, (_, i) => ({ x: (i - 1.5) * 3.5, y: i % 2 ? 0.12 : -0.12, z: i < 2 ? 0.1 : -0.1, r: 1.35, m: 0.5 })), stiff: 1, fric: 0.45, look: "uma", size: [13.2, 2.7, 2.7] }),
    // ぱいのみんの はこ（ひらたい）
    pie: () => ({ parts: lattice(9.5, 3, 7.5, [3, 1, 2]), stiff: 1, fric: 0.45, look: "pie", box: [9.5, 3, 7.5], size: [9.5, 3, 7.5] }),
  };

  // 大きい ぬいぐるみ（おなじ 形を k ばい）
  const scaled = (name, k) => () => { const S = SHAPES[name](); return { ...S, parts: S.parts.map((a) => ({ x: a.x * k, y: a.y * k, z: a.z * k, r: a.r * k, m: a.m })), art: S.art && S.art.map((v) => v * k), size: S.size.map((v) => v * k), ring: S.ring && S.ring.map((v) => v * k) }; };
  SHAPES.wankoBig = scaled("wanko", 1.35);

  // ---- アーム（2本・3本。ツメの 先は ゴム）----
  class ClawRig {
    constructor(W, o) {
      Object.assign(this, { W, o, x: o.home.x, z: o.home.z, vx: 0, vz: 0, tvx: 0, tvz: 0, y: o.top, sx: 0, sz: 0, svx: 0, svz: 0, mode: "hold", power: 1, loose: 0 });
      this.th = o.yaws.map(() => o.rest); this.stall = o.yaws.map(() => 0); this.base = o.yaws.map(() => o.rest);
      this.head = W.collider({ k: "sphere", c: [this.x, this.y, this.z], r: o.headR, move: true, fr: 0.4 });
      this.segs = o.yaws.map(() => o.segs.map((s) => W.collider({ k: "cap", a: [0, 0, 0], b: [0, 0, 0], r: s.r, move: true, fr: s.fr || 0.6, grip: s.grip || 1 })));
      this.place(); for (const c of this.all()) W.save(c);
    }
    all() { return [this.head, ...this.segs.flat()]; }
    hub() { return [this.x + this.sx, this.y, this.z + this.sz]; }
    // うでの ふし（ねもと → ひじ → ツメ）
    joints(k) {
      const o = this.o, [hx, hy, hz] = this.hub(), yaw = o.yaws[k] * D2R, ux = Math.cos(yaw), uz = Math.sin(yaw);
      let p = [hx + ux * o.pivot, hy - o.drop, hz + uz * o.pivot], ang = this.th[k];
      const out = [p];
      for (const s of o.segs) { ang -= (s.bend || 0) * D2R; const q = [p[0] + ux * Math.sin(ang) * s.len, p[1] - Math.cos(ang) * s.len, p[2] + uz * Math.sin(ang) * s.len]; out.push(q); p = q; }
      return out;
    }
    place() {
      this.head.c = this.hub();
      for (let k = 0; k < this.segs.length; k++) { const j = this.joints(k); this.segs[k].forEach((c, i) => { c.a = j[i]; c.b = j[i + 1]; }); }
    }
    push() { return this.all().reduce((s, c) => s + c.push, 0); }
    tipY() { let m = Infinity; for (let k = 0; k < this.segs.length; k++) { const j = this.joints(k); for (const p of j) m = Math.min(m, p[1]); } return m - this.o.segs[this.o.segs.length - 1].r; }
    step(h) {
      const o = this.o, A = o.accel * h;
      const ovx = this.vx, ovz = this.vz;
      this.vx += clamp(this.tvx - this.vx, -A, A); this.vz += clamp(this.tvz - this.vz, -A, A);
      let nx = this.x + this.vx * h, nz = this.z + this.vz * h;
      if (nx < o.lim[0]) { nx = o.lim[0]; this.vx = 0; } if (nx > o.lim[1]) { nx = o.lim[1]; this.vx = 0; }
      if (nz < o.lim[2]) { nz = o.lim[2]; this.vz = 0; } if (nz > o.lim[3]) { nz = o.lim[3]; this.vz = 0; }
      this.x = nx; this.z = nz;
      // ふりこ（ケーブルで つるされた あたま）。くるまが 止まると ゆれる
      const L = Math.max(12, o.cable + o.top - this.y), w2 = CP.GRAV / L, ax = (this.vx - ovx) / h, az = (this.vz - ovz) / h, c = o.swingDamp;
      this.svx += (-w2 * this.sx - ax - c * this.svx) * h; this.svz += (-w2 * this.sz - az - c * this.svz) * h;
      this.sx = clamp(this.sx + this.svx * h, -5, 5); this.sz = clamp(this.sz + this.svz * h, -5, 5);
      if (this.head.push > 0.4) { this.svx *= 0.9; this.svz *= 0.9; } // なにかに のって いると ゆれが へる
      for (let k = 0; k < this.th.length; k++) {
        const push = this.segs[k].reduce((s, c) => s + c.push, 0);
        if (this.mode === "open") this.th[k] = Math.min(o.open, this.th[k] + o.wOpen * h);
        else if (this.mode === "release") this.th[k] = Math.min(o.release || o.open, this.th[k] + o.wOpen * h);
        else if (this.mode === "close") { if (push < this.power * o.force) this.th[k] = Math.max(o.closed, this.th[k] - o.wClose * h); else this.stall[k] += h; this.base[k] = this.th[k]; }
        else if (this.mode === "loose") this.th[k] = Math.min(this.base[k] + this.loose, this.th[k] + o.wOpen * 0.5 * h);
        else if (this.mode === "rest") this.th[k] += clamp(o.rest - this.th[k], -o.wOpen * h, o.wOpen * h);
      }
      // はなす ときは ツメが すべる（ゴムに ひっかかって のこらない）。フックは かたむいて リングが ぬける
      const slip = this.mode === "release";
      if (slip !== this.slipping) {
        this.slipping = slip;
        this.segs.forEach((arm) => arm.forEach((c, i) => { c.fr = slip ? 0.08 : o.segs[i].fr || 0.6; c.grip = slip ? 1 : o.segs[i].grip || 1; c.off = !!(slip && o.hookFree && i >= 1); }));
        this.head.fr = slip ? 0.05 : 0.4;
      }
      this.place();
    }
    // セーブ（うごきの とちゅうは のこさない）
    save() { return { x: +this.x.toFixed(2), z: +this.z.toFixed(2) }; }
    load(s) { if (s) { this.x = clamp(s.x, this.o.lim[0], this.o.lim[1]); this.z = clamp(s.z, this.o.lim[2], this.o.lim[3]); } this.place(); for (const c of this.all()) this.W.save(c); }
  }

  // ---- トライポッド（あなの まわりの ランプを とめると、その アームが おちる）----
  class TrypodRig {
    constructor(W, o) {
      Object.assign(this, { W, o, light: 0, run: true, flash: 0 });
      this.arms = Array.from({ length: o.n }, (_, k) => ({ yaw: o.a0 + (k * 360) / o.n, up: true, drop: 0, c: W.collider({ k: "cap", a: [0, 0, 0], b: [0, 0, 0], r: o.armR, move: true, fr: 0.55 }) }));
      this.place(); for (const a of this.arms) W.save(a.c);
    }
    place() {
      const o = this.o;
      for (const a of this.arms) {
        const yaw = a.yaw * D2R, ux = Math.cos(yaw), uz = Math.sin(yaw), fall = ease(a.drop) * 82 * D2R, len = o.out - o.in;
        a.c.a = [o.cx + ux * o.out, o.y, o.cz + uz * o.out];
        a.c.b = [a.c.a[0] - ux * Math.cos(fall) * len, o.y - Math.sin(fall) * len, a.c.a[2] - uz * Math.cos(fall) * len];
      }
    }
    cells() { return this.o.n * this.o.per; }
    cell() { return Math.floor(this.light) % this.cells(); }
    armAt(cell) { return cell % this.o.per === 0 ? this.arms[cell / this.o.per] : null; }
    step(h) {
      if (this.run) this.light = (this.light + this.o.speed * h) % this.cells();
      for (const a of this.arms) if (!a.up && a.drop < 1) a.drop = Math.min(1, a.drop + h / 0.32);
      if (this.flash > 0) this.flash -= h;
      this.place();
    }
    save() { return { up: this.arms.map((a) => (a.up ? 1 : 0)).join("") }; }
    load(s) { if (s && typeof s.up === "string") this.arms.forEach((a, k) => { a.up = s.up[k] !== "0"; a.drop = a.up ? 0 : 1; }); this.place(); for (const a of this.arms) this.W.save(a.c); }
  }

  // ---- スウィートランド（まわる 台・ショベル・おしだす 台）----
  class SweetRig {
    constructor(W, o) {
      Object.assign(this, { W, o, ang: 0, pusherT: 0, sx: o.cx + Math.cos(o.arc[0]) * o.arcR, sy: o.idleY, sz: o.cz + Math.sin(o.arc[0]) * o.arcR, yaw: 0, tilt: 0, mode: "swing", swingT: 0, pz: o.push[0] });
      this.disk = W.collider({ k: "disk", c: [o.cx, o.top, o.cz], rad: o.rad, h: 3, ang: 0, move: true, fr: 0.9 });
      this.fence = W.collider({ k: "cyl", cx: o.cx, cz: o.cz, rad: o.rad + 0.6, y0: o.top - 2, y1: o.top + 6.5, inside: true, fr: 0.3, spin: this.disk });
      this.hubC = W.collider({ k: "cyl", cx: o.cx, cz: o.cz, rad: 4.5, y0: o.top - 2, y1: o.top + 14, fr: 0.3, spin: this.disk });
      // ショベル（そこ・うしろ・よこ 2まい）
      const S = o.scoop;
      this.parts = [
        { l: [0, 0, 0], h: [S.w / 2, 0.45, S.d / 2] }, { l: [0, S.wall / 2, S.d / 2], h: [S.w / 2, S.wall / 2, 0.45] },
        { l: [-S.w / 2, S.wall / 2 - 0.5, 0], h: [0.45, S.wall / 2, S.d / 2] }, { l: [S.w / 2, S.wall / 2 - 0.5, 0], h: [0.45, S.wall / 2, S.d / 2] },
      ].map((p) => ({ ...p, c: W.collider({ k: "box", c: [0, 0, 0], h: p.h, move: true, fr: 0.5 }) }));
      this.pusher = W.collider({ k: "box", c: [0, 0, 0], h: [o.stage.w / 2, 3.2, o.pdepth / 2], move: true, fr: 0.35 });
      this.place(); for (const c of [this.disk, ...this.parts.map((p) => p.c), this.pusher]) W.save(c);
    }
    place() {
      const o = this.o, R = CP.rotYXZ(this.yaw, this.tilt, 0);
      for (const p of this.parts) {
        const l = p.l, w = [R[0][0] * l[0] + R[1][0] * l[1] + R[2][0] * l[2], R[0][1] * l[0] + R[1][1] * l[1] + R[2][1] * l[2], R[0][2] * l[0] + R[1][2] * l[1] + R[2][2] * l[2]];
        p.c.c = [this.sx + w[0], this.sy + w[1], this.sz + w[2]]; p.c.R = R;
      }
      this.disk.ang = this.ang;
      this.pusher.c = [o.stage.cx, o.stage.top + 3.2, this.pz + o.pdepth / 2];
    }
    step(h) {
      const o = this.o;
      this.ang += o.spin * h;
      this.pusherT += h; this.pz = mix(o.push[0], o.push[1], 0.5 - 0.5 * Math.cos((this.pusherT * 2 * Math.PI) / o.period));
      // ショベルは まわる 台の みぎの ふちを 弧を えがいて いったり きたり（まえから よく みえる）→ すくったら ステージの 上を よこに
      if (this.mode === "swing" || this.mode === "swing2") {
        this.swingT += h; const s = 0.5 - 0.5 * Math.cos((this.swingT * 2 * Math.PI) / o.swingPeriod);
        if (this.mode === "swing") { const a = mix(o.arc[0], o.arc[1], s); this.sx = o.cx + Math.cos(a) * o.arcR; this.sz = o.cz + Math.sin(a) * o.arcR; }
        else this.sx = mix(o.swing2[0], o.swing2[1], s);
      }
      this.place();
    }
    // ながれに 向かって あける（まわる 台の その 場所の うごき）
    flowYaw() { const dx = this.sx - this.o.cx, dz = this.sz - this.o.cz, vx = -dz * this.o.spin, vz = dx * this.o.spin; return Math.atan2(vx, vz); }
    save() { return { a: +(this.ang % (Math.PI * 2)).toFixed(3), p: +this.pusherT.toFixed(2) }; }
    load(s) { if (s) { this.ang = s.a || 0; this.pusherT = s.p || 0; this.pz = mix(this.o.push[0], this.o.push[1], 0.5 - 0.5 * Math.cos((this.pusherT * 2 * Math.PI) / this.o.period)); } this.place(); for (const c of [this.disk, ...this.parts.map((p) => p.c), this.pusher]) this.W.save(c); }
  }

  // ---- 台の かたち（ゆか・おとしぐち・ガード）----
  const floorWithChute = (W, M, ch) => {
    // ゆかは 厚い 板を あなの まわりに ならべる
    const t = 4, add = (x0, x1, z0, z1) => { if (x1 - x0 > 0.1 && z1 - z0 > 0.1) W.collider({ k: "box", c: [(x0 + x1) / 2, -t / 2, (z0 + z1) / 2], h: [(x1 - x0) / 2, t / 2, (z1 - z0) / 2], fr: 0.62 }); };
    add(0, M.w, ch.z1, M.d); add(0, ch.x0, 0, ch.z1); add(ch.x1, M.w, 0, ch.z1);
    if (ch.z0 > 0) add(ch.x0, ch.x1, 0, ch.z0);
    // ガード（とうめいの いた）
    for (const g of ch.guards || []) W.collider({ k: "box", c: g.c, h: g.h, fr: 0.3 });
  };

  // ---- 8台 ----
  const CLAW3 = { yaws: [90, 210, 330], pivot: 3.1, drop: 2.6, segs: [{ len: 10.5, r: 0.75, fr: 0.5 }, { len: 5.2, bend: 45, r: 0.85, fr: 0.9, grip: 1.6 }], rest: -2 * D2R, open: 41 * D2R, release: 62 * D2R, closed: -2 * D2R, wOpen: 1.6, wClose: 1.05, force: 2.2, headR: 4.4, accel: 70, swingDamp: 1.3, cable: 8 };
  const CLAW2 = { yaws: [0, 180], pivot: 4, drop: 3, segs: [{ len: 22, r: 1, fr: 0.5 }, { len: 6.5, bend: 50, r: 1.05, fr: 0.9, grip: 1.6 }], rest: 0, open: 48 * D2R, release: 64 * D2R, closed: 0, wOpen: 1.2, wClose: 0.75, force: 3.2, headR: 5.4, accel: 60, swingDamp: 1.2, cable: 9 };
  // フックづめ: よこむきの フック（7cm）が リングの あなに はいる。ねもとは 外がわ（リングの まえで とまる）
  const HOOK2 = { yaws: [90, 270], pivot: 5, drop: 2.5, segs: [{ len: 10, r: 0.6, fr: 0.5 }, { len: 7, bend: 80, r: 0.5, fr: 0.8, grip: 1.3 }, { len: 2.2, bend: 100, r: 0.45, fr: 0.8 }], rest: -3 * D2R, open: 38 * D2R, release: 60 * D2R, closed: -3 * D2R, wOpen: 1.5, wClose: 1.0, force: 1.4, headR: 3.8, accel: 70, swingDamp: 1.1, cable: 8, hookFree: true };
  const DEFS = [
    { type: "claw", theme: "star", rig: CLAW3, box: { w: 60, d: 48, h: 64 }, chute: { x0: 0, x1: 17, z0: 0, z1: 17, guards: [{ c: [17.4, 3.5, 8.5], h: [0.4, 3.5, 8.5] }, { c: [8.7, 3.5, 17.4], h: [8.7, 3.5, 0.4] }] }, home: { x: 8.5, z: 8.5 }, top: 50, minY: 14, moveTime: 30,
      fill: { shape: "star", n: 12, keep: 9, area: [21, 57, 4, 45] }, got: "win" },
    { type: "claw", theme: "goji", rig: CLAW2, box: { w: 56, d: 50, h: 76 }, chute: { x0: 11, x1: 45, z0: 0, z1: 21, guards: [{ c: [10.6, 2, 10.5], h: [0.4, 2, 10.5] }, { c: [45.4, 2, 10.5], h: [0.4, 2, 10.5] }, { c: [28, 1.4, 21.4], h: [17.4, 1.4, 0.4] }] }, home: { x: 28, z: 10 }, top: 60, minY: 16, moveTime: 30,
      fill: { shape: "goji", n: 1, keep: 1, upright: true, at: [[31, 34, 0.35]] }, got: "win" },
    { type: "sweet", theme: "candy", box: { w: 64, d: 62, h: 66 }, sweet: "stick", got: "piece", sub: 3 },
    { type: "sweet", theme: "pie", box: { w: 64, d: 62, h: 66 }, sweet: "pie", got: "piece", sub: 3 },
    { type: "tripod", theme: "circus", box: { w: 60, d: 56, h: 52 }, prize: "carousel", got: "win" },
    { type: "tripod", theme: "wanko", box: { w: 60, d: 56, h: 52 }, prize: "wankoBig", got: "win" },
    { type: "ring", theme: "chick", rig: HOOK2, box: { w: 60, d: 48, h: 62 }, chute: { x0: 0, x1: 17, z0: 0, z1: 16, guards: [{ c: [17.4, 3, 8], h: [0.4, 3, 8] }, { c: [8.7, 3, 16.4], h: [8.7, 3, 0.4] }] }, home: { x: 8.5, z: 8 }, top: 50, minY: 39, moveTime: 30,
      fill: { shape: "gachan", n: 3, keep: 3, upright: true, gap: 15, at: [[30, 22, 0.25], [45, 29, -0.3], [29, 38, 0.1], [44, 40, 0.2]] }, got: "win" },
    { type: "ring", theme: "cookie", rig: HOOK2, box: { w: 60, d: 48, h: 62 }, chute: { x0: 0, x1: 17, z0: 0, z1: 16, guards: [{ c: [17.4, 3, 8], h: [0.4, 3, 8] }, { c: [8.7, 3, 16.4], h: [8.7, 3, 0.4] }] }, home: { x: 8.5, z: 8 }, top: 50, minY: 26.7, moveTime: 30,
      fill: { shape: "cookie", n: 4, keep: 4, upright: true, gap: 13, at: [[30, 20, 0.1], [48, 22, -0.15], [30, 35, -0.1], [47, 37, 0.12]] }, got: "win" },
  ];

  // ---- 1かいの あそび ----
  class CraneRound {
    // i: 台の 番号・board: セーブされた 台の ようす（なければ はじめから）・luck: アームが つよいか
    constructor(i, board, o = {}) {
      // たねは 台と その ようすで きまる（おなじ 台・おなじ そうさ → おなじ けっか。テストでも くりかえせる）
      this.i = i; this.def = DEFS[i]; this.type = this.def.type; this.seed = o.seed != null ? o.seed : o.cp && o.cp.seed != null ? o.cp.seed : 1234 + i * 77 + ((board && board.n) || 0) * 7919;
      this.rand = rng(this.seed); this.strong = o.strong != null ? !!o.strong : true; this.t = 0; this.pt = 0; this.phase = "move"; this.done = false;
      this.got = []; this.events = []; this.acc = 0; this.frames = 0; this.presses = 0; this.msg = "";
      this.build(board);
      if (this.type === "claw" || this.type === "ring") { this.time = this.def.moveTime; this.rig.power = this.strong || this.type === "ring" ? 1 : 0.34; }
      if (this.type === "tripod") { this.phase = "spin"; this.stops = 3; }
      if (this.type === "sweet") { this.phase = "swing"; this.scoops = 3; }
      this.events.length = 0;
      if (o.cp) this.resume(o.cp);
    }
    // 台を つくる（ゆか・かべ・しかけ・景品）
    build(board) {
      const d = this.def, M = d.box, W = (this.W = new CP.World({ bounds: { x0: 0, x1: M.w, z0: 0, z1: M.d, y1: M.h }, outY: -12, sub: d.sub || 4 })); this.sid = (board && board.n) || 1; this.bodies = [];
      if (d.type === "claw" || d.type === "ring") {
        floorWithChute(W, M, d.chute);
        this.rig = new ClawRig(W, { ...d.rig, home: d.home, top: d.top, lim: [6, M.w - 6, Math.min(d.home.z, 8), M.d - 6] });
        this.rig.load(null);
      } else if (d.type === "tripod") {
        W.collider({ k: "holefloor", y: 0, cx: M.w / 2, cz: M.d / 2 + 2, rad: 17.5, th: 3, fr: 0.6 });
        W.collider({ k: "cyl", cx: M.w / 2, cz: M.d / 2 + 2, rad: 17.5, y0: -40, y1: -0.5, inside: true, fr: 0.2 });
        this.rig = new TrypodRig(W, { cx: M.w / 2, cz: M.d / 2 + 2, in: 6.5, out: 20.5, y: 1.4, armR: 1.25, n: 6, per: 2, a0: 90, speed: 5.5, hole: 17.5 });
      } else {
        // ゆか（まえの 14cm は とりだしぐちへの あな。ガラスと ステージの あいだに おかしが はさまらない ひろさ）
        W.collider({ k: "box", c: [M.w / 2, -2, (14 + M.d) / 2], h: [M.w / 2, 2, (M.d - 14) / 2], fr: 0.6 });
        const st = { cx: 32, w: 48, z0: 14, z1: 40, top: 30 };
        W.collider({ k: "box", c: [st.cx, st.top - 1.5, (st.z0 + st.z1) / 2], h: [st.w / 2, 1.5, (st.z1 - st.z0) / 2], fr: 0.28 });
        // ステージの よこの かべ・うしろの かべ（おかしは まえからだけ おちる）
        W.collider({ k: "box", c: [st.cx - st.w / 2 - 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2], fr: 0.3 });
        W.collider({ k: "box", c: [st.cx + st.w / 2 + 0.4, st.top + 6, (st.z0 + st.z1) / 2], h: [0.4, 6, (st.z1 - st.z0) / 2], fr: 0.3 });
        W.collider({ k: "box", c: [st.cx, st.top + 6, st.z1 + 0.4], h: [st.w / 2 + 0.8, 6, 0.4], fr: 0.3 });
        this.stage = st;
        this.rig = new SweetRig(W, { cx: 32, cz: 44, rad: 16.5, top: 4, spin: 0.42, arc: [-62 * D2R, 62 * D2R], arcR: 10.5, swing2: [14, 50], swingPeriod: 3.6, idleY: 13, dumpZ: 19.5, dumpY: 47, stage: st, pdepth: 12, push: [23, 32], period: 2.3, scoop: { w: 12, d: 9, wall: 5.5 } });
      }
      W.pre = (h) => this.rig.step(h);
      if (board && board.s) this.rig.load(board.s);
      if (board && Array.isArray(board.b) && board.b.length) { this.restore(board); if (d.type === "sweet") this.refillTable(); else if (d.type !== "tripod") { if (this.refill(false)) this.settle(2.5); } }
      else this.fresh();
    }
    // 景品を ひとつ おく（p: 位置・q: 向き）
    add(shape, p, q, extra = {}) {
      const S = SHAPES[shape](), R = CP.qmat(q);
      let mx = 0, my = 0, mz = 0, mm = 0; for (const a of S.parts) { mx += a.x * a.m; my += a.y * a.m; mz += a.z * a.m; mm += a.m; }
      const parts = S.parts.map((a) => ({ x: p[0] + R[0][0] * a.x + R[1][0] * a.y + R[2][0] * a.z, y: p[1] + R[0][1] * a.x + R[1][1] * a.y + R[2][1] * a.z, z: p[2] + R[0][2] * a.x + R[1][2] * a.y + R[2][2] * a.z, r: a.r, m: a.m }));
      // org: まん中（おもさの 中心）から 形の 原点への ずれ（ローカル）。絵を かさねる ときに つかう
      const b = this.W.body({ parts, stiff: S.stiff, fric: S.fric, q, data: { sid: extra.sid || this.sid++, shape, look: S.look, box: S.box, ring: S.ring, art: S.art, size: S.size, org: [-mx / mm, -my / mm, -mz / mm], ...extra } });
      // q で 回した ぶん rest は もとに もどって いる（world.body が 回転を とりのぞく）
      this.bodies.push(b); return b;
    }
    randQ(upright) {
      const r = this.rand;
      if (upright) return CP.qaxis(0, 1, 0, (r() - 0.5) * 0.9);
      return CP.qnorm(CP.qmul(CP.qaxis(0, 1, 0, r() * Math.PI * 2), CP.qaxis(1, 0, 0, (0.5 + (r() - 0.5) * 0.6) * Math.PI)));
    }
    fresh() {
      const d = this.def, r = this.rand;
      if (d.type === "claw" || d.type === "ring") this.refill(true);
      else if (d.type === "tripod") this.placeTripodPrize();
      else {
        // まわる 台の 上に 20こ・おしだし台に 12こ
        const o = this.rig.o, st = this.stage;
        for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2 * 3 + r() * 0.4, rr = 7.5 + ((k * 7) % 5) * 1.2; this.add(d.sweet, [o.cx + Math.cos(a) * rr, o.top + 2 + Math.floor(k / 7) * 3, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, -a + (r() - 0.5) * 0.5)); }
        for (let k = 0; k < 12; k++) this.add(d.sweet, [st.cx - st.w / 2 + 7 + ((k % 4) + 0.3 + r() * 0.4) * (st.w - 14) / 4, st.top + 2 + (k % 2) * 2.5, st.z0 + 4 + Math.floor(k / 4) * 3.2 + r() * 1.2], CP.qaxis(0, 1, 0, (r() - 0.5) * 0.5));
      }
      this.settle(3);
    }
    // へった 景品を たす（スタッフの ほじゅう）
    refill(first) {
      const d = this.def, f = d.fill, r = this.rand, alive = this.bodies.filter((b) => b.alive).length;
      if (!first && alive >= f.keep) return 0;
      const want = first ? f.n : f.n - alive;
      const low = f.upright ? -Math.min(...SHAPES[f.shape]().parts.map((a) => a.y - a.r)) + 0.25 : 0; // たてて おく ものは ゆかに そっと おく
      for (let k = 0; k < want; k++) {
        if (f.at) {
          // きまった ばしょ（あいて いる ところだけ）
          const free = f.at.filter(([x, z]) => this.list().every((b) => { const c = this.W.centroid(b); return Math.hypot(c[0] - x, c[2] - z) > (f.gap || 14); }));
          const [x, z, yaw] = first ? f.at[k % f.at.length] : free.length ? free[Math.floor(r() * free.length)] : f.at[k % f.at.length];
          this.add(f.shape, [x, f.upright ? low : 20, z], CP.qaxis(0, 1, 0, yaw)); if (!first) this.settle(0.6); continue;
        }
        // 上から 1こずつ おとして 山に する（かさなって おくと はじける）
        const [x0, x1, z0, z1] = f.area, x = mix(x0, x1, r()), z = mix(z0, z1, first ? r() : 0.55 + r() * 0.45);
        this.add(f.shape, [x, 30 + r() * 4, z], this.randQ(false)); this.settle(0.5);
      }
      return want;
    }
    // まわる 台の おかしが へったら 上から たす（おみせの 人の ほじゅう）
    refillTable() {
      const o = this.rig.o, r = this.rand, on = this.list().filter((b) => { const c = this.W.centroid(b); return c[1] < 14 && Math.hypot(c[0] - o.cx, c[2] - o.cz) < o.rad + 1; }).length;
      if (on >= 14) return 0;
      for (let k = 0; k < 20 - on; k++) { const a = r() * Math.PI * 2, rr = 7.5 + r() * (o.rad - 10); this.add(this.def.sweet, [o.cx + Math.cos(a) * rr, o.top + 6 + (k % 3) * 3, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, -a + (r() - 0.5) * 0.5)); }
      this.settle(2.5); this.refilled = 20 - on; return this.refilled;
    }
    placeTripodPrize() {
      const o = this.rig.o, S = SHAPES[this.def.prize](), hy = S.size[1] / 2;
      this.add(this.def.prize, [o.cx, o.y + o.armR + hy + (this.def.prize === "wankoBig" ? 2 : 0.2), o.cz], CP.qaxis(0, 1, 0, 0.2));
    }
    // しずまるまで すすめる（はじめの ならべ・ほじゅうの あと）
    settle(sec) { for (let i = 0; i < sec * 60; i++) { this.W.step(DT); if (this.W.B.every((b) => !b.alive || b.sleep)) break; } this.W.events.length = 0; this.bodies = this.bodies.filter((b) => b.alive); }
    restore(board) {
      this.sid = board.n || 1;
      for (const e of board.b) {
        const [sid, shape, x, y, z, qw, qx, qy, qz] = e; if (!SHAPES[shape] || ![x, y, z, qw, qx, qy, qz].every(Number.isFinite)) continue;
        // セーブは おもさの 中心。形の 原点に もどして おく（まるくない ぬいぐるみが ずれない）
        const q = CP.qnorm([qw, qx, qy, qz]), R = CP.qmat(q), P = SHAPES[shape]().parts; let mx = 0, my = 0, mz = 0, mm = 0;
        for (const a of P) { mx += a.x * a.m; my += a.y * a.m; mz += a.z * a.m; mm += a.m; }
        const l = [mx / mm, my / mm, mz / mm], w = [R[0][0] * l[0] + R[1][0] * l[1] + R[2][0] * l[2], R[0][1] * l[0] + R[1][1] * l[1] + R[2][1] * l[2], R[0][2] * l[0] + R[1][2] * l[1] + R[2][2] * l[2]];
        this.add(shape, [x - w[0], y - w[1], z - w[2]], q, { sid });
      }
      for (const b of this.W.B) b.sleep = true;
    }
    // セーブ用（まん中と 向きだけ。0.1cm・0.001）
    board() {
      const b = this.bodies.filter((b) => b.alive).map((b) => { const c = this.W.centroid(b); return [b.data.sid, b.data.shape, ...c.map((v) => Math.round(v * 10) / 10), ...b.q.map((v) => Math.round(v * 1000) / 1000)]; });
      return { v: 1, n: this.sid, b, s: this.rig.save() };
    }
    // ---- そうさ ----
    // dx・dz: -1〜1（よこ・おく）
    move(dx, dz) {
      if ((this.type !== "claw" && this.type !== "ring") || this.phase !== "move") return;
      const sp = 15; this.rig.tvx = clamp(dx, -1, 1) * sp; this.rig.tvz = clamp(dz, -1, 1) * sp;
    }
    press() {
      this.presses++;
      if (this.type === "claw" || this.type === "ring") {
        if (this.phase === "move") { this.go("stop"); this.rig.tvx = 0; this.rig.tvz = 0; this.events.push({ e: "checkpoint" }); return "drop"; }
        if (this.phase === "down" && this.pt > 0.25) { this.go("close"); return "stop"; }
        return null;
      }
      if (this.type === "tripod") {
        if (this.phase !== "spin") return null;
        const R = this.rig, cell = R.cell(), arm = R.armAt(cell); R.run = false; this.stops--; this.lastCell = cell;
        this.hit = !!(arm && arm.up); if (this.hit) { arm.up = false; this.jolt(); this.events.push({ e: "armdrop", k: R.arms.indexOf(arm) }); } else this.events.push({ e: "trymiss" });
        R.flash = 0.8; this.go("stopped"); return this.hit ? "hit" : "miss";
      }
      if (this.type === "sweet") {
        if (this.phase === "swing") { this.go("dip"); this.rig.mode = "work"; this.dipX = this.rig.sx; return "scoop"; }
        if (this.phase === "swing2") { this.go("dump"); this.rig.mode = "work"; return "dump"; }
      }
      return null;
    }
    go(p) { this.phase = p; this.pt = 0; this.events.push({ e: "phase", p }); }
    // アームが おちた ときの ガタン（景品が ぐらっと ゆれる）
    jolt() {
      const r = this.rand;
      for (const b of this.list()) { this.W.wake(b); const kx = (r() - 0.5) * 0.05, kz = (r() - 0.5) * 0.05; for (let j = b.i0; j < b.i0 + b.n; j++) { const p = this.W.P[j]; p.px -= kx; p.pz -= kz; p.py -= 0.03; } }
    }
    // つづきから あそべる ように（セーブ用）。board は 台の ようす
    snap() {
      const R = this.rig, o = { v: 1, type: this.type, phase: this.phase, got: this.got.slice(), seed: this.seed, strong: this.strong, board: this.board() };
      if (this.type === "claw" || this.type === "ring") Object.assign(o, { time: +this.time.toFixed(2), x: +R.x.toFixed(2), z: +R.z.toFixed(2), drop: this.phase !== "move" });
      if (this.type === "tripod") o.stops = this.stops;
      if (this.type === "sweet") o.scoops = this.scoops;
      return o;
    }
    resume(cp) {
      if (!cp) return;
      this.got = Array.isArray(cp.got) ? cp.got.slice() : [];
      if (this.type === "claw" || this.type === "ring") {
        this.time = clamp(+cp.time || 0, 0, this.def.moveTime); const R = this.rig; R.load({ x: +cp.x || R.x, z: +cp.z || R.z });
        if (cp.drop) { this.go("stop"); this.events.push({ e: "replay" }); } // おりる とちゅうだった → もういちど おろす
      }
      if (this.type === "tripod") this.stops = clamp(cp.stops | 0, 0, 3);
      if (this.type === "sweet") this.scoops = clamp(cp.scoops | 0, 0, 3);
      if ((this.type === "tripod" && this.stops <= 0) || (this.type === "sweet" && this.scoops <= 0)) this.go(this.type === "tripod" ? "settle" : "watch");
    }
    // ---- すすめる（かならず 1/60びょう ずつ）----
    step(dt) {
      this.acc = Math.min(this.acc + dt, DT * 6);
      while (this.acc >= DT - 1e-9) { this.acc -= DT; this.tick(); }
    }
    tick() {
      if (this.done) { this.W.step(DT); return; }
      this.t += DT; this.pt += DT; this.frames++;
      if (this.type === "claw" || this.type === "ring") this.clawTick();
      else if (this.type === "tripod") this.tripodTick();
      else this.sweetTick();
      this.W.step(DT);
      for (const ev of this.W.events.splice(0)) if (ev.e === "out") this.collect(ev.b);
    }
    // おとしぐちに おちた（とれた）
    collect(b) {
      const d = this.def;
      this.got.push(b.data.sid); this.events.push({ e: "got", sid: b.data.sid, look: b.data.look }); this.bodies = this.bodies.filter((x) => x !== b);
      if (d.got === "win" && this.type !== "tripod" && this.phase !== "done") this.won = true;
      if (this.type === "tripod") this.won = true;
    }
    // ゆかに おちて とまった おかしは まわる 台へ もどす（ほんものの 台も ゆかが かたむいて いる）
    returnSweets() {
      const o = this.rig.o, r = this.rand;
      for (const b of this.list()) {
        if (!b.sleep) continue; const c = this.W.centroid(b);
        if (c[1] < 5 && Math.hypot(c[0] - o.cx, c[2] - o.cz) > o.rad + 0.5) { this.W.remove(b); this.bodies = this.bodies.filter((x) => x !== b); const a = r() * Math.PI * 2, rr = 7 + r() * 6; this.add(this.def.sweet, [o.cx + Math.cos(a) * rr, o.top + 9, o.cz + Math.sin(a) * rr], CP.qaxis(0, 1, 0, r() * 3), { sid: b.data.sid }); }
      }
    }
    clawTick() {
      const R = this.rig, d = this.def, ph = this.phase;
      if (ph === "move") {
        this.time -= DT;
        if (this.time <= 0) { this.time = 0; this.go("stop"); R.tvx = 0; R.tvz = 0; this.events.push({ e: "timeup" }, { e: "checkpoint" }); }
      } else if (ph === "stop") { R.tvx = 0; R.tvz = 0; if (Math.abs(R.vx) + Math.abs(R.vz) < 0.05 && this.pt > 0.25) { this.go("open"); R.mode = "open"; } }
      else if (ph === "open") { if (this.pt > 0.55) this.go("down"); }
      else if (ph === "down") {
        R.y -= 15 * DT;
        const landed = this.pt > 0.3 && (R.push() > 1.2 || R.tipY() < 0.9);
        if (landed || R.y <= d.minY) { R.y = Math.max(R.y, d.minY); this.go("close"); }
      } else if (ph === "close") {
        R.mode = "close";
        const allStop = R.th.every((t, k) => t <= R.o.closed + 1e-4 || R.stall[k] > 0.25);
        if ((allStop && this.pt > 0.5) || this.pt > 1.6) { this.go("up"); }
      } else if (ph === "up") {
        R.y = Math.min(d.top, R.y + 12 * DT);
        if (R.y >= d.top) { if (!this.strong && this.type === "claw") { R.loose = 13 * D2R; R.mode = "loose"; this.events.push({ e: "loose" }); } this.go("top"); }
      } else if (ph === "top") { if (this.pt > 0.55) this.go("carry"); }
      else if (ph === "carry") {
        const dx = d.home.x - R.x, dz = d.home.z - R.z, dist = Math.hypot(dx, dz), sp = Math.min(15, dist * 3);
        R.tvx = dist > 0.05 ? (dx / dist) * sp : 0; R.tvz = dist > 0.05 ? (dz / dist) * sp : 0;
        if (dist < 0.15 && Math.abs(R.vx) + Math.abs(R.vz) < 0.2) { R.tvx = R.tvz = 0; this.go("release"); R.mode = "release"; }
      } else if (ph === "release") { if (this.pt > 1.3) { R.mode = "rest"; this.go("settle"); } }
      else if (ph === "settle") {
        const calm = this.W.B.every((b) => !b.alive || b.sleep);
        if ((calm && this.pt > 0.8) || this.pt > 3.5) this.finish();
      }
    }
    tripodTick() {
      const R = this.rig;
      if (this.phase === "spin") { R.run = true; if (this.t > 40) this.press(); }
      else if (this.phase === "stopped") {
        if (this.pt > 1.2) {
          this.events.push({ e: "checkpoint" });
          if (this.won) { this.go("settle"); }
          else if (this.stops > 0) { R.light = (R.light + 1) % R.cells(); this.go("spin"); }
          else this.go("settle");
        }
      } else if (this.phase === "settle") {
        const calm = this.W.B.every((b) => !b.alive || b.sleep);
        if ((calm && this.pt > 1) || this.pt > 4) this.finish();
      }
    }
    sweetTick() {
      const R = this.rig, o = R.o;
      if (this.frames % 60 === 0) this.returnSweets();
      if (this.phase === "swing") { R.sy += (o.idleY - R.sy) * 0.1; R.yaw += (R.flowYaw() - R.yaw) * 0.1; R.tilt += (0 - R.tilt) * 0.1; if (this.t > 60) this.press(); }
      else if (this.phase === "dip") {
        const k = ease(this.pt / 0.8); R.yaw = R.flowYaw(); R.sy = mix(o.idleY, o.top + 1.2, k); R.tilt = mix(0, -14 * D2R, k);
        if (this.pt >= 0.8) this.go("scoop");
      } else if (this.phase === "scoop") {
        // ながれに さからって すくいながら すすむ（くちの 向きへ 6cm）
        if (this.pt < 1.4) { const k = DT / 1.4 * 6; R.sx -= Math.sin(R.yaw) * k; R.sz -= Math.cos(R.yaw) * k; }
        else R.tilt = mix(-14 * D2R, 14 * D2R, ease((this.pt - 1.4) / 0.5));
        if (this.pt > 1.9) { this.liftFrom = [R.sx, R.sz]; this.go("lift"); }
      }
      else if (this.phase === "lift") {
        const k = ease(this.pt / 1.1), f = this.liftFrom; R.sy = mix(o.top + 1.2, o.dumpY, k); R.sz = mix(f[1], o.dumpZ, ease((this.pt - 0.9) / 0.9)); R.tilt = 14 * D2R; R.yaw += (0 - R.yaw) * 0.06;
        if (this.pt >= 1.8) { R.mode = "swing2"; R.swingT = Math.acos(clamp(1 - 2 * (R.sx - o.swing2[0]) / (o.swing2[1] - o.swing2[0]), -1, 1)) * o.swingPeriod / (2 * Math.PI); this.go("swing2"); }
      } else if (this.phase === "swing2") { R.yaw += (0 - R.yaw) * 0.1; if (this.pt > 12) this.press(); }
      else if (this.phase === "dump") {
        R.tilt = mix(12 * D2R, -125 * D2R, ease(this.pt / 0.7));
        if (this.pt > 1.4) this.go("back");
      } else if (this.phase === "back") {
        if (!this.backFrom) this.backFrom = [R.sx, R.sz];
        const k = ease(this.pt / 1.4), f = this.backFrom, a0 = o.arc[0]; R.tilt = mix(-125 * D2R, 0, k); R.sy = mix(o.dumpY, o.idleY, k); R.sx = mix(f[0], o.cx + Math.cos(a0) * o.arcR, k); R.sz = mix(f[1], o.cz + Math.sin(a0) * o.arcR, k);
        if (this.pt >= 1.4) { this.backFrom = null; this.scoops--; this.events.push({ e: "checkpoint" }); if (this.scoops > 0) { R.mode = "swing"; R.swingT = 0; this.go("swing"); } else this.go("watch"); }
      } else if (this.phase === "watch") { if (this.pt > 4.5) this.finish(); }
    }
    finish() { if (this.done) return; this.done = true; this.phase = "done"; if (this.type === "claw" || this.type === "ring") this.rig.mode = "rest"; this.events.push({ e: "done", got: this.got.length }); }
    // 台の うえに ある 景品（絵と テスト用）
    list() { return this.bodies.filter((b) => b.alive); }
  }
  // ローカルの 点 → world（L は 形の 原点から）
  const toWorld = (W, b, L) => { const c = W.centroid(b), o = b.data.org || [0, 0, 0], R = CP.qmat(b.q), x = L[0] + o[0], y = L[1] + o[1], z = L[2] + o[2]; return [c[0] + R[0][0] * x + R[1][0] * y + R[2][0] * z, c[1] + R[0][1] * x + R[1][1] * y + R[2][1] * z, c[2] + R[0][2] * x + R[1][2] * y + R[2][2] * z]; };
  return { DEFS, SHAPES, ClawRig, TrypodRig, SweetRig, CraneRound, rng, toWorld, DT };
})();
