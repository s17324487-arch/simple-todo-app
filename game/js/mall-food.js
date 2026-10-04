// サンシャインいけぶの フードコートと マルシェの たべもの（O11c・UI-78。オーナーの FB 2026-10-03「各お店の売っているものが種類が少なく見た目もチープなので、作り直してほしい」）。
// 2F の すばーたっくす（カフェ）・でぃっぱーどん（クレープ）・たぴ（タピオカ）は メニューが 3つ ずつ で、絵は いろの ちがう かんたんな かたち だった。
// ・まえからの 12しゅ（カフェ 3・クレープ 3・たぴ 3・3F の マルシェ 3）の 絵を かきなおし、なまえと せつめいを ひらがな・カタカナに（id・ねだんは そのまま）。
// ・2F の 3けんに 3しゅずつ たす（カフェ: キャラメル フローズン・シナモン ロール・ベリー スムージー／クレープ: バナナ キャラメル・ツナコーン・
//   ベリー アイス／たぴ: マンゴー・ほうじちゃ ラテ・チーズ ティー）。メニュー（IkebukuroCatalog.groups）に たすので、カウンターと テーブルで たのめる。
// ・どれも 池袋 だけ（exclusive: "ikebukuro"）。絵は 64×64・INK・id なし（FOOD_ART）。ごきげんは この あとの food-balance.js が ねだんで なおす。
// セーブは もちもの（Save.d.bag）が ふえる だけ（Save.SCHEMA は そのまま）。
const MallFood = (() => {
  const S = (w = 3) => IS(w);
  const hi = (x, y, rx, ry, rot = 0, op = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity="${op}"/>`;
  const plate = (cy = 54, rx = 26, ry = 6.5, col = "#FFFFFF") => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" ${S()}/><ellipse cx="32" cy="${cy - 0.8}" rx="${rx - 7}" ry="${Math.max(1.5, ry - 2.6)}" fill="none" stroke="#D5E2EA" stroke-width="2"/>`;
  const shadow = (cy = 58, rx = 18, ry = 3.4) => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1F1D1B" fill-opacity=".12"/>`;
  const berry = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,-5 C-6,-5 -6,3 0,6 C6,3 6,-5 0,-5 Z" fill="#E53935" ${S(1.8)}/><path d="M-3,-5 L0,-8 L3,-5 L0,-3.6 Z" fill="#5FAE4E" ${S(1.2)}/><circle cx="-1.6" cy="0" r=".7" fill="#FFE9A8"/><circle cx="1.8" cy="1.6" r=".7" fill="#FFE9A8"/></g>`;
  const blue = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5D6FC9" stroke="${INK}" stroke-width="1.3"/><circle cx="${x - 0.7}" cy="${y - 0.8}" r=".7" fill="#FFFFFF" fill-opacity=".7"/>`;
  const rasp = (x, y) => `<g transform="translate(${x} ${y})">${[[-1.6, -1.2], [1.6, -1.2], [0, 1.4], [-1.6, 1.6], [1.6, 1.6], [0, -2.4]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.7" fill="#E8486A" stroke="${INK}" stroke-width=".9"/>`).join("")}</g>`;
  const cream = (x, y, s = 1, c = "#FFFDF5") => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9,3 C-11,-2 -6,-5 -3,-4 C-3,-9 4,-10 5,-4 C10,-4 10,2 7,3 Z" fill="${c}" ${S(2)}/><path d="M-4,-1 q3,-2 6,0" fill="none" stroke="#E8DCC8" stroke-width="1.4" stroke-linecap="round"/></g>`;
  const drizzle = (pts, c) => `<path d="${pts}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const straw = (x1, y1, x2, y2, c = "#5DAF8A", w = 3.6) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${INK}" stroke-width="${w + 2.4}" stroke-linecap="round"/><path d="M${x1},${y1} L${x2},${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  // すきとおった カップ（うえが ひろい）。fill は なかみ（top より した）
  const clearCup = (fill, top = 20, x0 = 17, x1 = 47, yb = 58, bx = 3.5) => {
    const k = (top - 12) / (yb - 12), l = x0 + bx * k, r = x1 - bx * k;
    return `<path d="M${x0},12 L${x1},12 L${x1 - bx},${yb} L${x0 + bx},${yb} Z" fill="#EEF7FA" ${S()}/><path d="M${l.toFixed(1)},${top} L${r.toFixed(1)},${top} L${x1 - bx},${yb} L${x0 + bx},${yb} Z" fill="${fill}"/><path d="M${x0},12 L${x1},12 L${x1 - bx},${yb} L${x0 + bx},${yb} Z" fill="none" ${S()}/><path d="M${x0 + 4},16 L${x0 + 6.5},${yb - 4}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".65"/>`;
  };
  // ドームの ふた
  const dome = (y = 12, x0 = 15, x1 = 49, c = "#F3FAFC") => `<path d="M${x0},${y} C${x0},${y - 13} ${x1},${y - 13} ${x1},${y} Z" fill="${c}" fill-opacity=".9" ${S(2.4)}/><path d="M${x0 - 1.5},${y} L${x1 + 1.5},${y}" ${S(3.4)}/>`;
  // タピオカ（カップの そこ）
  const pearls = (y, n = 9, x0 = 22, x1 = 42) => Array.from({ length: n }, (_, i) => { const x = x0 + ((x1 - x0) * (i % 5)) / 4 + (i >= 5 ? 2.5 : 0), yy = y - (i >= 5 ? 5 : 0); return `<circle cx="${x.toFixed(1)}" cy="${yy}" r="2.7" fill="#3E2A22" stroke="${INK}" stroke-width=".8"/><circle cx="${(x - 0.8).toFixed(1)}" cy="${yy - 0.9}" r=".7" fill="#FFFFFF" fill-opacity=".55"/>`; }).join("");
  // たぴの カップ（シールの ふた・ふとい ストロー・ロゴ）
  const bobaCup = (body, extra = "", strawCol = "#9A7FB0") => `${shadow(59, 15, 3)}${clearCup(body.fill, body.top)}${extra}<rect x="15" y="9" width="34" height="4.6" rx="2" fill="#F6EFF8" ${S(2.2)}/>${straw(36, 30, 40, 1, strawCol, 5.4)}<circle cx="32" cy="38" r="5.5" fill="#FFFFFF" fill-opacity=".85" stroke="#9A7FB0" stroke-width="1.4"/><path d="M29.5,38.5 q2.5,2.4 5,0" fill="none" stroke="#9A7FB0" stroke-width="1.3" stroke-linecap="round"/>`;
  // クレープの つつみ（いけぶの みせの かみ: しろに ピンクの みずたま）
  const wrap = (band = "#E8B6AE") => `<path d="M20,30 L32,60 L44,30 Z" fill="#F0CF92" ${S()}/><path d="M22,38 L32,60 L42,38 L37,42 L32,40 L27,42 Z" fill="#FFFFFF" ${S(2.4)}/>${[[27, 46], [35, 46], [31, 52], [30, 44.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${band}"/>`).join("")}<path d="M25,49 L39,49" stroke="${band}" stroke-width="2"/>`;
  const creamTop = (c = "#FFFDF5") => `<path d="M18,30 C16,22 22,16 28,18 C30,12 38,12 40,18 C46,16 50,24 46,30 Z" fill="${c}" ${S()}/>`;

  const ART = {
    // ===== すばーたっくす（カフェ）=====
    ike_cafe_0: shadow(58, 20) + `<path d="M12,26 L12,48 C12,56 22,58 30,58 C38,58 48,56 48,48 L48,26 Z" fill="#FFFFFF" ${S()}/><path d="M48,31 C58,31 58,47 47,47" fill="none" ${S()}/><path d="M12,40 C20,43 40,43 48,40 L48,46 C40,49 20,49 12,46 Z" fill="#A9C5A3"/><ellipse cx="30" cy="26" rx="18" ry="6" fill="#C8955B" ${S()}/><path d="M30,30 C26,27 23,24.5 25.5,22.5 C27.5,21 29.5,22.5 30,24 C30.5,22.5 32.5,21 34.5,22.5 C37,24.5 34,27 30,30 Z" fill="#FFF8EC"/><path d="M12,26 L12,48 C12,56 22,58 30,58 C38,58 48,56 48,48 L48,26" fill="none" ${S()}/>` + hi(17, 36, 1.8, 6, 0, 0.7) + `<path d="M24,15 c-3,-3 3,-5 0,-9 M33,16 c-3,-3 3,-5 0,-9" fill="none" stroke="#C9D3D8" stroke-width="2.4" stroke-linecap="round"/>`,
    ike_cafe_1: shadow(59, 14, 3) + `<path d="M19,20 L45,20 L42,58 L22,58 Z" fill="#FFFFFF" ${S()}/><path d="M20.4,32 L43.6,32 L42.6,45 L21.4,45 Z" fill="#6F9468" ${S(2.2)}/><circle cx="32" cy="38.5" r="4" fill="#FFFFFF" stroke="#4E6F49" stroke-width="1.2"/><path d="M30,38.5 h4 M32,36.5 v4" stroke="#4E6F49" stroke-width="1.2"/>` + `<path d="M17,20 C15,12 22,8 26,10 C27,4 37,4 38,10 C43,8 49,12 47,20 Z" fill="#FFFDF5" ${S()}/>` + drizzle("M20,16 C24,12 26,18 30,13 C33,10 35,17 39,12 C41,10 43,14 45,15", "#7A4A2A") + `<path d="M15.5,20 L48.5,20" ${S(3.4)}/><circle cx="26" cy="11" r="1.1" fill="#5E3420"/><circle cx="36" cy="9" r="1.1" fill="#5E3420"/>`,
    ike_cafe_2: shadow(60, 14, 3) + `<path d="M18,22 L46,22 L41,46 L23,46 Z" fill="#EEF7FA" ${S()}/><path d="M19.6,30 L44.4,30 L43.4,35 L20.6,35 Z" fill="#F48FB1"/><path d="M20.6,35 L43.4,35 L42.2,41 L21.8,41 Z" fill="#FFF3D6"/><path d="M21.8,41 L42.2,41 L41,46 L23,46 Z" fill="#E7B266"/>${[[25, 43], [30, 44], [36, 43], [39, 44.5]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="2" rx=".8" fill="#C98A3E"/>`).join("")}<path d="M18,22 L46,22 L41,46 L23,46 Z" fill="none" ${S()}/><path d="M28,46 L36,46 L35,54 L29,54 Z" fill="#EEF7FA" ${S(2.4)}/><ellipse cx="32" cy="56" rx="10" ry="3" fill="#EEF7FA" ${S(2.4)}/>` + cream(32, 18, 1.15) + berry(24, 14, 1.15) + `<circle cx="40" cy="14" r="4.4" fill="#8BC34A" ${S(1.6)}/><circle cx="40" cy="14" r="1.4" fill="#F1F8E9"/><path d="M33,6 L35,20" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M33,6 L35,20" stroke="#F2D49A" stroke-width="3" stroke-linecap="round"/>` + hi(21, 27, 1.4, 4, 10, 0.7),
    ike_cafe_3: shadow(59, 14, 3) + clearCup("#D9A066", 22, 18, 46) + drizzle("M22,30 C26,34 30,28 34,33 C38,37 40,31 43,34", "#8E5428") + `<path d="M21,22 C20,14 26,12 29,13 C30,8 38,8 39,13 C44,12 46,17 44,22 Z" fill="#FFFDF5" ${S(2.4)}/>` + drizzle("M23,18 L27,14 L31,18 L35,13 L39,17 L42,15", "#B8742E") + dome(22, 16, 48) + straw(35, 24, 41, 0, "#6F9468"),
    ike_cafe_4: plate(54, 25, 6) + `<path d="M12,42 C10,28 22,20 32,20 C44,20 54,28 52,42 C50,49 14,49 12,42 Z" fill="#E1A45E" ${S()}/><path d="M32,34 m-3,0 a3,2.4 0 1,1 6,0 a7.5,5.5 0 1,1 -14,0 a11.5,8.5 0 1,1 22,0 a15,11 0 1,1 -29,0" fill="none" stroke="#B8742E" stroke-width="2.6" stroke-linecap="round"/>` + drizzle("M17,30 C22,36 26,26 31,33 C35,38 39,27 43,33 C45,36 47,32 48,31", "#FFFDF5") + `<circle cx="22" cy="40" r="1" fill="#7A4A2A"/><circle cx="42" cy="40" r="1" fill="#7A4A2A"/><circle cx="34" cy="43" r="1" fill="#7A4A2A"/>` + hi(20, 27, 4, 1.6, -20, 0.4),
    ike_cafe_5: shadow(59, 14, 3) + clearCup("#D96BA6", 20, 18, 46) + `<path d="M19.6,20 L44.4,20 L44,24 L20,24 Z" fill="#EE9CC8"/>` + blue(26, 34) + blue(37, 40) + blue(30, 48) + `<circle cx="36" cy="30" r="1.2" fill="#FFFFFF" fill-opacity=".8"/>` + straw(36, 22, 42, 2, "#5D6FC9") + berry(18, 13, 1.25) + blue(46, 14, 3),
    // ===== でぃっぱーどん（クレープ）=====
    ike_crepes_0: wrap() + creamTop() + berry(23, 24, 1.35) + berry(32, 17, 1.45) + berry(42, 24, 1.3) + `<path d="M26,19 C28,17 30,17 31,19" fill="none" stroke="#E8DCC8" stroke-width="1.6" stroke-linecap="round"/>` + cream(33, 26, 0.6) + `<path d="M44,10 L40,26" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M44,10 L40,26" stroke="#F48FB1" stroke-width="3" stroke-linecap="round"/>`,
    ike_crepes_1: wrap("#C7A07A") + creamTop("#FFF6E6") + drizzle("M19,26 C23,21 26,28 30,23 C33,19 36,27 40,22 C43,19 45,25 46,24", "#5E3420") + [[24, 20, 20], [31, 16, -15], [38, 19, 35], [28, 25, -40], [41, 25, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${r} ${x} ${y})" fill="#E8C08A" stroke="#B98A52" stroke-width="1"/>`).join(""),
    ike_crepes_2: wrap("#9CC48A") + `<path d="M18,30 C17,24 21,20 26,21 L28,18 L38,18 L42,22 C46,22 48,26 46,30 Z" fill="#9FD07A" ${S()}/>` + [[25, 23, -25], [37, 21, 25]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="6" ry="4.2" fill="#C9E28A" ${S(1.6)}/><ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.4" fill="#E6F2B0"/><circle cx="${x + 1}" cy="${y}" r="1.7" fill="#8A5A2B"/></g>`).join("") + `<path d="M28,28 L40,26 L42,30 L30,31 Z" fill="#FFD54F" ${S(1.6)}/><circle cx="34" cy="28.5" r="1" fill="#F2B23C"/>`,
    ike_crepes_3: wrap("#E7B266") + creamTop() + [[24, 22], [32, 18], [40, 22], [28, 26], [37, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#FFF3B0" ${S(1.6)}/><circle cx="${x}" cy="${y}" r="1.4" fill="#E6D08A"/>`).join("") + drizzle("M20,24 C24,21 26,27 30,23 C33,20 36,26 40,22 C42,20 44,24 45,23", "#C47A2C"),
    ike_crepes_4: wrap("#F2C14E") + `<path d="M18,30 C17,24 21,20 26,21 L28,18 L38,18 L42,22 C46,22 48,26 46,30 Z" fill="#9FD07A" ${S()}/><path d="M21,28 C21,22 28,20 32,23 C36,20 43,22 44,28 Z" fill="#F2D9C4" ${S(1.8)}/>` + [[25, 25], [29, 23], [34, 24], [38, 23], [41, 26], [31, 27]].map(([x, y]) => `<path d="M${x - 2},${y} q2,-2 4,0" fill="none" stroke="#D9AE90" stroke-width="1.2"/>`).join("") + [[24, 22], [33, 21], [40, 21], [28, 26], [37, 27]].map(([x, y]) => `<rect x="${x - 1.8}" y="${y - 1.6}" width="3.6" height="3.2" rx="1.2" fill="#FFD54F" stroke="#E0AE2E" stroke-width=".8"/>`).join("") + drizzle("M22,24 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 l3,-3", "#FFF6CC"),
    ike_crepes_5: wrap("#9A7FB0") + creamTop() + `<circle cx="32" cy="16" r="8.5" fill="#F6E3F0" ${S()}/><path d="M24,18 C27,22 37,22 40,18" fill="none" stroke="#E2C2D8" stroke-width="2" stroke-linecap="round"/>` + blue(23, 25) + blue(28, 27, 2.3) + rasp(41, 24) + rasp(22, 20) + blue(39, 28, 2.2) + hi(28, 12, 2.6, 1.4, -20, 0.6),
    // ===== たぴ =====
    ike_boba_0: bobaCup({ fill: "#EFE2CF", top: 22 }, `<path d="M21,30 C24,36 22,42 25,50 M29,28 C32,36 29,44 32,54 M38,30 C40,38 37,44 40,52" fill="none" stroke="#8E5428" stroke-width="3" stroke-linecap="round" opacity=".75"/>${pearls(54)}`, "#7A4A2A"),
    ike_boba_1: bobaCup({ fill: "#F7C6D6", top: 22 }, `<path d="M21.2,46 L42.8,46 L42,54 L22,54 Z" fill="#E8486A" opacity=".8"/>${pearls(54)}`, "#E8486A"),
    ike_boba_2: bobaCup({ fill: "#F4EEDC", top: 22 }, `<path d="M18.8,22 L45.2,22 L44.3,34 L19.7,34 Z" fill="#8DBF6A"/><path d="M19.7,34 C26,37 38,31 44.3,34" fill="none" stroke="#B9D99B" stroke-width="2"/>${pearls(54)}`, "#5E8A3A"),
    ike_boba_3: bobaCup({ fill: "#FFC24D", top: 22 }, `<path d="M18.8,22 L45.2,22 L44.6,28 L19.4,28 Z" fill="#FFE29A"/>${[[24, 50], [30, 52], [36, 50], [41, 53], [27, 46], [38, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="#FFF0A8" stroke="#E0A92E" stroke-width="1"/>`).join("")}`, "#F29A1F"),
    ike_boba_4: bobaCup({ fill: "#D9B48A", top: 22 }, `<path d="M18.8,22 L45.2,22 L44.5,30 L19.5,30 Z" fill="#F2E3CC"/>${pearls(54)}`, "#8E5428"),
    ike_boba_5: shadow(59, 15, 3) + clearCup("#E0A04A", 26) + `<path d="M17.4,14 L46.6,14 L45.6,26 L18.4,26 Z" fill="#FFFBEE"/><path d="M18.4,26 C24,29 32,23 45.6,26" fill="none" stroke="#F2E2C2" stroke-width="2.2"/>${[[24, 19], [32, 17], [40, 20], [28, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#F2D49A"/>`).join("")}<rect x="15" y="9" width="34" height="4.6" rx="2" fill="#F6EFF8" ${S(2.2)}/><path d="M42,13 L48,4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` + hi(22, 40, 1.6, 6, 6, 0.6),
    // ===== いけぶくろ マルシェ =====
    ike_marche_0: shadow(59, 26, 3.6) + `<path d="M6,34 L58,34 L54,58 L10,58 Z" fill="#D9A866" ${S()}/><path d="M8,42 L56,42 M9,50 L55,50" stroke="#B98A52" stroke-width="2"/>` + `<circle cx="32" cy="24" r="11" fill="#9BCB6A" ${S()}/><path d="M24,18 q4,4 2,10 M30,14 q4,6 2,14 M38,16 q2,6 -1,12" fill="none" stroke="#E9F3D7" stroke-width="1.4"/>` + [[14, 28], [19, 30], [16.5, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#8E5BB5" ${S(1.6)}/>`).join("") + `<circle cx="49" cy="28" r="7" fill="#E8453C" ${S(2)}/><path d="M49,21 q1,-3 3,-4" fill="none" stroke="#7A5634" stroke-width="2" stroke-linecap="round"/>` + `<path d="M6,34 L58,34" ${S()}/><path d="M24,46 C20,40 14,44 18,48 C22,51 26,48 32,46 C38,48 42,51 46,48 C50,44 44,40 40,46 Z" fill="#E8505B" ${S(2)}/><circle cx="32" cy="46" r="3" fill="#C2342C" ${S(1.6)}/>`,
    ike_marche_1: shadow(57, 22, 3.6) + `<path d="M10,44 C8,26 20,18 32,18 C44,18 56,26 54,44 C54,50 10,50 10,44 Z" fill="#E7B266" ${S()}/><path d="M12,42 C22,46 42,46 52,42 C52,47 12,47 12,42 Z" fill="#C98A3E"/><path d="M20,26 C26,22 38,22 44,26" fill="none" stroke="#F6D9A0" stroke-width="2.4" stroke-linecap="round"/><path d="M14,30 C20,24 28,28 32,24 C36,28 44,24 50,30 C48,33 46,30 44,34 C43,38 41,33 39,33 C37,35 34,31 32,33 C29,36 27,31 24,33 C22,35 21,31 18,33 C16,33 15,32 14,30 Z" fill="#FFC93C" ${S(1.8)}/>` + `<g transform="rotate(-35 50 18)"><rect x="47" y="4" width="5" height="18" rx="2" fill="#C98A52" ${S(1.6)}/><ellipse cx="49.5" cy="24" rx="5" ry="6" fill="#FFC93C" ${S(1.6)}/><path d="M45,22 h9 M45,25 h9" stroke="#E0A92E" stroke-width="1.2"/></g>` + hi(20, 34, 2.4, 1.4, -10, 0.6),
    ike_marche_2: shadow(59, 24, 3.4) + `<rect x="8" y="26" width="48" height="30" rx="4" fill="#7FA7C9" ${S()}/><rect x="11" y="29" width="42" height="24" rx="2" fill="#FFF8EC" stroke="#5E83A8" stroke-width="1.6"/>` + [[18, 35], [32, 35], [46, 35]].map(([x, y]) => `<path d="M${x - 6},${y + 4} C${x - 6},${y - 4} ${x + 6},${y - 4} ${x + 6},${y + 4} Z" fill="#F2C46A" stroke="${INK}" stroke-width="1.6"/><path d="M${x - 4},${y + 2} l2,-4 M${x},${y + 2} v-5 M${x + 4},${y + 2} l-2,-4" stroke="#D9A23A" stroke-width="1"/>`).join("") + [[18, 47, "#C98A52"], [32, 47, "#F7D8E2"], [46, 47, "#C98A52"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" stroke="${INK}" stroke-width="1.6"/><circle cx="${x - 1.6}" cy="${y - 1}" r=".9" fill="#5E3420"/><circle cx="${x + 1.6}" cy="${y + 1.2}" r=".9" fill="#5E3420"/>`).join("") + `<path d="M6,26 L58,26 L56,18 L8,18 Z" fill="#9CC0DD" ${S(2.4)}/><path d="M28,22 h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`,
  };

  // なまえ・せつめい（まえからの id は ねだんを かえない）。[id, なまえ, せつめい]
  const RENAME = [
    ["ike_cafe_0", "ふわラテ", "ふわふわ ミルクの ラテ。ハートの もよう"],
    ["ike_cafe_1", "ごほうびモカ", "チョコと コーヒーと なまクリームの モカ"],
    ["ike_cafe_2", "きせつの パフェ", "いちご・キウイ・クリームの しましま パフェ"],
    ["ike_crepes_0", "いちご デザクレープ", "いちごが たっぷり。でぃっぱーどんの いちばん にんき"],
    ["ike_crepes_1", "チョコナッツ クレープ", "チョコソースと こうばしい ナッツ"],
    ["ike_crepes_2", "アボカド チーズ クレープ", "アボカドと チーズの おかずの クレープ"],
    ["ike_boba_0", "こくとう たぴ", "こくとうの シロップが しましまの ミルク"],
    ["ike_boba_1", "いちごミルク たぴ", "あまずっぱい いちごの ミルクと タピオカ"],
    ["ike_boba_2", "まっちゃ たぴ", "まっちゃと ミルクの 2だん。タピオカ いり"],
    ["ike_marche_0", "くだものの ギフトばこ", "メロン・ぶどう・りんごの ごちそう ばこ"],
    ["ike_marche_1", "はちみつ パン", "あまい はちみつを たっぷり かけた パン"],
    ["ike_marche_2", "きせつの やきがし", "マドレーヌと クッキーの つめあわせ"],
  ];
  for (const [id, name, desc] of RENAME) {
    const f = FOODS.find((x) => x.id === id);
    if (!f || !BAG_INDEX[id]) continue;
    f.name = name; f.desc = desc; Object.assign(BAG_INDEX[id], { name, desc });
  }
  // 3F の マルシェの はこの なまえも あたらしく（ike-mall.js は この ファイルより さきに 館の かいを つくる）
  const renamed = new Set(RENAME.map((r) => r[0]));
  if (typeof VenueHalls !== "undefined") for (const def of Object.values(VenueHalls.defs)) for (const fl of Object.values(def.floors || {})) for (const fx of fl.fixtures || []) if (fx.item && renamed.has(fx.item) && BAG_INDEX[fx.item]) fx.label = BAG_INDEX[fx.item].name;
  if (BAG_INDEX.ike_crepes_2) { BAG_INDEX.ike_crepes_2.deza = false; const f = FOODS.find((x) => x.id === "ike_crepes_2"); if (f) f.deza = false; } // おかずの クレープ

  // あたらしい たべもの [id, なまえ, ねだん, おなか, ごきげん, HP, SP, デザ, せつめい]
  const FOOD = [
    ["ike_cafe_3", "キャラメル フローズン", 450, 10, 26, 8, 10, true, "つめたい キャラメルの のみもの。げんき(SP)が もどる"],
    ["ike_cafe_4", "シナモン ロール", 420, 22, 24, 22, 0, true, "シナモンの うずまき パンに あまい アイシング"],
    ["ike_cafe_5", "ベリー スムージー", 480, 8, 26, 6, 14, true, "ブルーベリーと いちごの スムージー。げんき(SP)が もどる"],
    ["ike_crepes_3", "バナナ キャラメル クレープ", 450, 20, 26, 18, 0, true, "バナナと キャラメルソースと なまクリーム"],
    ["ike_crepes_4", "ツナコーン クレープ", 420, 30, 16, 30, 0, false, "ツナと コーンと レタスの おかずの クレープ"],
    ["ike_crepes_5", "ベリー アイス クレープ", 520, 18, 30, 16, 6, true, "アイスと ブルーベリーと ラズベリー"],
    ["ike_boba_3", "マンゴー たぴ", 450, 8, 24, 6, 12, true, "あまい マンゴーの のみもの。ぷちぷち ゼリー いり"],
    ["ike_boba_4", "ほうじちゃ ラテ たぴ", 420, 8, 22, 6, 12, true, "こうばしい ほうじちゃの ラテと タピオカ"],
    ["ike_boba_5", "チーズ ティー", 480, 8, 26, 6, 14, true, "こうちゃの うえに ふわふわの チーズ クリーム"],
  ];
  for (const [id, name, price, hunger, mood, hp, sp, deza, desc] of FOOD) {
    if (BAG_INDEX[id]) continue;
    const f = { id, name, price, hunger, mood, ...(hp ? { hp } : {}), ...(sp ? { sp } : {}), deza, rare: false, exclusive: "ikebukuro", mallFood: true, desc };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" };
    const shop = id.split("_")[1];
    if (IkebukuroCatalog.groups[shop] && !IkebukuroCatalog.groups[shop].includes(id)) IkebukuroCatalog.groups[shop].push(id); // カウンター・テーブルの メニュー（おなじ はいれつ）
  }
  for (const [id, svg] of Object.entries(ART)) FOOD_ART[id] = svg;

  // メニューの えらびかた（js/venue-hall.js）: なまえの まえに ちいさな 絵
  // なまえが ながい ときは ねだんを まるごと つぎの ぎょうへ（ことばの とちゅうで おりかえさない）
  const choice = (id) => { const f = BAG_INDEX[id]; return f ? `<span class="menu-row"><span class="menu-ico" aria-hidden="true">${Art.iconSvg("bag", id)}</span><span class="menu-txt">${f.name}<span class="menu-price">（${f.price}コイン／3にん）</span></span></span>` : ""; };
  return {
    ART, RENAME, FOOD, choice,
    NEW: FOOD.map((f) => f[0]),
    REDRAWN: RENAME.map((r) => r[0]),
    // PokaDebug 用
    state() {
      const menus = Object.fromEntries(["cafe", "crepes", "boba", "marche"].map((k) => [k, [...(IkebukuroCatalog.groups[k] || [])]]));
      return { menus, total: Object.values(menus).reduce((a, m) => a + m.length, 0), names: Object.fromEntries(Object.values(menus).flat().map((id) => [id, BAG_INDEX[id] ? BAG_INDEX[id].name : null])), NEW: FOOD.map((f) => f[0]) };
    },
  };
})();
