// 描画の共通部品（1マス = 32px。ゲームと同じ縮尺）
export const P = 32;
export const INK = "#1F1D1B";
export const f = (n) => +(+n).toFixed(1);
export const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
export function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
// 線（輪郭は INK、内側の線は その色の暗いもの）
export const st = (w = 1.2, c = INK) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
export const R = (x, y, w, h, fill, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INK)}${o.op != null ? ` opacity="${o.op}"` : ""}/>`;
export const Rn = (x, y, w, h, fill, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill}"${o.op != null ? ` opacity="${o.op}"` : ""}/>`;
export const C = (x, y, r, fill, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INK)}${o.op != null ? ` opacity="${o.op}"` : ""}/>`;
export const E = (x, y, rx, ry, fill, o = {}) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INK)}${o.op != null ? ` opacity="${o.op}"` : ""}/>`;
export const Pth = (d, fill, o = {}) => `<path d="${d}" fill="${fill}"${o.sw === 0 ? "" : " " + st(o.sw ?? 1.2, o.stroke ?? INK)}${o.op != null ? ` opacity="${o.op}"` : ""}/>`;
export const L = (x1, y1, x2, y2, c, w = 1, o = {}) => `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="${o.cap || "round"}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.op != null ? ` opacity="${o.op}"` : ""} fill="none"/>`;
export const T = (x, y, text, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-size="${o.size || 8}" font-weight="${o.weight || 800}" fill="${o.fill || "#FFF"}" text-anchor="${o.anchor || "middle"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 2}" paint-order="stroke"` : ""} font-family="'Noto Sans CJK JP','Noto Sans JP',sans-serif"${o.ls ? ` letter-spacing="${o.ls}"` : ""}>${esc(text)}</text>`;
// 影（右下へ 落ちる）: 高さ hgt の箱の 影
export const shadowBox = (x, y, w, h, hgt = 10, op = 0.2) => `<path d="M${f(x + w)},${f(y + 4)} L${f(x + w + hgt * 0.55)},${f(y + 4 + hgt * 0.3)} L${f(x + w + hgt * 0.55)},${f(y + h + hgt * 0.3)} L${f(x + hgt * 0.4)},${f(y + h + hgt * 0.3)} L${f(x)},${f(y + h)} Z" fill="#1A1410" opacity="${op}"/>`;
export const groundShadow = (cx, cy, rx, ry, op = 0.18) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#1A1410" opacity="${op}"/>`;

// ---- 地面の質感（SVG pattern）。1回だけ <defs> に入れる ----
export function defs() {
  let d = "";
  // 芝: 2トーンのむら＋葉＋小さな花
  { let s = `<rect width="64" height="64" fill="#9FCB7A"/>`;
    for (let i = 0; i < 26; i++) { const x = hash(i, 1) * 64, y = hash(i, 2) * 64, r = 4 + hash(i, 3) * 8; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.6)}" fill="${hash(i, 4) < 0.5 ? "#95C272" : "#A8D184"}" opacity="0.7"/>`; }
    for (let i = 0; i < 40; i++) { const x = hash(i, 5) * 64, y = hash(i, 6) * 64, c = hash(i, 7) < 0.5 ? "#7FB25E" : "#8ABD68"; s += `<path d="M${f(x)},${f(y)} l1.2,-4 M${f(x + 2)},${f(y)} l-0.6,-3.2 M${f(x + 3.5)},${f(y + 0.4)} l1,-2.6" stroke="${c}" stroke-width="1" stroke-linecap="round"/>`; }
    for (let i = 0; i < 4; i++) { const x = hash(i, 8) * 60 + 2, y = hash(i, 9) * 60 + 2; s += `<circle cx="${f(x)}" cy="${f(y)}" r="1.3" fill="${["#FFFFFF", "#FFE27A", "#F7B7C8", "#FFFFFF"][i]}"/>`; }
    d += `<pattern id="p-grass" patternUnits="userSpaceOnUse" width="64" height="64">${s}</pattern>`; }
  // 手入れされた芝（公園・中庭）: 刈り目のしま
  { let s = `<rect width="64" height="64" fill="#A6D07F"/><rect width="64" height="16" fill="#9DC877"/><rect y="32" width="64" height="16" fill="#9DC877"/>`;
    for (let i = 0; i < 24; i++) { const x = hash(i, 11) * 64, y = hash(i, 12) * 64; s += `<path d="M${f(x)},${f(y)} l0.8,-3" stroke="#8CBC67" stroke-width="1" stroke-linecap="round"/>`; }
    d += `<pattern id="p-lawn" patternUnits="userSpaceOnUse" width="64" height="64">${s}</pattern>`; }
  // アスファルト: 粒と わずかな むら
  { let s = `<rect width="48" height="48" fill="#7E858E"/>`;
    for (let i = 0; i < 70; i++) { const x = hash(i, 21) * 48, y = hash(i, 22) * 48, c = ["#8B929B", "#727982", "#959CA4", "#6C737C"][Math.floor(hash(i, 23) * 4)]; s += `<rect x="${f(x)}" y="${f(y)}" width="1.2" height="1.2" fill="${c}"/>`; }
    for (let i = 0; i < 3; i++) { const x = hash(i, 24) * 48, y = hash(i, 25) * 48; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="4" fill="#747B84" opacity="0.5"/>`; }
    d += `<pattern id="p-asphalt" patternUnits="userSpaceOnUse" width="48" height="48">${s}</pattern>`; }
  // 歩道のインターロッキング（ずらし積み・2色）
  { let s = `<rect width="32" height="16" fill="#D8CDBC"/>`;
    const brick = (x, y, c) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="15" height="7" rx="1" fill="${c}"/>`;
    s += brick(0, 0, "#DDD2C2") + brick(16, 0, "#CFC2AE") + brick(-8, 8, "#CFC2AE") + brick(8, 8, "#DDD2C2") + brick(24, 8, "#D6CAB7");
    d += `<pattern id="p-paver" patternUnits="userSpaceOnUse" width="32" height="16"><rect width="32" height="16" fill="#BFB29E"/>${s.replace('<rect width="32" height="16" fill="#D8CDBC"/>', "")}</pattern>`; }
  // 駅前広場の 御影石（大きめの石板・2トーン）
  { let s = `<rect width="32" height="32" fill="#C7BBA7"/>`;
    s += `<rect x="0.6" y="0.6" width="15" height="15" fill="#E5DCCC"/><rect x="16.4" y="0.6" width="15" height="15" fill="#DCD1BE"/><rect x="0.6" y="16.4" width="15" height="15" fill="#DAD0BD"/><rect x="16.4" y="16.4" width="15" height="15" fill="#E6DECF"/>`;
    for (let i = 0; i < 18; i++) s += `<rect x="${f(hash(i, 31) * 32)}" y="${f(hash(i, 32) * 32)}" width="1" height="1" fill="#B9AD98" opacity="0.7"/>`;
    d += `<pattern id="p-granite" patternUnits="userSpaceOnUse" width="32" height="32">${s}</pattern>`; }
  // 商店街の床（テラゾー調の市松＋ふち）
  { let s = `<rect width="32" height="32" fill="#EAD2B6"/><rect width="16" height="16" fill="#F2DEC6"/><rect x="16" y="16" width="16" height="16" fill="#F2DEC6"/>`;
    for (let i = 0; i < 22; i++) s += `<circle cx="${f(hash(i, 41) * 32)}" cy="${f(hash(i, 42) * 32)}" r="0.7" fill="${["#C9A37E", "#B88F6A", "#FFFFFF"][i % 3]}" opacity="0.8"/>`;
    s += `<path d="M0,0 H32 M0,16 H32 M0,0 V32 M16,0 V32" stroke="#D6B894" stroke-width="0.8"/>`;
    d += `<pattern id="p-terrazzo" patternUnits="userSpaceOnUse" width="32" height="32">${s}</pattern>`; }
  // 路地のコンクリート（目地・ひび）
  { let s = `<rect width="64" height="64" fill="#D5CFC3"/><rect x="1" y="1" width="30" height="62" fill="#DAD4C9"/><rect x="33" y="1" width="30" height="62" fill="#D2CCC0"/><path d="M0,32 H64" stroke="#BDB6A8" stroke-width="1"/><path d="M8,10 l6,5 l4,-2 M44,40 l3,6" stroke="#BFB8AB" stroke-width="0.8" fill="none"/>`;
    for (let i = 0; i < 20; i++) s += `<rect x="${f(hash(i, 51) * 64)}" y="${f(hash(i, 52) * 64)}" width="1" height="1" fill="#C4BDB0"/>`;
    d += `<pattern id="p-concrete" patternUnits="userSpaceOnUse" width="64" height="64">${s}</pattern>`; }
  // 神社の玉砂利
  { let s = `<rect width="24" height="24" fill="#DCD6CA"/>`;
    for (let i = 0; i < 26; i++) s += `<ellipse cx="${f(hash(i, 61) * 24)}" cy="${f(hash(i, 62) * 24)}" rx="1.4" ry="1" fill="${["#EDE9E1", "#C9C2B5", "#E3DED4", "#BEB6A8"][i % 4]}"/>`;
    d += `<pattern id="p-gravel" patternUnits="userSpaceOnUse" width="24" height="24">${s}</pattern>`; }
  // 参道の石だたみ（長方形の敷石・目地）
  { let s = `<rect width="32" height="32" fill="#A79F92"/><rect x="1" y="1" width="30" height="14" rx="1" fill="#C7C0B3"/><rect x="1" y="17" width="14" height="14" rx="1" fill="#BEB7A9"/><rect x="17" y="17" width="14" height="14" rx="1" fill="#CBC4B8"/>`;
    d += `<pattern id="p-stone" patternUnits="userSpaceOnUse" width="32" height="32">${s}</pattern>`; }
  // 公園の土の道（小石）
  { let s = `<rect width="48" height="48" fill="#DCC49B"/>`;
    for (let i = 0; i < 30; i++) s += `<ellipse cx="${f(hash(i, 71) * 48)}" cy="${f(hash(i, 72) * 48)}" rx="${f(0.8 + hash(i, 73))}" ry="0.8" fill="${["#C9AF84", "#E8D6B3", "#BFA478"][i % 3]}"/>`;
    d += `<pattern id="p-dirt" patternUnits="userSpaceOnUse" width="48" height="48">${s}</pattern>`; }
  // 線路のバラスト（砕石）
  { let s = `<rect width="16" height="16" fill="#9C9486"/>`;
    for (let i = 0; i < 18; i++) s += `<rect x="${f(hash(i, 81) * 16)}" y="${f(hash(i, 82) * 16)}" width="${f(1 + hash(i, 83) * 1.5)}" height="1.3" fill="${["#B1A99B", "#8A8375", "#A49C8E"][i % 3]}"/>`;
    d += `<pattern id="p-ballast" patternUnits="userSpaceOnUse" width="16" height="16">${s}</pattern>`; }
  // 水（さざ波）
  { let s = `<rect width="64" height="32" fill="#77BEDD"/><path d="M4,8 q4,-3 8,0 t8,0 M36,20 q4,-3 8,0 t8,0 M18,27 q3,-2 6,0" stroke="#BFE6F5" stroke-width="1.2" fill="none" opacity="0.9"/>`;
    d += `<pattern id="p-water" patternUnits="userSpaceOnUse" width="64" height="32">${s}</pattern>`; }
  // 点字ブロック（誘導用: 線状 / 警告用: 点状）
  d += `<pattern id="p-tactile-line" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#EFC03A"/><path d="M4,2 V14 M8,2 V14 M12,2 V14" stroke="#D9A61E" stroke-width="1.6" stroke-linecap="round"/></pattern>`;
  d += `<pattern id="p-tactile-dot" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#EFC03A"/>${[4, 8, 12].map((x) => [4, 8, 12].map((y) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#D9A61E"/>`).join("")).join("")}</pattern>`;
  // 空き地の 土と雑草
  { let s = `<rect width="48" height="48" fill="#CDBB8F"/>`;
    for (let i = 0; i < 14; i++) { const x = hash(i, 91) * 48, y = hash(i, 92) * 48; s += `<path d="M${f(x)},${f(y)} l1.5,-5 M${f(x + 2)},${f(y)} l0,-4 M${f(x + 4)},${f(y)} l-1,-5" stroke="#8FA45A" stroke-width="1" stroke-linecap="round"/>`; }
    for (let i = 0; i < 16; i++) s += `<ellipse cx="${f(hash(i, 93) * 48)}" cy="${f(hash(i, 94) * 48)}" rx="1" ry="0.7" fill="#B7A376"/>`;
    d += `<pattern id="p-lot" patternUnits="userSpaceOnUse" width="48" height="48">${s}</pattern>`; }
  // 砂場
  { let s = `<rect width="24" height="24" fill="#EEDBA5"/>`; for (let i = 0; i < 14; i++) s += `<rect x="${f(hash(i, 101) * 24)}" y="${f(hash(i, 102) * 24)}" width="1" height="1" fill="#D8BF82"/>`; d += `<pattern id="p-sand" patternUnits="userSpaceOnUse" width="24" height="24">${s}</pattern>`; }
  // 屋根: 瓦（いぶし銀）・瓦（あか茶）・金属（たてはぜ）・スレート
  const kawara = (id, base, dark, light) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="12" height="7"><rect width="12" height="7" fill="${base}"/><path d="M0,7 q3,-4 6,0 q3,-4 6,0" fill="none" stroke="${dark}" stroke-width="1"/><path d="M1.5,5.2 q1.5,-1.6 3,0" stroke="${light}" stroke-width="0.7" fill="none"/></pattern>`;
  d += kawara("p-kawara-gray", "#7E8791", "#5C646D", "#A4ACB5") + kawara("p-kawara-brown", "#9A6B55", "#6F4A39", "#C0917A") + kawara("p-kawara-blue", "#6F8196", "#4F6073", "#98A9BC");
  d += `<pattern id="p-metal-roof" patternUnits="userSpaceOnUse" width="7" height="16"><rect width="7" height="16" fill="#8FA1AE"/><rect x="0" width="1.5" height="16" fill="#B5C4CE"/><rect x="5.5" width="1.5" height="16" fill="#71838F"/></pattern>`;
  d += `<pattern id="p-slate" patternUnits="userSpaceOnUse" width="10" height="6"><rect width="10" height="6" fill="#5F6A72"/><path d="M0,6 H10 M5,0 V3 M0,3 H10" stroke="#4B555C" stroke-width="0.8"/></pattern>`;
  // 外壁: サイディング・板張り・タイル
  d += `<pattern id="p-siding" patternUnits="userSpaceOnUse" width="16" height="5"><rect width="16" height="5" fill="#F3EDE2"/><path d="M0,4.5 H16" stroke="#DCD3C4" stroke-width="1"/></pattern>`;
  d += `<pattern id="p-wood" patternUnits="userSpaceOnUse" width="6" height="32"><rect width="6" height="32" fill="#8A6246"/><path d="M5.5,0 V32" stroke="#6C4A33" stroke-width="1"/><path d="M2,6 v3" stroke="#9E7457" stroke-width="0.8"/></pattern>`;
  d += `<pattern id="p-tile-wall" patternUnits="userSpaceOnUse" width="8" height="5"><rect width="8" height="5" fill="#E8DCC8"/><path d="M0,4.5 H8 M4,0 V4.5" stroke="#D2C3AA" stroke-width="0.8"/></pattern>`;
  d += `<pattern id="p-brick" patternUnits="userSpaceOnUse" width="12" height="8"><rect width="12" height="8" fill="#C98E6F"/><path d="M0,3.8 H12 M0,7.8 H12 M6,0 V3.8 M0,4 V8 M12,4 V8" stroke="#A9705A" stroke-width="0.8"/></pattern>`;
  d += `<pattern id="p-block-wall" patternUnits="userSpaceOnUse" width="16" height="8"><rect width="16" height="8" fill="#CFCABF"/><path d="M0,7.6 H16 M8,0 V7.6" stroke="#B3AD9F" stroke-width="0.8"/></pattern>`;
  return `<defs>${d}</defs>`;
}
