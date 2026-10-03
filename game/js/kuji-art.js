// いちばんくじの 絵（ネリカスタウンの コンビニ 2つ・UI-55。しくみは js/ichiban-kuji.js・がめんは js/kuji-ui.js）。
// ・ビッグ ぬいぐるみ（A〜Cしょう・ラストワンしょう）: すわった 3人を ぬいぐるみに した オリジナルの 絵。ししゅうの め・フェルトの ほっぺ・ぬいめ・ぬのの タグ。
//   ローリソン: あおい しましまの せいふくの ごじ（からあげ）・おにぎりの きぐるみの わんこ・プリンの がちゃん・3人の レジ。
//   せぶんぶん: メロンパンの フードの わんこ・おでんの たまごの がちゃん・ココアの ごじ・おでんの なべの 3人。
// ・クッション・マグ・ブランケット（ラグの 立体）・エコバッグ（もちもの）・アクリル スタンド・ちび ぬいぐるみ・クーポンけん・シール・タペストリー・店の たな・くじの はこ。
// ・線は INK。SVG の id（グラデーション）は つかわない（かさねても かけない）。キラキラの えんしゅつは つけない（UI-50）。
// ・どれも この ゲームの ための オリジナルの 絵（じっさいの 商品・お店の なまえや 絵は つかわない）。
const KujiArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.4) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const P = (d, fill, w = 2.4, e = "") => `<path d="${d}" fill="${fill}" ${sk(w)}${e ? " " + e : ""}/>`;
  const L = (d, col = K, w = 1.6, e = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${e ? " " + e : ""}/>`;
  const E = (cx, cy, rx, ry, fill, w = 2.4, rot = 0, e = "") => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"${rot ? ` transform="rotate(${rot} ${f1(cx)} ${f1(cy)})"` : ""} fill="${fill}" ${w ? sk(w) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const C = (cx, cy, r, fill, w = 2.4, e = "") => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}" ${w ? sk(w) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const R = (x, y, w, h, rr, fill, sw = 2.4, e = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rr)}" fill="${fill}" ${sw ? sk(sw) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const grp = (x, y, s, body, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${rot})` : ""}${s !== 1 ? ` scale(${f1(s * 100) / 100})` : ""}">${body}</g>`;
  const svg = (body, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const place = (s, x, y, w, h, al = "xMidYMax meet") => s.replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="${al}" `);
  const shine = (x, y, rx, ry, rot = -30, a = 0.45) => E(x, y, rx, ry, "#FFFFFF", 0, rot, `fill-opacity="${a}"`);
  const stitch = (d, col = "#00000033", w = 1.2) => L(d, col, w, 'stroke-dasharray="2.4 2.6"');
  // ぬいめ（ふちの すこし うちがわの てんてん）
  const seamE = (cx, cy, rx, ry, col = "#0000001F") => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="${col}" stroke-width="1.3" stroke-dasharray="2.4 2.8"/>`;
  // ししゅうの め（くろい だえんに しろい ひかり）
  const eye = (x, y, s = 1) => E(x, y, 3.2 * s, 3.9 * s, K, 0) + C(x - 1 * s, y - 1.4 * s, 1.2 * s, "#FFFFFF", 0);
  const happyEye = (x, y, s = 1) => L(`M${f1(x - 3.6 * s)},${f1(y + 1.2 * s)} q${f1(3.6 * s)} ${f1(-4.6 * s)} ${f1(7.2 * s)} 0`, K, 2.2 * s);
  const cheek = (x, y, s = 1) => E(x, y, 5.2 * s, 3.2 * s, "#F7A9B8", 0, 0, 'fill-opacity=".75"');
  // ぬのの タグ（ハートの ししゅう・みせの いろの ふち）
  const tag = (x, y, col, rot = 12, s = 1) => grp(x, y, s, R(-8, -6, 16, 12, 2.2, "#FFFDF5", 1.8) + `<path d="M0,3.6 C-5.6,0 -4.4,-4 0,-1.6 C4.4,-4 5.6,0 0,3.6 Z" fill="${col}"/>` + L("M-5,4.4 h10", "#E9DCC4", 1.2), rot);
  const WAN = { c: "#FFFFFF", ear: "#2A2A30", pad: "#F6B7C4" }, GAC = { c: "#F9DC7A", d: "#E9C25A", beak: "#F29A3A" }, GOJ = { c: "#8C8686", d: "#767070", bump: "#A39D9D", in: "#D8D2D2", red: "#E8262A" };

  // ===================== 3人の ぬいぐるみの ぶひん（あたまの まんなかが 0,0）=====================
  // わんこの あたま: しろい まんまる・くろい たれみみ（うしろ）・ししゅうの め・はな・「人」の くち・ほっぺ
  const wankoEars = () => E(-35, -2, 15, 22, WAN.ear, 2.4, 22) + E(35, -2, 15, 22, WAN.ear, 2.4, -22) + shine(-38, -12, 4, 7, 22, 0.25) + shine(32, -12, 4, 7, -22, 0.25);
  const wankoFace = (o = {}) => (o.smile ? happyEye(-13, 2) + happyEye(13, 2) : eye(-13, 2) + eye(13, 2))
    + P("M-3.6,8.2 C-3.6,6 3.6,6 3.6,8.2 C3.6,10.4 1.4,11.6 0,11.6 C-1.4,11.6 -3.6,10.4 -3.6,8.2 Z", K, 0)
    + (o.smile ? P("M-4.4,14 Q0,20 4.4,14 Z", "#E8667A", 1.6) : L("M0,11.6 V14 M0,14 L-4,17.4 M0,14 L4,17.4", K, 1.8)) + cheek(-22, 11) + cheek(22, 11);
  const wankoHead = (o = {}) => (o.noEars ? "" : wankoEars()) + E(0, 0, 37, 32, WAN.c) + seamE(0, 0, 33, 28) + shine(-15, -16, 11, 6, -20, 0.5) + stitch("M0,-31 V-23") + (o.noFace ? "" : wankoFace(o));
  // わんこの からだ（すわり）: しろい からだ・くろい もよう・まえあし・あしの うら（にくきゅう）・しっぽ
  const wankoTail = () => P("M24,10 C36,4 40,-6 38,-14 C46,-6 44,10 30,18 Z", WAN.c, 2.2) + P("M37.6,-12 C42,-8 44,-2 42,4 C40,0 38,-6 37.6,-12 Z", WAN.ear, 0);
  const wankoBody = (o = {}) => E(0, 0, 30, 25, WAN.c) + (o.spots === false ? "" : P("M-14,-6 C-10,-10 -4,-8 -5,-3 C-6,1 -12,1 -14,-2 Z", WAN.ear, 0) + E(12, 8, 3.4, 4.2, WAN.ear, 0, 20) + E(-6, 13, 2.6, 2, WAN.ear, 0)) + shine(-12, -12, 8, 4, -18, 0.4);
  const paw = (x, y, rot = 0, fill = WAN.c) => E(x, y, 9, 12, fill, 2.4, rot);
  const foot = (x, y, fill = WAN.c, pad = WAN.pad) => E(x, y, 13, 8.6, fill) + E(x, y + 1.4, 4.4, 3, pad, 0) + C(x - 5.4, y - 3.4, 1.6, pad, 0) + C(x, y - 5, 1.6, pad, 0) + C(x + 5.4, y - 3.4, 1.6, pad, 0);
  // がちゃんの あたま: きいろの まんまる・ししゅうの め・オレンジの くちばし・ほっぺ
  const gachanFace = (o = {}) => (o.smile ? happyEye(-12, 0) + happyEye(12, 0) : eye(-12, 0) + eye(12, 0))
    + P("M-8.6,9 C-5,5.6 5,5.6 8.6,9 C5,13.6 -5,13.6 -8.6,9 Z", GAC.beak, 2) + L("M-7.4,9 H7.4", "#C46F1C", 1.2) + cheek(-22, 9) + cheek(22, 9);
  const gachanHead = (o = {}) => C(0, 0, 35, GAC.c) + seamE(0, 0, 31, 31, "#00000024") + shine(-14, -16, 11, 6, -20, 0.5) + stitch("M0,-34 V-26", "#00000026") + (o.noFace ? "" : gachanFace(o));
  const gachanBody = () => E(0, 0, 28, 23, GAC.c) + shine(-11, -10, 8, 4, -18, 0.4);
  const wing = (x, y, side) => E(x, y, 7.4, 12.5, GAC.c, 2.4, side * 26);
  const gfoot = (x, y) => E(x, y, 12, 7, GAC.beak) + L(`M${x - 4},${y - 1} v3 M${x},${y - 2} v4 M${x + 4},${y - 1} v3`, "#C46F1C", 1.2);
  // ごじ: はいいろの まめの かたち（あたまと からだが ひとつ）・まるい こぶ・しろい くちに あかい ギザギザ・ぽつぽつの うで・とげの しっぽ
  const gojiShape = (h = 100) => `M-32,${f1(h * 0.5)} C-44,${f1(h * 0.24)} -44,${f1(-h * 0.22)} -30,${f1(-h * 0.4)} C-18,${f1(-h * 0.56)} 18,${f1(-h * 0.56)} 30,${f1(-h * 0.4)} C44,${f1(-h * 0.22)} 44,${f1(h * 0.24)} 32,${f1(h * 0.5)} Z`;
  const gojiEars = (y = -40) => C(-24, y, 9.5, GOJ.bump) + C(-24, y + 1, 5, GOJ.in, 0) + C(24, y, 9.5, GOJ.bump) + C(24, y + 1, 5, GOJ.in, 0);
  const gojiMouth = (y = -14, s = 1) => grp(0, y, s, E(0, 0, 20, 11.5, "#FFFFFF", 2.4) + P("M-15.6,0 L-12.6,-5.6 L-9.6,0 L-6.4,-5.8 L-3.2,0 L0,-5.8 L3.2,0 L6.4,-5.8 L9.6,0 L12.6,-5.6 L15.6,0 L12.6,5.6 L9.6,0 L6.4,5.8 L3.2,0 L0,5.8 L-3.2,0 L-6.4,5.8 L-9.6,0 L-12.6,5.6 Z", GOJ.red, 0));
  const gojiArm = (x, y, side) => grp(x, y, 1, P(`M0,-9 C${side * 14},-10 ${side * 18},-4 ${side * 18},2 C${side * 18},8 ${side * 12},11 0,9 Z`, GOJ.c) + C(side * 15.4, -4.4, 2.6, "#FFFFFF", 1.6) + C(side * 17.2, 1.2, 2.6, "#FFFFFF", 1.6) + C(side * 14.4, 6.4, 2.6, "#FFFFFF", 1.6));
  const gojiTail = () => P("M18,34 C34,36 46,28 50,16 L45,19 L47,10 L41,15 L41,7 L36,14 C34,20 28,24 18,24 Z", GOJ.c, 2.2);
  const gfootGoji = (x, y) => E(x, y, 13, 7.6, GOJ.c) + E(x, y + 1, 6, 3, GOJ.bump, 0);
  const gojiBody = (o = {}) => P(gojiShape(o.h || 100), GOJ.c) + `<path d="${gojiShape(o.h || 100)}" transform="scale(0.88 0.9)" fill="none" stroke="#FFFFFF40" stroke-width="1.4" stroke-dasharray="2.6 3"/>` + shine(-20, -30, 9, 5, -30, 0.32) + stitch(`M0,${f1(-(o.h || 100) * 0.5 + 6)} V${f1(-(o.h || 100) * 0.5 + 14)}`, "#FFFFFF55");

  // ===================== コンビニの きせかえ =====================
  // ローリソン: あおと しろの しましまの せいふく（からだの うえに かさねる 前かけ）・あおい ちょうネクタイ・なふだ
  const LAW = { blue: "#4A8CC9", dark: "#2F6CA8", light: "#DDEBF6" }, SEV = { or: "#F4A13A", gr: "#3FA36B", rd: "#E53935", bg: "#FCEFE3" };
  const stripes = (x0, x1, y0, y1, step, col, w) => { let s = ""; for (let y = y0; y <= y1; y += step) s += L(`M${f1(x0)},${f1(y)} H${f1(x1)}`, col, w); return s; };
  const bow = (x, y, col, s = 1) => grp(x, y, s, P("M0,0 L-9,-5.6 C-11,-6 -11,6 -9,5.6 Z", col, 1.8) + P("M0,0 L9,-5.6 C11,-6 11,6 9,5.6 Z", col, 1.8) + R(-2.6, -3.2, 5.2, 6.4, 2, col, 1.8));
  const badge = (x, y, col) => R(x - 6.5, y - 4.2, 13, 8.4, 1.8, "#FFFFFF", 1.6) + R(x - 4.6, y - 2.4, 4.4, 4.8, 1, col, 0) + L(`M${f1(x + 1.2)},${f1(y - 1)} h3.4 M${f1(x + 1.2)},${f1(y + 1.4)} h3.4`, "#9AA6B2", 1);
  // からあげの カップ（ローリソン）・おにぎり・プリン・おでん・メロンパン・ココア（もつ もの）
  const nug = (x, y, r, rot = 0) => grp(x, y, 1, P(`M${-r},0 C${-r},${f1(-r * 0.9)} ${f1(-r * 0.3)},${f1(-r * 1.1)} ${f1(r * 0.3)},${-r} C${r},${f1(-r * 0.8)} ${f1(r * 1.1)},${f1(-r * 0.1)} ${f1(r * 0.9)},${f1(r * 0.5)} C${f1(r * 0.6)},${r} ${f1(-r * 0.4)},${f1(r * 1.05)} ${f1(-r * 0.8)},${f1(r * 0.6)} C${-r},${f1(r * 0.4)} ${-r},${f1(r * 0.2)} ${-r},0 Z`, "#D98A2E", 1.8) + L(`M${f1(-r * 0.5)},${f1(-r * 0.45)} q${f1(r * 0.35)},${f1(-r * 0.3)} ${f1(r * 0.7)},${f1(-r * 0.1)}`, "#F3BE63", 1.6), rot);
  const karaageCup = (x, y, s = 1) => grp(x, y, s, nug(-7, -12, 6.4, -15) + nug(7, -12, 6.4, 20) + nug(0, -16, 6.6, 5) + L("M8,-30 L11,-14", "#C9A36A", 1.8) + P("M8,-30 L15,-28 L9.6,-25 Z", "#FFD54F", 1.2)
    + P("M-13,-9 L13,-9 L10,10 L-10,10 Z", "#E95F4B", 2.2) + R(-11.4, -2.4, 22.8, 4.4, 1, "#FFF3E0", 0) + C(0, 5.6, 2.2, "#FFFFFF", 0));
  const onigiriBall = (x, y, s = 1, face = true) => grp(x, y, s, P("M0,-17 C5,-17 18,6 16,10 C14,14 -14,14 -16,10 C-18,6 -5,-17 0,-17 Z", "#FFFDF6", 2.2) + R(-8, 1.6, 16, 11.4, 1.8, "#2E3B33", 1.8) + (face ? C(-4.4, -3, 1.3, K, 0) + C(4.4, -3, 1.3, K, 0) + L("M-1.6,-0.6 q1.6,1.6 3.2,0", K, 1) : "") + shine(-6, -9, 2.4, 4.4, 30, 0.6));
  const spoon = (x, y, rot = -30) => grp(x, y, 1, R(-1.6, -2, 3.2, 20, 1.6, "#E8EEF2", 1.6) + E(0, -6, 4.6, 6.4, "#F3F7FA", 1.8), rot);
  const mug = (x, y, s, col, inner) => grp(x, y, s, P("M-11,-10 L-11,8 C-11,12 -7,14 0,14 C7,14 11,12 11,8 L11,-10 Z", col, 2.2) + L("M11,-5 C19,-5 19,7 11,7", K, 3.2) + L("M11,-5 C18,-5 18,7 11,7", col, 1.6) + E(0, -10, 11, 3.6, inner, 2.2));
  // メロンパンの あみめ: だえん（まんなか 0,0・はんけい rx, ry）の なかで y が ylim より うえ だけに ななめの 線を 2むき
  const criss = (rx, ry, ylim, step = 9, col = "#C9953F", w = 1.4) => {
    let g = "";
    for (const m of [0.85, -0.85]) for (let c = -rx * 2; c <= rx * 2 + 0.01; c += step) {
      const A = 1 / (rx * rx) + (m * m) / (ry * ry), B = (2 * m * c) / (ry * ry), Cq = (c * c) / (ry * ry) - 1, D = B * B - 4 * A * Cq;
      if (D <= 0) continue;
      let x1 = (-B - Math.sqrt(D)) / (2 * A), x2 = (-B + Math.sqrt(D)) / (2 * A), y1 = m * x1 + c, y2 = m * x2 + c;
      if (y1 > ylim && y2 > ylim) continue;
      if (y1 > ylim) { x1 = (ylim - c) / m; y1 = ylim; }
      if (y2 > ylim) { x2 = (ylim - c) / m; y2 = ylim; }
      if (Math.hypot(x2 - x1, y2 - y1) > 2) g += L(`M${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)}`, col, w);
    }
    return g;
  };

  // ===================== ビッグ ぬいぐるみ =====================
  const PLUSH = {
    // ローリソン A: てんいん ごじ（あおい しましまの せいふく・ちょうネクタイ・なふだ・からあげの カップ）。120×130
    kj_law_a: { w: 120, h: 130, draw: () => grp(60, 76, 1, gojiTail() + gojiBody()
      + P("M-38,-2 C-38,-6 38,-6 38,-2 L39,40 C39,48 -39,48 -39,40 Z", "#FFFFFF", 2.2) + stripes(-35, 35, 4, 42, 7, LAW.blue, 3.6) + L("M0,-4 V44", "#00000022", 1.2)
      + bow(0, -3, LAW.blue, 0.9) + badge(-20, 12, LAW.blue)
      + gojiEars(-40) + gojiMouth(-18)) + gfootGoji(44, 120) + gfootGoji(76, 120)
      + grp(60, 76, 1, gojiArm(-36, 18, -1) + gojiArm(36, 18, 1)) + karaageCup(60, 102, 1.05) + tag(98, 114, LAW.blue) },
    // ローリソン B: おにぎりの きぐるみの わんこ（さんかくの フード・のりの マフラー）
    kj_law_b: { w: 120, h: 130, draw: () => {
      let t = grp(60, 96, 1, wankoTail() + wankoBody()) + foot(45, 121) + foot(75, 121) + paw(34, 99, 22) + paw(86, 99, -22);
      // おにぎりの フード（ごはんの つぶ・したに のり）・よこから くろい みみ・まんなかから かお
      const rice = [[-18, -22], [-6, -32], [8, -26], [20, -12], [-26, -6], [26, 2], [-12, -14], [12, -38], [0, -42], [-30, 8], [32, 12]].map(([x, y], i) => E(x, y, 2.6, 1.4, "#E6D8BC", 0, ((i * 47) % 160) - 80)).join("");
      t += grp(60, 54, 1, E(-40, 6, 9, 14, WAN.ear, 2.2, 24) + E(40, 6, 9, 14, WAN.ear, 2.2, -24)
        + P("M0,-48 C7,-48 46,10 46,20 C46,32 -46,32 -46,20 C-46,10 -7,-48 0,-48 Z", "#FFF8E8", 2.4) + rice + shine(-14, -28, 4, 10, 30, 0.7)
        + E(0, 4, 25, 20, WAN.c, 2.2) + seamE(0, 4, 22, 17) + grp(0, 2, 0.86, wankoFace({})) + R(-34, 18, 68, 13, 4, "#2E3B33", 2.2) + L("M-28,24.4 h56", "#4A5A50", 1.4));
      return t + tag(98, 116, LAW.blue);
    } },
    // ローリソン C: プリンの がちゃん（カラメルの ぼうし・クリームと さくらんぼ・スプーン）
    kj_law_c: { w: 120, h: 126, draw: () => grp(60, 98, 1, gachanBody()) + wing(33, 96, 1) + wing(87, 96, -1) + gfoot(48, 119) + gfoot(72, 119)
      + grp(60, 56, 1, gachanHead({ smile: true }) + P("M-30,-14 C-30,-34 30,-34 30,-14 C27,-10 24,-6 21,-11 C18,-5 14,-3 11,-9 C8,-3 2,-2 0,-8 C-3,-2 -8,-3 -11,-9 C-14,-3 -19,-5 -21,-11 C-24,-6 -27,-10 -30,-14 Z", "#8D5524", 2.2)
        + shine(-14, -24, 7, 3, -10, 0.35) + P("M-11,-34 C-11,-44 11,-44 11,-34 Z", "#FFFDF8", 2) + C(0, -46, 5.4, "#E53935", 1.8) + L("M0,-51 q3,-4 6,-3", K, 1.4))
      + spoon(96, 92, 24) + tag(26, 112, LAW.blue, -12) },
    // せぶんぶん A: メロンパンの フードの わんこ（あみめ・エプロン）
    kj_sev_a: { w: 120, h: 128, draw: () => grp(60, 94, 1, wankoTail() + wankoBody({ spots: false }) + P("M-24,-18 C-24,-20 24,-20 24,-18 L26,22 C26,26 -26,26 -26,22 Z", "#FFFFFF", 2) + R(-24, -18, 48, 6.6, 2, SEV.or, 1.4) + R(-24, -12, 48, 4, 0, SEV.gr, 0) + R(-24, -8.2, 48, 4, 0, SEV.rd, 0) + E(0, 8, 8, 5, SEV.bg, 1.4))
      + foot(45, 120) + foot(75, 120) + paw(33, 97, 24) + paw(87, 97, -24)
      + grp(60, 52, 1, E(-38, 4, 13, 20, WAN.ear, 2.4, 18) + E(38, 4, 13, 20, WAN.ear, 2.4, -18)
        + P("M-42,4 C-44,-34 -22,-48 0,-48 C22,-48 44,-34 42,4 C40,12 30,14 28,8 C24,-6 -24,-6 -28,8 C-30,14 -40,12 -42,4 Z", "#F2C472", 2.4) + grp(0, -16, 1, criss(36, 29, 6)) + shine(-20, -34, 8, 4, -20, 0.5)
        + E(0, 12, 28, 23, WAN.c, 2.2) + grp(0, 10, 0.9, wankoFace({ smile: true })))
      + tag(98, 114, SEV.or) },
    // せぶんぶん B: おでんの たまごの がちゃん（しろみの フード・おわん・だいこん・ゆげの ししゅう）
    kj_sev_b: { w: 124, h: 118, draw: () => {
      let t = L("M36,16 c-5,-5 5,-8 0,-14 M62,10 c-5,-5 5,-8 0,-14 M88,16 c-5,-5 5,-8 0,-14", "#C9B9A8", 2.6);
      // ゆでたまごの がちゃん: しろみの フード ＋ きみ（がちゃんの かお）
      t += grp(62, 50, 1, E(0, 0, 38, 36, "#FFFFFF", 2.4) + seamE(0, 0, 34, 32) + shine(-16, -18, 11, 6, -20, 0.6) + C(0, 4, 24, GAC.c, 2.2) + grp(0, 4, 0.7, gachanFace({ smile: true })));
      // おわん（だし・だいこん・こんにゃく）と ふちを もつ はね
      t += P("M8,74 C8,104 30,114 62,114 C94,114 116,104 116,74 Z", "#FFF8EC", 2.4) + E(62, 74, 54, 9, "#E9B872", 2.2) + L("M18,88 C34,94 90,94 106,88", "#E6D5B8", 2);
      t += grp(24, 74, 1, E(0, -2, 11, 6, "#FFF3CF", 2) + L("M-6,-3 q6,-3 12,0", "#E4C98F", 1.4)) + P("M90,78 L100,62 L108,78 Z", "#9EA3A8", 2) + C(99, 73, 0.9, "#5D6166", 0) + C(102, 75.4, 0.9, "#5D6166", 0);
      t += wing(40, 72, 1) + wing(84, 72, -1);
      return t + tag(104, 104, SEV.or);
    } },
    // せぶんぶん C: ココアの ごじ（ニットぼう・マフラー・ココアの マグ）
    kj_sev_c: { w: 120, h: 130, draw: () => grp(60, 76, 1, gojiTail() + gojiBody()
      + P("M-36,-4 C-24,4 24,4 36,-4 L36,6 C24,14 -24,14 -36,6 Z", SEV.gr, 2.2) + R(10, 4, 11, 22, 3, SEV.gr, 2.2) + stripes(11, 20, 10, 22, 6, "#FFFFFF88", 1.4)
      + gojiMouth(-22) + P("M-30,-40 C-30,-60 30,-60 30,-40 Z", SEV.or, 2.4) + R(-32, -44, 64, 9, 4, "#F7D79C", 2.2) + stripes(-26, 26, -54, -48, 6, "#FFFFFF66", 1.2) + C(0, -63, 6, "#FFFDF5", 2)
      + C(-24, -38, 7.4, GOJ.bump, 2.2) + C(24, -38, 7.4, GOJ.bump, 2.2)) + gfootGoji(44, 120) + gfootGoji(76, 120)
      + grp(60, 76, 1, gojiArm(-35, 20, -1) + gojiArm(35, 20, 1)) + mug(60, 100, 1.1, "#FFFFFF", "#8D5B3E") + R(55, 86, 7, 5, 1.6, "#FFF3F6", 1.4) + L("M54,80 c-4,-4 4,-6 0,-11 M64,80 c-4,-4 4,-6 0,-11", "#B9C6CF", 2) + tag(98, 114, SEV.or) },
    // ローリソン ラストワン: 3にんの レジ（ちいさな レジの うしろに せいふくの 3人）。150×118
    kj_law_l: { w: 150, h: 118, draw: () => {
      let s = grp(34, 58, 0.6, wankoHead({ smile: true })) + grp(116, 54, 0.6, grp(0, 38, 1, gojiBody({ h: 100 }) + gojiEars(-40) + gojiMouth(-20)));
      s += grp(75, 50, 0.64, gachanHead({ smile: true })) + bow(75, 75, LAW.blue, 0.7) + bow(34, 79, LAW.blue, 0.7) + bow(116, 79, LAW.blue, 0.7);
      s += P("M8,82 L142,82 L146,114 L4,114 Z", LAW.blue, 2.4) + stripes(10, 140, 90, 108, 9, "#FFFFFF", 3.4) + L("M4,114 H146", K, 2.4);
      s += grp(106, 76, 1, R(-14, -10, 28, 14, 3, "#E9EEF2", 2) + R(-10, -18, 18, 9, 2, "#7EC8F0", 1.8) + R(-12, 4, 24, 4, 1.4, "#C9D3DB", 1.6)) + grp(44, 80, 1, C(0, -2, 5, "#F7C948", 1.8) + R(-5, 2, 10, 2.4, 1, "#C9A030", 1.2));
      return s + tag(16, 104, LAW.blue, -10);
    } },
    // せぶんぶん ラストワン: おでんの なべの 3人（しきりの ある なべ・だいこんの わんこ・たまごの がちゃん・こんにゃくの ごじ）。150×104
    kj_sev_l: { w: 150, h: 104, draw: () => {
      let s = L("M40,14 c-5,-5 5,-8 0,-14 M75,10 c-5,-5 5,-8 0,-14 M110,14 c-5,-5 5,-8 0,-14", "#C9B9A8", 2.6);
      s += grp(32, 52, 0.56, wankoHead({ smile: true })) + grp(32, 33, 0.9, E(0, 0, 16, 5, "#FFF3CF", 1.8) + L("M-8,0 q8,-3 16,0", "#E4C98F", 1.2));
      s += grp(75, 48, 0.62, E(0, 0, 40, 38, "#FFFFFF", 2.6) + C(0, 6, 26, GAC.c, 2.4) + grp(0, 6, 0.74, gachanFace({ smile: true })));
      s += grp(118, 70, 0.56, gojiBody({ h: 96 }) + gojiEars(-40) + gojiMouth(-18)) + P("M110,40 L118,26 L126,40 Z", "#9EA3A8", 1.8) + C(116.4, 36, 0.8, "#5D6166", 0) + C(119.6, 37.4, 0.8, "#5D6166", 0);
      s += R(6, 66, 138, 36, 6, "#B5B8BA", 2.4) + R(12, 68, 126, 10, 3, "#E6B96E", 1.8) + L("M52,66 V102 M98,66 V102", K, 2) + L("M10,92 H140", "#9EA3A8", 1.6);
      return s + tag(138, 94, SEV.or);
    } },
  };
  const plush = (id) => { const p = PLUSH[id]; return p ? svg(p.draw(), p.w, p.h) : ""; };

  // ===================== クッション・マグ・アクリル スタンド・ちび ぬいぐるみ・タペストリー =====================
  const face = (x, y, s = 1) => C(x - 5 * s, y, 1.5 * s, K, 0) + C(x + 5 * s, y, 1.5 * s, K, 0) + L(`M${f1(x - 2 * s)},${f1(y + 2.6 * s)} q${f1(2 * s)},${f1(2 * s)} ${f1(4 * s)},0`, K, 1.2 * s) + E(x - 9 * s, y + 3 * s, 2.6 * s, 1.6 * s, "#F7A9B8", 0, 0, 'fill-opacity=".8"') + E(x + 9 * s, y + 3 * s, 2.6 * s, 1.6 * s, "#F7A9B8", 0, 0, 'fill-opacity=".8"');
  const ART = {
    // からあげは まんまるを すこし つぶした かたち（たかさ 46 に おさめる）
    kj_law_d0: { w: 68, h: 46, draw: () => `<g transform="translate(34 23.5) scale(1.9 1.4)">${nug(0, 0, 13, 6)}</g>` + face(34, 24, 1.1) + shine(22, 11, 5, 3, -20, 0.4) },
    kj_law_d1: { w: 66, h: 54, draw: () => grp(33, 29, 1.5, P("M0,-18 C5,-18 20,7 18,11 C16,15 -16,15 -18,11 C-20,7 -5,-18 0,-18 Z", "#FFFDF6", 1.6) + R(-9, 2, 18, 12, 2, "#2E3B33", 1.4) + shine(-6, -8, 2.4, 4.4, 30, 0.6)) + face(33, 27, 1.1) },
    kj_law_d2: { w: 70, h: 48, draw: () => R(6, 8, 50, 34, 14, "#F0C27B", 2.4) + E(54, 25, 12, 17, "#F7D79C", 2.4) + L("M54,25 m-2,0 a2,2 0 1,1 4,0 a5,5.5 0 1,1 -9,0 a8,9 0 1,1 15,0", "#FFFBF2", 2.6) + face(28, 24, 1.1) + shine(18, 14, 8, 3, -8, 0.4) + stitch("M10,38 H48", "#FFFFFF66") },
    kj_sev_d0: { w: 68, h: 42, draw: () => R(4, 14, 60, 22, 11, "#E9C98F", 2.4) + E(34, 15, 30, 9, "#FFF3CF", 2.4) + L("M18,14 q16,-6 32,0", "#E4C98F", 1.6) + face(34, 26, 1.05) + shine(16, 12, 6, 2, 0, 0.5) },
    kj_sev_d1: { w: 62, h: 46, draw: () => E(31, 25, 26, 19, "#FFFFFF", 2.4) + E(38, 18, 11, 9, "#FFD54F", 2) + face(27, 29, 1.05) + shine(18, 14, 6, 3, -20, 0.6) },
    kj_sev_d2: { w: 66, h: 48, draw: () => P("M6,42 L33,6 L60,42 Z", "#9EA3A8", 2.4) + [[24, 30], [40, 28], [33, 18], [30, 36], [46, 36], [18, 38]].map(([x, y]) => C(x, y, 1.2, "#5D6166", 0)).join("") + face(33, 32, 1) },
    kj_law_dc: { w: 70, h: 96, draw: () => tapestry("lawson") },
    kj_sev_dc: { w: 70, h: 96, draw: () => tapestry("sevenbun") },
  };
  // マグカップ（ローリソン E）: しましまに かお
  const smallHead = (who, s = 1) => who === "wanko" ? grp(0, 0, s, wankoHead({ smile: true })) : who === "gachan" ? grp(0, 0, s, gachanHead({ smile: true })) : grp(0, 6 * s, s, P(gojiShape(66), GOJ.c) + gojiEars(-26) + gojiMouth(-6, 0.8));
  for (const [k, who] of [["e0", "wanko"], ["e1", "gachan"], ["e2", "goji"]]) ART["kj_law_" + k] = { w: 40, h: 42, draw: () => P("M5,8 L5,34 C5,38 10,40 18,40 C26,40 31,38 31,34 L31,8 Z", "#FFFFFF", 2) + stripes(6, 30, 12, 36, 6, LAW.blue, 2.2) + L("M31,14 C39,14 39,28 31,28", K, 3.2) + L("M31,14 C38,14 38,28 31,28", "#FFFFFF", 1.6) + E(18, 8, 13, 3.6, "#E9F1F8", 2) + grp(18, 24, 0.24, C(0, 0, 44, "#FFFFFF", 0) + smallHead(who)) };
  // アクリル スタンド（ローリソン G）: すきとおった いたに せいふくの キャラ・だい
  const LAW_OUT = { body: "marine_stripe", neck: "bowtie_blue" }, SEV_OUT = { head: "hachimaki", body: "apron", neck: "bowtie_red" };
  const charImg = (who, store, face = "smile") => who === "keeper" ? Art.npcSvg({ ...NeriShops.SHOPS[store].keeper, emo: "happy" }) : Chara.svg(who, { pose: "idle_01", dir: "down", face, outfit: store === "lawson" ? LAW_OUT : SEV_OUT, color: "soft" });
  for (const [k, who] of [["g0", "wanko"], ["g1", "gachan"], ["g2", "goji"], ["g3", "keeper"]]) ART["kj_law_" + k] = { w: 40, h: 58, draw: () => R(3, 2, 34, 48, 6, "#E8F4FB", 1.6, 'fill-opacity=".85"') + R(5, 4, 30, 44, 5, LAW.light, 0) + place(charImg(who, "lawson"), 4, 6, 32, 42) + L("M8,8 L12,4", "#FFFFFF", 1.6) + E(20, 52, 17, 5, "#E8F4FB", 1.6, 0, 'fill-opacity=".9"') + R(16, 46, 8, 6, 1.6, "#E8F4FB", 1.4) };
  // ちび ぬいぐるみ（せぶんぶん G）: はちまきと エプロンの キャラに ボールチェーンと タグ
  for (const [k, who] of [["g0", "wanko"], ["g1", "gachan"], ["g2", "goji"], ["g3", "keeper"]]) ART["kj_sev_" + k] = { w: 44, h: 50, draw: () => place(charImg(who, "sevenbun"), 2, 6, 40, 44) + L("M22,2 V8", "#B9BDC2", 1.4) + C(22, 2.4, 2.4, "#E3E6EA", 1.2) + tag(34, 42, SEV.or, 10, 0.7) };
  // タペストリー（ダブルチャンスしょう・かべ）: ぼう・ぬの・3人・ふさ
  function tapestry(store) {
    const S = store === "lawson", col = S ? LAW.blue : SEV.or, bg = S ? LAW.light : SEV.bg;
    let s = R(2, 4, 66, 5, 2.4, "#C9A36A", 1.8) + L("M14,4 L35,-2 L56,4", "#8A6A4A", 1.4);
    s += P("M6,8 H64 V82 L56,90 L49,82 L42,90 L35,82 L28,90 L21,82 L14,90 L6,82 Z", bg, 2) + R(6, 8, 58, 8, 0, col, 1.6);
    s += S ? stripes(8, 62, 70, 80, 5, col, 1.6) : R(6, 70, 58, 3.4, 0, SEV.or, 0) + R(6, 73.4, 58, 3.4, 0, SEV.gr, 0) + R(6, 76.8, 58, 3.4, 0, SEV.rd, 0);
    s += place(charImg("wanko", store), 4, 22, 24, 46) + place(charImg("goji", store), 42, 22, 24, 46) + place(charImg("gachan", store), 23, 30, 24, 40);
    return s + L("M6,82 L14,90 L21,82 L28,90 L35,82 L42,90 L49,82 L56,90 L64,82", K, 1.6);
  }

  // ===================== クーポンけん（Hしょう）=====================
  const FOOD_OF = { kj_law_h0: "karaage", kj_law_h1: "pudding", kj_law_h2: "onigiri", kj_sev_h0: "oden", kj_sev_h1: "bread", kj_sev_h2: "cocoa" };
  const coupon = (id) => {
    const law = id.startsWith("kj_law"), col = law ? LAW.blue : SEV.or, bg = law ? "#EEF5FB" : "#FFF6EC", food = FOOD_OF[id];
    let s = P("M4,8 H116 V24 C110,24 110,36 116,36 V52 H4 V36 C10,36 10,24 4,24 Z", "#FFFFFF", 2.2) + R(8, 12, 104, 36, 4, bg, 0) + R(4, 8, 22, 44, 0, col, 0) + P("M4,8 H26 V52 H4 V36 C10,36 10,24 4,24 Z", col, 2.2);
    s += L("M30,10 V50", "#C9C2B4", 1.4, 'stroke-dasharray="2.4 2.4"');
    s += food ? place(Art.iconSvg("bag", food), 33, 14, 30, 32, "xMidYMid meet") : grp(48, 30, 1, P("M0,-12 L3.4,-4 L12,-3.8 L5.4,1.8 L7.6,10.4 L0,5.8 L-7.6,10.4 L-5.4,1.8 L-12,-3.8 L-3.4,-4 Z", "#FFD54F", 1.8));
    // みぎの きりこみ（x 110〜116）に かからない よう、もじの はばを 42 に きめる（フォントが ちがっても おなじ はば）
    s += `<text x="86" y="34.5" text-anchor="middle" font-size="11.5" font-weight="bold" font-family="sans-serif" textLength="42" lengthAdjust="spacingAndGlyphs" fill="${col}" stroke="none">むりょう</text>`;
    s += C(15, 22, 4.6, "#FFFFFF", 0) + C(15, 38, 4.6, "#FFFFFF", 0);
    return svg(s, 120, 60);
  };

  // ===================== シール（シールちょう 100×100・Iしょうの シート）=====================
  const SC = StickerArt.cut, puff = StickerArt.puff;
  const circleD = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
  // シールの ぼうし（ローリソン: あおい ぼうし・せぶんぶん: はちまき）
  const capL = (x, y, s = 1) => grp(x, y, s, P("M-14,0 C-14,-12 14,-12 14,0 Z", LAW.blue, 1.8) + R(-17, -1.4, 34, 5, 2.5, LAW.dark, 1.6) + C(0, -6.6, 2.2, "#FFFFFF", 0));
  const band = (x, y, w) => R(x - w / 2, y - 3.6, w, 7.2, 3, "#FFFFFF", 1.6) + C(x, y, 2.2, SEV.rd, 0);
  const STK = {
    stk_kjlaw_wanko: () => SC(circleD(50, 52, 38), LAW.light) + grp(50, 58, 0.7, wankoHead({ smile: true })) + capL(50, 37) + puff(50, 52, 38),
    stk_kjlaw_gachan: () => SC(circleD(50, 52, 38), LAW.light) + grp(50, 58, 0.76, gachanHead({ smile: true })) + capL(50, 34) + puff(50, 52, 38),
    stk_kjlaw_goji: () => SC(circleD(50, 52, 38), LAW.light) + grp(50, 62, 0.62, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + capL(50, 40, 0.9) + puff(50, 52, 38),
    stk_kjlaw_karaage: () => SC(circleD(50, 52, 36), "#FFF3E0") + karaageCup(50, 62, 1.5) + puff(50, 52, 36),
    stk_kjlaw_onigiri: () => SC("M50,12 C58,12 88,62 84,72 C80,82 20,82 16,72 C12,62 42,12 50,12 Z", "#FFFDF6") + R(36, 52, 28, 20, 3, "#2E3B33", 1.8) + face(50, 44, 1.4) + puff(50, 50, 30),
    stk_kjlaw_pudding: () => SC("M22,82 L30,30 C34,22 66,22 70,30 L78,82 Z", "#FFE08A") + P("M30,30 C34,22 66,22 70,30 C66,40 34,40 30,30 Z", "#8D5524", 2) + C(50, 22, 7, "#E53935", 1.8) + face(50, 58, 1.4) + puff(50, 56, 28),
    stk_kjsev_wanko: () => SC(circleD(50, 52, 38), SEV.bg) + grp(50, 56, 0.7, wankoHead({ smile: true })) + band(50, 42, 46) + puff(50, 52, 38),
    stk_kjsev_gachan: () => SC(circleD(50, 52, 38), SEV.bg) + grp(50, 56, 0.76, gachanHead({ smile: true })) + band(50, 40, 44) + puff(50, 52, 38),
    stk_kjsev_goji: () => SC(circleD(50, 52, 38), SEV.bg) + grp(50, 62, 0.62, P(gojiShape(80), GOJ.c) + gojiEars(-32) + gojiMouth(-12)) + band(50, 44, 40) + puff(50, 52, 38),
    stk_kjsev_oden: () => SC(circleD(50, 54, 36), "#FFF8EC") + place(Art.iconSvg("bag", "oden"), 18, 20, 64, 64, "xMidYMid meet") + puff(50, 54, 36),
    stk_kjsev_melon: () => SC("M14,62 C14,30 30,18 50,18 C70,18 86,30 86,62 C86,74 14,74 14,62 Z", "#F2C472") + grp(50, 46, 1, criss(31, 25, 8)) + face(50, 58, 1.3) + puff(50, 46, 32),
    stk_kjsev_cocoa: () => SC(circleD(50, 54, 36), "#F6EEE6") + mug(48, 58, 1.9, "#FFFFFF", "#8D5B3E") + R(40, 34, 9, 6, 2, "#FFF3F6", 1.4) + puff(50, 54, 36),
  };
  const sticker = (id) => (STK[id] ? svg(STK[id](), 100, 100) : "");

  // ===================== エコバッグ（Fしょう・もちもの。手に さげる）=====================
  const bag = (ctx) => {
    const h = HandItems.hand(ctx), store = ctx.col[0], who = ctx.col[1], law = store === "lawson";
    const x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 8, w = 34, hh = 32, c = law ? LAW.blue : "#FFFFFF";
    let s = L(`M${f1(x - 10)},${f1(y0 + 2)} C${f1(x - 10)},${f1(h.y - 10)} ${f1(x + 10)},${f1(h.y - 10)} ${f1(x + 10)},${f1(y0 + 2)}`, law ? LAW.dark : SEV.gr, 3.4);
    s += `<path d="M${f1(x - w / 2)},${f1(y0)} H${f1(x + w / 2)} L${f1(x + w / 2 + 2)},${f1(y0 + hh)} H${f1(x - w / 2 - 2)} Z" fill="${c}" ${sk(3)}/>`;
    if (law) s += L(`M${f1(x - w / 2 + 1)},${f1(y0 + 6)} H${f1(x + w / 2 - 1)}`, "#FFFFFF", 2.6) + C(x, y0 + 18, 8.4, "#FFFFFF", 1.6);
    else s += R(x - w / 2, y0 + 4, w, 3, 0, SEV.or, 0) + R(x - w / 2, y0 + 7, w, 3, 0, SEV.gr, 0) + R(x - w / 2, y0 + 10, w, 3, 0, SEV.rd, 0) + C(x, y0 + 21, 7.6, SEV.bg, 1.6);
    s += grp(x, y0 + (law ? 18 : 21), 0.17, smallHead(who));
    return { top: s };
  };
  // 絵（くじの がめん・ずかん）: エコバッグは もちものの アイコン
  const bagIcon = (id) => Art.iconSvg("wear", id);

  // ===================== へやの 絵（FURN_ART・2D）=====================
  const pic = (id) => {
    const it = IchibanKuji.INDEX[id]; if (!it) return "";
    if (PLUSH[id]) return plush(id);
    if (ART[id]) { const a = ART[id]; return svg(a.draw(), a.w, a.h); }
    if (it.kind === "coupon") return coupon(id);
    if (it.kind === "sheet") return StickerArt.sheet(it, it.store === "lawson" ? ["#EAF6FC", "#FFF8DC", "#F1ECFA"][it.k] : ["#FFF3E4", "#FFEFF4", "#F6EEE2"][it.k], false);
    if (it.kind === "bag") return bagIcon(id);
    if (it.kind === "blanket") return blanketFlat(id);
    return "";
  };
  const furn = (id) => { const f = FURN_INDEX[id]; return place(pic(id), 0, 0, f.w, f.h); };

  // ===================== ブランケット（せぶんぶん E・ラグの 立体）=====================
  const BL = { wanko: "#FFF6E8", gachan: "#FFF4C4", goji: "#ECE6E4" };
  const blanketFlat = (id) => { const it = IchibanKuji.INDEX[id]; return svg(R(4, 4, 112, 72, 8, BL[it.who], 2.2) + R(4, 4, 112, 9, 4, SEV.or, 0) + R(4, 13, 112, 5, 0, SEV.gr, 0) + R(4, 18, 112, 5, 0, SEV.rd, 0) + R(4, 4, 112, 72, 8, "none", 2.2) + grp(60, 50, 0.42, smallHead(it.who)) + stitch("M10,70 H110", "#00000022"), 120, 80); };
  const blanketModel = (who) => (k) => {
    const { w, d, shape, TP, lineOn, onP } = k, sh = FurnModels.shapes, x0 = -w / 2 + 6, y0 = -d + 6, ww = w - 12, dd = d - 12;
    let s = shape(TP(0), sh.rr(x0 - 2, y0 - 2, ww + 4, dd + 4, 10), INK, 0, 'fill-opacity=".12"');
    for (let y = y0 + 6; y <= y0 + dd - 6; y += 7) s += lineOn(TP(0.4), [[x0, y], [x0 - 7, y + 0.6]], INK, 3.2) + lineOn(TP(0.4), [[x0, y], [x0 - 7, y + 0.6]], "#F6EBD3", 1.6) + lineOn(TP(0.4), [[x0 + ww, y], [x0 + ww + 7, y + 0.6]], INK, 3.2) + lineOn(TP(0.4), [[x0 + ww, y], [x0 + ww + 7, y + 0.6]], "#F6EBD3", 1.6);
    s += shape(TP(1), sh.rr(x0, y0, ww, dd, 8), BL[who], 1.6);
    s += shape(TP(1.05), sh.rect(x0 + 2, y0 + 3, ww - 4, 7), SEV.or, 0) + shape(TP(1.05), sh.rect(x0 + 2, y0 + 10, ww - 4, 4.5), SEV.gr, 0) + shape(TP(1.05), sh.rect(x0 + 2, y0 + 14.5, ww - 4, 4.5), SEV.rd, 0);
    s += shape(TP(1.05), sh.rect(x0 + 2, y0 + dd - 19, ww - 4, 4.5), SEV.rd, 0) + shape(TP(1.05), sh.rect(x0 + 2, y0 + dd - 14.5, ww - 4, 4.5), SEV.gr, 0) + shape(TP(1.05), sh.rect(x0 + 2, y0 + dd - 10, ww - 4, 7), SEV.or, 0);
    s += onP(TP(1.1), -22, -d / 2 + 22, 44, 44, grp(22, 24, 0.5, smallHead(who)));
    s += lineOn(TP(1.1), sh.close(sh.rr(x0 + 4, y0 + 4, ww - 8, dd - 8, 5)), "#FFFFFF", 1.2, 'stroke-dasharray="3 3"');
    return s;
  };

  // ===================== コンビニの たな（店の なかの くじ・StoreArt と おなじ 220×190）=====================
  const shelf = (store) => {
    const S = store === "lawson", col = S ? LAW.blue : SEV.or, bg = S ? LAW.light : SEV.bg, A = S ? ["kj_law_b", "kj_law_a", "kj_law_c"] : ["kj_sev_c", "kj_sev_a", "kj_sev_b"];
    let s = R(10, 64, 200, 116, 6, "#FFFFFF", 4) + R(18, 72, 184, 50, 4, bg, 0) + L("M14,122 H206 M14,150 H206", K, 3.6);
    s += place(plush(A[0]), 22, 70, 58, 54) + place(plush(A[1]), 80, 58, 62, 66) + place(plush(A[2]), 142, 70, 58, 54);
    for (let i = 0; i < 6; i++) s += R(24 + i * 30, 128, 24, 18, 3, ["#FFE08A", "#F7B6C8", "#A8D5BA", "#A8C4E8", "#F7C08A", "#C7B8E8"][i], 2.6);
    for (let i = 0; i < 7; i++) s += R(22 + i * 26, 156, 20, 18, 3, i % 2 ? "#FFFFFF" : bg, 2.4) + L(`M${26 + i * 26},${163} h12`, col, 2.4);
    s += R(30, 6, 160, 44, 8, col, 4) + `<text x="110" y="34" text-anchor="middle" font-size="22" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" stroke="none">いちばんくじ</text>`;
    s += R(46, 44, 128, 16, 4, "#FFFFFF", 3) + `<text x="110" y="56" text-anchor="middle" font-size="11" font-family="sans-serif" font-weight="bold" fill="${col}" stroke="none">1かい 1000コイン</text>`;
    return s + L("M26,180 V186 M194,180 V186", K, 4);
  };

  // ===================== くじの はこ（がめん）=====================
  const box = (store) => {
    const S = store === "lawson", col = S ? LAW.blue : SEV.or, bg = S ? LAW.light : SEV.bg;
    let s = P("M20,58 L100,58 L106,138 L14,138 Z", col, 3) + P("M20,58 L34,40 L114,40 L100,58 Z", shade(col, 0.18), 3) + P("M100,58 L114,40 L118,120 L106,138 Z", shade(col, -0.18), 3);
    s += E(67, 49, 22, 6.4, "#3A3A40", 2.4) + [[-12, -6], [-4, -12], [6, -9], [14, -5]].map(([dx, rot], i) => grp(67 + dx, 44, 1, R(-4, -14, 8, 14, 1.4, ["#FFFFFF", "#FFF3D6", "#EAF6FC", "#FFE9F1"][i], 1.6), rot)).join("");
    s += R(30, 74, 60, 40, 6, "#FFFFFF", 2.4) + R(36, 80, 48, 10, 3, bg, 0) + L("M40,100 h40 M44,107 h32", col, 2.4);
    return svg(s, 130, 150);
  };

  // ===================== おうちの 立体と さわる うごき =====================
  const install = (API) => {
    const since = (st) => G.t - (st.t0 == null ? -99 : st.t0);
    const mapper = (sc, it, r) => {
      const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
      const Pm = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
      Pm.s = s; Pm.d = dm.d; return Pm;
    };
    const say = (sc, line) => { const kids = (sc.chars || []).filter((c) => !c.hidden); const who = kids[Math.floor(Math.random() * Math.max(1, kids.length))]; if (who && typeof HomeLife !== "undefined") HomeLife.say(sc, who.id, line, false, "say"); };
    const tone = (list, step = 0.09, type = "triangle", vol = 0.1) => { if (Sound.ctx && Save.d?.settings?.se) list.forEach((f, i) => Sound.tone(Sound.seGain, { ...(Array.isArray(f) ? { f: f[0], f2: f[1] } : { f }), t: i * step, dur: 0.14, type, vol, a: 0.005, r: 0.25 })); };
    const hug = (t) => (t >= 0 && t < 1.2 ? Math.exp(-t * 3.6) * Math.cos(t * 13) : 0);
    const LINES = {
      plush: ["ふかふか！ ぎゅーって したく なるね", "おおきくて あったかい〜", "いちばんくじの たからもの！", "なかよしの ぬいぐるみ だね"],
      cushion: ["ぽふっ！ やわらかーい", "おいしそうな クッション♪", "すわると ふかふか"],
    };
    for (const it of API.ITEMS) {
      if (it.kind !== "plush" && it.kind !== "cushion" && it.kind !== "blanket") continue;
      const f = FURN_INDEX[it.id];
      if (it.kind === "blanket") { FurnModels.register(it.id, blanketModel(it.who)); continue; }
      const fig = () => place(pic(it.id), -f.w / 2, -f.h, f.w, f.h);
      FurnModels.register(it.id, (k) => k.shadow(0.12, 4, 14) + k.L(k.at(0, -k.d / 2, 0, fig(), f.w / 2 + 2, f.h + 2)));
      FurnLive.register(it.id, {
        tap(sc, item, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone(it.kind === "plush" ? [392, 523, 659] : [[330, 180], [260, 420]], 0.11, it.kind === "plush" ? "triangle" : "sine", 0.1); say(sc, LINES[it.kind][st.n % LINES[it.kind].length]); },
        draw(ctx, sc, item, r, st) {
          const Pm = mapper(sc, item, r), q = Pm(0, -Pm.d / 2, 0), s = Pm.s, k = hug(since(st)) * (it.kind === "plush" ? 0.12 : 0.22), w = f.w * s, h = f.h * s;
          const px = Math.max(8, Math.ceil((f.w * s * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * f.h) / f.w));
          const img = SvgCache.get("kuji:" + it.id + ":" + px, () => pic(it.id), px, py);
          if (!img) return;
          ctx.save(); ctx.translate(q.x, q.y); if (item.flip) ctx.scale(-1, 1); ctx.scale(1 + k * 0.6, 1 - k);
          ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
        },
      }, true);
    }
  };

  return { PLUSH, ART, STK, plush, pic, furn, coupon, sticker, bag, shelf, box, install, blanketFlat, charImg, smallHead, LAW, SEV };
})();
