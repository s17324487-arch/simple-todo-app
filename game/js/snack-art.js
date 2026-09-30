// Meeときょれじゃ 2F の おかし キャッチャーの けいひん（おかし 22しゅ）。とれた おかしは たべもの（もちもの → おうちで たべる）。
// ほんものの ゲームセンターの おかしの プライズ（おおきな ふくろの ポテトチップス・はこの チョコ・グミ・マシュマロ・つつみの キャンディ など）を もとに、
// なまえと ふくろの 絵は この ゲームの ために つくった（じっさいの しょうひんの なまえ・マークは つかわない）。ふくろや はこには 3人が のる。
// かたち（form）: bag（ちいさな ふくろ）・box（ちいさな はこ）・ring（リングつきの はこ）・piece（スウィートランドの こつぶ）・big（おおきな ふくろ）。
// 絵は 1cm = 10 の SVG。クレーンの テクスチャ（CraneArt.TEX に たす）・もちものの 絵（FOOD_ART）・館の 台の なかの 絵に つかう。id（clipPath など）は つかわない。
const SnackArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const txt = (x, y, s, t, c = K, extra = "") => `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(s)}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${c}" ${extra}>${t}</text>`;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = (s) => { const v = (n >> s) & 255; return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }; return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const st = (w = 2.6, c = K) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const circle = (x, y, r, fill, extra = "") => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}" ${extra}/>`;
  const ell = (x, y, rx, ry, fill, extra = "") => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" ${extra}/>`;
  const rect = (x, y, w, h, rx, fill, extra = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rx)}" fill="${fill}" ${extra}/>`;
  const star = (x, y, R, fill, extra = "") => `<path d="${starPath(x, y, R, R * 0.48)}" fill="${fill}" ${extra}/>`;
  const shine = (x, y, w, h) => `<path d="M${f1(x)} ${f1(y + h)} Q${f1(x - w * 0.2)} ${f1(y + h * 0.4)} ${f1(x + w * 0.5)} ${f1(y)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(2.4, w * 0.22))}" stroke-linecap="round" opacity="0.55"/>`;

  // ---- 3人（ふくろ・はこの キャラクター）。絵は Chara.svg（ぬいぐるみと おなじ はんい）----
  const CROP = { wanko: [12, 22, 186, 192], gachan: [40, 42, 120, 172], goji: [10, 28, 192, 186] };
  const FACE = { wanko: "happy", gachan: "happy", goji: "love" };
  const hero = {};
  const heroSvg = (who) => {
    if (!hero[who]) { const [x, y, w, h] = CROP[who]; hero[who] = Chara.svg(who, { pose: "idle_01", face: FACE[who], dir: "down", color: "soft" }).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/ width="[\d.]+" height="[\d.]+"/, ""); }
    return hero[who];
  };
  const mascot = (who, x, y, w, h) => (who ? `<image href="${U.svgUrl(heroSvg(who))}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMax meet"/>` : "");

  // ---- なかみの 絵（x y w h の はこの なかに 描く）----
  const PIC = {
    // ぶどうの ふさ と くまの グミ
    grape(x, y, w, h, c) {
      const r = Math.min(w, h) * 0.12, cx = x + w * 0.34, cy = y + h * 0.3; let s = `<path d="M${f1(cx)} ${f1(cy - r * 1.2)} q${f1(r * 0.4)} ${f1(-r * 1.2)} ${f1(r * 1.4)} ${f1(-r * 1.4)}" fill="none" ${st(2.4, "#6B8E3E")}/>` + `<path d="M${f1(cx + r * 0.6)} ${f1(cy - r * 2)} q${f1(r * 1.6)} ${f1(-r * 0.8)} ${f1(r * 2.2)} ${f1(r * 0.3)} q${f1(-r * 1.2)} ${f1(r * 0.8)} ${f1(-r * 2.2)} ${f1(-r * 0.3)}Z" fill="#9CCB6B" ${st(2)}/>`;
      for (const [i, j] of [[0, 0], [2, 0], [1, 0.9], [-1, 0.9], [3, 0.9], [0, 1.8], [2, 1.8], [1, 2.7]]) { const px = cx + (i - 1) * r * 0.95, py = cy + j * r * 1.05; s += circle(px, py, r, "#8E5CC4", st(2)) + circle(px - r * 0.35, py - r * 0.35, r * 0.28, "#D9C4F2"); }
      const bear = (bx, by, k, col) => `<g transform="translate(${f1(bx)} ${f1(by)}) scale(${f1(k)})">${circle(-5, -9, 3.4, col, st(1.6))}${circle(5, -9, 3.4, col, st(1.6))}${ell(0, -4, 7, 6.2, col, st(1.6))}${ell(0, 6, 7.4, 7.6, col, st(1.6))}${ell(-6.6, 3, 2.6, 3.4, col, st(1.4))}${ell(6.6, 3, 2.6, 3.4, col, st(1.4))}${circle(-2.4, -5, 1, K)}${circle(2.4, -5, 1, K)}${ell(-2.6, 2, 1.6, 2.8, "#FFFFFF", `opacity="0.5"`)}</g>`;
      return s + bear(x + w * 0.74, y + h * 0.58, w / 60, "#F7A9C8") + bear(x + w * 0.9, y + h * 0.88, w / 80, "#FFD66B") + bear(x + w * 0.58, y + h * 0.9, w / 90, "#9ED36A");
    },
    // マシュマロ（まるい つつ）
    marsh(x, y, w, h) {
      let s = "";
      for (const [u, v, k, col] of [[0.3, 0.45, 1, "#FFFFFF"], [0.62, 0.36, 0.9, "#FBD3E0"], [0.52, 0.72, 1.05, "#FFF3C4"], [0.18, 0.78, 0.8, "#D6ECF7"]]) {
        const cx = x + w * u, cy = y + h * v, rx = w * 0.16 * k, ry = rx * 0.45, hh = rx * 1.1;
        s += `<path d="M${f1(cx - rx)} ${f1(cy - hh / 2)} V${f1(cy + hh / 2)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(cx + rx)} ${f1(cy + hh / 2)} V${f1(cy - hh / 2)}" fill="${col}" ${st(2.2)}/>` + ell(cx, cy - hh / 2, rx, ry, shade(col, 0.4), st(2.2)) + ell(cx - rx * 0.45, cy, rx * 0.14, hh * 0.3, "#FFFFFF", `opacity="0.7"`);
      }
      return s;
    },
    // わたあめ（ぼうに ふわふわの くも）
    cotton(x, y, w, h) {
      const cx = x + w * 0.5, cy = y + h * 0.4, r = Math.min(w, h) * 0.2;
      let s = `<path d="M${f1(cx)} ${f1(cy + r * 0.8)} L${f1(cx + r * 0.2)} ${f1(y + h)}" fill="none" ${st(3.4, "#C9A36B")}/>`;
      const puffs = [[-1, 0, 1], [0, -0.7, 1.1], [1, 0, 1], [-0.5, 0.6, 0.9], [0.5, 0.6, 0.9], [0, 0, 1.2]];
      s += puffs.map(([u, v, k]) => circle(cx + u * r, cy + v * r, r * k, "#F9C9DC", st(2.4))).join("") + puffs.map(([u, v, k]) => circle(cx + u * r, cy + v * r, r * k - 1.4, "#F9C9DC")).join("");
      s += [[-0.8, -0.2, 0.5, "#C8E6F7"], [0.5, -0.6, 0.45, "#FFFFFF"], [0.6, 0.4, 0.4, "#C8E6F7"], [-0.3, 0.3, 0.35, "#FFFFFF"]].map(([u, v, k, c]) => circle(cx + u * r, cy + v * r, r * k, c, `opacity="0.85"`)).join("");
      return s;
    },
    // おせんべい（のりまき・しょうゆ）
    senbei(x, y, w, h) {
      const r = Math.min(w, h) * 0.34, cx = x + w * 0.42, cy = y + h * 0.5;
      let s = circle(cx, cy, r, "#E3A45C", st(2.6)) + circle(cx, cy, r * 0.84, "#C9803A") + [[0.3, -0.3], [-0.4, 0.2], [0.1, 0.5], [-0.2, -0.5], [0.5, 0.3]].map(([u, v]) => ell(cx + u * r, cy + v * r, r * 0.08, r * 0.05, "#8E5220")).join("");
      s += `<path d="M${f1(cx - r * 0.95)} ${f1(cy - r * 0.2)} H${f1(cx + r * 0.95)} V${f1(cy + r * 0.3)} H${f1(cx - r * 0.95)}Z" fill="#2E3B2E" ${st(2)}/>`;
      const r2 = r * 0.55, c2x = x + w * 0.8, c2y = y + h * 0.28;
      s += ell(c2x, c2y, r2, r2 * 0.7, "#F2C279", st(2.2)) + ell(c2x, c2y, r2 * 0.8, r2 * 0.55, "#E9B061") + ell(c2x - r2 * 0.3, c2y - r2 * 0.2, r2 * 0.2, r2 * 0.1, "#FFF1C8");
      return s;
    },
    // コーン スナック（もこもこ の ぼう）と とうもろこし
    corn(x, y, w, h) {
      let s = "";
      const cob = (cx, cy, L, a) => `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})">${ell(0, 0, L * 0.22, L * 0.5, "#FFD24A", st(2.4))}${Array.from({ length: 10 }, (_, i) => circle(((i % 2) - 0.5) * L * 0.18, -L * 0.36 + Math.floor(i / 2) * L * 0.17, L * 0.07, "#FFE98A")).join("")}<path d="M${f1(-L * 0.2)} ${f1(L * 0.3)} Q${f1(-L * 0.5)} ${f1(-L * 0.1)} ${f1(-L * 0.28)} ${f1(-L * 0.46)} Q${f1(-L * 0.12)} ${f1(0)} 0 ${f1(L * 0.5)}Z" fill="#8CC56A" ${st(2)}/></g>`;
      s += cob(x + w * 0.24, y + h * 0.5, h * 0.9, -18);
      for (const [u, v, a] of [[0.6, 0.3, 20], [0.8, 0.5, -30], [0.56, 0.72, 60], [0.84, 0.82, 10]]) { const cx = x + w * u, cy = y + h * v, L = w * 0.22; s += `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})"><path d="M${f1(-L / 2)} 0 q${f1(L * 0.12)} ${f1(-L * 0.2)} ${f1(L * 0.25)} 0 q${f1(L * 0.12)} ${f1(-L * 0.2)} ${f1(L * 0.25)} 0 q${f1(L * 0.12)} ${f1(-L * 0.2)} ${f1(L * 0.25)} 0 q${f1(L * 0.12)} ${f1(-L * 0.2)} ${f1(L * 0.25)} 0 q${f1(-L * 0.12)} ${f1(L * 0.24)} ${f1(-L * 0.25)} ${f1(L * 0.16)} q${f1(-L * 0.12)} ${f1(L * 0.2)} ${f1(-L * 0.25)} 0 q${f1(-L * 0.12)} ${f1(L * 0.2)} ${f1(-L * 0.25)} 0 q${f1(-L * 0.12)} ${f1(L * 0.2)} ${f1(-L * 0.25)} ${f1(-L * 0.16)}Z" fill="#F7C957" ${st(2)}/>${circle(-L * 0.1, -L * 0.02, L * 0.05, "#D9923A")}${circle(L * 0.2, L * 0.04, L * 0.05, "#D9923A")}</g>`; }
      return s;
    },
    // ラムネ（びん と つぶ）
    ramune(x, y, w, h) {
      const bx = x + w * 0.3, top = y + h * 0.05, bw = w * 0.26, bh = h * 0.9;
      let s = `<path d="M${f1(bx - bw * 0.22)} ${f1(top)} H${f1(bx + bw * 0.22)} V${f1(top + bh * 0.2)} Q${f1(bx + bw * 0.5)} ${f1(top + bh * 0.3)} ${f1(bx + bw * 0.5)} ${f1(top + bh * 0.5)} V${f1(top + bh)} H${f1(bx - bw * 0.5)} V${f1(top + bh * 0.5)} Q${f1(bx - bw * 0.5)} ${f1(top + bh * 0.3)} ${f1(bx - bw * 0.22)} ${f1(top + bh * 0.2)}Z" fill="#9EDCF2" fill-opacity="0.85" ${st(2.4)}/>`;
      s += circle(bx, top + bh * 0.3, bw * 0.16, "#E8F7FC", st(1.8)) + rect(bx - bw * 0.26, top - 3, bw * 0.52, 6, 2, "#5B97C7", st(2)) + `<path d="M${f1(bx - bw * 0.3)} ${f1(top + bh * 0.62)} V${f1(top + bh * 0.9)}" ${st(3, "#FFFFFF")} opacity="0.7"/>`;
      for (const [u, v, col] of [[0.66, 0.34, "#FFFFFF"], [0.84, 0.46, "#C8E6F7"], [0.7, 0.62, "#FBD3E0"], [0.88, 0.76, "#FFFFFF"], [0.62, 0.86, "#FFF3C4"]]) s += ell(x + w * u, y + h * v, w * 0.08, w * 0.06, col, st(1.8)) + ell(x + w * u, y + h * v, w * 0.04, w * 0.025, shade(col, -0.12));
      return s;
    },
    // チョコ ビスケット（はんぶん チョコ）
    biscuit(x, y, w, h) {
      let s = "";
      for (const [u, v, a] of [[0.34, 0.5, -14], [0.66, 0.46, 12]]) { const cx = x + w * u, cy = y + h * v, bw = w * 0.34, bh = h * 0.62; s += `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})">${rect(-bw / 2, -bh / 2, bw, bh, 3, "#E9B774", st(2.4))}<path d="M${f1(-bw / 2)} ${f1(-bh * 0.02)} Q0 ${f1(bh * 0.12)} ${f1(bw / 2)} ${f1(-bh * 0.02)} V${f1(bh / 2 - 3)} Q${f1(bw / 2)} ${f1(bh / 2)} ${f1(bw / 2 - 3)} ${f1(bh / 2)} H${f1(-bw / 2 + 3)} Q${f1(-bw / 2)} ${f1(bh / 2)} ${f1(-bw / 2)} ${f1(bh / 2 - 3)}Z" fill="#6E4230" ${st(2.2)}/>${[[-0.25, -0.3], [0.2, -0.32], [0, -0.16], [-0.22, -0.08], [0.24, -0.1]].map(([p, q]) => circle(p * bw, q * bh, 1.4, "#B97F4B")).join("")}<path d="M${f1(-bw * 0.3)} ${f1(bh * 0.14)} q${f1(bw * 0.2)} ${f1(-bh * 0.04)} ${f1(bw * 0.3)} ${f1(bh * 0.08)}" fill="none" ${st(1.6, "#A8745A")}/></g>`; }
      return s;
    },
    // いちごの チョコ（いちごの かたち）と いちご
    strawberry(x, y, w, h) {
      const berry = (cx, cy, r, col, dots) => `<path d="M${f1(cx)} ${f1(cy + r * 1.2)} C${f1(cx - r * 1.4)} ${f1(cy + r * 0.2)} ${f1(cx - r * 1.1)} ${f1(cy - r * 0.9)} ${f1(cx)} ${f1(cy - r * 0.6)} C${f1(cx + r * 1.1)} ${f1(cy - r * 0.9)} ${f1(cx + r * 1.4)} ${f1(cy + r * 0.2)} ${f1(cx)} ${f1(cy + r * 1.2)}Z" fill="${col}" ${st(2.4)}/>` + (dots ? [[-0.4, -0.1], [0.3, -0.2], [0, 0.3], [-0.3, 0.55], [0.35, 0.45], [0, -0.35]].map(([u, v]) => ell(cx + u * r, cy + v * r, r * 0.07, r * 0.11, "#FFF1B8")).join("") : ell(cx - r * 0.35, cy - r * 0.2, r * 0.2, r * 0.12, "#FFFFFF", `opacity="0.6"`)) + `<path d="M${f1(cx - r * 0.6)} ${f1(cy - r * 0.62)} L${f1(cx - r * 0.2)} ${f1(cy - r * 0.95)} L${f1(cx)} ${f1(cy - r * 0.62)} L${f1(cx + r * 0.25)} ${f1(cy - r * 0.95)} L${f1(cx + r * 0.6)} ${f1(cy - r * 0.62)}" fill="#7FBF5A" ${st(2)}/>`;
      return berry(x + w * 0.3, y + h * 0.52, Math.min(w, h) * 0.26, "#E8506A", true) + berry(x + w * 0.66, y + h * 0.42, Math.min(w, h) * 0.2, "#F7A9C8", false) + berry(x + w * 0.82, y + h * 0.76, Math.min(w, h) * 0.16, "#F7A9C8", false);
    },
    // ほねの かたちの バター クッキー
    bone(x, y, w, h) {
      let s = "";
      for (const [u, v, a, k] of [[0.36, 0.44, -20, 1], [0.66, 0.66, 16, 0.85], [0.78, 0.3, -40, 0.7]]) { const cx = x + w * u, cy = y + h * v, L = w * 0.3 * k, r = L * 0.2; s += `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})"><path d="M${f1(-L / 2)} ${f1(-r * 0.7)} H${f1(L / 2)} A${f1(r)} ${f1(r)} 0 1 1 ${f1(L / 2 + r * 0.4)} 0 A${f1(r)} ${f1(r)} 0 1 1 ${f1(L / 2)} ${f1(r * 0.7)} H${f1(-L / 2)} A${f1(r)} ${f1(r)} 0 1 1 ${f1(-L / 2 - r * 0.4)} 0 A${f1(r)} ${f1(r)} 0 1 1 ${f1(-L / 2)} ${f1(-r * 0.7)}Z" fill="#F2CF8C" ${st(2.3)}/><path d="M${f1(-L * 0.36)} ${f1(-r * 0.25)} H${f1(L * 0.36)}" ${st(1.6, "#D9A860")}/>${[-0.2, 0.05, 0.3].map((p) => circle(p * L, r * 0.28, 1.2, "#C98E4A")).join("")}</g>`; }
      return s;
    },
    // ミニ ドーナツ（アイシング と カラフルな つぶ）
    donut(x, y, w, h) {
      let s = "";
      for (const [u, v, k, ice] of [[0.32, 0.44, 1, "#F7A9C8"], [0.7, 0.4, 0.8, "#8C5A3C"], [0.54, 0.76, 0.75, "#FFF3C4"]]) {
        const cx = x + w * u, cy = y + h * v, r = Math.min(w, h) * 0.26 * k;
        s += ell(cx, cy, r, r * 0.8, "#E9B774", st(2.4)) + `<path d="M${f1(cx - r * 0.95)} ${f1(cy)} C${f1(cx - r)} ${f1(cy - r * 0.9)} ${f1(cx + r)} ${f1(cy - r * 0.9)} ${f1(cx + r * 0.95)} ${f1(cy)} Q${f1(cx + r * 0.7)} ${f1(cy + r * 0.2)} ${f1(cx + r * 0.5)} ${f1(cy + r * 0.05)} Q${f1(cx + r * 0.3)} ${f1(cy + r * 0.4)} ${f1(cx)} ${f1(cy + r * 0.1)} Q${f1(cx - r * 0.4)} ${f1(cy + r * 0.4)} ${f1(cx - r * 0.6)} ${f1(cy + r * 0.1)}Z" fill="${ice}" ${st(2)}/>` + ell(cx, cy - r * 0.05, r * 0.3, r * 0.2, "#C98E5C", st(2));
        s += [[-0.5, -0.4, "#9ED3C6", 20], [0.4, -0.45, "#FFE07A", -30], [0.55, -0.1, "#C9B6EE", 60], [-0.6, -0.1, "#FFFFFF", -10], [0.05, -0.62, "#E8506A", 40]].map(([p, q, c, a]) => `<rect x="${f1(cx + p * r - 2.2)}" y="${f1(cy + q * r - 0.9)}" width="4.4" height="1.8" rx="0.9" fill="${c}" transform="rotate(${a} ${f1(cx + p * r)} ${f1(cy + q * r)})"/>`).join("");
      }
      return s;
    },
    // スティック（しおの つぶ つき の ほそい ぼう）
    sticks(x, y, w, h) {
      let s = "";
      for (let i = 0; i < 7; i++) { const a = -26 + i * 9, cx = x + w * (0.22 + i * 0.1), cy = y + h * 0.56, L = h * (0.8 + (i % 3) * 0.08); s += `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})">${rect(-2.6, -L / 2, 5.2, L, 2.6, i % 2 ? "#E4A55A" : "#D99447", st(2))}${[0.3, 0.1, -0.1, -0.3].map((p) => rect(-1, p * L, 2, 1.6, 0.8, "#FFFBEE")).join("")}${i % 3 === 1 ? rect(-2.6, L * 0.05, 5.2, L * 0.45, 2.6, "#6E4230", st(2)) : ""}</g>`; }
      return s;
    },
    // さつまいもの チップス（むらさきの かわ・きいろの なか）と おいも
    imo(x, y, w, h) {
      let s = `<g transform="translate(${f1(x + w * 0.3)} ${f1(y + h * 0.5)}) rotate(-30)">${ell(0, 0, w * 0.3, h * 0.2, "#9C5CB8", st(2.4))}${ell(w * 0.22, -h * 0.02, w * 0.05, h * 0.1, "#F7D46A", st(2))}<path d="M${f1(-w * 0.18)} ${f1(-h * 0.08)} q${f1(w * 0.08)} ${f1(h * 0.04)} ${f1(w * 0.16)} 0 M${f1(-w * 0.1)} ${f1(h * 0.08)} q${f1(w * 0.08)} ${f1(h * 0.04)} ${f1(w * 0.16)} 0" fill="none" ${st(1.6, "#6E3E86")}/></g>`;
      for (const [u, v, k] of [[0.7, 0.3, 1], [0.78, 0.64, 0.85], [0.52, 0.8, 0.75]]) { const cx = x + w * u, cy = y + h * v, r = Math.min(w, h) * 0.17 * k; s += circle(cx, cy, r, "#9C5CB8", st(2.2)) + circle(cx, cy, r * 0.78, "#F7D46A") + circle(cx - r * 0.2, cy - r * 0.2, r * 0.18, "#FFF3C4") + circle(cx + r * 0.3, cy + r * 0.2, r * 0.08, "#E0A92E"); }
      return s;
    },
    // ワッフル（こうしの もよう）
    waffle(x, y, w, h) {
      const cx = x + w * 0.42, cy = y + h * 0.52, r = Math.min(w, h) * 0.42;
      let s = circle(cx, cy, r, "#E9B774", st(2.6));
      for (let k = -2; k <= 2; k++) s += `<path d="M${f1(cx + k * r * 0.34 - r * 0.8)} ${f1(cy - r * 0.8)} L${f1(cx + k * r * 0.34 + r * 0.8)} ${f1(cy + r * 0.8)}" ${st(1.8, "#C98E4A")} opacity="0.9"/><path d="M${f1(cx + k * r * 0.34 + r * 0.8)} ${f1(cy - r * 0.8)} L${f1(cx + k * r * 0.34 - r * 0.8)} ${f1(cy + r * 0.8)}" ${st(1.8, "#C98E4A")} opacity="0.9"/>`;
      s += circle(cx, cy, r, "none", st(2.6)) + ell(cx + r * 0.1, cy - r * 0.35, r * 0.45, r * 0.22, "#FFF6E0", st(2)) + ell(cx + r * 0.1, cy - r * 0.42, r * 0.2, r * 0.08, "#FFFFFF");
      return s + star(x + w * 0.84, y + h * 0.3, Math.min(w, h) * 0.12, "#FFE07A", st(1.6));
    },
    // ロール ケーキ（うずまき・クリーム・いちご）
    roll(x, y, w, h) {
      const cx = x + w * 0.4, cy = y + h * 0.54, r = Math.min(w, h) * 0.4;
      let s = circle(cx, cy, r, "#E9B774", st(2.6)) + circle(cx, cy, r * 0.86, "#FFF8EE");
      s += `<path d="M${f1(cx)} ${f1(cy)} m${f1(-r * 0.1)} 0 a${f1(r * 0.12)} ${f1(r * 0.12)} 0 1 1 ${f1(r * 0.24)} 0 a${f1(r * 0.28)} ${f1(r * 0.28)} 0 1 1 ${f1(-r * 0.52)} 0 a${f1(r * 0.44)} ${f1(r * 0.44)} 0 1 1 ${f1(r * 0.82)} 0 a${f1(r * 0.6)} ${f1(r * 0.6)} 0 1 1 ${f1(-r * 1.12)} 0" fill="none" ${st(r * 0.13, "#E0A060")}/>`;
      s += circle(x + w * 0.78, y + h * 0.36, Math.min(w, h) * 0.13, "#E8506A", st(2)) + `<path d="M${f1(x + w * 0.74)} ${f1(y + h * 0.26)} l${f1(w * 0.04)} ${f1(-h * 0.06)} l${f1(w * 0.04)} ${f1(h * 0.06)}" fill="#7FBF5A" ${st(1.6)}/>`;
      return s;
    },
    // フルーツ ゼリー（カップ）
    jelly(x, y, w, h) {
      let s = "";
      for (const [u, k, col, fruit] of [[0.28, 1, "#F7A9C8", "#E8506A"], [0.62, 0.9, "#FFD66B", "#F29A3A"], [0.86, 0.72, "#9ED3A8", "#6BAE5F"]]) {
        const cx = x + w * u, bw = w * 0.2 * k, bot = y + h * 0.92, top = bot - h * 0.6 * k;
        s += `<path d="M${f1(cx - bw)} ${f1(top)} L${f1(cx - bw * 0.72)} ${f1(bot)} H${f1(cx + bw * 0.72)} L${f1(cx + bw)} ${f1(top)}Z" fill="${col}" fill-opacity="0.85" ${st(2.3)}/>` + circle(cx, top + (bot - top) * 0.52, bw * 0.34, fruit, st(1.8)) + ell(cx, top, bw, bw * 0.24, shade(col, 0.4), st(2.2)) + `<path d="M${f1(cx - bw * 0.6)} ${f1(top + 6)} L${f1(cx - bw * 0.45)} ${f1(bot - 4)}" ${st(2.2, "#FFFFFF")} opacity="0.6"/>`;
      }
      return s;
    },
    // ポテトチップス（なみの かたち）
    chips(x, y, w, h, c) {
      let s = "";
      for (const [u, v, a, k] of [[0.3, 0.3, -20, 1], [0.72, 0.36, 25, 0.9], [0.44, 0.7, -5, 1.1], [0.86, 0.78, 40, 0.75], [0.12, 0.86, 15, 0.7]]) {
        const cx = x + w * u, cy = y + h * v, rx = w * 0.23 * k, ry = rx * 0.7, n = 12, pts = [];
        for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2, rr = 1 + (i % 2 ? 0.08 : -0.04) + Math.sin(i * 1.7) * 0.03; pts.push([Math.cos(t) * rx * rr, Math.sin(t) * ry * rr]); }
        const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
        let d = `M${f1(mid(n - 1)[0])} ${f1(mid(n - 1)[1])}`; for (let i = 0; i < n; i++) d += ` Q${f1(pts[i][0])} ${f1(pts[i][1])} ${f1(mid(i)[0])} ${f1(mid(i)[1])}`;
        s += `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})"><path d="${d}Z" fill="#F6D36C" ${st(2.2)}/><path d="${d}Z" fill="none" stroke="#E3AE4A" stroke-width="${f1(rx * 0.14)}" opacity="0.5" transform="scale(0.84)"/><path d="M${f1(-rx * 0.55)} ${f1(-ry * 0.05)} Q0 ${f1(-ry * 0.5)} ${f1(rx * 0.55)} ${f1(-ry * 0.05)}" fill="none" ${st(1.6, "#E0B04A")}/>${ell(-rx * 0.35, -ry * 0.35, rx * 0.2, ry * 0.12, "#FFF3C4", `opacity="0.8"`)}${c ? [[-0.3, 0.2], [0.2, 0.3], [0.4, -0.2], [-0.1, -0.35], [0.1, 0.05]].map(([p, q]) => rect(p * rx - 1.4, q * ry - 1, 2.8, 2, 0.6, c)).join("") : circle(-rx * 0.3, ry * 0.2, 1.3, "#FFFFFF") + circle(rx * 0.25, ry * 0.3, 1.1, "#FFFFFF") + circle(rx * 0.05, -ry * 0.1, 1, "#FFFFFF")}</g>`;
      }
      return s;
    },
    // キャラメル ポップコーン
    popcorn(x, y, w, h) {
      let s = "";
      const kernel = (cx, cy, r, col) => [[0, 0, 1], [-0.7, 0.2, 0.7], [0.7, 0.2, 0.7], [0, -0.6, 0.72], [-0.4, 0.65, 0.6], [0.45, 0.62, 0.6]].map(([u, v, k]) => circle(cx + u * r, cy + v * r, r * k * 0.62, col, st(1.8))).join("") + circle(cx - r * 0.2, cy - r * 0.25, r * 0.18, "#FFFFFF", `opacity="0.7"`);
      for (let i = 0; i < 9; i++) { const u = 0.14 + ((i * 0.37) % 1) * 0.72, v = 0.2 + (Math.floor(i / 3) * 0.3), col = i % 3 === 1 ? "#FFF6DC" : i % 3 ? "#E7A64C" : "#D98E36"; s += kernel(x + w * u, y + h * v, Math.min(w, h) * 0.13, col); }
      return s;
    },
    // つつみの キャンディ
    candy(x, y, w, h, c) {
      const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.28;
      return `<path d="M${f1(cx - r)} ${f1(cy)} L${f1(x + 2)} ${f1(cy - r * 0.8)} L${f1(x + w * 0.1)} ${f1(cy)} L${f1(x + 2)} ${f1(cy + r * 0.8)}Z" fill="${shade(c, 0.35)}" ${st(2.2)}/><path d="M${f1(cx + r)} ${f1(cy)} L${f1(x + w - 2)} ${f1(cy - r * 0.8)} L${f1(x + w * 0.9)} ${f1(cy)} L${f1(x + w - 2)} ${f1(cy + r * 0.8)}Z" fill="${shade(c, 0.35)}" ${st(2.2)}/>` + ell(cx, cy, r * 1.15, r, c, st(2.4)) + `<path d="M${f1(cx - r * 0.6)} ${f1(cy - r * 0.7)} Q${f1(cx)} ${f1(cy)} ${f1(cx - r * 0.5)} ${f1(cy + r * 0.8)} M${f1(cx + r * 0.1)} ${f1(cy - r * 0.9)} Q${f1(cx + r * 0.7)} ${f1(cy)} ${f1(cx + r * 0.2)} ${f1(cy + r * 0.9)}" fill="none" ${st(2.2, "#FFFFFF")} opacity="0.85"/>`;
    },
    // しかくい チョコ（きんの つつみ）
    choco(x, y, w, h) {
      const s0 = Math.min(w, h) * 0.78, x0 = x + (w - s0) / 2, y0 = y + (h - s0) / 2;
      return rect(x0, y0, s0, s0, 4, "#F2C84B", st(2.6)) + rect(x0 + s0 * 0.14, y0 + s0 * 0.14, s0 * 0.72, s0 * 0.72, 3, "#7A4A30", st(2)) + [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].map(([u, v]) => rect(x0 + s0 * (u - 0.16), y0 + s0 * (v - 0.16), s0 * 0.3, s0 * 0.3, 2, "#94603F")).join("") + `<path d="M${f1(x0 + 4)} ${f1(y0 + s0 * 0.4)} L${f1(x0 + s0 * 0.4)} ${f1(y0 + 4)}" ${st(2.4, "#FFF6C8")}/>`;
    },
    // ソフト キャンディ（ほそながい つつみ）
    chewy(x, y, w, h, c) {
      const bw = w * 0.86, bh = h * 0.4, x0 = x + (w - bw) / 2, y0 = y + (h - bh) / 2;
      return rect(x0, y0, bw, bh, bh * 0.2, c, st(2.4)) + rect(x0, y0, bw * 0.16, bh, 2, shade(c, -0.18)) + rect(x0 + bw * 0.84, y0, bw * 0.16, bh, 2, shade(c, -0.18)) + `<path d="M${f1(x0 + bw * 0.16)} ${f1(y0)} V${f1(y0 + bh)} M${f1(x0 + bw * 0.84)} ${f1(y0)} V${f1(y0 + bh)}" ${st(1.8)}/>` + rect(x0 + bw * 0.3, y0 + bh * 0.25, bw * 0.4, bh * 0.5, bh * 0.2, "#FFFFFF", st(1.6)) + circle(x0 + bw * 0.5, y0 + bh / 2, bh * 0.14, c) + rect(x0, y0, bw, bh, bh * 0.2, "none", st(2.4));
    },
    // どうぶつ ビスケット（ライオン と うさぎ）
    animal(x, y, w, h) {
      const cx = x + w * 0.5, cy = y + h * 0.52, r = Math.min(w, h) * 0.3;
      let s = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return circle(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02, r * 0.32, "#E0A55C", st(1.8)); }).join("");
      s += circle(cx, cy, r, "#F2C58A", st(2.2)) + circle(cx - r * 0.35, cy - r * 0.1, r * 0.1, "#8E5A2E") + circle(cx + r * 0.35, cy - r * 0.1, r * 0.1, "#8E5A2E") + ell(cx, cy + r * 0.3, r * 0.22, r * 0.15, "#C98E4A");
      return s;
    },
    // こんぺいとう（とげとげの ほし）
    konpeito(x, y, w, h) {
      let s = "";
      for (const [u, v, k, col] of [[0.3, 0.36, 1, "#F7A9C8"], [0.68, 0.32, 0.9, "#FFE07A"], [0.5, 0.64, 1, "#FFFFFF"], [0.22, 0.74, 0.8, "#9ED3C6"], [0.8, 0.7, 0.85, "#C9B6EE"]]) s += `<path d="${starPath(x + w * u, y + h * v, w * 0.13 * k, w * 0.09 * k, 8)}" fill="${col}" ${st(1.8)}/>`;
      return s;
    },
  };

  // ---- けいひん 22しゅ ----
  // [key, なまえ, form, なかみ, いろ（ふくろ・おび・もじ）, キャラ, ふくろの ことば, [おなか, きぶん, HP], デザ（あまい）, せつめい]
  const LIST = [
    // 3本アーム（ふくろ）: 日がわりで 3しゅ
    ["gummy", "ぷにぷに グミ", "bag", "grape", ["#C8B2EC", "#8E6CC9", "#5B3F99"], "gachan", "ぶどう", [8, 14, 8], true, "ぶどうの あじの くまの グミ。ぷにぷに かむと たのしい。"],
    ["marsh", "ふわふわ マシュマロ", "bag", "marsh", ["#FBD7E3", "#F29BB8", "#C2607F"], "wanko", "ふわふわ", [8, 16, 8], true, "くちの なかで とける ふわふわの マシュマロ。"],
    ["cotton", "くもの わたあめ", "bag", "cotton", ["#CFEAF8", "#8EC5E8", "#3E6F99"], "gachan", "わたあめ", [5, 18, 6], true, "くもみたいな わたあめ。あまくて すぐに とけちゃう。"],
    ["senbei", "ぽりぽり おせんべい", "bag", "senbei", ["#FFF1D6", "#D9774A", "#8E3E1E"], "goji", "しょうゆ", [14, 10, 12], false, "のりを まいた しょうゆの おせんべい。ぽりぽり かたい。"],
    ["corn", "もこもこ コーン", "bag", "corn", ["#FFEFA8", "#F2B93B", "#9C6A12"], "wanko", "コーン", [12, 12, 10], false, "とうもろこしの スナック。もこもこ かるい。"],
    ["ramune", "しゅわしゅわ ラムネ", "bag", "ramune", ["#D6EFFA", "#5BAAD6", "#285A86"], "goji", "ラムネ", [5, 16, 6], true, "しゅわっと とける ラムネの つぶ。"],
    ["imo", "ほくほく おいも チップス", "bag", "imo", ["#E7D3F2", "#8E5CC4", "#4E2E7A"], "wanko", "おいも", [14, 14, 12], true, "さつまいもの あまい チップス。ほくほく かりかり。"],
    // 3本アーム（はこ）: 日がわりで 3しゅ
    ["choco", "ごじの チョコ ビスケット", "box", "biscuit", ["#C99A76", "#6E4230", "#5A3322"], "goji", "チョコ", [12, 18, 10], true, "ごじが だいすきな チョコの ビスケット。"],
    ["ichigo", "がちゃんの いちご チョコ", "box", "strawberry", ["#FBD3E0", "#E0668F", "#FFFFFF"], "gachan", "いちご", [10, 20, 8], true, "いちごの かたちの ピンクの チョコ。"],
    ["butter", "わんこの バター クッキー", "box", "bone", ["#FFF1C8", "#6AA6D1", "#FFFFFF"], "wanko", "クッキー", [12, 16, 10], true, "ほねの かたちの バター クッキー。わんこの おすすめ。"],
    ["donut", "ミニ ドーナツ", "box", "donut", ["#D9F2E8", "#5DB29B", "#FFFFFF"], "gachan", "ドーナツ", [14, 18, 12], true, "ひとくちの ドーナツが 6こ。カラフルな つぶつき。"],
    ["stick", "サクサク スティック", "box", "sticks", ["#FFE2A8", "#E4983A", "#FFFFFF"], "goji", "スティック", [10, 12, 8], false, "しおが きいた ほそい ぼうの おかし。"],
    // リングフック（リングつきの はこ）: 日がわりで 2しゅ
    ["waffle", "ふわふわ ワッフル", "ring", "waffle", ["#FFF1D6", "#D9A06A", "#7A4B2F"], "wanko", "ワッフル", [16, 18, 14], true, "ふんわり やいた ワッフル。はちみつの かおり。"],
    ["roll", "いちごの ロール ケーキ", "ring", "roll", ["#FFF6EE", "#F2A7C0", "#C2607F"], "gachan", "ロール", [16, 22, 14], true, "クリームと いちごの ロール ケーキ。"],
    ["jelly", "フルーツ ゼリー", "ring", "jelly", ["#DDF3F7", "#7FC6D6", "#2F7F95"], "goji", "ゼリー", [10, 18, 10], true, "3つの あじの ぷるぷる ゼリー。"],
    // スウィートランド（こつぶ）: 日がわりで 3しゅ
    ["candy", "つつみ キャンディ", "piece", "candy", ["#F7A9C8"], null, "", [3, 7, 4], true, "つつみの キャンディ。いちごの あじ。"],
    ["chocosq", "しかくい チョコ", "piece", "choco", ["#F2C84B"], null, "", [4, 8, 4], true, "きんいろの つつみの ひとくち チョコ。"],
    ["chewy", "もちもち キャンディ", "piece", "chewy", ["#FFB86B"], null, "", [4, 7, 4], true, "もちもち かむ オレンジの キャンディ。"],
    ["animal", "どうぶつ ビスケット", "piece", "animal", ["#F2C58A"], null, "", [5, 6, 5], true, "ライオンの かおの ちいさな ビスケット。"],
    ["konpeito", "こんぺいとう", "piece", "konpeito", ["#FFFFFF"], null, "", [3, 8, 4], true, "ほしの かたちの カラフルな さとうがし。"],
    // ビッグ おかし（おおきな ふくろ・2本アーム）: 日がわりで 1しゅ
    ["chips", "ビッグ ポテチ うすしお", "big", "chips", ["#FFE58A", "#E8506A", "#8E1E32"], "goji", "うすしお", [30, 26, 24], false, "おおきな ふくろの ポテトチップス。3にんで わけよう。"],
    ["nori", "ビッグ ポテチ のりしお", "big", "chips", ["#CDEBC0", "#3F8F4E", "#1E4F2A"], "wanko", "のりしお", [30, 26, 24], false, "あおのりの かおりの おおきな ポテトチップス。"],
    ["popcorn", "ビッグ ポップコーン", "big", "popcorn", ["#FFF1F1", "#E86F6F", "#8E2E2E"], "gachan", "キャラメル", [26, 30, 22], true, "キャラメル あじの ポップコーンが どっさり。"],
  ];
  // かたちごとの 大きさ（cm。w = はば・h = たかさ・d = あつさ）
  const SIZE = { bag: [12, 15, 4.6], box: [11, 7.5, 4.2], ring: [17, 8, 11], piece: [5.4, 5.4, 3.4], big: [26, 34, 9] };
  const PRICE = { bag: 120, box: 150, ring: 180, piece: 30, big: 320 };
  const ITEMS = LIST.map(([key, name, form, pic, col, who, word, [hunger, mood, hp], deza, desc]) => ({ key, id: "ike_snack_" + key, name, form, pic, col, who, word, hunger, mood, hp, deza, desc, size: SIZE[form] }));
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const BY_KEY = Object.fromEntries(ITEMS.map((it) => [it.key, it]));

  // ---- ふくろ（ぎざぎざの とじめ・よこが ふくらむ）----
  const zig = (x0, x1, y, amp, n) => { let d = ""; for (let i = 0; i <= n; i++) d += ` L${f1(x0 + ((x1 - x0) * i) / n)} ${f1(y + (i % 2 ? amp : 0))}`; return d; };
  const bagPath = (W, H) => { const s = H * 0.09, n = Math.max(8, Math.round(W / 9)); return `M4 ${f1(s)} L4 1${zig(4, W - 4, 1, 4, n)} L${W - 4} ${f1(s)} Q${W + 2} ${f1(H / 2)} ${W - 4} ${f1(H - s)} L${W - 4} ${H - 1}${zig(W - 4, 4, H - 1, -4, n)} L4 ${f1(H - s)} Q-2 ${f1(H / 2)} 4 ${f1(s)}Z`; };
  const seals = (W, H, band) => { const s = H * 0.09, n = Math.max(8, Math.round(W / 9)); let d = `<path d="M4 ${f1(s)} L4 1${zig(4, W - 4, 1, 4, n)} L${W - 4} ${f1(s)}Z" fill="${band}"/><path d="M${W - 4} ${f1(H - s)} L${W - 4} ${H - 1}${zig(W - 4, 4, H - 1, -4, n)} L4 ${f1(H - s)}Z" fill="${band}"/>`; for (let x = 10; x < W - 6; x += 7) d += `<path d="M${x} ${f1(s * 0.35)} V${f1(s * 0.85)} M${x} ${f1(H - s * 0.85)} V${f1(H - s * 0.35)}" ${st(1.2, shade(band, -0.25))}/>`; return d; };
  const banner = (x, y, w, h, word, col, fs) => rect(x, y, w, h, h * 0.45, "#FFFDF5", st(2.4)) + txt(x + w / 2, y + h * 0.72, fs || Math.min(h * 0.62, (w * 1.5) / Math.max(3, word.length)), word, col);
  const badge = (x, y, r) => circle(x, y, r, "#FF8FB8", st(2)) + txt(x, y + r * 0.34, r * 0.8, "Mee", "#FFFFFF");
  const bagFront = (it, W, H, big) => {
    const [c, band, ink] = it.col, P = PIC[it.pic];
    let s = `<path d="${bagPath(W, H)}" fill="${c}"/>` + seals(W, H, band);
    // おびの もよう（ななめの しま）
    s += `<path d="M4 ${f1(H * 0.62)} Q${f1(W / 2)} ${f1(H * 0.52)} ${W - 4} ${f1(H * 0.66)} V${f1(H * 0.78)} Q${f1(W / 2)} ${f1(H * 0.68)} 4 ${f1(H * 0.8)}Z" fill="${shade(band, 0.35)}" opacity="0.55"/>`;
    const bw = W * 0.8, bh = H * (big ? 0.12 : 0.15);
    s += banner((W - bw) / 2, H * 0.12, bw, bh, it.word, ink);
    s += big ? P(W * 0.08, H * 0.3, W * 0.52, H * 0.44, it.key === "nori" ? "#3F8F4E" : null) : P((W - bw) / 2 + 2, H * 0.3, W * 0.62, H * 0.42, null);
    s += mascot(it.who, W * (big ? 0.5 : 0.52), H * (big ? 0.46 : 0.52), W * (big ? 0.46 : 0.46), H * (big ? 0.4 : 0.36));
    if (big) s += `<path d="${starPath(W * 0.2, H * 0.84, W * 0.14, W * 0.09, 12)}" fill="#FFE07A" ${st(2.4)}/>` + txt(W * 0.2, H * 0.852, W * 0.056, "ビッグ", "#C2412B");
    s += badge(W * 0.14, H * 0.2, W * (big ? 0.06 : 0.075)) + shine(W * 0.16, H * 0.34, W * 0.1, H * 0.34);
    return s + `<path d="${bagPath(W, H)}" fill="none" ${st(big ? 4 : 3.2)}/>`;
  };
  const bagBack = (it, W, H) => {
    const [c, band] = it.col;
    let s = `<path d="${bagPath(W, H)}" fill="${shade(c, -0.06)}"/>` + seals(W, H, band);
    s += rect(W * 0.18, H * 0.2, W * 0.64, H * 0.34, 4, "#FFFFFF", st(2)) + [0.28, 0.35, 0.42, 0.49].map((v, i) => `<path d="M${f1(W * 0.24)} ${f1(H * v)} H${f1(W * (0.7 - (i % 2) * 0.12))}" ${st(1.8, "#C9C2B6")}/>`).join("");
    s += rect(W * 0.3, H * 0.62, W * 0.4, H * 0.14, 2, "#FFFFFF", st(1.6)) + Array.from({ length: 12 }, (_, i) => rect(W * 0.33 + i * W * 0.028, H * 0.64, i % 3 ? 1.2 : 2, H * 0.08, 0, K)).join("");
    s += txt(W / 2, H * 0.86, W * 0.08, "Meeときょれじゃ", shade(band, -0.3));
    return s + `<path d="${bagPath(W, H)}" fill="none" ${st(3.2)}/>`;
  };
  // ---- はこ ----
  const boxFront = (it, W, H) => {
    const [c, band, ink] = it.col, P = PIC[it.pic];
    let s = rect(1.5, 1.5, W - 3, H - 3, 5, c) + rect(1.5, H * 0.74, W - 3, H * 0.26 - 1.5, 4, band) + `<path d="M1.5 ${f1(H * 0.74)} H${W - 1.5}" ${st(2)}/>`;
    s += P(W * 0.34, H * 0.1, W * 0.4, H * 0.62);
    s += mascot(it.who, W * 0.02, H * 0.06, W * 0.34, H * 0.7);
    s += banner(W * 0.36, H * 0.76, W * 0.5, H * 0.2, it.word, ink === "#FFFFFF" ? band : ink, H * 0.14);
    s += badge(W * 0.88, H * 0.18, H * 0.12) + `<path d="M${f1(W * 0.06)} ${f1(H * 0.12)} H${f1(W * 0.3)}" ${st(3, "#FFFFFF")} opacity="0.5"/>`;
    return s + rect(1.5, 1.5, W - 3, H - 3, 5, "none", st(3));
  };
  const boxBack = (it, W, H) => {
    const [c, band] = it.col;
    let s = rect(1.5, 1.5, W - 3, H - 3, 5, shade(c, -0.05)) + rect(W * 0.1, H * 0.14, W * 0.5, H * 0.66, 3, "#FFFFFF", st(1.8));
    s += [0.28, 0.4, 0.52, 0.64].map((v) => `<path d="M${f1(W * 0.15)} ${f1(H * v)} H${f1(W * 0.54)}" ${st(1.6, "#C9C2B6")}/>`).join("") + Array.from({ length: 10 }, (_, i) => rect(W * 0.66 + i * W * 0.024, H * 0.3, i % 3 ? 1 : 1.8, H * 0.34, 0, K)).join("");
    return s + rect(1.5, H * 0.8, W - 3, H * 0.2 - 1.5, 3, band) + rect(1.5, 1.5, W - 3, H - 3, 5, "none", st(3));
  };
  const boxTop = (it, W, D) => {
    const [c, band, ink] = it.col;
    let s = rect(1.5, 1.5, W - 3, D - 3, 4, shade(c, 0.12)) + `<path d="M1.5 ${f1(D * 0.3)} H${W - 1.5} M1.5 ${f1(D * 0.7)} H${W - 1.5}" ${st(D * 0.14, shade(band, 0.3))} opacity="0.7"/>`;
    s += txt(W / 2, D * 0.62, Math.min(D * 0.36, (W * 0.78) / Math.max(3, it.word.length)), it.word, ink === "#FFFFFF" ? band : ink, `stroke="#FFFFFF" stroke-width="2.4" paint-order="stroke"`);
    return s + rect(1.5, 1.5, W - 3, D - 3, 4, "none", st(3));
  };
  const boxSide = (it, D, H) => {
    const [c, band] = it.col;
    return rect(1.5, 1.5, D - 3, H - 3, 4, shade(c, -0.1)) + rect(1.5, H * 0.74, D - 3, H * 0.26 - 1.5, 3, shade(band, -0.1)) + star(D / 2, H * 0.4, Math.min(D, H) * 0.2, "#FFFFFF", `opacity="0.7"`) + rect(1.5, 1.5, D - 3, H - 3, 4, "none", st(3));
  };
  // ---- こつぶ（スウィートランド。まえ と うしろ）----
  const pieceFront = (it, S) => PIC[it.pic](4, 4, S - 8, S - 8, it.col[0]);
  const pieceBack = (it, S) => `<g transform="translate(${S} 0) scale(-1 1)">${PIC[it.pic](4, 4, S - 8, S - 8, shade(it.col[0], -0.08))}</g>`;

  // クレーンの テクスチャ: look = "snack-<key>"（ふくろ・おおきな ふくろ: front/back/side/rim・はこ: front/back/top/side・こつぶ: front/back）
  const tex = {}, texSize = {};
  const unit = 10;
  for (const it of ITEMS) {
    const L = "snack-" + it.key, [w, h, d] = it.size, W = Math.round(w * unit), H = Math.round(h * unit), D = Math.round(d * unit);
    if (it.form === "bag" || it.form === "big") {
      const big = it.form === "big";
      tex[L + "-front"] = () => wrap(W, H, bagFront(it, W, H, big)); tex[L + "-back"] = () => wrap(W, H, bagBack(it, W, H));
      tex[L + "-side"] = () => wrap(W, H, `<path d="${bagPath(W, H)}" fill="${shade(it.col[0], -0.18)}" stroke="${shade(it.col[0], -0.18)}" stroke-width="3.2"/>`);
      tex[L + "-rim"] = () => wrap(W, H, `<path d="${bagPath(W, H)}" fill="${shade(it.col[0], -0.3)}" ${st(5)}/>`);
      const px = big ? [256, 336] : [176, 220]; texSize[L + "-front"] = px; texSize[L + "-back"] = px; texSize[L + "-side"] = [Math.round(px[0] / 2), Math.round(px[1] / 2)]; texSize[L + "-rim"] = texSize[L + "-side"];
    } else if (it.form === "box" || it.form === "ring") {
      tex[L + "-front"] = () => wrap(W, H, boxFront(it, W, H)); tex[L + "-back"] = () => wrap(W, H, boxBack(it, W, H));
      tex[L + "-top"] = () => wrap(W, D, boxTop(it, W, D)); tex[L + "-side"] = () => wrap(D, H, boxSide(it, D, H));
      const k = it.form === "ring" ? 1.2 : 1.6; texSize[L + "-front"] = [Math.round(W * k), Math.round(H * k)]; texSize[L + "-back"] = texSize[L + "-front"]; texSize[L + "-top"] = [Math.round(W * k), Math.round(D * k)]; texSize[L + "-side"] = [Math.round(D * k), Math.round(H * k)];
    } else {
      const S = 64; tex[L + "-front"] = () => wrap(S, S, pieceFront(it, S)); tex[L + "-back"] = () => wrap(S, S, pieceBack(it, S)); texSize[L + "-front"] = [96, 96]; texSize[L + "-back"] = [96, 96];
    }
  }
  // 館の 台の なかの 絵・けっかの まど（まえの 絵）。ratio = よこ / たて
  const svg = (id) => { const it = INDEX[id]; return it ? tex["snack-" + it.key + "-front"]() : ""; };
  const ratio = (id) => { const it = INDEX[id]; return !it ? 1 : it.form === "piece" ? 1 : it.size[0] / it.size[1]; };
  // もちものの 絵（64×64）: まえの 絵を まんなかに（はこは うえの めんも すこし）
  const food = (it) => {
    const [w, h] = it.size, W = Math.round(w * unit), H = Math.round(h * unit), L = "snack-" + it.key, inner = tex[L + "-front"]().replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    if (it.form === "piece") return `<svg x="2" y="2" width="60" height="60" viewBox="0 0 64 64">${inner}</svg>`;
    const k = Math.min(56 / W, 58 / H), fw = W * k, fh = H * k, x = (64 - fw) / 2, y = (64 - fh) / 2 + (it.form === "bag" || it.form === "big" ? 0 : 5);
    const top = it.form === "box" || it.form === "ring" ? `<path d="M${f1(x + 2)} ${f1(y + 1)} L${f1(x + 8)} ${f1(y - 7)} H${f1(x + fw + 4)} L${f1(x + fw - 2)} ${f1(y + 1)}Z" fill="${shade(it.col[0], 0.18)}" ${st(2)}/><path d="M${f1(x + fw - 2)} ${f1(y + 1)} L${f1(x + fw + 4)} ${f1(y - 7)} V${f1(y + fh - 8)} L${f1(x + fw - 2)} ${f1(y + fh)}Z" fill="${shade(it.col[0], -0.15)}" ${st(2)}/>` : "";
    return top + `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(fw)}" height="${f1(fh)}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
  };
  const install = () => {
    for (const it of ITEMS) {
      const f = { id: it.id, name: it.name, price: PRICE[it.form], hunger: it.hunger, mood: it.mood, hp: it.hp, rare: true, exclusive: "ikebukuro", arcadePrize: true, desc: it.desc, ...(it.deza ? { deza: true } : {}) };
      FOODS.push(f); BAG_INDEX[it.id] = { ...f, kind: "food" }; FOOD_ART[it.id] = food(it);
    }
    Object.assign(CraneArt.TEX, tex); Object.assign(CraneArt.SIZE, texSize);
  };
  return { ITEMS, INDEX, BY_KEY, SIZE, PIC, svg, ratio, heroSvg, install, tex };
})();
SnackArt.install();
