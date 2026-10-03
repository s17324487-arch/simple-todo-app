// UI-57: ネリカス でんき 1F の シール うりばで うる シール 46しゅの 絵（シールちょうは js/sticker-book.js・うりばは js/kaden-stickers.js）。
// オーナーの FB 2026-10-03「家電屋ではあるが、シールの販売を充実させよ。シールを新たに30種以上用意して、以下のパターンを網羅せよ」:
//   マシュマロ・ぷくぷく（スポンジの ような やわらかさ → ふくらんだ からだ・したの かげ・あわの つぶ）
//   ドロップ（ボンボン。じゅしの ドーム → すける いろ・ふちの くらい わ・したの いんさつの かげ・つよい ひかり）
//   シャカシャカ（なかに みずと ラメ → まど・みず・したに たまった ラメと うかんだ ラメの 2まい。ゆびで うごかすと まう）
//   フレーク（1まいずつ かたぬき・ちいさい・つやなし）・タイル（3×3 の シートを じぶんで きる）と へいせい レトロ（Y2K）
//   そざい（かみ・フィルム・わし・とうめい PET・ミラー・はくおし）
// ・どれも 100×100（タイルの シートも）。線は INK・しろい ふちどりは StickerArt.cut（とうめいは ふちなし）。グラデーションは つかわない。
//   かたちの なかだけに ぬる ところ（ミラーの しま・ホロの おび）は clipPath（id は よぶ たびに あたらしい kst + かず → おなじ 絵を ならべても かさならない）。
//   <text> も つかわない（シールの 絵は img で だす ので フォントが よめない）。キャラの 絵は Chara.svg（よぶ たびに あたらしい id）。
// ・シャカシャカは base（わく・みず）・rest（したに たまった なかみ）・up（うかんだ なかみ）・top（ドームの ひかり）の 4まいを かさねる。
// ・うりばの しなもの（パック）の 絵: pack(p)（100×120・つりさげの あな・とうめいの ふくろ）。
const KadenStickerArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10, TAU = Math.PI * 2;
  const sk = (w = 2.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMid meet" `);
  const place = (s, x, y, w, h) => s.replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" `);
  const cut = (d, fill, inner = "", o = {}) => StickerArt.cut(d, fill, inner, o);
  const rnd = (seed) => { let a = seed >>> 0; return () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296); };
  let UID = 0;
  const clip = (d, inner) => { const id = "kst" + (++UID); return `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))); return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase(); };
  // かたち
  const circle = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)} a${f1(r)},${f1(r)} 0 1,0 ${f1(r * 2)},0 a${f1(r)},${f1(r)} 0 1,0 ${f1(-r * 2)},0 Z`;
  const ellipseD = (cx, cy, rx, ry) => `M${f1(cx - rx)},${f1(cy)} a${f1(rx)},${f1(ry)} 0 1,0 ${f1(rx * 2)},0 a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-rx * 2)},0 Z`;
  const rrect = (x, y, w, h, r) => `M${f1(x + r)},${f1(y)} H${f1(x + w - r)} Q${f1(x + w)},${f1(y)} ${f1(x + w)},${f1(y + r)} V${f1(y + h - r)} Q${f1(x + w)},${f1(y + h)} ${f1(x + w - r)},${f1(y + h)} H${f1(x + r)} Q${f1(x)},${f1(y + h)} ${f1(x)},${f1(y + h - r)} V${f1(y + r)} Q${f1(x)},${f1(y)} ${f1(x + r)},${f1(y)} Z`;
  const heartD = (cx, cy, s) => StickerArt.heartD(cx, cy, s);
  // かどの まるい ほし（n かど）
  const starD = (cx, cy, R, r, n = 5, round = 0) => {
    const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, l = i % 2 ? r : R; pts.push([cx + Math.cos(a) * l, cy + Math.sin(a) * l]); }
    if (!round) return "M" + pts.map((p) => p.map(f1).join(",")).join(" L") + " Z";
    let d = ""; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], o = pts[(i + pts.length - 1) % pts.length]; const a = [p[0] + (o[0] - p[0]) * round, p[1] + (o[1] - p[1]) * round], b = [p[0] + (q[0] - p[0]) * round, p[1] + (q[1] - p[1]) * round]; d += (i ? " L" : "M") + f1(a[0]) + "," + f1(a[1]) + " Q" + f1(p[0]) + "," + f1(p[1]) + " " + f1(b[0]) + "," + f1(b[1]); });
    return d + " Z";
  };
  const cloudD = (cx, cy, s) => `M${f1(cx - 34 * s)},${f1(cy + 14 * s)} C${f1(cx - 48 * s)},${f1(cy + 12 * s)} ${f1(cx - 46 * s)},${f1(cy - 8 * s)} ${f1(cx - 30 * s)},${f1(cy - 8 * s)} C${f1(cx - 28 * s)},${f1(cy - 26 * s)} ${f1(cx - 4 * s)},${f1(cy - 30 * s)} ${f1(cx + 4 * s)},${f1(cy - 16 * s)} C${f1(cx + 14 * s)},${f1(cy - 28 * s)} ${f1(cx + 38 * s)},${f1(cy - 20 * s)} ${f1(cx + 34 * s)},${f1(cy - 4 * s)} C${f1(cx + 50 * s)},${f1(cy - 2 * s)} ${f1(cx + 48 * s)},${f1(cy + 18 * s)} ${f1(cx + 32 * s)},${f1(cy + 18 * s)} Z`;
  // かお
  const eyes = (cx, cy, dx, s = 1, happy = false) => happy
    ? `<path d="M${f1(cx - dx - 3.4 * s)},${f1(cy + 1)} q${f1(3.4 * s)} ${f1(-4 * s)} ${f1(6.8 * s)} 0 M${f1(cx + dx - 3.4 * s)},${f1(cy + 1)} q${f1(3.4 * s)} ${f1(-4 * s)} ${f1(6.8 * s)} 0" fill="none" ${sk(2 * s)}/>`
    : `<circle cx="${f1(cx - dx)}" cy="${f1(cy)}" r="${f1(2.9 * s)}" fill="${K}"/><circle cx="${f1(cx + dx)}" cy="${f1(cy)}" r="${f1(2.9 * s)}" fill="${K}"/><circle cx="${f1(cx - dx + 0.9 * s)}" cy="${f1(cy - 1 * s)}" r="${f1(1 * s)}" fill="#FFFFFF"/><circle cx="${f1(cx + dx + 0.9 * s)}" cy="${f1(cy - 1 * s)}" r="${f1(1 * s)}" fill="#FFFFFF"/>`;
  const cheeks = (cx, cy, dx, s = 1) => `<ellipse cx="${f1(cx - dx)}" cy="${f1(cy)}" rx="${f1(3.8 * s)}" ry="${f1(2.3 * s)}" fill="#F7A0B4" opacity="0.8"/><ellipse cx="${f1(cx + dx)}" cy="${f1(cy)}" rx="${f1(3.8 * s)}" ry="${f1(2.3 * s)}" fill="#F7A0B4" opacity="0.8"/>`;
  const mouth = (cx, cy, s = 1) => `<path d="M${f1(cx - 3.4 * s)},${f1(cy)} q${f1(1.7 * s)} ${f1(2.3 * s)} ${f1(3.4 * s)} 0 q${f1(1.7 * s)} ${f1(2.3 * s)} ${f1(3.4 * s)} 0" fill="none" ${sk(1.7 * s)}/>`;
  const face = (cx, cy, s = 1, happy = false) => eyes(cx, cy, 9 * s, s, happy) + cheeks(cx, cy + 6 * s, 15 * s, s) + mouth(cx, cy + 6.5 * s, s);
  const hero = (who) => Chara.svg(who, { pose: "idle_01", face: "smile", dir: "down", outfit: {}, color: "soft" });
  const HEAD = { wanko: "2 -16 196 172", gachan: "24 -2 152 152", goji: "2 -12 196 170" };
  // ひかり（つや）
  const arc = (x, y, w, h, sw, op = 0.9) => `<path d="M${f1(x)},${f1(y + h)} q${f1(w * 0.12)} ${f1(-h)} ${f1(w)} ${f1(-h)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(sw)}" stroke-linecap="round" opacity="${op}"/>`;
  const dot = (x, y, r, op = 1, c = "#FFFFFF") => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}" opacity="${op}"/>`;
  const at = (x, y, s, inner, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${f1(rot)})` : ""} scale(${f1(s * 100) / 100})">${inner}</g>`;

  // ======================= マシュマロ・ぷくぷく =======================
  // ふくらんだ からだ: くらい いろの かたちの うえに、すこし ちいさく うえへ ずらした あかるい かたち（したに かげの つき）・あわの つぶ・やわらかい ひかり
  const mm = (d, cx, cy, base, dark, inner = "", seed = 1) => {
    const r = rnd(seed); let pores = "";
    for (let i = 0; i < 14; i++) { const a = r() * TAU, l = 6 + r() * 26; pores += dot(cx + Math.cos(a) * l, cy + Math.sin(a) * l * 0.85, 0.7 + r() * 0.7, 0.28, "#FFFFFF"); }
    return cut(d, dark, "", { rim: 10 })
      + `<path d="${d}" fill="${base}" transform="translate(${f1(cx * 0.06)} ${f1(cy * 0.06 - 3.2)}) scale(0.94)"/>`
      + pores + inner
      + `<ellipse cx="${f1(cx - 13)}" cy="${f1(cy - 17)}" rx="13" ry="7" fill="#FFFFFF" opacity="0.4" transform="rotate(-24 ${f1(cx - 13)} ${f1(cy - 17)})"/>` + dot(cx - 20, cy - 20, 2.2, 0.85)
      + `<path d="${d}" fill="none" ${sk(2.2)}/>`;
  };
  // マシュマロの 3人: まるい あたま ＋ ちいさな おもちの からだ（あし 2つ）
  const mmBody = (cx, cy) => `M${f1(cx - 30)},${f1(cy + 6)} C${f1(cx - 36)},${f1(cy - 30)} ${f1(cx + 36)},${f1(cy - 30)} ${f1(cx + 30)},${f1(cy + 6)} C${f1(cx + 34)},${f1(cy + 26)} ${f1(cx + 22)},${f1(cy + 36)} ${f1(cx + 12)},${f1(cy + 36)} Q${f1(cx + 6)},${f1(cy + 40)} ${f1(cx)},${f1(cy + 36)} Q${f1(cx - 6)},${f1(cy + 40)} ${f1(cx - 12)},${f1(cy + 36)} C${f1(cx - 22)},${f1(cy + 36)} ${f1(cx - 34)},${f1(cy + 26)} ${f1(cx - 30)},${f1(cy + 6)} Z`;
  const mmHero = (who, base, dark, seed) => svg(mm(mmBody(50, 50), 50, 52, base, dark, nest(hero(who), 25, 25, 50, 46, HEAD[who]) + `<path d="M40,84 q4 3 8 0 M52,84 q4 3 8 0" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>`, seed));

  // ======================= ドロップ（ボンボン）=======================
  // じゅしの ドーム: いんさつの いろ → したの いんさつの かげ（にじゅう いんさつ）→ もよう → すける ドーム → ふちの くらい わ → ひかり
  const drop = (d, cx, cy, color, edge, motif = "", motifShadow = "", o = {}) =>
    cut(d, color, "", { rim: 6 })
    + (motifShadow ? `<g transform="translate(1.8 2.8)" opacity="0.22">${motifShadow}</g>` : "") + motif
    + `<path d="${d}" fill="#FFFFFF" opacity="0.14"/>`
    + `<path d="${d}" fill="none" stroke="${edge}" stroke-width="6" opacity="0.32" transform="translate(${f1(cx * 0.12)} ${f1(cy * 0.12)}) scale(0.88)"/>`
    + `<ellipse cx="${f1(cx + (o.cx || 6))}" cy="${f1(cy + (o.cy || 18))}" rx="${f1(o.rx || 12)}" ry="${f1(o.ry || 5)}" fill="#FFFFFF" opacity="0.32"/>`
    + arc(cx - (o.w || 26), cy - (o.h || 26), (o.w || 26) * 1.15, (o.h || 26) * 0.55, o.sw || 5.4, 0.92) + dot(cx - (o.w || 26) * 0.78, cy - (o.h || 26) * 0.9, 2.6) + dot(cx + (o.w || 26) * 0.55, cy + (o.h || 26) * 0.35, 1.8, 0.8)
    + `<path d="${d}" fill="none" ${sk(2.2)}/>`;

  // ======================= シャカシャカ =======================
  // まどの なかの なかみ: まど（circle・rrect・heart）の なかに あるか・したの ほうに たまる / ぜんたいに うかぶ
  const inWin = (w, x, y, m = 0) => {
    if (w.t === "circle") return Math.hypot(x - w.cx, y - w.cy) <= w.r - m;
    if (w.t === "rrect") return x >= w.x + m && x <= w.x + w.w - m && y >= w.y + m && y <= w.y + w.h - m;
    // ハート: (X² + Y² − 1)³ − X²Y³ ≤ 0（Y は うえ むき）
    const X = (x - w.cx) / (w.s - m), Y = -(y - w.cy) / (w.s - m) + 0.25; return Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0;
  };
  const winBox = (w) => (w.t === "circle" ? [w.cx - w.r, w.cy - w.r, w.cx + w.r, w.cy + w.r] : w.t === "rrect" ? [w.x, w.y, w.x + w.w, w.y + w.h] : [w.cx - w.s * 1.2, w.cy - w.s * 1.3, w.cx + w.s * 1.2, w.cy + w.s * 1.1]);
  const bit = (t, x, y, c, r, rot) => {
    if (t === "dot") return dot(x, y, r, 0.95, c);
    if (t === "ring") return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#FFFFFF" fill-opacity="0.35" stroke="${c}" stroke-width="1.2"/>`;
    if (t === "star") return `<path d="${starD(x, y, r, r * 0.45)}" fill="${c}" stroke="${K}" stroke-width="0.8" stroke-linejoin="round" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`;
    if (t === "heart") return `<path d="${heartD(x, y, r / 26)}" fill="${c}" stroke="${K}" stroke-width="0.8" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`;
    if (t === "flake") return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})" stroke="${c}" stroke-width="1.3" stroke-linecap="round"><path d="M0,${f1(-r)} V${f1(r)} M${f1(-r * 0.87)},${f1(-r / 2)} L${f1(r * 0.87)},${f1(r / 2)} M${f1(-r * 0.87)},${f1(r / 2)} L${f1(r * 0.87)},${f1(-r / 2)}"/></g>`;
    if (t === "fish") return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot * 0.2)}) scale(${f1(r / 6)})"><path d="M-6,0 C-3,-4 3,-4 5,0 C3,4 -3,4 -6,0 Z M5,0 L9,-3 L9,3 Z" fill="${c}" stroke="${K}" stroke-width="1"/><circle cx="-3" cy="-0.6" r="0.9" fill="${K}"/></g>`;
    if (t === "sequin") return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.55)}" fill="${c}" stroke="#FFFFFF" stroke-width="0.8" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`;
    return "";
  };
  // items: [[しゅるい, いろ, おおきさ, かず], …]
  const contents = (w, items, seed, mode) => {
    const r = rnd(seed), [x0, y0, x1, y1] = winBox(w), H = y1 - y0; let s = "";
    for (const [t, c, size, n] of items) for (let i = 0; i < n; i++) {
      let x = 0, y = 0, k = 0;
      do {
        x = x0 + r() * (x1 - x0);
        y = mode === "rest" ? y1 - Math.pow(r(), 1.7) * H * 0.38 - size * 0.4 : y0 + r() * H; // したに たまる（そこほど おおい）
        k++;
      } while (!inWin(w, x, y, size + (mode === "up" ? 5 : 2.4)) && k < 60);
      if (k >= 60) continue;
      s += bit(t, x, y, c, size * (0.8 + r() * 0.4), r() * 360);
    }
    return s;
  };
  const shaka = (o) => {
    const base = cut(o.outline, o.frame, "", { rim: 7 }) + (o.decor || "") + `<path d="${o.window}" fill="${o.water}" ${sk(2)}/>` + (o.inside || "") + `<path d="${o.window}" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.6" transform="translate(${f1(o.wc[0] * 0.06)} ${f1(o.wc[1] * 0.06)}) scale(0.94)"/>`;
    const rest = contents(o.win, o.items, o.seed, "rest"), up = contents(o.win, o.items, o.seed + 7, "up");
    const [gx, gy, gr] = o.gloss;
    const top = arc(gx - gr * 0.7, gy - gr * 0.72, gr * 0.95, gr * 0.5, 4.4, 0.9) + dot(gx - gr * 0.5, gy - gr * 0.6, 2, 0.95) + arc(gx + gr * 0.25, gy + gr * 0.42, gr * 0.42, gr * 0.22, 2.4, 0.6) + (o.over || "");
    return { base, rest, up, top, win: o.win };
  };

  // ======================= フレーク・タイル・レトロ・そざい =======================
  const flake = (d, fill, inner = "") => cut(d, fill, inner, { rim: 5 });
  // タイル 1まい（x, y から w 四方）: あつみ（したの かげ）・つやの おび・もよう
  const tile = (x, y, w, c, motif, light = "#FFFFFF") => {
    const r = w * 0.18;
    return `<path d="${rrect(x + w * 0.03, y + w * 0.06, w, w, r)}" fill="#00000022"/>`
      + `<path d="${rrect(x, y, w, w, r)}" fill="${shade(c, -0.16)}" ${sk(Math.max(1.2, w * 0.03))}/>`
      + `<path d="${rrect(x + w * 0.05, y + w * 0.04, w * 0.9, w * 0.84, r * 0.8)}" fill="${c}"/>`
      + at(x + w / 2, y + w * 0.47, w / 100, motif)
      + `<path d="M${f1(x + w * 0.16)},${f1(y + w * 0.3)} q${f1(w * 0.04)} ${f1(-w * 0.16)} ${f1(w * 0.26)} ${f1(-w * 0.18)}" fill="none" stroke="${light}" stroke-width="${f1(w * 0.06)}" stroke-linecap="round" opacity="0.85"/>`
      + `<path d="${rrect(x, y, w, w, r)}" fill="none" ${sk(Math.max(1.2, w * 0.03))}/>`;
  };
  // タイルの もよう（まんなか 0,0・はば やく 56）
  const TILE = {
    heart: { c: "#FFB3CC", m: `<path d="${heartD(0, -2, 1.05)}" fill="#FF5C8A" ${sk(2.6)}/>` + dot(-9, -12, 3.4, 0.9) },
    star: { c: "#FFE48A", m: `<path d="${starD(0, 2, 28, 12, 5, 0.18)}" fill="#FFC21A" ${sk(2.6)}/>` + eyes(0, 4, 7, 0.9, true) },
    smile: { c: "#C9F2A8", m: `<circle cx="0" cy="0" r="26" fill="#FFE14D" ${sk(2.6)}/>` + eyes(0, -5, 9, 1.1) + `<path d="M-12,7 Q0,20 12,7" fill="none" ${sk(2.6)}/>` },
    rainbow: { c: "#BFE6F7", m: ["#FF6F7D", "#FFB347", "#FFE14D", "#7CCF6B", "#6FB6F0"].map((col, i) => `<path d="M${-28 + i * 5},12 A${28 - i * 5},${28 - i * 5} 0 0 1 ${28 - i * 5},12" fill="none" stroke="${col}" stroke-width="5.4"/>`).join("") + `<path d="${cloudD(-20, 14, 0.3)}" fill="#FFFFFF" ${sk(2)}/><path d="${cloudD(20, 14, 0.3)}" fill="#FFFFFF" ${sk(2)}/>` },
    berry: { c: "#FFD3D3", m: `<path d="M0,28 C-22,18 -26,-2 -18,-12 C-12,-18 -4,-16 0,-12 C4,-16 12,-18 18,-12 C26,-2 22,18 0,28 Z" fill="#FF4F64" ${sk(2.6)}/><path d="M-12,-14 C-8,-24 -2,-18 0,-14 C2,-18 8,-24 12,-14 C6,-10 -6,-10 -12,-14 Z" fill="#6CC05A" ${sk(2.2)}/>` + [[-8, -2], [6, -3], [-2, 8], [10, 8], [-10, 12], [2, 18]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.5" ry="2.3" fill="#FFF3B8"/>`).join("") },
    cho: { c: "#E2D3FA", m: `<path d="M0,0 C-6,-22 -30,-26 -26,-6 C-24,4 -10,4 0,0 Z M0,0 C6,-22 30,-26 26,-6 C24,4 10,4 0,0 Z" fill="#9E7BE8" ${sk(2.4)}/><path d="M0,2 C-4,18 -22,22 -18,8 C-16,2 -6,2 0,2 Z M0,2 C4,18 22,22 18,8 C16,2 6,2 0,2 Z" fill="#F59AC0" ${sk(2.4)}/><path d="M0,-12 V14" ${sk(3)}/>` },
    phone: { c: "#FFE0EF", m: `<rect x="-13" y="-26" width="26" height="24" rx="5" fill="#F7A3C8" ${sk(2.4)}/><rect x="-9" y="-22" width="18" height="15" rx="2" fill="#BFE8F7" ${sk(1.6)}/><rect x="-13" y="0" width="26" height="26" rx="5" fill="#F7A3C8" ${sk(2.4)}/>` + [[-6, 7], [0, 7], [6, 7], [-6, 13], [0, 13], [6, 13], [-6, 19], [0, 19], [6, 19]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#FFFFFF" ${sk(0.8)}/>`).join("") },
    note: { c: "#CDEBFF", m: `<path d="M-12,16 V-18 L16,-24 V10" fill="none" ${sk(3.4)}/><ellipse cx="-17" cy="17" rx="8" ry="6" fill="#3C3A6E" ${sk(2)}/><ellipse cx="11" cy="11" rx="8" ry="6" fill="#3C3A6E" ${sk(2)}/><path d="M-12,-12 L16,-18" ${sk(3.4)}/>` },
    ribbon: { c: "#FFEFC2", m: `<path d="M0,0 C-10,-16 -30,-20 -28,-4 C-26,8 -10,6 0,0 Z M0,0 C10,-16 30,-20 28,-4 C26,8 10,6 0,0 Z" fill="#FF7FA8" ${sk(2.4)}/><path d="M-3,2 L-12,24 L-4,20 L0,26 L3,2 Z M3,2 L12,24 L4,20" fill="#FF7FA8" ${sk(2.2)}/><circle cx="0" cy="0" r="6" fill="#FF5C8A" ${sk(2.2)}/>` },
  };
  const TILE_ORDER = ["heart", "star", "smile", "rainbow", "berry", "cho", "phone", "note", "ribbon"];
  // ホロ（にじいろ）の おび（かたち d の なかだけ）
  const holo = (d, op = 0.3) => clip(d, ["#FF9EC7", "#FFE07A", "#9EE6B8", "#9FC7FF", "#C9A8FF"].map((c, i) => `<path d="M${-10 + i * 26},110 L${30 + i * 26},-10 L${44 + i * 26},-10 L${4 + i * 26},110 Z" fill="${c}" opacity="${op}"/>`).join(""));

  const FIG = {
    // ---- マシュマロ・ぷくぷく ----
    stk_mm_wanko: () => mmHero("wanko", "#E6F5FC", "#B9DDF0", 3),
    stk_mm_gachan: () => mmHero("gachan", "#FFF6CF", "#F0D98A", 5),
    stk_mm_goji: () => mmHero("goji", "#EFE8FA", "#CDBFE8", 7),
    stk_mm_cloud: () => svg(mm(cloudD(50, 54, 1), 50, 50, "#FFFFFF", "#D6E4F0", face(50, 52, 1.1), 9)),
    stk_mm_mochi: () => svg(mm(ellipseD(50, 56, 38, 30), 50, 56, "#FFE3EC", "#F2BCCD", `<path d="M58,26 C76,18 92,30 88,44 C76,46 62,40 58,26 Z" fill="#9ED38A" ${sk(2)}/><path d="M60,28 C70,30 80,36 86,42" fill="none" stroke="#6FA85C" stroke-width="1.4"/>` + face(46, 58, 1.15, true), 11)),
    // ---- ドロップ（ボンボン）----
    stk_dp_heart: () => { const m = `<path d="${heartD(50, 52, 0.62)}" fill="#FFFFFF" opacity="0.92"/>` + eyes(50, 52, 6, 0.75) + cheeks(50, 57, 10, 0.7), sh = `<path d="${heartD(50, 52, 0.62)}" fill="#7A1E3C"/>`; return svg(drop(heartD(50, 52, 1.32), 50, 52, "#FF6F9C", "#B3305C", m, sh)); },
    stk_dp_star: () => { const d = starD(50, 54, 44, 22, 5, 0.22), m = eyes(50, 56, 8, 1, true) + cheeks(50, 62, 13, 0.9) + mouth(50, 63, 0.9), sh = `<path d="M40,57 q3 -4 6 0 M54,57 q3 -4 6 0" fill="none" stroke="#7A5200" stroke-width="2.4"/>`; return svg(drop(d, 50, 54, "#FFCF3D", "#B88A00", m, sh, { w: 22, h: 24 })); },
    stk_dp_cherry: () => {
      const d = `${circle(32, 64, 20)} ${circle(68, 64, 20)}`, leaf = "M60,12 C70,4 84,8 86,18 C76,22 66,20 60,12 Z";
      // くき と はっぱ: しろい ふちの ために ふとい くきの かたち（とじた かたち）を いっしょに きりぬく
      const stemD = "M32,46 C38,26 47,16 59,9 L61,14 C50,20 42,30 36,47 Z M64,47 C63,32 61,24 58,13 L62,12 C65,23 67,32 68,47 Z";
      const stem = cut(`${stemD} ${leaf}`, "#7CC36B", `<path d="M34,46 C40,28 48,18 60,12 M66,46 C64,30 62,22 60,12" fill="none" stroke="#5C8A3A" stroke-width="4" stroke-linecap="round"/><path d="${leaf}" fill="#7CC36B" ${sk(1.8)}/><path d="M64,13 C72,12 78,14 82,16" fill="none" stroke="#5C9A44" stroke-width="1.2"/>`, { rim: 6 });
      return svg(stem + drop(d, 50, 64, "#FF4F64", "#A51D33", dot(32, 64, 9, 0.18) + dot(68, 64, 9, 0.18), "", { w: 30, h: 14, cx: 0, cy: 12, rx: 20, ry: 4 }));
    },
    stk_dp_bunny: () => {
      const d = `M36,46 C28,30 26,10 34,8 C42,6 46,24 46,40 C48,40 52,40 54,40 C54,24 58,6 66,8 C74,10 72,30 64,46 C78,52 82,72 72,82 C62,92 38,92 28,82 C18,72 22,52 36,46 Z`;
      const m = `<path d="M34,14 C36,22 38,30 40,38 M66,14 C64,22 62,30 60,38" fill="none" stroke="#FF8FB0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>` + face(50, 66, 1.05);
      return svg(drop(d, 50, 66, "#FFD1E3", "#D9799C", m, `<path d="M34,14 C36,22 38,30 40,38 M66,14 C64,22 62,30 60,38" fill="none" stroke="#7A2E4C" stroke-width="5" stroke-linecap="round"/>`, { w: 24, h: 20, cy: 16 }));
    },
    stk_dp_gem: () => {
      const d = "M30,16 L70,16 L90,40 L50,90 L10,40 Z", m = `<path d="M10,40 L90,40 M30,16 L40,40 L50,16 L60,40 L70,16 M40,40 L50,90 L60,40" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity="0.75"/><path d="M30,16 L40,40 L10,40 Z" fill="#FFFFFF" opacity="0.28"/><path d="M60,40 L90,40 L50,90 Z" fill="#0B4F6C" opacity="0.18"/>`;
      return svg(drop(d, 50, 48, "#6FD3EA", "#1E7FA0", m, "", { w: 24, h: 22, cy: 20 }));
    },
    // ---- フレーク（おかし）----
    stk_fk_cupcake: () => svg(flake("M24,52 C16,40 28,26 40,30 C44,16 64,14 66,30 C80,28 86,44 76,52 L70,88 L30,88 Z", "#FFC2D9", `<path d="M26,54 L74,54 L68,88 L32,88 Z" fill="#F2B66B" ${sk(2.2)}/><path d="M38,56 L40,86 M50,56 V86 M62,56 L60,86" stroke="#C98A3E" stroke-width="2"/><circle cx="52" cy="22" r="6" fill="#FF4F64" ${sk(2)}/>` + [[36, 42, "#9FD3F0"], [48, 36, "#FFE680"], [62, 44, "#FFFFFF"], [44, 48, "#B8E6A6"]].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="6" height="2.4" rx="1.2" fill="${c}" transform="rotate(${i * 50 - 40} ${x} ${y})"/>`).join(""))),
    stk_fk_cookie: () => svg(flake(heartD(50, 50, 1.3), "#E3A55E", `<path d="${heartD(50, 50, 1.02)}" fill="#FFE3EE" ${sk(1.6)}/>` + [[40, 42], [58, 40], [50, 54], [42, 60], [60, 58]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${["#FF6F9C", "#9FD3F0", "#FFE680"][i % 3]}"/>`).join(""))),
    stk_fk_pudding: () => svg(flake("M26,80 L34,34 C36,24 64,24 66,34 L74,80 Z M14,82 C14,76 86,76 86,82 C86,90 14,90 14,82 Z", "#FFE59A", `<path d="M33,40 C36,30 64,30 67,40 C60,46 40,46 33,40 Z" fill="#B8692F" ${sk(2)}/><path d="M14,82 C14,76 86,76 86,82 C86,90 14,90 14,82 Z" fill="#E9F6FB" ${sk(2)}/>` + eyes(50, 58, 7, 0.9) + cheeks(50, 63, 12, 0.8) + `<circle cx="50" cy="22" r="5" fill="#FF4F64" ${sk(1.8)}/>`)),
    stk_fk_cake: () => svg(flake("M16,70 L50,30 L84,70 L84,86 L16,86 Z", "#FFF6E8", `<path d="M16,70 L84,70" ${sk(2)}/><path d="M16,76 L84,76" stroke="#FF9EB8" stroke-width="4"/><path d="M50,30 L84,70" stroke="#FFFFFF" stroke-width="5" opacity="0.7"/><path d="M50,20 C44,20 40,26 42,32 C44,38 56,38 58,32 C60,26 56,20 50,20 Z" fill="#FF4F64" ${sk(2)}/><path d="M48,20 q2 -6 6 -6" fill="none" stroke="#5C8A3A" stroke-width="2"/>`)),
    stk_fk_lolli: () => svg(flake(`${circle(50, 38, 28)} M47,64 L53,64 L53,92 L47,92 Z`, "#FFFFFF", `<circle cx="50" cy="38" r="28" fill="#FFF6E8" ${sk(2.2)}/>` + ["#FF6F9C", "#9FD3F0", "#FFE680", "#B8E6A6"].map((c, i) => `<path d="M50,38 m${f1(Math.cos(i * 1.57) * 4)},${f1(Math.sin(i * 1.57) * 4)} a20,20 0 0,1 ${f1(Math.cos(i * 1.57 + 1.2) * 16)},${f1(Math.sin(i * 1.57 + 1.2) * 16)}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join("") + `<rect x="47" y="66" width="6" height="26" rx="3" fill="#F7EDE0" ${sk(1.8)}/><path d="M44,70 C40,62 46,58 50,64 C54,58 60,62 56,70 Z" fill="#FF8FB0" ${sk(1.6)}/>`)),
    stk_fk_soda: () => svg(flake("M30,40 C26,22 74,22 70,40 L64,86 C64,90 36,90 36,86 Z", "#9EE6C8", `<path d="M32,46 L68,46 L64,86 C64,90 36,90 36,86 Z" fill="#7FDDB4" ${sk(2)}/><path d="M30,40 C26,20 46,14 50,26 C56,12 76,22 70,40 Z" fill="#FFFFFF" ${sk(2)}/><circle cx="54" cy="16" r="6" fill="#FF4F64" ${sk(1.8)}/><path d="M60,12 L76,2" stroke="#FF9EB8" stroke-width="4" stroke-linecap="round"/>` + [[44, 60], [56, 70], [48, 78], [58, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#FFFFFF" opacity="0.85"/>`).join(""))),
    // ---- フレーク（おはなと ことり）----
    stk_fk_sakura: () => { let d = ""; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5, x = 50 + Math.cos(a) * 22, y = 52 + Math.sin(a) * 22; d += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="15" ry="19" fill="#FFC8DA" ${sk(2)} transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})"/>`; } return svg(flake(circle(50, 52, 40), "#FFE3EC", d + `<circle cx="50" cy="52" r="9" fill="#FFE680" ${sk(1.8)}/>` + [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * TAU) / 5; return `<path d="M${f1(50 + Math.cos(a) * 4)},${f1(52 + Math.sin(a) * 4)} L${f1(50 + Math.cos(a) * 14)},${f1(52 + Math.sin(a) * 14)}" stroke="#F06B95" stroke-width="1.6"/>`; }).join(""), { rim: 5 })); },
    stk_fk_tulip: () => svg(flake("M30,20 L40,30 L50,16 L60,30 L70,20 C76,44 66,58 54,60 L54,88 L46,88 L46,60 C34,58 24,44 30,20 Z", "#FF8C7A", `<path d="M50,60 V88" stroke="#5C8A3A" stroke-width="5"/><path d="M50,80 C36,82 30,72 32,66 C42,66 48,72 50,80 Z M50,74 C62,74 68,66 66,60 C58,60 52,66 50,74 Z" fill="#7CC36B" ${sk(1.8)}/><path d="M40,32 C38,42 42,50 48,54" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.7" stroke-linecap="round"/>`)),
    stk_fk_sunflower: () => { let p = ""; for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12, x = 50 + Math.cos(a) * 26, y = 48 + Math.sin(a) * 26; p += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="8" ry="13" fill="#FFD23F" ${sk(1.6)} transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})"/>`; } return svg(flake(circle(50, 48, 40), "#FFF1B8", p + `<circle cx="50" cy="48" r="16" fill="#8A5A2B" ${sk(2)}/>` + eyes(50, 46, 6, 0.8) + mouth(50, 52, 0.8), { rim: 5 })); },
    stk_fk_bird: () => svg(flake("M22,58 C18,36 36,22 54,26 C64,14 82,16 84,30 C92,36 90,48 80,52 C78,74 58,84 40,80 C26,78 18,70 22,58 Z", "#9FD3F0", `<path d="M40,52 C48,42 64,46 66,58 C58,66 46,64 40,52 Z" fill="#6FB6E8" ${sk(1.8)}/><path d="M84,32 L96,36 L84,40 Z" fill="#FFB347" ${sk(1.6)}/>` + `<circle cx="74" cy="32" r="3" fill="${K}"/><circle cx="75" cy="31" r="1" fill="#FFFFFF"/>` + `<ellipse cx="72" cy="42" rx="4" ry="2.4" fill="#F7A0B4" opacity="0.8"/>`)),
    stk_fk_butterfly: () => svg(flake("M50,40 C42,16 12,10 14,32 C16,46 32,50 46,50 C30,54 18,66 24,80 C32,90 46,78 50,62 C54,78 68,90 76,80 C82,66 70,54 54,50 C68,50 84,46 86,32 C88,10 58,16 50,40 Z", "#FFD1E3", `<circle cx="30" cy="32" r="6" fill="#FF8FB0"/><circle cx="70" cy="32" r="6" fill="#FF8FB0"/><circle cx="34" cy="70" r="4" fill="#C9B6EE"/><circle cx="66" cy="70" r="4" fill="#C9B6EE"/><path d="M50,34 V74" ${sk(4)}/><path d="M50,34 C46,24 42,20 38,18 M50,34 C54,24 58,20 62,18" fill="none" ${sk(1.6)}/>`)),
    stk_fk_clover: () => svg(flake(`${circle(36, 36, 16)} ${circle(64, 36, 16)} ${circle(36, 62, 16)} ${circle(64, 62, 16)}`, "#8FD07A", `<path d="M50,49 C54,70 60,82 70,92" fill="none" stroke="#5C9A44" stroke-width="4" stroke-linecap="round"/>` + [[36, 36], [64, 36], [36, 62], [64, 62]].map(([x, y]) => `<path d="M${x},${y} L${f1(x + (50 - x) * 0.7)},${f1(y + (49 - y) * 0.7)}" stroke="#5C9A44" stroke-width="1.6"/>`).join("") + `<path d="M28,30 q4 -6 10 -6" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity="0.7" stroke-linecap="round"/>`)),
    // ---- タイル（3×3 の シートを じぶんで きる）----
    stk_tl_sheet: () => {
      // だいしの シート（しろい ふち・きりとりせん）に タイル 9まい
      let s = "";
      for (const k of [1, 2]) s += `<path d="M${f1(7 + k * 29)},8 V92 M8,${f1(7 + k * 29)} H92" stroke="#C9BBA6" stroke-width="1.2" stroke-dasharray="3 2.6"/>`;
      TILE_ORDER.forEach((id, i) => { const T = TILE[id]; s += tile(10 + (i % 3) * 29, 10 + Math.floor(i / 3) * 29, 23, T.c, T.m); });
      return svg(cut(rrect(5, 5, 90, 90, 8), "#FFF8EC", s, { rim: 5 }));
    },
    // ---- へいせい レトロ（Y2K）----
    stk_y2_phone: () => svg(cut("M30,10 L62,10 C68,10 70,14 70,20 L70,44 L72,48 L72,82 C72,88 68,92 62,92 L38,92 C32,92 28,88 28,82 L28,48 L30,44 Z M62,10 L64,4 C64,0 70,0 70,4 L68,11 Z " + heartD(20, 88, 0.3), "#FFB3D4",
      `<rect x="34" y="16" width="30" height="24" rx="3" fill="#BFE8F7" ${sk(1.8)}/><path d="M38,22 L44,22 M38,27 L52,27 M38,32 L48,32" stroke="#6FB6E8" stroke-width="2" stroke-linecap="round"/><path d="${heartD(56, 31, 0.18)}" fill="#FF5C8A"/>`
      + `<path d="M28,47 L72,47" ${sk(2)}/>` + [[40, 58], [50, 58], [60, 58], [40, 67], [50, 67], [60, 67], [40, 76], [50, 76], [60, 76]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="2.6" fill="#FFFFFF" ${sk(1.2)}/>`).join("")
      + `<path d="M64,8 L66,3" ${sk(2.4)}/><circle cx="67" cy="3" r="2.6" fill="#FFE14D" ${sk(1.2)}/><path d="M29,80 C24,80 21,82 20,85" fill="none" stroke="#9E7BE8" stroke-width="2"/><path d="${heartD(20, 88, 0.3)}" fill="#C9A8FF" ${sk(1.4)}/>` + holo("M30,10 L62,10 C68,10 70,14 70,20 L70,44 L72,48 L72,82 C72,88 68,92 62,92 L38,92 C32,92 28,88 28,82 L28,48 L30,44 Z", 0.18) + arc(34, 52, 10, 26, 2.6, 0.6))),
    stk_y2_pixel: () => { const P = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"]; let s = ""; P.forEach((row, y) => [...row].forEach((v, x) => { if (v === "1") s += `<rect x="${12 + x * 11}" y="${18 + y * 11}" width="11" height="11" fill="${(x + y) % 3 === 0 ? "#FF5C8A" : (x + y) % 3 === 1 ? "#FF7FA8" : "#FF9EBF"}" stroke="${K}" stroke-width="1.2"/>`; })); return svg(cut("M23,18 H45 V29 H56 V18 H78 V29 H89 V62 H78 V73 H67 V84 H34 V73 H23 V62 H12 V29 H23 Z", "#FF7FA8", s + `<rect x="23" y="29" width="11" height="11" fill="#FFFFFF" opacity="0.8"/><rect x="34" y="29" width="5" height="5" fill="#FFFFFF" opacity="0.9"/>`, { rim: 7 })); },
    stk_y2_smile: () => svg(cut(circle(50, 50, 40), "#FFFFFF", ["#FF6F7D", "#FFB347", "#FFE14D", "#7CCF6B", "#6FB6F0", "#B08CEB"].map((c, i) => `<path d="M${16 + i * 3},58 A${34 - i * 3},${34 - i * 3} 0 0 1 ${84 - i * 3},58" fill="none" stroke="${c}" stroke-width="4"/>`).join("") + `<circle cx="50" cy="60" r="18" fill="#FFE14D" ${sk(2.2)}/>` + eyes(50, 56, 6, 0.8) + `<path d="M42,64 Q50,72 58,64" fill="none" ${sk(2)}/>` + holo(circle(50, 50, 40), 0.14))),
    stk_y2_egg: () => svg(cut(ellipseD(50, 52, 34, 42), "#B8E6F7", `<rect x="30" y="26" width="40" height="34" rx="6" fill="#DDE7C7" ${sk(2)}/>` + [[44, 34], [48, 34], [52, 34], [40, 38], [44, 38], [48, 38], [52, 38], [56, 38], [40, 42], [48, 42], [56, 42], [40, 46], [44, 46], [48, 46], [52, 46], [56, 46], [44, 50], [52, 50]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="#4F5B3A"/>`).join("")
      + [[38, 72], [50, 76], [62, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#FFE14D" ${sk(1.8)}/>`).join("") + `<circle cx="50" cy="12" r="5" fill="none" ${sk(2)}/>` + arc(24, 30, 10, 22, 3, 0.7))),
    // ---- そざい ----
    // かみ: つやなし・かみの つぶ
    stk_mt_paper: () => { const r = rnd(21); let g = ""; for (let i = 0; i < 40; i++) g += dot(14 + r() * 72, 18 + r() * 70, 0.6 + r() * 0.5, 0.35, "#C9B79C"); return svg(cut("M18,40 C18,24 30,16 36,24 L42,14 L50,26 L58,14 L64,24 C70,16 82,24 82,40 C88,62 72,86 50,86 C28,86 12,62 18,40 Z", "#F8E2C4", g + face(50, 54, 1.15) + `<path d="M28,58 L16,56 M28,62 L16,64 M72,58 L84,56 M72,62 L84,64" ${sk(1.4)}/>`)); },
    // フィルム: うすい・ななめの ひかりの おび
    stk_mt_film: () => svg(cut("M50,10 C72,10 82,30 80,54 C78,78 66,90 50,90 C34,90 22,78 20,54 C18,30 28,10 50,10 Z", "#3F4A66", `<path d="M50,30 C64,30 70,44 68,60 C66,76 58,84 50,84 C42,84 34,76 32,60 C30,44 36,30 50,30 Z" fill="#FFFFFF"/>` + eyes(50, 44, 8, 0.9) + `<path d="M45,52 L55,52 L50,58 Z" fill="#FFB347" ${sk(1.4)}/><path d="M26,80 C32,76 38,78 40,86 M74,80 C68,76 62,78 60,86" fill="#FFB347" ${sk(1.6)}/>` + `<path d="M14,70 L64,8 L76,8 L26,70 Z" fill="#FFFFFF" opacity="0.22"/><path d="M30,84 L78,24 L82,28 L34,88 Z" fill="#FFFFFF" opacity="0.14"/>`, { rim: 5 })),
    // わし: すける かみ・せんいの すじ・せいがいはの もよう
    stk_mt_washi: () => { const r = rnd(33); let fib = ""; for (let i = 0; i < 18; i++) { const x = 14 + r() * 70, y = 16 + r() * 66; fib += `<path d="M${f1(x)},${f1(y)} q${f1(4 + r() * 6)} ${f1(-3 + r() * 6)} ${f1(10 + r() * 8)} ${f1(-2 + r() * 4)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" opacity="0.8"/>`; }
      let wave = ""; for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { const cx = 20 + x * 20 + (y % 2) * 10, cy = 74 + y * 7; wave += `<path d="M${cx - 9},${cy} a9,9 0 0 1 18,0" fill="none" stroke="#8FB8E0" stroke-width="1.4" opacity="0.7"/>`; }
      const fish = `<path d="M30,44 C38,30 56,30 62,42 C56,54 38,56 30,44 Z" fill="#FF6F5C" ${sk(2)}/><path d="M62,42 C70,32 82,30 86,36 C82,42 82,46 86,52 C80,56 70,52 62,42 Z" fill="#FF8C7A" ${sk(2)}/><circle cx="38" cy="41" r="2.4" fill="${K}"/><path d="M44,38 q6 4 0 9" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.8"/>`;
      const torn = "M12,14 L30,12 L44,15 L62,11 L80,14 L90,12 L88,34 L91,56 L87,74 L90,90 L70,88 L52,91 L32,87 L14,90 L10,70 L13,50 L9,30 Z";
      return svg(`<g opacity="0.93">${cut(torn, "#F4EEDC", clip(torn, fib + wave) + fish + `<circle cx="56" cy="22" r="2" fill="#FFFFFF" stroke="#8FB8E0" stroke-width="1"/><circle cx="62" cy="16" r="1.4" fill="#FFFFFF" stroke="#8FB8E0" stroke-width="1"/>`, { rim: 4 })}</g>`); },
    // とうめい PET: ふちなし。いろの ところだけ・まわりは すけて ページが みえる
    stk_mt_clear: () => svg(`<path d="M50,40 C42,16 12,10 14,32 C16,46 32,50 46,50 C30,54 18,66 24,80 C32,90 46,78 50,62 C54,78 68,90 76,80 C82,66 70,54 54,50 C68,50 84,46 86,32 C88,10 58,16 50,40 Z" fill="#9FD3F0" fill-opacity="0.16" stroke="#FFFFFF" stroke-width="2.4" stroke-opacity="0.7"/>`
      + `<path d="M50,40 C42,16 12,10 14,32 C16,46 32,50 46,50 M54,50 C68,50 84,46 86,32 C88,10 58,16 50,40 M46,50 C30,54 18,66 24,80 C32,90 46,78 50,62 C54,78 68,90 76,80 C82,66 70,54 54,50" fill="none" ${sk(2)}/>`
      + `<path d="M48,38 C42,22 22,18 22,32 C22,40 34,44 44,46 Z M52,38 C58,22 78,18 78,32 C78,40 66,44 56,46 Z" fill="#7FC8F0" fill-opacity="0.55"/><path d="M46,54 C34,58 28,66 30,74 C34,80 44,74 48,64 Z M54,54 C66,58 72,66 70,74 C66,80 56,74 52,64 Z" fill="#C9A8FF" fill-opacity="0.55"/>`
      + `<path d="M50,34 V72" ${sk(4)}/><path d="M50,34 C46,24 42,20 38,18 M50,34 C54,24 58,20 62,18" fill="none" ${sk(1.6)}/>` + `<path d="M20,28 q6 -10 16 -8" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity="0.8" stroke-linecap="round"/>`),
    // はくおし: こんいろの かみに きんの せん（つき と ほし）
    stk_mt_foil: () => { const G = "#E8C15A", G2 = "#FFF1B8", G3 = "#B8902E";
      return svg(cut(rrect(12, 12, 76, 76, 12), "#22305A", `<path d="M58,26 a22,22 0 1 0 14,38 a17,17 0 1 1 -14,-38 Z" fill="${G}" stroke="${G3}" stroke-width="1.4"/><path d="M52,32 a18,18 0 0 0 -2,24" fill="none" stroke="${G2}" stroke-width="2" opacity="0.9" stroke-linecap="round"/>`
        + [[30, 30, 6], [72, 26, 4], [28, 66, 5], [70, 74, 7]].map(([x, y, R]) => `<path d="${starD(x, y, R, R * 0.42, 4)}" fill="${G}" stroke="${G3}" stroke-width="1"/><path d="M${x - R * 0.3},${y - R * 0.3} l${R * 0.3},${R * 0.3}" stroke="${G2}" stroke-width="1"/>`).join("")
        + `<rect x="18" y="18" width="64" height="64" rx="8" fill="none" stroke="${G}" stroke-width="1.6" stroke-dasharray="1 3" stroke-linecap="round"/>`)); },
  };
  // タイル 9まい（シートを きると でる）
  for (const id of TILE_ORDER) FIG["stk_tl_" + id] = () => svg(tile(8, 8, 84, TILE[id].c, TILE[id].m));

  // ミラー: ぎんいろの しまの はんしゃ（しまは ハートの なかだけ）
  FIG.stk_mt_mirror = () => {
    const d = heartD(50, 52, 1.32); let band = "";
    [["#F4F6F9", -40], ["#C9D0DA", -20], ["#FFFFFF", -8], ["#9AA4B2", 8], ["#E3E8EE", 24], ["#B7C0CC", 40], ["#FFFFFF", 52], ["#A9B3C1", 62]].forEach(([c, x]) => { band += `<path d="M${x + 10},96 L${x + 50},6 L${x + 66},6 L${x + 26},96 Z" fill="${c}"/>`; });
    return svg(cut(d, "#DDE3EA", clip(d, band) + `<path d="${d}" fill="none" ${sk(2.2)}/>` + arc(28, 26, 20, 12, 3.4, 0.95) + dot(30, 30, 2.2)));
  };
  // シャカシャカ 4しゅ（なかみは かさねる 4まい。FIG は ぜんぶ かさねた 絵）
  const SHAKA = {
    stk_sk_sea: () => shaka({
      outline: circle(50, 50, 42), frame: "#6FB6E8", wc: [50, 50],
      decor: Array.from({ length: 12 }, (_, i) => { const a = (i * TAU) / 12; return `<circle cx="${f1(50 + Math.cos(a) * 37)}" cy="${f1(50 + Math.sin(a) * 37)}" r="3.4" fill="#FFFFFF" ${sk(1.2)}/>`; }).join(""),
      window: circle(50, 50, 31), win: { t: "circle", cx: 50, cy: 50, r: 31 }, water: "#BFE8F7",
      inside: `<path d="M22,68 C30,62 40,70 50,66 C60,62 70,70 78,64 L74,74 C66,80 34,80 26,74 Z" fill="#F3DFA8" opacity="0.9"/>`,
      items: [["fish", "#FF8C5A", 6, 2], ["fish", "#FFD23F", 5, 1], ["ring", "#6FB6E8", 2.4, 7], ["star", "#FFE14D", 3, 5], ["sequin", "#9FE6F2", 2.2, 6], ["dot", "#FFFFFF", 1.2, 26], ["dot", "#4FB3E0", 1.1, 20]], seed: 41, gloss: [44, 44, 26],
    }),
    stk_sk_snow: () => shaka({
      outline: `${circle(50, 42, 34)} M24,66 L76,66 L84,92 L16,92 Z`, frame: "#E8F4FB", wc: [50, 42],
      decor: `<path d="M24,66 L76,66 L84,92 L16,92 Z" fill="#C97B4A" ${sk(2)}/><path d="M22,74 L78,74" stroke="#E8A774" stroke-width="3"/><path d="M40,82 L60,82" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
      window: circle(50, 42, 30), win: { t: "circle", cx: 50, cy: 42, r: 30 }, water: "#E4F3FB",
      inside: `<path d="M24,58 C34,52 66,52 76,58 C70,70 30,70 24,58 Z" fill="#FFFFFF"/><circle cx="50" cy="46" r="10" fill="#FFFFFF" ${sk(1.8)}/><circle cx="50" cy="30" r="7" fill="#FFFFFF" ${sk(1.8)}/><path d="M47,29 l0 0 M53,29 l0 0" ${sk(2.6)}/><path d="M50,32 l5 1.4 l-5 1.2 Z" fill="#FF8C3A"/><path d="M43,37 C47,40 53,40 57,37" fill="none" stroke="#FF5C8A" stroke-width="3"/><path d="M44,22 L56,22 L54,16 L46,16 Z" fill="#6FB6E8" ${sk(1.4)}/>`,
      items: [["flake", "#FFFFFF", 3, 7], ["flake", "#BFD8EE", 2.4, 4], ["dot", "#FFFFFF", 1.5, 34], ["dot", "#A9C2DE", 1.1, 16]], seed: 53, gloss: [44, 36, 24],
    }),
    stk_sk_star: () => shaka({
      outline: rrect(10, 10, 80, 80, 16), frame: "#FFE28A", wc: [50, 50],
      decor: [[18, 18], [82, 18], [18, 82], [82, 82]].map(([x, y]) => `<path d="${starD(x, y, 5.4, 2.4)}" fill="#FFFFFF" ${sk(1.2)}/>`).join(""),
      window: rrect(20, 20, 60, 60, 10), win: { t: "rrect", x: 20, y: 20, w: 60, h: 60 }, water: "#33407E",
      inside: `<path d="M60,30 a12,12 0 1 0 8,20 a9,9 0 1 1 -8,-20 Z" fill="#FFE680" ${sk(1.4)}/>`,
      items: [["star", "#FFE14D", 3.4, 6], ["star", "#FFFFFF", 2.4, 4], ["dot", "#FFFFFF", 1, 26], ["dot", "#FFD23F", 1.2, 20], ["sequin", "#C9A8FF", 2.4, 6]], seed: 67, gloss: [42, 40, 26],
    }),
    stk_sk_heart: () => shaka({
      outline: heartD(50, 52, 1.36), frame: "#FFB3CC", wc: [50, 50],
      decor: Array.from({ length: 14 }, (_, i) => { const t = (i / 14) * TAU, X = 16 * Math.pow(Math.sin(t), 3), Y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return `<circle cx="${f1(50 + X * 2.15)}" cy="${f1(49 - Y * 2.15)}" r="2.2" fill="#FFFFFF"/>`; }).join(""),
      window: heartD(50, 52, 0.98), win: { t: "heart", cx: 50, cy: 48, s: 22 }, water: "#FFE6F0",
      items: [["heart", "#FF5C8A", 3.6, 5], ["heart", "#C9A8FF", 3, 4], ["ring", "#FFFFFF", 2.4, 7], ["dot", "#FF6F9C", 1.1, 26], ["dot", "#FFFFFF", 1.3, 18], ["sequin", "#FFD1E3", 2.2, 5]], seed: 79, gloss: [44, 44, 22],
    }),
  };
  const LAYER = {};
  for (const [id, fn] of Object.entries(SHAKA)) {
    const L = (LAYER[id] = { built: null, get() { return this.built || (this.built = fn()); } });
    FIG[id] = () => { const p = L.get(); return svg(p.base + p.rest + p.top); };
  }
  // シャカシャカの 4まい（シールちょうの ページで かさねる。どれも 100×100）
  const layers = (id) => { const L = LAYER[id]; if (!L) return null; const p = L.get(); return { base: svg(p.base), rest: svg(p.rest), up: svg(p.up), top: svg(p.top) }; };

  // ======================= うりばの しなもの（パック）=======================
  // 100×120: つりさげの あなの ある いろの カード・とうめいの ふくろ・なかの シール（id と かず）
  const pack = (p) => {
    const ids = (p.stickers || []).flatMap(([id, n]) => Array(Math.min(n, 3)).fill(id));
    let s = `<ellipse cx="50" cy="116" rx="38" ry="3" fill="#4F465622"/>`;
    s += `<path d="M10,4 H90 Q94,4 94,8 V30 H6 V8 Q6,4 10,4 Z" fill="${p.color}" ${sk(2)}/><ellipse cx="50" cy="12" rx="9" ry="3.6" fill="#FFFFFF" ${sk(1.6)}/>`;
    s += [0, 1, 2].map((i) => `<circle cx="${f1(24 + i * 26)}" cy="23" r="3.2" fill="#FFFFFF" opacity="0.85"/>`).join("");
    s += `<rect x="8" y="30" width="84" height="82" rx="4" fill="#FFFFFF" ${sk(2)}/>`;
    if (p.kind === "flake") {
      const r = rnd(p.id.length * 7 + 3); ids.slice(0, 12).forEach((id, i) => { const x = 14 + (i % 4) * 19 + r() * 4, y = 36 + Math.floor(i / 4) * 24 + r() * 4; s += place(StickerArt.piece(id), x, y, 22, 22); });
    } else if (ids.length === 1) s += place(StickerArt.piece(ids[0]), 16, 38, 68, 68);
    else if (ids.length === 2) { s += place(StickerArt.piece(ids[0]), 10, 40, 46, 46) + place(StickerArt.piece(ids[1]), 46, 60, 44, 44); }
    else ids.slice(0, 6).forEach((id, i) => { const n = Math.min(ids.length, 6), cols = n > 4 ? 3 : 2, w = cols === 3 ? 26 : 36; s += place(StickerArt.piece(id), 12 + (i % cols) * (76 / cols) + (76 / cols - w) / 2, 36 + Math.floor(i / cols) * (w + 4), w, w); });
    // ふくろの つや
    s += `<path d="M14,36 L30,36 L18,108 L12,108 Z" fill="#FFFFFF" opacity="0.32"/><rect x="8" y="30" width="84" height="82" rx="4" fill="#D6EEF7" opacity="0.12"/>`;
    return svg(s, 100, 120);
  };
  // シャカシャカの まど（なかみが はいる ところ。検査用）
  const windowOf = (id) => (LAYER[id] ? LAYER[id].get().win : null);
  return { FIG, SHAKA, TILE, TILE_ORDER, layers, windowOf, inWin, pack };
})();
