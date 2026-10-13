// レベルの おいわいの 会（UI-120。オーナーの 指示 2026-10-13「レベルが10上がるごとに、3人がおうちで勝手にお祝いの会を開いている様子を実装して」）。
// ・3人の だれかが レベル 10・20・…・100 に なると（Stats.gainExp）、おいわいの まちに いれる（Save.d.lvParty.pend。done で 2かい いわわない）。
//   レベルを じかに かえた とき（PokaDebug.level）や、まえから その レベルの 子は いわわない（あがった ときだけ）。
// ・じぶんの おうちに いる とき、へやが しずかに なると 3人が かってに おいわいの 会を ひらく（はいって 2.5〜4びょう・できない ときは 20びょう ごと）。
//   おなじ レベルに なった 子は いっしょに いわう（ちがう レベルは つぎの 会）。
//   かべに ガーランドと「わんこ レベル20 おめでとう！」の たれまく・まんなかに テーブルと ケーキ（ろうそくは 10 ごとに 1本）・ふうせん 3つ・3人は とんがりぼうし。
//   あつまる → かいし →「おめでとう！」→「ありがとう」→「かんぱーい！」（はねる）→ ろうそくを ふーっ → たのしい ひとこと 2つ →「また おいわい しようね！」で おわり（やく 50びょう）。
//   ぱぱ ままが いれば「おめでとう」。おわると 3人の ごきげん +10・なかよし +1。
// ・タップ: やめない（ひとこと・ハート）。したの ボタンや ドア・かいだん・もようがえ など ほかの うごきが はじまったら やめる。
//   「かんぱーい」まで すすんで いれば いわった ことに する（まだ なら つぎに また ひらく）。
// ・会の あいだは けんか・かけあい・しぐさ・おひるね・あそぶ・おトイレの もじもじ・おねがい・ぱぱ ままの おせわ を おやすみ。おじゃま（js/online-visit.js）では ひらかない。
// ・ならびと ばしょは あそぶ（js/home-play.js）の「まるく ならぶ」（HomePlay.layout / spot）を つかう（たって いる）。
// HouseScene（enter・update・up・buildUI・render の drawables）・HomeActions（visual・props）・Stats.gainExp・HomeDoze.can・HomePlay.can・HomeLife.say・ParentCare.update・GowagaWish.house・HomeToilet.calm を 外から つつむ。
const HomeLvParty = {
  IDS: ["wanko", "gachan", "goji"],
  STEP: 10, // この レベル ごとに いわう
  WAIT: [2.5, 4], RETRY: 20, GATHER: 10, BEAT: 5.2, END: 4.6, // びょう
  MOOD: 10,
  // ふうせん・ぼうしの いろ（3人の いろ）
  COLOR: { wanko: ["#7FB2E5", "#FFFFFF"], gachan: ["#F5A3C0", "#FFF3B0"], goji: ["#8FCB82", "#FFE08A"] },
  // とんがりぼうしの ばしょ（足もとから。actorScale の まえ）
  HAT: { wanko: [1, -68], gachan: [0, -67], goji: [2, -64] },
  // ことば（{name} いわわれる 子の なまえ・{lv} レベル・{next} つぎの めあて）。3人は じぶんを なまえで よぶ
  LINES: {
    start: { wanko: "みんな〜！ おいわいの パーティー はじめるよ！", gachan: "ピヨ♪ かざりつけ、できたよ〜", goji: "ガゥ！ ケーキも よういしたよ！" },
    ready: { wanko: "わーい！ まってました！", gachan: "わあ、すてき♪", goji: "ガゥー！ たのしみ！" },
    congrats: { wanko: "{name}、レベル{lv} おめでとう！", gachan: "{name}、レベル{lv} おめでとう♪", goji: "{name}、レベル{lv} おめでとう ガウっ！" },
    congratsAll: { wanko: "みんなで レベル{lv}！ おめでとう！", gachan: "3にん そろって レベル{lv}♪", goji: "みんな レベル{lv} ガウっ！" },
    thanks: { wanko: "えへへ… ありがとう！ わんこ、もっと がんばるね！", gachan: "ピヨ… うれしい！ ありがとう♪", goji: "ガゥー！ ありがとう！ ごじ、つよく なったよ！" },
    thanksAll: { wanko: "みんな、いつも ありがとう！", gachan: "3にん いっしょだから がんばれたね♪", goji: "ガゥ… みんなの おかげ！" },
    kanpai: { wanko: "かんぱーい！ ワン！", gachan: "かんぱーい♪", goji: "かんぱーい ガウっ！" },
    candle: { wanko: "ろうそく、ふーって して！", gachan: "ろうそく、ふーって してね♪", goji: "ろうそく ふーって して ガウ！" },
    blow: { wanko: "せーの… ふーっ！", gachan: "せーの… ふーっ♪", goji: "せーの… ガゥーっ！" },
    fun: {
      wanko: ["ケーキ、ふわふわ！ おいしい！", "おいわいの おどり、いくよ〜！", "クンクン… いちごの におい！", "しっぽが とまらない〜！"],
      gachan: ["ピヨ♪ おうた うたおう！", "はくしゅ〜！ ぱちぱち♪", "ふうせん、ふわふわ かわいいね", "いちご、はんぶんこ しよ♪"],
      goji: ["ガゥ… いちご、もう 1こ いい？", "つぎは レベル{next} だね！", "ごじ、おどりも とくい ガウっ！", "ケーキ、おっきく きって〜"],
    },
    max: { wanko: "レベル100！ せかいいちの おいわい だね！", gachan: "レベル100… ゆめ みたい♪", goji: "レベル100 ガウっ！ いちばん うえ！" },
    end: { wanko: "きょうは ありがとう！ たのしかった！", gachan: "また おいわい しようね♪", goji: "ガゥ… おなか いっぱい しあわせ…" },
    cheer: { wanko: ["おめでとう！ ワン！", "えへへ、たのしいね！"], gachan: ["ピヨ♪ たのしいね！", "うふふ、おいわい♪"], goji: ["ガゥ！ おいわい！", "ケーキ おいしい ガウっ"] },
    parent: { papa: "おっ、おいわいかい？ おめでとう！", mama: "まあ、すてきな パーティーね。おめでとう♪" },
    stop: { wanko: "あっ、おいわい また あとでね！", gachan: "ピヨ… また あとで つづき しよ♪", goji: "ガゥ… また あとで！" },
  },

  // ---- セーブ（Save.d.lvParty）----
  save() {
    const d = Save.d, P = d.lvParty || (d.lvParty = { pend: [], done: {}, log: [] });
    if (!Array.isArray(P.pend)) P.pend = [];
    if (!P.done || typeof P.done !== "object") P.done = {};
    if (!Array.isArray(P.log)) P.log = [];
    P.pend = P.pend.filter((x) => x && this.IDS.includes(x.who) && Number.isInteger(x.lv) && x.lv >= this.STEP && x.lv % this.STEP === 0 && x.lv <= Stats.LV_MAX);
    for (const id of this.IDS) if (!Number.isInteger(P.done[id])) P.done[id] = 0;
    return P;
  },
  // レベルが あがった（Stats.gainExp の あと）: 10 ごとの レベルに なったら まちに いれる
  leveled(id, ups) {
    if (!this.IDS.includes(id) || !ups || !ups.length) return false;
    const P = this.save();
    let add = false;
    for (const u of ups) if (u.lv % this.STEP === 0 && u.lv > P.done[id]) { P.done[id] = u.lv; P.pend.push({ who: id, lv: u.lv }); add = true; }
    if (add) Save.mark();
    return add;
  },
  // つぎの 会（いちばん ひくい レベルの なかま）
  nextGroup() {
    const P = this.save();
    if (!P.pend.length) return null;
    const lv = Math.min(...P.pend.map((x) => x.lv)), who = this.IDS.filter((id) => P.pend.some((x) => x.lv === lv && x.who === id));
    return { lv, who };
  },
  name(id) { return (Save.d.chars[id] && Save.d.chars[id].name) || { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" }[id]; },
  // たれまくの ことば
  banner(g) { return `${g.who.length === this.IDS.length ? "みんな" : g.who.map((id) => this.name(id)).join("・")} レベル${g.lv} おめでとう！`; },
  fill(text, g) { return text.replace(/\{name\}/g, g.who.map((id) => this.name(id)).join("と ")).replace(/\{lv\}/g, g.lv).replace(/\{next\}/g, Math.min(Stats.LV_MAX, g.lv + this.STEP)); },

  // ---- シーンごとの ようす（セーブしない）----
  st(sc) { return sc.lvParty || (sc.lvParty = { phase: null, t: 0, g: 0, next: U.rand(...this.WAIT), beat: -1, beatT: 0, group: null, spot: null, pos: {}, ev: null, evT: 0, blown: false, done: false, parties: 0, last: null, why: null, script: [] }); },
  on(sc) { return !!(sc && sc.lvParty && sc.lvParty.phase); },
  partying(c) { return !!(c && c.activity && c.activity.id === "lvparty"); },
  can(sc) {
    if (!sc || sc.guest || sc.mode || UI.busy || Game.trans || document.hidden || sc.doorWalk || sc.climb) return false;
    if (this.on(sc) || (typeof HomeDoze !== "undefined" && HomeDoze.on(sc)) || (typeof HomePlay !== "undefined" && HomePlay.on(sc))) return false;
    if (sc.life && (sc.life.quarrel || sc.life.queue.length)) return false;
    if (sc.wc && sc.wc.who) return false;
    const h = sc.wishFx; if (h && (h.busy || h.amae > 0)) return false;
    if (sc.work && !["home", "away"].includes(sc.work.phase)) return false;
    return sc.chars.length === this.IDS.length && sc.chars.every((c) => !c.hidden && !c.wc && ["idle", "walk", "activity"].includes(c.state));
  },
  // かいしの じゅんばん（だれが なにを いうか）
  // host: はじめる 子（いわわれる 子 いがい。みんな いわわれる ときは だれか）
  hostOf(g) { const others = this.IDS.filter((id) => !g.who.includes(id)); return U.pick(others.length ? others : this.IDS); },
  plan(g, host) {
    const stars = g.who, all = stars.length === this.IDS.length, others = this.IDS.filter((id) => !stars.includes(id)), star = U.pick(stars);
    const funs = U.shuffle(this.IDS).slice(0, 2).map((id) => ["fun", [id], U.pick(this.LINES.fun[id])]);
    const s = [
      ["congrats", all ? this.IDS : others, null],
      ["thanks", all ? [host] : stars, null],
      ["kanpai", this.IDS, null],
      ["candle", [host === star && others.length ? others[0] : host], null],
      ["blow", [star], null],
      ...funs,
    ];
    if (g.lv >= Stats.LV_MAX) s.splice(2, 0, ["max", [star], null]);
    return s;
  },
  start(sc, via = "self") {
    const g = this.nextGroup();
    if (!g || !this.can(sc)) return false;
    const S = this.st(sc), sp = HomePlay.spot(sc, "circle"), pos = HomePlay.layout("circle", sp), order = U.shuffle([...this.IDS]), host = this.hostOf(g);
    Object.assign(S, { phase: "gather", t: 0, g: 0, beat: -1, beatT: 0, group: g, spot: sp, pos: {}, ev: null, evT: 0, blown: false, done: false, recorded: false, parentT: 0, via, script: this.plan(g, host), host });
    // ぱぱ・ままは おせわを やめて、テーブルの ちかくや まえに いれば よける（js/home-play.js と おなじ）
    const taken = [];
    for (const p of sc.parents || []) {
      p.queue = []; if (p.target) { p.target = null; p.state = "idle"; p.time = 3; }
      const at = p.state === "walk" ? { x: p.tx, y: p.ty } : p;
      if (p.hidden || !HomePlay.inWay(sp, at.x, at.y)) continue;
      let q = HomePlay.aside(sp, p, taken); if (!q) continue;
      if (typeof HomeNav !== "undefined") q = HomeNav.near(sc, q.x, q.y);
      taken.push(q);
      Object.assign(p, { state: "walk", tx: q.x, ty: q.y, _nav: null });
    }
    order.forEach((id, i) => {
      const c = sc.chars.find((k) => k.id === id); if (!c) return;
      let { x, y } = pos[i]; x = U.clamp(x, 40, ROOM.W - 40); y = U.clamp(y, ROOM.WALL + 60, ROOM.H - 20);
      if (typeof HomeNav !== "undefined") { const q = HomeNav.near(sc, x, y); x = q.x; y = q.y; }
      S.pos[id] = { x, y, dir: pos[i].dir, k: i };
      HomeActions.cancel(c);
      Object.assign(c, { state: "walk", tx: x, ty: y, emo: null, jumpT: -1, _nav: null });
    });
    HomeLife.converse(sc, [{ who: host, text: this.LINES.start[host], meta: { party: "start" } },
      ...this.IDS.filter((id) => id !== host).map((id) => ({ who: id, text: this.LINES.ready[id], meta: { party: "ready" } }))]);
    Sound.se("pop");
    return true;
  },
  // その ばで たつ（会の かっこう）
  settle(sc, c) {
    const S = this.st(sc), q = S.pos[c.id]; if (!q) return;
    HomeActions.cancel(c);
    Object.assign(c, { state: "activity", dir: q.dir, emo: null, jumpT: -1, x: q.x, y: q.y, tx: q.x, ty: q.y, _nav: null });
    c.activity = { id: "lvparty", stage: "act", elapsed: 0, duration: 1e9, travel: 0, k: q.k };
  },
  jump(sc, ids) { for (const c of sc.chars) if (ids.includes(c.id)) c.partyJump = G.t + (ids.indexOf(c.id) * 0.12); },
  // 1つ すすめる
  beat(sc) {
    const S = this.st(sc), g = S.group, step = S.script[S.beat];
    if (!step) return;
    const [key, who, text] = step, L = this.LINES[key];
    const turns = who.map((id) => ({ who: id, text: this.fill(text || (key === "congrats" && g.who.length === this.IDS.length ? this.LINES.congratsAll[id] : key === "thanks" && g.who.length === this.IDS.length ? this.LINES.thanksAll[id] : L[id]), g), meta: { party: key } }));
    HomeLife.converse(sc, turns);
    S.ev = key; S.evT = 0;
    if (key === "congrats") { this.jump(sc, who); Sound.se("fanfare"); }
    if (key === "kanpai") { this.jump(sc, this.IDS); Sound.se("good"); S.done = true; this.record(S); }
    if (key === "blow") { S.blown = true; Sound.se("swish"); }
    if (key === "max") this.jump(sc, this.IDS);
    if (key === "fun") { const c = sc.chars.find((k) => k.id === who[0]); if (c) { sc.fx("note", c); c.partyJump = G.t; } } // sc.react は しぐさを とめる ので つかわない
    // ぱぱ・ままの おめでとう（2つめで）
    if (S.beat === 1) S.parentT = 2.6;
  },
  // いわった ことに する（まちから けす・きろく）
  record(S) {
    if (S.recorded) return;
    S.recorded = true;
    const P = this.save(), g = S.group;
    P.pend = P.pend.filter((x) => !(x.lv === g.lv && g.who.includes(x.who)));
    P.log.push({ day: U.today(), lv: g.lv, who: g.who.slice() }); if (P.log.length > 12) P.log.shift();
    Save.mark();
  },
  finish(sc) {
    const S = this.st(sc), g = S.group;
    S.phase = "end"; S.t = 0; S.ev = "end"; S.evT = 0;
    const last = g.who.length === 1 ? g.who[0] : U.pick(g.who), rest = this.IDS.filter((id) => id !== last);
    HomeLife.converse(sc, [{ who: last, text: this.LINES.end[last], meta: { party: "end" } }, { who: rest[0], text: this.LINES.end[rest[0]], meta: { party: "end" } }]);
    Save.careAll({ mood: this.MOOD, bond: 1 });
    if (typeof sc.updateCare === "function") sc.updateCare();
    S.parties++;
  },
  // やめる（why: done おわり・button したの ボタン・stir ほかの うごき）
  stop(sc, why = "done") {
    const S = this.st(sc), was = S.phase;
    if (!was) return false;
    Object.assign(S, { phase: null, t: 0, ev: null, last: S.group, why, next: U.rand(...this.WAIT) + (S.done ? 0 : this.RETRY), recorded: false });
    for (const c of sc.chars) if (this.partying(c)) { HomeActions.cancel(c); c.state = "idle"; c.t = U.rand(1.5, 3); c.partyJump = null; }
    for (const c of sc.chars) if (c.state === "walk" && !c.activity) { c.state = "idle"; c.t = U.rand(1, 2); }
    if (sc.life) sc.life.next = Math.max(sc.life.next, 8);
    if (typeof HomeDoze !== "undefined" && sc.doze) sc.doze.next = Math.max(sc.doze.next, 90);
    if (typeof HomePlay !== "undefined" && sc.play) sc.play.next = Math.max(sc.play.next, 60);
    if (why === "button" && was !== "end") { const id = U.pick(this.IDS); HomeLife.say(sc, id, this.LINES.stop[id], false, "say", { party: "stop" }); }
    return true;
  },
  update(sc, dt) {
    const S = this.st(sc);
    if (document.hidden || UI.busy) return;
    if (!S.phase) {
      if (!Game.paused && this.save().pend.length && this.can(sc) && (S.next -= dt) <= 0 && !this.start(sc)) S.next = this.RETRY;
      return;
    }
    if (sc.life) sc.life.next = Math.max(sc.life.next, 4);
    if (sc.actions) sc.actions.next = Math.max(sc.actions.next, 3);
    if (sc.mode || Game.trans || sc.doorWalk || sc.climb || sc.chars.some((c) => c.hidden)) { this.stop(sc, "stir"); return; }
    S.t += dt; S.evT += dt;
    if (S.phase === "gather") {
      S.g += dt;
      for (const c of sc.chars) if (!this.partying(c) && (c.state === "idle" || S.g >= this.GATHER)) this.settle(sc, c);
      if (sc.chars.every((c) => this.partying(c)) && !(sc.life && sc.life.queue.length)) { S.phase = "party"; S.t = 0; S.beat = -1; S.beatT = 0.8; }
      return;
    }
    if (sc.chars.some((c) => !this.partying(c))) { this.stop(sc, "stir"); return; }
    if (S.phase === "party") {
      if (S.parentT > 0 && (S.parentT -= dt) <= 0) { const ps = (sc.parents || []).filter((p) => !p.hidden); if (ps.length) { const p = U.pick(ps); HomeLife.say(sc, p.id, this.LINES.parent[p.id], false, "say", { party: "parent" }); } }
      if ((S.beatT -= dt) <= 0) {
        S.beat++;
        if (S.beat >= S.script.length) { this.finish(sc); return; }
        this.beat(sc); S.beatT = this.BEAT;
      }
      return;
    }
    if (S.phase === "end" && S.t >= this.END + (sc.life && sc.life.queue.length ? 1 : 0)) this.stop(sc, "done");
  },

  // ===================== 絵 =====================
  // からだ: たって ゆらゆら・はねる（かんぱい・おめでとう）・ろうそくを ふく
  visual(c) {
    const sc = G.scene, S = sc && sc.lvParty, a = c.activity; if (!S || !a) return null;
    const q = S.pos[c.id] || { dir: "down" }, t = a.elapsed + (a.k || 0) * 0.9;
    const v = { pose: Math.floor(t * 1.6) % 2 ? "idle_02" : "idle_01", face: "happy", dir: q.dir, x: 0, y: 0, angle: 0.06 * Math.sin(t * 2.4), sx: 1, sy: 1 + 0.015 * Math.sin(t * 4.8), alpha: 1 };
    if (c.partyJump && G.t >= c.partyJump && G.t - c.partyJump < 0.65) { const k = (G.t - c.partyJump) / 0.65; v.pose = "jump_01"; v.y = -Math.sin(k * Math.PI) * 24; v.angle = 0; return v; }
    if (S.ev === "blow" && S.evT < 1.6 && S.group && S.group.who.includes(c.id)) { v.face = "surprise"; v.angle = 0; v.sy = 0.97; }
    if (S.ev === "fun" && S.evT < 3) { v.pose = Math.floor(t * 3) % 2 ? "jump_01" : "idle_02"; v.y = -Math.abs(Math.sin(t * 6)) * 5; }
    if (S.phase === "end") v.face = "love";
    return v;
  },
  // とんがりぼうし（からだと いっしょに うごく）
  props(sc, ctx, c, p, s) {
    const v = this.visual(c); if (!v) return;
    const [hx, hy] = this.HAT[c.id] || [0, -80], [col, dot] = this.COLOR[c.id] || ["#F5A3C0", "#FFF"];
    ctx.save(); ctx.translate(p.x + v.x * s, p.y + v.y * s); ctx.rotate(v.angle); ctx.scale(v.sx * s, v.sy * s);
    ctx.translate(hx, hy); ctx.rotate(-0.12);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(0, -26); ctx.lineTo(11, 0); ctx.quadraticCurveTo(0, 4, -11, 0); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = dot; ctx.lineWidth = 3.2;
    for (const y of [-6, -15]) { ctx.beginPath(); ctx.moveTo(-14, y + 3); ctx.lineTo(14, y - 3); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(0, -26); ctx.lineTo(11, 0); ctx.quadraticCurveTo(0, 4, -11, 0); ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -27, 4.2, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();
  },
  ink(ctx, w) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round"; },
  // ゆかの まるい もの（へやの (cx, cy)・はんけい r・たかさ z）の りんかく
  ring(sc, cx, cy, r, z, n = 28) { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(sc.toScreen(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); } return out; },
  path(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); },
  // まえ（画面で した）の はんぶんの ふち: a = −π/4 〜 3π/4（x + y が おおきい がわ）
  arc(sc, cx, cy, r, z, n = 16) { const out = []; for (let i = 0; i <= n; i++) { const a = -Math.PI / 4 + (i / n) * Math.PI; out.push(sc.toScreen(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); } return out; },
  line(ctx, pts, color, w) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); },
  // つつ（まるい テーブルの ぬの・ケーキ）: よこ（まえ はんぶん）と うえ
  cyl(sc, ctx, cx, cy, r, z0, z1, side, top, lw = 2) {
    const lo = this.arc(sc, cx, cy, r, z0), hi = this.arc(sc, cx, cy, r, z1);
    ctx.beginPath(); hi.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); for (let k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k].x, lo[k].y);
    ctx.closePath(); ctx.fillStyle = side; ctx.fill(); this.ink(ctx, lw); ctx.stroke();
    this.path(ctx, this.ring(sc, cx, cy, r, z1)); ctx.fillStyle = top; ctx.fill(); this.ink(ctx, lw); ctx.stroke();
  },
  // テーブルと ケーキ・ふうせん（へやの 絵の ならびに いれる）
  floorDraw(sc, ctx) {
    const S = sc.lvParty; if (!S || !S.phase || !S.spot) return;
    const cx = S.spot.x, cy = S.spot.y, T = G.t, g = S.group, s = sc.actorScale, n = Math.max(1, Math.min(10, Math.round(g.lv / this.STEP)));
    ctx.save();
    // かげ
    const sh = this.ring(sc, cx, cy, 36, 0); this.path(ctx, sh); ctx.fillStyle = "rgba(31,29,27,0.13)"; ctx.fill();
    // あし
    const leg = sc.toScreen(cx, cy, 0), top = sc.toScreen(cx, cy, 24);
    ctx.fillStyle = "#C79A63"; ctx.fillRect(leg.x - 3 * s, top.y, 6 * s, leg.y - top.y); this.ink(ctx, 1.6); ctx.strokeRect(leg.x - 3 * s, top.y, 6 * s, leg.y - top.y);
    // テーブルの ぬの（しろ・ピンクの ふち）
    this.cyl(sc, ctx, cx, cy, 34, 14, 24, "#FFFFFF", "#FFF8F2", 2);
    this.line(ctx, this.arc(sc, cx, cy, 34, 16.5), "#F5A3C0", 2.4 * s);
    // おさら 3まい
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 3 + 0.4, d = this.ring(sc, cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, 6.5, 24.2, 14); this.path(ctx, d); ctx.fillStyle = "#FFFFFF"; ctx.fill(); this.ink(ctx, 1.2); ctx.stroke(); }
    // ケーキ（2だん・いちご）
    this.cyl(sc, ctx, cx, cy, 16, 24, 36, "#FFF3E0", "#FFFDF8", 2);
    this.line(ctx, this.arc(sc, cx, cy, 16, 30), "#F5A3C0", 2.2 * s);
    this.cyl(sc, ctx, cx, cy, 10, 36, 44, "#FFF3E0", "#FFFDF8", 1.8);
    // いちご（うえの だんの まわり）
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, p = sc.toScreen(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 37.5); ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * s, 0, Math.PI * 2); ctx.fillStyle = "#E53950"; ctx.fill(); this.ink(ctx, 1); ctx.stroke(); }
    // ろうそく（10 ごとに 1本）と ほのお
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? 0 : (i / n) * Math.PI * 2, r = n === 1 ? 0 : 6, b = sc.toScreen(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 44), h = 9 * s;
      ctx.fillStyle = ["#7FB2E5", "#F5A3C0", "#8FCB82"][i % 3]; ctx.fillRect(b.x - 1.3 * s, b.y - h, 2.6 * s, h); this.ink(ctx, 1); ctx.strokeRect(b.x - 1.3 * s, b.y - h, 2.6 * s, h);
      if (!S.blown) { const f = 1 + 0.15 * Math.sin(T * 12 + i); ctx.beginPath(); ctx.ellipse(b.x, b.y - h - 3.4 * s * f, 1.9 * s, 3.4 * s * f, 0, 0, Math.PI * 2); ctx.fillStyle = "#FFB43E"; ctx.fill(); ctx.strokeStyle = "#E8762A"; ctx.lineWidth = 1; ctx.stroke(); }
      else if (S.ev === "blow" && S.evT < 2.4) { const k = S.evT / 2.4; ctx.globalAlpha = 1 - k; ctx.strokeStyle = "#B9B4AE"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(b.x, b.y - h); ctx.quadraticCurveTo(b.x + 4 * s, b.y - h - 6 * s - k * 8 * s, b.x, b.y - h - 12 * s - k * 12 * s); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    // ふうせん 3つ（テーブルの みぎ おく・うしろの 子と みぎ まえの 子の あいだ。かおに かからない）
    const tie = sc.toScreen(cx + 4, cy - 44, 0);
    this.IDS.forEach((id, i) => {
      const k = i - 1, base = tie, bob = Math.sin(T * 1.6 + i * 1.7) * 3 * s;
      const bx = base.x + (12 + k * 15) * s, by = base.y - (92 + (i % 2) * 12 - Math.abs(k) * 4) * s + bob;
      ctx.strokeStyle = "#8C857C"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.quadraticCurveTo(base.x + (6 + k * 8) * s, (base.y + by) / 2, bx, by + 12 * s); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by, 9.5 * s, 12 * s, k * 0.12, 0, Math.PI * 2); ctx.fillStyle = this.COLOR[id][0]; ctx.fill(); this.ink(ctx, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 2.4 * s, by + 12.5 * s); ctx.lineTo(bx + 2.4 * s, by + 12.5 * s); ctx.lineTo(bx, by + 10 * s); ctx.closePath(); ctx.fillStyle = this.COLOR[id][0]; ctx.fill(); this.ink(ctx, 1.4); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx - 3.4 * s, by - 4.4 * s, 2 * s, 3.6 * s, -0.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fill();
    });
    ctx.restore();
  },
  // かべの ガーランドと たれまく（おくの かべに はる。かべの かぐより まえ）
  wallDraw(sc, ctx) {
    const S = sc.lvParty; if (!S || !S.phase || !S.group) return;
    const W = ROOM.W, H = ROOM.WALL, s = sc.s, x0 = W * 0.08, x1 = W * 0.8, z = H * 0.9; // みぎの ドアの ふだに かからない ように すこし ひだりへ
    ctx.save();
    // かべの めんに あわせる（js/scene-house.js の drawFurn の かべの かぐ と おなじ ななめ）
    const o = sc.toScreen(0, ROOM.WALL, 0); ctx.transform(HomeDesign.A * s, HomeDesign.B * s, 0, s, o.x, o.y);
    // ガーランド（さんかくの はた・3人の いろ）
    const sag = 22, N = 13, at = (u) => ({ x: x0 + (x1 - x0) * u, y: -z + sag * Math.sin(Math.PI * u) });
    ctx.strokeStyle = "#8C857C"; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const p = at(i / 40); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke();
    const cols = ["#7FB2E5", "#F5A3C0", "#8FCB82", "#FFE08A"];
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N; if (Math.abs(u - 0.5) < 0.27) continue; // まんなかは たれまく
      const a = at(u - 0.028), b = at(u + 0.028), m = at(u);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(m.x, m.y + 20); ctx.closePath(); ctx.fillStyle = cols[i % cols.length]; ctx.fill(); this.ink(ctx, 1.6); ctx.stroke();
    }
    // たれまく（まんなか）
    const text = this.banner(S.group), cxm = (x0 + x1) / 2, top = -z + sag - 14;
    ctx.font = "900 24px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const tw = Math.min(W * 0.7, ctx.measureText(text).width + 28), th = 40;
    ctx.beginPath(); ctx.roundRect(cxm - tw / 2, top, tw, th, 6); ctx.fillStyle = "#FFF6E0"; ctx.fill(); this.ink(ctx, 2.2); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cxm - tw / 2 + 3, top + 3, tw - 6, th - 6, 4); ctx.strokeStyle = "#F5A3C0"; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = INK; ctx.fillText(text, cxm, top + th / 2 + 1, tw - 14);
    // ひもで つる
    ctx.strokeStyle = "#8C857C"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cxm - tw / 2 + 8, top); ctx.lineTo(cxm - tw / 2 + 2, top - 10); ctx.moveTo(cxm + tw / 2 - 8, top); ctx.lineTo(cxm + tw / 2 - 2, top - 10); ctx.stroke();
    ctx.restore();
  },

  // ---- PokaDebug・テスト ----
  state(sc) {
    const P = this.save(), S = sc ? this.st(sc) : null;
    return { pend: P.pend.map((x) => ({ ...x })), done: { ...P.done }, log: P.log.map((x) => ({ ...x, who: x.who.slice() })), step: this.STEP, max: Stats.LV_MAX,
      phase: S ? S.phase : null, next: S ? Math.round(S.next * 10) / 10 : null, group: S && S.group ? { lv: S.group.lv, who: S.group.who.slice() } : null, banner: S && S.group ? this.banner(S.group) : null,
      beat: S ? S.beat : -1, beats: S ? S.script.length : 0, ev: S ? S.ev : null, blown: !!(S && S.blown), done2: !!(S && S.done), parties: S ? S.parties : 0, why: S ? S.why : null, via: S ? S.via || null : null,
      spot: S && S.spot ? { ...S.spot } : null, can: sc ? this.can(sc) : false, candles: S && S.group ? Math.max(1, Math.min(10, Math.round(S.group.lv / this.STEP))) : 0,
      log2: sc && sc.life ? sc.life.log.filter((l) => l.party).map((l) => ({ id: l.id, text: l.text, party: l.party })) : [],
      parents: sc ? (sc.parents || []).filter((p) => !p.hidden).map((p) => p.id) : [],
      kids: sc ? sc.chars.map((c) => ({ id: c.id, state: c.state, party: this.partying(c), x: Math.round(c.x), y: Math.round(c.y), dir: c.dir })) : [] };
  },
};

// ---- つなぎ ----
(() => {
  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("enter", async function (orig, ...a) { this.lvParty = null; return orig.apply(this, a); });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); if (!this.guest) HomeLvParty.update(this, dt); return r; });
  // 会の あいだに 3人を タップ: やめない（ひとこと・ハート）
  wrap("up", function (orig, p) {
    if (p && p.tap && HomeLvParty.on(this) && !this.mode && !this.gesture && !this.panDrag?.moved && !(this.fingers && this.fingers.size > 1)) {
      const c = this.chars.filter((k) => !k.hidden).sort((x, y) => this.depth(y) - this.depth(x)).find((k) => this.contains(this.actorRect(k), p));
      if (c && HomeLvParty.partying(c)) {
        this.fingers.delete(p.id); this.panDrag = null;
        this.fx("heart", c); Sound.voice(c.id);
        if (typeof PlayRecords !== "undefined") { try { PlayRecords.add(c.id, "pat"); } catch (e) { /* きろくが なくても なでる */ } }
        HomeLife.say(this, c.id, U.pick(HomeLvParty.LINES.cheer[c.id]), false, "say", { party: "cheer" });
        return;
      }
    }
    return orig.call(this, p);
  });
  // したの ボタンを おすと やめてから その こと（キャプチャで ボタンより さきに）
  wrap("buildUI", function (orig, ...a) {
    const r = orig.apply(this, a);
    if (this.bar) this.bar.addEventListener("click", () => { if (HomeLvParty.on(this)) HomeLvParty.stop(this, "button"); }, true);
    return r;
  });
  const visual = HomeActions.visual;
  HomeActions.visual = function (c) { return HomeLvParty.partying(c) ? HomeLvParty.visual(c) : visual.call(this, c); };
  const props = HomeActions.props;
  HomeActions.props = function (sc, ctx, c, p, s) { return HomeLvParty.partying(c) ? HomeLvParty.props(sc, ctx, c, p, s) : props.call(this, sc, ctx, c, p, s); };
  // テーブル（へやの 絵の ならび）と かべの かざり（かべの かぐの つぎ・ラグの まえ）
  const drawables = HomePlay.drawables;
  HomePlay.drawables = (sc, list, ctx) => {
    drawables(sc, list, ctx);
    const S = sc.lvParty; if (!S || !S.phase || !S.spot) return;
    list.push({ z: -1500, draw: () => HomeLvParty.wallDraw(sc, ctx) });
    list.push({ z: sc.depth(S.spot) + 0.2, draw: () => HomeLvParty.floorDraw(sc, ctx) });
  };
  // レベルが あがったら おいわいの まちに いれる
  const gain = Stats.gainExp;
  Stats.gainExp = function (id, n) { const ups = gain.call(this, id, n); try { HomeLvParty.leveled(id, ups); } catch (e) { /* セーブが ない ときも レベルは あがる */ } return ups; };
  // 会の あいだは ほかの みんなの うごきを おやすみ
  const say = HomeLife.say;
  HomeLife.say = function (sc, id, text, rare, kind, meta) {
    if (HomeLvParty.on(sc) && HomeLvParty.IDS.includes(id) && !(meta && (meta.party || meta.doze || meta.play))) return;
    return say.apply(this, arguments);
  };
  const care = ParentCare.update;
  ParentCare.update = function (sc, dt) { if (HomeLvParty.on(sc)) sc.parentTimer = Math.max(sc.parentTimer || 0, 2); return care.call(this, sc, dt); };
  if (typeof GowagaWish !== "undefined") { const house = GowagaWish.house; GowagaWish.house = function (sc, dt) { if (HomeLvParty.on(sc)) return; return house.call(this, sc, dt); }; }
  if (typeof HomeToilet !== "undefined") { const calm = HomeToilet.calm; HomeToilet.calm = function (sc) { return !HomeLvParty.on(sc) && calm.call(this, sc); }; }
  if (typeof HomeDoze !== "undefined") { const can = HomeDoze.can; HomeDoze.can = function (sc) { return !HomeLvParty.on(sc) && can.call(this, sc); }; }
  { const can = HomePlay.can; HomePlay.can = function (sc) { return !HomeLvParty.on(sc) && can.call(this, sc); }; }
})();
