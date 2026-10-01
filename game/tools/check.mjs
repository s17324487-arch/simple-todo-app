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
  ENEMIES, ENEMY_ART, AREAS, SKILLS, CHARA_STATS, CHARA_INFO, CHARA_DATA, SHOPS, SHOP_LV_REP, MG_TASKS, SHOP_OWNERS, HOWTO, BUY_SHOPS, GAS_FUELS, MAP_DEFS, WorldMap, STORE_INTERIORS, StoreArt, StoreScene,
  Chara, Art, Save, Stats, Care, Loot, SPECIES, TALKS, SCENES, SONGS, Sound, EMO, PokaDebug, HomeRooms, Room, HomeDesign, GameEconomy, Transit, Seasonal, SEASON_ITEMS, AtlasArt, VenueHalls, ParentCare, ANNUAL_EVENTS, AnnualArt, AnnualFestivals, Weather, SeasonPalette, TownRoads, ShopDecor })`, ctx);

// 道の判定はブラウザがなくても同じ。車道・歩道・隅切り・切り下げがタイルでつながる。
const roadFixture=vm.runInNewContext(readFileSync(join(GAME,"tests/fixtures/roads-v02.js"),"utf8")+";ROAD_FIXTURE");
const roadMap=new R.WorldMap("road-test",roadFixture),roadGrid=roadMap.roadGrid;
const reached=new Set(["43,28"]),queue=[[43,28]];
for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=queue[i][0]+dx,y=queue[i][1]+dy,key=x+","+y,kind=roadGrid[y]?.[x];
  if(kind&&kind!=="island"&&!reached.has(key)){reached.add(key);queue.push([x,y]);}
}
for(const key of ["43,17","50,21","36,21","40,42","24,66","59,67"])ok(reached.has(key),`ベクター道路が切れている: ${key}`);
ok(roadMap.isSolid(43,21)&&!roadMap.isSolid(43,28),"ロータリーの島と車道の通行判定が不正");
const obstacle=structuredClone(roadFixture);obstacle.rows[28]=obstacle.rows[28].slice(0,43)+"T"+obstacle.rows[28].slice(44);
ok(new R.WorldMap("road-obstacle",obstacle).isSolid(43,28),"ベクター道路が既存の木の衝突を消した");
ok(new R.WorldMap("meadow").roadGrid===null,"道のないはらっぱにもベクター判定が追加された");
ok(R.Save.KEY==="pokapoka-town-save-v1"&&R.Save.SCHEMA===1,"道路追加でセーブ形式を変えた");

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
ok(Object.keys(R.MG_TASKS).sort().join(",") === Object.keys(R.SHOPS).filter(id=>!R.SHOPS[id].arcade).sort().join(","), "SHOPS と MG_TASKS（js/minigames.js）の お店が一致しない");
ok(Object.keys(R.SHOP_OWNERS).sort().join(",") === shopKeys, "SHOPS と SHOP_OWNERS の お店が一致しない");
ok(Object.keys(R.HOWTO).sort().join(",") === shopKeys, "SHOPS と HOWTO の お店が一致しない");
ok(Object.keys(R.Save.fresh().shops).sort().join(",") === shopKeys, "SHOPS と Save.fresh().shops の お店が一致しない");
for (const [k, s] of Object.entries(R.SHOPS)) ok(R.PERK_TEXT[s.perk], `お店 ${k}: perk "${s.perk}" が不明`);
ok(R.SHOP_LV_REP.length === 31 && R.SHOP_LV_REP.slice(0,6).join() === "0,0,120,360,800,1600", "お店Lv30までと旧Lv1〜5の評判を維持");
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
old.coins=987654;old.stats.coinsEarned=1234567;
const legacyBag=JSON.stringify(old.bag),legacyWardrobe=JSON.stringify(old.wardrobe),legacyFurn=JSON.stringify(old.furn);
delete old.parents;
delete old.rooms;
delete old.events;
delete old.shops.link; delete old.shops.relay; delete old.settings.difficulty;
for (const c of Object.values(old.chars)) delete c.wantsDeza;
const oldRoom = JSON.stringify(old.room);
delete old.shops.florist; delete old.flags; delete old.gameVersion; old.v = undefined;
old.chars.wanko.name = "<b>ポチ</b>"; old.chars.gachan.name = "<>";
const mig = R.Save.migrate(old);
ok(mig.events && Object.keys(mig.events.records).length === 0 && mig.coins === 987654, "旧セーブに季節の記録を補えない/コインが変化した");
ok(mig.parents.papa.accessory==="glasses"&&mig.parents.mama.hair==="bob"&&mig.stats.coinsEarned===1234567,"親の項目補完で進行データが変わった");
ok(JSON.stringify(mig.bag)===legacyBag&&JSON.stringify(mig.wardrobe)===legacyWardrobe&&JSON.stringify(mig.furn)===legacyFurn,"移行で所持品が変わった");
ok(mig.settings.difficulty === "normal" && mig.shops.link.lv === 1 && mig.shops.relay.lv === 1, "旧セーブに新作店と難易度を補えない");
ok(mig.rooms.active === "main" && !mig.chars.goji.wantsDeza && JSON.stringify(mig.room) === oldRoom, "旧セーブの部屋・家具を保持して生活項目を補う");
R.Save.d = mig;
const countBefore = R.Room.available("bed_simple");
mig.rooms.owned.study = true;
R.HomeRooms.switchTo("study");
ok(R.Room.available("bed_simple") === countBefore && mig.room.items.length === 0, "別室にある家具が複製できてしまう");
R.HomeRooms.switchTo("main");
ok(JSON.stringify(mig.room) === oldRoom, "元の部屋の配置が変わった");
// 拡張は部屋ごとに1回。支払前の条件と旧セーブ・配置の保持を検証する。
const expansionSave = JSON.parse(JSON.stringify(mig));
delete expansionSave.rooms.expanded;
R.Save.d = R.Save.migrate(expansionSave);
const baseArea = R.HomeDesign.W * R.HomeDesign.D, expansionRoom = JSON.stringify(R.Save.d.room), expansionFurn = JSON.stringify(R.Save.d.furn);
ok(R.HomeDesign.W === 480 && R.HomeDesign.D === 360, "旧セーブの部屋が勝手に拡張された");
R.Save.d.coins = 5999;
ok(!R.HomeRooms.expand("main") && R.Save.d.coins === 5999 && R.HomeDesign.W * R.HomeDesign.D === baseArea, "残高不足で拡張/引き落としが起きた");
R.Save.d.coins = 987654;
ok(!R.HomeRooms.expand("garden") && !R.HomeRooms.expand("unknown") && R.Save.d.coins === 987654, "未所有/不明な部屋を拡張できる");
ok(R.HomeRooms.expand("main") && R.Save.d.coins === 981654 && R.HomeDesign.W * R.HomeDesign.D === baseArea * 2, "拡張の面積または代金が不正");
ok(!R.HomeRooms.expand("main") && R.Save.d.coins === 981654, "同じ部屋の拡張で二重払いが起きた");
ok(JSON.stringify(R.Save.d.room) === expansionRoom && JSON.stringify(R.Save.d.furn) === expansionFurn, "拡張で家具・配置・壁紙・床が変わった");
R.HomeRooms.switchTo("study");
ok(R.HomeDesign.W * R.HomeDesign.D === baseArea && !R.HomeRooms.expand("main"), "別室が勝手に広がる/表示中でない部屋を拡張できる");
ok(R.HomeRooms.expand("study") && R.Save.d.coins === 975654, "別室を独立して拡張できない");
R.HomeRooms.switchTo("main");
R.Save.d = R.Save.migrate(JSON.parse(JSON.stringify(R.Save.d)));
ok(R.HomeDesign.W * R.HomeDesign.D === baseArea * 2 && R.Save.d.rooms.expanded.study && R.Save.d.coins === 975654 && JSON.stringify(R.Save.d.room) === expansionRoom, "拡張とコイン・部屋の再読み込みが不正");
R.Save.d = mig;
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
    ok(a && (a.type === "house" || (a.type === "venue" && R.SCENES.venue && R.VenueHalls.defs[a.venue]) || (a.type === "work" && R.SHOPS[a.shop]) || (a.type === "buy" && R.BUY_SHOPS[a.shop]) || (a.type === "transit" && R.Transit.stops[a.stop]?.map === id) || (a.type === "visit" && typeof a.text === "string") || (a.type === "indoor" && !!R.MAP_DEFS[a.map]?.indoor) || (a.type === "range" && typeof R.SCENES.range === "function") || (a.type === "walkway" && typeof a.text === "string" && !!R.MAP_DEFS[a.to?.map])), `マップ ${id}: 建物 ${d.b.id} の act が不正`);
    // ちかみち（walkway）: でぐちは 通れる マスで、入口・ワープの 上では ない
    if (a?.type === "walkway" && R.MAP_DEFS[a.to?.map]) { const t = new R.WorldMap(a.to.map); ok(!t.isSolid(a.to.x, a.to.y) && !t.doorAt(a.to.x, a.to.y) && !t.warpAt(a.to.x, a.to.y), `マップ ${id}: ちかみち ${d.b.id} の でぐち (${a.to.x},${a.to.y}) が 通れない`); }
    if(a?.type === "transit") {
      const arrival=R.Transit.arrival(a.stop);
      ok(!m.isSolid(arrival.x,arrival.y)&&!m.warpAt(arrival.x,arrival.y)&&R.Transit.destinations(a.stop).length>0, `${id}: のりばの着地点・路線が不正`);
    }
  }
  for (const n of m.def.npcs || []) {
    ok(R.SPECIES[n.sp], `マップ ${id}: NPC ${n.id} の種類 ${n.sp} がない`);
    ok(R.TALKS[n.talk], `マップ ${id}: NPC ${n.id} の会話 ${n.talk} が TALKS にない`);
    for (const it of Object.values(n.outfit || {})) ok(R.ITEM_INDEX[it], `マップ ${id}: NPC ${n.id} の服 ${it} がない`);
  }
  if (m.def.boss) ok(R.ENEMIES[m.def.boss.enemy], `マップ ${id}: ボス ${m.def.boss.enemy} がない`);
  // 到達性（最初のワープ or 家のドアから）
  const start = m.def.safeSpawn || (id === "town" ? [4, 6] : [m.warps[0].x, m.warps[0].y]);
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
  for (const o of m.def.objects || []) if(o.text) {
    let reachable=false;
    for(let y=Math.floor(o.y);y<Math.ceil(o.y+o.h);y++)for(let x=Math.floor(o.x);x<Math.ceil(o.x+o.w);x++)if(near(x,y))reachable=true;
    ok(reachable, `マップ ${id}: あそべる ${o.id} に たどりつけない`);
  }
  for (const [x, y] of m.def.spawns || []) ok(seen.has(x + "," + y), `マップ ${id}: 敵の出現位置 (${x},${y}) が通れない/とどかない`);
  if (m.def.boss) ok(near(m.def.boss.x, m.def.boss.y), `マップ ${id}: ボスに たどりつけない`);
}

// 店のレベルは有限の3段階だけ。Lv1は元のSVGを変えず、通行・セーブ値も変えない。
for(const [lv,tier]of [[1,1],[2,1],[3,3],[4,3],[5,5]])ok(R.ShopDecor.tier(lv)===tier,'店の装飾段階が不正');
const decorSave=JSON.stringify(R.Save.d),decorSpec=R.MAP_DEFS.town.buildings.find(b=>b.act.shop==='crepe');
const decorImages=[1,3,5].map(shopTier=>R.Art.worldSvg('building',{...decorSpec,shopTier}));
ok(new Set(decorImages.map(a=>a.full)).size===3,'店のLv1/3/5が同じ絵');
ok(decorImages.every(a=>a.w===decorImages[0].w&&a.h===decorImages[0].h),'店の飾りで建物の寸法が変わる');
ok(R.ShopDecor.exterior(1,200,160)===''&&JSON.stringify(R.Save.d)===decorSave,'店の飾りで元の絵やセーブが変わる');

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
decorImages.forEach((a,i)=>svgOk(a.full,'店のレベル装飾 '+[1,3,5][i]));
// 全体地図が実際のエリア・徒歩の接続と食い違わないこと。
const atlasSvg=R.AtlasArt.svg(), atlasAgain=R.AtlasArt.svg();
svgOk(atlasSvg,"全体地図");
const atlasIds=[...atlasSvg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
ok(atlasIds.every(id=>!atlasAgain.includes(`id="${id}"`)),"別の地図でSVGのIDが重複する");
// ⑤ 館の 中（indoor）は 町の 建物の 中なので 全体地図に のせない
const outdoor=Object.keys(R.MAP_DEFS).filter(id=>!R.MAP_DEFS[id].indoor),indoorIds=new Set(Object.keys(R.MAP_DEFS).filter(id=>R.MAP_DEFS[id].indoor));
for(const id of outdoor) ok(!!R.AtlasArt.places[id],`全体地図に ${id} がない`);
for(const id of Object.keys(R.AtlasArt.places)) ok(!!R.MAP_DEFS[id],`全体地図の ${id} が実在しない`);
const atlasPair=(a,b)=>[a,b].sort().join("/");
const atlasRoads=new Set(R.AtlasArt.roads.map(([a,b])=>atlasPair(a,b)));
for(const [a,b] of R.AtlasArt.roads) ok(R.MAP_DEFS[a]?.warps.some(w=>w.to===b)&&R.MAP_DEFS[b]?.warps.some(w=>w.to===a),`地図の道 ${a}↔${b} を歩けない`);
for(const [id,d] of Object.entries(R.MAP_DEFS)) for(const w of d.warps||[]) if(!indoorIds.has(id)&&!indoorIds.has(w.to)) ok(atlasRoads.has(atlasPair(id,w.to)),`全体地図に道 ${id}↔${w.to} がない`);
const DIRS = ["down", "up", "left", "right"];
for(const id of ["papa","mama"])for(const [outfit] of R.ParentCare.options.outfit)for(const [face] of R.ParentCare.options.face)for(const pose of ["idle","walk1","walk2","care","wave"])
  svgOk(R.ParentCare.svg(id,{...fresh.parents[id],outfit,face},pose),`親 ${id} ${outfit} ${face} ${pose}`);
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
// 斜めの床での操作、保存した旧座標、家具の全向きと左右の壁。
for(const x of [0,120,360,480])for(const y of [0,140,230,360]){
  const p=R.HomeDesign.project(x,y),q=R.HomeDesign.inverse(p.x,p.y);
  ok(Math.abs(q.x-x)<1e-8&&Math.abs(q.y-y)<1e-8,"おへやの床座標が往復しない");
}
for(const w of R.WALLPAPERS)for(const f of R.FLOORS)svgOk(R.HomeDesign.roomSvg(w.id,f.id),`部屋 ${w.id}/${f.id}`);
svgOk(R.HomeDesign.roomSvg("wp_cream", "fl_wood", R.HomeDesign.sizes.expanded), "拡張した部屋");
for(const f of R.FURNITURE.filter(f=>f.kind!=="wall"))for(const flip of [false,true]){
  const m=R.HomeDesign.model(f.id,{flip});
  ok([m.x,m.y,m.w,m.h,m.footW,m.footD].every(Number.isFinite)&&m.w>0&&m.h>0,`家具の投影範囲 ${f.id}/${flip}`);
}
const oldHome=R.Save.fresh();oldHome.coins=987654;oldHome.room.items[2].x=19;oldHome.room.items[2].y=248;
oldHome.rooms.owned.study=true;oldHome.rooms.stored.study=JSON.parse(JSON.stringify(oldHome.room));
const oldHomeState=JSON.stringify([oldHome.coins,oldHome.furn,oldHome.room,oldHome.rooms]);
const loadedHome=R.Save.migrate(JSON.parse(JSON.stringify(oldHome)));
ok(JSON.stringify([loadedHome.coins,loadedHome.furn,loadedHome.room,loadedHome.rooms])===oldHomeState,"部屋の更新で旧所持品・配置・増築・おかねを変更した");
for (const id of bagIds) svgOk(R.Art.iconSvg("bag", id), `アイコン ${id}`);
for (const w of R.WALLPAPERS) svgOk(R.Art.iconSvg("wall", w.id), `かべがみ ${w.id}`);
for (const f of R.FLOORS) svgOk(R.Art.iconSvg("floor", f.id), `ゆか ${f.id}`);
for (const [id,d] of Object.entries(R.MAP_DEFS)) {
  for(const b of d.buildings||[])svgOk(R.Art.worldSvg(b.asset?"heiwadai_"+b.asset.replaceAll(".","_"):"building",b.asset?b.opts:b).full, `${id}: 建物 ${b.id}`);
  for(const o of d.objects||[])svgOk(R.Art.worldSvg(o.kind==="spring"?"well":o.kind).full, `${id}: オブジェクト ${o.kind}`);
}

// ---------- 8. 遊びのロジック ----------
// 葉の世界座標・揺れはカメラとは独立し、画面座標だけ地形と同じ量だけ動く。
for(const kind of ["spring","summer","autumn","wind"]){
  const sc={map:{baseGround:"grass"},cam:{x:800,y:800}},size={w:390,h:844};
  const before=R.Seasonal.particles(sc,20,kind,size);
  sc.cam={x:832,y:848};const after=R.Seasonal.particles(sc,20,kind,size);
  const common=after.filter(p=>before.some(q=>p.id===q.id));
  ok(common.length>2,`${kind}: カメラ移動で粒がすべて入れ替わる`);
  for(const p of common){
    const q=before.find(q=>p.id===q.id);
    ok(p.wx===q.wx&&p.wy===q.wy&&p.angle===q.angle&&p.fold===q.fold,`${kind}: カメラが葉の軌道に影響する`);
    ok(Math.abs(p.x-q.x+32)<1e-8&&Math.abs(p.y-q.y+48)<1e-8,`${kind}: 地形に対して葉が滑る`);
  }
  const later=R.Seasonal.particles(sc,21,kind,size),p=common[0],q=later.find(q=>q.id===p.id);
  ok(q&&Math.hypot(q.wx-p.wx,q.wy-p.wy)>1,`${kind}: 停止中に葉が動かない`);
  for(const time of [0,100,1e6]){
    const ps=R.Seasonal.particles(sc,time,kind,size);
    ok(ps.length<=48&&new Set(ps.map(p=>p.id)).size===ps.length&&ps.every(p=>[p.wx,p.wy,p.x,p.y].every(Number.isFinite)),`${kind}: 粒数・位置が不正`);
  }
}
ok(R.Seasonal.particles({map:{baseGround:"cave"},cam:{x:0,y:0}},20,"autumn",{w:390,h:844}).length===0,"洞窟で落ち葉が舞う");
// 季節境界・冬の年またぎ・記念品の二重受け取りと古いメニューの期限切れ。
R.Save.reset();
for(const [year,month,day,want] of [[2026,2,28,"2025-winter"],[2026,3,1,"2026-spring"],[2026,5,31,"2026-spring"],[2026,6,1,"2026-summer"],[2026,8,31,"2026-summer"],[2026,9,1,"2026-autumn"],[2026,11,30,"2026-autumn"],[2026,12,1,"2026-winter"],[2027,1,1,"2026-winter"],[2027,2,28,"2026-winter"],[2027,3,1,"2027-spring"]]) {
  ok(R.Seasonal.current(new Date(year,month-1,day,12)).key===want,`季節境界 ${year}-${month}-${day} が不正`);
}
for(const [i,id] of ["spring","summer","autumn","winter"].entries()){
  R.Seasonal.override=new Date(2026,2+i*3,1,12);
  const e=R.Seasonal.current(),items=R.SEASON_ITEMS[id];
  ok(!R.Seasonal.claim(e.key),`${id}: スタンプなしで受け取れる`);
  for(const [map,objectId] of e.targets) {
    const o=R.MAP_DEFS[map].objects.find(o=>o.id===objectId);
    ok(!!o?.text,`${id}: スタンプのしかけ ${objectId} がない`);
    if(o){R.Seasonal.collect(map,o);R.Seasonal.collect(map,o);}
  }
  ok(R.Seasonal.state().count===3,`${id}: スタンプの数が不正`);
  ok(R.Seasonal.claim(e.key)&&!R.Seasonal.claim(e.key),`${id}: 受け取りが一度に制限されない`);
  const reloaded=R.Save.migrate(JSON.parse(JSON.stringify(R.Save.d)));R.Save.d=reloaded;
  ok(!R.Seasonal.claim(e.key)&&R.Save.d.furn[items.furn]===1&&R.Save.d.bag[items.food]===3&&R.Save.d.wardrobe[items.wear],`${id}: 再起動で記念品が増える/消える`);
  ok(!R.BUY_SHOPS.market.items("food").some(it=>it.id===items.food)&&!R.BUY_SHOPS.furniture.items("floor").some(it=>it.id===items.furn),`${id}: 限定品が通常店舗で無料入手できる`);
}
R.Seasonal.override=new Date(2027,2,1,12);
ok(R.Seasonal.state().count===0&&!R.Seasonal.claim("2026-winter"),"季節変更後も古い画面から受け取れてしまう");
ok(Object.values(R.SEASON_ITEMS).every(it=>R.Save.d.wardrobe[it.wear]&&R.Save.d.furn[it.furn]===1),"季節をまたぐと限定品が消える");
R.Seasonal.override=null;
// 月別イベントは既存の四季の記録・コインを保ち、年ごとに一度だけ受け取る。
const seasonRecords=JSON.stringify(R.Save.d.events.records),annualCoins=R.Save.d.coins;
const beforeWeather=JSON.stringify(R.Save.d),weatherSeen=new Set();
for(let month=0;month<12;month++)for(let day=1;day<=28;day++)for(let hour=0;hour<24;hour+=3) {
  const date=new Date(2026,month,day,hour),kind=R.Weather.forDate(date);weatherSeen.add(kind);
  ok(!!R.Weather.kinds[kind]&&kind===R.Weather.forDate(new Date(2026,month,day,hour+2,59)),"天気が3時間枠の途中で変わる");
  if(month>1&&month<11)ok(kind!=="snow","冬以外に雪が降る");
}
ok(weatherSeen.size===5,"5種類の天気が自然発生しない");
for(const kind of Object.keys(R.Weather.kinds)) {
  R.Weather.override=kind;svgOk(R.Weather.svg(kind),"天気 "+kind);
  ok(R.Weather.state("town").particles<=48&&R.Weather.state("cave").particles===0&&R.Weather.state(null).particles===0,kind+": 粒の上限や室内判定が不正");
  ok(R.Weather.state("town").forecast.length===3,kind+": 予報がない");
}
R.Weather.override=null;
for(const season of Object.keys(R.SeasonPalette.values))for(const kind of ["tree","pine","appletree","bush","hedge"])svgOk(R.SeasonPalette.object(kind,R.Art.worldSvg(kind),season).full,season+" "+kind);
ok(new Set(Object.values(R.SeasonPalette.values).map(v=>v.grass)).size===4,"四季の地面の色が変わらない");
ok(JSON.stringify(R.Save.d)===beforeWeather,"天気でセーブが変更された");
ok(R.ANNUAL_EVENTS.length===12&&new Set(R.ANNUAL_EVENTS.map(e=>e.id)).size===12,"12種類のおまつりがない");
for(let month=1;month<=12;month++) {
  R.Seasonal.override=new Date(2026,month-1,1,12);
  const e=R.AnnualFestivals.current(),s=R.AnnualFestivals.state();
  ok(e.month===month&&R.AnnualFestivals.current(new Date(2026,month,0,23,59)).id===e.id,`${month}月: 開催期間が不正`);
  svgOk(R.AnnualArt.svg(e),e.name);
  ok(!R.AnnualFestivals.claim(e.key)&&!R.AnnualFestivals.start("2025-annual-"+e.id),`${e.id}: 期間外/未完了で受け取れる`);
  const first=s.targets[0];
  ok(!R.AnnualFestivals.complete(e.key,first.map,first.id,0),`${e.id}: 未参加でも進行する`);
  ok(R.AnnualFestivals.start(e.key),`${e.id}: 参加できない`);
  for(const t of s.targets) {
    ok(!!R.MAP_DEFS[t.map].objects.find(o=>o.id===t.id)?.text,`${e.id}: 目的地 ${t.id} がない`);
    ok(!R.AnnualFestivals.complete(e.key,t.map,t.id,-1)&&!R.AnnualFestivals.complete(e.key,t.map,t.id,2),`${e.id}: キャンセルや不正な答えで進む`);
    ok(R.AnnualFestivals.complete(e.key,t.map,t.id,month%2)&&!R.AnnualFestivals.complete(e.key,t.map,t.id,0),`${e.id}: 一度だけ進行しない`);
  }
  ok(R.AnnualFestivals.state().count===3&&R.AnnualFestivals.claim(e.key)&&!R.AnnualFestivals.claim(e.key),`${e.id}: 重複受け取りを防げない`);
  R.Save.d=R.Save.migrate(JSON.parse(JSON.stringify(R.Save.d)));
  ok(!R.AnnualFestivals.claim(e.key)&&R.Save.d.furn[e.items.furn]===1&&R.Save.d.bag[e.items.food]===3&&R.Save.d.wardrobe[e.items.wear],`${e.id}: 再開で限定品が変わる`);
  ok(!R.BUY_SHOPS.market.items("food").some(it=>it.id===e.items.food)&&!R.BUY_SHOPS.furniture.items("floor").some(it=>it.id===e.items.furn),`${e.id}: 限定品が通常店舗にある`);
}
R.Seasonal.override=new Date(2027,0,1,12);
ok(!R.AnnualFestivals.state().claimed&&R.AnnualFestivals.state().count===0&&!R.AnnualFestivals.claim("2026-annual-christmas"),"月/年の変更後に前の画面で受け取れる");
ok(R.ANNUAL_EVENTS.every(e=>R.Save.d.furn[e.items.furn]===1&&R.Save.d.wardrobe[e.items.wear]),"翌年に年間イベントの品が消える");
ok(Object.entries(JSON.parse(seasonRecords)).every(([k,v])=>JSON.stringify(R.Save.d.events.records[k])===JSON.stringify(v)),"既存の四季の記録が変わった");
ok(R.Save.d.coins===annualCoins,"年間イベントでコインが変わった");
R.Seasonal.override=null;
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
    if(shop==='burger'){
      for(const id of t.want)t.btns.find(b=>b.label===t.fillings.find(f=>f.id===id).name).cb();perfect=t.score();ok(t.made.length===lv+2,'burger: 具材がレベルで増えない');const saved=[...t.made];[t.made[0],t.made[1]]=[t.made[1],t.made[0]];ok(t.score()<72,'burger: 順番違いが減点されない');t.made=saved;t.peeks=1;ok(t.score()===92,'burger: 見直しが減点されない');t.peeks=0;
      for(const b of t.btns)ok(b.h>=44&&b.w>=44,'burger: ボタンの操作範囲');t.btns.find(b=>b.label==='ひとつ もどす').cb();ok(t.made.length===t.want.length-1&&!t.btns[0].disabled,'burger: 積み直しができない');
    }
    if(shop==='groom'){
      const line=t.outline();t.downArea(line[0]);line.slice(1).forEach(q=>t.move(q));t.up();ok(t.trimmed.every(Boolean),'groom: 見本をなぞってもカットできない');
      t.stage='dry';t.setup();for(const q of t.zones()){t.downArea(q);t.tick(.6+lv*.1);t.up();}t.chosen=t.ribbon;perfect=t.score();
      t.chosen=t.ribbon==='pink'?'blue':'pink';ok(t.score()===80,'groom: 違うリボンが減点されない');t.chosen=t.ribbon;
      const dried=t.dry.join();t.up();t.tick(5);ok(t.dry.join()===dried,'groom: 指を離した後も乾燥する');
      t.stage='ribbon';t.setup();for(const b of t.btns)ok(b.w>=44&&b.h>=44&&b.y+b.h<=RECT.y+RECT.h,'groom: リボンの操作範囲');
      t.stage='cut';const q={x:RECT.x+20,y:RECT.y+RECT.h*.6};t.downArea(q);t.move({x:q.x+100,y:q.y});t.up();ok(t.offLine>0&&t.score()<100,'groom: はみだしが採点に反映されない');
    }
    if (shop === "cake") { t.made={...t.want}; perfect=t.score(); for(let i=0;i<t.steps.length;i++){t.step=i;t.setup();for(const b of t.btns)ok(b.h>=44&&b.w>=44&&b.y+b.h<=RECT.y+RECT.h,`cake Lv${lv}: 作業ボタンの大きさ・位置`);} }
    if (shop === "crepe") { t.placed = t.want.map((id) => ({ id })); perfect = t.score(); }
    if (shop === "florist") { t.picked = Object.entries(t.want).flatMap(([k, n]) => Array(n).fill(k)); t.chosen = t.ribbon; perfect = t.score(); }
    if (shop === "bakery") { t.pen = 0; perfect = t.score(); }
    if (shop === "dentist") { t.killed = t.nGerm; t.dirt.forEach((d) => (d.hp = 0)); t.cav.forEach((c) => (c.fixed = true)); perfect = t.score(); }
    if (shop === "korokoro") {
      // 箱に ちゅうもんの くだものが できれば おきゃくさんに とどいて 100点（くわしくは tools/check-korokoro.mjs）
      t.want.forEach((w, i) => t.board.world.add(w.tier, 22 + i * 50, 80));
      for (let k = 0; k < 3; k++) t.tick(1 / 60);
      perfect = t.want.every((w) => w.done) ? t.score() : -1;
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
    if (shop === "gasstand") {
      // ちがう いろの ノズルは えらべない → ちゅうもんの ノズル → ながおしで りょうの まんなか（まんたんは カチッと とまる）→ よごれを こする →（Lv.3 から）ぺしゃんこの タイヤ
      const name = (id) => R.GAS_FUELS.find((f) => f.id === id).name;
      ok(!!t.holdBtn && t.holdBtn.disabled === (lv >= 2), "gasstand: ノズルを えらぶ まえに きゅうゆ できる");
      if (lv >= 2) { t.btns.find((b) => b.label === name(t.fuels.find((f) => f.id !== t.want.fuel).id)).cb(); ok(t.mistakes === 1 && t.fuel === null, "gasstand: ちがう ノズルで きゅうゆ できる"); t.mistakes = 0; t.btns.find((b) => b.label === name(t.want.fuel)).cb(); }
      const a = t.want.amount, goal = a.hi >= 1 ? 1 : (a.lo + a.hi) / 2;
      t.holdBtn.cb(); for (let k = 0; k < 2000 && t.holding && t.fill < goal - 1e-6; k++) t.tick(Math.min(1 / 60, Math.max(1e-4, (goal - t.fill) / t.speed))); t.up();
      ok(t.fuelPts() === 40 && (a.hi < 1 || t.clicked), `gasstand Lv${lv}: ${a.name}に ならない（${t.fill}）`);
      const fill = t.fill; t.tick(2); ok(t.fill === fill, "gasstand: 指を はなしても きゅうゆ される");
      t.btns.find((b) => b.label === "つぎへ ▶").cb(); ok(t.stage === "wash", "gasstand: せんしゃに すすまない");
      for (const s of t.spots) { t.downArea({ x: s.x, y: s.y }); for (let k = 0; k < 80 && s.dirt > 0; k++) t.move({ x: s.x + (k % 2 ? -12 : 12), y: s.y }); t.up(); }
      ok(t.washPts() === 40, "gasstand: よごれが おちない");
      if (lv >= 3) { t.btns.find((b) => b.label === "つぎへ ▶").cb(); ok(t.stage === "tires" && t.tires.some((x) => x.flat0), "gasstand: タイヤに すすまない"); for (const x of t.tires.filter((q) => q.flat0)) { t.downArea({ x: x.x, y: x.y }); t.tick(1); t.up(); } }
      else ok(t.btns.some((b) => b.label === "できあがり！"), "gasstand: できあがりが ない");
      for (const b of t.btns) ok(b.w >= 44 && b.h >= 44, "gasstand: ボタンの 大きさ");
      perfect = t.score();
    }
    if (shop === "postoffice") {
      // けしいんの まえは しわけ できない・ちがう はこは 減点 → ぜんぶ けしいん → あてさきの はこ
      const c0 = t.cur, box = (id) => t.bins.find((b) => b.id === id);
      t.sort(box(c0.dest)); ok(!c0.ok && t.index === 0 && t.mistakes === 0, "postoffice: けしいんの まえに しわけ できる");
      t.stamp(); t.sort(t.bins.find((b) => b.id !== c0.dest)); ok(t.mistakes === 1 && !c0.ok, "postoffice: ちがう はこに いれられる");
      t.mistakes = 0; c0.miss = 0;
      for (let k = 0; k < 20 && t.cur; k++) { if (!t.cur.stamped) t.stamp(); t.sort(box(t.cur.dest)); t.tick(0.4); }
      ok(!t.cur && t.items.every((c) => c.ok && c.stamped), "postoffice: ぜんぶ とどかない");
      for (const b of t.btns) ok(b.w >= 44 && b.h >= 44, "postoffice: ボタンの 大きさ");
      perfect = t.score();
    }
    ok(perfect === 100, `ミニゲーム ${shop} Lv${lv}: 正しい操作で 100点に ならない（${perfect}）`);
    const t2 = new Task(fakeScene(), lv); t2.layout(RECT);
    ok(t2.timeout() < 45, `ミニゲーム ${shop} Lv${lv}: 何もしないで 時間切れでも 点が高すぎる（${t2.timeout()}）`);
  } catch (e) { err(`ミニゲーム ${shop} Lv${lv} で例外: ${e.message}`); }
}
// 報酬: 放置に報酬を出さず、難易度・店のレベル・評価に応じて増える。
for (const shop of Object.keys(R.MG_TASKS)) for (let lv = 1; lv <= 5; lv++) {
  const pay = (rank, mode = "normal") => R.GameEconomy.pay(shop, lv, rank, mode);
  ok(pay(0) === 0 && pay(1) < pay(2) && pay(2) < pay(3), `${shop}: 評価に対する報酬が不正`);
  ok(pay(3, "easy") < pay(3) && pay(3) < pay(3, "hard"), `${shop}: 難易度で報酬が増えない`);
}
for (let lv = 1; lv <= 5; lv++) {
  const shift = shop => R.GameEconomy.pay(shop, lv, 3) * (R.SHOPS[shop].rounds || 3 + Math.min(4, lv));
  ok(shift("relay") > shift("dentist"), `Lv${lv}: 高難度新作の1回の総報酬が既存店より低い`);
}
for (const id of [...Object.keys(R.SHOPS), ...Object.keys(R.BUY_SHOPS)]) ok(!!R.SONGS["shop_" + id], `${id}: 専用BGMがない`);
// BGM の音符
for (const [name, song] of Object.entries(R.SONGS)) for (const tr of song.tracks) {
  const seq = R.Sound.parse(tr.notes);
  for (const ev of seq) if (ev && !tr.drum) for (const note of ev.n.split("+")) ok(R.Sound.freq(note) > 0, `曲 ${name}: 音符 "${note}" が読めない`);
  // k s h（どの 曲も）・o c t l（ひらいた ハイハット・シンバル・タム。ModernMusic だけ）
  if (tr.drum) for (const ev of seq) if (ev) ok(["k", "s", "h"].includes(ev.n) || (song.modern && ["o", "c", "t", "l"].includes(ev.n)), `曲 ${name}: ドラム "${ev.n}" が不明`);
}
ok(typeof R.PokaDebug.help === "function", "PokaDebug（js/debug.js）がない");
ok(typeof R.SCENES.store==="function","歩ける店内シーンが未登録");
for(const [map,def] of Object.entries(R.MAP_DEFS))for(const b of def.buildings||[])if(["buy","work"].includes(b.act?.type))ok(!!R.STORE_INTERIORS[b.act.shop],map+"/"+b.id+": 店内がない");
for(const [id,def] of Object.entries(R.STORE_INTERIORS)){
  const sc=new R.StoreScene();sc.party=[{tx:5,ty:10}];
  sc.fixtures=def.fixtures.map(([kind,x,y,w,d])=>({kind,x,y,w,d}));
  sc.fixtures.push({kind:"counter",x:4,y:2,w:3,d:1});
  ok(sc.route(5,3)!==null&&sc.route(5,11)!==null,id+": 店員/出口に到達できない");
  for(let y=0;y<12;y++)for(let x=0;x<10;x++)if(sc.walkable(x,y))ok(sc.route(x,y)!==null,id+": 到達できない床 "+x+","+y);
  for(const f of sc.fixtures){
    ok(f.x>=0&&f.x+f.w<=10&&f.y>=0&&f.y+f.d<=12,id+": 展示が室外");
    ok(!sc.walkable(f.x,f.y),id+": 展示に衝突判定がない");
    ok(R.StoreArt.prop(f.kind).includes("<svg")&&!/undefined|NaN/.test(R.StoreArt.prop(f.kind)),id+": 展示SVGが不正");
  }
  ok(!/undefined|NaN/.test(R.StoreArt.room(id)),id+": 店内SVGが不正");
}

const daily=vm.runInContext('DailyPlay',ctx);
ok(daily.dayIndex('2030-9-10')>daily.dayIndex('2030-9-9')&&daily.dayIndex('2031-1-1')>daily.dayIndex('2030-12-31'),'スタンプの日付比較が文字列順');
ok(daily.dayIndex('2030-2-29')===null&&daily.dayIndex('2032-2-29')!==null,'スタンプの実在日付の検査');
for(let i=1;i<=14;i++){const day='2030-10-'+i,id=daily.featured(day),m=daily.mul(day);ok(!!R.MG_TASKS[id]&&id!=='link'&&daily.boost(id,day)===m&&m>=1.2&&m<=2&&daily.boost(id==='crepe'?'bakery':'crepe',day)===(daily.featured(day)===(id==='crepe'?'bakery':'crepe')?m:1),'おすすめに未実装/有料パズルが入る／ばいりつが 1.2〜2 でない');}
// ラッキー おみせの ばいりつ: 日づけで きまる（おなじ 日は おなじ）・1.2〜2 の 0.1 きざみ 9とおりが ほぼ おなじ 確率・ひごとに かわる
{
  const cnt=new Map();let n=0;for(let y=2027;y<2037;y++)for(let mo=1;mo<=12;mo++)for(let d=1;d<=28;d++){const v=daily.mul(y+'-'+mo+'-'+d);cnt.set(v,(cnt.get(v)||0)+1);n++;}
  ok(JSON.stringify([...cnt.keys()].sort((a,b)=>a-b))===JSON.stringify(daily.MULS)&&daily.MULS.length===9&&daily.MULS[0]===1.2&&daily.MULS[8]===2&&[...cnt.values()].every(k=>Math.abs(k/n-1/9)<0.025),'ばいりつが 1.2〜2 の 9とおりで おなじ くらいに ならない '+JSON.stringify([...cnt]));
  ok(daily.mul('2030-10-5')===daily.mul('2030-10-5')&&new Set(Array.from({length:14},(_,i)=>daily.mul('2030-11-'+(i+1)))).size>=5,'ばいりつが おなじ 日で かわる／ひごとに かわらない');
  ok(daily.label(2)==='2ばい'&&daily.label(1.5)==='1.5ばい'&&daily.label(1.2)==='1.2ばい','ばいりつの ことば');
  const read=(f)=>readFileSync(join(GAME,f),"utf8");
  for(const f of ['js/minigames.js','js/korokoro-score.js','js/smaho.js','js/daily-play.js'])ok(!/コインが 1\.2ばい|コイン 1\.2ばい/.test(read(f)),f+': ラッキー おみせの ばいりつが 1.2ばいの まま');
}
for(const [pay,tip,boost]of [[28,7,1.2],[0,0,1.2],[32,13,1]]){const r=daily.payout(pay,tip,boost);ok(r.pay+r.tip===Math.round((pay+tip)*boost),'おすすめの合計報酬倍率が不正');}
const dailyFixture=vm.runInContext(`(()=>{const before=Save.d;Save.d=Save.fresh();Save.d.coins=987654;const initial=JSON.stringify({wardrobe:Save.d.wardrobe,furn:Save.d.furn,room:Save.d.room});
const dates=['2030-12-29','2030-12-30','2030-12-31','2031-1-1','2031-1-2','2031-1-3','2031-1-4'];for(const date of dates)DailyPlay.visit(date);const reward=Save.d.coins===987804&&Save.d.bag.pudding===1&&Save.d.daily.cycles===1&&Save.d.daily.stamps===7;const once=!DailyPlay.visit('2031-1-4')&&!DailyPlay.visit('2030-12-30');const exact=initial===JSON.stringify({wardrobe:Save.d.wardrobe,furn:Save.d.furn,room:Save.d.room});DailyPlay.visit('2031-2-6');const next=Save.d.daily.stamps===1&&Save.d.daily.total===8&&Save.d.coins===987804;const backup=SaveBackup.decode(SaveBackup.encode()).daily.total===8;Save.d=before;return{reward,once,exact,next,backup};})()`,ctx);
for(const [key,value]of Object.entries(dailyFixture))ok(value,'毎日スタンプ '+key+' の検査失敗');
ok(R.BAG_INDEX.pudding?.deza===true||R.BAG_INDEX.pudding?.dessert===true||R.BAG_INDEX.pudding?.kind==='food','スタンプ景品のプリンがない');
// 吹き出しの見本は図形や候補を省略せずに移植する。
const bubbleRef=vm.runInNewContext(readFileSync(join(GAME,'tools/feature-design/home-bubble-ref.js'),'utf8')+';HomeBubbleRef');
const bubbles=vm.runInContext('HomeBubbles',ctx);
for(const key of ['S','COLOR','FILL'])ok(JSON.stringify(bubbles[key])===JSON.stringify(bubbleRef[key]),'吹き出し定数 '+key+' が見本と違う');
for(const key of ['life','wrap','layout','shape','draw'])ok(bubbles[key].toString().replace(/\r\n/g,'\n')===bubbleRef[key].toString().replace(/\r\n/g,'\n'),'吹き出し '+key+' が見本と違う');
for(const n of [0,1,10,100])ok(bubbles.life('あ'.repeat(n))>=2.4&&bubbles.life('あ'.repeat(n))<=5.5,'吹き出し寿命が範囲外');
const measure={measureText:s=>({width:Array.from(s).length*12})};
for(const kind of ['say','shout','cry','think','whisper','rare']){
  const heads={wanko:{x:120,y:320,r:18},gachan:{x:230,y:335,r:18},goji:{x:180,y:380,r:18}};
  const boxes=bubbles.layout(measure,[{id:'wanko',text:'みんな なかよし',kind},{id:'gachan',text:'いっしょに あそぼ',kind:'say'}],heads,{top:120,bottom:500,left:8,right:352});
  ok(boxes.length===2&&boxes.every(b=>Number.isFinite(b.score)&&b.x>=8&&b.y>=120&&b.x+b.w<=352&&b.y+b.h<=500),'吹き出し配置が不正 '+kind);
}

const bubbleFlow=vm.runInContext(`(()=>{const old=Save.d,oldT=G.t;Save.d=Save.fresh();const money=Save.d.coins;
const sc={life:{bubbles:[],queue:[],talkWait:0,log:[]}};G.t=10;
HomeLife.say(sc,'wanko','いち');HomeLife.say(sc,'gachan','に');HomeLife.say(sc,'goji','さん');const latest=sc.life.bubbles.map(b=>b.id).join();
HomeLife.say(sc,'goji','ガゥ','', 'shout');const replace=sc.life.bubbles.length===2&&sc.life.bubbles[1].text==='ガゥ';
HomeLife.converse(sc,[{who:'wanko',text:'わん'},{who:'gachan',text:'ぴよ'},{who:'goji',text:'ガゥ'}]);const first=sc.life.log.at(-1).id;HomeLife.advance(sc,1.2);const waiting=sc.life.log.at(-1).id===first;G.t+=1.3;HomeLife.advance(sc,.1);const second=sc.life.log.at(-1).id;G.t+=1.3;HomeLife.advance(sc,1.3);const third=sc.life.log.at(-1).id;
const unchanged=Save.d.coins===money;Save.d=old;G.t=oldT;return {latest,replace,first,waiting,second,third,unchanged};})()`,ctx);
ok(bubbleFlow.latest==='gachan,goji'&&bubbleFlow.replace,'吹き出しの2個上限・同じ話者の置換が不正');
ok(bubbleFlow.first==='wanko'&&bubbleFlow.waiting&&bubbleFlow.second==='gachan'&&bubbleFlow.third==='goji','3人の順番・1.3秒間隔が不正');
ok(bubbleFlow.unchanged,'吹き出しでおかねが変わった');

// ① おうちの 会話データ（HOME_TALK_DATA）: 数・条件の キーと 値・同じ 文が ない・1行 26・かけあいの つながり
const HT = vm.runInContext(`typeof HOME_TALK_DATA !== "undefined" ? HOME_TALK_DATA : null`, ctx);
if (ok(!!HT, "HOME_TALK_DATA が ない（js/home-talk-data.js）")) {
  const WHO = ["wanko", "gachan", "goji", "papa", "mama"], KIDS = WHO.slice(0, 3), KINDS = ["say", "shout", "cry", "think", "whisper"];
  const VALUES = { time: ["morning", "day", "evening", "night", "late"], weather: Object.keys(R.Weather.kinds), season: ["spring", "summer", "autumn", "winter"],
    festival: R.ANNUAL_EVENTS.map((e) => e.id), room: R.HomeRooms.catalog.map((r) => r.id), near: [...Object.keys(R.FURN_INDEX), "bed"],
    state: ["hungry", "full", "deza", "happy", "sad"], event: ["return", "win", "work", "dress", "edit", "watch"] };
  const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
  const whenOk = (w, where) => { for (const [k, vs] of Object.entries(w || {})) { if (!ok(!!VALUES[k], `${where}: 条件の キー ${k} が ない`)) continue; for (const v of vs) ok(VALUES[k].includes(v), `${where}: ${k} の 値 ${v} が ゲームに ない`); } };
  const turns = HT.talks.reduce((a, t) => a + t.turns.length, 0);
  ok(HT.lines.length + HT.talks.length >= 500, `おうちの 会話が 500 より すくない（${HT.lines.length}＋${HT.talks.length}）`);
  const texts = new Set(), ids = new Set();
  for (const l of HT.lines) {
    ok(!ids.has(l.id), `おうちの セリフの id ${l.id} が かさなる`); ids.add(l.id);
    ok(!texts.has(l.text), `おうちの セリフが かさなる: ${l.text}`); texts.add(l.text);
    ok(WHO.includes(l.who) && KINDS.includes(l.kind || "say"), `${l.id}: who / kind が 不正`);
    ok(["context", "persona", "parent", "rare"].includes(l.group) && ((l.group === "parent") === !KIDS.includes(l.who)), `${l.id}: group が 不正（parent は ぱぱ・ままだけ）`);
    for (const row of l.text.split("\n")) ok(width(row) <= 26, `${l.id}: 1行が 26 より ながい「${row}」`);
    whenOk(l.when, l.id);
  }
  const talkIds = new Set();
  for (const t of HT.talks) {
    ok(!talkIds.has(t.id), `かけあいの id ${t.id} が かさなる`); talkIds.add(t.id);
    ok(t.turns.length >= 2 && t.turns.every((x) => WHO.includes(x.who) && KINDS.includes(x.kind || "say")), `かけあい ${t.id}: turns が 不正`);
    ok(t.turns.some((x) => KIDS.includes(x.who)), `かけあい ${t.id}: 3人が だれも いない`);
    for (const x of t.turns) for (const row of x.text.split("\n")) ok(width(row) <= 26, `かけあい ${t.id}: 1行が 26 より ながい「${row}」`);
    whenOk(t.when, t.id);
  }
  for (const tr of ["quarrel", "settle", "sniff3", "alone", "thunder"]) ok(HT.talks.some((t) => t.trigger === tr), `trigger ${tr} の かけあいが ない`);
  for (const [who, rules] of Object.entries(HT.voice)) for (const [name, r] of Object.entries(rules)) if (r.talk) ok(talkIds.has(r.talk), `voice ${who}.${name} の かけあい ${r.talk} が ない`);
  ok(KIDS.every((id) => HT.lines.filter((l) => l.who === id && l.group === "persona").length >= 30), "3人の 性格の セリフが たりない");
  ok(turns > 0, "かけあいの セリフが ない");
  // えらびかたと くせ（ゲームと 同じ 関数を VM で うごかす）
  const talkFlow = vm.runInContext(`(()=>{const old=Save.d,oldHour=U.hourNow,oldW=Weather.override,oldT=G.t,rnd=Math.random;Save.d=Save.fresh();const money=Save.d.coins;
    const sc={chars:[{id:'wanko',x:200,y:430},{id:'gachan',x:280,y:465},{id:'goji',x:360,y:430}],parents:[],watching:false,anchor:(it)=>({x:it.x,y:it.y}),view:{top:120,bottom:700},actorScale:1,toScreen:(x,y)=>({x,y})};
    U.hourNow=()=>7;HomeLife.init(sc);G.t=5;Weather.override='rain';
    const t=[];for(let i=0;i<40;i++){const l=HomeLife.pickLine(sc,'wanko',['context','persona'],'time');if(l)t.push(l);}
    const morning=t.length>0&&t.every(l=>l.when.time.includes('morning'));
    const w=HomeLife.pickLine(sc,'gachan',['context','persona'],'weather');const rain=!!w&&w.when.weather.includes('rain');
    const pool=HOME_TALK_DATA.lines.filter(l=>l.who==='goji'&&l.group==='context'&&U.condScore(l.when,HomeLife.talkCtx(sc,sc.chars[2]))>=0).length,n=Math.min(40,pool);
    const recent=new Set();for(let i=0;i<n;i++){const l=HomeLife.pickLine(sc,'goji',['context']);HomeLife.sayLine(sc,l);recent.add(l.id);}const noRepeat=n>=10&&recent.size===n;
    Math.random=()=>0;const pre=HomeLife.gojiVoice('あそぼう','say');const keep=HomeLife.gojiVoice('ガウー！ あそぼう','say');Math.random=()=>0.1;const suf=HomeLife.gojiVoice('あそぼう','say');Math.random=rnd;
    Save.d.room.items=[{uid:1,id:'piano',x:200,y:425}];const near=HomeLife.nearFurn(sc,sc.chars[0]).map(n=>n.key).join();const far=HomeLife.nearFurn(sc,sc.chars[2]).length;
    const v=HOME_TALK_DATA.voice.wanko.sniff;sc.life.queue=[];HomeLife.sniff(sc,{key:'piano',name:'ピアノ'},v);HomeLife.sniff(sc,{key:'piano',name:'ピアノ'},v);const two=sc.life.queue.length===0&&sc.life.log.at(-1).text.includes('ピアノ');
    HomeLife.sniff(sc,{key:'piano',name:'ピアノ'},v);const scold=sc.life.log.at(-1).talk==='sniff-scold'&&sc.life.queue.some(x=>x.who==='mama');
    sc.life.queue=[];sc.life.time=100;sc.chars[1].y=760;HomeLife.alone(sc,5);const notYet=sc.life.log.at(-1).talk!=='not-alone';HomeLife.alone(sc,4);const alone=sc.life.log.at(-1).talk==='not-alone';sc.chars[1].y=465;
    sc.life.time=0;const ctxEv=HomeLife.talkCtx(sc,null).event.includes('return');sc.life.time=25;const ctxEnd=!HomeLife.talkCtx(sc,null).event.includes('return');
    const unchanged=Save.d.coins===money;Save.d=old;U.hourNow=oldHour;Weather.override=oldW;G.t=oldT;
    return {morning,rain,noRepeat,pre,keep,suf,near,far,two,scold,notYet,alone,ctxEv,ctxEnd,unchanged};})()`, ctx);
  ok(talkFlow.morning, "あさ（7時）なのに あさ いがいの 時間の セリフを えらんだ");
  ok(talkFlow.rain, "あめの 日に 天気の セリフを えらばない");
  ok(talkFlow.noRepeat, "さいきん 40この セリフを くりかえした");
  ok(talkFlow.pre === "ガウっ！ あそぼう" && talkFlow.keep === "ガウー！ あそぼう" && talkFlow.suf === "あそぼう …ガゥ", `ごじの くせが 不正（${talkFlow.pre} / ${talkFlow.keep} / ${talkFlow.suf}）`);
  ok(talkFlow.near === "piano" && talkFlow.far === 0, `近くの 家具の 判定が 不正（${talkFlow.near} / ${talkFlow.far}）`);
  ok(talkFlow.two && talkFlow.scold, "わんこの クンクン（3回で ままに おこられる）が 不正");
  ok(talkFlow.notYet && talkFlow.alone, "がちゃんの ひとりは いや（120 はなれて 8秒）が 不正");
  ok(talkFlow.ctxEv && talkFlow.ctxEnd, "帰って 20秒の できごと（return）が 不正");
  ok(talkFlow.unchanged, "会話で おかねが 変わった");
}

// ② 町の人の セリフ（TOWNSFOLK_DATA）: 町の人 みんなに セリフ・条件の キーと 値・会話まどに 入る 長さ・えらびかた
const TF = vm.runInContext(`typeof TOWNSFOLK_DATA !== "undefined" ? TOWNSFOLK_DATA : null`, ctx);
if (ok(!!TF, "TOWNSFOLK_DATA が ない（js/townsfolk-data.js）")) {
  // ⑤ 館の 人（role: "donate"）は 館の ことば（MUSEUM_DATA.talk → TALKS）で 話す
  const npcIds = Object.values(R.MAP_DEFS).flatMap((d) => (d.npcs || []).filter((n) => n.role !== "donate").map((n) => n.id)), npcSet = new Set(npcIds);
  const who = new Set(TF.lines.map((l) => l.npc)), roles = new Set(Object.values(TF.crowd));
  for (const id of npcIds) ok(who.has(TF.crowd[id] || id), `町の人 ${id} の セリフが ない（役 ${TF.crowd[id] || "-"}）`);
  for (const r of roles) ok(!!TF.crowdNames[r], `町の なかま ${r} の 名前が ない`);
  for (const [id, r] of Object.entries(TF.crowd)) ok(npcSet.has(id), `crowd の ${id}（${r}）が ゲームに いない`);
  const VAL = { time: ["morning", "day", "evening", "night", "late"], weather: Object.keys(R.Weather.kinds), season: ["spring", "summer", "autumn", "winter"],
    festival: R.ANNUAL_EVENTS.map((e) => e.id), event: ["boss"], person: npcIds, feature: ["fishing", "fossil", "aquarium", "museum", "range", "heiwadai2"].flatMap((f) => [f, "!" + f]) };
  const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
  const check = (l, where) => {
    const rows = l.text.split("\n"); ok(rows.length <= 4 && rows.every((r) => width(r) <= 30), `${where}: 会話まどに 入らない「${l.text}」`);
    for (const [k, vs] of Object.entries(l.when || {})) { if (k === "bond") { ok(vs.every((v) => Number.isFinite(+v) && +v > 0), `${where}: bond の 値が 不正`); continue; } if (!ok(!!VAL[k], `${where}: 条件の キー ${k} が ない`)) continue; for (const v of vs) ok(VAL[k].includes(v), `${where}: ${k} の 値 ${v} が ゲームに ない`); }
  };
  const ids = new Set();
  for (const l of TF.lines) { ok(!ids.has(l.id), `町の人の セリフの id ${l.id} が かさなる`); ids.add(l.id); ok(npcSet.has(l.npc) || roles.has(l.npc), `${l.id}: ${l.npc} が ゲームに いない`); ok(["line", "bond", "crowd"].includes(l.group), `${l.id}: group が 不正`); check(l, l.id); }
  for (const r of TF.react) { ok(!ids.has(r.id), `ひとことの id ${r.id} が かさなる`); ids.add(r.id); ok(R.Chara.IDS.includes(r.who), `${r.id}: who が 3人で ない`); check(r, r.id); }
  ok(TF.lines.length >= 230 && TF.react.length >= 30, `町の人の セリフが すくない（${TF.lines.length} ／ ひとこと ${TF.react.length}）`);
  const folkFlow = vm.runInContext(`(()=>{const old=Save.d,oldHour=U.hourNow,oldW=Weather.override;Save.d=Save.fresh();U.hourNow=()=>7;Weather.override='clear';
    const crowdId=Object.keys(TOWNSFOLK_DATA.crowd)[0],role=TOWNSFOLK_DATA.crowd[crowdId];
    const crowd=[...Array(8)].map(()=>TownFolk.line({id:crowdId,name:'まちの なかま'})).every(l=>l&&l.npc===role),name=TownFolk.name({id:crowdId,name:'まちの なかま'})===TOWNSFOLK_DATA.crowdNames[role];
    TownFolk.recent={};const pool=TOWNSFOLK_DATA.lines.filter(l=>l.npc==='mayor'&&U.condScore(l.when,TownFolk.context('mayor'))>=0).length,n=Math.min(pool,TownFolk.RECENT);
    const got=[...Array(60)].map(()=>TownFolk.line({id:'mayor',name:'x'}));const f=TownFolk.features();
    const okWhen=got.every(l=>l&&(!l.when.time||l.when.time.includes('morning'))&&(!l.when.weather||l.when.weather.includes('clear'))&&!l.when.bond&&(!l.when.feature||l.when.feature.every(v=>v[0]==='!'?!f[v.slice(1)]:f[v])));
    const fresh=n>=3&&new Set(got.slice(0,n).map(l=>l.id)).size===n;
    const react=[...Array(20)].map(()=>TownFolk.react({id:'mayor'})).every(r=>r&&(!r.when.person||r.when.person.includes('mayor')));
    Save.d=old;U.hourNow=oldHour;Weather.override=oldW;return {crowd,name,okWhen,fresh,react};})()`, ctx);
  ok(folkFlow.crowd && folkFlow.name, "町の なかまが 役の セリフ・名前を つかわない");
  ok(folkFlow.okWhen, "町の人の セリフが 条件（時間・天気・なかよし・しせつ）に あわない");
  ok(folkFlow.fresh, "町の人の さいきんの セリフを くりかえした");
  ok(folkFlow.react, "3人の ひとことが 話した あいての 条件に あわない");
  // おねがい（20種）: かくりつ 10〜20%・人と マップ・アイテム／家具／服・文の 長さ
  const mapOf = Object.fromEntries(Object.entries(R.MAP_DEFS).flatMap(([m, d]) => (d.npcs || []).map((n) => [n.id, m])));
  ok(TF.events.length >= 20 && new Set(TF.events.map((e) => e.id)).size === TF.events.length, `おねがいが 20 より すくない／id が かさなる（${TF.events.length}）`);
  const item = (id) => !!TF.items[id] || !!R.BAG_INDEX[id];
  for (const e of TF.events) {
    const w = `おねがい ${e.id}`;
    ok(e.chance >= 0.1 && e.chance <= 0.2, `${w}: 出る かくりつ ${e.chance} が 10〜20% で ない`);
    ok(mapOf[e.giver] === e.map, `${w}: たのむ人 ${e.giver} が ${e.map} に いない`);
    ok(mapOf[e.doneBy], `${w}: おわりの 人 ${e.doneBy} が いない`);
    ok(["daily", "once"].includes(e.limit), `${w}: limit が 不正`);
    for (const t of [e.lines.offer, e.lines.remind, e.lines.done]) { const rows = t.split("\n"); ok(rows.length <= 4 && rows.every((r) => width(r) <= 30), `${w}: 会話まどに 入らない「${t}」`); }
    for (const st of e.steps) {
      if (st.to) ok(!!mapOf[st.to] && (!st.map || mapOf[st.to] === st.map), `${w}: ${st.do} の あいて ${st.to} が ${st.map || "どこか"} に いない`);
      if (st.item && ["buy", "give", "find"].includes(st.do)) ok(item(st.item), `${w}: アイテム ${st.item} が ない`);
      if (st.do === "trade") for (const [npc, it, txt] of st.chain) { ok(!!mapOf[npc] && item(it), `${w}: わらしべの ${npc} / ${it} が ない`); ok(txt.split("\n").every((r) => width(r) <= 30), `${w}: わらしべの 文が ながい`); }
      if (st.do === "quiz") for (const [q, ch, ans] of st.q) ok(ch.length >= 2 && ans >= 0 && ans < ch.length && width(q) <= 60, `${w}: なぞなぞ「${q}」が 不正`);
    }
    for (const r of [e.reward, e.reward.first || {}]) { if (r.bag) ok(!!R.BAG_INDEX[r.bag], `${w}: ごほうび ${r.bag} が ない`); if (r.furn) ok(!!R.FURN_INDEX[r.furn], `${w}: ごほうびの 家具 ${r.furn} が ない`); if (r.wear) ok(!!R.ITEM_INDEX[r.wear], `${w}: ごほうびの 服 ${r.wear} が ない`); }
    for (const id of Object.keys(e.reward.bond || {})) ok(!!mapOf[id], `${w}: なかよしの ${id} が いない`);
  }
  // おねがいの ながれ（ゲームと 同じ 関数を VM で）: うける → かう → わたす → おわり・ことわると まつ・3つまで
  const reqFlow = vm.runInContext(`(()=>{const old=Save.d,rnd=Math.random;Save.d=Save.fresh();const st=Save.d.folk;
    const ev=TownFolk.event('ev-milk');TownFolk.answer({type:'event',ev},true);const took=st.req.length===1&&st.offered.sheep&&!st.offered.sheep.wait;
    const none=TownFolk.signal({do:'talk',npc:'sheep',map:'town'}).length===0;Save.d.bag.milk=1;
    const m=TownFolk.signal({do:'talk',npc:'sheep',map:'town'});const done=m.length===2&&m[1].done&&st.done['ev-milk']===TownFolk.today()&&st.req.length===0;
    const rw=JSON.stringify(TownFolk.rewards(ev,true))==='[{"coins":80}]'&&TownFolk.bondOf(ev).sheep===2;
    const b=TownFolk.event('ev-bread3');TownFolk.answer({type:'event',ev:b},false);const wait=st.offered.penguin.wait==='ev-bread3'&&TownFolk.markerOf('penguin','town')==='offer'&&TownFolk.offer('penguin').ev.id==='ev-bread3';
    const again=TownFolk.offer('sheep')===null;
    TownFolk.answer({type:'event',ev:TownFolk.event('ev-msg-flower')},true);const target=TownFolk.markerOf('rabbit','town')==='target';
    TownFolk.answer({type:'event',ev:TownFolk.event('ev-letter')},true);TownFolk.answer({type:'event',ev:TownFolk.event('ev-quiz')},true);
    Math.random=()=>0;const full=st.req.length===3&&TownFolk.offer('cat')===null&&TownFolk.offer('pig')===null;Math.random=rnd;
    const carry=st.req.find(r=>r.id==='ev-letter').carry==='letter';
    const ready=TOWNSFOLK_DATA.events.filter(e=>TownFolk.ready(e)).map(e=>e.id).length>=10;
    Save.d=old;return {took,none,done,rw,wait,again,target,full,carry,ready};})()`, ctx);
  ok(reqFlow.took && reqFlow.none && reqFlow.done, "おねがい（かう → わたす）の ながれが 不正");
  ok(reqFlow.rw, "おねがいの ごほうび・なかよしが 不正");
  ok(reqFlow.wait && reqFlow.again, "ことわった おねがいを まつ／1日 1回の きまりが 不正");
  ok(reqFlow.target && reqFlow.carry, "おねがいの あいての しるし・とどける もちものが 不正");
  ok(reqFlow.full, "おねがいが 3つを こえて もちかけられた");
  ok(reqFlow.ready, "いま すすめられる おねがいが 10 より すくない");
  // 物々交換（16種）: 人・わたす／もらう もの・文の 長さ。さかな・ほねの こうかんは ③④ が できるまで needs で 出ない
  ok(TF.barter.length >= 16 && new Set(TF.barter.map((b) => b.id)).size === TF.barter.length, `物々交換が 16 より すくない／id が かさなる（${TF.barter.length}）`);
  for (const b of TF.barter) {
    const w = `物々交換 ${b.id}`, needs = b.needs || [];
    ok(!!mapOf[b.npc], `${w}: ${b.npc} が いない`);
    for (const o of [b.give, b.get]) {
      if (o.bag) ok(!!R.BAG_INDEX[o.bag], `${w}: もちもの ${o.bag} が ない`);
      else if (o.furn) ok(!!R.FURN_INDEX[o.furn], `${w}: 家具 ${o.furn} が ない`);
      else if (o.wear) ok(!!R.ITEM_INDEX[o.wear], `${w}: 服 ${o.wear} が ない`);
      else ok((o.fish && needs.includes("fishing")) || (o.bone && needs.includes("fossil")), `${w}: さかな・ほねの こうかんに needs が ない`);
    }
    const rows = b.text.split("\n"); ok(rows.length <= 4 && rows.every((r) => width(r) <= 30), `${w}: 会話まどに 入らない「${b.text}」`);
  }
  // さがす・さわる ばしょ: 入口から 行ける マスに かずだけ・4マス いじょう はなれる・あたりは 1つ・その日の あいだ かわらない・小物の 絵が ある
  const spotFlow = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const out=[];
    for(const e of TOWNSFOLK_DATA.events){const i=e.steps.findIndex(s=>s.do==='find'||s.do==='tap');if(i<0)continue;const s=e.steps[i];
      Save.d.folk.req=[{id:e.id,step:i,n:0,day:'2026-9-28',carry:null}];TownFolk.spotCache={};
      const a=TownFolk.spotsOn(s.map);TownFolk.spotCache={};const b=TownFolk.spotsOn(s.map),need=s.do==='find'?s.spots:s.n,tiles=new Set(TownFolk.reach(s.map).tiles.map(p=>p+''));
      out.push({id:e.id,n:a.length===need,apart:a.every((p,j)=>a.every((q,k)=>j===k||Math.abs(p.x-q.x)+Math.abs(p.y-q.y)>=4)),reach:a.every(p=>tiles.has(p.x+','+p.y)),
        hit:s.do!=='find'||a.filter(p=>p.hit).length===1,same:JSON.stringify(a)===JSON.stringify(b),art:a.every(p=>!!TownFolkArt.PROP[p.prop])});}
    Save.d.folk.req=[];TownFolk.spotCache={};Save.d=old;return out;})()`, ctx);
  ok(spotFlow.length >= 7, `さがす・さわる おねがいが すくない（${spotFlow.length}）`);
  for (const r of spotFlow) ok(r.n && r.apart && r.reach && r.hit && r.same && r.art, `おねがい ${r.id}: さがす／さわる ばしょが 不正 ${JSON.stringify(r)}`);
  // さがす → とどける・こねこを つれて いく・さわる 3かい・しゃしんの ばしょ（ゲームと 同じ 関数で）
  const stepFlow = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const st=Save.d.folk,take=(id)=>TownFolk.answer({type:'event',ev:TownFolk.event(id)},true);
    take('ev-lost-hat');const hat=TownFolk.signal({do:'find',map:'meadow',item:'hat'}).length===1&&st.req[0].carry==='hat'&&st.req[0].step===1;st.req=[];
    take('ev-lost-kitten');const found=TownFolk.signal({do:'find',map:'town',npc:'kitten'}).length===1&&TownFolk.following();
    const kitten=found&&TownFolk.signal({do:'talk',npc:'cat',map:'town'}).some(m=>m.done)&&!TownFolk.following()&&st.done['ev-lost-kitten'];
    take('ev-water');let n=0;for(let i=0;i<3;i++)n+=TownFolk.signal({do:'tap',target:'flowerbed',map:'town'}).length;
    const water=n===3&&st.req.find(r=>r.id==='ev-water').step===1&&TownFolk.signal({do:'tap',target:'flowerbed',map:'town'}).length===0;
    take('ev-photo');const m=Maps.get('city');let tile=null;for(let y=0;y<m.h&&!tile;y++)for(let x=0;x<m.w&&!tile;x++)if(!m.isSolid(x,y)&&TownFolk.photoSpot('city',x,y))tile=[x,y];
    const photo=!!tile&&TownFolk.photoSpot('city',1,1)===null&&TownFolk.signal({do:'photo',map:'city',near:'city_fountain'}).length===1&&TownFolk.photoSpot('city',tile[0],tile[1])===null;
    const ready=TOWNSFOLK_DATA.events.every(e=>TownFolk.ready(e));
    const gated=TOWNSFOLK_DATA.events.every(e=>!e.steps.some(s=>s.do==='catch')||(e.needs||[]).includes('fishing'))&&TOWNSFOLK_DATA.events.every(e=>!e.steps.some(s=>s.do==='dig')||(e.needs||[]).includes('fossil'));
    Save.d=old;return {hat,kitten,water,photo,ready,gated};})()`, ctx);
  ok(stepFlow.hat && stepFlow.kitten, "さがす（ぼうし・こねこ）の ながれが 不正");
  ok(stepFlow.water, "さわる（みずやり 3かい）の ながれが 不正");
  ok(stepFlow.photo, "しゃしんの ばしょ・ながれが 不正");
  ok(stepFlow.ready && stepFlow.gated, "すすめられない 手順の おねがいが ある／釣り・化石の おねがいに needs が ない");
}

// ③ 釣り（FISHING_DATA・FishArt・Fishing）: 50種の 値・どの 季節と 時間にも 2しゅ いじょう・文の 長さ・釣り場・絵・ずかんの きろく
const FD = vm.runInContext(`typeof FISHING_DATA !== "undefined" ? FISHING_DATA : null`, ctx);
if (ok(!!FD, "FISHING_DATA が ない（js/fishing-data.js）")) {
  const PL = ["pond", "river", "stream", "beach", "harbor"], SE = ["spring", "summer", "autumn", "winter"], TI = ["morning", "day", "evening", "night", "late"];
  const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
  const text = (t, where, maxW) => { const r = String(t || "").split("\n"); ok(!!t && r.length <= 2 && r.every((x) => width(x) <= maxW) && !/[a-zA-Z]{2,}/.test(t), `${where}: 文が ない／2行を こえる／1行が 長い「${t}」`); };
  const vals = (v, all, where) => ok(v === "all" || (Array.isArray(v) && v.length > 0 && v.every((x) => all.includes(x))), `${where}: 値が 不正 ${JSON.stringify(v)}`);
  ok(FD.fish.length === 50 && new Set(FD.fish.map((f) => f.id)).size === 50, `魚が 50しゅ で ない／id が かさなる（${FD.fish.length}）`);
  const weathers = Object.keys(R.Weather.kinds);
  for (const f of FD.fish) {
    const w = `魚 ${f.id}`;
    ok(PL.includes(f.place) && (f.also || []).every((a) => PL.includes(a) && a !== f.place), `${w}: place／also が 不正`);
    vals(f.season, SE, w + " の season"); vals(f.time, TI, w + " の time"); if (f.weather) vals(f.weather, weathers, w + " の weather");
    ok(f.rarity >= 1 && f.rarity <= 5 && f.power >= 1 && f.power <= 5 && f.size[0] > 0 && f.size[1] >= f.size[0] && f.sell > 0 && f.art && f.art.h > 0, `${w}: rarity／power／size／sell／art が 不正`);
    text(f.desc, w + " の 説明", 22); text(f.fact, w + " の まめちしき", 23);
  }
  // どの 場所・季節・時間でも つれる（でんせつ rarity 5 と unlock を のぞいて 2しゅ いじょう。見本 build-fishing.mjs と おなじ）
  const thin = vm.runInContext(`(()=>{const out=[];for(const p of ${JSON.stringify(PL)})for(const s of ${JSON.stringify(SE)})for(const t of ${JSON.stringify(TI)}){const n=Fishing.pool(p,{season:s,time:t,weather:"clear",rodPower:1},0).filter(x=>x.f.rarity<=4).length;if(n<2)out.push(p+"/"+s+"/"+t+":"+n);}return out;})()`, ctx);
  ok(!thin.length, `つれる 魚が 2しゅ より すくない ときが ある: ${thin.join(", ")}`);
  // 釣り場: マップが あって、水べ（'~' の となりの 歩ける マス）が 3 いじょう
  for (const [map, sp] of Object.entries(FD.spots)) {
    ok(PL.includes(sp.place) && !!R.MAP_DEFS[map], `釣り場 ${map}: マップ／place が 不正`);
    if (!R.MAP_DEFS[map]) continue;
    const shore = vm.runInContext(`(()=>{const m=new WorldMap(${JSON.stringify(map)}),d=MAP_DEFS[${JSON.stringify(map)}];let n=0;for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++){if(m.isSolid(x,y))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>(d.rows[y+dy]||"")[x+dx]==="~"))n++;}return n;})()`, ctx);
    ok(shore >= 3, `釣り場 ${map}: 水べの マスが ${shore}（3 いじょう）`);
  }
  for (const p of PL) ok(Object.values(FD.spots).some((s) => s.place === p), `${p} の 釣り場が ない`);
  ok(FD.rods.some((r) => r.id === "rod") && FD.rods.some((r) => r.id === "rod_pro"), "つりざお（rod・rod_pro）が ない");
  // 絵: 50しゅ × ずかん・くわしい ページの uid と かげ 5つ。ちがう uid の 絵で id が かさならない
  const arts = vm.runInContext(`FISHING_DATA.fish.map(f=>({id:f.id,d:FishArt.svg(f.art,{uid:"d"+f.id,flip:!!f.flip}),x:FishArt.svg(f.art,{uid:"x"+f.id,flip:!!f.flip})}))`, ctx);
  const seenIds = new Set();
  for (const a of arts) {
    svgOk(a.d, `魚 ${a.id} の 絵`); svgOk(a.x, `魚 ${a.id} の 絵（くわしい ページ）`);
    for (const svg of [a.d, a.x]) for (const m of svg.matchAll(/\bid="([^"]+)"/g)) { ok(!seenIds.has(m[1]), `魚の 絵の id ${m[1]} が かさなる`); seenIds.add(m[1]); }
  }
  for (const k of ["S", "M", "L", "XL", "thin"]) svgOk(vm.runInContext(`FishArt.shadow(${JSON.stringify(k)})`, ctx), `魚の かげ ${k}`);
  // ずかんの きろく（Fishing.record）と、つりざおが ない あいだは ② の 釣りの 話が 出ない
  const dexFlow = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const st=Save.d.fish;
    const first=Fishing.record("magoi",40.5)===true,second=Fishing.record("magoi",62)===false;
    const rec=st.dex.magoi.n===2&&st.dex.magoi.max===62&&st.keep.magoi===2&&st.caught===2&&st.dex.magoi.first===U.today();
    const noRod=!TownFolk.features().fishing;st.rod=1;const rod=TownFolk.features().fishing;
    const sizes=FISHING_DATA.fish.every(f=>{const c=Fishing.size(f);return c>=f.size[0]&&c<=f.size[1];});
    Save.d=old;return {first,second,rec,noRod,rod,sizes};})()`, ctx);
  ok(dexFlow.first && dexFlow.second && dexFlow.rec, "さかな ずかんの きろく（かず・いちばん 大きい・いけす）が 不正");
  ok(dexFlow.noRod && dexFlow.rod, "つりざおの ない あいだも ② の 釣りの 話・おねがいが 出る");
  ok(dexFlow.sizes, "魚の 大きさが データの はんいを こえる");
  // 2番（UI-02・js/fishing-line.js）: 見おろしの まま つる（どうぶつの森と おなじ ながれ）。よこから 見る 画面は もう ない
  ok(vm.runInContext(`typeof SCENES.fishing === "undefined" && typeof FishingScene === "undefined" && typeof Fishing.card === "undefined"`, ctx), "よこから 見る 釣りの 画面（SCENES.fishing・つれた カード）が のこって いる");
  const FL = vm.runInContext(`(()=>{
    // かげの ながさは cm に 比例（1cm = PX_PER_CM px。ちいさすぎ・大きすぎる ときだけ MIN_PX〜MAX_PX に おさめる）
    const lens = [3, 10, 12, 20, 50, 80, 100, 150, 160, 250, 500].map((cm) => [cm, FishLine.shadowLen(cm)]);
    // どの 魚も 自分の 釣り場の マップに 出せる（いちばん 大きい とき・岸から さおが とどく 水の 中）
    const nofit = [];
    for (const [map, sp] of Object.entries(FISHING_DATA.spots)) {
      const m = new WorldMap(map), tiles = FishLine.waterTiles(m);
      for (const f of FISHING_DATA.fish.filter((f) => f.place === sp.place || (f.also || []).includes(sp.place))) {
        const len = FishLine.shadowLen(f.size[1]), wid = FishLine.shadowWid(f, len); let fit = false;
        for (const [tx, ty] of tiles) { for (let k = 0; k < 8 && !fit; k++) for (const [ox, oy] of [[16, 16], [8, 8], [24, 24], [8, 24], [24, 8], [16, 0], [0, 16]]) if (FishLine.fits(m, tx * TS + ox, ty * TS + oy, (k * Math.PI) / 4, len, wid)) { fit = true; break; } if (fit) break; }
        if (!fit) nofit.push(map + ":" + f.id + "(" + len + "px)");
      }
    }
    // ながれ: 岸に 立った 3人・まえに 魚を 1ぴき（あたまが こちら）・うきを あたまの まえに → 1/30びょう ずつ すすめる
    const old = Save.d; Save.d = Save.fresh(); Save.d.fish.rod = 1;
    const map = "coast", m = new WorldMap(map), D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    let at = null;
    for (let y = 1; y < m.h - 1 && !at; y++) for (let x = 1; x < m.w - 1 && !at; x++) { if (m.isSolid(x, y) || m.warpAt(x, y) || m.doorAt(x, y)) continue; for (const [dir, [dx, dy]] of Object.entries(D)) { let wet = true; for (let k = 1; k <= 6; k++) if (m.groundAt(x + dx * k, y + dy * k) !== "water" || m.groundAt(x + dx * k - dy, y + dy * k - dx) !== "water" || m.groundAt(x + dx * k + dy, y + dy * k + dx) !== "water") wet = false; if (wet) { at = { x, y, dir }; break; } } }
    const mk = () => { const w = [new Walker(at.x, at.y, at.dir), new Walker(at.x, at.y, at.dir), new Walker(at.x, at.y, at.dir)];
      return { mapId: map, map: m, party: w, cam: { x: 0, y: 0 }, path: null, joy: null, touch: null, busy: false, walkable: (X, Y) => !m.isSolid(X, Y), goTo() {}, addFx() {}, shadow() {}, bubble() {},
        screenToTile: (sx, sy) => ({ tx: Math.floor(sx / TS), ty: Math.floor(sy / TS), wx: sx, wy: sy }) }; };
    const rnd = TownFolk.rng("fishline-check");
    const setup = (nibbles, cm = 60, fid = "suzuki", fickle = 0) => {
      const sc = mk(), S = FishLine.st(sc); S.auto = false; S.rand = rnd;
      const [dx, dy] = D[at.dir], f = sc.party[0].feet(), cx = f.x + dx * 3.4 * TS, cy = f.y - 12 + dy * 3.4 * TS, a = Math.atan2(-dy, -dx);
      const sh = FishLine.spawn(sc, { fish: fid, cm, nibbles, fickle, alpha: 1, at: { x: cx, y: cy, a } });
      const h = FishLine.head(sh);
      return { sc, S, sh, bx: h.x - dx * 18, by: h.y - dy * 18, dx, dy };
    };
    const run = (sc, sec, until) => { const phases = []; for (let t = 0; t < sec; t += 1 / 30) { FishLine.update(sc, 1 / 30); const S = sc.fishing, p = S.line ? S.line.phase : S.brag ? "brag" : "none"; if (phases[phases.length - 1] !== p) phases.push(p); if (until && until(S)) break; } return phases; };
    // A: ちょんちょん 2かい → しずむ → つる で じまんへ
    const A = setup(2), castA = FishLine.castAt(A.sc, A.bx, A.by);
    const phA = run(A.sc, 20, (S) => S.line && S.line.phase === "bite");
    const nibA = A.S.line ? A.S.line.nibbled : -1, pullA = FishLine.pull(A.sc);
    const bragA = !!A.S.brag && A.S.brag.f.id === "suzuki" && A.S.brag.cm === 60 && !A.S.line && A.sc.busy && !A.S.shadows.includes(A.sh);
    // B: ちょん 1かい めで おす → にげる（さおを もどす）
    const B = setup(3); FishLine.castAt(B.sc, B.bx, B.by);
    run(B.sc, 20, (S) => S.line && S.line.nibbled >= 1);
    FishLine.pull(B.sc); const early = B.sh.state === "flee" && B.S.line && B.S.line.phase === "reel" && /はやすぎ/.test(FishLine.last || "");
    // C: しずんでも おさない → BITE びょう で にげられる（うきは のこる）
    const C = setup(0); FishLine.castAt(C.sc, C.bx, C.by);
    run(C.sc, 20, (S) => S.line && S.line.phase === "bite");
    const biteAt = C.S.line && C.S.line.phase === "bite"; run(C.sc, FishLine.BITE - 0.1);
    const stillBite = C.S.line && C.S.line.phase === "bite"; run(C.sc, 0.3);
    const late = biteAt && stillBite && C.S.line && C.S.line.phase === "float" && C.S.line.escaped === 1 && C.sh.state === "flee" && /にげられ/.test(FishLine.last || "");
    // D: かげの 上に おとすと びっくりして にげる
    const E = setup(1); FishLine.castAt(E.sc, E.sh.x, E.sh.y); run(E.sc, 2, (S) => S.line && S.line.phase === "float");
    const scare = E.sh.state === "flee" && /びっくり/.test(FishLine.last || "");
    // E: しっぽの うしろに おちても 気づかない
    const F = setup(1); F.sh.a += Math.PI; F.sh.aim = F.sh.a; const tail = { x: F.sh.x - Math.cos(F.sh.a) * (F.sh.len / 2 + 14), y: F.sh.y - Math.sin(F.sh.a) * (F.sh.len / 2 + 14) };
    FishLine.castAt(F.sc, tail.x, tail.y); run(F.sc, 1.2); const behind = F.S.line && !F.S.line.fish;
    // きまぐれ: ちょんの あと いって しまう ことも ある（fickle = 1 なら かならず）
    const K = setup(3, 60, "suzuki", 1); FishLine.castAt(K.sc, K.bx, K.by); run(K.sc, 12, (S) => S.line && S.line.nibbled >= 1); run(K.sc, 0.2);
    const fickle = K.S.line && !K.S.line.fish && K.sh.state === "swim" && K.sh.cool > 0;
    // F: うごくと さおを しまう
    const G2 = setup(1); FishLine.castAt(G2.sc, G2.bx, G2.by); run(G2.sc, 1.2); G2.sc.party[0].moving = true; FishLine.update(G2.sc, 1 / 30); const walk = !G2.S.line;
    // G: さおが ない ときは なげない・水の ないところは ながおししても なにも しない
    const H2 = setup(1); Save.d.fish.rod = 0; const noRod = FishLine.aim(H2.sc, H2.bx, H2.by) === false && !H2.S.line; Save.d.fish.rod = 1;
    const dn = mk(); FishLine.st(dn).auto = false; FishLine.down(dn, { id: 1, x: at.x * TS + 16, y: at.y * TS + 16 }); const dryPress = !dn.fishing.press;
    // ながおしは ほんとうの 時間で かぞえる（おそい 端末で 1コマ 200ms・dt は 0.05 でも 0.6びょう おせば なげる／0.45びょう すぎて はなしても なげる／みじかい おしは なげない）
    const now0 = FishLine.now; let clk = 0; FishLine.now = () => clk;
    const slow = (hold, frames, release) => { const L = setup(1), p = { id: 5, x: L.bx, y: L.by }; L.S.posed = true; L.sc.touch = { sx: p.x, sy: p.y, id: 5 }; FishLine.down(L.sc, p);
      for (let i = 0; i < frames; i++) { clk += hold / frames; FishLine.update(L.sc, 0.05); }
      if (release != null) { clk += release; WorldScene.prototype.up.call(L.sc, { ...p, tap: false }); }
      return !!L.S.line && !L.S.press; };
    const press = { slow: slow(600, 3, null), late: slow(300, 2, 200), short: slow(200, 2, 100) };
    FishLine.now = now0;
    // ちょんちょんの かず（0〜4。5かいめは かならず しずむ）
    const nib = new Set(); for (let i = 0; i < 3000; i++) nib.add(FishLine.rollNibbles(rnd));
    // じまんの ひとこと
    const quotes = FISHING_DATA.fish.map((f) => ({ id: f.id, q: FishLine.QUOTES[f.id] || "", line: FishLine.quote(f, f.size[1], "goji") }));
    // スーパーで うる
    Save.d.fish.keep = { kingyo: 2 }; const coins = Save.d.coins;
    const choiceM = Fishing.sellChoice({ shopId: "market", back: { map: "town" } }), choiceC = Fishing.sellChoice({ shopId: "clothes", back: { map: "town" } });
    const sold = Fishing.sellFish("kingyo", 1), left = Save.d.fish.keep.kingyo, none = Fishing.sellFish("magoi", 1), all = Fishing.sellFish("kingyo", 5);
    const sell = { choiceM, choiceC, sold, left, none, all, coins: Save.d.coins - coins, gone: !("kingyo" in Save.d.fish.keep), empty: Fishing.sellChoice({ shopId: "market", back: { map: "town" } }) };
    Save.d = old;
    return { lens, nofit, at: !!at, castA, phA, nibA, pullA, bragA, early, late, scare, behind, fickle, walk, noRod, dryPress, press, nib: [...nib].sort(), quotes, tails: ["wanko", "gachan", "goji"].every((k) => FishLine.TAIL[k]), sell, KEEP: Fishing.KEEP_MAX, bite: FishLine.BITE, sell1: FISHING_DATA.fish.find((f) => f.id === "kingyo").sell };
  })()`, ctx);
  const kanji = /[一-鿿]/, k = vm.runInContext("FishLine.PX_PER_CM", ctx), [mn, mx] = vm.runInContext("[FishLine.MIN_PX, FishLine.MAX_PX]", ctx);
  for (const [cm, len] of FL.lens) ok(len === Math.min(mx, Math.max(mn, Math.round(cm * k * 10) / 10)), `かげの ながさが cm に 比例 しない: ${cm}cm → ${len}px`);
  ok(FL.lens.every(([, l], i) => !i || l >= FL.lens[i - 1][1]), "大きい 魚ほど かげが 大きく ならない");
  ok(FL.nofit.length === 0, "自分の 釣り場の 水に おさまらない 魚が いる（その 魚は 出ない）: " + FL.nofit.join(", "));
  ok(FL.at && FL.castA, "しおかぜビーチで 岸から なげられない");
  ok(FL.phA.join(">").startsWith("swing>fly>float") && FL.phA.includes("bite") && FL.nibA === 2, "なげる → うき → ちょんちょん 2かい → しずむ に ならない " + FL.phA.join(">") + " nib " + FL.nibA);
  ok(FL.pullA && FL.bragA, "しずんだ ときに「つる」で つりあげて じまんに ならない");
  ok(FL.early, "ちょんちょんの ときに おしても にげない（はやすぎ）");
  ok(FL.late && FL.bite > 0.8 && FL.bite <= 1.2, `しずんで ${FL.bite}びょう おさないと にげられる に ならない`);
  ok(FL.scare, "かげの 上に おとしても びっくりしない");
  ok(FL.behind, "しっぽの うしろの うきに 魚が 気づく（あたまの まえ だけ 見える）");
  ok(FL.fickle, "ちょんの あと きが かわって いって しまう ことが ない");
  ok(FL.walk, "あるきだしても さおを しまわない");
  ok(FL.noRod && FL.dryPress, "さおが ない ときに なげる・水の ない ところの ながおしで 釣りが はじまる");
  ok(FL.press.slow && FL.press.late && !FL.press.short, "ながおしが フレームの はやさで かわる（おそい 端末で なげられない） " + JSON.stringify(FL.press));
  ok(FL.nib.join() === "0,1,2,3,4", "ちょんちょんの かずが 0〜4 に ならない " + FL.nib.join());
  for (const q of FL.quotes) {
    ok(q.q && !kanji.test(q.q) && q.q.length <= 24, `じまんの ひとこと ${q.id}: ない／漢字／24もじ より ながい「${q.q}」`);
    ok(q.line.includes("つりあげた！") && q.line.split("\n").length === 3 && /cm/.test(q.line), `じまんの ことば ${q.id} の 形が 不正`);
  }
  ok(FL.tails, "3人の くちぐせが そろって いない");
  const sl = FL.sell;
  ok(sl.choiceM === "さかなを うる" && !sl.choiceC && !sl.empty, "スーパー だけで・いけすに 魚が いる ときだけ「さかなを うる」に ならない " + JSON.stringify(sl));
  ok(sl.sold === FL.sell1 && sl.left === 1 && sl.none === 0 && sl.all === FL.sell1 && sl.gone && sl.coins === FL.sell1 * 2, "さかなを うると コイン・いけすが 不正 " + JSON.stringify(sl));
  // つかう こうかおんは ぜんぶ ある（FishLine.SE）
  const flSrc = readFileSync(join(GAME, "js/fishing-line.js"), "utf8"), seNames = vm.runInContext("Object.keys(FishLine.SE)", ctx);
  for (const m of flSrc.matchAll(/Sound\.se\("(fish_\w+)"\)/g)) ok(seNames.includes(m[1]), `こうかおん ${m[1]} が FishLine.SE に ない`);
  // 3番: いけすは 30ぴき・りっぱな つりざおは みなとの マルシェ（rods[1].get.shop の 建物）だけ
  const pro = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const p=Fishing.proShop();Save.d.fish.rod=1;
    const harbor=!!Fishing.proChoice({shopId:"market",back:{map:"harbor"}}),city=!Fishing.proChoice({shopId:"market",back:{map:"city"}}),town=!Fishing.proChoice({shopId:"market",back:{map:"town"}});
    Save.d.fish.rod=2;const owned=!Fishing.proChoice({shopId:"market",back:{map:"harbor"}});Save.d.fish.keep={a:12,b:18};const count=Fishing.keepCount();
    Save.d=old;return {map:p&&p.map,shop:p&&p.shop,price:p&&p.price,harbor,city,town,owned,count,max:Fishing.KEEP_MAX};})()`, ctx);
  ok(pro.map === "harbor" && pro.shop === "market" && pro.price === 1200 && pro.harbor && pro.city && pro.town && pro.owned, "りっぱな つりざおの お店が 不正 " + JSON.stringify(pro));
  ok(pro.count === 30 && pro.max === 30, "いけすの かずが 不正");
}

// ④ 化石（FOSSIL_DATA・FossilArt・Fossils）: 10種・骨 2〜10こ（ぜんぶで 63）・骨格の 要素は ちょうど 1回ずつ・場所・ピッケル・文の 長さ・絵・ノートの きろく
const FO = vm.runInContext(`typeof FOSSIL_DATA !== "undefined" ? FOSSIL_DATA : null`, ctx);
if (ok(!!FO, "FOSSIL_DATA が ない（js/fossil-data.js）")) {
  const width = (t) => [...t].reduce((a, c) => a + (c.charCodeAt(0) < 0x2000 ? 0.5 : 1), 0);
  const text = (t, where, rows, maxW) => { const r = String(t || "").split("\n"); ok(!!t && r.length <= rows && r.every((x) => width(x) <= maxW) && !/[a-zA-Z]{2,}/.test(t), `${where}: 文が ない／${rows}行を こえる／1行が 長い「${t}」`); };
  ok(FO.dinos.length === 10 && new Set(FO.dinos.map((d) => d.id)).size === 10, `恐竜が 10しゅ で ない／id が かさなる（${FO.dinos.length}）`);
  ok(FO.dinos.reduce((a, d) => a + d.art.parts.length, 0) === 63, "骨が ぜんぶで 63こ で ない");
  for (const d of FO.dinos) {
    const w = `恐竜 ${d.id}`, a = d.art, used = new Map();
    ok(a.parts.length >= 2 && a.parts.length <= 10 && new Set(a.parts.map((p) => p.id)).size === a.parts.length, `${w}: 骨が 2〜10こ で ない／部品 id が かさなる`);
    for (const p of a.parts) { text(p.name, `${w} の ${p.id}`, 1, 12); for (const el of p.el) { ok(!used.has(el), `${w}: ${el} が 2つの 部品に ある`); used.set(el, p.id); } }
    const known = new Set(["skull", "ribs", ...a.spine.map((sg) => sg.el), ...(a.limbs || []).map((l) => l.id), ...(a.extras || []).map((x) => x.id)]);
    for (const [el] of used) ok(known.has(el), `${w}: ${el} は 骨格に ない`);
    for (const k of known) ok(used.has(k), `${w}: ${k} が どの 部品にも ない`);
    ok(!!FO.sites[d.site] && d.rarity >= 1 && d.rarity <= 4 && d.len > 0, `${w}: site／rarity／len が 不正`);
    text(d.desc, `${w} の 説明`, 2, 23); text(d.fact, `${w} の まめちしき`, 2, 23);
  }
  const npcIds = new Set(Object.values(R.MAP_DEFS).flatMap((m) => (m.npcs || []).map((n) => n.id)));
  ok(npcIds.has(FO.pick.get.npc), `ピッケルを くれる 人 ${FO.pick.get.npc} が いない`);
  for (const x of FO.extras) ok(x.coins > 0 || !!R.BAG_INDEX[x.bag], `おまけ ${x.bag || x.coins} が 不正`);
  for (const [k, st] of Object.entries(FO.sites)) ok(st.maps.every((m) => !!R.MAP_DEFS[m]) && FO.dinos.some((d) => d.site === k) && st.rocks > 0, `化石の 場所 ${k}: マップ／恐竜／いわの 数が 不正`);
  // 絵: 骨格（ない 骨は 点線・ぜんぶ ある）と 骨 63こ
  const svgs = vm.runInContext(`FOSSIL_DATA.dinos.flatMap(d=>[["骨格 "+d.id+"（なし）",FossilArt.svg(d,{have:[]})],["骨格 "+d.id+"（ぜんぶ）",FossilArt.svg(d,{have:d.art.parts.map(p=>p.id)})],...d.art.parts.map(p=>["骨 "+d.id+"."+p.id,FossilArt.partSvg(d,p.id)])])`, ctx);
  ok(svgs.length === 20 + 63, `化石の 絵の 数が ちがう（${svgs.length}）`);
  for (const [what, svg] of svgs) svgOk(svg, what);
  // ノートの きろく（Fossils.give・have・progress）と、ピッケルが ない あいだは ② の 化石の 話が 出ない
  const note = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();Fossils.give("trex.skull");Fossils.give("trex.skull");Fossils.give("compso.head");Fossils.give("compso.body");
    const t=Fossils.dino("trex"),c=Fossils.dino("compso"),pt=Fossils.progress(t,Save.d.fossil.bones),pc=Fossils.progress(c,Save.d.fossil.bones);
    const ok1=pt.n===1&&pt.total===8&&!pt.done&&pc.done&&Save.d.fossil.bones["trex.skull"]===2&&Fossils.have(t).join()==="skull"&&Fossils.count()===3&&Fossils.total()===63&&!Fossils.bone("trex.nope");
    const noPick=!TownFolk.features().fossil;Save.d.fossil.pick=1;const pick=TownFolk.features().fossil;Save.d=old;return {ok1,noPick,pick};})()`, ctx);
  ok(note.ok1, "かせき ノートの きろく（あつまりぐあい・そろった）が 不正");
  ok(note.noPick && note.pick, "ピッケルの ない あいだも ② の 化石の 話・おねがいが 出る");
  // 2番: まいにちの いわ（30日ぶん）。数・5マス いじょう はなれる・水の となりでない・かべの となり・ふさいでも ほかの マスへ 行ける まま
  const rockCheck = vm.runInContext(`(()=>{const out={},N4=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const [site,st] of Object.entries(FOSSIL_DATA.sites))for(const mapId of st.maps){
      const m=Maps.get(mapId),d=m.def,cand=Fossils.candidates(mapId),bad=[];
      const starts=Object.values(MAP_DEFS).flatMap(o=>(o.warps||[]).filter(w=>w.to===mapId).map(w=>[w.tx,w.ty]));
      const reach=(block)=>{const seen=new Set(),q=starts.filter(([x,y])=>!m.isSolid(x,y)&&!block.has(x+","+y));for(const [x,y] of q)seen.add(x+","+y);
        while(q.length){const [x,y]=q.shift();for(const [dx,dy] of N4){const k=(x+dx)+","+(y+dy);if(!seen.has(k)&&!m.isSolid(x+dx,y+dy)&&!block.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}return seen;};
      const all=reach(new Set());
      for(let i=0;i<30;i++){const day="2026-10-"+(i+1),r=Fossils.rocks(mapId,st.rocks,day,cand);
        if(r.length!==st.rocks)bad.push(day+": "+r.length+"こ");
        for(const [x,y] of r){if(m.isSolid(x,y)||m.warpAt(x,y)||m.doorAt(x,y))bad.push(day+": とおれない マス "+x+","+y);
          if(N4.some(([dx,dy])=>(d.rows[y+dy]||"")[x+dx]==="~"))bad.push(day+": 水の となり "+x+","+y);
          if(!N4.some(([dx,dy])=>m.isSolid(x+dx,y+dy)))bad.push(day+": かべの となりで ない "+x+","+y);
          if((d.npcs||[]).some(n=>Math.abs(n.x-x)<=1&&Math.abs(n.y-y)<=1)||(d.chests||[]).some(c=>Math.abs(c.x-x)<=1&&Math.abs(c.y-y)<=1))bad.push(day+": 人・宝箱の そば "+x+","+y);}
        for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++)if(Math.abs(r[a][0]-r[b][0])+Math.abs(r[a][1]-r[b][1])<5)bad.push(day+": ちかすぎ");
        const block=new Set(r.map(p=>p.join(","))),got=reach(block);for(const k of all)if(!block.has(k)&&!got.has(k)){bad.push(day+": "+k+" へ 行けなく なる");break;}}
      out[mapId]={cand:cand.length,need:st.rocks,bad:bad.slice(0,4)};}
    return out;})()`, ctx);
  for (const [mapId, r] of Object.entries(rockCheck)) ok(r.cand >= r.need * 4 && !r.bad.length, `化石の いわ（${mapId}）が 不正: こうほ ${r.cand}／${r.bad.join("・")}`);
  // 2番: 出る もの（見本 pick）: 骨 7わり・その 場所の 恐竜だけ・まだ ない 骨が 出やすい。ほる（見本 Dig）: しっぱい なし・★ は たたいた かず。ほった いわは その日 きえる
  const digFlow = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const R=Fossils.rng("fossil-check"),D=FOSSIL_DATA;let bone=0,site=true;
    for(let i=0;i<3000;i++){const g=Fossils.pick(D,"cave",{},R);if(g.key){bone++;if(g.dino.site!=="cave")site=false;}else if(!g.extra)site=false;}
    const own={};for(const d of D.dinos.filter(d=>d.site==="forest"))for(const p of d.art.parts)own[d.id+"."+p.id]=1;delete own["stego.plates"];
    let fresh=0,bones=0;for(let i=0;i<3000;i++){const g=Fossils.pick(D,"forest",own,R);if(g.key){bones++;if(g.key==="stego.plates")fresh++;}}
    let dig=true,three=0;for(let k=0;k<200;k++){const g=new Fossils.Dig("x",{rand:R});let r=null;for(let t=0;t<60&&!g.done;t++){const i=g.hp.findIndex((h,j)=>h>0&&g.isBone(...g.cellOf(j)));const [x,y]=g.cellOf(i);r=g.tap(x,y);}
      if(!g.done||!r||r.stars<1||r.stars>3)dig=false;if(r&&r.stars===3)three++;const a=g.area;if(a.x<1||a.y<1||a.x+a.w>g.cols-1||a.y+a.h>g.rows-1)dig=false;}
    const st=(taps)=>{const g=new Fossils.Dig("x",{rand:Fossils.rng("s")});g.taps=taps-1;for(let i=0;i<g.hp.length;i++)g.hp[i]=g.isBone(...g.cellOf(i))?0:1;const a=g.area;g.hp[a.y*g.cols+a.x]=1;return g.tap(a.x,a.y).stars;};
    const rocks=Fossils.rocksOn("cave"),first=rocks[0];Save.d.fossil.dug.at.cave=[first.join(",")];const after=Fossils.rocksOn("cave");
    Save.d.fossil.dug.day="2000-1-1";const reset=Fossils.rocksOn("cave").length===rocks.length&&!Object.keys(Fossils.dugToday().at).length;
    const town=Fossils.rocksOn("town").length===0;
    const sc={mapId:"cave",rocks:rocks.slice(),party:[{tx:first[0]-1,ty:first[1],dir:"up",moving:false}]};sc.rockAt=(x,y)=>sc.rocks.find(([a,b])=>a===x&&b===y)||null;
    Save.d.fossil.pick=0;const noPick=!Fossils.rockNear(sc);Save.d.fossil.pick=1;const near=Fossils.rockNear(sc)===sc.rocks[0];sc.party[0].moving=true;const moving=!Fossils.rockNear(sc);
    sc.party[0]={tx:first[0]-2,ty:first[1],dir:"right",moving:false};const far=!Fossils.rockNear(sc);
    Save.d=old;return {bone:bone/3000,site,fresh:fresh/bones,dig,three,stars:[st(8),st(9),st(11),st(12)].join(),after:after.length===rocks.length-1&&!after.some(r=>r.join()===first.join()),reset,town,noPick,near,moving,far};})()`, ctx);
  ok(Math.abs(digFlow.bone - 0.7) < 0.04 && digFlow.site, `ほって 出る ものが 不正（骨 ${digFlow.bone}）`);
  ok(digFlow.fresh > 0.6, `まだ ない 骨が 出やすく ない（${digFlow.fresh}）`);
  ok(digFlow.dig && digFlow.three > 0 && digFlow.stars === "3,2,2,1", `ほる ミニゲームが 不正 ${JSON.stringify(digFlow)}`);
  ok(digFlow.after && digFlow.reset && digFlow.town, "ほった いわが きえない／日が かわっても もどらない／町に いわが 出る");
  ok(digFlow.noPick && digFlow.near && digFlow.moving && digFlow.far, "「ほる」ボタンの 出る ときが 不正 " + JSON.stringify(digFlow));
  for (const [what, svg] of vm.runInContext(`[["いわ",Fossils.rockSvg()],["ピッケル",Fossils.pickSvg()],...["crystal","amber","ammonite"].map(k=>["おまけ "+k,Fossils.extraSvg(k)])]`, ctx)) svgOk(svg, what);
  ok(vm.runInContext(`FOSSIL_DATA.extras.map(x=>Fossils.extraKind(x)).join()`, ctx) === "crystal,amber,ammonite", "おまけの 絵が データと あわない");
  // 3番: ② の 物々交換（ケロスケ）: だぶった 骨 → 同じ 恐竜の まだ ない 骨。そろった 恐竜の だぶりでは 出ない。TownFolk.have().bone は Save.d.fossil.bones
  const trade = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();Save.d.fossil.pick=1;const bt=TOWNSFOLK_DATA.barter.find(b=>b.id==="bt-explorer-bone"),can=()=>TownFolk.canGive(bt.give);
    const none=!can()&&Fossils.dupTrade()===null;Fossils.give("compso.head",2);Fossils.give("compso.body");const full=!can()&&Fossils.dupTrade()===null;
    Fossils.give("trex.skull",2);Fossils.give("trex.neck");const t=Fossils.dupTrade(),r=TownFolk.resolve(bt),yes=can()&&TownFolk.have().bone===Save.d.fossil.bones;
    const card=TownFolk.thingName(r.give)+"→"+TownFolk.thingName(r.get),art=TownFolk.thingArt(r.get).startsWith("<svg");Fossils.take("trex.skull");const after=!can()&&Save.d.fossil.bones["trex.skull"]===1;
    Save.d=old;return {none,full,t,card,art,yes,after};})()`, ctx);
  ok(trade.none && trade.full && trade.yes && trade.after && trade.t && trade.t.give === "trex.skull" && trade.t.get === "trex.chest" && trade.card === "ティラノサウルスの あたま→ティラノサウルスの むね" && trade.art, "だぶった 骨の 物々交換が 不正 " + JSON.stringify(trade));
}

// ⑤ 水族館と 博物館（MUSEUM_DATA・MuseumArt・Museum）: 館の マップ・床の 文字・展示（魚 50・恐竜 10 が 1かいずつ）・町の 建物と 出入り口・館の 人・BGM・絵
const MU = vm.runInContext(`typeof MUSEUM_DATA !== "undefined" ? MUSEUM_DATA : null`, ctx);
if (ok(!!MU, "MUSEUM_DATA が ない（js/museum-data.js）")) {
  const mu = vm.runInContext(`(()=>{const out={},FI=new Set(),DI=new Set(),dupF=[],dupD=[];
    for(const [id,b] of Object.entries(MUSEUM_DATA.buildings)){const d=MAP_DEFS[id],m=new WorldMap(id),o=b.outside,town=MAP_DEFS[o.map],tb=(town.buildings||[]).find(x=>x.id===o.id),tm=new WorldMap(o.map);
      for(const x of b.objects){for(const f of x.fish||[]){if(FI.has(f))dupF.push(f);FI.add(f);}if(x.dino){if(DI.has(x.dino))dupD.push(x.dino);DI.add(x.dino);}}
      const door=tb&&[tb.x+tb.door,tb.y+tb.h-1],front=door&&[door[0],door[1]+1];
      out[id]={map:!!d&&d.indoor&&d.rows.join()===b.rows.join()&&d.bgm===id&&!d.spawns.length,
        // UI-05: すいぞくかんは サンシャインいけぶ 12F へ おひっこし（みなとの 建物は おしらせだけ）
        building:!!tb&&tb.x===o.x&&tb.y===o.y&&tb.w===o.w&&tb.h===o.h&&(id==="aquarium"?tb.act?.type==="visit"&&/12かい/.test(tb.act.text)&&!!VenueHalls.defs.mall.floors[12]?.aqua:tb.act?.type==="indoor"&&tb.act.map===id&&tb.label===o.label),
        front:!!front&&!tm.isSolid(front[0],front[1]),warps:b.warps.length>=2&&b.warps.every(w=>w.to===o.map&&front&&w.tx===front[0]&&w.ty===front[1]&&m.warpAt(w.x,w.y)),
        arrive:!m.isSolid(b.arrive.x,b.arrive.y)&&!m.warpAt(b.arrive.x,b.arrive.y)&&Museum.roomAt(id,b.arrive.x,b.arrive.y)?.id==="entrance",
        tiles:Object.entries(MUSEUM_DATA.tiles).every(([ch,t])=>GROUND[ch]===t.ground&&SOLID_CH.has(ch)===!!t.solid),
        npcs:b.npcs.every(n=>TALKS[n.talk]&&TALKS[n.talk].first&&TALKS[n.talk].lines.length&&Object.values(n.outfit||{}).every(it=>!!ITEM_INDEX[it])),
        intro:b.rooms.every(r=>r.intro&&r.name)&&b.route.every(r=>b.rooms.some(q=>q.id===r)),
        walk:b.objects.every(x=>d.objects.find(y=>y.id===x.id)?.solid===!x.walk)};}
    return {out,fish:FI.size===FISHING_DATA.fish.length&&!dupF.length,dinos:DI.size===FOSSIL_DATA.dinos.length&&!dupD.length,songs:!!(SONGS.aquarium?.modern&&SONGS.museum?.modern),
      save:JSON.stringify(Save.fresh().museum)===JSON.stringify({fish:{},bones:{},done:{},rooms:{},all:{}})};})()`, ctx);
  ok(mu.fish && mu.dinos, "水族館の 魚 50しゅ・博物館の 恐竜 10しゅが ちょうど 1かいずつで ない");
  ok(mu.songs && mu.save, "館の BGM（modern）か Save.fresh().museum が 不正");
  for (const [id, r] of Object.entries(mu.out)) ok(Object.values(r).every(Boolean), `館 ${id} が 不正 ${JSON.stringify(r)}`);
  // 展示の 絵: 寄贈 0（水と かざりだけ・骨は 点線）と ぜんぶ（魚・骨格）。WorldArt.exhibit は 中身だけ（WorldArt と おなじ）
  const exSvgs = vm.runInContext(`Object.values(MUSEUM_DATA.buildings).flatMap(b=>b.objects).flatMap(o=>{const n=o.fish?o.fish.length:o.dino?FOSSIL_DATA.dinos.find(d=>d.id===o.dino).art.parts.length:o.boneOf?1:0;
    return [["展示 "+o.id+"（0）",Art.worldSvg("exhibit",{id:o.id,bits:"0".repeat(n)})],["展示 "+o.id+"（ぜんぶ）",Art.worldSvg("exhibit",{id:o.id,bits:"1".repeat(n)})]].map(([w,a])=>[w,a.full,a.svg.startsWith("<svg")]);})`, ctx);
  ok(exSvgs.length >= 100 && exSvgs.every((x) => !x[2]), `展示の 絵の 数が ちがう／外がわの svg が のこる（${exSvgs.length}）`);
  for (const [what, svg] of exSvgs) svgOk(svg, what);
  for (const [what, svg] of vm.runInContext(`["aquarium","museum"].map(k=>["建物の 外がわ "+k,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">'+MuseumArt.facade200(k)+"</svg>"])`, ctx)) svgOk(svg, what);
  // 寄贈の ようすの 文字（キーは 有限）: 寄贈 0 なら 0 だけ・長さは 魚の 数／部品の 数
  const bits = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();const os=Object.values(MUSEUM_DATA.buildings).flatMap(b=>b.objects);
    const zero=os.every(o=>/^0*$/.test(Museum.bits(o))&&Museum.bits(o).length===(o.fish?o.fish.length:o.dino?Fossils.dino(o.dino).art.parts.length:o.boneOf?1:0));
    Save.d.museum.fish.ayu="2026-9-28";Save.d.museum.bones["trex.skull"]="2026-9-28";const flow=os.find(o=>o.id==="aq_flow"),rex=os.find(o=>o.dino==="trex");
    const one=Museum.bits(flow)==="1000000"&&Museum.bits(rex).startsWith("1")&&Museum.bits(rex).slice(1).indexOf("1")<0;Save.d=old;return {zero,one};})()`, ctx);
  ok(bits.zero && bits.one, "展示の 寄贈の ようす（bits）が 不正 " + JSON.stringify(bits));
  // 2番: 寄贈（1しゅ・1部品 1かい。いけす／骨が へる・骨格が そろうと done）・寄贈しても ノートの あつまりぐあいは へらない・寄贈した 骨は 物々交換で わたさない
  const give = vm.runInContext(`(()=>{const old=Save.d;Save.d=Save.fresh();Save.d.fish.keep={ayu:2,magoi:1};Save.d.fossil.bones={"compso.head":1,"compso.body":1,"trex.skull":2};
    const aq0=Museum.donatable("aquarium").join();Museum.giveFish("ayu");const aq1=Museum.donatable("aquarium").join(),keep=Save.d.fish.keep.ayu;
    const mu0=Museum.donatable("museum").length,a=Museum.giveBone("compso.head"),b=Museum.giveBone("compso.body"),c=Fossils.dino("compso");
    const done=!a.done&&b.done&&b.done.id==="compso"&&!!Save.d.museum.done.compso&&Museum.doneCount()===1,note=Fossils.have(c).length===2&&Save.d.fossil.bones["compso.head"]===0;
    Museum.giveBone("trex.skull");const t=Fossils.dupTrade();Save.d.museum.bones["trex.neck"]="2026-9-28";const t2=Fossils.dupTrade();
    const all=!Museum.complete("aquarium");for(const f of FISHING_DATA.fish)Save.d.museum.fish[f.id]="x";const full=Museum.complete("aquarium");
    Save.d=old;return {aq0,aq1,keep,mu0,done,note,t:t&&t.give+">"+t.get,t2:t2&&t2.give+">"+t2.get,all,full};})()`, ctx);
  ok(give.aq0 === "magoi,ayu" && give.aq1 === "magoi" && give.keep === 1 && give.mu0 === 3 && give.done && give.note, "寄贈の ながれが 不正 " + JSON.stringify(give));
  ok(give.t === null && give.t2 === null && give.all && give.full, "寄贈と 物々交換・ぜんぶ そろった が 不正 " + JSON.stringify(give));
  // 2番: 水そうで およぐ 魚（寄贈した 魚だけ・大きさは「ぜんぶ いる とき」まで・だいたい 水の 四角の 中。はみ出た ぶんは clip）
  const swim = vm.runInContext(`(()=>{const out=[];for(const o of MUSEUM_DATA.buildings.aquarium.objects.filter(o=>o.fish&&o.kind!=="pedestal")){
      const none=Museum.art({id:o.id,bits:"0".repeat(o.fish.length)}),one=Museum.art({id:o.id,bits:"1"+"0".repeat(o.fish.length-1)}),all=Museum.art({id:o.id,bits:"1".repeat(o.fish.length)});
      const [wx,wy,ww,wh]=all.water||[0,0,0,0],inside=all.slots.every(s=>s.x>=wx-s.w/2&&s.x+s.w<=wx+ww+s.w/2&&s.y>=wy-s.h/2&&s.y+s.h<=wy+wh+s.h/2);
      out.push({id:o.id,ok:none.slots.length===0&&one.slots.length===1&&one.slots[0].id===o.fish[0]&&all.slots.length===o.fish.length&&one.slots[0].w<=Math.max(...all.slots.map(s=>s.w))+0.01&&inside&&!/<image|mfish/.test(all.svg)});}
    return out;})()`, ctx);
  for (const r of swim) ok(r.ok, `水そう ${r.id}: およぐ 魚の 場所が 不正`);
  // 3番: 展示を しらべる: 展示の マスで 見つかる（上を 歩ける ものは のぞく）・水そう／骨格の 台／説明の ある かざりだけ・説明が ある・水そうの 説明の 絵（魚 ぜんぶ）
  const show = vm.runInContext(`(()=>{const bad=[];let n=0;for(const [id,b] of Object.entries(MUSEUM_DATA.buildings)){const m=Maps.get(id);
      for(const o of b.objects){const hit=Museum.at(m,o.x,o.y);if(o.walk?hit&&hit.id===o.id:!hit||hit.id!==o.id)bad.push("at "+o.id);
        const can=Museum.canShow(o);if(can!==!!(o.fish||o.dino||o.info))bad.push("can "+o.id);if(o.info&&!MUSEUM_DATA.info[o.info])bad.push("info "+o.id);if(can)n++;}}
    const tanks=Object.values(MUSEUM_DATA.buildings).flatMap(b=>b.objects).filter(o=>o.fish&&o.kind!=="pedestal").map(o=>["しらべる 水そう "+o.id,Museum.tankSvg(o,"1".repeat(o.fish.length))]);
    return {bad,n,tanks};})()`, ctx);
  ok(!show.bad.length && show.n >= 30, `展示を しらべる はんいが 不正（${show.n}）${show.bad.slice(0, 4).join("・")}`);
  for (const [what, svg] of show.tanks) svgOk(svg, what);
}

// ⑥ 射撃場（RANGE_DATA・GunArt・ShootingRange・RangeScene）: build-range.mjs と 同じ 検査・弾道が GUN_LIST.md の 表と 0.1cm まで あう・絵・町の 建物・セーブ
const RD = vm.runInContext(`typeof RANGE_DATA !== "undefined" ? RANGE_DATA : null`, ctx);
if (ok(!!RD, "RANGE_DATA が ない（js/range-data.js）")) {
  ok(vm.runInContext(`typeof GunArt !== "undefined" && typeof ShootingRange !== "undefined" && SCENES.range === RangeScene`, ctx), "GunArt・ShootingRange・SCENES.range（RangeScene）が ない");
  const POW = ["gbb", "gas", "aeg", "spring"], ACT = ["semi", "da", "auto", "lever", "bolt", "single"], SIGHT = ["notch3", "ramp", "notch", "peep", "buckhorn", "diopter", "scope"];
  const inR = (v, lo, hi) => typeof v === "number" && v >= lo && v <= hi;
  for (const g of RD.guns) {
    const w = `射撃場の じゅう ${g.id}`, J = 0.5 * (g.bb / 1000) * g.v0 * g.v0;
    ok(!!RD.cats[g.cat] && POW.includes(g.power) && ACT.includes(g.action) && SIGHT.includes(g.sight), `${w}: しゅるい・動力・うごき・サイトが 不正`);
    ok(J <= 0.98, `${w}: ${J.toFixed(3)}J は 0.98J（18さい以上用）を こえる`);
    ok([["len", 150, 1200], ["h", 100, 300], ["bb", 0.12, 0.4], ["v0", 50, 100], ["group", 0.3, 6], ["hip", 5, 30], ["rate", 0.5, 20], ["mag", 1, 40], ["reload", 0, 3], ["recoil", 0.5, 15], ["back", 0, 1], ["weight", 0.3, 6], ["zero", 5, 50], ["sh", 0.01, 0.1], ["hop", 0.8, 1.5]].every(([k, lo, hi]) => inR(g[k], lo, hi)), `${w}: 性能が はんいの そと`);
    ok(g.action !== "da" || inR(g.pull, 0.01, 0.5), `${w}: ダブル アクションの pull`);
    ok(!["bolt", "lever"].includes(g.action) || inR(g.cycle, 0.01, 1.5), `${w}: ボルト／レバーの cycle`);
    ok(!["lever", "single"].includes(g.action) || (inR(g.perRound, 0.01, 2) && !g.reload), `${w}: 1ぱつずつ こめる perRound`);
    ok(g.power !== "gbb" ? !g.empty : g.empty > 0, `${w}: スライドが とまる empty は ガス ブローバックだけ`);
    ok(g.cat === "sniper" ? g.sight === "scope" && Array.isArray(g.zoom) && g.zoom[1] > g.zoom[0] : typeof g.zoom === "number" && g.sight !== "scope", `${w}: サイトと ばいりつ`);
    ok(!!(g.name && g.desc && g.fact && g.ref) && g.desc.split("\n").length <= 3 && g.fact.split("\n").length <= 3, `${w}: 名前・せつめい・まめちしき`);
  }
  for (const c of Object.keys(RD.cats)) {
    ok(RD.guns.filter((g) => g.cat === c).length === 3, `射撃場: ${c} の じゅうが 3しゅで ない`);
    ok(Object.values(RD.courses).filter((x) => x.cat === c).length === 2, `射撃場: ${c} の しゅもくが 2つで ない`);
    const u = RD.cats[c].unlock; ok(!u || (!!RD.cats[u.cat] && u.cat !== c && inR(u.stars, 1, 3)), `射撃場: ${c} の unlock が 不正`);
  }
  ok(new Set(RD.guns.map((g) => g.id)).size === 9 && Object.keys(RD.courses).length === 6, "射撃場: じゅう 9しゅ・しゅもく 6つ で ない");
  const KIND = { steel: "time", bull: "points", ipsc: "hf", issf: "points", long: "points", run: "points" }, TSHAPE = { steel: ["round", "stop"], ipsc: ["ipsc", "ns", "popper"], long: ["gong"] };
  for (const [cid, c] of Object.entries(RD.courses)) {
    const w = `射撃場の しゅもく ${cid}`, T = c.targets || [], ids = new Set(T.map((t) => t.id)), st = c.stars || [];
    ok(!!RD.cats[c.cat] && ["indoor", "hall", "field"].includes(c.env) && KIND[c.kind] === c.score && !!c.name && !!c.rule && c.rule.split("\n").length <= 3, `${w}: しゅるい・ばしょ・てんの かぞえかた・ルール`);
    ok(ids.size === T.length && T.every((t) => (TSHAPE[c.kind] || []).includes(t.shape) && inR(t.z, 3, 80) && inR(t.x, -8, 8) && (!t.act || (ids.has(t.act) && T.find((x) => x.id === t.act).wait))), `${w}: 的の 形・場所・参照`);
    ok(st.length === 3 && st.every((v, i) => !i || (c.score === "time" ? v < st[i - 1] : v > st[i - 1])), `${w}: ★の めやすが score の むきに ならばない ${JSON.stringify(st)}`);
    if (c.kind === "steel") ok(c.strings >= 3 && c.drop < c.strings && c.penalty > 0 && T.length === 5 && T.filter((t) => t.stop).length === 1, `${w}: ストリング・プレート 5まい（ストップ 1まい）`);
    if (c.kind === "long") ok(c.shots === c.per * T.length && T.every((t, i) => !i || (t.z > T[i - 1].z && t.pts > T[i - 1].pts)), `${w}: かねは ちかい じゅんに 2はつずつ`);
    if (c.kind === "ipsc") ok(c.zones.A > c.zones.C && c.zones.C > c.zones.D && T.some((t) => t.shape === "ns") && T.some((t) => t.rail) && T.some((t) => t.swing), `${w}: A・C・D・NS・うごく 的`);
  }
  // こうかおん（sound.js の se() に ある 名前）・射撃場の 人
  const seNames = new Set([...readFileSync(join(GAME, "js/sound.js"), "utf8").matchAll(/case "([a-z_]+)"/g)].map((m) => m[1]));
  const walk = (v) => (typeof v === "string" ? [v] : Object.values(v).flatMap(walk));
  for (const n of walk(RD.sound)) ok(seNames.has(n), `射撃場の こうかおん ${n} が sound.js に ない`);
  ok(Object.values(RD.staff.outfit).every((it) => !!R.ITEM_INDEX[it]) && !!R.SPECIES[RD.staff.sp], "射撃場の RO の 服・しゅるいが ない");
  // 町の 建物（シティの 5×4・入口の まえが 通れる・act は range）と セーブ
  const out = vm.runInContext(`(()=>{const o=RANGE_DATA.outside,b=(MAP_DEFS[o.map].buildings||[]).find(x=>x.id===o.id),m=new WorldMap(o.map);if(!b)return null;
    const door=[b.x+b.door,b.y+b.h-1];return {pos:b.x===o.x&&b.y===o.y&&b.w===o.w&&b.h===o.h&&b.label===o.label&&b.style===o.style&&b.act?.type==="range",
      door:door[0]===o.doorAt[0]&&door[1]===o.doorAt[1]&&!!m.doorAt(door[0],door[1]),front:!m.isSolid(o.front[0],o.front[1])&&o.front[0]===door[0]&&o.front[1]===door[1]+1,
      save:JSON.stringify(Save.fresh().range)===JSON.stringify({safety:false,plays:0,best:{},hop:{}})};})()`, ctx);
  ok(!!out && Object.values(out).every(Boolean), "射撃場の 町の 建物・入口・セーブが 不正 " + JSON.stringify(out));
  // 弾道: GUN_LIST.md の「弾道」と「ホップ ダイヤル」の 表と ShootingRange.ballistics が 0.1cm（とぶ 時間は 0.01びょう）まで あう
  const md = readFileSync(join(GAME, "docs/design/features/range/GUN_LIST.md"), "utf8"), num = (t) => Number(String(t).replace(/[^0-9.+-]/g, ""));
  const rows = (head) => { const sec = md.split(head)[1] || "", out = []; for (const ln of sec.split("\n").slice(1)) { if (ln.startsWith("#")) break; if (ln.startsWith("| ") && !/^\| (じゅう|---)/.test(ln)) out.push(ln.split("|").slice(1, -1).map((x) => x.trim())); } return out; };
  const bal = vm.runInContext(`(()=>{const B=RANGE_DATA.ballistics,out={};for(const g of RANGE_DATA.guns){const b=ShootingRange.ballistics(g,g.hop,B);
    out[g.name]={y:[5,10,20,30,40,50,60,70].map(d=>b.at(d).y*100),t:[30,50,70].map(d=>b.at(d).t),w:[30,50,70].map(d=>ShootingRange.drift(g,d,b.at(d).t,1)*100),
      hop:g.cat==="hand"?null:[0,5,10,15,20].map(s=>{const h=ShootingRange.ballistics(g,ShootingRange.hopAt(g,s,B),B);return [20,30,50,70].map(d=>h.at(d).y*100);})};}return out;})()`, ctx);
  const main = rows("## 弾道"), hops = rows("### ホップ ダイヤル");
  ok(main.length === 9 && hops.length === 6, `GUN_LIST.md の 弾道の 表が 読めない（${main.length} / ${hops.length}）`);
  const near = (a, b, tol) => Math.abs(a - b) <= tol + 1e-9;
  for (const r of main) {
    const b = bal[r[0]]; if (!ok(!!b, `弾道の 表の じゅう「${r[0]}」が RANGE_DATA に ない`)) continue;
    const ts = r[9].split("/").map(num), ws = r[10].split("/").map(num);
    ok(r.slice(1, 9).every((v, i) => near(Math.round(b.y[i] * 10) / 10, num(v), 0.1)) && ts.every((v, i) => near(Math.round(b.t[i] * 100) / 100, v, 0.01)) && ws.every((v, i) => near(Math.round(b.w[i] * 10) / 10, v, 0.1)), `弾道が GUN_LIST.md と ちがう: ${r[0]}`);
  }
  for (const r of hops) { const b = bal[r[0]]; if (ok(!!(b && b.hop), `ホップの 表の じゅう「${r[0]}」`)) ok(r.slice(1).every((cell, s) => cell.split("/").map(num).every((v, i) => near(Math.round(b.hop[s][i] * 10) / 10, v, 0.1))), `ホップ ダイヤルの 弾道が GUN_LIST.md と ちがう: ${r[0]}`); }
  // 絵: じゅう 9しゅ・的（キーは 14こ・有限）・主観の じゅう（9×3×2）・町の 建物の 外がわ
  const art = vm.runInContext(`(()=>{const out=[];for(const g of RANGE_DATA.guns){out.push(["じゅうの 絵 "+g.id,GunArt.svg(g,{px:g.cat==="hand"?0.5:0.105,uid:"ck"+g.id})]);for(const w of ["wanko","gachan","goji"])for(const t of ["soft","dark"])out.push(["主観の じゅう "+g.id+"/"+w+"/"+t,ShootingRange.fpvSvg(g,w,t).svg]);}
    const keys=ShootingRange.artKeys(RANGE_DATA);for(const k of keys)out.push(["的の 絵 "+k.key,k.make()]);
    out.push(["射撃場の 外がわ",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">'+ShootingRange.facade200()+"</svg>"]);return {out,keys:keys.map(k=>k.key)};})()`, ctx);
  ok(art.keys.length === 14 && new Set(art.keys).size === 14 && art.keys.every((k) => /^rt:[a-z]+(:\d+)?$/.test(k)), `射撃場の 的の キーが 14こで ない（${art.keys.join(",")}）`);
  for (const [what, svg] of art.out) svgOk(svg, what);
  // 2番: あそびの しくみ（見本と 同じ Game・bot）。しゅもく × じゅう 18とおりを good で あそぶと おわって ★1 いじょう。ゲームの 弾道も 表と 同じ。コインは 0 / 27 / 60 / 90
  const play = vm.runInContext(`(()=>{const D=RANGE_DATA,out=[];for(const [cid,C] of Object.entries(D.courses))for(const g of D.guns.filter(x=>x.cat===C.cat)){
      const G=new ShootingRange.Game(D,cid,g.id,{seed:"check:"+cid+":"+g.id,W:360,H:700});let n=0;while(G.phase!=="end"&&n++<60*400)G.update(1/60,ShootingRange.bot(G,"good"));
      out.push({k:cid+"/"+g.id,end:G.phase==="end",stars:G.stars,result:G.result,hud:!!G.hud().kind});}
    const lb=new ShootingRange.Game(D,"long","bolt",{hopStep:10}).bal.at(50).y*100,lb0=new ShootingRange.Game(D,"long","bolt",{hopStep:0}).bal.at(50).y*100;
    return {out,lb,lb0,pay:[0,1,2,3].map(s=>GameEconomy.pay("range",1,s)),draw:typeof ShootingRange.draw==="function"&&typeof ShootingRange.bot==="function"};})()`, ctx);
  for (const r of play.out) ok(r.end && r.stars >= 1 && Number.isFinite(r.result) && r.hud, `射撃場 ${r.k}: じどうで あそんでも おわらない／★1 に とどかない ${JSON.stringify(r)}`);
  ok(play.out.length === 18 && play.draw, "射撃場: しゅもく × じゅう が 18とおりで ない／draw・bot が ない");
  ok(Math.abs(play.lb - 1.1) <= 0.1 && Math.abs(play.lb0 + 94.7) <= 0.1, `射撃場の ゲームの 弾道が GUN_LIST.md と ちがう（ボルト 50m: ${play.lb.toFixed(2)} / ダイヤル 0: ${play.lb0.toFixed(2)}）`);
  ok(play.pay.join() === "0,27,60,90", "射撃場の コイン（GameEconomy.pay）が 0 / 27 / 60 / 90 で ない " + play.pay.join());
  // 3番: RO の 号令（4つ）と おうえんの かお（hit・combo・hurry × 3人。Chara に ある かお）
  ok(vm.runInContext(`["ready","areYou","standby","done"].every(k=>!!RANGE_DATA.talk.cmd[k])&&Object.entries(RangeScene.CHEER_FACE).every(([k,m])=>Chara.IDS.every(id=>(RANGE_DATA.talk.cheer[id][k]||[]).length&&!!CHARA_DATA[id].faces[Chara.faceOf(id,m[id])]))`, ctx), "射撃場の RO の 号令・おうえんの かおが 不正");
}

{
  const rewards=vm.runInContext(`(() => {
    const prior=Save.d;Save.d=Save.fresh();Save.d.coins=987654;
    const ids=ShopRewards.prizes.map(p=>p.id);
    const valid=ShopRewards.prizes.every(p=>{
      const f=FURN_INDEX[p.id],a=HomeDesign.model(p.id),b=HomeDesign.model(p.id,{flip:true});
      return f.rare&&f.price===0&&f.kind==="floor"&&a.w>0&&a.h>0&&b.w>0&&!a.full.includes("NaN");
    });
    let boundaries=true,once=true;
    for(const shop of Object.keys(ShopRewards.themes)){
      for(const lv of [4,5,9,10,14,15,29,30]){
        Save.d.shops[shop]={lv:1,rep:SHOP_LV_REP[lv]};
        boundaries=boundaries&&ShopRewards.level(Save.d.shops[shop])===lv&&ShopRewards.rows(shop).filter(p=>p.ready).length===[5,10,15,30].filter(n=>n<=lv).length;
      }
      const a=ShopRewards.claim(shop),b=ShopRewards.claim(shop);once=once&&a.length===4&&b.length===0&&a.every(p=>Save.d.furn[p.id]===1);
    }
    const preserved=Save.d.coins===987654,ledger=Object.keys(Save.d.shopRewards).length,cap=GameEconomy.pay("crepe",30,3)===GameEconomy.pay("crepe",5,3);
    Save.d=prior;return {valid,boundaries,once,preserved,ledger,cap,unique:new Set(ids).size,count:ids.length};
  })()`,ctx);
  for(const k of ["valid","boundaries","once","preserved","cap"])ok(rewards[k],"お店のレベル報酬: "+k);
  ok(rewards.count===44&&rewards.unique===44&&rewards.ledger===44,"お店11種×4段階の非売品が一度ずつ");
}

// ---------- 水の 絵（川・海・湖。js/water-art.js）----------
{
  const water = vm.runInContext(`(()=>{
    const out = [];
    for (const id of Object.keys(MAP_DEFS)) {
      const m = new WorldMap(id), info = WaterArt.info(m);
      if (!info.any) continue;
      const P = WaterArt.prep(m); let badPts = 0;
      for (const s of P.shores) { for (let a = 0; a < s.pts.length; a++) if (!Number.isFinite(s.pts[a])) badPts++; for (let a = 0; a < s.nx.length; a++) if (Math.abs(Math.hypot(s.nx[a], s.ny[a]) - 1) > 1e-3) badPts++; }
      out.push({ id, kinds: info.bodies.map((b) => b.kind), mismatch: info.mismatch, badPts, shores: info.shores, parts: info.parts, shore: info.bodies.every((b) => b.shore || b.tiles <= 2) });
    }
    // 形からの 見わけ（つくった マップで。町の 作りなおしに かかわらない）: まっすぐな 川・まがった 川・池・海・1マスの いずみ
    const fake = (w, h, wetAt, base = "grass") => ({ w, h, id: "fake", def: {}, baseGround: base, groundAt: (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : wetAt(x, y) ? "water" : base) });
    const kinds = (m) => WaterArt.info(m).bodies.map((b) => b.kind).join();
    return { out, kinds: {
      river: kinds(fake(30, 20, (x, y) => y >= 9 && y <= 10)),
      bend: kinds(fake(24, 24, (x, y) => (y >= 4 && y <= 5 && x <= 12) || (x >= 11 && x <= 12 && y >= 4))),
      lake: kinds(fake(20, 20, (x, y) => x >= 6 && x <= 12 && y >= 7 && y <= 11)),
      sea: kinds(fake(30, 20, (x, y) => x >= 18, "sand")),
      pool: kinds(fake(10, 10, (x, y) => x === 4 && y === 4)),
      fixed: kinds({ ...fake(30, 20, (x, y) => y >= 9 && y <= 10), def: { waterKind: "lake" } }),
    } };
  })()`, ctx);
  ok(water.out.length > 0, "水の ある マップが ない");
  for (const r of water.out) {
    ok(r.kinds.every((k) => ["river", "sea", "lake"].includes(k)), `水の 絵 ${r.id}: 川・海・湖に 見わけられない ${r.kinds}`);
    ok(r.mismatch === 0, `水の 絵 ${r.id}: マスの まんなかの 見た目と 水の マスが ${r.mismatch} か所 ちがう（通れない 水が 陸に 見える／通れる 陸が 水に 見える）`);
    ok(r.badPts === 0 && r.shores > 0 && r.parts > 0 && r.shore, `水の 絵 ${r.id}: 岸の 線・うごく もの・水べの マスが 不正 ${JSON.stringify(r)}`);
  }
  const k = water.kinds;
  ok(k.river === "river" && k.bend === "river" && k.lake === "lake" && k.sea === "sea" && k.pool === "lake" && k.fixed === "lake", "水の 見わけ（川・海・湖・def.waterKind）が 形と あわない " + JSON.stringify(k));
}

// ---------- 町の人の 見た目（js/npc-art.js・js/npc-cast.js）: 35しゅ・おなじ 見た目や 名前の 人が いない ----------
{
  const cast = vm.runInContext(`(()=>{const r=NpcCast.report();const bad=[];
    for(const d of Object.values(MAP_DEFS))for(const n of d.npcs||[]){if(!NpcArt.SP[n.sp])bad.push(n.id+":sp");for(const k of ["eye","brow","mouth","cheek","tuft"]){const v=(n.look||{})[k];if(v&&![...NpcArt.EYE,...NpcArt.BROW,...NpcArt.MOUTH,...NpcArt.CHEEK,...NpcArt.TUFT].includes(v))bad.push(n.id+":"+k+"="+v);}}
    const cust=NpcCast.customers.map(c=>NpcCast.keyOf(c)),custSil=NpcCast.customers.map(c=>NpcCast.silhouette(c));
    const town=new Set();for(const d of Object.values(MAP_DEFS))for(const n of d.npcs||[])town.add(NpcCast.silhouette(n));
    return {...r,bad,species:Object.keys(NpcArt.SP).length,cust:cust.length,custUnique:new Set(cust).size===cust.length&&new Set(custSil).size===custSil.length,custApart:custSil.every(k=>!town.has(k)),
      svg:Object.keys(NpcArt.SP).map(sp=>Art.npcSvg({sp,look:{eye:"sparkle",brow:"up",cheek:"freckle",pattern:"spots",tuft:"bow"}}))};})()`, ctx);
  ok(cast.species >= 35 && cast.people >= 80, `町の人の 種が すくない（${cast.species}しゅ／${cast.people}人）`);
  ok(!cast.sameLook.length, "おなじ 見た目の 町の人が いる: " + cast.sameLook.slice(0, 5).join(", "));
  ok(!cast.sameName.length, "おなじ 名前の 町の人が いる: " + cast.sameName.slice(0, 5).join(", "));
  ok(!cast.bad.length, "町の人の 種・look が 不正: " + cast.bad.slice(0, 5).join(", "));
  ok(cast.cust === 60 && cast.custUnique && cast.custApart, `お店の お客さん 60人が そろわない／町の人と おなじ 見た目（${cast.cust}）`);
  cast.svg.forEach((svg, i) => svgOk(svg, "町の人の 絵（もよう・かざり つき）" + i));
}

// ---------- 家具の 立体モデル（js/furniture-models.js。ART-03）----------
{
  const fm = vm.runInContext(`(()=>{
    const out = [];
    for (const f of FURNITURE) {
      if (f.kind === "wall" || !FurnModels.has(f.id)) continue;
      for (const flip of [false, true]) {
        const m = HomeDesign.model(f.id, { flip }), dm = HomeDesign.dimensions(f.id), ids = [...m.full.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
        const corners = [[-dm.w / 2, -dm.d], [dm.w / 2, -dm.d], [dm.w / 2, 0], [-dm.w / 2, 0]].map(([x, y]) => (flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, 0) : HomeDesign.project(x, y, 0)));
        out.push({ id: f.id, flip, rebuilt: FurnModels.ids.includes(f.id), foot: m.footW === (flip ? dm.d : dm.w) && m.footD === (flip ? dm.w : dm.d) && m.height === dm.h,
          inside: corners.every((q) => q.x >= m.x - 0.01 && q.x <= m.x + m.w + 0.01 && q.y >= m.y - 0.01 && q.y <= m.y + m.h + 0.01), dup: ids.length !== new Set(ids).size, kb: m.full.length / 1024,
          view: (m.full.match(/viewBox="([^"]+)"/) || [])[1] === [m.x, m.y, m.w, m.h].map((n) => f2(n)).join(" ") });
      }
    }
    return { out, ids: FurnModels.ids, sky: FURN_ART.window().includes('fill="#A8DBFF" class="sky"'), poster: (FURN_ART.poster().match(/<svg /g) || []).length, clock: FURN_ART.clock({ live: true }).includes("M22,37 L22,31") };
  })()`, ctx);
  const need = ["rug_round", "rug_star", "bed_simple", "bed_royal", "table_wood", "desk", "console_oak", "teacart", "sofa", "cloudsofa", "bookshelf", "plantshelf", "kitchen", "vanity", "piano", "tv", "fireplace", "toybox", "aquarium", "musicbox", "train", "tent", "kotatsu", "lamp"];
  ok(need.every((id) => fm.ids.includes(id)), "作りなおした 家具が たりない " + need.filter((id) => !fm.ids.includes(id)).join());
  for (const r of fm.out) {
    const w = `家具の 立体モデル ${r.id}${r.flip ? "（はんてん）" : ""}`;
    ok(r.foot, `${w}: 床の 大きさ・高さが HomeDesign.dimensions と ちがう（おいた 場所が ずれる）`);
    ok(r.inside, `${w}: 床の 四すみが 絵の はんいから はみ出す（あたり判定が ずれる）`);
    ok(!r.dup, `${w}: SVG の id が かさなって いる`);
    ok(r.view, `${w}: viewBox と x/y/w/h が ちがう`);
    ok(r.kb < 64, `${w}: SVG が 大きすぎる（${r.kb.toFixed(1)}KB）`);
  }
  ok(fm.out.some((r) => !r.rebuilt), "2D の 絵の 家具が かげだけの モデルに ならない");
  ok(fm.sky && fm.poster === 4 && !fm.clock, "かべの 家具: まどの 空の いろ・ポスターの 3にん・はとどけいの はり（live）が 不正");
}

// ---------- さわれる 家具（js/furniture-live.js。ART-03b）----------
{
  const lv = vm.runInContext(`(()=>{
    const out = [];
    for (const id of FurnLive.LIVE) {
      const f = FURN_INDEX[id];
      if (!f) { out.push({ id, missing: true }); continue; }
      for (const flip of [false, true]) {
        if (f.kind === "wall") { const a = Art.furnSvg(id, { flip }), b = Art.furnSvg(id, { flip, live: true }); out.push({ id, flip, wall: true, diff: a !== b, a, b }); continue; }
        const a = HomeDesign.model(id, { flip }), b = HomeDesign.model(id, { flip, live: true });
        out.push({ id, flip, same: [a.x, a.y, a.w, a.h, a.footW, a.footD].join() === [b.x, b.y, b.w, b.h, b.footW, b.footD].join(), diff: a.full !== b.full, b: b.full });
      }
    }
    const taps = ["lamp", "tv", "piano", "clock", "fishbowl", "aquarium", "toybox", "fireplace", "musicbox", "train", "rockinghorse", "window", "kitchen", "kotatsu", "tent", "desk"];
    return { out, interactive: taps.filter((id) => !FURN_INDEX[id] || !FURN_INDEX[id].interactive) };
  })()`, ctx);
  for (const r of lv.out) {
    const w = `さわれる 家具 ${r.id}${r.flip ? "（はんてん）" : ""}`;
    ok(!r.missing, `${w}: FURN_INDEX に ない`);
    if (r.missing) continue;
    ok(r.wall || r.same, `${w}: うごく ぶぶんを ぬいた 絵（live）と ふつうの 絵で 大きさが ちがう（部屋で 絵が ずれる）`);
    ok(r.diff, `${w}: live でも 絵が かわらない（うごく ぶぶんが 2じゅうに なる）`);
    svgOk(r.b, `${w}（live）`);
  }
  ok(lv.interactive.length === 0, "タップで うごく はずの 家具が interactive で ない " + lv.interactive.join());
}

// ---------- ぱぱ・ままの おしごと（js/parent-work.js。ART-04）----------
{
  const pw = vm.runInContext(`(()=>{
    const hours = Array.from({ length: 24 }, (_, h) => ParentWork.away(h)).map((a) => (a ? 1 : 0)).join("");
    const lines = [...Object.entries(ParentWork.ALONE).flatMap(([id, ls]) => ls.map(([text, fx, where]) => ({ id, text, fx, where }))), ...ParentWork.TALKS.flat().map(([id, text, fx, where]) => ({ id, text, fx, where })), ...[9, 12, 15, 17].flatMap((h) => (ParentWork.timely(h, 45) || []).map(([id, text, fx, where]) => ({ id, text, fx, where }))), ...ParentWork.BYE.map(([id, text]) => ({ id, text })), ...ParentWork.HELLO.map(([id, text]) => ({ id, text }))];
    // 12じに ParentCare.update を よぶと 2人とも おしごと（ほかの しくみが あとから ParentCare を つつんでも かわらない）
    const hourNow = U.hourNow, d0 = Save.d;
    let at12 = null;
    try {
      U.hourNow = () => 12; Save.d = Save.fresh();
      const sc = { parents: ["papa", "mama"].map((id) => ({ id, x: 120, y: 320, state: "idle", anim: 0, queue: [] })), chars: [], life: { quarrel: false, queue: [] }, mode: null, parentTimer: 99, parentTurn: 0, parentSpeechTurn: 0 };
      ParentCare.update(sc, 0.05);
      at12 = { phase: sc.work && sc.work.phase, hidden: sc.parents.every((p) => p.hidden) };
    } finally { U.hourNow = hourNow; Save.d = d0; }
    return { hours, lines, wrapped: !!at12 && at12.phase === "away" && at12.hidden, talks: ParentWork.TALKS.length, alone: Object.fromEntries(Object.entries(ParentWork.ALONE).map(([k, v]) => [k, v.length])),
      quiet: ["bath", "measure", "papa-sleep"].map((id) => HomeLife.talkById(id)).filter(Boolean).map((t) => HomeLife.playTalk({ work: { phase: "away" } }, t)) };
  })()`, ctx);
  ok(pw.hours === "000000000111111111000000", "ぱぱ・ままの おしごとの 時間が 9:00〜18:00 で ない " + pw.hours);
  ok(pw.wrapped, "ParentCare が ParentWork で つつまれて いない（おしごと ちゅうも うごいて しまう）");
  ok(pw.quiet.length === 3 && pw.quiet.every((r) => r === false), "おしごと ちゅうに ぱぱ・ままの かけあいが はじまる（見えない 人が しゃべる）");
  ok(pw.talks >= 8 && ["wanko", "gachan", "goji"].every((id) => pw.alone[id] >= 8), "おるすばんの ことばが すくない " + JSON.stringify(pw.alone));
  for (const l of pw.lines) {
    ok(["wanko", "gachan", "goji", "all", "papa", "mama"].includes(l.id), `おるすばんの ことば: だれ？ ${l.id}`);
    ok(!/[\u4E00-\u9FFF]/.test(l.text) && l.text.length <= 30, `おるすばんの ことばは ひらがなで 30もじ まで: ${l.text}`);
    ok(!l.fx || ["heart", "note", "dots", "sweat", "anger"].includes(l.fx), `おるすばんの しぐさ ${l.fx} が ない`);
    ok(!l.where || ["door", "window", "hug"].includes(l.where), `おるすばんの うごき ${l.where} が ない`);
  }
}

// ---------- 音楽プレイヤーと ディスク（js/music-discs.js。ART-05）----------
{
  const md = vm.runInContext(`(()=>{
    const discs = MusicDiscs.DISCS.map((d) => ({ id: d.id, song: d.song, from: d.from, title: MusicDiscs.title(d), modern: !!(SONGS[d.song] && SONGS[d.song].modern), art: MusicDiscs.art(d) }));
    const players = Object.keys(MusicDiscs.PLAYERS).map((id) => { const f = FURN_INDEX[id]; return { id, ok: !!f && f.rare === true && f.price === 0 && f.interactive === true && f.kind === "floor", model: FurnModels.has(id), live: [...FurnLive.LIVE].includes(id), text: f ? f.name + " " + f.desc : "" }; });
    // もらいかた（かりの セーブで ためす）
    const d0 = Save.d, always = () => 0;
    let flow = null;
    try {
      Save.d = Save.fresh();
      const first = MusicDiscs.fromShop("crepe", [3, 3, 3], always), low = MusicDiscs.fromShop("bakery", [1, 1, 3], always), boombox = Save.d.furn.player_boombox || 0;
      for (const s of ["bakery", "florist", "dentist", "cake", "groom", "burger"]) MusicDiscs.fromShop(s, [3, 3, 3], always);
      const theme = MusicDiscs.has("disc_twinkle") && MusicDiscs.has("disc_theme"), jukebox = Save.d.furn.player_jukebox || 0, march = MusicDiscs.has("disc_turkish") && MusicDiscs.has("disc_march"), chest = MusicDiscs.fromChest("cave", always);
      const gramophone = Save.d.furn.player_gramophone || 0, nacht = MusicDiscs.has("disc_nacht") && MusicDiscs.has("disc_lullaby"), again = MusicDiscs.grant("disc_shop_crepe").length;
      const saved = Object.keys(Save.d.discs).length;
      // まえの セーブ（ラジカセ・ジュークボックスは ある・ぽかぽかの きょくは ない）: つぎに ひらくと おまけの ディスクが はいって いる（1かいだけ）
      Save.d = Save.fresh(); Save.d.furn.player_boombox = 1; Save.d.furn.player_jukebox = 1; Save.d.discs = { disc_twinkle: "2026-09-28", disc_turkish: "2026-09-28", disc_shop_crepe: "2026-09-28" };
      const back = MusicDiscs.backfill(), backfill = { lines: back, again: MusicDiscs.backfill().length, theme: MusicDiscs.has("disc_theme"), march: MusicDiscs.has("disc_march"), lullaby: MusicDiscs.has("disc_lullaby") };
      flow = { first, low, boombox, backfill, theme, jukebox, march, chest, gramophone, nacht, again, saved };
    } finally { Save.d = d0; }
    // ディスクだけの きょくは 既存の 名曲（作曲者が 1967年 までに なくなった パブリックドメイン）。出典つき
    const classics = Object.entries(SONGS).filter(([, s]) => s.disc && !s.original).map(([id, s]) => ({ id, title: s.title, source: s.source || null }));
    const originals = Object.entries(SONGS).filter(([, s]) => s.disc && s.original).map(([id]) => id);
    return { discs, players, flow, classics, originals, shops: Object.keys(SHOPS).filter((id) => MG_TASKS[id]), chestMaps: Object.keys(MAP_DEFS).filter((id) => (MAP_DEFS[id].chests || []).length), fresh: JSON.stringify(Save.fresh().discs) };
  })()`, ctx);
  const kanji = /[\u4E00-\u9FFF]/;
  ok(md.discs.length >= 20 && new Set(md.discs.map((d) => d.id)).size === md.discs.length, "ディスクが すくない か id が かさなる");
  for (const d of md.discs) {
    ok(d.modern, `ディスク ${d.id}: きょく ${d.song} が SONGS に ない（ながせない）`);
    ok(d.title && !kanji.test(d.title) && d.title.length <= 12, `ディスク ${d.id}: なまえ「${d.title}」は ひらがなで 12もじ まで`);
    ok(!d.from.shop || md.shops.includes(d.from.shop), `ディスク ${d.id}: おてつだいの おみせ ${d.from.shop} が ない`);
    ok(!d.from.map || md.chestMaps.includes(d.from.map), `ディスク ${d.id}: たからばこの ある マップ ${d.from.map} が ない（手に入らない）`);
    svgOk(d.art, `ディスクの 絵 ${d.id}`);
  }
  for (const s of md.shops) ok(md.discs.some((d) => d.from.shop === s), `おてつだいの おみせ ${s} の ディスクが ない`);
  ok(["starter", "town", "jukebox", "gramophone"].every((k) => md.discs.some((d) => d.from[k])), "はじめ・町・ちくおんき・ジュークボックスの ディスクが そろわない");
  ok(md.classics.length >= 4, "ディスクだけの 名曲が すくない");
  // この ゲームの ために つくった きょく（けさない。名曲と いっしょに プレイヤーの おまけ）
  ok(["disc_theme", "disc_lullaby", "disc_march"].every((id) => md.originals.includes(id) && md.discs.some((d) => d.song === id)), "ぽかぽかの きょく 3つ（3にんの テーマ・ほしぞら ララバイ・ぽかぽか マーチ）の ディスクが ない " + md.originals);
  for (const c of md.classics) {
    const died = Number((/[（(]\d{4}-(\d{4})[)）]/.exec(c.source?.composer || "") || [])[1]);
    ok(c.source && c.source.work && c.source.score && c.source.license, `ディスクの 名曲 ${c.id}: 出典（作品・楽譜・ライセンス）が ない`);
    ok(died > 0 && died <= 1967, `ディスクの 名曲 ${c.id}: 作曲者が 1967年 までに なくなって いない（日本で 保護期間が おわって いるか わからない）`);
  }
  ok(md.players.length === 3, "音楽プレイヤーが 3しゅ ない");
  for (const p of md.players) {
    ok(p.ok, `${p.id}: レア・ねだん 0・さわれる 家具に なって いない`);
    ok(p.model, `${p.id}: 立体モデルが ない`);
    ok(!kanji.test(p.text), `${p.id}: なまえ・せつめいに 漢字が ある`);
  }
  ok(md.players.filter((p) => p.live).length >= 2, "ちくおんき・ジュークボックスの うごく 絵（live）が ない");
  const f = md.flow;
  ok(f.first.some((t) => /ディスク「/.test(t)) && f.first.some((t) => /ラジカセ/.test(t)) && f.boombox === 1 && f.theme && f.first.some((t) => /「3にんの テーマ」と ?「きらきらぼし」/.test(t)), "はじめての ディスクで ラジカセと「3にんの テーマ」「きらきらぼし」が もらえない " + JSON.stringify(f.first));
  ok(f.low.length === 0, "○ が すくない おてつだいでも ディスクが 出る");
  ok(f.jukebox === 1 && f.march, "ディスク 8まいで ジュークボックスと「ぽかぽか マーチ」「トルコ こうしんきょく」が もらえない");
  ok(f.chest.some((t) => /どうくつの しずく/.test(t)) && f.gramophone === 1 && f.nacht, "たからばこで その ばしょの ディスクと ちくおんき（ほしぞら ララバイ・アイネ クライネ つき）が 出ない " + JSON.stringify(f.chest));
  ok(f.backfill.lines.length === 2 && f.backfill.lines.every((t) => /ディスク「/.test(t) && !kanji.test(t)) && f.backfill.again === 0 && f.backfill.theme && f.backfill.march && !f.backfill.lullaby, "まえの セーブの プレイヤーに ぽかぽかの きょくが はいらない " + JSON.stringify(f.backfill));
  ok(f.again === 0 && f.saved === 14, "おなじ ディスクを 2かい もらえる か セーブの かずが ちがう " + f.saved);
  ok(md.fresh === "{}", "Save.fresh() に discs が ない");
}

// ---------- 食べ物の 絵（js/food-art.js）: 食べ物ごとに じぶんの 絵が ある（ほかの 食べ物の 絵を かりない）----------
{
  const fa = vm.runInContext(`(()=>({ foods: FOODS.map((f) => ({ id: f.id, name: f.name, art: FOOD_ART[f.id] || "" })), fixed: FoodArtFix.ids }))()`, ctx);
  const seen = new Map();
  for (const f of fa.foods) {
    ok(f.art, `食べ物 ${f.id}（${f.name}）: 絵が ない`);
    if (!f.art) continue;
    ok(!seen.has(f.art), `食べ物 ${f.id}（${f.name}）: ${seen.get(f.art)} と おなじ 絵（名前と 絵が あわない）`);
    seen.set(f.art, `${f.id}（${f.name}）`);
    svgOk(`<svg viewBox="0 0 64 64">${f.art}</svg>`, `食べ物の 絵 ${f.id}`);
  }
  ok(fa.fixed.length >= 20 && fa.fixed.every((id) => fa.foods.some((f) => f.id === id)), "FoodArtFix の 食べ物が ない か すくない " + fa.fixed.join());
}

// ---------- すまほ（js/smaho.js）: ≡ は せってい・あそびかた だけ。ちず・ようす・もちもの などは すまほの アプリ ----------
{
  const sm = vm.runInContext(`(()=>{
    const apps = Smaho.APPS.map((a) => ({ id: a.id, name: a.name, icon: Smaho.ICON[a.id] || "", color: a.color }));
    const d0 = Save.d, paused = Game.paused, out = {};
    try {
      Save.d = Save.fresh();
      out.hints = Smaho.hints().map((h) => ({ icon: h.icon, text: h.text }));
      const day = "2026-9-28"; // U.today() の 形
      out.f1 = Smaho.fortune(day); out.f2 = Smaho.fortune(day); out.mul = typeof DailyPlay !== "undefined" ? DailyPlay.mul(day) : null;
      out.lucks = [...new Set(Array.from({ length: 60 }, (_, i) => Smaho.fortune("2027-" + (1 + (i % 12)) + "-" + (1 + (i % 28))).luck))];
      out.featured = typeof DailyPlay !== "undefined" ? DailyPlay.featured(day) : null;
      // 町の「おまつり」ボタンは もう つくらない（すまほの ボタンだけ）
      const mb = Smaho.mountButton; let mounts = 0; Smaho.mountButton = () => { mounts++; };
      const sc = { festivalButton: "old" };
      try { Seasonal.mount(sc); } finally { Smaho.mountButton = mb; }
      out.mount = { mounts, festival: sc.festivalButton };
      // Esc（Game.openMenu）は すまほを ひらく・とじる。うごけない ときは なにも しない
      const tg = Smaho.toggle; let toggles = 0; Smaho.toggle = () => { toggles++; };
      try { Game.paused = false; Game.openMenu(); Game.paused = true; Game.openMenu(); } finally { Smaho.toggle = tg; }
      out.toggles = toggles;
    } finally { Save.d = d0; Game.paused = paused; }
    return { apps, LUCK: Smaho.LUCK.map((l) => l[0]), foods: FOODS.map((f) => f.id), places: Object.values(MAP_DEFS).map((m) => m.name), menu: Menu.open.toString(), help: Menu.help.toString(), fortuneSrc: Smaho.fortune.toString(), ...out };
  })()`, ctx);
  const kanji = /[\u4E00-\u9FFF]/;
  const ids = sm.apps.map((a) => a.id);
  ok(new Set(ids).size === ids.length, "すまほの アプリの id が かさなる");
  for (const need of ["map", "status", "bag", "dex", "event", "rally", "hint", "fortune"]) ok(ids.includes(need), `すまほに アプリ ${need} が ない`);
  for (const a of sm.apps) {
    ok(a.name && !kanji.test(a.name) && a.name.length <= 7, `すまほの アプリ ${a.id}: なまえ「${a.name}」は ひらがな・カタカナで 7もじ まで`);
    ok(a.icon, `すまほの アプリ ${a.id}: アイコンが ない`);
    if (a.icon) svgOk(`<svg viewBox="0 0 44 44">${a.icon}</svg>`, `すまほの アイコン ${a.id}`);
    ok(/^#[0-9A-Fa-f]{6}$/.test(a.color || ""), `すまほの アプリ ${a.id}: いろ が ない`);
  }
  // ≡（Menu.open）は メタな ものだけ
  const tabs = [...((/const T = \[(.*?)\];/.exec(sm.menu) || [])[1] || "").matchAll(/\["(\w+)"/g)].map((m) => m[1]);
  ok(tabs.join() === "settings,help", "≡ の タブは せってい・あそびかた だけ（ちず・ようす・もちもの・ずかんは すまほ）: " + tabs.join());
  for (const t of sm.help.match(/"[^"]*"/g) || []) ok(!kanji.test(t), `あそびかたに 漢字が ある: ${t}`);
  ok(sm.mount.mounts === 1 && sm.mount.festival === null, "町の「おまつり」ボタンが まだ ある（すまほの イベントへ まとめる）");
  ok(sm.toggles === 1, "Esc（Game.openMenu）で すまほが ひらかない か うごけない ときも ひらく");
  // ひんと
  const proper = sm.places.flatMap((n) => [n, n.replace(/（.*$/, "")]).sort((a, b) => b.length - a.length);
  ok(sm.hints.length >= 4, "ひんとが すくない");
  for (const h of sm.hints) {
    ok(sm.apps.some((a) => a.id === h.icon) || h.icon === "phone", `ひんとの アイコン ${h.icon} が ない`);
    // ばしょの 名前（「平和台」など）は そのまま つかって よい
    const plain = proper.reduce((t, n) => t.split(n).join(""), h.text || "");
    ok(h.text && !kanji.test(plain), `ひんとに 漢字が ある: ${h.text}`);
  }
  // うらない: おなじ 日は おなじ けっか（Math.random・Date.now を つかわない）・日で かわる・ラッキーの もの は ほんとうに ある
  ok(!/Math\.random|Date\.now|new Date/.test(sm.fortuneSrc), "うらないが その日の うちに かわる（Math.random・Date を つかって いる）");
  ok(JSON.stringify(sm.f1) === JSON.stringify(sm.f2), "うらないが おなじ 日で ちがう");
  ok(sm.f1.mul === sm.mul && sm.mul >= 1.2 && sm.mul <= 2, "うらないの ラッキー おみせの ばいりつが 1.2〜2 で ない／ほんとうの ばいりつと ちがう");
  ok(sm.lucks.length >= 3 && sm.lucks.every((l) => sm.LUCK.includes(l)), "うらないの けっかが 日で かわらない: " + sm.lucks.join());
  ok(sm.foods.includes(sm.f1.food), `うらないの ラッキー たべもの ${sm.f1.food} が ない`);
  ok(sm.places.includes(sm.f1.place), `うらないの ラッキー ばしょ ${sm.f1.place} が ない`);
  ok(!sm.featured || sm.f1.shop === sm.featured, "うらないの ラッキー おみせが きょうの おすすめと ちがう（コインが ふえない）");
  for (const t of [sm.f1.luck, sm.f1.message, ...Object.values(sm.f1.words)]) ok(!kanji.test(t), `うらないに 漢字が ある: ${t}`);
  ok(["wanko", "gachan", "goji"].every((k) => sm.f1.words[k]), "うらないに 3にんの ひとことが ない");
}

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
