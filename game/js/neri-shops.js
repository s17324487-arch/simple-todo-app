// ネリカスタウンの あたらしい お店（オーナーの FB 2026-09-29「2種類の コンビニは、売って いる 商品を 変える」「レストランは 内装を 実際の ファミレス風に」）。
// ・コンビニ「ローリソン」: からあげ・おにぎり・ロールケーキ・プリン・たまごサンド・ぎゅうにゅう（あおい おみせ・つめたい たな・あつあつ ケース）
// ・コンビニ「せぶんぶん」: おでん・メロンパン・あったか ココア・アイス・ゼリー・オレンジジュース（おでんの なべ・アイスの れいとうこ・パンの たな）
// どちらも 歩いて 入る 店（StoreScene・10×12マスの 斜め上の 館。什器の 絵は js/store-iso-props.js の cvsback・opencase・kuji_* など）。あたらしい 食べ物 10しゅ（ファミレス びっくぽの メニューも）の 絵は FOOD_ART（64×64・INK）。
// 食べ物は exclusive（スーパーの たなには ならばない）。セーブは もちもの（Save.d.bag）に ふえる だけ。
const NeriShops = (() => {
  const S = (w = 3) => IS(w);
  const hi = (x, y, rx, ry, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity=".55"/>`;
  const plate = (cy = 52, rx = 25, ry = 6.5) => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFFFF" ${S()}/><ellipse cx="32" cy="${cy - 0.8}" rx="${rx - 7}" ry="${ry - 2.6}" fill="none" stroke="#D5E2EA" stroke-width="2"/>`;
  const steam = (x, y) => `<path d="M${x},${y} c-4,-4 4,-6 0,-11 M${x + 9},${y + 1} c-4,-4 4,-6 0,-11" fill="none" stroke="#B9C6CF" stroke-width="2.6" stroke-linecap="round"/>`;
  const berry = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,-5 C-6,-5 -6,3 0,6 C6,3 6,-5 0,-5 Z" fill="#E53935" ${S(1.8)}/><path d="M-3,-5 L0,-8 L3,-5 L0,-3.6 Z" fill="#5FAE4E" ${S(1.2)}/><circle cx="-1.6" cy="0" r=".7" fill="#FFE9A8"/><circle cx="1.8" cy="1.6" r=".7" fill="#FFE9A8"/></g>`;
  const nugget = (x, y, r, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-r},0 C${-r},${-r * 0.9} ${-r * 0.3},${-r * 1.1} ${r * 0.3},${-r} C${r},${-r * 0.8} ${r * 1.1},${-r * 0.1} ${r * 0.9},${r * 0.5} C${r * 0.6},${r} ${-r * 0.4},${r * 1.05} ${-r * 0.8},${r * 0.6} C${-r},${r * 0.4} ${-r},${r * 0.2} ${-r},0 Z" fill="#D98A2E" ${S(2.4)}/><path d="M${-r * 0.5},${-r * 0.45} q${r * 0.35},${-r * 0.3} ${r * 0.7},${-r * 0.1}" fill="none" stroke="#F3BE63" stroke-width="2.2" stroke-linecap="round"/><circle cx="${r * 0.35}" cy="${r * 0.2}" r="1" fill="#A45A1C"/><circle cx="${-r * 0.3}" cy="${r * 0.35}" r=".9" fill="#A45A1C"/></g>`;
  // ---- あたらしい 食べ物（id, なまえ, ねだん, おなか, きぶん, 体力, SP, せつめい, 絵）----
  const FOOD = [
    ["karaage", "からあげ", 40, 24, 10, 28, 0, "あつあつ ころころの からあげ。ローリソンの たなの よこで あげたて", `<path d="M14,33 L50,33 L45,58 L19,58 Z" fill="#E95F4B" ${S()}/><path d="M16.5,42 L47.5,42 L46.4,47 L17.6,47 Z" fill="#FFF3E0" stroke="none"/><path d="M26,52 h12" stroke="#FFF3E0" stroke-width="2.6" stroke-linecap="round"/>${nugget(22, 30, 8, -15)}${nugget(41, 30, 8, 20)}${nugget(31, 24, 8.5, 5)}${nugget(27, 33, 6, 40)}<path d="M40,6 L45,27" stroke="#C9A36A" stroke-width="2.6" stroke-linecap="round"/><path d="M40,6 L50,9 L42,13 Z" fill="#FFD54F" ${S(1.8)}/>`],
    ["rollcake", "デザ・ロールケーキ", 60, 14, 20, 14, 0, "ふわふわ スポンジに ミルクの クリーム", `${plate(52, 26, 7)}<path d="M13,31 L13,44 C13,51 22,55 32,55 C42,55 51,51 51,44 L51,31 Z" fill="#F0C27B" ${S()}/><ellipse cx="32" cy="31" rx="19" ry="9.5" fill="#F7D79C" ${S()}/><path d="M32,31 m-2.5,0 a2.5,1.6 0 1,1 5,0 a6.5,3.8 0 1,1 -12.5,0 a10.5,6 0 1,1 20.5,0" fill="none" stroke="#FFFBF2" stroke-width="3.4" stroke-linecap="round"/><path d="M32,31 m-2.5,0 a2.5,1.6 0 1,1 5,0 a6.5,3.8 0 1,1 -12.5,0 a10.5,6 0 1,1 20.5,0" fill="none" stroke="#E1A45A" stroke-width="1" stroke-linecap="round"/>${hi(18, 40, 2.4, 6)}${berry(44, 22, 1.1)}`],
    ["oden", "おでん", 45, 30, 8, 34, 0, "だいこん・たまご・こんにゃく。ぐつぐつ あったか", `<path d="M8,32 C8,48 18,57 32,57 C46,57 56,48 56,32 Z" fill="#FFF8EC" ${S()}/><ellipse cx="32" cy="32" rx="24" ry="7" fill="#E9B872" ${S()}/><path d="M17,31 C17,24 27,22 29,26 C30,30 26,34 20,34 Z" fill="#FFF3CF" ${S(2.4)}/><path d="M20,28 q3,-2 6,0" fill="none" stroke="#E4C98F" stroke-width="1.8"/><ellipse cx="36" cy="27" rx="7" ry="5.5" fill="#FFFFFF" ${S(2.4)}/><ellipse cx="36" cy="28" rx="3.2" ry="2.6" fill="#FFD54F" stroke="none"/><path d="M42,34 L50,22 L55,33 Z" fill="#9EA3A8" ${S(2.4)}/><circle cx="49" cy="29" r=".9" fill="#5D6166"/><circle cx="51.6" cy="31" r=".9" fill="#5D6166"/><path d="M12,42 C20,46 44,46 52,42" fill="none" stroke="#E6D5B8" stroke-width="2.2"/>${steam(22, 17)}`],
    ["cocoa", "あったか ココア", 30, 6, 12, 0, 12, "ほっと あまい ココア。げんき(SP)が もどる", `<path d="M14,24 L14,50 C14,55 20,58 30,58 C40,58 46,55 46,50 L46,24 Z" fill="#FFFFFF" ${S()}/><path d="M46,30 C58,30 58,46 46,46" fill="none" ${S(3.4)}/><ellipse cx="30" cy="24" rx="16" ry="5" fill="#8D5B3E" ${S()}/><rect x="24" y="19" width="9" height="7" rx="2" fill="#FFF3F6" ${S(2)}/><rect x="31" y="21" width="7" height="6" rx="2" fill="#FFE3EC" ${S(2)}/><path d="M18,38 C24,41 36,41 42,38" fill="none" stroke="#F2C9A5" stroke-width="3"/>${steam(24, 14)}`],
    ["hamburg", "ハンバーグ", 120, 55, 14, 60, 0, "じゅわっと にくじるの ハンバーグ。びっくぽの いちばん にんき", `<rect x="4" y="40" width="56" height="17" rx="5" fill="#B98457" ${S()}/><ellipse cx="32" cy="41" rx="27" ry="12" fill="#4B4B52" ${S()}/><ellipse cx="32" cy="40" rx="22" ry="9" fill="#62626A" stroke="none"/><path d="M14,38 C13,29 22,25 31,25 C42,25 49,29 48,37 C47,44 39,47 30,47 C21,47 15,44 14,38 Z" fill="#8B5A34" ${S()}/><path d="M17,34 C22,30 38,28 45,33 C42,39 26,40 17,34 Z" fill="#6E3A1E" stroke="none"/>${hi(25, 31, 5, 2, -8)}<ellipse cx="50" cy="44" rx="5" ry="3.4" fill="#F57C00" ${S(1.8)}/><circle cx="12" cy="45" r="3.6" fill="#5FAE4E" ${S(1.8)}/><circle cx="15" cy="49" r="2.2" fill="#FFD54F" ${S(1.2)}/><circle cx="19" cy="50" r="2.2" fill="#FFD54F" ${S(1.2)}/>${steam(26, 16)}`],
    ["omurice", "オムライス", 110, 52, 16, 55, 0, "ふわとろ たまごに ケチャップの ハート", `${plate(49, 28, 9)}<path d="M8,45 C8,30 20,22 32,22 C44,22 56,30 56,45 C48,50 16,50 8,45 Z" fill="#FFD54F" ${S()}/><path d="M13,40 C16,31 26,27 34,27" fill="none" stroke="#FFF0A8" stroke-width="3" stroke-linecap="round"/><path d="M18,36 q4,-5 8,0 t8,0 t8,0 t6,0" fill="none" stroke="#E53935" stroke-width="3.2" stroke-linecap="round"/><path d="M32,42 c-2,-3 -6,-1 -4,2 l4,4 l4,-4 c2,-3 -2,-5 -4,-2 Z" fill="#E53935" ${S(1.4)}/><circle cx="47" cy="40" r="3" fill="#5FAE4E" ${S(1.6)}/>`],
    ["doria", "ドリア", 100, 48, 12, 50, 0, "とろーり チーズの ドリア。やけどに きを つけて", `<ellipse cx="32" cy="42" rx="28" ry="14" fill="#FFFFFF" ${S()}/><ellipse cx="32" cy="39" rx="23" ry="10" fill="#F4C064" ${S(2.4)}/><path d="M13,40 C16,34 24,31 32,31 C40,31 48,34 51,40" fill="none" stroke="#FFE08A" stroke-width="3" stroke-linecap="round"/><ellipse cx="24" cy="37" rx="3.4" ry="2" fill="#C8792A" stroke="none"/><ellipse cx="38" cy="35" rx="3" ry="1.8" fill="#C8792A" stroke="none"/><ellipse cx="33" cy="42" rx="3.6" ry="2" fill="#B8651F" stroke="none"/><ellipse cx="44" cy="41" rx="2.4" ry="1.5" fill="#C8792A" stroke="none"/><circle cx="19" cy="42" r="1.8" fill="#5FAE4E" stroke="none"/><path d="M3,40 C3,34 7,32 9,33 M61,40 C61,34 57,32 55,33" fill="none" ${S(2.4)}/>${steam(26, 15)}`],
    ["kidsplate", "おこさまランチ", 90, 50, 22, 50, 0, "はたが たった ごはんと ミニ ハンバーグ。こどもの ゆめの ひとさら", `<path d="M4,44 C4,37 14,33 32,33 C50,33 60,37 60,44 C60,51 50,56 32,56 C14,56 4,51 4,44 Z" fill="#8FD0E8" ${S()}/><ellipse cx="32" cy="43" rx="23" ry="8" fill="#E6F6FB" stroke="none"/><path d="M12,43 C12,34 26,33 26,43 Z" fill="#FFFDF5" ${S(2.4)}/><path d="M19,34 V20" stroke="#8A6A4A" stroke-width="2.2" stroke-linecap="round"/><path d="M19,20 L29,23 L19,26 Z" fill="#E53935" ${S(1.6)}/><circle cx="23" cy="23" r="1.3" fill="#FFFFFF" stroke="none"/><ellipse cx="36" cy="44" rx="7" ry="4.6" fill="#8B5A34" ${S(2.2)}/><path d="M31,42 q5,-3 10,0" fill="none" stroke="#6E3A1E" stroke-width="2"/><path d="M47,40 C47,36 53,36 53,40 L54,46 M49,46 L50,41 M52,46 L51,41" fill="#E8584A" ${S(2)}/><path d="M46,40 C46,36 54,36 54,41 C54,43 46,43 46,40 Z" fill="#E8584A" ${S(2)}/><circle cx="12" cy="48" r="3" fill="#5FAE4E" ${S(1.6)}/><path d="M27,51 q3,-3 6,0 t6,0" fill="none" stroke="#F4B860" stroke-width="3" stroke-linecap="round"/>`],
    ["pancake", "デザ・パンケーキ", 80, 20, 22, 20, 0, "ふかふかの 3だん。バターと はちみつ", `${plate(54, 26, 6.5)}<path d="M12,48 C12,44 20,42 32,42 C44,42 52,44 52,48 C52,52 44,54 32,54 C20,54 12,52 12,48 Z" fill="#E7A95A" ${S(2.4)}/><path d="M13,40 C13,36 20,34 32,34 C44,34 51,36 51,40 C51,44 44,46 32,46 C20,46 13,44 13,40 Z" fill="#EDB566" ${S(2.4)}/><path d="M14,32 C14,28 21,26 32,26 C43,26 50,28 50,32 C50,36 43,38 32,38 C21,38 14,36 14,32 Z" fill="#F2C178" ${S(2.4)}/><ellipse cx="32" cy="30" rx="15" ry="4.6" fill="#F7D38F" stroke="none"/><path d="M22,30 C26,34 38,34 42,30 C42,38 44,42 40,44 C38,40 36,38 36,34 C32,36 28,36 26,34 C26,40 24,42 22,40 Z" fill="#D9881E" fill-opacity=".85" stroke="none"/><rect x="27" y="22" width="10" height="7" rx="1.5" fill="#FFF3B0" ${S(2)}/>`],
    ["parfait", "デザ・パフェ", 95, 18, 26, 18, 0, "いちごと クリームと コーンフレークの しましま", `<path d="M20,20 L44,20 L40,46 L24,46 Z" fill="#E9F4F8" ${S()}/><path d="M22,30 L42,30 L41.2,36 L22.8,36 Z" fill="#F48FB1" stroke="none"/><path d="M22.8,36 L41.2,36 L40.3,42 L23.7,42 Z" fill="#F2C57C" stroke="none"/><path d="M21,24 L43,24 L42.2,30 L21.8,30 Z" fill="#FFFDF5" stroke="none"/><path d="M20,20 L44,20 L40,46 L24,46 Z" fill="none" ${S()}/><path d="M30,46 L30,54 M22,56 C22,53 42,53 42,56" fill="none" ${S()}/><path d="M18,20 C18,10 26,8 32,11 C38,8 46,10 46,20 Z" fill="#FFFDF8" ${S()}/>${berry(32, 8, 1.3)}<path d="M42,4 L38,18" stroke="#D9A866" stroke-width="4" stroke-linecap="round"/><path d="M42,4 L38,18" stroke="#F4D49A" stroke-width="1.6" stroke-linecap="round"/>${hi(24, 33, 1.6, 6)}`],
  ];
  for (const [id, name, price, hunger, mood, hp, sp, desc, art] of FOOD) {
    const f = { id, name, price, hunger, mood, hp, ...(sp ? { sp } : {}), deza: name.startsWith("デザ・"), rare: false, exclusive: "nerikasu", desc };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" }; FOOD_ART[id] = art;
  }

  // ---- 2つの コンビニ（店内・店員・品ぞろえ・かんばんの しるし・BGM）----
  const SHOPS2 = {
    lawson: {
      name: "ローリソン", keeper: { sp: "bear", col: "#A1887F", name: "くまの アオ", outfit: { body: "marine_stripe", neck: "bowtie_blue" }, look: { eye: "smile", cheek: "peach" } }, keeperName: "てんいんの アオ",
      hello: ["いらっしゃいませ〜！ あげたての からあげ、いかが？", "ロールケーキも ひえてるよ。"],
      goods: ["karaage", "onigiri", "rollcake", "pudding", "sandwich", "milk"],
      design: {
        wall: "#E4EFF8", wallPat: "tile", accent: "#4A8CC9", wainscot: "#C6DCEF", wainPat: "tile", wood: "#D9D2C4", caption: "あげたて からあげと ひえた スイーツ",
        mats: { ".": { c: ["#F1F5F8", "#E6ECF1"], pat: "tile" } },
        counter: { body: "#4A8CC9", top: "#F2F5F7", items: ["hotcase", "bags"] },
        walls: {
          north: [{ t: "board", a: 0.3, b: 2.7, z0: 182, z1: 222, lines: ["つめたい ドリンク"], col: "#FFFDF4" }, { t: "sign", a: 3.9, b: 7.1, z0: 174, z1: 220 }],
          west: [{ t: "stripe", a: 0, b: 12, z0: 212, z1: 220, col: "#4A8CC9" }, { t: "board", a: 3.2, b: 5.8, z0: 180, z1: 206, lines: ["おにぎり・サンド"], col: "#FFFDF4" }, { t: "board", a: 7.2, b: 9.8, z0: 180, z1: 206, lines: ["スイーツ"], col: "#FFFDF4" }, { t: "window", a: 10.2, b: 11.8, z0: 104, z1: 200 }],
        },
        fixtures: [
          ["cvsback", 4, 0, 3, 1, "コーヒーと フライヤー"], ["hotdrinks", 4, 1, 1, 1, "ホットの のみもの"], ["microwave", 6, 1, 1, 1, "でんしレンジ"],
          ["fridge", 0, 0, 3, 1, "つめたい のみもの", { variant: "drinks", sign: "ドリンク" }], ["kuji_lawson", 7, 0, 3, 1, "いちばんくじ"],
          ["opencase", 0, 3, 1, 3, "おにぎりと サンドイッチ", { foods: ["onigiri", "sandwich", "karaage", "onigiri", "sandwich"], sign: "おにぎり" }],
          ["opencase", 0, 7, 1, 3, "ロールケーキと プリン", { foods: ["rollcake", "pudding", "milk", "deza_jelly"], sign: "スイーツ" }],
          ["gondola", 2, 4, 1, 4, "おかしの たな", { foods: ["ike_snack_chips", "ike_snack_choco", "ike_snack_senbei", "ike_snack_gummy", "ike_snack_popcorn"], sign: "おかし" }],
          ["gondola", 7, 4, 2, 1, "パンの たな", { variant: "bread", sign: "パン" }], ["freezer", 7, 6, 2, 2, "アイスの れいとうこ", { foods: ["deza_ice", "deza_shavedice"], sign: "アイス" }],
          ["atm", 8, 9, 2, 1, "ATMと コピーき"], ["magrack", 0, 10, 1, 2, "えほんと ざっし"], ["baskets", 3, 10, 1, 1, "おかいもの かご", { col: "#4A8CC9" }],
          ["npc", 3, 6, 1, 1, "おかいものの おきゃくさん", { sp: "dog", ci: 2, dir: "left", action: "chat", lines: ["おにぎり、どれに しようかな〜", "からあげ、あげたて だって！"] }],
        ],
      },
      icon: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-8,10 L-8,-4 C-8,-10 8,-10 8,-4 L8,10 Z" fill="#FFFFFF" stroke="#4A8CC9" stroke-width="2.4"/><rect x="-5" y="-14" width="10" height="5" rx="1.5" fill="#4A8CC9" stroke="none"/><path d="M-8,2 H8" stroke="#4A8CC9" stroke-width="2"/></g>`,
      song: ["disc_nacht", 132, ["pluck", "mallet", "bass"]],
    },
    sevenbun: {
      name: "せぶんぶん", keeper: { sp: "fox", name: "きつねの ナナ", outfit: { head: "hachimaki", body: "apron", neck: "bowtie_red" }, look: { eye: "sparkle", cheek: "pink" } }, keeperName: "てんいんの ナナ",
      hello: ["いらっしゃいませ！ おでん、ぐつぐつ にえてるよ。", "あったか ココアも あるよ。"],
      goods: ["oden", "cocoa", "bread", "deza_ice", "deza_jelly", "juice"],
      design: {
        wall: "#FDF3E8", wallPat: "stripe", accent: "#E86F3A", wainscot: "#F6D2B8", wood: "#D9C7A6", caption: "ぐつぐつ おでんと やきたて パン",
        mats: { ".": { c: ["#F6F3EC", "#ECE7DC"], pat: "tile" } },
        counter: { body: "#E86F3A", top: "#FBF6EE", items: ["oden", "steamer"] },
        walls: {
          north: [{ t: "board", a: 0.3, b: 2.7, z0: 182, z1: 222, lines: ["つめたい ドリンク"], col: "#FFFDF4" }, { t: "sign", a: 3.9, b: 7.1, z0: 174, z1: 220 }],
          west: [{ t: "stripe", a: 0, b: 12, z0: 208, z1: 212, col: "#F4A13A" }, { t: "stripe", a: 0, b: 12, z0: 212, z1: 216, col: "#3FA36B" }, { t: "stripe", a: 0, b: 12, z0: 216, z1: 220, col: "#E53935" }, { t: "board", a: 3.2, b: 5.8, z0: 178, z1: 204, lines: ["やきたて パン"], col: "#FFFDF4" }, { t: "board", a: 7.2, b: 9.8, z0: 178, z1: 204, lines: ["おにぎり"], col: "#FFFDF4" }, { t: "window", a: 10.2, b: 11.8, z0: 104, z1: 198 }],
        },
        fixtures: [
          ["cvsback", 4, 0, 3, 1, "コーヒーと ちゅうかまん"], ["cocoa", 4, 1, 1, 1, "あったか ココア"], ["microwave", 6, 1, 1, 1, "でんしレンジ"],
          ["fridge", 0, 0, 3, 1, "つめたい のみもの", { variant: "drinks", sign: "ドリンク" }], ["kuji_sevenbun", 7, 0, 3, 1, "いちばんくじ"],
          ["wallshelf", 0, 3, 1, 3, "メロンパンの たな", { variant: "bread", sign: "パン", wood: "#D9B686" }],
          ["opencase", 0, 7, 1, 3, "おにぎりと ゼリー", { foods: ["onigiri", "sandwich", "deza_jelly", "juice"], sign: "おにぎり" }],
          ["gondola", 2, 4, 1, 4, "おかしの たな", { foods: ["ike_snack_corn", "ike_snack_ramune", "ike_snack_stick", "ike_snack_candy", "ike_snack_waffle"], sign: "おかし" }],
          ["freezer", 7, 4, 2, 2, "アイスの れいとうこ", { foods: ["deza_ice", "deza_snow"], sign: "アイス" }], ["gondola", 7, 7, 2, 1, "あめと ガム", { variant: "candy", sign: "あめ" }],
          ["atm", 8, 9, 2, 1, "ATMと コピーき"], ["magrack", 0, 10, 1, 2, "えほんと ざっし"], ["baskets", 3, 10, 1, 1, "おかいもの かご", { col: "#E86F3A" }],
          ["npc", 3, 6, 1, 1, "おかいものの おきゃくさん", { sp: "raccoon", ci: 1, dir: "left", action: "chat", lines: ["おでんは だいこんが いちばん！", "ココアで ぽかぽか〜"] }],
        ],
      },
      icon: (x, y) => `<g transform="translate(${x} ${y})"><rect x="-10" y="-10" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#E86F3A" stroke-width="2.4"/><path d="M-10,-4 H10" stroke="#F4A13A" stroke-width="3.2"/><path d="M-10,1 H10" stroke="#3FA36B" stroke-width="3.2"/><path d="M-10,6 H10" stroke="#E53935" stroke-width="3.2"/></g>`,
      song: ["disc_twinkle", 120, ["mallet", "pluck", "bass"]],
    },
  };
  for (const [id, s] of Object.entries(SHOPS2)) {
    const goods = s.goods;
    BUY_SHOPS[id] = { name: s.name, keeper: s.keeper, keeperName: s.keeperName, hello: s.hello, kind: "bag", tabs: [["goods", "たべもの・のみもの"]], items: () => goods.map((g) => BAG_INDEX[g]).filter(Boolean) };
    STORE_INTERIORS[id] = s.design;
    SIGN_ICON[id] = s.icon;
    const [songId, bpm, inst] = s.song, src = SONGS[songId];
    if (src) SONGS["shop_" + id] = { ...src, title: s.name + "（" + src.title + "）", disc: false, bpm, tracks: src.tracks.map((t, k) => (t.drum ? t : { ...t, instrument: inst[k] || t.instrument })) };
  }
  return { FOOD: FOOD.map((f) => f[0]), SHOPS: SHOPS2 };
})();
