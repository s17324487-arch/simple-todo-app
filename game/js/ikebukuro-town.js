// 池袋（MAP_DEFS.city）の 街区を、オーナーの 配置イメージ（2026-09-29）どおりに 作りなおす。
//   西: 線路と 駅ビル（北から 本の ギャラリー・いけぶ えきまえ館・池袋えき）と 東口の えきまえ ひろば。明治通りが 駅に そって 南北に はしる。
//   上: 左から ネリカス電機・Meeときょれじゃ・サンシャインいけぶ（右上）。東通りが 上から 右下へ ななめに おりて 緑の大通りへ。
//   東通りの かど K（よこちょうの はし）から サンシャイン60通りが 右上の いけぶへ。下は 緑の大通り（まんなかに しばふと いちょう）。
//   射撃場は 下の まんなか、ままの オフィスは 右下（どちらも 緑の大通りの 北がわ）。
// 旧IDの 建物・act・NPC・宝箱・名前つきの 物体は そのまま（tools/town-check.mjs）。はくぶつかん・射撃場の 出入り口も ここで あわせる。
// 建物と めじるしの 絵は tools/town-design/ikebukuro-buildings.mjs（js/ikebukuro-town-art.js に 生成・昼と 夜の 2つだけ）。
// 地面（平板・駅まえの 石・線路・分離帯の しばふ・れんが・点字ブロック）は チャンクに 1かいだけ 描く。道は TownRoads の ベクター。
const IkebukuroTown = (() => {
  const W = 96, H = 58, TSZ = 32;
  // 東通り（上から 右下へ）と サンシャイン60通り（東通りの かど K から いけぶの まえへ）
  const EAST = { a: [48, -1], b: [57, 51] }, EAST_X = (y) => EAST.a[0] + (y - EAST.a[1]) * (EAST.b[0] - EAST.a[0]) / (EAST.b[1] - EAST.a[1]);
  const K = [+EAST_X(36).toFixed(3), 36], S60_END = [86, 20];
  const ROADS = [
    { id: "ike-meiji", carriage: 4, side: 2, a: [20, -1], b: [20, H + 1] },
    { id: "ike-east", carriage: 4, side: 2, a: EAST.a, b: EAST.b },
    { id: "ike-naka", carriage: 2, side: 2, a: [20, 20], b: [W + 1, 20] },
    { id: "ike-yoko", carriage: 2, side: 0, a: [20, 36], b: K },
    { id: "ike-s60", carriage: 2, side: 3, a: K, b: S60_END },
    { id: "ike-green", carriage: 6, side: 3, a: [20, 51], b: [W + 1, 51] },
  ];
  // サンシャインいけぶに 入れるのは いけぶの 入口（ike_mall の 2つの 入口）だけ（オーナーの FB 2026-09-30）。
  // ここの 建物は まえは いけぶの 中へ つながって いた（js/ikebukuro-district.js の changed）ので、ひとことに かえる。
  // ちかみちは 地下を とおって いけぶの 入口の まえに でる（walkway。中へは 入らない）
  const NOT_MALL = Object.freeze({
    city_clothes: { type: "visit", text: "ここは いけぶの あんないじょ。\nおかいものは 60どおりの さきの\nいけぶの いりぐちから どうぞ！" },
    city_market: { type: "visit", text: "マルシェかんは いま じゅんびちゅう。\nマルシェは いけぶの 3かい だよ。\nいけぶの いりぐちから どうぞ！" },
    city_furniture: { type: "visit", text: "インテリアかんは じゅんびちゅう。\nかぐは いけぶの 1かいに あるよ。\nいけぶの いりぐちから どうぞ！" },
    city_cafe: { type: "visit", text: "テラスの せきで ひとやすみ。\nコーヒーの いい かおり！\nカフェは いけぶの 2かいに あるよ。" },
    city_reading: { type: "visit", text: "おいしそうな におい！\nフードホールは まだ じゅんびちゅう。\nごはんは いけぶの 2かいで どうぞ。" },
    city_gallery: { type: "walkway", text: "ちかみちを とおって、\nいけぶの まえに でるよ！" },
    relay: { type: "visit", text: "いけぶの にもつの うけつけ。\nおおきな かぐも ここから\nおうちへ とどけるよ。" },
  });
  // 建物: id, x, y, w, h, door（左からの マス）, 絵, ほか
  const BUILDINGS = [
    // 駅の 列（線路の ひがし）
    ["ike_annex1", 4, 1, 12, 12, 6, "bookstore", { label: "ほんの ギャラリー", act: { type: "visit", text: "おおきな 本やさん。えほんの コーナーも あるよ。\nおかいものは サンシャインいけぶへ！" } }],
    ["city_clothes", 4, 16, 12, 13, 6, "department", { label: "いけぶ えきまえ館" }],
    ["city_station", 4, 32, 12, 12, 6, "station", {}],
    // 上の 列（なかどおりの 北がわ）
    ["ike_electronics", 26, 3, 18, 14, 9, "electronics", {}],
    ["ike_arcade", 55, 4, 13, 13, 6, "arcade", {}],
    ["city_market", 69, 4, 5, 13, 2, "wing_marche", { label: "いけぶ マルシェ館" }],
    ["city_furniture", 75, 4, 5, 13, 2, "wing_interior", { label: "いけぶ インテリア館" }],
    ["ike_mall", 81, 4, 15, 13, 5, "mall", { doors: [5, 11] }],
    // なかどおりと サンシャイン60通りの あいだ
    ["link", 57, 23, 7, 4, 3, "puzzle", {}],
    // 明治通りと 東通りの あいだ（よこちょうの 北・緑の大通りの 北）
    ["ike_annex2", 25, 24, 7, 10, 3, "hotel", { label: "ひがしぐち ホテル", act: { type: "visit", text: "えきまえの ホテル。まどから サンシャインいけぶの タワーが みえるよ。" } }],
    ["city_cafe", 33, 24, 6, 10, 3, "cafe", { label: "いけぶ カフェテラス" }],
    ["ike_annex0", 40, 24, 7, 10, 3, "cinema", { label: "シネマ いけぶくろ", act: { type: "visit", text: "きょうは きょうりゅうの えいが！\nつぎの じょうえいを まって、まちを おさんぽ しよう。" } }],
    ["city_reading", 25, 38, 7, 7, 3, "foodhall", { label: "いけぶ フードホール" }],
    ["ike_annex3", 33, 38, 8, 7, 4, "garden", { label: "おくじょう ていえん", act: { type: "visit", text: "おくじょうに ちいさな もりが あるよ。\nふじだなの したで ひとやすみ。" } }],
    ["city_museum", 42, 38, 8, 7, 4, "museum", {}],
    // サンシャイン60通りの 南・緑の大通りの 北
    ["city_range", 60, 38, 10, 7, 5, "range", {}],
    ["city_office", 71, 33, 9, 12, 4, "office_lobby", { label: "オフィス うけつけ" }],
    ["ike_office", 81, 28, 15, 17, 7, "office_tower", {}],
    // 東通りの 上の こうばん（まいごの あんない）
    ["ike_koban", 53, 2, 2, 3, 0, "koban", { label: "ひがしどおり こうばん", act: { type: "visit", text: "おまわりさんの こうばん。まいごに なったら ここへ おいで。\nまちの あんないも できるよ。" }, fresh: true }],
    // 駅まえ ひろばの ちかみち（地下を とおって いけぶの 入口の まえへ）と おとどけ ぐち
    ["city_gallery", 4, 51, 4, 3, 2, "passage", { label: "いけぶへの ちかみち" }],
    ["relay", 12, 51, 4, 3, 2, "parcel", { label: "いけぶ おとどけ ぐち" }],
  ];
  // 緑の大通りの 中央分離帯の すきま（横断歩道と 東通りの 交差点）
  const MEDIAN_GAPS = [[20, 26], [38, 42], [52, 62], [72, 76], [88, 92]];
  const road = (id) => ROADS.find((r) => r.id === id);
  const along = (r, t) => { const dx = r.b[0] - r.a[0], dy = r.b[1] - r.a[1], len = Math.hypot(dx, dy); return { p: [r.a[0] + dx * t / len, r.a[1] + dy * t / len], u: [dx / len, dy / len], n: [-dy / len, dx / len], len }; };
  const roadLen = (r) => Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
  // 町の人（旧IDを そのまま つかう。いない IDは 池袋の おかいものの ひと）
  // 小さい スマホの 画面（11×19マス）の どこから 見ても 1人は いるように、およそ 10マス×18マスごとに おく
  const PEOPLE = [
    ["city_local1", 8, 14], ["city_local3", 17, 10], ["city_editor", 27, 18], ["ike_visitor0", 38, 18], ["ike_visitor1", 47, 12], ["ike_visitor2", 58, 18], ["ike_visitor3", 68, 18], ["ike_visitor4", 78, 18], ["ike_visitor5", 89, 18],
    ["city_commuter0", 8, 30], ["city_commuter1", 17, 24], ["city_local4", 30, 34], ["city_local5", 38, 35], ["ike_visitor7", 49, 30], ["city_musician", 57, 31], ["ike_visitor8", 68, 32], ["ike_visitor9", 78, 27], ["ike_visitor10", 88, 25],
    ["cityguide", 8, 46], ["city_commuter2", 17, 50], ["city_local6", 28, 46], ["city_commuter3", 38, 55], ["ike_visitor11", 48, 46], ["ike_visitor14", 58, 55], ["ike_visitor12", 68, 46], ["ike_visitor15", 78, 55], ["ike_visitor13", 88, 46],
    ["city_local0", 13, 48], ["city_local2", 23, 40], ["ike_visitor17", 64, 23], ["city_local7", 75, 22], ["ike_visitor6", 44, 37], ["ike_visitor16", 58, 42], ["ike_visitor18", 92, 55], ["city_local8", 26, 55], ["ike_walker0", 24, 21], ["ike_walker1", 16, 28], ["ike_walker2", 70, 35],
  ];
  const VISITOR_LINES = [
    ["えきから サンシャイン60どおりを あるくと、いけぶに つくよ。", "とちゅうに Meeときょれじゃ も あるの。"],
    ["ネリカス電機の 大きな 画面、みた？ テレビが ならんでるよ。", "10かいまで ぜんぶ でんきの おみせなんだって。"],
    ["いけふくろうの まえで まちあわせ！ ふくろうの めが まんまるだよ。", "みどりの おおどおりの いちょう、きれいでしょ。"],
    ["クレーンゲームで わんこの ぬいぐるみを ねらってるんだ。", "1かい 100コイン。じょうずに つかめるかな？"],
    ["サンシャインいけぶの 12かいに すいぞくかんが あるよ。", "60かいの タワーは まちの どこからでも みえるね。"],
  ];
  let installed = null;
  function install() {
    const old = MAP_DEFS.city, byId = (list, id) => list.find((o) => o.id === id);
    if (typeof IKEBUKURO_TOWN_ART !== "undefined") HeiwadaiArt.register({ ...IKEBUKURO_TOWN_ART, defs: HeiwadaiArt.defs });
    const g = Array.from({ length: H }, () => Array(W).fill("="));
    const d = { ...old, rows: [], buildings: [], objects: [], npcs: [], signs: [], chests: old.chests.map((c) => ({ ...c })), warps: [], spawns: [], roads: [], crosswalks: [], marks: [], surfaces: [], fillets: [], views: [], ikeTown: true, renewal: true, theme: "city", edgeColor: "#C9C6BC", ikeCross: [], ikeCorners: [], ikeTactile: [] };
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H, key = (x, y) => x + "," + y, reserved = new Set(), occupied = new Set(), npcAt = new Set();
    const rect = (x, y, w, h, ch) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (inside(xx, yy)) g[yy][xx] = ch; };
    for (const r of ROADS) d.roads.push({ id: r.id, carriage: r.carriage, side: r.side, pieces: [{ t: "seg", a: r.a, b: r.b }], center: [] });
    // 中央線（4車線の 明治通り・東通り）は 交差点の 中へ 引かない
    for (const [id, list] of [["ike-meiji", [[20, 1], [36, 1], [51, 3]]], ["ike-east", [[20, 1], [36, 2.5], [51, 3]]]]) {
      const rd = d.roads.find((r) => r.id === id), r = road(id), len = roadLen(r), per = len / (r.b[1] - r.a[1]);
      let at = 0; for (const [y, half] of list) { const t = (y - r.a[1]) * per, from = t - (half + 2.4) * per; if (from > at) rd.center.push({ from: at, to: from }); at = t + (half + 2.4) * per; }
      if (at < len - .5) rd.center.push({ from: at, to: len });
    }
    const rg = TownRoads.grid(d, W, H), isRoad = (x, y) => inside(x, y) && !!rg[y][x];
    // 線路（西の はし）・上と 下の へり（うらの すきまは あるけない）
    rect(0, 0, 4, H, "#");
    for (let x = 4; x < W; x++) { for (let y = 0; y < 3; y++) if (!rg[y][x]) g[y][x] = "#"; if (!rg[H - 1][x]) g[H - 1][x] = "#"; }
    // 建物（足もと・入口・入口の まえ 3マス）
    for (const [bid, x, y, w, h, door, pic, extra] of BUILDINGS) {
      const prev = extra.fresh ? { id: bid } : byId(old.buildings, bid);
      if (!prev) throw new Error("ikebukuro: 建物が ない " + bid);
      const b = { ...prev, ...extra, x, y, w, h, door, style: prev.style || "city_" + pic, asset: "ikebukuro." + pic, opts: {} };
      if (NOT_MALL[bid]) b.act = { ...NOT_MALL[bid] };
      delete b.fresh;
      if (!extra.doors) delete b.doors;
      d.buildings.push(b);
      rect(x, y, w, h, "#");
      for (const dx of b.doors || [door]) {
        g[y + h - 1][x + dx] = "D";
        for (let yy = y + h; yy <= y + h + 2 && yy < H; yy++) { g[yy][x + dx] = "="; reserved.add(key(x + dx, yy)); }
      }
      // 上の はしの 建物の うしろ（北）は やねの 絵に かくれるので あるけない
      if (y <= 5) for (let yy = Math.max(0, y - 2); yy < y; yy++) for (let xx = x; xx < x + w; xx++) if (!rg[yy][xx] && g[yy][xx] === "=" && !reserved.has(key(xx, yy))) g[yy][xx] = "#";
    }
    // 上の 列の 建物の あいだの ほそい すきま（1〜2マス）は あるけない
    for (const [x0, x1, y0, y1] of [[24, 25, 3, 17], [68, 68, 3, 17], [74, 74, 3, 17], [80, 80, 3, 17], [80, 80, 28, 45], [70, 70, 38, 45]]) for (let y = y0; y < y1; y++) for (let x = x0; x <= x1; x++) if (!rg[y][x] && g[y][x] === "=") g[y][x] = "#";
    const solidAt = (x, y) => !inside(x, y) || "#D".includes(g[y][x]);
    const keep = (x, y) => reserved.add(key(x, y));
    // 人の 場所（小物より 先に きめる）
    const people = PEOPLE.map(([id, x, y], i) => {
      if (solidAt(x, y)) throw new Error("ikebukuro: 人が かべの 中 " + id + " " + x + "," + y);
      npcAt.add(key(x, y)); keep(x, y);
      const prev = byId(old.npcs, id);
      const n = { ...(prev || { id, sp: ["cat", "rabbit", "sheep", "bear", "mouse"][i % 5], dir: "down", name: "おかいものの ひと", talk: id }), x, y };
      delete n.wander;
      if (!prev || id.startsWith("ike_visitor")) { const L = VISITOR_LINES[i % VISITOR_LINES.length]; TALKS[id] = { first: [L[0]], lines: L.map((t) => [t]) }; if (typeof TOWNSFOLK_DATA !== "undefined") TOWNSFOLK_DATA.crowd[id] = TOWNSFOLK_DATA.crowd[id] || "city_commuter"; }
      return n;
    });
    d.npcs.push(...people);
    // 物体（小物）: 足もとが あいていれば 置く。入口の まえ・人の 場所には 置かない
    const free = (x, y, w = 1, h = 1) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (solidAt(xx, yy) || reserved.has(key(xx, yy)) || occupied.has(key(xx, yy)) || npcAt.has(key(xx, yy))) return false; return true; };
    const put = (o) => { if (!(o.background ? o.x >= 0 && o.y >= 0 && o.x + o.w <= W && o.y + o.h <= H : free(o.x, o.y, o.w, o.h))) return null; d.objects.push(o); for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) occupied.add(key(xx, yy)); return o; };
    let serial = 0;
    const art = (asset, x, y, opt = {}) => { const a = HeiwadaiArt.assets[asset]; if (!a) throw new Error("ikebukuro: 絵が ない " + asset); const { opts = {}, ...rest } = opt;
      if (!HeiwadaiArt.lookup.has(asset + "|" + HeiwadaiArt.optionKey(opts))) throw new Error("ikebukuro: 絵の しゅるいが ない " + asset + " " + JSON.stringify(opts)); return put({ id: "ike_art_" + serial++, asset, kind: "heiwadai_" + asset.replaceAll(".", "_"), x, y, w: a.w, h: a.h, opts, solid: true, ...rest }); };
    const prop = (kind, x, y, opt = {}) => { const a = WorldArt[kind](); return put({ id: "ike_decor_" + serial++, kind, x, y, w: Math.max(1, Math.ceil(a.w / TSZ)), h: 1, solid: true, ...opt }); };
    const named = (id, kind, x, y, extra = {}) => { const o = byId(old.objects, id); if (!o) throw new Error("ikebukuro: 物体が ない " + id); const n = put({ ...o, ...extra, x, y }); if (!n) throw new Error("ikebukuro: 物体を おけない " + id + " " + x + "," + y); return n; };
    // ---- めじるし（旧IDの 物体は ぜんぶ のこす） ----
    named("city_fountain", "fountain", 8, 48);
    named("city_clock", "clocktower", 14, 46, { text: "まちあわせの とけい。えきの まえで まってるね！" });
    named("city_bus", "busstop", 31, 45, { text: "バスで みどりの おおどおりを ぐるっと。" });
    named("city_signal", "signal", 22, 18);
    named("city_cart", "flowercart", 71, 22, { text: "サンシャイン60どおりの おはなやさん。いい かおり！" });
    named("city_drink", "vending", 48, 34);
    named("city_bikes", "bicycles", 88, 26);
    const fb = byId(old.objects, "city_festivalboard"); d.festivalBoard = [12, 56];
    if (fb) put({ ...fb, x: 12, y: 56 });
    art("ikebukuro.owl", 4, 46, { id: "ike_owl", text: "いけふくろう。えきの まちあわせの めじるしだよ。\nいけ＋ふくろうで いけふくろう！" });
    // 駅まえの 点字ブロック（入口 → 横断歩道）と タクシー
    d.ikeTactile.push({ x: 10, y: 44, w: 1, h: 3, dot: [10, 44] }, { x: 11, y: 46, w: 5, h: 1 }, { x: 16, y: 46, w: 2, h: 1, dot: [17, 46] }, { x: 23, y: 46, w: 2, h: 1, dot: [23, 46] });
    art("prop.taxistand", 17, 38, { text: "タクシー のりば" });
    art("veh.taxi", 18, 39, { opts: {} }); art("veh.taxi", 18, 41, { opts: {} });
    art("prop.bench", 4, 49); art("prop.bench", 12, 49); art("prop.planter", 14, 44); art("prop.planter", 4, 44);
    art("veh.bus", 27, 48);
    // ---- 横断歩道・停止線・かどの まるみ ----
    const cw = (x0, x1, y0, y1, bars) => d.crosswalks.push({ x0, x1, y0, y1, bars });
    // 明治通りを わたる（交差点の 北と 南）
    for (const y of [16.9, 23.1, 33.6, 45.9]) cw(18, 22, y - .7, y + .7, "v");
    // なかどおり・緑の大通りを わたる（明治通りの ひがし）
    cw(23.4, 24.8, 19, 21, "h"); cw(23.4, 24.8, 48, 54, "h");
    // 緑の大通りの まんなかの 横断歩道（分離帯の すきま）
    for (const x of [40, 53.6, 60.4, 74, 90]) cw(x - .7, x + .7, 48, 54, "h");
    d.fillets.push({ at: [22, 19], sx: 1, sy: -1, r: 1.3 }, { at: [22, 21], sx: 1, sy: 1, r: 1.3 }, { at: [22, 35], sx: 1, sy: -1, r: 1.1 }, { at: [22, 37], sx: 1, sy: 1, r: 1.1 }, { at: [22, 48], sx: 1, sy: -1, r: 1.5 }, { at: [22, 54], sx: 1, sy: 1, r: 1.5 });
    // ななめの 道の 横断歩道（ベクターで 回して 描く）と かどの まるみ
    for (const [id, t, span] of [["ike-east", 17.6, 4], ["ike-east", 24.8, 4], ["ike-east", 33.2, 4], ["ike-east", 43.6, 4], ["ike-s60", 5.2, 2], ["ike-s60", 31, 2], ["ike-naka", 25.8, 2], ["ike-naka", 37.2, 2], ["ike-naka", 62.6, 2], ["ike-yoko", 30.2, 2]]) {
      const r = road(id), { p, u } = along(r, t); d.ikeCross.push({ c: p, u, span, len: 1.4 });
    }
    d.ikeCorners.push(...[["ike-east", 1, "ike-naka", -1], ["ike-east", 1, "ike-naka", 1], ["ike-east", -1, "ike-naka", -1], ["ike-east", -1, "ike-naka", 1], ["ike-east", 1, "ike-yoko", -1], ["ike-east", 1, "ike-yoko", 1], ["ike-east", -1, "ike-s60", -1], ["ike-east", -1, "ike-s60", 1], ["ike-east", -1, "ike-green", -1], ["ike-east", 1, "ike-green", -1], ["ike-s60", 1, "ike-naka", 1], ["ike-s60", -1, "ike-naka", 1]].map(([a, sa, b, sb]) => ({ a, sa, b, sb, r: 1.4 })));
    // 明治通りの 停止線（ひだり がわ つうこう: 南へ むかう 車は 東の 車線）
    d.marks.push({ k: "stop", x0: 20.2, x1: 21.9, y: 15.8 }, { k: "stop", x0: 18.1, x1: 19.8, y: 24.2 }, { k: "stop", x0: 20.2, x1: 21.9, y: 44.8 });
    // ---- 信号（あかり が かわる）: 大きな 交差点の かど ----
    for (const [x, y, flip] of [[22, 47, false], [22, 55, true], [17, 45, false], [52, 47, false], [59, 47, true], [17, 23, true], [23, 17, false]]) art("prop.signal", x, y, { opts: flip ? { flip: true } : {} });
    // ---- 道ぞいの 小物 ----
    const nearCross = (x, y) => d.crosswalks.some((c) => x >= c.x0 - 1.5 && x <= c.x1 + .5 && y >= c.y0 - 1.5 && y <= c.y1 + .5);
    // 明治通り（西 x=17・東 x=22 の 車道がわ）
    const skipMeijiEast = (y) => [[16, 24], [32, 40], [45, 57]].some(([a, b]) => y >= a && y <= b);
    for (let y = 1; y < H - 1; y += 4) {
      const alt = (y >> 2) % 2;
      if (!(y >= 12 && y <= 16) && !(y >= 28 && y <= 32) && y < 43) { alt ? art("prop.lamp", 17, y) : art("nat.tree.street", 17, y, { opts: { c: "#5E9E5A", flip: false } }); }
      if (!skipMeijiEast(y)) { alt ? art("nat.tree.street", 22, y, { opts: { c: "#4E9A52", flip: false } }) : art("prop.lamp", 22, y); }
      if (!skipMeijiEast(y + 2) && y + 2 < H - 1) prop(["city_metro", "newsbox", "postbox", "city_screen", "phone", "recycle"][(y >> 2) % 6], 22, y + 2);
    }
    // なかどおり（北の 歩道 y=18 は 店の まえ・南 y=21）
    const nakaFront = ["prop.aboard", "prop.nobori", "prop.planter", "city_bikerack", "prop.gacha", "prop.nobori"];
    for (let x = 25; x < W - 1; x += 3) {
      if (Math.abs(x - EAST_X(20)) < 5 || Math.abs(x - 86) < 3) continue;
      const i = Math.floor(x / 3) % nakaFront.length, k = nakaFront[i];
      if (k.startsWith("prop.")) art(k, x, 17, k === "prop.nobori" ? { opts: [{ c: "#D84A3F", t: "セルフ" }, { c: "#F28C28", t: "やきたて" }, { c: "#D9607E", t: "はな" }][x % 3] } : {}); else prop(k, x, 17);
      if (x % 6 === 1) art("prop.lamp", x, 21); else if (x % 6 === 4) art("nat.tree.street", x, 21, { opts: { c: "#6AAE58", flip: false } });
    }
    // 東通り（ななめ）: 両がわの 車道がわに 街灯と 木
    { const r = road("ike-east"), len = roadLen(r);
      for (let t = 2; t < len - 3; t += 4) { const { p, n } = along(r, t); if (Math.abs(p[1] - 20) < 4 || Math.abs(p[1] - 36) < 5 || p[1] > 46) continue;
        for (const s of [-1, 1]) { const x = Math.floor(p[0] + n[0] * s * 2.6), y = Math.floor(p[1] + n[1] * s * 2.6); if (isRoad(x, y) && rg[y][x] === "sidewalk") ((t / 4) % 2 ? art("prop.lamp", x, y) : art("nat.tree.street", x, y, { opts: { c: "#4F9A52" } })); } } }
    // サンシャイン60どおり: のぼりの 街灯（車道がわ）と 店の まえの 小物（外がわ）
    { const r = road("ike-s60"), len = roadLen(r);
      for (let t = 3; t < len - 3; t += 3.2) { const { p, n } = along(r, t), side = Math.round(t / 3.2) % 2 ? 1 : -1;
        const cx = Math.floor(p[0] + n[0] * side * 1.9), cy = Math.floor(p[1] + n[1] * side * 1.9);
        if (isRoad(cx, cy) && rg[cy][cx] === "sidewalk") art("ikebukuro.bannerlamp", cx, cy);
        const ox = Math.floor(p[0] - n[0] * side * 3.6), oy = Math.floor(p[1] - n[1] * side * 3.6);
        if (inside(ox, oy) && !solidAt(ox, oy)) { const k = ["prop.nobori", "city_coffee", "prop.aboard", "city_kiosk", "prop.planter"][Math.round(t) % 5]; k.startsWith("prop.") ? art(k, ox, oy, k === "prop.nobori" ? { opts: { c: "#D84A3F", t: "セルフ" } } : {}) : prop(k, ox, oy); } }
      const start = along(r, 2.2); art("ikebukuro.pylon", Math.floor(start.p[0] - start.n[0] * 3.8), Math.floor(start.p[1] - start.n[1] * 3.8), { id: "ike_s60_sign", text: "サンシャイン60どおり。まっすぐ いくと サンシャインいけぶ！" });
      art("ikebukuro.vision", 66, 24, { id: "ike_vision", text: "おおきな 画面。12かいの すいぞくかんの おしらせだよ。" }); }
    // よこちょう（ちょうちんの かわりに のぼりと 自動はんばいき）
    for (let x = 22; x < 53; x += 3) { if (x % 2) art("prop.nobori", x, 34, { opts: { c: "#E53935", t: "ランチ" } }); else art("prop.vending", x, 37, { opts: { c: x % 4 ? "#2E6DB4" : "#D8433C" } }); }
    // 緑の大通り: いちょうの 並木（北 y=47・南 y=54 と y=56 の 2れつ）と 街灯・ベンチ
    for (let x = 24; x < W - 1; x += 4) {
      if (!nearCross(x, 47)) art("nat.ginkgo", x, 47); if (!nearCross(x + 2, 47)) art("prop.lamp", x + 2, 47);
      if (!nearCross(x, 54)) art("nat.ginkgo", x, 54); if (!nearCross(x + 2, 56)) art("nat.ginkgo", x + 2, 56);
      if (x % 8 === 0 && !nearCross(x + 1, 56)) art("prop.bench", x - 1, 55);
    }
    // 中央分離帯（y=50・51）: いちょうと 植えこみ。横断歩道の ところは あける
    const medianGap = (x) => MEDIAN_GAPS.some(([a, b]) => x >= a && x <= b);
    for (let x = 25; x < W; x++) if (!medianGap(x)) { if (x % 3 === 0) art("nat.ginkgo", x, 51); else art("nat.hedge", x, 51); art("nat.shrub", x, 50, { opts: { flower: x % 2 === 0 } }); }
    // 店さきの 小物（入口の りょうがわの かど）
    const front = { station: ["prop.planter", "city_bikerack"], bookstore: ["prop.aboard", "prop.planter"], department: ["prop.planter", "prop.planter"], electronics: ["city_screen", "prop.aboard", "prop.nobori", "city_bikerack"], arcade: ["prop.gacha", "prop.gacha", "prop.aboard"], mall: ["prop.planter", "prop.flowerbed", "prop.planter"], wing_marche: ["prop.aboard"], wing_interior: ["prop.planter"], puzzle: ["prop.aboard"], hotel: ["prop.planter"], cafe: ["city_coffee", "prop.aboard"], cinema: ["city_billboard", "prop.aboard"], foodhall: ["prop.aboard", "prop.nobori"], garden: ["prop.flowerbed"], museum: ["direction", "prop.planter"], range: ["direction", "prop.bench"], office_lobby: ["prop.planter"], office_tower: ["prop.planter", "prop.bench", "city_bikerack"], passage: [], parcel: ["city_delivery"] };
    for (const b of d.buildings) { const list = front[b.asset.split(".")[1]] || [], y = b.y + b.h; let i = 0;
      for (const x of [b.x, b.x + b.w - 1, b.x + 2, b.x + b.w - 3]) { if (i >= list.length) break; const k = list[i]; const o = k.startsWith("prop.") ? art(k, Math.min(x, b.x + b.w - (HeiwadaiArt.assets[k].w)), y, k === "prop.nobori" ? { opts: { c: "#F28C28", t: "やきたて" } } : {}) : prop(k, Math.min(x, b.x + b.w - 2), y); if (o) i++; } }
    // 駅の 列の とおりみち（ベンチ・花・じはんき・じてんしゃ）
    for (const y of [13, 29]) { art("prop.bench", 4, y); art("prop.planter", 13, y + 2); art("prop.vending", 15, y, { opts: { c: "#D8433C" } }); prop("city_bikerack", 4, y + 2); art("prop.trash", 8, y + 2); }
    // 歩道と 道の マンホール・ひろばの ハト（あるける 小物）
    for (const [x, y] of [[20, 8], [20, 28], [20, 43], [34, 20], [62, 20], [92, 21], [30, 50], [66, 49], [84, 52], [50, 17], [8, 55], [16, 44], [58, 27], [76, 26]]) art("prop.manhole", x, y, { solid: false, opts: (x + y) % 2 ? {} : { plain: true } });
    for (const [x, y] of [[6, 48], [11, 55], [36, 46], [71, 25], [90, 23], [46, 55], [62, 46]]) art("prop.pigeons", x, y, { solid: false, opts: (x % 2) ? {} : { seed: 3 } });
    // ---- 広場と すきまの 小物（何もない ところを うめる） ----
    const fill = ["prop.planter", "city_coffee", "prop.trash", "prop.bench", "city_bikerack", "prop.pigeons", "city_billboard", "direction", "city_delivery", "prop.flowerbed", "prop.mailbox", "prop.phone"];
    const emptyAround = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (occupied.has(key(x + dx, y + dy)) || (inside(x + dx, y + dy) && "#D".includes(g[y + dy][x + dx]))) return false; return true; };
    let fi = 0;
    for (let y = 3; y < H - 2; y++) for (let x = 5; x < W - 2; x++) {
      if (solidAt(x, y) || !emptyAround(x, y)) continue;
      const kind = rg[y][x];
      if (kind === "road") continue;
      const k = fill[fi++ % fill.length];
      if (k.startsWith("prop.")) art(k, x, y); else prop(k, x, y);
    }
    // 下の へりの 植えこみ（背景）
    for (let x = 4; x < W; x++) if (g[H - 1][x] === "#") put({ id: "ike_edge" + x, asset: "nat.hedge", kind: "heiwadai_nat_hedge", x, y: H - 1, w: 1, h: 1, opts: {}, solid: true, background: true });
    // ---- 宝箱・ながめる 場所・スポーン ----
    const chest = d.chests.find((c) => c.id === "city_welcome"); if (chest) { chest.x = 15; chest.y = 48; keep(15, 48); }
    d.safeSpawn = [10, 45];
    d.views = [[10, 46], [31, 19], [61, 19], [86, 19], [66, 30], [65, 47], [88, 47], [36, 36], [10, 30]];
    // はくぶつかん・射撃場の 出入り口（生成データの outside と 館の 出口を 新しい 場所へ）
    const fix = (o, b) => Object.assign(o, { x: b.x, y: b.y, w: b.w, h: b.h, door: b.door, doorAt: [b.x + b.door, b.y + b.h - 1], front: [b.x + b.door, b.y + b.h] });
    const museum = d.buildings.find((b) => b.id === "city_museum"), rangeB = d.buildings.find((b) => b.id === "city_range");
    if (typeof MUSEUM_DATA !== "undefined" && museum) { const o = MUSEUM_DATA.buildings.museum.outside; fix(o, museum); for (const w of MAP_DEFS.museum?.warps || MUSEUM_DATA.buildings.museum.warps) if (w.to === "city") { w.tx = o.front[0]; w.ty = o.front[1]; } }
    if (typeof RANGE_DATA !== "undefined" && rangeB) fix(RANGE_DATA.outside, rangeB);
    // ちかみちの でぐち: いけぶの 大きい 入口の まえ（いけぶの ほうを むく）
    const mall = d.buildings.find((b) => b.id === "ike_mall");
    for (const b of d.buildings) if (b.act?.type === "walkway") b.act.to = { map: "city", x: mall.x + mall.door, y: mall.y + mall.h, dir: "up" };
    for (const n of d.npcs) if (solidAt(n.x, n.y)) throw new Error("ikebukuro: NPC blocked " + n.id);
    d.rows = g.map((r) => r.join(""));
    MAP_DEFS.city = d;
    installed = d;
    return d;
  }

  // ===== 地面（チャンク）: 平板・駅まえの 石・線路 → 道（TownRoads）→ 分離帯・れんが・点字・ななめの 横断歩道・かど =====
  const tex = new Map(); let texReady = null;
  function preload(def) {
    if (!def?.ikeTown || typeof IKEBUKURO_TOWN_ART === "undefined") return Promise.resolve();
    if (!texReady) texReady = Promise.all([...Object.entries(IKEBUKURO_TOWN_ART.grounds).map(async ([id, p]) => {
      const c = await SvgCache.ensure("ike-ground:" + id, () => `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">${p.svg}</svg>`, p.w * 4, p.h * 4);
      if (!c) throw new Error("ikebukuro ground failed: " + id); tex.set(id, c);
    })]).catch((e) => { texReady = null; throw e; });
    // 電車は 画面の 大きさで 絵を つくるので、まいかい たしかめる（昼と 夜）
    const trains = [{}, { night: true }].map((opts) => WorldScene.prototype.objCanvas.call(null, "heiwadai_ikebukuro_train", opts, true));
    return Promise.all([texReady, ...trains]);
  }
  const ready = () => typeof IKEBUKURO_TOWN_ART !== "undefined" && tex.size === Object.keys(IKEBUKURO_TOWN_ART.grounds).length;
  // もようは 4ばいの 画像を タイルの 単位（1マス = 1）で しく
  const pattern = (ctx, id) => { const p = ctx.createPattern(tex.get(id), "repeat"); p.setTransform(new DOMMatrix().scale(.25 / TSZ)); return p; };
  function drawGround(ctx, def) {
    if (!def.ikeTown || !ready()) return;
    ctx.save(); ctx.scale(TSZ, TSZ);
    ctx.fillStyle = pattern(ctx, "ike-plaza"); ctx.fillRect(-1, -1, W + 2, H + 2);
    // 駅まえ ひろば と 駅の 列の とおりみち は 御影石
    ctx.fillStyle = pattern(ctx, "ike-granite"); ctx.fillRect(4, 44, 12, 14); ctx.fillRect(4, 13, 12, 3); ctx.fillRect(4, 29, 12, 3);
    // 線路: バラスト・まくらぎ・2本の レール ×2
    ctx.fillStyle = pattern(ctx, "ike-ballast"); ctx.fillRect(0, 0, 4, H);
    for (const x of [.35, 2.25]) {
      ctx.fillStyle = "#7B6250"; for (let y = 0; y < H; y += .55) ctx.fillRect(x - .1, y, 1.6, .22);
      ctx.fillStyle = "#4A5358"; ctx.fillRect(x + .12, 0, .12, H); ctx.fillRect(x + 1.16, 0, .12, H);
      ctx.fillStyle = "#D4DAD6"; ctx.fillRect(x + .14, 0, .04, H); ctx.fillRect(x + 1.18, 0, .04, H);
    }
    ctx.strokeStyle = "#8E8779"; ctx.lineWidth = .08; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(4, H); ctx.stroke();
    ctx.restore();
  }
  function drawOver(ctx, def) {
    if (!def.ikeTown || !ready()) return;
    ctx.save(); ctx.scale(TSZ, TSZ); ctx.lineJoin = "round";
    const rd = (id) => ROADS.find((r) => r.id === id);
    // かどの まるみ（ななめの 交差点）: 縁石の 線どうしの まじわりに 円弧
    const ap = ROAD_PATTERNS["p-asphalt"], asphaltTex = SvgCache.get("town-road:p-asphalt", () => `<svg xmlns="http://www.w3.org/2000/svg" width="${ap.w}" height="${ap.h}" viewBox="0 0 ${ap.w} ${ap.h}">${ap.svg}</svg>`, ap.w * 4, ap.h * 4);
    const asphalt = asphaltTex ? ctx.createPattern(asphaltTex, "repeat") : "#7E858E"; if (asphaltTex) asphalt.setTransform(new DOMMatrix().scale(.25 / TSZ));
    for (const c of def.ikeCorners || []) {
      const A = rd(c.a), B = rd(c.b), ua = along(A, 0), ub = along(B, 0);
      const ma = [ua.n[0] * c.sa, ua.n[1] * c.sa], mb = [ub.n[0] * c.sb, ub.n[1] * c.sb];
      const pa = [A.a[0] + ma[0] * A.carriage / 2, A.a[1] + ma[1] * A.carriage / 2], pb = [B.a[0] + mb[0] * B.carriage / 2, B.a[1] + mb[1] * B.carriage / 2];
      const den = ua.u[0] * ub.u[1] - ua.u[1] * ub.u[0]; if (Math.abs(den) < 1e-6) continue;
      const s = ((pb[0] - pa[0]) * ub.u[1] - (pb[1] - pa[1]) * ub.u[0]) / den, P = [pa[0] + ua.u[0] * s, pa[1] + ua.u[1] * s];
      const det = ma[0] * mb[1] - ma[1] * mb[0]; if (Math.abs(det) < 1e-6) continue;
      const r = c.r, v = [(r * mb[1] - ma[1] * r) / det, (ma[0] * r - r * mb[0]) / det], C = [P[0] + v[0], P[1] + v[1]];
      const TA = [C[0] - r * ma[0], C[1] - r * ma[1]], TB = [C[0] - r * mb[0], C[1] - r * mb[1]];
      const a0 = Math.atan2(TA[1] - C[1], TA[0] - C[0]), a1 = Math.atan2(TB[1] - C[1], TB[0] - C[0]);
      let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(TA[0], TA[1]); ctx.arc(C[0], C[1], r, a0, a0 + da, da < 0); ctx.closePath(); ctx.fillStyle = asphalt; ctx.fill();
      ctx.beginPath(); ctx.arc(C[0], C[1], r + .09, a0, a0 + da, da < 0); ctx.strokeStyle = "#DCD6CA"; ctx.lineWidth = .18; ctx.stroke();
      ctx.beginPath(); ctx.arc(C[0], C[1], r + .2, a0, a0 + da, da < 0); ctx.strokeStyle = "#B3AC9F"; ctx.lineWidth = .028; ctx.stroke();
    }
    // 中央分離帯（緑の大通り）: 縁石・しばふ（すきまは 横断歩道）
    const lawn = pattern(ctx, "ike-lawn");
    for (let i = 0; i < MEDIAN_GAPS.length; i++) {
      const s0 = MEDIAN_GAPS[i][1] + 1, s1 = i + 1 < MEDIAN_GAPS.length ? MEDIAN_GAPS[i + 1][0] : W + 1; if (s1 <= s0) continue;
      ctx.fillStyle = "#D8D2C4"; U.rr(ctx, s0 - .1, 49.86, s1 - s0 + .2, 2.28, .55); ctx.fill();
      ctx.strokeStyle = "#A9A293"; ctx.lineWidth = .04; ctx.stroke();
      ctx.fillStyle = lawn; U.rr(ctx, s0 + .06, 50.02, s1 - s0 - .12, 1.96, .45); ctx.fill();
    }
    // サンシャイン60どおりの 歩道は あたたかい れんが（交差点の ちかくは ふつうの 歩道）
    { const r = rd("ike-s60"), { u, n, len } = along(r, 0), brick = pattern(ctx, "ike-brick");
      ctx.fillStyle = brick;
      for (const s of [1, -1]) { const t0 = 3.6, t1 = len - 3.8, o0 = (r.carriage / 2 + .24) * s, o1 = (r.carriage / 2 + r.side - .02) * s, P = (t, o) => [r.a[0] + u[0] * t + n[0] * o, r.a[1] + u[1] * t + n[1] * o];
        const q = [P(t0, o0), P(t1, o0), P(t1, o1), P(t0, o1)]; ctx.beginPath(); ctx.moveTo(...q[0]); for (const p of q.slice(1)) ctx.lineTo(...p); ctx.closePath(); ctx.fill(); } }
    // 点字ブロック
    for (const t of def.ikeTactile || []) {
      ctx.fillStyle = pattern(ctx, "ike-tactile-line");
      ctx.fillRect(t.x + (t.w === 1 ? .32 : 0), t.y + (t.h === 1 ? .32 : 0), t.w === 1 ? .36 : t.w, t.h === 1 ? .36 : t.h);
      if (t.dot) { ctx.fillStyle = pattern(ctx, "ike-tactile-dot"); ctx.fillRect(t.dot[0] + .2, t.dot[1] + .2, .6, .6); }
    }
    // ななめの 横断歩道（しまは 道の むきに そろえる）
    ctx.fillStyle = "#F7F7F2"; ctx.globalAlpha = .95;
    for (const c of def.ikeCross || []) {
      const [ux, uy] = c.u, nx = -uy, ny = ux, bar = .28, gapW = .28, count = Math.floor((c.span + gapW) / (bar + gapW)), used = count * bar + (count - 1) * gapW;
      for (let i = 0; i < count; i++) { const o = -used / 2 + i * (bar + gapW) + bar / 2, cx = c.c[0] + nx * o, cy = c.c[1] + ny * o;
        ctx.save(); ctx.translate(cx, cy); ctx.transform(ux, uy, nx, ny, 0, 0); ctx.fillRect(-c.len / 2, -bar / 2, c.len, bar); ctx.restore(); }
    }
    ctx.restore();
  }
  // 電車（線路を 南北に はしる 2編成。画像の キーは 昼と 夜の 2つだけ）
  function trainY(t, lane) { const p = ((t + lane * 17) % 40 + 40) % 40; return lane ? -13 + p / 40 * (H + 26) : H + 13 - p / 40 * (H + 26); }
  function drawMoving(ctx, sc, ox, oy) {
    if (!sc.map?.def?.ikeTown) return;
    const night = typeof DayTint !== "undefined" && DayTint.isNight(), r = HeiwadaiTown.canvas(sc, { asset: "ikebukuro.train", opts: night ? { night: true } : {} }, false);
    if (!r) return; const { c, a } = r;
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, 4 * TSZ, H * TSZ); ctx.clip();
    for (const lane of [0, 1]) { const y = trainY(G.t, lane), x = lane ? 2.14 : .24; ctx.drawImage(c, ox + x * TSZ + a.originX - 2, oy + y * TSZ + a.originY - 2, a.w + 4, a.h + 4); }
    ctx.restore();
  }
  // よるの あかり（街灯・のぼりの 街灯・大きな 画面・建物の 入口）
  function lights(ctx, scene, ox, oy) {
    if (!scene.map?.def?.ikeTown || !DayTint.isNight()) return;
    const glow = (x, y, r, a, col = "255,218,147") => { if (x + r < 0 || y + r < 0 || x - r > G.W || y - r > G.H) return; const gr = ctx.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, "rgba(" + col + "," + a + ")"); gr.addColorStop(1, "rgba(" + col + ",0)"); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const p of scene.map.def.objects) { const x = ox + p.x * TSZ, y = oy + p.y * TSZ;
      if (p.asset === "prop.lamp") glow(x + 26.5, y - 43.5, 46, .4);
      if (p.asset === "ikebukuro.bannerlamp") glow(x + 31, y - 58, 40, .38);
      if (p.asset === "ikebukuro.vision") glow(x + 48, y - 80, 70, .22, "159,210,242");
      if (p.asset === "ikebukuro.pylon") glow(x + 16, y - 52, 36, .2);
      if (p.asset === "prop.vending") glow(x + 16, y + 4, 30, .24);
    }
    for (const b of scene.map.def.buildings) for (const dx of b.doors || [b.door]) glow(ox + (b.x + dx + .5) * TSZ, oy + (b.y + b.h) * TSZ - 6, 40, .26);
    ctx.restore();
  }
  return { W, H, ROADS, BUILDINGS, NOT_MALL, K, EAST_X, along, road, install, preload, ready, drawGround, drawOver, drawMoving, lights, get def() { return installed; } };
})();
IkebukuroTown.install();
// 描画の つなぎこみ（既存の 経路を 共用。池袋の マップの ときだけ はたらく）
(() => {
  // あたらしい こうばんの 型は 原画の まま（town-check の 型の 絵の 検査も おなじ 絵）
  const building = WorldArt.building;
  WorldArt.building = (sp) => sp.style === "city_koban" ? HeiwadaiArt.model("ikebukuro.koban", {}) : building(sp);
  const preload = TownRoads.preload, draw = TownRoads.draw, ground = TownRenewal.drawGround, moving = TownRenewal.drawMoving, lights = HeiwadaiLife.lights, canvas = HeiwadaiTown.canvas;
  TownRoads.preload = function (def) { return Promise.all([preload.call(this, def), IkebukuroTown.preload(def)]); };
  TownRoads.draw = function (ctx, def) { if (def?.ikeTown && !IkebukuroTown.ready()) return false; const ok = draw.call(this, ctx, def); if (ok && def?.ikeTown) IkebukuroTown.drawOver(ctx, def); return ok; };
  TownRenewal.drawGround = function (ctx, def) { if (def?.ikeTown) IkebukuroTown.drawGround(ctx, def); return ground.call(this, ctx, def); };
  TownRenewal.drawMoving = function (ctx, sc, ox, oy) { moving.call(this, ctx, sc, ox, oy); IkebukuroTown.drawMoving(ctx, sc, ox, oy); };
  HeiwadaiLife.lights = function (ctx, scene, ox, oy) { lights.call(this, ctx, scene, ox, oy); IkebukuroTown.lights(ctx, scene, ox, oy); };
  // 夜の 絵が ある 池袋の 絵は、夜に 夜の 絵を つかう（キーは 絵の ID×昼夜 だけ）
  HeiwadaiTown.canvas = function (scene, it, ensure) {
    if (!it.asset?.startsWith("ikebukuro.")) return canvas.call(this, scene, it, ensure);
    const a = HeiwadaiArt.assets[it.asset], night = a.states.includes("night") && DayTint.isNight();
    if (ensure) return Promise.all(a.states.map((state) => canvas.call(this, scene, { ...it, opts: state === "night" ? { night: true } : {} }, true)));
    return canvas.call(this, scene, { ...it, opts: night ? { night: true } : {} }, false);
  };
})();
