// Meeときょれじゃ 2F の ガチャ コーナーの あたらしい 4シリーズと しゅうがわりの くみ（UI-63。オーナーの FB 2026-10-03「ときょれじゃの景品やガチャガチャの中身は、定期的に変わるようにしろ。そのための機能と景品も実装しておけ」）。
// ・2F の 12だいを 3だいずつ 4くみ（おくの れつの ひだり・みぎ／てまえの れつの ひだり・みぎ）に わけ、くみごとに 1シリーズ たして 4シリーズで まわす
//   （しくみは 4F の しまと おなじ js/mee-rotation.js。まいしゅう げつようびに くみごとに 1だいずつ いれかわる）。
// ・おく ひだり（なかよし・すやすや・スイーツ）＋ おかしの おうち／おく みぎ（のりもの・どうぶつ みみ・キラキラ）＋ はたらく くるま／
//   てまえ ひだり（どうぶつえん・パン・きょうりゅう）＋ ころころ むしさん／てまえ みぎ（ヘアアクセ・ネックレス・パーティー）＋ ゆかいな めがね。
// ・しくみ・ねだん・かくりつは いままでの ガチャと おなじ（js/gacha.js）。Gacha.add で 39〜42 ばん（js/gacha-forest-more.js の あと・js/mee-rotation.js の まえに よむ）。
// ・めがねの かたち 4つは WEAR.gacha_*（chara.js の eyeWrap で め に あわせる・うしろ すがたは かかない）。フィギュアは 100×110 の 絵。
// ・セーブ: Save.d.gacha（まえと おなじ）。あたらしい ばしょは ない（台は js/ike-arcade.js の 2F の 12だい）。
const GachaCornerMore = (() => {
  const A = GachaForestArt, K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const { svg, sk, shadow, face, shine, stump } = A;
  const ln = (d, w, col) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; // ふちどりの ある ふとい 線
  const dot = (x, y, r, c, w = 1.4) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}" ${sk(w)}/>`;
  // いちご（ちいさい・やねの うえ）
  const berry = (x, y, s = 1) => `<path d="M${x},${f1(y + 8 * s)} C${f1(x - 7 * s)},${f1(y + 4 * s)} ${f1(x - 7 * s)},${f1(y - 4 * s)} ${x},${f1(y - 3 * s)} C${f1(x + 7 * s)},${f1(y - 4 * s)} ${f1(x + 7 * s)},${f1(y + 4 * s)} ${x},${f1(y + 8 * s)} Z" fill="#F0525E" ${sk(1.6)}/>`
    + `<path d="M${f1(x - 4.5 * s)},${f1(y - 3 * s)} L${x},${f1(y - 6.5 * s)} L${f1(x + 4.5 * s)},${f1(y - 3 * s)} Z" fill="#6DBE5A" ${sk(1.2)}/>` + [[-2.4, 0.5], [2.4, 0.5], [0, 3.6]].map(([dx, dy]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" r="${f1(0.7 * s)}" fill="#FFE07A"/>`).join("");

  // ---- 1. おかしの おうち（ミニチュア。おさらの うえ）----
  const SPR = ["#FF8FB1", "#7FD3F0", "#FFE07A", "#9ED36A", "#B79BEA"];
  const plate = (rim) => `${shadow(44, 104)}<ellipse cx="50" cy="98" rx="44" ry="8.5" fill="${rim}" ${sk(2.2)}/><ellipse cx="50" cy="96.6" rx="37" ry="5.6" fill="#FFFFFF" opacity="0.7"/>`
    + [[14, 99, 30], [24, 102, -20], [78, 102, 25], [87, 98, -35], [70, 104, 70]].map(([x, y, a], i) => `<rect x="${x - 2.6}" y="${y - 1}" width="5.2" height="2" rx="1" fill="${SPR[i]}" transform="rotate(${a} ${x} ${y})"/>`).join("");
  const arch = (x0, x1, y0, y1, c, knob) => `<path d="M${x0},${y1} L${x0},${f1(y0 + (x1 - x0) / 2)} C${x0},${f1(y0 - 1)} ${x1},${f1(y0 - 1)} ${x1},${f1(y0 + (x1 - x0) / 2)} L${x1},${y1} Z" fill="${c}" ${sk(2)}/>` + (knob ? `<circle cx="${f1(x1 - 3.4)}" cy="${f1((y0 + y1) / 2 + 3)}" r="1.4" fill="${knob}"/>` : "");
  const cookieHouse = () => {
    let s = plate("#CFEFE0");
    s += `<rect x="61" y="32" width="9" height="20" rx="1.4" fill="#C98A4E" ${sk(2)}/><path d="M59,33 C59,28 72,28 72,33 C70,35 61,35 59,33 Z" fill="#FFFFFF" ${sk(1.6)}/>`; // えんとつ（ゆきの アイシング）
    s += `<path d="M26,94 L26,57 L74,57 L74,94 Z" fill="#D9A066" ${sk()}/>` + [[31, 80], [69, 80], [33, 89], [67, 89], [48, 63]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#B7793F"/>`).join("");
    for (const x of [30, 60]) s += `<rect x="${x}" y="64" width="10" height="10" rx="1.6" fill="#FFF3B0" ${sk(1.8)}/><path d="M${x + 5},64 V74 M${x},69 H${x + 10}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    s += arch(43, 57, 74, 94, "#8B5A3C", "#FFE07A") + `<path d="M43,82 h14" stroke="#B07850" stroke-width="1.2"/>`;
    s += `<path d="M17,61 L50,28 L83,61 Z" fill="#A9693A" ${sk()}/>`; // やね（チョコ クッキー）
    s += `<path d="M18,61 Q22,67 26,61 Q30,67 34,61 Q38,67 42,61 Q46,67 50,61 Q54,67 58,61 Q62,67 66,61 Q70,67 74,61 Q78,67 82,61" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M25,55 L50,31 L75,55" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 3"/>`;
    s += dot(38, 50, 3.4, "#FF8FB1") + dot(50, 40, 3.4, "#7FD3F0") + dot(62, 50, 3.4, "#9ED36A") + dot(44, 56, 2.6, "#FFE07A") + dot(56, 56, 2.6, "#B79BEA");
    s += ln("M80,94 V72 C80,64 90,64 90,72", 4.2, "#FFFFFF") + `<path d="M80,94 V72 C80,64 90,64 90,72" fill="none" stroke="#F0525E" stroke-width="4.2" stroke-dasharray="3 3"/>`; // キャンディ ケーン
    return s + `<path d="M28,92 L28,60" stroke="#E7B97C" stroke-width="2" stroke-linecap="round"/>`;
  };
  const chocoHouse = () => {
    let s = plate("#F7C6D9");
    s += `<rect x="24" y="56" width="52" height="38" rx="2" fill="#7A4A2E" ${sk()}/>`;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = 26.6 + i * 12.4, y = 58.6 + j * 11.8; if (i > 0 && i < 3 && j > 0) continue; s += `<rect x="${f1(x)}" y="${f1(y)}" width="10" height="9.6" rx="1.6" fill="#8E5A3A"/><path d="M${f1(x + 1.4)},${f1(y + 8)} V${f1(y + 1.4)} H${f1(x + 8.6)}" fill="none" stroke="#A8724C" stroke-width="1.2" stroke-linecap="round"/>`; }
    s += arch(42, 58, 70, 94, "#FFF3DD", "#8E5A3A") + `<path d="${heartPath(50, 79, 0.7)}" fill="#FF8FA8"/>`;
    s += dot(33, 66, 4.6, "#FF8FA8", 1.8) + dot(67, 66, 4.6, "#FF8FA8", 1.8) + `<circle cx="31.6" cy="64.6" r="1.4" fill="#FFFFFF"/><circle cx="65.6" cy="64.6" r="1.4" fill="#FFFFFF"/>`;
    // やね（ウエハース）: ななめの こうし
    const L = (y) => 16 + (58 - y) * (14 / 26), Rr = (y) => 84 - (58 - y) * (14 / 26);
    s += `<path d="M16,58 L30,32 L70,32 L84,58 Z" fill="#F2CF8E" ${sk()}/>`;
    s += [38.5, 45, 51.5].map((y) => `<path d="M${f1(L(y))},${y} H${f1(Rr(y))}" stroke="#D9AE62" stroke-width="1.4"/>`).join("");
    s += [0.2, 0.4, 0.6, 0.8].map((t) => `<path d="M${f1(30 + t * 40)},32 L${f1(16 + t * 68)},58" stroke="#D9AE62" stroke-width="1.4"/>`).join("");
    s += `<path d="M16,58 L84,58 L84,61 Q81,67 77,61 Q74,70 69,61 Q65,65 61,61 Q57,69 52,61 Q48,66 44,61 Q40,70 35,61 Q31,66 27,61 Q23,68 19,61 L16,61 Z" fill="#5A3420" ${sk(1.6)}/>`; // チョコの たれ
    s += `<path d="M30,32 L70,32" ${sk()}/>` + berry(50, 25, 1.25) + berry(36, 29, 0.8) + berry(64, 29, 0.8);
    return s;
  };
  const macaronHouse = () => {
    let s = plate("#CDE8F8");
    const shellC = "#F7A9C8", feet = "#E58AB0";
    s += `<path d="M17,80 C17,75 83,75 83,80 L83,88 C83,97 17,97 17,88 Z" fill="${shellC}" ${sk()}/><path d="M19,80 Q22,83 25,80 Q28,83 31,80 Q34,83 37,80 Q40,83 43,80 Q46,83 49,80 Q52,83 55,80 Q58,83 61,80 Q64,83 67,80 Q70,83 73,80 Q76,83 79,80" fill="none" stroke="${feet}" stroke-width="1.8" stroke-linecap="round"/>`;
    s += `<path d="M19,77 C19,72 81,72 81,77 C78,80 74,76 70,79 C66,76 62,80 58,77 C54,80 50,76 46,79 C42,76 38,80 34,77 C30,80 26,76 22,79 Z" fill="#FFFFFF" ${sk(1.8)}/>`; // クリーム
    s += `<path d="M17,74 C17,44 83,44 83,74 C83,76 17,76 17,74 Z" fill="${shellC}" ${sk()}/><path d="M19,73 Q22,76 25,73 Q28,76 31,73 Q34,76 37,73 Q40,76 43,73 Q46,76 49,73 Q52,76 55,73 Q58,76 61,73 Q64,76 67,73 Q70,76 73,73 Q76,76 79,73" fill="none" stroke="${feet}" stroke-width="1.8" stroke-linecap="round"/>`;
    s += shine("M26,64 q4 -10 14 -13", 2.6);
    s += `<circle cx="50" cy="60" r="7.6" fill="#FFF3B0" ${sk(2)}/><path d="M50,52.4 V67.6 M42.4,60 H57.6" stroke="#E58AB0" stroke-width="1.8"/>`; // まるい まど
    s += arch(43, 57, 76, 94, "#FFFFFF", "#E58AB0") + `<path d="M43,84 h14" stroke="#F7C6D9" stroke-width="1.4"/>`;
    // やねの うえの ミント マカロンと さくらんぼ
    s += `<path d="M36,47 C36,43 64,43 64,47 L64,49 C64,53 36,53 36,49 Z" fill="#A8E0C8" ${sk(1.8)}/><path d="M37,45 C37,41 63,41 63,45 Z" fill="#FFFFFF" ${sk(1.4)}/><path d="M36,44 C36,35 64,35 64,44 C64,45 36,45 36,44 Z" fill="#A8E0C8" ${sk(1.8)}/>`;
    s += ln("M50,36 C50,30 54,26 58,24", 1.6, "#6DA84E") + dot(50, 33, 4.6, "#E8262A", 1.6) + `<circle cx="48.6" cy="31.6" r="1.4" fill="#FFFFFF"/>`;
    return s;
  };
  const candyCastle = () => {
    let s = plate("#F7C948") + [[30, 103, 10], [62, 104, -15], [46, 105, 40]].map(([x, y, a], i) => `<rect x="${x - 2.6}" y="${y - 1}" width="5.2" height="2" rx="1" fill="${SPR[(i + 2) % 5]}" transform="rotate(${a} ${x} ${y})"/>`).join("");
    // よこの とう（キャンディ ストライプ）と ペロペロ キャンディ
    for (const [x, c] of [[14, "#A8E0C8"], [70, "#C9B6EE"]]) {
      s += `<rect x="${x}" y="54" width="16" height="40" fill="#FFFFFF" ${sk()}/>` + [58, 66, 74, 82, 90].map((y) => `<rect x="${x}" y="${y}" width="16" height="3.6" fill="#FF8FB1"/>`).join("") + `<rect x="${x}" y="54" width="16" height="40" fill="none" ${sk()}/>`;
      s += `<path d="M${x - 3},55 L${x + 8},36 L${x + 19},55 Z" fill="${c}" ${sk(2.2)}/>` + ln(`M${x + 8},36 V27`, 1.6, "#FFFFFF");
      s += `<circle cx="${x + 8}" cy="22" r="6" fill="#FFE07A" ${sk(1.6)}/><path d="M${x + 8},22 m-3.4,0 a3.4 3.4 0 1 1 3.4 3.4 a1.8 1.8 0 1 1 -1.8 -1.8" fill="none" stroke="#FF8FB1" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    // まんなかの とう（ピンクの ウエハース）・ソフトクリームの やね
    s += `<rect x="31" y="46" width="38" height="48" fill="#FFE3EF" ${sk()}/>` + [56, 66, 76].map((y) => `<path d="M31,${y} H69" stroke="#F7C6D9" stroke-width="1.6"/>`).join("") + `<rect x="31" y="46" width="38" height="48" fill="none" ${sk()}/>`;
    s += [33, 41, 49, 57, 65].map((x) => `<rect x="${x}" y="40" width="6" height="7" rx="1.4" fill="#FFE3EF" ${sk(1.6)}/>`).join(""); // うえの ぎざぎざ
    s += `<path d="M36,41 L50,13 L64,41 Z" fill="#E8B06A" ${sk(2.2)}/>` + [[40, 33, 60, 33], [43, 27, 57, 27], [46, 21, 54, 21]].map(([a, b, c, d]) => `<path d="M${a},${b} H${c}" stroke="#C98E4E" stroke-width="1.2"/>`).join("") + `<path d="M42,37 L54,17 M48,39 L58,22 M58,39 L46,18" stroke="#C98E4E" stroke-width="1.2"/>`;
    s += `<path d="M34,42 C34,36 40,36 42,38 C44,34 56,34 58,38 C60,36 66,36 66,42 C62,46 58,43 56,46 C52,43 48,46 44,43 C40,47 36,45 34,42 Z" fill="#FFFFFF" ${sk(1.8)}/>`;
    s += ln("M50,13 V4", 1.4, "#FFFFFF") + `<path d="M51,4 L60,7 L51,10 Z" fill="#FF8FB1" ${sk(1.2)}/>` + dot(50, 14, 2.6, "#E8262A", 1.2);
    s += arch(43, 57, 74, 94, "#7A4A2E", "#FFE07A") + `<path d="${heartPath(50, 59, 1)}" fill="#FF8FB1" ${sk(1.6)}/>`;
    s += dot(36, 84, 2.6, "#7FD3F0") + dot(64, 84, 2.6, "#9ED36A") + dot(36, 64, 2.2, "#FFE07A") + dot(64, 64, 2.2, "#B79BEA");
    return s;
  };

  // ---- 2. はたらく くるま（どうろの だい）----
  const road = () => `${shadow(46, 104)}<path d="M6,95 C6,89 94,89 94,95 C94,102 6,102 6,95 Z" fill="#9A98A8" ${sk(2.2)}/><path d="M16,96 H28 M44,96 H56 M72,96 H84" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
  const wheel = (x, y, r = 7.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4F4A60" ${sk(2)}/><circle cx="${x}" cy="${y}" r="${f1(r * 0.42)}" fill="#D9D4E8" ${sk(1)}/>`;
  const win = (d) => `<path d="${d}" fill="#BFE6F7" ${sk(1.8)}/>`;
  const patrol = () => {
    const body = "M8,85 L8,70 C8,66 11,64 16,64 L28,64 L38,52 C40,50 42,49 46,49 L66,49 C70,49 72,50 74,52 L82,64 L88,64 C92,64 94,67 94,71 L94,85 Z";
    let s = road() + `<rect x="50" y="42" width="14" height="7" rx="2.4" fill="#FF5A5A" ${sk(1.8)}/><path d="M53,44 h3" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>`;
    s += `<path d="${body}" fill="#FFFFFF" ${sk()}/><path d="M8,74 H94 V85 H8 Z" fill="#33313F"/><path d="${body}" fill="none" ${sk()}/>`;
    s += win("M41,62 L47,53 L58,53 L58,62 Z") + win("M61,62 L61,53 L69,53 L76,62 Z") + `<path d="M59.5,53 V74" stroke="${K}" stroke-width="1.4"/>`;
    s += `<path d="${starPath(36, 69, 3.4, 1.5)}" fill="#F7C948" ${sk(1)}/>` + dot(91, 69, 2.2, "#FFE066", 1) + dot(10.5, 70, 1.8, "#FF7B7B", 1);
    return s + wheel(27, 86) + wheel(75, 86);
  };
  const ambulance = () => {
    const body = "M7,85 L7,49 C7,45 9,43 13,43 L66,43 C70,43 72,45 74,48 L83,62 L89,63 C92,64 94,67 94,71 L94,85 Z";
    let s = road() + `<rect x="56" y="37" width="12" height="6" rx="2" fill="#FF5A5A" ${sk(1.6)}/>`;
    s += `<path d="${body}" fill="#FFFFFF" ${sk()}/><path d="M7,66 H94 V71 H7 Z" fill="#F06A55"/><path d="M7,74 H94" stroke="#F06A55" stroke-width="1.6"/><path d="${body}" fill="none" ${sk()}/>`;
    s += win("M69,49 L77,61 L69,61 Z") + win("M14,49 L30,49 L30,59 L14,59 Z");
    s += `<text x="47.6" y="57" font-size="5.4" font-weight="900" text-anchor="middle" fill="#F06A55" font-family="'M PLUS Rounded 1c',sans-serif">きゅうきゅう</text>`;
    s += `<path d="M66,43 V85" stroke="${K}" stroke-width="1.2" opacity="0.6"/>` + dot(91, 68, 2.2, "#FFE066", 1);
    return s + wheel(25, 86) + wheel(76, 86);
  };
  const shovel = () => {
    let s = road() + `<path d="M80,96 C82,88 92,86 96,92 C97,95 92,97 86,97 Z" fill="#C49A6C" ${sk(1.6)}/>`; // つち
    s += `<rect x="10" y="78" width="56" height="14" rx="7" fill="#4F4A60" ${sk(2.2)}/>` + [18, 30, 42, 54].map((x) => `<circle cx="${x + 2}" cy="85" r="4" fill="#8C88A0" ${sk(1.2)}/>`).join("");
    s += `<rect x="12" y="64" width="46" height="15" rx="3" fill="#F5B731" ${sk()}/><rect x="8" y="66" width="8" height="12" rx="2" fill="#D9982A" ${sk(1.8)}/>`;
    s += `<path d="M20,64 L20,46 C20,44 22,42 24,42 L38,42 C41,42 42,44 42,46 L42,64 Z" fill="#F5B731" ${sk()}/>` + win("M24,46 L38,46 L38,60 L24,60 Z") + `<path d="M26,58 L34,48" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`;
    s += ln("M50,68 L70,40", 6, "#F5B731") + ln("M70,40 L86,64", 5, "#F5B731") + dot(70, 40, 3, "#D9982A", 1.4) + dot(50, 68, 3, "#D9982A", 1.4);
    s += `<path d="M79,64 L95,62 L93,79 C89,84 82,82 80,77 Z" fill="#8C88A0" ${sk(2)}/><path d="M80,77 l-2 4 M84,80 l-1.4 4.4 M89,80 l0.4 4.6" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/><path d="M82,67 L92,66" stroke="#B9B5C8" stroke-width="1.6" stroke-linecap="round"/>`;
    return s;
  };
  const ladderTruck = () => {
    const body = "M5,85 L5,62 C5,58 7,56 11,56 L63,56 L63,52 C63,49 65,48 68,48 L80,48 C84,48 86,50 88,53 L94,63 C95,65 96,67 96,71 L96,85 Z";
    let s = road();
    // はしご（うしろ）と かご・こねこ
    s += ln("M38,54 L14,20", 2.4, "#E9EEF5") + ln("M44,52 L20,18", 2.4, "#E9EEF5") + [0.18, 0.34, 0.5, 0.66, 0.82].map((t) => `<path d="M${f1(38 - 24 * t)},${f1(54 - 34 * t)} L${f1(44 - 24 * t)},${f1(52 - 34 * t)}" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>`).join("");
    s += `<path d="M10,7 L13,5 L16,8 M22,6 L25,4 L27,8" fill="#F2C9A0" ${sk(1.4)}/><circle cx="18.5" cy="11" r="7" fill="#F7E1C4" ${sk(1.6)}/>` + face(18.5, 11.5, 0.55);
    s += `<rect x="5" y="13" width="26" height="9" rx="2" fill="#E8433F" ${sk(2)}/><path d="M7,17 H29" stroke="#FFFFFF" stroke-width="1.4"/>`;
    s += `<path d="${body}" fill="#E8433F" ${sk()}/><path d="M5,72 H96 V75 H5 Z" fill="#FFFFFF"/><path d="${body}" fill="none" ${sk()}/>`;
    s += win("M67,52 L80,52 L86,62 L67,62 Z") + `<rect x="68" y="44" width="12" height="4.6" rx="1.6" fill="#FFE066" ${sk(1.4)}/>`;
    s += `<ellipse cx="41" cy="55" rx="9" ry="3.4" fill="#C9CDD8" ${sk(1.8)}/><rect x="11" y="61" width="44" height="8" rx="2" fill="#F26A62" ${sk(1.4)}/>` + [17, 25, 33, 41, 49].map((x) => `<path d="M${x},61 V69" stroke="${K}" stroke-width="1.1"/>`).join("");
    s += dot(93, 69, 2.2, "#FFE066", 1);
    return s + wheel(20, 86) + wheel(50, 86) + wheel(80, 86);
  };

  // ---- 3. ころころ むしさん（はっぱ・はな・きりかぶの だい）----
  const leafBase = (col = "#8CCB6B") => `${shadow(42, 104)}<path d="M6,96 C18,84 72,82 94,92 C82,104 30,107 6,96 Z" fill="${col}" ${sk(2.2)}/><path d="M12,95 C36,91 64,90 88,92" fill="none" stroke="${shade(col, -0.25)}" stroke-width="1.6" stroke-linecap="round"/>`
    + [[30, 93, 24, 99], [50, 92, 44, 101], [70, 91, 64, 100], [40, 92.5, 46, 87], [62, 91.5, 68, 86.5]].map(([a, b, c, d]) => `<path d="M${a},${b} L${c},${d}" stroke="${shade(col, -0.25)}" stroke-width="1.2" stroke-linecap="round"/>`).join("");
  const eyes = (cx, cy, s = 1) => [-1, 1].map((d) => `<circle cx="${f1(cx + d * 6 * s)}" cy="${f1(cy)}" r="${f1(3.6 * s)}" fill="#FFFFFF" ${sk(1.2)}/><circle cx="${f1(cx + d * 6 * s + 0.6)}" cy="${f1(cy + 0.4)}" r="${f1(1.9 * s)}" fill="${K}"/><circle cx="${f1(cx + d * 6 * s + 1.2)}" cy="${f1(cy - 0.6)}" r="${f1(0.7 * s)}" fill="#FFFFFF"/>`).join("")
    + [-1, 1].map((d) => `<ellipse cx="${f1(cx + d * 10.5 * s)}" cy="${f1(cy + 4.6 * s)}" rx="${f1(2.8 * s)}" ry="${f1(1.7 * s)}" fill="#F7A0B4" opacity="0.8"/>`).join("") + `<path d="M${f1(cx - 2.4 * s)},${f1(cy + 4 * s)} q${f1(2.4 * s)} ${f1(2.6 * s)} ${f1(4.8 * s)} 0" fill="none" stroke="#FFFFFF" stroke-width="${f1(1.5 * s)}" stroke-linecap="round"/>`;
  const ladybug = () => {
    let s = leafBase();
    s += [[24, 88, 16, 94], [24, 80, 15, 82], [76, 88, 84, 94], [76, 80, 85, 82]].map(([a, b, c, d]) => `<path d="M${a},${b} L${c},${d}" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`).join("");
    s += `<ellipse cx="50" cy="68" rx="29" ry="24" fill="#F0453F" ${sk()}/><path d="M50,44 V86" stroke="${K}" stroke-width="2"/>`;
    s += [[36, 58, 5], [64, 58, 5], [33, 74, 4.2], [67, 74, 4.2], [42, 84, 3], [58, 84, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2F2A3A"/>`).join("") + shine("M28,56 q4 -9 12 -11");
    s += ln("M44,76 C40,66 36,62 30,60", 1.4, "#2F2A3A") + ln("M56,76 C60,66 64,62 70,60", 1.4, "#2F2A3A") + dot(30, 60, 2.4, "#2F2A3A", 1) + dot(70, 60, 2.4, "#2F2A3A", 1);
    s += `<ellipse cx="50" cy="83" rx="15" ry="11" fill="#2F2A3A" ${sk(2.2)}/>` + eyes(50, 82, 0.95);
    return s;
  };
  const snail = () => {
    let s = leafBase("#9ED36A") + `<path d="M86,90 c-2,-4 2,-7 3,-4 c1,3 -1,5 -3,4 Z" fill="#DFF3FB" ${sk(1)}/>`;
    s += `<path d="M12,92 C12,86 18,84 26,84 L66,84 C72,84 74,78 74,70 L74,62 C74,54 90,54 90,62 L90,82 C90,90 84,93 76,93 L16,93 C13,93 12,93 12,92 Z" fill="#FFE3B0" ${sk()}/>`;
    s += ln("M77,57 C75,49 72,44 70,40", 1.6, "#FFE3B0") + ln("M86,57 C88,49 91,45 93,41", 1.6, "#FFE3B0") + dot(70, 39, 3, "#FFE3B0", 1.4) + dot(93, 40, 3, "#FFE3B0", 1.4) + `<circle cx="70" cy="39" r="1.3" fill="${K}"/><circle cx="93" cy="40" r="1.3" fill="${K}"/>`;
    s += face(82, 68, 0.8);
    // からの うずまき
    let sp = ""; for (let i = 0; i <= 44; i++) { const t = i * 0.3, r = 2 + t * 1.32, x = 42 + Math.cos(t + 2.4) * r, y = 64 + Math.sin(t + 2.4) * r * 0.92; sp += (i ? " L" : "M") + f1(x) + "," + f1(y); }
    s += `<circle cx="42" cy="64" r="22" fill="#F7B26A" ${sk()}/><path d="${sp}" fill="none" stroke="#D9853A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` + shine("M26,58 q4 -10 14 -13", 2.6);
    return s;
  };
  const butterfly = () => {
    // おはなの だい（はなびら 5まい）
    let s = `${shadow(40, 104)}` + [-64, -32, 0, 32, 64].map((dx, i) => `<ellipse cx="${50 + dx * 0.62}" cy="${96 - Math.abs(dx) * 0.06}" rx="13" ry="7.4" fill="${i % 2 ? "#FFC7DA" : "#FFB3CC"}" ${sk(2)}/>`).join("") + `<ellipse cx="50" cy="94" rx="9" ry="4.6" fill="#FFE07A" ${sk(1.8)}/>`;
    // はね（うしろ）
    for (const d of [-1, 1]) {
      s += `<path d="M50,64 C${50 + d * 10},42 ${50 + d * 42},34 ${50 + d * 44},50 C${50 + d * 46},62 ${50 + d * 30},70 50,70 Z" fill="#FFD84D" ${sk(2.2)}/>`;
      s += `<path d="M50,72 C${50 + d * 22},70 ${50 + d * 36},80 ${50 + d * 30},88 C${50 + d * 24},94 ${50 + d * 10},88 50,76 Z" fill="#FFB25B" ${sk(2.2)}/>`;
      s += dot(50 + d * 30, 52, 5, "#FFFFFF", 1.4) + dot(50 + d * 30, 52, 2.4, "#FF8FB1", 0) + dot(50 + d * 22, 82, 3, "#FFFFFF", 1.2);
    }
    s += `<rect x="45" y="58" width="10" height="30" rx="5" fill="#5B4A6E" ${sk(2)}/>` + `<circle cx="50" cy="53" r="8.6" fill="#5B4A6E" ${sk(2)}/>` + eyes(50, 53, 0.62);
    s += ln("M46,46 C44,38 40,34 36,33", 1.2, "#5B4A6E") + ln("M54,46 C56,38 60,34 64,33", 1.2, "#5B4A6E") + dot(36, 33, 2.2, "#5B4A6E", 1) + dot(64, 33, 2.2, "#5B4A6E", 1);
    return s;
  };
  const beetle = () => {
    let s = stump("#B9824E");
    s += [[30, 78, 22, 86], [32, 70, 22, 72], [70, 78, 78, 86], [68, 70, 78, 72]].map(([a, b, c, d]) => `<path d="M${a},${b} L${c},${d}" stroke="${K}" stroke-width="2.8" stroke-linecap="round"/>`).join("");
    s += `<ellipse cx="50" cy="68" rx="22" ry="15" fill="#6B3E26" ${sk()}/><path d="M50,56 V83" stroke="${K}" stroke-width="1.8"/>` + shine("M34,64 q4 -6 11 -7", 2.2) + shine("M56,60 q5 0 9 4", 1.8);
    s += `<ellipse cx="50" cy="53" rx="15" ry="9.6" fill="#5A3320" ${sk(2.2)}/>` + shine("M41,49 q4 -3 9 -3", 1.8);
    // つの: あたまから うえへ そって、さきが ふたまた（むねの みじかい つのも）
    s += `<path d="M44.6,50 C44,41 45.4,33 47.4,27 L43.6,19.6 C43,17.6 45.6,16.6 46.8,18.4 L50,23.4 L53.2,18.4 C54.4,16.6 57,17.6 56.4,19.6 L52.6,27 C54.6,33 56,41 55.4,50 Z" fill="#5A3320" ${sk(2)}/>` + shine("M47.6,44 C47.4,38 48,33 49,29", 1.6);
    s += `<path d="M46,47.6 C47,44.6 48.4,43 50,42.6 C51.6,43 53,44.6 54,47.6 Z" fill="#6B3E26" ${sk(1.4)}/>`;
    s += eyes(50, 55, 0.7);
    return s;
  };

  // ---- 4. ゆかいな めがね（かお・eyeWrap）----
  let spiral = ""; for (let i = 0; i <= 40; i++) { const t = i * 0.42, r = 0.6 + t * 0.78; spiral += (i ? " L" : "M") + f1(Math.cos(t) * r) + "," + f1(Math.sin(t) * r); }
  WEAR.gacha_swirlglasses = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#3A3A48";
      return [-21, 21].map((x) => `<circle cx="${x}" cy="0" r="15" fill="#FFFFFF" fill-opacity="0.94" stroke="${c}" stroke-width="${f1(s * 1.2)}"/><g transform="translate(${x} 0)"><path d="${spiral}" fill="none" stroke="${c}" stroke-width="${f1(s * 0.5)}" stroke-linecap="round" stroke-linejoin="round"/></g>`).join("")
        + `<path d="M-6,-3 C-3,-7 3,-7 6,-3" fill="none" stroke="${c}" stroke-width="${f1(s)}" stroke-linecap="round"/>`;
    }),
  });
  WEAR.gacha_catglasses = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FF8FB8", inner = ctx.col[1] || "#FFFFFF";
      let out = "";
      for (const x of [-21, 21]) {
        out += [-1, 1].map((d) => `<path d="M${x + d * 3},-11 L${x + d * 12},-20 L${x + d * 12},-6 Z" fill="${c}" ${stroke(s * 0.8)}/><path d="M${x + d * 6},-10 L${x + d * 10.4},-14.6 L${x + d * 10.4},-8 Z" fill="${inner}"/>`).join("");
        out += `<circle cx="${x}" cy="1" r="13.5" fill="#FFFFFF" fill-opacity="0.35" stroke="${K}" stroke-width="${f1(s * 1.6)}"/><circle cx="${x}" cy="1" r="13.5" fill="none" stroke="${c}" stroke-width="${f1(s * 0.9)}"/>`;
      }
      out += [-1, 1].map((d) => `<path d="M${d * 35},-1 L${d * 45},-4 M${d * 35},4 L${d * 45},5" stroke="${K}" stroke-width="${f1(s * 0.45)}" stroke-linecap="round"/>`).join("");
      return out + `<path d="M-7,-2 C-3,-6 3,-6 7,-2" fill="none" stroke="${c}" stroke-width="${f1(s)}" stroke-linecap="round"/><circle cx="-26" cy="-4" r="2.2" fill="#FFFFFF"/><circle cx="16" cy="-4" r="2.2" fill="#FFFFFF"/>`;
    }),
  });
  WEAR.gacha_flowerglasses = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFD54F", p = ctx.col[1] || "#FF9EC4";
      let out = "";
      for (const x of [-21, 21]) {
        out += [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="-14.6" rx="6.4" ry="7.4" transform="rotate(${x < 0 ? a : -a} ${x} 0)" fill="${p}" ${stroke(s * 0.6)}/>`).join("");
        out += `<circle cx="${x}" cy="0" r="11.6" fill="#FFFFFF" fill-opacity="0.4" stroke="${K}" stroke-width="${f1(s * 1.5)}"/><circle cx="${x}" cy="0" r="11.6" fill="none" stroke="${c}" stroke-width="${f1(s * 0.8)}"/>`;
      }
      return out + `<path d="M-8,-1 C-4,-5 4,-5 8,-1" fill="none" stroke="${c}" stroke-width="${f1(s)}" stroke-linecap="round"/><circle cx="-25" cy="-4" r="2.2" fill="#FFFFFF"/><circle cx="17" cy="-4" r="2.2" fill="#FFFFFF"/>`;
    }),
  });
  const RAINBOW = ["#FF6B6B", "#FFB25B", "#FFE066", "#7CCB6B", "#6FC7EF", "#B79BEA"];
  WEAR.gacha_rainbowgoggle = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#5A6078", fr = ctx.col[1] || "#FFFFFF";
      let out = [-1, 1].map((d) => `<path d="M${d * 34},-1 L${d * 50},-3" stroke="${K}" stroke-width="${f1(s * 2.6)}" stroke-linecap="round"/><path d="M${d * 34},-1 L${d * 50},-3" stroke="${c}" stroke-width="${f1(s * 1.4)}" stroke-linecap="round"/>`).join("");
      for (const x of [-20, 20]) {
        out += `<ellipse cx="${x}" cy="0" rx="17" ry="14" fill="${fr}" ${stroke(s)}/>`;
        out += RAINBOW.map((col, i) => `<ellipse cx="${x}" cy="0" rx="${f1(14 - i * 2.2)}" ry="${f1(11 - i * 1.7)}" fill="${col}"/>`).join("");
        out += `<ellipse cx="${x}" cy="0" rx="14" ry="11" fill="none" stroke="${K}" stroke-width="${f1(s * 0.5)}"/><path d="M${x - 8},-5 q4 -4 9 -4" fill="none" stroke="#FFFFFF" stroke-width="${f1(s * 0.7)}" stroke-linecap="round"/>`;
      }
      return out + `<path d="M-4,-2 L4,-2" fill="none" ${stroke(s)}/>`;
    }),
  });

  // ---- フィギュアの 絵（GachaArt.figure・へや・ラインナップ）----
  const FIG = {
    gacha_okashihouse_0: () => svg(100, 110, cookieHouse()),
    gacha_okashihouse_1: () => svg(100, 110, chocoHouse()),
    gacha_okashihouse_2: () => svg(100, 110, macaronHouse()),
    gacha_okashihouse_3: () => svg(100, 110, candyCastle()),
    gacha_workcar_0: () => svg(100, 110, patrol()),
    gacha_workcar_1: () => svg(100, 110, ambulance()),
    gacha_workcar_2: () => svg(100, 110, shovel()),
    gacha_workcar_3: () => svg(100, 110, ladderTruck()),
    gacha_mushi_0: () => svg(100, 110, ladybug()),
    gacha_mushi_1: () => svg(100, 110, snail()),
    gacha_mushi_2: () => svg(100, 110, butterfly()),
    gacha_mushi_3: () => svg(100, 110, beetle()),
  };
  Object.assign(GachaArt.FIG, FIG); Object.assign(A.FIG, FIG);

  // ---- シリーズ（[なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … アクセサリー）----
  // ring: はいる くみ（下の RINGS の id）
  const SERIES = [
    { id: "okashihouse", ring: "2f-a", name: "おかしの おうち", kind: "furn", color: "#F08A7E", caps: ["#FFC2B8", "#FFFFFF", "#FFE07A"], items: [
      ["クッキーの おうち", "クッキーの かべに アイシングの やねの おうち。"],
      ["チョコの おうち", "いたチョコの かべと ウエハースの やねの おうち。"],
      ["マカロンの おうち", "マカロンを かさねた まるい おうち。"],
      ["おかしの おしろ", "キャンディの とうが ならぶ レアの おしろ。"],
    ] },
    { id: "workcar", ring: "2f-b", name: "はたらく くるま", kind: "furn", color: "#F5B731", caps: ["#FFE07A", "#FFFFFF", "#FF8A80"], items: [
      ["ミニ パトカー", "まちを まもる しろと くろの パトカー。"],
      ["ミニ きゅうきゅうしゃ", "しろに あかい せんの きゅうきゅうしゃ。"],
      ["ミニ ショベルカー", "おおきな バケットで つちを ほる くるま。"],
      ["ミニ はしごしゃ", "はしごの さきで こねこを たすける レアの くるま。"],
    ] },
    { id: "mushi", ring: "2f-c", name: "ころころ むしさん", kind: "furn", color: "#E2574C", caps: ["#FF9C94", "#FFFFFF", "#C8E6A0"], items: [
      ["てんとうむし", "はっぱの うえの まるい てんとうむし。"],
      ["かたつむり", "うずまきの からを せおった かたつむり。"],
      ["ちょうちょ", "おはなに とまった きいろい ちょうちょ。"],
      ["カブトムシ", "りっぱな つのの カブトムシ。レアの フィギュア。"],
    ] },
    { id: "funglasses", ring: "2f-d", name: "ゆかいな めがね", kind: "wear", acc: true, color: "#5C8FE6", caps: ["#AFC8F5", "#FFFFFF", "#FFE07A"], items: [
      ["ぐるぐる めがね", "レンズに うずまきの ゆかいな めがね。", "face", "gacha_swirlglasses", ["#3A3A48"]],
      ["ねこの めがね", "ねこの みみと ひげの めがね。", "face", "gacha_catglasses", ["#FF8FB8", "#FFFFFF"]],
      ["おはなの めがね", "はなびらの ふちの めがね。", "face", "gacha_flowerglasses", ["#FFD54F", "#FF9EC4"]],
      ["にじいろ ゴーグル", "にじいろの レンズの レアの ゴーグル。", "face", "gacha_rainbowgoggle", ["#5A6078", "#FFFFFF"]],
    ] },
  ].map((S) => ({ ...S, corner: true, more: true }));
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  const index = Object.fromEntries(SERIES.map((S) => [S.id, S.index]));

  // ---- 2F の くみ（しゅうがわりの わ。js/mee-rotation.js が よむ）----
  // ids: さいしょの ならび（台の slot 0〜2・js/ike-arcade.js の 2F の 台の ring／slot）・add: あとから まわる シリーズ・rest: さいしょの しゅう〔2026-09-28〜〕に やすむ ids の ばんごう
  // にた なかまと いれかわる（のりもの → はたらく くるま・どうぶつえん → むしさん・パーティー → めがね）。なかよし フィギュアは いちばん あとに やすむ
  const RINGS = [
    { id: "2f-a", name: "おくの れつの ひだり", ids: ["friends", "sleepy", "sweets"], add: ["okashihouse"], rest: 1 },
    { id: "2f-b", name: "おくの れつの みぎ", ids: ["ride", "ears", "sparkle"], add: ["workcar"], rest: 0 },
    { id: "2f-c", name: "てまえの れつの ひだり", ids: ["zoo", "bakery", "dino"], add: ["mushi"], rest: 0 },
    { id: "2f-d", name: "てまえの れつの みぎ", ids: ["hair", "neck", "party"], add: ["funglasses"], rest: 2 },
  ];

  return { SERIES, first, index, FIG, RINGS };
})();
