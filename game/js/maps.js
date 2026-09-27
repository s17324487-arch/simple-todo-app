// マップ定義。町は手描きのASCII、そとの世界は「ブラシ」で決定的に生成する。
// 記号: . 草  , 花  " くさむら  = 石の道  - 土の道  p 広場  ~ 水  s 砂  b 橋  d 森の地面  c どうくつの床
//       T 木  P 針葉樹  A りんごの木  B しげみ  R 岩  F さく  L 街灯  f 花だん  n ベンチ  h いけがき
//       x 切り株  m きのこ(通れる)  k すいしょう  r どうくつの岩  W どうくつの壁  # 建物  D ドア
const MAP_DEFS = {};

MAP_DEFS.town = {
  name: "ぽかぽかタウン", bgm: "town", baseGround: "grass",
  rows: [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "T..,....T.......T..,...T",
    "T.#####.T.#####.T.#####T",
    "T.#####...#####...#####T",
    "T.#####.,.#####.,.#####T",
    "T.##D##...##D##...##D##T",
    "T.ff=ff.L..,=,..L...=..T",
    "T.====================.T",
    "T.,.,..ppppppppppp..,,.T",
    "T.#####pnpppppppnp#####T",
    "T.#####ppppppppppp#####T",
    "T.#####ppppppppppp#####T",
    "T.##D##ppppppppppp##D##T",
    "T.L====pppp###pppp====LT",
    "T.,,...pppp###pppp..,,.T",
    "T......ppppppppppp.....T",
    "T.#####pnpppppppnp#####T",
    "T.#####ppppppppppp#####T",
    "T.#####ppppppppppp#####T",
    "T.##D##ppppppppppp##D##T",
    "T.L====ppppppppppp====LT",
    "T..........===.........T",
    "T.,........===.........T",
    "T..........===.sssssss.T",
    "T.#####....===.s~~b~~s.T",
    "T.#####....===.s~~b~~s.T",
    "T.#####....===.s~~~~~s.T",
    "T.##D##....===.s~~~~~s.T",
    "T..===========.sssssss.T",
    "T.,.......#===#......,.T",
    "TT.........===........TT",
    "TTTTTTTTTTT===TTTTTTTTTT",
  ],
  buildings: [
    { id: "home", x: 2, y: 2, w: 5, h: 4, door: 2, roof: "#E8665F", chimney: true, flowers: true, sign: "home", label: "おうち", act: { type: "house" } },
    { id: "clothes", x: 10, y: 2, w: 5, h: 4, door: 2, roof: "#5C9DED", awning: ["#7EC8F0", "#FFFFFF"], sign: "clothes", label: "ようふくやさん", act: { type: "buy", shop: "clothes" } },
    { id: "furniture", x: 18, y: 2, w: 5, h: 4, door: 2, roof: "#6DBE5B", awning: ["#8BCB6B", "#FFFFFF"], sign: "furniture", label: "かぐやさん", act: { type: "buy", shop: "furniture" } },
    { id: "crepe", x: 2, y: 9, w: 5, h: 4, door: 2, roof: "#F48FB1", awning: ["#F8BBD0", "#FFFFFF"], sign: "crepe", label: "クレープやさん", act: { type: "work", shop: "crepe" } },
    { id: "dentist", x: 18, y: 9, w: 5, h: 4, door: 2, roof: "#7EC8F0", awning: ["#B3E5FC", "#FFFFFF"], sign: "dentist", label: "はいしゃさん", act: { type: "work", shop: "dentist" } },
    { id: "bakery", x: 2, y: 16, w: 5, h: 4, door: 2, roof: "#F2A65A", awning: ["#FFE0B2", "#FFFFFF"], sign: "bakery", label: "パンやさん", act: { type: "work", shop: "bakery" } },
    { id: "florist", x: 18, y: 16, w: 5, h: 4, door: 2, roof: "#9CCC65", awning: ["#DCEDC8", "#FFFFFF"], sign: "florist", label: "おはなやさん", act: { type: "work", shop: "florist" } },
    { id: "market", x: 2, y: 24, w: 5, h: 4, door: 2, roof: "#FFB74D", awning: ["#E35D5B", "#FFFFFF"], sign: "market", label: "スーパー", act: { type: "buy", shop: "market" } },
  ],
  objects: [
    { kind: "fountain", x: 11, y: 13, w: 3, h: 2, ground: "plaza" },
    { kind: "gate", x: 10, y: 29, w: 5, h: 1, text: "ぽかぽかタウン" },
  ],
  signs: [
    { x: 9, y: 8, text: "ここは ぽかぽかタウンの ひろば。\nおみせで おてつだいすると コインが もらえるよ。" },
    { x: 15, y: 29, text: "⬇ この さき ぽかぽかはらっぱ\nまものが でるので きをつけてね！" },
  ],
  npcs: [
    { id: "mayor", sp: "bear", x: 12, y: 16, dir: "down", name: "くまの そんちょう", outfit: { head: "tophat", neck: "bowtie_red" }, talk: "mayor" },
    { id: "cat", sp: "cat", x: 8, y: 12, dir: "right", name: "ねこの ミケ", col: "#F5C07A", stripe: true, talk: "cat" },
    { id: "rabbit", sp: "rabbit", x: 16, y: 19, dir: "left", name: "うさぎの ミミ", outfit: { neck: "necklace" }, talk: "rabbit" },
    { id: "penguin", sp: "penguin", x: 18, y: 25, dir: "down", name: "ぺんぎんの ペン", talk: "penguin" },
    { id: "frog", sp: "frog", x: 9, y: 17, dir: "down", name: "かえるの ケロ", wander: [7, 8, 17, 20], outfit: { head: "strawhat" }, talk: "frog" },
    { id: "sheep", sp: "sheep", x: 15, y: 6, dir: "down", name: "ひつじの メェ", outfit: { neck: "scarf_red" }, talk: "sheep" },
    { id: "mouse", sp: "mouse", x: 16, y: 30, dir: "left", name: "ねずみの チュウ", outfit: { head: "helmet" }, talk: "mouse" },
    { id: "pig", sp: "pig", x: 8, y: 27, dir: "down", name: "ぶたの ブー", outfit: { body: "apron" }, talk: "pig" },
  ],
  warps: [{ x: 11, y: 31, w: 3, h: 1, to: "meadow", tx: 14, ty: 1, dir: "down" }],
  chests: [],
  spawns: [],
};

// ---- そとの世界のジェネレーター ----
class FieldGen {
  constructor(id, w, h, fill) {
    this.id = id; this.w = w; this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(fill));
    this.keep = Array.from({ length: h }, () => Array(w).fill(false)); // 道など、あとで上書きしない場所
    this.seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  }
  r(x, y, k = 0) { return U.hash(x, y, this.seed + k); }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, ch, keep = false) { if (this.in(x, y) && !this.keep[y][x]) { this.g[y][x] = ch; if (keep) this.keep[y][x] = true; } }
  force(x, y, ch, keep = true) { if (this.in(x, y)) { this.g[y][x] = ch; this.keep[y][x] = keep; } }
  get(x, y) { return this.in(x, y) ? this.g[y][x] : null; }
  border(ch, t, jitter = 1) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const d = Math.min(x, y, this.w - 1 - x, this.h - 1 - y);
      if (d < t || (d < t + jitter && this.r(x, y, 1) < 0.5)) this.set(x, y, ch);
    }
  }
  blob(cx, cy, rx, ry, ch, keep = false, jit = 0.25) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 + (this.r(x, y, 2) - 0.5) * jit * 2) this.set(x, y, ch, keep);
    }
  }
  // 折れ線に沿って道を掘る
  path(pts, width, ch) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
        for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) this.force(Math.round(x + dx - (width - 1) / 2), Math.round(y + dy - (width - 1) / 2), ch);
      }
    }
  }
  // まわり1マスも空けて保護（道のふちに木が生えないように）
  guardAround(ch = null, margin = 1) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.keep[y][x]) {
      for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) add.push([x + dx, y + dy]);
    }
    for (const [x, y] of add) if (this.in(x, y) && !this.keep[y][x]) { if (ch) this.g[y][x] = ch; this.keep[y][x] = "soft"; }
  }
  scatter(ch, p, onlyOn, k) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.keep[y][x]) continue;
      if (onlyOn && !onlyOn.includes(this.g[y][x])) continue;
      if (this.r(x, y, k) < p) this.g[y][x] = ch;
    }
  }
  clear(x, y, ch, r = 0) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) this.force(x + dx, y + dy, ch);
  }
  rows() { return this.g.map((r) => r.join("")); }
}

function genMeadow() {
  const f = new FieldGen("meadow", 30, 44, ".");
  f.border("T", 2, 1);
  const route = [[14, 0], [14, 5], [9, 9], [9, 15], [16, 19], [16, 25], [10, 30], [10, 35], [15, 39], [15, 43]];
  f.path(route, 2, "-");
  f.blob(22, 14, 3.6, 2.6, "~", true, 0.1);
  for (let y = 10; y <= 18; y++) for (let x = 17; x <= 27; x++) {
    if (f.get(x, y) === "~") continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (f.get(x + dx, y + dy) === "~") near = true;
    if (near) f.force(x, y, "s");
  }
  f.guardAround(null, 1);
  [[5, 6, 3, 2], [22, 6, 4, 2], [4, 24, 3, 3], [23, 30, 4, 3], [6, 39, 3, 2], [24, 39, 3, 2], [18, 22, 2, 2]].forEach(([x, y, rx, ry]) => f.blob(x, y, rx, ry, '"'));
  f.scatter(",", 0.1, ["."], 3);
  f.scatter("T", 0.035, [".", ","], 4);
  f.scatter("B", 0.025, [".", ","], 5);
  f.scatter("R", 0.012, [".", ","], 6);
  // 木のかたまり
  [[3, 16], [26, 24], [3, 33], [26, 35], [20, 2], [6, 2]].forEach(([x, y]) => f.blob(x, y, 2, 1.6, "T", false, 0.4));
  f.clear(14, 1, "-", 0);
  const def = {
    name: "ぽかぽかはらっぱ", bgm: "meadow", baseGround: "grass", area: "meadow",
    rows: null,
    signs: [{ x: 12, y: 3, text: "⬇ どんぐりのもり\n⬆ ぽかぽかタウン\nくさむらには なにかが かくれているかも？" }],
    chests: [
      { id: "m1", x: 5, y: 6, loot: { wear: "strawhat" } },
      { id: "m2", x: 26, y: 13, loot: { bag: "cake", n: 1 } },
      { id: "m3", x: 24, y: 40, loot: { coins: 80 }, daily: true },
      { id: "m4", x: 4, y: 25, loot: { bag: "bandaid", n: 3 } },
    ],
    npcs: [{ id: "traveler", sp: "sheep", x: 19, y: 25, dir: "left", name: "たびの ひつじ", outfit: { head: "strawhat", back: "backpack" }, talk: "traveler" }],
    warps: [
      { x: 13, y: 0, w: 3, h: 1, to: "town", tx: 12, ty: 30, dir: "up" },
      { x: 15, y: 43, w: 2, h: 1, to: "forest", tx: 14, ty: 1, dir: "down" },
    ],
    spawns: [[10, 3], [21, 9], [5, 13], [15, 15], [24, 20], [6, 27], [19, 32], [12, 37], [21, 38], [5, 20]],
    objects: [],
  };
  for (const c of def.chests) f.clear(c.x, c.y, f.get(c.x, c.y) === '"' ? '"' : ".", 0);
  for (const s of def.signs) f.clear(s.x, s.y, ".", 0);
  for (const n of def.npcs) f.clear(n.x, n.y, ".", 1);
  for (const [x, y] of def.spawns) if (!"-.,\"s".includes(f.get(x, y))) f.clear(x, y, ".", 0);
  def.rows = f.rows();
  return def;
}

function genForest() {
  const f = new FieldGen("forest", 30, 46, "d");
  f.border("P", 2, 2);
  const route = [[14, 0], [14, 7], [20, 10], [21, 16], [12, 20], [9, 24], [9, 31], [16, 35], [21, 39], [21, 42]];
  f.path(route, 2, "-");
  // 小川と橋
  for (let x = 0; x < 30; x++) { const y = 26 + Math.round(Math.sin(x * 0.5) * 0.8); f.force(x, y, "~"); f.force(x, y + 1, "~"); }
  for (let y = 24; y <= 29; y++) for (let x = 8; x <= 10; x++) if (f.get(x, y) === "~") f.force(x, y, "b");
  // 泉のひろば
  f.blob(22, 31, 3.4, 2.6, "d", true, 0.1);
  f.blob(5, 13, 3, 2.4, "d", true, 0.1);
  f.guardAround(null, 1);
  f.scatter("P", 0.13, ["d"], 3);
  f.scatter("T", 0.07, ["d"], 4);
  f.scatter("x", 0.02, ["d"], 5);
  f.scatter("m", 0.05, ["d"], 6);
  f.scatter(",", 0.03, ["d"], 7);
  // 洞くつの入口（岩壁）
  for (let x = 17; x <= 26; x++) for (let y = 43; y <= 45; y++) f.force(x, y, "W");
  f.force(21, 43, "-"); f.force(22, 43, "-");
  const def = {
    name: "どんぐりのもり", bgm: "forest", baseGround: "forest", area: "forest",
    rows: null,
    signs: [{ x: 12, y: 4, text: "⬇ キラキラどうくつ\nもりの おくに いやしの いずみが あるらしい。" }],
    chests: [
      { id: "f1", x: 5, y: 12, loot: { wear: "cape" } },
      { id: "f2", x: 26, y: 20, loot: { bag: "drink", n: 2 } },
      { id: "f3", x: 3, y: 38, loot: { coins: 150 }, daily: true },
      { id: "f4", x: 25, y: 32, loot: { furn: "mushroom" } },
    ],
    npcs: [{ id: "explorer", sp: "frog", x: 11, y: 22, dir: "down", name: "たんけんかの ケロスケ", col: "#6FB85A", outfit: { head: "helmet", back: "backpack" }, talk: "explorer" }],
    objects: [{ kind: "spring", x: 22, y: 31, w: 1, h: 1 }, { kind: "caveentrance", x: 21, y: 43, w: 2, h: 1 }],
    warps: [
      { x: 14, y: 0, w: 2, h: 1, to: "meadow", tx: 15, ty: 42, dir: "up" },
      { x: 21, y: 43, w: 2, h: 1, to: "cave", tx: 12, ty: 2, dir: "down" },
    ],
    spawns: [[14, 12], [22, 13], [6, 16], [17, 20], [10, 30], [20, 35], [5, 34], [14, 40], [24, 8], [3, 22]],
  };
  for (const c of def.chests) f.clear(c.x, c.y, "d", 1);
  for (const s of def.signs) f.clear(s.x, s.y, "d", 0);
  for (const n of def.npcs) f.clear(n.x, n.y, "d", 1);
  f.clear(22, 31, "d", 1);
  for (const [x, y] of def.spawns) f.clear(x, y, "d", 0);
  def.rows = f.rows();
  return def;
}

function genCave() {
  const f = new FieldGen("cave", 26, 36, "W");
  const rooms = [[12, 5, 5, 3.5], [12, 15, 8.5, 3.5], [5, 22, 2.5, 3], [19, 22, 2.5, 3], [12, 27, 9, 2.5], [12, 32, 6, 2.6]];
  for (const [x, y, rx, ry] of rooms) f.blob(x, y, rx, ry, "c", false, 0.18);
  f.path([[12, 1], [12, 5], [12, 15]], 2, "c");
  f.path([[6, 15], [5, 22], [7, 27]], 2, "c");
  f.path([[18, 15], [19, 22], [17, 27]], 2, "c");
  f.path([[12, 27], [12, 32]], 2, "c");
  // 地底湖
  f.blob(16, 15, 2.2, 1.2, "~", true, 0.1);
  f.blob(6, 27, 1.6, 1, "~", true, 0.1);
  f.scatter("k", 0.05, ["c"], 3);
  f.scatter("r", 0.05, ["c"], 4);
  f.clear(12, 2, "c", 1);
  f.clear(12, 30, "c", 2);
  const def = {
    name: "キラキラどうくつ", bgm: "cave", baseGround: "cave", area: "cave",
    rows: null,
    signs: [{ x: 14, y: 3, text: "この おくに プルンの おうさまが すんでいる……\nじゅうぶん つよくなってから すすもう。" }],
    chests: [
      { id: "c1", x: 4, y: 15, loot: { wear: "fairywings" } },
      { id: "c2", x: 21, y: 21, loot: { bag: "feather", n: 2 } },
      { id: "c3", x: 4, y: 22, loot: { coins: 250 }, daily: true },
      { id: "c4", x: 20, y: 27, loot: { wear: "armor" } },
    ],
    npcs: [],
    boss: { x: 12, y: 32, enemy: "king" },
    objects: [{ kind: "stairs", x: 12, y: 1, w: 1, h: 1 }],
    warps: [{ x: 12, y: 1, w: 1, h: 1, to: "forest", tx: 21, ty: 42, dir: "up" }],
    spawns: [[10, 6], [15, 14], [8, 16], [5, 20], [19, 20], [9, 27], [16, 27], [12, 10]],
  };
  for (const c of def.chests) f.clear(c.x, c.y, "c", 0);
  for (const s of def.signs) f.clear(s.x, s.y, "c", 0);
  for (const [x, y] of def.spawns) f.clear(x, y, "c", 0);
  f.clear(12, 32, "c", 1);
  def.rows = f.rows();
  return def;
}

MAP_DEFS.meadow = genMeadow();
MAP_DEFS.forest = genForest();
MAP_DEFS.cave = genCave();

// ---- 実行時のマップ ----
class WorldMap {
  constructor(id) {
    const d = MAP_DEFS[id];
    this.id = id; this.def = d;
    this.name = d.name; this.bgm = d.bgm; this.area = d.area || null;
    this.baseGround = d.baseGround || "grass";
    this.rows = d.rows;
    this.h = d.rows.length; this.w = d.rows[0].length;
    d.rows.forEach((r, i) => { if (r.length !== this.w) throw new Error(`map ${id} row ${i} length ${r.length} != ${this.w}`); });
    this.solidGrid = Array.from({ length: this.h }, (_, y) => Array.from({ length: this.w }, (_, x) => SOLID_CH.has(d.rows[y][x])));
    this.doors = [];
    this.sprites = []; // y順に並べる静的オブジェクト
    // 1文字オブジェクト
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const ch = d.rows[y][x];
      if (OBJ_CH[ch]) this.sprites.push({ kind: OBJ_CH[ch], x, y, tw: 1 });
      if (ch === "D") this.solidGrid[y][x] = false;
    }
    for (const b of d.buildings || []) {
      this.sprites.push({ kind: "building", spec: b, x: b.x, y: b.y + b.h - 1, tw: b.w, bx: b.x });
      this.doors.push({ x: b.x + b.door, y: b.y + b.h - 1, b });
      this.solidGrid[b.y + b.h - 1][b.x + b.door] = false;
    }
    this.groundOverride = {};
    for (const o of d.objects || []) {
      this.sprites.push({ kind: o.kind, x: o.x, y: o.y + o.h - 1, tw: o.w, bx: o.x, o });
      if (o.ground) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) this.groundOverride[xx + "," + yy] = o.ground;
      if (o.kind === "spring") this.solidGrid[o.y][o.x] = true;
      if (o.kind === "fountain" || o.solid) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) this.solidGrid[yy][xx] = true;
    }
    this.signs = (d.signs || []).map((s) => ({ ...s }));
    for (const s of this.signs) { this.sprites.push({ kind: "sign", x: s.x, y: s.y, tw: 1 }); this.solidGrid[s.y][s.x] = true; }
    this.chests = (d.chests || []).map((c) => ({ ...c }));
    for (const c of this.chests) this.solidGrid[c.y][c.x] = true;
    this.warps = d.warps || [];
  }
  groundAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const ov = this.groundOverride[x + "," + y];
    if (ov) return ov;
    const ch = this.rows[y][x];
    if (ch === "D") return "path";
    if (ch === "n") return "plaza";
    // 木や岩などの下は そのマップの地面
    if (OBJ_CH[ch] || ch === "#") return this.baseGround;
    if (ch === ",") return this.baseGround === "forest" ? "fflower" : "flower";
    return GROUND[ch] || this.baseGround;
  }
  charAt(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.rows[y][x]; }
  isSolid(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    return this.solidGrid[y][x];
  }
  warpAt(x, y) { return this.warps.find((w) => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h); }
  doorAt(x, y) { return this.doors.find((d) => d.x === x && d.y === y); }
  isTall(x, y) { return this.charAt(x, y) === '"'; }
}
