// バーガーやさんの メニュー（オーナーの FB 2026-10-01「ハンバーガー屋さんのお買い物に、複数のハンバーガーの種類と、ポテト、シェイク、ハッピーセットを加えて」）。
// ほんものの バーガーやさんの メニューを 参考に した: シェイクは バニラ・いちご・チョコの 3しゅ、ポテトは S・M・L、
// こどもの セットは メイン・サイド・のみもの に おもちゃが 1こ（1シリーズ 6〜9しゅ。ひみつの おもちゃ つきも ある）。
// 「ハッピーセット」は マクドナルドの 登録商標 なので、この ゲームでは「にこにこ セット」（はこの 絵も べつの デザイン）。
// ・バーガー 8しゅ（チーズバーガーは いままでの burger）・サイド 4しゅ・のみもの 5しゅ（シェイク 3しゅ ＋ ジュース・ぎゅうにゅう）・セット 1しゅ
// ・にこにこ セットを 1こ かうと おまけの おもちゃ（6しゅの フィギュア）が 1こ。まだ もって いない ものから でる。へやや フィギュア だい に かざれる（js/figure-stand.js）
// 食べ物は exclusive（スーパーには ならばない）。絵は FOOD_ART（64×64・INK）・おもちゃは 100×110（家具は 50×55）。
// バーガーやさんは マックさん（平和台）・バーガーやさん（まちなか）など どこも BUY_SHOPS.burger（js/scene-store.js の 店内）。
// セーブは もちもの（Save.d.bag）と 家具（Save.d.furn）が ふえる だけ（Save.SCHEMA は そのまま）。
const BurgerMenu = (() => {
  const K = INK, S = (w = 3) => IS(w), f1 = (v) => Math.round(v * 10) / 10;
  const L = (d, col, w = 3) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shine = (x, y, rx, ry, rot = -25, a = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity="${a}"/>`;

  // ---- バーガーの ぶひん（64×64・したから じゅんに かさねる）----
  const bunBottom = (y, h = 12, col = "#E6BA76") => `<rect x="8" y="${y}" width="48" height="${h}" rx="6" fill="${col}" ${S()}/>`;
  const patty = (y, h = 9, col = "#8E6247", grill = "#6B4632") => `<rect x="6" y="${y}" width="52" height="${h}" rx="${f1(h / 2)}" fill="${col}" ${S()}/>` + L(`M14,${f1(y + h / 2)} h5 M28,${f1(y + h / 2)} h5 M42,${f1(y + h / 2)} h5`, grill, 2);
  const cheese = (y) => `<path d="M6,${y} H58 L54,${y + 7} L45,${y + 4} L38,${y + 10} L30,${y + 4} L21,${y + 8} L10,${y + 4} Z" fill="#F7CF55" ${S(2.6)}/>`;
  const lettuce = (y, col = "#9CCB72") => `<path d="M5,${y + 3} Q11,${y - 4} 17,${y + 2} Q23,${y - 4} 29,${y + 2} Q35,${y - 4} 41,${y + 2} Q47,${y - 4} 53,${y + 2} Q57,${y - 2} 59,${y + 3} L58,${y + 7} H6 Z" fill="${col}" ${S(2.6)}/>`;
  const sauce = (y, col) => L(`M11,${y} q3.5,3.5 7,0 t7,0 t7,0 t7,0 t7,0 t7,0`, col, 3.2);
  const SEEDS = [[19, 0.42, -20], [27, 0.3, 10], [36, 0.28, -10], [45, 0.4, 25], [23, 0.62, 30], [32, 0.55, -5], [41, 0.6, -30]];
  const bunTop = (yb, ht, col = "#E8BF81", seeds = true) => {
    const k = f1(ht / 0.75);
    let s = `<path d="M6,${yb} C6,${f1(yb - k)} 58,${f1(yb - k)} 58,${yb} Z" fill="${col}" ${S()}/>`;
    if (seeds) s += SEEDS.map(([x, t, r]) => `<ellipse cx="${x}" cy="${f1(yb - ht * (1 - t) - 1)}" rx="2.2" ry="1.15" transform="rotate(${r} ${x} ${f1(yb - ht * (1 - t) - 1)})" fill="#FFF4D8"/>`).join("");
    return s + L(`M13,${f1(yb - ht * 0.45)} Q17,${f1(yb - ht * 0.8)} 25,${f1(yb - ht * 0.9)}`, "#FFF0CE", 3);
  };
  const drip = (x, y, len, col) => `<path d="M${x - 3},${y} Q${x - 3},${y + len} ${x},${y + len} Q${x + 3},${y + len} ${x + 3},${y} Z" fill="${col}" ${S(2)}/>`;

  // ---- 食べ物の 絵（64×64）----
  const crumbs = (pts, col) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${col}"/>`).join("");
  const ART = {
    // ハンバーガー: パン・おにく・ケチャップ だけ（ゴマなし）
    bm_hamburger: () => bunBottom(45) + patty(37, 10) + sauce(38.5, "#E5483C") + crumbs([[17, 42], [31, 43], [45, 42]], "#FFF8E8") + bunTop(39, 25, "#E8BF81", false),
    // てりやき: こい ソースの おにく・たれ・きざみ レタス・マヨネーズ
    bm_teriyaki: () => bunBottom(46, 11) + drip(15, 47, 6, "#7A3E1F") + drip(44, 47, 5, "#7A3E1F") + patty(38, 10, "#6A3A22", "#4E2A18") + shine(22, 41, 6, 1.6, 0, 0.5)
      + `<path d="M6,39 C9,33 15,36 19,33 C23,36 28,32 32,35 C36,32 42,36 45,33 C49,36 55,33 58,39 Z" fill="#C6E59A" ${S(2.6)}/>` + L("M14,36 l2,2 M24,35 l2,2 M36,35 l2,2 M48,36 l-2,2", "#8DBB5E", 1.8)
      + L("M11,37 q4,-3 8,0 t8,0 t8,0 t8,0 t8,0", "#FFFDF0", 3.4) + bunTop(35, 24),
    // フィッシュ: むした しろい パン・さかなの フライ・タルタル・はんぶんの チーズ
    bm_fish: () => bunBottom(47, 11, "#F2DDB5") + `<rect x="7" y="35" width="50" height="13" rx="4" fill="#E9B04F" ${S()}/>` + crumbs([[13, 44], [20, 41], [27, 45], [35, 42], [43, 45], [50, 41]], "#C98A2E")
      + `<path d="M22,35 L46,35 L36,44 Z" fill="#F7CF55" ${S(2.4)}/>` + `<path d="M12,36 C17,31 26,33 31,32 C37,31 45,34 52,36 C46,39 19,40 12,36 Z" fill="#FFFDF2" ${S(2.2)}/>`
      + crumbs([[20, 35], [30, 34], [40, 35]], "#7DB35A") + bunTop(35, 23, "#F7E6C4", false),
    // チキン: でこぼこの からあげ・レタス・マヨネーズ
    bm_chicken: () => bunBottom(46, 11) + `<path d="M6,42 C5,37 10,35 14,36 C17,33 22,34 25,35 C29,33 34,33 38,35 C42,33 47,34 50,36 C55,35 59,38 58,42 C59,46 55,49 50,48 C46,50 40,50 35,49 C30,50 24,50 19,49 C14,50 8,48 6,42 Z" fill="#D98B3A" ${S()}/>`
      + crumbs([[13, 41], [22, 44], [30, 40], [38, 44], [46, 41], [53, 44]], "#F2BC6A") + lettuce(30) + L("M12,36 q4,-3 8,0 t8,0 t8,0 t8,0 t8,0", "#FFFDF0", 3.2) + bunTop(33, 22),
    // えび: えびの しっぽが みえる フライ・キャベツ・オーロラ ソース
    bm_ebi: () => bunBottom(46, 11) + `<path d="M3,40 L8,37 L8,45 Z" fill="#E8573D" ${S(2)}/><path d="M61,40 L56,37 L56,45 Z" fill="#E8573D" ${S(2)}/>`
      + `<rect x="7" y="36" width="50" height="12" rx="6" fill="#F0A04B" ${S()}/>` + L("M17,40 q4,5 9,1 M30,40 q4,5 9,1 M43,40 q3,4 7,1", "#F47C5A", 2.6) + crumbs([[13, 44], [24, 45], [36, 45], [48, 45]], "#C97A2E")
      + lettuce(30, "#D8EDB0") + L("M12,35.5 q4,-3 8,0 t8,0 t8,0 t8,0 t8,0", "#F6A27E", 3.2) + bunTop(33, 22),
    // ダブル チーズバーガー: おにく 2まい・チーズ 2まい
    bm_double: () => bunBottom(48, 10) + patty(41, 8) + cheese(40) + patty(32, 8) + cheese(31) + bunTop(32, 22),
    // ビッグ バーガー: パン 3まい・おにく 2まい・レタス・チーズ・ソース
    bm_big: () => bunBottom(50, 9) + patty(44, 7) + cheese(43) + `<path d="M6,42 Q20,38 32,41 Q44,38 58,42 L57,44 H7 Z" fill="#B8DD8A" ${S(2.2)}/>`
      + `<rect x="8" y="36" width="48" height="7" rx="3.5" fill="#E6BA76" ${S()}/>` + patty(29, 8) + L("M10,30 q4,3 8,0 t8,0 t8,0 t8,0 t8,0 t8,0", "#F3A46E", 3) + bunTop(30, 24),
    // ポテト S・M・L（はこの にこにこ マーク）
    bm_fries_s: () => fries(0, false),
    bm_fries_m: () => fries(1, false),
    bm_fries_l: () => fries(2, false),
    // ナゲット 5こ と ケチャップ
    bm_nugget: () => `<path d="M7,36 L45,36 L41,58 L11,58 Z" fill="#FFE7A8" ${S()}/>` + L("M9.5,44 H42.6", "#F2A33A", 4)
      + nug(15, 32, 7, -10) + nug(28, 30, 7.5, 15) + nug(39, 33, 6.8, 40) + nug(21, 22, 6.6, 70) + nug(33, 21, 6.4, -30)
      + `<path d="M7,36 L45,36 L41,58 L11,58 Z" fill="none" ${S()}/>`
      + `<path d="M45,48 L59,48 L57,59 L47,59 Z" fill="#FFFFFF" ${S(2.4)}/><ellipse cx="52" cy="48" rx="7" ry="3" fill="#E5483C" ${S(2.2)}/>`,
    // シェイク（バニラ・いちご・チョコ）
    bm_shake_vanilla: () => shake("#F6E2A6", "#C9A55A"),
    bm_shake_berry: () => shake("#F7A1C0", "#FFFFFF"),
    bm_shake_choco: () => shake("#A06A48", "#FFFFFF"),
    // にこにこ セット: きいろい はこ（にこにこ がお・ほしの シール）から バーガーと ポテトが のぞく
    bm_nikoniko: () => {
      let s = L("M22,20 C22,7 42,7 42,20", K, 6.5) + L("M22,20 C22,7 42,7 42,20", "#7ED3F7", 2.6);
      s += fryStick(40, 8, 22, -10) + fryStick(45, 6, 24, 3) + fryStick(50, 9, 21, 15);
      s += `<g transform="translate(8 1) scale(0.5)">${bunTop(30, 22)}</g>`;
      s += `<path d="M8,22 L56,22 L52,59 L12,59 Z" fill="#FFD84F" ${S()}/><path d="M8,22 L14,15 L50,15 L56,22 Z" fill="#FFEA94" ${S(2.6)}/>`;
      s += `<circle cx="24" cy="36" r="2.6" fill="${K}"/><circle cx="40" cy="36" r="2.6" fill="${K}"/><ellipse cx="18.5" cy="42" rx="3.6" ry="2.2" fill="#FF9EB5"/><ellipse cx="45.5" cy="42" rx="3.6" ry="2.2" fill="#FF9EB5"/>`;
      s += `<path d="M24,42 Q32,51 40,42 Z" fill="#E86A6A" ${S(2.4)}/>`;
      s += `<path d="${starPath(48, 51, 5.4, 2.4)}" fill="#7ED3F7" ${S(1.8)}/>` + shine(16, 30, 2.4, 6, 8, 0.6);
      return s;
    },
  };
  // ポテトの 1ぽん（よこに ずらす・かたむける）
  function fryStick(x, top, len, rot) { return `<rect x="${x - 2.6}" y="${top}" width="5.2" height="${len}" rx="1.6" transform="rotate(${rot} ${x} ${top + len})" fill="#F7C64B" ${S(2.2)}/>`; }
  // ポテトの はこ（s: 0 = S・1 = M・2 = L・face: おもちゃの かお）
  function fries(s, face) {
    const w = [28, 34, 40][s], h = [22, 26, 31][s], cx = 32, yb = 59, top = yb - h, n = [5, 7, 9][s];
    let out = "";
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), x = f1(cx - w / 2 + 5 + t * (w - 10)), len = [18, 20, 23][s] + ((i * 7) % 5) - (i % 2) * 3, rot = f1((t - 0.5) * 22);
      out += fryStick(x, f1(top - len + 10), len, rot);
    }
    out += `<path d="M${cx - w / 2},${top} Q${cx},${top + 7} ${cx + w / 2},${top} L${cx + w / 2 - 3},${yb} Q${cx},${yb + 1.5} ${cx - w / 2 + 3},${yb} Z" fill="#F0625A" ${S()}/>`;
    out += shine(cx - w / 2 + 6, top + h * 0.55, 1.8, h * 0.28, 4, 0.45);
    if (face) out += faceOn(cx, top + h * 0.5, 0.95, "#FFFFFF");
    else out += `<circle cx="${cx - 5}" cy="${f1(top + h * 0.48)}" r="1.8" fill="#FFFFFF"/><circle cx="${cx + 5}" cy="${f1(top + h * 0.48)}" r="1.8" fill="#FFFFFF"/>` + L(`M${cx - 6},${f1(top + h * 0.63)} Q${cx},${f1(top + h * 0.8)} ${cx + 6},${f1(top + h * 0.63)}`, "#FFFFFF", 2.6);
    return out;
  }
  // ナゲット 1こ
  function nug(x, y, r, rot) {
    const d = `M${-r},0 C${-r},${f1(-r * 0.9)} ${f1(-r * 0.2)},${f1(-r * 1.1)} ${f1(r * 0.4)},${f1(-r * 0.95)} C${f1(r * 1.05)},${f1(-r * 0.75)} ${f1(r * 1.1)},${f1(r * 0.1)} ${f1(r * 0.85)},${f1(r * 0.55)} C${f1(r * 0.5)},${r} ${f1(-r * 0.5)},${f1(r * 1.05)} ${f1(-r * 0.85)},${f1(r * 0.55)} C${f1(-r * 1.05)},${f1(r * 0.25)} ${-r},${f1(r * 0.1)} ${-r},0 Z`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}" fill="#E9A84A" ${S(2.4)}/><circle cx="${f1(-r * 0.3)}" cy="${f1(-r * 0.2)}" r="1.2" fill="#F6CB7A"/><circle cx="${f1(r * 0.35)}" cy="${f1(r * 0.2)}" r="1.1" fill="#F6CB7A"/></g>`;
  }
  // シェイク（col: あじの いろ・mark: カップの にこにこ マークの いろ。face: おもちゃの かお）
  function shake(col, mark, face = false) {
    let s = `<g transform="rotate(12 36 14)"><rect x="33" y="1" width="6" height="24" rx="3" fill="#FFFFFF" ${S(2.4)}/>${L("M33.6,7 h4.8 M33.6,13 h4.8", "#F06A6A", 2.4)}</g>`;
    s += `<path d="M17,23 C17,12 47,12 47,23 Z" fill="#EAF7FB" ${S(2.6)}/><path d="M21,23 C22,17 29,16 32,18 C34,15 42,17 43,23 Z" fill="${col}"/>` + shine(23, 18, 1.6, 3.4, 30, 0.8);
    s += `<path d="M17,28 L47,28 L43.5,59 L20.5,59 Z" fill="#FFFFFF" ${S()}/><path d="M18.1,37 L45.9,37 L44.6,49 L19.4,49 Z" fill="${col}"/>`;
    s += face ? faceOn(32, 42.5, 0.9) : `<circle cx="28" cy="41" r="1.6" fill="${mark}"/><circle cx="36" cy="41" r="1.6" fill="${mark}"/>` + L("M27.5,44.5 Q32,48 36.5,44.5", mark, 2.4);
    s += `<path d="M17,28 L47,28 L43.5,59 L20.5,59 Z" fill="none" ${S()}/><rect x="14" y="22" width="36" height="6.5" rx="3.2" fill="#FFFFFF" ${S(2.6)}/>` + L("M22,32 L24,55", "#FFFFFF", 2.4);
    return s;
  }
  // おもちゃの かお（にこにこ・ほっぺ）
  function faceOn(x, y, k, col = K) {
    return `<circle cx="${f1(x - 6.5 * k)}" cy="${f1(y - 1)}" r="${f1(2.6 * k)}" fill="${col}"/><circle cx="${f1(x + 6.5 * k)}" cy="${f1(y - 1)}" r="${f1(2.6 * k)}" fill="${col}"/>`
      + `<circle cx="${f1(x - 5.7 * k)}" cy="${f1(y - 2)}" r="${f1(0.9 * k)}" fill="#FFFFFF"/><circle cx="${f1(x + 7.3 * k)}" cy="${f1(y - 2)}" r="${f1(0.9 * k)}" fill="#FFFFFF"/>`
      + `<ellipse cx="${f1(x - 11 * k)}" cy="${f1(y + 3.5 * k)}" rx="${f1(3.2 * k)}" ry="${f1(2 * k)}" fill="#FF9EB5" opacity="0.9"/><ellipse cx="${f1(x + 11 * k)}" cy="${f1(y + 3.5 * k)}" rx="${f1(3.2 * k)}" ry="${f1(2 * k)}" fill="#FF9EB5" opacity="0.9"/>`
      + `<path d="M${f1(x - 4.5 * k)},${f1(y + 2.5 * k)} Q${x},${f1(y + 9 * k)} ${f1(x + 4.5 * k)},${f1(y + 2.5 * k)} Z" fill="#E86A6A" ${S(2.2)}/>`;
  }

  // ---- メニュー（id・なまえ・ねだん・おなか・きぶん・体力・SP・せつめい）----
  // チーズバーガー（burger）・ジュース・ぎゅうにゅうは いままでの 食べ物（スーパーにも ある）
  const FOOD = [
    ["bm_hamburger", "ハンバーガー", 60, 38, 8, 36, 0, "まるい パンに おにくを はさんだ いちばん シンプルな バーガー"],
    ["bm_teriyaki", "てりやき バーガー", 90, 46, 14, 46, 0, "あまからい てりやき ソースと マヨネーズの バーガー"],
    ["bm_fish", "フィッシュ バーガー", 90, 42, 12, 44, 0, "さくさくの おさかな フライと タルタル ソース"],
    ["bm_chicken", "チキン バーガー", 90, 46, 12, 46, 0, "からっと あげた チキンと レタスの バーガー"],
    ["bm_ebi", "えび バーガー", 100, 46, 14, 48, 0, "ぷりぷりの えびを まるごと フライに した バーガー"],
    ["bm_double", "ダブル チーズバーガー", 120, 56, 14, 56, 0, "おにく 2まいと チーズ 2まい。ボリューム たっぷり"],
    ["bm_big", "ビッグ バーガー", 150, 64, 16, 64, 0, "パン 3まいで おにく 2まいを はさんだ。おおきな くちで がぶっ！"],
    ["bm_fries_s", "ポテト S", 40, 12, 8, 10, 0, "あつあつ ポテトの ちいさい サイズ"],
    ["bm_fries_m", "ポテト M", 60, 18, 10, 16, 0, "あつあつ ポテトの ふつうの サイズ"],
    ["bm_fries_l", "ポテト L", 80, 24, 12, 22, 0, "あつあつ ポテトの おおきい サイズ。みんなで わけっこ"],
    ["bm_nugget", "チキン ナゲット", 80, 24, 10, 26, 0, "ひとくち サイズの チキンが 5こ。ケチャップを つけてね"],
    ["bm_shake_vanilla", "バニラ シェイク", 60, 10, 16, 0, 10, "つめたくて あまい バニラの シェイク。げんき(SP)が もどる"],
    ["bm_shake_berry", "いちご シェイク", 60, 10, 16, 0, 10, "ピンクの いちご シェイク。げんき(SP)が もどる"],
    ["bm_shake_choco", "チョコ シェイク", 60, 10, 16, 0, 10, "こっくり あまい チョコの シェイク。げんき(SP)が もどる"],
    ["bm_nikoniko", "にこにこ セット", 160, 56, 26, 50, 8, "ハンバーガー・ポテト・ジュースの こどもの セット。おまけの おもちゃが 1こ はいってるよ"],
  ];
  const SET_ID = "bm_nikoniko";
  for (const [id, name, price, hunger, mood, hp, sp, desc] of FOOD) {
    const f = { id, name, price, hunger, mood, ...(hp ? { hp } : {}), ...(sp ? { sp } : {}), deza: id.startsWith("bm_shake"), rare: false, exclusive: "burger", burgerMenu: true, desc };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" }; FOOD_ART[id] = ART[id]();
  }
  const TABS = [
    ["burger", "バーガー", ["bm_hamburger", "burger", "bm_teriyaki", "bm_fish", "bm_chicken", "bm_ebi", "bm_double", "bm_big"]],
    ["side", "サイド", ["bm_fries_s", "bm_fries_m", "bm_fries_l", "bm_nugget"]],
    ["drink", "のみもの", ["bm_shake_vanilla", "bm_shake_berry", "bm_shake_choco", "juice", "milk"]],
    ["set", "セット", [SET_ID]],
  ];

  // ---- おまけの おもちゃ 6しゅ（100×110 の フィギュア・家具は 50×55）----
  // 3人は Chara.svg（まえむき）の うでで バーガー・ポテト・シェイクを だく（CHARA_GESTURES に たす。キャッシュの キーは なまえだけ）
  const CHEST = { wanko: [100, 156], gachan: [100, 160], goji: [102, 146] };
  const HUG = { wanko: [{ rot: -54, front: true }, { rot: 54, front: true }], gachan: [{ rot: -72, front: true }, { rot: 72, front: true }], goji: [{ rot: -150, front: true }, { rot: 150, front: true }] };
  const hold = (art, k) => (id) => { const [x, y] = CHEST[id]; return `<g transform="translate(${f1(x - 32 * k)} ${f1(y - 32 * k)}) scale(${k})">${art}</g>`; };
  CHARA_GESTURES.bm_hug_burger = { arms: HUG, under: hold(FOOD_ART.burger, 1.7) };
  CHARA_GESTURES.bm_hug_fries = { arms: HUG, under: hold(fries(2, false), 1.55) };
  CHARA_GESTURES.bm_hug_shake = { arms: HUG, under: hold(shake("#A06A48", "#FFFFFF"), 1.75) };
  const HERO_VB = { wanko: "0 -8 200 222", gachan: "30 12 140 202", goji: "-6 -6 212 222" };
  // 3人の 絵を x y w h に（xMidYMax meet と おなじ おきかた）。いれこの <svg> に しない（CSS の「.ico svg」などで 大きさが かわらない）
  const place = (svg, x, y, w, h, vb) => {
    const [vx, vy, vw, vh] = vb.split(" ").map(Number), k = Math.min(w / vw, h / vh);
    const tx = x + (w - vw * k) / 2 - vx * k, ty = y + (h - vh * k) - vy * k;
    return `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${Math.round(k * 1000) / 1000})">${svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</g>`;
  };
  const hero = (who, gesture, face) => Chara.svg(who, { pose: "idle_01", face, dir: "down", gesture, color: "soft" });
  // だい: きいろい まるい だい（まえに にこにこ マーク）
  const base = (rx = 36) => `<ellipse cx="50" cy="101" rx="${rx}" ry="7.5" fill="#4F465622"/><path d="M${50 - rx},96 L${50 - rx},100 A${rx} 8 0 0 0 ${50 + rx} 100 L${50 + rx},96" fill="#F2A33A" ${S(2.2)}/>`
    + `<ellipse cx="50" cy="96" rx="${rx}" ry="8" fill="#FFD84F" ${S(2.2)}/>` + L(`M${50 - rx * 0.6},94 q${f1(rx * 0.3)} -3 ${f1(rx * 0.6)} -3`, "#FFF3B5", 2) + L("M45,101.5 Q50,104.5 55,101.5", "#FFFFFF", 1.8);
  const feet = (x1, x2, y, col) => `<ellipse cx="${x1}" cy="${y}" rx="6.5" ry="4.2" fill="${col}" ${S(2.4)}/><ellipse cx="${x2}" cy="${y}" rx="6.5" ry="4.2" fill="${col}" ${S(2.4)}/>`;
  const arm = (x, y, rot, col) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="9" transform="rotate(${rot} ${x} ${y})" fill="${col}" ${S(2.4)}/>`;
  const TOY_ART = {
    bm_toy_wanko: () => base() + place(hero("wanko", "bm_hug_burger", "happy"), 8, 3, 84, 93, HERO_VB.wanko),
    bm_toy_gachan: () => base(32) + place(hero("gachan", "bm_hug_fries", "love"), 15, 8, 70, 88, HERO_VB.gachan),
    bm_toy_goji: () => base(38) + place(hero("goji", "bm_hug_shake", "happy"), 6, 2, 88, 94, HERO_VB.goji),
    // バーガー くん: ゴマの ぼうしの バーガーに かお・て・あし
    bm_toy_burger: () => base(32) + feet(40, 60, 92, "#E6BA76") + arm(17, 66, 35, "#E8BF81") + arm(83, 62, -45, "#E8BF81")
      + `<g transform="translate(12 22) scale(1.18)">${FOOD_ART.burger}${faceOn(32, 17, 0.8)}</g>`,
    // ポテト くん: ポテトの かみの はこに かお・あし
    bm_toy_potato: () => base(30) + feet(41, 59, 93, "#F0625A") + arm(25, 70, 30, "#F0625A") + arm(75, 70, -30, "#F0625A") + `<g transform="translate(9 22) scale(1.15)">${fries(2, true)}</g>`,
    // シェイク ちゃん: いちご シェイクの カップに かお・て
    bm_toy_shake: () => base(30) + feet(42, 58, 93, "#F7A1C0") + arm(26, 72, 25, "#FFFFFF") + arm(74, 72, -25, "#FFFFFF") + `<g transform="translate(13 20) scale(1.15)">${shake("#F7A1C0", "#FFFFFF", true)}</g>`,
  };
  const TOYS = [
    { id: "bm_toy_wanko", name: "わんこと バーガー", desc: "にこにこ セットの おまけ。チーズバーガーを ぎゅっと だいた わんこ。" },
    { id: "bm_toy_gachan", name: "がちゃんと ポテト", desc: "にこにこ セットの おまけ。ポテトを かかえた がちゃん。" },
    { id: "bm_toy_goji", name: "ごじと シェイク", desc: "にこにこ セットの おまけ。チョコ シェイクを だいじに もつ ごじ。" },
    { id: "bm_toy_burger", name: "バーガー くん", desc: "にこにこ セットの おまけ。ゴマの ぼうしが じまんの バーガー くん。" },
    { id: "bm_toy_potato", name: "ポテト くん", desc: "にこにこ セットの おまけ。ポテトの かみが じまんの ポテト くん。" },
    { id: "bm_toy_shake", name: "シェイク ちゃん", desc: "にこにこ セットの おまけ。いちご シェイクの シェイク ちゃん。" },
  ];
  const TOY_INDEX = {};
  const toySvg = (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">${TOY_ART[id]()}</svg>`;
  for (const t of TOYS) {
    const f = { id: t.id, name: t.name, price: 0, kind: "floor", w: 50, h: 55, depth: 30, comfort: 3, exclusive: "burger", burgerToy: true, desc: t.desc };
    FURNITURE.push(f); FURN_INDEX[t.id] = f; TOY_INDEX[t.id] = f;
    FURN_ART[t.id] = () => `<g transform="scale(0.5)">${TOY_ART[t.id]()}</g>`;
  }
  const have = (id) => (Save.d.furn[id] || 0) > 0;
  const count = () => TOYS.filter((t) => have(t.id)).length;
  // つぎの おもちゃ: まだ もって いない ものから（ぜんぶ ある ときは どれでも）
  const nextToy = (rnd = Math.random) => { const pool = TOYS.filter((t) => !have(t.id)); const list = pool.length ? pool : TOYS; return list[Math.floor(rnd() * list.length) % list.length]; };

  // ---- おみせ（BUY_SHOPS.burger を 4つの タブに）----
  const shop = BUY_SHOPS.burger;
  shop.hello = ["いらっしゃいませ！ できたての バーガーは いかが？", "セットには おまけの おもちゃが ついてるよ！"];
  shop.tabs = TABS.map(([k, label]) => [k, label]);
  shop.cls = "shop-bm"; // なまえは ことばの きれめで おりかえす（てりやき／バーガー）
  shop.items = (tab) => (TABS.find((t) => t[0] === tab) || TABS[0])[2].map((id) => BAG_INDEX[id]);
  // かった あと（js/shop.js）: にこにこ セットは かずだけ おもちゃを わたす（セーブの まえ）。かえりは おもちゃの まどを ひらく かんすう
  shop.bought = (it, qty) => {
    if (!it || it.id !== SET_ID) return null;
    const got = [];
    for (let i = 0; i < qty; i++) { const t = nextToy(), fresh = !have(t.id); Save.d.furn[t.id] = (Save.d.furn[t.id] || 0) + 1; got.push({ ...t, fresh }); }
    return () => reveal(got);
  };
  shop.note = (it) => (it && it.id === SET_ID ? `おまけの おもちゃは ぜんぶで ${TOYS.length}しゅ（もってる: ${count()}しゅ）。まだ もって いない ものから でるよ。` : "");

  // おまけの まど: でた おもちゃ・あつめた かず（6しゅ）
  const pic = (id, size) => `<span class="bm-pic" style="width:${size}px;height:${Math.round(size * 1.1)}px">${toySvg(id)}</span>`;
  const reveal = (got) => new Promise((resolve) => {
    Sound.se("fanfare");
    const body = U.el("div", { class: "bm-reveal" });
    body.append(U.el("p", { class: "bm-lead", text: got.length > 1 ? `おまけの おもちゃが ${got.length}こ はいってた！` : "おまけの おもちゃが はいってた！" }));
    const row = U.el("div", { class: "bm-got" });
    for (const t of got) row.append(U.el("div", { class: "bm-toy", html: `${pic(t.id, got.length > 2 ? 64 : 96)}<b class="bm-name">${t.name}</b>${t.fresh ? '<span class="bm-new">はじめて！</span>' : ""}` }));
    const all = U.el("div", { class: "bm-all" });
    for (const t of TOYS) all.append(U.el("div", { class: "bm-mini" + (have(t.id) ? "" : " none"), html: have(t.id) ? pic(t.id, 34) : "？" }));
    body.append(row, U.el("div", { class: "bm-count", text: `おもちゃ あつめ ${count()} / ${TOYS.length}` }), all,
      U.el("p", { class: "note", text: "おへやの もようがえや フィギュア だいに かざれるよ。" }));
    const m = UI.modal({ title: "にこにこ セットの おまけ", body, cls: "bm-panel", footer: UI.btn("やったー！", () => m.close(), "yellow wide"), onClose: resolve });
  });

  return {
    SET_ID, TABS, TOYS, TOY_INDEX, toySvg, count, nextToy,
    // ずかんの ヒント
    source(id) { return TOY_INDEX[id] ? "バーガーやさんの「にこにこ セット」を かうと、おまけで もらえるよ。" : ""; },
    // PokaDebug 用
    state() { return { tabs: TABS.map(([k, label, ids]) => ({ k, label, ids: [...ids] })), toys: TOYS.map((t) => ({ id: t.id, name: t.name, n: Save.d.furn[t.id] || 0 })), count: count(), set: Save.d.bag[SET_ID] || 0 }; },
  };
})();
