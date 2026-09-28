// 上から見た町・フィールド（ポケモン風）。3人は いつも いっしょに 歩く。
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : dy < 0 ? "up" : null);
const WALK_DUR = 0.2, RUN_DUR = 0.13;
const CHAR_SIZE = 46; // キャラの表示幅（論理px）

const Maps = {
  cache: {},
  get(id) { return this.cache[id] || (this.cache[id] = new WorldMap(id)); },
};
// バトルから戻ったとき用：倒した敵を覚えておく
const FieldMemory = { map: null, defeated: new Set(), fled: null };

class Walker {
  constructor(x, y, dir) {
    this.tx = x; this.ty = y; this.fx = x; this.fy = y;
    this.dir = dir || "down"; this.moving = false; this.t = 1; this.dur = WALK_DUR;
    this.anim = Math.random() * 2; this.hop = 0;
  }
  moveTo(nx, ny, dur, carry = 0) {
    this.fx = this.tx; this.fy = this.ty;
    this.tx = nx; this.ty = ny;
    const d = dirOf(nx - this.fx, ny - this.fy);
    if (d) this.dir = d;
    this.dur = dur; this.t = Math.min(0.99, carry / dur); this.moving = true;
  }
  update(dt) {
    this.anim += dt;
    if (!this.moving) return 0;
    this.t += dt / this.dur;
    if (this.t >= 1) {
      const over = (this.t - 1) * this.dur;
      this.t = 1; this.moving = false; this.fx = this.tx; this.fy = this.ty;
      return over > 0 ? over : 1e-6;
    }
    return 0;
  }
  get x() { return this.fx + (this.tx - this.fx) * this.t; }
  get y() { return this.fy + (this.ty - this.fy) * this.t; }
  feet() { return { x: this.x * TS + TS / 2, y: this.y * TS + TS - 5 }; }
  pose() {
    if (this.moving || this.walkHold > 0) {
      const f = Math.floor(this.anim * (this.dur < 0.15 ? 12 : 8)) % 4;
      return ["idle_01", "walk_01", "idle_01", "walk_02"][f];
    }
    return Math.floor(this.anim / 0.5) % 2 ? "idle_02" : "idle_01";
  }
}

class WorldScene {
  async enter(p = {}) {
    DailyPlay.visit();
    const w = Save.d.world;
    this.mapId = p.map || w.map || "town";
    this.map = Maps.get(this.mapId);
    if (FieldMemory.map !== this.mapId) { FieldMemory.map = this.mapId; FieldMemory.defeated = new Set(); }
    let x = p.x != null ? p.x : w.x, y = p.y != null ? p.y : w.y;
    const safe=this.map.def.heiwadai&&this.map.isSolid(x,y)?this.map.def.safeSpawn:TownRenewal.safePosition(this.map,x,y);
    if(safe)[x,y]=safe;
    if (this.map.isSolid(x, y) && !this.map.doorAt(x, y)) { const f = this.findFree(x, y); x = f[0]; y = f[1]; }
    const dir = p.dir || w.dir || "down";
    this.party = Save.d.order.map(() => new Walker(x, y, dir));
    // なかまは うしろに ならべる
    const [bx, by] = DIRS[dir];
    for (let i = 1; i < this.party.length; i++) {
      const px = x - bx * i, py = y - by * i;
      if (!this.map.isSolid(px, py)) { this.party[i].tx = this.party[i].fx = px; this.party[i].ty = this.party[i].fy = py; }
    }
    this.npcs = (this.map.def.npcs || []).map((n) => ({ ...n, w: new Walker(n.x, n.y, n.dir), timer: U.rand(1, 3) }));
    this.enemies = [];
    this.spawnEnemies();
    this.fx = [];
    this.path = null; this.pending = null; this.joy = null; this.grace = p.grace || 0;
    this.cam = { x: 0, y: 0 };
    this.snapCamera();
    this.hintT = Save.d.flags.moveHint ? 0 : 6;
    await this.preload();
    Sound.bgm(this.map.bgm);
    UI.showHud(true, this.map.name);
    Seasonal.mount(this);
    Weather.mount(this);
    if (typeof TownFolk !== "undefined") TownFolk.mount(this);
    this.saveWorld();
    if (p.after) setTimeout(() => p.after(this), 350);
    // はじめて来た場所の ヒント
    const f = Save.d.flags;
    const hint = { town: "「！」マークの ひとに はなしかけてみよう", meadow: "まものに ふれると バトル！ HPが へったら おうちで ねよう", forest: "もりの おくに いやしの いずみが あるよ", cave: "どうくつの おくに キングプルンが いる……" }[this.mapId];
    if (hint && !f["visit_" + this.mapId]) { f["visit_" + this.mapId] = true; setTimeout(() => { if(G.scene===this&&!UI.busy)UI.toast(hint, "good"); }, 700); }
  }
  exit() { this.festivalButton?.remove(); this.weatherButton?.remove(); if (typeof TownFolk !== "undefined") TownFolk.unmount(); UI.showHud(false); }
  saveWorld() {
    const L = this.party[0];
    Save.d.world = { map: this.mapId, x: L.tx, y: L.ty, dir: L.dir };
    Save.mark();
  }
  findFree(x, y) {
    for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!this.map.isSolid(x + dx, y + dy)) return [x + dx, y + dy];
    return [x, y];
  }

  spawnEnemies() {
    const area = this.map.area && AREAS[this.map.area];
    if (!area) return;
    (this.map.def.spawns || []).forEach(([x, y], i) => {
      if (FieldMemory.defeated.has(i)) return;
      if (U.hash(x, y, Math.floor(Date.now() / 600000)) < 0.15) return; // たまに いない
      const kind = this.pickEnemy(area);
      this.enemies.push({ idx: i, kind: kind[0], lv: U.randi(kind[1], kind[2]), home: [x, y], w: new Walker(x, y, "down"), timer: U.rand(0.5, 2), chase: false, stun: FieldMemory.fled === i ? 3.5 : 0 });
    });
    FieldMemory.fled = null;
    const b = this.map.def.boss;
    if (b && Save.d.flags.bossDay !== U.today()) {
      this.enemies.push({ idx: -1, boss: true, kind: b.enemy, lv: ENEMIES[b.enemy].lv, home: [b.x, b.y], w: new Walker(b.x, b.y, "down"), timer: 1e9, stun: 0 });
    }
  }
  pickEnemy(area) {
    const tot = area.table.reduce((s, e) => s + e[3], 0);
    let r = Math.random() * tot;
    for (const e of area.table) { r -= e[3]; if (r <= 0) return e; }
    return area.table[0];
  }

  async preload() {
    const list = [];
    const poses = ["idle_01", "idle_02", "walk_01", "walk_02"];
    for (const id of Save.d.order) {
      const c = Save.d.chars[id];
      for (const dir of ["down", "up", "left", "right"]) for (const pose of poses) list.push([id, { pose, dir, outfit: c.outfit, color: c.color }]);
    }
    const jobs = [Chara.preload(list, CHAR_SIZE),TownRoads.preload(this.map.def),HeiwadaiGround.preload(this.map.def),HeiwadaiLife.preload(this.map.def)];
    for(const it of [...(this.map.def.decals||[]),...(this.map.def.overhead||[])])jobs.push(HeiwadaiTown.canvas(this,it,true));
    const kinds = new Set(this.map.sprites.map((s) => (s.kind === "building" ? "b:" + s.spec.id : s.kind)));
    for (const s of this.map.sprites) jobs.push(this.spriteCanvas(s, true));
    for (const n of this.npcs) jobs.push(this.npcCanvas(n, n.w.dir, "idle_01", true));
    for (const e of this.enemies) jobs.push(this.enemyCanvas(e, true));
    jobs.push(this.objCanvas("chest", { open: false }, true), this.objCanvas("chest", { open: true }, true));
    await Promise.all(jobs);
  }

  // ---- スプライト取得 ----
  objCanvas(kind, opt, ensure) {
    opt=ShopDecor.options(kind,opt);
    const cacheOpt=kind==="building"&&opt.style?{style:opt.style,w:opt.w,h:opt.h,door:opt.door,shopTier:opt.shopTier}:opt;
    const key = "w:" + kind + ":" + JSON.stringify(cacheOpt || {}) + (SeasonPalette.vegetation(kind)?":"+SeasonPalette.id():"");
    const a = SeasonPalette.object(kind,Art.worldSvg(kind, opt));
    const pw = Math.ceil((a.w + 4) * G.px), ph = Math.ceil((a.h + 4) * G.px);
    if (ensure) return SvgCache.ensure(key, () => a.full, pw, ph);
    const c = SvgCache.get(key, () => a.full, pw, ph);
    return c ? { c, a } : null;
  }
  spriteCanvas(s, ensure) {
    if((s.spec||s.o)?.asset)return HeiwadaiTown.canvas(this,s.spec||s.o,ensure);
    if (s.kind === "building") return this.objCanvas("building", s.spec, ensure);
    if (s.kind === "gate") return this.objCanvas("gate", null, ensure);
    if (s.kind === "spring") return this.objCanvas("well", null, ensure);
    return this.objCanvas(s.kind, null, ensure);
  }
  npcCanvas(n, dir, pose, ensure) {
    const spec = { sp: n.sp, col: n.col, col2: n.col2, stripe: n.stripe, outfit: n.outfit, dir, pose, emo: n.emo || "normal" };
    const key = "npc:" + JSON.stringify(spec);
    const pw = Chara.pxSize(CHAR_SIZE), ph = Math.round((pw * VB.h) / VB.w);
    if (ensure) return SvgCache.ensure(key, () => Art.npcSvg(spec), pw, ph);
    return SvgCache.get(key, () => Art.npcSvg(spec), pw, ph);
  }
  enemyCanvas(e, ensure) {
    const d = ENEMIES[e.kind];
    const size = e.boss ? 84 : 40;
    const key = "enemy:" + e.kind;
    const pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    if (ensure) return SvgCache.ensure(key, () => Art.enemySvg(d.art, d.col), pw, ph);
    return SvgCache.get(key, () => Art.enemySvg(d.art, d.col), pw, ph);
  }

  // ---- カメラ ----
  snapCamera() {
    const f = this.party[0].feet();
    this.cam.x = f.x; this.cam.y = f.y - 10;
    this.clampCam();
  }
  clampCam() {
    const mw = this.map.w * TS, mh = this.map.h * TS;
    const hw = G.W / 2, hh = G.H / 2;
    this.cam.x = mw <= G.W ? mw / 2 : U.clamp(this.cam.x, hw, mw - hw);
    this.cam.y = mh <= G.H ? mh / 2 : U.clamp(this.cam.y, hh - 40, mh - hh + 60);
  }
  resize() { this.clampCam(); }

  // ---- 入力 ----
  down(p) {
    this.touch = { sx: p.x, sy: p.y, id: p.id };
  }
  move(p) {
    if (!this.touch || this.touch.id !== p.id) return;
    const dx = p.x - this.touch.sx, dy = p.y - this.touch.sy;
    if (!this.joy && Math.hypot(dx, dy) > 12) { this.joy = { bx: this.touch.sx, by: this.touch.sy, id: p.id }; this.path = null; this.pending = null; }
    if (this.joy) { this.joy.x = p.x; this.joy.y = p.y; }
  }
  up(p) {
    if (this.joy && this.joy.id === p.id) { this.joy = null; this.touch = null; return; }
    this.touch = null;
    if (p.tap) this.tapAt(p.x, p.y);
  }
  cancel() { this.joy = null; this.touch = null; }
  key(k, down) {
    if (down && k === "ok") this.interactFront();
    if (down && k === "cancel") Game.openMenu();
  }
  joyDir() {
    if (this.joy) {
      const dx = this.joy.x - this.joy.bx, dy = this.joy.y - this.joy.by;
      if (Math.hypot(dx, dy) < 10) return null;
      return { d: dirOf(dx, dy), run: Math.hypot(dx, dy) > 46 };
    }
    for (const k of ["up", "down", "left", "right"]) if (G.keys[k]) return { d: k, run: false };
    return null;
  }

  screenToTile(sx, sy) {
    const wx = sx - G.W / 2 + this.cam.x, wy = sy - G.H / 2 + this.cam.y;
    return { tx: Math.floor(wx / TS), ty: Math.floor(wy / TS), wx, wy };
  }
  tapAt(sx, sy) {
    const { tx, ty, wx, wy } = this.screenToTile(sx, sy);
    Save.d.flags.moveHint = true;
    // キャラの見た目で当たり判定（頭をタップしても反応するように）
    const hitBody = (wk,offset=[0,0]) => { const f = wk.feet();f.x+=offset[0]*TS;f.y+=offset[1]*TS; return Math.abs(wx - f.x) < 16 && wy < f.y + 4 && wy > f.y - 44; };
    const npc = this.npcs.find((n) => hitBody(n.w,n.artOffset));
    if (npc) return this.goInteract(npc.w.tx, npc.w.ty, { type: "npc", npc });
    const en = this.enemies.find((e) => e.boss && Math.abs(wx - e.w.feet().x) < 40 && wy < e.w.feet().y + 4 && wy > e.w.feet().y - 80);
    if (en) return this.goInteract(en.w.tx, en.w.ty, { type: "boss", e: en });
    // なかまをタップ → ひとこと
    const mate = this.party.findIndex((wk) => hitBody(wk));
    if (mate >= 0) { this.partyChatter(mate); return; }
    const map = this.map;
    const door = map.doorAt(tx, ty) || this.buildingDoorAt(tx, ty);
    if (door) return this.goTo(door.x, door.y, null);
    const sign = map.signs.find((s) => s.x === tx && s.y === ty);
    if (sign) return this.goInteract(tx, ty, { type: "sign", sign });
    const chest = map.chests.find((c) => c.x === tx && c.y === ty);
    if (chest) return this.goInteract(tx, ty, { type: "chest", chest });
    const spring = (map.def.objects || []).find((o) => o.kind === "spring" && o.x === tx && o.y === ty);
    if (spring) return this.goInteract(tx, ty, { type: "spring" });
    const object = WorldScenery.at(map, tx, ty);
    if (object) return this.goObject(object);
    if (!map.isSolid(tx, ty)) return this.goTo(tx, ty, null);
  }
  goObject(o) {
    const L=this.party[0], candidates=[];
    for(let y=Math.floor(o.y);y<Math.ceil(o.y+o.h);y++) for(let x=Math.floor(o.x);x<Math.ceil(o.x+o.w);x++) {
      if(x!==Math.floor(o.x)&&x!==Math.ceil(o.x+o.w)-1&&y!==Math.floor(o.y)&&y!==Math.ceil(o.y+o.h)-1)continue;
      const path=this.findPath(L.tx,L.ty,x,y,true);
      if(path)candidates.push({x,y,path});
    }
    candidates.sort((a,b)=>a.path.length-b.path.length);
    if(candidates.length){const p=candidates[0];this.goInteract(p.x,p.y,{type:"scenery",object:o});}
    else Sound.se("cancel");
  }
  buildingDoorAt(tx, ty) {
    for (const d of this.map.doors) { const b = d.b; if (tx >= b.x && tx < b.x + b.w && ty >= b.y - 1 && ty < b.y + b.h) return d; }
    return null;
  }
  goTo(tx, ty, pending) {
    const L = this.party[0];
    const path = this.findPath(L.tx, L.ty, tx, ty, false);
    if (path) { this.path = path; this.pending = pending; this.tapMark = { x: tx, y: ty, t: 0.6 }; }
    else Sound.se("cancel");
  }
  goInteract(tx, ty, pending) {
    const L = this.party[0];
    if (Math.abs(L.tx - tx) + Math.abs(L.ty - ty) === 1 && !L.moving) { L.dir = dirOf(tx - L.tx, ty - L.ty); this.interact(pending); return; }
    const path = this.findPath(L.tx, L.ty, tx, ty, true);
    if (path) { this.path = path; this.pending = { ...pending, tx, ty }; this.tapMark = { x: tx, y: ty, t: 0.6 }; }
    else Sound.se("cancel");
  }
  blockedByNpc(x, y) {
    return this.npcs.some((n) => (n.w.tx === x && n.w.ty === y) || (n.w.moving && n.w.fx === x && n.w.fy === y));
  }
  walkable(x, y) {
    if (this.map.isSolid(x, y)) return false;
    if (this.blockedByNpc(x, y)) return false;
    if (this.enemies.some((e) => e.boss && Math.abs(e.w.tx - x) <= 1 && e.w.ty === y)) return false;
    return true;
  }
  // BFS。adjacent=true なら目的地のとなりまで
  findPath(sx, sy, gx, gy, adjacent) {
    const W = this.map.w, H = this.map.h;
    const prev = new Int32Array(W * H).fill(-1);
    const start = sy * W + sx;
    prev[start] = start;
    const q = [start];
    let found = -1;
    const isGoal = (x, y) => (adjacent ? Math.abs(x - gx) + Math.abs(y - gy) === 1 : x === gx && y === gy);
    if (isGoal(sx, sy)) return [];
    let n = 0;
    while (q.length && n++ < 6000) {
      const cur = q.shift();
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1) continue;
        const goal = isGoal(nx, ny);
        if (!this.walkable(nx, ny) && !(goal && !adjacent && this.map.doorAt(nx, ny))) continue;
        prev[ni] = cur;
        if (goal) { found = ni; break; }
        q.push(ni);
      }
      if (found >= 0) break;
    }
    if (found < 0) return null;
    const out = [];
    for (let c = found; c !== start; c = prev[c]) out.push([c % W, (c / W) | 0]);
    return out.reverse();
  }

  // ---- 更新 ----
  update(dt) {
    if (this.grace > 0) this.grace -= dt;
    if (this.hintT > 0) this.hintT -= dt;
    if (this.tapMark) { this.tapMark.t -= dt; if (this.tapMark.t <= 0) this.tapMark = null; }
    const L = this.party[0];
    let carry = 0;
    for (let i = 0; i < this.party.length; i++) {
      const o = this.party[i].update(dt);
      if (i === 0) carry = o;
      if (this.party[i].walkHold > 0) this.party[i].walkHold -= dt;
    }
    if (carry > 0) this.onArrive();
    if (!L.moving && !this.busy && !Game.inputLocked) this.decideStep(carry > 0 ? carry : 0);
    this.updateNpcs(dt);
    this.updateEnemies(dt);
    this.fx = this.fx.filter((f) => (f.t += dt) < f.dur);
    // カメラは なめらかに追いかける
    const f = L.feet();
    const k = 1 - Math.pow(0.001, dt);
    this.cam.x += (f.x - this.cam.x) * k;
    this.cam.y += (f.y - 10 - this.cam.y) * k;
    this.clampCam();
    UI.updateHud();
    Seasonal.refresh(this);
    Weather.refresh(this);
  }
  decideStep(carry) {
    const L = this.party[0];
    let dir = null, run = false;
    const j = this.joyDir();
    if (j) { dir = j.d; run = j.run; this.path = null; this.pending = null; }
    else if (this.path && this.path.length) {
      const [nx, ny] = this.path[0];
      if (!this.walkable(nx, ny) && !this.map.doorAt(nx, ny)) {
        // NPCが道をふさいだ → 引き直す
        const goal = this.path[this.path.length - 1];
        const np = this.findPath(L.tx, L.ty, goal[0], goal[1], false);
        this.path = np && np.length ? np : null;
        if (!this.path) return;
      }
      const [px, py] = this.path.shift();
      dir = dirOf(px - L.tx, py - L.ty);
      run = this.path.length > 6;
    } else if (this.pending) {
      const p = this.pending;
      this.pending = null;
      if (p.tx != null) L.dir = dirOf(p.tx - L.tx, p.ty - L.ty) || L.dir;
      this.interact(p);
      return;
    }
    if (!dir) return;
    const [dx, dy] = DIRS[dir];
    const nx = L.tx + dx, ny = L.ty + dy;
    if (!this.walkable(nx, ny) && !this.map.doorAt(nx, ny)) {
      if (L.dir !== dir) { L.dir = dir; }
      this.path = null;
      return;
    }
    this.stepParty(nx, ny, run ? RUN_DUR : WALK_DUR, carry);
  }
  stepParty(nx, ny, dur, carry = 0) {
    const P = this.party;
    for (let i = P.length - 1; i >= 1; i--) {
      const lead = P[i - 1];
      if (lead.tx !== P[i].tx || lead.ty !== P[i].ty) P[i].moveTo(lead.tx, lead.ty, dur, carry);
      else P[i].walkHold = dur;
    }
    P[0].moveTo(nx, ny, dur, carry);
  }
  onArrive() {
    const L = this.party[0];
    this.saveWorld();
    const warp = this.map.warpAt(L.tx, L.ty);
    if (warp) {
      this.busy = true;
      Sound.se("door");
      Game.goto("world", { map: warp.to, x: warp.tx, y: warp.ty, dir: warp.dir });
      return;
    }
    const door = this.map.doorAt(L.tx, L.ty);
    if (door) { this.path = null; this.pending = null; this.enterDoor(door); }
  }

  // ---- ドア ----
  async enterDoor(door) {
    const b = door.b;
    const act = b.act;
    Sound.se("door");
    const out = { map: this.mapId, x: door.x, y: door.y + 1, dir: "down" };
    if (act.type === "transit" || act.type === "visit") {
      this.busy = true;
      if (act.type === "transit" && await Transit.open(act.stop)) return;
      if (act.type === "visit") await UI.say([{ name: b.label, text: act.text }]);
      this.busy = false; this.stepOut(door); return;
    }
    if (act.type === "house") { this.busy = true; Game.goto("house", {}, "circle"); return; }
    if (act.type === "buy" || act.type === "work") {
      this.busy = true;
      Game.goto("store", { shop: act.shop, back: out }, "circle");
      return;
    }
  }
  stepOut(door) {
    const nx = door.x, ny = door.y + 1;
    if (this.walkable(nx, ny)) this.stepParty(nx, ny, WALK_DUR);
    this.party[0].dir = "down";
  }

  // ---- はなしかける ----
  interactFront() {
    const L = this.party[0];
    if (L.moving) return;
    const [dx, dy] = DIRS[L.dir];
    const x = L.tx + dx, y = L.ty + dy;
    const npc = this.npcs.find((n) => n.w.tx === x && n.w.ty === y);
    if (npc) return this.interact({ type: "npc", npc });
    const sign = this.map.signs.find((s) => s.x === x && s.y === y);
    if (sign) return this.interact({ type: "sign", sign });
    const chest = this.map.chests.find((c) => c.x === x && c.y === y);
    if (chest) return this.interact({ type: "chest", chest });
    if ((this.map.def.objects || []).some((o) => o.kind === "spring" && o.x === x && o.y === y)) return this.interact({ type: "spring" });
    const object=WorldScenery.at(this.map,x,y);
    if(object)return this.interact({type:"scenery",object});
    const boss = this.enemies.find((e) => e.boss && Math.abs(e.w.tx - x) <= 1 && e.w.ty === y);
    if (boss) return this.interact({ type: "boss", e: boss });
  }
  async interact(p) {
    if (this.busy) return;
    const L = this.party[0];
    if (p.type === "scenery") {
      WorldScenery.activate(this,p.object);
    } else if (p.type === "npc") {
      const n = p.npc;
      n.w.dir = dirOf(L.tx - n.w.tx, L.ty - n.w.ty) || n.w.dir;
      n.talking = true;
      this.busy = true;
      await Talk.run(n, this);
      n.talking = false;
      this.busy = false;
    } else if (p.type === "sign") {
      this.busy = true;
      Sound.se("tap");
      await UI.say([{ name: "かんばん", text: p.sign.text }]);
      this.busy = false;
    } else if (p.type === "chest") {
      this.busy = true;
      await this.openChest(p.chest);
      this.busy = false;
    } else if (p.type === "spring") {
      this.busy = true;
      Save.healAll();
      Save.careAll({ mood: 5 });
      Sound.se("heal");
      for (const w of this.party) this.addFx("heart", w);
      await UI.say([{ name: "いやしの いずみ", text: "きらきら ひかる みずを のんだ。\nみんなの HPと SPが ぜんかいした！" }]);
      this.busy = false;
    } else if (p.type === "boss") {
      this.busy = true;
      const lvAvg = Math.round(Chara.IDS.reduce((s, id) => s + Save.d.chars[id].lv, 0) / 3);
      await UI.say([{ name: "キングプルン", text: "ぷるるるる……！\nワシの どうくつに なんの ようじゃ！" }]);
      const i = await UI.ask(`キングプルンと たたかう？\n（おすすめ レベル 16〜 ／ いまの へいきん Lv.${lvAvg}）`, ["たたかう！", "やめておく"]);
      if (i === 0) {
        this.startBattle(p.e);
        return;
      }
      this.busy = false;
    }
  }
  async openChest(c) {
    const f = Save.d.flags.chests;
    const opened = c.daily ? f[c.id] === U.today() : !!f[c.id];
    if (opened) { await UI.say([{ name: "たからばこ", text: c.daily ? "からっぽだ。\nあしたに なったら また なにか はいっているかも？" : "からっぽだ。" }]); return; }
    f[c.id] = c.daily ? U.today() : true;
    Save.mark();
    Sound.se("sparkle");
    this.addFx("sparkle", { feet: () => ({ x: c.x * TS + 16, y: c.y * TS + 24 }) });
    const msg = Loot.give(c.loot, { chest: true });
    await UI.say([{ name: "たからばこ", text: `たからばこを あけた！\n${msg}` }]);
  }
  partyChatter(i) {
    const id = Save.d.order[i];
    const c = Save.d.chars[id];
    Sound.voice(id);
    const w = this.party[i];
    w.hop = 0.35;
    this.addFx(c.hunger < 25 ? "sweat" : c.mood > 70 ? "heart" : "note", w);
    const lines = c.hunger < 25 ? ["おなか すいたなぁ……", "ごはん たべたい〜"] : c.mood < 30 ? ["ちょっと つかれたかも", "おうちで あそびたいな"] : ["いっしょに いこうね！", "たのしいね！", "つぎは どこに いく？", "えへへ"];
    UI.toast(`${c.name}「${U.pick(lines)}」`);
  }
  addFx(kind, target, dur = 1.1) { this.fx.push({ kind, target, t: 0, dur }); }

  // ---- NPC ----
  updateNpcs(dt) {
    for (const n of this.npcs) {
      n.w.update(dt);
      if (!n.wander || n.talking || this.busy) continue;
      n.timer -= dt;
      if (n.timer > 0 || n.w.moving) continue;
      n.timer = U.rand(1.5, 4);
      const d = U.pick(["up", "down", "left", "right"]);
      const [dx, dy] = DIRS[d];
      const nx = n.w.tx + dx, ny = n.w.ty + dy;
      const [x0, y0, x1, y1] = n.wander;
      n.w.dir = d;
      if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
      if (this.map.isSolid(nx, ny) || this.map.doorAt(nx, ny)) continue;
      if (this.party.some((p) => (p.tx === nx && p.ty === ny) || (p.fx === nx && p.fy === ny))) continue;
      if (this.npcs.some((o) => o !== n && o.w.tx === nx && o.w.ty === ny)) continue;
      n.w.moveTo(nx, ny, 0.36);
    }
  }

  // ---- てき ----
  updateEnemies(dt) {
    const L = this.party[0];
    for (const e of this.enemies) {
      e.w.update(dt);
      if (e.boss) continue;
      if (e.stun > 0) { e.stun -= dt; continue; }
      const d = Math.abs(e.w.tx - L.tx) + Math.abs(e.w.ty - L.ty);
      if (!this.busy && !Game.inputLocked && this.grace <= 0) {
        const ef = e.w.feet(), lf = L.feet();
        if (Math.hypot(ef.x - lf.x, ef.y - lf.y) < 22) { this.startBattle(e); return; }
      }
      if (this.busy || Game.inputLocked) continue;
      e.chase = d <= 4 ? true : d > 7 ? false : e.chase;
      e.timer -= dt;
      if (e.w.moving || e.timer > 0) continue;
      let dir;
      if (e.chase && this.grace <= 0) {
        e.timer = 0.05;
        const dx = L.tx - e.w.tx, dy = L.ty - e.w.ty;
        const opts = [];
        if (dx) opts.push(dx > 0 ? "right" : "left");
        if (dy) opts.push(dy > 0 ? "down" : "up");
        if (Math.abs(dy) > Math.abs(dx)) opts.reverse();
        dir = opts.find((o) => this.enemyCan(e, o)) || null;
      } else {
        e.timer = U.rand(0.8, 2.4);
        dir = U.pick(["up", "down", "left", "right"]);
        const [dx, dy] = DIRS[dir];
        if (Math.abs(e.w.tx + dx - e.home[0]) > 3 || Math.abs(e.w.ty + dy - e.home[1]) > 3) dir = null;
      }
      if (dir && this.enemyCan(e, dir)) {
        const [dx, dy] = DIRS[dir];
        e.w.moveTo(e.w.tx + dx, e.w.ty + dy, e.chase ? 0.3 : 0.45);
      }
    }
  }
  enemyCan(e, dir) {
    const [dx, dy] = DIRS[dir];
    const x = e.w.tx + dx, y = e.w.ty + dy;
    if (this.map.isSolid(x, y) || this.map.warpAt(x, y) || this.map.doorAt(x, y) || this.blockedByNpc(x, y)) return false;
    if (this.enemies.some((o) => o !== e && o.w.tx === x && o.w.ty === y)) return false;
    return true;
  }
  startBattle(e) {
    if (this.busy && !e.boss) return;
    this.busy = true;
    this.path = null; this.joy = null;
    const area = AREAS[this.map.area];
    const foes = [{ kind: e.kind, lv: e.lv }];
    if (!e.boss) {
      const extra = U.randi(area.group[0], area.group[1]) - 1;
      for (let i = 0; i < extra; i++) { const k = this.pickEnemy(area); foes.push({ kind: k[0], lv: U.randi(k[1], k[2]) }); }
    }
    const L = this.party[0];
    Game.goto("battle", {
      foes, area: this.map.area, boss: !!e.boss,
      back: { map: this.mapId, x: L.tx, y: L.ty, dir: L.dir },
      spawnIdx: e.idx,
    }, "battle");
  }

  // ---- 描画 ----
  render(ctx) {
    const map = this.map;
    const ox = Math.round((G.W / 2 - this.cam.x) * G.px) / G.px;
    const oy = Math.round((G.H / 2 - this.cam.y) * G.px) / G.px;
    ctx.fillStyle = map.baseGround === "cave" ? "#2B2320" : map.baseGround === "forest" ? "#3F8E4F" : "#5DAA4F";
    ctx.fillRect(0, 0, G.W, G.H);
    // 地面チャンク
    const cs = 8 * TS;
    const x0 = Math.floor(-ox / cs), y0 = Math.floor(-oy / cs), x1 = Math.floor((G.W - ox) / cs), y1 = Math.floor((G.H - oy) / cs);
    for (let cy = Math.max(0, y0); cy <= Math.min(Math.ceil(map.h / 8) - 1, y1); cy++)
      for (let cx = Math.max(0, x0); cx <= Math.min(Math.ceil(map.w / 8) - 1, x1); cx++) {
        const c = Tiles.chunk(map, cx, cy);
        ctx.drawImage(c, ox + cx * cs, oy + cy * cs, cs, cs);
      }
    for(const it of map.def.decals||[])HeiwadaiTown.draw(ctx,this,it,ox,oy);
    this.renderWater(ctx, ox, oy);
    TownRenewal.drawMoving(ctx,this,ox,oy);
    if (this.tapMark) {
      const m = this.tapMark;
      ctx.save(); ctx.globalAlpha = Math.min(1, m.t * 2);
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
      const r = 8 + (0.6 - m.t) * 14;
      ctx.beginPath(); ctx.ellipse(ox + m.x * TS + 16, oy + m.y * TS + 22, r, r * 0.55, 0, 0, 7); ctx.stroke();
      ctx.restore();
    }
    // y順に並べて描く
    const list = [];
    const vx0 = -ox - 64, vx1 = G.W - ox + 64, vy0 = -oy - 40, vy1 = G.H - oy + 140;
    for (const s of map.sprites) {
      if(s.o?.over)continue;
      const wx = (s.bx != null ? s.bx : s.x) * TS, wy = (s.y + 1) * TS;
      if (s.o?.asset!=="rail.train" && (wx > vx1 || wx + (s.tw || 1) * TS < vx0 || wy < vy0 || wy - 200 > vy1)) continue;
      list.push({ z: wy - 1+(s.o?.z||0)*.32, draw: () => this.drawStatic(ctx, s, ox, oy) });
    }
    for (const c of map.chests) {
      const opened = c.daily ? Save.d.flags.chests[c.id] === U.today() : !!Save.d.flags.chests[c.id];
      list.push({ z: (c.y + 1) * TS - 2, draw: () => this.drawObjAt(ctx, "chest", { open: opened }, c.x, c.y, ox, oy) });
    }
    for (const n of this.npcs) {
      const f = n.w.feet();
      list.push({ z: f.y+(n.artOffset?.[1]||0)*TS, draw: () => this.drawNpc(ctx, n, ox, oy) });
    }
    for (const e of this.enemies) {
      const f = e.w.feet();
      list.push({ z: f.y + (e.boss ? 20 : 0), draw: () => this.drawEnemy(ctx, e, ox, oy) });
    }
    this.party.forEach((w, i) => {
      const f = w.feet();
      // ドアの マスに いるときは 建物より 手前に描く
      const onDoor = this.map.doorAt(Math.round(w.x), Math.round(w.y));
      list.push({ z: f.y + (3 - i) * 0.01 + (onDoor ? 40 : 0), draw: () => this.drawMember(ctx, i, ox, oy) });
    });
    list.sort((a, b) => a.z - b.z);
    for (const it of list) it.draw();
    HeiwadaiTown.overhead(ctx,this,ox,oy);
    // くさむらの 足もと
    const tallOn = new Set();
    const mark = (w) => { const tx = Math.round(w.x), ty = Math.round(w.y); if (map.isTall(tx, ty)) tallOn.add(tx + "," + ty); };
    this.party.forEach(mark); this.enemies.forEach((e) => mark(e.w));
    for (const k of tallOn) {
      const [tx, ty] = k.split(",").map(Number);
      ctx.save();
      ctx.beginPath(); ctx.rect(ox + tx * TS, oy + ty * TS + 14, TS, TS - 14); ctx.clip();
      Tiles.tallBlades(ctx, ox + tx * TS, oy + ty * TS, TS, "#5FA74A", "#8FD06E");
      ctx.restore();
    }
    this.renderFx(ctx, ox, oy);
    Seasonal.draw(ctx, this, ox, oy);
    this.renderLight(ctx, ox, oy);
    HeiwadaiLife.lights(ctx,this,ox,oy);
    Weather.draw(ctx,this);
    this.renderJoy(ctx);
    if (this.hintT > 0 && !this.joy && !UI.busy) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.hintT);
      const t = "タップで いどう ・ ドラッグで スティック";
      ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif";
      const w = ctx.measureText(t).width + 24;
      U.rr(ctx, G.W / 2 - w / 2, G.H - 44, w, 26, 13);
      ctx.fillStyle = "rgba(255,253,246,0.94)"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, G.W / 2, G.H - 31);
      ctx.restore();
    }
  }
  renderWater(ctx, ox, oy) {
    // 水面のきらめき（毎フレーム）
    const map = this.map;
    const tx0 = Math.max(0, Math.floor(-ox / TS)), tx1 = Math.min(map.w - 1, Math.floor((G.W - ox) / TS));
    const ty0 = Math.max(0, Math.floor(-oy / TS)), ty1 = Math.min(map.h - 1, Math.floor((G.H - oy) / TS));
    ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath();
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      if (map.groundAt(x, y) !== "water") continue;
      const ph = G.t * 1.6 + U.hash(x, y, 9) * 6;
      const k = (Math.sin(ph) + 1) / 2;
      const bx = ox + x * TS + 8 + U.hash(x, y, 3) * 10, by = oy + y * TS + 10 + U.hash(x, y, 4) * 12;
      ctx.moveTo(bx, by); ctx.lineTo(bx + 4 + k * 5, by);
    }
    ctx.stroke();
  }
  drawStatic(ctx, s, ox, oy, bounds) {
    if((s.spec||s.o)?.asset){HeiwadaiTown.draw(ctx,this,s.spec||s.o,ox,oy,bounds);return;}
    const r = this.spriteCanvas(s, false);
    if (!r) return;
    const { c, a } = r;
    const tw = s.tw || 1;
    const left = (s.bx != null ? s.bx : s.x) * TS, bottom = (s.y + 1) * TS;
    const w = a.w + 4, h = a.h + 4;
    let x = left + (tw * TS - a.w) / 2 - 2, y = bottom - a.h - 2;
    if (s.kind === "tree" || s.kind === "pine" || s.kind === "appletree") y += 2;
    ctx.drawImage(c, ox + x, oy + y, w, h);
    WorldScenery.draw(ctx, s, ox, oy, bounds);
    if(s.kind === "building" && s.spec.terminal && !s.spec.style) {
      ctx.save();ctx.font="800 10px 'M PLUS Rounded 1c',sans-serif";ctx.textAlign="center";ctx.fillStyle=INK;
      const label=s.spec.label, bw=Math.min(s.spec.w*TS-4,ctx.measureText(label).width+14);
      U.rr(ctx,ox+left+(tw*TS-bw)/2,oy+bottom-8,bw,18,5);ctx.fillStyle="#FFF6DF";ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();ctx.fillStyle=INK;ctx.fillText(label,ox+left+tw*TS/2,oy+bottom+5);ctx.restore();
    }
    if (s.kind === "gate" && s.o && s.o.text) {
      ctx.font = "800 9px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(s.o.text, ox + left + (tw * TS) / 2, oy + y + 2 + 21);
    }
    if (s.kind === "building" && G.t % 3 < 0.01) {}
  }
  drawObjAt(ctx, kind, opt, tx, ty, ox, oy) {
    const r = this.objCanvas(kind, opt, false);
    if (!r) return;
    const { c, a } = r;
    ctx.drawImage(c, ox + tx * TS + (TS - a.w) / 2 - 2, oy + (ty + 1) * TS - a.h - 2, a.w + 4, a.h + 4);
  }
  shadow(ctx, x, y, rx) {
    ctx.fillStyle = "rgba(31,29,27,0.16)";
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, 7); ctx.fill();
  }
  drawMember(ctx, i, ox, oy) {
    const w = this.party[i];
    const id = Save.d.order[i];
    const c = Save.d.chars[id];
    const f = w.feet();
    let hop = 0;
    if (w.hop > 0) { w.hop -= 1 / 60; hop = Math.sin((w.hop / 0.35) * Math.PI) * 8; }
    const blink = this.grace > 0 && Math.floor(G.t * 10) % 2 === 0;
    this.shadow(ctx, ox + f.x, oy + f.y, 13);
    Chara.draw(ctx, id, { pose: w.pose(), dir: w.dir, outfit: c.outfit, color: c.color }, ox + f.x, oy + f.y - hop, CHAR_SIZE, blink ? 0.45 : 1);
  }
  drawNpc(ctx, n, ox, oy) {
    const f = n.w.feet();f.x+=(n.artOffset?.[0]||0)*TS;f.y+=(n.artOffset?.[1]||0)*TS;
    const pose = n.w.moving ? (Math.floor(n.w.anim * 6) % 2 ? "walk_01" : "walk_02") : Math.floor(n.w.anim / 0.6) % 2 ? "idle_02" : "idle_01";
    const c = this.npcCanvas(n, n.w.dir, pose, false) || this.npcCanvas(n, n.w.dir, "idle_01", false) || this.npcCanvas(n, n.dir, "idle_01", false);
    this.shadow(ctx, ox + f.x, oy + f.y, 13);
    if (!c) return;
    const w = n.size||CHAR_SIZE, h = (w * VB.h) / VB.w;
    ctx.drawImage(c, ox + f.x - w * ((FOOT.x - VB.x) / VB.w), oy + f.y - h * ((FOOT.y - VB.y) / VB.h), w, h);
    if (Talk.hasNew(n)) {
      const bob = Math.sin(G.t * 4) * 2;
      this.bubble(ctx, ox + f.x + 12, oy + f.y - 46 + bob, "!");
    } else if (typeof TownFolk !== "undefined") {
      // ② おねがいの しるし: ▼ あいて ／ ！ ことわった おねがいが まって いる
      const mark = TownFolk.markerOf(n.id, this.mapId);
      if (mark) TownFolkArt.marker(ctx, mark, ox + f.x + 12, oy + f.y - 50, G.t);
    }
  }
  drawEnemy(ctx, e, ox, oy) {
    const f = e.w.feet();
    const size = e.boss ? 84 : 40;
    const bob = Math.abs(Math.sin(e.w.anim * (e.chase ? 9 : 4))) * (e.boss ? 3 : 4);
    this.shadow(ctx, ox + f.x, oy + f.y, e.boss ? 30 : 12);
    const c = this.enemyCanvas(e, false);
    if (!c) return;
    const w = size, h = (w * VB.h) / VB.w;
    const sq = 1 + Math.sin(e.w.anim * 8) * 0.03;
    ctx.save();
    ctx.translate(ox + f.x, oy + f.y);
    ctx.scale(e.w.dir === "left" ? -1 : 1, 1);
    ctx.scale(sq, 1 / sq);
    ctx.drawImage(c, -w * ((FOOT.x - VB.x) / VB.w), -h * ((FOOT.y - VB.y) / VB.h) - bob, w, h);
    ctx.restore();
    if (e.chase && !e.boss && e.stun <= 0) this.bubble(ctx, ox + f.x + 10, oy + f.y - 38, "!", "#FFE066");
    if (e.stun > 0) this.bubble(ctx, ox + f.x + 10, oy + f.y - 38, "?");
  }
  bubble(ctx, x, y, t, bg = "#FFFDF6") {
    ctx.save();
    ctx.fillStyle = bg; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    U.rr(ctx, x - 8, y - 9, 16, 17, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = "900 12px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(t, x, y + 0.5);
    ctx.restore();
  }
  renderFx(ctx, ox, oy) {
    for (const f of this.fx) {
      const p = f.target.feet ? f.target.feet() : f.target;
      const k = f.t / f.dur;
      const x = ox + p.x, y = oy + p.y - 50 - k * 16;
      ctx.save();
      ctx.globalAlpha = 1 - k * k;
      if (f.kind === "heart") FX.heart(ctx, x, y, 7);
      else if (f.kind === "note") FX.note(ctx, x, y);
      else if (f.kind === "sweat") FX.sweat(ctx, x + 10, y + 10);
      else if (f.kind === "sparkle") FX.sparkles(ctx, x, y + 30, k);
      ctx.restore();
    }
  }
  renderLight(ctx, ox, oy) {
    const cave = this.map.baseGround === "cave";
    const L = this.party[0].feet();
    if (cave) {
      const x = ox + L.x, y = oy + L.y - 16;
      const g = ctx.createRadialGradient(x, y, 40, x, y, 190);
      g.addColorStop(0, "rgba(20,14,30,0)");
      g.addColorStop(1, "rgba(20,14,30,0.72)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
      return;
    }
    const tint = DayTint.color();
    if (tint) {
      ctx.fillStyle = tint; ctx.fillRect(0, 0, G.W, G.H);
      if (DayTint.isNight()) {
        // 街灯と まどの あかり
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const s of this.map.sprites) {
          if (s.kind !== "lamp") continue;
          const x = ox + s.x * TS + 16, y = oy + s.y * TS - 2;
          const g = ctx.createRadialGradient(x, y, 2, x, y, 46);
          g.addColorStop(0, "rgba(255,220,140,0.55)"); g.addColorStop(1, "rgba(255,220,140,0)");
          ctx.fillStyle = g; ctx.fillRect(x - 46, y - 46, 92, 92);
        }
        ctx.restore();
      }
    }
  }
  renderJoy(ctx) {
    if (!this.joy) return;
    const j = this.joy;
    const dx = j.x - j.bx, dy = j.y - j.by, d = Math.hypot(dx, dy), m = Math.min(d, 40);
    const kx = j.bx + (d ? (dx / d) * m : 0), ky = j.by + (d ? (dy / d) * m : 0);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(255,253,246,0.5)"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(j.bx, j.by, 44, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#F48FB1";
    ctx.beginPath(); ctx.arc(kx, ky, 18, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
SCENES.world = WorldScene;

// 時間帯の色
const DayTint = {
  hour() { return U.hourNow(); },
  isNight() { const h = this.hour(); return h >= 19 || h < 5; },
  color() {
    const h = this.hour();
    if (h >= 5 && h < 7) return "rgba(255,190,150,0.14)";
    if (h >= 7 && h < 16) return null;
    if (h >= 16 && h < 18) return "rgba(255,150,70,0.13)";
    if (h >= 18 && h < 19) return "rgba(110,70,150,0.24)";
    return "rgba(20,30,90,0.36)";
  },
  sky() {
    const h = this.hour();
    if (h >= 5 && h < 7) return "#FFD1B3";
    if (h >= 7 && h < 16) return "#A8DBFF";
    if (h >= 16 && h < 18) return "#FFB38A";
    if (h >= 18 && h < 19) return "#9B7FC8";
    return "#2E3B6E";
  },
};

// 小さな演出（ハート・音符・汗・キラキラ）
const FX = {
  heart(ctx, x, y, s = 7, col = "#F06292") {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 7, s / 7);
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-7, 1, -6, -6, 0, -3); ctx.bezierCurveTo(6, -6, 7, 1, 0, 6); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  },
  note(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x - 3, y + 6, 4, 3, -0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x, y - 8); ctx.lineTo(x + 7, y - 5); ctx.stroke(); ctx.restore();
  },
  sweat(ctx, x, y) {
    ctx.save(); ctx.fillStyle = "#7EC8F0"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.quadraticCurveTo(x + 6, y + 1, x, y + 4); ctx.quadraticCurveTo(x - 6, y + 1, x, y - 7); ctx.fill(); ctx.stroke(); ctx.restore();
  },
  star(ctx, x, y, r, col = "#FFE066") {
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  },
  sparkles(ctx, x, y, k) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + k * 2, r = 8 + k * 26;
      FX.star(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, 4 * (1 - k) + 2);
    }
  },
};
