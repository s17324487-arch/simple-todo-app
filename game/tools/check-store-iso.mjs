// 歩いて 入る お店の 内装（js/store-iso*.js・STORE_INTERIORS。O10・UI-75。オーナーの FB 2026-10-03「入ることのできるお店の内装で、クオリティの低いものを作り直してほしい。」）の 検査。
// ブラウザ なしで: ぜんぶの 店（19）の なかみ（什器の かず・しゅるい・大きさ・へやの なか・かさならない・きまった マス〔店員・レジ・はなす ところ・でぐち〕を ふさがない）・
// とおれる マス（ぜんぶ でぐちから いける・すわる テーブルと くじの たなの まえに たてる）・什器の 絵（ぜんぶの しゅるい・NaN なし・id が かさならない・キーは 有限）・
// 店員の となりの ひくい 什器・かべ（パーツの しゅるい・はんい・おみせ Lv の かざり）・床（材質）・カウンターの こもの・ことば（ひらがな・カタカナ）・
// コンビニの くじの たな・まえの 平らな 絵（StoreArt）が のこって いない・とうろく・PokaDebug・文書
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gameContext } from "./game-context.mjs";

const R = gameContext();
const { STORE_INTERIORS: SI, StoreIso, StoreIsoArt: A, StoreScene, SCENES, BUY_SHOPS, SHOPS, MAP_DEFS, PokaDebug, IsoVenueScene } = R;
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const kanji = /[一-鿿]/;
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const W = 10, H = 12;
const WALL_PARTS = ["window", "sign", "menu", "poster", "clock", "shelf", "chalk", "mirror", "door", "tiles", "pegs", "frames", "lights", "garland", "stripe", "board", "art"];
const COUNTER_ITEMS = ["bell", "tray", "bags", "dome", "breadbasket", "bouquet", "brushes", "coffee", "menu", "scale", "stamp", "cards", "candy", "cup", "plant", "ribbon", "gas", ...Object.keys(A.CI)];
const PATS = ["tile", "plank", "carpet", "check", "mat"];
const RESERVED = [[5, 1], [4, 2], [5, 2], [6, 2], [5, 3], [4, 11], [5, 11], [6, 11], [5, 10]]; // 店員・レジ・はなす ところ・でぐちの マット・はいった ところ

// ---- 1. どの 店が ある か（町の 建物の「かう」「おてつだい」は ぜんぶ 店内が ある）----
const ids = Object.keys(SI);
ok(ids.length === 19, `店内は 19（${ids.join("・")}）`);
for (const [map, def] of Object.entries(MAP_DEFS)) for (const b of def.buildings || []) if (["buy", "work"].includes(b.act?.type)) ok(!!SI[b.act.shop], `${map}/${b.id}: 店内が ある`);
ok(SCENES.store === StoreScene && Object.getPrototypeOf(StoreScene.prototype) === IsoVenueScene.prototype, "SCENES.store は 斜め上の 館（IsoVenueScene）");
ok(StoreIso.W === W && StoreIso.H === H, "10×12 マス");

// ---- 2. 店ごと ----
const keys = new Set();
let fixtures = 0, labeled = 0;
for (const id of ids) {
  const d = SI[id], name = (BUY_SHOPS[id] || SHOPS[id] || {}).name;
  ok(!!name && !!d.caption && !kanji.test(d.caption), `${id}: なまえと ひとこと（ひらがな）`);
  ok(/^#[0-9A-F]{6}$/i.test(d.wall) && /^#[0-9A-F]{6}$/i.test(d.accent), `${id}: かべと 店の いろ`);
  // 床
  ok(d.mats && d.mats["."], `${id}: 床の 材質`);
  for (const [ch, m] of Object.entries(d.mats)) ok(ch.length === 1 && Array.isArray(m.c) && m.c.length === 2 && PATS.includes(m.pat), `${id}: 床 ${ch}（いろ 2つ・${PATS.join("／")}）`);
  for (const [ch, x0, y0, x1, y1] of d.zones || []) ok(d.mats[ch] && x0 >= 0 && y0 >= 0 && x1 < W && y1 < H && x0 <= x1 && y0 <= y1, `${id}: 床の くぎり ${ch}`);
  const room = StoreIso.room(id);
  ok(room.rows.length === H && room.rows.every((r) => r.length === W && [...r].every((c) => room.mats[c])), `${id}: へやの 床（10×12・ぜんぶ 材質が ある）`);
  ok(room.rows[H - 1].slice(4, 7) === "xxx", `${id}: でぐちの マット`);
  // カウンター
  ok(d.counter && (d.counter.items || []).every((k) => COUNTER_ITEMS.includes(k)) && (d.counter.items || []).length <= 2, `${id}: カウンターの こもの（2つ まで）`);
  // かべ
  for (const side of ["north", "west"]) {
    const L = side === "north" ? W : H;
    for (const pt of (d.walls || {})[side] || []) {
      ok(WALL_PARTS.includes(pt.t), `${id}/${side}: かべの パーツ ${pt.t}`);
      const b = pt.b ?? pt.a + (pt.t === "clock" ? 0.75 : 1);
      ok(pt.a >= 0 && b <= L && pt.a < b, `${id}/${side}: ${pt.t} の はんい ${pt.a}〜${b}`);
      if (pt.z0 != null) ok(pt.z0 >= 0 && pt.z1 <= 230 && pt.z0 < pt.z1, `${id}/${side}: ${pt.t} の 高さ`);
      for (const t of [pt.title, pt.text, ...(pt.lines || [])].filter(Boolean)) ok(!kanji.test(t), `${id}/${side}: かべの ことば「${t}」は ひらがな・カタカナ`);
      if (pt.t === "menu") ok((pt.items || []).every((it) => R.FOOD_ART[it]), `${id}/${side}: メニューの たべもの`);
    }
    for (const tier of [1, 3, 5]) { const w = A.wallSvg({ ...room, tier }, side); ok(w.svg.startsWith("<svg") && !/NaN|undefined/.test(w.svg) && w.L === L * R.IsoVenue.T, `${id}/${side}: かべの 絵（おみせ Lv の かざり ${tier}）`); }
  }
  ok(((d.walls || {}).north || []).some((p) => p.t === "sign" || p.t === "menu"), `${id}: きたの かべに 店の かんばん か メニュー`);
  // 什器
  const list = StoreIso.fixtures(id, { name: "てんいんさん" }), occ = new Map();
  ok(list.length >= 12 && list.length <= 20, `${id}: 什器の かず ${list.length}（12〜20）`);
  ok(new Set(d.fixtures.map((t) => t[0])).size >= 5, `${id}: 什器の しゅるい 5 いじょう`);
  for (const f of list) {
    ok(Number.isInteger(f.x) && Number.isInteger(f.y) && f.w >= 1 && f.d >= 1 && f.x >= 0 && f.y >= 0 && f.x + f.w <= W && f.y + f.d <= H, `${id}: ${f.kind} は へやの なか`);
    for (let y = f.y; y < f.y + f.d; y++) for (let x = f.x; x < f.x + f.w; x++) { ok(!occ.has(x + "," + y), `${id}: ${f.kind} と ${occ.get(x + "," + y)} が かさなる（${x},${y}）`); occ.set(x + "," + y, f.kind); }
    if (f.kind !== "counter" && f.kind !== "keeper") for (const [x, y] of RESERVED) ok(!(x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.d), `${id}: ${f.kind} が きまった マス（${x},${y}）を ふさぐ`);
    if (f.label) { labeled++; ok(!kanji.test(f.label) && f.label.length <= 16, `${id}: なまえ「${f.label}」（ひらがな・16もじ まで）`); }
    for (const t of [f.text, f.sign, ...(f.lines || [])].filter(Boolean)) ok(!kanji.test(t), `${id}: ${f.kind} の ことば「${t}」`);
    ok(f.height > 0 && f.height <= 210, `${id}: ${f.kind} の 高さ ${f.height}`);
    if (f.x <= 6 && f.x + f.w > 6 && f.y <= 1 && f.y + f.d > 1 && f.kind !== "keeper") ok(f.height <= 75, `${id}: 店員の みぎ（6,1）の ${f.kind} は ひくい（${f.height}）`);
    if (f.kind === "keeper" || f.kind === "npc") continue;
    const m = A.model(f);
    ok(m && m.svg.startsWith("<svg") && !/NaN|undefined/.test(m.svg) && m.vb.w > 8 && m.vb.h > 8, `${id}: ${f.kind}（${f.w}×${f.d}）の 絵`);
    const idList = [...m.svg.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
    ok(new Set(idList).size === idList.length, `${id}: ${f.kind} の 絵の id が かさならない`);
    keys.add(A.modelKey(f)); fixtures++;
  }
  ok(list.filter((f) => f.kind === "npc").length <= 1, `${id}: おきゃくさんは 1人 まで`);
  for (const f of list.filter((f) => f.kind === "npc")) ok(R.NpcArt.SP[f.sp] && f.action === "chat" && (f.lines || []).length >= 2, `${id}: おきゃくさんの しゅるいと ことば`);
  // とおれる マス（でぐちから ぜんぶ いける・すわる テーブルと くじの たなの まえに たてる）
  const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !occ.has(x + "," + y), seen = new Set(["5,10"]), q = [[5, 10]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + "," + (y + dy); if (walk(x + dx, y + dy) && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy]); } } }
  let floor = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(x, y)) { floor++; ok(seen.has(x + "," + y), `${id}: でぐちから いけない 床（${x},${y}）`); }
  ok(floor >= 60, `${id}: あるける 床 ${floor}（60 いじょう）`);
  ok(seen.has("5,3") && seen.has("5,11"), `${id}: はなす ところと でぐち`);
  // すわる テーブル・くじの たなは その まえまで あるく（ほかの しらべる ものは とおくから タップで ひとこと）
  for (const f of list.filter((f) => f.action === "sit" || f.action === "kuji")) {
    let near = false;
    for (let y = f.y - 1; y <= f.y + f.d; y++) for (let x = f.x - 1; x <= f.x + f.w; x++) if ((x === f.x - 1 || x === f.x + f.w || y === f.y - 1 || y === f.y + f.d) && !((x === f.x - 1 || x === f.x + f.w) && (y === f.y - 1 || y === f.y + f.d)) && seen.has(x + "," + y)) near = true;
    ok(near, `${id}: ${f.label || f.kind} の まえに たてる`);
  }
}
ok(keys.size <= 400, `什器の 絵の キーは 有限（${keys.size}）`);
ok(fixtures >= 200 && labeled >= 180, `什器 ${fixtures}・しらべる もの ${labeled}`);

// ---- 3. コンビニの くじの たな ----
for (const id of ["lawson", "sevenbun"]) {
  const f = StoreIso.fixtures(id).filter((x) => x.kind === "kuji_" + id);
  ok(f.length === 1 && f[0].x === 7 && f[0].y === 0 && f[0].w === 3 && f[0].action === "kuji", `${id}: レジの みぎの かべに くじの たな（7,0・3ます）`);
  const m = A.model(f[0]);
  ok((m.svg.match(/<image /g) || []).length >= 3 && m.svg.includes("いちばんくじ"), `${id}: くじの たなに ビッグ ぬいぐるみ A・B・C と かんばん`);
  ok(R.IchibanKuji.isFixture(f[0]), `${id}: くじの たなを タップ → くじ`);
}

// ---- 4. まえの 平らな 絵が のこって いない・とうろく・PokaDebug・文書 ----
for (const file of readdirSync(new URL("../js/", import.meta.url))) if (file.endsWith(".js")) ok(!/\bStoreArt\b/.test(read("js/" + file)), `js/${file}: まえの 平らな 店内の 絵（StoreArt）を つかわない`);
const html = read("index.html"), sw = read("sw.js"), at = (f) => html.indexOf(`src="js/${f}"`);
for (const f of ["store-iso-art.js", "store-iso-props.js", "store-iso.js"]) ok(at(f) > 0 && sw.includes(`"./js/${f}"`), `${f} を index.html と sw.js に とうろく`);
ok(at("iso-venue.js") < at("mall-art.js") && at("mall-art.js") < at("neri-bikkupo.js") && at("neri-bikkupo.js") < at("store-iso-art.js") && at("store-iso-art.js") < at("store-iso-props.js") && at("store-iso-props.js") < at("store-iso.js"), "よみこむ じゅん（iso-venue → mall-art → neri-bikkupo → store-iso-art → store-iso-props → store-iso）");
ok(typeof PokaDebug.store === "function" && typeof PokaDebug.storeState === "function" && typeof PokaDebug.storeWalkTo === "function", "PokaDebug.store・storeState・storeWalkTo");
{
  const arch = read("docs/ARCHITECTURE.md"), agents = read("../AGENTS.md"), ch = read("CHANGELOG.md");
  ok(arch.includes("store-iso.js") && arch.includes("StoreIsoArt"), "ARCHITECTURE.md に store-iso.js・StoreIsoArt");
  ok(agents.includes("js/store-iso.js"), "AGENTS.md の ファイルの 地図に js/store-iso.js");
  ok((ch.split("\n## [")[1] || "").includes("UI-75"), "CHANGELOG の いちばん うえの 版に UI-75");
}

console.log(`✓ 歩いて 入る お店（StoreIso・StoreIsoArt）: 19 店・什器 ${fixtures}・絵の キー ${keys.size}・${n} 項目`);
