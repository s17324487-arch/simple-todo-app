// おうちで あそぶ・よむ・しゅくだい（UI-106。オーナーの 依頼 2026-10-07「3人で遊んだり、本を読んだり、宿題をしたりさせてくれ。遊ぶ、本を読む、宿題をする動作のためには、
// 誰かが遊び道具(トランプや縄跳び、ゲーム機など)や本、国語や数学のドリル、のアイテムを持っている必要があるようにしろ。…種類によっても行動・会話パターンを変えよう」）。
// ・あそびどうぐ・ほん・ドリル（js/play-goods.js）が いる。3人の だれかが 手に もって いる もの（もちもの outfit.hand）か、
//   おうちに ある もの（かって ある のに だれも もって いない のこり。3人の だれかが とりだして つかう・シーンの なか だけで もちものは かえない）。
//   その もので ならび（まるく すわる・よこに ならぶ・して みせる）・うごき・会話が かわる（30しゅ。ことばは js/home-play-data.js）。
// ・はじめかた（オーナーの 追加 2026-10-07「こちらから指示しても良いが、何も指示しなくても自律的にごわがが行うものとしなさい」）:
//   - なにも いわなくても 3人が じぶんで（へやが しずかな とき・さいしょは 45びょう〜1ふん40びょう・そのあとは 2ふん半〜5ふん ごと）。
//     なにを するかも 3人が えらぶ（weight: ゆうがた 15〜19じは しゅくだい・よると あめ／ゆきの 日は ほん・ひるは あそびどうぐ・もって いる ものと
//     その 子の すきな もの〔LIKE〕が でやすい・まえと おなじ ものは でにくい）。はじめる まえに その 子の こころの こえ（「しゅくだい、まだ だった！」）。
//   - したの「あそぶ」→ もって いる もの（「トランプ（わんこ）」）か、おうちに ある ものの しゅるい（「ほんを よむ」→ どれを よむかは 3人が えらぶ）。
// ・ながれ: もって いる 子が さそう → ふたりが こたえる → あつまって すわる（家具の なかや かげに ならない ばしょ）→ うごきの かたまり（beats）を じゅんに →
//   おわりの 会話（ゲームは かった 子が いる）→ ごきげん・なかよし ＋。ぱぱ・ままが いれば とちゅうで ひとこと → だれかが こたえる。
// ・あそんで いる 子を タップ: なでても やめない（ひとこと・ハート）。したの ボタン・ドア・かいだん・もようがえ・ごはん などで やめる。
// ・あそんで いる あいだは けんか・しぐさ・おねがい・ぱぱ ままの おせわ・おトイレの もじもじ・おひるねを おやすみ（HomeDoze と おなじ つつみかた）。
// ・もって いる 子の 手の 絵は かくして、つかって いる ところ（ひらいた ほん・カード・ばん・ドリルと えんぴつ など）を canvas に 描く。
// ・セーブしない（シーンの なか だけ・SCHEMA は 2 の まま）。おじゃま（sc.guest）では しない。
// HouseScene（enter・update・up・buildUI・menuPlay・charOpts・render の drawables）・HomeActions（visual・props）・HomeDoze.can・ParentCare.update・GowagaWish.house・HomeToilet.calm を 外から つつむ。
const HomePlay = {
  IDS: ["wanko", "gachan", "goji"],
  FIRST: [45, 100], AGAIN: [150, 300], RETRY: 30, // じぶんたちで はじめる までの へやが しずかな びょう
  // 3人の すきな もの（js/work-exp.js の FAV_WHY と おなじ せいかく: わんこは げんきに うごく・くんくん たんてい／がちゃんは てさき と えほん／
  // ごじは こつこつ と きょうりゅう・おそら）。cat は すきな しゅるい・kinds は とくに すきな あそびかた
  LIKE: { wanko: { cat: "toy", kinds: ["rope", "kendama", "koma", "riddle", "maze"] }, gachan: { cat: "book", kinds: ["bubbles", "otedama", "cube", "hiragana", "katakana"] }, goji: { cat: "drill", kinds: ["dino", "space", "sugoroku", "reversi"] } },
  // 「あそぶ」の まどの おうちに ある ものの しゅるい（どれに するかは 3人が えらぶ）
  CAT_ASK: { toy: "あそびどうぐで あそぶ", book: "ほんを よむ", drill: "しゅくだいを する" },
  GATHER: 10, END: 4.2, // あつまる じかんの げんかい・おわりの 会話
  MOOD: { toy: 8, book: 6, drill: 6 }, // ごきげん（ドリルは もって いた 子に もう +4）
  D() { return HOME_PLAY_DATA; },
  // うごきの なまえ（home-play-data.js の ev。event・絵が みる）と ほんの ひょうしの いろ
  EVENTS: ["deal", "draw", "pair", "dice", "flip", "jump", "pass", "miss", "clear", "two", "three", "drop", "trick", "aim", "spike", "wind", "spin", "wobble", "blow", "pop", "big", "fast", "trip", "twist", "face", "page", "trace", "goal", "write"],
  BOOK_COVER: { dino: "#8FCB82", fish: "#7EC3E6", space: "#3E4C82", animal: "#F6B26B", momo: "#FCE4EC", moon: "#5865A8", riddle: "#FFE082", manga: "#F4F1EA", recipe: "#FFF1D6", maze: "#C5E6B8" },
  // ---- シーンごとの ようす（セーブしない）----
  st(sc) { return sc.play || (sc.play = { phase: null, next: U.rand(...this.FIRST), plays: 0, last: null, kind: null, log: [] }); },
  on(sc) { return !!(sc && sc.play && sc.play.phase); },
  playing(c) { return !!(c && c.activity && c.activity.id === "play"); },
  kindOf(item) { return item && this.D()[item.play] ? item.play : null; },
  // あそべる もの（おなじ ものは 1つ）: 3人の だれかが もって いる もの（house: false・who は もって いる 子）と
  // おうちに ある もの（house: true・who は とりだす 子 taker）
  options(sc) {
    if (!sc || sc.guest || typeof PlayGoods === "undefined") return [];
    const seen = new Set();
    const held = PlayGoods.holders().filter((h) => sc.chars.some((c) => c.id === h.who) && this.kindOf(h.item) && !seen.has(h.item.id) && seen.add(h.item.id)).map((h) => ({ who: h.who, item: h.item, kind: h.item.play, house: false }));
    const house = PlayGoods.ITEMS.filter((it) => !seen.has(it.id) && this.kindOf(it) && this.spare(it.id)).map((it) => ({ who: this.taker(sc, it), item: it, kind: it.play, house: true })).filter((o) => o.who);
    return [...held, ...house];
  },
  // おうちに ある（かって ある かずが、いま もって いる 人の かずより おおい）
  spare(id) { return typeof WearStock !== "undefined" && WearStock.count(id) - WearStock.wearers(id).length > 0; },
  // その 子の すき（2: とくに すきな あそびかた・1: すきな しゅるい・0）
  likes(who, item) { const L = this.LIKE[who]; return !L || !item ? 0 : L.kinds.includes(item.play) ? 2 : L.cat === item.playCat ? 1 : 0; },
  // おうちに ある ものを とりだす 子: ふうせん・バッグ・リードを もって いない 子 → すきな もの → 手が あいて いる → ならびの じゅん（いつも おなじ 子）
  taker(sc, item) {
    let best = null;
    sc.chars.forEach((c, i) => {
      const h = typeof HandItems !== "undefined" ? HandItems.held(c.id) : null, other = !!h && !PlayGoods.isPlay(h);
      const s = (other ? -100 : 0) + this.likes(c.id, item) * 10 + (h ? 0 : 3) - i * 0.1;
      if (!best || s > best.s) best = { s, id: c.id };
    });
    return best ? best.id : null;
  },
  // じぶんたちで えらぶ ときの おもみ（h: なんじ・wx: てんき）
  weight(o, last = null, h = U.hourNow(), wx = typeof Weather !== "undefined" ? Weather.kind() : "clear") {
    const cat = o.item.playCat, night = h >= 21 || h < 6;
    let w = 1;
    if (cat === "drill") w *= h >= 15 && h < 19 ? 3 : night ? 0.3 : 1; // がっこうから かえって しゅくだいの じかん
    if (cat === "book") w *= (night || h >= 19 ? 2.5 : 1) * (wx === "rain" || wx === "snow" ? 2 : 1); // ねる まえ・おそとに でられない 日
    if (cat === "toy") w *= night ? 0.3 : h >= 9 && h < 18 ? 1.5 : 1;
    if (!o.house) w *= 1.5; // もって いる 子が「これ やろう！」
    if (this.likes(o.who, o.item) === 2) w *= 2;
    if (o.kind === last) w *= 0.15;
    return w;
  },
  choose(sc, ops, rnd = Math.random()) {
    if (!ops.length) return null;
    const last = this.st(sc).last, ws = ops.map((o) => this.weight(o, last));
    let r = rnd * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < ops.length; i++) if ((r -= ws[i]) < 0) return ops[i];
    return ops[ops.length - 1];
  },
  // はじめられる とき（へやが しずか・3人とも そろって いる・ほかの みんなの うごきが ない）
  can(sc) {
    if (!sc || sc.guest || sc.mode || UI.busy || Game.trans || document.hidden || sc.doorWalk || sc.climb) return false;
    if (this.on(sc) || (typeof HomeDoze !== "undefined" && HomeDoze.on(sc))) return false;
    if (sc.life && (sc.life.quarrel || sc.life.queue.length)) return false;
    if (sc.wc && sc.wc.who) return false;
    const h = sc.wishFx; if (h && (h.busy || h.amae > 0)) return false;
    if (sc.work && !["home", "away"].includes(sc.work.phase)) return false;
    return sc.chars.length === this.IDS.length && sc.chars.every((c) => !c.hidden && !c.wc && ["idle", "walk", "activity"].includes(c.state));
  },
  // ---- ならび（へやの (x, y)。画面の よこ u = x − y・おく v = x + y）----
  // circle: うしろ・ひだり まえ・みぎ まえ（まんなかに ばん）／ row: よこ 一列（まんなかが もって いる 子）／ show: もって いる 子が まえ・ふたりが ななめ うしろ
  layout(form, c) {
    const P = (du, dv) => ({ x: Math.round(c.x + (du + dv) / 2), y: Math.round(c.y + (dv - du) / 2) });
    if (form === "circle") return [{ ...P(0, -58), dir: "down", sit: true }, { ...P(-74, 26), dir: "right", sit: true }, { ...P(74, 26), dir: "left", sit: true }];
    if (form === "show") return [{ ...P(0, 34), dir: "down", sit: false }, { ...P(-84, -12), dir: "right", sit: true }, { ...P(84, -12), dir: "left", sit: true }];
    return [{ ...P(0, 0), dir: "down", sit: true }, { ...P(-84, 0), dir: "down", sit: true }, { ...P(84, 0), dir: "down", sit: true }];
  },
  // あつまる ばしょ: ラグの うえ → へやの まんなか。家具の なか・かげに ならない ならびを さがす（js/home-doze.js の cover）
  spot(sc, form) {
    const items = (typeof Room !== "undefined" && Room.of ? Room.of(sc) : Save.d.room).items || [], rug = items.find((it) => FURN_INDEX[it.id] && FURN_INDEX[it.id].kind === "rug"), prefs = [];
    if (rug) { const a = sc.anchor(rug), m = HomeDesign.model(rug.id, rug); prefs.push({ x: a.x, y: a.y - m.footD / 2, by: "rug" }); }
    prefs.push({ x: ROOM.W / 2, y: ROOM.WALL + (ROOM.H - ROOM.WALL) * 0.6, by: "room" });
    let best = null;
    for (const [k, pr] of prefs.entries()) {
      for (let dy = -100; dy <= 100; dy += 20) for (let dx = -120; dx <= 120; dx += 20) {
        const c = { x: pr.x + dx, y: pr.y + dy }, pts = this.layout(form, c), bad = HomeDoze.cover(sc, pts), score = bad * 1000 + k * 300 + Math.hypot(dx, dy);
        if (!best || score < best.score) best = { score, bad, c, by: pr.by };
      }
      if (best.bad === 0) break;
    }
    return { x: Math.round(best.c.x), y: Math.round(best.c.y), by: best.by, bad: best.bad };
  },
  // ぱぱ・ままが じゃまに なる ばしょ（ちかい・まえ〔画面の した〕で よこが ちかい）と よける さき（いまの ばしょから ちかい ところ）
  inWay(sp, x, y) { const du = x - y - (sp.x - sp.y), dv = x + y - (sp.x + sp.y); return Math.hypot(x - sp.x, y - sp.y) < 170 || (Math.abs(du) < 150 && dv > -40 && dv < 320); },
  aside(sp, p, taken) {
    let best = null;
    for (let y = ROOM.WALL + 70; y <= ROOM.H - 30; y += 20) for (let x = 50; x <= ROOM.W - 50; x += 20) {
      if (this.inWay(sp, x, y) || taken.some((t) => Math.hypot(t.x - x, t.y - y) < 60)) continue;
      const d = Math.hypot(x - p.x, y - p.y); if (!best || d < best.d) best = { x, y, d };
    }
    return best;
  },
  // ---- はじめる（via: menu したの ボタン・self じぶんたちで・debug）----
  // who が もって いる もの か、おうちに ある もの（house: who が とりだす。もちものは かえない）
  start(sc, who, itemId, via = "menu") {
    const item = typeof PlayGoods !== "undefined" ? PlayGoods.INDEX[itemId] : null, kind = this.kindOf(item), D = this.D(), K = kind && D[kind];
    const held = !!item && !!PlayGoods.heldBy(who) && PlayGoods.heldBy(who).id === itemId;
    if (!K || !this.can(sc) || !this.IDS.includes(who) || (!held && !this.spare(itemId))) return false;
    const S = this.st(sc), others = this.IDS.filter((id) => id !== who), order = [who, ...U.shuffle(others)];
    const sp = this.spot(sc, K.form), pos = this.layout(K.form, sp);
    Object.assign(S, { phase: "gather", kind, item: itemId, cat: item.playCat, holder: who, house: !held, order, P: 0, t: 0, g: 0, beat: -1, beatT: 0, ev: null, evT: 0, spot: sp, pos: {}, winner: null, parentAt: U.pick([1, 2, 3]), parentDone: false, via, seed: (Math.random() * 1e6) | 0, discs: null });
    // ばん（リバーシ）・すごろくの こまの ばしょ
    if (kind === "reversi") { S.discs = this.reversiStart(); S.turn = 2; }
    if (kind === "sugoroku") S.steps = [0, 0, 0];
    S.BEAT = U.clamp(K.len / (K.beats.length + 1), 4.6, 6.4);
    // ぱぱ・ままは おせわを やめて、あそぶ ばしょの ちかくや まえ（画面の した）に いる・いく ときは よこへ よける
    const taken = [];
    for (const p of sc.parents || []) {
      p.queue = []; if (p.target) { p.target = null; p.state = "idle"; p.time = 3; }
      const at = p.state === "walk" ? { x: p.tx, y: p.ty } : p;
      if (p.hidden || !this.inWay(sp, at.x, at.y)) continue;
      let q = this.aside(sp, p, taken); if (!q) continue;
      if (typeof HomeNav !== "undefined") q = HomeNav.near(sc, q.x, q.y);
      taken.push(q);
      Object.assign(p, { state: "walk", tx: q.x, ty: q.y, _nav: null });
    }
    order.forEach((id, i) => {
      const c = sc.chars.find((k) => k.id === id); if (!c) return;
      let { x, y } = pos[i]; x = U.clamp(x, 40, ROOM.W - 40); y = U.clamp(y, ROOM.WALL + 60, ROOM.H - 20);
      if (typeof HomeNav !== "undefined") { const q = HomeNav.near(sc, x, y); x = q.x; y = q.y; }
      S.pos[id] = { x, y, dir: pos[i].dir, sit: pos[i].sit, k: i };
      HomeActions.cancel(c);
      Object.assign(c, { state: "walk", tx: x, ty: y, emo: null, jumpT: -1, _nav: null });
    });
    // じぶんたちで はじめる ときは さきに こころの こえ（しゅるいで かわる）
    const think = via === "self" ? [{ who, text: D.think[item.playCat][who], kind: "think", meta: { play: kind, at: "think" } }] : [];
    HomeLife.converse(sc, [...think, { who, text: K.start[who], meta: { play: kind, at: "start" } }, ...others.map((id) => ({ who: id, text: K.agree[id], meta: { play: kind, at: "agree" } }))]);
    S.log.push({ kind, who, via }); if (S.log.length > 20) S.log.shift();
    return true;
  },
  // すわる・たつ（その ばしょで あそぶ）
  settle(sc, c) {
    const S = this.st(sc), q = S.pos[c.id]; if (!q) return;
    HomeActions.cancel(c);
    Object.assign(c, { state: "activity", dir: q.dir, emo: null, jumpT: -1, x: q.x, y: q.y, tx: q.x, ty: q.y, _nav: null });
    c.activity = { id: "play", stage: "act", elapsed: 0, duration: 1e9, travel: 0, k: q.k, kind: S.kind };
  },
  // ---- だれ（data の H・A・B・P・W・L・ALL・wanko・not:goji）----
  whoOf(S, w) {
    const [H, A, B] = S.order;
    if (w === "H") return H; if (w === "A") return A; if (w === "B") return B;
    if (w === "P") return S.order[S.P % 3];
    if (w === "W") return S.winner || H;
    if (w === "L") return S.order.find((id) => id !== (S.winner || H) && id !== (S.loserSkip || "")) || A;
    if (w && w.startsWith("not:")) { const no = w.slice(4); return S.order.find((id) => id !== no); }
    return this.IDS.includes(w) ? w : H;
  },
  textOf(t, who) { return typeof t === "string" ? t : t[who] || Object.values(t)[0]; },
  turns(S, list, at) {
    const out = [];
    for (const [w, t, kind] of list) {
      if (w === "ALL") { for (const id of S.order) out.push({ who: id, text: this.textOf(t, id), kind: kind || "say", meta: { play: S.kind, at } }); continue; }
      const who = this.whoOf(S, w); out.push({ who, text: this.textOf(t, who), kind: kind || "say", meta: { play: S.kind, at } });
    }
    return out;
  },
  // ---- うごきの かたまり ----
  beat(sc) {
    const S = this.st(sc), K = this.D()[S.kind], b = K.beats[S.beat];
    if (!b) return;
    if (b.ev) { S.ev = b.ev; S.evT = 0; this.event(sc, S, b.ev); }
    // ぱぱ・ままの ひとこと（いれば 1かい）
    const ps = (sc.parents || []).filter((p) => !p.hidden && (typeof HomeLife.heads !== "function" || HomeLife.heads(sc)[p.id]));
    if (!S.parentDone && S.beat === S.parentAt && ps.length) {
      S.parentDone = true;
      const p = U.pick(ps), kid = U.pick(S.order);
      HomeLife.converse(sc, [...this.turns(S, b.t, "beat"), { who: p.id, text: U.pick(K.parent[p.id]), kind: "say", meta: { play: S.kind, at: "parent" } }, { who: kid, text: this.D().reply[kid], kind: "say", meta: { play: S.kind, at: "reply" } }]);
      return;
    }
    HomeLife.converse(sc, this.turns(S, b.t, "beat"));
  },
  // うごきの はじまり（すごろくの こま・リバーシの いし・ゲームきの じゅんばん など）
  event(sc, S, ev) {
    const c = (id) => sc.chars.find((k) => k.id === id);
    if (ev === "pass") S.P = (S.P + 1) % 3;
    if (ev === "spin") S.spinAt = G.t;
    if (ev === "dice" && S.steps) { const i = S.beat % 3, n = [3, 6, 1, 2, 2][S.beat] || U.rand(1, 6) | 0; S.die = n; S.steps[i] = Math.max(0, S.steps[i] + (S.beat === 3 ? -3 : n)); }
    if (ev === "flip" && S.discs) this.reversiFlip(S);
    if (ev === "pop") for (const id of S.order.slice(1)) { const k = c(id); if (k) k.playJump = G.t; }
    if (["clear", "spike", "goal", "face"].includes(ev)) Sound.se("good");
    else if (["dice", "flip", "trick", "spin", "pop", "page", "write", "pair", "draw", "deal"].includes(ev)) Sound.se(ev === "page" ? "pop" : "tap");
    else if (["miss", "drop", "trip"].includes(ev)) Sound.se("miss");
  },
  // おわり: かった 子（ゲーム）・ごきげん
  finish(sc) {
    const S = this.st(sc), K = this.D()[S.kind];
    S.phase = "end"; S.t = 0;
    const game = K.end.some(([w]) => w === "W" || w === "L");
    if (game) S.winner = U.pick(S.order);
    if (S.cat === "drill") { S.ev = "stamp"; S.evT = 0; Sound.se("fanfare"); }
    HomeLife.converse(sc, this.turns(S, K.end, "end"));
    const mood = this.MOOD[S.cat] || 6;
    Save.careAll({ mood, bond: 1 });
    if (S.cat === "drill") Save.care(S.holder, { mood: 4 });
    if (game) { const w = sc.chars.find((k) => k.id === S.winner); if (w) w.playJump = G.t; }
    if (typeof sc.updateCare === "function") sc.updateCare();
    S.plays++;
  },
  // やめる（why: done おわり・button したの ボタン・stir ほかの うごき）
  stop(sc, why = "done") {
    const S = this.st(sc), was = S.phase;
    if (!was) return false;
    const kind = S.kind;
    Object.assign(S, { phase: null, t: 0, ev: null, next: U.rand(...this.AGAIN), last: kind, why });
    for (const c of sc.chars) if (this.playing(c)) { HomeActions.cancel(c); c.state = "idle"; c.t = U.rand(1.5, 3); c.playJump = null; }
    for (const c of sc.chars) if (c.state === "walk" && !c.activity) { c.state = "idle"; c.t = U.rand(1, 2); }
    if (sc.life) sc.life.next = Math.max(sc.life.next, 8);
    if (why === "button" && was !== "end") { const id = S.holder; HomeLife.say(sc, id, this.D().stop[id], false, "say", { play: kind, at: "stop" }); }
    return true;
  },
  update(sc, dt) {
    const S = this.st(sc);
    if (document.hidden || UI.busy) return;
    if (!S.phase) {
      // じぶんたちで はじめる（へやが しずかな じかん だけ かぞえる・とめて すすめる テストの あいだは かぞえない）
      if (!Game.paused && this.can(sc) && (S.next -= dt) <= 0) {
        const o = this.choose(sc, this.options(sc));
        if (!o || !this.start(sc, o.who, o.item.id, "self")) S.next = this.RETRY;
      }
      return;
    }
    // あそんで いる あいだは ほかの できごとを まつ
    if (sc.life) sc.life.next = Math.max(sc.life.next, 4);
    if (sc.actions) sc.actions.next = Math.max(sc.actions.next, 3);
    if (sc.mode || Game.trans || sc.doorWalk || sc.climb || sc.chars.some((c) => c.hidden)) { this.stop(sc, "stir"); return; }
    // きがえで はずした（もって いた もの）・おうちから なくなった（おうちに ある もの）
    if (S.house ? WearStock.count(S.item) <= 0 : !PlayGoods.heldBy(S.holder) || PlayGoods.heldBy(S.holder).id !== S.item) { this.stop(sc, "stir"); return; }
    S.t += dt; S.evT += dt;
    if (S.phase === "gather") {
      S.g += dt;
      for (const c of sc.chars) if (!this.playing(c) && (c.state === "idle" || S.g >= this.GATHER)) this.settle(sc, c);
      if (sc.chars.every((c) => this.playing(c)) && !(sc.life && sc.life.queue.length)) { S.phase = "play"; S.t = 0; S.beat = -1; S.beatT = 0.6; }
      return;
    }
    if (sc.chars.some((c) => !this.playing(c))) { this.stop(sc, "stir"); return; }
    if (S.phase === "play") {
      if ((S.beatT -= dt) <= 0) {
        S.beat++;
        const K = this.D()[S.kind];
        if (S.beat >= K.beats.length) { this.finish(sc); return; }
        this.beat(sc); S.beatT = S.BEAT;
      }
      return;
    }
    if (S.phase === "end" && S.t >= this.END + (sc.life && sc.life.queue.length ? 1 : 0)) this.stop(sc, "done");
  },

  // ===================== 絵 =====================
  // からだ（HomeActions.visual の かわり）: すわる・たつ・はねる・のぞきこむ
  visual(c) {
    const sc = G.scene, S = sc && sc.play, a = c.activity; if (!S || !a) return null;
    const q = S.pos[c.id] || { dir: "down", sit: true }, t = a.elapsed + (a.k || 0) * 0.7, isH = c.id === S.holder, isP = c.id === S.order[S.P % 3];
    const v = { pose: q.sit ? "sit_01" : "idle_01", face: "happy", dir: q.dir, x: 0, y: 0, angle: 0, sx: 1, sy: 1, alpha: 1 };
    const b = Math.sin(t * 2.2);
    v.sy = 1 + 0.012 * b;
    // はねる（シャボンだまを おう・かった 子）
    if (c.playJump && G.t - c.playJump < 0.7) { const k = (G.t - c.playJump) / 0.7; v.pose = "jump_01"; v.y = -Math.sin(k * Math.PI) * 22; v.face = "happy"; return v; }
    const K = S.kind, ev = S.ev, evT = S.evT;
    if (S.phase === "end") { v.face = S.winner && c.id !== S.winner ? "normal" : "happy"; return v; }
    if (["miss", "drop", "trip"].includes(ev) && evT < 1.6 && (isH || isP)) v.face = "surprise";
    // して みせる 子（たって いる）
    if (!q.sit) {
      if (K === "rope") { const r = this.rope(S, c); v.pose = r.trip ? "land_01" : r.air > 0.15 ? "jump_01" : "idle_01"; v.y = -r.air * 12; }
      else if (K === "bubbles") { v.pose = Math.sin(t * 1.6) > 0 ? "idle_02" : "idle_01"; v.angle = -0.04; }
      else if (K === "koma") { v.pose = ev === "spin" && evT < 0.5 ? "jump_01" : "idle_02"; v.angle = ev === "spin" && evT < 0.5 ? 0.12 : 0; }
      else v.pose = Math.floor(t * 1.4) % 2 ? "idle_02" : "idle_01";
      return v;
    }
    // みて いる 子は もって いる 子へ すこし かたむく（よこ ならび）
    const H = S.pos[S.holder];
    if (S.kind && this.D()[S.kind].form === "row" && !isH && H) { const left = q.x - q.y < H.x - H.y; v.angle = (left ? 1 : -1) * 0.07; if (K === "game" && !isP) v.angle *= 1.3; }
    if (this.D()[K].drill && isH) v.angle = 0.05 * Math.sin(t * 3); // かいて いる
    if (K === "game" && isP) v.sy = 1 + 0.02 * Math.sin(t * 9);
    return v;
  },
  // なわとびの なわ（ph 0: あたまの うえ・π: あしの した。あしの した の まえと あとで とぶ）
  rope(S, c) {
    const trip = S.ev === "trip" && S.evT < 1.4, f = (S.ev === "fast" && S.evT < 4 ? 1.7 : 1.05) * Math.PI * 2, t = c.activity ? c.activity.elapsed : 0;
    const ph = trip ? Math.PI : (t * f) % (Math.PI * 2), d = Math.abs(ph - Math.PI);
    return { ph, trip, front: Math.sin(ph) > 0, air: trip || d > Math.PI / 3 ? 0 : Math.cos(d * 1.5) };
  },
  // ---- canvas の 小さな 絵 ----
  ink(ctx, w) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round"; },
  rr(ctx, x, y, w, h, r, fill, lw = 1.6) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); this.ink(ctx, lw); ctx.stroke(); },
  circ(ctx, x, y, r, fill, lw = 1.4) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { this.ink(ctx, lw); ctx.stroke(); } },
  poly(ctx, pts, fill, lw = 1.6) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { this.ink(ctx, lw); ctx.stroke(); } },
  // ゆかの うえの 四角（へやの ざひょう）
  floorQuad(sc, cx, cy, hw, hd, z = 0) { return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([dx, dy]) => sc.toScreen(cx + dx, cy + dy, z)); },
  lerp(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; },
  quadAt(Q, u, v) { const a = this.lerp(Q[0], Q[1], u), b = this.lerp(Q[3], Q[2], u); return this.lerp(a, b, v); },
  // トランプ（1まい）
  card(ctx, x, y, w, h, rot, back, mark) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    this.rr(ctx, -w / 2, -h / 2, w, h, w * 0.18, back ? "#4F6FB5" : "#FFFFFF", 1.2);
    if (back) { ctx.strokeStyle = "#C9D6F2"; ctx.lineWidth = 0.8; ctx.strokeRect(-w * 0.32, -h * 0.36, w * 0.64, h * 0.72); }
    else if (mark) { ctx.fillStyle = mark; ctx.beginPath(); ctx.arc(0, 0, w * 0.18, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  // サイコロ（うえから）
  die(ctx, x, y, s, n) {
    this.rr(ctx, x - 6 * s, y - 6 * s, 12 * s, 12 * s, 2.6 * s, "#FFFFFF", 1.3);
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n] || [[0, 0]];
    for (const [dx, dy] of P) { ctx.fillStyle = n === 1 ? "#E53935" : INK; ctx.beginPath(); ctx.arc(x + dx * 3.2 * s, y + dy * 3.2 * s, (n === 1 ? 1.9 : 1.2) * s, 0, Math.PI * 2); ctx.fill(); }
  },
  // リバーシ（ほんとうの きまり: 8×8・まんなかに 4つ・はさんだ いしを ひっくりかえす・くろが さき。1 くろ／2 しろ）
  reversiStart() { const d = Array(64).fill(0); d[27] = 2; d[36] = 2; d[28] = 1; d[35] = 1; return d; },
  // おける ところと ひっくりかえる いし
  reversiMoves(d, me) {
    const out = [], DIR = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], at = (x, y) => (x >= 0 && x < 8 && y >= 0 && y < 8 ? d[y * 8 + x] : -1);
    for (let i = 0; i < 64; i++) {
      if (d[i]) continue;
      const x = i % 8, y = (i / 8) | 0, flips = [];
      for (const [dx, dy] of DIR) { const run = []; let cx = x + dx, cy = y + dy; while (at(cx, cy) === 3 - me) { run.push(cy * 8 + cx); cx += dx; cy += dy; } if (run.length && at(cx, cy) === me) flips.push(...run); }
      if (flips.length) out.push({ i, flips });
    }
    return out;
  },
  // うごき flip: 3て すすめる（かどが あれば かど・なければ いちばん おおく ひっくりかえる ところ。おけない ときは パス）
  reversiFlip(S) {
    const d = S.discs;
    for (let n = 0; n < 3; n++) {
      S.turn = S.turn === 1 ? 2 : 1;
      const ms = this.reversiMoves(d, S.turn); if (!ms.length) continue;
      const corner = ms.filter((m) => [0, 7, 56, 63].includes(m.i)), pool = corner.length ? corner : ms, best = Math.max(...pool.map((m) => m.flips.length)), top = pool.filter((m) => m.flips.length === best);
      const m = top[(S.seed + S.beat + n) % top.length];
      d[m.i] = S.turn; for (const j of m.flips) d[j] = S.turn;
    }
  },

  // ---- ゆかに おく もの（まんなかの ばん・こま・シャボンだま。へやの 絵の ならびに いれる）----
  floorDraw(sc, ctx) {
    const S = sc.play; if (!S || !S.phase || S.phase === "gather") return;
    const K = S.kind, s = sc.actorScale, sp = S.spot, cx = sp.x, cy = sp.y, T = G.t;
    ctx.save();
    if (K === "cards") {
      // まんなかに すてた カード
      const Q = this.floorQuad(sc, cx, cy, 16, 16);
      for (let i = 0; i < 5; i++) { const p = this.quadAt(Q, 0.3 + 0.1 * ((i * 37) % 5), 0.3 + 0.1 * ((i * 23) % 5)); this.card(ctx, p.x, p.y, 9 * s, 12 * s, -0.6 + i * 0.35, i % 2 === 0, i % 2 ? "#E53935" : INK); }
      // くばる・ひく: カードが とぶ
      if ((S.ev === "deal" || S.ev === "draw") && S.evT < 1.2) {
        const from = S.pos[S.order[S.ev === "deal" ? 0 : 1]], to = S.pos[S.order[S.ev === "deal" ? 1 + Math.floor(S.evT * 3) % 2 : 2]];
        if (from && to) { const k = (S.evT * 1.6) % 1, a = sc.toScreen(from.x, from.y, 30), b = sc.toScreen(to.x, to.y, 30), p = this.lerp(a, b, k); this.card(ctx, p.x, p.y - Math.sin(k * Math.PI) * 18 * s, 8 * s, 11 * s, k * 6, true); }
      }
    } else if (K === "sugoroku") {
      const Q = this.floorQuad(sc, cx, cy, 30, 22);
      this.poly(ctx, Q, "#FFF3D6", 1.8);
      const path = [];
      for (let i = 0; i < 6; i++) path.push([0.12 + i * 0.152, 0.16]);
      for (let i = 1; i < 4; i++) path.push([0.88, 0.16 + i * 0.226]);
      for (let i = 1; i < 6; i++) path.push([0.88 - i * 0.152, 0.84]);
      for (let i = 1; i < 3; i++) path.push([0.12, 0.84 - i * 0.226]);
      const cols = ["#F48FB1", "#9AD0EC", "#FFD54F", "#A5D6A7"];
      path.forEach(([u, v], i) => { const p = this.quadAt(Q, u, v); ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.ellipse(p.x, p.y, 4.6 * s, 2.8 * s, 0, 0, Math.PI * 2); ctx.fill(); this.ink(ctx, 0.9); ctx.stroke(); });
      const goal = this.quadAt(Q, ...path[path.length - 1]); ctx.fillStyle = "#FFB300"; ctx.font = `900 ${10 * s}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("★", goal.x, goal.y + 3 * s);
      // 3人の こま（あか・きいろ・みどり）
      const pc = { wanko: "#E8545E", gachan: "#F2C14E", goji: "#5FAE4E" };
      S.order.forEach((id, i) => { const st = Math.min(path.length - 1, S.steps[i] || 0), p = this.quadAt(Q, ...path[st]), dx = (i - 1) * 3.4 * s; ctx.fillStyle = pc[id]; ctx.beginPath(); ctx.moveTo(p.x + dx, p.y - 9 * s); ctx.lineTo(p.x + dx + 3.6 * s, p.y); ctx.lineTo(p.x + dx - 3.6 * s, p.y); ctx.closePath(); ctx.fill(); this.ink(ctx, 1); ctx.stroke(); this.circ(ctx, p.x + dx, p.y - 9.5 * s, 2.2 * s, pc[id], 1); });
      if (S.ev === "dice" && S.evT < 1.6) { const c0 = sc.toScreen(cx, cy, 0), k = Math.min(1, S.evT / 0.7), hop = Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * 18 * s; this.die(ctx, c0.x, c0.y - 10 * s - hop, s, k < 1 ? 1 + ((Math.floor(T * 14) % 6)) : S.die); }
    } else if (K === "reversi") {
      const Q = this.floorQuad(sc, cx, cy, 27, 27);
      this.poly(ctx, Q, "#3FA36B", 1.8);
      ctx.strokeStyle = "#2E7D4F"; ctx.lineWidth = 0.8;
      for (let i = 1; i < 8; i++) { const a = this.quadAt(Q, i / 8, 0), b = this.quadAt(Q, i / 8, 1), c = this.quadAt(Q, 0, i / 8), d = this.quadAt(Q, 1, i / 8); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
      (S.discs || []).forEach((v, i) => { if (!v) return; const p = this.quadAt(Q, (i % 8 + 0.5) / 8, (Math.floor(i / 8) + 0.5) / 8); ctx.fillStyle = v === 1 ? INK : "#FFFFFF"; ctx.beginPath(); ctx.ellipse(p.x, p.y, 2.7 * s, 1.65 * s, 0, 0, Math.PI * 2); ctx.fill(); this.ink(ctx, 0.7); ctx.stroke(); });
    } else if (K === "koma") {
      // まわって いる こま（なげて から 9びょう）
      const since = S.spinAt != null ? T - S.spinAt : 99;
      if (since < 10) {
        const H = S.pos[S.holder], p = sc.toScreen(H.x + 22, H.y + 22, 0), wob = S.ev === "wobble" ? 0.25 + 0.1 * Math.sin(T * 9) : 0.05 * Math.sin(T * 7), r = 9 * s;
        ctx.fillStyle = "rgba(31,29,27,0.14)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(wob);
        ctx.beginPath(); ctx.moveTo(-r, -8 * s); ctx.quadraticCurveTo(-r * 0.6, -2 * s, 0, 0); ctx.quadraticCurveTo(r * 0.6, -2 * s, r, -8 * s); ctx.closePath(); ctx.fillStyle = "#F0D29E"; ctx.fill(); this.ink(ctx, 1.3); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -8 * s, r, r * 0.34, 0, 0, Math.PI * 2); ctx.fillStyle = "#F4DDB0"; ctx.fill(); this.ink(ctx, 1.3); ctx.stroke();
        const ph = T * 18; ctx.strokeStyle = "#E53935"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, -8 * s, r * 0.62, r * 0.2, 0, ph, ph + 2.2); ctx.stroke(); ctx.strokeStyle = "#4CAF7A"; ctx.beginPath(); ctx.ellipse(0, -8 * s, r * 0.62, r * 0.2, 0, ph + 3.1, ph + 5.3); ctx.stroke();
        ctx.restore();
      }
    } else if (K === "bubbles") {
      // ふわふわ うかぶ たま（もって いる 子の くちもと から）
      const H = sc.chars.find((k) => k.id === S.holder), base = H ? sc.toScreen(H.x, H.y, 0) : sc.toScreen(cx, cy, 0);
      const n = S.ev === "big" && S.evT < 4 ? 4 : 7;
      for (let i = 0; i < n; i++) {
        const life = 3.2, k = ((T * 0.5 + i / n) % 1), age = k * life, r = (S.ev === "big" && i === 0 && S.evT < 4 ? 15 : 4 + ((i * 7) % 4)) * s;
        const x = base.x + (18 + age * (16 + (i % 3) * 9) * (i % 2 ? 1 : -0.6)) * s, y = base.y - (46 + age * 18 + Math.sin(T * 2 + i) * 4) * s;
        ctx.globalAlpha = Math.min(1, (1 - k) * 2.2);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "rgba(234,246,252,0.45)"; ctx.fill(); ctx.strokeStyle = "rgba(31,29,27,0.45)"; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.5, Math.PI * 1.05, Math.PI * 1.5); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
  // ---- 手に もつ もの（HomeActions.props の かわり。p は あしもと・s は 3人の 大きさ）----
  props(sc, ctx, c, p, s) {
    const S = sc.play; if (!S || !S.phase || !this.playing(c)) return;
    const K = S.kind, D = this.D()[K], isH = c.id === S.holder, isP = c.id === S.order[S.P % 3], q = S.pos[c.id] || {}, T = G.t, dir = q.dir || "down";
    const side = dir === "right" ? 1 : dir === "left" ? -1 : 0, sitY = q.sit ? 6 : 0;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    if (K === "cards") {
      // てもちの カード（3まい・おうぎ）
      const fx = side * 14, fy = -28 + sitY;
      for (let i = 0; i < 3; i++) this.card(ctx, fx + (i - 1) * 4, fy, 9, 13, (i - 1) * 0.32 + side * 0.2, false, ["#E53935", INK, "#E53935"][i]);
    } else if (K === "game" && isP) {
      // ゲームき（がめんが ひかる）
      const y = -26 + sitY;
      this.rr(ctx, -15, y - 8, 30, 17, 6, "#9FD9C8", 1.6);
      const hue = Math.floor(T * 3) % 3, scr = ["#7FD3F0", "#FFD54F", "#F8BBD0"][hue];
      this.rr(ctx, -6, y - 5, 12, 10, 2, "#34405E", 1.2); ctx.fillStyle = scr; ctx.fillRect(-4.6, y - 3.6, 9.2, 7.2);
      ctx.fillStyle = INK; ctx.fillRect(-12, y - 1, 5, 1.6); ctx.fillRect(-10.2, y - 2.8, 1.6, 5.2); this.circ(ctx, 10, y - 1.5, 1.6, "#F06292", 0.9); this.circ(ctx, 12.4, y + 1.6, 1.6, "#FFD54F", 0.9);
      if (S.ev === "jump" && S.evT < 1) { ctx.fillStyle = INK; ctx.font = "900 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("ぴょん", 0, y - 14); }
    } else if (K === "otedama" && isP) {
      // おてだま（あたまの うえで まわる）
      const n = S.ev === "three" || (S.ev === "pass" && S.evT > 1.4) ? 3 : 2, cols = ["#E8545E", "#5C8FD6", "#F2C14E"];
      for (let i = 0; i < n; i++) {
        let a = T * 4.2 + (i * Math.PI * 2) / n, x = Math.cos(a) * 15, y = -76 - Math.abs(Math.sin(a)) * 18;
        if (S.ev === "drop" && S.evT < 1.6 && i === 0) { x = 16; y = -16 + Math.min(1, S.evT * 2) * 14; }
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); this.rr(ctx, -5, -4.5, 10, 9, 3.4, cols[i], 1.3); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(-1.6, -1.2, 0.8, 0, 7); ctx.arc(1.8, 1.4, 0.8, 0, 7); ctx.fill(); ctx.restore();
      }
    } else if (K === "kendama" && isH) {
      // けんだま: けんを もって、たまが あがって おさらに のる（とめけんは とがった ところ）
      const hx = 24, hy = -30;
      this.rr(ctx, hx - 2.4, hy - 16, 4.8, 26, 2, "#F0D29E", 1.2); this.rr(ctx, hx - 10, hy - 11, 20, 4.4, 1.6, "#F0D29E", 1.2);
      ctx.fillStyle = "#D7AE6E"; ctx.beginPath(); ctx.moveTo(hx - 1.6, hy - 16); ctx.lineTo(hx, hy - 22); ctx.lineTo(hx + 1.6, hy - 16); ctx.closePath(); ctx.fill(); this.ink(ctx, 1); ctx.stroke();
      const cyc = (S.evT % 2.4) / 2.4, up = ["trick", "spike"].includes(S.ev), miss = S.ev === "miss";
      let bx = hx + 10, by = hy + 18;
      if (up && S.evT < 2.4) { const k = Math.min(1, cyc / 0.55); bx = hx + 10 - 10 * k; by = hy + 18 - (S.ev === "spike" ? 44 : 34) * Math.sin(k * Math.PI / 2) + (k >= 1 ? 0 : 0); if (k >= 1) { bx = hx; by = S.ev === "spike" ? hy - 26 : hy - 16; } }
      else if (miss && S.evT < 2) { const k = S.evT / 2; bx = hx + 14 * Math.cos(k * 9); by = hy + 6 + 12 * Math.sin(k * 9); }
      else { bx = hx + 10 + Math.sin(T * 2) * 3; }
      ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx, hy - 4); ctx.quadraticCurveTo((hx + bx) / 2 + 6, (hy + by) / 2, bx, by - 5); ctx.stroke();
      this.circ(ctx, bx, by, 5.4, "#E53935", 1.3);
    } else if (K === "koma" && isH) {
      // なげる まえ: 手に こまと ひも
      const since = S.spinAt != null ? T - S.spinAt : 99;
      if (since >= 10 || S.ev === "wind") { const x = 22, y = -26; ctx.fillStyle = "#F0D29E"; ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.quadraticCurveTo(x - 4, y + 2, x, y + 6); ctx.quadraticCurveTo(x + 4, y + 2, x + 7, y - 4); ctx.closePath(); ctx.fill(); this.ink(ctx, 1.1); ctx.stroke(); ctx.strokeStyle = "#E53935"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 6, y - 2); ctx.lineTo(x + 6, y - 2); ctx.stroke(); ctx.strokeStyle = "#BDA77E"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.quadraticCurveTo(x - 14, y + 8, x - 8, y + 18); ctx.stroke(); }
    } else if (K === "bubbles" && isH) {
      // ぼうと わっか（くちの まえ）
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(13, -26); ctx.lineTo(17, -41); ctx.stroke(); ctx.strokeStyle = "#9AD0EC"; ctx.lineWidth = 1.2; ctx.stroke();
      this.circ(ctx, 18, -44.5, 3.6, null, 1.3); this.rr(ctx, 7, -26, 8, 11, 2.6, "#F8BBD0", 1.2);
    } else if (K === "rope" && isH) {
      // なわ: あたまの うえ → まえ（こく）→ あしの した → うしろ（からだに かくれる ところは うすく）。手は からだの よこ
      const r = this.rope(S, c), hx = 22, hy = -22 - r.air * 12;
      const apex = r.trip ? 3 : -43 - 49 * Math.cos(r.ph), bulge = hy + (apex - hy) * 1.3;
      ctx.globalAlpha = !r.front && !r.trip && apex > -70 && apex < -4 ? 0.3 : 1;
      ctx.beginPath(); ctx.moveTo(-hx, hy); ctx.bezierCurveTo(-hx - 9, bulge, hx + 9, bulge, hx, hy);
      ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = "#F48FB1"; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.globalAlpha = 1;
      this.rr(ctx, -hx - 2.6, hy - 4, 5.2, 11, 2.4, "#F4D9A6", 1.1); this.rr(ctx, hx - 2.6, hy - 4, 5.2, 11, 2.4, "#F4D9A6", 1.1);
    } else if (K === "cube" && isH) {
      // キューブ（まわすと いろが かわる・おわりは そろう）
      const x = 0, y = -28 + sitY, r = 9, solved = S.phase === "end", h = 0.866 * r;
      const A = { x, y: y - r }, B = { x: x + h, y: y - r / 2 }, C = { x, y }, Dd = { x: x - h, y: y - r / 2 }, E = { x, y: y + r }, F = { x: x - h, y: y + r / 2 }, G2 = { x: x + h, y: y + r / 2 };
      const pal = ["#FFFFFF", "#FFD54F", "#E53935", "#F28C38", "#4F8FD8", "#6DBE5B"], step = Math.floor((S.beat + 1) * 3 + (S.ev === "twist" ? S.evT * 2 : 0));
      [[Dd, A, B, C], [F, Dd, C, E], [E, C, B, G2]].forEach((Q, fi) => {
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
          const pt = (u, v) => { const a = this.lerp(Q[0], Q[1], u), b = this.lerp(Q[3], Q[2], u); return this.lerp(a, b, v); };
          const col = solved ? pal[[1, 2, 4][fi]] : pal[(i * 7 + j * 3 + fi * 5 + step) % 6];
          this.poly(ctx, [pt(i / 3, j / 3), pt((i + 1) / 3, j / 3), pt((i + 1) / 3, (j + 1) / 3), pt(i / 3, (j + 1) / 3)], col, 0.7);
        }
        this.poly(ctx, Q, null, 1.4);
      });
    } else if (D.book && isH) {
      this.book(ctx, K, S, sitY, T);
    } else if (D.drill && isH) {
      this.drill(ctx, K, S, sitY, T);
    }
    ctx.restore();
  },
  // ひらいた ほん（ひだりの ページに え・みぎに もじの せん。page で めくれる）
  book(ctx, K, S, sitY, T) {
    const y = -20 + sitY, cover = this.BOOK_COVER[K] || "#F6E6BE";
    this.poly(ctx, [{ x: -25, y: y - 13 }, { x: 0, y: y - 9 }, { x: 25, y: y - 13 }, { x: 25, y: y + 9 }, { x: 0, y: y + 13 }, { x: -25, y: y + 9 }], cover, 1.6);
    const L = [{ x: -23, y: y - 14 }, { x: 0, y: y - 10 }, { x: 0, y: y + 11 }, { x: -23, y: y + 7 }], R = [{ x: 0, y: y - 10 }, { x: 23, y: y - 14 }, { x: 23, y: y + 7 }, { x: 0, y: y + 11 }];
    this.poly(ctx, L, "#FFFDF5", 1.3); this.poly(ctx, R, "#FFFDF5", 1.3);
    // ひだりの ページの え
    ctx.save(); ctx.translate(-11.5, y - 1);
    const e = (fill) => { ctx.fillStyle = fill; ctx.fill(); this.ink(ctx, 0.9); ctx.stroke(); };
    if (K === "dino") { ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(-6, -2, 0, -1); ctx.quadraticCurveTo(3, -7, 6, -7); ctx.quadraticCurveTo(8, -5, 5, -4); ctx.quadraticCurveTo(4, 0, 4, 4); ctx.closePath(); e("#5E9E5A"); }
    else if (K === "fish") { ctx.beginPath(); ctx.ellipse(-1, 0, 6, 3.6, 0, 0, 7); e("#FFB74D"); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(9, -3.5); ctx.lineTo(9, 3.5); ctx.closePath(); e("#FFB74D"); }
    else if (K === "space") { this.circ(ctx, 0, 0, 4.4, "#FFB74D", 0.9); ctx.strokeStyle = "#E0A030"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 2.4, -0.3, 0, 7); ctx.stroke(); }
    else if (K === "animal") { ctx.fillStyle = "#8D5A3B"; ctx.beginPath(); ctx.ellipse(0, 2, 3.6, 3, 0, 0, 7); ctx.fill(); for (const [dx, dy] of [[-4, -2], [-1.4, -4.4], [1.4, -4.4], [4, -2]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, 7); ctx.fill(); } }
    else if (K === "momo") { ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-7, 3, -7, -5, -1, -5); ctx.lineTo(1, -5); ctx.bezierCurveTo(7, -5, 7, 3, 0, 5); e("#F8A5B6"); }
    else if (K === "moon") { ctx.beginPath(); ctx.arc(0, 0, 5.5, 0.6, 5.7); ctx.arc(2.6, -0.6, 4.4, 5.3, 1.1, true); e("#FFE082"); }
    else if (K === "riddle") { ctx.fillStyle = INK; ctx.font = "900 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText("？", 0, 4); }
    else if (K === "manga") { ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(-8, -6, 7, 5.5); ctx.strokeRect(1, -6, 7, 5.5); ctx.strokeRect(-8, 0.8, 16, 5.5); }
    else if (K === "recipe") { this.circ(ctx, -1, 1, 4.6, "#5D6D7E", 0.9); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(-1, 0.6, 2.6, 0, 7); ctx.fill(); this.circ(ctx, -1, 0.6, 1.2, "#FFC93C", 0); ctx.fillStyle = "#8D6E63"; ctx.fillRect(3.4, 0.2, 5, 1.8); }
    else if (K === "maze") { ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.strokeRect(-6, -6, 12, 12); ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-3, 3); ctx.lineTo(3, 3); ctx.lineTo(3, -3); ctx.lineTo(0, -3); ctx.stroke(); if (S.ev === "trace" || S.ev === "goal") { const k = (S.evT % 2) / 2; ctx.fillStyle = "#E53935"; ctx.beginPath(); ctx.arc(-3 + 6 * k, 3 - 6 * Math.max(0, k - 0.5), 1.3, 0, 7); ctx.fill(); } }
    ctx.restore();
    // みぎの ページの もじの せん
    ctx.strokeStyle = "#C9BFA6"; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(4, y - 6 + i * 4.6 - i * 0.3); ctx.lineTo(19, y - 8 + i * 4.6 - i * 0.3); ctx.stroke(); }
    // めくれる ページ
    if (S.ev === "page" && S.evT < 0.7) { const k = S.evT / 0.7, w = 23 * Math.cos(k * Math.PI); this.poly(ctx, [{ x: 0, y: y - 10 }, { x: w, y: y - 14 - Math.sin(k * Math.PI) * 6 }, { x: w, y: y + 7 - Math.sin(k * Math.PI) * 6 }, { x: 0, y: y + 11 }], "#FFFFFF", 1.1); }
  },
  // ドリル（ひらいて えんぴつで かく。ひだりの ページは ドリルごとに ちがう もんだい・おわると はなまる）
  drill(ctx, K, S, sitY, T) {
    const y = -14 + sitY, it = PlayGoods.INDEX[S.item], kokugo = !!it && it.subject === "kokugo", col = kokugo ? "#EF7C8E" : "#5B9BE0";
    this.poly(ctx, [{ x: -24, y: y - 12 }, { x: 0, y: y - 8 }, { x: 24, y: y - 12 }, { x: 24, y: y + 9 }, { x: 0, y: y + 13 }, { x: -24, y: y + 9 }], col, 1.6);
    const L = [{ x: -22, y: y - 13 }, { x: 0, y: y - 9 }, { x: 0, y: y + 11 }, { x: -22, y: y + 7 }], R = [{ x: 0, y: y - 9 }, { x: 22, y: y - 13 }, { x: 22, y: y + 7 }, { x: 0, y: y + 11 }];
    this.poly(ctx, L, "#FFFFFF", 1.3); this.poly(ctx, R, "#FFFFFF", 1.3);
    // ひだりの ページ: こくごは ますに おてほんの もじ・さんすうは しき（とけいは とけいの え）
    const P = this.DRILL_PAGE[K] || this.DRILL_PAGE.tashi;
    ctx.save(); ctx.translate(-11, y - 1.5); ctx.transform(1, -0.17, 0, 1, 0, 0);
    ctx.strokeStyle = "#D9D2C2"; ctx.lineWidth = 0.7; ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (P.clock) {
      this.circ(ctx, 0, 0, 7, "#FFFDF5", 0.9); ctx.fillStyle = INK;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillRect(Math.cos(a) * 5.6 - 0.35, Math.sin(a) * 5.6 - 0.35, 0.7, 0.7); }
      ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 4.6); ctx.moveTo(0, 0); ctx.lineTo(-2.6, -1.5); ctx.stroke();
    } else if (P.grid) {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) ctx.strokeRect(-8.5 + i * 8.5, -8 + j * 8.5, 8, 8);
      ctx.font = `800 6.4px 'M PLUS Rounded 1c', sans-serif`; P.grid.forEach((g, i) => { ctx.fillStyle = i ? "#C9C2B2" : col; ctx.fillText(g, -4.5 + (i % 2) * 8.5, -4 + Math.floor(i / 2) * 8.5); });
    } else {
      ctx.font = `800 4.6px 'M PLUS Rounded 1c', sans-serif`;
      P.rows.forEach((r, i) => { ctx.fillStyle = INK; ctx.fillText(r, -0.5, -6 + i * 6); ctx.beginPath(); ctx.moveTo(-8, -3.2 + i * 6); ctx.lineTo(7, -3.2 + i * 6); ctx.stroke(); });
    }
    ctx.restore();
    // かいて いる もじ（だんだん ふえる）
    const n = Math.min(4, S.beat + 1);
    ctx.strokeStyle = "#5A5550"; ctx.lineWidth = 0.9;
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(4, y - 5 + i * 4.4); ctx.lineTo(4 + (i === n - 1 && S.ev === "write" ? Math.min(14, S.evT * 10) : 14), y - 6.6 + i * 4.4); ctx.stroke(); }
    // えんぴつ
    const k = S.ev === "write" ? Math.min(1, S.evT / 1.4) : 1, px = 4 + 14 * k, py = y - 6 + (n - 1) * 4.4 + Math.sin(T * 14) * 0.6;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.9); this.rr(ctx, -1.6, -16, 3.2, 14, 1, "#FFD54F", 0.9); ctx.fillStyle = "#F4D9A6"; ctx.beginPath(); ctx.moveTo(-1.6, -2); ctx.lineTo(0, 1.6); ctx.lineTo(1.6, -2); ctx.closePath(); ctx.fill(); ctx.restore();
    // はなまる（おわり）
    if (S.ev === "stamp") {
      const a = Math.min(1, S.evT / 0.8);
      ctx.save(); ctx.translate(-11, y - 1); ctx.scale(a, a); ctx.strokeStyle = "#E53935"; ctx.lineWidth = 1.3;
      for (let i = 0; i < 5; i++) { const t2 = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(t2) * 5.4, Math.sin(t2) * 5.4, 2.8, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); for (let t2 = 0; t2 < Math.PI * 5; t2 += 0.2) { const r = 0.6 + t2 * 0.28; ctx.lineTo(Math.cos(t2) * r, Math.sin(t2) * r); } ctx.stroke();
      ctx.restore();
    }
  },
  // ドリルの ひだりの ページ（grid: こくごの ます〔はじめが おてほん〕・rows: さんすうの しき・clock: とけい）
  DRILL_PAGE: {
    hiragana: { grid: ["あ", "あ", "ぬ", "め"] }, katakana: { grid: ["シ", "ツ", "ソ", "ン"] }, kanji: { grid: ["山", "川", "林", "森"] },
    kotoba: { rows: ["おおきい ↔", "あつい ↔", "はやい ↔"] }, bunsho: { rows: ["だれが？", "どこで？", "どうして？"] },
    tashi: { rows: ["3 + 4 =", "8 + 5 =", "9 + 6 ="] }, hiki: { rows: ["10 − 3 =", "13 − 8 =", "5 − 2 ="] }, kuku: { rows: ["2 × 2 =", "7 × 8 =", "8 × 9 ="] },
    tokei: { clock: true }, math: { rows: ["x + 3 = 5", "2x = 8", "(−2)×(−3)"] },
  },
  // ---- PokaDebug・テスト ----
  state(sc) {
    const S = this.st(sc);
    return { phase: S.phase, kind: S.kind, item: S.item || null, cat: S.cat || null, holder: S.holder || null, house: !!S.house, order: S.order ? [...S.order] : [], beat: S.beat, beats: S.kind ? this.D()[S.kind].beats.length : 0, ev: S.ev, t: Math.round((S.t || 0) * 10) / 10, next: Math.round(S.next * 10) / 10,
      plays: S.plays, last: S.last, why: S.why || null, via: S.via || null, winner: S.winner || null, spot: S.spot ? { ...S.spot } : null, form: S.kind ? this.D()[S.kind].form : null, P: S.order ? S.order[S.P % 3] : null, can: this.can(sc),
      options: this.options(sc).map((o) => ({ who: o.who, item: o.item.id, kind: o.kind, house: o.house })), log: (sc.life ? sc.life.log : []).filter((l) => l.play).map((l) => ({ id: l.id, text: l.text, at: l.at, play: l.play })),
      kids: sc.chars.map((c) => ({ id: c.id, state: c.state, play: this.playing(c), x: Math.round(c.x), y: Math.round(c.y), dir: c.dir, hand: !!(this.playing(c) && PlayGoods.heldBy(c.id) && c.id === S.holder) })) };
  },
};

// ---- つなぎ ----
(() => {
  const P = HouseScene.prototype, wrap = (name, fn) => { const orig = P[name]; P[name] = function (...a) { return fn.call(this, orig, ...a); }; };
  wrap("enter", async function (orig, ...a) { this.play = null; return orig.apply(this, a); });
  wrap("update", function (orig, dt) { const r = orig.call(this, dt); HomePlay.update(this, dt); return r; });
  // あそぶ: かくれんぼ・ボールあそびの あとに もって いる もの（だれが もって いるか）と おうちに ある ものの しゅるい（ばんごうは かえない）。
  // しゅるいを えらぶと どれに するかは 3人が えらぶ（HomePlay.choose）。まどは いちばん おおくて 9こ（もって いる 3・しゅるい 3）
  wrap("menuPlay", async function (orig) {
    if (this.guest) return orig.call(this);
    const ops = HomePlay.options(this);
    if (!ops.length) {
      const i = await UI.ask("なにして あそぶ？\n（コンビニや Meeときょれじゃ で トランプや ほん・ドリルが かえるよ）", ["かくれんぼ", "ボールあそび", "やめる"]);
      if (i === 0) this.startHide(); else if (i === 1) this.startBall();
      return;
    }
    const held = ops.filter((o) => !o.house), cats = Object.keys(HomePlay.CAT_ASK).filter((cat) => ops.some((o) => o.house && o.item.playCat === cat));
    const name = (id) => Save.d.chars[id].name, labels = [...held.map((o) => `${o.item.name}（${name(o.who)}）`), ...cats.map((cat) => HomePlay.CAT_ASK[cat])];
    const i = await UI.ask("なにして あそぶ？", ["かくれんぼ", "ボールあそび", ...labels, "やめる"]);
    if (i === 0) { this.startHide(); return; }
    if (i === 1) { this.startBall(); return; }
    let o = null;
    if (i >= 2 && i < 2 + held.length) o = held[i - 2];
    else if (i >= 2 + held.length && i < 2 + labels.length) { const cat = cats[i - 2 - held.length]; o = HomePlay.choose(this, ops.filter((x) => x.item.playCat === cat)); }
    if (o && !HomePlay.start(this, o.who, o.item.id, "menu")) UI.toast("いまは できないみたい…");
  });
  // あそんで いる 子を タップ: なでても やめない
  wrap("up", function (orig, p) {
    if (p && p.tap && HomePlay.on(this) && !this.mode && !this.gesture && !this.panDrag?.moved && !(this.fingers && this.fingers.size > 1)) {
      const c = this.chars.filter((k) => !k.hidden).sort((x, y) => this.depth(y) - this.depth(x)).find((k) => this.contains(this.actorRect(k), p));
      if (c && HomePlay.playing(c)) {
        this.fingers.delete(p.id); this.panDrag = null;
        this.fx("heart", c); Sound.voice(c.id);
        if (typeof PlayRecords !== "undefined") { try { PlayRecords.add(c.id, "pat"); } catch (e) { /* きろくが なくても なでる */ } }
        HomeLife.say(this, c.id, U.pick(HOME_PLAY_DATA.cheer[c.id]), false, "say", { play: this.play.kind, at: "cheer" });
        return;
      }
    }
    return orig.call(this, p);
  });
  // したの ボタンを おすと やめてから その こと（キャプチャで ボタンより さきに）
  wrap("buildUI", function (orig, ...a) {
    const r = orig.apply(this, a);
    if (this.bar) this.bar.addEventListener("click", () => { if (HomePlay.on(this)) HomePlay.stop(this, "button"); }, true);
    return r;
  });
  // つかって いる もの は 手に もたない（canvas で 描く）。おうちに ある ものは あつまる あいだ とりだした 子が もって あるく（絵だけ・もちものは かえない）
  wrap("charOpts", function (orig, c, ...a) {
    const o = orig.call(this, c, ...a), S = this.play;
    if (S && S.phase && S.phase !== "gather" && HomePlay.playing(c) && o.outfit && o.outfit.hand && PlayGoods.isPlay(o.outfit.hand)) o.outfit = { ...o.outfit, hand: null };
    else if (S && S.phase === "gather" && S.house && c.id === S.holder && o.outfit) o.outfit = { ...o.outfit, hand: S.item };
    return o;
  });
  const visual = HomeActions.visual;
  HomeActions.visual = function (c) { return HomePlay.playing(c) ? HomePlay.visual(c) : visual.call(this, c); };
  const props = HomeActions.props;
  HomeActions.props = function (sc, ctx, c, p, s) { return HomePlay.playing(c) ? HomePlay.props(sc, ctx, c, p, s) : props.call(this, sc, ctx, c, p, s); };
  // ゆかの うえの ばん・こま・シャボンだま（へやの 絵の ならびに いれる。HouseScene.render が よぶ）
  HomePlay.drawables = (sc, list, ctx) => {
    const S = sc.play; if (!S || !S.phase || S.phase === "gather" || !S.spot) return;
    const z = sc.depth(S.spot) + (S.kind === "bubbles" ? 400 : S.kind === "koma" ? sc.depth(S.pos[S.holder] || S.spot) - sc.depth(S.spot) + 44 : 0.2);
    list.push({ z, draw: () => HomePlay.floorDraw(sc, ctx) });
  };
  // あそんで いる あいだは ほかの みんなの うごきを おやすみ
  const care = ParentCare.update;
  ParentCare.update = function (sc, dt) { if (HomePlay.on(sc)) sc.parentTimer = Math.max(sc.parentTimer || 0, 2); return care.call(this, sc, dt); };
  if (typeof GowagaWish !== "undefined") { const house = GowagaWish.house; GowagaWish.house = function (sc, dt) { if (HomePlay.on(sc)) return; return house.call(this, sc, dt); }; }
  if (typeof HomeToilet !== "undefined") { const calm = HomeToilet.calm; HomeToilet.calm = function (sc) { return !HomePlay.on(sc) && calm.call(this, sc); }; }
  if (typeof HomeDoze !== "undefined") { const can = HomeDoze.can; HomeDoze.can = function (sc) { return !HomePlay.on(sc) && can.call(this, sc); }; }
})();
