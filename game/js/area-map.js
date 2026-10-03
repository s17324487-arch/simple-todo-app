// エリアの ちず（すまほ の「ちず」→「この エリア」）。ポンチ絵ふうに 道・水・こうえん・たてもの・でぐち・いま ここ を かく。
// MAP_DEFS から その場で くみたてる。見る だけで、セーブも マップも かえない。絵の めじるしは AreaMapArt。
const AreaMap = {
  serial: 0,
  FONT: 10.5, // なまえの もじ（px）
  // ちずに かく みじかい なまえ（ひらがな中心）。ない ものは「（…）」を とった なまえの まま
  NAMES: {
    "ネリカス ゆうびんきょく": "ゆうびんきょく", "ネリカス ガソリンスタンド": "ガソリンスタンド", "レストラン びっくぽ": "びっくぽ",
    "中華 ねりかす飯店": "ちゅうかりょうり", "ネリカス小学校": "しょうがっこう", "ネリカス保育園": "ほいくえん", "ひだまり アパート": "アパート",
    "ねりかす こうばん": "こうばん", "こうえんの トイレ": "トイレ", "わがしや こまち": "わがしや", "きっさ ひだまり": "きっさてん",
    "駐輪場": "じてんしゃ おきば", "平和台えき": "へいわだい えき", "えきまえ マーケット": "マーケット", "へいわだい じんじゃ": "じんじゃ", "交番": "こうばん",
    "こみちの パンや": "パンや", "せんとう へいわの ゆ": "せんとう", "ファミリーレストラン": "ファミレス", "公園のトイレ": "トイレ",
    "池袋えき": "いけぶくろ えき", "ネリカス電機 10F": "ネリカス でんき", "えきまえ ビル": "えきまえ ビル", "れんが ビル": "れんが ビル", "あおぞら ビル": "あおぞら ビル",
    "ひがしぐち ホテル": "ホテル", "いけぶ カフェテラス": "カフェ", "シネマ いけぶくろ": "えいがかん", "いけぶ フードホール": "フードホール",
    "きょうりゅう はくぶつかん": "きょうりゅう はくぶつかん", "シティ シューティング レンジ": "しゃげきじょう", "ひがしどおり こうばん": "こうばん", "いけぶへの ちかみち": "ちかみち", "いけぶ おとどけ ぐち": "おとどけぐち",
    "すいぞくかん（おひっこし）": "もとの すいぞくかん", "きたの まちあい": "まちあい", "みなみの まちあい": "まちあい", "みなとの かぐや": "かぐや", "すいじょうき のりば": "すいじょうき",
    "そらの ターミナル": "ターミナル", "くうこうえき": "くうこう えき", "ひこうき こうぼう": "こうぼう", "そらの はくぶつかん": "はくぶつかん", "てんぼうラウンジ": "てんぼうだい",
    "ビーチの のりば": "ふねの のりば",
  },
  // 道の なまえ（道の id → ひらがな）
  STREETS: { "neri-oodori": "おおどおり", "ike-meiji": "めいじどおり", "ike-east": "ひがしどおり", "ike-s60": "サンシャイン60どおり", "ike-green": "みどりの おおどおり", avenue: "へいわだい どおり", satsuki: "さつきどおり", "port-avenue": "みなと どおり", "terminal-avenue": "くうこう どおり" },
  SHOP_ICON: { furniture: "sofa", clothes: "shirt", lawson: "conbini", sevenbun: "conbini", market: "cart", crepe: "crepe", postoffice: "mail", florist: "flower", gasstand: "fuel", relay: "box", korokoro: "fruit", cake: "cake", dentist: "tooth", groom: "scissors", bakery: "bread", burger: "burger", link: "puzzle", brain: "owl", kobo: "jigsaw" },
  VENUE_ICON: { fashion: "shirt", bikkupo: "fork", neri_apart: "apart", school: "school", nursery: "blocks", electronics: "tv", arcade: "claw", mall: "bag", office: "office" },
  // みる だけの たてもの: なまえで めじるしを きめる（うえから じゅんに）
  VISIT: [[/おうち|いえ$/, "house"], [/トイレ/, "wc"], [/こうばん|交番/, "police"], [/わがし/, "dango"], [/きっさ|カフェ/, "cup"], [/中華|ちゅうか|飯店/, "ramen"], [/こや/, "hut"], [/じんじゃ/, "torii"], [/せんとう/, "bath"],
    [/ほんや|ほんの/, "book"], [/やおや/, "carrot"], [/駐輪|ちゅうりん/, "bike"], [/ホテル/, "bed"], [/シネマ|えいが/, "film"], [/ていえん/, "tree"], [/すいぞくかん/, "fish"], [/まちあい/, "bench"],
    [/こうぼう/, "tools"], [/てんぼう/, "scope"], [/はくぶつかん/, "museum"], [/にもつ|おとどけ/, "box"], [/マーケット|マルシェ/, "cart"], [/インテリア|かぐ/, "sofa"], [/はなや/, "flower"], [/パン/, "bread"],
    [/ゆうびん/, "mail"], [/ほいく/, "blocks"], [/オフィス|ビル$/, "office"], [/コンビニ/, "conbini"], [/ガソリン/, "fuel"], [/レストラン|ファミ|フード/, "fork"], [/えきまえ館|いけぶ/, "bag"]],
  // 地面の いろ
  PAL: {
    grass: "#D9EDBA", tall: "#C9E3A5", sand: "#F6E6BA", wood: "#C3DCA9", dirt: "#EBD8AF", shrine: "#EEE3CA", lot: "#E5E2DB", plaza: "#EEE8DD", street: "#F5E2CB",
    tarmac: "#CBD2D7", floor: "#EADFCC", walk: "#F7EEDB", pier: "#DDBC8C", water: "#A9DAF0", trees: "#9DCB88", rock: "#CDBFAE", wall: "#9C8A7A", rail: "#D6CFC1", lane: "#FFFFFF",
  },
  EDGE: { dirt: "#D5BC8E", lot: "#CEC8BC", walk: "#DDCCA9", pier: "#A98457", water: "#5FA7C9", trees: "#6D9D61", rock: "#9A8A77", wall: "#7C6B5C", lane: "#A9A092", street: "#DDC3A0", tarmac: "#A9B2B9" },
  LAYERS: ["tall", "sand", "wood", "dirt", "shrine", "lot", "plaza", "street", "tarmac", "floor", "walk", "pier", "water", "trees", "rock", "wall", "rail", "lane"],
  // 「したの ほう」など（いま いる ところ から みた むき）
  DIRS: ["みぎ", "みぎした", "した", "ひだりした", "ひだり", "ひだりうえ", "うえ", "みぎうえ"],

  kanji: (s) => /[一-鿿]/.test(s),
  nameOf(label = "") {
    const raw = String(label).trim();
    if (this.NAMES[raw]) return this.NAMES[raw];
    const s = raw.replace(/（[^）]*）|\([^)]*\)/g, "").trim();
    return this.NAMES[s] || s;
  },
  // エリアの なまえ（ひらがなの ぎょうだけ）
  placeName(id) {
    const p = typeof AtlasArt !== "undefined" && AtlasArt.places[id], lines = p ? p.lines.filter((t) => !this.kanji(t)) : [];
    return lines.length ? lines.join(" ") : this.nameOf(MAP_DEFS[id] ? MAP_DEFS[id].name : id);
  },
  // たてもの → [しゅるい, めじるし]
  kindOf(b) {
    const a = b.act || {}, t = a.type, label = b.label || "";
    if (t === "house") return ["home", "home"];
    if (t === "transit") { const k = typeof Transit !== "undefined" && Transit.stops[a.stop] ? Transit.stops[a.stop].kind : "train"; return ["ride", k === "ferry" ? "ship" : k === "plane" ? "plane" : "train"]; }
    if (t === "range") return ["enter", "target"];
    if (t === "indoor") return ["enter", "dino"];
    if (t === "walkway") return ["other", "stairs"];
    if (t === "buy") return ["shop", this.SHOP_ICON[a.shop] || "shop"];
    if (t === "work") return ["work", this.SHOP_ICON[a.shop] || "shop"];
    if (t === "venue") return ["enter", this.VENUE_ICON[a.venue] || "shop"];
    for (const [re, icon] of this.VISIT) if (re.test(label)) return [icon === "house" ? "house" : "other", icon];
    return ["other", "shop"];
  },
  // ちずに だす こもの（バスてい・けいじばん など）
  LANDMARKS: [
    { test: (o) => o.busStop || /busstop/.test(o.kind), cat: "ride", icon: "bus", name: "バスてい" },
    { test: (o) => o.questBoard || o.kind === "questboard", cat: "other", icon: "board", name: "けいじばん" },
    { test: (o) => o.festival || o.kind === "festivalboard", cat: "other", icon: "festival", name: "おまつり" },
    { test: (o) => o.kind === "fountain" || /park_fountain/.test(o.kind), cat: "other", icon: "fountain", name: "ふんすい" },
    { test: (o) => o.kind === "windmill", cat: "other", icon: "mill", name: "ふうしゃ" },
    { test: (o) => o.kind === "lighthouse", cat: "other", icon: "lighthouse", name: "とうだい" },
    { test: (o) => o.kind === "controltower", cat: "other", icon: "tower", name: "かんせいとう" },
    { test: (o) => /_owl$/.test(o.kind), cat: "other", icon: "owl", name: "ふくろう" },
    { test: (o) => o.kind === "glowstone", cat: "other", icon: "gem", name: "ひかる いし" },
    { test: (o) => o.kind === "spring", cat: "other", icon: "drop", name: "いやしの いずみ" },
  ],
  TREES: [[/sakura/, 1, "#F6C6D4", "#D28DA3"], [/pine/, 0.85, "#86B98C", "#5C8F63"], [/tree_big|^tree$/, 1, "#9CCB87", "#6D9D61"], [/tree_street|ginkgo|treegrate/, 0.6, "#A9D28E", "#6D9D61"]],

  // ---- マスの しゅるい（地面の いろわけ）----
  grid(d) {
    const W = d.rows[0].length, H = d.rows.length, cls = new Array(W * H).fill(null);
    const base = { plaza: "plaza", sand: "sand", forest: "wood", cave: "wall", museum_tile: "plaza" }[d.baseGround] || "grass";
    // 平和台は デザインの ASCII（凡例は tools/town-design/render.mjs）と 地面（B = 線路・M = ホーム）
    const HW = { r: "rail", m: "plaza", p: "plaza", w: "plaza", c: "plaza", a: "street", n: "lane", q: "lot", j: "shrine", k: "shrine", d: "dirt", e: "dirt", s: "walk" };
    const ROW = { "~": "water", s: "sand", "=": "walk", "-": "walk", D: "walk", L: "walk", v: "lane", z: "lane", p: "plaza", n: "plaza", b: "pier", g: "dirt", '"': "tall", T: "trees", P: "trees", A: "trees", B: "trees", x: "trees", m: "trees", R: "rock", k: "rock", r: "rock", W: "wall", c: "floor", d: "wood" };
    const GROUND = { plaza: "plaza", path: "walk", dirt: "dirt", sand: "sand", water: "water", bridge: "pier", road: "lane" };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c;
      if (d.authoredGround) { const g = d.authoredGround[y] && d.authoredGround[y][x]; c = g === "B" ? "rail" : g === "M" ? "plaza" : HW[d.authoredAscii && d.authoredAscii[y] && d.authoredAscii[y][x]] || null; }
      else c = ROW[d.rows[y][x]] || null;
      if (c === "walk" && base === "plaza") c = null; // ひろばの 町は 道の マスを かかない（道は ベクトルで かく）
      if (c === "floor" && base !== "wall") c = null;
      cls[y * W + x] = c === base ? null : c;
    }
    const fill = (x0, y0, w, h, c) => { for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, Math.ceil(y0 + h)); y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x0 + w)); x++) cls[y * W + x] = c; };
    for (const o of d.objects || []) if (o.ground && GROUND[o.ground]) fill(o.x, o.y, o.w, o.h, GROUND[o.ground]);
    for (const s of d.surfaces || []) fill(s.x, s.y, s.w, s.h, { neri_parking: "lot", pier: "pier", airfield: "tarmac" }[s.kind] || "plaza");
    if (d.ikeTown) fill(0, 0, 4, H, "rail"); // 池袋の 線路（ikebukuro-town.js の drawGround）
    return { W, H, base, cls };
  },

  // ---- ちずに のせる もの ----
  model(id, here) {
    const d = MAP_DEFS[id], g = this.grid(d), { W, H } = g, places = [];
    (d.buildings || []).forEach((b, i) => {
      const [cat, icon] = this.kindOf(b);
      const text = b.act && typeof b.act.text === "string" ? b.act.text.split("\n")[0] : "";
      places.push({ key: "b" + i, type: "building", cat, icon, name: cat === "house" ? "" : this.nameOf(b.label), x: b.x, y: b.y, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: b.y + b.h / 2, door: b.x + (b.door != null ? b.door : Math.floor(b.w / 2)) + 0.5, act: b.act || {}, text });
    });
    const objs = d.objects || [], park = objs.some((o) => /park_|swing|slide/.test(o.kind));
    const named = new Set();
    objs.forEach((o, i) => {
      const L = this.LANDMARKS.find((l) => l.test(o));
      if (!L) return;
      const nearPark = L.icon === "fountain" && park && objs.some((q) => /park_|swing|slide/.test(q.kind) && Math.hypot(q.x - o.x, q.y - o.y) < 12);
      const full = nearPark ? "こうえん" : L.name, first = !named.has(full); named.add(full);
      places.push({ key: "o" + i, type: "object", cat: L.cat, icon: nearPark ? "tree" : L.icon, name: first ? full : "", full, x: o.x, y: o.y, w: o.w || 1, h: o.h || 1, cx: o.x + (o.w || 1) / 2, cy: o.y + (o.h || 1) / 2, text: typeof o.text === "string" ? o.text.split("\n")[0] : "", obj: o });
    });
    // はたけ（いくつかの はたけを ひとつに まとめる）
    const plots = objs.filter((o) => o.farmPlot != null || o.kind === "farm_plot");
    if (plots.length) {
      const x0 = Math.min(...plots.map((o) => o.x)), y0 = Math.min(...plots.map((o) => o.y)), x1 = Math.max(...plots.map((o) => o.x + o.w)), y1 = Math.max(...plots.map((o) => o.y + o.h));
      places.push({ key: "farm", type: "farm", cat: "home", icon: "farm", name: "はたけ", x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, plots: plots.map((o) => [o.x, o.y, o.w, o.h]), text: "やさいや くだものを そだてる はたけ。" });
    }
    if (d.boss) places.push({ key: "boss", type: "object", cat: "other", icon: "crown", name: "ボス", x: d.boss.x, y: d.boss.y, w: 1, h: 1, cx: d.boss.x + 0.5, cy: d.boss.y + 0.5, text: "おくには つよい まものが いるよ。" });
    const seen = new Set();
    (d.warps || []).forEach((w, i) => {
      // いちばん ちかい はしの むき（どうくつの いりぐち など、はしで ない ところも）
      const side = Object.entries({ up: w.y, down: H - (w.y + w.h), left: w.x, right: W - (w.x + w.w) }).sort((a, b) => a[1] - b[1])[0][0];
      const first = !seen.has(w.to); seen.add(w.to);
      const dest = MAP_DEFS[w.to] ? this.placeName(w.to) : w.to;
      places.push({ key: "x" + i, type: "exit", cat: "exit", icon: "arrow", side, to: w.to, name: first ? dest : "", full: dest, x: w.x, y: w.y, w: w.w, h: w.h, cx: w.x + w.w / 2, cy: w.y + w.h / 2 });
    });
    const trees = [];
    for (const o of objs) { const t = this.TREES.find(([re]) => re.test(o.kind)); if (t) trees.push([o.x + (o.w || 1) / 2, o.y + (o.h || 1) / 2, t[1], t[2], t[3]]); }
    const bg = objs.filter((o) => o.background).map((o) => [o.x, o.y, o.w, o.h]);
    const roads = (d.roads || []).map((r) => ({ id: r.id, carriage: r.carriage || 2, side: r.side || 0, pts: this.sample(r.pieces || []), segs: (r.pieces || []).filter((q) => q.t === "seg"), name: this.STREETS[r.id] || "" }));
    return { id, name: MAP_DEFS[id].name, area: this.placeName(id), W, H, base: g.base, cls: g.cls, places, trees, bg, roads, ring: d.ring || null, here: here || null };
  },
  // 道の データ（seg・arc）を 点の ならびに（TownRoads.sample と おなじ はかりかた）
  sample(pieces) {
    const pts = [];
    for (const q of pieces) {
      if (q.t === "seg") { pts.push(q.a.slice(), q.b.slice()); continue; }
      const n = Math.max(2, Math.ceil(Math.abs(q.a1 - q.a0) / (Math.PI / 24)));
      for (let i = 0; i <= n; i++) { const a = q.a0 + (q.a1 - q.a0) * i / n; pts.push([q.c[0] + q.r * Math.cos(a), q.c[1] + q.r * Math.sin(a)]); }
    }
    return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
  },
  // いま いる ところ（マス の まんなか）。その エリアに いない ときは null
  hereOn(id) {
    if (typeof G === "undefined") return null;
    if (G.sceneName === "world" && G.scene && G.scene.mapId === id && G.scene.party && G.scene.party[0]) { const p = G.scene.party[0]; return { x: p.tx + 0.5, y: p.ty + 0.5 }; }
    if (G.sceneName === "house") { const h = (MAP_DEFS[id].buildings || []).find((b) => b.act && b.act.type === "house"); return h ? { x: h.x + (h.door || 0) + 0.5, y: h.y + h.h + 0.5 } : null; }
    const w = typeof Save !== "undefined" && Save.d && Save.d.world;
    return w && w.map === id ? { x: w.x + 0.5, y: w.y + 0.5 } : null;
  },

  // ---- もじの はば・ならべかた ----
  textW(t, fs) { let w = 0; for (const ch of t) w += /[　-ヿ一-鿿＀-￯]/.test(ch) ? fs : ch === " " ? fs * 0.32 : /[0-9A-Za-z]/.test(ch) ? fs * 0.62 : fs * 0.8; return w; },
  // 1ぎょう → くぎり（スペース）で 2ぎょう
  splits(name) {
    const out = [[name]], sp = [...name.matchAll(/ /g)].map((m) => m.index);
    const two = sp.map((i) => [name.slice(0, i), name.slice(i + 1)]).sort((a, b) => Math.max(...a.map((t) => t.length)) - Math.max(...b.map((t) => t.length)));
    if (two.length) out.push(two[0]);
    return out;
  },
  layout(m, k) {
    const W = m.W * k, H = m.H * k, fs = this.FONT, lh = fs + 2.4, boxes = [], labels = [], hidden = [];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    // soft: めじるし（まる）とは かさなって よい（なまえ・いま ここ とは だめ）。なまえの はこは ふちの よゆう（よこ 2・たて 1）まで かさなって よい
    const hit = (a, own, soft) => boxes.some((b) => b.own !== own && !(soft && b.badge) && a.x0 + 2 < b.x1 && a.x1 - 2 > b.x0 && a.y0 + 1 < b.y1 && a.y1 - 1 > b.y0);
    const inside = (a) => a.x0 >= 2 && a.y0 >= 2 && a.x1 <= W - 2 && a.y1 <= H - 2;
    for (const p of m.places) {
      p.px = p.cx * k; p.py = p.cy * k;
      if (p.type === "building") p.r = p.cat === "house" ? 0 : clamp(Math.min(p.w, p.h) * k * 0.46, 7.5, 11.5);
      else if (p.type === "exit") {
        p.r = 9.5;
        if (p.side === "up") p.py = Math.max(p.py, 12); else if (p.side === "down") p.py = Math.min(p.py, H - 12);
        else if (p.side === "left") p.px = Math.max(p.px, 12); else p.px = Math.min(p.px, W - 12);
      } else p.r = p.type === "farm" ? 9 : 8;
      if (p.type === "farm") { p.px = p.x * k + Math.min(12, p.w * k / 2); p.py = (p.y + p.h) * k - Math.min(12, p.h * k / 2); }
      if (p.r) boxes.push({ x0: p.px - p.r, y0: p.py - p.r, x1: p.px + p.r, y1: p.py + p.r, own: p.key, badge: true });
    }
    let hereBox = null;
    const placeHere = () => {
      const hx = m.here.x * k, hy = m.here.y * k, w = this.textW("いま ここ", fs) + 12, h = lh + 3;
      const cand = [[-w / 2, -23 - h - 1], [11, -18], [-11 - w, -18], [-w / 2, 5], [11, -18 - h], [-11 - w, -18 - h], [11, 0], [-11 - w, 0], [-w / 2, -23 - 2 * h - 2], [-w / 2, 5 + h + 1], [19, -9 - h / 2], [-19 - w, -9 - h / 2]];
      for (const soft of [false, true]) {
        for (const [dx, dy] of cand) {
          const a = { x0: hx + dx, y0: hy + dy, x1: hx + dx + w, y1: hy + dy + h };
          if (inside(a) && !hit(a, "here", soft)) { hereBox = a; break; }
        }
        if (hereBox) break;
      }
      if (!hereBox) { const x0 = clamp(hx - w / 2, 2, W - w - 2), y0 = clamp(hy - 23 - h - 1, 2, H - h - 2); hereBox = { x0, y0, x1: x0 + w, y1: y0 + h }; }
      boxes.push({ ...hereBox, own: "here" });
    };
    if (m.here) { const hx = m.here.x * k, hy = m.here.y * k; boxes.push({ x0: hx - 9, y0: hy - 23, x1: hx + 9, y1: hy + 3, own: "here" }); }
    const PRI = { home: 0, exit: 2, ride: 3, enter: 4, work: 5, shop: 6, other: 7 };
    const order = m.places.filter((p) => p.name).sort((a, b) => PRI[a.cat] - PRI[b.cat] || (a.type === "building" ? 0 : 1) - (b.type === "building" ? 0 : 1));
    if (m.here) { const i = order.findIndex((p) => PRI[p.cat] > 0); order.splice(i < 0 ? order.length : i, 0, { here: true }); }
    for (const p of order) {
      if (p.here) { placeHere(); continue; }
      let got = null;
      // こまかい ところは すこし 小さい もじでも ためす
      for (const [lines, size] of [...this.splits(p.name).map((l) => [l, fs]), ...this.splits(p.name).map((l) => [l, Math.round(fs * 0.86 * 10) / 10])]) {
        const lh2 = size + 2.4, w = Math.max(...lines.map((t) => this.textW(t, size))) + 6, h = lines.length * lh2 + 2, r = p.r || 4;
        const below = [-w / 2, r + 1], above = [-w / 2, -r - 1 - h], right = [r + 2, -h / 2], left = [-r - 2 - w, -h / 2], lh = lh2;
        const first = { up: [below], down: [above], left: [right], right: [left] }[p.side] || [];
        const cand = [...first, below, above, right, left, [r * 0.3, r + 1], [-w - r * 0.3, r + 1], [r * 0.3, -r - 1 - h], [-w - r * 0.3, -r - 1 - h], [-w / 2, r + 1 + lh], [-w / 2, -r - 1 - h - lh], [r + 9, -h / 2], [-r - 9 - w, -h / 2], [r + 2, r - 2], [-r - 2 - w, r - 2], [r + 2, -r + 2 - h], [-r - 2 - w, -r + 2 - h]];
        // たいせつな もの（おうち・でぐち・のりもの・はいれる ところ）は めじるしに すこし かかっても だす
        for (const soft of PRI[p.cat] <= 4 ? [false, true] : [false]) {
          for (const [dx, dy] of cand) {
            const a = { x0: p.px + dx, y0: p.py + dy, x1: p.px + dx + w, y1: p.py + dy + h };
            if (inside(a) && !hit(a, p.key, soft)) { got = { key: p.key, cat: p.cat, lines, fs: size, ...a }; break; }
          }
          if (got) break;
        }
        if (got) break;
      }
      if (got) { labels.push(got); boxes.push({ ...got, own: p.key }); } else hidden.push(p.key);
    }
    // 道の なまえ（道の うえ。かさなる ときは かかない）
    // たての 道は もじを たてに ならべる（1もじずつ まっすぐ）
    const streets = [];
    for (const r of m.roads) {
      if (!r.name) continue;
      const sfs = 9, chars = [...r.name];
      const segs = r.segs.map((q) => ({ a: q.a, b: q.b, len: Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) * k })).sort((a, b) => b.len - a.len);
      let done = false;
      for (const q of segs) {
        let ang = Math.atan2(q.b[1] - q.a[1], q.b[0] - q.a[0]);
        if (ang > Math.PI / 2 + 1e-6) ang -= Math.PI; if (ang <= -Math.PI / 2 + 1e-6) ang += Math.PI;
        const upright = Math.abs(ang) > Math.PI / 3;
        if (upright && ang < 0) ang += Math.PI; // うえから したへ よむ
        const adv = chars.map((ch) => ch === " " ? sfs * 0.45 : upright ? sfs * 1.06 : this.textW(ch, sfs)), len = adv.reduce((a, b) => a + b, 0) + 4;
        if (q.len < len + 8) continue;
        for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88]) {
          const x = (q.a[0] + (q.b[0] - q.a[0]) * t) * k, y = (q.a[1] + (q.b[1] - q.a[1]) * t) * k, pts = [];
          let u = -len / 2 + 2;
          chars.forEach((ch, i) => { const c = u + adv[i] / 2; u += adv[i]; if (ch !== " ") pts.push([ch, x + Math.cos(ang) * c, y + Math.sin(ang) * c]); });
          const bs = pts.map(([, px, py]) => ({ x0: px - sfs * 0.55, y0: py - sfs * 0.55, x1: px + sfs * 0.55, y1: py + sfs * 0.55 }));
          if (bs.every((a) => inside(a) && !hit(a, "street"))) { streets.push({ name: r.name, x, y, ang: ang * 180 / Math.PI, fs: sfs, upright, pts }); for (const a of bs) boxes.push({ ...a, own: "street" }); done = true; break; }
        }
        if (done) break;
      }
    }
    return { k, W, H, labels, hidden, streets, hereBox };
  },

  // ---- マスの あつまりの ふちを、かどの まるい パスに ----
  outline(cls, W, H, want, k, r = 0.5) {
    const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && cls[y * W + x] === want, next = new Map(), key = (x, y) => y * (W + 1) + x;
    const add = (x0, y0, x1, y1) => { const kk = key(x0, y0); if (!next.has(kk)) next.set(kk, []); next.get(kk).push([x1, y1]); };
    let any = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) {
      any = true;
      if (!on(x, y - 1)) add(x, y, x + 1, y);
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!on(x - 1, y)) add(x, y + 1, x, y);
    }
    if (!any) return "";
    let d = "";
    const f = (n) => +n.toFixed(1);
    for (const [k0, outs] of next) while (outs.length) {
      const sx = k0 % (W + 1), sy = Math.floor(k0 / (W + 1)), loop = [[sx, sy]];
      let prev = [sx, sy], cur = outs.pop();
      for (let guard = 0; guard < 100000; guard++) {
        if (cur[0] === sx && cur[1] === sy) break;
        loop.push(cur);
        const o = next.get(key(cur[0], cur[1]));
        if (!o || !o.length) break;
        let i = 0;
        if (o.length > 1) { const dx = cur[0] - prev[0], dy = cur[1] - prev[1]; i = Math.max(0, o.findIndex(([nx, ny]) => nx - cur[0] === -dy && ny - cur[1] === dx)); }
        prev = cur; cur = o.splice(i, 1)[0];
      }
      // まっすぐ つづく 点を はぶく
      const pts = loop.filter((p, i) => { const a = loop[(i - 1 + loop.length) % loop.length], b = loop[(i + 1) % loop.length]; return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0; });
      if (pts.length < 3) continue;
      pts.forEach((p, i) => {
        const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
        const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), rr = Math.min(r, la / 2, lb / 2);
        const s = [p[0] - (p[0] - a[0]) / la * rr, p[1] - (p[1] - a[1]) / la * rr], e = [p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr];
        d += `${i ? "L" : "M"}${f(s[0] * k)} ${f(s[1] * k)}Q${f(p[0] * k)} ${f(p[1] * k)} ${f(e[0] * k)} ${f(e[1] * k)}`;
      });
      d += "Z";
    }
    return d;
  },

  // ---- SVG ----
  svg(m, L, uid) {
    const k = L.k, f = (n) => +n.toFixed(1), P = this.PAL, E = this.EDGE, C = AreaMapArt.CATS, esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    let s = `<svg class="amap-svg" viewBox="0 0 ${f(L.W)} ${f(L.H)}" width="${f(L.W)}" height="${f(L.H)}" role="img" aria-label="${esc(m.name)}の詳細地図" xmlns="http://www.w3.org/2000/svg">`;
    s += `<defs><clipPath id="${uid}-clip"><rect width="${f(L.W)}" height="${f(L.H)}" rx="12"/></clipPath></defs><g clip-path="url(#${uid}-clip)">`;
    s += `<rect width="${f(L.W)}" height="${f(L.H)}" fill="${P[m.base]}"/>`;
    for (const c of this.LAYERS) {
      const d = this.outline(m.cls, m.W, m.H, c, k, c === "lane" || c === "rail" ? 0.2 : 0.55);
      if (d) s += `<path d="${d}" fill="${P[c]}" stroke="${E[c] || "none"}" stroke-width="${E[c] ? 1.1 : 0}" stroke-linejoin="round" data-ground="${c}"/>`;
    }
    // 線路の しるし（くろと しろの しましま）
    const rail = []; m.cls.forEach((c, i) => { if (c === "rail") rail.push([i % m.W, Math.floor(i / m.W)]); });
    if (rail.length) {
      const xs = rail.map((p) => p[0]), ys = rail.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys) + 1;
      const d = x1 - x0 >= y1 - y0 ? `M${f(x0 * k)} ${f((y0 + y1) / 2 * k)}H${f(x1 * k)}` : `M${f((x0 + x1) / 2 * k)} ${f(y0 * k)}V${f(y1 * k)}`;
      s += `<path d="${d}" stroke="#5F5A55" stroke-width="5"/><path d="${d}" stroke="#FFFFFF" stroke-width="2.6" stroke-dasharray="8 8"/>`;
    }
    // ひこうじょうの かっそうろ
    for (const sf of MAP_DEFS[m.id].surfaces || []) if (sf.kind === "airfield") {
      const y = (sf.y + sf.h * 0.55) * k;
      s += `<path d="M${f((sf.x + 2) * k)} ${f(y)}H${f((sf.x + sf.w - 2) * k)}" stroke="#8E979E" stroke-width="${f(sf.h * k * 0.3)}" stroke-linecap="round"/><path d="M${f((sf.x + 4) * k)} ${f(y)}H${f((sf.x + sf.w - 4) * k)}" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="9 7"/>`;
    }
    // はたけ
    for (const p of m.places) if (p.type === "farm") for (const [x, y, w, h] of p.plots) {
      s += `<rect x="${f(x * k)}" y="${f(y * k)}" width="${f(w * k)}" height="${f(h * k)}" rx="2" fill="#C99A6B" stroke="#8E6A48" stroke-width="1"/>`;
      for (let i = 1; i < h * 2; i++) s += `<path d="M${f(x * k + 2)} ${f((y + i / 2) * k)}H${f((x + w) * k - 2)}" stroke="#9FCB7C" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    // 道: ほどう → ふち → しゃどう → まんなかの せん
    const pl = (pts) => "M" + pts.map((p) => `${f(p[0] * k)} ${f(p[1] * k)}`).join("L");
    for (const r of m.roads) if (r.side) s += `<path d="${pl(r.pts)}" fill="none" stroke="${P.walk}" stroke-width="${f((r.carriage + r.side * 2) * k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const ring = m.ring, rb = ring ? `x="${f(ring.x0 * k)}" y="${f(ring.y0 * k)}" width="${f((ring.x1 - ring.x0) * k)}" height="${f((ring.y1 - ring.y0) * k)}" rx="${f(ring.r * k)}"` : "";
    for (const r of m.roads) s += `<path d="${pl(r.pts)}" fill="none" stroke="#8C8272" stroke-width="${f(r.carriage * k + 2.4)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ring) s += `<rect ${rb} fill="none" stroke="#8C8272" stroke-width="${f(ring.w * k + 2.4)}"/>`;
    for (const r of m.roads) s += `<path d="${pl(r.pts)}" fill="none" stroke="#FFFFFF" stroke-width="${f(r.carriage * k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ring) s += `<rect ${rb} fill="none" stroke="#FFFFFF" stroke-width="${f(ring.w * k)}"/><rect ${rb} fill="none" stroke="#E7C667" stroke-width="1.1" stroke-dasharray="5 4"/>`;
    for (const r of m.roads) if (r.carriage >= 4) s += `<path d="${pl(r.pts)}" fill="none" stroke="#E7C667" stroke-width="1.2" stroke-dasharray="6 5"/>`;
    // 木
    for (const [x, y, r, fc, ec] of m.trees) s += `<circle cx="${f(x * k)}" cy="${f(y * k)}" r="${f(Math.max(1.8, r * k))}" fill="${fc}" stroke="${ec}" stroke-width=".9"/>`;
    // はいれない いえ（まちなみ）
    for (const [x, y, w, h] of m.bg) s += `<rect x="${f(x * k + 0.6)}" y="${f(y * k + 0.6)}" width="${f(w * k - 1.2)}" height="${f(h * k - 1.2)}" rx="2" fill="#ECE2D3" stroke="#D2C2A8" stroke-width=".9"/>`;
    // たてもの（やねの いろ・いりぐち）
    for (const p of m.places) if (p.type === "building") {
      const c = C[p.cat], x = p.x * k, y = p.y * k, w = p.w * k, h = p.h * k, rr = Math.min(3, k * 0.6), roof = h * 0.5;
      s += `<g data-key="${p.key}"><rect x="${f(x + 0.7)}" y="${f(y + 0.7)}" width="${f(w - 1.4)}" height="${f(h - 1.4)}" rx="${f(rr)}" fill="${c.fill}" stroke="${INK}" stroke-width="1.2"/>`;
      s += `<path d="M${f(x + 0.7)} ${f(y + roof)}V${f(y + 0.7 + rr)}Q${f(x + 0.7)} ${f(y + 0.7)} ${f(x + 0.7 + rr)} ${f(y + 0.7)}H${f(x + w - 0.7 - rr)}Q${f(x + w - 0.7)} ${f(y + 0.7)} ${f(x + w - 0.7)} ${f(y + 0.7 + rr)}V${f(y + roof)}Z" fill="${c.roof}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
      const dw = Math.min(5, Math.max(2.4, k * 0.8)), dh = Math.min(4.2, Math.max(2.2, k * 0.55));
      s += `<rect x="${f(p.door * k - dw / 2)}" y="${f(y + h - 0.7 - dh)}" width="${f(dw)}" height="${f(dh)}" rx=".6" fill="#FFFFFF" stroke="${INK}" stroke-width=".8"/></g>`;
    }
    // でぐち・めじるし
    for (const p of m.places) if (p.r) {
      const c = C[p.cat], rot = { up: 0, right: 90, down: 180, left: 270 }[p.side] || 0;
      s += `<g class="amap-pin" data-key="${p.key}"><circle cx="${f(p.px)}" cy="${f(p.py)}" r="${f(p.r)}" fill="${p.type === "exit" ? c.fill : "#FFFFFF"}" stroke="${c.ring}" stroke-width="1.8"/>`;
      s += p.type === "exit" ? `<g transform="rotate(${rot} ${f(p.px)} ${f(p.py)})">${AreaMapArt.icon("arrow", p.px, p.py, p.r * 1.45 / 24)}</g>` : AreaMapArt.icon(p.icon, p.px, p.py, p.r * 1.56 / 24);
      s += "</g>";
    }
    // 道の なまえ
    for (const t of L.streets) {
      const a = `text-anchor="middle" dominant-baseline="central" font-size="${t.fs}" font-weight="800" fill="#8A7A62"`;
      if (t.upright) s += `<g class="amap-street" aria-hidden="true">${t.pts.map(([ch, x, y]) => `<text x="${f(x)}" y="${f(y)}" ${a}>${esc(ch === "ー" ? "｜" : ch)}</text>`).join("")}</g>`;
      else s += `<text class="amap-street" transform="translate(${f(t.x)} ${f(t.y)}) rotate(${f(t.ang)})" ${a} letter-spacing=".6">${esc(t.name)}</text>`;
    }
    // なまえ
    const fs = this.FONT;
    for (const b of L.labels) {
      const col = b.cat === "home" ? "#B83A5A" : b.cat === "exit" ? "#6C4690" : INK, cx = (b.x0 + b.x1) / 2, bf = b.fs || fs, lh = bf + 2.4;
      s += `<text class="amap-label" data-key="${b.key}" x="${f(cx)}" y="${f(b.y0 + 1 + bf * 0.9)}" text-anchor="middle" font-size="${bf}" font-weight="800" fill="${col}" stroke="#FFFFFF" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke">`;
      b.lines.forEach((t, i) => { s += `<tspan x="${f(cx)}" dy="${i ? f(lh) : 0}">${esc(t)}</tspan>`; });
      s += "</text>";
    }
    // いま ここ
    if (m.here && L.hereBox) {
      const hx = m.here.x * k, hy = m.here.y * k, b = L.hereBox;
      s += `<g class="amap-here"><circle class="amap-here-pulse" cx="${f(hx)}" cy="${f(hy)}" r="7" fill="#EE4F66" opacity=".3"/>${AreaMapArt.icon("here", hx, hy - 11, 1)}`;
      s += `<rect x="${f(b.x0)}" y="${f(b.y0)}" width="${f(b.x1 - b.x0)}" height="${f(b.y1 - b.y0)}" rx="${f((b.y1 - b.y0) / 2)}" fill="#EE4F66" stroke="#FFFFFF" stroke-width="1.4"/>`;
      s += `<text x="${f((b.x0 + b.x1) / 2)}" y="${f(b.y0 + (b.y1 - b.y0) / 2 + fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#FFFFFF">いま ここ</text></g>`;
    }
    s += `<g class="amap-sel"></g></g><rect width="${f(L.W)}" height="${f(L.H)}" rx="12" fill="none" stroke="${INK}" stroke-width="2"/></svg>`;
    return s;
  },

  // ---- せつめい ----
  what(p) {
    if (p.type === "exit") return `ここから「${p.full}」へ いけるよ。`;
    if (p.icon === "bus") return `バスに のって どこへでも いけるよ（${typeof Transit !== "undefined" ? Transit.BUS_FARE : 100}コイン）。`;
    if (p.type === "farm") return p.text;
    return {
      home: "3にんの おうち。ごはんを たべたり ねたり できるよ。",
      other: p.icon === "drop" ? "みずを のむと げんきが もどるよ。" : "",
      shop: "かいものが できる おみせ。",
      work: "おてつだいを すると コインが もらえるよ。",
      enter: "なかに はいって あそべるよ。",
      ride: p.icon === "ship" ? "ふねに のれるよ。" : p.icon === "plane" ? "ひこうきに のれるよ。" : "でんしゃに のれるよ。",
    }[p.cat] || p.text || "みて まわれるよ。";
  },
  dirFrom(here, p) {
    if (!here) return "";
    const dx = p.cx - here.x, dy = p.cy - here.y;
    if (Math.hypot(dx, dy) < 4) return "いま いる ところの すぐ ちかく。";
    const i = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    return `いま いる ところから みて ${this.DIRS[i]}の ほう。`;
  },

  // ---- がめん（すまほ の「この エリア」）----
  view: null,
  render(el, id, opts = {}) {
    const self = this, V = { id: MAP_DEFS[id] ? id : "town", z: 1, sel: null, uid: `amap-${++this.serial}`, m: null, L: null, drawnW: 0 };
    const root = U.el("section", { class: "area-map", "aria-label": "エリアの ちず" });
    const head = U.el("div", { class: "amap-head" }), badge = U.el("span", { class: "amap-now" });
    const select = U.el("select", { class: "atlas-select amap-select", "aria-label": "ちずを みる エリア" });
    for (const pid of Object.keys(typeof AtlasArt !== "undefined" ? AtlasArt.places : MAP_DEFS)) if (MAP_DEFS[pid]) select.append(U.el("option", { value: pid, text: this.placeName(pid) }));
    head.append(select, badge);
    const frame = U.el("div", { class: "amap-frame" }), tools = U.el("div", { class: "amap-tools" });
    const info = U.el("div", { class: "amap-info", "aria-live": "polite" }), list = U.el("details", { class: "amap-list" });
    const zoom = UI.btn("おおきく みる", () => { V.z = V.z === 1 ? 2 : 1; draw(true); }, "small");
    const hereBtn = UI.btn("いま ここ", () => { if (V.m && V.m.here) { pick("here"); scrollTo(V.m.here.x * V.L.k, V.m.here.y * V.L.k); } }, "small");
    zoom.setAttribute("aria-pressed", "false"); tools.append(zoom, hereBtn);
    root.append(head, frame, tools, info, list); el.append(root);
    const scrollTo = (x, y) => { if (V.z > 1) { frame.scrollLeft = x - frame.clientWidth / 2; frame.scrollTop = y - frame.clientHeight / 2; } };
    const card = (p) => {
      if (V.sel === "here" && V.m.here) {
        const h = V.m.here, near = V.m.places.filter((q) => q.name && q.type === "building").sort((a, b) => Math.hypot(a.cx - h.x, a.cy - h.y) - Math.hypot(b.cx - h.x, b.cy - h.y))[0];
        info.innerHTML = `<div class="amap-card"><div class="amap-card-icon">${AreaMapArt.svg("here", 44)}</div><div><h4>いま ここ</h4><p>3にんは いま ここに いるよ。</p>${near ? `<p class="amap-card-dir">ちかくの たてもの: ${near.name}</p>` : ""}</div></div>`;
        return;
      }
      if (!p) { info.innerHTML = `<p class="amap-hint">たてものや めじるしを タップすると、なまえと できることが でるよ。</p>`; return; }
      const c = AreaMapArt.CATS[p.cat], name = p.name || p.full || c.name;
      info.innerHTML = `<div class="amap-card"><div class="amap-card-icon">${AreaMapArt.svg(p.icon, 44, p.cat)}</div><div><h4>${name}</h4><div class="amap-card-cat" style="color:${c.ring}">${c.name}</div><p>${self.what(p)}</p>${V.m.here ? `<p class="amap-card-dir">${self.dirFrom(V.m.here, p)}</p>` : ""}</div></div>`;
    };
    const mark = () => {
      const g = frame.querySelector(".amap-sel"), h = V.m.here, p = V.sel === "here" && h ? { px: h.x * V.L.k, py: h.y * V.L.k - 11, r: 10 } : V.sel && V.m.places.find((q) => q.key === V.sel);
      if (g) g.innerHTML = p ? `<circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="${((p.r || 8) + 5).toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="4.6"/><circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="${((p.r || 8) + 5).toFixed(1)}" fill="none" stroke="#F29A2E" stroke-width="2.6" stroke-dasharray="4 3"/>` : "";
      for (const b of list.querySelectorAll(".amap-item")) b.setAttribute("aria-pressed", String(b.dataset.key === V.sel));
      root.dataset.selected = V.sel || "";
    };
    const pick = (key) => { V.sel = key; card(key && key !== "here" && V.m.places.find((q) => q.key === key)); mark(); };
    const legend = () => {
      const groups = {};
      const once = new Set();
      for (const p of V.m.places) {
        const nm = p.name || (p.type === "building" ? p.full : "") || "";
        if (p.cat === "house" || !nm || once.has(p.cat + nm)) continue;
        once.add(p.cat + nm); (groups[p.cat] = groups[p.cat] || []).push(p);
      }
      list.innerHTML = "";
      list.append(U.el("summary", { text: "たてものの いちらん" }));
      for (const cat of Object.keys(groups).sort((a, b) => AreaMapArt.CATS[a].order - AreaMapArt.CATS[b].order)) {
        const box = U.el("div", { class: "amap-items" });
        for (const p of groups[cat]) {
          const b = U.el("button", { class: "amap-item", type: "button", "data-key": p.key, html: `${AreaMapArt.svg(p.icon, 24, p.cat)}<span>${p.name || p.full}</span>` });
          b.addEventListener("click", () => { Sound.se && Sound.se("ok"); pick(p.key); frame.scrollIntoView({ block: "nearest" }); scrollTo(p.px, p.py); });
          box.append(b);
        }
        list.append(U.el("h4", { class: "amap-group", text: AreaMapArt.CATS[cat].name }), box);
      }
    };
    const draw = (keep) => {
      const avail = Math.max(260, frame.clientWidth || (el.clientWidth ? el.clientWidth - 4 : 340)), maxH = 460;
      const d = MAP_DEFS[V.id]; let k = avail / d.rows[0].length;
      if (d.rows.length * k > maxH) k = maxH / d.rows.length;
      k *= V.z;
      if (!keep || !V.m) V.m = self.model(V.id, self.hereOn(V.id));
      V.L = self.layout(V.m, k);
      frame.innerHTML = self.svg(V.m, V.L, V.uid);
      frame.classList.toggle("zoomed", V.z > 1);
      zoom.textContent = V.z > 1 ? "ちいさく みる" : "おおきく みる"; zoom.setAttribute("aria-pressed", String(V.z > 1));
      hereBtn.disabled = !V.m.here;
      V.drawnW = frame.clientWidth;
      badge.textContent = V.m.here ? "★ いま ここ" : ""; badge.hidden = !V.m.here; select.value = V.id;
      if (!keep) { legend(); pick(null); } else mark();
      if (V.z > 1) { const p = V.sel && V.m.places.find((q) => q.key === V.sel), h = V.m.here; if (p) scrollTo(p.px, p.py); else if (h) scrollTo(h.x * k, h.y * k); }
    };
    // タップ: いちばん ちかい めじるし・たてもの（ゆびの まわり 24px）
    let down = null;
    frame.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    frame.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; }
      down = null;
      const svg = frame.querySelector("svg"); if (!svg) return;
      const r = svg.getBoundingClientRect(), sx = V.L.W / r.width, x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sx, reach = 24 * sx;
      let best = null, bd = Infinity;
      for (const p of V.m.places) {
        if (!p.name && p.type !== "exit" && p.cat === "house") continue;
        const inRect = p.type === "building" && x >= p.x * V.L.k && x <= (p.x + p.w) * V.L.k && y >= p.y * V.L.k && y <= (p.y + p.h) * V.L.k;
        const dist = inRect ? 0 : Math.hypot(x - p.px, y - p.py) - (p.r || 0);
        if (dist < bd) { bd = dist; best = p; }
      }
      for (const b of V.L.labels) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) { best = V.m.places.find((q) => q.key === b.key); bd = 0; }
      if (best && bd <= reach) { if (typeof Sound !== "undefined" && Sound.se) Sound.se("ok"); pick(best.key); } else pick(null);
    });
    select.onchange = () => { V.id = select.value; V.z = 1; draw(false); };
    V.show = (id2) => { if (MAP_DEFS[id2]) { V.id = id2; V.z = 1; draw(false); } };
    V.refresh = () => { if (frame.clientWidth && Math.abs(frame.clientWidth - V.drawnW) > 1) draw(true); };
    V.root = root; V.pick = pick; V.frame = frame;
    // 画面の はばが かわったら かきなおす（すまほの わく・タブの きりかえ）
    if (typeof ResizeObserver !== "undefined") { const ro = new ResizeObserver(() => { if (root.isConnected) V.refresh(); else ro.disconnect(); }); ro.observe(frame); }
    draw(false);
    this.view = V;
    return V;
  },
  // テスト用の ようす（PokaDebug.areaMap）
  state() {
    const V = this.view;
    if (!V || !V.root.isConnected) return null;
    return { id: V.id, z: V.z, k: V.L.k, sel: V.sel, here: V.m.here, hidden: V.L.hidden.slice(), streets: V.L.streets.map((t) => t.name),
      places: V.m.places.map((p) => ({ key: p.key, type: p.type, cat: p.cat, icon: p.icon, name: p.name || p.full || "", x: +p.px.toFixed(1), y: +p.py.toFixed(1), r: p.r, labeled: V.L.labels.some((b) => b.key === p.key) })),
      labels: V.L.labels.map((b) => ({ key: b.key, text: b.lines.join(" "), x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })) };
  },
};
