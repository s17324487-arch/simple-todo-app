// 開発・テスト用のフック（本編からは使わない）。
// 自動テスト（tests/smoke.mjs）や開発中の確認は、ゲーム内部を直接いじらず この API を使う。
// ブラウザの開発者ツールで PokaDebug.help() と打つと一覧が出る。
// ここの関数名と引数は「約束」なので、変えるときは tests/smoke.mjs と docs も直すこと。
const PokaDebug = {
  version: GAME_VERSION,

  help() {
    const lines = [
      "PokaDebug.state()                     いまのシーン・マップ・コインなど",
      "PokaDebug.idle()                      画面切り替え中・会話中でなければ true",
      "PokaDebug.newGame({ goji: 'soft' })   オープニングを飛ばして はじめから（おうちへ）",
      "PokaDebug.teleport('meadow', 14, 3)   マップの (x, y) へ移動（town/city/coast/meadow/forest/cave）",
      "PokaDebug.house()                     おうちへ",
      "PokaDebug.battle([{ kind: 'purun', lv: 2 }], 'meadow')  バトル開始",
      "PokaDebug.shop('crepe', 3)            お店ミニゲームを Lv3 で開始",
      "PokaDebug.coins(1000)                 コインを足す",
      "PokaDebug.level(16)                   3人のレベルを設定して全回復",
      "PokaDebug.unlockAll()                 服・家具・壁紙・床を ぜんぶ持つ",
      "PokaDebug.give('cake', 3)             もちものを足す",
      "PokaDebug.save()                      いますぐセーブ",
      "PokaDebug.walkTo(4, 12)               町・フィールドで (x, y) まで歩く",
      "PokaDebug.mg()                        お店ミニゲームの状態（注文・ボタン位置）",
      "PokaDebug.hour(21)                    時刻を固定（null で戻す）",
      "PokaDebug.fps(2000)                   指定ミリ秒のあいだの平均FPSを返す（Promise）",
    ];
    console.log(lines.join("\n"));
    return lines.length;
  },
  state() {
    const sc = G.scene;
    return {
      version: GAME_VERSION,
      scene: G.sceneName,
      map: sc && sc.mapId ? sc.mapId : null,
      pos: sc && sc.party ? [sc.party[0].tx, sc.party[0].ty] : null,
      phase: sc && sc.phase ? sc.phase : null,
      busy: UI.busy,
      transitioning: !!Game.trans,
      coins: Save.d ? Save.d.coins : null,
    };
  },
  idle() { return !Game.trans && !UI.busy; },
  pause(value) { const previous = !!Game.paused; Game.paused = !!value; return previous; },
  world() {
    if(G.sceneName!=="world")return null;
    const sc=G.scene,r=G.canvas.getBoundingClientRect();
    const point=(x,y)=>({cx:r.left+(x*TS+16-sc.cam.x+G.W/2)*G.cssPerUnit,cy:r.top+(y*TS+16-sc.cam.y+G.H/2)*G.cssPerUnit});
    return {map:sc.mapId,party:sc.party.map((p,i)=>({id:Save.d.order[i],x:p.tx,y:p.ty})),
      objects:(sc.map.def.objects||[]).map(o=>({...o,...point(o.x+(o.w-1)/2,o.y+(o.h-1)/2)})),
      stops:sc.map.doors.filter(d=>d.b.act.type==="transit").map(d=>({id:d.b.act.stop,x:d.x,y:d.y,...point(d.x,d.y-1)})),
      active:sc.objectActive?.until>G.t?sc.objectActive.id:null};
  },
  travel() { return G.sceneName==="travel"?{...G.scene.trip,elapsed:G.scene.elapsed,party:[...Save.d.order]}:null; },
  homeLife(event) {
    if (G.sceneName !== "house") return null;
    if (event) HomeLife.event(G.scene, event);
    const l = G.scene.life;
    return { watching: !!G.scene.watching, quarrel: l.quarrel, bubbles: l.bubbles.map(b => ({ ...b })), room: Save.d.rooms.active, owned: { ...Save.d.rooms.owned }, coins: Save.d.coins, rare: Save.d.flags.rareChats || 0, furniture: { ...l.furniture }, chars: Object.fromEntries(Chara.IDS.map(id => [id, { ...Save.d.chars[id] }])) };
  },
  feed(id, food) { return Care.feed(id, food); },
  wins(n) { Save.d.stats.wins = Math.max(0, Math.floor(n)); Save.mark(); },
  homePoint(x, y) { const p = G.scene.toScreen(x, y), r = G.canvas.getBoundingClientRect(); return { x: r.left + p.x * G.cssPerUnit, y: r.top + p.y * G.cssPerUnit }; },
  battleLayout() {
    if (G.sceneName !== "battle") return null;
    const sc = G.scene, rect = G.canvas.getBoundingClientRect();
    return { cardBottom: rect.top + (sc.allyY + 59.5) * G.cssPerUnit, menuTop: sc.ui.getBoundingClientRect().top, enemyTop: sc.foeY - sc.FS, active: sc.active?.id };
  },

  newGame({ goji = "soft" } = {}) {
    Save.reset();
    Save.d.chars.goji.color = goji;
    Save.write();
    Game.trans = null;
    Game.goto("house", {}, "none");
  },
  teleport(map = "town", x, y, dir = "down") {
    const d = MAP_DEFS[map];
    if (!d) throw new Error("unknown map: " + map);
    Game.trans = null;
    Game.goto("world", { map, x, y, dir, grace: 2 }, "none");
  },
  house() { Game.trans = null; Game.goto("house", {}, "none"); },
  battle(foes = [{ kind: "purun", lv: 1 }], area = "meadow", boss = false) {
    for (const f of foes) if (!ENEMIES[f.kind]) throw new Error("unknown enemy: " + f.kind);
    const w = Save.d.world;
    Game.trans = null;
    // 終わったら いまの場所（セーブの world）に戻る
    Game.goto("battle", { foes, area, boss, back: { map: w.map, x: w.x, y: w.y, dir: w.dir }, spawnIdx: -99 }, "none");
  },
  shop(id = "crepe", lv) {
    if (!SHOPS[id]) throw new Error("unknown shop: " + id);
    if (lv) Save.d.shops[id].lv = U.clamp(lv, 1, 5);
    Game.trans = null;
    Game.goto("shop", { shop: id, back: { map: "town", x: 12, y: 21, dir: "down" } }, "none");
  },
  coins(n = 1000) { Save.addCoins(n); UI.updateHud(); return Save.d.coins; },
  level(lv = 10) {
    for (const id of Chara.IDS) { const c = Save.d.chars[id]; c.lv = U.clamp(lv, 1, 50); c.exp = 0; }
    Save.healAll();
    return lv;
  },
  unlockAll() {
    const d = Save.d;
    for (const w of WEAR_ITEMS) d.wardrobe[w.id] = true;
    for (const f of FURNITURE) d.furn[f.id] = Math.max(d.furn[f.id] || 0, 1);
    for (const w of WALLPAPERS) d.room.wallpapers[w.id] = true;
    for (const f of FLOORS) d.room.floors[f.id] = true;
    Save.mark();
  },
  give(id, n = 1) {
    if (!BAG_INDEX[id]) throw new Error("unknown item: " + id);
    Save.addBag(id, n);
    return Save.d.bag[id];
  },
  save() { Save.write(); return true; },
  // 町・フィールドで (x, y) まで歩く（タップ移動と同じ道さがし）
  walkTo(x, y) {
    if (G.sceneName !== "world") throw new Error("walkTo は町・フィールドでだけ使える");
    G.scene.goTo(x, y, null);
    return !!G.scene.path;
  },
  // お店ミニゲームの いまの状態（テストが「正しい操作」をするための情報）。座標は画面の CSS ピクセル
  mg() {
    if (G.sceneName !== "shop") return null;
    const sc = G.scene, t = sc.task;
    const cv = G.canvas.getBoundingClientRect();
    const css = (x, y) => ({ cx: Math.round(cv.left + x * G.cssPerUnit), cy: Math.round(cv.top + y * G.cssPerUnit) });
    const out = { shop: sc.shopId, lv: sc.lv, phase: sc.phase, n: sc.n, total: sc.total, ranks: [...sc.ranks], earn: sc.earn, tips: sc.tips, difficulty: sc.difficulty, timeLimit: sc.timeLimit, timeLeft: sc.timeLeft, buttons: [], order: null, targets: [] };
    out.score = sc.stamp?.score ?? null;
    if (!t) return out;
    out.buttons = t.btns.filter((b) => !b.disabled).map((b) => ({ label: b.label || "", ...css(b.x + b.w / 2, b.y + b.h / 2) }));
    if (sc.shopId === "crepe") out.order = { want: t.want.map((id) => CREPE_TOPS.find((x) => x.id === id).name) };
    if (sc.shopId === "florist") out.order = { step: t.step, want: Object.entries(t.want).map(([k, n]) => ({ name: FLOWER_KINDS.find((f) => f.id === k).name, n })), ribbon: RIBBONS.find((r) => r.id === t.ribbon).name + "の リボン" };
    if (sc.shopId === "bakery") {
      const b = t.breadPos();
      out.order = { step: t.step, bread: BREADS.find((x) => x.id === t.want.bread).name, zone: t.zone, done: t.done, top: t.want.top ? { name: BREAD_TOPS.find((x) => x.id === t.want.top.id).name, n: t.want.top.n } : null, breadAt: css(b.x, b.y) };
    }
    if (sc.shopId === "dentist") {
      for (const g of t.germs) if (g.alive) { const c = t.toothCenter(g.t); out.targets.push({ kind: "germ", ...css(c.x, c.y + Math.sin(g.bob) * 3) }); }
      for (const d of t.dirt) if (d.hp > 0) { const c = t.toothCenter(d.t); out.targets.push({ kind: "dirt", ...css(c.x, c.y) }); }
      for (const v of t.cav) if (!v.fixed) { const c = t.toothCenter(v.t); out.targets.push({ kind: "cavity", ...css(c.x, c.y) }); }
      out.order = { remaining: t.remaining(), mistakes: t.mistakes };
    }
    if (sc.shopId === "link") {
      out.order = { target: t.target, collected: t.collected, chain: [...t.chain], legal: t.legalMove(), shuffles: t.shuffles, fever: t.fever };
      out.cells = t.board.map((value, i) => ({ i, value, ...css(t.point(i).x, t.point(i).y) }));
    }
    if (sc.shopId === "relay") out.order = { target: t.target, caught: t.caught, misses: t.misses, lane: t.lane, role: t.role, shield: t.shield, items: t.items.map(it => ({ ...it, progress: (it.y - t.trackTop) / (t.trackBottom - t.trackTop) })) };
    return out;
  },
  hour(h) {
    if (!PokaDebug._hourNow) PokaDebug._hourNow = U.hourNow;
    U.hourNow = h == null ? PokaDebug._hourNow : () => h;
  },
  fps(ms = 2000) {
    return new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(Math.round((n / (performance.now() - t0)) * 1000)); };
      requestAnimationFrame(f);
    });
  },
};
window.PokaDebug = PokaDebug;
