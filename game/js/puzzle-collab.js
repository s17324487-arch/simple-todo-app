// ごわが × なかよしパズル の コラボ グッズ（オーナーの FB 2026-09-30「なかよしパズルの 景品に 30000・50000・80000・100000・150000pt を 追加。
// ごわがと なかよしパズルの コラボグッズとし、限定洋服系や 限定家具系に」）。1かいの スコアでは とどかない ので、あそんだ スコアの ごうけい（つみたて）で もらう（CollabGoods）。
// デザインは なかよしパズルの 見た目（よぞらの こん・きん・パステルの まるい ピースに 3人・✦ ☾ ◆）に そろえた。
// 服 2つ（WEAR.pc_hoodie・WEAR.pc_band。IkeWear と おなじ かさねで そで・うしろ・よこむきも）・家具 3つ（FurnModels の 立体・FurnLive の さわる うごき）。
const PuzzleCollab = (() => {
  const NAVY = "#2F3A5C", NAVY_D = "#232C47", NAVY_L = "#3E4B73", GOLD = "#E8C77A", GOLD_D = "#B8954A", GOLD_L = "#F7E6B0";
  // なかよしパズルの ピースの いろ（scene-puzzle.js と おなじ）。0〜2 は わんこ・がちゃん・ごじ
  const PIECE = ["#E8B8CA", "#EDDB9B", "#B9D8C8", "#B6CEE8", "#C7B5E1", "#E9BC9D"], TAU = Math.PI * 2;
  const ITEMS = [
    { id: "pc_hoodie", need: 30000, kind: "wear", slot: "body", wear: "pc_hoodie", col: [NAVY, GOLD], st: { sp: 3, spd: 1 }, name: "なかよしパズル パーカー",
      desc: "よぞらいろの パーカー。むねに 3にんの ピースを つないだ もよう、せなかに おおきな ほしと つき。" },
    { id: "pc_cushion", need: 50000, kind: "furn", w: 96, depth: 58, h: 60, comfort: 9, name: "ごわが パズル クッション",
      desc: "パズルの ピースが そのまま クッションに。わんこ・がちゃん・ごじの まるい 3こ。タップで ぽよん。" },
    { id: "pc_band", need: 80000, kind: "wear", slot: "head", wear: "pc_band", col: [GOLD, NAVY], st: { sp: 3 }, name: "ほしの パズル カチューシャ",
      desc: "きんいろの カチューシャ。ほしと つきと ピースの かざりが ゆれる。" },
    { id: "pc_table", need: 100000, kind: "furn", w: 100, depth: 100, h: 46, comfort: 9, name: "なかよしパズル テーブル",
      desc: "6×6 の ばんめんの テーブル。タップすると ピースが つながって ひかるよ。" },
    { id: "pc_arcade", need: 150000, kind: "furn", w: 72, depth: 64, h: 152, comfort: 10, name: "なかよしパズル アーケード",
      desc: "15まんてんの あかし。なかよしパズルの ゲームき。タップすると がめんで ピースが きえて ほしが ふる。" },
  ];

  // ---- 服 ----
  // パーカー: カンガルーの ポケット・むねに 3こ つないだ ピース（きんの せん）と ほし・きんの ひも。うしろは フードと おおきな ほし・つき
  WEAR.pc_hoodie = (ctx) => {
    const W = IkeWear, F = W.frame(ctx), c = ctx.col[0] || NAVY, g = ctx.col[1] || GOLD, cd = shade(c, -0.22), cl = shade(c, 0.14);
    const { cx, sx } = F, hem = F.v(F.big ? 0.86 : 0.9);
    let body = garment(ctx, hem, c) + `<path d="M${f2(cx + F.hw * 0.5)},${f2(F.T.top)} C${f2(cx + F.hw * 0.7)},${f2(F.v(0.4))} ${f2(cx + F.hw * 0.7)},${f2(hem - 10)} ${f2(cx + F.hw * 0.62)},${f2(hem)} H220 V${f2(F.T.top)} Z" fill="${cd}" opacity=".35"/>`;
    if (F.back) {
      // せなかに たれた フード（きんの ふち）と、おおきな ほし・つき・きらっ
      const hy = F.v(F.big ? 0.1 : 0.16), hr = F.hw * (F.big ? 0.44 : 0.66);
      body += W.p(`M${f2(cx - hr)},${f2(hy - hr * 0.4)} Q${f2(cx - hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx)},${f2(hy + hr * 1.05)} Q${f2(cx + hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx + hr)},${f2(hy - hr * 0.4)} Z`, cl, 3.2) +
        W.line(`M${f2(cx - hr * 0.78)},${f2(hy - hr * 0.2)} Q${f2(cx)},${f2(hy + hr * 0.78)} ${f2(cx + hr * 0.78)},${f2(hy - hr * 0.2)}`, g, 2.2);
      const sy = F.v(F.big ? 0.62 : 0.66), sr = F.hw * (F.big ? 0.28 : 0.36);
      body += W.star(cx + sx, sy, sr, g, 3) + W.star(cx + sx, sy, sr * 0.5, GOLD_L) + W.moon(cx - F.hw * 0.5, sy - sr * 0.9, sr * 0.36, GOLD_L, 2.2) + W.twinkle(cx + F.hw * 0.52, sy - sr * 0.7, F.big ? 5 : 3.6, GOLD_L);
    } else {
      // カンガルーの ポケット（きんの ステッチ）
      const py0 = F.v(F.big ? 0.56 : 0.6), py1 = hem - (F.big ? 12 : 8), pw = F.hw * (F.big ? 0.6 : 0.7), px = cx + sx;
      body += W.p(`M${f2(px - pw * 0.72)},${f2(py0)} H${f2(px + pw * 0.72)} Q${f2(px + pw * 0.86)},${f2((py0 + py1) / 2)} ${f2(px + pw)},${f2(py1)} H${f2(px - pw)} Q${f2(px - pw * 0.86)},${f2((py0 + py1) / 2)} ${f2(px - pw * 0.72)},${f2(py0)} Z`, cl, 2.6) +
        W.line(`M${f2(px - pw * 0.64)},${f2(py0 + 3)} H${f2(px + pw * 0.64)}`, g, 1.4, 'stroke-dasharray="2.4 2.2"');
      // むねの もよう: ピンク・きいろ・みどりの ピースを きんの せんで つないで、さいごに ほし
      const ry = F.v(F.big ? 0.34 : 0.4), r = F.big ? 6.4 : 4.4, gap = r * 2.5, xs = [px - gap, px, px + gap];
      body += W.line(`M${f2(xs[0])},${f2(ry)} H${f2(xs[2] + gap * 0.6)}`, g, F.big ? 3 : 2.2);
      xs.forEach((x, i) => {
        body += W.dot(x, ry, r, PIECE[i], F.big ? 2.2 : 1.8) + W.dot(x - r * 0.35, ry - r * 0.12, r * 0.14, INK) + W.dot(x + r * 0.35, ry - r * 0.12, r * 0.14, INK) +
          W.line(`M${f2(x - r * 0.28)},${f2(ry + r * 0.28)} Q${f2(x)},${f2(ry + r * 0.55)} ${f2(x + r * 0.28)},${f2(ry + r * 0.28)}`, INK, Math.max(0.8, r * 0.16));
      });
      body += W.star(xs[2] + gap * 0.95, ry - r * 0.2, r * 0.9, g, 1.6);
    }
    body += W.rib(hem - (F.big ? 10 : 7), hem, cd, c) + W.hemLine(hem);
    const out = { sleeve: W.sleeves(ctx, c, { len: 0.84, cuff: cd }), torso: torsoClip(ctx, body) };
    if (!F.back) out.top = neckWrap(ctx, (s) => W.line("M-12,4 C-14,14 -12,24 -13,34 M12,4 C14,14 12,24 13,34", g, s * 0.55) + W.star(-13, 38, 4.6, g, s * 0.4) + W.star(13, 38, 4.6, g, s * 0.4));
    return out;
  };
  // カチューシャ: きんの わ・パステルの ビーズ・まんなかに ほし・ひだりに つき・みぎに ピース（✦）
  const bez = (t) => { const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3; return [a * -48 + b * -36 + c * 36 + d * 48, a * 6 + b * -26 + c * -26 + d * 6]; };
  WEAR.pc_band = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const g = ctx.col[0] || GOLD, n = ctx.col[1] || NAVY, band = "M-48,6 C-36,-26 36,-26 48,6", L = (w) => `stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
      let o = `<path d="${band}" fill="none" stroke="${INK}" stroke-width="${f2(s * 2.6)}" stroke-linecap="round"/><path d="${band}" fill="none" stroke="${g}" stroke-width="${f2(s * 1.3)}" stroke-linecap="round"/>`;
      o += `<path d="${band}" fill="none" stroke="${GOLD_L}" stroke-width="${f2(s * 0.35)}" stroke-linecap="round" stroke-dasharray="${f2(s * 0.6)} ${f2(s * 1.4)}"/>`;
      [[0.16, 0], [0.3, 1], [0.7, 2], [0.84, 0]].forEach(([t, i]) => { const [x, y] = bez(t); o += `<circle cx="${f2(x)}" cy="${f2(y - 2)}" r="${f2(s * 0.95)}" fill="${PIECE[i]}" ${L(s * 0.4)}/>`; });
      // ひだり: つき（ラベンダー）・みぎ: ピース（みずいろ・きんの ✦）・まんなか: ほし
      const [lx, ly] = bez(0.3), [rx, ry] = bez(0.7);
      o += `<path d="M${f2(lx)},${f2(ly - 3)} L${f2(lx - 3)},${f2(ly - 12)}" ${L(s * 0.45)}/><path d="${starPath(0, 0, 1, 1)}" fill="none"/>`;
      o += `<g transform="translate(${f2(lx - 4)},${f2(ly - 21)})"><path d="M3,-10 A10,10 0 1 0 3,10 A7.8,7.8 0 1 1 3,-10 Z" fill="${PIECE[4]}" ${L(s * 0.5)}/><circle cx="-4" cy="-2" r="1.6" fill="${INK}"/></g>`;
      o += `<path d="M${f2(rx)},${f2(ry - 3)} L${f2(rx + 3)},${f2(ry - 12)}" ${L(s * 0.45)}/><circle cx="${f2(rx + 4)}" cy="${f2(ry - 20)}" r="9.5" fill="${PIECE[3]}" ${L(s * 0.5)}/>`;
      o += `<path d="${starPath(rx + 4, ry - 20, 5.5, 2.3, 4)}" fill="${g}" ${L(s * 0.25)}/>`;
      o += `<path d="M0,-17 L0,-28" ${L(s * 0.55)}/><path d="${starPath(0, -38, 14, 6.2)}" fill="${g}" ${L(s * 0.6)}/><path d="${starPath(0, -38, 7.5, 3.3)}" fill="${GOLD_L}"/>`;
      o += `<circle cx="-4" cy="-40" r="1.5" fill="${n}"/><circle cx="4" cy="-40" r="1.5" fill="${n}"/>`;
      return o;
    }),
  });

  // ---- 家具の 立体（FurnModels の kit。x は よこ・y は おく〔-d〜0〕・z は 上）----
  const Sh = FurnModels.shapes;
  let uidN = 0;
  const HERO_VB = { wanko: "0 -8 200 222", gachan: "30 12 140 202", goji: "-6 -6 212 222" };
  // Chara.svg を x y w h に おさめる（足もとを したに そろえる）。いれこの <svg> に しない（CSS の「svg { width: 100% }」で くずれない ように <g> で うめこむ）
  const hero = (who, x, y, w, h, face = "happy") => {
    const [vx, vy, vw, vh] = HERO_VB[who].split(" ").map(Number), k = Math.min(w / vw, h / vh);
    const inner = Chara.svg(who, { face, dir: "down", outfit: {}, color: "soft" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    return `<g transform="translate(${f2(x + (w - vw * k) / 2 - vx * k)} ${f2(y + (h - vh * k) - vy * k)}) scale(${(Math.round(k * 1e4) / 1e4)})">${inner}</g>`;
  };
  // ピースの まる（したの まんなか 0,0・半径 R。うしろに あつみ・きんの ステッチ・なかに 3人）
  const pieceSprite = (i, R, face = "happy") => {
    const col = PIECE[i], deep = shade(col, -0.2), id = "pcq" + ++uidN;
    let s = `<ellipse cx="${f2(R * 0.12)}" cy="${f2(-R + R * 0.06)}" rx="${f2(R)}" ry="${f2(R * 0.98)}" fill="${deep}" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="0" cy="${f2(-R)}" r="${f2(R)}" fill="${col}" stroke="${INK}" stroke-width="2.2"/>`;
    s += `<clipPath id="${id}"><circle cx="0" cy="${f2(-R)}" r="${f2(R - 3)}"/></clipPath>`;
    if (i < 3) s += `<g clip-path="url(#${id})">${hero(Chara.IDS[i], -R * 0.7, -R * 1.72, R * 1.4, R * 1.55, face)}</g>`;
    else s += `<path d="${starPath(0, -R, R * 0.45, R * 0.2)}" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<circle cx="0" cy="${f2(-R)}" r="${f2(R - 3.2)}" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="3 2.6"/>`;
    s += `<ellipse cx="${f2(-R * 0.4)}" cy="${f2(-R * 1.5)}" rx="${f2(R * 0.3)}" ry="${f2(R * 0.14)}" transform="rotate(-30 ${f2(-R * 0.4)} ${f2(-R * 1.5)})" fill="#FFFFFF" fill-opacity=".55"/>`;
    return s;
  };
  // テーブルの ばんめん（6×6。0〜2 は 3人の いろ・のこりは ✦ ☾ ◆）。CHAIN は ひかる つなぎ（ピンクの L じ）
  const BOARD = [3, 1, 4, 2, 5, 1, 0, 0, 0, 3, 2, 4, 5, 2, 0, 1, 4, 3, 1, 4, 0, 5, 2, 1, 2, 3, 1, 4, 0, 5, 4, 5, 2, 3, 1, 2];
  const CHAIN = [6, 7, 8, 14, 20];
  const cellXY = (i, cell = 14) => [-35 + (i % 6) * cell, -85 + Math.floor(i / 6) * cell];
  const symbol = (v, x, y, r) => (v === 3 ? `<path d="${starPath(x, y, r, r * 0.45)}" fill="${NAVY}"/>` : v === 4 ? `<path d="M${f2(x + r * 0.3)},${f2(y - r)} A${f2(r)},${f2(r)} 0 1 0 ${f2(x + r * 0.3)},${f2(y + r)} A${f2(r * 0.78)},${f2(r * 0.78)} 0 1 1 ${f2(x + r * 0.3)},${f2(y - r)} Z" fill="${NAVY}"/>` : `<path d="M${f2(x)},${f2(y - r)} L${f2(x + r * 0.8)},${f2(y)} L${f2(x)},${f2(y + r)} L${f2(x - r * 0.8)},${f2(y)} Z" fill="${NAVY}"/>`);
  const M = {};
  // 1. ごわが パズル クッション: たてた まるい ピース 3こ。画面の よこ いちれつ（ひだり わんこ・みぎ ごじ・まんなかの がちゃんは すこし まえ）
  // 投影は 画面の よこ = (x − y)・おく = (x + y)。s = x − y・q = x + y で おく
  const XY = (s0, q) => [(s0 + q) / 2, (q - s0) / 2];
  const CUSHION = [[0, ...XY(-12, -33)], [2, ...XY(72, -33)], [1, ...XY(30, -22)]];
  M.pc_cushion = (k) => {
    const { at, shape, TP } = k, R = 23;
    let s = shape(TP(0.5), Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * TAU; return XY(30 + 52 * Math.cos(a), -29 + 13 * Math.sin(a)); }), NAVY, 0, 'fill-opacity=".14"');
    for (const [i, x, y] of CUSHION) s += at(x, y, 1, pieceSprite(i, R), R + 4, R * 2 + 4);
    return s;
  };
  // 2. なかよしパズル テーブル: こんの てんばん・きんの ふち・6×6 の ピース・ピンクの L じの つなぎ（きんの せん）
  M.pc_table = (k) => {
    const { cyl, box, shape, TP, FR, lineOn, onP, shadow, L } = k, z = 38;
    let s = shadow(0.12, 6, 12);
    for (const [x, y] of k.byDepth([[-40, -90], [40, -90], [-40, -10], [40, -10]])) s += cyl(x, y, 0, 3.6, z, GOLD_D, GOLD, 1.3, 18);
    s += box(-50, -100, 100, 100, z, 7, [NAVY, NAVY_D, NAVY_L]);
    s += onP(FR(0), -46, z + 5.5, 92, 4, `<rect x="0" y="0" width="92" height="4" fill="${NAVY_D}"/>` + [10, 30, 46, 62, 82].map((x, i) => (i % 2 ? `<path d="${starPath(x, 2, 2.2, 1)}" fill="${GOLD}"/>` : `<circle cx="${x}" cy="2" r="1.3" fill="${GOLD_L}"/>`)).join(""));
    s += shape(TP(z + 7), Sh.rr(-47, -97, 94, 94, 6), GOLD, 1.2) + shape(TP(z + 7.1), Sh.rr(-43, -93, 86, 86, 4), NAVY_D, 1);
    for (let i = 0; i < 36; i++) {
      const [x, y] = cellXY(i), v = BOARD[i], lit = CHAIN.includes(i);
      s += shape(TP(z + 7.2), Sh.ov(x, y, 5.6, 5.6, 20), PIECE[v], 0.9);
      if (v >= 3) s += onP(TP(z + 7.3), x - 3, y + 3, 6, 6, symbol(v, 3, 3, 2.4));
      else s += shape(TP(z + 7.3), Sh.ov(x - 1.2, y + 1.2, 1.6, 1, 10), "#FFFFFF", 0, 'fill-opacity=".6"');
      if (lit) s += L(shape(TP(z + 7.25), Sh.ov(x, y, 6.4, 6.4, 20), "none", 0, `stroke="${GOLD_L}" stroke-width="1.6"`));
    }
    s += L(lineOn(TP(z + 7.4), CHAIN.map((i) => cellXY(i)), GOLD, 2.2));
    return s;
  };
  // 3. なかよしパズル アーケード: こんの きょうたい・きんの ふち・がめんに 6×6・うえの かんばんに 3人・レバーと ボタン
  M.pc_arcade = (k) => {
    const { box, shape, FR, SD, TP, onP, shadow, rod, ball, cyl, at, L } = k;
    let s = shadow(0.14, 4, 10);
    s += box(-34, -60, 68, 52, 0, 96, [NAVY, NAVY_D, NAVY_L]);
    // したの とびら（コインの いれぐち）・よこの ほしの え
    s += onP(FR(-8), -14, 60, 28, 30, `<rect x="0" y="0" width="28" height="30" rx="3" fill="${NAVY_D}" stroke="${INK}" stroke-width="1.3"/><rect x="9" y="7" width="10" height="4" rx="1" fill="${GOLD}" stroke="${INK}" stroke-width="1"/><rect x="12.5" y="8.2" width="3" height="1.6" fill="${INK}"/><circle cx="14" cy="21" r="3" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/>`);
    s += onP(SD(34), -56, 88, 44, 80, `<path d="${starPath(22, 30, 11, 5)}" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/><path d="M12,52 A7,7 0 1 0 12,66 A5.4,5.4 0 1 1 12,52 Z" fill="${GOLD_L}" stroke="${INK}" stroke-width="1"/><circle cx="32" cy="58" r="3" fill="${PIECE[0]}" stroke="${INK}" stroke-width="0.8"/><circle cx="38" cy="66" r="2.4" fill="${PIECE[2]}" stroke="${INK}" stroke-width="0.8"/><circle cx="8" cy="12" r="2" fill="${PIECE[1]}" stroke="${INK}" stroke-width="0.8"/>`);
    // そうさばん（まえに でた だい）: レバー・ボタン 2こ
    s += box(-34, -24, 68, 18, 90, 8, [GOLD, GOLD_D, "#F2D98E"]);
    s += shape(TP(98.1), Sh.rr(-31, -21, 62, 12, 2), NAVY_L, 1);
    s += rod([[-16, -15, 98], [-16, -15, 108]], "#D9D2C2", 1.8) + ball(-16, -15, 110, 3.4, "#E86A6A", 1.2, 0.5);
    s += cyl(6, -15, 98, 3, 1.6, "#B7385A", PIECE[0], 1, 16) + cyl(18, -16, 98, 3, 1.6, "#4F8E77", PIECE[2], 1, 16);
    // がめんの だい（おくへ さがる）・がめん
    s += box(-34, -60, 68, 36, 98, 38, [NAVY, NAVY_D, NAVY_L]);
    const screen = `<rect x="0" y="0" width="56" height="30" rx="3" fill="#1A2238" stroke="${GOLD}" stroke-width="2"/>` +
      Array.from({ length: 36 }, (_, i) => `<circle cx="${f2(10.5 + (i % 6) * 7)}" cy="${f2(4.8 + Math.floor(i / 6) * 4.1)}" r="1.7" fill="${PIECE[BOARD[i]]}"/>`).join("") +
      `<path d="${starPath(5, 5, 2.4, 1)}" fill="${GOLD_L}"/><path d="${starPath(52, 25, 2, 0.9)}" fill="${GOLD_L}"/>`;
    s += L(onP(FR(-24), -28, 132, 56, 30, screen)) + (k.opts.live ? onP(FR(-24), -28, 132, 56, 30, `<rect x="0" y="0" width="56" height="30" rx="3" fill="#1A2238" stroke="${GOLD}" stroke-width="2"/>`) : "");
    // うえの かんばん（ひかる）: よぞら・ほし・3人
    s += box(-36, -62, 72, 42, 136, 16, [GOLD, GOLD_D, "#F2D98E"]);
    s += onP(FR(-20), -33, 150.5, 66, 11, `<rect x="0" y="0" width="66" height="11" rx="2" fill="${NAVY_D}"/>` + [6, 60].map((x) => `<path d="${starPath(x, 5.5, 3, 1.3)}" fill="${GOLD_L}"/>`).join("") + [18, 33, 48].map((x, i) => `<circle cx="${x}" cy="5.5" r="4.4" fill="${PIECE[i]}" stroke="${INK}" stroke-width="0.8"/>`).join(""));
    s += at(0, -20, 152, `<path d="${starPath(0, -9, 9, 4)}" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/><path d="${starPath(0, -9, 4.6, 2)}" fill="${GOLD_L}"/>`, 10, 20);
    // かんばんの 3人（ちいさな かお）
    for (const [i, x] of [[0, -15], [1, 0], [2, 15]]) s += at(x, -20.5, 138.2, `<g transform="scale(0.34)">${hero(Chara.IDS[i], -14, -30, 28, 30)}</g>`, 6, 12, false);
    return s;
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- さわる（FurnLive）----
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  const since = (st) => G.t - st.t0;
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const tone = (list, step = 0.09, type = "triangle", vol = 0.12) => { if (Sound.ctx && Save.d?.settings?.se) list.forEach((f, i) => Sound.tone(Sound.seGain, { f, t: i * step, dur: 0.12, type, vol, a: 0.005, r: 0.3 })); };
  // 1. クッション: タップで 3こが じゅんばんに ぽよん（ハート）
  FurnLive.register("pc_cushion", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; Sound.se("jump"); tone([523, 659, 784], 0.1, "sine", 0.1); say(sc, it, ["ぽよん ぽよん！", "パズルの ピースだ〜", "3にん いっしょ！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const t = since(st); if (!(t >= 0 && t < 1.6)) return;
      const P = mapper(sc, it, r);
      CUSHION.map(([, x, y], i) => [x, y, i * 0.18]).forEach(([x, y, d], i) => {
        const u = t - d; if (u < 0 || u > 0.9) return;
        const c = P(x, y, 50 + Math.sin((u / 0.9) * Math.PI) * 14);
        ctx.save(); ctx.globalAlpha = 1 - u / 0.9; FX.heart(ctx, c.x, c.y, 6 * P.s, ["#F06292", "#FFB3C1", "#8ED1C0"][i]); ctx.restore();
      });
    },
  });
  // 2. テーブル: タップで L じの つなぎが じゅんばんに ひかる → ぱっと きえて きらきら（なかよしパズルの おと）
  FurnLive.register("pc_table", {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("pop"); CHAIN.forEach((_, i) => setTimeout(() => Sound.se(i === CHAIN.length - 1 ? "perfect" : "tap"), i * 120)); say(sc, it, "L じで つないだ！ クロス！", "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), z = 45.4;
      // いつもは つなぎが ゆっくり ひかる。タップの あとは 1こずつ → さいごに ぱっと
      const pulse = 0.35 + 0.25 * Math.sin(G.t * 2.4);
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const pts = CHAIN.map((i) => { const [x, y] = cellXY(i); return P(x, y, z); });
      const n = t >= 0 && t < 2 ? Math.min(CHAIN.length, Math.floor(t / 0.12) + 1) : CHAIN.length;
      ctx.strokeStyle = `rgba(247,230,176,${t >= 0 && t < 2 ? 0.95 : pulse})`; ctx.lineWidth = 3.4 * P.s; ctx.beginPath(); pts.slice(0, n).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
      if (t >= 0 && t < 2) {
        pts.slice(0, n).forEach((p) => glow(ctx, p.x, p.y, 12 * P.s, "255,236,170", 0.7));
        const k = (t - 0.6) / 1.2;
        if (k > 0 && k < 1) { ctx.globalAlpha = 1 - k; for (const p of pts) FX.sparkles(ctx, p.x, p.y - 6 * P.s, k); }
      }
      ctx.restore();
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), p = P(-10, -64, 46); glow(ctx, p.x, p.y, 60 * P.s, "255,226,150", 0.16); },
  }, true);
  // 3. アーケード: がめんは いつも うごく（ピースが ゆれる）。タップで 1かい あそぶ: ピースが つながって きえ、かんばんから ほしが ふる
  FurnLive.register("pc_arcade", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; Sound.se("encounter"); setTimeout(() => Sound.se("perfect"), 900); setTimeout(() => Sound.se("fanfare"), 1500); say(sc, it, ["15まんてん！ やったね！", "スター！ ほしが ふってきた！", "なかよしパズル、たのしい！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), play = t >= 0 && t < 2.6;
      // がめん（FR(-24) の 面: x −28〜28・z 102〜132）
      const O = P(-28, -24, 132), X = P(28, -24, 132), Z = P(-28, -24, 102), ux = (X.x - O.x) / 56, uy = (X.y - O.y) / 56, vx = (Z.x - O.x) / 30, vy = (Z.y - O.y) / 30;
      const at2 = (a, b) => ({ x: O.x + ux * a + vx * b, y: O.y + uy * a + vy * b });
      ctx.save();
      for (let i = 0; i < 36; i++) {
        const cx = 10.5 + (i % 6) * 7, cy = 4.8 + Math.floor(i / 6) * 4.1, lit = play && CHAIN.includes(i), gone = play && t > 1.1 && t < 1.8 && CHAIN.includes(i);
        const bob = Math.sin(G.t * 3 + i) * 0.35, p = at2(cx, cy + bob);
        if (gone) continue;
        ctx.fillStyle = PIECE[BOARD[i]]; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 * P.s, 0, TAU); ctx.fill();
        if (lit) { ctx.globalAlpha = 0.8; glow(ctx, p.x, p.y, 5 * P.s, "255,236,170", 0.8); }
      }
      if (play && t > 0.2 && t < 1.1) {
        ctx.globalAlpha = 1; ctx.strokeStyle = "#F7E6B0"; ctx.lineWidth = 1.4 * P.s; ctx.lineCap = "round"; ctx.beginPath();
        const m = Math.min(CHAIN.length, Math.floor((t - 0.2) / 0.16) + 1);
        CHAIN.slice(0, m).forEach((i, j) => { const p = at2(10.5 + (i % 6) * 7, 4.8 + Math.floor(i / 6) * 4.1); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke();
      }
      ctx.restore();
      // かんばんから ほしが ふる
      if (play && t > 1.2) {
        const k = (t - 1.2) / 1.4;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k);
        for (let i = 0; i < 7; i++) { const c = P(-30 + i * 10, -18, 156 - k * (40 + (i % 3) * 18)); FX.star(ctx, c.x + Math.sin(k * 6 + i) * 3 * P.s, c.y, (3 + (i % 2) * 2) * P.s, i % 2 ? "#FFF2B2" : "#F7D2DF"); }
        ctx.restore();
      }
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), p = P(0, -22, 130); glow(ctx, p.x, p.y, 70 * P.s, "170,190,255", 0.2); const q = P(0, -20, 146); glow(ctx, q.x, q.y, 50 * P.s, "255,226,150", 0.2); },
  }, true);

  // ---- ライン（CollabGoods）----
  const line = CollabGoods.register({ id: "puzzle", name: "ごわが × なかよしパズル コラボ", game: "なかよしパズル", unit: "pt",
    // まえからの ベスト スコアから はじめる（そのぶんは もう あそんだ）
    seed: () => (Save.d.puzzle && Number.isFinite(Save.d.puzzle.best) ? Save.d.puzzle.best : 0), items: ITEMS });
  return { ITEMS, line, BOARD, CHAIN, PIECE };
})();
