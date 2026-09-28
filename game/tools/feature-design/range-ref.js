// ⑥ 射撃場の しくみと 画面（見本の 実装・classic script）。主観（えらんだ 子の 目の たかさ）で うごく まとを うつ。
//   new RangeRef.Game(RANGE_DATA, gunId, { seed, W, H }) … 1かいの あそび（30〜40びょう）
//   game.update(dt, input) … input = { dx, dy（ゆびの うごき px）, fire（おした しゅんかん）, hold（おしている）, scope（スコープ きりかえ） }
//   RangeRef.draw(ctx, game, art) … 画面を 描く（art.img(key) で 絵を もらう。キーは RangeRef.artKeys で ぜんぶ わかる・有限）
//   RangeRef.bot(game, skill) … じどうで あそぶ（build-range.mjs の ★の めやす しらべ・PokaDebug.rangeAuto）
// GunArtRef（gun-art-ref.js）を 先に 読みこむ。
const RangeRef = (() => {
  const INK = "#1F1D1B";
  const r1 = (n) => Math.round(n * 10) / 10;
  const rng = (seed) => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // コースごとの 見え方（H に たいする わりあい）。y=0 が いちばん おく、y=1 が いちばん てまえ
  const VIEW = {
    near: { top: 0.2, bottom: 0.6, sFar: 0.78, sNear: 1.2, bg: "booth" },
    mid: { top: 0.22, bottom: 0.62, sFar: 0.6, sNear: 1.1, bg: "hall" },
    far: { top: 0.28, bottom: 0.5, sFar: 0.42, sNear: 0.75, bg: "field" },
  };
  const project = (view, W, H, x, y) => { const s = view.sFar + (view.sNear - view.sFar) * y; return { X: W / 2 + x * W * 0.43 * (0.72 + 0.28 * y), Y: H * (view.top + (view.bottom - view.top) * y), s }; };
  const SCOPE = (W, H) => ({ cx: W / 2, cy: H * 0.4, r: W * 0.46 });

  class Game {
    constructor(data, gunId, o = {}) {
      this.D = data; this.gun = data.guns.find((g) => g.id === gunId); this.cat = data.cats[this.gun.cat];
      this.courseId = this.cat.course; this.course = data.courses[this.courseId]; this.view = VIEW[this.courseId];
      this.W = o.W || 360; this.H = o.H || 700; this.R = rng(o.seed || "range:" + gunId);
      this.phase = "ready"; this.t = -1.6; this.left = this.course.time; this.score = 0; this.combo = 0; this.maxCombo = 0; this.hits = 0; this.shots = 0;
      this.ammo = this.gun.mag; this.reloading = 0; this.cool = 0; this.recoil = { x: 0, y: 0 }; this.kick = 0;
      this.aim = { x: this.W / 2, y: this.H * (this.view.top + (this.view.bottom - this.view.top) * 0.4) };
      this.scoped = false; this.targets = []; this.fx = []; this.last = null; this.events = [];
      this.plan = this.course.items.map((it, i) => ({ it, i, next: it.t, n: 0 }));
    }
    get zoom() { return this.scoped && this.gun.zoom ? this.gun.zoom : 1; }
    // まとを だす
    spawn(p, now) {
      const it = p.it, T = this.D.targets[it.kind], add = (x, extra = {}) => this.targets.push({ id: `${p.i}.${p.n++}`, kind: it.kind, T, it, x, y: it.y, born: now, x0: x, vx: it.vx || 0, off: 0, hit: 0, gone: 0, ...extra });
      if (it.motion === "stay") for (const x of it.xs) add(x, { col: Math.floor(this.R() * 4) });
      else if (it.motion === "rise") add(it.xs[Math.floor(this.R() * it.xs.length)] + (this.R() - 0.5) * 0.12, { col: Math.floor(this.R() * 4), phase: this.R() * 6 });
      else if (it.motion === "pop") add(it.win[Math.floor(this.R() * it.win.length)], { life: it.life });
      else add(it.x, { phase: this.R() * 6 });
    }
    // いまの 画面の 位置と 大きさ
    place(tg) {
      const p = project(this.view, this.W, this.H, tg.x, tg.y), T = tg.T;
      const r = (T.r || Math.max(T.w, T.h) / 2) * p.s, pop = tg.it.motion === "pop" ? Math.min(1, (this.t - tg.born) / 0.18, Math.max(0, (tg.born + tg.life - this.t) / 0.18)) : 1;
      return { X: p.X, Y: p.Y - tg.off - (1 - pop) * r * 2.2, r, s: p.s, pop, w: (T.w || 0) * p.s, h: (T.h || 0) * p.s };
    }
    update(dt, input = {}) {
      const g = this.gun;
      if (this.phase === "end") return;
      this.t += dt;
      if (this.phase === "ready") { if (this.t >= 0) { this.phase = "play"; this.t = 0; this.events.push({ ev: "start" }); } return; }
      this.left = Math.max(0, this.course.time - this.t);
      // うごかす（スコープの ときは こまかく）
      const z = this.zoom;
      this.aim.x = Math.max(0, Math.min(this.W, this.aim.x + (input.dx || 0) / z));
      this.aim.y = Math.max(this.H * 0.05, Math.min(this.H * 0.72, this.aim.y + (input.dy || 0) / z));
      if (input.scope && g.zoom) this.scoped = !this.scoped;
      // はねあがりは すぐ もどる
      const k = Math.exp(-dt / 0.12); this.recoil.x *= k; this.recoil.y *= k; this.kick *= Math.exp(-dt / 0.1);
      // たま・リロード
      if (this.cool > 0) this.cool -= dt;
      if (this.reloading > 0) { this.reloading -= dt; if (this.reloading <= 0) { this.ammo = g.mag; this.events.push({ ev: "reloaded" }); } }
      if ((input.fire || (g.auto && input.hold)) && this.cool <= 0 && this.reloading <= 0 && this.ammo > 0) this.shoot();
      // まとを だす・うごかす
      for (const p of this.plan) while (p.next != null && p.next <= this.t) { this.spawn(p, p.next); p.next = p.it.every ? p.next + p.it.every : null; }
      for (const tg of this.targets) {
        const it = tg.it, age = this.t - tg.born;
        if (it.motion === "rail" && !tg.hit) { tg.x += tg.vx * dt; if (tg.x > 1 || tg.x < -1) { tg.vx = -tg.vx; tg.x = Math.max(-1, Math.min(1, tg.x)); if (it.every) tg.gone = 1; } }
        if (it.motion === "swing") tg.x = tg.x0 + it.amp * Math.sin((2 * Math.PI * age) / it.period + tg.phase) * (tg.hit ? 1.6 : 1);
        if (it.motion === "rise") { tg.off = it.vy * this.H * age; tg.x = tg.x0 + Math.sin(age * 2 + tg.phase) * 0.04; if (this.place(tg).Y < -40) tg.gone = 1; }
        if (it.motion === "pop" && age > tg.life) tg.gone = 1;
        if (tg.hit && (tg.kind === "balloon" || tg.kind === "star" || tg.kind === "popup" || tg.kind === "far") && this.t - tg.hit > 0.35) tg.gone = 1;
        if (tg.hit && tg.kind === "can") { tg.off -= 260 * dt * (this.t - tg.hit) * 3; if (this.t - tg.hit > (it.respawn || 5)) { tg.hit = 0; tg.off = 0; } }
        if (tg.hit && tg.kind === "plate" && (it.motion === "rail" || it.motion === "swing") && this.t - tg.hit > 0.5) tg.hit = 0;
        if (tg.hit && tg.kind === "gong" && this.t - tg.hit > 2.2) tg.hit = 0;
      }
      this.targets = this.targets.filter((tg) => !tg.gone);
      this.fx = this.fx.filter((f) => (f.t += dt) < f.life);
      if (this.left <= 0) this.finish();
    }
    // 1ぱつ うつ（ばらつき・ゆれ・はねあがり を たして、てまえの まとから しらべる）
    shoot() {
      const g = this.gun, z = this.zoom, R = this.R;
      this.cool = 1 / g.rate; this.ammo--; this.shots++;
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * g.spread, sw = this.sway();
      const hx = this.aim.x + this.recoil.x + Math.cos(a) * d + sw.x, hy = this.aim.y + this.recoil.y + Math.sin(a) * d + sw.y;
      this.recoil.y -= g.recoil * (z > 1 ? 0.6 : 1); this.recoil.x += (R() - 0.5) * g.recoil * 0.3; this.kick = 1;
      if (this.ammo <= 0) { this.reloading = g.reload; this.events.push({ ev: "reload" }); }
      const list = this.targets.filter((tg) => !tg.hit).map((tg) => ({ tg, p: this.place(tg) })).filter((o) => o.p.pop > 0.6).sort((a, b) => b.tg.y - a.tg.y);
      let got = null;
      for (const { tg, p } of list) {
        const T = tg.T, dx = hx - p.X, dy = hy - p.Y; let pts = 0;
        if (T.hit === "box") { if (Math.abs(dx) <= p.w / 2 && Math.abs(dy) <= p.h / 2) pts = T.pts; }
        else { const q = Math.hypot(dx, dy) / p.r; if (q <= 1) pts = T.hit === "ring" ? (q < 0.3 ? T.pts[0] : q < 0.65 ? T.pts[1] : T.pts[2]) : T.pts; }
        if (pts) { got = { tg, pts, p, dx, dy }; break; }
      }
      this.last = { x: hx, y: hy, t: this.t, hit: !!got };
      if (got) {
        const { tg, pts } = got; tg.hit = this.t; tg.mark = { dx: got.dx / got.p.s, dy: got.dy / got.p.s };
        this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.hits++;
        const bonus = this.combo >= this.D.combo.from ? this.D.combo.bonus : 0;
        this.score += pts + bonus;
        this.fx.push({ kind: "pts", x: hx, y: hy, n: pts + bonus, t: 0, life: 0.8 });
        this.events.push({ ev: "hit", kind: tg.kind, pts: pts + bonus, combo: this.combo, se: tg.T.se });
      } else {
        this.combo = 0; this.fx.push({ kind: "puff", x: hx, y: hy, t: 0, life: 0.4 }); this.events.push({ ev: "miss" });
      }
      this.fx.push({ kind: "air", t: 0, life: 0.18 });
    }
    // スコープの ゆれ（8の字）。しずかに ねらって いると すこし へる
    sway() { if (this.zoom <= 1) return { x: 0, y: 0 }; const a = this.gun.sway / this.zoom, t = this.t; return { x: Math.sin(t * 1.3) * a, y: Math.sin(t * 2.6) * a * 0.6 }; }
    finish() {
      this.phase = "end"; const st = this.course.stars; this.stars = st.filter((v) => this.score >= v).length;
      this.coins = Math.round(this.D.pay.base * this.D.pay.rank[this.stars]);
      this.events.push({ ev: "end", stars: this.stars, score: this.score });
    }
    take() { const e = this.events; this.events = []; return e; }
  }

  // じどうで あそぶ（人の 手に にせた うごき）。skill:
  //   react 見てから わかる までの おくれ（びょう）・tau ねらいが ちかづく はやさ・speed いちばん はやい うごき（px/びょう）
  //   pred うごく まとを さきよみ できる わりあい（0 ぜんぜん・1 ぴったり）
  //   err ゆびの ぶれ（px）・tol どこまで ちかづいたら おすか（半径の わりあい）・dwell ねらって から おす まで・taps 1びょうに おせる 数・swap つぎの まとに かえる まで
  const SKILL = {
    kid: { react: 0.4, pred: 0.5, tau: 0.3, speed: 260, err: 6, tol: 0.75, dwell: 0.3, taps: 2.5, swap: 0.45 },
    casual: { react: 0.3, pred: 0.75, tau: 0.22, speed: 380, err: 4, tol: 0.65, dwell: 0.2, taps: 3.5, swap: 0.3 },
    good: { react: 0.18, pred: 0.95, tau: 0.12, speed: 700, err: 2.2, tol: 0.5, dwell: 0.12, taps: 5, swap: 0.16 },
  };
  function bot(g, skill = "casual") {
    const sk = typeof skill === "string" ? SKILL[skill] : { ...SKILL.casual, ...skill }, dt = 1 / 60;
    const inp = { dx: 0, dy: 0, fire: false, hold: false, scope: false };
    const B = g._bot || (g._bot = { hist: new Map(), tgt: null, on: 0, wait: 0, tap: 0, chase: 0, skip: new Map(), R: rng("bot" + g.gun.id), wx: 0, wy: 0 });
    if (g.phase !== "play") return inp;
    if (g.gun.zoom && !g.scoped) { inp.scope = true; return inp; }
    // 見えて いる まとの いちを おぼえる（react びょう まえの いちを「見えて いる」 ことに する）
    for (const tg of g.targets) { const h = B.hist.get(tg.id) || []; const p = g.place(tg); h.push([g.t, p.X, p.Y, p.r, p.pop]); while (h.length && h[0][0] < g.t - sk.react - 0.05) h.shift(); B.hist.set(tg.id, h); }
    // react びょう まえに 見えた いちから、うごきを さきよみ（pred）して いまの いちを おしはかる
    const seen = (tg) => { const h = B.hist.get(tg.id); if (!h || h.length < 2 || g.t - tg.born < sk.react) return null; const e = h[0], f = h[Math.min(h.length - 1, 6)], dt2 = Math.max(1e-3, f[0] - e[0]), vx = (f[1] - e[1]) / dt2, vy = (f[2] - e[2]) / dt2, k = (g.t - e[0]) * sk.pred; return { X: e[1] + vx * k, Y: e[2] + vy * k, vx, vy, r: e[3], pop: e[4] }; };
    B.wait -= dt; B.tap -= dt;
    const alive = (tg) => tg && g.targets.includes(tg) && !tg.hit && !((B.skip.get(tg.id) || 0) > g.t);
    if (!alive(B.tgt) || B.wait > 0) {
      if (B.wait <= 0) { let best = null, bv = 0; for (const tg of g.targets) { if (!alive(tg)) continue; const p = seen(tg); if (!p || p.pop < 0.8 || p.Y < 8 || p.Y > g.H * 0.72) continue; const pts = Array.isArray(tg.T.pts) ? tg.T.pts[1] : tg.T.pts, d = Math.hypot(p.X - g.aim.x, p.Y - g.aim.y), v = pts / (1 + d / 90); if (v > bv) { bv = v; best = tg; } } if (best !== B.tgt) { B.tgt = best; B.on = 0; B.chase = 0; } }
      if (!B.tgt) return inp;
    }
    const p = seen(B.tgt); if (!p) return inp;
    // ゆびの ぶれ（ゆっくり かわる）
    B.wx += ((B.R() - 0.5) * 2 * sk.err - B.wx) * 0.08; B.wy += ((B.R() - 0.5) * 2 * sk.err - B.wy) * 0.08;
    // 人は はねあがりや ゆれを ひいて ねらえない: まとに むけて うごかし、見えて いる ねらいの しるしが まとに かさなったら おす
    const z = g.zoom, sw = g.sway(), tx = p.X + B.wx / z, ty = p.Y + B.wy / z, dx = tx - g.aim.x, dy = ty - g.aim.y;
    // まとの はやさに あわせて ゆびを うごかし（pred）、のこりの ずれを tau で ちぢめる
    let mx = p.vx * dt * sk.pred + dx * (1 - Math.exp(-dt / sk.tau)), my = p.vy * dt * sk.pred + dy * (1 - Math.exp(-dt / sk.tau)); const m = Math.hypot(mx, my), cap = (sk.speed * dt) / z; if (m > cap) { mx *= cap / m; my *= cap / m; }
    inp.dx = mx * z; inp.dy = my * z;
    const d = Math.hypot(g.aim.x + g.recoil.x + sw.x - p.X, g.aim.y + g.recoil.y + sw.y - p.Y);
    if (d < p.r * sk.tol) B.on += dt; else B.on = 0;
    // ながく ねらっても かさならない まとは あきらめて ほかへ（2.5びょう）
    B.chase += dt; if (B.chase > 2.5 && B.on === 0) { B.skip.set(B.tgt.id, g.t + 1.5); B.tgt = null; B.wait = sk.swap; return inp; }
    // スコープの ときは ゆれに あわせて かさなった しゅんかんに おす（まつ 時間が みじかい）
    if (B.on >= sk.dwell * (z > 1 ? 0.35 : 1)) {
      if (g.gun.auto) inp.hold = true;
      else if (B.tap <= 0 && g.cool <= 0 && g.reloading <= 0) { inp.fire = true; B.tap = 1 / sk.taps; }
    }
    // あてたら つぎへ
    if (B.tgt.hit) { B.tgt = null; B.wait = sk.swap; }
    return inp;
  }

  // ---- 絵 ----
  const BAL = ["#F48FB1", "#FFD54F", "#7EC8F0", "#8BCB6B"], CAN = ["#E35D5B", "#7EC8F0", "#8BCB6B", "#F29A1F"];
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // まとの 絵（中心が 0,0。1ばいの 大きさ）。キーは "rt:" + kind + ":" + col（有限）
  function targetSvg(kind, col = 0, T = {}) {
    const r = T.r || 16; let s = "", vb;
    const ring = (R) => [1, 0.8, 0.6, 0.4, 0.2].map((k, i) => `<circle r="${r1(R * k)}" fill="${["#FFFDF6", "#E35D5B", "#FFFDF6", "#E35D5B", "#F7C948"][i]}" ${i ? "" : st(1.8)}/>`).join("") + `<circle r="${r1(R)}" fill="none" ${st(1.8)}/>`;
    if (kind === "plate" || kind === "far") { vb = [-r - 3, -r - 3, 2 * r + 6, 2 * r + r * 1.6 + 6]; s = `<rect x="${-r * 0.12}" y="${r * 0.9}" width="${r * 0.24}" height="${r * 1.5}" fill="#8C6440" ${st(1.4)}/>` + ring(r); }
    else if (kind === "popup") { vb = [-r - 6, -r - 6, 2 * r + 12, 2 * r + 12]; s = `<rect x="${-r - 4}" y="${-r - 4}" width="${2 * r + 8}" height="${2 * r + 8}" rx="4" fill="#E8C890" ${st(1.8)}/>` + ring(r * 0.86); }
    else if (kind === "can") { const w = T.w || 22, h = T.h || 30, c = CAN[col % 4]; vb = [-w / 2 - 2, -h / 2 - 4, w + 4, h + 8]; s = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#D8DEE6" ${st(1.6)}/><rect x="${-w / 2}" y="${-h / 2 + h * 0.22}" width="${w}" height="${h * 0.56}" fill="${c}" ${st(1.2)}/><ellipse cx="0" cy="${-h / 2}" rx="${w / 2}" ry="3" fill="#EEF2F6" ${st(1.3)}/><path d="M${-w * 0.25},${-h * 0.1} L${-w * 0.25},${h * 0.2}" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/><circle cx="${w * 0.12}" cy="${h * 0.05}" r="${w * 0.16}" fill="#FFFDF6" opacity="0.9"/>`; }
    else if (kind === "balloon") { const c = BAL[col % 4]; vb = [-r - 3, -r * 1.2 - 3, 2 * r + 6, r * 3.6]; s = `<path d="M0,${r * 1.18} Q${r * 0.3},${r * 1.7} ${-r * 0.1},${r * 2.3}" fill="none" stroke="${INK}" stroke-width="1.2"/><ellipse rx="${r}" ry="${r * 1.18}" fill="${c}" ${st(1.8)}/><path d="M${-r * 0.16},${r * 1.14} L${r * 0.16},${r * 1.14} L0,${r * 1.36} Z" fill="${c}" ${st(1.2)}/><ellipse cx="${-r * 0.36}" cy="${-r * 0.46}" rx="${r * 0.2}" ry="${r * 0.34}" fill="#FFFFFF" opacity="0.7" transform="rotate(20 ${-r * 0.36} ${-r * 0.46})"/>`; }
    else if (kind === "star") { vb = [-r - 4, -r - 4, 2 * r + 8, 2 * r + 8]; let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + r1(Math.cos(a) * q) + "," + r1(Math.sin(a) * q); } s = `<path d="${d}Z" fill="#F7C948" ${st(1.8)}/><path d="M${-r * 0.2},${-r * 0.3} L${-r * 0.05},${-r * 0.6}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`; }
    else if (kind === "gong") { vb = [-r - 3, -r * 2.4, 2 * r + 6, r * 3.5]; s = `<path d="M${-r * 0.6},${-r * 0.8} L${-r * 0.3},${-r * 2.3} M${r * 0.6},${-r * 0.8} L${r * 0.3},${-r * 2.3}" stroke="#6E747C" stroke-width="1.6"/><circle r="${r}" fill="#C9CED6" ${st(1.8)}/><circle r="${r * 0.62}" fill="none" stroke="#A7AEB8" stroke-width="1.4"/><circle r="${r * 0.22}" fill="#E35D5B" ${st(1.2)}/><path d="M${-r * 0.6},${-r * 0.4} Q${-r * 0.3},${-r * 0.75} ${r * 0.1},${-r * 0.8}" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity="0.8"/>`; }
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(r1).join(" ")}" width="${r1(vb[2] * 2)}" height="${r1(vb[3] * 2)}">${s}</svg>`, vb };
  }
  // 手の 絵（わんこ: しろい まえあし・がちゃん: きいろい はね・ごじ: はいいろの 手と しろい つめ）
  const HAND = {
    wanko: { fill: "#FFFFFF", pad: "#F4B6C2", spot: "#1F1D1B", kind: "paw" },
    gachan: { fill: "#FADA78", pad: "#F2C04E", kind: "wing" },
    goji: { fill: "#8C8686", fill2: "#4A4A4C", claw: "#FFFFFF", kind: "claw" },
  };
  function handSvg(who, x, y, ang, tone, side) {
    const H = HAND[who], f = who === "goji" && tone === "dark" ? H.fill2 : H.fill, a = r1(ang);
    let arm = `<path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${f}" stroke-width="40" stroke-linecap="round"/>`;
    let hand = "";
    if (H.kind === "paw") hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-8,-15 L-8,-6 M1,-16 L1,-6 M10,-14 L10,-6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9" cy="5" rx="5" ry="4" fill="${H.spot}"/>`;
    else if (H.kind === "wing") hand = `<path d="M-20,6 Q-22,-14 -2,-17 Q16,-18 22,-8 L14,-6 L20,1 L11,2 L15,9 Q0,18 -20,6 Z" fill="${f}" ${st(2)}/><path d="M-10,-4 Q0,-8 10,-6" fill="none" stroke="${H.pad}" stroke-width="2"/>`;
    else hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-12,-14 L-15,-23 L-7,-16 Z M-1,-16 L-2,-26 L5,-16 Z M10,-14 L12,-23 L16,-11 Z" fill="${H.claw}" ${st(1.4)}/>`;
    return arm + `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${hand}</g>`;
  }
  // 主観の じゅう（手つき）。viewBox 360×260 の したの ほうに おく。キーは "rg:" + gun + ":" + who + ":" + tone（9×3×2 = 有限）
  const FPV = { hand: { px: 0.95, ang: 12, at: [214, 216] }, rifle: { px: 0.37, ang: 9, at: [266, 210] }, sniper: { px: 0.34, ang: 8, at: [270, 212] } };
  function fpvSvg(gun, who, tone = "soft") {
    const F = FPV[gun.cat], P = GunArtRef.parts(gun), b = P.box, px = F.px, rad = (F.ang * Math.PI) / 180;
    const gx = (P.grip[0] - b[0]) * px, gy = (P.grip[1] - b[1]) * px;
    const tr = (pt) => { const x = (pt[0] - b[0]) * px - gx, y = (pt[1] - b[1]) * px - gy; return [F.at[0] + x * Math.cos(rad) - y * Math.sin(rad), F.at[1] + x * Math.sin(rad) + y * Math.cos(rad)]; };
    const inner = GunArtRef.svg(gun, { px, uid: "fp" + gun.id + who }).replace("<svg ", `<svg x="${r1(-gx)}" y="${r1(-gy)}" `);
    let s = "";
    if (P.fore) { const [fx, fy] = tr(P.fore); s += handSvg(who, fx, fy + 6, F.ang - 10, tone, "L"); }
    s += `<g transform="translate(${F.at[0]} ${F.at[1]}) rotate(${F.ang})">${inner}</g>`;
    if (P.fore) { const [fx, fy] = tr(P.fore); s += `<g transform="translate(${r1(fx)} ${r1(fy + 6)}) rotate(${F.ang - 10})"><path d="M-18,-6 Q0,-16 18,-8" fill="none" stroke="${INK}" stroke-width="1.6"/></g>`; }
    const [hx, hy] = tr(P.grip); s += handSvg(who, hx, hy + 4, F.ang + 20, tone, "R");
    const mz = tr(P.muzzle);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="720" height="520" overflow="hidden">${s}</svg>`, muzzle: mz };
  }
  const artKeys = (data) => {
    const k = [];
    for (const [kind, T] of Object.entries(data.targets)) for (let c = 0; c < (kind === "can" || kind === "balloon" ? 4 : 1); c++) k.push({ key: `rt:${kind}:${c}`, make: () => targetSvg(kind, c, T).svg });
    return k;
  };

  // ---- 画面を 描く ----
  function drawBg(ctx, g) {
    const { W, H, view } = g, top = H * view.top, bot = H * view.bottom;
    if (view.bg === "field") {
      const sky = ctx.createLinearGradient(0, 0, 0, top); sky.addColorStop(0, "#9ED8F4"); sky.addColorStop(1, "#DFF3FF"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, top + 4);
      ctx.fillStyle = "#FFFFFF"; for (const [x, y, r] of [[60, 40, 16], [84, 36, 20], [108, 42, 14], [260, 60, 14], [282, 54, 18]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#9CC08A"; ctx.beginPath(); ctx.moveTo(0, top); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, top - 14 - Math.sin(x / 50) * 10); ctx.lineTo(W, top); ctx.fill();
      ctx.fillStyle = "#B8D89A"; ctx.fillRect(0, top, W, H - top);
      ctx.strokeStyle = "#A3C886"; ctx.lineWidth = 2; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 14, top); ctx.lineTo(W / 2 + i * 90, H); ctx.stroke(); }
      ctx.fillStyle = "#C9B08A"; ctx.fillRect(0, top - 6, W, 8);
      ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = INK; ctx.textAlign = "center";
      for (const [y, t] of [[0.62, "25m"], [0.9, "10m"]]) { const Y = top + (bot - top) * y + (H - bot) * (y - 0.5); ctx.fillStyle = "#FFFDF6"; ctx.fillRect(12, Y - 8, 30, 14); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(12, Y - 8, 30, 14); ctx.fillStyle = INK; ctx.fillText(t, 27, Y + 3); }
      ctx.fillStyle = "#E35D5B"; ctx.beginPath(); ctx.moveTo(W - 30, top - 40); ctx.lineTo(W - 10, top - 34); ctx.lineTo(W - 30, top - 28); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(W - 30, top - 42); ctx.lineTo(W - 30, top); ctx.stroke();
      return;
    }
    // なかの へや（booth: おまつりの しゃてき・hall: しゃげきじょう）
    ctx.fillStyle = view.bg === "booth" ? "#F6E3C4" : "#E6ECF2"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = view.bg === "booth" ? "#E8C890" : "#CCD6E0"; ctx.fillRect(0, top - 30, W, bot - top + 60);
    if (view.bg === "booth") {
      // いたの かべ・けいひんの たな・ちょうちん
      ctx.strokeStyle = "#E2CCA4"; ctx.lineWidth = 1.2; for (let x = 12; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, top - 30); ctx.stroke(); }
      ctx.fillStyle = "#B98A5A"; ctx.fillRect(0, top - 36, W, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(-2, top - 36, W + 4, 8);
      const toys = [["#F48FB1", "bear"], ["#7EC8F0", "star"], ["#FFD54F", "duck"], ["#8BCB6B", "bear"], ["#F29A1F", "star"], ["#B58CD8", "duck"]];
      toys.forEach(([c, k], i) => { const x = 30 + i * 60, y = top - 44; ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath();
        if (k === "star") { for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, q = j % 2 ? 4 : 9; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); }
        else { ctx.arc(x, y, 8, 0, 7); } ctx.fill(); ctx.stroke();
        if (k === "bear") { for (const dx of [-6, 6]) { ctx.beginPath(); ctx.arc(x + dx, y - 7, 3, 0, 7); ctx.fill(); ctx.stroke(); } }
        if (k !== "star") { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 3, y - 1, 1.1, 0, 7); ctx.arc(x + 3, y - 1, 1.1, 0, 7); ctx.fill(); } });
      for (const x of [16, W - 16]) { ctx.fillStyle = "#E35D5B"; ctx.beginPath(); ctx.ellipse(x, 52, 11, 15, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1; for (const dy of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x - 9, 52 + dy); ctx.lineTo(x + 9, 52 + dy); ctx.stroke(); } }
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? "#FFFFFF" : "#E35D5B"; ctx.beginPath(); ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40 + 40, 0); ctx.lineTo(i * 40 + 40, 28); ctx.quadraticCurveTo(i * 40 + 20, 40, i * 40, 28); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); }
      // さんかくの はた
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 34); ctx.quadraticCurveTo(W / 2, 50, W, 34); ctx.stroke();
      for (let i = 0; i < 12; i++) { const x = 8 + i * 30, y = 34 + Math.sin((x / W) * Math.PI) * 12; ctx.fillStyle = ["#FFD54F", "#7EC8F0", "#8BCB6B", "#F48FB1"][i % 4]; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 13); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#B98A5A"; ctx.fillRect(0, H * 0.62 + 14, W, 10); ctx.strokeStyle = INK; ctx.strokeRect(-2, H * 0.62 + 14, W + 4, 10);
      ctx.fillStyle = "#C9A06A"; ctx.fillRect(0, H * 0.42 + 18, W, 40); ctx.strokeRect(-2, H * 0.42 + 18, W + 4, 40);
      for (const x of g.course.items.find((i) => i.motion === "pop").win) { const p = project(view, W, H, x, 0.42); ctx.fillStyle = "#6E5238"; ctx.fillRect(p.X - 22, p.Y - 26, 44, 44); ctx.strokeRect(p.X - 22, p.Y - 26, 44, 44); }
    } else {
      // おくの どて（たまを うけとめる）・レーンの ばんごう・かべの パネル
      ctx.fillStyle = "#9AA6B2"; ctx.fillRect(0, top - 30, W, 22); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(-2, top - 30, W + 4, 22);
      ctx.strokeStyle = "#D6DEE6"; ctx.lineWidth = 1; for (let x = 0; x < W; x += 30) for (let y = 26; y < top - 34; y += 30) ctx.strokeRect(x + 3, y, 24, 24);
      ctx.font = "900 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      for (let i = 0; i < 6; i++) { const x = (W / 6) * (i + 0.5); ctx.fillStyle = "#FFFDF6"; ctx.beginPath(); ctx.arc(x, top - 19, 8, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = INK; ctx.fillText(String(i + 1), x, top - 15); }
      ctx.strokeStyle = "#AEBAC6"; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = (W / 6) * (i + 0.5); ctx.beginPath(); ctx.moveTo(x, top - 8); ctx.lineTo(x + (x - W / 2) * 0.6, H); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = "#FFF3C4"; ctx.fillRect(30 + i * 90, 8, 60, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(30 + i * 90, 8, 60, 8); }
    }
    // レール
    for (const it of g.course.items) if (it.motion === "rail" && it.kind !== "star") { const p = project(view, W, H, 0, it.y); ctx.strokeStyle = "#6E747C"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, p.Y - 36 * p.s); ctx.lineTo(W, p.Y - 36 * p.s); ctx.stroke(); }
  }
  function draw(ctx, g, art) {
    const { W, H } = g, z = g.zoom, sc = SCOPE(W, H), sw = g.sway();
    ctx.save();
    if (z > 1) { const ax = g.aim.x + sw.x, ay = g.aim.y + sw.y; ctx.translate(sc.cx, sc.cy); ctx.scale(z, z); ctx.translate(-ax, -ay); }
    drawBg(ctx, g);
    // まと（おくから てまえへ）
    for (const tg of [...g.targets].sort((a, b) => a.y - b.y)) {
      const p = g.place(tg), key = `rt:${tg.kind}:${tg.kind === "can" || tg.kind === "balloon" ? tg.col % 4 : 0}`, im = art.img(key); if (!im) continue;
      const { vb } = targetSvg(tg.kind, tg.col || 0, tg.T), s = p.s;
      ctx.save(); ctx.translate(p.X, p.Y);
      if (tg.it.motion === "swing") { ctx.rotate(Math.sin(g.t * 3 + tg.phase) * 0.08); }
      if (tg.hit && tg.kind === "can") ctx.rotate(Math.min(1.4, (g.t - tg.hit) * 5));
      if (tg.hit && (tg.kind === "balloon" || tg.kind === "star")) { const k = 1 + (g.t - tg.hit) * 2; ctx.globalAlpha = Math.max(0, 1 - (g.t - tg.hit) / 0.35); ctx.scale(k, k); }
      if (tg.it.motion === "pop") { ctx.beginPath(); ctx.rect(-40 * s, -80 * s, 80 * s, 80 * s + 18 * s); ctx.clip(); }
      ctx.drawImage(im, vb[0] * s, vb[1] * s, vb[2] * s, vb[3] * s);
      if (tg.mark && (tg.kind === "plate" || tg.kind === "popup" || tg.kind === "far")) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(tg.mark.dx * s, tg.mark.dy * s, 2 * s, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    // あたった ところ・ぷしゅ
    for (const f of g.fx) {
      const k = f.t / f.life;
      if (f.kind === "puff") { ctx.strokeStyle = "rgba(255,255,255," + (1 - k) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 3 + k * 8, 0, 7); ctx.stroke(); }
      if (f.kind === "pts") { ctx.font = "900 16px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#FFFFFF"; ctx.fillStyle = f.n >= 5 ? "#E0A21E" : "#E35D5B"; ctx.strokeText("+" + f.n, f.x, f.y - 12 - k * 20); ctx.fillText("+" + f.n, f.x, f.y - 12 - k * 20); }
    }
    ctx.restore();
    if (z > 1) {
      // スコープの のぞき まど（まわりは くろ・じゅうじの せん・メモリ）
      ctx.save(); ctx.fillStyle = "#101216"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(sc.cx, sc.cy, sc.r, 0, Math.PI * 2, true); ctx.fill("evenodd");
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sc.cx, sc.cy, sc.r, 0, 7); ctx.stroke();
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sc.cx - sc.r, sc.cy); ctx.lineTo(sc.cx + sc.r, sc.cy); ctx.moveTo(sc.cx, sc.cy - sc.r); ctx.lineTo(sc.cx, sc.cy + sc.r); ctx.stroke();
      for (let i = -4; i <= 4; i++) if (i) { ctx.beginPath(); ctx.arc(sc.cx + i * 18, sc.cy, 1.8, 0, 7); ctx.arc(sc.cx, sc.cy + i * 18, 1.8, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
      ctx.restore();
    } else {
      // ねらいの しるし（まる＋じゅうじ）
      const x = g.aim.x + g.recoil.x, y = g.aim.y + g.recoil.y;
      ctx.save(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.stroke(); ctx.strokeStyle = "#E35D5B"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.moveTo(x - 17, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 17, y); ctx.moveTo(x, y - 17); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 17); ctx.stroke(); ctx.restore();
      // 主観の じゅう（した みぎ）。うつと すこし はねる
      const im = art.img("fpv"); if (im) { const k = g.kick, w = W, h = (W * 260) / 360; ctx.drawImage(im, 0 + k * 6, H - h + k * 10 - (g.reloading > 0 ? -18 : 0), w, h); }
    }
  }
  const stars = (data, courseId, score) => data.courses[courseId].stars.filter((v) => score >= v).length;
  // かんばんの アイコン（SIGN_ICON と 同じ 形: (x, y) が まんなか）
  const signIcon = (x, y) => [9, 6.5, 4, 1.6].map((r, i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${["#FFFDF6", "#E35D5B", "#FFFDF6", "#E35D5B"][i]}" ${i ? "" : st(1.2)}/>`).join("");
  // 町に たつ 建物の 外がわ（WorldArt.building と 同じ 形: sp = { w, h, door, roof, facility: "range" }）→ { w, h, top, svg }
  // おまつりの しゃてきの ような あかしろの ひさし・中の まとが 見える まど・やねの うえの まとの かんばん
  function facade(sp) {
    const W = sp.w * 32, H = sp.h * 32, top = 10, dx = (sp.door + 0.5) * 32, roof = sp.roof || "#E35D5B";
    let s = `<ellipse cx="${W / 2}" cy="${H - 1}" rx="${W / 2 - 2}" ry="4" fill="${INK}" fill-opacity="0.12"/>`;
    s += `<rect x="4" y="${top + 34}" width="${W - 8}" height="${H - top - 36}" fill="#FFF4DC" ${st()}/>`;
    s += `<rect x="4" y="${H - 8}" width="${W - 8}" height="6" fill="#E8D8B8" ${st(1.2)}/>`;
    // やねの うえの かんばん（おおきな まと）
    s += `<rect x="${W / 2 - 34}" y="${top - 6}" width="68" height="30" rx="8" fill="#FFF7E0" ${st(1.6)}/>` + [13, 9.5, 6, 2.5].map((r, i) => `<circle cx="${W / 2}" cy="${top + 9}" r="${r}" fill="${["#FFFDF6", "#E35D5B", "#FFFDF6", "#E35D5B"][i]}" ${i ? "" : st(1.4)}/>`).join("");
    for (const sx of [-1, 1]) { const cx = W / 2 + sx * 25, cy = top + 9; let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? 2.2 : 5; d += (i ? "L" : "M") + r1(cx + Math.cos(a) * q) + "," + r1(cy + Math.sin(a) * q); } s += `<path d="${d}Z" fill="#F7C948" ${st(1)}/>`; }
    // あかしろの ひさし
    const ay = top + 26, n = sp.w * 2;
    s += `<rect x="0" y="${ay - 4}" width="${W}" height="6" fill="${roof}" ${st(1.4)}/>`;
    for (let k = 0; k < n; k++) { const x0 = (k * W) / n, x1 = ((k + 1) * W) / n; s += `<path d="M${r1(x0)},${ay + 2} L${r1(x1)},${ay + 2} L${r1(x1)},${ay + 12} Q${r1((x0 + x1) / 2)},${ay + 18} ${r1(x0)},${ay + 12} Z" fill="${k % 2 ? "#FFFFFF" : roof}" ${st(1.2)}/>`; }
    // まど（中に まと）と カウンター
    for (const [wx, ww] of [[10, dx - 34], [dx + 24, W - dx - 34]]) {
      s += `<rect x="${wx}" y="${ay + 22}" width="${ww}" height="34" rx="3" fill="#5E4A38" ${st(1.4)}/>`;
      const cx = wx + ww / 2; s += [6, 4.2, 2.4, 0.9].map((r, i) => `<circle cx="${cx - 8}" cy="${ay + 36}" r="${r}" fill="${["#FFFDF6", "#E35D5B", "#FFFDF6", "#E35D5B"][i]}"/>`).join("");
      s += `<rect x="${cx + 3}" y="${ay + 34}" width="6" height="9" rx="1" fill="#7EC8F0" ${st(0.8)}/><ellipse cx="${cx + 13}" cy="${ay + 32}" rx="4" ry="5" fill="#F48FB1" ${st(0.8)}/>`;
      s += `<rect x="${wx - 3}" y="${ay + 54}" width="${ww + 6}" height="7" rx="2" fill="#C08F5C" ${st(1.3)}/>`;
    }
    // とびら
    s += `<path d="M${dx - 12},${H - 6} L${dx - 12},${H - 30} Q${dx},${H - 40} ${dx + 12},${H - 30} L${dx + 12},${H - 6} Z" fill="#A8743F" ${st(1.6)}/><circle cx="${dx + 5}" cy="${H - 16}" r="1.6" fill="#F7C948"/>`;
    return { w: W, h: H + top, top, svg: s };
  }
  return { rng, VIEW, project, SCOPE, Game, bot, SKILL, draw, targetSvg, handSvg, fpvSvg, artKeys, stars, FPV, facade, signIcon };
})();
if (typeof module !== "undefined") module.exports = RangeRef;
