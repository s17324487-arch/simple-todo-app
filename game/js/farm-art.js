// はたけの 絵（オーナーの FB 2026-09-30「イラストで 畑に 実際に 実る ように して タップすると 収穫できる」・デザインは リアルファーム を さんこうに）。
// ・さくもつ 13しゅ × 5だんかい（0 たね・1 め・2 は・3 はな／つぼみ・4 みのり）。viewBox 0 0 64 64・つちの たかさ y=56・線は INK。
//   かたちは 7つ: ね（はつかだいこん・にんじん）・たま（たまねぎ）・いも（じゃがいも）・ささえ（トマト・なす・ピーマン）・たかい（とうもろこし）・
//   はっぱの たま（キャベツ）・いちご・つる（かぼちゃ・スイカ・メロン）。
// ・はたけの つち（うね・かわいた／ぬれた）・じょうろ・たねの ふくろ・ひりょう・かご・はたけの かんばん。
// ・あたらしい 食べ物の 絵（FOOD_ART・64×64）。とうもろこし・ピーマンは まえからの 絵を つかう。
// 画像の キャッシュ（SvgCache）の キーは さくもつ×だんかい×大きさ だけ（有限）。
const FarmArt = (() => {
  const S = (w = 2.4) => IS(w);
  const VEIN = "#3E8440", L1 = "#8ACB6C", L2 = "#62B052", L3 = "#46914A", STEM = "#4F9A45";
  const f1 = (n) => Math.round(n * 10) / 10;
  const hi = (x, y, rx, ry, rot = 0, a = 0.55) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${rot} ${f1(x)} ${f1(y)})" fill="#FFFFFF" fill-opacity="${a}"/>`;
  const line = (d, col = STEM, w = 2.4) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shadow = (rx = 13, cy = 56.5) => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${f1(rx * 0.28)}" fill="${INK}" fill-opacity=".16"/>`;
  // ほそながい は（ねもとが 0,0・うえむき・rot どで かたむける）
  const leaf = (x, y, len, wid, rot, fill = L2, vein = true, sw = 1.8) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M0,0 C${f1(wid)},${f1(-len * 0.22)} ${f1(wid * 0.85)},${f1(-len * 0.78)} 0,${f1(-len)} C${f1(-wid * 0.85)},${f1(-len * 0.78)} ${f1(-wid)},${f1(-len * 0.22)} 0,0 Z" fill="${fill}" ${S(sw)}/>${vein ? `<path d="M0,-1.5 L0,${f1(-len * 0.84)}" stroke="${VEIN}" stroke-width="1.1" stroke-linecap="round" fill="none"/>` : ""}</g>`;
  // まるい は（だいこん・キャベツ・いちご）
  const rleaf = (x, y, len, wid, rot, fill = L2, sw = 1.8) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M0,0 C${f1(wid * 1.1)},${f1(-len * 0.3)} ${f1(wid)},${f1(-len)} 0,${f1(-len)} C${f1(-wid)},${f1(-len)} ${f1(-wid * 1.1)},${f1(-len * 0.3)} 0,0 Z" fill="${fill}" ${S(sw)}/><path d="M0,-1.5 L0,${f1(-len * 0.8)} M0,${f1(-len * 0.45)} l${f1(wid * 0.45)},${f1(-len * 0.16)} M0,${f1(-len * 0.45)} l${f1(-wid * 0.45)},${f1(-len * 0.16)}" stroke="${VEIN}" stroke-width="1" stroke-linecap="round" fill="none"/></g>`;
  // ぎざぎざの ふちの は（こまかい きょくせん）
  const lobed = (cx, cy, R, lobes, depth, fill, rot = 0, sw = 1.8) => {
    let d = "";
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2 + rot, r = R * (1 - depth + depth * Math.abs(Math.cos((a - rot) * lobes / 2)));
      d += (i ? " L" : "M") + f1(cx + Math.cos(a) * r) + "," + f1(cy + Math.sin(a) * r * 0.82);
    }
    return `<path d="${d} Z" fill="${fill}" ${S(sw)}/>`;
  };
  // 5まいの はなびら
  const flower5 = (x, y, r, petal, core = "#F4C542", sw = 1.2) => `<g transform="translate(${f1(x)} ${f1(y)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${f1(-r * 0.62)}" rx="${f1(r * 0.42)}" ry="${f1(r * 0.62)}" transform="rotate(${a})" fill="${petal}" ${S(sw)}/>`).join("")}<circle r="${f1(r * 0.32)}" fill="${core}" ${S(sw * 0.9)}/></g>`;
  // ほしがたの はな（トマト・ピーマン）
  const star = (x, y, r, fill, core = "#E0A020") => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? " L" : "M") + f1(x + Math.cos(a) * rr) + "," + f1(y + Math.sin(a) * rr); } return `<path d="${d} Z" fill="${fill}" ${S(1.1)}/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.25)}" fill="${core}"/>`; };
  // へた（ほしがたの みどり）
  const calyx = (x, y, r, fill = "#4E9A3E") => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.35 : r; d += (i ? " L" : "M") + f1(x + Math.cos(a) * rr) + "," + f1(y + Math.sin(a) * rr * 0.6); } return `<path d="${d} Z" fill="${fill}" ${S(1.1)}/>`; };
  // ---- み ----
  const tomato = (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.9)}" fill="#E8412F" ${S(1.8)}/>${hi(x - r * 0.4, y - r * 0.3, r * 0.26, r * 0.18, -30)}${calyx(x, y - r * 0.82, r * 0.62)}`;
  const greenTomato = (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.9)}" fill="#A6CF62" ${S(1.6)}/>${calyx(x, y - r * 0.82, r * 0.62)}`;
  const eggplant = (x, y, s, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})"><path d="M0,-6 C6,-6 8,4 7,12 C6,20 -6,20 -7,12 C-8,4 -6,-6 0,-6 Z" fill="#5B3A8E" ${S(1.8 / s)}/>${hi(-3, 3, 1.6, 4.6, 8, 0.5)}<path d="M-6,-5 C-4,-10 4,-10 6,-5 L3,-2 L0,-4 L-3,-2 Z" fill="#4F8F3E" ${S(1.4 / s)}/><path d="M0,-9 V-13" stroke="#4F8F3E" stroke-width="${f1(2.4 / s)}" stroke-linecap="round"/></g>`;
  const pepper = (x, y, s, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})"><path d="M-7,-5 C-10,-2 -10,8 -6,12 C-4,15 -1,14 0,12 C1,14 4,15 6,12 C10,8 10,-2 7,-5 C4,-7 -4,-7 -7,-5 Z" fill="#48A843" ${S(1.8 / s)}/>${hi(-3.5, 1, 1.4, 4, 0, 0.5)}<path d="M-4,-6 C-2,-8 2,-8 4,-6 M0,-7 V-11" fill="none" stroke="#2F7A34" stroke-width="${f1(2 / s)}" stroke-linecap="round"/></g>`;
  const berry = (x, y, s, rot = 0, ripe = true) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})"><path d="M0,-5 C-7,-6 -8,2 0,9 C8,2 7,-6 0,-5 Z" fill="${ripe ? "#E53935" : "#F2F0C8"}" ${S(1.6 / s)}/>${ripe ? [[-3, -1], [2.5, -1.5], [0, 2], [-2, 4.5], [2.5, 3.5]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".7" ry="1" fill="#FFE59A"/>`).join("") + hi(-2.5, -2.5, 1.4, 1, -30, 0.45) : ""}<path d="M-4,-5 L-1.5,-7.5 L0,-5.5 L1.5,-7.5 L4,-5 L0,-3.8 Z" fill="#4E9A3E" ${S(1.1 / s)}/></g>`;
  const potato = (x, y, rx, ry, rot = 0) => `<g transform="rotate(${rot} ${f1(x)} ${f1(y)})"><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#D2A76A" ${S(1.7)}/><circle cx="${f1(x - rx * 0.35)}" cy="${f1(y - ry * 0.2)}" r=".9" fill="#9C7443"/><circle cx="${f1(x + rx * 0.3)}" cy="${f1(y + ry * 0.25)}" r=".9" fill="#9C7443"/><circle cx="${f1(x + rx * 0.05)}" cy="${f1(y - ry * 0.45)}" r=".8" fill="#9C7443"/>${hi(x - rx * 0.4, y - ry * 0.35, rx * 0.25, ry * 0.18, -20, 0.4)}</g>`;
  const pumpkin = (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.18)}" ry="${f1(r * 0.9)}" fill="#F08A24" ${S(1.9)}/><path d="M${f1(x - r * 0.45)},${f1(y - r * 0.82)} C${f1(x - r * 0.75)},${f1(y - r * 0.2)} ${f1(x - r * 0.75)},${f1(y + r * 0.4)} ${f1(x - r * 0.45)},${f1(y + r * 0.86)} M${f1(x + r * 0.45)},${f1(y - r * 0.82)} C${f1(x + r * 0.75)},${f1(y - r * 0.2)} ${f1(x + r * 0.75)},${f1(y + r * 0.4)} ${f1(x + r * 0.45)},${f1(y + r * 0.86)} M${f1(x)},${f1(y - r * 0.88)} V${f1(y + r * 0.9)}" fill="none" stroke="#C9661A" stroke-width="1.6" stroke-linecap="round"/>${hi(x - r * 0.62, y - r * 0.3, r * 0.2, r * 0.3, 10, 0.4)}<path d="M${f1(x)},${f1(y - r * 0.86)} C${f1(x + 1)},${f1(y - r * 1.3)} ${f1(x + 4)},${f1(y - r * 1.4)} ${f1(x + 5)},${f1(y - r * 1.25)}" fill="none" stroke="#6E8A3A" stroke-width="3" stroke-linecap="round"/>`;
  const watermelon = (x, y, r, small = false) => { const ry = r * 0.82; let st = ""; for (const k of [-0.62, -0.22, 0.2, 0.6]) st += `<path d="M${f1(x + k * r)},${f1(y - ry * Math.sqrt(1 - k * k) + 0.6)} C${f1(x + k * r - 3)},${f1(y - ry * 0.3)} ${f1(x + k * r + 3)},${f1(y + ry * 0.3)} ${f1(x + k * r)},${f1(y + ry * Math.sqrt(1 - k * k) - 0.6)}" fill="none" stroke="#1F6B33" stroke-width="${small ? 1.6 : 2.4}" stroke-linecap="round" stroke-dasharray="${small ? "" : "5 1.4"}"/>`; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(ry)}" fill="#5DB24A" ${S(1.9)}/>${st}${hi(x - r * 0.45, y - ry * 0.4, r * 0.24, ry * 0.18, -25, 0.45)}`; };
  const melon = (x, y, r, small = false) => { let net = ""; if (!small) for (const k of [-0.5, 0, 0.5]) net += `<path d="M${f1(x - r * 0.9)},${f1(y + k * r * 0.8)} Q${f1(x)},${f1(y + k * r * 0.8 - 4)} ${f1(x + r * 0.9)},${f1(y + k * r * 0.8)} M${f1(x + k * r * 0.9)},${f1(y - r * 0.85)} Q${f1(x + k * r * 0.9 + 4)},${f1(y)} ${f1(x + k * r * 0.9)},${f1(y + r * 0.85)}" fill="none" stroke="#FFFBEA" stroke-width="1.3" stroke-linecap="round"/>`; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${small ? "#9CCB6A" : "#BBD68A"}" ${S(1.9)}/>${net}${hi(x - r * 0.42, y - r * 0.42, r * 0.22, r * 0.14, -30, 0.5)}${small ? "" : `<path d="M${f1(x)},${f1(y - r)} V${f1(y - r - 4)} M${f1(x - 4)},${f1(y - r - 4)} H${f1(x + 4)}" fill="none" stroke="#6E8A3A" stroke-width="2.6" stroke-linecap="round"/>`}`; };
  const cob = (x, y, s, rot, open = true) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})"><path d="M-5,6 C-6,-4 -3,-12 0,-14 C3,-12 6,-4 5,6 Z" fill="#F7D24A" ${S(1.5 / s)}/>${open ? [-8, -4, 0, 4].map((yy) => `<path d="M-4,${yy} H4" stroke="#D9A92A" stroke-width="${f1(1 / s)}"/>`).join("") : ""}<path d="M-6,8 C-9,0 -6,-9 -3,-12 C-4,-4 -3,2 0,8 C3,2 4,-4 3,-12 C6,-9 9,0 6,8 Z" fill="#8FC46A" ${S(1.4 / s)}/><path d="M0,-14 C-1,-18 1,-20 -1,-23 M0,-14 C2,-18 3,-19 3,-22" fill="none" stroke="#A8743F" stroke-width="${f1(1.4 / s)}" stroke-linecap="round"/></g>`;
  // ---- 0 たね・1 め（どの さくもつも おなじ かたち。なふだの いろ だけ かわる）----
  const seed = (c) => `${shadow(12)}<path d="M18,56 C20,49 44,49 46,56 Z" fill="#8C5E3C" ${S(2)}/><path d="M22,53 C26,51 38,51 42,53" fill="none" stroke="#B07D52" stroke-width="1.6" stroke-linecap="round"/>${[[27, 52.5], [32, 51.3], [37, 52.6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="1.3" fill="${c.col.seed}" ${S(1)}/>`).join("")}` +
    `<path d="M49,56 V39" stroke="#B9895A" stroke-width="2.6" stroke-linecap="round"/><rect x="43" y="31" width="12" height="10" rx="2" fill="#FFFDF4" ${S(1.6)}/><circle cx="49" cy="36" r="3" fill="${c.col.fruit}" ${S(1)}/>`;
  const sprout = (c) => `${shadow(10)}<path d="M24,56 C26,52 38,52 40,56 Z" fill="#8C5E3C" ${S(1.8)}/>${line("M32,54 C32,48 31,44 32,40", c.col.stem || STEM, 2.4)}<path d="M32,41 C28,34 20,36 21,41 C24,44 29,44 32,41 Z" fill="${c.col.leaf || L1}" ${S(1.6)}/><path d="M32,41 C36,34 44,36 43,41 C40,44 35,44 32,41 Z" fill="${c.col.leaf || L1}" ${S(1.6)}/>`;
  // ---- かたちごとの 2・3・4 ----
  const K = {
    // ね: はっぱの たば と、みのると つちから かおを だす ね（だいこん: まるくて あかい・にんじん: オレンジの かた）
    root(c, s) {
      const carrot = c.id === "carrot", n = s === 2 ? 3 : 5;
      let ls = "";
      if (carrot) {
        // にんじん: ふわふわの はっぱ（ほそい くきに こまかい は）
        const len = s === 2 ? 17 : s === 3 ? 25 : 27;
        for (let i = 0; i < n; i++) {
          const a = (i - (n - 1) / 2) * (s === 2 ? 24 : 17);
          let g = `<path d="M0,0 C1.2,${f1(-len * 0.3)} -1.2,${f1(-len * 0.65)} 0,${-len}" fill="none" stroke="${STEM}" stroke-width="1.7" stroke-linecap="round"/>`;
          for (let k = 1; k <= 4; k++) { const y = f1(-len * (0.3 + k * 0.16)), r = 3.3 - k * 0.35; for (const side of [-1, 1]) g += `<ellipse cx="${side * 2.8}" cy="${y}" rx="${f1(r)}" ry="${f1(r * 0.55)}" transform="rotate(${-side * 35} ${side * 2.8} ${y})" fill="${(k + i) % 2 ? L1 : L2}" ${S(1)}/>`; }
          ls += `<g transform="translate(${f1(32 + (i - (n - 1) / 2) * 1.2)} 51) rotate(${f1(a)})">${g}<ellipse cx="0" cy="${-len - 1}" rx="2.2" ry="2.8" fill="${L1}" ${S(1)}/></g>`;
        }
      } else {
        const len = s === 2 ? 16 : s === 3 ? 22 : 24;
        for (let i = 0; i < n; i++) ls += rleaf(32 + (i - (n - 1) / 2) * 1.5, 51, len, s === 2 ? 5.5 : 7, (i - (n - 1) / 2) * (s === 2 ? 28 : 22), i % 2 ? L1 : L2);
      }
      const soil = `<path d="M20,56.5 C22,52.5 42,52.5 44,56.5 Z" fill="#8C5E3C" ${S(1.6)}/>`, lip = `<path d="M22,57 C25,54.2 39,54.2 42,57 Z" fill="#8C5E3C" ${S(1.4)}/>`;
      let root = "";
      // みのり: ねが つちから かおを だす（はっぱの まえ）
      if (s === 4) root = carrot
        ? `<path d="M24,57 C23,48 27,45 32,45 C37,45 41,48 40,57 Z" fill="#F08A2C" ${S(1.9)}/><path d="M26,50 h4 M34,52 h4 M28,54.5 h3" stroke="#C9661A" stroke-width="1.4" stroke-linecap="round"/>${hi(27, 48.5, 2.2, 1.4, -20)}${lip}`
        : `<circle cx="32" cy="48" r="9" fill="#E2455A" ${S(1.9)}/>${hi(28.2, 44.8, 2.6, 1.7, -30)}<path d="M28,46.5 C29,43 35,43 36,46.5" fill="none" stroke="#F28A98" stroke-width="1.3" stroke-linecap="round"/>${lip}`;
      else if (s === 3) root = carrot ? `<path d="M26,57 C26,51.5 29,50.5 32,50.5 C35,50.5 38,51.5 38,57 Z" fill="#F08A2C" ${S(1.7)}/>${lip}` : `<path d="M25,57 C25,50.5 39,50.5 39,57 Z" fill="#E2455A" ${S(1.7)}/>${lip}`;
      return shadow(s === 2 ? 10 : 14) + ls + soil + root;
    },
    // たま（たまねぎ）: まっすぐな くだの は → ねもとが ふくらむ → はが たおれて きんいろの たま
    bulb(c, s) {
      let out = shadow(s === 4 ? 14 : 10);
      if (s === 4) {
        out += `<path d="M32,56 C22,56 20,48 25,42 C28,38 31,36 32,31 C33,36 36,38 39,42 C44,48 42,56 32,56 Z" fill="#D9A04E" ${S(1.9)}/><path d="M32,33 C29,40 28,48 30,55 M32,33 C35,40 36,48 34,55" fill="none" stroke="#B57A30" stroke-width="1.3"/>${hi(27, 45, 2, 4, 15, 0.45)}`;
        out += line("M32,32 C28,24 20,22 12,26", "#8DBA5A", 3) + line("M33,32 C38,22 46,22 52,28", "#A7C46A", 3) + line("M32,31 C33,24 30,18 26,16", "#7FB35A", 3);
        return out;
      }
      const n = s === 2 ? 3 : 4, h = s === 2 ? 20 : 30;
      for (let i = 0; i < n; i++) { const x = 32 + (i - (n - 1) / 2) * 3.4, tip = x + (i - (n - 1) / 2) * 3; out += `<path d="M${f1(x - 1.6)},54 C${f1(x - 1.6)},${54 - h * 0.6} ${f1(tip - 1.2)},${54 - h} ${f1(tip)},${54 - h} C${f1(tip + 1.2)},${54 - h} ${f1(x + 1.6)},${54 - h * 0.6} ${f1(x + 1.6)},54 Z" fill="${i % 2 ? L1 : L2}" ${S(1.4)}/>`; }
      if (s === 3) out += `<ellipse cx="32" cy="53" rx="6" ry="4" fill="#EFE3B8" ${S(1.5)}/>`;
      return out + `<path d="M23,56.5 C25,53.5 39,53.5 41,56.5 Z" fill="#8C5E3C" ${S(1.5)}/>`;
    },
    // いも（じゃがいも）: こんもりした は → しろい はな → はが きいろく なって つちから おいもが のぞく
    potato(c, s) {
      const col = s === 4 ? ["#C9D46A", "#B5C45A", "#D8DC86"] : [L1, L2, L3], R = s === 2 ? 9 : 13;
      let out = shadow(R + 3), bush = "";
      const spots = s === 2 ? [[32, 42, 0], [25, 47, -40], [39, 47, 40]] : [[32, 36, 0], [23, 41, -35], [41, 41, 35], [27, 47, -60], [37, 47, 60]];
      for (const [x, y, a] of spots) bush += `<g transform="translate(${x} ${y}) rotate(${a})">${[[-4, 0], [4, 0], [0, -5], [-3.4, -4], [3.4, -4]].map(([dx, dy], k) => `<ellipse cx="${dx}" cy="${dy}" rx="3.6" ry="2.6" fill="${col[k % 3]}" ${S(1.2)}/>`).join("")}</g>`;
      out += line("M32,55 V44", STEM, 2.4) + bush;
      if (s === 3) out += flower5(28, 33, 4.2, "#F4F0FF", "#F4C542") + flower5(37, 31, 3.8, "#E7DDFB", "#F4C542");
      // みのり: はっぱが きいろく なって、ねもとから おいもが ころん
      if (s === 4) out += `<path d="M14,57.5 C18,52.5 46,52.5 50,57.5 Z" fill="#8C5E3C" ${S(1.5)}/>` + potato(20, 54.5, 6.4, 4.5, -10) + potato(44, 55, 5.8, 4.1, 15) + potato(32, 56, 7, 4.7, 5);
      return out;
    },
    // ささえ（トマト・なす・ピーマン）: たけの ささえに ゆわえた なえ → はな → み
    stake(c, s) {
      const top = s === 2 ? 26 : 10;
      let out = shadow(s === 2 ? 11 : 14) + `<rect x="38.6" y="${top}" width="3" height="${57 - top}" rx="1.4" fill="#DCC388" ${S(1.2)}/><path d="M38.6,${top + 12} h3 M38.6,${top + 26} h3" stroke="#B89A5E" stroke-width="1.2"/>`;
      // なす: むらさきの くきと ひろい は・ピーマン: こい みどりの ほそい は・トマト: あかるい みどり
      const stemC = c.id === "eggplant" ? "#6D4E8C" : STEM, lf = c.id === "eggplant" ? [L2, L3] : c.id === "pepper" ? [L3, L2] : [L1, L2], lw = c.id === "eggplant" ? 6.2 : c.id === "pepper" ? 4.3 : 5.2;
      if (s === 2) { out += line("M32,55 C32,48 33,42 34,36", stemC, 2.4) + leaf(33, 48, 11, lw * 0.96, -60, lf[0]) + leaf(33, 44, 11, lw * 0.96, 62, lf[1]) + leaf(34, 38, 9, lw * 0.8, -18, lf[0]) + `<path d="M34.5,40 L39,40" stroke="#F5F0DF" stroke-width="1.6" stroke-linecap="round"/>`; return out; }
      out += line("M32,55 C31,46 34,34 35,16", stemC, 2.6);
      for (const [x, y, len, a, k] of [[32, 50, 13, -70, 0], [32.5, 45, 13, 68, 1], [33.5, 38, 12, -64, 1], [34, 32, 12, 62, 0], [34.8, 25, 10, -50, 0], [35, 20, 9, 40, 1]]) out += leaf(x, y, len, lw, a, lf[k]);
      out += `<path d="M35,28 L39,28 M35,42 L39,42" stroke="#F5F0DF" stroke-width="1.6" stroke-linecap="round"/>`;
      if (s === 3) {
        if (c.id === "tomato") out += star(26, 30, 4, "#F7D54A") + star(43, 22, 3.6, "#F7D54A") + greenTomato(27, 41, 3.6);
        else if (c.id === "eggplant") out += flower5(26, 31, 4.6, "#A98BDB", "#F4C542") + flower5(44, 24, 4, "#B79CE4", "#F4C542");
        else out += star(26, 31, 3.8, "#FFFFFF", "#F4C542") + star(44, 24, 3.4, "#FFFFFF", "#F4C542") + star(27, 41, 3, "#FFFFFF", "#F4C542");
        return out;
      }
      if (c.id === "tomato") out += tomato(25, 40, 5.2) + tomato(30, 46, 4.6) + tomato(45, 30, 4.8) + tomato(26, 27, 4.2);
      else if (c.id === "eggplant") out += eggplant(25, 38, 0.95, 12) + eggplant(46, 32, 0.85, -14) + eggplant(29, 45, 0.7, 20);
      else out += pepper(25, 36, 0.8, 10) + pepper(45, 30, 0.75, -12) + pepper(28, 46, 0.7, 18);
      return out;
    },
    // たかい（とうもろこし）: ながい はっぱ → てっぺんに ほ・ひげ → みが ふくらむ
    tall(c, s) {
      const top = s === 2 ? 24 : 4;
      let out = shadow(12) + `<path d="M32,57 C32,46 31.5,${top + 12} 32,${top}" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M32,57 C32,46 31.5,${top + 12} 32,${top}" fill="none" stroke="#8CC05E" stroke-width="3" stroke-linecap="round"/>`;
      const blades = s === 2 ? [[32, 46, 18, -58], [32, 40, 17, 56], [32, 33, 13, -30]] : [[32, 50, 22, -62], [32, 44, 22, 60], [32, 36, 20, -52], [32, 28, 18, 50], [32, 20, 14, -30]];
      for (const [x, y, len, a] of blades) out += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-1.4,0 C-3,${-len * 0.4} -1,${-len * 0.8} 1.5,${-len} C1.8,${-len * 0.6} 3,${-len * 0.3} 1.4,0 Z" fill="${a < 0 ? L2 : L1}" ${S(1.3)}/></g>`;
      if (s >= 3) out += `<path d="M32,5 L28,-1 M32,5 L32,-3 M32,5 L36,-1 M32,6 L25,3 M32,6 L39,3" stroke="#C9A25A" stroke-width="1.8" stroke-linecap="round"/>`;
      if (s === 3) out += cob(36, 36, 0.55, 22, false);
      if (s === 4) out += cob(37, 34, 0.85, 24) + cob(27, 42, 0.7, -24);
      return out;
    },
    // はっぱの たま（キャベツ）: ひろがった は → まんなかが まく → まるい たま
    head(c, s) {
      let out = shadow(s === 2 ? 12 : 16);
      const outer = s === 2 ? [[-62, 15], [62, 15], [-18, 17], [22, 16]] : [[-80, 19], [80, 19], [-42, 21], [42, 21], [0, 20]];
      for (const [a, len] of outer) out += rleaf(32, 54, len, s === 2 ? 8.5 : 11, a, a % 2 ? L2 : "#7DBE66");
      if (s === 3) out += `<circle cx="32" cy="43" r="9" fill="#C9E7A4" ${S(1.7)}/><path d="M25,43 C27.5,38.5 36.5,38.5 39,43" fill="none" stroke="#8FC46A" stroke-width="1.4"/>`;
      if (s === 4) out += `<circle cx="32" cy="41" r="13.5" fill="#CDEAA5" ${S(1.9)}/><path d="M20.5,41 C24,32 40,32 43.5,41 M23,46.5 C27.5,42 36.5,42 41,46.5 M32,28 C28.5,34 28.5,44 32,54" fill="none" stroke="#93C46E" stroke-width="1.5" stroke-linecap="round"/>${hi(26, 35, 3, 2, -30, 0.5)}`;
      return out;
    },
    // いちご: 3まいの ぎざぎざの は → しろい はな → あかい み
    berry(c, s) {
      let out = shadow(s === 2 ? 11 : 15);
      const tri = (x, y, a, r, fill) => `<g transform="translate(${x} ${y}) rotate(${a})">${line("M0,0 V-7", STEM, 1.6)}${[-38, 0, 38].map((b) => lobed(0 + Math.sin(b * Math.PI / 180) * r * 1.05, -7 - Math.cos(b * Math.PI / 180) * r * 1.05, r, 7, 0.16, fill, b * Math.PI / 180, 1.2)).join("")}</g>`;
      const spots = s === 2 ? [[32, 53, -40, 4.6], [32, 53, 40, 4.6], [32, 52, 0, 5]] : [[32, 54, -64, 5.2], [32, 54, 64, 5.2], [32, 53, -24, 5.6], [32, 53, 24, 5.6]];
      spots.forEach(([x, y, a, r], i) => (out += tri(x, y, a, r, i % 2 ? L1 : L2)));
      if (s === 3) out += flower5(22, 49, 3.8, "#FFFFFF") + flower5(42, 48, 3.6, "#FFFFFF") + flower5(32, 36, 3.4, "#FFFFFF");
      if (s === 4) out += berry(20, 51, 0.95, -18) + berry(44, 51, 0.9, 16) + berry(31, 54, 0.8, 4) + berry(26, 41, 0.65, -10, false);
      return out;
    },
    // つる（かぼちゃ・スイカ・メロン）: ひろい は と まきひげ → きいろい はな と ちいさな み → おおきな み
    vine(c, s) {
      const depth = { pumpkin: 0.22, watermelon: 0.42, melon: 0.12 }[c.id], lobes = c.id === "watermelon" ? 5 : 5;
      let out = shadow(s === 2 ? 14 : 20);
      out += line(s === 2 ? "M14,54 C22,50 40,55 50,50" : "M6,54 C16,48 30,56 44,50 C50,47 56,50 60,46", "#5E9E45", 2.4) + `<path d="${s === 2 ? "M50,50 c3,-2 4,-6 1,-7 c-2,0 -2,3 0,3" : "M60,46 c3,-2 3,-6 0,-7 c-2,0 -2,3 0,3"}" fill="none" stroke="#6FAE52" stroke-width="1.3" stroke-linecap="round"/>`;
      const leaves = s === 2 ? [[22, 45, 8.5, L2], [40, 44, 9.5, L1]] : [[14, 44, 9, L2], [30, 40, 11, L1], [48, 41, 10, L2], [40, 50, 7.5, L1]];
      for (const [x, y, r, col] of leaves) out += line(`M${x},${y + r * 0.7} V${y + r * 1.1}`, STEM, 1.8) + lobed(x, y, r, lobes, depth, col, -Math.PI / 2) + `<path d="M${x},${f1(y + r * 0.6)} L${x},${f1(y - r * 0.5)} M${x},${y} L${f1(x - r * 0.5)},${f1(y - r * 0.3)} M${x},${y} L${f1(x + r * 0.5)},${f1(y - r * 0.3)}" stroke="${VEIN}" stroke-width="1" stroke-linecap="round"/>`;
      if (s === 3) {
        out += flower5(22, 34, 5.2, "#F9D342", "#F08A24", 1.2);
        out += c.id === "pumpkin" ? `<ellipse cx="46" cy="54" rx="4.4" ry="3.4" fill="#A9C85A" ${S(1.5)}/>` : c.id === "watermelon" ? watermelon(46, 54, 4.6, true) : melon(46, 54, 4.2, true);
      }
      if (s === 4) out += c.id === "pumpkin" ? pumpkin(34, 49, 10) : c.id === "watermelon" ? watermelon(34, 49, 13) : melon(34, 48, 11);
      return out;
    },
  };
  // ---- あたらしい 食べ物の 絵（64×64）----
  const FOOD = {
    radish: `${[-26, 0, 26].map((a, i) => rleaf(32, 24, 17, 6.5, a, i === 1 ? L1 : L2, 2.2)).join("")}<circle cx="32" cy="38" r="15" fill="#E2455A" ${S(3)}/><path d="M24,48 C27,54 37,54 40,48 C38,56 34,61 32,62 C30,61 26,56 24,48 Z" fill="#FFF6F0" ${S(2.4)}/>${hi(26, 32, 4, 2.6, -30)}`,
    carrot: `${[-24, 0, 24].map((a) => line(`M32,20 L${f1(32 + Math.sin(a * Math.PI / 180) * 16)},${f1(20 - Math.cos(a * Math.PI / 180) * 16)}`, STEM, 3)).join("")}${[-24, 0, 24].map((a, i) => { const x = f1(32 + Math.sin(a * Math.PI / 180) * 12), y = f1(20 - Math.cos(a * Math.PI / 180) * 12); return `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="3.2" transform="rotate(${a} ${x} ${y})" fill="${i === 1 ? L1 : L2}" ${S(2)}/>`; }).join("")}<path d="M20,22 C24,18 40,18 44,22 C44,32 36,52 32,60 C28,52 20,32 20,22 Z" fill="#F08A2C" ${S(3)}/><path d="M24,30 h6 M33,38 h6 M27,45 h5" stroke="#C9661A" stroke-width="2.2" stroke-linecap="round"/>${hi(26, 26, 3, 2, -20)}`,
    potato: `${potato(24, 38, 15, 11, -12).replace(/stroke-width="1.7"/g, 'stroke-width="3"')}${potato(42, 44, 13, 9.5, 18).replace(/stroke-width="1.7"/g, 'stroke-width="3"')}`,
    tomato: `<ellipse cx="32" cy="38" rx="21" ry="19" fill="#E8412F" ${S(3)}/>${hi(22, 30, 5, 3.4, -30)}${calyx(32, 21, 12)}<path d="M32,20 C32,16 34,13 37,12" fill="none" stroke="#3F7F32" stroke-width="3" stroke-linecap="round"/>`,
    eggplant: `<g transform="rotate(-28 32 34)"><path d="M32,16 C44,16 47,34 45,46 C43,58 21,58 19,46 C17,34 20,16 32,16 Z" fill="#5B3A8E" ${S(3)}/>${hi(26, 34, 3.4, 9, 6, 0.5)}<path d="M20,20 C24,10 40,10 44,20 L37,24 L32,19 L27,24 Z" fill="#4F8F3E" ${S(2.4)}/><path d="M32,12 V5" stroke="#4F8F3E" stroke-width="4" stroke-linecap="round"/></g>`,
    onion: `<path d="M32,60 C14,60 10,46 18,36 C23,30 29,26 32,16 C35,26 41,30 46,36 C54,46 50,60 32,60 Z" fill="#D9A04E" ${S(3)}/><path d="M32,19 C27,32 25,46 28,58 M32,19 C37,32 39,46 36,58" fill="none" stroke="#B57A30" stroke-width="2"/>${hi(22, 44, 3, 6, 15, 0.45)}<path d="M32,16 C31,10 33,6 30,3 M32,16 C34,11 37,9 39,6" fill="none" stroke="#8DBA5A" stroke-width="3" stroke-linecap="round"/><path d="M25,60 c-2,2 -1,3 1,3 M32,60 v3 M39,60 c2,2 1,3 -1,3" fill="none" stroke="#B57A30" stroke-width="2" stroke-linecap="round"/>`,
    cabbage: `${rleaf(32, 56, 26, 16, -58, "#7DBE66", 3)}${rleaf(32, 56, 26, 16, 58, L2, 3)}<circle cx="32" cy="36" r="19" fill="#CDEAA5" ${S(3)}/><path d="M16,36 C20,24 44,24 48,36 M19,44 C25,38 39,38 45,44 M32,17 C27,26 27,42 32,55" fill="none" stroke="#93C46E" stroke-width="2.4" stroke-linecap="round"/>${hi(23, 27, 4.4, 2.8, -30, 0.5)}`,
    pumpkin: pumpkin(32, 38, 19).replace(/stroke-width="1.9"/, 'stroke-width="3"').replace(/stroke-width="1.6"/, 'stroke-width="2.4"').replace(/stroke-width="3" stroke-linecap/, 'stroke-width="4.4" stroke-linecap'),
    strawberry: `<path d="M32,18 C12,14 8,34 32,58 C56,34 52,14 32,18 Z" fill="#E53935" ${S(3)}/>${[[22, 28], [32, 27], [42, 28], [26, 38], [38, 38], [32, 47], [22, 36], [42, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.1" fill="#FFE59A"/>`).join("")}${hi(21, 24, 3.4, 2.2, -30, 0.45)}<path d="M20,18 L25,10 L29,16 L32,8 L35,16 L39,10 L44,18 L32,23 Z" fill="#4E9A3E" ${S(2.4)}/>`,
    watermelon: `${watermelon(28, 32, 22).replace(/stroke-width="1.9"/, 'stroke-width="3"').replace(/stroke-width="2.4"/g, 'stroke-width="3.2"')}<path d="M36,62 L60,62 C60,50 52,42 48,42 Z" fill="#F0605A" ${S(2.8)}/><path d="M36,62 L60,62" stroke="#5DB24A" stroke-width="3.4"/><path d="M36,62 L60,62" fill="none" ${S(2.8)}/><ellipse cx="50" cy="55" rx="1" ry="1.6" fill="${INK}"/><ellipse cx="54" cy="58" rx="1" ry="1.6" fill="${INK}"/><ellipse cx="46" cy="58" rx="1" ry="1.6" fill="${INK}"/>`,
    melon: melon(32, 36, 22).replace(/stroke-width="1.9"/, 'stroke-width="3"').replace(/stroke-width="1.3"/g, 'stroke-width="2"').replace(/stroke-width="2.6"/, 'stroke-width="3.6"'),
  };
  // ---- はたけの つち（うね）: w×h の 大きさで、うえから 見た もりつち。wet で こい いろ・rows は うねの かず・
  //      がめんの はたけは まえの いた（foot px）に なふだを はる ----
  const bed = (w, h, wet, town = false, rows = 2, foot = 0) => {
    const fr = town ? 3 : 7, dep = town ? 4 : Math.max(9, foot), top = wet ? "#86573A" : "#B98A57", side = wet ? "#6A4430" : "#976A40", ridge = wet ? "#9A6A48" : "#CFA36C", fur = wet ? "#5E3B28" : "#A1743F";
    let s = `<rect x="2" y="${f1(dep * 0.6)}" width="${w - 4}" height="${h - dep * 0.6 - 1}" rx="${fr + 3}" fill="${INK}" fill-opacity=".12"/>`;
    if (!town) s += `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${fr + 2}" fill="#C58A55" ${S(2.4)}/><rect x="1.5" y="${h - dep - 1.5}" width="${w - 3}" height="${dep}" rx="4" fill="#B07748" ${S(2)}/>` +
      `<path d="M4,${f1(h - dep * 0.62)} H${w - 4} M4,${f1(h - dep * 0.3)} H${w - 4}" stroke="#9A6438" stroke-width="1.2" stroke-opacity=".7"/><path d="M${f1(w * 0.33)},${h - dep} v${dep - 3} M${f1(w * 0.66)},${h - dep} v${dep - 3}" stroke="#8C5A33" stroke-width="1.4"/>` +
      [8, w - 8].map((x) => `<circle cx="${x}" cy="${f1(h - dep / 2 - 1.5)}" r="1.6" fill="#7A4C2A"/>`).join("");
    const ix = town ? 1.5 : 7, iy = town ? 1.5 : 6, iw = w - ix * 2, ih = h - iy - (town ? 1.5 : dep + 3);
    s += `<rect x="${ix}" y="${iy}" width="${f1(iw)}" height="${f1(ih)}" rx="${fr}" fill="${side}" ${S(town ? 1.6 : 2)}/>`;
    const rh = ih / rows;
    for (let r = 0; r < rows; r++) {
      const y = iy + r * rh;
      s += `<rect x="${f1(ix + 3)}" y="${f1(y + 2)}" width="${f1(iw - 6)}" height="${f1(rh - 5)}" rx="${f1(Math.min(8, rh / 2.4))}" fill="${top}"/><path d="M${f1(ix + 8)},${f1(y + 4.5)} H${f1(ix + iw - 8)}" stroke="${ridge}" stroke-width="${town ? 1.4 : 2.2}" stroke-linecap="round"/><path d="M${f1(ix + 6)},${f1(y + rh - 2)} H${f1(ix + iw - 6)}" stroke="${fur}" stroke-width="${town ? 1.2 : 1.8}" stroke-linecap="round"/>`;
      for (let k = 0; k < (town ? 4 : 7); k++) { const x = ix + 10 + ((k * 37 + r * 19) % Math.max(10, iw - 20)), yy = y + 5 + ((k * 13 + r * 7) % Math.max(4, rh - 9)); s += wet ? `<ellipse cx="${f1(x)}" cy="${f1(yy)}" rx="${town ? 2 : 3.2}" ry="${town ? 0.8 : 1.3}" fill="#FFFFFF" fill-opacity=".22"/>` : `<path d="M${f1(x)},${f1(yy)} l2.6,1.4 l2,-1" fill="none" stroke="${fur}" stroke-width="1" stroke-linecap="round"/>`; }
    }
    return s;
  };
  // ---- どうぐ（64×64）----
  const TOOLS = {
    can: `<path d="M16,26 C16,20 22,18 26,18 H42 C47,18 50,21 50,26 V48 C50,54 46,56 42,56 H24 C19,56 16,53 16,48 Z" fill="#8FC3DF" ${S(3)}/><path d="M22,18 C22,8 44,8 44,18" fill="none" ${S(3.4)}/><path d="M16,32 L6,20" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M16,32 L6,20" stroke="#8FC3DF" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="5" cy="18" rx="5" ry="3.6" transform="rotate(-40 5 18)" fill="#D4E7F1" ${S(2.4)}/><path d="M22,30 H44" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="42" r="5" fill="#F7D54A" ${S(2)}/>`,
    seeds: `<path d="M14,10 H50 L48,58 H16 Z" fill="#F3E3C3" ${S(3)}/><path d="M14,10 L18,16 L22,10 L26,16 L30,10 L34,16 L38,10 L42,16 L46,10 L50,16" fill="none" stroke="#C9A26B" stroke-width="2"/><rect x="20" y="22" width="24" height="22" rx="4" fill="#DFF0D2" ${S(2)}/>${line("M32,40 V30", STEM, 2.6)}<path d="M32,31 C28,25 22,27 23,31 C26,33 30,33 32,31 Z M32,31 C36,25 42,27 41,31 C38,33 34,33 32,31 Z" fill="${L1}" ${S(1.6)}/><path d="M22,50 h20" stroke="#C9A26B" stroke-width="2.4" stroke-linecap="round"/>`,
    fert: `<path d="M16,16 C14,24 12,40 14,54 C24,58 40,58 50,54 C52,40 50,24 48,16 Z" fill="#C9A26B" ${S(3)}/><path d="M16,16 C24,12 40,12 48,16 C44,20 20,20 16,16 Z" fill="#B28A55" ${S(2.4)}/><circle cx="32" cy="36" r="10" fill="#FFF6DE" ${S(2)}/><path d="M32,43 C26,38 27,31 32,28 C37,31 38,38 32,43 Z" fill="${L2}" ${S(1.6)}/><path d="M32,42 V31" stroke="${VEIN}" stroke-width="1.4"/>`,
    basket: `<path d="M8,30 H56 L50,58 H14 Z" fill="#D8A861" ${S(3)}/><path d="M12,40 H52 M14,49 H50 M22,30 L20,58 M32,30 V58 M42,30 L44,58" stroke="#B07E3A" stroke-width="2"/><path d="M14,30 C14,8 50,8 50,30" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M14,30 C14,8 50,8 50,30" fill="none" stroke="#D8A861" stroke-width="3.2" stroke-linecap="round"/>`,
    drop: `<path d="M32,8 C24,22 16,32 16,42 C16,52 24,58 32,58 C40,58 48,52 48,42 C48,32 40,22 32,8 Z" fill="#6FB7E6" ${S(3)}/>${hi(25, 40, 3.6, 7, 20, 0.6)}`,
  };
  // ---- 町の はたけの かんばん（1マス・w 40 h 56）----
  const sign = `<path d="M9,34 V56 M31,34 V56" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M9,34 V56 M31,34 V56" stroke="#B9895A" stroke-width="1.6" stroke-linecap="round"/><rect x="1.5" y="6" width="37" height="30" rx="4" fill="#D9A066" ${S(2.4)}/><rect x="5" y="9.5" width="30" height="23" rx="2.5" fill="#F4DDB0"/>${tomato(12, 22, 4.2)}<g transform="translate(30 22) scale(.55)">${FOOD.carrot}</g><text x="20" y="31.5" text-anchor="middle" font-size="7.6" font-weight="800" font-family="'M PLUS Rounded 1c',sans-serif" fill="${INK}">はたけ</text>`;
  const wrap = (inner, w = 64, h = 64, vb = `0 0 ${w} ${h}`) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">${inner}</svg>`;
  return {
    K, FOOD, TOOLS, bed, sign, wrap,
    // さくもつの だんかいの 絵（中み）。s: 0〜4
    plant(crop, s) { return s <= 0 ? seed(crop) : s === 1 ? sprout(crop) : K[crop.kind](crop, Math.min(4, s)); },
    // 画像（なければ null・あとで できる）。キーは さくもつ・だんかい・大きさ だけ
    plantImg(crop, s, size) { const px = Math.max(8, Math.ceil((size * G.px) / 8) * 8); return SvgCache.get(`farm:p:${crop.id}:${s}`, () => wrap(this.plant(crop, s)), px, px); },
    plantReady(crop, s, size) { const px = Math.max(8, Math.ceil((size * G.px) / 8) * 8); return SvgCache.ensure(`farm:p:${crop.id}:${s}`, () => wrap(this.plant(crop, s)), px, px); },
    bedImg(w, h, wet, town = false, rows = 2, foot = 0) { return SvgCache.get(`farm:bed:${w}x${h}:${wet ? 1 : 0}:${town ? 1 : 0}:${rows}:${foot}`, () => wrap(bed(w, h, wet, town, rows, foot), w, h), Math.ceil(w * G.px), Math.ceil(h * G.px)); },
    bedReady(w, h, wet, town = false, rows = 2, foot = 0) { return SvgCache.ensure(`farm:bed:${w}x${h}:${wet ? 1 : 0}:${town ? 1 : 0}:${rows}:${foot}`, () => wrap(bed(w, h, wet, town, rows, foot), w, h), Math.ceil(w * G.px), Math.ceil(h * G.px)); },
    // がめんの はたけの つちの ばしょ（うねの まんなか）: bed と おなじ けいさん
    soil(w, h, rows, foot) { const dep = Math.max(9, foot), iy = 6, ih = h - iy - (dep + 3); return { y: iy, h: ih, row: (r) => iy + (r + 0.5) * (ih / rows) }; },
    toolImg(id, size) { const px = Math.max(8, Math.ceil((size * G.px) / 8) * 8); return SvgCache.get(`farm:t:${id}`, () => wrap(TOOLS[id]), px, px); },
    toolReady(id, size) { const px = Math.max(8, Math.ceil((size * G.px) / 8) * 8); return SvgCache.ensure(`farm:t:${id}`, () => wrap(TOOLS[id]), px, px); },
    toolSvg(id) { return wrap(TOOLS[id]); },
    // たべものの 絵（しゅうかくの えんしゅつ）
    foodImg(food, size) { const px = Math.max(8, Math.ceil((size * G.px) / 8) * 8); return SvgCache.get(`farm:f:${food}`, () => Art.iconSvg("bag", food), px, px); },
  };
})();
// 町の はたけ（4×2マス の つち・かわいた いろ。ぬれた いろと さくもつは js/farm.js が うえに 描く）と かんばん
WorldArt.farm_plot = () => ({ w: 128, h: 64, svg: FarmArt.bed(128, 64, false, true) });
WorldArt.farm_sign = () => ({ w: 40, h: 56, svg: FarmArt.sign });
// はたけの まわりの 小物（js/nerikasu-layout.js が おく）: かかし・やさいの はこ・あまみずの たる・ひりょうの ふくろ・ものおき・わら・どうぐたて
(() => {
  const S = (w = 2.2) => OS(w), sh = (cx, rx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.26).toFixed(1)}" fill="${INK}" fill-opacity=".16"/>`;
  WorldArt.farm_scarecrow = () => ({ w: 40, h: 62, svg: `${sh(20, 12, 60)}<path d="M20,60 V22 M5,32 H35" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M20,60 V22 M5,32 H35" stroke="#B9895A" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M11,30 C11,27 29,27 29,30 L31,48 C26,51 14,51 9,48 Z" fill="#7FB3D9" ${S()}/><rect x="13" y="37" width="6" height="6" rx="1" fill="#F4C27A" ${S(1.2)}/><path d="M22,40 h5 M22,43 h4" stroke="#5B8DB8" stroke-width="1.2"/>` +
    `<path d="M3,30 l-2,-3 M3,33 l-3,1 M3,36 l-2,3 M37,30 l2,-3 M37,33 l3,1 M37,36 l2,3" stroke="#E0B85A" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle cx="20" cy="18" r="8.5" fill="#F7E6C4" ${S()}/><circle cx="17" cy="17" r="1.3" fill="${INK}"/><circle cx="23" cy="17" r="1.3" fill="${INK}"/><path d="M16.5,21 C18.5,23 21.5,23 23.5,21" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><circle cx="14.5" cy="20" r="1.5" fill="#F4A6A0" fill-opacity=".8"/><circle cx="25.5" cy="20" r="1.5" fill="#F4A6A0" fill-opacity=".8"/>` +
    `<ellipse cx="20" cy="11.5" rx="15" ry="4" fill="#EBC56A" ${S()}/><path d="M12,11 C12,3 28,3 28,11 Z" fill="#E0B85A" ${S()}/><path d="M12.5,9.5 H27.5" stroke="#D65A4A" stroke-width="2.2"/>` });
  WorldArt.farm_crate = () => ({ w: 32, h: 30, svg: `${sh(16, 13, 28)}<circle cx="10" cy="11" r="4.4" fill="#E8412F" ${S(1.6)}/><circle cx="17" cy="9" r="4.2" fill="#E8412F" ${S(1.6)}/><path d="M22,12 L27,4 M24,12 L28,6" stroke="#F08A2C" stroke-width="3.6" stroke-linecap="round"/><path d="M26,3 l2,-3 M28,5 l3,-1" stroke="#5BAA52" stroke-width="1.6" stroke-linecap="round"/>` +
    `<rect x="3" y="12" width="26" height="15" rx="2" fill="#D9A566" ${S()}/><path d="M3,17 H29 M3,22 H29" stroke="#B07E3A" stroke-width="1.4"/><path d="M8,12 V27 M24,12 V27" stroke="#B07E3A" stroke-width="1.4"/>` });
  WorldArt.farm_barrel = () => ({ w: 30, h: 36, svg: `${sh(15, 12, 34)}<path d="M4,9 C3,20 3,26 5,32 C10,35 20,35 25,32 C27,26 27,20 26,9 Z" fill="#C58A55" ${S()}/><path d="M3.6,15 C10,17.5 20,17.5 26.4,15 M4,27 C10,29.5 20,29.5 26,27" fill="none" stroke="#7A7F86" stroke-width="2.4"/><ellipse cx="15" cy="9" rx="11" ry="4" fill="#8FC3DF" ${S()}/><ellipse cx="12" cy="8.2" rx="4" ry="1.2" fill="#FFFFFF" fill-opacity=".6"/>` });
  WorldArt.farm_sack = () => ({ w: 30, h: 32, svg: `${sh(15, 12, 30)}<path d="M6,10 C4,16 3,24 5,29 C11,32 19,32 25,29 C27,24 26,16 24,10 Z" fill="#C9A26B" ${S()}/><path d="M6,10 C11,6 19,6 24,10 C21,13 9,13 6,10 Z" fill="#B28A55" ${S(1.8)}/><circle cx="15" cy="21" r="5.4" fill="#FFF6DE" ${S(1.4)}/><path d="M15,25 C11.5,22 12,18 15,16.5 C18,18 18.5,22 15,25 Z" fill="#62B052" ${S(1)}/>` });
  WorldArt.farm_hay = () => ({ w: 36, h: 28, svg: `${sh(18, 15, 26)}<rect x="3" y="7" width="30" height="18" rx="6" fill="#EBC56A" ${S()}/><ellipse cx="9" cy="16" rx="5" ry="8.5" fill="#F3D78A" ${S(1.8)}/><path d="M9,11 c2,2 2,8 0,10 M14,9 V23 M20,9 V23 M26,9 V23" fill="none" stroke="#C9A04A" stroke-width="1.2" stroke-linecap="round"/><path d="M3,12 H33 M3,20 H33" stroke="#B07E3A" stroke-width="1.6"/>` });
  WorldArt.farm_rack = () => ({ w: 32, h: 48, svg: `${sh(16, 13, 46)}<path d="M5,46 V16 M27,46 V16 M5,22 H27 M5,36 H27" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M5,46 V16 M27,46 V16 M5,22 H27 M5,36 H27" stroke="#B9895A" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M11,44 L13,6" stroke="#A8743F" stroke-width="2.6" stroke-linecap="round"/><path d="M8,6 H18" stroke="#8E9BA6" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M21,44 L19,10" stroke="#A8743F" stroke-width="2.6" stroke-linecap="round"/><path d="M15,11 h8 M16,11 v4 M19,11 v4 M22,11 v4" stroke="#8E9BA6" stroke-width="1.8" stroke-linecap="round"/>` });
})();
// はたけの こや（建物・3×2マス・とびらは まんなか）。町の 絵の しくみ（HeiwadaiArt・HeiwadaiTown.draw）に 1つ たす。
// 絵の ざひょうは 足もとの 左うえが 0,0（屋根は うえに はみ出す）。defs は かえない（register は つかわない）
(() => {
  const S = (w = 2.4) => OS(w), asset = "farm.hut", key = asset + "|" + HeiwadaiArt.optionKey({});
  const svg = `<ellipse cx="48" cy="64" rx="48" ry="6" fill="${INK}" fill-opacity=".16"/>` +
    `<rect x="6" y="2" width="84" height="62" rx="3" fill="#E2BE85" ${S()}/>${[12, 22, 32, 42, 52].map((y) => `<path d="M7,${y} H89" stroke="#C9A06A" stroke-width="1.3"/>`).join("")}` +
    `<path d="M-2,12 L48,-38 L98,12 Z" fill="#C8594A" ${S()}/><path d="M8,6 L48,-30 L88,6" fill="none" stroke="#E07A6A" stroke-width="2"/><path d="M-2,12 H98" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<rect x="40" y="-24" width="16" height="12" rx="2" fill="#F6ECD6" ${S(1.8)}/>${FarmArt.FOOD.carrot ? `<g transform="translate(41 -24) scale(.22)">${FarmArt.FOOD.carrot}</g><g transform="translate(47 -24) scale(.19)">${FarmArt.FOOD.tomato}</g>` : ""}` +
    `<rect x="34" y="24" width="28" height="40" rx="2" fill="#B9895A" ${S()}/><path d="M48,24 V64 M34,24 L48,44 L34,64 M62,24 L48,44 L62,64" fill="none" stroke="#8C5A33" stroke-width="1.8"/><circle cx="44" cy="45" r="1.6" fill="${INK}"/><circle cx="52" cy="45" r="1.6" fill="${INK}"/>` +
    `<rect x="11" y="22" width="18" height="16" rx="2" fill="#BFE2F2" ${S(1.8)}/><path d="M20,22 V38 M11,30 H29" stroke="${INK}" stroke-width="1.4"/><path d="M13,26 L17,24" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>` +
    `<rect x="9" y="38" width="22" height="7" rx="2" fill="#C98B57" ${S(1.8)}/>${[13, 18.5, 24, 28].map((x, i) => `<circle cx="${x}" cy="37" r="3" fill="${["#F48FB1", "#FFE08A", "#B39DDB", "#F48FB1"][i]}" ${S(1)}/>`).join("")}` +
    `<path d="M70,64 L76,20" stroke="#A8743F" stroke-width="3" stroke-linecap="round"/><path d="M72,20 h9" stroke="#8E9BA6" stroke-width="3.6" stroke-linecap="round"/><path d="M82,64 L80,28" stroke="#A8743F" stroke-width="3" stroke-linecap="round"/><path d="M76,30 c2,-6 8,-6 9,0 l-1,4 h-7 Z" fill="#8E9BA6" ${S(1.4)}/>` +
    `<g transform="translate(64 50) scale(.26)">${FarmArt.TOOLS.can}</g>`;
  if (!HeiwadaiArt.lookup.has(key)) {
    const e = { asset, kind: "heiwadai_farm_hut", opts: {}, w: 3, h: 2, bbox: [-4, -42, 100, 72], svg, index: HeiwadaiArt.entries.length, key };
    HeiwadaiArt.entries.push(e); HeiwadaiArt.lookup.set(key, e);
    HeiwadaiArt.assets[asset] = { id: asset, name: "はたけの こや", category: "はたけ", w: 3, h: 2, bbox: e.bbox };
    WorldArt[e.kind] = (opts) => HeiwadaiArt.model(asset, opts || {});
  }
})();
// あたらしい 食べ物の 絵
for (const [id, art] of Object.entries(FarmArt.FOOD)) FOOD_ART[id] = art;
