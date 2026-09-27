// ネット・ブラウザ不要の静的チェック。変更のたびに `npm run check`（または node tools/check.mjs）で実行する。
// ゲームの全スクリプトを index.html の順に 1つの VM に読み込み（ブラウザの classic script と同じく
// グローバルを共有するので、名前の重複もここで見つかる）、データ・マップ・SVG・ミニゲームを検査する。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const GAME = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);
let checks = 0;
let R = null;
const ok = (cond, msg) => { checks++; if (!cond) err(msg); return cond; };

// ---------- 1. ファイル構成 ----------
const html = readFileSync(join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const jsFiles = readdirSync(join(GAME, "js")).filter((f) => f.endsWith(".js")).map((f) => "js/" + f);
for (const f of jsFiles) ok(scripts.includes(f), `index.html に ${f} の <script> がない`);
for (const f of scripts) ok(existsSync(join(GAME, f)), `index.html が読む ${f} が存在しない`);
const sw = readFileSync(join(GAME, "sw.js"), "utf8");
const swFiles = [...sw.matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
for (const f of jsFiles) ok(swFiles.includes(f), `sw.js の FILES に ${f} がない（オフラインで動かなくなる）`);
for (const f of swFiles) ok(existsSync(join(GAME, f)), `sw.js の FILES の ${f} が存在しない（Service Worker のインストールが失敗する）`);
ok(scripts[0] === "js/version.js", "js/version.js は index.html で最初に読み込むこと");

// classic script の トップレベル const/class は window のプロパティにならない。
// window.X で参照すると いつも undefined になるので 見つけたら エラーにする
const declared = new Set();
const assignedToWindow = new Set();
for (const f of scripts) {
  const src = readFileSync(join(GAME, f), "utf8");
  for (const m of src.matchAll(/^(?:const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) declared.add(m[1]);
  for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) assignedToWindow.add(m[1]);
}
for (const f of scripts) {
  const src = readFileSync(join(GAME, f), "utf8");
  for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)/g)) {
    if (declared.has(m[1]) && !assignedToWindow.has(m[1])) ok(false, `${f}: window.${m[1]} は いつも undefined（トップレベルの const/class は window に載らない。${m[1]} を直接使うか typeof で確かめる）`);
  }
}

// ---------- 2. VM にゲームを読み込む ----------
const store = new Map();
const noop = () => {};
const stubEl = () => ({ style: { setProperty: noop }, append: noop, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], classList: { add: noop, remove: noop, toggle: noop }, getContext: () => null, setAttribute: noop });
const ctx = {
  console, performance, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder,
  requestAnimationFrame: noop,
  navigator: {}, location: { protocol: "http:", origin: "http://localhost" },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl(), documentElement: stubEl(), fonts: null },
  Image: class { set src(v) {} },
  addEventListener: noop,
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of scripts) {
  try {
    vm.runInContext(readFileSync(join(GAME, f), "utf8"), ctx, { filename: f });
  } catch (e) {
    err(`${f} の読み込みで失敗: ${e.message}`);
  }
}
if (errors.length) finish();
R = vm.runInContext(`({ GAME_VERSION, WEAR_ITEMS, ITEM_INDEX, WEAR, SLOT_NAMES, PERK_TEXT, FOODS, TOOLS, BAG_INDEX, FURNITURE, FURN_INDEX, FURN_ART, WALLPAPERS, FLOORS,
  ENEMIES, ENEMY_ART, AREAS, SKILLS, CHARA_STATS, CHARA_INFO, CHARA_DATA, SHOPS, SHOP_LV_REP, MG_TASKS, SHOP_OWNERS, HOWTO, BUY_SHOPS, MAP_DEFS, WorldMap,
  Chara, Art, Save, Stats, Care, Loot, SPECIES, TALKS, SCENES, SONGS, Sound, EMO, PokaDebug, HomeRooms, Room, GameEconomy })`, ctx);

// ---------- 3. バージョン ----------
const pkg = JSON.parse(readFileSync(join(GAME, "package.json"), "utf8"));
ok(pkg.version === R.GAME_VERSION, `package.json の version (${pkg.version}) と GAME_VERSION (${R.GAME_VERSION}) がちがう`);
const cl = existsSync(join(GAME, "CHANGELOG.md")) ? readFileSync(join(GAME, "CHANGELOG.md"), "utf8") : "";
// 「## [Unreleased]」は飛ばして、いちばん上の「## [x.y.z]」「## [x.y.z-dev]」を見る
const top = /^## \[?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\]?/m.exec(cl);
ok(/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(R.GAME_VERSION), `GAME_VERSION (${R.GAME_VERSION}) が semver の形（例 2.0.0 / 2.0.0-dev）でない`);
ok(top && top[1] === R.GAME_VERSION, `CHANGELOG.md の いちばん上の版 (${top ? top[1] : "なし"}) と GAME_VERSION (${R.GAME_VERSION}) がちがう`);
ok(R.Save.KEY === "pokapoka-town-save-v1", "Save.KEY を変えると 既存プレイヤーのセーブが読めなくなる（変えないこと）");
for (const s of ["title", "world", "house", "battle", "shop"]) ok(typeof R.SCENES[s] === "function", `SCENES.${s} がない`);

// ---------- 4. データの参照 ----------
const uniq = (arr, what) => { const seen = new Set(); for (const x of arr) { ok(!seen.has(x), `${what} の id が重複: ${x}`); seen.add(x); } return seen; };
const STAT_KEYS = new Set(["hp", "sp", "atk", "def", "spd"]);
uniq(R.WEAR_ITEMS.map((w) => w.id), "WEAR_ITEMS");
for (const w of R.WEAR_ITEMS) {
  ok(R.SLOT_NAMES[w.slot], `服 ${w.id}: slot "${w.slot}" が不明`);
  ok(typeof R.WEAR[w.wear] === "function", `服 ${w.id}: 描画関数 WEAR.${w.wear} がない（js/chara.js）`);
  if (w.perk) ok(R.PERK_TEXT[w.perk], `服 ${w.id}: perk "${w.perk}" の説明が PERK_TEXT にない`);
  for (const k in w.st || {}) ok(STAT_KEYS.has(k), `服 ${w.id}: ステータス名 "${k}" が不明`);
  ok(Number.isFinite(w.price) && w.price >= 0, `服 ${w.id}: price が不正`);
}
const bagIds = uniq([...R.FOODS, ...R.TOOLS].map((f) => f.id), "FOODS/TOOLS");
for (const id of Object.keys(R.CHARA_INFO)) for (const f of [...R.CHARA_INFO[id].like, ...R.CHARA_INFO[id].dislike]) ok(bagIds.has(f), `CHARA_INFO.${id} の好き嫌い ${f} が FOODS にない`);
uniq(R.FURNITURE.map((f) => f.id), "FURNITURE");
for (const f of R.FURNITURE) {
  ok(typeof R.FURN_ART[f.id] === "function", `家具 ${f.id}: 絵 FURN_ART.${f.id} がない（js/art.js）`);
  ok(["floor", "rug", "wall"].includes(f.kind), `家具 ${f.id}: kind "${f.kind}" が不明`);
  ok(f.w > 0 && f.h > 0, `家具 ${f.id}: w/h が不正`);
}
uniq(R.WALLPAPERS.map((w) => w.id), "WALLPAPERS");
uniq(R.FLOORS.map((w) => w.id), "FLOORS");
for (const [k, e] of Object.entries(R.ENEMIES)) {
  ok(typeof R.ENEMY_ART[e.art] === "function", `敵 ${k}: 絵 ENEMY_ART.${e.art} がない`);
  for (const s of e.skills) ok(R.SKILLS[s], `敵 ${k}: わざ ${s} が SKILLS にない`);
  ok(e.coin && e.coin[0] <= e.coin[1], `敵 ${k}: coin の範囲が不正`);
}
for (const [a, def] of Object.entries(R.AREAS)) for (const [id, lo, hi, wt] of def.table) { ok(R.ENEMIES[id], `エリア ${a}: 敵 ${id} がない`); ok(lo <= hi && wt > 0, `エリア ${a}: ${id} のレベル/重みが不正`); }
for (const id of R.Chara.IDS) {
  ok(R.CHARA_STATS[id] && Object.keys(R.CHARA_STATS[id]).every((k) => STAT_KEYS.has(k)), `CHARA_STATS.${id} が不正`);
  ok(Object.values(R.SKILLS).some((s) => s.user === id && s.lv === 1), `${id} に Lv1 の とくぎ がない`);
}
for (const [k, s] of Object.entries(R.SKILLS)) if (s.user) ok(R.Chara.IDS.includes(s.user), `とくぎ ${k}: user "${s.user}" が不明`);
const shopKeys = Object.keys(R.SHOPS).sort().join(",");
ok(Object.keys(R.MG_TASKS).sort().join(",") === shopKeys, "SHOPS と MG_TASKS（js/minigames.js）の お店が一致しない");
ok(Object.keys(R.SHOP_OWNERS).sort().join(",") === shopKeys, "SHOPS と SHOP_OWNERS の お店が一致しない");
ok(Object.keys(R.HOWTO).sort().join(",") === shopKeys, "SHOPS と HOWTO の お店が一致しない");
ok(Object.keys(R.Save.fresh().shops).sort().join(",") === shopKeys, "SHOPS と Save.fresh().shops の お店が一致しない");
for (const [k, s] of Object.entries(R.SHOPS)) ok(R.PERK_TEXT[s.perk], `お店 ${k}: perk "${s.perk}" が不明`);
ok(R.SHOP_LV_REP.length === 6, "SHOP_LV_REP は Lv0〜5 の 6要素");
for (const [k, s] of Object.entries(R.BUY_SHOPS)) for (const [tab] of s.tabs) ok(s.items(tab).length > 0, `買い物 ${k} のタブ ${tab} が空`);

// ---------- 5. セーブの初期値 ----------
const fresh = R.Save.fresh();
for (const id of Object.keys(fresh.wardrobe)) ok(R.ITEM_INDEX[id], `初期の服 ${id} が WEAR_ITEMS にない`);
for (const id of Object.keys(fresh.furn)) ok(R.FURN_INDEX[id], `初期の家具 ${id} が FURNITURE にない`);
for (const id of Object.keys(fresh.bag)) ok(R.BAG_INDEX[id], `初期のもちもの ${id} がない`);
for (const it of fresh.room.items) { ok(R.FURN_INDEX[it.id], `初期の部屋の家具 ${it.id} がない`); ok((fresh.furn[it.id] || 0) >= fresh.room.items.filter((x) => x.id === it.id).length, `初期の部屋: ${it.id} を持っている数より多く置いている`); }
ok(R.WALLPAPERS.some((w) => w.id === fresh.room.wall) && R.FLOORS.some((f) => f.id === fresh.room.floor), "初期の壁紙/床が一覧にない");
ok(fresh.v === R.Save.SCHEMA, "Save.fresh().v と Save.SCHEMA がちがう");
// 古いセーブ（キー欠け）の移行
const old = JSON.parse(JSON.stringify(fresh));
delete old.rooms;
delete old.shops.link; delete old.shops.relay; delete old.settings.difficulty;
for (const c of Object.values(old.chars)) delete c.wantsDeza;
const oldRoom = JSON.stringify(old.room);
delete old.shops.florist; delete old.flags; delete old.gameVersion; old.v = undefined;
old.chars.wanko.name = "<b>ポチ</b>"; old.chars.gachan.name = "<>";
const mig = R.Save.migrate(old);
ok(mig.settings.difficulty === "normal" && mig.shops.link.lv === 1 && mig.shops.relay.lv === 1, "旧セーブに新作店と難易度を補えない");
ok(mig.rooms.active === "main" && !mig.chars.goji.wantsDeza && JSON.stringify(mig.room) === oldRoom, "旧セーブの部屋・家具を保持して生活項目を補う");
R.Save.d = mig;
const countBefore = R.Room.available("bed_simple");
mig.rooms.owned.study = true;
R.HomeRooms.switchTo("study");
ok(R.Room.available("bed_simple") === countBefore && mig.room.items.length === 0, "別室にある家具が複製できてしまう");
R.HomeRooms.switchTo("main");
ok(JSON.stringify(mig.room) === oldRoom, "元の部屋の配置が変わった");
ok(mig.shops.florist && mig.flags && mig.v === R.Save.SCHEMA, "Save.migrate() で足りないキーが補われない");
ok(mig.chars.wanko.name === "bポチ/b" && mig.chars.gachan.name === fresh.chars.gachan.name, `Save.migrate() が名前の HTML 記号を取りのぞかない (${mig.chars.wanko.name} / ${mig.chars.gachan.name})`);

// ---------- 6. マップ ----------
const allChestIds = new Set();
for (const id of Object.keys(R.MAP_DEFS)) {
  let m;
  try { m = new R.WorldMap(id); } catch (e) { err(`マップ ${id} の生成に失敗: ${e.message}`); continue; }
  for (const w of m.warps) {
    ok(R.MAP_DEFS[w.to], `マップ ${id}: ワープ先 ${w.to} がない`);
    if (R.MAP_DEFS[w.to]) { const t = new R.WorldMap(w.to); ok(!t.isSolid(w.tx, w.ty), `マップ ${id} → ${w.to}: 到着地点 (${w.tx},${w.ty}) が通れない`); }
  }
  for (const c of m.chests) {
    ok(!allChestIds.has(c.id), `たからばこ id ${c.id} が重複（フラグが混ざる）`); allChestIds.add(c.id);
    const L = c.loot;
    ok((L.coins > 0) || (L.bag && R.BAG_INDEX[L.bag]) || (L.wear && R.ITEM_INDEX[L.wear]) || (L.furn && R.FURN_INDEX[L.furn]), `マップ ${id}: たからばこ ${c.id} の中身が不正`);
  }
  for (const d of m.doors) {
    const a = d.b.act;
    ok(a && (a.type === "house" || (a.type === "work" && R.SHOPS[a.shop]) || (a.type === "buy" && R.BUY_SHOPS[a.shop])), `マップ ${id}: 建物 ${d.b.id} の act が不正`);
  }
  for (const n of m.def.npcs || []) {
    ok(R.SPECIES[n.sp], `マップ ${id}: NPC ${n.id} の種類 ${n.sp} がない`);
    ok(R.TALKS[n.talk], `マップ ${id}: NPC ${n.id} の会話 ${n.talk} が TALKS にない`);
    for (const it of Object.values(n.outfit || {})) ok(R.ITEM_INDEX[it], `マップ ${id}: NPC ${n.id} の服 ${it} がない`);
  }
  if (m.def.boss) ok(R.ENEMIES[m.def.boss.enemy], `マップ ${id}: ボス ${m.def.boss.enemy} がない`);
  // 到達性（最初のワープ or 家のドアから）
  const start = id === "town" ? [4, 6] : [m.warps[0].x, m.warps[0].y];
  const seen = new Set([start.join(",")]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = x + dx + "," + (y + dy);
      if (seen.has(k) || m.isSolid(x + dx, y + dy)) continue;
      seen.add(k); q.push([x + dx, y + dy]);
    }
  }
  const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(x + dx + "," + (y + dy)));
  for (const w of m.warps) ok(near(w.x, w.y), `マップ ${id}: ワープ(${w.to}) に たどりつけない`);
  for (const c of m.chests) ok(near(c.x, c.y), `マップ ${id}: たからばこ ${c.id} に たどりつけない`);
  for (const d of m.doors) ok(near(d.x, d.y), `マップ ${id}: ${d.b.id} のドアに たどりつけない`);
  for (const n of m.def.npcs || []) ok(near(n.x, n.y), `マップ ${id}: NPC ${n.id} に たどりつけない`);
  for (const s of m.signs) ok(near(s.x, s.y), `マップ ${id}: かんばん (${s.x},${s.y}) に たどりつけない`);
  for (const [x, y] of m.def.spawns || []) ok(seen.has(x + "," + y), `マップ ${id}: 敵の出現位置 (${x},${y}) が通れない/とどかない`);
  if (m.def.boss) ok(near(m.def.boss.x, m.def.boss.y), `マップ ${id}: ボスに たどりつけない`);
}

// ---------- 7. SVG の生成 ----------
const TAGS = ["svg", "g", "defs", "clipPath", "pattern", "linearGradient", "radialGradient"];
function svgOk(svg, what) {
  checks++;
  if (typeof svg !== "string" || !svg.startsWith("<svg")) { err(`${what}: SVG が作れない`); return; }
  if (/NaN|undefined|Infinity/.test(svg)) { err(`${what}: SVG に NaN/undefined が入っている`); return; }
  for (const t of TAGS) {
    const open = (svg.match(new RegExp(`<${t}[\\s>]`, "g")) || []).length;
    const self = (svg.match(new RegExp(`<${t}\\b[^>]*/>`, "g")) || []).length;
    const close = (svg.match(new RegExp(`</${t}>`, "g")) || []).length;
    if (open - self !== close) { err(`${what}: <${t}> の開始と終了の数が合わない`); return; }
  }
  for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) if (!svg.includes(`id="${m[1]}"`)) { err(`${what}: url(#${m[1]}) の参照先がない`); return; }
}
const DIRS = ["down", "up", "left", "right"];
const POSES = ["idle_01", "idle_02", "walk_01", "walk_02", "jump_01", "land_01"];
for (const id of R.Chara.IDS) {
  const faces = new Set([...Object.keys(R.CHARA_DATA[id].faces), ...Object.keys(R.EMO)]);
  for (const dir of DIRS) for (const pose of POSES) svgOk(R.Chara.svg(id, { dir, pose }), `キャラ ${id} ${dir} ${pose}`);
  for (const face of faces) svgOk(R.Chara.svg(id, { face }), `キャラ ${id} 表情 ${face}`);
  svgOk(R.Chara.svg("goji", { color: "dark", dir: "up" }), "ごじ dark 後ろ");
  for (const w of R.WEAR_ITEMS) for (const dir of ["down", "up", "left"]) svgOk(R.Chara.svg(id, { dir, pose: "walk_01", outfit: { [w.slot]: w.id } }), `服 ${w.id} を ${id} が着る(${dir})`);
}
const everything = {}; for (const w of R.WEAR_ITEMS) everything[w.slot] = w.id;
for (const id of R.Chara.IDS) svgOk(R.Chara.svg(id, { outfit: everything }), `${id} 全部位を着る`);
for (const sp of Object.keys(R.SPECIES)) for (const dir of DIRS) for (const emo of ["normal", "happy", "sad", "surprise", "angry", "sleep"]) svgOk(R.Art.npcSvg({ sp, dir, emo, outfit: { head: "tophat", body: "stripe" } }), `NPC ${sp} ${dir} ${emo}`);
for (const [k, e] of Object.entries(R.ENEMIES)) for (const emo of ["normal", "hurt", "sleep", "angry"]) svgOk(R.Art.enemySvg(e.art, e.col, emo), `敵 ${k} ${emo}`);
for (const f of R.FURNITURE) { svgOk(R.Art.furnSvg(f.id), `家具 ${f.id}`); svgOk(R.Art.furnSvg(f.id, { flip: true }), `家具 ${f.id}(はんてん)`); }
for (const id of bagIds) svgOk(R.Art.iconSvg("bag", id), `アイコン ${id}`);
for (const w of R.WALLPAPERS) svgOk(R.Art.iconSvg("wall", w.id), `かべがみ ${w.id}`);
for (const f of R.FLOORS) svgOk(R.Art.iconSvg("floor", f.id), `ゆか ${f.id}`);

// ---------- 8. 遊びのロジック ----------
try {
  R.Save.reset();
  for (const id of R.Chara.IDS) for (const f of R.FOODS) { R.Save.addBag(f.id, 1); R.Care.feed(id, f.id); }
  for (const id of R.Chara.IDS) ok(R.Stats.gainExp(id, 999999).length > 0 && R.Save.d.chars[id].lv === 50, `${id}: レベル上限まで上がらない`);
  for (const id of Object.keys(R.MAP_DEFS)) for (const c of new R.WorldMap(id).chests) R.Loot.give(c.loot, { chest: true });
} catch (e) { err("育成/アイテムの処理で例外: " + e.message); }
// ミニゲーム: 正しく操作すれば 100点、何もしなければ 低い点
const fakeScene = () => ({ timePenalty: () => 0, finish() {}, mistake() {}, addFx() {}, bubbleRect: null, orderT: 0 });
const RECT = { x: 10, y: 380, w: 342, h: 390 };
for (const [shop, Task] of Object.entries(R.MG_TASKS)) for (let lv = 1; lv <= 5; lv++) {
  try {
    const t = new Task(fakeScene(), lv);
    t.layout(RECT);
    ok(t.timeLimit > 5 && typeof t.title === "string", `ミニゲーム ${shop} Lv${lv}: timeLimit/title が不正`);
    for (const b of t.btns) ok(b.x >= RECT.x - 1 && b.x + b.w <= RECT.x + RECT.w + 1 && b.y >= RECT.y - 1 && b.y + b.h <= RECT.y + RECT.h + 4, `ミニゲーム ${shop} Lv${lv}: ボタン「${b.label || "?"}」が作業エリアからはみ出す`);
    let perfect = null;
    if (shop === "crepe") { t.placed = t.want.map((id) => ({ id })); perfect = t.score(); }
    if (shop === "florist") { t.picked = Object.entries(t.want).flatMap(([k, n]) => Array(n).fill(k)); t.chosen = t.ribbon; perfect = t.score(); }
    if (shop === "bakery") { t.pen = 0; perfect = t.score(); }
    if (shop === "dentist") { t.killed = t.nGerm; t.dirt.forEach((d) => (d.hp = 0)); t.cav.forEach((c) => (c.fixed = true)); perfect = t.score(); }
    if (shop === "link") {
      for (let n = 0; n < 40 && t.collected < t.target; n++) {
        const chain = t.legalMove(); ok(!!chain, "つなげる場所がなくなる");
        t.down({ ...t.point(chain[0]), id: 1 });
        chain.slice(1).forEach(i => t.move({ ...t.point(i), id: 1 }));
        t.up({ ...t.point(chain[2]), id: 1 });
        t.tick(.5);
      }
      perfect = t.score();
      const before = t.collected, chain = t.legalMove();
      t.down({ ...t.point(chain[0]), id: 1 }); chain.slice(1).forEach(i => t.move({ ...t.point(i), id: 1 })); t.up({ id: 1 }, true);
      ok(t.collected === before && t.chain.length === 0, "ドラッグ中断が得点になる");
      t.penalty = 3;
      ok(t.score() === 97, "目標を多く超えるとシャッフル減点が消えてしまう");
    }
    if (shop === "relay") {
      for (let n = 0; n < t.target; n++) {
        t.role = n % 3; t.lane = n % 3;
        t.items = [{ lane: t.lane, role: t.role, y: t.trackBottom - .01, rock: false }]; t.tick(.02);
      }
      perfect = t.score();
      t.items = [{ lane: t.lane, y: t.trackBottom - .01, rock: true }]; t.key("ok"); t.tick(.02);
      ok(t.misses === 0, "まもるで岩を防げない");
      t.invincible = 0; t.items = [{ lane: t.lane, y: t.trackBottom - .01, rock: true }]; t.tick(.02);
      ok(t.misses === 1 && t.score() < 100, "岩に当たっても減点されない");
    }
    ok(perfect === 100, `ミニゲーム ${shop} Lv${lv}: 正しい操作で 100点に ならない（${perfect}）`);
    const t2 = new Task(fakeScene(), lv); t2.layout(RECT);
    ok(t2.timeout() < 45, `ミニゲーム ${shop} Lv${lv}: 何もしないで 時間切れでも 点が高すぎる（${t2.timeout()}）`);
  } catch (e) { err(`ミニゲーム ${shop} Lv${lv} で例外: ${e.message}`); }
}
// 報酬: 放置に報酬を出さず、難易度・店のレベル・評価に応じて増える。
for (const shop of Object.keys(R.SHOPS)) for (let lv = 1; lv <= 5; lv++) {
  const pay = (rank, mode = "normal") => R.GameEconomy.pay(shop, lv, rank, mode);
  ok(pay(0) === 0 && pay(1) < pay(2) && pay(2) < pay(3), `${shop}: 評価に対する報酬が不正`);
  ok(pay(3, "easy") < pay(3) && pay(3) < pay(3, "hard"), `${shop}: 難易度で報酬が増えない`);
}
ok(R.GameEconomy.pay("link", 1, 3) > R.GameEconomy.pay("crepe", 1, 3) * 2, "高難度パズルの報酬が低い");
for (let lv = 1; lv <= 5; lv++) {
  const shift = shop => R.GameEconomy.pay(shop, lv, 3) * (R.SHOPS[shop].rounds || 3 + Math.min(4, lv));
  ok(shift("relay") > shift("link") && shift("link") > shift("dentist"), `Lv${lv}: 高難度新作の1回の総報酬が既存店より低い`);
}
for (const id of [...Object.keys(R.SHOPS), ...Object.keys(R.BUY_SHOPS)]) ok(!!R.SONGS["shop_" + id], `${id}: 専用BGMがない`);
// BGM の音符
for (const [name, song] of Object.entries(R.SONGS)) for (const tr of song.tracks) {
  const seq = R.Sound.parse(tr.notes);
  for (const ev of seq) if (ev && !tr.drum) ok(R.Sound.freq(ev.n) > 0, `曲 ${name}: 音符 "${ev.n}" が読めない`);
  if (tr.drum) for (const ev of seq) if (ev) ok(["k", "s", "h"].includes(ev.n), `曲 ${name}: ドラム "${ev.n}" が不明`);
}
ok(typeof R.PokaDebug.help === "function", "PokaDebug（js/debug.js）がない");

finish();
function finish() {
  for (const w of warns) console.log("⚠ " + w);
  if (errors.length) {
    console.log(`\n✗ ${errors.length} 件の問題（${checks} 項目中）`);
    for (const e of errors.slice(0, 80)) console.log("  - " + e);
    if (errors.length > 80) console.log(`  …ほか ${errors.length - 80} 件`);
    process.exit(1);
  }
  console.log(`✓ check OK（${checks} 項目） ver ${R ? R.GAME_VERSION : "?"}`);
  process.exit(0);
}
