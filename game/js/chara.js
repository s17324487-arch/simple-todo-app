// キャラクターSVGの合成（ポーズ・向き・表情・着せ替え）とラスタライズキャッシュ
// 座標はすべて素材SVGのユーザー座標（viewBox -10 0 220 220、足元 ≒ (100,210)）。

const INK = "#1F1D1B";
// 帽子や表情の「！」が上にはみ出るので上方向に40拡張したビューボックスを使う
const VB = { x: -10, y: -40, w: 220, h: 260 };
const FOOT = { x: 100, y: 210 };

const PROFILE = {
  wanko: {
    name: "わんこ",
    torsoIdx: 3, headIdx: 7, tailIdx: 0, armIdx: [1, 2],
    torsoPath: "M77,128 C71,146 70,170 74,186 C80,197 120,197 126,186 C130,170 129,146 123,128 Z",
    arms: [
      { cx: 71, cy: 154, rx: 8, ry: 13, rot: 28 },
      { cx: 129, cy: 154, rx: 8, ry: 13, rot: -28 },
    ],
    fill: "#FFFFFF",
    a: {
      hat: { x: 100, y: 44, w: 92 },
      eyes: { x: 100, y: 86, gap: 36 },
      cheek: { y: 101, gap: 58 },
      mouth: { x: 100, y: 106 },
      neck: { x: 100, y: 134, w: 56 },
      torso: { top: 128, bottom: 197, cx: 100, w: 58 },
      back: { x: 100, y: 146, w: 60 },
    },
    faceShift: 12,
  },
  gachan: {
    name: "がちゃん",
    torsoIdx: 2, headIdx: 3, tailIdx: -1, armIdx: [0, 1],
    torsoPath: "M76,142 C67,158 69,182 82,191 C92,197 108,197 118,191 C131,182 133,158 124,142 Z",
    arms: [
      { cx: 68, cy: 166, rx: 7, ry: 11, rot: 40 },
      { cx: 132, cy: 166, rx: 7, ry: 11, rot: -40 },
    ],
    fill: "#FADA78",
    a: {
      hat: { x: 100, y: 62, w: 90 },
      eyes: { x: 100, y: 105, gap: 40 },
      cheek: { y: 119, gap: 66 },
      mouth: { x: 100, y: 128 },
      neck: { x: 100, y: 150, w: 58 },
      torso: { top: 142, bottom: 197, cx: 100, w: 62 },
      back: { x: 100, y: 160, w: 62 },
    },
    faceShift: 12,
  },
  goji: {
    name: "ごじ",
    torsoIdx: 15, headIdx: 15, tailIdx: 0, armIdx: [5, 10],
    torsoPath: "M40,200 C33,150 33,96 50,62 C64,36 86,28 102,28 C120,28 142,38 154,64 C170,98 169,152 162,200 C132,207 70,207 40,200 Z",
    arms: [
      { path: "M52,100 C38,99 22,98 16,103 C7,108 7,128 16,133 C22,138 38,137 52,136 Z", clipX: [26, 52] },
      { path: "M148,100 C162,99 178,98 184,103 C193,108 193,128 184,133 C178,138 162,137 148,136 Z", clipX: [148, 174] },
    ],
    fill: "#8C8686",
    a: {
      hat: { x: 102, y: 44, w: 82 },
      eyes: { x: 102, y: 48, gap: 42 },
      cheek: { y: 82, gap: 88 },
      mouth: { x: 102, y: 95 },
      neck: { x: 102, y: 102, w: 116 },
      torso: { top: 99, bottom: 207, cx: 102, w: 128 },
      back: { x: 102, y: 112, w: 80 },
    },
    faceShift: 14,
  },
};
const GOJI_COLORS = { soft: "#8C8686", dark: "#4A4A4C" };
const CHARA_IDS = ["wanko", "gachan", "goji"];

// 感情 → 各キャラの表情ファイル（キャラごとに持っている表情が違う）
const EMO = {
  normal: { wanko: "normal", gachan: "normal", goji: "normal" },
  happy: { wanko: "smile", gachan: "smile", goji: "love" },
  love: { wanko: "smile", gachan: "sparkle", goji: "love" },
  excited: { wanko: "smile", gachan: "sparkle", goji: "shout" },
  sad: { wanko: "cry", gachan: "cry", goji: "cry" },
  angry: { wanko: "angry", gachan: "angry", goji: "shout" },
  surprise: { wanko: "surprise", gachan: "sparkle", goji: "surprise" },
  sleep: { wanko: "sleep", gachan: "sleep", goji: "calm" },
  calm: { wanko: "smile", gachan: "smile", goji: "calm" },
};
// まばたき（キャラ素材に ない 表情を くみあわせる・ころころ フルーツの 3人 など）: ねむりの 目と ふつうの はな・くち・くちばし。
// ごじの 目は あたまの うえで ちいさく かくれて いるので、ごじは ふつうの まま
const CHARA_BLINK = { wanko: (F) => [F.sleep[0], F.sleep[1], F.normal[2], F.normal[3]], gachan: (F) => [F.sleep[0], F.sleep[1], F.normal[2], F.normal[3]] };
function charaFaceParts(id, name) { const F = CHARA_DATA[id].faces; return name === "blink" && CHARA_BLINK[id] ? CHARA_BLINK[id](F) : F[name] || F.normal; }
function faceOf(id, emo) {
  if (!emo) return "normal";
  if (emo === "blink") return CHARA_BLINK[id] ? "blink" : "normal";
  if (EMO[emo]) return EMO[emo][id];
  return CHARA_DATA[id].faces[emo] ? emo : "normal";
}

// ---- 小さなSVGヘルパー ----
const f2 = (n) => (Math.round(n * 100) / 100).toString();
function stroke(w = 4.5) {
  return `stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
}
function shade(hex, amt) {
  // amt>0 で明るく、<0 で暗く
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function heartPath(cx, cy, s) {
  return `M${f2(cx)},${f2(cy + 6 * s)} C${f2(cx - 7 * s)},${f2(cy + 1 * s)} ${f2(cx - 6 * s)},${f2(cy - 6 * s)} ${f2(cx)},${f2(cy - 3 * s)} C${f2(cx + 6 * s)},${f2(cy - 6 * s)} ${f2(cx + 7 * s)},${f2(cy + 1 * s)} ${f2(cx)},${f2(cy + 6 * s)} Z`;
}
function starPath(cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i * Math.PI) / n;
    d += (i ? "L" : "M") + f2(cx + Math.cos(a) * r) + "," + f2(cy + Math.sin(a) * r);
  }
  return d + "Z";
}
function flowerSvg(cx, cy, r, petal, center, sw) {
  let s = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${f2(cx + Math.cos(a) * r)}" cy="${f2(cy + Math.sin(a) * r)}" r="${f2(r * 0.78)}" fill="${petal}" ${stroke(sw)}/>`;
  }
  return s + `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r * 0.62)}" fill="${center}" ${stroke(sw)}/>`;
}

// ---- 着せ替えアイテムの描画 ----
// 各描画関数は { behind, sleeve, torso, top } の一部を返す。
// ctx: { p: PROFILE, a: anchors, view: 'front'|'back'|'side', col: [..], dx: 顔のずらし量 }
const WEAR = {};

// あたま: ローカル座標は つば中心(0,0)・頭の幅100。k = w/100
function hatWrap(ctx, inner) {
  const h = ctx.a.hat;
  const k = h.w / 100;
  const dx = ctx.view === "side" ? ctx.dx * 0.35 : 0;
  return `<g transform="translate(${f2(h.x + dx)},${h.y}) scale(${f2(k)})">${inner(4.5 / k, 3 / k)}</g>`;
}
WEAR.ribbon = (ctx) => ({
  top: hatWrap(ctx, (s, s2) => {
    const c = ctx.col[0], d = shade(c, -0.18);
    return `<g transform="translate(34,-6) rotate(18)">
      <path d="M0,0 C-10,-18 -30,-16 -28,0 C-30,16 -10,18 0,0 Z" fill="${c}" ${stroke(s)}/>
      <path d="M0,0 C10,-18 30,-16 28,0 C30,16 10,18 0,0 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-4,4 L-12,22 M4,4 L12,22" fill="none" ${stroke(s)}/>
      <circle cx="0" cy="0" r="7" fill="${d}" ${stroke(s)}/></g>`;
  }),
});
WEAR.strawhat = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#F2D48A", band = ctx.col[1] || "#E35D5B";
    return `<ellipse cx="0" cy="0" rx="72" ry="14" fill="${c}" ${stroke(s)}/>
      <path d="M-38,0 C-38,-44 38,-44 38,0 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-38,-4 C-38,-16 38,-16 38,-4 L38,4 C20,8 -20,8 -38,4 Z" fill="${band}" ${stroke(s)}/>
      <path d="M-58,4 C-40,9 40,9 58,4" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${f2(s * 0.6)}" stroke-linecap="round"/>`;
  }),
});
WEAR.beret = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0];
    return `<g transform="rotate(-10)"><path d="M-52,2 C-60,-30 40,-44 58,-10 C62,0 40,8 0,6 C-30,6 -48,6 -52,2 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-2,-33 L0,-44" fill="none" ${stroke(s)}/>
      <path d="M-40,2 C-10,8 30,6 50,-2" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${f2(s * 0.7)}" stroke-linecap="round"/></g>`;
  }),
});
WEAR.crown = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#F7C948";
    return `<path d="M-32,0 L-36,-40 L-18,-20 L0,-46 L18,-20 L36,-40 L32,0 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-33,-8 L33,-8" fill="none" ${stroke(s * 0.7)}/>
      <circle cx="0" cy="-20" r="6" fill="#E8262A" ${stroke(s * 0.7)}/>
      <circle cx="-36" cy="-42" r="4.5" fill="#FFFFFF" ${stroke(s * 0.7)}/><circle cx="36" cy="-42" r="4.5" fill="#FFFFFF" ${stroke(s * 0.7)}/><circle cx="0" cy="-48" r="4.5" fill="#FFFFFF" ${stroke(s * 0.7)}/>
      <circle cx="-20" cy="-3" r="3.5" fill="#4FA3E0"/><circle cx="20" cy="-3" r="3.5" fill="#4FA3E0"/>`;
  }),
});
WEAR.knit = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0], b = ctx.col[1] || "#FFFFFF";
    return `<path d="M-50,2 C-54,-50 54,-50 50,2 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-26,-30 L-26,-2 M-8,-38 L-8,-2 M10,-38 L10,-2 M28,-30 L28,-2" fill="none" stroke="${shade(c, -0.2)}" stroke-width="${f2(s * 0.6)}" stroke-linecap="round"/>
      <rect x="-54" y="-10" width="108" height="18" rx="9" fill="${b}" ${stroke(s)}/>
      <circle cx="0" cy="-44" r="12" fill="${b}" ${stroke(s)}/>`;
  }),
});
WEAR.flowercrown = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const cols = ["#F48FB1", "#FFFFFF", "#FFD54F", "#F48FB1", "#FFFFFF"];
    let out = `<path d="M-50,0 C-30,-16 30,-16 50,0" fill="none" stroke="#6DBE5B" stroke-width="${f2(s * 1.4)}" stroke-linecap="round"/>`;
    [-44, -22, 0, 22, 44].forEach((x, i) => {
      const y = -Math.cos((x / 50) * 1.1) * 12 + 4;
      out += `<path d="M${x - 9},${f2(y + 3)} C${x - 4},${f2(y + 10)} ${x + 4},${f2(y + 10)} ${x + 9},${f2(y + 3)}" fill="#6DBE5B" ${stroke(s * 0.6)}/>`;
      out += flowerSvg(x, y - 4, 6, cols[i], "#FFB74D", s * 0.6);
    });
    return out;
  }),
});
WEAR.tophat = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#3A3A48", band = ctx.col[1] || "#E35D5B";
    return `<ellipse cx="0" cy="0" rx="48" ry="9" fill="${c}" ${stroke(s)}/>
      <path d="M-30,0 L-28,-58 C-10,-64 10,-64 28,-58 L30,0 C12,5 -12,5 -30,0 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-29,-14 C-10,-10 10,-10 29,-14 L29,-4 C10,0 -10,0 -29,-4 Z" fill="${band}" ${stroke(s * 0.8)}/>
      <path d="M-18,-52 L-18,-24" stroke="${shade(c, 0.3)}" stroke-width="${f2(s * 1.2)}" stroke-linecap="round"/>`;
  }),
});
WEAR.helmet = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#FFD54F";
    return `<path d="M-50,4 C-54,-54 54,-54 50,4 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-58,4 C-30,12 30,12 58,4 L56,-2 C30,4 -30,4 -56,-2 Z" fill="${shade(c, -0.12)}" ${stroke(s)}/>
      <path d="M-4,-44 L-4,-4 M4,-44 L4,-4" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${f2(s * 0.8)}"/>
      <path d="${starPath(-24, -18, 9, 4)}" fill="#FFFFFF" ${stroke(s * 0.6)}/>`;
  }),
});
WEAR.catears = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#3A3A48", inner = ctx.col[1] || "#F8A5C2";
    return `<path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${INK}" stroke-width="${f2(s * 2.6)}" stroke-linecap="round"/>
      <path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${c}" stroke-width="${f2(s * 1.2)}" stroke-linecap="round"/>
      <path d="M-40,-8 L-40,-44 L-14,-20 Z" fill="${c}" ${stroke(s)}/><path d="M-35,-16 L-35,-34 L-22,-21 Z" fill="${inner}"/>
      <path d="M40,-8 L40,-44 L14,-20 Z" fill="${c}" ${stroke(s)}/><path d="M35,-16 L35,-34 L22,-21 Z" fill="${inner}"/>`;
  }),
});
WEAR.chefhat = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    return `<path d="M-34,0 L-34,-26 C-54,-30 -52,-62 -30,-56 C-26,-78 2,-80 8,-62 C20,-80 50,-68 38,-48 C54,-40 44,-22 34,-26 L34,0 Z" fill="#FFFFFF" ${stroke(s)}/>
      <path d="M-34,-12 L34,-12" fill="none" ${stroke(s * 0.7)}/>
      <path d="M-12,-26 C-12,-36 -8,-44 -4,-48 M14,-26 C14,-34 18,-40 22,-44" fill="none" stroke="#D9D4CC" stroke-width="${f2(s * 0.8)}" stroke-linecap="round"/>`;
  }),
});
WEAR.partyhat = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0], c2 = ctx.col[1] || "#FFFFFF";
    return `<g transform="rotate(8)"><path d="M-26,2 L0,-66 L26,2 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-18,-20 L10,-6 M-10,-40 L16,-26" fill="none" stroke="${c2}" stroke-width="${f2(s * 1.6)}" stroke-linecap="round"/>
      <circle cx="0" cy="-68" r="9" fill="${c2}" ${stroke(s)}/></g>`;
  }),
});
WEAR.hachimaki = (ctx) => ({
  top: hatWrap(ctx, (s) => {
    const c = ctx.col[0] || "#FFFFFF", m = ctx.col[1] || "#E8262A";
    return `<path d="M-50,-2 C-20,6 20,6 50,-2 L50,12 C20,20 -20,20 -50,12 Z" fill="${c}" ${stroke(s)}/>
      <circle cx="0" cy="9" r="6" fill="${m}"/>
      <path d="M48,4 C62,-6 70,0 74,-10 M50,10 C64,10 70,18 78,12" fill="none" stroke="${INK}" stroke-width="${f2(s * 2.2)}" stroke-linecap="round"/>
      <path d="M48,4 C62,-6 70,0 74,-10 M50,10 C64,10 70,18 78,12" fill="none" stroke="${c}" stroke-width="${f2(s * 1)}" stroke-linecap="round"/>`;
  }),
});

// かお: ローカル座標は 両目の中心(0,0)、目の間隔40（目は±20）
function eyeWrap(ctx, inner) {
  if (ctx.view === "back") return "";
  const e = ctx.a.eyes;
  const k = e.gap / 40;
  const dx = ctx.view === "side" ? ctx.dx : 0;
  return `<g transform="translate(${f2(e.x + dx)},${e.y}) scale(${f2(k)})">${inner(4.2 / k, 3 / k)}</g>`;
}
WEAR.glasses = (ctx) => ({
  top: eyeWrap(ctx, (s) => {
    const c = ctx.col[0] || INK;
    return `<circle cx="-21" cy="0" r="14" fill="#FFFFFF" fill-opacity="0.35" stroke="${c}" stroke-width="${f2(s)}"/>
      <circle cx="21" cy="0" r="14" fill="#FFFFFF" fill-opacity="0.35" stroke="${c}" stroke-width="${f2(s)}"/>
      <path d="M-7,-2 C-3,-6 3,-6 7,-2" fill="none" stroke="${c}" stroke-width="${f2(s)}" stroke-linecap="round"/>`;
  }),
});
WEAR.sunglasses = (ctx) => ({
  top: eyeWrap(ctx, (s) => {
    return `<path d="M-38,-10 L-4,-10 C-4,6 -10,14 -21,14 C-32,14 -38,6 -38,-10 Z" fill="#2B2B33" ${stroke(s)}/>
      <path d="M38,-10 L4,-10 C4,6 10,14 21,14 C32,14 38,6 38,-10 Z" fill="#2B2B33" ${stroke(s)}/>
      <path d="M-4,-8 L4,-8" fill="none" ${stroke(s)}/>
      <path d="M-30,-5 L-24,-5 M12,-5 L18,-5" stroke="#FFFFFF" stroke-width="${f2(s * 0.8)}" stroke-linecap="round"/>`;
  }),
});
WEAR.heartglasses = (ctx) => ({
  top: eyeWrap(ctx, (s) => {
    const c = ctx.col[0] || "#F06292";
    return `<path d="${heartPath(-21, -1, 2.6)}" fill="${c}" ${stroke(s)}/>
      <path d="${heartPath(21, -1, 2.6)}" fill="${c}" ${stroke(s)}/>
      <path d="M-5,-4 L5,-4" fill="none" ${stroke(s)}/>
      <circle cx="-26" cy="-5" r="2.5" fill="#FFFFFF"/><circle cx="16" cy="-5" r="2.5" fill="#FFFFFF"/>`;
  }),
});
WEAR.blush = (ctx) => {
  if (ctx.view === "back") return {};
  const c = ctx.a.cheek, dx = ctx.view === "side" ? ctx.dx : 0;
  const col = ctx.col[0] || "#F8A5C2";
  const x0 = ctx.a.eyes.x;
  return {
    top: `<ellipse cx="${f2(x0 - c.gap / 2 + dx)}" cy="${c.y}" rx="9" ry="5.5" fill="${col}" fill-opacity="0.85"/>
      <ellipse cx="${f2(x0 + c.gap / 2 + dx)}" cy="${c.y}" rx="9" ry="5.5" fill="${col}" fill-opacity="0.85"/>`,
  };
};
WEAR.bandage = (ctx) => {
  if (ctx.view === "back") return {};
  const c = ctx.a.cheek, dx = ctx.view === "side" ? ctx.dx : 0;
  const x = ctx.a.eyes.x + c.gap / 2 + dx - 2;
  return {
    top: `<g transform="translate(${f2(x)},${c.y - 4}) rotate(-25)"><rect x="-13" y="-5" width="26" height="10" rx="5" fill="#F5C99B" ${stroke(3)}/>
      <rect x="-5" y="-4" width="10" height="8" fill="#E9B384"/></g>`,
  };
};
WEAR.mustache = (ctx) => {
  if (ctx.view === "back") return {};
  const m = ctx.a.mouth, dx = ctx.view === "side" ? ctx.dx : 0;
  return {
    top: `<g transform="translate(${f2(m.x + dx)},${m.y - 2})"><path d="M0,-2 C-6,-8 -16,-8 -22,-2 C-26,2 -30,2 -32,-2 C-30,8 -16,10 -6,4 C-3,2 -1,1 0,0 C1,1 3,2 6,4 C16,10 30,8 32,-2 C30,2 26,2 22,-2 C16,-8 6,-8 0,-2 Z" fill="${ctx.col[0] || "#6B4A2B"}" ${stroke(3)}/></g>`,
  };
};

// くび: ローカル座標は 首の中心(0,0)、幅100
function neckWrap(ctx, inner) {
  const n = ctx.a.neck;
  const k = n.w / 100;
  const dx = ctx.view === "side" ? ctx.dx * 0.25 : 0;
  return `<g transform="translate(${f2(n.x + dx)},${n.y}) scale(${f2(k)})">${inner(4.5 / k)}</g>`;
}
WEAR.scarf = (ctx) => ({
  top: neckWrap(ctx, (s) => {
    const c = ctx.col[0];
    const band = `<path d="M-50,-6 C-20,4 20,4 50,-6 L50,8 C20,18 -20,18 -50,8 Z" fill="${c}" ${stroke(s)}/>`;
    if (ctx.view === "back") return band;
    return band + `<path d="M18,8 L30,40 L44,34 L32,6 Z" fill="${c}" ${stroke(s)}/>
      <path d="M26,24 L40,19" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${f2(s * 0.6)}"/>`;
  }),
});
WEAR.bowtie = (ctx) => {
  if (ctx.view === "back") return {};
  return {
    top: neckWrap(ctx, (s) => {
      const c = ctx.col[0];
      return `<path d="M0,6 L-26,-6 L-26,20 Z" fill="${c}" ${stroke(s)}/><path d="M0,6 L26,-6 L26,20 Z" fill="${c}" ${stroke(s)}/>
        <rect x="-7" y="-1" width="14" height="14" rx="4" fill="${shade(c, -0.15)}" ${stroke(s)}/>`;
    }),
  };
};
WEAR.bell = (ctx) => ({
  top: neckWrap(ctx, (s) => {
    const c = ctx.col[0] || "#E35D5B";
    const band = `<path d="M-50,-4 C-20,6 20,6 50,-4 L50,6 C20,16 -20,16 -50,6 Z" fill="${c}" ${stroke(s)}/>`;
    if (ctx.view === "back") return band;
    return band + `<circle cx="0" cy="20" r="11" fill="#F7C948" ${stroke(s)}/>
      <path d="M-11,20 L11,20" fill="none" ${stroke(s * 0.6)}/><circle cx="0" cy="25" r="2.5" fill="${INK}"/>`;
  }),
});
WEAR.necklace = (ctx) => {
  if (ctx.view === "back") return {};
  return {
    top: neckWrap(ctx, (s) => {
      let out = "";
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = -40 + t * 80, y = 2 + Math.sin(t * Math.PI) * 18;
        out += `<circle cx="${f2(x)}" cy="${f2(y)}" r="5.5" fill="#FFFFFF" ${stroke(s * 0.55)}/>`;
      }
      return out + `<path d="${heartPath(0, 28, 1.6)}" fill="${ctx.col[0] || "#F06292"}" ${stroke(s * 0.6)}/>`;
    }),
  };
};
WEAR.bib = (ctx) => {
  if (ctx.view === "back") return {};
  return {
    top: neckWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFFFFF";
      return `<path d="M-40,-2 C-40,46 40,46 40,-2 C20,6 -20,6 -40,-2 Z" fill="${c}" ${stroke(s)}/>
        <path d="M-30,6 C-28,36 28,36 30,6" fill="none" stroke="${ctx.col[1] || "#F48FB1"}" stroke-width="${f2(s * 0.8)}" stroke-dasharray="${f2(s * 1.2)} ${f2(s * 1.4)}" stroke-linecap="round"/>
        <path d="${heartPath(0, 20, 1.5)}" fill="${ctx.col[1] || "#F48FB1"}"/>`;
    }),
  };
};
WEAR.muffler = (ctx) => ({
  top: neckWrap(ctx, (s) => {
    const c = ctx.col[0], c2 = ctx.col[1] || "#FFFFFF";
    const band = `<path d="M-52,-8 C-20,4 20,4 52,-8 L52,12 C20,24 -20,24 -52,12 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-30,-2 L-30,18 M0,2 L0,22 M30,-2 L30,18" fill="none" stroke="${c2}" stroke-width="${f2(s * 1.4)}"/>`;
    if (ctx.view === "back") return band;
    return band + `<path d="M-34,12 L-40,52 L-22,54 L-18,14 Z" fill="${c}" ${stroke(s)}/>
      <path d="M-38,30 L-21,32 M-39,42 L-21,44" fill="none" stroke="${c2}" stroke-width="${f2(s * 1.2)}"/>`;
  }),
});

// からだ: 胴体パスでクリップして塗る。t = 胴の上端/下端 など
function torsoClip(ctx, inner) {
  return `<g clip-path="url(#torso${ctx.uid})">${inner}</g><path d="${ctx.p.torsoPath}" fill="none" ${stroke()}/>`;
}
// 服の上端（ごじは首まわりをU字にする。わんこ・がちゃんは頭で隠れる）
function garment(ctx, hem, color) {
  const T = ctx.a.torso, y = T.top, cx = T.cx;
  return `<path d="M0,${y} L${cx - 30},${y} Q${cx},${y + 16} ${cx + 30},${y} L210,${y} L210,${f2(hem)} L0,${f2(hem)} Z" fill="${color}"/>` +
    `<path d="M${cx - 30},${y} Q${cx},${y + 16} ${cx + 30},${y} M0,${y} L${cx - 30},${y} M${cx + 30},${y} L210,${y}" fill="none" ${stroke(3.5)}/>`;
}
function sleeves(ctx, color, detail = "") {
  // 腕の付け根側を服の色で塗る
  return ctx.p.arms
    .map((ar, i) => {
      if (ar.path) {
        const [x0, x1] = ar.clipX;
        return `<clipPath id="sl${i}${ctx.uid}"><rect x="${x0}" y="80" width="${x1 - x0}" height="80"/></clipPath>
          <g clip-path="url(#sl${i}${ctx.uid})"><path d="${ar.path}" fill="${color}" ${stroke()}/>${detail}</g>`;
      }
      const inward = i === 0 ? 1 : -1;
      return `<clipPath id="sl${i}${ctx.uid}"><ellipse cx="${ar.cx + inward * 4}" cy="${ar.cy - 7}" rx="${ar.rx + 4}" ry="${ar.ry - 2}" transform="rotate(${ar.rot} ${ar.cx} ${ar.cy})"/></clipPath>
        <g clip-path="url(#sl${i}${ctx.uid})"><ellipse cx="${ar.cx}" cy="${ar.cy}" rx="${ar.rx}" ry="${ar.ry}" transform="rotate(${ar.rot} ${ar.cx} ${ar.cy})" fill="${color}" ${stroke()}/></g>`;
    })
    .join("");
}
const t = (ctx) => ctx.a.torso;
WEAR.tshirt = (ctx) => {
  const T = t(ctx), c = ctx.col[0];
  const hem = T.top + (T.bottom - T.top) * 0.62;
  let deco = "";
  if (ctx.view !== "back" && ctx.col[1]) deco = `<path d="${starPath(T.cx, T.top + (hem - T.top) * 0.55, 9, 4)}" fill="${ctx.col[1]}" ${stroke(2.5)}/>`;
  return {
    sleeve: sleeves(ctx, c),
    torso: torsoClip(ctx, `${garment(ctx, hem, c)}<path d="M0,${f2(hem)} L210,${f2(hem)}" ${stroke()}/>${deco}`),
  };
};
WEAR.stripe = (ctx) => {
  const T = t(ctx), c = ctx.col[0], c2 = ctx.col[1] || "#FFFFFF";
  const hem = T.top + (T.bottom - T.top) * 0.66;
  let st = "";
  for (let y = T.top + 14; y < hem; y += 12) st += `<rect x="0" y="${f2(y)}" width="210" height="6" fill="${c2}"/>`;
  return {
    sleeve: sleeves(ctx, c),
    torso: torsoClip(ctx, `${garment(ctx, hem, c)}${st}<path d="M0,${f2(hem)} L210,${f2(hem)}" ${stroke()}/>`),
  };
};
WEAR.overalls = (ctx) => {
  const T = t(ctx), c = ctx.col[0];
  const mid = T.top + (T.bottom - T.top) * 0.45;
  const bw = T.w * 0.46;
  let inner = `<rect x="0" y="${f2(mid)}" width="210" height="80" fill="${c}"/><path d="M0,${f2(mid)} L210,${f2(mid)}" ${stroke(3.5)}/>`;
  if (ctx.view !== "back") {
    inner += `<rect x="${f2(T.cx - bw / 2)}" y="${f2(T.top + 6)}" width="${f2(bw)}" height="${f2(mid - T.top)}" fill="${c}" ${stroke(3.5)}/>
      <rect x="${f2(T.cx - bw * 0.25)}" y="${f2(T.top + 14)}" width="${f2(bw * 0.5)}" height="${f2(bw * 0.36)}" rx="3" fill="${shade(c, -0.12)}" ${stroke(2.5)}/>`;
    inner += `<path d="M${f2(T.cx - bw / 2)},${f2(T.top + 8)} L${f2(T.cx - T.w * 0.42)},${f2(T.top - 6)} M${f2(T.cx + bw / 2)},${f2(T.top + 8)} L${f2(T.cx + T.w * 0.42)},${f2(T.top - 6)}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M${f2(T.cx - bw / 2)},${f2(T.top + 8)} L${f2(T.cx - T.w * 0.42)},${f2(T.top - 6)} M${f2(T.cx + bw / 2)},${f2(T.top + 8)} L${f2(T.cx + T.w * 0.42)},${f2(T.top - 6)}" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="${f2(T.cx - bw / 2 + 5)}" cy="${f2(T.top + 12)}" r="3.4" fill="#F7C948" ${stroke(2)}/><circle cx="${f2(T.cx + bw / 2 - 5)}" cy="${f2(T.top + 12)}" r="3.4" fill="#F7C948" ${stroke(2)}/>`;
  } else {
    inner += `<path d="M${f2(T.cx - 12)},${f2(mid)} L${f2(T.cx - T.w * 0.38)},${f2(T.top - 4)} M${f2(T.cx + 12)},${f2(mid)} L${f2(T.cx + T.w * 0.38)},${f2(T.top - 4)}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M${f2(T.cx - 12)},${f2(mid)} L${f2(T.cx - T.w * 0.38)},${f2(T.top - 4)} M${f2(T.cx + 12)},${f2(mid)} L${f2(T.cx + T.w * 0.38)},${f2(T.top - 4)}" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  return { torso: torsoClip(ctx, inner) };
};
WEAR.dress = (ctx) => {
  const T = t(ctx), c = ctx.col[0], c2 = ctx.col[1] || "#FFFFFF";
  const waist = T.top + (T.bottom - T.top) * 0.4;
  const hw = T.w / 2 + 4, hem = T.bottom - 6, flare = T.w * 0.24;
  const skirt = `<path d="M${f2(T.cx - hw + 2)},${f2(waist)} C${f2(T.cx - hw - flare * 0.4)},${f2(waist + 16)} ${f2(T.cx - hw - flare)},${f2(hem - 8)} ${f2(T.cx - hw - flare)},${f2(hem)} C${f2(T.cx - hw / 2)},${f2(hem + 8)} ${f2(T.cx + hw / 2)},${f2(hem + 8)} ${f2(T.cx + hw + flare)},${f2(hem)} C${f2(T.cx + hw + flare)},${f2(hem - 8)} ${f2(T.cx + hw + flare * 0.4)},${f2(waist + 16)} ${f2(T.cx + hw - 2)},${f2(waist)} Z" fill="${c}" ${stroke()}/>
    <path d="M${f2(T.cx - hw - flare + 4)},${f2(hem - 3)} C${f2(T.cx - hw / 2)},${f2(hem + 4)} ${f2(T.cx + hw / 2)},${f2(hem + 4)} ${f2(T.cx + hw + flare - 4)},${f2(hem - 3)}" fill="none" stroke="${c2}" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>`;
  const top = torsoClip(ctx, garment(ctx, waist + 2, c));
  const bow = ctx.view === "back" ? `<path d="M${T.cx},${f2(waist)} l-12,-7 l0,14 Z M${T.cx},${f2(waist)} l12,-7 l0,14 Z" fill="${c2}" ${stroke(3)}/>` : `<circle cx="${T.cx}" cy="${f2(waist - 8)}" r="3" fill="${c2}"/>`;
  return { sleeve: sleeves(ctx, c), torso: top + skirt + bow };
};
WEAR.apron = (ctx) => {
  const T = t(ctx), c = ctx.col[0] || "#FFFFFF", c2 = ctx.col[1] || "#F48FB1";
  if (ctx.view === "back") {
    return { torso: torsoClip(ctx, `<path d="M0,${f2(T.top + (T.bottom - T.top) * 0.42)} L210,${f2(T.top + (T.bottom - T.top) * 0.42)}" stroke="${c2}" stroke-width="7"/>`) + `<path d="M${T.cx},${f2(T.top + (T.bottom - T.top) * 0.42)} l-12,8 M${T.cx},${f2(T.top + (T.bottom - T.top) * 0.42)} l12,8" ${stroke(6)}/><path d="M${T.cx},${f2(T.top + (T.bottom - T.top) * 0.42)} l-12,8 M${T.cx},${f2(T.top + (T.bottom - T.top) * 0.42)} l12,8" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>` };
  }
  const w = T.w * 0.62, y0 = T.top + 4, y1 = T.bottom - 4;
  return {
    torso: torsoClip(ctx, `<path d="M${f2(T.cx - w / 2)},${f2(y0)} L${f2(T.cx + w / 2)},${f2(y0)} L${f2(T.cx + w / 2 + 6)},${f2(y1)} L${f2(T.cx - w / 2 - 6)},${f2(y1)} Z" fill="${c}" ${stroke(3.5)}/>
      <path d="M${f2(T.cx - w / 2 - 6)},${f2(y1 - 5)} L${f2(T.cx + w / 2 + 6)},${f2(y1 - 5)}" stroke="${c2}" stroke-width="4"/>
      <rect x="${f2(T.cx - w * 0.22)}" y="${f2(y0 + (y1 - y0) * 0.5)}" width="${f2(w * 0.44)}" height="${f2((y1 - y0) * 0.22)}" rx="3" fill="${c2}" ${stroke(2.5)}/>`),
  };
};
WEAR.raincoat = (ctx) => {
  const T = t(ctx), c = ctx.col[0] || "#FFD54F";
  let inner = garment(ctx, 220, c);
  if (ctx.view !== "back") {
    inner += `<path d="M${T.cx},${T.top + 8} L${T.cx},${T.bottom}" ${stroke(3)}/>`;
    for (let i = 0; i < 3; i++) inner += `<circle cx="${T.cx + 7}" cy="${f2(T.top + 14 + i * (T.bottom - T.top - 24) / 3)}" r="3.4" fill="#FFFFFF" ${stroke(2)}/>`;
  }
  return { sleeve: sleeves(ctx, c), torso: torsoClip(ctx, inner) };
};
WEAR.armor = (ctx) => {
  const T = t(ctx), c = ctx.col[0] || "#B8C4D6";
  let inner = `${garment(ctx, T.top + (T.bottom - T.top) * 0.7, c)}
    <path d="M0,${f2(T.top + (T.bottom - T.top) * 0.7)} L210,${f2(T.top + (T.bottom - T.top) * 0.7)}" ${stroke()}/>
    <path d="M0,${f2(T.top + 10)} L210,${f2(T.top + 10)}" stroke="${shade(c, 0.35)}" stroke-width="4"/>`;
  if (ctx.view !== "back") inner += `<path d="${starPath(T.cx, T.top + (T.bottom - T.top) * 0.38, 12, 5.5)}" fill="#F7C948" ${stroke(3)}/>`;
  return { sleeve: sleeves(ctx, shade(c, -0.1)), torso: torsoClip(ctx, inner) };
};
WEAR.happi = (ctx) => {
  const T = t(ctx), c = ctx.col[0] || "#3F7FD9";
  const hem = T.top + (T.bottom - T.top) * 0.72;
  let inner = `${garment(ctx, hem, c)}<rect x="0" y="${f2(hem - 7)}" width="210" height="7" fill="#FFFFFF"/><path d="M0,${f2(hem)} L210,${f2(hem)}" ${stroke()}/>`;
  if (ctx.view !== "back") inner += `<path d="M${T.cx - 10},${T.top - 2} L${T.cx + 4},${f2(hem)}" stroke="#FFFFFF" stroke-width="7"/><path d="M${T.cx + 10},${T.top - 2} L${T.cx - 4},${f2(hem)}" stroke="#FFFFFF" stroke-width="7"/>`;
  else inner += `<circle cx="${T.cx}" cy="${f2(T.top + (hem - T.top) * 0.5)}" r="11" fill="#FFFFFF" ${stroke(3)}/><path d="M${T.cx - 5},${f2(T.top + (hem - T.top) * 0.5)} L${T.cx + 5},${f2(T.top + (hem - T.top) * 0.5)} M${T.cx},${f2(T.top + (hem - T.top) * 0.5 - 5)} L${T.cx},${f2(T.top + (hem - T.top) * 0.5 + 5)}" ${stroke(2.5)}/>`;
  return { sleeve: sleeves(ctx, c), torso: torsoClip(ctx, inner) };
};
WEAR.pajama = (ctx) => {
  const c = ctx.col[0] || "#A7D3F2", c2 = ctx.col[1] || "#FFFFFF";
  const T = t(ctx);
  let dots = "";
  for (let y = T.top + 12; y < 215; y += 16) for (let x = 20; x < 190; x += 16) dots += `<circle cx="${x + ((y / 16) % 2) * 8}" cy="${y}" r="3.2" fill="${c2}"/>`;
  return { sleeve: sleeves(ctx, c), torso: torsoClip(ctx, `${garment(ctx, 220, c)}${dots}`) };
};
WEAR.sweater = (ctx) => {
  const T = t(ctx), c = ctx.col[0], c2 = ctx.col[1] || "#FFFFFF";
  const hem = T.top + (T.bottom - T.top) * 0.7, zy = T.top + (hem - T.top) * 0.45;
  let zig = `M0,${f2(zy)}`;
  for (let x = 0; x <= 210; x += 10) zig += ` L${x + 5},${f2(zy + ((x / 10) % 2 ? -6 : 6))}`;
  return {
    sleeve: sleeves(ctx, c),
    torso: torsoClip(ctx, `${garment(ctx, hem, c)}<path d="${zig}" fill="none" stroke="${c2}" stroke-width="4"/>
      <rect x="0" y="${f2(hem - 8)}" width="210" height="8" fill="${shade(c, -0.15)}"/><path d="M0,${f2(hem)} L210,${f2(hem)}" ${stroke()}/>`),
  };
};

// せなか: 正面では からだの後ろ、背面では手前に描く
function backWrap(ctx, inner) {
  const b = ctx.a.back;
  const k = b.w / 60;
  const mir = ctx.view === "side" ? ` translate(${f2(-ctx.dx * 0.5)},0)` : "";
  return `<g transform="translate(${b.x},${b.y}) scale(${f2(k)})${mir}">${inner(4.5 / k)}</g>`;
}
WEAR.cape = (ctx) => {
  // 首から すそまで、キャラの座標でそのまま描く（体型に合わせる）
  const c = ctx.col[0] || "#E8262A", lining = ctx.col[1] || "#F7C948";
  const N = ctx.a.neck, T = ctx.a.torso;
  const topW = N.w * 0.42, botW = T.w * 0.72 + 10, y0 = N.y - 2, y1 = T.bottom - 8;
  const cx = N.x + (ctx.view === "side" ? -ctx.dx * 0.4 : 0);
  const shape = (fill) => `<path d="M${f2(cx - topW)},${y0} C${f2(cx - topW - 8)},${f2(y0 + (y1 - y0) * 0.4)} ${f2(cx - botW)},${f2(y1 - 14)} ${f2(cx - botW)},${y1} C${f2(cx - botW * 0.4)},${y1 + 7} ${f2(cx + botW * 0.4)},${y1 + 7} ${f2(cx + botW)},${y1} C${f2(cx + botW)},${f2(y1 - 14)} ${f2(cx + topW + 8)},${f2(y0 + (y1 - y0) * 0.4)} ${f2(cx + topW)},${y0} Z" fill="${fill}" ${stroke()}/>`;
  if (ctx.view === "back") {
    return { top: shape(c) + `<path d="${starPath(cx, y0 + (y1 - y0) * 0.45, 11, 5)}" fill="${lining}" ${stroke(3)}/>` };
  }
  return {
    behind: shape(c),
    top: neckWrap(ctx, (s) => `<path d="M-46,-4 C-20,6 20,6 46,-4 L44,6 C20,14 -20,14 -44,6 Z" fill="${c}" ${stroke(s)}/><circle cx="0" cy="8" r="7" fill="${lining}" ${stroke(s)}/>`),
  };
};
WEAR.wings = (ctx) => {
  const c = ctx.col[0] || "#FFFFFF";
  const wing = (s, dir) => `<g transform="scale(${dir},1)"><path d="M10,-6 C30,-40 70,-46 84,-30 C74,-24 76,-14 70,-10 C78,-2 72,8 62,8 C66,16 56,24 44,18 C34,24 18,16 10,6 Z" fill="${c}" ${stroke(s)}/>
    <path d="M30,-14 C44,-24 58,-28 68,-26 M30,-4 C42,-8 52,-8 60,-6" fill="none" stroke="${shade(c, -0.18)}" stroke-width="${f2(s * 0.6)}" stroke-linecap="round"/></g>`;
  const w = backWrap(ctx, (s) => wing(s, 1) + wing(s, -1));
  return ctx.view === "back" ? { top: w } : { behind: w };
};
WEAR.batwings = (ctx) => {
  const c = ctx.col[0] || "#5B4B8A";
  const wing = (s, dir) => `<g transform="scale(${dir},1)"><path d="M8,-4 C28,-36 64,-44 86,-34 C78,-24 80,-14 84,-6 C72,-10 64,-4 62,6 C52,-2 40,2 36,12 C26,4 16,6 8,8 Z" fill="${c}" ${stroke(s)}/></g>`;
  const w = backWrap(ctx, (s) => wing(s, 1) + wing(s, -1));
  return ctx.view === "back" ? { top: w } : { behind: w };
};
WEAR.backpack = (ctx) => {
  const c = ctx.col[0] || "#F29A1F";
  const bag = (s) => `<rect x="-26" y="-18" width="52" height="58" rx="14" fill="${c}" ${stroke(s)}/>
    <path d="M-26,0 C-10,8 10,8 26,0" fill="none" ${stroke(s * 0.8)}/>
    <rect x="-14" y="12" width="28" height="18" rx="6" fill="${shade(c, -0.15)}" ${stroke(s * 0.8)}/>`;
  if (ctx.view === "back") return { top: backWrap(ctx, bag) };
  const T = ctx.a.torso;
  return {
    behind: backWrap(ctx, (s) => `<g transform="translate(0,-6) scale(1.15)">${bag(s)}</g>`),
    torso: `<path d="M${f2(T.cx - T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx - T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx - T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx - T.w * 0.44)},${f2(T.top + 44)} M${f2(T.cx + T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx + T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx + T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx + T.w * 0.44)},${f2(T.top + 44)}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M${f2(T.cx - T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx - T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx - T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx - T.w * 0.44)},${f2(T.top + 44)} M${f2(T.cx + T.w * 0.36)},${f2(T.top + 2)} C${f2(T.cx + T.w * 0.4)},${f2(T.top + 20)} ${f2(T.cx + T.w * 0.42)},${f2(T.top + 34)} ${f2(T.cx + T.w * 0.44)},${f2(T.top + 44)}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  };
};
WEAR.shell = (ctx) => {
  const c = ctx.col[0] || "#7CB342";
  const sh = (s) => `<ellipse cx="0" cy="12" rx="46" ry="42" fill="${c}" ${stroke(s)}/>
    <path d="M0,-12 L-16,0 L-12,22 L12,22 L16,0 Z" fill="${shade(c, 0.25)}" ${stroke(s * 0.7)}/>
    <path d="M-16,0 L-38,-8 M16,0 L38,-8 M-12,22 L-26,44 M12,22 L26,44" fill="none" ${stroke(s * 0.7)}/>`;
  if (ctx.view === "back") return { top: backWrap(ctx, sh) };
  return { behind: backWrap(ctx, (s) => `<g transform="scale(1.08)">${sh(s)}</g>`) };
};
WEAR.fairywings = (ctx) => {
  const c = ctx.col[0] || "#B3E5FC";
  const wing = (s, dir) => `<g transform="scale(${dir},1)"><path d="M6,-2 C20,-44 66,-50 70,-24 C72,-10 40,-2 6,-2 Z" fill="${c}" fill-opacity="0.9" ${stroke(s)}/>
    <path d="M6,2 C30,4 58,14 52,32 C46,46 20,30 6,2 Z" fill="${c}" fill-opacity="0.9" ${stroke(s)}/>
    <circle cx="40" cy="-24" r="6" fill="#FFFFFF" fill-opacity="0.8"/></g>`;
  const w = backWrap(ctx, (s) => wing(s, 1) + wing(s, -1));
  return ctx.view === "back" ? { top: w } : { behind: w };
};

// ---- 本体の合成 ----
const SLOT_ORDER = ["back", "body", "neck", "face", "head"];

// opts: { pose, dir: 'down'|'up'|'left'|'right', face, outfit:{slot:itemId}, color:'soft'|'dark' }
function buildCharaSvg(id, opts = {}) {
  const D = CHARA_DATA[id], P = PROFILE[id];
  const pose = opts.pose || "idle_01";
  const dir = opts.dir || "down";
  const view = dir === "up" ? "back" : dir === "down" ? "front" : "side";
  const tr = D.poses[pose] || D.poses.idle_01;
  const faceName = faceOf(id, opts.face);

  const dx = view === "side" ? -P.faceShift : 0;
  const uid = "u" + (++buildCharaSvg.n);
  const ctx = { p: P, a: P.a, view, dx, col: [], uid };

  const layers = { behind: "", sleeve: "", torso: "", top: "" };
  const outfit = opts.outfit || {};
  for (const slot of SLOT_ORDER) {
    const itemId = outfit[slot];
    if (!itemId) continue;
    const item = typeof ITEM_INDEX !== "undefined" ? ITEM_INDEX[itemId] : null;
    if (!item || !WEAR[item.wear]) continue;
    ctx.col = item.col || [];
    const r = WEAR[item.wear](ctx);
    for (const k in r) if (r[k]) layers[k] += r[k];
  }

  // からだグループの要素列を組み立てる
  const base = D.base.slice();
  const els = [];
  let tailEl = null;
  base.forEach((el, i) => {
    if (view === "back" && i === P.tailIdx) { tailEl = el; return; }
    els.push(el);
    if (i === P.armIdx[1]) els.push(layers.sleeve);
    // 胴体の直後（わんこは ぶち模様の後）に服
    const afterTorso = id === "wanko" ? 6 : P.torsoIdx;
    if (i === afterTorso) els.push(layers.torso);
  });
  if (view === "back") {
    if (id === "goji") {
      // 背びれ（せなかの まんなかに ならぶ）としっぽ
      const fill = GOJI_COLORS.soft;
      const plate = (y, s) => `<path d="M102,${f2(y - 11 * s)} C${f2(102 + 8 * s)},${f2(y - 3 * s)} ${f2(102 + 9 * s)},${f2(y + 7 * s)} 102,${f2(y + 11 * s)} C${f2(102 - 9 * s)},${f2(y + 7 * s)} ${f2(102 - 8 * s)},${f2(y - 3 * s)} 102,${f2(y - 11 * s)} Z" fill="${shade(fill, 0.22)}" ${stroke(3.5)}/>`;
      els.push(plate(60, 0.8) + plate(88, 1) + plate(118, 1.15));
      els.push(`<path d="M88,150 C82,178 98,202 134,205 C154,206 164,200 158,193 L148,194 L150,186 L138,190 C120,186 112,172 116,150 C108,144 94,144 88,150 Z" fill="${fill}" ${stroke()}/>`);
      tailEl = null;
    }
    if (id === "gachan") els.push(`<path d="M100,170 C111,175 113,188 100,197 C87,188 89,175 100,170 Z" fill="#FADA78" ${stroke()}/><path d="M100,177 L100,190" fill="none" ${stroke(3)}/>`);
    if (tailEl) els.push(`<g transform="translate(-24,-4)">${tailEl}</g>`);
  } else {
    // ごじの目は頭の突起にあるため、涙は横向きでも口の移動に追従させない。
    const parts = charaFaceParts(id, faceName), eyeTears = id === "goji" ? parts.filter((el) => el.includes('data-anchor="eye"')) : [];
    let face = parts.filter((el) => !eyeTears.includes(el)).join("");
    if (dx) face = `<g transform="translate(${dx},0)">${face}</g>`;
    els.push(face, ...eyeTears);
  }
  els.push(layers.top);

  let feet = `<g transform="${tr[0]}">${D.feet[0].join("")}</g><g transform="${tr[1]}">${D.feet[1].join("")}</g>`;
  let inner = `<g transform="${tr[2]}">${layers.behind}</g>${feet}<g transform="${tr[2]}">${els.join("")}</g>`;
  if (dir === "right") inner = `<g transform="matrix(-1,0,0,1,200,0)">${inner}</g>`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}"${opts.w ? ` width="${opts.w}" height="${Math.round((opts.w * VB.h) / VB.w)}"` : ""}>` +
    `<defs><clipPath id="torso${uid}"><path d="${P.torsoPath}"/></clipPath></defs>${inner}</svg>`;
  if (id === "goji" && opts.color === "dark") svg = svg.replaceAll(GOJI_COLORS.soft, GOJI_COLORS.dark);
  return svg;
}

buildCharaSvg.n = 0;

// ---- ラスタライズ（SvgCache は util.js） ----
function outfitKey(outfit) {
  if (!outfit) return "";
  return SLOT_ORDER.map((s) => outfit[s] || "").join(",");
}

const Chara = {
  PROFILE, IDS: CHARA_IDS, VB, FOOT, EMO, faceOf,
  svg: buildCharaSvg,
  key(id, o) {
    return `c:${id}:${o.pose || "idle_01"}:${o.dir || "down"}:${faceOf(id, o.face)}:${id === "goji" ? o.color || "soft" : ""}:${outfitKey(o.outfit)}`;
  },
  // 表示幅 size(論理px) のときのスプライトの幅・高さ(論理px)
  dims(size) { return { w: size, h: (size * VB.h) / VB.w }; },
  pxSize(size) {
    // 端末ピクセルに合わせ、8px単位に丸めて種類を減らす
    return Math.max(8, Math.ceil((size * (typeof G !== "undefined" ? G.px : 2)) / 8) * 8);
  },
  // (x,y)=足元の論理座標。size=スプライト幅(論理px)
  draw(ctx, id, o, x, y, size, alpha = 1) {
    const pw = this.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    let c = SvgCache.get(this.key(id, o), () => buildCharaSvg(id, o), pw, ph);
    if (!c) {
      // フォールバック: 同じ服・向きの idle_01 → 服なし正面
      const fb = [
        { ...o, pose: "idle_01" },
        { ...o, face: "normal" },
        { ...o, pose: "idle_01", face: "normal" },
        { ...o, dir: "down", pose: "idle_01", face: "normal" },
        { dir: o.dir, color: o.color },
        { color: o.color },
      ];
      for (const f of fb) {
        c = SvgCache.map.get(this.key(id, f) + "@" + pw + "x" + ph);
        if (c) break;
      }
      if (!c) return;
    }
    const w = size, h = (size * VB.h) / VB.w;
    const ax = ((FOOT.x - VB.x) / VB.w) * w, ay = ((FOOT.y - VB.y) / VB.h) * h;
    if (alpha !== 1) { ctx.save(); ctx.globalAlpha *= alpha; }
    ctx.drawImage(c, x - ax, y - ay, w, h);
    if (alpha !== 1) ctx.restore();
  },
  preload(list, size) {
    const pw = this.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    return Promise.all(list.map(([id, o]) => SvgCache.ensure(this.key(id, o), () => buildCharaSvg(id, o), pw, ph)));
  },
};
