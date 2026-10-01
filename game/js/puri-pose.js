// ぷりくらの はっきりした ポーズ と かお（UI-24）。
// ポーズ: うでを かたで まわす（Chara の CHARA_GESTURES）。ピース・しゃきーん・わーい・ハート・にゃん の 5しゅ（まえむき）。
// かお: ぷりくらの「かお」の ボタンで 3人とも ちがう かおに なる ように、キャラ素材に ない かおを くみたてる（CHARA_FACE_EXTRA）。
// まえは わんこの「にっこり・わくわく・らぶらぶ」、がちゃんの「わくわく・らぶらぶ・びっくり」、ごじの「にっこり と らぶらぶ」「わくわく と ぷんぷん」が おなじ かお だった。
// 絵の 座標は キャラ素材と おなじ（viewBox 220 はば・あしもと (100, 210)）。せんの いろは INK・はばは 3〜4.5。
const PuriPose = (() => {
  const K = INK, st = (w = 3) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const heart = (cx, cy, s, fill, w = 3) => `<path d="${heartPath(cx, cy, s)}" fill="${fill}" ${st(w)}/>`;
  const sparkle = (cx, cy, r, fill = "#FFE45C", w = 2.4) => `<path d="M${f2(cx)},${f2(cy - r)} C${f2(cx + r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx + r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx + r)},${f2(cy)} C${f2(cx + r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx + r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx)},${f2(cy + r)} C${f2(cx - r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx - r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx - r)},${f2(cy)} C${f2(cx - r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx - r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx)},${f2(cy - r)} Z" fill="${fill}" ${st(w)}/>`;
  const blush = (x, y, rx = 7, ry = 4.2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF9EB5" opacity="0.85"/>`;
  // ごじの 目は あたまの こぶ（キャラ素材の からだ）に ある。かおの ぶひんは よこむきで ずれない ように data-anchor="eye"
  const gojiEye = (body) => body.replace(/^<(\w+)/, '<$1 data-anchor="eye"');
  const GOJI_EYES = [[58, 50], [146, 50]];

  // ---- かお（F = キャラ素材の かお。ぶひんの ならびは キャラ素材と おなじ: 目・はな・くち）----
  const FACES = {
    wanko: {
      // わくわく: きらきらの 大きな 目（ほしの ひかり）・あいた くち
      pk_kira: (F) => [
        ...[82, 118].map((x) => `<ellipse cx="${x}" cy="86" rx="7.5" ry="9" fill="${K}"/>` + sparkle(x - 2.2, 83, 3.6, "#FFFFFF", 0) + `<circle cx="${x + 2.6}" cy="90.5" r="1.6" fill="#FFFFFF"/>`),
        F.smile[3], F.smile[2], blush(68, 101, 6, 3.6), blush(132, 101, 6, 3.6),
        sparkle(42, 34, 7), sparkle(160, 26, 5.5), sparkle(170, 52, 4),
      ],
      // らぶらぶ: ハートの 目・あいた くち・ほっぺ・うかぶ ハート
      pk_heart: (F) => [heart(82, 85, 1.35, "#FF6F91"), heart(118, 85, 1.35, "#FF6F91"), F.smile[3], F.smile[2], blush(68, 102), blush(132, 102), heart(168, 30, 1.1, "#FF9EC4"), heart(152, 12, 0.8, "#FF9EC4")],
    },
    gachan: {
      // らぶらぶ: ハートの 目・あいた くちばし・ほっぺ・うかぶ ハート
      pk_heart: (F) => [heart(80, 104, 1.45, "#FF6F91"), heart(120, 104, 1.45, "#FF6F91"), F.smile[2], F.smile[3], blush(65, 120), blush(135, 120), heart(160, 46, 1.1, "#FF9EC4"), heart(146, 28, 0.8, "#FF9EC4")],
      // びっくり: まるい しろめ・ちいさい くろめ・あいた くちばし・「！」
      pk_odoroki: (F) => [
        ...[80, 120].map((x) => `<circle cx="${x}" cy="103" r="9.5" fill="#FFFFFF" ${st(3)}/><circle cx="${x}" cy="104" r="3.6" fill="${K}"/>`),
        `<path d="M90,118 C90,112 110,112 110,118 C110,127 105,132 100,132 C95,132 90,127 90,118 Z" fill="#F29A1F" ${st(3.5)}/><ellipse cx="100" cy="123" rx="4.5" ry="5" fill="#E35D5B" ${st(2.6)}/>`,
        `<path d="M160,22 L162,40" fill="none" ${st(4.5)}/><circle cx="163" cy="49" r="2.6" fill="${K}"/>`,
      ],
    },
    goji: {
      // にっこり: こぶの 目を にこっと とじる・ほっぺ・♪（くちは いつもの くち）
      pk_nikori: (F) => [
        ...F.normal,
        ...GOJI_EYES.map(([x, y]) => gojiEye(`<g><circle cx="${x}" cy="${y}" r="8.6" fill="${GOJI_COLORS.soft}"/><path d="M${x - 7},${y + 3} Q${x},${y - 7} ${x + 7},${y + 3}" fill="none" ${st(3.5)}/></g>`)),
        blush(60, 90, 8, 4.6), blush(144, 90, 8, 4.6),
        `<g transform="translate(170,26)"><path d="M0,12 L0,-6 L10,-9 L10,9" fill="none" ${st(3)}/><ellipse cx="-3" cy="12" rx="4.4" ry="3.4" fill="${K}"/><ellipse cx="7" cy="9" rx="4.4" ry="3.4" fill="${K}"/></g>`,
      ],
      // ぷんぷん: こぶの うえに おこった まゆ・あたまに おこりマーク・くちは いつもの くち
      pk_punpun: (F) => [
        ...F.normal,
        ...GOJI_EYES.map(([x, y], k) => gojiEye(`<path d="M${x - 10},${y - (k ? -4 : 9)} L${x + 10},${y - (k ? 9 : -4)}" fill="none" ${st(4.5)}/>`)),
        `<g transform="translate(160,18)">${[0, 90, 180, 270].map((a) => `<path transform="rotate(${a})" d="M3,-3 Q3,-10 9,-11 M3,-3 Q10,-3 11,-9" fill="none" stroke="#E8262A" stroke-width="4" stroke-linecap="round"/>`).join("")}</g>`,
      ],
    },
  };
  for (const id in FACES) Object.assign(CHARA_FACE_EXTRA[id], FACES[id]);
  // ぷりくらの かおの ボタン（Purikura.FACES の id）→ 3人の かお。ない ところは Chara の EMO
  const FACE_AS = {
    happy: { goji: "pk_nikori" },
    excited: { wanko: "pk_kira" },
    love: { wanko: "pk_heart", gachan: "pk_heart" },
    surprise: { gachan: "pk_odoroki" },
    angry: { goji: "pk_punpun" },
  };

  // ---- うでの ポーズ（rot: かたを まん中に まわす。ひだりの うでは + で そとから うえへ・みぎの うでは − で そとから うえへ）----
  // 手の さきの 絵（まわす まえの 座標: hand = 手の さき・dir = かた → 手 の むき）
  const along = (A, t, n = 0) => [A.hand[0] + A.dir[0] * t - A.dir[1] * n, A.hand[1] + A.dir[1] * t + A.dir[0] * n];
  // ピースの 2ほんの ゆび（手の さきから すこし ひらいて のびる）
  const vFingers = (A) => {
    const deg = (Math.atan2(A.dir[1], A.dir[0]) * 180) / Math.PI - 90, [hx, hy] = along(A, -2);
    const finger = (a) => `<g transform="rotate(${f2(a)} ${f2(hx)} ${f2(hy)})"><rect x="${f2(hx - 3.8)}" y="${f2(hy - 2)}" width="7.6" height="19" rx="3.8" fill="${A.fill}" ${st(3)}/></g>`;
    return finger(deg - 16) + finger(deg + 16) + `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="6.2" fill="${A.fill}" ${st(3)}/>`;
  };
  // ねこの て（まるめた 手・ピンクの にくきゅう）
  const nyanPaw = (A) => {
    const [hx, hy] = along(A, -1), d = (n, t) => along(A, t - 1, n);
    return `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="8" fill="${A.fill}" ${st(3)}/>` + [-4.2, 0, 4.2].map((n) => { const [x, y] = d(n, 5.6); return `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.6" fill="${A.fill}" ${st(2.4)}/>`; }).join("") + (() => { const [x, y] = d(0, -1.5); return `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="3" ry="2.4" fill="#FF9EB5"/>`; })();
  };
  // にぎった 手（しゃきーん）
  const fist = (A) => { const [hx, hy] = along(A, -1); return `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="7" fill="${A.fill}" ${st(3)}/><path d="M${f2(hx - 3)},${f2(hy - 3)} Q${f2(hx)},${f2(hy - 5)} ${f2(hx + 3)},${f2(hy - 3)}" fill="none" ${st(2)}/>`; };
  // わーいの うごきの せん（手の そと）
  const swish = (A) => { const a = along(A, 6, A.side ? 8 : -8), b = along(A, 12, A.side ? 10 : -10), c = along(A, 4, A.side ? -10 : 10), e = along(A, 9, A.side ? -13 : 13); return `<path d="M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])} M${f2(c[0])},${f2(c[1])} L${f2(e[0])},${f2(e[1])}" fill="none" ${st(3)}/>`; };
  // 3人の からだの まえの ハート（ハートの ポーズで 2つの 手で もつ）・しゃきーんの きらーん
  const CHEST = { wanko: [100, 153, 2.9], gachan: [100, 165, 2.7], goji: [102, 138, 3.4] };
  const LONG = { wanko: 1.7, gachan: 1.8 };
  const GESTURES = {
    // ピース: ひだりの 手を ほっぺの よこに あげて ピース（みぎの うでは そのまま）
    peace: { len: LONG, arms: { wanko: [{ rot: 128, front: true, deco: vFingers }, {}], gachan: [{ rot: 119, front: true, deco: vFingers }, {}], goji: [{ rot: 95, front: true, deco: vFingers }, {}] } },
    // しゃきーん: ひだりの 手を ななめ うえに つきあげる・みぎの うでは こしに・きらーん
    shakin: {
      len: LONG,
      arms: { wanko: [{ rot: 104, front: true, deco: fist }, { rot: -20 }], gachan: [{ rot: 95, front: true, deco: fist }, { rot: -20 }], goji: [{ rot: 55, front: true, deco: fist }, { rot: 25 }] },
      over: (id) => { const [x, y] = id === "goji" ? [12, 30] : id === "gachan" ? [22, 104] : [20, 84]; return sparkle(x, y, 9) + `<path d="M${x + 12},${y - 10} L${x + 20},${y - 18} M${x - 14},${y + 6} L${x - 22},${y + 10}" fill="none" ${st(3)}/>`; },
    },
    // わーい: りょうてを うえに（ばんざい）・うごきの せん
    wai: { len: LONG, arms: { wanko: [{ rot: 108, front: true, deco: swish }, { rot: -108, front: true, deco: swish }], gachan: [{ rot: 98, front: true, deco: swish }, { rot: -98, front: true, deco: swish }], goji: [{ rot: 62, front: true, deco: swish }, { rot: -62, front: true, deco: swish }] } },
    // ハート: りょうてを まえで あわせて 大きな ハートを もつ
    heart: {
      arms: { wanko: [{ rot: -54, front: true }, { rot: 54, front: true }], gachan: [{ rot: -72, front: true }, { rot: 72, front: true }], goji: [{ rot: -150, front: true }, { rot: 150, front: true }] },
      under: (id) => { const [x, y, s] = CHEST[id]; return heart(x, y, s, "#FF7BA8", 3.5) + `<ellipse cx="${f2(x - s * 3)}" cy="${f2(y - s * 2.2)}" rx="${f2(s * 1.6)}" ry="${f2(s * 1)}" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 ${f2(x - s * 3)} ${f2(y - s * 2.2)})"/>`; },
    },
    // にゃん: りょうてを ほっぺの よこで ねこの て
    nyan: { len: LONG, arms: { wanko: [{ rot: 124, front: true, deco: nyanPaw }, { rot: -124, front: true, deco: nyanPaw }], gachan: [{ rot: 116, front: true, deco: nyanPaw }, { rot: -116, front: true, deco: nyanPaw }], goji: [{ rot: 112, front: true, deco: nyanPaw }, { rot: -112, front: true, deco: nyanPaw }] } },
  };
  Object.assign(CHARA_GESTURES, GESTURES);
  return {
    FACES, FACE_AS, GESTURES,
    // ぷりくらの かおの ボタン → その 人の かお（Chara.svg の face）
    faceOf(id, faceId) { const m = FACE_AS[faceId]; return (m && m[id]) || faceId; },
  };
})();
