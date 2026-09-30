// ころころ フルーツ の 絵。くだもの 5しゅ（かお つき）と、いちばん 大きい 3だんの がちゃん・わんこ・ごじ の かおの 玉（キャラ素材の あたま・みみ・かおの ぶひんから）。
// どの 絵も 中心に 当たりの 円（半径 = 物理の r）が くる 正方形。表情は normal / happy / surprise / sad / sleep と、
// blink（まばたき）・wink（ウインク）・dizzy（くらくら）・squish（むぎゅ）・love（なかよし）・yawn（あくび）の 11こ（オーナーの FB 2026-09-30）。
// SvgCache の キーは「だん・表情・ピクセル」だけ（有限）。回転や 大きく なる とちゅうは drawImage の 変形で 描く。
const KorokoroArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const FACES = ["normal", "happy", "surprise", "sad", "sleep", "blink", "wink", "dizzy", "squish", "love", "yawn"];
  // くだものの 絵は 100×100（中心 50,50・当たりの 円の 半径 44）。はみでる へた・はっぱ の ために 1.3ばいの はんいで 描く
  const BALL = 44, CROP = 1.3;
  const line = (w) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // かおの ぶひん（くだものと 3人で つかう）: うずまきの 目（まん中から 2まわり）・ハート・あせ・きらり
  const spiral = (x, y, r, w) => {
    let d = "";
    for (let i = 0; i <= 26; i++) { const t = i / 26, a = t * Math.PI * 4, q = r * (0.12 + 0.88 * t); d += `${i ? "L" : "M"}${f1(x + Math.cos(a) * q)},${f1(y + Math.sin(a) * q)}`; }
    return `<path d="${d}" fill="none" ${line(w)}/>`;
  };
  const heart = (x, y, h, w) => `<path d="M${f1(x)},${f1(y + h * 0.55)} C${f1(x - h * 1.1)},${f1(y - h * 0.1)} ${f1(x - h * 0.55)},${f1(y - h * 0.95)} ${f1(x)},${f1(y - h * 0.35)} C${f1(x + h * 0.55)},${f1(y - h * 0.95)} ${f1(x + h * 1.1)},${f1(y - h * 0.1)} ${f1(x)},${f1(y + h * 0.55)} Z" fill="#F2708A" ${line(w)}/>`;
  const drop = (x, y, h, w) => `<path d="M${f1(x)},${f1(y - h)} C${f1(x + h * 0.85)},${f1(y)} ${f1(x + h * 0.75)},${f1(y + h * 0.85)} ${f1(x)},${f1(y + h * 0.85)} C${f1(x - h * 0.75)},${f1(y + h * 0.85)} ${f1(x - h * 0.85)},${f1(y)} ${f1(x)},${f1(y - h)} Z" fill="#A9DBF5" ${line(w)}/>`;
  const star = (x, y, h, w) => `<path d="M${f1(x)},${f1(y - h)} Q${f1(x + h * 0.18)},${f1(y - h * 0.18)} ${f1(x + h)},${f1(y)} Q${f1(x + h * 0.18)},${f1(y + h * 0.18)} ${f1(x)},${f1(y + h)} Q${f1(x - h * 0.18)},${f1(y + h * 0.18)} ${f1(x - h)},${f1(y)} Q${f1(x - h * 0.18)},${f1(y - h * 0.18)} ${f1(x)},${f1(y - h)} Z" fill="#FFE27A" ${line(w)}/>`;
  // くだものの かお。s = 大きさ（1 = 絵の はば いっぱい くらい）。ちいさい くだものは 目を すこし 大きめに
  const fruitFace = (emo, x, y, s, lw) => {
    const e = 3.4 * s, gap = 11 * s, blush = `<ellipse cx="${f1(x - gap - 5 * s)}" cy="${f1(y + 6 * s)}" rx="${f1(4.6 * s)}" ry="${f1(2.8 * s)}" fill="#F59AAE" opacity="0.75"/><ellipse cx="${f1(x + gap + 5 * s)}" cy="${f1(y + 6 * s)}" rx="${f1(4.6 * s)}" ry="${f1(2.8 * s)}" fill="#F59AAE" opacity="0.75"/>`;
    const L = line(lw), eyeL = x - gap, eyeR = x + gap;
    let eyes = "", mouth = "";
    if (emo === "happy") {
      eyes = `<path d="M${f1(eyeL - e)},${f1(y + 1)} Q${f1(eyeL)},${f1(y - e * 1.4)} ${f1(eyeL + e)},${f1(y + 1)} M${f1(eyeR - e)},${f1(y + 1)} Q${f1(eyeR)},${f1(y - e * 1.4)} ${f1(eyeR + e)},${f1(y + 1)}" fill="none" ${L}/>`;
      mouth = `<path d="M${f1(x - 5 * s)},${f1(y + 6 * s)} Q${f1(x)},${f1(y + 14 * s)} ${f1(x + 5 * s)},${f1(y + 6 * s)} Z" fill="#E86A6A" ${line(lw * 0.8)}/>`;
    } else if (emo === "surprise") {
      eyes = `<circle cx="${f1(eyeL)}" cy="${f1(y)}" r="${f1(e * 1.25)}" fill="#FFFFFF" ${line(lw * 0.8)}/><circle cx="${f1(eyeR)}" cy="${f1(y)}" r="${f1(e * 1.25)}" fill="#FFFFFF" ${line(lw * 0.8)}/><circle cx="${f1(eyeL)}" cy="${f1(y)}" r="${f1(e * 0.55)}" fill="${K}"/><circle cx="${f1(eyeR)}" cy="${f1(y)}" r="${f1(e * 0.55)}" fill="${K}"/>`;
      mouth = `<ellipse cx="${f1(x)}" cy="${f1(y + 10 * s)}" rx="${f1(3 * s)}" ry="${f1(3.8 * s)}" fill="#E86A6A" ${line(lw * 0.8)}/>`;
    } else if (emo === "sad") {
      eyes = `<circle cx="${f1(eyeL)}" cy="${f1(y)}" r="${f1(e)}" fill="${K}"/><circle cx="${f1(eyeR)}" cy="${f1(y)}" r="${f1(e)}" fill="${K}"/><path d="M${f1(eyeL - 1 * s)},${f1(y + 5 * s)} q${f1(-3 * s)},${f1(6 * s)} 0,${f1(8 * s)} q${f1(3 * s)},${f1(-2 * s)} 0,${f1(-8 * s)}Z M${f1(eyeR + 1 * s)},${f1(y + 5 * s)} q${f1(3 * s)},${f1(6 * s)} 0,${f1(8 * s)} q${f1(-3 * s)},${f1(-2 * s)} 0,${f1(-8 * s)}Z" fill="#79BDEB"/>`;
      mouth = `<path d="M${f1(x - 6 * s)},${f1(y + 11 * s)} q${f1(3 * s)},${f1(-4 * s)} ${f1(6 * s)},0 q${f1(3 * s)},${f1(4 * s)} ${f1(6 * s)},0" fill="none" ${L}/>`;
    } else if (emo === "sleep") {
      eyes = `<path d="M${f1(eyeL - e)},${f1(y)} Q${f1(eyeL)},${f1(y + e)} ${f1(eyeL + e)},${f1(y)} M${f1(eyeR - e)},${f1(y)} Q${f1(eyeR)},${f1(y + e)} ${f1(eyeR + e)},${f1(y)}" fill="none" ${L}/>`;
      mouth = `<ellipse cx="${f1(x)}" cy="${f1(y + 9 * s)}" rx="${f1(2.2 * s)}" ry="${f1(1.6 * s)}" fill="${K}"/>`;
    } else {
      const dot = (ex) => `<circle cx="${f1(ex)}" cy="${f1(y)}" r="${f1(e)}" fill="${K}"/><circle cx="${f1(ex + e * 0.35)}" cy="${f1(y - e * 0.35)}" r="${f1(e * 0.32)}" fill="#FFFFFF"/>`;
      const smile = `<path d="M${f1(x - 5 * s)},${f1(y + 7 * s)} Q${f1(x)},${f1(y + 12 * s)} ${f1(x + 5 * s)},${f1(y + 7 * s)}" fill="none" ${L}/>`;
      const open = `<path d="M${f1(x - 5 * s)},${f1(y + 6 * s)} Q${f1(x)},${f1(y + 14 * s)} ${f1(x + 5 * s)},${f1(y + 6 * s)} Z" fill="#E86A6A" ${line(lw * 0.8)}/>`;
      const shut = (ex) => `M${f1(ex - e * 1.05)},${f1(y + e * 0.1)} Q${f1(ex)},${f1(y + e * 0.8)} ${f1(ex + e * 1.05)},${f1(y + e * 0.1)}`;
      if (emo === "blink") {
        // まばたき: 目を とじる だけ（くちは ふつう）
        eyes = `<path d="${shut(eyeL)} ${shut(eyeR)}" fill="none" ${L}/>`; mouth = smile;
      } else if (emo === "wink") {
        // ウインク: ひだりは にっこり（∧）・みぎは ひらいた まま
        eyes = `<path d="M${f1(eyeL - e)},${f1(y + 1)} Q${f1(eyeL)},${f1(y - e * 1.4)} ${f1(eyeL + e)},${f1(y + 1)}" fill="none" ${L}/>` + dot(eyeR); mouth = open;
      } else if (emo === "dizzy") {
        // くらくら: うずまきの 目・なみなみの くち
        eyes = spiral(eyeL, y, e * 1.35, f1(lw * 0.75)) + spiral(eyeR, y, e * 1.35, f1(lw * 0.75));
        mouth = `<path d="M${f1(x - 6 * s)},${f1(y + 9 * s)} q${f1(1.5 * s)},${f1(-2.2 * s)} ${f1(3 * s)},0 t${f1(3 * s)},0 t${f1(3 * s)},0 t${f1(3 * s)},0" fill="none" ${L}/>`;
      } else if (emo === "squish") {
        // むぎゅ: ＞＜ の 目・ぎゅっと した くち
        eyes = `<path d="M${f1(eyeL - e)},${f1(y - e * 0.9)} L${f1(eyeL + e * 0.9)},${f1(y)} L${f1(eyeL - e)},${f1(y + e * 0.9)} M${f1(eyeR + e)},${f1(y - e * 0.9)} L${f1(eyeR - e * 0.9)},${f1(y)} L${f1(eyeR + e)},${f1(y + e * 0.9)}" fill="none" ${L}/>`;
        mouth = `<path d="M${f1(x - 4.5 * s)},${f1(y + 9.5 * s)} q${f1(2.25 * s)},${f1(-2.4 * s)} ${f1(4.5 * s)},0 q${f1(2.25 * s)},${f1(2.4 * s)} ${f1(4.5 * s)},0" fill="none" ${L}/>`;
      } else if (emo === "love") {
        // なかよし（おなじ ものが すぐ そば）: ハートの 目
        eyes = heart(eyeL, y, e * 1.6, f1(lw * 0.7)) + heart(eyeR, y, e * 1.6, f1(lw * 0.7)); mouth = open;
      } else if (emo === "yawn") {
        // あくび: 目を ぎゅっと とじて くちを 大きく
        eyes = `<path d="M${f1(eyeL - e)},${f1(y)} Q${f1(eyeL)},${f1(y + e * 0.55)} ${f1(eyeL + e)},${f1(y)} M${f1(eyeR - e)},${f1(y)} Q${f1(eyeR)},${f1(y + e * 0.55)} ${f1(eyeR + e)},${f1(y)}" fill="none" ${L}/>`;
        mouth = `<ellipse cx="${f1(x)}" cy="${f1(y + 10.5 * s)}" rx="${f1(4 * s)}" ry="${f1(5.4 * s)}" fill="#E86A6A" ${line(lw * 0.8)}/>`;
      } else {
        eyes = dot(eyeL) + dot(eyeR); mouth = smile;
      }
    }
    return blush + eyes + mouth;
  };
  const shine = (x, y, rx, ry, rot = -35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" opacity="0.55"/>`;
  const leaf = (x, y, len, rot, fill = "#7CC46E", lw = 2.6) => `<path d="M${x},${y} q${f1(len * 0.45)},${f1(-len * 0.5)} ${len},0 q${f1(-len * 0.45)},${f1(len * 0.5)} ${-len},0Z" transform="rotate(${rot} ${x} ${y})" fill="${fill}" ${line(lw)}/><path d="M${x},${y} h${f1(len * 0.8)}" transform="rotate(${rot} ${x} ${y})" fill="none" stroke="#4E9A48" stroke-width="${f1(lw * 0.5)}" stroke-linecap="round"/>`;
  // くだもの（lw = 線の はば。ちいさい ものほど 太く して 画面で 見える ように）
  const FRUIT = {
    cherry: (emo, lw) => `<path d="M50,24 C52,14 58,6 70,1" fill="none" stroke="#7A5634" stroke-width="${f1(lw * 1.4)}" stroke-linecap="round"/>${leaf(60, 8, 22, -20, "#84C872", lw)}`
      + `<circle cx="50" cy="56" r="40" fill="#E8545E" ${line(lw)}/><path d="M22,62 C24,82 44,94 62,90" fill="none" stroke="#C93A47" stroke-width="${f1(lw * 1.3)}" stroke-linecap="round" opacity="0.55"/>${shine(34, 40, 9, 5)}${fruitFace(emo, 52, 58, 1.35, lw)}`,
    strawberry: (emo, lw) => `<path d="M50,24 C70,20 94,26 92,46 C90,70 66,94 50,96 C34,94 10,70 8,46 C6,26 30,20 50,24Z" fill="#F0606B" ${line(lw)}/>`
      + [[26, 42], [40, 38], [60, 38], [74, 42], [20, 58], [80, 58], [30, 74], [70, 74], [42, 86], [58, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3.2" fill="#FCE58C" stroke="#D9A43A" stroke-width="0.8"/>`).join("")
      + `<path d="M50,30 L40,14 L46,24 L30,18 L42,28 L26,30 L44,32 Z M50,30 L60,14 L54,24 L70,18 L58,28 L74,30 L56,32 Z" fill="#7CC46E" ${line(lw * 0.8)}/><path d="M50,28 V10" stroke="#5E9A4E" stroke-width="${f1(lw * 1.3)}" stroke-linecap="round"/>${shine(30, 44, 8, 4.5)}${fruitFace(emo, 50, 56, 1.15, lw)}`,
    mikan: (emo, lw) => `<circle cx="50" cy="52" r="43" fill="#F7A43A" ${line(lw)}/><circle cx="50" cy="52" r="34" fill="#F9B24E" opacity="0.6"/>`
      + [[26, 34], [74, 34], [18, 56], [82, 56], [28, 78], [72, 78], [50, 90], [38, 24], [62, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#DB8420" opacity="0.8"/>`).join("")
      + `<path d="M50,12 V4" stroke="#6E8C3A" stroke-width="${f1(lw * 1.4)}" stroke-linecap="round"/>${leaf(51, 7, 20, -15, "#79C06A", lw)}<circle cx="50" cy="11" r="4" fill="#8FB45A" ${line(lw * 0.7)}/>${shine(30, 32, 10, 5.5)}${fruitFace(emo, 50, 55, 1.1, lw)}`,
    apple: (emo, lw) => `<path d="M50,20 C62,8 94,12 94,44 C94,74 72,96 58,94 C54,93 52,91 50,91 C48,91 46,93 42,94 C28,96 6,74 6,44 C6,12 38,8 50,20Z" fill="#E9525A" ${line(lw)}/>`
      + `<path d="M50,21 C48,14 49,8 53,2" fill="none" stroke="#7A5634" stroke-width="${f1(lw * 1.5)}" stroke-linecap="round"/>${leaf(53, 9, 22, -28, "#7CC46E", lw)}<path d="M18,60 C20,78 34,90 46,90" fill="none" stroke="#C83B45" stroke-width="${f1(lw * 1.2)}" opacity="0.5" stroke-linecap="round"/>${shine(28, 36, 10, 5.5)}${fruitFace(emo, 50, 55, 1.05, lw)}`,
    pear: (emo, lw) => `<circle cx="50" cy="53" r="42" fill="#EBD27C" ${line(lw)}/><circle cx="54" cy="58" r="30" fill="#F1DC92" opacity="0.7"/>`
      + [[28, 36], [70, 32], [20, 58], [80, 60], [34, 80], [66, 82], [50, 22], [44, 90], [86, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#B99A4C" opacity="0.75"/>`).join("")
      + `<path d="M50,13 C49,8 50,4 54,0" fill="none" stroke="#7A5634" stroke-width="${f1(lw * 1.4)}" stroke-linecap="round"/>${leaf(52, 6, 18, -10, "#8CC46E", lw)}${shine(30, 34, 10, 5.5)}${fruitFace(emo, 50, 56, 1.08, lw)}`,
  };
  // 3人の かおの 玉: キャラ素材（CHARA_DATA）の あたま・みみ（ごじは 目の でっぱり）と 表情の ぶひん。からだは 描かない
  // c: 当たりの 円の 中心・R: その 半径（キャラの 座標）・crop: 絵の わく（R の なんばいか）。みみ と 表情の かざり（ごじの ハート・がちゃんの ねむりの しるし）が
  // きれない ように ブラウザで はかった 大きさ（わんこ 1.31・がちゃん 1.47・ごじ 1.54）より すこし 大きく した
  // ごじの 目は あたまの うえの でっぱり。玉では あたまの ふちに のる ように あたまの あとで 描く（まばたき できる ように。まえは あたまに かくれて いた）
  const HERO = {
    wanko: { c: [100, 80], R: 60, crop: 1.36, parts: (D) => D.base[7] + `<g transform="translate(12 7)">${D.base[8]}</g><g transform="translate(-12 7)">${D.base[9]}</g>` },
    gachan: { c: [100, 98], R: 57, crop: 1.52, parts: (D) => D.base[3] },
    goji: { c: [102, 74], R: 55, crop: 1.6, parts: (D) => D.base[1] + D.base[3] + `<circle cx="102" cy="74" r="53" fill="#8C8686" ${line(4.5)}/>` },
  };
  // 3人の あたらしい 表情（キャラ素材の はな・くち・くちばしに、目と かざりを かく）。ふつうの 5つは キャラ素材の 表情（faceOf）
  const GOJI_EYES = [[58, 50], [146, 50]], GOJI_LID = "#8C8686";
  const gojiEye = (kind, [x, y]) => {
    const lid = `<circle cx="${x}" cy="${y}" r="7.5" fill="${GOJI_LID}" ${line(3)}/>`;
    if (kind === "shut") return lid + `<path d="M${x - 5.5},${y} Q${x},${y + 5} ${x + 5.5},${y}" fill="none" ${line(3)}/>`;
    if (kind === "happy") return lid + `<path d="M${x - 5.5},${y + 2.5} Q${x},${y - 4.5} ${x + 5.5},${y + 2.5}" fill="none" ${line(3)}/>`;
    if (kind === "squint") return lid + (x < 102 ? `<path d="M${x - 4.5},${y - 4.5} L${x + 4},${y} L${x - 4.5},${y + 4.5}" fill="none" ${line(3)}/>` : `<path d="M${x + 4.5},${y - 4.5} L${x - 4},${y} L${x + 4.5},${y + 4.5}" fill="none" ${line(3)}/>`);
    if (kind === "heart") return heart(x, y + 1, 10, 2.6);
    if (kind === "swirl") return `<circle cx="${x}" cy="${y}" r="7.5" fill="#D6C7A1" ${line(3)}/>` + spiral(x, y, 5.5, 2);
    return `<circle cx="${x}" cy="${y}" r="7.5" fill="#D6C7A1" ${line(3)}/>`;
  };
  const gojiEyes = (l, r = l) => gojiEye(l, GOJI_EYES[0]) + gojiEye(r, GOJI_EYES[1]);
  // ごじの ふつうの 5つの 目（キャラ素材の 表情には 目が ない）
  const GOJI_EYE_OF = { normal: "open", happy: "happy", surprise: "open", sad: "open", sleep: "shut" };
  const HERO_FACES = {
    wanko: (D, emo) => {
      const N = D.faces.normal, S = D.faces.smile, nose = N[2], mouth = N[3], smile = S[2];
      return {
        blink: `<path d="M75,87 Q82,91 89,87 M111,87 Q118,91 125,87" fill="none" ${line(3.5)}/>` + nose + mouth,
        wink: S[0] + N[1] + nose + smile + star(70, 68, 6, 1.8),
        dizzy: spiral(82, 86, 7, 2.6) + spiral(118, 86, 7, 2.6) + nose + `<path d="M89,110 q2.75,-3.5 5.5,0 t5.5,0 t5.5,0 t5.5,0" fill="none" ${line(3)}/>`,
        squish: `<path d="M76,80 L88,86 L76,92 M124,80 L112,86 L124,92" fill="none" ${line(3.5)}/>` + nose + `<path d="M93,108 q3.5,-4 7,0 q3.5,4 7,0" fill="none" ${line(3)}/>` + drop(136, 72, 7, 2),
        love: heart(82, 87, 8, 2.2) + heart(118, 87, 8, 2.2) + nose + smile,
        yawn: `<path d="M75,87 Q82,90 89,87 M111,87 Q118,90 125,87" fill="none" ${line(3.5)}/>` + nose + `<ellipse cx="100" cy="112" rx="7" ry="9" fill="#E35D5B" ${line(3)}/>`,
      }[emo];
    },
    gachan: (D, emo) => {
      const N = D.faces.normal, S = D.faces.smile, beak = N[2] + N[3], open = S[2] + S[3];
      return {
        blink: `<path d="M73,106 Q80,110 87,106 M113,106 Q120,110 127,106" fill="none" ${line(3.5)}/>` + beak,
        wink: S[0] + N[1] + open + star(60, 86, 6, 1.8),
        dizzy: spiral(80, 104, 7.5, 2.6) + spiral(120, 104, 7.5, 2.6) + beak,
        squish: `<path d="M73,98 L86,105 L73,112 M127,98 L114,105 L127,112" fill="none" ${line(3.5)}/>` + beak + drop(146, 80, 7, 2),
        love: heart(80, 105, 9, 2.2) + heart(120, 105, 9, 2.2) + open,
        yawn: `<path d="M73,106 Q80,109 87,106 M113,106 Q120,109 127,106" fill="none" ${line(3.5)}/>` + `<path d="M86,116 C88,108 112,108 114,116 C114,133 108,140 100,140 C92,140 86,133 86,116 Z" fill="#F29A1F" ${line(3.5)}/><path d="M90,119 C93,133 107,133 110,119 Z" fill="#E35D5B" ${line(3)}/>`,
      }[emo];
    },
    goji: (D, emo) => {
      const F = D.faces, mouth = F.normal.join(""), wavy = F.calm.join(""), small = F.cry[0] + F.cry[1], wide = F.shout[0] + F.shout[1];
      return {
        blink: gojiEyes("shut") + mouth,
        wink: gojiEyes("happy", "open") + mouth + star(174, 30, 7, 2),
        dizzy: gojiEyes("swirl") + wavy,
        squish: gojiEyes("squint") + small + drop(170, 66, 8, 2.2),
        love: gojiEyes("heart") + mouth,
        yawn: gojiEyes("shut") + wide,
      }[emo];
    },
  };
  const heroSvg = (id, emo) => {
    const D = CHARA_DATA[id], H = HERO[id], half = H.R * H.crop, [cx, cy] = H.c;
    let face = HERO_FACES[id](D, emo);
    if (face == null) face = (id === "goji" ? gojiEyes(GOJI_EYE_OF[emo] || "open") : "") + (D.faces[faceOf(id, emo)] || D.faces.normal).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(cx - half)} ${f1(cy - half)} ${f1(half * 2)} ${f1(half * 2)}">${H.parts(D)}${face}</svg>`;
  };
  // size: 画面での 絵の 大きさ（論理 px）。線は 画面で 1.1〜2px に なる はば（ちいさい くだものほど 絵の 中では 太い）
  const fruitSvg = (tier, emo, size) => {
    const t = KOROKORO_TIERS[tier], half = BALL * CROP, px = Math.max(8, size);
    const lw = f1((half * 2 * Math.max(1.1, Math.min(2, 0.012 * px + 0.6))) / px);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(50 - half)} ${f1(50 - half)} ${f1(half * 2)} ${f1(half * 2)}">${FRUIT[t.id](emo, lw)}</svg>`;
  };
  const svg = (tier, emo = "normal", size = 48) => { const t = KOROKORO_TIERS[tier]; return t.hero ? heroSvg(t.hero, emo) : fruitSvg(tier, emo, size); };
  const cropOf = (tier) => { const h = KOROKORO_TIERS[tier].hero; return h ? HERO[h].crop : CROP; };
  // 半径 r（論理 px）の 玉の 絵。device px は 8 の ばいすうに まるめて キーを へらす
  const pxOf = (tier, r) => Math.max(16, Math.ceil((r * 2 * cropOf(tier) * (typeof G !== "undefined" ? G.px : 2)) / 8) * 8);
  const canvas = (tier, emo, r) => { const px = pxOf(tier, r); return SvgCache.get(`koro:${tier}:${emo}:${px}`, () => svg(tier, emo, r * 2 * cropOf(tier)), px, px); };
  const ensure = (tier, emo, r) => { const px = pxOf(tier, r); return SvgCache.ensure(`koro:${tier}:${emo}:${px}`, () => svg(tier, emo, r * 2 * cropOf(tier)), px, px); };
  // (x, y) を 中心に 半径 r で 描く（angle: 回転・alpha: うすさ）
  const draw = (ctx, tier, emo, x, y, r, angle = 0, alpha = 1) => {
    const c = canvas(tier, emo, r) || canvas(tier, "normal", r);
    if (!c) return false;
    const s = r * cropOf(tier);
    ctx.save(); if (alpha !== 1) ctx.globalAlpha *= alpha;
    ctx.translate(x, y); if (angle) ctx.rotate(angle);
    ctx.drawImage(c, -s, -s, s * 2, s * 2); ctx.restore();
    return true;
  };
  return { FACES, CROP, HERO, svg, cropOf, canvas, ensure, draw, fruitFace };
})();
