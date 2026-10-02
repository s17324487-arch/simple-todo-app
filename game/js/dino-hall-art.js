// UI-42: きょうりゅう はくぶつかん の 絵（斜め上から。MallArt と おなじ しくみ・館は js/dino-museum.js）。
// 什器は 種類ごとの SVG（キーは 種類・大きさ・variant・dino だけ → 有限）。うごく ところ（ほねの 台の ほね・ロボット・つるした ほね・ちきゅう・かざん・けんきゅうしつ など）は canvas で 描く。
// ほねの 台の ほねは FossilArt.svg（寄贈した 部品は ほねの いろ・まだの 部品は 点線の かげ）を 台の 上の たての 面（x に そった 面）に 描く。キーは "dinoskel:" + 恐竜 + ":" + 寄贈の ビット + ":" + はば。
// 展示の 説明の 絵（iconSvg）も ここ。かせき・いきもの・どうぐ 30しゅ。
const DinoHallArt = (() => {
  const art = Object.create(MallArt);
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const BONE = "#EFE2C2", BONE2 = "#D9C7A0", WOOD = ["#C99D6B", "#AD8255", "#956D45"], DARKWOOD = ["#8E6A4A", "#765639", "#63472E"], STONE = ["#D8CBB4", "#BFAE92", "#A99677"], GLASS = "#CFE7EC66", METAL = ["#C9CED3", "#AEB5BC", "#959DA5"];
  // じだいの いろ（台の おび・かんばん）
  const ERA = { jura: "#8FBF6A", kreta: "#E2A15A", japan: "#E58C92" }, eraOf = (id) => (id === "fukui" ? "japan" : ["brachio", "stego", "compso"].includes(id) ? "jura" : "kreta");
  // x の 面（+x むき）の 文字。みなみ（ひだり した）から きた（みぎ うえ）へ よめる むき（MallArt.planeText の "x" は うらがえし）
  const textX = (ctx, sc, off, x, y, z, text, size, width, col = INK) => {
    const q = sc.toScreen(IsoVenue.p(x, y, z), off), s = sc.s;
    ctx.save(); ctx.translate(q.x, q.y); ctx.transform(IsoVenue.A * s, -IsoVenue.B * s, 0, s, 0, 0);
    ctx.font = `900 ${size}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.fillText(text, 0, 0, width); ctx.restore();
  };
  const img = (svg, x, y, w, h) => `<image href="${U.svgUrl(svg)}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet"/>`;

  // ---- 説明の 絵（2D。原点が まんなか・はば やく 2r）----
  const ICON = {
    ammonite: (r) => { let s = `<circle r="${r}" fill="#D9B98E" ${st(2)}/>`; for (let i = 0; i < 5; i++) { const rr = r * (0.82 - i * 0.16); s += `<path d="M${f2(rr)},0 A${f2(rr)},${f2(rr)} 0 1 1 ${f2(-rr * 0.2)},${f2(-rr * 0.98)}" fill="none" stroke="#9C7A52" stroke-width="2"/>`; } for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; s += `<path d="M${f2(Math.cos(a) * r * 0.62)},${f2(Math.sin(a) * r * 0.62)} L${f2(Math.cos(a) * r * 0.97)},${f2(Math.sin(a) * r * 0.97)}" stroke="#B79067" stroke-width="2"/>`; } return s + `<circle r="${f2(r * 0.12)}" fill="#9C7A52"/>`; },
    trilobite: (r) => { let s = `<path d="M0,${f2(-r)} C${f2(r * 0.75)},${f2(-r)} ${f2(r * 0.85)},${f2(-r * 0.2)} ${f2(r * 0.55)},${f2(r * 0.9)} L0,${f2(r * 1.05)} L${f2(-r * 0.55)},${f2(r * 0.9)} C${f2(-r * 0.85)},${f2(-r * 0.2)} ${f2(-r * 0.75)},${f2(-r)} 0,${f2(-r)} Z" fill="#B7A68C" ${st(2)}/>`; s += `<path d="M${f2(-r * 0.75)},${f2(-r * 0.35)} Q0,${f2(-r * 0.75)} ${f2(r * 0.75)},${f2(-r * 0.35)}" fill="none" ${st(1.6)}/>`; for (let i = 0; i < 6; i++) { const y = -r * 0.2 + i * r * 0.18; s += `<path d="M${f2(-r * 0.62 + i * 0.05 * r)},${f2(y)} Q0,${f2(y + r * 0.08)} ${f2(r * 0.62 - i * 0.05 * r)},${f2(y)}" fill="none" stroke="#7E6E58" stroke-width="1.6"/>`; } return s + `<path d="M${f2(-r * 0.18)},${f2(-r * 0.75)} L${f2(-r * 0.15)},${f2(r * 0.95)} M${f2(r * 0.18)},${f2(-r * 0.75)} L${f2(r * 0.15)},${f2(r * 0.95)}" stroke="#7E6E58" stroke-width="1.6"/><circle cx="${f2(-r * 0.35)}" cy="${f2(-r * 0.55)}" r="${f2(r * 0.09)}" fill="${INK}"/><circle cx="${f2(r * 0.35)}" cy="${f2(-r * 0.55)}" r="${f2(r * 0.09)}" fill="${INK}"/>`; },
    fishfossil: (r) => { let s = `<path d="M${f2(-r)},0 Q${f2(-r * 0.4)},${f2(-r * 0.55)} ${f2(r * 0.55)},0 Q${f2(-r * 0.4)},${f2(r * 0.55)} ${f2(-r)},0 Z" fill="#C9B79B" ${st(1.8)}/><path d="M${f2(r * 0.5)},0 L${f2(r)},${f2(-r * 0.4)} L${f2(r)},${f2(r * 0.4)} Z" fill="#C9B79B" ${st(1.8)}/>`; s += `<path d="M${f2(-r * 0.75)},0 L${f2(r * 0.55)},0" stroke="#8C7A62" stroke-width="2.2"/>`; for (let i = 0; i < 8; i++) { const x = -r * 0.55 + i * r * 0.14; s += `<path d="M${f2(x)},${f2(-r * 0.3)} L${f2(x + r * 0.05)},${f2(r * 0.3)}" stroke="#8C7A62" stroke-width="1.4"/>`; } return s + `<circle cx="${f2(-r * 0.72)}" cy="${f2(-r * 0.06)}" r="${f2(r * 0.07)}" fill="${INK}"/>`; },
    kabutogani: (r) => `<path d="M${f2(-r)},${f2(r * 0.15)} Q${f2(-r)},${f2(-r * 0.8)} 0,${f2(-r * 0.8)} Q${f2(r)},${f2(-r * 0.8)} ${f2(r)},${f2(r * 0.15)} Q0,${f2(r * 0.05)} ${f2(-r)},${f2(r * 0.15)} Z" fill="#9C8A6E" ${st(2)}/><path d="M${f2(-r * 0.5)},${f2(r * 0.1)} L${f2(-r * 0.4)},${f2(r * 0.7)} L${f2(r * 0.4)},${f2(r * 0.7)} L${f2(r * 0.5)},${f2(r * 0.1)} Z" fill="#8C7A60" ${st(1.8)}/><path d="M0,${f2(r * 0.7)} L0,${f2(r * 1.25)}" ${st(2.4)}/><path d="M${f2(-r * 0.5)},${f2(-r * 0.25)} Q0,${f2(-r * 0.5)} ${f2(r * 0.5)},${f2(-r * 0.25)}" fill="none" stroke="#6E5E48" stroke-width="1.6"/><circle cx="${f2(-r * 0.32)}" cy="${f2(-r * 0.42)}" r="${f2(r * 0.07)}" fill="${INK}"/><circle cx="${f2(r * 0.32)}" cy="${f2(-r * 0.42)}" r="${f2(r * 0.07)}" fill="${INK}"/>`,
    gyoryu: (r) => { let s = `<path d="M${f2(-r * 1.2)},0 L${f2(-r * 0.7)},${f2(-r * 0.12)} Q${f2(-r * 0.2)},${f2(-r * 0.45)} ${f2(r * 0.5)},${f2(-r * 0.15)} L${f2(r * 0.95)},${f2(-r * 0.55)} L${f2(r * 0.85)},${f2(0)} L${f2(r * 1.05)},${f2(r * 0.45)} L${f2(r * 0.5)},${f2(r * 0.12)} Q${f2(-r * 0.2)},${f2(r * 0.35)} ${f2(-r * 0.7)},${f2(r * 0.1)} Z" fill="#CBB998" ${st(2)}/>`; s += `<path d="M${f2(-r * 0.7)},0 L${f2(r * 0.6)},0" stroke="#8C7A62" stroke-width="2.4"/>`; for (let i = 0; i < 9; i++) { const x = -r * 0.5 + i * r * 0.12; s += `<path d="M${f2(x)},${f2(-r * 0.2)} L${f2(x)},${f2(r * 0.2)}" stroke="#8C7A62" stroke-width="1.5"/>`; } for (const [x, y] of [[-r * 0.3, r * 0.35], [r * 0.25, r * 0.3]]) s += `<path d="M${f2(x)},${f2(y - r * 0.1)} q${f2(r * 0.1)},${f2(r * 0.3)} ${f2(-r * 0.15)},${f2(r * 0.35)}" fill="#CBB998" ${st(1.6)}/>`; return s + `<circle cx="${f2(-r * 0.85)}" cy="${f2(-r * 0.04)}" r="${f2(r * 0.08)}" fill="#FFF8EA" ${st(1.2)}/>`; },
    shida: (r) => { let s = `<path d="M0,${f2(r)} Q${f2(r * 0.1)},0 ${f2(-r * 0.15)},${f2(-r)}" fill="none" stroke="#6E8F4E" stroke-width="2.6"/>`; for (let i = 0; i < 9; i++) { const t = i / 9, y = r * 0.85 - t * r * 1.75, x = r * 0.08 - t * r * 0.2, L = r * (0.75 - t * 0.55); s += `<path d="M${f2(x)},${f2(y)} q${f2(L * 0.6)},${f2(-L * 0.35)} ${f2(L)},${f2(-L * 0.1)} q${f2(-L * 0.4)},${f2(L * 0.25)} ${f2(-L)},${f2(L * 0.1)} Z" fill="#9DC08B" ${st(1.2)}/><path d="M${f2(x)},${f2(y)} q${f2(-L * 0.6)},${f2(-L * 0.35)} ${f2(-L)},${f2(-L * 0.1)} q${f2(L * 0.4)},${f2(L * 0.25)} ${f2(L)},${f2(L * 0.1)} Z" fill="#86AE78" ${st(1.2)}/>`; } return s; },
    footprint: (r) => `<path d="M0,${f2(r * 0.7)} C${f2(-r * 0.45)},${f2(r * 0.6)} ${f2(-r * 0.4)},${f2(r * 0.05)} ${f2(-r * 0.2)},${f2(-r * 0.05)} L${f2(-r * 0.55)},${f2(-r * 0.75)} Q${f2(-r * 0.45)},${f2(-r * 0.9)} ${f2(-r * 0.3)},${f2(-r * 0.75)} L${f2(-r * 0.05)},${f2(-r * 0.25)} L0,${f2(-r * 1.0)} Q${f2(r * 0.12)},${f2(-r * 1.1)} ${f2(r * 0.2)},${f2(-r * 0.95)} L${f2(r * 0.12)},${f2(-r * 0.25)} L${f2(r * 0.45)},${f2(-r * 0.7)} Q${f2(r * 0.62)},${f2(-r * 0.8)} ${f2(r * 0.6)},${f2(-r * 0.55)} L${f2(r * 0.25)},${f2(-r * 0.02)} C${f2(r * 0.42)},${f2(r * 0.1)} ${f2(r * 0.4)},${f2(r * 0.62)} 0,${f2(r * 0.7)} Z" fill="#9C8A6E" ${st(2)}/>`,
    amber: (r) => `<path d="M0,${f2(-r)} C${f2(r * 0.8)},${f2(-r * 0.6)} ${f2(r * 0.95)},${f2(r * 0.5)} 0,${f2(r * 0.9)} C${f2(-r * 0.95)},${f2(r * 0.5)} ${f2(-r * 0.8)},${f2(-r * 0.6)} 0,${f2(-r)} Z" fill="#F2B347" ${st(2)}/><path d="M${f2(-r * 0.35)},${f2(-r * 0.45)} q${f2(r * 0.2)},${f2(-r * 0.2)} ${f2(r * 0.35)},${f2(-r * 0.1)}" stroke="#FFF3C4" stroke-width="3" fill="none"/><ellipse cx="${f2(r * 0.05)}" cy="${f2(r * 0.15)}" rx="${f2(r * 0.18)}" ry="${f2(r * 0.1)}" fill="#7A5A2E"/><path d="M${f2(-r * 0.1)},${f2(r * 0.1)} l${f2(-r * 0.2)},${f2(-r * 0.18)} M${f2(r * 0.15)},${f2(r * 0.1)} l${f2(r * 0.22)},${f2(-r * 0.18)}" stroke="#7A5A2E" stroke-width="1.6"/>`,
    tooth: (r) => `<path d="M${f2(-r * 0.35)},${f2(-r)} Q${f2(r * 0.1)},${f2(-r * 1.05)} ${f2(r * 0.4)},${f2(-r * 0.95)} Q${f2(r * 0.45)},${f2(r * 0.2)} ${f2(-r * 0.05)},${f2(r)} Q${f2(-r * 0.5)},${f2(r * 0.1)} ${f2(-r * 0.35)},${f2(-r)} Z" fill="#F4ECD8" ${st(2)}/><path d="M${f2(r * 0.38)},${f2(-r * 0.5)} l${f2(-r * 0.08)},${f2(r * 0.08)} l${f2(r * 0.07)},${f2(r * 0.08)} l${f2(-r * 0.08)},${f2(r * 0.08)} l${f2(r * 0.06)},${f2(r * 0.08)} l${f2(-r * 0.08)},${f2(r * 0.08)}" fill="none" stroke="#B9A582" stroke-width="1.4"/><path d="M${f2(-r * 0.1)},${f2(-r * 0.75)} q${f2(-r * 0.1)},${f2(r * 0.6)} ${f2(r * 0.02)},${f2(r * 1.2)}" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".7"/>`,
    umiyuri: (r) => { let s = `<path d="M0,${f2(r)} Q${f2(r * 0.15)},${f2(r * 0.2)} 0,${f2(-r * 0.25)}" fill="none" stroke="#8C7A62" stroke-width="3"/>`; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; s += `<path d="M0,${f2(-r * 0.25)} Q${f2(Math.cos(a) * r * 0.5)},${f2(-r * 0.35 + Math.sin(a) * r * 0.5)} ${f2(Math.cos(a) * r * 0.85)},${f2(-r * 0.3 + Math.sin(a) * r * 0.75)}" fill="none" stroke="#B79067" stroke-width="2.2"/>`; } return s + `<ellipse cy="${f2(-r * 0.25)}" rx="${f2(r * 0.18)}" ry="${f2(r * 0.12)}" fill="#C9AE85" ${st(1.4)}/>`; },
    coprolite: (r) => `<path d="M${f2(-r * 0.9)},${f2(r * 0.4)} Q${f2(-r * 1.0)},${f2(-r * 0.1)} ${f2(-r * 0.45)},${f2(-r * 0.2)} Q${f2(-r * 0.4)},${f2(-r * 0.7)} ${f2(r * 0.05)},${f2(-r * 0.6)} Q${f2(r * 0.4)},${f2(-r * 0.95)} ${f2(r * 0.55)},${f2(-r * 0.45)} Q${f2(r * 1.0)},${f2(-r * 0.25)} ${f2(r * 0.85)},${f2(r * 0.35)} Q${f2(r * 0.2)},${f2(r * 0.7)} ${f2(-r * 0.9)},${f2(r * 0.4)} Z" fill="#9C7A5A" ${st(2)}/><path d="M${f2(-r * 0.5)},${f2(r * 0.05)} q${f2(r * 0.4)},${f2(-r * 0.15)} ${f2(r * 0.8)},${f2(0)}" fill="none" stroke="#7A5A3E" stroke-width="1.8"/><circle cx="${f2(r * 0.2)}" cy="${f2(-r * 0.3)}" r="${f2(r * 0.06)}" fill="#D9C7A0"/>`,
    stromatolite: (r) => { let s = ""; for (let i = 0; i < 6; i++) { const y = r * 0.7 - i * r * 0.26, w = r * (1 - i * 0.1); s += `<path d="M${f2(-w)},${f2(y)} Q${f2(-w * 0.5)},${f2(y - r * 0.35)} 0,${f2(y - r * 0.12)} Q${f2(w * 0.5)},${f2(y - r * 0.38)} ${f2(w)},${f2(y)}" fill="none" stroke="${["#8C7A62", "#A88E6A", "#7E9A6E", "#A88E6A", "#8C7A62", "#7E9A6E"][i]}" stroke-width="3"/>`; } return `<path d="M${f2(-r)},${f2(r * 0.8)} L${f2(-r)},${f2(-r * 0.2)} Q0,${f2(-r * 1.1)} ${f2(r)},${f2(-r * 0.2)} L${f2(r)},${f2(r * 0.8)} Z" fill="#D8CBB4" ${st(2)}/>` + s; },
    anomalocaris: (r) => { let s = `<ellipse rx="${f2(r * 0.95)}" ry="${f2(r * 0.32)}" fill="#E58C92" ${st(2)}/>`; for (let i = 0; i < 6; i++) { const x = -r * 0.55 + i * r * 0.22; s += `<path d="M${f2(x)},${f2(-r * 0.25)} q${f2(r * 0.12)},${f2(-r * 0.3)} ${f2(r * 0.22)},${f2(-r * 0.05)} M${f2(x)},${f2(r * 0.25)} q${f2(r * 0.12)},${f2(r * 0.3)} ${f2(r * 0.22)},${f2(r * 0.05)}" fill="#F4A4A9" ${st(1.4)}/>`; } s += `<path d="M${f2(-r * 0.85)},${f2(-r * 0.1)} q${f2(-r * 0.35)},${f2(r * 0.05)} ${f2(-r * 0.3)},${f2(r * 0.45)} M${f2(-r * 0.85)},${f2(r * 0.1)} q${f2(-r * 0.25)},${f2(r * 0.2)} ${f2(-r * 0.1)},${f2(r * 0.5)}" fill="none" ${st(2.4)}/>`; return s + `<path d="M${f2(r * 0.9)},0 l${f2(r * 0.25)},${f2(-r * 0.22)} l0,${f2(r * 0.44)} Z" fill="#F4A4A9" ${st(1.4)}/><circle cx="${f2(-r * 0.62)}" cy="${f2(-r * 0.28)}" r="${f2(r * 0.12)}" fill="#FFF8EA" ${st(1.4)}/><circle cx="${f2(-r * 0.62)}" cy="${f2(-r * 0.28)}" r="${f2(r * 0.05)}" fill="${INK}"/>`; },
    dunkle: (r) => `<path d="M${f2(-r)},${f2(-r * 0.1)} Q${f2(-r * 0.95)},${f2(-r * 0.6)} ${f2(-r * 0.3)},${f2(-r * 0.55)} Q${f2(r * 0.4)},${f2(-r * 0.45)} ${f2(r * 0.8)},${f2(-r * 0.1)} L${f2(r * 1.15)},${f2(-r * 0.45)} L${f2(r * 1.05)},${f2(r * 0.05)} L${f2(r * 1.15)},${f2(r * 0.4)} L${f2(r * 0.75)},${f2(r * 0.18)} Q${f2(0)},${f2(r * 0.45)} ${f2(-r * 0.6)},${f2(r * 0.3)} Q${f2(-r * 1.0)},${f2(r * 0.25)} ${f2(-r)},${f2(-r * 0.1)} Z" fill="#8FA3B5" ${st(2)}/><path d="M${f2(-r)},${f2(-r * 0.1)} Q${f2(-r * 0.95)},${f2(-r * 0.6)} ${f2(-r * 0.3)},${f2(-r * 0.55)} L${f2(-r * 0.2)},${f2(r * 0.32)} Q${f2(-r * 0.75)},${f2(r * 0.32)} ${f2(-r)},${f2(-r * 0.1)} Z" fill="#B7C7D6" ${st(2)}/><path d="M${f2(-r * 0.98)},${f2(r * 0.02)} L${f2(-r * 0.55)},${f2(r * 0.08)}" ${st(2)}/><circle cx="${f2(-r * 0.62)}" cy="${f2(-r * 0.28)}" r="${f2(r * 0.08)}" fill="${INK}"/>`,
    ichthyostega: (r) => `<path d="M${f2(-r * 1.05)},0 Q${f2(-r * 0.9)},${f2(-r * 0.32)} ${f2(-r * 0.4)},${f2(-r * 0.3)} Q${f2(r * 0.3)},${f2(-r * 0.32)} ${f2(r * 0.7)},${f2(-r * 0.12)} L${f2(r * 1.15)},${f2(-r * 0.3)} L${f2(r * 1.05)},${f2(r * 0.12)} Q${f2(r * 0.3)},${f2(r * 0.25)} ${f2(-r * 0.4)},${f2(r * 0.22)} Q${f2(-r * 0.95)},${f2(r * 0.2)} ${f2(-r * 1.05)},0 Z" fill="#9DB38A" ${st(2)}/><path d="M${f2(-r * 0.45)},${f2(r * 0.2)} l${f2(-r * 0.1)},${f2(r * 0.4)} l${f2(r * 0.15)},0 M${f2(r * 0.35)},${f2(r * 0.2)} l${f2(r * 0.05)},${f2(r * 0.4)} l${f2(r * 0.15)},0" fill="none" ${st(2.4)}/><circle cx="${f2(-r * 0.75)}" cy="${f2(-r * 0.1)}" r="${f2(r * 0.07)}" fill="${INK}"/>`,
    archaeo: (r) => `<path d="M${f2(-r * 0.2)},${f2(r * 0.1)} Q${f2(-r * 0.9)},${f2(-r * 0.9)} ${f2(-r * 1.1)},${f2(-r * 0.45)} Q${f2(-r * 0.6)},${f2(-r * 0.2)} ${f2(-r * 0.35)},${f2(-r * 0.1)} Z" fill="#9AA7AE" ${st(1.8)}/><ellipse cx="${f2(r * 0.05)}" cy="${f2(r * 0.15)}" rx="${f2(r * 0.4)}" ry="${f2(r * 0.25)}" fill="#C79A76" ${st(2)}/><path d="M${f2(r * 0.4)},${f2(r * 0.15)} L${f2(r * 1.1)},${f2(r * 0.3)}" ${st(3)}/>${[0.55, 0.72, 0.9].map((t) => `<path d="M${f2(r * t)},${f2(r * (0.17 + t * 0.12))} l${f2(r * 0.06)},${f2(-r * 0.16)} M${f2(r * t)},${f2(r * (0.17 + t * 0.12))} l${f2(r * 0.06)},${f2(r * 0.16)}" stroke="#9AA7AE" stroke-width="2"/>`).join("")}<path d="M${f2(-r * 0.3)},${f2(-r * 0.05)} Q${f2(-r * 0.45)},${f2(-r * 0.55)} ${f2(-r * 0.15)},${f2(-r * 0.62)} Q${f2(r * 0.1)},${f2(-r * 0.62)} ${f2(r * 0.05)},${f2(-r * 0.4)} L${f2(-r * 0.05)},${f2(-r * 0.05)}" fill="#C79A76" ${st(1.8)}/><path d="M${f2(-r * 0.2)},${f2(-r * 0.55)} l${f2(-r * 0.45)},${f2(r * 0.05)} l${f2(r * 0.42)},${f2(r * 0.08)}" fill="#E8C07A" ${st(1.4)}/><circle cx="${f2(-r * 0.12)}" cy="${f2(-r * 0.5)}" r="${f2(r * 0.05)}" fill="${INK}"/>`,
    meteorite: (r) => `<path d="M${f2(-r * 0.8)},${f2(-r * 0.2)} L${f2(-r * 0.45)},${f2(-r * 0.75)} L${f2(r * 0.25)},${f2(-r * 0.8)} L${f2(r * 0.85)},${f2(-r * 0.3)} L${f2(r * 0.75)},${f2(r * 0.45)} L${f2(r * 0.05)},${f2(r * 0.8)} L${f2(-r * 0.65)},${f2(r * 0.5)} Z" fill="#7E7A86" ${st(2)}/><circle cx="${f2(-r * 0.25)}" cy="${f2(-r * 0.25)}" r="${f2(r * 0.15)}" fill="#6A6672"/><circle cx="${f2(r * 0.35)}" cy="${f2(r * 0.15)}" r="${f2(r * 0.12)}" fill="#6A6672"/><path d="M${f2(r * 0.25)},${f2(-r * 0.55)} l${f2(r * 0.12)},${f2(r * 0.1)}" stroke="#B9B5C2" stroke-width="3"/>`,
    mammoth: (r) => `<path d="M${f2(-r * 0.2)},${f2(-r * 0.7)} Q${f2(r * 0.9)},${f2(-r * 0.5)} ${f2(r * 0.95)},${f2(r * 0.25)} Q${f2(r * 0.6)},${f2(r * 0.55)} ${f2(r * 0.2)},${f2(r * 0.35)} Q${f2(r * 0.55)},${f2(r * 0.15)} ${f2(r * 0.5)},${f2(-r * 0.1)} Q${f2(r * 0.25)},${f2(-r * 0.45)} ${f2(-r * 0.2)},${f2(-r * 0.4)} Z" fill="#F4ECD8" ${st(2)}/><path d="M${f2(-r * 0.25)},${f2(-r * 0.62)} Q${f2(-r * 0.75)},${f2(-r * 0.55)} ${f2(-r * 0.9)},${f2(-r * 0.1)}" fill="none" stroke="#C9B79B" stroke-width="2"/>`,
    globe: (r) => `<circle r="${r}" fill="#7FC6DE" ${st(2)}/><path d="M${f2(-r * 0.5)},${f2(-r * 0.6)} q${f2(r * 0.4)},${f2(-r * 0.1)} ${f2(r * 0.5)},${f2(r * 0.25)} q${f2(-r * 0.05)},${f2(r * 0.35)} ${f2(-r * 0.4)},${f2(r * 0.3)} q${f2(-r * 0.3)},${f2(-r * 0.2)} ${f2(-r * 0.1)},${f2(-r * 0.55)} Z" fill="#9DC08B" ${st(1.6)}/><path d="M${f2(r * 0.25)},${f2(r * 0.15)} q${f2(r * 0.45)},${f2(-r * 0.05)} ${f2(r * 0.45)},${f2(r * 0.35)} q${f2(-r * 0.15)},${f2(r * 0.35)} ${f2(-r * 0.45)},${f2(r * 0.2)} Z" fill="#9DC08B" ${st(1.6)}/><path d="M${f2(-r * 0.6)},${f2(-r * 0.75)} q${f2(r * 0.3)},${f2(-r * 0.2)} ${f2(r * 0.6)},${f2(-r * 0.15)}" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".7"/>`,
    volcano: (r) => `<path d="M${f2(-r)},${f2(r * 0.8)} L${f2(-r * 0.25)},${f2(-r * 0.45)} L${f2(r * 0.25)},${f2(-r * 0.45)} L${f2(r)},${f2(r * 0.8)} Z" fill="#9C8070" ${st(2)}/><path d="M${f2(-r * 0.25)},${f2(-r * 0.45)} L${f2(-r * 0.1)},${f2(-r * 0.15)} L${f2(0)},${f2(-r * 0.35)} L${f2(r * 0.12)},${f2(-r * 0.05)} L${f2(r * 0.25)},${f2(-r * 0.45)} Z" fill="#F2884B" ${st(1.6)}/><circle cx="${f2(-r * 0.15)}" cy="${f2(-r * 0.75)}" r="${f2(r * 0.18)}" fill="#E1DCD6" ${st(1.4)}/><circle cx="${f2(r * 0.12)}" cy="${f2(-r * 0.9)}" r="${f2(r * 0.22)}" fill="#ECE8E2" ${st(1.4)}/>`,
    strata: (r) => ["#E9D9B0", "#D8B98E", "#B9A582", "#C79A76", "#9C8A6E", "#8C7A62"].map((c, i) => `<path d="M${f2(-r)},${f2(-r * 0.8 + i * r * 0.32)} q${f2(r * 0.5)},${f2(-r * 0.08)} ${f2(r)},0 t${f2(r)},0 L${f2(r)},${f2(-r * 0.48 + i * r * 0.32)} q${f2(-r * 0.5)},${f2(r * 0.08)} ${f2(-r)},0 t${f2(-r)},0 Z" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`).join("") + `<g transform="translate(${f2(r * 0.35)} ${f2(r * 0.55)})">${'<circle r="' + f2(r * 0.12) + '" fill="#D9B98E" ' + st(1.2) + '/>'}</g>`,
    crystal: (r) => `<path d="M${f2(-r * 0.6)},${f2(r * 0.7)} L${f2(-r * 0.75)},${f2(-r * 0.2)} L${f2(-r * 0.5)},${f2(-r * 0.6)} L${f2(-r * 0.25)},${f2(-r * 0.2)} L${f2(-r * 0.3)},${f2(r * 0.7)} Z" fill="#C9BCD9" ${st(1.8)}/><path d="M${f2(-r * 0.2)},${f2(r * 0.7)} L${f2(-r * 0.25)},${f2(-r * 0.5)} L${f2(0)},${f2(-r)} L${f2(r * 0.25)},${f2(-r * 0.5)} L${f2(r * 0.2)},${f2(r * 0.7)} Z" fill="#E6F3F6" ${st(1.8)}/><path d="M${f2(r * 0.3)},${f2(r * 0.7)} L${f2(r * 0.3)},${f2(-r * 0.1)} L${f2(r * 0.55)},${f2(-r * 0.45)} L${f2(r * 0.8)},${f2(-r * 0.1)} L${f2(r * 0.75)},${f2(r * 0.7)} Z" fill="#B7DCEB" ${st(1.8)}/><path d="M${f2(-r * 0.9)},${f2(r * 0.7)} L${f2(r * 0.95)},${f2(r * 0.7)}" ${st(2.4)}/>`,
    skull: (r) => `<path d="M${f2(-r * 1.0)},${f2(-r * 0.05)} Q${f2(-r * 0.95)},${f2(-r * 0.55)} ${f2(-r * 0.35)},${f2(-r * 0.6)} Q${f2(r * 0.55)},${f2(-r * 0.7)} ${f2(r * 0.95)},${f2(-r * 0.15)} Q${f2(r * 1.0)},${f2(r * 0.25)} ${f2(r * 0.6)},${f2(r * 0.3)} L${f2(-r * 0.75)},${f2(r * 0.25)} Q${f2(-r * 1.0)},${f2(r * 0.2)} ${f2(-r * 1.0)},${f2(-r * 0.05)} Z" fill="${BONE}" ${st(2)}/><path d="M${f2(-r * 0.75)},${f2(r * 0.25)} Q${f2(-r * 0.2)},${f2(r * 0.65)} ${f2(r * 0.55)},${f2(r * 0.42)}" fill="${BONE2}" ${st(2)}/><circle cx="${f2(r * 0.35)}" cy="${f2(-r * 0.25)}" r="${f2(r * 0.15)}" fill="#6E5E48"/><path d="M${f2(-r * 0.25)},${f2(-r * 0.35)} q${f2(r * 0.2)},${f2(-r * 0.1)} ${f2(r * 0.35)},${f2(r * 0.05)} q${f2(-r * 0.1)},${f2(r * 0.25)} ${f2(-r * 0.35)},${f2(r * 0.18)} Z" fill="#B9A582"/>${[-0.6, -0.4, -0.2, 0, 0.2].map((x) => `<path d="M${f2(r * x)},${f2(r * 0.25)} l${f2(r * 0.05)},${f2(r * 0.12)} l${f2(r * 0.05)},${f2(-r * 0.12)}" fill="#FFFFFF" ${st(1)}/>`).join("")}`,
    pick: (r) => `<path d="M${f2(-r * 0.7)},${f2(r * 0.8)} L${f2(r * 0.3)},${f2(-r * 0.4)}" stroke="#A9754A" stroke-width="${f2(r * 0.16)}" stroke-linecap="round"/><path d="M${f2(-r * 0.1)},${f2(-r * 0.75)} Q${f2(r * 0.4)},${f2(-r * 0.75)} ${f2(r * 0.85)},${f2(-r * 0.2)} Q${f2(r * 0.45)},${f2(-r * 0.45)} ${f2(-r * 0.1)},${f2(-r * 0.75)} Z" fill="#AEB5BC" ${st(2)}/><path d="M${f2(r * 0.55)},${f2(r * 0.25)} l${f2(r * 0.35)},${f2(r * 0.45)}" stroke="#E2A15A" stroke-width="${f2(r * 0.12)}" stroke-linecap="round"/><path d="M${f2(r * 0.85)},${f2(r * 0.65)} l${f2(r * 0.12)},${f2(r * 0.18)} l${f2(-r * 0.2)},${f2(r * 0.05)} Z" fill="#8C7A62" ${st(1.4)}/>`,
    japan: (r) => `<path d="M${f2(r * 0.55)},${f2(-r * 0.95)} q${f2(r * 0.3)},${f2(r * 0.05)} ${f2(r * 0.3)},${f2(r * 0.25)} q${f2(-r * 0.1)},${f2(r * 0.15)} ${f2(-r * 0.35)},${f2(r * 0.05)} q${f2(-r * 0.15)},${f2(-r * 0.2)} ${f2(r * 0.05)},${f2(-r * 0.3)} Z" fill="#9DC08B" ${st(1.6)}/><path d="M${f2(r * 0.45)},${f2(-r * 0.45)} Q${f2(r * 0.5)},${f2(-r * 0.05)} ${f2(r * 0.15)},${f2(r * 0.25)} Q${f2(-r * 0.25)},${f2(r * 0.5)} ${f2(-r * 0.55)},${f2(r * 0.55)} L${f2(-r * 0.6)},${f2(r * 0.4)} Q${f2(-r * 0.2)},${f2(r * 0.3)} ${f2(r * 0.05)},${f2(r * 0.05)} Q${f2(r * 0.3)},${f2(-r * 0.2)} ${f2(r * 0.3)},${f2(-r * 0.45)} Z" fill="#9DC08B" ${st(1.6)}/><path d="M${f2(-r * 0.75)},${f2(r * 0.55)} q${f2(-r * 0.15)},${f2(r * 0.15)} 0,${f2(r * 0.3)} q${f2(r * 0.12)},${f2(-r * 0.1)} 0,${f2(-r * 0.3)} Z" fill="#9DC08B" ${st(1.4)}/><circle cx="${f2(-r * 0.05)}" cy="${f2(r * 0.12)}" r="${f2(r * 0.07)}" fill="#E8575A" ${st(1)}/><circle cx="${f2(r * 0.42)}" cy="${f2(-r * 0.12)}" r="${f2(r * 0.06)}" fill="#E8575A" ${st(1)}/><circle cx="${f2(r * 0.68)}" cy="${f2(-r * 0.78)}" r="${f2(r * 0.06)}" fill="#E8575A" ${st(1)}/>`,
    nest: (r) => `<ellipse cy="${f2(r * 0.35)}" rx="${f2(r)}" ry="${f2(r * 0.45)}" fill="#B98E5A" ${st(2)}/>${[[-0.45, -0.05], [0, -0.15], [0.45, -0.05], [-0.22, 0.15], [0.25, 0.15]].map(([x, y]) => `<ellipse cx="${f2(r * x)}" cy="${f2(r * y)}" rx="${f2(r * 0.22)}" ry="${f2(r * 0.3)}" fill="#F4ECD8" ${st(1.6)}/>`).join("")}<path d="M${f2(-r * 0.95)},${f2(r * 0.3)} q${f2(r * 0.95)},${f2(r * 0.35)} ${f2(r * 1.9)},0" fill="none" stroke="#8C6A44" stroke-width="2"/>`,
    lab: (r) => `<rect x="${f2(-r * 0.25)}" y="${f2(r * 0.55)}" width="${f2(r * 0.9)}" height="${f2(r * 0.2)}" rx="3" fill="#8D949B" ${st(1.6)}/><path d="M${f2(r * 0.1)},${f2(r * 0.55)} L${f2(r * 0.1)},${f2(-r * 0.2)} L${f2(-r * 0.25)},${f2(-r * 0.75)}" fill="none" ${st(3)}/><rect x="${f2(-r * 0.45)}" y="${f2(-r * 0.95)}" width="${f2(r * 0.35)}" height="${f2(r * 0.25)}" rx="4" fill="#5E6B7A" ${st(1.6)}/><ellipse cx="${f2(-r * 0.55)}" cy="${f2(r * 0.4)}" rx="${f2(r * 0.4)}" ry="${f2(r * 0.15)}" fill="${BONE}" ${st(1.6)}/><path d="M${f2(-r * 0.85)},${f2(r * 0.4)} l${f2(r * 0.6)},0" stroke="${BONE2}" stroke-width="2"/>`,
  };
  ICON.fern = ICON.shida;
  ICON.futaba = (r) => `<g transform="scale(${f2(r / 60)})">${futabaBody("ic")}</g>`;
  function iconSvg(kind, size = 120, uid = "ic") {
    const fn = ICON[kind] || ICON.ammonite;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-80 -50 160 100" width="${size}" height="${Math.round(size * 0.625)}" data-k="${uid}"><g>${fn(38)}</g></svg>`;
  }

  // ---- フタバスズキリュウ（よこむき・あたまが ひだり。原点 まんなか・はば やく 240）----
  function futabaBody(uid) {
    const bone = (d, w = 1.6) => `<path d="${d}" fill="${BONE}" ${st(w)}/>`;
    let s = "";
    // くび（ほねの ならび）
    const neck = []; for (let i = 0; i <= 16; i++) { const t = i / 16; neck.push([-118 + t * 72, -24 + Math.sin(t * 3.1) * 10 - t * 6]); }
    for (let i = 0; i < neck.length - 1; i++) { const [x0, y0] = neck[i], [x1, y1] = neck[i + 1]; s += `<path d="M${f2(x0)},${f2(y0)} L${f2(x1)},${f2(y1)}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M${f2(x0)},${f2(y0)} L${f2(x1)},${f2(y1)}" stroke="${BONE}" stroke-width="4.4" stroke-linecap="round"/>`; }
    // あたま
    s += bone(`M-124,-30 Q-136,-30 -138,-24 Q-136,-18 -124,-18 Q-114,-20 -112,-26 Q-116,-31 -124,-30 Z`) + `<circle cx="-122" cy="-26" r="1.6" fill="${INK}"/>`;
    // からだ（せぼね・ろっこつ）
    s += `<path d="M-46,-30 Q0,-40 46,-24" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M-46,-30 Q0,-40 46,-24" fill="none" stroke="${BONE}" stroke-width="4.4" stroke-linecap="round"/>`;
    for (let i = 0; i < 9; i++) { const x = -38 + i * 9, y = -33 - Math.sin((i / 8) * Math.PI) * 4; s += `<path d="M${f2(x)},${f2(y)} q${f2(-4)},${f2(14)} ${f2(2)},${f2(26 - Math.abs(i - 4) * 2)}" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M${f2(x)},${f2(y)} q${f2(-4)},${f2(14)} ${f2(2)},${f2(26 - Math.abs(i - 4) * 2)}" fill="none" stroke="${BONE}" stroke-width="2.2" stroke-linecap="round"/>`; }
    // しっぽ
    s += `<path d="M46,-24 Q80,-14 112,-8" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M46,-24 Q80,-14 112,-8" fill="none" stroke="${BONE}" stroke-width="3.6" stroke-linecap="round"/>`;
    // ひれ 4まい（まえ 2・うしろ 2）
    for (const [x, y, rot, k] of [[-30, -6, 28, 1], [-22, -4, 40, 0.9], [26, -10, 24, 0.95], [34, -8, 38, 0.85]]) s += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><path d="M0,0 Q10,6 34,10 Q44,12 46,16 Q30,20 8,12 Q-4,8 0,0 Z" fill="${BONE2}" ${st(1.6)}/>${[10, 18, 26, 34].map((u) => `<path d="M${u},${f2(4 + u * 0.18)} l1,6" stroke="${INK}" stroke-width="1"/>`).join("")}</g>`;
    return s;
  }
  const futabaSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-142 -46 258 80">${futabaBody("fb")}</svg>`;

  // ---- うごく ティラノサウルス（ロボット。よこむき・あたまが ひだり。frame: 0 ふつう・1 くちを すこし・2 ほえる・3 まばたき）----
  function robotSvg(frame) {
    const roar = frame === 2, jaw = roar ? 18 : frame === 1 ? 6 : 0, blink = frame === 3, tail = frame === 1 ? -8 : roar ? 6 : 0, G1 = "#7FB069", G2 = "#5E9150", BELLY = "#E9E2B8";
    const head = roar ? "rotate(-10 -64 -132)" : "";
    let s = "";
    // しっぽ・からだ・うしろあし（おくの あし）
    s += `<path d="M30,-112 Q100,${-118 + tail} 152,${-96 + tail * 1.6} Q112,${-84 + tail} 34,-78 Z" fill="${G2}" ${st(2)}/>`;
    s += `<path d="M18,-74 Q30,-40 22,-12 L40,-12 Q48,-40 40,-80 Z" fill="${G2}" ${st(2)}/><path d="M18,-12 h28 l4,8 h-34 Z" fill="#4F7C43" ${st(1.6)}/>`;
    s += `<path d="M-46,-118 Q-10,-150 40,-120 Q62,-96 40,-70 Q0,-52 -36,-72 Q-58,-92 -46,-118 Z" fill="${G1}" ${st(2.2)}/>`;
    s += `<path d="M-34,-80 Q0,-64 32,-78 Q24,-60 -2,-58 Q-26,-60 -34,-80 Z" fill="${BELLY}" ${st(1.4)}/>${[-20, -6, 8, 22].map((x) => `<path d="M${x},-76 q2,8 0,14" stroke="#C9BE8C" stroke-width="1.6" fill="none"/>`).join("")}`;
    // てまえの あし
    s += `<path d="M-6,-78 Q12,-44 2,-12 L22,-12 Q30,-46 18,-84 Z" fill="${G1}" ${st(2)}/><path d="M-2,-12 h28 l4,8 h-34 Z" fill="${G2}" ${st(1.6)}/>`;
    // ちいさな うで
    s += `<path d="M-42,-92 q-14,4 -16,14 q6,-2 10,-8 q2,8 -2,12 q10,-4 12,-14" fill="${G1}" ${st(1.6)}/>`;
    // くび と あたま
    s += `<g transform="${head}"><path d="M-40,-112 Q-48,-130 -56,-138 L-30,-138 Q-22,-122 -24,-106 Z" fill="${G1}" ${st(2)}/>`;
    s += `<path d="M-30,-128 Q-34,-160 -66,-160 Q-104,-158 -110,-142 Q-110,-132 -98,-130 L-60,-130 Q-40,-128 -30,-128 Z" fill="${G1}" ${st(2.2)}/>`;
    s += `<g transform="rotate(${jaw} -40 -130)"><path d="M-98,-130 Q-100,-118 -86,-116 L-44,-118 Q-34,-120 -34,-128 Z" fill="${G2}" ${st(2)}/>${[-90, -80, -70, -60, -50].map((x) => `<path d="M${x},-127 l3,-5 l3,5" fill="#FFFFFF" ${st(1)}/>`).join("")}</g>`;
    s += [-102, -92, -82, -72, -62, -52].map((x) => `<path d="M${x},-131 l3,5 l3,-5" fill="#FFFFFF" ${st(1)}/>`).join("");
    s += blink ? `<path d="M-74,-147 q6,4 12,0" fill="none" ${st(2)}/>` : `<circle cx="-68" cy="-147" r="6.5" fill="#FFFFFF" ${st(1.6)}/><circle cx="-70" cy="-147" r="3.4" fill="${INK}"/><circle cx="-71.5" cy="-148.6" r="1.2" fill="#FFFFFF"/>`;
    s += `<path d="M-100,-150 q2,-3 6,-2" fill="none" ${st(1.6)}/><circle cx="-52" cy="-150" r="2.2" fill="#C9CED3" ${st(1)}/><circle cx="-44" cy="-138" r="2.2" fill="#C9CED3" ${st(1)}/></g>`;
    // ロボットの しるし（ボルト・ランプ）
    s += [[-30, -104], [26, -98], [6, -46], [30, -44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#C9CED3" ${st(1.1)}/>`).join("");
    if (roar) s += `<path d="M-120,-170 l-14,-8 M-124,-152 l-18,-2 M-120,-136 l-14,6" ${st(2.2)}/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-148 -186 306 190">${s}</svg>`;
  }

  // ---- 什器の モデル（原点は 床の かど）----
  const M = {
    // ほねの 台（石の だい・じだいの いろの おび・ねふだ・ささえの ぼう）
    dinostand(S, f) {
      const w = f.w, d = f.h, era = ERA[eraOf(f.dino)];
      let s = S.ellipse(w / 2, d / 2, 0, Math.max(w, d) * 0.5, "#00000016", 0);
      s += S.box(0.05, 0.1, w - 0.1, d - 0.2, 0, 26, STONE) + S.poly([[0.16, 0.2, 26.5], [w - 0.16, 0.2, 26.5], [w - 0.16, d - 0.3, 26.5], [0.16, d - 0.3, 26.5]], "#D9C59E", 1.2);
      for (let i = 0; i < Math.round(w * 4); i++) { const x = 0.3 + ((i * 0.37) % (w - 0.6)), y = 0.3 + ((i * 0.61) % (d - 0.7)); s += S.ellipse(x, y, 27, 0.05, ["#BFA77F", "#CDB892", "#A99677"][i % 3], 0); }
      s += S.poly([[0.05, d - 0.1, 5], [w - 0.05, d - 0.1, 5], [w - 0.05, d - 0.1, 11], [0.05, d - 0.1, 11]], era, 0);
      s += S.poly([[w - 0.05, 0.1, 5], [w - 0.05, d - 0.1, 5], [w - 0.05, d - 0.1, 11], [w - 0.05, 0.1, 11]], MallArt.shade(era, -0.15), 0);
      s += S.poly([[w / 2 - Math.min(1.1, w * 0.42), d - 0.09, 13], [w / 2 + Math.min(1.1, w * 0.42), d - 0.09, 13], [w / 2 + Math.min(1.1, w * 0.42), d - 0.09, 25], [w / 2 - Math.min(1.1, w * 0.42), d - 0.09, 25]], "#FFF8EA", 1.2);
      // ささえの ぼう（ほねの うしろ）
      const len = f.len || w - 0.6, x0 = (w - len) / 2, hh = Math.min(300, (len * IsoVenue.T * 0.5));
      for (const t of len > 2.5 ? [0.36, 0.64] : [0.5]) s += S.line([[x0 + len * t, d / 2, 26], [x0 + len * t, d / 2, 26 + hh * 0.55]], "#6E7480", 2.6);
      return s;
    },
    // ロボットの だい（いわ と しげみ・あんないの パネル）
    robotrex(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.ellipse(cx, cy, 0, Math.min(f.w, f.h) / 2, "#00000018", 0) + S.cyl(cx, cy, Math.min(f.w, f.h) / 2 - 0.1, 0, 22, ["#B9A582", "#9C8A6E"]);
      for (const [x, y, r, c] of [[0.5, 0.6, 0.32, "#A99677"], [f.w - 0.6, 0.7, 0.28, "#9C8A6E"], [0.7, f.h - 0.6, 0.25, "#B7A68C"]]) s += S.cyl(x, y, r, 22, 14, [c, MallArt.shade(c, -0.15)], 1.3);
      for (const [x, y] of [[0.4, f.h - 0.9], [f.w - 0.5, f.h - 0.6]]) s += S.at(x, y, 24, `<path d="M0,0 q-12,-16 -2,-30 q4,12 4,18 q4,-16 14,-18 q-4,16 -16,30" fill="#86AE78" ${S.st(1.2)}/>`);
      s += S.box(f.w - 0.9, f.h - 0.45, 0.7, 0.3, 0, 52, ["#FFF8EA", "#E3D7C2", "#CDBEA4"]) + S.poly([[f.w - 0.85, f.h - 0.15, 30], [f.w - 0.25, f.h - 0.15, 30], [f.w - 0.25, f.h - 0.15, 48], [f.w - 0.85, f.h - 0.15, 48]], "#3E4A56", 1.1);
      return s;
    },
    // かせきの ケース（ひくい たな・ガラスの ふた・なかに かせき）。まえは +x
    fossilcase(S, f) {
      let s = S.box(0.1, 0.06, f.w - 0.2, f.h - 0.12, 0, 60, DARKWOOD) + S.poly([[0.16, 0.12, 60.5], [f.w - 0.16, 0.12, 60.5], [f.w - 0.16, f.h - 0.12, 60.5], [0.16, f.h - 0.12, 60.5]], "#F1E8D6", 1.2);
      const ic = ICON[f.variant] || ICON.ammonite;
      s += S.at(f.w / 2, f.h / 2, 64, `<g transform="scale(0.9 0.62)">${ic(20)}</g>`);
      s += S.box(0.12, 0.08, f.w - 0.24, f.h - 0.16, 60, 22, [GLASS, "#CFE7EC44", "#CFE7EC55"], 1.1);
      s += S.poly([[f.w - 0.12, 0.25, 22], [f.w - 0.12, f.h - 0.25, 22], [f.w - 0.12, f.h - 0.25, 44], [f.w - 0.12, 0.25, 44]], "#FFF8EA", 1.1);
      return s;
    },
    // はっくつげんばの ジオラマ（くぼんだ あな・ちそう・ほね・どうぐ・ちいさな 人）
    digsite(S, f) {
      const w = f.w, d = f.h, Z = -46;
      let s = S.box(0, 0, w, d, 0, 8, ["#C9AE85", "#B39669", "#9C815D"]);
      // あなの なか（おくの かべ 2まい・そこ）
      s += S.poly([[0.3, 0.3, 8], [w - 0.3, 0.3, 8], [w - 0.3, 0.3, Z], [0.3, 0.3, Z]], "#A98B64", 1.2) + S.poly([[0.3, 0.3, 8], [0.3, d - 0.3, 8], [0.3, d - 0.3, Z], [0.3, 0.3, Z]], "#967A55", 1.2);
      for (const [z, c] of [[-6, "#C9A877"], [-18, "#B5946A"], [-30, "#A2835C"]]) s += S.line([[0.3, 0.3, z], [w - 0.3, 0.3, z]], c, 3) + S.line([[0.3, 0.3, z], [0.3, d - 0.3, z]], c, 3);
      s += S.poly([[0.3, 0.3, Z], [w - 0.3, 0.3, Z], [w - 0.3, d - 0.3, Z], [0.3, d - 0.3, Z]], "#B79C74", 1.2);
      // ほり だし ちゅうの ほね
      for (const [x, y, a, l] of [[1.6, 1.2, 10, 1.4], [2.6, 1.6, -20, 1.0], [3.4, 1.0, 35, 0.9], [2.0, 2.0, 70, 0.7]]) s += S.at(x, y, Z, `<g transform="rotate(${a}) scale(1 0.55)"><path d="M${f2(-l * 24)},-3 L${f2(l * 24)},-3 L${f2(l * 24)},3 L${f2(-l * 24)},3 Z" fill="${BONE}" ${S.st(1.2)}/><circle cx="${f2(-l * 24)}" cy="0" r="5" fill="${BONE}" ${S.st(1.2)}/><circle cx="${f2(l * 24)}" cy="0" r="5" fill="${BONE}" ${S.st(1.2)}/></g>`);
      s += S.at(4.4, 1.9, Z, `<g transform="scale(1 0.6)">${ICON.skull(20)}</g>`);
      // グリッドの いと
      for (let i = 1; i < w - 0.6; i++) s += S.line([[0.3 + i, 0.3, 9], [0.3 + i, d - 0.3, 9]], "#FFFFFF", 1);
      s += S.line([[0.3, d / 2, 9], [w - 0.3, d / 2, 9]], "#FFFFFF", 1);
      // どうぐ（バケツ・はけ・はた）
      s += S.cyl(w - 0.6, d - 0.55, 0.18, 8, 22, ["#E2A15A", "#C98A42"]) + S.line([[w - 1.1, d - 0.4, 9], [w - 0.9, d - 0.2, 26]], "#A9754A", 3);
      for (const [x, y, c] of [[1.0, 0.6, "#E8575A"], [3.8, 2.3, "#5A9BC4"]]) s += S.line([[x, y, Z], [x, y, Z + 30]], "#6E5E48", 1.6) + S.poly([[x, y, Z + 30], [x + 0.3, y, Z + 25], [x, y, Z + 20]], c, 1);
      // ちいさな はっくつの 人（もけい）
      for (const [x, y, c] of [[2.9, 2.2, "#F2B347"], [1.3, 1.6, "#E58C92"]]) s += S.at(x, y, Z, `<ellipse cy="-6" rx="5" ry="7" fill="${c}" ${S.st(1)}/><circle cy="-16" r="4.4" fill="#F4D3B5" ${S.st(1)}/><path d="M-5,-18 q5,-6 10,0 Z" fill="#F7D889" ${S.st(1)}/>`);
      return s;
    },
    // じだいの かんばん（ぼう ＋ いた・アイコン）
    erasign(S, f) {
      const c = ERA[f.variant] || "#E2A15A", ic = ICON[{ jura: "fern", kreta: "tooth", japan: "japan" }[f.variant] || "fern"];
      let s = S.box(0.42, 0.42, 0.16, 0.16, 0, 70, "#8D8A92") + S.box(0.3, 0.38, 0.4, 0.24, 0, 8, "#6E6A70");
      s += S.poly([[0.02, 0.5, 70], [0.98, 0.5, 70], [0.98, 0.5, 128], [0.02, 0.5, 128]], c, 1.8) + S.poly([[0.08, 0.5, 76], [0.98 - 0.06, 0.5, 76], [0.92, 0.5, 100], [0.08, 0.5, 100]], "#FFF8EA", 1.2);
      s += S.at(0.22, 0.5, 112, `<g transform="scale(0.35)">${ic(26)}</g>`);
      return s;
    },
    // うけつけ（クリームの カウンター・アンモナイトの マーク・パンフレット）
    mureception(S, f) {
      let s = S.box(0.04, 0.1, f.w - 0.08, f.h - 0.2, 0, 76, ["#FFF8EA", "#E9DFCB", "#D6C8AE"]) + S.box(0.0, 0.06, f.w, f.h - 0.12, 76, 8, WOOD);
      for (let i = 0; i < f.w; i++) s += S.poly([[i + 0.15, f.h - 0.1, 10], [i + 0.85, f.h - 0.1, 10], [i + 0.85, f.h - 0.1, 14], [i + 0.15, f.h - 0.1, 14]], "#C9B28C", 0);
      s += S.at(f.w / 2, f.h - 0.1, 44, `<g transform="scale(0.55)">${ICON.ammonite(28)}</g>`);
      s += S.box(0.4, 0.3, 0.5, 0.4, 84, 28, ["#E8E1D2", "#C9BFAE", "#B3A893"]) + S.poly([[0.45, 0.7, 92], [0.85, 0.7, 92], [0.85, 0.7, 108], [0.45, 0.7, 108]], "#9FD1D9", 1);
      s += S.at(f.w - 1.2, 0.5, 84, `<g transform="scale(0.45)">${ICON.skull(30)}</g>`);
      for (const [x, c] of [[2.2, "#F2B347"], [2.5, "#9DC08B"], [2.8, "#8FCBDA"]]) s += S.box(x, 0.35, 0.22, 0.12, 84, 26, [c, MallArt.shade(c, -0.1), MallArt.shade(c, -0.25)], 1);
      return s;
    },
    // うけつけの うしろの たな（ぬいぐるみ・パンフレット・ポスター）
    mubackshelf(S, f) {
      let s = S.box(0.04, 0.1, f.w - 0.08, 0.6, 0, 150, ["#E8D6B8", "#C9AE85", "#B39669"]);
      for (const z of [44, 92]) s += S.box(0.06, 0.65, f.w - 0.12, 0.08, z, 4, WOOD, 1);
      for (let i = 0; i < f.w * 2; i++) { const x = 0.35 + i * ((f.w - 0.7) / (f.w * 2 - 1)), z = i % 2 ? 48 : 96, c = ["#7FB069", "#F2B347", "#8FCBDA", "#E58C92"][i % 4]; s += S.at(x, 0.7, z + 14, `<ellipse rx="9" ry="8" fill="${c}" ${S.st(1.2)}/><circle cx="-5" cy="-6" r="5" fill="${c}" ${S.st(1.2)}/><circle cx="-6" cy="-7" r="1.2" fill="${INK}"/>`); }
      s += S.poly([[0.3, 0.7, 108], [f.w - 0.3, 0.7, 108], [f.w - 0.3, 0.7, 146], [0.3, 0.7, 146]], "#F7EFD9", 1.2);
      return s;
    },
    // フロア あんない（たって いる ボード・階の いろ）
    mudirectory(S, f) {
      let s = S.box(0.3, 0.42, f.w - 0.6, 0.16, 0, 14, "#8D8A92") + S.box(f.w / 2 - 0.08, 0.45, 0.16, 0.1, 14, 40, "#8D8A92");
      s += S.poly([[0.04, 0.5, 54], [f.w - 0.04, 0.5, 54], [f.w - 0.04, 0.5, 168], [0.04, 0.5, 168]], "#FFFDF6", 1.8);
      for (const [z, c] of [[136, "#F1E1C2"], [104, "#D3E4EE"], [72, "#D6E6C6"]]) s += S.poly([[0.12, 0.5, z], [f.w - 0.12, 0.5, z], [f.w - 0.12, 0.5, z + 26], [0.12, 0.5, z + 26]], c, 1);
      return s;
    },
    // カフェの カウンター（かべぞい・まえは +x）: コーヒーの きかい・ケーキの ケース
    mucafebar(S, f) {
      let s = S.box(0.08, 0.04, f.w - 0.16, f.h - 0.08, 0, 92, ["#E6C9A0", "#C9A16E", "#B38A58"]) + S.box(0.02, 0, f.w - 0.04, f.h, 92, 8, ["#F4ECDC", "#DCCDB2", "#C9B89A"]);
      s += S.box(0.25, 0.3, 0.5, 0.7, 100, 46, ["#5E5A60", "#4B474D", "#3E3A40"]) + S.poly([[0.75, 0.42, 120], [0.75, 0.88, 120], [0.75, 0.88, 136], [0.75, 0.42, 136]], "#9FD1D9", 1);
      s += S.box(0.2, 2.0, 0.6, 1.6, 100, 38, ["#E6F3F6AA", "#CFE7EC99", "#B9DCEA99"], 1.2);
      for (const [y, c] of [[2.3, "#F4A4A9"], [2.8, "#F7D889"], [3.3, "#C79A76"]]) s += S.at(0.5, y, 104, `<path d="M-7,0 L7,0 L5,-9 L-5,-9 Z" fill="${c}" ${S.st(1)}/><circle cy="-11" r="2.4" fill="#E8575A"/>`);
      s += S.cyl(0.45, f.h - 0.5, 0.12, 100, 16, ["#FFFFFF", "#E3E7EA"]) + S.cyl(0.45, f.h - 0.85, 0.12, 100, 16, ["#FFFFFF", "#E3E7EA"]);
      return s;
    },
    // カフェの テーブル（まるい テーブル・いす 3つ・たべもの）
    mucafetable(S, f) {
      const cx = f.w / 2, cy = f.h / 2, cloth = ["#F4D6C8", "#D6E6C6", "#F7E7B6", "#D3E4EE"][f.variant % 4], food = ["curry", "parfait", "cocoa", "sandwich"][f.variant % 4];
      let s = S.ellipse(cx, cy, 0, 0.95, "#00000012", 0);
      for (const [x, y] of [[cx - 0.75, cy - 0.2], [cx + 0.2, cy - 0.78], [cx + 0.7, cy + 0.45]]) s += S.cyl(x, y, 0.06, 0, 30, ["#8C8890", "#77737B"], 1.1) + S.cyl(x, y, 0.25, 30, 6, ["#D9B686", "#C39E6E"], 1.2);
      s += S.cyl(cx, cy, 0.08, 0, 62, ["#8C8890", "#77737B"], 1.2) + S.cyl(cx, cy, 0.62, 62, 6, [cloth, MallArt.shade(cloth, -0.12)], 1.4);
      if (typeof Art !== "undefined" && BAG_INDEX[food]) s += S.at(cx, cy, 70, img(Art.iconSvg("bag", food), -14, -24, 28, 28));
      s += S.at(cx + 0.35, cy + 0.15, 68, `<path d="M0,0 L0,-16" ${S.st(1.4)}/><path d="M0,-16 L12,-12 L0,-8 Z" fill="#7FB069" ${S.st(1)}/>`);
      return s;
    },
    // いのちの れきしの ケース（だい ＋ ガラス・なかに いきもの）
    lifecase(S, f) {
      let s = S.box(0.1, 0.12, f.w - 0.2, f.h - 0.24, 0, 70, ["#F1EBDF", "#E3DACB", "#D2C7B5"]) + S.box(0.08, 0.1, f.w - 0.16, f.h - 0.2, 70, 4, WOOD, 1);
      const ic = ICON[f.variant] || ICON.globe;
      s += S.at(f.w / 2, f.h / 2, 76, `<g transform="scale(0.55)">${ic(30)}</g>`);
      s += S.box(0.12, 0.14, f.w - 0.24, f.h - 0.28, 74, 36, [GLASS, "#CFE7EC44", "#CFE7EC55"], 1.1);
      s += S.poly([[0.3, f.h - 0.12, 30], [f.w - 0.3, f.h - 0.12, 30], [f.w - 0.3, f.h - 0.12, 54], [0.3, f.h - 0.12, 54]], "#FFF8EA", 1.1);
      return s;
    },
    // まわる ちきゅう（だい・わく。ちきゅうは L で まわす）
    globe(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.ellipse(cx, cy, 0, 0.9, "#00000014", 0) + S.cyl(cx, cy, 0.7, 0, 20, ["#8E6A4A", "#765639"]) + S.cyl(cx, cy, 0.08, 20, 40, ["#C9A24B", "#A9852F"], 1.2);
      s += S.at(cx, cy, 104, `<path d="M-46,-6 A46,46 0 0 1 40,-28" fill="none" stroke="#C9A24B" stroke-width="4"/><path d="M-46,-6 A46,46 0 0 1 40,-28" fill="none" ${S.st(1.2)}/>`);
      return s;
    },
    // かざんの もけい（だいの 上の 山・かこう）
    volcano(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.box(0.1, 0.1, f.w - 0.2, f.h - 0.2, 0, 40, ["#E8E1D2", "#C9BFAE", "#B3A893"]);
      s += S.at(cx, cy, 40, `<path d="M-62,6 Q-40,-8 -22,-52 L-12,-58 L12,-58 L22,-52 Q40,-8 62,6 Q0,22 -62,6 Z" fill="#9C8070" ${S.st(1.8)}/><path d="M-22,-52 Q-30,-20 -40,0 M10,-56 Q26,-24 30,-2" fill="none" stroke="#7E6658" stroke-width="2"/><ellipse cy="-57" rx="13" ry="4" fill="#5E4A40" ${S.st(1.4)}/><path d="M-8,-55 Q-14,-30 -26,-14 Q-10,-24 -2,-55 Z" fill="#F2884B" ${S.st(1.2)}/>`);
      s += S.poly([[0.3, f.h - 0.1, 12], [f.w - 0.3, f.h - 0.1, 12], [f.w - 0.3, f.h - 0.1, 30], [0.3, f.h - 0.1, 30]], "#FFF8EA", 1.1);
      return s;
    },
    // いしと こうぶつの ケース
    mineralcase(S, f) {
      let s = S.box(0.06, 0.12, f.w - 0.12, f.h - 0.24, 0, 64, DARKWOOD) + S.poly([[0.1, 0.16, 64.5], [f.w - 0.1, 0.16, 64.5], [f.w - 0.1, f.h - 0.16, 64.5], [0.1, f.h - 0.16, 64.5]], "#2F3B55", 1.2);
      for (const [x, kind] of [[0.55, "crystal"], [1.5, "amber"], [2.45, "ammonite"]]) s += S.at(x, f.h / 2, 68, `<g transform="scale(0.42)">${ICON[kind](30)}</g>`);
      s += S.box(0.08, 0.14, f.w - 0.16, f.h - 0.28, 64, 30, [GLASS, "#CFE7EC44", "#CFE7EC55"], 1.1);
      return s;
    },
    // たまごの す（ジオラマ。たまご 5こ・かえった あかちゃん）
    eggnest(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.box(0.05, 0.05, f.w - 0.1, f.h - 0.1, 0, 24, ["#C9B28C", "#B39669", "#9C815D"]) + S.ellipse(cx, cy, 24, Math.min(f.w, f.h) / 2 - 0.15, "#B98E5A", 1.6) + S.ellipse(cx, cy, 25, Math.min(f.w, f.h) / 2 - 0.35, "#9C7448", 1.2);
      for (const [x, y] of [[-0.45, -0.1], [0.05, -0.25], [0.5, -0.05], [-0.2, 0.2]]) s += S.at(cx + x, cy + y, 26, `<ellipse cy="-9" rx="8" ry="11" fill="#F4ECD8" ${S.st(1.4)}/><path d="M-4,-14 q2,-2 4,0" stroke="#D9C7A0" stroke-width="1.4" fill="none"/>`);
      s += S.at(cx + 0.35, cy + 0.25, 26, `<path d="M-9,0 q0,-10 9,-12 q9,2 9,12 Z" fill="#F4ECD8" ${S.st(1.4)}/><path d="M-9,0 l3,-4 l3,3 l3,-4 l3,3 l3,-4 l3,4" fill="none" stroke="#D9C7A0" stroke-width="1.2"/>`);
      s += S.poly([[0.3, f.h - 0.05, 6], [f.w - 0.3, f.h - 0.05, 6], [f.w - 0.3, f.h - 0.05, 20], [0.3, f.h - 0.05, 20]], "#FFF8EA", 1.1);
      return s;
    },
    // けんきゅうしつ: うしろの たな（ひきだし・びん・ほね）
    labback(S, f) {
      let s = S.box(0.04, 0.05, f.w - 0.08, 0.7, 0, 160, ["#EEF2F4", "#D6DDE2", "#C2CBD2"]);
      for (let i = 0; i < f.w * 2; i++) for (let j = 0; j < 3; j++) { const x0 = 0.1 + i * ((f.w - 0.2) / (f.w * 2)), x1 = x0 + (f.w - 0.2) / (f.w * 2) - 0.04, z0 = 8 + j * 30; s += S.poly([[x0, 0.75, z0], [x1, 0.75, z0], [x1, 0.75, z0 + 26], [x0, 0.75, z0 + 26]], j === 1 && i % 3 === 0 ? "#E6D2AE" : "#DDE3E7", 1) + S.line([[(x0 + x1) / 2 - 0.08, 0.75, z0 + 14], [(x0 + x1) / 2 + 0.08, 0.75, z0 + 14]], "#8D949B", 2); }
      s += S.box(0.06, 0.1, f.w - 0.12, 0.62, 100, 4, ["#C9CED3", "#AEB5BC", "#959DA5"], 1);
      for (let i = 0; i < f.w; i++) { const x = 0.4 + i * ((f.w - 0.8) / Math.max(1, f.w - 1)); s += i % 3 === 1 ? S.at(x, 0.45, 104, `<g transform="scale(0.36)">${ICON.skull(30)}</g>`) : S.cyl(x, 0.45, 0.13, 104, 30, i % 2 ? ["#CFE7EC", "#A9CFDB"] : ["#F7E7B6", "#E3CD8E"], 1.1); }
      return s;
    },
    // けんきゅうしつ: さぎょうの テーブル（すなぶくろの 上の あたまの ほね・ルーペの ライト・けんびきょう）
    labtable(S, f) {
      let s = S.box(0.08, 0.08, f.w - 0.16, f.h - 0.16, 0, 72, ["#F4F6F7", "#D6DDE2", "#C2CBD2"]) + S.box(0.04, 0.04, f.w - 0.08, f.h - 0.08, 72, 5, ["#5E6B7A", "#4E5A68", "#414C58"], 1.2);
      s += S.ellipse(f.w / 2 - 0.2, f.h / 2, 77, 0.55, "#C9B28C", 1.2) + S.at(f.w / 2 - 0.2, f.h / 2, 82, `<g transform="scale(0.7)">${ICON.skull(30)}</g>`);
      s += S.line([[f.w - 0.4, 0.3, 77], [f.w - 0.4, 0.3, 140], [f.w / 2 - 0.1, f.h / 2, 150]], "#8D949B", 3) + S.at(f.w / 2 - 0.1, f.h / 2, 146, `<ellipse rx="14" ry="6" fill="#CFE7EC" ${S.st(1.4)}/>`);
      s += S.box(0.25, f.h - 0.6, 0.4, 0.4, 77, 10, ["#5E6B7A", "#4E5A68", "#414C58"], 1) + S.line([[0.45, f.h - 0.4, 87], [0.45, f.h - 0.4, 118]], "#3E4652", 4) + S.cyl(0.45, f.h - 0.4, 0.06, 112, 12, ["#3E4652", "#2F3640"], 1);
      return s;
    },
    // けんきゅうしつの ガラス（みなみ・ひがし）
    labglass(S, f) {
      const H = f.height || 210;
      const E = 0.9;
      if (f.side === "e") return S.poly([[E, 0, 0], [E, f.h, 0], [E, f.h, H], [E, 0, H]], "#DDF1F455", 1.4) + S.line([[E, 0, H], [E, f.h, H]], "#8D949B", 5) + S.line([[E, 0, 0], [E, f.h, 0]], "#8D949B", 4) + [1, 2, 3, 4].map((y) => S.line([[E, y, 0], [E, y, H]], "#A7B3BA", 2)).join("") + S.line([[E, 0.8, H * 0.7], [E, 1.6, H * 0.45]], "#FFFFFF", 4);
      let s = S.poly([[0, E, 0], [f.w + E, E, 0], [f.w + E, E, H], [0, E, H]], "#DDF1F455", 1.4) + S.line([[0, E, H], [f.w + E, E, H]], "#8D949B", 5) + S.line([[0, E, 0], [f.w + E, E, 0]], "#8D949B", 4);
      for (let x = 1.5; x < f.w; x += 1.5) s += S.line([[x, E, 0], [x, E, H]], "#A7B3BA", 2);
      s += S.line([[0.6, E, H * 0.75], [1.4, E, H * 0.5]], "#FFFFFF", 4) + S.line([[5.2, E, H * 0.7], [5.8, E, H * 0.52]], "#FFFFFF", 3);
      s += S.poly([[f.w / 2 - 1.3, E, H - 40], [f.w / 2 + 1.3, E, H - 40], [f.w / 2 + 1.3, E, H - 12], [f.w / 2 - 1.3, E, H - 12]], "#FFFDF6", 1.2);
      return s;
    },
    // きふの まどぐち（カウンター・ほねの マーク）
    mudesk(S, f) {
      let s = S.box(0.04, 0.12, f.w - 0.08, f.h - 0.24, 0, 64, ["#FFF8EA", "#E3D7C2", "#CDBEA4"]) + S.box(0, 0.08, f.w, f.h - 0.16, 64, 6, WOOD);
      s += S.at(f.w / 2, f.h - 0.12, 40, `<g transform="scale(0.5)"><path d="M-30,-4 L30,-4 L30,4 L-30,4 Z" fill="${BONE}" ${st(1.6)}/><circle cx="-30" cy="-5" r="7" fill="${BONE}" ${st(1.6)}/><circle cx="-30" cy="5" r="7" fill="${BONE}" ${st(1.6)}/><circle cx="30" cy="-5" r="7" fill="${BONE}" ${st(1.6)}/><circle cx="30" cy="5" r="7" fill="${BONE}" ${st(1.6)}/></g>`);
      return s;
    },
    // ほねの ひみつ（だい・あたまの ほね・スキャナーの わ）
    skullscan(S, f) {
      const cx = f.w / 2, cy = f.h / 2;
      let s = S.ellipse(cx, cy, 0, 0.9, "#00000014", 0) + S.box(0.25, 0.25, f.w - 0.5, f.h - 0.5, 0, 60, ["#3E4A56", "#2F3B47", "#26303A"]);
      s += S.at(cx, cy, 66, `<g transform="scale(0.95)">${ICON.skull(32)}</g>`);
      s += S.at(cx, cy, 60, `<path d="M-44,0 A44,30 0 0 1 44,0" fill="none" stroke="#8D949B" stroke-width="7"/><path d="M-44,0 A44,30 0 0 1 44,0" fill="none" ${S.st(1.2)}/>`);
      return s;
    },
    // かせきほり たいけん（すなば。うまった ほねの レプリカ・シャベル）
    digbox(S, f) {
      let s = S.box(0, 0, f.w, f.h, 0, 26, WOOD) + S.poly([[0.15, 0.15, 26.5], [f.w - 0.15, 0.15, 26.5], [f.w - 0.15, f.h - 0.15, 26.5], [0.15, f.h - 0.15, 26.5]], "#EAD7A8", 1.2);
      for (let i = 0; i < 14; i++) s += S.ellipse(0.4 + ((i * 0.73) % (f.w - 0.8)), 0.4 + ((i * 0.41) % (f.h - 0.8)), 27, 0.07, "#D9C28E", 0);
      for (const [x, y, a] of [[1.1, 1.0, 20], [2.6, 1.8, -30], [1.8, 2.2, 75]]) s += S.at(x, y, 27, `<g transform="rotate(${a}) scale(1 0.55)"><path d="M-16,-3 L16,-3 L16,3 L-16,3 Z" fill="${BONE}" ${S.st(1.1)}/><circle cx="-16" r="4.5" fill="${BONE}" ${S.st(1.1)}/><circle cx="16" r="4.5" fill="${BONE}" ${S.st(1.1)}/></g>`);
      s += S.at(3.2, 0.7, 27, `<g transform="scale(0.5 0.32)">${ICON.ammonite(28)}</g>`);
      for (const [x, y, c] of [[0.5, f.h - 0.4, "#E8575A"], [f.w - 0.6, 0.5, "#5A9BC4"]]) s += S.at(x, y, 28, `<path d="M0,0 L10,-14" stroke="#A9754A" stroke-width="3"/><path d="M8,-12 l8,-10 l6,6 l-10,8 Z" fill="${c}" ${S.st(1)}/>`);
      return s;
    },
    // さわれる かせき（ひくい テーブル・ぬの・かせき 3つ）
    touchtable(S, f) {
      let s = S.box(0.1, 0.1, f.w - 0.2, f.h - 0.2, 0, 54, ["#E6C9A0", "#C9A16E", "#B38A58"]) + S.poly([[0.16, 0.16, 54.5], [f.w - 0.16, 0.16, 54.5], [f.w - 0.16, f.h - 0.16, 54.5], [0.16, f.h - 0.16, 54.5]], "#5A87A8", 1.2);
      s += S.at(0.6, 0.7, 56, `<g transform="scale(0.5 0.34)">${ICON.ammonite(28)}</g>`) + S.at(1.4, 0.9, 56, `<g transform="scale(0.45 0.3)">${ICON.tooth(28)}</g>`) + S.at(1.0, 1.4, 56, `<g transform="rotate(-15) scale(0.6 0.34)"><path d="M-20,-3 L20,-3 L20,3 L-20,3 Z" fill="${BONE}" ${S.st(1.4)}/><circle cx="-20" r="5" fill="${BONE}" ${S.st(1.4)}/><circle cx="20" r="5" fill="${BONE}" ${S.st(1.4)}/></g>`);
      s += S.box(f.w - 0.5, f.h - 0.45, 0.32, 0.28, 54, 30, ["#FFF8EA", "#E3D7C2", "#CDBEA4"], 1) + S.at(f.w - 0.34, f.h - 0.3, 72, `<path d="M-5,6 v-10 q0,-3 2,-3 q2,0 2,3 v3 q0,-3 2,-3 q2,0 2,3 v1 q0,-3 2,-3 q2,0 2,3 v6 q0,6 -6,6 h-2 q-4,0 -6,-6 Z" fill="#F4D3B5" ${S.st(1)}/>`);
      return s;
    },
    // ジュラきの もりの ジオラマ（シダ・ソテツ・いけ・コンプソグナトゥスと トカゲ）
    jdiorama(S, f) {
      let s = S.box(0.04, 0.04, f.w - 0.08, f.h - 0.08, 0, 30, ["#9DB38A", "#7E9A6E", "#6E8A5E"]) + S.ellipse(f.w * 0.7, f.h * 0.6, 30.5, 0.6, "#8FCBDA", 1.2);
      for (const [x, y, k] of [[0.5, 0.5, 1.1], [1.4, 0.4, 0.9], [3.3, 0.5, 1.2], [0.7, 2.2, 0.8]]) s += S.at(x, y, 30, `<g transform="scale(${k})"><path d="M0,0 L0,-34" ${S.st(2)}/>${[0, 1, 2, 3, 4].map((i) => `<path d="M0,-${34 - i * 2} q${-18 + i * 9},-${10 - i} ${-26 + i * 13},${4 + i * 2}" fill="none" stroke="#5E9150" stroke-width="3"/>`).join("")}</g>`);
      for (const [x, y] of [[2.4, 0.6], [0.4, 1.4]]) s += S.at(x, y, 30, `<path d="M-10,0 q-6,-14 4,-24 q2,12 2,16 q6,-12 14,-14 q-2,12 -14,22" fill="#86AE78" ${S.st(1.2)}/>`);
      s += S.at(2.0, 1.7, 30, `<path d="M-14,-4 q4,-10 14,-8 q8,-8 14,-4 q-4,4 -10,4 l-2,8 l-3,-6 l-6,6 l0,-6 Z" fill="#C79A76" ${S.st(1.2)}/><circle cx="12" cy="-12" r="1.2" fill="${INK}"/>`);
      s += S.at(2.9, 2.0, 30, `<path d="M-8,0 q8,-4 16,0 q-8,3 -16,0 Z M8,0 l6,-1" fill="#9DC08B" ${S.st(1)}/>`);
      s += S.poly([[0.4, f.h - 0.04, 8], [f.w - 0.4, f.h - 0.04, 8], [f.w - 0.4, f.h - 0.04, 24], [0.4, f.h - 0.04, 24]], "#FFF8EA", 1.1);
      return s;
    },
    // にほんの きょうりゅうの いた（ちずと しるし。まえは +x）
    japanboard(S, f) {
      let s = S.box(0.42, 0.2, 0.16, f.h - 0.4, 0, 60, "#8D8A92");
      s += S.poly([[0.5, 0, 60], [0.5, f.h, 60], [0.5, f.h, 158], [0.5, 0, 158]], "#FFFDF6", 1.8) + S.poly([[0.5, 0.1, 128], [0.5, f.h - 0.1, 128], [0.5, f.h - 0.1, 152], [0.5, 0.1, 152]], ERA.japan, 1.2);
      return s;
    },
  };

  // ---- うごく ところ ----
  const L = {
    dinostand(ctx, sc, f, off) {
      const d = typeof Fossils !== "undefined" && Fossils.dino(f.dino); if (!d) return;
      const T = IsoVenue.T, ww = art.standW(f, d), [, , bw, bh] = d.art.box, h = (ww * bh) / bw, bits = art.bits(d);
      const pic = art.skelImg(sc, d, bits, ww, false); if (pic) f._img = { bits, c: pic };
      const x0 = f.x + (f.w - ww / T) / 2;
      if (f._img) { ctx.save(); art.plane(ctx, sc, off, "y", f.y + f.h / 2, x0, 26 + h); if (f.flip) { ctx.translate(ww, 0); ctx.scale(-1, 1); } ctx.drawImage(f._img.c, 0, 0, ww, h); ctx.restore(); }
      // まえの ロープの さく（ほねの まえ）
      const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), s = sc.s, y = f.y + f.h - 0.04;
      ctx.strokeStyle = "#B0413E"; ctx.lineWidth = 2.6 * s; ctx.beginPath();
      const posts = [f.x + 0.12, f.x + f.w / 2, f.x + f.w - 0.12];
      for (let i = 0; i < posts.length - 1; i++) { const a = P(posts[i], y, 30), b = P(posts[i + 1], y, 30), m = P((posts[i] + posts[i + 1]) / 2, y, 22); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(m.x, m.y, b.x, b.y); }
      ctx.stroke();
      for (const x of posts) { const a = P(x, y, 0), b = P(x, y, 32); ctx.strokeStyle = "#C9A24B"; ctx.lineWidth = 3.4 * s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.fillStyle = "#E2C26A"; ctx.beginPath(); ctx.arc(b.x, b.y, 3 * s, 0, 7); ctx.fill(); }
      // ねふだ（なまえ と ほねの かず）
      const have = bits.split("").filter((b) => b === "1").length, total = bits.length, done = have === total;
      MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.08, 21, d.name, 11, Math.min(2.1, f.w * 0.84) * T * 0.92);
      MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.08, 15, done ? "かんせい！" : "ほね " + have + " / " + total, 9, Math.min(2.1, f.w * 0.84) * T * 0.9, done ? "#B0413E" : "#6E5E48");
    },
    robotrex(ctx, sc, f, off) {
      const t = G.t, roar = t - (art.roarT || -99) < 1.6 || (t % 11) < 1.2, frame = roar ? 2 : (t % 4.3) < 0.14 ? 3 : Math.floor(t / 0.9) % 2, pic = art.robotImg(sc, frame, false); if (!pic) return;
      const s = sc.s, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2 + 0.2, f.y + f.h / 2, 22), off), W = 306 * 1.05, H = 190 * 1.05, bob = Math.sin(t * 2.2) * 2;
      ctx.drawImage(pic, q.x - (W * s) * (148 / 306) - 8 * s, q.y - H * s * (186 / 190) + bob * s, W * s, H * s);
    },
    futaba(ctx, sc, f, off) {
      const pic = art.futabaImg(sc, false); if (!pic) return;
      const T = IsoVenue.T, t = G.t, w = f.w * T, h = (w * 80) / 258, sway = Math.sin(t * 0.6) * 4, z = (f.z || 205) + h + sway, s = sc.s;
      // つりさげの ワイヤー（上へ）
      for (const u of [0.22, 0.5, 0.78]) { const a = sc.toScreen(IsoVenue.p(f.x + f.w * u, f.y + f.h / 2, z - h * 0.55), off), b = sc.toScreen(IsoVenue.p(f.x + f.w * u, f.y + f.h / 2, z + 260), off); const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, "rgba(90,90,100,.7)"); g.addColorStop(1, "rgba(90,90,100,0)"); ctx.strokeStyle = g; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      ctx.save(); art.plane(ctx, sc, off, "y", f.y + f.h / 2, f.x, z); ctx.drawImage(pic, 0, 0, w, h); ctx.restore();
    },
    fossilcase(ctx, sc, f, off) { textX(ctx, sc, off, f.x + f.w - 0.1, f.y + f.h / 2, 33, f.label, 10, (f.h - 0.6) * IsoVenue.T); },
    digsite(ctx, sc, f, off) {
      // はけで はらう すな（ちいさな けむり）
      const t = G.t, s = sc.s;
      for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1, q = sc.toScreen(IsoVenue.p(f.x + 2.9 + Math.sin(i) * 0.2, f.y + 2.1, -36 + k * 30), off); ctx.fillStyle = `rgba(230,214,180,${(0.6 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, (3 + k * 6) * s, 0, 7); ctx.fill(); }
    },
    erasign(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + 0.55, f.y + 0.52, 88, f.label, 14, 0.72 * IsoVenue.T); },
    mureception(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + 1.6, f.y + f.h - 0.08, 60, "うけつけ", 14, 1.8 * IsoVenue.T); },
    mudirectory(ctx, sc, f, off) {
      const T = IsoVenue.T, w = (f.w - 0.3) * T;
      [["3F いりぐち・カフェ", 149], ["2F ちきゅうと いのち", 117], ["1F きょうりゅうの せかい", 85]].forEach(([t, z]) => MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.52, z, t, 11, w));
    },
    mucafebar(ctx, sc, f, off) { textX(ctx, sc, off, f.x + f.w - 0.06, f.y + f.h / 2, 62, "カフェ ジュラ", 15, (f.h - 0.8) * IsoVenue.T); },
    lifecase(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.1, 42, f.label, 9, (f.w - 0.6) * IsoVenue.T); },
    globe(ctx, sc, f, off) {
      const s = sc.s, t = G.t, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2, f.y + f.h / 2, 104), off), R = 36 * s;
      ctx.save(); ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, 7); ctx.fillStyle = "#7FC6DE"; ctx.fill(); ctx.clip();
      const k = (t * 0.12) % 1;
      for (let i = -1; i < 3; i++) { const x = q.x - R + (i + k) * R * 1.4; ctx.fillStyle = "#9DC08B"; ctx.beginPath(); ctx.ellipse(x, q.y - R * 0.3, R * 0.35, R * 0.28, 0.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + R * 0.35, q.y + R * 0.35, R * 0.22, R * 0.3, -0.4, 0, 7); ctx.fill(); }
      const g = ctx.createRadialGradient(q.x - R * 0.4, q.y - R * 0.4, R * 0.1, q.x, q.y, R); g.addColorStop(0, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(0,0,0,.18)"); ctx.fillStyle = g; ctx.fillRect(q.x - R, q.y - R, R * 2, R * 2);
      ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * s * 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, 7); ctx.stroke();
    },
    volcano(ctx, sc, f, off) {
      MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.1, 21, "かざんの もけい", 10, (f.w - 0.7) * IsoVenue.T);
      const s = sc.s, t = G.t, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2, f.y + f.h / 2, 40), off);
      ctx.fillStyle = `rgba(255,170,90,${(0.35 + 0.25 * Math.sin(t * 3)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(q.x, q.y - 57 * s, 14 * s, 5 * s, 0, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i / 4) % 1; ctx.fillStyle = `rgba(232,226,218,${(0.85 * (1 - k)).toFixed(2)})`; ctx.strokeStyle = `rgba(31,29,27,${(0.5 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(q.x + Math.sin(k * 5 + i) * 6 * s + k * 10 * s, q.y - (62 + k * 60) * s, (6 + k * 12) * s, 0, 7); ctx.fill(); ctx.stroke(); }
    },
    mineralcase(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.12, 32, f.label, 10, (f.w - 0.4) * IsoVenue.T, "#FFF8EA"); const t = G.t; for (let i = 0; i < 3; i++) { const a = Math.max(0, Math.sin(t * 2 + i * 2.1)); if (a < 0.5) continue; const q = sc.toScreen(IsoVenue.p(f.x + 0.5 + i * 0.95, f.y + f.h / 2, 82), off); ctx.globalAlpha = (a - 0.5) * 2; FX.star(ctx, q.x + 6 * sc.s, q.y - 10 * sc.s, 5 * sc.s, "#FFFFFF"); ctx.globalAlpha = 1; } },
    eggnest(ctx, sc, f, off) {
      // かえった あかちゃんが かおを だす
      const t = G.t, s = sc.s, up = Math.max(0, Math.sin(t * 1.2)) * 6, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2 + 0.35, f.y + f.h / 2 + 0.25, 30), off);
      ctx.save(); ctx.translate(q.x, q.y - up * s); ctx.scale(s, s); ctx.fillStyle = "#9DC08B"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, -10, 8, 7, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-3, -12, 1.4, 0, 7); ctx.arc(3, -12, 1.4, 0, 7); ctx.fill(); ctx.restore();
      MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.06, 13, "たまご", 10, (f.w - 0.6) * IsoVenue.T);
    },
    labtable(ctx, sc, f, off) {
      // ちいさな ドリルの こな
      const t = G.t, s = sc.s;
      for (let i = 0; i < 4; i++) { const k = (t * 1.3 + i / 4) % 1, q = sc.toScreen(IsoVenue.p(f.x + f.w / 2 - 0.05 + Math.cos(i * 1.7) * 0.15, f.y + f.h / 2 + Math.sin(i * 1.7) * 0.15, 92 + k * 18), off); ctx.fillStyle = `rgba(240,230,205,${(0.8 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, (1.6 + k * 3) * s, 0, 7); ctx.fill(); }
      const q = sc.toScreen(IsoVenue.p(f.x + f.w / 2 - 0.1, f.y + f.h / 2, 150), off); if (Math.floor(t * 4) % 2) { ctx.fillStyle = "rgba(255,244,190,.35)"; ctx.beginPath(); ctx.ellipse(q.x, q.y + 30 * s, 30 * s, 12 * s, 0, 0, 7); ctx.fill(); }
    },
    labglass(ctx, sc, f, off) { if (f.side !== "e") MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.9, (f.height || 210) - 26, "けんきゅうしつ", 14, 2.4 * IsoVenue.T); },
    mudesk(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.1, 54, "きふの まどぐち", 12, (f.w - 0.3) * IsoVenue.T); },
    skullscan(ctx, sc, f, off) {
      const t = G.t, s = sc.s, k = (Math.sin(t * 1.4) + 1) / 2, a = sc.toScreen(IsoVenue.p(f.x + 0.45 + k * (f.w - 0.9), f.y + f.h / 2, 64), off), b = sc.toScreen(IsoVenue.p(f.x + 0.45 + k * (f.w - 0.9), f.y + f.h / 2, 130), off);
      const g = ctx.createLinearGradient(a.x - 8 * s, 0, a.x + 8 * s, 0); g.addColorStop(0, "rgba(120,220,255,0)"); g.addColorStop(0.5, "rgba(120,220,255,.75)"); g.addColorStop(1, "rgba(120,220,255,0)");
      ctx.fillStyle = g; ctx.fillRect(a.x - 8 * s, b.y, 16 * s, a.y - b.y);
    },
    digbox(ctx, sc, f, off) {
      const k = G.t - (art.digT || -99); if (k > 2.5) return;
      for (let i = 0; i < 6; i++) { const q = sc.toScreen(IsoVenue.p(f.x + 0.8 + (i % 3) * 1.1, f.y + 0.8 + Math.floor(i / 3) * 1.1, 30 + k * 30), sc._off || 0); ctx.globalAlpha = Math.max(0, 1 - k / 2.5); FX.star(ctx, q.x, q.y, 5 * sc.s, "#FFF2AF"); ctx.globalAlpha = 1; }
    },
    touchtable(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.1, 30, "さわって みよう", 9, (f.w - 0.3) * IsoVenue.T); },
    jdiorama(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + f.h - 0.04, 16, "ジュラきの もり", 11, (f.w - 0.9) * IsoVenue.T); },
    japanboard(ctx, sc, f, off) {
      textX(ctx, sc, off, f.x + 0.5, f.y + f.h / 2, 140, "にほんの きょうりゅう", 11, (f.h - 0.2) * IsoVenue.T, "#FFFFFF");
      // ちずの え（ボードの 面に）
      const pic = art.iconImg(sc, "japan", false); if (!pic) return;
      ctx.save(); art.plane(ctx, sc, off, "x", f.x + 0.5, f.y + f.h - 0.1, 124); ctx.drawImage(pic, 4, 0, (f.h - 0.2) * IsoVenue.T - 8, 60); ctx.restore();
    },
  };

  // ---- ゆかの もよう（あしあと・かげ・いのちの みち）----
  function decal(g, r, d) {
    const T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B, P = (x, y) => IsoVenue.p(x, y, 0);
    if (d.kind === "foot") {
      // 3ぼんゆびの あしあと（ゆかの 面に）。ang は タイルの むき（0 = +x）
      const c = P(d.x, d.y), k = (d.size || 0.5) * T;
      g.save(); g.translate(c.x, c.y); g.transform(A, B, -A, B, 0, 0); g.rotate(d.ang || 0); g.scale(k / 40, k / 40); if (d.left) g.scale(1, -1);
      g.fillStyle = d.fossil ? "rgba(140,112,78,.6)" : "rgba(112,146,84,.72)"; g.beginPath();
      g.moveTo(-14, 0); g.quadraticCurveTo(-16, 10, -4, 10); g.lineTo(26, 12); g.quadraticCurveTo(30, 10, 26, 8); g.lineTo(6, 4); g.lineTo(30, 0); g.quadraticCurveTo(34, -2, 30, -4); g.lineTo(6, -4); g.lineTo(26, -8); g.quadraticCurveTo(30, -10, 26, -12); g.lineTo(-4, -10); g.quadraticCurveTo(-16, -10, -14, 0); g.closePath(); g.fill();
      g.restore();
    } else if (d.kind === "shadow") {
      const c = P(d.x, d.y), gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, d.rx * T * A); gr.addColorStop(0, "rgba(60,48,36,.18)"); gr.addColorStop(1, "rgba(60,48,36,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(c.x, c.y, d.rx * T * A * 1.2, d.ry * T * B * 1.8, 0, 0, 7); g.fill();
    } else if (d.kind === "lifeline") {
      // いのちの みち（ゆかの ふとい せん と ふし）
      const a = P(d.x0, d.y), b = P(d.x1, d.y); g.strokeStyle = "#3C352E"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.lineCap = "butt";
      for (const x of d.nodes) { const c = P(x, d.y); g.fillStyle = "#F2B347"; g.strokeStyle = "#3C352E"; g.lineWidth = 3; g.beginPath(); g.ellipse(c.x, c.y, 13, 7, 0, 0, 7); g.fill(); g.stroke(); }
    } else MallArt.decal.call(this, g, r, d);
  }

  // ---- かべ（静止画）: ドーム・かせきの いた・年表・ちそう・かんばん・トンネル・カフェ ----
  function wallPart(p, H, r, side) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, R = (x, y, ww, hh, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(ww)}" height="${f2(hh)}" fill="${fill}" stroke="${INK}" stroke-width="1.6" ${extra}/>`;
    const at = (x, y, k, inner) => `<g transform="translate(${f2(x)} ${f2(y)}) scale(${k})">${inner}</g>`, gid = "dh" + r.id + side + Math.round(p.from * 10);
    let s = "";
    if (p.kind === "mustone") {
      const c = p.light ? ["#E9E1D2", "#DED4C2"] : ["#B9A992", "#A9997F"];
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="${c[0]}"/>`;
      for (let row = 0, z = 12; z < H; row++, z += 36) for (let x = u0 - (row % 2) * 30; x < u0 + w; x += 60) s += `<rect x="${f2(Math.max(u0, x))}" y="${f2(V(z + 36))}" width="${f2(Math.min(60, u0 + w - Math.max(u0, x)))}" height="36" fill="${(row + Math.round(x / 60)) % 3 ? c[0] : c[1]}" stroke="${p.light ? "#CFC4B1" : "#8E7F68"}" stroke-width="1.2"/>`;
    } else if (p.kind === "dome") {
      // ドームの なか: そら・とおくの 山と かざん・しんようじゅ・シダ・とぶ よくりゅう（うごく ぶぶんは under）
      s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FA7C9"/><stop offset=".6" stop-color="#C9DDE4"/><stop offset="1" stop-color="#EBDDBB"/></linearGradient></defs><rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="url(#${gid})"/>`;
      for (let i = 0; i < 9; i++) { const x = u0 + (i * 211) % w, y = 40 + (i * 37) % 70; s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${46 + (i % 3) * 14}" ry="11" fill="#FFFFFF" opacity=".55"/>`; }
      s += `<path d="M${f2(u0)},${f2(V(150))} ` + Array.from({ length: 12 }, (_, i) => `Q${f2(u0 + w * (i + 0.5) / 12)},${f2(V(178 + (i % 3) * 22))} ${f2(u0 + w * (i + 1) / 12)},${f2(V(150 + (i % 2) * 10))}`).join(" ") + ` V${H} H${f2(u0)} Z" fill="#A9B7C2" opacity=".85"/>`;
      const vx = u0 + w * 0.68; s += `<path d="M${f2(vx - 150)},${f2(V(140))} L${f2(vx - 26)},${f2(V(250))} L${f2(vx + 26)},${f2(V(250))} L${f2(vx + 150)},${f2(V(140))} Z" fill="#8E7F86" stroke="${INK}" stroke-width="1.4"/><path d="M${f2(vx - 26)},${f2(V(250))} L${f2(vx - 12)},${f2(V(222))} L${f2(vx)},${f2(V(240))} L${f2(vx + 12)},${f2(V(220))} L${f2(vx + 26)},${f2(V(250))} Z" fill="#F2884B" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<path d="M${f2(u0)},${f2(V(100))} ` + Array.from({ length: 16 }, (_, i) => `Q${f2(u0 + w * (i + 0.5) / 16)},${f2(V(124 + (i % 2) * 18))} ${f2(u0 + w * (i + 1) / 16)},${f2(V(100))}`).join(" ") + ` V${H} H${f2(u0)} Z" fill="#7E9A6E"/>`;
      for (let i = 0; i < Math.floor(w / 70); i++) { const x = u0 + 30 + i * 70 + (i % 3) * 8, hgt = 90 + (i % 4) * 26; s += `<path d="M${f2(x)},${f2(V(40))} L${f2(x)},${f2(V(40 + hgt))}" stroke="#6E5E48" stroke-width="5"/><path d="M${f2(x - 24)},${f2(V(40 + hgt * 0.45))} L${f2(x)},${f2(V(40 + hgt + 14))} L${f2(x + 24)},${f2(V(40 + hgt * 0.45))} Z" fill="${["#5E9150", "#6E9F5C", "#4F7C43"][i % 3]}" stroke="${INK}" stroke-width="1.2"/>`; }
      for (let i = 0; i < Math.floor(w / 46); i++) { const x = u0 + 10 + i * 46; s += `<path d="M${f2(x)},${f2(V(12))} q-14,-30 -4,-58 q4,26 4,40 q8,-34 26,-40 q-8,30 -26,58" fill="${i % 2 ? "#86AE78" : "#9DC08B"}" stroke="${INK}" stroke-width="1.2"/>`; }
      s += R(u0 + w * 0.08, V(H - 26), w * 0.36, 44, "#FFF8EA", `rx="10" opacity=".95"`);
    } else if (p.kind === "fossilslab") {
      // いわの いたに うまった かせき（ほんものの かせきを かべに はめこんだ ダイノストリート）
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="#B9A992"/>`;
      s += `<path d="M${f2(u0 + 10)},${f2(V(60))} L${f2(u0 + 6)},${f2(V(240))} L${f2(u0 + w * 0.4)},${f2(V(252))} L${f2(u0 + w - 8)},${f2(V(236))} L${f2(u0 + w - 6)},${f2(V(56))} L${f2(u0 + w * 0.55)},${f2(V(48))} Z" fill="#D8CBB4" stroke="${INK}" stroke-width="1.8"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${f2(u0 + 14)},${f2(V(80 + i * 34))} q${f2(w * 0.4)},${f2(-6 + (i % 2) * 10)} ${f2(w - 28)},${f2(2)}" fill="none" stroke="#C4B59B" stroke-width="2"/>`;
      s += at(u0 + w / 2, V(150), 1.45, (ICON[p.fossil] || ICON.ammonite)(34));
      s += R(u0 + w / 2 - 40, V(44), 80, 22, "#FFF8EA", `rx="5"`);
    } else if (p.kind === "timeline") {
      // いのちの れきし: 8まいの パネル（ひがし → にし が むかし → いま）
      const keys = ["earth", "stromatolite", "anomalocaris", "dunkle", "ichthyostega", "archaeo", "meteorite", "mammoth"], cols = ["#6B5B8C", "#4F6E9C", "#3E8FB0", "#4FA39A", "#6FAE6E", "#E2A15A", "#D9736B", "#B98E5A"];
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="#EFE7D8"/>`;
      keys.forEach((k, i) => {
        const x0 = (31 - i * 3 - p.from) * T + u0 - 18, pw = 2 * T + 36;
        s += R(x0, V(262), pw, 196, cols[i], `rx="10"`) + R(x0 + 8, V(206), pw - 16, 104, "#FFF8EA", `rx="8"`) + at(x0 + pw / 2, V(154), 1.0, (ICON[k] || ICON.globe)(36));
      });
      s += `<path d="M${f2(u0 + 10)},${f2(V(40))} H${f2(u0 + w - 10)}" stroke="#3C352E" stroke-width="5"/><path d="M${f2(u0 + 10)},${f2(V(40))} l14,-8 v16 Z" fill="#3C352E"/>`;
    } else if (p.kind === "strata") {
      // ちそうの かべ（したほど ふるい・かせきが うまって いる）
      const cols = ["#EAD9B3", "#D9BE91", "#C9A877", "#B79366", "#A3805A", "#8E6E4F", "#7A5E44"];
      cols.forEach((c, i) => { const z1 = 280 - i * 38, z0 = z1 - 38; s += `<path d="M${f2(u0)},${f2(V(z1))} ` + Array.from({ length: 8 }, (_, k) => `Q${f2(u0 + w * (k + 0.5) / 8)},${f2(V(z1 + ((k + i) % 2 ? 6 : -6)))} ${f2(u0 + w * (k + 1) / 8)},${f2(V(z1))}`).join(" ") + ` V${f2(V(z0))} H${f2(u0)} Z" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`; });
      for (const [k, x, z, sc2] of [["ammonite", 0.2, 120, 0.6], ["trilobite", 0.45, 50, 0.55], ["fishfossil", 0.7, 160, 0.6], ["shida", 0.85, 210, 0.55], ["tooth", 0.32, 200, 0.5], ["umiyuri", 0.6, 92, 0.5]]) s += at(u0 + w * x, V(z), sc2, ICON[k](30));
      s += R(u0 + 12, V(296), 150, 26, "#FFF8EA", `rx="6"`) + R(u0 + w - 162, V(46), 150, 26, "#FFF8EA", `rx="6"`);
    } else if (p.kind === "mubanner") {
      // かんばん: きょうりゅう はくぶつかん（なまえは canvas）・きょうりゅうの シルエット
      s += R(u0 + 6, V(286), w - 12, 120, "#FFF8EA", `rx="14"`) + R(u0 + 14, V(278), w - 28, 104, "#F1E1C2", `rx="10"`);
      s += at(u0 + 70, V(226), 1.2, ICON.ammonite(30));
      const sil = (x, y, k, d, c) => at(x, y, k, `<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`);
      s += sil(u0 + w - 120, V(176), 1, "M-70,0 Q-60,-10 -40,-12 Q-40,-60 -30,-90 Q-24,-100 -16,-92 Q-20,-60 -16,-18 Q20,-26 50,-10 Q80,-4 96,4 Q60,6 30,4 L28,16 L18,16 L16,4 L-20,4 L-22,16 L-32,16 L-34,2 Z", "#9DC08B");
      s += sil(u0 + w * 0.36, V(160), 0.8, "M-60,-30 Q-70,-44 -50,-46 Q-30,-46 -24,-36 Q0,-40 26,-26 Q50,-16 70,-12 Q40,-6 20,-6 L22,10 L12,10 L8,-4 L-8,-4 L-6,10 L-16,10 L-18,-8 Q-40,-14 -60,-30 Z", "#E2A15A");
    } else if (p.kind === "mutunnel") {
      // 1F: エスカレーターが のぼって いく トンネル（かべの 上の あな）・3F: したへ おりる あんない
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="${p.up ? "#9C8A72" : "#E7DDCB"}"/>`;
      if (p.up) s += `<path d="M${f2(u0 + 20)},${f2(V(240))} Q${f2(u0 + w / 2)},${f2(V(360))} ${f2(u0 + w - 20)},${f2(V(240))} V${f2(V(220))} H${f2(u0 + 20)} Z" fill="#2E2A30" stroke="${INK}" stroke-width="2"/>` + `<path d="M${f2(u0 + 20)},${f2(V(240))} Q${f2(u0 + w / 2)},${f2(V(360))} ${f2(u0 + w - 20)},${f2(V(240))}" fill="none" stroke="#C9B28C" stroke-width="10"/>`;
      else { s += R(u0 + 14, V(270), w - 28, 140, "#5E7F4A", `rx="12"`); s += `<path d="M${f2(u0 + w / 2 - 22)},${f2(V(232))} h44 v28 h22 l-44,40 l-44,-40 h22 Z" fill="#FFF8EA" stroke="${INK}" stroke-width="1.6"/>`; }
      s += R(u0 + w / 2 - 70, V(p.up ? 206 : 120), 140, 26, "#FFF8EA", `rx="6"`);
    } else if (p.kind === "mudescend") {
      // 3F の にしの かべ: したへ いくほど むかし（ちそうの え）
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="#E7DDCB"/>`;
      ["#EAD9B3", "#D9BE91", "#C9A877", "#B79366", "#A3805A"].forEach((c, i) => { s += `<rect x="${f2(u0 + 20)}" y="${f2(V(270 - i * 44))}" width="${f2(w - 40)}" height="44" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`; });
      for (const [k, x, z] of [["shida", 0.25, 240], ["ammonite", 0.6, 196], ["fishfossil", 0.35, 150], ["trilobite", 0.7, 104]]) s += at(u0 + w * x, V(z), 0.6, ICON[k](30));
      s += R(u0 + w / 2 - 90, V(54), 180, 26, "#FFF8EA", `rx="6"`);
    } else if (p.kind === "mucafewall") {
      s += `<rect x="${f2(u0)}" y="0" width="${f2(w)}" height="${H}" fill="#F3E3CE"/>`;
      s += R(u0 + 20, V(236), w * 0.55, 110, "#3E4A44", `rx="6"`) + R(u0 + 26, V(230), w * 0.55 - 12, 98, "#465448", `rx="4"`);
      for (const [k, x] of [["tooth", 0.12], ["ammonite", 0.3], ["fern", 0.46]]) s += at(u0 + 20 + w * x, V(170), 0.45, ICON[k](30));
      for (let i = 0; i < 4; i++) s += `<rect x="${f2(u0 + w * 0.65 + i * 22)}" y="${f2(V(170))}" width="16" height="20" rx="3" fill="${["#FFFFFF", "#F4A4A9", "#9FD1D9", "#F7D889"][i]}" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<path d="M${f2(u0 + w * 0.62)},${f2(V(146))} H${f2(u0 + w - 16)}" stroke="#8E6440" stroke-width="5"/>`;
    } else return MallArt.wallPart.call(this, p, H, r, side);
    return s;
  }
  function wallText(g, p, H) {
    const T = IsoVenue.T, u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, txt = (t, x, y, size, col = INK, max = 300) => { g.font = `900 ${size}px 'M PLUS Rounded 1c', sans-serif`; g.fillStyle = col; g.fillText(t, x, y, max); };
    g.textAlign = "center"; g.textBaseline = "middle";
    if (p.kind === "dome") txt("きょうりゅうの せかい", u0 + w * 0.26, V(H - 48), 30, "#5E4A36", w * 0.34);
    else if (p.kind === "fossilslab") { const n = DinoMuseum.info(p.fossil); txt(n ? n.name : "", u0 + w / 2, V(33), 12, INK, 76); }
    else if (p.kind === "timeline") {
      const rows = [["46おく ねん まえ", "ちきゅうが できた"], ["40おく ねん まえ", "うみで いのちが"], ["5おく ねん まえ", "いきものが ふえた"], ["4おく ねん まえ", "さかなの じだい"], ["3おく7000まん", "りくへ あがった"], ["1おく5000まん", "とりの なかまが"], ["6600まん ねん まえ", "いんせきが おちた"], ["いま", "ほにゅうるいと とり"]];
      rows.forEach(([a, b], i) => { const x0 = (31 - i * 3 - p.from) * T + u0 - 18, pw = 2 * T + 36; txt(a, x0 + pw / 2, V(242), 13, "#FFFFFF", pw - 12); txt(b, x0 + pw / 2, V(84), 12, "#FFFFFF", pw - 12); });
      txt("いのちの れきし", u0 + 90, V(22), 14, "#3C352E", 160); txt("← いま", u0 + w - 60, V(22), 12, "#3C352E", 100);
    } else if (p.kind === "strata") { txt("あたらしい", u0 + 87, V(283), 13, INK, 140); txt("ふるい", u0 + w - 87, V(33), 13, INK, 140); }
    else if (p.kind === "mubanner") { txt("きょうりゅう はくぶつかん", u0 + w * 0.5, V(226), 34, "#5E4A36", w * 0.5); txt("いりぐちは 3F・ドームは 1F", u0 + w * 0.5, V(190), 15, "#7C6B55", w * 0.5); }
    else if (p.kind === "mutunnel") txt(p.up ? "3F いりぐちへ" : "1F へ おりる", u0 + w / 2, V(p.up ? 193 : 107), 13, INK, 130);
    else if (p.kind === "mudescend") txt("したへ いくほど むかし", u0 + w / 2, V(41), 13, INK, 170);
    else if (p.kind === "mucafewall") { txt("きょうの おすすめ", u0 + 20 + w * 0.275, V(214), 12, "#F3EEDF", w * 0.5); txt("カレー・パフェ・ココア", u0 + 20 + w * 0.275, V(140), 11, "#F3EEDF", w * 0.5); }
    else { g.textBaseline = "alphabetic"; return MallArt.wallText.call(this, g, p, H); }
    g.textBaseline = "alphabetic";
  }
  // かべの うごく ところ（1F の ドームの そらを とぶ よくりゅう・くも）
  function under(ctx, sc, r, floor, off) {
    if (!r.dome) return;
    const H = r.wallH || 360, T = IsoVenue.T;
    for (const p of r.walls.north) {
      if (p.kind !== "dome") continue;
      ctx.save(); art.plane(ctx, sc, off, "y", 0, p.from, H); const w = (p.to - p.from) * T, t = G.t;
      ctx.beginPath(); ctx.rect(0, 0, w, H - 120); ctx.clip();
      for (let i = 0; i < 3; i++) { const k = ((t * 0.02 + i * 0.37) % 1), x = k * (w + 200) - 100, y = 70 + i * 34 + Math.sin(t * 0.8 + i) * 8, flap = Math.sin(t * 5 + i * 2) * 8; ctx.fillStyle = "#6E5E68"; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 26, y + flap); ctx.quadraticCurveTo(x - 10, y - 6, x, y); ctx.quadraticCurveTo(x + 10, y - 6, x + 26, y + flap); ctx.quadraticCurveTo(x + 10, y + 2, x, y + 4); ctx.quadraticCurveTo(x - 10, y + 2, x - 26, y + flap); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 3); ctx.lineTo(x - 2, y + 2); ctx.fill(); }
      ctx.restore();
    }
  }

  Object.assign(art, {
    M: { ...MallArt.M, ...M }, L: { ...MallArt.L, ...L },
    MAT: {
      ...MallArt.MAT,
      mstone: { c: ["#EFE7D8", "#E8DFCE"], line: "#D8CDB8", pat: "tile" }, mwood: { c: ["#D9BA8E", "#CFAE80"], line: "#B6925F", pat: "plank" }, mcafe: { c: ["#E2C29A", "#D8B68C"], line: "#BE9A6C", pat: "plank" },
      msand: { c: ["#E3D2AE", "#DAC8A2"], line: "#C9B48A", pat: "carpet" }, mdome: { c: ["#D9D0C0", "#D2C8B6"], line: "#BFB39D", pat: "tile" }, mlab: { c: ["#F2F5F6", "#EBEFF1"], line: "#D3DADE", pat: "tile" },
      mkids: { c: ["#CFE6C0", "#C6DFB6"], line: "#AFCB9C", pat: "carpet" }, mearth: { c: ["#CFDDE6", "#C6D6E0"], line: "#AFC2CE", pat: "carpet" }, mlife: { c: ["#E8E0D2", "#E1D8C8"], line: "#CDBFA8", pat: "plank" },
    },
    models: new Map(),
    modelKey(f) { return "dinohall:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant ?? "") + ":" + (f.dino || "") + ":" + (f.dir || "") + ":" + (f.side || "") + ":" + (f.len || "") + ":" + (f.col || "") + ":" + (f.z || ""); },
    ICON, iconSvg, wallPart, wallText, decal, under,
    // ほねの 台の 寄贈の ようす（部品の じゅんに 1/0）
    bits(d) { return d.art.parts.map((p) => (typeof Museum !== "undefined" && Museum.gaveBone(d.id + "." + p.id) ? "1" : "0")).join(""); },
    // ほねの 台の 絵の はば（おうちの 単位。たかさは 300 まで）
    standW(f, d) { const len = f.len || f.w - 0.6, [, , bw, bh] = d.art.box, h = Math.min(300, (len * IsoVenue.T * bh) / bw); return (h * bw) / bh; },
    skelImg(sc, d, bits, w, ensure) {
      const pw = Math.max(8, Math.ceil(w * sc.k)), [, , bw, bh] = d.art.box, ph = Math.max(8, Math.ceil((pw * bh) / bw)), key = "dinoskel:" + d.id + ":" + bits + ":" + pw;
      const have = d.art.parts.filter((p, i) => bits[i] === "1").map((p) => p.id), fn = () => FossilArt.svg(d, { have, stand: false, uid: "dk" + d.id + bits });
      return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph);
    },
    robotImg(sc, frame, ensure) { const k = 1.05, pw = Math.ceil(306 * k * sc.k), ph = Math.ceil(190 * k * sc.k), key = "dinorobot:" + frame + ":" + pw; return ensure ? SvgCache.ensure(key, () => robotSvg(frame), pw, ph) : SvgCache.get(key, () => robotSvg(frame), pw, ph); },
    futabaImg(sc, ensure) { const pw = Math.ceil(9 * IsoVenue.T * sc.k), ph = Math.ceil((pw * 80) / 258), key = "dinofutaba:" + pw; return ensure ? SvgCache.ensure(key, futabaSvg, pw, ph) : SvgCache.get(key, futabaSvg, pw, ph); },
    iconImg(sc, kind, ensure) { const pw = Math.ceil(100 * sc.k), ph = Math.ceil(62 * sc.k), key = "dinoicon:" + kind + ":" + pw, fn = () => iconSvg(kind, 160, "ii" + kind); return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph); },
    // 面の 座標（u: 面に そって・v: 上から 下へ。おうちの 単位）。face "y": y = at の 面（u は +x）・face "x": x = at の 面（u は -y・u0 は 南の はしの y）
    plane(ctx, sc, off, face, at, u0, zTop) {
      const s = sc.s, A = IsoVenue.A, B = IsoVenue.B, o = face === "y" ? sc.toScreen(IsoVenue.p(u0, at, zTop), off) : sc.toScreen(IsoVenue.p(at, u0, zTop), off);
      ctx.translate(o.x, o.y); if (face === "y") ctx.transform(A * s, B * s, 0, s, 0, 0); else ctx.transform(A * s, -B * s, 0, s, 0, 0);
    },
    preload(r, sc) {
      const jobs = [MallArt.preload.call(this, r, sc)];
      for (const f of r.fixtures) {
        if (f.kind === "dinostand") { const d = Fossils.dino(f.dino); if (d) jobs.push(this.skelImg(sc, d, this.bits(d), this.standW(f, d), true)); }
        if (f.kind === "robotrex") for (let i = 0; i < 4; i++) jobs.push(this.robotImg(sc, i, true));
        if (f.kind === "futaba") jobs.push(this.futabaImg(sc, true));
        if (f.kind === "japanboard") jobs.push(this.iconImg(sc, "japan", true));
      }
      return Promise.all(jobs);
    },
    backdrop(r) { return r && r.dome ? ["#4A4A60", "#7A7488"] : ["#CFC6B6", "#E4DDD0"]; },
    // くだりの かいだんは ゆかの あなの 中だけ（くだりの エスカレーターと おなじ）
    fixture(ctx, sc, f, o) {
      if (f.kind !== "stairs" || f.dir !== "down") return MallArt.fixture.call(this, ctx, sc, f, o);
      const off = o.offset || 0, pts = IsoVenue.convex([[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]].flatMap(([x, y]) => [IsoVenue.p(x, y, 0), IsoVenue.p(x, y, 90)])).map((q) => sc.toScreen(q, off));
      ctx.save(); ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.clip(); MallArt.fixture.call(this, ctx, sc, f, o); ctx.restore();
    },
    tick(sc, dt) { MallArt.tick.call(this, sc, dt); if (typeof DinoMuseum !== "undefined") DinoMuseum.tick(sc); },
    async interact(sc, f) { if (typeof DinoMuseum !== "undefined" && (await DinoMuseum.interact(sc, f))) return true; return MallArt.interact.call(this, sc, f); },
    roarT: -99, digT: -99,
  });
  return art;
})();
DinoMuseum.install();
