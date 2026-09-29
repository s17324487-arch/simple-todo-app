// 12F・13F すいぞくかん の 絵（斜め上から。MallArt と おなじ しくみ）。
// 水そうの 面の 中で 寄贈した 魚が およぐ（FishArt の 絵・SvgCache の キーは "aqfish:<魚>:<はば>" だけ）。
// くらげ・トンネル・まるい 水そう・ペンギン・アシカ・ペリカン は canvas で うごかす。
const AquaArt = {
  // 魚の はば（おうちの 単位）。大きい 魚ほど 大きい（見やすい ように ちぢめる）
  fishW(f) { const cm = f ? f.size[1] : 20; return Math.round(U.clamp(14 + Math.sqrt(cm) * 5.2, 16, 118) / 4) * 4; },
  fishSvg: new Map(),
  fishImg(sc, id, w, ensure) {
    const f = typeof Fishing !== "undefined" && Fishing.fish(id); if (!f) return null;
    let m = this.fishSvg.get(id); if (!m) { const svgText = FishArt.svg(f.art, { uid: "aq" + f.id, flip: false }); m = { svgText, vb: (svgText.match(/viewBox="([^"]+)"/) || [0, "0 0 2 1"])[1].split(" ").map(Number) }; this.fishSvg.set(id, m); }
    const svg = () => m.svgText, vb = m.vb;
    const h = Math.max(4, Math.round((w * vb[3]) / vb[2])), k = sc.k, pw = Math.ceil(w * k), ph = Math.ceil(h * k), key = "aqfish:" + f.id + ":" + w;
    if (ensure) return SvgCache.ensure(key, svg, pw, ph);
    const c = SvgCache.get(key, svg, pw, ph); return c ? { c, w, h, noflip: !!f.flip } : null;
  },
  // 面の 座標（u: 面に そって 右へ・v: 上から 下へ。おうちの 単位）
  //   face "y": y = at の 面（+y むき）。u は x の むき（u0 は タイル）
  //   face "x": x = at の 面（+x むき）。u は -y の むき（u0 は 南の はしの y タイル）
  plane(ctx, sc, off, face, at, u0, zTop) {
    const s = sc.s, A = IsoVenue.A, B = IsoVenue.B, o = face === "y" ? sc.toScreen(IsoVenue.p(u0, at, zTop), off) : sc.toScreen(IsoVenue.p(at, u0, zTop), off);
    ctx.translate(o.x, o.y);
    if (face === "y") ctx.transform(A * s, B * s, 0, s, 0, 0); else ctx.transform(A * s, -B * s, 0, s, 0, 0);
  },
  hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; },
  // 水そうの 面の 中で 魚を およがせる。w・h は 水の 四角（おうちの 単位）
  swim(ctx, sc, fish, w, h, seed) {
    const t = G.t, n = fish.length;
    fish.forEach((id, i) => {
      const f = Fishing.fish(id); if (!f) return;
      const fw = Math.min(this.fishW(f), w * 0.46), img = this.fishImg(sc, id, Math.max(8, Math.round(fw / 4) * 4), false); if (!img) return;
      const r = this.hash(seed + id), sp = 0.18 + r * 0.22, lane = (i + 0.5) / n, amp = Math.max(0, (w - img.w) / 2 - 6);
      const ph = t * sp + r * 6.28, x = w / 2 + Math.sin(ph) * amp - img.w / 2, y = U.clamp(h * (0.18 + lane * 0.64) + Math.sin(t * 0.9 + i * 2.1) * 4 - img.h / 2, 2, h - img.h - 6), right = Math.cos(ph) > 0;
      if (right && !img.noflip) { ctx.save(); ctx.translate(x + img.w, y); ctx.scale(-1, 1); ctx.drawImage(img.c, 0, 0, img.w, img.h); ctx.restore(); } else ctx.drawImage(img.c, x, y, img.w, img.h);
    });
  },
  // あわ と 光の ゆらぎ（水の 四角の 中）
  shimmer(ctx, w, h, seed, dark) {
    const t = G.t;
    ctx.save(); ctx.globalAlpha = dark ? 0.25 : 0.4; ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 3; i++) { const x = w * (0.2 + i * 0.3) + Math.sin(t * 0.4 + i + seed) * 20; ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 16, 0); ctx.lineTo(x + 40, h); ctx.lineTo(x + 8, h); ctx.closePath(); ctx.globalAlpha = (dark ? 0.05 : 0.09) + 0.04 * Math.sin(t + i); ctx.fill(); }
    ctx.globalAlpha = dark ? 0.4 : 0.7;
    for (let i = 0; i < 7; i++) { const k = ((t * 0.18 + i * 0.37 + seed * 0.1) % 1), x = w * ((i * 0.137 + seed * 0.07) % 1), y = h - k * h; ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i) * 3, y, 1.6 + (i % 3), 0, 7); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  },
  // くらげ（ふわふわ のぼる・かさが ひらく）
  jelly(ctx, x, y, r, t, col = "rgba(255,214,236,.85)") {
    const pulse = 1 + Math.sin(t * 2.4) * 0.12;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * pulse, r * 0.72 / pulse, 0, Math.PI, 0); ctx.quadraticCurveTo(0, r * 0.3, -r * pulse, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,250,.7)"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.3, r * 0.1); ctx.quadraticCurveTo(i * r * 0.3 + Math.sin(t * 3 + i) * 4, r * 1.1, i * r * 0.28, r * 1.9); ctx.stroke(); }
    ctx.restore();
  },
  // ペンギン（よこむき・およぐ）
  penguin(ctx, x, y, s, flip, flap) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.scale(s, s); ctx.lineWidth = 1.6; ctx.strokeStyle = INK;
    ctx.fillStyle = "#3F4453"; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(2, 4, 16, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#3F4453"; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-12, -10 - flap * 6); ctx.lineTo(4, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#F2C14E"; ctx.beginPath(); ctx.moveTo(-22, -2); ctx.lineTo(-30, 1); ctx.lineTo(-21, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-15, -3, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = "#F4A4A9"; ctx.beginPath(); ctx.moveTo(20, -3); ctx.lineTo(27, -7); ctx.lineTo(27, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // アシカ（よこむき）
  sealion(ctx, x, y, s, flip, t) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2) * 0.08); ctx.lineWidth = 1.6; ctx.strokeStyle = INK;
    ctx.fillStyle = "#9C7A5B"; ctx.beginPath(); ctx.moveTo(-30, -2); ctx.quadraticCurveTo(-18, -14, 6, -10); ctx.quadraticCurveTo(26, -8, 34, 0); ctx.quadraticCurveTo(24, 8, 4, 8); ctx.quadraticCurveTo(-20, 10, -30, -2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(44, -8); ctx.lineTo(42, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-6, 16); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-22, -4, 1.8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-30, -1, 1.4, 0, 7); ctx.fill();
    ctx.restore();
  },
  // ペリカン（たって いる・ときどき くちばしを あげる）
  pelican(ctx, x, y, s, t, seed) {
    const up = Math.max(0, Math.sin(t * 0.8 + seed * 5)) ** 6;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 1.6; ctx.strokeStyle = INK;
    ctx.fillStyle = "#E8C07A"; ctx.fillRect(-6, -2, 3, 16); ctx.fillRect(3, -2, 3, 16);
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(0, -14, 18, 14, -0.2, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -24); ctx.quadraticCurveTo(-14, -44, -4, -50); ctx.lineTo(4, -48); ctx.quadraticCurveTo(-4, -40, 2, -26); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-2, -50); ctx.rotate(-0.3 - up * 0.9); ctx.fillStyle = "#F2A65E"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, 6); ctx.quadraticCurveTo(-16, 16, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-4, -50, 1.6, 0, 7); ctx.fill();
    ctx.restore();
  },
  // なんごくの さかな（まるい 水そうの かざり。FishArt を つかわない ちいさな 絵）
  tropical(ctx, x, y, s, flip, col) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(15, -5); ctx.lineTo(15, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-2, -5.5, 2.5, 11); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-5, -1, 1.2, 0, 7); ctx.fill(); ctx.restore();
  },
};

// ---- 什器の モデル（MallArt.M に たす。原点は 床の かど）----
Object.assign(MallArt.M, {
  // 床に おく 水そう（ガラスの はこ。前の 面は +y）。魚は L で
  islandtank(S, f) {
    let s = S.box(0.05, 0.1, f.w - 0.1, f.h - 0.2, 0, 44, ["#5E6B7A", "#4E5A68", "#414C58"]);
    s += S.poly([[0.12, 0.2, 44], [f.w - 0.12, 0.2, 44], [f.w - 0.12, 0.2, 126], [0.12, 0.2, 126]], "#3E7FA3", 1.2);
    s += S.poly([[0.12, 0.2, 44], [0.12, f.h - 0.2, 44], [0.12, f.h - 0.2, 126], [0.12, 0.2, 126]], "#35708F", 0);
    s += S.poly([[0.14, 0.22, 46], [f.w - 0.14, 0.22, 46], [f.w - 0.14, f.h - 0.22, 46], [0.14, f.h - 0.22, 46]], "#E9D9A8", 0);
    for (let i = 0; i < 4; i++) s += S.at(0.4 + i * (f.w - 0.8) / 3, 0.35 + (i % 2) * 0.3, 48, `<path d="M0,0 q-4,-14 2,-26 q6,12 -2,26" fill="${["#86AE78", "#9DC08B", "#E58C92", "#B8D8A0"][i]}" ${S.st(1)}/>`);
    return s;
  },
  // ひくい 水そう（いその ひろば。上から のぞく）
  lowtank(S, f) {
    let s = S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 0, 40, ["#D9CBB2", "#C4B394", "#AE9C7C"]);
    s += S.poly([[0.2, 0.2, 40.5], [f.w - 0.2, 0.2, 40.5], [f.w - 0.2, f.h - 0.2, 40.5], [0.2, f.h - 0.2, 40.5]], "#6FB5CB", 1.2);
    for (const [x, y, r, c] of [[0.5, 0.5, 0.22, "#9C9A93"], [f.w - 0.6, f.h - 0.5, 0.26, "#8E8B84"], [f.w * 0.5, f.h * 0.35, 0.16, "#A7A49D"]]) s += S.ellipse(x, y, 41, r, c, 1);
    s += S.at(f.w * 0.3, f.h * 0.7, 41, `<path d="${starPath(0, 0, 7, 3)}" fill="#F2A65E" ${S.st(1)}/>`) + S.at(f.w * 0.75, f.h * 0.3, 41, `<circle r="4" fill="#E58C92" ${S.st(1)}/>`);
    return s;
  },
  // かべの ような 水そう（+x むきの 面。くらい へや）
  xtank(S, f) {
    let s = S.box(0.1, 0, 0.8, f.h, 0, 190, ["#4B4656", "#3E3A48", "#5A5566"]);
    s += S.poly([[0.9, 0.12, 30], [0.9, f.h - 0.12, 30], [0.9, f.h - 0.12, 176], [0.9, 0.12, 176]], "#123047", 1.4);
    return s;
  },
  // いきている かせき の 台（まるい ガラス）
  pedestal2(S, f) {
    const cx = f.w / 2, cy = f.h / 2;
    let s = S.cyl(cx, cy, 0.8, 0, 36, ["#5A5566", "#4B4656"]) + S.cyl(cx, cy, 0.7, 36, 90, ["#1C4260AA", "#16384FAA"]);
    s += S.ellipse(cx, cy, 126, 0.7, "#CFE7EC55", 1.2) + S.cyl(cx, cy, 0.74, 126, 8, ["#5A5566", "#4B4656"]);
    return s;
  },
  // くらげの はしら（まるい 水そう・下から あかり）
  jellycol(S, f) {
    const cx = f.w / 2, cy = f.h / 2;
    return S.cyl(cx, cy, 0.62, 0, 30, ["#3F4A5E", "#343E50"]) + S.cyl(cx, cy, 0.55, 30, 140, ["#1B2D4F99", "#16264499"]) + S.cyl(cx, cy, 0.6, 170, 10, ["#3F4A5E", "#343E50"]);
  },
  // まんなかの まるい 水そう（なんごくの うみ）
  roundtank(S, f) {
    const cx = f.w / 2, cy = f.h / 2, R = Math.min(f.w, f.h) / 2 - 0.2;
    let s = S.ellipse(cx, cy, 0, R + 0.2, "#00000018", 0) + S.cyl(cx, cy, R + 0.1, 0, 30, ["#E3D7C2", "#CDBEA4"]);
    s += S.cyl(cx, cy, R, 30, 170, ["#4FA3C4AA", "#3F8FB0AA"]);
    for (let i = 0; i < 7; i++) { const a = i * 0.9, r = R * 0.55; s += S.at(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, 34, `<path d="M0,0 q-6,-12 -2,-22 q4,6 4,12 q4,-8 8,-10 q0,12 -10,20" fill="${["#F4A4A9", "#F7D889", "#C9BCD9", "#F2A65E"][i % 4]}" ${S.st(1)}/>`); }
    s += S.cyl(cx, cy, R + 0.1, 200, 10, ["#E3D7C2", "#CDBEA4"]);
    return s;
  },
  // うみの トンネル（頭の 上の アーチ。よこに はば w、おくゆき h。水の 中を 魚が よこぎる）
  tunnel(S, f) {
    const a = f.w / 2, cx = f.w / 2, b = f.rise || 175, n = 12, pt = (th, y) => [cx + Math.cos(th) * a, y, Math.sin(th) * b];
    let s = "";
    // アーチの おもて（うすい 水の いろ）
    for (let i = 0; i < n; i++) { const t0 = (i / n) * Math.PI, t1 = ((i + 1) / n) * Math.PI; s += S.poly([pt(t0, 0), pt(t1, 0), pt(t1, f.h), pt(t0, f.h)], i % 2 ? "#4FA3C455" : "#3E8FB455", 0.8); }
    // 手前の わく（ガラスの あつみ）と 足もと
    for (let i = 0; i < n; i++) { const t0 = (i / n) * Math.PI, t1 = ((i + 1) / n) * Math.PI; s += S.line([pt(t0, f.h), pt(t1, f.h)], "#5E6B7A", 6) + S.line([pt(t0, 0), pt(t1, 0)], "#5E6B7A", 3); }
    for (const x of [0, f.w]) s += S.box(x - 0.12, 0, 0.24, f.h, 0, 16, ["#6E7C8C", "#5E6B7A", "#4E5A68"]);
    return s;
  },
  // かいだん。のりばは 北がわ（y = 0 の ほう）で、南へ むかって のぼる（dir "down" は 下の 階へ おりる）
  stairs(S, f) {
    let s = "";
    const n = 8, down = f.dir === "down";
    for (let i = 0; i < n; i++) {
      const y0 = f.h * (i / n), z = down ? -(i + 1) * 22 : (i + 1) * 22;
      s += S.box(0.1, y0, f.w - 0.2, f.h / n, down ? z : 0, down ? 22 : z, ["#E3D9C6", "#CBBDA3", "#B5A68A"], 1.1);
    }
    for (const x of [0.1, f.w - 0.1]) s += S.line([[x, 0, 50], [x, f.h, down ? 50 - n * 22 : 50 + n * 22]], "#8D949B", 3);
    return s;
  },
  // チケットの ゲート
  gate(S, f) {
    let s = "";
    for (let i = 0; i < f.w; i += 1) s += S.box(i + 0.35, 0.2, 0.3, f.h - 0.4, 0, 60, ["#E8EDF0", "#C9D2D8", "#B3BDC5"]) + S.poly([[i + 0.37, f.h - 0.2, 44], [i + 0.63, f.h - 0.2, 44], [i + 0.63, f.h - 0.2, 56], [i + 0.37, f.h - 0.2, 56]], i % 2 ? "#7FC6A4" : "#9FD1D9", 1);
    return s;
  },
  // ようこそ カウンター
  welcome(S, f) {
    return S.box(0.05, 0.1, f.w - 0.1, f.h - 0.2, 0, 56, ["#FFF8EA", "#8FCBDA", "#6FB5CB"]) + S.box(0.02, 0.07, f.w - 0.04, f.h - 0.14, 56, 6, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
  },
  // おみやげの たな（ぬいぐるみ・クッキー）
  giftshelf(S, f) {
    let s = S.box(0.05, 0.2, f.w - 0.1, 0.6, 0, 100, ["#E8D6B8", "#C9AE85", "#B39669"]);
    for (const z of [20, 58]) for (let i = 0; i < 4; i++) { const x = 0.3 + i * (f.w - 0.6) / 3; s += S.at(x, 0.8, z + 16, i % 2 ? `<ellipse rx="9" ry="6" fill="${["#8FCBDA", "#F4A4A9"][i % 2 ? 0 : 1]}" ${S.st(1)}/><circle cx="-4" cy="-1" r="1.3" fill="${INK}"/>` : `<ellipse rx="8" ry="10" fill="#3F4453" ${S.st(1)}/><ellipse cy="3" rx="5" ry="6" fill="#FFFFFF"/>`); }
    return s;
  },
  // アシカの リング（頭の 上の ドーナツ）
  aquaring(S, f) {
    // サンシャインアクアリングの ように: 4本の はしらの 上に ドーナツの 水そう（下は 150・上は 210）。まん中の あなから そらが 見える
    const cx = f.w / 2, cy = f.h / 2, Ro = Math.min(f.w, f.h) / 2 - 0.15, Ri = Ro - 0.75, z0 = 150, z1 = 210, T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B;
    const E = (r, z) => { const c = S.P(cx, cy, z); S.P(cx - r, cy + r, z); S.P(cx + r, cy - r, z); S.P(cx + r, cy + r, z); S.P(cx - r, cy - r, z); return { x: c.x, y: c.y, rx: r * T * Math.SQRT2 * A, ry: r * T * Math.SQRT2 * B }; };
    const ring = (e) => `M${f2(e.x - e.rx)},${f2(e.y)} A${f2(e.rx)},${f2(e.ry)} 0 1 0 ${f2(e.x + e.rx)},${f2(e.y)} A${f2(e.rx)},${f2(e.ry)} 0 1 0 ${f2(e.x - e.rx)},${f2(e.y)} Z`;
    // 手前の 半分の おび（sw 0 = 下まわり）・おくの 半分の おび（sw 1 = 上まわり）
    const band = (a, b, sw) => `M${f2(a.x - a.rx)},${f2(a.y)} A${f2(a.rx)},${f2(a.ry)} 0 0 ${sw} ${f2(a.x + a.rx)},${f2(a.y)} L${f2(b.x + b.rx)},${f2(b.y)} A${f2(b.rx)},${f2(b.ry)} 0 0 ${1 - sw} ${f2(b.x - b.rx)},${f2(b.y)} Z`;
    const o0 = E(Ro, z0), o1 = E(Ro, z1), i0 = E(Ri, z0), i1 = E(Ri, z1);
    let s = "";
    // はしら（おくの 2本 → 手前の 2本 は あとで）
    const posts = [0.8, 2.4, 3.9, 5.5].map((a) => [cx + Math.cos(a) * (Ro - 0.38), cy + Math.sin(a) * (Ro - 0.38)]);
    const post = ([x, y]) => S.cyl(x, y, 0.1, 0, z0, ["#A9B3BC", "#8D949B"], 1.2);
    for (const q of posts) if (q[0] + q[1] < cx + cy) s += post(q);
    // あなの むこうの 内がわの かべ（水の いろ）
    s += `<path d="${band(i1, i0, 1)}" fill="#3E8FB4" fill-opacity=".85" ${S.st(1.2)}/>`;
    // 上の 水面（ドーナツ）と なみの ひかり
    s += `<path d="${ring(o1)} ${ring(i1)}" fill="#7FC6DE" fill-opacity=".9" fill-rule="evenodd" ${S.st(1.6)}/>`;
    for (const a of [3.6, 4.3, 5.2]) { const r = (Ro + Ri) / 2, q = S.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z1); s += `<path d="M${f2(q.x - 12)},${f2(q.y)} q6,-3 12,0 t12,0" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`; }
    // 手前の 外がわの かべ（ガラスごしの 水）と した
    s += `<path d="${band(o1, o0, 0)}" fill="#4FA3C4" fill-opacity=".78" ${S.st(1.6)}/>`;
    s += `<path d="M${f2(o0.x - o0.rx * 0.8)},${f2(o0.y + o0.ry * 0.3)} Q${f2(o0.x)},${f2(o0.y + o0.ry * 1.05)} ${f2(o0.x + o0.rx * 0.8)},${f2(o0.y + o0.ry * 0.3)}" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".35"/>`;
    // ふちの 金具
    s += `<path d="M${f2(o1.x - o1.rx)},${f2(o1.y)} A${f2(o1.rx)},${f2(o1.ry)} 0 0 0 ${f2(o1.x + o1.rx)},${f2(o1.y)}" fill="none" stroke="#6E7C8C" stroke-width="4"/>` + `<path d="M${f2(o0.x - o0.rx)},${f2(o0.y)} A${f2(o0.rx)},${f2(o0.ry)} 0 0 0 ${f2(o0.x + o0.rx)},${f2(o0.y)}" fill="none" stroke="#6E7C8C" stroke-width="5"/>`;
    for (const q of posts) if (q[0] + q[1] >= cx + cy) s += post(q);
    return s;
  },
  // ペリカンの いけ
  pond(S, f) {
    return S.ellipse(f.w / 2, f.h / 2, 0, Math.min(f.w, f.h) / 2 - 0.05, "#CDBEA4", 1.4) + S.ellipse(f.w / 2, f.h / 2, 2, Math.min(f.w, f.h) / 2 - 0.3, "#8FCBDA", 1.2);
  },
  // ガラスの しきり（そとの テラスとの さかい）
  glasswall(S, f) {
    return f.w >= f.h ? S.poly([[0, 0.5, 0], [f.w, 0.5, 0], [f.w, 0.5, 220], [0, 0.5, 220]], "#CFE7EC55", 1.2) + S.line([[0, 0.5, 220], [f.w, 0.5, 220]], "#8D949B", 4) : S.poly([[0.5, 0, 0], [0.5, f.h, 0], [0.5, f.h, 220], [0.5, 0, 220]], "#CFE7EC55", 1.2) + S.line([[0.5, 0, 220], [0.5, f.h, 220]], "#8D949B", 4);
  },
});
// 空の テラスの 柵（北・西の そとがわ）
MallArt.M.fence = (S, f) => (f.w >= f.h ? S.poly([[0, 0.5, 0], [f.w, 0.5, 0], [f.w, 0.5, 70], [0, 0.5, 70]], "#CFE7EC66", 1.2) + S.line([[0, 0.5, 72], [f.w, 0.5, 72]], "#8D949B", 4) : S.poly([[0.5, 0, 0], [0.5, f.h, 0], [0.5, f.h, 70], [0.5, 0, 70]], "#CFE7EC66", 1.2) + S.line([[0.5, 0, 72], [0.5, f.h, 72]], "#8D949B", 4));

// ---- うごく ところ ----
Object.assign(MallArt.L, {
  islandtank(ctx, sc, f, off) { AquaArt.tankFish(ctx, sc, f, off, "y", f.y + 0.2, f.x + 0.12, 126, (f.w - 0.24) * IsoVenue.T, 82); },
  lowtank(ctx, sc, f, off) {
    // 上から 見る いけ: 魚は 水面の 上に ちいさく（よこむき）
    const o = IkeAquarium.obj(f.obj); if (!o) return; const fish = o.fish.filter((id) => Museum.gaveFish(id)); if (!fish.length) return;
    ctx.save(); const c = sc.toScreen(IsoVenue.p(f.x + f.w / 2, f.y + f.h / 2, 41), off), s = sc.s; ctx.translate(c.x, c.y); ctx.scale(s, s * 0.7);
    fish.forEach((id, i) => { const img = AquaArt.fishImg(sc, id, 28, false); if (!img) return; const a = G.t * (0.3 + i * 0.07) + i * 1.7, x = Math.cos(a) * (f.w * 14), y = Math.sin(a) * (f.h * 8); ctx.save(); ctx.translate(x, y); if (Math.sin(a) < 0 && !img.noflip) ctx.scale(-1, 1); ctx.drawImage(img.c, -img.w / 2, -img.h / 2, img.w, img.h); ctx.restore(); });
    ctx.restore();
  },
  xtank(ctx, sc, f, off) { AquaArt.tankFish(ctx, sc, f, off, "x", f.x + 0.9, f.y + f.h - 0.12, 176, (f.h - 0.24) * IsoVenue.T, 146, true); },
  pedestal2(ctx, sc, f, off) {
    const o = IkeAquarium.obj(f.obj), have = o && o.fish.filter((id) => Museum.gaveFish(id)); if (!have || !have.length) return;
    const img = AquaArt.fishImg(sc, have[0], 64, false); if (!img) return;
    const c = sc.toScreen(IsoVenue.p(f.x + f.w / 2, f.y + f.h / 2, 80 + Math.sin(G.t) * 4), off), s = sc.s; ctx.drawImage(img.c, c.x - (img.w * s) / 2, c.y - (img.h * s) / 2, img.w * s, img.h * s);
  },
  jellycol(ctx, sc, f, off) {
    const s = sc.s, t = G.t;
    for (let i = 0; i < 4; i++) { const k = ((t * 0.05 + i * 0.25) % 1), c = sc.toScreen(IsoVenue.p(f.x + f.w / 2 + Math.sin(t * 0.5 + i) * 0.18, f.y + f.h / 2, 40 + k * 120), off); ctx.globalAlpha = Math.sin(k * Math.PI); AquaArt.jelly(ctx, c.x, c.y, 8 * s * 2, t + i, ["rgba(255,214,236,.85)", "rgba(214,236,255,.85)", "rgba(255,243,214,.85)"][i % 3]); ctx.globalAlpha = 1; }
  },
  roundtank(ctx, sc, f, off) {
    const s = sc.s, t = G.t, cx = f.x + f.w / 2, cy = f.y + f.h / 2, R = Math.min(f.w, f.h) / 2 - 0.4;
    for (let i = 0; i < 12; i++) { const a = t * (0.25 + (i % 3) * 0.05) + i * 0.52, z = 60 + (i % 5) * 22, q = sc.toScreen(IsoVenue.p(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8, z), off); AquaArt.tropical(ctx, q.x, q.y, s * 1.6, Math.cos(a) < 0, ["#F2A65E", "#F7D889", "#9FD1D9", "#F4A4A9", "#C9BCD9"][i % 5]); }
    const c = sc.toScreen(IsoVenue.p(cx, cy, 200), off); ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.ellipse(c.x - 20 * s, c.y + 60 * s, 16 * s, 70 * s, 0, 0, 7); ctx.fill();
  },
  tunnel(ctx, sc, f, off) {
    // 頭の 上を 魚が よこぎる（アーチの 上を おく → 手前へ）
    const o = IkeAquarium.obj(f.obj), fish = (o && o.fish ? o.fish : IkeAquarium.tunnelFish()).filter((id) => Museum.gaveFish(id)).slice(0, 8), a = f.w / 2, b = f.rise || 175, s = sc.s;
    fish.forEach((id, i) => {
      const img = AquaArt.fishImg(sc, id, 40, false); if (!img) return;
      const k = ((G.t * (0.05 + (i % 3) * 0.015) + i * 0.29) % 1), th = 0.6 + ((i * 0.37) % 1) * 1.9, q = sc.toScreen(IsoVenue.p(f.x + a + Math.cos(th) * a * 0.92, f.y + k * f.h, Math.sin(th) * b * 0.92), off);
      ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * 0.95; ctx.translate(q.x, q.y); ctx.rotate(0.46); ctx.drawImage(img.c, -img.w * s / 2, -img.h * s / 2, img.w * s, img.h * s); ctx.restore();
    });
  },
  aquaring(ctx, sc, f, off) {
    // アシカが ドーナツの 中を ぐるぐる（手前に いる ときは ガラスの 中・おくに いる ときは 水面の した）
    const s = sc.s, t = G.t, cx = f.x + f.w / 2, cy = f.y + f.h / 2, R = Math.min(f.w, f.h) / 2 - 0.15 - 0.375;
    for (let i = 0; i < 2; i++) {
      const a = t * 0.55 + i * Math.PI, q = sc.toScreen(IsoVenue.p(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 176 + Math.sin(t * 1.3 + i) * 8), off), front = Math.sin(a) + Math.cos(a) > 0;
      ctx.save(); ctx.globalAlpha = front ? 0.85 : 0.55; AquaArt.sealion(ctx, q.x, q.y, s * 1.15, Math.cos(a) - Math.sin(a) > 0, t + i); ctx.restore();
    }
  },
  pond(ctx, sc, f, off) {
    const s = sc.s, t = G.t;
    for (let i = 0; i < 3; i++) { const q = sc.toScreen(IsoVenue.p(f.x + 0.8 + i * (f.w - 1.6) / 2, f.y + f.h * (0.4 + (i % 2) * 0.25), 2), off); AquaArt.pelican(ctx, q.x, q.y, s * 1.5, t, i); }
  },
});
AquaArt.tankFish = function (ctx, sc, f, off, face, at, u0, zTop, w, h, dark) {
  const o = IkeAquarium.obj(f.obj); if (!o) return; const fish = o.fish.filter((id) => Museum.gaveFish(id));
  ctx.save(); this.plane(ctx, sc, off, face, at, u0, zTop); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  this.shimmer(ctx, w, h, f.x + f.y, dark); this.swim(ctx, sc, fish, w, h, f.obj); ctx.restore();
};

// ---- 奥の かべの 水そう（静止画の 部分）: MallArt.wallPart に たす ----
(() => {
  const was = MallArt.wallPart.bind(MallArt);
  MallArt.wallPart = function (p, H, r, side) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, R = (x, y, ww, hh, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(ww)}" height="${f2(hh)}" fill="${fill}" stroke="${INK}" stroke-width="1.6" ${extra}/>`;
    const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${/stroke=/.test(extra.replace(/stroke-/g, "")) ? "" : ` stroke="${INK}"`}${/stroke-width/.test(extra) ? "" : ` stroke-width="1.3"`} stroke-linejoin="round" ${extra}/>`;
    let s = "";
    if (p.kind === "tank") {
      // 大きな まど（ふち・水・すな・いわ・水草）。魚と ひかりは AquaArt.wallTanks
      const z0 = 24, z1 = 250, st = p.style, water = st === "sea" ? ["#2F7FA8", "#65B7D6"] : st === "falls" ? ["#3C8BA0", "#86CBD8"] : st === "rock" ? ["#3E7B8C", "#7FBFCB"] : ["#3F8F9E", "#8ACFD4"], gid = "aqw" + r.id + side + p.from;
      s += R(u0 + 4, V(z1 + 10), w - 8, z1 - z0 + 20, "#3E4A56", `rx="6"`);
      s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${water[1]}"/><stop offset="1" stop-color="${water[0]}"/></linearGradient></defs>` + `<rect x="${f2(u0 + 12)}" y="${f2(V(z1))}" width="${f2(w - 24)}" height="${f2(z1 - z0)}" fill="url(#${gid})"/>`;
      s += P(`M${f2(u0 + 12)},${f2(V(z0))} ` + Array.from({ length: 9 }, (_, i) => `Q${f2(u0 + 12 + (w - 24) * (i + 0.5) / 9)},${f2(V(z0 + 18 + (i % 3) * 6))} ${f2(u0 + 12 + (w - 24) * (i + 1) / 9)},${f2(V(z0 + 8))}`).join(" ") + ` V${f2(V(z0))} Z`, st === "sea" ? "#E6D3A3" : "#B9AE8E", `stroke-width="1"`);
      for (let i = 0; i < Math.max(3, Math.floor(w / 70)); i++) { const x = u0 + 30 + ((i * 97) % (w - 60)), k = (i * 37) % 3; s += st === "sea" ? P(`M${f2(x)},${f2(V(z0 + 6))} q-8,-40 4,-70 q10,30 -4,70`, ["#F4A4A9", "#F2A65E", "#C9BCD9"][k]) + P(`M${f2(x + 16)},${f2(V(z0 + 6))} q12,-26 4,-44`, "none", `stroke="#86AE78" stroke-width="4"`) : P(`M${f2(x)},${f2(V(z0 + 4))} q-10,-50 2,-90 q6,40 -2,90`, ["#86AE78", "#9DC08B", "#6F9468"][k]) + `<ellipse cx="${f2(x + 24)}" cy="${f2(V(z0 + 10))}" rx="${16 + k * 6}" ry="${10 + k * 3}" fill="#8E8B84" stroke="${INK}" stroke-width="1.2"/>`; }
      if (st === "falls") s += `<rect x="${f2(u0 + w * 0.62)}" y="${f2(V(z1))}" width="${f2(w * 0.16)}" height="${f2(z1 - z0 - 20)}" fill="#E8F6F9" opacity=".75"/>` + P(`M${f2(u0 + 12)},${f2(V(z1 - 30))} L${f2(u0 + w * 0.62)},${f2(V(z1 - 40))} L${f2(u0 + w * 0.62)},${f2(V(z1))} L${f2(u0 + 12)},${f2(V(z1))} Z`, "#8E8B84");
      s += R(u0 + w / 2 - 70, V(z0 - 2), 140, 18, "#FFF8EA", `rx="4"`);
    } else if (p.kind === "jellywall") {
      const z0 = 30, z1 = 250, gid = "aqj" + r.id + side + p.from;
      s += R(u0 + 4, V(z1 + 10), w - 8, z1 - z0 + 20, "#262B3B", `rx="8"`) + `<defs><radialGradient id="${gid}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2E4C8C"/><stop offset="1" stop-color="#141B33"/></radialGradient></defs><rect x="${f2(u0 + 12)}" y="${f2(V(z1))}" width="${f2(w - 24)}" height="${f2(z1 - z0)}" rx="4" fill="url(#${gid})"/>` + R(u0 + w / 2 - 70, V(z0 - 2), 140, 18, "#FFF8EA", `rx="4"`);
    } else if (p.kind === "mural") {
      if (p.style === "shore") s += `<rect x="${f2(u0)}" y="${f2(V(250))}" width="${f2(w)}" height="238" fill="#CFE9F1"/>` + P(`M${f2(u0)},${f2(V(80))} Q${f2(u0 + w * 0.3)},${f2(V(120))} ${f2(u0 + w * 0.6)},${f2(V(90))} T${f2(u0 + w)},${f2(V(100))} V${f2(V(12))} H${f2(u0)} Z`, "#A7B8C0") + P(`M${f2(u0 + 10)},${f2(V(60))} q20,-30 50,-6 q30,-26 60,2 v${f2(48)} h-110 Z`, "#8E8B84") + `<circle cx="${f2(u0 + w * 0.7)}" cy="${f2(V(200))}" r="18" fill="#FFF3C9" stroke="${INK}" stroke-width="1.3"/>`;
      else s += `<rect x="${f2(u0 + 6)}" y="${f2(V(230))}" width="${f2(w - 12)}" height="190" rx="10" fill="#D9F0F6" stroke="${INK}" stroke-width="1.6"/>` + Array.from({ length: 5 }, (_, i) => `<path d="M${f2(u0 + 30 + i * (w - 60) / 4)},${f2(V(120 + (i % 2) * 30))} q14,-10 28,0 q-14,10 -28,0 Z" fill="${["#F2A65E", "#8FCBDA", "#F4A4A9", "#F7D889", "#B8D8A0"][i]}" stroke="${INK}" stroke-width="1.2"/>`).join("") + `<rect x="${f2(u0 + w / 2 - 90)}" y="${f2(V(214))}" width="180" height="30" rx="6" fill="#FFF8EA" stroke="${INK}" stroke-width="1.4"/>`;
    } else if (p.kind === "sky") {
      // そら・まちの ビル・テラスの さく（かべの かわり）
      const gid = "aqs" + r.id + side + p.from;
      s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FCDEF"/><stop offset="1" stop-color="#E4F4FA"/></linearGradient></defs><rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="url(#${gid})"/>`;
      for (let i = 0, x = u0; x < u0 + w; i++) { const bw = 30 + (i * 53) % 40, bh = 60 + (i * 71) % 110; s += `<rect x="${f2(x)}" y="${f2(V(bh))}" width="${bw}" height="${bh}" fill="${["#B7C7D6", "#A9BBCB", "#C3D0DC"][i % 3]}" stroke="#8FA3B5" stroke-width="1"/>` + Array.from({ length: Math.floor(bh / 18) }, (_, k) => `<rect x="${f2(x + 5)}" y="${f2(V(bh) + 6 + k * 18)}" width="${bw - 10}" height="6" fill="#E3EDF4"/>`).join(""); x += bw + 4; }
      for (let i = 0; i < 3; i++) s += `<ellipse cx="${f2(u0 + w * (0.2 + i * 0.3))}" cy="${f2(40 + (i % 2) * 30)}" rx="34" ry="12" fill="#FFFFFF" opacity=".9"/>`;
      s += `<rect x="${f2(u0)}" y="${f2(V(80))}" width="${f2(w)}" height="68" fill="#CFE7EC" opacity=".55"/><path d="M${f2(u0)},${f2(V(80))} H${f2(u0 + w)}" stroke="#8D949B" stroke-width="5"/>`;
    } else if (p.kind === "penguintank") {
      // てんくうの ペンギン: そらと ビルの まえに うかぶ 水そう
      s += this.wallPart({ ...p, kind: "sky" }, H, r, side);
      const gid = "aqp" + r.id + side + p.from;
      s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD8EE" stop-opacity=".85"/><stop offset="1" stop-color="#4FA3C4" stop-opacity=".9"/></linearGradient></defs>` + `<rect x="${f2(u0 + 10)}" y="${f2(V(270))}" width="${f2(w - 20)}" height="200" rx="10" fill="url(#${gid})" stroke="${INK}" stroke-width="2"/>` + `<rect x="${f2(u0 + 10)}" y="${f2(V(78))}" width="${f2(w - 20)}" height="12" fill="#6E7C8C" stroke="${INK}" stroke-width="1.4"/>` + R(u0 + w / 2 - 80, V(64), 160, 18, "#FFF8EA", `rx="4"`);
    } else return was(p, H, r, side);
    return s;
  };
  const wasText = MallArt.wallText.bind(MallArt);
  MallArt.wallText = function (g, p, H) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z;
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 13px 'M PLUS Rounded 1c', sans-serif`;
    if (p.kind === "tank") g.fillText(p.label || "", u0 + w / 2, V(22) + 9, 132);
    else if (p.kind === "jellywall") g.fillText(p.label || "", u0 + w / 2, V(28) + 9, 132);
    else if (p.kind === "penguintank") g.fillText(p.label || "", u0 + w / 2, V(62) + 9, 152);
    else if (p.kind === "mural" && p.style === "welcome") { g.font = `900 15px 'M PLUS Rounded 1c', sans-serif`; g.fillText("ようこそ すいぞくかんへ", u0 + w / 2, V(199), w - 30); }
    else { g.textBaseline = "alphabetic"; return wasText(g, p, H); }
    g.textBaseline = "alphabetic";
  };
  // ---- 奥の かべの 水そう（うごく 部分）: 魚・ひかり・くらげ・ペンギン・たき ----
  const wasUnder = MallArt.under.bind(MallArt);
  MallArt.under = function (ctx, sc, r, floor, off) {
    wasUnder(ctx, sc, r, floor, off);
    if (!r.aqua) return;
    const H = r.wallH || 300, T = IsoVenue.T;
    for (const side of ["north", "west"]) for (const p of (r.walls && r.walls[side]) || []) {
      const q = side === "west" ? MallArt.flipPart(p, r) : p, u0 = q.from * T, w = (q.to - q.from) * T;
      if (!["tank", "jellywall", "penguintank"].includes(p.kind)) continue;
      ctx.save();
      // 北の かべは face "y"（y=0）、西の かべは face "x"（x=0。u は 南の はしから）
      if (side === "north") AquaArt.plane(ctx, sc, off, "y", 0, p.from, H); else AquaArt.plane(ctx, sc, off, "x", 0, r.h - q.from, H);
      if (p.kind === "tank") {
        const z0 = 24, z1 = 250; ctx.translate(12, H - z1); ctx.beginPath(); ctx.rect(0, 0, w - 24, z1 - z0); ctx.clip();
        AquaArt.shimmer(ctx, w - 24, z1 - z0, p.from, false);
        const o = IkeAquarium.obj(p.obj); if (o) AquaArt.swim(ctx, sc, o.fish.filter((id) => Museum.gaveFish(id)), w - 24, z1 - z0 - 30, p.obj);
        if (p.style === "falls") { ctx.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 8; i++) { const x = (w - 24) * 0.62 + (i % 4) * (w * 0.04), y = ((G.t * 90 + i * 37) % (z1 - z0)); ctx.fillRect(x, y, 3, 14); } }
      } else if (p.kind === "jellywall") {
        const z0 = 30, z1 = 250; ctx.translate(12, H - z1); ctx.beginPath(); ctx.rect(0, 0, w - 24, z1 - z0); ctx.clip();
        for (let i = 0; i < 16; i++) { const k = ((G.t * (0.03 + (i % 4) * 0.008) + i * 0.137) % 1), x = ((i * 83) % (w - 60)) + 30 + Math.sin(G.t * 0.4 + i) * 12, y = (z1 - z0) * (1.05 - k * 1.1); AquaArt.jelly(ctx, x, y, 9 + (i % 4) * 4, G.t + i, ["rgba(255,214,236,.8)", "rgba(214,236,255,.8)", "rgba(255,243,214,.8)", "rgba(226,214,255,.8)"][i % 4]); }
      } else {
        const top = H - 270; ctx.translate(10, top); ctx.beginPath(); ctx.rect(0, 0, w - 20, 190); ctx.clip();
        for (let i = 0; i < 6; i++) { const a = G.t * (0.35 + i * 0.05) + i * 1.3, x = (w - 20) / 2 + Math.sin(a) * ((w - 90) / 2), y = 40 + (i % 3) * 45 + Math.sin(a * 2) * 10; AquaArt.penguin(ctx, x, y, 1.1, Math.cos(a) > 0, Math.sin(G.t * 8 + i) * 0.5 + 0.5); }
        AquaArt.shimmer(ctx, w - 20, 190, 7, false);
      }
      ctx.restore();
    }
  };
  // 12F・13F の たび: 案内・水そうを しらべる・かんちょう
  const wasTick = MallArt.tick.bind(MallArt), wasInteract = MallArt.interact.bind(MallArt);
  MallArt.tick = function (sc, dt) { wasTick(sc, dt); if (typeof IkeAquarium !== "undefined") IkeAquarium.tick(sc); };
  MallArt.interact = async function (sc, f) { if (typeof IkeAquarium !== "undefined" && sc.room.aqua && (await IkeAquarium.interact(sc, f))) return true; return wasInteract(sc, f); };
})();
