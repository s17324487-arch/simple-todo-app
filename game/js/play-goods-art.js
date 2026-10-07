// あそびどうぐ・ほん・ドリルの 絵（UI-105・js/play-goods.js）。3人が 手に もつ ところ（WEAR。もちもの outfit.hand）。
// ・手の ばしょは HandItems.hand（まえ・よこは みぎ手、うしろむきは はんたいがわ）。絵は 手を (0, 0)・そとがわを +x に 描いて、うしろむきは かがみに する。
//   うしろむきは うらがわ（トランプの うら・ほんの うらびょうし・ドリルの なまえの らん）を 描く（もじは かがみに ならない）。
// ・絵の はしが キャラの 絵の わく（x −10〜210・y −40〜220）から でない ように、手の ばしょを うちがわへ よせる（ごじの 手は そとがわに ある）。
// ・線は INK・パステルの ぬり。キーは id ごと（ふくと おなじ。SvgCache の キーは かわらない）。
const PlayGoodsArt = (() => {
  const K = INK;
  const SK = (w) => stroke(w);
  const R = (x, y, w, h, r, fill, sw = 2.2) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(r)}" fill="${fill}" ${sw ? SK(sw) : 'stroke="none"'}/>`;
  const C = (x, y, r, fill, sw = 1.8) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${fill}" ${sw ? SK(sw) : 'stroke="none"'}/>`;
  const E = (x, y, rx, ry, fill, sw = 1.8, rot = 0) => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}"${rot ? ` transform="rotate(${rot} ${f2(x)} ${f2(y)})"` : ""} fill="${fill}" ${sw ? SK(sw) : 'stroke="none"'}/>`;
  const P = (d, fill, sw = 2) => `<path d="${d}" fill="${fill}" ${sw ? SK(sw) : 'stroke="none"'}/>`;
  const L = (d, col, w, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ""}/>`;
  const T = (x, y, size, text, fill, weight = 900) => `<text x="${f2(x)}" y="${f2(y)}" text-anchor="middle" font-size="${f2(size)}" font-weight="${weight}" font-family="sans-serif" fill="${fill}" stroke="none">${text}</text>`;
  const G = (tr, s) => `<g transform="${tr}">${s}</g>`;
  const shine = (x, y, w, h) => L(`M${f2(x)},${f2(y + h)} Q${f2(x)},${f2(y)} ${f2(x + w)},${f2(y)}`, "#FFFFFF", 1.6, 0.75);

  // ---- トランプの マーク ----
  const suit = (kind, x, y, col) => {
    if (kind === "heart") return `<path d="${heartPath(x, y - 0.6, 0.5)}" fill="${col}"/>`;
    if (kind === "diamond") return `<path d="M${f2(x)},${f2(y - 3.6)} L${f2(x + 2.7)},${f2(y)} L${f2(x)},${f2(y + 3.6)} L${f2(x - 2.7)},${f2(y)} Z" fill="${col}"/>`;
    if (kind === "spade") return `<path d="M${f2(x)},${f2(y - 3.8)} C${f2(x - 4.4)},${f2(y - 0.6)} ${f2(x - 3.6)},${f2(y + 2.6)} ${f2(x - 1.2)},${f2(y + 1.8)} L${f2(x - 1.8)},${f2(y + 3.8)} H${f2(x + 1.8)} L${f2(x + 1.2)},${f2(y + 1.8)} C${f2(x + 3.6)},${f2(y + 2.6)} ${f2(x + 4.4)},${f2(y - 0.6)} ${f2(x)},${f2(y - 3.8)} Z" fill="${col}"/>`;
    return [[0, -1.8], [-2, 0.8], [2, 0.8]].map(([dx, dy]) => `<circle cx="${f2(x + dx)}" cy="${f2(y + dy)}" r="1.75" fill="${col}"/>`).join("") + `<path d="M${f2(x)},${f2(y)} L${f2(x - 1.4)},${f2(y + 3.8)} H${f2(x + 1.4)} Z" fill="${col}"/>`;
  };
  // ---- ゲームきの じゅうじキー ----
  const cross = (x, y, a, l, col) => `<path d="M${f2(x - l)},${f2(y - a)} H${f2(x - a)} V${f2(y - l)} H${f2(x + a)} V${f2(y - a)} H${f2(x + l)} V${f2(y + a)} H${f2(x + a)} V${f2(y + l)} H${f2(x - a)} V${f2(y + a)} H${f2(x - l)} Z" fill="${col}"/>`;
  // ---- いろあわせ キューブ（ななめ上から 3めん・3×3）----
  const cubeFaces = (cx, cy, s, cols) => {
    const h = 0.866 * s, A = [cx, cy - s], B = [cx + h, cy - s / 2], Cc = [cx, cy], D = [cx - h, cy - s / 2], Ee = [cx, cy + s], F = [cx - h, cy + s / 2], Gg = [cx + h, cy + s / 2];
    const faces = [[D, A, B, Cc], [F, D, Cc, Ee], [Ee, Cc, B, Gg]]; // うえ・ひだり・みぎ（p0 → p1 → p2 → p3 の じゅんの 4かく）
    const at = (q, u, v) => { const [p0, p1, p2, p3] = q, a = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u], b = [p3[0] + (p2[0] - p3[0]) * u, p3[1] + (p2[1] - p3[1]) * u]; return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]; };
    let out = "";
    faces.forEach((q, fi) => {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const pts = [at(q, i / 3, j / 3), at(q, (i + 1) / 3, j / 3), at(q, (i + 1) / 3, (j + 1) / 3), at(q, i / 3, (j + 1) / 3)];
        out += `<path d="M${pts.map((p) => f2(p[0]) + "," + f2(p[1])).join(" L")} Z" fill="${cols[fi][i * 3 + j]}" stroke="${K}" stroke-width="0.9" stroke-linejoin="round"/>`;
      }
      out += `<path d="M${q.map((p) => f2(p[0]) + "," + f2(p[1])).join(" L")} Z" fill="none" ${SK(1.8)}/>`;
    });
    return out;
  };

  // ===== あそびどうぐ（手が (0, 0)・そとがわが +x。back = うしろむき）=====
  // 手の さきから はみだす はんい [x0, x1, y0, y1]（わくに おさめる ため）
  const TOY = {
    // トランプ: 4まいを おうぎに ひらいて もつ（うしろむきは うらの もよう）
    cards: {
      box: [-14, 18, -26, 5],
      draw: (back) => [["heart", "#E53935"], ["spade", K], ["diamond", "#E53935"], ["club", K]].map(([kind, col], i) => {
        const a = [-28, -10, 8, 26][i];
        const face = back
          ? R(-6.4, -19, 12.8, 19, 2.6, "#4F6FB5", 1.8) + `<path d="M-4.2,-16.8 L4.2,-2.2 M4.2,-16.8 L-4.2,-2.2 M-4.2,-9.5 L0,-16.8 L4.2,-9.5 L0,-2.2 Z" fill="none" stroke="#C9D6F2" stroke-width="1"/>` + suit("diamond", 0, -9.5, "#E53935")
          : R(-6.4, -19, 12.8, 19, 2.6, "#FFFFFF", 1.8) + suit(kind, 0, -10.5, col) + `<circle cx="-3.8" cy="-16.2" r="0.9" fill="${col}"/>`;
        return G(`translate(3 4) rotate(${a})`, face);
      }).join(""),
    },
    // なわとび: とっての 2ほんを いっしょに もって、なわが したへ わに さがる
    rope: {
      box: [-9, 30, -4, 44],
      draw: () => {
        const rope = "M2.6,14 C-6,34 4,42 12,42 C20,42 28,32 12.6,14";
        const handle = (a, dx) => G(`translate(${dx} 0) rotate(${a})`, R(-2.8, -3, 5.6, 17, 2.8, "#F4D9A6", 1.8) + R(-2.8, 9.4, 5.6, 5, 2.2, "#F06292", 1.6));
        return L(rope, K, 4.4) + L(rope, "#F48FB1", 2.4) + handle(8, 0) + handle(-6, 10);
      },
    },
    // シャボンだま: ボトルと わっかの ぼう・ふわっと うかぶ たま
    bubbles: {
      box: [-7, 33, -48, 13],
      draw: () => {
        const bub = (x, y, r) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#EAF6FC" fill-opacity=".5" stroke="${K}" stroke-opacity=".5" stroke-width="1.3"/>` + L(`M${f2(x - r * 0.55)},${f2(y - r * 0.1)} Q${f2(x - r * 0.45)},${f2(y - r * 0.6)} ${f2(x)},${f2(y - r * 0.7)}`, "#FFFFFF", 1.2);
        const wand = L("M3,-5 L10,-19", K, 3.2) + L("M3,-5 L10,-19", "#9AD0EC", 1.6) + `<circle cx="11.6" cy="-22.6" r="3.8" fill="none" ${SK(1.8)}/>`;
        const bottle = R(-5, -3, 11, 15, 3.4, "#F8BBD0", 1.8) + R(-3.4, -6.4, 7.8, 4.2, 1.6, "#FFFFFF", 1.6) + L("M-2.6,1.4 V8", "#FFFFFF", 1.6, 0.8);
        return wand + bottle + bub(21, -30, 5.2) + bub(28, -41, 3.6) + bub(16, -42, 2.6);
      },
    },
    // ゲームき: よこながの けいたい ゲーム（がめんに ちいさな キャラ・じゅうじキー・ボタン 2つ）
    game: {
      box: [-6, 34, -18, 12],
      draw: (back) => {
        const body = "#9FD9C8";
        if (back) return G("rotate(-10)", R(-3, -10, 34, 20, 7, body, 2.2) + R(3, -6, 22, 12, 4, shade(body, -0.08), 1.4) + C(8, -10.6, 1.6, shade(body, -0.25), 1) + C(22, -10.6, 1.6, shade(body, -0.25), 1));
        const screen = R(8.4, -6.6, 13, 11.4, 2, "#34405E", 1.6) + `<path d="M9.6,2.4 H20.2" stroke="#7FD18B" stroke-width="1.6"/>` + C(13.6, -0.4, 2.3, "#F8BBD0", 0) + `<circle cx="12.8" cy="-0.8" r="0.5" fill="${K}"/><circle cx="14.5" cy="-0.8" r="0.5" fill="${K}"/>` + `<path d="${starPath(18.4, -3.4, 1.6, 0.7)}" fill="#FFE082"/>`;
        return G("rotate(-10)", R(-3, -10, 34, 20, 7, body, 2.2) + shine(0, -7, 6, 4) + screen + cross(2.4, 0, 1.2, 3.6, K) + C(25.4, -2.4, 1.9, "#F06292", 1.2) + C(28.8, 1.8, 1.9, "#FFD54F", 1.2) + R(11.6, 6.2, 6.4, 1.8, 0.9, shade(body, -0.25), 0));
      },
    },
    // けんだま: けんを にぎって、ひもの さきに あかい たま
    kendama: {
      box: [-17, 23, -27, 35],
      draw: () => {
        const wood = "#F0D29E", dk = "#D7AE6E", ball = "#E53935";
        return L("M0,-6 C10,-1 16,9 14,19", K, 1.2)
          + R(-2.6, -18, 5.2, 30, 2.4, wood, 1.8) + P("M-1.8,-18 L0,-25 L1.8,-18 Z", wood, 1.6)
          + R(-12, -12.6, 24, 5, 2, wood, 1.8) + P("M-15.4,-14.6 C-15.4,-8 -8.8,-8 -8.8,-14.6 Z", dk, 1.6) + P("M9,-13.8 C9,-8.6 14.4,-8.6 14.4,-13.8 Z", dk, 1.6)
          + P("M-4.4,12 C-4.4,16.4 4.4,16.4 4.4,12 Z", dk, 1.6)
          + C(14, 26, 7, ball, 2) + `<circle cx="16.4" cy="22.6" r="1.5" fill="${K}"/>` + L("M9.6,24.4 Q10.4,20.6 13.6,19.8", "#FFFFFF", 1.6, 0.8);
      },
    },
    // こま: きの こまに あかと みどりの しま・まいた ひも
    koma: {
      box: [-7, 26, -11, 25],
      draw: () => {
        const cx = 12, t = -3;
        const str = "M0,0 C-5,9 4,15 -1,23";
        return L(str, K, 3) + L(str, "#F7EEDB", 1.5)
          + P(`M${cx - 12},${t} C${cx - 12},${t + 7} ${cx - 3},${t + 12} ${cx},${t + 18} C${cx + 3},${t + 12} ${cx + 12},${t + 7} ${cx + 12},${t} Z`, "#F0D29E", 2)
          + L(`M${cx - 10.4},${t + 3.4} C${cx - 5},${t + 7.4} ${cx + 5},${t + 7.4} ${cx + 10.4},${t + 3.4}`, "#E53935", 2.4)
          + L(`M${cx - 6.4},${t + 9} C${cx - 3},${t + 11.4} ${cx + 3},${t + 11.4} ${cx + 6.4},${t + 9}`, "#4CAF7A", 2.2)
          + E(cx, t, 12, 4, "#F4DDB0", 2) + `<ellipse cx="${cx}" cy="${t}" rx="7.6" ry="2.4" fill="none" stroke="#E53935" stroke-width="1.4"/><ellipse cx="${cx}" cy="${t}" rx="3.6" ry="1.1" fill="none" stroke="#4CAF7A" stroke-width="1.3"/>`
          + R(cx - 1.6, t - 6.4, 3.2, 5.4, 1.4, "#C9A46A", 1.4) + L(`M${cx},${t + 18} V${t + 22}`, K, 2.2);
      },
    },
    // おてだま: ちりめんの ちいさな ふくろ 3つ
    otedama: {
      box: [-6, 26, -21, 13],
      draw: () => {
        const bag = (x, y, c, rot) => G(`translate(${x} ${y}) rotate(${rot})`, P("M-6,-5 C-3,-6.6 3,-6.6 6,-5 C7.4,-2 7.4,2 6,5 C3,6.6 -3,6.6 -6,5 C-7.4,2 -7.4,-2 -6,-5 Z", c, 1.8)
          + [[-2.6, -1.8], [2.4, -2.4], [0.2, 2.2], [-3.2, 2.6], [3.4, 2]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="0.9" fill="#FFFFFF"/>`).join("")
          + `<path d="M-6,-5 l2,2 M6,-5 l-2,2 M-6,5 l2,-2 M6,5 l-2,-2" stroke="${shade(c, -0.28)}" stroke-width="1.2" stroke-linecap="round"/>`);
        return bag(15, -13, "#5C8FD6", 14) + bag(16, 4, "#F2C14E", 10) + bag(4, 1, "#E8545E", -8);
      },
    },
    // リバーシ: みどりの ばんを かどで もって さげる（まんなかに くろ 2・しろ 2）
    reversi: {
      box: [-6, 27, -7, 27],
      draw: (back) => {
        if (back) return G("rotate(6)", R(-2, -3, 26, 26, 3, "#D7AE6E", 2.2) + R(-0.4, 19.6, 22.8, 2, 1, "#3FA36B", 0) + R(1, -1, 20, 3, 1, "#C9A46A", 0) + L("M2,11 H22", "#C9A46A", 1.4));
        let s = R(-2, -3, 26, 26, 3, "#3FA36B", 2.2);
        for (let i = 1; i < 4; i++) s += L(`M${f2(-2 + i * 6.5)},-1.6 V21.6 M-0.6,${f2(-3 + i * 6.5)} H22.6`, "#2E7D4F", 1);
        s += [[7.75, 6.75, K], [14.25, 6.75, "#FFFFFF"], [7.75, 13.25, "#FFFFFF"], [14.25, 13.25, K]].map(([x, y, c]) => C(x, y, 2.6, c, 1.2)).join("");
        return G("rotate(6)", s);
      },
    },
    // すごろく: はこの ふたに くねくねの マスと あかい 1の サイコロ
    sugoroku: {
      box: [-5, 31, -8, 21],
      draw: (back) => {
        if (back) return R(-2, -4, 30, 22, 3, "#FFF3D6", 2.2) + R(10, -4, 6, 22, 0, "#F48FB1", 0) + R(-2, -4, 30, 22, 3, "none", 2.2);
        const sq = [[2, -1], [7, -1.6], [12, -1], [17, -1.6], [22, -0.4], [22.6, 4.4], [17.6, 5.4], [12.6, 5], [7.6, 5.6], [3, 7.6], [3.4, 12.6], [8.4, 13]];
        const cols = ["#F48FB1", "#9AD0EC", "#FFD54F", "#A5D6A7"];
        return R(-2, -4, 30, 22, 3, "#FFF3D6", 2.2) + sq.map(([x, y], i) => R(x - 1.8, y - 1.8, 3.6, 3.6, 0.8, cols[i % 4], 0.9)).join("")
          + `<path d="${starPath(12.8, 13.4, 2.6, 1.1)}" fill="#FFB300" ${SK(0.9)}/>` + R(17.4, 8.6, 9.6, 9.6, 2.2, "#FFFFFF", 1.6) + C(22.2, 13.4, 1.8, "#E53935", 0);
      },
    },
    // いろあわせ キューブ: 3×3 の いろの キューブ（まだ そろって いない）
    cube: {
      box: [-1, 25, -14, 12],
      draw: () => cubeFaces(12, -1, 11.6, [
        ["#FFFFFF", "#FFD54F", "#FFFFFF", "#E53935", "#FFD54F", "#4F8FD8", "#FFD54F", "#FFFFFF", "#6DBE5B"],
        ["#E53935", "#F28C38", "#E53935", "#6DBE5B", "#E53935", "#F28C38", "#4F8FD8", "#E53935", "#FFD54F"],
        ["#4F8FD8", "#4F8FD8", "#6DBE5B", "#F28C38", "#4F8FD8", "#FFFFFF", "#4F8FD8", "#6DBE5B", "#4F8FD8"],
      ]),
    },
  };

  // ===== ほん（ひょうしの いろと えで みわける。うしろむきは うらびょうし）=====
  const EMB = {
    dino: (x, y) => P(`M${x - 7.6},${y + 4.4} C${x - 8},${y} ${x - 3},${y - 1.6} ${x + 0.4},${y - 1} C${x + 2.2},${y - 5.4} ${x + 3.4},${y - 8.4} ${x + 5.6},${y - 8.6} C${x + 7.8},${y - 8.8} ${x + 8.4},${y - 6.6} ${x + 6.8},${y - 5.8} C${x + 5.4},${y - 5} ${x + 5.2},${y - 1} ${x + 4.6},${y + 1.6} C${x + 6},${y + 2.4} ${x + 8.8},${y + 3} ${x + 9.6},${y + 4.4} Z`, "#3E7D4A", 1.1)
      + `<path d="M${f2(x - 5)},${f2(y + 4.2)} v3 M${f2(x - 1.4)},${f2(y + 4.2)} v3 M${f2(x + 1.8)},${f2(y + 4.2)} v3" stroke="#3E7D4A" stroke-width="2" stroke-linecap="round"/>` + `<circle cx="${f2(x + 6)}" cy="${f2(y - 7.2)}" r="0.7" fill="#FFFFFF"/>`,
    fish: (x, y) => P(`M${x + 4},${y} C${x + 1},${y - 4.6} ${x - 6},${y - 4.6} ${x - 7.6},${y} C${x - 6},${y + 4.6} ${x + 1},${y + 4.6} ${x + 4},${y} L${x + 8.4},${y - 3.6} L${x + 8.4},${y + 3.6} Z`, "#FFB74D", 1.2) + `<circle cx="${f2(x - 4)}" cy="${f2(y - 0.8)}" r="0.9" fill="${K}"/>` + L(`M${f2(x - 1)},${f2(y - 2.6)} Q${f2(x + 0.6)},${f2(y)} ${f2(x - 1)},${f2(y + 2.6)}`, "#E8954A", 1),
    space: (x, y) => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="9" ry="2.6" transform="rotate(-18 ${f2(x)} ${f2(y)})" fill="none" stroke="#FFE082" stroke-width="1.8"/>` + C(x, y, 4.6, "#FFB74D", 1.2) + L(`M${f2(x - 8.6)},${f2(y + 2.6)} Q${f2(x)},${f2(y + 1)} ${f2(x + 8.4)},${f2(y - 3.4)}`, "#FFE082", 1.8) + `<path d="${starPath(x - 6, y - 6.4, 1.9, 0.8)}" fill="#FFE082"/><path d="${starPath(x + 6.6, y + 6, 1.5, 0.6)}" fill="#FFE082"/>`,
    animal: (x, y) => E(x, y + 2.4, 4.2, 3.4, "#8D5A3B", 0) + [[-4.6, -2.2], [-1.7, -4.6], [1.7, -4.6], [4.6, -2.2]].map(([dx, dy]) => C(x + dx, y + dy, 1.7, "#8D5A3B", 0)).join(""),
    peach: (x, y) => P(`M${x},${y + 6} C${x - 7.4},${y + 4} ${x - 7.4},${y - 5.4} ${x - 1},${y - 5.2} C${x - 0.2},${y - 3.6} ${x + 0.2},${y - 3.6} ${x + 1},${y - 5.2} C${x + 7.4},${y - 5.4} ${x + 7.4},${y + 4} ${x},${y + 6} Z`, "#F8A5B6", 1.2) + L(`M${f2(x)},${f2(y + 5.4)} Q${f2(x - 1.6)},${f2(y)} ${f2(x)},${f2(y - 3.8)}`, "#E88A9E", 1.1) + E(x + 3, y - 6.4, 2.8, 1.4, "#7FBE5A", 1, -24),
    moon: (x, y) => P(`M${x + 1},${y - 6.6} C${x - 5.4},${y - 6} ${x - 6.6},${y + 4.6} ${x + 0.6},${y + 6.4} C${x - 2.6},${y + 3} ${x - 2.4},${y - 3.6} ${x + 1},${y - 6.6} Z`, "#FFE082", 1.1) + `<path d="${starPath(x + 4.6, y - 1, 3.4, 1.5)}" fill="#FFE082" ${SK(0.9)}/>`,
    riddle: (x, y) => C(x, y, 6.8, "#FFFFFF", 1.2) + T(x, y + 4.4, 12, "？", K),
    manga: (x, y) => R(x - 7.4, y - 7, 6.6, 6.2, 0.8, "#FFFFFF", 1) + R(x + 0.8, y - 7, 6.6, 6.2, 0.8, "#FFFFFF", 1) + R(x - 7.4, y + 0.6, 14.8, 6.6, 0.8, "#FFFFFF", 1)
      + E(x + 4, y + 3.8, 3.4, 2.2, "#FFFFFF", 0.9) + T(x + 4, y + 5.2, 4, "!", K) + C(x - 4, y - 3.6, 1.6, "#F8BBD0", 0) + `<path d="M${f2(x + 2)},${f2(y - 2)} l2,-3 l2,3 Z" fill="#9AD0EC"/>`,
    recipe: (x, y) => R(x + 3.4, y + 0.2, 6, 2, 1, "#8D6E63", 0.9) + C(x - 1, y + 1, 5, "#5D6D7E", 1.2) + P(`M${x - 4.4},${y + 0.6} C${x - 4},${y - 2.6} ${x + 1.4},${y - 3} ${x + 2},${y} C${x + 2.4},${y + 3} ${x - 1},${y + 3.6} ${x - 2.6},${y + 3} C${x - 4.4},${y + 3} ${x - 4.6},${y + 1.6} ${x - 4.4},${y + 0.6} Z`, "#FFFFFF", 0) + C(x - 1.2, y + 0.4, 1.6, "#FFC93C", 0),
    maze: (x, y) => R(x - 7, y - 7, 14, 14, 1.4, "#FFFFFF", 1) + L(`M${f2(x - 4.4)},${f2(y - 7)} V${f2(y + 4.4)} H${f2(x + 4.4)} V${f2(y - 4.4)} H${f2(x - 1.6)} V${f2(y + 1.6)} H${f2(x + 1.6)}`, K, 1.2) + C(x - 5.6, y - 5.2, 0.9, "#E53935", 0) + `<path d="${starPath(x + 0, y - 0.6, 1.5, 0.6)}" fill="#FFB300"/>`,
  };
  const book = (cover, emb, zukan) => ({
    box: [-6, 22, -19, 15],
    draw: (back) => {
      const x0 = -3, y0 = -16, w = 22, h = 28;
      let s = R(x0 + 1.8, y0 + 1.6, w, h, 2.6, "#FFFDF5", 1.6) + R(x0, y0, w, h, 2.6, cover, 2.2) + R(x0, y0, 4.2, h, 1.6, shade(cover, -0.18), 1.6);
      if (back) s += R(x0 + 9, y0 + 18, 9, 5.4, 1, "#FFFFFF", 1.1) + L(`M${x0 + 10.6},${y0 + 19.4} v2.6 M${x0 + 12.4},${y0 + 19.4} v2.6 M${x0 + 13.6},${y0 + 19.4} v2.6 M${x0 + 15.6},${y0 + 19.4} v2.6`, K, 0.7);
      else {
        s += R(x0 + 7, y0 + 3, 12.4, 4.4, 1.6, "#FFFFFF", 1.1) + L(`M${x0 + 9},${y0 + 5.2} H${x0 + 17.4}`, shade(cover, -0.3), 1);
        s += EMB[emb](x0 + w / 2 + 2.1, y0 + h / 2 + 2.2);
        if (zukan) s += R(x0 + 6.4, y0 + h - 5.4, 13.6, 3.4, 1.2, "#FFD54F", 0.9);
      }
      return G("rotate(7)", s);
    },
  });
  // ===== ドリル（こくご は あか・さんすう／すうがく は あお。まんなかの まるに もじ・きごう）=====
  const GLYPH = {
    a: (x, y, c) => T(x, y + 3.6, 9.6, "あ", c),
    ka: (x, y, c) => T(x, y + 3.6, 9.6, "ア", c),
    kan: (x, y, c) => T(x, y + 3.5, 9, "漢", c),
    kotoba: (x, y, c) => T(x, y + 1.9, 4.6, "ことば", c),
    bun: (x, y, c) => T(x, y + 3.5, 9, "文", c),
    plus: (x, y, c) => L(`M${f2(x - 3.6)},${f2(y)} H${f2(x + 3.6)} M${f2(x)},${f2(y - 3.6)} V${f2(y + 3.6)}`, c, 2.4),
    minus: (x, y, c) => L(`M${f2(x - 3.8)},${f2(y)} H${f2(x + 3.8)}`, c, 2.4),
    times: (x, y, c) => L(`M${f2(x - 3)},${f2(y - 3)} L${f2(x + 3)},${f2(y + 3)} M${f2(x + 3)},${f2(y - 3)} L${f2(x - 3)},${f2(y + 3)}`, c, 2.4),
    clock: (x, y, c) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="4.4" fill="none" stroke="${c}" stroke-width="1.4"/>` + L(`M${f2(x)},${f2(y - 3)} V${f2(y)} L${f2(x + 2.2)},${f2(y + 1.2)}`, c, 1.4),
    math: (x, y, c) => T(x - 0.6, y + 2.8, 7.4, "x²", c, 800),
  };
  const drill = (subject, label, glyph) => ({
    box: [-6, 21, -20, 15],
    draw: (back) => {
      const col = subject === "kokugo" ? "#EF7C8E" : "#5B9BE0", x0 = -3, y0 = -17, w = 22, h = 30;
      const band = P(`M${x0},${y0 + 9} V${y0 + 2.2} Q${x0},${y0} ${x0 + 2.2},${y0} H${x0 + w - 2.2} Q${x0 + w},${y0} ${x0 + w},${y0 + 2.2} V${y0 + 9} Z`, col, 0);
      let s = R(x0 + 1.4, y0 + 1.2, w, h, 2, "#FFFFFF", 1.4) + R(x0, y0, w, h, 2, "#FFFDF5", 0) + band;
      if (back) s += R(x0 + 3.6, y0 + h - 9.4, w - 7.2, 5.4, 1, "#FFFFFF", 1.1) + L(`M${x0 + 5.4},${y0 + h - 6.6} H${x0 + 9.4}`, col, 1);
      else s += T(x0 + w / 2, y0 + 6.7, 5, label, "#FFFFFF", 800) + C(x0 + w / 2, y0 + 18.6, 6.6, "#FFFFFF", 1.4) + GLYPH[glyph](x0 + w / 2, y0 + 18.6, col) + L(`M${x0 + 4},${y0 + h - 3.6} H${x0 + w - 4}`, col, 1.4);
      return G("rotate(5)", s + R(x0, y0, w, h, 2, "none", 2));
    },
  });

  const ART = {
    ...TOY,
    bk_dino: book("#8FCB82", "dino", true), bk_fish: book("#7EC3E6", "fish", true), bk_space: book("#3E4C82", "space", true), bk_animal: book("#F6B26B", "animal", true),
    bk_momo: book("#FCE4EC", "peach"), bk_moon: book("#5865A8", "moon"), bk_riddle: book("#FFE082", "riddle"), bk_manga: book("#F4F1EA", "manga"),
    bk_recipe: book("#FFF1D6", "recipe"), bk_maze: book("#C5E6B8", "maze"),
    dr_hiragana: drill("kokugo", "こくご", "a"), dr_katakana: drill("kokugo", "こくご", "ka"), dr_kanji: drill("kokugo", "こくご", "kan"), dr_kotoba: drill("kokugo", "こくご", "kotoba"), dr_bunsho: drill("kokugo", "こくご", "bun"),
    dr_tashi: drill("sansu", "さんすう", "plus"), dr_hiki: drill("sansu", "さんすう", "minus"), dr_kuku: drill("sansu", "さんすう", "times"), dr_tokei: drill("sansu", "さんすう", "clock"), dr_math: drill("sansu", "すうがく", "math"),
  };

  // 手の ばしょに おく（はしが わくから でない ように よせる）
  // 絵は 手の まわりで SCALE ばい（ふうせん・バッグと おなじ くらいの 大きさ）
  const SCALE = 1.25;
  const held = (ctx, key) => {
    const A = ART[key], h = HandItems.hand(ctx), s = h.side, back = ctx.view === "back", k = SCALE;
    const [x0, x1, y0, y1] = A.box.map((v) => v * k), lo = s > 0 ? -8 - x0 : -8 + x1, hi = s > 0 ? 208 - x1 : 208 + x0;
    const x = U.clamp(h.x, lo, hi), y = U.clamp(h.y, -38 - y0, 218 - y1);
    return { top: `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s < 0 ? -k : k)} ${f2(k)})">${A.draw(back, ctx)}</g>` };
  };
  return { ART, SCALE, held, box: (key) => ART[key].box };
})();
