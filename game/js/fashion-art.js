// ファッションショー（UI-36・js/fashion-show.js）の 絵。
// ・3人の かお: どきどき（fs_doki: まゆが さがり・あせ・なみの くち）と キメ（fs_kime: ウインクか きらきらの め・ほっぺ・きらっ）。CHARA_FACE_EXTRA
// ・うでの ポーズ（まえむき）: あたまと こし（fs_hip）・ゆびさし（fs_point）・てを ふる（fs_wave）・ほし（fs_star）。CHARA_GESTURES（js/puri-pose.js と おなじ かたち）
// ・けいひんの 服 4しゅ（3人 × 4むき）: きらきら サングラス・ランウェイ マント・スターの ティアラ・ベストドレッサーの たすき（WEAR）
// ・トロフィー 4しゅ（へやの 立体。FurnModels の kit）
// ・きねん しゃしん（drawPhoto: ランウェイの はいけい・3人の ポーズ・テーマ・ランクの リボン。300×400）
// 絵の 座標は キャラ素材と おなじ（viewBox 220 はば・あしもと (100, 210)）。線は INK。SvgCache の キーは しゅるい・ランク・テーマ だけ。
const FashionArt = (() => {
  const K = INK, st = (w = 3) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const sparkle = (cx, cy, r, fill = "#FFE45C", w = 2.4) => `<path d="M${f2(cx)},${f2(cy - r)} C${f2(cx + r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx + r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx + r)},${f2(cy)} C${f2(cx + r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx + r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx)},${f2(cy + r)} C${f2(cx - r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx - r * 0.16)},${f2(cy + r * 0.16)} ${f2(cx - r)},${f2(cy)} C${f2(cx - r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx - r * 0.16)},${f2(cy - r * 0.16)} ${f2(cx)},${f2(cy - r)} Z" fill="${fill}" ${w ? st(w) : ""}/>`;
  const blush = (x, y, rx = 7, ry = 4.2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF9EB5" opacity="0.85"/>`;
  // あせ（みずいろの しずく・ひかり）
  const sweat = (x, y, s = 1) => `<path d="M${f2(x)},${f2(y)} C${f2(x - 7 * s)},${f2(y + 11 * s)} ${f2(x - 7 * s)},${f2(y + 17 * s)} ${f2(x)},${f2(y + 17 * s)} C${f2(x + 7 * s)},${f2(y + 17 * s)} ${f2(x + 7 * s)},${f2(y + 11 * s)} ${f2(x)},${f2(y)} Z" fill="#A9DDF5" ${st(2.4)}/><path d="M${f2(x - 2.6 * s)},${f2(y + 9 * s)} Q${f2(x - 3.4 * s)},${f2(y + 13 * s)} ${f2(x - 1 * s)},${f2(y + 14.5 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${f2(2 * s)}" stroke-linecap="round"/>`;
  // きらきらの め（くろい だ円・しろい ひかり 2つ）
  const shinyEye = (x, y, rx = 6.2, ry = 7.6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${K}"/><circle cx="${f2(x + rx * 0.32)}" cy="${f2(y - ry * 0.36)}" r="${f2(rx * 0.38)}" fill="#FFFFFF"/><circle cx="${f2(x - rx * 0.34)}" cy="${f2(y + ry * 0.38)}" r="${f2(rx * 0.18)}" fill="#FFFFFF"/>`;
  const gojiEye = (body) => body.replace(/^<(\w+)/, '<$1 data-anchor="eye"');

  // ---- かお（F = キャラ素材の かお。わんこ・がちゃんは 目・はな・くち、ごじは くちだけ〔目は あたまの こぶ〕）----
  const FACES = {
    wanko: {
      // どきどき: こまり まゆ・いつもの め・なみの くち・あせ・うすい ほっぺ
      fs_doki: (F) => [
        `<path d="M73,76 L88,71" fill="none" ${st(3.2)}/><path d="M127,76 L112,71" fill="none" ${st(3.2)}/>`,
        F.normal[0], F.normal[1], F.normal[2],
        `<path d="M92,107 Q96,102.5 100,107 Q104,111.5 108,107" fill="none" ${st(3)}/>`,
        blush(68, 101, 6, 3.4), blush(132, 101, 6, 3.4), sweat(150, 60),
      ],
      // キメ: ひだりは ウインク・みぎは きらきらの め・あいた くち・ほっぺ・きらっ
      fs_kime: (F) => [
        `<path d="M74,90 Q82,80 90,90" fill="none" ${st(3.6)}/>`, shinyEye(118, 86),
        F.smile[3], F.smile[2], blush(66, 102, 6.5, 3.8), blush(134, 102, 6.5, 3.8),
        sparkle(146, 70, 8), sparkle(160, 52, 4.6),
      ],
    },
    gachan: {
      fs_doki: (F) => [
        `<path d="M71,94 L86,89" fill="none" ${st(3.2)}/><path d="M129,94 L114,89" fill="none" ${st(3.2)}/>`,
        F.normal[0], F.normal[1], F.normal[2],
        `<path d="M91,121 Q95.5,117.5 100,121 Q104.5,124.5 109,121" fill="none" ${st(3)}/>`,
        blush(65, 120, 6.5, 3.6), blush(135, 120, 6.5, 3.6), sweat(152, 78),
      ],
      fs_kime: (F) => [
        `<path d="M72,108 Q80,98 88,108" fill="none" ${st(3.6)}/>`, shinyEye(120, 104, 6.4, 7.8),
        F.smile[2], F.smile[3], blush(64, 121), blush(136, 121),
        sparkle(150, 86, 8), sparkle(162, 66, 4.6),
      ],
    },
    goji: {
      // ごじ: め（こぶ）の うえに こまり まゆ・あせ（あたまの みぎ）
      fs_doki: (F) => [
        ...F.normal,
        gojiEye(`<path d="M47,34 L67,28" fill="none" ${st(4)}/>`), gojiEye(`<path d="M157,34 L137,28" fill="none" ${st(4)}/>`),
        blush(60, 92, 8, 4.4), blush(144, 92, 8, 4.4), sweat(184, 56, 1.1),
      ],
      // キメ: こぶの めに ほしの ひかり・ほっぺ・きらっ
      fs_kime: (F) => [
        ...F.normal,
        ...[[58, 50], [146, 50]].map(([x, y]) => gojiEye(`<g>${sparkle(x + 1, y - 2, 5.2, "#FFFFFF", 1.6)}</g>`)),
        blush(58, 90, 8.5, 4.8), blush(146, 90, 8.5, 4.8), sparkle(184, 26, 9), sparkle(198, 50, 5),
      ],
    },
  };
  for (const id in FACES) Object.assign(CHARA_FACE_EXTRA[id], FACES[id]);

  // ---- うでの ポーズ（rot: かたを まん中に まわす。ひだりの うでは + で そとから うえへ・みぎの うでは − で そとから うえへ）----
  const along = (A, t, n = 0) => [A.hand[0] + A.dir[0] * t - A.dir[1] * n, A.hand[1] + A.dir[1] * t + A.dir[0] * n];
  // ひらいた 手（てのひらと 4ほんの ゆび）
  const palm = (A) => {
    const [hx, hy] = along(A, -1), deg = (Math.atan2(A.dir[1], A.dir[0]) * 180) / Math.PI - 90;
    const finger = (a, l) => `<g transform="rotate(${f2(deg + a)} ${f2(hx)} ${f2(hy)})"><rect x="${f2(hx - 3)}" y="${f2(hy - 1)}" width="6" height="${l}" rx="3" fill="${A.fill}" ${st(2.6)}/></g>`;
    return finger(-34, 13) + finger(-12, 16) + finger(12, 16) + finger(34, 13) + `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="7.2" fill="${A.fill}" ${st(3)}/>`;
  };
  // ゆびさし（にぎった 手から 1ぽん）
  const point = (A) => {
    const [hx, hy] = along(A, -1), deg = (Math.atan2(A.dir[1], A.dir[0]) * 180) / Math.PI - 90;
    return `<g transform="rotate(${f2(deg)} ${f2(hx)} ${f2(hy)})"><rect x="${f2(hx - 3.2)}" y="${f2(hy)}" width="6.4" height="19" rx="3.2" fill="${A.fill}" ${st(2.8)}/></g><circle cx="${f2(hx)}" cy="${f2(hy)}" r="7" fill="${A.fill}" ${st(3)}/>`;
  };
  const fist = (A) => { const [hx, hy] = along(A, -1); return `<circle cx="${f2(hx)}" cy="${f2(hy)}" r="7" fill="${A.fill}" ${st(3)}/><path d="M${f2(hx - 3)},${f2(hy - 3)} Q${f2(hx)},${f2(hy - 5)} ${f2(hx + 3)},${f2(hy - 3)}" fill="none" ${st(2)}/>`; };
  // てを ふる ときの うごきの せん
  const waveLines = (A) => { const a = along(A, 8, A.side ? 12 : -12), b = along(A, 16, A.side ? 15 : -15), c = along(A, 10, A.side ? -12 : 12), d = along(A, 18, A.side ? -15 : 15); return `<path d="M${f2(a[0])},${f2(a[1])} Q${f2((a[0] + b[0]) / 2 + 4)},${f2((a[1] + b[1]) / 2)} ${f2(b[0])},${f2(b[1])} M${f2(c[0])},${f2(c[1])} Q${f2((c[0] + d[0]) / 2 - 4)},${f2((c[1] + d[1]) / 2)} ${f2(d[0])},${f2(d[1])}" fill="none" ${st(2.6)}/>`; };
  const LONG = { wanko: 1.7, gachan: 1.8 };
  const GESTURES = {
    // あたまと こし: ひだりの 手を あたまの うえに・みぎの 手は こしに（モデルの きめポーズ）
    fs_hip: { len: LONG, arms: { wanko: [{ rot: 168, front: true, deco: palm }, { rot: -26, front: true, deco: fist }], gachan: [{ rot: 160, front: true, deco: palm }, { rot: -26, front: true, deco: fist }], goji: [{ rot: 142, front: true, deco: palm }, { rot: -30, front: true, deco: fist }] } },
    // ゆびさし: ひだりの 手で カメラを ゆびさす・きらっ
    fs_point: {
      len: LONG,
      arms: { wanko: [{ rot: 86, front: true, deco: point }, { rot: -12 }], gachan: [{ rot: 82, front: true, deco: point }, { rot: -12 }], goji: [{ rot: 62, front: true, deco: point }, { rot: -10 }] },
      over: (id) => { const [x, y] = id === "goji" ? [8, 96] : id === "gachan" ? [10, 128] : [12, 112]; return sparkle(x, y, 8) + `<path d="M${x - 4},${y - 15} L${x - 8},${y - 23} M${x + 11},${y - 9} L${x + 18},${y - 14}" fill="none" ${st(3)}/>`; },
    },
    // てを ふる: ひだりの 手を うえで ふる（うごきの せん）
    fs_wave: { len: LONG, arms: { wanko: [{ rot: 126, front: true, deco: (A) => palm(A) + waveLines(A) }, {}], gachan: [{ rot: 118, front: true, deco: (A) => palm(A) + waveLines(A) }, {}], goji: [{ rot: 94, front: true, deco: (A) => palm(A) + waveLines(A) }, {}] } },
    // ほし: りょうてを ななめ うえに ひろげて ほしの かたち・きらきら
    fs_star: {
      len: LONG,
      arms: { wanko: [{ rot: 126, front: true, deco: palm }, { rot: -126, front: true, deco: palm }], gachan: [{ rot: 118, front: true, deco: palm }, { rot: -118, front: true, deco: palm }], goji: [{ rot: 84, front: true, deco: palm }, { rot: -84, front: true, deco: palm }] },
      over: (id) => { const ys = id === "goji" ? [8, 22] : id === "gachan" ? [30, 46] : [20, 36]; return sparkle(26, ys[0], 9) + sparkle(176, ys[0], 9) + sparkle(100, ys[1] - 26, 6, "#FFFFFF"); },
    },
  };
  Object.assign(CHARA_GESTURES, GESTURES);

  // ---- けいひんの 服（3人 × 4むき）----
  const ink = (w) => `stroke="${K}" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
  // 1. きらきら サングラス: ほしの かたちの レンズ（くろ）・きんの ふち・きらっ
  WEAR.fs_flash_glasses = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const lens = ctx.col[0] || "#2C2A3A", rim = ctx.col[1] || "#FFD84D";
      let o = `<path d="M-6,-3 Q0,-7 6,-3" fill="none" stroke="${K}" stroke-width="${f2(s * 1.4)}" stroke-linecap="round"/><path d="M-6,-3 Q0,-7 6,-3" fill="none" stroke="${rim}" stroke-width="${f2(s * 0.7)}" stroke-linecap="round"/>`;
      for (const x of [-21, 21]) o += `<path d="${starPath(x, 0, 17, 8.4)}" fill="${lens}" stroke="${rim}" stroke-width="${f2(s * 1.4)}" stroke-linejoin="round"/><path d="${starPath(x, 0, 17, 8.4)}" fill="none" ${ink(s * 0.5)}/>` + `<path d="M${x - 7},-4 L${x - 3},-8" stroke="#FFFFFF" stroke-width="${f2(s * 0.7)}" stroke-linecap="round" opacity="0.85"/>`;
      return o + `<path d="M-38,-2 L-50,-5 M38,-2 L50,-5" fill="none" stroke="${rim}" stroke-width="${f2(s * 0.9)}" stroke-linecap="round"/>` + (ctx.view === "side" ? "" : sparkle(40, -18, 5, "#FFFFFF", s * 0.4));
    }),
  });
  // 2. ランウェイ マント: こい ローズの マント・きんの ふち・ほしの もよう（うしろは 大きな ほしと ちいさい ほし）
  WEAR.fs_runway_cape = (ctx) => {
    const c = ctx.col[0] || "#B23A6A", gold = ctx.col[1] || "#F7C948", N = ctx.a.neck, T = ctx.a.torso;
    const topW = N.w * 0.42, botW = T.w * 0.78 + 12, y0 = N.y - 2, y1 = T.bottom - 4, cx = N.x + (ctx.view === "side" ? -ctx.dx * 0.4 : 0);
    const shape = (fill, w = 3) => `<path d="M${f2(cx - topW)},${y0} C${f2(cx - topW - 10)},${f2(y0 + (y1 - y0) * 0.4)} ${f2(cx - botW)},${f2(y1 - 14)} ${f2(cx - botW)},${y1} C${f2(cx - botW * 0.4)},${y1 + 8} ${f2(cx + botW * 0.4)},${y1 + 8} ${f2(cx + botW)},${y1} C${f2(cx + botW)},${f2(y1 - 14)} ${f2(cx + topW + 10)},${f2(y0 + (y1 - y0) * 0.4)} ${f2(cx + topW)},${y0} Z" fill="${fill}" ${stroke(w)}/>`;
    const hem = `<path d="M${f2(cx - botW + 4)},${y1 - 2} C${f2(cx - botW * 0.4)},${y1 + 5} ${f2(cx + botW * 0.4)},${y1 + 5} ${f2(cx + botW - 4)},${y1 - 2}" fill="none" stroke="${gold}" stroke-width="5" stroke-linecap="round"/>`;
    if (ctx.view === "back") {
      const my = y0 + (y1 - y0) * 0.45;
      return { top: shape(c) + hem + `<path d="${starPath(cx, my, 14, 6)}" fill="${gold}" ${stroke(3)}/>` + [[-0.5, 0.22], [0.52, 0.3], [-0.42, 0.72], [0.46, 0.78]].map(([u, v]) => `<path d="${starPath(cx + u * botW, y0 + (y1 - y0) * v, 4.6, 2)}" fill="#FFF3C4"/>`).join("") };
    }
    return {
      behind: shape(c) + hem,
      top: neckWrap(ctx, (s) => `<path d="M-46,-4 C-20,6 20,6 46,-4 L44,6 C20,14 -20,14 -44,6 Z" fill="${c}" ${stroke(s)}/><path d="${starPath(0, 9, 9, 4)}" fill="${gold}" ${stroke(s * 0.8)}/>`),
    };
  };
  // 3. スターの ティアラ: きんの わ・まんなかに ピンクの ほしの いし・よこに ちいさな いし
  WEAR.fs_star_tiara = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const g = ctx.col[0] || "#F7E07A", gem = ctx.col[1] || "#FF9EC4", side = ctx.view === "side", back = ctx.view === "back";
      let o = `<path d="M-40,-4 C-20,-12 20,-12 40,-4 L36,4 C18,-2 -18,-2 -36,4 Z" fill="${g}" ${stroke(s * 0.8)}/>`;
      if (back) return o;
      o += `<path d="M-30,-6 L-22,-22 L-12,-9 L0,-34 L12,-9 L22,-22 L30,-6 Z" fill="${g}" ${stroke(s * 0.8)}/>`;
      o += `<path d="${starPath(0, -16, 9, 4)}" fill="${gem}" ${stroke(s * 0.6)}/>` + `<circle cx="-22" cy="-15" r="3.6" fill="#9FD8F2" ${stroke(s * 0.45)}/><circle cx="22" cy="-15" r="3.6" fill="#9FD8F2" ${stroke(s * 0.45)}/>`;
      return o + (side ? "" : sparkle(16, -38, 5, "#FFFFFF", s * 0.35));
    }),
  });
  // 4. ベストドレッサーの たすき: みぎの かたから ひだりの こしへ ななめに（あかい おび・きんの ふち・「ベスト」）。よこ・うしろも ななめ
  WEAR.fs_best_sash = (ctx) => {
    const c = ctx.col[0] || "#E8434F", gold = ctx.col[1] || "#F7C948", N = ctx.a.neck, T = ctx.a.torso;
    const view = ctx.view, sx = view === "side" ? -ctx.dx * 0.3 : 0, x0 = N.x + N.w * 0.36 + sx, y0 = N.y - 2, x1 = N.x - T.w * 0.42 + sx, y1 = T.bottom - 18, wd = 13;
    const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny), ox = (nx / L) * wd, oy = (ny / L) * wd;
    const band = (flip) => {
      const a = flip ? [2 * N.x - x0, y0] : [x0, y0], b = flip ? [2 * N.x - x1, y1] : [x1, y1], k = flip ? -1 : 1;
      return `<path d="M${f2(a[0] - ox * k)},${f2(a[1] - oy)} L${f2(a[0] + ox * k)},${f2(a[1] + oy)} L${f2(b[0] + ox * k)},${f2(b[1] + oy)} L${f2(b[0] - ox * k)},${f2(b[1] - oy)} Z" fill="${c}" ${stroke(3)}/>` +
        `<path d="M${f2(a[0] - ox * 0.62 * k)},${f2(a[1] - oy * 0.62)} L${f2(b[0] - ox * 0.62 * k)},${f2(b[1] - oy * 0.62)} M${f2(a[0] + ox * 0.62 * k)},${f2(a[1] + oy * 0.62)} L${f2(b[0] + ox * 0.62 * k)},${f2(b[1] + oy * 0.62)}" fill="none" stroke="${gold}" stroke-width="2.4" stroke-linecap="round"/>`;
    };
    if (view === "back") return { top: band(true) };
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const word = view === "side" ? "" : `<text x="${f2(mx)}" y="${f2(my + 4)}" font-size="11" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="#FFF6D8" transform="rotate(${f2(ang - 180)} ${f2(mx)} ${f2(my)})">ベスト</text>`;
    return { top: band(false) + word + `<g transform="translate(${f2(x1)} ${f2(y1)})"><path d="M-9,4 L-14,20 L-6,15 L0,22 Z" fill="${c}" ${stroke(2.4)}/><circle cx="0" cy="0" r="8" fill="${gold}" ${stroke(2.6)}/><path d="${starPath(0, 0, 5, 2.2)}" fill="${c}"/></g>` };
  };

  // ---- トロフィー（へやの 立体: だい と 2D の カップ）----
  const TROPHY = {
    fs_trophy_bronze: { cup: ["#D9A06B", "#B5794B"], h: 46, base: "#6E5A4E", star: false },
    fs_trophy_silver: { cup: ["#DCE3EE", "#AEB8C8"], h: 50, base: "#5E6475", star: false },
    fs_trophy_gold: { cup: ["#FFD966", "#E0A82E"], h: 54, base: "#4E4B7A", star: false },
    fs_trophy_grand: { cup: ["#FFE07A", "#E6A91F"], h: 64, base: "#3B3363", star: true },
  };
  const cupSvg = (T, ribbon) => {
    const [c1, c2] = T.cup, w = 46, h = T.h;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 20} ${h + 8}">` +
      `<path d="M10,${h * 0.18} C0,${h * 0.18} 0,${h * 0.5} 14,${h * 0.52} M${w + 10},${h * 0.18} C${w + 20},${h * 0.18} ${w + 20},${h * 0.5} ${w + 6},${h * 0.52}" fill="none" stroke="${K}" stroke-width="5"/><path d="M10,${h * 0.18} C0,${h * 0.18} 0,${h * 0.5} 14,${h * 0.52} M${w + 10},${h * 0.18} C${w + 20},${h * 0.18} ${w + 20},${h * 0.5} ${w + 6},${h * 0.52}" fill="none" stroke="${c2}" stroke-width="2.4"/>` +
      `<path d="M10,4 L${w + 10},4 L${w + 4},${h * 0.5} C${w - 2},${h * 0.66} 16,${h * 0.66} 16,${h * 0.5} Z" fill="${c1}" ${st(2.4)}/>` +
      `<path d="M16,10 L19,${h * 0.42}" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.6"/>` +
      `<rect x="${w / 2 + 5}" y="${h * 0.62}" width="10" height="${h * 0.18}" fill="${c2}" ${st(2)}/>` +
      `<path d="M${w / 2 - 6},${h * 0.8} L${w / 2 + 26},${h * 0.8} L${w / 2 + 30},${h} L${w / 2 - 10},${h} Z" fill="${c2}" ${st(2.2)}/>` +
      (T.star ? `<path d="${starPath(w / 2 + 10, h * 0.28, 9, 4)}" fill="#FFFFFF" ${st(1.8)}/>` : `<circle cx="${w / 2 + 10}" cy="${h * 0.28}" r="6.5" fill="${c2}" ${st(1.8)}/>`) +
      (ribbon ? `<path d="M${w / 2 + 2},${h * 0.66} L${w / 2 - 4},${h * 0.92} L${w / 2 + 4},${h * 0.86} L${w / 2 + 8},${h * 0.96} Z" fill="#E8434F" ${st(1.6)}/>` : "") + `</svg>`;
  };
  const MT = {};
  for (const [id, T] of Object.entries(TROPHY)) {
    MT[id] = (k) => {
      const { cyl, at, d } = k, cy = -d / 2, svg = cupSvg(T, id === "fs_trophy_grand").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), w = 46 + 20, h = T.h + 8;
      let s = k.shadow(0.12, 6, 18) + cyl(0, cy, 0, 17, 10, shadeHex(T.base, -0.12), T.base) + cyl(0, cy, 10, 13, 6, shadeHex(T.base, 0.1), shadeHex(T.base, 0.25));
      return s + at(0, cy, 16, `<g transform="translate(${-w / 2} ${-h})">${svg}</g>`, w / 2 + 2, h + 2);
    };
  }
  function shadeHex(hex, k) { return typeof MallArt !== "undefined" ? MallArt.shade(hex, k) : hex; }
  for (const [id, fn] of Object.entries(MT)) { FurnModels.register(id, fn); FURN_ART[id] = () => HomeDesign.model(id).full; }

  // ---- きねん しゃしん（300×400。キャンバスに 描く）----
  // はいけい（テーマの いろ・ランウェイ・ライト）は SvgCache（キーは テーマ・ランク・ピクセルの はば だけ）
  const PW = 300, PH = 400;
  const bgSvg = (themeId, rankId) => {
    const T = FashionShow.THEME[themeId] || FashionShow.THEMES[0], R = FashionShow.RANK[rankId] || FashionShow.RANKS[4], c = T.col;
    let s = `<defs><linearGradient id="fsp-sky-${themeId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1838"/><stop offset="1" stop-color="#3A2F66"/></linearGradient></defs>`;
    s += `<rect width="${PW}" height="${PH}" fill="url(#fsp-sky-${themeId})"/>`;
    // うしろの LED と ロゴ
    s += `<rect x="30" y="26" width="240" height="96" rx="12" fill="${c}" fill-opacity="0.35" stroke="#F7E3A1" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) s += `<circle cx="${36 + i * 20.5}" cy="20" r="3" fill="#FFF3C4"/>`;
    s += `<text x="150" y="66" font-size="22" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c',sans-serif" fill="#FFFFFF" stroke="${K}" stroke-width="5" paint-order="stroke">ぽかぽか コレクション</text>`;
    s += `<text x="150" y="98" font-size="16" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c',sans-serif" fill="#FFF3C4">テーマ「${T.name}」</text>`;
    // スポットライト
    for (const x of [60, 150, 240]) s += `<path d="M${x},0 L${x - 46},${PH} L${x + 46},${PH} Z" fill="#FFF7D6" fill-opacity="0.08"/>`;
    // ランウェイ（さきが てまえ）
    s += `<path d="M118,150 L182,150 L262,${PH} L38,${PH} Z" fill="#F4EEF8" stroke="${K}" stroke-width="3"/><path d="M150,150 L150,${PH}" stroke="${c}" stroke-width="6" opacity="0.5"/>`;
    for (let i = 0; i < 9; i++) { const t = i / 8, y = 150 + t * (PH - 150), xl = 118 - t * 80, xr = 182 + t * 80; s += `<circle cx="${f2(xl)}" cy="${f2(y)}" r="2.6" fill="#FFE07A"/><circle cx="${f2(xr)}" cy="${f2(y)}" r="2.6" fill="#FFE07A"/>`; }
    // かみふぶき
    const conf = [[24, 140, "#FF8FB8"], [272, 128, "#7FD3F0"], [48, 210, "#FFE07A"], [258, 230, "#B79BEA"], [34, 300, "#7CCB6B"], [268, 320, "#FF8FB8"], [90, 120, "#FFE07A"], [214, 116, "#7CCB6B"]];
    for (const [x, y, f] of conf) s += `<rect x="${x}" y="${y}" width="8" height="12" rx="2" fill="${f}" transform="rotate(${(x * 7) % 50 - 25} ${x} ${y})"/>`;
    // ランクの リボン（したの ほう）
    s += `<path d="M40,328 L260,328 L250,348 L260,368 L40,368 L50,348 Z" fill="${R.col}" stroke="${K}" stroke-width="3"/>`;
    s += `<text x="150" y="356" font-size="18" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c',sans-serif" fill="${K}">${R.name}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}">${s}</svg>`;
  };
  // しゃしんを 描く（ph = FashionShow の しゃしんの データ）。x, y は 左上・w は はば
  const drawPhoto = (ctx, ph, x, y, w) => {
    const k = w / PW, px = Math.max(8, Math.ceil((w * (G.px || 2)) / 8) * 8);
    const bg = SvgCache.get(`fsphoto:${ph.th}:${ph.rk}:${px}`, () => bgSvg(ph.th, ph.rk), px, Math.round((px * PH) / PW));
    ctx.save(); ctx.beginPath(); U.rr(ctx, x, y, w, w * (PH / PW), 10 * k); ctx.clip();
    if (bg) ctx.drawImage(bg, x, y, w, w * (PH / PW)); else { ctx.fillStyle = "#2B2447"; ctx.fillRect(x, y, w, w * (PH / PW)); }
    // 3人（まんなかが ならびの 1ばんめ）
    const order = Array.isArray(ph.r) ? ph.r : Save.d.order, spots = [[0.5, 300, 118], [0.24, 318, 104], [0.76, 318, 104]];
    const idx = [1, 0, 2];
    for (const j of idx) {
      const id = order[j]; if (!id || !ph.o || !ph.o[id]) continue;
      const [ox, oy, size] = spots[j], [outfit, color] = ph.o[id];
      Chara.draw(ctx, id, { pose: "idle_01", dir: "down", face: (ph.fc && ph.fc[id]) || "smile", outfit, color, gesture: (ph.g && ph.g[id]) || "heart" }, x + ox * w, y + oy * k, size * k);
    }
    ctx.restore();
    // ひづけ と てんすう（したの はし）
    const day = new Date(ph.t || Date.now()), txt = `${day.getMonth() + 1}がつ ${day.getDate()}にち ・ ${ph.s}てん`;
    ctx.save(); ctx.font = `900 ${f2(12 * k)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 3 * k; ctx.lineJoin = "round";
    ctx.strokeText(txt, x + w / 2, y + 396 * k - 2 * k); ctx.fillText(txt, x + w / 2, y + 396 * k - 2 * k); ctx.restore();
  };
  // しゃしんに でる 3人の 絵を さきに よむ
  const preloadPhoto = (ph, w) => {
    const order = Array.isArray(ph.r) ? ph.r : Save.d.order, spots = [118, 104, 104], k = w / PW, list = [];
    order.forEach((id, j) => { if (ph.o && ph.o[id]) { const [outfit, color] = ph.o[id]; list.push(Chara.preload([[id, { pose: "idle_01", dir: "down", face: (ph.fc && ph.fc[id]) || "smile", outfit, color, gesture: (ph.g && ph.g[id]) || "heart" }]], spots[j] * k)); } });
    const px = Math.max(8, Math.ceil((w * (G.px || 2)) / 8) * 8);
    list.push(SvgCache.ensure(`fsphoto:${ph.th}:${ph.rk}:${px}`, () => bgSvg(ph.th, ph.rk), px, Math.round((px * PH) / PW)));
    return Promise.all(list);
  };

  return { FACES, GESTURES, TROPHY, PW, PH, sparkle, cupSvg, bgSvg, drawPhoto, preloadPhoto };
})();
