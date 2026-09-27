// 平和台のアセット集（追加・作り直し）。assets.mjs の REG に 足す／上書きする。
// 見かたの決まり: 1マス=32px。光は左上、影は右下。高いものは 足もと（マスの下はし）から 上へ はみ出して描く。
import { P, INK, f, shade, hash, st, R, Rn, C, E, Pth, L, T, groundShadow } from "./lib.mjs";
import { REG, def, glass, win, doorAuto, doorWood, signBand, ac, pot, foundation, pitchedRoof, flatRoof, castShadow, bike } from "./assets.mjs";
export { REG };

// たて書きの文字（「ー」は たての線にする）
const VT = (x, y, text, size, fill, gap = size * 1.1, o = {}) => [...text].map((ch, i) => (ch === "ー" ? L(x, y + i * gap - size * 0.78, x, y + i * gap - size * 0.12, fill, size * 0.14) : ch === " " ? "" : T(x, y + i * gap, ch, { size, fill, weight: o.weight || 800, stroke: o.stroke, sw: o.sw }))).join("");
const wheel = (x, y, w = 4, h = 8) => R(x, y, w, h, "#2B2B2B", { sw: 0.6, rx: 1.5 });

// ================= 乗り物（作り直し: 色・向き・細部） =================
// たて向き（前が上）の車を 描く。 dir: n（上向き）/ s（下向き）/ e（右向き）/ w（左向き）
function carBody(c, o = {}) {
  const W = 28, H = 56, dk = shade(c, -0.22), lt = shade(c, 0.28);
  let s = wheel(0.5, 9, 4, 9) + wheel(W - 4.5, 9, 4, 9) + wheel(0.5, H - 19, 4, 9) + wheel(W - 4.5, H - 19, 4, 9);
  s += `<rect x="2" y="3" width="${W - 4}" height="${H - 6}" rx="8" fill="${c}" ${st(1.2)}/>`;
  s += Rn(3.5, 7, 3, H - 14, lt, { op: 0.8, rx: 1.5 }) + Rn(W - 6.5, 7, 3, H - 14, dk, { op: 0.45, rx: 1.5 });  // 側面の光と影
  s += L(W / 2, 5, W / 2, 14, lt, 1.2, { op: 0.8 });                                                         // ボンネットの すじ
  s += `<path d="M5,21 Q${W / 2},15.5 ${W - 5},21 L${W - 6.5},25 L6.5,25 Z" fill="#7FB3CC" ${st(0.8)}/><path d="M8,23.5 L12,18 L15,17.6 L10.5,24 Z" fill="#E4F4FB" opacity="0.8"/>`; // フロントガラス
  s += R(6.5, 25, W - 13, 15, shade(c, 0.1), { sw: 0.7, rx: 2.5 }) + Rn(8, 26.5, W - 16, 3, lt, { op: 0.6, rx: 1 });                                // 屋根
  s += `<path d="M6.5,40 L${W - 6.5},40 L${W - 5},44 Q${W / 2},46.5 5,44 Z" fill="#7FB3CC" ${st(0.8)}/>`;                                          // うしろのガラス
  s += Rn(4.2, 25.5, 1.8, 14, "#6FA3BD") + Rn(W - 6, 25.5, 1.8, 14, "#6FA3BD");                                                                   // 横の窓
  s += E(1.2, 21, 1.8, 1.2, dk, { sw: 0.6 }) + E(W - 1.2, 21, 1.8, 1.2, dk, { sw: 0.6 });                                                          // ミラー
  s += `<path d="M4,6.5 Q5.5,3.8 9,3.6 L9,6.5 Z" fill="#FFF6C9" ${st(0.5)}/><path d="M${W - 4},6.5 Q${W - 5.5},3.8 ${W - 9},3.6 L${W - 9},6.5 Z" fill="#FFF6C9" ${st(0.5)}/>`; // ライト
  s += Rn(4.5, H - 6.5, 5, 2.4, "#D8433C", { rx: 1 }) + Rn(W - 9.5, H - 6.5, 5, 2.4, "#D8433C", { rx: 1 });                                      // テールランプ
  if (o.taxi) s += R(W / 2 - 6, 29, 12, 6, "#FFFFFF", { sw: 0.8, rx: 1.5 }) + Rn(W / 2 - 6, 33, 12, 2, "#2E7D5B") + T(W / 2, 33, "TAXI", { size: 3.4, fill: INK });
  return s;
}
function carPlaced(c, o = {}) {
  const dir = o.dir || "n", body = carBody(c, o);
  return carShadow(dir) + carWrap(dir, body);
}
const carShadow = (dir) => (dir === "e" || dir === "w" ? Rn(7, 6, 56, 27, "#1A1410", { op: 0.2, rx: 9 }) : Rn(5, 6, 27, 56, "#1A1410", { op: 0.2, rx: 9 }));
const carWrap = (dir, body) => (dir === "e" ? `<g transform="translate(60,2) rotate(90)">${body}</g>` : dir === "w" ? `<g transform="translate(4,30) rotate(-90)">${body}</g>` : dir === "s" ? `<g transform="translate(30,60) rotate(180)">${body}</g>` : `<g transform="translate(2,2)">${body}</g>`);
const CAR_COLORS = { white: "#F1F3F4", silver: "#C9CED3", black: "#3A3F44", red: "#D8433C", blue: "#3B78C4", sky: "#8FC5E8", green: "#6FAE7E", beige: "#E8D9B8" };
def({ id: "veh.car", name: "車（とまっている・上から）", cat: "乗り物", w: 1, h: 2, prio: "A", variants: ["色 8色: 白・銀・黒・赤・青・水色・緑・ベージュ", "向き: n/s（たて 1×2）・e/w（よこ 2×1）"],
  details: ["タイヤが 4つ 少し はみ出す", "フロント／うしろの ガラス・屋根・横の窓", "ドアミラー・ライト・テールランプ", "側面の 光と影（ツヤ）", "足もとに 影"] },
  (o = {}) => carPlaced(o.c || CAR_COLORS.white, o));
def({ id: "veh.taxi", name: "タクシー", cat: "乗り物", w: 1, h: 2, prio: "A", variants: ["向き: n/s/e/w"], details: ["黄色の車体", "屋根の あんどん『TAXI』（白と緑）", "車と同じ 細部"] },
  (o = {}) => carPlaced(o.c || "#F2C14E", { ...o, taxi: true }));
def({ id: "veh.kei", name: "軽トラック（荷台つき）", cat: "乗り物", w: 1, h: 2, prio: "B", variants: ["向き: n/s/e/w", "荷台: 段ボール／やさいの かご"], details: ["白い 四角い運転席", "荷台の あおり（かこい）と ゆか", "荷物（段ボール・やさいの かご）"] },
  (o = {}) => { const W = 28, H = 56; let b = wheel(0.5, 8, 4, 8) + wheel(W - 4.5, 8, 4, 8) + wheel(0.5, H - 16, 4, 8) + wheel(W - 4.5, H - 16, 4, 8);
    b += R(2.5, 3, W - 5, 18, "#F4F5F4", { sw: 1.2, rx: 4 }) + `<path d="M5,9 L${W - 5},9 L${W - 6},14 L6,14 Z" fill="#7FB3CC" ${st(0.7)}/>` + Rn(6, 15, W - 12, 5, "#E3E6E6");
    b += R(2, 22, W - 4, H - 25, "#D9DCDC", { sw: 1.1, rx: 1.5 }) + Rn(4.5, 24.5, W - 9, H - 30, "#8E9496") + L(4.5, 24.5, W - 4.5, 24.5, "#FFFFFF", 0.8, { op: 0.6 });
    b += R(6, 27, 9, 8, "#C9A071", { sw: 0.6 }) + L(6, 31, 15, 31, "#A87F52", 0.6) + R(15.5, 29, 7, 7, "#C9A071", { sw: 0.6 }) + R(7, 38, 14, 10, "#6C8F4F", { sw: 0.7, rx: 1 }) + [0, 1, 2].map((i) => C(10 + i * 4, 42, 2, ["#E8913A", "#D8433C", "#F2C14E"][i], { sw: 0.4 })).join("");
    const dir = o.dir || "n"; return carShadow(dir) + carWrap(dir, b); });
def({ id: "veh.bus", name: "路線バス（とまっている）", cat: "乗り物", w: 4, h: 2, prio: "A", variants: ["行き先: くうこう／シティ／えき"], details: ["白に 緑と黄色の 帯", "屋根の 室外機と 行き先表示", "窓の列・前の 大きなガラス・ドア（左がわ 2か所）", "タイヤが 下に 見える"] },
  (o = {}) => { const W = 4 * P - 4, H = 2 * P - 4; let s = groundShadow(W / 2 + 6, H + 1, W / 2 + 2, 5);
    s += wheel(18, H - 7, 12, 6) + wheel(W - 32, H - 7, 12, 6);
    s += R(2, 2, W - 2, H - 7, "#F8F8F6", { sw: 1.3, rx: 6 }) + Rn(4, 3.5, W - 6, 13, "#E9ECEC", { rx: 4 });                 // 屋根
    s += R(W / 2 - 22, 5, 16, 8, "#D3D9DC", { sw: 0.7, rx: 1 }) + L(W / 2 - 20, 9, W / 2 - 8, 9, "#AAB3B7", 0.7) + R(W / 2 + 2, 5, 16, 8, "#D3D9DC", { sw: 0.7, rx: 1 });
    s += R(W - 58, 17, 40, 6, "#2F3A40", { sw: 0.6, rx: 1 }) + T(W - 38, 21.8, o.to || "くうこう いき", { size: 4.6, fill: "#FFB74D" });
    s += R(W - 13, 16, 10, H - 25, "#9CC7DC", { sw: 0.8, rx: 2 }) + L(W - 11, 18, W - 6, 26, "#E4F4FB", 1.2, { op: 0.8 });                  // 前のガラス
    for (let x = 8; x < W - 26; x += 13) s += R(x, 25, 11, 10, "#9CC7DC", { sw: 0.6, rx: 1 });
    s += R(W - 36, 24, 9, H - 31, "#B9D9E6", { sw: 0.7 }) + R(W / 2 - 8, 24, 9, H - 31, "#B9D9E6", { sw: 0.7 });                             // ドア
    s += Rn(2, H - 14, W - 2, 3.5, "#3E9A6E") + Rn(2, H - 10.5, W - 2, 2, "#F2B23A") + C(W - 4, H - 12, 1.8, "#FFF6C9", { sw: 0.5 });
    return s; });

// ================= 建物（作り直し） =================
def({ id: "bld.gas", name: "ガソリンスタンド（大屋根・給油機）", cat: "建物", w: 9, h: 5, prio: "A", interact: "なし（車が 給油している 見た目）",
  details: ["高い 大屋根（地面より 上に ずれて見える）と 赤・黄の 帯『へいわ せきゆ』", "屋根を ささえる 柱", "給油機 4台（画面・ノズル 3色・ホース）が 島の上に", "給油中の 車", "コンクリートの 地面・排水みぞ・油じみ・白い矢印", "ガラスの 事務所（陸屋根に 室外機）", "高い 価格の看板（レギュラー・ハイオク・けいゆ）"] },
  () => { const W = 9 * P, H = 5 * P; let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#p-concrete)"/>` + R(0, 0, W, H, "none", { sw: 0.8, stroke: "#B4AC9E" });
    s += L(6, H - 8, W - 6, H - 8, "#8E887E", 2.4) + L(6, H - 8, W - 6, H - 8, "#B8B2A6", 0.8, { dash: "3 3" });      // 排水みぞ
    s += E(70, 132, 12, 5, "#8E8A82", { sw: 0, op: 0.35 }) + E(150, 128, 9, 4, "#8E8A82", { sw: 0, op: 0.3 });
    s += `<path d="M20,146 L44,146 L44,142 L52,148 L44,154 L44,150 L20,150 Z" fill="#FFFFFF" opacity="0.9"/>`;       // 矢印
    // 事務所（右おく）
    const ox = 196;
    s += `<g transform="translate(${ox},46)">` + castShadow(88, 82, 10) + flatRoof(88, 22, "#BFC3C4", { items: [["ac", 8, 6], ["ac", 22, 6]] }) + R(0, 20, 88, 62, "#F4F6F6", { sw: 1.2 }) + Rn(0, 20, 88, 6, "#D84A3F") + glass(6, 32, 50, 30) + doorAuto(60, 32, 22, 44) + R(6, 66, 50, 10, "#E1E5E6", { sw: 0.6 }) + T(31, 74, "おみせ", { size: 5.5, fill: "#5A6B73" }) + `</g>`;
    // 給油機の島
    for (const ix of [30, 118]) { s += R(ix, 96, 58, 14, "#DADDDD", { sw: 1, rx: 3 }) + Rn(ix + 2, 97.5, 54, 3, "#F2F4F4", { rx: 1.5 });
      for (const px of [ix + 6, ix + 34]) { s += R(px, 74, 18, 26, "#F3F4F4", { sw: 1, rx: 1.5 }) + R(px + 3, 77, 12, 7, "#2E3B44", { sw: 0.5 }) + Rn(px + 4, 79, 5, 1.2, "#7CE0A0") + Rn(px, 88, 18, 3, "#D84A3F") + [0, 1, 2].map((k) => R(px + 2 + k * 5.2, 92, 3.6, 5, ["#D84A3F", "#F2C14E", "#43A047"][k], { sw: 0.4 })).join("") + `<path d="M${px + 18},84 q9,6 4,16" stroke="${INK}" stroke-width="1.3" fill="none"/>`; } }
    // 柱と 給油中の車
    for (const x of [58, 146]) s += R(x - 3, 30, 6, 70, "#E5E7E7", { sw: 1 });
    s += `<g transform="translate(87,62)">` + REG["veh.car"].draw({ c: "#3B78C4" }) + `</g>`;
    // 大屋根（高いので 上に ずれる）
    s += `<path d="M180,-6 L196,2 L196,40 L180,40 Z" fill="#1A1410" opacity="0.12"/>` + R(8, -18, 172, 50, "#FBFBFA", { sw: 1.3, rx: 2 });
    for (let x = 28; x < 176; x += 22) s += L(x, -16, x, 20, "#E6E8E8", 1);
    s += Rn(8, 20, 172, 7, "#D84A3F") + Rn(8, 27, 172, 5, "#F2B23A") + L(8, 32, 180, 32, INK, 1.3) + T(94, 26, "へいわ せきゆ", { size: 6.5 });
    // 価格の看板
    s += L(12, H - 4, 12, -38, "#8C959B", 3.2) + R(-4, -86, 32, 50, "#FFFFFF", { sw: 1.1, rx: 2 }) + Rn(-4, -86, 32, 9, "#D84A3F", { rx: 2 }) + T(12, -79.5, "ねだん", { size: 5 });
    [["レギュラー", "168"], ["ハイオク", "179"], ["けいゆ", "148"]].forEach(([k, v], i) => { s += T(12, -69 + i * 12, k, { size: 3.8, fill: "#5A6B73", weight: 700 }) + T(12, -63.5 + i * 12, v, { size: 5.5, fill: "#D84A3F" }); });
    return s; });

// ================= 自然（作り直し・追加） =================
def({ id: "nat.pine", name: "松（クロマツ・神社の森）", cat: "自然", w: 1, h: 1, prio: "A", variants: ["flip: 左右反転で 変化をつける"], details: ["高さ 3マス", "くねって のびる 赤茶の幹（うろこ模様）", "雲のような 葉の かたまり 4段（外がわだけ 線・上面が明るい）", "枝が 葉の段へ のびる", "足もとの 影"] },
  (o = {}) => { const fl = o.flip ? `transform="matrix(-1,0,0,1,32,0)"` : ""; let s = `<g ${fl}>` + E(22, 30, 15, 5, "#1A1410", { sw: 0, op: 0.17 });
    s += `<path d="M12,30 C10,16 5,6 9,-8 C12,-20 20,-28 16,-42 L19.5,-42 C24,-28 16,-20 13.5,-8 C10.5,4 16,16 20,30 Z" fill="#8A5A3C" ${st(1)}/>`;
    for (let i = 0; i < 7; i++) { const y = 26 - i * 9.5, x = i < 3 ? 13 - i * 1.3 : i < 5 ? 10 + (i - 3) * 2.5 : 15 + (i - 5); s += `<path d="M${f(x)},${f(y)} q2,-1.5 4,0" stroke="#6B4430" stroke-width="0.8" fill="none"/>`; }
    s += `<path d="M10,-4 Q4,-8 1,-12 M14,-22 Q20,-26 25,-28 M12,8 Q18,6 24,2 M17,-36 Q14,-40 12,-44" stroke="#7A4E34" stroke-width="2.2" fill="none"/>`;
    const pads = [[3, -14, 1], [25, -30, 0.95], [24, 0, 0.85], [13, -46, 0.9]], blobs = (x, y, k) => [[x - 6 * k, y + 0.6, 6 * k, 3.8 * k], [x, y - 1.6, 7.4 * k, 4.8 * k], [x + 6 * k, y + 0.6, 6 * k, 3.8 * k]];
    for (const [x, y, k] of pads) { const bl = blobs(x, y, k); s += bl.map(([bx, by, rx, ry]) => E(bx, by, rx, ry, "#2F6B45", { sw: 1.1 })).join("") + bl.map(([bx, by, rx, ry]) => E(bx, by, rx - 0.5, ry - 0.5, "#2F6B45", { sw: 0 })).join("");
      s += bl.map(([bx, by, rx, ry]) => E(bx - 0.6, by - 1.2, rx * 0.72, ry * 0.5, "#4F8F57", { sw: 0 })).join("") + E(x - 1.5, y - 3.8 * k, 3.4 * k, 1.1, "#7FB77A", { sw: 0 });
      for (let q = 0; q < 7; q++) { const px = x - 11 * k + q * 3.6 * k, py = y + 3.6 * k - Math.abs(q - 3) * 0.5; s += L(px, py, px + (hash(q, x) - 0.5) * 2, py + 2.2, "#2F6B45", 0.9); } }
    return s + `</g>`; });
def({ id: "nat.tuft", name: "草むら・小さな花（地面の かざり）", cat: "自然", w: 1, h: 1, pass: true, prio: "A", variants: ["grass（草）", "clover（クローバー）", "dandelion（たんぽぽ）", "stone（石）"], details: ["通れる（上を歩ける）", "広い しばふの 空白を うめる", "1マスに 1つ。まとめて置かない"] },
  (o = {}) => { const k = o.kind || "grass", sx = 6 + hash(o.seed || 1, 1) * 12, sy = 14 + hash(o.seed || 1, 2) * 10; let s = "";
    if (k === "grass" || k === "dandelion") for (let i = 0; i < 5; i++) s += `<path d="M${f(sx + i * 2.2)},${f(sy + 6)} q${f((i - 2) * 1.2)},-5 ${f((i - 2) * 1.8)},-8" stroke="${i % 2 ? "#6E9E4E" : "#7FB25E"}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    if (k === "dandelion") s += C(sx + 3, sy - 3, 2.3, "#F7C948", { sw: 0.5 }) + C(sx + 8, sy - 1, 1.9, "#F7C948", { sw: 0.5 }) + C(sx + 12, sy + 1, 1.6, "#FFFFFF", { sw: 0.4 });
    if (k === "clover") for (let i = 0; i < 4; i++) { const cx = sx + i * 4, cy = sy + (i % 2) * 3; s += C(cx, cy, 1.5, "#5E9E4E", { sw: 0 }) + C(cx + 2, cy, 1.5, "#5E9E4E", { sw: 0 }) + C(cx + 1, cy - 1.7, 1.5, "#6CAD5B", { sw: 0 }); }
    if (k === "stone") s += E(sx + 4, sy + 3, 5, 3, "#BDB6AA", { sw: 0.8 }) + E(sx + 10, sy + 5, 3, 2, "#A9A296", { sw: 0.7 }) + E(sx + 3, sy + 2, 2, 1, "#DAD4CA", { sw: 0 });
    return s; });
def({ id: "nat.hedge", name: "生け垣（刈りこみ・つなげて使う）", cat: "自然", w: 1, h: 1, prio: "A", variants: ["dir: h（よこ）／ v（たて）", "len: 長さ（マス）"], details: ["四角く 刈った 緑（上面は明るく、前面は暗く）", "葉の 細かい もよう", "足もとの 影"] },
  (o = {}) => { const len = o.len || 1, v = o.dir === "v"; let s = "";
    if (!v) { const W = len * P; s += Rn(2, 26, W, 5, "#1A1410", { op: 0.15 }) + R(0, 4, W, 24, "#4A8C4D", { sw: 1, rx: 5 }) + Rn(1.5, 5, W - 3, 9, "#6AAE66", { rx: 4 });
      for (let i = 0; i < len * 9; i++) s += C(3 + hash(i, 21) * (W - 6), 8 + hash(i, 22) * 17, 1.5 + hash(i, 23), i % 3 ? "#3C7A3F" : "#80BF74", { sw: 0 }); }
    else { const Hh = len * P; s += Rn(22, 6, 5, Hh, "#1A1410", { op: 0.14 }) + R(6, -8, 18, Hh + 6, "#4A8C4D", { sw: 1, rx: 5 }) + Rn(7.5, -7, 15, Hh + 2, "#6AAE66", { rx: 4 });
      for (let i = 0; i < len * 7; i++) s += C(9 + hash(i, 25) * 12, -5 + hash(i, 26) * (Hh - 2), 1.4 + hash(i, 27), i % 3 ? "#3C7A3F" : "#80BF74", { sw: 0 }); }
    return s; });

// ================= 背景（作り直し） =================
def({ id: "bg.roofs", name: "背景の 家なみ（マップの へり）", cat: "背景", w: 4, h: 2, prio: "A", variants: ["seed で 屋根の色・形・高さが かわる（同じ並びが 続かない）"], details: ["切妻の 屋根（瓦・金属・スレート）と 棟", "陸屋根の アパート（貯水そう）", "アンテナ・太陽光パネル", "壁と 窓（カーテンの色ちがい）", "家の間の 木"] },
  (o = {}) => { const sd = o.seed || 1; let s = Rn(0, 0, 128, 64, "#CFC6B6");
    let x = 0, i = 0;
    while (x < 128) { const w = 30 + Math.floor(hash(i, sd) * 14), kind = hash(i, sd + 7); const wall = ["#F2EBDD", "#E9EEF0", "#F4E6D8", "#EFEDE4"][Math.floor(hash(i, sd + 3) * 4)];
      if (kind < 0.22) { s += R(x, 10, w, 54, wall, { sw: 1 }) + R(x, 6, w, 7, "#BFC3C4", { sw: 1 }) + R(x + 4, 1, 10, 7, "#9EB6C4", { sw: 0.8, rx: 1.5 }); for (let r = 0; r < 3; r++) for (let c = 0; c < Math.floor(w / 11); c++) s += R(x + 3 + c * 11, 17 + r * 15, 7, 7, "#A8D3E6", { sw: 0.5 }); }
      else { const pat = ["p-kawara-gray", "p-kawara-brown", "p-kawara-blue", "p-metal-roof", "p-slate"][Math.floor(hash(i, sd + 5) * 5)], rh = 26 + Math.floor(hash(i, sd + 9) * 8);
        s += R(x + 2, rh - 2, w - 4, 64 - rh + 2, wall, { sw: 1 }) + `<path d="M${x - 1},${rh} L${x + 5},6 L${x + w - 5},6 L${x + w + 1},${rh} Z" fill="url(#${pat})" ${st(1.1)}/>` + L(x + 5, 6, x + w - 5, 6, "#E8E2D6", 1.6) + Rn(x - 1, rh - 2.5, w + 2, 2.5, "#1A1410", { op: 0.25 });
        s += win(x + 7, rh + 6, 9, 7, { curtain: ["#F3D1A6", "#C9DDEE", "#F2C4CE"][i % 3] }) + (w > 36 ? win(x + w - 16, rh + 6, 9, 7, {}) : "");
        if (hash(i, sd + 11) < 0.4) s += L(x + w * 0.6, 6, x + w * 0.6, -6, "#8A8F92", 0.9) + L(x + w * 0.6 - 4, -3, x + w * 0.6 + 4, -3, "#8A8F92", 0.9) + L(x + w * 0.6 - 3, 0, x + w * 0.6 + 3, 0, "#8A8F92", 0.9);
        if (hash(i, sd + 13) < 0.3) { s += R(x + 7, 10, 14, 8, "#34506E", { sw: 0.7 }); for (let k = 1; k < 3; k++) s += L(x + 7 + k * 4.7, 10, x + 7 + k * 4.7, 18, "#5C7C9C", 0.5); } }
      if (hash(i, sd + 17) < 0.35) s += C(x + w, 44, 7, "#5E9E5A", { sw: 0.9 }) + C(x + w - 2, 42, 4, "#79B373", { sw: 0 });
      x += w + 2; i++; }
    return s + Rn(0, 58, 128, 6, "#B9B09E") + L(0, 58, 128, 58, "#9E9584", 1); });

// ================= 商店街 =================
def({ id: "prop.arcade_gate", name: "商店街の 入口アーチ", cat: "小物", w: 2, h: 1, pass: true, prio: "S", interact: "通りぬけられる",
  details: ["高さ 3マス（上に はみ出す）", "看板『へいわだい しょうてんがい』（2行）", "看板の上に 小さな瓦屋根", "ちょうちん 3つ（夜に光る）", "看板の ふちに 電球の点", "季節の かざり（春は さくらの造花）", "柱の 足もとは 石の台"], variants: ["春: さくら", "夏: ちょうちん多め", "冬: イルミネーション"], anim: "夜は 電球と ちょうちんが 光る" },
  (o = {}) => { const W = 2 * P; let s = groundShadow(W / 2 + 6, 30, W / 2 + 4, 3.5);
    for (const x of [4, W - 10]) s += R(x, -58, 6, 86, "#7C5B45", { sw: 1 }) + R(x - 2, 22, 10, 6, "#A39C90", { sw: 0.8 }) + L(x + 1.5, -56, x + 1.5, 24, "#9C7A62", 1);
    s += `<path d="M-16,-86 L${W + 16},-86 L${W + 10},-94 L-10,-94 Z" fill="url(#p-kawara-gray)" ${st(1)}/>` + L(-10, -94, W + 10, -94, "#A4ACB5", 1.4);
    s += R(-14, -86, W + 28, 30, "#B8322A", { sw: 1.2, rx: 2 }) + R(-10, -83, W + 20, 24, "#FFF6E2", { sw: 0.8 });
    s += T(W / 2, -75.5, "へいわだい", { size: 6.5, fill: "#B8322A" }) + T(W / 2, -64.5, "しょうてんがい", { size: 8, fill: INK });
    for (let x = -12; x <= W + 12; x += 6) s += C(x, -57.5, 1.1, "#FFE9A0", { sw: 0.3 });
    for (const x of [-6, W / 2, W + 6]) s += L(x, -56, x, -52, INK, 0.8) + E(x, -46, 4.4, 6, "#E0453A", { sw: 0.9 }) + L(x - 3.8, -48, x + 3.8, -48, "#B32E26", 0.6) + L(x - 3.8, -44, x + 3.8, -44, "#B32E26", 0.6) + Rn(x - 2, -52.5, 4, 1.6, INK) + Rn(x - 2, -40.5, 4, 1.4, INK);
    for (let i = 0; i < 9; i++) { const x = -12 + i * 11 + hash(i, 3) * 4; s += C(x, -87 + hash(i, 4) * 3, 2.4, "#F7BCD0", { sw: 0.4 }) + C(x, -87 + hash(i, 4) * 3, 0.9, "#E8829F", { sw: 0 }); }
    return s; });
def({ id: "prop.arcade_sign", name: "商店街の ポールサイン（たて看板）", cat: "小物", w: 1, h: 1, prio: "A", details: ["高さ 3マス", "たて書き『しょうてんがい』", "上に まるい マーク（へいわだいの 花）と 小さな ランプ", "ふちは 赤、面は クリーム色", "足もとは コンクリートの台"] },
  () => { let s = groundShadow(18, 28, 6, 2.2) + R(14, -24, 5, 52, "#7C5B45", { sw: 0.9 }) + R(10, 22, 12, 6, "#A39C90", { sw: 0.7 });
    s += R(6, -84, 21, 64, "#B8322A", { sw: 1.1, rx: 2 }) + R(8.5, -70, 16, 48, "#FFF6E2", { sw: 0.7 }) + VT(16.5, -61.5, "しょうてんがい", 6, INK, 6.3);
    s += C(16.5, -77, 5.2, "#FFFFFF", { sw: 0.8 }) + [0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; return C(16.5 + Math.cos(a) * 2.4, -77 + Math.sin(a) * 2.4, 1.7, "#F28CAB", { sw: 0.3 }); }).join("") + C(16.5, -77, 1.1, "#F2C14E", { sw: 0 });
    return s + L(16.5, -84, 16.5, -90, INK, 1) + C(16.5, -91, 2.4, "#FFE9A0", { sw: 0.7 }); });
def({ id: "prop.nobori", name: "のぼり旗", cat: "小物", w: 1, h: 1, prio: "S", variants: ["色 5色（opts.c）", "文字（opts.t）: セール／やきたて／だんご／コロッケ／おすすめ"], anim: "風で 少し ゆれる",
  details: ["高さ 2マス", "細い ポールと 上の よこ棒", "旗の上は 白い帯（チチ）、下は色の 地", "たて書きの 文字", "足もとは 水を入れる 黒い台"] },
  (o = {}) => { const c = o.c || "#E53935", t = o.t || "セール"; let s = groundShadow(17, 28, 6, 2) + E(16, 25, 7, 3.2, "#3A3A3A", { sw: 0.9 }) + R(10, 20, 12, 6, "#474747", { sw: 0.8, rx: 2 });
    s += L(9, 24, 9, -40, "#9AA0A3", 1.4) + L(9, -40, 24, -40, "#9AA0A3", 1.2);
    s += `<path d="M10,-40 L24,-40 L24.5,-2 Q17,0 10,-2 Z" fill="${c}" ${st(0.9)}/>` + Rn(10.5, -39.5, 13.5, 6, "#FFFFFF") + L(10.5, -33.5, 24, -33.5, shade(c, -0.25), 0.6);
    s += VT(17.2, -24.5, t, 5.4, "#FFFFFF", 6);
    return s; });
def({ id: "prop.stall", name: "屋台（たこやき・たいやき など）", cat: "小物", w: 2, h: 2, prio: "S", interact: "話しかけると 買える（将来）", variants: ["たこやき（赤）", "たいやき（青）", "だんご（緑）"],
  details: ["木の 車台と 車輪", "小さな 切妻屋根", "のれん（4枚）に 文字", "台の上に 商品（たこやきの 鉄板・たいやき）", "赤い ちょうちん", "ねだんの 札"] },
  (o = {}) => { const c = o.c || "#E53935", label = o.label || "たこやき", W = 64, H = 64; let s = groundShadow(36, 60, 30, 5);
    s += R(4, 30, 56, 26, "#B98A5E", { sw: 1.1 }) + [0, 1, 2, 3].map((k) => L(4, 36 + k * 6, 60, 36 + k * 6, "#A0744B", 0.7)).join("");       // 車台
    s += C(10, 56, 6, "#8C6440", { sw: 1 }) + C(10, 56, 2, "#5E4028", { sw: 0.5 }) + C(54, 56, 6, "#8C6440", { sw: 1 }) + C(54, 56, 2, "#5E4028", { sw: 0.5 });
    s += R(2, 26, 60, 6, "#8E6440", { sw: 1 });                                                                                                        // 台
    if (label === "たこやき") { s += R(12, 27.5, 28, 4, "#3A3A3A", { sw: 0.6 }); for (let i = 0; i < 6; i++) s += C(15 + i * 4.5, 26.5, 1.9, "#C98A45", { sw: 0.4 }) + C(15 + i * 4.5, 26, 0.6, "#4E8B3A", { sw: 0 }); }
    else if (label === "たいやき") { for (let i = 0; i < 4; i++) s += `<path d="M${14 + i * 8},27.5 q3,-3 6,0 l2,-1.5 l0,3 l-2,-1.5 q-3,3 -6,0 Z" fill="#D9A15B" ${st(0.5)}/>`; }
    else { for (let i = 0; i < 3; i++) s += L(15 + i * 8, 29, 21 + i * 8, 22, "#C9A36B", 0.8) + [0, 1, 2].map((k) => C(16 + i * 8 + k * 2, 27.5 - k * 2.3, 1.7, ["#F7B7C8", "#FFFFFF", "#8BC34A"][k], { sw: 0.4 })).join(""); }
    for (const x of [6, 56]) s += R(x - 1.5, -6, 3, 32, "#7C5B45", { sw: 0.7 });
    s += `<path d="M-2,2 L32,-12 L66,2 L66,6 L-2,6 Z" fill="#6B4A33" ${st(1.1)}/>` + L(32, -12, 32, 6, "#8C6440", 0.8) + Rn(-2, 6, 68, 2, "#1A1410", { op: 0.25 });
    for (let i = 0; i < 4; i++) s += R(4 + i * 14, 6, 13, 13, c, { sw: 0.8 });
    s += T(32, 15.5, label, { size: 7, fill: "#FFFFFF" }) + R(46, 34, 12, 8, "#FFFFFF", { sw: 0.5 }) + T(52, 40, "300", { size: 4.4, fill: c });
    s += L(63, 6, 63, 10, INK, 0.8) + E(63, 16, 4, 6, "#E0453A", { sw: 0.9 }) + L(59.5, 14, 66.5, 14, "#B32E26", 0.6) + L(59.5, 18, 66.5, 18, "#B32E26", 0.6);
    return s; });
def({ id: "prop.suzuran", name: "商店街の 街灯（すずらん灯・フラッグつき）", cat: "小物", w: 1, h: 1, prio: "S", anim: "夜は ランプが光る・フラッグが ゆれる",
  details: ["高さ 2.8マス", "こい緑の 柱（金の かざり）", "上に すずらんの形の ランプ 2つ", "たて長の フラッグ『へいわだい』（色は 通りごとに 統一）", "足もとの かざり台"] },
  (o = {}) => { const fc = o.c || "#E07A5F"; let s = groundShadow(17, 28, 5, 2) + R(11, 20, 10, 8, "#2F5C4C", { sw: 0.9, rx: 1.5 }) + R(14, -64, 4, 86, "#3E6B5A", { sw: 0.9 }) + L(15.2, -62, 15.2, 20, "#5E8B78", 0.8);
    s += R(12.5, -2, 7, 3, "#C9A64A", { sw: 0.5 }) + R(12.5, -66, 7, 3, "#C9A64A", { sw: 0.5 }) + C(16, -69, 2, "#C9A64A", { sw: 0.5 });
    s += `<path d="M16,-62 Q16,-70 6,-70 M16,-62 Q16,-70 26,-70" stroke="#3E6B5A" stroke-width="2" fill="none"/>`;
    for (const x of [5, 27]) s += `<path d="M${x - 5},-60 Q${x - 5},-69 ${x},-69 Q${x + 5},-69 ${x + 5},-60 Q${x},-57.5 ${x - 5},-60 Z" fill="#FFF7DA" ${st(0.9)}/>` + L(x, -71, x, -69, INK, 0.8) + E(x, -59.4, 3, 1, "#FFE38A", { sw: 0 });
    s += L(18, -50, 28, -50, "#3E6B5A", 1.2) + L(18, -22, 28, -22, "#3E6B5A", 1.2) + R(19, -50, 9, 28, fc, { sw: 0.8 }) + Rn(19, -50, 9, 4, "#FFFFFF", { op: 0.8 }) + VT(23.5, -39.5, "へいわ", 4.4, "#FFFFFF", 5);
    return s; });
def({ id: "prop.bunting", name: "旗かざり（通りの上に わたす）", cat: "小物", w: 8, h: 1, pass: true, prio: "A", variants: ["len: 長さ（マス）", "たるみ（sag）"], anim: "風で ゆれる",
  details: ["高いところ（上の層）に 描く。下を 通れる", "たるんだ ひも", "三角の 旗（6色）が 等間かくに"] },
  (o = {}) => { const len = o.len || 8, W = len * P, sag = o.sag || 10; let s = `<path d="M0,0 Q${W / 2},${sag * 2} ${W},0" stroke="#6E6258" stroke-width="1" fill="none"/>`;
    const n = Math.floor(W / 10); for (let i = 1; i < n; i++) { const t = i / n, x = W * t, y = 4 * sag * t * (1 - t) * 1; s += `<path d="M${f(x - 3.4)},${f(y)} L${f(x + 3.4)},${f(y)} L${f(x)},${f(y + 8)} Z" fill="${["#E53935", "#FBC02D", "#1E88E5", "#43A047", "#F48FB1", "#FFFFFF"][i % 6]}" ${st(0.5)}/>`; }
    return s; });
def({ id: "prop.aboard", name: "黒板の 立て看板（A型）", cat: "小物", w: 1, h: 1, prio: "A", details: ["木の わくと 足（A字）", "黒板に チョークの 色文字『きょうの おすすめ』", "小さな 絵（カップ・星）"] },
  () => groundShadow(18, 28, 9, 2.5) + L(7, 28, 10, 2, "#8C5E3B", 1.6) + L(25, 28, 22, 2, "#8C5E3B", 1.6) + R(8, 0, 16, 22, "#8C5E3B", { sw: 0.9, rx: 1 }) + Rn(10, 2, 12, 18, "#2F4A3C") + T(16, 7.5, "きょうの", { size: 3.2, fill: "#FFFFFF", weight: 700 }) + T(16, 12, "おすすめ", { size: 3.2, fill: "#FFE082", weight: 700 }) + C(13, 16, 1.6, "none", { sw: 0.6, stroke: "#F8BBD0" }) + `<path d="M19,14 l0.8,1.6 l1.8,0.2 l-1.3,1.2 l0.4,1.8 l-1.7,-0.9 l-1.7,0.9 l0.4,-1.8 l-1.3,-1.2 l1.8,-0.2 Z" fill="#FFF59D"/>`);
def({ id: "prop.gacha", name: "カプセルトイ（ガチャガチャ）", cat: "小物", w: 1, h: 1, prio: "A", interact: "コインで まわす（将来）", details: ["2台 たてに 重ねた 機械", "とうめいな 窓に カラフルな カプセル", "ハンドル・取り出し口", "上に 絵の カード"] },
  () => { let s = groundShadow(18, 29, 11, 2.5); for (const [y, c] of [[-22, "#E53935"], [2, "#1E88E5"]]) { s += R(5, y, 22, 24, c, { sw: 1, rx: 2 }) + R(8, y + 3, 16, 10, "#EAF6FB", { sw: 0.7 }); for (let i = 0; i < 6; i++) s += C(10.5 + (i % 3) * 5.5, y + 6 + Math.floor(i / 3) * 4.5, 2, ["#F48FB1", "#FFE082", "#81D4FA", "#A5D6A7", "#FFAB91", "#CE93D8"][i], { sw: 0.4 }); s += C(12, y + 18, 2.6, "#F4F4F2", { sw: 0.7 }) + L(10, y + 18, 14, y + 18, INK, 0.8) + R(18, y + 16, 6, 5, "#2B2B2B", { sw: 0.5 }); } return s + R(5, -28, 22, 6, "#FFFFFF", { sw: 0.8 }) + T(16, -23.6, "ガチャ", { size: 4, fill: "#E53935" }); });

// ================= まちの 小物（追加） =================
def({ id: "prop.manhole", name: "マンホール（花の デザイン）", cat: "地面", w: 1, h: 1, pass: true, prio: "A", variants: ["flower: さつきの花の 色つき（歩道）", "plain: 灰色の もよう（車道）"], details: ["鉄の ふちと ふた", "町の花（さつき）の 色つき デザイン", "車道用は 灰色の 幾何もよう"] },
  (o = {}) => { let s = C(16, 16, 10.5, "#6E6A64", { sw: 1 }) + C(16, 16, 9, o.plain ? "#8D8981" : "#4D5A63", { sw: 0.6 });
    if (o.plain) { for (let k = -2; k <= 2; k++) s += L(16 + k * 3.2, 8, 16 + k * 3.2, 24, "#77736B", 0.7) + L(8, 16 + k * 3.2, 24, 16 + k * 3.2, "#77736B", 0.7); }
    else { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; s += E(16 + Math.cos(a) * 3.6, 16 + Math.sin(a) * 3.6, 2.8, 2.2, "#F28CAB", { sw: 0.4 }); } s += C(16, 16, 1.6, "#F2C14E", { sw: 0.3 }) + `<path d="M8.5,19 q3,-4 6,-1 M23.5,19 q-3,-4 -6,-1" stroke="#7FB25E" stroke-width="1.4" fill="none"/>`; }
    return s; });
def({ id: "prop.hydrant", name: "消火栓（赤）と 標識", cat: "小物", w: 1, h: 1, prio: "A", details: ["赤い 消火栓（キャップ 2つ・頭の まるみ）", "うしろに『消火栓』の 赤い 標識", "足もとに 黄色の 枠"] },
  () => groundShadow(18, 28, 7, 2.2) + L(24, 27, 24, -26, "#9AA0A3", 1.6) + R(18, -38, 13, 13, "#D23B32", { sw: 0.9, rx: 6.5 }) + T(24.5, -33.2, "消火", { size: 3.4 }) + T(24.5, -28.8, "栓", { size: 3.4 }) + R(5, 24, 18, 4, "none", { sw: 1, stroke: "#E9C46A" }) + R(8, 6, 12, 19, "#D23B32", { sw: 1, rx: 2 }) + `<path d="M8,8 Q14,-2 20,8 Z" fill="#E4574E" ${st(0.9)}/>` + C(14, 2.5, 1.8, "#B32E26", { sw: 0.6 }) + R(4.5, 11, 4, 4, "#B32E26", { sw: 0.6 }) + R(19.5, 11, 4, 4, "#B32E26", { sw: 0.6 }) + L(10, 20, 18, 20, "#F2A09A", 0.8));
def({ id: "prop.garbage", name: "ごみ集積所（ストッカー）", cat: "小物", w: 2, h: 1, prio: "A", details: ["灰みどりの 金あみの箱＋ふた", "中に 白い ごみぶくろ", "前に 札『ごみ しゅうせきじょ』と 曜日の カレンダー"] },
  () => { let s = groundShadow(35, 29, 28, 3) + R(4, -2, 56, 8, "#7E9A8C", { sw: 1, rx: 1 }) + R(4, 6, 56, 22, "#93AE9F", { sw: 1 }); for (let x = 7; x < 60; x += 3.5) s += L(x, 7, x, 27, "#7E9A8C", 0.6); for (let y = 10; y < 28; y += 3.5) s += L(5, y, 59, y, "#7E9A8C", 0.5);
    s += E(18, 20, 8, 6, "#F4F4F0", { sw: 0.7, op: 0.85 }) + E(34, 21, 7, 5.5, "#F7F1C9", { sw: 0.7, op: 0.85 }) + E(48, 20, 7, 6, "#F4F4F0", { sw: 0.7, op: 0.85 });
    return s + R(20, 8, 24, 9, "#FFFFFF", { sw: 0.6 }) + T(32, 12, "ごみ", { size: 3.4, fill: "#2E7D5B" }) + T(32, 16, "しゅうせきじょ", { size: 2.8, fill: "#2E7D5B" }) + [0, 1, 2, 3].map((k) => Rn(46 + k * 3, 9, 2.4, 2.4, ["#E57373", "#64B5F6", "#FFD54F", "#81C784"][k])).join(""); });
def({ id: "prop.notice", name: "町内会の 掲示板", cat: "小物", w: 2, h: 1, prio: "A", details: ["木の 足 2本と 小さな屋根", "緑の フェルトの 面", "ポスター 4〜5枚（なつまつり・そうじの ひ など）と 画びょう"] },
  () => { let s = groundShadow(35, 28, 26, 3) + R(8, -8, 4, 36, "#7C5B45", { sw: 0.8 }) + R(52, -8, 4, 36, "#7C5B45", { sw: 0.8 }) + `<path d="M0,-30 L64,-30 L58,-38 L6,-38 Z" fill="#6B4A33" ${st(0.9)}/>` + R(3, -30, 58, 28, "#8C5E3B", { sw: 1 }) + Rn(6, -27, 52, 22, "#4E7A5A");
    const posters = [[8, -25, 13, 17, "#FFF3C4", "なつまつり"], [23, -24, 11, 14, "#FFFFFF", "そうじ"], [36, -26, 10, 12, "#D6EAF8", "おしらせ"], [47, -24, 9, 16, "#FADBD8", "ねこ"]];
    for (const [x, y, w, h, c, t] of posters) s += R(x, y, w, h, c, { sw: 0.5 }) + T(x + w / 2, y + 5, t, { size: 2.6, fill: INK, weight: 700 }) + L(x + 2, y + 8, x + w - 2, y + 8, "#B0A89A", 0.5) + L(x + 2, y + 10.5, x + w - 3, y + 10.5, "#B0A89A", 0.5) + C(x + w / 2, y + 1, 0.9, "#E53935", { sw: 0 });
    return s; });
def({ id: "prop.jizo", name: "お地蔵さんの ほこら", cat: "小物", w: 1, h: 1, prio: "A", interact: "おまいり（ひとこと）", details: ["木の 小さな ほこら（屋根・柱）", "石の お地蔵さん（赤い よだれかけ と ぼうし）", "花立て 2つ（花）と おそなえ（みかん）", "石の台"] },
  () => groundShadow(18, 29, 10, 2.5) + R(3, 22, 26, 7, "#B1AA9E", { sw: 0.8 }) + R(6, -6, 3, 28, "#8C5E3B", { sw: 0.6 }) + R(23, -6, 3, 28, "#8C5E3B", { sw: 0.6 }) + `<path d="M-1,-4 L16,-16 L33,-4 L30,-1 L2,-1 Z" fill="#6B4A33" ${st(1)}/>` + Rn(9, -1, 14, 23, "#5E4A3A", { op: 0.55 })
    + E(16, 18, 5.5, 5, "#B8B1A6", { sw: 0.8 }) + C(16, 7, 4.2, "#C4BDB2", { sw: 0.8 }) + `<path d="M11.5,4.5 Q16,-1.5 20.5,4.5 Z" fill="#D8433C" ${st(0.6)}/>` + `<path d="M11.5,12 L20.5,12 L16,17.5 Z" fill="#D8433C" ${st(0.6)}/>` + L(14.5, 7.5, 15.5, 7.5, INK, 0.6) + L(16.5, 7.5, 17.5, 7.5, INK, 0.6)
    + R(4.5, 16, 3, 6, "#7FA0A8", { sw: 0.4 }) + C(6, 14.5, 1.8, "#F7C948", { sw: 0.3 }) + R(24.5, 16, 3, 6, "#7FA0A8", { sw: 0.4 }) + C(26, 14.5, 1.8, "#F48FB1", { sw: 0.3 }) + C(16, 23.5, 1.9, "#F28C28", { sw: 0.4 }));
def({ id: "prop.wall", name: "へい（ブロック塀・フェンス・板塀）", cat: "小物", w: 1, h: 1, prio: "S", variants: ["kind: block（ブロック塀）／ fence（アルミの フェンス）／ wood（黒い 板塀）／ stone（石垣）", "dir: h（よこ）／ v（たて）", "len: 長さ（マス）"],
  details: ["住宅地の 家の まわりを かこむ（門の ところだけ あける）", "ブロック塀: 目地の もようと 上の笠石", "フェンス: 柱と たての細い格子", "板塀: 黒い板と 小さな屋根", "たて向きは 上面の 細い帯＋南の はしの 面"] },
  (o = {}) => { const len = o.len || 1, v = o.dir === "v", kind = o.kind || "block"; let s = "";
    const face = { block: "url(#p-block-wall)", stone: "url(#p-stone)", wood: "url(#p-wood)", fence: "none" }[kind], cap = { block: "#E4E0D8", stone: "#CFC8BB", wood: "#3E3531", fence: "#C9CDCE" }[kind];
    if (!v) { const W = len * P; s += Rn(2, 26, W, 4, "#1A1410", { op: 0.14 });
      if (kind === "fence") { s += L(0, 12, W, 12, "#A9AEB0", 1.6) + L(0, 25, W, 25, "#A9AEB0", 1.4); for (let x = 2; x < W; x += 3.2) s += L(x, 12, x, 25, "#B9BEC0", 0.8); for (let x = 0; x <= W; x += 16) s += R(x - 1, 9, 2.4, 18, "#8E9496", { sw: 0.5 }); }
      else { s += `<rect x="0" y="12" width="${W}" height="15" fill="${face}" ${st(1)}/>` + R(-0.5, 9, W + 1, 4, cap, { sw: 0.9 }); if (kind === "wood") s += `<path d="M-2,9 L${W + 2},9 L${W},6 L0,6 Z" fill="#3E3531" ${st(0.7)}/>`; } }
    else { const Hh = len * P; s += Rn(18, -12, 3, Hh + 12, "#1A1410", { op: 0.12 });
      if (kind === "fence") { s += L(15, -12, 15, Hh - 4, "#A9AEB0", 1.6); for (let y = -8; y < Hh; y += 16) s += R(13.8, y, 2.4, 14, "#8E9496", { sw: 0.4 }); }
      else { s += R(12, -14, 7, Hh + 2, cap, { sw: 0.9 }) + (o.endS !== false ? `<rect x="12" y="${Hh - 14}" width="7" height="14" fill="${face}" ${st(0.9)}/>` : ""); } }
    return s; });
def({ id: "prop.gatepost", name: "門柱（表札・インターホン）", cat: "小物", w: 1, h: 1, prio: "A", variants: ["表札の 名前（opts.name）", "色: タイル・石・白"], details: ["タイルばりの 柱", "表札（ひらがなの 名前）", "インターホンと 郵便受けの口", "上に 小さな あかり"] },
  (o = {}) => groundShadow(17, 28, 7, 2) + R(8, -8, 16, 36, o.c || "#D9C9AE", { sw: 1, rx: 1 }) + Rn(9.5, -6.5, 13, 3, "#EDE2CF") + R(10.5, -2, 11, 6, "#F7F4EE", { sw: 0.6 }) + T(16, 2.5, o.name || "たなか", { size: 3.4, fill: INK, weight: 700 }) + R(13, 7, 6, 7, "#5A6168", { sw: 0.5, rx: 1 }) + C(16, 11.5, 1, "#9CC7DC", { sw: 0 }) + R(10, 17, 12, 3, "#3A3A3A", { sw: 0.4 }) + E(16, -10, 4, 2.4, "#FFF3C4", { sw: 0.7 }));
def({ id: "prop.carport", name: "カーポート（車つき）", cat: "小物", w: 2, h: 2, prio: "A", variants: ["車の 色・向き（opts.car, opts.dir）"], details: ["半とうめいの 屋根（アルミの わく・ほね）", "うしろの 柱 2本（片がわ ささえ）", "下に とまった 車（屋根ごしに 見える）", "地面は コンクリート"] },
  (o = {}) => { let s = `<rect x="1" y="1" width="62" height="62" fill="url(#p-concrete)" opacity="0.95"/>` + `<g transform="translate(14,2)">` + REG["veh.car"].draw({ c: o.car || CAR_COLORS.silver, dir: o.dir || "n" }) + `</g>`;
    s += R(2, -28, 4, 30, "#B9BEC0", { sw: 0.8 }) + R(2, 26, 4, 32, "#B9BEC0", { sw: 0.8 }) + Rn(6, 56, 3, 3, "#1A1410", { op: 0.2 });
    s += `<rect x="0" y="-30" width="64" height="58" rx="2" fill="#DDEFF6" opacity="0.5" ${st(1.1)}/>`; for (let x = 10; x < 64; x += 10) s += L(x, -29, x, 27, "#C4D3D9", 0.8, { op: 0.8 });
    return s + L(0, -30, 64, -30, "#E9ECEE", 1.6) + L(0, 28, 64, 28, "#AEB4B7", 1.6); });
def({ id: "prop.laundry", name: "物干し（せんたくもの）", cat: "小物", w: 2, h: 1, prio: "A", details: ["T字の 物干し台 2本", "さお 2本", "シャツ・タオル・くつした・こどもの服（パステル）", "せんたくばさみ"] },
  () => { let s = groundShadow(34, 28, 26, 2.5) + R(3, 20, 8, 7, "#8E9496", { sw: 0.6 }) + R(53, 20, 8, 7, "#8E9496", { sw: 0.6 }) + L(7, 22, 7, -18, "#B9BEC0", 1.6) + L(57, 22, 57, -18, "#B9BEC0", 1.6) + L(2, -18, 12, -18, "#B9BEC0", 1.4) + L(52, -18, 62, -18, "#B9BEC0", 1.4) + L(3, -17, 61, -17, "#D5D9DB", 1.1) + L(11, -13, 53, -13, "#D5D9DB", 1.1);
    s += `<path d="M12,-17 L22,-17 L24,-12 L22,-11 L22,2 L12,2 L12,-11 L10,-12 Z" fill="#9FC7E8" ${st(0.7)}/>` + R(26, -17, 9, 16, "#F6B5C3", { sw: 0.6 }) + L(26, -3, 35, -3, "#FFFFFF", 0.8) + R(38, -13, 8, 11, "#FFE08A", { sw: 0.6 }) + `<path d="M48,-13 l2,0 l0,5 l2,1 l-1,2 l-3,-1 Z" fill="#FFFFFF" ${st(0.5)}/>`;
    return s + [13, 21, 27, 34, 39, 45].map((x) => Rn(x - 0.6, -18.5, 1.3, 2.6, "#E57373")).join(""); });
def({ id: "prop.pots", name: "植木ばち（あさがお・花）", cat: "小物", w: 1, h: 1, prio: "B", details: ["大小の 鉢 3つ（素焼き・青い鉢）", "あさがお（支柱に つる・むらさきの花）", "赤い ゼラニウム"] },
  () => groundShadow(18, 28, 11, 2.5) + `<path d="M3,18 L13,18 L12,27 L4,27 Z" fill="#B8754D" ${st(0.7)}/>` + L(8, 18, 8, -6, "#C9A36B", 0.8) + `<path d="M8,16 q-4,-4 0,-8 q4,-4 0,-8 q-3,-3 0,-6" stroke="#5E9E4E" stroke-width="1.2" fill="none"/>` + C(5, 6, 2.4, "#8E6CC8", { sw: 0.4 }) + C(11, 0, 2.2, "#5C8AD8", { sw: 0.4 }) + C(6, -4, 2, "#C774C9", { sw: 0.4 })
    + `<path d="M15,21 L24,21 L23,27 L16,27 Z" fill="#4F86B8" ${st(0.7)}/>` + C(19.5, 18, 4.2, "#5E9E4E", { sw: 0.7 }) + [0, 1, 2].map((k) => C(17.5 + k * 2, 16 + (k % 2), 1.4, "#E53935", { sw: 0.3 })).join("") + `<path d="M24,23 L30,23 L29.5,27 L24.5,27 Z" fill="#C98A5E" ${st(0.6)}/>` + C(27, 21, 2.6, "#7FB25E", { sw: 0.6 }));

// ================= 交通・駅まわり（追加） =================
def({ id: "prop.taxistand", name: "タクシーのりば の 標識", cat: "小物", w: 1, h: 1, prio: "A", details: ["高さ 2マス", "黄色い板に 黒い字『タクシー のりば』", "タクシーの 絵", "足もとの 台"] },
  () => groundShadow(17, 28, 5, 2) + L(16, 28, 16, -30, "#8E9396", 2.2) + R(4, -58, 24, 30, "#F2C14E", { sw: 1, rx: 2 }) + T(16, -49, "タクシー", { size: 5.2, fill: INK }) + T(16, -42.5, "のりば", { size: 5.2, fill: INK }) + R(9, -39, 14, 7, "#FFFFFF", { sw: 0.6, rx: 2 }) + R(12, -41, 8, 3, "#FFFFFF", { sw: 0.5, rx: 1 }) + C(12, -32, 1.3, INK, { sw: 0 }) + C(20, -32, 1.3, INK, { sw: 0 }) + R(12, 24, 8, 4, "#6E7479", { sw: 0.6 }));
def({ id: "prop.mapboard", name: "まちの 案内板（地図）", cat: "小物", w: 2, h: 1, prio: "S", interact: "見ると 地図が ひらく（将来）", details: ["2本足の 大きな板", "見出し『へいわだい まちの あんない』", "町の地図（道・公園・池・駅）", "赤い点『いま ここ』"] },
  () => { let s = groundShadow(35, 28, 26, 3) + R(8, -6, 4, 34, "#6E7479", { sw: 0.8 }) + R(52, -6, 4, 34, "#6E7479", { sw: 0.8 }) + R(2, -44, 60, 40, "#2F6F66", { sw: 1.1, rx: 2 }) + T(32, -38.5, "へいわだい まちの あんない", { size: 4.2 }) + R(5, -35, 54, 28, "#F7F3E8", { sw: 0.6 });
    s += Rn(7, -22, 50, 2.4, "#B9BFC3") + Rn(33, -34, 2.4, 26, "#B9BFC3") + `<path d="M36,-20 L56,-10" stroke="#B9BFC3" stroke-width="2.4"/>` + Rn(8, -18, 14, 9, "#A9D08B", { rx: 1 }) + E(13, -14, 3.5, 2.2, "#7FC6E3", { sw: 0 }) + Rn(22, -34, 22, 4, "#E8D6B8") + Rn(8, -34, 10, 8, "#D4C6A8");
    return s + C(30, -25, 2.2, "#E53935", { sw: 0.6 }) + T(30, -28.5, "いま ここ", { size: 2.8, fill: "#E53935" }); });
def({ id: "prop.bikerack", name: "駐輪ラック（自転車 4台）", cat: "小物", w: 3, h: 1, prio: "A", details: ["ひくい 金ぞくの ラック", "自転車 4台（色ちがい・かごつき）", "少しずつ ずらして 並べる"] },
  (o = {}) => { let s = groundShadow(50, 28, 44, 3) + L(4, 25, 92, 25, "#8E9496", 2) + L(4, 18, 92, 18, "#A9AEB0", 1.4); for (let x = 8; x < 92; x += 22) s += L(x, 18, x, 27, "#8E9496", 1.2);
    const cols = o.cols || ["#E53935", "#1E88E5", "#FFFFFF", "#43A047"]; cols.forEach((c, i) => { s += bike(6 + i * 22, 8, c, i % 2 === 0); }); return s; });
def({ id: "rail.pole", name: "架線柱（線路の 電柱）", cat: "線路", w: 1, h: 1, prio: "A", details: ["高さ 3マス", "鉄の 柱（H形の すじ）", "線路の上に のびる うで と がいし", "電線（架線）は 地図の上の層に 線で描く"] },
  () => groundShadow(17, 28, 5, 2) + R(13, -68, 6, 96, "#8C949A", { sw: 1 }) + L(16, -66, 16, 26, "#A9B1B6", 1.2) + L(16, -60, 34, -60, "#8C949A", 2.4) + L(16, -52, 30, -60, "#8C949A", 1.2) + C(26, -57, 1.6, "#F4F4F2", { sw: 0.5 }) + C(33, -57, 1.6, "#F4F4F2", { sw: 0.5 }) + R(11, 22, 10, 6, "#9A9488", { sw: 0.7 }));

// ================= 公園（追加） =================
def({ id: "park.fujidana", name: "藤棚（ベンチつき）", cat: "公園", w: 3, h: 2, prio: "S", interact: "すわって ひとやすみ（将来）", details: ["木の 柱 4本と 格子の たな（高さ 1.7マス。上に ずれて見える）", "むらさきの 藤の花房（上に のぞく花と 前の はしから たれる房）", "たなの上の 緑の葉", "下に ベンチ 2つ", "足もとに 花びら"], variants: ["春: 満開", "夏: 緑の葉だけ"] },
  () => { const W = 96, h = 54; let s = groundShadow(W / 2 + 8, 60, W / 2, 6);
    for (const x of [6, W - 11]) s += R(x, 4 - h, 5, h, "#7A5738", { sw: 0.8 });                                            // 奥の柱
    s += [0, 1].map((k) => { const x = 12 + k * 42; return R(x, 36, 30, 4, "#9A6B45", { sw: 0.8 }) + R(x, 41, 30, 4, "#A87A52", { sw: 0.8 }) + L(x + 3, 45, x + 3, 54, "#4E545A", 1.6) + L(x + 27, 45, x + 27, 54, "#4E545A", 1.6); }).join("");
    for (const x of [6, W - 11]) s += R(x, 60 - h, 5, h, "#8C6440", { sw: 0.9 }) + Rn(x + 1, 60 - h, 1.5, h, "#A67C57");        // 手前の柱
    const y0 = 2 - h, y1 = 62 - h;                                                                                           // たな（地面 2〜62 を 高さ h だけ 上へ）
    s += R(0, y0, W, 5, "#8C6440", { sw: 0.9 }) + R(0, y1 - 5, W, 5, "#8C6440", { sw: 0.9 }) + R(0, (y0 + y1) / 2 - 2, W, 4, "#8C6440", { sw: 0.7 });
    for (let x = 3; x < W; x += 7) s += R(x, y0 - 1, 2.6, y1 - y0 + 1, "#A07650", { sw: 0.4 });
    for (let i = 0; i < 18; i++) s += C(4 + hash(i, 31) * (W - 8), y0 + 3 + hash(i, 32) * (y1 - y0 - 8), 4 + hash(i, 33) * 3, i % 3 ? "#6AAE58" : "#86C06E", { sw: 0.5, op: 0.92 });
    for (let i = 0; i < 14; i++) s += C(6 + hash(i, 36) * (W - 12), y0 + 4 + hash(i, 37) * (y1 - y0 - 8), 2.2, i % 2 ? "#B58ED8" : "#9C74C8", { sw: 0.4 });
    for (let i = 0; i < 12; i++) { const x = 6 + i * 7.6, y = y1 - 1, len = 9 + hash(i, 35) * 7; s += `<path d="M${f(x - 3)},${f(y)} Q${f(x)},${f(y + len * 1.25)} ${f(x + 3)},${f(y)} Z" fill="${i % 2 ? "#B58ED8" : "#9C74C8"}" ${st(0.5)}/>` + C(x, y + 3, 1.1, "#E2CFF2", { sw: 0 }); }
    return s + [14, 30, 60, 78].map((x, i) => E(x, 57 + (i % 2) * 3, 1.6, 1, "#C9A9E6", { sw: 0 })).join(""); });
def({ id: "park.azumaya", name: "東屋（あずまや）", cat: "公園", w: 3, h: 3, prio: "A", details: ["四方に ひろがる 屋根（こげ茶の 板ぶき・棟に かざり）", "柱 4本", "下に 木の テーブルと ベンチ", "足もとは 石の ゆか"] },
  () => { const W = 96, H = 96; let s = groundShadow(W / 2 + 8, H - 6, W / 2, 7) + E(W / 2, H - 22, 40, 14, "#D8D1C4", { sw: 0.9 }) + E(W / 2, H - 22, 34, 11, "#E4DED3", { sw: 0 });
    s += R(W / 2 - 16, H - 36, 32, 12, "#A87A52", { sw: 0.9 }) + L(W / 2 - 12, H - 24, W / 2 - 12, H - 16, "#6B4A33", 1.6) + L(W / 2 + 12, H - 24, W / 2 + 12, H - 16, "#6B4A33", 1.6) + R(W / 2 - 30, H - 22, 12, 6, "#9A6B45", { sw: 0.7 }) + R(W / 2 + 18, H - 22, 12, 6, "#9A6B45", { sw: 0.7 });
    for (const x of [14, W - 19]) s += R(x, 30, 5, H - 44, "#7C5B45", { sw: 0.9 });
    s += `<path d="M-6,40 L${W / 2},-6 L${W + 6},40 Z" fill="url(#p-kawara-brown)" ${st(1.3)}/>` + `<path d="M-6,40 L${W / 2},-6 L${W + 6},40 Z" fill="#6B4A33" opacity="0.35"/>` + Rn(-6, 37, W + 12, 4, "#4A3526") + L(W / 2, -6, W / 2 - 16, 40, "#4A3526", 1) + L(W / 2, -6, W / 2 + 16, 40, "#4A3526", 1) + C(W / 2, -7, 3.2, "#C9A36B", { sw: 0.8 });
    return s; });
def({ id: "park.tetsubo", name: "鉄棒（3段）", cat: "公園", w: 3, h: 1, prio: "A", details: ["高さの ちがう 鉄棒 3つ", "柱は 青・黄・赤", "足もとの すりへった 砂"] },
  () => { let s = groundShadow(50, 28, 44, 3) + E(48, 26, 44, 4, "#D9C49A", { sw: 0, op: 0.8 }); const hs = [34, 26, 18], xs = [6, 34, 62, 90];
    for (let i = 0; i < 3; i++) s += L(xs[i] + 1, 24 - hs[i], xs[i + 1] - 1, 24 - hs[i], "#C9CFD2", 2.2); for (let i = 0; i < 4; i++) { const h = i === 0 ? hs[0] : i === 3 ? hs[2] : Math.max(hs[i - 1], hs[i]); s += R(xs[i] - 2, 24 - h - 2, 4, h + 4, ["#3B78C4", "#F2C14E", "#D8433C", "#3B78C4"][i], { sw: 0.8 }); } return s; });
def({ id: "park.spring", name: "スプリング遊具（どうぶつ）", cat: "公園", w: 1, h: 1, prio: "A", variants: ["zou（ぞう・水色）", "panda（パンダ）", "uma（うま・ピンク）"], anim: "のると ゆれる", details: ["太い ばね（灰色）", "どうぶつの 形の 座席と 取っ手", "足もとの 台"] },
  (o = {}) => { const k = o.kind || "zou"; let s = groundShadow(17, 28, 9, 2.5) + R(8, 24, 16, 4, "#9AA0A3", { sw: 0.6 }); for (let i = 0; i < 5; i++) s += E(16, 22 - i * 3, 5, 1.6, "none", { sw: 1.4, stroke: "#8E9496" });
    if (k === "panda") s += E(16, 4, 10, 7, "#FFFFFF", { sw: 1 }) + C(24, -2, 6, "#FFFFFF", { sw: 1 }) + C(21, -7, 2.2, "#2B2B2B", { sw: 0.5 }) + C(27.5, -7, 2.2, "#2B2B2B", { sw: 0.5 }) + E(22.5, -2, 1.6, 1.8, "#2B2B2B", { sw: 0 }) + E(26.5, -2, 1.6, 1.8, "#2B2B2B", { sw: 0 }) + E(10, 6, 3, 4, "#2B2B2B", { sw: 0 });
    else if (k === "uma") s += E(15, 4, 10, 6, "#F6A5C0", { sw: 1 }) + `<path d="M22,2 L26,-8 L30,-6 L27,4 Z" fill="#F6A5C0" ${st(1)}/>` + C(27, -6, 0.9, INK, { sw: 0 }) + `<path d="M24,-9 q-3,4 -2,9" stroke="#F2C14E" stroke-width="2" fill="none"/>`;
    else s += E(15, 4, 10, 7, "#8FC9E8", { sw: 1 }) + C(24, -1, 6, "#8FC9E8", { sw: 1 }) + E(20, -1, 3.5, 4.5, "#B5DCF0", { sw: 0.7 }) + `<path d="M29,1 q3,5 0,9" stroke="${INK}" stroke-width="1.2" fill="none"/>` + C(25.5, -3, 0.9, INK, { sw: 0 });
    return s + L(20, -4, 20, -9, "#E53935", 1.4) + L(18, -9, 22, -9, "#E53935", 1.4); });
def({ id: "park.seesaw", name: "シーソー", cat: "公園", w: 3, h: 1, prio: "A", anim: "2人で のると 上下する", details: ["黄色の 支点", "赤い 板（少し かたむく）", "T字の 取っ手 2つ", "両はしの 下に 古タイヤ"] },
  () => groundShadow(50, 28, 42, 3) + E(12, 25, 7, 3, "#3A3A3A", { sw: 0.8 }) + E(84, 25, 7, 3, "#3A3A3A", { sw: 0.8 }) + `<path d="M40,26 L48,10 L56,26 Z" fill="#F2C14E" ${st(1)}/>` + `<path d="M6,20 L90,6 L91,10 L7,24 Z" fill="#D8433C" ${st(1)}/>` + L(22, 18, 22, 10, "#8E9496", 1.6) + L(19, 10, 25, 10, "#8E9496", 1.6) + L(74, 9, 74, 1, "#8E9496", 1.6) + L(71, 1, 77, 1, "#8E9496", 1.6));
def({ id: "park.tires", name: "タイヤの 遊具（半分 うまった タイヤ）", cat: "公園", w: 3, h: 1, prio: "B", details: ["色をぬった 古タイヤ 5本", "半分 地面に うまる", "とびうつって あそぶ"] },
  () => { let s = groundShadow(50, 28, 44, 3); [0, 1, 2, 3, 4].forEach((i) => { const x = 10 + i * 19, c = ["#E53935", "#F2C14E", "#43A047", "#1E88E5", "#F48FB1"][i]; s += `<path d="M${x - 8},26 A8,8 0 0,1 ${x + 8},26 Z" fill="${c}" ${st(1)}/>` + `<path d="M${x - 3.5},26 A3.5,3.5 0 0,1 ${x + 3.5},26 Z" fill="#6E5B45" ${st(0.6)}/>`; }); return s; });
def({ id: "park.sign", name: "公園の 看板", cat: "公園", w: 2, h: 1, prio: "A", details: ["木の 板と 柱 2本", "『さつき こうえん』", "小さな 公園の地図と ルールの 絵（ボールあそび・たき火 禁止）"] },
  (o = {}) => { let s = groundShadow(35, 28, 24, 3) + R(10, -4, 4, 32, "#7C5B45", { sw: 0.8 }) + R(50, -4, 4, 32, "#7C5B45", { sw: 0.8 }) + R(4, -34, 56, 32, "#A87A52", { sw: 1.1, rx: 2 }) + Rn(7, -31, 50, 26, "#F4EAD6") + T(32, -24.5, o.name || "さつき こうえん", { size: 5.5, fill: "#3F6E3A" });
    s += Rn(9, -20, 24, 13, "#A9D08B", { rx: 1 }) + E(16, -14, 4, 2.4, "#7FC6E3", { sw: 0 }) + Rn(9, -14, 24, 1.6, "#DCC49B") + C(41, -14, 4.6, "#FFFFFF", { sw: 0.8, stroke: "#E53935" }) + L(38, -17, 44, -11, "#E53935", 1) + C(41, -14, 1.8, "#8E6C4E", { sw: 0 }) + C(52, -14, 4.6, "#FFFFFF", { sw: 0.8, stroke: "#E53935" }) + L(49, -17, 55, -11, "#E53935", 1) + `<path d="M50,-12 q2,-5 4,0 Z" fill="#F28C28"/>`;
    return s; });
def({ id: "park.ubollard", name: "U字の 車止め（公園の 入口）", cat: "公園", w: 1, h: 1, pass: true, prio: "A", details: ["灰色の U字の パイプ 2つ", "黄色と 黒の しま（反射）", "人は 通れる・車は 入れない"] },
  () => { let s = groundShadow(17, 28, 12, 2.5); for (const x of [4, 17]) s += `<path d="M${x},27 L${x},14 Q${x},8 ${x + 5.5},8 Q${x + 11},8 ${x + 11},14 L${x + 11},27" stroke="${INK}" stroke-width="3.4" fill="none"/>` + `<path d="M${x},27 L${x},14 Q${x},8 ${x + 5.5},8 Q${x + 11},8 ${x + 11},14 L${x + 11},27" stroke="#C9CFD2" stroke-width="2" fill="none"/>` + L(x - 0.5, 16, x + 0.5, 16, "#F2C14E", 2) + L(x + 10.5, 16, x + 11.5, 16, "#F2C14E", 2); return s; });
def({ id: "prop.pigeons", name: "ハト（地面を つつく）", cat: "小物", w: 1, h: 1, pass: true, prio: "B", anim: "近づくと 飛んでいく", details: ["灰色の からだ・首の 緑むらさき", "2〜3羽", "駅前広場・公園に"] },
  (o = {}) => { let s = ""; const sd = o.seed || 1; for (let i = 0; i < 3; i++) { const x = 6 + hash(i, sd) * 20, y = 12 + hash(i, sd + 4) * 12, fl = hash(i, sd + 8) < 0.5 ? -1 : 1; s += `<g transform="translate(${f(x)},${f(y)}) scale(${fl},1)">` + E(0, 6.5, 5, 1.4, "#1A1410", { sw: 0, op: 0.15 }) + E(0, 2, 5, 3.4, "#9AA3AD", { sw: 0.8 }) + `<path d="M-2,0 L-7,-1 L-4,3 Z" fill="#7E8791" ${st(0.6)}/>` + C(3.6, -1.6, 2.2, "#8E97A2", { sw: 0.7 }) + C(4.3, -2.1, 0.5, INK, { sw: 0 }) + `<path d="M5.6,-1.4 l1.6,0.5 l-1.6,0.5 Z" fill="#F2A65A"/>` + Rn(2, -0.2, 2.6, 1.4, "#7FA89A", { op: 0.8 }) + L(-0.6, 5, -0.6, 6.6, "#E57373", 0.7) + L(1, 5, 1, 6.6, "#E57373", 0.7) + `</g>`; } return s; });
def({ id: "prop.guidesign", name: "道の 案内標識（青い 看板）", cat: "小物", w: 1, h: 1, prio: "A", variants: ["lines: 行き先と 矢印（2〜3行）"], details: ["高さ 3.2マス", "青い板に 白い字と 矢印（本物の 案内標識と 同じ色）", "白い ふち", "灰色の 柱と 腕"] },
  (o = {}) => { const lines = o.lines || [["↑", "へいわだい えき"], ["↓", "くうこう"]], bw = 70, bh = 12 + lines.length * 13; let s = groundShadow(18, 28, 5, 2) + R(13, -86, 6, 114, "#9AA0A3", { sw: 1 }) + L(15, -84, 15, 26, "#C3C8CA", 1.2) + R(10, 22, 12, 6, "#8E9496", { sw: 0.7 });
    s += R(16 - bw / 2, -104, bw, bh, "#1D5FAF", { sw: 1.2, rx: 2 }) + R(16 - bw / 2 + 2.5, -101.5, bw - 5, bh - 5, "none", { sw: 1, stroke: "#FFFFFF" });
    lines.forEach(([ar, t], i) => { s += T(16 - bw / 2 + 11, -104 + 15 + i * 13, ar, { size: 10, fill: "#FFFFFF" }) + T(16 - bw / 2 + 20, -104 + 14.5 + i * 13, t, { size: 8, fill: "#FFFFFF", anchor: "start" }); });
    return s; });
