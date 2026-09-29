// ころころ フルーツ の 絵。くだもの 8しゅ（かお つき）と、わんこ・がちゃん・ごじ の かおの 玉（キャラ素材の あたま・みみ・かおの ぶひんから）。
// どの 絵も 中心に 当たりの 円（半径 = 物理の r）が くる 正方形。表情は normal / happy / surprise / sad / sleep の 5つ。
// SvgCache の キーは「だん・表情・ピクセル」だけ（有限）。回転や 大きく なる とちゅうは drawImage の 変形で 描く。
const KorokoroArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const FACES = ["normal", "happy", "surprise", "sad", "sleep"];
  // くだものの 絵は 100×100（中心 50,50・当たりの 円の 半径 44）。はみでる へた・はっぱ の ために 1.3ばいの はんいで 描く
  const BALL = 44, CROP = 1.3, HERO_CROP = 1.42;
  const line = (w) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // くだものの かお。s = 大きさ（1 = すいか くらい）。ちいさい くだものは 目を すこし 大きめに
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
      eyes = `<circle cx="${f1(eyeL)}" cy="${f1(y)}" r="${f1(e)}" fill="${K}"/><circle cx="${f1(eyeR)}" cy="${f1(y)}" r="${f1(e)}" fill="${K}"/><circle cx="${f1(eyeL + e * 0.35)}" cy="${f1(y - e * 0.35)}" r="${f1(e * 0.32)}" fill="#FFFFFF"/><circle cx="${f1(eyeR + e * 0.35)}" cy="${f1(y - e * 0.35)}" r="${f1(e * 0.32)}" fill="#FFFFFF"/>`;
      mouth = `<path d="M${f1(x - 5 * s)},${f1(y + 7 * s)} Q${f1(x)},${f1(y + 12 * s)} ${f1(x + 5 * s)},${f1(y + 7 * s)}" fill="none" ${L}/>`;
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
    peach: (emo, lw) => `<path d="M50,14 C56,6 64,2 72,4 C92,12 96,36 94,54 C92,78 72,95 50,95 C28,95 8,78 6,54 C4,34 14,16 30,12 C38,10 44,10 50,14Z" fill="#F8B4BF" ${line(lw)}/>`
      + `<path d="M50,95 C24,94 8,76 8,54 C8,36 20,20 34,16 C22,30 20,60 50,95Z" fill="#F59CAB" opacity="0.55"/><path d="M50,15 C58,30 60,56 50,94" fill="none" stroke="#E488A0" stroke-width="${f1(lw * 1.1)}" stroke-linecap="round"/>`
      + `${leaf(50, 12, 24, -150, "#86C874", lw)}${leaf(52, 12, 22, -30, "#79C06A", lw)}${shine(72, 34, 9, 5, 35)}${fruitFace(emo, 50, 58, 1.05, lw)}`,
    melon: (emo, lw) => `<circle cx="50" cy="53" r="42" fill="#A7D98F" ${line(lw)}/>`
      + `<g fill="none" stroke="#E6F4D2" stroke-width="${f1(Math.max(1.4, lw * 0.6))}" stroke-linecap="round"><path d="M14,40 Q30,30 38,44 T62,40 T86,46"/><path d="M10,58 Q26,50 36,62 T60,58 T90,62"/><path d="M18,76 Q32,68 42,80 T66,76 T84,78"/><path d="M28,16 Q24,34 32,50 T30,84"/><path d="M50,11 Q46,30 52,48 T50,94"/><path d="M72,16 Q76,34 68,52 T72,86"/></g>`
      + `<path d="M42,10 H58 M50,10 V16" stroke="#6E8C3A" stroke-width="${f1(lw * 1.5)}" stroke-linecap="round"/>${shine(30, 34, 9, 5)}${fruitFace(emo, 50, 57, 1.1, lw)}`,
    suika: (emo, lw) => `<circle cx="50" cy="52" r="44" fill="#6FBF57" ${line(lw)}/>`
      + [-32, -12, 8, 28].map((dx) => `<path d="M${50 + dx},10 l-4,8 l5,8 l-5,8 l5,8 l-5,8 l5,8 l-5,8 l5,8 l-4,8 l3,5" fill="none" stroke="#2F7A3B" stroke-width="${f1(lw * 1.5)}" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${dx * 0.5} 50 52)"/>`).join("")
      + `<path d="M50,9 C50,4 52,1 56,0" fill="none" stroke="#6E8C3A" stroke-width="${f1(lw * 1.3)}" stroke-linecap="round"/>${shine(28, 30, 10, 5.5)}${fruitFace(emo, 50, 56, 1.15, lw)}`,
  };
  // 3人の かおの 玉: キャラ素材（CHARA_DATA）の あたま・みみ（ごじは 目の でっぱり）と 表情の ぶひん。からだは 描かない
  // c: 当たりの 円の 中心・R: その 半径（キャラの 座標）
  const HERO = {
    wanko: { c: [100, 80], R: 60, parts: (D) => D.base[7] + `<g transform="translate(12 7)">${D.base[8]}</g><g transform="translate(-12 7)">${D.base[9]}</g>` },
    gachan: { c: [100, 98], R: 57, parts: (D) => D.base[3] },
    goji: { c: [102, 74], R: 55, parts: (D) => D.base.slice(1, 5).join("") + `<circle cx="102" cy="74" r="53" fill="#8C8686" ${line(4.5)}/>` },
  };
  const heroSvg = (id, emo) => {
    const D = CHARA_DATA[id], H = HERO[id], face = D.faces[faceOf(id, emo)] || D.faces.normal;
    const half = H.R * HERO_CROP, [cx, cy] = H.c;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(cx - half)} ${f1(cy - half)} ${f1(half * 2)} ${f1(half * 2)}">${H.parts(D)}${face.join("")}</svg>`;
  };
  // size: 画面での 絵の 大きさ（論理 px）。線は 画面で 1.1〜2px に なる はば（ちいさい くだものほど 絵の 中では 太い）
  const fruitSvg = (tier, emo, size) => {
    const t = KOROKORO_TIERS[tier], half = BALL * CROP, px = Math.max(8, size);
    const lw = f1((half * 2 * Math.max(1.1, Math.min(2, 0.012 * px + 0.6))) / px);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(50 - half)} ${f1(50 - half)} ${f1(half * 2)} ${f1(half * 2)}">${FRUIT[t.id](emo, lw)}</svg>`;
  };
  const svg = (tier, emo = "normal", size = 48) => { const t = KOROKORO_TIERS[tier]; return t.hero ? heroSvg(t.hero, emo) : fruitSvg(tier, emo, size); };
  const cropOf = (tier) => (KOROKORO_TIERS[tier].hero ? HERO_CROP : CROP);
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
  return { FACES, CROP, HERO_CROP, HERO, svg, cropOf, canvas, ensure, draw, fruitFace };
})();
