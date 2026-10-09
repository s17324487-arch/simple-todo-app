// いちばんくじの いれかわる けいひんの 絵（UI-112。データは js/kuji-rotation.js・しくみは js/ichiban-kuji.js）。
// ・ローリソン「よるの パジャマ パーティー」: ナイトキャップの ごじ（ほしの まくら）・ひつじの きぐるみの わんこ・ホットミルクの がちゃん・3人の おふとん。
//   みかづき・ほし・くもの クッション・よぞらの マグ・パジャマの アクリル スタンド・クーポン・シール・タペストリー・パジャマ ポーチ（もちもの）。
// ・せぶんぶん「フルーツ パーラー」: いちごの ずきんの わんこ・レモンの がちゃん・メロンの ごじ・3人の ジャンボ パフェ。
//   いちご・みかん・ぶどうの クッション・フルーツ グラス・ちび ぬいぐるみ・クーポン・シール・タペストリー・ギンガムの トート（もちもの）。
// ・絵は KujiArt の ぶひん（KujiArt.parts）で 描いて KujiArt.PLUSH・ART・STK に たす（KujiArt.pic・sticker が そのまま つかう）。
// ・線は INK。SVG の id は つかわない。キラキラの えんしゅつは つけない（UI-50）。どれも この ゲームの ための オリジナルの 絵。
const KujiRotationArt = (() => {
  const A = KujiArt, K = INK;
  const { f1, P, L, E, C, R, grp, svg, place, shine, seamE, tag, cheek, WAN, GAC, GOJ, wankoFace, wankoHead, wankoTail, wankoBody, paw, foot, gachanFace, gachanHead, gachanBody, wing, gfoot, gojiShape, gojiEars, gojiMouth, gojiArm, gojiTail, gfootGoji, gojiBody, stripes, criss, face, smallHead } = A.parts;
  const NI = { c: "#4E5FA8", d: "#33407A", l: "#E3E6F6", moon: "#F7DC6F", star: "#FFE58A" };
  const FR = { c: "#E5517A", d: "#B23458", l: "#FFE9EF", berry: "#E8404F", leaf: "#5DB35D", lemon: "#F7DD4A", lemonD: "#D9B92E", melon: "#A9D86E", melonD: "#7DB548", grape: "#8E5FB5", orange: "#F4A13A", cream: "#FFFDF6" };
  const SC = StickerArt.cut, puff = StickerArt.puff;
  const circleD = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;

  // ---- ぶひん ----
  const starD = (cx, cy, r, ri = r * 0.48) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? ri : r; d += (i ? " L" : "M") + f1(cx + Math.cos(a) * q) + "," + f1(cy + Math.sin(a) * q); } return d + " Z"; };
  const star = (cx, cy, r, fill = NI.star, w = 1.6) => P(starD(cx, cy, r), fill, w);
  const tinyStar = (cx, cy, r, fill = NI.star) => `<path d="${starD(cx, cy, r)}" fill="${fill}" stroke="none"/>`;
  // みかづき: そとの えんの ひだりがわ（T → B）と すこし ちいさい えんで もどる（B → T）
  const moonD = (cx, cy, r) => { const tx = f1(cx + r * 0.5), ty = f1(cy - r * 0.866), by = f1(cy + r * 0.866); return `M${tx},${ty} A${f1(r)},${f1(r)} 0 1,0 ${tx},${by} A${f1(r * 0.95)},${f1(r * 0.95)} 0 0,1 ${tx},${ty} Z`; };
  const sleepyEyes = (dx = 12, y = 0, s = 1) => L(`M${f1(-dx - 4 * s)},${f1(y)} q${f1(4 * s)},${f1(3.4 * s)} ${f1(8 * s)},0 M${f1(dx - 4 * s)},${f1(y)} q${f1(4 * s)},${f1(3.4 * s)} ${f1(8 * s)},0`, K, 2.2 * s);
  const zzz = (x, y, s = 1) => grp(x, y, s, L("M0,0 h7 l-7,8 h7 M10,-10 h5 l-5,6 h5", NI.d, 1.8));
  // ナイトキャップ（したの まんなかが 0,0・はば w）
  const nightcap = (w = 60, col = NI.c) => P(`M${-w / 2},0 C${-w / 2},${-w * 0.36} ${w * 0.06},${-w * 0.58} ${w * 0.5},${-w * 0.3} C${w * 0.56},${-w * 0.24} ${w * 0.56},${-w * 0.1} ${w / 2},0 Z`, col, 2.2)
    + tinyStar(-w * 0.18, -w * 0.2, 3.4) + tinyStar(w * 0.14, -w * 0.3, 2.8) + R(-w / 2 - 2, -5, w + 4, 9, 4.5, "#FFFFFF", 2) + C(w * 0.52, -w * 0.32, 6, "#FFFFFF", 2);
  const ging = (x, y, w, h, col) => { let s = R(x, y, w, h, 3, "#FFFFFF", 0); for (let i = 0; i < w; i += 6) s += R(x + i, y, 3, h, 0, col + "66", 0); for (let j = 0; j < h; j += 6) s += R(x, y + j, w, 3, 0, col + "55", 0); return s; };
  const strawberry = (x, y, s = 1, faceOn = false) => grp(x, y, s, P("M0,16 C-16,6 -18,-8 -10,-12 C-4,-15 4,-15 10,-12 C18,-8 16,6 0,16 Z", FR.berry, 2) + [[-6, -4], [4, -6], [-2, 4], [7, 2], [-9, 2], [1, 10]].map(([a, b]) => E(a, b, 1, 1.6, "#FFE9A8", 0)).join("") + P("M-9,-12 L-4,-18 L0,-13 L4,-18 L9,-12 C4,-9 -4,-9 -9,-12 Z", FR.leaf, 1.6) + (faceOn ? face(0, 0, 0.9) : ""));
  const lemonSlice = (x, y, r, s = 1) => grp(x, y, s, C(0, 0, r, FR.lemon, 2.2) + C(0, 0, r * 0.8, "#FFF6B8", 1.2) + Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return L(`M0,0 L${f1(Math.cos(a) * r * 0.78)},${f1(Math.sin(a) * r * 0.78)}`, FR.lemonD, 1.2); }).join("") + C(0, 0, 2, FR.lemonD, 0));
  const cherry = (x, y, s = 1) => grp(x, y, s, L("M-4,-2 Q0,-16 6,-18 M4,0 Q4,-12 6,-18", "#6B8E3A", 1.6) + C(-5, 2, 5, "#D7263D", 1.6) + C(5, 3, 5, "#D7263D", 1.6) + C(-6.4, 0.4, 1.4, "#FFFFFF", 0));
  const cupMilk = (x, y, s = 1, col = "#FFFFFF") => grp(x, y, s, P("M-11,-10 L-11,8 C-11,12 -7,14 0,14 C7,14 11,12 11,8 L11,-10 Z", col, 2.2) + L("M11,-5 C19,-5 19,7 11,7", K, 3.2) + L("M11,-5 C18,-5 18,7 11,7", col, 1.6) + E(0, -10, 11, 3.6, "#FFFDF4", 2.2) + L("M-4,-16 c-4,-4 4,-6 0,-10 M5,-16 c-4,-4 4,-6 0,-10", "#B9C6CF", 1.8));
  const outfit = (store) => KUJI_ROTATION.find((T) => T.id === store).outfit;
  const charImg = (who, store, faceId = "smile") => who === "keeper" ? Art.npcSvg({ ...NeriShops.SHOPS[store].keeper, emo: "happy" }) : Chara.svg(who, { pose: "idle_01", dir: "down", face: faceId, outfit: outfit(store), color: "soft" });

  // ===================== ビッグ ぬいぐるみ =====================
  const PLUSH = {
    // ローリソン A: ナイトキャップの ごじ（ほしがらの パジャマ・ほしの まくら）
    kj_law2_a: { w: 120, h: 130, draw: () => grp(60, 76, 1, gojiTail() + gojiBody()
      + P("M-38,-2 C-38,-6 38,-6 38,-2 L39,40 C39,48 -39,48 -39,40 Z", NI.c, 2.2) + [[-24, 10], [6, 6], [24, 24], [-10, 30], [-28, 34], [14, 38]].map(([x, y]) => tinyStar(x, y, 3.6)).join("") + L("M0,-4 V44", "#FFFFFF33", 1.2)
      + gojiEars(-40) + gojiMouth(-18) + grp(0, -40, 1, nightcap(68))) + gfootGoji(44, 120) + gfootGoji(76, 120)
      + grp(60, 76, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + grp(60, 104, 1, P(starD(0, 0, 21, 12), NI.star, 2.4) + face(0, 1, 1) + shine(-6, -9, 4, 2, -20, 0.6)) + tag(98, 116, NI.c) },
    // ローリソン B: ひつじの きぐるみの わんこ（もこもこの フード・くるんの つの）
    kj_law2_b: { w: 120, h: 130, draw: () => {
      let t = grp(60, 96, 1, wankoTail() + E(0, 0, 30, 25, FR.cream) + [[-14, -8], [8, -10], [18, 6], [-18, 8], [0, 12]].map(([x, y]) => C(x, y, 6, "#FFFFFF", 1.2)).join("")) + foot(45, 121) + foot(75, 121) + paw(34, 99, 22) + paw(86, 99, -22);
      let wool = ""; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; wool += C(Math.cos(a) * 36, 2 + Math.sin(a) * 31, 11, FR.cream, 2.2); }
      t += grp(60, 56, 1, wool + E(0, 2, 38, 33, FR.cream, 0)
        + grp(-44, -4, 1, C(0, 0, 10, "#D9B27A", 2.2) + L("M0,0 m-1,0 a1.6,1.6 0 1,1 3,0 a4,4 0 1,1 -7,0 a6.4,6.4 0 1,1 12,0", "#A27C4A", 1.6))
        + grp(44, -4, 1, C(0, 0, 10, "#D9B27A", 2.2) + L("M0,0 m1,0 a1.6,1.6 0 1,0 -3,0 a4,4 0 1,0 7,0 a6.4,6.4 0 1,0 -12,0", "#A27C4A", 1.6))
        + E(0, 6, 25, 21, WAN.c, 2.2) + seamE(0, 6, 22, 18) + grp(0, 4, 0.86, wankoFace({ smile: true })));
      return t + tag(98, 116, NI.c);
    } },
    // ローリソン C: ホットミルクの がちゃん（ねむそうな め・しましまの ナイトキャップ）
    kj_law2_c: { w: 120, h: 126, draw: () => grp(60, 98, 1, gachanBody()) + wing(33, 96, 1) + wing(87, 96, -1) + gfoot(48, 119) + gfoot(72, 119)
      + grp(60, 56, 1, gachanHead({ noFace: true }) + sleepyEyes(12, 0) + P("M-8.6,9 C-5,5.6 5,5.6 8.6,9 C5,13.6 -5,13.6 -8.6,9 Z", GAC.beak, 2) + cheek(-22, 9) + cheek(22, 9)
        + grp(0, -24, 1, P("M-26,0 C-24,-22 8,-34 30,-18 C34,-14 34,-6 30,0 Z", NI.l, 2.2) + stripes(-22, 26, -16, -4, 6, NI.c, 2.6) + R(-28, -4, 58, 8, 4, NI.c, 2) + C(32, -20, 6, "#FFFFFF", 2)))
      + cupMilk(60, 100, 1.1, NI.l) + zzz(94, 34) + tag(24, 112, NI.c, -12) },
    // ローリソン ラストワン: 3人の おふとん（ほしがらの かけぶとん・まくら・ねがお）。150×104
    kj_law2_l: { w: 150, h: 104, draw: () => {
      let s = R(8, 26, 134, 26, 10, "#FFFFFF", 2.2) + L("M24,38 h102", "#E3E6F6", 2);
      s += grp(36, 40, 0.5, wankoHead({ noFace: true }) + sleepyEyes(13, 2, 1.1)) + grp(75, 36, 0.56, gachanHead({ noFace: true }) + sleepyEyes(12, 0, 1.1) + P("M-8.6,9 C-5,5.6 5,5.6 8.6,9 C5,13.6 -5,13.6 -8.6,9 Z", GAC.beak, 2));
      s += grp(114, 44, 0.5, P(gojiShape(80), GOJ.c) + gojiEars(-34) + sleepyEyes(10, -18, 1.1) + gojiMouth(-6, 0.8));
      s += P("M4,58 C30,52 120,52 146,58 L146,98 C146,102 4,102 4,98 Z", NI.c, 2.4) + R(4, 56, 142, 9, 4.5, "#FFFFFF", 2) + [[20, 78], [48, 88], [74, 74], [100, 90], [128, 78], [36, 96], [118, 96]].map(([x, y]) => tinyStar(x, y, 4.2)).join("");
      s += P(moonD(132, 72, 7), NI.moon, 1.4) + zzz(52, 14, 0.9) + zzz(98, 10, 0.9);
      return s + tag(16, 94, NI.c, -10);
    } },
    // せぶんぶん A: いちごの ずきんの わんこ（つぶつぶ・へたの ぼうし・エプロン）
    kj_sev2_a: { w: 120, h: 128, draw: () => grp(60, 94, 1, wankoTail() + wankoBody({ spots: false }) + P("M-24,-18 C-24,-20 24,-20 24,-18 L26,22 C26,26 -26,26 -26,22 Z", "#FFFFFF", 2) + R(-24, -18, 48, 6.6, 2, FR.c, 1.4) + strawberry(0, 6, 0.6))
      + foot(45, 120) + foot(75, 120) + paw(33, 97, 24) + paw(87, 97, -24)
      + grp(60, 52, 1, P("M-44,6 C-48,-30 -24,-50 0,-50 C24,-50 48,-30 44,6 C42,14 30,16 28,8 C24,-6 -24,-6 -28,8 C-30,16 -42,14 -44,6 Z", FR.berry, 2.4)
        + [[-30, -22], [-16, -38], [0, -30], [16, -40], [30, -20], [-36, -4], [36, -4], [-6, -44], [22, -28]].map(([x, y]) => E(x, y, 1.6, 2.6, "#FFE9A8", 0)).join("") + shine(-20, -34, 8, 4, -20, 0.4)
        + P("M-18,-48 L-10,-60 L-2,-50 L6,-62 L14,-50 L22,-58 L20,-46 C8,-42 -8,-42 -18,-48 Z", FR.leaf, 2) + L("M2,-52 V-66", "#3E8E43", 2.4)
        + E(0, 12, 28, 23, WAN.c, 2.2) + grp(0, 10, 0.9, wankoFace({ smile: true })))
      + tag(98, 114, FR.c) },
    // せぶんぶん B: レモンの がちゃん（わぎりの レモンの ぼうし・レモネード）
    kj_sev2_b: { w: 120, h: 126, draw: () => grp(60, 98, 1, gachanBody()) + wing(33, 96, 1) + wing(87, 96, -1) + gfoot(48, 119) + gfoot(72, 119)
      + grp(60, 56, 1, gachanHead({ smile: true }) + grp(8, -30, 1, lemonSlice(0, 0, 18), -14) + E(-24, -26, 6, 3.4, FR.leaf, 1.6, -30))
      + grp(60, 98, 1, P("M-10,-14 L-8,14 C-8,17 8,17 8,14 L10,-14 Z", "#FFF6B8", 2.2) + R(-9, -6, 18, 3, 0, FR.lemon, 0) + L("M3,-14 L9,-28", "#E5517A", 2.6) + lemonSlice(-8, -14, 5.4)) + tag(24, 112, FR.c, -12) },
    // せぶんぶん C: メロンの ごじ（あみめの きぐるみ・へた）
    kj_sev2_c: { w: 120, h: 130, draw: () => grp(60, 76, 1, gojiTail() + P(gojiShape(100), FR.melon) + `<g opacity="0.9">${criss(38, 46, 46, 10, FR.melonD, 1.6)}</g>` + shine(-20, -30, 9, 5, -30, 0.35)
      + gojiEars(-40) + gojiMouth(-16) + P("M-4,-50 C-6,-60 2,-66 6,-62 C4,-58 2,-54 4,-50 Z", "#6B8E3A", 2) + E(10, -56, 8, 4, FR.leaf, 1.6, -20))
      + gfootGoji(44, 120) + gfootGoji(76, 120) + grp(60, 76, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + tag(98, 116, FR.c) },
    // せぶんぶん ラストワン: 3人の ジャンボ パフェ（グラス・クリーム・いちご・さくらんぼ）。130×140
    kj_sev2_l: { w: 130, h: 140, draw: () => {
      let s = P("M18,62 C18,52 112,52 112,62 L96,116 C94,122 36,122 34,116 Z", "#EAF6FB", 2.4, 'fill-opacity=".95"');
      s += P("M24,64 H106 L100,84 H30 Z", FR.cream, 0) + P("M30,84 H100 L95,100 H35 Z", FR.berry, 0) + P("M35,100 H95 L92,112 H38 Z", FR.lemon, 0);
      s += L("M24,64 H106 M30,84 H100 M35,100 H95", "#00000022", 1.2) + E(65, 58, 46, 10, FR.cream, 2.2) + L("M100,66 L94,112", "#FFFFFF88", 2.4);
      // クリームの うえに 3人（ごじ・わんこ・がちゃん）と いちご・さくらんぼ
      s += grp(98, 40, 0.42, P(gojiShape(80), GOJ.c) + gojiEars(-34) + gojiMouth(-14, 0.9)) + grp(32, 40, 0.46, wankoHead({ smile: true })) + grp(65, 34, 0.5, gachanHead({ smile: true }));
      s += strawberry(14, 56, 0.6) + strawberry(116, 56, 0.6) + cherry(65, 12, 0.9);
      s += R(56, 120, 18, 10, 2, "#EAF6FB", 2.2) + E(65, 132, 26, 6, "#EAF6FB", 2.2);
      return s + tag(108, 128, FR.c, 10);
    } },
  };

  // ===================== クッション・マグ／グラス・スタンド・タペストリー・クーポン =====================
  const ART = {
    kj_law2_d0: { w: 70, h: 50, draw: () => P(moonD(34, 25, 22), NI.moon, 2.4) + face(24, 26, 1) + shine(22, 10, 5, 2.4, -30, 0.5) },
    kj_law2_d1: { w: 66, h: 54, draw: () => P(starD(33, 29, 26, 14), NI.star, 2.4) + face(33, 31, 1.05) + shine(26, 16, 4, 2, -20, 0.6) },
    kj_law2_d2: { w: 72, h: 44, draw: () => P("M10,38 C2,38 2,24 12,24 C10,12 26,6 34,14 C38,4 56,6 56,18 C66,16 70,30 62,38 Z", "#FFFFFF", 2.4) + face(36, 28, 1.05) + shine(22, 18, 6, 2.4, -10, 0.6) },
    kj_sev2_d0: { w: 64, h: 54, draw: () => grp(32, 30, 1.6, P("M0,16 C-16,6 -18,-8 -10,-12 C-4,-15 4,-15 10,-12 C18,-8 16,6 0,16 Z", FR.berry, 1.5) + [[-6, -4], [4, -6], [-2, 4], [7, 2], [-9, 2], [1, 10]].map(([a, b]) => E(a, b, 0.8, 1.2, "#FFE9A8", 0)).join("") + P("M-9,-12 L-4,-18 L0,-13 L4,-18 L9,-12 C4,-9 -4,-9 -9,-12 Z", FR.leaf, 1.2)) + face(32, 32, 1) },
    kj_sev2_d1: { w: 64, h: 50, draw: () => E(32, 28, 28, 20, FR.orange, 2.4) + [[20, 20], [28, 14], [40, 18], [46, 30], [18, 34]].map(([x, y]) => C(x, y, 1, "#D9852A", 0)).join("") + E(34, 9, 9, 4, FR.leaf, 1.8, -18) + L("M32,10 V6", "#6B8E3A", 2) + face(32, 30, 1.05) + shine(18, 18, 6, 3, -30, 0.4) },
    kj_sev2_d2: { w: 60, h: 58, draw: () => [[18, 18], [30, 16], [42, 18], [24, 28], [36, 28], [48, 28], [12, 28], [18, 38], [30, 38], [42, 38], [24, 48], [36, 48]].map(([x, y]) => C(x, y, 7.4, FR.grape, 2)).join("") + [[16, 16], [28, 26], [40, 36]].map(([x, y]) => C(x, y, 2, "#FFFFFF88", 0)).join("") + E(36, 7, 9, 4, FR.leaf, 1.8, -20) + L("M30,10 V3", "#6B8E3A", 2) + face(30, 32, 0.9) },
  };
  // マグ（ローリソン E）: よぞらいろ・おつきさま・ねがお
  for (const [k, who] of [["e0", "wanko"], ["e1", "gachan"], ["e2", "goji"]]) ART["kj_law2_" + k] = { w: 40, h: 42, draw: () => P("M5,8 L5,34 C5,38 10,40 18,40 C26,40 31,38 31,34 L31,8 Z", NI.c, 2) + L("M31,14 C39,14 39,28 31,28", K, 3.2) + L("M31,14 C38,14 38,28 31,28", NI.c, 1.6) + E(18, 8, 13, 3.4, NI.l, 2) + P(moonD(11, 18, 4.4), NI.moon, 1) + tinyStar(26, 14, 2.4) + tinyStar(9, 32, 2) + grp(19, 27, 0.2, smallHead(who)) };
  // グラス（せぶんぶん E）: すきとおった グラス・くだものの え・ふちに 3人
  const FRUIT_OF = { wanko: (x, y) => strawberry(x, y, 0.42), gachan: (x, y) => lemonSlice(x, y, 6), goji: (x, y) => grp(x, y, 1, C(0, 0, 6.6, FR.melon, 1.6) + L("M-4,-2 l8,4 M-4,2 l8,-4", FR.melonD, 1)) };
  for (const [k, who] of [["e0", "wanko"], ["e1", "gachan"], ["e2", "goji"]]) ART["kj_sev2_" + k] = { w: 40, h: 42, draw: () => P("M6,12 L9,38 C9,41 27,41 27,38 L30,12 Z", "#EAF6FB", 2, 'fill-opacity=".9"') + R(9, 22, 18, 14, 2, FR.l, 0) + FRUIT_OF[who](18, 29) + E(18, 12, 12, 3, "#FFFFFF", 1.8) + L("M11,16 L13,34", "#FFFFFF", 1.6) + grp(28, 12, 0.14, smallHead(who)) };
  // アクリル スタンド（ローリソン G）: よぞらの はいけいに パジャマの キャラ
  for (const [k, who] of [["g0", "wanko"], ["g1", "gachan"], ["g2", "goji"], ["g3", "keeper"]]) ART["kj_law2_" + k] = { w: 40, h: 58, draw: () => R(3, 2, 34, 48, 6, "#E8F4FB", 1.6, 'fill-opacity=".85"') + R(5, 4, 30, 44, 5, NI.c, 0) + P(moonD(28, 11, 4.6), NI.moon, 0) + tinyStar(10, 10, 2.2) + tinyStar(30, 26, 1.8) + place(charImg(who, "lawson"), 4, 8, 32, 40) + L("M8,8 L12,4", "#FFFFFF", 1.6) + E(20, 52, 15, 4, "#DDEBF6", 1.6) + R(12, 48, 16, 4, 1, "#C9D9E6", 1.2) };
  // ちび ぬいぐるみ（せぶんぶん G）: いちごの ニットぼうと エプロン・ボールチェーン・タグ
  for (const [k, who] of [["g0", "wanko"], ["g1", "gachan"], ["g2", "goji"], ["g3", "keeper"]]) ART["kj_sev2_" + k] = { w: 44, h: 50, draw: () => place(charImg(who, "sevenbun"), 2, 6, 40, 44) + L("M22,2 V8", "#B9BDC2", 1.4) + C(22, 2.4, 2.4, "#E3E6EA", 1.2) + tag(34, 42, FR.c, 10, 0.7) };
  // タペストリー（ダブルチャンスしょう）
  const tapestry = (store) => {
    const law = store === "lawson", col = law ? NI.c : FR.c, bg = law ? NI.l : FR.l;
    let s = R(2, 4, 66, 5, 2.4, "#C9A36A", 1.8) + L("M14,4 L35,-2 L56,4", "#8A6A4A", 1.4);
    s += P("M6,8 H64 V82 L56,90 L49,82 L42,90 L35,82 L28,90 L21,82 L14,90 L6,82 Z", bg, 2) + R(6, 8, 58, 8, 0, col, 1.6);
    s += law ? P(moonD(52, 26, 6), NI.moon, 1.2) + tinyStar(16, 24, 3) + tinyStar(36, 20, 2.4) : strawberry(16, 26, 0.36) + lemonSlice(54, 25, 5) + cherry(36, 24, 0.6);
    s += place(charImg("wanko", store), 4, 28, 24, 44) + place(charImg("goji", store), 42, 28, 24, 44) + place(charImg("gachan", store), 23, 34, 24, 38);
    s += law ? stripes(8, 62, 74, 80, 6, NI.c, 1.6) : ging(7, 72, 56, 9, FR.c);
    return s + L("M6,82 L14,90 L21,82 L28,90 L35,82 L42,90 L49,82 L56,90 L64,82", K, 1.6);
  };
  ART.kj_law2_dc = { w: 70, h: 96, draw: () => tapestry("lawson") };
  ART.kj_sev2_dc = { w: 70, h: 96, draw: () => tapestry("sevenbun") };
  // クーポンけん（Hしょう）: きりとりせん・たべものの え（なんでもは ほし）・「むりょう」
  const FOOD_OF = { kj_law2_h0: "milk", kj_law2_h1: "cv_milktea", kj_law2_h2: "cv_dorayaki", kj_sev2_h0: "deza_jelly", kj_sev2_h1: "cv_softcream", kj_sev2_h2: "juice" };
  for (const T of ["law2", "sev2"]) for (const k of ["h0", "h1", "h2", "h3"]) {
    const id = `kj_${T}_${k}`, law = T === "law2", col = law ? NI.c : FR.c, bg = law ? "#EEF0FA" : "#FFF0F4";
    ART[id] = { w: 120, h: 60, draw: () => {
      const food = FOOD_OF[id];
      let s = P("M4,8 H116 V24 C110,24 110,36 116,36 V52 H4 V36 C10,36 10,24 4,24 Z", "#FFFFFF", 2.2) + R(8, 12, 104, 36, 4, bg, 0) + P("M4,8 H26 V52 H4 V36 C10,36 10,24 4,24 Z", col, 2.2) + L("M30,10 V50", "#C9C2B4", 1.4, 'stroke-dasharray="2.4 2.4"');
      s += food ? place(Art.iconSvg("bag", food), 33, 14, 30, 32, "xMidYMid meet") : grp(48, 30, 1, P(starD(0, 0, 12), law ? NI.star : "#FFD54F", 1.8));
      s += `<text x="86" y="34.5" text-anchor="middle" font-size="11.5" font-weight="bold" font-family="sans-serif" textLength="42" lengthAdjust="spacingAndGlyphs" fill="${col}" stroke="none">むりょう</text>`;
      return s + (law ? P(moonD(15, 22, 4.6), "#FFFFFF", 0) + tinyStar(15, 38, 4.4, "#FFFFFF") : C(15, 22, 4.6, "#FFFFFF", 0) + C(15, 38, 4.6, "#FFFFFF", 0));
    } };
  }

  // ===================== シール（シールちょう 100×100）=====================
  const STK = {
    stk_kjlaw2_wanko: () => SC(circleD(50, 52, 38), NI.l) + grp(50, 60, 0.7, wankoHead({ noFace: true }) + sleepyEyes(13, 2, 1.2)) + grp(50, 38, 0.62, nightcap(66)) + puff(50, 52, 38),
    stk_kjlaw2_gachan: () => SC(circleD(50, 52, 38), NI.l) + grp(50, 60, 0.74, gachanHead({ smile: true })) + grp(50, 38, 0.6, nightcap(64, "#88A6E0")) + puff(50, 52, 38),
    stk_kjlaw2_goji: () => SC(circleD(50, 52, 38), NI.l) + grp(50, 64, 0.6, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + grp(50, 42, 0.6, nightcap(66)) + puff(50, 52, 38),
    stk_kjlaw2_moon: () => SC(circleD(50, 52, 38), NI.c) + P(moonD(50, 52, 26), NI.moon, 2.4) + face(42, 54, 1.4) + tinyStar(74, 30, 5) + tinyStar(70, 72, 3.6) + puff(50, 52, 38),
    stk_kjlaw2_star: () => SC(starD(50, 54, 40, 21), NI.star) + face(50, 56, 1.5) + puff(50, 50, 26),
    stk_kjlaw2_sheep: () => { let w = ""; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; w += C(50 + Math.cos(a) * 26, 52 + Math.sin(a) * 22, 12, FR.cream, 2); } return SC(circleD(50, 52, 40), "#FFFDF6") + w + E(50, 52, 26, 22, FR.cream, 0) + E(50, 56, 15, 13, "#5A4E44", 2) + C(45, 54, 1.6, "#FFFFFF", 0) + C(55, 54, 1.6, "#FFFFFF", 0) + puff(50, 50, 30); },
    stk_kjlaw2_milk: () => SC(circleD(50, 54, 36), "#EEF0FA") + cupMilk(48, 60, 1.9, "#FFFFFF") + puff(50, 54, 36),
    stk_kjsev2_wanko: () => SC(circleD(50, 52, 38), FR.l) + grp(50, 58, 0.7, wankoHead({ smile: true })) + grp(50, 30, 0.8, P("M-18,6 L-10,-6 L-2,4 L6,-8 L14,4 L22,-4 L20,8 C8,12 -8,12 -18,6 Z", FR.leaf, 2)) + puff(50, 52, 38),
    stk_kjsev2_gachan: () => SC(circleD(50, 52, 38), "#FFF9D9") + grp(50, 58, 0.76, gachanHead({ smile: true })) + lemonSlice(62, 30, 12) + puff(50, 52, 38),
    stk_kjsev2_goji: () => SC(circleD(50, 52, 38), "#EEF8E4") + grp(50, 62, 0.62, P(gojiShape(80), FR.melon) + criss(30, 36, 36, 10, FR.melonD, 1.4) + gojiEars(-32) + gojiMouth(-12)) + puff(50, 52, 38),
    stk_kjsev2_berry: () => SC("M50,90 C18,72 10,40 24,30 C34,22 66,22 76,30 C90,40 82,72 50,90 Z", FR.berry) + [[38, 44], [56, 40], [46, 60], [64, 58], [34, 62], [52, 76]].map(([x, y]) => E(x, y, 2, 3, "#FFE9A8", 0)).join("") + P("M30,30 L40,16 L50,26 L60,14 L70,30 C58,36 42,36 30,30 Z", FR.leaf, 2) + face(50, 52, 1.4) + puff(50, 50, 28),
    stk_kjsev2_lemon: () => SC(circleD(50, 52, 38), FR.lemon) + C(50, 52, 30, "#FFF6B8", 1.6) + Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return L(`M50,52 L${f1(50 + Math.cos(a) * 29)},${f1(52 + Math.sin(a) * 29)}`, FR.lemonD, 1.6); }).join("") + face(50, 54, 1.3) + puff(50, 52, 38),
    stk_kjsev2_cherry: () => SC(circleD(50, 54, 36), "#FFF0F4") + cherry(50, 62, 2.4) + puff(50, 54, 36),
    stk_kjsev2_parfait: () => SC("M28,22 C28,14 72,14 72,22 L62,74 L58,88 H42 L38,74 Z", "#EAF6FB") + P("M32,30 H68 L64,50 H36 Z", FR.berry, 0) + P("M36,50 H64 L61,66 H39 Z", FR.lemon, 0) + E(50, 24, 24, 8, FR.cream, 1.8) + cherry(50, 14, 1) + face(50, 56, 1.1) + puff(50, 40, 22),
  };

  // ===================== もちもの（Fしょう）: パジャマ ポーチ・フルーツ トート =====================
  const TOTE = { wanko: "#E5517A", gachan: "#E3B81E", goji: "#5DB35D" };
  const bag = (ctx) => {
    const h = HandItems.hand(ctx), theme = ctx.col[0], who = ctx.col[1], law = theme === "law2";
    const x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 8, w = 32, hh = 28;
    let s;
    if (law) {
      s = L(`M${f1(x - 8)},${f1(y0 + 2)} C${f1(x - 8)},${f1(h.y - 6)} ${f1(x + 8)},${f1(h.y - 6)} ${f1(x + 8)},${f1(y0 + 2)}`, NI.d, 3);
      s += R(x - w / 2, y0, w, hh, 8, NI.c, 3) + L(`M${f1(x - w / 2 + 3)},${f1(y0 + 7)} H${f1(x + w / 2 - 3)}`, "#FFFFFF88", 2) + tinyStar(x - 9, y0 + 18, 3) + tinyStar(x + 10, y0 + 22, 2.4) + C(x + 4, y0 + 16, 7, NI.l, 1.6);
      s += grp(x + 4, y0 + 16, 0.15, smallHead(who));
    } else {
      const col = TOTE[who] || FR.c;
      s = L(`M${f1(x - 10)},${f1(y0 + 2)} C${f1(x - 10)},${f1(h.y - 10)} ${f1(x + 10)},${f1(h.y - 10)} ${f1(x + 10)},${f1(y0 + 2)}`, col, 3.4);
      s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} L${f1(x + w / 2 + 2)},${f1(y0 + hh + 4)} H${f1(x - w / 2 - 2)} Z" fill="#FFFFFF" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>` + ging(x - w / 2 + 2, y0 + 2, w - 4, hh, col);
      s += C(x, y0 + 17, 8, "#FFFFFF", 1.6) + grp(x, y0 + 17, 0.16, smallHead(who));
    }
    return { top: s };
  };

  Object.assign(A.PLUSH, PLUSH); Object.assign(A.ART, ART); Object.assign(A.STK, STK);
  return { PLUSH, ART, STK, bag, starD, moonD, charImg };
})();
