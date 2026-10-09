// かべかざりを ふやす（UI-116。オーナーの 指示 2026-10-09「壁に飾れるアイテムを増やして。」）。
// ・かぐやさんの「かべかざり」に いつも ならぶ 24しゅ（ひがわりの つぎ・まえからの かべかざりの まえ）。かわいい・かっこいい・コンセプト（うみ・うちゅう）。
// ・絵は 0..w × 0..h の 2D（ほかの かべかざりと おなじ・INK の 線・パステル。id は つかわない）。SvgCache は つかわない（Art.furnSvg が よむ）。
// ・ぜんぶ さわると うごく（FurnLive）: とけいの はり と カレンダーの ひづけは ほんとうの じこく・すいそうの さかな・かざぐるま・モビールの ほし・たこの しっぽは
//   いつも うごく（絵から うごく ぶぶんを ぬく）／ほしの ライト・ネオンは つく／きえる（よるは はじめから）／ほかは タップで おと・こうか・3人の ひとこと。
// ・ねだんは もとの ねだんの 4ばい（SlowLifePrices）。セーブは Save.d.furn の かず だけ（かわらない）。
// furniture-collection.js（wallKit）・room-styles.js・table-ware.js の あとに よむ。
const WallDecor = (() => {
  const TAU = Math.PI * 2;
  const S = (w = 1.4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const { since, tone, glow, lampOn, ink, FXS } = ShopRewardArt.liveKit;
  const { wallTf, wallAt, wallMapper, sayWall, wallSimple, melody, starC } = FurnCollection.wallKit;
  const dateNow = () => (typeof Seasonal !== "undefined" && Seasonal.override) || new Date();
  // [id, なまえ, もとの ねだん, はば, たかさ, いごこち, せつめい]
  const ROWS = [
    ["wd_round_clock", "まるい かべどけい", 420, 52, 52, 4, "ミントいろの まるい とけい。ほんとうの じこくで うごく。"],
    ["wd_rainbow_garland", "にじの ガーランド", 300, 120, 34, 3, "にじいろの はたが ゆれる ガーランド。"],
    ["wd_star_lights", "ほしの ライト", 380, 120, 36, 4, "ほしの でんきゅうが ならぶ ライト。"],
    ["wd_cloud_shelf", "くもの かべだな", 360, 86, 50, 4, "くもの かたちの たなに ちいさな かざり。"],
    ["wd_moon_stars", "つきと ほしの モビール", 360, 64, 72, 4, "みかづきから ほしが ゆらゆら。"],
    ["wd_fish_tank", "かべかけ すいそう", 600, 84, 56, 6, "かべに かける すいそう。さかなが およぐ。"],
    ["wd_pinwheel", "かざぐるまの かざり", 320, 56, 64, 3, "かべの かごに かざぐるまが 3つ。"],
    ["wd_cork_board", "コルクボード", 340, 80, 58, 4, "3にんの しゃしんと メモの ボード。"],
    ["wd_cloud_mirror", "くもの かがみ", 420, 70, 56, 4, "ふわふわ くもの かたちの かがみ。"],
    ["wd_hanging_green", "かべかけ グリーン", 360, 60, 72, 5, "マクラメで つるした みどりの はちうえ。"],
    ["wd_world_map", "せかいちず", 480, 100, 64, 5, "いきたい ところに ピンを さした ちず。"],
    ["wd_records", "レコードの かざり", 420, 92, 46, 4, "いろとりどりの レコードを かべに。"],
    ["wd_star_neon", "つきと ほしの ネオン", 520, 72, 60, 5, "みかづきと ほしの ネオンサイン。"],
    ["wd_dreamcatcher", "ドリームキャッチャー", 360, 48, 88, 4, "いい ゆめを つかまえる わと はね。"],
    ["wd_hat_hooks", "ぼうしかけ", 360, 96, 52, 4, "3にんの ぼうしを かける いた。"],
    ["wd_ukulele", "かべかけ ウクレレ", 460, 40, 84, 4, "さわると ぽろろん と なる ウクレレ。"],
    ["wd_trio_portrait", "3にんの しょうぞうが", 640, 88, 70, 6, "きんの がくぶちに 3にんの え。"],
    ["wd_dry_flower", "ドライフラワーの がく", 380, 58, 74, 4, "ほした はなの ブーケを がくぶちに。"],
    ["wd_calendar", "めくり カレンダー", 260, 48, 62, 3, "きょうの ひづけが わかる カレンダー。"],
    ["wd_space_poster", "うちゅうの ポスター", 320, 54, 76, 4, "わの ある ほしと ロケットの ポスター。"],
    ["wd_shell_wreath", "かいがらの リース", 380, 64, 64, 4, "かいがらと ひとでの うみの リース。"],
    ["wd_skateboard", "スケボーの かざり", 420, 36, 92, 4, "いなずまの もようの スケボー。かっこいい。"],
    ["wd_geo_shelf", "きかがくの かべだな", 460, 92, 66, 5, "ろっかくと さんかくの かっこいい たな。"],
    ["wd_kite", "たこの かざり", 340, 58, 88, 4, "4いろの たこ。しっぽが ゆれる。"],
  ];
  const IDS = ROWS.map((r) => r[0]);
  const ART = {};

  // ---- まるい かべどけい ----
  const CLOCK = { c: [26, 26] };
  const hands = (h, m, w = 1) => { const [cx, cy] = CLOCK.c, a1 = ((h % 12) + m / 60) / 12 * TAU - Math.PI / 2, a2 = (m / 60) * TAU - Math.PI / 2; return { h: [cx + Math.cos(a1) * 9 * w, cy + Math.sin(a1) * 9 * w], m: [cx + Math.cos(a2) * 13.5 * w, cy + Math.sin(a2) * 13.5 * w] }; };
  ART.wd_round_clock = (o = {}) => {
    const [cx, cy] = CLOCK.c;
    let s = `<path d="M${cx - 3},2 L${cx},-2 L${cx + 3},2" fill="none" ${S(1.2)}/><circle cx="${cx}" cy="${cy}" r="23" fill="#BFE3D8" ${S(2)}/><circle cx="${cx}" cy="${cy}" r="18.5" fill="#FFFDF6" ${S(1.4)}/>`;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r = 15.4; s += i % 3 ? `<circle cx="${f2(cx + Math.cos(a) * r)}" cy="${f2(cy + Math.sin(a) * r)}" r="0.9" fill="${INK}"/>` : `<rect x="${f2(cx + Math.cos(a) * r - 1.2)}" y="${f2(cy + Math.sin(a) * r - 1.2)}" width="2.4" height="2.4" rx="0.6" fill="#F2A7B8" ${S(0.6)}/>`; }
    s += `<path d="${heartPath(cx, cy + 9, 0.5)}" fill="#F2A7B8"/>`;
    if (!o.live) { const p = hands(10, 10); s += `<path d="M${cx},${cy} L${f2(p.h[0])},${f2(p.h[1])}" ${S(2.2)}/><path d="M${cx},${cy} L${f2(p.m[0])},${f2(p.m[1])}" ${S(1.5)}/>`; }
    return s + `<circle cx="${cx}" cy="${cy}" r="2" fill="#F7D56A" ${S(0.9)}/>`;
  };

  // ---- にじの ガーランド・ほしの ライト（たるんだ ひもの うえの 点）----
  const sag = (t, x0 = 4, x1 = 116, y0 = 6, dip = 22) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * ((x0 + x1) / 2) + t * t * x1, u * u * y0 + 2 * u * t * dip + t * t * y0]; };
  const RAINBOW = ["#F28B82", "#F7B26A", "#F7D56A", "#A8D58F", "#8FCFE8", "#9BB4EA", "#C6A7E6"];
  ART.wd_rainbow_garland = () => {
    let s = `<path d="M4,6 Q60,38 116,6" fill="none" stroke="#B48A62" stroke-width="1.6" stroke-linecap="round"/>`;
    RAINBOW.forEach((c, i) => {
      const [x, y] = sag((i + 0.75) / 8.5);
      s += `<path d="M${f2(x - 6.4)},${f2(y - 0.6)} L${f2(x + 6.4)},${f2(y + 0.6)} L${f2(x + 0.4)},${f2(y + 15)} Z" fill="${c}" ${S(1.2)}/><path d="M${f2(x - 3)},${f2(y + 3)} L${f2(x + 3)},${f2(y + 3.3)}" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"/>`;
    });
    return s + `<circle cx="4" cy="6" r="2" fill="#E9C873" ${S(0.8)}/><circle cx="116" cy="6" r="2" fill="#E9C873" ${S(0.8)}/>`;
  };
  const LIGHTS = Array.from({ length: 6 }, (_, i) => { const [x, y] = sag((i + 0.6) / 6.2, 4, 116, 6, 24); return [x, y + 7]; });
  ART.wd_star_lights = () => {
    let s = `<path d="M4,6 Q60,42 116,6" fill="none" stroke="#5E6B5A" stroke-width="1.4" stroke-linecap="round"/>`;
    LIGHTS.forEach(([x, y], i) => { s += `<path d="M${f2(x)},${f2(y - 7)} V${f2(y - 4)}" stroke="#5E6B5A" stroke-width="1.2"/><rect x="${f2(x - 1.8)}" y="${f2(y - 5.6)}" width="3.6" height="2.6" rx="0.6" fill="#C7CED8" ${S(0.6)}/><path d="${starPath(x, y + 2, 6, 2.8)}" fill="${["#FFF1B8", "#FFE0EC", "#E2F4FF"][i % 3]}" ${S(1)}/>`; });
    return s;
  };

  // ---- くもの かべだな ----
  const cloudD = (x, y, w, h) => `M${x + w * 0.12},${y + h} Q${x - w * 0.04},${y + h} ${x + w * 0.04},${y + h * 0.55} Q${x + w * 0.06},${y + h * 0.18} ${x + w * 0.26},${y + h * 0.24} Q${x + w * 0.34},${y - h * 0.12} ${x + w * 0.52},${y + h * 0.12} Q${x + w * 0.7},${y - h * 0.08} ${x + w * 0.78},${y + h * 0.3} Q${x + w * 1.02},${y + h * 0.28} ${x + w * 0.96},${y + h * 0.72} Q${x + w * 0.96},${y + h} ${x + w * 0.86},${y + h} Z`;
  ART.wd_cloud_shelf = () => {
    let s = `<path d="M6,32 H80 Q84,32 82,36 Q86,44 76,46 Q72,52 62,48 Q54,53 44,48 Q34,53 26,48 Q14,51 10,44 Q2,42 5,36 Q3,32 6,32 Z" fill="#FFFFFF" ${S(1.5)}/><path d="M8,35.4 H78" stroke="#D9E8F2" stroke-width="1.2"/>`;
    s += `<rect x="12" y="23" width="11" height="9" rx="1.4" fill="#E48A6E" ${S(1)}/><path d="M17.5,23 V13 Q17.5,10 19.6,11 V20 M17.5,17 Q14,17 14.4,14" fill="#9ED08C" ${S(1)}/><circle cx="19.6" cy="10.8" r="1.4" fill="#F7A1B0" ${S(0.6)}/>`;
    s += `<rect x="32" y="20" width="12" height="12" rx="3" fill="#FFF6D8" ${S(1)}/><path d="M38,20 V16" ${S(0.9)}/><path d="M38,16 Q36,12.6 38,10.4 Q40,12.6 38,16 Z" fill="#F7C948" ${S(0.7)}/><rect x="33.6" y="25" width="8.8" height="3" rx="1" fill="#F2A7B8"/>`;
    s += `<ellipse cx="60" cy="27.4" rx="7" ry="5" fill="#F4EFEA" ${S(1.1)}/><ellipse cx="57" cy="19" rx="1.8" ry="5" fill="#F4EFEA" ${S(1)}/><ellipse cx="62" cy="19" rx="1.8" ry="5" fill="#F4EFEA" ${S(1)}/><circle cx="59.6" cy="24" r="3.8" fill="#F4EFEA" ${S(1)}/><circle cx="58.4" cy="23.6" r="0.6" fill="${INK}"/><circle cx="61" cy="23.6" r="0.6" fill="${INK}"/><circle cx="59.6" cy="25.4" r="0.6" fill="#F2A7B8"/>`;
    s += `<path d="${starPath(75, 27, 4.6, 2)}" fill="#F7D56A" ${S(0.9)}/>`;
    return s;
  };

  // ---- つきと ほしの モビール ----
  const MOBILE = [[12, 40, "#F7D56A"], [32, 56, "#F2A7B8"], [52, 44, "#9CC7E6"]];
  const moonD = (cx, cy, r) => `M${f2(cx + r * 0.2)},${f2(cy - r)} A${r},${r} 0 1 0 ${f2(cx + r * 0.2)},${f2(cy + r)} A${f2(r * 0.78)},${f2(r * 0.78)} 0 1 1 ${f2(cx + r * 0.2)},${f2(cy - r)} Z`;
  const mobileStar = (x, top, y, c) => `<path d="M${f2(x)},${top} L${f2(x)},${f2(y - 5)}" stroke="#8C7A5A" stroke-width="0.9"/><path d="${starPath(x, y, 6.4, 3)}" fill="${c}" ${S(1.1)}/>`;
  ART.wd_moon_stars = (o = {}) => {
    let s = `<path d="M6,20 Q32,26 58,20" fill="none" stroke="#B48A62" stroke-width="2" stroke-linecap="round"/><path d="${moonD(32, 10, 9)}" fill="#FFE59A" ${S(1.4)}/><circle cx="29" cy="9" r="0.8" fill="${INK}"/><path d="M27.6,12.6 Q29.4,14 31,12.6" fill="none" ${S(0.8)}/><path d="M32,1 V-2" ${S(1)}/>`;
    if (!o.live) for (const [x, y, c] of MOBILE) s += mobileStar(x, 22, y, c);
    return s;
  };

  // ---- かべかけ すいそう ----
  const TANK = { x0: 7, y0: 7, x1: 77, y1: 47 };
  const fishSvg = (x, y, c, dir = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) scale(${dir} 1)"><path d="M-6,0 Q-1,-5 5,0 Q-1,5 -6,0 Z" fill="${c}" ${S(0.9)}/><path d="M-6,0 L-10,-3.4 L-10,3.4 Z" fill="${c}" ${S(0.9)}/><circle cx="2.4" cy="-0.6" r="0.7" fill="${INK}"/></g>`;
  ART.wd_fish_tank = (o = {}) => {
    const { x0, y0, x1, y1 } = TANK;
    let s = `<rect x="1" y="1" width="82" height="52" rx="5" fill="#C98A52" ${S(1.8)}/><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="2" fill="#BFE6F2" ${S(1.2)}/>`;
    s += `<path d="M${x0},${y0 + 7} H${x1}" stroke="#DDF3FA" stroke-width="2"/><path d="M${x0},${y1 - 6} Q20,${y1 - 9} 34,${y1 - 6} T60,${y1 - 6} T${x1},${y1 - 7} V${y1} H${x0} Z" fill="#F3DFAE" ${S(1)}/>`;
    for (const [x, h, c] of [[16, 20, "#7FB083"], [22, 14, "#9ED08C"], [66, 22, "#7FB083"], [71, 15, "#9ED08C"]]) s += `<path d="M${x},${y1 - 5} Q${x - 4},${y1 - 5 - h / 2} ${x},${y1 - 5 - h} Q${x + 3},${y1 - 5 - h / 2} ${x + 1.6},${y1 - 5}" fill="${c}" ${S(0.9)}/>`;
    s += `<path d="M42,${y1 - 4} Q44,${y1 - 9} 47,${y1 - 4} Z" fill="#F7B9C9" ${S(0.8)}/><circle cx="54" cy="${y1 - 4}" r="1.6" fill="#FFFFFF" ${S(0.6)}/>`;
    if (!o.live) s += fishSvg(32, 22, "#F7A15C") + fishSvg(52, 32, "#F7D56A", -1);
    return s + `<path d="M${x0 + 4},${y0 + 3} L${x0 + 12},${y0 + 3}" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>`;
  };

  // ---- かざぐるまの かざり ----
  const WHEELS = [[14, 20, 9, ["#F28B82", "#F7D56A", "#8FCFE8", "#A8D58F"]], [30, 11, 10, ["#C6A7E6", "#F7B26A", "#F2A7B8", "#8FCFE8"]], [45, 22, 8.5, ["#A8D58F", "#F28B82", "#F7D56A", "#9BB4EA"]]];
  const wheelSvg = (x, y, r, cols, a = 0) => {
    let s = "";
    for (let i = 0; i < 4; i++) { const b = a + (i * Math.PI) / 2, p = (u, v) => `${f2(x + Math.cos(b) * u - Math.sin(b) * v)},${f2(y + Math.sin(b) * u + Math.cos(b) * v)}`; s += `<path d="M${p(0, 0)} L${p(r, 0)} Q${p(r * 0.9, r * 0.7)} ${p(r * 0.2, r * 0.5)} Z" fill="${cols[i]}" ${S(1)}/>`; }
    return s + `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#FFFFFF" ${S(0.7)}/>`;
  };
  ART.wd_pinwheel = (o = {}) => {
    let s = WHEELS.map(([x, y]) => `<path d="M${x},${y} L${f2(26 + (x - 30) * 0.2)},50" stroke="#C98A52" stroke-width="2" stroke-linecap="round"/>`).join("");
    if (!o.live) s += WHEELS.map(([x, y, r, c], i) => wheelSvg(x, y, r, c, i * 0.4)).join("");
    s += `<path d="M10,44 H46 L42,62 H14 Z" fill="#E7C796" ${S(1.4)}/>`;
    for (let y = 48; y < 62; y += 4.4) s += `<path d="M${f2(10 + (y - 44) * 0.22)},${f2(y)} H${f2(46 - (y - 44) * 0.22)}" stroke="#C9A06A" stroke-width="1"/>`;
    return s + `<path d="M10,44 H46" ${S(1.6)}/>`;
  };

  // ---- コルクボード ----
  const pin = (x, y, c) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${c}" ${S(0.7)}/><circle cx="${x - 0.6}" cy="${y - 0.6}" r="0.5" fill="#FFFFFF"/>`;
  const photo = (x, y, rot, face) => `<g transform="rotate(${rot} ${x + 8} ${y + 9})"><rect x="${x}" y="${y}" width="16" height="19" rx="0.8" fill="#FFFFFF" ${S(1)}/><rect x="${x + 2}" y="${y + 2}" width="12" height="11" fill="#CFE8F3"/>${face(x + 8, y + 8)}</g>`;
  const faceW = (x, y) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#FFFFFF" ${S(0.8)}/><ellipse cx="${x - 3.6}" cy="${y - 0.6}" rx="1.4" ry="2.2" fill="${INK}"/><ellipse cx="${x + 3.6}" cy="${y - 0.6}" rx="1.4" ry="2.2" fill="${INK}"/><circle cx="${x - 1.2}" cy="${y}" r="0.45" fill="${INK}"/><circle cx="${x + 1.2}" cy="${y}" r="0.45" fill="${INK}"/>`;
  const faceG = (x, y) => `<circle cx="${x}" cy="${y}" r="3.8" fill="#FADA78" ${S(0.8)}/><path d="M${x - 1.2},${y + 0.8} L${x + 1.2},${y + 0.8} L${x},${y + 2.2} Z" fill="#F7A15C" ${S(0.5)}/><circle cx="${x - 1.4}" cy="${y - 0.8}" r="0.45" fill="${INK}"/><circle cx="${x + 1.4}" cy="${y - 0.8}" r="0.45" fill="${INK}"/>`;
  const faceJ = (x, y) => `<path d="M${x - 3.8},${y + 4} V${y - 0.4} Q${x - 3.8},${y - 4} ${x},${y - 4} Q${x + 3.8},${y - 4} ${x + 3.8},${y - 0.4} V${y + 4} Z" fill="#8C8686" ${S(0.8)}/><path d="M${x - 2},${y} H${x + 2} L${x + 1.2},${y + 1.4} H${x - 1.2} Z" fill="#E8262A"/>`;
  ART.wd_cork_board = () => {
    let s = `<rect x="1" y="1" width="78" height="56" rx="3" fill="#B98A5E" ${S(1.8)}/><rect x="5" y="5" width="70" height="48" rx="1.6" fill="#D9B07A" ${S(1)}/>`;
    for (let i = 0; i < 26; i++) s += `<circle cx="${f2(8 + U.hash(i, 3) * 64)}" cy="${f2(8 + U.hash(i, 4) * 42)}" r="0.6" fill="#B98A5E"/>`;
    s += photo(9, 9, -6, faceW) + photo(29, 8, 4, faceG) + photo(50, 10, -3, faceJ);
    s += `<rect x="12" y="33" width="20" height="16" fill="#FFF6A8" transform="rotate(3 22 41)" ${S(0.9)}/><path d="M15,38 H29 M15,41.6 H27 M15,45 H24" stroke="#C9A24E" stroke-width="0.9" stroke-linecap="round"/>`;
    s += `<rect x="40" y="36" width="26" height="11" rx="1" fill="#F7B9C9" transform="rotate(-4 53 41)" ${S(0.9)}/><path d="M45,37 V46" stroke="#FFFFFF" stroke-dasharray="1.4 1.2" stroke-width="0.9"/><path d="${heartPath(56, 41, 0.42)}" fill="#E0574F"/>`;
    return s + pin(17, 10, "#E0574F") + pin(37, 9, "#5BA0D0") + pin(58, 11, "#7FB083") + pin(22, 34, "#F7C948") + pin(53, 37, "#C6A7E6");
  };

  // ---- くもの かがみ ----
  const CLOUD_M = cloudD(5, 6, 60, 44);
  ART.wd_cloud_mirror = () => `<path d="${cloudD(1, 2, 68, 52)}" fill="#F7C6D4" ${S(1.8)}/><path d="${CLOUD_M}" fill="#E3F1F8" ${S(1.2)}/><path d="M18,34 L30,18 M24,38 L38,20" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>${[[12, 8], [56, 10], [64, 40]].map(([x, y]) => `<path d="${starPath(x, y, 3.2, 1.4)}" fill="#FFFFFF" ${S(0.7)}/>`).join("")}`;

  // ---- かべかけ グリーン ----
  ART.wd_hanging_green = () => {
    let s = `<path d="M30,4 L14,38 M30,4 L24,38 M30,4 L36,38 M30,4 L46,38" stroke="#E9DCC3" stroke-width="1.6" stroke-linecap="round"/><circle cx="30" cy="4" r="2.6" fill="none" ${S(1.2)}/>`;
    for (const y of [22, 28]) s += `<path d="M${f2(30 - (y - 4) * 0.42)},${y} Q30,${y + 3} ${f2(30 + (y - 4) * 0.42)},${y}" fill="none" stroke="#E9DCC3" stroke-width="1.4"/>`;
    s += `<path d="M14,38 H46 L42,52 Q30,56 18,52 Z" fill="#E48A6E" ${S(1.4)}/><path d="M15,41 H45" stroke="#EFA58C" stroke-width="1.2"/>`;
    const leaf = (x, y, r, c) => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="3.6" ry="2.2" transform="rotate(${r} ${f2(x)} ${f2(y)})" fill="${c}" ${S(0.8)}/>`;
    s += `<path d="M20,46 Q12,58 16,70 M40,46 Q48,56 44,68 M30,48 Q28,58 31,64" fill="none" stroke="#6D9A5E" stroke-width="1.2"/>`;
    for (const [x, y, r, c] of [[18, 37, -30, "#9ED08C"], [24, 34, -60, "#7FB083"], [32, 33, 80, "#9ED08C"], [40, 35, 40, "#7FB083"], [44, 39, 20, "#9ED08C"], [14, 54, 60, "#7FB083"], [15, 62, -50, "#9ED08C"], [16, 69, 30, "#7FB083"], [46, 54, -40, "#9ED08C"], [45, 61, 60, "#7FB083"], [29, 57, 70, "#9ED08C"], [31, 63, -30, "#7FB083"]]) s += leaf(x, y, r, c);
    return s;
  };

  // ---- せかいちず ----
  ART.wd_world_map = () => {
    let s = `<rect x="1" y="1" width="98" height="62" rx="3" fill="#F5DE9C" ${S(1.8)}/><rect x="5" y="5" width="90" height="54" rx="1.6" fill="#CFE8F3" ${S(1)}/>`;
    for (let y = 14; y < 58; y += 10) s += `<path d="M5,${y} H95" stroke="#B8DCEC" stroke-width="0.7"/>`;
    for (let x = 16; x < 95; x += 14) s += `<path d="M${x},5 V59" stroke="#B8DCEC" stroke-width="0.7"/>`;
    const land = [["M12,14 Q20,9 30,13 Q34,18 28,24 Q24,30 20,28 Q14,24 12,14 Z", "#A8D58F"], ["M24,32 Q30,30 32,38 Q30,48 26,54 Q22,46 24,32 Z", "#F7D56A"], ["M44,12 Q52,9 56,14 Q54,20 48,20 Q44,18 44,12 Z", "#F2A7B8"], ["M46,24 Q56,22 58,30 Q56,42 50,46 Q44,38 46,24 Z", "#F7B26A"], ["M60,12 Q76,8 86,16 Q88,24 80,28 Q70,30 64,24 Q58,18 60,12 Z", "#C6A7E6"], ["M76,40 Q86,38 88,44 Q86,50 78,50 Q74,46 76,40 Z", "#8FCFE8"]];
    for (const [d, c] of land) s += `<path d="${d}" fill="${c}" ${S(1)}/>`;
    s += `<path d="M22,20 Q36,6 52,16 T80,44" fill="none" stroke="#E0574F" stroke-width="1.2" stroke-dasharray="2 2" stroke-linecap="round"/>`;
    for (const [x, y, c] of [[22, 20, "#E0574F"], [52, 16, "#5BA0D0"], [80, 44, "#F7C948"]]) s += `<path d="M${x},${y} L${x},${y - 6}" ${S(1)}/><circle cx="${x}" cy="${y - 7}" r="2.2" fill="${c}" ${S(0.8)}/>`;
    return s + `<circle cx="88" cy="54" r="3" fill="#FFFFFF" ${S(0.8)}/><path d="M88,51.4 L89,54 L88,56.6 L87,54 Z" fill="#E0574F"/>`;
  };

  // ---- レコードの かざり ----
  const RECS = [[17, 23, 15, "#F2A7B8"], [46, 21, 16, "#F7D56A"], [75, 24, 15, "#8FCFE8"]];
  ART.wd_records = () => RECS.map(([x, y, r, c]) => {
    let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="#2B2A33" ${S(1.4)}/>`;
    for (const k of [0.84, 0.7, 0.56]) s += `<circle cx="${x}" cy="${y}" r="${f2(r * k)}" fill="none" stroke="#4A4856" stroke-width="0.8"/>`;
    return s + `<circle cx="${x}" cy="${y}" r="${f2(r * 0.36)}" fill="${c}" ${S(1)}/><circle cx="${x}" cy="${y}" r="1.1" fill="#FFFDF6" ${S(0.5)}/><path d="M${f2(x - r * 0.6)},${f2(y - r * 0.5)} Q${f2(x - r * 0.2)},${f2(y - r * 0.82)} ${f2(x + r * 0.3)},${f2(y - r * 0.76)}" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join("");

  // ---- つきと ほしの ネオン（くだの みちは canvas でも つかう）----
  const NEON2 = { moon: moonD(26, 30, 15), star: starPath(52, 22, 10, 4.4), dot: starPath(56, 46, 4, 1.8) };
  const tubeSvg = (d, c, w = 3) => `<path d="${d}" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
  ART.wd_star_neon = (o = {}) => {
    let s = `<rect x="2" y="2" width="68" height="56" rx="10" fill="#26304A" ${S(2)}/><rect x="5.5" y="5.5" width="61" height="49" rx="8" fill="none" stroke="#3D4A6E" stroke-width="1.2"/>`;
    if (!o.live) s += tubeSvg(NEON2.moon, "#FFE07A") + tubeSvg(NEON2.star, "#8FE3F2", 2.4) + tubeSvg(NEON2.dot, "#FF8FB8", 1.8);
    return s;
  };

  // ---- ドリームキャッチャー ----
  ART.wd_dreamcatcher = () => {
    const cx = 24, cy = 21, R = 17;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#C98A52" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" ${S(1)} stroke-dasharray="3 2"/>`;
    const pts = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + (i / 7) * TAU; return [cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2)]; });
    s += `<path d="M${pts.map(([x, y]) => f2(x) + "," + f2(y)).join(" L")} Z" fill="none" stroke="#FFFFFF" stroke-width="0.9"/>`;
    s += `<path d="M${[0, 3, 6, 2, 5, 1, 4].map((i) => f2(pts[i][0]) + "," + f2(pts[i][1])).join(" L")} Z" fill="none" stroke="#FFFFFF" stroke-width="0.8"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="#8FCFE8" ${S(0.7)}/>`;
    const feather = (x, top, len, c) => `<path d="M${x},${top} V${top + 6}" stroke="#E9DCC3" stroke-width="1"/><circle cx="${x}" cy="${top + 6}" r="1.6" fill="#F7A1B0" ${S(0.5)}/><path d="M${x},${top + 8} Q${x - 4.6},${top + 8 + len * 0.45} ${x},${top + 8 + len} Q${x + 4.6},${top + 8 + len * 0.45} ${x},${top + 8} Z" fill="${c}" ${S(0.9)}/><path d="M${x},${top + 9} V${top + 7 + len}" stroke="${INK}" stroke-width="0.6"/>`;
    return s + feather(12, 34, 30, "#C6A7E6") + feather(24, 38, 34, "#F2A7B8") + feather(36, 34, 30, "#8FCFE8") + `<path d="M${cx},4 V-2" ${S(1)}/>`;
  };

  // ---- ぼうしかけ ----
  ART.wd_hat_hooks = () => {
    let s = `<rect x="2" y="4" width="92" height="12" rx="3" fill="#C98A52" ${S(1.6)}/><path d="M5,7.4 H91" stroke="#E2B98A" stroke-width="1"/>`;
    for (const x of [18, 48, 78]) s += `<circle cx="${x}" cy="10" r="2.6" fill="#A87450" ${S(0.9)}/>`;
    // ミントの キャップ・むぎわら ぼうし・グレーの ニット ぼうし
    s += `<path d="M8,30 Q8,16 18,16 Q28,16 28,30 Z" fill="#BFE3D8" ${S(1.2)}/><path d="M18,16 V30" stroke="#9ACFBF" stroke-width="1"/><path d="M8,30 Q-1,31 2,35 Q12,35 28,30 Z" fill="#9ACFBF" ${S(1.1)}/><circle cx="18" cy="15.6" r="1.4" fill="#9ACFBF" ${S(0.6)}/>`;
    s += `<ellipse cx="48" cy="34" rx="19" ry="5" fill="#F3D88E" ${S(1.2)}/><path d="M38,33 Q37,18 48,17 Q59,18 58,33 Z" fill="#F7E2A4" ${S(1.2)}/><path d="M38.6,29 Q48,32 57.4,29 V32 Q48,35 38.6,32 Z" fill="#F28B82" ${S(0.8)}/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${f2(40 + i * 3.4)},20 L${f2(39.6 + i * 3.4)},28" stroke="#E0BE6A" stroke-width="0.7"/>`;
    s += `<path d="M68,34 Q67,18 78,18 Q89,18 88,34 Z" fill="#AEB6BD" ${S(1.2)}/><rect x="67" y="31" width="22" height="6" rx="2.4" fill="#8C959E" ${S(1)}/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${70 + i * 4},31 V37" stroke="#7A838C" stroke-width="0.8"/>`;
    return s + `<circle cx="78" cy="16.4" r="3.4" fill="#F2A7B8" ${S(1)}/>`;
  };

  // ---- かべかけ ウクレレ ----
  ART.wd_ukulele = () => {
    let s = `<path d="M20,4 V-1" ${S(1)}/><rect x="14" y="3" width="12" height="13" rx="3" fill="#B98A5E" ${S(1.3)}/>`;
    for (const y of [6.4, 11.4]) s += `<circle cx="12" cy="${y}" r="1.6" fill="#E9DCC3" ${S(0.6)}/><circle cx="28" cy="${y}" r="1.6" fill="#E9DCC3" ${S(0.6)}/>`;
    s += `<rect x="16.6" y="15" width="6.8" height="32" fill="#8B5A33" ${S(1.2)}/>`;
    for (let y = 20; y < 46; y += 5) s += `<path d="M16.6,${y} H23.4" stroke="#E9DCC3" stroke-width="0.7"/>`;
    s += `<path d="M20,44 Q7,44 8,56 Q4,60 5,68 Q7,82 20,82 Q33,82 35,68 Q36,60 32,56 Q33,44 20,44 Z" fill="#F7B26A" ${S(1.5)}/><path d="M20,47 Q10,47 11,57 Q7,61 8,68 Q10,79 20,79" fill="none" stroke="#FFD39A" stroke-width="1.4"/>`;
    s += `<circle cx="20" cy="60" r="4.6" fill="#5A3A24" ${S(1)}/><circle cx="20" cy="60" r="6.4" fill="none" stroke="#FFF2D6" stroke-width="1"/><rect x="14" y="70" width="12" height="3" rx="1" fill="#8B5A33" ${S(0.8)}/>`;
    for (const x of [18.2, 19.4, 20.6, 21.8]) s += `<path d="M${x},14 V71" stroke="#FFFDF6" stroke-width="0.45"/>`;
    return s;
  };

  // ---- 3にんの しょうぞうが ----
  ART.wd_trio_portrait = () => {
    let s = `<rect x="1" y="1" width="86" height="68" rx="4" fill="#E9C873" ${S(1.8)}/><rect x="5" y="5" width="78" height="60" rx="2" fill="#C9A24E" ${S(1)}/><rect x="9" y="9" width="70" height="52" fill="#FBE7EE" ${S(1.1)}/>`;
    for (const [x, y] of [[3.4, 3.4], [84.6, 3.4], [3.4, 66.6], [84.6, 66.6]]) s += `<circle cx="${x}" cy="${y}" r="2.2" fill="#F5DE9C" ${S(0.7)}/>`;
    s += `<path d="M9,48 Q44,40 79,48 V61 H9 Z" fill="#CFE8C6"/>`;
    // わんこ（しろ・くろい みみ）
    s += `<ellipse cx="25" cy="52" rx="9" ry="8" fill="#FFFFFF" ${S(1.1)}/><circle cx="25" cy="34" r="10" fill="#FFFFFF" ${S(1.2)}/><ellipse cx="15.6" cy="33" rx="3.6" ry="6" fill="${INK}"/><ellipse cx="34.4" cy="33" rx="3.6" ry="6" fill="${INK}"/><circle cx="22" cy="34" r="0.9" fill="${INK}"/><circle cx="28" cy="34" r="0.9" fill="${INK}"/><path d="M23.6,37.4 L25,38.6 L26.4,37.4" fill="none" ${S(0.8)}/><circle cx="28" cy="52" r="1.6" fill="${INK}"/>`;
    // がちゃん（きいろ）
    s += `<ellipse cx="44" cy="53" rx="7" ry="6.4" fill="#FADA78" ${S(1.1)}/><circle cx="44" cy="40" r="9" fill="#FADA78" ${S(1.2)}/><circle cx="41.2" cy="38.6" r="0.9" fill="${INK}"/><circle cx="46.8" cy="38.6" r="0.9" fill="${INK}"/><path d="M41.6,42 H46.4 L44,44.6 Z" fill="#F7A15C" ${S(0.7)}/>`;
    // ごじ（グレー・あかい ぎざぎざの くち）
    s += `<path d="M54,61 V36 Q54,24 63,24 Q72,24 72,36 V61 Z" fill="#8C8686" ${S(1.2)}/><circle cx="56.4" cy="25.6" r="2.4" fill="#8C8686" ${S(0.9)}/><circle cx="69.6" cy="25.6" r="2.4" fill="#8C8686" ${S(0.9)}/><ellipse cx="63" cy="35" rx="5.4" ry="2.8" fill="#FFFFFF" ${S(0.8)}/><path d="M58.4,35 L60,33.4 L61.4,36 L63,33.4 L64.6,36 L66,33.4 L67.6,35 L66,36.6 L64.6,34.6 L63,36.6 L61.4,34.6 L60,36.6 Z" fill="#E8262A"/>`;
    return s + `<path d="${heartPath(44, 16, 0.7)}" fill="#F06292" ${S(0.6)}/>`;
  };

  // ---- ドライフラワーの がく ----
  ART.wd_dry_flower = () => {
    let s = `<rect x="1" y="1" width="56" height="72" rx="2" fill="#D2B48C" ${S(1.8)}/><rect x="6" y="6" width="46" height="62" fill="#F6F0E4" ${S(1)}/>`;
    s += `<path d="M29,62 L22,30 M29,62 L29,24 M29,62 L36,30 M29,62 L17,38 M29,62 L41,38" stroke="#9C8A5E" stroke-width="1.1" stroke-linecap="round"/>`;
    for (const [x, y, c] of [[22, 28, "#D99AA5"], [29, 21, "#E3B95C"], [36, 28, "#B5A3D0"], [16, 36, "#E3B95C"], [42, 36, "#D99AA5"], [26, 34, "#B5A3D0"], [33, 35, "#D99AA5"]]) s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}" ${S(0.8)}/><circle cx="${x}" cy="${y}" r="1" fill="${shade(c, -0.25)}"/>`;
    for (const [x, y, r] of [[19, 44, -40], [39, 44, 40], [24, 47, -20], [34, 47, 20]]) s += `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="4" transform="rotate(${r} ${x} ${y})" fill="#B8B98A" ${S(0.6)}/>`;
    return s + `<path d="M24,52 Q29,56 34,52 L33,58 Q29,55 25,58 Z" fill="#F2A7B8" ${S(0.9)}/><path d="M29,55 L25,64 M29,55 L33,64" stroke="#F2A7B8" stroke-width="1.6" stroke-linecap="round"/>`;
  };

  // ---- めくり カレンダー（ひづけは live の とき canvas に）----
  ART.wd_calendar = (o = {}) => {
    let s = `<path d="M24,0 V-3" ${S(1)}/><rect x="2" y="4" width="44" height="56" rx="3" fill="#FFFFFF" ${S(1.6)}/><path d="M2,7 Q2,4 5,4 H43 Q46,4 46,7 V16 H2 Z" fill="#F28B82" ${S(1.4)}/>`;
    for (const x of [12, 24, 36]) s += `<rect x="${x - 1.4}" y="1.4" width="2.8" height="6" rx="1.4" fill="#C7CED8" ${S(0.7)}/>`;
    s += `<path d="M6,52 H42" stroke="#E6E1D8" stroke-width="1"/><path d="M6,55.6 H34" stroke="#E6E1D8" stroke-width="1"/><path d="M40,60 L46,54 V57 Q46,60 43,60 Z" fill="#EFEAE2" ${S(0.9)}/>`;
    if (!o.live) s += `<path d="M14,24 H34 M10,32 H38 M14,40 H34" stroke="#E6E1D8" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  };

  // ---- うちゅうの ポスター ----
  ART.wd_space_poster = () => {
    let s = `<rect x="2" y="2" width="50" height="72" rx="1.6" fill="#2E3A66" ${S(1.6)}/>`;
    for (let i = 0; i < 18; i++) s += `<circle cx="${f2(5 + U.hash(i, 7) * 44)}" cy="${f2(5 + U.hash(i, 8) * 66)}" r="${f2(0.4 + U.hash(i, 9) * 0.6)}" fill="#FFFFFF"/>`;
    s += `<ellipse cx="22" cy="24" rx="15" ry="4" fill="none" stroke="#F7D56A" stroke-width="2.4" transform="rotate(-14 22 24)"/><circle cx="22" cy="24" r="9" fill="#F7B26A" ${S(1.2)}/><path d="M14,22 Q22,20 30,22 M14.6,27 Q22,25 29.4,27" stroke="#E48A6E" stroke-width="1.2" fill="none"/><path d="M8.4,27.4 Q22,31 36,20.6" fill="none" stroke="#F7D56A" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<g transform="rotate(30 38 52)"><path d="M38,38 Q43,44 43,54 H33 Q33,44 38,38 Z" fill="#FFFFFF" ${S(1.1)}/><circle cx="38" cy="47" r="2.2" fill="#8FCFE8" ${S(0.8)}/><path d="M33,52 L29,58 H33 Z M43,52 L47,58 H43 Z" fill="#F28B82" ${S(0.9)}/><path d="M35.4,54 Q38,62 40.6,54 Z" fill="#F7D56A" ${S(0.8)}/></g>`;
    s += `<path d="${moonD(42, 12, 4.4)}" fill="#FFF1B8" ${S(0.9)}/>`;
    for (const [x, y] of [[3, 3], [51, 3], [3, 73], [51, 73]]) s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="4" rx="0.6" fill="#F6EFC8" fill-opacity=".9" transform="rotate(${x < 20 === y < 20 ? -40 : 40} ${x} ${y})" ${S(0.5)}/>`;
    return s;
  };

  // ---- かいがらの リース ----
  ART.wd_shell_wreath = () => {
    const cx = 32, cy = 32, R = 22;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#E9DCC3" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#C9B48E" stroke-width="1" stroke-dasharray="2.4 2"/>`;
    const at = (deg, r = R) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
    const scallop = (x, y, rot, c) => { let p = `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot})"><path d="M-6,1 Q-6,-6 0,-6 Q6,-6 6,1 L1.4,4 H-1.4 Z" fill="${c}" ${S(0.9)}/>`; for (const u of [-3.4, 0, 3.4]) p += `<path d="M0,3 L${u},-5" stroke="${shade(c, -0.2)}" stroke-width="0.6"/>`; return p + `</g>`; };
    const seaStar = (x, y, c) => `<path d="${starPath(x, y, 6, 2.6)}" fill="${c}" ${S(0.9)}/><circle cx="${f2(x)}" cy="${f2(y)}" r="0.7" fill="${shade(c, -0.3)}"/>`;
    const conch = (x, y, rot) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot})"><path d="M-2,-6 Q4,-4 4,2 Q2,6 -2,5 Q-5,2 -2,-6 Z" fill="#F6EFE6" ${S(0.9)}/><path d="M-1.6,-3 Q2,-2 2.6,1 M-2.6,0 Q0,1 1,3.4" fill="none" stroke="#D9C2A8" stroke-width="0.6"/></g>`;
    [[-90, "s", "#F7B9C9"], [-40, "c"], [0, "st", "#F7B26A"], [45, "s", "#FFF1D6"], [90, "c"], [135, "st", "#F28B82"], [180, "s", "#F7D9B0"], [225, "c"]].forEach(([d, k, c], i) => {
      const [x, y] = at(d);
      s += k === "s" ? scallop(x, y, d + 90, c) : k === "st" ? seaStar(x, y, c) : conch(x, y, d + i * 20);
    });
    for (const d of [-65, -15, 22, 68, 112, 158, 202, 250, 290]) { const [x, y] = at(d, R + 0.6); s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#8FCFE8" ${S(0.5)}/>`; }
    return s + `<path d="M${cx},${cy - R - 3} V${cy - R - 8}" ${S(1)}/>`;
  };

  // ---- スケボーの かざり ----
  ART.wd_skateboard = () => {
    let s = `<rect x="6" y="2" width="24" height="88" rx="12" fill="#3A3F52" ${S(1.6)}/><rect x="9" y="6" width="18" height="80" rx="9" fill="#4F566E"/>`;
    s += `<path d="M22,14 L12,42 H19 L14,74 L26,40 H19 L24,14 Z" fill="#F7D56A" ${S(1)}/>`;
    for (const y of [10, 82]) s += `<rect x="${y < 40 ? 9 : 9}" y="${y - 1}" width="18" height="2" rx="1" fill="#8FE3F2" fill-opacity=".8"/>`;
    for (const y of [20, 72]) s += `<rect x="2" y="${y - 2}" width="32" height="4" rx="1.4" fill="#C7CED8" ${S(0.9)}/><rect x="0" y="${y - 5}" width="5" height="10" rx="2" fill="#F28B82" ${S(0.9)}/><rect x="31" y="${y - 5}" width="5" height="10" rx="2" fill="#F28B82" ${S(0.9)}/>`;
    return s + `<path d="M18,2 V-2" ${S(1)}/>`;
  };

  // ---- きかがくの かべだな ----
  const hexD = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return (i ? "L" : "M") + f2(cx + Math.cos(a) * r) + "," + f2(cy + Math.sin(a) * r); }).join(" ") + " Z";
  ART.wd_geo_shelf = () => {
    let s = `<path d="${hexD(26, 30, 24)}" fill="#E9EDF2" ${S(4.4)} stroke="#2F3A4A"/><path d="${hexD(26, 30, 24)}" fill="none" stroke="#5E6B80" stroke-width="1.2"/>`;
    s += `<path d="M58,62 L74,6 L90,62 Z" fill="#E9EDF2" stroke="#2F3A4A" stroke-width="4.4" stroke-linejoin="round"/><path d="M58,62 L74,6 L90,62 Z" fill="none" stroke="#5E6B80" stroke-width="1.2" stroke-linejoin="round"/>`;
    s += `<path d="M6,40 H46" stroke="#2F3A4A" stroke-width="3.4" stroke-linecap="round"/><path d="M63,44 H85" stroke="#2F3A4A" stroke-width="3.4" stroke-linecap="round"/>`;
    s += `<rect x="12" y="28" width="9" height="12" rx="1" fill="#F7F7F7" ${S(1)}/><path d="M16.5,28 Q12,20 16.5,16 Q21,20 16.5,28 M16.5,28 Q22,22 26,24" fill="#7FB083" ${S(0.9)}/>`;
    s += `<rect x="26" y="26" width="4" height="14" rx="0.6" fill="#5BA0D0" ${S(0.8)}/><rect x="30.4" y="28" width="4" height="12" rx="0.6" fill="#F7D56A" ${S(0.8)}/><rect x="35" y="33" width="7" height="7" fill="#F28B82" transform="rotate(12 38.5 36.5)" ${S(0.8)}/>`;
    s += `<circle cx="74" cy="38" r="5.4" fill="#C7CED8" ${S(1)}/><path d="M70.6,36 Q74,34 77.4,36 M70,39.6 Q74,41.6 78,39.6" fill="none" stroke="#8C959E" stroke-width="0.8"/><rect x="69" y="50" width="10" height="9" rx="1" fill="#2F3A4A" ${S(0.8)}/><path d="M71,54 H77" stroke="#8FE3F2" stroke-width="1.2"/>`;
    return s;
  };

  // ---- たこの かざり（しっぽは live の とき canvas）----
  const KITE = { top: [29, 4], left: [8, 28], right: [50, 28], bottom: [29, 54] };
  const BOWS = [[29, 60, "#F28B82"], [29, 68, "#F7D56A"], [29, 76, "#8FCFE8"], [29, 84, "#A8D58F"]];
  const bowSvg = (x, y, c) => `<path d="M${f2(x - 4)},${f2(y - 2.4)} L${f2(x)},${f2(y)} L${f2(x - 4)},${f2(y + 2.4)} Z M${f2(x + 4)},${f2(y - 2.4)} L${f2(x)},${f2(y)} L${f2(x + 4)},${f2(y + 2.4)} Z" fill="${c}" ${S(0.8)}/>`;
  ART.wd_kite = (o = {}) => {
    const { top: T, left: L, right: Rr, bottom: B } = KITE, c = [29, 28];
    let s = "";
    for (const [a, b, col] of [[T, L, "#F28B82"], [T, Rr, "#F7D56A"], [B, Rr, "#8FCFE8"], [B, L, "#A8D58F"]]) s += `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]} Z" fill="${col}"/>`;
    s += `<path d="M${T[0]},${T[1]} L${Rr[0]},${Rr[1]} L${B[0]},${B[1]} L${L[0]},${L[1]} Z" fill="none" ${S(1.5)}/><path d="M${T[0]},${T[1]} L${B[0]},${B[1]} M${L[0]},${L[1]} L${Rr[0]},${Rr[1]}" stroke="#A87450" stroke-width="1.2"/>`;
    s += `<circle cx="22" cy="24" r="0.9" fill="${INK}"/><circle cx="36" cy="24" r="0.9" fill="${INK}"/><path d="M26,30 Q29,33 32,30" fill="none" ${S(0.9)}/><circle cx="19" cy="28" r="1.6" fill="#F7A1B0" fill-opacity=".7"/><circle cx="39" cy="28" r="1.6" fill="#F7A1B0" fill-opacity=".7"/>`;
    if (!o.live) s += `<path d="M29,54 Q24,64 30,72 Q35,80 29,88" fill="none" stroke="#8C7A5A" stroke-width="1"/>` + BOWS.map(([x, y, col], i) => bowSvg(x + [0, -3, 2, -1][i], y, col)).join("");
    return s;
  };

  // ================= ゲームに いれる =================
  const add = ([id, name, base, w, h, comfort, desc]) => {
    if (FURN_INDEX[id]) return;
    const f = { id, name, price: SlowLifePrices.price("furniture", base), kind: "wall", w, h, comfort, desc, wallDecor: true };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = (opts = {}) => ART[id](opts);
  };
  ROWS.forEach(add);

  // ================= さわる（FurnLive）=================
  const P = wallMapper;
  // まるい かべどけい: はりは ほんとうの じこく（びょうしんも）。タップで「◯じ ◯ふん」
  FurnLive.register("wd_round_clock", {
    tap(sc, it, st) { st.t0 = G.t; const d = new Date(); melody([1319, 1047], 0.22, "sine", 0.08, 0.4); sayWall(sc, it, `いまは ${d.getHours()}じ ${d.getMinutes()}ふん`, "note"); },
    draw(ctx, sc, it, r, st) {
      const d = new Date(), p = hands(d.getHours(), d.getMinutes() + d.getSeconds() / 60), [cx, cy] = CLOCK.c, a = (d.getSeconds() / 60) * TAU - Math.PI / 2;
      ctx.save(); wallTf(ctx, sc, it); ink(ctx, 2.2); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.h[0], p.h[1]); ctx.stroke();
      ink(ctx, 1.5); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.m[0], p.m[1]); ctx.stroke();
      ctx.strokeStyle = "#E0574F"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15); ctx.stroke();
      ctx.fillStyle = "#F7D56A"; ink(ctx, 0.9); ctx.beginPath(); ctx.arc(cx, cy, 2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (since(st) < 1.6) FXS.note(ctx, P(sc, it), st, 26, 0, 56);
    },
  }, true);
  wallSimple("wd_rainbow_garland", ["にじいろ きれい！", "パーティー みたい", "はたが ひらひら"], "spark", [60, 0, 20], [523, 659, 784, 1047]);
  // ほしの ライト: タップで つく／きえる（よるは はじめから）
  FurnLive.register("wd_star_lights", {
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [1047, 1319, 1568, 2093] : [784, 523], 0.06, "sine", 0.07); sayWall(sc, it, st.on ? "ほしが ぴかぴか！" : "ライトを けしたよ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      if (!lampOn(st)) return;
      const k = st.t0 < 0 ? 1 : Math.min(1, since(st) * 3);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      LIGHTS.forEach(([x, y], i) => { const q = wallAt(sc, it, x, y + 2), tw = 0.75 + 0.25 * Math.sin(G.t * 3 + i * 1.7); glow(ctx, q.x, q.y, 14 * sc.s, ["255,230,140", "255,180,210", "170,220,255"][i % 3], 0.6 * k * tw); });
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const q = wallAt(sc, it, 60, 24); glow(ctx, q.x, q.y, 90 * sc.s, "255,220,160", 0.2); },
  });
  wallSimple("wd_cloud_shelf", ["うさぎさん かわいい", "くもの うえに おいたよ", "キャンドル いい におい"], "puff", [44, 0, 34], [659, 784, 988]);
  // つきと ほしの モビール: ほしが ゆらゆら（タップで おおきく ゆれる）
  FurnLive.register("wd_moon_stars", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([1568, 1319, 1175, 1568], 0.12, "sine", 0.06, 0.3); sayWall(sc, it, ["おつきさま こんばんは", "ほしが ゆらゆら", "いい ゆめ みられそう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st), big = st.t0 >= 0 ? Math.exp(-k * 0.9) * 0.5 : 0;
      ctx.save(); wallTf(ctx, sc, it);
      MOBILE.forEach(([x, y, c], i) => {
        const a = Math.sin(G.t * 1.3 + i * 2.1) * 0.08 + Math.sin(k * 5 + i) * big, len = y - 22, sx = x + Math.sin(a) * len, sy = 22 + Math.cos(a) * len;
        ctx.strokeStyle = "#8C7A5A"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(sx - Math.sin(a) * 5, sy - Math.cos(a) * 5); ctx.stroke();
        starC(ctx, sx, sy, 6.4, c);
      });
      ctx.restore();
    },
  }, true);
  // かべかけ すいそう: さかなが いったり きたり・あわ。タップで さかなが いそいで あわが でる
  FurnLive.register("wd_fish_tank", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([988, 1175, 1319], 0.07, "sine", 0.07); sayWall(sc, it, ["さかなさん げんき？", "あわが ぷくぷく", "すいすい およいでる"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const { x0, y0, x1, y1 } = TANK, k = since(st), fast = st.t0 >= 0 && k < 2 ? 2.4 : 1, t = G.t;
      st.ph = (st.ph || 0) + (fast - 1) * 0.03;
      ctx.save(); wallTf(ctx, sc, it); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      [["#F7A15C", 18, 0.5, 0], ["#F7D56A", 30, 0.38, 2], ["#F28B82", 26, 0.62, 4]].forEach(([c, y, sp, ph], i) => {
        const u = Math.sin(t * sp + ph + st.ph), x = (x0 + x1) / 2 + u * 24, dir = Math.cos(t * sp + ph + st.ph) >= 0 ? 1 : -1, yy = y + Math.sin(t * 1.4 + i) * 2;
        ctx.save(); ctx.translate(x, yy); ctx.scale(dir, 1); ctx.fillStyle = c; ink(ctx, 0.9);
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-1, -5, 5, 0); ctx.quadraticCurveTo(-1, 5, -6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10, -3.4); ctx.lineTo(-10, 3.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.4, -0.6, 0.7, 0, TAU); ctx.fill(); ctx.restore();
      });
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) { const u = (t * 0.3 * fast + i / 4) % 1; ctx.beginPath(); ctx.arc(60 + Math.sin(u * 8 + i) * 2, y1 - 6 - u * 34, 1 + (i % 2) * 0.6, 0, TAU); ctx.stroke(); }
      ctx.restore();
      if (k < 2) FXS.bubble(ctx, P(sc, it), st, 42, 0, 40);
    },
  }, true);
  // かざぐるまの かざり: ゆっくり まわる（タップで かぜ → はやく まわる）
  FurnLive.register("wd_pinwheel", {
    tap(sc, it, st) { st.spin = (st.spin || 0) + (st.t0 >= 0 ? 8 * (1 - Math.exp(-since(st))) : 0); st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 784, 1047], 0.07, "triangle", 0.08); sayWall(sc, it, ["ふーって したら くるくる！", "かぜが きた！", "3つとも まわってる"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const a0 = G.t * 0.8 + (st.spin || 0) + (st.t0 >= 0 ? 8 * (1 - Math.exp(-since(st))) : 0);
      ctx.save(); wallTf(ctx, sc, it);
      WHEELS.forEach(([x, y, rr, cols], j) => {
        const a = a0 * (1 + j * 0.15) + j;
        for (let i = 0; i < 4; i++) {
          const b = a + (i * Math.PI) / 2, q = (u, v) => [x + Math.cos(b) * u - Math.sin(b) * v, y + Math.sin(b) * u + Math.cos(b) * v];
          ctx.fillStyle = cols[i]; ink(ctx, 1); ctx.beginPath(); ctx.moveTo(...q(0, 0)); ctx.lineTo(...q(rr, 0)); const c1 = q(rr * 0.9, rr * 0.7), e = q(rr * 0.2, rr * 0.5); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = "#FFFFFF"; ink(ctx, 0.7); ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
    },
  }, true);
  wallSimple("wd_cork_board", ["3にんの しゃしん！", "メモ わすれないように", "また みんなで でかけよう"], "heart", [40, 0, 48]);
  // くもの かがみ: タップで ひかりが すーっと とおる
  let cloudPath = null;
  FurnLive.register("wd_cloud_mirror", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([1568, 1976, 2349], 0.06, "sine", 0.06, 0.2); sayWall(sc, it, ["ふわふわ かがみ！", "きょうも かわいい", "くもに かおが うつってる"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > 1.2) return;
      ctx.save(); wallTf(ctx, sc, it); ctx.clip(cloudPath || (cloudPath = new Path2D(CLOUD_M)));
      const x = -10 + k * 90; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + 9, 4); ctx.lineTo(x - 12, 54); ctx.lineTo(x - 21, 54); ctx.closePath(); ctx.fill();
      ctx.restore();
      FXS.spark(ctx, P(sc, it), st, 50, 0, 44);
    },
  });
  wallSimple("wd_hanging_green", ["はっぱが のびてきた", "みどりって ほっと する", "おみず あげようか"], "puff", [30, 0, 40], [659, 784, 659]);
  wallSimple("wd_world_map", ["こんど ここに いこう！", "せかいって ひろいね", "ピンの ところ いきたい"], "spark", [52, 0, 48], [523, 784, 1047]);
  // レコード: タップで まんなかの レコードが まわって きょくが ながれる
  FurnLive.register("wd_records", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; const songs = [[523, 659, 784, 659, 880, 784], [659, 587, 523, 587, 659, 659, 659], [784, 880, 784, 659, 523, 587]]; st.len = melody(songs[st.n % 3], 0.22, "triangle", 0.1, 0.24); sayWall(sc, it, ["この きょく すき！", "レコード くるくる", "おどろう〜♪"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > (st.len || 1.4) + 0.4) return;
      const [x, y, rr, c] = RECS[st.n % 3], a = k * 5;
      ctx.save(); wallTf(ctx, sc, it);
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x, y, rr * 0.72, a, a + 1); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, rr * 0.72, a + Math.PI, a + Math.PI + 1); ctx.stroke();
      ctx.fillStyle = c; ink(ctx, 1); ctx.beginPath(); ctx.arc(x, y, rr * 0.36, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 0.22, y + Math.sin(a) * rr * 0.22, 1.2, 0, TAU); ctx.fill();
      ctx.restore();
      FXS.note(ctx, P(sc, it), st, x, 0, 40, (st.len || 1.4) + 0.4);
    },
  });
  // つきと ほしの ネオン: タップで つく／きえる（つく ときは ちかちか）・よるは はじめから
  let neon2 = null;
  FurnLive.register("wd_star_neon", {
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [988, 1319, 1760] : [784, 523], 0.06, "square", 0.05); sayWall(sc, it, st.on ? "おつきさまが ぴかっ！" : "ネオンを けしたよ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const on = lampOn(st), k = since(st), fl = on && st.t0 >= 0 && k < 0.6 ? (Math.sin(k * 60) > 0 ? 1 : 0.25) : 1, N = neon2 || (neon2 = { moon: new Path2D(NEON2.moon), star: new Path2D(NEON2.star), dot: new Path2D(NEON2.dot) });
      ctx.save(); wallTf(ctx, sc, it); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const tube = (p, col, w) => {
        if (on) { ctx.globalAlpha = 0.35 * fl; ctx.strokeStyle = col; ctx.lineWidth = w + 5; ctx.stroke(p); }
        ctx.globalAlpha = on ? fl : 1; ctx.strokeStyle = on ? col : "#8C90AA"; ctx.lineWidth = w; ctx.stroke(p);
        ctx.globalAlpha = on ? 0.85 * fl : 0.6; ctx.strokeStyle = on ? "#FFFFFF" : "#B9BCD0"; ctx.lineWidth = 1; ctx.stroke(p);
        ctx.globalAlpha = 1;
      };
      tube(N.moon, "#FFE07A", 3); tube(N.star, "#8FE3F2", 2.4); tube(N.dot, "#FF8FB8", 1.8);
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const q = wallAt(sc, it, 36, 30); glow(ctx, q.x, q.y, 70 * sc.s, "255,230,150", 0.26); },
  }, true);
  wallSimple("wd_dreamcatcher", ["いい ゆめ つかまえて", "はねが ふわふわ", "こわい ゆめは ばいばい"], "spark", [24, 0, 66], [1175, 1568, 1319]);
  wallSimple("wd_hat_hooks", ["どの ぼうしに しよう？", "むぎわら ぼうし すき", "ニット ぼうし あったかそう"], "note", [48, 0, 40], [659, 784, 880]);
  // ウクレレ: タップで ぽろろん（いとが ふるえる）
  FurnLive.register("wd_ukulele", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; const ch = [[392, 523, 659, 880], [440, 587, 698, 880], [392, 494, 587, 784]][st.n % 3]; melody([...ch, null, ...ch], 0.05, "triangle", 0.1, 0.5); sayWall(sc, it, ["ぽろろ〜ん♪", "うたおう うたおう", "みなみの しまの おと"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > 1.6) return;
      ctx.save(); wallTf(ctx, sc, it); ctx.strokeStyle = "#FFFDF6"; ctx.lineWidth = 0.6;
      [18.2, 19.4, 20.6, 21.8].forEach((x, i) => { const w = Math.sin(k * 60 + i) * Math.exp(-k * 3) * 1.1; ctx.beginPath(); ctx.moveTo(x, 14); ctx.quadraticCurveTo(x + w, 42, x, 71); ctx.stroke(); });
      ctx.restore();
      FXS.note(ctx, P(sc, it), st, 20, 0, 40);
    },
  });
  wallSimple("wd_trio_portrait", ["3にん なかよし！", "えの なかでも いっしょ", "きんの がくぶち ごうか"], "heart", [44, 0, 56], [523, 659, 784, 1047]);
  wallSimple("wd_dry_flower", ["やさしい いろの はな", "ほした おはなも きれい", "リボンが かわいい"], "petal", [29, 0, 50], [784, 659, 784]);
  // めくり カレンダー: きょうの ひづけ（Seasonal.override も）。タップで ぺらっと めくれて「◯がつ ◯にち」
  FurnLive.register("wd_calendar", {
    tap(sc, it, st) { st.t0 = G.t; const d = dateNow(); tone([880, 1175], 0.08, "triangle", 0.07); sayWall(sc, it, `きょうは ${d.getMonth() + 1}がつ ${d.getDate()}にち`, "note"); },
    draw(ctx, sc, it, r, st) {
      const d = dateNow(), k = since(st);
      ctx.save(); wallTf(ctx, sc, it); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 8px sans-serif"; ctx.fillText(`${d.getMonth() + 1}がつ`, 24, 10.4);
      ctx.fillStyle = [0, 6].includes(d.getDay()) ? "#E0574F" : INK; ctx.font = "bold 26px sans-serif"; ctx.fillText(String(d.getDate()), 24, 33);
      ctx.fillStyle = "#8C959E"; ctx.font = "bold 6px sans-serif"; ctx.fillText(["にち", "げつ", "か", "すい", "もく", "きん", "ど"][d.getDay()] + "ようび", 24, 47);
      if (st.t0 >= 0 && k < 0.6) { const u = k / 0.6; ctx.fillStyle = "#FFFFFF"; ink(ctx, 1); ctx.beginPath(); ctx.moveTo(2, 16); ctx.lineTo(46, 16); ctx.lineTo(46, 16 + 44 * (1 - u)); ctx.quadraticCurveTo(24, 16 + 44 * (1 - u) + 10 * u, 2, 16 + 44 * (1 - u) * 0.6); ctx.closePath(); ctx.globalAlpha = 1 - u * 0.6; ctx.fill(); ctx.stroke(); }
      ctx.restore();
    },
  }, true);
  wallSimple("wd_space_poster", ["うちゅうに いきたい！", "ロケット はっしゃ〜", "わっかの ある ほし"], "spark", [22, 0, 52], [523, 784, 1047, 1568]);
  wallSimple("wd_shell_wreath", ["うみの におい", "ひとでさん こんにちは", "なみの おとが きこえそう"], "bubble", [32, 0, 32], [659, 784, 988, 784]);
  wallSimple("wd_skateboard", ["かっこいい！", "いなずまの もよう", "スケボー のって みたい"], "spark", [18, 0, 46], [392, 523, 659]);
  wallSimple("wd_geo_shelf", ["かくかくの たな", "おしゃれな へやに なった", "ちきゅうぎも ある"], "puff", [26, 0, 36], [523, 659, 523]);
  // たこの かざり: しっぽが ゆらゆら（タップで おおきく）
  FurnLive.register("wd_kite", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 880, 1047], 0.08, "triangle", 0.08); sayWall(sc, it, ["たこ あげ したいな", "しっぽが ゆらゆら", "そらまで とんでけ〜"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st), big = 1 + (st.t0 >= 0 ? 2.4 * Math.exp(-k * 1.2) : 0), w = (y) => Math.sin(G.t * 2 + y * 0.12) * (y - 54) * 0.12 * big;
      ctx.save(); wallTf(ctx, sc, it);
      ctx.strokeStyle = "#8C7A5A"; ctx.lineWidth = 1; ctx.beginPath(); for (let y = 54; y <= 88; y += 2) { const x = 29 + w(y); y === 54 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      BOWS.forEach(([x0, y, c]) => { const x = x0 + w(y); ctx.fillStyle = c; ink(ctx, 0.8); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 4, y - 2.4); ctx.lineTo(x, y); ctx.lineTo(x + s * 4, y + 2.4); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
      ctx.restore();
    },
  }, true);

  // ================= かぐやさんの「かべかざり」=================
  // ひがわりの つぎに あたらしい かべかざり（ふだ「あたらしい」）→ まえからの かべかざり
  const shop = BUY_SHOPS.furniture, items0 = shop.items, SET = new Set(IDS);
  shop.items = (tab) => {
    const list = items0(tab);
    if (tab !== "wall") return list;
    const daily = typeof FurnCollection !== "undefined" ? list.filter((f) => FurnCollection.DAILY.has(f.id)) : [];
    return [...daily, ...list.filter((f) => SET.has(f.id)), ...list.filter((f) => !SET.has(f.id) && !daily.includes(f))];
  };
  const card0 = ShopUI.card;
  ShopUI.card = function (shopId, tab, it, onBuy) {
    const c = card0.call(this, shopId, tab, it, onBuy);
    if (shopId === "furniture" && SET.has(it.id)) { c.classList.add("wd-card"); c.append(U.el("span", { class: "wd-tag", text: "あたらしい" })); }
    return c;
  };

  return {
    IDS, ROWS,
    LIVE: ["wd_round_clock", "wd_moon_stars", "wd_fish_tank", "wd_pinwheel", "wd_star_neon", "wd_calendar", "wd_kite"],
    LAMPS: ["wd_star_lights", "wd_star_neon"],
    art: (id, o) => ART[id](o),
  };
})();
