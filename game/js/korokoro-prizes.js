// ころころ フルーツの スコア モードの ごほうび家具（オーナーの FB 2026-09-30「スコアに 応じて お金の ほか、ハイスコアでは フルーツに ちなんだ 特別な ハイクオリティ家具も」）。
// スコアの めやす（KOROKORO_PRIZES の score）に はじめて とどくと、その 家具を 1つ もらえる（下の めやすで まだの ものも いっしょに）。
// 家具は FurnModels の 立体モデル（HomeDesign と おなじ 投影・うしろ → てまえ の じゅんに 描く）と FurnLive の さわる うごき。
// うけとった きろくは Save.d.shops.korokoro.gifts（id → もらった 日）。家具の 数は Save.d.furn（ほかの 家具と おなじ）。
const KOROKORO_PRIZES = Object.freeze([
  { id: "koro_cherry_lamp", score: 200, name: "さくらんぼの ランプ", w: 46, depth: 40, h: 100, comfort: 6, desc: "つやつやの さくらんぼが 2つ ぶらさがった ランプ。タップすると ぽっと あかるく なるよ。" },
  { id: "koro_strawberry_sofa", score: 500, name: "いちごの ソファ", w: 84, depth: 56, h: 72, comfort: 7, desc: "つぶつぶの いちごの ふかふか ソファ。せもたれの うえに みどりの はっぱ。" },
  { id: "koro_mikan_table", score: 800, name: "みかんの テーブル", w: 72, depth: 72, h: 56, comfort: 7, desc: "わぎりの みかんが テーブルに なった。うえの ちいさな みかんが ころころ するよ。" },
  { id: "koro_apple_shelf", score: 1200, name: "りんごの たな", w: 82, depth: 38, h: 112, comfort: 8, desc: "りんごの かたちの かざりだな。まどの なかに ちいさな くだものが ならんで いるよ。" },
  { id: "koro_pear_cushion", score: 1800, name: "なしの クッション", w: 64, depth: 58, h: 68, comfort: 9, desc: "なしの かたちの おおきな クッション。すわると ぽふっと しずむよ。" },
  { id: "koro_fruit_tower", score: 2500, name: "ころころ タワー", w: 60, depth: 60, h: 142, comfort: 10, desc: "スコア 2500てんの あかし。ガラスの なかで 8しゅの たまが ころころ はずむよ。" },
].map((p) => Object.freeze(p)));

const KorokoroPrizes = (() => {
  for (const p of KOROKORO_PRIZES) {
    const f = { id: p.id, name: p.name, price: 0, rare: true, koroPrize: true, kind: "floor", w: p.w, depth: p.depth, h: p.h, comfort: p.comfort, interactive: true, desc: p.desc };
    FURNITURE.push(f); FURN_INDEX[p.id] = f;
    FURN_ART[p.id] = () => HomeDesign.model(p.id).full;
  }

  // ---- もらう ----
  const box = () => { const st = Save.d.shops.korokoro; if (!st.gifts || typeof st.gifts !== "object") st.gifts = {}; return st.gifts; };
  const got = (id) => !!box()[id];
  // score（と これまでの ハイスコア）で とどいた まだの ごほうびを わたす。わたした ものの ならびを かえす
  function claim(score, day = U.today()) {
    const best = Math.max(Number(score) || 0, Save.d.shops.korokoro.hi || 0), g = box(), out = [];
    for (const p of KOROKORO_PRIZES) {
      if (best < p.score || g[p.id]) continue;
      g[p.id] = String(day); Save.d.furn[p.id] = (Save.d.furn[p.id] || 0) + 1; out.push(p);
    }
    if (out.length) Save.mark();
    return out;
  }
  // つぎの めやす（ぜんぶ もらって いたら null）
  const next = () => KOROKORO_PRIZES.find((p) => !got(p.id)) || null;

  // ---- 立体モデル（FurnModels の kit。x は よこ・y は おく〔-d〜0〕・z は 上）----
  const Sh = FurnModels.shapes, TAU = Math.PI * 2;
  const WOOD = ["#C9A26E", "#A88457", "#DDBD8A"], BRASS = ["#D9B45C", "#B38F3F", "#EACB7E"], GREEN = ["#7CC46E", "#5E9A4E", "#9BD68B"];
  const ln = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // はっぱ（下の まん中が 0,0・上は -y）
  const leafSvg = (len = 16, rot = -30, fill = "#7CC46E") => `<g transform="rotate(${rot})"><path d="M0,0 C${len * 0.3},${-len * 0.5} ${len * 0.75},${-len * 0.55} ${len},0 C${len * 0.75},${len * 0.5} ${len * 0.3},${len * 0.45} 0,0 Z" fill="${fill}" ${ln(1.4)}/><path d="M1,0 H${f2(len * 0.8)}" stroke="#4E8A42" stroke-width="1.1" stroke-linecap="round"/></g>`;
  // ころころ フルーツの 玉の 絵を (x, y, z) を まんなかに（R は 当たりの 円の 半径）。at は 下の まん中が 点なので、玉の 下の はしを わたす
  const koroBall = (k, tier, x, y, z, R, emo = "happy") => {
    const size = R * 2 * KorokoroArt.cropOf(tier), inner = KorokoroArt.svg(tier, emo, Math.max(24, size * 2)).replace("<svg ", `<svg x="${f2(-size / 2)}" y="${f2(-size)}" width="${f2(size)}" height="${f2(size)}" `);
    return k.at(x, y, z - size / 2, inner, size / 2, size, false);
  };
  // 3D の 2じ曲線（p0 → p2・p1 で まがる）の 点
  const curve = (p0, p1, p2, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return [0, 1, 2].map((j) => a * p0[j] + b * p1[j] + c * p2[j]); });
  // つやの ある 玉（くだもの）の いろ: [あかるい, まんなか, くらい, ふち]
  const FR_COL = { cherry: ["#FFC2C4", "#EE5A63", "#C9303C", "#9C1F2B"], mikan: ["#FFE1A6", "#F9A83E", "#E5831E", "#C2641A"], apple: ["#FFB8B0", "#EC5A5E", "#C93A42", "#9E2530"], pear: ["#FFF6C8", "#EFD983", "#D5B75C", "#B59A48"] };
  const shiny = (k, name) => { const c = FR_COL[name]; return k.rg([[0, c[0]], [0.3, c[1]], [0.75, c[2]], [1, c[3]]], 0.34, 0.3, 0.82); };
  // くだものの ヘタ（玉の てっぺんの くぼみ）
  const dimple = (k, x, y, z, R) => { const q = k.P(x, y, z + R * 0.78); return `<path d="M${f2(q.x - R * 0.34)},${f2(q.y + 0.6)} Q${f2(q.x)},${f2(q.y + R * 0.28)} ${f2(q.x + R * 0.34)},${f2(q.y + 0.6)}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>`; };
  // いちごの つぶ（面の 上に ならべる）
  const seeds = (k, m, pts, r = 1.5) => pts.map(([a, b]) => k.shape(m, Sh.ov(a, b, r, r * 1.5, 10), "#FCE58C", 0.7)).join("");
  // さくらんぼの ランプの 玉の いち（FurnLive でも つかう）
  const CHERRY = [[-15, -16, 57, 11], [14, -24, 55, 11]];
  // ころころ タワーの なかの 玉（だん, x, y, z, 半径）。したから うえへ
  // ころころ タワーの なかの 玉 [だん, よこ（画面の px・まんなか 0）, 高さ z, 半径]。本物の 物理（KorokoroWorld・がったい なし）で 22こ おとして つみかさねた ならび（はこの はば 100 → つつの はば 47px）
  const TOWER = [[6, 14.66, 21.99, 8.99], [7, -12.49, 24.16, 11.16], [5, 3.32, 33.65, 7.28], [3, 18.92, 35.01, 4.73], [2, 12.21, 39.98, 3.64], [4, -17.78, 40.34, 5.87], [1, 6.61, 43.21, 2.84], [5, -5.57, 45.18, 7.28],
    [0, 3.63, 47.21, 2.18], [4, 17.78, 47.68, 5.87], [3, -18.92, 50.87, 4.73], [2, -11.36, 54.44, 3.64], [1, 20.81, 55.83, 2.84], [0, -21.47, 57.28, 2.18], [6, 6.98, 57.86, 8.99], [2, -16.25, 59.84, 3.64],
    [1, 18.39, 60.96, 2.84], [4, -7, 62.89, 5.87], [0, 21.47, 64.91, 2.18], [2, 15.8, 66.9, 3.64], [3, 0.77, 70.1, 4.73], [1, 20.81, 71, 2.84]];
  // 画面の よこ u（px）→ つつの まんなかを とおる 画面に むいた 面の (x, y)。したの 玉から 描く（うえの 玉が すこし かさなる）
  const towerXY = (u) => [u / (2 * HomeDesign.A), -30 - u / (2 * HomeDesign.A)];

  const M = {};
  // 1. さくらんぼの ランプ: 木の だいに 真ちゅうの はしら。てっぺんで 2本の くきに わかれ、つやつやの さくらんぼが ひかる
  M.koro_cherry_lamp = (k) => {
    const { cyl, rod, ball, shadow, at, L, frustum } = k, cy = -20;
    let s = shadow(0.13, 6, 14);
    s += cyl(0, cy, 0, 15.5, 4.5, WOOD[1], WOOD[2]) + k.lineOn(k.TP(4.6), Sh.close(Sh.ov(0, cy, 12.5, 12.5, 30)), "#B38F5E", 1.1, 'stroke-dasharray="2.2 2"');
    s += frustum(0, cy, 4.5, 9, 9, 6, BRASS[1], BRASS[0]) + ball(9, cy + 6, 6.5, 2.2, "#E8545E", 1, 0.5);
    s += rod([[0, cy, 9], [0, cy, 86]], BRASS[0], 3.2) + ball(0, cy, 30, 2.4, BRASS[2], 1, 0.4) + ball(0, cy, 86, 3, BRASS[0], 1.1, 0.5);
    const [a, b] = CHERRY;
    // ひだりの さくらんぼ（おく）→ はっぱ → みぎの さくらんぼ（てまえ）
    s += rod(curve([0, cy, 88], [-15, cy + 3, 94], [a[0], a[1], a[2] + a[3] * 0.85], 12), "#6E8C3A", 1.8);
    s += L(ball(a[0], a[1], a[2], a[3], shiny(k, "cherry"), 1.6, 0.6) + dimple(k, a[0], a[1], a[2], a[3]));
    s += at(0, cy, 89, leafSvg(19, -24) + leafSvg(14, -150, "#8FCE7E"), 16, 14);
    s += rod(curve([0, cy, 88], [14, cy - 3, 92], [b[0], b[1], b[2] + b[3] * 0.85], 12), "#6E8C3A", 1.8);
    s += L(ball(b[0], b[1], b[2], b[3], shiny(k, "cherry"), 1.6, 0.6) + dimple(k, b[0], b[1], b[2], b[3]));
    return s;
  };
  // 2. いちごの ソファ: あかい いちごの せもたれと ざぶとん・つぶつぶ・みどりの はっぱの かんむり・いちごの クッション
  M.koro_strawberry_sofa = (k) => {
    const { cyl, prism, shape, FR, SD, TP, lineOn, slab, onP, shadow } = k, rr = Sh.rr;
    const R = ["#EE5A64", "#C73E4A", "#F7858D"], RL = "#F99AA2";
    let s = shadow(0.12, 3, 14);
    for (const [x, y] of k.byDepth([[-34, -48], [-34, -8], [34, -48], [34, -8]])) s += cyl(x, y, 0, 3.4, 7, WOOD[1], WOOD[2], 1.3, 16);
    s += prism(TP(21), rr(-41, -54, 82, 52, 12), [0, 0, -14], R[2], R[1]) + lineOn(FR(-1.8), [[-36, 14], [36, 14]], R[1], 1.1, 'stroke-dasharray="2.4 2.4"');
    // せもたれ（上が まるい）・つぶ・はっぱの かんむり
    s += prism(FR(-44), rr(-40, 16, 80, 52, 24), [0, -10, 0], R[0], R[1]);
    s += seeds(k, FR(-43.9), [[-28, 30], [-16, 38], [-4, 30], [8, 38], [20, 30], [30, 40], [-30, 46], [-18, 54], [-6, 46], [6, 54], [18, 46], [28, 54], [-10, 60], [12, 61]], 1.5);
    // はっぱ（ヘタ）: せもたれの うえの ふちから まえへ たれさがる
    const crown = [[-38, 66], [38, 66]];
    for (let i = 8; i >= 0; i--) { const x = -34 + i * 8.5; crown.push([x + 4.2, 62], [x, 62 - (i % 2 ? 7 : 11)], [x - 4.2, 62]); }
    s += shape(FR(-43.7), crown, GREEN[0], 1.3) + lineOn(FR(-43.6), [[-32, 64], [32, 64]], GREEN[1], 1.1);
    s += k.rod([[0, -49, 76], [1, -49, 82], [4, -49, 86]], "#6E8C3A", 2);
    // ひだりの ひじかけ（おく）→ ざぶとん → クッション → みぎの ひじかけ（てまえ）
    s += prism(SD(-30), rr(-52, 12, 50, 30, 13), [-11, 0, 0], R[0], R[2]) + seeds(k, SD(-29.9), [[-40, 26], [-28, 32], [-16, 26], [-34, 36]], 1.3);
    for (const x0 of [-30, 1]) s += prism(TP(31), rr(x0, -43, 29, 40, 9), [0, 0, -10], RL, R[0]) + lineOn(TP(31.1), Sh.close(rr(x0 + 2.5, -40.5, 24, 35, 7)), "#FFC2C7", 1, 'stroke-dasharray="2 2"');
    const c = slab([-24, -34, 31], [1, 0.32, 0], [0.1, -0.35, 1], [[9, 0], [2, 4], [0, 10], [2, 16], [9, 19], [16, 16], [18, 10], [16, 4]], 4, "#F0606B", "#C9404B", 1.3);
    s += c.s + seeds(k, c.m, [[6, 8], [12, 8], [9, 13], [5, 14], [13, 14]], 0.9) + shape(c.m, [[4, 16.5], [9, 21.5], [14, 16.5], [9, 18]], GREEN[0], 1);
    s += prism(SD(42), rr(-52, 12, 50, 30, 13), [-11, 0, 0], R[0], R[2]) + seeds(k, SD(42.1), [[-40, 26], [-28, 32], [-16, 26], [-34, 36], [-22, 38]], 1.3);
    s += onP(SD(42.2), -44, 40, 14, 10, `<path d="M0,10 L3,3 L7,8 L11,2 L14,10 Z" fill="${GREEN[0]}" ${ln(1.1)}/>`);
    return s;
  };
  // 3. みかんの テーブル: わぎりの みかんの てんばん（ふさ・しろい すじ）・しろい あし・うえに ちいさな みかん
  M.koro_mikan_table = (k) => {
    const { cyl, shape, TP, lineOn, shadow, ball, at, L } = k, cx = 0, cy = -36;
    let s = shadow(0.12, 10, 30);
    s += cyl(cx, cy, 0, 18, 4, WOOD[1], WOOD[2]) + cyl(cx, cy, 4, 7, 38, "#EFDDBA", "#FFF4DC");
    s += cyl(cx, cy, 42, 34, 7, "#E88A2A", "#F7A43A") + lineOn(TP(49.05), Sh.close(Sh.ov(cx, cy, 32.4, 32.4, 64)), "#FFD27F", 1.2);
    s += shape(TP(49.1), Sh.ov(cx, cy, 30.5, 30.5, 64), "#FFF1D4", 1);
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * TAU + 0.05, a1 = ((i + 1) / 10) * TAU - 0.05, pts = [[cx + Math.cos(a0) * 5.5, cy + Math.sin(a0) * 5.5]];
      for (let j = 0; j <= 8; j++) { const a = a0 + ((a1 - a0) * j) / 8; pts.push([cx + Math.cos(a) * 28.5, cy + Math.sin(a) * 28.5]); }
      pts.push([cx + Math.cos(a1) * 5.5, cy + Math.sin(a1) * 5.5]);
      s += shape(TP(49.2), pts, i % 2 ? "#FFC458" : "#FFB93F", 0.9);
      const am = (a0 + a1) / 2;
      s += lineOn(TP(49.3), [[cx + Math.cos(am) * 10, cy + Math.sin(am) * 10], [cx + Math.cos(am) * 24, cy + Math.sin(am) * 24]], "#FFE3A0", 1.4);
    }
    s += shape(TP(49.3), Sh.ov(cx, cy, 5, 5, 20), "#FFF6E3", 1);
    s += L(ball(14, -28, 56.4, 7.2, shiny(k, "mikan"), 1.4, 0.55) + at(14, -28, 62.6, `<path d="M0,0 V-3" stroke="#6E8C3A" stroke-width="1.8" stroke-linecap="round"/>` + leafSvg(9, -20), 8, 8));
    return s;
  };
  // 4. りんごの たな: りんごの かたちの たな（まるい まど 2つ・なかに ちいさな くだもの）・くきと はっぱ
  M.koro_apple_shelf = (k) => {
    const { box, prism, shape, FR, lineOn, shadow, ball, at, rod, smooth } = k, rr = Sh.rr;
    const APPLE = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * TAU, c = Math.cos(t), sn = Math.sin(t);
      // りんごの りんかく: 上に くぼみ・下は すこし へこむ
      const r = 1 - 0.13 * Math.exp(-(((t - Math.PI / 2) / 0.32) ** 2)) - 0.05 * Math.exp(-(((t - (3 * Math.PI) / 2) / 0.3) ** 2));
      APPLE.push([c * 40 * r, 55 + sn * 48 * r * (sn > 0 ? 1 : 1.02)]);
    }
    let s = shadow(0.12, 3, 12) + box(-34, -30, 68, 26, 0, 6, WOOD);
    s += prism(FR(-6), APPLE, [0, -20, 0], "#E9525A", "#B83440");
    s += shape(FR(-5.9), [[-28, 88], [-20, 97], [-8, 100], [-16, 92], [-24, 82]], "#FFFFFF", 0, 'fill-opacity=".45"');
    // まど（おくの かべ・よこの かべ・たなの いた）
    for (const [x, z, w, h] of [[-25, 60, 50, 26], [-29, 22, 58, 28]]) {
      s += shape(FR(-5.8), rr(x, z, w, h, 11), "#7A2A30", 1.4) + shape(FR(-5.7), rr(x + 2.5, z + 3, w - 5, h - 5, 9), "#FBE9CF", 0) + shape(FR(-5.6), rr(x + 2.5, z, w - 5, 4, 1.5), WOOD[2], 1);
    }
    // うえの まど: りんご・さくらんぼ・みかん
    s += ball(-12, -8, 70, 6, shiny(k, "apple"), 1.2, 0.5) + ball(1, -8, 68, 4.6, shiny(k, "mikan"), 1.2, 0.5);
    s += ball(10, -8, 67.5, 3.3, shiny(k, "cherry"), 1, 0.5) + ball(15, -8, 67.5, 3.3, shiny(k, "cherry"), 1, 0.5) + rod([[10, -8, 70.5], [12.5, -8, 76], [15, -8, 70.5]], "#6E8C3A", 0.9);
    // したの まど: いちご・なし・ちいさな ごじ
    s += koroBall(k, 7, -12, -8, 32, 7.2, "happy") + koroBall(k, 1, 4, -8, 29.6, 4.6, "normal") + ball(16, -8, 30.2, 5.2, shiny(k, "pear"), 1.2, 0.5);
    s += rod([[0, -16, 101], [1, -16, 108], [4, -16, 114]], "#7A5634", 2.6) + at(3, -16, 110, leafSvg(17, -26), 16, 12);
    return s;
  };
  // 5. なしの クッション: なしの かたちの ふかふか（すわる くぼみ・ぬいめ・そばかす・くきと はっぱ）
  M.koro_pear_cushion = (k) => {
    const { shadow, at, rg } = k;
    const body = rg([[0, "#FFF8D2"], [0.35, "#F1DC8E"], [0.8, "#D8BC62"], [1, "#BFA24E"]], 0.38, 0.32, 0.8);
    const pear = "M0,0 C-24,0 -33,-11 -33,-25 C-33,-39 -24,-45 -18,-50 C-13,-54 -14,-62 0,-64 C14,-62 13,-54 18,-50 C24,-45 33,-39 33,-25 C33,-11 24,0 0,0 Z";
    const dots = [[-18, -18], [-8, -10], [12, -14], [22, -24], [-24, -30], [8, -46], [-8, -52], [16, -32], [-2, -22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#B8994B" opacity=".75"/>`).join("");
    const art = `<path d="${pear}" fill="${body}" ${ln(1.8)}/>` +
      `<path d="M-30,-14 C-22,-2 22,-2 30,-14 C24,-3 12,0 0,0 C-12,0 -24,-3 -30,-14 Z" fill="#B59A48" opacity=".35"/>` +
      `<path d="M-9,-60 C-20,-46 -24,-26 -16,-2 M9,-60 C20,-46 24,-26 16,-2" fill="none" stroke="#C9AE5A" stroke-width="1.1" stroke-dasharray="2.2 2.2" opacity=".9"/>` +
      `<path d="M-28,-20 C-20,-8 20,-8 28,-20" fill="none" stroke="#C9AE5A" stroke-width="1.2" stroke-dasharray="2.4 2.2"/>` +
      `<ellipse cx="3" cy="-33" rx="17" ry="7.5" fill="#FFF6C9" opacity=".55"/><path d="M-13,-31 Q3,-24 19,-31" fill="none" stroke="#C9AE5A" stroke-width="1.4" stroke-linecap="round"/>` +
      `<ellipse cx="-17" cy="-40" rx="6" ry="3.4" transform="rotate(-35 -17 -40)" fill="#FFFFFF" opacity=".6"/>` + dots +
      `<path d="M0,-63 C-1,-68 1,-72 5,-74" fill="none" stroke="#7A5634" stroke-width="2.6" stroke-linecap="round"/>` + `<g transform="translate(3 -71)">${leafSvg(15, -18)}</g>`;
    return shadow(0.13, 6, 26) + at(0, -29, 0, art, 36, 78);
  };
  // 6. ころころ タワー: 木と 真ちゅうの だい・ガラスの つつに 8しゅの 玉・ごじの かざりの ふた
  M.koro_fruit_tower = (k) => {
    const { cyl, shadow, frustum, ball, P, L } = k, cy = -30, R = 19, z0 = 13, z1 = 112;
    let s = shadow(0.13, 6, 26);
    s += cyl(0, cy, 0, 24, 9, WOOD[1], WOOD[2]) + k.lineOn(k.TP(9.05), Sh.close(Sh.ov(0, cy, 21, 21, 40)), "#B38F5E", 1.1, 'stroke-dasharray="2.2 2"') + cyl(0, cy, 9, 21, 4, BRASS[1], BRASS[0]);
    // ガラスの おく（うすい みずいろ）
    const A = HomeDesign.A, Bb = HomeDesign.B, rx = R * Math.SQRT2 * A, ry = R * Math.SQRT2 * Bb, T = P(0, cy, z1), Bt = P(0, cy, z0);
    P(-R, cy, z1); P(R, cy, z1); P(0, cy - R, z1); P(0, cy + R, z0);
    const tube = `M${f2(T.x - rx)},${f2(T.y)} L${f2(Bt.x - rx)},${f2(Bt.y)} A${f2(rx)},${f2(ry)} 0 0 0 ${f2(Bt.x + rx)},${f2(Bt.y)} L${f2(T.x + rx)},${f2(T.y)} A${f2(rx)},${f2(ry)} 0 0 0 ${f2(T.x - rx)},${f2(T.y)} Z`;
    s += `<path d="${tube}" fill="#DDF1F8" fill-opacity=".55" stroke="none"/>`;
    s += `<ellipse cx="${f2(Bt.x)}" cy="${f2(Bt.y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#C9E6F1" ${ln(1.2)}/>`;
    // なかの 玉（うごく ときは FurnLive が 描く）
    s += L(TOWER.map(([t, u, z, r]) => { const [x, y] = towerXY(u); return koroBall(k, t, x, y, z, r, t >= 5 && t < 7 ? "happy" : "normal"); }).join(""));
    s += towerGlass(T, Bt, rx, ry, !k.opts.live);
    // ふた: 真ちゅうの わ・ドーム・ごじの かざり
    s += cyl(0, cy, z1, 21, 5, BRASS[1], BRASS[0]) + frustum(0, cy, z1 + 5, 19, z1 + 14, 9, BRASS[0], BRASS[2]) + ball(0, cy, z1 + 16, 3.4, BRASS[2], 1.1, 0.5);
    s += koroBall(k, 7, 0, cy, z1 + 26, 8.4, "normal");
    // ごじの おうかん
    s += k.at(0, cy, z1 + 38, `<path d="M-7,0 L-8,-8 L-4,-4 L0,-10 L4,-4 L8,-8 L7,0 Z" fill="${BRASS[2]}" ${ln(1.3)}/><circle cx="0" cy="-10" r="1.6" fill="#E8545E" ${ln(0.9)}/><circle cx="-8" cy="-8" r="1.2" fill="#9CC7E6" ${ln(0.8)}/><circle cx="8" cy="-8" r="1.2" fill="#9CC7E6" ${ln(0.8)}/>`, 10, 12, false);
    return s;
  };
  // ガラスの てまえ（つやの すじ・ふち）。モデルと FurnLive で おなじ 形
  const towerGlass = (T, Bt, rx, ry, shine = true) => (shine ? `<path d="M${f2(T.x - rx * 0.72)},${f2(T.y + ry * 0.62)} L${f2(Bt.x - rx * 0.72)},${f2(Bt.y + ry * 0.62)}" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M${f2(T.x - rx * 0.45)},${f2(T.y + ry * 0.85)} L${f2(Bt.x - rx * 0.45)},${f2(Bt.y + ry * 0.85)}" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>` : "") +
    `<path d="M${f2(T.x - rx)},${f2(T.y)} L${f2(Bt.x - rx)},${f2(Bt.y)} M${f2(T.x + rx)},${f2(T.y)} L${f2(Bt.x + rx)},${f2(Bt.y)}" ${ln(1.6)}/>` +
    `<path d="M${f2(Bt.x - rx)},${f2(Bt.y)} A${f2(rx)},${f2(ry)} 0 0 0 ${f2(Bt.x + rx)},${f2(Bt.y)}" fill="none" ${ln(1.6)}/>` +
    `<ellipse cx="${f2(T.x)}" cy="${f2(T.y)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#E9F6FB" fill-opacity=".35" ${ln(1.4)}/>`;
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- さわる（FurnLive）----
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  // いちばん ちかくの 子が ひとこと
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const since = (st) => G.t - st.t0;
  // つやの ある 玉を canvas に（モデルの shiny と おなじ いろ）
  const shinyBall = (ctx, x, y, rr, name, lit = 0) => {
    const c = FR_COL[name], g = ctx.createRadialGradient(x - rr * 0.34, y - rr * 0.36, rr * 0.08, x, y, rr);
    g.addColorStop(0, lit ? "#FFF1EF" : c[0]); g.addColorStop(0.3, lit ? shade(c[1], 0.25) : c[1]); g.addColorStop(0.75, c[2]); g.addColorStop(1, c[3]);
    ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, rr * 0.13); ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.ellipse(x - rr * 0.36, y - rr * 0.4, rr * 0.3, rr * 0.17, -0.6, 0, TAU); ctx.fill();
  };
  // タップで 出る きらきら（家具の 点 (x, y, z) の まわり）
  const sparkle = (ctx, P, st, x, y, z, dur = 1) => { const k = since(st) / dur; if (k < 0 || k >= 1) return; const c = P(x, y, z); ctx.save(); ctx.globalAlpha = 1 - k; FX.sparkles(ctx, c.x, c.y, k); ctx.restore(); };
  const hearts = (ctx, P, st, x, y, z, dur = 1.4) => { const k = since(st) / dur; if (k < 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { const c = P(x - 10 + i * 10, y, z + k * 26 + i * 4); FX.heart(ctx, c.x + Math.sin(k * 7 + i) * 4 * P.s, c.y, 6 * P.s, ["#F06292", "#F7A1B0", "#FFB3C1"][i]); } ctx.restore(); };
  const tone = (list, step = 0.09, type = "triangle", vol = 0.12) => { if (Sound.ctx && Save.d?.settings?.se) list.forEach((f, i) => Sound.tone(Sound.seGain, { f, t: i * step, dur: 0.12, type, vol, a: 0.005, r: 0.3 })); };

  // 1. さくらんぼの ランプ: タップで あかりの オン・オフ（よるは はじめから つく）。さくらんぼが ゆれて ひかる
  const cherryOn = (st) => (st.on == null ? DayTint.isNight() : st.on);
  FurnLive.register("koro_cherry_lamp", {
    isOn: cherryOn,
    tap(sc, it, st) { st.on = !cherryOn(st); st.t0 = G.t; Sound.se(st.on ? "ding" : "tap"); say(sc, it, st.on ? "さくらんぼが ぴかっ！" : "おやすみ さくらんぼ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), on = cherryOn(st), k = Math.min(1, since(st) * 3), sw = Math.sin(since(st) * 5) * Math.exp(-since(st) * 1.6) * 3;
      for (const [x, y, z, R] of CHERRY) { const c = P(x + sw, y, z); shinyBall(ctx, c.x, c.y, R * 1.23 * P.s, "cherry", on); }
      if (!on) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [x, y, z] of CHERRY) { const c = P(x + sw, y, z); glow(ctx, c.x, c.y, 26 * P.s, "255,140,150", 0.35 * k); }
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!cherryOn(st)) return; const P = mapper(sc, it, r), p = P(0, -20, 56); glow(ctx, p.x, p.y, 110 * P.s, "255,150,160", 0.26); },
  }, true);
  // 2. いちごの ソファ: すわると ふかふか（ハートと ひとこと）
  FurnLive.register("koro_strawberry_sofa", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; Sound.se("jump"); tone([523, 659, 784]); say(sc, it, ["いちごの ソファ、ふかふか〜", "あまい においが しそう", "つぶつぶ かわいい！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) { const P = mapper(sc, it, r); hearts(ctx, P, st, 0, -30, 44); },
  });
  // 3. みかんの テーブル: タップで うえの みかんが テーブルを ころころ ひとまわり
  const MIKAN = { cx: 0, cy: -36, rad: Math.hypot(14, 8), a0: Math.atan2(8, 14), z: 56.4, R: 7.2 };
  FurnLive.register("koro_mikan_table", {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("pop"); tone([392, 440, 494, 523, 587], 0.12, "sine", 0.1); say(sc, it, "みかんが ころころ〜", "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), k = t < 1.8 ? U.ease.inOut(t / 1.8) : 1, a = MIKAN.a0 + k * TAU, spin = k * TAU * 3;
      const c = P(MIKAN.cx + Math.cos(a) * MIKAN.rad, MIKAN.cy + Math.sin(a) * MIKAN.rad, MIKAN.z), rr = MIKAN.R * 1.23 * P.s;
      shinyBall(ctx, c.x, c.y, rr, "mikan");
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(spin); ctx.strokeStyle = "#6E8C3A"; ctx.lineWidth = 1.6 * P.s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, -rr * 0.9); ctx.lineTo(0, -rr * 1.2); ctx.stroke();
      ctx.fillStyle = "#7CC46E"; ctx.strokeStyle = INK; ctx.lineWidth = 1.1 * P.s; ctx.beginPath(); ctx.ellipse(rr * 0.42, -rr * 1.22, rr * 0.48, rr * 0.22, -0.35, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    },
  }, true);
  // 4. りんごの たな: タップで まどの くだものが ぽろん（きらきら・おと）
  FurnLive.register("koro_apple_shelf", {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("sparkle"); tone([659, 784, 988, 1319], 0.08); say(sc, it, "りんごの たな、すてき！", "heart"); },
    draw(ctx, sc, it, r, st) { const P = mapper(sc, it, r); sparkle(ctx, P, st, 0, -8, 76, 1); sparkle(ctx, P, st, 0, -8, 40, 1.1); },
  });
  // 5. なしの クッション: タップで ぽふっ（けむりの わ・ひとこと）
  FurnLive.register("koro_pear_cushion", {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("pop"); tone([330, 262], 0.1, "sine", 0.14); say(sc, it, "ぽふっ！ ふかふか〜", "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st) / 0.9; if (k < 0 || k >= 1) return;
      const P = mapper(sc, it, r), c = P(0, -29, 8);
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * P.s;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, d = (30 + k * 16) * P.s; ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.45, (5 - k * 3) * P.s, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.font = `900 ${Math.round(13 * P.s)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.fillText("ぽふっ", c.x, c.y - (70 + k * 12) * P.s);
      ctx.restore();
    },
  });
  // 6. ころころ タワー: タップで なかの 玉が ぽんぽん はずむ（ころころ フルーツの おと）。ガラスの つやは 玉の うえ
  FurnLive.register("koro_fruit_tower", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; for (let i = 0; i < 4; i++) setTimeout(() => KorokoroSound.merge(3 + ((i * 2 + st.n) % 5)), i * 110); say(sc, it, ["ころころ〜！", "ごじが いちばん うえ！", "ぜんぶ そろってる！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st);
      TOWER.forEach(([tier, u, z, R], i) => {
        const [x, y] = towerXY(u), ph = t - i * 0.025, amp = ph > 0 && ph < 2.2 ? (6 + (i % 4) * 2.5) * Math.exp(-ph * 2.2) * Math.abs(Math.sin(ph * 9 + i)) : 0;
        const c = P(x, y, z + amp);
        KorokoroArt.draw(ctx, tier, tier >= 5 && tier < 7 ? "happy" : amp > 2 ? "surprise" : "normal", c.x, c.y, R * P.s, amp > 1 ? Math.sin(ph * 12 + i) * 0.25 : 0);
      });
      // ガラスの つや（玉の うえ）
      const A = HomeDesign.A, Bb = HomeDesign.B, rx = 19 * Math.SQRT2 * A * P.s, ry = 19 * Math.SQRT2 * Bb * P.s, T = P(0, -30, 112), Bt = P(0, -30, 13);
      ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3.2 * P.s; ctx.beginPath(); ctx.moveTo(T.x - rx * 0.72, T.y + ry * 0.62); ctx.lineTo(Bt.x - rx * 0.72, Bt.y + ry * 0.62); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.6 * P.s; ctx.beginPath(); ctx.moveTo(T.x - rx * 0.45, T.y + ry * 0.85); ctx.lineTo(Bt.x - rx * 0.45, Bt.y + ry * 0.85); ctx.stroke(); ctx.restore();
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), p = P(0, -30, 60); glow(ctx, p.x, p.y, 70 * P.s, "255,220,150", 0.18); },
  }, true);

  // ---- 画面に だす 絵（けっかの まど・ずかん）----
  const svg = (id) => HomeDesign.model(id).full;
  return { claim, got, next, svg, list: () => KOROKORO_PRIZES.map((p) => ({ ...p, own: got(p.id) })) };
})();
