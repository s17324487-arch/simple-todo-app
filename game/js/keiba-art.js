// UI-58: けいば ちゅうけい の 絵。うまと きしゅ（よこむき・はしる 4コマ）・ちゅうけいの コース（そら・まち・うちの さく・しば／ダート・ハロンぼう・ゴール・ゲート・そとの さく）・
// コースの ちず（ミニマップ）・ゼッケンの まる。コーナーの 什器（10F）は js/keiba-corner.js が KadenHallArt に たす（M・L は ここ）。
// ・うまの 絵は SvgCache（キーは「コマ 4 × けいろ 5 × しょうぶふく 16 × わく 8」の なかから。かずに かぎりが ある）。ゼッケンの ばんごうは canvas の もじ。
// ・せんは INK・はしは まるく・いろは パステル。うまは みぎむき（ひだりまわりの コースの ホームストレッチを スタンドから みる むき）。
const KeibaArt = (() => {
  const TAU = Math.PI * 2, f2 = (v) => Math.round(v * 100) / 100, R = KeibaRules;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + k)))); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const FONT = (px) => `900 ${px}px 'M PLUS Rounded 1c', sans-serif`;
  // けいろ [からだ, たてがみ・しっぽ, あしの さき]
  const COATS = [["#E8A673", "#B76A3C", "#E8A673"], ["#BC8667", "#4F3B31", "#4F3B31"], ["#866455", "#3B2B24", "#3B2B24"], ["#DADDE2", "#A9AEB6", "#C3C7CE"], ["#FBF8F1", "#E2DDD2", "#EFEAE0"]];
  // しょうぶふく [どう, そで, もよう, もようの いろ]。もよう 0 なし・1 おび・2 たてじま・3 たすき・4 みずたま・5 ひしがた・6 そでの わ
  const SILKS = [
    ["#E5483F", "#FFFFFF", 1, "#FFFFFF"], ["#3B7BD8", "#F6D13B", 3, "#F6D13B"], ["#FFFFFF", "#3AA45A", 2, "#3AA45A"], ["#F49BC1", "#FFFFFF", 4, "#FFFFFF"],
    ["#F6D13B", "#33302D", 6, "#33302D"], ["#3AA45A", "#FFFFFF", 5, "#FFFFFF"], ["#9B7BD0", "#F6D13B", 1, "#F6D13B"], ["#33302D", "#E5483F", 3, "#E5483F"],
    ["#F2962C", "#3B7BD8", 2, "#3B7BD8"], ["#7FC8E8", "#FFFFFF", 0, ""], ["#FFFFFF", "#E5483F", 4, "#E5483F"], ["#A6D96A", "#F49BC1", 6, "#F49BC1"],
    ["#C9473F", "#F7E7B4", 5, "#F7E7B4"], ["#2F5FA8", "#FFFFFF", 1, "#FFFFFF"], ["#FFE9A8", "#9B7BD0", 3, "#9B7BD0"], ["#E58BB0", "#3B7BD8", 0, ""],
  ];
  // ---- うまと きしゅ（viewBox 140×100・あしもとは y 95）----
  const VB = { w: 140, h: 106 }, CLOTH = { x: 66, y: 48 }; // ゼッケンの まんなか（ばんごうを かく ところ）
  // あしの かくど [もも, ひざ]（0 = まっすぐ した・+ は まえ）。[とおい まえ, ちかい まえ, とおい うしろ, ちかい うしろ]
  const POSES = [
    [[40, 18], [56, 4], [-44, -6], [-30, -18]], // のびる（4ほんとも ういて いる）
    [[4, -78], [-12, -62], [30, -26], [44, -40]], // あつまる（したに たたむ）
    [[8, -6], [-22, -30], [12, 6], [-6, 14]], // まえあしが つく
    [[34, -84], [22, -70], [-14, 4], [-30, 10]], // うしろあしが つく
  ];
  const BOB = [0, 2.4, 1, 2.8];
  const legPath = (hx, hy, a1, a2, l1, l2) => { const r1 = (a1 * Math.PI) / 180, r2 = ((a1 + a2) * Math.PI) / 180, kx = hx + Math.sin(r1) * l1, ky = hy + Math.cos(r1) * l1, fx = kx + Math.sin(r2) * l2, fy = ky + Math.cos(r2) * l2; return { d: `M${f2(hx)} ${f2(hy)} L${f2(kx)} ${f2(ky)} L${f2(fx)} ${f2(fy)}`, fx, fy }; };
  const horseSvg = (fr, coat, silk, waku) => {
    const C = COATS[coat] || COATS[0], S = SILKS[silk] || SILKS[0], cap = (R.WAKU[waku] || R.WAKU[1]).c, P = POSES[fr % 4], b = BOB[fr % 4], uid = `kb${fr}${coat}${silk}${waku}`;
    const leg = (hx, hy, [a1, a2], far, front) => {
      const col = far ? shade(C[0], -0.16) : C[0], tip = far ? shade(C[2], -0.16) : C[2], { d, fx, fy } = legPath(hx, hy + b, a1, a2, front ? 17 : 18, front ? 18 : 17);
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle cx="${f2(fx)}" cy="${f2(fy)}" r="3.1" fill="${tip}"/><ellipse cx="${f2(fx + 0.6)}" cy="${f2(fy + 2)}" rx="3.9" ry="2.3" fill="#4A403A" stroke="${INK}" stroke-width="1.4"/>`;
    };
    // もようを どうに（clipPath は この 絵の なか だけ）
    const torso = "M66 35 C63 27 70 20 81 18 C90 16 96 21 94 28 C91 33 79 38 66 35 Z";
    const pat = S[2] === 1 ? `<rect x="60" y="23" width="40" height="5.5" fill="${S[3]}" transform="rotate(-18 80 26)"/>` : S[2] === 2 ? [70, 77, 84, 91].map((x) => `<rect x="${x}" y="10" width="3" height="34" fill="${S[3]}" transform="rotate(-18 80 26)"/>`).join("") : S[2] === 3 ? `<path d="M68 22 L92 36" stroke="${S[3]}" stroke-width="5"/>` : S[2] === 4 ? [[72, 28], [80, 24], [87, 21], [77, 32], [85, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${S[3]}"/>`).join("") : S[2] === 5 ? `<path d="M80 19 L85 26 L80 33 L75 26 Z" fill="${S[3]}"/>` : "";
    const body = `<path d="M40 49 C40 40 52 37 66 38 C80 37 92 37 99 42 C105 47 105 60 97 64 C86 69 55 70 45 66 C39 63 39 56 40 49 Z" fill="${C[0]}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      // くび・あたま
      `<path d="M92 42 C97 33 104 25 111 20 C114 18 118 19 120 22 L124 26 C119 31 113 39 106 52 C101 57 95 53 92 42 Z" fill="${C[0]}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M110 19 C114 14 122 13 128 17 C133 20 136 25 134 29 C132 32 127 32 123 31 C119 30 115 29 112 26 Z" fill="${C[0]}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M112 17 L111 9 L117 14 Z" fill="${C[0]}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<circle cx="122.5" cy="20.5" r="1.8" fill="${INK}"/><circle cx="131.5" cy="27" r="1" fill="${INK}"/>` +
      // たてがみ・しっぽ
      `<path d="M110 19 C104 22 98 28 94 36 C96 30 99 27 98 24 C102 22 106 19 110 19 Z" fill="${C[1]}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M41 46 C31 42 22 46 15 56 C19 56 22 55 24 54 C21 60 22 63 22 66 C27 60 33 55 40 54 Z" fill="${C[1]}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      // ゼッケン（しろ。ばんごうは あとで）・くら
      `<path d="M56 41 L77 40 L78 56 L57 57 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M60 39 C66 36 76 36 82 39 L80 42 C74 40 66 40 61 42 Z" fill="#5A4A40" stroke="${INK}" stroke-width="1.4"/>` +
      // たづな
      `<path d="M103 34 C112 33 120 31 128 29" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;
    const jockey = `<clipPath id="${uid}t"><path d="${torso}"/></clipPath>` +
      // あし（しろい ズボンと くろい ブーツ）
      `<path d="M70 34 L83 39 L79 47" fill="none" stroke="${INK}" stroke-width="7.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 34 L83 39" fill="none" stroke="#FFFFFF" stroke-width="4.8" stroke-linecap="round"/><path d="M83 39 L79 47" fill="none" stroke="#2E2B30" stroke-width="4.8" stroke-linecap="round"/>` +
      `<path d="${torso}" fill="${S[0]}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><g clip-path="url(#${uid}t)">${pat}</g><path d="${torso}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      // うで（そで）
      `<path d="M88 24 C94 27 99 30 103 34" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/><path d="M88 24 C94 27 99 30 103 34" fill="none" stroke="${S[1]}" stroke-width="4.6" stroke-linecap="round"/>` +
      (S[2] === 6 ? `<path d="M95 28 L97 31" stroke="${S[3]}" stroke-width="4" stroke-linecap="round"/>` : "") +
      `<circle cx="104" cy="34.5" r="2.4" fill="#FFFFFF" stroke="${INK}" stroke-width="1.4"/>` +
      // あたま（かお・わくの いろの ぼうし・つば）
      `<circle cx="97" cy="16" r="6" fill="#F8DECB" stroke="${INK}" stroke-width="2"/><path d="M90.6 15.6 C90.4 9.6 95 7 99 7.6 C103.4 8.2 104.6 12 104.2 14.2 C99.6 13.6 95 14.2 90.6 15.6 Z" fill="${cap}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M103.6 13.6 C106 13.4 108 14 108.6 15 C106.4 15.6 104.8 15.6 103.8 15.4 Z" fill="${shade(cap === "#FFFFFF" ? "#DADADA" : cap, -0.2)}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="100.6" cy="17" r="1" fill="${INK}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB.w} ${VB.h}">` + leg(90, 60, P[0], true, true) + leg(48, 60, P[2], true, false) + `<g transform="translate(0 ${b})">${body}${jockey}</g>` + leg(93, 61, P[1], false, true) + leg(51, 61, P[3], false, false) + `</svg>`;
  };
  const horseKey = (fr, coat, silk, waku) => "keibahorse:" + (fr % 4) + ":" + coat + ":" + silk + ":" + waku;
  // pw: ラスタの はば（たんまつの ピクセル）。ちいさく 描く ときも この 1しゅるいを ちぢめる
  const horsePx = () => Math.max(96, Math.ceil(((typeof G !== "undefined" ? G.px : 2) * 88) / 16) * 16);
  const horseImg = (fr, h) => { const pw = horsePx(); return SvgCache.get(horseKey(fr, h.coat, h.silk, h.waku), () => horseSvg(fr, h.coat, h.silk, h.waku), pw, Math.round((pw * VB.h) / VB.w)); };
  const preload = (rc) => { const pw = horsePx(), ph = Math.round((pw * VB.h) / VB.w), jobs = []; for (const h of rc.horses) for (let fr = 0; fr < 4; fr++) jobs.push(SvgCache.ensure(horseKey(fr, h.coat, h.silk, h.waku), () => horseSvg(fr, h.coat, h.silk, h.waku), pw, ph)); return Promise.all(jobs); };

  // ゼッケンの まる（わくの いろ・ばんごう）
  const chip = (ctx, x, y, r, no, waku, ring) => {
    const W = R.WAKU[waku] || R.WAKU[1];
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = W.c; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.16); ctx.strokeStyle = INK; ctx.stroke();
    if (ring) { ctx.beginPath(); ctx.arc(x, y, r + Math.max(2, r * 0.3), 0, TAU); ctx.strokeStyle = "#FF5A7A"; ctx.lineWidth = Math.max(1.6, r * 0.24); ctx.stroke(); }
    ctx.fillStyle = W.t; ctx.font = FONT(Math.round(r * 1.15)); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(no), x, y + r * 0.06);
  };

  // ---- ちゅうけいの がめん（V: { x, y, w, h, cx: カメラの いち〔m〕, ppm: 1m の ピクセル, D, surf, weather, t, horses: [{ h, s, lane, fr, mine }], gate: 0〜1〔ひらく〕 }）----
  const SKY = { はれ: ["#7FC2EC", "#D4ECF8"], くもり: ["#A9B8C6", "#DDE3EA"], こさめ: ["#9AA8B6", "#CBD3DC"], あめ: ["#8794A3", "#BCC5CF"] };
  const view = (V) => {
    const y0 = V.y + V.h * 0.5, y1 = V.y + V.h * 0.84; // うちがわ（とおい）〜 そとがわ（ちかい）
    const sc = (l) => 0.74 + 0.26 * l, Y = (l) => y0 + (y1 - y0) * l, X = (s, l) => V.x + V.w * 0.5 + (s - V.cx) * V.ppm * sc(l);
    return { y0, y1, sc, Y, X };
  };
  const drawView = (ctx, V) => {
    const g = view(V), { y0, y1, Y, X, sc } = g, W = V.w, x0 = V.x, t = V.t || 0;
    ctx.save(); ctx.beginPath(); ctx.rect(V.x, V.y, V.w, V.h); ctx.clip();
    // そら
    const sk = SKY[V.weather] || SKY.はれ, gr = ctx.createLinearGradient(0, V.y, 0, y0); gr.addColorStop(0, sk[0]); gr.addColorStop(1, sk[1]); ctx.fillStyle = gr; ctx.fillRect(V.x, V.y, W, y0 - V.y);
    if (V.weather === "はれ") { ctx.fillStyle = "rgba(255,248,214,.9)"; ctx.beginPath(); ctx.arc(x0 + W * 0.84, V.y + V.h * 0.1, V.h * 0.05, 0, TAU); ctx.fill(); }
    ctx.fillStyle = V.weather === "はれ" ? "rgba(255,255,255,.92)" : "rgba(240,243,247,.8)";
    for (let i = 0; i < 5; i++) { const px = (((i * 157 - V.cx * V.ppm * 0.03 + t * 4) % (W + 160)) + W + 160) % (W + 160) - 80, py = V.y + V.h * (0.06 + (i % 3) * 0.06); ctx.beginPath(); ctx.ellipse(x0 + px, py, 26, 8, 0, 0, TAU); ctx.ellipse(x0 + px + 14, py - 5, 16, 7, 0, 0, TAU); ctx.fill(); }
    // とおくの まち（いけぶくろの たかい ビル）
    const base = y0 - V.h * 0.12;
    ctx.fillStyle = "#C9C2DA";
    for (let i = 0; i < 14; i++) { const bw = 18 + ((i * 37) % 22), bh = 14 + ((i * 53) % 34) + (i % 7 === 3 ? 44 : 0), px = (((i * 41 - V.cx * V.ppm * 0.05) % (W + 60)) + W + 60) % (W + 60) - 30; ctx.fillRect(x0 + px, base - bh, bw, bh); if (i % 7 === 3) { ctx.fillRect(x0 + px + bw * 0.3, base - bh - 8, bw * 0.4, 8); } }
    // き の ならび・おか
    ctx.fillStyle = "#A9CF8E"; ctx.beginPath(); ctx.moveTo(V.x, base + 4);
    for (let i = 0; i <= 24; i++) { const px = (i / 24) * W, ph = Math.sin((i * 1.7 + V.cx * V.ppm * 0.0016) * 1.3) * 3; ctx.lineTo(x0 + px, base - 6 + ph); }
    ctx.lineTo(V.x + W, y0); ctx.lineTo(V.x, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#86B96D";
    for (let i = 0; i < 18; i++) { const px = (((i * 29 - V.cx * V.ppm * 0.14) % (W + 40)) + W + 40) % (W + 40) - 20; ctx.beginPath(); ctx.arc(x0 + px, base - 2, 8 + (i % 3) * 2, Math.PI, 0); ctx.fill(); }
    // うちの しばふ（かだん）
    ctx.fillStyle = "#BFE29F"; ctx.fillRect(V.x, base + 2, W, y0 - base - 2);
    for (let i = 0; i < 16; i++) { const px = (((i * 47 - V.cx * V.ppm * 0.35) % (W + 30)) + W + 30) % (W + 30) - 15; ctx.fillStyle = ["#FFB3C7", "#FFE27A", "#FFFFFF"][i % 3]; ctx.beginPath(); ctx.arc(x0 + px, y0 - 6 - (i % 2) * 3, 2.4, 0, TAU); ctx.fill(); }
    // コース
    const turf = V.surf !== "dirt", wet = V.weather === "あめ" || V.weather === "こさめ";
    ctx.fillStyle = turf ? (wet ? "#86BE70" : "#8FCB76") : wet ? "#B8885E" : "#D2A479"; ctx.fillRect(V.x, y0 - 2, W, V.y + V.h - y0 + 2);
    // しばの もよう（10m ごとの しま）・ダートの つぶ
    if (turf) {
      ctx.fillStyle = wet ? "#7DB466" : "#9ED486";
      const s0 = Math.floor((V.cx - W / V.ppm) / 10) * 10;
      for (let s = s0; s < V.cx + W / V.ppm / 0.7; s += 20) { ctx.beginPath(); ctx.moveTo(X(s, 0), y0); ctx.lineTo(X(s + 10, 0), y0); ctx.lineTo(X(s + 10, 1.12), Y(1.12)); ctx.lineTo(X(s, 1.12), Y(1.12)); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.fillStyle = "rgba(122,84,52,.35)";
      for (let i = 0; i < 60; i++) { const l = (i * 0.137) % 1.1, ss = Math.floor(V.cx / 3) * 3 - 30 + ((i * 7.3) % 60); ctx.fillRect(X(ss, l), Y(l), 2, 1.2); }
    }
    // ハロンぼう（ゴールから 200m ごと）・ゴールの せん
    for (let k = 1; k * 200 < V.D; k++) { const s = V.D - k * 200, x = X(s, -0.03); if (x < V.x - 20 || x > V.x + W + 20) continue; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillRect(x - 1.6, y0 - 40, 3.2, 40); ctx.strokeRect(x - 1.6, y0 - 40, 3.2, 40); for (let j = 0; j < 4; j++) { ctx.fillStyle = "#E5483F"; ctx.fillRect(x - 1.6, y0 - 40 + j * 10, 3.2, 5); } ctx.fillStyle = "#FFFFFF"; U.rr(ctx, x - 9, y0 - 54, 18, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = FONT(9); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(k * 2), x, y0 - 47); }
    { const xa = X(V.D, -0.02), xb = X(V.D, 1.1); if (Math.max(xa, xb) > V.x - 40 && Math.min(xa, xb) < V.x + W + 40) { ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, Y(1.1)); ctx.stroke(); } }
    // うちの さく（とおい）
    rail(ctx, V, g, -0.04, 5, 22, 2.2);
    // ゲート（スタートの まえ・ひらく）
    if (V.gate != null) gateBack(ctx, V, g);
    // うま（うちがわ = とおい ほうから）
    const list = (V.horses || []).slice().sort((a, b) => a.lane - b.lane);
    for (const o of list) {
      const s = sc(o.lane), wpx = 3.3 * V.ppm * s, hpx = (wpx * VB.h) / VB.w, x = X(o.s, o.lane), y = Y(o.lane);
      if (x < V.x - wpx || x > V.x + W + wpx) continue;
      ctx.fillStyle = "rgba(31,29,27,.16)"; ctx.beginPath(); ctx.ellipse(x - wpx * 0.08, y, wpx * 0.36, Math.max(2, wpx * 0.06), 0, 0, TAU); ctx.fill();
      const img = horseImg(o.fr, o.h);
      const left = x - wpx * 0.62, top = y - hpx * 0.95;
      if (img) ctx.drawImage(img, left, top, wpx, hpx);
      // ゼッケンの ばんごう
      if (wpx > 18) { ctx.fillStyle = INK; ctx.font = FONT(Math.max(6, Math.round(wpx * 0.085))); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(o.h.no), left + (CLOTH.x / VB.w) * wpx, top + ((CLOTH.y + BOB[o.fr % 4]) / VB.h) * hpx); }
      if (o.mine) { const mx = left + wpx * 0.66, my = top - 4 - Math.abs(Math.sin(t * 6)) * 2; ctx.fillStyle = "#FF5A7A"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx - 5, my - 7); ctx.lineTo(mx + 5, my - 7); ctx.lineTo(mx, my); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    if (V.gate != null) gateFront(ctx, V, g);
    // ゴールの ばん
    { const x = X(V.D, -0.06); if (x > V.x - 30 && x < V.x + W + 30) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x - 2, y0 - 70, 4, 70); ctx.strokeRect(x - 2, y0 - 70, 4, 70); ctx.beginPath(); ctx.arc(x, y0 - 80, 15, 0, TAU); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y0 - 80, 11, 0, TAU); ctx.fillStyle = "#E5483F"; ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.font = FONT(8); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ゴール", x, y0 - 80, 20); } }
    // そとの さく（ちかい・はやく ながれる）
    rail(ctx, V, g, 1.16, 3, 30, 3.4);
    // あめ
    if (V.weather === "あめ" || V.weather === "こさめ") { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; const n = V.weather === "あめ" ? 70 : 34; for (let i = 0; i < n; i++) { const px = ((i * 53.7 + t * 90) % (W + 40)) - 20, py = V.y + ((i * 97.3 + t * 420) % V.h); ctx.beginPath(); ctx.moveTo(x0 + px, py); ctx.lineTo(x0 + px - 4, py + 10); ctx.stroke(); } }
    ctx.restore();
  };
  // さく（l は コースの なか・そとの いち・gap は くいの あいだ〔m〕）
  const rail = (ctx, V, g, l, gap, hgt, wid) => {
    const { X, Y, sc } = g, y = Y(l), s0 = Math.floor((V.cx - (V.w / V.ppm) / sc(l)) / gap) * gap - gap, s1 = V.cx + (V.w / V.ppm) / sc(l) + gap, k = sc(l) / 0.86;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (let s = s0; s <= s1; s += gap) { const x = X(s, l); ctx.fillRect(x - wid / 2, y - hgt * k, wid, hgt * k); ctx.strokeRect(x - wid / 2, y - hgt * k, wid, hgt * k); }
    const xa = X(s0, l), xb = X(s1, l); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(xa, y - hgt * k - 2, xb - xa, 5 * k); ctx.beginPath(); ctx.moveTo(xa, y - hgt * k - 2); ctx.lineTo(xb, y - hgt * k - 2); ctx.moveTo(xa, y - hgt * k + 5 * k - 2); ctx.lineTo(xb, y - hgt * k + 5 * k - 2); ctx.stroke();
  };
  // ゲート（みどりの わく・ひとつずつの へや）
  const gateBack = (ctx, V, g) => {
    const { X, Y } = g, s = 0.4;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    const n = V.n || 12;
    for (let i = 0; i <= n; i++) { const l = 0.03 + (0.66 * i) / n, x = X(s + 1.6, l), y = Y(l); ctx.fillStyle = "#4E9E6A"; ctx.fillRect(x - 1.5, y - 34 * g.sc(l), 3, 34 * g.sc(l)); ctx.strokeRect(x - 1.5, y - 34 * g.sc(l), 3, 34 * g.sc(l)); }
  };
  const gateFront = (ctx, V, g) => {
    const { X, Y, sc } = g, open = V.gate, n = V.n || 12;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    const la = 0.03, lb = 0.69, xa = X(2.3, la), xb = X(2.3, lb), ya = Y(la), yb = Y(lb), hA = 42 * sc(la), hB = 42 * sc(lb);
    // うえの はり
    ctx.fillStyle = "#5DB57A"; ctx.beginPath(); ctx.moveTo(xa, ya - hA); ctx.lineTo(xb, yb - hB); ctx.lineTo(xb, yb - hB + 7); ctx.lineTo(xa, ya - hA + 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    // まえの とびら（ひらくと よこに たおれる）
    for (let i = 0; i < n; i++) {
      const l = 0.03 + (0.66 * (i + 0.5)) / n, x = X(2.3, l), y = Y(l), k = sc(l);
      ctx.save(); ctx.translate(x, y - 18 * k); ctx.rotate(-open * 1.25); ctx.fillStyle = "rgba(93,181,122,.85)"; ctx.fillRect(0, -10 * k, 4 * k, 22 * k); ctx.strokeRect(0, -10 * k, 4 * k, 22 * k); ctx.restore();
    }
    // ばんごうの ふだ
    for (let i = 0; i < n; i++) { const l = 0.03 + (0.66 * (i + 0.5)) / n, x = X(2.3, l), y = Y(l), k = sc(l); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x - 4 * k, y - hA * 0.98 - 1, 8 * k, 6 * k); ctx.fillStyle = INK; ctx.font = FONT(Math.max(5, Math.round(5 * k))); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), x, y - hA * 0.98 + 2 * k); }
  };
  const y0of = (V) => V.y + V.h * 0.5, y1of = (V) => V.y + V.h * 0.84;

  // ---- スタートの まえ: しょうめんから みた ゲート（open 0 しまる〜1 ひらく）----
  const drawGate = (ctx, V, rc, open, t) => {
    const n = rc.n, W = V.w, x0 = V.x + 8, gw = W - 16, sw = gw / n, base = V.y + V.h * 0.9, top = V.y + V.h * 0.4, hh = base - top;
    ctx.save(); ctx.beginPath(); ctx.rect(V.x, V.y, V.w, V.h); ctx.clip();
    const sk = SKY[rc.weather] || SKY.はれ, gr = ctx.createLinearGradient(0, V.y, 0, top); gr.addColorStop(0, sk[0]); gr.addColorStop(1, sk[1]); ctx.fillStyle = gr; ctx.fillRect(V.x, V.y, W, base - V.y);
    ctx.fillStyle = "#C9C2DA"; for (let i = 0; i < 12; i++) { const bw = 20 + ((i * 37) % 20), bh = 18 + ((i * 53) % 30) + (i % 6 === 2 ? 50 : 0), px = (i * 34) % (W + 20) - 10; ctx.fillRect(V.x + px, top + 6 - bh, bw, bh); }
    ctx.fillStyle = "#A9CF8E"; ctx.fillRect(V.x, top + 4, W, hh * 0.2);
    ctx.fillStyle = rc.surf === "dirt" ? "#D2A479" : "#8FCB76"; ctx.fillRect(V.x, top + hh * 0.2, W, V.h);
    // うまと きしゅ（へやの なか）
    for (let i = 0; i < n; i++) {
      const h = rc.horses[i], C = COATS[h.coat] || COATS[0], cx = x0 + sw * (i + 0.5), k = Math.min(1, sw / 24), bob = Math.sin(t * 3 + i * 1.3) * 1.2 - open * 4;
      const hy = top + hh * 0.42 + bob;
      // きしゅ（ぼうしと かた）
      ctx.fillStyle = (SILKS[h.silk] || SILKS[0])[0]; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, hy - 10 * k, 8 * k, 5 * k, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#F8DECB"; ctx.beginPath(); ctx.arc(cx, hy - 17 * k, 4.2 * k, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = (R.WAKU[h.waku] || R.WAKU[1]).c; ctx.beginPath(); ctx.arc(cx, hy - 18.4 * k, 4.4 * k, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      // うまの かお（まえから）
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.moveTo(cx - 6 * k, hy - 6 * k); ctx.quadraticCurveTo(cx - 7.5 * k, hy + 10 * k, cx - 3.4 * k, hy + 18 * k); ctx.quadraticCurveTo(cx, hy + 21 * k, cx + 3.4 * k, hy + 18 * k); ctx.quadraticCurveTo(cx + 7.5 * k, hy + 10 * k, cx + 6 * k, hy - 6 * k); ctx.quadraticCurveTo(cx, hy - 10 * k, cx - 6 * k, hy - 6 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * 3.5 * k, hy - 7 * k); ctx.lineTo(cx + sx * 6 * k, hy - 13 * k); ctx.lineTo(cx + sx * 6.4 * k, hy - 5 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (h.no % 3 === 1) { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(cx, hy + 4 * k, 1.4 * k, 6 * k, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = INK; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sx * 3.4 * k, hy + 1 * k, 1.1 * k, 0, TAU); ctx.fill(); }
      ctx.fillStyle = C[1]; ctx.beginPath(); ctx.ellipse(cx, hy - 7 * k, 3 * k, 2.2 * k, 0, 0, TAU); ctx.fill();
    }
    // わく（はしら・うえの はり・ばんごうの ふだ）
    ctx.fillStyle = "#5DB57A"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillRect(x0 - 4, top, gw + 8, hh * 0.13); ctx.strokeRect(x0 - 4, top, gw + 8, hh * 0.13);
    for (let i = 0; i <= n; i++) { const x = x0 + sw * i; ctx.fillRect(x - 1.8, top, 3.6, hh); ctx.strokeRect(x - 1.8, top, 3.6, hh); }
    for (let i = 0; i < n; i++) { const h = rc.horses[i], cx = x0 + sw * (i + 0.5), pw = Math.min(16, sw - 4); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(cx - pw / 2, top + 2, pw, hh * 0.13 - 4); ctx.strokeRect(cx - pw / 2, top + 2, pw, hh * 0.13 - 4); ctx.fillStyle = (R.WAKU[h.waku] || R.WAKU[1]).c; ctx.fillRect(cx - pw / 2, top + hh * 0.13 - 6, pw, 4); ctx.fillStyle = INK; ctx.font = FONT(Math.max(7, Math.min(11, Math.round(sw * 0.45)))); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(h.no), cx, top + hh * 0.055); }
    // まえの とびら（ひらくと そとへ）
    for (let i = 0; i < n; i++) {
      const xl = x0 + sw * i + 1.8, w2 = (sw - 3.6) / 2, dy = top + hh * 0.56, dh = hh * 0.42, k = 1 - open;
      for (const side of [0, 1]) { const w = w2 * k, x = side ? xl + sw - 3.6 - w : xl; if (w < 0.5) continue; ctx.fillStyle = "#86CFA0"; ctx.fillRect(x, dy, w, dh); ctx.strokeRect(x, dy, w, dh); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x + w * 0.2, dy + dh * 0.2, w * 0.6, dh * 0.12); }
    }
    ctx.restore();
  };
  // ---- コースの ちず（ひだりまわり。したの ちょくせんが ホームストレッチ・ゴールは みぎより）----
  const lapPoint = (L, p, a) => {
    const rr = (L - 2 * a) / TAU, q = ((p % L) + L) % L;
    if (q < a) return { x: -a / 2 + q, y: rr };
    if (q < a + Math.PI * rr) { const th = Math.PI / 2 - (q - a) / rr; return { x: a / 2 + rr * Math.cos(th), y: rr * Math.sin(th) }; }
    if (q < 2 * a + Math.PI * rr) return { x: a / 2 - (q - a - Math.PI * rr), y: -rr };
    const th = -Math.PI / 2 - (q - 2 * a - Math.PI * rr) / rr; return { x: -a / 2 + rr * Math.cos(th), y: rr * Math.sin(th) };
  };
  const drawMap = (ctx, x, y, w, h, rc, pos, mine = new Set()) => {
    const L = KeibaRace.COURSE.lap[rc.surf] || 2000, a = L * 0.27, rr = (L - 2 * a) / TAU, fin = a * 0.8, k = Math.min((w - 16) / (a + 2 * rr), (h - 14) / (2 * rr)), cx = x + w / 2, cy = y + h / 2;
    ctx.save(); ctx.fillStyle = "rgba(255,253,246,.88)"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; U.rr(ctx, x, y, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 60; i++) { const p = lapPoint(L, (i / 60) * L, a); i ? ctx.lineTo(cx + p.x * k, cy + p.y * k) : ctx.moveTo(cx + p.x * k, cy + p.y * k); } ctx.closePath();
    ctx.strokeStyle = rc.surf === "dirt" ? "#C9976A" : "#7FC067"; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = "rgba(31,29,27,.4)"; ctx.lineWidth = 1; ctx.stroke();
    const f = lapPoint(L, fin, a); ctx.strokeStyle = "#E5483F"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + f.x * k, cy + f.y * k - 5); ctx.lineTo(cx + f.x * k, cy + f.y * k + 5); ctx.stroke();
    const list = pos.map((p) => ({ ...p, h: rc.horses[p.no - 1] })).sort((A, B) => A.s - B.s);
    for (const p of list) { const q = lapPoint(L, fin - (rc.dist - Math.min(rc.dist + 30, p.s)), a), sx = cx + q.x * k + (p.lane - 0.4) * 2.2, sy = cy + q.y * k + (p.lane - 0.4) * 2.2 * (q.y > 0 ? 1 : -1); chip(ctx, sx, sy, mine.has(p.no) ? 4.2 : 3.4, "", p.h.waku, mine.has(p.no)); }
    ctx.restore();
  };

  return { COATS, SILKS, POSES, VB, CLOTH, BOB, SKY, shade, FONT, horseSvg, horseKey, horsePx, horseImg, preload, chip, view, drawView, drawGate, drawMap, lapPoint };
})();
