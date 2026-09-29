// クレーンゲームの 絵（景品の おもて・うら・よこ、台の かべ・ゆか、とうめいの ガード）。
// SVG は SvgCache で canvas に する（キーは この ファイルの TEX の なまえ × きまった 大きさ だけ）。うごく ぶぶんは crane-scene.js が canvas で 描く。
const CraneArt = (() => {
  const K = INK;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const f1 = (v) => Math.round(v * 10) / 10;
  // ふっくら した 星（辺が すこし ふくらむ）
  const puffyStar = (cx, cy, R, r, puff = 0.1) => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < 10; i++) {
      const a = pts[i], b = pts[(i + 1) % 10], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = mx - cx, ny = my - cy, l = Math.hypot(nx, ny) || 1, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      d += ` Q${f1(mx + (nx / l) * len * puff)} ${f1(my + (ny / l) * len * puff)} ${f1(b[0])} ${f1(b[1])}`;
    }
    return d + "Z";
  };
  const heart = (x, y, s, c) => `<path d="M${x} ${y + s * 0.9} C${x - s * 1.3} ${y} ${x - s * 0.9} ${y - s * 0.9} ${x} ${y - s * 0.25} C${x + s * 0.9} ${y - s * 0.9} ${x + s * 1.3} ${y} ${x} ${y + s * 0.9}Z" fill="${c}"/>`;
  const star5 = (x, y, R, c, extra = "") => `<path d="${starPath(x, y, R, R * 0.45)}" fill="${c}" ${extra}/>`;
  const moon = (x, y, r, c) => `<path d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.78} ${r * 0.78} 0 1 1 ${x} ${y - r}Z" fill="${c}"/>`;
  const txt = (x, y, s, t, c = K, w = 900, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" fill="${c}" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" ${extra}>${t}</text>`;
  const cookieDots = (cx, cy, r) => [[-0.45, -0.3], [0.2, -0.5], [0.5, 0.05], [-0.05, 0.05], [-0.45, 0.35], [0.25, 0.45]].map(([u, v]) => `<circle cx="${f1(cx + u * r)}" cy="${f1(cy + v * r)}" r="${f1(r * 0.13)}" fill="#6E4B3D"/>`).join("");

  // ---- ぬいぐるみ（キャラの 絵を そのまま つかう。タグ・ぬいめ つき）----
  const CROP = { wanko: [12, 22, 186, 192], gachan: [40, 42, 120, 172], goji: [10, 28, 192, 186] };
  const plush = (id, dir) => {
    const [x, y, w, h] = CROP[id];
    let s = Chara.svg(id, { pose: "idle_01", dir, face: dir === "down" ? "happy" : "normal", color: "soft" });
    s = s.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/ width="\d+" height="\d+"/, "");
    const tx = dir === "down" ? x + w * 0.8 : x + w * 0.2, ty = y + h * 0.8;
    const tag = `<g transform="translate(${f1(tx)} ${f1(ty)}) rotate(${dir === "down" ? 14 : -14})"><rect x="-10" y="-7" width="20" height="15" rx="2.5" fill="#FFFDF5" stroke="${K}" stroke-width="2.4"/>${heart(0, 0.8, 4.4, "#F09AB4")}</g>`;
    // ほっぺの つや（ぬのの ふんわり かん）
    const sheen = `<ellipse cx="${f1(x + w * 0.36)}" cy="${f1(y + h * 0.3)}" rx="${f1(w * 0.14)}" ry="${f1(h * 0.07)}" fill="#FFFFFF" opacity="0.28" transform="rotate(-24 ${f1(x + w * 0.36)} ${f1(y + h * 0.3)})"/>`;
    return s.replace("</svg>", sheen + tag + "</svg>");
  };

  // ---- テクスチャ ----
  const TEX = {
    // ほしの クッション（ソファの 星と おなじ 色）
    "star-front": () => svg(200, 200, `<path d="${puffyStar(100, 106, 92, 52)}" fill="#F4D57E" stroke="${K}" stroke-width="7" stroke-linejoin="round"/>
      <path d="${puffyStar(100, 106, 58, 33)}" fill="#CDBCE6" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${puffyStar(100, 106, 78, 44)}" fill="none" stroke="#FFF6D6" stroke-width="3.2" stroke-dasharray="7 7" stroke-linecap="round"/>
      <ellipse cx="62" cy="62" rx="18" ry="8" fill="#FFFFFF" opacity="0.45" transform="rotate(-38 62 62)"/>
      <ellipse cx="84" cy="104" rx="6.5" ry="8.5" fill="${K}"/><ellipse cx="116" cy="104" rx="6.5" ry="8.5" fill="${K}"/>
      <circle cx="86" cy="100" r="2.4" fill="#FFF"/><circle cx="118" cy="100" r="2.4" fill="#FFF"/>
      <ellipse cx="72" cy="120" rx="8" ry="5" fill="#F29BB2" opacity="0.75"/><ellipse cx="128" cy="120" rx="8" ry="5" fill="#F29BB2" opacity="0.75"/>
      <path d="M92 120 Q100 129 108 120" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`),
    "star-back": () => svg(200, 200, `<path d="${puffyStar(100, 106, 92, 52)}" fill="#EFC96B" stroke="${K}" stroke-width="7" stroke-linejoin="round"/>
      <path d="${puffyStar(100, 106, 78, 44)}" fill="none" stroke="#FFF1C2" stroke-width="3.2" stroke-dasharray="7 7" stroke-linecap="round"/>
      <path d="M100 30 V180" stroke="#D9AE52" stroke-width="3" stroke-dasharray="5 6"/>
      <g transform="translate(128 146) rotate(18)"><rect x="-13" y="-9" width="26" height="19" rx="3" fill="#FFFDF5" stroke="${K}" stroke-width="3"/>${heart(0, 1, 5.5, "#F09AB4")}</g>`),
    // よこの そう（ふちどり なし＝かさねると なめらかな あつみ）と いちばん うしろの ふちどり
    "star-side": () => svg(200, 200, `<path d="${puffyStar(100, 106, 92, 52)}" fill="#D9B45E" stroke="#D9B45E" stroke-width="7" stroke-linejoin="round"/>`),
    "star-rim": () => svg(200, 200, `<path d="${puffyStar(100, 106, 92, 52)}" fill="#C79E48" stroke="${K}" stroke-width="9" stroke-linejoin="round"/>`),
    // キャラの ぬいぐるみ
    "goji-front": () => plush("goji", "down"), "goji-back": () => plush("goji", "up"),
    "wanko-front": () => plush("wanko", "down"), "wanko-back": () => plush("wanko", "up"),
    "gachan-front": () => plush("gachan", "down"), "gachan-back": () => plush("gachan", "up"),
    // メリーゴーランドの はこ（16×20×16）
    "carousel-front": () => svg(160, 200, `<rect x="2" y="2" width="156" height="196" rx="6" fill="#F2B6C9" stroke="${K}" stroke-width="4"/>
      <rect x="10" y="10" width="140" height="42" rx="8" fill="#CDBCE6" stroke="${K}" stroke-width="3"/>
      ${txt(80, 29, 15, "ゆめいろ")}${txt(80, 46, 14, "メリーゴーランド")}
      <rect x="14" y="58" width="132" height="110" rx="10" fill="#DCEFF5" stroke="${K}" stroke-width="3.5"/>
      <path d="M14 140 Q80 124 146 140 V158 Q146 168 136 168 H24 Q14 168 14 158Z" fill="#F7E7B8"/>
      <image href="${U.svgUrl(Art.furnSvg("ike_prize_2"))}" x="26" y="62" width="108" height="104"/>
      <path d="M22 66 L44 64 L28 96Z" fill="#FFFFFF" opacity="0.55"/>
      ${star5(24, 184, 7, "#FFE7A0", `stroke="${K}" stroke-width="2"`)}${star5(136, 184, 7, "#FFE7A0", `stroke="${K}" stroke-width="2"`)}${txt(80, 189, 11, "ひかる・まわる", "#7B4D66", 800)}`),
    "carousel-side": () => svg(160, 200, `<rect x="2" y="2" width="156" height="196" rx="6" fill="#CDBCE6" stroke="${K}" stroke-width="4"/>
      ${[[30, 30], [120, 44], [70, 80], [26, 130], [128, 150], [80, 176]].map(([x, y], i) => star5(x, y, 9 + (i % 2) * 3, ["#FFE7A0", "#F6C3D4", "#FFFFFF"][i % 3])).join("")}
      <path d="M52 110 q10-26 34-20 q12 4 18 -6 l6 8 q-6 10 -2 20 l-8 26 h-8 l4-20 q-14 4 -26 0 l-6 20 h-8 l6 -24 q-10 -2 -10 -4z" fill="#FFFFFF" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M86 70 V96" stroke="#E0A93E" stroke-width="4"/>`),
    "carousel-top": () => svg(160, 160, `<rect x="2" y="2" width="156" height="156" rx="6" fill="#F2B6C9" stroke="${K}" stroke-width="4"/>
      <path d="M2 40 H158 M2 120 H158" stroke="#FFFFFF" stroke-width="10" opacity="0.6"/><rect x="55" y="70" width="50" height="20" rx="10" fill="#9C6E86" stroke="${K}" stroke-width="3"/>`),
    "carousel-back": () => svg(160, 200, `<rect x="2" y="2" width="156" height="196" rx="6" fill="#F2B6C9" stroke="${K}" stroke-width="4"/>
      ${txt(80, 60, 16, "ゆめいろ")}<rect x="40" y="140" width="80" height="34" rx="3" fill="#FFFFFF" stroke="${K}" stroke-width="2.5"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${46 + i * 5}" y="146" width="${i % 3 ? 2 : 3}" height="22" fill="${K}"/>`).join("")}`),
    // クッキーの はこ（17×8×11）
    "cookie-front": () => svg(170, 80, `<rect x="2" y="2" width="166" height="76" rx="5" fill="#F6E3C0" stroke="${K}" stroke-width="4"/>
      <rect x="2" y="54" width="166" height="12" fill="#B9825A"/><circle cx="26" cy="36" r="17" fill="#D9A86E" stroke="${K}" stroke-width="3"/>${cookieDots(26, 36, 17)}
      <circle cx="144" cy="36" r="17" fill="#D9A86E" stroke="${K}" stroke-width="3"/>${cookieDots(144, 36, 17)}${txt(85, 44, 22, "まむまむ", "#7A4B2F")}`),
    "cookie-top": () => svg(170, 110, `<rect x="2" y="2" width="166" height="106" rx="6" fill="#A8BDD2" stroke="${K}" stroke-width="4"/>
      <path d="M2 16 H168 M2 94 H168" stroke="#F5E5C1" stroke-width="9"/>
      <circle cx="58" cy="56" r="30" fill="#D9A86E" stroke="${K}" stroke-width="3.5"/>${cookieDots(58, 56, 30)}
      <circle cx="96" cy="64" r="22" fill="#C9955C" stroke="${K}" stroke-width="3"/>${cookieDots(96, 64, 22)}
      ${txt(132, 52, 13, "かんとりー", "#FFFFFF", 900, `stroke="${K}" stroke-width="0.6"`)}${txt(132, 70, 15, "まむまむ", "#FFFFFF", 900, `stroke="${K}" stroke-width="0.6"`)}${txt(132, 86, 10, "12まい", "#3E4F63", 800)}`),
    "cookie-side": () => svg(110, 80, `<rect x="2" y="2" width="106" height="76" rx="5" fill="#F6E3C0" stroke="${K}" stroke-width="4"/>${[16, 40, 64, 88].map((x) => `<rect x="${x}" y="2" width="10" height="76" fill="#E7C79A"/>`).join("")}<rect x="2" y="54" width="106" height="12" fill="#B9825A"/>`),
    // ぱいのみんの はこ（9.5×3×7.5）
    "pie-top": () => svg(190, 150, `<rect x="3" y="3" width="184" height="144" rx="8" fill="#BD818C" stroke="${K}" stroke-width="5"/>
      <path d="M3 22 L40 46 H187 M40 46 V147" fill="none" stroke="${K}" stroke-width="4"/><path d="M58 90 L100 72 L144 102 L128 134 L68 128Z" fill="#EAC386" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 98 L100 86 L128 106 L118 122 L80 118Z" fill="#916A55"/><path d="M58 32 H150" stroke="#FFF0BC" stroke-width="7" stroke-linecap="round"/>${txt(112, 66, 20, "ぱいのみん", "#FFF6DD")}`),
    "pie-side": () => svg(190, 60, `<rect x="3" y="3" width="184" height="54" rx="5" fill="#A96E79" stroke="${K}" stroke-width="5"/><path d="M3 30 H187" stroke="#FFF0BC" stroke-width="6"/>`),
    // うまーぼう（13.2×2.7 の ふくろ）
    "uma-wrap": () => svg(264, 54, `<path d="M8 4 H256 L262 12 L256 20 L262 28 L256 36 L262 44 L256 50 H8 L2 44 L8 36 L2 28 L8 20 L2 12Z" fill="#F3D181" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="30" y="4" width="16" height="46" fill="#DE8D85"/><rect x="218" y="4" width="16" height="46" fill="#DE8D85"/>
      <ellipse cx="132" cy="27" rx="30" ry="19" fill="#E4BA75" stroke="${K}" stroke-width="3"/><circle cx="122" cy="24" r="3.4" fill="${K}"/><circle cx="142" cy="24" r="3.4" fill="${K}"/>
      <path d="M124 33 Q132 40 140 33" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>${txt(80, 33, 15, "うまー", "#B5553F")}${txt(186, 33, 15, "ぼう", "#B5553F")}
      <path d="M10 10 H254" stroke="#FFFFFF" stroke-width="3" opacity="0.5"/>`),

    // ---- かべ（くりかえしの もよう。200×200）----
    "wall-star": () => svg(200, 200, `<rect width="200" height="200" fill="#F4CFE2"/><rect width="200" height="200" fill="#E7B8D9" opacity="0.35"/>
      ${heart(30, 34, 11, "#F7A9C8")}${star5(96, 26, 12, "#FFE7A0")}${moon(160, 40, 15, "#D7C6F2")}${heart(160, 128, 10, "#FFFFFF")}${star5(40, 120, 14, "#D7C6F2")}${moon(104, 104, 12, "#FFE7A0")}${heart(96, 172, 12, "#F7A9C8")}${star5(172, 186, 9, "#FFE7A0")}${star5(14, 186, 8, "#FFFFFF")}
      ${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i * 53) % 200}" cy="${(i * 97 + 30) % 200}" r="2.4" fill="#FFFFFF" opacity="0.8"/>`).join("")}`),
    "wall-goji": () => svg(200, 200, `<rect width="200" height="200" fill="#CFE3F2"/><path d="M0 150 H14 V104 H34 V124 H50 V86 H72 V132 H88 V110 H110 V70 H128 V118 H146 V96 H166 V130 H184 V112 H200 V200 H0Z" fill="#AFC8DD"/>
      ${[20, 60, 116, 150].map((x, i) => `<rect x="${x}" y="${120 + (i % 2) * 8}" width="6" height="8" fill="#FFF6CF"/>`).join("")}<ellipse cx="48" cy="40" rx="26" ry="11" fill="#FFFFFF"/><ellipse cx="150" cy="54" rx="22" ry="9" fill="#FFFFFF"/>${txt(100, 30, 18, "がおー", "#8FA9C2")}`),
    "wall-candy": () => svg(200, 200, `<rect width="200" height="200" fill="#FFF3F6"/>${[0, 50, 100, 150].map((x) => `<rect x="${x}" width="25" height="200" fill="#F8C8D8"/>`).join("")}
      ${[[40, 50, "#9ED3C6"], [140, 70, "#FFD98A"], [90, 150, "#C9B6EE"], [170, 170, "#9ED3C6"]].map(([x, y, c]) => `<g transform="translate(${x} ${y}) rotate(-20)"><path d="M-22 -8 L-12 0 L-22 8Z M22 -8 L12 0 L22 8Z" fill="${c}" stroke="${K}" stroke-width="2"/><ellipse rx="13" ry="9" fill="${c}" stroke="${K}" stroke-width="2.4"/><path d="M-6 -7 Q0 0 -6 7 M4 -8 Q10 0 4 8" stroke="#FFFFFF" stroke-width="2.4" fill="none"/></g>`).join("")}`),
    "wall-pie": () => svg(200, 200, `<rect width="200" height="200" fill="#FFF6E2"/>${[0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].map((j) => (i + j) % 2 ? `<rect x="${i * 50}" y="${j * 50}" width="50" height="50" fill="#CFEADF"/>` : "")).join("")}
      ${[[50, 50], [150, 150]].map(([x, y]) => `<path d="M${x - 16} ${y + 8} L${x} ${y - 12} L${x + 16} ${y + 8}Z" fill="#EAC386" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 9} ${y + 3} L${x} ${y - 6} L${x + 9} ${y + 3}Z" fill="#916A55"/>`).join("")}`),
    "wall-circus": () => svg(200, 200, `<rect width="200" height="200" fill="#FFFFFF"/>${[0, 40, 80, 120, 160].map((x) => `<rect x="${x}" width="20" height="200" fill="#F29C9C"/>`).join("")}<rect width="200" height="200" fill="#FFF3D6" opacity="0.25"/>
      ${[[30, 40], [110, 90], [170, 30], [60, 160], [150, 170]].map(([x, y], i) => star5(x, y, 9, i % 2 ? "#FFE07A" : "#9FD3F0", `stroke="${K}" stroke-width="1.6"`)).join("")}`),
    "wall-wanko": () => svg(200, 200, `<rect width="200" height="200" fill="#FFF4D2"/>${[[36, 40, -20], [140, 60, 15], [80, 130, 5], [170, 170, -30], [20, 180, 25]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="#E8CFA0"><ellipse rx="10" ry="8" cy="4"/><circle cx="-11" cy="-8" r="4.4"/><circle cx="-4" cy="-13" r="4.4"/><circle cx="4" cy="-13" r="4.4"/><circle cx="11" cy="-8" r="4.4"/></g>`).join("")}
      ${[[100, 30], [60, 88], [150, 120]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(-30)"><rect x="-12" y="-3.5" width="24" height="7" rx="3" fill="#FFFFFF" stroke="#D6B98A" stroke-width="2"/><circle cx="-12" cy="-4" r="4.4" fill="#FFFFFF" stroke="#D6B98A" stroke-width="2"/><circle cx="-12" cy="4" r="4.4" fill="#FFFFFF" stroke="#D6B98A" stroke-width="2"/><circle cx="12" cy="-4" r="4.4" fill="#FFFFFF" stroke="#D6B98A" stroke-width="2"/><circle cx="12" cy="4" r="4.4" fill="#FFFFFF" stroke="#D6B98A" stroke-width="2"/></g>`).join("")}`),
    "wall-chick": () => svg(200, 200, `<rect width="200" height="200" fill="#E3F2D6"/>${[[40, 44], [150, 70], [96, 150], [180, 180], [10, 150]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="${i % 2 ? "#FFFFFF" : "#FFF0B8"}" stroke="#C9D9A8" stroke-width="2"/>`).join("")}
      ${[[100, 40], [40, 110], [160, 130]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="5" ry="9" cy="-9" fill="#FFFFFF" transform="rotate(${a})"/>`).join("")}<circle r="5" fill="#FFD66B"/></g>`).join("")}`),
    "wall-cookie": () => svg(200, 200, `<rect width="200" height="200" fill="#FFF1DF"/>${[0, 50, 100, 150].map((x) => `<rect x="${x}" width="25" height="200" fill="#F6C99A" opacity="0.55"/><rect y="${x}" width="200" height="25" fill="#F6C99A" opacity="0.55"/>`).join("")}
      ${[[50, 50], [150, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#D9A86E" stroke="${K}" stroke-width="2.4"/>${cookieDots(x, y, 15)}`).join("")}`),

    // ---- ゆか ----
    "floor-mat": () => svg(200, 200, `<rect width="200" height="200" fill="#8C77B3"/>${Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => `<path d="M${i * 40 + 20} ${j * 40 + 6} L${i * 40 + 34} ${j * 40 + 20} L${i * 40 + 20} ${j * 40 + 34} L${i * 40 + 6} ${j * 40 + 20}Z" fill="#9A86C0"/>`).join("")).join("")}<rect width="200" height="200" fill="none" stroke="#7B67A3" stroke-width="3"/>`),
    "floor-goji": () => svg(200, 200, `<rect width="200" height="200" fill="#7FA4B8"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${(i % 5) * 40 + (Math.floor(i / 5) % 2) * 20}" y="${Math.floor(i / 5) * 100 + 20}" width="16" height="60" rx="8" fill="#8BB0C3"/>`).join("")}`),
    "floor-chick": () => svg(200, 200, `<rect width="200" height="200" fill="#A7C98F"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${(i * 47) % 200} ${(i * 71) % 200} l3 -8 l3 8" stroke="#8FB478" stroke-width="2.4" fill="none"/>`).join("")}`),
    "floor-cookie": () => svg(200, 200, `<rect width="200" height="200" fill="#C99B76"/>${[0, 40, 80, 120, 160].map((y) => `<rect y="${y}" width="200" height="20" fill="#BD8E69"/>`).join("")}`),
    "floor-tri": () => svg(200, 200, `<rect width="200" height="200" fill="#B9C6D8"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 20} 0 V200" stroke="#C7D3E3" stroke-width="3"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 20} H200" stroke="#AEBBCE" stroke-width="1.5"/>`).join("")}`),
    "floor-sweet": () => svg(200, 200, `<rect width="200" height="200" fill="#F7D9E4"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${(i * 67) % 200}" cy="${(i * 43) % 200}" r="6" fill="${["#FFFFFF", "#FBE7A1", "#C8E8DD"][i % 3]}"/>`).join("")}`),
  };
  // テクスチャの 大きさ（端末の こまかさで 2だん）
  const SIZE = {
    "star-front": [256, 256], "star-back": [256, 256], "star-side": [128, 128], "star-rim": [128, 128],
    "goji-front": [256, 248], "goji-back": [256, 248], "wanko-front": [248, 256], "wanko-back": [248, 256], "gachan-front": [180, 256], "gachan-back": [180, 256],
    "carousel-front": [192, 240], "carousel-side": [160, 200], "carousel-top": [160, 160], "carousel-back": [160, 200],
    "cookie-front": [204, 96], "cookie-top": [204, 132], "cookie-side": [132, 96], "pie-top": [152, 120], "pie-side": [152, 48], "uma-wrap": [264, 54],
  };
  const tex = (key) => { if (!TEX[key]) return null; const [w, h] = SIZE[key] || [256, 256]; return SvgCache.get("crane:" + key, TEX[key], w, h); };
  const ensureAll = (keys) => Promise.all(keys.filter((k) => TEX[k]).map((k) => { const [w, h] = SIZE[k] || [256, 256]; return SvgCache.ensure("crane:" + k, TEX[k], w, h); }));
  // 台ごとの かべ・ゆか・色
  const THEME = {
    star: { wall: "wall-star", floor: "floor-mat", body: "#E98DB5", body2: "#B77AC7", trim: "#FFE7A0", glow: "#FFB6D9", head: "#9ED36A", sign: "ほしの ソファ" },
    goji: { wall: "wall-goji", floor: "floor-goji", body: "#7FA7D9", body2: "#5F86BD", trim: "#FFE08A", glow: "#BFE3FF", head: "#8E8A88", sign: "ごじの ぬいぐるみ" },
    candy: { wall: "wall-candy", floor: "floor-sweet", body: "#F2A7C0", body2: "#E58BAA", trim: "#FFFFFF", glow: "#FFD1E2", head: "#FFFFFF", sign: "スウィートランド" },
    pie: { wall: "wall-pie", floor: "floor-sweet", body: "#86CDB6", body2: "#5DB29B", trim: "#FFF1C8", glow: "#C9F2E4", head: "#FFFFFF", sign: "スウィートランド" },
    circus: { wall: "wall-circus", floor: "floor-tri", body: "#E86F6F", body2: "#C95656", trim: "#FFE07A", glow: "#FFC4A8", head: "#FFE07A", sign: "トライポッド" },
    wanko: { wall: "wall-wanko", floor: "floor-tri", body: "#F1C565", body2: "#D9A845", trim: "#FFFFFF", glow: "#FFE9B0", head: "#FFFFFF", sign: "トライポッド" },
    chick: { wall: "wall-chick", floor: "floor-chick", body: "#8CCB7E", body2: "#6BAE5F", trim: "#FFF0A8", glow: "#D9F5C9", head: "#F9D56E", sign: "リングフック" },
    cookie: { wall: "wall-cookie", floor: "floor-cookie", body: "#D9A06A", body2: "#B97F4B", trim: "#FFF1D6", glow: "#FFE2C0", head: "#F6E3C0", sign: "リングフック" },
  };
  // ---- canvas の たすけ ----
  // 3つの 点（左上・右上・左下）に 画像を はる（アフィン）
  const quad = (ctx, img, p0, p1, p2, alpha = 1) => {
    if (!img) return;
    const w = img.width, h = img.height;
    ctx.save(); if (alpha !== 1) ctx.globalAlpha *= alpha;
    ctx.transform((p1[0] - p0[0]) / w, (p1[1] - p0[1]) / w, (p2[0] - p0[0]) / h, (p2[1] - p0[1]) / h, p0[0], p0[1]);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };
  // 金ぞくの ぼう（こい → あかるい → こい）
  const rod = (ctx, a, b, w, col = ["#5E6670", "#DDE3EA", "#8A939E"]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    ctx.lineCap = "round";
    ctx.strokeStyle = K; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = col[0]; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = col[2]; ctx.lineWidth = w * 0.62; ctx.beginPath(); ctx.moveTo(a[0] - nx * w * 0.12, a[1] - ny * w * 0.12); ctx.lineTo(b[0] - nx * w * 0.12, b[1] - ny * w * 0.12); ctx.stroke();
    ctx.strokeStyle = col[1]; ctx.lineWidth = Math.max(1, w * 0.24); ctx.beginPath(); ctx.moveTo(a[0] - nx * w * 0.2, a[1] - ny * w * 0.2); ctx.lineTo(b[0] - nx * w * 0.2, b[1] - ny * w * 0.2); ctx.stroke();
  };
  // ひらたい 金ぞくの いた（アーム）: はしは まるく、まんなかが あかるい
  const plate = (ctx, a, b, w, col = ["#6B737E", "#F1F4F8", "#9AA3AE"]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
    const g = ctx.createLinearGradient(a[0] - nx, a[1] - ny, a[0] + nx, a[1] + ny); g.addColorStop(0, col[0]); g.addColorStop(0.45, col[1]); g.addColorStop(1, col[2]);
    ctx.beginPath(); ctx.moveTo(a[0] + nx, a[1] + ny); ctx.lineTo(b[0] + nx, b[1] + ny); ctx.arc(b[0], b[1], w / 2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), dx * ny - dy * nx > 0); ctx.lineTo(a[0] - nx, a[1] - ny); ctx.arc(a[0], a[1], w / 2, Math.atan2(-ny, -nx), Math.atan2(ny, nx), dx * ny - dy * nx > 0); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = Math.max(1, w * 0.16); ctx.stroke();
  };
  return { TEX, SIZE, THEME, tex, ensureAll, quad, rod, plate, puffyStar, heart, star5, CROP };
})();
