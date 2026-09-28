// ④ 恐竜の 骨の 絵（docs/design/features/fossils の 見本 tools/feature-design/fossil-art-ref.js の FossilArtRef を 名前だけ FossilArt に して そのまま 移した もの。⑤ も この 名前で つかう）。FOSSIL_DATA.dinos[i].art の 骨格から、
//   ・svg(dino, { have })   … 骨格ぜんぶ（have に ある 部品は 骨の 色、ない 部品は 点線の かげ）。⑤ 博物館の 展示にも つかう
//   ・partSvg(dino, partId) … 1つの 部品だけ（化石の アイテムの 絵）
// を つくる。SvgCache の キーは "dino:" + id + ":" + 部品の ビット列 / "bone:" + id + ":" + part（有限）。
// 座標: 左むき（あたまが 左）。地面が y = 0、上が マイナス。1マス = 1。
const FossilArt = (() => {
  const INK = "#1F1D1B", BONE = "#EFE2C2", BONE2 = "#D9C7A0", BONE3 = "#F8F0DC", GHOST = "#8A7D6A";
  const r1 = (n) => Math.round(n * 10) / 10;
  const P = (x, y) => `${r1(x)},${r1(y)}`;
  const lerp = (a, b, t) => a + (b - a) * t;
  // なめらかな 線
  function smooth(pts, close) {
    let d = "M" + P(pts[0][0], pts[0][1]);
    const n = pts.length, get = (i) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    for (let i = 0; i < (close ? n : n - 1); i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += `C${P(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${P(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${P(p2[0], p2[1])}`;
    }
    return d + (close ? "Z" : "");
  }
  // ---- 骨の 部品 ----
  // ほね（長い 骨）: 2点の あいだに 軸 ＋ 両はしの ふくらみ
  function longbone(a, b, w, k = 1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hw = w / 2, e = w * 0.95 * k;
    const pts = [
      [a[0] + nx * e - ux * e * 0.5, a[1] + ny * e - uy * e * 0.5], [a[0] + nx * hw * 0.85 + ux * e * 1.2, a[1] + ny * hw * 0.85 + uy * e * 1.2], [lerp(a[0], b[0], 0.5) + nx * hw * 0.62, lerp(a[1], b[1], 0.5) + ny * hw * 0.62],
      [b[0] + nx * hw * 0.85 - ux * e * 1.2, b[1] + ny * hw * 0.85 - uy * e * 1.2], [b[0] + nx * e + ux * e * 0.5, b[1] + ny * e + uy * e * 0.5], [b[0] + ux * e * 0.9, b[1] + uy * e * 0.9],
      [b[0] - nx * e + ux * e * 0.5, b[1] - ny * e + uy * e * 0.5], [b[0] - nx * hw * 0.85 - ux * e * 1.2, b[1] - ny * hw * 0.85 - uy * e * 1.2], [lerp(a[0], b[0], 0.5) - nx * hw * 0.62, lerp(a[1], b[1], 0.5) - ny * hw * 0.62],
      [a[0] - nx * hw * 0.85 + ux * e * 1.2, a[1] - ny * hw * 0.85 + uy * e * 1.2], [a[0] - nx * e - ux * e * 0.5, a[1] - ny * e - uy * e * 0.5], [a[0] - ux * e * 0.9, a[1] - uy * e * 0.9],
    ];
    return smooth(pts, true);
  }
  // せぼね 1こ（椎体 ＋ 神経棘 ＋ しっぽは 血道弓）
  function vertebra(x, y, ang, s, spine, chevron, spineAng = 0) {
    const c = Math.cos(ang), sn = Math.sin(ang), T = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
    const body = [T(-s * 0.5, -s * 0.36), T(s * 0.5, -s * 0.36), T(s * 0.56, 0), T(s * 0.5, s * 0.36), T(-s * 0.5, s * 0.36), T(-s * 0.56, 0)];
    let d = smooth(body, true);
    if (spine > 0) { const lean = spineAng * spine, sp = [T(-s * 0.2, -s * 0.3), T(-s * 0.12 + lean * 0.5, -s * 0.3 - spine * 0.6), T(-s * 0.02 + lean, -s * 0.3 - spine), T(s * 0.16 + lean, -s * 0.3 - spine * 0.96), T(s * 0.24 + lean * 0.4, -s * 0.3 - spine * 0.4), T(s * 0.2, -s * 0.3)]; d += smooth(sp, true); }
    if (chevron > 0) { const ch = [T(-s * 0.12, s * 0.3), T(-s * 0.02, s * 0.3 + chevron), T(s * 0.14, s * 0.3 + chevron * 0.9), T(s * 0.16, s * 0.3)]; d += smooth(ch, true); }
    return d;
  }
  // ろっこつ（あばら）: つけねから 下へ カーブ
  function rib(x, y, len, bend, w = 1.6) {
    const pts = [[x - w * 0.6, y], [x - len * 0.12 - w, y + len * 0.35], [x - len * bend - w * 0.5, y + len * 0.8], [x - len * bend * 0.8, y + len], [x - len * bend + w * 0.8, y + len * 0.78], [x - len * 0.1 + w * 0.5, y + len * 0.34], [x + w * 0.6, y]];
    return smooth(pts, true);
  }
  function claw(x, y, ang, len, w = 1) {
    const c = Math.cos(ang), s = Math.sin(ang), T = (px, py) => [x + px * c - py * s, y + px * s + py * c];
    return smooth([T(0, -len * 0.18 * w), T(len * 0.55, -len * 0.16 * w), T(len, len * 0.2), T(len * 0.5, len * 0.08 * w), T(0, len * 0.16 * w)], true);
  }
  // あしゆび（ならんだ 骨 ＋ つめ）
  function toe(p, ang, segs, len, w, clawLen) {
    let d = "", x = p[0], y = p[1];
    for (let i = 0; i < segs; i++) { const l = len * (1 - i * 0.18), nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l; d += longbone([x, y], [nx, ny], w * (1 - i * 0.12), 0.7); x = nx; y = ny; }
    if (clawLen) d += claw(x, y, ang + 0.35, clawLen, 1);
    return d;
  }
  function plate(x, y, h, w, ang) { // ステゴサウルスの 板
    const c = Math.cos(ang), s = Math.sin(ang), T = (px, py) => [x + px * c - py * s, y + px * s + py * c];
    return smooth([T(-w * 0.5, 0), T(-w * 0.55, -h * 0.45), T(-w * 0.15, -h * 0.92), T(w * 0.05, -h), T(w * 0.4, -h * 0.6), T(w * 0.5, 0)], true);
  }
  function spike(x, y, ang, len, w) { const c = Math.cos(ang), s = Math.sin(ang), T = (px, py) => [x + px * c - py * s, y + px * s + py * c]; return smooth([T(0, -w / 2), T(len * 0.6, -w * 0.3), T(len, 0), T(len * 0.6, w * 0.3), T(0, w / 2)], true); }
  // こつばん（こし）: 腸骨の 板 ＋ 恥骨・坐骨
  function pelvis(x, y, s, kind) {
    let d = smooth([[x - s * 1.3, y - s * 0.2], [x - s * 1.1, y - s * 0.75], [x, y - s * 0.95], [x + s * 1.1, y - s * 0.7], [x + s * 1.35, y - s * 0.15], [x + s * 0.4, y + s * 0.15], [x - s * 0.5, y + s * 0.12]], true);
    if (kind === "orni") { d += longbone([x - s * 0.3, y + s * 0.05], [x - s * 1.6, y + s * 0.5], s * 0.28); d += longbone([x + s * 0.3, y + s * 0.1], [x + s * 1.2, y + s * 1.2], s * 0.28); }
    else { d += longbone([x - s * 0.2, y + s * 0.1], [x - s * 0.55, y + s * 1.5], s * 0.34); d += claw(x - s * 0.8, y + s * 1.45, 0.3, s * 0.7, 1.6); d += longbone([x + s * 0.3, y + s * 0.1], [x + s * 0.9, y + s * 1.1], s * 0.28); }
    return d;
  }
  function scapula(x, y, s, ang) { const c = Math.cos(ang), sn = Math.sin(ang), T = (px, py) => [x + px * c - py * sn, y + px * sn + py * c]; return smooth([T(0, -s * 0.18), T(s * 0.9, -s * 0.28), T(s * 1.6, -s * 0.12), T(s * 1.62, s * 0.12), T(s * 0.9, s * 0.2), T(0, s * 0.22)], true); }

  // ---- あたま（左むき・うしろが 0,0。len = はなさきまでの 長さ）----
  const SKULL = {
    // ティラノサウルス: たかい あたま・大きな 穴（前眼窩窓）・ギザギザの 歯
    trex: (L) => ({ d: smooth([[0, -0.3 * L], [-0.18 * L, -0.4 * L], [-0.42 * L, -0.36 * L], [-0.7 * L, -0.26 * L], [-0.95 * L, -0.14 * L], [-L, -0.05 * L], [-0.96 * L, 0.08 * L], [-0.6 * L, 0.12 * L], [-0.25 * L, 0.18 * L], [0.02 * L, 0.12 * L]], true), holes: [[-0.62 * L, -0.12 * L, 0.13 * L, 0.08 * L], [-0.33 * L, -0.22 * L, 0.07 * L, 0.08 * L], [-0.12 * L, -0.12 * L, 0.06 * L, 0.1 * L], [-0.86 * L, -0.08 * L, 0.04 * L, 0.025 * L]], jaw: smooth([[0.05 * L, 0.16 * L], [-0.3 * L, 0.24 * L], [-0.6 * L, 0.22 * L], [-0.92 * L, 0.14 * L], [-0.9 * L, 0.2 * L], [-0.55 * L, 0.34 * L], [-0.2 * L, 0.34 * L], [0.05 * L, 0.26 * L]], true), teeth: { from: -0.93, to: -0.3, y: 0.12, n: 11, len: 0.07, jawY: 0.2 } }),
    // トリケラトプス: くちばし・3本の つの・大きな フリル
    tri: (L) => ({ d: smooth([[0.35 * L, -0.55 * L], [0.1 * L, -0.72 * L], [-0.2 * L, -0.62 * L], [-0.42 * L, -0.4 * L], [-0.62 * L, -0.28 * L], [-0.85 * L, -0.18 * L], [-L, 0.02 * L], [-0.9 * L, 0.12 * L], [-0.5 * L, 0.12 * L], [-0.1 * L, 0.1 * L], [0.28 * L, 0.02 * L], [0.45 * L, -0.25 * L]], true), holes: [[-0.44 * L, -0.2 * L, 0.06 * L, 0.06 * L], [0.12 * L, -0.4 * L, 0.1 * L, 0.12 * L], [-0.8 * L, -0.08 * L, 0.05 * L, 0.03 * L]], horns: [[-0.42 * L, -0.34 * L, -2.2, 0.62 * L, 0.1 * L], [-0.36 * L, -0.3 * L, -2.05, 0.55 * L, 0.09 * L], [-0.72 * L, -0.24 * L, -1.95, 0.22 * L, 0.08 * L]], frillDots: [[0.28 * L, -0.62 * L], [0.4 * L, -0.42 * L], [0.44 * L, -0.18 * L], [0.12 * L, -0.66 * L]], jaw: smooth([[-0.1 * L, 0.08 * L], [-0.55 * L, 0.12 * L], [-0.96 * L, 0.08 * L], [-0.86 * L, 0.22 * L], [-0.4 * L, 0.24 * L], [-0.05 * L, 0.2 * L]], true) }),
    // ステゴサウルス: ほそながく ちいさい あたま
    stego: (L) => ({ d: smooth([[0, -0.12 * L], [-0.3 * L, -0.17 * L], [-0.7 * L, -0.12 * L], [-L, -0.02 * L], [-0.95 * L, 0.06 * L], [-0.5 * L, 0.08 * L], [0, 0.08 * L]], true), holes: [[-0.3 * L, -0.07 * L, 0.06 * L, 0.05 * L], [-0.7 * L, -0.05 * L, 0.06 * L, 0.025 * L]], jaw: smooth([[0, 0.06 * L], [-0.5 * L, 0.1 * L], [-0.92 * L, 0.07 * L], [-0.85 * L, 0.14 * L], [-0.45 * L, 0.16 * L], [0, 0.13 * L]], true), teeth: { from: -0.85, to: -0.5, y: 0.075, n: 6, len: 0.035, jawY: 0.1 } }),
    // ブラキオサウルス: はなの 上が もりあがった アーチ・スプーンの ような 歯
    brachio: (L) => ({ d: smooth([[0, -0.1 * L], [-0.18 * L, -0.34 * L], [-0.36 * L, -0.5 * L], [-0.52 * L, -0.42 * L], [-0.62 * L, -0.2 * L], [-0.9 * L, -0.12 * L], [-L, 0.02 * L], [-0.92 * L, 0.14 * L], [-0.5 * L, 0.14 * L], [0, 0.12 * L]], true), holes: [[-0.36 * L, -0.34 * L, 0.08 * L, 0.1 * L], [-0.2 * L, -0.12 * L, 0.07 * L, 0.07 * L], [-0.62 * L, -0.04 * L, 0.08 * L, 0.04 * L]], jaw: smooth([[0, 0.1 * L], [-0.5 * L, 0.16 * L], [-0.95 * L, 0.14 * L], [-0.9 * L, 0.24 * L], [-0.45 * L, 0.26 * L], [0, 0.2 * L]], true), teeth: { from: -0.96, to: -0.62, y: 0.14, n: 7, len: 0.06, jawY: 0.16, round: true } }),
    // アンキロサウルス: ひくくて はばの ある よろいの あたま・うしろに つの
    ankylo: (L) => ({ d: smooth([[0.06 * L, -0.28 * L], [-0.2 * L, -0.36 * L], [-0.55 * L, -0.34 * L], [-0.85 * L, -0.24 * L], [-L, -0.06 * L], [-0.92 * L, 0.1 * L], [-0.4 * L, 0.14 * L], [0.08 * L, 0.1 * L]], true), holes: [[-0.34 * L, -0.12 * L, 0.07 * L, 0.06 * L], [-0.84 * L, -0.08 * L, 0.05 * L, 0.03 * L]], horns: [[0.02 * L, -0.28 * L, -0.5, 0.28 * L, 0.12 * L], [0.04 * L, 0.06 * L, 0.6, 0.24 * L, 0.11 * L]], knobs: [[-0.62 * L, -0.3 * L], [-0.4 * L, -0.34 * L], [-0.18 * L, -0.32 * L]], jaw: smooth([[0.02 * L, 0.08 * L], [-0.5 * L, 0.14 * L], [-0.9 * L, 0.1 * L], [-0.82 * L, 0.2 * L], [-0.4 * L, 0.24 * L], [0.02 * L, 0.18 * L]], true) }),
    // ヴェロキラプトル・フクイラプトル・コンプソグナトゥス: ほそながい あたま・大きな 目
    raptor: (L, deep = 1) => ({ d: smooth([[0, -0.2 * L * deep], [-0.25 * L, -0.26 * L * deep], [-0.55 * L, -0.2 * L * deep], [-0.85 * L, -0.1 * L * deep], [-L, -0.02 * L], [-0.92 * L, 0.07 * L], [-0.5 * L, 0.1 * L], [0.02 * L, 0.1 * L]], true), holes: [[-0.56 * L, -0.08 * L * deep, 0.12 * L, 0.06 * L * deep], [-0.26 * L, -0.12 * L * deep, 0.08 * L, 0.09 * L * deep], [-0.08 * L, -0.06 * L, 0.05 * L, 0.07 * L]], jaw: smooth([[0.04 * L, 0.08 * L], [-0.45 * L, 0.14 * L], [-0.9 * L, 0.1 * L], [-0.86 * L, 0.18 * L], [-0.4 * L, 0.24 * L], [0.04 * L, 0.18 * L]], true), teeth: { from: -0.9, to: -0.35, y: 0.09, n: 10, len: 0.055, jawY: 0.13 } }),
    // スピノサウルス: ワニの ような ながい くち・はなの 上に 小さな とさか
    spino: (L) => ({ d: smooth([[0, -0.2 * L], [-0.18 * L, -0.26 * L], [-0.34 * L, -0.24 * L], [-0.42 * L, -0.3 * L], [-0.5 * L, -0.18 * L], [-0.8 * L, -0.1 * L], [-L, -0.06 * L], [-0.98 * L, 0.03 * L], [-0.6 * L, 0.05 * L], [0, 0.08 * L]], true), holes: [[-0.22 * L, -0.12 * L, 0.06 * L, 0.07 * L], [-0.08 * L, -0.06 * L, 0.04 * L, 0.06 * L], [-0.38 * L, -0.14 * L, 0.06 * L, 0.035 * L]], jaw: smooth([[0.02 * L, 0.06 * L], [-0.5 * L, 0.07 * L], [-0.96 * L, 0.05 * L], [-0.9 * L, 0.12 * L], [-0.45 * L, 0.16 * L], [0.02 * L, 0.14 * L]], true), teeth: { from: -0.97, to: -0.45, y: 0.045, n: 12, len: 0.05, jawY: 0.07, cone: true } }),
    // パラサウロロフス: カモの ような くちばし・うしろへ のびる ながい とさか
    para: (L) => ({ d: smooth([[0, -0.2 * L], [-0.1 * L, -0.28 * L], [-0.25 * L, -0.3 * L], [-0.55 * L, -0.2 * L], [-0.85 * L, -0.08 * L], [-L, 0.02 * L], [-0.95 * L, 0.1 * L], [-0.55 * L, 0.1 * L], [0, 0.1 * L]], true), holes: [[-0.2 * L, -0.12 * L, 0.06 * L, 0.06 * L], [-0.8 * L, -0.04 * L, 0.05 * L, 0.03 * L]], crest: smooth([[-0.18 * L, -0.26 * L], [0.1 * L, -0.5 * L], [0.55 * L, -0.72 * L], [0.95 * L, -0.8 * L], [1.05 * L, -0.72 * L], [0.6 * L, -0.56 * L], [0.15 * L, -0.34 * L], [-0.06 * L, -0.18 * L]], true), jaw: smooth([[0.02 * L, 0.08 * L], [-0.5 * L, 0.12 * L], [-0.95 * L, 0.1 * L], [-0.9 * L, 0.18 * L], [-0.45 * L, 0.22 * L], [0.02 * L, 0.18 * L]], true) }),
  };
  // ---- 骨格を 組み立てる（部品ごとに パスを あつめる）----
  function build(a) {
    const els = {};  // 部品の 名前 → { d: 骨の パス, holes: 穴, far: うしろがわ }
    const add = (k, d, far = false) => { (els[k] = els[k] || { d: "", far: "" }); if (far) els[k].far += d; else els[k].d += d; };
    const partOf = (name) => (a.parts.find((p) => p.el.includes(name)) || {}).id;
    const prof = (arr, t) => { const n = arr.length - 1, k = Math.min(n - 1e-6, t * n), i = Math.floor(k); return lerp(arr[i], arr[i + 1], k - i); };
    // せぼね: 区間（くび・せなか・こし・しっぽ …）ごとに 折れ線と 数を もつ。区間の 名前が 部品の el に なる
    const V = [];
    for (const sg of a.spine) {
      const pts = sg.pts, seg = []; let tot = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
      const at = (d) => { let acc = 0; for (let i = 0; i < seg.length; i++) { if (acc + seg[i] >= d || i === seg.length - 1) { const t = Math.min(1, (d - acc) / seg[i]); return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t), Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])]; } acc += seg[i]; } };
      const gap = tot / sg.n, id = partOf(sg.el);
      for (let i = 0; i < sg.n; i++) {
        const t = (i + 0.5) / sg.n, [x, y, ang] = at(t * tot), sz = prof(sg.size, t) * gap * 1.02;
        const v = { x, y, ang, seg: sg.el }; V.push(v);
        if (id) add(id, vertebra(x, y, ang, sz, prof(sg.spine, t) * sz, sg.chev ? prof(sg.chev, t) * sz : 0, sg.lean || 0));
      }
    }
    // あばら（on の 区間の せぼねに つく）
    if (a.ribs && partOf("ribs")) { const vs = V.filter((v) => v.seg === a.ribs.on); vs.forEach((v, i) => { const t = i / Math.max(1, vs.length - 1), len = prof(a.ribs.len, t); add(partOf("ribs"), rib(v.x, v.y + 1, len, a.ribs.bend || 0.12, a.ribs.w || 1.6)); }); }
    // あたま
    if (a.skull && partOf("skull")) {
      const k = a.skull, S = SKULL[k.type](k.len, k.deep), tr = `translate(${r1(k.x)} ${r1(k.y)}) rotate(${k.rot || 0})`;
      els[partOf("skull")] = els[partOf("skull")] || { d: "", far: "" };
      els[partOf("skull")].skull = { tr, S, k };
    }
    // あし・うで（near = 手前、far = おく）
    for (const L of a.limbs || []) { const id = partOf(L.id); if (!id) continue; const j = L.j, w = L.w; let d = ""; for (let i = 0; i < j.length - 1; i++) d += longbone(j[i], j[i + 1], w[i] || w[w.length - 1]); for (const t of L.toes || []) d += toe(j[j.length - 1], t[0], t[1], t[2], t[3], t[4]); if (L.claw) d += claw(L.claw[0], L.claw[1], L.claw[2], L.claw[3], L.claw[4] || 1); add(id, d, !!L.far); }
    for (const x of a.extras || []) { const id = partOf(x.id); if (!id) continue; let d = ""; if (x.k === "pelvis") d = pelvis(x.x, x.y, x.s, x.kind); else if (x.k === "scapula") d = scapula(x.x, x.y, x.s, x.ang); else if (x.k === "plates") for (const p of x.list) d += plate(p[0], p[1], p[2], p[3], p[4]); else if (x.k === "spikes") for (const p of x.list) d += spike(p[0], p[1], p[2], p[3], p[4]); else if (x.k === "club") d = smooth([[x.x + x.s, x.y - x.s * 0.4], [x.x, x.y - x.s * 0.7], [x.x - x.s * 1.3, x.y - x.s * 0.5], [x.x - x.s * 1.5, x.y + x.s * 0.1], [x.x - x.s * 1.1, x.y + x.s * 0.65], [x.x, x.y + x.s * 0.55], [x.x + x.s * 1.1, x.y + x.s * 0.2]], true); else if (x.k === "armor") for (const p of x.list) d += smooth([[p[0] - p[2], p[1]], [p[0] - p[2] * 0.6, p[1] - p[2] * 0.8], [p[0] + p[2] * 0.6, p[1] - p[2] * 0.8], [p[0] + p[2], p[1]], [p[0], p[1] + p[2] * 0.5]], true); else if (x.k === "gastralia") for (let i = 0; i < x.n; i++) { const xx = x.x0 + ((x.x1 - x.x0) * i) / (x.n - 1); d += longbone([xx - 2.4, x.y + Math.sin((i / (x.n - 1)) * Math.PI) * x.sag], [xx + 2.4, x.y + Math.sin((i / (x.n - 1)) * Math.PI) * x.sag + 0.8], 0.7, 0.5); } add(id, d, !!x.far); }
    return els;
  }
  function skullSvg(sk, style) {
    const { tr, S, k } = sk; let g = "";
    const fill = style.fill, st = style.stroke, sw = style.sw, dash = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
    if (S.crest) g += `<path d="${S.crest}" fill="${fill}" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`;
    for (const h of S.horns || []) g += `<path d="${spike(h[0], h[1], h[2], h[3], h[4])}" fill="${fill}" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`;
    if (S.jaw) g += `<path d="${S.jaw}" fill="${fill}" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`;
    g += `<path d="${S.d}" fill="${fill}" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`;
    if (!style.ghost) {
      for (const h of S.holes) g += `<ellipse cx="${r1(h[0])}" cy="${r1(h[1])}" rx="${r1(h[2])}" ry="${r1(h[3])}" fill="#4A3E2E" stroke="${INK}" stroke-width="${sw * 0.6}"/>`;
      for (const n of S.knobs || []) g += `<circle cx="${r1(n[0])}" cy="${r1(n[1])}" r="${r1(k.len * 0.05)}" fill="${BONE2}" stroke="${INK}" stroke-width="${sw * 0.6}"/>`;
      for (const f of S.frillDots || []) g += `<circle cx="${r1(f[0])}" cy="${r1(f[1])}" r="${r1(k.len * 0.035)}" fill="${BONE2}" stroke="${INK}" stroke-width="${sw * 0.5}"/>`;
      const T = S.teeth; if (T) for (let i = 0; i < T.n; i++) { const x = (T.from + ((T.to - T.from) * i) / (T.n - 1)) * k.len, l = T.len * k.len * (1 - Math.abs(i / (T.n - 1) - 0.35) * 0.6); const y0 = T.y * k.len; g += T.round ? `<ellipse cx="${r1(x)}" cy="${r1(y0 + l * 0.4)}" rx="${r1(l * 0.28)}" ry="${r1(l * 0.5)}" fill="#FFFDF4" stroke="${INK}" stroke-width="${sw * 0.45}"/>` : `<path d="M${P(x - l * 0.28, y0)} L${P(x + (T.cone ? 0 : -l * 0.12), y0 + l)} L${P(x + l * 0.28, y0)} Z" fill="#FFFDF4" stroke="${INK}" stroke-width="${sw * 0.45}" stroke-linejoin="round"/>`; }
    }
    return `<g transform="${tr}">${g}</g>`;
  }
  // 骨の ぬり（手前は 明るく、おくは 少し くらく）
  const STYLE = {
    have: { fill: BONE, stroke: INK, sw: 1.5 }, far: { fill: BONE2, stroke: INK, sw: 1.3 },
    ghost: { fill: "rgba(255,255,255,0.35)", stroke: GHOST, sw: 1.1, dash: "3 2.4", ghost: true }, ghostFar: { fill: "rgba(255,255,255,0.2)", stroke: GHOST, sw: 1, dash: "3 2.4", ghost: true },
  };
  function paint(els, id, have, k = 1) {
    const e = els[id]; if (!e) return { far: "", near: "" };
    const sc = (x) => ({ ...x, sw: r1(x.sw * k * 10) / 10, dash: x.dash ? x.dash.split(" ").map((n) => r1(n * k)).join(" ") : "" });
    const s = sc(have ? STYLE.have : STYLE.ghost), sf = sc(have ? STYLE.far : STYLE.ghostFar), dash = (x) => (x.dash ? ` stroke-dasharray="${x.dash}"` : "");
    const far = e.far ? `<path d="${e.far}" fill="${sf.fill}" stroke="${sf.stroke}" stroke-width="${sf.sw}" stroke-linejoin="round"${dash(sf)}/>` : "";
    let near = e.d ? `<path d="${e.d}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.sw}" stroke-linejoin="round"${dash(s)}/>` : "";
    if (e.skull) near += skullSvg(e.skull, s);
    if (have && e.d) near += `<path d="${e.d}" fill="none" stroke="${BONE3}" stroke-width="${r1(0.6 * k)}" stroke-opacity="0.7" transform="translate(${r1(-0.5 * k)} ${r1(-0.6 * k)})"/>`;
    return { far, near };
  }
  // 線の 太さ（小さい 恐竜は ほそく）
  const lineK = (a) => Math.max(0.45, Math.min(1, a.box[2] / 240));
  function svg(dino, { have = null, stand = true, uid = "d" } = {}) {
    const a = dino.art, els = build(a), ids = a.parts.map((p) => p.id), H = a.box;
    const own = (id) => !have || have.includes(id);
    let far = "", near = "";
    const k = lineK(a);
    for (const id of ids) { const p = paint(els, id, own(id), k); far += p.far; near += p.near; }
    // 展示の 台と ささえ（⑤ 博物館）
    let st = "";
    if (stand) { st += `<rect x="${r1(H[0] + 4)}" y="0" width="${r1(H[2] - 8)}" height="${r1(7 * k)}" rx="${r1(2.5 * k)}" fill="#8C7A62" stroke="${INK}" stroke-width="${r1(1.4 * k)}"/><rect x="${r1(H[0] + 10)}" y="${r1(6.5 * k)}" width="${r1(H[2] - 20)}" height="${r1(3 * k)}" fill="#6E5E48"/>`; for (const x of a.posts || []) st += `<path d="M${P(x[0], 0)} L${P(x[0], x[1])}" stroke="#6E6A66" stroke-width="${r1(1.6 * k)}"/><circle cx="${r1(x[0])}" cy="${r1(x[1])}" r="${r1(1.6 * k)}" fill="#6E6A66"/>`; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${H.map(r1).join(" ")}">${st}${far}${near}</svg>`;
  }
  // 1つの 部品だけ（ぎりぎりで 切りぬく。box は データに 書いて おく: dino.art.partBox[partId]）
  function partSvg(dino, partId) {
    const a = dino.art, els = build(a), b = (a.partBox && a.partBox[partId]) || a.box, k = lineK(a) * Math.max(0.4, Math.min(1, Math.max(b[2], b[3] * 1.6) / (a.box[2] * 0.55))), p = paint(els, partId, true, k);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.map(r1).join(" ")}">${p.far}${p.near}</svg>`;
  }
  return { svg, partSvg, build };
})();
