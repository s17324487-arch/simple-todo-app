// おうちの おひるね（UI-99。オーナーの 依頼 2026-10-06「おうちで、たまに3人寝ていて(2分くらい)、寝言を言っている行動を追加して」）。
// ・じぶんの おうちで ときどき 3人が ねむく なって、いっしょに おひるね（LEN = 120びょう・やく 2ふん）。3人は いつも いっしょ（ひとりだけ ねない）。
//   さいしょは おうちで のんびり して 2ふん半〜5ふん・そのあとは 7〜12ふん ごと（へやが しずかな じかん だけ かぞえる）。
//   ごはんで 3人とも おなか いっぱい（85 いじょう）に なると はやめに（25〜50びょう）ねむく なる。
// ・ねむく なる →「ふわぁ…」→ ベッドの まえ（なければ ラグ・へやの まんなか）に 画面で よこ 一列に あつまって すわったまま うとうと
//   （家具の なかや、あとから 描く 家具の うしろに かおが かくれない ならびを その まわりから えらぶ。cover）
//   （ねがお・ゆらゆら・すうすう・Z の もじ）。ときどき ねごと（くもの ふきだし・ひとり 9つ・ふたりの かけあい 6つ）。ぱぱ ままが いれば「しーっ…」。
//   ゆうがた・よるは ことばの「おひるね」が「うたたね」に なる（nap）。
// ・タップ: おきない（「えへへ… くすぐったい…」・なでなでの きろく）。3かい タップすると おきる。
// ・おきる: 2ふん たつと「ふわぁ〜 よく ねた！」と のび。したの ボタン（ごはん・あそぶ など）を おすと「ん… おはよう…」と おきてから その こと。
//   ドア・かいだん・ねる・もようがえ など ほかの うごきが はじまったら そのまま おきる（ことばは ださない）。
// ・ねて いる あいだは けんか・かけあい・しぐさ・おトイレの もじもじ・おねがい・ぱぱ ままの おせわ を おやすみ（おきたら また）。
//   ねて いる 子の ふだんの ひとこと（ほかの ところから）は ださない（ねごと だけ）。
// ・ねて いる すがたは HomeActions の しぐさ「doze」（c.state "activity"）。もようがえ・ごはん など mode が はじまると HomeActions が とめる ので おきる。
// ・セーブしない（シーンの なか だけ・SCHEMA は 2 の まま）。おじゃま（js/online-visit.js の VisitScene）では ねない（つつむ まえの おうちの うごき）。
// HouseScene（enter・update・up・buildUI）・HomeActions（visual・props）・HomeLife（update・say）・ParentCare.update・GowagaWish.house・HomeToilet.calm・Care.feed を 外から つつむ。
const HomeDoze = {
  IDS: ["wanko", "gachan", "goji"],
  LEN: 120, // ねて いる じかん（びょう）
  FIRST: [150, 300], AGAIN: [420, 720], RETRY: 25, FULL: [25, 50], // つぎに ねむく なるまで（びょう）
  GATHER: 10, // あつまる じかんの げんかい（こえたら その ばで ねる）
  GAP: 42, // ねる ときの 3人の あいだ（ななめ上から 見て 画面で よこに やく 74 ずつ・かおも タップも かさならない）
  TALK: [9, 15], POKES: 3, HUNGRY: 85, CLEAR: 130, // CLEAR: ねる ばしょから この なかの ぱぱ ままは よける
  LINES: {
    start: { wanko: "ふわぁ… なんだか ねむく なってきた…", gachan: "ふぁ… ちょっとだけ おひるね しよっか…", goji: "ガゥ… まぶたが おもい…" },
    full: { wanko: "おなか いっぱいで… ねむく なっちゃった…", gachan: "おなか ぽんぽん… ねむいね…", goji: "はらぱん… ガゥ… ねむい…" },
    agree: { wanko: "ぼくも… むにゃ…", gachan: "わたしも… ふぁぁ…", goji: "ガゥ… みんなで ねよう…" },
    talk: {
      wanko: ["むにゃ… ボール まてまて〜…", "えへへ… ほねっこ いっぱい…", "むにゃむにゃ… もう たべられないよ…", "クゥン… みんな だいすき…", "…すぅ… すぅ…",
        "ワン… ぼくが いちばん はやい…", "むにゃ… おさんぽ いこうね…", "えへへ… しっぽ ふりふり…", "むにゃ… ごじ、それ ぼくの おやつ…"],
      gachan: ["ぴよ… おはな きれい…", "むにゃ… もう ちょっとだけ…", "ぴよぴよ… ケーキ おおきい…", "うふふ… かわいい リボン…", "…すや すや…",
        "むにゃ… わんこ、まってぇ…", "ぴよ… おそらを とんでる…", "むにゃ… いちごの おふとん…", "ぴよ… まま… だいすき…"],
      goji: ["ガゥ… むにゃ… おにく…", "グゥ… グゥ…", "ガゥー… おつきさま たべちゃうぞ…", "むにゃ… ぼく おっきく なるもん…", "…ぐぅ… すぴー…",
        "ガゥ… がちゃん、いっしょに あそぼ…", "むにゃ… ビルより おっきく… ガゥ…", "ガゥ… しっぽで ジャンプ…", "むにゃ… おやつ はんぶんこ…"],
    },
    // ふたりの ねごと（ゆめが つながる）
    pair: [
      [["wanko", "むにゃ… ボール なげて〜…"], ["goji", "ガゥ… むにゃ… いくぞ〜…"]],
      [["gachan", "ぴよ… ケーキ やけたよ…"], ["wanko", "むにゃ… いただきまーす…"]],
      [["goji", "ガゥ… おっきく なったぞ〜…"], ["gachan", "むにゃ… すごーい…"]],
      [["wanko", "むにゃ… みんなで おでかけ…"], ["gachan", "ぴよ… たのしみ…"]],
      [["gachan", "むにゃ… おほしさま きれい…"], ["goji", "ガゥ… ひとつ ほしい…"]],
      [["goji", "むにゃ… おなか すいた…"], ["wanko", "ぼくも… むにゃ…"]],
    ],
    poke: {
      wanko: ["えへへ… くすぐったい…", "むにゃ… なでなで すき…", "クゥン… もっと…"],
      gachan: ["むにゃ… くすぐったいよぉ…", "ぴよ… えへへ…", "むにゃ… あったかい…"],
      goji: ["ガゥ… むにゃ…", "ガゥ… もっと なでて…", "むにゃ… えへへ… ガゥ…"],
    },
    wake: { wanko: "ふわぁ〜 よく ねた！", gachan: "ぴよ… いい ゆめ みちゃった♪", goji: "ガゥー！ げんき いっぱい！" },
    woken: { wanko: "ん… おはよう…", gachan: "ふぁ… おきたよ…", goji: "ガゥ… まだ ねむい…" },
    parent: { papa: "しーっ… 3にんとも ねちゃったね", mama: "あらあら、なかよく おひるね ね♪" },
  },

  // ゆうがた・よる（U.dayPart が evening・night・late）は「おひるね」ではなく「うたたね」
  nap(text) { return ["evening", "night", "late"].includes(U.dayPart()) ? text.replace(/おひるね/g, "うたたね") : text; },

  // ---- シーンごとの ようす（セーブしない）----
  st(sc) { return sc.doze || (sc.doze = { phase: null, t: 0, g: 0, next: U.rand(...this.FIRST), talk: 0, talks: 0, pokes: 0, wakes: 0, last: null, spot: null, full: false, used: {} }); },
  on(sc) { return !!(sc && sc.doze && sc.doze.phase); },
  asleep(sc) { return !!(sc && sc.doze && sc.doze.phase === "sleep"); },
  dozing(c) { return !!(c && c.activity && c.activity.id === "doze"); },
  // ねむく なれる とき（へやが しずか・3人とも そろって いる）
  can(sc) {
    if (!sc || sc.guest || sc.mode || UI.busy || Game.trans || document.hidden || sc.doorWalk || sc.climb) return false;
    if (sc.life && (sc.life.quarrel || sc.life.queue.length)) return false;
    if (sc.wc && sc.wc.who) return false;
    const h = sc.wishFx;
    if (h && (h.busy || h.amae > 0)) return false;
    if (sc.work && !["home", "away"].includes(sc.work.phase)) return false;
    return sc.chars.length === this.IDS.length && sc.chars.every((c) => !c.hidden && !c.wc && ["idle", "walk"].includes(c.state));
  },
  items(sc) { return (sc.guest && sc.guest.room ? sc.guest.room : Save.d.room).items || []; },
  // ねる ならび: 画面で よこ 一列（へやの (x, y) に (+GAP, −GAP) ずつ。描く じゅんの x + y が 3人とも おなじ）
  row(c) { return this.IDS.map((id, i) => ({ x: Math.round(c.x + (i - 1) * this.GAP), y: Math.round(c.y - (i - 1) * this.GAP) })); },
  // ならびの わるさ: へやの そと・家具の なか（1人 100）と、あとから 描く 家具に かおが かくれる（1人 1）。
  // へやは ななめ上から 見る ので、描く じゅんは x + y（HouseScene.depth）。家具は 足もとの まえの まんなか（anchor）の じゅんで 描く
  cover(sc, pts) {
    const P = (x, y) => HomeDesign.project(x, y - ROOM.WALL), floor = this.items(sc).filter((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].kind === "floor");
    let bad = 0;
    for (const p of pts) {
      if (p.x < 40 || p.x > ROOM.W - 40 || p.y < ROOM.WALL + 60 || p.y > ROOM.H - 20 || (typeof HomeNav !== "undefined" && HomeNav.blockedAt(sc, p.x, p.y, HomeNav.PAD))) { bad += 100; continue; }
      const q = P(p.x, p.y), face = { x0: q.x - 26, x1: q.x + 26, y0: q.y - 100, y1: q.y - 50 }; // ねて いる ときの あたまの まわり（足もとから）
      if (floor.some((it) => {
        const a = sc.anchor(it); if (a.x + a.y <= p.x + p.y) return false; // さきに 描く 家具の うえには 3人が 描かれる
        const m = HomeDesign.model(it.id, it), o = P(a.x, a.y);
        return Math.min(face.x1, o.x + m.x + m.w) - Math.max(face.x0, o.x + m.x) > 8 && Math.min(face.y1, o.y + m.y + m.h) - Math.max(face.y0, o.y + m.y) > 8;
      })) bad++;
    }
    return bad;
  },
  // あつまる ばしょ: ベッドの まえ → ラグの うえ → へやの まんなか。その まわりで 3人が 家具の なかに いない・かおが 家具に かくれない ならびを さがす
  spot(sc) {
    const items = this.items(sc), bed = typeof Room !== "undefined" && Room.bestBed ? Room.bestBed() : null, rug = items.find((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].kind === "rug"), prefs = [];
    if (bed) { const a = sc.anchor(bed); prefs.push({ x: a.x, y: a.y + 30, dy: [0, 120], by: "bed", id: bed.id }); }
    if (rug) { const a = sc.anchor(rug), m = HomeDesign.model(rug.id, rug); prefs.push({ x: a.x, y: a.y - m.footD / 2 + 10, dy: [-40, 80], by: "rug", id: rug.id }); }
    prefs.push({ x: ROOM.W / 2, y: ROOM.WALL + (ROOM.H - ROOM.WALL) * 0.62, dy: [-80, 80], by: "room", id: null });
    let best = null;
    for (const [k, pr] of prefs.entries()) {
      for (let dy = pr.dy[0]; dy <= pr.dy[1]; dy += 20) for (let dx = -120; dx <= 120; dx += 20) {
        const c = { x: pr.x + dx, y: pr.y + dy }, bad = this.cover(sc, this.row(c)), score = bad * 1000 + k * 400 + Math.hypot(dx, dy);
        if (!best || score < best.score) best = { score, bad, c, pr };
      }
      if (best.bad === 0) break; // この ばしょの まわりで よい ならびが あった
    }
    return { x: Math.round(best.c.x), y: Math.round(best.c.y), by: best.pr.by, id: best.pr.id, bad: best.bad };
  },
  // ねむく なる → あつまる
  start(sc) {
    if (this.on(sc) || !this.can(sc)) return false;
    const D = this.st(sc), s = this.spot(sc);
    Object.assign(D, { phase: "gather", t: 0, g: 0, talk: 0, pokes: 0, spot: { x: s.x, y: s.y, by: s.by, id: s.id, bad: s.bad } });
    // ぱぱ・ままは おせわを やめて、ねる ばしょの まえに いたら すこし よける（3人が かくれない ように）
    (sc.parents || []).forEach((p, i) => {
      p.queue = []; if (p.target) { p.target = null; p.state = "idle"; p.time = 3; }
      if (p.hidden || Math.hypot(p.x - s.x, p.y - s.y) >= this.CLEAR) return;
      let x = U.clamp(s.x + (s.x < ROOM.W / 2 ? 1 : -1) * U.rand(150, 190), 50, ROOM.W - 50), y = U.clamp(s.y + 40 + i * 44, ROOM.WALL + 70, ROOM.H - 30);
      if (typeof HomeNav !== "undefined") { const q = HomeNav.near(sc, x, y); x = q.x; y = q.y; }
      Object.assign(p, { state: "walk", tx: x, ty: y, _nav: null });
    });
    const row = this.row(s);
    sc.chars.forEach((c, i) => {
      HomeActions.cancel(c);
      let x = U.clamp(row[i].x, 40, ROOM.W - 40), y = U.clamp(row[i].y, ROOM.WALL + 60, ROOM.H - 20);
      if (typeof HomeNav !== "undefined") { const q = HomeNav.near(sc, x, y); x = q.x; y = q.y; }
      Object.assign(c, { state: "walk", tx: x, ty: y, emo: null, jumpT: -1, _nav: null });
    });
    const first = U.pick(sc.chars).id, lines = D.full ? this.LINES.full : this.LINES.start;
    HomeLife.converse(sc, [{ who: first, text: this.nap(lines[first]), meta: { doze: "start" } },
      ...this.IDS.filter((id) => id !== first).map((id) => ({ who: id, text: this.LINES.agree[id], kind: "whisper", meta: { doze: "start" } }))]);
    D.full = false;
    return true;
  },
  // その ばで すわって ねむる
  lie(sc, c) {
    HomeActions.cancel(c);
    Object.assign(c, { state: "activity", dir: "down", emo: null, jumpT: -1, tx: c.x, ty: c.y, _nav: null });
    c.activity = { id: "doze", stage: "act", elapsed: 0, duration: 1e9, travel: 0, k: this.IDS.indexOf(c.id) };
  },
  // ぱぱ・ままが いれば「しーっ」
  hush(sc) {
    const ps = (sc.parents || []).filter((p) => !p.hidden);
    if (!ps.length) return;
    const p = U.pick(ps);
    HomeLife.say(sc, p.id, this.nap(this.LINES.parent[p.id]), false, "whisper", { doze: "hush" });
  },
  // ねごと（ひとり か ふたり）
  mumble(sc) {
    const D = this.st(sc), kids = sc.chars.filter((c) => this.dozing(c) && !c.hidden);
    if (!kids.length) return;
    D.talks++;
    if (Math.random() < 0.25) {
      const pair = U.pick(this.LINES.pair);
      HomeLife.converse(sc, pair.map(([who, text]) => ({ who, text, kind: "think", meta: { doze: "talk" } })));
      return;
    }
    const last = D.lastWho, c = U.pick(kids.length > 1 ? kids.filter((k) => k.id !== last) : kids), pool = this.LINES.talk[c.id];
    const used = (D.used[c.id] = D.used[c.id] || []), left = pool.filter((t) => !used.includes(t)), text = U.pick(left.length ? left : pool);
    used.push(text); if (used.length > pool.length - 2) used.shift();
    D.lastWho = c.id;
    HomeLife.say(sc, c.id, text, false, "think", { doze: "talk" });
  },
  // ねて いる 子を タップ（おきない。3かいで おきる）
  poke(sc, c) {
    const D = this.st(sc);
    if (!this.asleep(sc) || !this.dozing(c)) return false;
    D.pokes++;
    if (typeof PlayRecords !== "undefined") { try { PlayRecords.add(c.id, "pat"); } catch (e) { /* きろくが なくても なでる */ } }
    sc.fx("heart", c);
    Sound.se("tap");
    if (D.pokes >= this.POKES) { this.wake(sc, "poke"); return true; }
    HomeLife.say(sc, c.id, U.pick(this.LINES.poke[c.id]), false, "think", { doze: "poke" });
    return true;
  },
  // おきる（why: time 2ふん たった・button したの ボタン・poke 3かい タップ・stir ほかの うごき）
  wake(sc, why) {
    const D = this.st(sc), was = D.phase;
    if (!was) return false;
    Object.assign(D, { phase: null, t: 0, g: 0, next: U.rand(...this.AGAIN), last: why });
    D.wakes++;
    const slept = sc.chars.filter((c) => this.dozing(c));
    for (const c of slept) { HomeActions.cancel(c); c.state = "idle"; c.t = U.rand(1.5, 3); }
    if (sc.life) sc.life.next = Math.max(sc.life.next, 8);
    if (why === "stir" || was === "gather" || !slept.length) return true; // ほかの うごきに まかせる
    if (why === "time") {
      HomeLife.converse(sc, this.IDS.map((id) => ({ who: id, text: this.LINES.wake[id], meta: { doze: "wake" } })));
      for (const c of slept) if (!HomeActions.start(sc, c, "stretch")) sc.react(c, "happy", "note"); // のびーっ
      return true;
    }
    const c = U.pick(slept);
    HomeLife.say(sc, c.id, this.LINES.woken[c.id], false, "say", { doze: "woken" });
    return true;
  },
  // ごはんの あと（Care.feed）: 3人とも おなか いっぱいなら はやめに ねむく なる
  ate(sc) {
    if (!sc || this.on(sc) || !Save.d) return false;
    const D = this.st(sc);
    if (!this.IDS.every((id) => Save.d.chars[id] && Save.d.chars[id].hunger >= this.HUNGRY)) return false;
    if (D.next > this.FULL[1]) { D.next = U.rand(...this.FULL); D.full = true; }
    return true;
  },
  update(sc, dt) {
    const D = this.st(sc);
    if (document.hidden || UI.busy) return;
    if (!D.phase) {
      // つぎに ねむく なるまで（へやが しずかな じかん だけ。とめて すすめる テスト〔PokaDebug.homeAdvance〕の あいだは かぞえない）
      if (!Game.paused && this.can(sc) && (D.next -= dt) <= 0 && !this.start(sc)) D.next = this.RETRY;
      return;
    }
    // ねむって いる あいだは ほかの できごとを まつ
    if (sc.life) sc.life.next = Math.max(sc.life.next, 4);
    if (sc.actions) sc.actions.next = Math.max(sc.actions.next, 3);
    if (sc.mode || Game.trans || sc.doorWalk || sc.climb) { this.wake(sc, "stir"); return; }
    if (D.phase === "gather") {
      D.g += dt;
      for (const c of sc.chars) if (!c.hidden && !this.dozing(c) && (c.state === "idle" || D.g >= this.GATHER)) this.lie(sc, c);
      if (sc.chars.every((c) => this.dozing(c))) { D.phase = "sleep"; D.t = 0; D.talk = U.rand(4, 7); this.hush(sc); }
      return;
    }
    if (sc.chars.some((c) => c.hidden || !this.dozing(c))) { this.wake(sc, "stir"); return; }
    D.t += dt;
    if (D.t >= this.LEN) { this.wake(sc, "time"); return; }
    if ((D.talk -= dt) <= 0 && !(sc.life && sc.life.queue.length)) { this.mumble(sc); D.talk = U.rand(...this.TALK); }
  },
  // ねがお（HomeActions.visual の かわり）: すわって うとうと・すうすう
  visual(c, a) {
    const t = a.elapsed + (a.k || 0) * 1.3, b = Math.sin(t * 1.7);
    return { pose: "land_01", face: "sleep", dir: "down", x: 0, y: 0, angle: 0.07 * Math.sin(t * 0.9), sx: 1 + 0.015 * b, sy: 0.86 + 0.02 * b, alpha: 1 };
  },
  // Z の もじ（HomeActions.props の かわり）
  props(sc, ctx, c, p, s) { sc.zzz(ctx, p.x + 18 * s, p.y - 74 * s); },
};

// ---- つなぎ ----
(() => {
  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("enter", async function (orig, ...a) { this.doze = null; return orig.apply(this, a); });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); HomeDoze.update(this, dt); return r; });
  // ねて いる 子を タップ: なでても おきない（ほかの タップは いつもどおり）
  wrap("up", function (orig, p) {
    if (p && p.tap && HomeDoze.asleep(this) && !this.mode && !this.gesture && !this.panDrag?.moved && !(this.fingers && this.fingers.size > 1)) {
      const c = this.chars.filter((k) => !k.hidden).sort((x, y) => this.depth(y) - this.depth(x)).find((k) => this.contains(this.actorRect(k), p));
      if (c && HomeDoze.poke(this, c)) { this.fingers.delete(p.id); this.panDrag = null; return; }
    }
    return orig.call(this, p);
  });
  // したの ボタンを おすと おきてから その こと（キャプチャで ボタンより さきに）
  wrap("buildUI", function (orig, ...a) {
    const r = orig.apply(this, a);
    if (this.bar) this.bar.addEventListener("click", () => { if (HomeDoze.on(this)) HomeDoze.wake(this, "button"); }, true);
    return r;
  });

  const visual = HomeActions.visual;
  HomeActions.visual = function (c) { return HomeDoze.dozing(c) ? HomeDoze.visual(c, c.activity) : visual.call(this, c); };
  const props = HomeActions.props;
  HomeActions.props = function (sc, ctx, c, p, s) { return HomeDoze.dozing(c) ? HomeDoze.props(sc, ctx, c, p, s) : props.call(this, sc, ctx, c, p, s); };

  // ねて いる 子は ねごと だけ（ほかの ところからの ひとことは ださない）
  const say = HomeLife.say;
  HomeLife.say = function (sc, id, text, rare, kind, meta) {
    if (HomeDoze.asleep(sc) && HomeDoze.IDS.includes(id) && !(meta && meta.doze)) return;
    return say.apply(this, arguments);
  };
  // ねて いる あいだは ぱぱ ままの おせわ・おねがい・おトイレの もじもじ を おやすみ
  const care = ParentCare.update;
  ParentCare.update = function (sc, dt) { if (HomeDoze.on(sc)) sc.parentTimer = Math.max(sc.parentTimer || 0, 2); return care.call(this, sc, dt); };
  if (typeof GowagaWish !== "undefined") { const house = GowagaWish.house; GowagaWish.house = function (sc, dt) { if (HomeDoze.on(sc)) return; return house.call(this, sc, dt); }; }
  if (typeof HomeToilet !== "undefined") { const calm = HomeToilet.calm; HomeToilet.calm = function (sc) { return !HomeDoze.on(sc) && calm.call(this, sc); }; }
  // ごはんで おなか いっぱい → はやめに ねむく なる
  const feed = Care.feed;
  Care.feed = function (...a) { const r = feed.apply(this, a); if (r && G.sceneName === "house" && G.scene) HomeDoze.ate(G.scene); return r; };
})();
