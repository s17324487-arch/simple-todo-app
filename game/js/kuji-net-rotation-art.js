// いちばんくじ「みんなの くじ」の いれかわる けいひんの 絵（UI-117。データは js/kuji-net-rotation.js・しくみは js/ichiban-kuji.js）。
// ・ローリソン「まほうの おしろ」: まほうつかいの ごじ（すいしょうだま）・きしの わんこ（ハートの たて）・ようせいの がちゃん（ほしの つえ）の とくだい ぬいぐるみ（むらさきの ベルベットの だい）・
//   ほしの ベルベット チェア・まほうの ティーカップ・まほうの ポシェット・ぎんの かがみ スタンド・ほしの クーポン・まほうの シール・ラストワンの おしろ。
// ・せぶんぶん「りゅうぐうじょう」: りゅうおうの ごじ（しんじゅ）・うらしまの わんこ（たまてばこ）・かいがらの がちゃん の とくだい ぬいぐるみ（なみの ざぶとん）・
//   かいがらの ざぶとん・なみの ラグ・たまてばこ ポーチ・さんごの おきもの・たまてばこの クーポン・りゅうぐう シール・ラストワンの りゅうぐうじょう。
// ・ぶひんは KujiArt.parts と KujiDeluxeArt.parts。KujiArt.PLUSH・ART・STK に たす（KujiArt.pic・sticker・へやの 絵が この 絵を よむ）。
// ・線は INK。SVG の id は つかわない（グラデーションも なし）。キラキラの えんしゅつは つけない（UI-50）。どれも この ゲームの ための オリジナルの 絵。
const KujiNetRotationArt = (() => {
  const A = KujiArt, D = KujiDeluxeArt.parts, K = INK;
  const { f1, P, L, E, C, R, grp, place, shine, stitch, tag, wankoHead, wankoTail, wankoBody, paw, foot, gachanHead, gachanBody, wing, gfoot, gojiShape, gojiEars, gojiMouth, gojiArm, gojiTail, gfootGoji, gojiBody, smallHead, GOJ } = A.parts;
  const { gem, pearl, ringC, ringE, ringR, pouf, medal, sheet6, ticket, flower, charaImg, keeperImg, GOLD, GOLD_L, GOLD_D, CREAM, LACQ } = D;
  // まほうの おしろ（むらさき・ぎん・よぞら）
  const PU = "#5B3FA0", PU_L = "#8C6FD1", PU_D = "#3E2A75", SIL = "#C9D1DC", SIL_L = "#EEF2F7", SIL_D = "#8E99A8", NIGHT = "#2B2F5E", STAR = "#FFE07A", SKY_B = "#4C6FB8";
  // りゅうぐうじょう（うみ・さんご・しんじゅ）
  const SEA = "#1E8A9A", SEA_L = "#7FD3D6", SEA_D = "#146270", CORAL = "#E8615A", CORAL_L = "#F59A8E", CORAL_D = "#B8423E", SAND = "#F3DFAE", KAME = "#5FA36A", KAME_D = "#3E7A4A", ROOF = "#3F9A7A";
  const SC = StickerArt.cut, puff = StickerArt.puff;
  const circleD = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
  const MAGIC_OUT = { wanko: { head: "helmet", back: "cape" }, gachan: { head: "flowercrown", back: "fairywings" }, goji: { head: "season_witchhat", back: "night_cape" } };
  const RYUGU_OUT = { wanko: { back: "shell" }, gachan: { neck: "necklace" }, goji: { head: "crown" } };

  // ===================== ぶひん =====================
  const starD = (cx, cy, r, ri = r * 0.46) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? ri : r; d += (i ? " L" : "M") + f1(cx + Math.cos(a) * q) + "," + f1(cy + Math.sin(a) * q); } return d + " Z"; };
  const star = (cx, cy, r, fill = STAR, w = 1.4) => P(starD(cx, cy, r), fill, w);
  const dotStar = (cx, cy, r, fill = STAR) => `<path d="${starD(cx, cy, r)}" fill="${fill}" stroke="none"/>`;
  // みかづき（ひだりむき・まんなか cx,cy・はんけい r）
  const moonD = (cx, cy, r) => { const tx = f1(cx + r * 0.5), ty = f1(cy - r * 0.866), by = f1(cy + r * 0.866); return `M${tx},${ty} A${f1(r)},${f1(r)} 0 1,0 ${tx},${by} A${f1(r * 0.95)},${f1(r * 0.95)} 0 0,1 ${tx},${ty} Z`; };
  // とんがりぼうし（つばの まんなか x,y・はば w）: むらさき・ほし・きんの おび
  const wizHat = (x, y, w = 60) => {
    let s = P(`M${f1(x - w * 0.3)},${f1(y)} C${f1(x - w * 0.22)},${f1(y - w * 0.5)} ${f1(x + w * 0.02)},${f1(y - w * 0.66)} ${f1(x + w * 0.36)},${f1(y - w * 0.62)} C${f1(x + w * 0.16)},${f1(y - w * 0.5)} ${f1(x + w * 0.24)},${f1(y - w * 0.22)} ${f1(x + w * 0.3)},${f1(y)} Z`, PU, 2.2);
    s += dotStar(x - w * 0.06, y - w * 0.3, 3.4) + dotStar(x + w * 0.12, y - w * 0.12, 2.6) + dotStar(x + w * 0.08, y - w * 0.46, 2.2);
    s += R(x - w * 0.31, y - 6, w * 0.62, 6, 2, GOLD, 1.6) + E(x, y + 1, w / 2, w * 0.1, PU_D, 2.2) + star(x + w * 0.36, y - w * 0.62, 4.4);
    return s;
  };
  // すいしょうだま（まんなか x,y・はんけい r）と きんの だい
  const orb = (x, y, r = 13) => R(x - r * 0.7, y + r * 0.7, r * 1.4, r * 0.55, 2, GOLD, 1.8) + C(x, y, r, "#CFEAF8", 2.2) + E(x + r * 0.15, y + r * 0.25, r * 0.55, r * 0.3, "#A6D4F0", 0) + dotStar(x + r * 0.2, y - r * 0.05, r * 0.28, "#FFFFFF") + shine(x - r * 0.4, y - r * 0.4, r * 0.3, r * 0.18, -30, 0.8);
  // ぎんの かぶと（まんなか x・あたまの うえ y・はば w）: ドーム・まえの おび・あかい はねかざり
  const helm = (x, y, w = 52) => P(`M${f1(x - w * 0.18)},${f1(y - w * 0.36)} C${f1(x - w * 0.1)},${f1(y - w * 0.66)} ${f1(x + w * 0.22)},${f1(y - w * 0.7)} ${f1(x + w * 0.18)},${f1(y - w * 0.4)} C${f1(x + w * 0.1)},${f1(y - w * 0.5)} ${f1(x)},${f1(y - w * 0.46)} ${f1(x - w * 0.18)},${f1(y - w * 0.36)} Z`, "#E25A5A", 1.8)
    + P(`M${f1(x - w / 2)},${f1(y)} C${f1(x - w / 2)},${f1(y - w * 0.56)} ${f1(x + w / 2)},${f1(y - w * 0.56)} ${f1(x + w / 2)},${f1(y)} Z`, SIL, 2.2) + R(x - w / 2 - 1, y - 6, w + 2, 8, 3, SIL_D, 2) + L(`M${f1(x - w * 0.32)},${f1(y - w * 0.18)} C${f1(x - w * 0.2)},${f1(y - w * 0.36)} ${f1(x + w * 0.04)},${f1(y - w * 0.4)} ${f1(x + w * 0.18)},${f1(y - w * 0.36)}`, SIL_L, 2.4) + C(x, y - 2, 2.4, GOLD, 1.2);
  // ハートの たて（まんなか x,y）
  const shield = (x, y, s = 1) => grp(x, y, s, P("M0,-16 C6,-16 14,-14 14,-14 C14,2 8,12 0,18 C-8,12 -14,2 -14,-14 C-14,-14 -6,-16 0,-16 Z", SIL, 2.2) + P("M0,-11 C4,-11 9,-10 9,-10 C9,0 5,8 0,12 C-5,8 -9,0 -9,-10 C-9,-10 -4,-11 0,-11 Z", SKY_B, 1.4) + P("M0,6 C-7,1 -6,-6 -2,-6 C-1,-6 0,-5 0,-4 C0,-5 1,-6 2,-6 C6,-6 7,1 0,6 Z", "#F06292", 1.2));
  // ほしの つえ（もつ ところ x,y・かたむき rot）
  const wand = (x, y, rot = -20, s = 1) => grp(x, y, s, L("M0,0 L0,-26", GOLD_D, 3.4) + L("M0,0 L0,-26", GOLD_L, 1.4) + star(0, -32, 8, STAR, 1.8) + C(0, -32, 1.6, "#FFFFFF", 0), rot);
  // ようせいの はね（ひだり／みぎ）: すきとおった ラベンダー
  const fairyWing = (x, y, side, s = 1) => grp(x, y, s, P(`M0,0 C${-side * 26},-30 ${-side * 40},-6 ${-side * 30},6 C${-side * 22},14 ${-side * 8},8 0,0 Z`, "#E3D8FA", 1.8, 'fill-opacity=".85"') + P(`M0,4 C${-side * 18},10 ${-side * 26},26 ${-side * 14},28 C${-side * 6},28 ${-side * 2},16 0,4 Z`, "#D8EEFB", 1.6, 'fill-opacity=".85"') + L(`M0,2 C${-side * 12},-8 ${-side * 22},-8 ${-side * 26},0`, "#FFFFFF", 1));
  // はなの かんむり（まんなか x,y・はば w）
  const flowerCrown = (x, y, w = 40) => L(`M${f1(x - w / 2)},${f1(y + 2)} C${f1(x - w / 4)},${f1(y - 4)} ${f1(x + w / 4)},${f1(y - 4)} ${f1(x + w / 2)},${f1(y + 2)}`, "#6FAF5A", 2.4) + [[-0.42, 0, "#F7A9C4"], [-0.2, -3.4, "#FFE07A"], [0, -4.4, "#B9A3F0"], [0.2, -3.4, "#FFFFFF"], [0.42, 0, "#F7A9C4"]].map(([t, dy, c]) => flower(x + w * t, y + dy, 5, c, GOLD)).join("");
  // うみいろの なみの ざぶとん（まんなか cx・うえ top・はば w）
  const waveBase = (cx, top, w, h = 16) => {
    const l = cx - w / 2, r = cx + w / 2;
    let s = P(`M${f1(l + 6)},${f1(top)} Q${f1(cx)},${f1(top - 4)} ${f1(r - 6)},${f1(top)} Q${f1(r + 2)},${f1(top + h * 0.5)} ${f1(r)},${f1(top + h)} Q${f1(cx)},${f1(top + h + 4)} ${f1(l)},${f1(top + h)} Q${f1(l - 2)},${f1(top + h * 0.5)} ${f1(l + 6)},${f1(top)} Z`, SEA, 2.4);
    s += P(`M${f1(l)},${f1(top + h)} Q${f1(cx)},${f1(top + h + 4)} ${f1(r)},${f1(top + h)} L${f1(r - 1)},${f1(top + h + 6)} Q${f1(cx)},${f1(top + h + 10)} ${f1(l + 1)},${f1(top + h + 6)} Z`, SEA_D, 2.2);
    for (let x = l + 12; x < r - 8; x += 12) s += L(`M${f1(x - 5)},${f1(top + h * 0.62)} C${f1(x - 5)},${f1(top + 2)} ${f1(x + 5)},${f1(top + 2)} ${f1(x + 5)},${f1(top + h * 0.62)}`, SEA_L, 1.4) + L(`M${f1(x - 2.6)},${f1(top + h * 0.62)} C${f1(x - 2.6)},${f1(top + 6)} ${f1(x + 2.6)},${f1(top + 6)} ${f1(x + 2.6)},${f1(top + h * 0.62)}`, SEA_L, 1.1);
    for (const x of [l + 2, r - 2]) s += pearl(x, top + h + 3, 3);
    return s;
  };
  // さんごの えだ（ねもと x,y・おおきさ s）
  const coral = (x, y, s = 1, col = CORAL) => grp(x, y, s, L("M0,0 C0,-10 -2,-16 -8,-22 M0,-8 C4,-14 10,-16 12,-24 M-4,-15 C-8,-18 -12,-18 -14,-14 M6,-14 C8,-20 6,-26 4,-30", K, 6) + L("M0,0 C0,-10 -2,-16 -8,-22 M0,-8 C4,-14 10,-16 12,-24 M-4,-15 C-8,-18 -12,-18 -14,-14 M6,-14 C8,-20 6,-26 4,-30", col, 3.6));
  // たまてばこ（まんなか x,y・はば w）: くろい うるし・きんの なみ・あかい ひも
  const tamate = (x, y, w = 26) => {
    const h = w * 0.72, l = x - w / 2;
    let s = R(l, y - h / 2, w, h, 3, LACQ, 2.2) + R(l - 1.5, y - h / 2 - 4, w + 3, 7, 2.4, LACQ, 2.2) + L(`M${f1(l + 3)},${f1(y + h * 0.1)} C${f1(l + w * 0.2)},${f1(y - h * 0.15)} ${f1(l + w * 0.36)},${f1(y - h * 0.15)} ${f1(l + w * 0.5)},${f1(y + h * 0.1)} C${f1(l + w * 0.64)},${f1(y - h * 0.15)} ${f1(l + w * 0.8)},${f1(y - h * 0.15)} ${f1(l + w - 3)},${f1(y + h * 0.1)}`, GOLD, 1.6);
    s += L(`M${f1(x)},${f1(y - h / 2 - 4)} V${f1(y + h / 2)} M${f1(l)},${f1(y)} H${f1(l + w)}`, CORAL, 2.4) + C(x, y - h / 2 - 1, 3, CORAL, 1.4) + L(`M${f1(x - 1)},${f1(y - h / 2 + 1)} L${f1(x - 5)},${f1(y - h / 2 + 8)} M${f1(x + 1)},${f1(y - h / 2 + 1)} L${f1(x + 5)},${f1(y - h / 2 + 8)}`, CORAL, 2);
    return s;
  };
  // ほたてがい（ひらいた かい。まんなかの した x,y・はば w）
  const scallop = (x, y, w, fill = "#FBE3E8", dark = "#E9B5C2", up = true) => {
    const r = w / 2, k = up ? 1 : -1, px = (a, f) => f1(x + Math.cos(a) * r * f), py = (a, f) => f1(y + Math.sin(a) * r * 0.74 * f * k); // a は π〜2π（sin が マイナス ＝ うえ）
    let d = `M${px(Math.PI, 1)},${py(Math.PI, 1)}`;
    for (let i = 0; i < 7; i++) { const a1 = Math.PI + ((i + 1) * Math.PI) / 7, am = Math.PI + ((i + 0.5) * Math.PI) / 7; d += ` Q${px(am, 1.1)},${py(am, 1.1)} ${px(a1, 1)},${py(a1, 1)}`; }
    let s = P(d + " Z", fill, 2.2);
    for (let i = 1; i < 7; i++) { const a = Math.PI + (i * Math.PI) / 7; s += L(`M${f1(x)},${f1(y)} L${px(a, 0.94)},${py(a, 0.94)}`, dark, 1.2); }
    return s + R(x - 6, y - 2, 12, 5, 2, dark, 1.4);
  };
  const turtleShell = (x, y, rx = 30, ry = 26) => {
    let s = E(x, y, rx, ry, KAME, 2.4) + E(x, y, rx * 0.8, ry * 0.8, "#7BBE84", 0);
    const hx = (cx, cy, r) => P(Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k + Math.PI / 6; return (k ? "L" : "M") + f1(cx + r * Math.cos(a)) + "," + f1(cy + r * Math.sin(a)); }).join(" ") + " Z", "#9AD3A0", 1.4);
    s += hx(x, y, rx * 0.3) + hx(x - rx * 0.52, y - ry * 0.3, rx * 0.22) + hx(x + rx * 0.52, y - ry * 0.3, rx * 0.22) + hx(x - rx * 0.52, y + ry * 0.34, rx * 0.22) + hx(x + rx * 0.52, y + ry * 0.34, rx * 0.22);
    return s + L(`M${f1(x - rx * 0.86)},${f1(y)} C${f1(x - rx * 0.5)},${f1(y + ry * 0.9)} ${f1(x + rx * 0.5)},${f1(y + ry * 0.9)} ${f1(x + rx * 0.86)},${f1(y)}`, KAME_D, 1.6);
  };
  const necklaceP = (x, y, w, dip = 7, n = 9) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return pearl(x - w / 2 + w * t, y + dip * (1 - Math.pow(2 * t - 1, 2)), 2.2); }).join("");
  const bubble = (x, y, r) => C(x, y, r, "#E8F7FA", 1.2, 'fill-opacity=".6"') + C(x - r * 0.35, y - r * 0.35, r * 0.28, "#FFFFFF", 0);

  // ===================== とくだい ぬいぐるみ（A〜Cしょう・ラストワンしょう）=====================
  const PLUSH = {
    // ローリソン A: とんがりぼうしと むらさきの ローブの ごじ（ほしの もよう・すいしょうだま）。むらさきの ベルベットの だい
    kj_mlaw2_a: { w: 132, h: 150, draw: () => {
      let s = pouf(66, 124, 52, 22, PU, PU_D, PU_L);
      s += P("M36,58 C16,74 12,110 14,126 L118,126 C120,110 116,74 96,58 Z", NIGHT, 2.4) + L("M18,122 C16,104 22,80 38,64", GOLD, 2) + L("M114,122 C116,104 110,80 94,64", GOLD, 2);
      for (const [x, y, r] of [[26, 100, 3.6], [104, 96, 3], [30, 78, 2.4], [102, 116, 2.6], [22, 116, 2.2]]) s += dotStar(x, y, r);
      s += grp(66, 76, 1, gojiTail() + gojiBody() + gojiEars(-40) + gojiMouth(-18));
      s += P("M42,66 C52,74 80,74 90,66 L86,80 C76,86 56,86 46,80 Z", PU, 2) + C(66, 79, 3.4, GOLD, 1.4) + C(66, 79, 1.4, STAR, 0);
      s += gfootGoji(50, 122) + gfootGoji(82, 122) + grp(66, 76, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + orb(66, 102, 14);
      return s + wizHat(66, 40, 62) + tag(112, 128, GOLD_D);
    } },
    // ローリソン B: ぎんの かぶとと あおい マントの きしの わんこ（ぎんの むねあて・ハートの たて）
    kj_mlaw2_b: { w: 124, h: 144, draw: () => {
      let s = pouf(62, 122, 48, 20, PU, PU_D, PU_L);
      s += P("M30,76 C18,92 16,114 20,124 L104,124 C108,114 106,92 94,76 Z", SKY_B, 2.4) + L("M24,120 C22,104 26,90 34,80", "#7E9FD8", 2);
      s += grp(62, 100, 1, wankoTail() + wankoBody({ spots: false }));
      s += P("M38,84 C40,78 50,76 62,76 C74,76 84,78 86,84 L84,108 C76,116 48,116 40,108 Z", SIL, 2.2) + L("M62,78 V112", SIL_D, 1.6) + L("M42,92 C52,96 72,96 82,92", SIL_L, 2) + C(62, 88, 2.4, GOLD, 1.2);
      s += foot(48, 122) + foot(76, 122) + paw(42, 104, 22) + shield(86, 102, 0.95) + paw(84, 108, -22);
      s += grp(62, 56, 1, wankoHead({ smile: true }));
      return s + helm(62, 36, 54) + tag(22, 126, GOLD_D, -12);
    } },
    // ローリソン C: すきとおる はねと はなの かんむりの ようせい がちゃん（ラベンダーの スカート・ほしの つえ）
    kj_mlaw2_c: { w: 120, h: 134, draw: () => {
      let s = pouf(60, 114, 46, 18, PU, PU_D, PU_L) + fairyWing(42, 80, 1) + fairyWing(78, 80, -1);
      s += P("M26,112 C22,100 34,92 60,92 C86,92 98,100 94,112 C88,116 84,110 78,115 C72,110 66,116 60,112 C54,116 48,110 42,115 C36,110 32,116 26,112 Z", "#E3D8FA", 2) + L("M32,108 C42,104 78,104 88,108", "#FFFFFF", 1.4);
      for (const [x, y] of [[38, 106], [60, 108], [82, 106]]) s += dotStar(x, y, 2.4, "#FFFFFF");
      s += grp(60, 96, 1, gachanBody()) + wing(33, 94, 1) + wing(87, 94, -1) + gfoot(48, 114) + gfoot(72, 114);
      s += grp(60, 54, 1, gachanHead({ smile: true })) + flowerCrown(60, 26, 40);
      return s + wand(92, 98, 18, 0.95) + tag(22, 116, GOLD_D, -12);
    } },
    // ローリソン ラストワン: ほしぞらの おしろ（2つの とう・まどから 3人）。170×134
    kj_mlaw2_l: { w: 170, h: 134, draw: () => {
      let s = R(10, 118, 150, 10, 4, PU_D, 2.2) + L("M14,121 H156", PU_L, 1.4);
      for (const x of [16, 140]) s += R(x, 44, 26, 76, 2, SIL_L, 2.2) + P(`M${x - 4},46 L${x + 13},8 L${x + 30},46 Z`, PU, 2.2) + star(x + 13, 6, 5) + R(x + 8, 62, 10, 14, 5, NIGHT, 1.6) + dotStar(x + 13, 69, 2.6);
      let top = "M40,52"; for (let i = 0; i < 9; i++) { const x = 40 + i * 10; top += ` H${x + 5} V44 H${x + 10} V52`; }
      s += P(top + " V120 H40 Z", SIL_L, 2.2) + L("M42,72 H128 M42,96 H128", "#DCE2EA", 1.2);
      for (const [x, y] of [[50, 80], [70, 104], [104, 82], [118, 106], [56, 110]]) s += R(x - 4, y - 2, 8, 4, 1, "#DCE2EA", 0);
      // まど 3つ（ひだり ごじ・まんなか がちゃん・みぎ わんこ）
      for (const [x, w] of [[46, 28], [71, 28], [96, 28]]) s += P(`M${x},92 V70 C${x},60 ${x + w},60 ${x + w},70 V92 Z`, NIGHT, 2) + dotStar(x + 5, 70, 1.8) + dotStar(x + w - 6, 74, 1.6);
      s += grp(60, 92, 0.42, gojiBody() + gojiEars(-40) + gojiMouth(-18)) + grp(85, 84, 0.42, gachanHead({ smile: true })) + grp(110, 84, 0.42, wankoHead({ smile: true }));
      s += wizHat(60, 62, 24) + flowerCrown(85, 66, 20) + helm(110, 68, 22);
      s += P("M76,120 V104 C76,96 94,96 94,104 V120 Z", "#8B5A33", 2) + C(90, 110, 1.4, GOLD, 0);
      for (const [x, y, r] of [[8, 20, 3], [38, 22, 2.4], [80, 18, 3.4], [124, 26, 2.4], [164, 18, 3]]) s += star(x, y, r, STAR, 1.2);
      return s + `<path d="${moonD(102, 22, 9)}" fill="${STAR}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>` + tag(158, 120, GOLD_D, -10);
    } },
    // せぶんぶん A: さんごの かんむりと うみいろの きものの りゅうおう ごじ（おおきな しんじゅ）。なみの ざぶとん
    kj_msev2_a: { w: 130, h: 146, draw: () => {
      let s = waveBase(65, 118, 108, 14) + grp(65, 78, 1, gojiTail() + gojiBody());
      s += P("M34,74 C32,62 44,58 54,60 L65,82 L76,60 C86,58 98,62 96,74 L94,114 C84,122 46,122 36,114 Z", SEA, 2.4) + P("M54,60 L65,82 L76,60 C72,58 58,58 54,60 Z", "#FFFFFF", 1.6) + R(38, 92, 54, 9, 3, GOLD, 2) + L("M42,96.5 H88", CORAL, 1.6);
      for (const [x, y] of [[44, 108], [86, 108], [42, 78], [88, 78]]) s += L(`M${x - 5},${y + 2} C${x - 5},${y - 4} ${x + 5},${y - 4} ${x + 5},${y + 2}`, SEA_L, 1.4);
      s += grp(65, 78, 1, gojiEars(-40) + gojiMouth(-18));
      s += gfootGoji(49, 120) + gfootGoji(81, 120) + grp(65, 78, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + C(65, 106, 12, "#FBF7F0", 2.2) + shine(60, 101, 4, 2.6, -30, 0.9) + E(65, 118, 10, 3, CORAL_L, 1.4);
      return s + coral(52, 40, 0.75) + coral(78, 40, 0.75) + coral(65, 36, 0.9) + pearl(65, 38, 3) + tag(112, 128, SEA_D);
    } },
    // せぶんぶん B: かめの こうらを せおった うらしまの わんこ（たまてばこ・みのの こし）
    kj_msev2_b: { w: 126, h: 142, draw: () => {
      let s = waveBase(63, 116, 104, 14) + turtleShell(63, 92, 36, 30) + grp(63, 98, 1, wankoTail() + wankoBody({ spots: false }));
      s += P("M38,102 L88,102 L84,118 L42,118 Z", "#D9B46A", 2) + [46, 54, 62, 70, 78].map((x) => L(`M${x},104 L${x - 1},117`, "#B8913F", 1.2)).join("");
      s += foot(49, 120) + foot(77, 120) + paw(44, 100, 22) + tamate(80, 100, 26) + paw(82, 104, -22);
      s += grp(63, 56, 1, wankoHead({ smile: true })) + L("M38,40 C30,30 26,18 30,6", "#8B5A33", 2.6) + L("M30,6 C36,18 34,34 32,46", "#9AA4AE", 1);
      return s + tag(22, 124, SEA_D, -12);
    } },
    // せぶんぶん C: ひらいた ほたてがいの なかの がちゃん（しんじゅの くびかざり・あわ）
    kj_msev2_c: { w: 118, h: 140, draw: () => {
      let s = scallop(59, 104, 104, "#FBE3E8", "#E9B5C2") + E(59, 118, 46, 10, SAND, 2.2);
      s += grp(59, 98, 1, gachanBody()) + wing(32, 96, 1) + wing(86, 96, -1) + gfoot(47, 118) + gfoot(71, 118) + necklaceP(59, 82, 34, 7);
      s += grp(59, 56, 1, gachanHead({ smile: true })) + pearl(59, 22, 4) + L("M50,28 C54,22 64,22 68,28", CORAL, 2);
      return s + bubble(18, 40, 5) + bubble(26, 24, 3.4) + bubble(98, 34, 4.4) + P("M12,124 C20,112 34,116 40,126 Z", "#F6C9A0", 1.8) + tag(100, 126, SEA_D);
    } },
    // せぶんぶん ラストワン: あかい はしらと みどりの やねの りゅうぐうじょうの もん・3人・なみ。168×136
    kj_msev2_l: { w: 168, h: 136, draw: () => {
      let s = R(14, 54, 140, 70, 3, "#FFF8EE", 2.2);
      s += P("M6,58 C24,52 40,36 52,30 L116,30 C128,36 144,52 162,58 C146,56 136,52 128,46 L40,46 C32,52 22,56 6,58 Z", ROOF, 2.4) + L("M40,46 H128", "#2E7A5E", 1.6) + R(76, 14, 16, 18, 2, ROOF, 2) + P("M70,16 C78,8 90,8 98,16 Z", "#2E7A5E", 1.8) + C(84, 8, 3, GOLD, 1.4);
      for (const x of [24, 140]) s += R(x - 5, 52, 10, 72, 2, CORAL, 2.2) + L(`M${x - 3},56 V120`, CORAL_L, 1.4);
      for (const [x, w] of [[42, 28], [70, 28], [98, 28]]) s += P(`M${x},110 V74 C${x},62 ${x + w},62 ${x + w},74 V110 Z`, SEA_D, 2);
      s += grp(56, 104, 0.4, gojiBody() + gojiEars(-40) + gojiMouth(-18)) + coral(56, 76, 0.4) + grp(84, 96, 0.42, gachanHead({ smile: true })) + pearl(84, 76, 2.4) + grp(112, 96, 0.42, wankoHead({ smile: true }));
      s += P("M4,124 C14,116 24,116 32,124 C40,116 50,116 58,124 C66,116 76,116 84,124 C92,116 102,116 110,124 C118,116 128,116 136,124 C144,116 154,116 164,124 L164,132 L4,132 Z", SEA_L, 2.2);
      return s + bubble(150, 30, 4) + bubble(158, 18, 2.6) + bubble(14, 36, 3.4) + tag(156, 122, SEA_D, -10);
    } },
  };

  // ===================== チェア・ティーカップ・かがみ・ざぶとん・ラグ・おきもの・クーポン・シート =====================
  const ART = {};
  for (const who of ["wanko", "gachan", "goji"]) {
    const k = { wanko: 0, gachan: 1, goji: 2 }[who];
    // ローリソン D: ぎんの わくの むらさきの ベルベット チェア（ほしの びょう・ぎんの あし）
    ART["kj_mlaw2_d" + k] = { w: 76, h: 92, draw: () => {
      let s = P("M14,54 C10,24 22,5 38,5 C54,5 66,24 62,54 Z", SIL, 2.2) + P("M18,52 C15,27 25,10 38,10 C51,10 61,27 58,52 Z", PU, 1.8);
      for (const [x, y] of [[26, 22], [50, 22], [23, 40], [53, 40], [38, 48]]) s += dotStar(x, y, 2.4, SIL_L);
      s += medal(38, 30, 11, who, "#F3EEFC") + star(38, 6.4, 3.4, SIL_L, 1.2);
      s += P("M5,48 C4,42 12,42 13,48 L14,62 L6,62 Z", PU, 1.8) + P("M71,48 C72,42 64,42 63,48 L62,62 L70,62 Z", PU, 1.8) + L("M6,47 C8,44 11,44 13,47 M70,47 C68,44 65,44 63,47", SIL_L, 1.6);
      s += R(9, 50, 58, 14, 6, PU, 2) + L("M13,52.6 H63", SIL_L, 1.6) + shine(22, 54, 8, 2, 0, 0.3) + R(8, 63, 60, 6, 2, SIL, 1.8);
      s += L("M15,69 C12,77 17,83 12,89", SIL_D, 3.4) + L("M61,69 C64,77 59,83 64,89", SIL_D, 3.4) + L("M15,69 C12,77 17,83 12,89 M61,69 C64,77 59,83 64,89", SIL_L, 1.2);
      return s + E(12, 89.5, 3, 1.6, SIL_D, 1.2) + E(64, 89.5, 3, 1.6, SIL_D, 1.2);
    } };
    // ローリソン E: よぞらいろの おびに きんの ほしの ティーカップと ソーサー
    ART["kj_mlaw2_e" + k] = { w: 46, h: 34, draw: () => E(23, 29, 21, 4.6, "#FFFFFF", 1.8) + ringE(23, 28.6, 15, 2.8, SIL_D, 1.2)
      + L("M38,14 C46,14 46,24 36,25", PU_D, 3.4) + L("M38,14 C45,14 45,23 36,24.4", PU_L, 1.4)
      + P("M8,12 C8,24 14,29 23,29 C32,29 38,24 38,12 Z", "#FFFFFF", 2) + P("M9.4,19 C12,26 34,26 36.6,19 L36,23 C32,28 14,28 10,23 Z", NIGHT, 0) + dotStar(14, 23, 1.6) + dotStar(31, 23.4, 1.4) + E(23, 12, 15, 3.4, "#B48FD8", 1.8) + L("M8.6,12 C12,9 34,9 37.4,12", GOLD, 1.6) + medal(23, 17.4, 5, who) + shine(12, 15, 1.4, 3, 10, 0.7) };
    // ローリソン G: ぎんの まほうの かがみ（まるい かがみ・ほしの かざり・だい）
    ART["kj_mlaw2_g" + k] = { w: 46, h: 62, draw: () => mirror(charaImg(who, MAGIC_OUT[who])) };
    // せぶんぶん D: ほたてがいの かたちの ざぶとん（しんじゅの ふさ・まんなかの ししゅう）
    ART["kj_msev2_d" + k] = { w: 80, h: 40, draw: () => {
      let s = P("M6,30 C2,14 18,2 40,2 C62,2 78,14 74,30 Q40,36 6,30 Z", "#BFE6E8", 2.2) + P("M6,30 Q40,36 74,30 L73,35 Q40,41 7,35 Z", SEA, 2);
      for (let i = 1; i < 7; i++) { const a = Math.PI + (i * Math.PI) / 7; s += L(`M40,30 L${f1(40 + Math.cos(a) * 32)},${f1(30 + Math.sin(a) * 25)}`, SEA_L, 1.2); }
      s += grp(40, 18, 1, `<g transform="scale(1 0.66)">${medal(0, 0, 10, who)}</g>`) + shine(22, 10, 7, 1.6, -10, 0.4);
      for (const [x, y] of [[6, 32], [74, 32], [40, 38]]) s += pearl(x, y, 2.6);
      return s;
    } };
    // せぶんぶん E: なみの ラグ（へやでは ラグの 立体。がめんでは うえから みた 絵）
    ART["kj_msev2_e" + k] = { w: 120, h: 80, draw: () => waveFlat(who) };
    // せぶんぶん G: さんごの だいの おきもの（キャラ・しんじゅ）
    ART["kj_msev2_g" + k] = { w: 48, h: 58, draw: () => coralStand(charaImg(who, RYUGU_OUT[who])) };
  }
  ART.kj_mlaw2_g3 = { w: 46, h: 62, draw: () => mirror(keeperImg("lawson")) };
  ART.kj_msev2_g3 = { w: 48, h: 58, draw: () => coralStand(keeperImg("sevenbun", "jump_01")) };
  // ぎんの まほうの かがみ（たまごがたの かがみ・ふちの ほし・あおい よぞら・だい）
  function mirror(img) {
    let s = R(10, 54, 26, 6, 2, SIL_D, 1.8) + R(20, 48, 6, 8, 1, SIL, 1.6) + E(23, 27, 19, 24, SIL, 2.2) + E(23, 27, 15, 20, NIGHT, 1.6);
    s += dotStar(13, 14, 1.6) + dotStar(33, 18, 1.4) + place(img, 9, 9, 28, 38);
    for (const [x, y] of [[4.4, 27], [41.6, 27], [23, 51]]) s += C(x, y, 1.8, SIL_L, 1.1);
    return s + star(23, 3.2, 3.6, STAR, 1.2);
  }
  // さんごの だいの おきもの（すなの だい・さんご・キャラ・しんじゅ）
  function coralStand(img) {
    return E(24, 52, 22, 5, SAND, 1.8) + coral(8, 50, 0.6) + coral(42, 50, 0.55, CORAL_L) + place(img, 4, 2, 40, 48) + pearl(36, 50, 3);
  }
  // なみの ラグ（うえから: うみいろ・きんの ふち・なみ〔せいがいは〕・まるい もん・りょうはしの ふさ）
  const waves = (x0, y0, w, h, r, col, sw) => {
    let s = "";
    for (let j = 0, y = y0 + r; y <= y0 + h; j++, y += r * 0.62) for (let x = x0 + (j % 2 ? r : 0); x + r <= x0 + w + 0.1; x += r * 2) {
      for (const k of [1, 0.66, 0.33]) s += `<path d="M${f1(x - r * k + r)},${f1(y)} A${f1(r * k)},${f1(r * k)} 0 0,1 ${f1(x + r * k + r)},${f1(y)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    }
    return s;
  };
  function waveFlat(who) {
    let s = "";
    for (let y = 12; y <= 68; y += 6) s += L(`M8,${y} H2`, SEA_D, 1.8) + L(`M112,${y} H118`, SEA_D, 1.8);
    s += R(8, 4, 104, 72, 6, SEA, 2.2) + waves(14, 8, 90, 62, 6, SEA_L, 1.1) + ringR(12.5, 8.5, 95, 63, 3, GOLD, 3);
    return s + C(60, 40, 20, SEA_D, 0) + medal(60, 40, 17, who) + ringC(60, 40, 19, GOLD, 2.4);
  }
  // クーポン（3まい つづり）: ローリソンは よぞらの けん 3まい（ほし）・せぶんぶんは たまてばこの ふくろ
  const FOOD_OF = { h0: { lawson: "karaage", sevenbun: "oden" }, h1: { lawson: "pudding", sevenbun: "bread" }, h2: { lawson: "onigiri", sevenbun: "cocoa" } };
  const icon = (store, k, x, y, w, h) => { const f = FOOD_OF["h" + k] && FOOD_OF["h" + k][store]; return f ? place(Art.iconSvg("bag", f), x, y, w, h, "xMidYMid meet") : star(x + w / 2, y + h / 2, Math.min(w, h) * 0.42); };
  const words = (x, col, sub) => `<text x="${x}" y="31" text-anchor="middle" font-size="11.5" font-weight="bold" font-family="sans-serif" textLength="42" lengthAdjust="spacingAndGlyphs" fill="${col}" stroke="none">むりょう</text>`
    + `<text x="${x}" y="46" text-anchor="middle" font-size="10" font-weight="bold" font-family="sans-serif" textLength="28" lengthAdjust="spacingAndGlyphs" fill="${sub}" stroke="none">3まい</text>`;
  for (const k of [0, 1, 2, 3]) {
    ART["kj_mlaw2_h" + k] = { w: 120, h: 60, draw: () => {
      let s = P(ticket(10, 2, 106, 44), PU_L, 2) + P(ticket(7, 5, 106, 44), PU, 2) + P(ticket(4, 9, 106, 46), "#F7F3FD", 2.2) + P("M4,9 H26 V55 H4 Z", NIGHT, 2.2);
      s += dotStar(15, 20, 4) + `<path d="${moonD(15, 42, 5)}" fill="${STAR}" stroke="none"/>` + L("M30,11 V53", "#C8BDE0", 1.4, 'stroke-dasharray="2.4 2.4"') + icon("lawson", k, 31, 15, 30, 32);
      return s + words(80, PU_D, GOLD_D);
    } };
    ART["kj_msev2_h" + k] = { w: 120, h: 60, draw: () => {
      let s = [[-14, "#FFFDF6"], [-2, "#E8F7FA"], [10, "#FFFDF6"]].map(([rot, col]) => grp(26, 30, 1, R(-9, -26, 18, 22, 2, col, 1.8) + L("M-5,-20 h10 M-5,-15 h10", "#B9DCE0", 1.2), rot)).join("");
      s += tamate(26, 38, 38) + icon("sevenbun", k, 48, 14, 28, 30);
      return s + words(96, SEA_D, CORAL_D);
    } };
  }
  // シール シート（6まい）
  for (const k of [0, 1, 2]) {
    ART["kj_mlaw2_i" + k] = { w: 100, h: 110, draw: () => sheet6(IchibanKuji.INDEX["kj_mlaw2_i" + k], ["#EEE6FA", "#F7EEFC", "#E6EAF7"][k], SIL_D) };
    ART["kj_msev2_i" + k] = { w: 100, h: 110, draw: () => sheet6(IchibanKuji.INDEX["kj_msev2_i" + k], ["#DDF4F2", "#FCEBEE", "#EAF6F0"][k], SEA) };
  }

  // ===================== シール（シールちょう 100×100）=====================
  const ring = (cx, cy, r, col) => ringC(cx, cy, r, col, 3);
  const STK = {
    stk_kjmlaw2_wanko: () => SC(circleD(50, 54, 38), "#E6EAF7") + ring(50, 54, 33, SIL_D) + grp(50, 62, 0.66, wankoHead({ smile: true })) + helm(50, 48, 46) + puff(50, 54, 38),
    stk_kjmlaw2_gachan: () => SC(circleD(50, 54, 38), "#EEE6FA") + ring(50, 54, 33, PU_L) + fairyWing(30, 62, 1, 0.6) + fairyWing(70, 62, -1, 0.6) + grp(50, 60, 0.72, gachanHead({ smile: true })) + flowerCrown(50, 36, 34) + puff(50, 54, 38),
    stk_kjmlaw2_goji: () => SC(circleD(50, 54, 38), "#E7E2F2") + ring(50, 54, 33, PU) + grp(50, 66, 0.6, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + wizHat(50, 44, 50) + puff(50, 54, 38),
    stk_kjmlaw2_castle: () => SC("M12,90 L12,44 L20,44 L26,18 L32,44 L38,44 V36 H44 V44 H50 V36 H56 V44 H62 V44 L68,18 L74,44 L88,44 L88,90 Z", "#EEF2F7") + R(16, 46, 68, 42, 2, SIL_L, 1.8) + P("M42,88 V70 C42,62 58,62 58,70 V88 Z", "#8B5A33", 1.8) + P("M20,46 L26,22 L32,46 Z", PU, 1.8) + P("M62,46 L68,22 L74,46 Z", PU, 1.8) + R(22, 56, 8, 10, 4, NIGHT, 1.4) + R(70, 56, 8, 10, 4, NIGHT, 1.4) + star(26, 18, 4) + star(68, 18, 4) + puff(50, 56, 38),
    stk_kjmlaw2_wand: () => SC(circleD(50, 50, 38), "#2B2F5E") + wand(50, 86, -18, 1.6) + dotStar(24, 30, 3) + dotStar(76, 64, 2.6) + dotStar(30, 72, 2) + puff(50, 50, 38),
    stk_kjmlaw2_moon: () => SC(circleD(50, 50, 38), "#2B2F5E") + `<path d="${moonD(46, 50, 28)}" fill="${STAR}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>` + C(42, 44, 2, K, 0) + L("M40,56 Q44,60 48,56", K, 1.8) + dotStar(74, 30, 4) + dotStar(78, 66, 3) + puff(50, 50, 38),
    stk_kjmsev2_wanko: () => SC(circleD(50, 54, 38), "#DDF4F2") + ring(50, 54, 33, SEA) + turtleShell(50, 70, 26, 18) + grp(50, 56, 0.66, wankoHead({ smile: true })) + puff(50, 54, 38),
    stk_kjmsev2_gachan: () => SC(circleD(50, 54, 38), "#FCEBEE") + ring(50, 54, 33, CORAL_L) + grp(50, 58, 0.72, gachanHead({ smile: true })) + necklaceP(50, 82, 34, 6, 7) + pearl(50, 28, 3.4) + puff(50, 54, 38),
    stk_kjmsev2_goji: () => SC(circleD(50, 54, 38), "#DDF4F2") + ring(50, 54, 33, SEA) + grp(50, 66, 0.6, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + coral(40, 40, 0.6) + coral(60, 40, 0.6) + coral(50, 36, 0.7) + puff(50, 54, 38),
    stk_kjmsev2_turtle: () => SC("M10,56 C10,30 34,18 52,20 C72,20 90,34 90,56 C90,74 70,84 50,84 C30,84 10,74 10,56 Z", "#9AD3A0") + E(84, 46, 8, 7, "#9AD3A0", 2) + C(86, 44, 1.6, K, 0) + E(22, 78, 7, 4, "#9AD3A0", 1.8) + E(76, 80, 7, 4, "#9AD3A0", 1.8) + turtleShell(50, 54, 34, 26) + puff(50, 54, 38),
    stk_kjmsev2_pearl: () => SC(circleD(50, 54, 38), "#FFF6F2") + scallop(50, 74, 76, "#FBE3E8", "#E9B5C2") + C(50, 58, 14, "#FBF7F0", 2.4) + shine(45, 53, 5, 3, -30, 0.9) + puff(50, 54, 38),
    stk_kjmsev2_shell: () => SC(circleD(50, 52, 38), "#E8F7FA") + scallop(50, 76, 70, "#F7C9A8", "#E09A72") + bubble(26, 30, 5) + bubble(74, 28, 4) + puff(50, 52, 38),
  };

  // ===================== もちもの（まほうの ポシェット・たまてばこ ポーチ。手に さげる）=====================
  const bag = (ctx) => {
    const h = HandItems.hand(ctx), key = ctx.col[0], who = ctx.col[1], law = key === "mlaw2";
    const x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 10, w = 30, hh = 26;
    let s;
    if (law) { // むらさきの ベルベット・ぎんの くさり・みかづきの とめがね
      s = Array.from({ length: 7 }, (_, i) => { const t = i / 6, px = x - 10 + 20 * t, py = h.y - 6 + 16 * Math.pow(2 * t - 1, 2) - 2; return C(px, py, 1.8, SIL, 1.2); }).join("");
      s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} L${f1(x + w / 2 + 1)},${f1(y0 + hh - 6)} C${f1(x + w / 2)},${f1(y0 + hh + 2)} ${f1(x - w / 2)},${f1(y0 + hh + 2)} ${f1(x - w / 2 - 1)},${f1(y0 + hh - 6)} Z" fill="${PU}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} C${f1(x + w / 2)},${f1(y0 + 12)} ${f1(x - w / 2)},${f1(y0 + 12)} ${f1(x - w / 2)},${f1(y0)} Z" fill="${PU_L}" stroke="${SIL}" stroke-width="2.4" stroke-linejoin="round"/>`;
      s += `<path d="${moonD(x, y0 + 10, 6)}" fill="${STAR}" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>` + C(x - 8, y0 + 18, 4.6, "#F3EEFC", 1.2) + grp(x - 8, y0 + 18, 0.09, smallHead(who));
    } else { // くろい うるしの たまてばこ（きんの なみ・あかい ひも）
      s = L(`M${f1(x - 9)},${f1(y0 - 2)} C${f1(x - 9)},${f1(h.y - 10)} ${f1(x + 9)},${f1(h.y - 10)} ${f1(x + 9)},${f1(y0 - 2)}`, CORAL, 2.6);
      s += tamate(x, y0 + 12, w) + C(x + 8, y0 + 18, 4.6, CREAM, 1.2) + grp(x + 8, y0 + 18, 0.09, smallHead(who));
    }
    return { top: s };
  };

  // ===================== へやの 立体（なみの ラグ）=====================
  const rugModel = (who) => (k) => {
    const { w, d, shape, TP, lineOn, onP } = k, sh = FurnModels.shapes, x0 = -w / 2 + 6, y0 = -d + 6, ww = w - 12, dd = d - 12;
    let s = shape(TP(0), sh.rr(x0 - 2, y0 - 2, ww + 4, dd + 4, 10), INK, 0, 'fill-opacity=".12"');
    for (let y = y0 + 6; y <= y0 + dd - 6; y += 7) for (const [xa, xb] of [[x0, x0 - 7], [x0 + ww, x0 + ww + 7]]) s += lineOn(TP(0.4), [[xa, y], [xb, y + 0.6]], INK, 3.2) + lineOn(TP(0.4), [[xa, y], [xb, y + 0.6]], SEA_L, 1.6);
    s += shape(TP(1), sh.rr(x0, y0, ww, dd, 6), SEA, 1.6);
    s += lineOn(TP(1.05), sh.close(sh.rr(x0 + 5, y0 + 5, ww - 10, dd - 10, 4)), GOLD, 3);
    // なみ（はんえんの 3じゅう。よこに ならべる）
    for (let j = 0, y = y0 + 16; y < y0 + dd - 10; j++, y += 9) for (let x = x0 + 14 + (j % 2 ? 8 : 0); x < x0 + ww - 14; x += 16) for (const r of [7, 4.6]) {
      const pts = Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9]; });
      s += lineOn(TP(1.05), pts, SEA_L, 1);
    }
    s += onP(TP(1.1), -22, -d / 2 + 22, 44, 44, C(22, 22, 20, SEA_D, 0) + grp(22, 22, 1, medal(0, 0, 17, who)) + ringC(22, 22, 19, GOLD, 2.4));
    return s;
  };
  // KujiDeluxeArt.install（ラグ・チェア・ざぶとん）の あとに よぶ: なみの ラグを この 立体に
  const install = (API) => { for (const it of API.ITEMS) if (it.net && it.theme === "msev2" && it.kind === "brocade") FurnModels.register(it.id, rugModel(it.who)); };
  // KujiArt の 絵の いちらんに たす
  Object.assign(A.PLUSH, PLUSH); Object.assign(A.ART, ART); Object.assign(A.STK, STK);
  return { PLUSH, ART, STK, bag, rugModel, install, starD, moonD };
})();
