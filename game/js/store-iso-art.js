// 歩いて 入る お店の 絵（O10・UI-75。斜め上の 館。投影は IsoVenue・くみたては MallArt.svgBuilder）。
// - 什器は 種類・大きさ・店・variant だけを キーに した SVG（有限）。うごく ところ（ゆげ・ひかり）は canvas（L）。
// - 床（店ごとの 材質・でぐちの マット）と 奥の かべ 2まい（まど・かんばん・メニュー・ポスター・おみせ Lv の かざり）は へやごとに 1まいの 静止画。
// - 店員は NpcLife の しぐさで 描く（kind "keeper"）。はなす ふきだし・タップした 什器の ひかりは over。
// 店ごとの 什器の 絵（オーブン・シャンプー台 など）は js/store-iso-props.js が M に たす。
const StoreIsoArt = (() => {
  const art = Object.create(MallArt);
  const T = () => IsoVenue.T, sh = (c, k) => MallArt.shade(c, k), C3 = (c) => [c, sh(c, -0.1), sh(c, -0.2)];
  const FONT = "'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif";
  const txt = (x, y, size, t, fill = INK, extra = "") => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="${fill}" ${extra}>${t}</text>`;
  const ln = (d, w = 1.4, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" ${extra}/>`;
  const img = (svg, x, y, w, h) => `<image href="${U.svgUrl(svg)}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="xMidYMax meet"/>`;
  // たべもの・もちものの 絵（64×64 の アイコン。ほんとうの しなもの）
  const icon = (id, size = 18) => (typeof FOOD_ART !== "undefined" && FOOD_ART[id] ? img(Art.iconSvg("bag", id), -size / 2, -size * 0.92, size, size) : "");
  const st = (w = 1.1) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // 店の いろ（STORE_INTERIORS の accent・wall・floor）
  const pal = (id) => { const d = (typeof STORE_INTERIORS !== "undefined" && STORE_INTERIORS[id]) || {}; return { a: d.accent || "#A9BBB6", w: d.wall || "#F3EBDD", f: d.floor || "#EADBC3", wood: d.wood || "#D2A673" }; };

  // ---- 立って 見える ちいさな しなもの（画面の むき・原点は 足もと）----
  const SP = {
    bottle: (c, cap = "#EFE7D0") => `<rect x="-2.6" y="-21" width="5.2" height="4.5" rx="1" fill="${cap}" ${st(1)}/><rect x="-4.6" y="-17" width="9.2" height="17" rx="3" fill="${c}" ${st()}/><rect x="-3.6" y="-12" width="7.2" height="5" fill="#FFF6E2" opacity=".9"/>`,
    can: (c) => `<rect x="-3.8" y="-12" width="7.6" height="12" rx="1.6" fill="${c}" ${st(1)}/><path d="M-3.8,-8.5 h7.6" stroke="#FFFFFF" stroke-width="1.3"/><ellipse cx="0" cy="-12" rx="3.8" ry="1.2" fill="#E6E6E6" ${st(0.8)}/>`,
    jar: (c, lid = "#C99A6B") => `<rect x="-4.6" y="-15" width="9.2" height="3.6" rx="1" fill="${lid}" ${st(1)}/><rect x="-5" y="-11.6" width="10" height="11.6" rx="2.6" fill="${c}" ${st()}/><rect x="-3.4" y="-8.6" width="6.8" height="4.4" rx="1" fill="#FFFDF6"/>`,
    box: (c, w = 11, h = 13) => `<rect x="${f2(-w / 2)}" y="${f2(-h)}" width="${w}" height="${h}" rx="1.4" fill="${c}" ${st(1)}/><rect x="${f2(-w / 2 + 2)}" y="${f2(-h + 2.6)}" width="${f2(w - 4)}" height="3.6" rx="1" fill="#FFFFFF" opacity=".75"/>`,
    bag: (c) => `<path d="M-6,-14 L6,-14 L7,0 L-7,0 Z" fill="${c}" ${st(1)}/><path d="M-3,-14 q3,-6 6,0" fill="none" ${st(1)}/><rect x="-4" y="-9" width="8" height="4" rx="1" fill="#FFFFFF" opacity=".8"/>`,
    book: (c, h = 15) => `<rect x="-2.6" y="${-h}" width="5.2" height="${h}" rx="0.8" fill="${c}" ${st(0.9)}/><path d="M-2.6,${f2(-h + 3)} h5.2" stroke="#FFFFFF" stroke-width="0.9" opacity=".8"/>`,
    folded: (c) => `<rect x="-7" y="-5" width="14" height="5" rx="1.4" fill="${c}" ${st(1)}/><rect x="-7" y="-10" width="14" height="5" rx="1.4" fill="${c}" ${st(1)}/><path d="M-3,-10 q3,2.2 6,0" fill="none" stroke="${INK}" stroke-width="0.8"/>`,
    shirt: (c) => `<path d="M-7,-18 L-2.6,-20 Q0,-17 2.6,-20 L7,-18 L9,-12 L5.6,-11 L5.6,0 L-5.6,0 L-5.6,-11 L-9,-12 Z" fill="${c}" ${st(1)}/>`,
    dress: (c) => `<path d="M-3.6,-21 L3.6,-21 L4.6,-13 L8,0 L-8,0 L-4.6,-13 Z" fill="${c}" ${st(1)}/><path d="M-4.6,-13 h9.2" stroke="${INK}" stroke-width="0.8"/>`,
    hat: (c) => `<ellipse cx="0" cy="-2.4" rx="9" ry="2.6" fill="${c}" ${st(1)}/><path d="M-5.4,-2.6 Q-5,-11 0,-11 Q5,-11 5.4,-2.6 Z" fill="${c}" ${st(1)}/><path d="M-5.2,-5 h10.4" stroke="#FFFFFF" stroke-width="1.4"/>`,
    shoe: (c) => `<path d="M-7,0 L-7,-6 Q-6,-9 -2,-8 L3,-5 Q8,-4 8,-1 L8,0 Z" fill="${c}" ${st(1)}/><path d="M-7,-1.5 h15" stroke="#FFFFFF" stroke-width="1.1"/>`,
    plush: (c) => `<circle cx="-4.6" cy="-16" r="3" fill="${c}" ${st(1)}/><circle cx="4.6" cy="-16" r="3" fill="${c}" ${st(1)}/><circle cx="0" cy="-10.6" r="7.4" fill="${c}" ${st(1)}/><circle cx="-2.4" cy="-11.4" r="0.9" fill="${INK}"/><circle cx="2.4" cy="-11.4" r="0.9" fill="${INK}"/><ellipse cx="0" cy="-8.6" rx="2" ry="1.3" fill="#FFF3E2"/>`,
    pot: (c, leaf = "#8FB97E") => `<path d="M-5,-8 L5,-8 L4,0 L-4,0 Z" fill="${c}" ${st(1)}/><circle cx="-2.6" cy="-12" r="3.6" fill="${leaf}" ${st(0.9)}/><circle cx="2.6" cy="-12.6" r="3.6" fill="${sh(leaf, 0.1)}" ${st(0.9)}/><circle cx="0" cy="-15" r="3.4" fill="${leaf}" ${st(0.9)}/>`,
    flower: (c) => `<path d="M0,0 V-12" stroke="#6E9A5E" stroke-width="1.6"/>${[[-3, -13], [3, -13], [0, -16.4], [0, -9.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${c}" ${st(0.8)}/>`).join("")}<circle cx="0" cy="-13" r="1.6" fill="#F6D47A"/>`,
    bouquet: (c, c2 = "#F7E3A1") => `<path d="M-6,-10 L0,1 L6,-10 Z" fill="#F3E3C7" ${st(1)}/>${[[-4, -13, c], [0, -16, c2], [4, -13, c], [-1.6, -11, c2], [2.4, -10.4, c]].map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="3" fill="${k}" ${st(0.8)}/>`).join("")}<path d="M-2,-3 q2,2.6 4,0" fill="none" stroke="#E46D7E" stroke-width="1.4"/>`,
    cake: (c, top = "#FFF5EC") => `<rect x="-7" y="-9" width="14" height="9" rx="2" fill="${c}" ${st(1)}/><path d="M-7,-6 Q-5,-3.6 -3,-6 Q-1,-3.6 1,-6 Q3,-3.6 5,-6 Q6,-4.6 7,-6 V-9 H-7 Z" fill="${top}"/><circle cx="0" cy="-11" r="2" fill="#E8545E" ${st(0.8)}/>`,
    cupcake: (c) => `<path d="M-4.6,-6 L4.6,-6 L3.4,0 L-3.4,0 Z" fill="#E9B97E" ${st(0.9)}/><path d="M-5,-6 Q-5,-12 0,-12.6 Q5,-12 5,-6 Z" fill="${c}" ${st(0.9)}/><circle cx="0" cy="-13.4" r="1.4" fill="#E8545E"/>`,
    donut: (c) => `<ellipse cx="0" cy="-4.6" rx="7" ry="4.4" fill="#E2B57A" ${st(1)}/><path d="M-6.4,-6 Q0,-11 6.4,-6 Q4,-3.6 0,-4 Q-4,-3.6 -6.4,-6 Z" fill="${c}"/><ellipse cx="0" cy="-5.6" rx="2" ry="1.2" fill="#8A6A4A"/>`,
    bread: (c = "#E3B676") => `<path d="M-8,0 Q-9,-8 0,-9 Q9,-8 8,0 Z" fill="${c}" ${st(1)}/><path d="M-3.6,-6.6 l1.6,3 M0.4,-7.4 l1.6,3 M4,-6.4 l1.4,2.6" stroke="#B9874E" stroke-width="1"/>`,
    baguette: () => `<path d="M-2.6,0 L-1.6,-22 Q0,-24.6 1.6,-22 L2.6,0 Z" fill="#E1AE68" ${st(1)}/><path d="M-1.4,-18 l2.6,-2 M-1.6,-12 l3,-2 M-1.8,-6 l3.2,-2" stroke="#B5823F" stroke-width="0.9"/>`,
    croissant: () => `<path d="M-9,0 Q-7,-8 0,-8.6 Q7,-8 9,0 Q5,-3 0,-3.4 Q-5,-3 -9,0 Z" fill="#E7AF5F" ${st(1)}/><path d="M-4,-7 l1.4,4 M0,-8.4 v4.6 M4,-7 l-1.4,4" stroke="#B87A35" stroke-width="0.9"/>`,
    fruit: (c, leaf = "#7DAF62") => `<circle cx="0" cy="-5" r="5" fill="${c}" ${st(1)}/><path d="M0,-10 q2,-3 4,-2.6" fill="none" stroke="${leaf}" stroke-width="1.6"/><ellipse cx="-1.6" cy="-6.4" rx="1.4" ry="1" fill="#FFFFFF" opacity=".6"/>`,
    veg: (c, leaf = "#6FA35A") => `<path d="M-4,-3 Q-5,-9 0,-9.6 Q5,-9 4,-3 Q3,0 0,0 Q-3,0 -4,-3 Z" fill="${c}" ${st(1)}/><path d="M0,-9.6 l-3,-4 M0,-9.6 v-4.6 M0,-9.6 l3,-4" stroke="${leaf}" stroke-width="1.6"/>`,
    cup: (c, lid = "#FFFFFF") => `<path d="M-4.6,-13 L4.6,-13 L3.6,0 L-3.6,0 Z" fill="${c}" ${st(1)}/><rect x="-5.2" y="-15" width="10.4" height="2.4" rx="1" fill="${lid}" ${st(0.9)}/><path d="M1.6,-15 l1.6,-5" stroke="#F06A7A" stroke-width="1.4"/>`,
    mug: (c) => `<rect x="-4.6" y="-10" width="9.2" height="10" rx="1.6" fill="${c}" ${st(1)}/><path d="M4.6,-8 q4,0 4,3 t-4,3" fill="none" ${st(1)}/>`,
    candy: (c) => `<ellipse cx="0" cy="-5" rx="4.6" ry="3.6" fill="${c}" ${st(1)}/><path d="M-4.6,-5 l-3,-2.6 v5.2 Z M4.6,-5 l3,-2.6 v5.2 Z" fill="${c}" ${st(0.9)}/>`,
    toy: (c) => `<rect x="-6" y="-9" width="12" height="9" rx="2" fill="${c}" ${st(1)}/><circle cx="-3.4" cy="0" r="2.2" fill="#55606A" ${st(0.8)}/><circle cx="3.4" cy="0" r="2.2" fill="#55606A" ${st(0.8)}/><rect x="-3" y="-13" width="6" height="4.6" rx="1" fill="${sh(c, 0.2)}" ${st(0.9)}/>`,
    ball: (c) => `<circle cx="0" cy="-6" r="6" fill="${c}" ${st(1)}/><path d="M-6,-6 h12 M0,-12 Q-3,-6 0,0" fill="none" stroke="#FFFFFF" stroke-width="1.2"/>`,
    parcel: (c = "#D9B37E") => `<rect x="-7" y="-11" width="14" height="11" rx="1" fill="${c}" ${st(1)}/><path d="M0,-11 V0 M-7,-6 h14" stroke="#A9804A" stroke-width="1.1"/><rect x="2" y="-9.6" width="4" height="3" fill="#FFFFFF" opacity=".85"/>`,
    tool: (c = "#9AA6AE") => `<rect x="-1.4" y="-18" width="2.8" height="18" rx="1" fill="#C99A6B" ${st(0.9)}/><rect x="-5" y="-21" width="10" height="4" rx="1" fill="${c}" ${st(1)}/>`,
    tube: (c) => `<rect x="-2.4" y="-15" width="4.8" height="15" rx="1.2" fill="${c}" ${st(0.9)}/><rect x="-1.4" y="-17.6" width="2.8" height="2.8" fill="#FFFFFF" ${st(0.8)}/>`,
    toothbrush: (c) => `<rect x="-1" y="-20" width="2" height="20" rx="1" fill="${c}" ${st(0.8)}/><rect x="-1.8" y="-22" width="3.6" height="4" rx="0.8" fill="#FFFFFF" ${st(0.8)}/>`,
    tire: () => `<circle cx="0" cy="-9" r="9" fill="#3F4448" ${st(1.1)}/><circle cx="0" cy="-9" r="4.4" fill="#C9CED3" ${st(1)}/><circle cx="0" cy="-9" r="1.4" fill="#7A8086"/>`,
    oil: (c) => `<path d="M-5,0 V-12 L-2,-15 H5 V0 Z" fill="${c}" ${st(1)}/><rect x="1" y="-18" width="3" height="3" fill="#2F3540" ${st(0.8)}/><rect x="-3.6" y="-10" width="7.6" height="5" fill="#FFFFFF" opacity=".85"/>`,
    stamp: (c) => `<rect x="-5" y="-12" width="10" height="12" fill="#FFFFFF" ${st(0.9)} stroke-dasharray="1.6 1"/><rect x="-3.4" y="-10.4" width="6.8" height="8.8" fill="${c}"/>`,
    letter: (c = "#FFFFFF") => `<rect x="-7" y="-9" width="14" height="9" rx="1" fill="${c}" ${st(1)}/><path d="M-7,-9 L0,-4 L7,-9" fill="none" stroke="${INK}" stroke-width="0.9"/>`,
    card: (c) => `<rect x="-5" y="-14" width="10" height="14" rx="1.4" fill="#FFFDF6" ${st(1)}/><rect x="-3.4" y="-12" width="6.8" height="6" rx="1" fill="${c}"/><path d="M-3.4,-4 h6.8 M-3.4,-2 h4.4" stroke="#B8B0A0" stroke-width="0.8"/>`,
    puzzle: (c) => `<path d="M-6,-12 h4 q0,-3 2,-3 t2,3 h4 v4 q3,0 3,2 t-3,2 v4 h-12 Z" fill="${c}" ${st(1)}/>`,
    cube: (c1, c2 = "#FFFFFF") => `<rect x="-5" y="-10" width="10" height="10" rx="1.4" fill="${c1}" ${st(1)}/><path d="M-5,-5 h10 M0,-10 v10" stroke="${c2}" stroke-width="1"/>`,
    globe: () => `<path d="M-1,0 h2 v-4 h-2 Z" fill="#B5875A"/><rect x="-5" y="-1.6" width="10" height="2" rx="1" fill="#B5875A" ${st(0.8)}/><circle cx="0" cy="-12" r="7.4" fill="#8FC3DF" ${st(1)}/><path d="M-4,-15 q2,-2 4,0 t3,4 q-2,3 -5,1 Z M-6,-10 q2,1 2,4" fill="#9CCB86" stroke="none"/>`,
  };
  const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
  // 品ぞろえ（variant → i ばんめの しなもの）
  const GOODS = {
    drinks: (i) => SP.bottle(pick(["#F3C24F", "#9CCFA8", "#E7A8B8", "#A8C4E8", "#F4B26A", "#C7B8E8"], i), pick(["#EFE7D0", "#E95F4B", "#FFFFFF"], i)),
    cans: (i) => SP.can(pick(["#E95F4B", "#4A8CC9", "#F3C24F", "#5DB070", "#F28BB2"], i)),
    tea: (i) => SP.bottle(pick(["#C9E3A8", "#E8D29A", "#B9DBE8", "#F1C9A0"], i), "#7DAA5E"),
    jars: (i) => SP.jar(pick(["#F2B8C0", "#F3D27A", "#B9DCA4", "#E9A86E", "#C9B4E4"], i)),
    snacks: (i) => SP.bag(pick(["#F28B82", "#FFD54F", "#8FD19E", "#8EC5F4", "#F7B267", "#D9A6E8"], i)),
    boxes: (i) => SP.box(pick(["#F4C7C3", "#CFE3E6", "#FBE6B8", "#D7E8C4", "#E3D3EF"], i), 11, 12 + (i % 3) * 2),
    books: (i) => SP.book(pick(["#B87859", "#7F9D8B", "#CAAB69", "#9096A6", "#D58C8C", "#86A9C9"], i), 13 + (i % 4) * 1.6),
    folded: (i) => SP.folded(pick(["#F2B8C8", "#BFD8E8", "#F6E2A8", "#C9E2C0", "#E3D0F0", "#FFFFFF"], i)),
    shirts: (i) => SP.shirt(pick(["#F2B8C8", "#BFD8E8", "#F6E2A8", "#C9E2C0", "#E3D0F0"], i)),
    shoes: (i) => SP.shoe(pick(["#E86F6F", "#6E8FC9", "#F2D06B", "#FFFFFF", "#9C7A5A"], i)),
    hats: (i) => SP.hat(pick(["#F2C6D8", "#F4E3A1", "#C8DEEF", "#DDEBC9"], i)),
    plush: (i) => SP.plush(pick(["#E8C39A", "#F2C6D8", "#C8DEEF", "#FFFFFF", "#D9C3A8"], i)),
    toys: (i) => (i % 2 ? SP.toy(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E"], i)) : SP.ball(pick(["#F28B82", "#8EC5F4", "#F3C24F"], i))),
    pots: (i) => SP.pot(pick(["#D3A98E", "#C9C1B3", "#E7B9A0", "#A8C4C9"], i), pick(["#8FB97E", "#7DAA6A", "#A3C98F"], i)),
    flowers: (i) => SP.flower(pick(["#F2A7B8", "#F6D47A", "#C9B8E8", "#FFFFFF", "#F28B82", "#F7B267"], i)),
    bouquets: (i) => SP.bouquet(pick(["#F2A7B8", "#C9B8E8", "#F28B82", "#F7B267"], i), pick(["#FFF3C4", "#FFFFFF"], i)),
    cakes: (i) => SP.cake(pick(["#F8D4DC", "#F6E4B8", "#E5C9A8", "#DCEFD0", "#FFFFFF"], i)),
    cupcakes: (i) => SP.cupcake(pick(["#F8C8D4", "#FFF1D6", "#C9E7F2", "#E3D3EF"], i)),
    donuts: (i) => SP.donut(pick(["#F2A7B8", "#8A5A3C", "#FFFFFF", "#F6D47A"], i)),
    bread: (i) => pick([SP.bread(), SP.croissant(), SP.bread("#D9A35E"), SP.donut("#E9C27E")], i),
    baguettes: () => SP.baguette(),
    fruit: (i) => SP.fruit(pick(["#E8545E", "#F7A43A", "#F6D35A", "#9CCB62", "#B4659C"], i)),
    veg: (i) => SP.veg(pick(["#F28C3A", "#E8545E", "#9CCB62", "#F6E7C8", "#B07EC0"], i)),
    cups: (i) => SP.cup(pick(["#F8D7DA", "#FFF1D6", "#D9EEF5", "#E8D6F3"], i)),
    mugs: (i) => SP.mug(pick(["#F8D7DA", "#FFF1D6", "#D9EEF5", "#E8D6F3", "#FFFFFF"], i)),
    candy: (i) => SP.candy(pick(["#F28B82", "#FFD54F", "#8FD19E", "#8EC5F4", "#F2A7D0"], i)),
    parcels: (i) => SP.parcel(pick(["#D9B37E", "#E3C391", "#CFA571"], i)),
    tools: (i) => SP.tool(pick(["#9AA6AE", "#C2574E", "#E2B85C"], i)),
    tubes: (i) => SP.tube(pick(["#F2B8C8", "#A8D5E2", "#F6E2A8", "#C9E2C0", "#FFFFFF"], i)),
    brushes: (i) => SP.toothbrush(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E", "#C9B8E8"], i)),
    oil: (i) => SP.oil(pick(["#E95F4B", "#F3C24F", "#4A8CC9", "#3F9B6A"], i)),
    tires: () => SP.tire(),
    stamps: (i) => SP.stamp(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E", "#C9B8E8"], i)),
    letters: (i) => SP.letter(pick(["#FFFFFF", "#FFF3D6", "#E8F2FA", "#FBE3EA"], i)),
    cards: (i) => SP.card(pick(["#F2A7B8", "#8EC5F4", "#F6D47A", "#8FD19E"], i)),
    puzzles: (i) => SP.puzzle(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E", "#C9B8E8"], i)),
    cubes: (i) => SP.cube(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E"], i)),
  };
  // ほんとうの しなもの（たべものの アイコン）を ならべる
  const foods = (ids) => (i) => icon(pick(ids, i), 17);

  // ---- 面に はりつける（たて の 面。south は y が 一定・east は x が 一定）----
  // inner は 面の ひだり上 を 原点に、よこ 1マス = T、たて 1 = 高さ 1（下が +）
  function faceS(S, x0, x1, y, z0, z1, inner) { const A = IsoVenue.A, B = IsoVenue.B; S.P(x0, y, z0); S.P(x1, y, z0); S.P(x1, y, z1); const q = S.P(x0, y, z1); return `<g transform="matrix(${f2(A)},${f2(B)},0,1,${f2(q.x)},${f2(q.y)})">${inner}</g>`; }
  function faceE(S, x, y0, y1, z0, z1, inner) { const A = IsoVenue.A, B = IsoVenue.B; S.P(x, y0, z0); S.P(x, y1, z0); S.P(x, y0, z1); const q = S.P(x, y1, z1); return `<g transform="matrix(${f2(A)},${f2(-B)},0,1,${f2(q.x)},${f2(q.y)})">${inner}</g>`; }

  // ---- 棚の むき（かべに つけて 前が 見える）: "s" は 北の かべ（前が +y）・"e" は 西の かべ（前が +x）----
  // u: 棚の ながさ の むき・v: かべ からの ふかさ
  const faceOf = (f) => f.face || (f.x === 0 && f.d > f.w ? "e" : f.y === 0 ? "s" : f.w >= f.d ? "s" : "e");
  function frame(S, f) {
    const face = faceOf(f), L = face === "s" ? f.w : f.d;
    const xy = (u, v) => (face === "s" ? [u, v] : [v, u]);
    return {
      face, L,
      P: (u, v, z) => { const [x, y] = xy(u, v); return [x, y, z]; },
      box: (u, v, lu, lv, z, h, col, w) => { const [x, y] = xy(u, v), c = Array.isArray(col) ? col : C3(col); return face === "s" ? S.box(x, y, lu, lv, z, h, c, w) : S.box(x, y, lv, lu, z, h, [c[0], c[2], c[1]], w); },
      poly: (pts, fill, w) => S.poly(pts.map(([u, v, z]) => { const [x, y] = xy(u, v); return [x, y, z]; }), fill, w),
      at: (u, v, z, inner, sx) => { const [x, y] = xy(u, v); return S.at(x, y, z, inner, sx); },
      // 前の 面（v = 一定）に 絵を はる
      front: (v, u0, u1, z0, z1, inner) => (face === "s" ? faceS(S, u0, u1, v, z0, z1, inner) : faceE(S, v, u0, u1, z0, z1, inner)),
      // 前の 面の 四角
      rect: (v, u0, u1, z0, z1, fill, w = 1.1) => S.poly(face === "s" ? [[u0, v, z0], [u1, v, z0], [u1, v, z1], [u0, v, z1]] : [[v, u0, z0], [v, u1, z0], [v, u1, z1], [v, u0, z1]], fill, w),
    };
  }

  // ---- 店の 什器 ----
  const M = {
    // レジ カウンター（前の 板は 店の いろ・上に レジと 店の こもの）
    counter(S, f) {
      const p = pal(f.shop), d = STORE_INTERIORS[f.shop] || {}, cd = d.counter || {}, body = cd.body || p.a, top = cd.top || "#F6EEDF", w = f.w;
      let s = S.ellipse(w / 2, 0.55, 0, w * 0.5, "#00000012", 0);
      s += S.box(0.04, 0.14, w - 0.08, 0.78, 0, 70, [sh(body, 0.25), sh(body, 0.12), sh(body, -0.05)]);
      // 前の 板（ふち どり）と けこみ
      for (let i = 0; i < 3; i++) { const x0 = 0.14 + i * ((w - 0.28) / 3), x1 = x0 + (w - 0.28) / 3 - 0.08; s += S.poly([[x0, 0.92, 14], [x1, 0.92, 14], [x1, 0.92, 60], [x0, 0.92, 60]], sh(body, 0.22), 1.1); }
      s += S.box(0.07, 0.88, w - 0.14, 0.05, 0, 9, C3(sh(body, -0.3)), 1);
      if (cd.logo !== false) s += faceS(S, w / 2 - 0.6, w / 2 + 0.6, 0.93, 22, 52, `<rect x="2" y="2" width="${f2(1.2 * T() - 4)}" height="26" rx="8" fill="#FFFDF6" ${st(1.2)}/>` + txt(0.6 * T(), 20, 12, (BUY_SHOPS[f.shop] || SHOPS[f.shop] || {}).name || "", INK));
      s += S.box(-0.02, 0.08, w + 0.04, 0.9, 70, 6, [top, sh(top, -0.1), sh(top, -0.2)]);
      // レジ（おきゃくさん がわに 小さい がめん）
      const rx = w - 0.66;
      s += S.box(rx, 0.3, 0.46, 0.4, 76, 12, ["#7A808C", "#646A75", "#545A64"]) + S.box(rx + 0.07, 0.36, 0.3, 0.22, 88, 3, ["#9AA1AC", "#868D98", "#747B86"]);
      s += S.poly([[rx + 0.06, 0.62, 88], [rx + 0.4, 0.62, 88], [rx + 0.4, 0.7, 100], [rx + 0.06, 0.7, 100]], "#3F4650", 1.1) + S.poly([[rx + 0.1, 0.63, 90], [rx + 0.36, 0.63, 90], [rx + 0.36, 0.69, 98], [rx + 0.1, 0.69, 98]], "#9FD7E0", 0.8);
      // 店の こもの
      s += (cd.items || ["bell"]).map((k, i) => counterItem(S, k, 0.45 + i * 0.62, 0.5, 76, f)).join("");
      return s;
    },
    // かべの 棚（だん・しなもの）
    wallshelf(S, f) {
      const F = frame(S, f), p = pal(f.shop), H = f.height || 150, dep = f.depth || 0.62, wood = f.wood || p.wood, inner = f.inner || sh(wood, -0.32), n = f.levels || 4;
      const goods = GOODS[f.variant] || (f.foods ? foods(f.foods) : GOODS.boxes), per = f.per || Math.max(3, Math.round(F.L * 3.4));
      let s = "";
      // うしろの いた・ひだりの いた
      s += F.poly([[0.04, 0.03, 0], [F.L - 0.04, 0.03, 0], [F.L - 0.04, 0.03, H], [0.04, 0.03, H]], inner, 1.2);
      s += F.box(0.02, 0, 0.09, dep, 0, H, C3(wood));
      const step = (H - 18) / n;
      for (let k = 0; k < n; k++) {
        const z = 12 + k * step;
        s += F.box(0.06, 0, F.L - 0.12, dep, z - 5, 5, C3(sh(wood, 0.08)), 1.1);
        for (let i = 0; i < per; i++) { const u = 0.26 + (i * (F.L - 0.52)) / Math.max(1, per - 1); s += F.at(u, dep * 0.55, z, goods(i + k * 3, k)); }
        // ねふだ
        if (f.tags !== false) for (let i = 0; i < Math.max(1, Math.floor(F.L)); i++) s += F.rect(dep + 0.005, 0.3 + i * (F.L / Math.max(1, Math.floor(F.L))), 0.3 + i * (F.L / Math.max(1, Math.floor(F.L))) + 0.22, z - 5, z - 1, "#FFFDF4", 0.7);
      }
      s += F.box(0.06, 0, F.L - 0.12, dep, 0, 6, C3(sh(wood, -0.15)), 1.1);
      s += F.box(F.L - 0.11, 0, 0.09, dep, 0, H, C3(wood));
      s += F.box(0, -0.02, F.L, dep + 0.04, H, 8, C3(sh(wood, 0.05)));
      if (f.sign) s += F.front(dep + 0.02, F.L / 2 - 0.62, F.L / 2 + 0.62, H + 10, H + 34, `<rect x="2" y="1" width="${f2(1.24 * T() - 4)}" height="22" rx="7" fill="${f.signCol || p.a}" ${st(1.2)}/>` + txt(0.62 * T(), 17, 11.5, f.sign, "#FFFDF6"));
      return s;
    },
    // しまの 棚（りょうがわ・ひくめ）。ながい ほうに そって 前が 見える
    gondola(S, f) {
      const p = pal(f.shop), alongX = f.w >= f.d, L = alongX ? f.w : f.d, H = f.height || 84, wood = f.wood || "#E9E2D3", goods = GOODS[f.variant] || (f.foods ? foods(f.foods) : GOODS.snacks);
      const xy = (u, v) => (alongX ? [u, v] : [v, u]), B = (u, v, lu, lv, z, h, col) => { const [x, y] = xy(u, v), c = Array.isArray(col) ? col : C3(col); return alongX ? S.box(x, y, lu, lv, z, h, c) : S.box(x, y, lv, lu, z, h, [c[0], c[2], c[1]]); };
      const at = (u, v, z, inner) => { const [x, y] = xy(u, v); return S.at(x, y, z, inner); };
      let s = S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * 0.45, "#00000010", 0);
      s += B(0.1, 0.44, L - 0.2, 0.12, 0, H, "#D9D2C4");
      const n = f.levels || 3, step = (H - 14) / n, per = Math.max(3, Math.round(L * 3.2));
      for (let k = 0; k < n; k++) { const z = 8 + k * step; s += B(0.1, 0.06, L - 0.2, 0.38, z - 4, 4, wood); for (let i = 0; i < per; i++) s += at(0.3 + (i * (L - 0.6)) / (per - 1), 0.24, z, goods(i + k * 2 + 7, k)); }
      for (let k = 0; k < n; k++) { const z = 8 + k * step; s += B(0.1, 0.56, L - 0.2, 0.38, z - 4, 4, wood); for (let i = 0; i < per; i++) s += at(0.3 + (i * (L - 0.6)) / (per - 1), 0.76, z, goods(i + k * 2, k)); }
      s += B(0.04, 0.02, 0.1, 0.96, 0, H + 6, p.a) + B(L - 0.14, 0.02, 0.1, 0.96, 0, H + 6, p.a) + B(0.04, 0.02, L - 0.08, 0.96, H, 6, ["#FFFDF6", "#E8E1D3", "#D6CEBF"]);
      if (f.sign) { const [x, y] = xy(L / 2, 0.5); s += S.at(x, y, H + 30, `<rect x="-34" y="-12" width="68" height="20" rx="7" fill="${f.signCol || p.a}" ${st(1.2)}/>${txt(0, 3, 11, f.sign, "#FFFDF6")}`) + S.line([[x, y, H + 6], [x, y, H + 18]], "#8C8890", 1.6); }
      return s;
    },
    // ガラスの とびらの れいぞうこ（かべぎわ）
    fridge(S, f) {
      const F = frame(S, f), H = f.height || 168, dep = 0.8, body = f.body || "#DDE6EA", glow = f.glow || "#E9F7FB", goods = GOODS[f.variant] || (f.foods ? foods(f.foods) : GOODS.drinks), doors = Math.max(1, Math.round(F.L));
      let s = F.box(0, 0, F.L, dep, 0, H, C3(body));
      s += F.rect(dep + 0.004, 0.08, F.L - 0.08, 14, H - 26, glow, 1.2);
      const n = 4, step = (H - 44) / n, per = Math.max(3, Math.round(F.L * 3.2));
      for (let k = 0; k < n; k++) { const z = 20 + k * step; s += F.poly([[0.1, dep + 0.006, z - 1], [F.L - 0.1, dep + 0.006, z - 1]], "none", 1); for (let i = 0; i < per; i++) s += F.at(0.24 + (i * (F.L - 0.48)) / (per - 1), dep + 0.007, z, goods(i + k * 3, k)); }
      // ガラス（ひかり）・とびらの わく・とって
      s += F.rect(dep + 0.01, 0.08, F.L - 0.08, 14, H - 26, "#FFFFFF33", 0);
      for (let i = 0; i < doors; i++) { const u0 = 0.08 + (i * (F.L - 0.16)) / doors, u1 = u0 + (F.L - 0.16) / doors; s += F.poly([[u0 + 0.06, dep + 0.012, H - 34], [u0 + 0.22, dep + 0.012, H - 34], [u0 + 0.08, dep + 0.012, 24], [u0 + 0.0, dep + 0.012, 30]], "#FFFFFF55", 0); if (i) s += F.poly([[u0, dep + 0.012, 14], [u0, dep + 0.012, H - 26]], "none", 2.2); s += F.box(u1 - 0.12, dep, 0.04, 0.04, H * 0.38, H * 0.3, ["#BFC7CD", "#A9B2B9", "#959EA6"], 0.9); }
      s += F.box(0, -0.02, F.L, dep + 0.04, H - 26, 26, C3(f.top || sh(body, -0.05))) + F.front(dep + 0.03, 0.1, F.L - 0.1, H - 24, H - 2, txt((F.L - 0.2) * T() / 2, 17, 12, f.sign || "ひんやり", "#FFFFFF", `stroke="${INK}" stroke-width="2.4" paint-order="stroke"`));
      return s;
    },
    // ひくい れいとうこ（ガラスの ふた）
    freezer(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d, goods = GOODS[f.variant] || (f.foods ? foods(f.foods) : GOODS.candy), H = 56;
      let s = S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * 0.45, "#00000010", 0) + S.box(0.06, 0.06, f.w - 0.12, f.d - 0.12, 0, H, ["#EAF4F8", "#D3E3EA", "#BDD1DA"]);
      s += S.poly([[0.16, 0.16, H], [f.w - 0.16, 0.16, H], [f.w - 0.16, f.d - 0.16, H], [0.16, f.d - 0.16, H]], "#CFE9F2", 1.1);
      const per = Math.max(4, Math.round(L * 3));
      for (let i = 0; i < per; i++) for (let j = 0; j < 2; j++) { const u = 0.32 + (i * (L - 0.64)) / (per - 1), v = 0.36 + j * 0.3; s += S.at(alongX ? u : v * (f.w / 1), alongX ? v * (f.d / 1) : u, H - 10, goods(i + j * 3)); }
      s += S.poly([[0.16, 0.16, H + 2], [f.w - 0.16, 0.16, H + 2], [f.w - 0.16, f.d - 0.16, H + 2], [0.16, f.d - 0.16, H + 2]], "#FFFFFF44", 1.1);
      s += alongX ? S.line([[f.w / 2, 0.16, H + 2], [f.w / 2, f.d - 0.16, H + 2]], "#9FB7C2", 1.6) : S.line([[0.16, f.d / 2, H + 2], [f.w - 0.16, f.d / 2, H + 2]], "#9FB7C2", 1.6);
      if (f.sign) s += alongX ? faceS(S, f.w / 2 - 0.6, f.w / 2 + 0.6, f.d - 0.06, 18, 44, `<rect x="2" y="2" width="${f2(1.2 * T() - 4)}" height="22" rx="7" fill="#4A8CC9" ${st(1.1)}/>` + txt(0.6 * T(), 18, 11, f.sign, "#FFFFFF")) : faceE(S, f.w - 0.06, f.d / 2 - 0.6, f.d / 2 + 0.6, 18, 44, `<rect x="2" y="2" width="${f2(1.2 * T() - 4)}" height="22" rx="7" fill="#4A8CC9" ${st(1.1)}/>` + txt(0.6 * T(), 18, 11, f.sign, "#FFFFFF"));
      return s;
    },
    // ガラスの ショーケース（ひくい だいの うえに ガラスの はこ）
    showcase(S, f) {
      const p = pal(f.shop), alongX = f.w >= f.d, L = alongX ? f.w : f.d, base = f.body || p.a, goods = GOODS[f.variant] || (f.foods ? foods(f.foods) : GOODS.cakes), H0 = 46, H1 = f.height || 96;
      const xy = (u, v) => (alongX ? [u, v] : [v, u]), B = (u, v, lu, lv, z, h, col) => { const [x, y] = xy(u, v), c = Array.isArray(col) ? col : C3(col); return alongX ? S.box(x, y, lu, lv, z, h, c) : S.box(x, y, lv, lu, z, h, [c[0], c[2], c[1]]); };
      const P3 = (u, v, z) => { const [x, y] = xy(u, v); return [x, y, z]; }, at = (u, v, z, inner) => { const [x, y] = xy(u, v); return S.at(x, y, z, inner); };
      let s = S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * 0.45, "#00000010", 0);
      s += B(0.06, 0.1, L - 0.12, 0.8, 0, H0, [sh(base, 0.3), sh(base, 0.15), sh(base, -0.02)]);
      s += S.poly([P3(0.1, 0.14, H0), P3(L - 0.1, 0.14, H0), P3(L - 0.1, 0.86, H0), P3(0.1, 0.86, H0)], "#FBF6EC", 1.1);
      // うしろの ガラス・なかの しなもの（2だん）
      s += S.poly([P3(0.1, 0.16, H0), P3(L - 0.1, 0.16, H0), P3(L - 0.1, 0.16, H1), P3(0.1, 0.16, H1)], "#DDF0F5aa", 1);
      const per = Math.max(3, Math.round(L * 3));
      s += B(0.14, 0.2, L - 0.28, 0.3, H0 + 22, 3, ["#FFFFFF", "#E6EEF0", "#D6E1E4"]);
      for (let i = 0; i < per; i++) s += at(0.3 + (i * (L - 0.6)) / (per - 1), 0.36, H0 + 25, goods(i + 4, 1));
      for (let i = 0; i < per; i++) s += at(0.3 + (i * (L - 0.6)) / (per - 1), 0.66, H0 + 1, goods(i, 0));
      // まえの ガラス（すこし ななめ）・うえの ガラス・わく
      s += S.poly([P3(0.08, 0.88, H0), P3(L - 0.08, 0.88, H0), P3(L - 0.08, 0.7, H1), P3(0.08, 0.7, H1)], "#CFE9F255", 1.2) + S.poly([P3(0.08, 0.16, H1), P3(L - 0.08, 0.16, H1), P3(L - 0.08, 0.7, H1), P3(0.08, 0.7, H1)], "#E9F7FB66", 1.2);
      s += S.poly([P3(0.3, 0.86, H0 + 8), P3(0.55, 0.86, H0 + 8), P3(0.45, 0.74, H1 - 6), P3(0.22, 0.74, H1 - 6)], "#FFFFFF66", 0);
      s += S.poly([P3(L - 0.08, 0.16, H0), P3(L - 0.08, 0.88, H0), P3(L - 0.08, 0.7, H1), P3(L - 0.08, 0.16, H1)], "#CFE9F244", 1.2);
      if (f.sign) s += alongX ? faceS(S, L / 2 - 0.62, L / 2 + 0.62, 0.9, 10, 36, `<rect x="2" y="2" width="${f2(1.24 * T() - 4)}" height="22" rx="7" fill="#FFFDF6" ${st(1.1)}/>` + txt(0.62 * T(), 18, 11, f.sign)) : faceE(S, 0.9, L / 2 - 0.62, L / 2 + 0.62, 10, 36, `<rect x="2" y="2" width="${f2(1.24 * T() - 4)}" height="22" rx="7" fill="#FFFDF6" ${st(1.1)}/>` + txt(0.62 * T(), 18, 11, f.sign));
      return s;
    },
    // うえきばち（tall: 木・bush: しげみ・flower: はな・cactus: サボテン）
    plant(S, f) {
      const cx = f.w / 2, cy = f.d / 2, v = f.variant || "bush", pot = f.pot || "#D9B79A";
      let s = S.ellipse(cx, cy, 0, 0.34, "#00000014", 0) + S.cyl(cx, cy, 0.26, 0, 30, [sh(pot, 0.1), pot]) + S.ellipse(cx, cy, 30, 0.22, "#7B6A55", 1.1);
      if (v === "tall") { s += S.cyl(cx, cy, 0.05, 30, 70, ["#9C7A57", "#8C6E50"]); for (const [dx, dy, z, r, c] of [[-0.25, 0.1, 96, 21, "#86AE78"], [0.25, -0.1, 104, 20, "#9DC08B"], [0, 0.25, 118, 19, "#B6D3A0"], [0, -0.25, 126, 17, "#9DC08B"], [0.05, 0, 138, 15, "#B6D3A0"]]) s += S.at(cx + dx, cy + dy, z, `<circle r="${r}" fill="${c}" ${st(1.4)}/>`); }
      else if (v === "monstera") { for (const [a, z, c] of [[-0.6, 60, "#6FA35E"], [0.5, 66, "#7DB06A"], [-0.1, 82, "#8CC07A"], [0.9, 50, "#6FA35E"], [-1.1, 48, "#7DB06A"]]) s += S.at(cx, cy, z, `<path d="M0,0 Q${f2(Math.sin(a) * 30)},${f2(-14 - Math.cos(a) * 6)} ${f2(Math.sin(a) * 38)},${f2(-4 - Math.cos(a) * 18)} Q${f2(Math.sin(a) * 18)},${f2(4 - Math.cos(a) * 6)} 0,0 Z" fill="${c}" ${st(1.2)}/>`); }
      else if (v === "cactus") s += S.at(cx, cy, 30, `<path d="M-5,0 V-30 Q0,-36 5,-30 V0 Z" fill="#8CC07A" ${st(1.2)}/><path d="M-5,-14 h-5 v-8 M5,-18 h5 v-8" fill="none" stroke="#8CC07A" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-35" r="3.4" fill="#F2A7B8" ${st(0.9)}/>`);
      else if (v === "flower") { for (let i = 0; i < 5; i++) s += S.at(cx + (i - 2) * 0.08, cy, 32 + (i % 2) * 6, SP.flower(pick(["#F2A7B8", "#F6D47A", "#C9B8E8", "#F28B82", "#FFFFFF"], i + f.x))); s += S.at(cx, cy, 31, `<ellipse rx="12" ry="5" fill="#8FB97E" ${st(1)}/>`); }
      else for (const [dx, dy, z, r, c] of [[-0.14, 0.06, 42, 15, "#86AE78"], [0.15, -0.04, 46, 14, "#9DC08B"], [0, 0.14, 54, 12, "#B6D3A0"], [0.04, -0.14, 58, 11, "#9DC08B"]]) s += S.at(cx + dx, cy + dy, z, `<circle r="${r}" fill="${c}" ${st(1.3)}/>`);
      return s;
    },
    // たて かんばん（A がたの こくばん・メニュー）
    board(S, f) {
      const p = pal(f.shop), ex = f.w >= f.d, cx = f.w / 2, cy = f.d / 2, H = f.height || 92, c = f.col || "#3F5A50";
      let s = S.ellipse(cx, cy, 0, 0.36, "#00000012", 0);
      const lines = (f.lines || ["きょうの", "おすすめ"]).slice(0, 4);
      const inner = (W) => `<rect x="0" y="0" width="${f2(W)}" height="${H - 8}" rx="5" fill="#B88A5C" ${st(1.4)}/><rect x="4" y="4" width="${f2(W - 8)}" height="${H - 16}" rx="3" fill="${c}"/>` + lines.map((t, i) => txt(W / 2, 18 + i * 15, 10.5, t, i ? "#FFFDF0" : "#F6D47A")).join("") + (f.icon ? `<g transform="translate(${f2(W / 2)} ${H - 18})">${f.icon}</g>` : "");
      if (ex) { s += S.line([[cx - 0.32, cy + 0.12, 0], [cx - 0.3, cy, H]], "#8A6A4A", 2.2) + S.line([[cx + 0.32, cy + 0.12, 0], [cx + 0.3, cy, H]], "#8A6A4A", 2.2); s += faceS(S, cx - 0.36, cx + 0.36, cy + 0.06, 8, H, inner(0.72 * T())); }
      else { s += S.line([[cx + 0.12, cy - 0.32, 0], [cx, cy - 0.3, H]], "#8A6A4A", 2.2) + S.line([[cx + 0.12, cy + 0.32, 0], [cx, cy + 0.3, H]], "#8A6A4A", 2.2); s += faceE(S, cx + 0.06, cy - 0.36, cy + 0.36, 8, H, inner(0.72 * T())); }
      return s;
    },
    // かいもの かご（つみかさね）と カート
    baskets(S, f) {
      const cx = f.w / 2, cy = f.d / 2, c = f.col || "#E95F4B";
      let s = S.ellipse(cx, cy, 0, 0.36, "#00000012", 0);
      for (let k = 0; k < 4; k++) s += S.box(cx - 0.26, cy - 0.2, 0.52, 0.4, k * 7, 14, [sh(c, 0.15), c, sh(c, -0.15)], 1);
      s += S.line([[cx - 0.2, cy, 42], [cx, cy, 52], [cx + 0.2, cy, 42]], "#8C8890", 1.8);
      return s;
    },
    cart(S, f) {
      const cx = f.w / 2, cy = f.d / 2;
      let s = S.ellipse(cx, cy, 0, 0.4, "#00000012", 0);
      for (const [x, y] of [[cx - 0.28, cy - 0.2], [cx + 0.24, cy - 0.2], [cx - 0.28, cy + 0.2], [cx + 0.24, cy + 0.2]]) s += S.cyl(x, y, 0.05, 0, 6, ["#55606A", "#3F474F"]);
      s += S.box(cx - 0.32, cy - 0.24, 0.62, 0.48, 18, 30, ["#E6ECEF66", "#C9D3D899", "#B7C2C899"], 1.2) + S.line([[cx - 0.32, cy - 0.24, 48], [cx - 0.42, cy - 0.24, 60], [cx - 0.42, cy + 0.24, 60], [cx - 0.32, cy + 0.24, 48]], "#E95F4B", 2.4);
      s += S.at(cx, cy, 30, SP.bag("#8FD19E") + `<g transform="translate(9 0)">${SP.fruit("#E8545E")}</g>`);
      return s;
    },
    // ごみばこ（トレイも）
    trash(S, f) {
      const cx = f.w / 2, cy = f.d / 2, c = f.col || "#A9B6AE";
      let s = S.ellipse(cx, cy, 0, 0.34, "#00000012", 0) + S.box(cx - 0.3, cy - 0.26, 0.6, 0.52, 0, 70, C3(c)) + S.box(cx - 0.32, cy - 0.28, 0.64, 0.56, 70, 6, C3(sh(c, 0.12)));
      s += faceS(S, cx - 0.22, cx + 0.22, cy + 0.26, 30, 58, `<rect x="2" y="2" width="${f2(0.44 * T() - 4)}" height="12" rx="3" fill="#2F3B3A"/>` + txt(0.22 * T(), 24, 8, "ありがとう", "#FFFFFF"));
      return s;
    },
    // かがみ（たて がた）
    mirror(S, f) {
      const F = frame(S, f), H = f.height || 150, c = f.col || "#C9A16E";
      let s = F.box(0.1, 0.02, F.L - 0.2, 0.12, 0, H, C3(c));
      s += F.rect(0.145, 0.18, F.L - 0.18, 12, H - 12, "#DDEFF2", 1.2) + F.poly([[0.32, 0.15, 30], [0.5, 0.15, 30], [F.L - 0.36, 0.15, H - 30], [F.L - 0.54, 0.15, H - 30]], "#FFFFFF77", 0);
      return s;
    },
    // ベンチ（まちあい）
    seat(S, f) {
      const alongX = f.w >= f.d, c = f.col || pal(f.shop).a, L = alongX ? f.w : f.d;
      const xy = (u, v) => (alongX ? [u, v] : [v, u]), B = (u, v, lu, lv, z, h, col) => { const [x, y] = xy(u, v), cc = Array.isArray(col) ? col : C3(col); return alongX ? S.box(x, y, lu, lv, z, h, cc) : S.box(x, y, lv, lu, z, h, [cc[0], cc[2], cc[1]]); };
      let s = S.ellipse(f.w / 2, f.d / 2, 0, L * 0.42, "#00000012", 0);
      for (const u of [0.18, L - 0.3]) s += B(u, 0.3, 0.12, 0.4, 0, 22, "#8C8890");
      s += B(0.06, 0.12, L - 0.12, 0.76, 22, 10, [sh(c, 0.2), c, sh(c, -0.12)]) + B(0.06, 0.06, L - 0.12, 0.16, 32, 34, [sh(c, 0.25), sh(c, 0.05), sh(c, -0.1)]);
      for (let i = 1; i < Math.round(L); i++) s += B(i - 0.02, 0.12, 0.04, 0.76, 32, 1, sh(c, -0.25));
      return s;
    },
    // まどぎわの カウンター席（たかい テーブルと まるい いす）
    barseat(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d, c = f.col || "#D9B686";
      const xy = (u, v) => (alongX ? [u, v] : [v, u]), B = (u, v, lu, lv, z, h, col) => { const [x, y] = xy(u, v), cc = Array.isArray(col) ? col : C3(col); return alongX ? S.box(x, y, lu, lv, z, h, cc) : S.box(x, y, lv, lu, z, h, [cc[0], cc[2], cc[1]]); };
      const cyl = (u, v, r, z, h, col) => { const [x, y] = xy(u, v); return S.cyl(x, y, r, z, h, col); };
      let s = B(0.05, 0.05, L - 0.1, 0.42, 0, 4, "#00000010");
      for (const u of [0.2, L - 0.3]) s += B(u, 0.12, 0.1, 0.1, 0, 72, "#8C8890");
      s += B(0.02, 0.02, L - 0.04, 0.42, 72, 5, C3(c));
      const n = Math.max(2, Math.round(L * 0.9));
      for (let i = 0; i < n; i++) { const u = 0.5 + (i * (L - 1)) / Math.max(1, n - 1); s += cyl(u, 0.72, 0.04, 0, 46, ["#8C8890", "#77737B"]) + cyl(u, 0.72, 0.17, 46, 6, [f.seat || "#E77B7B", sh(f.seat || "#E77B7B", -0.15)]); }
      return s;
    },
    // ラック（ふく。まるい ラックは variant "round"）
    clothesrack(S, f) {
      const p = pal(f.shop), cols = f.cols || [p.a, "#FFF1D9", sh(p.a, 0.3), "#CFE3E6", "#F4C7C3", "#E3D0F0"], round = f.variant === "round";
      let s = S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * 0.45, "#00000012", 0);
      if (round) {
        const cx = f.w / 2, cy = f.d / 2;
        s += S.cyl(cx, cy, 0.05, 0, 100, ["#B9BEC4", "#9FA5AB"]) + S.cyl(cx, cy, 0.3, 0, 4, ["#B9BEC4", "#9FA5AB"]);
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3, x = cx + Math.cos(a) * 0.62, y = cy + Math.sin(a) * 0.62; if (Math.sin(a) < -0.2) s += S.at(x, y, 58, SP.dress(pick(cols, i)), 1.9); }
        s += S.ellipse(cx, cy, 100, 0.62, "none", 1.8);
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3, x = cx + Math.cos(a) * 0.62, y = cy + Math.sin(a) * 0.62; if (Math.sin(a) >= -0.2) s += S.at(x, y, 58, SP.dress(pick(cols, i)), 1.9); }
        return s;
      }
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d, xy = (u, v) => (alongX ? [u, v] : [v, u]);
      for (const u of [0.12, L - 0.18]) { const [x, y] = xy(u, 0.5); s += S.box(x - 0.03, y - 0.03, 0.06, 0.06, 0, 112, ["#B9BEC4", "#9FA5AB", "#8D9399"]); }
      { const [x0, y0] = xy(0.12, 0.5), [x1, y1] = xy(L - 0.12, 0.5); s += S.line([[x0, y0, 112], [x1, y1, 112]], "#8D9399", 2.6); }
      const n = Math.max(4, Math.round(L * 4));
      for (let i = 0; i < n; i++) { const [x, y] = xy(0.3 + (i * (L - 0.6)) / (n - 1), 0.5); s += S.at(x, y, 62, (i % 3 === 2 ? SP.dress : SP.shirt)(pick(cols, i)), 2.2); }
      return s;
    },
  };

  // カウンターの うえの こもの
  function counterItem(S, k, x, y, z, f) {
    const p = pal(f.shop);
    const I = {
      bell: `<path d="M-6,0 Q-6,-10 0,-10 Q6,-10 6,0 Z" fill="#E8C35A" ${st(1.2)}/><rect x="-8" y="0" width="16" height="2.6" rx="1.3" fill="#B99B4A" ${st(1)}/><circle cx="0" cy="-11" r="1.6" fill="#E8C35A" ${st(0.8)}/>`,
      tray: `<path d="M-12,-2 L12,-2 L10,2 L-10,2 Z" fill="#E86F4E" ${st(1)}/><path d="M-12,-6 L12,-6 L10,-2 L-10,-2 Z" fill="#F2875F" ${st(1)}/>`,
      bags: SP.bag(p.a) + `<g transform="translate(8 1)">${SP.bag("#F6EEDF")}</g>`,
      dome: `<ellipse cx="0" cy="0" rx="11" ry="3" fill="#FFFFFF" ${st(1)}/><path d="M-10,0 Q-10,-16 0,-16 Q10,-16 10,0" fill="#E9F7FB88" ${st(1)}/>` + `<g transform="translate(0 -1)">${SP.cake("#F8D4DC")}</g>`,
      breadbasket: `<path d="M-11,-6 L11,-6 L9,0 L-9,0 Z" fill="#C99A6B" ${st(1)}/>` + `<g transform="translate(-4 -5)">${SP.croissant()}</g><g transform="translate(5 -5)">${SP.bread()}</g>`,
      bouquet: SP.bouquet("#F2A7B8", "#FFF3C4"),
      brushes: `<rect x="-5" y="-9" width="10" height="9" rx="2" fill="#9FD1D9" ${st(1)}/>` + [-3, 0, 3].map((dx, i) => `<g transform="translate(${dx} -6)">${SP.toothbrush(pick(["#F28B82", "#F3C24F", "#8FD19E"], i))}</g>`).join(""),
      coffee: SP.mug("#FFFFFF") + `<g transform="translate(9 0)">${SP.mug("#F8D7DA")}</g>`,
      menu: `<path d="M-8,0 L-6,-18 L6,-18 L8,0 Z" fill="#FFFDF6" ${st(1)}/><rect x="-4" y="-15" width="8" height="5" rx="1" fill="${p.a}"/><path d="M-4,-7 h8 M-4,-4 h6" stroke="#B8B0A0" stroke-width="0.9"/>`,
      scale: `<rect x="-9" y="-4" width="18" height="4" rx="1" fill="#DCE2E6" ${st(1)}/><rect x="-6" y="-12" width="12" height="8" rx="1.6" fill="#F6F2EA" ${st(1)}/><rect x="-4" y="-10" width="8" height="3.4" fill="#9FD7E0"/>`,
      stamp: `<rect x="-7" y="-3" width="14" height="3" rx="1" fill="#E95F4B" ${st(0.9)}/><rect x="-2" y="-12" width="4" height="9" rx="1.6" fill="#8A6A4A" ${st(0.9)}/>`,
      cards: SP.card("#F2A7B8") + `<g transform="translate(7 1)">${SP.card("#8EC5F4")}</g>`,
      candy: `<rect x="-9" y="-12" width="18" height="12" rx="3" fill="#E9F7FB99" ${st(1)}/>` + [-4, 0, 4].map((dx, i) => `<circle cx="${dx}" cy="-4" r="2.6" fill="${pick(["#F28B82", "#FFD54F", "#8FD19E"], i)}"/>`).join(""),
      cup: SP.cup("#FFFFFF"),
      plant: SP.pot("#E7B9A0"),
      ribbon: `<path d="M0,-6 L-8,-11 L-8,-1 Z M0,-6 L8,-11 L8,-1 Z" fill="#F28BB2" ${st(1)}/><circle cx="0" cy="-6" r="2.4" fill="#E86F9A" ${st(0.9)}/>`,
      gas: `<rect x="-5" y="-16" width="10" height="16" rx="2" fill="#E95F4B" ${st(1)}/><rect x="-3" y="-13" width="6" height="4" fill="#FFFFFF"/>`,
    };
    return S.at(x, y, z, I[k] || (art.CI[k] ? art.CI[k](p) : ""));
  }

  // ---- 床（店ごとの 材質を MAT に とうろく）----
  const MAT = {
    "store:exit": { c: ["#B9A68A", "#B09D80"], line: "#9C8A6E", pat: "mat" },
  };
  function mat(id, ch, m) {
    const key = "store:" + id + ":" + ch;
    if (!art.MAT[key]) art.MAT[key] = typeof m === "string" ? MallArt.MAT[m] || MAT[m] || MallArt.MAT.stone : { c: m.c || ["#EADBC3", "#E3D3B9"], line: m.line || sh((m.c || ["#EADBC3"])[0], -0.12), pat: m.pat || "tile" };
    return key;
  }

  // ---- 高さ（タップの あたり・3人の まえで すける）----
  const HEIGHTS = { wallshelf: 158, gondola: 92, fridge: 176, freezer: 60, showcase: 98, plant: 70, board: 92, baskets: 50, cart: 60, trash: 76, mirror: 150, seat: 66, barseat: 78, clothesrack: 116, table: 52, booth: 104, npc: 112 };
  const PLANT_H = { tall: 150, monstera: 96, cactus: 76, flower: 50, bush: 70 };
  function height(kind, variant) { if (kind === "plant") return PLANT_H[variant] || 70; return (art.HEIGHTS && art.HEIGHTS[kind]) || HEIGHTS[kind] || 80; }

  // ---- かべ（北・西。店の まど・かんばん・メニュー など）----
  // パーツの いち a〜b は かべに そった マス（北は x・西は y。おくが 0）。z は ゆかからの 高さ
  function wallSvg(r, side) {
    const Tt = T(), Lw = (side === "north" ? r.w : r.h) * Tt, Hh = r.wallH || 230, V = (z) => Hh - z, id = r.shop, d = STORE_INTERIORS[id] || {}, p = pal(id);
    const span = (a, b) => (side === "north" ? [a * Tt, b * Tt] : [(r.h - b) * Tt, (r.h - a) * Tt]);
    const wc = d.wall || "#F3EBDD", wain = d.wainscot || sh(p.a, 0.35), wz = d.wainH || 82;
    let s = R(0, 0, Lw, Hh, wc);
    // かべの もよう（stripe: たてじま・dots: みずたま・tile: タイル・plain）
    if (d.wallPat === "stripe") for (let x = 0; x < Lw; x += 24) s += R(x, 0, 12, V(wz), sh(wc, -0.035));
    else if (d.wallPat === "dots") for (let y = 14; y < V(wz); y += 26) for (let x = (y / 26) % 2 ? 26 : 13; x < Lw; x += 26) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="${sh(wc, -0.07)}"/>`;
    else if (d.wallPat === "tile") { for (let y = V(wz); y > 0; y -= 18) s += `<path d="M0,${f2(y)} H${Lw}" stroke="${sh(wc, -0.09)}" stroke-width="1"/>`; for (let x = 0; x < Lw; x += 18) s += `<path d="M${x},0 V${f2(V(wz))}" stroke="${sh(wc, -0.09)}" stroke-width="1"/>`; }
    else if (d.wallPat === "brick") for (let y = V(wz), k = 0; y > 0; y -= 14, k++) for (let x = k % 2 ? -14 : 0; x < Lw; x += 28) s += R(x + 1, y - 13, 26, 12, sh(wc, (k + x / 28) % 3 ? -0.04 : -0.08), `rx="2"`);
    else if (d.wallPat === "wood") for (let x = 0; x < Lw; x += 30) s += `<path d="M${x},0 V${f2(V(wz))}" stroke="${sh(wc, -0.12)}" stroke-width="1.2"/>`;
    // こしいた
    s += R(0, V(wz), Lw, wz, wain) + `<path d="M0,${f2(V(wz))} H${Lw}" stroke="${INK}" stroke-width="1.8"/>`;
    if (d.wainPat === "tile") for (let x = 0; x < Lw; x += 20) for (let z = 8; z < wz; z += 20) s += R(x + 1, V(z + 19), 18, 18, (x / 20 + z / 20) % 2 ? sh(wain, -0.05) : wain, `stroke="${sh(wain, -0.18)}" stroke-width=".8"`);
    else for (let x = 16; x < Lw; x += 32) s += `<path d="M${x},${f2(V(wz - 6))} V${f2(V(12))}" stroke="${sh(wain, -0.2)}" stroke-width="1.3"/>`;
    s += R(0, V(wz + 4), Lw, 5, sh(wain, -0.15));
    for (const pt of (r.storeWalls && r.storeWalls[side]) || []) s += wallPart(pt, span, V, r, side, p, d);
    // おみせ Lv の かざり（北の かべ）: ほし の プレート・はなの はちうえ・ガーランド
    if (side === "north" && r.tier > 1) s += tierDeco(r.tier, Lw, V, p);
    s += R(0, 0, Lw, 9, sh(wain, -0.25)) + R(0, V(10), Lw, 10, sh(wain, -0.3)) + `<path d="M0,${V(10)} H${Lw}" stroke="${INK}" stroke-width="1.5"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Lw} ${Hh}">${s}</svg>`, L: Lw, H: Hh };
  }
  function tierDeco(tier, Lw, V, p) {
    let s = "";
    const n = tier >= 5 ? 3 : tier >= 3 ? 2 : 1;
    s += R(Lw / 2 - 40, V(226), 80, 18, "#FFF1D0", `rx="7" stroke="${INK}" stroke-width="1.4"`);
    for (let i = 0; i < n; i++) { const x = Lw / 2 + (i - (n - 1) / 2) * 18, y = V(217); s += `<path d="${Array.from({ length: 10 }, (_, j) => { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? 2.8 : 6.6; return (j ? "L" : "M") + f2(x + Math.cos(a) * rr) + "," + f2(y + Math.sin(a) * rr); }).join("")}Z" fill="#EBC569" stroke="${INK}" stroke-width="1"/>`; }
    if (tier >= 5) { s += `<path d="M8,${V(212)} Q${Lw / 4},${V(196)} ${Lw / 2 - 48},${V(212)} M${Lw / 2 + 48},${V(212)} Q${(Lw * 3) / 4},${V(196)} ${Lw - 8},${V(212)}" fill="none" stroke="${INK}" stroke-width="1"/>`; for (let i = 0; i < 14; i++) { const t = (i % 7) / 6, half = i < 7 ? 0 : 1, x0 = half ? Lw / 2 + 48 : 8, x1 = half ? Lw - 8 : Lw / 2 - 48, x = x0 + (x1 - x0) * t, y = V(212) + 16 * 4 * t * (1 - t) * 0.5; s += `<path d="M${f2(x - 5)},${f2(y)} h10 l-5,9 Z" fill="${pick(["#ACC7B5", "#DFB0BD", "#E8CE94"], i)}" stroke="${INK}" stroke-width=".8"/>`; } }
    return s;
  }
  // かべの パーツ
  function wallPart(pt, span, V, r, side, p, d) {
    const [u0, u1] = span(pt.a, pt.b ?? pt.a + 1), w = u1 - u0, z0 = pt.z0 ?? 90, z1 = pt.z1 ?? 200, cx = (u0 + u1) / 2;
    const frameR = (x, y, ww, hh, fill, rx = 4, sw = 1.8) => R(x, y, ww, hh, fill, `rx="${rx}" stroke="${INK}" stroke-width="${sw}"`);
    let s = "";
    switch (pt.t) {
      case "window": {
        const fc = pt.frame || "#FFFFFF", y0 = V(z1), hh = z1 - z0;
        s += frameR(u0, y0, w, hh, fc, 4, 2) + R(u0 + 6, y0 + 6, w - 12, hh - 12, pt.sky || "#CDEBF7");
        // そとの けしき（みちの むこうの いえ・き）
        s += R(u0 + 6, y0 + hh * 0.62, w - 12, hh * 0.38 - 6, "#BFDCA8") + `<circle cx="${f2(u0 + w * 0.28)}" cy="${f2(y0 + hh * 0.6)}" r="${f2(Math.min(18, w * 0.12))}" fill="#9CCB86"/><circle cx="${f2(u0 + w * 0.72)}" cy="${f2(y0 + hh * 0.58)}" r="${f2(Math.min(14, w * 0.1))}" fill="#86B872"/>`;
        s += R(u0 + w * 0.42, y0 + hh * 0.36, w * 0.18, hh * 0.3, "#F3D9C0", `stroke="#B79A7C" stroke-width="1"`) + `<path d="M${f2(u0 + w * 0.4)},${f2(y0 + hh * 0.37)} L${f2(u0 + w * 0.51)},${f2(y0 + hh * 0.24)} L${f2(u0 + w * 0.62)},${f2(y0 + hh * 0.37)} Z" fill="#D98E7A"/>`;
        s += `<path d="M${f2(u0 + 14)},${f2(y0 + 12)} l18,-0 M${f2(u0 + w - 50)},${f2(y0 + 18)} q8,-6 16,0 q8,-6 16,0" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round"/>`;
        for (let k = 1; k < Math.max(2, Math.round(w / 70)); k++) s += R(u0 + (k * w) / Math.max(2, Math.round(w / 70)) - 2, y0 + 6, 4, hh - 12, fc);
        s += R(u0 + 6, y0 + hh * 0.5 - 2, w - 12, 4, fc) + frameR(u0 - 4, V(z0) - 2, w + 8, 8, sh(fc, -0.08), 2, 1.4);
        if (pt.curtain) s += `<path d="M${f2(u0 + 4)},${f2(y0 + 4)} H${f2(u0 + 30)} Q${f2(u0 + 22)},${f2(y0 + hh * 0.5)} ${f2(u0 + 30)},${f2(V(z0) - 4)} H${f2(u0 + 4)} Z" fill="${pt.curtain}" stroke="${INK}" stroke-width="1.3"/><path d="M${f2(u1 - 4)},${f2(y0 + 4)} H${f2(u1 - 30)} Q${f2(u1 - 22)},${f2(y0 + hh * 0.5)} ${f2(u1 - 30)},${f2(V(z0) - 4)} H${f2(u1 - 4)} Z" fill="${pt.curtain}" stroke="${INK}" stroke-width="1.3"/>`;
        if (pt.awning) { const aw = pt.awning; for (let x = u0 - 6, k = 0; x < u1 + 6; x += 20, k++) s += `<path d="M${f2(x)},${f2(y0 - 14)} h20 v12 q-5,7 -10,0 q-5,7 -10,0 Z" fill="${k % 2 ? "#FFFDF6" : aw}" stroke="${INK}" stroke-width="1.2"/>`; }
        if (pt.text) s += txt(cx, y0 + hh * 0.2 + 6, 11, pt.text, sh(p.a, -0.35));
        break;
      }
      case "sign": {
        const name = (BUY_SHOPS[r.shop] || SHOPS[r.shop] || {}).name || "", y0 = V(z1), hh = z1 - z0, c = pt.col || p.a;
        s += frameR(u0, y0, w, hh, c, 12, 2.2) + frameR(u0 + 5, y0 + 5, w - 10, hh - 10, "none", 9, 1) + txt(cx + (pt.icon === false ? 0 : 12), y0 + hh * 0.5 + 4, Math.min(22, hh * 0.42), name, pt.ink || "#FFFDF6");
        if (pt.icon !== false && typeof SIGN_ICON !== "undefined" && SIGN_ICON[r.shop]) s += `<circle cx="${f2(u0 + 26)}" cy="${f2(y0 + hh / 2)}" r="${f2(hh * 0.32)}" fill="#FFFDF6" stroke="${INK}" stroke-width="1.4"/><g transform="translate(${f2(u0 + 26)} ${f2(y0 + hh / 2)}) scale(${f2(hh / 60)})">${SIGN_ICON[r.shop](0, 0)}</g>`;
        if (d.caption) s += txt(cx, V(z0) + 14, 10.5, d.caption, sh(p.a, -0.45));
        break;
      }
      case "menu": {
        const y0 = V(z1), hh = z1 - z0, items = pt.items || [], n = items.length || 1, cw = (w - 16) / n, dark = pt.dark !== false;
        s += frameR(u0, y0, w, hh, dark ? "#3A3F44" : "#FFFDF6", 6, 2) + R(u0 + 4, y0 + 4, w - 8, 20, pt.col || p.a, `rx="4"`) + txt(cx, y0 + 18, 12, pt.title || "メニュー", "#FFFDF6");
        items.forEach((id, i) => { const x = u0 + 8 + cw * i + cw / 2, it = typeof BAG_INDEX !== "undefined" ? BAG_INDEX[id] : null; s += R(x - cw / 2 + 3, y0 + 28, cw - 6, hh - 34, dark ? "#4A5056" : "#F6EEDF", `rx="4"`); if (FOOD_ART[id]) s += img(Art.iconSvg("bag", id), x - Math.min(26, cw * 0.4), y0 + 30, Math.min(52, cw * 0.8), Math.min(52, cw * 0.8)); if (it) s += txt(x, y0 + hh - 10, 9.5, it.price + "", dark ? "#F6D47A" : INK); });
        break;
      }
      case "poster": {
        const y0 = V(z1), hh = z1 - z0;
        s += frameR(u0, y0, w, hh, pt.col || "#FFFDF6", 3, 1.6) + R(u0 + 5, y0 + 5, w - 10, hh * 0.62, pt.bg || sh(p.a, 0.3));
        if (pt.food && FOOD_ART[pt.food]) s += img(Art.iconSvg("bag", pt.food), cx - hh * 0.26, y0 + 8, hh * 0.52, hh * 0.52);
        if (pt.art) s += `<g transform="translate(${f2(cx)} ${f2(y0 + hh * 0.36)})">${pt.art}</g>`;
        if (pt.text) s += txt(cx, y0 + hh * 0.84, Math.min(12, w / Math.max(4, pt.text.length) * 1.6), pt.text, INK);
        break;
      }
      case "clock": {
        const y = V(pt.z ?? 196);
        s += `<circle cx="${f2(u0 + T() / 2)}" cy="${f2(y)}" r="17" fill="#FFFDF5" stroke="${INK}" stroke-width="2.2"/><circle cx="${f2(u0 + T() / 2)}" cy="${f2(y)}" r="13" fill="none" stroke="${p.a}" stroke-width="1.2"/>` + ln(`M${f2(u0 + T() / 2)},${f2(y)} v-10 M${f2(u0 + T() / 2)},${f2(y)} h7`, 2.2);
        break;
      }
      case "shelf": {
        const z = pt.z ?? 150, y = V(z), goods = GOODS[pt.goods] || (pt.foods ? foods(pt.foods) : GOODS.jars), n = Math.max(2, Math.round(w / 26));
        for (let i = 0; i < n; i++) s += `<g transform="translate(${f2(u0 + 14 + (i * (w - 28)) / (n - 1))} ${f2(y)})">${goods(i)}</g>`;
        s += R(u0, y, w, 6, pt.col || d.wood || "#C99A6B", `stroke="${INK}" stroke-width="1.4"`) + ln(`M${f2(u0 + 8)},${f2(y + 6)} v8 M${f2(u1 - 8)},${f2(y + 6)} v8`, 1.6);
        break;
      }
      case "chalk": {
        const y0 = V(z1), hh = z1 - z0, lines = pt.lines || [];
        s += frameR(u0, y0, w, hh, "#B88A5C", 4, 2) + R(u0 + 5, y0 + 5, w - 10, hh - 10, pt.col || "#3F5A50");
        lines.forEach((t, i) => { s += txt(cx, y0 + 22 + i * 17, i ? 11 : 13, t, i ? "#FFFDF0" : "#F6D47A"); });
        if (pt.art) s += `<g transform="translate(${f2(cx)} ${f2(V(z0) - 18)})">${pt.art}</g>`;
        break;
      }
      case "mirror": {
        const y0 = V(z1), hh = z1 - z0;
        s += frameR(u0, y0, w, hh, pt.col || "#E2C08E", 18, 2) + R(u0 + 7, y0 + 7, w - 14, hh - 14, "#DDEFF2", `rx="13"`) + `<path d="M${f2(u0 + w * 0.3)},${f2(y0 + hh * 0.7)} L${f2(u0 + w * 0.62)},${f2(y0 + hh * 0.22)} M${f2(u0 + w * 0.48)},${f2(y0 + hh * 0.8)} L${f2(u0 + w * 0.76)},${f2(y0 + hh * 0.4)}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`;
        break;
      }
      case "door": {
        const y0 = V(z1 ?? 176), hh = (z1 ?? 176) - 10;
        s += frameR(u0, y0, w, hh, pt.col || sh(p.a, -0.1), 4, 2) + frameR(u0 + 6, y0 + 8, w - 12, hh * 0.42, sh(pt.col || p.a, 0.18), 3, 1.2) + `<circle cx="${f2(u1 - 12)}" cy="${f2(y0 + hh * 0.58)}" r="3" fill="#E2B85C" stroke="${INK}" stroke-width="1"/>`;
        if (pt.label) s += R(cx - 30, y0 - 22, 60, 16, "#FFFDF6", `rx="5" stroke="${INK}" stroke-width="1.2"`) + txt(cx, y0 - 10, 9.5, pt.label);
        break;
      }
      case "tiles": {
        const y0 = V(z1), hh = z1 - z0, c = pt.col || "#E8F2F2";
        s += R(u0, y0, w, hh, c, `stroke="${INK}" stroke-width="1.2"`);
        for (let x = u0; x < u1; x += 14) s += `<path d="M${f2(x)},${f2(y0)} V${f2(y0 + hh)}" stroke="${sh(c, -0.12)}" stroke-width=".8"/>`;
        for (let y = y0; y < y0 + hh; y += 14) s += `<path d="M${f2(u0)},${f2(y)} H${f2(u1)}" stroke="${sh(c, -0.12)}" stroke-width=".8"/>`;
        break;
      }
      case "pegs": {
        const y0 = V(z1), hh = z1 - z0, goods = GOODS[pt.goods] || GOODS.hats, n = Math.max(2, Math.round(w / 34));
        s += R(u0, y0, w, hh, pt.col || "#E7D3B0", `rx="4" stroke="${INK}" stroke-width="1.6"`);
        for (let x = u0 + 10; x < u1 - 6; x += 12) for (let y = y0 + 10; y < y0 + hh - 6; y += 12) s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.3" fill="${sh(pt.col || "#E7D3B0", -0.25)}"/>`;
        for (let i = 0; i < n; i++) { const x = u0 + 18 + (i * (w - 36)) / Math.max(1, n - 1); s += ln(`M${f2(x)},${f2(y0 + 14)} v6`, 1.6) + `<g transform="translate(${f2(x)} ${f2(y0 + hh * 0.5 + 14)}) scale(1.3)">${goods(i)}</g>`; }
        break;
      }
      case "frames": {
        const n = pt.n || 3, y0 = V(z1), hh = z1 - z0, fw = (w - (n - 1) * 8) / n;
        for (let i = 0; i < n; i++) { const x = u0 + i * (fw + 8), c = pick(pt.cols || ["#F2C6D8", "#C9DDB9", "#C8DEEF", "#F4E3A1"], i); s += frameR(x, y0 + (i % 2) * 8, fw, hh - 8, "#FFFDF6", 2, 1.6) + R(x + 4, y0 + 4 + (i % 2) * 8, fw - 8, hh - 16, c) + (pt.art ? `<g transform="translate(${f2(x + fw / 2)} ${f2(y0 + hh * 0.55 + (i % 2) * 8)})">${typeof pt.art === "function" ? pt.art(i) : pt.art}</g>` : ""); }
        break;
      }
      case "lights": {
        const y = V(pt.z ?? 214);
        s += `<path d="M${f2(u0)},${f2(y)} Q${f2(cx)},${f2(y + 18)} ${f2(u1)},${f2(y)}" fill="none" stroke="${INK}" stroke-width="1"/>`;
        for (let i = 0; i <= Math.round(w / 22); i++) { const t = i / Math.round(w / 22), x = u0 + (u1 - u0) * t, yy = y + 18 * 4 * t * (1 - t) * 0.5; s += `<circle cx="${f2(x)}" cy="${f2(yy + 4)}" r="3.6" fill="${pick(["#FFE49C", "#F6B6C8", "#B8DFD2", "#C9B8E8"], i)}" stroke="${INK}" stroke-width=".8"/>`; }
        break;
      }
      case "garland": {
        const y = V(pt.z ?? 214);
        s += `<path d="M${f2(u0)},${f2(y)} Q${f2(cx)},${f2(y + 22)} ${f2(u1)},${f2(y)}" fill="none" stroke="#789473" stroke-width="3"/>`;
        for (let i = 0; i <= Math.round(w / 26); i++) { const t = i / Math.round(w / 26), x = u0 + (u1 - u0) * t, yy = y + 22 * 4 * t * (1 - t) * 0.5; s += `<g transform="translate(${f2(x)} ${f2(yy + 14)})">${SP.flower(pick(["#F2A7B8", "#F6D47A", "#C9B8E8", "#FFFFFF"], i))}</g>`; }
        break;
      }
      case "stripe": { s += R(u0, V(z1), w, z1 - z0, pt.col || p.a); break; }
      case "board": {
        const y0 = V(z1), hh = z1 - z0;
        s += frameR(u0, y0, w, hh, pt.col || "#FFFDF6", 8, 1.8) + (pt.lines || []).map((t, i) => txt(cx, y0 + 20 + i * 16, i ? 10.5 : 12.5, t, i ? sh(p.a, -0.45) : INK)).join("") + (pt.art ? `<g transform="translate(${f2(cx)} ${f2(V(z0) - 20)})">${pt.art}</g>` : "");
        break;
      }
      case "art": { s += `<g transform="translate(${f2(cx)} ${f2(V(pt.z ?? 150))})">${pt.svg || ""}</g>`; break; }
    }
    return s;
  }

  // 絵を かえる オプション（modelKey に いれる）
  const KEY_OPTS = ["variant", "dir", "face", "height", "sign", "signCol", "foods", "col", "body", "glow", "top", "wood", "inner", "cols", "item", "sp", "ci", "levels", "per", "depth", "tags", "lines", "icon", "seat", "pot"];

  // ---- 店員（NpcLife の しぐさ）----
  function keeperCanvas(sc, ensure, neutral) {
    const v = neutral ? { pose: "idle_01", emo: "normal", gesture: "none" } : NpcLife.visual(sc.keeperActor), spec = { ...sc.owner, pose: v.pose, emo: v.emo, gesture: v.gesture };
    const size = sc.charSize(), pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    return SvgCache[ensure ? "ensure" : "get"]("storekeeper:" + sc.shopId + ":" + [v.pose, v.emo, v.gesture].join(":") + ":" + pw, () => Art.npcSvg(spec), pw, ph);
  }
  function drawKeeper(ctx, sc, f, off) {
    const v = NpcLife.visual(sc.keeperActor), c = keeperCanvas(sc, false, false) || keeperCanvas(sc, false, true), q = sc.toScreen(IsoVenue.p(f.x + 0.5, f.y + 0.5, 0), off), size = sc.charSize(), w = size, h = (size * VB.h) / VB.w, k = size / 46;
    ctx.fillStyle = "rgba(31,29,27,0.14)"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 28 * sc.s, 8 * sc.s, 0, 0, 7); ctx.fill();
    if (c) { ctx.save(); ctx.translate(q.x, q.y + (v.dy || 0) * k); ctx.rotate(((v.tilt || 0) * Math.PI) / 180); ctx.drawImage(c, -w * ((FOOT.x - VB.x) / VB.w), -h * ((FOOT.y - VB.y) / VB.h), w, h); ctx.restore(); }
  }

  Object.assign(art, {
    M: { ...MallArt.M, ...(typeof Bikkupo !== "undefined" ? { booth: Bikkupo.art.M.booth } : {}), ...M }, MAT: { ...MallArt.MAT, ...MAT }, L: { ...MallArt.L }, models: new Map(),
    SP, GOODS, foods, icon, img, txt, ln, faceS, faceE, frame, pal, C3, st, pick, FONT, HEIGHTS: {}, CI: {}, counterItem,
    shade: sh, mat, height, wallSvg, keeperCanvas,
    // 絵の キー: 店・しゅるい・大きさと 絵を かえる オプション（KEY_OPTS）だけ。データで きまる ので 有限（いち・ラベル・とき は いれない）
    modelKey(f) { let k = "store:" + f.shop + ":" + f.kind + ":" + f.w + "x" + f.d; for (const o of KEY_OPTS) if (f[o] != null) k += ":" + o + "=" + (typeof f[o] === "object" ? JSON.stringify(f[o]) : f[o]); return k + (f._layer != null ? ":L" + f._layer : ""); },
    // S.at で おく しなもの は 点 だけ では はみでる ので、まわりを ひろげて おく（うえ 50・よこ 26 × 大きさ）
    svgBuilder() { const S = MallArt.svgBuilder.call(this), at = S.at; S.at = function (x, y, z, inner, sx = 1) { const q = S.P(x, y, z), k = Math.abs(sx); S.grow(q.x - 26 * k, q.y - 50 * k, q.x + 26 * k, q.y + 4 * k); return at.call(S, x, y, z, inner, sx); }; return S; },
    async prepare(r, sc) {
      const k = Math.min(sc.k, 1.2), jobs = [];
      for (const side of ["north", "west"]) { const w = this.wallSvg(r, side); jobs.push(SvgCache.ensure("storewall:" + r.id + ":" + side, () => w.svg, Math.ceil(w.L * k), Math.ceil(w.H * k)).then((c) => { (r._walls ||= {})[side] = { c, L: w.L, H: w.H }; })); }
      await Promise.all(jobs);
      r.decals = [{ kind: "text", x: 5.5, y: 11.62, text: "でぐち", size: 15, col: "#FFF7E0" }];
    },
    paint(g, r) { this.paintFloor(g, r); this.paintWalls(g, r); },
    backdrop(r) { const d = STORE_INTERIORS[r.shop] || {}; return d.backdrop || [sh(d.wall || "#F3EBDD", -0.12), sh(d.wall || "#F3EBDD", 0.04)]; },
    preload(r, sc) { return Promise.all([...r.fixtures.filter((f) => f.kind !== "keeper").map((f) => this.sprite(sc, f, true)).filter(Boolean), ...this.npcJobs(r, sc), keeperCanvas(sc, true, true)]); },
    fixture(ctx, sc, f, o) { if (f.kind === "keeper") return drawKeeper(ctx, sc, f, o.offset || 0); return MallArt.fixture.call(this, ctx, sc, f, o); },
    // はなす の ふきだし（店員の あたまの うえ）と タップした 什器の ひかり
    over(ctx, sc, room, floor, off) {
      const kp = sc.fixtures.find((f) => f.kind === "keeper");
      if (kp && !sc.interacting) {
        const q = sc.toScreen(IsoVenue.p(kp.x + 0.5, kp.y + 0.5, 0), off), top = q.y - sc.charSize() * 0.98 - 6 + Math.sin(G.t * 3) * 1.5;
        ctx.save(); ctx.fillStyle = "#FFF7D9"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; U.rr(ctx, q.x - 28, top - 20, 56, 20, 9); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(q.x - 5, top); ctx.lineTo(q.x, top + 6); ctx.lineTo(q.x + 5, top); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#FFF7D9"; ctx.fillRect(q.x - 5, top - 2, 10, 2.4);
        ctx.fillStyle = INK; ctx.font = "900 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("はなす", q.x, top - 10); ctx.restore();
      }
      const h = sc.highlight;
      if (h && h.until > G.t && h.f) {
        const pts = IsoVenue.convex(IsoVenue.hull(h.f)).map((q) => sc.toScreen(q, off));
        ctx.save(); ctx.strokeStyle = "#FFF2B1"; ctx.lineWidth = 3; ctx.globalAlpha = Math.min(1, (h.until - G.t) * 2); ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
      }
    },
  });
  return art;
})();
