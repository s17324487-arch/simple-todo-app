// 家具の 立体モデルを 作りなおす（ROADMAP M9 の ART-03）。
// ID・大きさ（HomeDesign.dimensions）・ねだん・おいた 場所は かえずに、絵だけを こまかく する。
// HomeDesign.model() が さいしょに FurnModels.build() を よぶ。ここに ない 家具は これまでの 絵の まま。
// ざひょう: x は よこ（-w/2〜w/2）、y は おく（-d）〜てまえ（0）、z は 上。見える 面は てまえ（+y）・みぎ（+x）・上（+z）。
// うしろ → てまえ、下 → 上 の 順に かさねて 描く。はんてん（flip）は 投影で かわるので、形は 1とおりで よい。
const FurnModels = (() => {
  const TAU = Math.PI * 2;
  const f4 = (n) => (Math.round(n * 1e4) / 1e4).toString();
  let gid = 0; // グラデーションの id（SVG ごとに かならず ちがう）

  // ---- 2D の 形（[s, t] の 点の ならび。t は 上むき）----
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const rr = (x, y, w, h, r = 0, n = 5) => {
    r = Math.min(r, w / 2, h / 2);
    if (r <= 0) return rect(x, y, w, h);
    const out = [];
    for (const [cx, cy, a0] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]) {
      for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    }
    return out;
  };
  const ov = (cx, cy, a, b, n = 36) => Array.from({ length: n }, (_, i) => { const t = (i / n) * TAU; return [cx + Math.cos(t) * a, cy + Math.sin(t) * b]; });
  const arc = (cx, cy, a, b, t0, t1, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [cx + Math.cos(t) * a, cy + Math.sin(t) * b]; });
  const close = (ps) => [...ps, ps[0]];
  // 下が まっすぐで 上が まるい 形（ヘッドボード・だんろの 口）
  const arch = (s0, s1, t0, t1, t2, n = 18) => [[s0, t0], [s1, t0], ...Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [s1 + (s0 - s1) * u, t1 + (t2 - t1) * Math.sin(Math.PI * u)]; })];
  const star = (cx, cy, r1, r2, n = 5, rot = Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i * Math.PI) / n, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const heart = (cx, cy, s, n = 28) => Array.from({ length: n }, (_, i) => { const t = (i / n) * TAU; return [cx + (16 * Math.sin(t) ** 3 * s) / 16, cy + ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s) / 16]; });
  // s1 から s0 へ、t の 高さで 下むきの なみなみ（フリル・すそ）
  const scallop = (s0, s1, t, r) => {
    const n = Math.max(1, Math.round((s1 - s0) / (2 * r))), step = (s1 - s0) / n, out = [];
    for (let i = n - 1; i >= 0; i--) { const c = s0 + step * (i + 0.5); for (let j = 0; j <= 6; j++) { const a = (j / 6) * Math.PI; out.push([c + (Math.cos(a) * step) / 2, t - Math.sin(a) * r]); } }
    return out;
  };
  const moon = (cx, cy, r) => [...arc(cx, cy, r, r, 1, TAU - 1, 18), ...arc(cx + r * 0.5, cy, r * 0.841, r * 0.841, -1.523, -(TAU - 1.523), 14)];
  const rot2 = (ps, cx, cy, a) => ps.map(([s, t]) => [cx + (s - cx) * Math.cos(a) - (t - cy) * Math.sin(a), cy + (s - cx) * Math.sin(a) + (t - cy) * Math.cos(a)]);
  const norm = (v) => { const L = Math.hypot(...v) || 1; return v.map((c) => c / L); };
  // きまった 乱数（同じ 家具は いつも 同じ 絵）
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // ---- 画面の 上の 小さな 絵（下の まん中が 0,0。上は -y）----
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const SPR = {
    teapot: (c = "#FFFFFF", deco = "#EFA9B6") => `<path d="M8,-10 Q15,-11 16,-17" fill="none" ${S(2.4)}/><path d="M8,-10 Q15,-11 16,-17" fill="none" stroke="${c}" stroke-width="1"/>` +
      `<path d="M-8,-11 Q-14,-11 -13,-6 Q-12,-3 -8,-4.5" fill="none" ${S(1.6)}/><path d="M-9,-1.5 Q-11.5,-9 -7,-13 Q0,-16.5 7,-13 Q11.5,-9 9,-1.5 Z" fill="${c}" ${S(1.5)}/>` +
      `<ellipse cx="0" cy="-13.4" rx="5" ry="1.8" fill="${deco}" ${S(1.2)}/><circle cx="0" cy="-16" r="1.6" fill="${deco}" ${S(1)}/><path d="M-4.5,-7 q2,-2.6 4.5,0 q2.5,-2.6 4.5,0" fill="none" stroke="${deco}" stroke-width="1.5"/>`,
    kyusu: () => `<path d="M-9,-8 L-16,-11" ${S(3.2)}/><path d="M-9,-8 L-16,-11" stroke="#9A6A45" stroke-width="1.6" stroke-linecap="round"/><path d="M-8,-1.5 Q-10,-9 -5,-11.5 Q0,-13 5,-11.5 Q10,-9 8,-1.5 Z" fill="#7C9A8A" ${S(1.4)}/><path d="M8,-6 Q13,-6 13.5,-9" fill="none" ${S(1.8)}/><ellipse cx="0" cy="-11.6" rx="4" ry="1.4" fill="#93B2A1" ${S(1.1)}/><circle cx="0" cy="-13.4" r="1.2" fill="#93B2A1" ${S(0.9)}/>`,
    sprig: (c = "#F2A7B8") => `<path d="M0,0 Q-1,-6 1,-12" fill="none" stroke="#6F9A5E" stroke-width="1.4"/><path d="M0,-5 Q-5,-7 -5,-3 Q-2,-3 0,-5 Z" fill="#8DB87A" ${S(0.9)}/>` + flowerSvg(1, -13, 3.4, c, "#F7D56A", 0.9),
    rose: () => `<path d="M0,0 Q1,-8 0,-15" fill="none" stroke="#6F9A5E" stroke-width="1.4"/><path d="M0,-7 Q5,-10 6,-6 Q2,-5 0,-7 Z" fill="#8DB87A" ${S(0.9)}/><circle cx="0" cy="-17" r="3.6" fill="#E77E8E" ${S(1)}/><path d="M-1.8,-17.4 q1.8,-2 3.6,0 q-1.8,1.6 -3.6,0" fill="none" stroke="#C2566A" stroke-width="0.9"/>`,
    branch: () => `<path d="M0,0 Q-3,-10 -9,-18 M0,0 Q2,-12 7,-20 M-2,-8 Q-8,-9 -11,-12" fill="none" stroke="#7B5B3E" stroke-width="1.5" stroke-linecap="round"/>` + [[-9, -18], [7, -20], [-11, -12], [3, -14], [-5, -13]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${-30 + i * 25} ${x} ${y})" fill="${i % 2 ? "#9EC48A" : "#7FAE6C"}" ${S(0.9)}/>`).join(""),
    candle: (hh = 0) => `<path d="M0,${-1 - hh} C-2.6,${-4 - hh} -1.2,${-7.5 - hh} 0,${-9.5 - hh} C1.2,${-7.5 - hh} 2.6,${-4 - hh} 0,${-1 - hh} Z" fill="#F7B24B" ${S(0.9)}/><path d="M0,${-2 - hh} C-1,${-3.8 - hh} -0.5,${-5.5 - hh} 0,${-6.5 - hh} C0.5,${-5.5 - hh} 1,${-3.8 - hh} 0,${-2 - hh} Z" fill="#FFF3B0"/>`,
    duck: () => `<path d="M-6,-1 Q-8,-7 -3,-8 Q-4,-13 1,-13.5 Q6,-13.5 5.5,-9 Q8,-7.5 7,-3.5 Q5,-0.5 -6,-1 Z" fill="#F7D56A" ${S(1.2)}/><path d="M5,-10.8 L9,-10 L5.4,-8.6 Z" fill="#F29A5B" ${S(0.9)}/><circle cx="2.4" cy="-10.8" r="0.9" fill="${INK}"/><path d="M-3,-5 Q0,-3.5 2.5,-5.2" fill="none" stroke="#E0B640" stroke-width="1"/>`,
    fish: (c = "#F29A5B", c2 = "#FFD08A") => `<path d="M-7,0 Q-1,-6 6,-1 Q-1,5 -7,0 Z" fill="${c}" ${S(1.1)}/><path d="M-6,0 L-11,-4 L-10,0 L-11,4 Z" fill="${c2}" ${S(1)}/><circle cx="3" cy="-1" r="0.9" fill="${INK}"/><path d="M-1,-3.6 Q0,-1 -1,1.8" fill="none" stroke="${c2}" stroke-width="1"/>`,
    seaweed: (hh = 26, c = "#6FAE7C") => `<path d="M-2,0 C-7,${-hh * 0.3} 3,${-hh * 0.45} -2,${-hh * 0.7} C-5,${-hh * 0.85} 0,${-hh * 0.95} 1,${-hh} C4,${-hh * 0.8} 1,${-hh * 0.6} 4,${-hh * 0.4} C6,${-hh * 0.25} 1,${-hh * 0.1} 3,0 Z" fill="${c}" ${S(1.1)}/>`,
    grass: (c = "#8FC08A") => `<path d="M-6,0 Q-6,-6 -8,-9 Q-4,-6 -3,-2 Q-2,-9 0,-12 Q1,-6 1,-2 Q3,-8 6,-10 Q4,-5 5,0 Z" fill="${c}" ${S(1)}/>`,
    castle: () => `<path d="M-10,0 V-12 H-7 V-9 H-4 V-12 H-1 V-9 H2 V-12 H5 V-9 H8 V-12 H10 V0 Z" fill="#F2C6D2" ${S(1.2)}/><path d="M-4,-12 V-20 H-2 V-18 H0 V-20 H2 V-18 H4 V-20 H4 V-12 Z" fill="#F7D9E1" ${S(1.1)}/><path d="M-2.6,0 V-5 Q0,-8 2.6,-5 V0 Z" fill="#6B5A6E" ${S(1)}/><path d="M0,-20 V-25 L4,-23.5 L0,-22" fill="#F7D56A" ${S(0.9)}/>`,
    rocks: () => `<path d="M-9,0 Q-10,-5 -5,-6 Q-2,-9 2,-6 Q7,-6 7,0 Z" fill="#AFB3B8" ${S(1.1)}/><path d="M4,0 Q4,-4 8,-4 Q12,-4 11,0 Z" fill="#C4C0B3" ${S(1)}/>`,
    teddy: () => `<circle cx="-6" cy="-19" r="3.6" fill="#C98A52" ${S(1.2)}/><circle cx="6" cy="-19" r="3.6" fill="#C98A52" ${S(1.2)}/><ellipse cx="0" cy="-4" rx="8.5" ry="6" fill="#C98A52" ${S(1.3)}/><circle cx="0" cy="-13" r="7.5" fill="#C98A52" ${S(1.3)}/><ellipse cx="0" cy="-10.6" rx="3.2" ry="2.4" fill="#F2D9B8" ${S(0.9)}/><circle cx="-2.8" cy="-14" r="1" fill="${INK}"/><circle cx="2.8" cy="-14" r="1" fill="${INK}"/><circle cx="0" cy="-11.2" r="0.9" fill="${INK}"/>`,
    wand: () => `<path d="M0,0 L2,-16" ${S(2.6)}/><path d="M0,0 L2,-16" stroke="#F2B8C6" stroke-width="1.2" stroke-linecap="round"/><path d="${starPath(2.4, -19, 5, 2.2)}" fill="#F7D56A" ${S(1.1)}/>`,
    can: () => `<path d="M-6,0 V-9 Q0,-11 6,-9 V0 Z" fill="#9CC7E6" ${S(1.2)}/><path d="M6,-7 L12,-12 L13,-10.5 L7,-4.5" fill="#9CC7E6" ${S(1)}/><path d="M-6,-8 Q-11,-8 -10,-3 Q-9,-1 -6,-2" fill="none" ${S(1.3)}/><ellipse cx="0" cy="-9.4" rx="6" ry="1.5" fill="#BFDDF0" ${S(1)}/>`,
    monstera: () => [[-10, -14, -40], [10, -16, 35], [0, -24, -5], [-6, -8, -70], [8, -7, 70]].map(([x, y, r], i) => `<path d="M0,0 Q${x * 0.4},${y * 0.5} ${x},${y}" fill="none" stroke="#5F8F55" stroke-width="1.3"/><g transform="translate(${x} ${y}) rotate(${r})"><path d="M0,4 C-8,2 -8,-8 0,-10 C8,-8 8,2 0,4 Z" fill="${i % 2 ? "#7FAE6C" : "#6A9E5E"}" ${S(1)}/><path d="M0,3 V-9 M0,-2 L-4,-5 M0,-5 L4,-7" fill="none" stroke="#A9CF93" stroke-width="0.9"/></g>`).join(""),
    cactus: () => `<path d="M-5,0 V-10 Q-5,-17 0,-17 Q5,-17 5,-10 V0 Z" fill="#7FB06A" ${S(1.2)}/><path d="M-5,-8 Q-9,-8 -9,-12 Q-9,-15 -7,-15 V-11 H-5" fill="#7FB06A" ${S(1.1)}/><path d="M0,-16 V-2 M-2.5,-15 V-2 M2.5,-15 V-2" stroke="#A7CF8E" stroke-width="0.8"/>` + flowerSvg(0, -17.5, 2.6, "#F2A7B8", "#F7D56A", 0.8),
    rosette: () => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<ellipse cx="0" cy="-5" rx="2.2" ry="5.5" transform="rotate(${i * 45} 0 -4)" fill="${i % 2 ? "#9CC8A6" : "#86B893"}" ${S(0.8)}/>`).join("") + `<circle cx="0" cy="-4" r="2" fill="#B7DDBE" ${S(0.8)}/>`,
    blooms: () => `<path d="M-4,0 Q-5,-6 -6,-9 M0,0 V-11 M4,0 Q5,-6 6,-8" fill="none" stroke="#6F9A5E" stroke-width="1.3"/>` + flowerSvg(-6, -10, 3.2, "#F2A7B8", "#F7D56A", 0.9) + flowerSvg(0, -12.5, 3.4, "#C9B6E0", "#F7D56A", 0.9) + flowerSvg(6, -9, 3, "#F7D56A", "#F29A5B", 0.9),
    snake: () => [[-5, -18, -8], [0, -24, 0], [5, -20, 8], [-2, -14, -4]].map(([x, y, r], i) => `<path d="M${x * 0.3},0 Q${x},${y * 0.5} ${x},${y} Q${x + 2},${y * 0.5} ${x * 0.3 + 2},0 Z" transform="rotate(${r} 0 0)" fill="${i % 2 ? "#8FB86F" : "#6E9C5B"}" ${S(1)}/>`).join("") + `<path d="M-3,-6 L3,-6 M-4,-12 L-1,-12" stroke="#C9DE8F" stroke-width="0.9"/>`,
    ivy: () => { let s = ""; for (const [x0, len, bend] of [[-3, 22, -5], [2, 28, 3], [6, 16, 7]]) { s += `<path d="M${x0},-2 Q${x0 + bend},${len * 0.5} ${x0 + bend * 0.4},${len}" fill="none" stroke="#6F9A5E" stroke-width="1.2"/>`; for (let i = 1; i <= 4; i++) { const t = i / 4, x = x0 + bend * (t < 0.5 ? t * 2 * 0.75 : 0.75 - (t - 0.5) * 0.7), y = len * t; s += `<path d="M${f2(x)},${f2(y)} c-3,-1 -4,-4 -1.5,-5 c1,1.6 2.4,2.6 1.5,5 Z" fill="${i % 2 ? "#8DB87A" : "#6FA062"}" ${S(0.8)}/>`; } } return s; },
    sprout: () => `<path d="M0,0 Q0,-5 -1,-8" fill="none" stroke="#6F9A5E" stroke-width="1.3"/><path d="M-1,-7 Q-6,-10 -6,-6 Q-3,-5 -1,-7 Z M-1,-8 Q4,-12 5,-8 Q2,-6 -1,-8 Z" fill="#9ED08C" ${S(0.9)}/>`,
    dome: () => `<path d="M-8,0 V-8 Q-8,-17 0,-17 Q8,-17 8,-8 V0 Z" fill="#E8F6FA" fill-opacity=".55" ${S(1.2)}/><path d="M-5,-10 Q-4.5,-14 -1.5,-15" fill="none" stroke="#FFFFFF" stroke-width="1.4"/><circle cx="0" cy="-18.5" r="1.5" fill="#D9B45C" ${S(0.9)}/>` + SPR.sprout().replace(/<path d="M0,0/, '<path d="M0,-1'),
    metronome: () => `<path d="M-6,0 L-2.6,-18 L2.6,-18 L6,0 Z" fill="#B07A52" ${S(1.2)}/><path d="M-3.4,-4 L-1.8,-15 L1.8,-15 L3.4,-4 Z" fill="#F4E6C6" ${S(0.9)}/><path d="M0,-4 L2.6,-15.5" stroke="${INK}" stroke-width="1.1"/><circle cx="1.8" cy="-12" r="1" fill="#D9B45C"/>`,
    clock: () => `<path d="M-6,0 H6 L5,-2 H-5 Z" fill="#B07A52" ${S(1)}/><circle cx="0" cy="-8" r="6.4" fill="#FFF8E7" ${S(1.3)}/><path d="M0,-8 V-12 M0,-8 L2.8,-6.6" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/><circle cx="0" cy="-15" r="1.4" fill="#D9B45C" ${S(0.8)}/>`,
    photo: () => `<rect x="-6" y="-12" width="12" height="11" rx="1" fill="#E3C06B" ${S(1.1)}/><rect x="-4.2" y="-10.2" width="8.4" height="7.4" fill="#CFE6F1"/><circle cx="-1.6" cy="-6" r="1.6" fill="#F3D98A"/><circle cx="1.8" cy="-5.6" r="1.4" fill="#C98A52"/><path d="M-4.2,-2.8 Q0,-5 4.2,-2.8" fill="#9ED08C"/>`,
    tree: () => `<path d="M-1.4,0 V-8 H1.4 V0 Z" fill="#9A6A45" ${S(1)}/><circle cx="0" cy="-13" r="7" fill="#8DBA78" ${S(1.2)}/><circle cx="-2.6" cy="-15" r="2.2" fill="#A9D093"/>`,
    signal: () => `<path d="M0,0 V-20" ${S(2.4)}/><path d="M0,0 V-20" stroke="#D9D2C2" stroke-width="1"/><rect x="-3" y="-27" width="6" height="10" rx="2" fill="#4B4F5A" ${S(1.1)}/><circle cx="0" cy="-24.4" r="1.6" fill="#E77E6E"/><circle cx="0" cy="-19.8" r="1.6" fill="#9ED08C"/>`,
    puff: () => `<circle cx="0" cy="-5" r="3.4" fill="#FFFFFF" ${S(1)}/><circle cx="4" cy="-8" r="2.6" fill="#FFFFFF" ${S(1)}/><circle cx="-3" cy="-9.6" r="2.2" fill="#FFFFFF" ${S(1)}/>`,
    flag: () => `<path d="M0,0 V-10" ${S(1.6)}/><path d="M0,-10 L9,-7 L0,-4 Z" fill="#F7D56A" ${S(1.1)}/>`,
    starFig: () => `<path d="${starPath(0, -15, 15, 7)}" fill="#F5D66B" ${S(1.6)}/><path d="${starPath(0, -15, 9, 4.2)}" fill="#FBE7A1"/><circle cx="-3.2" cy="-15.4" r="1.2" fill="${INK}"/><circle cx="3.2" cy="-15.4" r="1.2" fill="${INK}"/><path d="M-2,-12.4 Q0,-10.8 2,-12.4" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/><circle cx="-5.2" cy="-12.6" r="1.3" fill="#F2A7B8" fill-opacity=".8"/><circle cx="5.2" cy="-12.6" r="1.3" fill="#F2A7B8" fill-opacity=".8"/>` +
      `<path d="${starPath(-13, -26, 3, 1.3, 4)}" fill="#FFFFFF" ${S(0.8)}/><path d="${starPath(13, -28, 2.4, 1, 4)}" fill="#FFFFFF" ${S(0.8)}/>`,
    macaron: (c) => `<ellipse cx="0" cy="-2" rx="3" ry="1.8" fill="${c}" ${S(0.8)}/><ellipse cx="0" cy="-3.6" rx="3" ry="1.6" fill="${shade(c, 0.25)}" ${S(0.8)}/>`,
    cupcake: () => `<path d="M-3.4,0 L-4,-5 H4 L3.4,0 Z" fill="#F2B8C6" ${S(0.9)}/><path d="M-4.4,-5 Q-4.4,-9.6 0,-10 Q4.4,-9.6 4.4,-5 Z" fill="#FFF6F0" ${S(0.9)}/><circle cx="0" cy="-10.6" r="1.4" fill="#E77E6E"/>`,
    console: () => `<rect x="-9" y="-6" width="18" height="6" rx="2" fill="#F3F0EA" ${S(1)}/><circle cx="-5" cy="-3" r="1.3" fill="#9CC7E6"/><circle cx="5" cy="-3" r="1.3" fill="#F2A7B8"/>`,
    crown: () => `<path d="M-8,0 L-9,-9 L-4.5,-5 L0,-11 L4.5,-5 L9,-9 L8,0 Z" fill="#F0CF6E" ${S(1.2)}/><circle cx="0" cy="-12" r="1.4" fill="#F2A7B8" ${S(0.8)}/><circle cx="-9" cy="-10" r="1.1" fill="#FFFFFF" ${S(0.7)}/><circle cx="9" cy="-10" r="1.1" fill="#FFFFFF" ${S(0.7)}/>`,
    bow: () => `<path d="M0,0 Q-8,-6 -9,0 Q-8,5 0,0 Z M0,0 Q8,-6 9,0 Q8,5 0,0 Z" fill="#F2A7B8" ${S(1.1)}/><path d="M-1,1 L-4,7 M1,1 L4,7" ${S(1.4)}/><path d="M-1,1 L-4,7 M1,1 L4,7" stroke="#F2A7B8" stroke-width="0.8"/><circle cx="0" cy="0" r="1.6" fill="#EE8FA6" ${S(0.9)}/>`,
    brush: () => `<path d="M-9,-1 L1,-4" ${S(2.6)}/><path d="M-9,-1 L1,-4" stroke="#E3C06B" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="5" cy="-5" rx="5" ry="2.8" transform="rotate(-16 5 -5)" fill="#F2B8C6" ${S(1)}/>`,
    egg: () => `<path d="M-4.5,-1 Q-5.5,-4 -2,-4.4 Q1,-6.4 4,-3.8 Q6,-1 2,0 Q-2,1 -4.5,-1 Z" fill="#FFFFFF" ${S(0.9)}/><circle cx="0" cy="-2.4" r="1.7" fill="#F7C548" ${S(0.8)}/>`,
  };

  // ---- 1つの モデルを 組み立てる 道具 ----
  function kit(id, opts) {
    const dm = HomeDesign.dimensions(id), w = dm.w, d = dm.d, h = dm.h, flip = !!opts.flip, pts = [], defs = [];
    const P = (x, y, z = 0) => { const q = flip ? HomeDesign.project(y + d / 2, x - w / 2, z) : HomeDesign.project(x, y, z); pts.push(q); return q; };
    const xy = (q) => f2(q.x) + "," + f2(q.y);
    const sk = (sw) => (sw ? `stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : `stroke="none"`);
    const ex = (e) => (e ? " " + e : "");
    const plane = (o, u, v) => (s, t) => [o[0] + s * u[0] + t * v[0], o[1] + s * u[1] + t * v[1], o[2] + s * u[2] + t * v[2]];
    const FR = (y0) => plane([0, y0, 0], [1, 0, 0], [0, 0, 1]); // てまえ向きの 面（s = x, t = z）
    const SD = (x0) => plane([x0, 0, 0], [0, 1, 0], [0, 0, 1]); // みぎ向きの 面（s = y, t = z）
    const TP = (z0) => plane([0, 0, z0], [1, 0, 0], [0, 1, 0]); // 上向きの 面（s = x, t = y）
    const tilt = (o, u, v) => plane(o, norm(u), norm(v));
    // 面の うら（見る 人から とおい ほう）への ずれ
    const VIEW = [1, 1, 2 * HomeDesign.B];
    const away = (u, v, th) => { let n = norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]); if (n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2] > 0) n = n.map((c) => -c); return n.map((c) => c * th); };
    const poly = (vs, fill, sw = 1.5, e = "") => `<polygon points="${vs.map((v) => xy(P(...v))).join(" ")}" fill="${fill}" ${sk(sw)}${ex(e)}/>`;
    const shape = (m, ps, fill, sw = 1.5, e = "") => poly(ps.map(([s, t]) => m(s, t)), fill, sw, e);
    const line = (vs, col = INK, sw = 1.5, e = "") => `<polyline points="${vs.map((v) => xy(P(...v))).join(" ")}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${ex(e)}/>`;
    const lineOn = (m, ps, col = INK, sw = 1.5, e = "") => line(ps.map(([s, t]) => m(s, t)), col, sw, e);
    // 線を ふちどり つきで（棒・パイプ・ひも）
    const rod = (vs, col, sw = 2.4) => line(vs, INK, sw + 2) + line(vs, col, sw);
    // なめらかな ぬの（点の あいだを 2じ曲線で つなぐ）
    const smooth = (m, ps, fill, sw = 1.5, e = "") => {
      const q = ps.map(([s, t]) => P(...m(s, t))), n = q.length, mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      let dd = "M" + xy(mid(q[n - 1], q[0]));
      for (let i = 0; i < n; i++) dd += " Q" + xy(q[i]) + " " + xy(mid(q[i], q[(i + 1) % n]));
      return `<path d="${dd} Z" fill="${fill}" ${sk(sw)}${ex(e)}/>`;
    };
    const hull = (ps) => {
      const a = ps.slice().sort((p, q) => p.x - q.x || p.y - q.y), cr = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x), lo = [], up = [];
      for (const p of a) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (let i = a.length - 1; i >= 0; i--) { const p = a[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    };
    // 凸な 形に あつみを つける（見える 面 cap と、ふちの rim）。dv は 見る 人から とおざかる むき
    const prism = (m, ps, dv, cap, rim, sw = 1.5, e = "") => {
      const F = ps.map(([s, t]) => P(...m(s, t))), K = ps.map(([s, t]) => { const v = m(s, t); return P(v[0] + dv[0], v[1] + dv[1], v[2] + dv[2]); });
      return `<polygon points="${hull(F.concat(K)).map(xy).join(" ")}" fill="${rim}" ${sk(sw)}/><polygon points="${F.map(xy).join(" ")}" fill="${cap}" ${sk(sw)}${ex(e)}/>`;
    };
    // かたむいた 板（まくら・ふた・写真立て）
    const slab = (o, u, v, ps, th, cap, rim, sw = 1.5) => { const m = tilt(o, u, v); return { m, s: prism(m, ps, away(norm(u), norm(v), th), cap, rim, sw) }; };
    const tri = (c) => (Array.isArray(c) ? c : [c, shade(c, -0.16), shade(c, 0.14)]);
    const box = (x, y, ww, dd, z, hh, c, sw = 1.5) => {
      const [cf, cs, ct] = tri(c), yy = y + dd, xx = x + ww, zz = z + hh;
      return poly([[x, yy, z], [xx, yy, z], [xx, yy, zz], [x, yy, zz]], cf, sw) + poly([[xx, y, z], [xx, yy, z], [xx, yy, zz], [xx, y, zz]], cs, sw) + poly([[x, y, zz], [xx, y, zz], [xx, yy, zz], [x, yy, zz]], ct, sw);
    };
    const cyl = (cx, cy, z, r, hh, side, top, sw = 1.5, n = 28) => prism(TP(z + hh), ov(cx, cy, r, r, n), [0, 0, -hh], top, side, sw);
    // 上と 下で 大きさの ちがう つつ（ランプの かさ）
    const frustum = (cx, cy, z0, r0, z1, r1, side, top, sw = 1.5, n = 32) => {
      const lo = ov(cx, cy, r0, r0, n).map(([s, t]) => P(s, t, z0)), hi = ov(cx, cy, r1, r1, n).map(([s, t]) => P(s, t, z1));
      return `<polygon points="${hull(lo.concat(hi)).map(xy).join(" ")}" fill="${side}" ${sk(sw)}/>` + shape(TP(z1), ov(cx, cy, r1, r1, n), top, sw);
    };
    // 球（どこから 見ても ほぼ 円。はばは 1.23 ばい）
    const ball = (x, y, z, R, fill, sw = 1.3, hi = 0.5) => {
      const q = P(x, y, z), r = R * 1.23; pts.push({ x: q.x - r, y: q.y - r }, { x: q.x + r, y: q.y + r });
      let s = `<circle cx="${f2(q.x)}" cy="${f2(q.y)}" r="${f2(r)}" fill="${fill}" ${sk(sw)}/>`;
      if (hi) { const hx = q.x - r * 0.36, hy = q.y - r * 0.4; s += `<ellipse cx="${f2(hx)}" cy="${f2(hy)}" rx="${f2(r * 0.3)}" ry="${f2(r * 0.17)}" transform="rotate(-35 ${f2(hx)} ${f2(hy)})" fill="#FFFFFF" fill-opacity="${hi}"/>`; }
      return s;
    };
    // 画面の 上の 小さな 絵を、床の 1点に たてる（はんてんでは 左右も かえす）
    const at = (x, y, z, svg, hw = 12, hh = 20, mirror = true) => {
      const q = P(x, y, z); pts.push({ x: q.x - hw, y: q.y - hh }, { x: q.x + hw, y: q.y + 4 });
      return `<g transform="translate(${f2(q.x)} ${f2(q.y)})${flip && mirror ? " scale(-1 1)" : ""}">${svg}</g>`;
    };
    // 面の 上に 2D の 絵を はる（左上が (s0, t0)。絵の x は +s、y は 下）
    const onP = (m, s0, t0, cw, ch, svg) => {
      const o = P(...m(s0, t0)), a = P(...m(s0 + 1, t0)), c = P(...m(s0, t0 - 1));
      P(...m(s0 + cw, t0)); P(...m(s0, t0 - ch)); P(...m(s0 + cw, t0 - ch));
      return `<g transform="matrix(${f4(a.x - o.x)} ${f4(a.y - o.y)} ${f4(c.x - o.x)} ${f4(c.y - o.y)} ${f4(o.x)} ${f4(o.y)})">${svg}</g>`;
    };
    const lg = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => {
      const id = "fm" + ++gid;
      defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`);
      return `url(#${id})`;
    };
    const rg = (stops, cx = 0.36, cy = 0.32, r = 0.78) => {
      const id = "fm" + ++gid;
      defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</radialGradient>`);
      return `url(#${id})`;
    };
    const shadow = (a = 0.12, inset = 3, r = 12) => shape(TP(0), rr(-w / 2 + inset, -d + inset, w - inset * 2, d - inset * 2, r), INK, 0, `fill-opacity="${a}"`);
    // ---- まるい 立体（UI-38）: まわりの 線だけの 凸な かたち（かざりは あとから 描く）----
    // rings: [[はんけい, たかさ], …] を まわした 形（ランプの かさ・つぼ・パンの あたま）。くびれの ある 形は かさねて つかう。sy は おくゆきの ばい
    const lathe = (cx, cy, rings, fill, sw = 1.5, e = "", sy = 1, n = 32) => `<polygon points="${hull(rings.flatMap(([r, z]) => ov(cx, cy, r, r * sy, n).map(([s, t]) => P(s, t, z)))).map(xy).join(" ")}" fill="${fill}" ${sk(sw)}${ex(e)}/>`;
    // はんぶんの だえん体（ドーム）: そこの はんけい rx・ry、たかさ hz
    const dome = (cx, cy, z0, rx, ry, hz, fill, sw = 1.5, e = "") => lathe(cx, cy, Array.from({ length: 9 }, (_, i) => { const t = (i / 8) * (Math.PI / 2); return [rx * Math.cos(t), z0 + hz * Math.sin(t)]; }), fill, sw, e, ry / rx);
    // だえん体（まんなか cz・たての はんけい rz）
    const egg = (cx, cy, cz, rx, ry, rz, fill, sw = 1.5, e = "") => lathe(cx, cy, Array.from({ length: 17 }, (_, i) => { const t = -Math.PI / 2 + (i / 16) * Math.PI; return [rx * Math.cos(t), cz + rz * Math.sin(t)]; }), fill, sw, e, ry / rx);
    // だえん体の おもての 点（a: よこの むき・b: うえ下 −π/2〜π/2）
    const eggAt = (cx, cy, cz, rx, ry, rz, a, b) => [cx + Math.cos(a) * Math.cos(b) * rx, cy + Math.sin(a) * Math.cos(b) * ry, cz + Math.sin(b) * rz];
    // live（ART-03b で canvas に うごく 絵を かさねる とき）は その ぶぶんを 描かない。点は 数えるので 絵の はんいは おなじ
    const L = (svg) => (opts.live ? "" : svg);
    const byDepth = (ps) => ps.slice().sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
    const done = (body) => {
      for (const [x, y] of [[-w / 2, -d], [w / 2, -d], [w / 2, 0], [-w / 2, 0]]) P(x, y, 0); // 床の 四すみ（あたり判定を これまでと そろえる）
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
      x0 -= 6; y0 -= 6; x1 += 6; y1 += 6;
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, footW: flip ? d : w, footD: flip ? w : d, height: h,
        full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(x0)} ${f2(y0)} ${f2(x1 - x0)} ${f2(y1 - y0)}">${defs.length ? "<defs>" + defs.join("") + "</defs>" : ""}${body}</svg>` };
    };
    return { id, w, d, h, flip, opts, L, P, xy, hull, plane, FR, SD, TP, tilt, away, poly, shape, line, lineOn, rod, smooth, prism, slab, box, cyl, frustum, ball, lathe, dome, egg, eggAt, at, onP, lg, rg, shadow, byDepth, done };
  }

  // ---- いろ ----
  const WOOD = ["#C9A26E", "#A88457", "#DDBD8A"], OAK = ["#B39767", "#8C704B", "#CAAE7E"], WAL = ["#9A7050", "#7A573C", "#B38A66"];
  const DARK = ["#8C6848", "#6F5238", "#A7825C"], CREAM = ["#F4EDDD", "#DCD2BD", "#FBF7EE"], GOLD = "#E3C06B", GOLDD = "#B9974A", BRASS = ["#D9B45C", "#B38F3F", "#EACB7E"];

  const M = {};

  // ---------- ラグ ----------
  M.rug_round = (k) => {
    // 布を あんで まるく まいた ラグ（まるい 形・わっかの 色・あみめ）
    const { w, d, shape, TP, lineOn } = k, cy = -d / 2, A0 = w / 2 - 2, B0 = d / 2 - 2;
    let s = shape(TP(0), ov(0, cy, A0, B0, 72), "#9A5A44", 1.5);
    const cols = ["#C8745A", "#EBCB93", "#93B196", "#E0A565", "#F4E6C6", "#CC7E62", "#A9C2B5"];
    cols.forEach((c, i) => {
      const f = 1 - i * 0.135, a = A0 * f, b = B0 * f;
      s += shape(TP(2), ov(0, cy, a, b, 72), c, i ? 0.6 : 1.5);
      const ma = a - A0 * 0.0675, mb = b - B0 * 0.0675;
      if (ma > 3) s += lineOn(TP(2), close(ov(0, cy, ma, mb, 72)), shade(c, -0.16), 2.2, 'stroke-dasharray="2.4 2.2"');
    });
    return s;
  };
  M.rug_star = (k) => {
    // よぞらの ラグ（大きな 星・小さな 星・三日月・ぬいめ）
    const { w, d, shape, TP, lineOn } = k, cy = -d / 2, A0 = w / 2 - 2, B0 = d / 2 - 2;
    let s = shape(TP(0), ov(0, cy, A0, B0, 72), "#243160", 1.5) + shape(TP(2), ov(0, cy, A0, B0, 72), "#3E4F8C", 1.5);
    s += shape(TP(2), ov(0, cy, A0 - 10, B0 - 10, 72), "#2E3E78", 0) + lineOn(TP(2), close(ov(0, cy, A0 - 5, B0 - 5, 72)), "#E8D9A4", 1.3, 'stroke-dasharray="3 3"');
    s += shape(TP(2.2), star(0, cy, 34, 14), "#F5D66B", 1.4) + shape(TP(2.3), star(-1.5, cy - 1.5, 21, 8.6), "#FBE7A1", 0);
    for (const [x, y, r] of [[-50, -44, 7], [44, -92, 6], [56, -52, 5], [-26, -100, 5], [-60, -76, 4], [26, -26, 4.5], [64, -78, 3.5]]) s += shape(TP(2.2), star(x, y, r, r * 0.4, 4), "#FFF3C4", 0.9);
    for (const [x, y] of [[-14, -22], [38, -106], [70, -60], [-70, -56], [-38, -108], [12, -108], [-44, -26]]) s += shape(TP(2.2), ov(x, y, 1.7, 1.7, 10), "#FFFFFF", 0);
    s += shape(TP(2.2), moon(-40, -80, 11), "#F5D66B", 1.1);
    return s;
  };

  // ---------- ベッド ----------
  const quilt = (k, o) => {
    // かけぶとん: 上の 面（つぎはぎ）・おりかえし・てまえに たれる すそ
    const { shape, TP, FR, lineOn, prism } = k, { x0, x1, y0, z, zb, base, patch, fold, hem } = o;
    let s = shape(TP(z), rr(x0, y0, x1 - x0, 1 - y0, 3), base, 1.5);
    const cell = 14;
    for (let x = x0 + 12, i = 0; x < x1; x += cell, i++) for (let y = y0, j = 0; y < 1; y += cell, j++) {
      const xx = Math.min(x + cell, x1), yy = Math.min(y + cell, 1);
      s += shape(TP(z + 0.05), rect(x, y, xx - x, yy - y), patch[(i + j * 3) % patch.length], 0);
      if (o.dots && (i + j) % 2 === 0) s += shape(TP(z + 0.1), heart(x + (xx - x) / 2, y + (yy - y) / 2, 3.4, 18), "#FFFFFF", 0, 'fill-opacity=".9"');
    }
    for (let x = x0 + 12; x < x1; x += cell) s += lineOn(TP(z + 0.15), [[x, y0], [x, 1]], "#FFFFFF", 0.9, 'stroke-dasharray="2 2" stroke-opacity=".75"');
    for (let y = y0 + cell; y < 1; y += cell) s += lineOn(TP(z + 0.15), [[x0 + 12, y], [x1, y]], "#FFFFFF", 0.9, 'stroke-dasharray="2 2" stroke-opacity=".75"');
    s += prism(TP(z + 2), rr(x0 - 1, y0 - 0.6, 12, 2.2 - y0, 3), [0, 0, -2], fold, shade(fold, -0.12), 1.3);
    // すそ
    const drape = [[x0, z], [x1, z], ...scallop(x0, x1, zb, 3.2)];
    s += shape(FR(1.2), drape, base, 1.5);
    for (let x = x0 + 12, i = 0; x < x1; x += cell, i++) {
      const xx = Math.min(x + cell, x1);
      s += shape(FR(1.25), [[x, z], [xx, z], [xx, zb + 1], [x, zb + 1]], patch[(i + 2) % patch.length], 0);
    }
    s += shape(FR(1.3), [[x0, z], [x1, z], [x1, z - 1.2], [x0, z - 1.2]], shade(base, -0.1), 0);
    if (hem) s += lineOn(FR(1.35), [[x0 + 1, zb + 2.2], [x1 - 1, zb + 2.2]], hem, 1.8, 'stroke-dasharray="1.6 2.4"');
    s += shape(FR(1.2), drape, "none", 1.5);
    return s;
  };
  M.bed_simple = (k) => {
    const { box, prism, shape, SD, TP, lineOn, onP, shadow, byDepth } = k;
    let s = shadow(0.12, 2, 8);
    for (const [x, y] of byDepth([[-54, -81], [-54, -6], [49, -81], [49, -6]])) s += box(x, y, 5, 5, 0, 10, DARK);
    s += prism(SD(-49), arch(-82, 0, 0, 50, 63), [-6, 0, 0], "#D0A870", "#A88457");
    s += shape(SD(-48.9), arch(-74, -8, 12, 44, 54), "#C29560", 0) + lineOn(SD(-48.85), [...arch(-74, -8, 12, 44, 54).slice(2), [-74, 12], [-8, 12]], "#E6C898", 1.2);
    s += onP(SD(-48.8), -46, 50, 10, 9, `<path d="${heartPath(5, 4.5, 0.62)}" fill="#E9A3A3" ${S(1.1)}/>`);
    s += box(-49, -82, 98, 82, 8, 13, WOOD);
    s += box(-48, -80, 96, 78, 21, 12, CREAM) + lineOn(k.FR(-1.9), [[-48, 27], [48, 27]], "#CFC5AE", 1);
    s += prism(TP(41), rr(-45, -73, 24, 64, 9), [0, 0, -8], "#FFFFFF", "#E4DCCB") + lineOn(TP(41.1), [[-36, -52], [-33, -41], [-36, -30]], "#E4DCCB", 1.2);
    s += quilt(k, { x0: -18, x1: 50, y0: -82.5, z: 34.5, zb: 16, base: "#9CC7E6", patch: ["#9CC7E6", "#F4D38A", "#EFA9A0", "#A9D2B5"], fold: "#FBF6EA", hem: "#FFFFFF" });
    s += prism(SD(55), arch(-82, 0, 0, 27, 34), [-6, 0, 0], "#D0A870", "#A88457");
    s += shape(SD(55.1), arch(-74, -8, 7, 22, 27.5), "#C29560", 0);
    return s;
  };
  M.bed_royal = (k) => {
    // てんがいの ある おひめさまベッド（はしら・カーテン・フリル・ハートの ふとん・かんむり）
    const { box, prism, shape, smooth, SD, FR, TP, lineOn, onP, cyl, ball, shadow } = k;
    const PK = "#F2B7C6", PKD = "#DE97AA", WH = ["#F8F2E8", "#DDD3C3", "#FFFCF6"], post = (x, y) => cyl(x, y, 0, 3.2, 84, GOLDD, GOLD, 1.3) + ball(x, y, 87.5, 3.4, GOLD, 1.2);
    let s = shadow(0.12, 1, 8);
    // おくの うすい カーテン
    s += shape(FR(-88.5), [[-58.5, 84], [58.5, 84], ...scallop(-58.5, 58.5, 18, 3)], "#F8DCE5", 1.3, 'fill-opacity=".95"');
    for (let x = -50; x < 58; x += 9) s += lineOn(FR(-88.4), [[x, 82], [x + 1.5, 20]], "#EDB8C8", 1.2);
    s += post(-58.5, -88.5);
    s += prism(SD(-54), arch(-88, -3, 0, 60, 75), [-6, 0, 0], PK, GOLDD);
    for (const [t, off] of [[28, 0], [38, 5], [48, 0]]) for (let y = -80 + off; y < -8; y += 10) s += shape(SD(-53.9), ov(y, t, 1.3, 1.3, 8), PKD, 0);
    s += lineOn(SD(-53.85), arch(-83, -8, 6, 55, 69).slice(2), "#FBE3EA", 1.4);
    s += onP(SD(-53.8), -54, 86, 18, 12, `<g transform="translate(9 12)">${SPR.crown()}</g>`);
    s += post(-58.5, -3.5) + post(58.5, -88.5);
    s += shape(FR(-88.3), [[-58.5, 88], [58.5, 88], ...scallop(-58.5, 58.5, 79, 3)], PK, 1.2) + shape(SD(-58.4), [[-88.5, 88], [-3.5, 88], ...scallop(-88.5, -3.5, 79, 3)], PKD, 1.2);
    s += box(-54, -90, 108, 88, 10, 13, WH) + lineOn(FR(-1.9), [[-54, 16.5], [54, 16.5]], GOLD, 1.8);
    s += box(-53, -88, 106, 84, 23, 12, CREAM);
    for (const y0 of [-85, -45]) s += prism(TP(43), rr(-50, y0, 22, 38, 9), [0, 0, -8], "#FFFFFF", "#EADFD0") + k.lineOn(TP(43.1), close(rr(-48.5, y0 + 1.5, 19, 35, 8)), "#F7C9D6", 1.1, 'stroke-dasharray="1.5 1.5"');
    s += quilt(k, { x0: -26, x1: 56, y0: -90.5, z: 36.5, zb: 20, base: PK, patch: ["#F2B7C6", "#F7CCD7", "#F2B7C6", "#EFC0CC"], fold: "#FFF6F8", hem: null, dots: true });
    s += shape(FR(1.4), [[-26, 19.5], [56, 19.5], ...scallop(-26, 56, 15, 2.2)], "#FFFFFF", 1.1) + lineOn(FR(1.45), [[-25, 18], [55, 18]], "#F7C9D6", 1, 'stroke-dasharray="1.2 1.8"');
    s += prism(SD(62), arch(-90, -2, 0, 32, 42), [-6, 0, 0], WH[0], GOLDD) + lineOn(SD(62.1), arch(-84, -8, 5, 27, 35).slice(2), GOLD, 1.4);
    s += onP(SD(62.2), -51, 30, 10, 9, `<path d="${heartPath(5, 4.5, 0.62)}" fill="${PK}" ${S(1.1)}/>`);
    s += post(58.5, -3.5);
    // みぎの カーテン（はしらで リボンで むすぶ）
    for (const [top0, top1, tie, foot0, foot1] of [[-88.5, -70, -84, -89, -74], [-20, -3.5, -7, -18, -3]]) {
      s += smooth(SD(63.2), [[top0, 84], [top1, 84], [(top1 + tie) / 2 + 2, 64], [tie + 2, 48], [foot1, 20], [foot1 + 1, 2], [foot0, 2], [foot0 + 2, 24], [tie - 2, 48], [top0 + 1, 66]], "#F6CCD8", 1.3);
      s += shape(SD(63.4), rr(tie - 3.6, 45.5, 7.2, 5, 1.6), GOLD, 1.1);
    }
    // てんがい（上の ぬの・まえと みぎの フリル）
    // 上は うすい ぬの（ベッドが すけて 見える）
    s += shape(TP(88), rr(-62, -92, 124, 92, 3), "#F9D7E1", 1.2, 'fill-opacity=".3"');
    for (let i = 0; i < 6; i++) s += lineOn(TP(88.1), [[0, -46], [-62 + (i * 124) / 5, i % 2 ? -92 : 0]], "#F2B7C6", 1, 'stroke-opacity=".45"');
    s += ball(0, -46, 88.5, 2.6, PK, 1, 0.5);
    s += shape(SD(62), [[-92, 88], [0, 88], ...scallop(-92, 0, 77, 3.4)], PK, 1.3) + lineOn(SD(62.1), [[-92, 84.5], [0, 84.5]], GOLD, 1.4);
    s += shape(FR(0), [[-62, 88], [62, 88], ...scallop(-62, 62, 77, 3.4)], PK, 1.3) + lineOn(FR(0.1), [[-62, 84.5], [62, 84.5]], GOLD, 1.4);
    s += onP(FR(0.2), -8, 93, 16, 12, `<g transform="translate(8 12)">${SPR.crown()}</g>`);
    return s;
  };

  // ---------- テーブル・つくえ ----------
  M.table_wood = (k) => {
    const { box, prism, shape, TP, lineOn, cyl, at, shadow, byDepth } = k;
    let s = shadow(0.07, 5, 10);
    for (const [x, y] of byDepth([[-40, -64], [-40, -10], [34, -64], [34, -10]])) s += box(x, y, 6, 6, 0, 45, WOOD);
    s += box(-38, -62, 76, 56, 40, 8, ["#B8905F", "#977449", "#C9A26E"]);
    s += prism(TP(53), rr(-44, -68, 88, 68, 6), [0, 0, -6], "#DDBD8A", "#B08A5A");
    for (const [y, b] of [[-58, 2], [-44, -2], [-22, 1.5], [-10, -1]]) s += lineOn(TP(53.1), [[-38, y], [-14, y + b], [12, y - b], [38, y + b * 0.6]], "#C9A673", 1, 'stroke-opacity=".7"');
    s += shape(TP(53.1), ov(0, -34, 21, 15, 40), "#FFF8EA", 1.1) + lineOn(TP(53.2), close(ov(0, -34, 17.5, 11.5, 40)), "#E8D9BE", 1, 'stroke-dasharray="2 2"');
    s += cyl(20, -54, 53, 3, 9, "#9DC3D6", "#BFD9E6", 1.1) + at(20, -54, 62, SPR.sprig(), 7, 16);
    s += at(-8, -40, 53.2, SPR.teapot(), 17, 18);
    s += shape(TP(53.3), ov(16, -24, 6.2, 6.2, 22), "#FFFFFF", 1.1) + cyl(16, -24, 53.5, 3.6, 4.5, "#F4C7CF", "#8C5A3C", 1.1);
    return s;
  };
  M.desk = (k) => {
    // おえかき デスク: ひきだしは 天板に つける（まえは 宙に ういていた）。ななめの 画板・クレヨン・えんぴつ立て
    const { box, prism, shape, FR, TP, lineOn, cyl, slab, onP, shadow, ball } = k;
    const BI = ["#E3C99A", "#C4A574", "#EFDDB6"];
    let s = shadow(0.1, 3, 6);
    s += box(-49, -50, 5, 5, 0, 58, BI) + box(-49, -7, 5, 5, 0, 58, BI);
    s += box(-44, -49, 62, 45, 50, 8, BI) + shape(FR(-3.9), rr(-37, 51.5, 44, 5.2, 1.5), "#A9D6C2", 1.1) + ball(-15, -3.6, 54.1, 1.1, GOLD, 0.9, 0);
    s += box(18, -50, 31, 47, 0, 58, BI);
    [["#F2B8C6", 4], ["#F3D98A", 21], ["#A9D6C2", 38]].forEach(([c, z]) => { s += shape(FR(-2.9), rr(21, z, 25, 15, 2), c, 1.1) + shape(FR(-2.8), rect(29, z + 9, 9, 3.4), "#FFFDF5", 0.8) + ball(33.5, -2.6, z + 5, 1.2, GOLD, 0.9, 0); });
    s += prism(TP(63), rr(-51, -52, 102, 52, 3), [0, 0, -5], "#EFDDB6", "#C4A574");
    // 画板（おくが 高い）と クレヨンの え
    const { m, s: board } = slab([-46, -12, 63.5], [1, 0, 0], [0, -0.6, 0.8], rr(0, 0, 42, 28, 2), 2.4, "#D9B783", "#B08A5A");
    s += lineOn(TP(63.2), [[-40, -30], [-40, -22]], INK, 1.2) + board + shape(m, rect(3, 3, 36, 22), "#FFFDF5", 1);
    s += k.L(onP(m, 3, 25, 36, 22, `<circle cx="7" cy="6" r="3.4" fill="#F7D56A"/><path d="M7,1 V-0.5 M12,6 H13.5 M10.6,2.4 L11.6,1.4" stroke="#F2B34B" stroke-width="1"/><path d="M15,15 L22,9 L29,15 Z" fill="#E77E6E"/><rect x="16.5" y="15" width="11" height="6" fill="#F2B8C6"/><rect x="20.5" y="17" width="3" height="4" fill="#9A6A45"/><path d="M1,21 Q12,18 35,21" fill="none" stroke="#8DB87A" stroke-width="1.6"/><path d="${heartPath(31, 6, 0.3)}" fill="#EE8FA6"/>`));
    s += box(8, -30, 16, 8, 63, 6, ["#E77E6E", "#C9604F", "#F29C8E"]);
    ["#F7D56A", "#9CC7E6", "#8DB87A", "#F2A7B8", "#C9B6E0"].forEach((c, i) => { s += cyl(10.4 + i * 3, -26, 69, 1.1, 3.5 + (i % 2) * 1.5, shade(c, -0.1), c, 0.9, 10); });
    s += cyl(34, -40, 63, 4.4, 10, "#9CC7E6", "#6E9CBF", 1.2);
    for (const [dx, dy, c, hh] of [[-1.5, 0, "#F7D56A", 11], [1.5, -1, "#E77E6E", 9], [0, 1.2, "#8DB87A", 12]]) s += k.rod([[34 + dx, -40 + dy, 72], [34 + dx * 2.2, -40 + dy * 2.2, 72 + hh]], c, 1.6);
    s += k.rod([[12, -12, 63.8], [21, -9, 63.8]], "#F3C54E", 2) + k.rod([[26, -14, 63.8], [30, -8, 63.8]], "#9CC7E6", 2);
    return s;
  };
  M.console_oak = (k) => {
    // こもれびの コンソール: ひきだしは 前いたに（まえは 宙に ういていた）。下の たなに かご、上に 花びん・本・写真
    const { box, prism, shape, FR, TP, lineOn, cyl, slab, at, shadow, ball } = k;
    let s = shadow(0.1, 3, 5);
    s += box(-50, -36, 5, 5, 0, 62, OAK) + box(45, -36, 5, 5, 0, 62, OAK);
    s += box(-49, -35, 98, 31, 12, 3, OAK);
    s += box(-38, -30, 30, 22, 15, 14, ["#D9B77E", "#B9965F", "#E8CFA0"]);
    for (let z = 18; z < 29; z += 3.5) s += lineOn(FR(-7.9), [[-38, z], [-8, z]], "#B9965F", 0.9);
    for (let x = -34; x < -8; x += 5) s += lineOn(FR(-7.85), [[x, 15], [x, 29]], "#C9A874", 0.8);
    s += prism(TP(31.5), rr(-36, -28, 26, 18, 5), [0, 0, -3], "#E8A9A0", "#CF8F86");
    s += box(10, -28, 24, 18, 15, 2.6, ["#6D9BC3", "#557FA3", "#8DB5D6"]) + box(11, -27, 22, 16, 17.6, 2.4, ["#E8C07A", "#C99F5C", "#F3D59C"]) + box(10.5, -28, 23, 17, 20, 2.2, ["#E9A9A0", "#CC8A82", "#F2C1BA"]);
    s += box(-50, -6, 5, 5, 0, 62, OAK) + box(45, -6, 5, 5, 0, 62, OAK);
    s += box(-49, -36, 98, 32, 54, 12, OAK);
    for (const x of [-44, 4]) s += shape(FR(-3.9), rr(x, 56.5, 40, 7.5, 1.5), "#C4A676", 1.1) + ball(x + 20, -3.7, 60.2, 1.3, GOLD, 0.9, 0);
    s += prism(TP(71), rr(-52, -38, 104, 38, 2.5), [0, 0, -5], "#CAAE7E", "#9E8257");
    s += cyl(-34, -22, 71, 5, 11, "#9FB8C9", "#C2D4E0", 1.2) + cyl(-34, -22, 82, 2.4, 3, "#9FB8C9", "#C2D4E0", 1.1) + at(-34, -22, 85, SPR.branch(), 14, 22);
    s += box(-10, -30, 22, 16, 71, 3, ["#44587F", "#34466A", "#5A6E96"]) + box(-8.5, -29, 20, 14, 74, 3, ["#C8745A", "#A95D46", "#DA8F76"]) + box(-9.5, -28.5, 21, 13, 77, 2.4, ["#EFE3C8", "#D6C8A8", "#FBF3E0"]);
    const { m, s: frame } = slab([22, -30, 71], [1, 0.1, 0], [0, -0.3, 1], rr(0, 0, 14, 12, 1.2), 1.6, GOLD, GOLDD, 1.1);
    s += frame + shape(m, rect(2, 2, 10, 8), "#CFE6F1", 0.8) + shape(m, ov(5, 5.5, 1.8, 2, 10), "#F3D98A", 0) + shape(m, ov(8.6, 5, 1.6, 1.8, 10), "#C98A52", 0);
    s += cyl(42, -14, 71, 2.4, 9, "#FFF1D8", "#FFFBF0", 1.1) + at(42, -14, 80, SPR.candle(), 4, 11);
    return s;
  };
  M.teacart = (k) => {
    // おちゃの ワゴン: 車輪・2だんの トレー・とって。ティーポット・カップ・ケーキスタンド・ジャム
    const { box, shape, SD, TP, lineOn, cyl, prism, at, shadow, ball, rod } = k;
    const FRM = ["#A8D3C0", "#86B39F", "#C3E3D4"], TRAY = ["#F7EFDF", "#E0D5BF", "#FFFAF0"];
    const wheel = (x, y) => prism(SD(x + 1), ov(y, 5, 4.6, 4.6, 16), [-2.2, 0, 0], "#6E6676", "#555060", 1.2) + shape(SD(x + 1.1), ov(y, 5, 1.6, 1.6, 10), GOLD, 0.8);
    const rim = (z, sides) => sides.map((sd) => sd === "b" ? box(-39, -46, 78, 1.2, z, 3, TRAY) : sd === "l" ? box(-39, -46, 1.2, 43, z, 3, TRAY) : sd === "f" ? box(-39, -4.2, 78, 1.2, z, 3, TRAY) : box(37.8, -46, 1.2, 43, z, 3, TRAY)).join("");
    let s = shadow(0.1, 4, 6);
    s += wheel(-37, -44) + wheel(37, -44);
    s += box(-39, -46, 3.5, 3.5, 7, 62, FRM) + box(35.5, -46, 3.5, 3.5, 7, 62, FRM);
    s += box(-39, -46, 78, 43, 14, 3, TRAY) + rim(17, ["b", "l"]);
    for (let i = 0; i < 3; i++) s += cyl(-18, -24, 17 + i * 1.8, 9, 1.6, "#F2B8C6", "#FFFFFF", 1);
    s += cyl(12, -26, 17, 5, 9, "#E0706A", "#EA8F88", 1.2) + cyl(12, -26, 26, 5.4, 2.4, "#F4F0E8", "#FFFFFF", 1) + shape(k.FR(-20.95), rect(9.2, 19.5, 5.6, 4), "#FFF6E0", 0.8);
    s += rim(17, ["f", "r"]);
    s += box(-39, -46, 78, 43, 50, 3, TRAY) + rim(53, ["b", "l"]);
    s += at(-18, -26, 53, SPR.teapot("#FFFFFF", "#8FC3A8"), 17, 18);
    for (const [x, y] of [[2, -14], [6, -36]]) s += shape(TP(53.2), ov(x, y, 5.6, 5.6, 20), "#FFFFFF", 1) + cyl(x, y, 53.4, 3.3, 4.2, "#A8D3C0", "#8C5A3C", 1);
    s += cyl(25, -24, 53, 1, 16, GOLDD, GOLD, 0.9, 10) + shape(TP(55), ov(25, -24, 11, 11, 28), "#FFFFFF", 1.1) + shape(TP(63), ov(25, -24, 7.5, 7.5, 24), "#FFFFFF", 1.1) + ball(25, -24, 70.4, 1.4, GOLD, 0.9, 0);
    s += at(20, -22, 55.2, SPR.cupcake(), 5, 12) + at(30, -26, 55.2, SPR.macaron("#F2B8C6"), 4, 6) + at(28, -18, 55.2, SPR.macaron("#A8D3C0"), 4, 6) + at(25, -24, 63.2, SPR.macaron("#F3D98A"), 4, 6);
    s += rim(53, ["f", "r"]);
    s += box(-39, -6.5, 3.5, 3.5, 7, 62, FRM) + box(35.5, -6.5, 3.5, 3.5, 7, 62, FRM);
    s += wheel(-37, -5) + wheel(37, -5);
    s += rod([[40, -44, 66], [40.5, -44, 71], [40.5, -6, 71], [40, -6, 66]], GOLD, 2.4);
    return s;
  };

  // ---------- ソファ ----------
  M.sofa = (k) => {
    // ふかふかソファ: まるい ひじかけ・せもたれ・ざぶとん・クッション（まえは 箱が うかんでいた）
    const { box, prism, shape, FR, SD, TP, lineOn, slab, onP, shadow, byDepth, ball } = k;
    const C = "#AEBE90", CD = "#8E9E72", CL = "#C4D1A8";
    let s = shadow(0.12, 3, 12);
    for (const [x, y] of byDepth([[-53, -61], [-53, -7], [47, -61], [47, -7]])) s += box(x, y, 5, 5, 0, 8, DARK);
    s += box(-54, -62, 108, 60, 7, 15, [C, CD, CL]) + lineOn(FR(-1.9), [[-54, 12], [54, 12]], CD, 1.2);
    s += prism(FR(-49), rr(-50, 20, 100, 46, 13), [0, -13, 0], C, CL);
    s += prism(SD(-44), rr(-62, 10, 62, 36, 11), [-12, 0, 0], C, CL);
    for (const x0 of [-43, 2]) s += prism(FR(-40), rr(x0, 24, 41, 36, 10), [0, -8, 0], CL, C) + ball(x0 + 20.5, -39.9, 45, 1.1, CD, 0.8, 0);
    for (const x0 of [-44, 1]) s += prism(TP(33), rr(x0, -47, 43, 45, 8), [0, 0, -11], CL, C) + lineOn(TP(33.1), close(rr(x0 + 2.5, -44.5, 38, 40, 6)), "#D7E0C0", 1, 'stroke-dasharray="2 2"');
    const p1 = slab([-42, -37, 33], [1, 0.35, 0], [0.1, -0.35, 1], rr(0, 0, 17, 17, 5), 4, "#FFF5E3", "#E6D9BE");
    s += p1.s + onP(p1.m, 3.5, 14, 10, 10, `<path d="${heartPath(5, 4.5, 0.62)}" fill="#EE9FAF" ${S(1)}/>`);
    const p2 = slab([26, -37, 33], [1, -0.25, 0], [-0.1, -0.35, 1], ov(8.5, 8.5, 8.5, 8.5, 24), 4, "#EBA8B6", "#D48E9D");
    s += p2.s + k.lineOn(p2.m, close(ov(8.5, 8.5, 5.5, 5.5, 20)), "#F7CBD5", 1.1, 'stroke-dasharray="1.8 1.8"');
    s += prism(SD(56), rr(-62, 10, 62, 36, 11), [-12, 0, 0], C, CL);
    return s;
  };
  M.cloudsofa = (k) => {
    // くもいろ ソファ: ふわふわの くもの つぶで 形を つくる。星と 月の クッション
    const { prism, shape, TP, slab, onP, shadow, ball, rg, lineOn } = k;
    const cloud = rg([[0, "#FFFFFF"], [0.45, "#E4EEF8"], [1, "#B3CAE0"]]);
    let s = shadow(0.12, 3, 16);
    s += prism(TP(24), rr(-54, -62, 108, 60, 18), [0, 0, -18], "#D9E6F2", "#B8CCE0");
    for (const x of [-24, 4, 30]) s += ball(x, -57, 58, 14, cloud, 1.3, 0);
    for (const x of [-38, -12, 14, 38]) s += ball(x, -52, 44, 17, cloud, 1.3, 0);
    for (const y of [-38, -18]) s += ball(-47, y, 31, 13, cloud, 1.3, 0);
    s += prism(TP(33), rr(-40, -48, 80, 42, 16), [0, 0, -9], "#EEF4FA", "#C9D8E7") + lineOn(TP(33.1), close(rr(-36, -44, 72, 34, 13)), "#D7E3EF", 1.1, 'stroke-dasharray="2 2"');
    const p1 = slab([-36, -36, 33], [1, 0.3, 0], [0.1, -0.35, 1], star(10, 9.5, 10.5, 5.2), 3.5, "#F5D66B", "#DDB94A", 1.3);
    s += p1.s + shape(p1.m, ov(7, 10.5, 0.9, 0.9, 8), INK, 0) + shape(p1.m, ov(12.5, 10.5, 0.9, 0.9, 8), INK, 0) + k.lineOn(p1.m, [[8, 8.2], [9.75, 7.2], [11.5, 8.2]], INK, 0.9);
    const p2 = slab([20, -38, 33], [1, -0.2, 0], [-0.1, -0.35, 1], moon(9, 9, 9), 3.5, "#C9B6E0", "#AD98C8", 1.3);
    s += p2.s;
    for (const y of [-38, -18]) s += ball(47, y, 31, 13, cloud, 1.3, 0);
    for (const x of [-40, -20, 0, 20, 40]) s += ball(x, -5, 12, 8.5, cloud, 1.2, 0);
    return s;
  };

  // ---------- たな・キッチン ----------
  M.bookshelf = (k) => {
    // ほんだな: 本は たなの 中に ならべる（まえは 横から はみ出していた）。本の はば・高さ・色を かえ、地球儀と 植木ばち
    const { box, shape, FR, TP, lineOn, cyl, ball, at, shadow } = k;
    const R = rng(7), cols = ["#C8745A", "#5E8C8A", "#E3B45B", "#44587F", "#9BB07F", "#8E6388", "#E9DCC0", "#B55B5B", "#6D9BC3"];
    const books = (z, x0, x1, maxH) => {
      let s = "", x = x0;
      while (x < x1 - 3) {
        const bw = Math.min(3.6 + R() * 3.2, x1 - x), bh = maxH - 3 - R() * 9, c = cols[Math.floor(R() * cols.length)];
        s += k.box(x, -29, bw, 24, z, bh, [c, shade(c, -0.22), "#F1E6CE"], 1.1) + lineOn(FR(-4.9), [[x + 0.7, z + bh * 0.72], [x + bw - 0.7, z + bh * 0.72]], shade(c, 0.4), 0.9);
        x += bw;
      }
      return s;
    };
    let s = shadow(0.1, 2, 3);
    s += shape(FR(-32), rect(-33, 0, 66, 108), "#6E5039", 1.5);
    for (let x = -22; x < 33; x += 11) s += lineOn(FR(-31.9), [[x, 6], [x, 108]], "#5E442F", 1);
    s += box(-36, -34, 4, 34, 0, 108, WAL) + box(-32, -34, 64, 34, 0, 6, WAL);
    s += books(6, -31, 9, 33) + box(11, -29, 20, 22, 6, 3.4, ["#9BB07F", "#7F935F", "#B4C698"]) + box(12, -28.5, 18, 21, 9.4, 3.2, ["#E9DCC0", "#CEBFA0", "#F7EEDB"]) + box(11.5, -29, 19, 21.5, 12.6, 3.4, ["#C8745A", "#A95D46", "#DA8F76"]);
    s += box(-32, -33, 64, 33, 39, 3, WAL);
    s += books(42, -31, 5, 32) + cyl(18, -18, 42, 4.5, 2, GOLDD, GOLD, 1) + k.rod([[18, -18, 44], [18, -18, 50]], GOLD, 1.4) + ball(18, -18, 57, 7, k.rg([[0, "#BFE3F2"], [1, "#6FA9CF"]]), 1.2, 0.35) + at(18, -18, 51, `<path d="M-3,-8 Q0,-11 3,-8 Q4,-5 1,-4 Q-2,-3 -3,-8 Z M-6,-3 Q-4,-1 -2,-2" fill="#9ED08C" stroke="none"/>`, 6, 12);
    s += box(-32, -33, 64, 33, 74, 3, WAL);
    s += books(77, -31, 13, 31) + cyl(24, -16, 77, 4.6, 7, "#E48A6E", "#EFA58C", 1.1) + at(24, -16, 84, SPR.sprout(), 7, 12);
    s += box(32, -34, 4, 34, 0, 108, WAL) + box(-37, -35, 74, 36, 108, 4, WAL);
    return s;
  };
  M.plantshelf = (k) => {
    // みどりの たな: 本ではなく 植物を かざる（まえは 本が ならんでいた）。2だんの 大きな たなと 上の かざり
    const { box, shape, FR, TP, lineOn, cyl, at, shadow } = k;
    const FRM = ["#A3BC96", "#83A077", "#BCD1B0"], BD = ["#E0C497", "#C3A574", "#EDD6AE"], TERRA = ["#E48A6E", "#EFA58C"];
    const big = (svg, sc) => `<g transform="scale(${sc})">${svg}</g>`;
    let s = shadow(0.1, 2, 3);
    s += shape(FR(-36), rect(-40, 0, 80, 100), "#E6EEDD", 1.5);
    for (let x = -30; x < 40; x += 10) s += lineOn(FR(-35.9), [[x, 4], [x, 100]], "#D3DFC8", 1);
    s += box(-43, -38, 4, 38, 0, 100, FRM) + box(-39, -37, 78, 37, 0, 5, BD);
    s += cyl(-17, -19, 5, 10.5, 11, "#D8B47E", "#E8CFA0", 1.2) + lineOn(TP(10), arc(-17, -19, 10.6, 10.6, -0.8, 2.35, 16), "#BF9A62", 1, 'stroke-dasharray="2 1.6"') + at(-17, -19, 16, big(SPR.monstera(), 1.05), 16, 32);
    s += at(18, -16, 5, big(SPR.can(), 1.3), 18, 18);
    s += box(-39, -37, 78, 37, 48, 3, BD);
    s += cyl(-24, -18, 51, 6, 7, TERRA[0], TERRA[1], 1.1) + at(-24, -18, 58, big(SPR.cactus(), 1.4), 14, 32);
    s += cyl(-2, -18, 51, 6.4, 6, "#9CC7E6", "#BFDDF0", 1.1) + at(-2, -18, 57, big(SPR.rosette(), 1.5), 12, 18);
    s += cyl(21, -18, 51, 6, 7, "#F2B8C6", "#F7D0DA", 1.1) + at(21, -18, 58, big(SPR.blooms(), 1.45), 14, 24);
    s += box(-43, -38, 86, 38, 100, 3, FRM);
    s += cyl(-20, -18, 103, 6, 7, "#F2F0EA", "#FFFFFF", 1.1) + at(-20, -18, 110, SPR.sprout(), 8, 10) + at(-20, -2, 103.5, big(SPR.ivy(), 1.3), 14, 4);
    s += cyl(8, -20, 103, 5.4, 8, TERRA[0], TERRA[1], 1.1) + at(8, -20, 111, big(SPR.snake(), 1.25), 12, 32) + at(28, -16, 103, SPR.dome(), 10, 22);
    s += box(39, -38, 4, 38, 0, 100, FRM);
    return s;
  };
  M.kitchen = (k) => {
    // おままごと キッチン: オーブン・コンロ・なべ・シンクと じゃぐち・タイル・たなの びん・かざりの やね
    const { box, prism, shape, FR, TP, lineOn, cyl, ball, at, onP, shadow, plane, rod } = k;
    const CAB = ["#F4E9D5", "#DCCFB6", "#FBF5EA"];
    let s = shadow(0.1, 2, 4);
    s += prism(FR(-42), rect(-50, 58, 100, 44), [0, -4, 0], "#FBF5EA", "#DCCFB6");
    for (let x = -50, i = 0; x < 50; x += 7.7, i++) for (let z = 58, j = 0; z < 101; z += 7.2, j++) if ((i + j) % 2) s += shape(FR(-41.9), rect(x, z, 7.7, Math.min(7.2, 102 - z)), "#DDF0E8", 0);
    s += shape(FR(-41.9), rect(-50, 58, 100, 44), "none", 1.5);
    s += box(-46, -42, 92, 7, 84, 2.5, ["#D8B384", "#B8925F", "#E7C898"]);
    [["#F3D98A", -38], ["#F2B8C6", -29], ["#A9D6C2", -20]].forEach(([c, x]) => { s += cyl(x, -38.5, 86.5, 3.3, 7, shade(c, -0.12), c, 1.1) + cyl(x, -38.5, 93.5, 3.5, 1.6, "#E3C06B", "#F0D58A", 1); });
    s += cyl(32, -38.5, 86.5, 3.6, 5, "#E48A6E", "#EFA58C", 1.1) + at(32, -38.5, 91.5, SPR.sprout(), 7, 10);
    s += onP(FR(-41.7), -6, 82, 30, 20, `<path d="M3,0 V3 M13,0 V3 M24,0 V3" stroke="#B8925F" stroke-width="1.2"/><circle cx="3" cy="11" r="5" fill="#5B5560" stroke="${INK}" stroke-width="1.2"/><path d="M3,3 V6" stroke="${INK}" stroke-width="1.6"/><path d="M13,3 V13" stroke="#C9CED6" stroke-width="1.8"/><ellipse cx="13" cy="15" rx="3" ry="2.2" fill="#C9CED6" stroke="${INK}" stroke-width="1"/><path d="M24,3 V11" stroke="#E3C06B" stroke-width="1.6"/><rect x="21.5" y="11" width="5" height="6" rx="1.5" fill="#E3C06B" stroke="${INK}" stroke-width="1"/>`);
    s += box(-50, -44, 100, 44, 0, 54, CAB) + shape(FR(0.1), rect(-50, 0, 100, 3.2), "#D7CAB0", 1);
    s += shape(FR(0.2), rr(-45, 7, 42, 36, 4), "#9ED2C2", 1.3) + shape(FR(0.3), rr(-40, 12, 32, 20, 3), "#4C4455", 1.2) + shape(FR(0.35), rr(-38, 14, 28, 5, 2), "#6C6275", 0);
    s += onP(FR(0.4), -30, 24, 12, 10, `<path d="M1,9 H11 V5 Q6,2 1,5 Z" fill="#F7D0DA" stroke="${INK}" stroke-width="0.9"/><path d="M1,6 H11" stroke="#FFFFFF" stroke-width="1"/><circle cx="6" cy="2.4" r="1.4" fill="#E77E6E"/>`);
    s += lineOn(FR(0.5), [[-38, 38.5], [-10, 38.5]], INK, 3.8) + lineOn(FR(0.6), [[-38, 38.5], [-10, 38.5]], "#D8DCE2", 2);
    ["#F2B8C6", "#F3D98A", "#9CC7E6", "#A9D6C2"].forEach((c, i) => { s += shape(FR(0.3), ov(-40 + i * 10, 48, 2.5, 2.5, 12), c, 1.1) + lineOn(FR(0.4), [[-40 + i * 10, 48], [-40 + i * 10, 50]], INK, 1); });
    s += shape(FR(0.2), rr(3, 7, 42, 36, 4), "#F2B8C6", 1.3) + shape(FR(0.3), ov(24, 25, 10, 10, 30), "#D6EEF4", 1.2) + shape(FR(0.35), ov(24, 25, 7.5, 7.5, 26), "#BFE3EE", 0) + lineOn(FR(0.4), [[19, 28], [23, 31]], "#FFFFFF", 1.4);
    s += onP(FR(0.3), 38, 32, 6, 6, `<path d="${heartPath(3, 3, 0.4)}" fill="#E3C06B" stroke="${INK}" stroke-width="0.9"/>`);
    s += prism(TP(58), rr(-51, -46, 102, 47, 3), [0, 0, -4], "#E7C898", "#B8925F");
    for (const [x, y] of [[-37, -24], [-15, -24]]) s += shape(TP(58.1), ov(x, y, 8, 8, 24), "#5B5560", 1.2) + shape(TP(58.15), ov(x, y, 5, 5, 20), "#8B8490", 0) + lineOn(TP(58.2), close(ov(x, y, 6.4, 6.4, 20)), "#E07A6B", 0.9, 'stroke-dasharray="1.4 1.4"');
    s += shape(TP(58.6), ov(-37, -24, 7.4, 7.4, 22), "#4A4550", 1.1) + rod([[-37, -17, 59], [-37, -3, 59.2]], "#4A4550", 1.8) + at(-37, -24, 58.8, SPR.egg(), 7, 7);
    s += cyl(-15, -24, 58.3, 7.5, 8, "#E88A7A", "#F2A597", 1.3) + shape(TP(66.5), ov(-15, -24, 7.9, 7.9, 24), "#F2A597", 1.2) + ball(-15, -24, 68, 1.5, "#FFFFFF", 0.9, 0);
    s += rod([[-23.5, -24, 64], [-26, -24, 64]], "#E88A7A", 1.6) + rod([[-6.5, -24, 64], [-4, -24, 64]], "#E88A7A", 1.6);
    s += shape(TP(58.1), rr(8, -37, 30, 24, 5), "#C3CFD6", 1.2) + shape(TP(58.2), rr(10.5, -34.5, 25, 19, 4), "#A9B8C1", 0) + shape(TP(58.3), rr(12, -32, 22, 15, 3), "#CFEAF2", 0, 'fill-opacity=".75"') + shape(TP(58.35), ov(23, -24.5, 1.4, 1.4, 8), "#7D8A93", 0);
    s += at(21, -26, 58.4, SPR.duck(), 10, 14);
    s += rod([[23, -41.5, 58], [23, -41.5, 69], [23, -38, 71.5], [23, -34, 68.5]], "#D8DCE2", 2.6) + ball(16.5, -41.5, 60.5, 1.6, "#F2B8C6", 0.9, 0) + ball(29.5, -41.5, 60.5, 1.6, "#9CC7E6", 0.9, 0);
    // やねの ひさし（しましま）
    const aw = plane([-50, -46, 104], [1, 0, 0], norm([0, 1, -0.55]));
    for (let i = 0; i < 10; i++) s += shape(aw, rect(i * 10, 0, 10, 11), i % 2 ? "#FFFFFF" : "#F2A7B8", 0);
    s += shape(aw, [[0, 0], [100, 0], ...[...Array(10).keys()].reverse().flatMap((i) => arc(i * 10 + 5, 11, 5, 2.6, 0, Math.PI, 6))], "none", 1.3);
    for (let i = 0; i < 10; i++) s += shape(aw, arc(i * 10 + 5, 11, 5, 2.6, 0, Math.PI, 6), i % 2 ? "#FFFFFF" : "#F2A7B8", 1.1);
    s += rod([[-50, -46, 104.5], [50, -46, 104.5]], "#E3C06B", 1.8);
    return s;
  };
  M.vanity = (k) => {
    // おしゃれ ドレッサー: 大きな だえんの かがみ・リボン・ひきだし・こうすいの びん・ジュエリーボックス
    const { box, prism, shape, FR, TP, lineOn, cyl, ball, at, onP, shadow } = k;
    const WP = ["#F7E6EA", "#E3C8CF", "#FCF3F5"];
    let s = shadow(0.1, 3, 6);
    s += box(-42, -39, 4.5, 4.5, 0, 38, WP) + box(37.5, -39, 4.5, 4.5, 0, 38, WP);
    s += box(-43, -40, 86, 38, 36, 10, WP);
    ["#F2B8C6", "#C9B6E0", "#A9D6C2"].forEach((c, i) => { s += shape(FR(-1.9), rr(-40 + i * 27, 37.5, 25, 7, 1.5), c, 1.1) + ball(-27.5 + i * 27, -1.7, 41, 1.3, "#FFFFFF", 0.9, 0.6); });
    s += box(-42, -6.5, 4.5, 4.5, 0, 38, WP) + box(37.5, -6.5, 4.5, 4.5, 0, 38, WP) + box(-42.3, -6.8, 5.1, 5.1, 0, 3, [GOLD, GOLDD, "#F0D58A"]) + box(37.2, -6.8, 5.1, 5.1, 0, 3, [GOLD, GOLDD, "#F0D58A"]);
    s += prism(TP(50), rr(-45, -42, 90, 42, 4), [0, 0, -4], "#FCF3F5", "#E3C8CF");
    s += box(-21, -36, 3, 3, 50, 7, [GOLD, GOLDD, "#F0D58A"]) + box(18, -36, 3, 3, 50, 7, [GOLD, GOLDD, "#F0D58A"]);
    s += prism(FR(-33), ov(0, 78, 26, 23, 44), [0, -3, 0], GOLD, GOLDD) + shape(FR(-32.95), ov(0, 78, 23.5, 20.5, 44), "#F0D58A", 0);
    s += shape(FR(-32.9), ov(0, 78, 21.5, 18.5, 44), k.lg([[0, "#EFF9FB"], [1, "#BFE3EA"]]), 1.2);
    s += lineOn(FR(-32.8), [[-13, 82], [-5, 92]], "#FFFFFF", 2.6) + lineOn(FR(-32.8), [[-8, 73], [2, 86]], "#FFFFFF", 1.6, 'stroke-opacity=".8"');
    s += onP(FR(-32.7), -9, 107, 18, 13, `<g transform="translate(9 6)">${SPR.bow()}</g>`);
    s += cyl(-30, -16, 50, 3.4, 7, "#C9B6E0", "#DCCDEE", 1.1) + cyl(-30, -16, 57, 1.4, 1.6, GOLDD, GOLD, 0.9, 10) + ball(-30, -16, 60, 2, "#DCCDEE", 1, 0.6);
    s += cyl(-21, -11, 50, 2.6, 9, "#F2B8C6", "#F7D0DA", 1.1) + ball(-21, -11, 60.5, 1.8, GOLD, 0.9, 0.5);
    s += box(16, -21, 17, 12, 50, 7, ["#F2B8C6", "#DDA0B0", "#F7D0DA"]) + shape(FR(-8.9), heart(24.5, 53.5, 2.4, 18), GOLD, 0.9) + lineOn(FR(-8.85), [[16, 55.6], [33, 55.6]], GOLDD, 0.8);
    s += cyl(5, -9, 50, 1.4, 4.5, GOLD, "#E77E8E", 0.9, 10);
    s += at(-6, -12, 50.2, SPR.brush(), 12, 8);
    return s;
  };

  // ---------- がっき・テレビ・だんろ ----------
  M.piano = (k) => {
    // アップライト ピアノ: けんばんは 手前に つきだす（まえは 前の 面に たてに かいていた）。白と 黒の けん・がくふ・ペダル・メトロノーム
    const { box, shape, FR, TP, lineOn, onP, at, shadow } = k;
    const BODY = ["#3F3B4B", "#2E2B38", "#5A5569"];
    let s = shadow(0.12, 2, 4);
    s += box(-54, -44, 108, 30, 0, 93, BODY);
    s += lineOn(FR(-13.9), [[-46, 90], [-32, 62]], "#FFFFFF", 3, 'stroke-opacity=".12"') + lineOn(FR(-13.9), [[-38, 90], [-30, 74]], "#FFFFFF", 1.6, 'stroke-opacity=".12"');
    s += shape(FR(-13.9), rr(-42, 8, 84, 38, 3), "#383443", 1) + lineOn(FR(-13.85), close(rr(-38, 12, 76, 30, 2)), "#57516A", 1);
    s += shape(FR(-13.8), rr(-28, 64, 56, 18, 2), "#4A4558", 1.2) + shape(FR(-13.7), rect(-17, 66, 34, 14), "#FFFDF4", 1);
    s += onP(FR(-13.65), -16, 79, 32, 12, `${[2.5, 4.5, 6.5, 8.5, 10.5].map((y) => `<path d="M1,${y} H31" stroke="#B9B2A4" stroke-width="0.5"/>`).join("")}<ellipse cx="6" cy="8" rx="1.4" ry="1" fill="${INK}"/><path d="M7.3,8 V3" stroke="${INK}" stroke-width="0.7"/><ellipse cx="13" cy="6" rx="1.4" ry="1" fill="${INK}"/><path d="M14.3,6 V1.4" stroke="${INK}" stroke-width="0.7"/><ellipse cx="21" cy="9" rx="1.4" ry="1" fill="${INK}"/><path d="M22.3,9 V4 L27,3.4 V7.4" fill="none" stroke="${INK}" stroke-width="0.7"/><ellipse cx="25.8" cy="7.6" rx="1.4" ry="1" fill="${INK}"/>`);
    s += shape(FR(-13.85), rect(-48, 56, 96, 6.5), "#4E495D", 0) + shape(FR(-13.8), ov(0, 59.2, 2.2, 1.4, 12), GOLD, 0.8);
    s += box(-13, -14, 26, 6, 0, 5, BODY);
    for (const x of [-8, -1.5, 5]) s += box(x, -12, 3, 7, 3, 1.4, [GOLD, GOLDD, "#F0D58A"], 1);
    s += box(-54, -14, 6, 13, 0, 55, BODY) + box(-48, -14, 96, 13, 50, 5, BODY);
    s += shape(TP(55.1), rect(-47, -13, 94, 11), "#FBF8F1", 1.1);
    const kw = 94 / 26;
    for (let i = 1; i < 26; i++) s += lineOn(TP(55.2), [[-47 + i * kw, -13], [-47 + i * kw, -2]], "#CFC9BD", 0.8);
    for (let i = 0; i < 25; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) s += box(-47 + (i + 1) * kw - 1.1, -13, 2.2, 6.5, 55.1, 1.8, ["#2A2833", "#1E1C26", "#46424F"], 0.8);
    s += box(-50, -14, 3, 13, 55, 5, BODY) + box(47, -14, 3, 13, 55, 5, BODY) + box(48, -14, 6, 13, 0, 55, BODY);
    s += at(30, -30, 93, SPR.metronome(), 8, 20) + at(-30, -28, 93, SPR.rose(), 8, 22) + k.cyl(-30, -28, 93, 2.6, 6, "#9FB8C9", "#C2D4E0", 1.1) + at(-8, -32, 93, SPR.photo(), 8, 14);
    return s;
  };
  M.tv = (k) => {
    // テレビ: まるい かどの テレビと アンテナ、テレビだい（とびら・ゲームき・リモコン）
    const { box, prism, shape, FR, TP, lineOn, onP, ball, shadow, rod } = k;
    let s = shadow(0.1, 3, 5);
    s += box(-39, -38, 78, 37, 0, 32, WOOD);
    s += shape(FR(-0.9), rr(-35, 4, 32, 24, 2.5), "#D5B07B", 1.2) + shape(FR(-0.85), star(-19, 16, 4.5, 2), "#F7D56A", 1) + ball(-6.5, -0.7, 16, 1.2, GOLD, 0.9, 0);
    s += shape(FR(-0.9), rr(3, 4, 32, 24, 2.5), "#6E5238", 1.2) + onP(FR(-0.8), 9, 12, 20, 7, `<g transform="translate(10 7)">${SPR.console()}</g>`);
    s += shape(TP(32.1), ov(0, -20, 12, 6.5, 24), "#4A4F5E", 1.2) + box(-3, -22, 6, 3, 32, 6, ["#4A4F5E", "#3A3F4C", "#5B6172"]);
    s += prism(FR(-17), rr(-35, 37, 70, 43, 8), [0, -7, 0], "#5C6477", "#474E5F");
    s += k.opts.live ? shape(FR(-16.9), rr(-31, 41, 62, 34, 5), "#2F3848", 1.2) : shape(FR(-16.9), rr(-31, 41, 62, 34, 5), k.lg([[0, "#CFEBF6"], [1, "#8FC7E8"]]), 1.2);
    s += k.L(onP(FR(-16.85), -29, 73, 58, 30, `<path d="M0,22 Q10,14 20,19 Q32,10 44,17 Q52,13 58,16 V30 H0 Z" fill="#9ED08C"/><path d="M0,26 Q20,21 58,25 V30 H0 Z" fill="#7FB06A"/><circle cx="46" cy="7" r="4" fill="#F7D56A"/><path d="M10,8 q2,-3 5,-1 q3,-2 5,1 z" fill="#FFFFFF"/>`));
    s += shape(FR(-16.8), [[-31, 60], [-31, 75], [-16, 75]], "#FFFFFF", 0, 'fill-opacity=".22"');
    s += shape(FR(-16.8), ov(28, 38.9, 1.2, 1.2, 10), "#E77E6E", 0);
    s += rod([[-2, -20, 80], [-14, -23, 95]], "#9DA3AF", 1) + rod([[2, -20, 80], [13, -22, 93]], "#9DA3AF", 1) + ball(-14, -23, 95.5, 1.5, "#F2B8C6", 0.9, 0) + ball(13, -22, 93.5, 1.5, "#9CC7E6", 0.9, 0) + ball(0, -20, 80, 3, "#5C6477", 1.1, 0.3);
    s += box(16, -9, 10, 4, 32, 2, ["#6B7285", "#565C6D", "#8990A2"], 1) + shape(TP(34.1), ov(18.5, -7, 0.9, 0.9, 8), "#E77E6E", 0) + shape(TP(34.1), ov(22, -7, 0.9, 0.9, 8), "#9CC7E6", 0);
    return s;
  };
  M.fireplace = (k) => {
    // あったか だんろ: れんが・石の アーチ・まき・火・マントルピースの ろうそくと とけい
    const { box, shape, FR, SD, TP, lineOn, cyl, at, onP, shadow } = k;
    const BR = ["#C98B72", "#A9705A", "#D9A28B"], STONE = ["#DDD3C3", "#C2B6A3", "#ECE4D6"];
    let s = shadow(0.12, 1, 3);
    s += box(-49, -44, 98, 44, 0, 5, STONE);
    s += box(-44, -40, 88, 32, 5, 70, BR);
    for (let z = 5, r = 0; z < 75; z += 6, r++) {
      s += lineOn(FR(-7.9), [[-44, z], [44, z]], "#EBD3C4", 1);
      for (let x = -44 + (r % 2 ? 6 : 0) + 12; x < 44; x += 12) s += lineOn(FR(-7.9), [[x, z], [x, Math.min(z + 6, 75)]], "#EBD3C4", 1);
      for (let x = -44 + (r % 2 ? 6 : 0); x < 44; x += 12) if (U.hash(x, z, 3) > 0.72) s += shape(FR(-7.95), rect(Math.max(-44, x + 0.6), z + 0.6, Math.min(10.8, 44 - Math.max(-44, x + 0.6) - 0.6), 4.8), "#B97A62", 0);
      s += lineOn(SD(44.1), [[-40, z], [-8, z]], "#D9B6A6", 1);
    }
    s += shape(FR(-7.8), arch(-31, 31, 5, 37, 54), "#E4DACB", 1.5) + shape(FR(-7.75), [[-4.5, 49], [4.5, 49], [5.5, 55.5], [-5.5, 55.5]], "#D2C6B4", 1.1);
    s += shape(FR(-7.7), arch(-24, 24, 5, 31, 45), "#3B2B2B", 1.5) + shape(FR(-7.6), arch(-19, 19, 5, 26, 37), k.lg([[0, "#2E2222"], [1, "#6A4234"]]), 0);
    s += lineOn(FR(-7.5), [[-17, 9.5], [17, 9.5]], "#2A2224", 2.2);
    s += shape(FR(-7.45), rr(-17, 7, 34, 6.2, 3), "#8C5E3C", 1.2) + shape(FR(-7.4), rot2(rr(-12, 11, 26, 5.6, 2.8), 0, 13.5, -0.18), "#A06E48", 1.2);
    s += shape(FR(-7.35), ov(-15, 10.1, 2.3, 2.7, 12), "#D9B07E", 0.9) + shape(FR(-7.35), ov(15, 10.1, 2.3, 2.7, 12), "#D9B07E", 0.9);
    // うごかない ときの 小さな 火（ART-03b で ゆらぐ 火を かさねる）
    s += k.L(onP(FR(-7.3), -12, 30, 24, 16, `<path d="M4,16 C0,11 4,8 5,4 C8,8 10,11 9,16 Z M10,16 C6,9 11,5 12,0 C16,5 19,10 15,16 Z M15,16 C13,12 17,10 18,7 C21,10 22,13 20,16 Z" fill="#F7A24B" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/><path d="M11.5,16 C10,12 12,9 12.5,6 C14.5,9 15.5,12 14,16 Z" fill="#FFE8A0"/>`));
    s += box(-49, -44, 98, 42, 75, 6, WAL) + lineOn(FR(-1.9), [[-49, 77.5], [49, 77.5]], "#C49A73", 1.1);
    s += cyl(-38, -20, 81, 2.4, 9, "#FFF1D8", "#FFFBF0", 1.1) + at(-38, -20, 90, SPR.candle(), 4, 11) + cyl(-31, -24, 81, 2.4, 6, "#FFF1D8", "#FFFBF0", 1.1) + at(-31, -24, 87, SPR.candle(), 4, 11);
    s += at(0, -26, 81, SPR.clock(), 8, 18) + at(22, -30, 81, SPR.photo(), 8, 14) + cyl(38, -20, 81, 3.6, 5, "#9CC7E6", "#BFDDF0", 1.1) + at(38, -20, 86, SPR.sprout(), 7, 10);
    return s;
  };

  // ---------- おもちゃ ----------
  M.toybox = (k) => {
    // おもちゃばこ: ふたが あいて おもちゃが のぞく（くま・ボール・つみき・あひる・ほしの ステッキ）
    const { box, poly, shape, FR, SD, lineOn, slab, onP, ball, at, shadow } = k;
    const BL = "#8FC3E4", BLS = "#6FA3C8", BLT = "#B4D8EF", TR = "#E3C28C";
    let s = shadow(0.12, 1, 4);
    const lid = slab([-33, -42, 30], [1, 0, 0], [0, -0.18, 1], rr(0, 0, 66, 36, 3), 3.4, "#A9D1EC", BLS, 1.4);
    s += lid.s + k.lineOn(lid.m, close(rr(3.5, 3.5, 59, 29, 2)), TR, 2.2) + shape(lid.m, star(33, 18, 7, 3.2), "#F7D56A", 1.1) + shape(lid.m, ov(14, 24, 2.2, 2.2, 10), "#FFFFFF", 0) + shape(lid.m, ov(52, 10, 2.2, 2.2, 10), "#FFFFFF", 0);
    s += poly([[-33, -42, 30], [33, -42, 30], [33, -40, 30], [-33, -40, 30]], BLT, 1.1) + poly([[-33, -42, 30], [-31, -42, 30], [-31, 0, 30], [-33, 0, 30]], BLT, 1.1);
    s += shape(FR(-40), rect(-31, 14, 62, 16), "#5E88A8", 1.1) + shape(SD(-31), rect(-40, 14, 38, 16), "#557D9C", 1.1);
    s += at(-18, -26, 22, SPR.teddy(), 12, 26);
    s += box(8, -31, 11, 11, 23, 11, ["#9BCB85", "#7FB06A", "#B6DDA3"], 1.2) + shape(FR(-19.9), star(13.5, 28.5, 3.2, 1.4), "#FFFFFF", 0.8);
    s += at(14, -18, 24, SPR.wand(), 8, 26);
    s += ball(-4, -14, 29, 7, "#E77E6E", 1.3) + lineOn(FR(-5.3), arc(-4, 29, 8.4, 8.4, 0.3, 2.8, 10), "#FFFFFF", 1.4);
    s += at(22, -9, 26.5, SPR.duck(), 10, 14);
    s += poly([[-33, 0, 0], [33, 0, 0], [33, 0, 30], [-33, 0, 30]], BL, 1.5) + poly([[33, -42, 0], [33, 0, 0], [33, 0, 30], [33, -42, 30]], BLS, 1.5);
    s += shape(FR(0.1), rect(-33, 0, 66, 4), TR, 1.1) + shape(FR(0.1), rect(-33, 26, 66, 4), TR, 1.1) + shape(SD(33.1), rect(-42, 0, 42, 4), shade(TR, -0.1), 1.1) + shape(SD(33.1), rect(-42, 26, 42, 4), shade(TR, -0.1), 1.1);
    s += shape(FR(0.2), star(0, 15, 8.5, 3.8), "#F7D56A", 1.2);
    for (const [x, z] of [[-22, 10], [-14, 20], [18, 19], [24, 9]]) s += shape(FR(0.2), ov(x, z, 2, 2, 10), "#FFFFFF", 0);
    s += onP(SD(33.2), -28, 20, 14, 8, `<path d="M1,1 Q7,9 13,1" fill="none" stroke="${INK}" stroke-width="3"/><path d="M1,1 Q7,9 13,1" fill="none" stroke="#D9B98A" stroke-width="1.6"/>`);
    s += poly([[-33, -2, 30], [33, -2, 30], [33, 0, 30], [-33, 0, 30]], BLT, 1.1) + poly([[31, -42, 30], [33, -42, 30], [33, 0, 30], [31, 0, 30]], BLT, 1.1);
    return s;
  };
  M.aquarium = (k) => {
    // おさかな アクアリウム: 台の 上の ガラスの 水そう（すな・水草・おしろ・いわ・あわ・魚）
    const { box, shape, FR, SD, TP, lineOn, at, shadow, ball } = k;
    const FRAME = ["#4B4F5A", "#3B3F48", "#5E6370"];
    let s = shadow(0.12, 2, 4);
    s += box(-48, -48, 96, 46, 0, 32, DARK);
    for (const x of [-44, 2]) s += shape(FR(-1.9), rr(x, 4, 42, 24, 2), "#9C7856", 1.2) + ball(x + (x < 0 ? 38 : 4), -1.7, 16, 1.2, GOLD, 0.9, 0);
    s += box(-47, -46, 94, 42, 32, 3, FRAME);
    s += shape(FR(-45), rect(-46, 35, 92, 42), k.lg([[0, "#A9DDEA"], [1, "#5FAFCB"]]), 1.2) + shape(SD(-46), rect(-45, 35, 40, 42), "#6DB6CC", 1.2);
    s += k.prism(TP(40), rect(-46, -45, 92, 40), [0, 0, -5], "#E9D5A8", "#D3BC8C", 1.1);
    const R = rng(11);
    for (let i = 0; i < 26; i++) s += shape(TP(40.1), ov(-43 + R() * 86, -43 + R() * 36, 1.2 + R(), 1 + R() * 0.6, 8), ["#C9B48A", "#F2E6C9", "#B6C9C9", "#E9B9A8"][i % 4], 0);
    s += at(-38, -41, 40, SPR.seaweed(30, "#6FAE7C"), 8, 32) + at(-28, -42, 40, SPR.seaweed(22, "#8FC08A"), 8, 24) + at(36, -40, 40, SPR.seaweed(28, "#6FAE7C"), 8, 30) + at(28, -42, 40, SPR.seaweed(18, "#A3CF94"), 8, 20);
    s += at(14, -32, 40, SPR.castle(), 12, 26) + at(-8, -26, 40, SPR.rocks(), 13, 10);
    s += k.L(at(-14, -26, 58, SPR.fish("#F29A5B", "#FFD08A"), 12, 7) + at(24, -18, 65, SPR.fish("#F7D56A", "#FFF1B0"), 12, 7));
    for (let i = 0; i < 5; i++) s += k.L(ball(-34 + (i % 2) * 1.5, -12, 44 + i * 6.5, 0.9 + i * 0.25, "#EFFBFF", 0.8, 0));
    s += at(-42, -8, 40, SPR.grass(), 8, 12) + at(40, -9, 40, SPR.grass("#A3CF94"), 8, 12);
    s += box(-47, -46, 94, 2, 76, 2.4, FRAME, 1.1) + box(-47, -46, 2, 42, 76, 2.4, FRAME, 1.1);
    s += shape(TP(74), rect(-45, -44, 90, 38), "#C4E9F2", 1, 'fill-opacity=".45"') + lineOn(TP(74.1), [[-30, -30], [-18, -28], [-6, -31]], "#FFFFFF", 1.2, 'stroke-opacity=".8"') + lineOn(TP(74.1), [[8, -18], [20, -16], [30, -19]], "#FFFFFF", 1.2, 'stroke-opacity=".8"');
    s += shape(FR(-5), rect(-47, 35, 94, 43), "#D7F1F8", 1.5, 'fill-opacity=".2"') + shape(FR(-4.9), [[-40, 76], [-31, 76], [-44, 46], [-47, 46], [-47, 62]], "#FFFFFF", 0, 'fill-opacity=".3"') + shape(FR(-4.9), [[-26, 76], [-22, 76], [-34, 50], [-36, 54]], "#FFFFFF", 0, 'fill-opacity=".22"');
    s += shape(SD(47), rect(-46, 35, 41, 43), "#CDEBF3", 1.5, 'fill-opacity=".24"');
    s += box(-47, -6, 94, 2, 76, 2.4, FRAME, 1.1) + box(45, -46, 2, 42, 76, 2.4, FRAME, 1.1);
    s += k.rod([[-44, -44, 78.4], [-44, -44, 86], [-34, -38, 86]], "#5E6370", 1.6) + ball(-33, -37.5, 85, 2.6, "#FFF2B8", 1, 0.4);
    return s;
  };
  M.musicbox = (k) => {
    // ほしの オルゴール: ふたの うらに かがみ、まわる ぶたいの 上に ほし。よこに ねじまきの かぎ
    const { poly, shape, FR, SD, TP, lineOn, slab, onP, ball, at, shadow, cyl, rod } = k;
    const LV = "#B9A6D6", LVS = "#9C88BC", LVT = "#D2C4E8", VEL = "#6E5A92";
    let s = shadow(0.12, 6, 10);
    s += ball(-37, -40, 3.4, 3.4, GOLD, 1.1, 0.4) + ball(37, -40, 3.4, 3.4, GOLD, 1.1, 0.4);
    const lid = slab([-42, -44, 36], [1, 0, 0], [0, -0.12, 1], rr(0, 0, 84, 36, 4), 3, LVT, LVS, 1.4);
    s += lid.s + shape(lid.m, ov(42, 18, 24, 12.5, 36), GOLD, 1.2) + shape(lid.m, ov(42, 18, 21, 10, 36), k.lg([[0, "#EFF9FB"], [1, "#BFE3EA"]]), 1) + k.lineOn(lid.m, [[30, 20], [36, 25]], "#FFFFFF", 1.8);
    for (const [x, y] of [[8, 8], [76, 28], [10, 30], [74, 7]]) s += shape(lid.m, star(x, y, 3, 1.3, 4), "#F5D66B", 0.8);
    s += poly([[-42, -44, 36], [42, -44, 36], [42, -41, 36], [-42, -41, 36]], LVT, 1.1) + poly([[-42, -44, 36], [-39, -44, 36], [-39, -6, 36], [-42, -6, 36]], LVT, 1.1);
    s += shape(FR(-41), rect(-39, 20, 78, 16), VEL, 1.1) + shape(SD(-39), rect(-41, 20, 35, 16), shade(VEL, -0.1), 1.1) + shape(TP(20), rect(-39, -41, 78, 35), shade(VEL, 0.12), 0);
    s += cyl(0, -24, 20, 14, 3, GOLDD, GOLD, 1.2) + shape(TP(23.1), ov(0, -24, 10, 10, 28), "#F4E6C6", 0.9);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; s += shape(TP(23.2), ov(Math.cos(a) * 12, -24 + Math.sin(a) * 12, 0.9, 0.9, 8), "#FFFFFF", 0); }
    s += rod([[0, -24, 23], [0, -24, 52]], GOLD, 1.6);
    s += poly([[-42, -6, 6], [42, -6, 6], [42, -6, 36], [-42, -6, 36]], LV, 1.5) + poly([[42, -44, 6], [42, -6, 6], [42, -6, 36], [42, -44, 36]], LVS, 1.5);
    s += lineOn(FR(-5.9), close(rect(-38, 10, 76, 22)), GOLD, 1.4) + lineOn(SD(42.1), close(rect(-40, 10, 30, 22)), GOLD, 1.4);
    s += shape(FR(-5.8), heart(0, 21, 7.5), GOLD, 1.2) + shape(FR(-5.7), ov(0, 19.2, 1.1, 1.1, 8), INK, 0) + lineOn(FR(-5.7), [[0, 19], [0, 16.8]], INK, 0.9);
    s += poly([[-42, -9, 36], [42, -9, 36], [42, -6, 36], [-42, -6, 36]], LVT, 1.1) + poly([[39, -44, 36], [42, -44, 36], [42, -6, 36], [39, -6, 36]], LVT, 1.1);
    s += k.L(at(0, -24, 50, SPR.starFig(), 16, 34));
    s += rod([[42, -25, 21], [48, -25, 21]], GOLD, 2) + shape(SD(48.5), ov(-25, 21, 5.2, 4.2, 18), GOLD, 1.2) + shape(SD(48.6), ov(-25, 21, 1.8, 1.4, 10), GOLDD, 0);
    s += ball(-37, -10, 3.4, 3.4, GOLD, 1.1, 0.4) + ball(37, -10, 3.4, 3.4, GOLD, 1.1, 0.4);
    return s;
  };
  M.train = (k) => {
    // おもちゃの きしゃ: だえんの 木の レール・トンネル・しんごう・き。きかんしゃと 2りょうの かしゃ
    const { box, shape, FR, SD, TP, lineOn, cyl, ball, at, P, prism } = k;
    const cy = -25, A = 42, B = 18, band = 4.5;
    const outer = ov(0, cy, A + band, B + band, 64), inner = ov(0, cy, A - band, B - band, 64);
    const ring = (z) => `<path d="M${outer.map(([x, y]) => { const q = P(x, y, z); return f2(q.x) + "," + f2(q.y); }).join(" L")} Z M${inner.slice().reverse().map(([x, y]) => { const q = P(x, y, z); return f2(q.x) + "," + f2(q.y); }).join(" L")} Z" fill-rule="evenodd"`;
    let s = `${ring(0)} fill="#C9A36E" stroke="${INK}" stroke-width="1.2"/>` + `${ring(1.6)} fill="#E4C99A" stroke="${INK}" stroke-width="1.2"/>`;
    for (const off of [-1.8, 1.8]) s += lineOn(TP(1.7), close(ov(0, cy, A + off, B + off, 64)), "#B8925F", 1.1);
    s += prism(SD(-12), arch(-50, -30, 0, 9, 19), [-22, 0, 0], "#9ACB86", "#7FB06A", 1.4) + shape(SD(-11.9), arch(-46, -34, 0, 5, 10.5), "#4E4540", 1.2);
    s += at(-26, -44, 17, SPR.blooms(), 10, 14) + at(34, -45, 0, SPR.tree(), 9, 22) + at(-44, -12, 0, SPR.tree(), 9, 22) + at(24, -47, 0, SPR.signal(), 5, 28);
    const wheels = (x0, n) => { let w = ""; for (let i = 0; i < n; i++) w += shape(FR(-2.7), ov(x0 + 2.4 + i * 4.4, 2.6, 2.3, 2.3, 12), "#4B4550", 1) + shape(FR(-2.6), ov(x0 + 2.4 + i * 4.4, 2.6, 0.8, 0.8, 8), GOLD, 0); return w; };
    // きしゃ（live の ときは FurnLive が レールの 上を はしらせる）
    s += k.L(box(-24, -11, 13, 8, 2, 6, ["#F3D98A", "#D9BD64", "#F8E7AE"], 1.2) + ball(-20, -7, 10, 2.6, "#9CC7E6", 1, 0.4) + ball(-15, -7, 10, 2.4, "#F2A7B8", 1, 0.4) + wheels(-24, 3) +
      lineOn(TP(4), [[-11, -7], [-8, -7]], INK, 1.4) +
      box(-8, -11, 13, 8, 2, 7, ["#9CC7E6", "#7EAAD0", "#BCDBF0"], 1.2) + box(-5, -9.5, 7, 5, 9, 5, ["#E9DCC0", "#CEBFA0", "#F7EEDB"], 1) + wheels(-8, 3) +
      lineOn(TP(4), [[5, -7], [8, -7]], INK, 1.4) +
      box(8, -11, 17, 8, 2, 8, ["#E77E6E", "#C9604F", "#F29C8E"], 1.2) + box(8, -11.5, 7, 9, 10, 7, ["#E77E6E", "#C9604F", "#F29C8E"], 1.2) + box(7.4, -12, 8.2, 10, 17, 1.6, ["#4B4550", "#3A3540", "#5E5864"], 1) +
      cyl(20, -7, 10, 2.1, 6, "#4B4550", "#6B6570", 1.1) + shape(FR(-2.8), ov(25.2, 7, 1.4, 1.4, 10), "#F7D56A", 0.9) + wheels(8, 4) +
      at(20, -7, 17, SPR.puff(), 8, 12));
    return s;
  };
  M.tent = (k) => {
    // ひみつの テント: しましまの 三角の テント。入り口の おくに あかり、ぼうの さきに はた、ガーランド
    const { poly, shape, SD, lineOn, line, smooth, at, shadow, rod } = k;
    let s = shadow(0.12, 2, 6);
    const RX = 44, RY = -25, RZ = 70;
    s += rod([[-RX, -44, 0], [-RX, -18, 80]], "#C79A66", 1.8) + rod([[-RX, -6, 0], [-RX, -32, 80]], "#C79A66", 1.8);
    const N = 11;
    for (let i = 0; i < N; i++) {
      const x0 = -RX + ((2 * RX) / N) * i, x1 = -RX + ((2 * RX) / N) * (i + 1);
      s += poly([[x0, RY, RZ], [x1, RY, RZ], [x1, -1, 0], [x0, -1, 0]], i % 2 ? "#FFF6F0" : "#F2C6D2", 0);
    }
    s += poly([[-RX, RY, RZ], [RX, RY, RZ], [RX, -1, 0], [-RX, -1, 0]], "none", 1.5);
    const fl = ["#F7D56A", "#9CC7E6", "#A9D6C2", "#F2A7B8"];
    for (let i = 0; i < 8; i++) {
      const x = -RX + 6 + i * 10.6, dy = 5.6, dz = 16.3;
      s += poly([[x, RY, RZ], [x + 8, RY, RZ], [x + 4, RY + dy * 1.1, RZ - dz * 1.1]], fl[i % 4], 1);
    }
    s += line([[-RX, RY, RZ], [RX, RY, RZ]], INK, 1.2);
    s += poly([[RX, -1, 0], [RX, RY, RZ], [RX, -49, 0]], "#E9B3C3", 1.5);
    s += shape(SD(RX + 0.1), [[-37, 0], [-25, 48], [-13, 0]], "#5B4A5E", 1.3);
    for (let i = 0; i < 7; i++) { const u = (i + 0.5) / 7; s += shape(SD(RX + 0.2), ov(-33 + u * 16, 40 - Math.sin(u * Math.PI) * 10, 1.2, 1.2, 8), "#FFE39A", 0); }
    s += lineOn(SD(RX + 0.15), arc(-25, 40, 8, 10, Math.PI, TAU, 10), "#FFF3C4", 0.8, 'stroke-opacity=".7"');
    s += shape(SD(RX + 0.2), rr(-33, 1, 16, 6, 3), "#F3D98A", 1) + shape(SD(RX + 0.25), rr(-30, 7, 8, 5, 2), "#FFFFFF", 0.9);
    s += smooth(SD(RX + 0.3), [[-37, 0], [-25, 48], [-30, 30], [-40, 14], [-44, 6], [-46, 0]], "#F2C6D2", 1.2) + smooth(SD(RX + 0.3), [[-13, 0], [-25, 48], [-20, 30], [-10, 14], [-6, 6], [-4, 0]], "#F2C6D2", 1.2);
    s += shape(SD(RX + 0.4), rr(-43.5, 12, 6, 3.4, 1.2), "#F7D56A", 0.9) + shape(SD(RX + 0.4), rr(-12.5, 12, 6, 3.4, 1.2), "#F7D56A", 0.9);
    s += rod([[RX, -44, 0], [RX, -18, 80]], "#C79A66", 1.8) + rod([[RX, -6, 0], [RX, -32, 80]], "#C79A66", 1.8);
    s += at(RX, -32, 80, SPR.flag(), 10, 12);
    return s;
  };
  M.kotatsu = (k) => {
    // こたつ: ふとんが 床まで たれる（まえは つくえが 板の 上に ういていた）。天板に みかんの かご・おちゃ
    const { poly, shape, prism, TP, line, lineOn, cyl, ball, at } = k;
    const QF = "#E48A6E", QS = "#C9725A";
    let s = shape(TP(0), rr(-50, -51, 100, 52, 16), INK, 0, 'fill-opacity=".13"');
    // てまえの ぬの: 下は 床に ひろがり、上は 天板の ふちへ
    const fr = (u, v) => [u * (47 - 7 * v) + Math.sin(u * 9) * (1 - v) * 1.2, -4 * v + (1 - v) * 0.5, 44 * v];
    const sd = (u, v) => [47 - 7 * v, -50 + 4 * v + u * (50 - 8 * v), 44 * v];
    const face = (f, n, col) => { const ps = []; for (let i = 0; i <= n; i++) ps.push(f(-1 + (2 * i) / n, 0)); for (let i = n; i >= 0; i--) ps.push(f(-1 + (2 * i) / n, 1)); return poly(ps, col, 1.5); };
    s += face(fr, 24, QF);
    for (const v of [0.22, 0.6]) { const ps = []; for (let i = 0; i <= 24; i++) ps.push(fr(-1 + i / 12, v)); const qs = []; for (let i = 24; i >= 0; i--) qs.push(fr(-1 + i / 12, v + 0.07)); s += poly([...ps, ...qs], "#F2B19A", 0); }
    for (const u of [-0.72, -0.36, 0, 0.36, 0.72]) { s += poly([fr(u - 0.03, 0), fr(u + 0.03, 0), fr(u + 0.03, 1), fr(u - 0.03, 1)], "#F2B19A", 0); s += line([fr(u + 0.18, 0.02), fr(u + 0.16, 0.7)], "#C9725A", 1, 'stroke-opacity=".6"'); }
    const sface = (n, col) => { const ps = []; for (let i = 0; i <= n; i++) ps.push(sd(i / n, 0)); for (let i = n; i >= 0; i--) ps.push(sd(i / n, 1)); return poly(ps, col, 1.5); };
    s += sface(10, QS);
    for (const v of [0.22, 0.6]) s += poly([sd(0, v), sd(1, v), sd(1, v + 0.07), sd(0, v + 0.07)], "#D98C75", 0);
    for (const u of [0.25, 0.6]) s += poly([sd(u - 0.02, 0), sd(u + 0.02, 0), sd(u + 0.02, 1), sd(u - 0.02, 1)], "#D98C75", 0);
    s += face(fr, 24, "none") + sface(10, "none");
    { const ps = []; for (let i = 0; i <= 24; i++) ps.push(fr(-1 + i / 12, 0.02)); s += line(ps, "#B9614C", 1.6); }
    s += prism(TP(50), rr(-44, -48, 88, 46, 3), [0, 0, -6], "#D9AB7C", "#9C7248") + lineOn(TP(50.1), close(rr(-40, -44, 80, 38, 2)), "#C99867", 1);
    s += cyl(-8, -26, 50, 12.5, 4.5, "#C9A064", "#E6C995", 1.2) + lineOn(TP(52), arc(-8, -26, 12.6, 12.6, -0.8, 2.35, 18), "#B48C52", 1, 'stroke-dasharray="1.8 1.6"');
    for (const [x, y, z] of [[-13, -30, 58], [-4, -31, 58], [-12, -21, 58], [-3, -22, 58.5], [-8, -26, 63]]) s += ball(x, y, z, 4.4, "#F29A3B", 1.2, 0.45) + at(x + 0.6, y, z + 4.4, `<path d="M0,0 q2,-3 5,-2 q-2,2 -5,2 Z" fill="#7FB06A" stroke="${INK}" stroke-width="0.8"/>`, 5, 4);
    for (const [x, y] of [[18, -14], [26, -30]]) s += cyl(x, y, 50, 3, 4.6, "#8FB3A4", "#6B5040", 1.1);
    s += at(28, -18, 50.2, SPR.kyusu(), 17, 14);
    return s;
  };
  M.lamp = (k) => {
    // スタンドライト: まるい 台・ほそい ぼう・ひだの ある かさ・ひもの スイッチ
    const { shape, TP, lineOn, prism, frustum, ball, line } = k;
    const cx = 0, cy = -12;
    let s = shape(TP(0), ov(cx, cy, 12.5, 12.5, 28), INK, 0, 'fill-opacity=".13"');
    s += prism(TP(3.5), ov(cx, cy, 10, 10, 28), [0, 0, -3.5], BRASS[2], BRASS[1], 1.3) + shape(TP(3.6), ov(cx, cy, 6.5, 6.5, 24), BRASS[0], 0);
    s += prism(TP(60), ov(cx, cy, 1.4, 1.4, 12), [0, 0, -56.5], "#CFA64E", "#A9853A", 1.1) + ball(cx, cy, 36, 2.1, BRASS[0], 1, 0.4);
    s += frustum(cx, cy, 57, 15, 84, 9, "#F6E7C1", "#E9D3A0", 1.4) + shape(TP(84.1), ov(cx, cy, 6, 6, 20), "#FFF6CF", 0);
    for (let a = -0.7; a < 2.4; a += 0.26) s += line([[cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 84], [cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 57]], "#E3CC9C", 1);
    s += lineOn(TP(58.4), arc(cx, cy, 15.1, 15.1, -0.8, 2.35, 22), "#EFA9B6", 2.6);
    s += line([[cx + 6, cy + 6, 57], [cx + 6, cy + 6, 48]], "#B38F3F", 1) + ball(cx + 6, cy + 6, 47, 1.3, BRASS[0], 0.9, 0);
    return s;
  };

  // ---------- 2D の 絵の 家具: 床の 板を やめて、かげだけ（まえは 大きな 板の 上に のっていた）----------
  const artModel = (k, f) => {
    const { d, P, shape, TP, flip } = k, r = Math.min(f.w * 0.34, 30);
    const s = shape(TP(0), ov(0, -d / 2, r, Math.min(r * 0.78, d * 0.48), 28), INK, 0, 'fill-opacity=".13"');
    const q = P(0, -d / 2, 0);
    // live で 絵ごと うごかす 家具（もくば）は かげだけ。ほかは live を 絵に わたす（きんぎょばちの 魚を ぬく など）
    const g = k.opts.live && ART_LIVE.has(f.id) ? "" : `<g transform="translate(${f2(q.x + (flip ? f.w / 2 : -f.w / 2))} ${f2(q.y - f.h)})${flip ? " scale(-1 1)" : ""}">${FURN_ART[f.id]({ live: !!k.opts.live })}</g>`;
    return { s: s + g, box: [q.x - f.w / 2 - 12, q.y - f.h - 12, q.x + f.w / 2 + 12, q.y + 8] };
  };
  const ART_LIVE = new Set(["rockinghorse"]);
  // 板の 上に 置いていた 家具（HomeDesign の さいごの わけ方と おなじ）。じぶんの モデルを もつ 家具（パズル・お店の 景品・池袋の cityItem）は のぞく
  const OLD_OWN = new Set(["bed_simple", "bed_royal", "table_wood", "desk", "stool_oak", "chair_wood", "teacart", "console_oak", "sofa", "cloudsofa", "bookshelf", "wardrobe_oak", "kitchen", "vanity", "piano", "tv", "fireplace", "toybox", "plantshelf", "birdcage_brass"]);
  const onPlate = (f) => f && f.kind === "floor" && !OLD_OWN.has(f.id) && !M[f.id] && !f.puzzlePrize && !f.shopPrize && !f.cityItem && typeof FURN_ART[f.id] === "function";

  return {
    ids: Object.keys(M),
    extra: [], // ほかの ファイルが 足した モデル（音楽プレイヤー など）
    // ほかの ファイルから 立体モデルを 足す（fn(k) は kit を うけとって SVG の 中身を かえす）
    register(id, fn) { M[id] = fn; if (!this.extra.includes(id)) this.extra.push(id); HomeDesign.models.forEach((_, key) => { if (key.startsWith(id + ":") || key.startsWith("live:" + id + ":")) HomeDesign.models.delete(key); }); },
    SPR,
    shapes: { rect, rr, ov, arc, arch, star, heart, scallop, moon, close, rot2 },
    has(id) { return !!M[id] || onPlate(FURN_INDEX[id]); },
    build(id, opts = {}) {
      const f = FURN_INDEX[id];
      if (!f) return null;
      if (M[id]) { const k = kit(id, opts); return k.done(M[id](k)); }
      if (onPlate(f)) {
        const k = kit(id, opts), a = artModel(k, f);
        const m = k.done(a.s);
        // 2D の 絵の はみ出しを はんいに 入れる
        const x0 = Math.min(m.x, a.box[0]), y0 = Math.min(m.y, a.box[1]), x1 = Math.max(m.x + m.w, a.box[2]), y1 = Math.max(m.y + m.h, a.box[3]);
        m.full = m.full.replace(/viewBox="[^"]*"/, `viewBox="${f2(x0)} ${f2(y0)} ${f2(x1 - x0)} ${f2(y1 - y0)}"`);
        Object.assign(m, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        return m;
      }
      return null;
    },
  };
})();

// かべの 家具（2D）: はとどけい・まど・3にんの ポスターを こまかく する
(() => {
  const FSX = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  FURN_ART.clock = (opts = {}) => {
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${f2(22 + Math.sin(a) * 7.6)}" cy="${f2(37 - Math.cos(a) * 7.6)}" r="${i % 3 ? 0.55 : 0.95}" fill="${INK}"/>`; }).join("");
    const hands = opts.live ? "" : `<path d="M22,37 L22,31 M22,37 L26.4,39.2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    const cone = (x, y) => `<path d="M${x},${y - 5} C${x + 3.6},${y - 4} ${x + 3.8},${y + 3} ${x},${y + 5} C${x - 3.8},${y + 3} ${x - 3.6},${y - 4} ${x},${y - 5} Z" fill="#8B5A33" ${FSX(1.2)}/><path d="M${x - 2.4},${y - 2} L${x + 2.4},${y + 1} M${x + 2.4},${y - 2} L${x - 2.4},${y + 1} M${x - 2.6},${y + 1.6} L${x + 2},${y + 3.6}" stroke="#C98A52" stroke-width="0.8"/>`;
    return `<path d="M22,1 C18,-4 11,-3 9,2 C13,1 17,3 18,6 Z M22,1 C26,-4 33,-3 35,2 C31,1 27,3 26,6 Z" fill="#8FAE6E" ${FSX(1.2)}/><circle cx="22" cy="2.5" r="2.4" fill="#F2A7B8" ${FSX(1)}/>` +
      `<path d="M-1,21 L22,4 L45,21 L41.5,23.5 L22,9 L2.5,23.5 Z" fill="#7A5236" ${FSX(1.8)}/><path d="M2.5,23.5 L22,9 L41.5,23.5 Z" fill="#A87450" ${FSX(1.2)}/>` +
      `<rect x="6" y="19" width="32" height="30" rx="3" fill="#C98A52" ${FSX(2)}/><path d="M9,46 H35" stroke="#A87450" stroke-width="1.4"/>` +
      `<path d="M17.5,27 V22.4 Q22,17.6 26.5,22.4 V27 Z" fill="#5E3E2A" ${FSX(1.3)}/><path d="M22,19.6 V27" stroke="#8B5A33" stroke-width="0.9"/>` +
      `<circle cx="22" cy="37" r="9.6" fill="#FFF8E7" ${FSX(1.8)}/>${ticks}${hands}<circle cx="22" cy="37" r="1.2" fill="${INK}"/>` +
      (opts.live ? "" : `<path d="M22,49 V56" stroke="#B38F3F" stroke-width="1.5"/><path d="M22,54.6 C18.4,56.4 18.6,61.2 22,62.2 C25.4,61.2 25.6,56.4 22,54.6 Z" fill="#8FAE6E" ${FSX(1.2)}/>`) +
      `<path d="M13,49 V53.5 M31,49 V51" stroke="#8C7A5A" stroke-width="1.1" stroke-dasharray="1.3 1"/>${cone(13, 58.5)}${cone(31, 56)}`;
  };
  FURN_ART.window = () => `<rect x="2" y="2" width="72" height="56" rx="5" fill="#FFFFFF" ${FS()}/>
    <rect x="8" y="8" width="60" height="44" rx="3" fill="#A8DBFF" class="sky" ${FS(1.6)}/>
    <path d="M14,44 L26,14 M22,48 L32,24" stroke="#FFFFFF" stroke-width="3" stroke-opacity=".35" stroke-linecap="round"/><path d="M46,44 L56,20" stroke="#FFFFFF" stroke-width="2" stroke-opacity=".3" stroke-linecap="round"/>
    <path d="M38,8 L38,52 M8,30 L68,30" stroke="#FFFFFF" stroke-width="4"/><path d="M38,8 L38,52 M8,30 L68,30" ${FS(1.4)}/>
    <path d="M1,4 C11,12 15,26 12,34 C10,44 12,52 16,60 L1,60 Z" fill="#F8A5C2" ${FS(1.8)}/><path d="M5,8 C8,18 8,30 6,40 M9,36 C9,46 11,52 13,58" fill="none" stroke="#EE8FB0" stroke-width="1.3"/>
    <path d="M75,4 C65,12 61,26 64,34 C66,44 64,52 60,60 L75,60 Z" fill="#F8A5C2" ${FS(1.8)}/><path d="M71,8 C68,18 68,30 70,40 M67,36 C67,46 65,52 63,58" fill="none" stroke="#EE8FB0" stroke-width="1.3"/>
    <path d="M5,33 Q10,31 14,34 Q10,37 5,35 Z M71,33 Q66,31 62,34 Q66,37 71,35 Z" fill="#F7D56A" ${FS(1.1)}/>
    <path d="M-1,1 H77 V9 ${Array.from({ length: 8 }, (_, i) => `Q${f2(72.2 - i * 9.75)},14 ${f2(67.4 - i * 9.75)},9`).join(" ")} H-1 Z" fill="#F4B6CB" ${FS(1.5)}/>
    <rect x="-1" y="58" width="78" height="6" rx="2" fill="#D9A066" ${FS()}/>
    <path d="M6,64 H70 L67,74 H9 Z" fill="#B97A45" ${FS(1.6)}/><path d="M10,68 H66" stroke="#D9A066" stroke-width="1.2"/>
    <path d="M18,64 Q17,58 18,55 M38,64 V54 M58,64 Q59,58 58,55" fill="none" stroke="#6F9A5E" stroke-width="1.4"/>
    <path d="M22,62 Q26,57 29,61 M47,62 Q51,58 54,62" fill="#8DB87A" ${FS(0.9)}/>
    ${flowerSvg(18, 54, 4, "#F2A7B8", "#F7D56A", 1)}${flowerSvg(38, 52, 4.4, "#FFFFFF", "#F7D56A", 1)}${flowerSvg(58, 54, 4, "#C9B6E0", "#F7D56A", 1)}`;
  FURN_ART.poster = () => {
    // 3にん（わんこ・がちゃん・ごじ）を 本物の キャラの 絵で かざる
    const hero = (id, x, y, sz, pose) => Chara.svg(id, { pose, face: "happy", dir: "down" }).replace("<svg ", `<svg x="${x}" y="${y}" width="${sz}" height="${f2((sz * Chara.VB.h) / Chara.VB.w)}" `);
    const rays = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<path d="M25,27 L${f2(25 + Math.cos(a) * 30)},${f2(27 + Math.sin(a) * 30)} L${f2(25 + Math.cos(a + 0.28) * 30)},${f2(27 + Math.sin(a + 0.28) * 30)} Z" fill="#FFFFFF" fill-opacity=".45"/>`; }).join("");
    return `<rect x="2" y="2" width="46" height="62" rx="2" fill="#FFF7E6" ${FS()}/>
      <svg x="5" y="5" width="40" height="42" viewBox="5 5 40 42"><rect x="5" y="5" width="40" height="42" fill="#CFE8F2"/>${rays}<path d="M5,40 Q25,33 45,40 V47 H5 Z" fill="#B7DDA3"/></svg>
      <rect x="5" y="5" width="40" height="42" fill="none" stroke="#E9D9B8" stroke-width="1"/>
      ${hero("wanko", -1, 14.5, 24, "idle_01")}${hero("goji", 27, 14.5, 24, "idle_01")}${hero("gachan", 12.5, 9.5, 25, "jump_01")}
      <path d="M4,50 H46 L43,54 L46,58 H4 L7,54 Z" fill="#F2A7B8" ${FS(1.3)}/>
      <path d="${starPath(14, 54, 2.4, 1)}" fill="#FFF3C4"/><path d="${starPath(25, 54, 2.8, 1.2)}" fill="#FFF3C4"/><path d="${starPath(36, 54, 2.4, 1)}" fill="#FFF3C4"/>
      <path d="M40,64 L48,56 L48,64 Z" fill="#EFE3C8" ${FS(1)}/>
      <circle cx="25" cy="4" r="2.6" fill="#E35D5B" ${FS(1.3)}/>`;
  };
})();
