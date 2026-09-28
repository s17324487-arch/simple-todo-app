// 共通ユーティリティ
const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  // 決定的な疑似乱数（タイルの模様ゆらぎ用）
  hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  },
  ease: {
    outBack: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  },
  // 角丸矩形のパス
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === "style") e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of [].concat(children)) if (c != null) e.append(c);
    return e;
  },
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  fmt: (n) => Math.floor(n).toLocaleString("ja-JP"),
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },
  // 0..24 の時刻（小数）
  hourNow() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  },
  svgUrl: (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
  // 時間の くぎり（会話の 条件 time）: morning 5–10時／day 10–16／evening 16–19／night 19–23／late 23–5
  dayPart(h = U.hourNow()) { return h >= 5 && h < 10 ? "morning" : h >= 10 && h < 16 ? "day" : h >= 16 && h < 19 ? "evening" : h >= 19 && h < 23 ? "night" : "late"; },
  // 会話の 条件（① おうちの 会話・② 町の人 で 共通）。when の 同じ キーの 中は「どれか」、ちがう キーは「ぜんぶ」。
  // あわなければ -1、あえば あった キーの 数（feature は 数えない）。c の 値は 配列でも よい（近くの 家具・できごと など）
  condScore(when, c) {
    let n = 0;
    for (const k in when || {}) {
      const vals = when[k];
      let ok;
      if (k === "feature") ok = vals.every((v) => (v[0] === "!" ? !(c.feature || {})[v.slice(1)] : !!(c.feature || {})[v]));
      else if (k === "bond") ok = vals.every((v) => (c.bond || 0) >= +v);
      else { const have = [].concat(c[k] == null ? [] : c[k]); ok = vals.some((v) => have.includes(v)); }
      if (!ok) return -1;
      if (k !== "feature") n++;
    }
    return n;
  },
  // 条件に あう ものから 1つ。重み = 1 + 2 ×（あった キーの 数）。recent（id の 配列）に ある ものは なるべく さける
  condPick(list, c, recent = [], rand = Math.random) {
    let cand = [];
    for (const l of list) { const s = this.condScore(l.when, c); if (s >= 0) cand.push([l, 1 + 2 * s]); }
    const fresh = cand.filter(([l]) => !recent.includes(l.id));
    if (fresh.length) cand = fresh;
    if (!cand.length) return null;
    let r = rand() * cand.reduce((a, [, w]) => a + w, 0);
    for (const [l, w] of cand) { r -= w; if (r < 0) return l; }
    return cand[cand.length - 1][0];
  },
};

// SVG文字列 → canvas（端末ピクセル）のキャッシュ。家具・敵・NPC・アイコンで共用
const SvgCache = {
  map: new Map(),
  pending: new Map(),
  get(key, svgFn, pw, ph) {
    const k = key + "@" + pw + "x" + ph;
    const hit = this.map.get(k);
    if (hit) {
      // よく使うものは後ろへ（LRU）
      if (this.map.size > 300) { this.map.delete(k); this.map.set(k, hit); }
      return hit;
    }
    if (!this.pending.has(k)) this.pending.set(k, this._load(k, svgFn, pw, ph));
    return null;
  },
  ensure(key, svgFn, pw, ph) {
    const k = key + "@" + pw + "x" + ph;
    if (this.map.has(k)) return Promise.resolve(this.map.get(k));
    if (!this.pending.has(k)) this.pending.set(k, this._load(k, svgFn, pw, ph));
    return this.pending.get(k);
  },
  _load(k, svgFn, pw, ph) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = pw; c.height = ph;
        c.getContext("2d").drawImage(img, 0, 0, pw, ph);
        this.map.set(k, c);
        // メモリを使いすぎないように古いものから捨てる
        if (this.map.size > 700) { let n = 0; for (const key of this.map.keys()) { this.map.delete(key); if (++n >= 150) break; } }
        this.pending.delete(k);
        resolve(c);
      };
      img.onerror = () => { this.pending.delete(k); console.warn("svg load failed", k); resolve(null); };
      img.src = U.svgUrl(svgFn());
    });
  },
  clear() { this.map.clear(); this.pending.clear(); },
};
