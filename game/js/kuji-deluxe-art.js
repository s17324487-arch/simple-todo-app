// いちばんくじ「みんなの くじ」の ごうかな けいひんの 絵（UI-101。しくみは js/ichiban-kuji.js の DELUXE・ひとりの くじの 絵は js/kuji-art.js）。
// ・ローリソン「ロイヤル パーティー」: おうかんと マントの ごじ・タキシードの わんこ・ティアラの がちゃん の とくだい ぬいぐるみ（こんいろの ベルベットの だい）・
//   ベルベット チェア・ゴールド ティーカップ・ロイヤル ポシェット・きんの がくぶち スタンド・3まい つづりの クーポン・ゴールド シール・ラストワンの ロイヤル ソファ。
// ・せぶんぶん「ごうか おしょうがつ」: だるまの ごじ・はれぎの わんこ・かがみもちの がちゃん の とくだい ぬいぐるみ（きんらんの ざぶとん）・
//   きんらん ざぶとん・きんらん ラグ・がまぐち ポーチ・ふくまねき・ぽちぶくろの クーポン・おしょうがつ シール・ラストワンの じゅうばこ。
// ・線は INK。きんいろは うすい・ふつう・こい の 3いろで ぬる（グラデーション・SVG の id は つかわない）。キラキラの えんしゅつは つけない（UI-50）。ほうせきは まるい いろと しろい ひかり だけ。
// ・どれも この ゲームの ための オリジナルの 絵（じっさいの 商品・お店の なまえや 絵・もじの もんしょうは つかわない）。ぬいぐるみの ぶひんは KujiArt.parts。
const KujiDeluxeArt = (() => {
  const A = KujiArt, K = INK;
  const { f1, P, L, E, C, R, grp, svg, place, shine, stitch, seamE, tag, WAN, GAC, GOJ, wankoHead, wankoTail, wankoBody, paw, foot, gachanFace, gachanHead, gachanBody, wing, gfoot, gojiEars, gojiMouth, gojiArm, gojiTail, gfootGoji, gojiBody, gojiShape, bow, nug, onigiriBall, smallHead } = A.parts;
  const GOLD = "#E8B83A", GOLD_L = "#F6D77A", GOLD_D = "#B8862B", CREAM = "#FFF8E8";
  const NAVY = "#2E4A8C", NAVY_L = "#4C6FB8", NAVY_D = "#1F3466";
  const RED = "#C8323A", RED_L = "#E25A5A", RED_D = "#9E2238", LACQ = "#2B2420", PINE = "#3F8F5E";
  // ほうせき（まるい いろ・しろい ひかり）と しんじゅ
  const gem = (x, y, r, col) => C(x, y, r, col, 1.4) + C(x - r * 0.35, y - r * 0.4, r * 0.32, "#FFFFFF", 0);
  const pearl = (x, y, r = 2.2) => C(x, y, r, "#FBF7F0", 1.2) + C(x - r * 0.35, y - r * 0.35, r * 0.35, "#FFFFFF", 0);
  // いろつきの ふちだけ（なかは ぬらない）
  const ringC = (cx, cy, r, col, w = 2) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
  const ringE = (cx, cy, rx, ry, col, w = 2) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
  const ringR = (x, y, w, h, rr, col, sw = 2) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rr)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;

  // ===================== ぶひん =====================
  // おうかん（まんなかの したが x・base）: きんの わ・5つの とがり・あかい ベルベット・ほうせき・しんじゅ
  const crown = (x, base, w = 40) => {
    const h = w * 0.5, l = x - w / 2, r = x + w / 2;
    let s = E(x, base - h * 0.55, w * 0.36, h * 0.42, RED, 2);
    s += P(`M${f1(l)},${f1(base)} L${f1(l - 1)},${f1(base - h)} L${f1(l + w * 0.2)},${f1(base - h * 0.48)} L${f1(l + w * 0.32)},${f1(base - h * 1.12)} L${f1(x)},${f1(base - h * 0.55)} L${f1(r - w * 0.32)},${f1(base - h * 1.12)} L${f1(r - w * 0.2)},${f1(base - h * 0.48)} L${f1(r + 1)},${f1(base - h)} L${f1(r)},${f1(base)} Z`, GOLD, 2);
    s += L(`M${f1(l + 3)},${f1(base - h * 0.2)} L${f1(l + 2)},${f1(base - h * 0.78)}`, GOLD_L, 1.6);
    s += R(l - 1.5, base - 6, w + 3, 8, 3, GOLD_D, 2) + L(`M${f1(l + 2)},${f1(base - 3.4)} H${f1(r - 2)}`, GOLD_L, 1.4);
    s += gem(x, base - 2, 2.6, RED_L) + gem(x - w * 0.3, base - 2, 2, "#5DA9E9") + gem(x + w * 0.3, base - 2, 2, "#5DA9E9");
    for (const [px, py] of [[l - 1, base - h], [l + w * 0.32, base - h * 1.12], [r - w * 0.32, base - h * 1.12], [r + 1, base - h]]) s += pearl(px, py, 2.2);
    return s + pearl(x, base - h * 0.55 - 1, 2.4);
  };
  // ティアラ（まんなかの したが x・y）: きんの ほそい わ・3つの やま・ほうせき
  const tiara = (x, y, w = 36) => {
    const l = x - w / 2, r = x + w / 2;
    let s = P(`M${f1(l)},${f1(y)} C${f1(l + w * 0.1)},${f1(y - 8)} ${f1(l + w * 0.24)},${f1(y - 10)} ${f1(l + w * 0.3)},${f1(y - 6)} C${f1(x - 6)},${f1(y - 18)} ${f1(x + 6)},${f1(y - 18)} ${f1(r - w * 0.3)},${f1(y - 6)} C${f1(r - w * 0.24)},${f1(y - 10)} ${f1(r - w * 0.1)},${f1(y - 8)} ${f1(r)},${f1(y)} C${f1(x + 8)},${f1(y - 4)} ${f1(x - 8)},${f1(y - 4)} ${f1(l)},${f1(y)} Z`, GOLD, 1.8);
    s += L(`M${f1(l + 3)},${f1(y - 2.4)} C${f1(x - 6)},${f1(y - 6)} ${f1(x + 6)},${f1(y - 6)} ${f1(r - 3)},${f1(y - 2.4)}`, GOLD_L, 1.2);
    return s + gem(x, y - 9.5, 3, "#F48FB1") + gem(l + w * 0.27, y - 5.4, 1.8, "#7EC8F0") + gem(r - w * 0.27, y - 5.4, 1.8, "#7EC8F0") + pearl(x, y - 16.6, 1.8);
  };
  // シルクハット（まんなかの したが x・y・すこし かたむける）: くろ・きんの リボン
  const tophat = (x, y, s = 1, rot = -8) => grp(x, y, s, E(0, 0, 24, 5.6, "#2A2A30", 2) + P("M-14,-1 L-15,-26 C-15,-30 15,-30 15,-26 L14,-1 Z", "#2A2A30", 2) + R(-14.6, -9, 29.2, 6, 1, GOLD, 1.6) + L("M-10,-24 L-10.6,-12", "#5A5A66", 2) + E(0, -26.6, 15, 3.6, "#3A3A44", 1.8), rot);
  // ベルベットの だい（まんなか cx・うえ top・はば rx・たかさ h）: きんの パイピング・ボタン・ふさ
  const pouf = (cx, top, rx, h, col = NAVY, dark = NAVY_D, light = NAVY_L) => {
    let s = P(`M${f1(cx - rx)},${f1(top)} L${f1(cx - rx + 2)},${f1(top + h - 7)} C${f1(cx - rx + 5)},${f1(top + h + 2)} ${f1(cx + rx - 5)},${f1(top + h + 2)} ${f1(cx + rx - 2)},${f1(top + h - 7)} L${f1(cx + rx)},${f1(top)} Z`, col, 2.4);
    s += E(cx, top, rx, rx * 0.17, light, 2.4) + L(`M${f1(cx - rx + 1)},${f1(top + 2)} C${f1(cx - rx * 0.5)},${f1(top + rx * 0.22)} ${f1(cx + rx * 0.5)},${f1(top + rx * 0.22)} ${f1(cx + rx - 1)},${f1(top + 2)}`, GOLD, 2.6);
    for (let i = -2; i <= 2; i++) s += C(cx + i * rx * 0.36, top + h * 0.55 + Math.abs(i) * -0.8, 1.7, dark, 0);
    for (const sx of [-1, 1]) s += grp(cx + sx * (rx - 3), top + 4, 1, L("M0,0 V5", GOLD_D, 1.6) + P("M-3,5 L3,5 L4.4,13 L-4.4,13 Z", GOLD, 1.4) + L("M-1.4,7 V12 M1.4,7 V12", GOLD_D, 0.9));
    return s;
  };
  // きんらんの ざぶとん（まんなか cx・うえ top・はば w）: あか・きんの こうし・4すみの ふさ
  const zabuBase = (cx, top, w, h = 16) => {
    const l = cx - w / 2, r = cx + w / 2;
    let s = P(`M${f1(l + 6)},${f1(top)} Q${f1(cx)},${f1(top - 4)} ${f1(r - 6)},${f1(top)} Q${f1(r + 2)},${f1(top + h * 0.5)} ${f1(r)},${f1(top + h)} Q${f1(cx)},${f1(top + h + 4)} ${f1(l)},${f1(top + h)} Q${f1(l - 2)},${f1(top + h * 0.5)} ${f1(l + 6)},${f1(top)} Z`, RED, 2.4);
    s += P(`M${f1(l)},${f1(top + h)} Q${f1(cx)},${f1(top + h + 4)} ${f1(r)},${f1(top + h)} L${f1(r - 1)},${f1(top + h + 6)} Q${f1(cx)},${f1(top + h + 10)} ${f1(l + 1)},${f1(top + h + 6)} Z`, RED_D, 2.2);
    for (let x = l + 12; x < r - 6; x += 12) s += L(`M${f1(x - 4)},${f1(top + h * 0.5)} L${f1(x)},${f1(top + 3)} L${f1(x + 4)},${f1(top + h * 0.5)} L${f1(x)},${f1(top + h - 2)} Z`, GOLD, 1.2);
    for (const [x, y] of [[l + 2, top + h + 2], [r - 2, top + h + 2]]) s += grp(x, y, 1, P("M-3,0 L3,0 L4.6,9 L-4.6,9 Z", GOLD, 1.4) + C(0, -1, 2.2, GOLD_D, 1.2));
    return s;
  };
  // ゴールドの からあげ カップ・きんぱくの おにぎり・こばん・はごいた・かんざし
  const goldKaraage = (x, y, s = 1) => grp(x, y, s, nug(-7, -12, 6.4, -15) + nug(7, -12, 6.4, 20) + nug(0, -16, 6.6, 5)
    + P("M-13,-9 L13,-9 L10,10 L-10,10 Z", GOLD, 2.2) + R(-11.4, -3, 22.8, 4.6, 1, CREAM, 0) + L("M-9,6 L9,6", GOLD_D, 1.2) + P("M0,-1.6 L1.6,0.4 L0,2.2 L-1.6,0.4 Z", RED_L, 0) + shine(-8, -4, 2, 4, 20, 0.6));
  const leafGold = (x, y, r, rot) => grp(x, y, 1, P(`M0,${-r} L${f1(r * 0.8)},${f1(-r * 0.2)} L${f1(r * 0.3)},${f1(r * 0.9)} L${f1(-r * 0.7)},${f1(r * 0.5)} L${f1(-r * 0.9)},${f1(-r * 0.4)} Z`, GOLD_L, 0.9), rot);
  const goldOnigiri = (x, y, s = 1) => onigiriBall(x, y, s, true) + grp(x, y, s, leafGold(-7, -9, 2.6, 20) + leafGold(6, -6, 2.2, -30) + leafGold(9, 4, 1.8, 10) + leafGold(-11, 4, 2, 60));
  const koban = (x, y, s = 1, rot = 0) => grp(x, y, s, E(0, 0, 13, 18, GOLD, 2.2) + E(0, 0, 9.6, 14.4, GOLD_L, 0) + [-8, -3, 2, 7].map((dy) => L(`M-7,${dy} H7`, GOLD_D, 1.2)).join("") + R(-2.6, -13, 5.2, 4, 1, GOLD_D, 0) + R(-2.6, 9, 5.2, 4, 1, GOLD_D, 0) + shine(-5, -8, 2, 4.4, 20, 0.6), rot);
  const hagoita = (x, y, s = 1, rot = 14) => grp(x, y, s, R(-3, 18, 6, 16, 2, "#C9A36A", 1.8) + L("M-3,22 h6 M-3,26 h6 M-3,30 h6", RED, 1.2)
    + P("M-12,20 C-14,4 -14,-16 -10,-22 C-6,-27 6,-27 10,-22 C14,-16 14,4 12,20 Z", "#FFF4E2", 2.2) + P("M-10,10 C-10,-2 -9,-14 -6,-18 C-2,-21 2,-21 6,-18 C9,-14 10,-2 10,10 Z", RED, 1.6)
    + [[-3, -10], [4, -4], [-2, 4]].map(([fx, fy], i) => grp(fx, fy, 1, [0, 72, 144, 216, 288].map((a) => E(0, -2.6, 1.8, 2.6, i === 1 ? "#FFFFFF" : GOLD_L, 0.8, a)).join("") + C(0, 0, 1.2, GOLD_D, 0))).join("") + L("M-10,14 C-4,12 4,16 10,13", GOLD, 1.6), rot);
  const flower = (x, y, r, col, mid = GOLD) => grp(x, y, 1, [0, 72, 144, 216, 288].map((a) => E(0, -r * 0.55, r * 0.42, r * 0.6, col, 1.2, a)).join("") + C(0, 0, r * 0.28, mid, 1));
  const kanzashi = (x, y) => flower(x, y, 9, "#F48FB1") + flower(x + 9, y + 5, 7, "#FFFFFF", RED_L) + flower(x - 7, y + 6, 6, RED_L) + L(`M${x + 2},${y + 8} V${y + 22}`, GOLD_D, 1.2) + [[x + 2, y + 14], [x + 2, y + 19], [x + 2, y + 24]].map(([px, py]) => E(px, py, 1.8, 2.4, "#F8C9D6", 1)).join("");
  // くろい うるしの じゅうばこの だん（きんの ふち・あかい うちがわ・まるい きんの もん）
  const crest = (x, y, r) => C(x, y, r, GOLD, 1.8) + flower(x, y, r * 1.2, GOLD_L, GOLD_D) + C(x, y, r, "none", 1.6);
  const tier = (x, y, w, h) => R(x, y, w, h, 3, LACQ, 2.4) + L(`M${f1(x + 2)},${f1(y + 3)} H${f1(x + w - 2)}`, RED_D, 1.6) + L(`M${f1(x + 3)},${f1(y + h - 3)} H${f1(x + w - 3)}`, GOLD, 1.6) + R(x + 4, y + 5, 10, 3, 1, GOLD, 0) + R(x + w - 14, y + 5, 10, 3, 1, GOLD, 0) + crest(x + w / 2, y + h / 2 + 1, Math.min(8, h * 0.28)) + shine(x + 12, y + h * 0.5, 5, 1.6, 0, 0.18);
  // マントの えり（しろい ふわふわ と くろい しっぽの もよう）
  const ermine = (x0, x1, y, h = 10) => {
    let s = P(`M${f1(x0)},${f1(y)} C${f1(x0 + 4)},${f1(y - 4)} ${f1(x1 - 4)},${f1(y - 4)} ${f1(x1)},${f1(y)} L${f1(x1 - 2)},${f1(y + h)} ` + Array.from({ length: 7 }, (_, i) => { const xa = x1 - 2 - ((x1 - x0 - 4) * (i + 1)) / 7, xm = xa + (x1 - x0 - 4) / 14; return `Q${f1(xm)},${f1(y + h + 4)} ${f1(xa)},${f1(y + h)}`; }).join(" ") + " Z", "#FFFFFF", 2);
    for (let i = 0; i < 4; i++) { const px = x0 + 7 + i * ((x1 - x0 - 14) / 3); s += P(`M${f1(px)},${f1(y + 2)} L${f1(px + 1.6)},${f1(y + 6.4)} L${f1(px - 1.6)},${f1(y + 6.4)} Z`, K, 0); }
    return s;
  };
  // しんじゅの ネックレス（まんなか x・y・はば）
  const necklace = (x, y, w, dip = 8, n = 9) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), px = x - w / 2 + w * t, py = y + dip * (1 - Math.pow(2 * t - 1, 2)); return pearl(px, py, 2.3); }).join("");
  // パフェ グラス（プリン アラモード）
  const parfait = (x, y, s = 1) => grp(x, y, s, E(0, 22, 11, 2.6, "#E8F4FB", 1.6) + R(-1.6, 12, 3.2, 10, 1, "#E8F4FB", 1.4)
    + P("M-15,-4 C-15,8 -8,13 0,13 C8,13 15,8 15,-4 Z", "#E8F4FB", 2, 'fill-opacity=".9"') + P("M-9,10 C-9,2 -6,-2 0,-2 C6,-2 9,2 9,10 Z", "#F9D46B", 1.6) + P("M-6,1 C-4,-2 4,-2 6,1 C4,2 -4,2 -6,1 Z", "#8D5524", 1.2)
    + E(-9, -5, 5.4, 4, "#FFFDF8", 1.6) + E(9, -5, 5.4, 4, "#FFFDF8", 1.6) + E(0, -8, 6, 5, "#FFFDF8", 1.6) + C(0, -15, 4, "#E53935", 1.6) + L("M0,-19 q3,-4 6,-3", K, 1.2)
    + grp(-12, -9, 1, E(0, 0, 4, 2.6, "#FFB74D", 1.2, -30)) + grp(12, -10, 1, P("M0,-4 C3,-4 4,0 0,4 C-4,0 -3,-4 0,-4 Z", "#EF5350", 1.2)) + shine(-10, 4, 1.6, 4, 10, 0.7));
  const charaImg = (who, outfit, extra = {}) => Chara.svg(who, { pose: "idle_01", dir: "down", face: "smile", outfit, color: "soft", ...extra });
  const ROYAL_OUT = { wanko: { head: "tophat", neck: "bowtie_red" }, gachan: { head: "fs_star_tiara", neck: "necklace" }, goji: { head: "crown", back: "cape" } };
  const keeperImg = (store, pose) => Art.npcSvg({ ...NeriShops.SHOPS[store].keeper, emo: "happy", ...(pose ? { pose } : {}) });
  const VELVET = { wanko: ["#3F5FA8", "#2C4380"], gachan: ["#C75B7A", "#A0405E"], goji: ["#2E8A6A", "#1F6A50"] };

  // ===================== とくだい ぬいぐるみ（A〜Cしょう・ラストワンしょう）=====================
  const PLUSH = {
    // ローリソン A: おうかんと あかい マントの ごじ（しろい えり・きんいろの からあげ）。こんいろの ベルベットの だい
    kj_mlaw_a: { w: 132, h: 150, draw: () => {
      let s = pouf(66, 124, 52, 22);
      s += P("M38,56 C16,72 10,110 12,126 L120,126 C122,110 116,72 94,56 Z", RED, 2.4) + L("M16,122 C14,104 20,78 38,62", GOLD, 2.2) + L("M116,122 C118,104 112,78 94,62", GOLD, 2.2) + stitch("M22,118 C20,100 26,82 40,68", "#FFFFFF40");
      s += grp(66, 76, 1, gojiTail() + gojiBody() + gojiEars(-40) + gojiMouth(-18));
      s += ermine(32, 100, 70, 9) + C(66, 76, 3.6, GOLD, 1.6) + C(66, 76, 1.6, RED_L, 0);
      s += gfootGoji(50, 122) + gfootGoji(82, 122) + grp(66, 76, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + goldKaraage(66, 104, 1.1);
      return s + crown(66, 34, 40) + tag(112, 128, GOLD_D);
    } },
    // ローリソン B: シルクハットと タキシードの わんこ（あかい ちょうネクタイ・きんぱくの おにぎり）
    kj_mlaw_b: { w: 124, h: 144, draw: () => {
      let s = pouf(62, 122, 48, 20) + grp(62, 100, 1, wankoTail() + wankoBody({ spots: false }));
      s += P("M33,96 C32,82 44,76 54,78 L62,108 L70,78 C80,76 92,82 91,96 C92,114 80,124 62,124 C44,124 32,114 33,96 Z", "#2A2A30", 2.2) + P("M54,78 L62,108 L70,78 C66,76 58,76 54,78 Z", "#FFFFFF", 1.8);
      s += L("M54,78 L47,96 L58,100", "#5A5A66", 1.6) + L("M70,78 L77,96 L66,100", "#5A5A66", 1.6) + C(62, 92, 1.4, GOLD, 0.8) + C(62, 99, 1.4, GOLD, 0.8);
      s += foot(48, 122) + foot(76, 122) + goldOnigiri(62, 108, 0.95) + paw(42, 104, 22) + paw(82, 104, -22);
      s += grp(62, 56, 1, wankoHead({ smile: true })) + bow(62, 80, RED, 0.85) + C(62, 80, 1.6, GOLD, 0.8);
      return s + tophat(66, 26, 1, -8) + tag(104, 126, GOLD_D);
    } },
    // ローリソン C: ティアラと しんじゅの がちゃん（チュールの スカート・プリン アラモードの グラス）
    kj_mlaw_c: { w: 120, h: 134, draw: () => {
      let s = pouf(60, 114, 46, 18);
      s += P("M26,112 C22,100 34,92 60,92 C86,92 98,100 94,112 C88,116 84,110 78,115 C72,110 66,116 60,112 C54,116 48,110 42,115 C36,110 32,116 26,112 Z", "#F8D3DF", 2) + L("M32,108 C42,104 78,104 88,108", "#FFFFFF", 1.4);
      s += grp(60, 96, 1, gachanBody()) + wing(33, 94, 1) + wing(87, 94, -1) + gfoot(48, 114) + gfoot(72, 114) + necklace(60, 79, 34, 7);
      s += grp(60, 54, 1, gachanHead({ smile: true })) + tiara(60, 24, 38);
      return s + parfait(62, 98, 0.95) + tag(22, 116, GOLD_D, -12);
    } },
    // ローリソン ラストワン: きんの ソファに おめかしの 3人（おうかんの ごじ・ティアラの がちゃん・シルクハットの わんこ）。170×134
    kj_mlaw_l: { w: 170, h: 134, draw: () => {
      let s = P("M14,96 C10,60 22,34 50,30 C64,22 76,26 85,30 C94,26 106,22 120,30 C148,34 160,60 156,96 Z", GOLD, 2.4) + P("M22,94 C19,64 28,42 52,38 C64,32 76,35 85,38 C94,35 106,32 118,38 C142,42 151,64 148,94 Z", NAVY, 2);
      for (const [x, y] of [[44, 56], [66, 50], [85, 54], [104, 50], [126, 56], [54, 74], [85, 72], [116, 74]]) s += C(x, y, 1.8, NAVY_D, 0) + L(`M${x - 6},${y + 6} L${x},${y} L${x + 6},${y + 6}`, NAVY_L, 1);
      s += grp(40, 74, 0.62, gojiBody() + gojiEars(-40) + gojiMouth(-18)) + crown(40, 50, 26);
      s += grp(85, 92, 0.6, gachanBody()) + grp(85, 66, 0.62, gachanHead({ smile: true })) + tiara(85, 46, 26) + necklace(85, 82, 22, 4, 7);
      s += grp(130, 92, 0.6, wankoBody({ spots: false })) + grp(130, 66, 0.6, wankoHead({ smile: true })) + tophat(132, 48, 0.62, -8) + bow(130, 82, RED, 0.55);
      s += P("M6,84 C2,74 10,66 18,70 C24,74 24,86 22,96 L22,110 L8,110 Z", NAVY_L, 2.2) + L("M8,76 C10,72 16,72 18,76", GOLD, 1.8) + P("M164,84 C168,74 160,66 152,70 C146,74 146,86 148,96 L148,110 L162,110 Z", NAVY_L, 2.2) + L("M162,76 C160,72 154,72 152,76", GOLD, 1.8);
      s += R(18, 94, 134, 16, 6, NAVY_L, 2.2) + L("M22,96.5 H148", GOLD, 1.8) + R(14, 108, 142, 7, 3, GOLD, 2) + L("M18,111.5 H152", GOLD_L, 1.2);
      for (const x of [22, 85, 148]) s += P(`M${x - 4},115 L${x + 4},115 L${x + 2},128 L${x - 2},128 Z`, GOLD_D, 1.8);
      return s + tag(158, 120, GOLD_D, -10);
    } },
    // せぶんぶん A: あかい だるまの ずきんの ごじ（きんの うずまき・きんの こばん）。きんらんの ざぶとん
    kj_msev_a: { w: 130, h: 146, draw: () => {
      let s = zabuBase(65, 118, 108, 14) + grp(65, 78, 1, gojiTail() + gojiBody());
      s += grp(65, 78, 1, P("M-40,0 C-48,-34 -28,-58 0,-58 C28,-58 48,-34 40,0 C30,6 -30,6 -40,0 Z", RED, 2.4) + L("M-36,-4 C-30,0 30,0 36,-4", GOLD, 2.2) + L("M-30,-38 c-6,6 -2,14 4,12 c4,-2 2,-8 -2,-7", GOLD, 2) + L("M30,-38 c6,6 2,14 -4,12 c-4,-2 -2,-8 2,-7", GOLD, 2)
        + E(0, -20, 25, 16, "#FFFFFF", 2.2) + shine(-22, -44, 8, 4, -30, 0.35) + gojiMouth(-20, 0.95));
      s += gfootGoji(49, 120) + gfootGoji(81, 120) + grp(65, 78, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + koban(65, 104, 0.95);
      return s + tag(112, 128, RED_D);
    } },
    // せぶんぶん B: きんの もようの はれぎの わんこ（おび・かんざし・はごいた）
    kj_msev_b: { w: 126, h: 142, draw: () => {
      let s = zabuBase(63, 116, 104, 14) + grp(63, 98, 1, wankoTail() + wankoBody({ spots: false }));
      s += P("M34,96 C33,82 44,76 63,76 C82,76 93,82 92,96 C93,114 80,122 63,122 C46,122 33,114 34,96 Z", RED, 2.2);
      for (const [x, y] of [[42, 88], [82, 86], [48, 112], [78, 112], [63, 116]]) s += flower(x, y, 5, GOLD_L, GOLD_D);
      s += P("M50,77 L63,96 L76,77 L71,76 L63,88 L55,76 Z", "#FFFFFF", 1.6) + R(36, 98, 54, 9, 3, GOLD, 2) + L("M40,102.5 H86", RED, 1.6) + C(63, 102.5, 2.6, RED_L, 1.2);
      s += foot(49, 120) + foot(77, 120) + paw(41, 100, 22) + hagoita(98, 92, 0.9, 14) + paw(86, 100, -22);
      return s + grp(63, 56, 1, wankoHead({ smile: true })) + kanzashi(86, 26) + tag(22, 124, RED_D, -12);
    } },
    // せぶんぶん C: かがみもちの うえの がちゃん（さんぼうの だい・しろい かみ・だいだいの はっぱ）
    kj_msev_c: { w: 118, h: 140, draw: () => {
      let s = P("M24,112 L94,112 L100,136 L18,136 Z", "#E9C98F", 2.4) + E(59, 124, 9, 6, "#C9A36A", 1.8) + R(16, 104, 86, 9, 2, "#F2D7A4", 2.2) + L("M20,108.5 H98", GOLD, 2) + L("M26,131 H92", GOLD, 1.8);
      s += P("M22,104 L96,104 L92,112 L86,106 L80,112 L74,106 L68,112 L62,106 L56,112 L50,106 L44,112 L38,106 L32,112 L26,106 Z", "#FFFFFF", 1.8) + L("M22,104 H96", RED, 2);
      s += E(59, 92, 36, 14, "#FFFDF8", 2.4) + shine(42, 86, 9, 3, -6, 0.6) + E(59, 74, 28, 11, "#FFFDF8", 2.4) + shine(46, 70, 7, 2.4, -6, 0.6);
      s += gfoot(50, 70) + gfoot(68, 70) + grp(59, 52, 0.84, gachanBody()) + wing(38, 50, 1) + wing(80, 50, -1);
      s += grp(59, 30, 0.82, gachanHead({ smile: true })) + P("M66,4 C74,0 82,4 84,10 C76,12 70,10 66,4 Z", PINE, 1.8) + L("M66,4 C72,6 78,8 84,10", "#2E6B45", 1.2);
      return s + tag(100, 124, RED_D);
    } },
    // せぶんぶん ラストワン: きんの もんの くろい じゅうばこから かおを だす 3人（ふた・みずひき）。168×136
    kj_msev_l: { w: 168, h: 136, draw: () => {
      let s = grp(150, 54, 1, R(-8, -40, 16, 74, 3, LACQ, 2.4) + L("M-4,-36 V30", GOLD, 1.6) + crest(0, -4, 6), 14);
      s += grp(118, 56, 0.52, gojiBody({ h: 96 }) + gojiEars(-40) + gojiMouth(-18)) + grp(84, 44, 0.54, gachanHead({ smile: true })) + P("M89,18 C95,15 101,18 102,23 C96,24 92,23 89,18 Z", PINE, 1.4);
      s += grp(50, 46, 0.52, wankoHead({ smile: true })) + flower(64, 27, 5.6, "#F48FB1");
      s += tier(28, 50, 112, 26) + tier(28, 76, 112, 26) + tier(28, 102, 112, 26) + L("M28,50 H140", GOLD, 2.2);
      s += grp(84, 89, 1, L("M-56,0 H56", RED, 2.6) + L("M-56,3.2 H56", "#FFFFFF", 1.6) + ringE(-7, 0, 7, 5, RED, 2.4) + ringE(7, 0, 7, 5, RED, 2.4) + ringE(-7, 0, 7, 5, GOLD, 1) + ringE(7, 0, 7, 5, GOLD, 1) + L("M-2,2 L-8,12 M2,2 L8,12", RED, 2.2));
      return s + tag(150, 122, RED_D, -10);
    } },
  };

  // ===================== チェア・ざぶとん・ティーカップ・がくぶち・ふくまねき・ラグ・クーポン・シート =====================
  const medal = (x, y, r, who, fill = CREAM) => C(x, y, r, fill, 1.8) + C(x, y, r - 2.2, "none", 1.2, `stroke-dasharray="2 2" opacity=".5"`) + grp(x, y + (who === "goji" ? -r * 0.15 : 0), (r * 2) / 92, smallHead(who));
  const ART = {};
  for (const who of ["wanko", "gachan", "goji"]) {
    const k = { wanko: 0, gachan: 1, goji: 2 }[who], [vel, velD] = VELVET[who];
    // ローリソン D: きんの わくの ベルベット チェア（せもたれの ボタンと まるい ししゅう・きんの あし）
    ART["kj_mlaw_d" + k] = { w: 76, h: 92, draw: () => {
      let s = P("M14,54 C10,24 22,5 38,5 C54,5 66,24 62,54 Z", GOLD, 2.2) + P("M18,52 C15,27 25,10 38,10 C51,10 61,27 58,52 Z", vel, 1.8);
      for (const [x, y] of [[28, 22], [48, 22], [24, 40], [52, 40], [38, 48]]) s += C(x, y, 1.6, velD, 0) + L(`M${x - 4},${y + 4} L${x},${y} L${x + 4},${y + 4}`, shade(vel, 0.3), 0.9);
      s += medal(38, 30, 11, who) + C(38, 6.4, 2.4, GOLD_L, 1.2);
      s += P("M5,48 C4,42 12,42 13,48 L14,62 L6,62 Z", vel, 1.8) + P("M71,48 C72,42 64,42 63,48 L62,62 L70,62 Z", vel, 1.8) + L("M6,47 C8,44 11,44 13,47 M70,47 C68,44 65,44 63,47", GOLD, 1.6);
      s += R(9, 50, 58, 14, 6, vel, 2) + L("M13,52.6 H63", GOLD, 1.6) + shine(22, 54, 8, 2, 0, 0.3) + R(8, 63, 60, 6, 2, GOLD, 1.8);
      s += L("M15,69 C12,77 17,83 12,89", GOLD_D, 3.4) + L("M61,69 C64,77 59,83 64,89", GOLD_D, 3.4) + L("M15,69 C12,77 17,83 12,89 M61,69 C64,77 59,83 64,89", GOLD_L, 1.2);
      return s + E(12, 89.5, 3, 1.6, GOLD_D, 1.2) + E(64, 89.5, 3, 1.6, GOLD_D, 1.2);
    } };
    // ローリソン E: きんの ふちの ティーカップと ソーサー（かおの えつけ・こんいろの おび）
    ART["kj_mlaw_e" + k] = { w: 46, h: 34, draw: () => E(23, 29, 21, 4.6, "#FFFFFF", 1.8) + ringE(23, 28.6, 15, 2.8, GOLD, 1.2)
      + L("M38,14 C46,14 46,24 36,25", GOLD_D, 3.4) + L("M38,14 C45,14 45,23 36,24.4", GOLD_L, 1.4)
      + P("M8,12 C8,24 14,29 23,29 C32,29 38,24 38,12 Z", "#FFFFFF", 2) + L("M10,22 C14,27 32,27 36,22", NAVY, 2.6) + E(23, 12, 15, 3.4, "#A8663A", 1.8) + L("M8.6,12 C12,9 34,9 37.4,12", GOLD, 1.6) + medal(23, 19.4, 5.6, who) + shine(12, 16, 1.4, 3, 10, 0.7) };
    // ローリソン G: きんの がくぶちの スタンド（なかに おめかしの キャラ）
    ART["kj_mlaw_g" + k] = { w: 46, h: 62, draw: () => frame(charaImg(who, ROYAL_OUT[who])) };
    // せぶんぶん D: きんらんの ざぶとん（4すみの ふさ・まんなかの ししゅう）
    ART["kj_msev_d" + k] = { w: 80, h: 40, draw: () => {
      let s = P("M12,6 Q40,2 68,6 Q78,16 76,26 Q40,31 4,26 Q2,16 12,6 Z", RED, 2.2) + P("M4,26 Q40,31 76,26 L75,32 Q40,37 5,32 Z", RED_D, 2);
      for (const [x, y] of [[18, 12], [30, 10], [50, 10], [62, 12], [14, 20], [66, 20], [24, 23], [56, 23]]) s += L(`M${x - 3.4},${y} L${x},${y - 3} L${x + 3.4},${y} L${x},${y + 3} Z`, GOLD, 1.1);
      s += grp(40, 16, 1, `<g transform="scale(1 0.66)">${medal(0, 0, 10.5, who)}</g>`) + shine(20, 9, 8, 1.6, -4, 0.35);
      for (const [x, y, sz] of [[12, 6, 0.6], [68, 6, 0.6], [5, 30, 1], [75, 30, 1]]) s += grp(x, y, sz, C(0, 0, 2.2, GOLD_D, 1.2) + P("M-3,1 L3,1 L4.6,9 L-4.6,9 Z", GOLD, 1.3));
      return s;
    } };
    // せぶんぶん E: きんらんの ラグ（へやでは ラグの 立体。がめんでは うえから みた 絵）
    ART["kj_msev_e" + k] = { w: 120, h: 80, draw: () => brocadeFlat(who) };
    // せぶんぶん G: ふくまねきの ちび ぬいぐるみ（ねこの ての ポーズ・すずの くびわ・きんの こばん・あかい ざぶとん）
    ART["kj_msev_g" + k] = { w: 48, h: 58, draw: () => maneki(charaImg(who, { neck: "bell" }, { gesture: "nyan" })) };
  }
  ART.kj_mlaw_g3 = { w: 46, h: 62, draw: () => frame(keeperImg("lawson")) };
  ART.kj_msev_g3 = { w: 48, h: 58, draw: () => maneki(keeperImg("sevenbun", "jump_01")) };
  // きんの がくぶち（アーチ・ふちの まるい かざり・こんいろの ベルベット・きんの なふだ・だい）
  function frame(img) {
    let s = R(9, 54, 28, 6, 2, GOLD_D, 1.8) + P("M5,56 L5,18 C5,8 13,2 23,2 C33,2 41,8 41,18 L41,56 Z", GOLD, 2.2) + P("M10,52 L10,19 C10,11 16,7 23,7 C30,7 36,11 36,19 L36,52 Z", NAVY, 1.6);
    s += place(img, 10, 10, 26, 40);
    for (const [x, y] of [[5.6, 30], [5.6, 42], [40.4, 30], [40.4, 42], [12, 6.6], [34, 6.6], [23, 2.6]]) s += C(x, y, 1.8, GOLD_L, 1.1);
    return s + R(16, 48, 14, 5, 1.4, GOLD_L, 1.4) + L("M18.6,50.5 h8.8", GOLD_D, 1);
  }
  // ふくまねき（あかい ざぶとん・キャラ・きんの こばん）
  function maneki(img) {
    return P("M4,48 Q24,44 44,48 L45,54 Q24,58 3,54 Z", RED, 1.8) + L("M6,50.4 Q24,47 42,50.4", GOLD, 1.4) + place(img, 2, 2, 44, 48) + koban(39, 47, 0.42, 16);
  }
  // きんらんの ラグ（うえから: あか・きんの ふち・きっこうの もよう・まるい もん・りょうはしの ふさ）
  const hexes = (x0, y0, w, h, r, col, sw) => {
    let s = "";
    const dx = r * 1.5, dy = r * Math.sqrt(3);
    for (let i = 0; x0 + i * dx <= x0 + w; i++) for (let j = 0; y0 + j * dy <= y0 + h; j++) {
      const cx = x0 + i * dx, cy = y0 + j * dy + (i % 2 ? dy / 2 : 0);
      if (cx - r < x0 || cx + r > x0 + w || cy - dy / 2 < y0 || cy + dy / 2 > y0 + h) continue;
      s += `<path d="${Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k; return (k ? "L" : "M") + f1(cx + r * Math.cos(a)) + "," + f1(cy + r * Math.sin(a)); }).join(" ")} Z" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    }
    return s;
  };
  function brocadeFlat(who) {
    let s = "";
    for (let y = 12; y <= 68; y += 6) s += L(`M8,${y} H2`, GOLD_D, 1.8) + L(`M112,${y} H118`, GOLD_D, 1.8);
    s += R(8, 4, 104, 72, 6, RED, 2.2) + hexes(17, 12, 86, 56, 6, GOLD, 1.2) + ringR(12.5, 8.5, 95, 63, 3, GOLD, 3);
    return s + C(60, 40, 20, RED_D, 0) + medal(60, 40, 17, who) + ringC(60, 40, 19, GOLD, 2.4);
  }
  // クーポン（3まい つづり）: ローリソンは きんの けん 3まい・せぶんぶんは ぽちぶくろ
  const FOOD_OF = { kj_mlaw_h0: "karaage", kj_mlaw_h1: "pudding", kj_mlaw_h2: "onigiri", kj_msev_h0: "oden", kj_msev_h1: "bread", kj_msev_h2: "cocoa" };
  const ticket = (x, y, w, h) => `M${x},${y} H${x + w} V${y + h * 0.36} C${x + w - 6},${y + h * 0.36} ${x + w - 6},${y + h * 0.64} ${x + w},${y + h * 0.64} V${y + h} H${x} Z`;
  const words = (x, col) => `<text x="${x}" y="31" text-anchor="middle" font-size="11.5" font-weight="bold" font-family="sans-serif" textLength="42" lengthAdjust="spacingAndGlyphs" fill="${col}" stroke="none">むりょう</text>`
    + `<text x="${x}" y="46" text-anchor="middle" font-size="10" font-weight="bold" font-family="sans-serif" textLength="28" lengthAdjust="spacingAndGlyphs" fill="${GOLD_D}" stroke="none">3まい</text>`;
  const icon = (id, x, y, w, h) => (FOOD_OF[id] ? place(Art.iconSvg("bag", FOOD_OF[id]), x, y, w, h, "xMidYMid meet") : koban(x + w / 2, y + h / 2, 0.85));
  for (const k of [0, 1, 2, 3]) {
    ART["kj_mlaw_h" + k] = { w: 120, h: 60, draw: () => {
      const id = "kj_mlaw_h" + k;
      let s = P(ticket(10, 2, 106, 44), GOLD_L, 2) + P(ticket(7, 5, 106, 44), GOLD, 2) + P(ticket(4, 9, 106, 46), CREAM, 2.2) + P(`M4,9 H26 V55 H4 Z`, NAVY, 2.2);
      s += C(15, 22, 4.2, GOLD, 1.4) + C(15, 42, 4.2, GOLD, 1.4) + L("M30,11 V53", "#C9B48A", 1.4, 'stroke-dasharray="2.4 2.4"') + icon(id, 31, 15, 30, 32);
      return s + words(80, NAVY);
    } };
    ART["kj_msev_h" + k] = { w: 120, h: 60, draw: () => {
      const id = "kj_msev_h" + k;
      let s = [[-14, "#FFFDF6"], [-2, "#FFF3D6"], [10, "#FFFDF6"]].map(([rot, col]) => grp(26, 30, 1, R(-9, -26, 18, 22, 2, col, 1.8) + L("M-5,-20 h10 M-5,-15 h10", "#E2C9A0", 1.2), rot)).join("");
      s += R(8, 18, 36, 38, 4, RED, 2.4) + ringR(11.5, 21.5, 29, 31, 2, GOLD, 1.4) + L("M8,34 H44", GOLD, 2.2) + ringE(20, 34, 5, 3.6, GOLD_D, 1.8) + ringE(32, 34, 5, 3.6, GOLD_D, 1.8) + L("M26,34 L22,44 M26,34 L30,44", GOLD_D, 1.8);
      s += icon(id, 48, 14, 28, 30);
      return s + words(96, RED_D);
    } };
  }
  // シール シート（6まい）: こんいろ／あかの だいし・きんの ふち
  const SLOTS6 = [[6, 10, 46, 46], [52, 10, 42, 42], [54, 54, 36, 36], [8, 58, 30, 30], [34, 76, 28, 28], [64, 84, 22, 22]];
  const sheet6 = (it, paper, rim) => {
    const ids = it.stickers.flatMap(([id, n]) => Array(n).fill(id)).slice(0, SLOTS6.length);
    let s = E(50, 106, 40, 3.4, "#4F465622", 0) + R(4, 4, 92, 100, 8, paper, 2.2) + L("M9,9 H91 V99 H9 Z", rim, 2) + L("M12,12 H88 V96 H12 Z", rim, 0.9, 'stroke-dasharray="3 3"');
    ids.forEach((id, i) => { const [x, y, w, h] = SLOTS6[i]; s += place(A.sticker(id), x, y, w, h, "xMidYMid meet"); });
    return s;
  };
  for (const k of [0, 1, 2]) {
    ART["kj_mlaw_i" + k] = { w: 100, h: 110, draw: () => sheet6(IchibanKuji.INDEX["kj_mlaw_i" + k], ["#DDE6F7", "#FCEFF4", "#EAF4EC"][k], GOLD) };
    ART["kj_msev_i" + k] = { w: 100, h: 110, draw: () => sheet6(IchibanKuji.INDEX["kj_msev_i" + k], ["#FFF0D2", "#FDE7EA", "#FFF6E6"][k], RED) };
  }

  // ===================== シール（シールちょう 100×100）=====================
  const SC = StickerArt.cut, puff = StickerArt.puff;
  const circleD = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
  const ring = (cx, cy, r, col = GOLD) => ringC(cx, cy, r, col, 3);
  const STK = {
    stk_kjmlaw_wanko: () => SC(circleD(50, 54, 38), "#DDE6F7") + ring(50, 54, 33) + grp(50, 62, 0.66, wankoHead({ smile: true })) + tophat(53, 40, 0.72, -8) + puff(50, 54, 38),
    stk_kjmlaw_gachan: () => SC(circleD(50, 54, 38), "#FCE4EC") + ring(50, 54, 33) + grp(50, 60, 0.72, gachanHead({ smile: true })) + tiara(50, 38, 32) + puff(50, 54, 38),
    stk_kjmlaw_goji: () => SC(circleD(50, 54, 38), "#E6EEE8") + ring(50, 54, 33) + grp(50, 66, 0.6, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + crown(50, 44, 30) + puff(50, 54, 38),
    stk_kjmlaw_crown: () => SC(circleD(50, 54, 36), "#FFF3D6") + ring(50, 54, 31) + crown(50, 72, 52) + puff(50, 54, 36),
    stk_kjmlaw_karaage: () => SC(circleD(50, 54, 36), "#FFF3D6") + goldKaraage(50, 62, 1.6) + puff(50, 54, 36),
    stk_kjmlaw_cake: () => SC("M18,86 L18,58 C18,50 26,46 32,46 L32,34 C32,26 68,26 68,34 L68,46 C74,46 82,50 82,58 L82,86 Z", "#FFFDF8") + R(22, 60, 56, 24, 4, "#FFF3F6", 1.8) + R(34, 36, 32, 14, 3, "#FFF3F6", 1.8) + L("M22,70 C30,66 40,74 50,70 C60,66 70,74 78,70", "#F48FB1", 2.4) + C(40, 32, 4, "#E53935", 1.6) + C(60, 32, 4, "#E53935", 1.6) + crown(50, 30, 22) + puff(50, 56, 30),
    stk_kjmsev_wanko: () => SC(circleD(50, 54, 38), "#FFE7E2") + ring(50, 54, 33, RED) + grp(50, 60, 0.68, wankoHead({ smile: true })) + kanzashi(66, 26) + puff(50, 54, 38),
    stk_kjmsev_gachan: () => SC("M14,86 C10,70 22,64 30,64 C24,56 30,40 50,40 C70,40 76,56 70,64 C78,64 90,70 86,86 Z", "#FFFDF8") + E(50, 76, 34, 10, "#FFFDF8", 2) + E(50, 64, 26, 9, "#FFFDF8", 2) + grp(50, 44, 0.56, gachanHead({ smile: true })) + P("M56,20 C62,16 70,20 70,25 C64,26 59,25 56,20 Z", PINE, 1.4) + puff(50, 56, 32),
    stk_kjmsev_goji: () => SC(circleD(50, 54, 38), "#FFE7E2") + grp(50, 60, 0.7, P("M-40,22 C-48,-14 -28,-40 0,-40 C28,-40 48,-14 40,22 C30,30 -30,30 -40,22 Z", RED, 2.4) + E(0, 0, 25, 17, "#FFFFFF", 2.2) + gojiMouth(0, 0.95) + L("M-30,-20 c-6,6 -2,14 4,12 c4,-2 2,-8 -2,-7 M30,-20 c6,6 2,14 -4,12 c-4,-2 -2,-8 2,-7", GOLD, 2)) + puff(50, 54, 38),
    stk_kjmsev_kagami: () => SC("M16,88 L22,62 C14,58 18,46 30,46 C28,36 40,30 50,30 C60,30 72,36 70,46 C82,46 86,58 78,62 L84,88 Z", "#FFFDF8") + R(18, 74, 64, 12, 2, "#F2D7A4", 1.8) + E(50, 66, 30, 10, "#FFFDF8", 2) + E(50, 52, 22, 8, "#FFFDF8", 2) + C(50, 38, 9, "#F6A23A", 2) + P("M54,28 C60,24 66,28 66,32 C60,33 56,32 54,28 Z", PINE, 1.4) + puff(50, 56, 30),
    stk_kjmsev_tai: () => SC("M10,52 C22,24 62,22 76,46 L92,32 L88,52 L92,72 L76,58 C62,82 22,80 10,52 Z", "#F07A7A") + L("M34,40 C40,46 40,58 34,64 M46,38 C52,46 52,58 46,66 M58,40 C63,46 63,58 58,64", "#FFFFFF", 1.8) + C(24, 48, 3.4, K, 0) + C(23, 47, 1.2, "#FFFFFF", 0) + P("M44,30 C50,20 60,20 64,30 Z", GOLD, 1.6) + puff(40, 50, 26),
    stk_kjmsev_koban: () => SC("M50,10 C74,10 86,30 86,50 C86,70 74,90 50,90 C26,90 14,70 14,50 C14,30 26,10 50,10 Z", GOLD) + koban(50, 50, 2) + puff(50, 50, 34),
  };

  // ===================== もちもの（ロイヤル ポシェット・がまぐち ポーチ。手に さげる）=====================
  const bag = (ctx) => {
    const h = HandItems.hand(ctx), store = ctx.col[0], who = ctx.col[1], law = store === "lawson";
    const x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 10, w = 30, hh = 26;
    let s;
    if (law) { // こんいろの ベルベット・きんの くさりの ひも・きんの ふち の かぶせ
      s = Array.from({ length: 7 }, (_, i) => { const t = i / 6, px = x - 10 + 20 * t, py = h.y - 6 + 16 * Math.pow(2 * t - 1, 2) - 2; return C(px, py, 1.8, GOLD, 1.2); }).join("");
      s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} L${f1(x + w / 2 + 1)},${f1(y0 + hh - 6)} C${f1(x + w / 2)},${f1(y0 + hh + 2)} ${f1(x - w / 2)},${f1(y0 + hh + 2)} ${f1(x - w / 2 - 1)},${f1(y0 + hh - 6)} Z" fill="${NAVY}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} C${f1(x + w / 2)},${f1(y0 + 12)} ${f1(x - w / 2)},${f1(y0 + 12)} ${f1(x - w / 2)},${f1(y0)} Z" fill="${NAVY_L}" stroke="${GOLD}" stroke-width="2.4" stroke-linejoin="round"/>`;
      s += C(x, y0 + 9, 6.4, CREAM, 1.6) + grp(x, y0 + 9, 0.12, smallHead(who));
    } else { // あかい きんらんの がまぐち（きんの くちがね・2つの たま）
      s = L(`M${f1(x - 9)},${f1(y0 - 2)} C${f1(x - 9)},${f1(h.y - 10)} ${f1(x + 9)},${f1(h.y - 10)} ${f1(x + 9)},${f1(y0 - 2)}`, GOLD_D, 2.6);
      s += `<path d="M${f1(x - w / 2)},${f1(y0 + 2)} C${f1(x - w / 2 - 3)},${f1(y0 + hh)} ${f1(x + w / 2 + 3)},${f1(y0 + hh)} ${f1(x + w / 2)},${f1(y0 + 2)} Z" fill="${RED}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      s += L(`M${f1(x - w / 2)},${f1(y0 + 2)} C${f1(x - w / 4)},${f1(y0 - 3)} ${f1(x + w / 4)},${f1(y0 - 3)} ${f1(x + w / 2)},${f1(y0 + 2)}`, GOLD, 3.4) + C(x - 3, y0 - 2.4, 2.4, GOLD_L, 1.2) + C(x + 3, y0 - 2.4, 2.4, GOLD_L, 1.2);
      for (const [px, py] of [[x - 9, y0 + 12], [x + 9, y0 + 12], [x, y0 + 19]]) s += flower(px, py, 3.4, GOLD_L, GOLD_D);
      s += C(x, y0 + 10, 5.6, CREAM, 1.4) + grp(x, y0 + 10, 0.1, smallHead(who));
    }
    return { top: s };
  };

  // ===================== へやの 立体と さわる うごき =====================
  // きんらんの ラグ（ラグの 立体）: あか・きんの ふち・きっこう・まるい もん・りょうはしの ふさ
  const rugModel = (who) => (k) => {
    const { w, d, shape, TP, lineOn, onP } = k, sh = FurnModels.shapes, x0 = -w / 2 + 6, y0 = -d + 6, ww = w - 12, dd = d - 12;
    let s = shape(TP(0), sh.rr(x0 - 2, y0 - 2, ww + 4, dd + 4, 10), INK, 0, 'fill-opacity=".12"');
    for (let y = y0 + 6; y <= y0 + dd - 6; y += 7) for (const [xa, xb] of [[x0, x0 - 7], [x0 + ww, x0 + ww + 7]]) s += lineOn(TP(0.4), [[xa, y], [xb, y + 0.6]], INK, 3.2) + lineOn(TP(0.4), [[xa, y], [xb, y + 0.6]], GOLD, 1.6);
    s += shape(TP(1), sh.rr(x0, y0, ww, dd, 6), RED, 1.6);
    s += lineOn(TP(1.05), sh.close(sh.rr(x0 + 5, y0 + 5, ww - 10, dd - 10, 4)), GOLD, 3);
    for (let i = 0; i < 6; i++) { const yy = y0 + 14 + i * ((dd - 28) / 5); s += lineOn(TP(1.05), [[x0 + 12, yy], [x0 + ww - 12, yy]], GOLD, 1, 'stroke-dasharray="5 4" opacity=".75"'); }
    s += onP(TP(1.1), -22, -d / 2 + 22, 44, 44, C(22, 22, 20, RED_D, 0) + grp(22, 22, 1, medal(0, 0, 17, who)) + ringC(22, 22, 19, GOLD, 2.4));
    return s;
  };
  const LIVE = {
    chair: { lines: ["ふかふかの ベルベット！", "すわると おうさま きぶん♪", "きんの あしが かっこいい"], notes: [[262, 330], [392, 523]], type: "sine", squish: 0.14 },
    zabuton: { lines: ["ぽふっ！ ふかふかの ざぶとん", "きんの ふさが ゆれるね", "すわると ぽかぽか"], notes: [[330, 180], [260, 420]], type: "sine", squish: 0.2 },
  };
  const install = (API) => {
    for (const it of API.ITEMS) {
      if (!it.net) continue;
      if (it.kind === "brocade") FurnModels.register(it.id, rugModel(it.who));
      else if (LIVE[it.kind]) A.live(it, LIVE[it.kind]);
    }
  };
  // KujiArt の 絵の いちらんに たす（KujiArt.pic・KujiArt.sticker・へやの 絵が この 絵を よむ）
  Object.assign(A.PLUSH, PLUSH); Object.assign(A.ART, ART); Object.assign(A.STK, STK);
  return { PLUSH, ART, STK, bag, rugModel, install, LIVE, brocadeFlat, crown, tiara, koban, GOLD, NAVY, RED };
})();
