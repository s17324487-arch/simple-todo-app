// ガチャガチャの ふえた 6シリーズ（UI-28。オーナーの FB 2026-10-01「ガチャガチャを2倍の規模に」「景品にはアクセサリーを追加」）の 絵。
// しくみ・画面は js/gacha.js、まえからの 6シリーズの 絵は js/gacha-art.js（ここは GachaArt.FIG に たす・WEAR に たす だけ）。
// フィギュア 12（ミニ どうぶつえん・こんがり パンやさん・ちび きょうりゅう）は 100×110 の 絵。どうぶつは Art.npcSvg、パンと きょうりゅうは ここで 描く。
// アクセサリー 12（ゆめかわ ヘアアクセ・キラキラ ネックレス・パーティー アクセ）は chara.js の hatWrap／eyeWrap／neckWrap で 3人の あたま・め・くびに あわせる。
// フィギュアの 絵には id を つかわない（おうちの もようがえ や フィギュア台では 絵を ならべて ページに いれる ため）。
const GachaArtMore = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.4) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const star = (x, y, r, fill, extra = "") => `<path d="${starPath(x, y, r, r * 0.45)}" fill="${fill}" ${extra}/>`;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMax meet" `);
  const shine = (x, y, r = 4) => star(x, y, r, "#FFF3A8", sk(1.1));
  // まち の ひとの どうぶつ（まえむき・たって いる。足もと 210）
  const NPC_VB = "0 -10 200 225";
  const animal = (spec, x, y, w, h) => nest(Art.npcSvg({ pose: "idle_01", dir: "down", ...spec }), x, y, w, h, NPC_VB);

  // ---- だい ----
  // しばふの だい（どうぶつえん）: ふちは シリーズの いろ（レアは きん）・うえは しばふ と くさ
  const lawn = (rim = "#8CC63F") => `<ellipse cx="50" cy="102" rx="42" ry="6.5" fill="#4F465622"/>`
    + `<path d="M11,95 L11,99 A39 8 0 0 0 89 99 L89,95" fill="${rim}" ${sk(2.2)}/><ellipse cx="50" cy="95" rx="39" ry="8" fill="#B8E08C" ${sk(2.2)}/>`
    + [[21, 95], [33, 100], [67, 100], [80, 94]].map(([x, y]) => `<path d="M${x - 3},${y} l1.5,-4 l1.5,4 l1.5,-4.5 l1.5,4.5" fill="none" stroke="#6FA84E" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`).join("");
  // きの トレー と しきがみ（パンやさん）: うえの だえん・まえの ふち・ふちが なみなみの かみ
  const tray = (rim = "#C98E5A") => {
    let paper = "";
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, b = ((i + 1) / 18) * Math.PI * 2, m = (a + b) / 2;
      paper += `${i ? "" : `M${f1(50 + Math.cos(a) * 32)},${f1(92 + Math.sin(a) * 5.6)} `}Q${f1(50 + Math.cos(m) * 36)},${f1(92 + Math.sin(m) * 6.6)} ${f1(50 + Math.cos(b) * 32)},${f1(92 + Math.sin(b) * 5.6)} `;
    }
    return `<ellipse cx="50" cy="103" rx="44" ry="5" fill="#4F465622"/><path d="M8,92 L8,97 A42 7.5 0 0 0 92 97 L92,92" fill="${shade(rim, -0.12)}" ${sk(2.2)}/>`
      + `<ellipse cx="50" cy="92" rx="42" ry="7.5" fill="${rim}" ${sk(2.2)}/><ellipse cx="50" cy="92" rx="37" ry="5.6" fill="${shade(rim, 0.18)}"/>`
      + `<path d="${paper}Z" fill="#FFFFFF" stroke="#E6DCCB" stroke-width="1"/>`;
  };
  // とうめいな まるい だい（きょうりゅう）と しだの は
  const disc = (rim) => `<ellipse cx="50" cy="101" rx="40" ry="7.5" fill="#4F465622"/><path d="M12,97 L12,100 A38 8 0 0 0 88 100 L88,97" fill="${rim}" ${sk(2.2)}/><ellipse cx="50" cy="97" rx="38" ry="8" fill="#FFFFFF" fill-opacity="0.8" ${sk(2.2)}/>`
    + `<path d="M${f1(50 - 38 * 0.6)},95 q${f1(38 * 0.3)} -3 ${f1(38 * 0.6)} -3" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>`;
  const fern = (x, y, flip = 1) => {
    let s = `<path d="M${x},${y} q${4 * flip},-8 ${12 * flip},-12" fill="none" stroke="#5E9E4C" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) { const t = 0.25 + i * 0.2, px = x + 12 * flip * t, py = y - 12 * t - 2 * t * (1 - t) * 4; s += `<ellipse cx="${f1(px + 2 * flip)}" cy="${f1(py - 2)}" rx="2.6" ry="1.4" transform="rotate(${-40 * flip} ${f1(px + 2 * flip)} ${f1(py - 2)})" fill="#8ED07A" stroke="#5E9E4C" stroke-width="0.8"/>`; }
    return s;
  };

  // ---- ミニ どうぶつえん ----
  // ささ（たけと はっぱ）
  const bamboo = (x, y0, y1) => {
    let s = `<path d="M${x},${y0} L${x + 2},${y1}" stroke="${K}" stroke-width="7.2" stroke-linecap="round"/><path d="M${x},${y0} L${x + 2},${y1}" stroke="#7CC36A" stroke-width="4.4" stroke-linecap="round"/>`;
    for (let k = 1; k < 4; k++) { const yy = y0 + ((y1 - y0) * k) / 4, xx = x + (2 * k) / 4; s += `<path d="M${f1(xx - 2.6)},${f1(yy)} h5.2" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>`; }
    const leaf = (lx, ly, rot) => `<path d="M${lx},${ly} c6,-4 14,-4 18,0 c-6,4 -14,4 -18,0 Z" transform="rotate(${rot} ${lx} ${ly})" fill="#9ED87F" ${sk(1.4)}/><path d="M${lx + 2},${ly} h13" transform="rotate(${rot} ${lx} ${ly})" stroke="#5E9E4C" stroke-width="0.9"/>`;
    return s + leaf(x + 2, y1 + 4, -60) + leaf(x + 2, y1 + 6, -20) + leaf(x + 1, y1 + 14, -150);
  };
  // みずしぶき（ぞうの はなの さきから うえへ）
  const splash = () => {
    const drops = [[58, 52, 3], [66, 40, 3.4], [75, 31, 3.4], [84, 26, 2.8], [91, 29, 2.2], [70, 46, 2.2], [82, 38, 2.2], [93, 40, 1.8]];
    return `<path d="M41,71 C48,60 60,40 88,28" fill="none" stroke="#9FD8F2" stroke-width="3.4" stroke-linecap="round" opacity="0.85"/>`
      + drops.map(([x, y, r]) => `<path d="M${x},${f1(y - r * 1.5)} C${f1(x + r)},${f1(y - r * 0.4)} ${f1(x + r)},${f1(y + r)} ${x},${f1(y + r)} C${f1(x - r)},${f1(y + r)} ${f1(x - r)},${f1(y - r * 0.4)} ${x},${f1(y - r * 1.5)} Z" fill="#9FD8F2" ${sk(1)}/>`).join("");
  };
  // いわ（ライオンの いわ）
  const rock = () => `<path d="M18,96 C14,86 18,76 28,72 C34,62 50,60 60,64 C72,62 84,70 84,80 C88,88 84,96 76,98 Z" fill="#B9B2AA" ${sk(2.2)}/>`
    + `<path d="M28,74 C36,68 48,68 56,70 M66,68 C74,70 80,76 80,82" fill="none" stroke="#DCD6CE" stroke-width="2.4" stroke-linecap="round"/><path d="M40,84 l6,4 M62,86 l-5,5" stroke="#8E8780" stroke-width="1.4" stroke-linecap="round"/>`;

  // ---- こんがり パンやさん ----
  // メロンパン: ドーム・あみめ（ドームの なかだけ）・おさとうの つぶ
  const melon = () => {
    const cx = 50, cy = 88, rx = 29, ry = 26, inside = (x, y) => y < cy - 1 && ((x - cx) / (rx - 1.6)) ** 2 + ((y - cy) / (ry - 1.6)) ** 2 < 1;
    let grid = "";
    for (const d of [1, -1]) for (let c = -48; c <= 48; c += 12) {
      let seg = [];
      const flush = () => { if (seg.length > 1) grid += `M${seg[0][0]},${seg[0][1]} L${seg[seg.length - 1][0]},${seg[seg.length - 1][1]} `; seg = []; };
      for (let x = 18; x <= 82; x += 0.5) { const y = cy - 14 + d * 0.8 * (x - cx) + c * 0.6; if (inside(x, y)) seg.push([f1(x), f1(y)]); else flush(); }
      flush();
    }
    return `<path d="M21,88 C21,92 79,92 79,88 C78,96 22,96 21,88 Z" fill="#E7AE5E" ${sk(2)}/>`
      + `<path d="M${cx - rx},${cy} C${cx - rx},${cy - ry * 1.3} ${cx + rx},${cy - ry * 1.3} ${cx + rx},${cy} C${cx + rx * 0.6},${cy + 4} ${cx - rx * 0.6},${cy + 4} ${cx - rx},${cy} Z" fill="#F7D98A" ${sk(2.4)}/>`
      + `<path d="${grid}" fill="none" stroke="#D9A447" stroke-width="1.5" stroke-linecap="round"/>`
      + `<path d="M30,74 C32,68 38,64 44,63" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.75"/>`
      + [[36, 80], [46, 72], [58, 70], [64, 80], [54, 84], [40, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#FFFFFF"/>`).join("");
  };
  // クロワッサン: まんなかが おおきい 5つの ふくらみ
  const croissant = () => {
    const lobe = (cx, cy, rx, ry, rot, c) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${c}" ${sk(2.2)}/>`;
    const L = "#E9A955", M = "#EFB866", T = "#F6C77A";
    return lobe(20, 86, 8, 7, -50, L) + lobe(80, 86, 8, 7, 50, L) + lobe(32, 80, 11, 11, -28, M) + lobe(68, 80, 11, 11, 28, M) + lobe(50, 76, 15, 15, 0, T)
      + `<path d="M43,64 C47,62 53,62 57,64 M28,74 C31,71 35,70 38,71 M62,71 C65,70 69,71 72,74" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`
      + `<path d="M40,86 C44,88 56,88 60,86" fill="none" stroke="#B9783A" stroke-width="1.4" stroke-linecap="round"/>`;
  };
  // しょくパン: やまの かたちの 1きん と、まえに たてた 1まい（バター つき）
  const loaf = () => `<path d="M40,90 L40,64 C40,50 52,46 60,52 C66,44 82,46 82,60 L82,90 Z" fill="#F1D6A0" ${sk(2.4)}/>`
    + `<path d="M40,64 C40,50 52,46 60,52 C66,44 82,46 82,60 C76,58 70,58 66,60 C62,58 56,58 52,60 C48,59 44,61 40,64 Z" fill="#C9813F" ${sk(2)}/>`
    + `<path d="M58,70 L58,86 M70,70 L70,86" stroke="#E3BF82" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M16,92 L16,66 C12,64 12,54 18,52 C22,48 30,48 34,52 C40,54 40,64 36,66 L36,92 Z" fill="#D99A55" ${sk(2.4)}/>`
    + `<path d="M19,89 L19,66 C16,64 16,57 20,55 C23,52 29,52 32,55 C36,57 36,64 33,66 L33,89 Z" fill="#FFF4DC"/>`
    + `<rect x="21" y="60" width="10" height="7" rx="2" fill="#FFE68A" ${sk(1.4)}/><path d="M23,62 h4" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>`
    + [[22, 74], [28, 80], [24, 84], [30, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#E9CFA0"/>`).join("");
  // パンかご（レア）: あみめの かご・ギンガムの ぬの・バゲット・まるパン・ちいさな クロワッサン
  const basket = () => {
    let weave = "";
    for (let y = 80; y <= 92; y += 4) weave += `<path d="M${f1(18 + (y - 76) * 0.35)},${y} H${f1(82 - (y - 76) * 0.35)}" stroke="#B9783A" stroke-width="1.3"/>`;
    for (let x = 22; x <= 78; x += 7) weave += `<path d="M${x},77 L${f1(50 + (x - 50) * 0.86)},95" stroke="#B9783A" stroke-width="1.1"/>`;
    let gingham = "";
    for (let i = 0; i < 4; i++) gingham += `<path d="M${36 + i * 6},76 L${40 + i * 4},90" stroke="#F28B8B" stroke-width="2.4"/>`;
    return `<ellipse cx="50" cy="102" rx="40" ry="5" fill="#4F465622"/>`
      + `<path d="M22,60 C18,52 22,40 30,36 C34,34 38,38 36,44 L34,62 Z" fill="#E3A35C" ${sk(2.2)}/><path d="M26,44 l6,3 M25,51 l6,3" stroke="#FBE3B8" stroke-width="1.8" stroke-linecap="round"/>`
      + `<path d="M28,50 L22,26 C21,20 27,18 30,23 L38,50 Z" fill="#E9B06A" ${sk(2.2)}/><path d="M24,28 l5,1 M25,35 l5,1 M27,42 l5,1" stroke="#FBE3B8" stroke-width="1.6" stroke-linecap="round"/>`
      + `<ellipse cx="52" cy="62" rx="15" ry="12" fill="#D98B45" ${sk(2.2)}/><path d="M44,56 C48,52 56,52 60,56" fill="none" stroke="#F6C77A" stroke-width="2" stroke-linecap="round"/><circle cx="52" cy="58" r="1.6" fill="#FFF4DC"/><circle cx="48" cy="61" r="1.2" fill="#FFF4DC"/><circle cx="56" cy="61" r="1.2" fill="#FFF4DC"/>`
      + `<ellipse cx="70" cy="66" rx="7" ry="6" transform="rotate(20 70 66)" fill="#EFB866" ${sk(1.8)}/><ellipse cx="78" cy="68" rx="5" ry="4.6" transform="rotate(40 78 68)" fill="#E9A955" ${sk(1.8)}/><ellipse cx="63" cy="69" rx="4.6" ry="4.2" transform="rotate(-30 63 69)" fill="#E9A955" ${sk(1.8)}/>`
      + `<path d="M16,74 L84,74 L78,96 L22,96 Z" fill="#E7B877" ${sk(2.4)}/>${weave}<path d="M16,74 L84,74" ${sk(2.4)}/>`
      + `<path d="M14,72 C30,66 70,66 86,72 C86,76 14,76 14,72 Z" fill="#D49C5C" ${sk(2)}/>`
      + `<path d="M34,73 L66,73 L58,90 L42,90 Z" fill="#FFFFFF" ${sk(1.6)}/>${gingham}<path d="M38,78 H62 M40,84 H60" stroke="#F28B8B" stroke-width="2.4" opacity="0.8"/>`
      + shine(12, 36, 4.6) + shine(88, 44, 5.4) + shine(84, 18, 3.4);
  };

  // ---- ちび きょうりゅう ----
  const eye = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K}"/><circle cx="${f1(x + r * 0.35)}" cy="${f1(y - r * 0.4)}" r="${f1(r * 0.38)}" fill="#FFFFFF"/>`;
  const blush = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" fill="#F8A5C2" opacity="0.85"/>`;
  // ティラノサウルス（みぎむき・くちを あけて がおっ）
  const trex = () => {
    const c = "#8FD27A", b = "#E6F6C4", d = shade(c, -0.18);
    return `<path d="M40,80 C30,84 16,86 8,78 C14,74 26,70 38,68 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M44,84 L42,95 L50,95 L52,86 Z M60,84 L60,95 L68,95 L68,84 Z" fill="${d}" ${sk(2.2)}/>`
      + `<path d="M34,64 C32,46 44,36 58,40 C68,42 72,52 72,64 C72,80 64,90 52,90 C40,90 34,80 34,64 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M46,58 C46,52 54,50 60,54 C66,60 64,80 54,84 C46,84 44,72 46,58 Z" fill="${b}"/>`
      + `<path d="M66,58 C70,58 73,60 74,63 M64,64 C68,64 71,66 72,69" fill="none" ${sk(2.2)}/>`
      + `<path d="M50,30 C50,16 64,8 78,10 C90,12 95,22 94,30 C88,32 80,32 74,32 C70,40 58,44 52,38 C50,36 50,33 50,30 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M74,32 C80,32 88,32 94,30 C94,38 86,44 78,42 C74,40 73,36 74,32 Z" fill="#8E4A5A" ${sk(2)}/><path d="M78,40 C82,38 87,38 90,39" fill="none" stroke="#F79BB4" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M78,32 l2,3 l2,-3 M84,32 l2,3 l2,-3" fill="#FFFFFF" stroke="${K}" stroke-width="0.9" stroke-linejoin="round"/>`
      + eye(70, 20) + blush(66, 28) + `<path d="M64,14 C67,12 71,12 74,14" fill="none" ${sk(1.8)}/>`
      + `<circle cx="42" cy="52" r="2.6" fill="${d}"/><circle cx="38" cy="60" r="2" fill="${d}"/><circle cx="56" cy="22" r="2" fill="${d}"/>`
      + `<path d="M86,14 q4 -6 2 -10 M92,20 q6 -2 6 -8" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/><path d="M86,14 q4 -6 2 -10 M92,20 q6 -2 6 -8" fill="none" stroke="${K}" stroke-width="1" stroke-linecap="round"/>`;
  };
  // トリケラトプス（ひだりむき・えりかざりと つの 3つ）
  const trike = () => {
    const c = "#F6B26B", d = shade(c, -0.18), fr = "#FFD98A";
    let dots = ""; for (let i = 0; i < 6; i++) { const a = Math.PI * (1.05 + i * 0.16); dots += `<circle cx="${f1(34 + Math.cos(a) * 16)}" cy="${f1(56 + Math.sin(a) * 16)}" r="2" fill="${d}"/>`; }
    let edge = ""; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.86 + i * 0.16); edge += `<circle cx="${f1(34 + Math.cos(a) * 21)}" cy="${f1(56 + Math.sin(a) * 21)}" r="3" fill="${fr}" ${sk(1.4)}/>`; }
    return `<path d="M80,74 C88,72 96,76 96,82 C90,84 84,82 78,80 Z" fill="${c}" ${sk(2.2)}/>`
      + `<path d="M40,84 L40,95 L48,95 L48,84 Z M54,86 L54,96 L62,96 L62,86 Z M68,84 L68,95 L76,95 L76,84 Z" fill="${d}" ${sk(2.2)}/>`
      + `<ellipse cx="60" cy="74" rx="26" ry="16" fill="${c}" ${sk(2.4)}/><path d="M44,80 C52,86 70,86 78,80" fill="none" stroke="#FFE6C2" stroke-width="3" stroke-linecap="round"/>`
      + edge + `<circle cx="34" cy="56" r="20" fill="${fr}" ${sk(2.4)}/>` + dots
      + `<path d="M12,66 C10,56 18,48 30,50 C40,52 44,62 42,70 C40,78 30,82 22,80 C14,78 12,72 12,66 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M12,66 C8,66 5,68 4,71 C8,72 12,71 14,70 Z" fill="#F4E3C3" ${sk(1.8)}/>`
      + `<path d="M22,52 L14,30 L28,50 Z M34,52 L32,28 L40,52 Z" fill="#FFF6E2" ${sk(1.8)}/><path d="M12,62 L8,54 L16,60 Z" fill="#FFF6E2" ${sk(1.4)}/>`
      + eye(24, 62) + blush(30, 70) + `<path d="M12,74 C16,77 20,77 22,75" fill="none" ${sk(1.6)}/>`;
  };
  // ステゴサウルス（みぎむき・せなかの いた・しっぽの とげ）
  const stego = () => {
    const c = "#8EC5E8", d = shade(c, -0.18), P = ["#F7A9C8", "#FFE07A"];
    const plate = (x, y, h, i) => `<path d="M${x - 6},${y} C${x - 7},${y - h * 0.6} ${x - 2},${y - h} ${x},${y - h} C${x + 2},${y - h} ${x + 7},${y - h * 0.6} ${x + 6},${y} Z" fill="${P[i % 2]}" ${sk(1.8)}/>`;
    return `<path d="M30,76 C22,74 12,72 6,64 C12,62 20,64 30,66 Z" fill="${c}" ${sk(2.2)}/><path d="M10,64 L6,54 L14,63 Z M16,66 L14,55 L20,65 Z" fill="#FFF6E2" ${sk(1.4)}/>`
      + plate(34, 62, 14, 0) + plate(44, 56, 18, 1) + plate(56, 54, 20, 0) + plate(68, 58, 16, 1) + plate(78, 64, 12, 0)
      + `<path d="M36,84 L36,95 L44,95 L44,84 Z M52,86 L52,96 L60,96 L60,86 Z M68,84 L68,95 L76,95 L76,84 Z" fill="${d}" ${sk(2.2)}/>`
      + `<path d="M26,78 C28,62 44,54 60,56 C74,58 84,66 84,76 C84,84 76,88 56,88 C36,88 26,86 26,78 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M36,82 C46,86 66,86 76,82" fill="none" stroke="#E2F2FB" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M80,72 C84,66 92,64 96,70 C98,76 94,80 88,80 C84,80 81,77 80,72 Z" fill="${c}" ${sk(2.2)}/>` + eye(90, 70, 2.6) + blush(92, 76)
      + `<circle cx="48" cy="70" r="2.2" fill="${d}"/><circle cx="62" cy="66" r="2" fill="${d}"/><circle cx="70" cy="74" r="1.8" fill="${d}"/>`;
  };
  // ブラキオサウルス（レア・みぎむき・ながい くび）
  const brachio = () => {
    const c = "#C9B6EE", d = shade(c, -0.18), b = "#EEE6FB";
    return `<path d="M30,78 C20,80 10,82 6,76 C12,72 22,70 32,70 Z" fill="${c}" ${sk(2.2)}/>`
      + `<path d="M34,82 L34,95 L42,95 L42,82 Z M64,78 L64,95 L72,95 L72,78 Z" fill="${d}" ${sk(2.2)}/>`
      + `<path d="M28,78 C28,64 40,58 56,58 C68,58 76,64 76,76 C76,86 66,90 52,90 C38,90 28,88 28,78 Z" fill="${c}" ${sk(2.4)}/>`
      + `<path d="M44,86 L44,96 L52,96 L52,86 Z M56,86 L56,96 L64,96 L64,86 Z" fill="${shade(c, -0.08)}" ${sk(2.2)}/>`
      + `<path d="M62,62 C62,44 66,26 70,16 L80,16 C80,30 76,48 74,66 Z" fill="${c}" ${sk(2.4)}/><path d="M68,58 C68,44 71,30 74,20" fill="none" stroke="${b}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M66,14 C66,6 74,2 82,4 C90,6 94,12 92,16 C90,20 82,22 74,20 C70,20 66,18 66,14 Z" fill="${c}" ${sk(2.4)}/><path d="M72,6 C74,2 80,1 84,3" fill="none" stroke="${b}" stroke-width="2" stroke-linecap="round"/>`
      + eye(82, 10, 2.6) + blush(86, 15) + `<path d="M86,18 C88,19 90,18 91,16" fill="none" ${sk(1.4)}/>`
      + `<circle cx="44" cy="68" r="2.4" fill="${d}"/><circle cx="52" cy="64" r="2" fill="${d}"/><circle cx="38" cy="74" r="1.8" fill="${d}"/>`
      + shine(14, 50, 5) + shine(30, 34, 3.6) + shine(94, 34, 4.4);
  };

  // ---- フィギュア 12しゅ（id → 100×110 の 絵）----
  const FIG = {
    gacha_zoo_0: () => svg(100, 110, lawn() + bamboo(76, 92, 36) + animal({ sp: "panda", emo: "happy" }, 14, 6, 66, 90) + `<path d="M34,80 C42,77 52,77 60,79" fill="none" stroke="${K}" stroke-width="4.2" stroke-linecap="round"/><path d="M34,80 C42,77 52,77 60,79" fill="none" stroke="#7CC36A" stroke-width="2.2" stroke-linecap="round"/>` + `<path d="M58,78 c5,-6 12,-8 17,-6 c-5,5 -12,7 -17,6 Z" fill="#9ED87F" ${sk(1.3)}/><path d="M57,80 c6,0 11,3 13,7 c-6,0 -11,-3 -13,-7 Z" fill="#9ED87F" ${sk(1.3)}/>`),
    gacha_zoo_1: () => svg(100, 110, lawn() + `<ellipse cx="30" cy="96" rx="12" ry="3.2" fill="#9FD8F2" opacity="0.8"/>` + animal({ sp: "elephant", emo: "happy" }, 6, 8, 66, 88) + splash()),
    gacha_zoo_2: () => svg(100, 110, lawn() + rock() + animal({ sp: "lion", emo: "happy", pose: "idle_02" }, 20, -4, 60, 84)),
    gacha_zoo_3: () => svg(100, 110, lawn("#F7C948") + animal({ sp: "tiger", emo: "happy", col: "#FFFFFF", col2: "#FFFFFF" }, 14, 6, 72, 90) + shine(14, 30, 5) + shine(86, 22, 6) + shine(90, 54, 3.6) + shine(18, 62, 3)),
    gacha_bakery_0: () => svg(100, 110, tray() + melon()),
    gacha_bakery_1: () => svg(100, 110, tray() + croissant()),
    gacha_bakery_2: () => svg(100, 110, tray() + loaf()),
    gacha_bakery_3: () => svg(100, 110, basket()),
    gacha_dino_0: () => svg(100, 110, disc("#6CC3B0") + fern(16, 98) + fern(84, 98, -1) + trex()),
    gacha_dino_1: () => svg(100, 110, disc("#6CC3B0") + fern(84, 98, -1) + trike()),
    gacha_dino_2: () => svg(100, 110, disc("#6CC3B0") + fern(18, 98) + stego()),
    gacha_dino_3: () => svg(100, 110, disc("#F7C948") + fern(14, 98) + fern(88, 98, -1) + brachio()),
  };
  Object.assign(GachaArt.FIG, FIG);

  // ---- アクセサリー 12しゅ（WEAR に たす）----
  // ヘアアクセ（あたま: hatWrap。あたまの うえの まんなかが 0,0・はば 100）
  const arc = (t, P) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
  const BAND = [[-48, 6], [-36, -26], [36, -26], [48, 6]];
  const band = (s, c) => `<path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${K}" stroke-width="${f1(s * 2.6)}" stroke-linecap="round"/><path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${c}" stroke-width="${f1(s * 1.2)}" stroke-linecap="round"/>`;
  WEAR.gacha_barrette = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#C9B6EE", g = ctx.col[1] || "#F7C948", d = shade(c, -0.2);
      const dots = [[-19, -4], [-12, 5], [-23, 5], [15, -5], [21, 4], [12, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#FFFFFF"/>`).join("");
      return `<g transform="translate(-32,-10) rotate(-16)"><rect x="-36" y="-3.5" width="72" height="7" rx="3.5" fill="${g}" ${stroke(s * 0.7)}/>`
        + `<path d="M-3,6 L-11,21 L-4,19 L-1,24 Z M3,6 L11,21 L4,19 L1,24 Z" fill="${d}" ${stroke(s * 0.7)}/>`
        + `<path d="M0,0 C-10,-17 -30,-15 -28,0 C-30,15 -10,17 0,0 Z" fill="${c}" ${stroke(s)}/><path d="M0,0 C10,-17 30,-15 28,0 C30,15 10,17 0,0 Z" fill="${c}" ${stroke(s)}/>${dots}`
        + `<ellipse cx="0" cy="0" rx="7" ry="8" fill="${d}" ${stroke(s)}/></g>`;
    }),
  });
  WEAR.gacha_berrytie = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FF5A6E", g = ctx.col[1] || "#7CCB6B";
      const berry = (x, y, r) => `<g transform="translate(${x},${y}) rotate(${r})"><circle cx="0" cy="-13" r="5" fill="none" stroke="${K}" stroke-width="${f1(s * 1.6)}"/><circle cx="0" cy="-13" r="5" fill="none" stroke="#FF9EC4" stroke-width="${f1(s * 0.7)}"/>`
        + `<path d="M0,-8 C-11,-10 -13,3 -7,9 C-4,13 -1,15 0,17 C1,15 4,13 7,9 C13,3 11,-10 0,-8 Z" fill="${c}" ${stroke(s)}/>`
        + [[-4, -1], [3, -3], [-1, 5], [5, 4], [-5, 7], [1, 11]].map(([px, py]) => `<ellipse cx="${px}" cy="${py}" rx="1.1" ry="1.6" fill="#FFE066"/>`).join("")
        + `<path d="M-8,-8 L-3,-6 L0,-12 L3,-6 L8,-8 L5,-3 L-5,-3 Z" fill="${g}" ${stroke(s * 0.7)}/><path d="M-4,-1 C-5,2 -4,4 -3,5" fill="none" stroke="#FFFFFF" stroke-width="${f1(s * 0.5)}" stroke-linecap="round" opacity="0.8"/></g>`;
      return berry(-36, -4, -18) + berry(36, -4, 18);
    }),
  });
  WEAR.gacha_pearlband = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#F8D2E0", p = ctx.col[1] || "#FFFFFF";
      let out = band(s, c);
      for (let i = 0; i < 9; i++) { const [x, y] = arc(0.1 + i * 0.1, BAND), r = i === 4 ? 6 : 4.4; out += `<circle cx="${f1(x)}" cy="${f1(y - 2)}" r="${r}" fill="${p}" ${stroke(s * 0.55)}/><circle cx="${f1(x - r * 0.35)}" cy="${f1(y - 2 - r * 0.35)}" r="${f1(r * 0.32)}" fill="#FFFFFF"/><path d="M${f1(x - r * 0.6)},${f1(y - 2 + r * 0.3)} a${f1(r * 0.7)} ${f1(r * 0.7)} 0 0 0 ${f1(r * 1.2)} 0" fill="none" stroke="#E6DCEB" stroke-width="${f1(s * 0.3)}"/>`; }
      return out;
    }),
  });
  WEAR.gacha_butterfly = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#9FD8F2", c2 = ctx.col[1] || "#F8A5C2", g = "#F7C948";
      const wing = (sx) => `<path d="M0,0 C${4 * sx},-22 ${26 * sx},-28 ${30 * sx},-14 C${32 * sx},-4 ${18 * sx},2 0,0 Z" fill="${c}" ${stroke(s)}/><path d="M0,0 C${14 * sx},4 ${24 * sx},10 ${20 * sx},20 C${14 * sx},26 ${4 * sx},16 0,0 Z" fill="${c2}" ${stroke(s)}/>`
        + `<circle cx="${16 * sx}" cy="-12" r="4.4" fill="#FFFFFF" fill-opacity="0.75" ${stroke(s * 0.45)}/><circle cx="${12 * sx}" cy="10" r="3" fill="${g}" ${stroke(s * 0.45)}/><circle cx="${24 * sx}" cy="-18" r="2.2" fill="${g}"/>`;
      return `<g transform="translate(30,-16) rotate(14)">${wing(-1)}${wing(1)}<ellipse cx="0" cy="2" rx="3.4" ry="12" fill="${g}" ${stroke(s * 0.8)}/>`
        + `<path d="M-1,-9 C-4,-18 -8,-22 -12,-23 M1,-9 C4,-18 8,-22 12,-23" fill="none" ${stroke(s * 0.7)}/><circle cx="-12" cy="-23" r="2.4" fill="${c2}" ${stroke(s * 0.45)}/><circle cx="12" cy="-23" r="2.4" fill="${c2}" ${stroke(s * 0.45)}/></g>`
        + star(56, -32, 6, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.4)}"`) + star(8, -40, 4, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.35)}"`);
    }),
  });
  // ネックレス（くび: neckWrap。くびの まんなかが 0,0・はば 100）。うしろすがたでは みえない（まえの かざり）
  const chain = (s, c, dash = true) => `<path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="${K}" stroke-width="${f1(s * 1.1)}" stroke-linecap="round"/><path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="${c}" stroke-width="${f1(s * 0.5)}" ${dash ? `stroke-dasharray="${f1(s * 0.6)} ${f1(s * 0.5)}"` : ""} stroke-linecap="round"/>`;
  const front = (fn) => (ctx) => (ctx.view === "back" ? {} : { top: neckWrap(ctx, (s) => fn(ctx, s)) });
  WEAR.gacha_clover = front((ctx, s) => {
    const c = ctx.col[0] || "#7CCB6B", m = ctx.col[1] || "#D9DEE8";
    let leaves = "";
    for (const r of [0, 90, 180, 270]) leaves += `<path d="${heartPath(0, -7, 0.95)}" transform="rotate(${r} 0 0)" fill="${c}" ${stroke(s * 0.55)}/>`;
    return chain(s, m) + `<circle cx="0" cy="19" r="2.6" fill="${m}" ${stroke(s * 0.4)}/><g transform="translate(0,32)">${leaves}<path d="M0,0 C2,6 5,10 9,12" fill="none" stroke="#4E8B3E" stroke-width="${f1(s * 0.5)}" stroke-linecap="round"/><circle cx="-4" cy="-10" r="1.6" fill="#FFFFFF" opacity="0.85"/></g>`;
  });
  WEAR.gacha_locket = front((ctx, s) => {
    const g = ctx.col[0] || "#F7C948", p = ctx.col[1] || "#FF7BA8";
    return chain(s, g) + `<circle cx="0" cy="19" r="3" fill="${g}" ${stroke(s * 0.45)}/><path d="${heartPath(0, 30, 2.1)}" fill="${g}" ${stroke(s * 0.7)}/><path d="${heartPath(0, 30, 1.25)}" fill="${p}" ${stroke(s * 0.4)}/>`
      + `<path d="M0,25 L0,41" stroke="${shade(g, -0.3)}" stroke-width="${f1(s * 0.3)}"/><circle cx="-3" cy="28" r="1.5" fill="#FFFFFF"/>`;
  });
  WEAR.gacha_pearls = front((ctx, s) => {
    const p = ctx.col[0] || "#FFFFFF", e = ctx.col[1] || "#F2E6D9", P = [[-42, 0], [-30, 26], [30, 26], [42, 0]];
    let out = "";
    for (let i = 0; i <= 12; i++) { const [x, y] = arc(i / 12, P), r = i === 6 ? 5.6 : 4; out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${p}" ${stroke(s * 0.5)}/><circle cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.35)}" r="${f1(r * 0.32)}" fill="#FFFFFF"/><path d="M${f1(x - r * 0.6)},${f1(y + r * 0.3)} a${f1(r * 0.7)} ${f1(r * 0.7)} 0 0 0 ${f1(r * 1.2)} 0" fill="none" stroke="${e}" stroke-width="${f1(s * 0.3)}"/>`; }
    return out;
  });
  WEAR.gacha_shootingstar = front((ctx, s) => {
    const c = ctx.col[0] || "#FFE066", t = ctx.col[1] || "#B79BEA";
    return chain(s, "#F7C948") + `<circle cx="0" cy="19" r="2.6" fill="#F7C948" ${stroke(s * 0.4)}/>`
      + `<path d="M-2,26 C-12,22 -22,22 -30,16" fill="none" stroke="${K}" stroke-width="${f1(s * 1.6)}" stroke-linecap="round"/><path d="M-2,26 C-12,22 -22,22 -30,16" fill="none" stroke="${t}" stroke-width="${f1(s * 0.9)}" stroke-linecap="round"/>`
      + `<path d="M-2,32 C-12,30 -20,30 -26,26" fill="none" stroke="${K}" stroke-width="${f1(s * 1.3)}" stroke-linecap="round"/><path d="M-2,32 C-12,30 -20,30 -26,26" fill="none" stroke="#9FD8F2" stroke-width="${f1(s * 0.65)}" stroke-linecap="round"/>`
      + `<path d="${starPath(4, 30, 11, 5)}" fill="${c}" ${stroke(s * 0.7)}/><circle cx="1" cy="27" r="1.8" fill="#FFFFFF"/>`
      + star(-30, 30, 3, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.3)}"`) + star(16, 18, 2.6, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.3)}"`);
  });
  // パーティー アクセ（め・ほっぺ・くび・あたま）
  WEAR.gacha_roundshades = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FF9EC4", g = ctx.col[1] || "#F7C948";
      return [-21, 21].map((x) => `<circle cx="${x}" cy="0" r="15" fill="${c}" fill-opacity="0.62" ${stroke(s)}/><circle cx="${x}" cy="0" r="15" fill="none" stroke="${g}" stroke-width="${f1(s * 0.42)}"/><path d="M${x - 9},-5 a10 10 0 0 1 7 -6" fill="none" stroke="#FFFFFF" stroke-width="${f1(s * 0.6)}" stroke-linecap="round"/>`).join("")
        + `<path d="M-6,-4 C-3,-8 3,-8 6,-4" fill="none" ${stroke(s)}/><path d="M-6,-4 C-3,-8 3,-8 6,-4" fill="none" stroke="${g}" stroke-width="${f1(s * 0.42)}"/>`;
    }),
  });
  WEAR.gacha_starsticker = (ctx) => {
    if (ctx.view === "back") return {};
    const ch = ctx.a.cheek, dx = ctx.view === "side" ? ctx.dx : 0, c = ctx.col[0] || "#FFD84D", p = ctx.col[1] || "#FF7BA8";
    const x = ctx.a.eyes.x + ch.gap / 2 + dx + 4, y = ch.y - 4;
    return { top: star(x, y, 7, c, sk(1.6)) + star(x + 10, y - 9, 4, p, sk(1.2)) + star(x - 7, y + 8, 3, "#9FD8F2", sk(1)) + `<circle cx="${f1(x + 11)}" cy="${f1(y + 4)}" r="1.4" fill="#FFFFFF" stroke="${K}" stroke-width="0.7"/>` };
  };
  WEAR.gacha_dotbow = front((ctx, s) => {
    const c = ctx.col[0] || "#E8434F", w = ctx.col[1] || "#FFFFFF";
    const dots = [[-22, -4], [-14, 6], [-26, 6], [22, -4], [14, 6], [26, 6], [-18, -10], [18, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y + 4}" r="2.4" fill="${w}"/>`).join("");
    return `<path d="M0,4 L-28,-10 C-34,-6 -34,14 -28,18 Z" fill="${c}" ${stroke(s)}/><path d="M0,4 L28,-10 C34,-6 34,14 28,18 Z" fill="${c}" ${stroke(s)}/>${dots}<rect x="-7" y="-3" width="14" height="14" rx="4" fill="${shade(c, -0.15)}" ${stroke(s)}/>`;
  });
  WEAR.gacha_boppers = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#B79BEA", g = ctx.col[1] || "#FFD84D";
      const spring = (x0, x1) => { let d = `M${x0},-18`; for (let i = 1; i <= 8; i++) { const t = i / 8, x = x0 + (x1 - x0) * t, y = -18 - 36 * t; d += ` L${f1(x + (i % 2 ? 4 : -4))},${f1(y)}`; } return `<path d="${d}" fill="none" stroke="${K}" stroke-width="${f1(s * 0.75)}" stroke-linejoin="round" stroke-linecap="round"/>`; };
      return band(s, c) + spring(-22, -30) + spring(22, 30)
        + `<path d="${starPath(-30, -60, 13, 6)}" fill="${g}" ${stroke(s * 0.8)}/><path d="${starPath(30, -60, 13, 6)}" fill="#FF9EC4" ${stroke(s * 0.8)}/>`
        + `<circle cx="-33" cy="-63" r="2" fill="#FFFFFF"/><circle cx="27" cy="-63" r="2" fill="#FFFFFF"/>` + star(0, -46, 4, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.35)}"`);
    }),
  });

  return { FIG, lawn, tray, disc, NPC_VB };
})();
