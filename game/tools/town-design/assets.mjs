// 平和台のアセット集（見本）。1マス=32px、光は左上から、影は右下へ。
// ここの見た目と「必須の細部」を、Codex がゲームの絵（WorldArt / Tiles / Art）として作る時の基準にする。
import { P, INK, f, shade, hash, st, R, Rn, C, E, Pth, L, T, shadowBox, groundShadow } from "./lib.mjs";
export const REG = {};
const def = (meta, draw) => { REG[meta.id] = { pass: false, variants: [], anim: "", interact: "", prio: "B", ...meta, draw }; };

// ================= 建物の部品 =================
const glass = (x, y, w, h) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#A8D3E6"/><path d="M${f(x)},${f(y + h * 0.75)} L${f(x + w * 0.6)},${f(y)} L${f(x + w * 0.85)},${f(y)} L${f(x + w * 0.15)},${f(y + h)} L${f(x)},${f(y + h)} Z" fill="#DDF1FA" opacity="0.8"/>`;
function win(x, y, w, h, o = {}) {
  let s = "";
  if (o.shutter) s += R(x - 1, y - 4, w + 2, 4, "#C9C3B8", { sw: 0.8 });            // 雨戸の戸袋
  s += R(x - 1, y - 1, w + 2, h + 2, o.frame || "#F7F5EF", { sw: 0.9 });
  s += glass(x, y, w, h);
  if (o.curtain) s += Rn(x, y, w * 0.28, h, o.curtain, { op: 0.9 }) + Rn(x + w * 0.72, y, w * 0.28, h, o.curtain, { op: 0.9 });
  if (o.grid !== false) s += L(x + w / 2, y, x + w / 2, y + h, o.frame || "#F7F5EF", 1.1) + (h > 10 ? L(x, y + h / 2, x + w, y + h / 2, o.frame || "#F7F5EF", 0.9) : "");
  s += R(x - 1.5, y + h + 1, w + 3, 1.8, "#D8D3C9", { sw: 0.6 });                       // 窓台
  if (o.plant) s += R(x, y + h + 2.6, w, 3, "#9C6B45", { sw: 0.6 }) + [0.2, 0.5, 0.8].map((k, i) => C(x + w * k, y + h + 2, 1.8, ["#E76F8B", "#F4C542", "#E9EDF2"][i], { sw: 0.4 })).join("");
  return s;
}
const doorWood = (x, y, w, h, c = "#8C5A36") => R(x, y, w, h, c, { sw: 1 }) + R(x + 1.5, y + 1.5, w - 3, h * 0.45, shade(c, 0.15), { sw: 0.5 }) + C(x + w - 2.5, y + h * 0.55, 0.9, "#E8C35A", { sw: 0.3 }) + R(x - 1.5, y + h, w + 3, 2, "#BDB7AC", { sw: 0.6 });
const doorAuto = (x, y, w, h) => R(x, y, w, h, "#6E7C86", { sw: 1 }) + glass(x + 1.2, y + 1.2, w / 2 - 1.8, h - 2.4) + glass(x + w / 2 + 0.6, y + 1.2, w / 2 - 1.8, h - 2.4) + L(x + w / 2, y + 1, x + w / 2, y + h - 1, "#56636C", 1.2) + R(x - 2, y + h, w + 4, 2, "#9FA6A8", { sw: 0.5 });
const doorLattice = (x, y, w, h, c = "#7A5236") => { let s = R(x, y, w, h, "#F1E6CF", { sw: 1 }); for (let xx = x + 2; xx < x + w - 1; xx += 2.6) s += L(xx, y + 1, xx, y + h - 1, c, 0.9); for (let yy = y + 3; yy < y + h - 1; yy += 4) s += L(x + 1, yy, x + w - 1, yy, c, 0.7); return s + L(x + w / 2, y, x + w / 2, y + h, c, 1.4) + R(x - 1.5, y + h, w + 3, 2, "#BDB7AC", { sw: 0.6 }); };
const awning = (x, y, w, h, c1, c2 = "#FFFFFF") => {
  const n = Math.max(3, Math.round(w / 6)), sw = w / n;
  let s = `<path d="M${f(x)},${f(y + h)} L${f(x + w)},${f(y + h)} L${f(x + w + 3)},${f(y + h + 5)} L${f(x + 3)},${f(y + h + 5)} Z" fill="#1A1410" opacity="0.15"/>`;
  for (let i = 0; i < n; i++) s += Rn(x + i * sw, y, sw + 0.3, h, i % 2 ? c2 : c1);
  s += R(x, y, w, h, "none", { sw: 1 });
  for (let i = 0; i < n; i++) s += `<path d="M${f(x + i * sw)},${f(y + h)} q${f(sw / 2)},3.4 ${f(sw)},0 Z" fill="${i % 2 ? c2 : c1}" ${st(0.8)}/>`;
  return s + L(x, y + 1.4, x + w, y + 1.4, "#FFFFFF", 0.8, { op: 0.5 });
};
const signBand = (x, y, w, h, text, bg, fg = "#FFFFFF", size) => R(x, y, w, h, bg, { sw: 1, rx: 1.2 }) + L(x + 1, y + 1.3, x + w - 1, y + 1.3, "#FFFFFF", 0.7, { op: 0.35 }) + T(x + w / 2, y + h / 2 + (size || h * 0.62) * 0.36, text, { size: size || h * 0.62, fill: fg });
const ac = (x, y) => R(x, y, 9, 6.5, "#EEEDEA", { sw: 0.8, rx: 0.8 }) + C(x + 3.3, y + 3.3, 2.3, "#D5D3CE", { sw: 0.5 }) + L(x + 6.4, y + 1.5, x + 6.4, y + 5, "#B8B5AE", 0.6) + L(x + 7.6, y + 1.5, x + 7.6, y + 5, "#B8B5AE", 0.6);
const downspout = (x, y1, y2) => L(x, y1, x, y2, "#9AA0A3", 1.8) + L(x, y1, x, y2, "#C9CED0", 0.6);
const meter = (x, y) => R(x, y, 4, 5, "#E7E5E0", { sw: 0.6 }) + C(x + 2, y + 2.2, 1.2, "#B4C9D3", { sw: 0.3 });
const pot = (x, y, c = "#6DAE5B") => `<path d="M${f(x)},${f(y)} L${f(x + 6)},${f(y)} L${f(x + 5)},${f(y + 5)} L${f(x + 1)},${f(y + 5)} Z" fill="#B8754D" ${st(0.7)}/>` + C(x + 3, y - 1.8, 3.4, c, { sw: 0.7 }) + C(x + 2, y - 2.8, 1.2, shade(c, 0.3), { sw: 0 });
const foundation = (W, H) => Rn(2, H - 4, W - 4, 4, "#A9A39A") + L(2, H - 4, W - 2, H - 4, "#8E887F", 0.8);
// 屋根（切妻・瓦 / 金属）: 軒の出 2px、けらば、棟、軒先の影
function pitchedRoof(W, rh, pat, color, o = {}) {
  const ov = 3;
  let s = `<path d="M${-ov},${rh} L${4},${2} L${W - 4},${2} L${W + ov},${rh} Z" fill="url(#${pat})" ${st(1.3)}/>`;
  s += `<path d="M${-ov},${rh} L${4},${2} L${W - 4},${2} L${W + ov},${rh} Z" fill="${color}" opacity="0.18"/>`;
  s += Rn(-ov, rh - 3, W + ov * 2, 3, shade(color, -0.35), { op: 0.9 });            // 軒先
  s += L(4, 2, W - 4, 2, shade(color, 0.35), 2.2) + L(4, 2, W - 4, 2, INK, 0.6);       // 棟
  s += L(-ov, rh, 4, 2, INK, 1.3) + L(W + ov, rh, W - 4, 2, INK, 1.3);
  if (o.hip) s += L(4, 2, W * 0.18, rh - 3, shade(color, -0.3), 1) + L(W - 4, 2, W * 0.82, rh - 3, shade(color, -0.3), 1);
  return s;
}
function flatRoof(W, rh, color = "#B9BDBF", o = {}) {
  let s = R(0, 0, W, rh, shade(color, 0.15), { sw: 1.3 }) + R(2.5, 2.5, W - 5, rh - 5, color, { sw: 0.8, stroke: shade(color, -0.3) });
  for (let i = 0; i < 6; i++) s += Rn(4 + hash(i, W) * (W - 12), 4 + hash(i, rh) * (rh - 10), 6, 1, shade(color, -0.12), { op: 0.6 });
  (o.items || []).forEach(([k, x, y]) => {
    if (k === "ac") s += R(x, y, 10, 7, "#E9E8E4", { sw: 0.8 }) + C(x + 5, y + 3.5, 2.6, "#CFCDC7", { sw: 0.5 });
    if (k === "tank") s += R(x, y, 12, 9, "#9EB6C4", { sw: 0.9, rx: 2 }) + L(x + 2, y + 3, x + 10, y + 3, "#C8D8E1", 1);
    if (k === "antenna") s += L(x, y + 8, x, y - 6, "#8A8F92", 1) + L(x - 4, y - 3, x + 4, y - 3, "#8A8F92", 0.9) + L(x - 3, y, x + 3, y, "#8A8F92", 0.9);
    if (k === "solar") { s += R(x, y, 16, 9, "#34506E", { sw: 0.8 }); for (let i = 1; i < 4; i++) s += L(x + i * 4, y, x + i * 4, y + 9, "#5C7C9C", 0.6); s += L(x, y + 4.5, x + 16, y + 4.5, "#5C7C9C", 0.6); }
    if (k === "vent") s += R(x, y, 6, 6, "#C9CCCC", { sw: 0.7 }) + L(x + 1, y + 2, x + 5, y + 2, "#9DA2A3", 0.6) + L(x + 1, y + 4, x + 5, y + 4, "#9DA2A3", 0.6);
  });
  return s;
}
const castShadow = (W, H, d = 14) => `<path d="M${W},${6} L${W + d},${6 + d * 0.5} L${W + d},${H + d * 0.35} L${d * 0.6},${H + d * 0.35} L${2},${H} L${W},${H} Z" fill="#1A1410" opacity="0.16"/>`;

// ================= 建物 =================
def({ id: "bld.station", name: "平和台駅（駅舎）", cat: "建物", w: 16, h: 5, prio: "S", interact: "入口で乗り物メニュー（でんしゃ）",
  details: ["大きなガラスの入口（自動ドア2組）", "駅名の看板『平和台駅 HEIWADAI』", "丸い時計", "入口の上のひさし（金属・影つき）", "陸屋根に設備（室外機・通気口）", "右に切符売り場の窓、左に駅員室の窓", "入口前に点字ブロック"], variants: ["夜は窓と看板が光る"] },
  () => { const W = 16 * P, H = 5 * P, rh = 44; let s = castShadow(W, H, 18) + flatRoof(W, rh, "#AEB6BA", { items: [["ac", 40, 12], ["ac", 56, 12], ["vent", 300, 14], ["vent", 312, 14], ["tank", 430, 10], ["antenna", 470, 18]] });
    s += R(0, rh - 2, W, H - rh - 2, "#EEF1F0", { sw: 1.3 }); // 壁
    for (let x = 6; x < W - 10; x += 28) s += R(x, rh + 4, 20, 26, "#DDE3E3", { sw: 0.6 }) + glass(x + 2, rh + 6, 16, 22);
    s += R(W / 2 - 70, rh + 1, 140, 14, "#2F6F66", { sw: 1, rx: 2 }) + T(W / 2 - 22, rh + 11.5, "平和台駅", { size: 11 }) + T(W / 2 + 36, rh + 11, "HEIWADAI", { size: 7, weight: 700 });
    s += C(W / 2 + 64, rh + 8, 6, "#FFFFFF", { sw: 1 }) + L(W / 2 + 64, rh + 8, W / 2 + 64, rh + 4.5, INK, 0.9) + L(W / 2 + 64, rh + 8, W / 2 + 67, rh + 8, INK, 0.9);
    s += `<path d="M${W / 2 - 80},${rh + 38} L${W / 2 + 80},${rh + 38} L${W / 2 + 86},${rh + 46} L${W / 2 - 86},${rh + 46} Z" fill="#8E9AA0" ${st(1)}/>` + Rn(W / 2 - 86, rh + 46, 172, 3, "#1A1410", { op: 0.18 });
    s += doorAuto(W / 2 - 44, rh + 52, 40, H - rh - 58) + doorAuto(W / 2 + 4, rh + 52, 40, H - rh - 58);
    s += R(18, rh + 50, 60, 36, "#DDE3E3", { sw: 0.8 }) + glass(21, rh + 53, 54, 22) + T(48, rh + 84, "きっぷうりば", { size: 6.5, fill: "#2F6F66", weight: 700 });
    s += R(W - 80, rh + 50, 60, 36, "#DDE3E3", { sw: 0.8 }) + glass(W - 77, rh + 53, 54, 22) + T(W - 50, rh + 84, "えきいん", { size: 6.5, fill: "#2F6F66", weight: 700 });
    return s + foundation(W, H); });
def({ id: "bld.supermarket", name: "えきまえ マーケット（スーパー）", cat: "建物", w: 10, h: 5, prio: "S", interact: "入口で お買い物（たべもの・どうぐ）",
  details: ["緑の看板帯に店名", "ガラスの自動ドア＋ポスター（セール・たまご特売）", "陸屋根に室外機", "入口横に カート置き場", "店先に 野菜・花の特売台"] },
  () => { const W = 10 * P, H = 5 * P, rh = 42; let s = castShadow(W, H) + flatRoof(W, rh, "#B7BCBC", { items: [["ac", 20, 10], ["ac", 36, 10], ["ac", 52, 10], ["vent", 250, 16]] });
    s += R(0, rh - 2, W, H - rh - 2, "#FBF7EE", { sw: 1.3 }) + signBand(4, rh + 1, W - 8, 16, "えきまえ マーケット", "#3E9A6E");
    for (let x = 10; x < W - 20; x += 36) if (Math.abs(x + 14 - W / 2) > 30) s += R(x, rh + 24, 28, 34, "#E3E6E4", { sw: 0.7 }) + glass(x + 2, rh + 26, 24, 30);
    s += R(22, rh + 30, 14, 10, "#E8433C", { sw: 0.5 }) + T(29, rh + 37.5, "セール", { size: 4.5 }) + R(240, rh + 30, 16, 10, "#F2B43A", { sw: 0.5 }) + T(248, rh + 37.5, "とくばい", { size: 4 });
    s += doorAuto(W / 2 - 20, rh + 22, 40, H - rh - 28);
    for (let i = 0; i < 3; i++) s += R(W / 2 + 28 + i * 3, H - 16, 12, 10, "none", { sw: 0.9, stroke: "#8E9BA3" }) + L(W / 2 + 28 + i * 3, H - 6, W / 2 + 40 + i * 3, H - 6, "#8E9BA3", 1);
    s += R(18, H - 14, 26, 8, "#B88A5C", { sw: 0.8 }) + [0, 1, 2, 3, 4].map((i) => C(22 + i * 4.5, H - 15, 2.2, ["#F28C28", "#7CB342", "#E53935", "#FBC02D", "#7CB342"][i], { sw: 0.4 })).join("");
    return s + foundation(W, H); });
def({ id: "bld.mansion", name: "へいわだい マンション（5かい）", cat: "建物", w: 11, h: 6, prio: "A", interact: "なし（背景）",
  details: ["5階ぶんの ベランダ（手すり・物干し・植木）", "各階に室外機", "屋上に 高置水槽・アンテナ", "1階 エントランス（ひさし・自動ドア・マンション名）", "郵便受けの列", "外壁は タイル"] },
  () => { const W = 11 * P, H = 6 * P, rh = 26; let s = castShadow(W, H, 22) + flatRoof(W, rh, "#B3B7B6", { items: [["tank", 30, 6], ["antenna", 320, 12], ["vent", 150, 8]] });
    s += `<rect x="0" y="${rh - 2}" width="${W}" height="${H - rh - 2}" fill="url(#p-tile-wall)" ${st(1.3)}/>`;
    const fl = 5, fh = (H - rh - 40) / (fl - 1);
    for (let k = 0; k < fl - 1; k++) { const y = rh + 4 + k * fh; for (let u = 0; u < 5; u++) { const x = 8 + u * 68; s += win(x + 4, y + 2, 24, fh - 14, { curtain: ["#F3D1A6", "#C9DDEE", "#F2C4CE", "#E2E6C8", "#F3D1A6"][(u + k) % 5] }) + ac(x + 42, y + fh - 17); s += R(x, y + fh - 10, 62, 7, "#E9E4DA", { sw: 0.8 }) + L(x, y + fh - 7, x + 62, y + fh - 7, "#BDB6AA", 0.6); if ((u + k) % 3 === 0) s += L(x + 34, y + 3, x + 58, y + 3, "#9A9A9A", 0.6) + Rn(x + 36, y + 3, 6, 7, "#9FC7E8") + Rn(x + 46, y + 3, 5, 6, "#F6B5C3"); } }
    s += R(W / 2 - 34, H - 40, 68, 5, "#8D9498", { sw: 0.9 }) + doorAuto(W / 2 - 16, H - 34, 32, 28) + signBand(W / 2 - 30, H - 50, 60, 9, "ハイツ へいわだい", "#6E6457", "#FFF", 6);
    for (let i = 0; i < 6; i++) s += R(24 + i * 7, H - 26, 6, 5, "#C0C4C6", { sw: 0.5 });
    s += pot(W / 2 - 30, H - 9) + pot(W / 2 + 24, H - 9);
    return s + foundation(W, H); });
def({ id: "bld.office", name: "オフィスビル（ガラス張り）", cat: "建物", w: 9, h: 6, prio: "A", interact: "なし（背景）",
  details: ["ガラスのカーテンウォール（縦の方立て・空の映りこみ）", "屋上に 設備と 手すり", "1階ロビー（明るい照明・受付）", "会社名のサイン（小さく）"] },
  () => { const W = 9 * P, H = 6 * P, rh = 22; let s = castShadow(W, H, 22) + flatRoof(W, rh, "#A9B3B8", { items: [["ac", 20, 6], ["ac", 36, 6], ["vent", 200, 8], ["vent", 212, 8]] });
    s += R(0, rh - 2, W, H - rh - 2, "#7A95A8", { sw: 1.3 });
    for (let x = 4; x < W - 6; x += 14) { s += `<rect x="${x}" y="${rh + 2}" width="12" height="${H - rh - 40}" fill="#9CC3D9"/>`; }
    s += `<path d="M4,${rh + 60} L${W - 6},${rh + 20} L${W - 6},${rh + 44} L4,${rh + 84} Z" fill="#E4F4FB" opacity="0.45"/>`;
    for (let y = rh + 2; y < H - 38; y += 26) s += L(2, y, W - 2, y, "#5F7A8C", 1.2);
    s += R(0, H - 38, W, 34, "#5D6F7C", { sw: 1 }) + glass(12, H - 34, W - 24, 26) + doorAuto(W / 2 - 16, H - 34, 32, 28) + T(W - 40, H - 42, "HEIWA  CO.", { size: 5.5, fill: "#EAF3F8", weight: 700 });
    return s + foundation(W, H); });
def({ id: "bld.koban", name: "交番", cat: "建物", w: 4, h: 4, prio: "A", interact: "おまわりさんと会話（道案内）",
  details: ["白い箱型に 紺の屋根", "入口の上の 赤い灯（夜に光る）", "『交番 KOBAN』の看板と 金色の記章", "入口横に 地図の掲示板・白い自転車"] },
  () => { const W = 4 * P, H = 4 * P, rh = 36; let s = castShadow(W, H) + `<path d="M-2,${rh} L6,4 L${W - 6},4 L${W + 2},${rh} Z" fill="url(#p-slate)" ${st(1.3)}/>` + Rn(-2, rh - 3, W + 4, 3, "#394349");
    s += R(2, rh - 2, W - 4, H - rh - 2, "#F7F7F4", { sw: 1.3 }) + signBand(W / 2 - 30, rh + 2, 60, 12, "交番 KOBAN", "#243E6B", "#FFFFFF", 7) + C(W / 2, rh - 5, 3.2, "#E53935", { sw: 0.8 }) + C(W / 2, rh - 5, 1.4, "#FFB3B0", { sw: 0 });
    s += C(W / 2 + 38, rh + 8, 4, "#E8C35A", { sw: 0.7 }) + doorAuto(W / 2 - 13, rh + 22, 26, H - rh - 28) + R(8, rh + 22, 20, 24, "#FFFFFF", { sw: 0.8 }) + L(10, rh + 28, 26, rh + 28, "#B0B6BC", 0.8) + L(10, rh + 33, 24, rh + 33, "#B0B6BC", 0.8) + L(10, rh + 38, 22, rh + 38, "#B0B6BC", 0.8);
    s += win(W - 26, rh + 22, 16, 14, {}) + foundation(W, H); return s; });
def({ id: "bld.shrine", name: "へいわだい じんじゃ（拝殿）", cat: "建物", w: 6, h: 4, prio: "S", interact: "おまいり（お賽銭・鈴）",
  details: ["反りのある屋根（銅板の緑）＋ 千木・かつお木", "白木の柱と 格子戸", "しめなわと 紙垂", "賽銭箱と 鈴の緒", "石の基壇と 階段"] },
  () => { const W = 6 * P, H = 4 * P, rh = 60; let s = castShadow(W, H, 16);
    s += `<path d="M-10,${rh} Q${W / 2},${rh - 16} ${W + 10},${rh} L${W - 16},10 Q${W / 2},4 16,10 Z" fill="#6E9C8A" ${st(1.4)}/><path d="M-10,${rh} Q${W / 2},${rh - 16} ${W + 10},${rh}" stroke="#3F6457" stroke-width="3" fill="none"/>`;
    for (let x = 22; x < W - 20; x += 8) s += L(x, 12, x - (x - W / 2) * 0.12, rh - 9, "#5E8A79", 0.8);
    s += L(18, 10, W - 18, 10, "#3F6457", 3) + L(12, 3, 22, 13, "#6B4A33", 2.2) + L(W - 12, 3, W - 22, 13, "#6B4A33", 2.2) + [0.35, 0.5, 0.65].map((k) => E(W * k, 7, 5, 2.2, "#C9A36B", { sw: 0.7 })).join("");
    s += R(6, rh - 2, W - 12, H - rh - 10, "#F1E4CC", { sw: 1.3 });
    for (const x of [10, W - 16]) s += R(x, rh - 2, 6, H - rh - 10, "#D9B98E", { sw: 0.9 });
    s += doorLattice(34, rh + 10, 50, H - rh - 22, "#8A5A34") + doorLattice(W - 84, rh + 10, 50, H - rh - 22, "#8A5A34");
    s += `<path d="M20,${rh + 4} Q${W / 2},${rh + 14} ${W - 20},${rh + 4}" stroke="#E4D2A4" stroke-width="4" fill="none"/>` + [0.3, 0.5, 0.7].map((k) => `<path d="M${W * k},${rh + 9} l2,4 l-3,3 l3,4" stroke="#FFFFFF" stroke-width="1.6" fill="none"/>`).join("");
    s += L(W / 2, rh + 6, W / 2, rh + 36, "#D6433A", 2) + C(W / 2, rh + 8, 3, "#E6C04A", { sw: 0.7 }) + R(W / 2 - 14, H - 22, 28, 10, "#7A5236", { sw: 0.9 }) + L(W / 2 - 12, H - 18, W / 2 + 12, H - 18, "#5E3F28", 0.8) + T(W / 2, H - 14, "奉納", { size: 5, fill: "#F2E3C0" });
    s += R(-2, H - 10, W + 4, 10, "#BDB5A7", { sw: 1 }) + R(W / 2 - 18, H - 6, 36, 6, "#CFC8BB", { sw: 0.8 }); return s; });
def({ id: "bld.shop.greengrocer", name: "やおや（商店街の店）", cat: "建物", w: 4, h: 3, prio: "S", interact: "立ち寄りの会話",
  details: ["2階建て（2階の窓・物干し）", "緑と白の しましま日よけ", "ななめの台に 野菜のかご（トマト・キャベツ・にんじん・なす）と 値札", "手書き風の看板『やおや』"], variants: ["パン屋・花屋・本屋・食堂・喫茶・和菓子・家具 と 同じ骨組みで 店ごとに 看板と 店先の品物を 変える"] },
  () => shopFront({ roofPat: "p-kawara-gray", roofC: "#6F7780", wall: "#FBF6EA", sign: "やおや", signBg: "#3F8F4E", aw: ["#58A55C", "#FFFFFF"], goods: "veg" }));
def({ id: "bld.shop.bakery", name: "こみちの パンや", cat: "建物", w: 4, h: 3, prio: "S", interact: "おてつだい（パンやさん）", details: ["木の外壁（茶）", "ガラスのショーケースに パンが並ぶ", "麦の穂の 吊り看板", "店先に 黒板の立て看板"] },
  () => shopFront({ roofPat: "p-kawara-brown", roofC: "#8B5E48", wall: "url(#p-wood)", sign: "パン", signBg: "#8A5A34", aw: ["#E7B76A", "#FFF4DC"], goods: "bread" }));
def({ id: "bld.shop.florist", name: "はなや", cat: "建物", w: 3, h: 3, prio: "A", interact: "立ち寄りの会話", details: ["ピンクの日よけ", "店先に バケツの花（3段の台）", "つり鉢", "白い外壁"] },
  () => shopFront({ w: 3, roofPat: "p-kawara-gray", roofC: "#7A838C", wall: "#FFF7F8", sign: "はなや", signBg: "#D9607E", aw: ["#F29BB2", "#FFFFFF"], goods: "flower" }));
def({ id: "bld.shop.books", name: "ほんや", cat: "建物", w: 4, h: 3, prio: "A", interact: "立ち寄りの会話", details: ["紺の日よけ", "店先に 雑誌のラック・本の平台", "ガラス戸に ポスター"] },
  () => shopFront({ roofPat: "p-slate", roofC: "#5F6A72", wall: "#F4F0E6", sign: "ほん", signBg: "#34487A", aw: ["#4C63A0", "#E8ECF6"], goods: "books" }));
def({ id: "bld.shop.diner", name: "ファミリー キッチン（食堂）", cat: "建物", w: 4, h: 3, prio: "S", interact: "おてつだい（クレープやさん）", details: ["オレンジの日よけ", "食品サンプルの ショーケース", "メニューの立て看板", "のれん"] },
  () => shopFront({ roofPat: "p-kawara-brown", roofC: "#9A6B55", wall: "#FFF3E4", sign: "キッチン", signBg: "#D9703C", aw: ["#F29E5F", "#FFF3E4"], goods: "sample" }));
def({ id: "bld.shop.cafe", name: "きっさ ひだまり（喫茶店）", cat: "建物", w: 3, h: 3, prio: "A", interact: "立ち寄りの会話", details: ["レンガの外壁", "丸い窓・木の扉", "つり看板（コーヒーカップ）", "店先に 小さなテラス席"] },
  () => shopFront({ w: 3, roofPat: "p-slate", roofC: "#5F6A72", wall: "url(#p-brick)", sign: "喫茶", signBg: "#5B3A28", aw: ["#8C5E43", "#EFE0CC"], goods: "cafe" }));
def({ id: "bld.shop.wagashi", name: "わがしや（和菓子）", cat: "建物", w: 4, h: 3, prio: "A", interact: "立ち寄りの会話", details: ["黒い瓦・木の格子", "白い のれん『和菓子』", "店先に 赤い毛せんの 長いす と 野点がさ"] },
  () => shopFront({ roofPat: "p-kawara-gray", roofC: "#4F565E", wall: "#EFE4CF", sign: "和菓子", signBg: "#2F2A26", aw: null, goods: "wagashi" }));
def({ id: "bld.shop.furniture", name: "くらしの おみせ（家具）", cat: "建物", w: 5, h: 3, prio: "S", interact: "お買い物（かぐ）", details: ["ラベンダーの看板", "大きな ショーウィンドウに いす・ランプ", "店先に 植木と ベンチの見本"] },
  () => shopFront({ w: 5, roofPat: "p-slate", roofC: "#5F6A72", wall: "#FAF6EF", sign: "くらしの おみせ", signBg: "#8B7DB8", aw: ["#B5A8DA", "#FFFFFF"], goods: "furniture" }));
function shopFront(o) {
  const w = o.w || 4, W = w * P, H = 3 * P, rh = 30;
  let s = castShadow(W, H, 12) + pitchedRoof(W, rh, o.roofPat, o.roofC);
  s += `<rect x="1" y="${rh - 2}" width="${W - 2}" height="${H - rh - 2}" fill="${o.wall}" ${st(1.3)}/>`;
  // 2階
  s += win(8, rh + 3, 14, 10, { shutter: true, curtain: "#F3D9B1" }) + (w >= 4 ? win(W - 22, rh + 3, 14, 10, { shutter: true, curtain: "#CFE0EE" }) : "") + ac(W / 2 - 4, rh + 5) + downspout(W - 3, rh, H - 4);
  s += signBand(4, rh + 17, W - 8, 10, o.sign, o.signBg, "#FFFFFF", 7);
  if (o.aw) s += awning(2, rh + 28, W - 4, 7, o.aw[0], o.aw[1]);
  // 1階 店先
  const y1 = rh + 36, h1 = H - y1 - 4;
  if (o.goods === "wagashi") { s += doorLattice(8, y1 - 6, W - 16, h1 + 6, "#5E3F28") + R(10, y1 - 8, W - 20, 12, "#F7F4EE", { sw: 0.8 }) + L(W / 2, y1 - 8, W / 2, y1 + 4, "#DDD6C8", 0.8) + T(W / 2, y1, "和菓子", { size: 5, fill: "#2F2A26" }); }
  else s += R(4, y1, W - 8, h1, "#EFEAE0", { sw: 0.9 }) + glass(6, y1 + 2, W - 12, h1 - 6);
  const g = o.goods, gy = H - 8;
  if (g === "veg") { s += `<path d="M6,${gy} L${W - 6},${gy} L${W - 8},${gy - 8} L8,${gy - 8} Z" fill="#C79B6B" ${st(0.8)}/>`; for (let i = 0; i < 6; i++) { const x = 12 + i * ((W - 24) / 5); s += R(x - 6, gy - 11, 12, 7, "#B07F4F", { sw: 0.6 }) + [0, 1, 2].map((j) => C(x - 3 + j * 3, gy - 12, 2.2, ["#E53935", "#7CB342", "#F57C00", "#6A1B9A", "#8BC34A", "#FBC02D"][(i + j) % 6], { sw: 0.4 })).join("") + R(x - 3, gy - 5, 6, 3, "#FFFFFF", { sw: 0.4 }); } }
  if (g === "bread") { for (let i = 0; i < 5; i++) s += E(14 + i * 22, y1 + h1 - 12, 7, 3.4, ["#D9A15B", "#C98B45", "#E6B872"][i % 3], { sw: 0.6 }); s += `<path d="M${W - 16},${H - 4} L${W - 10},${H - 20} L${W - 4},${H - 4}" fill="#3B3B3B" ${st(0.8)}/>` + T(W - 10, H - 9, "PAN", { size: 3.5 }); s += L(W - 6, rh + 20, W - 6, rh + 30, "#6B4A33", 1) + E(W - 6, rh + 32, 4, 2.5, "#E3B465", { sw: 0.6 }); }
  if (g === "flower") { for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const x = 10 + i * 20, y = gy - r * 5; s += R(x - 4, y - 4, 8, 5, "#9FB2C0", { sw: 0.5 }) + [0, 1, 2].map((j) => C(x - 2.5 + j * 2.5, y - 5.5, 1.8, ["#F06292", "#FFD54F", "#BA68C8", "#FF8A65", "#FFFFFF"][(i + j + r) % 5], { sw: 0.3 })).join(""); } }
  if (g === "books") { s += R(6, gy - 8, 30, 8, "#7B5B45", { sw: 0.7 }); for (let i = 0; i < 7; i++) s += Rn(8 + i * 4, gy - 12, 3, 5, ["#3F51B5", "#E53935", "#43A047", "#FBC02D", "#8E24AA"][i % 5]); s += R(W - 30, gy - 16, 22, 16, "#9E9E9E", { sw: 0.7 }); for (let i = 0; i < 4; i++) s += Rn(W - 28 + i * 5, gy - 14, 4, 6, ["#F48FB1", "#81D4FA", "#FFE082", "#A5D6A7"][i]); }
  if (g === "sample") { s += R(8, gy - 12, 36, 12, "#DDE5E8", { sw: 0.8 }) + glass(9, gy - 11, 34, 6) + [0, 1, 2].map((i) => E(16 + i * 10, gy - 4, 3.5, 2, ["#F4C06A", "#E57373", "#FFF3E0"][i], { sw: 0.4 })).join(""); s += `<path d="M${W - 22},${H - 4} L${W - 16},${H - 22} L${W - 10},${H - 4}" fill="#F7F1E3" ${st(0.8)}/>` + L(W - 19, H - 14, W - 13, H - 14, "#B0A48E", 0.6); }
  if (g === "cafe") { s += C(14, gy - 6, 5, "#FFFFFF", { sw: 0.8 }) + C(W - 16, gy - 6, 5, "#FFFFFF", { sw: 0.8 }) + L(W / 2, rh + 16, W / 2, rh + 22, "#5B3A28", 1) + R(W / 2 - 8, rh + 22, 16, 9, "#F3E6D0", { sw: 0.8 }); s = s.replace(signBand(4, rh + 17, W - 8, 10, o.sign, o.signBg, "#FFFFFF", 7), signBand(4, rh + 17, W / 2 - 10, 10, o.sign, o.signBg, "#FFFFFF", 6)); }
  if (g === "wagashi") { s += R(W - 44, gy - 6, 34, 5, "#C62828", { sw: 0.7 }) + L(W - 40, gy - 1, W - 40, gy + 3, INK, 0.8) + L(W - 14, gy - 1, W - 14, gy + 3, INK, 0.8) + L(W - 27, gy - 6, W - 27, gy - 34, "#6B4A33", 1.2) + `<path d="M${W - 45},${gy - 30} Q${W - 27},${gy - 44} ${W - 9},${gy - 30} Z" fill="#D84343" ${st(0.9)}/>`; }
  if (g === "furniture") { s += R(14, gy - 14, 12, 12, "#C9A57C", { sw: 0.7 }) + R(14, gy - 20, 12, 7, "#B08A62", { sw: 0.7 }) + L(W - 30, gy - 2, W - 30, gy - 20, "#555", 1) + `<path d="M${W - 36},${gy - 20} L${W - 24},${gy - 20} L${W - 27},${gy - 27} L${W - 33},${gy - 27} Z" fill="#FFE9A8" ${st(0.7)}/>` + pot(W - 16, gy - 6); }
  return s + foundation(W, H);
}
def({ id: "bld.post", name: "ゆうびんきょく", cat: "建物", w: 6, h: 4, prio: "A", interact: "立ち寄りの会話（手紙の おてつだい：将来）", details: ["赤い看板と 〒マーク", "白い外壁・大きな窓", "ATM の小さな看板", "入口横に 赤いポスト・配達のバイク"] },
  () => { const W = 6 * P, H = 4 * P, rh = 40; let s = castShadow(W, H) + flatRoof(W, rh, "#BFC3C4", { items: [["ac", 14, 10], ["ac", 30, 10]] });
    s += R(0, rh - 2, W, H - rh - 2, "#FBFBF8", { sw: 1.3 }) + signBand(6, rh + 2, W - 12, 13, "〒 へいわだい ゆうびんきょく", "#D23B32", "#FFF", 7);
    s += win(12, rh + 22, 34, 22, { grid: true }) + win(W - 46, rh + 22, 34, 22, {}) + doorAuto(W / 2 - 16, rh + 20, 32, H - rh - 26) + R(W - 44, rh + 46, 22, 8, "#1E5AA8", { sw: 0.6 }) + T(W - 33, rh + 52, "ATM", { size: 5 });
    return s + foundation(W, H); });
def({ id: "bld.sento", name: "せんとう へいわの ゆ（銭湯）", cat: "建物", w: 6, h: 4, prio: "S", interact: "立ち寄りの会話（おふろ：将来）",
  details: ["唐破風（カーブした屋根の入口）", "高い えんとつ（屋根の上に 2マスぶん はみ出す・けむり）", "『ゆ』の のれん（紺）", "下足箱の見える入口", "瓦屋根"] },
  () => { const W = 6 * P, H = 4 * P, rh = 46; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-kawara-gray", "#6F7780");
    s += R(W - 34, -58, 14, rh + 50, "#A79B90", { sw: 1.2 }) + L(W - 34, -58, W - 20, -58, INK, 1.2) + R(W - 36, -62, 18, 5, "#8F837A", { sw: 1 }) + T(W - 27, -20, "ゆ", { size: 8 }) + `<path d="M${W - 27},${-64} q-8,-10 2,-18 q10,-8 0,-16" stroke="#E6E6E6" stroke-width="5" fill="none" opacity="0.8" stroke-linecap="round"/>`;
    s += R(1, rh - 2, W - 2, H - rh - 2, "#F2EBDD", { sw: 1.3 }) + win(10, rh + 6, 22, 14, { shutter: true }) + win(W - 32, rh + 6, 22, 14, { shutter: true });
    s += `<path d="M${W / 2 - 34},${rh + 16} Q${W / 2},${rh - 4} ${W / 2 + 34},${rh + 16} L${W / 2 + 28},${rh + 20} Q${W / 2},${rh + 4} ${W / 2 - 28},${rh + 20} Z" fill="#5C646D" ${st(1.2)}/>`;
    s += R(W / 2 - 24, rh + 20, 48, H - rh - 26, "#E9DFC9", { sw: 1 }) + R(W / 2 - 22, rh + 21, 44, 16, "#23395B", { sw: 0.8 }) + L(W / 2 - 7, rh + 21, W / 2 - 7, rh + 37, "#3B5378", 0.9) + L(W / 2 + 7, rh + 21, W / 2 + 7, rh + 37, "#3B5378", 0.9) + T(W / 2, rh + 32, "ゆ", { size: 10 });
    for (let i = 0; i < 4; i++) s += R(W / 2 - 18 + i * 9, rh + 40, 7, 9, "#B99B73", { sw: 0.5 });
    return s + foundation(W, H); });
def({ id: "bld.apartment", name: "アパート（2かい・外階段）", cat: "建物", w: 6, h: 4, prio: "A", interact: "なし", details: ["外廊下の手すり（2階）", "鉄の外階段（右はし）", "ドアが4つ・表札", "室外機・自転車・郵便受け"] },
  () => { const W = 6 * P, H = 4 * P, rh = 34; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-metal-roof", "#8FA1AE");
    s += `<rect x="1" y="${rh - 2}" width="${W - 2}" height="${H - rh - 2}" fill="url(#p-siding)" ${st(1.3)}/>`;
    for (let k = 0; k < 2; k++) { const y = rh + 4 + k * 42; for (let u = 0; u < 3; u++) { const x = 10 + u * 50; s += doorWood(x, y + 6, 12, 24, "#7C8A93") + win(x + 18, y + 8, 14, 10, { curtain: "#F1D8B0" }) + ac(x + 34, y + 22); } if (k === 0) s += R(2, y + 32, W - 30, 5, "#D9D6CF", { sw: 0.8 }) + L(4, y + 30, W - 30, y + 30, "#9A9A9A", 1); }
    for (let i = 0; i < 7; i++) s += L(W - 24 + i * 2.6, rh + 36 + i * 6, W - 8 + i * 1, rh + 36 + i * 6, "#6C7378", 1.2); s += L(W - 24, rh + 34, W - 6, H - 6, "#6C7378", 1.4);
    return s + foundation(W, H); });
def({ id: "bld.nursery", name: "ほいくえん", cat: "建物", w: 6, h: 4, prio: "A", interact: "立ち寄りの会話", details: ["黄色い屋根・カラフルな窓わく", "壁に 動物の絵", "園の門と ひくい さく", "小さな すべり台（前庭）"] },
  () => { const W = 6 * P, H = 4 * P, rh = 40; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-metal-roof", "#F2C14E");
    s += `<path d="M-3,${rh} L4,2 L${W - 4},2 L${W + 3},${rh} Z" fill="#F2C14E" opacity="0.55"/>`;
    s += R(1, rh - 2, W - 2, H - rh - 2, "#FFF8E5", { sw: 1.3 }) + signBand(W / 2 - 40, rh + 2, 80, 11, "へいわだい ほいくえん", "#4FA3D9", "#FFF", 6);
    s += win(10, rh + 18, 24, 16, { frame: "#F48FB1" }) + win(40, rh + 18, 24, 16, { frame: "#81C784" }) + win(W - 64, rh + 18, 24, 16, { frame: "#64B5F6" }) + win(W - 34, rh + 18, 24, 16, { frame: "#FFB74D" });
    s += C(W / 2, rh + 26, 7, "#F8BBD0", { sw: 0.8 }) + C(W / 2 - 4, rh + 24, 1, INK, { sw: 0 }) + C(W / 2 + 4, rh + 24, 1, INK, { sw: 0 }) + doorWood(W / 2 - 9, rh + 36, 18, H - rh - 42, "#E57373");
    return s + foundation(W, H); });
def({ id: "bld.house.modern", name: "おうち（2かい建て・今風）", cat: "建物", w: 5, h: 4, prio: "A", interact: "一部の家だけ 会話", details: ["スレートや金属の屋根（色ちがい3種）", "2階の ベランダ（物干し・布団）", "玄関ポーチ・表札・インターホン", "室外機・雨どい・ガスメーター", "前庭（植木・自転車）"], variants: ["屋根: 青灰・赤茶・こげ茶", "壁: 白・クリーム・うす緑"] },
  (o = {}) => houseModern(o));
function houseModern(o = {}) {
  const W = 5 * P, H = 4 * P, rh = 42, roof = o.roof || ["p-slate", "#5F6A72"], wall = o.wall || "#F6F1E7";
  let s = castShadow(W, H) + pitchedRoof(W, rh, roof[0], roof[1]);
  s += R(1, rh - 2, W - 2, H - rh - 2, wall, { sw: 1.3 }) + win(10, rh + 4, 26, 14, { shutter: true, curtain: "#F4D9AF" }) + win(W - 40, rh + 4, 26, 14, { shutter: true, curtain: "#CFE0EE" });
  s += R(W - 46, rh + 20, 42, 6, "#E0DBD1", { sw: 0.8 }) + L(W - 46, rh + 17, W - 4, rh + 17, "#8E8E8E", 0.8) + Rn(W - 40, rh + 12, 12, 6, "#F7F3EA") + L(W - 40, rh + 12, W - 28, rh + 12, "#A8A8A8", 0.6);
  s += win(12, rh + 34, 22, 16, { shutter: true, plant: true }) + R(W / 2 - 4, rh + 30, 26, 4, "#A0A7AB", { sw: 0.8 }) + doorWood(W / 2, rh + 34, 18, H - rh - 40, o.door || "#6B4A33") + R(W / 2 + 22, rh + 38, 7, 4, "#F4EFE3", { sw: 0.5 }) + meter(W - 12, rh + 36) + ac(W - 26, H - 16) + downspout(3, rh, H - 4) + pot(W / 2 - 12, H - 8);
  return s + foundation(W, H);
}
def({ id: "bld.house.hiraya", name: "おうち（平屋・瓦）", cat: "建物", w: 4, h: 3, prio: "A", interact: "一部の家だけ 会話", details: ["いぶし瓦の 大きな屋根", "縁側と 障子", "雨戸の戸袋", "玄関の 引き戸"] },
  () => { const W = 4 * P, H = 3 * P, rh = 40; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-kawara-gray", "#6F7780", { hip: true });
    s += R(1, rh - 2, W - 2, H - rh - 2, "#EFE7D6", { sw: 1.3 }) + R(6, rh + 4, 54, 24, "#F9F6EE", { sw: 0.9 }); for (let x = 10; x < 58; x += 8) s += L(x, rh + 4, x, rh + 28, "#C9BBA0", 0.7); s += L(6, rh + 16, 60, rh + 16, "#C9BBA0", 0.7);
    s += R(4, rh + 28, 58, 5, "#B08560", { sw: 0.8 }) + doorLattice(W - 50, rh + 4, 26, H - rh - 10, "#6B4A33") + R(W - 22, rh + 6, 16, 12, "#D8CCB5", { sw: 0.6 }) + meter(W - 14, rh + 22);
    return s + foundation(W, H); });
def({ id: "bld.house.old", name: "ふるい おうち（木造・格子）", cat: "建物", w: 4, h: 4, prio: "B", interact: "会話（おばあちゃん）", details: ["焼き杉の黒い板壁", "木の格子窓", "瓦屋根に 鬼瓦", "玄関先に 鉢植えが たくさん"] },
  () => { const W = 4 * P, H = 4 * P, rh = 46; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-kawara-gray", "#5C646D") + C(W / 2, 5, 4, "#5C646D", { sw: 1 });
    s += `<rect x="1" y="${rh - 2}" width="${W - 2}" height="${H - rh - 2}" fill="url(#p-wood)" ${st(1.3)}/>` + Rn(1, rh - 2, W - 2, 22, "#3C3431", { op: 0.55 }) + win(10, rh + 4, 30, 12, { frame: "#5E4636", grid: false }); for (let x = 12; x < 40; x += 3) s += L(x, rh + 4, x, rh + 16, "#5E4636", 0.9);
    s += doorLattice(W - 46, rh + 22, 30, H - rh - 28, "#4A3526") + [0, 1, 2, 3].map((i) => pot(8 + i * 9, H - 8, ["#6DAE5B", "#E57373", "#8BC34A", "#F48FB1"][i])).join(""); return s + foundation(W, H); });
def({ id: "bld.conbini", name: "コンビニ", cat: "建物", w: 6, h: 4, prio: "A", interact: "なし（将来 お買い物）", details: ["白い外壁に 3色の帯（ブランドは架空）", "全面ガラス（雑誌の棚が見える）", "自動ドア・のぼり", "前に 駐車場の白線・ゴミ箱・灰色の車止め"] },
  () => { const W = 6 * P, H = 4 * P, rh = 34; let s = castShadow(W, H) + flatRoof(W, rh, "#C4C7C6", { items: [["ac", 12, 10], ["ac", 28, 10], ["ac", 44, 10]] });
    s += R(0, rh - 2, W, H - rh - 2, "#FFFFFF", { sw: 1.3 }) + Rn(0, rh + 2, W, 4, "#F29A3A") + Rn(0, rh + 6, W, 4, "#3BAA6A") + Rn(0, rh + 10, W, 4, "#E5534B") + T(W / 2, rh + 26, "へいわマート", { size: 9, fill: "#3BAA6A" });
    s += R(6, rh + 32, W - 12, H - rh - 38, "#E9EEF0", { sw: 0.9 }) + glass(8, rh + 34, W - 16, H - rh - 44) + doorAuto(W / 2 - 16, rh + 32, 32, H - rh - 38); for (let i = 0; i < 5; i++) s += Rn(12 + i * 6, rh + 40, 4, 8, ["#F48FB1", "#81D4FA", "#FFE082", "#A5D6A7", "#FFAB91"][i]);
    s += R(W - 22, H - 16, 14, 10, "#7F8C8D", { sw: 0.8 }) + L(W - 20, H - 12, W - 10, H - 12, "#BDC3C7", 0.8); return s + foundation(W, H); });
def({ id: "bld.gas", name: "ガソリンスタンド（屋根と給油機）", cat: "建物", w: 9, h: 5, prio: "B", interact: "なし", details: ["白い大屋根（下に 照明の点）", "給油機 2台（ホース・画面）", "価格の看板ポール", "小さな事務所（ガラス）", "地面は コンクリート＋停止線"] },
  () => { const W = 9 * P, H = 5 * P; let s = `<path d="M${W},20 L${W + 18},30 L${W + 18},90 L${W - 10},90 Z" fill="#1A1410" opacity="0.14"/>`;
    s += R(W - 80, H - 58, 72, 52, "#F2F4F5", { sw: 1.2 }) + glass(W - 76, H - 50, 64, 26) + doorAuto(W - 54, H - 30, 24, 24) + R(W - 80, H - 62, 72, 6, "#D84A3F", { sw: 0.8 });
    for (const x of [44, 132]) s += R(x, H - 70, 16, 30, "#E9ECEF", { sw: 1 }) + R(x + 3, H - 66, 10, 7, "#2E3B44", { sw: 0.5 }) + Rn(x + 2, H - 52, 12, 3, "#D84A3F") + L(x + 16, H - 58, x + 22, H - 46, INK, 1.2);
    s += `<rect x="4" y="4" width="${W - 100}" height="58" rx="3" fill="#FAFAFA" ${st(1.3)}/>` + Rn(4, 54, W - 100, 8, "#D84A3F") + Rn(4, 50, W - 100, 4, "#F2B23A"); for (let x = 20; x < W - 110; x += 26) s += E(x, 30, 5, 2.5, "#FFF7C2", { sw: 0.5 });
    s += L(W - 30, H - 64, W - 30, -24, "#8C959B", 3) + R(W - 44, -40, 28, 24, "#FFFFFF", { sw: 1 }) + T(W - 30, -31, "レギュラー", { size: 4, fill: INK }) + T(W - 30, -21, "1 6 8", { size: 6, fill: "#D84A3F" }); return s; });
def({ id: "bld.bikeshed", name: "駐輪場（屋根つき）", cat: "建物", w: 8, h: 4, prio: "B", interact: "なし", details: ["波板の屋根（半透明の緑）", "2段の ラック", "自転車 12台以上（色ちがい・かご）", "『駐輪場』の看板"] },
  () => { const W = 8 * P, H = 4 * P; let s = `<rect x="0" y="0" width="${W}" height="30" fill="#A8D5B8" opacity="0.85" ${st(1.2)}/>`; for (let x = 6; x < W; x += 8) s += L(x, 0, x, 30, "#8FC2A2", 1); s += Rn(0, 30, W, 4, "#1A1410", { op: 0.15 }) + T(W / 2, 20, "へいわだい えき 駐輪場", { size: 8, fill: "#2F6F66" });
    for (const x of [4, W - 6]) s += L(x, 30, x, H - 4, "#8A9296", 2); for (let i = 0; i < 14; i++) s += bike(8 + i * 17.5, H - 30, ["#E53935", "#1E88E5", "#FDD835", "#43A047", "#FFFFFF", "#8E24AA", "#3E2723"][i % 7], true); return s; });
def({ id: "bld.toilet", name: "公園のトイレ", cat: "建物", w: 3, h: 3, prio: "B", interact: "なし", details: ["タイル壁・小さな屋根", "男女のマーク", "手洗い場"] },
  () => { const W = 3 * P, H = 3 * P, rh = 30; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-metal-roof", "#7FA3B8") + `<rect x="1" y="${rh - 2}" width="${W - 2}" height="${H - rh - 2}" fill="url(#p-tile-wall)" ${st(1.3)}/>` + doorWood(14, rh + 14, 16, H - rh - 20, "#5C8FB8") + doorWood(W - 30, rh + 14, 16, H - rh - 20, "#D9707C") + C(22, rh + 8, 3, "#5C8FB8", { sw: 0.5 }) + C(W - 22, rh + 8, 3, "#D9707C", { sw: 0.5 }); return s + foundation(W, H); });

// ================= 自転車・車・バス =================
function bike(x, y, c, basket = false) { let s = C(x, y + 12, 5, "none", { sw: 1.3, stroke: "#333" }) + C(x + 12, y + 12, 5, "none", { sw: 1.3, stroke: "#333" }) + L(x, y + 12, x + 5, y + 5, c, 1.8) + L(x + 5, y + 5, x + 12, y + 12, c, 1.8) + L(x + 5, y + 5, x + 10, y + 5, c, 1.8) + L(x + 10, y + 5, x + 12, y + 12, c, 1.6) + L(x + 4, y + 3, x + 7, y + 3, "#333", 1.4) + L(x + 11, y + 2, x + 13, y + 3, "#333", 1.2); if (basket) s += R(x + 11, y + 1, 5, 4, "#C9C9C9", { sw: 0.6 }); return s; }
def({ id: "prop.bicycle", name: "自転車", cat: "小物", w: 1, h: 1, prio: "A", details: ["前かご・スポーク", "色は 6色以上から"] }, () => bike(9, 12, "#1E88E5", true));
function car(W, H, c, o = {}) { let s = groundShadow(W / 2 + 2, H - 2, W / 2 - 1, 4) + R(2, 4, W - 4, H - 8, c, { sw: 1.2, rx: 6 }) + R(5, 8, W - 10, H * 0.26, "#9CC7DC", { sw: 0.8, rx: 3 }) + R(5, H - 8 - H * 0.2, W - 10, H * 0.18, "#8EB8CD", { sw: 0.8, rx: 3 }) + Rn(6, 12 + H * 0.26, W - 12, H * 0.3, shade(c, 0.15), { rx: 2 }) + C(4, 8, 1.6, "#FFF6C9", { sw: 0.5 }) + C(W - 4, 8, 1.6, "#FFF6C9", { sw: 0.5 }) + R(1, H * 0.35, 2, 5, "#333", { sw: 0 }) + R(W - 3, H * 0.35, 2, 5, "#333", { sw: 0 }); if (o.taxi) s += R(W / 2 - 5, H / 2 - 3, 10, 6, "#FFFFFF", { sw: 0.8, rx: 1 }) + T(W / 2, H / 2 + 1.5, "TAXI", { size: 3.2, fill: INK }); return s; }
def({ id: "veh.car", name: "車（上から・止まっている）", cat: "乗り物", w: 1, h: 2, prio: "A", details: ["屋根・前後のガラス・ライト・影", "色 6色（白・銀・黒・赤・青・水色）", "向き: たて・よこ（道に合わせる）"] }, () => car(28, 56, "#E9ECEF"));
def({ id: "veh.taxi", name: "タクシー", cat: "乗り物", w: 1, h: 2, prio: "A", details: ["黄色（または緑）", "屋根の あんどん『TAXI』"] }, () => car(28, 56, "#F2C14E", { taxi: true }));
def({ id: "veh.bus", name: "路線バス（止まっている）", cat: "乗り物", w: 4, h: 2, prio: "A", details: ["白に 緑の帯", "窓の列・行き先表示『くうこう いき』", "屋根の 室外機"] },
  () => { const W = 4 * P - 4, H = 2 * P - 6; let s = groundShadow(W / 2 + 4, H + 2, W / 2, 5) + R(2, 3, W - 2, H - 4, "#F8F8F6", { sw: 1.3, rx: 6 }) + Rn(2, H - 16, W - 2, 5, "#3E9A6E") + R(W - 26, 8, 18, 10, "#DDE3E6", { sw: 0.7 }) + R(W / 2 - 16, 7, 32, 7, "#2F3A40", { sw: 0.6 }) + T(W / 2, 12.5, "くうこう いき", { size: 4.5, fill: "#FFB74D" }); for (let x = 8; x < W - 30; x += 14) s += R(x, H - 30, 11, 10, "#9CC7DC", { sw: 0.6 }); return s; });

// ================= まちの小物 =================
def({ id: "prop.vending", name: "自動販売機", cat: "小物", w: 1, h: 1, prio: "S", details: ["高さ 1.6マス（上にはみ出す）", "商品の列（3段）と 光る見本", "取り出し口・お金を入れる所", "色: 赤・青・白"], anim: "夜は明るく光る", interact: "ジュースを買う（将来）" },
  (o = {}) => { const c = o.c || "#D8433C"; let s = groundShadow(18, 30, 12, 3) + R(4, -18, 24, 46, c, { sw: 1.2, rx: 2 }) + R(6, -15, 20, 22, "#F4F7F8", { sw: 0.7 }); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) s += R(7.5 + i * 4.8, -13 + r * 7, 3.6, 5, ["#E53935", "#1E88E5", "#FDD835", "#43A047", "#FB8C00", "#8E24AA"][(i + r * 2) % 6], { sw: 0.3 }); s += R(8, 11, 16, 5, "#2A2A2A", { sw: 0.6 }) + R(21, 0, 4, 6, "#C8CCCE", { sw: 0.5 }) + L(6, 9, 26, 9, "#FFFFFF", 0.6, { op: 0.6 }); return s; });
def({ id: "prop.pole", name: "電柱（変圧器・電線つき）", cat: "小物", w: 1, h: 1, prio: "S", details: ["高さ 3マス（上にはみ出す）", "腕木と がいし", "灰色の 変圧器（3本に1本）", "住所の表示板（青）", "となりの電柱へ 電線を2〜3本（たるみ）"] },
  (o = {}) => { let s = groundShadow(18, 28, 5, 2) + R(13, -64, 6, 92, "#A9A59E", { sw: 1.1 }) + L(15, -64, 15, 28, "#C9C5BD", 1.2) + R(3, -58, 26, 3.5, "#8C8882", { sw: 0.8 }) + [5, 16, 27].map((x) => C(x, -60, 1.6, "#FFFFFF", { sw: 0.5 })).join(""); if (o.trans !== false) s += R(18, -40, 11, 16, "#9EA7AD", { sw: 0.9, rx: 3 }) + L(20, -36, 27, -36, "#C6CDD1", 0.8); s += R(12, -8, 8, 10, "#2F5FA8", { sw: 0.6 }) + T(16, -1, "3", { size: 5 }); return s; });
def({ id: "prop.lamp", name: "街灯（歩道用）", cat: "小物", w: 1, h: 1, prio: "S", details: ["高さ 2.2マス", "カーブした腕と 平たい灯具", "根元の台座"], anim: "夜は 足元に 光の輪" },
  () => groundShadow(16, 28, 5, 2) + R(14, -40, 4, 68, "#5F666B", { sw: 0.9 }) + `<path d="M16,-40 Q16,-48 26,-48" stroke="#5F666B" stroke-width="3" fill="none"/>` + `<path d="M21,-48 L32,-48 L30,-44 L23,-44 Z" fill="#E9ECEE" ${st(0.9)}/>` + E(26.5, -43.5, 3, 1.2, "#FFF3B8", { sw: 0 }) + R(12, 22, 8, 6, "#4D5358", { sw: 0.8 }));
def({ id: "prop.signal", name: "信号機（車用＋歩行者用）", cat: "小物", w: 1, h: 1, prio: "S", details: ["高さ 2.8マス", "車用: よこ長 3灯（青・黄・赤）", "歩行者用: たて 2灯（人の形）", "押しボタン箱"], anim: "青→黄→赤 の点灯（歩行者用は点滅）" },
  () => groundShadow(16, 28, 5, 2) + R(14, -58, 4, 86, "#6E7479", { sw: 0.9 }) + L(16, -54, 30, -54, "#6E7479", 3) + R(10, -62, 26, 9, "#3B4045", { sw: 1, rx: 3 }) + C(15, -57.5, 3, "#43A047", { sw: 0.5 }) + C(23, -57.5, 3, "#5B5B5B", { sw: 0.5 }) + C(31, -57.5, 3, "#5B5B5B", { sw: 0.5 }) + R(5, -34, 9, 16, "#3B4045", { sw: 0.9, rx: 1.5 }) + C(9.5, -30, 2.6, "#6B6B6B", { sw: 0.4 }) + C(9.5, -22.5, 2.6, "#43A047", { sw: 0.4 }) + R(18, -8, 6, 8, "#F2C14E", { sw: 0.7 }));
def({ id: "prop.sign.stop", name: "標識『止まれ』", cat: "小物", w: 1, h: 1, prio: "A", details: ["赤い さかさ三角", "白い文字『止まれ』"] }, () => groundShadow(16, 28, 4, 2) + L(16, 28, 16, -20, "#8E9396", 2.2) + `<path d="M4,-34 L28,-34 L16,-14 Z" fill="#D23B32" ${st(1)}/>` + T(16, -26, "止まれ", { size: 5 }));
def({ id: "prop.sign.cross", name: "標識『横断歩道』", cat: "小物", w: 1, h: 1, prio: "A", details: ["青い四角に 白い三角と 歩く人"] }, () => groundShadow(16, 28, 4, 2) + L(16, 28, 16, -18, "#8E9396", 2.2) + R(6, -34, 20, 18, "#1E6BB8", { sw: 1 }) + `<path d="M8,-18 L16,-31 L24,-18 Z" fill="#FFFFFF"/>` + C(16, -26, 1.6, "#1E6BB8", { sw: 0 }) + L(16, -25, 14, -20, "#1E6BB8", 1.4));
def({ id: "prop.busstop", name: "バス停（屋根つき）", cat: "小物", w: 3, h: 1, prio: "S", details: ["透明な屋根と 背板の広告", "ベンチ", "丸い のりば標識『1ばん のりば』と 時刻表"], interact: "時刻表を見る（会話）" },
  (o = {}) => { const W = 3 * P; let s = groundShadow(W / 2 + 4, 30, W / 2, 4) + R(6, -18, W - 12, 5, "#BFD8E4", { sw: 1, op: 0.95 }) + L(9, -13, 9, 28, "#7E8A90", 2) + L(W - 9, -13, W - 9, 28, "#7E8A90", 2) + R(12, -12, W - 24, 22, "#E6EEF1", { sw: 0.8, op: 0.8 }) + R(18, -8, 26, 14, "#F6C84C", { sw: 0.6 }) + T(31, 1, "こうこく", { size: 4.5, fill: INK }) + R(14, 14, W - 28, 5, "#8B6A4E", { sw: 0.8 }); s += L(W - 4, 28, W - 4, -26, "#9AA0A3", 2) + C(W - 4, -30, 7, "#FFFFFF", { sw: 1.2, stroke: "#2E7D5B" }) + T(W - 4, -27.5, o.no || "1", { size: 7, fill: "#2E7D5B" }) + R(W - 9, -18, 10, 14, "#FFFFFF", { sw: 0.7 }); return s; });
def({ id: "prop.bench", name: "ベンチ（木と鉄）", cat: "小物", w: 2, h: 1, prio: "A", details: ["木の板3枚＋鉄の脚", "背もたれ"] }, () => groundShadow(33, 27, 26, 3) + R(6, 10, 52, 5, "#9A6B45", { sw: 0.9 }) + R(6, 16, 52, 5, "#A87A52", { sw: 0.9 }) + R(6, 4, 52, 4, "#8C5E3B", { sw: 0.9 }) + L(10, 8, 10, 26, "#4E545A", 2) + L(54, 8, 54, 26, "#4E545A", 2));
def({ id: "prop.trash", name: "ゴミ箱（分別）", cat: "小物", w: 1, h: 1, prio: "B", details: ["もえる・カン・ペット の3つ（色分け）"] }, () => groundShadow(17, 28, 12, 3) + [0, 1, 2].map((i) => R(4 + i * 8.5, 8, 8, 18, ["#43A047", "#1E88E5", "#FB8C00"][i], { sw: 0.8, rx: 1.5 }) + R(5.5 + i * 8.5, 11, 5, 2, "#2B2B2B", { sw: 0 })).join(""));
def({ id: "prop.mailbox", name: "郵便ポスト（赤・丸型）", cat: "小物", w: 1, h: 1, prio: "A", details: ["赤い円柱・丸い屋根", "投かん口 2つ", "〒マーク"] }, () => groundShadow(17, 28, 7, 2.5) + R(9, -6, 14, 32, "#D8372E", { sw: 1.1, rx: 7 }) + E(16, -6, 7, 3, "#E4574E", { sw: 0.9 }) + R(11, 2, 10, 2.5, "#2A2A2A", { sw: 0 }) + T(16, 16, "〒", { size: 7 }));
def({ id: "prop.phone", name: "公衆電話ボックス", cat: "小物", w: 1, h: 1, prio: "B", details: ["緑の屋根・ガラス", "中に 緑の電話"] }, () => groundShadow(18, 29, 11, 3) + R(4, -26, 24, 52, "#DDEBE3", { sw: 1.1, op: 0.9 }) + R(3, -30, 26, 6, "#2E8B57", { sw: 1 }) + R(10, -8, 12, 12, "#3A9A63", { sw: 0.8 }) + T(16, -26, "でんわ", { size: 4 }));
def({ id: "prop.mirror", name: "カーブミラー", cat: "小物", w: 1, h: 1, prio: "A", details: ["オレンジの柱", "丸い鏡（空が映る）", "路地の角に置く"] }, () => groundShadow(16, 28, 4, 2) + L(16, 28, 16, -24, "#EF7D2A", 2.4) + C(16, -30, 9, "#CFE7F5", { sw: 2, stroke: "#EF7D2A" }) + `<path d="M10,-33 q6,-6 12,0" stroke="#FFFFFF" stroke-width="1.2" fill="none"/>`);
def({ id: "prop.bollard", name: "車止め（ポール）", cat: "小物", w: 1, h: 1, pass: true, prio: "B", details: ["銀色の短い柱・黄色の反射帯"] }, () => groundShadow(17, 26, 4, 2) + R(13, 8, 6, 17, "#B8BEC2", { sw: 0.9, rx: 3 }) + Rn(13, 11, 6, 2.5, "#F2C14E"));
def({ id: "prop.guardrail", name: "ガードレール（白）", cat: "小物", w: 1, h: 1, prio: "A", details: ["波形の白い板・支柱", "つなげて並べる"] }, () => R(0, 10, 32, 6, "#F4F5F4", { sw: 0.9 }) + L(0, 13, 32, 13, "#C9CDCE", 1) + R(14, 16, 4, 12, "#C9CDCE", { sw: 0.7 }));
def({ id: "prop.planter", name: "植え込み（プランター）", cat: "小物", w: 2, h: 1, prio: "A", details: ["コンクリートの箱", "低木と 季節の花"] }, () => groundShadow(34, 28, 28, 3) + R(3, 12, 58, 14, "#C9C3B8", { sw: 1 }) + [8, 20, 32, 44, 56].map((x, i) => C(x, 11, 6.5, i % 2 ? "#6DAE5B" : "#5A9E4C", { sw: 0.8 })).join("") + [12, 26, 40, 52].map((x, i) => C(x, 8, 1.8, ["#F06292", "#FFD54F", "#FFFFFF", "#BA68C8"][i], { sw: 0.3 })).join(""));
def({ id: "prop.flowerbed", name: "花だん（れんがの ふち）", cat: "小物", w: 2, h: 1, prio: "A", details: ["れんがの ふち", "花 4色（季節で変える）"], variants: ["春: チューリップ", "夏: ひまわり", "秋: コスモス", "冬: パンジー"] }, () => R(2, 10, 60, 16, "#9C6B45", { sw: 1, rx: 2 }) + Rn(5, 12, 54, 12, "#7A5634") + Array.from({ length: 11 }, (_, i) => C(8 + i * 5, 16 + (i % 2) * 4, 2.6, ["#F06292", "#FFD54F", "#FFFFFF", "#BA68C8", "#FF7043"][i % 5], { sw: 0.4 }) + L(8 + i * 5, 18 + (i % 2) * 4, 8 + i * 5, 23, "#4E8B3A", 0.8)).join(""));
def({ id: "nat.tree.street", name: "街路樹（ケヤキ）＋ 植えます", cat: "自然", w: 1, h: 1, prio: "S", details: ["高さ 2.5マス・葉の かたまり 3〜4段", "木もれ日の明るい点", "地面に 鉄の ツリーサークル（格子）", "右下へ 大きな影"], variants: ["夏: 緑", "秋: 黄〜だいだい", "冬: 枝だけ"], anim: "風で 少し ゆれる" },
  (o = {}) => { const c = o.c || "#6AAE58"; let s = E(24, 30, 18, 7, "#1A1410", { sw: 0, op: 0.16 }) + R(6, 20, 20, 10, "#6D675F", { sw: 0.8, rx: 1 }) + L(9, 22, 9, 28, "#8E877D", 0.8) + L(13, 22, 13, 28, "#8E877D", 0.8) + L(17, 22, 17, 28, "#8E877D", 0.8) + L(21, 22, 21, 28, "#8E877D", 0.8) + R(14, -6, 5, 30, "#7A5A40", { sw: 0.9 });
    const blobs = [[16, -22, 15], [6, -12, 10], [26, -12, 11], [16, -34, 11], [9, -28, 8], [24, -28, 9]]; for (const [x, y, r] of blobs) s += C(x, y, r, shade(c, -0.12), { sw: 1.1 }); for (const [x, y, r] of blobs) s += C(x - r * 0.25, y - r * 0.25, r * 0.7, c, { sw: 0 }); for (let i = 0; i < 7; i++) s += C(6 + hash(i, 5) * 22, -36 + hash(i, 6) * 30, 1.8, shade(c, 0.35), { sw: 0 }); return s; });
def({ id: "nat.tree.big", name: "大きな木（ご神木・公園）", cat: "自然", w: 2, h: 2, prio: "A", details: ["高さ 4マス", "太い幹と 根", "しめなわ（神社のとき）"] },
  (o = {}) => { const c = o.c || "#4F9A52"; let s = E(40, 60, 30, 10, "#1A1410", { sw: 0, op: 0.16 }) + `<path d="M26,60 Q30,40 28,20 L38,20 Q36,40 42,60 Z" fill="#6F5038" ${st(1)}/>` + L(24, 60, 34, 54, "#6F5038", 3) + L(44, 60, 36, 54, "#6F5038", 3);
    const blobs = [[32, -8, 24], [12, 6, 16], [52, 6, 17], [32, -30, 17], [16, -18, 14], [48, -18, 14], [32, 12, 16]]; for (const [x, y, r] of blobs) s += C(x, y, r, shade(c, -0.14), { sw: 1.2 }); for (const [x, y, r] of blobs) s += C(x - r * 0.25, y - r * 0.25, r * 0.7, c, { sw: 0 }); for (let i = 0; i < 12; i++) s += C(8 + hash(i, 15) * 48, -40 + hash(i, 16) * 50, 2, shade(c, 0.35), { sw: 0 }); if (o.rope) s += `<path d="M24,32 Q33,38 42,32" stroke="#E4D2A4" stroke-width="3.5" fill="none"/>` + [28, 33, 38].map((x) => `<path d="M${x},35 l2,3 l-2,2 l2,3" stroke="#FFF" stroke-width="1.3" fill="none"/>`).join(""); return s; });
def({ id: "nat.tree.sakura", name: "さくらの木", cat: "自然", w: 2, h: 2, prio: "A", details: ["高さ 3.5マス", "ピンクの花の かたまり", "足元に 花びら"], variants: ["春: 満開", "夏以降: 緑の葉"] }, () => REG["nat.tree.big"].draw({ c: "#F2B8C8" }) + [8, 20, 44, 56, 30].map((x, i) => E(x, 58 + (i % 2) * 3, 2, 1.2, "#F7C6D4", { sw: 0 })).join(""));
def({ id: "nat.pine", name: "松（神社の森）", cat: "自然", w: 1, h: 1, prio: "B", details: ["高さ 3マス", "横に広がる 葉の段"] }, () => { let s = E(22, 30, 14, 5, "#1A1410", { sw: 0, op: 0.16 }) + `<path d="M14,30 Q12,10 18,-20 L20,-20 Q18,10 20,30 Z" fill="#6B4E3A" ${st(0.9)}/>`; for (const [x, y, w] of [[18, -34, 24], [14, -18, 30], [20, -4, 26]]) s += E(x, y, w / 2, 6, "#3F7F4C", { sw: 1 }) + E(x - 2, y - 2, w / 2 - 4, 3, "#58995F", { sw: 0 }); return s; });
def({ id: "nat.hedge", name: "生け垣（刈りこみ）", cat: "自然", w: 1, h: 1, prio: "A", details: ["四角く刈った 緑", "葉の 細かい もよう", "つなげて使う（はしの形あり）"] }, () => { let s = R(0, 6, 32, 22, "#4E9150", { sw: 1, rx: 4 }) + Rn(0, 6, 32, 7, "#65A866", { rx: 4 }); for (let i = 0; i < 10; i++) s += C(3 + hash(i, 21) * 26, 10 + hash(i, 22) * 14, 1.6, "#3C7A3F", { sw: 0 }); return s; });
def({ id: "nat.shrub", name: "低木（まるい）", cat: "自然", w: 1, h: 1, prio: "B", details: ["丸く刈った 低い木", "花つきの種類も（つつじ）"] }, (o = {}) => groundShadow(18, 27, 12, 3) + C(16, 16, 11, o.c || "#5CA05A", { sw: 1 }) + C(13, 13, 6, shade(o.c || "#5CA05A", 0.2), { sw: 0 }) + (o.flower ? [8, 14, 20, 24, 12].map((x, i) => C(x, 10 + (i % 3) * 5, 1.7, "#F48FB1", { sw: 0.3 })).join("") : ""));
def({ id: "prop.tactile", name: "点字ブロック", cat: "地面", w: 1, h: 1, pass: true, prio: "A", details: ["黄色", "誘導（線）と 警告（点）の2種", "駅の入口 → 横断歩道 まで つなぐ"] }, () => `<rect x="8" y="0" width="16" height="32" fill="url(#p-tactile-line)"/>`);

// ================= 神社 =================
def({ id: "shrine.torii", name: "鳥居（朱色）", cat: "神社", w: 3, h: 1, prio: "S", details: ["高さ 3マス", "笠木（黒）の 反り", "朱色の柱 2本と 貫", "中央に 額『平和台神社』"] },
  () => { const W = 3 * P; return groundShadow(W / 2 + 6, 30, W / 2, 4) + R(14, -58, 8, 86, "#D8452F", { sw: 1.1 }) + R(W - 22, -58, 8, 86, "#D8452F", { sw: 1.1 }) + R(6, -48, W - 12, 6, "#D8452F", { sw: 1 }) + `<path d="M-2,-62 Q${W / 2},-70 ${W + 2},-62 L${W - 2},-56 Q${W / 2},-63 2,-56 Z" fill="#2B2724" ${st(1)}/>` + R(W / 2 - 8, -56, 16, 12, "#2B2724", { sw: 0.8 }) + T(W / 2, -47.5, "平和", { size: 5, fill: "#E8C35A" }) + R(12, 22, 12, 6, "#6F6A62", { sw: 0.7 }) + R(W - 24, 22, 12, 6, "#6F6A62", { sw: 0.7 }); });
def({ id: "shrine.lantern", name: "石灯籠", cat: "神社", w: 1, h: 1, prio: "A", details: ["高さ 1.6マス", "かさ・火袋（窓）・竿・台", "こけの緑"], anim: "夜に 火袋が ほのかに光る" }, () => groundShadow(17, 28, 8, 2.5) + R(9, 20, 14, 7, "#A39C90", { sw: 0.9 }) + R(13, 6, 6, 14, "#B1AA9E", { sw: 0.9 }) + R(8, -4, 16, 10, "#B8B1A5", { sw: 0.9 }) + R(12, -2, 8, 6, "#FFE6A6", { sw: 0.6 }) + `<path d="M4,-4 L16,-14 L28,-4 Z" fill="#A39C90" ${st(0.9)}/>` + C(16, -15, 2, "#A39C90", { sw: 0.7 }) + C(10, 22, 2.2, "#7FA46A", { sw: 0, op: 0.7 }));
def({ id: "shrine.komainu", name: "こまいぬ（あ・うん の2体）", cat: "神社", w: 1, h: 1, prio: "A", details: ["石の台座", "たてがみの うずまき", "向かい合わせに 置く"] }, (o = {}) => { const flip = o.flip ? `transform="matrix(-1,0,0,1,32,0)"` : ""; return `<g ${flip}>` + groundShadow(17, 28, 9, 2.5) + R(6, 18, 20, 9, "#A39C90", { sw: 0.9 }) + `<path d="M9,18 L9,6 Q10,-4 18,-4 Q25,-3 24,6 L26,18 Z" fill="#BDB6AA" ${st(1)}/>` + C(18, 0, 5.5, "#C7C0B4", { sw: 0.9 }) + C(20, -1, 1, INK, { sw: 0 }) + `<path d="M13,-2 q-3,3 0,6 M14,4 q-3,3 0,6" stroke="#9D968A" stroke-width="1" fill="none"/>` + `</g>`; });
def({ id: "shrine.chozuya", name: "手水舎（てみずや）", cat: "神社", w: 2, h: 2, prio: "A", details: ["小さな屋根と 柱4本", "石の水ばち（水面・ひしゃく）", "竹の とい から 水"], anim: "水が ちょろちょろ" }, () => { const W = 64, H = 64; return castShadow(W, H, 10) + R(10, 18, 4, 40, "#9A6B45", { sw: 0.8 }) + R(W - 14, 18, 4, 40, "#9A6B45", { sw: 0.8 }) + `<path d="M-2,22 Q32,14 66,22 L58,4 Q32,-2 6,4 Z" fill="#6E9C8A" ${st(1.2)}/>` + R(14, 38, 36, 18, "#B7B0A4", { sw: 1 }) + R(17, 40, 30, 8, "#7FC6E3", { sw: 0.7 }) + L(20, 38, 30, 44, "#C9A36B", 1.4) + L(40, 30, 46, 40, "#7FA35A", 2); });
def({ id: "shrine.ema", name: "絵馬かけ", cat: "神社", w: 2, h: 1, prio: "B", details: ["木のわく・屋根", "絵馬が 10枚ほど"] }, () => { let s = groundShadow(34, 28, 26, 3) + R(4, -6, 4, 32, "#8C5E3B", { sw: 0.8 }) + R(56, -6, 4, 32, "#8C5E3B", { sw: 0.8 }) + `<path d="M0,-6 L64,-6 L60,-14 L4,-14 Z" fill="#6B4A33" ${st(0.9)}/>` + L(8, 4, 56, 4, "#8C5E3B", 1.2) + L(8, 14, 56, 14, "#8C5E3B", 1.2); for (let i = 0; i < 10; i++) s += `<path d="M${10 + (i % 5) * 9},${i < 5 ? 5 : 15} l4,-2 l4,2 l0,6 l-8,0 Z" fill="#E8C99A" ${st(0.5)}/>`; return s; });
def({ id: "shrine.fence", name: "玉垣（石の さく）", cat: "神社", w: 1, h: 1, prio: "B", details: ["石の柱が ならぶ", "上に 横木"] }, () => R(0, 12, 32, 5, "#B1AA9E", { sw: 0.8 }) + [3, 13, 23].map((x) => R(x, 8, 6, 20, "#BDB6AA", { sw: 0.8 })).join(""));

// ================= 公園 =================
def({ id: "park.swing", name: "ブランコ（2人のり）", cat: "公園", w: 3, h: 2, prio: "S", interact: "タップで ゆれる", details: ["鉄の わく（赤）", "くさり・木の座板", "足もとの すりへった土", "前に さく"], anim: "ゆれる" }, () => { const W = 96, H = 64; let s = groundShadow(W / 2 + 6, H - 4, W / 2 - 4, 6) + E(34, H - 10, 10, 4, "#C9AE82", { sw: 0 }) + E(62, H - 10, 10, 4, "#C9AE82", { sw: 0 }); s += L(8, H - 4, 18, -6, "#D8452F", 3.2) + L(28, H - 4, 18, -6, "#D8452F", 3.2) + L(W - 8, H - 4, W - 18, -6, "#D8452F", 3.2) + L(W - 28, H - 4, W - 18, -6, "#D8452F", 3.2) + L(16, -6, W - 16, -6, "#B7B7B7", 3.4); for (const x of [34, 62]) s += L(x - 6, -4, x - 6, H - 22, "#8A8A8A", 1) + L(x + 6, -4, x + 6, H - 22, "#8A8A8A", 1) + R(x - 9, H - 24, 18, 5, "#A87A52", { sw: 0.9 }); return s + L(4, H - 1, W - 4, H - 1, "#6E7479", 2); });
def({ id: "park.slide", name: "すべり台", cat: "公園", w: 2, h: 3, prio: "S", interact: "タップで すべる", details: ["はしごの段", "ステンレスの すべり面（光る）", "上の 手すり"] }, () => { let s = groundShadow(36, 92, 26, 6) + R(6, 4, 18, 22, "#F2C14E", { sw: 1 }) + [8, 14, 20].map((y) => L(8, y, 22, y, "#B98A2A", 1.2)).join(""); s += `<path d="M24,6 L44,6 L58,86 L40,86 Z" fill="#D5DCE0" ${st(1.1)}/>` + L(28, 10, 46, 82, "#FFFFFF", 2, { op: 0.8 }) + L(24, 6, 44, 6, "#E53935", 3) + R(4, 26, 4, 60, "#E53935", { sw: 0.8 }) + R(22, 26, 4, 60, "#E53935", { sw: 0.8 }); for (let y = 32; y < 86; y += 9) s += L(6, y, 24, y, "#E53935", 1.6); return s; });
def({ id: "park.sandbox", name: "砂場（木のふち）", cat: "公園", w: 3, h: 2, pass: true, prio: "A", details: ["木の まくら木の ふち", "砂の もよう", "バケツ・スコップ（おもちゃ）"] }, () => R(2, 4, 92, 56, "#9A6B45", { sw: 1.2, rx: 3 }) + `<rect x="7" y="9" width="82" height="46" fill="url(#p-sand)"/>` + R(20, 22, 9, 9, "#E53935", { sw: 0.8, rx: 1 }) + L(60, 34, 72, 40, "#1E88E5", 2) + `<path d="M40,40 q6,-8 12,0 z" fill="#E6CF93" ${st(0.6)}/>`);
def({ id: "park.jungle", name: "ジャングルジム", cat: "公園", w: 2, h: 2, prio: "A", details: ["カラフルな 鉄の格子（立体）"] }, () => { let s = groundShadow(38, 60, 26, 5); for (let i = 0; i < 4; i++) { s += L(8 + i * 16, 8, 8 + i * 16, 56, ["#E53935", "#1E88E5", "#FDD835", "#43A047"][i], 2.2); s += L(8, 8 + i * 16, 56, 8 + i * 16, ["#43A047", "#FDD835", "#1E88E5", "#E53935"][i], 2.2); } return s; });
def({ id: "park.fountain", name: "噴水（円形・二段）", cat: "公園", w: 3, h: 3, prio: "S", interact: "タップで 水が高く上がる", details: ["石の ふち（二段）", "水面の ゆらぎ・波紋", "中央の 水柱と しぶき"], anim: "水が上がる・水面が光る" }, () => { const W = 96; let s = groundShadow(W / 2 + 4, 88, 44, 8) + E(W / 2, 64, 44, 24, "#B8B1A6", { sw: 1.3 }) + `<ellipse cx="${W / 2}" cy="64" rx="38" ry="19" fill="url(#p-water)" ${st(1)}/>` + E(W / 2, 54, 16, 8, "#C4BDB2", { sw: 1 }) + R(W / 2 - 4, 34, 8, 20, "#B8B1A6", { sw: 1 }) + E(W / 2, 34, 12, 5, "#C4BDB2", { sw: 1 }); s += `<path d="M${W / 2},30 q-2,-18 0,-26 q2,8 0,26" fill="#DDF3FB" ${st(0.8, "#8CC9E2")}/>` + `<path d="M${W / 2},10 q-14,6 -18,20 M${W / 2},10 q14,6 18,20" stroke="#C9ECF8" stroke-width="2" fill="none"/>` + [[-26, 66], [22, 70], [-8, 74]].map(([dx, y]) => E(W / 2 + dx, y, 5, 1.6, "#E4F6FC", { sw: 0 })).join(""); return s; });
def({ id: "park.pond", name: "池（石のふち・はす）", cat: "公園", w: 6, h: 4, prio: "A", details: ["自然な形（角のない）", "ふちの 石・草", "はすの葉と 花", "鯉（ゆっくり動く）"], anim: "鯉が泳ぐ・水面の光" }, () => { const W = 192, H = 128; let s = `<path d="M20,40 Q10,10 60,12 Q120,-4 160,16 Q196,36 180,80 Q170,122 110,118 Q40,126 22,96 Q6,70 20,40 Z" fill="#B8B1A6" ${st(1.3)}/>` + `<path d="M28,44 Q20,18 62,20 Q118,6 154,24 Q184,40 172,78 Q162,112 110,110 Q46,116 30,92 Q16,70 28,44 Z" fill="url(#p-water)" ${st(0.9)}/>`; for (const [x, y] of [[60, 50], [86, 38], [130, 70], [110, 88]]) s += `<path d="M${x},${y} m-9,0 a9,6 0 1,0 18,0 a9,6 0 1,0 -18,0 M${x},${y} l8,-4" fill="#5FA35B" ${st(0.8)}/>`; s += C(92, 36, 3, "#F7A8C0", { sw: 0.6 }) + E(140, 50, 7, 3, "#F28C28", { sw: 0.6 }) + E(76, 80, 6, 2.6, "#FFFFFF", { sw: 0.6 }); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; s += E(100 + Math.cos(a) * 84, 64 + Math.sin(a) * 52, 5, 3.5, ["#A8A195", "#BDB6AA"][i % 2], { sw: 0.7 }); } return s; });
def({ id: "park.bridge", name: "木の橋（池）", cat: "公園", w: 3, h: 1, pass: true, prio: "B", details: ["板の すじ", "両がわの 手すり"] }, () => { let s = R(0, 4, 96, 24, "#B0845A", { sw: 1 }); for (let x = 6; x < 96; x += 7) s += L(x, 4, x, 28, "#8C6440", 0.9); return s + L(0, 4, 96, 4, "#6F4D30", 2.4) + L(0, 28, 96, 28, "#6F4D30", 2.4); });
def({ id: "park.drink", name: "水飲み場", cat: "公園", w: 1, h: 1, prio: "B", details: ["石の柱と 蛇口"] }, () => groundShadow(17, 28, 7, 2) + R(10, 4, 12, 23, "#A9A398", { sw: 0.9 }) + R(8, 2, 16, 5, "#BDB6AA", { sw: 0.8 }) + `<path d="M16,2 q4,-6 7,0" stroke="#7FC6E3" stroke-width="1.6" fill="none"/>`);
def({ id: "park.clock", name: "公園の時計", cat: "公園", w: 1, h: 1, prio: "B", details: ["高さ 2.5マス", "両面の 丸い時計"] }, () => groundShadow(16, 28, 5, 2) + R(14, -38, 4, 66, "#5F666B", { sw: 0.9 }) + C(16, -42, 8, "#FFFFFF", { sw: 1.2 }) + L(16, -42, 16, -47, INK, 1) + L(16, -42, 20, -42, INK, 1));
def({ id: "prop.dokan", name: "土管（空き地のひみつきち）", cat: "小物", w: 3, h: 2, prio: "A", details: ["灰色の 土管 3本（ピラミッド積み）", "中の 暗がり", "足もとの 雑草"] }, () => { let s = groundShadow(52, 60, 42, 6); for (const [x, y] of [[18, 42], [50, 42], [34, 20]]) s += E(x, y, 16, 15, "#A8A8A6", { sw: 1.2 }) + E(x, y, 10, 9.5, "#5D5D5B", { sw: 0.9 }) + `<path d="M${x - 14},${y - 6} q14,-10 28,0" stroke="#C9C9C7" stroke-width="1.6" fill="none"/>`; return s; });

// ================= 線路・駅 =================
def({ id: "rail.train", name: "電車（駅に止まる）", cat: "乗り物", w: 14, h: 2, prio: "S", details: ["白い車体に 緑の帯", "窓の列・ドア（2か所/両）", "パンタグラフ（屋根の上）", "つなぎ目の ほろ"], anim: "発車・到着（左右へ走る）" }, () => { const W = 14 * P, H = 2 * P; let s = Rn(4, H - 6, W - 8, 6, "#1A1410", { op: 0.2 }); for (let k = 0; k < 2; k++) { const x0 = 4 + k * (W / 2), w = W / 2 - 10; s += R(x0, 6, w, H - 14, "#F6F7F6", { sw: 1.3, rx: k === 0 ? 10 : 3 }) + Rn(x0, H - 22, w, 6, "#3E9A6E") + Rn(x0, H - 16, w, 2, "#F2B23A"); for (let x = x0 + 14; x < x0 + w - 18; x += 22) s += R(x, 12, 15, 12, "#9CC7DC", { sw: 0.7 }); for (const dx of [0.3, 0.7]) s += R(x0 + w * dx - 6, 10, 12, H - 22, "#DCE6E9", { sw: 0.8 }); s += L(x0 + w / 2 - 12, 6, x0 + w / 2 + 12, -2, "#555", 1) + L(x0 + w / 2 + 12, -2, x0 + w / 2 - 4, 6, "#555", 1); } return s + R(W / 2 - 8, 14, 10, 24, "#3A3A3A", { sw: 0.6 }); });
def({ id: "rail.canopy", name: "ホームの屋根（上屋）", cat: "線路", w: 20, h: 2, prio: "A", details: ["半透明の 波板・鉄の はり", "柱の列", "駅名標（白地に 黒・緑）"] }, () => { const W = 20 * P; let s = `<rect x="0" y="4" width="${W}" height="30" fill="#DDE8EE" opacity="0.85" ${st(1.2)}/>`; for (let x = 10; x < W; x += 12) s += L(x, 4, x, 34, "#B9CAD3", 1); for (let x = 20; x < W; x += 96) s += R(x, 34, 4, 22, "#7E8A90", { sw: 0.8 }); return s + R(W / 2 - 40, 38, 80, 16, "#FFFFFF", { sw: 1 }) + Rn(W / 2 - 40, 50, 80, 4, "#3E9A6E") + T(W / 2, 48, "へいわだい", { size: 9, fill: INK }); });

// 背景の 家なみ（線路の むこう）
def({ id: "bg.roofs", name: "背景の 家なみ（屋根の列）", cat: "背景", w: 4, h: 2, prio: "B", details: ["いろいろな 屋根（瓦・金属・陸屋根）", "アンテナ・物干し", "マップの へり に使う（通れない）"] }, (o = {}) => { let s = ""; const n = 4; for (let i = 0; i < n; i++) { const x = i * 32, hgt = 20 + hash(i, o.seed || 1) * 20, c = ["#7E8791", "#9A6B55", "#6F8196", "#8FA1AE", "#B9BDBF"][Math.floor(hash(i, (o.seed || 1) + 3) * 5)]; s += R(x, 64 - hgt, 32, hgt, c, { sw: 1 }) + R(x + 3, 64 - hgt + hgt * 0.5, 26, hgt * 0.5, "#EFE8DC", { sw: 0.8 }) + win(x + 8, 64 - hgt * 0.35, 8, 6, {}) + (hash(i, 9) < 0.5 ? L(x + 22, 64 - hgt, x + 22, 64 - hgt - 10, "#8A8F92", 0.9) + L(x + 18, 64 - hgt - 7, x + 26, 64 - hgt - 7, "#8A8F92", 0.9) : ""); } return s; });
def({ id: "bld.famires", name: "ファミリーレストラン", cat: "建物", w: 7, h: 4, prio: "B", interact: "なし（将来 食事）", details: ["大きな窓の列（中の いすと 照明が見える）", "三角屋根の 入口", "高い 看板ポール（店名は架空）", "前に 駐車場"] },
  () => { const W = 7 * P, H = 4 * P, rh = 34; let s = castShadow(W, H) + pitchedRoof(W, rh, "p-kawara-brown", "#A0522D") + R(1, rh - 2, W - 2, H - rh - 2, "#FFF6EA", { sw: 1.3 }) + signBand(10, rh + 2, 90, 11, "レストラン ぽかぽか", "#C0392B", "#FFF", 6.5);
    for (let x = 8; x < W - 12; x += 30) if (Math.abs(x + 12 - W / 2) > 24) s += R(x, rh + 18, 24, 26, "#E7DCC9", { sw: 0.8 }) + glass(x + 2, rh + 20, 20, 16) + E(x + 12, rh + 34, 6, 2, "#F3C98B", { sw: 0.4 });
    s += `<path d="M${W / 2 - 22},${rh + 18} L${W / 2},${rh + 2} L${W / 2 + 22},${rh + 18} Z" fill="#C0392B" ${st(1)}/>` + doorAuto(W / 2 - 14, rh + 20, 28, H - rh - 26);
    s += L(W - 12, H - 6, W - 12, -30, "#8C959B", 3) + R(W - 34, -52, 44, 24, "#C0392B", { sw: 1, rx: 4 }) + T(W - 12, -36, "ぽかぽか", { size: 8 }); return s + foundation(W, H); });
def({ id: "prop.wheelstop", name: "駐車場の車止め（コンクリート）", cat: "小物", w: 1, h: 1, pass: true, prio: "B", details: ["灰色の ブロック・黄色の線"] }, () => R(6, 24, 20, 5, "#B8B4AC", { sw: 0.8, rx: 1.5 }) + Rn(8, 25.5, 16, 1.2, "#F2C14E"));

// 別ファイル（assets_more.mjs）から 部品を使えるようにする
export { def, glass, win, doorWood, doorAuto, doorLattice, awning, signBand, ac, downspout, meter, pot, foundation, pitchedRoof, flatRoof, castShadow, shopFront, houseModern, bike, car };
