// のうトレの おてつだい「あたまの たいそう」（js/mg-brain.js・UI-64）の 絵。ミニゲームの アイコン（viewBox 0 0 64 64・線は INK・パステル）。
// ・こもの 12しゅ × いろ 2つ（まちがい さがしの「いろが ちがう」・おなじ え さがしの カード）
// ・くだもの 4しゅ（くだもの けいさん）・カードの うら（ふくろうの マーク）・むしめがね・まる／ばつ の しるし
// ・SvgCache の キーは「brain:しゅるい:いろ」など きまった ものだけ（js/minigames.js の mgIcon が "mg:" を つける。大きさは がめんで きまる）
const BrainArt = (() => {
  const K = INK;
  const sk = (w = 3) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const shine = (d, w = 3) => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${w}" stroke-linecap="round" opacity="0.75"/>`;
  // [なまえ, いろ 0, いろ 1, 絵（c: いろ）, よこむきの ちがいが わかる か（まちがい さがしの「むき」）]
  const PIECES = {
    apple: ["りんご", "#EF5350", "#9CCC65", (c) => `<path d="M32,56 C16,56 8,42 10,30 C12,18 24,14 32,20 C40,14 52,18 54,30 C56,42 48,56 32,56 Z" fill="${c}" ${sk()}/><path d="M32,20 C32,14 34,10 38,8" fill="none" ${sk(3)}/><path d="M36,14 C42,8 50,10 50,14 C44,18 40,18 36,14 Z" fill="#7CB342" ${sk(2.4)}/>${shine("M17,32 q2 -8 9 -10")}`, true],
    flower: ["おはな", "#F48FB1", "#64B5F6", (c) => `<path d="M32,60 V38" stroke="#5E9A3E" stroke-width="4" stroke-linecap="round"/><path d="M32,50 C24,44 18,48 16,52 C24,54 28,52 32,50 Z" fill="#7CB342" ${sk(2.2)}/>` + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="32" cy="15" rx="8" ry="10" transform="rotate(${a} 32 26)" fill="${c}" ${sk(2.4)}/>`).join("") + `<circle cx="32" cy="26" r="6.5" fill="#FFD54F" ${sk(2.4)}/>`, true],
    star: ["おほしさま", "#FFD54F", "#FFB74D", (c) => `<path d="${starPath(32, 34, 26, 11.5)}" fill="${c}" ${sk()}/><circle cx="26" cy="34" r="2.2" fill="${K}"/><circle cx="38" cy="34" r="2.2" fill="${K}"/><path d="M28.5,39.5 Q32,42.5 35.5,39.5" fill="none" ${sk(2)}/>${shine("M21,27 l6 -2")}`, false],
    ball: ["ボール", "#42A5F5", "#EF5350", (c) => `<circle cx="32" cy="34" r="22" fill="#FFFFFF" ${sk()}/><path d="M12,30 C22,24 42,24 52,30 L54,38 C42,32 22,32 10,38 Z" fill="${c}"/><circle cx="32" cy="34" r="22" fill="none" ${sk()}/>${shine("M18,22 q5 -6 12 -7")}`, false],
    cup: ["コップ", "#FFFFFF", "#F8BBD0", (c) => `<path d="M14,18 H44 L40,56 H18 Z" fill="${c}" ${sk()}/><path d="M44,26 C54,26 56,40 42,42" fill="none" ${sk()}/><path d="M17,28 H41" stroke="#90CAF9" stroke-width="5"/><path d="M15,22 H43" fill="none" ${sk(2)}/>`, true],
    bird: ["ことり", "#FFEE58", "#81D4FA", (c) => `<path d="M10,40 C10,24 22,16 34,18 C46,20 54,30 52,42 C50,52 40,56 30,56 C18,56 10,50 10,40 Z" fill="${c}" ${sk()}/><path d="M50,30 L60,32 L50,36 Z" fill="#FFA726" ${sk(2.2)}/><circle cx="40" cy="30" r="3" fill="${K}"/><path d="M18,40 C24,34 32,36 34,44 C28,48 20,46 18,40 Z" fill="#FFFFFF" fill-opacity="0.5" ${sk(2.2)}/>`, true],
    fish: ["おさかな", "#FFA726", "#4FC3F7", (c) => `<path d="M8,34 C16,18 40,16 50,30 C40,46 16,48 8,34 Z" fill="${c}" ${sk()}/><path d="M48,30 L60,20 L58,34 L60,46 L48,36 Z" fill="${c}" ${sk(2.6)}/><circle cx="20" cy="30" r="3" fill="${K}"/><path d="M28,24 q4 8 0 16" fill="none" ${sk(2)}/>`, true],
    car: ["くるま", "#EF5350", "#42A5F5", (c) => `<path d="M6,44 V34 C6,30 8,28 12,28 L18,28 L24,18 C25,16 27,16 29,16 L42,16 C45,16 46,17 48,20 L52,28 L56,28 C59,28 60,30 60,34 V44 Z" fill="${c}" ${sk()}/><path d="M26,27 L30,20 H38 V27 Z M42,27 V20 H45 L48,27 Z" fill="#BBDEFB" ${sk(2)}/><circle cx="18" cy="46" r="6" fill="#455A64" ${sk(2.6)}/><circle cx="48" cy="46" r="6" fill="#455A64" ${sk(2.6)}/>`, true],
    cake: ["ケーキ", "#F8BBD0", "#FFE082", (c) => `<path d="M10,52 V32 L52,22 V52 Z" fill="#FFF8E1" ${sk()}/><path d="M10,32 L52,22 L44,16 L10,26 Z" fill="${c}" ${sk(2.6)}/><path d="M12,42 L50,36" stroke="${c}" stroke-width="5"/><path d="M30,12 C24,12 23,20 30,22 C37,20 36,12 30,12 Z" fill="#E53935" ${sk(2.2)}/>`, true],
    mushroom: ["きのこ", "#EF5350", "#A1887F", (c) => `<path d="M24,36 H40 L42,56 H22 Z" fill="#FFF3E0" ${sk()}/><path d="M6,38 C6,20 18,10 32,10 C46,10 58,20 58,38 Z" fill="${c}" ${sk()}/><circle cx="22" cy="24" r="4" fill="#FFFFFF"/><circle cx="40" cy="20" r="5" fill="#FFFFFF"/><circle cx="46" cy="32" r="3.4" fill="#FFFFFF"/>`, false],
    balloon: ["ふうせん", "#BA68C8", "#EF5350", (c) => `<path d="M32,8 C46,8 52,20 50,30 C48,40 40,46 32,46 C24,46 16,40 14,30 C12,20 18,8 32,8 Z" fill="${c}" ${sk()}/><path d="M29,46 L35,46 L32,51 Z" fill="${c}" ${sk(2)}/><path d="M32,51 C28,56 36,58 32,62" fill="none" ${sk(2)}/>${shine("M22,18 q4 -5 10 -5")}`, false],
    tree: ["き", "#66BB6A", "#FFA726", (c) => `<path d="M28,40 H36 V58 H28 Z" fill="#8D6E63" ${sk()}/><circle cx="32" cy="26" r="18" fill="${c}" ${sk()}/><circle cx="20" cy="34" r="10" fill="${c}" ${sk()}/><circle cx="44" cy="34" r="10" fill="${c}" ${sk()}/><path d="M18,30 C22,26 30,26 32,30 M34,20 C38,18 42,20 44,24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>`, false],
  };
  const KINDS = Object.keys(PIECES);
  // くだもの けいさんの くだもの（1しゅ 1いろ）: [なまえ, 絵]
  const FRUITS = {
    apple: ["りんご", () => PIECES.apple[3]("#EF5350")],
    mikan: ["みかん", () => `<circle cx="32" cy="36" r="22" fill="#FFA726" ${sk()}/><path d="M32,14 C34,9 38,8 40,10" fill="none" ${sk(2.6)}/><path d="M36,14 C42,8 50,10 50,14 C44,18 40,18 36,14 Z" fill="#7CB342" ${sk(2.2)}/>${[[22, 30], [42, 32], [30, 44], [40, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#E08A2A"/>`).join("")}${shine("M17,32 q2 -8 9 -10")}`],
    strawberry: ["いちご", () => `<path d="M32,58 C18,50 10,36 14,24 C18,14 28,16 32,18 C36,16 46,14 50,24 C54,36 46,50 32,58 Z" fill="#E8453C" ${sk()}/><path d="M22,16 L32,22 L42,16 L38,10 L32,14 L26,10 Z" fill="#6DBE5B" ${sk(2.4)}/>${[[24, 30], [38, 28], [30, 40], [42, 40], [34, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#FFE066"/>`).join("")}`],
    banana: ["バナナ", () => `<path d="M12,22 C14,44 34,56 54,46 C56,44 56,42 54,42 C38,46 24,38 20,20 C18,16 12,16 12,22 Z" fill="#FFE066" ${sk()}/><path d="M12,22 L10,16 L16,16 Z" fill="#8D6E63" ${sk(2)}/><path d="M22,28 C26,38 34,42 44,42" fill="none" stroke="#F9C74F" stroke-width="2.6" stroke-linecap="round"/>`],
  };
  const FRUIT_KINDS = Object.keys(FRUITS);
  // カードの うら（ふくろうの マークと てんてんの わく）
  const cardBack = () => `<rect x="4" y="4" width="56" height="56" rx="10" fill="#7E9CD8" ${sk(3)}/><rect x="10" y="10" width="44" height="44" rx="7" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="4 4" opacity="0.8"/>`
    + `<ellipse cx="32" cy="34" rx="13" ry="14" fill="#C7A27A" ${sk(2.4)}/><path d="M20,24 L22,17 L27,22 Z M44,24 L42,17 L37,22 Z" fill="#C7A27A" ${sk(2)}/><circle cx="26.5" cy="31" r="5.4" fill="#FFFFFF" ${sk(2)}/><circle cx="37.5" cy="31" r="5.4" fill="#FFFFFF" ${sk(2)}/><circle cx="26.5" cy="31.6" r="2.2" fill="${K}"/><circle cx="37.5" cy="31.6" r="2.2" fill="${K}"/><path d="M30,37 L34,37 L32,40.5 Z" fill="#FFB74D" ${sk(1.6)}/>`;
  // むしめがね（ふきだし）
  const lens = () => `<path d="M40,40 L56,56" stroke="#8D6E63" stroke-width="9" stroke-linecap="round"/><path d="M40,40 L56,56" fill="none" ${sk(2.6)}/><circle cx="27" cy="27" r="18" fill="#E3F2FD" ${sk(3.4)}/>${shine("M17,24 q2 -7 9 -9", 3.4)}`;
  // まるの しるし（みつけた ところ）・ばつ（はずれ）
  const ring = () => `<circle cx="32" cy="32" r="27" fill="none" stroke="#E53935" stroke-width="6"/>`;
  const miss = () => `<path d="M14,14 L50,50 M50,14 L14,50" stroke="#5C6BC0" stroke-width="7" stroke-linecap="round"/>`;
  const piece = (kind, v = 0) => { const P = PIECES[kind]; return P ? P[3](P[1 + (v ? 1 : 0)]) : ""; };
  const fruit = (kind) => (FRUITS[kind] ? FRUITS[kind][1]() : "");
  // canvas に 描く（js/minigames.js の mgIcon。flip は よこむき・a は うすさ）
  const draw = (ctx, kind, v, x, y, size, { flip = false, alpha = 1 } = {}) => {
    ctx.save(); ctx.globalAlpha *= alpha;
    if (flip) { ctx.translate(x, y); ctx.scale(-1, 1); mgIcon(ctx, `brain:${kind}:${v ? 1 : 0}`, () => piece(kind, v), 0, 0, size); }
    else mgIcon(ctx, `brain:${kind}:${v ? 1 : 0}`, () => piece(kind, v), x, y, size);
    ctx.restore();
  };
  const drawFruit = (ctx, kind, x, y, size) => mgIcon(ctx, "brain:fruit:" + kind, () => fruit(kind), x, y, size);
  const drawBack = (ctx, x, y, size) => mgIcon(ctx, "brain:back", cardBack, x, y, size);
  const drawLens = (ctx, x, y, size) => mgIcon(ctx, "brain:lens", lens, x, y, size);
  return { PIECES, KINDS, FRUITS, FRUIT_KINDS, piece, fruit, cardBack, lens, ring, miss, draw, drawFruit, drawBack, drawLens,
    name: (kind) => (PIECES[kind] ? PIECES[kind][0] : FRUITS[kind] ? FRUITS[kind][0] : ""), flips: (kind) => !!(PIECES[kind] && PIECES[kind][4]) };
})();
