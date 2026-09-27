// おうちの新しい品ぞろえ。既存のIDは残し、一覧と索引の両方へ追加する。
(() => {
  const clothes = [
    ["mint_dress", "ミントの ワンピース", "body", "dress", ["#A7DCC5", "#FFF5DC"], 280],
    ["night_pajama", "ほしよる パジャマ", "body", "pajama", ["#888CCB", "#FFE9A8"], 210],
    ["peach_overalls", "ももいろ サロペット", "body", "overalls", ["#EBADB8"], 260],
    ["forest_coat", "もりの レインコート", "body", "raincoat", ["#92BC8F"], 240],
    ["cream_sweater", "クリーム セーター", "body", "sweater", ["#EFDBB9", "#FFFFFF"], 230],
    ["marine_stripe", "マリン シャツ", "body", "stripe", ["#619BBF", "#FFF7DE"], 180],
    ["lavender_apron", "ラベンダー エプロン", "body", "apron", ["#DDD0F2", "#FFFFFF"], 220],
    ["festival_happi", "はなびの はっぴ", "body", "happi", ["#AB80B6"], 280],
    ["sunny_shirt", "おひさま シャツ", "body", "tshirt", ["#F4B86D", "#FFF9D0"], 130],
    ["mint_beret", "ミントの ベレー", "head", "beret", ["#A5CDB7"], 170],
    ["rose_knit", "いちご ニットぼう", "head", "knit", ["#DF889F", "#FFEAD6"], 170],
    ["moon_hat", "よぞらの パーティーぼう", "head", "partyhat", ["#6778AA", "#FFF0A1"], 190],
    ["pearl_bow", "しろい リボン", "head", "ribbon", ["#F8ECD4"], 90],
    ["mint_scarf", "ミントの スカーフ", "neck", "scarf", ["#8FC7B1"], 120],
    ["purple_bow", "すみれの ちょうネクタイ", "neck", "bowtie", ["#B994D3"], 140],
    ["sky_muffler", "そらの マフラー", "neck", "muffler", ["#92C5DF", "#FFF6DD"], 180],
    ["rose_glasses", "ももいろ めがね", "face", "glasses", ["#C87793"], 140],
    ["mint_pack", "もりの リュック", "back", "backpack", ["#82AE99"], 290],
    ["night_cape", "よぞらの マント", "back", "cape", ["#706497", "#E8D297"], 550],
    ["peach_wings", "ももいろの はね", "back", "fairywings", ["#F2C5DD"], 750],
  ];
  for (const [id, name, slot, wear, col, price] of clothes) { const item = { id, name, slot, wear, col, price }; WEAR_ITEMS.push(item); ITEM_INDEX[id] = item; }
  WEAR.bunnyhood = ctx => ({ top: hatWrap(ctx, s => `<path d="M-36,2 Q-48,-38 -32,-43 Q-15,-46 -16,-5 M16,-5 Q16,-54 32,-51 Q51,-44 35,2" fill="${ctx.col[0]}" ${stroke(s)}/><path d="M-29,-8 L-31,-29 M28,-9 L31,-36" stroke="#EDACBC" stroke-width="8" stroke-linecap="round"/>`) });
  WEAR.starclip = ctx => ({ top: hatWrap(ctx, s => `<path d="${starPath(28, -12, 18, 8)}" fill="${ctx.col[0]}" ${stroke(s)}/><circle cx="23" cy="-14" r="2" fill="${INK}"/><circle cx="32" cy="-14" r="2" fill="${INK}"/>`) });
  for (const item of [{ id: "bunnyhood", name: "うさぎの フード", slot: "head", wear: "bunnyhood", col: ["#FFF1E2"], price: 330 }, { id: "starclip", name: "おほしさま ピン", slot: "head", wear: "starclip", col: ["#FFE39A"], price: 190 }]) { WEAR_ITEMS.push(item); ITEM_INDEX[item.id] = item; }
  for (const id of ["candy", "pudding", "cake", "bone"]) { const f = FOODS.find(f => f.id === id); f.deza = true; f.name = "デザ・" + f.name; Object.assign(BAG_INDEX[id], f); }
  for (const [id, name, price, hunger, mood, art] of [["deza_ice", "デザ・アイス", 35, 8, 14, "pudding"], ["deza_jelly", "デザ・ゼリー", 25, 7, 10, "pudding"], ["deza_tart", "デザ・タルト", 65, 16, 22, "cake"], ["mild_curry", "あまくちカレー", 55, 42, 8, "curry"], ["sandwich", "たまごサンド", 35, 32, 6, "bread"], ["soup", "おやさいスープ", 25, 24, 6, "milk"]]) {
    const f = { id, name, price, hunger, mood, hp: hunger, deza: id.startsWith("deza"), desc: id.startsWith("deza") ? "ごはんの あとの おたのしみ" : "からくない やさしい あじ" };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" }; FOOD_ART[id] = FOOD_ART[art];
  }
  const r = (x,y,w,h,c,rad=5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS()}/>`;
  const p = (d,c) => `<path d="${d}" fill="${c}" ${FS()}/>`;
  const circle = (x,y,n,c) => `<circle cx="${x}" cy="${y}" r="${n}" fill="${c}" ${FS()}/>`;
  const shelf = r(8,64,84,10,"#B58A69") + r(12,73,8,6,"#796050") + r(80,73,8,6,"#796050");
  const art = {
    aquarium: shelf + r(8,8,84,56,"#A5DCE7",8) + r(6,4,88,8,"#78939D") + p("M11,58 Q30,51 50,58 T89,56 L89,63 L11,63 Z","#F1D9AB") + p("M20,58 Q10,35 23,27 Q18,44 30,56 M72,59 Q89,35 78,27 Q72,38 77,51","#82B999") + `<ellipse cx="48" cy="34" rx="14" ry="8" fill="#EFB471" ${FS()}/>` + p("M60,34 L71,26 L71,42 Z","#EBA48D") + circle(43,32,2,INK) + circle(62,20,3,"#E8FAFD") + circle(35,46,2,"#E8FAFD"),
    musicbox: shelf + r(18,39,64,27,"#A7A4CE") + p("M18,40 L26,26 L74,26 L82,40 Z","#DBCAE7") + r(25,46,50,12,"#E8D8ED") + `<path d="${starPath(50,20,16,7)}" fill="#F5D57D" ${FS()}/>` + circle(50,52,3,"#F5D57D"),
    rockinghorse: p("M10,67 Q50,85 90,67 L87,73 Q50,91 13,74 Z","#B88C6B") + p("M26,64 L30,44 L21,25 L35,14 L46,23 L39,36 L77,36 L81,60 L72,64 L67,46 L45,48 L35,67 Z","#E8C49C") + p("M22,22 L27,7 L34,17","#C99B79") + r(46,32,22,12,"#D391A2") + circle(32,24,2,INK),
    train: shelf + r(10,35,25,25,"#A6CAB7") + r(42,24,33,36,"#91B6D3") + r(77,37,14,23,"#E3B876") + r(46,29,18,16,"#FBEFC6") + r(78,20,8,18,"#CF8D86") + circle(22,63,8,"#726777") + circle(51,63,8,"#726777") + circle(78,63,8,"#726777"),
    kitchen: shelf + r(7,33,86,33,"#E7D6B6") + r(10,4,80,27,"#EFDACC") + r(16,8,24,17,"#C2DEE0") + r(56,8,26,17,"#C2DEE0") + r(14,40,32,22,"#8D9CA8") + r(53,40,31,22,"#F6E7C9") + circle(69,49,2,INK) + `<ellipse cx="27" cy="33" rx="12" ry="4" fill="#544B50" ${FS()}/>` + r(55,23,24,10,"#A2C5B0"),
    desk: p("M18,42 L23,74 L29,74 L28,42 M75,42 L71,74 L78,74 L82,42","#AD886A") + r(10,31,80,13,"#DCC39C") + r(18,43,28,14,"#C8A482") + circle(32,49,2,"#F2D182") + r(32,20,27,10,"#ABC5BC") + r(47,15,28,6,"#D6B4C2") + p("M20,31 L20,10 L37,10 L40,17 L11,17 L16,10","#C6BDD9"),
    plantshelf: shelf + r(14,25,7,42,"#BA9774") + r(80,25,7,42,"#BA9774") + r(10,24,80,7,"#D5B28B") + r(22,52,19,12,"#D7AAA0") + r(60,14,17,12,"#AFC4D7") + p("M32,53 Q12,27 30,35 Q31,10 41,30 Q57,30 32,53 M68,15 Q52,-1 65,5 Q78,-4 76,8 Z","#87B898"),
    tent: p("M8,72 L50,5 L92,72 Z","#D6B5CC") + p("M34,71 L50,31 L65,71 Z","#FFF1D0") + p("M50,7 L72,15 L51,21 Z","#EED082") + r(26,68,49,7,"#E6CB9D") + `<path d="M22,56 L35,34 M67,35 L80,56" stroke="#F5E2ED" stroke-width="3"/>`,
    cloudsofa: shelf + p("M10,43 C-2,29 8,17 22,22 C27,2 43,5 50,18 C60,2 79,6 78,23 C93,15 104,34 88,45 Z","#C5D6E6") + r(8,38,84,28,"#DAE4ED",12) + r(18,39,32,21,"#FFF1D5",8) + r(52,39,30,21,"#EED0D9",8),
    vanity: shelf + r(27,2,46,45,"#D6B8C5",20) + r(33,7,34,34,"#DCF1F4",17) + `<path d="M39,13 L58,32 M42,11 L64,30" stroke="#FFFFFF" stroke-width="3"/>` + r(12,47,76,17,"#E6C9CE") + circle(49,55,3,"#D5B36F") + r(72,35,8,12,"#9CAFC5"),
    fireplace: r(17,13,66,54,"#D9A99A") + r(24,24,52,36,"#5A4955") + p("M36,57 C22,42 47,46 47,28 C62,38 75,52 62,58 Z","#EEB56B") + p("M46,57 C40,48 57,46 55,39 C67,52 58,60 46,57 Z","#FFF2B7") + r(10,7,80,9,"#ECD8B4") + r(9,66,82,10,"#AD8B79"),
    teacart: shelf + r(18,29,7,35,"#A98B72") + r(76,29,7,35,"#A98B72") + r(10,27,80,8,"#E7CEA4") + circle(26,74,5,"#695F67") + circle(75,74,5,"#695F67") + r(23,10,18,17,"#B5D4CD") + circle(49,19,6,"#E5C6CF") + r(50,11,13,16,"#E5C6CF") + r(67,17,17,10,"#F3E4B8"),
  };
  const names = ["おさかな アクアリウム", "ほしの オルゴール", "ゆらゆら もくば", "おもちゃの きしゃ", "おままごと キッチン", "おえかき デスク", "みどりの たな", "ひみつの テント", "くもいろ ソファ", "おしゃれ ドレッサー", "あったか だんろ", "おちゃの ワゴン"];
  Object.entries(art).forEach(([id, svg], i) => { const f = { id, name: names[i], price: [850,650,480,560,1100,420,380,700,980,760,1200,430][i], kind: "floor", w: 100, h: 84, comfort: 5 + i % 4, interactive: [0,1,2,3,4,10].includes(i) }; FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = () => svg; });
  for (const id of ["piano", "tv", "clock", "fishbowl", "toybox", "lamp"]) FURN_INDEX[id].interactive = true;
  const sofaBase = FURN_ART.sofa;
  FURN_ART.sofa = opts => sofaBase(opts) + `<path d="M22,25 L45,25 M59,25 L83,25" stroke="#FFE8EC" stroke-width="3"/><rect x="21" y="25" width="24" height="19" rx="6" fill="#F8E6C5" ${FS(1.5)}/><rect x="63" y="25" width="23" height="19" rx="6" fill="#BAD7CB" ${FS(1.5)}/>`;
  for (const [id,name,base,c2,pat] of [["wp_sakura","さくらの かべ","#F6DDE8","#EAB7CA","dots"],["wp_mint","ミントの タイル","#D6ECE1","#B2D5C5","check"],["wp_lavender","すみれの かべ","#E4DDF2","#CFC0E7","stripe"],["wp_sunset","ゆうやけの そら","#F7D4B5","#FFF1D3","cloud"]]) { const f={id,name,base,c2,pat,price:350,comfort:3}; WALLPAPERS.push(f); WALL_INDEX[id]=f; }
  for (const [id,name,base,c2,pat] of [["fl_white","しろい きのゆか","#F0E5D5","#D8C9B4","plank"],["fl_mint","ミント カーペット","#B7D5C4","#A0C2AF","carpet"],["fl_night","よぞら タイル","#7F89AA","#F0DCA4","checker"]]) { const f={id,name,base,c2,pat,price:380,comfort:3}; FLOORS.push(f); FLOOR_INDEX[id]=f; }
})();
