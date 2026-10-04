// ナンプレ（数独）の きまりと 解き方（パズル こうぼう・UI-81。オーナーの 依頼 2026-10-04「パズルはナンプレ」「完全に大人向け」）。
// 9×9 の マスに 1〜9 を 入れる。たて・よこの 列と 太い 線の 3×3 の ブロックに、1〜9 が 1つずつ。
// マスの 番号は i = 行 × 9 + 列（0〜80）。問題は 81もじの 文字列（"." か "0" が あき）。
//  ・count: 解の かず（limit まで。ビットマスクで 候補の すくない マスから ためす）。solve は 1つめの 解
//  ・grade: 人の 解き方（TECHS の 1〜11）だけで といて、つかった いちばん むずかしい 解き方を かえす。とけなければ solved = false
//  ・nextStep: ヒント用の つぎの 1て（ブロック・行・列の 唯一 → 候補が 1つ）
//  ・transform: 数字の いれかえ・おなじ バンドの 行・バンド・おなじ スタックの 列・スタック・てんち（解の かずも むずかしさも かわらない）
// 問題の たば（js/numpla-data.js）は tools/build-numpla.mjs が この ファイルで つくって たしかめる。ゲームの 画面は js/mg-numpla.js
const NumplaRules = (() => {
  const ROW = new Int8Array(81), COL = new Int8Array(81), BOX = new Int8Array(81);
  for (let i = 0; i < 81; i++) { ROW[i] = (i / 9) | 0; COL[i] = i % 9; BOX[i] = ((ROW[i] / 3) | 0) * 3 + ((COL[i] / 3) | 0); }
  // 0〜8 行・9〜17 列・18〜26 ブロック
  const UNITS = [];
  for (let k = 0; k < 9; k++) UNITS.push(Array.from({ length: 9 }, (_, j) => k * 9 + j));
  for (let k = 0; k < 9; k++) UNITS.push(Array.from({ length: 9 }, (_, j) => j * 9 + k));
  for (let k = 0; k < 9; k++) { const r0 = ((k / 3) | 0) * 3, c0 = (k % 3) * 3; UNITS.push(Array.from({ length: 9 }, (_, j) => (r0 + ((j / 3) | 0)) * 9 + c0 + (j % 3))); }
  const UNITS_OF = Array.from({ length: 81 }, (_, i) => [ROW[i], 9 + COL[i], 18 + BOX[i]]);
  const PEERS = Array.from({ length: 81 }, (_, i) => { const s = new Set(); for (const u of UNITS_OF[i]) for (const j of UNITS[u]) if (j !== i) s.add(j); return [...s]; });
  const PEER_SET = PEERS.map((p) => new Set(p));
  const ALL = 0x3fe; // 1〜9 の ビット
  const BITS = new Int8Array(1024), ONE = new Int8Array(1024);
  for (let m = 0; m < 1024; m++) { let n = 0, d = 0; for (let k = 1; k <= 9; k++) if (m & (1 << k)) { n++; d = k; } BITS[m] = n; ONE[m] = n === 1 ? d : 0; }
  const digitsOf = (m) => { const o = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) o.push(d); return o; };
  // 人の 解き方（むずかしい じゅん）。lv は grade の max と おなじ 番号
  const TECHS = [null,
    { id: "hidden_box", name: "ブロック内の唯一" }, { id: "hidden_line", name: "行・列の唯一" }, { id: "naked_single", name: "候補が1つ" },
    { id: "locked", name: "ロックされた候補" }, { id: "naked_pair", name: "ネイキッドペア" }, { id: "hidden_pair", name: "隠れペア" },
    { id: "naked_triple", name: "ネイキッドトリプル" }, { id: "hidden_triple", name: "隠れトリプル" },
    { id: "xwing", name: "X-Wing" }, { id: "xywing", name: "XY-Wing" }, { id: "swordfish", name: "ソードフィッシュ" }];

  // むずかしさ（問題の たば js/numpla-data.js の わけかた）: givens は はじめから ある 数字の かず・tech は いちばん むずかしい 解き方の はんい
  const LEVELS = [
    { id: "easy", name: "初級", givens: [36, 40], tech: [1, 2], note: "ブロック・行・列で 入る ところが 1つ だけの マスを さがせば とける" },
    { id: "normal", name: "中級", givens: [29, 33], tech: [3, 4], note: "候補を しぼる（候補が 1つ・ロックされた 候補）" },
    { id: "hard", name: "上級", givens: [22, 31], tech: [5, 8], note: "ペア・トリプルで 候補を けす" },
    { id: "expert", name: "超上級", givens: [20, 31], tech: [9, 11], note: "X-Wing・XY-Wing・ソードフィッシュ が いる" },
  ];
  function parse(s) { const g = new Array(81); for (let i = 0; i < 81; i++) { const ch = s[i]; g[i] = ch >= "1" && ch <= "9" ? ch.charCodeAt(0) - 48 : 0; } return g; }
  function format(g) { let s = ""; for (let i = 0; i < 81; i++) s += g[i] ? String(g[i]) : "."; return s; }
  const givens = (s) => { let n = 0; for (let i = 0; i < 81; i++) if (s[i] >= "1" && s[i] <= "9") n++; return n; };
  // おなじ 列・ブロックに おなじ 数字が ないか
  function valid(g) { for (let i = 0; i < 81; i++) if (g[i]) for (const j of PEERS[i]) if (g[j] === g[i]) return false; return true; }
  // 候補（まわりと ぶつからない 数字）の ビット
  function candidates(g) {
    const c = new Array(81).fill(0);
    for (let i = 0; i < 81; i++) { if (g[i]) continue; let m = ALL; for (const j of PEERS[i]) if (g[j]) m &= ~(1 << g[j]); c[i] = m; }
    return c;
  }

  // 解の かず（limit で とめる）。order を わたすと その じゅんで 数字を ためす（すきまの ない 盤を つくる とき）
  function count(g0, limit = 2, order = null) {
    const g = g0.slice(), rm = new Int16Array(9), cm = new Int16Array(9), bm = new Int16Array(9), empties = [];
    for (let i = 0; i < 81; i++) {
      const v = g[i];
      if (!v) { empties.push(i); continue; }
      const b = 1 << v;
      if ((rm[ROW[i]] | cm[COL[i]] | bm[BOX[i]]) & b) return { n: 0, sol: null };
      rm[ROW[i]] |= b; cm[COL[i]] |= b; bm[BOX[i]] |= b;
    }
    let n = 0, sol = null;
    const rec = (k) => {
      if (k === empties.length) { n++; if (!sol) sol = g.slice(); return n >= limit; }
      let best = k, bestM = 0, bestN = 10;
      for (let t = k; t < empties.length; t++) {
        const i = empties[t], m = ALL & ~(rm[ROW[i]] | cm[COL[i]] | bm[BOX[i]]), c = BITS[m];
        if (c < bestN) { bestN = c; best = t; bestM = m; if (c <= 1) break; }
      }
      if (!bestN) return false;
      const tmp = empties[k]; empties[k] = empties[best]; empties[best] = tmp;
      const i = empties[k], r = ROW[i], c = COL[i], b = BOX[i], ds = order || [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (const d of ds) {
        const bit = 1 << d;
        if (!(bestM & bit)) continue;
        g[i] = d; rm[r] |= bit; cm[c] |= bit; bm[b] |= bit;
        if (rec(k + 1)) return true;
        rm[r] &= ~bit; cm[c] &= ~bit; bm[b] &= ~bit;
      }
      g[i] = 0; empties[best] = empties[k]; empties[k] = tmp;
      return false;
    };
    rec(0);
    return { n, sol };
  }
  const solve = (g) => count(g, 1).sol;

  // ---- 人の 解き方 ----
  // c は 候補の ビット（あきマスだけ）。どの 関数も 1て すすめたら true
  function makeSolver(g0) {
    const g = g0.slice(), c = candidates(g);
    let left = 0; for (let i = 0; i < 81; i++) if (!g[i]) left++;
    const S = { g, c, get left() { return left; }, broken: false };
    const place = (i, d) => { g[i] = d; c[i] = 0; left--; const b = 1 << d; for (const j of PEERS[i]) c[j] &= ~b; };
    const cut = (i, mask) => { if (!g[i] && c[i] & mask) { c[i] &= ~mask; if (!c[i]) S.broken = true; return true; } return false; };
    // ユニットの 中で 数字 d が 入れる マス
    const spots = (u, d) => { const b = 1 << d, o = []; for (const i of UNITS[u]) if (!g[i] && c[i] & b) o.push(i); return o; };
    const has = (u, d) => UNITS[u].some((i) => g[i] === d);
    const hidden = (from, to) => {
      for (let u = from; u < to; u++) for (let d = 1; d <= 9; d++) { if (has(u, d)) continue; const s = spots(u, d); if (s.length === 1) { S.last = { i: s[0], d, u }; place(s[0], d); return true; } }
      return false;
    };
    const T = [null,
      () => hidden(18, 27),
      () => hidden(0, 18),
      () => { for (let i = 0; i < 81; i++) if (!g[i] && ONE[c[i]]) { S.last = { i, d: ONE[c[i]] }; place(i, ONE[c[i]]); return true; } return false; },
      // ロックされた 候補: ブロックの 中で 1つの 行（列）に かたまる → その 行（列）の ほかから けす。行（列）の 中で 1つの ブロックに かたまる → ブロックの ほかから けす
      () => {
        for (let u = 0; u < 27; u++) for (let d = 1; d <= 9; d++) {
          const s = spots(u, d);
          if (s.length < 2 || s.length > 3) continue;
          const b = 1 << d;
          if (u >= 18) {
            for (const [key, base] of [[ROW, 0], [COL, 9]]) {
              if (!s.every((i) => key[i] === key[s[0]])) continue;
              let any = false; for (const j of UNITS[base + key[s[0]]]) if (BOX[j] !== u - 18) any = cut(j, b) || any;
              if (any) return true;
            }
          } else if (s.every((i) => BOX[i] === BOX[s[0]])) {
            let any = false; for (const j of UNITS[18 + BOX[s[0]]]) if (!s.includes(j) && (u < 9 ? ROW[j] !== u : COL[j] !== u - 9)) any = cut(j, b) || any;
            if (any) return true;
          }
        }
        return false;
      },
      () => nakedSet(2), () => hiddenSet(2), () => nakedSet(3), () => hiddenSet(3),
      () => fish(2), () => xyWing(), () => fish(3),
    ];
    // ネイキッド（n マスの 候補を あわせて n こ）: おなじ ユニットの ほかの マスから けす
    function nakedSet(n) {
      for (let u = 0; u < 27; u++) {
        const cells = UNITS[u].filter((i) => !g[i] && BITS[c[i]] >= 2 && BITS[c[i]] <= n);
        const pick = (start, chosen, mask) => {
          if (chosen.length === n) {
            if (BITS[mask] !== n) return false;
            let any = false; for (const j of UNITS[u]) if (!g[j] && !chosen.includes(j)) any = cut(j, mask) || any;
            return any;
          }
          for (let t = start; t < cells.length; t++) { const m = mask | c[cells[t]]; if (BITS[m] > n) continue; if (pick(t + 1, [...chosen, cells[t]], m)) return true; }
          return false;
        };
        if (pick(0, [], 0)) return true;
      }
      return false;
    }
    // 隠れ（n この 数字が おなじ n マスにしか 入れない）: その マスの ほかの 候補を けす
    function hiddenSet(n) {
      for (let u = 0; u < 27; u++) {
        const ds = [];
        for (let d = 1; d <= 9; d++) { if (has(u, d)) continue; const s = spots(u, d); if (s.length >= 2 && s.length <= n) ds.push([d, s]); }
        const pick = (start, chosen, cells) => {
          if (chosen.length === n) {
            if (cells.size !== n) return false;
            let mask = 0; for (const [d] of chosen) mask |= 1 << d;
            let any = false; for (const i of cells) any = cut(i, ALL & ~mask) || any;
            return any;
          }
          for (let t = start; t < ds.length; t++) { const nc = new Set([...cells, ...ds[t][1]]); if (nc.size > n) continue; if (pick(t + 1, [...chosen, ds[t]], nc)) return true; }
          return false;
        };
        if (pick(0, [], new Set())) return true;
      }
      return false;
    }
    // X-Wing（n=2）・ソードフィッシュ（n=3）: 行（列）の n 本で 数字 d が おなじ n 列（行）にしか ない → その 列（行）の ほかから けす
    function fish(n) {
      for (let d = 1; d <= 9; d++) {
        const b = 1 << d;
        for (const [base, other] of [[0, 9], [9, 0]]) {
          const lines = [];
          for (let k = 0; k < 9; k++) { if (has(base + k, d)) continue; const s = spots(base + k, d); if (s.length >= 2 && s.length <= n) lines.push([k, new Set(s.map((i) => (base ? ROW[i] : COL[i])))]); }
          const pick = (start, chosen, cover) => {
            if (chosen.length === n) {
              if (cover.size !== n) return false;
              const keep = new Set(chosen.map((x) => x[0]));
              let any = false;
              for (const k2 of cover) for (const j of UNITS[other + k2]) if (!keep.has(base ? COL[j] : ROW[j])) any = cut(j, b) || any;
              return any;
            }
            for (let t = start; t < lines.length; t++) { const nc = new Set([...cover, ...lines[t][1]]); if (nc.size > n) continue; if (pick(t + 1, [...chosen, lines[t]], nc)) return true; }
            return false;
          };
          if (pick(0, [], new Set())) return true;
        }
      }
      return false;
    }
    // XY-Wing: 候補 {x,y} の マスと、それに みえる {x,z}・{y,z} の 2マス → 2マスの どちらにも みえる マスから z を けす
    function xyWing() {
      for (let p = 0; p < 81; p++) {
        if (g[p] || BITS[c[p]] !== 2) continue;
        const [x, y] = digitsOf(c[p]);
        const wings = PEERS[p].filter((j) => !g[j] && BITS[c[j]] === 2 && c[j] !== c[p] && BITS[c[j] & c[p]] === 1);
        for (const a of wings) for (const b2 of wings) {
          if (a >= b2) continue;
          const za = c[a] & ~c[p], zb = c[b2] & ~c[p];
          if (za !== zb || BITS[za] !== 1) continue;
          if (((c[a] & c[p]) | (c[b2] & c[p])) !== ((1 << x) | (1 << y))) continue;
          let any = false;
          for (const j of PEERS[a]) if (j !== p && j !== b2 && PEER_SET[b2].has(j)) any = cut(j, za) || any;
          if (any) return true;
        }
      }
      return false;
    }
    S.step = (maxTech = 11) => { for (let t = 1; t <= maxTech; t++) if (T[t]()) return t; return 0; };
    return S;
  }
  // 人の 解き方だけで とく。max: つかった いちばん むずかしい 解き方・used: 解き方ごとの かず
  function grade(g0, maxTech = 11) {
    const S = makeSolver(g0), used = new Array(TECHS.length).fill(0);
    let max = 0, steps = 0;
    while (S.left > 0 && !S.broken) {
      const t = S.step(maxTech);
      if (!t) break;
      used[t]++; steps++; if (t > max) max = t;
    }
    return { solved: S.left === 0 && !S.broken && valid(S.g), max, used, steps, grid: S.g };
  }
  // ヒント: いまの 盤（あき = 0）で つぎに 入る ところ。how は box・row・col・cell
  function nextStep(g0) {
    const S = makeSolver(g0);
    for (const [t, how] of [[1, "box"], [2, "line"], [3, "cell"]]) {
      const before = S.g.slice();
      if (S.step(t) === t) {
        const i = S.g.findIndex((v, k) => v !== before[k]);
        if (i >= 0) return { i, d: S.g[i], how: how === "line" ? (S.last && S.last.u < 9 ? "row" : "col") : how };
      }
    }
    return null;
  }
  // おなじ むずかしさの まま すがたを かえる（rnd は 0〜1 の 乱数）
  function transform(s, rnd = Math.random) {
    const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    const dig = [0, ...sh([1, 2, 3, 4, 5, 6, 7, 8, 9])];
    const rows = sh([0, 1, 2]).flatMap((b) => sh([0, 1, 2]).map((r) => b * 3 + r)), cols = sh([0, 1, 2]).flatMap((b) => sh([0, 1, 2]).map((k) => b * 3 + k));
    const tr = rnd() < 0.5, g = parse(s), out = new Array(81);
    for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) { const src = tr ? cols[k] * 9 + rows[r] : rows[r] * 9 + cols[k]; out[r * 9 + k] = g[src] ? dig[g[src]] : 0; }
    return format(out);
  }
  // 問題が その むずかしさに あうか（tools/build-numpla.mjs・tools/check-numpla.mjs）
  function fits(s, lv) {
    const L = LEVELS.find((x) => x.id === lv), n = givens(s);
    if (!L || n < L.givens[0] || n > L.givens[1]) return false;
    const g = parse(s);
    if (count(g, 2).n !== 1) return false;
    const r = grade(g);
    return r.solved && r.max >= L.tech[0] && r.max <= L.tech[1];
  }
  return { ROW, COL, BOX, UNITS, PEERS, ALL, BITS, TECHS, LEVELS, fits, digitsOf, parse, format, givens, valid, candidates, count, solve, grade, nextStep, transform };
})();
