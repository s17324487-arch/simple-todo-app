// ころころ フルーツ（ネリカスタウンの おてつだい）の 物理。まるい 玉を 箱に おとし、おなじ もの どうしが ふれると 1つ 大きな ものに なる。
// 描画・セーブ・時計に 依存しない（Node の 検査でも おなじ 結果）。長さの 単位は 箱の はば = 100、時間は 秒。
// 玉は 位置で かさなりを なおす（小さな ステップを たくさん）→ 速さに もどす → はねかえり・まさつ・ころがり の じゅん。
// だんは 8しゅ: くだもの 5しゅ（さくらんぼ → いちご → みかん → りんご → なし）の つぎが がちゃん → わんこ → ごじ（3人の かおの 玉）。
// points: その だんの 2つが くっついた ときの 点（本物の スイカゲームと おなじ 三角数 1・3・6・10・15・21・28・36。ごじ どうしは きえて 36）
const KOROKORO_TIERS = Object.freeze([
  { id: "cherry", name: "さくらんぼ", r: 4.6 },
  { id: "strawberry", name: "いちご", r: 6.0 },
  { id: "mikan", name: "みかん", r: 7.7 },
  { id: "apple", name: "りんご", r: 10.0 },
  { id: "pear", name: "なし", r: 12.4 },
  { id: "gachan", name: "がちゃん", r: 15.4, hero: "gachan" },
  { id: "wanko", name: "わんこ", r: 19.0, hero: "wanko" },
  { id: "goji", name: "ごじ", r: 23.6, hero: "goji" },
].map((t, i) => Object.freeze({ ...t, tier: i, points: ((i + 1) * (i + 2)) / 2 })));

// W×H: 箱の なか・drop: おちてくる 小さい ほうから 4しゅ（8しゅの はんぶん。本物は 11しゅの うち 5しゅ）・g: じゅうりょく・e: はねかえり・mu: まさつ
// step: 物理の 1ステップ（1/480 びょう）・overSec: ふちより 上に この びょう いると あふれ（スコア モードは KorokoroWorld の overSec で みじかく）・growSec: がったいで 大きく なる じかん
// warn: ふちから この ちかさで あかい せん・cool: おとしてから つぎを もてるまで・depen: かさなりを なおす ときの はなれる はやさの 上限
const KOROKORO_RULES = Object.freeze({ W: 100, H: 110, drop: 4, g: 900, e: 0.12, mu: 0.3, step: 1 / 480, maxFrame: 1 / 15, vmax: 420, overSec: 2, growSec: 0.12, warn: 12, cool: 0.45, depen: 45 });

class KorokoroWorld {
  // o.overSec: あふれ までの びょう（スコア モードは ほぼ すぐ）
  constructor(seed = 1, o = {}) {
    this.W = KOROKORO_RULES.W; this.H = KOROKORO_RULES.H; this.overSec = o.overSec > 0 ? o.overSec : KOROKORO_RULES.overSec;
    this.bodies = []; this.contacts = []; this.touch = new Map();
    this.serial = 0; this.t = 0; this.acc = 0; this.rng = (seed >>> 0) || 1;
    this.floorOpen = false; this.danger = 0; this.topGap = this.H;
  }
  random() { let x = this.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rng = x >>> 0; return this.rng / 4294967296; }
  pickDrop() { return Math.floor(this.random() * KOROKORO_RULES.drop); }
  static radius(tier) { return KOROKORO_TIERS[tier].r; }
  add(tier, x, y, o = {}) {
    const R = KOROKORO_TIERS[tier].r, from = o.from != null ? KOROKORO_TIERS[o.from].r : R;
    const b = { id: ++this.serial, tier, x, y, px: x, py: y, vx: o.vx || 0, vy: o.vy || 0, ovx: 0, ovy: 0, a: o.a || 0, w: o.w || 0,
      r: from, R, r0: from, m: R * R, grow: from < R ? 0 : 1, age: 0, born: o.born || "drop", landed: !!o.landed, touched: !!o.landed, over: 0, rest: 0, hit: 0 };
    this.bodies.push(b); return b;
  }
  remove(list) { const gone = new Set(list); this.bodies = this.bodies.filter((b) => !gone.has(b)); }
  // 上の ふちより すこし 上から おとす（x は 箱の なかに おさめる）
  dropAt(tier, x, vy = 40) { const r = KOROKORO_TIERS[tier].r; return this.add(tier, this.clampX(tier, x), -r - 1.5, { vy }); }
  clampX(tier, x) { const r = KOROKORO_TIERS[tier].r; return Math.max(r, Math.min(this.W - r, Number.isFinite(x) ? x : this.W / 2)); }
  // まっすぐ おちたら どこで とまるか（おとす ばしょの めやす）。玉の 中心の y
  landingY(tier, x) {
    const r = KOROKORO_TIERS[tier].r; let y = this.H - r;
    for (const b of this.bodies) { const dx = Math.abs(b.x - x), rs = r + b.r; if (dx < rs) y = Math.min(y, b.y - Math.sqrt(rs * rs - dx * dx)); }
    return y;
  }
  // 1フレームぶん すすめる。できごと（がったい・ごじの はれつ）を かえす
  step(dt) {
    const events = [];
    if (!(dt > 0)) return events;
    const h = KOROKORO_RULES.step;
    this.acc = Math.min(this.acc + dt, KOROKORO_RULES.maxFrame);
    while (this.acc >= h - 1e-9) { this.sub(h); this.acc -= h; this.t += h; }
    this.merge(events);
    this.watch(dt, events);
    return events;
  }
  sub(h) {
    const B = this.bodies, n = B.length, R = KOROKORO_RULES, W = this.W, H = this.H, C = this.contacts;
    for (const b of B) {
      if (b.grow < 1) { b.grow = Math.min(1, b.grow + h / R.growSec); const k = 1 - (1 - b.grow) * (1 - b.grow); b.r = b.r0 + (b.R - b.r0) * k; }
      b.ovx = b.vx; b.ovy = b.vy;
      b.vy += R.g * h;
      b.px = b.x; b.py = b.y;
      b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
    }
    C.length = 0;
    // 玉どうし: かさなりを 重さ（面積）の ぎゃくの わりあいで おしもどす
    for (let i = 0; i < n; i++) {
      const a = B[i];
      for (let j = i + 1; j < n; j++) {
        const b = B[j], dx = b.x - a.x, dy = b.y - a.y, rs = a.r + b.r, rt = rs + 0.4;
        if (dx >= rt || dx <= -rt || dy >= rt || dy <= -rt) continue;
        const d2 = dx * dx + dy * dy;
        // おなじ もの どうしは すこしの すきまでも「ふれた」に する（よこに ならんで とまっても がったい）
        if (a.tier === b.tier && d2 < rt * rt) this.touch.set(a.id < b.id ? a.id * 65536 + b.id : b.id * 65536 + a.id, a.id < b.id ? [a, b] : [b, a]);
        if (d2 >= rs * rs) continue;
        const d = Math.sqrt(d2), nx = d > 1e-9 ? dx / d : 0, ny = d > 1e-9 ? dy / d : 1;
        const wa = 1 / a.m, wb = 1 / b.m, s = (rs - d) / (wa + wb);
        a.x -= nx * s * wa; a.y -= ny * s * wa; b.x += nx * s * wb; b.y += ny * s * wb;
        C.push({ a, b, nx, ny, s, vn0: (b.ovx - a.ovx) * nx + (b.ovy - a.ovy) * ny });
        if (a.landed || b.landed) a.landed = b.landed = true;
      }
    }
    // かべと ゆか（上は あいている）
    for (const b of B) {
      if (b.x - b.r < 0) { const pen = b.r - b.x; b.x = b.r; C.push({ a: null, b, nx: 1, ny: 0, s: pen * b.m, vn0: b.ovx }); }
      else if (b.x + b.r > W) { const pen = b.x + b.r - W; b.x = W - b.r; C.push({ a: null, b, nx: -1, ny: 0, s: pen * b.m, vn0: -b.ovx }); }
      if (!this.floorOpen && b.y + b.r > H) { const pen = b.y + b.r - H; b.y = H - b.r; C.push({ a: null, b, nx: 0, ny: -1, s: pen * b.m, vn0: -b.ovy }); b.landed = true; }
    }
    for (const b of B) { b.vx = (b.x - b.px) / h; b.vy = (b.y - b.py) / h; }
    // はねかえり（はやく ぶつかった ときだけ）・まさつ（ころがる 向きの まわる はやさも かえる）
    const vth = R.g * h * 6;
    for (const c of C) {
      const { a, b, nx, ny } = c, tx = -ny, ty = nx;
      if (a) {
        const wa = 1 / a.m, wb = 1 / b.m;
        const vax = a.vx - a.w * ny * a.r, vay = a.vy + a.w * nx * a.r;
        const vbx = b.vx + b.w * ny * b.r, vby = b.vy - b.w * nx * b.r;
        const rvx = vbx - vax, rvy = vby - vay, vn = rvx * nx + rvy * ny, vt = rvx * tx + rvy * ty;
        // かさなりを なおした ぶんで はじけ とばない ように、はなれる はやさは depen まで
        const J = c.vn0 < -vth ? (-R.e * c.vn0 - vn) / (wa + wb) : vn < 0 ? -vn / (wa + wb) : vn > R.depen ? (R.depen - vn) / (wa + wb) : 0;
        a.vx -= nx * J * wa; a.vy -= ny * J * wa; b.vx += nx * J * wb; b.vy += ny * J * wb;
        const lim = R.mu * (c.s / h + Math.abs(J)), Jt = Math.max(-lim, Math.min(lim, -vt / (3 * (wa + wb))));
        a.vx -= tx * Jt * wa; a.vy -= ty * Jt * wa; b.vx += tx * Jt * wb; b.vy += ty * Jt * wb;
        a.w -= (2 * Jt * wa) / a.r; b.w -= (2 * Jt * wb) / b.r;
        if (c.vn0 < -vth) { a.hit = Math.max(a.hit, -c.vn0); b.hit = Math.max(b.hit, -c.vn0); }
      } else {
        const wb = 1 / b.m, vcx = b.vx + b.w * ny * b.r, vcy = b.vy - b.w * nx * b.r;
        const vn = vcx * nx + vcy * ny, vt = vcx * tx + vcy * ty;
        const J = c.vn0 < -vth ? (-R.e * c.vn0 - vn) / wb : vn < 0 ? -vn / wb : vn > R.depen ? (R.depen - vn) / wb : 0;
        b.vx += nx * J * wb; b.vy += ny * J * wb;
        const lim = R.mu * (c.s / h + Math.abs(J)), Jt = Math.max(-lim, Math.min(lim, -vt / (3 * wb)));
        b.vx += tx * Jt * wb; b.vy += ty * Jt * wb; b.w -= (2 * Jt * wb) / b.r;
        if (c.vn0 < -vth) b.hit = Math.max(b.hit, -c.vn0);
      }
    }
    for (const b of B) {
      b.w *= 1 - 1.5 * h;
      const v2 = b.vx * b.vx + b.vy * b.vy;
      if (v2 > R.vmax * R.vmax) { const k = R.vmax / Math.sqrt(v2); b.vx *= k; b.vy *= k; }
    }
  }
  // ふれた おなじ もの どうしを 1つに（1つの 玉は 1フレームに 1かいだけ）。いちばん 大きい ごじ どうしは はじけて きえる
  // できごとの points は くっついた 2つの だんの 点・hero は できた 玉の 子（ごじ どうしは ごじ）
  merge(events) {
    if (!this.touch.size) return;
    const pairs = [...this.touch.entries()].sort((p, q) => p[0] - q[0]).map((p) => p[1]), used = new Set(), gone = [], last = KOROKORO_TIERS.length - 1;
    for (const [a, b] of pairs) {
      if (used.has(a) || used.has(b) || a.grow < 0.6 || b.grow < 0.6) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      if (dx * dx + dy * dy > (a.r + b.r + 2) ** 2) continue;
      used.add(a); used.add(b); gone.push(a, b);
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, points = KOROKORO_TIERS[a.tier].points;
      if (a.tier === last) { events.push({ type: "burst", tier: a.tier, x, y, points, hero: KOROKORO_TIERS[last].hero || null }); continue; }
      const nb = this.add(a.tier + 1, x, y, { from: a.tier, vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2, a: (a.a + b.a) / 2, born: "merge", landed: true });
      events.push({ type: "merge", tier: nb.tier, from: a.tier, x, y, body: nb, points, hero: KOROKORO_TIERS[nb.tier].hero || null });
    }
    this.touch.clear();
    if (gone.length) this.remove(gone);
  }
  // あふれ の みはり: ふちより 上に 玉の てっぺんが ある じかん。ねむり（しずかに している じかん）も ここで かぞえる
  watch(dt, events) {
    let danger = 0, gap = this.H;
    for (const b of this.bodies) {
      b.age += dt;
      if (b.landed && !b.touched) { b.touched = true; events.push({ type: "land", tier: b.tier, x: b.x, y: b.y, speed: b.hit }); }
      b.hit = Math.max(0, b.hit - dt * 900);
      const speed = Math.hypot(b.vx, b.vy);
      b.rest = speed < 6 && Math.abs(b.w) < 1.5 ? b.rest + dt : 0;
      if (b.landed && b.age > 0.4) {
        const top = b.y - b.r;
        b.over = top < 0 ? b.over + dt : Math.max(0, b.over - dt * 2);
        gap = Math.min(gap, top); danger = Math.max(danger, b.over);
      }
    }
    if (this.floorOpen) { const out = this.bodies.filter((b) => b.y - b.r > this.H + 8); if (out.length) this.remove(out); if (!this.bodies.length) this.floorOpen = false; danger = 0; }
    this.danger = danger; this.topGap = gap;
    if (!this.floorOpen && danger >= this.overSec) events.push({ type: "overflow" });
  }
  // あふれた ときは ゆかを ひらいて ぜんぶ おとす（ちゅうもん モード: つぎの ちゅうもんも つづけられる）
  spill() { this.floorOpen = true; for (const b of this.bodies) { b.over = 0; b.vy = Math.max(b.vy, 40); } }
  count(tier) { return this.bodies.reduce((n, b) => n + (b.tier === tier ? 1 : 0), 0); }
  ok() { return this.bodies.every((b) => [b.x, b.y, b.vx, b.vy, b.a, b.w].every(Number.isFinite)); }
}
