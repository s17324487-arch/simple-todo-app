// いぬの さんぽ（UI-49・オーナーの FB 2026-10-02「持ち物で…犬を連れたり…したい」）。
// ・もちもの「おさんぽ リード」（ようふくやさんの「もちもの」）を もった 子の よこを こいぬが とことこ あるく。リードの ひもで 手と くびわが つながる。
//   わんこの こいぬは「コロ」（ちゃいろ）・がちゃんは「モコ」（しろ）・ごじは「チョコ」（こげちゃ）。リードを もった 子 ひとりに 1ぴき。
// ・まち・フィールド: もった 子の よこ（むきに あわせて）へ ついて くる（ぶつからない かざり。マスの みちは かえない）。
// ・おうち: もった 子の よこ（手の がわ。ほかの 人や こいぬと かさなる ときは はんたいの がわ）を ついて あるく・ときどき しっぽを ふる。
//   タップすると「わん！」と ハート（まえに 見えて いる ほうが さき。3人が こいぬの まえに いれば 3人）。
// ・いぬの 絵は 3しょく × 4むき × あし 2コマ × しっぽ 2コマ（SvgCache の キーは この 48 だけ）。
// ・セーブは かわらない（リードを もって いるか だけ。outfit.hand）。HandItems・WorldScene・HouseScene を 外から つつむ（scene-world.js・scene-house.js は 絵を ならべる ところで よぶ 1行 だけ）。
const PetWalk = {
  ITEM: "hi_leash", W: 120, H: 100,
  PUPS: {
    wanko: { name: "コロ", body: "#E8B97E", ear: "#B9814D", muzzle: "#FFF6E8", collar: "#E8545E" },
    gachan: { name: "モコ", body: "#FFFDF8", ear: "#E9D8C4", muzzle: "#FFFFFF", collar: "#5EA8E8" },
    goji: { name: "チョコ", body: "#9B6B4A", ear: "#6E4630", muzzle: "#F2DCC6", collar: "#F2B544" },
  },
  holders() { return typeof Save === "undefined" || !Save.d ? [] : Save.d.order.filter((id) => typeof HandItems !== "undefined" && HandItems.held(id) === this.ITEM); },

  // ---- 絵（viewBox 0 0 120 100・あしもと y=94・よこむきは ひだり むき）----
  svg(id, dir, leg, tail) {
    const P = this.PUPS[id] || this.PUPS.wanko, s = (w = 3.4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`, dk = shade(P.body, -0.16);
    const legR = (x, y0, lift, col) => `<path d="M${x - 5},${y0} L${x - 5},${93 - lift} Q${x - 5},${96 - lift} ${x},${96 - lift} Q${x + 5},${96 - lift} ${x + 5},${93 - lift} L${x + 5},${y0}" fill="${col}" ${s(3)}/>`;
    const wag = tail ? 1 : -1;
    let g = "";
    if (dir === "left" || dir === "right") {
      const a = leg ? 4 : -4;
      g += legR(40 + a, 62, 0, dk) + legR(82 - a, 62, 0, dk); // むこうの あし
      g += `<path d="M90,52 Q${102 + wag * 2},${40 - wag * 4} ${106 + wag * 4},${30 - wag * 2}" fill="none" ${s(7.5)}/><path d="M90,52 Q${102 + wag * 2},${40 - wag * 4} ${106 + wag * 4},${30 - wag * 2}" fill="none" stroke="${P.body}" stroke-width="3.8" stroke-linecap="round"/>`;
      g += `<ellipse cx="66" cy="58" rx="30" ry="18" fill="${P.body}" ${s()}/>`;
      g += legR(46 - a, 66, 0, P.body) + legR(86 + a, 66, 0, P.body); // まえの あし
      g += `<circle cx="34" cy="38" r="19" fill="${P.body}" ${s()}/>`;
      g += `<ellipse cx="20" cy="45" rx="10.5" ry="8" fill="${P.muzzle}" ${s(3)}/><ellipse cx="11.5" cy="42.5" rx="3.6" ry="3" fill="${INK}"/>`;
      g += `<path d="M14,50 Q19,53 24,50" fill="none" ${s(2.4)}/><circle cx="29" cy="34" r="2.9" fill="${INK}"/><circle cx="28.1" cy="33" r="0.9" fill="#FFFFFF"/><ellipse cx="24" cy="44" rx="3" ry="1.8" fill="#F7A8B8" opacity=".7"/>`;
      g += `<path d="M36,22 C46,20 50,30 47,44 C45,52 39,51 38,44 C37,36 34,30 36,22 Z" fill="${P.ear}" ${s(3)}/>`;
      g += `<path d="M42,54 Q48,50 54,52 L53,58 Q47,57 43,60 Z" fill="${P.collar}" ${s(2.4)}/><circle cx="47" cy="61" r="3.2" fill="#F7D35C" ${s(1.6)}/>`;
    } else if (dir === "down") {
      const l = leg ? 3 : 0, r = leg ? 0 : 3;
      g += `<path d="M78,60 Q${90 + wag * 3},${50 - wag * 2} ${92 + wag * 5},${40}" fill="none" ${s(7.5)}/><path d="M78,60 Q${90 + wag * 3},${50 - wag * 2} ${92 + wag * 5},${40}" fill="none" stroke="${P.body}" stroke-width="3.8" stroke-linecap="round"/>`;
      g += `<ellipse cx="60" cy="68" rx="23" ry="17" fill="${P.body}" ${s()}/>`;
      g += legR(49, 72, l, P.body) + legR(71, 72, r, P.body);
      g += `<path d="M38,24 C28,26 24,40 28,52 C31,58 38,56 40,48 Z" fill="${P.ear}" ${s(3)}/><path d="M82,24 C92,26 96,40 92,52 C89,58 82,56 80,48 Z" fill="${P.ear}" ${s(3)}/>`;
      g += `<circle cx="60" cy="40" r="23" fill="${P.body}" ${s()}/>`;
      g += `<path d="M44,60 Q60,68 76,60 L75,66 Q60,73 45,66 Z" fill="${P.collar}" ${s(2.4)}/><circle cx="60" cy="70" r="3.6" fill="#F7D35C" ${s(1.6)}/>`;
      g += `<ellipse cx="60" cy="50" rx="12" ry="9" fill="${P.muzzle}" ${s(3)}/><ellipse cx="60" cy="45.5" rx="4.6" ry="3.4" fill="${INK}"/><path d="M60,49 L60,52 M55,54 Q60,57 65,54" fill="none" ${s(2.2)}/>`;
      g += `<circle cx="50" cy="38" r="3" fill="${INK}"/><circle cx="70" cy="38" r="3" fill="${INK}"/><circle cx="49" cy="37" r="0.9" fill="#FFFFFF"/><circle cx="69" cy="37" r="0.9" fill="#FFFFFF"/>`;
      g += `<ellipse cx="44" cy="47" rx="3.4" ry="2" fill="#F7A8B8" opacity=".7"/><ellipse cx="76" cy="47" rx="3.4" ry="2" fill="#F7A8B8" opacity=".7"/>`;
    } else {
      const l = leg ? 3 : 0, r = leg ? 0 : 3;
      g += `<ellipse cx="60" cy="66" rx="23" ry="18" fill="${P.body}" ${s()}/>`;
      g += legR(49, 74, l, P.body) + legR(71, 74, r, P.body);
      g += `<path d="M60,58 Q${66 + wag * 6},${44} ${62 + wag * 8},${30}" fill="none" ${s(7.5)}/><path d="M60,58 Q${66 + wag * 6},${44} ${62 + wag * 8},${30}" fill="none" stroke="${P.body}" stroke-width="3.8" stroke-linecap="round"/>`;
      g += `<circle cx="60" cy="38" r="22" fill="${P.body}" ${s()}/>`;
      g += `<path d="M40,22 C30,24 26,38 30,50 C33,56 40,54 42,46 Z" fill="${P.ear}" ${s(3)}/><path d="M80,22 C90,24 94,38 90,50 C87,56 80,54 78,46 Z" fill="${P.ear}" ${s(3)}/>`;
      g += `<path d="M44,56 Q60,63 76,56 L75,61 Q60,68 45,61 Z" fill="${P.collar}" ${s(2.4)}/>`;
    }
    const inner = dir === "right" ? `<g transform="matrix(-1,0,0,1,${this.W},0)">${g}</g>` : g;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.W} ${this.H}">${inner}</svg>`;
  },
  // くびわの ばしょ（絵の 座標）
  collar(dir) { return dir === "left" ? [47, 56] : dir === "right" ? [this.W - 47, 56] : dir === "down" ? [60, 68] : [60, 60]; },
  canvas(id, dir, leg, tail, w) {
    const px = Math.ceil(w * G.px);
    return SvgCache.get(`pet:${id}:${dir}:${leg ? 1 : 0}:${tail ? 1 : 0}`, () => this.svg(id, dir, leg, tail), px, Math.ceil((px * this.H) / this.W));
  },
  // w はばで あしもと (x, y) に 描く。かえりは くびわの 画面の ばしょ
  draw(ctx, id, p, x, y, w, alpha = 1) {
    const leg = p.moving && Math.floor(p.anim * 7) % 2 === 1, tail = Math.floor(p.anim * (p.moving ? 6 : 3)) % 2 === 1, h = (w * this.H) / this.W, c = this.canvas(id, p.dir, leg, tail, w);
    ctx.save(); ctx.globalAlpha = alpha * 0.16; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, w * 0.32, w * 0.08, 0, 0, 7); ctx.fill(); ctx.restore();
    const bob = p.moving ? Math.abs(Math.sin(p.anim * 14)) * w * 0.03 : 0, x0 = x - w / 2, y0 = y - h * 0.94 - bob;
    if (c) { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(c, x0, y0, w, h); ctx.restore(); }
    const [cx, cy] = this.collar(p.dir);
    return { x: x0 + (cx / this.W) * w, y: y0 + (cy / this.H) * h };
  },
  // リード（手 → くびわ。すこし たるむ）
  leash(ctx, a, b, col, lw) {
    const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + Math.hypot(b.x - a.x, b.y - a.y) * 0.18;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = lw + 1.4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
  },
  // 子の 手の ばしょ（キャラの 絵の 座標 → 画面。size は キャラの はば）
  hand(id, dir, x, y, size) {
    const P = Chara.PROFILE[id], view = dir === "up" ? "back" : dir === "down" ? "front" : "side";
    const h = HandItems.hand({ p: P, a: P.a, view }), k = size / Chara.VB.w, hx = dir === "right" ? 200 - h.x : h.x;
    return { x: x + (hx - Chara.FOOT.x) * k, y: y + (h.y - Chara.FOOT.y) * k };
  },
  // もった 子の よこ（むきに あわせて）。まち: キャラの はばに たいする わりあい・おうち: へやの 座標（画面の よこ・すこし まえ）
  SIDE: { down: [0.55, 0.12], up: [-0.55, 0.02], left: [-0.62, 0.16], right: [0.62, 0.16] },
  HSIDE: { down: [55, -55], up: [-55, 55], left: [-30, 58], right: [58, -30] },
  follow(p, tx, ty, dt, dirOf) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    const k = Math.min(1, dt * 7);
    p.x += dx * k; p.y += dy * k;
    const v = (d * k) / Math.max(dt, 1e-3);
    p.moving = v > 12; p.anim = (p.anim || 0) + dt;
    if (p.moving && d > 1.5) p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    else if (!p.moving) p.dir = dirOf;
    if (d > 160) { p.x = tx; p.y = ty; } // とおく はなれたら（ワープ など）すぐ そばへ
  },

  // ---- まち・フィールド ----
  world(sc) {
    const out = [];
    for (const id of this.holders()) {
      const i = Save.d.order.indexOf(id), w = sc.party[i];
      if (!w) continue;
      sc.pets = sc.pets || {};
      const f = w.feet(), [sx, sy] = this.SIDE[w.dir] || this.SIDE.down, tx = f.x + sx * CHAR_SIZE, ty = f.y + sy * CHAR_SIZE;
      const p = sc.pets[id] || (sc.pets[id] = { x: tx, y: ty, dir: w.dir, anim: Math.random(), moving: false });
      out.push({ id, i, w, p, tx, ty });
    }
    return out;
  },
  worldUpdate(sc, dt) {
    if (!sc.party) return;
    const live = new Set();
    for (const o of this.world(sc)) { this.follow(o.p, o.tx, o.ty, dt, o.w.dir); live.add(o.id); }
    if (sc.pets) for (const id of Object.keys(sc.pets)) if (!live.has(id)) delete sc.pets[id];
  },
  worldDrawables(sc, list, ctx, ox, oy) {
    for (const o of this.world(sc)) {
      const P = this.PUPS[o.id], kid = o.w.feet();
      list.push({ z: o.p.y - 0.3, draw: () => {
        const col = this.draw(ctx, o.id, o.p, ox + o.p.x, oy + o.p.y, CHAR_SIZE * 0.6);
        const hd = this.hand(o.id, o.w.dir, ox + kid.x, oy + kid.y, CHAR_SIZE);
        this.leash(ctx, hd, col, P.collar, 1.6);
      } });
    }
  },

  // ---- おうち（へやの 座標・キャラの 大きさは HOUSE_SIZE × actorScale）----
  // もった 子の よこ（side 0 = 手の がわ・1 = はんたいの がわ）
  hspot(c, side) {
    const [sx, sy] = this.HSIDE[c.dir] || this.HSIDE.down, k = side ? -1 : 1;
    return [U.clamp(c.x + sx * k, 30, ROOM.W - 30), U.clamp(c.y + sy * k, ROOM.WALL + 30, ROOM.H - 16)];
  },
  // (x, y) に いる こいぬが 画面で 人（3人・ぱぱ・まま）や ほかの こいぬと かさなる りょう
  crowd(sc, id, x, y) {
    const q = sc.toScreen(x, y), s = sc.actorScale, W = 34 * s + HOUSE_SIZE * s * 0.3, V = 60 * s;
    let n = 0;
    const add = (a) => { n += Math.max(0, 1 - Math.abs(q.x - a.x) / W) * Math.max(0, 1 - Math.abs(q.y - a.y) / V); };
    for (const c of [...sc.chars, ...(sc.parents || [])]) if (!c.hidden) add(sc.toScreen(c.x, c.y));
    for (const [k, p] of Object.entries(sc.pets || {})) if (k !== id) add(sc.toScreen(p.x, p.y));
    return n;
  },
  // かさならない がわ（手の がわを すこし ひいき・いまの がわも すこし ひいきして いったり きたり しない）
  pickSide(sc, id, c, now) {
    const cost = (s) => this.crowd(sc, id, ...this.hspot(c, s)) + (s ? 0.12 : 0);
    return cost(1 - now) + 0.08 < cost(now) ? 1 - now : now;
  },
  house(sc) {
    const out = [];
    for (const id of this.holders()) {
      const c = sc.chars.find((k) => k.id === id);
      if (!c) continue;
      sc.pets = sc.pets || {};
      let p = sc.pets[id];
      if (!p) { const side = this.pickSide(sc, id, c, 0), [x, y] = this.hspot(c, side); p = sc.pets[id] = { x, y, side, pick: 0.5, dir: c.dir, anim: Math.random(), moving: false, love: 0 }; }
      const [tx, ty] = this.hspot(c, p.side);
      out.push({ id, c, p, tx, ty });
    }
    return out;
  },
  houseUpdate(sc, dt) {
    if (UI.busy || (typeof document !== "undefined" && document.hidden)) return;
    const live = new Set();
    for (const o of this.house(sc)) {
      const p = o.p;
      if ((p.pick -= dt) <= 0) { p.pick = 0.5; p.side = this.pickSide(sc, o.id, o.c, p.side); [o.tx, o.ty] = this.hspot(o.c, p.side); }
      this.follow(p, o.tx, o.ty, dt, o.c.dir); p.love = Math.max(0, (p.love || 0) - dt); live.add(o.id);
    }
    if (sc.pets) for (const id of Object.keys(sc.pets)) if (!live.has(id)) delete sc.pets[id];
  },
  houseDrawables(sc, list, ctx) {
    if (sc.mode === "sleep") return;
    for (const o of this.house(sc)) {
      const P = this.PUPS[o.id];
      list.push({ z: sc.depth(o.p) + 0.2, draw: () => {
        const q = sc.toScreen(o.p.x, o.p.y), w = HOUSE_SIZE * sc.actorScale * 0.58, alpha = sc.mode === "edit" ? 0.35 : 1;
        const col = this.draw(ctx, o.id, o.p, q.x, q.y, w, alpha);
        if (!o.c.hidden && o.c.state !== "sleep") {
          const k = sc.toScreen(o.c.x, o.c.y), size = HOUSE_SIZE * sc.actorScale, [pose, dy] = sc.pose(o.c);
          this.leash(ctx, this.hand(o.id, o.c.dir, k.x, k.y - dy * sc.actorScale, size), col, P.collar, Math.max(1.4, 2.2 * sc.actorScale));
        }
        if (o.p.love > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, o.p.love); FX.heart(ctx, q.x + w * 0.1, q.y - w * 0.95 - (1.2 - o.p.love) * 16, 6); ctx.restore(); }
      } });
    }
  },
  // おうちの (x, y) で いちばん まえに 見えて いる こいぬ（こいぬの まえに 3人・ぱぱ・ままが いれば null）
  houseHit(sc, p) {
    let best = null, bz = -Infinity;
    for (const o of this.house(sc)) {
      const q = sc.toScreen(o.p.x, o.p.y), w = HOUSE_SIZE * sc.actorScale * 0.58, r = Math.max(22, w * 0.55), z = sc.depth(o.p) + 0.2;
      if (z > bz && Math.abs(p.x - q.x) <= r && p.y <= q.y + 6 && p.y >= q.y - Math.max(44, w * 0.9)) { best = o; bz = z; }
    }
    if (!best) return null;
    for (const [c, parent] of [...sc.chars.map((c) => [c, false]), ...(sc.parents || []).map((c) => [c, true])]) {
      if (!c.hidden && sc.depth(c) + 0.5 > bz && sc.contains(sc.actorRect(c, parent), p)) return null;
    }
    return best;
  },
  // こいぬを タップ できる 点（からだの まんなかに いちばん ちかい・見えて いる ところ）。テストと PokaDebug 用
  houseTapPoint(sc, id) {
    const o = this.house(sc).find((x) => x.id === id);
    if (!o) return null;
    const q = sc.toScreen(o.p.x, o.p.y), w = HOUSE_SIZE * sc.actorScale * 0.58, r = Math.max(22, w * 0.55), cy = q.y - w * 0.4;
    let best = null, bd = Infinity;
    for (let i = -4; i <= 4; i++) for (let j = 0; j <= 8; j++) {
      const pt = { x: q.x + (i * r) / 4.5, y: q.y + 4 - (j * Math.max(44, w * 0.9)) / 8.5 }, d = Math.hypot(pt.x - q.x, pt.y - cy);
      if (d < bd && this.houseHit(sc, pt)?.id === id) { best = pt; bd = d; }
    }
    return best;
  },
  // おうちで こいぬを タップ →「わん！」・ハート・もった 子の ことば
  houseTap(sc, p) {
    const o = this.houseHit(sc, p);
    if (!o) return false;
    o.p.love = 1.2; Sound.se("wan");
    HomeLife.say(sc, o.id, U.pick([`${this.PUPS[o.id].name}、いいこ だね！`, `${this.PUPS[o.id].name}、おさんぽ たのしいね♪`, `${this.PUPS[o.id].name}も なでて ほしいって！`]), false, "say", { pet: o.id });
    return true;
  },
};

// ---- つなぎ ----
(() => {
  // もちもの「おさんぽ リード」（手に わっかの とって。ひもは PetWalk が 描く）
  WEAR.hi_leash = (ctx) => {
    const h = HandItems.hand(ctx), c = ctx.col[0] || "#E8545E";
    return { top: `<path d="M${f2(h.x - 5)},${f2(h.y - 2)} C${f2(h.x - 7)},${f2(h.y - 12)} ${f2(h.x + 7)},${f2(h.y - 12)} ${f2(h.x + 5)},${f2(h.y - 2)} Z" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linejoin="round"/><path d="M${f2(h.x - 5)},${f2(h.y - 2)} C${f2(h.x - 7)},${f2(h.y - 12)} ${f2(h.x + 7)},${f2(h.y - 12)} ${f2(h.x + 5)},${f2(h.y - 2)} Z" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>` };
  };
  const leash = { id: PetWalk.ITEM, name: "おさんぽ リード", wear: "hi_leash", col: ["#E8545E"], price: 240, st: { spd: 2 }, desc: "こいぬと いっしょに おさんぽ できる リード" };
  const w = { ...leash, slot: HandItems.SLOT, price: typeof SlowLifePrices !== "undefined" ? SlowLifePrices.price("wear", leash.price) : leash.price };
  WEAR_ITEMS.push(w); ITEM_INDEX[w.id] = w;

  // アイコン（おみせ・きがえ・ずかん）: こいぬと リード
  const icon = Art.iconSvg;
  Art.iconSvg = function (kind, id) {
    if (kind !== "wear" || id !== PetWalk.ITEM) return icon.apply(this, arguments);
    const pup = PetWalk.svg("wanko", "down", 0, 1).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), L = "M66,72 C90,70 100,40 110,22", H = "M106,22 C103,10 120,5 122,17 C123,26 112,28 106,22 Z";
    const line = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#E8545E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -8 136 112"><g transform="translate(18 18) scale(0.78)">${pup}</g>${line(L)}${line(H)}</svg>`;
  };

  const WP = WorldScene.prototype, wu = WP.update;
  WP.update = function (dt) { const r = wu.apply(this, arguments); PetWalk.worldUpdate(this, dt); return r; };
  const HP = HouseScene.prototype, hu = HP.update, up = HP.up;
  HP.update = function (dt) { const r = hu.apply(this, arguments); PetWalk.houseUpdate(this, dt); return r; };
  HP.up = function (p) {
    if (!this.mode && p && p.tap && !this.panDrag?.moved && !this.gesture && !(this.life && this.life.quarrel) && PetWalk.houseTap(this, p)) { this.fingers && this.fingers.delete(p.id); this.panDrag = null; return; }
    return up.apply(this, arguments);
  };
})();
