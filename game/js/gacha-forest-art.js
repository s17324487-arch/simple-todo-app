// ガチャガチャの もり（Meeときょれじゃ 4F・UI-52）の けいひんの 絵。しくみ・シリーズは js/gacha-forest.js。
// へやに かざる フィギュア（100×110。まちぼうけ・スクイーズ・ミニチュア・おもしろ グッズ・もりの なかま・きのこの おうち）と、
// もちもの（ポーチ・めじるし アクセサリーを つけた すいとう）・あたまの かぶりもの の 服の かたち（WEAR.gacha_*）。
// 3人は Chara.svg、どうぶつは Art.npcSvg（あたまだけ つかう ものも ある）、ほかは ここで 描く。線は INK・ふとさは GachaArt と おなじ。
// SVG の id は つかわない（グラデーションは なし）。キラキラの 演出は ない（UI-50）。
const GachaForestArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.4) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  const nest = (s, x, y, w, h, vb, par = "xMidYMax meet") => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="${par}" `);
  const hero = (who, o = {}) => Chara.svg(who, { pose: o.pose || "idle_01", face: o.face || "normal", dir: "down", outfit: o.outfit || {}, color: "soft" });
  const npc = (sp, o = {}) => Art.npcSvg({ sp, emo: o.emo || "happy", pose: o.pose || "idle_01", dir: "down", ...(o.col ? { col: o.col, col2: o.col2 } : {}) });
  const spCol = (sp, i = 0) => (NpcArt.SP[sp] && NpcArt.SP[sp].cols ? NpcArt.SP[sp].cols[i] : ["#FFFFFF", "#FFFFFF"]);
  const shadow = (rx = 34, cy = 103, cx = 50) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="5.5" fill="#4F465622"/>`;
  // とうめいな まるい だい（GachaArt と おなじ かたち）
  const disc = (col, rx = 38, cx = 50) => `<ellipse cx="${cx}" cy="101" rx="${rx}" ry="7.5" fill="#4F465622"/><path d="M${cx - rx},97 L${cx - rx},100 A${rx} 8 0 0 0 ${cx + rx} 100 L${cx + rx},97" fill="${col}" ${sk(2.2)}/><ellipse cx="${cx}" cy="97" rx="${rx}" ry="8" fill="#FFFFFF" fill-opacity="0.8" ${sk(2.2)}/>`;
  // かわいい かお（スクイーズ・めじるし）。s は おおきさ
  const face = (cx, cy, s = 1, o = {}) => {
    const ex = 8 * s, er = 2.4 * s;
    let f = o.sleep ? `<path d="M${f1(cx - ex - 3 * s)},${f1(cy)} q${f1(3 * s)} ${f1(2.6 * s)} ${f1(6 * s)} 0 M${f1(cx + ex - 3 * s)},${f1(cy)} q${f1(3 * s)} ${f1(2.6 * s)} ${f1(6 * s)} 0" fill="none" ${sk(1.8 * s)}/>`
      : `<circle cx="${f1(cx - ex)}" cy="${f1(cy)}" r="${f1(er)}" fill="${K}"/><circle cx="${f1(cx + ex)}" cy="${f1(cy)}" r="${f1(er)}" fill="${K}"/><circle cx="${f1(cx - ex + 0.8 * s)}" cy="${f1(cy - 0.9 * s)}" r="${f1(0.8 * s)}" fill="#FFFFFF"/><circle cx="${f1(cx + ex + 0.8 * s)}" cy="${f1(cy - 0.9 * s)}" r="${f1(0.8 * s)}" fill="#FFFFFF"/>`;
    f += `<ellipse cx="${f1(cx - ex - 4.5 * s)}" cy="${f1(cy + 4.2 * s)}" rx="${f1(3.2 * s)}" ry="${f1(1.9 * s)}" fill="#F7A0B4" opacity="0.75"/><ellipse cx="${f1(cx + ex + 4.5 * s)}" cy="${f1(cy + 4.2 * s)}" rx="${f1(3.2 * s)}" ry="${f1(1.9 * s)}" fill="#F7A0B4" opacity="0.75"/>`;
    f += o.open ? `<path d="M${f1(cx - 3 * s)},${f1(cy + 2.6 * s)} q${f1(3 * s)} ${f1(4.4 * s)} ${f1(6 * s)} 0 Z" fill="#E8546A" ${sk(1.4 * s)}/>` : `<path d="M${f1(cx - 3.4 * s)},${f1(cy + 2.6 * s)} q${f1(1.7 * s)} ${f1(2.2 * s)} ${f1(3.4 * s)} 0 q${f1(1.7 * s)} ${f1(2.2 * s)} ${f1(3.4 * s)} 0" fill="none" ${sk(1.5 * s)}/>`;
    return f;
  };
  const shine = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${w}" stroke-linecap="round" opacity="0.8"/>`;

  // ---- 1. まちぼうけ（ひざを かかえて すわる。ほんものの「まちぼうけ」シリーズの ポーズ）----
  // img: キャラの 絵・crop: あたまの はんい（viewBox）・col: からだの いろ・limb: うで あしの いろ
  const machi = ({ img, crop, col, limb = col, hx = 14, hy = 70, hw = 72, hh = 68, foot = shade(limb, -0.12), x0 = 0, extra = "" }) => {
    const ky = hy + 2, X = (v) => f1(v + x0);
    let s = "";
    // おしりと せなか（うしろ。かたは まるく あたまの うしろに かくす）
    s += `<path d="M${X(30)},${hy - 8} C${X(18)},${hy + 2} ${X(19)},${hy + 22} ${X(24)},${hy + 27} C${X(32)},${hy + 32} ${X(68)},${hy + 32} ${X(76)},${hy + 27} C${X(81)},${hy + 22} ${X(82)},${hy + 2} ${X(70)},${hy - 8} Z" fill="${col}" ${sk()}/>`;
    s += nest(img, hx + x0, hy - hh, hw, hh, crop);
    // すね（2ほん）: あたまの したの はしを かくす
    for (const d of [-1, 1]) {
      const kx = 50 + d * 9.5;
      s += `<path d="M${X(kx - 9.5)},${ky + 26} L${X(kx - 9.5)},${ky + 6} C${X(kx - 9.5)},${ky - 4} ${X(kx + 9.5)},${ky - 4} ${X(kx + 9.5)},${ky + 6} L${X(kx + 9.5)},${ky + 26} Z" fill="${limb}" ${sk()}/>`;
      s += `<path d="M${X(kx - 4.5)},${ky + 3} q4.5 -4 9 0" fill="none" stroke="${shade(limb, 0.18)}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    for (const d of [-1, 1]) s += `<ellipse cx="${X(50 + d * 10.5)}" cy="${ky + 27}" rx="10.5" ry="6.2" fill="${foot}" ${sk()}/>`;
    // うで（よこから すねを かかえて、てが まえで あう）
    const arm = (d) => `M${X(50 + d * 27)},${ky + 2} C${X(50 + d * 24)},${ky + 17} ${X(50 + d * 12)},${ky + 19} ${X(50 + d * 2)},${ky + 15}`;
    s += [-1, 1].map((d) => `<path d="${arm(d)}" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`).join("") + [-1, 1].map((d) => `<path d="${arm(d)}" fill="none" stroke="${limb}" stroke-width="5.6" stroke-linecap="round"/>`).join("");
    s += `<circle cx="${X(45.5)}" cy="${ky + 16}" r="4.8" fill="${limb}" ${sk(2)}/><circle cx="${X(54.5)}" cy="${ky + 16}" r="4.8" fill="${limb}" ${sk(2)}/>`;
    return s + extra;
  };
  const P = () => Chara.PROFILE;
  const trioMachi = (who, face, outfit, x0 = 0) => {
    const C = { wanko: ["6 -8 188 128", P().wanko.fill], gachan: ["36 14 128 128", P().gachan.fill], goji: ["6 -4 188 140", P().goji.fill] }[who];
    return machi({ img: hero(who, { face, outfit }), crop: C[0], col: C[1], x0 });
  };
  const zooMachi = (sp, face = "sad", limbIdx = 0, o = {}) => {
    const [c1] = spCol(sp, 0);
    return machi({ img: npc(sp, { emo: face }), crop: o.crop || "10 -12 180 138", col: o.col || c1, limb: o.limb || c1, extra: o.extra || "" });
  };
  // すわる ばしょ（まちぼうけの だい）: くさの マット・ベンチ
  const mat = (col = "#CDE7B0") => `<ellipse cx="50" cy="101" rx="40" ry="7" fill="#4F465622"/><ellipse cx="50" cy="99" rx="38" ry="7.5" fill="${col}" ${sk(2.2)}/>${[24, 34, 64, 74].map((x, i) => `<path d="M${x},${99 - (i % 2) * 2} l2 -5 l2 5" fill="none" stroke="${shade(col, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>`).join("")}`;
  const bench = (w = 168, cx = 90) => `<ellipse cx="${cx}" cy="103" rx="${w / 2}" ry="6" fill="#4F465622"/><rect x="${cx - w / 2 + 6}" y="86" width="${w - 12}" height="10" rx="4" fill="#C98E5C" ${sk(2.2)}/><path d="M${cx - w / 2 + 12},96 V102 M${cx + w / 2 - 12},96 V102" ${sk(4)}/><path d="M${cx - w / 2 + 12},90 H${cx + w / 2 - 12}" stroke="#E1B387" stroke-width="2"/>`;

  // ---- 2. スクイーズ（ふかふか・もちもち。へやで タップすると むにっと つぶれる〔js/gacha-forest.js〕）----
  const toast = () => `<path d="M24,94 L24,52 C14,50 14,30 30,28 C38,16 62,16 70,28 C86,30 86,50 76,52 L76,94 Z" fill="#E7B56E" ${sk()}/><path d="M30,90 L30,54 C22,52 22,36 34,34 C40,24 60,24 66,34 C78,36 78,52 70,54 L70,90 Z" fill="#FFF4DC"/>${face(50, 62, 1.15)}${shine("M33,40 q4 -6 10 -7")}`;
  const melon = () => `<path d="M14,80 C14,48 32,30 50,30 C68,30 86,48 86,80 C86,92 14,92 14,80 Z" fill="#F7D774" ${sk()}/><path d="M28,42 L62,88 M44,33 L80,74 M20,62 L38,88 M72,40 L38,88 M56,32 L22,74 M84,64 L66,88" stroke="#E2B550" stroke-width="2" stroke-linecap="round"/>${face(50, 66, 1.1)}<path d="M14,80 C14,92 86,92 86,80" fill="none" ${sk()}/>`;
  const croissant = () => `<path d="M10,78 C14,54 30,40 50,40 C70,40 86,54 90,78 C80,86 70,74 66,84 C60,90 40,90 34,84 C30,74 20,86 10,78 Z" fill="#E9A85A" ${sk()}/><path d="M32,46 C34,60 34,72 34,84 M50,40 C50,56 50,70 50,88 M68,46 C66,60 66,72 66,84" fill="none" stroke="#C47F35" stroke-width="2.2" stroke-linecap="round"/>${face(50, 66, 1)}${shine("M38,48 q6 -4 12 -4")}`;
  const bearbread = () => `<circle cx="28" cy="38" r="12" fill="#D9984F" ${sk()}/><circle cx="72" cy="38" r="12" fill="#D9984F" ${sk()}/><circle cx="28" cy="38" r="5.5" fill="#F2C28B"/><circle cx="72" cy="38" r="5.5" fill="#F2C28B"/><path d="M14,74 C14,48 30,36 50,36 C70,36 86,48 86,74 C86,94 14,94 14,74 Z" fill="#E3A65C" ${sk()}/><ellipse cx="50" cy="74" rx="14" ry="10" fill="#F6D8A8" ${sk(2)}/><ellipse cx="50" cy="70" rx="4.4" ry="3.2" fill="${K}"/><path d="M47,76 q3 3 6 0" fill="none" ${sk(1.6)}/>${face(50, 58, 1.05)}`;
  const mochiCat = () => `<path d="M16,52 L20,24 L40,42 Z M84,52 L80,24 L60,42 Z" fill="#FFFFFF" ${sk()}/><path d="M22,34 L23,44 L31,42 Z M78,34 L77,44 L69,42 Z" fill="#F7A0B4"/><path d="M12,82 C12,52 30,38 50,38 C70,38 88,52 88,82 C88,96 12,96 12,82 Z" fill="#FFFFFF" ${sk()}/>${face(50, 66, 1.2)}<path d="M28,66 H18 M28,70 L19,73 M72,66 H82 M72,70 L81,73" ${sk(1.4)}/>`;
  const mochiPig = () => `<path d="M24,44 L28,30 L38,40 M76,44 L72,30 L62,40" fill="#F8BBD0" ${sk()}/><path d="M12,80 C12,50 30,38 50,38 C70,38 88,50 88,80 C88,96 12,96 12,80 Z" fill="#FAD0DC" ${sk()}/><ellipse cx="50" cy="74" rx="11" ry="7.5" fill="#F7A9C0" ${sk(2)}/><ellipse cx="46" cy="74" rx="1.8" ry="2.6" fill="${K}"/><ellipse cx="54" cy="74" rx="1.8" ry="2.6" fill="${K}"/>${face(50, 60, 1.05)}`;
  const mochiSeal = () => `<path d="M10,84 C8,56 28,40 50,40 C72,40 92,56 90,84 C88,94 12,94 10,84 Z" fill="#E6EEF5" ${sk()}/><path d="M14,84 C6,82 4,74 8,70 M86,84 C94,82 96,74 92,70" fill="#E6EEF5" ${sk()}/>${face(50, 64, 1.2)}<ellipse cx="50" cy="73" rx="5" ry="3.5" fill="${K}"/><path d="M38,72 H28 M38,75 L29,78 M62,72 H72 M62,75 L71,78" ${sk(1.3)}/>`;
  const mochiPanda = () => `<circle cx="26" cy="40" r="11" fill="#3A3A3A" ${sk()}/><circle cx="74" cy="40" r="11" fill="#3A3A3A" ${sk()}/><path d="M12,80 C12,50 30,38 50,38 C70,38 88,50 88,80 C88,96 12,96 12,80 Z" fill="#FFFFFF" ${sk()}/><ellipse cx="38" cy="62" rx="7" ry="8.5" fill="#3A3A3A" transform="rotate(-20 38 62)"/><ellipse cx="62" cy="62" rx="7" ry="8.5" fill="#3A3A3A" transform="rotate(20 62 62)"/><circle cx="39" cy="61" r="2.2" fill="#FFFFFF"/><circle cx="61" cy="61" r="2.2" fill="#FFFFFF"/><ellipse cx="50" cy="71" rx="3.4" ry="2.4" fill="${K}"/><path d="M46,75 q4 3 8 0" fill="none" ${sk(1.5)}/><ellipse cx="26" cy="74" rx="4" ry="2.4" fill="#F7A0B4" opacity="0.7"/><ellipse cx="74" cy="74" rx="4" ry="2.4" fill="#F7A0B4" opacity="0.7"/>`;
  const marsh = () => `<path d="M18,86 L18,50 C18,38 82,38 82,50 L82,86 C82,98 18,98 18,86 Z" fill="#FFF6FA" ${sk()}/><ellipse cx="50" cy="50" rx="32" ry="10" fill="#FFFFFF" ${sk()}/><path d="M18,70 C30,76 70,76 82,70" fill="none" stroke="#F8C8DA" stroke-width="3"/>${face(50, 68, 1.1)}`;
  const donut = () => `<ellipse cx="50" cy="72" rx="38" ry="24" fill="#E8B06A" ${sk()}/><path d="M14,68 C16,50 30,44 50,44 C70,44 84,50 86,68 C80,74 72,66 66,72 C58,78 44,70 36,76 C28,80 20,72 14,68 Z" fill="#F59AC0" ${sk(2.2)}/><ellipse cx="50" cy="62" rx="10" ry="5.5" fill="#FFF6E8" ${sk(2)}/>${[[28, 56, 20], [72, 58, -30], [40, 50, 60], [62, 50, 10], [24, 64, -50], [76, 66, 40]].map(([x, y, r], i) => `<rect x="${x - 3}" y="${y - 1}" width="6" height="2.4" rx="1.2" fill="${["#FFFFFF", "#9ED3F0", "#FFE07A", "#9ED3A8"][i % 4]}" transform="rotate(${r} ${x} ${y})"/>`).join("")}${face(50, 82, 0.9)}`;
  const macaron = () => `<path d="M8,58 C8,30 92,30 92,58 Z" fill="#B9E3C9" ${sk()}/><rect x="11" y="56" width="78" height="13" rx="6" fill="#FFF6E8" ${sk(2)}/><path d="M8,70 C8,98 92,98 92,70 Z" fill="#B9E3C9" ${sk()}/><path d="M11,59 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0 q4.9 4 9.75 0" fill="none" stroke="#8CC9A6" stroke-width="1.8"/><path d="M11,69 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0 q4.9 -4 9.75 0" fill="none" stroke="#8CC9A6" stroke-width="1.8"/>${face(50, 82, 1.05)}${shine("M24,46 q10 -6 24 -6")}`;
  const pancake = () => `${[0, 1, 2].map((i) => `<ellipse cx="50" cy="${88 - i * 13}" rx="34" ry="9" fill="#E8B06A" ${sk()}/><path d="M16,${86 - i * 13} C24,${92 - i * 13} 76,${92 - i * 13} 84,${86 - i * 13}" fill="none" stroke="#F6D8A8" stroke-width="3"/>`).join("")}<path d="M28,58 C30,50 70,50 72,58 C70,62 62,60 56,66 C52,70 46,66 42,62 C36,62 30,62 28,58 Z" fill="#F6D86A" ${sk(2)}/><rect x="44" y="44" width="12" height="9" rx="2" fill="#FFF8D8" ${sk(2)}/>${face(50, 78, 0.9)}<ellipse cx="50" cy="94" rx="38" ry="6" fill="#FFFFFF" fill-opacity="0.8" ${sk(2)}/>`;

  // ---- 3. どうぶつの おしり（ちいさな クッションに すわる まるい おしり。しっぽが チャームポイント）----
  const bottom = (col, tail, o = {}) => {
    let s = `<ellipse cx="50" cy="100" rx="40" ry="7" fill="#4F465622"/><ellipse cx="50" cy="96" rx="40" ry="9" fill="${o.cush || "#CDE8F8"}" ${sk(2.2)}/>`;
    // あし（うしろあしの うら）
    s += `<ellipse cx="22" cy="92" rx="11" ry="6" fill="${o.foot || col}" ${sk()}/><ellipse cx="78" cy="92" rx="11" ry="6" fill="${o.foot || col}" ${sk()}/>`;
    if (o.pads) s += `<ellipse cx="22" cy="92" rx="5" ry="3" fill="#F7A0B4"/><ellipse cx="78" cy="92" rx="5" ry="3" fill="#F7A0B4"/>`;
    // おしり（2つの まるみ）
    s += `<path d="M14,86 C10,58 24,38 50,38 C76,38 90,58 86,86 C78,96 58,96 50,90 C42,96 22,96 14,86 Z" fill="${col}" ${sk()}/><path d="M50,62 C50,72 50,82 50,90" fill="none" ${sk(2.2)}/>`;
    if (o.patch) s += o.patch;
    s += shine("M24,54 q6 -8 16 -10");
    return s + tail;
  };
  const tailCat = `<path d="M76,58 C94,52 96,30 84,22" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M76,58 C94,52 96,30 84,22" fill="none" stroke="#F2B66A" stroke-width="6" stroke-linecap="round"/><path d="M89,34 l5 2 M88,44 l6 0" stroke="#D9873A" stroke-width="2.4" stroke-linecap="round"/>`;
  const tailDog = `<path d="M50,44 C46,28 54,16 64,18" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M50,44 C46,28 54,16 64,18" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>`;
  const tailPig = `<path d="M50,46 C42,40 44,30 52,32 C58,34 56,42 50,40" fill="none" stroke="${K}" stroke-width="6.5" stroke-linecap="round"/><path d="M50,46 C42,40 44,30 52,32 C58,34 56,42 50,40" fill="none" stroke="#F7A9C0" stroke-width="3" stroke-linecap="round"/>`;
  const tailPanda = `<circle cx="50" cy="44" r="7.5" fill="#3A3A3A" ${sk()}/>`;

  // ---- 4. ミニチュア かでん・しょくひん サンプル・まちの ミニチュア・がっき・ぶんぼうぐ ----
  const fridge = () => `${shadow(26)}<rect x="28" y="14" width="44" height="86" rx="10" fill="#BFE6D2" ${sk()}/><path d="M28,46 H72" ${sk(2.2)}/><rect x="62" y="24" width="4" height="14" rx="2" fill="#FFFFFF" ${sk(1.6)}/><rect x="62" y="54" width="4" height="22" rx="2" fill="#FFFFFF" ${sk(1.6)}/><circle cx="40" cy="30" r="4" fill="#FF8FA3" ${sk(1.4)}/><path d="M36,62 h10 v8 h-10 Z" fill="#FFFDF5" ${sk(1.4)}/><path d="M38,65 h6 M38,67.5 h4" stroke="#B9A98F" stroke-width="1.2"/>${shine("M33,20 V40", 2.4)}`;
  const washer = () => `${shadow(30)}<rect x="22" y="26" width="56" height="74" rx="8" fill="#F4F6FA" ${sk()}/><rect x="22" y="26" width="56" height="16" rx="8" fill="#DDE7F2" ${sk(2.2)}/><circle cx="34" cy="34" r="3" fill="#7FC6E4" ${sk(1.2)}/><circle cx="44" cy="34" r="3" fill="#FFE07A" ${sk(1.2)}/><rect x="56" y="31" width="16" height="6" rx="3" fill="#FFFFFF" ${sk(1.2)}/><circle cx="50" cy="70" r="20" fill="#CFEAF6" ${sk()}/><circle cx="50" cy="70" r="14" fill="#9FD3F0" ${sk(1.6)}/><path d="M38,72 C44,66 56,78 62,70" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/><circle cx="44" cy="76" r="2.4" fill="#FFFFFF"/>`;
  const microwave = () => `${shadow(36)}<rect x="12" y="44" width="76" height="54" rx="7" fill="#F2E3CF" ${sk()}/><rect x="18" y="50" width="48" height="42" rx="4" fill="#4E5A66" ${sk(2)}/><rect x="22" y="54" width="40" height="34" rx="3" fill="#FFE9A8" opacity="0.9"/><circle cx="42" cy="78" r="9" fill="#FFFFFF" ${sk(1.6)}/><path d="M35,76 h14" stroke="#E8B06A" stroke-width="3"/><rect x="70" y="52" width="13" height="8" rx="2" fill="#9ED3A8" ${sk(1.2)}/><circle cx="76.5" cy="70" r="4" fill="#FFFFFF" ${sk(1.4)}/><circle cx="76.5" cy="82" r="4" fill="#FFFFFF" ${sk(1.4)}/>`;
  const vending = () => `${shadow(30)}<rect x="22" y="8" width="56" height="92" rx="6" fill="#E8434F" ${sk()}/><rect x="28" y="14" width="44" height="40" rx="3" fill="#EAF6FB" ${sk(2)}/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${31 + c * 10}" y="${17 + r * 12}" width="6" height="9" rx="2" fill="${["#7FC6E4", "#FFE07A", "#9ED3A8", "#F7A9C8"][(r + c) % 4]}" ${sk(1)}/>`).join("")).join("")}${[0, 1, 2, 3].map((c) => `<circle cx="${34 + c * 10}" cy="60" r="2.2" fill="#FFE07A" ${sk(1)}/>`).join("")}<rect x="30" y="66" width="18" height="8" rx="2" fill="#2A2238"/><rect x="58" y="64" width="10" height="14" rx="2" fill="#FFFFFF" ${sk(1.4)}/><rect x="30" y="82" width="40" height="12" rx="3" fill="#2A2238" ${sk(1.6)}/>`;
  const ramen = () => `${shadow(38)}<path d="M12,58 L88,58 C86,82 70,96 50,96 C30,96 14,82 12,58 Z" fill="#F4F0E6" ${sk()}/><path d="M18,66 C30,70 70,70 82,66" fill="none" stroke="#E8434F" stroke-width="3"/><path d="M22,74 l4 -3 4 3 4 -3 4 3 4 -3 4 3 4 -3 4 3 4 -3 4 3 4 -3 4 3 4 -3" fill="none" stroke="#E8434F" stroke-width="2"/><ellipse cx="50" cy="58" rx="38" ry="9" fill="#E8B06A" ${sk(2.2)}/><path d="M22,58 C30,54 40,62 48,56 C56,52 66,62 76,56" fill="none" stroke="#F6D86A" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="55" r="7" fill="#FFFFFF" ${sk(1.6)}/><circle cx="36" cy="55" r="3.4" fill="#F6B53B"/><path d="M58,50 L70,48 L70,56 L58,58 Z" fill="#7A4B33" ${sk(1.6)}/><path d="M48,52 l6 -2 M52,60 l7 -1" stroke="#7CCB6B" stroke-width="2.4" stroke-linecap="round"/><path d="M70,26 L46,56 M78,30 L54,58" ${sk(3)}/>`;
  const omurice = () => `${shadow(40)}<ellipse cx="50" cy="88" rx="40" ry="10" fill="#FFFFFF" ${sk()}/><path d="M18,84 C16,62 34,52 50,52 C66,52 84,62 82,84 C70,90 30,90 18,84 Z" fill="#FFD84D" ${sk()}/><path d="M50,76 C42,70 38,64 44,60 C47,58 50,61 50,63 C50,61 53,58 56,60 C62,64 58,70 50,76 Z" fill="#E8434F" ${sk(1.6)}/><path d="M28,66 q6 -6 14 -8" fill="none" stroke="#FFF2B0" stroke-width="3" stroke-linecap="round"/><path d="M76,86 q4 -6 2 -12" fill="none" stroke="#7CCB6B" stroke-width="4" stroke-linecap="round"/>`;
  const sushi = () => `${shadow(40)}<path d="M8,90 L92,90 L88,98 L12,98 Z" fill="#C98E5C" ${sk()}/><path d="M16,98 V102 M84,98 V102" ${sk(3)}/>${[30, 68].map((x, i) => `<path d="M${x - 16},84 C${x - 16},72 ${x + 16},72 ${x + 16},84 C${x + 16},90 ${x - 16},90 ${x - 16},84 Z" fill="#FFFFFF" ${sk(2)}/><path d="M${x - 18},78 C${x - 18},64 ${x + 18},64 ${x + 18},76 C${x + 18},82 ${x - 18},84 ${x - 18},78 Z" fill="${i ? "#FFB27A" : "#F2626F"}" ${sk(2)}/>${i ? `<path d="M${x - 12},72 l6 6 M${x - 4},70 l6 7 M${x + 4},70 l6 6" stroke="#FFFFFF" stroke-width="1.8" opacity="0.8"/>` : `<path d="M${x - 6},68 C${x - 2},72 ${x + 4},72 ${x + 8},70" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity="0.7"/>`}`).join("")}`;
  const kidsLunch = () => `${shadow(42)}<path d="M8,80 C8,68 92,68 92,80 C92,96 8,96 8,80 Z" fill="#9FD3F0" ${sk()}/><ellipse cx="50" cy="78" rx="40" ry="10" fill="#FFFFFF" ${sk(2)}/><path d="M18,78 C18,64 38,60 44,72 C42,80 22,82 18,78 Z" fill="#FFD84D" ${sk(1.8)}/><path d="M30,64 V48 M30,48 L42,52 L30,56" fill="#E8434F" ${sk(1.6)}/><ellipse cx="62" cy="74" rx="12" ry="7" fill="#9B5A3A" ${sk(1.8)}/><path d="M74,66 C82,62 86,70 80,74 C78,78 72,76 74,66 Z" fill="#E8434F" ${sk(1.6)}/><path d="M50,82 q4 -6 10 -2" fill="none" stroke="#7CCB6B" stroke-width="4" stroke-linecap="round"/><path d="M78,82 l6 -4" stroke="#F6B53B" stroke-width="5" stroke-linecap="round"/>`;
  const post = () => `${shadow(24)}<rect x="44" y="70" width="12" height="30" fill="#5B5670" ${sk(2)}/><path d="M28,72 L28,30 C28,14 72,14 72,30 L72,72 Z" fill="#E8434F" ${sk()}/><rect x="36" y="34" width="28" height="5" rx="2.5" fill="#2A2238"/><rect x="38" y="48" width="24" height="14" rx="2" fill="#FFFFFF" ${sk(1.4)}/><path d="M44,52 h12 M50,52 v8 M45,56 h10" stroke="#E8434F" stroke-width="1.8"/>${shine("M33,26 q2 -6 8 -8")}`;
  const signal = () => `${shadow(22)}<rect x="47" y="40" width="6" height="60" fill="#8C8686" ${sk(2)}/><rect x="16" y="14" width="68" height="28" rx="12" fill="#5B6B5A" ${sk()}/>${[["#7CCB6B", 30], ["#FFD84D", 50], ["#E8434F", 70]].map(([c, x], i) => `<circle cx="${x}" cy="28" r="8" fill="${i === 0 ? c : shade(c, -0.35)}" ${sk(1.6)}/>`).join("")}<path d="M24,14 q26 -8 52 0" fill="none" ${sk(2)}/>`;
  const busstop = () => `${shadow(36)}<rect x="60" y="20" width="5" height="80" fill="#8C8686" ${sk(1.8)}/><circle cx="62.5" cy="22" r="14" fill="#FFFFFF" ${sk()}/><circle cx="62.5" cy="22" r="9" fill="none" stroke="#3E7FBF" stroke-width="3"/><path d="M57,22 h11" stroke="#3E7FBF" stroke-width="3"/><rect x="58" y="52" width="9" height="20" rx="2" fill="#FFFDF5" ${sk(1.4)}/><rect x="10" y="80" width="40" height="7" rx="3" fill="#C98E5C" ${sk(2)}/><path d="M14,87 v12 M46,87 v12" ${sk(3)}/><rect x="10" y="70" width="40" height="6" rx="3" fill="#E1B387" ${sk(2)}/>`;
  const crossing = () => `${shadow(40)}<rect x="47" y="34" width="6" height="66" fill="#FFFFFF" ${sk(2)}/>${[46, 54, 62, 70, 78, 86, 94].map((y) => `<rect x="47" y="${y}" width="6" height="4" fill="#2A2238"/>`).join("")}<path d="M26,20 L74,44 M74,20 L26,44" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M26,20 L74,44 M74,20 L26,44" stroke="#FFD84D" stroke-width="6" stroke-linecap="round"/><path d="M34,24 l4 2 M46,30 l4 2 M58,36 l4 2 M66,24 l-4 2 M54,30 l-4 2" stroke="#2A2238" stroke-width="3"/><circle cx="34" cy="56" r="8" fill="#E8434F" ${sk(1.8)}/><circle cx="66" cy="56" r="8" fill="#8E2F36" ${sk(1.8)}/><rect x="28" y="50" width="44" height="0" ${sk(1)}/><path d="M8,96 H92" stroke="#B9A98F" stroke-width="3"/>`;
  const piano = () => `${shadow(38)}<rect x="12" y="30" width="76" height="62" rx="5" fill="#4A3B5C" ${sk()}/><rect x="16" y="34" width="68" height="18" rx="3" fill="#6B5A80"/><rect x="10" y="58" width="80" height="14" rx="3" fill="#FFFFFF" ${sk(2)}/>${Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 8},58 v14" stroke="${K}" stroke-width="1.2"/>`).join("")}${[0, 1, 3, 4, 5, 7].map((i) => `<rect x="${20 + i * 8}" y="58" width="4.5" height="8" fill="${K}"/>`).join("")}<path d="M16,92 v8 M84,92 v8" ${sk(4)}/><rect x="36" y="36" width="28" height="15" rx="1.5" fill="#FFFDF5" ${sk(1.4)}/><path d="M40,41 H60 M40,46 H60" stroke="#C9C0B0" stroke-width="0.9"/><path d="M45,47 v-7 M53,45 v-7" ${sk(1.3)}/><ellipse cx="43.6" cy="47.2" rx="2" ry="1.5" fill="${K}"/><ellipse cx="51.6" cy="45.2" rx="2" ry="1.5" fill="${K}"/>`;
  const guitar = () => `${shadow(26)}<rect x="46" y="6" width="9" height="54" rx="2" fill="#7A4B33" ${sk(2)}/>${[16, 26, 36].map((y) => `<path d="M46,${y} h9" stroke="#E1B387" stroke-width="1.2"/>`).join("")}<path d="M44,4 h13 v8 h-13 Z" fill="#5B3A28" ${sk(1.8)}/><path d="M50,50 C32,48 26,62 32,70 C22,78 24,100 50,100 C76,100 78,78 68,70 C74,62 68,48 50,50 Z" fill="#F2A65E" ${sk()}/><circle cx="50" cy="70" r="8" fill="#5B3A28" ${sk(1.8)}/><rect x="42" y="84" width="16" height="5" rx="2" fill="#5B3A28"/><path d="M48,10 V86 M52,10 V86" stroke="#FFFFFF" stroke-width="0.8" opacity="0.8"/>`;
  const drum = () => `${shadow(36)}<path d="M16,48 L16,84 C16,98 84,98 84,84 L84,48 Z" fill="#E8434F" ${sk()}/>${[24, 38, 52, 66, 78].map((x, i) => `<path d="M${x},${i % 2 ? 52 : 54} L${x + 8},${i % 2 ? 90 : 92}" stroke="#FFE07A" stroke-width="2.4"/>`).join("")}<ellipse cx="50" cy="48" rx="34" ry="10" fill="#FFF8EC" ${sk()}/><path d="M18,84 C22,92 78,92 82,84" fill="none" stroke="#FFFFFF" stroke-width="3"/><path d="M68,20 L50,44 M82,28 L58,46" ${sk(3)}/><circle cx="68" cy="20" r="4" fill="#FFFFFF" ${sk(1.6)}/><circle cx="82" cy="28" r="4" fill="#FFFFFF" ${sk(1.6)}/>`;
  const harp = () => `${shadow(32)}<path d="M26,98 L26,26 C26,10 46,8 56,20 C66,32 76,40 86,38 L86,46 C66,50 52,70 40,98 Z" fill="#F2C84B" ${sk()}/><path d="M32,92 L32,30 C32,20 44,18 52,26 C60,36 70,44 80,44 C64,50 50,70 40,92 Z" fill="#FFF6D8"/>${[38, 44, 50, 56, 62, 68, 74].map((x, i) => `<path d="M${x},${30 + i * 2.4} L${x},${92 - i * 6}" stroke="#B9A98F" stroke-width="1.2"/>`).join("")}<circle cx="30" cy="24" r="3.4" fill="#FF8FA3" ${sk(1.2)}/><path d="M22,98 H44" ${sk(4)}/>`;
  const pencils = () => `${shadow(26)}<path d="M28,52 L72,52 L68,98 L32,98 Z" fill="#9FD3F0" ${sk()}/><path d="M30,64 H70" stroke="#FFFFFF" stroke-width="3"/>${[["#E8434F", 34, -10], ["#FFD84D", 44, -4], ["#7CCB6B", 54, 4], ["#B79BEA", 64, 10]].map(([c, x, r]) => `<g transform="rotate(${r} ${x} 54)"><rect x="${x - 3.5}" y="14" width="7" height="40" fill="${c}" ${sk(1.6)}/><path d="M${x - 3.5},14 L${x},4 L${x + 3.5},14 Z" fill="#F6D8A8" ${sk(1.4)}/><path d="M${x - 1.2},7.5 L${x},4 L${x + 1.2},7.5 Z" fill="${K}"/></g>`).join("")}`;
  const eraser = () => `${shadow(38)}<g transform="rotate(-8 34 78)"><rect x="12" y="64" width="44" height="26" rx="4" fill="#FFFFFF" ${sk()}/><rect x="28" y="62" width="22" height="30" fill="#7FC6E4" ${sk(2)}/></g><g transform="rotate(10 70 76)"><rect x="52" y="62" width="34" height="24" rx="10" fill="#F7A9C8" ${sk()}/>${face(69, 72, 0.7)}</g>`;
  const notebook = () => `${shadow(38)}<g transform="rotate(-6 50 70)"><rect x="18" y="38" width="64" height="56" rx="4" fill="#9ED3A8" ${sk()}/><rect x="18" y="38" width="10" height="56" fill="#6FB47E" ${sk(2)}/><rect x="36" y="48" width="38" height="14" rx="2" fill="#FFFFFF" ${sk(1.6)}/><path d="M40,53 h28 M40,57 h20" stroke="#B9A98F" stroke-width="1.4"/>${[44, 58, 72, 86].map((y) => `<circle cx="23" cy="${y}" r="2" fill="#FFFFFF" ${sk(1)}/>`).join("")}<path d="M60,72 C62,68 68,68 68,74 C68,80 60,84 60,84 C60,84 52,80 52,74 C52,68 58,68 60,72 Z" fill="#FF8FA3" ${sk(1.4)}/></g>`;
  const globe = () => `${shadow(26)}<path d="M36,100 L64,100 L58,92 L42,92 Z" fill="#C98E5C" ${sk(2)}/><rect x="47" y="80" width="6" height="12" fill="#E1B387" ${sk(1.6)}/><path d="M22,48 C22,76 50,86 70,72" fill="none" stroke="#F2C84B" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="46" r="27" fill="#7FC6E4" ${sk()}/><path d="M34,30 C42,26 46,34 40,40 C34,44 38,52 46,52 C52,52 50,60 44,64 M58,26 C66,30 72,40 66,46 C62,50 66,58 72,56" fill="#9ED3A8" ${sk(1.8)}/>${shine("M32,40 q2 -10 12 -14", 2.6)}`;

  // ---- 5. もりの なかま・きのこの おうち ----
  const acorn = (x, y, s = 1) => `<ellipse cx="${x}" cy="${y + 4 * s}" rx="${5 * s}" ry="${6 * s}" fill="#C98E5C" ${sk(1.6)}/><path d="M${x - 6 * s},${y + 1 * s} C${x - 6 * s},${y - 5 * s} ${x + 6 * s},${y - 5 * s} ${x + 6 * s},${y + 1 * s} Z" fill="#8A6A48" ${sk(1.6)}/><path d="M${x},${y - 3 * s} v${-3 * s}" ${sk(1.6)}/>`;
  const leaf = (x, y, r, c = "#7CCB6B") => `<path d="M${x},${y} C${x + 8},${y - 10} ${x + 20},${y - 8} ${x + 22},${y} C${x + 18},${y + 8} ${x + 8},${y + 8} ${x},${y} Z" fill="${c}" ${sk(1.6)} transform="rotate(${r} ${x} ${y})"/><path d="M${x + 2},${y} H${x + 18}" stroke="${shade(c, -0.25)}" stroke-width="1.2" transform="rotate(${r} ${x} ${y})"/>`;
  const stump = (col = "#C98E5C") => `<ellipse cx="50" cy="101" rx="34" ry="6" fill="#4F465622"/><path d="M22,82 L22,96 C22,104 78,104 78,96 L78,82 Z" fill="${col}" ${sk(2.2)}/><ellipse cx="50" cy="82" rx="28" ry="7" fill="#F2D3A8" ${sk(2.2)}/><ellipse cx="50" cy="82" rx="16" ry="4" fill="none" stroke="#D9A86A" stroke-width="1.6"/><ellipse cx="50" cy="82" rx="7" ry="1.8" fill="none" stroke="#D9A86A" stroke-width="1.4"/>`;
  const mushroomHouse = (cap, dots, o = {}) => `${shadow(38)}<path d="M28,98 L30,58 L70,58 L72,98 Z" fill="#FFF4DC" ${sk()}/><path d="M42,98 L42,78 C42,70 58,70 58,78 L58,98 Z" fill="#C98E5C" ${sk(2)}/><circle cx="54" cy="86" r="1.6" fill="${K}"/><circle cx="64" cy="70" r="5" fill="#BFE6F7" ${sk(1.6)}/><path d="M8,60 C8,26 30,10 50,10 C70,10 92,26 92,60 C80,66 20,66 8,60 Z" fill="${cap}" ${sk()}/>${dots.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#FFFFFF"/>`).join("")}${o.chimney ? `<rect x="66" y="6" width="8" height="14" fill="#9B6B4A" ${sk(1.6)}/>` : ""}<path d="M18,96 q4 -8 8 0 M76,96 q4 -8 8 0" fill="#7CCB6B" ${sk(1.4)}/>${shine("M20,42 q6 -16 22 -22", 2.6)}`;
  const mushroomCastle = () => `${shadow(42)}${[[22, 34, "#F7A9C8"], [78, 34, "#B79BEA"]].map(([x, y, c]) => `<rect x="${x - 8}" y="${y + 10}" width="16" height="${96 - y - 10}" fill="#FFF4DC" ${sk(2)}/><path d="M${x - 14},${y + 12} C${x - 14},${y - 4} ${x + 14},${y - 4} ${x + 14},${y + 12} Z" fill="${c}" ${sk(2)}/><circle cx="${x}" cy="${y + 4}" r="2.4" fill="#FFFFFF"/>`).join("")}<path d="M30,98 L32,50 L68,50 L70,98 Z" fill="#FFF8EC" ${sk()}/><path d="M42,98 L42,76 C42,66 58,66 58,76 L58,98 Z" fill="#B97F4B" ${sk(2)}/><path d="M14,52 C14,22 32,6 50,6 C68,6 86,22 86,52 C74,58 26,58 14,52 Z" fill="#E8434F" ${sk()}/>${[[32, 28, 6], [56, 18, 5], [70, 36, 4.5], [44, 42, 4]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#FFFFFF"/>`).join("")}<path d="M40,4 L44,-2 L48,4 L52,-2 L56,4 L60,-2 L60,6 L40,6 Z" fill="#F2C84B" ${sk(1.6)} transform="translate(0 2)"/><circle cx="36" cy="64" r="4" fill="#BFE6F7" ${sk(1.4)}/><circle cx="64" cy="64" r="4" fill="#BFE6F7" ${sk(1.4)}/>`;

  // ---- 6. もちもの（手）: ポーチ・めじるし アクセサリー の すいとう ----
  // ポーチ: ポシェットと おなじ ように かたから ななめに かける（うしろむきは はんたいがわ）。col: [いろ, ひもの いろ, かたち]
  const pouchShape = (shape, px, py, c, c2) => {
    const P2 = (v) => f2(v), st = (w) => stroke(w);
    const body = (w = 13, h = 11) => `<path d="M${P2(px - w)},${P2(py - h * 0.6)} C${P2(px - w)},${P2(py - h * 1.2)} ${P2(px + w)},${P2(py - h * 1.2)} ${P2(px + w)},${P2(py - h * 0.6)} L${P2(px + w * 0.9)},${P2(py + h * 0.55)} C${P2(px + w * 0.7)},${P2(py + h)} ${P2(px - w * 0.7)},${P2(py + h)} ${P2(px - w * 0.9)},${P2(py + h * 0.55)} Z" fill="${c}" ${st(2.8)}/>`;
    const eyes = (dy = 0, gap = 5) => `<circle cx="${P2(px - gap)}" cy="${P2(py + dy)}" r="1.7" fill="${K}"/><circle cx="${P2(px + gap)}" cy="${P2(py + dy)}" r="1.7" fill="${K}"/><ellipse cx="${P2(px - gap - 3.4)}" cy="${P2(py + dy + 3)}" rx="2.2" ry="1.3" fill="#F7A0B4" opacity="0.8"/><ellipse cx="${P2(px + gap + 3.4)}" cy="${P2(py + dy + 3)}" rx="2.2" ry="1.3" fill="#F7A0B4" opacity="0.8"/>`;
    const zip = `<path d="M${P2(px - 10)},${P2(py - 6)} C${P2(px - 4)},${P2(py - 8.4)} ${P2(px + 4)},${P2(py - 8.4)} ${P2(px + 10)},${P2(py - 6)}" fill="none" stroke="${shade(c, -0.3)}" stroke-width="1.6" stroke-dasharray="1.6 1.4"/><circle cx="${P2(px + 10)}" cy="${P2(py - 6)}" r="1.8" fill="#F2C84B" ${st(1)}/>`;
    // クジラ・シャチの しっぽ（ねもと x,y から みぎ うえへ。2まいの おびれ）
    const flukes = (x, y, col) => {
      const d = `M${P2(x - 3)},${P2(y + 4)} C${P2(x)},${P2(y + 2)} ${P2(x + 2)},${P2(y - 2)} ${P2(x + 3)},${P2(y - 6)}`;
      return `<path d="${d}" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="3.8" stroke-linecap="round"/>`
        + `<path d="M${P2(x + 3)},${P2(y - 5)} C${P2(x)},${P2(y - 7)} ${P2(x - 2)},${P2(y - 9)} ${P2(x - 2)},${P2(y - 12)} C${P2(x + 1)},${P2(y - 11)} ${P2(x + 3)},${P2(y - 9)} ${P2(x + 3.4)},${P2(y - 7.4)} C${P2(x + 4)},${P2(y - 10)} ${P2(x + 7)},${P2(y - 12)} ${P2(x + 10)},${P2(y - 11)} C${P2(x + 9)},${P2(y - 8)} ${P2(x + 6)},${P2(y - 5.6)} ${P2(x + 3)},${P2(y - 5)} Z" fill="${col}" ${st(2)}/>`;
    };
    switch (shape) {
      case "cat": return `<path d="M${P2(px - 12)},${P2(py - 6)} L${P2(px - 10)},${P2(py - 16)} L${P2(px - 3)},${P2(py - 9)} Z M${P2(px + 12)},${P2(py - 6)} L${P2(px + 10)},${P2(py - 16)} L${P2(px + 3)},${P2(py - 9)} Z" fill="${c}" ${st(2.4)}/>` + body() + eyes(1) + `<path d="M${P2(px - 1.4)},${P2(py + 3.6)} L${P2(px + 1.4)},${P2(py + 3.6)} L${P2(px)},${P2(py + 5)} Z" fill="#F7A0B4"/>` + zip;
      case "rabbit": return `<ellipse cx="${P2(px - 5)}" cy="${P2(py - 17)}" rx="3.6" ry="9" fill="${c}" ${st(2.4)}/><ellipse cx="${P2(px + 5)}" cy="${P2(py - 17)}" rx="3.6" ry="9" fill="${c}" ${st(2.4)}/><ellipse cx="${P2(px - 5)}" cy="${P2(py - 17)}" rx="1.4" ry="5.4" fill="#F7A9C8"/><ellipse cx="${P2(px + 5)}" cy="${P2(py - 17)}" rx="1.4" ry="5.4" fill="#F7A9C8"/>` + body() + eyes(1) + zip;
      case "bear": return `<circle cx="${P2(px - 10)}" cy="${P2(py - 9)}" r="4.4" fill="${c}" ${st(2.4)}/><circle cx="${P2(px + 10)}" cy="${P2(py - 9)}" r="4.4" fill="${c}" ${st(2.4)}/>` + body() + `<ellipse cx="${P2(px)}" cy="${P2(py + 4)}" rx="5" ry="3.6" fill="${shade(c, 0.4)}" ${st(1.4)}/><ellipse cx="${P2(px)}" cy="${P2(py + 3)}" rx="1.6" ry="1.1" fill="${K}"/>` + eyes(-1) + zip;
      case "unicorn": return `<path d="M${P2(px - 2.4)},${P2(py - 9)} L${P2(px)},${P2(py - 22)} L${P2(px + 2.4)},${P2(py - 9)} Z" fill="#F2C84B" ${st(2)}/><path d="M${P2(px - 12)},${P2(py - 6)} L${P2(px - 9)},${P2(py - 14)} L${P2(px - 4)},${P2(py - 9)} Z M${P2(px + 12)},${P2(py - 6)} L${P2(px + 9)},${P2(py - 14)} L${P2(px + 4)},${P2(py - 9)} Z" fill="${c}" ${st(2.2)}/>` + body() + `<path d="M${P2(px - 13)},${P2(py - 4)} C${P2(px - 16)},${P2(py + 2)} ${P2(px - 14)},${P2(py + 8)} ${P2(px - 10)},${P2(py + 9)}" fill="none" stroke="${c2}" stroke-width="3.4" stroke-linecap="round"/>` + eyes(1) + zip;
      case "melonpan": return `<path d="M${P2(px - 13)},${P2(py + 6)} C${P2(px - 14)},${P2(py - 10)} ${P2(px + 14)},${P2(py - 10)} ${P2(px + 13)},${P2(py + 6)} C${P2(px + 8)},${P2(py + 10)} ${P2(px - 8)},${P2(py + 10)} ${P2(px - 13)},${P2(py + 6)} Z" fill="${c}" ${st(2.8)}/><path d="M${P2(px - 8)},${P2(py - 5)} L${P2(px + 6)},${P2(py + 8)} M${P2(px)},${P2(py - 7)} L${P2(px + 11)},${P2(py + 3)} M${P2(px + 8)},${P2(py - 5)} L${P2(px - 6)},${P2(py + 8)} M${P2(px)},${P2(py - 7)} L${P2(px - 11)},${P2(py + 3)}" stroke="${shade(c, -0.2)}" stroke-width="1.4"/>` + eyes(2, 4);
      case "onigiri": return `<path d="M${P2(px)},${P2(py - 13)} C${P2(px + 4)},${P2(py - 13)} ${P2(px + 14)},${P2(py + 4)} ${P2(px + 12)},${P2(py + 8)} C${P2(px + 10)},${P2(py + 11)} ${P2(px - 10)},${P2(py + 11)} ${P2(px - 12)},${P2(py + 8)} C${P2(px - 14)},${P2(py + 4)} ${P2(px - 4)},${P2(py - 13)} ${P2(px)},${P2(py - 13)} Z" fill="#FFFFFF" ${st(2.8)}/><rect x="${P2(px - 6)}" y="${P2(py + 2)}" width="12" height="9" rx="1.5" fill="#2F3B35" ${st(1.4)}/>` + eyes(-2, 4);
      case "donut": return `<ellipse cx="${P2(px)}" cy="${P2(py)}" rx="13" ry="10" fill="#E8B06A" ${st(2.8)}/><path d="M${P2(px - 12)},${P2(py - 2)} C${P2(px - 10)},${P2(py - 9)} ${P2(px + 10)},${P2(py - 9)} ${P2(px + 12)},${P2(py - 2)} C${P2(px + 8)},${P2(py + 1)} ${P2(px + 4)},${P2(py - 1)} ${P2(px)},${P2(py + 2)} C${P2(px - 4)},${P2(py - 1)} ${P2(px - 8)},${P2(py + 2)} ${P2(px - 12)},${P2(py - 2)} Z" fill="${c}" ${st(2)}/><ellipse cx="${P2(px)}" cy="${P2(py - 2)}" rx="3.6" ry="2.2" fill="#FFF6E8" ${st(1.4)}/>` + [[-7, -5, "#FFFFFF"], [6, -6, "#9ED3F0"], [-2, -7, "#FFE07A"]].map(([dx, dy, cc]) => `<rect x="${P2(px + dx - 1.6)}" y="${P2(py + dy - 0.6)}" width="3.2" height="1.4" rx="0.7" fill="${cc}"/>`).join("") + eyes(4, 4);
      case "cake": return `<path d="M${P2(px - 13)},${P2(py + 9)} L${P2(px + 13)},${P2(py + 9)} L${P2(px + 13)},${P2(py - 3)} L${P2(px - 13)},${P2(py + 2)} Z" fill="#FFF4DC" ${st(2.6)}/><path d="M${P2(px - 13)},${P2(py + 2)} L${P2(px + 13)},${P2(py - 3)} L${P2(px + 6)},${P2(py - 9)} L${P2(px - 13)},${P2(py - 3)} Z" fill="#FFFFFF" ${st(2.4)}/><path d="M${P2(px - 13)},${P2(py + 5)} L${P2(px + 13)},${P2(py + 1)}" stroke="${c}" stroke-width="2.4"/><path d="M${P2(px + 1)},${P2(py - 9)} C${P2(px - 2)},${P2(py - 16)} ${P2(px + 6)},${P2(py - 18)} ${P2(px + 7)},${P2(py - 12)} C${P2(px + 8)},${P2(py - 9)} ${P2(px + 3)},${P2(py - 7)} ${P2(px + 1)},${P2(py - 9)} Z" fill="#E8434F" ${st(1.8)}/>` + eyes(3, 4);
      // うみの ポーチ（UI-62。js/gacha-forest-more.js）: さかな・クジラ・タコ・シャチ（あたまは ひだり・しっぽは みぎ）
      case "fish": return `<path d="M${P2(px + 9)},${P2(py)} L${P2(px + 17)},${P2(py - 8)} C${P2(px + 15)},${P2(py - 3)} ${P2(px + 15)},${P2(py + 3)} ${P2(px + 17)},${P2(py + 8)} Z" fill="${c2}" ${st(2.4)}/>`
        + `<path d="M${P2(px - 5)},${P2(py - 7.6)} C${P2(px - 2)},${P2(py - 14)} ${P2(px + 5)},${P2(py - 13)} ${P2(px + 6)},${P2(py - 7.4)} Z" fill="${c2}" ${st(2)}/>`
        + `<ellipse cx="${P2(px - 1)}" cy="${P2(py)}" rx="12.5" ry="9" fill="${c}" ${st(2.8)}/>`
        + `<path d="M${P2(px - 5)},${P2(py - 6.2)} C${P2(px - 7.6)},${P2(py - 2)} ${P2(px - 7.6)},${P2(py + 2)} ${P2(px - 5)},${P2(py + 6.2)}" fill="none" stroke="${shade(c, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>`
        + [[0, -2.6], [4.6, 0.4], [0, 3.4], [4.6, -5]].map(([dx, dy]) => `<path d="M${P2(px + dx - 2)},${P2(py + dy)} q2 2.2 4 0" fill="none" stroke="${shade(c, -0.25)}" stroke-width="1.2" stroke-linecap="round"/>`).join("")
        + `<circle cx="${P2(px - 8.6)}" cy="${P2(py - 1.6)}" r="2.3" fill="#FFFFFF" ${st(1)}/><circle cx="${P2(px - 9)}" cy="${P2(py - 1.4)}" r="1.2" fill="${K}"/><ellipse cx="${P2(px - 7.6)}" cy="${P2(py + 3.4)}" rx="2" ry="1.2" fill="#F7A0B4" opacity="0.8"/>`;
      case "whale": return flukes(px + 10, py - 3, c)
        + `<path d="M${P2(px - 14)},${P2(py + 2)} C${P2(px - 14)},${P2(py - 9)} ${P2(px - 2)},${P2(py - 12)} ${P2(px + 7)},${P2(py - 6)} C${P2(px + 11)},${P2(py - 3)} ${P2(px + 12)},${P2(py + 3)} ${P2(px + 9)},${P2(py + 7)} C${P2(px + 5)},${P2(py + 10)} ${P2(px - 10)},${P2(py + 10)} ${P2(px - 14)},${P2(py + 2)} Z" fill="${c}" ${st(2.8)}/>`
        + `<path d="M${P2(px - 13)},${P2(py + 4)} C${P2(px - 8)},${P2(py + 8.4)} ${P2(px + 2)},${P2(py + 8.4)} ${P2(px + 9)},${P2(py + 5.4)} C${P2(px + 4)},${P2(py + 9.4)} ${P2(px - 9)},${P2(py + 9.4)} ${P2(px - 13)},${P2(py + 4)} Z" fill="#FFFFFF" opacity="0.9"/>`
        + [-7, -3, 1].map((dx) => `<path d="M${P2(px + dx)},${P2(py + 6)} h3" stroke="${shade(c, -0.2)}" stroke-width="1" stroke-linecap="round"/>`).join("")
        + `<path d="M${P2(px - 5)},${P2(py - 10.4)} C${P2(px - 6)},${P2(py - 15)} ${P2(px - 9)},${P2(py - 16)} ${P2(px - 11)},${P2(py - 15)} M${P2(px - 5)},${P2(py - 10.4)} C${P2(px - 4)},${P2(py - 15)} ${P2(px - 1)},${P2(py - 16)} ${P2(px + 1)},${P2(py - 15)}" fill="none" stroke="#7FC6E8" stroke-width="2.2" stroke-linecap="round"/><circle cx="${P2(px - 11.6)}" cy="${P2(py - 12.6)}" r="1.1" fill="#7FC6E8"/><circle cx="${P2(px + 1.8)}" cy="${P2(py - 12.6)}" r="1.1" fill="#7FC6E8"/>`
        + `<circle cx="${P2(px - 8)}" cy="${P2(py - 1)}" r="1.6" fill="${K}"/><ellipse cx="${P2(px - 9.6)}" cy="${P2(py + 2.8)}" rx="2" ry="1.2" fill="#F7A0B4" opacity="0.8"/>`;
      case "octopus": return [-2, -1, 0, 1, 2].map((i) => { const x0 = px + i * 4.8, d = `M${P2(x0)},${P2(py + 2)} C${P2(x0 - 1.6)},${P2(py + 8)} ${P2(x0 + 2.4)},${P2(py + 11)} ${P2(x0 + 3.4)},${P2(py + 8.4)}`; return `<path d="${d}" fill="none" stroke="${K}" stroke-width="5.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; }).join("")
        + `<path d="M${P2(px - 12)},${P2(py + 3)} C${P2(px - 13)},${P2(py - 13)} ${P2(px + 13)},${P2(py - 13)} ${P2(px + 12)},${P2(py + 3)} C${P2(px + 8)},${P2(py + 6)} ${P2(px - 8)},${P2(py + 6)} ${P2(px - 12)},${P2(py + 3)} Z" fill="${c}" ${st(2.8)}/>`
        + [[-6, -6, 1.7], [5, -8, 1.3], [8, -2.4, 1.1]].map(([dx, dy, r]) => `<circle cx="${P2(px + dx)}" cy="${P2(py + dy)}" r="${r}" fill="${shade(c, 0.4)}"/>`).join("")
        + eyes(-1.4, 4.6) + `<ellipse cx="${P2(px)}" cy="${P2(py + 2.4)}" rx="1.9" ry="1.5" fill="${c2}" ${st(1)}/>`;
      case "orca": return flukes(px + 10, py - 3, c)
        + `<path d="M${P2(px - 1)},${P2(py - 8)} C${P2(px)},${P2(py - 13)} ${P2(px + 1)},${P2(py - 16)} ${P2(px)},${P2(py - 19)} C${P2(px + 4)},${P2(py - 16)} ${P2(px + 6)},${P2(py - 11)} ${P2(px + 6)},${P2(py - 7)} Z" fill="${c}" ${st(2.2)}/>`
        + `<path d="M${P2(px - 14)},${P2(py + 1)} C${P2(px - 13)},${P2(py - 8)} ${P2(px - 2)},${P2(py - 10)} ${P2(px + 8)},${P2(py - 5)} C${P2(px + 12)},${P2(py - 2)} ${P2(px + 13)},${P2(py + 3)} ${P2(px + 10)},${P2(py + 6)} C${P2(px + 4)},${P2(py + 10)} ${P2(px - 10)},${P2(py + 9)} ${P2(px - 14)},${P2(py + 1)} Z" fill="${c}" ${st(2.8)}/>`
        + `<path d="M${P2(px - 13)},${P2(py + 3)} C${P2(px - 8)},${P2(py + 7.6)} ${P2(px + 2)},${P2(py + 7.6)} ${P2(px + 9.4)},${P2(py + 4.6)} C${P2(px + 3)},${P2(py + 9)} ${P2(px - 9)},${P2(py + 8.6)} ${P2(px - 13)},${P2(py + 3)} Z" fill="#FFFFFF"/>`
        + `<path d="M${P2(px + 1)},${P2(py - 6.6)} C${P2(px + 4)},${P2(py - 7.4)} ${P2(px + 7)},${P2(py - 5.6)} ${P2(px + 8)},${P2(py - 4.2)} C${P2(px + 5)},${P2(py - 3.6)} ${P2(px + 3)},${P2(py - 4.4)} ${P2(px + 1)},${P2(py - 6.6)} Z" fill="#9A9AA6"/>`
        + `<ellipse cx="${P2(px - 6.4)}" cy="${P2(py - 2.6)}" rx="3.4" ry="1.9" transform="rotate(-12 ${P2(px - 6.4)} ${P2(py - 2.6)})" fill="#FFFFFF"/><circle cx="${P2(px - 7.4)}" cy="${P2(py - 2.4)}" r="1.1" fill="${K}"/><ellipse cx="${P2(px - 10)}" cy="${P2(py + 2.2)}" rx="1.8" ry="1.1" fill="#F7A0B4" opacity="0.85"/>`;
      default: return body() + zip;
    }
  };
  const pouch = (ctx) => {
    const N = ctx.a.neck, T = ctx.a.torso, sgn = ctx.view === "back" ? -1 : 1, c = ctx.col[0] || "#FFFFFF", c2 = ctx.col[1] || shade(c, -0.25), shape = ctx.col[2] || "cat";
    const sx = N.x - sgn * N.w * 0.32, sy = N.y + 1, px = T.cx + sgn * T.w * 0.48, py = U.clamp(T.bottom - 22, T.top + 28, 200);
    const strap = `<path d="M${f2(sx)},${f2(sy)} C${f2(N.x)},${f2(sy + (py - sy) * 0.3)} ${f2(px - sgn * 10)},${f2(py - 18)} ${f2(px - sgn * 4)},${f2(py - 10)}" fill="none" stroke="${c2}" stroke-width="3.4" stroke-linecap="round"/>`;
    return { top: strap + pouchShape(shape, px, py, c, c2) };
  };
  // めじるし アクセサリー: 手に さげた すいとうの ひもに シリコンの わっかで つけた マスコット（ほんものと おなじく もちものの めじるし）
  // col: [すいとうの いろ, マスコット]
  const charm = (kind, x, y, s = 1) => {
    const C = (cx, cy, r, f, w = 1.8) => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${f}" ${stroke(w)}/>`, eye2 = (cx, cy, g = 2.6) => `<circle cx="${f2(cx - g)}" cy="${f2(cy)}" r="1.1" fill="${K}"/><circle cx="${f2(cx + g)}" cy="${f2(cy)}" r="1.1" fill="${K}"/>`;
    const r = 6.4 * s;
    switch (kind) {
      case "wanko": return `<ellipse cx="${f2(x - r)}" cy="${f2(y)}" rx="${f2(r * 0.45)}" ry="${f2(r * 0.7)}" fill="${K}"/><ellipse cx="${f2(x + r)}" cy="${f2(y)}" rx="${f2(r * 0.45)}" ry="${f2(r * 0.7)}" fill="${K}"/>` + C(x, y, r, "#FFFFFF") + eye2(x, y - 0.4) + `<ellipse cx="${f2(x)}" cy="${f2(y + 2.2)}" rx="1.3" ry="0.9" fill="${K}"/>`;
      case "gachan": return C(x, y, r, "#FADA78") + eye2(x, y - 1) + `<path d="M${f2(x - 2.2)},${f2(y + 1.6)} L${f2(x + 2.2)},${f2(y + 1.6)} L${f2(x)},${f2(y + 3.8)} Z" fill="#F29B38" ${stroke(0.9)}/>`;
      case "goji": return C(x, y, r, "#8C8686") + `<path d="M${f2(x - 3.6)},${f2(y + 0.6)} H${f2(x + 3.6)} L${f2(x + 2.4)},${f2(y + 3.4)} H${f2(x - 2.4)} Z" fill="#E8434F" ${stroke(0.9)}/><path d="M${f2(x - 3)},${f2(y + 0.8)} l1 1.4 l1 -1.4 l1 1.4 l1 -1.4 l1 1.4" fill="none" stroke="#FFFFFF" stroke-width="0.8"/>` + eye2(x, y - 2.4, 3);
      case "squirrel": return `<path d="M${f2(x - 5)},${f2(y - 4)} L${f2(x - 4)},${f2(y - 10)} L${f2(x - 1)},${f2(y - 5)} Z M${f2(x + 5)},${f2(y - 4)} L${f2(x + 4)},${f2(y - 10)} L${f2(x + 1)},${f2(y - 5)} Z" fill="#D98E4A" ${stroke(1.4)}/>` + C(x, y, r, "#D98E4A") + `<ellipse cx="${f2(x)}" cy="${f2(y + 2)}" rx="3.6" ry="2.6" fill="#FCE3C4"/>` + eye2(x, y - 1);
      case "owl": return C(x, y, r, "#B98B63") + `<circle cx="${f2(x - 2.6)}" cy="${f2(y - 0.6)}" r="2.4" fill="#FFFFFF" ${stroke(0.9)}/><circle cx="${f2(x + 2.6)}" cy="${f2(y - 0.6)}" r="2.4" fill="#FFFFFF" ${stroke(0.9)}/>` + eye2(x, y - 0.6) + `<path d="M${f2(x - 1)},${f2(y + 2)} L${f2(x + 1)},${f2(y + 2)} L${f2(x)},${f2(y + 3.6)} Z" fill="#F2B544"/>`;
      case "mushroom": return `<rect x="${f2(x - 3)}" y="${f2(y)}" width="6" height="6" rx="2" fill="#FFF4DC" ${stroke(1.4)}/><path d="M${f2(x - r - 1)},${f2(y + 1)} C${f2(x - r)},${f2(y - r - 2)} ${f2(x + r)},${f2(y - r - 2)} ${f2(x + r + 1)},${f2(y + 1)} Z" fill="#E8434F" ${stroke(1.6)}/><circle cx="${f2(x - 3)}" cy="${f2(y - 3)}" r="1.4" fill="#FFFFFF"/><circle cx="${f2(x + 2.6)}" cy="${f2(y - 4.4)}" r="1.1" fill="#FFFFFF"/>`;
      case "deer": return `<path d="M${f2(x - 3)},${f2(y - 5)} L${f2(x - 6)},${f2(y - 12)} M${f2(x - 5)},${f2(y - 9)} L${f2(x - 8)},${f2(y - 9)} M${f2(x + 3)},${f2(y - 5)} L${f2(x + 6)},${f2(y - 12)} M${f2(x + 5)},${f2(y - 9)} L${f2(x + 8)},${f2(y - 9)}" fill="none" stroke="#8A6A48" stroke-width="2" stroke-linecap="round"/>` + C(x, y, r, "#E1B387") + `<circle cx="${f2(x - 3.4)}" cy="${f2(y + 2.4)}" r="0.9" fill="#FFFFFF"/><circle cx="${f2(x + 3.6)}" cy="${f2(y + 1.6)}" r="0.9" fill="#FFFFFF"/>` + eye2(x, y - 1) + `<ellipse cx="${f2(x)}" cy="${f2(y + 2.6)}" rx="1.4" ry="1" fill="${K}"/>`;
      case "trio": return charm("goji", x + 5.2, y + 2, 0.62) + charm("gachan", x - 5.2, y + 2, 0.62) + charm("wanko", x, y - 4, 0.62);
      // おやさい めじるし（UI-62。js/gacha-forest-more.js）: にんじん・トマト・なす・かぼちゃ（レア）
      case "carrot": {
        const leaves = `M${f2(x)},${f2(y - 5)} L${f2(x - 3.4)},${f2(y - 11)} M${f2(x)},${f2(y - 5)} L${f2(x)},${f2(y - 12)} M${f2(x)},${f2(y - 5)} L${f2(x + 3.4)},${f2(y - 11)}`;
        return `<path d="${leaves}" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="${leaves}" fill="none" stroke="#6DBE5A" stroke-width="2.2" stroke-linecap="round"/>`
          + `<path d="M${f2(x - 6)},${f2(y - 4)} C${f2(x - 6.6)},${f2(y + 2)} ${f2(x - 2)},${f2(y + 9)} ${f2(x)},${f2(y + 11)} C${f2(x + 2)},${f2(y + 9)} ${f2(x + 6.6)},${f2(y + 2)} ${f2(x + 6)},${f2(y - 4)} C${f2(x + 3)},${f2(y - 6.6)} ${f2(x - 3)},${f2(y - 6.6)} ${f2(x - 6)},${f2(y - 4)} Z" fill="#F59A3C" ${stroke(1.6)}/>`
          + `<path d="M${f2(x - 4.8)},${f2(y + 3)} h2.4 M${f2(x + 2.2)},${f2(y + 6)} h2" stroke="#D9772A" stroke-width="1.1" stroke-linecap="round"/>` + eye2(x, y - 1.6, 2.2) + `<path d="M${f2(x - 1.2)},${f2(y + 0.8)} q1.2 1.3 2.4 0" fill="none" stroke="${K}" stroke-width="0.9" stroke-linecap="round"/>`;
      }
      case "tomato": return C(x, y + 1, r, "#EF4B4B")
        + [0, 72, 144, 216, 288].map((a) => { const t = (a * Math.PI) / 180, lx = x + Math.sin(t) * 2.4, ly = y - 5 - Math.cos(t) * 1.5; return `<ellipse cx="${f2(lx)}" cy="${f2(ly)}" rx="1.3" ry="2.5" transform="rotate(${a} ${f2(lx)} ${f2(ly)})" fill="#5FAE4E" ${stroke(0.8)}/>`; }).join("")
        + `<path d="M${f2(x)},${f2(y - 5.6)} v-3" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/><path d="M${f2(x - 4.4)},${f2(y - 1.4)} q1 -2 3 -2.6" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>` + eye2(x, y + 1.4) + `<path d="M${f2(x - 1.2)},${f2(y + 3.4)} q1.2 1.3 2.4 0" fill="none" stroke="${K}" stroke-width="0.9" stroke-linecap="round"/>`;
      case "eggplant": return `<path d="M${f2(x - 3.6)},${f2(y - 3)} C${f2(x - 8.4)},${f2(y + 3)} ${f2(x - 5)},${f2(y + 11)} ${f2(x + 1)},${f2(y + 10.4)} C${f2(x + 7.4)},${f2(y + 9.6)} ${f2(x + 7.6)},${f2(y + 2)} ${f2(x + 3.8)},${f2(y - 3)} C${f2(x + 2)},${f2(y - 5.2)} ${f2(x - 2)},${f2(y - 5.2)} ${f2(x - 3.6)},${f2(y - 3)} Z" fill="#9A66C4" ${stroke(1.6)}/>`
        + `<path d="M${f2(x - 4.8)},${f2(y - 3.2)} C${f2(x - 3)},${f2(y - 7)} ${f2(x + 3)},${f2(y - 7)} ${f2(x + 4.8)},${f2(y - 3.2)} L${f2(x + 2.4)},${f2(y - 1.4)} L${f2(x + 0.6)},${f2(y - 3.4)} L${f2(x - 1.2)},${f2(y - 1.2)} L${f2(x - 2.8)},${f2(y - 3)} Z" fill="#5FAE4E" ${stroke(1.1)}/><path d="M${f2(x)},${f2(y - 6.2)} q0.6 -2.6 2 -3.4" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>`
        + `<path d="M${f2(x - 4.4)},${f2(y + 1.6)} q0.4 3 2.4 5" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>` + eye2(x + 0.6, y + 2.6, 2.3) + `<path d="M${f2(x - 0.6)},${f2(y + 4.6)} q1.2 1.3 2.4 0" fill="none" stroke="${K}" stroke-width="0.9" stroke-linecap="round"/>`;
      case "pumpkin": return `<path d="M${f2(x)},${f2(y - 4)} q0.4 -3 2.4 -4.2" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/><path d="M${f2(x)},${f2(y - 4)} q0.4 -3 2.4 -4.2" fill="none" stroke="#8A6A48" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="${f2(x + 4.6)}" cy="${f2(y - 7)}" rx="2.8" ry="1.5" transform="rotate(-22 ${f2(x + 4.6)} ${f2(y - 7)})" fill="#6DBE5A" ${stroke(0.9)}/>`
        + [-1, 1].map((d) => `<ellipse cx="${f2(x + d * 3.8)}" cy="${f2(y + 1.6)}" rx="4.4" ry="5.4" fill="#F59A3C" ${stroke(1.4)}/>`).join("") + `<ellipse cx="${f2(x)}" cy="${f2(y + 1.6)}" rx="4.2" ry="5.8" fill="#F7A84E" ${stroke(1.4)}/>`
        + eye2(x, y + 0.6, 2) + `<path d="M${f2(x - 1.4)},${f2(y + 3)} q1.4 1.5 2.8 0" fill="none" stroke="${K}" stroke-width="0.9" stroke-linecap="round"/>`;
      default: return C(x, y, r, "#FFFFFF");
    }
  };
  const mejirushi = (ctx) => {
    const h = HandItems.hand(ctx), c = ctx.col[0] || "#9FD3F0", kind = ctx.col[1] || "wanko", x = U.clamp(h.x + h.side * 2, 16, 186), y0 = h.y + 6;
    const strap = `<path d="M${f2(x - 4)},${f2(y0 + 4)} C${f2(x - 6)},${f2(h.y - 6)} ${f2(x + 6)},${f2(h.y - 6)} ${f2(x + 4)},${f2(y0 + 4)}" fill="none" stroke="${shade(c, -0.3)}" stroke-width="3" stroke-linecap="round"/>`;
    const bottle = `<rect x="${f2(x - 9)}" y="${f2(y0 + 4)}" width="18" height="30" rx="7" fill="${c}" ${stroke(2.8)}/><rect x="${f2(x - 6)}" y="${f2(y0)}" width="12" height="7" rx="2.5" fill="#FFFFFF" ${stroke(2.2)}/><path d="M${f2(x - 9)},${f2(y0 + 14)} H${f2(x + 9)}" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/><path d="M${f2(x - 5)},${f2(y0 + 18)} V${f2(y0 + 30)}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`;
    // シリコンの わっか（すいとうの くびに まく）と マスコット
    const ring = `<path d="M${f2(x + 6)},${f2(y0 + 6)} C${f2(x + 12)},${f2(y0 + 6)} ${f2(x + 14)},${f2(y0 + 12)} ${f2(x + 13)},${f2(y0 + 15)}" fill="none" stroke="#F7A9C8" stroke-width="2.6" stroke-linecap="round"/>`;
    return { top: strap + bottle + ring + charm(kind, x + 14, y0 + 22, 1) };
  };
  WEAR.gacha_pouch = (ctx) => pouch(ctx);
  WEAR.gacha_mejirushi = (ctx) => mejirushi(ctx);

  // ---- 7. かぶりもの（あたま。ぼうしの しゅるい）----
  WEAR.gacha_ebifry = (ctx) => ({
    top: hatWrap(ctx, (s) => `<g transform="rotate(-8)"><path d="M-46,-8 C-50,-30 -10,-40 24,-30 C40,-26 46,-14 40,-4 C20,4 -26,6 -46,-8 Z" fill="#E7A94E" ${stroke(s)}/>`
      + Array.from({ length: 10 }, (_, i) => `<circle cx="${-38 + i * 8}" cy="${-20 + (i % 3) * 5}" r="2.6" fill="#C98A34"/>`).join("")
      + `<path d="M38,-14 L58,-34 L54,-14 L64,-6 L42,-4 Z" fill="#E8434F" ${stroke(s * 0.8)}/><path d="M48,-22 L54,-14" stroke="#B7303A" stroke-width="${f2(s * 0.5)}"/></g>`),
  });
  WEAR.gacha_sushihat = (ctx) => ({
    top: hatWrap(ctx, (s) => `<path d="M-40,0 C-44,-18 -30,-30 0,-30 C30,-30 44,-18 40,0 C24,6 -24,6 -40,0 Z" fill="#FFFFFF" ${stroke(s)}/>`
      + `<path d="M-48,-12 C-50,-40 -20,-52 8,-50 C34,-48 52,-36 50,-14 C40,-6 30,-20 18,-12 C4,-4 -10,-16 -24,-8 C-34,-4 -42,-6 -48,-12 Z" fill="#FFA36B" ${stroke(s)}/>`
      + `<path d="M-30,-40 L-18,-20 M-10,-46 L2,-24 M12,-46 L22,-26 M30,-40 L36,-24" stroke="#FFFFFF" stroke-width="${f2(s * 0.9)}" stroke-linecap="round" opacity="0.85"/>`),
  });
  WEAR.gacha_kinokohat = (ctx) => ({
    top: hatWrap(ctx, (s) => `<path d="M-60,8 C-62,-46 -30,-72 0,-72 C30,-72 62,-46 60,8 C40,14 -40,14 -60,8 Z" fill="#E8434F" ${stroke(s)}/>`
      + [[-30, -40, 11], [6, -56, 9], [32, -30, 10], [-6, -20, 7], [-46, -10, 6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f2(r * 0.8)}" fill="#FFFFFF"/>`).join("")
      + `<path d="M-50,6 C-30,12 30,12 50,6" fill="none" stroke="#FFF4DC" stroke-width="${f2(s * 1.4)}" stroke-linecap="round"/>`),
  });
  WEAR.gacha_cakehat = (ctx) => ({
    top: hatWrap(ctx, (s) => `<path d="M-38,4 L38,4 L38,-22 L-38,-22 Z" fill="#FFF4DC" ${stroke(s)}/><path d="M-38,-10 L38,-10" stroke="#F59AC0" stroke-width="${f2(s * 1.6)}"/>`
      + `<path d="M-42,-22 C-42,-34 42,-34 42,-22 C34,-16 26,-26 18,-18 C10,-12 2,-24 -6,-18 C-14,-12 -22,-24 -30,-18 C-36,-14 -42,-16 -42,-22 Z" fill="#FFFFFF" ${stroke(s)}/>`
      + [-22, 0, 22].map((x) => `<path d="M${x},-34 C${x - 8},-34 ${x - 8},-46 ${x},-48 C${x + 8},-46 ${x + 8},-34 ${x},-34 Z" fill="#E8434F" ${stroke(s * 0.8)}/><path d="M${x - 3},-46 L${x},-50 L${x + 3},-46" fill="#7CCB6B" ${stroke(s * 0.5)}/>`).join("")
      + `<rect x="-3" y="-66" width="6" height="16" fill="#9FD3F0" ${stroke(s * 0.7)}/><path d="M0,-66 C-5,-72 -2,-78 0,-80 C2,-78 5,-72 0,-66 Z" fill="#FFD84D" ${stroke(s * 0.5)}/>`),
  });

  // ---- フィギュア（id → 100×110。3にんの まちぼうけ は 180×110）----
  const FIG = {
    gacha_machi3_0: () => svg(100, 110, mat() + trioMachi("wanko", "sad")),
    gacha_machi3_1: () => svg(100, 110, mat("#FCE3B0") + trioMachi("gachan", "normal")),
    gacha_machi3_2: () => svg(100, 110, mat("#D6E6F5") + trioMachi("goji", "sad")),
    gacha_machi3_3: () => svg(180, 110, bench() + trioMachi("wanko", "normal", { neck: "scarf_red" }, -4) + trioMachi("goji", "normal", {}, 80) + trioMachi("gachan", "sad", {}, 38)),
    gacha_machizoo_0: () => svg(100, 110, mat("#FCE3B0") + zooMachi("cat", "sad")),
    gacha_machizoo_1: () => svg(100, 110, mat("#F8D2E0") + zooMachi("rabbit", "sad")),
    gacha_machizoo_2: () => svg(100, 110, mat() + zooMachi("bear", "sad")),
    gacha_machizoo_3: () => svg(100, 110, mat("#D6EFD8") + zooMachi("panda", "sad", 0, { col: "#FFFFFF", limb: "#3A3A3A" })),
    gacha_squishbread_0: () => svg(100, 110, shadow(30) + toast()),
    gacha_squishbread_1: () => svg(100, 110, shadow(38) + melon()),
    gacha_squishbread_2: () => svg(100, 110, shadow(40) + croissant()),
    gacha_squishbread_3: () => svg(100, 110, shadow(38) + bearbread()),
    gacha_squishmochi_0: () => svg(100, 110, shadow(38) + mochiCat()),
    gacha_squishmochi_1: () => svg(100, 110, shadow(38) + mochiPig()),
    gacha_squishmochi_2: () => svg(100, 110, shadow(42) + mochiSeal()),
    gacha_squishmochi_3: () => svg(100, 110, shadow(38) + mochiPanda()),
    gacha_squishsweet_0: () => svg(100, 110, shadow(34) + marsh()),
    gacha_squishsweet_1: () => svg(100, 110, shadow(38) + donut()),
    gacha_squishsweet_2: () => svg(100, 110, shadow(36) + macaron()),
    gacha_squishsweet_3: () => svg(100, 110, shadow(38) + pancake()),
    gacha_minikaden_0: () => svg(100, 110, fridge()),
    gacha_minikaden_1: () => svg(100, 110, washer()),
    gacha_minikaden_2: () => svg(100, 110, microwave()),
    gacha_minikaden_3: () => svg(100, 110, vending()),
    gacha_foodsample_0: () => svg(100, 110, ramen()),
    gacha_foodsample_1: () => svg(100, 110, omurice()),
    gacha_foodsample_2: () => svg(100, 110, sushi()),
    gacha_foodsample_3: () => svg(100, 110, kidsLunch()),
    gacha_townmini_0: () => svg(100, 110, post()),
    gacha_townmini_1: () => svg(100, 110, signal()),
    gacha_townmini_2: () => svg(100, 110, busstop()),
    gacha_townmini_3: () => svg(100, 110, crossing()),
    gacha_oshiri_0: () => svg(100, 110, bottom("#F7C98A", tailCat, { cush: "#CDE8F8", pads: true })),
    gacha_oshiri_1: () => svg(100, 110, bottom("#FFFFFF", tailDog, { cush: "#F8D2E0", pads: true, patch: `<ellipse cx="68" cy="58" rx="9" ry="7" fill="#3A3A3A"/>` })),
    gacha_oshiri_2: () => svg(100, 110, bottom("#FAD0DC", tailPig, { cush: "#FFF2C4", foot: "#F7A9C0" })),
    gacha_oshiri_3: () => svg(100, 110, bottom("#FFFFFF", tailPanda, { cush: "#D6EFD8", foot: "#3A3A3A" })),
    gacha_minigakki_0: () => svg(100, 110, piano()),
    gacha_minigakki_1: () => svg(100, 110, guitar()),
    gacha_minigakki_2: () => svg(100, 110, drum()),
    gacha_minigakki_3: () => svg(100, 110, harp()),
    gacha_minibungu_0: () => svg(100, 110, pencils()),
    gacha_minibungu_1: () => svg(100, 110, eraser()),
    gacha_minibungu_2: () => svg(100, 110, notebook()),
    gacha_minibungu_3: () => svg(100, 110, globe()),
    gacha_forestpal_0: () => svg(100, 110, stump() + nest(npc("squirrel"), 18, 4, 64, 80, "10 -10 180 224") + acorn(70, 70, 1.2)),
    gacha_forestpal_1: () => svg(100, 110, stump("#B98B63") + nest(npc("hedgehog"), 16, 8, 68, 76, "10 0 180 214") + `<circle cx="74" cy="72" r="8" fill="#E8434F" ${sk(1.8)}/><path d="M74,64 q2 -5 6 -6" fill="none" stroke="#7CCB6B" stroke-width="2.4" stroke-linecap="round"/>`),
    gacha_forestpal_2: () => svg(100, 110, stump() + nest(npc("raccoon"), 16, 4, 68, 80, "10 -10 180 224") + leaf(52, 22, -30, "#9ED3A8")),
    gacha_forestpal_3: () => svg(100, 110, `<ellipse cx="50" cy="101" rx="34" ry="6" fill="#4F465622"/><path d="M8,82 C30,76 70,78 94,72" fill="none" stroke="${K}" stroke-width="11" stroke-linecap="round"/><path d="M8,82 C30,76 70,78 94,72" fill="none" stroke="#B98B63" stroke-width="7" stroke-linecap="round"/>` + leaf(14, 86, 20) + leaf(78, 70, -40, "#9ED3A8") + nest(npc("owl", { col: "#FFFFFF", col2: "#F2EEE6" }), 20, 2, 60, 76, "10 0 180 214")),
    gacha_kinoko_0: () => svg(100, 110, mushroomHouse("#E8434F", [[28, 34, 7], [54, 22, 6], [72, 40, 5], [44, 48, 4.5]])),
    gacha_kinoko_1: () => svg(100, 110, mushroomHouse("#B97F4B", [[30, 36, 5], [58, 24, 6], [74, 44, 4]], { chimney: true })),
    gacha_kinoko_2: () => svg(100, 110, mushroomHouse("#F2C84B", [[26, 40, 5], [48, 24, 7], [70, 34, 6]])),
    gacha_kinoko_3: () => svg(100, 110, mushroomCastle()),
  };
  Object.assign(GachaArt.FIG, FIG);

  // ---- 4F の もりの かざり（ArcadeArt の 什器。原点は 床の かど・S は MallArt.svgBuilder）----
  const LEAF = ["#7FB86A", "#94C77B", "#A9D48F", "#6FA85A"];
  // S.at の かわり: ねもとから R（うえは up）まで 絵の はんいに いれる（いれないと スプライトの はしで きれる）
  const atR = (S, x, y, z, R, inner, up = R) => { const q = S.P(x, y, z); S.grow(q.x - R, q.y - up, q.x + R, q.y + R); return S.at(x, y, z, inner); };
  const M = {
    // おおきな もりの き（みき・ねっこ・まるい はっぱの かたまり）。big は まんなかの き（ひくい えだに ちょうちん）
    ftree(S, f) {
      const cx = f.w / 2, cy = f.h / 2, h = f.height || 300, v = f.variant || 0, r = Math.min(f.w, f.h) * (f.big ? 0.42 : 0.38);
      let s = S.ellipse(cx, cy, 0, r * 1.25, "#00000018", 0);
      for (const [dx, dy] of [[-0.42, 0.1], [0.4, -0.12], [0.08, 0.42], [-0.1, -0.4]]) s += S.ellipse(cx + dx * r, cy + dy * r, 0, r * 0.32, "#8C6A48", 1.2);
      s += S.cyl(cx, cy, r * 0.42, 0, h * 0.55, ["#A97F55", "#8C6A48"], 1.6);
      for (const k of [0.2, 0.36, 0.5]) { const q = S.P(cx, cy + r * 0.42, h * k); s += `<path d="M${f2(q.x - 8)},${f2(q.y)} q8 -4 16 0" fill="none" stroke="#6E5236" stroke-width="1.6" stroke-linecap="round"/>`; }
      const blobs = [[0, 0, 0.62, 1.15], [-0.55, 0.25, 0.5, 0.9], [0.55, -0.2, 0.5, 0.95], [0.1, 0.6, 0.48, 0.82], [-0.2, -0.55, 0.46, 1.02], [0.35, 0.3, 0.42, 1.08], [0, 0, 0.5, 1.32]];
      blobs.forEach(([dx, dy, rr, zk], i) => { const R = rr * r * 48 * (f.big ? 1.05 : 1); s += atR(S, cx + dx * r, cy + dy * r, h * 0.48 * zk + 40, R + 2, `<circle r="${f2(R)}" fill="${LEAF[(i + v) % 4]}" ${S.st(1.6)}/><path d="M${f2(-R * 0.5)},${f2(-R * 0.35)} q${f2(R * 0.25)} ${f2(-R * 0.3)} ${f2(R * 0.55)} ${f2(-R * 0.2)}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.45"/>`); });
      if (f.big) for (const [dx, dy, z, c] of [[-0.7, 0.4, 0.5, "#FFE07A"], [0.7, -0.3, 0.56, "#F7A9C8"], [0.2, 0.75, 0.46, "#9FD3F0"]]) s += atR(S, cx + dx * r, cy + dy * r, h * z, 9, `<path d="M0,-14 V-6" ${S.st(1)}/><ellipse cy="0" rx="6" ry="7" fill="${c}" ${S.st(1.2)}/><path d="M-6,0 H6" stroke="#FFFFFF" stroke-width="1" opacity="0.7"/>`);
      return s;
    },
    // きのこの いす（あか・きいろ・ちゃいろ）
    fmush(S, f) {
      const c = ["#E8434F", "#F2C84B", "#C98E5C"][(f.variant || 0) % 3];
      let s = S.ellipse(0.5, 0.5, 0, 0.42, "#00000018", 0) + S.cyl(0.5, 0.5, 0.18, 0, 34, ["#FFF4DC", "#EAD9B8"], 1.4);
      s += atR(S, 0.5, 0.5, 34, 24, `<path d="M-22,4 C-22,-16 22,-16 22,4 C14,8 -14,8 -22,4 Z" fill="${c}" ${S.st(1.6)}/><circle cx="-9" cy="-4" r="3.4" fill="#FFFFFF"/><circle cx="6" cy="-8" r="2.8" fill="#FFFFFF"/><circle cx="12" cy="0" r="2.2" fill="#FFFFFF"/>`);
      return s;
    },
    // きりかぶの ベンチ（わぎりの もよう。わぎりの 線は S.ellipse の 線の はばを 0 に して extra で いろを わたす〔stroke が 2かい あると SVG が こわれる〕）
    fstump(S, f) {
      let s = S.ellipse(f.w / 2, f.h / 2, 0, Math.max(f.w, f.h) * 0.45, "#00000018", 0);
      const n = Math.max(1, Math.round(f.w));
      for (let i = 0; i < n; i++) { const x = (i + 0.5) * (f.w / n); s += S.cyl(x, f.h / 2, 0.38, 0, 30, ["#E9C99A", "#A97F55"], 1.5) + S.ellipse(x, f.h / 2, 30, 0.24, "none", 0, `stroke="#C9A26E" stroke-width="1"`) + S.ellipse(x, f.h / 2, 30, 0.1, "none", 0, `stroke="#C9A26E" stroke-width="1"`); }
      return s;
    },
    // ひくい しげみの しきり
    fhedge(S, f) {
      let s = S.box(0.05, 0.3, f.w - 0.1, 0.4, 0, 30, ["#7FB86A", "#6FA85A", "#5E9550"], 1.4);
      for (let i = 0; i < Math.round(f.w * 2); i++) s += atR(S, 0.25 + i * 0.5, 0.5, 34, 11, `<circle r="10" fill="${LEAF[i % 4]}" ${S.st(1.2)}/>`);
      return s;
    },
    // しげみ（まるい うえこみ）
    fbush(S, f) { let s = S.ellipse(0.5, 0.5, 0, 0.45, "#00000018", 0); for (const [dx, dy, z, r] of [[-0.18, 0.1, 18, 16], [0.2, -0.05, 22, 15], [0, 0.18, 30, 14], [0.02, -0.15, 36, 12]]) s += atR(S, 0.5 + dx, 0.5 + dy, z, r + 1, `<circle r="${r}" fill="${LEAF[(r + z) % 4]}" ${S.st(1.3)}/>`); s += atR(S, 0.5, 0.4, 44, 12, `<circle r="3" fill="#F7A9C8" ${S.st(0.8)}/><circle cx="8" cy="4" r="2.4" fill="#FFFFFF" ${S.st(0.8)}/>`); return s; },
    // おおきな カプセルの オブジェ（木の だいの うえ。したは いろ・うえは すける・なかに f.fig の フィギュア・てっぺんに はっぱ）
    fcapsule(S, f) {
      const cx = f.w / 2, cy = f.h / 2, R = 50, c = ["#F7A9C8", "#9FD3F0", "#FFE07A"][(f.variant || 0) % 3];
      let s = S.ellipse(cx, cy, 0, 0.86, "#00000020", 0) + S.cyl(cx, cy, 0.66, 0, 16, ["#C9A27A", "#A97F55"], 1.5);
      const q = S.P(cx, cy, 16 + R), X = f2(q.x), Y = f2(q.y); S.grow(q.x - R - 4, q.y - R - 18, q.x + R + 4, q.y + R + 2);
      s += `<path d="M${f2(q.x - R)},${Y} A${R},${R} 0 0 0 ${f2(q.x + R)},${Y} Z" fill="${c}" ${S.st(2)}/><path d="M${f2(q.x - R * 0.7)},${f2(q.y + R * 0.42)} q${f2(R * 0.7)} ${f2(R * 0.34)} ${f2(R * 1.4)} 0" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.45"/>`;
      const fig = f.fig && FIG[f.fig] ? FIG[f.fig]() : "";
      if (fig) s += fig.replace(/^<svg [^>]*viewBox="([^"]*)"[^>]*>/, (m0, vb) => `<svg x="${f2(q.x - R * 0.86)}" y="${f2(q.y - R * 0.66)}" width="${f2(R * 1.72)}" height="${f2(R * 0.7)}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet">`);
      s += `<path d="M${f2(q.x - R)},${Y} A${R},${R} 0 0 1 ${f2(q.x + R)},${Y} Z" fill="#E9F6FB" fill-opacity="0.32" ${S.st(2)}/><path d="M${f2(q.x - R)},${Y} H${f2(q.x + R)}" stroke="#FFFFFF" stroke-width="4"/><path d="M${f2(q.x - R)},${Y} H${f2(q.x + R)}" stroke="${INK}" stroke-width="1.4" opacity="0.5"/>`;
      s += `<path d="M${f2(q.x - R * 0.62)},${f2(q.y - R * 0.5)} q${f2(R * 0.2)} ${f2(-R * 0.32)} ${f2(R * 0.56)} ${f2(-R * 0.36)}" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`;
      for (const [dx, a, c2] of [[-9, -30, "#7DBA4C"], [9, 30, "#9ED36A"]]) s += `<ellipse cx="${f2(q.x + dx)}" cy="${f2(q.y - R - 4)}" rx="12" ry="5.6" transform="rotate(${a} ${f2(q.x + dx)} ${f2(q.y - R - 4)})" fill="${c2}" ${S.st(1.3)}/>`;
      return s;
    },
    // どうぶつの オブジェ（きの だいの うえに たつ。しか・ふくろう・くま）
    fstatue(S, f) {
      const sp = { deer: "deer", owl: "owl", bear: "bear" }[f.variant] || "deer";
      let s = S.ellipse(0.5, 0.5, 0, 0.48, "#00000018", 0) + S.box(0.1, 0.1, 0.8, 0.8, 0, 26, ["#C9A27A", "#A97F55", "#8C6A48"], 1.4) + S.box(0.06, 0.06, 0.88, 0.88, 26, 4, ["#E9C99A", "#C9A27A", "#A97F55"], 1.2);
      const img = Art.npcSvg({ sp, emo: "happy", pose: "idle_01", dir: "down", ...(sp === "deer" ? { look: { pattern: "antler" } } : {}) }).replace(/^<svg [^>]*viewBox="([^"]*)"[^>]*>/, (m0, vb) => `<svg x="-50" y="-138" width="100" height="140" viewBox="${vb}" preserveAspectRatio="xMidYMax meet">`);
      s += atR(S, 0.5, 0.5, 30, 52, img, 140);
      if (sp === "bear") s += atR(S, 0.78, 0.66, 56, 12, `<path d="M-7,0 C-7,-9 7,-9 7,0 L6,7 H-6 Z" fill="#F2C84B" ${S.st(1.2)}/><path d="M-6,-3 H6" stroke="#E0A92E" stroke-width="1.6"/>`);
      return s;
    },
  };
  Object.assign(ArcadeArt.M, M);
  const figure = (id) => (FIG[id] ? FIG[id]() : "");
  // js/gacha-forest-more.js（UI-62 の 4F の あたらしい 6シリーズ）も おなじ 部品で 描く
  return { FIG, figure, machi, zooMachi, face, shine, mat, bench, shadow, disc, leaf, stump, spCol, charm, pouchShape, sk, svg, nest, hero, npc };
})();
