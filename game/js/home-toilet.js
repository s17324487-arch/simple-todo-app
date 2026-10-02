// おトイレ（UI-47・オーナーの FB 2026-10-02「おトイレにも行かせたい」）。
// ・おうちの おくの かべに「おトイレ」の ドア（まどの みぎ・「おへや」の ドアの ひだり）。へやの 絵は HomeDesign.roomSvg が doorSvg を よぶ。
//   ドアの うえの ふだは HomeDoors（「おトイレ」・はいって いる あいだは「つかってるよ」）。おにわ（うらぐち だけ）には ない。
// ・3人の「いきたさ」（0〜100）: じかんで たまる（90ぷんで 100）＋ たべもの +5・のみもの +12（Care.feed）。
//   ドアを タップすると、いちばん いきたい 子（15 いじょう）が ドアまで あるいて はいる → ジャーの おと →「すっきり！ てを あらったよ」・ごきげん +6。
//   だれも いきたく ない ときは「いまは だいじょうぶ！」。はいって いる ときに タップすると コンコン →「はいってまーす！」。
//   70 いじょう: ときどき もじもじ（あせ・こまった かお・「おトイレ…」）。100 で 30びょう がまんすると じぶんで いく（「がまん できない〜！」）。
// ・きがえ・もようがえ・ごはん・ねる・かくれんぼ・ドア・かいだん・ぱぱ ままが でかける／かえる ・けんか・おねがいの おれいの あいだは もじもじ しない（とちゅうなら でてくる）。
// ・セーブ: Save.d.toilet = { at: { だれ: ms }, add: { だれ: 0〜100 }, n }（はじめて つかう ときに できる。Save.fresh() に いれない・SCHEMA は 2 の まま）。
// HouseScene・HomeDoors・HomeLife・ParentCare・Care・GowagaWish・Sound を 外から つつむ（ほかの ファイルは かえない。へやの 絵の ドアだけ home-design.js から よぶ）。
const HomeToilet = {
  IDS: ["wanko", "gachan", "goji"],
  TX: 282, W: 56, H: 136, // ドア: おくの かべに そった まんなか（へやの 座標 u）・はば・たかさ
  LAMP: { du: 18, z: 69 }, // あき／つかってる の ランプ（ドアの まんなかから）
  FULL: 90 * 60000, // いきたさ 0 → 100 の じかん（ms）
  EAT: 5, DRINK: 12, MIN: 15, WANT: 70, HOLD: 30, IN: 3.2, SPEED: 78, MOOD: 6,
  DRINK_RE: /ぎゅうにゅう|ミルク|ジュース|ティー|ラテ|モカ|たぴ|ココア|シェイク|ラムネ|スープ/,
  LINES: {
    go: { wanko: "おトイレ いってきまーす！", gachan: "おトイレ いってくるね♪", goji: "おトイレ いってくる ガウ！" },
    hold: { wanko: "がまん できない〜！", gachan: "もう だめ〜！ いってくる！", goji: "ガウっ！ もう むり〜！" },
    nag: {
      wanko: ["おトイレ… いきたいかも", "クンクン… もじもじ…", "おトイレの ドア、タップして〜！"],
      gachan: ["ねえ、おトイレ いっても いい？", "もじもじ… おトイレ…", "おトイレ いきたいな…"],
      goji: ["ガゥ… おトイレ…", "しっぽが そわそわ する ガウ", "おトイレ いきたい ガウっ！"],
    },
    inside: { wanko: ["ふんふん♪", "ふーっ…"], gachan: ["ふんふ〜ん♪", "♪〜"], goji: ["ガゥ〜♪", "ふんふん ガウ"] },
    knock: { wanko: "はいってまーす！", gachan: "はいってまーす♪", goji: "はいってる ガウ！" },
    done: { wanko: "すっきり！ てを あらったよ！", gachan: "すっきり♪ てを あらったよ", goji: "すっきり ガウ！ てを あらった！" },
    fine: { wanko: "いまは だいじょうぶ！", gachan: "まだ いきたく ないよ♪", goji: "あとで いく ガウ" },
  },

  // ---- いきたさ（セーブ）----
  st() {
    if (typeof Save === "undefined" || !Save.d) return null;
    let t = Save.d.toilet, made = false;
    if (!t || typeof t !== "object" || Array.isArray(t)) { t = Save.d.toilet = {}; made = true; }
    if (!t.at || typeof t.at !== "object") t.at = {};
    if (!t.add || typeof t.add !== "object") t.add = {};
    const now = Date.now();
    // はじめは すこし ずらす（ごじ・がちゃん・わんこ の じゅんに すこし いきたい）
    this.IDS.forEach((id, i) => {
      if (!Number.isFinite(t.at[id])) { t.at[id] = now - i * 8 * 60000; made = true; }
      t.add[id] = Number.isFinite(t.add[id]) ? U.clamp(t.add[id], 0, 100) : 0;
    });
    if (!Number.isFinite(t.n) || t.n < 0) t.n = 0;
    if (made) Save.mark();
    return t;
  },
  need(id) {
    const t = this.st();
    if (!t || !this.IDS.includes(id)) return 0;
    return U.clamp(Math.round(((Date.now() - t.at[id]) / this.FULL * 100 + t.add[id]) * 10) / 10, 0, 100);
  },
  set(id, v) {
    const t = this.st();
    if (!t || !this.IDS.includes(id)) return false;
    t.at[id] = Date.now() - U.clamp(Number(v) || 0, 0, 100) / 100 * this.FULL; t.add[id] = 0;
    Save.mark(); return true;
  },
  drink(item) { const f = BAG_INDEX[item]; return !!f && f.kind === "food" && this.DRINK_RE.test(f.name); },
  ate(id, item) {
    const t = this.st(), f = BAG_INDEX[item];
    if (!t || !this.IDS.includes(id) || !f || f.kind !== "food") return false;
    t.add[id] = U.clamp(t.add[id] + (this.drink(item) ? this.DRINK : this.EAT), 0, 100);
    Save.mark(); return true;
  },
  // はいった とき: いきたさを 0 に
  done(id) { const t = this.st(); if (!t) return; t.at[id] = Date.now(); t.add[id] = 0; t.n++; Save.mark(); },
  face(id) { return typeof CHARA_FACE_EXTRA !== "undefined" && CHARA_FACE_EXTRA[id] && CHARA_FACE_EXTRA[id].fs_doki ? "fs_doki" : "surprise"; },

  // ---- ドア ----
  door(sc) {
    const W = sc && sc.wc, inside = !!(W && W.who && W.inside);
    return { id: "toilet", side: "right", u0: this.TX - this.W / 2, u1: this.TX + this.W / 2, h: this.H, label: inside ? "つかってるよ" : "おトイレ", front: this.front() };
  },
  front() { return { x: this.TX, y: ROOM.WALL + 30 }; },
  // へやの 絵（おくの かべの もようの 座標: x は かべに そって・y は かべの うえから。HomeDesign.roomSvg の かべの なか）
  doorSvg(H) {
    const w = this.W, h = this.H, x0 = this.TX - w / 2, y0 = H - h, L = this.LAMP, lx = w / 2 + L.du, ly = h - L.z;
    const s = `stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;
    return `<g class="wc-door" transform="translate(${x0} ${y0})">`
      // きの わく・ミントの とびら・うえと したの パネル（したには かぜの とおる すきま）
      + `<rect x="-6" y="-7" width="${w + 12}" height="${h + 7}" rx="5" fill="#D8BF94" ${s} stroke-width="2.4"/><path d="M-2,-3 H${w + 2}" stroke="#EAD7B1" stroke-width="2"/>`
      + `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#BFE3D8" ${s} stroke-width="2.6"/>`
      + `<rect x="7" y="9" width="${w - 14}" height="47" rx="4" fill="#D7F0E8" stroke="#86B5A6" stroke-width="1.6"/>`
      + `<rect x="7" y="64" width="${w - 14}" height="62" rx="4" fill="#D7F0E8" stroke="#86B5A6" stroke-width="1.6"/>`
      + `<path d="M13,${h - 30} H${w - 13} M13,${h - 23} H${w - 13} M13,${h - 16} H${w - 13}" stroke="#86B5A6" stroke-width="1.8" stroke-linecap="round"/>`
      // まるい ふだ（トイレの え）
      + `<circle cx="${w / 2}" cy="31" r="13" fill="#FFF8E8" ${s} stroke-width="1.8"/>`
      + `<g transform="translate(${w / 2} 31)"><rect x="-8.5" y="-8.5" width="6" height="9" rx="1.4" fill="#FFFFFF" ${s} stroke-width="1.5"/>`
      + `<path d="M-3,-1 H8 Q8,5.5 2,6.6 L3,9.5 H-4 L-3,5.8 Q-3,2.5 -3,-1 Z" fill="#FFFFFF" ${s} stroke-width="1.5"/><path d="M-1,1.2 H5.5" stroke="#86B5A6" stroke-width="1.2" stroke-linecap="round"/></g>`
      // ランプの まど（あき／つかってる の いろは キャンバスで ぬる）・とって
      + `<rect x="${lx - 5}" y="${ly - 3.5}" width="10" height="7" rx="2.5" fill="#FFFFFF" ${s} stroke-width="1.2"/>`
      + `<path d="M${w - 10},${h - 58} H${w - 19}" ${s} stroke-width="3.4" fill="none"/><circle cx="${w - 10}" cy="${h - 58}" r="3.4" fill="#E0BD66" ${s} stroke-width="1.4"/>`
      + `<path d="M4,${h - 3} H${w - 4}" stroke="#86B5A6" stroke-width="2" stroke-linecap="round"/>`
      + `</g>`;
  },
  // ドアの うえの ランプ・あいた ときの くらい ところ（HomeDoors の ふだの あと・かぐと 3人の まえ）
  drawDoor(ctx, sc) {
    const W = this.scene(sc), d = HomeDoors.list().find((x) => x.id === "toilet");
    if (!d) return;
    const P = (u, z) => HomeDoors.wall(sc, d, u, z);
    if (W.open > 0) {
      const a = Math.min(1, W.open / 0.2), q = [P(d.u0 + 3, 2), P(d.u1 - 3, 2), P(d.u1 - 3, d.h - 3), P(d.u0 + 3, d.h - 3)];
      ctx.save(); ctx.globalAlpha = 0.82 * a; ctx.fillStyle = "#3E3A35"; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    const p = P(this.TX + this.LAMP.du, this.LAMP.z), r = Math.max(2, 3.2 * sc.s);
    ctx.save(); ctx.fillStyle = W.inside ? "#EF6F6C" : "#7BC67E"; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 1.25, r, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  },

  // ---- おうちの ようす（シーンごと。セーブしない）----
  scene(sc) {
    return sc.wc || (sc.wc = { who: null, inside: false, open: 0, nag: Object.fromEntries(this.IDS.map((id) => [id, 6 + Math.random() * 6])), hold: {} });
  },
  calm(sc) {
    const h = sc.wishFx;
    return !sc.mode && !UI.busy && !Game.trans && !sc.doorWalk && !sc.climb && !(sc.life && sc.life.quarrel)
      && !(sc.work && !["home", "away"].includes(sc.work.phase)) && !(h && (h.busy || h.amae > 0));
  },
  // じぶんから うごける 子（もじもじ・がまんの げんかい）
  free(sc, c) { return !!c && !c.hidden && !c.wc && !c.activity && ["idle", "walk"].includes(c.state) && !(sc.parents || []).some((p) => p.target === c.id); },
  // タップで いける 子（たべて いる・ねて いる・ドアや かいだんへ あるいて いる 子は いけない）
  canGo(sc, c) { return !!c && !c.hidden && !c.wc && ["idle", "walk", "jump", "moji", "activity", "amae"].includes(c.state) && !(sc.parents || []).some((p) => p.target === c.id); },
  tap(sc) {
    const W = this.scene(sc);
    if (W.who) {
      if (W.inside) { Sound.se("wc_knock"); HomeLife.say(sc, W.who, this.LINES.knock[W.who], false, "say", { wc: "knock" }); }
      return true;
    }
    const c = sc.chars.filter((k) => this.canGo(sc, k)).sort((a, b) => this.need(b.id) - this.need(a.id))[0];
    if (!c) { Sound.se("cancel"); return false; }
    if (this.need(c.id) < this.MIN) { Sound.se("cancel"); sc.fx("dots", c); HomeLife.say(sc, c.id, this.LINES.fine[c.id], false, "say", { wc: "fine" }); return false; }
    return this.go(sc, c, "go");
  },
  go(sc, c, why) {
    const W = this.scene(sc);
    if (W.who || !c || c.hidden || c.wc) return false;
    HomeActions.cancel(c);
    c.wc = { phase: "go", t: 0, why }; c.state = "wc"; c.emo = this.face(c.id);
    W.who = c.id; W.inside = false; W.hold[c.id] = 0; W.nag[c.id] = 25 + Math.random() * 15;
    HomeLife.say(sc, c.id, this.LINES[why][c.id], false, why === "hold" ? "shout" : "say", { wc: why });
    if (why === "hold") sc.fx("sweat", c); else Sound.voice(c.id);
    return true;
  },
  nag(sc, c) {
    const W = this.scene(sc);
    W.nag[c.id] = 25 + Math.random() * 15;
    HomeActions.cancel(c);
    c.state = "moji"; c.mojiT = 1.8; c.dir = "down";
    sc.fx("sweat", c);
    HomeLife.say(sc, c.id, U.pick(this.LINES.nag[c.id]), false, "say", { wc: "nag" });
  },
  update(sc, dt) {
    if (UI.busy || (typeof document !== "undefined" && document.hidden)) return; // 3人も とまって いる
    const W = this.scene(sc);
    W.open = Math.max(0, W.open - dt);
    for (const c of sc.chars) if (c.wc) this.step(sc, c, dt);
    for (const c of sc.chars) if (c.state === "moji" && (c.mojiT -= dt) <= 0) { c.state = "idle"; c.t = U.rand(1, 2.5); }
    if (W.who && sc.life) sc.life.next = Math.max(sc.life.next || 0, 2); // トイレの あいだは けんかや ほかの できごとを まつ
    if (!this.calm(sc)) return;
    for (const c of sc.chars) {
      const n = this.need(c.id);
      W.hold[c.id] = n >= 100 && !c.wc ? (W.hold[c.id] || 0) + dt : 0;
      if (n >= this.WANT && !c.wc) W.nag[c.id] = (W.nag[c.id] ?? 8) - dt;
    }
    if (W.who) return;
    const due = sc.chars.filter((c) => (W.hold[c.id] || 0) >= this.HOLD && this.free(sc, c)).sort((a, b) => W.hold[b.id] - W.hold[a.id])[0];
    if (due) { this.go(sc, due, "hold"); return; }
    if (sc.life && sc.life.queue && sc.life.queue.length) return; // かけあいの とちゅうは まつ
    const c = sc.chars.find((k) => this.need(k.id) >= this.WANT && W.nag[k.id] <= 0 && this.free(sc, k));
    if (c) this.nag(sc, c);
  },
  step(sc, c, dt) {
    const T = c.wc, W = this.scene(sc), f = this.front();
    // ほかの うごき（ドア・かいだん・ごはん・ねる・かくれんぼ・ぱぱ ままが かえる など）に かわったら でて くる
    if (c.state !== "wc" || sc.mode) { this.abort(sc, c); return; }
    T.t += dt;
    if (T.phase === "go") {
      const dx = f.x - c.x, dy = f.y - c.y, d = Math.hypot(dx, dy);
      if (d > 2 && T.t < 6) {
        const k = Math.min(1, (this.SPEED * dt) / d); c.x += dx * k; c.y += dy * k;
        c.dir = Math.abs(dx) > Math.abs(dy) * 0.7 ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        return;
      }
      c.x = f.x; c.y = f.y; c.dir = "up"; c.hidden = true;
      T.phase = "in"; T.t = 0; T.at = { x: c.x, y: c.y };
      W.inside = true; W.open = 0.55;
      Sound.se("door"); sc.fx("puff", { x: f.x, y: f.y + 8 });
      this.done(c.id);
    } else if (T.phase === "in") {
      if (!T.hum && T.t > 0.9) { T.hum = true; HomeLife.say(sc, c.id, U.pick(this.LINES.inside[c.id]), false, "say", { wc: "in" }); }
      if (!T.flush && T.t > this.IN - 0.9) { T.flush = true; Sound.se("wc_flush"); }
      if (T.t >= this.IN) this.leave(sc, c);
    }
  },
  leave(sc, c) {
    const W = this.scene(sc), f = this.front();
    delete c.wc; c.hidden = false; c.x = f.x; c.y = f.y + 6; c.dir = "down";
    W.who = null; W.inside = false; W.open = 0.55;
    c.state = "idle"; c.t = U.rand(1.5, 3);
    Sound.se("door");
    sc.react(c, "happy", "note");
    Save.care(c.id, { mood: this.MOOD });
    HomeLife.say(sc, c.id, this.LINES.done[c.id], false, "say", { wc: "done" });
    if (sc.updateCare) sc.updateCare();
  },
  // とちゅうで やめる（はいって いたら ドアの まえに でて くる。かくれんぼ などで うごかされて いたら そのまま）
  abort(sc, c) {
    const T = c.wc, W = this.scene(sc);
    if (!T) return;
    delete c.wc;
    if (T.phase === "in" && c.hidden && T.at && c.x === T.at.x && c.y === T.at.y) { c.hidden = false; c.y += 6; }
    if (c.state === "wc") { c.state = "idle"; c.t = U.rand(1, 2); }
    if (c.emo === this.face(c.id)) c.emo = null;
    if (W.who === c.id) { W.who = null; W.inside = false; }
  },
  // トイレの なかから はなす ときの ふきだしの ばしょ（ドアの うえの ほう）
  head(sc) {
    const W = sc.wc, c = W && W.inside && sc.chars.find((k) => k.id === W.who);
    if (!c || !c.hidden) return null;
    const p = sc.toScreen(this.TX, ROOM.WALL, this.H * 0.72), k = sc.actorScale || 1;
    return p.x >= 8 && p.x <= G.W - 8 && p.y >= sc.view.top && p.y <= sc.view.bottom ? { x: p.x, y: p.y, r: 16 * k } : null;
  },
};

// ---- つなぎ ----
(() => {
  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("enter", async function (orig, ...a) { this.wc = null; return orig.apply(this, a); });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); HomeToilet.update(this, dt); return r; });
  wrap("pose", function (orig, c) {
    if (c.state === "moji") return [Math.floor(c.anim / 0.11) % 2 ? "idle_02" : "idle_01", Math.abs(Math.sin(c.anim * 16)) * 2.5];
    if (c.state === "wc") return [["idle_01", "walk_01", "idle_01", "walk_02"][Math.floor(c.anim * 11) % 4], 0];
    return orig.call(this, c);
  });
  // いきたい 子は こまった かお（ふだんの かお だけ。わらう・なく などは そのまま）
  wrap("baseFace", function (orig, c) { return HomeToilet.need(c.id) >= HomeToilet.WANT ? HomeToilet.face(c.id) : orig.call(this, c); });
  // トイレへ いく とちゅう・なかの 子は とびはねない（ハートなどだけ）
  wrap("react", function (orig, c, emo, fx) { if (c && c.wc) { if (!c.hidden && fx) this.fx(fx, c); return; } return orig.call(this, c, emo, fx); });

  const list = HomeDoors.list;
  HomeDoors.list = function () { const r = list.call(this); if (HomeGarden.active()) return r; return [...r, HomeToilet.door(G.sceneName === "house" ? G.scene : null)]; };
  const open = HomeDoors.open;
  HomeDoors.open = function (sc, d) { if (d && d.id === "toilet") return Promise.resolve(HomeToilet.tap(sc)); return open.call(this, sc, d); };
  const signs = HomeDoors.drawSigns;
  HomeDoors.drawSigns = function (ctx, sc) { const r = signs.call(this, ctx, sc); if (sc.mode !== "edit" && !HomeGarden.active()) HomeToilet.drawDoor(ctx, sc); return r; };

  const heads = HomeLife.heads;
  HomeLife.heads = function (sc) { const h = heads.call(this, sc), W = sc && sc.wc; if (W && W.who && !h[W.who]) { const x = HomeToilet.head(sc); if (x) h[W.who] = x; } return h; };

  // ぱぱ・ままの おせわは トイレの 子を あとまわし
  const next = ParentCare.next;
  ParentCare.next = function (sc, p) {
    const busy = (id) => !!(sc.chars || []).find((c) => c.id === id && c.wc);
    if (p.queue.length && busy(p.queue[0])) {
      const i = p.queue.findIndex((id) => !busy(id));
      if (i < 0) { p.queue = []; p.target = null; p.state = "idle"; p.time = 3; return; }
      p.queue.unshift(...p.queue.splice(i, 1));
    }
    return next.call(this, sc, p);
  };

  const feed = Care.feed;
  Care.feed = function (id, item, ...a) { const r = feed.call(this, id, item, ...a); if (r) HomeToilet.ate(id, item); return r; };

  // ごわがの おねがいの おれいは トイレの あと
  if (typeof GowagaWish !== "undefined") { const house = GowagaWish.house; GowagaWish.house = function (sc, dt) { if (sc.wc && sc.wc.who) return; return house.call(this, sc, dt); }; }

  // こうかおん: ジャー（みずが ながれる）・コンコン（ノック）
  const se = Sound.se;
  Sound.se = function (name) {
    if (name !== "wc_flush" && name !== "wc_knock") return se.call(this, name);
    if (!this.ctx || !Save.d || !Save.d.settings.se) return;
    const d = this.seGain;
    if (name === "wc_knock") {
      for (const t of [0, 0.17]) { this.tone(d, { f: 200, f2: 120, t, dur: 0.06, type: "triangle", vol: 0.3 }); this.noise(d, { t, dur: 0.04, vol: 0.22, freq: 900, q: 1.5 }); }
      return;
    }
    this.noise(d, { dur: 0.5, vol: 0.2, freq: 1500, f2: 700, q: 0.6, type: "lowpass" });
    this.noise(d, { t: 0.42, dur: 0.5, vol: 0.16, freq: 800, f2: 300, q: 0.6, type: "lowpass" });
    for (let i = 0; i < 4; i++) this.tone(d, { f: 270 - i * 30, f2: 150 - i * 15, t: 0.35 + i * 0.17, dur: 0.11, type: "sine", vol: 0.08 });
  };
})();
