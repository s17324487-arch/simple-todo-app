// コンビニの ポイントカードの 絵（UI-85・js/conbini-card.js）。
// ・カード 4しゅ: ローリソン／せぶんぶん × ポイントカード／オーナー カード（オーナーに なると かわる）。big は viewBox 0 0 200 126（カードの よこ たて）、
//   icon は 0 0 64 64（もちものの「だいじな もの」）。ポイントの かずは がめんの もじで のせる。
// ・こうかんの けいひんの アイコン（0 0 64 64）: クレーン チケット・おてつだい レベル +10／+25 けん・バスの ていきけん・ひみつ。
// どれも INK の 線・パステル・id なし（いくつ ならべても かけない）。
const ConbiniCardArt = (() => {
  const INK = "#1F1D1B";
  const S = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const T = (x, y, size, fill, text, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" font-family="sans-serif" fill="${fill}" ${extra}>${text}</text>`;
  const GOLD = "#E2B84C", GOLD_L = "#F6DE94";
  // みせの しるし（かんばんと おなじ: ローリソンは ぎゅうにゅう びん・せぶんぶんは 3ぼんの しま）
  const emblem = {
    lawson: (x, y, k, col = "#4A8CC9") => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8,10 L-8,-4 C-8,-10 8,-10 8,-4 L8,10 Z" fill="#FFFFFF" stroke="${col}" stroke-width="2.4"/><rect x="-5" y="-14" width="10" height="5" rx="1.5" fill="${col}" stroke="none"/><path d="M-8,2 H8" stroke="${col}" stroke-width="2"/></g>`,
    sevenbun: (x, y, k, cols = ["#F4A13A", "#3FA36B", "#E53935"], line = "#E86F3A") => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-10" y="-10" width="20" height="20" rx="4" fill="#FFFFFF" stroke="${line}" stroke-width="2.4"/><path d="M-10,-4 H10" stroke="${cols[0]}" stroke-width="3.2"/><path d="M-10,1 H10" stroke="${cols[1]}" stroke-width="3.2"/><path d="M-10,6 H10" stroke="${cols[2]}" stroke-width="3.2"/></g>`,
  };
  const crown = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-12,7 L-14,-7 L-6,-1 L0,-10 L6,-1 L14,-7 L12,7 Z" fill="${GOLD}" ${S(2.4)}/><path d="M-12,7 H12 V11 H-12 Z" fill="${GOLD_L}" ${S(2.4)}/><circle cx="0" cy="-10" r="2" fill="#F48FB1" ${S(1.6)}/><circle cx="-6" cy="3" r="1.6" fill="#90CAF9" stroke="none"/><circle cx="6" cy="3" r="1.6" fill="#A5D6A7" stroke="none"/></g>`;
  const barcode = (x, y, h, col = INK) => { let s = "", px = x; for (const w of [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1]) { s += `<rect x="${px}" y="${y}" width="${w}" height="${h}" fill="${col}" stroke="none"/>`; px += w + 1.6; } return s; };
  const dots = (cols) => [[150, 18], [166, 26], [182, 16], [158, 40], [176, 44], [188, 32], [140, 32]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.4 : 3.4}" fill="${cols[i % cols.length]}" stroke="none"/>`).join("");
  const star = (x, y, r, fill) => { let p = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p += `${i ? "L" : "M"}${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)} `; } return `<path d="${p}Z" fill="${fill}" ${S(1.8)}/>`; };

  // カードの なかみ（200×126）。owner は オーナー カード
  const face = {
    lawson(owner) {
      const base = owner ? "#22385E" : "#5B9BD5", band = owner ? "#2F4C7A" : "#8EC0EA", line = owner ? GOLD : "#FFFFFF", name = owner ? GOLD_L : "#FFFFFF";
      return `<rect x="3" y="3" width="194" height="120" rx="14" fill="${base}"/>` +
        dots(owner ? ["#3D5C8E", "#4A6A9C"] : ["#7FB0E0", "#A9CDEE"]) +
        `<path d="M3,82 C58,62 122,104 197,68 L197,109 Q197,123 183,123 L17,123 Q3,123 3,109 Z" fill="${band}"/>` +
        `<path d="M3,96 C70,78 122,116 197,84" fill="none" stroke="${line}" stroke-width="3" stroke-opacity="0.75" stroke-linecap="round"/>` +
        (owner ? `<rect x="10" y="10" width="180" height="106" rx="9" fill="none" stroke="${GOLD}" stroke-width="2.4"/>` : "") +
        `<circle cx="32" cy="34" r="19" fill="#FFFFFF" ${S(3)}/>` + (owner ? crown(32, 35, 1.05) : emblem.lawson(32, 36, 1.15)) +
        T(58, 33, 17, name, "ローリソン", `stroke="${INK}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"`) +
        T(59, 52, 11.5, owner ? "#FFFFFF" : "#F4FAFF", owner ? "オーナー カード" : "ポイントカード", `stroke="${owner ? "#14223A" : "#2F6FB0"}" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round"`) +
        `<rect x="128" y="96" width="58" height="18" rx="4" fill="#FFFFFF" ${S(2)}/>` + barcode(133, 99, 12, owner ? "#22385E" : INK) +
        (owner ? star(176, 22, 7, GOLD) : star(176, 22, 6.5, "#FFF3A6")) +
        `<rect x="3" y="3" width="194" height="120" rx="14" fill="none" ${S(4)}/>`;
    },
    sevenbun(owner) {
      // かんばんと おなじ 3ぼんの よこじま（カードの よこの まっすぐな ところだけ とおる ので かどから はみ出さない）
      const base = owner ? "#2B2420" : "#FFF8EE", cols = owner ? [GOLD, "#C9973A", GOLD_L] : ["#F4A13A", "#3FA36B", "#E53935"], name = owner ? GOLD_L : "#E86F3A";
      return `<rect x="3" y="3" width="194" height="120" rx="14" fill="${base}"/>` +
        dots(owner ? ["#4A3E36", "#5A4C40"] : ["#FBE3C8", "#F7D2AE"]) +
        cols.map((c, i) => `<rect x="3" y="${70 + i * 7}" width="194" height="7" fill="${c}"/>`).join("") +
        `<path d="M3,70 H197 M3,91 H197" stroke="${INK}" stroke-width="2"/>` +
        (owner ? `<rect x="10" y="10" width="180" height="106" rx="9" fill="none" stroke="${GOLD}" stroke-width="2.4"/>` : "") +
        `<circle cx="32" cy="34" r="19" fill="#FFFFFF" ${S(3)}/>` + (owner ? crown(32, 35, 1.05) : emblem.sevenbun(32, 34, 1.05)) +
        T(58, 33, 17, name, "せぶんぶん", `stroke="${owner ? INK : "#FFFFFF"}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"`) +
        T(59, 52, 11.5, owner ? "#FFFFFF" : INK, owner ? "オーナー カード" : "ポイントカード", `stroke="${owner ? "#14100D" : "#FFFFFF"}" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round"`) +
        `<rect x="128" y="97" width="58" height="18" rx="4" fill="#FFFFFF" ${S(2)}/>` + barcode(133, 100, 12, owner ? "#2B2420" : INK) +
        (owner ? star(176, 22, 7, GOLD) : star(176, 22, 6.5, "#FFE08A")) +
        `<rect x="3" y="3" width="194" height="120" rx="14" fill="none" ${S(4)}/>`;
    },
  };
  const big = (shop, owner = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 126">${(face[shop] || face.lawson)(!!owner)}</svg>`;
  // もちものの アイコン（カードを すこし かたむけて）
  const icon = (shop, owner = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="translate(32 33) rotate(-8) scale(0.27) translate(-100 -63)">${(face[shop] || face.lawson)(!!owner)}</g></svg>`;

  // チケットの かたち（よこの きりかけ・きりとり せん）
  const ticket = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M6,18 H58 V27 A5,5 0 0 0 58,37 V46 H6 V37 A5,5 0 0 0 6,27 Z" fill="${fill}" ${S(3)}/><path d="M44,20 V44" stroke="${INK}" stroke-width="1.8" stroke-dasharray="2.5 3" stroke-linecap="round"/>${inner}</svg>`;
  const PRIZE = {
    // クレーン チケット: ピンクの きっぷに アームの しるし
    crane: () => ticket("#F8BBD0", `<path d="M24,20 V28" ${S(2.6)}/><path d="M17,28 H31" ${S(2.6)}/><path d="M18,28 C14,33 15,38 19,40 M30,28 C34,33 33,38 29,40" fill="none" ${S(2.6)}/><circle cx="24" cy="38" r="4" fill="#FFF59D" ${S(2)}/>${star(51, 32, 5, "#FFF59D")}`),
    lv10: () => ticket("#C8E6C9", `${T(10, 39, 17, "#2E7D32", "+10", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}<path d="M51,40 V25 M45,31 L51,25 L57,31" fill="none" ${S(2.6)}/>`),
    lv25: () => ticket("#FFE082", `${T(10, 39, 17, "#B26A00", "+25", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}<path d="M51,42 V22 M45,28 L51,22 L57,28 M45,35 L51,29 L57,35" fill="none" ${S(2.6)}/>`),
    // バスの ていきけん: パスケースに バスの え
    bus: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32,6 C26,6 24,12 26,15" fill="none" stroke="#E57373" stroke-width="3" stroke-linecap="round"/><rect x="8" y="14" width="48" height="40" rx="8" fill="#B3E5FC" ${S(3)}/><rect x="13" y="19" width="38" height="30" rx="5" fill="#FFFFFF" ${S(2)}/><rect x="17" y="24" width="30" height="16" rx="4" fill="#FFD54F" ${S(2.2)}/><path d="M20,28 H44 V33 H20 Z" fill="#E1F5FE" ${S(1.6)}/><path d="M32,28 V33" ${S(1.4)}/><circle cx="23" cy="41" r="2.8" fill="#5D4E46" ${S(1.6)}/><circle cx="41" cy="41" r="2.8" fill="#5D4E46" ${S(1.6)}/><circle cx="29" cy="12" r="2.4" fill="#FFFFFF" ${S(1.8)}/></svg>`,
    // ひみつ（10000ポイント）: こうかん するまで なにか わからない
    secret: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="12" width="44" height="40" rx="8" fill="#D9D2EC" ${S(3)}/><path d="M14,20 L22,14 M44,48 L52,42" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.8"/>${T(21, 45, 30, "#6A5A9C", "？", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`)}${star(50, 16, 5, "#FFF59D")}</svg>`,
    owner: (shop) => icon(shop || "lawson", true),
  };
  const prize = (id, shop) => (PRIZE[id] ? PRIZE[id](shop) : PRIZE.secret());
  return { big, icon, prize, ids: Object.keys(PRIZE) };
})();
