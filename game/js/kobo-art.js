// パズルの おてつだい「パズル こうぼう」（js/mg-kobo.js・UI-65）の 絵と データ。
// ・かたち 13しゅ（かたち はめ）: -1〜1 の 点の ならび・まわして ちがって みえる かず（rots）・いろ。canvas に パスで 描く（キャッシュ なし）
// ・スライドパズルの え 3まい（なかよし 3にん・くだものの かご・うみの なかま。300×300 の SVG・キーは「kobo:pic:え」と 大きさ だけ）
// ・おえかき ロジックの もんだい 24（5×5 が 15・6×6 が 9。ぜんぶ ならびの ヒントだけで とける〔tools/check-kobo.mjs〕）
const KoboArt = (() => {
  const K = INK, TAU = Math.PI * 2;
  const sk = (w = 3) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const poly = (n, r, a0 = -Math.PI / 2, ry = r) => Array.from({ length: n }, (_, i) => { const a = a0 + (i / n) * TAU; return [Math.cos(a) * r, Math.sin(a) * ry]; });
  const starPts = (n, R, r) => Array.from({ length: n * 2 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / n, q = i % 2 ? r : R; return [Math.cos(a) * q, Math.sin(a) * q]; });
  const heart = Array.from({ length: 40 }, (_, i) => { const t = (i / 40) * TAU; return [(16 * Math.sin(t) ** 3) / 17.5, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17.5 - 0.08]; });
  const semi = [...Array.from({ length: 21 }, (_, i) => { const a = Math.PI + (i / 20) * Math.PI; return [Math.cos(a) * 0.92, Math.sin(a) * 0.92 + 0.36]; })];
  const drop = Array.from({ length: 36 }, (_, i) => { const t = (i / 36) * TAU; return [Math.sin(t) * 0.66 * (1 - Math.cos(t)) * 0.62, -Math.cos(t) * 0.92]; });
  // [なまえ, 点, rots（90°ずつ まわして ちがう むきの かず）, いろ]
  const SHAPES = {
    circle: ["まる", poly(32, 0.9), 1, "#EF5350"],
    square: ["しかく", [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], 1, "#42A5F5"],
    triangle: ["さんかく", [[0, -0.9], [0.92, 0.76], [-0.92, 0.76]], 4, "#66BB6A"],
    star: ["ほし", starPts(5, 0.96, 0.42), 4, "#FFCA28"],
    heart: ["ハート", heart, 4, "#F06292"],
    diamond: ["ひしがた", [[0, -0.95], [0.66, 0], [0, 0.95], [-0.66, 0]], 2, "#AB47BC"],
    cross: ["じゅうじ", [[-0.3, -0.9], [0.3, -0.9], [0.3, -0.3], [0.9, -0.3], [0.9, 0.3], [0.3, 0.3], [0.3, 0.9], [-0.3, 0.9], [-0.3, 0.3], [-0.9, 0.3], [-0.9, -0.3], [-0.3, -0.3]], 1, "#FF7043"],
    house: ["おうち", [[0, -0.92], [0.86, -0.12], [0.86, 0.86], [-0.86, 0.86], [-0.86, -0.12]], 4, "#8D6E63"],
    semi: ["はんえん", semi, 4, "#26C6DA"],
    hexagon: ["ろっかく", poly(6, 0.92, 0), 2, "#9CCC65"],
    rtri: ["ちょっかく さんかく", [[-0.82, -0.86], [0.86, 0.82], [-0.82, 0.82]], 4, "#5C6BC0"],
    arrow: ["やじるし", [[-0.92, -0.3], [0.16, -0.3], [0.16, -0.82], [0.94, 0], [0.16, 0.82], [0.16, 0.3], [-0.92, 0.3]], 4, "#FFA726"],
    drop: ["しずく", drop, 4, "#29B6F6"],
  };
  // まわした 点（q: 90° の かず。y は した むき）
  const turn = (pts, q) => pts.map(([x, y]) => { let a = x, b = y; for (let i = 0; i < ((q % 4) + 4) % 4; i++) [a, b] = [-b, a]; return [a, b]; });
  const path = (ctx, kind, q, x, y, s) => { const pts = turn(SHAPES[kind][1], q); ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(x + a * s, y + b * s) : ctx.moveTo(x + a * s, y + b * s))); ctx.closePath(); };
  // ピース（いろ・ふち・つや）と あな（くらい かげ・てんせん）
  const drawPiece = (ctx, kind, q, x, y, s, { alpha = 1, lift = 0 } = {}) => {
    ctx.save(); ctx.globalAlpha *= alpha;
    if (lift) { ctx.fillStyle = "rgba(62,49,32,0.18)"; path(ctx, kind, q, x + lift * 0.4, y + lift, s); ctx.fill(); }
    path(ctx, kind, q, x, y, s); ctx.fillStyle = SHAPES[kind][3]; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = Math.max(2, s * 0.08); ctx.lineJoin = "round"; ctx.stroke();
    ctx.globalAlpha *= 0.35; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(x - s * 0.28, y - s * 0.3, s * 0.18, s * 0.09, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  };
  const drawHole = (ctx, kind, q, x, y, s, hint = false) => {
    ctx.save(); path(ctx, kind, q, x, y, s); ctx.fillStyle = "#6D5D4B"; ctx.fill();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = hint ? "#FFD54F" : "#F3E3C6"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  };
  // ---- スライドパズルの え（300×300）----
  const HERO_VB = { wanko: "0 -8 200 222", gachan: "30 12 140 202", goji: "-6 -6 212 222" };
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
  const hero = (who, face, x, y, w, h) => nest(Chara.svg(who, { pose: "idle_01", face, dir: "down", outfit: {}, color: "soft" }), x, y, w, h, HERO_VB[who]);
  const icon = (inner, x, y, s) => `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 64 64">${inner}</svg>`;
  const PICTURES = {
    friends: ["なかよし 3にん", () => `<rect width="300" height="300" fill="#CFEAF8"/><circle cx="246" cy="58" r="28" fill="#FFE48A" ${sk(3)}/>`
      + `<path d="M0,196 C60,160 120,170 170,190 C220,170 270,166 300,184 V300 H0 Z" fill="#A9D88A" ${sk(3)}/><path d="M0,236 C80,214 200,220 300,232 V300 H0 Z" fill="#8CCB6B"/>`
      + [[40, 70, 1], [120, 52, 0.8], [196, 92, 0.9]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><circle cx="0" cy="0" r="14" fill="#FFFFFF"/><circle cx="16" cy="-4" r="17" fill="#FFFFFF"/><circle cx="34" cy="2" r="12" fill="#FFFFFF"/></g>`).join("")
      + hero("gachan", "happy", 112, 130, 82, 124) + hero("wanko", "happy", 22, 138, 98, 132) + hero("goji", "happy", 186, 136, 100, 134)
      + [[60, 282], [150, 288], [240, 280]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#FFF59D" ${sk(1.6)}/>`).join("")],
    fruits: ["くだものの かご", () => `<rect width="300" height="300" fill="#FFF3E0"/><rect y="200" width="300" height="100" fill="#E0B07A"/><path d="M0,200 H300" ${sk(3)}/>`
      + `<path d="M0,150 H300 M0,100 H300" stroke="#F6DDBA" stroke-width="10"/>`
      // まど（そらと くも・カーテン）・かべの とけい・うえの かざり
      + `<rect x="22" y="22" width="86" height="70" rx="6" fill="#BFE3F7" ${sk(3)}/><circle cx="48" cy="44" r="9" fill="#FFFFFF"/><circle cx="60" cy="40" r="11" fill="#FFFFFF"/><circle cx="72" cy="45" r="8" fill="#FFFFFF"/><path d="M65,22 V92 M22,57 H108" stroke="#FFFFFF" stroke-width="3"/><path d="M14,18 Q30,56 20,96 H34 Q42,56 30,18 Z M116,18 Q100,56 110,96 H96 Q88,56 100,18 Z" fill="#F48FB1" ${sk(2)}/>`
      + `<circle cx="238" cy="58" r="30" fill="#FFFFFF" ${sk(3)}/><path d="M238,58 V38 M238,58 L252,66" ${sk(3)}/><circle cx="238" cy="58" r="3" fill="${K}"/>`
      + `<path d="M140,12 Q175,34 210,12" fill="none" ${sk(2)}/>` + [[150, "#EF5350"], [166, "#FFCA28"], [182, "#66BB6A"], [198, "#42A5F5"]].map(([x, c], i) => `<path d="M${x - 6},${15 + (i === 1 || i === 2 ? 6 : 2)} h12 l-6,12 Z" fill="${c}" ${sk(1.6)}/>`).join("")
      + `<path d="M46,170 H254 L232,268 H68 Z" fill="#C98A52" ${sk(3.4)}/><path d="M58,196 H242 M64,222 H236 M70,248 H230" stroke="#A86F3E" stroke-width="3"/><path d="M90,170 C90,96 210,96 210,170" fill="none" stroke="#A86F3E" stroke-width="9" stroke-linecap="round"/><path d="M90,170 C90,96 210,96 210,170" fill="none" ${sk(2)}/>`
      + icon(BrainArt.fruit("banana"), 112, 148, 92) + icon(BrainArt.fruit("apple"), 182, 150, 78) + icon(BrainArt.fruit("mikan"), 82, 164, 64) + icon(BrainArt.fruit("strawberry"), 216, 166, 56) + icon(BrainArt.fruit("mikan"), 150, 168, 58)
      + icon(BrainArt.piece("cup", 0), 40, 252, 52) + icon(BrainArt.piece("flower", 0), 264, 250, 56)],
    sea: ["うみの なかま", () => `<rect width="300" height="300" fill="#7CC8EE"/><rect width="300" height="90" fill="#A6DCF5"/><path d="M0,90 C40,80 60,100 100,90 C140,80 160,100 200,90 C240,80 260,100 300,90" fill="none" stroke="#FFFFFF" stroke-width="5"/>`
      // くも と ヨット（そらの ところ）
      + `<g fill="#FFFFFF"><circle cx="34" cy="34" r="12"/><circle cx="50" cy="28" r="15"/><circle cx="66" cy="36" r="10"/></g><path d="M126,84 H184 L176,94 H134 Z" fill="#E57373" ${sk(2.4)}/><path d="M154,82 V30 L182,78 Z" fill="#FFFFFF" ${sk(2.4)}/><path d="M150,80 V44 L130,78 Z" fill="#FFE48A" ${sk(2.4)}/>`
      + `<path d="M0,250 C80,232 180,240 300,236 V300 H0 Z" fill="#F7E2B0" ${sk(3)}/>`
      + [[60, 140], [230, 120], [150, 60], [96, 220]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${6 + (i % 2) * 4}" fill="#FFFFFF" fill-opacity="0.7" ${sk(1.6)}/>`).join("")
      + icon(BrainArt.piece("fish", 0), 92, 120, 96) + icon(BrainArt.piece("fish", 1), 210, 190, 86) + icon(BrainArt.piece("star", 0), 62, 262, 58) + icon(BrainArt.piece("mushroom", 1), 246, 256, 50)
      + `<path d="M150,250 C140,214 166,206 160,176 M166,250 C178,222 150,214 166,186" fill="none" stroke="#4CAF50" stroke-width="7" stroke-linecap="round"/>`
      + icon(BrainArt.piece("bird", 0), 238, 46, 52)],
  };
  const picSvg = (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${PICTURES[id][1]()}</svg>`;
  const picture = (id, px) => SvgCache.get("kobo:pic:" + id, () => picSvg(id), px, px);
  // ---- おえかき ロジック（# が ぬる ます）----
  // [なまえ, いろ, ます]
  const LOGIC = {
    easy: [
      ["ハート", "#EF5350", [".#.#.", "#####", "#####", ".###.", "..#.."]],
      ["おうち", "#E8A15C", ["..#..", ".###.", "#####", "#.#.#", "#.#.#"]],
      ["き", "#66BB6A", ["..#..", ".###.", "#####", "..#..", "..#.."]],
      ["じゅうじ", "#64B5F6", ["..#..", "..#..", "#####", "..#..", "..#.."]],
      ["きのこ", "#EF5350", [".###.", "#####", "#.#.#", "..#..", ".###."]],
      ["りんご", "#E53935", ["...#.", ".###.", "#####", "#####", ".###."]],
      ["ほし", "#FFC107", ["..#..", ".###.", "#####", ".###.", "#.#.#"]],
      ["かさ", "#7E57C2", [".###.", "#####", "..#..", "..#..", ".##.."]],
    ],
    normal: [
      ["さかな", "#FFA726", [".##.#", "####.", "#.##.", "####.", ".##.#"]],
      ["にこにこ", "#FFD54F", [".###.", "#####", "#.#.#", "#####", ".###."]],
      ["ねこ", "#8D6E63", ["#...#", "##.##", "#####", "#.#.#", "#####"]],
      ["つき", "#FFCA28", [".###.", "##...", "#....", "##...", ".###."]],
      ["おんぷ", "#5C6BC0", ["..###", "..#.#", "..#..", "###..", "###.."]],
      ["あひる", "#FDD835", [".##..", "###..", ".####", "#####", ".###."]],
      ["かぎ", "#FFB300", [".##..", "#..#.", ".##..", "..#..", "..##."]],
    ],
    big: [
      ["ロボット", "#90A4AE", [".####.", "#.##.#", "######", ".#..#.", ".####.", ".#..#."]],
      ["にゃんこ", "#FF8A65", ["#....#", "##..##", "######", "#.##.#", "######", ".####."]],
      ["くるま", "#42A5F5", ["..###.", ".#####", "######", "######", ".#..#.", ".#..#."]],
      ["おばけ", "#B0BEC5", [".####.", "######", "#.##.#", "######", "######", "#.#.#."]],
      ["はな", "#F48FB1", [".#..#.", "######", ".####.", "######", ".#..#.", "..##.."]],
      ["おしろ", "#A1887F", ["#.##.#", "######", ".####.", ".#..#.", ".####.", ".####."]],
      ["チューリップ", "#EC407A", ["#.##.#", "######", ".####.", "..##..", "#.##.#", ".####."]],
      ["ふね", "#4FC3F7", ["..#...", "..##..", "..###.", "..#...", "######", ".####."]],
      ["ロケット", "#EF5350", ["..##..", ".####.", ".####.", ".####.", "######", "#.##.#"]],
    ],
  };
  // ならびの ヒント（つづいて ぬる かず。なければ [0]）
  const runs = (cells) => { const r = []; let k = 0; for (const c of cells) { if (c) k++; else if (k) { r.push(k); k = 0; } } if (k) r.push(k); return r.length ? r : [0]; };
  const clues = (rows) => { const g = rows.map((r) => [...r].map((c) => c === "#")); return { rows: g.map(runs), cols: g[0].map((_, x) => runs(g.map((r) => r[x]))), grid: g }; };
  return { SHAPES, KINDS: Object.keys(SHAPES), turn, path, drawPiece, drawHole, PICTURES, PIC_IDS: Object.keys(PICTURES), picSvg, picture, LOGIC, clues, runs,
    shapeName: (k) => SHAPES[k][0], rots: (k) => SHAPES[k][2] };
})();
