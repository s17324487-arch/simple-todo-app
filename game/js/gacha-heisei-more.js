// Meeときょれじゃ 4F「ガチャガチャの もり」の しまに「へいせい じょじ」ふうの 5シリーズ（UI-80。オーナーの FB 2026-10-04 の つづき:
// 「平成女児シリーズとは、例えば ナルミヤキャラクターズ・たまごっち・セボンスター・ほっぺちゃん・オシャレ魔女 ラブ and ベリー・一期一会 など」）。
// ・ほんものの しょうひんの「らしさ」（モチーフ・そざい・いろ）だけを さんこうに した オリジナルの デザイン。しょうひんめい・キャラクター・ロゴは つかわない
//   （ゲームは GitHub Pages で こうかい して いる ため）。たまごがたの けいたい ペットは UI-79 の「ぽけっと たまご」。
//   ゆめかわ ジュニア（パステルの ジュニア ふく・どうぶつの ワッペン）／おかしの ほうせき（おかしの おまけの ペンダント）／
//   ぷにぷに しずく（しずくがたの ぷにぷに マスコット）／キラキラ ステージ（カードで きがえて おどる ステージの いしょう）／
//   ポエムの ぶんぐ（ことばと えの メモちょう・レターセット）。
// ・5シリーズ × 4しゅ（ふつう 3・レア 1）。ねだん・かくりつは いままで どおり（200コイン・ふつう 30%・レア 10%）。Gacha.add で 47〜51 ばん
//   （gacha-heisei.js の あと・mee-rotation.js の まえに よむ）。
// ・しゅうがわり（js/mee-rotation.js）: 4F の しま 5つ（GachaForest.ISLES の add）に 1シリーズずつ たす → しまは 3だい・5シリーズ。
//   1しゅうめ（2026-09-28〜）の ならびは まえと おなじ・2しゅうめ（10-05〜）に 2F の へいせい 4シリーズと いっしょに はじめて はいる。
// ・レアでも まわりに キラキラは かかない（UI-50・UI-66）。服の 絵は WEAR.heisei_*（id は ctx.uid つき）・フィギュアは 100×110 の 絵（id なし）。
// ・セーブ: Save.d.gacha（まえと おなじ）。もちものは Save.d.furn／Save.d.wardrobe。
const GachaHeiseiMore = (() => {
  const A = GachaForestArt, K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const { svg, sk, shadow, shine } = A;
  const dot = (x, y, r, c, w = 1.4) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}"${w ? " " + sk(w) : ""}/>`;
  const heart = (x, y, s, c, w = 1.6) => `<path d="M${f1(x)},${f1(y + 6 * s)} C${f1(x - 7 * s)},${f1(y + 1 * s)} ${f1(x - 6 * s)},${f1(y - 6 * s)} ${f1(x)},${f1(y - 3 * s)} C${f1(x + 6 * s)},${f1(y - 6 * s)} ${f1(x + 7 * s)},${f1(y + 1 * s)} ${f1(x)},${f1(y + 6 * s)} Z" fill="${c}"${w ? " " + sk(w) : ""}/>`;
  const star = (x, y, r, c, w = 1.4, r2 = 0.45) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * r2 : r; d += (i ? "L" : "M") + f1(x + Math.cos(a) * rr) + "," + f1(y + Math.sin(a) * rr); } return `<path d="${d}Z" fill="${c}"${w ? " " + sk(w) : ""}/>`; };
  const flower = (x, y, r, c, mid = "#FFE07A", w = 1.2) => [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(r * 0.72)}" fill="${c}" ${sk(w)}/>`; }).join("") + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.62)}" fill="${mid}" ${sk(w)}/>`;
  const base = (c = "#FBD3E6", rx = 36) => `${shadow(rx + 4, 104)}<ellipse cx="50" cy="98" rx="${rx}" ry="7.4" fill="${c}" ${sk(2.2)}/><ellipse cx="50" cy="96.4" rx="${rx - 8}" ry="4.2" fill="#FFFFFF" opacity="0.55"/>`;
  const lines = (x0, x1, y0, y1, step, c = "#BFD8F0") => { let s = ""; for (let y = y0; y <= y1; y += step) s += `<path d="M${f1(x0)},${f1(y)} H${f1(x1)}" stroke="${c}" stroke-width="1"/>`; return s; };
  // てがきふうの なみせん（ことばの かわり。もじは かかない）
  const scribble = (x0, x1, y, c = "#F48FB8", amp = 1.4) => { let d = `M${f1(x0)},${f1(y)}`; for (let x = x0; x < x1; x += 4) d += ` q2,${f1(-amp)} 4,0`; return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`; };

  // ---- 3. ぷにぷに しずく（しずくがたの ぷにぷに マスコット）----
  const DROP = "M50,20 C57,34 77,46 77,67 C77,83 65,93 50,93 C35,93 23,83 23,67 C23,46 43,34 50,20 Z";
  const strap = () => `<path d="M50,20 C44,10 34,8 30,14" fill="none" stroke="${K}" stroke-width="1.2" stroke-dasharray="1.6 1.4"/>` + [[45, 12.6], [40, 10], [35, 10.6], [31.4, 13.4]].map(([x, y]) => dot(x, y, 1.5, "#D9DEE8", 1)).join("") + `<circle cx="50" cy="20" r="3.6" fill="none" stroke="${K}" stroke-width="3.2"/><circle cx="50" cy="20" r="3.6" fill="none" stroke="#D9DEE8" stroke-width="1.4"/>`;
  // ラメ（からだの なかの つぶ。からだの そとには かかない）
  const flecks = (cols) => [[38, 52], [61, 50], [33, 72], [67, 74], [44, 84], [58, 86], [50, 44], [36, 62], [64, 62], [55, 79]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.3}" fill="${cols[i % cols.length]}"/>`).join("");
  const face = (kind) => {
    let s = `<ellipse cx="36.5" cy="74" rx="5" ry="3" fill="#FF8FB1" opacity="0.75"/><ellipse cx="63.5" cy="74" rx="5" ry="3" fill="#FF8FB1" opacity="0.75"/>`;
    const eye = (x) => `<ellipse cx="${x}" cy="67" rx="2.8" ry="3.4" fill="${K}"/><circle cx="${x + 1}" cy="65.8" r="1" fill="#FFFFFF"/>`;
    const smile = (x) => `<path d="M${x - 3.4},67.6 Q${x},63.6 ${x + 3.4},67.6" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (kind === "dot") s += eye(42) + eye(58);
    else if (kind === "smile") s += smile(42) + smile(58);
    else if (kind === "wink") s += eye(42) + smile(58);
    else s += eye(42) + eye(58) + `<circle cx="41" cy="68.4" r="0.7" fill="#FFFFFF"/><circle cx="57" cy="68.4" r="0.7" fill="#FFFFFF"/>`;
    return s + `<path d="M46.6,73.6 Q48.3,75.6 50,73.6 Q51.7,75.6 53.4,73.6" fill="none" stroke="${K}" stroke-width="1.5" stroke-linecap="round"/>`;
  };
  const puni = (c, faceKind, deco, rare) => {
    let s = base(rare ? "#E9DCFA" : "#EAF4FF", 30) + strap();
    s += `<path d="${DROP}" fill="${c}" ${sk()}/>`;
    // ぷにっと した つや（ひだりうえ）と そこの こい いろ
    s += `<path d="M50,26 C54,36 68,46 70,62 C66,52 58,44 50,40 Z" fill="#FFFFFF" opacity="0.25"/><path d="M27,74 C30,86 40,91 50,91 C60,91 70,86 73,74 C68,84 60,88 50,88 C40,88 32,84 27,74 Z" fill="#000000" opacity="0.06"/>`;
    s += flecks(rare ? ["#FFFFFF", "#FFE07A", "#FFC2D9"] : ["#FFFFFF", "#FFFFFF", "#FFE9A0"]);
    s += `<path d="M34,50 C36,43 41,38 45,35" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.8"/><circle cx="32" cy="57" r="1.8" fill="#FFFFFF" opacity="0.8"/>`;
    return s + face(faceKind) + deco;
  };
  const berryClip = () => `<path d="M64,38 C58,38 57,46 64,50 C71,46 70,38 64,38 Z" fill="#F0525E" ${sk(1.4)}/><path d="M60.6,38.4 L64,34.6 L67.4,38.4 Z" fill="#6DBE5A" ${sk(1)}/>` + [[62.4, 42], [65.6, 42], [64, 45.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="#FFE07A"/>`).join("");
  const bubbles = () => [[40, 54, 3], [60, 56, 2.4], [54, 47, 1.8], [44, 46, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" fill-opacity="0.35" stroke="#FFFFFF" stroke-width="1"/>`).join("") + `<path d="M58,32 L66,22" stroke="${K}" stroke-width="4.6" stroke-linecap="round"/><path d="M58,32 L66,22" stroke="#FF9EC4" stroke-width="2.4" stroke-linecap="round"/>`;
  const lemonClip = () => `<circle cx="36" cy="44" r="7" fill="#FFE07A" ${sk(1.4)}/><circle cx="36" cy="44" r="4.6" fill="#FFF6C4"/>` + [0, 1, 2, 3, 4, 5].map((i) => { const a = (i * Math.PI) / 3; return `<path d="M36,44 L${f1(36 + Math.cos(a) * 4.6)},${f1(44 + Math.sin(a) * 4.6)}" stroke="#F2C14E" stroke-width="0.9"/>`; }).join("");
  const crown = () => `<path d="M40,30 L39,20 L45,25 L50,17 L55,25 L61,20 L60,30 Z" fill="#FFD84D" ${sk(1.5)}/><circle cx="50" cy="26" r="1.6" fill="#FF7BAA"/><circle cx="43" cy="27.4" r="1.1" fill="#7FD3F0"/><circle cx="57" cy="27.4" r="1.1" fill="#9ED36A"/>`;

  // ---- 5. ポエムの ぶんぐ（ことばと えの メモちょう・レターセット）----
  const memoPad = () => {
    let s = base("#FFF0D6");
    s += `<g transform="rotate(-8 50 60)"><rect x="25" y="26" width="52" height="62" rx="3" fill="#CFE3FA" ${sk(1.8)}/></g><g transform="rotate(5 50 60)"><rect x="24" y="25" width="52" height="62" rx="3" fill="#FFE1EC" ${sk(1.8)}/></g>`;
    s += `<rect x="23" y="22" width="54" height="66" rx="3" fill="#FFFFFF" ${sk()}/><path d="M23,32 H77 V25 C77,23 76,22 74,22 H26 C24,22 23,23 23,25 Z" fill="#FF9EC4" ${sk(1.6)}/>`;
    s += [30, 38, 46, 54, 62, 70].map((x) => `<circle cx="${x}" cy="27" r="1.6" fill="#FFFFFF" ${sk(1)}/>`).join("");
    s += lines(28, 72, 42, 82, 8) + scribble(30, 64, 41) + scribble(30, 70, 49, "#9C7FD6") + scribble(30, 58, 57) + scribble(30, 66, 65, "#7FB8E6");
    s += flower(66, 76, 3.4, "#FFB8D2") + `<path d="M60,82 C62,78 64,78 66,80" fill="none" stroke="#6DBE5A" stroke-width="1.4" stroke-linecap="round"/>`;
    return s + shine("M27,36 V48", 1.6);
  };
  const letterSet = () => {
    let s = base("#E4F4E0");
    s += `<g transform="rotate(-10 50 58)"><rect x="24" y="18" width="50" height="62" rx="2" fill="#FFFFFF" ${sk(2)}/>` + lines(29, 69, 30, 70, 7, "#CDE7C2") + scribble(30, 62, 29, "#6DBE5A") + scribble(30, 66, 36, "#F48FB8");
    s += [[28, 22], [70, 22], [28, 76], [70, 76]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3].map((i) => `<circle cx="${i % 2 ? 2 : -2}" cy="${i < 2 ? -2 : 2}" r="2" fill="#9ED36A"/>`).join("")}</g>`).join("") + `</g>`;
    // ふうとう（ハートの シール）
    s += `<g transform="rotate(6 52 76)"><rect x="24" y="58" width="56" height="36" rx="3" fill="#FFD6E6" ${sk()}/><path d="M24.6,59.4 L52,78 L79.4,59.4" fill="none" ${sk(2)}/><path d="M25,93 L46,75 M79,93 L58,75" fill="none" stroke="#E79AB8" stroke-width="1.4"/>` + heart(52, 77, 0.9, "#FF6F91", 1.4) + `</g>`;
    return s;
  };
  const lockDiary = () => {
    let s = base("#D7F2E8");
    s += `<path d="M28,24 H72 C75,24 77,26 77,29 V86 C77,89 75,91 72,91 H28 Z" fill="#FFFFFF" ${sk(1.8)}/>` + [80, 83, 86].map((y) => `<path d="M30,${y} H74" stroke="#DDE3EC" stroke-width="1"/>`).join("");
    s += `<rect x="22" y="20" width="52" height="68" rx="6" fill="#9FDCC8" ${sk()}/>`;
    // キルトの ふっくら ステッチ（ひょうしの なかに おさまる ように はしを きる。clipPath の id は つかわない）
    for (let x0 = -8; x0 <= 104; x0 += 10) for (const d of [1, -1]) {
      const t0 = Math.max(0, d > 0 ? (22 - x0) / 30 : (x0 - 74) / 30), t1 = Math.min(1, d > 0 ? (74 - x0) / 30 : (x0 - 22) / 30); if (t1 <= t0) continue;
      s += `<path d="M${f1(x0 + d * t0 * 30)},${f1(20 + t0 * 68)} L${f1(x0 + d * t1 * 30)},${f1(20 + t1 * 68)}" stroke="#FFFFFF" stroke-width="1.1" stroke-dasharray="2.6 2.2" opacity="0.8"/>`;
    }
    s += `<rect x="22" y="20" width="52" height="68" rx="6" fill="none" ${sk()}/><rect x="22" y="20" width="9" height="68" rx="4" fill="#7FC7B0" ${sk(2)}/>`;
    s += heart(48, 46, 1.6, "#FF9EC4", 1.6) + shine("M42,42 q2 -3 5 -2.6", 1.4);
    // ベルトと ハートの じょう（かぎ）
    s += `<path d="M66,48 H82 C84,48 85,50 85,52 V60 C85,62 84,64 82,64 H66 Z" fill="#FF9EC4" ${sk(1.8)}/><path d="M73,50 C73,45 80,45 80,50" fill="none" stroke="${K}" stroke-width="3.6"/><path d="M73,50 C73,45 80,45 80,50" fill="none" stroke="#F2C14E" stroke-width="1.8"/>`;
    s += heart(76.5, 56, 1.15, "#F2C14E", 1.4) + `<circle cx="76.5" cy="55.4" r="1.1" fill="${K}"/>`;
    s += `<path d="M76.5,64 C74,72 80,74 78,82" fill="none" stroke="#B79BEA" stroke-width="1.6"/><path d="M78,82 l3,0 M78,85 l2.4,0 M78,82 V88" stroke="#F2C14E" stroke-width="2" stroke-linecap="round"/><circle cx="78" cy="80" r="2.2" fill="none" stroke="#F2C14E" stroke-width="1.6"/>`;
    return s;
  };
  const starNote = () => {
    let s = base("#E9DCFA");
    s += `<path d="M30,22 H74 C77,22 79,24 79,27 V88 C79,91 77,93 74,93 H30 Z" fill="#FFFFFF" ${sk(1.8)}/>` + [84, 87, 90].map((y) => `<path d="M32,${y} H76" stroke="#DDE3EC" stroke-width="1"/>`).join("");
    s += `<rect x="22" y="18" width="54" height="72" rx="5" fill="#33407A" ${sk()}/>`;
    s += `<rect x="22" y="72" width="54" height="7" fill="#FFB8D2"/><rect x="22" y="79" width="54" height="5" fill="#C9B3F0"/><rect x="22" y="18" width="54" height="72" rx="5" fill="none" ${sk()}/>`;
    // つきと ほし（ひょうしの え）
    s += `<path d="M40,30 C32,32 30,44 37,50 C42,54 50,52 52,46 C46,48 40,44 40,38 C40,35 41,32 40,30 Z" fill="#FFE9A0" ${sk(1.4)}/>`;
    s += star(60, 34, 4, "#FFE07A", 1.2) + star(66, 52, 3, "#FFFFFF", 1) + star(52, 60, 2.4, "#FFE07A", 1) + [[30, 62], [46, 66], [62, 64], [70, 28], [34, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#FFFFFF"/>`).join("");
    s += `<rect x="64" y="18" width="5" height="72" fill="#B79BEA" ${sk(1.2)}/>`;
    return s + shine("M26,26 V40", 1.6);
  };

  // ---- 服の 絵 ----
  const fx = (n) => (Math.round(n * 100) / 100).toString();
  // 1-a くまの トレーナー（ふく）: パステルの トレーナー・むねの くまの ワッペン・すその リブと にじいろの せん
  const bearPatch = (x, y) => `<rect x="${fx(x - 12)}" y="${fx(y - 12)}" width="24" height="23" rx="6" fill="#FFFFFF" ${stroke(2.4)}/><rect x="${fx(x - 9.6)}" y="${fx(y - 9.6)}" width="19.2" height="18.2" rx="4" fill="none" stroke="#F2B04A" stroke-width="1.3" stroke-dasharray="2.4 1.8"/>`
    + `<circle cx="${fx(x - 6)}" cy="${fx(y - 5)}" r="3.4" fill="#C98E5C" ${stroke(1.8)}/><circle cx="${fx(x + 6)}" cy="${fx(y - 5)}" r="3.4" fill="#C98E5C" ${stroke(1.8)}/><circle cx="${fx(x)}" cy="${fx(y + 0.5)}" r="6.6" fill="#C98E5C" ${stroke(1.8)}/>`
    + `<ellipse cx="${fx(x)}" cy="${fx(y + 2.6)}" rx="3.4" ry="2.5" fill="#F2D9B8"/><ellipse cx="${fx(x)}" cy="${fx(y + 1.6)}" rx="1.3" ry="1" fill="${K}"/><circle cx="${fx(x - 2.6)}" cy="${fx(y - 1.2)}" r="0.95" fill="${K}"/><circle cx="${fx(x + 2.6)}" cy="${fx(y - 1.2)}" r="0.95" fill="${K}"/>`;
  WEAR.heisei_beartrainer = (ctx) => {
    const T = ctx.a.torso, c = ctx.col[0] || "#FFC2D9", back = ctx.view === "back";
    const hem = T.top + (T.bottom - T.top) * 0.74;
    let inner = garment(ctx, hem, c) + `<rect x="0" y="${fx(hem - 9)}" width="210" height="9" fill="${shade(c, -0.12)}"/>`;
    for (let x = 3; x < 210; x += 6) inner += `<path d="M${x},${fx(hem - 8)} V${fx(hem - 1)}" stroke="${shade(c, -0.28)}" stroke-width="1.2"/>`;
    ["#9ED8C8", "#FFE07A", "#FF9EC4"].forEach((col, i) => (inner += `<rect x="0" y="${fx(hem - 16 - i * 3.4)}" width="210" height="2.4" fill="${col}"/>`));
    inner += `<path d="M0,${fx(hem)} L210,${fx(hem)}" ${stroke()}/>`;
    if (!back) inner += bearPatch(T.cx, T.top + (hem - 26 - T.top) * 0.55 + 6);
    return { sleeve: sleeves(ctx, c), torso: torsoClip(ctx, inner) };
  };
  // 1-b ギンガムの ベレー（あたま・ぼうし）: ギンガム チェック・リボン
  WEAR.heisei_ginghambere = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#F7A8C8", rb = ctx.col[1] || "#FFFFFF", id = "hgb" + ctx.uid, back = ctx.view === "back";
      const P = "M-52,2 C-60,-30 40,-44 58,-10 C62,0 40,8 0,6 C-30,6 -48,6 -52,2 Z";
      let check = "";
      for (let x = -60; x < 64; x += 12) check += `<rect x="${x}" y="-50" width="6" height="60" fill="#FFFFFF" opacity="0.45"/>`;
      for (let y = -48; y < 10; y += 12) check += `<rect x="-62" y="${y}" width="126" height="6" fill="#FFFFFF" opacity="0.45"/>`;
      let o = `<g transform="rotate(-10)"><clipPath id="${id}"><path d="${P}"/></clipPath><path d="${P}" fill="${c}"/><g clip-path="url(#${id})">${check}</g><path d="${P}" fill="none" ${stroke(s)}/>`;
      o += `<path d="M-2,-33 L0,-44" fill="none" ${stroke(s)}/><path d="M-40,2 C-10,8 30,6 50,-2" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${fx(s * 0.7)}" stroke-linecap="round"/></g>`;
      if (!back) o += `<g transform="translate(36,-14) rotate(16)"><path d="M0,0 C-8,-12 -22,-10 -20,0 C-22,10 -8,12 0,0 Z" fill="${rb}" ${stroke(s * 0.8)}/><path d="M0,0 C8,-12 22,-10 20,0 C22,10 8,12 0,0 Z" fill="${rb}" ${stroke(s * 0.8)}/><circle cx="0" cy="0" r="5" fill="${c}" ${stroke(s * 0.8)}/></g>`;
      return o;
    }),
  });
  // 1-c レースの つけえり（くび）: なみなみの レースの えり・ピンクの リボン
  WEAR.heisei_lacecollar = (ctx) => {
    if (ctx.view === "back") return { top: neckWrap(ctx, (s) => `<path d="M-44,0 C-20,9 20,9 44,0" fill="none" stroke="${K}" stroke-width="${fx(s * 1.9)}" stroke-linecap="round"/><path d="M-44,0 C-20,9 20,9 44,0" fill="none" stroke="#FFFFFF" stroke-width="${fx(s * 1.1)}" stroke-linecap="round"/>`) };
    return {
      top: neckWrap(ctx, (s) => {
        const rb = ctx.col[0] || "#FF8FB1", side = ctx.view === "side";
        const flap = (d) => `M0,-2 C${d * -12},-4 ${d * -38},-6 ${d * -45},4 C${d * -48},16 ${d * -30},22 ${d * -8},17 C${d * -2},15 0,8 0,-2 Z`;
        let o = "";
        for (const d of side ? [1] : [1, -1]) {
          let lace = "";
          for (let i = 0; i <= 6; i++) { const t = i / 6, x = d * (-44 + t * 38), y = 6 + Math.sin(t * Math.PI) * 13; lace += `<circle cx="${fx(x)}" cy="${fx(y)}" r="3.4" fill="#FFFFFF" ${stroke(s * 0.35)}/>`; }
          o += lace + `<path d="${flap(d)}" fill="#FFFFFF" ${stroke(s * 0.7)}/><path d="M${d * -38},4 C${d * -30},12 ${d * -18},13 ${d * -8},10" fill="none" stroke="#E6DDEB" stroke-width="${fx(s * 0.4)}" stroke-dasharray="${fx(s * 0.6)} ${fx(s * 0.5)}"/>`;
        }
        return o + `<path d="M0,6 C-6,-2 -16,0 -14,6 C-16,12 -6,14 0,6 Z M0,6 C6,-2 16,0 14,6 C16,12 6,14 0,6 Z" fill="${rb}" ${stroke(s * 0.6)}/><path d="M-2,8 L-6,20 M2,8 L6,20" stroke="${rb}" stroke-width="${fx(s * 0.9)}" stroke-linecap="round"/><circle cx="0" cy="6" r="3.4" fill="${shade(rb, -0.15)}" ${stroke(s * 0.5)}/>`;
      }),
    };
  };
  // 1-d ピアノの ワンピース（ふく・レア）: ふりふりの すそ・けんばんの もよう・こしの リボン
  WEAR.heisei_pianodress = (ctx) => {
    const T = ctx.a.torso, c = ctx.col[0] || "#D7C2F0", rb = ctx.col[1] || "#FFB8D2", back = ctx.view === "back", id = "hpd" + ctx.uid;
    const waist = T.top + (T.bottom - T.top) * 0.42, hw = T.w / 2 + 4, hem = T.bottom - 4, flare = T.w * 0.26;
    const P = `M${fx(T.cx - hw + 2)},${fx(waist)} C${fx(T.cx - hw - flare * 0.4)},${fx(waist + 16)} ${fx(T.cx - hw - flare)},${fx(hem - 8)} ${fx(T.cx - hw - flare)},${fx(hem)} C${fx(T.cx - hw / 2)},${fx(hem + 8)} ${fx(T.cx + hw / 2)},${fx(hem + 8)} ${fx(T.cx + hw + flare)},${fx(hem)} C${fx(T.cx + hw + flare)},${fx(hem - 8)} ${fx(T.cx + hw + flare * 0.4)},${fx(waist + 16)} ${fx(T.cx + hw - 2)},${fx(waist)} Z`;
    // けんばん（しろい おびと くろい けん）
    let keys = `<rect x="0" y="${fx(hem - 15)}" width="210" height="13" fill="#FFFFFF"/><path d="M0,${fx(hem - 15)} H210" stroke="${K}" stroke-width="1.6"/>`;
    for (let x = T.cx - hw - flare, i = 0; x < T.cx + hw + flare; x += 6.4, i++) keys += i % 7 === 2 || i % 7 === 6 ? "" : `<rect x="${fx(x + 4)}" y="${fx(hem - 15)}" width="3.2" height="7.6" fill="${K}"/>`;
    let frill = "";
    for (let x = T.cx - hw - flare + 3; x <= T.cx + hw + flare - 3; x += 7) frill += `<circle cx="${fx(x)}" cy="${fx(hem + 2.6 - Math.cos(((x - T.cx) / (hw + flare)) * 1.2) * 4)}" r="4" fill="#FFFFFF" ${stroke(1.6)}/>`;
    const skirt = frill + `<clipPath id="${id}"><path d="${P}"/></clipPath><path d="${P}" fill="${c}"/><g clip-path="url(#${id})">${keys}</g><path d="${P}" fill="none" ${stroke(3.5)}/>`;
    const top = torsoClip(ctx, garment(ctx, waist + 2, c) + (back ? "" : `<path d="M${fx(T.cx - 14)},${fx(T.top + 2)} Q${fx(T.cx)},${fx(T.top + 16)} ${fx(T.cx + 14)},${fx(T.top + 2)}" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-dasharray="1 4.4" stroke-linecap="round"/>`));
    const bow = back ? `<path d="M${T.cx},${fx(waist)} l-15,-9 l0,18 Z M${T.cx},${fx(waist)} l15,-9 l0,18 Z" fill="${rb}" ${stroke(3)}/><path d="M${fx(T.cx - 4)},${fx(waist + 2)} l-6,18 M${fx(T.cx + 4)},${fx(waist + 2)} l6,18" stroke="${rb}" stroke-width="4.6" stroke-linecap="round"/>`
      : `<path d="M${T.cx},${fx(waist)} l-10,-6 l0,12 Z M${T.cx},${fx(waist)} l10,-6 l0,12 Z" fill="${rb}" ${stroke(2.6)}/><circle cx="${T.cx}" cy="${fx(waist)}" r="3.2" fill="${shade(rb, -0.15)}" ${stroke(2)}/>`;
    return { sleeve: sleeves(ctx, c), torso: top + skirt + bow };
  };
  // 2. おかしの ほうせき（くび）: きんいろの くさりと ふち・いろの ついた いし（ハート・ほし・おはな・にじいろ）
  const jewel = (shape) => (ctx) => {
    if (ctx.view === "back") return {};
    return {
      top: neckWrap(ctx, (s) => {
        const gem = ctx.col[0] || "#FF7BAA", metal = ctx.col[1] || "#F2C14E", y = 28;
        let o = `<path d="M-32,-4 C-20,10 -8,17 0,${y - 12} M32,-4 C20,10 8,17 0,${y - 12}" fill="none" stroke="${K}" stroke-width="${fx(s * 0.9)}" stroke-linecap="round"/><path d="M-32,-4 C-20,10 -8,17 0,${y - 12} M32,-4 C20,10 8,17 0,${y - 12}" fill="none" stroke="${metal}" stroke-width="${fx(s * 0.5)}" stroke-dasharray="${fx(s * 0.5)} ${fx(s * 0.35)}" stroke-linecap="round"/>`;
        o += `<circle cx="0" cy="${y - 12}" r="3" fill="${metal}" ${stroke(s * 0.45)}/>`;
        if (shape === "heart") o += `<path d="${heartPath(0, y, 2.3)}" fill="${metal}" ${stroke(s * 0.55)}/><path d="${heartPath(0, y - 0.4, 1.65)}" fill="${gem}" ${stroke(s * 0.3)}/>`;
        else if (shape === "star") o += `<path d="${starPath(0, y, 15, 7)}" fill="${metal}" ${stroke(s * 0.55)}/><path d="${starPath(0, y, 10.6, 4.9)}" fill="${gem}" ${stroke(s * 0.3)}/>`;
        else if (shape === "flower") { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; o += `<circle cx="${fx(Math.cos(a) * 8.6)}" cy="${fx(y + Math.sin(a) * 8.6)}" r="6.6" fill="${metal}" ${stroke(s * 0.45)}/><circle cx="${fx(Math.cos(a) * 8.6)}" cy="${fx(y + Math.sin(a) * 8.6)}" r="4.4" fill="${gem}"/>`; } o += `<circle cx="0" cy="${y}" r="5.4" fill="#FFFFFF" ${stroke(s * 0.4)}/>`; }
        else {
          o += `<circle cx="0" cy="${y}" r="15" fill="${metal}" ${stroke(s * 0.55)}/>`;
          const C = ["#FF8FB1", "#FFD84D", "#9ED8C8", "#7FC8F0", "#C9B3F0", "#FFB38A"], r = 11;
          C.forEach((col, i) => { const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / C.length, a1 = a0 + (2 * Math.PI) / C.length; o += `<path d="M0,${y} L${fx(Math.cos(a0) * r)},${fx(y + Math.sin(a0) * r)} A${r},${r} 0 0,1 ${fx(Math.cos(a1) * r)},${fx(y + Math.sin(a1) * r)} Z" fill="${col}"/>`; });
          o += `<circle cx="0" cy="${y}" r="${r}" fill="none" ${stroke(s * 0.3)}/><circle cx="0" cy="${y}" r="4.4" fill="#FFFFFF" opacity="0.7"/>`;
        }
        return o + `<path d="M-4.6,${y - 5} q2.4 -3 5.4 -2.6" fill="none" stroke="#FFFFFF" stroke-width="${fx(s * 0.45)}" stroke-linecap="round"/>`;
      }),
    };
  };
  WEAR.heisei_jewel_heart = jewel("heart"); WEAR.heisei_jewel_star = jewel("star"); WEAR.heisei_jewel_flower = jewel("flower"); WEAR.heisei_jewel_rainbow = jewel("rainbow");
  // 4-a ほしの ヘッドセット（あたま・カチューシャ）: うたって おどる ときの マイク つき ヘッドセット
  WEAR.heisei_headset = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#B79BEA", c2 = ctx.col[1] || "#FFE07A", side = ctx.view === "side", back = ctx.view === "back";
      let o = `<path d="M-47,6 C-50,-50 50,-50 47,6" fill="none" stroke="${K}" stroke-width="${fx(s * 2.6)}" stroke-linecap="round"/><path d="M-47,6 C-50,-50 50,-50 47,6" fill="none" stroke="${c}" stroke-width="${fx(s * 1.5)}" stroke-linecap="round"/>`;
      const pad = (x) => `<ellipse cx="${x}" cy="8" rx="9" ry="11" fill="${c}" ${stroke(s)}/><ellipse cx="${x}" cy="8" rx="4.4" ry="6" fill="${shade(c, 0.35)}"/>`;
      if (side) o += pad(-4);
      else o += pad(-48) + pad(48);
      if (!back) {
        // マイクは ほっぺの よこ（めや マスクに かからない）
        const x0 = side ? -4 : -48, mx = side ? -46 : -34, my = side ? 74 : 80;
        o += `<path d="M${x0},14 C${x0 - 6},44 ${mx - 12},${my} ${mx},${my}" fill="none" stroke="${K}" stroke-width="${fx(s * 1.3)}" stroke-linecap="round"/><path d="M${x0},14 C${x0 - 6},44 ${mx - 12},${my} ${mx},${my}" fill="none" stroke="${shade(c, -0.2)}" stroke-width="${fx(s * 0.55)}" stroke-linecap="round"/>`;
        o += `<path d="${starPath(mx + 2, my, 7.6, 3.6)}" fill="${c2}" ${stroke(s * 0.6)}/>`;
      }
      return o;
    }),
  });
  // 4-b ハートの マスカレード（かお）: ハートの かたちの マスク・はねの かざり
  WEAR.heisei_masque = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FF6FA6", fe = ctx.col[1] || "#C9B3F0";
      const hole = (x) => `M${x - 8},0 a8,6 0 1,0 16,0 a8,6 0 1,0 -16,0 Z`;
      const wing = "M0,-4 C-6,-16 -30,-20 -40,-10 C-46,-2 -40,10 -28,12 C-18,13 -8,9 0,4 C8,9 18,13 28,12 C40,10 46,-2 40,-10 C30,-20 6,-16 0,-4 Z";
      let o = `<path d="${wing} ${hole(-20)} ${hole(20)}" fill="${c}" fill-rule="evenodd" ${stroke(s * 0.8)}/>`;
      o += [[-34, -8], [-26, -14], [-10, -12], [10, -12], [26, -14], [34, -8], [-36, 4], [36, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${fx(s * 0.35)}" fill="#FFFFFF"/>`).join("");
      o += `<path d="M38,-12 C46,-30 60,-34 66,-28 C58,-26 50,-18 44,-8 Z" fill="${fe}" ${stroke(s * 0.6)}/><path d="M40,-12 C48,-22 56,-28 62,-28" fill="none" stroke="#FFFFFF" stroke-width="${fx(s * 0.3)}" stroke-linecap="round"/>`;
      return o;
    }),
  });
  // 4-c ラメの ファーストール（くび）: ふわふわの ストール・りょうはしが むねに たれる
  WEAR.heisei_furstole = (ctx) => ({
    top: neckWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFB8D8", hl = shade(c, 0.4), back = ctx.view === "back", side = ctx.view === "side";
      const puff = (x, y, r) => `<circle cx="${fx(x)}" cy="${fx(y)}" r="${r}" fill="${c}" ${stroke(s * 0.5)}/><circle cx="${fx(x - r * 0.3)}" cy="${fx(y - r * 0.3)}" r="${fx(r * 0.4)}" fill="${hl}"/>`;
      let o = "";
      for (let i = 0; i <= 8; i++) { const t = i / 8; o += puff(-48 + t * 96, -2 + Math.sin(t * Math.PI) * 10, 8); }
      if (!back) for (const d of side ? [1] : [-1, 1]) for (let j = 1; j <= 3; j++) o += puff(d * (30 - j * 1.6), 4 + j * 9, 7.4 - j * 0.4);
      return o + [[-30, 2], [-8, 9], [14, 8], [36, 1], [-26, 22], [28, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${fx(s * 0.35)}" fill="#FFFFFF"/>`).join("");
    }),
  });
  // 4-d スターの ステージ ドレス（ふく・レア）: ピンクの みごろ・ラベンダーの チュールの 2だんの スカート・ほしの アップリケ
  WEAR.heisei_stagedress = (ctx) => {
    const T = ctx.a.torso, c = ctx.col[0] || "#FF8FC0", c2 = ctx.col[1] || "#C9B3F0", back = ctx.view === "back";
    const waist = T.top + (T.bottom - T.top) * 0.4, hw = T.w / 2 + 4, hem = T.bottom - 4, flare = T.w * 0.3;
    const layer = (h, f, col) => {
      let d = `M${fx(T.cx - hw + 2)},${fx(waist)} C${fx(T.cx - hw - f * 0.4)},${fx(waist + 14)} ${fx(T.cx - hw - f)},${fx(h - 8)} ${fx(T.cx - hw - f)},${fx(h)}`;
      const n = 7, w = (2 * (hw + f)) / n;
      for (let i = 0; i < n; i++) { const x0 = T.cx - hw - f + i * w; d += ` Q${fx(x0 + w / 2)},${fx(h + 9)} ${fx(x0 + w)},${fx(h)}`; }
      d += ` C${fx(T.cx + hw + f)},${fx(h - 8)} ${fx(T.cx + hw + f * 0.4)},${fx(waist + 14)} ${fx(T.cx + hw - 2)},${fx(waist)} Z`;
      return `<path d="${d}" fill="${col}" ${stroke(3.5)}/>`;
    };
    let skirt = layer(hem, flare, c2) + layer(waist + (hem - waist) * 0.55, flare * 0.6, shade(c, 0.28));
    if (!back) skirt += [[-0.5, 0.78], [0.42, 0.7], [0.05, 0.9]].map(([dx, k]) => `<path d="${starPath(T.cx + dx * (hw + flare), waist + (hem - waist) * k, 6, 2.8)}" fill="#FFE07A" ${stroke(2)}/>`).join("");
    let inner = garment(ctx, waist + 2, c);
    if (!back) inner += `<path d="${starPath(T.cx, T.top + (waist - T.top) * 0.55, 8, 3.6)}" fill="#FFE07A" ${stroke(2.4)}/>`;
    const belt = `<path d="M${fx(T.cx - hw + 2)},${fx(waist)} H${fx(T.cx + hw - 2)}" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M${fx(T.cx - hw + 2)},${fx(waist)} H${fx(T.cx + hw - 2)}" stroke="#FFE07A" stroke-width="4" stroke-linecap="round"/>`
      + (back ? `<path d="M${T.cx},${fx(waist)} l-14,-8 l0,16 Z M${T.cx},${fx(waist)} l14,-8 l0,16 Z" fill="${c}" ${stroke(3)}/>` : "");
    return { sleeve: sleeves(ctx, c), torso: torsoClip(ctx, inner) + skirt + belt };
  };
  Object.assign(HeadPair.KIND, { heisei_headset: "band", heisei_ginghambere: "hat" });

  // ---- フィギュアの 絵（GachaArt.FIG・GachaForestArt.FIG）----
  const FIG = {
    gacha_heiseipuni_0: () => svg(100, 110, puni("#FFB3CF", "dot", berryClip())),
    gacha_heiseipuni_1: () => svg(100, 110, puni("#A9DDF2", "smile", bubbles())),
    gacha_heiseipuni_2: () => svg(100, 110, puni("#FFE58A", "wink", lemonClip())),
    gacha_heiseipuni_3: () => svg(100, 110, puni("#D7C2F0", "shine", crown(), true)),
    gacha_heiseipoem_0: () => svg(100, 110, memoPad()),
    gacha_heiseipoem_1: () => svg(100, 110, letterSet()),
    gacha_heiseipoem_2: () => svg(100, 110, lockDiary()),
    gacha_heiseipoem_3: () => svg(100, 110, starNote()),
  };
  Object.assign(A.FIG, FIG); Object.assign(GachaArt.FIG, FIG);

  // ---- シリーズ（[なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … 服）。isle: はいる 4F の しま ----
  const wearText = `でるのは ふくと アクセサリー（1こで ひとり・おなじ ものは ${WearStock.CAP}こ まで）`;
  const SERIES = [
    { id: "heiseijunior", isle: "pouch", name: "ゆめかわ ジュニア", kind: "wear", acc: true, kindText: wearText, color: "#F49AC1", caps: ["#FFC7DD", "#FFFFFF", "#D7C6EE"], items: [
      ["くまの トレーナー", "むねに くまの ワッペンの パステルの トレーナー。", "body", "heisei_beartrainer", ["#FFC2D9"]],
      ["ギンガムの ベレー", "ギンガム チェックの ベレーぼう。しろい リボン つき。", "head", "heisei_ginghambere", ["#F7A8C8", "#FFFFFF"]],
      ["レースの つけえり", "なみなみの レースの つけえり。ピンクの リボン つき。", "neck", "heisei_lacecollar", ["#FF8FB1"]],
      ["ピアノの ワンピース", "すそに けんばんの もようの ふりふりの レアの ワンピース。", "body", "heisei_pianodress", ["#D7C2F0", "#FFB8D2"]],
    ] },
    { id: "heiseijewel", isle: "mini", name: "おかしの ほうせき", kind: "wear", acc: true, color: "#E7B43C", caps: ["#FFE9A0", "#FFFFFF", "#FFC7DD"], items: [
      ["ハートの ペンダント", "おかしの おまけの ピンクの ハートの ペンダント。", "neck", "heisei_jewel_heart", ["#FF7BAA", "#F2C14E"]],
      ["ほしの ペンダント", "おかしの おまけの きいろい ほしの ペンダント。", "neck", "heisei_jewel_star", ["#FFD84D", "#E0A93A"]],
      ["おはなの ペンダント", "おかしの おまけの みずいろの おはなの ペンダント。", "neck", "heisei_jewel_flower", ["#7FC8F0", "#F2C14E"]],
      ["にじいろ ペンダント", "にじいろの いしが 6つに わかれた レアの ペンダント。", "neck", "heisei_jewel_rainbow", ["#FFFFFF", "#F2C14E"]],
    ] },
    { id: "heiseipuni", isle: "squish", name: "ぷにぷに しずく", kind: "furn", squish: true, color: "#F7B8D6", caps: ["#FFD6E6", "#FFFFFF", "#CFEFFB"], items: [
      ["ぷにっこ いちご", "しずくの かたちの ぷにぷに マスコット。いちごの ピン つき。"],
      ["ぷにっこ ソーダ", "あわが はいった ソーダいろの ぷにっこ。ストロー つき。"],
      ["ぷにっこ レモン", "ウインクの レモンいろの ぷにっこ。レモンの ピン つき。"],
      ["ぷにっこ ゆめいろ", "ラベンダーの からだに ラメが いっぱい。おうかんの レアの ぷにっこ。"],
    ] },
    { id: "heiseistage", isle: "meji", name: "キラキラ ステージ", kind: "wear", acc: true, kindText: wearText, color: "#C77BE0", caps: ["#E3C8F5", "#FFFFFF", "#FFC7DD"], items: [
      ["ほしの ヘッドセット", "うたって おどる ときの ほしの マイクの ヘッドセット。", "head", "heisei_headset", ["#B79BEA", "#FFE07A"]],
      ["ハートの マスカレード", "ハートの かたちの マスク。はねの かざり つき。", "face", "heisei_masque", ["#FF6FA6", "#C9B3F0"]],
      ["ラメの ファーストール", "ふわふわ ラメの ストール。ステージで ひらり。", "neck", "heisei_furstole", ["#FFB8D8"]],
      ["スターの ステージ ドレス", "ほしの アップリケと 2だんの チュールの レアの ドレス。", "body", "heisei_stagedress", ["#FF8FC0", "#C9B3F0"]],
    ] },
    { id: "heiseipoem", isle: "goods", name: "ポエムの ぶんぐ", kind: "furn", color: "#8FC9A8", caps: ["#C8E6D4", "#FFFFFF", "#FFD6E6"], items: [
      ["ポエムの メモちょう", "ことばと おはなの えの メモちょう。きょうの きもちを かこう。"],
      ["クローバーの レターセット", "クローバーの びんせんと ハートの シールの ふうとう。"],
      ["かぎつき ダイアリー", "ハートの かぎで しめる ふかふかの ダイアリー。"],
      ["ほしぞらの ノート", "よぞらに つきと ほしの ひょうしの レアの ノート。"],
    ] },
  ].map((S) => ({ ...S, forest: true, more: true, heisei: true }));
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  const index = Object.fromEntries(SERIES.map((S) => [S.id, S.index]));
  for (const S of SERIES.filter((x) => x.squish)) for (const it of S.list) GachaForest.squishable(it.id);

  // ---- 4F の しまに たす（js/mee-rotation.js が あとで よむ）: add の 2ばんめ → 2しゅうめ（10-05〜）に はじめて はいる ----
  for (const S of SERIES) { const I = GachaForest.ISLES.find((x) => x.id === S.isle); if (I) { I.add = I.add || []; if (!I.add.includes(S.id)) I.add.push(S.id); } }

  return {
    SERIES, first, index, FIG,
    // PokaDebug 用
    state() { return { series: SERIES.map((S) => ({ id: S.id, index: S.index, isle: S.isle, name: S.name, items: S.list.map((it) => ({ id: it.id, name: it.name, rare: it.rare, kind: it.kind })) })) }; },
  };
})();
