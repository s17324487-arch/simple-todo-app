// ぱぱ・ままの おしごと（ROADMAP M9 の ART-04）。ほんとうの 時こくで 9:00〜18:00 は おしごとで 家に いない。
// そのあいだ 3人は おるすばん（ひとりごと・かけあい・しぐさ）。9:00 に「いってきます」、18:00 に「ただいま」。
// ParentCare の init・update・draw・open・request と HomeLife.playTalk を 外から つつむ（parent-care.js と scene-house.js は かえない）。
// 時こくは U.hourNow()（PokaDebug.hour に あわせる）。セーブは flags に その日の 日づけを 2つ 足すだけ。
const ParentWork = {
  START: 9, END: 18,
  away(h = U.hourNow()) { return h >= this.START && h < this.END; },
  today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; },
  // かえって くるまでの 分（ほんとうの 分を つかう）
  minutesLeft() { const h = U.hourNow(), m = new Date().getMinutes(); return this.away(h) ? (this.END - h) * 60 - m : 0; },
  DOOR: { x: 34, y: 300 }, // 左の かべの 「おでかけ」の ドアの まえ

  // ---- 3人の おるすばんの ことば（1人ずつ・せいかくで かえる）----
  ALONE: {
    wanko: [
      ["ぱぱ まま、はやく かえって こないかな〜", "dots"], ["おるすばん たいちょうの わんこ だよ！", "note"], ["ドアの おと…？ まだ かな", "dots", "door"],
      ["かえって きたら いっぱい しっぽ ふるんだ", "heart"], ["わん！ おうちは ぼくが まもるよ", "anger", "door"], ["ままの におい… くんくん", "heart"],
      ["いいこに して たら、ほめて もらえるかな", "note"], ["ボールあそび、ぱぱと したいな〜", "dots", "window"], ["おるすばんって、じかんが ながいね", "sweat"],
    ],
    gachan: [
      ["ぴよ… ちょっと さみしいね", "sweat"], ["おかえりの じゅんび しよっ♪", "note"], ["ままの まねっこ。「いいこね〜」", "heart"],
      ["おへや、きれいに しとこうね", "note"], ["ぱぱに おてがみ かこうかな", "heart"], ["まどの そとに ぱぱ いないかな…", "dots", "window"],
      ["ぴよぴよ、おうたで げんき だそう♪", "note"], ["おるすばん、ちゃんと できてるよね？", "dots"], ["おやつ、みんなで わけっこ しよ", "heart"],
    ],
    goji: [
      ["ガオー！ ぼくが おうちを まもる！", "anger", "door"], ["ぱぱと ままは おしごと がんばってる", "note"], ["おなか すいた… ままの カレー…", "sweat"],
      ["ねむく なって きた… ふぁ〜", "dots"], ["かえって きたら ぎゅーって して もらう", "heart"], ["ガォ… おるすばんって けっこう たいへん", "sweat"],
      ["ぼく、おにいさんに なった きぶん", "note"], ["ドアの まえで まって いよう", "dots", "door"],
    ],
  },
  // かけあい（だれが・ことば・しぐさ・うごき。all は 3人で）
  TALKS: [
    [["wanko", "ぱぱと ままに なにか プレゼント しようよ！", "note"], ["gachan", "おてがみ かこう！", "heart"], ["goji", "ガオー！ さんせい！", "note"]],
    [["gachan", "ドアの ほう、ちょっと みて くるね", "dots", "door"], ["gachan", "…まだ だった", "sweat"], ["wanko", "18じに なったら かえって くるよ", "heart"]],
    [["goji", "みんなで まどから そと みよう", "note", "window"], ["wanko", "あっ、ことりが いる！", "note", "window"], ["gachan", "ぱぱと ままも みてるかな", "heart", "window"]],
    [["wanko", "おるすばん、3にんなら へっちゃら！", "heart", "hug"], ["gachan", "ぴよ♪ なかよしだね", "heart"], ["goji", "ガォ♪ ぎゅー", "heart"]],
    [["goji", "ぼく、みはりばん！", "anger", "door"], ["wanko", "たのもしい〜！", "note"], ["gachan", "わたしは おへやの ばんね♪", "note"]],
    [["wanko", "とけいの はり、なかなか すすまないね…", "dots"], ["goji", "じっと みてると おそく かんじるんだって", "dots"], ["gachan", "あそんで いれば すぐだよ♪", "note"]],
    [["goji", "ふぁ〜… ちょっと おひるね…", "dots"], ["gachan", "しーっ。ごじ ねむそう", "dots"], ["wanko", "ぼくが おこして あげるね", "note"]],
    [["gachan", "かえって きたら なにを はなそうか？", "note"], ["wanko", "きょうの ぼうけんの こと！", "note"], ["goji", "おやつを たべた こと〜", "heart"]],
  ],
  // じかんで かわる ひとこと
  timely(h, m) {
    if (h === 17 && m >= 30) return [["wanko", "もうすぐ かえって くるね！", "note", "door"], ["gachan", "おかえりの じゅんび しよ♪", "heart"]];
    if (h === 12) return [["goji", "おひるの じかん。ぱぱと ままも たべてるかな", "note"]];
    if (h === 15) return [["gachan", "3じの おやつ… ぱぱ ままの ぶんも とっておこ", "heart"]];
    return null;
  },
  BYE: [["papa", "いってきます！ おるすばん よろしくね"], ["mama", "おやつは たなの うえよ。18じに かえるね♪"], ["all", "いってらっしゃーい！"]],
  HELLO: [["papa", "ただいま〜！"], ["mama", "いいこで おるすばん して いたね♪"], ["all", "おかえりなさーい！"]],

  // ---- シーン ----
  enter(sc) {
    const a = this.away(), f = Save.d.flags, day = this.today();
    sc.work = { away: a, phase: a ? "away" : "home", t: 0, next: U.rand(18, 26), queue: [], turn: 0, fade: 1, clock: U.hourNow };
    for (const p of sc.parents) p.hidden = a;
    if (a && f.workDay !== day) { f.workDay = day; Save.mark(); this.later(sc, 1.6, () => this.say(sc, "wanko", "ぱぱと ままは おしごとに いったよ。18じに かえって くるって！", "note")); }
    // その日 おしごとの あいだに 見ていて、18じから 21じに はじめて 入ったら「ただいま」
    else if (!a && U.hourNow() >= this.END && U.hourNow() < 21 && f.workDay === day && f.homeDay !== day) this.arrive(sc);
    this.label(sc);
  },
  label(sc) { if (sc.parentButton) sc.parentButton.innerHTML = sc.work?.away ? "おしごと ちゅう" : "ぱぱ・まま"; },
  later(sc, t, fn) { sc.work.queue.push({ at: sc.work.t + t, fn }); },
  kid(sc, id) { return sc.chars.find((c) => c.id === id && !c.hidden); },
  say(sc, id, text, fx) {
    const ids = id === "all" ? sc.chars.filter((c) => !c.hidden).map((c) => c.id) : [id];
    for (const [i, cid] of ids.entries()) {
      const c = this.kid(sc, cid);
      if (!c) continue;
      // しぐさ中（HomeActions）・とめて ある 子は とばさない（react は しぐさを とりけす）。しるしだけ 出す
      const busy = !!c.activity || c.t > 100 || !["idle", "walk"].includes(c.state);
      if (fx) { if (!busy && (fx === "heart" || fx === "note")) sc.react(c, fx === "heart" ? "love" : "happy", fx); else { sc.fx(fx, c); if (!busy) c.emo = fx === "sweat" ? "sad" : fx === "anger" ? "angry" : null; } }
      if (i === 0) HomeLife.say(sc, cid, text);
    }
    if (id === "papa" || id === "mama") HomeLife.say(sc, id, text);
  },
  // しぐさ: ドアや まどの まえへ いく・3人で あつまる
  move(sc, id, where) {
    const c = this.kid(sc, id);
    if (!c || c.activity || c.t > 100 || !["idle", "walk"].includes(c.state)) return; // その場に とめて いる とき（テストの 固定）は うごかさない
    HomeActions.cancel(c);
    const win = Save.d.room.items.find((it) => it.id === "window");
    const spot = where === "door" ? { x: this.DOOR.x + 18, y: this.DOOR.y + 8 + (["wanko", "gachan", "goji"].indexOf(id) - 1) * 16 }
      : where === "window" ? { x: U.clamp((win && !win.wallSide ? win.x : 190) + (["wanko", "gachan", "goji"].indexOf(id) - 1) * 34, 50, ROOM.W - 50), y: ROOM.WALL + 64 }
      : { x: ROOM.W / 2 + (["wanko", "gachan", "goji"].indexOf(id) - 1) * 30, y: ROOM.WALL + 190 };
    c.state = "walk"; c.tx = spot.x; c.ty = spot.y;
  },
  play(sc, lines) {
    lines.forEach(([id, text, fx, where], i) => {
      if (where === "hug") for (const k of ["wanko", "gachan", "goji"]) this.move(sc, k, "hug");
      else if (where) this.move(sc, id, where);
      this.later(sc, i * 2.6 + (where && where !== "hug" ? 1.4 : 0.2), () => this.say(sc, id, text, fx));
    });
  },
  // おるすばんの できごと（1人の ひとこと・かけあい・じかんの ひとこと）
  event(sc, pick = null) {
    const w = sc.work, h = U.hourNow(), m = new Date().getMinutes();
    const t = this.timely(h, m);
    if (pick == null && t && w.timelyAt !== h) { w.timelyAt = h; this.play(sc, t); return "timely"; }
    const n = w.turn++;
    if (pick === "talk" || (pick == null && n % 3 === 2)) { this.play(sc, this.TALKS[Math.floor(Math.random() * this.TALKS.length)]); return "talk"; }
    const kids = sc.chars.filter((c) => !c.hidden && c.state !== "sleep"), c = kids[Math.floor(Math.random() * kids.length)];
    if (!c) return null;
    const [text, fx, where] = this.ALONE[c.id][Math.floor(Math.random() * this.ALONE[c.id].length)];
    this.play(sc, [[c.id, text, fx, where]]);
    return "alone";
  },
  leave(sc) {
    const w = sc.work;
    w.phase = "leaving"; w.t0 = w.t;
    for (const p of sc.parents) { p.hidden = false; p.target = null; p.queue = []; p.state = "walk"; p.tx = this.DOOR.x + (p.id === "papa" ? 0 : 16); p.ty = this.DOOR.y + (p.id === "papa" ? -6 : 10); }
    this.later(sc, 0.3, () => HomeLife.say(sc, "papa", this.BYE[0][1]));
    this.later(sc, 2.4, () => HomeLife.say(sc, "mama", this.BYE[1][1]));
    this.later(sc, 3.6, () => this.say(sc, "all", this.BYE[2][1], "heart"));
    this.label(sc);
  },
  arrive(sc) {
    const w = sc.work;
    w.phase = "arriving"; w.t0 = w.t; w.fade = 0;
    Save.d.flags.homeDay = this.today(); Save.mark();
    sc.parents.forEach((p, i) => { p.hidden = false; p.target = null; p.queue = []; p.x = this.DOOR.x + i * 16; p.y = this.DOOR.y + i * 14; p.state = "walk"; p.tx = 130 + i * 70; p.ty = ROOM.WALL + 170 + i * 10; });
    Sound.se("door");
    this.later(sc, 0.4, () => HomeLife.say(sc, "papa", this.HELLO[0][1]));
    this.later(sc, 1.8, () => { for (const k of ["wanko", "gachan", "goji"]) { const c = this.kid(sc, k); if (c && c.t <= 100) { HomeActions.cancel(c); c.state = "walk"; c.tx = 140 + ["wanko", "gachan", "goji"].indexOf(k) * 34; c.ty = ROOM.WALL + 220; } } this.say(sc, "all", this.HELLO[2][1], "heart"); });
    this.later(sc, 3.8, () => { HomeLife.say(sc, "mama", this.HELLO[1][1]); for (const id of Save.d.order) Save.care(id, { mood: 3, bond: 1 }); sc.updateCare(); });
    this.label(sc);
  },
  snap(sc, a) {
    const w = sc.work;
    w.phase = a ? "away" : "home"; w.fade = 1; w.queue = [];
    for (const p of sc.parents) { p.hidden = a; if (!a) { p.state = "idle"; p.time = 3; } }
    if (!a) sc.parentTimer = Math.min(sc.parentTimer ?? 6, 6);
    this.label(sc);
  },
  // ParentCare.update の かわり。true を かえすと いつもの ぱぱ・ままの うごきを しない
  update(sc, dt) {
    if (!sc.work) this.enter(sc);
    const w = sc.work;
    w.t += dt;
    for (const q of w.queue.filter((q) => q.at <= w.t)) q.fn();
    w.queue = w.queue.filter((q) => q.at > w.t);
    if (!w.labeled) { w.labeled = true; this.label(sc); }
    const a = this.away(), jump = w.clock !== U.hourNow; w.clock = U.hourNow;
    // PokaDebug.hour で 時こくを とばした ときは 「いってきます／ただいま」を しないで すぐ かえる
    if (a !== w.away) { w.away = a; if (jump) this.snap(sc, a); else if (a) this.leave(sc); else this.arrive(sc); }
    if (w.phase === "home") return false;
    const walk = () => { for (const p of sc.parents) { p.anim += dt; const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), step = Math.min(d, 90 * dt); if (d > 1) { p.x += (dx / d) * step; p.y += (dy / d) * step; p.state = "walk"; } else p.state = "idle"; } };
    // ドアを 出るまで・入って くる あいだは 2人とも 見せる（ほかの しくみが さきに かくしても）
    if (w.phase === "leaving") {
      for (const p of sc.parents) p.hidden = false;
      walk();
      const k = w.t - w.t0;
      if (k > 4.4) { w.fade = Math.max(0, 1 - (k - 4.4) / 0.8); if (w.fade <= 0) { w.phase = "away"; for (const p of sc.parents) p.hidden = true; Sound.se("door"); w.next = 12; } }
      return true;
    }
    if (w.phase === "arriving") {
      for (const p of sc.parents) p.hidden = false;
      walk(); w.fade = Math.min(1, w.fade + dt * 1.6);
      if (w.t - w.t0 > 5.2) { w.phase = "home"; w.fade = 1; for (const p of sc.parents) { p.state = "idle"; p.time = 3; } sc.parentTimer = 6; }
      return true;
    }
    // おるすばん ちゅう
    for (const p of sc.parents) p.hidden = true;
    if (!document.hidden && !UI.busy && !sc.mode && !sc.life.quarrel && !sc.life.queue.length && !sc.chars.some((c) => c.activity) && (w.next -= dt) <= 0) { this.event(sc); w.next = U.rand(24, 38); }
    return true;
  },
  // 「ぱぱ・まま」の ボタン（おしごと ちゅう）
  openAway(sc) {
    const left = this.minutesLeft(), hh = Math.floor(left / 60), mm = left % 60;
    const body = U.el("div", { class: "parent-away" });
    const pics = U.el("div", { class: "parent-preview", html: `<div style="display:flex;justify-content:center;gap:6px">${["papa", "mama"].map((id) => `<div style="width:42%">${ParentCare.svg(id, { ...ParentCare.look(id), outfit: "suit" }, "wave")}</div>`).join("")}</div>` });
    body.append(pics, U.el("p", { text: `ぱぱと ままは おしごとに いって いるよ。${this.END}じに かえって くるよ。` }), U.el("p", { class: "note", text: `あと ${hh ? hh + "じかん " : ""}${mm}ふん。3にんで なかよく おるすばん しようね。` }));
    const m = UI.modal({ title: "おしごと ちゅう", body, cls: "full" });
    body.append(UI.btn("きがえ・みため",()=>ParentWardrobe.open("papa"),"wide"));
    body.append(UI.btn("わかった！", () => m.close(), "wide yellow"));
    return m;
  },
};

(() => {
  const base = { init: ParentCare.init, update: ParentCare.update, draw: ParentCare.draw, open: ParentCare.open, request: ParentCare.request };
  ParentCare.init = function (sc) { base.init.call(this, sc); ParentWork.enter(sc); };
  ParentCare.update = function (sc, dt) { if (!document.hidden && ParentWork.update(sc, dt)) return; return base.update.call(this, sc, dt); };
  ParentCare.draw = function (sc, ctx, p) {
    if (p.hidden) return;
    const f = sc.work ? sc.work.fade : 1;
    if (f >= 1) return base.draw.call(this, sc, ctx, p);
    ctx.save(); ctx.globalAlpha *= Math.max(0, f); base.draw.call(this, sc, ctx, p); ctx.restore();
  };
  ParentCare.open = function (sc, id) { if (ParentWork.away() || sc.work?.phase === "away") return ParentWork.openAway(sc); return base.open.call(this, sc, id); };
  ParentCare.request = function (sc, id, all, quiet) { if (sc.work && sc.work.phase !== "home") return; return base.request.call(this, sc, id, all, quiet); };
  // おしごとの あいだは ぱぱ・ままが 出る かけあい（おふろ・せいくらべ など）を しない
  const talk = HomeLife.playTalk;
  HomeLife.playTalk = function (sc, t) { if (t && sc.work && sc.work.phase !== "home" && t.turns.some((x) => x.who === "papa" || x.who === "mama")) return false; return talk.call(this, sc, t); };
})();
