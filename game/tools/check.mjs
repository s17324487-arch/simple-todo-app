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
  ENEMIES, ENEMY_ART, AREAS, SKILLS, CHARA_STATS, CHARA_INFO, CHARA_DATA, SHOPS, SHOP_LV_REP, MG_TASKS, SHOP_OWNERS, HOWTO, BUY_SHOPS, MAP_DEFS, WorldMap, STORE_INTERIORS, StoreArt, StoreScene,
  Chara, Art, Save, Stats, Care, Loot, SPECIES, TALKS, SCENES, SONGS, Sound, EMO, PokaDebug, HomeRooms, Room, HomeDesign, GameEconomy, Transit, Seasonal, SEASON_ITEMS, AtlasArt, ParentCare, ANNUAL_EVENTS, AnnualArt, AnnualFestivals, Weather, SeasonPalette, TownRoads, ShopDecor })`, ctx);

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
    ok(a && (a.type === "house" || (a.type === "work" && R.SHOPS[a.shop]) || (a.type === "buy" && R.BUY_SHOPS[a.shop]) || (a.type === "transit" && R.Transit.stops[a.stop]?.map === id) || (a.type === "visit" && typeof a.text === "string")), `マップ ${id}: 建物 ${d.b.id} の act が不正`);
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
for(const id of Object.keys(R.MAP_DEFS)) ok(!!R.AtlasArt.places[id],`全体地図に ${id} がない`);
for(const id of Object.keys(R.AtlasArt.places)) ok(!!R.MAP_DEFS[id],`全体地図の ${id} が実在しない`);
const atlasPair=(a,b)=>[a,b].sort().join("/");
const atlasRoads=new Set(R.AtlasArt.roads.map(([a,b])=>atlasPair(a,b)));
for(const [a,b] of R.AtlasArt.roads) ok(R.MAP_DEFS[a]?.warps.some(w=>w.to===b)&&R.MAP_DEFS[b]?.warps.some(w=>w.to===a),`地図の道 ${a}↔${b} を歩けない`);
for(const [id,d] of Object.entries(R.MAP_DEFS)) for(const w of d.warps||[]) ok(atlasRoads.has(atlasPair(id,w.to)),`全体地図に道 ${id}↔${w.to} がない`);
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
  if (tr.drum) for (const ev of seq) if (ev) ok(["k", "s", "h"].includes(ev.n), `曲 ${name}: ドラム "${ev.n}" が不明`);
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
for(let i=1;i<=14;i++){const id=daily.featured('2030-10-'+i);ok(!!R.MG_TASKS[id]&&id!=='link'&&daily.boost(id,'2030-10-'+i)===1.2,'おすすめに未実装/有料パズルが入る');}
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
    HomeLife.init(sc);G.t=5;U.hourNow=()=>7;Weather.override='rain';
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
  const npcIds = Object.values(R.MAP_DEFS).flatMap((d) => (d.npcs || []).map((n) => n.id)), npcSet = new Set(npcIds);
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
