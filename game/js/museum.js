// ⑤ 水族館と 恐竜博物館（docs/design/features/museum の 見本。絵は MuseumArt、床と かべは 見本 tools/feature-design/museum-render.mjs と おなじ）。
// 1番: 町の 建物から 入る 館の マップ（MAP_DEFS.aquarium / MAP_DEFS.museum）・床と かべ・展示（寄贈の ようすで 絵が かわる）・順路の 矢印・へやの 案内・BGM。
// 寄贈（2番）・展示の 説明（3番）は あとで 足す。データは MUSEUM_DATA（自動生成）、セーブは Save.d.museum。
const Museum = {
  data() { return typeof MUSEUM_DATA !== "undefined" ? MUSEUM_DATA : null; },
  building(mapId) { return ((this.data() || {}).buildings || {})[mapId] || null; },
  st() { return Save.d.museum; },
  // 展示を id で（2つの 館で id は かさならない）
  object(id) { for (const [map, b] of Object.entries(this.data().buildings)) { const o = b.objects.find((x) => x.id === id); if (o) return { ...o, map }; } return null; },
  // 寄贈した 魚・骨（2番で ふえる）
  gaveFish(id) { return !!(this.st() && this.st().fish[id]); },
  gaveBone(key) { return !!(this.st() && this.st().bones[key]); },
  // 寄贈の ようすの 文字（SvgCache の キーに 入れる。有限）: 水そうは 魚の じゅんに 1/0、骨格の 台は 部品の じゅんに 1/0、シーラカンスの 台は 1/0
  bits(o) {
    if (o.fish) return o.fish.map((f) => (this.gaveFish(f) ? "1" : "0")).join("");
    if (o.dino) { const d = typeof Fossils !== "undefined" && Fossils.dino(o.dino); return d ? d.art.parts.map((p) => (this.gaveBone(o.dino + "." + p.id) ? "1" : "0")).join("") : ""; }
    if (o.boneOf) return this.gaveBone(o.boneOf) ? "1" : "0";
    return "";
  },
  // 展示の 絵（WorldArt.exhibit から。見本 museum-render.mjs の propOf と おなじ）。{ w, h, svg }（svg は WorldArt と おなじ 中身だけ）
  art({ id, bits = "" }) {
    const o = this.object(id); if (!o) return { w: 32, h: 32, svg: "" };
    const opts = { ...o };
    if (o.fish) opts.fish = o.fish.map((fid, i) => {
      const f = typeof Fishing !== "undefined" && Fishing.fish(fid);
      return f ? { id: fid, svg: FishArt.svg(f.art, { uid: "m" + fid, flip: !!f.flip }), have: bits[i] === "1", scale: Math.min(1.8, 0.7 + f.size[1] / 120), big: f.size[1] > 90, noflip: !!f.flip } : { id: fid, svg: "", have: false };
    });
    if (o.dino) {
      const d = Fossils.dino(o.dino), have = d.art.parts.filter((p, i) => bits[i] === "1").map((p) => p.id);
      opts.dino = d; opts.have = have; opts.left = d.art.parts.length - have.length || 0;
    }
    if (o.boneOf) { const b = typeof Fossils !== "undefined" && Fossils.bone(o.boneOf); if (b) opts.bone = FossilArt.partSvg(b.dino, b.part.id); }
    const p = MuseumArt.prop(o.kind, opts);
    return { w: p.w, h: p.h, svg: p.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") };
  },

  // ---- 床と かべ（見本 museum-render.mjs の floorTile・wallSprite を canvas に）----
  hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + k)))); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); },
  // Tiles.drawGround から: 館の 中の マスなら 床を 描いて true（かべ X は 下地だけ。かべの 高さは wall で y順に 描く）
  floor(g, map, tx, ty, x, y, s) {
    const D = this.data(); if (!D || !map.def.indoor) return false;
    const ch = map.rows[ty][tx], t = D.tiles[ch]; if (!t) return false;
    const u = s / 32, c = t.color, h = this.hash(tx, ty, 7), line = (col, w, pts) => { g.strokeStyle = col; g.lineWidth = w * u; g.beginPath(); for (const [x0, y0, x1, y1] of pts) { g.moveTo(x + x0 * u, y + y0 * u); g.lineTo(x + x1 * u, y + y1 * u); } g.stroke(); };
    const dot = (cx, cy, r, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x + cx * u, y + cy * u, r * u, 0, 7); g.fill(); g.globalAlpha = 1; };
    g.fillStyle = ch === "X" ? "#2A2630" : c; g.fillRect(x, y, s, s);
    if (ch === "X") return true;
    g.lineCap = "butt";
    if (ch === "9" || ch === "7") { const k = this.shade(c, -0.14), a = ((tx * 13 + ty * 7) % 4) * 8, b = ((tx * 5 + ty * 3) % 4) * 8 + 4; line(k, 1, [[0, 10.5, 32, 10.5], [0, 21.5, 32, 21.5], [a, 0, a, 10.5], [b, 10.5, b, 21.5]]); }
    else if (ch === "0" || ch === "H") { g.strokeStyle = this.shade(c, -0.08); g.lineWidth = u; g.strokeRect(x + 0.5 * u, y + 0.5 * u, 31 * u, 31 * u); }
    else if (ch === "S") { const a = ty % 2 ? 8 : 20, b = ty % 2 ? 24 : 4; line(this.shade(c, -0.12), 1.2, [[0, 16, 32, 16], [a, 0, a, 16], [b, 16, b, 32]]); }
    else if (ch === "6" || ch === "8") { for (let i = 0; i < 3; i++) dot(5 + this.hash(tx, ty, i) * 22, 5 + this.hash(ty, tx, i) * 22, ch === "8" ? 0.8 : 1, ch === "8" ? "#9FC4FF" : this.shade(c, 0.18), ch === "8" ? 0.7 : 0.8); }
    else if (ch === "3") { dot(8 + h * 16, 10 + h * 10, 3, this.shade(c, -0.1)); dot(22 - h * 10, 24 - h * 8, 2, this.shade(c, 0.12)); }
    else if (ch === "4") { for (let i = 0; i < 4; i++) dot(4 + this.hash(tx, ty, i + 3) * 24, 4 + this.hash(ty, tx, i + 3) * 24, 0.9, this.shade(c, -0.2)); }
    else if (ch === "5") { g.lineCap = "round"; line(this.shade(c, -0.2), 1.2, [[6 + h * 10, 22, 7 + h * 10, 17], [9 + h * 10, 22, 8 + h * 10, 18], [20 - h * 6, 12, 21 - h * 6, 8]]); g.lineCap = "butt"; }
    else if (ch === "2") { g.fillStyle = "#8C949C"; g.fillRect(x, y, s, s); line("#6E767E", 2, [[0, 4, 32, 4], [0, 12, 32, 12], [0, 20, 32, 20], [0, 28, 32, 28]]); }
    else if (ch === "E") { g.fillStyle = "#C8B89A"; g.fillRect(x, y, s, s); line("#8C7A62", 3, [[4, 6, 28, 6]]); }
    return true;
  },
  // かべ 1マス（上の 面 ＋ 床に めんした 前の 面）。WorldScene.render の y順の なかで
  wall(ctx, map, x, y, ox, oy) {
    const X = ox + x * TS, Y = oy + y * TS, below = y + 1 < map.h && map.rows[y + 1][x] !== "X";
    ctx.fillStyle = "#5E5868"; ctx.fillRect(X, Y - 14, TS, TS);
    if (this.hash(x, y, 2) < 0.2) { ctx.fillStyle = "#6E6878"; ctx.fillRect(X + 6, Y - 8, 10, 3); }
    if (below) {
      ctx.fillStyle = "#9A94A6"; ctx.fillRect(X, Y + 18, TS, 14); ctx.fillStyle = "#6E6878"; ctx.fillRect(X, Y + 28, TS, 4);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X, Y + 18); ctx.lineTo(X + TS, Y + 18); ctx.stroke();
    }
  },

  // ---- へやの 案内（はじめて 入った ときだけ。見本 img/phones.png の ②④）----
  roomAt(mapId, x, y) { const b = this.building(mapId); return b ? b.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) || null : null; },
  arrived(sc) {
    if (!sc.map.def.indoor || !this.st()) return;
    const L = sc.party[0], r = this.roomAt(sc.mapId, L.tx, L.ty); if (!r) return;
    const key = sc.mapId + "." + r.id; if (this.st().rooms[key]) return;
    this.st().rooms[key] = true; Save.mark();
    this.showIntro(r);
  },
  showIntro(r) {
    this.hideIntro();
    const box = U.el("div", { class: "museum-intro" });
    box.append(U.el("div", { class: "nm", text: r.name }), U.el("div", { text: r.intro }));
    UI.root.append(box); this.intro = box;
    this.introTimer = setTimeout(() => this.hideIntro(), 4500);
  },
  hideIntro() { clearTimeout(this.introTimer); if (this.intro) this.intro.remove(); this.intro = null; },
  // 町の 入口（act.type === "indoor"）→ 館の 入口
  enter(sc, act) {
    const b = this.building(act.map); if (!b) return false;
    sc.busy = true;
    Game.goto("world", { map: act.map, x: b.arrive.x, y: b.arrive.y, dir: b.arrive.dir || "up" }, "circle");
    return true;
  },
};

// 館の マップ・床の 文字・館の 人の ことば・BGM・展示の 絵（見本 CODEX_TASK.md の 3・4・5）
if (typeof MUSEUM_DATA !== "undefined") {
  for (const [ch, t] of Object.entries(MUSEUM_DATA.tiles)) { GROUND[ch] = t.ground; if (t.solid) SOLID_CH.add(ch); }
  for (const [id, b] of Object.entries(MUSEUM_DATA.buildings)) MAP_DEFS[id] = {
    name: b.name, bgm: id, baseGround: "museum_tile", indoor: true, rows: b.rows,
    buildings: [], signs: [], chests: [], spawns: [], warps: b.warps, npcs: b.npcs.map((n) => ({ ...n, dir: n.dir || "down" })),
    objects: b.objects.map((o) => ({ ...o, kind: "exhibit", ex: o.kind, w: o.w || 1, h: o.h || 1, solid: !o.walk })),
  };
  for (const [id, t] of Object.entries(MUSEUM_DATA.talk)) TALKS[id] = { first: [t.first], lines: t.lines.map((x) => [x]) };
  Object.assign(SONGS, MUSEUM_DATA.songs);
  WorldArt.exhibit = (opt) => Museum.art(opt || {});
}
