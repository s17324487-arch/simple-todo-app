// おうちの ドア（UI-09）: ドアを タップすると 3人が ドアまで あるいて、べつの へやへ・まちへ。
// ・みぎの かべの ドア「おへや」: もって いる べつの へや（1つなら すぐ、2つ いじょうは えらぶ）
// ・ひだりの かべの ドア「おでかけ」: まちへ（たしかめて から）
// ・おにわの うらぐち「おうち」: いつもの おへやへ
// ドアの うえの ふだは 画面の 大きさの まま キャンバスに 描く（へやを ちいさく しても よめる。へやの 絵・キャッシュの キーは かえない）。
const HomeDoors = {
  SPEED: 150, // ドアまで あるく はやさ（へやの 座標 / びょう）
  LIMIT: 2.6, // ドアに つかなくても この びょうで つぎへ
  // ドア（かべに そった はば u0〜u1・たかさ h・まえの ばしょ front は へやの 座標）
  list() {
    // おにわの うらぐちは 絵に「おうち」の ふだが ある（sign: false）
    if (HomeGarden.active()) return [{ id: "inside", side: "left", u0: 43, u1: 102, h: 114, label: "おうち", sign: false, front: { x: 42, y: ROOM.WALL + 72 } }];
    return [
      { id: "out", side: "left", u0: 30, u1: 94, h: 145, label: "おでかけ", front: { x: 40, y: ROOM.WALL + 62 } },
      { id: "room", side: "right", u0: ROOM.W - 124, u1: ROOM.W - 60, h: 145, label: "おへや", front: { x: ROOM.W - 92, y: ROOM.WALL + 40 } },
    ];
  },
  // かべの 上の 点（u: かべに そった ながさ・z: ゆかからの たかさ）→ 画面
  wall(sc, d, u, z) { return d.side === "left" ? sc.toScreen(0, ROOM.WALL + u, z) : sc.toScreen(u, ROOM.WALL, z); },
  rect(sc, d) {
    const ps = [[d.u0, 0], [d.u1, 0], [d.u0, d.h], [d.u1, d.h]].map(([u, z]) => this.wall(sc, d, u, z));
    const x = Math.min(...ps.map((p) => p.x)), y = Math.min(...ps.map((p) => p.y));
    return { x, y, w: Math.max(...ps.map((p) => p.x)) - x, h: Math.max(...ps.map((p) => p.y)) - y };
  },
  // タップの はんい: ドアの 絵の まわり、はばは 44px（CSS）いじょう
  hit(sc, d, p) {
    const r = this.rect(sc, d), min = 44 / (G.cssPerUnit || 1), px = Math.max(4, (min - r.w) / 2), py = Math.max(4, (min - r.h) / 2);
    return p.x >= r.x - px && p.x <= r.x + r.w + px && p.y >= r.y - py && p.y <= r.y + r.h + py;
  },
  // タップした ドア（3人・さわれる かぐが かさなって いたら そちらが さき。ぱぱ まま は タップしても なにも しないので ドアが さき）
  at(sc, p) {
    if (sc.mode || sc.watching || sc.life.quarrel || !p.tap || sc.panDrag?.moved || sc.gesture) return null; // ピンチの ゆびは タップに しない
    if (sc.chars.some((c) => !c.hidden && sc.contains(sc.actorRect(c), p))) return null;
    const r = sc.toRoom(p.x, p.y), it = sc.hitItem(r.x, r.y);
    if (it && FURN_INDEX[it.id].interactive) return null;
    return this.list().find((d) => this.hit(sc, d, p)) || null;
  },
  // いける べつの へや（いまの へやと お庭の ほか。お庭は うらぐちから おうちへ もどる）
  rooms() { return HomeRooms.catalog.filter((r) => r.id !== Save.d.rooms.active && Save.d.rooms.owned[r.id]); },
  async open(sc, d) {
    if (d.id === "out") {
      const i = await UI.ask("まちへ おでかけ する？", ["いく", "やめる"]);
      if (i !== 0 || G.scene !== sc || sc.mode) return false;
      return this.walk(sc, d, () => sc.goOut());
    }
    let to = d.id === "inside" ? "main" : null;
    if (d.id === "room") {
      const rooms = this.rooms();
      if (!rooms.length) { UI.toast("ほかの おへやは まだ ないよ。「おへや」で ふやせるよ"); Sound.se("cancel"); return false; }
      if (rooms.length === 1) to = rooms[0].id;
      else {
        const i = await UI.ask("どの おへやへ いく？", [...rooms.map((r) => r.name), "やめる"]);
        if (i < 0 || i >= rooms.length || G.scene !== sc || sc.mode) return false;
        to = rooms[i].id;
      }
    }
    if (!to || !Save.d.rooms.owned[to] || to === Save.d.rooms.active) return false;
    return this.walk(sc, d, () => { if (HomeRooms.switchTo(to)) Game.goto("house", { door: Save.d.rooms.active === "yard" ? "inside" : "room" }); });
  },
  // 3人で ドアの まえへ（ならんで）→ done
  walk(sc, d, done) {
    sc.mode = "door"; sc.showBar(false);
    for (const c of sc.chars) HomeActions.cancel(c);
    const f = d.front, nx = d.side === "left" ? 1 : 0, ny = d.side === "left" ? 0 : 1;
    sc.chars.forEach((c, i) => { c.state = "door"; c.emo = "happy"; c.door = { x: f.x + nx * i * 22 + ny * (i - 1) * 18, y: f.y + ny * i * 22 + nx * (i - 1) * 18 }; });
    sc.doorWalk = { t: 0, done, door: d.id };
    Sound.se("door");
    return true;
  },
  update(sc, dt) {
    const W = sc.doorWalk; if (!W) return;
    W.t += dt;
    let all = true;
    for (const c of sc.chars) {
      const g = c.door; if (!g) continue;
      const dx = g.x - c.x, dy = g.y - c.y, dist = Math.hypot(dx, dy);
      if (dist > 2) {
        all = false; // あるく うごき（c.anim）は updateChar が すすめる
        const k = Math.min(1, (this.SPEED * dt) / dist); c.x += dx * k; c.y += dy * k;
        c.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      } else c.dir = "up";
    }
    if ((all && W.t > 0.35) || W.t > this.LIMIT) { sc.doorWalk = null; W.done(); }
  },
  // あたらしい へやでは ドアの まえに あらわれて、すこし 中へ あるく
  arrive(sc, id) {
    const d = this.list().find((x) => x.id === id) || this.list()[0], f = d.front;
    sc.chars.forEach((c, i) => {
      c.x = f.x + (d.side === "left" ? 8 + i * 16 : (i - 1) * 20); c.y = f.y + (d.side === "left" ? (i - 1) * 16 : 8 + i * 12);
      c.state = "walk"; c.tx = U.clamp(f.x + (d.side === "left" ? 90 + i * 34 : (i - 1) * 46), 40, ROOM.W - 40); c.ty = U.clamp(f.y + (d.side === "left" ? 40 + (i % 2) * 30 : 90 + (i % 2) * 26), ROOM.WALL + 40, ROOM.H - 30); c.dir = "down";
    });
  },
  // ドアの うえの ふだ（へやの 絵の あと・かぐの まえ に 描く。大きさは 画面の まま）
  drawSigns(ctx, sc) {
    if (sc.mode === "edit") return;
    ctx.save();
    ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const d of this.list()) {
      if (d.sign === false) continue;
      const top = this.wall(sc, d, (d.u0 + d.u1) / 2, d.h), w = ctx.measureText(d.label).width + 12, h = 16, x = top.x, y = top.y - 7 - h / 2;
      // つるす ひも
      ctx.strokeStyle = "#6B4934"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, y); ctx.lineTo(x, y - h / 2 - 4); ctx.lineTo(x + w / 2 - 6, y); ctx.stroke();
      ctx.fillStyle = "#6B4934"; ctx.beginPath(); ctx.arc(x, y - h / 2 - 4, 1.8, 0, 7); ctx.fill();
      U.rr(ctx, x - w / 2, y - h / 2, w, h, 5); ctx.fillStyle = "#FFF4D6"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(d.label, x, y + 0.5);
    }
    ctx.restore();
  },
  // テスト・PokaDebug 用
  state(sc) {
    const cv = G.canvas.getBoundingClientRect(), u = G.cssPerUnit;
    return { room: Save.d.rooms.active, walking: !!sc.doorWalk, mode: sc.mode, rooms: this.rooms().map((r) => r.id),
      doors: this.list().map((d) => { const r = this.rect(sc, d); return { id: d.id, label: d.label, x: cv.left + r.x * u, y: cv.top + r.y * u, w: r.w * u, h: r.h * u, cx: cv.left + (r.x + r.w / 2) * u, cy: cv.top + (r.y + r.h * 0.55) * u }; }),
      chars: sc.chars.map((c) => ({ id: c.id, x: c.x, y: c.y, state: c.state })) };
  },
};

// ---- つなぎ（HouseScene を 外から つつむ）----
(() => {
  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("up", function (orig, p) {
    const d = HomeDoors.at(this, p);
    const r = orig.call(this, p);
    if (d) HomeDoors.open(this, d);
    return r;
  });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); HomeDoors.update(this, dt); return r; });
  wrap("pose", function (orig, c) { if (c.state === "door") return [["idle_01", "walk_01", "idle_01", "walk_02"][Math.floor(c.anim * 10) % 4], 0]; return orig.call(this, c); });
  wrap("enter", async function (orig, p = {}) { const r = await orig.call(this, p); if (p.door) HomeDoors.arrive(this, p.door); return r; });
  wrap("exit", function (orig) { this.doorWalk = null; return orig.call(this); });
})();
