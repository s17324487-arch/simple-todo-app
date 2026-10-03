// ネリカスタウン（MAP_DEFS.town）を、オーナーの 配置イメージ（2026-09-29・練馬の 春日町の 地図に かいた もの）どおりに 作りなおす。
//   ななめの 大通り（左下 → 右上。北東の はしで 北へ まがって 平和台へ）。北がわに 家具・洋服・クレープ・ローリソン・びっくぽ（階段の ように ならぶ）。
//   南がわに アパート・小さい 公園・お花屋さん。大通りから 2本の ななめの 道が 南東へ。あいだに 大きな 公園・中華料理屋。東に ガソリンスタンド・お届けセンター・池。
//   左の たての 道の 西に スーパー・郵便局、東に 憩いの森。よこの 道（中）の 北に ころころ フルーツ・ケーキ・家、南に お家・せぶんぶん・歯医者・サロン・パン屋。
//   よこの 道（下）の 南に 小学校・保育園。右の たての 道の 東に 家の 列。右の 道の 上は 平和台、下は はらっぱへ。
// 旧IDの 建物・act・NPC・名前つきの 物体は そのまま（tools/town-check.mjs）。オーナーが「消えても よい」と した 旧い 建物は REMOVED に 理由と いっしょに 書く。
// 建物の 絵は tools/town-design/nerikasu-buildings.mjs（js/nerikasu-town-art.js に 生成・昼と 夜の 2つだけ）。
const NerikasuLayout = (() => {
  const W = 78, H = 72, TSZ = 32;
  // 大通り: 画像の (296,408)・(704,137) を とおる ななめ（1マス = 16px）。北東の はしで 半径 6 の 弧で 北へ まがる
  const OO_A = [-1, 41.68], OO_P = [45.5, 10.73], OO_R = 6, OO_A0 = Math.atan2(0.8326, 0.5539);
  const OO_C = [OO_P[0] - OO_R * Math.cos(OO_A0), OO_P[1] - OO_R * Math.sin(OO_A0)], OO_Q = [OO_C[0] + OO_R, OO_C[1]];
  const ROADS = [
    { id: "neri-oodori", carriage: 4, side: 1, pieces: [{ t: "seg", a: OO_A, b: OO_P }, { t: "arc", c: OO_C, r: OO_R, a0: OO_A0, a1: 0 }, { t: "seg", a: OO_Q, b: [OO_Q[0], -1] }] },
    { id: "neri-west", carriage: 2, side: 1, pieces: [{ t: "seg", a: [14.4, 31.4], b: [14.4, 64.4] }] },
    { id: "neri-naka", carriage: 2, side: 1, pieces: [{ t: "seg", a: [14.4, 50.8], b: [66.1, 50.8] }] },
    { id: "neri-shita", carriage: 2, side: 1, pieces: [{ t: "seg", a: [14.4, 62.4], b: [66.1, 62.4] }] },
    { id: "neri-komichi", carriage: 2, side: 0, pieces: [{ t: "seg", a: [27.9, 50.8], b: [27.9, 62.4] }] },
    { id: "neri-east", carriage: 2, side: 1, pieces: [{ t: "seg", a: [66.1, -1], b: [66.1, H + 1] }] },
    { id: "neri-naname1", carriage: 2, side: 0, pieces: [{ t: "seg", a: [34.6, 18.0], b: [42.9, 38.8] }] },
    { id: "neri-naname2", carriage: 2, side: 0, pieces: [{ t: "seg", a: [45.1, 10.9], b: [54.0, 38.8] }] },
    { id: "neri-yoko", carriage: 2, side: 0, pieces: [{ t: "seg", a: [42.9, 38.8], b: [66.1, 38.8] }] },
    { id: "neri-naname3", carriage: 2, side: 0, pieces: [{ t: "seg", a: [56.66, 38.8], b: [60.0, 50.8] }] },
  ];
  const oodoriY = (x) => 29.53 - (x - 17.25) * 0.6655;
  // 建物: id, x, y, w, h, door（左からの マス）, 絵, ほか。fresh は あたらしい 建物（旧IDが ない）
  const BUILDINGS = [
    // 大通りの 北（階段の ように 右ほど 上）
    ["nerikasu_home7", 1, 27, 8, 5, 4, "nerikasu.bld_nerikasu_home7", { house: true }],
    ["furniture", 9, 24, 6, 4, 3, "nerikasu.bld_furniture", {}],
    ["clothes", 16, 20, 5, 4, 2, "nerikasu.bld_clothes", {}],
    ["crepe", 22, 15, 6, 4, 3, "nerikasu.bld_crepe", {}],
    ["neri_lawson", 28, 10, 8, 4, 4, "nerikasu.bld_neri_lawson", { fresh: true, label: "ローリソン", style: "town_lawson", act: { type: "buy", shop: "lawson" } }], // 品ぞろえと 店内は js/neri-shops.js
    ["neri_bikkupo", 36, 3, 9, 5, 4, "nerikasu.bld_neri_bikkupo", { fresh: true, label: "レストラン びっくぽ", style: "town_bikkupo", act: { type: "venue", venue: "bikkupo" } }], // ファミレスの 館（js/neri-bikkupo.js）。バーガーの おてつだいは キッチンの カウンター
    // 大通りの 南・左の 道の 西
    ["market", 2, 43, 10, 4, 5, "nerikasu.bld_market", {}],
    ["neri_post", 4, 49, 7, 4, 3, "nerikasu.bld_neri_post", { fresh: true, label: "ネリカス ゆうびんきょく", style: "town_post", act: { type: "work", shop: "postoffice" } }],
    // 大通りの 南（アパート・お花屋さん）
    ["neri_apartment", 20, 31, 8, 6, 4, "nerikasu.bld_neri_apartment", { fresh: true, label: "ひだまり アパート", style: "town_apartment", act: { type: "venue", venue: "neri_apart" } }],
    ["florist", 30, 33, 9, 4, 4, "nerikasu.bld_florist", {}],
    // ななめの 道の あいだ・東
    ["neri_chuka", 43, 31, 7, 4, 3, "nerikasu.bld_neri_chuka", { fresh: true, label: "中華 ねりかす飯店", style: "town_chuka", act: { type: "visit", text: "いまは したごしらえ ちゅう。\nおいしそうな においが する…" } }],
    ["neri_gas", 49, 14, 9, 5, 6, "nerikasu.bld_neri_gas", { fresh: true, label: "ネリカス ガソリンスタンド", style: "town_gas", act: { type: "work", shop: "gasstand" } }],
    ["nerikasu_home1", 51, 22, 9, 5, 4, "nerikasu.bld_neri_delivery", { label: "おとどけセンター", style: "town_delivery", act: { type: "work", shop: "relay" } }],
    ["nerikasu_home2", 54, 30, 9, 5, 4, "nerikasu.bld_nerikasu_home2", { house: true }],
    // よこの 道（中）の 北
    ["nerikasu_home5", 28, 44, 6, 5, 3, "nerikasu.bld_nerikasu_home5", {}],
    ["cake", 37, 45, 6, 4, 3, "nerikasu.bld_cake", {}],
    ["nerikasu_home6", 44, 44, 7, 5, 3, "nerikasu.bld_nerikasu_home6", {}], // あたまの たいそう（のうトレの おてつだい。js/mg-brain.js の BrainTown が お店に する）
    // よこの 道（中）の 南（入口は よこの 道（下）へ）
    ["home", 18, 56, 6, 4, 3, "nerikasu.bld_home", {}],
    // はたけの こや（js/farm-art.js の 絵 farm.hut・オーナーの FB 2026-09-30 の はたけ。やおやの かわり）
    ["neri_farmhut", 8, 66, 3, 2, 1, "farm.hut", { fresh: true, label: "はたけの こや", style: "town_farmhut", act: { type: "visit", text: "はたけの こや。じょうろ・くわ・たねの ふくろが しまって あるよ。\nかんばん「はたけ」を タップすると、はたけを 大きく みられるよ。" } }],
    ["neri_sevenbun", 30, 56, 7, 4, 3, "nerikasu.bld_neri_sevenbun", { fresh: true, label: "せぶんぶん", style: "town_sevenbun", act: { type: "buy", shop: "sevenbun" } }],
    ["dentist", 38, 56, 9, 4, 4, "nerikasu.bld_dentist", {}],
    ["nerikasu_home0", 48, 55, 6, 5, 3, "nerikasu.bld_neri_salon", { label: "おしゃれサロン", style: "town_salon", act: { type: "work", shop: "groom" } }],
    ["bakery", 55, 56, 6, 4, 3, "nerikasu.bld_bakery", {}],
    // よこの 道（下）の 南（入口は 南の 通学路へ）
    ["nerikasu_school", 12, 64, 24, 6, 12, "nerikasu.bld_nerikasu_school", {}],
    ["nerikasu_nursery", 38, 64, 19, 6, 9, "nerikasu.bld_nerikasu_nursery", {}],
    // 右の 道の 東の 家の 列（入口から 西の 右の 道へ こみち）
    ["nerikasu_home3", 69, 12, 7, 5, 3, "nerikasu.bld_nerikasu_home3", { house: true }],
    ["nerikasu_home4", 69, 19, 7, 5, 3, "nerikasu.bld_nerikasu_home4", { house: true }],
    ["neri_house_a", 69, 27, 7, 5, 3, "nerikasu.bld_neri_house_a", { fresh: true, house: true, style: "town_house_a" }],
    ["neri_house_b", 69, 34, 7, 5, 3, "nerikasu.bld_neri_house_b", { fresh: true, house: true, style: "town_house_b" }],
    ["nerikasu_house0", 69, 42, 6, 5, 3, "nerikasu.bld_nerikasu_home0", { fresh: true, house: true, style: "town_courtyard" }],
    ["neri_house_c", 69, 49, 7, 5, 3, "nerikasu.bld_neri_house_c", { fresh: true, house: true, style: "town_house_c" }],
    ["nerikasu_house1", 68, 57, 9, 5, 4, "nerikasu.bld_nerikasu_home1", { fresh: true, house: true, style: "town_twinrow" }],
    // ちいさな 建物（平和台と おなじ 原画）
    ["neri_koban", 60, 2, 4, 4, 2, "bld.koban", { fresh: true, label: "ねりかす こうばん", style: "town_koban", act: { type: "visit", text: "おまわりさんの こうばん。\nまいごに なったら ここへ おいで。" } }],
    ["neri_toilet", 43, 17, 3, 3, 1, "bld.toilet", { fresh: true, label: "こうえんの トイレ", style: "town_toilet", act: { type: "visit", text: "きれいに つかって くれて ありがとう！" } }],
    ["neri_wagashi", 52, 44, 4, 3, 2, "bld.shop.wagashi", { fresh: true, label: "わがしや こまち", style: "town_wagashi", act: { type: "visit", text: "おだんごと おまんじゅうの おみせ。\nきょうは うりきれ。また きてね。" } }],
    ["neri_cafe", 60, 45, 3, 3, 1, "bld.shop.cafe", { fresh: true, label: "きっさ ひだまり", style: "town_cafe", act: { type: "visit", text: "コーヒーの いい かおり。\nおとなの ひとが ひとやすみ して いる。" } }],
  ];
  // オーナーが「旧来の ネリカスタウンから 消えている ものも あるが、それは それで よい」と した 建物（2026-09-29）
  const REMOVED = {
    town_station: "ネリカスえきは 配置イメージに ない。でんしゃは 平和台えきから のる（大通りの 北東の はしが 平和台への みち）",
    town_atelier: "かわの アトリエ（見学だけ）は 配置イメージに ない",
    nerikasu_gatehouse: "かわべの あずまや（見学だけ）は 配置イメージに ない",
  };
  const HOUSE_TEXT = [
    "ピンポーン… るすの ようだ。\nにわの はなが きれいに さいてる。",
    "まどから いい においが する。\nきょうの ばんごはんは カレーかな？",
    "げんかんに 3りんしゃが ある。\nちいさな こが すんで いるみたい。",
    "ピアノの おとが きこえる。\nじょうずだね。",
    "ねこが まどべで ひなたぼっこ。\nしずかに とおりすぎよう。",
    "にわで おばあちゃんが トマトを そだてて いる。",
    "こんにちは！ … おへんじが ない。\nおでかけ ちゅう みたい。",
    "ポストに あたらしい しんぶん。\nあさ はやい おうち なんだね。",
    "ベランダに ふとんが ほして ある。\nぽかぽかで きもちよさそう。",
    "いぬの ワン！ という こえ。\nかわいい ばんけんが いるよ。",
  ];
  // あたらしい 型の 絵は 原画の まま（town-check の「型ごとに ちがう 絵」も おなじ 絵で しらべる）
  const STYLE_ASSET = { town_lawson: "nerikasu.bld_neri_lawson", town_sevenbun: "nerikasu.bld_neri_sevenbun", town_bikkupo: "nerikasu.bld_neri_bikkupo", town_gas: "nerikasu.bld_neri_gas", town_apartment: "nerikasu.bld_neri_apartment", town_post: "nerikasu.bld_neri_post", town_delivery: "nerikasu.bld_neri_delivery", town_salon: "nerikasu.bld_neri_salon", town_chuka: "nerikasu.bld_neri_chuka", town_house_a: "nerikasu.bld_neri_house_a", town_house_b: "nerikasu.bld_neri_house_b", town_house_c: "nerikasu.bld_neri_house_c", town_courtyard: "nerikasu.bld_nerikasu_home0", town_twinrow: "nerikasu.bld_nerikasu_home1", town_koban: "bld.koban", town_toilet: "bld.toilet", town_wagashi: "bld.shop.wagashi", town_cafe: "bld.shop.cafe", town_farmstand: "bld.shop.greengrocer", town_farmhut: "farm.hut" };
  // 住人の 場所（旧IDの まま）。村長は おまつりの けいじばん、ねこの ミントは 大きい 公園、クイズの 人は ふんすいの ひろば、かわべの 3人は 池の そば、
  // ペンギンは ローリソン、ぶたは びっくぽ、うさぎは 洋服屋さん、ひつじは 家具屋さん、ねずみは パン屋さんの まえ。のこりは スマホの 画面 11×19マスの
  // どこから 見ても 1人は いるように くばった（tools/check-nerikasu-town.mjs が しらべる）
  const NPC_SPOTS = { mayor: [36, 48], cat: [38, 38], rabbit: [17, 25], penguin: [31, 14], frog: [59, 17], sheep: [11, 28], mouse: [57, 60], pig: [41, 8], parkcat: [42, 28], town_walker0: [68, 53], town_walker1: [10, 55], town_walker2: [24, 53], town_walker3: [41, 23], town_neighbor0: [55, 40], town_neighbor1: [68, 19], town_neighbor2: [51, 19], town_neighbor3: [46, 53], town_riverwalk0: [60, 26], town_riverwalk1: [38, 20], town_riverwalk2: [29, 28], nerikasu_neighbor0: [10, 41], nerikasu_neighbor1: [67, 39], nerikasu_neighbor2: [21, 46], nerikasu_neighbor3: [35, 53], nerikasu_neighbor4: [49, 36], nerikasu_neighbor5: [28, 33], nerikasu_neighbor6: [21, 63], nerikasu_neighbor7: [63, 46], nerikasu_neighbor8: [22, 28], nerikasu_neighbor9: [64, 6], nerikasu_neighbor10: [70, 63], nerikasu_neighbor11: [55, 49], nerikasu_neighbor12: [3, 32], nerikasu_neighbor13: [31, 63],
    // クイズ係（js/town-quiz.js の TownQuiz.HOSTS。オーナーの FB 2026-10-01「クイズを出す人をネリカスタウンに3人」: ふんすいの ひろばの town_walker3 ＋ いこいの もり・しょうがっこうの まえ）
    neri_quiz_nature: [27, 45], neri_quiz_science: [37, 62] };
  let installed = null, previous = null;
  function install() {
    const old = MAP_DEFS.town, byId = (list, id) => list.find((o) => o.id === id);
    const g = Array.from({ length: H }, () => Array(W).fill("."));
    const d = { ...old, rows: [], buildings: [], objects: [], npcs: [], signs: [], chests: old.chests.map((c) => ({ ...c })), warps: [], spawns: [], roads: [], crosswalks: [], marks: [], surfaces: [], fillets: [], views: [], decals: [], neriTown: true, renewal: true, theme: "town", nerikasuArt: true, neriCross: [], neriCorners: [] };
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H, key = (x, y) => x + "," + y, reserved = new Set(), occupied = new Set(), npcAt = new Set();
    const rect = (x, y, w, h, ch) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (inside(xx, yy)) g[yy][xx] = ch; };
    for (const r of ROADS) d.roads.push({ id: r.id, carriage: r.carriage, side: r.side, pieces: r.pieces.map((q) => ({ ...q })), center: [] });
    const rg = TownRoads.grid(d, W, H), isRoad = (x, y) => inside(x, y) && !!rg[y][x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rg[y][x]) g[y][x] = "=";
    // 町の へり（道の 出口 いがいは あるけない）
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (!rg[y][x]) g[y][x] = "#";
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (!rg[y][x]) g[y][x] = "#";
    const keep = (x, y) => reserved.add(key(x, y));
    const pave = (x, y, ch = "=") => { if (!inside(x, y) || isRoad(x, y)) return; if (g[y][x] !== "#") g[y][x] = ch; keep(x, y); };
    // こみち: 点から 点へ（よこ → たて）
    const walk = (pts, ch = "=") => { for (let i = 0; i < pts.length - 1; i++) { let [x, y] = pts[i]; const [x1, y1] = pts[i + 1]; pave(x, y, ch); while (x !== x1 || y !== y1) { if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); pave(x, y, ch); } } };
    // 入口から いちばん ちかい 道まで まっすぐ 下へ（道に つくまで）
    const downToRoad = (x, y) => { let yy = y; while (inside(x, yy) && !isRoad(x, yy) && yy < H - 1 && !"#D".includes(g[yy][x])) { pave(x, yy); yy++; } keep(x, yy); keep(x, yy + 1); return yy; };
    // 建物
    let houseNo = 0;
    for (const [bid, x, y, w, h, door, asset, extra] of BUILDINGS) {
      const prev = extra.fresh ? null : byId(old.buildings, bid);
      if (!extra.fresh && !prev) throw new Error("nerikasu: 建物が ない " + bid);
      const b = { ...(prev || { id: bid }), ...extra, id: bid, x, y, w, h, door, opts: {} };
      if (asset) b.asset = asset; else delete b.asset;
      if (b.house) { b.label = "まちの おうち"; b.act = { type: "visit", text: HOUSE_TEXT[houseNo++ % HOUSE_TEXT.length] }; }
      if (!b.act) b.act = { type: "visit", text: "まちの おはなしを きいて ひとやすみ。" };
      if (!b.style) b.style = prev?.style || "town_home";
      delete b.fresh; delete b.house;
      d.buildings.push(b);
      rect(x, y, w, h, "#");
      g[y + h - 1][x + door] = "D";
    }
    const B = (id) => d.buildings.find((b) => b.id === id), front = (b) => [b.x + b.door, b.y + b.h];
    // 入口の まえの こみち
    for (const b of d.buildings) {
      const [fx, fy] = front(b);
      if (b.x >= 68) { walk([[fx, fy], [fx, fy + 1 < H ? fy : fy], [67, fy]]); continue; } // 右の 列: 西の 右の 道へ
      if (b.id === "neri_farmhut") { walk([[fx, fy], [11, fy], [11, 63], [12, 63]]); continue; } // はたけの ひがしの はしを とおって よこの 道へ
      if (["market", "neri_post"].includes(b.id)) { walk([[fx, fy], [fx, fy + 1], [12, fy + 1]]); continue; } // 左の 道へ
      if (["nerikasu_school", "nerikasu_nursery"].includes(b.id)) { walk([[fx, fy], [63, fy]]); continue; } // 南の 通学路（右の 道へ）
      if (b.id === "neri_koban") { walk([[fx, fy], [fx, fy + 1], [63, fy + 1]]); continue; } // 右の 道へ
      if (b.id === "neri_toilet") { walk([[fx, fy], [47, fy]]); walk([[fx, fy + 1], [40, fy + 1]], "-"); continue; } // ななめの 道と 公園の 土の みちへ
      downToRoad(fx, fy);
    }
    // 大通りの 北の 店の まえ（階段の すきま）は こみちで むすぶ
    // お花屋さん・中華料理屋の まえから ななめの 道・よこの 道へ
    walk([[front(B("florist"))[0], front(B("florist"))[1]], [front(B("florist"))[0], 39], [41, 39]]);
    walk([[front(B("neri_apartment"))[0], front(B("neri_apartment"))[1]], [front(B("neri_apartment"))[0], 38], [16, 38]]);
    walk([[front(B("neri_gas"))[0], front(B("neri_gas"))[1]], [front(B("neri_gas"))[0], 20], [49, 20]]);
    walk([[front(B("nerikasu_home1"))[0], front(B("nerikasu_home1"))[1]], [front(B("nerikasu_home1"))[0], 28], [52, 28]]);
    walk([[front(B("neri_gas"))[0], 20], [59, 20]]); // 池の 桟橋へ
    // ---- 公園・森・池・店の うら（地面の もじ） ----
    const fill = (pred, ch) => { for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (g[y][x] === "." && !isRoad(x, y) && !reserved.has(key(x, y)) && pred(x, y)) g[y][x] = ch; };
    const d1 = (y) => 34.6 + (y - 18) * 0.3975, d2 = (y) => 45.1 + (y - 10.9) * 0.3185;
    // 池（右の 道の 西・ガソリンスタンドと お届けセンターの 東）: 水 4×15・きしの 土の みち・つりの 桟橋
    rect(60, 13, 4, 9, "~"); rect(61, 22, 3, 6, "~");
    for (let y = 12; y <= 28; y++) { const sx = y < 22 ? 59 : 60; if (g[y][sx] === ".") g[y][sx] = "-"; }
    for (let x = 59; x <= 63; x++) { if (g[12][x] === ".") g[12][x] = "-"; if (g[28][x] === ".") g[28][x] = "-"; }
    rect(60, 19, 2, 2, "b");
    // 大きい 公園（ななめの 道の あいだ）: 池（4×3）
    rect(39, 18, 4, 3, "~");
    // 小さい 公園（大通りの 南・ななめの 道の 西）: 池（3×2）
    rect(30, 28, 3, 2, "~");
    // 公園の 小みち（土）
    walk([[37, 21], [40, 21]], "-"); rect(40, 21, 7, 4, "-"); // 大きい 公園: 土の ひろば（まんなかに ふんすい）
    walk([[29, 26], [33, 26], [33, 31], [36, 31]]);
    for (let y = 22; y < 33; y++) for (let x = 28; x < 38; x++) if (g[y][x] === "=" && reserved.has(key(x, y)) && !d.buildings.some((b) => x >= b.x && x < b.x + b.w && y >= b.y + b.h && y <= b.y + b.h + 2)) g[y][x] = "-";
    // 憩いの森: 森の 地面と、アパートから よこの 道（中）への 小みち
    fill((x, y) => x >= 17 && x <= 26 && y >= 39 && y <= 48, "d");
    walk([[24, 38], [24, 41], [20, 41], [20, 45], [23, 45], [23, 48]]);
    for (let y = 39; y <= 48; y++) for (let x = 17; x <= 26; x++) if (g[y][x] === "=") g[y][x] = "-";
    // 店の うら（大通りの 北の 建物の うしろ・北東の 空き地の うら）は あるけない（木と 生けがき）
    const behind = new Set();
    for (let x = 1; x <= 45; x++) {
      let edge = H; for (let y = 1; y < H; y++) if (isRoad(x, y)) { edge = y; break; }
      const b = d.buildings.find((o) => x >= o.x && x < o.x + o.w && o.y + o.h <= edge);
      const top = b ? b.y : edge - 3;
      for (let y = 1; y < top; y++) if (g[y][x] === "." && !reserved.has(key(x, y))) { g[y][x] = "#"; behind.add(key(x, y)); }
    }
    // 右の 列の 家の うら（東の へり）と 右上の すみ（さいしょの 家の 上）
    for (let y = 1; y < H - 1; y++) for (const x of [76]) if (g[y][x] === ".") { g[y][x] = "#"; behind.add(key(x, y)); }
    for (let y = 1; y < 10; y++) for (let x = 69; x < 77; x++) if (g[y][x] === ".") { g[y][x] = "#"; behind.add(key(x, y)); }
    // みんなの はたけ（左下）: 生けがきで かこむ。入口は 北（郵便局の まえの こみち）
    const farm = { x: 2, y: 56, w: 9, h: 14 };
    for (let y = farm.y; y < farm.y + farm.h; y++) for (let x = farm.x; x < farm.x + farm.w; x++) if (g[y][x] === "." && !reserved.has(key(x, y))) g[y][x] = (x === farm.x + 4 || y === farm.y + farm.h - 1) ? "-" : "g";
    walk([[6, 54], [6, 56]]); for (let y = 54; y <= 56; y++) if (g[y][6] === "=") g[y][6] = "-";
    // 北東の 空き地（大通りの 北の はしと 池の あいだ）は ちゅうしゃじょう
    const parking = { x: 53, y: 2, w: 6, h: 7 };
    walk([[51, 5], [53, 5]]); // 大通りから ちゅうしゃじょうへ
    for (let y = parking.y; y < parking.y + parking.h; y++) for (let x = parking.x; x < parking.x + parking.w; x++) if (g[y][x] === "." && !isRoad(x, y)) g[y][x] = "=";
    d.surfaces.push({ kind: "neri_parking", ...parking });
    d.rows = g.map((r) => r.join(""));
    const solidAt = (x, y) => !inside(x, y) || "#D~".includes(g[y][x]);
    // ---- 物体（小物） ----
    const signAt = new Set([[50, 9], [63, 69], [37, 20]].map(([x, y]) => key(x, y))); for (const k of signAt) reserved.add(k);
    const free = (x, y, w = 1, h = 1, road = false) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (solidAt(xx, yy) || !road && rg[yy]?.[xx] === "road" || reserved.has(key(xx, yy)) || occupied.has(key(xx, yy)) || npcAt.has(key(xx, yy))) return false; return true; };
    const put = (o) => { if (!(o.background ? o.x >= 0 && o.y >= 0 && o.x + o.w <= W && o.y + o.h <= H : free(o.x, o.y, o.w, o.h, o.solid === false))) return null; d.objects.push(o); for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) occupied.add(key(xx, yy)); return o; };
    let serial = 0;
    const art = (asset, x, y, opt = {}) => { const a = HeiwadaiArt.assets[asset]; if (!a) throw new Error("nerikasu: 絵が ない " + asset); const { opts = {}, ...rest } = opt;
      if (!HeiwadaiArt.lookup.has(asset + "|" + HeiwadaiArt.optionKey(opts))) throw new Error("nerikasu: 絵の しゅるいが ない " + asset + " " + JSON.stringify(opts));
      return put({ id: "neri_art_" + serial++, asset, kind: "heiwadai_" + asset.replaceAll(".", "_"), x, y, w: a.w, h: a.h, opts, solid: true, ...rest }); };
    const prop = (kind, x, y, opt = {}) => { const a = WorldArt[kind](); return put({ id: "neri_decor_" + serial++, kind, x, y, w: Math.max(1, Math.ceil(a.w / TSZ)), h: 1, solid: true, ...opt }); };
    const named = (id, kind, x, y, extra = {}) => { const o = byId(old.objects, id); if (!o) throw new Error("nerikasu: 物体が ない " + id); const n = put({ ...o, ...extra, x, y }); if (!n) throw new Error("nerikasu: 物体を おけない " + id + " " + x + "," + y); return n; };
    const bg = (asset, x, y, opts = {}) => { const a = HeiwadaiArt.assets[asset]; return put({ id: "neri_bg_" + serial++, asset, kind: "heiwadai_" + asset.replaceAll(".", "_"), x, y, w: a.w, h: a.h, opts, solid: true, background: true }); };
    // めじるし（旧IDの 物体）
    named("town_fountain", "fountain", 42, 22, { text: "ふんすいの まわりで ひとやすみ。\nこうえんの まんなかだよ。" });
    named("town_cart", "flowercart", 36, 38, { text: "おはなやさんの ワゴン。きょうの おすすめは ひまわり！" });
    named("town_wheel", "waterwheel", 61, 10, { text: "いけの すいしゃ。くるくる まわって いるよ。" });
    // おうちの みぎ よこの バスてい（オーナーの FB 2026-09-30「お家の 近くに バス停・どこの マップにも 100円」。さわると js/transit.js の Transit.bus）
    if (!art("prop.busstop", 24, 58, { id: "town_busstop", busStop: true, opts: { no: "1" }, text: "おうちまえの バスてい。どこへでも 100コイン！" })) throw new Error("nerikasu: バスてい を おけない");
    const fb = byId(old.objects, "town_festivalboard"); d.festivalBoard = [35, 48]; // お花屋さんから よこの 道（中）への こみちの 出口
    if (fb) put({ ...fb, x: 35, y: 48 });
    // 大きい 公園: ひろばの まわりに すべりだい・シーソー・ジャングルジム・ブランコ・タイヤ・てつぼう・ふじだな・ベンチ・とけい・水のみば
    art("park.slide", 38, 22); art("park.seesaw", 39, 26); art("park.jungle", 43, 26); art("park.swing", 46, 25);
    art("park.spring", 40, 28, { opts: { kind: "zou" } }); art("park.tires", 46, 28); art("park.tetsubo", 41, 30); art("park.fujidana", 45, 29);
    art("nerikasu.timber-bench", 41, 25); art("prop.bench", 46, 23); art("park.clock", 46, 21); art("park.drink", 43, 20);
    art("nat.tree.sakura", 44, 15); art("nat.tree.big", 48, 29); art("nat.tree.sakura", 42, 16, { opts: {} });
    // 小さい 公園: 池の まわりに ブランコ・すなば・ばねの のりもの・ベンチ・水のみば
    art("park.swing", 32, 23); art("park.sandbox", 34, 27); art("park.spring", 35, 25, { opts: { kind: "panda" } }); art("park.spring", 36, 25, { opts: { kind: "uma" } });
    art("prop.bench", 28, 30); art("prop.bench", 34, 30); art("park.drink", 29, 25);
    for (const [x, y, t] of [[26, 27, "big"], [36, 29, "big"], [30, 31, "sakura"]]) art("nat.tree." + t, x, y);
    for (const [x, y] of [[17, 39], [21, 39], [25, 42], [17, 43], [22, 46], [25, 46], [18, 47], [26, 39]]) art("nat.tree.big", x, y);
    for (const [x, y] of [[19, 40], [23, 43], [17, 45], [26, 44], [19, 48], [21, 47], [24, 40]]) art("nat.pine", x, y, { opts: {} });
    art("prop.bench", 21, 42); art("prop.jizo", 22, 44); art("nerikasu.timber-bench", 17, 41);
    // 池: デッキの ベンチ・ボートの ような 木・すいしゃ
    art("nerikasu.timber-bench", 59, 12); art("prop.bench", 58, 28);
    for (const [x, y] of [[57, 11], [57, 20]]) art("nat.tree.sakura", x, y);
    // ちゅうしゃじょう: くるま と かんばん
    art("veh.car", 54, 3); art("veh.kei", 57, 3); art("veh.car", 54, 6); art("prop.wheelstop", 58, 6); art("prop.aboard", 60, 7);
    // ---- 横断歩道・かどの まるみ ----
    const cw = (x0, x1, y0, y1, bars) => d.crosswalks.push({ x0, x1, y0, y1, bars });
    for (const x of [16.4 + .8, 64.1 - .8]) { cw(x - .7, x + .7, 48.8, 52.8, "h"); cw(x - .7, x + .7, 60.4, 64.4, "h"); }
    cw(64.1, 68.1, 36.2, 37.4, "v"); cw(64.1, 68.1, 52.9, 54.1, "v"); cw(12.4, 16.4, 46.9, 48.1, "v"); cw(12.4, 16.4, 58.5, 59.7, "v");
    d.fillets.push({ at: [16.4, 48.8], sx: 1, sy: -1, r: 1 }, { at: [16.4, 52.8], sx: 1, sy: 1, r: 1 }, { at: [16.4, 60.4], sx: 1, sy: -1, r: 1 },
      { at: [64.1, 48.8], sx: -1, sy: -1, r: 1 }, { at: [64.1, 52.8], sx: -1, sy: 1, r: 1 }, { at: [64.1, 60.4], sx: -1, sy: -1, r: 1 }, { at: [64.1, 64.4], sx: -1, sy: 1, r: 1 });
    // ---- 道ぞいの 小物: 街灯と 街路樹（歩道の はし）----
    const pathEnd = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reserved.has(key(x + dx, y + dy)) && !isRoad(x + dx, y + dy));
    const sw = (x, y) => isRoad(x, y) && rg[y][x] === "sidewalk" && !pathEnd(x, y);
    for (let y = 3; y < H - 3; y += 5) for (const x of [64, 67]) if (sw(x, y)) ((y / 5 | 0) % 2 ? art("nerikasu.lantern-twin", x, y) : art("nat.tree.street", x, y, { opts: { c: "#5E9E5A", flip: false } }));
    for (let x = 18; x < 63; x += 5) for (const y of [49, 52, 60, 63]) if (sw(x, y)) ((x / 5 | 0) % 2 ? art("nerikasu.lantern-twin", x, y) : art("nat.tree.street", x, y, { opts: { c: "#4E9A52", flip: false } }));
    for (let y = 33; y < 63; y += 5) for (const x of [12, 15]) if (sw(x, y)) ((y / 5 | 0) % 2 ? art("nerikasu.lantern-twin", x, y) : art("nat.tree.street", x, y, { opts: { c: "#6AAE58", flip: false } }));
    // 大通り（ななめ）: 両がわの 歩道に 街灯と 木
    { const r = ROADS[0].pieces[0], dx = r.b[0] - r.a[0], dy = r.b[1] - r.a[1], len = Math.hypot(dx, dy), u = [dx / len, dy / len], n = [-u[1], u[0]];
      for (let t = 3; t < len - 2; t += 4.2) for (const s of [-1, 1]) { const x = Math.floor(r.a[0] + u[0] * t + n[0] * s * 2.6), y = Math.floor(r.a[1] + u[1] * t + n[1] * s * 2.6); if (sw(x, y)) ((t / 4.2 | 0) % 2 ? art("nerikasu.lantern-twin", x, y) : art("nat.tree.street", x, y, { opts: { c: "#4F9A52" } })); } }
    // 店さきの 小物（入口の りょうがわ）
    const fronts = { furniture: ["chalkboard", "table", "planter"], clothes: ["chalkboard", "town_yarn", "planter"], crepe: ["chalkboard", "town_milk", "planter"], dentist: ["phone", "planter", "bicycles"], florist: ["town_herbs", "town_watering", "town_herbs"], bakery: ["chalkboard", "town_breadrack", "town_breadrack"], cake: ["chalkboard", "town_cakes", "planter"], market: ["town_milk", "town_herbs", "bicycles"], nerikasu_home5: ["chalkboard", "town_herbs", "planter"], home: ["postbox", "town_milk", "planter"], neri_lawson: ["recycle", "bicycles", "newsbox"], neri_sevenbun: ["recycle", "bicycles", "newsbox"], neri_bikkupo: ["chalkboard", "planter", "bicycles"], neri_post: ["postbox", "planter", "bicycles"], neri_chuka: ["chalkboard", "planter", "recycle"], nerikasu_home0: ["chalkboard", "planter", "bicycles"], nerikasu_home1: ["recycle", "postbox", "bicycles"], neri_gas: ["recycle", "chalkboard", "planter"], neri_apartment: ["bicycles", "postbox", "recycle"] };
    const garden = ["planter", "town_watering", "town_pinwheel", "bicycles", "town_herbs", "postbox", "town_milk"];
    for (const b of d.buildings) { const list = fronts[b.id] || garden, y = b.y + b.h; let i = 0;
      for (const x of [b.x, b.x + b.w - 1, b.x + 1, b.x + b.w - 2]) { if (i >= list.length || x === b.x + b.door) continue; if (prop(list[i], x, y)) i++; } }
    // コンビニの 入口の よこに じはんき
    art("prop.vending", 33, 14); art("prop.vending", 35, 60);
    // 歩道の マンホール・ハト（あるける 小物）
    for (const [x, y] of [[30, 17], [20, 30], [8, 36], [40, 12], [65, 10], [66, 28], [65, 44], [66, 58], [25, 50], [45, 51], [35, 62], [55, 61], [14, 45]]) art("prop.manhole", x, y, { solid: false, opts: (x + y) % 2 ? {} : { plain: true } });
    // ---- すきまの 小物（何もない ところを うめる） ----
    const fillers = ["planter", "bicycles", "postbox", "town_watering", "town_pinwheel", "town_herbs", "recycle", "chalkboard", "town_milk", "direction"];
    const emptyAround = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (occupied.has(key(x + dx, y + dy)) || (inside(x + dx, y + dy) && "#D".includes(g[y + dy][x + dx]))) return false; return true; };
    // はたけ（js/farm.js・オーナーの FB 2026-09-30「やおやを 削除して、お家の 横に 畑」）: 4×2マスの はたけ 6まい（2れつ×3だん・あいだは みち）と
    // よこだんほどうの まえの かんばん（はたけの がめんへ）。まえの ハーブの うねと やさいの ちょくばいじょ（やおや）は けした
    for (let i = 0; i < 6; i++) if (!put({ id: "town_farm_" + i, kind: "farm_plot", x: i % 2 ? 7 : 2, y: 56 + Math.floor(i / 2) * 3, w: 4, h: 2, solid: true, farmPlot: i, text: "はたけ" })) throw new Error("nerikasu: はたけを おけない " + i);
    if (!put({ id: "town_farm_sign", kind: "farm_sign", x: 11, y: 57, w: 1, h: 1, solid: true, farmSign: true, text: "はたけの かんばん" })) throw new Error("nerikasu: はたけの かんばんを おけない");
    // はたけの まわりの 小物（絵は js/farm-art.js の WorldArt.farm_*。はたけの まえの マス 58・61・64 の みちは あけて おく）
    const farmDeco = [["farm_scarecrow", 1, 60, "かかしの かかしくん。とりさん はたけを たべないでね。"], ["farm_scarecrow", 1, 68, "かかしの かかしちゃん。きょうも はたけの ばんを して いるよ。"],
      ["farm_crate", 1, 62], ["farm_crate", 10, 65], ["farm_crate", 10, 64], ["farm_barrel", 2, 65, "あまみずの たる。あめの ひに たまるよ。"], ["farm_barrel", 3, 66],
      ["farm_sack", 4, 66], ["farm_sack", 5, 65], ["farm_hay", 4, 65], ["farm_hay", 7, 65], ["town_watering", 2, 67], ["planter", 1, 55], ["planter", 11, 55], ["planter", 11, 62], ["farm_rack", 7, 66]];
    farmDeco.forEach(([kind, x, y, text], i) => { if (!put({ id: "town_farm_deco_" + i, kind, x, y, w: 1, h: 1, solid: true, ...(text ? { text } : {}) })) throw new Error("nerikasu: はたけの 小物を おけない " + kind + " " + x + "," + y); });
    prop("town_watering", 7, 67); prop("town_pinwheel", 3, 67); art("nerikasu.recycling-bins", 5, 68); art("prop.bench", 3, 68);
    // 右の 道と ななめの 道（3）の あいだの ちいさな ひろば: 自転車おきば・じはんき・木
    art("nerikasu.bicycle-rack", 60, 41); art("nerikasu.green-vending", 61, 44); art("nerikasu.recycling-bins", 60, 46); art("nat.tree.big", 53, 40); art("nat.tree.sakura", 54, 43);
    // 右の 列: 家と 家の あいだは 生けがき、にわに 木
    for (const b of d.buildings.filter((o) => o.x >= 68)) { for (let x = b.x + 4; x < 76; x++) art("nat.hedge", x, b.y + b.h + 1); art("nat.tree.big", 74, b.y + b.h - 2); }
    let fi = 0;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (solidAt(x, y) || isRoad(x, y) || !emptyAround(x, y) || x >= 68) continue;
      const ground = g[y][x];
      if (ground === "=") { const k = fillers[fi++ % fillers.length]; prop(k, x, y); continue; }
      if (free(x, y, 2, 2) && emptyAround(x + 1, y + 1) && (x + y) % 2 === 0) art("nat.tree.big", x, y);
      else art("nat.shrub", x, y, { opts: { flower: (x + y) % 3 === 0 } });
    }
    // ---- 店の うら・へりの 家なみ（屋根の ならび）と 木（背景） ----
    const allBehind = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (!behind.has(key(xx, yy)) || occupied.has(key(xx, yy))) return false; return true; };
    let seed = 0;
    for (let y = 1; y < H - 1; y += 2) for (let x = 1; x < W - 1; x++) if (allBehind(x, y, 4, 2)) { bg("bg.roofs", x, y, { seed: seed++ % 16 + 1 }); x += 3; }
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (allBehind(x, y, 2, 2)) bg("nat.tree.big", x, y);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (allBehind(x, y, 1, 1)) bg("nat.shrub", x, y, { flower: (x + y) % 2 === 0 });
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (g[y][x] === "#" && !occupied.has(key(x, y))) bg("nat.hedge", x, y);
    for (let y = 1; y < H - 1; y++) for (const x of [0, W - 1]) if (g[y][x] === "#" && !occupied.has(key(x, y))) bg("nat.hedge", x, y);
    // ---- 住人（旧IDの まま。スマホの 画面 11×19マスの どこから 見ても 1人は いるように） ----
    const standOk = (x, y) => inside(x, y) && !solidAt(x, y) && rg[y][x] !== "road" && !reserved.has(key(x, y)) && !occupied.has(key(x, y)) && !npcAt.has(key(x, y)) && !signAt.has(key(x, y));
    const quizHosts = typeof TownQuiz !== "undefined" ? TownQuiz.npcs("town").filter((q) => !old.npcs.some((n) => n.id === q.id)) : [];
    [...old.npcs, ...quizHosts].forEach((n) => {
      let [x, y] = NPC_SPOTS[n.id] || front(B("home"));
      // よていの 場所が かべ・入口の まえなら いちばん ちかい あいている 地面へ
      if (!standOk(x, y)) { let best = null, bd = 1e9;
        for (let yy = y - 5; yy <= y + 5; yy++) for (let xx = x - 5; xx <= x + 5; xx++) { if (!standOk(xx, yy)) continue; const dd = Math.abs(xx - x) + Math.abs(yy - y); if (dd < bd) { bd = dd; best = [xx, yy]; } }
        if (!best) throw new Error("nerikasu: 人の 場所が ない " + n.id + " " + x + "," + y); [x, y] = best; }
      const c = { ...n, x, y }; delete c.wander; d.npcs.push(c); npcAt.add(key(x, y)); keep(x, y);
    });
    // ---- かんばん ----
    d.signs.push({ x: 50, y: 9, text: "⬆ この さき 平和台。\n池袋へは 平和台えきから でんしゃで いこう。" }, { x: 63, y: 69, text: "⬇ この さき ぽかぽかはらっぱ\nまものが でるので きをつけてね！" }, { x: 37, y: 20, text: "ねりかす こうえん。\nいけで つりも できるよ！" });
    for (const s of d.signs) g[s.y][s.x] = g[s.y][s.x];
    // ---- 出入り口 ----
    d.warps.push({ x: 45, y: 0, w: 6, h: 1, to: "heiwadai", tx: 22, ty: 66, dir: "up" });
    d.warps.push({ x: 64, y: 0, w: 4, h: 1, to: "heiwadai", tx: 22, ty: 66, dir: "up" });
    d.warps.push({ x: 64, y: H - 1, w: 4, h: 1, to: "meadow", tx: 14, ty: 1, dir: "down" });
    const hw = MAP_DEFS.heiwadai.warps.find((w) => w.to === "town"); if (hw) Object.assign(hw, { tx: 48, ty: 1, dir: "down" });
    const mw = MAP_DEFS.meadow.warps.find((w) => w.to === "town"); if (mw) Object.assign(mw, { tx: 65, ty: H - 2, dir: "up" });
    d.safeSpawn = [front(B("home"))[0], front(B("home"))[1] + 1];
    d.views = [[21, 60], [30, 22], [40, 20], [55, 16], [62, 20], [24, 44], [38, 40], [45, 60], [30, 70], [72, 30]];
    d.rows = g.map((r) => r.join(""));
    installed = d; previous = old; // 前の 町（64×68）。セーブの ばしょの 検査（tools/check-nerikasu-town.mjs）で つかう
    MAP_DEFS.town = d;
    if (typeof Transit !== "undefined") delete Transit.stops.town_station;
    return d;
  }
  return { W, H, ROADS, BUILDINGS, REMOVED, STYLE_ASSET, NPC_SPOTS, install, oodoriY, get def() { return installed; }, get previous() { return previous; } };
})();
(() => {
  const building = WorldArt.building, styles = NerikasuLayout.STYLE_ASSET;
  WorldArt.building = (sp) => styles[sp.style] ? HeiwadaiArt.model(styles[sp.style], {}) : building(sp);
})();
NerikasuLayout.install();
