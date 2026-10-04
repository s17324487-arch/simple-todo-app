// Meeときょれじゃ 2F の ガチャ コーナーに「へいせい じょじ」ふうの 4シリーズ（UI-79。オーナーの FB 2026-10-04「服、顔などのアイテムや家具、ガチャの定期入れ替えの種類として、実際の平成女児シリーズのガチャガチャを追加してほしい。」）。
// ・ほんものの「平成女児・平成ファンシー」の カプセルトイ（デニムふうの シールちょう・カンペンケース・プロフちょう・ラメペン・へやの ミニチュア・たまごがたの けいたい ペット・
//   Y2K の ファッション こもの）を さんこうに した オリジナルの デザイン。ほんものの しょうひんめい・キャラクター・ロゴは つかわない。
// ・4シリーズ × 4しゅ（ふつう 3・レア 1）: へいせい ぶんぐ（フィギュア）／へいせい おへや（ミニチュアの かぐ）／ぽけっと たまご（フィギュア）／
//   へいせい おしゃれ（デニムの キャスケット・ちょうちょの いろめがね・ビーズの チョーカー・レアは デニムの ジャンスカ）。
// ・しゅうがわり（js/mee-rotation.js）: 2F の 4くみ（GachaCornerMore.RINGS）の add に 1シリーズずつ たす → くみは 3だい・5シリーズ。
//   1しゅうめ（2026-09-28〜）の ならびは まえと おなじ・2しゅうめ（10-05〜）に 4つ そろって はじめて はいる。
// ・ねだん・かくりつは いままでの ガチャと おなじ（200コイン・ふつう 30%・レア 10%）。Gacha.add で 43〜46 ばん（gacha-corner-more.js の あと・mee-rotation.js の まえに よむ）。
// ・服の 絵は WEAR.heisei_*（hatWrap・eyeWrap・neckWrap・torso。いろは col・id なし）。フィギュアは 100×110 の 絵（GachaArt.FIG）。
// ・セーブ: Save.d.gacha（まえと おなじ）。もちものは Save.d.furn／Save.d.wardrobe。
const GachaHeisei = (() => {
  const A = GachaForestArt, K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const { svg, sk, shadow, shine } = A;
  const dot = (x, y, r, c, w = 1.4) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}"${w ? " " + sk(w) : ""}/>`;
  const heart = (x, y, s, c, w = 1.6) => `<path d="M${f1(x)},${f1(y + 6 * s)} C${f1(x - 7 * s)},${f1(y + 1 * s)} ${f1(x - 6 * s)},${f1(y - 6 * s)} ${f1(x)},${f1(y - 3 * s)} C${f1(x + 6 * s)},${f1(y - 6 * s)} ${f1(x + 7 * s)},${f1(y + 1 * s)} ${f1(x)},${f1(y + 6 * s)} Z" fill="${c}"${w ? " " + sk(w) : ""}/>`;
  const star = (x, y, r, c, w = 1.4, r2 = 0.45) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * r2 : r; d += (i ? "L" : "M") + f1(x + Math.cos(a) * rr) + "," + f1(y + Math.sin(a) * rr); } return `<path d="${d}Z" fill="${c}"${w ? " " + sk(w) : ""}/>`; };
  const stitch = (d, c = "#F2B04A", w = 1.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="3 2.4" stroke-linecap="round"/>`;
  // まるい パステルの だい（フィギュアの あしもと）
  const base = (c = "#FBD3E6", rx = 36) => `${shadow(rx + 4, 104)}<ellipse cx="50" cy="98" rx="${rx}" ry="7.4" fill="${c}" ${sk(2.2)}/><ellipse cx="50" cy="96.4" rx="${rx - 8}" ry="4.2" fill="#FFFFFF" opacity="0.55"/>`;
  // デニムの あや目（ななめの ほそい せん）
  // （x0〜x1・y0〜y1 の なかに おさまる ように はしを きる。clipPath の id は つかわない）
  const twill = (x0, y0, x1, y1, c = "#7EA3DB") => {
    const h = y1 - y0; let s = "";
    for (let x = x0 - h; x < x1; x += 4.2) {
      const a = Math.max(0, (x0 - x) / h), b = Math.min(1, (x1 - x) / h); if (b <= a) continue;
      s += `<path d="M${f1(x + a * h)},${f1(y1 - a * h)} L${f1(x + b * h)},${f1(y1 - b * h)}" stroke="${c}" stroke-width="0.9" opacity="0.7"/>`;
    }
    return s;
  };

  // ---- 1. へいせい ぶんぐ ----
  const DENIM = "#5B84C4", DENIM_D = "#46699F";
  const stickerBook = () => {
    let s = base("#CFE3FA");
    s += `<g transform="rotate(-6 50 60)">`;
    // うしろの ページ（シールが はみだす）
    s += `<rect x="30" y="26" width="48" height="64" rx="4" fill="#FFFFFF" ${sk(2)}/>` + [[74, 34, "#FF8FB1"], [76, 50, "#FFE07A"], [74, 66, "#9ED36A"], [76, 80, "#7FD3F0"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="6" height="8" rx="2" fill="${c}" ${sk(1.2)}/>`).join("");
    // デニムの ひょうし
    s += `<rect x="22" y="22" width="52" height="70" rx="5" fill="${DENIM}"/>${twill(24, 24, 72, 90)}<rect x="22" y="22" width="52" height="70" rx="5" fill="none" ${sk()}/>`;
    s += stitch("M26.5,26.5 H69.5 V87.5 H26.5 Z");
    // せの リング
    s += `<rect x="22" y="22" width="9" height="70" rx="4" fill="${DENIM_D}" ${sk(2)}/>` + [34, 50, 66, 82].map((y) => `<ellipse cx="26.5" cy="${y}" rx="5.4" ry="2.6" fill="#E6EAF2" ${sk(1.4)}/>`).join("");
    // ポケット（ハートの シール）
    s += `<path d="M36,64 H70 V84 C70,88 66,90 62,90 H44 C40,90 36,88 36,84 Z" fill="${DENIM_D}" ${sk(1.8)}/>` + stitch("M39,67 H67 V83 C67,85.5 64.5,87 62,87 H44 C41.5,87 39,85.5 39,83 Z", "#F2B04A", 1.2) + heart(53, 76, 0.95, "#FF8FB1", 1.4) + shine("M49,73 q2 -2 4 -1.6", 1.4);
    // ぷっくり シール（ハート・ほし・いちご・ラメの まる）
    s += heart(44, 38, 1.15, "#FF9EC4", 1.6) + shine("M39.6,35 q2 -2.4 4.2 -2", 1.6);
    s += star(62, 36, 7, "#FFE07A", 1.5) + shine("M58.6,33.4 l2.2 -2", 1.2);
    s += `<circle cx="61" cy="54" r="6.4" fill="#C9B3F0" ${sk(1.5)}/>` + [[59, 52], [63, 55], [60, 57], [62.6, 51]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#FFFFFF"/>`).join("") + shine("M57,51 q2 -2 4 -2", 1.3);
    s += `<path d="M44,50 C38,50 37,58 44,62 C51,58 50,50 44,50 Z" fill="#F0525E" ${sk(1.5)}/><path d="M40.6,50 L44,46.6 L47.4,50 Z" fill="#6DBE5A" ${sk(1)}/>` + [[42.4, 54], [45.6, 54], [44, 57.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="#FFE07A"/>`).join("");
    return s + `</g>`;
  };
  const canPenCase = () => {
    let s = base("#D7F2E8");
    const body = "#9FDCC8", lid = "#B9E8D8";
    // ふた（ひらいて うしろに たつ。うらに じかんわり）
    s += `<path d="M16,58 L20,22 C20,19 22,18 25,18 H75 C78,18 80,19 80,22 L84,58 Z" fill="${lid}" ${sk()}/>`;
    s += `<rect x="25" y="24" width="50" height="28" rx="2" fill="#FFFFFF" ${sk(1.6)}/>`;
    for (let i = 1; i < 5; i++) s += `<path d="M${25 + i * 10},24 V52" stroke="#BFD8F0" stroke-width="1"/>`;
    for (let j = 1; j < 4; j++) s += `<path d="M25,${24 + j * 7} H75" stroke="#BFD8F0" stroke-width="1"/>`;
    s += [[30, 27.5, "#FFC2D6"], [50, 34.5, "#FFE9A0"], [60, 27.5, "#C8E6A0"], [40, 41.5, "#C9DDF7"], [70, 41.5, "#E3D3F7"], [30, 48.5, "#FFE9A0"]].map(([x, y, c]) => `<rect x="${x - 4}" y="${y - 2.4}" width="8" height="4.8" rx="1" fill="${c}"/>`).join("");
    // なかの えんぴつ と けしゴム
    s += `<path d="M22,62 L76,60" stroke="${K}" stroke-width="7.6" stroke-linecap="round"/><path d="M22,62 L76,60" stroke="#FFD84D" stroke-width="4.8" stroke-linecap="round"/><path d="M71,60.2 L80,59.8" stroke="#F2C9A0" stroke-width="4.4"/><path d="M79,59.8 L83,59.7" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<rect x="54" y="62" width="16" height="7" rx="2" fill="#FFFFFF" ${sk(1.4)}/><rect x="58" y="62" width="10" height="7" fill="#7FB8EA" ${sk(1.2)}/>`;
    // ほんたい（まえの めん・ぎんの ふち）
    s += `<rect x="14" y="64" width="72" height="28" rx="5" fill="${body}" ${sk()}/><path d="M16,66.4 H84" stroke="#E6EAF2" stroke-width="2.4" stroke-linecap="round"/>`;
    s += heart(28, 78, 0.9, "#FF8FB1", 1.3) + star(44, 80, 4.6, "#FFE07A", 1.2) + heart(60, 79, 0.75, "#B79BEA", 1.2) + star(74, 77, 4, "#FFFFFF", 1.2) + dot(36, 86, 1.6, "#FFFFFF", 0) + dot(52, 86.4, 1.6, "#FF8FB1", 0) + dot(68, 86, 1.6, "#FFFFFF", 0);
    s += shine("M20,72 q2 -3 6 -3.4", 2);
    // ちょうつがい
    return s + `<rect x="30" y="61" width="8" height="3.4" rx="1.4" fill="#D9DEE8" ${sk(1)}/><rect x="62" y="61" width="8" height="3.4" rx="1.4" fill="#D9DEE8" ${sk(1)}/>`;
  };
  const profBook = () => {
    let s = base("#E8DDFB");
    s += `<g transform="rotate(5 50 60)">`;
    // カラフルな ページ
    s += [["#FF9EC4", 3], ["#FFE07A", 2], ["#9ED36A", 1], ["#7FD3F0", 0]].map(([c, i]) => `<rect x="${28 + i * 1.6}" y="${24 + i * 1.6}" width="46" height="62" rx="3" fill="${c}" ${sk(1.4)}/>`).join("");
    // ひょうし（みずたま）
    s += `<rect x="22" y="20" width="48" height="66" rx="5" fill="#C9B3F0" ${sk()}/>`;
    for (let y = 27; y < 84; y += 9) for (let x = 28 + ((y / 9) % 2) * 4.5; x < 66; x += 9) s += `<circle cx="${f1(x)}" cy="${y}" r="1.7" fill="#FFFFFF" opacity="0.85"/>`;
    s += `<rect x="30" y="34" width="30" height="20" rx="3" fill="#FFFFFF" ${sk(1.6)}/><path d="M35,41 H55 M35,47 H50" stroke="#C9B3F0" stroke-width="2" stroke-linecap="round"/>` + heart(56, 46, 0.55, "#FF8FB1", 1);
    // ハートの かぎ（ベルト）
    s += `<path d="M64,48 H78 C80,48 80,58 78,58 H64 Z" fill="#B79BEA" ${sk(1.8)}/>`;
    s += heart(70, 53, 1.25, "#F7C948", 1.8) + `<circle cx="70" cy="52.4" r="1.4" fill="${K}"/><path d="M70,53 V56" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>` + shine("M65.6,49.6 q1.6 -1.6 3.6 -1.4", 1.3);
    // しおりの リボン
    s += `<path d="M40,86 L38,98 L41.5,95 L45,98 L44,86" fill="#FF7BA8" ${sk(1.4)}/>`;
    return s + shine("M26,26 q3 -3 8 -3", 2) + `</g>`;
  };
  const glitterPens = () => {
    let s = base("#FFE9A0", 34); // レアでも まわりに キラキラは かかない（UI-50・UI-66）
    const C = ["#FF7BA8", "#FFA24C", "#FFD84D", "#7CCB6B", "#5FB4F0", "#A98BE0"];
    // ペン（おうぎに ひろがる・ラメの つぶ）
    C.forEach((c, i) => {
      const a = -25 + i * 10, rad = (a * Math.PI) / 180, x0 = 50 + Math.sin(rad) * 4, y0 = 78, x1 = 50 + Math.sin(rad) * 62, y1 = 78 - Math.cos(rad) * 62;
      s += `<path d="M${f1(x0)},${y0} L${f1(x1)},${f1(y1)}" stroke="${K}" stroke-width="8.2" stroke-linecap="round"/><path d="M${f1(x0)},${y0} L${f1(x1)},${f1(y1)}" stroke="${c}" stroke-width="5.2" stroke-linecap="round"/>`;
      for (let t = 0.35; t < 0.85; t += 0.14) s += `<circle cx="${f1(x0 + (x1 - x0) * t + 0.8)}" cy="${f1(y0 + (y1 - y0) * t)}" r="0.8" fill="#FFFFFF"/>`;
      const cx = x0 + (x1 - x0) * 0.86, cy = y0 + (y1 - y0) * 0.86;
      s += `<path d="M${f1(cx)},${f1(cy)} L${f1(x1)},${f1(y1)}" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.85"/>`;
    });
    // すきとおった カップ（ぎんの ふち）
    s += `<path d="M28,62 L32,96 C32,99 68,99 68,96 L72,62 Z" fill="#DDF3FF" fill-opacity="0.75" ${sk()}/><ellipse cx="50" cy="62" rx="22" ry="4.6" fill="#F2FBFF" ${sk(2)}/>`;
    s += `<path d="M33,70 L36,93" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>` + heart(54, 82, 1, "#FF9EC4", 1.4) + star(62, 74, 3.6, "#FFE07A", 1.1);
    return s;
  };

  // ---- 2. へいせい おへや ----
  const dresser = () => {
    let s = base("#FBD3E6", 38);
    const pk = "#F7C6DA", pd = "#E9A3C1";
    // かがみ（たまごがた・ふちに パール・うえに リボン）
    s += `<ellipse cx="50" cy="34" rx="21" ry="24" fill="#FFFFFF" ${sk()}/><ellipse cx="50" cy="34" rx="15.6" ry="18.6" fill="#CFEFFB" ${sk(1.8)}/>` + shine("M42,24 q4 -6 10 -6", 2.4) + shine("M43,34 l6 -7", 1.6);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<circle cx="${f1(50 + Math.cos(a) * 18.3)}" cy="${f1(34 + Math.sin(a) * 21.4)}" r="1.3" fill="#F2E6D9"/>`; }
    s += `<path d="M50,10 C44,4 38,6 40,11 C38,15 44,16 50,12 Z M50,10 C56,4 62,6 60,11 C62,15 56,16 50,12 Z" fill="#FF8FB1" ${sk(1.6)}/><circle cx="50" cy="11" r="2.6" fill="#E66A92" ${sk(1.2)}/>`;
    // つくえ（2だんの ひきだし・ハートの とって）
    s += `<rect x="18" y="56" width="64" height="7" rx="3" fill="#FFFFFF" ${sk(2)}/>`;
    s += `<path d="M22,63 H78 V84 H22 Z" fill="${pk}" ${sk()}/><path d="M50,63 V84" stroke="${pd}" stroke-width="1.6"/><path d="M24,73.6 H76" stroke="${pd}" stroke-width="1.4"/>`;
    s += heart(36, 68.4, 0.5, "#FFFFFF", 1) + heart(64, 68.4, 0.5, "#FFFFFF", 1) + heart(36, 79, 0.5, "#FFFFFF", 1) + heart(64, 79, 0.5, "#FFFFFF", 1);
    // くるっと した あし
    s += `<path d="M25,84 C25,90 22,93 20,96 M75,84 C75,90 78,93 80,96" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M25,84 C25,90 22,93 20,96 M75,84 C75,90 78,93 80,96" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>`;
    // こうすいの びん・くちべに・コンパクト
    s += `<path d="M28,56 C24,52 24,47 28,46 L32,46 C36,47 36,52 32,56 Z" fill="#FFB8D2" ${sk(1.4)}/><rect x="28.4" y="42.6" width="3.2" height="3.6" rx="1" fill="#F7C948" ${sk(1)}/>`;
    s += `<rect x="68" y="47" width="5" height="9" rx="1.4" fill="#D9DEE8" ${sk(1.2)}/><path d="M68.6,47 L70.5,42 L72.4,47 Z" fill="#E8434F" ${sk(1)}/>`;
    return s + `<ellipse cx="58.6" cy="54.6" rx="5" ry="2" fill="#F2E6D9" ${sk(1.2)}/>`;
  };
  const heartCushion = () => {
    let s = base("#FFD6E6", 34);
    const H = "M50,92 C26,78 12,62 14,44 C16,28 34,22 50,36 C66,22 84,28 86,44 C88,62 74,78 50,92 Z";
    // レースの ふち
    let lace = ""; for (let i = 0; i < 30; i++) { const t = i / 30, a = t * Math.PI * 2; lace += `<circle cx="${f1(50 + Math.cos(a) * 37 * (1 + 0.06 * Math.sin(a * 2)))}" cy="${f1(58 + Math.sin(a) * 31)}" r="4.2" fill="#FFFFFF" ${sk(1.2)}/>`; }
    s += `<g opacity="0.95">${lace}</g>`;
    s += `<path d="${H}" fill="#FF9EC4" ${sk()}/>`;
    // ファーの けなみ
    for (let i = 0; i < 26; i++) { const x = 22 + (i * 37) % 56, y = 42 + ((i * 19) % 38); if (y > 86 - Math.abs(x - 50) * 0.7) continue; s += `<path d="M${x},${y} q2 -3 4 0" fill="none" stroke="#FFC7DD" stroke-width="1.6" stroke-linecap="round"/>`; }
    s += `<path d="M24,46 C24,36 34,32 42,38" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
    // ししゅうの ほし と ハート
    s += star(50, 60, 9, "#FFE07A", 1.6) + stitch("M50,48 C46,52 40,54 38,60", "#FFFFFF", 1.2) + heart(64, 70, 0.7, "#FF7BA8", 1.2);
    return s;
  };
  const beadCurtain = () => {
    let s = base("#E3F2FB", 38);
    const BC = ["#FF9EC4", "#7FD3F0", "#FFE07A", "#C9B3F0", "#FFFFFF", "#9ED36A"];
    // わく（きの いろ）
    s += `<rect x="16" y="14" width="6" height="84" rx="2" fill="#E2B886" ${sk(2)}/><rect x="78" y="14" width="6" height="84" rx="2" fill="#E2B886" ${sk(2)}/><rect x="12" y="10" width="76" height="9" rx="3" fill="#D29A62" ${sk(2)}/>`;
    // ビーズの すじ（いと が みえる・すじの あいだは すきま）
    for (let k = 0; k < 7; k++) {
      const x = 29 + k * 7, sway = (j) => Math.sin(j * 0.6 + k * 1.3) * 1.4;
      let d = `M${x},19`; for (let j = 0; j <= 10; j++) d += ` L${f1(x + sway(j))},${f1(24 + j * 6.6)}`;
      s += `<path d="${d}" fill="none" stroke="#B9A48C" stroke-width="0.9"/>`;
      for (let j = 0; j < 10; j++) { const y = 24 + j * 6.6, xx = x + sway(j), big = j % 3 === 1; s += `<circle cx="${f1(xx)}" cy="${f1(y)}" r="${big ? 2.7 : 2.1}" fill="${BC[(k * 2 + j) % BC.length]}" ${sk(0.9)}/>` + (big ? `<circle cx="${f1(xx - 0.8)}" cy="${f1(y - 0.9)}" r="0.7" fill="#FFFFFF"/>` : ""); }
      s += (k % 2 ? star(x + sway(10), 92, 3.6, "#FFE07A", 1) : heart(x + sway(10), 91, 0.55, "#FF7BA8", 1));
    }
    return s + shine("M18,24 V60", 1.6);
  };
  const heartPhone = () => {
    let s = base("#FFD6E6", 38); // レアでも まわりに キラキラは かかない（UI-50・UI-66）
    // くるくる コード（じゅわきの はしから ほんたいの よこへ）
    let coil = "M24,44"; for (let i = 0; i < 6; i++) { const y = 48 + i * 4.4; coil += ` C${f1(14 - i * 0.6)},${f1(y - 3)} ${f1(12 - i * 0.6)},${f1(y + 3)} ${f1(18 - i * 0.6)},${f1(y + 1)}`; }
    coil += " C20,74 22,76 24,74";
    s += `<path d="${coil}" fill="none" stroke="${K}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="${coil}" fill="none" stroke="#FF7BAA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    // ハートの ほんたい
    s += `<path d="M50,96 C28,84 14,70 16,54 C18,40 34,34 50,46 C66,34 82,40 84,54 C86,70 72,84 50,96 Z" fill="#FF7BAA" ${sk()}/>`;
    s += `<path d="M50,88 C34,79 24,69 26,58 C27.6,49 38,46 50,54 C62,46 72.4,49 74,58 C76,69 66,79 50,88 Z" fill="#FFB8D2" ${sk(1.6)}/>`;
    // ボタン（3×3）と えきしょう
    s += `<rect x="40" y="56" width="20" height="7" rx="2" fill="#BFE6C8" ${sk(1.3)}/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s += `<circle cx="${42 + c * 8}" cy="${68.6 + r * 6}" r="2.3" fill="#FFFFFF" ${sk(1)}/>`;
    // じゅわき（うえに のる）
    s += `<path d="M22,38 C22,30 30,28 34,32 C40,26 60,26 66,32 C70,28 78,30 78,38 C78,44 72,46 68,42 C62,36 38,36 32,42 C28,46 22,44 22,38 Z" fill="#FF9EC4" ${sk()}/>`;
    s += `<ellipse cx="28" cy="38" rx="5" ry="4" fill="#E66A92" ${sk(1.3)}/><ellipse cx="72" cy="38" rx="5" ry="4" fill="#E66A92" ${sk(1.3)}/>` + shine("M38,31 q12 -4 24 0", 2);
    return s + shine("M24,58 q1 -8 8 -11", 2.2);
  };

  // ---- 3. ぽけっと たまご（たまごがたの けいたい ペット）----
  // ドット絵（8×8）: X が こい いろの マス（りんかくと め・くち）
  const PIX = {
    chick: ["..XXXX..", ".X....X.", "X..X.X.X", "X...XX.X", "X......X", ".X....X.", "..XXXX..", ".X....X."],
    ghost: ["..XXXX..", ".X....X.", "X.X..X.X", "X......X", "X..XX..X", "X......X", "X.X..X.X", ".X.XX.X."],
    cat: ["X......X", "XX....XX", "X.XXXX.X", "X......X", "X.X..X.X", "X..XX..X", ".X....X.", "..XXXX.."],
    bunny: [".X....X.", ".X....X.", ".XX..XX.", "X..XX..X", "X.X..X.X", "X..XX..X", "X......X", ".XXXXXX."],
  };
  const pixels = (m, x0, y0, p = 2.6, c = "#3E4A2E") => m.map((row, j) => [...row].map((ch, i) => (ch === "X" ? `<rect x="${f1(x0 + i * p)}" y="${f1(y0 + j * p)}" width="${p}" height="${p}" fill="${c}"/>` : "")).join("")).join("");
  const eggPet = (shell, deco, sprite, rare) => {
    let s = base(rare ? "#FFE9A0" : "#EAF4FF", 30); // レアは からの ラメ だけ（まわりに キラキラは かかない・UI-50・UI-66）
    // ボール チェーン と わっか
    s += `<path d="M50,16 C40,6 30,10 28,20" fill="none" stroke="${K}" stroke-width="1.2" stroke-dasharray="1.6 1.4"/>` + [[44, 9.4], [38, 8.6], [33, 11], [29.4, 15.4]].map(([x, y]) => dot(x, y, 1.6, "#D9DEE8", 1)).join("");
    s += `<circle cx="50" cy="16" r="4.6" fill="none" stroke="${K}" stroke-width="3.6"/><circle cx="50" cy="16" r="4.6" fill="none" stroke="#D9DEE8" stroke-width="1.6"/>`;
    // たまごの から
    const EGG = "M50,20 C31,20 22,46 22,62 C22,82 35,94 50,94 C65,94 78,82 78,62 C78,46 69,20 50,20 Z";
    s += `<path d="${EGG}" fill="${shell}" ${sk()}/>`;
    s += deco;
    s += `<path d="M32,40 C34,32 39,27 45,25" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.75"/>`;
    // がめん（しろい ふち・えきしょう・ドット絵）
    s += `<rect x="31" y="40" width="38" height="31" rx="7" fill="#FFFFFF" ${sk(2)}/><rect x="35.4" y="44" width="29.2" height="23" rx="3" fill="#BFD8A8" ${sk(1.4)}/>`;
    s += pixels(sprite, 39.6, 45.2, 2.6) + `<path d="M37,64.6 H63" stroke="#A9C292" stroke-width="1"/>`;
    // ボタン 3つ
    s += dot(39, 80, 3.6, "#FFFFFF", 1.4) + dot(50, 83, 3.6, "#FFFFFF", 1.4) + dot(61, 80, 3.6, "#FFFFFF", 1.4);
    return s;
  };
  const dots = (c) => [[30, 56], [70, 56], [28, 74], [72, 74], [40, 28], [60, 28], [50, 89]].map(([x, y]) => dot(x, y, 2.2, c, 0)).join("");
  const hearts = (c) => [[29, 58], [71, 58], [30, 76], [70, 76]].map(([x, y]) => heart(x, y, 0.42, c, 0)).join("");
  const stars = (c) => [[29, 57], [71, 57], [29, 76], [71, 76], [42, 29], [58, 29]].map(([x, y]) => star(x, y, 2.6, c, 0)).join("");
  const sparkle = () => [[28, 50], [72, 50], [26, 70], [74, 70], [38, 88], [62, 88], [44, 30], [56, 30], [66, 36], [34, 36]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.6}" fill="#FFFFFF"/>`).join("") + star(30, 60, 3, "#FFFFFF", 0) + star(70, 64, 2.6, "#FFFFFF", 0);

  // ---- 4. へいせい おしゃれ（服の 絵）----
  const fx = (n) => (Math.round(n * 100) / 100).toString();
  // デニムの キャスケット（あたま・ぼうし）: ふっくら 8まい はぎ・まえの つば・てっぺんの ボタン・オレンジの ステッチ・ハートの ピン
  WEAR.heisei_casquette = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || DENIM, st = ctx.col[1] || "#F2B04A", cd = shade(c, -0.22), cl = shade(c, 0.32), side = ctx.view === "side", back = ctx.view === "back";
      let o = "";
      if (side) o += `<path d="M-26,-4 C-52,-8 -74,-2 -80,6 C-62,12 -38,8 -18,2 Z" fill="${cd}" ${stroke(s)}/>`;
      o += `<path d="M-52,-2 C-60,-34 -30,-56 2,-56 C34,-56 60,-34 52,-2 C30,6 -30,6 -52,-2 Z" fill="${c}" ${stroke(s)}/>`;
      o += `<path d="M2,-56 C-14,-40 -26,-22 -32,2 M2,-56 C18,-40 30,-22 34,2 M2,-56 C-2,-36 -3,-16 -2,4" fill="none" stroke="${cd}" stroke-width="${fx(s * 0.45)}" stroke-linecap="round"/>`;
      o += `<path d="M-46,-8 C-24,-1 26,-1 48,-8" fill="none" stroke="${st}" stroke-width="${fx(s * 0.5)}" stroke-dasharray="${fx(s * 1.1)} ${fx(s * 0.8)}" stroke-linecap="round"/>`;
      o += `<ellipse cx="-24" cy="-34" rx="11" ry="5" transform="rotate(-28 -24 -34)" fill="${cl}" opacity=".55"/><circle cx="2" cy="-56" r="5.4" fill="${cd}" ${stroke(s * 0.7)}/>`;
      if (!side && !back) o += `<path d="M-38,-2 C-30,14 34,14 40,-2 C22,6 -20,6 -38,-2 Z" fill="${cd}" ${stroke(s)}/><path d="M-26,4 C-8,9 12,9 28,4" fill="none" stroke="${st}" stroke-width="${fx(s * 0.4)}" stroke-dasharray="${fx(s * 0.9)} ${fx(s * 0.7)}" stroke-linecap="round"/>`;
      if (back) o += `<path d="M-12,-2 H14" stroke="${st}" stroke-width="${fx(s * 0.9)}" stroke-linecap="round"/>`;
      else o += `<path d="M${side ? -30 : 30},-30 c-5,-6 -12,-1 -8,5 l8,7 l8,-7 c4,-6 -3,-11 -8,-5 Z" fill="#FF8FB1" ${stroke(s * 0.7)}/>`;
      return o;
    }),
  });
  // ちょうちょの いろめがね（かお）: ちょうちょの はねの かたちの レンズ（うえは ラベンダー・したは ピンク）
  WEAR.heisei_butterflyshades = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const fr = ctx.col[0] || "#B79BEA", ln = ctx.col[1] || "#FF9EC4";
      let o = "";
      for (const d of [-1, 1]) {
        const up = `M${d * 5},-3 C${d * 8},-17 ${d * 28},-24 ${d * 39},-15 C${d * 45},-9 ${d * 41},-1 ${d * 33},1 C${d * 24},3 ${d * 12},2 ${d * 5},-3 Z`;
        const lo = `M${d * 6},1 C${d * 12},4 ${d * 26},4 ${d * 32},4 C${d * 37},10 ${d * 30},17 ${d * 22},16 C${d * 14},15 ${d * 8},9 ${d * 6},1 Z`;
        o += `<path d="${up}" fill="${fr}" fill-opacity="0.62" ${stroke(s)}/><path d="${lo}" fill="${ln}" fill-opacity="0.66" ${stroke(s)}/>`;
        o += `<path d="M${d * 12},-10 C${d * 18},-15 ${d * 26},-16 ${d * 31},-13" fill="none" stroke="#FFFFFF" stroke-width="${fx(s * 0.55)}" stroke-linecap="round" opacity="0.9"/><circle cx="${d * 34}" cy="-9" r="${fx(s * 0.5)}" fill="#FFFFFF"/>`;
        o += `<path d="M${d * 40},-12 L${d * 50},-6" stroke="${K}" stroke-width="${fx(s * 0.9)}" stroke-linecap="round"/>`;
      }
      return o + `<path d="M-5,-3 C-2,-6 2,-6 5,-3" fill="none" ${stroke(s * 0.9)}/>`;
    }),
  });
  // ビーズの チョーカー（くび）: カラフルな まるい ビーズ・まんなかに ハートの チャーム
  const BEADS = ["#FF9EC4", "#FFE07A", "#7FD3F0", "#C9B3F0", "#9ED36A", "#FFFFFF"];
  WEAR.heisei_choker = (ctx) => {
    if (ctx.view === "back") return {};
    return {
      top: neckWrap(ctx, (s) => {
        let out = "";
        for (let i = 0; i <= 12; i++) { const t = i / 12, x = -38 + t * 76, y = -2 + Math.sin(t * Math.PI) * 10; out += `<circle cx="${fx(x)}" cy="${fx(y)}" r="${i % 2 ? 4 : 4.8}" fill="${BEADS[i % BEADS.length]}" ${stroke(s * 0.45)}/><circle cx="${fx(x - 1.4)}" cy="${fx(y - 1.6)}" r="1.2" fill="#FFFFFF" opacity="0.9"/>`; }
        const hc = ctx.col[0] || "#FF7BA8";
        return out + `<path d="M0,8 V12" stroke="${K}" stroke-width="${fx(s * 0.5)}"/><path d="M0,26 C-9,20 -10,12 -5,10 C-2,9 0,11 0,13 C0,11 2,9 5,10 C10,12 9,20 0,26 Z" fill="${hc}" ${stroke(s * 0.6)}/><path d="M-4,14 q2 -2 4 -1" fill="none" stroke="#FFFFFF" stroke-width="${fx(s * 0.45)}" stroke-linecap="round"/>`;
      }),
    };
  };
  // デニムの ジャンスカ（ふく・レア）: むねあて と かたひも・A ラインの スカート・ハートの ポケット・オレンジの ステッチ・ほしの ワッペン
  WEAR.heisei_jumperskirt = (ctx) => {
    const T = ctx.a.torso, c = ctx.col[0] || DENIM, st = ctx.col[1] || "#F2B04A", cd = shade(c, -0.2), back = ctx.view === "back";
    const waist = T.top + (T.bottom - T.top) * 0.46, hw = T.w / 2 + 3, hem = T.bottom - 4, flare = T.w * 0.2, bw = T.w * 0.46;
    const skirt = `<path d="M${fx(T.cx - hw + 2)},${fx(waist)} C${fx(T.cx - hw - flare * 0.4)},${fx(waist + 14)} ${fx(T.cx - hw - flare)},${fx(hem - 8)} ${fx(T.cx - hw - flare)},${fx(hem)} C${fx(T.cx - hw / 2)},${fx(hem + 7)} ${fx(T.cx + hw / 2)},${fx(hem + 7)} ${fx(T.cx + hw + flare)},${fx(hem)} C${fx(T.cx + hw + flare)},${fx(hem - 8)} ${fx(T.cx + hw + flare * 0.4)},${fx(waist + 14)} ${fx(T.cx + hw - 2)},${fx(waist)} Z" fill="${c}" ${stroke()}/>`
      + `<path d="M${fx(T.cx - hw - flare + 5)},${fx(hem - 4)} C${fx(T.cx - hw / 2)},${fx(hem + 2)} ${fx(T.cx + hw / 2)},${fx(hem + 2)} ${fx(T.cx + hw + flare - 5)},${fx(hem - 4)}" fill="none" stroke="${st}" stroke-width="2.4" stroke-dasharray="4 3" stroke-linecap="round"/>`
      + `<path d="M${fx(T.cx - hw * 0.45)},${fx(waist + 6)} L${fx(T.cx - hw * 0.6 - flare * 0.3)},${fx(hem - 2)} M${fx(T.cx + hw * 0.45)},${fx(waist + 6)} L${fx(T.cx + hw * 0.6 + flare * 0.3)},${fx(hem - 2)}" stroke="${cd}" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M${fx(T.cx - hw + 3)},${fx(waist + 3)} H${fx(T.cx + hw - 3)}" stroke="${st}" stroke-width="2.2" stroke-dasharray="4 3" stroke-linecap="round"/>`;
    let inner = "";
    if (!back) {
      inner += `<path d="M${fx(T.cx - bw / 2)},${fx(waist + 2)} V${fx(T.top + 12)} Q${fx(T.cx - bw / 2)},${fx(T.top + 6)} ${fx(T.cx - bw / 2 + 6)},${fx(T.top + 6)} H${fx(T.cx + bw / 2 - 6)} Q${fx(T.cx + bw / 2)},${fx(T.top + 6)} ${fx(T.cx + bw / 2)},${fx(T.top + 12)} V${fx(waist + 2)} Z" fill="${c}" ${stroke(3.5)}/>`;
      inner += `<path d="M${fx(T.cx - bw / 2 + 4)},${fx(waist)} V${fx(T.top + 12)} H${fx(T.cx + bw / 2 - 4)} V${fx(waist)}" fill="none" stroke="${st}" stroke-width="2" stroke-dasharray="3.4 2.6" stroke-linecap="round"/>`;
      const hy = T.top + (waist - T.top) * 0.55;
      inner += `<path d="${heartPath(T.cx, hy, 1.5)}" fill="#FF8FB1" ${stroke(2.5)}/><path d="M${fx(T.cx - 5)},${fx(hy - 2)} q2 -3 5 -2" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`;
      inner += `<path d="M${fx(T.cx - bw / 2)},${fx(T.top + 10)} L${fx(T.cx - T.w * 0.42)},${fx(T.top - 6)} M${fx(T.cx + bw / 2)},${fx(T.top + 10)} L${fx(T.cx + T.w * 0.42)},${fx(T.top - 6)}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`
        + `<path d="M${fx(T.cx - bw / 2)},${fx(T.top + 10)} L${fx(T.cx - T.w * 0.42)},${fx(T.top - 6)} M${fx(T.cx + bw / 2)},${fx(T.top + 10)} L${fx(T.cx + T.w * 0.42)},${fx(T.top - 6)}" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`
        + `<circle cx="${fx(T.cx - bw / 2 + 5)}" cy="${fx(T.top + 13)}" r="3.4" fill="#F7C948" ${stroke(2)}/><circle cx="${fx(T.cx + bw / 2 - 5)}" cy="${fx(T.top + 13)}" r="3.4" fill="#F7C948" ${stroke(2)}/>`;
    } else {
      inner += `<path d="M${fx(T.cx)},${fx(waist)} L${fx(T.cx - T.w * 0.38)},${fx(T.top - 4)} M${fx(T.cx)},${fx(waist)} L${fx(T.cx + T.w * 0.38)},${fx(T.top - 4)}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`
        + `<path d="M${fx(T.cx)},${fx(waist)} L${fx(T.cx - T.w * 0.38)},${fx(T.top - 4)} M${fx(T.cx)},${fx(waist)} L${fx(T.cx + T.w * 0.38)},${fx(T.top - 4)}" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`;
    }
    // ほしの ワッペン（スカートの はし）
    const patch = back ? "" : `<path d="${starPath(T.cx + hw * 0.62, waist + (hem - waist) * 0.55, 7, 3.2)}" fill="#FFE07A" ${stroke(2.2)}/>`;
    return { torso: skirt + torsoClip(ctx, inner) + patch };
  };
  Object.assign(HeadPair.KIND, { heisei_casquette: "hat" });

  // ---- フィギュアの 絵（GachaArt.FIG・へや・ラインナップ）----
  const FIG = {
    gacha_heiseibungu_0: () => svg(100, 110, stickerBook()),
    gacha_heiseibungu_1: () => svg(100, 110, canPenCase()),
    gacha_heiseibungu_2: () => svg(100, 110, profBook()),
    gacha_heiseibungu_3: () => svg(100, 110, glitterPens()),
    gacha_heiseiroom_0: () => svg(100, 110, dresser()),
    gacha_heiseiroom_1: () => svg(100, 110, heartCushion()),
    gacha_heiseiroom_2: () => svg(100, 110, beadCurtain()),
    gacha_heiseiroom_3: () => svg(100, 110, heartPhone()),
    gacha_heiseitama_0: () => svg(100, 110, eggPet("#FF9EC4", hearts("#FFFFFF"), PIX.chick)),
    gacha_heiseitama_1: () => svg(100, 110, eggPet("#8FD8F0", dots("#FFFFFF"), PIX.ghost)),
    gacha_heiseitama_2: () => svg(100, 110, eggPet("#FFE07A", stars("#FFFFFF"), PIX.cat)),
    gacha_heiseitama_3: () => svg(100, 110, eggPet("#F2C14E", sparkle(), PIX.bunny, true)),
  };
  Object.assign(GachaArt.FIG, FIG); Object.assign(A.FIG, FIG);

  // ---- シリーズ（[なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … 服）----
  const SERIES = [
    { id: "heiseibungu", ring: "2f-a", name: "へいせい ぶんぐ", kind: "furn", color: "#6E9BD8", caps: ["#AFCBF2", "#FFFFFF", "#FFC2D6"], items: [
      ["デニムの シールちょう", "デニムの ひょうしの シールちょう。ぷっくり シールが いっぱい。"],
      ["カンペンケース", "2だんの カンペンケース。ふたの うらに じかんわり。"],
      ["プロフちょう", "ハートの かぎ つきの プロフちょう。ともだちの ページが いっぱい。"],
      ["ゆめいろ ラメペン", "にじいろの ラメペン 6ぽん。カップに たてた レアの ミニチュア。"],
    ] },
    { id: "heiseiroom", ring: "2f-b", name: "へいせい おへや", kind: "furn", color: "#F48FB8", caps: ["#FFC7DD", "#FFFFFF", "#CFEFFB"], items: [
      ["ミニ ドレッサー", "たまごがたの かがみの パステルの ドレッサー。"],
      ["ハートの クッション", "ふわふわ ファーと レースの ハートの クッション。"],
      ["ビーズの のれん", "きらきら ビーズの のれん。とおると しゃらしゃら。"],
      ["ハートの でんわ", "ハートの かたちの ピンクの でんわ。くるくる コード つきの レア。"],
    ] },
    { id: "heiseitama", ring: "2f-c", name: "ぽけっと たまご", kind: "furn", color: "#7ACFB5", caps: ["#BFEBDD", "#FFFFFF", "#FFE07A"], items: [
      ["たまご ペット ピンク", "たまごがたの けいたい ペット。がめんに ひよこ。"],
      ["たまご ペット みずいろ", "たまごがたの けいたい ペット。がめんに おばけ。"],
      ["たまご ペット きいろ", "たまごがたの けいたい ペット。がめんに ねこ。"],
      ["きらきら たまご ペット", "きんいろの からに ラメが きらきら。うさぎの こが すむ レア。"],
    ] },
    { id: "heiseioshare", ring: "2f-d", name: "へいせい おしゃれ", kind: "wear", acc: true, kindText: `でるのは ふくと アクセサリー（1こで ひとり・おなじ ものは ${WearStock.CAP}こ まで）`, color: "#9C7FD6", caps: ["#D7C6EE", "#FFFFFF", "#AFCBF2"], items: [
      ["デニムの キャスケット", "ふっくら まるい デニムの ぼうし。ハートの ピン つき。", "head", "heisei_casquette", [DENIM, "#F2B04A"]],
      ["ちょうちょの いろめがね", "ちょうちょの はねの かたちの いろめがね。", "face", "heisei_butterflyshades", ["#B79BEA", "#FF9EC4"]],
      ["ビーズの チョーカー", "カラフルな ビーズと ハートの チャームの チョーカー。", "neck", "heisei_choker", ["#FF7BA8"]],
      ["デニムの ジャンスカ", "ハートの ポケットと ほしの ワッペンの レアの ジャンパースカート。", "body", "heisei_jumperskirt", [DENIM, "#F2B04A"]],
    ] },
  ].map((S) => ({ ...S, more: true, heisei: true }));
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  const index = Object.fromEntries(SERIES.map((S) => [S.id, S.index]));

  // ---- 2F の くみに たす（js/mee-rotation.js が あとで よむ）----
  for (const S of SERIES) { const R = GachaCornerMore.RINGS.find((x) => x.id === S.ring); if (R && !R.add.includes(S.id)) R.add.push(S.id); }

  return {
    SERIES, first, index, FIG, PIX,
    // PokaDebug 用
    state() { return { series: SERIES.map((S) => ({ id: S.id, index: S.index, ring: S.ring, name: S.name, items: S.list.map((it) => ({ id: it.id, name: it.name, rare: it.rare, kind: it.kind })) })) }; },
  };
})();
