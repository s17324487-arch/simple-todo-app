// Meeときょれじゃ 3F の こういしつで かりられる いしょう 6しゅ（UI-22）。ほんものの プリクラの おみせの ように、せいふく などを ただで かして、ぷりくらを とれる。
// かりた いしょうは おみせの なか だけ（おみせを でる ときに MeeFitting が かえす）。WEAR_ITEMS には いれない（ようふくやさん・ずかん・ふくの いちらんに でない）。
// ITEM_INDEX にだけ いれて、3人の 絵（Chara）・アイコン・ぷりくらの しゃしんで 描けるように する。
// 服は IkeWear と おなじ かさね（そで・うしろ すがた・よこむき）。からだの 目安（PROFILE の a.torso・うで）から 形を きめるので、わんこ・がちゃん・ごじの どれにも あう。
const MeeRentalWear = (() => {
  const W = IkeWear;
  const ITEMS = [
    { id: "mee_sailor", slot: "body", name: "セーラーふく", col: ["#FFFFFF", "#3E4F8F", "#E8453C"], theme: "がっこう",
      desc: "こんいろの おおきな えりと あかい スカーフ。プリーツの スカート。" },
    { id: "mee_blazer", slot: "body", name: "ブレザー", col: ["#3B4A7A", "#FFFFFF", "#E8453C"], theme: "がっこう",
      desc: "むねに きんいろの エンブレム。あかい リボンと チェックの スカート。" },
    { id: "mee_gym", slot: "body", name: "たいそうふく", col: ["#FFFFFF", "#3E4F8F", "#E8453C"], theme: "がっこう",
      desc: "しろい シャツに ゼッケン。こんいろの ハーフパンツ。" },
    { id: "mee_yukata", slot: "body", name: "ゆかた", col: ["#CFE6F7", "#F59BBE", "#FFD86B"], theme: "おまつり",
      desc: "あさがおの もようの ゆかたに きいろい おび。うしろは おおきな リボン。" },
    { id: "mee_schoolhat", slot: "head", name: "つうがく ぼうし", col: ["#FFD84D"], theme: "がっこう",
      desc: "きいろい まるい ぼうし。まえに なまえの ふだ。" },
    { id: "mee_randoseru", slot: "back", name: "ランドセル", col: ["#E2453F", "#F2C14E"], theme: "がっこう",
      desc: "あかい ランドセル。きんいろの とめがね。" },
  ];
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const ln = (d, col, w, extra = "") => W.line(d, col, w, extra);

  // ---- セーラーふく: しろい ブラウス・こんいろの V の えり（しろい 2本の せん）・あかい スカーフ・プリーツの スカート。うしろは しかくい おおきな えり ----
  WEAR.mee_sailor = (ctx) => {
    const F = W.frame(ctx), c = ctx.col[0] || "#FFFFFF", nv = ctx.col[1] || "#3E4F8F", sc = ctx.col[2] || "#E8453C";
    const { cx, sx } = F, ex = cx + sx, waist = F.v(F.big ? 0.52 : 0.58), y1 = F.bot - (F.big ? 4 : 1), lw = F.big ? 2.4 : 1.7, top = F.T.top - 20;
    let body = garment(ctx, waist + 3, c) + `<path d="M${f2(cx + F.hw * 0.5)},${f2(F.T.top)} C${f2(cx + F.hw * 0.7)},${f2(F.v(0.3))} ${f2(cx + F.hw * 0.72)},${f2(waist - 4)} ${f2(cx + F.hw * 0.7)},${f2(waist + 3)} H220 V${f2(F.T.top)} Z" fill="${shade(c, -0.12)}" opacity=".35"/>`;
    let after = "";
    if (F.back) {
      // せなかの しかくい えり（しろい 2本の せん）
      const cw = F.hw * (F.big ? 0.78 : 0.92), cy1 = F.v(F.big ? 0.34 : 0.4);
      body += `<path d="M${f2(cx - cw)},${f2(top)} H${f2(cx + cw)} V${f2(cy1)} H${f2(cx - cw)} Z" fill="${nv}" ${stroke(2.6)}/>`;
      for (const k of [3.2, 6.4]) body += ln(`M${f2(cx - cw + k)},${f2(top)} V${f2(cy1 - k)} H${f2(cx + cw - k)} V${f2(top)}`, "#FFFFFF", lw);
    } else {
      // まえ: V の えり。そとがわの V（こんいろ）から うちがわの V（ブラウス）を ぬく
      const ow = F.hw * (F.big ? 0.66 : 0.84), sh = F.v(F.big ? 0.08 : 0.12), vy = F.v(F.big ? 0.34 : 0.42), iw = ow * 0.5, iy = vy - (vy - top) * 0.3;
      body += `<path d="M${f2(ex - ow)},${f2(top)} L${f2(ex - ow)},${f2(sh)} L${f2(ex)},${f2(vy)} L${f2(ex + ow)},${f2(sh)} L${f2(ex + ow)},${f2(top)} H${f2(ex + iw)} L${f2(ex)},${f2(iy)} L${f2(ex - iw)},${f2(top)} Z" fill="${nv}" ${stroke(2.4)}/>`;
      const k = F.big ? 4.2 : 3;
      body += ln(`M${f2(ex - ow + k)},${f2(top)} L${f2(ex - ow + k)},${f2(sh + k * 0.3)} L${f2(ex)},${f2(vy - k * 1.4)} L${f2(ex + ow - k)},${f2(sh + k * 0.3)} L${f2(ex + ow - k)},${f2(top)}`, "#FFFFFF", lw);
      // あかい スカーフ（むすびめと 2本の はし）
      const s = F.big ? 1.25 : 0.85, ky = vy - 2 * s;
      after += W.p(`M${f2(ex - 2 * s)},${f2(ky + 2 * s)} L${f2(ex - 7 * s)},${f2(ky + 15 * s)} L${f2(ex - 2.5 * s)},${f2(ky + 13 * s)} L${f2(ex + 1 * s)},${f2(ky + 3 * s)} Z`, shade(sc, -0.12), 2.2 * s) +
        W.p(`M${f2(ex + 2 * s)},${f2(ky + 2 * s)} L${f2(ex + 7 * s)},${f2(ky + 15 * s)} L${f2(ex + 2.5 * s)},${f2(ky + 13 * s)} L${f2(ex - 1 * s)},${f2(ky + 3 * s)} Z`, sc, 2.2 * s) +
        W.p(`M${f2(ex - 9 * s)},${f2(ky - 5 * s)} Q${f2(ex)},${f2(ky - 1 * s)} ${f2(ex + 9 * s)},${f2(ky - 5 * s)} L${f2(ex + 3.5 * s)},${f2(ky + 3.5 * s)} L${f2(ex - 3.5 * s)},${f2(ky + 3.5 * s)} Z`, sc, 2.2 * s) +
        W.ell(ex, ky + 0.6 * s, 3.6 * s, 3 * s, shade(sc, -0.1), 2 * s);
    }
    // プリーツの スカート（たての ひだ）
    const w0 = F.hw + 1, w1 = F.hw * (F.big ? 1.28 : 1.36);
    let skirt = W.p(W.skirtD(cx, waist, w0, y1, w1, 0), nv);
    for (let i = 1; i < 6; i++) { const t = i / 6 - 0.5; skirt += ln(`M${f2(cx + t * w0 * 1.8)},${f2(waist + 3)} L${f2(cx + t * w1 * 1.9)},${f2(y1 + 1)}`, shade(nv, -0.35), F.big ? 2.4 : 1.8); }
    skirt += `<path d="M${f2(cx - w0 - 1)},${f2(waist - 1)} H${f2(cx + w0 + 1)} V${f2(waist + 3.5)} H${f2(cx - w0 - 1)} Z" fill="${nv}" ${stroke(2.6)}/>`;
    return { sleeve: W.sleeves(ctx, c, { len: 0.52, cuff: nv }), torso: torsoClip(ctx, body) + skirt + after };
  };

  // ---- ブレザー: こんいろの ジャケット（えり・きんの ボタン・むねの エンブレム・ポケット）・しろい シャツ・あかい リボン・チェックの スカート ----
  WEAR.mee_blazer = (ctx) => {
    const F = W.frame(ctx), J = ctx.col[0] || "#3B4A7A", SH = ctx.col[1] || "#FFFFFF", RB = ctx.col[2] || "#E8453C", JD = shade(J, -0.25), GO = "#E8C872", P1 = "#A9B4D2", P2 = "#7584AE";
    const { cx, sx } = F, ex = cx + sx, hem = F.v(F.big ? 0.76 : 0.78), oy = F.v(F.big ? 0.42 : 0.5), top = F.T.top - 20, lw = F.big ? 2.4 : 1.7;
    // チェック（すその した）
    let plaid = W.band(hem, 230, P1);
    for (let x = -4; x < 214; x += F.big ? 12 : 9) plaid += ln(`M${x},${f2(hem)} V230`, P2, F.big ? 3 : 2.2);
    for (let y = hem + 4; y < 230; y += F.big ? 10 : 7) plaid += ln(`M-10,${f2(y)} H220`, P2, F.big ? 2.4 : 1.6, `opacity=".8"`);
    plaid += ln(`M-10,${f2(hem + (F.big ? 9 : 6))} H220`, RB, 1.2, `opacity=".7"`);
    let body = garment(ctx, 220, SH) + plaid, after = "";
    if (F.back) {
      body += W.band(top, hem, J) + `<path d="M${f2(cx + F.hw * 0.48)},${f2(F.T.top)} C${f2(cx + F.hw * 0.7)},${f2(F.v(0.3))} ${f2(cx + F.hw * 0.75)},${f2(hem - 8)} ${f2(cx + F.hw * 0.7)},${f2(hem)} H220 V${f2(F.T.top)} Z" fill="${JD}" opacity=".3"/>`;
      body += ln(`M${f2(cx)},${f2(F.top)} V${f2(hem)}`, JD, 2.2) + ln(`M${f2(cx)},${f2(hem - (hem - F.top) * 0.22)} V${f2(hem)}`, INK, 2.6) + W.hemLine(hem);
    } else {
      const ow = F.hw * (F.big ? 0.32 : 0.4);
      const side = (k) => `M${f2(ex + k * ow)},${f2(top)} L${f2(ex + k * ow)},${f2(F.T.top)} L${f2(ex + k * 2)},${f2(oy)} L${f2(ex + k * 2)},${f2(hem)} L${f2(cx + k * 130)},${f2(hem)} L${f2(cx + k * 130)},${f2(top)} Z`;
      body += `<path d="${side(-1)}" fill="${J}"/><path d="${side(1)}" fill="${J}"/><path d="${side(1)}" fill="${JD}" opacity=".28" transform="translate(${f2(F.hw * 0.55)} 0)"/>`;
      body += ln(`M${f2(ex - ow)},${f2(F.T.top)} L${f2(ex - 2)},${f2(oy)} L${f2(ex - 2)},${f2(hem)} M${f2(ex + ow)},${f2(F.T.top)} L${f2(ex + 2)},${f2(oy)}`, INK, 3) + W.hemLine(hem);
      // えり（ノッチ）
      for (const k of [-1, 1]) body += W.p(`M${f2(ex + k * ow)},${f2(F.T.top - 4)} L${f2(ex + k * ow * 1.85)},${f2(F.top + (oy - F.top) * 0.38)} L${f2(ex + k * ow * 1.3)},${f2(F.top + (oy - F.top) * 0.5)} L${f2(ex + k * 3)},${f2(oy - 1)} Z`, JD, 2.4);
      // きんの ボタン 2つ・ポケットの ふた・むねの エンブレム（きんの たてに しろい ほし）
      for (let i = 0; i < 2; i++) body += W.dot(ex - (F.big ? 6 : 4.5), oy + 4 + (hem - oy - 8) * (i * 0.6 + 0.15), F.big ? 2.6 : 1.9, GO, 1.3);
      for (const k of [-1, 1]) body += ln(`M${f2(ex + k * F.hw * 0.28)},${f2(hem - (F.big ? 10 : 7))} H${f2(ex + k * F.hw * 0.78)}`, INK, 2.2);
      const eX = ex + F.hw * 0.52, eY = F.top + (oy - F.top) * (F.big ? 0.62 : 0.72), es = F.big ? 1.25 : 0.8;
      body += W.p(`M${f2(eX - 5 * es)},${f2(eY - 5 * es)} H${f2(eX + 5 * es)} V${f2(eY + 1 * es)} Q${f2(eX + 5 * es)},${f2(eY + 5 * es)} ${f2(eX)},${f2(eY + 7 * es)} Q${f2(eX - 5 * es)},${f2(eY + 5 * es)} ${f2(eX - 5 * es)},${f2(eY + 1 * es)} Z`, GO, 1.5 * es) + W.star(eX, eY + 0.6 * es, 2.8 * es, "#FFFFFF");
      // あかい リボン（えりもと）
      after = W.bow(ex, F.top + (F.big ? 6 : 3), F.big ? 0.78 : 0.48, RB, shade(RB, -0.25), F.big ? 2.6 : 2);
    }
    return { sleeve: W.sleeves(ctx, J, { len: 0.86, cuff: JD }), torso: torsoClip(ctx, body) + after };
  };

  // ---- たいそうふく: しろい シャツ（こんいろの えりと そでぐち）・むねに ゼッケン（あかい ハート。よこむきで はんてん しても おなじ かたち）・こんいろの ハーフパンツ（よこに しろい せん）----
  WEAR.mee_gym = (ctx) => {
    const F = W.frame(ctx), c = ctx.col[0] || "#FFFFFF", nv = ctx.col[1] || "#3E4F8F", rd = ctx.col[2] || "#E8453C";
    const { cx, sx } = F, ex = cx + sx, sh = F.v(F.big ? 0.64 : 0.68), T = F.T;
    let body = garment(ctx, sh + 2, c) + `<path d="M${f2(cx + F.hw * 0.55)},${f2(T.top)} C${f2(cx + F.hw * 0.72)},${f2(F.v(0.3))} ${f2(cx + F.hw * 0.74)},${f2(sh - 4)} ${f2(cx + F.hw * 0.7)},${f2(sh)} H220 V${f2(T.top)} Z" fill="${shade(c, -0.12)}" opacity=".35"/>`;
    // こんいろの えりの ゴム（ごじは くびの U の ところ）
    body += ln(`M${f2(cx - 30)},${f2(T.top + 1)} Q${f2(cx)},${f2(T.top + 17)} ${f2(cx + 30)},${f2(T.top + 1)}`, nv, F.big ? 5 : 4);
    // ハーフパンツ
    body += W.band(sh, 230, nv) + ln(`M${f2(cx - F.hw * 0.9)},${f2(sh)} V230 M${f2(cx + F.hw * 0.9)},${f2(sh)} V230`, "#FFFFFF", F.big ? 3 : 2.2) + W.hemLine(sh);
    // ゼッケン（しろい ぬのに こんいろの ふち・あかい ハート）
    const zw = F.hw * (F.big ? (F.back ? 0.95 : 0.66) : F.back ? 1.05 : 0.8), zh = zw * 0.6, zx = F.back ? cx : ex, zy = F.v(F.big ? 0.26 : F.back ? 0.22 : 0.3), k = zh / 20;
    body += `<rect x="${f2(zx - zw / 2)}" y="${f2(zy)}" width="${f2(zw)}" height="${f2(zh)}" rx="${f2(2.4 * k)}" fill="#FFFFFF" ${stroke(Math.max(1.4, 2.2 * k))}/>` +
      `<rect x="${f2(zx - zw / 2 + 2.4 * k)}" y="${f2(zy + 2.4 * k)}" width="${f2(zw - 4.8 * k)}" height="${f2(zh - 4.8 * k)}" rx="${f2(1.4 * k)}" fill="none" stroke="${nv}" stroke-width="${f2(Math.max(1, 1.6 * k))}"/>` +
      `<path d="${heartPath(zx, zy + zh / 2 - 0.8 * k, 1.05 * k)}" fill="${rd}" ${stroke(Math.max(0.8, 1.2 * k))}/>`;
    return { sleeve: W.sleeves(ctx, c, { len: 0.42, cuff: nv }), torso: torsoClip(ctx, body) };
  };

  // ---- ゆかた: あさがおの もよう・えりは「y」の かたち（みぎまえ）・きいろい おびと あかい おびじめ。うしろは おおきな リボン（ぶんこ むすび）----
  WEAR.mee_yukata = (ctx) => {
    const F = W.frame(ctx), c = ctx.col[0] || "#CFE6F7", fl = ctx.col[1] || "#F59BBE", ob = ctx.col[2] || "#FFD86B", cd = shade(c, -0.3), T = F.T;
    const { cx, sx } = F, ex = cx + sx, o0 = F.v(F.big ? 0.44 : 0.48), o1 = F.v(F.big ? 0.62 : 0.66), sw = F.big ? 1.6 : 1.2, r = F.big ? 5.2 : 3.6;
    let body = garment(ctx, 220, c) + `<path d="M${f2(cx + F.hw * 0.5)},${f2(T.top)} C${f2(cx + F.hw * 0.72)},${f2(F.v(0.3))} ${f2(cx + F.hw * 0.76)},${f2(F.v(0.8))} ${f2(cx + F.hw * 0.7)},230 H220 V${f2(T.top)} Z" fill="${shade(c, -0.1)}" opacity=".4"/>`;
    // あさがおと みずの すじ（からだの はばに あわせて まく）
    const spots = [[-0.62, 0.2], [0.55, 0.12], [-0.15, 0.8], [0.7, 0.86], [-0.78, 0.95]];
    for (const [a, b] of spots) {
      const x = cx + a * F.hw + (F.back ? 0 : sx * 0.6), y = F.top + (F.bot - F.top) * b;
      body += ln(`M${f2(x - r * 2.6)},${f2(y + r * 1.6)} q${f2(r * 1.3)},${f2(-r * 1.2)} ${f2(r * 2.6)},0 t${f2(r * 2.6)},0`, "#FFFFFF", sw * 1.2, `opacity=".85"`);
      body += flowerSvg(x, y, r * 0.62, fl, "#FFFFFF", sw * 0.8);
    }
    let after = "";
    if (F.back) {
      body += ln(`M${f2(cx)},${f2(F.top)} V${f2(o0)} M${f2(cx)},${f2(o1)} V230`, cd, 1.8);
    } else {
      // えり: したの まえ（みぎ）→ うえの まえ（ひだり）。見る ほうから「y」の かたち
      const a0 = ex - F.hw * 0.42, a1 = ex + F.hw * 0.48, vy = F.v(F.big ? 0.28 : 0.32), cw = F.big ? 6 : 4.4;
      body += `<path d="M${f2(a0)},${f2(T.top - 20)} L${f2(ex + 3)},${f2(vy)} L${f2(ex + 3 + cw)},${f2(vy - cw * 0.6)} L${f2(a0 + cw * 1.3)},${f2(T.top - 20)} Z" fill="#FFFFFF" ${stroke(2.2)}/>`;
      body += `<path d="M${f2(a1)},${f2(T.top - 20)} L${f2(ex - F.hw * 0.22)},${f2(o0 + 2)} L${f2(ex - F.hw * 0.22 - cw * 1.3)},${f2(o0 + 2)} L${f2(a1 - cw * 1.4)},${f2(T.top - 20)} Z" fill="${cd}" ${stroke(2.2)}/>`;
      body += ln(`M${f2(ex - F.hw * 0.26)},${f2(o1)} L${f2(ex - F.hw * 0.3)},230`, INK, 2.6);
    }
    // おび（きいろ）と おびじめ（あか）
    body += W.band(o0, o1, ob) + `<path d="M-10,${f2(o0)} H220 M-10,${f2(o1)} H220" ${stroke(2.6)}/>` + ln(`M-10,${f2((o0 + o1) / 2)} H220`, "#E8453C", F.big ? 2.6 : 1.8);
    if (F.back) after = W.bow(cx, (o0 + o1) / 2, F.big ? 1.55 : 1.05, ob, shade(ob, -0.22), F.big ? 3 : 2.4);
    return { sleeve: W.sleeves(ctx, c, { len: 0.82, cuff: cd }), torso: torsoClip(ctx, body) + after };
  };

  // ---- つうがく ぼうし: きいろい まるい ぼうし（つば・まんなかの すじ・てっぺんの ボタン・ゴムの おび）。まえに なまえの ふだ ----
  WEAR.mee_schoolhat = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFD84D", cd = shade(c, -0.2), cl = shade(c, 0.35);
      let o = `<ellipse cx="0" cy="3" rx="66" ry="14" fill="${c}" ${stroke(s)}/>` + `<path d="M-56,7 C-34,13 34,13 56,7" fill="none" stroke="${cd}" stroke-width="${f2(s * 0.6)}" stroke-linecap="round"/>`;
      o += `<path d="M-44,2 C-48,-52 48,-52 44,2 Z" fill="${c}" ${stroke(s)}/>`;
      o += `<path d="M-30,-30 Q0,-44 30,-30 M-40,-14 Q0,-26 40,-14" fill="none" stroke="${cd}" stroke-width="${f2(s * 0.5)}" stroke-linecap="round"/>`;
      o += `<path d="M-45,-9 C-20,-3 20,-3 45,-9 L44,2 C20,8 -20,8 -44,2 Z" fill="${cd}" ${stroke(s * 0.8)}/>`;
      o += `<ellipse cx="-20" cy="-30" rx="9" ry="5" transform="rotate(-25 -20 -30)" fill="${cl}" opacity=".7"/><circle cx="0" cy="-40" r="5" fill="${cd}" ${stroke(s * 0.7)}/>`;
      if (ctx.view !== "back") o += `<rect x="-15" y="-27" width="30" height="14" rx="3" fill="#FFFFFF" ${stroke(s * 0.6)}/><path d="M-9,-20 H9" stroke="#E8453C" stroke-width="${f2(s * 0.7)}" stroke-linecap="round"/>`;
      return o;
    }),
  });

  // ---- ランドセル: あかい はこ・まるい ふた・きんの とめがね・ひかる テープ。まえ むきでは かたの ベルト ----
  WEAR.mee_randoseru = (ctx) => {
    const c = ctx.col[0] || "#E2453F", m = ctx.col[1] || "#F2C14E", cd = shade(c, -0.22), cl = shade(c, 0.12);
    const box = (s) => `<rect x="-29" y="-22" width="58" height="62" rx="11" fill="${cd}" ${stroke(s)}/>`;
    const flap = (s) => `<path d="M-29,-8 C-29,-24 -19,-28 0,-28 C19,-28 29,-24 29,-8 L29,23 C29,31 22,33 0,33 C-22,33 -29,31 -29,23 Z" fill="${cl}" ${stroke(s)}/>` +
      `<path d="M-23,-6 C-23,-19 -15,-22 0,-22 C15,-22 23,-19 23,-6 L23,21 C23,26 18,27 0,27 C-18,27 -23,26 -23,21 Z" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="${f2(s * 0.32)}" stroke-dasharray="${f2(s * 0.9)} ${f2(s * 0.7)}"/>` +
      `<path d="M-23,9 H23" stroke="#FFF6C8" stroke-opacity=".85" stroke-width="${f2(s * 0.8)}" stroke-linecap="round"/>` +
      `<rect x="-7" y="25" width="14" height="10" rx="3" fill="${m}" ${stroke(s * 0.7)}/><circle cx="0" cy="30" r="2" fill="${shade(m, -0.3)}"/>`;
    if (ctx.view === "back") return { top: backWrap(ctx, (s) => box(s) + flap(s)) };
    const T = ctx.a.torso, strap = (col, w) => `<path d="M${f2(T.cx - T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx - T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx - T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx - T.w * 0.44)},${f2(T.top + 44)} M${f2(T.cx + T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx + T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx + T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx + T.w * 0.44)},${f2(T.top + 44)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
    return {
      behind: backWrap(ctx, (s) => `<g transform="translate(0,-8) scale(1.12)">${box(s)}<path d="M-29,-8 C-29,-24 -19,-28 0,-28 C19,-28 29,-24 29,-8" fill="${cl}" ${stroke(s)}/></g>`),
      torso: strap(INK, 9) + strap(c, 4),
    };
  };

  // ITEM_INDEX だけに いれる（WEAR_ITEMS には いれない。ねだん 0・rare・exclusive: "rental"）
  for (const it of ITEMS) ITEM_INDEX[it.id] = { ...it, wear: it.id, price: 0, rare: true, exclusive: "rental", rental: true };
  return { ITEMS, INDEX, IDS: ITEMS.map((it) => it.id) };
})();
