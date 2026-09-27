// 平和台 デザイン案 v0.2（64×68 マス。1マス=32px ≒ 1.5m）
// v0.1 からの変更:
//  ① 大通りは 駅の南で 大きく カーブ（半径8マス）して まっすぐ 北へ（駅前通り）→ ロータリーの 南がわに 直角で入る。
//     ロータリーは 時計回り（日本の 左側通行・環状交差点と同じ）。入るときも 出るときも 左折だけ。
//  ② さつき通りとは 信号つきの T字路（横断歩道 3本・停止線・右左折の矢印）。
//  ③ 町を 64×68 に 広げた（v0.1 は 48×44）。歩道は 2マス、住宅地は 前庭と 塀・門・カーポートつき。
//  ④ バス停・タクシーのりばは ロータリーの 外がわ（駅がわの歩道）。車の 左がわで 乗り降りできる。
export const W = 64, H = 68;
const ground = Array.from({ length: H }, () => Array(W).fill("g"));
const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) ground[y][x] = c; };
const B = [], P = [], OVER = [], DECAL = [], WIRES = [], DRIVE = [];
const bld = (asset, x, y, o = {}) => B.push({ asset, x, y, ...o });
const prop = (asset, x, y, o = {}) => P.push({ asset, x, y, ...o });
const opt = (asset, x, y, opts, o = {}) => P.push({ asset, x, y, opts, ...o });
const decal = (asset, x, y, opts = {}) => DECAL.push({ asset, x, y, opts });
function CARC(name) { return { white: "#F1F3F4", silver: "#C9CED3", black: "#3A3F44", red: "#D8433C", blue: "#3B78C4", sky: "#8FC5E8", green: "#6FAE7E", beige: "#E8D9B8" }[name]; }

// ================= 道（ベクター。単位はマス） =================
// 大通り: 直線（駅前通り）→ 円弧（半径 RA）→ 45度の 直線。 中心線の 座標。
export const Y1 = 48, RA = 8, ARC_C = [43 + RA, Y1];
export const P1 = [ARC_C[0] - RA * Math.SQRT1_2, ARC_C[1] + RA * Math.SQRT1_2];
export const ROADS = [
  { id: "avenue", name: "へいわだい どおり（北は 駅前通り）", carriage: 4, side: 2, lanes: 2, extendStart: 1.6,
    pieces: [{ t: "seg", a: [43, 26], b: [43, Y1] }, { t: "arc", c: ARC_C, r: RA, a0: Math.PI, a1: Math.PI * 0.75 }, { t: "seg", a: P1, b: [P1[0] + 20, P1[1] + 20] }] },
  { id: "satsuki", name: "さつき通り", carriage: 2, side: 2, pieces: [{ t: "seg", a: [-1.5, 42], b: [43, 42] }] },
  { id: "exit", name: "南の出口通り（シティへ）", carriage: 2, side: 2, pieces: [{ t: "seg", a: [24, 42], b: [24, 69.5] }] },
];
// ロータリー: 中心線（角まる長方形）と 車線の幅。外がわの ふち = 中心線 +1、島の ふち = 中心線 −1
export const RING = { x0: 36, y0: 17, x1: 50, y1: 25, r: 3, w: 2 };
// 交差点の 角の まるみ（隅切り）: 角の点・歩道の ある 向き（sx, sy）・半径
export const FILLETS = [
  { at: [41, 41], sx: -1, sy: -1, r: 1.5 }, { at: [41, 43], sx: -1, sy: 1, r: 1.5 },   // 大通り × さつき通り
  { at: [23, 43], sx: -1, sy: 1, r: 1.5 }, { at: [25, 43], sx: 1, sy: 1, r: 1.5 },     // さつき通り × 出口通り
  { at: [41, 26], sx: -1, sy: 1, r: 1.5 }, { at: [45, 26], sx: 1, sy: 1, r: 1.5 },     // ロータリー × 大通り
];
// 横断歩道（しまの 向き: v = たての しま＝南北の道を わたる / h = 東西の道を わたる）
export const CROSSWALKS = [
  { id: "ring-mouth", x0: 41, x1: 45, y0: 27.6, y1: 29.6, bars: "v", signal: false },   // ロータリーの 入口（信号なし → ひし形の 予告）
  { id: "jct-north", x0: 41, x1: 45, y0: 37.0, y1: 39.0, bars: "v", signal: true },
  { id: "jct-south", x0: 41, x1: 45, y0: 45.0, y1: 47.0, bars: "v", signal: true },
  { id: "jct-west", x0: 37.0, x1: 39.0, y0: 41, y1: 43, bars: "h", signal: true },
];
// 路面の 表示（停止線・矢印・文字・ひし形）
export const MARKS = [
  { k: "stop", x0: 43, x1: 45, y: 36.1 },                 // 南行き（東の車線）の 停止線
  { k: "stop", x0: 41, x1: 43, y: 47.9 },                 // 北行き（西の車線）の 停止線
  { k: "stopv", x: 36.1, y0: 41, y1: 43 },                // さつき通り 東行きの 停止線（中央線なし）
  { k: "arrow", x: 42, y: 50.2, dir: "n", turn: "l" },    // 北行き: まっすぐ＋左
  { k: "arrow", x: 44, y: 33.6, dir: "s", turn: "r" },    // 南行き: まっすぐ＋右（さつき通りへ）
  { k: "arrow", x: 33.2, y: 41.5, dir: "e", turn: "lr" },  // さつき通り 東行き: 左・右
  { k: "diamond", x: 42, y: 33.4 },                        // 信号のない 横断歩道の 予告（北行き）
  { k: "stop", x0: 23, x1: 25, y: 45.6 }, { k: "text", t: "止まれ", x: 24, y: 47.3, rot: 0 },   // 出口通り → さつき通り
  { k: "text", t: "30", x: 12, y: 42, rot: -90, size: 0.7 },                                 // さつき通り（ゾーン30）
  { k: "ringArrow", x: 44, y: 17, dir: "e" }, { k: "ringArrow", x: 50, y: 21, dir: "s" }, { k: "ringArrow", x: 38.2, y: 25, dir: "w" }, { k: "ringArrow", x: 36, y: 18.6, dir: "n" },
  { k: "bay", x0: 35.9, x1: 40.3, y0: 16.1, y1: 17.2, label: "" }, { k: "bay", x0: 40.6, x1: 49.1, y0: 16.1, y1: 17.9, label: "バス", c: "#F2C14E" },
  { k: "bay", x0: 35.1, x1: 36.1, y0: 19.4, y1: 23.6, label: "" },
];
// 車道の 中央線（黄色の 実線）: 大通りの 直線と カーブ（交差点・横断歩道の中は 切る）
export const CENTER = [{ road: "avenue", from: 29.6, to: 37.0 }, { road: "avenue", from: 47.0, to: 99 }];

// ================= 距離の関数（地面の ラスタ化・通れる判定に使う） =================
const dSegFlat = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2; if (t < 0 || t > 1) return Infinity; return Math.abs((p[0] - a[0]) * vy - (p[1] - a[1]) * vx) / Math.sqrt(L2); };
const inArc = (p, q) => { let a = Math.atan2(p[1] - q.c[1], p[0] - q.c[0]); if (a < 0) a += 2 * Math.PI; const lo = Math.min(q.a0, q.a1), hi = Math.max(q.a0, q.a1); return a >= lo - 1e-9 && a <= hi + 1e-9; };
const dArcFlat = (p, q) => (inArc(p, q) ? Math.abs(Math.hypot(p[0] - q.c[0], p[1] - q.c[1]) - q.r) : Infinity);
export const roadDist = (rd, p) => Math.min(...rd.pieces.map((q) => (q.t === "seg" ? dSegFlat(p, q.a, q.b) : dArcFlat(p, q))));
const sdRoundBox = (p, cx, cy, hx, hy, r) => { const qx = Math.abs(p[0] - cx) - (hx - r), qy = Math.abs(p[1] - cy) - (hy - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };
export const ringSd = (p) => sdRoundBox(p, (RING.x0 + RING.x1) / 2, (RING.y0 + RING.y1) / 2, (RING.x1 - RING.x0) / 2, (RING.y1 - RING.y0) / 2, RING.r);

// ================= 地面（マス） =================
// g 芝 / l 手入れ芝 / G 御影石 / V 歩道の敷石 / Z 商店街 / C コンクリート / R 路地（アスファルト） / P 駐車場 / S 玉砂利 / K 参道 / D 土 / O 空き地 / B バラスト / M ホーム / X へり
fill(0, 0, W - 1, 1, "X"); fill(0, 2, W - 1, 2, "g"); fill(0, 3, W - 1, 6, "B"); fill(0, 7, W - 1, 8, "g"); fill(16, 7, 47, 8, "M");
fill(0, 9, 0, H - 1, "X"); fill(W - 1, 9, W - 1, H - 1, "X");
// 神社（鎮守の森）
fill(1, 9, 15, 27, "S"); fill(7, 15, 8, 27, "K");
// 駅前: 駅の前の歩道・広場・ロータリーの まわり
fill(16, 13, 23, 13, "G"); fill(16, 9, 23, 12, "C"); fill(40, 9, 40, 13, "C"); fill(16, 14, 51, 15, "G"); fill(52, 15, 62, 16, "V"); fill(16, 16, 34, 27, "G"); fill(35, 16, 51, 27, "V");
// マンションの 中庭・オフィス前・コンビニ・ガソリンスタンド・ファミレス
fill(52, 17, 62, 20, "l"); fill(59, 17, 62, 19, "C"); fill(47, 27, 62, 31, "V"); fill(47, 32, 51, 35, "P"); fill(47, 36, 62, 41, "P"); fill(47, 42, 62, 44, "l");
fill(47, 45, 62, 50, "C"); fill(49, 51, 62, 65, "l"); fill(56, 56, 62, 58, "P");
// 商店街（北の並び y=28〜30、通り y=31〜34）
fill(2, 31, 38, 34, "Z"); fill(24, 28, 25, 30, "Z"); fill(7, 28, 8, 30, "K"); fill(37, 28, 38, 30, "l");
// 南の並びの 路地
fill(2, 35, 3, 38, "C"); fill(16, 35, 17, 38, "C"); fill(24, 35, 25, 38, "C"); fill(37, 35, 38, 38, "l");
// 公園（x2〜19, y46〜64。へりは 生け垣）
fill(1, 45, 20, 65, "l");
fill(11, 45, 12, 47, "D"); fill(9, 47, 14, 51, "G"); fill(2, 52, 20, 53, "D"); fill(11, 54, 12, 64, "D"); fill(2, 55, 9, 64, "D"); fill(13, 59, 19, 60, "D");
// 住宅地: 前庭（塀の列）と 路地
fill(27, 45, 50, 65, "l");
for (const y of [50, 57, 64]) fill(27, y, 52, y + 1, "R");
fill(54, 56, 55, 58, "C");                                          // ファミレスの 出入り口
fill(34, 52, 34, 56, "C"); fill(39, 59, 39, 63, "C"); fill(40, 59, 46, 63, "O");
fill(33, 47, 34, 49, "C"); fill(33, 61, 34, 63, "C");               // カーポートの 床
fill(0, H - 2, W - 1, H - 1, "X");

// ================= 建物 =================
bld("bld.bikeshed", 16, 9); bld("bld.station", 24, 9, { act: "transit", door: [31, 32] }); bld("bld.supermarket", 41, 9, { act: "buy:market", door: [45, 46] }); bld("bld.mansion", 52, 9);
bld("bld.shrine", 5, 11, { act: "visit", door: [7, 8] });
bld("bld.koban", 17, 17, { act: "visit", door: [19] });
bld("bld.shop.furniture", 2, 28, { act: "buy:furniture", door: [4] }); bld("bld.shop.greengrocer", 9, 28, { act: "visit", door: [10] }); bld("bld.shop.bakery", 13, 28, { act: "work:bakery", door: [14] }); bld("bld.shop.florist", 17, 28, { act: "visit", door: [18] });
bld("bld.shop.books", 20, 28, { act: "visit", door: [21] }); bld("bld.shop.diner", 26, 28, { act: "work:crepe", door: [27] }); bld("bld.shop.cafe", 30, 28, { act: "visit", door: [31] }); bld("bld.shop.wagashi", 33, 28, { act: "visit", door: [34] });
bld("bld.post", 4, 35, { act: "visit", door: [6, 7] }); bld("bld.sento", 10, 35, { act: "visit", door: [12, 13] }); bld("bld.apartment", 18, 35); bld("bld.nursery", 26, 35, { act: "visit", door: [28] }); bld("bld.house.modern", 32, 35, { opts: { roof: ["p-kawara-brown", "#8B5E48"], wall: "#FBF3E6" } });
bld("bld.office", 53, 21); bld("bld.conbini", 52, 32, { door: [54, 55] });
bld("bld.gas", 50, 45); bld("bld.famires", 56, 52, { door: [59] });
bld("bld.toilet", 16, 61);
// 住宅地（家は 南向き。前庭に 塀・門・カーポート）
bld("bld.house.modern", 28, 45, { opts: { roof: ["p-slate", "#5F6A72"] }, door: [30] }); bld("bld.house.hiraya", 35, 46, { act: "visit", door: [37] });
bld("bld.apartment", 28, 52); bld("bld.house.old", 35, 52, { act: "visit", door: [37] });
bld("bld.house.modern", 28, 59, { opts: { roof: ["p-metal-roof", "#8FA1AE"], wall: "#EEF3E6", door: "#5C7C8C" }, door: [30] }); bld("bld.house.hiraya", 35, 60, { door: [37] });

// ================= 線路・駅 =================
for (let i = 0; i < 16; i++) prop("bg.roofs", i * 4, 0, { opts: { seed: i + 1 }, z: -1 });
opt("prop.wall", 0, 2, { len: 64, kind: "fence" }, { z: -1 }); opt("prop.wall", 0, 8, { len: 16, kind: "fence" }); opt("prop.wall", 48, 8, { len: 16, kind: "fence" });
for (let x = 3; x < W; x += 8) prop("rail.pole", x, 2);
prop("rail.train", 18, 5); prop("rail.canopy", 22, 7, { over: true });
prop("prop.bench", 17, 8, { z: -0.5 }); prop("prop.bench", 43, 8, { z: -0.5 }); prop("prop.vending", 46, 8, { opts: { c: "#2E6DB4" } });
// ================= 駅前広場 =================
for (const [x, c] of [[28, "#D8433C"], [29, "#2E6DB4"], [35, "#F4F4F2"]]) prop("prop.vending", x, 14, { opts: { c } });
prop("prop.phone", 38, 14); prop("prop.trash", 27, 14); prop("prop.lamp", 21, 15); prop("prop.lamp", 39, 15);
prop("prop.mapboard", 33, 16); prop("park.clock", 26, 22); prop("prop.flowerbed", 24, 23); prop("prop.flowerbed", 27, 23);
for (const [x, y] of [[22, 18], [31, 18], [22, 26], [31, 26]]) prop("nat.tree.street", x, y);
prop("prop.bench", 23, 20); prop("prop.bench", 28, 20); prop("prop.bench", 28, 25); prop("prop.bench", 23, 25);
opt("prop.bikerack", 16, 22, {}); opt("prop.bikerack", 16, 24, { cols: ["#8E24AA", "#FDD835", "#3E2723", "#1E88E5"] });
opt("prop.bicycle", 21, 20, {}); prop("prop.planter", 16, 26); prop("prop.mailbox", 33, 19); prop("prop.trash", 30, 21);
for (const [x, y] of [[20, 24], [30, 17]]) decal("prop.manhole", x, y);
// ロータリー: 外がわの のりば（駅がわ）・島の 植えこみ
prop("prop.taxistand", 36, 15); opt("veh.taxi", 36, 16.05, { dir: "e" }); opt("veh.taxi", 38.1, 16.05, { dir: "e" });
prop("prop.busstop", 41, 15, { opts: { no: "1" } }); prop("prop.busstop", 46, 15, { opts: { no: "2" } }); prop("veh.bus", 41.2, 16.05, { opts: { to: "くうこう" } });
opt("veh.car", 35.05, 20, { c: "#F1F3F4", dir: "n" });
prop("nat.tree.big", 42, 19.6, { opts: {} }); for (const [x, y] of [[38, 19], [38, 22], [47.8, 19], [47.8, 22]]) prop("nat.shrub", x, y, { opts: { flower: (x + y) % 2 === 0 } });
prop("prop.flowerbed", 39.2, 20.6); prop("prop.flowerbed", 45.2, 20.6); opt("park.sign", 44.8, 22.3, { name: "ようこそ へいわだい" });
prop("prop.sign.cross", 40, 27); prop("prop.sign.cross", 46, 29); prop("prop.lamp", 47, 26); prop("nat.tree.street", 36, 27);
// マンションの 中庭
for (const [x, y] of [[53, 17], [56, 20], [58, 17]]) prop("nat.tree.street", x, y);
prop("park.spring", 54, 18, { opts: { kind: "panda" } }); prop("park.spring", 55, 18, { opts: { kind: "zou" } }); prop("prop.bench", 53, 20); opt("prop.garbage", 57, 15, {});
opt("veh.car", 59, 17.2, { c: "#3B78C4", dir: "s" }); opt("veh.car", 61, 17.2, { c: "#F1F3F4", dir: "s" }); opt("prop.bikerack", 52, 16, {});
// オフィス前・コンビニ・駐車場
prop("prop.busstop", 46, 31, { opts: { no: "3" } }); prop("prop.planter", 49, 27); prop("prop.planter", 59, 27); prop("nat.tree.street", 52, 28); prop("nat.tree.street", 61, 29); prop("prop.bench", 55, 29); opt("prop.bikerack", 56, 30, {});
for (let k = 0; k < 7; k++) prop("prop.wheelstop", 48 + k * 2, 36.2, { z: -0.5 });
for (const [x, c] of [[48, CARC("red")], [52, CARC("white")], [54, CARC("black")], [60, CARC("sky")]]) opt("veh.car", x, 37.0, { c, dir: "n" });
prop("prop.trash", 58, 35.1); prop("prop.vending", 59, 35.1, { opts: { c: "#2E6DB4" } }); prop("prop.nobori", 51, 34.8, { opts: { c: "#3BAA6A", t: "おでん" } });
opt("veh.kei", 49.2, 32.2, { dir: "s" });
for (const x of [48, 51, 54, 57, 60]) prop("nat.shrub", x, 43);
// 大通りの 並木・街灯・信号
for (const y of [30, 34]) { prop("nat.tree.street", 40, y); prop("nat.tree.street", 45, y); }
prop("prop.lamp", 40, 32); prop("prop.lamp", 45, 36);
opt("prop.signal", 39, 36, {}); opt("prop.signal", 46, 36, { flip: true }); opt("prop.signal", 39, 47, {}); opt("prop.signal", 46, 47, { flip: true }); opt("prop.signal", 36, 39, {}); opt("prop.signal", 36, 44, {});
for (const y of [50, 54]) prop("nat.tree.street", 40.2 + (y - 50) * 0.35, y);
prop("prop.sign.stop", 22, 46); prop("prop.hydrant", 38, 44); decal("prop.manhole", 43, 31, { plain: true }); decal("prop.manhole", 42.5, 52, { plain: true });
// 走っている 車（見本）
opt("veh.car", 41.55, 34.6, { c: CARC("silver"), dir: "n" }, { moving: true }); opt("veh.car", 43.55, 40.6, { c: CARC("green"), dir: "s" }, { moving: true }); opt("veh.car", 14, 41.08, { c: CARC("beige"), dir: "e" }, { moving: true });
opt("veh.car", 57, 56.3, { c: CARC("blue"), dir: "n" }); opt("veh.car", 61, 56.3, { c: CARC("white"), dir: "n" });
// ================= 神社 =================
prop("shrine.torii", 6.5, 24); prop("shrine.lantern", 6, 17); prop("shrine.lantern", 9, 17); prop("shrine.lantern", 6, 21); prop("shrine.lantern", 9, 21);
prop("shrine.komainu", 6, 15); prop("shrine.komainu", 9, 15, { opts: { flip: true } }); prop("shrine.chozuya", 3, 17); prop("shrine.ema", 11, 19); prop("nat.tree.big", 11, 11, { opts: { rope: true } });
for (let x = 1; x <= 15; x += 2) prop(x % 4 === 1 ? "nat.pine" : "nat.tree.street", x, 9, { opts: { c: "#4E9A52", flip: x % 8 === 1 } });
for (let y = 11; y <= 25; y += 2) { prop("nat.pine", 1, y, { opts: { flip: y % 4 === 1 } }); if (y > 11) prop([ "nat.tree.street", "nat.pine", "nat.tree.street", "nat.shrub" ][(y >> 1) % 4], 14 + ((y * 7) % 3 - 1) * 0.3, y + ((y * 5) % 3 - 1) * 0.25, { opts: { c: ["#4E9A52", "#5E9E5A", "#6AAE58"][y % 3], flip: y % 3 === 0 } }); }
prop("nat.tree.big", 12.4, 21.4, { opts: { c: "#4F8F57" } });
for (let x = 1; x <= 15; x++) if (x !== 7 && x !== 8) prop("shrine.fence", x, 27);
prop("nat.shrub", 3, 23); prop("nat.shrub", 12, 23); prop("nat.tree.sakura", 2, 13); prop("prop.jizo", 12, 25);
// ================= 商店街 =================
prop("prop.arcade_gate", 24, 28); prop("prop.arcade_sign", 38, 30); prop("prop.arcade_sign", 1, 31);
for (const x of [5, 11, 17, 23, 29, 35]) prop("prop.suzuran", x, 34, { opts: { c: ["#E07A5F", "#3D8FC6"][x % 2] } });
for (let i = 0; i < 5; i++) OVER.push({ asset: "prop.bunting", x: 5.5 + i * 6, y: 34, h: 2.35, opts: { len: 6, sag: 8 } });
for (const [x, c, t] of [[9, "#E53935", "やさい"], [16, "#F28C28", "やきたて"], [19.6, "#D9607E", "はな"], [29.2, "#E53935", "ランチ"], [36.4, "#43A047", "だんご"]]) prop("prop.nobori", x, 31, { opts: { c, t } });
prop("prop.stall", 12.6, 33, { opts: { label: "たこやき", c: "#E53935" } }); prop("prop.stall", 30, 33, { opts: { label: "たいやき", c: "#1E88E5" } });
prop("prop.bench", 7, 34); prop("prop.bench", 20, 34); prop("prop.bench", 26, 34); prop("prop.planter", 2, 34); prop("prop.planter", 36, 34);
prop("prop.aboard", 15, 31); prop("prop.aboard", 32, 31); prop("prop.gacha", 22.6, 31); prop("prop.bicycle", 12, 31); prop("prop.bicycle", 28, 31.2); opt("prop.pots", 37, 31, {});
for (const [x, y] of [[10, 32.5], [27, 32.4]]) decal("prop.manhole", x, y);
// ================= 南の並び・さつき通り =================
prop("prop.mailbox", 9, 39); prop("prop.bicycle", 15, 39); prop("prop.bicycle", 23, 39); prop("prop.vending", 16, 39, { opts: { c: "#D8433C" } }); prop("prop.bicycle", 30, 39);
for (const x of [4, 20, 33]) prop("prop.lamp", x, 40);
for (const x of [8, 27, 31]) prop("nat.tree.street", x, 43, { opts: { c: "#6AAE58" } });
prop("nat.shrub", 37, 35); prop("nat.shrub", 38, 37, { opts: { flower: true } });
decal("prop.manhole", 18, 41.5, { plain: true }); decal("prop.manhole", 12, 39.4);
// ================= 公園（さつき こうえん） =================
opt("nat.hedge", 1, 45, { len: 10 }); opt("nat.hedge", 13, 45, { len: 8 }); opt("nat.hedge", 20, 46, { len: 6, dir: "v" }); opt("nat.hedge", 20, 54, { len: 11, dir: "v" }); opt("nat.hedge", 1, 65, { len: 20 }); opt("nat.hedge", 1, 46, { len: 19, dir: "v" });
prop("park.ubollard", 11, 45); prop("park.ubollard", 12, 45); prop("park.ubollard", 20, 52); prop("park.ubollard", 20, 53); opt("park.sign", 13.2, 46, { name: "さつき こうえん" });
prop("park.pond", 2.4, 46.4); prop("park.fountain", 10, 48); prop("park.clock", 14, 51);
prop("park.fujidana", 16, 47); prop("park.swing", 3, 55.6); prop("park.slide", 7, 55); prop("park.sandbox", 3, 58.5); prop("park.jungle", 7, 59); prop("park.tetsubo", 3, 61.5);
prop("park.spring", 7, 62.4, { opts: { kind: "zou" } }); prop("park.spring", 8.4, 62.4, { opts: { kind: "uma" } }); prop("park.tires", 3, 63.4); prop("park.seesaw", 12.9, 61.2);
prop("park.azumaya", 15, 55.4); prop("park.drink", 13, 58); prop("prop.trash", 19, 58.2);
for (const [x, y] of [[18, 45.2], [2, 51], [18.2, 50.2], [9.6, 64], [18, 64.6]]) prop("nat.tree.big", x, y - 1, { opts: {} });
for (const [x, y] of [[14.6, 49], [5.6, 51.2], [15.4, 52.8]]) prop("nat.tree.sakura", x, y - 1);
for (const [x, y] of [[9, 49], [13, 49], [4, 53.7], [15, 53.7]]) prop("prop.bench", x, y);
for (const [x, y] of [[10, 46], [13, 55], [10, 58], [19, 55.5]]) prop("prop.lamp", x, y);
prop("prop.flowerbed", 7, 46.2); prop("prop.flowerbed", 16.5, 51.6); prop("prop.flowerbed", 3.6, 52.1);
for (const [x, y, k] of [[16, 49.4, "dandelion"], [5, 50.7, "clover"], [17, 57.6, "grass"], [14, 62, "dandelion"], [19, 49, "grass"], [8.3, 52.1, "clover"], [2.2, 54.1, "grass"]]) decal("nat.tuft", x, y, { kind: k, seed: Math.round(x * 7 + y) });
// ================= 出口通り =================
for (const y of [48, 52.4, 57, 61.6]) prop("nat.tree.sakura", 21.1, y - 1);
prop("prop.lamp", 22, 64);
// ================= 住宅地 =================
// 1ばん目の 列（y45〜49）
opt("prop.gatepost", 29, 49, { name: "たなか" }); opt("prop.wall", 28, 49, { len: 1, kind: "block" }); opt("prop.wall", 32, 49, { len: 1, kind: "block" });
opt("prop.carport", 33, 47.4, { car: CARC("red"), dir: "s" }); opt("nat.hedge", 35, 49, { len: 2 }); opt("prop.gatepost", 36, 49, { name: "やまだ", c: "#CFC8BB" });
opt("nat.hedge", 27, 45.3, { len: 4, dir: "v" }); prop("nat.tree.street", 33, 45.4, { opts: { c: "#6AAE58" } }); prop("prop.laundry", 36.6, 44.8, { z: -0.5 }); opt("prop.pots", 34, 48.3, {});
// 2ばん目の 列（y52〜56）
opt("prop.bikerack", 28.6, 56, { cols: ["#E53935", "#FFFFFF", "#1E88E5", "#43A047"] }); opt("prop.garbage", 31.6, 56.1, {});
opt("prop.wall", 35, 56, { len: 2, kind: "wood" }); opt("prop.pots", 39, 55.4, {}); prop("nat.tree.street", 40, 53, { opts: { c: "#4F9A52" } }); opt("veh.kei", 40.2, 55.7, { dir: "e" });
opt("prop.wall", 27, 52, { len: 4, dir: "v", kind: "fence" });
// 3ばん目の 列（y59〜63）
opt("prop.gatepost", 29, 63, { name: "すずき", c: "#E6E1D6" }); opt("prop.wall", 28, 63, { len: 1, kind: "fence" }); opt("prop.wall", 31, 63, { len: 2, kind: "fence" });
opt("prop.carport", 33, 61.4, { car: CARC("sky"), dir: "s" }); opt("nat.hedge", 35, 63, { len: 2 }); opt("prop.gatepost", 38, 63, { name: "さとう" });
opt("nat.hedge", 27, 59.3, { len: 4, dir: "v" }); prop("nat.tree.street", 36.2, 59.2, { opts: { c: "#6AAE58" } }); prop("prop.laundry", 32.8, 58.9, { z: -0.5 });
prop("prop.dokan", 41, 60.2); for (const [x, y, k] of [[40.2, 59.6, "grass"], [44.4, 60.6, "grass"], [43.6, 62.4, "stone"], [40.4, 62.6, "dandelion"]]) decal("nat.tuft", x, y, { kind: k, seed: Math.round(x * 3 + y) });
opt("prop.wall", 40, 63, { len: 6, kind: "fence" });
// 路地の 小物: 電柱・カーブミラー・掲示板・お地蔵さん・自販機・消火栓
for (const [x, y, tr] of [[32, 50, 1], [38, 50, 0], [31, 57, 0], [38, 57, 1], [33, 64, 1], [38, 64, 0], [46, 64, 0], [26, 48, 0], [26, 55, 1], [26, 62, 0]]) prop("prop.pole", x, y, { opts: { trans: !!tr } });
prop("prop.mirror", 27, 52.2); prop("prop.mirror", 27, 59.2); prop("prop.mirror", 40, 59);
opt("prop.notice", 26.6, 44.7, {}); prop("prop.jizo", 39, 52); prop("prop.vending", 38, 49, { opts: { c: "#D8433C" } }); prop("prop.hydrant", 36, 58);
// 電柱の 電線（上の層）
prop("prop.pole", 26.4, 44.4, { opts: { trans: true } }); prop("prop.pole", 18, 44.4, {}); prop("prop.pole", 6, 44.4, { opts: { trans: false } });
WIRES.push([[26.4, 44.4], [26, 48], [26, 55], [26, 62]], [[26, 48], [32, 50], [38, 50]], [[26, 55], [31, 57], [38, 57]], [[26, 62], [33, 64], [38, 64], [46, 64]], [[6, 44.4], [18, 44.4], [26.4, 44.4]]);
// ================= 東の へり・南の へり =================
for (let y = 10; y < 66; y += 2) if (!(y >= 38 && y <= 45)) prop(y % 4 ? "nat.tree.street" : "nat.pine", 0, y, { opts: { c: "#5E9E5A" } });
for (let y = 10; y < 62; y += 2) prop("nat.tree.street", 63, y, { opts: { c: "#5E9E5A" } });
for (const x of [0, 4, 8, 12, 16, 28, 32, 36, 40, 44, 48]) prop("bg.roofs", x, H - 2, { opts: { seed: 30 + x }, z: -1 });
prop("nat.tree.street", 20, 66); prop("nat.tree.street", 52, 66);
// 町の 入口（空港がわ）: 案内標識・ようこその 看板・木
opt("prop.guidesign", 50.6, 55.2, { lines: [["↑", "へいわだい えき"], ["←", "さつき どおり"]] }); opt("park.sign", 58.6, 61.4, { name: "ようこそ へいわだい" });
for (const [x, y] of [[56, 60], [61, 58.6], [62, 63.4], [59.6, 64.8]]) prop("nat.tree.street", x, y, { opts: { c: "#5E9E5A" } });
prop("prop.nobori", 48, 45, { opts: { c: "#D84A3F", t: "セルフ" } }); prop("prop.nobori", 61.4, 45, { opts: { c: "#F2B23A", t: "せんしゃ" } }); opt("veh.car", 59, 47.6, { c: CARC("black"), dir: "w" });
// 駐車場の 出入り口（歩道の 切り下げ）
DRIVE.push({ kind: "rect", x0: 45, x1: 47, y0: 32.4, y1: 35.2 }, { kind: "arc", a0: Math.PI * 0.865, a1: Math.PI * 0.8 }, { kind: "diag", t0: 7.6, t1: 9.8 },
  { kind: "arcO", a0: Math.PI * 0.946, a1: Math.PI * 0.878 }, { kind: "diagSW", t0: 1.75, t1: 4.55 }, { kind: "diagSW", t0: 11.65, t1: 14.45 });
for (const y of [50, 57, 64]) DRIVE.push({ kind: "rect", x0: 25, x1: 27, y0: y, y1: y + 2 });

// ================= 人・出口・ラベル =================
export const NPC = [
  { name: "まちの ハル", x: 27, y: 18, sp: "cat", outfit: { body: "tshirt_blue" } }, { name: "おまわりさん", x: 19, y: 21, sp: "bear", outfit: { neck: "bowtie_blue", body: "sweater" } },
  { name: "駅員さん", x: 33.6, y: 14.2, sp: "penguin", outfit: { neck: "bowtie_red" } }, { name: "やおやの おじさん", x: 11, y: 31, sp: "pig", outfit: { head: "hachimaki", body: "apron" } },
  { name: "せんとうの おばあちゃん", x: 12, y: 39, sp: "sheep", outfit: { face: "glasses", neck: "muffler" } }, { name: "公園の こども", x: 10, y: 54, sp: "rabbit", outfit: { head: "strawhat", back: "backpack" } },
  { name: "宮司さん", x: 8, y: 16, sp: "frog", outfit: { face: "mustache" } }, { name: "バスを まつ ひと", x: 44.4, y: 14.3, sp: "mouse", outfit: { head: "ribbon_pink", body: "dress" } },
];
export const WALKERS = [{ x: 18.2, y: 32.4, sp: "rabbit", dir: "right", outfit: { body: "stripe" } }, { x: 33.4, y: 32.2, sp: "cat", dir: "left", col: "#B0B0B0", outfit: { body: "apron" } }, { x: 6.2, y: 53.2, sp: "frog", dir: "right" }, { x: 29.4, y: 24.2, sp: "sheep", dir: "left", outfit: { head: "knit" } }, { x: 21.4, y: 16.4, sp: "pig", dir: "down", outfit: { head: "beret" } }];
export const HEROES = [{ id: "wanko", x: 25, y: 20 }, { id: "gachan", x: 24, y: 21.2 }, { id: "goji", x: 26, y: 21.2 }];
export const WARPS = [{ to: "city", x: 21, y: H - 1, w: 6, h: 1 }, { to: "airport", x: 54, y: H - 1, w: 10, h: 1 }];
export const LABELS = [
  { text: "へいわだい どおり", x: 53.2, y: 61.4, rot: 45 }, { text: "駅前通り", x: 43, y: 43.6, rot: 90, small: true }, { text: "さつき通り", x: 6, y: 42.35 },
  { text: "へいわだい しょうてんがい", x: 20, y: 33.1 }, { text: "駅前 ロータリー（時計回り）", x: 43, y: 23.4 }, { text: "さつき こうえん", x: 10.5, y: 64.6 }, { text: "へいわだい じんじゃ", x: 8, y: 26.5 },
  { text: "住宅地", x: 36, y: 50.9, small: true }, { text: "シティへ", x: 24, y: 66.6 }, { text: "くうこうへ", x: 58.6, y: 66.2, rot: 45 },
];
prop("prop.pigeons", 25, 16.6); prop("prop.pigeons", 29.5, 22.6, { opts: { seed: 3 } });
export { ground, B, P, OVER, DECAL, WIRES, DRIVE, fill };
export const meta = { W, H, Y1, RA, P1, ARC_C };
