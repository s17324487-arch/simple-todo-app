// ネリカス駅の広場・通学路。32px = 1マス。SVG は外部の defs を必要としない。
// 足元は南、光源は左上。小物の固有の機能が読み取れる形を優先する。
import { R, Rn, C, E, Pth, L, T, groundShadow, shade } from "./lib.mjs";

const INK = "#1F1D1B", SAGE = "#648975", DARK = "#31594E", CREAM = "#F3EAD9";
const WOOD = "#A97850", COPPER = "#BC795C", GOLD = "#E2BC65", STONE = "#859491";
const at = (x, y, svg) => `<g transform="translate(${x} ${y})">${svg}</g>`;
const bolt = (x, y, r = 0.8) => C(x, y, r, "#E2DED3", { sw: 0.5 }) + L(x - r * 0.45, y, x + r * 0.45, y, "#6F736D", 0.5);
const leaf = (x, y, scale = 1, fill = SAGE) => `<g transform="translate(${x} ${y}) scale(${scale})">${Pth("M0,9 C-9,6 -8,-3 1,-9 C10,-3 9,6 0,9 Z", fill, { sw: 0.8 })}${Pth("M0,10 L0,-5 M0,3 L-4,-1 M0,0 L4,-4", "none", { stroke: DARK, sw: 0.7 })}</g>`;
const trim = (x, y, w, color = COPPER) => R(x, y, w, 2, color, { sw: 0.6 }) + L(x + 1, y + 0.5, x + w - 1, y + 0.5, shade(color, 0.3), 0.5);
const glow = (x, y, rx, ry) => E(x, y, rx, ry, "#F7D58D", { sw: 0, op: 0.1 }) + E(x, y, rx * 0.58, ry * 0.65, "#FFF0BA", { sw: 0, op: 0.13 });
const ribbedPost = (x, top, bottom, width = 4) => R(x, top, width, bottom - top, DARK, { sw: 1 }) + Rn(x + 1, top + 1, 1, bottom - top - 2, "#91A28E") + R(x - 2, bottom - 5, width + 4, 5, "#617068", { sw: 0.8 });

function kid(x, y, sc = 1) {
  return `<g transform="translate(${x} ${y}) scale(${sc})">${C(0, -7, 2.2, DARK, { sw: 0 })}${Pth("M-1,-4 L2,-3 L4,2 L2,3 L0,0 L-1,5 L-4,10 M0,4 L4,9 M-1,-2 L-5,1 L-7,-1", "none", { stroke: DARK, sw: 2 })}${R(-5, -4, 3, 5, DARK, { sw: 0, rx: 0.7 })}</g>`;
}

// 屋根付き駐輪場と共用。車輪の接地 y=37、外形は x=0..59 / y=-9..38。
// variant=0 は三角フレーム、1 は低床フレーム、child=true は子のせ電動車。
export function nerikasuBicycle(color, child = false, variant = 0) {
  let s = "";
  for (const x of [11, 47]) {
    s += C(x, 26, 10, "#D2D7CA", { sw: 2.2, stroke: "#404846" }) + C(x, 26, 8, "none", { sw: 0.6, stroke: "#EEECE0" });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += L(x, 26, x + Math.cos(a) * 7.4, 26 + Math.sin(a) * 7.4, "#89958D", 0.45); }
    s += C(x, 26, 1.5, "#D6D9CC", { sw: 0.6 });
  }
  const frame = variant === 1
    ? "M11,26 L21,12 L29,26 L11,26 M21,14 Q26,29 39,13 M41,12 L47,26 M41,12 L39,6 Q39,2 34,4"
    : child
      ? "M11,26 L21,12 L29,26 L11,26 M23,18 L31,22 L40,12 M41,12 L47,26 M41,12 L39,6 L44,5"
      : "M11,26 L21,12 L29,26 L11,26 M21,12 L41,12 L29,26 M41,12 L47,26 M41,12 L39,6 L44,5";
  s += Pth(frame, "none", { stroke: INK, sw: 3.2 }) + Pth(frame, "none", { stroke: color, sw: 2 });
  s += Pth("M5,20 Q11,12 18,19 M41,20 Q47,12 54,20", "none", { stroke: "#C6CECA", sw: 1.4 });
  s += L(20, 12, 19, 7, INK, 1.2) + R(14, 5, 11, 3, "#5A4B40", { rx: 1.4, sw: 0.8 });
  s += C(29, 26, 3.1, CREAM, { sw: 0.7 }) + L(29, 26, 33, 29, STONE, 1.2) + L(31, 30, 35, 30, INK, 1.1);
  s += R(42, 2, 14, 10, "#C3CCBF", { sw: 0.8 }) + Pth("M42,2 L45,-1 L58,-1 L56,2 Z", "#E0E5DA", { sw: 0.7 });
  for (let i = 0; i < 4; i++) s += L(45 + i * 3, 3, 45 + i * 3, 11, "#718276", 0.5);
  s += L(42, 7, 56, 7, "#718276", 0.5) + C(50, 13, 1.7, "#FFF6CD", { sw: 0.6 });
  s += L(6, 12, 18, 12, DARK, 1.3) + L(8, 13, 10, 18, DARK, 0.8) + R(2, 19, 2, 4, "#CA6C53", { sw: 0.5 });
  if (child) {
    s += Pth("M7,-5 Q4,-6 4,-1 L5,8 L15,11 L18,7 L17,-4 Q12,-8 7,-5 Z", "#D6AF6E", { sw: 1 });
    s += Pth("M7,-3 L8,5 L14,7 L15,-2", "none", { stroke: "#8C693E", sw: 1.2 }) + L(10, -3, 12, 7, "#665442", 1.2);
    s += Pth("M6,9 L3,19 L7,20 L9,14 M16,10 L18,19 L21,19", "none", { stroke: DARK, sw: 1.2 });
    s += Pth("M23,15 L26,14 L30,22 L27,24 Z", "#657267", { sw: 0.8 }) + L(25, 16, 28, 21, "#A3B7A2", 0.7);
  }
  return s;
}

function flower(x, y, color, size = 2.1) {
  let s = L(x, y + 6, x, y, DARK, 0.7) + Pth(`M${x},${y + 4} q-5,-6 -5,-2 q1,3 5,2 M${x},${y + 3} q5,-6 5,-2 q-1,2 -5,2`, SAGE, { sw: 0.4, stroke: DARK });
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; s += C(x + Math.cos(a) * size, y + Math.sin(a) * size, size * 0.78, color, { sw: 0.4, stroke: shade(color, -0.22) }); }
  return s + C(x, y, size * 0.65, GOLD, { sw: 0.35, stroke: "#8B7439" });
}

export const NERIKASU_PROPS = [
  {
    id: "nerikasu.station-totem", name: "木の葉の 駅名塔", category: "広場・通学路", w: 2, h: 1,
    bbox: [-2, -85, 63, 38], states: ["day", "night"],
    details: ["木の葉と2本のレールの駅章", "琺瑯の駅名板と英字", "銅の縁取りと左側の木目", "住宅街・学校を示す南口案内", "基礎のアンカーボルトと夜の足元灯"],
    draw: ({ night = false } = {}) => {
      let s = groundShadow(34, 29, 28, 7);
      if (night) s += glow(30, 13, 30, 21);
      s += Pth("M12,22 L45,22 L54,28 L54,33 L12,33 L5,28 Z", "#B3B5A7") + Pth("M5,28 L47,28 L54,33 L12,33 Z", STONE, { sw: 0.8 });
      s += Pth("M13,-66 Q13,-78 25,-78 L39,-78 L47,-73 L47,25 L38,28 L13,25 Z", WOOD);
      s += Pth("M40,-76 L47,-73 L47,25 L40,27 Z", "#805738", { sw: 0.8 });
      for (const x of [16, 19, 22]) s += Pth(`M${x},-64 Q${x + 2},-29 ${x},18`, "none", { stroke: "#C59D74", sw: 0.6 });
      s += R(7, -65, 38, 75, DARK, { rx: 5, sw: 1.2 }) + R(10, -62, 32, 36, night ? "#FFF2CF" : CREAM, { rx: 3, sw: 0.7 });
      s += leaf(26, -73, 0.8, SAGE) + L(23, -70, 23, -64, CREAM, 0.8) + L(29, -70, 29, -64, CREAM, 0.8);
      s += T(26, -49, "ネリカス駅", { size: 6.6, fill: DARK }) + T(26, -41, "NERIKASU", { size: 4.6, fill: DARK, weight: 700 });
      s += L(14, -36, 38, -36, COPPER, 1) + T(26, -29, "南口", { size: 5.4, fill: DARK });
      s += T(26, -15, "おうち・がっこう", { size: 4.4, fill: CREAM }) + Pth("M16,-7 H35 L31,-11 M35,-7 L31,-3", "none", { stroke: GOLD, sw: 1.5 });
      s += R(18, 14, 19, 6, "#E4DFC9", { rx: 1, sw: 0.6 }) + Rn(20, 15, 15, 2, night ? "#FFF4AB" : "#AFB6A2");
      s += trim(9, -64, 34) + trim(9, 8, 34) + bolt(11, 29) + bolt(46, 30);
      return s;
    }
  },
  {
    id: "nerikasu.timber-bench", name: "木と 鉄の ひとやすみベンチ", category: "広場・通学路", w: 3, h: 1,
    bbox: [-3, -26, 104, 41], states: ["day"],
    details: ["反りのある木の背板4枚と座板5枚", "鋳鉄の葉模様の肘掛け", "座面の奥行き・桟・4本の脚", "木目・ボルト・中央の寄付銘板"],
    draw: () => {
      let s = groundShadow(52, 30, 49, 9);
      for (const x of [12, 78]) s += Pth(`M${x},3 v26 l-4,5 h9 V4 Z`, DARK, { sw: 1 }) + Pth(`M${x + 7},8 v26 h6 l-2,-5 V7 Z`, "#40534B", { sw: 0.9 });
      s += R(10, -21, 5, 41, DARK, { sw: 0.9 }) + R(78, -21, 5, 41, DARK, { sw: 0.9 });
      for (let row = 0; row < 4; row++) {
        const y = -23 + row * 6;
        s += R(5, y, 84, 5, row % 2 ? "#BC9068" : WOOD, { rx: 1, sw: 0.7 });
        s += Pth(`M10,${y + 2} Q30,${y + 1} 51,${y + 2} T85,${y + 2}`, "none", { stroke: "#D1AE86", sw: 0.6 }) + bolt(12, y + 2.5, 0.6) + bolt(80, y + 2.5, 0.6);
      }
      s += Pth("M3,4 L86,4 L94,18 L7,18 Z", "#D2A575", { sw: 1 });
      for (let row = 0; row < 4; row++) s += L(5 + row, 6 + row * 3, 88 + row, 6 + row * 3, "#7F5639", 0.7);
      s += R(7, 18, 87, 4, "#A27049", { sw: 0.9 }) + L(11, 20, 89, 20, "#CFA177", 0.5);
      for (const x of [4, 86]) {
        s += Pth(`M${x},16 V-4 Q${x + 3},-10 ${x + 7},-4 V18 M${x},-3 Q${x - 4},4 ${x + 6},8`, "none", { stroke: DARK, sw: 2.5 });
        s += leaf(x + 4, 3, 0.37, SAGE);
      }
      s += R(39, -18, 15, 4, GOLD, { sw: 0.5 }) + T(46.5, -15, "NERIKASU", { size: 2.6, fill: DARK });
      return s;
    }
  },
  {
    id: "nerikasu.lantern-twin", name: "こもれびの 二灯街灯", category: "広場・通学路", w: 1, h: 1,
    bbox: [-27, -102, 63, 39], states: ["day", "night"],
    details: ["葉を巻き込んだ鋳鉄の二股アーム", "銅の笠・乳白ガラス・縦桟のランタン", "暖色の夜灯と歩道に落ちる光", "根巻き・点検口・締結ボルト"],
    draw: ({ night = false } = {}) => {
      let s = groundShadow(21, 29, 18, 7);
      if (night) s += glow(-7, -73, 18, 25) + glow(41, -73, 18, 25) + glow(17, 22, 38, 12);
      s += ribbedPost(14, -89, 28, 6) + R(11, 20, 12, 10, "#65766A", { rx: 2, sw: 1 }) + E(17, 30, 11, 3.6, STONE, { sw: 1 });
      s += Pth("M17,-84 C8,-97 -8,-99 -8,-86 M17,-84 C26,-97 42,-99 42,-86", "none", { stroke: DARK, sw: 3 });
      s += Pth("M17,-84 C4,-78 2,-90 -5,-88 M17,-84 C30,-78 32,-90 39,-88", "none", { stroke: SAGE, sw: 1.3 }) + leaf(17, -93, 0.52, GOLD);
      for (const x of [-8, 42]) {
        s += Pth(`M${x - 10},-82 L${x - 5},-87 L${x + 5},-87 L${x + 10},-82 Z`, COPPER, { sw: 1 });
        s += R(x - 7, -82, 14, 18, night ? "#FFE9A4" : "#E7E3C8", { rx: 1, sw: 1 }) + Rn(x - 5, -80, 3, 14, night ? "#FFF8CE" : "#FFF8E3");
        s += L(x, -81, x, -65, DARK, 0.7) + R(x - 9, -64, 18, 3, DARK, { sw: 0.8 }) + Pth(`M${x - 6},-61 L${x},-57 L${x + 6},-61`, COPPER, { sw: 0.8 });
      }
      s += R(15, 7, 4, 9, "#809383", { rx: 0.8, sw: 0.6 }) + bolt(17, 9, 0.5) + bolt(10, 30) + bolt(24, 30);
      return s;
    }
  },
  {
    id: "nerikasu.community-board", name: "学校と 保育園の おしらせ板", category: "広場・通学路", w: 3, h: 1,
    bbox: [-4, -67, 107, 39], states: ["day", "night"],
    details: ["銅板の小屋根と雨だれの樋", "引き違いガラス・留め具・鍵穴", "学校の運動会・保育園のおひるね・町内音楽会の異なる絵入りポスター", "掲示日・画鋲・木目と足元の基礎"],
    draw: ({ night = false } = {}) => {
      let s = groundShadow(53, 29, 48, 8) + ribbedPost(11, -46, 29, 5) + ribbedPost(79, -46, 29, 5);
      s += R(2, -51, 91, 63, WOOD, { rx: 2, sw: 1.2 }) + R(7, -46, 80, 51, "#C5BB99", { sw: 0.8 });
      s += Pth("M-1,-52 L9,-64 L83,-64 L97,-52 Z", COPPER) + R(-1, -52, 98, 4, "#84563E", { sw: 0.8 });
      for (let x = 17; x < 85; x += 15) s += L(x, -63, x + 2, -53, "#D29A7E", 0.7);
      s += R(14, -43, 24, 34, "#FCF5DB", { sw: 0.5 }) + R(43, -43, 20, 26, "#DFE8D5", { sw: 0.5 }) + R(67, -34, 16, 36, "#E9DDE9", { sw: 0.5 });
      s += T(26, -36, "うんどうかい", { size: 3.6, fill: DARK }) + kid(23, -24, 0.65) + kid(31, -22, 0.46) + L(18, -13, 33, -13, COPPER, 0.7);
      s += T(53, -37, "ほいくえん", { size: 3.4, fill: DARK }) + R(47, -31, 12, 7, "#F0C3A0", { rx: 2, sw: 0.5 }) + C(49, -30, 2.5, CREAM, { sw: 0.4 }) + Pth("M51,-30 Q55,-35 60,-29", "#AABFA0", { sw: 0.5 });
      s += T(75, -27, "おんがく", { size: 3.2, fill: DARK }) + T(75, -22, "ひろば", { size: 3.4, fill: DARK }) + C(74, -12, 2, COPPER, { sw: 0.5 }) + L(76, -12, 76, -19, COPPER, 0.9) + L(76, -19, 80, -17, COPPER, 1.2);
      s += R(42, -12, 21, 13, CREAM, { sw: 0.4 }) + T(52.5, -7, "まちの おそうじ", { size: 2.5, fill: DARK });
      for (const [x, y] of [[17, -40], [58, -40], [71, -31], [58, -9]]) s += C(x, y, 0.85, "#BE6D53", { sw: 0.4 });
      s += L(12, -2, 32, -2, "#8A977C", 0.5) + L(45, -3, 60, -3, "#8A977C", 0.5);
      s += Pth("M8,-45 L23,-45 L8,-26 Z M74,-45 L86,-45 L86,-19 L58,4 L50,4 Z", "#FFFFFF", { sw: 0, op: 0.13 }) + R(7, -46, 80, 51, "none", { sw: 0.7, stroke: "#DEE4D9" });
      s += L(47, -46, 47, 5, "#E0E1D4", 1) + R(45, -23, 4, 8, STONE, { rx: 0.8, sw: 0.6 }) + C(47, -19, 0.7, DARK, { sw: 0 });
      s += T(47, 10, "ネリカス まちの けいじばん", { size: 4.3, fill: CREAM }) + bolt(13, 2) + bolt(81, 2);
      s += R(30, -50, 36, 2, night ? "#FFF1BB" : "#DADAC4", { sw: 0.5 });
      if (night) s += Pth("M30,-48 H66 L88,5 H8 Z", "#FFF0B1", { sw: 0, op: 0.08 });
      return s;
    }
  },
  {
    id: "nerikasu.walk-map", name: "あるいて めぐる まちの地図", category: "広場・通学路", w: 2, h: 1,
    bbox: [-6, -60, 77, 40], states: ["day", "night"],
    details: ["駅・川・曲がる通り・住宅街・公園を描いた縮尺地図", "学校と保育園の別ピクトグラム", "現在地の赤い印と凡例", "斜めの天端・鉄骨支柱・夜の上部照明"],
    draw: ({ night = false } = {}) => {
      let s = groundShadow(38, 30, 33, 8) + ribbedPost(12, -34, 29, 5) + ribbedPost(49, -34, 29, 5);
      s += Pth("M-1,-51 L6,-57 L62,-57 L69,-51 V13 H-1 Z", DARK) + R(3, -49, 62, 57, night ? "#FFF2D3" : CREAM, { sw: 0.8 });
      s += Rn(5, -47, 58, 10, SAGE) + T(34, -40, "ネリカス おさんぽマップ", { size: 4.5, fill: "#FFF9E9" });
      s += Rn(6, -35, 56, 33, "#D9E0C3") + Pth("M6,-26 Q24,-16 19,-2 H26 Q32,-15 13,-35 H7", "#B0D5DC", { sw: 0 });
      s += Pth("M30,-35 V-22 Q30,-18 35,-18 H62 M6,-8 H15 M26,-8 H49 Q54,-8 54,-14 V-35", "none", { stroke: "#B9B8A6", sw: 4 });
      s += Pth("M30,-35 V-22 Q30,-18 35,-18 H62 M6,-8 H15 M26,-8 H49 Q54,-8 54,-14 V-35", "none", { stroke: "#FFFFF0", sw: 2 });
      s += Pth("M35,-33 H48 V-24 H35 Z", "#B7C78F", { sw: 0.4 }) + C(39, -28, 2, SAGE, { sw: 0.3 }) + C(44, -29, 2.2, SAGE, { sw: 0.3 });
      for (const [x, y] of [[33, -14], [42, -14], [34, -5], [45, -5], [10, -31], [57, -29]]) s += R(x, y, 4, 3, "#C6AA89", { sw: 0.4 });
      s += R(33, -35, 16, 3, DARK, { sw: 0.4 }) + T(41, -31, "えき", { size: 2.5, fill: DARK });
      s += R(56, -15, 5, 5, GOLD, { sw: 0.4 }) + T(58.5, -11, "学", { size: 3.5, fill: DARK });
      s += R(8, -20, 6, 5, "#D99B83", { sw: 0.4 }) + C(11, -17.5, 1.1, CREAM, { sw: 0.3 });
      s += Pth("M30,-22 L28,-27 Q27,-31 31,-31 Q35,-31 34,-27 Z", "#C76050", { sw: 0.6 }) + C(31, -28, 0.8, CREAM, { sw: 0 });
      s += T(33, 4, "● いまここ　■ がっこう　○ こうえん", { size: 2.7, fill: DARK }) + L(9, -1, 60, -1, "#A9B499", 0.5);
      s += R(10, -54, 48, 2, night ? "#FFF4BC" : "#C1C9AD", { sw: 0.5 }) + trim(-1, 9, 70) + bolt(4, 11) + bolt(65, 11);
      if (night) s += glow(34, -17, 30, 25);
      return s;
    }
  },
  {
    id: "nerikasu.school-crossing", name: "通学路の 黄色い旗ボックス", category: "広場・通学路", w: 1, h: 1,
    bbox: [-6, -71, 51, 39], states: ["day"],
    details: ["子ども2人の通学路ピクトグラム", "黄色い三角旗3本と持ち手", "傾いた口の旗ボックスと返却表示", "白・緑の安全ポールと反射帯"],
    draw: () => {
      let s = groundShadow(24, 30, 21, 7) + R(12, -46, 5, 75, "#E6E5D8", { sw: 1 });
      s += R(11, -65, 31, 28, GOLD, { rx: 2, sw: 1.2 }) + R(14, -62, 25, 22, "none", { rx: 1, sw: 0.6, stroke: "#967D3E" });
      s += kid(23, -50, 0.8) + kid(33, -48, 0.58) + L(16, -41, 36, -41, DARK, 0.7);
      s += R(17, -32, 30, 9, CREAM, { sw: 0.7 }) + T(32, -26, "つうがくろ", { size: 4.7, fill: DARK });
      for (let i = 0; i < 3; i++) {
        const x = 7 + i * 7, y = -26 - i * 4;
        s += L(x, y, x + 3, 12, "#A97850", 1.1) + Pth(`M${x},${y} q8,1 12,-2 v12 q-7,3 -11,0 Z`, i % 2 ? "#F1D874" : GOLD, { sw: 0.7 });
      }
      s += Pth("M1,4 L23,1 L30,7 L30,25 L5,28 L1,22 Z", "#DAB85D", { sw: 1 });
      s += Pth("M1,4 L23,1 L30,7 L7,10 Z", "#F4DD8C", { sw: 0.8 }) + Pth("M5,5 L23,4 L26,6 L8,8 Z", "#6A6747", { sw: 0.6 });
      s += Pth("M7,10 L30,7 V25 L7,28 Z", GOLD, { sw: 0.8 }) + T(18, 17, "はた", { size: 5, fill: DARK }) + T(18, 23, "もどしてね", { size: 3.2, fill: DARK });
      s += Rn(13, -14, 3, 5, SAGE) + Rn(13, -3, 3, 5, SAGE) + E(15, 31, 8, 2.7, STONE, { sw: 0.7 });
      return s;
    }
  },
  {
    id: "nerikasu.corner-mirror", name: "住宅路地の カーブミラー", category: "広場・通学路", w: 1, h: 1,
    bbox: [-6, -74, 44, 39], states: ["day"],
    details: ["オレンジの覆いと下向きの庇", "鏡に映る曲がり道・家・緑の生け垣", "鏡の接合金具・ボルト・白い注意帯", "固定台の小さな水抜き穴"],
    draw: () => {
      let s = groundShadow(22, 29, 17, 7) + R(15, -49, 4, 78, "#B96B42", { sw: 1 });
      s += Rn(16, -43, 1, 69, "#E4A86F") + R(14, 5, 6, 12, CREAM, { sw: 0.6 }) + T(17, 12, "注意", { size: 3.5, fill: "#986235" });
      s += L(17, -48, 24, -53, "#72766A", 3) + bolt(20, -50, 1);
      s += E(17, -53, 17, 17, "#C97948", { sw: 1.2 }) + E(17, -53, 14, 14, "#C4DFDF", { sw: 0.7 });
      s += Pth("M4,-49 Q18,-54 30,-46 Q26,-39 18,-39 Q8,-39 4,-49 Z", "#7C9877", { sw: 0 });
      s += Pth("M13,-40 Q11,-49 26,-56 L30,-52 Q16,-48 20,-39 Z", "#EEE5C7", { sw: 0 });
      s += Pth("M7,-57 L13,-62 L20,-57 V-48 H8 Z", CREAM, { sw: 0.5 }) + Pth("M6,-57 L13,-63 L21,-57 Z", COPPER, { sw: 0.5 }) + R(10, -54, 4, 4, SAGE, { sw: 0.4 });
      s += Pth("M6,-61 Q15,-68 26,-59", "none", { stroke: "#FFFFFF", sw: 2, op: 0.55 });
      s += Pth("M-2,-60 Q17,-78 36,-60 L31,-56 Q17,-68 3,-55 Z", "#D28B54", { sw: 1 }) + L(8, -69, 24, -69, "#EFC18C", 0.7);
      s += E(17, 30, 8, 3, STONE, { sw: 0.8 }) + bolt(12, 30, 0.6) + C(22, 30, 0.7, DARK, { sw: 0 });
      return s;
    }
  },
  {
    id: "nerikasu.bicycle-rack", name: "子のせ自転車も ある駐輪ラック", category: "広場・通学路", w: 4, h: 2,
    bbox: [-4, -19, 142, 73], states: ["day"],
    details: ["緑の通勤車・赤の低床車・クリーム色の子のせ電動車", "子ども用後席のベルト・足置き・車体のバッテリー", "買い物かご・反射板・チェーン・ペダル・泥よけ・スポーク", "U字ラックと番号付き駐輪溝"],
    draw: () => {
      let s = groundShadow(69, 57, 65, 11) + Pth("M1,39 L108,39 L131,61 L16,61 Z", "#C5C8B7", { sw: 0.8 });
      for (let i = 0; i < 3; i++) {
        const x = 4 + i * 36, y = 10 + i * 7;
        s += Pth(`M${x + 8},${y + 42} L${x + 25},${y + 24} H${x + 31} L${x + 14},${y + 42} Z`, "#A1ACA0", { sw: 0.8 });
        s += Pth(`M${x + 8},${y + 40} V${y + 12} Q${x + 14},${y + 1} ${x + 21},${y + 12} V${y + 32}`, "none", { stroke: DARK, sw: 3 });
        s += Pth(`M${x + 8},${y + 40} V${y + 12} Q${x + 14},${y + 1} ${x + 21},${y + 12} V${y + 32}`, "none", { stroke: "#ABB8AC", sw: 1.5 });
        s += at(x, y - 10, nerikasuBicycle(["#719385", "#BB725D", "#DED4B7"][i], i === 2, i));
        s += R(x + 7, y + 34, 9, 6, DARK, { sw: 0.6 }) + T(x + 11.5, y + 38.5, String(i + 1).padStart(2, "0"), { size: 3.5, fill: CREAM });
      }
      return s;
    }
  },
  {
    id: "nerikasu.season-planter", name: "町のみんなが 育てる花だん", category: "広場・通学路", w: 2, h: 1,
    bbox: [-4, -27, 76, 40], states: ["day"],
    details: ["釉薬の白い縁とテラコッタの焼きむら", "パンジー・小さなマーガレット・黄色の花", "植え土・茎・葉・開いた花の異なる重なり", "学校の花育てプレート・底の水抜き穴"],
    draw: () => {
      let s = groundShadow(37, 29, 36, 8) + Pth("M2,4 L62,4 L66,11 L59,30 L10,30 L3,18 Z", COPPER, { sw: 1.2 });
      s += Pth("M62,4 L66,11 L59,30 L56,26 Z", "#915A44", { sw: 0.8 }) + R(11, 11, 45, 14, "#C48C6B", { rx: 2, sw: 0.5, stroke: "#A2694E" });
      for (let i = 0; i < 5; i++) s += L(12 + i * 9, 13, 12 + i * 9, 23, "#D5A68B", 0.6);
      s += E(33, 5, 31, 10, "#E9DBC5", { sw: 1 }) + E(33, 5, 27, 7, "#584D3A", { sw: 0.7 });
      for (let i = 0; i < 8; i++) s += E(10 + i * 6, 5 + (i % 2) * 3, 2, 1, "#8C7955", { sw: 0 });
      for (const [x, y, color, size] of [[13, -6, "#D1A7CB", 2.6], [26, -17, "#FFF7D7", 2.5], [44, -14, "#E8C35F", 2.6], [53, -4, "#D1A7CB", 2.8], [34, -4, "#FFF7D7", 2.2], [17, 1, "#E8C35F", 2.1], [45, 1, "#F3D8D6", 2.2]]) s += flower(x, y, color, size);
      s += L(39, 11, 42, -1, WOOD, 0.8) + R(36, -8, 20, 8, CREAM, { sw: 0.5 }) + T(46, -2.5, "みんなの はな", { size: 3, fill: DARK });
      s += C(12, 27, 0.7, "#684936", { sw: 0 }) + C(54, 27, 0.7, "#684936", { sw: 0 });
      return s;
    }
  },
  {
    id: "nerikasu.drinking-fountain", name: "ふたつの高さの 水のみば", category: "広場・通学路", w: 2, h: 1,
    bbox: [-4, -36, 74, 40], states: ["day"],
    details: ["子ども・車いすで届く低いボウル", "深いホーロー受け皿と排水穴", "真鍮の押しボタン・蛇口・短い水の弧", "タイルの支柱・掃除口と排水グレーチング"],
    draw: ({ phase = 0 } = {}) => {
      let s = groundShadow(38, 29, 33, 8) + Pth("M7,23 L56,23 L66,31 H9 L2,28 Z", "#C8C5AE", { sw: 0.9 });
      s += R(14, -21, 15, 48, SAGE, { rx: 2, sw: 1.2 }) + Pth("M29,-20 L34,-16 V24 L29,27 Z", DARK, { sw: 0.8 });
      for (let y = -17; y < 25; y += 8) s += L(15, y, 28, y, "#A4B7A1", 0.65);
      s += R(19, 11, 7, 10, "#A7B4A0", { rx: 0.7, sw: 0.6 }) + bolt(22.5, 13, 0.5);
      s += E(20, -20, 16, 7, "#D4D7C7", { sw: 1 }) + Pth("M4,-20 Q20,-7 36,-20 L33,-13 Q20,-3 7,-13 Z", "#ABC2B4", { sw: 0.8 }) + E(20, -20, 12, 4, "#739994", { sw: 0.6 });
      s += E(20, -18, 2.5, 1.2, "#435D56", { sw: 0.5 });
      s += Pth("M30,-6 L52,-6 L59,0 V7 H29 Z", SAGE, { sw: 1 }) + E(45, -6, 16, 6, "#E2E1D1", { sw: 0.9 }) + E(45, -6, 12, 3.5, "#83A7A0", { sw: 0.6 });
      s += Pth("M30,-6 Q45,4 61,-6 L58,1 Q45,10 32,1 Z", "#A6C0AD", { sw: 0.8 }) + E(47, -4, 2, 1, DARK, { sw: 0.4 });
      for (const [x, y] of [[12, -25], [37, -11]]) {
        s += Pth(`M${x},${y + 5} v-7 q0,-4 4,-4 h3`, "none", { stroke: INK, sw: 3.4 }) + Pth(`M${x},${y + 5} v-7 q0,-4 4,-4 h3`, "none", { stroke: GOLD, sw: 2.2 });
        s += C(x - 4, y + 3, 2, COPPER, { sw: 0.6 });
      }
      if (phase > 0) s += Pth("M19,-31 Q28,-32 25,-19", "none", { stroke: "#BFE7E6", sw: 1.2 });
      s += R(40, 19, 19, 8, "#697C73", { sw: 0.6 });
      for (let i = 0; i < 6; i++) s += L(42 + i * 3, 20, 42 + i * 3, 26, "#BBC7B8", 0.7);
      s += leaf(21, 1, 0.4, GOLD);
      return s;
    }
  },
  {
    id: "nerikasu.postbox", name: "駅前の 赤いおてがみポスト", category: "広場・通学路", w: 1, h: 1,
    bbox: [-5, -44, 46, 39], states: ["day"],
    details: ["ひさし付きの投函口と〒の鋳出し", "手紙・はがきの白い案内と集荷時刻の2列", "鍵付き回収扉・蝶番・根元の鋳鉄台", "赤い曲面の明暗と控えめな塗装のつや"],
    draw: () => {
      let s = groundShadow(22, 30, 19, 7) + E(17, 29, 12, 4.2, "#53635A", { sw: 1 });
      s += R(11, 8, 12, 21, "#9D4F40", { sw: 1 }) + Rn(12, 10, 3, 17, "#C26751");
      s += Pth("M3,-35 Q3,-42 11,-42 H27 Q34,-42 34,-35 V8 Q34,12 29,12 H8 Q3,12 3,8 Z", "#BE5C48", { sw: 1.2 });
      s += Pth("M27,-41 Q34,-41 34,-35 V8 Q34,12 29,12 H26 V-39 Z", "#974B3F", { sw: 0 });
      s += Pth("M5,-34 Q7,-40 13,-40 H25", "none", { stroke: "#DE8A6D", sw: 1.2 });
      s += R(7, -31, 22, 5, "#693C34", { rx: 0.8, sw: 0.7 }) + Pth("M6,-32 L28,-32 L31,-29 H5 Z", "#CF7158", { sw: 0.7 });
      s += T(18, -12, "〒", { size: 14, fill: CREAM }) + T(18, -5, "POST", { size: 4.5, fill: CREAM });
      s += R(8, -1, 20, 10, "#F2E2C6", { sw: 0.6 }) + L(18, 1, 18, 7, "#8C7D64", 0.5);
      s += T(13, 3, "9:00", { size: 2.7, fill: DARK }) + T(23, 3, "16:00", { size: 2.7, fill: DARK }) + T(18, 7, "てがみ・はがき", { size: 2.6, fill: DARK });
      s += R(26, -23, 6, 25, "none", { rx: 1, sw: 0.6, stroke: "#7C3D33" }) + bolt(30, -9, 0.7) + R(32, -21, 2, 4, "#C9775C", { sw: 0.4 }) + R(32, -2, 2, 4, "#C9775C", { sw: 0.4 });
      return s;
    }
  },
  {
    id: "nerikasu.green-vending", name: "森色の まちの自販機", category: "広場・通学路", w: 2, h: 1,
    bbox: [-5, -58, 72, 41], states: ["day", "night"],
    details: ["丸みのある緑の筐体と銅色の天端", "3段12本の異なる缶・ボトルと値札・選択ボタン", "コイン口・電子決済端末・釣り銭返却口", "取り出し扉・放熱ルーバー・脚・夜の照明"],
    draw: ({ night = false } = {}) => {
      let s = groundShadow(35, 30, 33, 8) + R(9, 21, 6, 10, "#4B5D50", { sw: 0.8 }) + R(48, 21, 6, 10, "#4B5D50", { sw: 0.8 });
      s += Pth("M7,-47 Q7,-54 14,-54 H53 L62,-47 V25 L54,29 H8 Z", DARK, { sw: 1.2 });
      s += R(2, -52, 52, 81, SAGE, { rx: 5, sw: 1.2 }) + Pth("M54,-50 L62,-47 V25 L54,29 Z", "#3F6959", { sw: 0.8 });
      s += R(6, -48, 43, 8, CREAM, { rx: 2, sw: 0.6 }) + leaf(13, -44, 0.25, SAGE) + T(32, -42.5, "NERIKASU DRINKS", { size: 3.8, fill: DARK });
      s += R(6, -36, 31, 43, night ? "#F9EDCB" : "#D6E0CF", { rx: 1.5, sw: 0.7 });
      for (let row = 0; row < 3; row++) {
        const y = -34 + row * 13;
        for (let col = 0; col < 4; col++) {
          const x = 9 + col * 7;
          const colors = ["#BD7960", "#E3C978", "#8AABA0", "#A4B5CB"];
          s += R(x, y + 1, 4, 7, colors[(row + col) % 4], { rx: row === 1 ? 0.4 : 1, sw: 0.45 });
          s += R(x + 0.8, y, 2.4, 1.2, "#D4DCC8", { sw: 0.3 }) + Rn(x + 0.7, y + 3, 2.5, 2.5, CREAM);
          s += L(x + 1, y + 1.5, x + 1, y + 6.5, "#FFF8DC", 0.45) + C(x + 2, y + 10.2, 1, night ? "#EDD780" : "#B4C6A1", { sw: 0.4 });
        }
        s += L(7, y + 8.8, 36, y + 8.8, STONE, 0.55) + T(22, y + 12, "120　140　130　150", { size: 2.2, fill: DARK });
      }
      s += R(40, -32, 9, 10, "#324D45", { rx: 0.9, sw: 0.6 }) + Rn(42, -30, 5, 4, "#A8CFBC") + T(44.5, -26.8, "IC", { size: 3, fill: DARK });
      s += C(44, -17, 3.1, "#D8DBCE", { sw: 0.6 }) + L(44, -19, 44, -15, INK, 0.8) + R(40, -10, 9, 3, "#233D33", { sw: 0.5 });
      s += R(41, -3, 7, 8, "#B1BFAC", { rx: 1, sw: 0.6 }) + Pth("M43,0 h3 l-2,2 M43,0 l2,-2", "none", { stroke: DARK, sw: 0.6 });
      s += R(8, 11, 29, 11, "#2B4339", { rx: 2, sw: 0.7 }) + R(10, 12, 25, 6, "#80988A", { rx: 1, sw: 0.5 }) + L(13, 17, 32, 17, "#B7C8B1", 0.7);
      for (let y = 12; y < 25; y += 3) s += L(42, y, 49, y, "#35594B", 0.7);
      s += trim(4, -52, 48) + bolt(7, 25, 0.6) + bolt(49, 25, 0.6);
      if (night) s += glow(25, -14, 20, 26);
      return s;
    }
  },
  {
    id: "nerikasu.recycling-bins", name: "分けてすてる 3つのごみ箱", category: "広場・通学路", w: 3, h: 1,
    bbox: [-4, -31, 110, 42], states: ["day"],
    details: ["紙・缶びん・ペットボトルを形で分けた投入口", "色分けと文字・イラストの両方の表示", "丸いふた・蝶番・扉・鍵と取り替え用ライナー", "固定フレームと掃除できる脚"],
    draw: () => {
      let s = groundShadow(54, 31, 52, 8) + R(3, 23, 98, 7, "#677B6A", { sw: 0.9 });
      for (let i = 0; i < 3; i++) {
        const x = 3 + i * 32, c = ["#A8AA87", SAGE, "#899EA1"][i];
        s += R(x + 3, 22, 4, 10, DARK, { sw: 0.6 }) + R(x + 23, 22, 4, 10, DARK, { sw: 0.6 });
        s += Pth(`M${x},-17 Q${x},-23 ${x + 7},-23 H${x + 25} L${x + 29},-18 V26 H${x} Z`, c, { sw: 1 });
        s += Pth(`M${x + 24},-22 L${x + 29},-18 V26 H${x + 24} Z`, shade(c, -0.2), { sw: 0.6 });
        s += E(x + 12, -21, 14, 6, shade(c, 0.25), { sw: 0.8 });
        if (i === 0) s += R(x + 3, -23, 18, 4, DARK, { rx: 1, sw: 0.6 });
        else s += E(x + 8, -21, 4, 2.5, DARK, { sw: 0.5 }) + E(x + 18, -21, i === 1 ? 4 : 2.7, 2.5, DARK, { sw: 0.5 });
        s += R(x + 3, -11, 19, 25, "#F0E8D4", { rx: 2, sw: 0.6 });
        if (i === 0) s += R(x + 7, -6, 10, 10, "none", { sw: 0.7, stroke: DARK }) + L(x + 9, -3, x + 15, -3, DARK, 0.6) + L(x + 9, 0, x + 15, 0, DARK, 0.6);
        else if (i === 1) s += R(x + 6, -4, 6, 9, "none", { rx: 1, sw: 0.8, stroke: DARK }) + Pth(`M${x + 16},-7 h3 v3 l2,2 v7 h-7 v-7 l2,-2 Z`, "none", { sw: 0.8, stroke: DARK });
        else s += Pth(`M${x + 11},-7 h4 v3 l3,3 v6 h-10 v-6 l3,-3 Z`, "none", { sw: 0.8, stroke: DARK }) + L(x + 9, 1, x + 17, 1, DARK, 0.7);
        s += T(x + 12.5, 11, ["かみ", "かん・びん", "ボトル"][i], { size: 4, fill: DARK });
        s += R(x + 2, -13, 22, 36, "none", { rx: 2, sw: 0.55, stroke: shade(c, -0.35) }) + bolt(x + 20, 18, 0.7) + R(x - 1, 0, 2, 5, shade(c, -0.1), { sw: 0.4 });
      }
      return s;
    }
  },
  {
    id: "nerikasu.hedge-fence", name: "赤れんがと 生け垣のへい", category: "広場・通学路", w: 4, h: 1,
    bbox: [-5, -30, 143, 41], states: ["day"],
    details: ["焼き色の違うれんがをずらし積み", "両端の笠石・中間の縦桟・葉の飾り", "低い剪定生け垣の立体的な葉のまとまり", "足元の落ち葉・目地・端部の接続を隠す柱"],
    draw: () => {
      let s = groundShadow(68, 28, 69, 9) + R(3, 8, 124, 20, "#9E7259", { sw: 1 });
      for (let row = 0; row < 3; row++) {
        const y = 9 + row * 6;
        for (let col = 0; col < 9; col++) {
          const x = 4 + col * 14 - (row % 2) * 7, left = Math.max(4, x), right = Math.min(126, x + 13);
          if (right > left) s += R(left, y, right - left, 5, ["#BC8669", "#AE765B", "#C39172"][(row + col) % 3], { sw: 0.35, stroke: "#D0AE8A" });
        }
      }
      s += R(2, 5, 126, 5, "#D3C4A7", { sw: 0.8 }) + L(4, 6, 124, 6, "#EFE0C4", 0.7);
      for (const x of [20, 42, 64, 86, 108]) s += R(x, -9, 3, 14, DARK, { sw: 0.7 });
      s += L(8, -7, 122, -7, DARK, 2) + L(8, 2, 122, 2, DARK, 1.3);
      for (const x of [31, 75, 97]) s += leaf(x, -3, 0.35, SAGE);
      for (let i = 0; i < 12; i++) {
        const x = 8 + i * 10, y = -10 - (i % 3) * 2;
        s += E(x, y, 10, 10, ["#658B67", "#77966C", "#618260"][i % 3], { sw: 0.75, stroke: "#3C5C44" });
        s += Pth(`M${x - 5},${y - 3} q3,-4 6,-2 M${x + 1},${y + 4} q3,-3 5,-1`, "none", { stroke: "#98AC80", sw: 0.7 });
      }
      for (const x of [0, 120]) {
        s += R(x, -12, 11, 40, "#B17D60", { sw: 1 });
        for (let y = -7; y < 27; y += 7) s += L(x + 1, y, x + 10, y, "#D2B191", 0.7);
        s += Pth(`M${x - 2},-13 L${x + 1},-18 H${x + 12} L${x + 15},-13 V-10 H${x - 2} Z`, "#D2C6AF", { sw: 1 }) + L(x, -13, x + 13, -13, "#F1E6CA", 0.6);
      }
      s += leaf(35, 30, 0.2, "#BF9861") + leaf(99, 32, 0.16, COPPER);
      return s;
    }
  }
];
