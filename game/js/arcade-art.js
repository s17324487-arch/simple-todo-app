// Meeときょれじゃ（池袋の ゲームセンター）の 内装。サンシャインいけぶ と おなじ 斜め上の 館（IsoVenue）。
// 什器は 種類ごとの SVG（キーは 種類・大きさ・台の 番号・向き だけ → 有限）。MallArt の くみたて（svgBuilder）・町の人・ベンチ などを つかう。
// クレーンの 台は なかの 景品（ArcadePrizes の ぬいぐるみ）・アーム・ガラス・かんばん。ひかる 電球と ネオンは canvas で 毎フレーム。
const ArcadeArt = (() => {
  // ガチャの かんばんの もじ（variant の ばんごう。0・1 は 2F の ガチャ コーナー、2〜7 は 4F の ガチャの しまの テーマ。js/gacha-forest.js の ISLES）
  const GACHA_BOARDS = ["ガチャ コーナー", "1かい 200コイン", "まちぼうけ", "スクイーズ", "ポーチ・ぼうし", "めじるし・もり", "ミニチュア", "ミニ グッズ"];
  const T = () => IsoVenue.T, A = () => IsoVenue.A, B = () => IsoVenue.B;
  const shade = (c, k) => MallArt.shade(c, k);
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${fill}" ${extra}>${t}</text>`;
  const img = (svg, x, y, w, h, extra = "") => `<image href="${U.svgUrl(svg)}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet" ${extra}/>`;
  const star = (x, y, r, fill, extra = "") => `<path d="${starPath(x, y, r, r * 0.45)}" fill="${fill}" ${extra}/>`;
  // ---- 台の 向き ----
  // 台は「まえ」が +y（dir 'y'）か +x（dir 'x'）。台の なかの 座標 u（まえから 見て 左→右）・v（おく→まえ）・z で 描いて、ゆかの 座標へ うつす
  const frame = (f) => {
    const dx = f.dir === "x", W = dx ? f.h : f.w, D = dx ? f.w : f.h;
    const Q = (u, v, z = 0) => (dx ? [v, W - u, z] : [u, v, z]);
    return { dx, W, D, Q, side: dx ? 0 : W };
  };
  // 台の なかの 箱（上・まえ・よこ の 3まい。見える よこ は side）
  const boxC = (S, F, u, v, w, d, z, h, [top, front, side], lw = 1.6) => {
    if (!F.dx) return S.box(u, v, w, d, z, h, [top, front, side], lw);
    return S.box(v, F.W - u - w, d, w, z, h, [top, side, front], lw);
  };
  const polyC = (S, F, list, fill, lw = 1.6, extra = "") => S.poly(list.map((p) => F.Q(...p)), fill, lw, extra);
  // まえ（v = D）・よこ（u = side）の 面に 2D の 絵を はる（x: 面の 右へ・y: 下へ。単位は 投影の 1）
  const onFace = (S, F, face, a, b, z, inner) => {
    const q = face === "front" ? S.P(...F.Q(a, F.D, z)) : S.P(...F.Q(F.side, a, z)), Av = A(), Bv = B();
    const m = face === "front" ? (F.dx ? [Av, -Bv] : [Av, Bv]) : F.dx ? [Av, Bv] : [Av, -Bv];
    return `<g transform="matrix(${f2(m[0])} ${f2(m[1])} 0 1 ${f2(q.x)} ${f2(q.y)})">${inner}</g>`;
  };
  // 面いっぱいに 絵（かべの もよう）: 台の おくの 面（v = v0）・u0..u1・z0..z1
  const backTex = (S, F, texKey, u0, u1, v0, z0, z1) => {
    const tex = CraneArt.TEX[texKey]; if (!tex) return "";
    const p0 = S.P(...F.Q(u0, v0, z1)), p1 = S.P(...F.Q(u1, v0, z1)), p2 = S.P(...F.Q(u0, v0, z0)), w = 200, h = 200;
    const a = (p1.x - p0.x) / w, b = (p1.y - p0.y) / w, c = (p2.x - p0.x) / h, d = (p2.y - p0.y) / h;
    return `<image href="${U.svgUrl(tex())}" width="${w}" height="${h}" preserveAspectRatio="none" transform="matrix(${f2(a)} ${f2(b)} ${f2(c)} ${f2(d)} ${f2(p0.x)} ${f2(p0.y)})"/>`;
  };
  const sideTex = (S, F, texKey, v0, v1, u, z0, z1) => {
    const tex = CraneArt.TEX[texKey]; if (!tex) return "";
    const p0 = S.P(...F.Q(u, v0, z1)), p1 = S.P(...F.Q(u, v1, z1)), p2 = S.P(...F.Q(u, v0, z0)), w = 200, h = 200;
    const a = (p1.x - p0.x) / w, b = (p1.y - p0.y) / w, c = (p2.x - p0.x) / h, d = (p2.y - p0.y) / h;
    return `<image href="${U.svgUrl(tex())}" width="${w}" height="${h}" preserveAspectRatio="none" transform="matrix(${f2(a)} ${f2(b)} ${f2(c)} ${f2(d)} ${f2(p0.x)} ${f2(p0.y)})"/>`;
  };
  // 景品の 絵（たって いる 絵を 床の 点に。足もとが 点）
  const standing = (S, F, svg, u, v, z, h, ratio = 1) => { const q = S.P(...F.Q(u, v, z)), w = h * ratio; S.grow(q.x - w / 2, q.y - h, q.x + w / 2, q.y); return img(svg, q.x - w / 2, q.y - h, w, h); };
  const prizeSvg = (id) => (ArcadePrizes.INDEX[id] ? ArcadePrizes.svg(id) : SnackArt.INDEX[id] ? SnackArt.svg(id) : CraneArt.TEX[{ ike_prize_1: "goji-front", ike_prize_3: "wanko-front", ike_prize_4: "gachan-front" }[id]] ? CraneArt.TEX[{ ike_prize_1: "goji-front", ike_prize_3: "wanko-front", ike_prize_4: "gachan-front" }[id]]() : Art.furnSvg(id));
  const ratioOf = (id) => { const it = ArcadePrizes.INDEX[id]; if (it) return it.crop[2] / it.crop[3]; if (SnackArt.INDEX[id]) return SnackArt.ratio(id); const c = { ike_prize_1: CraneArt.CROP.goji, ike_prize_3: CraneArt.CROP.wanko, ike_prize_4: CraneArt.CROP.gachan }[id]; return c ? c[2] / c[3] : 1; };

  // ---- 台の かたち（しゅるいごと）----
  // GH: ガラスの たかさ・HH: かんばんの たかさ
  const SPEC = { claw: { base: 74, GH: 124, HH: 42 }, big: { base: 74, GH: 150, HH: 46 }, ring: { base: 74, GH: 124, HH: 42 }, sweet: { base: 70, GH: 104, HH: 40 }, pusher: { base: 74, GH: 96, HH: 40 }, tripod: { base: 70, GH: 116, HH: 42 }, bridge: { base: 74, GH: 140, HH: 46 }, road: { base: 70, GH: 112, HH: 42 }, tower: { base: 74, GH: 128, HH: 44 }, tako: { base: 74, GH: 124, HH: 42 }, barber: { base: 74, GH: 140, HH: 46 }, bound: { base: 74, GH: 124, HH: 42 } };
  // road: おかし ロード（ベルトの トレジャーロード。UI-29）・tower: おかし タワー（リングフック）。3F（UI-23）。tako・barber・bound: 4F の たこやき・バーバーカット・バウンドボール（UI-54）
  const specOf = (i) => { const d = CraneMachines.DEFS[i]; return d.tower ? "tower" : d.type === "claw" && d.rig === CraneMachines.DEFS[1].rig ? "big" : d.type; };

  // よこに ながい おかし（はこ）は たかさを ひくく（はばが 台から はみでない）
  const tall = (id, h) => (SnackArt.INDEX[id] ? Math.min(h, (h * 0.85) / Math.max(0.6, ratioOf(id))) : h);
  // なかの 景品（台ごと）
  const inside = (S, F, i, z) => {
    const d = CraneMachines.DEFS[i], m = PrizeArcade.machines[i], W = F.W, D = F.D, kind = specOf(i), out = [];
    const ids = PrizeArcade.prizeList(i);
    if (kind === "claw") {
      // 山に つまれた ちいさな ぬいぐるみ（おくは 大きく、てまえは 小さく ならべない。3だん）
      const spots = [[0.55, 0.62, 0, 0], [1.05, 0.55, 0, 1], [1.5, 0.66, 0, 2], [0.8, 0.95, 6, 3], [1.3, 0.98, 6, 0], [1.05, 1.28, 12, 2], [1.55, 1.25, 4, 1]];
      for (const [u, v, dz, k] of spots) { const id = ids[k % ids.length]; out.push(standing(S, F, prizeSvg(id), u * W / 2, v * (D - 0.4) / 1.5 + 0.15, z + dz, tall(id, 40), ratioOf(id))); }
    } else if (kind === "big") {
      const id = ids[0]; out.push(standing(S, F, prizeSvg(id), W * 0.56, D * 0.5, z, 104, ratioOf(id)));
    } else if (kind === "ring") {
      for (let k = 0; k < 3; k++) {
        const u = W * (0.35 + k * 0.28), v = D * (k % 2 ? 0.42 : 0.62);
        if (m.coins) { const q = S.P(...F.Q(u, v, z)); S.grow(q.x - 26, q.y - 44, q.x + 26, q.y); out.push(img(CraneArt.TEX["chest-front"](), q.x - 22, q.y - 30, 44, 22) + `<circle cx="${f2(q.x)}" cy="${f2(q.y - 36)}" r="6" fill="none" stroke="${INK}" stroke-width="3.4"/><circle cx="${f2(q.x)}" cy="${f2(q.y - 36)}" r="6" fill="none" stroke="#F48FB1" stroke-width="2"/>`); }
        else { const id = ids[k % ids.length]; out.push(standing(S, F, prizeSvg(id), u, v, z, tall(id, 44), ratioOf(id))); const q = S.P(...F.Q(u, v, z + 52)); out.push(`<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="6" fill="none" stroke="${INK}" stroke-width="3.4"/><circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="6" fill="none" stroke="#F48FB1" stroke-width="2"/>`); }
      }
    } else if (kind === "sweet") {
      // まわる 台（しましま）と おしだしの ステージ。景品は まわりに たくさん
      const cu = W * 0.5, cv = D * 0.36, R = Math.min(W, D) * 0.3;
      out.push(S.cyl(cu, cv, R, z, 6, ["#FFF6EE", "#F2C9D8"], 1.4) + S.ellipse(cu, cv, z + 6, R * 0.55, "#FBE3EC", 1.2));
      out.push(boxC(S, F, 0.3, D - 0.95, W - 0.6, 0.45, z, 10, ["#FFF7E6", "#F7D9E4", "#EBC4D3"], 1.2));
      const piece = (u, v, zz) => { if (m.coins) { const q = S.P(...F.Q(u, v, zz)); S.grow(q.x - 8, q.y - 6, q.x + 8, q.y + 3); return `<ellipse cx="${f2(q.x)}" cy="${f2(q.y)}" rx="7" ry="3.4" fill="#F2C84B" stroke="${INK}" stroke-width="1.2"/><ellipse cx="${f2(q.x - 2)}" cy="${f2(q.y - 1)}" rx="2.6" ry="1.1" fill="#FFF3B0"/>`; } const id = ids[Math.floor(u * 7 + v * 5) % ids.length]; return standing(S, F, prizeSvg(id), u, v, zz, 17, ratioOf(id)); };
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; out.push(piece(cu + Math.cos(a) * R * 0.72, cv + Math.sin(a) * R * 0.72, z + 6)); }
      for (let k = 0; k < 7; k++) out.push(piece(0.5 + k * ((W - 1) / 6), D - 0.75 + (k % 2) * 0.12, z + 10));
      // ショベル
      out.push(S.line([[cu + R * 0.2, cv, z + 60], [cu + R * 0.7, cv + 0.1, z + 22]], "#8A939E", 3) + boxC(S, F, cu + R * 0.55, cv - 0.1, 0.3, 0.26, z + 12, 12, ["#E3E7EA", "#C9CED3", "#AEB5BC"], 1.2));
    } else if (kind === "pusher") {
      // コイン プッシャー: メダルの フィールド（こんいろ）・おくに おしだし台と スロットの かべ・メダルが たくさん
      const gv = D - 0.34, top = z + 22;
      out.push(boxC(S, F, 0.16, 0.16, W - 0.32, gv - 0.3, z, 22, ["#2E3A6B", "#F2C84B", "#D6A231"], 1.3));
      out.push(boxC(S, F, 0.2, 0.16, W - 0.4, 0.34, top, 44, [shade("#F2C84B", 0.2), "#D6A231", "#B9862A"], 1.3));
      { const q = S.P(...F.Q(W / 2, 0.5, top + 30)); S.grow(q.x - 22, q.y - 12, q.x + 22, q.y + 12); out.push(`<rect x="${f2(q.x - 20)}" y="${f2(q.y - 9)}" width="40" height="17" rx="3" fill="#1B1426" stroke="${INK}" stroke-width="1.2"/>` + [-12, 0, 12].map((d, k) => `<rect x="${f2(q.x + d - 5)}" y="${f2(q.y - 6.5)}" width="10" height="12" rx="2" fill="#FFFDF5"/><circle cx="${f2(q.x + d)}" cy="${f2(q.y - 0.5)}" r="3.4" fill="${["#FFFFFF", "#F7D66A", "#9A9FA8"][k]}" stroke="${INK}" stroke-width="0.9"/>`).join("")); }
      out.push(boxC(S, F, 0.22, 0.5, W - 0.44, 0.34, top, 7, [shade("#FFF3D0", 0), "#F2C84B", "#D6A231"], 1.2));
      const coin = (u, v, zz) => { const q = S.P(...F.Q(u, v, zz)); S.grow(q.x - 8, q.y - 5, q.x + 8, q.y + 4); return `<ellipse cx="${f2(q.x)}" cy="${f2(q.y + 1.6)}" rx="6.6" ry="3.1" fill="#B98A2C" stroke="${INK}" stroke-width="1"/><ellipse cx="${f2(q.x)}" cy="${f2(q.y)}" rx="6.6" ry="3.1" fill="#F2C84B" stroke="${INK}" stroke-width="1.1"/><ellipse cx="${f2(q.x - 1.8)}" cy="${f2(q.y - 0.7)}" rx="2.3" ry="0.9" fill="#FFF3B0"/>`; };
      for (let k = 0; k < 16; k++) { const u = 0.4 + ((k * 0.37) % 1) * (W - 0.8), v = 0.95 + ((k * 0.61) % 1) * (gv - 1.35); out.push(coin(u, v, top + (k % 3 === 0 ? 2.5 : 0))); }
    } else if (kind === "bridge") {
      // はしわたし: てまえ → おくの 2本の ぼう（あしつき）・ぼうの あいだは くらい あな・うえに まどつきの はこ（その日の けいひん）
      const B = d.bars, u0 = W * (B.x0 / d.box.w), u1 = W * (B.x1 / d.box.w), bz = z + 30, v0 = 0.22, v1 = D - 0.62, col = B.rubber ? "#E26A98" : "#AEB5BC";
      out.push(polyC(S, F, [[u0, v0, z + 0.5], [u1, v0, z + 0.5], [u1, v1, z + 0.5], [u0, v1, z + 0.5]], "#2A2238", 1.2));
      for (const u of [u0, u1]) { for (const v of [v0, v1]) out.push(S.line([F.Q(u, v, z), F.Q(u, v, bz)], "#6C7582", 3)); out.push(S.line([F.Q(u, v0, bz), F.Q(u, v1, bz)], INK, 5.4) + S.line([F.Q(u, v0, bz), F.Q(u, v1, bz)], col, 3)); }
      const id = ids[0], h = 34; out.push(standing(S, F, BridgePrizes.boxSvg(id), (u0 + u1) / 2, D * 0.5, bz + 1, h, BridgePrizes.ratio()));
    } else if (kind === "road") {
      // おかし ロード: 7れつの ベルト（しましま）の たな・まえの ふちの ひかり・2れつに またがる おかしの はこ（3ぎょう・まえの ぎょうは 2だん）
      const sv = D * 0.12, top = z + 30, n = 7, lw = (W - 0.24) / n, col = (k) => (SnackArt.INDEX[ids[k % ids.length]] || { col: ["#FFE2A8", "#E4983A"] }).col;
      out.push(boxC(S, F, 0.12, sv, W - 0.24, D - 0.5 - sv, z, 30, [shade("#F7E3C8", 0), shade("#C99B76", 0), shade("#B07E58", 0)], 1.3));
      for (let k = 0; k < n; k++) out.push(polyC(S, F, [[0.12 + k * lw, sv, top + 0.2], [0.12 + (k + 1) * lw, sv, top + 0.2], [0.12 + (k + 1) * lw, D - 0.5, top + 0.2], [0.12 + k * lw, D - 0.5, top + 0.2]], k % 2 ? "#4A4458" : "#5B5670", 0.8));
      for (let k = 0; k < n; k++) out.push(S.ellipse(0.12 + (k + 0.5) * lw, sv + 0.02, top - 4, 0.035, k === 3 ? "#FFF3A0" : "#FF9FC2", 0.8));
      out.push(boxC(S, F, 0.12, 0.08, W - 0.24, sv, z, 64, ["#E58DAE", "#F7B6CF", "#D07A9C"], 1.2));
      [[1, 3, 5], [2, 4, 6], [1, 3, 5]].forEach((ks, j) => ks.forEach((k, i) => { const [c, band] = col(i + j * 3), u = 0.12 + k * lw - lw * 0.85, v = sv + 0.06 + j * ((D - 0.62 - sv) / 3); out.push(boxC(S, F, u, v, lw * 1.7, 0.36, top, 9, [shade(c, 0.15), c, band], 1.1)); if (j === 0) out.push(boxC(S, F, u, v, lw * 1.7, 0.36, top + 9, 9, [shade(c, 0.15), c, band], 1.1)); }));
    } else if (kind === "tower") {
      // おかし タワー: とりだしぐちの よこの だいに つんだ はこ 5だん・まんなかの だんに みどりの わっか
      const cu = W * 0.56, cv = D * 0.62, top = z + 16;
      out.push(boxC(S, F, cu - 0.5, cv - 0.32, 1.0, 0.6, z, 16, ["#E26A98", "#B996DC", "#9472C2"], 1.3));
      for (let k = 0; k < 5; k++) { const id = ids[(k * 7 + 1) % ids.length], it = SnackArt.INDEX[id] || { col: ["#FFE2A8", "#E4983A"] }, [c, band] = it.col, wide = k % 2 === 0; out.push(boxC(S, F, cu - (wide ? 0.42 : 0.28), cv - (wide ? 0.26 : 0.36), wide ? 0.84 : 0.56, wide ? 0.52 : 0.72, top + k * 13, 13, [shade(c, 0.15), c, band], 1.1)); }
      const q = S.P(...F.Q(cu + 0.62, cv, top + 2 * 13 + 6)); S.grow(q.x - 9, q.y - 9, q.x + 9, q.y + 9);
      out.push(`<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="6.4" fill="none" stroke="${INK}" stroke-width="3.6"/><circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="6.4" fill="none" stroke="#5BC46A" stroke-width="2.2"/>`);
    } else if (kind === "tako" || kind === "barber" || kind === "bound") {
      // 4F（UI-54）。台の なかの cm（x: ひだり→みぎ・y: うえ・z: まえ→おく）を 絵の u・v・たかさへ
      const M = d.box, gv = D - 0.34, k = SPEC[kind].GH / M.h, U = (x) => (x / M.w) * W, V = (zz) => 0.1 + (1 - zz / M.d) * (gv - 0.2), Z = (y) => z + y * k;
      const dot = (u, v, zz, r, fill, lw = 0.9) => { const q = S.P(...F.Q(u, v, zz)); S.grow(q.x - r - 1, q.y - r - 1, q.x + r + 1, q.y + r + 1); return `<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="${f2(r)}" fill="${fill}" stroke="${INK}" stroke-width="${lw}"/>`; };
      if (kind === "tako") {
        // みぎに てっぱん（くぼみ 4×4・あかい わの あたり）・ひだりに ピンポンだまの やま・まえの ひだりに けいひんの つつ（その日の ミニマスコット）
        const P = d.plate, T = d.tube, u0 = U(P.x0), u1 = U(P.x1), v0 = V(P.z1), v1 = V(P.z0);
        out.push(boxC(S, F, u0, v0, u1 - u0, v1 - v0, z, P.top * k, ["#6E7483", "#4A4F5B", "#3B3F49"], 1.2));
        P.holes.forEach(([x, zz], h) => { const [a, b] = F.Q(U(x), V(zz)); if (P.hits.includes(h)) out.push(S.ellipse(a, b, Z(P.top) + 0.2, (P.hr + 1) / M.w * W, "#FF6B7E", 0.8)); out.push(S.ellipse(a, b, Z(P.top) + 0.4, P.hr / M.w * W, "#1E2128", 0.8)); });
        for (let n = 0; n < 16; n++) out.push(dot(U(6 + ((n * 0.37) % 1) * 21), V(20 + ((n * 0.61) % 1) * 24), z + 4 + (n % 3) * 3, 3.1, n % 3 ? "#FFFFFF" : "#FFB25B"));
        for (const [x, zz] of [[40.5, 21], [46.5, 27]]) out.push(dot(U(x), V(zz), Z(P.top) + 3, 3.1, "#FFFFFF"));
        const [tx, ty] = F.Q(U(T.x), V(T.z)); out.push(S.cyl(tx, ty, 0.16, Z(T.y), 70, ["#E9F6FB55", "#DDF3FF44"], 1.2));
        out.push(standing(S, F, prizeSvg(ids[0]), U(T.x), V(T.z), Z(T.y) + 6, 20, ratioOf(ids[0])));
      } else if (kind === "barber") {
        // すべりだい・てんじょうから ひもで つるした はこ 3つ（その日の けいひん）・まえの ハサミ
        const Sl = d.slope, C = d.cut, bh = 26 / BridgePrizes.ratio();
        out.push(polyC(S, F, [[U(Sl.x0), V(Sl.z1), Z(Sl.y1)], [U(Sl.x1), V(Sl.z1), Z(Sl.y1)], [U(Sl.x1), V(Sl.z0), Z(Sl.y0)], [U(Sl.x0), V(Sl.z0), Z(Sl.y0)]], shade(CraneArt.THEME[d.theme].body, 0.4), 1.2));
        d.slots.forEach(([x, zz], n) => {
          const u = U(x), v = V(zz), id = ids[n % ids.length];
          out.push(S.line([F.Q(u, v, Z(C.ceil)), F.Q(u, v, Z(d.hang))], INK, 2.6) + S.line([F.Q(u, v, Z(C.ceil)), F.Q(u, v, Z(d.hang))], "#FFF6E0", 1.3));
          out.push(standing(S, F, BridgePrizes.boxSvg(id), u, v, Z(d.hang) - bh, bh, BridgePrizes.ratio()));
        });
        const sq = S.P(...F.Q(U(22), V(12), Z(C.y))); S.grow(sq.x - 10, sq.y - 8, sq.x + 10, sq.y + 8);
        out.push(`<path d="M${f2(sq.x - 7)} ${f2(sq.y + 4)} L${f2(sq.x + 6)} ${f2(sq.y - 4)} M${f2(sq.x - 7)} ${f2(sq.y - 2)} L${f2(sq.x + 6)} ${f2(sq.y + 1)}" stroke="#8A939E" stroke-width="2.2" stroke-linecap="round"/><circle cx="${f2(sq.x - 8)}" cy="${f2(sq.y + 4)}" r="2.6" fill="none" stroke="#5B8FD9" stroke-width="1.8"/><circle cx="${f2(sq.x - 8)}" cy="${f2(sq.y - 2)}" r="2.6" fill="none" stroke="#FF8FB8" stroke-width="1.8"/>`);
      } else {
        // まえの まんなかの ゴムボール（ささえの はしら）・まえの とりだしぐちの あな・おくに ちいさな ぬいぐるみ
        const B = d.ball, ch = d.chute;
        out.push(polyC(S, F, [[U(ch.x0), V(ch.z1), z + 0.5], [U(ch.x1), V(ch.z1), z + 0.5], [U(ch.x1), V(ch.z0), z + 0.5], [U(ch.x0), V(ch.z0), z + 0.5]], "#2A2238", 1.2));
        [[16, 40, 0], [30, 41, 1], [44, 38, 2], [23, 33, 3], [38, 32, 0]].forEach(([x, zz, n]) => { const id = ids[n % ids.length]; out.push(standing(S, F, prizeSvg(id), U(x), V(zz), z, 30, ratioOf(id))); });
        out.push(S.line([F.Q(U(B.c[0]), V(B.c[2]), z), F.Q(U(B.c[0]), V(B.c[2]), Z(B.c[1]))], "#8A939E", 4));
        const q = S.P(...F.Q(U(B.c[0]), V(B.c[2]), Z(B.c[1]))), rr = B.r * k * 0.92; S.grow(q.x - rr - 2, q.y - rr - 2, q.x + rr + 2, q.y + rr + 2);
        out.push(`<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="${f2(rr)}" fill="#F25F8C" stroke="${INK}" stroke-width="1.6"/><path d="M${f2(q.x - rr * 0.95)} ${f2(q.y + rr * 0.1)} Q${f2(q.x)} ${f2(q.y + rr * 0.45)} ${f2(q.x + rr * 0.95)} ${f2(q.y + rr * 0.1)}" fill="none" stroke="#FFFFFF" stroke-width="${f2(Math.max(1.6, rr * 0.13))}" opacity="0.7"/><ellipse cx="${f2(q.x - rr * 0.38)}" cy="${f2(q.y - rr * 0.45)}" rx="${f2(rr * 0.2)}" ry="${f2(rr * 0.12)}" fill="#FFFFFF" opacity="0.85"/>`);
      }
    } else if (kind === "tripod") {
      // あなと ランプの わ・3本の アームの 上の 景品
      const cu = W / 2, cv = D * 0.5, R = Math.min(W, D) * 0.28;
      out.push(S.ellipse(cu, cv, z + 0.5, R + 0.08, "#D9DEE7", 1.4) + S.ellipse(cu, cv, z + 1, R * 0.72, "#2A2238", 1.6));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, q = S.P(...F.Q(cu + Math.cos(a) * R * 0.88, cv + Math.sin(a) * R * 0.88, z + 1.5)); out.push(`<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="2.4" fill="${k % 3 ? "#FFFFFF" : "#FF8FB8"}" stroke="${INK}" stroke-width="0.8"/>`); }
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; out.push(S.line([[cu + Math.cos(a) * R * 0.9, cv + Math.sin(a) * R * 0.9, z + 2], [cu + Math.cos(a) * R * 0.25, cv + Math.sin(a) * R * 0.25, z + 18]], "#8A939E", 3)); }
      const id = ids[0]; out.push(standing(S, F, prizeSvg(id), cu, cv, z + 18, 70, ratioOf(id)));
    }
    return out.join("");
  };
  // アーム（くるま・ケーブル・つめ）。リングは フック
  const claw = (S, F, i, zTop) => {
    const kind = specOf(i); if (kind === "sweet" || kind === "tripod" || kind === "pusher" || kind === "road" || kind === "barber") return "";
    const W = F.W, D = F.D, u = W * 0.62, v = (D - 0.4) * 0.45, big = kind === "big" || kind === "bridge";
    let s = S.line([F.Q(0.16, v, zTop - 5), F.Q(W - 0.16, v, zTop - 5)], "#8A939E", 3);
    s += boxC(S, F, u - 0.13, v - 0.13, 0.26, 0.26, zTop - 14, 10, ["#DDE3EA", "#9AA3AE", "#7E8794"], 1.2);
    const top = S.P(...F.Q(u, v, zTop - 14)), hub = S.P(...F.Q(u, v, zTop - (big ? 58 : 48)));
    s += `<path d="M${f2(top.x)} ${f2(top.y)} V${f2(hub.y)}" stroke="#5E6670" stroke-width="1.6"/>`;
    const hook = kind === "ring" || kind === "tower";
    s += `<ellipse cx="${f2(hub.x)}" cy="${f2(hub.y)}" rx="${big ? 10 : 7.5}" ry="${big ? 4.6 : 3.6}" fill="${hook ? "#F9D56E" : "#9ED36A"}" stroke="${INK}" stroke-width="1.5"/>`;
    const L = big ? 26 : 18, sp = big ? 12 : 8;
    if (hook) s += `<path d="M${f2(hub.x - 5)} ${f2(hub.y + 2)} l-2 ${L * 0.8} q3 5 7 1 M${f2(hub.x + 5)} ${f2(hub.y + 2)} l2 ${L * 0.8} q-3 5 -7 1" fill="none" stroke="#8A939E" stroke-width="2.4" stroke-linecap="round"/>`;
    else for (const k of big ? [-1, 1] : [-1, 0, 1]) s += `<path d="M${f2(hub.x + k * 3)} ${f2(hub.y + 2)} L${f2(hub.x + k * sp)} ${f2(hub.y + L * 0.62)} L${f2(hub.x + k * (sp - 3))} ${f2(hub.y + L)}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${f2(hub.x + k * 3)} ${f2(hub.y + 2)} L${f2(hub.x + k * sp)} ${f2(hub.y + L * 0.62)} L${f2(hub.x + k * (sp - 3))} ${f2(hub.y + L)}" fill="none" stroke="#C9D0DA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  };
  // クレーンの 台 1台（f.machine・f.dir）
  const crane = (S, f) => {
    const F = frame(f), W = F.W, D = F.D, i = f.machine, th = CraneArt.THEME[CraneMachines.DEFS[i].theme], kind = specOf(i), P = SPEC[kind];
    const z0 = P.base, z1 = z0 + P.GH, z2 = z1 + P.HH, body = [shade(th.body, 0.12), th.body, th.body2], dark = shade(th.body2, -0.25), m = PrizeArcade.machines[i];
    const gv = D - 0.34; // ガラスの まえ（その まえは そうさばん）
    let s = S.ellipse(f.w / 2, f.h / 2, 0, Math.max(f.w, f.h) * 0.46, "#0000002E", 0);
    // したの 箱（まえに とりだしぐち・コインの いれぐち・スピーカー）
    s += boxC(S, F, 0.06, 0.06, W - 0.12, gv - 0.06, 0, z0, body, 1.8);
    s += boxC(S, F, 0.02, 0.02, W - 0.04, gv - 0.02, 0, 8, ["#3A3150", "#2B2440", "#241E36"], 1.2);
    // そうさばん（ななめの いた・レバー・ボタン）
    s += polyC(S, F, [[0.1, gv, z0 - 18], [W - 0.1, gv, z0 - 18], [W - 0.1, D - 0.04, z0 - 26], [0.1, D - 0.04, z0 - 26]], th.body2, 1.6);
    s += polyC(S, F, [[0.1, gv, z0 - 18], [W - 0.1, gv, z0 - 18], [W - 0.1, gv, z0 + 4], [0.1, gv, z0 + 4]], "none", 0);
    s += polyC(S, F, [[0.1, gv - 0.02, z0 + 4], [W - 0.1, gv - 0.02, z0 + 4], [W - 0.1, D - 0.04, z0 - 8], [0.1, D - 0.04, z0 - 8]], shade(th.body, 0.25), 1.6);
    s += polyC(S, F, [[0.1, D - 0.04, z0 - 8], [W - 0.1, D - 0.04, z0 - 8], [W - 0.1, D - 0.04, z0 - 26], [0.1, D - 0.04, z0 - 26]], th.body, 1.6);
    const panelMid = (gv + D) / 2;
    if (kind === "sweet" || kind === "pusher") for (const [k, c] of kind === "pusher" ? [[0.26, "#FFFFFF"], [0.42, "#FFFFFF"], [0.66, "#7ED957"]] : [[0.34, "#FF7BA8"], [0.62, "#7ED957"]]) { const q = S.P(...F.Q(W * k, panelMid, z0 - 1)); s += `<ellipse cx="${f2(q.x)}" cy="${f2(q.y)}" rx="8" ry="4.2" fill="${shade(c, -0.3)}" stroke="${INK}" stroke-width="1.3"/><ellipse cx="${f2(q.x)}" cy="${f2(q.y - 2)}" rx="7" ry="3.6" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`; }
    else { const j = S.P(...F.Q(W * 0.3, panelMid, z0 - 1)); s += `<ellipse cx="${f2(j.x)}" cy="${f2(j.y)}" rx="6" ry="3" fill="#2B2440"/><path d="M${f2(j.x)} ${f2(j.y)} V${f2(j.y - 12)}" stroke="${INK}" stroke-width="2.4"/><circle cx="${f2(j.x)}" cy="${f2(j.y - 13)}" r="4.4" fill="#FF7BA8" stroke="${INK}" stroke-width="1.3"/>`; const b2 = S.P(...F.Q(W * 0.68, panelMid, z0 - 1)); s += `<ellipse cx="${f2(b2.x)}" cy="${f2(b2.y)}" rx="8" ry="4.2" fill="#3D8A2E" stroke="${INK}" stroke-width="1.3"/><ellipse cx="${f2(b2.x)}" cy="${f2(b2.y - 2)}" rx="7" ry="3.6" fill="#7ED957" stroke="${INK}" stroke-width="1.2"/>`; }
    // まえの 絵: とりだしぐち（ひだり）・100コインの いれぐち（みぎ）・しましま
    const wideDoor = kind === "tripod" || kind === "sweet" || kind === "pusher" || kind === "bridge" || kind === "road" || kind === "barber" || kind === "bound", fw = W * 48, door = wideDoor ? [fw * 0.34, fw * 0.66] : [fw * 0.08, fw * 0.42];
    s += onFace(S, F, "front", 0.06, 0, z0 - 30, `<rect x="0" y="0" width="${f2(fw - 6)}" height="7" fill="${th.trim}" opacity="0.9"/>`);
    s += onFace(S, F, "front", 0, 0, z0 - 34, `<rect x="${f2(door[0])}" y="4" width="${f2(door[1] - door[0])}" height="26" rx="4" fill="#2A2238" stroke="${INK}" stroke-width="1.6"/><rect x="${f2(door[0] + 3)}" y="7" width="${f2(door[1] - door[0] - 6)}" height="9" rx="2" fill="#DDF3FF" opacity="0.55"/>${txt((door[0] + door[1]) / 2, 27, 7.4, "とりだしぐち", "#FFF7E0")}`);
    const slot = wideDoor ? fw * 0.82 : fw * 0.7;
    s += onFace(S, F, "front", 0, 0, z0 - 34, `<rect x="${f2(slot - 11)}" y="4" width="22" height="24" rx="3" fill="#E6E0CF" stroke="${INK}" stroke-width="1.4"/><path d="M${f2(slot - 5)} 10 H${f2(slot + 5)}" stroke="${INK}" stroke-width="2"/>${txt(slot, 24, 8, "100", INK)}`);
    // よこの 絵（台の 景品の ポスター）
    const ids = PrizeArcade.prizeList(i), sideLen = gv * 48;
    s += onFace(S, F, "side", F.dx ? 0.1 : gv - 0.1, 0, z0 - 8, `<rect x="0" y="0" width="${f2(sideLen - 12)}" height="${f2(z0 - 22)}" rx="6" fill="${shade(th.body, 0.3)}" stroke="${INK}" stroke-width="1.4"/>${m.coins ? `<circle cx="${f2(sideLen / 2 - 6)}" cy="${f2((z0 - 22) / 2)}" r="16" fill="#F2C84B" stroke="${INK}" stroke-width="2"/>${star(sideLen / 2 - 6, (z0 - 22) / 2, 8, "#FFF3B0")}` : img(prizeSvg(ids[0]), sideLen / 2 - 6 - 22, 4, 44, z0 - 30)}`);
    // ガラスの なか: おくの かべ・よこの かべ（台の もよう）・ゆか・景品・アーム
    const farSide = F.dx ? W - 0.1 : 0.1;
    s += polyC(S, F, [[0.1, 0.1, z0], [W - 0.1, 0.1, z0], [W - 0.1, 0.1, z1], [0.1, 0.1, z1]], th.glow, 1.4) + backTex(S, F, th.wall, 0.1, W - 0.1, 0.1, z0, z1);
    s += polyC(S, F, [[farSide, 0.1, z0], [farSide, gv, z0], [farSide, gv, z1], [farSide, 0.1, z1]], shade(th.glow, -0.1), 1.4) + sideTex(S, F, th.wall, 0.1, gv, farSide, z0, z1);
    s += polyC(S, F, [[farSide, 0.1, z0], [farSide, gv, z0], [farSide, gv, z1], [farSide, 0.1, z1]], "#2B244033", 0);
    s += polyC(S, F, [[0.1, 0.1, z0], [W - 0.1, 0.1, z0], [W - 0.1, gv, z0], [0.1, gv, z0]], th.floor === "floor-gold" ? "#24305C" : shade(th.body, 0.35), 1.4);
    // とりだしぐちの 上の とうめいな はこ（アームの 台）
    if (kind === "claw" || kind === "big" || kind === "ring" || kind === "tower" || kind === "tako") s += boxC(S, F, 0.14, gv - 0.62, 0.52, 0.5, z0, 16, ["#DDF3FF55", "#DDF3FF44", "#DDF3FF33"], 1.1);
    s += inside(S, F, i, z0) + claw(S, F, i, z1);
    // ガラス（まえ・よこ）と はしら
    const glassFront = [[0.1, gv, z0], [W - 0.1, gv, z0], [W - 0.1, gv, z1], [0.1, gv, z1]], sideU = F.side === 0 ? 0.1 : W - 0.1;
    s += polyC(S, F, glassFront, "#DDF3FF", 1.4, `fill-opacity="0.16"`) + polyC(S, F, [[sideU, 0.1, z0], [sideU, gv, z0], [sideU, gv, z1], [sideU, 0.1, z1]], "#DDF3FF", 1.4, `fill-opacity="0.22"`);
    s += polyC(S, F, [[0.26, gv, z1 - 8], [0.46, gv, z1 - 8], [0.2, gv, z0 + 30], [0.1, gv, z0 + 30]], "#FFFFFF", 0, `fill-opacity="0.38"`) + polyC(S, F, [[W * 0.62, gv, z1 - 6], [W * 0.7, gv, z1 - 6], [W * 0.5, gv, z0 + 60], [W * 0.46, gv, z0 + 60]], "#FFFFFF", 0, `fill-opacity="0.26"`);
    for (const [u, v] of [[0.06, gv - 0.06], [W - 0.14, gv - 0.06], [F.side === 0 ? 0.06 : W - 0.14, 0.06]]) s += boxC(S, F, u, v, 0.08, 0.08, z0, P.GH, ["#E3E7EA", th.body2, dark], 1.1);
    // かんばん（まえ: クリームの いたに 名前・ふちに でんきゅう）
    s += boxC(S, F, 0.02, 0.02, W - 0.04, gv - 0.0, z1, P.HH, [shade(th.body, 0.08), th.body, th.body2], 1.8);
    const signW = (W - 0.04) * 48, sh = P.HH;
    s += onFace(S, F, "front", 0.02, 0, z1 + sh, `<rect x="6" y="6" width="${f2(signW - 12)}" height="${f2(sh - 12)}" rx="7" fill="#FFF8EE" stroke="${INK}" stroke-width="1.6"/>${txt(signW / 2, sh / 2 + 5, Math.min(15, (signW - 26) / Math.max(4, th.sign.length) * 1.5), th.sign, shade(th.body2, -0.35), `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}${Array.from({ length: Math.round(signW / 12) }, (_, k) => `<circle cx="${f2(8 + k * ((signW - 16) / Math.max(1, Math.round(signW / 12) - 1)))}" cy="3.2" r="2.1" fill="${th.trim}" stroke="${INK}" stroke-width="0.7"/>`).join("")}`);
    s += onFace(S, F, "side", F.dx ? 0.1 : gv - 0.1, 0, z1 + sh, `${star(12, sh / 2, 7, th.trim, `stroke="${INK}" stroke-width="1"`)}${star(gv * 48 - 30, sh / 2, 6, "#FFFFFF", `stroke="${INK}" stroke-width="1"`)}`);
    // ほし の かざり（上）
    const tp = S.P(...F.Q(W / 2, gv / 2, z2 + 2)); S.grow(tp.x - 14, tp.y - 26, tp.x + 14, tp.y);
    s += star(tp.x, tp.y - 12, 11, th.trim, `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`);
    return s;
  };
  // ---- ほかの 什器 ----
  const M = {
    crane,
    // ガチャガチャ（1だい。カプセルの まるい まど・まわす つまみ・景品の カード）
    gacha(S, f) {
      const F = frame(f), W = F.W, D = F.D, v = f.variant || 0, GS0 = typeof Gacha !== "undefined" ? Gacha.SERIES[v % Gacha.SERIES.length] : null, c = GS0 ? GS0.color : ["#F29BB2", "#8EC5E8", "#F7C95B", "#9ED3A8", "#C9B6EE", "#F2A65E"][v % 6];
      let s = S.ellipse(W / 2, D / 2, 0, 0.46, "#0000002A", 0) + boxC(S, F, 0.12, 0.12, W - 0.24, D - 0.24, 0, 64, [shade(c, 0.15), c, shade(c, -0.18)], 1.6);
      s += boxC(S, F, 0.1, 0.1, W - 0.2, D - 0.2, 64, 5, ["#FFFFFF", "#E8E0D0", "#D6CFC2"], 1.2);
      const g = S.P(...F.Q(W / 2, D / 2, 96)); S.grow(g.x - 22, g.y - 24, g.x + 22, g.y + 22);
      s += `<circle cx="${f2(g.x)}" cy="${f2(g.y)}" r="20" fill="#E9F6FB" fill-opacity="0.75" stroke="${INK}" stroke-width="1.6"/>`;
      for (let k = 0; k < 9; k++) { const a = k * 2.3, rr = 5 + (k % 3) * 4.5; s += `<circle cx="${f2(g.x + Math.cos(a) * rr)}" cy="${f2(g.y + 6 + Math.sin(a) * rr * 0.6)}" r="4.6" fill="${["#F7A9C8", "#FFE07A", "#9ED3C6", "#C9B6EE", "#F2A65E"][k % 5]}" stroke="${INK}" stroke-width="0.9"/>`; }
      s += `<path d="M${f2(g.x - 12)} ${f2(g.y - 12)} q6 -5 12 -4" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
      const who = ["wanko", "gachan", "goji", "bear", "panda", "penguin"][v % 6], GS = typeof Gacha !== "undefined" ? Gacha.SERIES[v % Gacha.SERIES.length] : null;
      const card = GS ? Gacha.pic(GS.list[Gacha.RARE]) : ArcadePrizes.INDEX[`ike_mini_${who}`] ? ArcadePrizes.svg(`ike_mini_${who}`) : ArcadePrizes.svg(`ike_plush_${who}`);
      s += onFace(S, F, "front", 0.12, 0, 60, `<rect x="4" y="4" width="${f2((W - 0.24) * 48 - 8)}" height="26" rx="4" fill="#FFFDF5" stroke="${INK}" stroke-width="1.2"/>${img(card, (W - 0.24) * 24 - 13, 6, 26, 22)}<circle cx="${f2((W - 0.24) * 24)}" cy="42" r="7" fill="#F4F0FA" stroke="${INK}" stroke-width="1.4"/><path d="M${f2((W - 0.24) * 24 - 6)} 42 H${f2((W - 0.24) * 24 + 6)}" stroke="${INK}" stroke-width="2"/><rect x="${f2((W - 0.24) * 24 - 8)}" y="52" width="16" height="8" rx="2" fill="#2A2238"/>`);
      // 4F（ガチャガチャの もり）の 台: まるい まどの うえに はっぱ 2まい と どんぐり
      if (GS0 && GS0.forest) {
        const t = S.P(...F.Q(W / 2, D / 2, 118)); S.grow(t.x - 20, t.y - 16, t.x + 20, t.y + 8);
        for (const [dx, a, c2] of [[-7, -32, "#7DBA4C"], [7, 32, "#9ED36A"]]) s += `<ellipse cx="${f2(t.x + dx)}" cy="${f2(t.y - 4)}" rx="9" ry="4.6" transform="rotate(${a} ${f2(t.x + dx)} ${f2(t.y - 4)})" fill="${c2}" stroke="${INK}" stroke-width="1.2"/>`;
        s += `<ellipse cx="${f2(t.x)}" cy="${f2(t.y + 1)}" rx="4.2" ry="5" fill="#C98E5C" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(t.x - 5)} ${f2(t.y - 1)} q5 -6 10 0 z" fill="#7A5230" stroke="${INK}" stroke-width="1.2"/>`;
      }
      // 4F の シールの 台（js/sticker-book.js）: まるい まどの うえに ハートの シール（しろい ふち）
      if (GS0 && GS0.sticker && typeof StickerArt !== "undefined") {
        const t = S.P(...F.Q(W / 2, D / 2, 118)); S.grow(t.x - 15, t.y - 15, t.x + 15, t.y + 9);
        const d = StickerArt.heartD(t.x, t.y - 3, 0.36);
        s += `<path d="${d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="4.4" stroke-linejoin="round"/><path d="${d}" fill="#FF8FB0" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(t.x - 7)} ${f2(t.y - 5)} q1 -3 4 -4" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`;
      }
      // しゅうがわりで こんしゅう はいった 台（js/mee-rotation.js の f.fresh）: うえに「NEW」の はた（ほんものの カプセルトイの 店の POP と おなじ）
      if (f.fresh) {
        const b = S.P(...F.Q(W * 0.78, D * 0.3, 104)), t = S.P(...F.Q(W * 0.78, D * 0.3, 170)); S.grow(t.x - 4, t.y - 6, t.x + 44, b.y + 2);
        s += `<path d="M${f2(b.x)} ${f2(b.y)} V${f2(t.y - 3)}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M${f2(b.x)} ${f2(b.y)} V${f2(t.y - 3)}" stroke="#E6E9F2" stroke-width="1.8" stroke-linecap="round"/>`;
        s += `<path d="M${f2(t.x)} ${f2(t.y)} H${f2(t.x + 40)} L${f2(t.x + 34)} ${f2(t.y + 11)} L${f2(t.x + 40)} ${f2(t.y + 22)} H${f2(t.x)} Z" fill="#E8434F" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>${txt(t.x + 17, t.y + 15.6, 12.5, "NEW", "#FFFFFF")}<circle cx="${f2(b.x)}" cy="${f2(t.y - 3)}" r="2.6" fill="#FFE07A" stroke="${INK}" stroke-width="1.1"/>`;
      }
      return s;
    },
    // ぷりくら（しゃしんの ブース。まえに カーテン・よこに ポスター）。variant = ブース（0 ゆめかわ・1 がっこう・2 おでかけ）で いろ・かんばん・ポスターが ちがう
    photobooth(S, f) {
      const F = frame(f), W = F.W, D = F.D, h = 210, v = (f.variant || 0) % 3;
      const T = [
        { body: ["#F8C8DA", "#F29BB8", "#D9789B"], cur: "#FFF1F6", fold: "#F2C1D2", rod: "#D9789B", ink: "#E0668F", sign: "ゆめかわ ぷりくら", poster: "#CDE8F8", say: "3にんで パシャ！", side: ["かわいく", "とれるよ"] },
        { body: ["#D3DEF2", "#7F98CF", "#5C76B3"], cur: "#EEF3FF", fold: "#C7D3EE", rod: "#4A67B0", ink: "#3E5C9A", sign: "がっこう ぷりくら", poster: "#3E7A5C", say: "がっこうで パシャ！", side: ["きょうしつ", "たいいくかん"] },
        { body: ["#CFEBF6", "#7FC6E4", "#4FA6CC"], cur: "#F0FAFF", fold: "#BFE3F2", rod: "#2E86B3", ink: "#2E86B3", sign: "おでかけ ぷりくら", poster: "#FFD3EA", say: "おでかけ きぶん！", side: ["ゆうえんち", "うちゅう"] },
      ][v];
      let s = S.ellipse(W / 2, D / 2, 0, Math.max(W, D) * 0.45, "#0000002A", 0) + boxC(S, F, 0.08, 0.08, W - 0.16, D - 0.16, 0, h, T.body, 1.8);
      // カーテン（まえの ひだり）
      const cw = W * 0.5 * 48;
      s += onFace(S, F, "front", 0.4, 0, h - 26, `<rect x="0" y="0" width="${f2(cw)}" height="${f2(h - 36)}" fill="${T.cur}" stroke="${INK}" stroke-width="1.4"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${f2(8 + k * (cw - 16) / 5)} 2 V${f2(h - 38)}" stroke="${T.fold}" stroke-width="3"/>`).join("")}<path d="M0 0 H${f2(cw)}" stroke="${T.rod}" stroke-width="6"/>`);
      // まえの みぎ: 3人の しゃしんの ポスター（がっこうは こくばん・おでかけは かんらんしゃ）
      const px = W * 0.58 * 48, pw = (W * 0.36) * 48, heroes = ["ike_chibi_wanko_0", "ike_chibi_gachan_1", "ike_chibi_goji_0"], ph = h - 104;
      const deco = v === 1 ? `<path d="M${f2(px + 12)} 22 h${f2(pw - 24)}" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/>${txt(px + pw / 2, 40, 10, "なかよし", "#FFFFFF")}`
        : v === 2 ? `<circle cx="${f2(px + pw / 2)}" cy="38" r="22" fill="none" stroke="#F29BB8" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${f2(px + pw / 2 + Math.cos(k * 1.047) * 22)}" cy="${f2(38 + Math.sin(k * 1.047) * 22)}" r="3.4" fill="${["#FF7BA8", "#FFD84D", "#6FC7EF"][k % 3]}" stroke="${INK}" stroke-width="0.8"/>`).join("")}` : "";
      s += onFace(S, F, "front", 0, 0, h - 24, `<rect x="${f2(px)}" y="0" width="${f2(pw)}" height="${f2(h - 70)}" rx="6" fill="#FFFFFF" stroke="${INK}" stroke-width="1.6"/><rect x="${f2(px + 5)}" y="5" width="${f2(pw - 10)}" height="${f2(ph)}" rx="4" fill="${T.poster}"/>${deco}${heroes.map((id, k) => img(ArcadePrizes.svg(id), px + 6 + k * (pw - 12) / 3, h - 150, (pw - 12) / 3, 44)).join("")}${txt(px + pw / 2, h - 80, 10, T.say, T.ink)}`);
      // かんばん（上）
      s += boxC(S, F, 0.02, 0.02, W - 0.04, D - 0.12, h, 30, ["#FFF8EE", "#FFFFFF", "#F2E6EC"], 1.6);
      s += onFace(S, F, "front", 0.02, 0, h + 30, `${txt((W - 0.04) * 24, 21, 15, T.sign, T.ink, `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}${[12, (W - 0.04) * 48 - 12].map((x) => star(x, 15, 6, "#FFE07A", `stroke="${INK}" stroke-width="1"`)).join("")}`);
      s += onFace(S, F, "side", F.dx ? 0.3 : D - 0.3, 0, h - 30, `<rect x="0" y="0" width="${f2((D - 0.6) * 48)}" height="80" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="1.4"/>${txt((D - 0.6) * 24, 34, 12, T.side[0], T.ink)}${txt((D - 0.6) * 24, 56, 12, T.side[1], T.ink)}`);
      return s;
    },
    // けいひん カウンター（ガラスの ケースに ぬいぐるみ・ベル・ふくろ）
    counter(S, f) {
      const F = frame(f), W = F.W, D = F.D;
      let s = boxC(S, F, 0.04, 0.1, W - 0.08, D - 0.2, 0, 64, ["#FFF6E6", "#F29BB8", "#D9789B"], 1.8) + boxC(S, F, 0.02, 0.06, W - 0.04, D - 0.12, 64, 6, ["#E8DCC6", "#D4C5AB", "#BFAE91"], 1.2);
      s += polyC(S, F, [[0.3, 0.2, 70], [W * 0.62, 0.2, 70], [W * 0.62, 0.2, 108], [0.3, 0.2, 108]], "#DDF3FF", 1.2, `fill-opacity="0.35"`);
      ArcadePrizes.ITEMS.filter((it) => it.size === "chibi").slice(0, 6).forEach((it, k) => { s += standing(S, F, ArcadePrizes.svg(it.id), 0.5 + k * ((W * 0.62 - 0.7) / 5), 0.45, 70, 28, it.crop[2] / it.crop[3]); });
      s += polyC(S, F, [[0.3, D - 0.14, 70], [W * 0.62, D - 0.14, 70], [W * 0.62, D - 0.14, 108], [0.3, D - 0.14, 108]], "#DDF3FF", 1.2, `fill-opacity="0.2"`) + polyC(S, F, [[0.3, 0.2, 108], [W * 0.62, 0.2, 108], [W * 0.62, D - 0.14, 108], [0.3, D - 0.14, 108]], "#FFFFFF", 1.2, `fill-opacity="0.25"`);
      const bell = S.P(...F.Q(W * 0.78, D / 2, 70)); S.grow(bell.x - 12, bell.y - 18, bell.x + 12, bell.y + 4);
      s += `<ellipse cx="${f2(bell.x)}" cy="${f2(bell.y)}" rx="10" ry="4" fill="#B98A2C" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(bell.x - 8)} ${f2(bell.y - 1)} Q${f2(bell.x)} ${f2(bell.y - 20)} ${f2(bell.x + 8)} ${f2(bell.y - 1)}Z" fill="#F2C84B" stroke="${INK}" stroke-width="1.3"/>`;
      for (let k = 0; k < 3; k++) s += boxC(S, F, W * 0.86 + (k % 2) * 0.05, 0.25 + k * 0.18, 0.22, 0.16, 70, 26 - k * 4, ["#FFFFFF", ["#9FD3F0", "#F7A9C8", "#FFE07A"][k], shade(["#9FD3F0", "#F7A9C8", "#FFE07A"][k], -0.15)], 1.1);
      s += onFace(S, F, "front", 0.04, 0, 58, `<rect x="10" y="4" width="${f2((W - 0.08) * 48 - 20)}" height="30" rx="8" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/>${txt((W - 0.08) * 24, 25, 15, "けいひん カウンター", "#D9789B")}`);
      return s;
    },
    // りょうがえき（がめん・コインの うけざら）
    changer(S, f) {
      const F = frame(f), W = F.W, D = F.D;
      let s = boxC(S, F, 0.1, 0.1, W - 0.2, D - 0.2, 0, 154, ["#E8EDF0", "#7FB8E0", "#5B97C7"], 1.8);
      s += onFace(S, F, "front", 0.1, 0, 146, `<rect x="6" y="6" width="${f2((W - 0.2) * 48 - 12)}" height="22" rx="4" fill="#FFF8EE" stroke="${INK}" stroke-width="1.2"/>${txt((W - 0.2) * 24, 22, 11, "りょうがえ", "#3E6F99")}<rect x="8" y="36" width="${f2((W - 0.2) * 48 - 16)}" height="34" rx="3" fill="#1F3E5C" stroke="${INK}" stroke-width="1.2"/>${txt((W - 0.2) * 24, 59, 11, "100", "#9FF2C8")}<rect x="${f2((W - 0.2) * 24 - 7)}" y="82" width="14" height="4" rx="2" fill="${INK}"/><rect x="8" y="112" width="${f2((W - 0.2) * 48 - 16)}" height="18" rx="3" fill="#2A2238" stroke="${INK}" stroke-width="1.2"/>`);
      return s;
    },
    // じどうはんばいき（のみもの）
    drinks(S, f) {
      const F = frame(f), W = F.W, D = F.D;
      let s = boxC(S, F, 0.08, 0.08, W - 0.16, D - 0.16, 0, 156, ["#E8EDF0", "#E77B7B", "#C96565"], 1.8);
      const fw = (W - 0.16) * 48;
      s += onFace(S, F, "front", 0.08, 0, 148, `<rect x="6" y="6" width="${f2(fw - 12)}" height="64" rx="3" fill="#DDF1F4" stroke="${INK}" stroke-width="1.2"/>${Array.from({ length: 8 }, (_, k) => `<rect x="${f2(10 + (k % 4) * (fw - 20) / 4)}" y="${10 + Math.floor(k / 4) * 30}" width="${f2((fw - 20) / 4 - 4)}" height="24" rx="3" fill="${["#F4A4A9", "#9FD1D9", "#F7D889", "#B8D8A0"][k % 4]}" stroke="${INK}" stroke-width="0.8"/>`).join("")}<rect x="${f2(fw / 2 - 16)}" y="100" width="32" height="14" rx="2" fill="#2A2238"/>`);
      return s;
    },
    // はしら（かがみの いた・LED の わ）
    apillar(S, f) {
      const h = f.height || 280;
      let s = S.box(0.12, 0.12, f.w - 0.24, f.h - 0.24, 0, h, ["#5A4F86", "#4B4175", "#3D3462"], 1.6);
      for (const z of [26, h - 44]) s += S.box(0.08, 0.08, f.w - 0.16, f.h - 0.16, z, 12, ["#FFE07A", "#FF8FB8", "#9FD3F0"], 1.2);
      s += S.poly([[0.2, f.h - 0.12, 50], [f.w - 0.2, f.h - 0.12, 50], [f.w - 0.2, f.h - 0.12, h - 56], [0.2, f.h - 0.12, h - 56]], "#BFD9EA", 1.2, `fill-opacity="0.85"`);
      s += S.poly([[f.w - 0.12, 0.2, 50], [f.w - 0.12, f.h - 0.2, 50], [f.w - 0.12, f.h - 0.2, h - 56], [f.w - 0.12, 0.2, h - 56]], "#A9C8DE", 1.2, `fill-opacity="0.85"`);
      s += S.poly([[0.3, f.h - 0.12, h - 80], [0.46, f.h - 0.12, h - 80], [0.3, f.h - 0.12, 90], [0.2, f.h - 0.12, 90]], "#FFFFFF", 0, `fill-opacity="0.55"`);
      return s;
    },
    // 入口の じどうドア（ガラスの とびら・上に「でぐち」）
    autodoor(S, f) {
      const F = frame(f), W = F.W, h = 200;
      let s = "";
      for (const u of [0, W - 0.14]) s += boxC(S, F, u, 0.3, 0.14, 0.4, 0, h, ["#C9CED3", "#AEB5BC", "#8E969E"], 1.4);
      s += boxC(S, F, 0, 0.3, W, 0.4, h, 26, ["#3A3150", "#2B2440", "#241E36"], 1.6);
      s += polyC(S, F, [[0.14, 0.5, 0], [W - 0.14, 0.5, 0], [W - 0.14, 0.5, h], [0.14, 0.5, h]], "#DDF3FF", 1.4, `fill-opacity="0.22"`);
      s += polyC(S, F, [[W / 2, 0.5, 0], [W / 2, 0.5, h]], "none", 1.4) + S.line([F.Q(W / 2, 0.5, 0), F.Q(W / 2, 0.5, h)], INK, 1.4);
      return s;
    },
    // でぐちの かんばん（ぼうの 上に みどりの いた）
    exitsign(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.3, "#0000002A", 0) + S.box(0.44, 0.44, 0.12, 0.12, 0, 110, "#8E969E", 1.2) + S.box(0.3, 0.3, 0.4, 0.4, 0, 8, ["#6E7480", "#5B616C", "#4B505A"], 1.2);
      s += S.box(0.1, 0.44, 0.8, 0.1, 110, 40, ["#FFFFFF", "#3FA34D", "#2E7F39"], 1.4);
      const q = S.P(0.5, 0.54, 130); s += `<g transform="matrix(${f2(IsoVenue.A)} ${f2(IsoVenue.B)} 0 1 ${f2(q.x)} ${f2(q.y)})">${txt(0, 6, 15, "でぐち", "#FFFFFF")}</g>`;
      return s;
    },
    // フロア あんない（1F。2本の あしと いた: 3F ぷりくら・おかし・2F おかし・ガチャ・1F ぬいぐるみ）
    directory(S, f) {
      const F = frame(f), W = F.W, D = F.D, z0 = 40, z1 = 176, fw = (W - 0.16) * 48;
      let s = S.ellipse(W / 2, D / 2, 0, 0.4, "#0000002A", 0);
      for (const u of [0.24, W - 0.36]) s += boxC(S, F, u, D * 0.45, 0.12, 0.12, 0, z0, ["#E8E0D0", "#BFB4A0", "#A89C86"], 1.1);
      const wood = f.variant === "forest", board = wood ? ["#E9C99A", "#7A5436", "#6A472C"] : ["#FFFFFF", "#2B2346", "#241E36"];
      s += boxC(S, F, 0.08, D * 0.38, W - 0.16, 0.24, z0, z1 - z0, board, 1.6);
      const rows = f.rows || [["4F", "ガチャの もり", "#A9D98A"], ["3F", "ぷりくら・おかし", "#D6A6F2"], ["2F", "おかし・ガチャ", "#FFB86B"], ["1F", "ぬいぐるみ", "#7FB8E0"]], rh = Math.min(32, Math.floor(98 / rows.length)), bh = rh - 5;
      s += onFace(S, { ...F, D: D * 0.62 }, "front", 0.08, 0, z1, `<rect x="3" y="3" width="${f2(fw - 6)}" height="${z1 - z0 - 6}" rx="6" fill="${board[1]}" stroke="${wood ? "#E9C99A" : "#FFE07A"}" stroke-width="1.6"/>${txt(fw / 2, 22, 11, f.title || "フロア あんない", wood ? "#FFF3D6" : "#FFE07A")}${rows.map(([fl, t, c], i) => `<rect x="8" y="${30 + i * rh}" width="${f2(fw - 16)}" height="${bh}" rx="5" fill="${c}" stroke="${f.here === fl ? "#FFFFFF" : INK}" stroke-width="${f.here === fl ? 2.4 : 1}"/>${txt(22, 30 + i * rh + bh / 2 + 4, 11, fl, INK)}${txt((fw + 30) / 2, 30 + i * rh + bh / 2 + 4, 10, f.here === fl ? t + " ← いま ここ" : t, INK)}`).join("")}`);
      if (wood) { const t = S.P(...F.Q(0.2, D * 0.38, z1 + 6)), u = S.P(...F.Q(W - 0.2, D * 0.38, z1 + 6)); for (const q of [t, u]) for (const [dx, a, c2] of [[-6, -30, "#7DBA4C"], [6, 30, "#9ED36A"]]) s += `<ellipse cx="${f2(q.x + dx)}" cy="${f2(q.y)}" rx="9" ry="4.4" transform="rotate(${a} ${f2(q.x + dx)} ${f2(q.y)})" fill="${c2}" stroke="${INK}" stroke-width="1.1"/>`; S.grow(t.x - 18, t.y - 10, u.x + 18, u.y + 6); }
      return s;
    },
    // おめかし コーナー（3F。かがみ 3まい〔まわりに ライト〕・カウンターの ブラシ・ドライヤー・まるい いす）
    vanity(S, f) {
      const F = frame(f), W = F.W, D = F.D, ch = 76, mz0 = 92, mz1 = 166;
      let s = S.ellipse(W / 2, D / 2, 0, W * 0.4, "#0000002A", 0) + boxC(S, F, 0.06, 0.08, W - 0.12, 0.46, 0, ch, ["#FFF6FA", "#F6C2D8", "#E59BBB"], 1.6);
      s += boxC(S, F, 0.04, 0.06, W - 0.08, 0.5, ch, 5, ["#FFFFFF", "#F2E6EC", "#E6D6DE"], 1.1);
      const n = 3, mw = (W - 0.6) / n;
      for (let k = 0; k < n; k++) {
        const u0 = 0.3 + k * mw + 0.08, u1 = u0 + mw - 0.16;
        s += polyC(S, F, [[u0, 0.1, mz0], [u1, 0.1, mz0], [u1, 0.1, mz1], [u0, 0.1, mz1]], "#FFFFFF", 1.6) + polyC(S, F, [[u0 + 0.06, 0.1, mz0 + 6], [u1 - 0.06, 0.1, mz0 + 6], [u1 - 0.06, 0.1, mz1 - 6], [u0 + 0.06, 0.1, mz1 - 6]], "#DDF3FF", 1.1);
        s += polyC(S, F, [[u0 + 0.12, 0.1, mz1 - 12], [u0 + 0.22, 0.1, mz1 - 12], [u0 + 0.12, 0.1, mz0 + 26]], "#FFFFFF", 0, `fill-opacity="0.7"`);
        for (let j = 0; j < 4; j++) { const q = S.P(...F.Q(u0 + ((u1 - u0) * (j + 0.5)) / 4, 0.1, mz1 + 3)); s += `<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="2.6" fill="#FFF6C8" stroke="${INK}" stroke-width="0.8"/>`; }
        const st = S.P(...F.Q(u0 + (u1 - u0) / 2, D - 0.22, 0)); S.grow(st.x - 12, st.y - 30, st.x + 12, st.y + 4);
        s += `<path d="M${f2(st.x)} ${f2(st.y)} V${f2(st.y - 22)}" stroke="${INK}" stroke-width="2"/><ellipse cx="${f2(st.x)}" cy="${f2(st.y - 24)}" rx="10" ry="4.4" fill="#F29BB8" stroke="${INK}" stroke-width="1.4"/><ellipse cx="${f2(st.x)}" cy="${f2(st.y)}" rx="6" ry="2.4" fill="#8C8C8C"/>`;
      }
      const it = (u, c, tall) => { const q = S.P(...F.Q(u, 0.36, ch + 5)); S.grow(q.x - 6, q.y - tall - 2, q.x + 6, q.y + 2); return `<rect x="${f2(q.x - 3)}" y="${f2(q.y - tall)}" width="6" height="${tall}" rx="2" fill="${c}" stroke="${INK}" stroke-width="0.9"/>`; };
      s += it(0.6, "#FF7BA8", 12) + it(0.8, "#FFFFFF", 9) + it(W * 0.5, "#B79BEA", 14) + it(W - 0.7, "#7FD3F0", 11);
      return s;
    },
    // こういしつ（3F・UI-22。カーテンの こしつ 3つ・うえに「こういしつ」の かんばん・よこに かしだしの ポスター。カーテンの したに すきま）
    fitting(S, f) {
      const F = frame(f), W = F.W, D = F.D, h = 214, n = 3, cw = (W - 0.36) / n, CUR = [["#FFD1E3", "#F6A9C6"], ["#CFF2E3", "#93D9BC"], ["#FFF1B8", "#F2D46E"]];
      let s = S.ellipse(W / 2, D / 2, 0, Math.max(W, D) * 0.42, "#0000002A", 0) + boxC(S, F, 0.06, 0.06, W - 0.12, D - 0.12, 0, h, ["#F7EEFB", "#E6D4F4", "#CDB3E6"], 1.8);
      for (let k = 0; k < n; k++) {
        const u0 = 0.18 + k * cw, w = cw * 48, [c0, c1] = CUR[k];
        // こしつの いりぐち（おくの くらい ところ）→ カーテン（ひだ）→ カーテンの ぼう → ばんごう
        let g = `<rect x="4" y="18" width="${f2(w - 8)}" height="${h - 30}" rx="4" fill="#B79BCF" stroke="${INK}" stroke-width="1.4"/>`;
        g += `<path d="M6 22 H${f2(w - 6)} V${h - 26} Q${f2(w * 0.75)} ${h - 20} ${f2(w / 2)} ${h - 26} Q${f2(w * 0.25)} ${h - 20} 6 ${h - 26} Z" fill="${c0}" stroke="${INK}" stroke-width="1.4"/>`;
        for (let j = 1; j < 6; j++) g += `<path d="M${f2(6 + (j * (w - 12)) / 6)} 24 V${h - 28}" stroke="${c1}" stroke-width="2.2" stroke-linecap="round"/>`;
        g += `<rect x="2" y="16" width="${f2(w - 4)}" height="6" rx="3" fill="#C9A2E0" stroke="${INK}" stroke-width="1.2"/>`;
        g += `<circle cx="${f2(w / 2)}" cy="7" r="8" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>${txt(w / 2, 11.5, 11, String(k + 1), "#9B6BC4")}`;
        s += onFace(S, F, "front", u0, 0, h - 2, g);
      }
      // かんばん（上）: こういしつ・ハンガーの しるし
      s += boxC(S, F, 0.02, 0.02, W - 0.04, D - 0.12, h, 30, ["#FFF8EE", "#FFFFFF", "#F2E6EC"], 1.6);
      const hanger = (x, y, c) => `<path d="M${f2(x)} ${f2(y - 9)} q0 -5 4 -5 q4 0 4 4 q0 3 -4 4 L${f2(x + 15)} ${f2(y + 4)} H${f2(x - 15)} Z" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
      s += onFace(S, F, "front", 0.02, 0, h + 30, `${txt((W - 0.04) * 24, 21, 16, "こういしつ", "#9B6BC4", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}${hanger(26, 16, "#F29BB8")}${hanger((W - 0.04) * 48 - 30, 16, "#7FC6E4")}`);
      // よこ: かしだしの ポスター（セーラーふくの えりと ゆかたの あさがお）
      s += onFace(S, F, "side", F.dx ? 0.3 : D - 0.3, 0, h - 26, `<rect x="0" y="0" width="${f2((D - 0.6) * 48)}" height="96" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="1.4"/>${txt((D - 0.6) * 24, 22, 11, "かしだし", "#9B6BC4")}${txt((D - 0.6) * 24, 38, 10, "いしょう", "#9B6BC4")}` +
        `<path d="M${f2((D - 0.6) * 24 - 16)} 50 L${f2((D - 0.6) * 24)} 70 L${f2((D - 0.6) * 24 + 16)} 50 Z" fill="#3E4F8F" stroke="${INK}" stroke-width="1.2"/><path d="M${f2((D - 0.6) * 24 - 5)} 66 L${f2((D - 0.6) * 24)} 76 L${f2((D - 0.6) * 24 + 5)} 66 Z" fill="#E8453C" stroke="${INK}" stroke-width="1"/>${txt((D - 0.6) * 24, 90, 9, "ただ", "#E0668F")}`);
      return s;
    },
    // かしだし いしょうの ラック（3F・UI-22。ハンガーの いしょう 4まい・したの たなに つうがく ぼうしと ランドセル・うえに かんばん）
    costumerack(S, f) {
      const F = frame(f), W = F.W, D = F.D, rz = 150, fw = (W - 0.2) * 48;
      let s = S.ellipse(W / 2, D / 2, 0, W * 0.42, "#0000002A", 0);
      // たな（した）と 2ほんの はしら・ぼう
      s += boxC(S, F, 0.1, 0.2, W - 0.2, D - 0.4, 0, 30, ["#FFF6E6", "#E8C9A0", "#D2AE80"], 1.4);
      for (const u of [0.14, W - 0.24]) s += boxC(S, F, u, D / 2 - 0.05, 0.1, 0.1, 30, rz - 26, ["#E8EDF0", "#C9D2DA", "#AEB9C4"], 1.1);
      s += polyC(S, F, [[0.12, D / 2, rz], [W - 0.12, D / 2, rz], [W - 0.12, D / 2, rz + 5], [0.12, D / 2, rz + 5]], "#C9D2DA", 1.2);
      // ハンガーの いしょう（セーラー・ブレザー・たいそうふく・ゆかた）
      const cloth = (x, top, body, trim, kind) => {
        const w = 30, y = 8;
        let g = `<path d="M${f2(x)} 0 q0 -5 4 -5 q4 0 4 4 q0 3 -4 4" fill="none" stroke="#8C96A0" stroke-width="1.6" stroke-linecap="round"/>`;
        g += `<path d="M${f2(x - w / 2)} ${y + 6} L${f2(x - 6)} ${y} H${f2(x + 6)} L${f2(x + w / 2)} ${y + 6} L${f2(x + w / 2 + 4)} ${y + 18} L${f2(x + w / 2 - 3)} ${y + 20} V${y + 62} H${f2(x - w / 2 + 3)} V${y + 20} L${f2(x - w / 2 - 4)} ${y + 18} Z" fill="${body}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
        if (kind === "sailor") g += `<path d="M${f2(x - 9)} ${y} L${f2(x)} ${y + 14} L${f2(x + 9)} ${y} H${f2(x + 12)} L${f2(x)} ${y + 20} L${f2(x - 12)} ${y} Z" fill="${trim}" stroke="${INK}" stroke-width="1"/><path d="M${f2(x - 3)} ${y + 18} L${f2(x)} ${y + 24} L${f2(x + 3)} ${y + 18} Z" fill="#E8453C"/><path d="M${f2(x - w / 2 + 3)} ${y + 40} H${f2(x + w / 2 - 3)} V${y + 62} H${f2(x - w / 2 + 3)} Z" fill="${trim}" stroke="${INK}" stroke-width="1"/>`;
        if (kind === "blazer") g += `<path d="M${f2(x - 5)} ${y} L${f2(x)} ${y + 18} L${f2(x + 5)} ${y} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1"/><circle cx="${f2(x)}" cy="${y + 3}" r="2.4" fill="#E8453C"/><circle cx="${f2(x - 2)}" cy="${y + 30}" r="1.6" fill="#E8C872"/><circle cx="${f2(x - 2)}" cy="${y + 40}" r="1.6" fill="#E8C872"/><path d="M${f2(x + 6)} ${y + 22} h5 v4 q-2.5 3 -5 0 Z" fill="#E8C872"/>`;
        if (kind === "gym") g += `<rect x="${f2(x - 7)}" y="${y + 18}" width="14" height="9" rx="2" fill="#FFFFFF" stroke="${trim}" stroke-width="1.2"/><path d="M${f2(x - w / 2 + 3)} ${y + 46} H${f2(x + w / 2 - 3)} V${y + 62} H${f2(x - w / 2 + 3)} Z" fill="${trim}" stroke="${INK}" stroke-width="1"/>`;
        if (kind === "yukata") g += `<path d="M${f2(x + 6)} ${y} L${f2(x - 6)} ${y + 28}" stroke="${shade(body, -0.3)}" stroke-width="2.4"/><rect x="${f2(x - w / 2 + 3)}" y="${y + 28}" width="${w - 6}" height="8" fill="${trim}" stroke="${INK}" stroke-width="1"/><circle cx="${f2(x - 6)}" cy="${y + 46}" r="3" fill="#F59BBE"/><circle cx="${f2(x + 6)}" cy="${y + 14}" r="2.6" fill="#F59BBE"/>`;
        return g;
      };
      const xs = [0.16, 0.39, 0.62, 0.85].map((k) => fw * k);
      const R = { ...F, D: D / 2 };
      s += onFace(S, R, "front", 0.1, 0, rz + 4, cloth(xs[0], 0, "#FFFFFF", "#3E4F8F", "sailor") + cloth(xs[1], 0, "#3B4A7A", "#FFFFFF", "blazer") + cloth(xs[2], 0, "#FFFFFF", "#3E4F8F", "gym") + cloth(xs[3], 0, "#CFE6F7", "#FFD86B", "yukata"));
      // したの たな: つうがく ぼうし・ランドセル
      const hat = S.P(...F.Q(W * 0.32, D / 2, 30)), bag = S.P(...F.Q(W * 0.66, D / 2, 30)); S.grow(hat.x - 16, hat.y - 18, bag.x + 16, bag.y + 2);
      s += `<ellipse cx="${f2(hat.x)}" cy="${f2(hat.y - 2)}" rx="15" ry="4" fill="#FFD84D" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(hat.x - 10)} ${f2(hat.y - 3)} C${f2(hat.x - 11)} ${f2(hat.y - 17)} ${f2(hat.x + 11)} ${f2(hat.y - 17)} ${f2(hat.x + 10)} ${f2(hat.y - 3)} Z" fill="#FFD84D" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<rect x="${f2(bag.x - 9)}" y="${f2(bag.y - 17)}" width="18" height="17" rx="4" fill="#C4372F" stroke="${INK}" stroke-width="1.2"/><path d="M${f2(bag.x - 9)} ${f2(bag.y - 11)} C${f2(bag.x - 9)} ${f2(bag.y - 18)} ${f2(bag.x + 9)} ${f2(bag.y - 18)} ${f2(bag.x + 9)} ${f2(bag.y - 11)} V${f2(bag.y - 4)} H${f2(bag.x - 9)} Z" fill="#E2453F" stroke="${INK}" stroke-width="1.2"/><rect x="${f2(bag.x - 2.5)}" y="${f2(bag.y - 6)}" width="5" height="4" rx="1" fill="#F2C14E"/>`;
      // かんばん（ぼうの うえ）
      const s0 = S.P(...F.Q(0.2, D / 2, rz + 34)), s1 = S.P(...F.Q(W - 0.2, D / 2, rz + 10)); S.grow(Math.min(s0.x, s1.x) - 2, Math.min(s0.y, s1.y) - 2, Math.max(s0.x, s1.x) + 2, Math.max(s0.y, s1.y) + 26);
      s += polyC(S, F, [[0.3, D / 2, rz + 5], [0.3, D / 2, rz + 12], [W - 0.3, D / 2, rz + 12], [W - 0.3, D / 2, rz + 5]], "#C9D2DA", 0.8);
      s += onFace(S, R, "front", 0.2, 0, rz + 34, `<rect x="0" y="0" width="${f2(fw - 20)}" height="24" rx="8" fill="#FFFDF5" stroke="${INK}" stroke-width="1.4"/>${txt((fw - 20) / 2, 17, 12, "かしだし いしょう", "#9B6BC4")}`);
      return s;
    },
    // カプセルの かいしゅう ばこ（ガチャ コーナー。あいた カプセルを いれる まるい あな・カプセルの え）
    capbin(S, f) {
      const F = frame(f), W = F.W, D = F.D, h = 64;
      let s = S.ellipse(W / 2, D / 2, 0, 0.42, "#0000002A", 0) + boxC(S, F, 0.16, 0.18, W - 0.32, D - 0.36, 0, h, ["#FFFFFF", "#86C08C", "#6AA472"], 1.6);
      s += boxC(S, F, 0.12, 0.14, W - 0.24, D - 0.28, h, 6, ["#F4FBF2", "#D6EFD8", "#B6DFBA"], 1.2);
      const t = S.P(...F.Q(W / 2, D / 2, h + 6)); S.grow(t.x - 14, t.y - 8, t.x + 14, t.y + 6);
      s += `<ellipse cx="${f2(t.x)}" cy="${f2(t.y)}" rx="11" ry="5.5" fill="#2A2238" stroke="${INK}" stroke-width="1.2"/>`;
      const fw = (W - 0.32) * 48;
      s += onFace(S, F, "front", 0.16, 0, h - 6, `<rect x="4" y="4" width="${f2(fw - 8)}" height="${h - 20}" rx="5" fill="#FFFDF5" stroke="${INK}" stroke-width="1.1"/><path d="M${f2(fw / 2 - 11)} 24 a11 11 0 0 1 22 0 Z" fill="#F7A9C8" stroke="${INK}" stroke-width="1.1"/><path d="M${f2(fw / 2 - 11)} 27 h22 a11 11 0 0 1 -22 0 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.1"/>${txt(fw / 2, 50, 9, "カプセル", "#4E8B56")}`);
      return s;
    },
    // ガチャ コーナーの かんばん（台の うしろ: ひくい しきり・2本の ぼう・うえの いた。いたの まえは 台の せなかに ぴったり）。もじは variant（キャッシュの キー）で きまる
    gachaboard(S, f) {
      const text = GACHA_BOARDS[(f.variant || 0) % GACHA_BOARDS.length];
      const F = frame(f), W = F.W, D = F.D, z0 = 126, hh = 40, fw = (W - 0.04) * 48;
      let s = boxC(S, F, 0.04, D - 0.42, W - 0.08, 0.38, 0, 44, ["#D6EFD8", "#5FA866", "#4E8B56"], 1.4);
      for (const u of [0.16, W - 0.28]) s += boxC(S, F, u, D - 0.2, 0.12, 0.14, 44, z0 - 44, ["#F4F0E6", "#C9BFA9", "#AFA48C"], 1.1);
      s += boxC(S, F, 0.02, D - 0.24, W - 0.04, 0.24, z0, hh, ["#FFFFFF", "#FFFDF5", "#E2EFE0"], 1.6);
      const caps = [0, 1, 2, 3].map((k) => { const x = k < 2 ? 14 + k * 17 : fw - 14 - (k - 2) * 17, c = ["#F7A9C8", "#FFE07A", "#9FD3F0", "#C9B6EE"][k]; return `<path d="M${f2(x - 7)} 20 a7 7 0 0 1 14 0 Z" fill="${c}" stroke="${INK}" stroke-width="1"/><path d="M${f2(x - 7)} 20 h14 a7 7 0 0 1 -14 0 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1"/>`; }).join("");
      s += onFace(S, F, "front", 0.02, 0, z0 + hh, `<rect x="3" y="3" width="${f2(fw - 6)}" height="${hh - 6}" rx="6" fill="#F4FBF2" stroke="#5FA866" stroke-width="2"/>${caps}${txt(fw / 2, 26, text.length > 7 ? 13 : 15, text, "#3E7A47")}`);
      return s;
    },
    // ひくい しきり（島の うしろ）
    divider(S, f) { return S.box(0.05, 0.3, f.w - 0.1, 0.4, 0, 40, ["#FFE07A", "#5A4F86", "#4B4175"], 1.4) + S.box(0.02, 0.26, f.w - 0.04, 0.48, 40, 5, ["#FFF6D0", "#E6C95B", "#CFB24A"], 1.1); },
    // ソファ（やすむ ところ）
    asofa(S, f) {
      const c = ["#F29BB8", "#D9789B", "#C2607F"];
      return S.ellipse(f.w / 2, f.h / 2, 0, Math.max(f.w, f.h) * 0.45, "#0000002A", 0) + S.box(0.05, 0.1, f.w - 0.1, f.h - 0.2, 0, 26, c, 1.6) + S.box(0.05, 0.1, f.w - 0.1, 0.25, 26, 26, c, 1.6) + S.box(0.12, 0.35, f.w - 0.24, f.h - 0.45, 26, 5, ["#FFD1E2", "#F2B6CB", "#E09DB6"], 1.2);
    },
  };
  // ---- 動く ところ（毎フレーム）----
  const L = {
    // かんばんの でんきゅう（ながれる）・とちゅうの しるし・なまえ
    crane(ctx, sc, f, off) {
      const F = frame(f), W = F.W, D = F.D, kind = specOf(f.machine), P = SPEC[kind], z1 = P.base + P.GH, gv = D - 0.34, t = G.t, s = sc.s, n = Math.max(6, Math.round(W * 5));
      const pt = (u, v, z) => { const [x, y, zz] = F.Q(u, v, z); return sc.toScreen(IsoVenue.p(f.x + x, f.y + y, zz), off); };
      for (let k = 0; k < n; k++) {
        const u = 0.14 + (k * (W - 0.28)) / (n - 1), on = (k + Math.floor(t * 6) + f.machine) % 3 === 0; if (!on) continue;
        for (const z of [z1 + P.HH - 3, z1 + 3]) { const q = pt(u, gv + 0.02, z); ctx.fillStyle = "rgba(255,246,176,0.95)"; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6 * s * 2, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,246,176,0.3)"; ctx.beginPath(); ctx.arc(q.x, q.y, 6 * s * 2, 0, 7); ctx.fill(); }
      }
      const a = PrizeArcade.norm();
      if (a.active && a.active.machine === f.machine) { const q = pt(W / 2, gv, z1 - 18); ctx.fillStyle = "#FF7BA8"; U.rr(ctx, q.x - 34 * s * 2 / 2, q.y - 9 * s * 2, 34 * s * 2, 16 * s * 2, 5 * s); ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.font = `900 ${f2(10 * s * 2)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("とちゅう", q.x, q.y - 1); ctx.textBaseline = "alphabetic"; }
    },
    photobooth(ctx, sc, f, off) {
      const k = (G.t % 7) / 7; if (k > 0.08 && !(ArcadeArt.flashT && G.t - ArcadeArt.flashT < 0.6)) return;
      const F = frame(f), [x, y, z] = F.Q(F.W * 0.3, F.D, 150), q = sc.toScreen(IsoVenue.p(f.x + x, f.y + y, z), off); const g = ctx.createRadialGradient(q.x, q.y, 2, q.x, q.y, 60 * sc.s * 2);
      g.addColorStop(0, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 60 * sc.s * 2, 0, 7); ctx.fill();
    },
    hangsign: MallArt.L.hangsign,
  };

  // ---- 床と かべ（静止画）----
  const MATS = { carpet: ["#3B3363", "#382F5E"], lane: ["#5A5286", "#554D80"], mat: ["#4A4458", "#454052"], staff: ["#6B6275", "#655C70"], gacha: ["#4C7F78", "#3F6E68"] };
  // 2F（おかしの フロア）: じゅうたんは プラムいろ・とおりみちは ピンク
  // ガチャ コーナー（'g'）: ミントいろの いちまつ もよう・ところどころ カプセルの え
  const MAT2 = { carpet: ["#4A2F57", "#462C53"], lane: ["#7A4E7E", "#744A78"], mat: ["#4A4458", "#454052"], staff: ["#6B6275", "#655C70"], gacha: ["#4C7F78", "#3F6E68"] };
  // 3F（ぷりくらの フロア）: すみれいろの じゅうたん・とおりみちは ラベンダー・ところどころ ハート
  const MAT3 = { carpet: ["#46305F", "#422D5A"], lane: ["#83619A", "#7D5C94"], mat: ["#4A4458", "#454052"], staff: ["#6B6275", "#655C70"], gacha: ["#4C7F78", "#3F6E68"] };
  // 4F（ガチャガチャの もり）: こけいろの じゅうたん・とおりみちは 木の いた・ところどころ はっぱ／クローバー／はな／どんぐり
  const MAT4 = { carpet: ["#5E8C4C", "#5A8849"], lane: ["#C79C68", "#C29763"], mat: ["#6B5A44", "#65553F"], staff: ["#8A7458", "#846E53"], gacha: ["#4C7F78", "#3F6E68"] };
  const paintFloor = (g, r) => {
    const forest = r.carpet === "forest", MAT = r.carpet === "candy" ? MAT2 : r.carpet === "puri" ? MAT3 : forest ? MAT4 : MATS;
    const P = (x, y, z = 0) => IsoVenue.p(x, y, z), tile = (x, y) => { const a = P(x, y), b = P(x + 1, y), c = P(x + 1, y + 1), d = P(x, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); };
    const slab = 26, edge = (pts, fill) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke(); };
    edge([P(0, r.h), P(r.w, r.h), P(r.w, r.h, -slab), P(0, r.h, -slab)], forest ? "#4A3524" : "#2A2440");
    edge([P(r.w, 0), P(r.w, r.h), P(r.w, r.h, -slab), P(r.w, 0, -slab)], forest ? "#5A4130" : "#342D50");
    const matAt = (x, y) => ({ ".": "carpet", w: "lane", m: "mat", "#": "staff", g: "gacha" })[r.rows[y][x]] || "carpet";
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const m = matAt(x, y), c = MAT[m], h = U.hash(x, y, 7);
      tile(x, y); g.fillStyle = m === "gacha" ? c[(x + y) & 1] : c[h < 0.5 ? 0 : 1]; g.fill();
      if (m === "gacha") {
        if (h > 0.55) { const q = P(x + 0.5, y + 0.5), col = ["#F7A9C8", "#FFE07A", "#9FD3F0", "#C9B6EE"][Math.floor(U.hash(x, y, 9) * 4)]; g.lineWidth = 1.1; g.strokeStyle = "rgba(255,255,255,0.75)"; g.fillStyle = col; g.beginPath(); g.ellipse(q.x, q.y, 6, 3.6, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.ellipse(q.x, q.y, 6, 3.6, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); }
      } else if (m === "lane" && forest) {
        // 木の いた（よこ 2まい・つぎめは たがいちがい・ときどき ふし）
        g.strokeStyle = "#A87C4E"; g.lineWidth = 1; g.stroke();
        const a = P(x, y + 0.5), b = P(x + 1, y + 0.5); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        for (const [u, v0] of [[(x + y) & 1 ? 0.3 : 0.7, 0], [(x + y) & 1 ? 0.75 : 0.25, 0.5]]) { const c1 = P(x + u, y + v0), c2 = P(x + u, y + v0 + 0.5); g.beginPath(); g.moveTo(c1.x, c1.y); g.lineTo(c2.x, c2.y); g.stroke(); }
        if (h > 0.84) { const q = P(x + 0.3 + h * 0.3, y + 0.25); g.strokeStyle = "#A8784A"; g.beginPath(); g.ellipse(q.x, q.y, 4, 1.6, 0, 0, 7); g.stroke(); }
      } else if (m === "lane") { g.strokeStyle = "#6E6699"; g.lineWidth = 1; g.stroke(); if (h > 0.8) { const q = P(x + 0.5, y + 0.5); g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.ellipse(q.x - 6, q.y - 2, 8, 2.4, -0.5, 0, 7); g.fill(); } }
      else if (m === "carpet") {
        // うちゅうの じゅうたん（ほし・わくせい・かみふぶき）
        const q = P(x + 0.5, y + 0.5), k = Math.floor(h * 1000);
        if (forest) {
          g.save(); g.translate(q.x, q.y); g.scale(1, 0.6);
          if (k % 5 === 0) { g.rotate(h * 6.28); g.fillStyle = ["#8CC63F", "#B5D96A", "#6FAE5A"][k % 3]; g.beginPath(); g.ellipse(0, 0, 7, 3, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(40,70,30,0.6)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); }
          else if (k % 9 === 1) { g.fillStyle = "#86C25A"; for (let j = 0; j < 3; j++) { const a2 = -Math.PI / 2 + (j * Math.PI * 2) / 3; g.beginPath(); g.arc(Math.cos(a2) * 2.8, Math.sin(a2) * 2.8, 2.8, 0, 7); g.fill(); } g.strokeStyle = "#4F7A40"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 1); g.lineTo(1.5, 6); g.stroke(); }
          else if (k % 13 === 2) { g.fillStyle = k % 2 ? "#FFFFFF" : "#F7A9C8"; for (let j = 0; j < 5; j++) { const a2 = (j * Math.PI * 2) / 5; g.beginPath(); g.arc(Math.cos(a2) * 2.6, Math.sin(a2) * 2.6, 2, 0, 7); g.fill(); } g.fillStyle = "#FFE07A"; g.beginPath(); g.arc(0, 0, 1.6, 0, 7); g.fill(); }
          else if (k % 17 === 3) { g.fillStyle = "#B07A44"; g.beginPath(); g.ellipse(0, 1.4, 3.4, 4.2, 0, 0, 7); g.fill(); g.fillStyle = "#7A5230"; g.beginPath(); g.ellipse(0, -1.6, 4, 2.2, 0, 0, 7); g.fill(); }
          else { g.strokeStyle = h > 0.5 ? "#7BA862" : "#4F7A40"; g.lineWidth = 1.1; g.globalAlpha = 0.8; for (let j = 0; j < 3; j++) { const ox = (U.hash(x, y, 20 + j) - 0.5) * 30, oy = (U.hash(x, y, 40 + j) - 0.5) * 30; g.beginPath(); g.moveTo(ox - 2, oy + 3); g.lineTo(ox - 1, oy - 2); g.moveTo(ox + 1, oy + 3); g.lineTo(ox + 2.5, oy - 1.5); g.stroke(); } g.globalAlpha = 1; }
          g.restore();
        } else if (r.carpet === "puri" && k % 6 === 0) { const c3 = ["#FF9EC4", "#FFD2E6", "#C9B6EE"][k % 3]; g.fillStyle = c3; g.beginPath(); g.moveTo(q.x, q.y + 3.4); g.bezierCurveTo(q.x - 7, q.y - 1, q.x - 4, q.y - 6, q.x, q.y - 2.4); g.bezierCurveTo(q.x + 4, q.y - 6, q.x + 7, q.y - 1, q.x, q.y + 3.4); g.fill(); }
        else if (r.carpet === "candy" && k % 7 === 0) { g.fillStyle = ["#F7A9C8", "#9ED3C6", "#FFE07A"][k % 3]; g.beginPath(); g.ellipse(q.x, q.y, 5, 3, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(q.x, q.y, 2.4, 1.4, 0, 0, 7); g.stroke(); }
        else if (k % 7 === 0) { g.fillStyle = "#FFE07A"; g.beginPath(); const R = 5, rr = 2.2; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, l = i % 2 ? rr : R; g.lineTo(q.x + Math.cos(a) * l, q.y + Math.sin(a) * l * 0.6); } g.closePath(); g.fill(); }
        else if (k % 11 === 1) { g.fillStyle = "#9FD3F0"; g.beginPath(); g.ellipse(q.x + 6, q.y, 5, 3, 0, 0, 7); g.fill(); g.strokeStyle = "#F7A9C8"; g.lineWidth = 1.4; g.beginPath(); g.ellipse(q.x + 6, q.y, 9, 2.4, -0.3, 0, 7); g.stroke(); }
        else for (let j = 0; j < 3; j++) { const hx = U.hash(x, y, 20 + j), hy = U.hash(x, y, 40 + j), c2 = ["#F7A9C8", "#9ED3C6", "#FFE07A", "#C9B6EE"][Math.floor(U.hash(x, y, 60 + j) * 4)], p = P(x + hx, y + hy); g.fillStyle = c2; g.globalAlpha = 0.7; g.fillRect(p.x - 1.6, p.y - 1, 3.2, 2); g.globalAlpha = 1; }
      } else if (m === "mat") { g.strokeStyle = "#5A5566"; g.lineWidth = 1; for (let i = 1; i < 4; i++) { const a = P(x + i / 4, y), b = P(x + i / 4, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } }
    }
    // 材質の さかい
    g.strokeStyle = forest ? "#8A6440" : "#8C82B8"; g.lineWidth = 1.6;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const m = matAt(x, y);
      if (x + 1 < r.w && matAt(x + 1, y) !== m) { const a = P(x + 1, y), b = P(x + 1, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      if (y + 1 < r.h && matAt(x, y + 1) !== m) { const a = P(x, y + 1), b = P(x + 1, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    }
    // 台の まえの ひかり（台の いろ）
    for (const f of r.fixtures) {
      if (f.kind !== "crane") continue;
      const F = frame(f), th = CraneArt.THEME[CraneMachines.DEFS[f.machine].theme], [gx, gy] = F.Q(F.W / 2, F.D + 0.7, 0), c = IsoVenue.p(f.x + gx, f.y + gy, 0), rad = F.W * 48 * 0.7, gr = g.createRadialGradient(c.x, c.y, 2, c.x, c.y, rad);
      gr.addColorStop(0, th.glow + "88"); gr.addColorStop(1, th.glow + "00"); g.fillStyle = gr; g.beginPath(); g.ellipse(c.x, c.y, rad, rad * 0.55, 0, 0, 7); g.fill();
    }
    // 入口の ゆかの ロゴ
    if (r.logo) { const q = IsoVenue.p(r.logo[0], r.logo[1]); g.save(); g.translate(q.x, q.y); g.transform(IsoVenue.A, IsoVenue.B, -IsoVenue.A, IsoVenue.B, 0, 0); g.fillStyle = "rgba(255,224,122,0.22)"; g.beginPath(); g.arc(0, 0, 58, 0, 7); g.fill(); g.strokeStyle = "rgba(255,224,122,0.6)"; g.lineWidth = 3; g.stroke(); g.font = "900 30px 'M PLUS Rounded 1c', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(255,246,208,0.75)"; g.fillText("Mee", 0, 0); g.restore(); }
    // 入口の マット（でぐちの やじるし）
    if (r.exit) { const [x0, y0, x1, y1] = r.exit, q = IsoVenue.p((x0 + x1) / 2, (y0 + y1) / 2); g.save(); g.translate(q.x, q.y); g.transform(IsoVenue.A, IsoVenue.B, -IsoVenue.A, IsoVenue.B, 0, 0); g.fillStyle = "#7ED957"; g.beginPath(); g.moveTo(-10, 18); g.lineTo(10, 18); g.lineTo(10, 30); g.lineTo(20, 30); g.lineTo(0, 46); g.lineTo(-20, 30); g.lineTo(-10, 30); g.closePath(); g.fill(); g.font = "900 20px 'M PLUS Rounded 1c', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#FFFFFF"; g.fillText("でぐち", 0, -6); g.restore(); }
    g.strokeStyle = INK; g.lineWidth = 1.8; const o = [P(0, 0), P(r.w, 0), P(r.w, r.h), P(0, r.h)]; g.beginPath(); o.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.stroke();
  };
  // エスカレーターの ふきぬけ（2F）: したの 階の うちゅうの じゅうたん・かげ・ゆかの あつみ（MallArt の ふきぬけと おなじ ずれ）
  const paintHoles = (g, r) => {
    const BC = (r.below === "puri" ? MAT3 : r.below === "candy" ? MAT2 : MATS).carpet;
    for (const h of r.holes || []) {
      g.save(); MallArt.holePath(g, h); g.clip();
      const top = IsoVenue.p(h.x, h.y).y, gr = g.createLinearGradient(0, top - 200, 0, top + 300); gr.addColorStop(0, "#15122A"); gr.addColorStop(1, "#2B2447"); g.fillStyle = gr; g.fillRect(-4000, -4000, 8000, 8000);
      const shift = MallArt.VIEW[0]; g.translate(0, shift);
      for (let y = Math.floor(h.y) - 10; y < h.y + h.h + 2; y++) for (let x = Math.floor(h.x) - 10; x < h.x + h.w + 1; x++) {
        const a = IsoVenue.p(x, y), b = IsoVenue.p(x + 1, y), c = IsoVenue.p(x + 1, y + 1), d = IsoVenue.p(x, y + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath();
        g.fillStyle = BC[(x + y) & 1]; g.fill(); if (U.hash(x, y, 7) > 0.86) { const q = IsoVenue.p(x + 0.5, y + 0.5); g.fillStyle = "#FFE07A"; g.beginPath(); g.ellipse(q.x, q.y, 3, 1.8, 0, 0, 7); g.fill(); }
      }
      g.translate(0, -shift);
      const gr2 = g.createLinearGradient(0, top - 60, 0, top + 260); gr2.addColorStop(0, "rgba(20,16,40,.65)"); gr2.addColorStop(1, "rgba(20,16,40,0)"); g.fillStyle = gr2; g.fillRect(-4000, -4000, 8000, 8000);
      // ゆかの あつみ（おくの ふちの 内がわ）
      g.beginPath(); g.rect(-4000, -4000, 8000, 8000); const ps = [IsoVenue.p(h.x, h.y), IsoVenue.p(h.x + h.w, h.y), IsoVenue.p(h.x + h.w, h.y + h.h), IsoVenue.p(h.x, h.y + h.h)]; ps.forEach((q, i) => (i ? g.lineTo(q.x, q.y + 34) : g.moveTo(q.x, q.y + 34))); g.closePath();
      g.fillStyle = "#342D50"; g.fill("evenodd");
      g.restore(); g.strokeStyle = INK; g.lineWidth = 1.8; MallArt.holePath(g, h); g.stroke();
    }
  };
  // 4F の かべ: おくの 木の みきと しげみ（うすい）・木の こしいた・うえの はっぱの ガーランドと あかりの つぶ
  const forestLeaves = (x, y, k = 1) => [[0, -28, "#7DBA4C"], [10, 18, "#9ED36A"], [3, 62, "#6FAE5A"]].map(([dx, a, c]) => `<ellipse cx="${f2(x + dx * k)}" cy="${f2(y + dx * 0.3)}" rx="10" ry="4.6" transform="rotate(${a * k} ${f2(x + dx * k)} ${f2(y + dx * 0.3)})" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`).join("");
  const forestWall = (L, H, V, side) => {
    let s = "";
    for (let x = 70, i = 0; x < L; x += 176, i++) {
      const tw = 24 + (i % 3) * 5, top = H * 0.3;
      s += `<path d="M${x - tw / 2} ${H} C${x - tw / 2 + 2} ${H * 0.6} ${x - tw / 3} ${top + 30} ${x - 4} ${top} L${x + 4} ${top} C${x + tw / 3} ${top + 30} ${x + tw / 2 - 2} ${H * 0.6} ${x + tw / 2} ${H} Z" fill="#284A32"/>`;
      s += `<path d="M${x} ${H * 0.52} q${i % 2 ? 34 : -34} -26 ${i % 2 ? 66 : -66} -30" stroke="#284A32" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      for (const [dx, dy, rr] of [[-40, 6, 40], [0, -18, 48], [42, 4, 38], [-14, 24, 34], [24, 26, 32]]) s += `<circle cx="${x + dx}" cy="${top + dy}" r="${rr}" fill="#2C5536" opacity="0.95"/>`;
    }
    // 木の こしいた
    s += `<rect y="${V(78)}" width="${L}" height="78" fill="#8A6142"/>`;
    for (let x = 0; x < L; x += 26) s += `<path d="M${x} ${V(78)} V${H}" stroke="#74502F" stroke-width="2"/>`;
    s += `<path d="M0 ${V(76)} H${L}" stroke="#B48A5C" stroke-width="6"/><path d="M0 ${V(79)} H${L}" stroke="${INK}" stroke-width="1.4"/>`;
    // うえの はっぱの ガーランド と あかりの つぶ（たれさがる ひも）
    const gy = V(H - 18);
    for (let x0 = 0; x0 < L; x0 += 150) {
      const x1 = x0 + 150; s += `<path d="M${x0} ${gy} Q${x0 + 75} ${gy + 30} ${x1} ${gy}" stroke="#5E4128" stroke-width="2" fill="none"/>`;
      for (let t = 0.1; t < 0.95; t += 0.2) { const bx = x0 + 150 * t, by = gy + 60 * t * (1 - t); s += `<circle cx="${f2(bx)}" cy="${f2(by + 5)}" r="7" fill="#FFE9A0" filter="url(#awglow${side})" opacity="0.8"/><circle cx="${f2(bx)}" cy="${f2(by + 5)}" r="3.6" fill="#FFF6CF" stroke="${INK}" stroke-width="0.8"/>`; }
    }
    for (let x = -6, i = 0; x < L + 12; x += 22, i++) s += `<ellipse cx="${x}" cy="${gy - 6 + (i % 2) * 5}" rx="13" ry="6" transform="rotate(${i % 2 ? 24 : -24} ${x} ${gy - 6 + (i % 2) * 5})" fill="${["#6FAE5A", "#8CC63F", "#5E9A3E"][i % 3]}" stroke="${INK}" stroke-width="1.1"/>`;
    return s;
  };
  // かべの 絵（ネオン・ポスター・LED の すじ）。part: { kind: 'neon' | 'poster' | 'sign', from, to（マス）, z0, z1, text, col, prize }
  const wallSvg = (r, side) => {
    const L = (side === "north" ? r.w : r.h) * IsoVenue.T, H = r.wallH || 280, parts = (r.walls && r.walls[side]) || [], V = (z) => H - z, forest = r.theme === "forest";
    const sky = forest ? ["#1F3B2A", "#355E3C"] : ["#241F3F", "#3A3263"];
    let s = `<defs><linearGradient id="awg${side}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient><filter id="awglow${side}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
    s += `<rect width="${L}" height="${H}" fill="url(#awg${side})"/>`;
    if (forest) s += forestWall(L, H, V, side);
    else {
      for (let x = 24; x < L; x += 48) s += `<path d="M${x} 0 V${H}" stroke="#2E2850" stroke-width="2"/>`;
      for (const [z, c] of [[H - 26, "#FF8FB8"], [44, "#9FD3F0"]]) s += `<path d="M0 ${V(z)} H${L}" stroke="${c}" stroke-width="7" filter="url(#awglow${side})" opacity="0.8"/><path d="M0 ${V(z)} H${L}" stroke="${c}" stroke-width="3"/>`;
    }
    // 西の かべは 手前（みなみ）から おくへ 左→右（MallArt と おなじ）
    for (const p0 of parts) {
      const p = side === "west" ? { ...p0, from: r.h - p0.to, to: r.h - p0.from } : p0, u0 = p.from * IsoVenue.T, w = (p.to - p.from) * IsoVenue.T, cx = u0 + w / 2;
      if (p.kind === "neon" && forest) {
        // もりの かんばん: 木の いた・ひもで つるす・はしに はっぱ（ネオンの かわり。もじは ほんのり ひかる）
        const y = V(p.z || 206), size = p.size || 44, col = p.col || "#9ED36A", y0 = y - size * 0.9, bh = size * 1.3;
        for (const x of [u0 + 30, u0 + w - 30]) s += `<path d="M${x} ${y0 - 26} L${x} ${y0 + 4}" stroke="#C9A27A" stroke-width="2.4"/>`;
        s += `<rect x="${u0 + 8}" y="${y0}" width="${w - 16}" height="${bh}" rx="10" fill="#6B4A2E" stroke="${INK}" stroke-width="2"/><rect x="${u0 + 14}" y="${y0 + 6}" width="${w - 28}" height="${bh - 12}" rx="7" fill="none" stroke="#9A6E44" stroke-width="2"/>`;
        for (let k = 1; k < 4; k++) s += `<path d="M${u0 + 18} ${y0 + (bh * k) / 4} H${u0 + w - 18}" stroke="#5E4128" stroke-width="1.4" opacity="0.6"/>`;
        s += txt(cx, y + size * 0.1, size, p.text, "none", `stroke="${col}" stroke-width="7" filter="url(#awglow${side})" opacity="0.55"`) + txt(cx, y + size * 0.1, size, p.text, "#FFF6DA", `stroke="${col}" stroke-width="2"`);
        for (const [x, k] of [[u0 + 12, 1], [u0 + w - 12, -1]]) s += forestLeaves(x, y0 + 4, k);
      } else if (p.kind === "neon") {
        const y = V(p.z || 206), size = p.size || 44, col = p.col || "#FF8FB8";
        s += `<rect x="${u0 + 8}" y="${y - size * 0.9}" width="${w - 16}" height="${size * 1.3}" rx="16" fill="#1B1730" stroke="${INK}" stroke-width="2"/>`;
        s += txt(cx, y + size * 0.1, size, p.text, "none", `stroke="${col}" stroke-width="9" filter="url(#awglow${side})" opacity="0.9"`) + txt(cx, y + size * 0.1, size, p.text, "#FFFFFF", `stroke="${col}" stroke-width="2.4"`);
        if (p.stars) for (const k of [-1, 1]) s += star(cx + k * (w / 2 - 34), y - size * 0.25, 13, "#FFE07A", `stroke="${INK}" stroke-width="1.4"`);
      } else if (p.kind === "poster") {
        const y0 = V(p.z1 || 190), h = (p.z1 || 190) - (p.z0 || 90), col = p.col || "#F7A9C8";
        s += `<rect x="${u0 + 10}" y="${y0}" width="${w - 20}" height="${h}" rx="8" fill="#FFFDF5" stroke="${INK}" stroke-width="2"/><rect x="${u0 + 16}" y="${y0 + 6}" width="${w - 32}" height="${h * 0.62}" rx="5" fill="${col}"/>`;
        if (p.prize) s += img(ArcadePrizes.svg(p.prize), cx - h * 0.3, y0 + 8, h * 0.6, h * 0.6 - 4);
        if (p.snack) s += img(SnackArt.svg(p.snack), cx - h * 0.3, y0 + 8, h * 0.6, h * 0.6 - 4);
        if (p.coin) s += `<circle cx="${cx}" cy="${y0 + h * 0.33}" r="${h * 0.22}" fill="#F2C84B" stroke="${INK}" stroke-width="2"/>` + star(cx, y0 + h * 0.33, h * 0.11, "#FFF3B0");
        (p.lines || []).forEach((t, i) => (s += txt(cx, y0 + h * 0.74 + i * 16, 13, t, INK)));
      } else if (p.kind === "sign") {
        const y = V(p.z || 230);
        s += `<rect x="${u0 + 6}" y="${y - 22}" width="${w - 12}" height="32" rx="10" fill="${p.col || "#FFE07A"}" stroke="${INK}" stroke-width="2"/>` + txt(cx, y, 17, p.text, INK);
        if (forest) s += forestLeaves(u0 + 10, y - 20, 1);
      }
    }
    s += `<rect y="${V(10)}" width="${L}" height="10" fill="${forest ? "#4A3524" : "#1B1730"}"/><path d="M0,${V(10)} H${L}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}">${s}</svg>`, L, H };
  };
  const paintWalls = (g, r) => {
    const Av = IsoVenue.A, Bv = IsoVenue.B, H = r.wallH || 280;
    for (const side of ["west", "north"]) {
      const w = r._walls && r._walls[side]; if (!w || !w.c) continue;
      g.save(); if (side === "north") g.transform(Av, Bv, 0, 1, 0, -H); else g.transform(Av, -Bv, 0, 1, -w.L * Av, w.L * Bv - H);
      g.drawImage(w.c, 0, 0, w.L, w.H); if (side === "west") { g.fillStyle = "rgba(20,16,40,.12)"; g.fillRect(0, 0, w.L, w.H); }
      g.lineWidth = 1.8; g.strokeStyle = INK; g.strokeRect(0, 0, w.L, w.H); g.restore();
    }
    const a = IsoVenue.p(0, 0, 0), b = IsoVenue.p(0, 0, H); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    // 天じょうの くらがり
    const Fh = 150, steps = 12;
    for (const [x0, y0, x1, y1] of [[0, 0, r.w, 0], [0, 0, 0, r.h]]) for (let i = 0; i < steps; i++) {
      const t0 = i / steps, t1 = (i + 1) / steps, A0 = IsoVenue.p(x0, y0, H + Fh * t0), A1 = IsoVenue.p(x1, y1, H + Fh * t0), B1 = IsoVenue.p(x1, y1, H + Fh * t1), B0 = IsoVenue.p(x0, y0, H + Fh * t1);
      g.beginPath(); g.moveTo(A0.x, A0.y); g.lineTo(A1.x, A1.y); g.lineTo(B1.x, B1.y); g.lineTo(B0.x, B0.y); g.closePath(); g.fillStyle = `rgba(${r.theme === "forest" ? "22,44,30" : "36,31,63"},${(0.85 * (1 - t1)).toFixed(3)})`; g.fill();
    }
  };

  const art = Object.create(MallArt);
  Object.assign(art, {
    M: { ...MallArt.M, ...M }, L: { ...MallArt.L, ...L }, models: new Map(),
    // 日がわりの 台は その日の ならび（pool の くみあわせ だけ → 有限）も キーに
    // しゅうがわりの「NEW」の はた（f.fresh）も キーに（ある か ない かの 2つ）
    modelKey(f) { return "arcade:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.machine ?? "") + ":" + (f.dir || "") + ":" + (f.variant ?? "") + ":" + (f.item || "") + (f.kind === "crane" && CraneMachines.DEFS[f.machine].pool ? ":" + PrizeArcade.prizeList(f.machine).join(",") : "") + (f.fresh ? ":new" : ""); },
    frame, specOf, SPEC,
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = wallSvg(r, side); jobs.push(SvgCache.ensure("arcadewall:" + r.id + ":" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
    },
    paint(g, r) { paintFloor(g, r); paintHoles(g, r); paintWalls(g, r); },
    wallSvg,
    // 手前の ふち（ひくい かべの きりくち）
    over(ctx, sc, r, floor, off) {
      const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), band = (a, b, c, d, fill) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * sc.s * 2; ctx.stroke(); };
      const fo = r.theme === "forest", C = fo ? ["#6B4A2E", "#5A4130", "#9ED36A", "#F7D774"] : ["#3A3263", "#2E2850", "#FF8FB8", "#9FD3F0"];
      band(P(0, r.h, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(0, r.h, 16), C[0]);
      band(P(r.w, 0, 0), P(r.w, r.h, 0), P(r.w, r.h, 16), P(r.w, 0, 16), C[1]);
      band(P(0, r.h - 0.12, 16), P(r.w - 0.12, r.h - 0.12, 16), P(r.w, r.h, 16), P(0, r.h, 16), C[2]);
      band(P(r.w - 0.12, 0, 16), P(r.w, 0, 16), P(r.w, r.h, 16), P(r.w - 0.12, r.h - 0.12, 16), C[3]);
    },
    under() {},
    backdrop(r) { return r && r.theme === "forest" ? ["#12241A", "#24402C"] : ["#15122A", "#2B2447"]; },
    // しらべる（ぷりくら・カウンター・ガチャ・りょうがえ・でぐち）。クレーンは 台の まえに もどれる ように at を わたす
    async interact(sc, f) {
      if (f.action === "leave") { sc.leave(); return true; }
      if (f.action === "crane") { sc.busy = true; try { const at = f.spots && f.spots[0]; await PrizeArcade.open(f.machine, { venue: sc.id, floor: sc.floor, back: sc.back, at }); } finally { sc.busy = false; } return true; }
      // ぷりくら（js/purikura.js）: 300コインで さつえい → らくがき → すまほの「しゃしん」
      if (f.action === "photo") { sc.busy = true; try { const at = f.spots && f.spots[0]; await Purikura.open({ venue: sc.id, floor: sc.floor, back: sc.back, at }, f.booth); } finally { sc.busy = false; } return true; }
      // こういしつ・かしだし いしょう（js/mee-fitting.js）: きがえの 画面（じぶんの ふく ＋ かしだし）
      if (f.action === "fitting") { sc.busy = true; try { await MeeFitting.open(); } finally { sc.busy = false; } return true; }
      // ガチャガチャ（js/gacha.js）: 200コインで まわす → カプセル → フィギュアか 服
      if (f.action === "gacha") { sc.busy = true; try { await Gacha.open(f.series ?? f.variant ?? 0); } finally { sc.busy = false; } return true; }
      if (f.action === "counter") { sc.busy = true; try { const toy = typeof PlayGoods !== "undefined", opts = [...(toy ? ["おもちゃを みる"] : []), "まえの けいひんを みる", "コインの けいひんの きまり", "やめておく"], i = opts[await UI.ask(toy ? "けいひん カウンター\nとった けいひんは もちものに はいるよ。\nおもちゃや まえの けいひんも コインで こうかん できるよ。" : "けいひん カウンター\nとった けいひんは もちものに はいるよ。\nまえの けいひんも コインで こうかん できるよ。", opts)]; if (i === "おもちゃを みる") await ShopUI.open("ike_arcade", "toy"); else if (i === "まえの けいひんを みる") await ShopUI.open("ike_arcade"); else if (i === "コインの けいひんの きまり") await UI.say([{ name: "てんいん", text: `コインの けいひんは 1にち ${ArcadePrizes.COIN_DAY_MAX}コイン まで。\nきょうは あと ${ArcadePrizes.coinLeft()}コイン とれるよ。` }]); } finally { sc.busy = false; } return true; }
      return false;
    },
    // あるく おきゃくさん（MallArt の crowd。すいぞくかんの しかけは よばない）
    tick(sc, dt) {
      for (const m of this.crowd(sc)) {
        m.anim += dt;
        if (m.t < 1) { m.t = Math.min(1, m.t + dt / 0.45); continue; }
        m.fx = m.tx; m.fy = m.ty;
        if (m.path.length) { const [x, y] = m.path.shift(); if (!sc.walkable(x, y)) { m.path = []; continue; } m.dir = x > m.tx ? "right" : x < m.tx ? "left" : y > m.ty ? "down" : "up"; m.tx = x; m.ty = y; m.t = 0; continue; }
        if ((m.wait -= dt) <= 0) { m.path = this.crowdRoute(sc, m).slice(0, 12); m.wait = 1.5 + Math.random() * 4; if (!m.path.length) m.dir = "down"; }
      }
    },
  });
  return art;
})();
