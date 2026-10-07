// 歩いて 入る お店（O10・UI-75。オーナーの FB 2026-10-03「入ることのできるお店の内装で、クオリティの低いものを作り直してほしい。」）
// いままでの 10×12 マス・店員（5,1）・レジ（4,2 から 3マス）・はなす ところ（5,3）・でぐち（5,11）は そのまま、
// サンシャインいけぶ・工務店と おなじ 斜め上の 館（IsoVenueScene・IsoVenue の 投影）で 描く。
// 店ごとの 内装（什器・床・かべ）は STORE_INTERIORS（js/store-interiors.js ほか）、絵は js/store-iso-art.js（StoreIsoArt）。
// - 什器: [kind, x, y, w, d, label, opts]。label が ある ものは タップで「○○。ゆっくり みていってね」（action: "look"）。
//   opts: { height, action, variant, text, spots, noFade, ... }。テーブル（kind "table"・action "sit"）は 3人が すわれる（js/dine-seats.js）。
// - 店の 床: design.mats（もじ → 材質）と design.zones（[もじ, x0, y0, x1, y1]）。でぐちの マット（4〜6, 11）は 床の 絵（とおれる）。
// - 店の かべ: design.walls.north / west（まど・かんばん・メニュー・ポスター など。StoreIsoArt.wallSvg）。おみせ Lv の かざりも かべに。
// セーブは かえない（店内の うごき だけ。Save.d.world は 入口の そと）。
const StoreIso = (() => {
  const W = 10, H = 12;
  // ふつうの 高さ（タップの あたり・3人の まえで すける）。opts.height が あれば そちら
  const HEIGHT = { counter: 78, keeper: 112 };
  // 画面の よこはばで きめる 大きさ（390 で 0.46。たて画面で 店の ほとんどが 見える）
  const scale = () => U.clamp(G.W / 780, 0.42, 0.56);
  // 什器（タプル → もの）。レジと 店員を さいごに たす
  function fixtures(id, owner) {
    const d = STORE_INTERIORS[id], out = [];
    for (const t of d.fixtures) {
      const [kind, x, y, w, dd, label, o = {}] = t;
      const f = { kind, x, y, w, d: dd, h: dd, shop: id, height: o.height ?? StoreIsoArt.height(kind, o.variant), ...o };
      if (label) { f.label = label; if (!f.action) f.action = /^kuji_/.test(kind) ? "kuji" : "look"; }
      out.push(f);
    }
    out.push({ kind: "counter", x: 4, y: 2, w: 3, d: 1, h: 1, shop: id, height: HEIGHT.counter, label: "レジ", action: "talk" });
    out.push({ kind: "keeper", x: 5, y: 1, w: 1, d: 1, h: 1, shop: id, height: HEIGHT.keeper, label: owner ? owner.name : "てんいんさん", action: "talk", noFade: true });
    return out;
  }
  // 床の もじ（10×12）
  function rows(d) {
    const g = Array.from({ length: H }, () => Array(W).fill("."));
    for (const [ch, x0, y0, x1, y1] of d.zones || []) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < W) g[y][x] = ch;
    for (let x = 4; x <= 6; x++) g[H - 1][x] = "x"; // でぐちの マット
    return g.map((r) => r.join(""));
  }
  // へや（店と おみせ Lv の かざりの だんかいで 1つ。IsoVenue.build は へやごとに 静止画を おぼえる）
  const rooms = new Map();
  function room(id) {
    const d = STORE_INTERIORS[id], tier = typeof ShopDecor !== "undefined" && SHOPS[id] ? ShopDecor.tier(ShopDecor.level(id)) : 1, key = id + ":" + tier;
    if (rooms.has(key)) return rooms.get(key);
    const mats = { x: "store:exit" };
    for (const [ch, m] of Object.entries(d.mats || {})) mats[ch] = StoreIsoArt.mat(id, ch, m);
    if (!mats["."]) mats["."] = StoreIsoArt.mat(id, ".", { c: [d.floor || "#EADBC3", StoreIsoArt.shade(d.floor || "#EADBC3", -0.04)], pat: "tile" });
    const r = { id: "store_" + id + "_" + tier, shop: id, tier, floorNo: 1, iso: true, w: W, h: H, wallH: 230, scale: 0.46, spawn: [5, 10], crowd: 0, title: "", rows: rows(d), mats, storeWalls: d.walls || {}, fixtures: [] };
    rooms.set(key, r);
    return r;
  }
  return { W, H, HEIGHT, scale, fixtures, rows, room, rooms };
})();

class StoreScene extends IsoVenueScene {
  async enter(p) {
    this.shopId = p.shop; this.design = STORE_INTERIORS[p.shop];
    this.back = { ...p.back }; this.closed = false; this.busy = false; this.interacting = false; this.path = []; this.pending = null; this.clock = 0;
    const retail = BUY_SHOPS[p.shop];
    this.owner = retail ? { ...retail.keeper, name: retail.keeperName } : SHOP_OWNERS[p.shop];
    this.keeperActor = NpcLife.stationaryActor(this.owner);
    this.name = (retail || SHOPS[p.shop]).name;
    if (p.shop === "burger" && this.back.map === "heiwadai") this.name = "マックさん";
    this.id = "store_" + p.shop; this.isoZoom = 1; this.enterAt = null; this.cam = { x: 0, y: 0 };
    const r = StoreIso.room(p.shop);
    r.fixtures = StoreIso.fixtures(p.shop, this.owner);
    this.def = { name: this.name, iso: true, art: StoreIsoArt, floors: { 1: r } };
    this.floor = 1;
    this.loadFloor(1, p.atCounter ? [5, 4] : [5, 10]);
    Save.d.world = { ...this.back }; Save.write();
    await this.preload();
    Sound.bgm("shop_" + this.shopId); UI.showHud(true, this.name);
    this.bar = U.el("div", { class: "store-bar" });
    this.hint = U.el("div", { class: "store-hint", text: "スライド・タップで あるく・てんいんに はなそう" });
    this.talkButton = UI.btn("てんいんと はなす", () => this.request("talk"), "yellow");
    this.bar.append(this.hint, this.talkButton, UI.btn("おみせを でる", () => this.request("exit")));
    UI.root.append(this.bar);
    this.homeButton = UI.btn("おうちへ", () => { if (!Game.inputLocked && !this.interacting) { Save.write(); Game.goto("house", {}, "circle"); } }, "store-home small");
    UI.root.append(this.homeButton);
    await this.prepareIso();
  }
  exit() { this.cancel(); this.closed = true; this.bar?.remove(); this.homeButton?.remove(); UI.showHud(false); }
  // 3人と 店員の 絵（さいしょに 見える ぶん）と 什器の 絵
  async preload() {
    const list = [], size = Math.round(this.charSize());
    for (const id of Save.d.order) for (const dir of Object.keys(DIRS)) for (const pose of ["idle_01", "idle_02", "walk_01", "walk_02"]) { const c = Save.d.chars[id]; list.push([id, { dir, pose, outfit: c.outfit, color: c.color }]); }
    await Promise.all([Chara.preload(list, size), StoreIsoArt.keeperCanvas(this, true, true)]);
  }
  // 斜めの 大きさ（画面の はばで きめる。ピンチの ズームは ない）
  get s() { return StoreIso.scale() * (this.isoZoom || 1); }
  get scale() { return this.s; }
  // カメラ: 上の HUD と 下の ボタンの あいだに 店（かべの うえ 〜 ゆかの てまえ）を おく。よこに はみ出す ときは 3人に ついていく
  cameraTarget() {
    const r = this.room, s = this.s, cpu = G.cssPerUnit || 1, L = this.party[0], q = this.feet(L.x, L.y);
    const top = IsoVenue.p(0, 0, r.wallH || 230).y - 24, bot = IsoVenue.p(r.w, r.h, 0).y + 34, left = IsoVenue.p(0, r.h, 0).x - 14, right = IsoVenue.p(r.w, 0, 0).x + 14;
    const areaTop = 104 / cpu, areaBot = G.H - 178 / cpu, viewW = G.W / s, viewH = (areaBot - areaTop) / s;
    const x = right - left <= viewW ? (left + right) / 2 : U.clamp(q.x, left + viewW / 2, right - viewW / 2);
    const y = bot - top <= viewH ? (top + bot) / 2 : U.clamp(q.y - viewH * 0.12, top + viewH / 2, bot - viewH / 2);
    return { x, y: y + (G.H / 2 - (areaTop + areaBot) / 2) / s };
  }
  // とおれる マス（10×12・什器の 足もと と 店員の マスは とおれない）
  walkable(x, y) { return x >= 0 && x < StoreIso.W && y >= 0 && y < StoreIso.H && super.walkable(x, y); }
  // "talk"（店員の まえ 5,3）・"exit"（でぐち 5,11）または 什器
  request(a) {
    if (typeof a === "string") { if (Game.inputLocked || this.interacting || this.closed || this.busy) return false; Sound.se("tap"); return this.walkTo(5, a === "talk" ? 3 : 11, a); }
    return super.request(a);
  }
  async interact(f) {
    if (f === "talk") return this.talk();
    if (f === "exit") return this.leave();
    if (typeof f === "function") return f();
    if (f && f.action === "talk") return this.talk();
    return super.interact(f);
  }
  async talk() {
    if(this.interacting||this.closed)return;
    this.interacting=true;this.party[0].dir="up";
    try {
      if(this.shopId==="link"){await PuzzleArcade.open(this.back);return;}
      const retail=BUY_SHOPS[this.shopId],work=SHOPS[this.shopId];
      // ③ みなとの マルシェでは りっぱな つりざおも かえる
      const pro=typeof Fishing!=="undefined"&&Fishing.proChoice(this);
      // ③ スーパーでは いけすの さかなを うれる（つった ときには うらない）
      const sell=typeof Fishing!=="undefined"&&Fishing.sellChoice(this);
      // スーパーでは ほった ほねも うれる（js/fossil-sell.js・UI-69）
      const bones=typeof FossilSell!=="undefined"&&FossilSell.choice(this);
      // ネリカスタウンの コンビニでは いちばんくじも ひける（js/ichiban-kuji.js）
      const kuji=typeof IchibanKuji!=="undefined"&&IchibanKuji.talkChoice(this);
      // ネリカスタウンの コンビニの ポイントカード（js/conbini-card.js・UI-85）: カードを つくる・ポイント・こうかん
      const card=typeof ConbiniCard!=="undefined"&&ConbiniCard.talkChoice(this);
      const choices=[...(retail?["かいものを する"]:[]),...(kuji?[kuji.label]:[]),...(card?[card.label]:[]),...(sell?[sell]:[]),...(bones?[bones]:[]),...(pro?[pro]:[]),...(work?["おてつだいする"]:[]),"また あとで"];
      const fav=work&&typeof WorkExp!=="undefined"?WorkExp.favOf(this.shopId):null; // とくいな おてつだい（UI-68）
      const text=retail?retail.hello[0]:`${work.desc}。\nおみせ Lv.${ShopRewards.level(Save.d.shops[this.shopId])}${GameEconomy.lvBonusPct(ShopRewards.level(Save.d.shops[this.shopId]))?`・コイン +${GameEconomy.lvBonusPct(ShopRewards.level(Save.d.shops[this.shopId]))}%`:""}${fav?`\n★ ${Save.d.chars[fav].name}の とくいな おてつだい`:""}`;
      const answer=await UI.ask(`${this.owner.name}\n${text}`,choices),picked=choices[answer];
      if(this.closed)return;
      if(retail&&picked==="かいものを する"){await ShopUI.open(this.shopId);Save.write();}
      else if(kuji&&picked===kuji.label){await kuji.run();Save.write();}
      else if(card&&picked===card.label){await card.run();Save.write();}
      else if(sell&&picked===sell){await Fishing.sell();Save.write();}
      else if(bones&&picked===bones){await FossilSell.open();Save.write();}
      else if(pro&&picked===pro){await Fishing.buyPro(this.owner);Save.write();}
      else if(work&&picked==="おてつだいする"){
        if(Chara.IDS.some(id=>Save.d.chars[id].hunger<8))await UI.say([{who:"wanko",emo:"sad",text:"おなかが ぺこぺこだよ〜。\nごはんを たべてから おてつだい しよう。"}]);
        else {
          // ころころ フルーツは ちゅうもん モード と スコア モード（js/korokoro-score.js）を えらべる
          const mode=typeof KorokoroScore!=="undefined"?await KorokoroScore.choose(this):"order";
          if(this.closed||!mode)return;
          // あたまの たいそう・パズル こうぼうは 3しゅの ゲームから えらぶ（SHOP_GAMES。js/mg-brain.js・js/mg-kobo.js。ほかの おみせは ""）
          const menu=mode==="order"&&typeof SHOP_GAMES!=="undefined"?SHOP_GAMES[this.shopId]:null;
          const game=menu?await menu.choose(this):"";
          if(this.closed||game===null)return;
          if(mode==="score")KorokoroScore.start(this.back);
          else Game.goto("shop",{shop:this.shopId,back:this.back,returnStore:true,variant:game||(this.shopId==="burger"&&this.back.map==="heiwadai"?"mac":null)});
        }
      }
    } finally { this.interacting=false; }
  }
  leave() { if (this.closed || Game.trans) return; Save.write(); Sound.se("door"); Game.goto("world", this.back); }
  key(k, down) { if (down && k === "ok") this.request("talk"); }
  // タップ: 店員・レジ → はなす／でぐちの マット → でる／くじの たな → くじ／ならべた もの → ひとこと／テーブル → すわる／ゆか → あるく
  up(p, cancel) {
    if (!IndoorWalk.release(this, p, cancel)) return;
    const f = this.fixtureAt(p.x, p.y);
    if (f) { this.tapFixture(f); return; }
    const t = this.floorAt(p.x, p.y);
    if (t.y === StoreIso.H - 1 && t.x >= 4 && t.x <= 6) { this.request("exit"); return; }
    if (!this.walkTo(t.x, t.y)) this.walkNear(t.fx, t.fy);
  }
  tapFixture(f) {
    if (f.action === "talk") { this.request("talk"); return; }
    if (typeof IchibanKuji !== "undefined" && IchibanKuji.tapFixture(this, f)) { this.highlight = { f, until: G.t + 1.5 }; return; }
    if (f.action === "look") { Sound.se("tap"); UI.toast(f.label + "。" + (f.text || "ゆっくり みていってね")); this.highlight = { f, until: G.t + 1.5 }; return; }
    // おきゃくさん（kind "npc"）: その ばで ひとこと
    if (f.action === "chat") { if (Game.inputLocked || this.interacting || this.busy) return; this.busy = true; Sound.se("tap"); UI.say((f.lines || ["こんにちは！"]).map((text) => ({ name: f.label, face: Art.npcSvg({ sp: f.sp, emo: "happy", ...(f.outfit ? { outfit: f.outfit } : {}) }), text }))).finally(() => { this.busy = false; }); return; }
    if (Game.inputLocked || this.interacting || this.busy) return;
    super.request(f);
  }
  update(dt) {
    NpcLife.updateStationary(this.keeperActor, dt, !!this.interacting);
    if (this.interacting) { this.cancel(); return; }
    super.update(dt);
    const l = this.party[0];
    if (!this.closed && !Game.trans && !l.moving && !this.path.length && !this.pending && l.tx === 5 && l.ty === StoreIso.H - 1) this.leave();
  }
}
SCENES.store = StoreScene;
