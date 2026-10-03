// UI-58: ネリカス でんき 10F の けいば ちゅうけい コーナー。ばけんの きまり（ほんものの 中央競馬の きまりを もとに・ゲームの コインで あそぶ）。
// ・しきべつ 8しゅ: たんしょう・ふくしょう・わくれん・うまれん・ワイド・うまたん・3れんぷく・3れんたん（WIN5 は 5レースに またがる ので つかわない）。
// ・はらいもどし りつ（うりあげの うち あたった 人に わける わりあい）: たんしょう・ふくしょう 80%／わくれん・うまれん・ワイド 77.5%／うまたん・3れんぷく 75%／3れんたん 72.5%。
// ・みんなの かけた コインを わける（パリミュチュエル）。あたりが 1つの しきべつは「うりあげ × りつ ÷ あたりの うりあげ」。
//   ふくしょう・ワイド（あたりが いくつも ある）は「（あたりの うりあげ ＋ はずれの うりあげ ÷ あたりの かず）× りつ ÷ あたりの うりあげ」。
//   100コイン あたりで 10コイン みまんは きりすて。100コインの ままに なる（もとがえし）ときは 110コイン（プラス10）。
//   だれも かって いない くみあわせが きたら、その しきべつを かった ぜんいんに 100コイン あたり 70コイン（とくべつ ばらい）。
// ・ふくしょうは 8とう いじょうで 3ちゃく まで・7とう いかは 2ちゃく まで（5とう いじょうで うる）。わくれんは 9とう いじょうで うる。
// ・わくばん: 8とう いかは 1とう 1わく（わく = うまばん）。9とう いじょうは そとの わくから 2とうずつ（16とうで ぜんぶ 2とう・17とうは 8わく、18とうは 7・8わくが 3とう）。
// ・ぼうしの いろ: 1わく しろ・2 くろ・3 あか・4 あお・5 きいろ・6 みどり・7 オレンジ・8 ピンク。
// ・ほんものの ばけんは 20さい みまんは かえない（競馬法 第28条）。ここでは ゲームの コインだけで あそぶ。
const KeibaRules = (() => {
  const UNIT = 100; // 1まい 100コイン（ほんものは 100円）
  // rate は せんぶんりつ（800 = 80.0%）。n は えらぶ かず・ord は じゅんばんが ある か
  const TYPES = [
    { id: "tan", name: "たんしょう", n: 1, ord: true, rate: 800, desc: "1ちゃくに なる うまを あてる" },
    { id: "fuku", name: "ふくしょう", n: 1, ord: false, rate: 800, multi: true, desc: "3ちゃく までに はいる うまを あてる（7とう いかの レースは 2ちゃく まで）" },
    { id: "waku", name: "わくれん", n: 2, ord: false, rate: 775, byWaku: true, minRun: 9, desc: "1ちゃくと 2ちゃくの わくの くみあわせ（じゅんばんは どちらでも）" },
    { id: "umaren", name: "うまれん", n: 2, ord: false, rate: 775, desc: "1ちゃくと 2ちゃくの うまの くみあわせ（じゅんばんは どちらでも）" },
    { id: "wide", name: "ワイド", n: 2, ord: false, rate: 775, multi: true, desc: "3ちゃく までに はいる 2とうの くみあわせ（あたりは 3つ）" },
    { id: "umatan", name: "うまたん", n: 2, ord: true, rate: 750, desc: "1ちゃくと 2ちゃくを じゅんばん どおりに" },
    { id: "trio", name: "3れんぷく", n: 3, ord: false, rate: 750, desc: "1〜3ちゃくの 3とうの くみあわせ（じゅんばんは どちらでも）" },
    { id: "tierce", name: "3れんたん", n: 3, ord: true, rate: 725, desc: "1〜3ちゃくを じゅんばん どおりに" },
  ];
  const BY = Object.fromEntries(TYPES.map((t) => [t.id, t]));
  const IDS = TYPES.map((t) => t.id);
  // わくの いろ（ぼうし・ゼッケンの わく）。t は もじの いろ
  const WAKU = [null,
    { c: "#FFFFFF", t: "#1F1D1B", name: "しろ" }, { c: "#33302D", t: "#FFFFFF", name: "くろ" }, { c: "#E5483F", t: "#FFFFFF", name: "あか" }, { c: "#3B7BD8", t: "#FFFFFF", name: "あお" },
    { c: "#F6D13B", t: "#1F1D1B", name: "きいろ" }, { c: "#3AA45A", t: "#FFFFFF", name: "みどり" }, { c: "#F2962C", t: "#1F1D1B", name: "オレンジ" }, { c: "#F49BC1", t: "#1F1D1B", name: "ピンク" }];

  // ---- わくばん ----
  const wakuCounts = (n) => {
    const c = Array(9).fill(0);
    if (n <= 8) { for (let i = 1; i <= n; i++) c[i] = 1; return c; }
    const base = Math.floor(n / 8), r = n % 8;
    for (let w = 1; w <= 8; w++) c[w] = base + (w > 8 - r ? 1 : 0);
    return c;
  };
  // w[うまばん] = わくばん（w[0] は つかわない）
  const wakuOf = (n) => { const c = wakuCounts(n), w = [0]; for (let k = 1; k <= 8; k++) for (let j = 0; j < c[k]; j++) w.push(k); return w; };
  const places = (n) => (n <= 7 ? 2 : 3);
  // うる か（うらない ときは わけを かえす）
  const sold = (t, n) => {
    if (t === "fuku" && n < 5) return "5とう いじょうの レースで うるよ";
    if (t === "waku" && n < BY.waku.minRun) return "わくれんは 9とう いじょうの レースで うるよ";
    if (BY[t].n > n) return "でる うまが すくないよ";
    return "";
  };

  // ---- くみあわせの なまえ（key）: たん "5"・うまたん "7>3"・うまれん "3-7"・3れんたん "4>1>9" ----
  const key = (t, sel) => { const T = BY[t], a = sel.slice(0, T.n).map(Number); if (!T.ord) a.sort((x, y) => x - y); return a.join(T.ord ? ">" : "-"); };
  const parse = (k) => k.split(/[->]/).map(Number);
  // あたりの key（order は ちゃくじゅんの うまばん。w は わくばん）
  const winners = (t, order, n, w) => {
    const [a, b, c] = order;
    if (t === "tan") return [String(a)];
    if (t === "fuku") return order.slice(0, places(n)).map(String);
    if (t === "waku") return [key("waku", [w[a], w[b]])];
    if (t === "umaren") return [key("umaren", [a, b])];
    if (t === "wide") return [key("wide", [a, b]), key("wide", [a, c]), key("wide", [b, c])];
    if (t === "umatan") return [a + ">" + b];
    if (t === "trio") return [key("trio", [a, b, c])];
    return [a + ">" + b + ">" + c];
  };
  // ありえる くみあわせ ぜんぶ
  const combos = (t, n, w = wakuOf(n)) => {
    const out = [], R = (k) => Array.from({ length: k }, (_, i) => i + 1);
    if (t === "tan" || t === "fuku") return R(n).map(String);
    if (t === "waku") { const c = wakuCounts(n); for (let a = 1; a <= 8; a++) for (let b = a; b <= 8; b++) if (c[a] && c[b] && (a !== b || c[a] >= 2)) out.push(a + "-" + b); return out; }
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) {
      if (i === j) continue;
      if (BY[t].n === 2) { if (BY[t].ord || i < j) out.push(BY[t].ord ? i + ">" + j : i + "-" + j); continue; }
      for (let k = 1; k <= n; k++) { if (k === i || k === j) continue; if (BY[t].ord) out.push(i + ">" + j + ">" + k); else if (i < j && j < k) out.push(i + "-" + j + "-" + k); }
    }
    return out;
  };
  // かいかた: "one"（ふつう。たん・ふく は えらんだ うま 1とうずつ・ほかは 1てん）・"box"（えらんだ うまの くみあわせ ぜんぶ）
  const expand = (t, sel, method, n) => {
    const T = BY[t], uniq = [...new Set((sel || []).map(Number))];
    const okHorse = (h) => Number.isInteger(h) && h >= 1 && h <= n;
    if (T.byWaku) {
      const c = wakuCounts(n), [a, b] = (sel || []).map(Number);
      if (method !== "one" || !(a >= 1 && a <= 8 && b >= 1 && b <= 8 && c[a] && c[b]) || (a === b && c[a] < 2)) return [];
      return [key(t, [a, b])];
    }
    if (!uniq.every(okHorse)) return [];
    if (T.n === 1) return method === "one" ? uniq.map(String) : [];
    if (method === "one") { const s = (sel || []).map(Number); if (s.length !== T.n || new Set(s).size !== T.n || !s.every(okHorse)) return []; return [key(t, s)]; }
    if (method !== "box" || uniq.length < T.n) return [];
    const s = uniq.sort((x, y) => x - y), out = new Set();
    for (const i of s) for (const j of s) {
      if (i === j) continue;
      if (T.n === 2) { out.add(key(t, [i, j])); continue; }
      for (const k of s) if (k !== i && k !== j) out.add(key(t, [i, j, k]));
    }
    return [...out];
  };
  // ボックスの てんすう
  const boxCount = (t, k) => { const T = BY[t]; if (T.n === 1 || T.byWaku || k < T.n) return 0; if (T.n === 2) return T.ord ? k * (k - 1) : (k * (k - 1)) / 2; return T.ord ? k * (k - 1) * (k - 2) : (k * (k - 1) * (k - 2)) / 6; };

  // ---- はらいもどし（100コイン あたり）----
  // わりざん（せいすうの きりすて。おおきな かずでも ずれない）
  const idiv = (a, b) => { let q = Math.floor(a / b); while (q * b > a) q--; while ((q + 1) * b <= a) q++; return q; };
  const plus10 = (x) => (x <= 100 ? 110 : x); // 100コインの まま（もとがえし）や それより したは 110コイン
  // votes: Map（key → まいすう）・wins: あたりの key。かえす もの: { per: Map（あたりの key → 100コイン あたり）, toku: とくべつ ばらい, total: うりあげ（まい）}
  const settle = (t, votes, wins) => {
    const T = BY[t]; let total = 0; for (const v of votes.values()) total += v;
    const Y = total * UNIT, ws = wins.map((k) => votes.get(k) || 0), per = new Map();
    if (!ws.some((v) => v > 0)) { for (const k of wins) per.set(k, 70); return { per, toku: true, total }; }
    if (wins.length === 1) { per.set(wins[0], plus10(idiv(Y * T.rate, 100 * ws[0] * UNIT) * 10)); return { per, toku: false, total }; }
    const hit = ws.filter((v) => v > 0), P = hit.length, D = Y - hit.reduce((a, v) => a + v, 0) * UNIT;
    wins.forEach((k, i) => { const W = ws[i] * UNIT; if (W > 0) per.set(k, plus10(idiv((W * P + D) * T.rate, 100 * P * W) * 10)); });
    return { per, toku: false, total };
  };
  // いまの オッズ（ばい・0.1 たんい）。1つ あたりの しきべつだけ
  const odds = (t, votes, k, total) => { const W = votes.get(k) || 0; if (!W) return null; return Math.max(1.1, plus10(idiv(total * UNIT * BY[t].rate, 100 * W * UNIT) * 10) / 100); };
  // ふくしょう・ワイドの オッズの はば（ほかの あたりが いちばん うれて いる とき〜いちばん うれて いない とき）
  const range = (t, votes, k, total, n) => {
    const W = votes.get(k) || 0; if (!W) return null;
    const P = t === "fuku" ? places(n) : 3, cand = [];
    const calc = (others) => { const hit = [W, ...others.filter((v) => v > 0)], D = total - hit.reduce((a, v) => a + v, 0); return plus10(idiv((W * hit.length + D) * BY[t].rate, 100 * hit.length * W) * 10) / 100; };
    if (t === "fuku") {
      const h = Number(k), other = []; for (let i = 1; i <= n; i++) if (i !== h) other.push(votes.get(String(i)) || 0);
      other.sort((a, b) => b - a); const m = P - 1;
      cand.push(calc(other.slice(0, m)), calc(other.slice(-m)));
    } else {
      const [i, j] = parse(k);
      for (let x = 1; x <= n; x++) if (x !== i && x !== j) cand.push(calc([votes.get(key("wide", [i, x])) || 0, votes.get(key("wide", [j, x])) || 0]));
    }
    return { lo: Math.max(1.1, Math.min(...cand)), hi: Math.max(1.1, Math.max(...cand)) };
  };
  // にんき（うれて いる じゅん。1 が いちばん）
  const popularity = (votes, k) => { const v = votes.get(k) || 0; let r = 1; for (const x of votes.values()) if (x > v) r++; return r; };

  // ---- あたる たしかさ（ハービルの しき。q は 1ちゃくに なる たしかさ）----
  const P2 = (q, i, j) => (q[i] * q[j]) / Math.max(1e-12, 1 - q[i]);
  const P3 = (q, i, j, k) => (q[i] * q[j] * q[k]) / Math.max(1e-12, (1 - q[i]) * (1 - q[i] - q[j]));
  const PERM3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  // q: [0, q1, …, qn]（うまばんの じゅん）。かえす もの: Map（key → たしかさ）
  const probs = (t, q, n, w = wakuOf(n)) => {
    const m = new Map(), H = Array.from({ length: n }, (_, i) => i + 1);
    if (t === "tan") for (const i of H) m.set(String(i), q[i]);
    else if (t === "fuku") {
      const P = places(n);
      for (const i of H) { let s = q[i]; for (const j of H) if (j !== i) { s += P2(q, j, i); if (P === 3) for (const k of H) if (k !== i && k !== j) s += P3(q, j, k, i); } m.set(String(i), s); }
    } else if (t === "umaren" || t === "umatan") { for (const i of H) for (const j of H) if (i !== j) { const k = key(t, [i, j]); m.set(k, (m.get(k) || 0) + P2(q, i, j)); } }
    else if (t === "waku") { for (const i of H) for (const j of H) if (i !== j) { const k = key("waku", [w[i], w[j]]); m.set(k, (m.get(k) || 0) + P2(q, i, j)); } }
    else if (t === "trio" || t === "tierce" || t === "wide") {
      for (const i of H) for (const j of H) { if (j === i) continue; for (const k of H) { if (k === i || k === j) continue; const p = P3(q, i, j, k);
        if (t === "tierce") m.set(i + ">" + j + ">" + k, p);
        else if (t === "trio") { const kk = key("trio", [i, j, k]); m.set(kk, (m.get(kk) || 0) + p); }
        else for (const [a, b] of [[i, j], [i, k], [j, k]]) { const kk = key("wide", [a, b]); m.set(kk, (m.get(kk) || 0) + p); } } }
    }
    return m;
  };

  // ---- ちゃくさ（ばしん → ことば）----
  const MARGINS = [[0.1, "ハナ"], [0.2, "アタマ"], [0.35, "クビ"], [0.6, "1/2"], [0.85, "3/4"], [1.1, "1"], [1.35, "1 1/4"], [1.6, "1 1/2"], [1.85, "1 3/4"], [2.25, "2"], [2.75, "2 1/2"], [3.25, "3"], [3.75, "3 1/2"], [4.5, "4"], [5.5, "5"], [6.5, "6"], [7.5, "7"], [8.5, "8"], [9.5, "9"], [10, "10"]];
  const marginText = (len) => { for (const [lim, s] of MARGINS) if (len < lim) return s; return "たいさ"; };
  const marginLabel = (len) => { const s = marginText(len); return /^[0-9]/.test(s) ? s + " ばしん" : s; };
  // コインの ことば（1,234 コイン）
  const yen = (n) => U.fmt(n) + " コイン";

  return { UNIT, TYPES, BY, IDS, WAKU, wakuCounts, wakuOf, places, sold, key, parse, winners, combos, expand, boxCount, idiv, plus10, settle, odds, range, popularity, probs, MARGINS, marginText, marginLabel, yen };
})();
