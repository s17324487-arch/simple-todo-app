// ガチャガチャの もりの あたらしい 6シリーズ（Meeときょれじゃ 4F・UI-62。オーナーの FB 2026-10-03「ときょれじゃの景品やガチャガチャの中身は、定期的に変わるようにしろ。そのための機能と景品も実装しておけ」）。
// ・ほんものの カプセルトイ専門店と おなじく、まいしゅう げつようびに しまごとに 1だいずつ なかみが いれかわる（しくみは js/mee-rotation.js）。
//   その ために しま 1つに 1シリーズずつ たして 4シリーズに した（3だいの 台で まわる。やすみの シリーズも 3しゅうかんで もどる）。
// ・まちぼうけ → うみの まちぼうけ／スクイーズ → フルーツ スクイーズ／ポーチ・ぼうし → うみの ポーチ／めじるし・もり → おやさい めじるし／
//   ミニチュア → ミニ おまつり／ミニ グッズ → ミニ スポーツ。
// ・しくみは 2F・4F の ガチャと おなじ（js/gacha.js。1かい 200コイン・ふつう 3しゅ 30%ずつ・レア 10%・あける まで わからない）。Gacha.add で 33〜38 ばん
//   （シールの 30〜32 ばんの あと。js/sticker-book.js の あとに よむ）。絵は js/gacha-forest-art.js の 部品（ポーチの かたち・めじるしの しゅるいも そこ）。
// ・セーブ: Save.d.gacha（まえと おなじ）。あたらしい ばしょは ない。
const GachaForestMore = (() => {
  const A = GachaForestArt, K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const { svg, sk, nest, npc, face, shine, shadow, disc, machi, spCol } = A;
  const ln = (d, w, col) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 3}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; // ふちどりの ある ふとい 線

  // ---- 1. うみの まちぼうけ（こおりの うえ・いわの うえで ひざを かかえる）----
  const ice = (w = 40) => `<ellipse cx="50" cy="102" rx="${w + 2}" ry="6" fill="#4F465622"/><path d="M${50 - w},97 L${54 - w},91 L${36 - w * 0.2},88 L${60 + w * 0.1},89 L${46 + w},91 L${50 + w},97 L${46 + w},103 L${54 - w},103 Z" fill="#BFE3F2" ${sk(2.2)}/><path d="M${52 - w},96 L${55 - w},91 L${36 - w * 0.2},88.6 L${60 + w * 0.1},89.6 L${45 + w},91.4 L${48 + w},96 Z" fill="#F2FAFD"/><path d="M${50 - w},97 L${50 + w},97" stroke="${K}" stroke-width="1.4" opacity="0.5"/><path d="M${64 - w},93 l7 -1.6 M${36 + w * 0.6},92 l6 1" stroke="#BFE3F2" stroke-width="1.6" stroke-linecap="round"/>`;
  const rock = () => `<ellipse cx="50" cy="102" rx="42" ry="6.5" fill="#9FD8F2" ${sk(2)}/><path d="M16,101 q8 -3 16 0 M66,102 q8 -3 16 0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/><path d="M18,99 C18,90 30,86 50,86 C70,86 82,90 82,99 C70,103 30,103 18,99 Z" fill="#B9B2A6" ${sk(2.2)}/><path d="M26,92 q10 -4 22 -3" fill="none" stroke="#D8D2C8" stroke-width="2.4" stroke-linecap="round"/>`;
  const shell = (x, y, s = 1) => `<path d="M${f1(x - 7 * s)},${f1(y + 3 * s)} C${f1(x - 8 * s)},${f1(y - 6 * s)} ${f1(x + 8 * s)},${f1(y - 6 * s)} ${f1(x + 7 * s)},${f1(y + 3 * s)} Z" fill="#F7C9B6" ${sk(1.6)}/>` + [-4, -1.4, 1.4, 4].map((d) => `<path d="M${f1(x)},${f1(y + 3 * s)} L${f1(x + d * s)},${f1(y - 3.6 * s)}" stroke="#E39A84" stroke-width="1" stroke-linecap="round"/>`).join("") + `<path d="M${f1(x - 2.6 * s)},${f1(y + 3 * s)} h${f1(5.2 * s)} v${f1(2 * s)} h${f1(-5.2 * s)} Z" fill="#F7C9B6" ${sk(1.2)}/>`;
  const fishBit = (x, y, c = "#7FC6E8") => `<path d="M${x + 7},${y} l5 -4 v8 Z" fill="${c}" ${sk(1.4)}/><ellipse cx="${x}" cy="${y}" rx="8" ry="4.6" fill="${c}" ${sk(1.6)}/><circle cx="${x - 4}" cy="${y - 1}" r="1" fill="${K}"/>`;
  const seaMachi = (sp, o = {}) => {
    const c = spCol(sp, 0);
    return machi({ img: npc(sp, { emo: o.emo || "sad", ...(o.col ? { col: o.col, col2: o.col2 } : {}) }), crop: o.crop || "10 -12 180 138", col: o.col || c[0], limb: o.limb || o.col || c[0], ...(o.foot ? { foot: o.foot } : {}), extra: o.extra || "" });
  };

  // ---- 2. フルーツ スクイーズ（へやで タップすると むにっ。js/gacha-forest.js の squishable）----
  const strawberry = () => `${shadow(32)}<path d="M50,99 C30,91 14,72 16,54 C18,40 34,34 50,42 C66,34 82,40 84,54 C86,72 70,91 50,99 Z" fill="#F0525E" ${sk()}/>`
    + [[28, 58], [40, 51], [60, 51], [72, 58], [34, 72], [66, 72], [42, 86], [58, 86], [50, 93]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="2.5" fill="#FFE07A" ${sk(0.9)}/>`).join("")
    + `<path d="M30,42 C36,31 44,36 50,29 C56,36 64,31 70,42 C62,44 57,39 50,44 C43,39 38,44 30,42 Z" fill="#6DBE5A" ${sk(2.2)}/>` + ln("M50,31 q2 -8 7 -10", 2.6, "#5FA34E") + face(50, 66, 1.1) + shine("M22,56 q3 -8 11 -10");
  const mikan = () => `${shadow(38)}<ellipse cx="50" cy="68" rx="38" ry="31" fill="#F7A23A" ${sk()}/>`
    + [[26, 60], [36, 50], [64, 50], [76, 62], [30, 84], [70, 84], [52, 92], [46, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#E0892A"/>`).join("")
    + `<ellipse cx="50" cy="38.6" rx="5" ry="2.8" fill="#8AA548" ${sk(1.6)}/><path d="M53,37 C58,25 72,25 77,31 C70,40 60,40 53,37 Z" fill="#6DBE5A" ${sk(2)}/><path d="M56,36 C63,32 69,31 74,31" fill="none" stroke="#4E9A44" stroke-width="1.6" stroke-linecap="round"/>`
    + face(50, 70, 1.15) + shine("M20,62 q3 -11 13 -15");
  const momo = () => `${shadow(36)}<path d="M50,42 C42,30 20,36 16,60 C12,84 34,99 50,99 C66,99 88,84 84,60 C80,36 58,30 50,42 Z" fill="#FCC7CF" ${sk()}/><path d="M58,42 C72,38 84,50 83,64 C77,54 68,48 58,42 Z" fill="#F59AAE" opacity="0.85"/>`
    + `<path d="M50,43 C47,50 46,54 47,58" fill="none" stroke="#E68A9C" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M49,40 C41,31 29,31 24,37 C32,44 42,44 49,40 Z" fill="#7CC36A" ${sk(2)}/><path d="M51,40 C55,30 64,27 70,30 C66,39 58,42 51,40 Z" fill="#6DBE5A" ${sk(2)}/>` + face(50, 72, 1.1) + shine("M23,62 q3 -9 11 -12");
  const melonFruit = () => `${shadow(40)}<circle cx="50" cy="66" r="34" fill="#BFE39A" ${sk()}/>`
    + ["M22,56 C34,50 40,62 52,54 C62,48 70,58 80,52", "M18,72 C30,66 38,78 50,70 C60,64 70,76 82,70", "M24,88 C34,82 44,92 54,86 C64,80 70,90 76,86", "M34,38 C38,50 32,62 38,74 C42,84 36,92 40,98", "M60,36 C56,48 64,58 60,70 C56,80 64,90 60,99"].map((d) => `<path d="${d}" fill="none" stroke="#F4F8E6" stroke-width="2.4" stroke-linecap="round"/>`).join("")
    + ln("M50,33 V23", 3, "#9BBF5A") + ln("M43,22 H57", 3, "#9BBF5A") + face(50, 70, 1.15) + shine("M24,52 q4 -9 13 -12");

  // ---- 3. ミニ おまつり（たべられない ミニチュア）----
  const takoyaki = () => {
    let s = shadow(40) + `<path d="M10,82 L90,82 L82,98 L18,98 Z" fill="#EBCB98" ${sk()}/><path d="M16,88 H84 M20,93 H80" stroke="#D4AE74" stroke-width="1.4"/>`;
    for (const [x, y] of [[28, 70], [50, 68], [72, 70], [38, 79], [62, 79]]) {
      s += `<circle cx="${x}" cy="${y}" r="12" fill="#DDA055" ${sk(2.2)}/><path d="M${x - 10},${y - 3} C${x - 8},${y - 11} ${x + 8},${y - 12} ${x + 10},${y - 3} C${x + 6},${y + 1} ${x - 6},${y + 1} ${x - 10},${y - 3} Z" fill="#7A3E1E"/>`;
      s += `<path d="M${x - 7},${y - 6} l3 2 l3 -2 l3 2 l3 -2" fill="none" stroke="#FFF8E8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x - 3}" cy="${y - 9}" r="0.9" fill="#5E9A3A"/><circle cx="${x + 4}" cy="${y - 8}" r="0.9" fill="#5E9A3A"/><circle cx="${x + 1}" cy="${y - 2}" r="0.9" fill="#5E9A3A"/>`;
    }
    s += ln("M70,62 L86,36", 2, "#E9D2A6");
    return s;
  };
  const wataame = () => `${shadow(26)}<ellipse cx="50" cy="99" rx="16" ry="4.6" fill="#E1B387" ${sk(2)}/>` + ln("M50,98 V58", 3.4, "#F4E6C8")
    + [[36, 48, 15], [62, 46, 16], [50, 34, 17], [40, 28, 12], [64, 28, 12], [50, 56, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FBC6DA" ${sk(2)}/>`).join("")
    + [[36, 48, 11.4], [62, 46, 12.4], [50, 34, 13.4], [40, 28, 8.4], [64, 28, 8.4], [50, 56, 9.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FBC6DA"/>`).join("")
    + `<path d="M30,40 q4 -6 10 -6 M52,22 q5 -3 10 0 M58,52 q5 -2 8 1" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>`;
  const kakigori = () => `${shadow(30)}<ellipse cx="50" cy="98" rx="30" ry="6" fill="#FFFFFF" ${sk(2)}/><path d="M30,66 L70,66 L64,96 L36,96 Z" fill="#E9F6FB" fill-opacity="0.85" ${sk()}/><path d="M33,74 H67" stroke="#9FD3F0" stroke-width="2.4"/>`
    + `<path d="M24,66 C22,46 34,28 50,26 C66,28 78,46 76,66 Z" fill="#FFFFFF" ${sk()}/><path d="M26,52 C30,36 42,28 50,28 C60,30 70,38 74,52 C66,48 58,56 50,50 C42,44 34,54 26,52 Z" fill="#F05A6A"/>`
    + `<path d="M62,60 C64,52 70,50 74,56 C76,60 72,66 66,66 Z" fill="#FFE07A"/><path d="M68,66 v6" stroke="#FFE07A" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M36,34 q4 -4 9 -5" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>` + ln("M40,58 L30,30", 2.4, "#7FC6E4") + `<ellipse cx="29" cy="28" rx="4.4" ry="2.4" transform="rotate(-70 29 28)" fill="#7FC6E4" ${sk(1.4)}/>`;
  const mikoshi = () => {
    let s = shadow(44) + ln("M6,92 H94", 4.4, "#E9D2A6") + ln("M12,98 L20,86 M88,98 L80,86", 2.2, "#E9D2A6");
    s += `<path d="M24,94 L76,94 L72,86 L28,86 Z" fill="#2F2A3A" ${sk(2.2)}/><path d="M26,90 H74" stroke="#F2C84B" stroke-width="2"/>`;
    s += `<rect x="32" y="56" width="36" height="30" fill="#D9454F" ${sk()}/><rect x="40" y="62" width="20" height="18" rx="2" fill="#F2C84B" ${sk(1.8)}/><path d="M50,62 V80 M40,71 H60" stroke="#C99A2E" stroke-width="1.4"/>`;
    s += `<path d="M14,58 C26,54 34,40 50,34 C66,40 74,54 86,58 C70,62 30,62 14,58 Z" fill="#2F2A3A" ${sk()}/><path d="M18,57 C30,53 38,42 50,37 C62,42 70,53 82,57" fill="none" stroke="#F2C84B" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<path d="M50,34 V26" ${sk(3)}/><path d="M44,24 C42,16 48,12 52,16 C54,10 62,10 64,16 C58,16 56,20 58,26 C54,24 50,26 46,28 Z" fill="#F2C84B" ${sk(1.6)}/><circle cx="50" cy="19" r="1" fill="${K}"/>`;
    s += [26, 74].map((x) => `<path d="M${x},62 V76" stroke="#8E5BB8" stroke-width="2.4" stroke-linecap="round"/><path d="M${x - 3},76 h6 l-1 6 h-4 Z" fill="#8E5BB8" ${sk(1.2)}/>`).join("");
    return s;
  };

  // ---- 4. ミニ スポーツ ----
  const soccer = () => {
    let s = disc("#9ED3A8", 30) + `<circle cx="50" cy="60" r="28" fill="#FFFFFF" ${sk()}/>`;
    const pent = (cx, cy, r, a0 = -90) => `<path d="${Array.from({ length: 5 }, (_, i) => { const t = ((a0 + i * 72) * Math.PI) / 180; return (i ? "L" : "M") + f1(cx + Math.cos(t) * r) + "," + f1(cy + Math.sin(t) * r); }).join(" ")} Z" fill="#3A3A3A"/>`;
    s += pent(50, 60, 8.6);
    for (let i = 0; i < 5; i++) { const t = ((-90 + i * 72) * Math.PI) / 180, x = 50 + Math.cos(t) * 22, y = 60 + Math.sin(t) * 22; s += `<path d="M${f1(50 + Math.cos(t) * 8.6)},${f1(60 + Math.sin(t) * 8.6)} L${f1(50 + Math.cos(t) * 15)},${f1(60 + Math.sin(t) * 15)}" stroke="#3A3A3A" stroke-width="1.6"/>` + pent(x, y, 6.4, -90 + i * 72 + 180); }
    return s + `<circle cx="50" cy="60" r="28" fill="none" ${sk()}/>` + shine("M30,46 q5 -8 14 -10", 3);
  };
  const baseball = () => `${shadow(40)}` + ln("M20,96 L78,26", 7, "#E7C08A") + ln("M72,34 L80,24", 7, "#3A3A3A")
    + `<path d="M16,92 C10,72 18,52 36,48 C46,40 62,44 66,56 C80,58 84,76 74,90 C62,100 30,102 16,92 Z" fill="#C98E5C" ${sk()}/><path d="M24,84 C24,70 34,62 46,62 C58,62 66,72 64,84" fill="none" stroke="#A76E3E" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M36,50 l2 6 M44,46 l1 6 M52,46 l0 6 M60,50 l-1 6" stroke="#8A5A30" stroke-width="2" stroke-linecap="round"/><circle cx="46" cy="76" r="11" fill="#FFFFFF" ${sk(2)}/><path d="M38,70 C42,74 42,80 38,84 M54,70 C50,74 50,80 54,84" fill="none" stroke="#E8434F" stroke-width="1.6" stroke-dasharray="1.6 1.4"/>`;
  const tennis = () => `${shadow(34)}` + ln("M44,98 L52,66", 5.4, "#3A3A3A") + ln("M48,82 L50,74", 5.4, "#F7A9C8")
    + `<path d="M52,66 L46,58 M52,66 L60,60" fill="none" ${sk(3)}/><ellipse cx="54" cy="36" rx="22" ry="27" transform="rotate(12 54 36)" fill="#FFFFFF" fill-opacity="0.6" stroke="${K}" stroke-width="5"/><ellipse cx="54" cy="36" rx="22" ry="27" transform="rotate(12 54 36)" fill="none" stroke="#5FA8D9" stroke-width="3"/>`
    + `<g transform="rotate(12 54 36)">${[-14, -7, 0, 7, 14].map((d) => `<path d="M${54 + d},${12 + Math.abs(d) * 0.5} V${60 - Math.abs(d) * 0.5}" stroke="#B9C2CE" stroke-width="1.2"/>`).join("")}${[-18, -9, 0, 9, 18].map((d) => `<path d="M${36 + Math.abs(d) * 0.45},${36 + d} H${72 - Math.abs(d) * 0.45}" stroke="#B9C2CE" stroke-width="1.2"/>`).join("")}</g>`
    + `<circle cx="24" cy="86" r="10" fill="#D8E84A" ${sk(2)}/><path d="M16,80 C22,84 22,90 17,94 M32,80 C26,84 26,90 31,94" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`;
  const trophy = () => `${shadow(30)}<rect x="28" y="88" width="44" height="12" rx="2" fill="#5B3A28" ${sk(2.2)}/><rect x="34" y="80" width="32" height="9" rx="2" fill="#F2C84B" ${sk(2)}/><rect x="45" y="64" width="10" height="17" fill="#F2C84B" ${sk(2)}/>`
    + ln("M28,26 C14,26 14,48 34,50", 3.4, "#F2C84B") + ln("M72,26 C86,26 86,48 66,50", 3.4, "#F2C84B")
    + `<path d="M26,18 L74,18 C74,44 64,62 50,64 C36,62 26,44 26,18 Z" fill="#F7D35B" ${sk()}/><path d="M33,24 C33,40 38,52 46,58" fill="none" stroke="#FFF2B0" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M50,30 l3.2 6.4 7 1 -5 4.9 1.2 7 -6.4 -3.4 -6.4 3.4 1.2 -7 -5 -4.9 7 -1 Z" fill="#FFFFFF" ${sk(1.4)}/><path d="M38,88 L36,100 L42,96 L46,100 L46,88 Z M62,88 L64,100 L58,96 L54,100 L54,88 Z" fill="#E8434F" ${sk(1.4)}/><path d="M24,18 H76" ${sk(3.4)}/>`;

  // ---- フィギュア（id → 100×110）----
  const pen = spCol("penguin", 0), seal = spCol("seal", 0), otter = spCol("otter", 0);
  const FIG = {
    gacha_machisea_0: () => svg(100, 110, ice() + seaMachi("penguin", { col: pen[0], foot: "#F2A33A" })),
    gacha_machisea_1: () => svg(100, 110, ice(42) + seaMachi("seal", { col: seal[0] })),
    gacha_machisea_2: () => svg(100, 110, rock() + seaMachi("otter", { col: otter[0], extra: shell(50, 82, 0.9) })),
    gacha_machisea_3: () => svg(100, 110, ice(44) + seaMachi("bear", { col: "#FFFFFF", col2: "#F4F1EA" }) + fishBit(82, 94)),
    gacha_squishfruit_0: () => svg(100, 110, strawberry()),
    gacha_squishfruit_1: () => svg(100, 110, mikan()),
    gacha_squishfruit_2: () => svg(100, 110, momo()),
    gacha_squishfruit_3: () => svg(100, 110, melonFruit()),
    gacha_minimatsuri_0: () => svg(100, 110, takoyaki()),
    gacha_minimatsuri_1: () => svg(100, 110, wataame()),
    gacha_minimatsuri_2: () => svg(100, 110, kakigori()),
    gacha_minimatsuri_3: () => svg(100, 110, mikoshi()),
    gacha_minisports_0: () => svg(100, 110, soccer()),
    gacha_minisports_1: () => svg(100, 110, baseball()),
    gacha_minisports_2: () => svg(100, 110, tennis()),
    gacha_minisports_3: () => svg(100, 110, trophy()),
  };
  Object.assign(A.FIG, FIG); Object.assign(GachaArt.FIG, FIG); // GachaForestArt.figure（4F の 絵）と GachaArt.figure（ガチャの がめん・へや）の どちらでも

  // ---- シリーズ（[なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … もちもの）----
  // isle: はいる しま（js/gacha-forest.js の ISLES の id）
  const SERIES = [
    { id: "machisea", isle: "machi", name: "うみの まちぼうけ", kind: "furn", color: "#7CCFD6", caps: ["#BFE6F7", "#FFFFFF", "#D6EEF8"], items: [
      ["まちぼうけ ペンギン", "こおりの うえで ひざを かかえる ペンギン。"],
      ["まちぼうけ アザラシ", "まんまるの からだで じっと まつ アザラシ。"],
      ["まちぼうけ ラッコ", "かいがらを だいじに もって まつ ラッコ。"],
      ["まちぼうけ しろくま", "こおりの うえで しょんぼり まつ しろくま。レアの フィギュア。"],
    ] },
    { id: "squishfruit", isle: "squish", name: "フルーツ スクイーズ", kind: "furn", squish: true, color: "#F7A08E", caps: ["#FFB3B3", "#FFFFFF", "#FFE07A"], items: [
      ["いちご スクイーズ", "つぶつぶの いちご。さわると むにっ。"],
      ["みかん スクイーズ", "はっぱの ついた みかん。さわると むにっ。"],
      ["もも スクイーズ", "ほっぺみたいな もも。さわると むにっ。"],
      ["メロン スクイーズ", "あみめの メロン。レアの スクイーズ。"],
    ] },
    { id: "pouchsea", isle: "pouch", name: "うみの ポーチ", kind: "wear", hand: true, color: "#5FA8D9", caps: ["#9FD8F2", "#FFFFFF", "#BFE6F7"], items: [
      ["さかなの ポーチ", "みずいろの さかなの ポーチ。", "hand", "gacha_pouch", ["#9FD8F2", "#4F98C2", "fish"]],
      ["クジラの ポーチ", "しおを ふく クジラの ポーチ。", "hand", "gacha_pouch", ["#8FB6E8", "#5E86B8", "whale"]],
      ["タコの ポーチ", "くるくる あしの タコの ポーチ。", "hand", "gacha_pouch", ["#F7A08E", "#D1655B", "octopus"]],
      ["シャチの ポーチ", "しろと くろの シャチ。レアの ポーチ。", "hand", "gacha_pouch", ["#3A3A3A", "#5A6078", "orca"]],
    ] },
    { id: "mejiyasai", isle: "meji", name: "おやさい めじるし", kind: "wear", hand: true, color: "#F4A04A", caps: ["#FFB25B", "#FFFFFF", "#C8E6A0"], items: [
      ["にんじんの めじるし", "すいとうの ひもに つける にんじんの マスコット。", "hand", "gacha_mejirushi", ["#FFE0B2", "carrot"]],
      ["トマトの めじるし", "まっかな トマトの マスコット。", "hand", "gacha_mejirushi", ["#FFCDD2", "tomato"]],
      ["なすの めじるし", "つやつやの なすの マスコット。", "hand", "gacha_mejirushi", ["#E1BEE7", "eggplant"]],
      ["かぼちゃの めじるし", "にっこり かぼちゃの マスコット。レアの めじるし。", "hand", "gacha_mejirushi", ["#FFF3C4", "pumpkin"]],
    ] },
    { id: "minimatsuri", isle: "mini", name: "ミニ おまつり", kind: "furn", color: "#EF6F7D", caps: ["#F7A9C8", "#FFFFFF", "#FFE07A"], items: [
      ["ミニ たこやき", "ソースと あおのりの たこやき。たべられないよ。"],
      ["ミニ わたあめ", "ふわふわ ピンクの わたあめ。"],
      ["ミニ かきごおり", "いちごと レモンの かきごおり。"],
      ["ミニ おみこし", "きんの とりが のった おみこし。レアの ミニチュア。"],
    ] },
    { id: "minisports", isle: "goods", name: "ミニ スポーツ", kind: "furn", color: "#5DBB8A", caps: ["#C8E6A0", "#FFFFFF", "#BFE6F7"], items: [
      ["ミニ サッカーボール", "だいに のった サッカーボール。"],
      ["ミニ バットと グローブ", "やきゅうの バットと グローブと ボール。"],
      ["ミニ テニスラケット", "ラケットと きいろい ボール。"],
      ["ミニ ゆうしょうカップ", "きんいろに かがやく カップ。レアの ミニチュア。"],
    ] },
  ].map((S) => ({ ...S, forest: true, more: true }));
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  const index = Object.fromEntries(SERIES.map((S) => [S.id, S.index]));
  for (const S of SERIES.filter((x) => x.squish)) for (const it of S.list) GachaForest.squishable(it.id);

  // ---- しまに たす（しゅうがわり）: add … まわる シリーズ・rest … さいしょの しゅう〔2026-09-28〜〕に やすむ もとの シリーズ（ids の ばんごう）----
  // ずっと いた 3だいの うち 1だいが やすみ、その 台に あたらしい シリーズが はいる（のこりの 2だいは おなじ 台の まま）。
  // やすむ じゅんは rest → rest+1 → rest+2 → あたらしい シリーズ（4しゅうで ひとまわり）。にた なかまと いれかわる・3にんの まちぼうけ／めじるしは いちばん あと
  const REST = { machi: 1, squish: 2, pouch: 1, meji: 1, mini: 2, goods: 1 };
  for (const I of GachaForest.ISLES) { const S = SERIES.find((x) => x.isle === I.id); if (S) { I.add = [S.id]; I.rest = REST[I.id] || 0; } }

  return { SERIES, first, index, FIG, REST };
})();
