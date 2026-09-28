// 描画・時計・セーブに依存しないスコアアタック。実ゲームとバランス検証で同じルールを使う。
const PUZZLE_RULES = Object.freeze({ size: 6, fee: 80, startTime: 45, maxTime: 65, maxElapsed: 180, comboWindow: 3.5 });
const PUZZLE_SHAPES = Object.freeze({ chain: "チェイン", line: "ライン", elbow: "クロス", loop: "カラーリング", nova: "スター" });

class NakayoshiPuzzle {
  constructor(seed = Date.now(), saved = null) {
    this.s = saved ? JSON.parse(JSON.stringify(saved)) : {
      rng: (seed >>> 0) || 1, board: [], score: 0, remaining: PUZZLE_RULES.startTime, elapsed: 0,
      combo: 0, comboLeft: 0, bestCombo: 0, charge: 0, fever: 0, lastShape: null,
      moves: 0, cleared: 0, extended: 0, shuffles: 0, cooldown: 0, shapes: { line: 0, elbow: 0, loop: 0, nova: 0 }, done: false,
    };
    if (!saved) { this.s.board = Array.from({ length: 36 }, () => this.color()); this.ensureMove(); }
  }
  random() { let x = this.s.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s.rng = x >>> 0; return this.s.rng / 4294967296; }
  get stage() { return Math.min(5, Math.floor(this.s.elapsed / 30)); }
  get types() { return this.s.elapsed < 45 ? 4 : this.s.elapsed < 90 ? 5 : 6; }
  get drain() { return 1 + this.stage * .28; }
  color() { return Math.floor(this.random() * this.types); }
  adjacent(a, b) { return Math.abs(a % 6 - b % 6) + Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) === 1; }
  around(i) { return [i - 6, i - 1, i + 1, i + 6].filter(j => j >= 0 && j < 36 && this.adjacent(i, j)); }
  findMove() {
    const b = this.s.board;
    for (let a = 0; a < 36; a++) for (const c of this.around(a)) if (b[a] === b[c])
      for (const d of this.around(c)) if (d !== a && b[d] === b[a]) return [a, c, d];
    return null;
  }
  mix() { const b = this.s.board; for (let i = 35; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } }
  ensureMove() {
    if (this.findMove()) return false;
    for (let i = 0; i < 24; i++) { this.mix(); if (this.findMove()) return true; }
    // 偏った盤面でも必ず続行できる。通常のリシャッフルは既存の色数を保つ。
    const a = Math.floor(this.random() * 6) * 6, c = this.color(); this.s.board[a] = this.s.board[a + 1] = this.s.board[a + 2] = c;
    return true;
  }
  preview(path) {
    if (!Array.isArray(path) || path.length < 3 || path.length > 37) return null;
    const closed = path.length >= 5 && path[0] === path[path.length - 1], p = closed ? path.slice(0, -1) : path;
    if (p.length < 3 || new Set(p).size !== p.length || p.some(i => !Number.isInteger(i) || i < 0 || i >= 36 || this.s.board[i] !== this.s.board[p[0]])) return null;
    if (path.slice(1).some((i, j) => !this.adjacent(path[j], i))) return null;
    const n = p.length, directions = p.slice(1).map((i, j) => i - p[j]), turns = [];
    for (let i = 1; i < directions.length; i++) if (directions[i] !== directions[i - 1]) turns.push(i);
    const shape = closed ? "loop" : n >= 4 && turns.length === 0 ? "line" : n >= 5 && turns.length === 1 && turns[0] >= 2 && directions.length - turns[0] >= 2 ? "elbow" : n >= 7 ? "nova" : "chain";
    const clear = new Set(p), last = p[n - 1];
    if (shape === "loop") this.s.board.forEach((v, i) => { if (v === this.s.board[p[0]]) clear.add(i); });
    if (shape === "line") for (let i = 0; i < 36; i++) if (directions[0] % 6 === 0 ? i % 6 === p[0] % 6 : Math.floor(i / 6) === Math.floor(p[0] / 6)) clear.add(i);
    if (shape === "elbow") { const pivot = p[turns[0]]; for (let i = 0; i < 36; i++) if (i % 6 === pivot % 6 || Math.floor(i / 6) === Math.floor(pivot / 6)) clear.add(i); }
    if (shape === "nova") for (let i = 0; i < 36; i++) if (Math.abs(i % 6 - last % 6) <= 1 && Math.abs(Math.floor(i / 6) - Math.floor(last / 6)) <= 1) clear.add(i);
    const combo = this.s.comboLeft > 0 ? this.s.combo + 1 : 1, multiplier = 1 + Math.min(10, combo - 1) * .12;
    const bonus = { chain: 0, line: 80, elbow: 130, loop: 140, nova: 150 }[shape];
    const points = Math.round((n * n * 7 + clear.size * 20 + bonus) * multiplier * (this.s.fever > 0 ? 1.6 : 1));
    const seconds = Math.min(5, (n - 2) * .45 + { chain: 0, line: 1.4, elbow: 1.8, loop: 2, nova: 2.2 }[shape]) * Math.pow(.86, this.stage);
    return { shape, clear: [...clear], n, points, seconds, combo, multiplier, closed };
  }
  advance(seconds) {
    if (this.s.done || !Number.isFinite(seconds) || seconds <= 0) return;
    // 段階の境界をまたいでも、フレーム数や端末速度で結果が変わらない。
    while (seconds > 1e-8 && !this.s.done) {
      const nextStage = (Math.floor(this.s.elapsed / 30) + 1) * 30;
      const dt = Math.min(seconds, nextStage - this.s.elapsed, PUZZLE_RULES.maxElapsed - this.s.elapsed, this.s.remaining / this.drain);
      this.s.remaining = Math.max(0, this.s.remaining - dt * this.drain); this.s.elapsed += dt; seconds -= dt;
      for (const k of ["comboLeft", "fever", "cooldown"]) this.s[k] = Math.max(0, this.s[k] - dt);
      if (this.s.comboLeft === 0) this.s.combo = 0;
      if (this.s.remaining < 1e-7 || this.s.elapsed >= PUZZLE_RULES.maxElapsed - 1e-7) this.s.done = true;
    }
  }
  play(path) {
    if (this.s.done || this.s.cooldown > 0) return null;
    const r = this.preview(path); if (!r) return null;
    const s = this.s, clear = new Set(r.clear);
    s.score += r.points; s.combo = r.combo; s.comboLeft = PUZZLE_RULES.comboWindow; s.bestCombo = Math.max(s.bestCombo, s.combo);
    r.added = Math.min(PUZZLE_RULES.maxTime - s.remaining, r.seconds); s.remaining += r.added; s.extended += r.added;
    s.moves++; s.cleared += clear.size; s.cooldown = .22;
    if (r.shape !== "chain") {
      s.shapes[r.shape]++; s.charge += s.lastShape && s.lastShape !== r.shape ? 2 : 1; s.lastShape = r.shape;
      if (s.charge >= 6 && s.fever === 0) { s.charge = 0; s.fever = 8; r.feverStarted = true; }
    }
    for (let x = 0; x < 6; x++) {
      const keep = []; for (let y = 5; y >= 0; y--) if (!clear.has(y * 6 + x)) keep.push(s.board[y * 6 + x]);
      for (let y = 5; y >= 0; y--) s.board[y * 6 + x] = keep[5 - y] ?? this.color();
    }
    r.reshuffled = this.ensureMove(); return r;
  }
  shuffle() {
    if (this.s.done || this.s.cooldown > 0 || this.s.remaining <= 5 || this.s.shuffles >= 3) return false;
    this.s.remaining -= 5; this.s.shuffles++; this.s.combo = this.s.comboLeft = 0;
    this.mix(); this.ensureMove(); this.s.cooldown = .22; return true;
  }
  snapshot() { return JSON.parse(JSON.stringify(this.s)); }
}
