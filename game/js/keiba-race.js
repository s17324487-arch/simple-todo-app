// UI-58: けいば ちゅうけい の レース（ばんぐみ・うま・オッズ・けっか・はしりかた）。きまりは js/keiba-rules.js。
// ・1にちに 12レース（ほんものの 1にちの ながれ: あさは みしょうり・しんば、ひるから 1しょう〜3しょう クラス、11R が メイン〔G1〜G3〕）。
//   ばんぐみ・うま・けっかは ひづけと レースの ばんごうで きまる（よみこみ なおしても かわらない）。けっかは レースを はしらせる まで みせない。
// ・つよさ r（のうりょく・しば／ダート・きょり・ばば・ちょうし）→ 1ちゃくに なる たしかさ p = softmax(1.1 r)。
//   みんなの よそう q は r に ぶれ（0.4）を たした もの・ながしの くせ（あなうまを すこし かいすぎる: q^0.8）。うりあげは q から つくる。
//   ほんものの データ（1ばん にんきの かつ わりあい やく 30%・3ちゃく いない やく 6わり）に あわせた。
// ・ちゃくじゅんは「r × 1.1 ＋ ぶれ（ガンベル）」の おおきい じゅん（= ハービルの しき）。ちゃくさは その さ から。
// ・はしりかた（pos）: 1ちゃくの うまの ペースと、ほかの うまの「まえ・うしろ」（さいしょは きゃくしつ〔にげ・せんこう・さし・おいこみ〕、さいごは ちゃくさ）。
//   のこり 5% から さきは ちゃくさ どおり（ゴールの じゅんばんが けっかと おなじ）。
// セーブは Save.d.keiba（js/keiba-corner.js）。
const KeibaRace = (() => {
  const R = KeibaRules;
  const BETA = 1.1, SIG = 0.4, BIAS = 0.8, LEN = 0.8, TAU = 1.4, BODY = 2.4; // 1ばしん = 2.4m
  // ---- きまった らんすう ----
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const nrm = (r) => Math.sqrt(-2 * Math.log(1 - r() * 0.999999)) * Math.cos(2 * Math.PI * r());
  const gum = (r) => -Math.log(-Math.log(Math.min(1 - 1e-12, Math.max(1e-12, r()))));
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
  const smooth = (x) => { const v = Math.min(1, Math.max(0, x)); return v * v * (3 - 2 * v); };

  // ---- ひづけ（ゲームの 1にち = ほんとうの 1にち。PokaDebug.keibaDays で ずらせる）----
  const clock = { shift: 0 };
  const dayKey = (off = 0) => { const d = new Date(Date.now() + (clock.shift + off) * 864e5); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };

  // ---- けいばじょう ----
  const COURSE = { name: "ぽかぽか けいばじょう", dir: "ひだりまわり", lap: { turf: 2000, dirt: 1800 }, straight: { turf: 525, dirt: 500 } };
  const SURF = { turf: "しば", dirt: "ダート" };
  const STYLE = ["にげ", "せんこう", "さし", "おいこみ"];
  const COAT = ["くりげ", "かげ", "くろかげ", "あしげ", "しろげ"];
  const SEX = { m: "おす", f: "めす", g: "せん" };
  const CLS = {
    shinba: { name: "2さい しんば", age: 2, base: 800000 },
    mishori: { name: "3さい みしょうり", age: 3, base: 900000 },
    c1: { name: "1しょう クラス", age: 0, base: 1100000 },
    c2: { name: "2しょう クラス", age: 0, base: 1400000 },
    c3: { name: "3しょう クラス", age: 0, base: 1700000 },
    main: { name: "", age: 0, base: 3000000 },
  };
  // 1R〜12R の くみかた [クラス, コース, きょりの こうほ, とうすう]
  const PLAN = [
    [["mishori", "dirt", [1200, 1400, 1800], [12, 16]]],
    [["mishori", "dirt", [1400, 1600], [12, 16]], ["mishori", "turf", [1600, 1800], [12, 16]]],
    [["mishori", "turf", [1400, 1800, 2000], [10, 16]]],
    [["shinba", "turf", [1400, 1600, 1800], [8, 14]], ["shinba", "dirt", [1400], [8, 14]]],
    [["c1", "dirt", [1200, 1400, 1600], [12, 16]]],
    [["c1", "turf", [1600, 1800, 2000, 2400], [10, 16]]],
    [["c1", "dirt", [1600, 1800, 2100], [12, 16]]],
    [["c2", "turf", [1400, 1600, 1800], [10, 16]]],
    [["c2", "dirt", [1400, 1600], [10, 16]], ["c2", "turf", [2000, 2400], [10, 14]]],
    [["c3", "turf", [1600, 1800, 2000], [10, 16]], ["c3", "dirt", [1400], [10, 16]]],
    [["main", "turf", [1600, 2000, 2400, 3200], [14, 16]], ["main", "dirt", [1600, 2100], [14, 16]]],
    [["c2", "dirt", [1200, 1400], [12, 16]], ["c1", "turf", [1400, 1600], [12, 16]]],
  ];
  const POST = ["10:05", "10:35", "11:05", "11:35", "12:25", "12:55", "13:25", "13:55", "14:25", "15:00", "15:40", "16:20"];
  const SPECIAL = ["ネリカス とくべつ", "いけぶくろ とくべつ", "ひまわり ステークス", "さくら とくべつ", "ほしぞら とくべつ", "にじいろ ステークス", "わたあめ とくべつ", "もみじ ステークス", "ゆきだるま とくべつ", "はなび ステークス", "どんぐり とくべつ", "クローバー ステークス"];
  const MAIN = { G1: ["ぽかぽか きねん", "ネリカス カップ", "いけぶくろ グランプリ", "サンシャイン きねん"], G2: ["ほしぞら ステークス", "ひだまり きねん", "にじいろ カップ"], G3: ["わんこ ステークス", "がちゃん カップ", "ごじ きねん", "マシュマロ ステークス", "ドロップ とくべつ"] };
  // うまの なまえ（カタカナ。ほんものと おなじ 2〜9もじ）
  const NA = ["ポカポカ", "ネリカス", "ハルカゼ", "キラリ", "ソラノ", "モモイロ", "ホシゾラ", "ユメミ", "ニジイロ", "マシュマロ", "カゼノ", "サクラ", "ヒマワリ", "ドングリ", "ミルキー", "ココア", "メロン", "チョコ", "プリン", "ワタアメ", "コハル", "ヒカリ", "ルンルン", "ポラリス", "シロツメ", "ハナビ", "オヒサマ", "ツキミ"];
  const NB = ["スター", "ドリーム", "ウイング", "ハート", "ダッシュ", "ブレイブ", "ミラクル", "ステップ", "マーチ", "シャイン", "ボーイ", "ガール", "キング", "クイーン", "ジャンプ", "ロード", "スマイル", "パレード", "ギャロップ", "リボン", "ベル", "ソング", "ノヴァ", "ウェーブ", "アロー", "テール"];
  const nameOk = (s) => s.length >= 2 && s.length <= 9;

  // ---- 1にちの ばんぐみ ----
  const cache = new Map();
  const dayInfo = (day) => {
    const k = "day:" + day; if (cache.has(k)) return cache.get(k);
    const r = rng(hash(day + ":weather")), w = r(), weather = w < 0.55 ? "はれ" : w < 0.85 ? "くもり" : w < 0.95 ? "こさめ" : "あめ";
    const g = r(), going = weather === "あめ" ? (g < 0.5 ? "おも" : "ふりょう") : weather === "こさめ" ? (g < 0.6 ? "ややおも" : "おも") : weather === "くもり" ? (g < 0.75 ? "りょう" : "ややおも") : g < 0.92 ? "りょう" : "ややおも";
    const small = 2 + Math.floor(r() * 9); // この レース（2R〜10R の どれか）は すくない とうすう（7〜9とう）
    const grade = r(), gr = grade < 0.3 ? "G1" : grade < 0.6 ? "G2" : "G3";
    const info = { day, weather, going, small, grade: gr };
    cache.set(k, info); return info;
  };
  // うまの なまえ（その日の 12レースで かさならない。1R から じゅんに きめる ので よむ じゅんばんで かわらない）
  const dayNames = (day) => {
    const k = "names:" + day; if (cache.has(k)) return cache.get(k);
    const r = rng(hash(day + ":names")), used = new Set(), out = [];
    for (let no = 1; no <= 12; no++) {
      const list = [];
      for (let i = 0; i < head(day, no).n; i++) {
        let s = "", tries = 0;
        do { const a = pick(r, NA), b = pick(r, NB); s = r() < 0.12 ? a : a + b; tries++; } while ((!nameOk(s) || used.has(s)) && tries < 200);
        if (used.has(s) || !nameOk(s)) for (let j = 0; j < NA.length * NB.length; j++) { const c = NA[j % NA.length] + NB[Math.floor(j / NA.length)]; if (nameOk(c) && !used.has(c)) { s = c; break; } }
        used.add(s); list.push(s);
      }
      out.push(list);
    }
    cache.set(k, out); return out;
  };
  // レースの わく（うまは まだ）
  const head = (day, no) => {
    const k = "head:" + day + ":" + no; if (cache.has(k)) return cache.get(k);
    const D = dayInfo(day), r = rng(hash(day + ":head:" + no)), opt = pick(r, PLAN[no - 1]), [cls, surf, dists, [n0, n1]] = opt;
    const dist = pick(r, dists);
    let n = n0 + Math.floor(r() * (n1 - n0 + 1)); if (no === D.small) n = 7 + Math.floor(r() * 3);
    let name = CLS[cls].name, grade = null;
    if (cls === "main") { grade = D.grade; name = pick(r, MAIN[grade]); }
    else if (no === 9 || no === 10) name = pick(r, SPECIAL);
    const sub = cls === "main" ? "3さい いじょう" : no === 9 || no === 10 ? CLS[cls].name : "";
    const h = { day, no, cls, grade, name, sub, surf, surfName: SURF[surf], dist, n, weather: D.weather, going: D.going, post: POST[no - 1], dir: COURSE.dir };
    cache.set(k, h); return h;
  };
  const card = (day = dayKey()) => Array.from({ length: 12 }, (_, i) => head(day, i + 1));
  const title = (h) => h.no + "R " + h.name + (h.grade ? "（" + h.grade + "）" : "");
  const course = (h) => h.surfName + " " + h.dist + "m";

  // ---- うまと つよさ ----
  const softmax = (xs) => { const m = Math.max(...xs), e = xs.map((x) => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
  const race = (day, no) => {
    const k = "race:" + day + ":" + no; if (cache.has(k)) return cache.get(k);
    const h = head(day, no), r = rng(hash(day + ":field:" + no)), n = h.n, w = R.wakuOf(n), heavy = h.going === "おも" || h.going === "ふりょう";
    const names = dayNames(day)[no - 1];
    const horses = [], raw = [];
    for (let i = 0; i < n; i++) {
      const a = nrm(r), prefSurf = r() < 0.5 ? h.surf : r() < 0.5 ? "turf" : "dirt", best = pick(r, [1200, 1400, 1600, 1800, 2000, 2400, 3000]), mud = nrm(r) * 0.3, form = nrm(r) * 0.35;
      const fit = (prefSurf === h.surf ? 0 : -0.6) - 0.5 * Math.abs(Math.log2(h.dist / best)) + (heavy ? mud : 0);
      const rr = a + fit + form;
      const sexR = r(), sex = h.cls === "shinba" || h.cls === "mishori" ? (sexR < 0.6 ? "m" : "f") : sexR < 0.55 ? "m" : sexR < 0.9 ? "f" : "g";
      const age = CLS[h.cls].age || (3 + Math.floor(r() * 4));
      const kg = age === 2 ? (sex === "f" ? 54 : 55) : age === 3 ? (sex === "f" ? 55 : 57) : sex === "f" ? 56 : 58;
      const st = r(), style = st < 0.12 ? 0 : st < 0.47 ? 1 : st < 0.82 ? 2 : 3;
      const coatR = r(), coat = coatR < 0.3 ? 0 : coatR < 0.62 ? 1 : coatR < 0.84 ? 2 : coatR < 0.985 ? 3 : 4;
      const lastPos = h.cls === "shinba" ? 0 : Math.max(1, Math.min(16, Math.round(n / 2 - 2.2 * (a + nrm(r) * 0.6))));
      raw.push(rr);
      horses.push({ no: i + 1, waku: w[i + 1], name: names[i], sex, sexName: SEX[sex], age, kg, style, styleName: STYLE[style], coat, coatName: COAT[coat], silk: Math.floor(r() * 16), last: lastPos, r: rr, best, prefSurf });
    }
    const p = softmax(raw.map((x) => BETA * x));
    const cr = rng(hash(day + ":crowd:" + no)), qv = softmax(raw.map((x) => BETA * (x + nrm(cr) * SIG)));
    const qb0 = qv.map((x) => Math.pow(x, BIAS)), sb = qb0.reduce((a, b) => a + b, 0), q = qb0.map((x) => x / sb);
    horses.forEach((hh, i) => { hh.p = p[i]; hh.q = q[i]; });
    // しんぶんの しるし（◎○▲△）: みんなの よそうに すこし ちがう ぶれ
    const nr = rng(hash(day + ":paper:" + no)), paper = horses.map((hh) => [hh.no, Math.log(hh.q) + nrm(nr) * 0.35]).sort((a, b) => b[1] - a[1]);
    const marks = {}; ["◎", "○", "▲", "△", "△"].forEach((m, i) => { if (paper[i]) marks[paper[i][0]] = m; });
    const full = { ...h, w, horses, marks, sales: Math.round(CLS[h.cls].base * (h.grade === "G1" ? 4 : h.grade === "G2" ? 1.8 : 1) * (0.7 + n / 40)) };
    cache.set(k, full); return full;
  };

  // ---- うりあげ（みんなの ばけん）----
  const SHARE = { tan: 0.08, fuku: 0.08, waku: 0.03, umaren: 0.12, wide: 0.09, umatan: 0.07, trio: 0.2, tierce: 0.33 };
  const crowd = (rc, t) => {
    const k = "pool:" + rc.day + ":" + rc.no + ":" + t; if (cache.has(k)) return cache.get(k);
    const q = [0, ...rc.horses.map((h) => h.q)], pr = R.probs(t, q, rc.n, rc.w), r = rng(hash(rc.day + ":pool:" + rc.no + ":" + t));
    let sum = 0; for (const v of pr.values()) sum += v;
    const V = rc.sales * SHARE[t], m = new Map();
    for (const kk of R.combos(t, rc.n, rc.w)) m.set(kk, Math.max(0, Math.round((V * (pr.get(kk) || 0)) / sum * Math.exp(nrm(r) * 0.2))));
    cache.set(k, m); return m;
  };
  // じぶんの ばけんも たした うりあげ
  const votes = (rc, t, mine = []) => {
    const m = new Map(crowd(rc, t));
    for (const tk of mine) if (tk.day === rc.day && tk.no === rc.no && tk.t === t) for (const kk of tk.keys) m.set(kk, (m.get(kk) || 0) + tk.u);
    return m;
  };
  const total = (m) => { let s = 0; for (const v of m.values()) s += v; return s; };
  // たんしょうの オッズと にんき（しゅつばひょう）
  const board = (rc, mine = []) => {
    const m = votes(rc, "tan", mine), tot = total(m);
    return rc.horses.map((h) => ({ no: h.no, odds: R.odds("tan", m, String(h.no), tot), pop: R.popularity(m, String(h.no)) }));
  };

  // ---- けっか（ちゃくじゅん・ちゃくさ・タイム）----
  const result = (rc) => {
    const k = "res:" + rc.day + ":" + rc.no; if (cache.has(k)) return cache.get(k);
    const r = rng(hash(rc.day + ":run:" + rc.no)), X = rc.horses.map((h) => BETA * h.r + gum(r));
    const idx = X.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]).map((a) => a[1]);
    const order = idx.map((i) => rc.horses[i].no), scale = Math.sqrt(rc.dist / 1600);
    const cum = [0]; for (let j = 1; j < idx.length; j++) cum.push(cum[j - 1] + Math.min(12, LEN * (X[idx[j - 1]] - X[idx[j]]) * (1 + 0.15 * (j - 1)) * scale));
    // かちタイム（しば・ダート・きょり・ばば・クラス）
    const wet = { りょう: 0, ややおも: 1, おも: 2, ふりょう: 3 }[rc.going];
    let v = (rc.surf === "turf" ? 16.9 : 16.2) - 0.35 * Math.log2(rc.dist / 1600) + (rc.surf === "turf" ? -0.15 * wet : 0.04 * wet) + (rc.grade === "G1" ? 0.15 : rc.cls === "mishori" || rc.cls === "shinba" ? -0.15 : 0) + nrm(r) * 0.08;
    const tw = rc.dist / v, vc = rc.dist / (tw - TAU);
    const time = cum.map((c) => Math.round((tw + (c * BODY) / vc) * 10) / 10);
    const margins = cum.map((c, j) => (j ? R.marginText(c - cum[j - 1]) : ""));
    // さいしょの いち（きゃくしつ）と コースの なか・そと
    const er = rng(hash(rc.day + ":early:" + rc.no)), base = [-2.2, -0.8, 0.6, 1.8];
    const early = rc.horses.map((h) => base[h.style] + nrm(er) * 0.7), e0 = Math.min(...early);
    const lateLane = rc.horses.map((h) => { const lo = [0.05, 0.12, 0.36, 0.6][h.style], hi = [0.32, 0.5, 0.78, 0.96][h.style]; return lo + er() * (hi - lo); });
    const midLane = rc.horses.map((h) => 0.05 + er() * 0.28 + [0, 0.06, 0.14, 0.2][h.style]);
    const rank = []; idx.forEach((hi, j) => (rank[hi] = j));
    const res = { order, idx, rank, cum, time, margins, tw, vc, early: early.map((e) => (e - e0) * BODY * 2.2), lateLane, midLane, phase: rc.horses.map(() => er() * 6.28) };
    cache.set(k, res); return res;
  };
  const fmtTime = (s) => Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0");
  // はらいもどし ぜんぶ（しきべつ → { wins: [{ key, per, pop }], toku, sold }）
  const payouts = (rc, mine = []) => {
    const res = result(rc), out = {};
    for (const t of R.IDS) {
      if (R.sold(t, rc.n)) { out[t] = { sold: false, wins: [] }; continue; }
      const m = votes(rc, t, mine), wins = R.winners(t, res.order, rc.n, rc.w), s = R.settle(t, m, wins);
      out[t] = { sold: true, toku: s.toku, wins: wins.map((kk) => ({ key: kk, per: s.per.has(kk) ? s.per.get(kk) : null, pop: R.popularity(m, kk) })) };
    }
    return out;
  };

  // ---- はしりかた（t は スタートからの びょう）----
  // かえす もの: [{ no, s: すすんだ m, lane: 0 うちがわ〜1 そとがわ }]（うまばんの じゅん）
  const pos = (rc, t) => {
    const res = result(rc), D = rc.dist, vc = res.vc, n = rc.n;
    const sw = t <= 0 ? 0 : vc * (t - TAU + TAU * Math.exp(-t / TAU)), u = sw / D;
    const wi = res.idx[0], start = smooth(u / 0.1), late = smooth((u - 0.5) / 0.45), fan = smooth((u - 0.62) / 0.25), toRail = smooth(u / 0.16);
    const out = [];
    for (let i = 0; i < n; i++) {
      const F = res.cum[res.rank[i]] * BODY, ge = res.early[i] - res.early[wi];
      const wig = Math.sin(t * 0.9 + res.phase[i]) * 0.5 * (1 - late) * start;
      const g = u >= 0.95 ? F : (1 - late) * (ge * start + wig) + late * F;
      const gate = 0.06 + (0.6 * i) / Math.max(1, n - 1);
      const lane = (1 - fan) * ((1 - toRail) * gate + toRail * res.midLane[i]) + fan * res.lateLane[i];
      out.push({ no: i + 1, s: Math.max(0, sw - g), lane });
    }
    return out;
  };
  // その うまが ゴールする じこく
  const finishAt = (rc, no) => { const res = result(rc), place = res.order.indexOf(no); return (rc.dist + res.cum[place] * BODY) / res.vc + TAU; };

  return { BETA, SIG, BIAS, LEN, BODY, TAU, COURSE, SURF, STYLE, COAT, SEX, CLS, PLAN, POST, SHARE, NA, NB, hash, rng, clock, dayKey, dayInfo, dayNames, head, card, title, course, race, crowd, votes, total, board, result, fmtTime, payouts, pos, finishAt, nameOk, cache };
})();
