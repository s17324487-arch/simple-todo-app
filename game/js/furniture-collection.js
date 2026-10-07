// あき・ふゆの かぐと、ハイクオリティの ひがわり かぐ（UI-40・オーナーの FB 2026-10-01「julesがつくったクオリティの低い家具について
// あなたが作り直しなさい」）。Jules の PR #116 の 家具 25こ（あき・ふゆ 4・クイズの だんろ 1・ひがわりの ゆかの かぐ 10・かべかざり 10）を
// なまえも 絵も うごきも あたらしく つくった（id も あたらしい。#116 は main に はいって いないので セーブは かわらない）。
// ・ゆかの かぐは FurnModels の 立体（INK の 線・パステル・まるい つなぎめ）。かべかざりは 0..w × 0..h の 2D の 絵（ほかの かべかざりと おなじ）。
// ・さわると うごく（FurnLive）: あかり 5（つく／きえる・よるは はじめから つく）・ずっと うごく もの（ふりこ・はり・ほのお・くも・ライト・テレビ）・
//   ほかは タップで ハート・おんぷ・きらきら・おちば・ゆげ が でて 3人が ひとこと いう。うごく ぶぶんは live の とき 絵から ぬいて canvas に 描く。
// ・ひがわり: かぐやさんの「かぐ」と「かべかざり」に、2にちごとに 2つずつ ならぶ（10しゅるいを 10にちで ひとまわり）。
//   日づけは その日の 0じ から（PokaDebug.calendar の Seasonal.override も つかう）。もって いる かぐは いつでも おける。
// ・クイズの だんろは QuizPrizes の「ごうか」に 1つ ふえる（まちの クイズで たまに もらえる）。
// ねだんは もとの ねだんの 4ばい（SlowLifePrices。この ファイルは slow-life-prices.js と quiz-prizes.js の あとに よむ）。SvgCache は つかわない。
const FurnCollection = (() => {
  const TAU = Math.PI * 2;
  const { rect, rr, ov, arc, arch, star, heart, scallop, moon, close, rot2 } = FurnModels.shapes;
  const S = (w = 1.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const GOLD = ["#E9C873", "#C9A24E", "#F5DE9C"], SILVER = ["#D9DEE4", "#B3BCC6", "#EEF1F4"];
  // [id, なまえ, もとの ねだん, しゅるい, はば, おくゆき, たかさ, いごこち, せつめい, そのほか]
  const AUTUMN = [
    ["aw_acorn_lamp", "どんぐりの ランプ", 280, "floor", 46, 46, 78, 3, "どんぐりの ぼうしの ランプ。", { cat: ["light"] }],
    ["aw_maple_rug", "もみじの ラグ", 360, "rug", 150, 140, 3, 4, "まっかな もみじの ラグ。", {}],
    ["aw_snow_tree", "ゆきげしきの ツリー", 420, "floor", 72, 72, 140, 5, "ゆきの つもった もみの き。", { cat: ["plant", "light"] }],
    ["aw_knit_sofa", "あみもの ソファ", 480, "floor", 118, 62, 70, 6, "けいとで あんだ ソファ。", { cat: ["sit"] }],
  ];
  const FLOOR = [
    ["hq_velvet_sofa", "ビロードの ソファ", 1000, "floor", 126, 62, 74, 9, "ふかふかの ビロードと きんの ボタン。", { cat: ["sit"] }],
    ["hq_marble_table", "だいりせきの テーブル", 800, "floor", 86, 86, 62, 7, "しろい だいりせきと きんの あし。", { cat: ["table"] }],
    ["hq_gold_lamp", "きんの スタンドライト", 700, "floor", 46, 46, 142, 6, "ひだの かさと ガラスの しずく。", { cat: ["light"] }],
    ["hq_crystal_piano", "ガラスの グランドピアノ", 1500, "floor", 128, 96, 104, 12, "すきとおる ピアノ。さわると ひくよ。", { cat: ["misc"] }],
    ["hq_canopy_bed", "てんがいの ベッド", 1500, "floor", 132, 100, 156, 12, "ほしの カーテンの ついた ベッド。", { cat: ["sit"], sleep: 2 }],
    ["hq_antique_shelf", "アンティークの ほんだな", 1000, "floor", 90, 40, 152, 8, "ガラスの とびらに ほんと ちきゅうぎ。", { cat: ["table"] }],
    ["hq_silver_clock", "ぎんの ふりこどけい", 1100, "floor", 60, 42, 174, 9, "ほんとうの じこくで うごく とけい。", { cat: ["misc"] }],
    ["hq_velvet_chair", "ビロードの アームチェア", 650, "floor", 76, 66, 88, 7, "おおきな せもたれと あしおき。", { cat: ["sit"] }],
    ["hq_home_theater", "おおきな シアターテレビ", 1300, "floor", 148, 48, 108, 10, "おおきな がめんで ばんぐみを みよう。", { cat: ["misc"] }],
    ["hq_wave_sculpture", "ガラスの なみの オブジェ", 900, "floor", 56, 56, 118, 7, "くるりと まいた ガラスの なみ。", { cat: ["misc"] }],
  ];
  const WALL = [
    ["hq_gold_mirror", "きんぶちの かがみ", 700, "wall", 56, 0, 80, 6, "ばらの かざりの まるい かがみ。"],
    ["hq_sunflower_art", "ひまわりの おかの え", 900, "wall", 96, 0, 72, 8, "ひまわりと ふうしゃの おかの え。"],
    ["hq_wall_sconce", "ガラスの かべランプ", 650, "wall", 68, 0, 64, 5, "チューリップの ガラスが ひかる。"],
    ["hq_knight_shield", "きしの たて", 750, "wall", 72, 0, 82, 6, "ライオンと ハートの もんしょう。"],
    ["hq_plush_deer", "しかの ぬいぐるみ かざり", 700, "wall", 72, 0, 76, 6, "はなかんむりの しかさん。ふわふわ。"],
    ["hq_cuckoo_clock", "もりの はとどけい", 850, "wall", 56, 0, 94, 7, "ことりが とびだす もりの とけい。"],
    ["hq_castle_tapestry", "おしろの タペストリー", 800, "wall", 66, 0, 98, 7, "よぞらと おしろを おった ぬの。"],
    ["hq_heart_neon", "ハートの ネオン", 600, "wall", 80, 0, 58, 5, "ピンクの ハートが ぴかっと ひかる。"],
    ["hq_wall_shelf", "かざりの かべだな", 650, "wall", 86, 0, 64, 6, "ポットと しょくぶつの かべだな。"],
    ["hq_gold_wreath", "きんいろの リース", 600, "wall", 66, 0, 66, 5, "まつぼっくりと すずの リース。"],
  ];
  // クイズの ごうかな ごほうび（まちの クイズで たまに もらえる。かぐやには ならばない）
  const QUIZ = { id: "quiz_starry_fireplace", tier: "luxury", name: "ほしぞらの だんろ", price: 36000, w: 118, depth: 50, h: 128, comfort: 15, desc: "ほしが まう よぞらいろの だんろ。" };

  const add = (f) => { FURNITURE.push(f); FURN_INDEX[f.id] = f; FURN_ART[f.id] = (opts = {}) => (f.kind === "wall" ? WALL_ART[f.id](opts) : HomeDesign.model(f.id, opts).full); };
  const row = ([id, name, base, kind, w, depth, h, comfort, desc, more = {}], daily) => {
    if (FURN_INDEX[id]) return;
    const f = { id, name, price: SlowLifePrices.price("furniture", base), kind, w, h, comfort, desc, ...more };
    if (kind !== "wall") f.depth = depth;
    if (daily) f.daily = true;
    add(f);
  };
  AUTUMN.forEach((r) => row(r, false));
  FLOOR.forEach((r) => row(r, true));
  WALL.forEach((r) => row(r, true));
  if (!FURN_INDEX[QUIZ.id]) {
    QuizPrizes.items.push(QUIZ);
    add({ ...QUIZ, kind: "floor", rare: true, quizPrize: true, cat: ["light"] });
  }

  // ---- ひがわり（2にちごとに 2つずつ）----
  const ROT = { floor: FLOOR.map((r) => r[0]), wall: WALL.map((r) => r[0]) };
  const DAILY = new Set([...ROT.floor, ...ROT.wall]);
  const dateNow = () => (typeof Seasonal !== "undefined" && Seasonal.override) || new Date();
  const dayNum = (d = dateNow()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const period = (d) => Math.floor(dayNum(d) / 2);
  const featured = (tab, d) => { const L = ROT[tab], p = period(d); return L ? [L[(2 * p) % L.length], L[(2 * p + 1) % L.length]] : []; };
  // きょうを いれて あと なんにち ならぶか（1 か 2）
  const daysLeft = (d) => 2 - (dayNum(d) % 2);

  // ================= かたちの 道具 =================
  // へこみの ある 形を たてに のばす（ピアノの ふち）: 見える よこの 面は つながった ところを 1まいに して、おくから じゅんに。さいごに うえの 面
  const extrude = (k, ps, z0, z1, side, top, sw = 1.4, e = "") => {
    const n = ps.length;
    let A = 0;
    for (let i = 0; i < n; i++) { const [x1, y1] = ps[i], [x2, y2] = ps[(i + 1) % n]; A += x1 * y2 - x2 * y1; }
    const vis = ps.map(([x1, y1], i) => { const [x2, y2] = ps[(i + 1) % n]; return (y2 - y1 - (x2 - x1)) * Math.sign(A) > 1e-9; });
    const s0 = vis.indexOf(false), strips = [];
    let run = null;
    for (let j = 1; j <= n && s0 >= 0; j++) { const i = (s0 + j) % n; if (vis[i]) (run = run || []).push(i); else if (run) { strips.push(run); run = null; } }
    if (run) strips.push(run);
    const sides = strips.map((r) => {
      const pts = [...r.map((i) => ps[i]), ps[(r[r.length - 1] + 1) % n]], dep = pts.reduce((a, [x, y]) => a + x + y, 0) / pts.length;
      return [dep, [...pts.map(([x, y]) => [x, y, z1]), ...pts.slice().reverse().map(([x, y]) => [x, y, z0])]];
    }).sort((a, b) => a[0] - b[0]);
    return sides.map(([, q]) => k.poly(q, side, sw, e)).join("") + k.shape(k.TP(z1), ps, top, sw, e);
  };
  // ラグ: した（ふちの いろ）と うえ（おもての いろ）の 2まい
  const two = (k, ps, th, base, top, sw = 1.5) => k.shape(k.TP(0), ps, base, sw) + k.shape(k.TP(th), ps, top, sw);
  // 画面で まっすぐ（うえが 画面の うえ）に 見える むきの ゆかの 点: a は 画面の よこ、b は 画面の たて（した が ＋）
  const UP = (cx, cy) => (a, b) => [cx + (a + b) * 0.7071, cy + (b - a) * 0.7071];
  // つつの 見える はんぶん（-45°〜135°）の 点
  const front = (cx, cy, r, z, n = 12, sy = 1, a0 = -Math.PI / 4, a1 = (3 * Math.PI) / 4) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy, z]; });
  // きまった 乱数（おなじ 家具は いつも おなじ 絵）
  const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // 小さな 絵（画面の うえ。した の まんなかが 0,0）
  const leafSvg = (c = "#8DB87A", r = 0, sc = 1) => `<g transform="rotate(${r}) scale(${sc})"><path d="M0,0 C-5,-3 -6,-10 0,-15 C6,-10 5,-3 0,0 Z" fill="${c}" ${S(1)}/><path d="M0,-1 V-13" stroke="${shade(c, 0.35)}" stroke-width="0.9"/></g>`;
  const starSvg = (r, c = "#F5D66B") => `<path d="${starPath(0, -r, r, r * 0.46)}" fill="${c}" ${S(1.3)}/><path d="${starPath(0, -r, r * 0.55, r * 0.25)}" fill="#FFF6CF"/>`;
  const dropSvg = (h = 7) => `<path d="M0,0 L-2.4,${h * 0.55} L0,${h} L2.4,${h * 0.55} Z" fill="#E6F6FB" ${S(0.8)}/><path d="M-0.8,${h * 0.35} L0,${h * 0.75}" stroke="#FFFFFF" stroke-width="0.8"/>`;
  const giftSvg = (c, rib) => `<rect x="-6" y="-11" width="12" height="11" rx="1.5" fill="${c}" ${S(1.1)}/><rect x="-7" y="-13" width="14" height="3.4" rx="1" fill="${shade(c, 0.2)}" ${S(1)}/><path d="M0,-13 V0" stroke="${rib}" stroke-width="2.2"/><path d="M0,-13 Q-5,-18 -4,-13 Z M0,-13 Q5,-18 4,-13 Z" fill="${rib}" ${S(0.9)}/>`;

  const M = {};
  // ================= あき・ふゆ =================
  M.aw_acorn_lamp = (k) => {
    // どんぐりの ランプ: きりかぶの だい・ひかる どんぐりの み（あめいろ）・うろこもようの ぼうし・くるんと した じく と はっぱ
    const { cyl, egg, dome, lathe, rod, at, shadow, rg, lineOn, TP, P, xy, eggAt, shape } = k, cy = -23;
    let s = shadow(0.13, 6, 20);
    s += cyl(0, cy, 0, 16, 7, "#9C6E4B", "#D9B07E", 1.4);
    for (const r of [11, 6]) s += lineOn(TP(7.05), close(ov(0, cy, r, r * 0.96, 28)), "#B98A5E", 1);
    s += at(11, cy + 9, 7, leafSvg("#E9965A", -65, 0.8), 10, 10) + at(-9, cy + 12, 7, leafSvg("#F2C14E", 50, 0.7), 10, 10);
    s += rod([[0, cy, 6], [0, cy, 13]], "#8E5F3E", 2.2);
    // み（した が すこし とがる）
    s += lathe(0, cy, [[2.6, 12.4], [0.6, 10.6]], "#B8743E", 1.1);
    s += egg(0, cy, 31, 16, 16, 19, rg([[0, "#FFF0C2"], [0.55, "#F7C46E"], [1, "#DE9446"]], 0.4, 0.42, 0.75), 1.6);
    for (const a of [-0.2, 0.55, 1.3]) {
      const ps = []; for (let b = -1.05; b <= 0.5; b += 0.15) ps.push(P(...eggAt(0, cy, 31, 16.2, 16.2, 19.2, a, b)));
      s += `<polyline points="${ps.map(xy).join(" ")}" fill="none" stroke="#FFF4D6" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    // ぼうし（ふちの おび → まるい ぼうし → うろこ）
    s += cyl(0, cy, 34.5, 18.2, 3.2, "#6E4529", "#8C5A3A", 1.4) + dome(0, cy, 37.6, 18, 18, 13.5, "#8C5A3A", 1.5);
    for (const [b, n] of [[0.25, 7], [0.62, 6], [1.0, 4]]) for (let i = 0; i < n; i++) {
      const a = -0.55 + (i / (n - 1)) * 2.2, q = P(...eggAt(0, cy, 37.6, 18.2, 18.2, 13.7, a, b));
      s += `<path d="M${(q.x - 2.4).toFixed(1)},${(q.y - 0.6).toFixed(1)} q2.4,2.6 4.8,0" fill="none" stroke="#C99466" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    s += rod([[0, cy, 50.5], [0.5, cy, 55], [3.5, cy, 58.5]], "#6E4529", 2.2) + at(4.5, cy, 57.5, leafSvg("#8DB87A", 55, 0.75), 10, 12);
    return s;
  };

  // もみじ（画面で まっすぐ。うえが いちばん ながい はっぱ・したに じく）。ゆかで たてに つぶれて 見えるので たてに 1.3ばい
  const MAPLE = (() => {
    const N = 360, out = [];
    for (let i = 0; i < N; i++) {
      const p = (i / N) * TAU, lobe = (1 - Math.abs(Math.sin(2.5 * p))) ** 0.55, teeth = 1 + 0.07 * (1 - Math.abs(Math.sin(12.5 * p))) * lobe;
      const r = 60 * (0.3 + 0.7 * lobe) * (0.74 + 0.26 * Math.cos(p)) * teeth;
      out.push([Math.sin(p) * r, (-Math.cos(p) * r) * 1.3 - 2]);
    }
    return out;
  })();
  M.aw_maple_rug = (k) => {
    // もみじの ラグ: こい あかの ふち・あかから だいだいの おもて・はっぱの すじ・ぬいめ・じく。はっぱの まんなか（b = -14）を ラグの まんなかに
    const { d, shape, TP, lineOn, lg } = k, F = UP(0, -d / 2), at2 = (ps, sc = 1) => ps.map(([a, b]) => F(a * sc, (b + 14) * sc));
    let s = two(k, at2(MAPLE), 3, "#A93A2C", lg([[0, "#F07D45"], [0.55, "#E25A3C"], [1, "#C9452F"]], 0, 0, 0, 1), 1.6);
    s += shape(TP(3.05), at2(MAPLE, 0.7), "#F3955A", 0, 'fill-opacity=".5"') + lineOn(TP(3.1), close(at2(MAPLE, 0.88)), "#FFD9B8", 1.1, 'stroke-dasharray="3 2.6"');
    s += shape(TP(3.1), at2([[-2.6, 8], [2.6, 8], [5, 30], [9, 48], [5, 49], [1, 32]]), "#8E5A3A", 1.2);
    for (const p of [0, 1.257, -1.257, 2.513, -2.513]) {
      const r = 58 * (0.74 + 0.26 * Math.cos(p)) * 0.84, tip = [Math.sin(p) * r, -Math.cos(p) * r * 1.3 - 2], base = [0, 8];
      s += lineOn(TP(3.15), at2([base, [tip[0] * 0.5, base[1] + (tip[1] - base[1]) * 0.5 - 2], tip]), "#B8402E", 2);
      for (const u of [0.45, 0.7]) {
        const bx = tip[0] * u, by = base[1] + (tip[1] - base[1]) * u, nx = -(tip[1] - base[1]) * 0.1, ny = tip[0] * 0.1;
        s += lineOn(TP(3.15), at2([[bx, by], [bx + nx + tip[0] * 0.08, by + ny + (tip[1] - base[1]) * 0.08]]), "#C9503A", 1.2) + lineOn(TP(3.15), at2([[bx, by], [bx - nx + tip[0] * 0.08, by - ny + (tip[1] - base[1]) * 0.08]]), "#C9503A", 1.2);
      }
    }
    return s;
  };

  // ツリーの ライト（どの だんの どこ）: [x, y, z, いろの ばんごう]
  const TREE_CY = -36, TIERS = [[32, 30, 66], [27, 54, 88], [21, 76, 110], [14, 98, 128]];
  const tierR = (t, z) => { const [r0, z0, z1] = TIERS[t]; return Math.max(0.5, r0 * (1 - (z - z0) / (z1 - z0))); };
  const BULBS = (() => {
    const out = [];
    TIERS.forEach(([, z0, z1], t) => {
      const n = 7 - t;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), a = -0.6 + u * 2.6, z = z0 + (z1 - z0) * (0.12 + 0.3 * u), r = tierR(t, z) + 0.6; out.push([Math.cos(a) * r, TREE_CY + Math.sin(a) * r, z, (i + t) % 4]); }
    });
    return out;
  })();
  const BULB_COLS = ["#FFE07A", "#F59AB0", "#9CD3F2", "#B9E59A"];
  M.aw_snow_tree = (k) => {
    // ゆきげしきの ツリー: けいとの もようの あかい はち・ゆきの つちと プレゼント・4だんの もみの き（ゆきの ぼうし と しずく）・かざりの たま・ライト・ほし
    const { cyl, frustum, lathe, ball, at, shadow, lg, shape, TP, P, xy, L } = k, cy = TREE_CY;
    let s = shadow(0.13, 10, 30);
    s += at(-23, cy + 24, 0, `<g transform="scale(1.6)">${giftSvg("#F2A7B8", "#FFFFFF")}</g>`, 14, 24) + at(25, cy + 18, 0, `<g transform="scale(1.4)">${giftSvg("#9CC7E6", "#F7D56A")}</g>`, 14, 22);
    s += frustum(0, cy, 0, 16, 22, 19.5, "#D9574F", "#FFFFFF", 1.4);
    const zig = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 4 + (i / 16) * Math.PI, r = 17.8 + 0.08 * 12; zig.push(P(Math.cos(a) * r, cy + Math.sin(a) * r, i % 2 ? 9 : 14)); }
    s += `<polyline points="${zig.map(xy).join(" ")}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += shape(TP(22.1), ov(0, cy, 19, 19, 28), "#FFFFFF", 1.2);
    s += cyl(0, cy, 22, 4, 10, "#8E6446", "#A87A55", 1.2);
    TIERS.forEach(([r0, z0, z1], t) => {
      s += lathe(0, cy, [[r0, z0], [r0 * 0.94, z0 + 2.5], [0.6, z1]], lg([[0, "#86C08E"], [0.55, "#5E9E6E"], [1, "#467F57"]], 0, 0, 1, 0), 1.5);
      const zs = z0 + (z1 - z0) * 0.64, rs = tierR(t, zs);
      s += lathe(0, cy, [[rs + 0.4, zs], [0.6, z1 + 0.6]], "#FFFFFF", 1.3);
      for (const [x, y, z] of front(0, cy, rs + 0.2, zs - 0.6, 6 - Math.min(t, 2))) s += ball(x, y, z, 2.2 - t * 0.2, "#FFFFFF", 1, 0);
      const orn = [[-0.3, 0.32, "#E0574F"], [0.9, 0.22, "#F2C14E"], [2.0, 0.3, "#7FB3D9"]];
      if (t < 3) for (const [a, u, c] of orn) { const z = z0 + (z1 - z0) * u, r = tierR(t, z) + 1.2; s += ball(Math.cos(a + t) * r, cy + Math.sin(a + t) * r, z, 2.6, c, 1.1, 0.7); }
    });
    s += L(BULBS.map(([x, y, z, c]) => ball(x, y, z, 1.5, BULB_COLS[c], 0.9, 0.5)).join(""));
    s += at(0, cy, 127, starSvg(9), 12, 20);
    return s;
  };

  M.aw_knit_sofa = (k) => {
    // あみもの ソファ: オートミールいろの けいと（なわあみ・めりやすの もよう）・ぽんぽんの しかくい クッション 2つ・しましまの ひざかけ
    // かさねる じゅん: だい → せもたれ → ひだりの ひじかけ → ざぶとん・クッション → みぎの ひじかけ → ひざかけ
    const { box, prism, shape, lineOn, FR, TP, ball, cyl, shadow } = k;
    const K = ["#EBDCC3", "#D3C1A3", "#F6EBD8"], KD = "#C9B48F";
    const knitCol = (m, x, z0, z1) => { let t = ""; for (let z = z0; z < z1 - 3; z += 5) t += lineOn(m, [[x - 3, z + 3], [x, z], [x + 3, z + 3]], KD, 1); return t; };
    let s = shadow(0.12, 2, 10);
    for (const [x, y] of [[-52, -54], [52, -54], [-52, -8], [52, -8]]) s += cyl(x, y, 0, 3, 6, "#A87A55", "#C99B6E", 1.1);
    s += prism(TP(24), rr(-60, -60, 120, 58, 10), [0, 0, -18], K[2], K[1], 1.5);
    for (let x = -50; x <= 50; x += 10) s += knitCol(FR(-2.2), x, 9, 23);
    s += prism(FR(-46), rr(-58, 24, 116, 46, 12), [0, -14, 0], K[0], K[1], 1.6);
    for (let x = -40; x <= 40; x += 10) s += (Math.abs(x) % 20 === 10 ? lineOn(FR(-45.9), [[x - 2, 30], [x + 2, 36], [x - 2, 42], [x + 2, 48], [x - 2, 54], [x + 2, 60]], "#FFF8EC", 2.2) : knitCol(FR(-45.9), x, 30, 64));
    const arm = (x) => {
      let t = prism(FR(-2), rr(x, 24, 14, 30, 7), [0, -56, 0], K[0], K[1], 1.5);
      for (let z = 28; z < 50; z += 5) t += lineOn(FR(-1.9), [[x + 4, z + 3], [x + 7, z], [x + 10, z + 3]], KD, 1);
      return t;
    };
    s += arm(-60);
    s += prism(TP(31), rr(-46, -46, 45, 44, 9), [0, 0, -7], K[2], K[1], 1.3) + prism(TP(31), rr(1, -46, 45, 44, 9), [0, 0, -7], K[2], K[1], 1.3);
    // ぽんぽんの クッション（たてに たてかける）
    for (const [x, c] of [[-23, "#F2A7B8"], [23, "#F2C46B"]]) {
      s += prism(FR(-36), rr(x - 13, 33, 26, 24, 7), [0, -6, 0], c, shade(c, -0.15), 1.4);
      for (let i = 0; i < 4; i++) s += lineOn(FR(-35.9), [[x - 9 + i * 6, 39], [x - 6 + i * 6, 36], [x - 3 + i * 6, 39]], shade(c, 0.4), 1.1) + lineOn(FR(-35.9), [[x - 9 + i * 6, 47], [x - 6 + i * 6, 44], [x - 3 + i * 6, 47]], shade(c, 0.4), 1.1);
      for (const [dx, dz] of [[-12, 56], [12, 56], [-12, 34], [12, 34]]) s += ball(x + dx, -35.5, dz, 2.4, "#FFFFFF", 1, 0);
    }
    s += arm(46);
    // ひざかけ（みぎの ひじかけの うえから まえへ たれる）
    s += box(44, -54, 17, 50, 54, 1.8, ["#FFF1DC", "#F0DEC2", "#FFF7EA"], 1.1);
    s += shape(FR(-0.6), [[44, 55.8], [61, 55.8], [61, 18], [44, 22]], "#FFF1DC", 1.3);
    for (const [z0, c] of [[48, "#E5844F"], [39, "#8DB87A"], [30, "#E5844F"]]) s += shape(FR(-0.5), [[44, z0], [61, z0 - 1], [61, z0 - 5], [44, z0 - 4]], c, 0);
    for (let x = 45.5; x < 61; x += 3) s += lineOn(FR(-0.4), [[x, 22 - ((x - 44) / 17) * 4], [x, 17 - ((x - 44) / 17) * 4]], "#E5844F", 1.2);
    return s;
  };

  // ================= クイズの ごほうび: ほしぞらの だんろ =================
  const FIRE = { cx: 0, y: -4, z0: 10, w: 34, h: 30 }; // ほのおの ねもと（まえの 面の すこし おく）
  M.quiz_starry_fireplace = (k) => {
    // よぞらいろの いしの だんろ: クリームの いしの ゆか・はしら・アーチの くち（まき と ほのお）・きんの ほし と せいざ・マントルの うえの みかづき と ろうそく・ほしの ガーランド
    const { box, prism, shape, lineOn, FR, TP, cyl, ball, at, shadow, lg, rg, L, rod } = k;
    const NAVY = ["#46578C", "#33416D", "#5D70A8"], CREAMS = ["#F4E8CF", "#DCCBA8", "#FFF8E9"];
    let s = shadow(0.14, 0, 6);
    s += box(-59, -50, 118, 50, 0, 6, CREAMS, 1.5);
    s += box(-52, -46, 104, 40, 6, 82, NAVY, 1.6);
    // くち（アーチ）: おくの かべ → まき → ほのお（live の ときは ぬく）
    const mouth = arch(-26, 26, 8, 46, 60);
    s += shape(FR(-5.9), arch(-30, 30, 8, 50, 64), "#E9C873", 1.5) + shape(FR(-5.8), mouth, "#20253F", 1.4);
    s += shape(FR(-5.7), arch(-20, 20, 8, 40, 52), rg([[0, "#7A3B2E"], [1, "#2A2238"]], 0.5, 0.85, 0.8), 0);
    s += rod([[-16, -18, 11], [14, -12, 12]], "#8E5F3E", 4.6) + rod([[-12, -10, 12], [16, -20, 11]], "#A87A55", 4.6);
    s += L(fireSvg(k));
    // はしら（クリームの いし・きんの かざり）
    for (const x of [-58, 42]) {
      s += box(x, -10, 16, 6, 6, 82, CREAMS, 1.4) + box(x - 1, -11, 18, 8, 80, 6, ["#E9C873", "#C9A24E", "#F5DE9C"], 1.2);
      s += lineOn(FR(-3.9), [[x + 5, 14], [x + 5, 76]], "#DCCBA8", 1.2) + lineOn(FR(-3.9), [[x + 11, 14], [x + 11, 76]], "#DCCBA8", 1.2);
    }
    // まえの 面の ほし（せいざ）
    const dots = [[-34, 72], [-24, 78], [-12, 70], [10, 74], [24, 70], [32, 78]];
    s += lineOn(FR(-5.8), dots.slice(0, 3), "#F5DE9C", 0.9, 'stroke-dasharray="1.6 1.6"') + lineOn(FR(-5.8), dots.slice(3), "#F5DE9C", 0.9, 'stroke-dasharray="1.6 1.6"');
    for (const [x, z] of dots) s += shape(FR(-5.7), star(x, z, 3, 1.3), "#F5DE9C", 0.8);
    for (const [x, z] of [[-38, 30], [36, 34], [-36, 52], [34, 56], [0, 80]]) s += shape(FR(-5.7), star(x, z, 2, 0.9), "#FFFFFF", 0);
    // マントル（たな）と ガーランド
    s += box(-62, -50, 124, 50, 88, 7, CREAMS, 1.5) + lineOn(FR(0.05), [[-62, 91.5], [62, 91.5]], "#E9C873", 2);
    const garl = []; for (let i = 0; i <= 24; i++) { const x = -50 + (i / 24) * 100; garl.push([x, 85 - Math.abs(Math.sin((i / 24) * Math.PI * 4)) * 5]); }
    s += lineOn(FR(0.3), garl, "#C9A24E", 1);
    for (let i = 0; i < 8; i++) { const x = -44 + i * 12.6; s += shape(FR(0.4), star(x, 80.5 - (i % 2) * 1.5, 3.2, 1.4), i % 2 ? "#F5DE9C" : "#FFFFFF", 0.8); }
    // マントルの うえ: みかづき・ほし・ろうそく
    s += prism(FR(-26), moon(0, 112, 15), [0, -4, 0], "#F5D66B", "#C9A24E", 1.5);
    s += shape(FR(-25.9), [[-4.5, 113], [-2.5, 115], [-0.5, 113]].map(([x, z]) => [x, z]), "none", 1.1);
    s += lineOn(FR(-25.9), [[-6, 113.5], [-3.5, 111.5], [-1, 113.5]], INK, 1.1) + shape(FR(-25.9), ov(-3, 107.5, 1.6, 1.2, 10), "#F2A7B8", 0);
    s += prism(FR(-24), star(24, 108, 7, 3.2), [0, -3, 0], "#F5D66B", "#C9A24E", 1.2) + prism(FR(-24), star(-24, 104, 5, 2.3), [0, -3, 0], "#FFF1B8", "#C9A24E", 1.1);
    for (const x of [-46, 46]) s += cyl(x, -24, 95, 4.6, 2, "#C9A24E", "#E9C873", 1) + cyl(x, -24, 97, 2.6, 13, "#F3EAD8", "#FFFDF6", 1.1) + L(at(x, -24, 110, SPR_CANDLE(), 6, 12));
    return s;
  };
  const SPR_CANDLE = () => FurnModels.SPR.candle(0);
  // だんろの ほのお（live で ないとき の とまった 絵）
  const fireSvg = (k) => {
    const { shape, FR } = k;
    return shape(FR(-12), [[-14, 12], [-10, 30], [-4, 22], [0, 40], [5, 24], [11, 32], [14, 12]], "#F59A45", 1.2) + shape(FR(-11.8), [[-8, 12], [-4, 24], [0, 30], [5, 22], [8, 12]], "#FFD66B", 0) + shape(FR(-11.6), [[-3, 12], [0, 20], [3, 12]], "#FFF5C4", 0);
  };

  // ================= ひがわり（ゆか）=================
  const TEAL = ["#63A9A3", "#4C8D88", "#86C4BD"], ROSE = ["#DE95A4", "#C17786", "#EDB4BF"];
  // ボタンどめ（ひしがたの みぞ と ボタン）
  const tufts = (k, m, x0, x1, z0, z1, nx, nz, groove, btn) => {
    let s = "";
    const xs = Array.from({ length: nx }, (_, i) => x0 + ((x1 - x0) * i) / (nx - 1)), zs = Array.from({ length: nz }, (_, j) => z0 + ((z1 - z0) * j) / (nz - 1));
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx; i++) {
      const off = j % 2 ? 0.5 : 0, xa = xs[0] + (xs[1] - xs[0]) * (i + off), xb = xs[0] + (xs[1] - xs[0]) * (i + 0.5 - off);
      if (xa > x1 + 0.1 || xb > x1 + 0.1 || xa < x0 - 0.1 || xb < x0 - 0.1) continue;
      s += k.lineOn(m, [[xa, zs[j]], [xb, zs[j + 1]]], groove, 1);
      const xc = xs[0] + (xs[1] - xs[0]) * (i - 0.5 + off * 2 - off);
      if (xc >= x0 - 0.1 && xc <= x1 + 0.1) s += k.lineOn(m, [[xa, zs[j]], [xa - (xb - xa), zs[j + 1]]], groove, 1);
    }
    zs.forEach((z, j) => xs.forEach((x0b, i) => { const x = x0b + (j % 2 ? (xs[1] - xs[0]) / 2 : 0); if (x <= x1 + 0.1) s += k.shape(m, ov(x, z, 1.5, 1.5, 10), btn, 0.8); }));
    return s;
  };
  M.hq_velvet_sofa = (k) => {
    // ビロードの ソファ（チェスターフィールド）: ボタンどめの せもたれ・まいた ひじかけ・ざぶとん 2つ・ピンクの まくら・きんの あし と ふち
    const { box, prism, shape, lineOn, FR, TP, cyl, egg, shadow } = k;
    let s = shadow(0.12, 2, 10);
    for (const [x, y] of [[-56, -54], [56, -54], [-56, -8], [56, -8]]) s += cyl(x, y, 0, 3.4, 7, GOLD[1], GOLD[0], 1.1);
    s += box(-62, -60, 124, 58, 7, 20, TEAL, 1.5) + lineOn(FR(-1.9), [[-62, 10], [62, 10]], GOLD[0], 1.8);
    s += prism(FR(-46), rr(-62, 27, 124, 46, 10), [0, -14, 0], TEAL[0], TEAL[1], 1.6);
    s += tufts(k, FR(-45.9), -52, 52, 34, 64, 9, 4, "#3F7C77", GOLD[0]);
    // ひじかけ（だいの うえ）。ひだりは ざぶとんの まえに・みぎは あとに 描く（ひだりの ひじかけの みぎの 面は ざぶとんの うしろ）
    const arm = (x) => {
      let t = prism(FR(-2), arch(x, x + 14, 27, 46, 54), [0, -58, 0], TEAL[0], TEAL[1], 1.5);
      const cx = x + 7, curl = []; for (let i = 0; i <= 26; i++) { const a = (i / 26) * TAU * 1.25, r = 5.2 * (1 - i / 34); curl.push([cx + Math.cos(a) * r, 44 + Math.sin(a) * r]); }
      t += lineOn(FR(-1.9), curl, GOLD[1], 1.3);
      for (const z of [31, 36]) t += shape(FR(-1.8), ov(cx, z, 1.2, 1.2, 10), GOLD[0], 0.8);
      return t;
    };
    s += arm(-62);
    s += prism(TP(31), rr(-48, -46, 47, 44, 8), [0, 0, -5], TEAL[2], TEAL[1], 1.3) + prism(TP(31), rr(1, -46, 47, 44, 8), [0, 0, -5], TEAL[2], TEAL[1], 1.3);
    s += lineOn(TP(31.1), [[-42, -3], [-6, -3]], "#A9D8D2", 1.2) + lineOn(TP(31.1), [[7, -3], [43, -3]], "#A9D8D2", 1.2);
    for (const [x, c] of [[-40, "#F2A7B8"], [40, "#F2A7B8"]]) s += egg(x, -30, 39, 6, 15, 6, c, 1.3) + lineOn(TP(39), [[x, -44], [x, -16]], "#FFD3DC", 1.1);
    s += arm(48);
    return s;
  };

  M.hq_marble_table = (k) => {
    // だいりせきの まるい テーブル: まるい だい・みぞの ある きんの はしら・しろい いたと はいいろの もよう・はなびん と ティーポットと カップ
    const { cyl, frustum, ball, egg, at, lineOn, TP, shadow, P, xy, shape, lathe } = k, cy = -43, SPR = FurnModels.SPR;
    let s = shadow(0.12, 18, 40);
    s += cyl(0, cy, 0, 21, 4, "#DCD7CE", "#F6F3EE", 1.4) + cyl(0, cy, 4, 15, 2.5, GOLD[1], GOLD[0], 1.2);
    s += frustum(0, cy, 6.5, 8.5, 50, 6, GOLD[0], GOLD[2], 1.4);
    for (const a of [-0.4, 0.3, 1.0, 1.7]) s += k.line([[Math.cos(a) * 8, cy + Math.sin(a) * 8, 8], [Math.cos(a) * 5.7, cy + Math.sin(a) * 5.7, 48]], GOLD[1], 0.9);
    s += ball(0, cy, 26, 6.2, GOLD[0], 1.2, 0.5);
    s += cyl(0, cy, 50, 41.5, 2.4, GOLD[1], GOLD[0], 1.3) + cyl(0, cy, 52.4, 40, 6, "#E3DED6", "#FAF8F4", 1.5);
    const vein = (pts) => lineOn(TP(58.45), pts, "#B8B4AE", 0.9);
    s += vein([[-30, cy - 12], [-16, cy - 8], [-8, cy - 16], [6, cy - 12]]) + vein([[-6, cy + 22], [6, cy + 14], [20, cy + 18], [30, cy + 8]]) + vein([[12, cy - 30], [18, cy - 20], [30, cy - 18]]);
    s += lineOn(TP(58.45), [[-24, cy + 6], [-12, cy + 10]], "#C9C5BF", 0.7);
    // はなびん・ティーポット・カップ（しょっきを ならべた ときは live で かたづける。js/table-ware.js）
    s += k.L(lathe(-14, cy - 12, [[4, 58.4], [6.4, 64], [5, 72], [3, 76], [4.2, 79]], "#9CC7E6", 1.2) + at(-14, cy - 12, 79, FurnModels.SPR.blooms(), 12, 16));
    s += k.L(at(14, cy + 2, 58.4, SPR.teapot("#FFFFFF", "#9CC7E6"), 18, 22));
    s += k.L(cyl(-6, cy + 16, 58.4, 6.4, 1.2, "#FFFFFF", "#FFFFFF", 1) + cyl(-6, cy + 16, 59.6, 3.4, 4, "#FFFFFF", "#F2A7B8", 1));
    return s;
  };

  // ランプの かさ（ひだ・きんの おび）
  const pleats = (k, cx, cy, z0, r0, z1, r1, col, n = 10) => {
    let s = "";
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 4 + (i / n) * Math.PI; s += k.line([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, z0 + 0.6], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, z1 - 0.6]], col, 0.9); }
    return s;
  };
  M.hq_gold_lamp = (k) => {
    // きんの スタンドライト: きんの だい（なんだんも）・ほそい はしら と たま・ひだの ある クリームの かさ・ガラスの しずく
    const { cyl, frustum, ball, rod, at, shadow, line } = k, cy = -23;
    let s = shadow(0.13, 8, 20);
    s += cyl(0, cy, 0, 17, 4, GOLD[1], GOLD[0], 1.4) + frustum(0, cy, 4, 13, 11, 7, GOLD[1], GOLD[2], 1.3) + ball(0, cy, 15, 5.4, GOLD[0], 1.2, 0.5);
    s += rod([[0, cy, 19], [0, cy, 98]], GOLD[0], 3.4);
    s += ball(0, cy, 50, 3.6, GOLD[0], 1.1, 0.5) + k.egg(0, cy, 80, 4.2, 4.2, 6, GOLD[0], 1.1);
    s += frustum(0, cy, 96, 23, 128, 13.5, "#FFF1D6", "#FFF8EA", 1.5) + pleats(k, 0, cy, 96, 23, 128, 13.5, "#E7CFA8", 12);
    // きんの ふち（したは てまえの はんぶん・うえは ぐるっと。まるい いたに すると かさが かくれる）
    const band = front(0, cy, 23.4, 96, 18), top = close(ov(0, cy, 13.6, 13.6, 28));
    s += k.line(band, INK, 4.4) + k.line(band, GOLD[0], 2.4) + k.lineOn(k.TP(128.2), top, INK, 3.8) + k.lineOn(k.TP(128.2), top, GOLD[0], 2);
    for (const [x, y, z] of front(0, cy, 23.4, 95, 8)) s += at(x, y, z, dropSvg(7), 4, 2);
    s += ball(0, cy, 133, 2.6, GOLD[0], 1, 0.5);
    return s;
  };

  // ピアノの かたち（うえから。てまえが けんばん）
  const PIANO = (() => {
    const bez = (p0, p1, p2, p3, n) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; });
    return [[-62, -16], [62, -16], [62, -30], ...bez([62, -30], [62, -64], [-4, -56], [-26, -90], 16), ...bez([-26, -90], [-34, -100], [-62, -100], [-62, -84], 8)];
  })();
  const LID = { hinge: -62, z: 66, a: 0.52 };
  const lidPt = ([x, y]) => [LID.hinge + (x - LID.hinge) * Math.cos(LID.a), y, LID.z + (x - LID.hinge) * Math.sin(LID.a)];
  M.hq_crystal_piano = (k) => {
    // ガラスの グランドピアノ: きんの あし 3ぼん と ペダル・すきとおる みずいろの からだ・きんの げん・けんばん・がくふだて・ひらいた ガラスの ふた と つっかえぼう
    const { box, frustum, ball, shape, lineOn, TP, FR, poly, line, rod, shadow, P, xy } = k;
    const GLASS = "#CBE9F5", GLASSD = "#9FD0E6", gl = 'fill-opacity=".78"';
    let s = k.shape(TP(0), PIANO.map(([x, y]) => [x * 0.9, y * 0.95]), INK, 0, 'fill-opacity=".1"');
    const legs = [[-40, -86], [-54, -24], [54, -24]];
    for (const [x, y] of legs.slice(0, 1)) s += frustum(x, y, 0, 3, 46, 4.6, GOLD[0], GOLD[2], 1.3) + ball(x, y, 1.5, 2.4, GOLD[1], 1, 0.4);
    s += extrude(k, PIANO, 46, 66, GLASS, "#F7EEDB", 1.5, gl);
    // げんと きんの わく（うえから 見える）
    s += shape(TP(66.1), PIANO.map(([x, y]) => [x * 0.86 - 4, y * 0.9 - 4]), "#EFD9A4", 1.1);
    for (let x = -50; x <= 40; x += 6) { const yb = x > 20 ? -36 - (x - 20) * 0.2 : x > -20 ? -52 - (20 - x) * 0.2 : -78; s += lineOn(TP(66.2), [[x, -22], [x, Math.min(-24, yb + (x + 50) * 0.32)]], "#C9A24E", 0.6); }
    s += lineOn(TP(66.25), [[-54, -26], [-20, -40], [10, -38], [36, -26]], GOLD[1], 1.6);
    for (const [x, y] of legs.slice(1)) s += frustum(x, y, 0, 3, 46, 4.6, GOLD[0], GOLD[2], 1.3) + ball(x, y, 1.5, 2.4, GOLD[1], 1, 0.4);
    // ペダル
    s += rod([[0, -20, 46], [0, -20, 8]], GOLD[0], 2.2) + box(-8, -22, 16, 4, 4, 4, GOLD, 1) + rod([[-4, -18, 6], [-4, -12, 6]], GOLD[0], 1.4) + rod([[4, -18, 6], [4, -12, 6]], GOLD[0], 1.4);
    // けんばん
    s += box(-60, -16, 120, 16, 50, 10, [GLASS, GLASSD, "#E6F5FA"], 1.4);
    s += box(-56, -15, 112, 12, 60, 2.4, ["#FFFFFF", "#E6E6E6", "#FFFFFF"], 1.1);
    for (let i = 1; i < 26; i++) s += lineOn(TP(62.45), [[-56 + i * (112 / 26), -15], [-56 + i * (112 / 26), -3]], "#C9C9C9", 0.6);
    for (let i = 0; i < 25; i++) if (![2, 6, 9, 13, 16, 20, 23].includes(i % 26) && i % 7 !== 2 && i % 7 !== 6) s += box(-56 + (i + 0.7) * (112 / 26), -15, 2.6, 7, 62.4, 1.6, ["#2E2F38", "#1F2028", "#4A4B56"], 0.5);
    s += box(-60, -16, 4, 16, 50, 14, [GLASS, GLASSD, "#E6F5FA"], 1.2) + box(56, -16, 4, 16, 50, 14, [GLASS, GLASSD, "#E6F5FA"], 1.2);
    // がくふだて
    s += poly([[-24, -19, 66], [24, -19, 66], [24, -24, 84], [-24, -24, 84]], GLASS, 1.2, gl) + lineOn(FR(-19.5), [[-16, 70], [16, 70]], "#FFFFFF", 0.9);
    // ふた（ひらいて いる）と つっかえぼう
    s += rod([[38, -40, 66], lidPt([38, -40])], GOLD[0], 1.6);
    const lid = PIANO.map(lidPt);
    s += `<polygon points="${lid.map((v) => xy(P(...v))).join(" ")}" fill="#DDF3FB" fill-opacity=".55" ${S(1.5)}/>`;
    s += line([lidPt([-40, -30]), lidPt([10, -70])], "#FFFFFF", 2, 'stroke-opacity=".8"') + line([lidPt([-20, -30]), lidPt([20, -56])], "#FFFFFF", 1.2, 'stroke-opacity=".7"');
    return s;
  };

  M.hq_canopy_bed = (k) => {
    // てんがいの ベッド: クリームの はしら 4ほん（きんの たま）・アーチの ヘッドボード・ほしの もようの かけぶとん・まくら・ハートの クッション・
    // うえの わくから さがる ラベンダーの フリル・はしらに むすんだ すける カーテン
    const { box, prism, shape, lineOn, FR, SD, TP, cyl, ball, egg, shadow } = k;
    const CR = ["#F6EEDD", "#DDD1B8", "#FFF9EE"], LAV = "#C9B6E0", LAVD = "#A993C7", SHEER = "#E9DEF6", NAVY = ["#5B6FA8", "#465889", "#7083BE"];
    const post = (x, y) => cyl(x, y, 0, 3.4, 150, CR[1], CR[2], 1.3) + cyl(x, y, 0, 4.6, 6, GOLD[1], GOLD[0], 1.1) + ball(x, y, 153, 3.6, GOLD[0], 1.1, 0.5);
    const curtain = (m, x0, dir) => {
      // dir: 1 は みぎへ ひろがる・-1 は ひだりへ（はしらの そばで むすぶ）
      const xs = (u) => x0 + dir * u;
      return shape(m, [[xs(0), 148], [xs(15), 148], [xs(7), 104], [xs(3), 72], [xs(9), 40], [xs(15), 4], [xs(0), 4]], SHEER, 1.2, 'fill-opacity=".85"') +
        lineOn(m, [[xs(9), 144], [xs(4), 104], [xs(2), 74]], "#D3C2EA", 1) + lineOn(m, [[xs(3), 70], [xs(7), 40], [xs(11), 8]], "#D3C2EA", 1) +
        shape(m, ov(xs(3), 72, 3.4, 2.4, 12), "#F2A7B8", 1) + lineOn(m, [[xs(3), 70], [xs(1), 62]], "#F2A7B8", 1.2) + lineOn(m, [[xs(3), 70], [xs(6), 61]], "#F2A7B8", 1.2);
    };
    const valance = (m, s0, s1) => shape(m, [[s0, 152], [s1, 152], ...scallop(s0, s1, 139, 4)], LAV, 1.3) + lineOn(m, [[s0 + 2, 148], [s1 - 2, 148]], "#E9DEF6", 1.1, 'stroke-dasharray="2 2.4"');
    let s = shadow(0.12, 2, 8);
    // おく（はしら・カーテン・フリル）
    s += post(-62, -96) + post(62, -96);
    s += curtain(FR(-96), -62, 1) + curtain(FR(-96), 62, -1);
    s += valance(FR(-96), -62, 62) + valance(SD(-62), -96, -4);
    s += box(-62, -98, 124, 4, 150, 3, CR, 1.1) + box(-64, -98, 4, 96, 150, 3, CR, 1.1);
    // ヘッドボード
    s += prism(FR(-90), arch(-58, 58, 14, 92, 112), [0, -6, 0], CR[0], CR[1], 1.6);
    s += lineOn(FR(-89.9), [...arch(-52, 52, 20, 88, 104).slice(2), [-52, 20]], GOLD[1], 1.3);
    for (const [x, z] of [[-30, 74], [0, 80], [30, 74], [-15, 60], [15, 60], [-40, 52], [40, 52]]) s += shape(FR(-89.8), ov(x, z, 1.6, 1.6, 10), GOLD[0], 0.8);
    // ベッド
    for (const [x, y] of [[-54, -88], [54, -88], [-54, -8], [54, -8]]) s += cyl(x, y, 0, 3, 12, GOLD[1], GOLD[0], 1);
    s += box(-58, -92, 116, 88, 12, 18, CR, 1.5);
    s += box(-56, -90, 112, 84, 30, 9, ["#FFFFFF", "#ECECEC", "#FFFFFF"], 1.3);
    for (const x of [-26, 26]) s += egg(x, -78, 45, 21, 9, 6.5, "#FFFFFF", 1.3) + lineOn(TP(45), [[x - 14, -78], [x + 14, -78]], "#ECE4F4", 1);
    s += prism(FR(-70), heart(0, 50, 8), [0, -3, 0], "#F2A7B8", "#D98A9C", 1.2);
    s += box(-57, -66, 114, 6, 39, 3, ["#FFFFFF", "#ECECEC", "#FFFFFF"], 1.1);
    s += prism(TP(42), rr(-57, -62, 114, 60, 6), [0, 0, -14], NAVY[2], NAVY[1], 1.5);
    for (const [x, y, r] of [[-40, -48, 3.4], [-18, -30, 2.6], [6, -50, 3.6], [28, -26, 3], [44, -46, 2.6], [-34, -16, 2.4], [14, -12, 2.8]]) s += shape(TP(42.1), star(x, y, r, r * 0.45), "#F5DE9C", 0.6);
    for (const [x, y] of [[-6, -36], [36, -12], [-48, -30], [20, -38]]) s += shape(TP(42.1), ov(x, y, 0.9, 0.9, 8), "#FFFFFF", 0);
    s += lineOn(FR(-1.9), [[-57, 34], [57, 34]], "#F5DE9C", 1.2, 'stroke-dasharray="3 3"');
    // てまえ（はしら・カーテン・フリル）
    s += post(-62, -4) + post(62, -4);
    s += box(60, -98, 4, 96, 150, 3, CR, 1.1) + box(-62, -6, 124, 4, 150, 3, CR, 1.1);
    s += valance(SD(64), -96, -4) + valance(FR(-2), -62, 62);
    s += curtain(FR(-2), -62, 1) + curtain(FR(-2), 62, -1);
    return s;
  };

  // ガラスの とびらの なか（ほんだな）: 74 × 64 の 2D の 絵
  const SHELF_IN = (() => {
    const book = (x, y, w, h, c) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="0.8" fill="${c}" ${S(0.9)}/><path d="M${x + 1},${y - h + 3} h${w - 2} M${x + 1},${y - 3} h${w - 2}" stroke="${shade(c, 0.4)}" stroke-width="0.8"/>`;
    const C = ["#C9675A", "#6F9EC9", "#E3B95C", "#7FB083", "#B48FC9", "#E8957A", "#5E7FA8"];
    let s = `<rect x="0" y="0" width="74" height="64" fill="#5C3F2C"/><rect x="2" y="2" width="70" height="60" fill="#6E4B34"/>`;
    for (const y of [22, 43]) s += `<rect x="1" y="${y}" width="72" height="3" fill="#8A6244" ${S(0.8)}/>`;
    let x = 4; for (let i = 0; i < 7; i++) { const w = 4 + (i % 3), h = 13 + ((i * 5) % 6); s += book(x, 22, w, h, C[i]); x += w + 0.6; }
    s += `<path d="M44,22 L44,19 M40,22 H48" stroke="#C9A24E" stroke-width="1.6"/><circle cx="44" cy="12.5" r="6.5" fill="#7FB3D9" ${S(1)}/><path d="M40,9 Q43,12 41,15 Q45,16 47,13 Q49,10 46,8 Z" fill="#8DB87A"/><path d="M37.5,12.5 A6.5,6.5 0 0 1 50.5,12.5" fill="none" stroke="#C9A24E" stroke-width="1"/>`;
    s += book(55, 22, 5, 16, "#C9675A") + book(61, 22, 4, 14, "#E3B95C") + `<rect x="66" y="9" width="4" height="13" rx="0.8" fill="#6F9EC9" transform="rotate(14 68 22)" ${S(0.9)}/>`;
    s += `<rect x="6" y="31" width="22" height="11" rx="5.5" fill="#DDF3FB" fill-opacity=".8" ${S(1)}/><rect x="27" y="34" width="4" height="5" rx="1" fill="#B98A5E" ${S(0.8)}/><path d="M10,39 H24 L22,41 H12 Z" fill="#B98A5E" ${S(0.7)}/><path d="M17,39 V32 M17,33 L22,37 H17 M17,34 L13,37 H17" fill="#FFFFFF" ${S(0.6)}/>`;
    x = 36; for (let i = 0; i < 5; i++) { const w = 5, h = 14 + ((i * 3) % 5); s += book(x, 43, w, h, C[(i + 3) % 7]); x += w + 0.6; }
    s += `<path d="M66,43 L64,36 H72 L70,43 Z" fill="#E48A6E" ${S(0.8)}/>${FurnModels.SPR.sprout().replace("<path", '<g transform="translate(68 36)"><path')}</g>`;
    s += `<rect x="5" y="52" width="26" height="9" rx="1" fill="#A9784F" ${S(0.8)}/><rect x="40" y="52" width="28" height="9" rx="1" fill="#A9784F" ${S(0.8)}/>`;
    // ガラスの とびら（わく・こうし・ひかり）
    s += `<path d="M3,3 H71 V61 H3 Z M37,3 V61" fill="none" stroke="#7A573C" stroke-width="3"/><path d="M3,3 H71 V61 H3 Z M37,3 V61" fill="none" ${S(0.8)}/>`;
    s += `<path d="M3,24 H71 M3,45 H71 M20,3 V61 M54,3 V61" stroke="#7A573C" stroke-width="1.4"/>`;
    s += `<rect x="3" y="3" width="68" height="58" fill="#FFFFFF" fill-opacity=".1"/><path d="M8,58 L22,6 M14,58 L26,14 M44,58 L58,6" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="34" cy="34" r="1.6" fill="#E9C873" ${S(0.6)}/><circle cx="40" cy="34" r="1.6" fill="#E9C873" ${S(0.6)}/>`;
    return s;
  })();
  M.hq_antique_shelf = (k) => {
    // アンティークの ほんだな: くるみいろの き・ほりものの ある アーチの かざり・ガラスの とびら（ほん・ちきゅうぎ・びんの ふね）・ひきだし 4つ・まるい あし
    const { box, prism, shape, lineOn, FR, onP, ball, shadow } = k;
    const WL = ["#9A6D4C", "#7A563B", "#B88A64"];
    let s = shadow(0.12, 2, 6);
    for (const [x, y] of [[-38, -34], [38, -34], [-38, -8], [38, -8]]) s += ball(x, y, 3, 3.6, "#7A563B", 1.1, 0.3);
    s += box(-43, -38, 86, 34, 6, 50, WL, 1.5);
    for (const [x, z] of [[-38, 34], [2, 34], [-38, 12], [2, 12]]) s += shape(FR(-3.9), rr(x, z, 36, 18, 2), "#A97C59", 1.2) + shape(FR(-3.8), ov(x + 18, z + 9, 4, 1.6, 12), GOLD[0], 1);
    s += box(-45, -40, 90, 38, 56, 4, ["#B88A64", "#9A6D4C", "#D0A47C"], 1.4);
    s += box(-41, -36, 82, 30, 60, 70, WL, 1.5);
    s += onP(FR(-5.9), -37, 127, 74, 64, SHELF_IN);
    s += box(-45, -40, 90, 38, 130, 5, ["#B88A64", "#9A6D4C", "#D0A47C"], 1.4);
    s += prism(FR(-4), arch(-36, 36, 135, 140, 152), [0, -30, 0], WL[0], WL[2], 1.5);
    const scroll = (dir) => { const c = []; for (let i = 0; i <= 18; i++) { const a = (i / 18) * TAU * 0.9, r = 4.6 * (1 - i / 26); c.push([dir * (12 + Math.cos(a) * r), 141 + Math.sin(a) * r]); } return c; };
    s += lineOn(FR(-3.9), scroll(1), GOLD[0], 1.3) + lineOn(FR(-3.9), scroll(-1), GOLD[0], 1.3);
    s += shape(FR(-3.8), [[0, 149], [-4, 142], [0, 138.5], [4, 142]], GOLD[0], 1) + lineOn(FR(-3.9), [[-20, 137.5], [20, 137.5]], "#D0A47C", 1.1);
    return s;
  };

  // とけいの もじばん（40 × 40。まんなかは 20,20）
  const DIAL = (live) => {
    let s = `<circle cx="20" cy="20" r="18.5" fill="#E9EDF2" ${S(1.4)}/><circle cx="20" cy="20" r="15.5" fill="#FFFDF8" ${S(1)}/>`;
    s += `<path d="M10,15 A10,10 0 0 1 30,15 Z" fill="#46578C" ${S(0.8)}/><circle cx="16" cy="12" r="3" fill="#F5D66B" ${S(0.6)}/><circle cx="17.4" cy="11.3" r="2.6" fill="#46578C"/>${[[23, 10], [26.5, 13], [21, 13.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="#FFF6CF"/>`).join("")}`;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = i % 3 ? 13.4 : 12.2; s += `<path d="M${f2(20 + Math.sin(a) * r0)},${f2(20 - Math.cos(a) * r0)} L${f2(20 + Math.sin(a) * 14.8)},${f2(20 - Math.cos(a) * 14.8)}" stroke="${INK}" stroke-width="${i % 3 ? 0.8 : 1.4}" stroke-linecap="round"/>`; }
    if (!live) s += `<path d="M20,20 L20,11 M20,20 L26,23" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    return s + `<circle cx="20" cy="20" r="1.3" fill="${INK}"/>`;
  };
  const CLOCK = { pivotZ: 96, len: 50, bob: 6.4, dialZ: 128, y: -6.8 };
  M.hq_silver_clock = (k) => {
    // ぎんの ふりこどけい: ぎんいろの だい と はこ・アーチの まどの なかの ふりこと おもり・つきの まどの ある もじばん・ほりものの やね と きんの たま 3つ
    const { box, prism, shape, lineOn, FR, onP, ball, cyl, shadow, L, rod } = k;
    let s = shadow(0.12, 2, 8);
    for (const [x, y] of [[-25, -37], [25, -37], [-25, -6], [25, -6]]) s += ball(x, y, 3, 3.2, SILVER[1], 1, 0.4);
    s += box(-29, -41, 58, 38, 4, 10, SILVER, 1.5) + box(-23, -37, 46, 30, 14, 90, SILVER, 1.5);
    s += shape(FR(-6.95), arch(-16, 16, 22, 86, 96), "#B3BCC6", 1.3) + shape(FR(-6.9), arch(-13, 13, 25, 84, 92), "#5F6F8C", 1.2);
    for (const x of [-8, 8]) s += rod([[x, -7, 92], [x, -7, x < 0 ? 70 : 76]], "#C9CED6", 0.8) + shape(FR(-6.85), rr(x - 2.6, x < 0 ? 56 : 62, 5.2, 14, 2), GOLD[0], 1);
    s += L(rod([[0, CLOCK.y, CLOCK.pivotZ], [0, CLOCK.y, CLOCK.pivotZ - CLOCK.len]], GOLD[0], 1.4) + shape(FR(-6.8), ov(0, CLOCK.pivotZ - CLOCK.len, CLOCK.bob, CLOCK.bob, 20), GOLD[0], 1.2) + shape(FR(-6.75), ov(-1.8, CLOCK.pivotZ - CLOCK.len + 2, 2.4, 1.6, 10), "#FFF3C4", 0));
    s += lineOn(FR(-6.8), [[-11, 80], [-6, 30]], "#FFFFFF", 1.6, 'stroke-opacity=".3"');
    s += box(-26, -40, 52, 36, 104, 5, SILVER, 1.3) + box(-25, -39, 50, 34, 109, 46, SILVER, 1.5);
    s += onP(FR(-4.9), -20, 148, 40, 40, DIAL(k.opts.live));
    s += lineOn(FR(-4.9), [[-23, 112], [23, 112]], "#9EA8B4", 1) + lineOn(FR(-4.9), [[-23, 152], [23, 152]], "#9EA8B4", 1);
    s += box(-28, -41, 56, 38, 155, 5, SILVER, 1.4) + prism(FR(-5), arch(-22, 22, 160, 163, 170), [0, -30, 0], SILVER[0], SILVER[2], 1.4);
    s += ball(-22, -22, 165, 3, GOLD[0], 1.1, 0.5) + ball(22, -22, 165, 3, GOLD[0], 1.1, 0.5) + ball(0, -22, 172, 3.4, GOLD[0], 1.1, 0.5);
    return s;
  };

  M.hq_velvet_chair = (k) => {
    // ビロードの アームチェア: ばらいろの ビロード・はねの ある たかい せもたれ（ボタンどめ）・まいた ひじかけ・クッション・まるい あしおき（ボタンどめ）・きんの あし と びょう
    // かさねる じゅん: だい → せもたれ → ひだりの ひじかけ → ざぶとん → みぎの ひじかけ → あしおき
    const { box, prism, shape, lineOn, FR, TP, cyl, shadow } = k;
    let s = shadow(0.12, 2, 10);
    for (const [x, y] of [[-32, -60], [8, -60], [-32, -20], [8, -20]]) s += cyl(x, y, 0, 2.6, 7, GOLD[1], GOLD[0], 1);
    s += box(-36, -62, 48, 44, 7, 20, ROSE, 1.5);
    s += prism(FR(-50), arch(-36, 12, 27, 72, 88), [0, -12, 0], ROSE[0], ROSE[1], 1.6) + tufts(k, FR(-49.9), -26, 2, 40, 70, 4, 3, "#B8697A", GOLD[0]);
    const arm = (x) => {
      let t = prism(FR(-18), arch(x, x + 9, 27, 44, 49), [0, -32, 0], ROSE[0], ROSE[1], 1.5);
      for (let z = 30; z < 44; z += 5) t += shape(FR(-17.9), ov(x + 4.5, z, 0.9, 0.9, 8), GOLD[0], 0);
      return t + lineOn(FR(-17.9), [[x + 1.5, 28], [x + 7.5, 28]], GOLD[1], 1);
    };
    s += arm(-36);
    s += prism(TP(33), rr(-27, -50, 30, 31, 7), [0, 0, -6], ROSE[2], ROSE[1], 1.3);
    s += prism(FR(-42), rr(-22, 34, 20, 16, 5), [0, -4, 0], "#FFF1DC", "#E9D8BA", 1.2) + lineOn(FR(-41.9), [[-18, 42], [-6, 42]], "#F2A7B8", 1.2);
    s += arm(3);
    s += cyl(24, -14, 3, 12.5, 15, ROSE[1], ROSE[2], 1.4);
    for (const [x, y] of [[16, -8], [32, -8], [24, -24]]) s += cyl(x, y, 0, 1.8, 3, GOLD[1], GOLD[0], 0.9);
    for (const a of [0, 1.57, 3.14, 4.71]) s += lineOn(TP(18.1), [[24, -14], [24 + Math.cos(a) * 9, -14 + Math.sin(a) * 9]], "#B8697A", 1);
    s += shape(TP(18.15), ov(24, -14, 1.5, 1.5, 10), GOLD[0], 0.8);
    return s;
  };

  // テレビの がめん（ばんぐみは live で canvas に 描く）
  const SCREEN = { x0: -47, x1: 47, y: -20.4, z0: 47, z1: 99 };
  M.hq_home_theater = (k) => {
    // おおきな シアターテレビ: たかい スピーカー 2つ（まるい スピーカー）・くるみいろの だい（ガラスの まんなかに ゲームと ディスク）・サウンドバー・うすい おおきな がめん・ちいさな はちうえ
    const { box, shape, lineOn, FR, at, shadow, lg, cyl } = k;
    const SPK = ["#5A606E", "#464B57", "#727A8A"], WL = ["#9A6D4C", "#7A563B", "#B88A64"];
    let s = shadow(0.12, 2, 6);
    for (const x0 of [-74, 58]) {
      s += box(x0, -40, 16, 30, 0, 100, SPK, 1.5);
      for (const [z, r] of [[22, 6.4], [44, 6.4], [66, 3.4]]) s += shape(FR(-9.9), ov(x0 + 8, z, r, r, 20), "#3A3E48", 1.1) + shape(FR(-9.85), ov(x0 + 8, z, r * 0.55, r * 0.55, 16), "#8A92A2", 0.9) + shape(FR(-9.8), ov(x0 + 8, z, r * 0.2, r * 0.2, 10), "#2E3038", 0);
      s += lineOn(FR(-9.9), [[x0 + 2, 82], [x0 + 14, 82]], "#8A92A2", 1) + lineOn(FR(-9.9), [[x0 + 2, 88], [x0 + 14, 88]], "#8A92A2", 1);
    }
    s += at(66, -25, 100, FurnModels.SPR.monstera(), 14, 22);
    for (const [x, y] of [[-52, -40], [52, -40], [-52, -8], [52, -8]]) s += cyl(x, y, 0, 2.4, 4, "#5A3F2C", "#7A563B", 0.9);
    s += box(-56, -44, 112, 40, 4, 30, WL, 1.5);
    s += shape(FR(-3.9), rr(-52, 8, 32, 22, 2), "#A97C59", 1.2) + shape(FR(-3.9), rr(20, 8, 32, 22, 2), "#A97C59", 1.2);
    s += shape(FR(-3.85), ov(-24, 19, 1.6, 1.6, 10), GOLD[0], 0.8) + shape(FR(-3.85), ov(24, 19, 1.6, 1.6, 10), GOLD[0], 0.8);
    s += shape(FR(-3.9), rr(-17, 8, 34, 22, 2), "#3F3530", 1.2) + shape(FR(-3.85), rr(-13, 10, 16, 6, 1.5), "#E9EEF2", 0.9) + shape(FR(-3.85), rr(6, 10, 8, 14, 1), "#9CC7E6", 0.8) + shape(FR(-3.85), rr(3.6, 10, 2, 14, 0.5), "#F2A7B8", 0.6);
    s += lineOn(FR(-3.8), [[-16, 28], [-2, 12]], "#FFFFFF", 1.4, 'stroke-opacity=".3"');
    s += box(-12, -30, 24, 12, 34, 3, ["#3A3E48", "#2E3038", "#4A4F5C"], 1.2) + box(-3, -26, 6, 4, 37, 10, ["#3A3E48", "#2E3038", "#4A4F5C"], 1.1);
    s += box(-36, -12, 72, 7, 34, 6, SPK, 1.2) + lineOn(FR(-5.1), [[-32, 37], [32, 37]], "#8A92A2", 1, 'stroke-dasharray="1.2 1.6"');
    s += box(-50, -24, 100, 3.6, 44, 58, ["#2E3038", "#25272E", "#3A3D46"], 1.5);
    s += shape(FR(SCREEN.y), rect(SCREEN.x0, SCREEN.z0, SCREEN.x1 - SCREEN.x0, SCREEN.z1 - SCREEN.z0), lg([[0, "#3B4A6B"], [1, "#1E2436"]]), 1);
    s += lineOn(FR(SCREEN.y + 0.05), [[-40, 52], [-16, 94]], "#FFFFFF", 3, 'stroke-opacity=".12"') + lineOn(FR(SCREEN.y + 0.05), [[-28, 52], [-8, 86]], "#FFFFFF", 1.6, 'stroke-opacity=".1"');
    s += shape(FR(-20.3), ov(0, 45.4, 1, 0.6, 8), "#7FE0A0", 0);
    s += box(30, -38, 12, 5, 34, 1.6, ["#4A4F5C", "#3A3E48", "#6A7080"], 0.9);
    return s;
  };

  M.hq_wave_sculpture = (k) => {
    // ガラスの なみの オブジェ: しろい だいりせきの だい・くるりと まいた みずいろの ガラスの なみ（しぶき・あわ）・きんの まるい だいざ
    const { box, cyl, at, shadow, lg, rg } = k;
    const MB = ["#ECE9E3", "#D2CEC6", "#F8F6F2"];
    let s = shadow(0.12, 6, 6);
    s += box(-20, -48, 40, 40, 0, 6, MB, 1.4) + box(-16, -44, 32, 32, 6, 56, MB, 1.5) + box(-19, -47, 38, 38, 62, 5, MB, 1.4);
    s += k.lineOn(k.FR(-11.9), [[-10, 20], [-4, 34], [-8, 46]], "#C9C5BF", 0.8) + k.lineOn(k.SD(16.1), [[-40, 30], [-30, 40], [-20, 36]], "#C9C5BF", 0.8);
    s += cyl(0, -28, 67, 11, 3, GOLD[1], GOLD[0], 1.2);
    const g1 = lg([[0, "#E2F6FC"], [0.5, "#8FD0EA"], [1, "#4D9CC9"]], 0, 0, 1, 1), g2 = rg([[0, "#FFFFFF", 0.95], [1, "#CDEFF8", 0.4]]);
    const wave = `<path d="M-20,0 C-24,-16 -18,-36 -2,-46 C12,-54 28,-48 30,-34 C32,-22 22,-16 14,-20 C8,-23 9,-31 15,-31 C19,-31 20,-27 18,-25 C26,-28 24,-40 12,-42 C-2,-44 -10,-30 -8,-16 C-7,-8 -2,-3 4,0 Z" fill="${g1}" fill-opacity=".9" ${S(1.6)}/>` +
      `<path d="M-14,-6 C-17,-18 -12,-32 0,-39 M-6,-4 C-8,-14 -4,-26 6,-32" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>` +
      `<circle cx="24" cy="-44" r="3" fill="${g2}" ${S(0.9)}/><circle cx="31" cy="-40" r="2" fill="${g2}" ${S(0.8)}/><circle cx="28" cy="-49" r="1.6" fill="${g2}" ${S(0.7)}/>` +
      `<circle cx="-12" cy="-22" r="4.6" fill="${g2}" ${S(1)}/><circle cx="-13.4" cy="-23.6" r="1.4" fill="#FFFFFF"/>`;
    s += at(0, -28, 69.5, `<g transform="scale(1.15) translate(8 0)">${wave}</g>`, 40, 64);
    return s;
  };

  for (const [id, fn] of Object.entries(M)) if (FURN_INDEX[id]) FurnModels.register(id, fn);

  // ================= かべかざり（0..w × 0..h の 2D の 絵。はんてんは Art.furnSvg が する）=================
  // グラデーションの id は よぶ たびに ちがう（おなじ ページに いくつ ならんでも かさならない）
  let wg = 0;
  const grad = (kind, stops, a = {}) => {
    const id = "fcw" + ++wg, st = stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ""}/>`).join("");
    const at = Object.entries(a).map(([k2, v]) => `${k2}="${v}"`).join(" ");
    return [`url(#${id})`, kind === "r" ? `<radialGradient id="${id}" ${at}>${st}</radialGradient>` : `<linearGradient id="${id}" ${at}>${st}</linearGradient>`];
  };
  const P2 = (ps) => ps.map(([x, y], i) => (i ? "L" : "M") + f2(x) + "," + f2(y)).join(" ") + " Z";
  const leafW = (x, y, r, c, sc = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(r)}) scale(${sc})"><path d="M0,0 C-3.4,-2 -4,-7 0,-10 C4,-7 3.4,-2 0,0 Z" fill="${c}" ${S(0.9)}/><path d="M0,-1 V-8.6" stroke="${shade(c, 0.35)}" stroke-width="0.7"/></g>`;
  const WALL_ART = {};

  WALL_ART.hq_gold_mirror = () => {
    // きんぶちの かがみ: なみなみの きんの ふち・みずいろの ガラス（ひかりの すじ）・うえに ばら・したに かいがら・よこに うずまき
    const [g, gd] = grad("l", [[0, "#F6FCFF"], [0.55, "#CFE8F3"], [1, "#A3CDE3"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
    const fr = Array.from({ length: 120 }, (_, i) => { const t = (i / 120) * TAU, b = 1 + 0.045 * Math.cos(t * 18); return [28 + Math.cos(t) * 25.5 * b, 43 + Math.sin(t) * 33 * b]; });
    let s = `<defs>${gd}</defs><path d="${P2(fr)}" fill="#E9C873" ${S(1.8)}/>`;
    s += `<ellipse cx="28" cy="43" rx="21.5" ry="29.5" fill="#C9A24E" ${S(1.2)}/><ellipse cx="28" cy="43" rx="18.5" ry="26.5" fill="${g}" ${S(1.2)}/>`;
    s += `<path d="M16,40 L29,22 M19,49 L36,26 M33,62 L40,52" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"/>`;
    for (const [x, dir] of [[3.5, 1], [52.5, -1]]) s += `<path d="M${x},36 q${dir * 4},-3 ${dir * 4},2 q0,4 ${-dir * 3},3 q${-dir * 2},0 ${-dir * 1},-2" fill="none" stroke="#B9974A" stroke-width="1.6" stroke-linecap="round"/><path d="M${x},50 q${dir * 4},3 ${dir * 4},-2 q0,-4 ${-dir * 3},-3" fill="none" stroke="#B9974A" stroke-width="1.6" stroke-linecap="round"/>`;
    s += leafW(22, 9, -60, "#8DB87A") + leafW(34, 9, 60, "#8DB87A");
    s += `<circle cx="28" cy="7.5" r="5.6" fill="#F2A7B8" ${S(1.2)}/><path d="M28,7.5 m-2.6,0 a2.6,2.6 0 1 1 2.6,2.4 M27,5 q2.6,-1 3.4,1.6" fill="none" stroke="#D97F94" stroke-width="1" stroke-linecap="round"/>`;
    s += `<path d="M21,77 Q28,71 35,77 Q28,80.5 21,77 Z" fill="#F5DE9C" ${S(1.1)}/><path d="M28,73 V79 M24.4,74.6 L26.4,78.6 M31.6,74.6 L29.6,78.6" stroke="#B9974A" stroke-width="0.8"/>`;
    return s;
  };

  // ひまわりの おかの え: えの なか（9..87 × 9..63）。くもと ふうしゃの はねは live の とき canvas が うごかす
  const ART = { x0: 9, y0: 9, x1: 87, y1: 63, mill: [68.5, 31.5] };
  const millBlades = (cx, cy, a) => Array.from({ length: 4 }, (_, i) => { const t = a + (i * Math.PI) / 2, c = Math.cos(t), s2 = Math.sin(t); const p = (u, v) => [cx + c * u - s2 * v, cy + s2 * u + c * v]; return `<path d="${P2([p(1, -1.2), p(12, -2.6), p(12, 2.6), p(1, 1.2)])}" fill="#FFF8EA" ${S(0.9)}/><path d="M${f2(p(3, 0)[0])},${f2(p(3, 0)[1])} L${f2(p(11, 0)[0])},${f2(p(11, 0)[1])}" stroke="#C9B48F" stroke-width="0.7"/>`; }).join("");
  const cloudW = (x, y, sc = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) scale(${sc})"><path d="M-9,3 Q-11,-3 -5,-3 Q-4,-8 1,-7 Q6,-9 8,-3 Q12,-2 10,3 Z" fill="#FFFFFF" ${S(0.9)}/></g>`;
  WALL_ART.hq_sunflower_art = (o = {}) => {
    // ひまわりの おかの え: きんの がくぶち（すみの はな かざり）・そら・おひさま・くも・ききゅう・おか・ふうしゃ・ひまわり
    const [sky, skyd] = grad("l", [[0, "#9CD3F2"], [0.7, "#D8EFF7"], [1, "#FFF3C9"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    const { x0, y0, x1, y1, mill } = ART;
    let s = `<defs>${skyd}</defs><rect x="1" y="1" width="94" height="70" rx="3" fill="#E3BE68" ${S(2)}/><rect x="5.5" y="5.5" width="85" height="61" rx="1.5" fill="#C9A24E" ${S(1.1)}/>`;
    s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${sky}" ${S(1)}/>`;
    s += `<circle cx="22" cy="21" r="9.5" fill="#FFF3B0" fill-opacity=".55"/><circle cx="22" cy="21" r="6" fill="#FFE07A" ${S(1)}/>`;
    if (!o.live) s += cloudW(42, 18) + cloudW(76, 22, 0.8);
    s += `<path d="M47,23 m-5.4,0 a5.4,5.8 0 1 1 10.8,0 q0,3.6 -3.2,5.8 h-4.4 q-3.2,-2.2 -3.2,-5.8 Z" fill="#F28C8C" ${S(1)}/><path d="M47,17.2 V28.8 M43.2,19.4 Q45.2,23.6 44.6,28.4 M50.8,19.4 Q48.8,23.6 49.4,28.4" fill="none" stroke="#FFE07A" stroke-width="1.4"/><path d="M45,28.8 L45.6,31 M49,28.8 L48.4,31" stroke="${INK}" stroke-width="0.7"/><rect x="45" y="31" width="4" height="2.6" rx="0.6" fill="#C98A52" ${S(0.7)}/>`;
    s += `<path d="M${x0},45 Q28,35 48,43 Q66,36 ${x1},43 V${y1} H${x0} Z" fill="#A8D392" ${S(1)}/>`;
    s += `<path d="M64.5,48 L66.5,30 H70.5 L72.5,48 Z" fill="#FFF8EA" ${S(1)}/><path d="M65.6,30.6 L68.5,26 L71.4,30.6 Z" fill="#E07A5F" ${S(0.9)}/><rect x="67.2" y="42.6" width="2.6" height="5.4" rx="1.2" fill="#B98A5E" ${S(0.6)}/>`;
    if (!o.live) s += millBlades(mill[0], mill[1], 0.5) + `<circle cx="${mill[0]}" cy="${mill[1]}" r="1.4" fill="#E07A5F" ${S(0.7)}/>`;
    s += `<path d="M${x0},53 Q40,44 ${x1},52 V${y1} H${x0} Z" fill="#82BA6E" ${S(1)}/>`;
    for (const [x, y, r] of [[14, 51, 3.4], [21, 54, 3.8], [29, 52, 3.2], [36, 56, 3.6], [44, 54, 3], [80, 52, 3.2], [74, 56, 3.4], [56, 57, 2.8]]) {
      s += `<path d="M${x},${y + r} V${y1 - 0.5}" stroke="#5E8F4E" stroke-width="1.2"/>`;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; s += `<ellipse cx="${f2(x + Math.cos(a) * r * 0.8)}" cy="${f2(y + Math.sin(a) * r * 0.8)}" rx="${f2(r * 0.46)}" ry="${f2(r * 0.24)}" transform="rotate(${f2((a * 180) / Math.PI)} ${f2(x + Math.cos(a) * r * 0.8)} ${f2(y + Math.sin(a) * r * 0.8)})" fill="#FFD23F" stroke="#C98A1E" stroke-width="0.4"/>`; }
      s += `<circle cx="${x}" cy="${y}" r="${f2(r * 0.5)}" fill="#8A5A2B" ${S(0.6)}/>`;
    }
    s += `<path d="M30,15 q1.6,-1.4 3.2,0 q1.6,-1.4 3.2,0 M58,13 q1.3,-1.2 2.6,0 q1.3,-1.2 2.6,0" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="round"/>`;
    for (const [x, y] of [[4, 4], [92, 4], [4, 68], [92, 68]]) s += `<circle cx="${x}" cy="${y}" r="3" fill="#F5DE9C" ${S(1)}/><circle cx="${x}" cy="${y}" r="1.1" fill="#F2A7B8"/>`;
    return s;
  };

  // ガラスの かべランプ: かさの まんなか（ひかる ところ）
  const SCONCE = [[13, 21], [55, 21]];
  const tulipW = (x, y, c) => `<path d="M${x - 8},${y - 15} L${x - 4},${y - 11} L${x},${y - 16} L${x + 4},${y - 11} L${x + 8},${y - 15} Q${x + 9},${y - 3} ${x},${y} Q${x - 9},${y - 3} ${x - 8},${y - 15} Z" fill="${c}" fill-opacity=".92" ${S(1.2)}/><path d="M${x - 4},${y - 11} Q${x - 4.6},${y - 4} ${x - 1},${y - 1} M${x + 4},${y - 11} Q${x + 4.6},${y - 4} ${x + 1},${y - 1}" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="0.9"/><path d="M${x - 5.6},${y - 8} Q${x - 6},${y - 4} ${x - 4},${y - 2.4}" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>`;
  WALL_ART.hq_wall_sconce = () => {
    // ガラスの かべランプ: ほりものの ある しんちゅうの いた・Sの じの うで 2ほん・チューリップの ガラスの かさ・ガラスの しずく
    let s = `<path d="M34,24 Q42,26 42,38 Q42,52 34,58 Q26,52 26,38 Q26,26 34,24 Z" fill="#E9C873" ${S(1.6)}/><path d="M34,29 Q38.5,31 38.5,38 Q38.5,48 34,52 Q29.5,48 29.5,38 Q29.5,31 34,29 Z" fill="#F5DE9C" ${S(0.9)}/>`;
    s += `<circle cx="34" cy="21" r="2.6" fill="#E9C873" ${S(1)}/><path d="M34,58 L32.4,62 L34,64 L35.6,62 Z" fill="#E6F6FB" ${S(0.8)}/>`;
    for (const [dir, x] of [[-1, 13], [1, 55]]) {
      const d = `M${34 + dir * 4},44 C${34 + dir * 14},48 ${x - dir * 2},40 ${x},32`;
      s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#E9C873" stroke-width="3" stroke-linecap="round"/>`;
      s += `<ellipse cx="${x}" cy="32" rx="5.4" ry="2" fill="#C9A24E" ${S(1)}/><path d="M${x},34 L${x - 1.6},37.4 L${x},39.6 L${x + 1.6},37.4 Z" fill="#E6F6FB" ${S(0.8)}/>`;
    }
    s += tulipW(13, 31, "#F7C6D0") + tulipW(55, 31, "#F7C6D0");
    for (const [x, y] of SCONCE) s += `<circle cx="${x}" cy="${y + 4}" r="2" fill="#FFF3C4"/>`;
    s += `<circle cx="34" cy="39" r="2.4" fill="#F2A7B8" ${S(0.8)}/>`;
    return s;
  };

  WALL_ART.hq_knight_shield = () => {
    // きしの たて: うしろに こうさ した はたの ぼう（あお と あかの さんかくの はた）・きんの ふち・あおと クリームの もよう・ライオンの かお・ハート・びょう
    let s = "";
    for (const [x0, y0, x1, y1] of [[8, 78, 60, 6], [64, 78, 12, 6]]) s += `<path d="M${x0},${y0} L${x1},${y1}" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M${x0},${y0} L${x1},${y1}" stroke="#B98A5E" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="2.6" fill="#E9C873" ${S(1)}/>`;
    s += `<path d="M58,10 Q67,12 71,17 Q63,18 56,21 Z" fill="#E07A7A" ${S(1.1)}/><path d="M14,10 Q5,12 1,17 Q9,18 16,21 Z" fill="#7FA7D9" ${S(1.1)}/>`;
    s += `<path d="M13,12 H59 V40 C59,61 45,73 36,79 C27,73 13,61 13,40 Z" fill="#E9C873" ${S(2)}/>`;
    s += `<path d="M17,16 H55 V40 C55,58 43,69 36,74.6 C29,69 17,58 17,40 Z" fill="#7FA7D9" ${S(1.1)}/><path d="M36,16 H55 V40 C55,58 43,69 36,74.6 Z" fill="#FFF1D6"/>`;
    s += `<path d="M36,16 V74.6" stroke="${INK}" stroke-width="1"/>`;
    s += `<path d="${heartPath(26, 25, 0.75)}" fill="#FFFFFF" ${S(1)}/><path d="${heartPath(46, 25, 0.75)}" fill="#E07A7A" ${S(1)}/>`;
    const mane = Array.from({ length: 36 }, (_, i) => { const t = (i / 36) * TAU, r = 12.4 + (i % 2 ? 1.6 : 0); return [36 + Math.cos(t) * r, 46 + Math.sin(t) * r]; });
    s += `<path d="${P2(mane)}" fill="#E9A54E" ${S(1.2)}/><circle cx="29" cy="37" r="2.6" fill="#F5C76E" ${S(0.9)}/><circle cx="43" cy="37" r="2.6" fill="#F5C76E" ${S(0.9)}/>`;
    s += `<circle cx="36" cy="47" r="8.4" fill="#F5C76E" ${S(1.2)}/><circle cx="32.8" cy="45" r="1.1" fill="${INK}"/><circle cx="39.2" cy="45" r="1.1" fill="${INK}"/>`;
    s += `<path d="M34.6,48 H37.4 L36,49.6 Z" fill="#8A5A2B" ${S(0.6)}/><path d="M36,49.6 V50.6 M33.6,50.8 Q34.8,52.2 36,50.6 Q37.2,52.2 38.4,50.8" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="round"/><circle cx="31" cy="48.6" r="1.4" fill="#F2A7B8" fill-opacity=".8"/><circle cx="41" cy="48.6" r="1.4" fill="#F2A7B8" fill-opacity=".8"/>`;
    for (const [x, y] of [[15, 14], [57, 14], [15, 40], [57, 40], [24, 64], [48, 64], [36, 77]]) s += `<circle cx="${x}" cy="${y}" r="1.3" fill="#FFF6CF" ${S(0.6)}/>`;
    return s;
  };

  // しかの め（ウインクは canvas が うえに 描く）
  const DEER = { eyeL: [29, 39], eyeR: [43, 39], face: "#D59A64" };
  WALL_ART.hq_plush_deer = () => {
    // しかの ぬいぐるみ かざり: きの まるい いた・フェルトの つの・みみ・やさしい かお（しろい ぽちぽち）・はなかんむり・リボン
    let s = `<ellipse cx="36" cy="44" rx="31" ry="30" fill="#E2B98A" ${S(2)}/><ellipse cx="36" cy="44" rx="26.5" ry="25.5" fill="#EDCB9F" stroke="#C99A69" stroke-width="1.2"/>`;
    s += `<path d="M18,30 Q24,44 20,60 M54,30 Q48,44 52,60" fill="none" stroke="#D9AF7F" stroke-width="0.9"/>`;
    for (const dir of [-1, 1]) {
      const x = 36 + dir * 9, a = `M${x},26 L${x + dir * 5},14 L${x + dir * 11},8 M${x + dir * 5},14 L${x + dir * 3},4 M${x + dir * 8},10.6 L${x + dir * 14},12`;
      s += `<path d="${a}" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${a}" fill="none" stroke="#FFF1D6" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<ellipse cx="${36 + dir * 17}" cy="33" rx="7" ry="3.6" transform="rotate(${dir * 24} ${36 + dir * 17} 33)" fill="#C98A5A" ${S(1.2)}/><ellipse cx="${36 + dir * 17.6}" cy="33" rx="4.4" ry="1.8" transform="rotate(${dir * 24} ${36 + dir * 17.6} 33)" fill="#F2A7B8"/>`;
    }
    s += `<ellipse cx="36" cy="42" rx="14.6" ry="17" fill="${DEER.face}" ${S(1.8)}/>`;
    for (const [x, y, r] of [[31, 29, 1.4], [40, 30, 1.2], [36, 26.4, 1.1], [44, 26.6, 0.9], [28, 33, 0.9]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6E8"/>`;
    s += `<ellipse cx="36" cy="51" rx="9.4" ry="7" fill="#F5DDBA" ${S(1.2)}/><ellipse cx="36" cy="47.4" rx="3.8" ry="2.6" fill="#5C3F2C" ${S(0.9)}/><ellipse cx="34.8" cy="46.6" rx="1.2" ry="0.7" fill="#FFFFFF" fill-opacity=".8"/>`;
    s += `<path d="M36,50 V52 M33.4,52.4 Q34.7,54 36,52.2 Q37.3,54 38.6,52.4" fill="none" stroke="${INK}" stroke-width="0.9" stroke-linecap="round"/>`;
    for (const [x, y] of [DEER.eyeL, DEER.eyeR]) s += `<circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/><circle cx="${x - 0.8}" cy="${y - 0.8}" r="0.8" fill="#FFFFFF"/>`;
    s += `<ellipse cx="25.6" cy="46" rx="2.4" ry="1.6" fill="#F2A7B8" fill-opacity=".85"/><ellipse cx="46.4" cy="46" rx="2.4" ry="1.6" fill="#F2A7B8" fill-opacity=".85"/>`;
    for (const [x, y, r] of [[24, 27, -40], [48, 27, 40]]) s += leafW(x, y, r, "#8DB87A", 0.8);
    for (const [x, y, c] of [[26.5, 26, "#F2A7B8"], [31, 23.6, "#FFFFFF"], [36, 22.8, "#F7D56A"], [41, 23.6, "#C9B6E0"], [45.5, 26, "#F2A7B8"]]) s += flowerSvg(x, y, 1.9, c, "#F7D56A", 0.6);
    s += `<path d="M36,63 Q30,58 27,62 Q29,67 36,64 Q43,67 45,62 Q42,58 36,63 Z" fill="#F2A7B8" ${S(1)}/><circle cx="36" cy="63.4" r="1.8" fill="#EE8FA6" ${S(0.8)}/><path d="M34.6,64.8 L32,70 M37.4,64.8 L40,70" stroke="#EE8FA6" stroke-width="1.6" stroke-linecap="round"/>`;
    return s;
  };

  // もりの はとどけい: もじばんの まんなか・ふりこの ねもと・とびら
  const CUCKOO = { dial: [28, 55], pivot: [28, 70], door: [28, 39] };
  const cuckooDoor = (open) => open ? `<path d="M23,44 V39 Q28,33 33,39 V44 Z" fill="#3B2A20" ${S(1)}/><path d="M23,44 V39 Q20.6,37 19,39.6 V45 Z" fill="#7A4E33" ${S(0.9)}/>` : `<path d="M23,44 V39 Q28,33 33,39 V44 Z" fill="#7A4E33" ${S(1)}/><path d="M28,35.6 V44" stroke="#5C3F2C" stroke-width="0.8"/><circle cx="30.4" cy="40.6" r="0.7" fill="#E9C873"/>`;
  WALL_ART.hq_cuckoo_clock = (o = {}) => {
    // もりの はとどけい: はっぱの かざりの やね・やねの うえの ことり・とびら（ことりが でる）・もじばん・どんぐりの かざり・はっぱの ふりこ・まつぼっくりの おもり
    let s = `<path d="M2,31 L28,5 L54,31 L50,34 L28,12 L6,34 Z" fill="#7A4E33" ${S(1.6)}/><path d="M6,34 L28,12 L50,34 Z" fill="#A87450" ${S(1)}/>`;
    for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; s += leafW(4 + u * 22, 32 - u * 24, -45 + (i % 2) * 20, i % 2 ? "#8DB87A" : "#6FA062", 0.85) + leafW(52 - u * 22, 32 - u * 24, 45 - (i % 2) * 20, i % 2 ? "#6FA062" : "#8DB87A", 0.85); }
    s += `<path d="M24,5 Q24,0.5 28,0.6 Q31.4,0.8 31.6,3.6 L34,3 L31.8,5.4 Q30,7.6 26,6.8 Z" fill="#F2A7B8" ${S(0.9)}/><circle cx="29.4" cy="2.8" r="0.6" fill="${INK}"/>`;
    s += `<rect x="8" y="31" width="40" height="38" rx="2" fill="#C98A52" ${S(1.6)}/><rect x="11" y="34" width="34" height="32" rx="1.5" fill="none" stroke="#A87450" stroke-width="1.1"/>`;
    if (!o.live) s += cuckooDoor(false);
    s += `<circle cx="${CUCKOO.dial[0]}" cy="${CUCKOO.dial[1]}" r="10.2" fill="#FFF8E7" ${S(1.4)}/>`;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; s += `<circle cx="${f2(28 + Math.sin(a) * 8)}" cy="${f2(55 - Math.cos(a) * 8)}" r="${i % 3 ? 0.5 : 0.9}" fill="${INK}"/>`; }
    if (!o.live) s += `<path d="M28,55 L28,49 M28,55 L32.4,57.4" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
    s += `<circle cx="28" cy="55" r="1.1" fill="${INK}"/>`;
    s += leafW(15, 72, -120, "#6FA062", 0.9) + leafW(41, 72, 120, "#6FA062", 0.9) + `<path d="M24,71 Q28,74.6 32,71 Z" fill="#C98A4E" ${S(0.9)}/><ellipse cx="28" cy="70.4" rx="4.6" ry="1.8" fill="#7A4E33" ${S(0.8)}/>`;
    if (!o.live) s += `<path d="M28,70 V83" stroke="#B38F3F" stroke-width="1.3"/>` + leafW(28, 83, 180, "#8DB87A", 1);
    const cone = (x, y) => `<path d="M${x},${y - 5} C${x + 3.6},${y - 4} ${x + 3.8},${y + 3} ${x},${y + 5} C${x - 3.8},${y + 3} ${x - 3.6},${y - 4} ${x},${y - 5} Z" fill="#8B5A33" ${S(1.1)}/><path d="M${x - 2.4},${y - 2} L${x + 2.4},${y + 1} M${x + 2.4},${y - 2} L${x - 2.4},${y + 1} M${x - 2.6},${y + 1.6} L${x + 2},${y + 3.6}" stroke="#C98A52" stroke-width="0.8"/>`;
    s += `<path d="M18,69 V83 M38,69 V79" stroke="#8C7A5A" stroke-width="1" stroke-dasharray="1.3 1"/>${cone(18, 88)}${cone(38, 84)}`;
    return s;
  };

  WALL_ART.hq_castle_tapestry = () => {
    // おしろの タペストリー: しんちゅうの ぼう・よぞらいろの ぬの（きんの ふち）・みかづき と ほし・クリームの おしろ（ピンクの やね・はた）・おか・ふさ
    const bottom = [[60, 84], [52, 91], [44, 84], [36, 91], [28, 84], [20, 91], [12, 84], [6, 88]];
    let s = `<path d="M3,6 H63" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M3,6 H63" stroke="#E9C873" stroke-width="2.6" stroke-linecap="round"/><circle cx="2.6" cy="6" r="2.6" fill="#E9C873" ${S(1)}/><circle cx="63.4" cy="6" r="2.6" fill="#E9C873" ${S(1)}/>`;
    for (const x of [12, 24, 36, 48, 56]) s += `<rect x="${x - 2}" y="4.4" width="4" height="7" rx="1" fill="#2F3D6B" ${S(0.8)}/>`;
    s += `<path d="${P2([[6, 9], [60, 9], ...bottom])}" fill="#3D4F86" ${S(1.8)}/>`;
    s += `<path d="${P2([[9.5, 12.5], [56.5, 12.5], [56.5, 82], [52, 86.6], [44, 80.6], [36, 86.6], [28, 80.6], [20, 86.6], [12, 80.6], [9.5, 83.4]])}" fill="none" stroke="#E9C873" stroke-width="1" stroke-dasharray="2.4 1.8"/>`;
    s += `<path d="${P2(moon(46, 22, 6).map(([x, y]) => [x, 44 - y]))}" fill="#F5DE9C" ${S(1)}/>`;
    for (const [x, y, r] of [[16, 18, 2.4], [26, 26, 1.8], [36, 16, 2], [54, 34, 1.6], [14, 34, 1.4]]) s += `<path d="${starPath(x, y, r, r * 0.45)}" fill="#FFF1B8" ${S(0.6)}/>`;
    for (const [x, y] of [[22, 14], [31, 21], [50, 13], [40, 30], [19, 25]]) s += `<circle cx="${x}" cy="${y}" r="0.7" fill="#FFFFFF"/>`;
    s += `<path d="M9,74 Q24,64 36,70 Q48,64 57,72 V82 L52,86.6 L44,80.6 L36,86.6 L28,80.6 L20,86.6 L12,80.6 L9,83.4 Z" fill="#5E8F6E" ${S(1)}/>`;
    const tower = (x, w, top, roofH, flagC, foot = 70) => `<rect x="${x}" y="${top}" width="${w}" height="${foot - top}" fill="#FFF1D6" ${S(1.1)}/><path d="M${x - 1.4},${top} L${x + w / 2},${top - roofH} L${x + w + 1.4},${top} Z" fill="#F2A7B8" ${S(1.1)}/><path d="M${x + w / 2},${top - roofH} V${top - roofH - 6}" stroke="${INK}" stroke-width="0.9"/><path d="M${x + w / 2},${top - roofH - 6} L${x + w / 2 + 5},${top - roofH - 4.4} L${x + w / 2},${top - roofH - 2.8} Z" fill="${flagC}" ${S(0.7)}/><rect x="${x + w / 2 - 1.3}" y="${top + 6}" width="2.6" height="4" rx="1.3" fill="#FFE07A" ${S(0.6)}/>`;
    s += tower(15, 8, 48, 9, "#7FA7D9") + tower(43, 8, 48, 9, "#E07A7A");
    s += `<path d="M23,70 V44 H25 V41 H28 V44 H31 V41 H34 V44 H37 V41 H40 V44 H43 V70 Z" fill="#FFF8EA" ${S(1.2)}/>`;
    s += `<path d="M29.6,70 V63 Q33,58.4 36.4,63 V70 Z" fill="#B98A5E" ${S(0.9)}/>` + tower(28.5, 9, 36, 10, "#F7D56A", 44);
    for (const [x, y] of [[26.4, 50], [37.6, 50]]) s += `<rect x="${x}" y="${y}" width="2.4" height="3.6" rx="1.2" fill="#FFE07A" ${S(0.6)}/>`;
    for (const [x, y] of bottom.filter((_, i) => i % 2 === 1 || i === 7)) s += `<path d="M${x},${y} L${x - 1.6},${y + 3} Q${x},${y + 6} ${x + 1.6},${y + 3} Z" fill="#E9C873" ${S(0.7)}/>`;
    return s;
  };

  // ハートの ネオン: くだの みち（canvas でも おなじ みちを 描く）
  const NEON = { heart: heartPath(40, 30, 2.6), stars: [starPath(15, 15, 5, 2), starPath(65, 44, 4, 1.6)], wave: "M14,47 Q19,43 24,47 T34,47" };
  WALL_ART.hq_heart_neon = (o = {}) => {
    // ハートの ネオン: よぞらいろの いた（ねじ 4つ）・ピンクの ハート・きいろの ほし・みずいろの なみ（live の ときは canvas が ひかる くだを 描く）
    let s = `<rect x="3" y="3" width="74" height="52" rx="8" fill="#2E3352" ${S(2)}/><rect x="6.5" y="6.5" width="67" height="45" rx="6" fill="none" stroke="#454C78" stroke-width="1.2"/>`;
    for (const [x, y] of [[9, 9], [71, 9], [9, 49], [71, 49]]) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="#C7CED8" ${S(0.6)}/>`;
    if (!o.live) {
      const tube = (d, c, w = 3) => `<path d="${d}" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += tube(NEON.heart, "#FF8FB8") + NEON.stars.map((d) => tube(d, "#FFE07A", 2)).join("") + tube(NEON.wave, "#8FE3F2", 2);
    }
    return s;
  };

  WALL_ART.hq_wall_shelf = () => {
    // かざりの かべだな: ほりものの ささえ・2だんの いた・ティーポットと カップ・3人の しゃしん・つるの しょくぶつ・ほん・キャンディの びん・ことりの おきもの・ちいさな とけい
    const SPR = FurnModels.SPR;
    let s = "";
    for (const [y, x] of [[30, 12], [30, 74], [60, 12], [60, 74]]) s += `<path d="M${x - 3},${y} H${x + 3} V${y + 2} Q${x + 3},${y + 6} ${x},${y + 4} Q${x - 1.4},${y + 3} ${x - 3},${y + 2} Z" fill="#A87450" ${S(1)}/>`;
    for (const y of [26, 56]) s += `<rect x="3" y="${y}" width="80" height="4.4" rx="1.2" fill="#C98A52" ${S(1.4)}/><path d="M5,${y + 1.2} H81" stroke="#E2B98A" stroke-width="0.9"/>`;
    s += `<g transform="translate(19 26) scale(0.95)">${SPR.teapot("#FFFFFF", "#F2A7B8")}</g>`;
    for (const x of [33, 40]) s += `<path d="M${x - 3},20 H${x + 3} L${x + 2.4},26 H${x - 2.4} Z" fill="#FFFFFF" ${S(0.9)}/><path d="M${x + 3},21.4 Q${x + 5.4},22.4 ${x + 2.8},24.4" fill="none" ${S(0.8)}/><circle cx="${x}" cy="23" r="0.9" fill="#F2A7B8"/>`;
    s += `<rect x="49" y="10" width="15" height="16" rx="1" fill="#E9C873" ${S(1.1)}/><rect x="51.4" y="12.4" width="10.2" height="11.2" fill="#CFE8F3"/>${[[53.6, "#FFFFFF"], [56.5, "#F7D56A"], [59.4, "#AEB6BD"]].map(([x, c]) => `<circle cx="${x}" cy="19" r="1.8" fill="${c}" stroke="${INK}" stroke-width="0.5"/>`).join("")}<path d="M51.4,23.6 Q56.5,21.4 61.6,23.6" fill="#9ED08C"/>`;
    s += `<path d="M69,26 L68,19 H79 L78,26 Z" fill="#E48A6E" ${S(1)}/><rect x="67.4" y="17.6" width="12.2" height="2.4" rx="1" fill="#EFA58C" ${S(0.8)}/>`;
    s += `<g transform="translate(73.5 18) scale(0.6)">${SPR.monstera()}</g><g transform="translate(77 29.5) scale(0.5)">${SPR.ivy()}</g>`;
    const C = ["#C9675A", "#6F9EC9", "#E3B95C", "#7FB083"];
    C.forEach((c, i) => { const x = 7 + i * 5, h = 15 + (i % 2) * 3; s += `<rect x="${x}" y="${56 - h}" width="4.4" height="${h}" rx="0.8" fill="${c}" ${S(0.9)}/><path d="M${x + 1},${56 - h + 3} h2.4" stroke="${shade(c, 0.4)}" stroke-width="0.8"/>`; });
    s += `<rect x="27" y="44" width="4" height="12" rx="0.8" fill="#B48FC9" transform="rotate(16 29 56)" ${S(0.9)}/>`;
    s += `<path d="M38,56 V43 Q38,40.4 41,40.4 H47 Q50,40.4 50,43 V56 Z" fill="#E6F6FB" fill-opacity=".85" ${S(1)}/><rect x="39.4" y="38.4" width="9.2" height="2.6" rx="1" fill="#F2A7B8" ${S(0.8)}/>`;
    for (const [x, y, c] of [[41, 52, "#F2A7B8"], [44.4, 53, "#F7D56A"], [47, 50.6, "#9CC7E6"], [42.4, 48, "#B9E59A"], [46, 46.6, "#F2A7B8"], [40.6, 44.6, "#F7D56A"]]) s += `<circle cx="${x}" cy="${y}" r="1.5" fill="${c}" ${S(0.5)}/>`;
    s += `<path d="M56,56 Q55,49 60,48 Q61,44.6 64.4,46 Q66,48 64,49.4 L67,50.4 L64,51.6 Q64,56 60,56 Z" fill="#9CC7E6" ${S(1)}/><circle cx="63" cy="47.6" r="0.6" fill="${INK}"/>`;
    s += `<rect x="70" y="45" width="10" height="11" rx="2.4" fill="#F5DE9C" ${S(1)}/><circle cx="75" cy="50.4" r="3.4" fill="#FFFDF6" ${S(0.8)}/><path d="M75,50.4 V48.2 M75,50.4 L76.6,51.4" stroke="${INK}" stroke-width="0.7" stroke-linecap="round"/>`;
    return s;
  };

  // きんいろの リース: すずの ばしょ（live の とき canvas が ゆらす）
  const WREATH = { c: [33, 30], r: 21, bells: [[27.5, 57], [38.5, 57]] };
  const bellW = (x, y, a = 0) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2((a * 180) / Math.PI)})"><path d="M0,-2 V0" stroke="#B9974A" stroke-width="1"/><path d="M-4,7 Q-4.4,1 0,0 Q4.4,1 4,7 Z" fill="#E9C873" ${S(1)}/><rect x="-4.8" y="6.4" width="9.6" height="1.6" rx="0.8" fill="#C9A24E" ${S(0.7)}/><circle cx="0" cy="8.8" r="1.2" fill="#B9974A" ${S(0.6)}/><path d="M-1.8,2.4 Q-2.2,4.4 -1.6,6" fill="none" stroke="#FFF6CF" stroke-width="0.9"/></g>`;
  WALL_ART.hq_gold_wreath = (o = {}) => {
    // きんいろの リース: きんと みどりの はっぱの わ・まつぼっくり・あかい み・しろい はな・きんの リボン・すず 2つ
    const [cx, cy] = WREATH.c, R = WREATH.r;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#8C7A5A" stroke-width="5"/>`;
    for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU, rr2 = R + (i % 2 ? 3.4 : -3.4); s += leafW(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, (a * 180) / Math.PI + (i % 2 ? 150 : 30), i % 3 === 0 ? "#9DB98A" : i % 3 === 1 ? "#E9C873" : "#C9DDB0", 0.95); }
    const at2 = (deg, rad = R) => [cx + Math.cos((deg * Math.PI) / 180) * rad, cy + Math.sin((deg * Math.PI) / 180) * rad];
    for (const d of [-150, -30, 150, 30]) { const [x, y] = at2(d); s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="3.4" ry="4.4" transform="rotate(${d + 90} ${f2(x)} ${f2(y)})" fill="#8B5A33" ${S(0.9)}/><path d="M${f2(x - 2.2)},${f2(y - 1)} l4.4,1.4 M${f2(x - 2.2)},${f2(y + 1.4)} l4.4,1.2" stroke="#C98A52" stroke-width="0.7"/>`; }
    for (const d of [-90, 0, 180, -60, -120]) { const [x, y] = at2(d, R + 1); s += [[0, 0], [2.4, 1.4], [-1.2, 2.4]].map(([dx, dy]) => `<circle cx="${f2(x + dx)}" cy="${f2(y + dy)}" r="1.6" fill="#E0574F" ${S(0.6)}/>`).join(""); }
    for (const d of [-115, -65, 60, 120]) { const [x, y] = at2(d, R - 1); s += flowerSvg(x, y, 2.2, "#FFFFFF", "#F7D56A", 0.6); }
    s += `<path d="M${cx},${cy + R - 2} Q${cx - 11},${cy + R - 9} ${cx - 12},${cy + R} Q${cx - 6},${cy + R + 4} ${cx},${cy + R - 2} Q${cx + 6},${cy + R + 4} ${cx + 12},${cy + R} Q${cx + 11},${cy + R - 9} ${cx},${cy + R - 2} Z" fill="#E9C873" ${S(1.2)}/>`;
    s += `<path d="M${cx - 1.6},${cy + R} L${cx - 6},${cy + R + 13} L${cx - 3},${cy + R + 11.4} L${cx - 1.4},${cy + R + 14} Z M${cx + 1.6},${cy + R} L${cx + 6},${cy + R + 13} L${cx + 3},${cy + R + 11.4} L${cx + 1.4},${cy + R + 14} Z" fill="#E9C873" ${S(1)}/><circle cx="${cx}" cy="${cy + R - 1}" r="2.6" fill="#F5DE9C" ${S(1)}/>`;
    if (!o.live) s += WREATH.bells.map(([x, y]) => bellW(x, y)).join("");
    return s;
  };

  // ================= さわる（FurnLive。道具は ShopRewardArt.liveKit）=================
  const { mapper, since, say, tone, glow, lampOn, ink, FXS, simple, lamp } = ShopRewardArt.liveKit;
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
  // かべの 家具: 絵の ざひょうで 描ける ように ctx を かえる・絵の 点 → 画面・FXS 用（P(x, _, z) は 絵の (x, たかさ − z)）
  const wallTf = (ctx, sc, it) => {
    const f = FURN_INDEX[it.id], p = sc.wallPoint(it, it.x - f.w / 2, it.y - f.h / 2), sign = it.wallSide === "left" ? -1 : 1, s = sc.s;
    ctx.transform(sign * HomeDesign.A * s, HomeDesign.B * s, 0, s, p.x, p.y);
    if (it.flip) { ctx.translate(f.w, 0); ctx.scale(-1, 1); }
  };
  const wallAt = (sc, it, x, y) => { const f = FURN_INDEX[it.id]; return sc.wallPoint(it, it.x - f.w / 2 + (it.flip ? f.w - x : x), it.y - f.h / 2 + y); };
  const wallMapper = (sc, it) => { const f = FURN_INDEX[it.id], P = (x, _y, z = 0) => wallAt(sc, it, x, f.h - z); P.s = sc.s; return P; };
  // かべの 家具の ちかくに いる 1人が ひとこと（FurnLive の かべの ばしょと おなじ）
  const sayWall = (sc, it, line, fx = "heart") => {
    const a = { x: it.wallSide === "left" ? 40 : it.x, y: it.wallSide === "left" ? ROOM.WALL + it.x : ROOM.WALL + 40 };
    const c = sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };
  const wallSimple = (id, lines, fx, pt, notes = [523, 659, 784]) => FurnLive.register(id, {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone(notes); sayWall(sc, it, lines[st.n % lines.length], fx === "heart" ? "heart" : "note"); },
    draw(ctx, sc, it, r, st) { if (since(st) < 2.4) FXS[fx](ctx, wallMapper(sc, it), st, ...pt); },
  });
  // ながい おと（ピアノ・とけいの かね）
  const melody = (notes, step = 0.3, type = "triangle", vol = 0.14, dur = 0.26) => {
    if (typeof Sound !== "undefined" && Sound.ctx && Save.d?.settings?.se) notes.forEach((n, i) => { if (n) Sound.tone(Sound.seGain, { f: typeof n === "number" ? n : Sound.freq(n), t: i * step, dur, type, vol, a: 0.005, r: 0.5 }); });
    return notes.length * step;
  };
  // 小さな 絵（canvas）
  const starC = (ctx, x, y, r, col, a = 1) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ink(ctx, Math.max(0.6, r * 0.22)); ctx.stroke(); ctx.restore();
  };
  const flameC = (ctx, x, y, w, h, col) => {
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w * 1.2, y - h * 0.45, x - w * 0.2, y - h * 0.6, x, y - h); ctx.bezierCurveTo(x + w * 0.2, y - h * 0.6, x + w * 1.2, y - h * 0.45, x + w, y); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  };
  const leafC = (ctx, x, y, s, rot, col, a = 1) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const p = (i / 40) * TAU, lobe = Math.abs(Math.cos(2.5 * p)), q = (0.4 + 0.6 * lobe ** 1.3) * (0.8 + 0.2 * Math.cos(p)) * 5; ctx.lineTo(Math.sin(p) * q, -Math.cos(p) * q); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.8 / s); ctx.stroke(); ctx.restore();
  };
  // かべ・ゆかの 面に はる（o: 左上・u: 右・v: 下。0..W × 0..H）
  const onQuad = (ctx, o, u, v, W, H) => ctx.transform((u.x - o.x) / W, (u.y - o.y) / W, (v.x - o.x) / H, (v.y - o.y) / H, o.x, o.y);
  // てまえ向きの 面（y = y0）に (s, -t) で 描ける ように
  const onFront = (ctx, P, y0) => { const o = P(0, y0, 0), a = P(1, y0, 0), b = P(0, y0, -1); ctx.transform(a.x - o.x, a.y - o.y, b.x - o.x, b.y - o.y, o.x, o.y); };

  // ---- あき・ふゆ ----
  lamp("aw_acorn_lamp", { pts: [[0, -23, 30, 26]], rgb: "255,186,104", lines: ["どんぐりが ぽっと ひかったよ", "どんぐり おやすみ"], rr: 26, big: 100 });
  FurnLive.register("aw_maple_rug", {
    // もみじの ラグ: タップで もみじと いちょうが ひらひら おちて くる
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 587, 523, 440], 0.12, "sine", 0.08); say(sc, it, ["おちばが ひらひら", "あきの いろだね", "もみじ きれい！"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st);
      if (k > 3) return;
      const P = mapper(sc, it, r), F = UP(0, -P.d / 2);
      for (let i = 0; i < 9; i++) {
        const u = Math.min(1, Math.max(0, (k - i * 0.12) / 2.2)); if (u <= 0) continue;
        const [x, y] = F(-48 + ((i * 29) % 96), -30 + ((i * 17) % 60)), q = P(x + Math.sin(u * 7 + i) * 8, y, 70 * (1 - u) + 3);
        leafC(ctx, q.x, q.y, P.s * (0.9 + (i % 3) * 0.2), u * 5 + i, ["#E25A3C", "#F08A4B", "#F6CF52"][i % 3], u < 0.85 ? 1 : (1 - u) / 0.15);
      }
    },
  });
  FurnLive.register("aw_snow_tree", {
    // ゆきげしきの ツリー: ライトが ずっと ひかる（タップで ひかりかたが かわる・すずの おと・てっぺんの ほしが きらり）
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([1319, 1319, 1319, null, 1319, 1319, 1319], 0.14, "sine", 0.07, 0.12); say(sc, it, ["ライトの いろが かわったよ", "きらきら ひかって きれい", "ゆきが ふって きそう"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = G.t, pat = (st.n || 0) % 3;
      BULBS.forEach(([x, y, z, c], i) => {
        const lit = pat === 0 ? 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7) : pat === 1 ? ((Math.floor(t * 6) + i) % 4 === 0 ? 1 : 0.3) : 0.8 + 0.2 * Math.sin(t * 2 + i);
        const col = pat === 2 ? BULB_COLS[(i + Math.floor(t * 2)) % 4] : BULB_COLS[c], q = P(x, y, z), rad = 1.85 * P.s;
        ctx.fillStyle = col; ink(ctx, Math.max(0.6, 0.9 * P.s)); ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, q.x, q.y, 7 * P.s, rgbOf(col), 0.55 * lit); ctx.restore();
      });
      if (since(st) < 2.4) FXS.spark(ctx, P, st, 0, TREE_CY, 134);
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), q = P(0, TREE_CY, 70); glow(ctx, q.x, q.y, 90 * P.s, "255,224,150", 0.2); },
  }, true);
  simple("aw_knit_sofa", ["ぬくぬくの ソファ", "けいとが ふわふわ", "ぽんぽん かわいい"], "heart", [0, -30, 56]);

  // ---- クイズの だんろ ----
  FurnLive.register("quiz_starry_fireplace", {
    // ほのおが ずっと ゆれて、ほしの ひのこが のぼる。タップで ほしの はなび
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([784, 988, 1175, 1568], 0.09, "sine", 0.09, 0.2); say(sc, it, ["ぱちぱち… ほしが まいあがった！", "あったかいね", "ほしぞらの だんろ きれい"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = G.t, s = P.s;
      ctx.save(); onFront(ctx, P, -12);
      for (const [x, hh, w, col, ph] of [[-8, 26, 7, "#F59A45", 0], [7, 29, 7.5, "#F59A45", 1.3], [-1, 36, 8.5, "#F7B24B", 2.1], [-2, 22, 5, "#FFD66B", 0.7], [3, 16, 3, "#FFF5C4", 1.7]]) flameC(ctx, x, -12, w, hh + Math.sin(t * 7 + ph) * 4 + Math.sin(t * 11 + ph * 2) * 1.6, col);
      ctx.restore();
      for (let i = 0; i < 6; i++) { const u = (t * 0.32 + i / 6) % 1, q = P(-14 + ((i * 37) % 28) + Math.sin(u * 6 + i) * 3, -6, 30 + u * 72); starC(ctx, q.x, q.y, (1.4 + 1.6 * (1 - u)) * s, "#FFE07A", Math.min(1, (1 - u) * 1.6)); }
      const k = since(st);
      if (k < 1.6) for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, d = 10 + k * 34, q = P(Math.cos(a) * d * 0.9, -4, 60 + Math.sin(a) * d * 0.7); starC(ctx, q.x, q.y, 3 * s, i % 2 ? "#FFFFFF" : "#F5DE9C", 1 - k / 1.6); }
      for (const [x, ph] of [[-46, 0], [46, 1.7]]) { const q = P(x, -24, 110), f = 1 + Math.sin(t * 9 + ph) * 0.15; flameC(ctx, q.x, q.y, 2.3 * s, 9 * f * s, "#F7B24B"); flameC(ctx, q.x, q.y - 1 * s, 1.1 * s, 5 * f * s, "#FFF3B0"); }
      const night = typeof DayTint !== "undefined" && DayTint.isNight(), m = P(0, -6, 30);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, m.x, m.y, 30 * s, "255,170,90", night ? 0.45 : 0.25); ctx.restore();
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), q = P(0, -10, 30); glow(ctx, q.x, q.y, 130 * P.s, "255,160,90", 0.28); },
  }, true);

  // ---- ひがわり（ゆか）----
  simple("hq_velvet_sofa", ["ふかふかで ねむく なりそう", "ボタンが きらきら", "おうさまの ソファ みたい"], "heart", [0, -34, 80]);
  simple("hq_marble_table", ["おちゃかいを しよう！", "いい かおりの おちゃ", "おはなが きれいだね"], "puff", [18, -40, 76]);
  lamp("hq_gold_lamp", { pts: [[0, -23, 112, 32], [0, -23, 94, 20]], rgb: "255,214,140", lines: ["きんの ランプ ぴかっ！", "ランプ おやすみ"], big: 130 });
  const PIANO_TUNES = [
    { name: "きらきらぼし", notes: ["C5", "C5", "G5", "G5", "A5", "A5", "G5", null, "F5", "F5", "E5", "E5", "D5", "D5", "C5"] },
    { name: "メリーさんの ひつじ", notes: ["E5", "D5", "C5", "D5", "E5", "E5", "E5", null, "D5", "D5", "D5", null, "E5", "G5", "G5"] },
    { name: "かえるの うた", notes: ["C5", "D5", "E5", "F5", "E5", "D5", "C5", null, "E5", "F5", "G5", "A5", "G5", "F5", "E5"] },
    { name: "よろこびの うた", notes: ["E5", "E5", "F5", "G5", "G5", "F5", "E5", "D5", "C5", "C5", "D5", "E5", "E5", "D5", "D5"] },
  ];
  FurnLive.register("hq_crystal_piano", {
    // タップで 1きょく ひく（4きょく じゅんばん）。おんぷと ガラスの きらきら
    tap(sc, it, st) { if (since(st) < (st.len || 0)) return; const song = PIANO_TUNES[(st.n || 0) % PIANO_TUNES.length]; st.n = (st.n || 0) + 1; st.t0 = G.t; st.song = song; st.len = melody(song.notes, 0.28, "triangle", 0.15, 0.3) + 0.3; say(sc, it, `「${song.name}」を ひいたよ♪`, "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > (st.len || 0)) return;
      const P = mapper(sc, it, r);
      for (let j = 0; j < 3; j++) { const a = (k * 0.7 + j / 3) % 1, q = P(-30 + j * 26, -30, 90 + a * 50); FX.note(ctx, q.x + Math.sin(a * 6 + j) * 6 * P.s, q.y); }
      if (k < 1.2) FXS.spark(ctx, P, st, 20, -60, 100);
    },
  });
  simple("hq_canopy_bed", ["おひめさまの ベッドだ", "ほしの ふとん ふかふか", "いい ゆめが みられそう"], "spark", [0, -50, 120]);
  simple("hq_antique_shelf", ["どの ほんを よもうかな", "ちきゅうぎが ある！", "びんの なかに ふねが いる"], "spark", [0, -20, 110]);
  FurnLive.register("hq_silver_clock", {
    // ふりこが ゆれて、はりは ほんとうの じこく。タップで かねが なって じこくを おしえて くれる
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([659, 831, 740, 494, null, 494, 740, 831, 659], 0.32, "sine", 0.12, 0.5); const h = U.hourNow() % 12 || 12, m = new Date().getMinutes(); say(sc, it, `いまは ${h}じ ${m}ふん だよ`, "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), now = new Date(), h = now.getHours() % 12, m = now.getMinutes();
      const a = Math.sin(G.t * Math.PI) * 0.22, L = CLOCK.len;
      ctx.save(); onFront(ctx, P, CLOCK.y);
      ctx.translate(0, -CLOCK.pivotZ); ctx.rotate(a);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L); ctx.stroke();
      ctx.strokeStyle = GOLD[0]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L); ctx.stroke();
      ctx.fillStyle = GOLD[0]; ink(ctx, 1.2); ctx.beginPath(); ctx.arc(0, L, CLOCK.bob, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFF3C4"; ctx.beginPath(); ctx.ellipse(-1.8, L - 2, 2.4, 1.6, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.save(); onFront(ctx, P, -4.85); ctx.translate(0, -CLOCK.dialZ);
      const ha = ((h + m / 60) / 12) * TAU, ma = (m / 60) * TAU;
      ink(ctx, 1.6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ha) * 7.4, -Math.cos(ha) * 7.4); ctx.stroke();
      ink(ctx, 1.1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ma) * 11, -Math.cos(ma) * 11); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 1.3, 0, TAU); ctx.fill();
      ctx.restore();
      if (since(st) < 2) FXS.note(ctx, P, st, 0, -20, 176);
    },
  }, true);
  simple("hq_velvet_chair", ["すわりごこち ばつぐん！", "あしおきも ふかふか", "ほんを よむのに ぴったり"], "heart", [-12, -40, 92]);
  const SHOWS = ["ほしぞらの えいが だよ", "おさかなの ばんぐみ！", "どうぶつの ダンス！", "にじと ききゅうの たび"];
  FurnLive.register("hq_home_theater", {
    // タップで ばんぐみが かわる（4つ → おしまい）
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; st.ch = st.n % (SHOWS.length + 1); tone(st.ch ? [523, 784, 1047] : [784, 523], 0.07, "square", 0.04); say(sc, it, st.ch ? SHOWS[st.ch - 1] : "テレビ おしまい", st.ch ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const ch = st.ch || 0; if (!ch) return;
      const P = mapper(sc, it, r), o = P(SCREEN.x0, SCREEN.y, SCREEN.z1), u = P(SCREEN.x1, SCREEN.y, SCREEN.z1), v = P(SCREEN.x0, SCREEN.y, SCREEN.z0), W = SCREEN.x1 - SCREEN.x0, Hh = SCREEN.z1 - SCREEN.z0, t = G.t;
      ctx.save(); onQuad(ctx, o, u, v, W, Hh); ctx.beginPath(); ctx.rect(0, 0, W, Hh); ctx.clip();
      ctx.globalAlpha = Math.min(1, since(st) * 4);
      if (ch === 1) {
        const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#1E2A55"); g.addColorStop(1, "#4B4F8F"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
        for (let i = 0; i < 18; i++) starC(ctx, (i * 37) % W, (i * 23) % (Hh - 10) + 4, 1.4 + (i % 3) * 0.6, "#FFF6CF", 0.5 + 0.5 * Math.sin(t * 3 + i));
        ctx.fillStyle = "#F5DE9C"; ink(ctx, 0.9); ctx.beginPath(); ctx.arc(74, 14, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#1E2A55"; ctx.beginPath(); ctx.arc(77.5, 12, 6, 0, TAU); ctx.fill();
        const sx = ((t * 40) % (W + 40)) - 20; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, 8 + sx * 0.12); ctx.lineTo(sx - 12, 8 + (sx - 12) * 0.12 - 3); ctx.stroke();
      } else if (ch === 2) {
        const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#7FD0EC"); g.addColorStop(1, "#2E78A8"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
        for (let i = 0; i < 4; i++) { const dir = i % 2 ? -1 : 1, x = (((t * (12 + i * 4) * dir + i * 31) % (W + 20)) + W + 20) % (W + 20) - 10, y = 12 + i * 10 + Math.sin(t * 2 + i) * 2; ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.fillStyle = ["#F29A5B", "#F7D56A", "#F2A7B8", "#B9E59A"][i]; ink(ctx, 0.8); ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-10, -3.4); ctx.lineTo(-10, 3.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(3, -0.8, 0.8, 0, TAU); ctx.fill(); ctx.restore(); }
        for (let i = 0; i < 6; i++) { const y = Hh - (((t * 10 + i * 9) % Hh)); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(10 + i * 15, y, 1.4, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = "#6FAE7C"; for (const x of [8, 30, 70, 86]) { ctx.beginPath(); ctx.moveTo(x - 3, Hh); ctx.quadraticCurveTo(x + Math.sin(t * 2 + x) * 3, Hh - 10, x, Hh - 16); ctx.quadraticCurveTo(x + 3, Hh - 8, x + 3, Hh); ctx.fill(); }
      } else if (ch === 3) {
        ctx.fillStyle = "#FFF1D6"; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = "#F5C76E"; ctx.fillRect(0, Hh - 10, W, 10);
        for (let i = 0; i < 3; i++) { const x = 22 + i * 25, y = 26 - Math.abs(Math.sin(t * 4 + i)) * 8; ctx.fillStyle = ["#FFFFFF", "#F7D56A", "#AEB6BD"][i]; ink(ctx, 1); ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 2.6, y - 1, 1, 0, TAU); ctx.arc(x + 2.6, y - 1, 1, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, y + 1.6, 2.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
        for (let j = 0; j < 3; j++) { const a = (t * 0.6 + j / 3) % 1; FX.note(ctx, 12 + j * 34, Hh - 14 - a * 30); }
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#9CD3F2"); g.addColorStop(1, "#E8F6FB"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
        ["#E77E6E", "#F7D56A", "#8DB87A", "#6FA9CF", "#C9B6E0"].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, Hh + 6, 40 - i * 3.4, Math.PI, TAU); ctx.stroke(); });
        const bx = 20 + ((t * 8) % (W - 30)), by = 18 + Math.sin(t * 1.4) * 4; ctx.fillStyle = "#F28C8C"; ink(ctx, 0.9); ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#C98A52"; ctx.fillRect(bx - 2, by + 8, 4, 3); ctx.strokeRect(bx - 2, by + 8, 4, 3);
      }
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!st.ch) return; const P = mapper(sc, it, r), q = P(0, SCREEN.y, (SCREEN.z0 + SCREEN.z1) / 2); glow(ctx, q.x, q.y, 80 * P.s, "150,190,255", 0.22); },
  });
  simple("hq_wave_sculpture", ["きらきら ひかる なみ！", "うみの おとが きこえそう", "ガラスが すきとおってる"], "bubble", [6, -28, 112]);

  // ---- ひがわり（かべ）----
  FurnLive.register("hq_gold_mirror", {
    // タップで ひかりが かがみを すーっと とおる
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([1568, 1976, 2349], 0.06, "sine", 0.06, 0.2); sayWall(sc, it, ["ぴかぴかの かがみ！", "かみがた ばっちり", "きょうも にこにこ"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > 1.2) return;
      ctx.save(); wallTf(ctx, sc, it); ctx.beginPath(); ctx.ellipse(28, 43, 18.5, 26.5, 0, 0, TAU); ctx.clip();
      const x = -10 + k * 70; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 8, 10); ctx.lineTo(x - 12, 76); ctx.lineTo(x - 20, 76); ctx.closePath(); ctx.fill();
      ctx.restore();
      FXS.spark(ctx, wallMapper(sc, it), st, 40, 0, 62);
    },
  });
  FurnLive.register("hq_sunflower_art", {
    // くもが ゆっくり ながれて、ふうしゃが まわる。タップで かぜが ふいて ふうしゃが はやく まわる
    tap(sc, it, st) { st.spin = (st.spin || 0) + (st.t0 >= 0 ? 6 * (1 - Math.exp(-since(st))) : 0); st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 784, 1047], 0.08, "triangle", 0.09); sayWall(sc, it, ["かぜが ふいて ふうしゃが くるくる", "ひまわりが ゆれてる", "ききゅうに のって みたいな"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const { x0, y0, x1, y1, mill } = ART, t = G.t;
      ctx.save(); wallTf(ctx, sc, it);
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1); ctx.clip();
      for (const [cx, cy, s2, sp] of [[42, 18, 1, 1.6], [76, 22, 0.8, 1.1]]) {
        const span = x1 - x0 + 26, x = x0 - 13 + ((((cx - x0 + 13 + t * sp) % span) + span) % span);
        ctx.save(); ctx.translate(x, cy); ctx.scale(s2, s2); ctx.fillStyle = "#FFFFFF"; ink(ctx, 0.9); ctx.beginPath(); ctx.moveTo(-9, 3); ctx.quadraticCurveTo(-11, -3, -5, -3); ctx.quadraticCurveTo(-4, -8, 1, -7); ctx.quadraticCurveTo(6, -9, 8, -3); ctx.quadraticCurveTo(12, -2, 10, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
      const a = t * 0.6 + (st.spin || 0) + (st.t0 >= 0 ? 6 * (1 - Math.exp(-since(st))) : 0);
      for (let i = 0; i < 4; i++) {
        const b = a + (i * Math.PI) / 2, c = Math.cos(b), s2 = Math.sin(b), p = (uu, vv) => [mill[0] + c * uu - s2 * vv, mill[1] + s2 * uu + c * vv];
        ctx.fillStyle = "#FFF8EA"; ink(ctx, 0.9); ctx.beginPath(); for (const q of [p(1, -1.2), p(12, -2.6), p(12, 2.6), p(1, 1.2)]) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = "#E07A5F"; ink(ctx, 0.7); ctx.beginPath(); ctx.arc(mill[0], mill[1], 1.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
  }, true);
  FurnLive.register("hq_wall_sconce", {
    // ガラスの かべランプ: タップで つく／きえる（よるは はじめから つく）
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [784, 988, 1175] : [659, 523], 0.07, "sine", 0.09); sayWall(sc, it, st.on ? "ガラスの はなが ひかった" : "あかりを けしたよ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      if (!lampOn(st)) return;
      const k = st.t0 < 0 ? 1 : Math.min(1, since(st) * 3);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [x, y] of SCONCE) { const q = wallAt(sc, it, x, y); glow(ctx, q.x, q.y, 20 * sc.s, "255,196,170", 0.55 * k); }
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; for (const [x, y] of SCONCE) { const q = wallAt(sc, it, x, y); glow(ctx, q.x, q.y, 80 * sc.s, "255,190,150", 0.22); } },
  });
  wallSimple("hq_knight_shield", ["えいえい おー！", "ライオンが にっこり", "まもりの たて だよ"], "spark", [36, 0, 40], [523, 659, 784, 1047]);
  FurnLive.register("hq_plush_deer", {
    // しかさん: タップで ウインクして ハートが でる
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 784, 988], 0.1, "triangle", 0.09); sayWall(sc, it, ["しかさん こんにちは！", "ふわふわの つの", "はなかんむり にあうね"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st); if (k > 2.4) return;
      if (k < 0.9) {
        ctx.save(); wallTf(ctx, sc, it); const [x, y] = DEER.eyeR;
        ctx.fillStyle = DEER.face; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
        ink(ctx, 1.2); ctx.beginPath(); ctx.moveTo(x - 2.6, y + 0.4); ctx.quadraticCurveTo(x, y - 2.2, x + 2.6, y + 0.4); ctx.stroke();
        ctx.restore();
      }
      FXS.heart(ctx, wallMapper(sc, it), st, 36, 0, 60);
    },
  });
  FurnLive.register("hq_cuckoo_clock", {
    // もりの はとどけい: はりは ほんとうの じこく・はっぱの ふりこ。タップ（と まいじ 0ぷん）で とびらが ひらいて ことりが でる
    cuckoo(sc, it, st, talk) {
      st.t0 = G.t; st.n = (st.n || 0) + 1; st.bird = true; melody([880, 698, null, 880, 698], 0.22, "sine", 0.14, 0.18);
      if (talk) { const h = U.hourNow() % 12 || 12, m = new Date().getMinutes(); sayWall(sc, it, `いまは ${h}じ ${m}ふん だよ`, "note"); }
    },
    tap(sc, it, st) { this.cuckoo(sc, it, st, true); },
    draw(ctx, sc, it, r, st) {
      const now = new Date(), h = now.getHours() % 12, m = now.getMinutes();
      if (m === 0 && st.lastHour !== h && now.getSeconds() < 30) { st.lastHour = h; if (G.t > 3) this.cuckoo(sc, it, st, false); }
      ctx.save(); wallTf(ctx, sc, it);
      const [px, py] = CUCKOO.pivot, sw = Math.sin(G.t * Math.PI * 1.2) * 0.3;
      ctx.save(); ctx.translate(px, py); ctx.rotate(sw); ctx.strokeStyle = "#B38F3F"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 13); ctx.stroke();
      ctx.fillStyle = "#8DB87A"; ink(ctx, 0.9); ctx.beginPath(); ctx.moveTo(0, 13); ctx.bezierCurveTo(-3.4, 15, -4, 20, 0, 23); ctx.bezierCurveTo(4, 20, 3.4, 15, 0, 13); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#B9DDA6"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 21.6); ctx.stroke(); ctx.restore();
      const [dx, dy] = CUCKOO.dial, ha = ((h + m / 60) / 12) * TAU, ma = (m / 60) * TAU;
      ink(ctx, 1.5); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.sin(ha) * 4.8, dy - Math.cos(ha) * 4.8); ctx.stroke();
      ink(ctx, 1.1); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.sin(ma) * 7.2, dy - Math.cos(ma) * 7.2); ctx.stroke();
      const k = since(st), out = st.bird && k < 1.8 ? Math.sin(Math.min(1, k / 1.8) * Math.PI) : 0;
      const arch = () => { ctx.beginPath(); ctx.moveTo(23, 44); ctx.lineTo(23, 39); ctx.quadraticCurveTo(28, 33, 33, 39); ctx.lineTo(33, 44); ctx.closePath(); };
      if (out > 0.02) {
        arch(); ctx.fillStyle = "#3B2A20"; ink(ctx, 1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#7A4E33"; ctx.beginPath(); ctx.moveTo(23, 44); ctx.lineTo(23, 39); ctx.quadraticCurveTo(20.6, 37, 19, 39.6); ctx.lineTo(19, 45); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(28, 41 - out * 4); ctx.scale(0.45 + out * 0.55, 0.45 + out * 0.55);
        ctx.fillStyle = "#F2A7B8"; ink(ctx, 1.1); ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 3.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#F29A5B"; ctx.beginPath(); ctx.moveTo(4, -0.6); ctx.lineTo(7.6, 0.4); ctx.lineTo(4, 1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(1.8, -1, 0.7, 0, TAU); ctx.fill(); ctx.restore();
      } else {
        arch(); ctx.fillStyle = "#7A4E33"; ink(ctx, 1); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#5C3F2C"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(28, 35.6); ctx.lineTo(28, 44); ctx.stroke(); ctx.fillStyle = "#E9C873"; ctx.beginPath(); ctx.arc(30.4, 40.6, 0.7, 0, TAU); ctx.fill();
      }
      ctx.restore();
    },
  }, true);
  wallSimple("hq_castle_tapestry", ["ほしが きらきら！", "おしろに いって みたいな", "よぞらの おはなし みたい"], "spark", [33, 0, 56], [784, 988, 1175, 1568]);
  // ネオンの くだ（さいしょに 描く とき つくる）
  let neonPaths = null;
  const neonP = () => neonPaths || (neonPaths = { heart: new Path2D(NEON.heart), stars: NEON.stars.map((d) => new Path2D(d)), wave: new Path2D(NEON.wave) });
  FurnLive.register("hq_heart_neon", {
    // ハートの ネオン: タップで つく／きえる（つく ときは ちかちか）・よるは はじめから つく
    isOn: lampOn,
    tap(sc, it, st) { st.on = !lampOn(st); st.t0 = G.t; tone(st.on ? [1047, 1319, 1568] : [784, 523], 0.06, "square", 0.05); sayWall(sc, it, st.on ? "ハートが ぴかっ！" : "ネオンを けしたよ", st.on ? "heart" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const on = lampOn(st), k = since(st), fl = on && st.t0 >= 0 && k < 0.6 ? (Math.sin(k * 60) > 0 ? 1 : 0.25) : 1, N = neonP();
      ctx.save(); wallTf(ctx, sc, it); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const tube = (p, col, w) => {
        if (on) { ctx.globalAlpha = 0.35 * fl; ctx.strokeStyle = col; ctx.lineWidth = w + 5; ctx.stroke(p); }
        ctx.globalAlpha = on ? fl : 1; ctx.strokeStyle = on ? col : "#8C90AA"; ctx.lineWidth = w; ctx.stroke(p);
        ctx.globalAlpha = on ? 0.85 * fl : 0.6; ctx.strokeStyle = on ? "#FFFFFF" : "#B9BCD0"; ctx.lineWidth = 1; ctx.stroke(p);
        ctx.globalAlpha = 1;
      };
      tube(N.heart, "#FF8FB8", 3); N.stars.forEach((p) => tube(p, "#FFE07A", 2)); tube(N.wave, "#8FE3F2", 2);
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!lampOn(st)) return; const q = wallAt(sc, it, 40, 30); glow(ctx, q.x, q.y, 76 * sc.s, "255,120,180", 0.3); },
  }, true);
  wallSimple("hq_wall_shelf", ["おちゃの じかん！", "3にんの しゃしん だ", "キャンディ たべたいな"], "puff", [34, 0, 54], [659, 784, 659]);
  FurnLive.register("hq_gold_wreath", {
    // きんいろの リース: すずが ゆれて しゃらん と なる
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; melody([2093, 2637, 2093, 2637, 3136], 0.08, "sine", 0.05, 0.3); sayWall(sc, it, ["すずが しゃらん！", "まつぼっくりが かわいい", "きんいろ ぴかぴか"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st), a = Math.sin(k * 12) * 0.55 * Math.exp(-k * 1.2) + Math.sin(G.t * 1.6) * 0.04;
      ctx.save(); wallTf(ctx, sc, it);
      WREATH.bells.forEach(([x, y], i) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(i ? -a : a);
        ctx.strokeStyle = "#B9974A"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, 0); ctx.stroke();
        ctx.fillStyle = "#E9C873"; ink(ctx, 1); ctx.beginPath(); ctx.moveTo(-4, 7); ctx.quadraticCurveTo(-4.4, 1, 0, 0); ctx.quadraticCurveTo(4.4, 1, 4, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#C9A24E"; ctx.beginPath(); ctx.rect(-4.8, 6.4, 9.6, 1.6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#B9974A"; ctx.beginPath(); ctx.arc(Math.sin(a * 2) * 1.6, 8.8, 1.2, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      if (k < 2) FXS.spark(ctx, wallMapper(sc, it), st, 33, 0, 40);
    },
  }, true);

  // ================= かぐやさんの ひがわり =================
  // 「かぐ」「かべかざり」の いちばん まえに きょうの 2つ（ほかの ひがわりは ならべない）。カードに「ひがわり」の ふだ・くわしくに あと なんにち
  const shop = BUY_SHOPS.furniture, baseItems = shop.items, baseNote = shop.note;
  shop.items = (tab) => {
    const list = baseItems(tab);
    if (tab !== "floor" && tab !== "wall") return list;
    const today = featured(tab).map((id) => FURN_INDEX[id]).filter((f) => f && list.includes(f));
    return [...today, ...list.filter((f) => !DAILY.has(f.id))];
  };
  shop.note = (it) => {
    const a = baseNote ? baseNote(it) : "";
    if (!DAILY.has(it.id)) return a;
    return [a, `ひがわりの かぐ（2にちごとに かわるよ）。${daysLeft() > 1 ? "あした まで" : "きょう だけ"} ならぶよ。`].filter(Boolean).join("<br>");
  };
  const baseCard = ShopUI.card;
  ShopUI.card = function (shopId, tab, it, onBuy) {
    const c = baseCard.call(this, shopId, tab, it, onBuy);
    if (shopId === "furniture" && DAILY.has(it.id)) { c.classList.add("daily"); c.append(U.el("span", { class: "daily-tag", text: "ひがわり" })); }
    return c;
  };

  return {
    AUTUMN: AUTUMN.map((r) => r[0]), FLOOR: ROT.floor, WALL: ROT.wall, QUIZ: QUIZ.id, DAILY, ROWS: [...AUTUMN, ...FLOOR, ...WALL],
    LAMPS: ["aw_acorn_lamp", "hq_gold_lamp", "hq_wall_sconce", "hq_heart_neon"],
    featured, daysLeft, period, dayNum, wallArt: (id, o) => WALL_ART[id](o),
    // ずかんの ヒント（ひがわりの かぐ だけ。ほかは かぐや・クイズの ヒントの まま）
    source(id) { return DAILY.has(id) ? "かぐやさんに 2にちごとに ならぶ ひがわりの かぐ。" : ""; },
    // いまの ひがわり（PokaDebug.furnDaily）
    state(d) { const fl = featured("floor", d), wa = featured("wall", d); return { day: dayNum(d), period: period(d), left: daysLeft(d), floor: fl, wall: wa, names: { floor: fl.map((id) => FURN_INDEX[id].name), wall: wa.map((id) => FURN_INDEX[id].name) } }; },
  };
})();
