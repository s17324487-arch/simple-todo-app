// かさ・ひがさ（UI-122。オーナーの 指示 2026-10-13「アイテムとして傘や日傘を実装してほしい。」）。
// ・もちもの（outfit.hand・js/hand-items.js と おなじ しくみ）に かさ 4しゅ と ひがさ 4しゅ。ようふくやさんの「もちもの」の たなで かう。
//   かさ: とうめいの ビニールがさ・みずたまの かさ・にじいろの かさ・かえるの かさ（てもとは J の かたち）
//   ひがさ: レースの ひがさ・フリルの ひがさ・わがさ（じゃのめ）・リボンの ひがさ（てもとは まっすぐ）
// ・絵: 手から ななめに のびる え（からだの うしろ）と、あたまの うえの ひらいた かさ（手の がわに すこし かたむく）。
//   キャラの 絵の わく（y −40 〜）に はいる おおきさ。id は ctx.uid を つける（いまは clipPath を つかわない）。
// ・セーブ: outfit.hand に はいる だけ（Save.SCHEMA は 2 の まま）。
const UmbrellaItems = {
  ITEMS: [
    { id: "hi_umb_vinyl", name: "ビニールがさ", col: ["#DCEFF6", "vinyl", "#FFFFFF"], price: 160, st: { def: 1 }, desc: "すきとおった かさ。あめの おそらが みえるよ", umb: "rain" },
    { id: "hi_umb_dot", name: "みずたまの かさ", col: ["#3F5AA8", "dot", "#FFFFFF"], price: 260, st: { def: 2 }, desc: "こんいろに しろい みずたま。あめの ひも たのしく", umb: "rain" },
    { id: "hi_umb_rainbow", name: "にじいろの かさ", col: ["#F48FB1", "rainbow", "#FFFFFF"], price: 340, st: { def: 1, sp: 2 }, desc: "ひらくと にじが でる かさ。あめあがりの きぶん", umb: "rain" },
    { id: "hi_umb_frog", name: "かえるの かさ", col: ["#8BCB6B", "frog", "#FFFFFF"], price: 300, st: { def: 2, hp: 2 }, desc: "てっぺんに かえるの おめめ。みずたまりも へっちゃら", umb: "rain" },
    { id: "hi_para_lace", name: "レースの ひがさ", col: ["#FFFFFF", "lace", "#E8D9C4"], price: 380, st: { sp: 2 }, desc: "ふちが レースの しろい ひがさ。おでかけが エレガントに", umb: "sun" },
    { id: "hi_para_frill", name: "フリルの ひがさ", col: ["#F8BBD0", "frill", "#FFFFFF"], price: 360, st: { sp: 1, spd: 1 }, desc: "ふちに ふわふわの フリル。ピンクの ひかげ", umb: "sun" },
    { id: "hi_para_wagasa", name: "わがさ", col: ["#D84343", "wagasa", "#FFF6E8"], price: 420, st: { def: 1, sp: 1 }, desc: "じゃのめ もようの わがさ。おまつりや ゆかたに", umb: "sun" },
    { id: "hi_para_ribbon", name: "リボンの ひがさ", col: ["#CDB8E8", "ribbon", "#F4A6C6"], price: 400, st: { sp: 2, hp: 1 }, desc: "てっぺんに おおきな リボン。ラベンダーいろの ひがさ", umb: "sun" },
  ],
  RAINBOW: ["#F28B82", "#FBBC6B", "#FFE07A", "#9FD88B", "#86C5EE", "#B79BE6"],
  // かさの まわりの てん（ローカル: まんなか 0,0・はんけい R。ふちの ぎざぎざの あいだ n）
  edge(R, n) { const out = []; for (let i = 0; i <= n; i++) out.push([-R + (2 * R * i) / n, 0]); return out; },
  draw(ctx) {
    const k = ctx.view === "back" ? 0 : 1, E = charaArmEnds(ctx.p, k), hx = E.hand[0], hy = E.hand[1], side = k ? 1 : -1, H = ctx.a.hat;
    const c = ctx.col[0], style = ctx.col[1] || "vinyl", c2 = ctx.col[2] || "#FFFFFF", sun = ["lace", "frill", "wagasa", "ribbon"].includes(style);
    const R = Math.max(60, H.w * 0.74), cx = U.clamp(H.x + side * 24, 64, 146), cy = Math.max(10, H.y - 24), ang = side * 14; // かさの まんなか（ふちの たかさ。あたまの すこし うえ）・手の がわに かたむく（ど）
    const dome = 0.66 * R, n = sun ? 8 : 6, pts = this.edge(R, n), D = `M${-R},0 C${f2(-R)},${f2(-dome * 1.3)} ${f2(R)},${f2(-dome * 1.3)} ${R},0`;
    // ふちの ぎざぎざ（ほねの あいだが すこし さがる）
    let rim = ""; for (let i = n; i > 0; i--) { const [x0] = pts[i], [x1] = pts[i - 1]; rim += ` Q${f2((x0 + x1) / 2)},${f2(sun ? 6 : 8)} ${f2(x1)},0`; }
    const canopy = D + rim + " Z", tipY = -dome * 0.98;
    let fill = `<path d="${canopy}" fill="${c}" ${style === "vinyl" ? 'fill-opacity=".6"' : ""} ${stroke(3.2)}/>`, deco = "";
    const wedge = (i) => `M0,${f2(tipY)} L${f2(pts[i][0])},0 Q${f2((pts[i][0] + pts[i + 1][0]) / 2)},${f2(sun ? 6 : 8)} ${f2(pts[i + 1][0])},0 Z`;
    if (style === "rainbow") for (let i = 0; i < n; i++) deco += `<path d="${wedge(i)}" fill="${this.RAINBOW[i % this.RAINBOW.length]}" stroke="none"/>`;
    if (style === "dot") for (const [x, y, r] of [[-30, -10, 4.4], [-8, -22, 4], [16, -12, 4.4], [36, -6, 3.6], [-44, -4, 3.4], [4, -4, 3.4], [-20, -26, 3]]) deco += `<circle cx="${f2(x * R / 60)}" cy="${f2(y * R / 60)}" r="${r}" fill="${c2}"/>`;
    if (style === "wagasa") deco += `<path d="M${f2(-R * 0.62)},${f2(-dome * 0.42)} C${f2(-R * 0.5)},${f2(-dome * 0.85)} ${f2(R * 0.5)},${f2(-dome * 0.85)} ${f2(R * 0.62)},${f2(-dome * 0.42)}" fill="none" stroke="${c2}" stroke-width="7" stroke-linecap="round"/>`;
    if (style === "frill") { let f = ""; for (let i = 0; i < n * 2; i++) { const x0 = -R + (R * i) / n, x1 = x0 + R / n; f += `<path d="M${f2(x0)},0 Q${f2((x0 + x1) / 2)},${f2(9)} ${f2(x1)},0" fill="${c2}" ${stroke(1.6)}/>`; } deco += f; }
    if (style === "lace") { let f = ""; for (let i = 0; i < n * 2; i++) { const x = -R + (R * (i + 0.5)) / n; f += `<circle cx="${f2(x)}" cy="2" r="${f2(R / n / 2)}" fill="${c2}" ${stroke(1.2)}/><circle cx="${f2(x)}" cy="2" r="1.4" fill="${c}"/>`; } deco = f; }
    // ほね（てっぺんから ふちへ）
    let ribs = ""; for (let i = 1; i < n; i++) ribs += `<path d="M0,${f2(tipY)} Q${f2(pts[i][0] * 0.55)},${f2(tipY * 0.45)} ${f2(pts[i][0])},0" fill="none" stroke="${style === "vinyl" ? "#9FB8C4" : shade(c, -0.28)}" stroke-width="1.6"/>`;
    const outline = `<path d="${canopy}" fill="none" ${stroke(3.2)}/>`;
    let top = `<circle cx="0" cy="${f2(tipY - 3)}" r="3.4" fill="${style === "wagasa" ? "#8B5A2B" : c2}" ${stroke(2)}/>`;
    if (style === "frog") for (const sx of [-1, 1]) top += `<circle cx="${f2(sx * 10)}" cy="${f2(tipY + 1)}" r="7.5" fill="${c}" ${stroke(2.4)}/><circle cx="${f2(sx * 10)}" cy="${f2(tipY + 1)}" r="4.6" fill="#FFFFFF"/><circle cx="${f2(sx * 10 + 0.8)}" cy="${f2(tipY + 1.6)}" r="2.4" fill="${INK}"/>`;
    if (style === "ribbon") top += `<path d="M0,${f2(tipY + 1)} C-6,${f2(tipY - 9)} -16,${f2(tipY - 6)} -14,${f2(tipY + 3)} C-12,${f2(tipY + 9)} -4,${f2(tipY + 5)} 0,${f2(tipY + 1)} Z M0,${f2(tipY + 1)} C6,${f2(tipY - 9)} 16,${f2(tipY - 6)} 14,${f2(tipY + 3)} C12,${f2(tipY + 9)} 4,${f2(tipY + 5)} 0,${f2(tipY + 1)} Z" fill="${c2}" ${stroke(2)}/><circle cx="0" cy="${f2(tipY + 1)}" r="3" fill="${c2}" ${stroke(1.8)}/>`;
    const shine = style === "vinyl" ? `<path d="M${f2(-R * 0.55)},${f2(-dome * 0.3)} C${f2(-R * 0.45)},${f2(-dome * 0.7)} ${f2(-R * 0.2)},${f2(-dome * 0.92)} ${f2(-R * 0.02)},${f2(-dome * 0.95)}" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>` : "";
    const canopyG = `<g transform="translate(${f2(cx)} ${f2(cy)}) rotate(${ang})">${fill}${deco}${ribs}${outline}${shine}${top}</g>`;
    // え: かさの まんなか（ふち）から 手まで。てもと（かさ: J・ひがさ: まるい にぎり）
    const ra = (ang * Math.PI) / 180, bx = cx + Math.sin(ra) * 0, by = cy + 2, dx = hx - bx, dy = hy - by, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const shaftCol = style === "wagasa" ? "#B07A45" : style === "vinyl" ? "#F3F3F3" : "#E9E3D8";
    const shaft = `<path d="M${f2(bx)},${f2(by)} L${f2(hx + ux * 6)},${f2(hy + uy * 6)}" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M${f2(bx)},${f2(by)} L${f2(hx + ux * 6)},${f2(hy + uy * 6)}" stroke="${shaftCol}" stroke-width="2.6" stroke-linecap="round"/>`;
    const ex = hx + ux * 7, ey = hy + uy * 7, hcol = sun ? (style === "wagasa" ? "#8B5A2B" : c2) : style === "vinyl" ? "#FFFFFF" : shade(c, -0.15);
    const grip = sun
      ? `<path d="M${f2(hx - ux * 2)},${f2(hy - uy * 2)} L${f2(ex + ux * 8)},${f2(ey + uy * 8)}" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/><path d="M${f2(hx - ux * 2)},${f2(hy - uy * 2)} L${f2(ex + ux * 8)},${f2(ey + uy * 8)}" stroke="${hcol}" stroke-width="4.2" stroke-linecap="round"/>`
      : `<path d="M${f2(ex)},${f2(ey)} q${f2(ux * 7)},${f2(uy * 7)} ${f2(ux * 7 - side * 5)},${f2(uy * 7 + 4)} q${f2(-side * 4)},${f2(3)} ${f2(-side * 7)},${f2(-2)}" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M${f2(ex)},${f2(ey)} q${f2(ux * 7)},${f2(uy * 7)} ${f2(ux * 7 - side * 5)},${f2(uy * 7 + 4)} q${f2(-side * 4)},${f2(3)} ${f2(-side * 7)},${f2(-2)}" fill="none" stroke="${hcol}" stroke-width="3" stroke-linecap="round"/>`;
    // まえ・よこ: え は からだの うしろ・てもとは 手の まえ。うしろむき: ぜんぶ まえ（かさを もつ 手が みえる がわ）
    // まえ・よこ: え は あたまと からだの うしろ（かたに かけて もつ）・てもとと かさは まえ。うしろむき: ぜんぶ まえ
    if (ctx.view === "back") return { top: shaft + grip + canopyG };
    return { behind: shaft, top: grip + canopyG };
  },
  isUmbrella(id) { return !!this.ITEMS.find((x) => x.id === id); },
};

// ---- ゲームに いれる（hand-items.js の あと。もちものの たなと アイコンは HandItems と おなじ しくみ）----
(() => {
  WEAR.hi_umbrella = (ctx) => UmbrellaItems.draw(ctx);
  for (const it of UmbrellaItems.ITEMS) { const w = { ...it, wear: "hi_umbrella", slot: HandItems.SLOT }; WEAR_ITEMS.push(w); ITEM_INDEX[w.id] = w; }
})();
