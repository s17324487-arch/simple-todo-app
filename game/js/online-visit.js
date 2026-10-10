// オンライン（E5・UI-97）: ほかの 人の おうちに 3人で おじゃまする。
// オーナーの FB（2026-10-06）「他人のお家も自分のお家みたいに、ごわがが、おじゃまできるようにしろ。」（まえは 見るだけの まど・UI-95）
// - すまほの「みんな」→「おうち」の いちらんで えらぶ → その おへやを 1けん よんで（v1/rooms/{uid}・js/online-rooms.js の fetchRoom。よんだ データは しんじない decode）
//   → おじゃまの 画面（SCENES.visit）。よむ だけで、あたらしく おくる ものは ない（ネットに つなぐのは いままでどおり js/online-net.js だけ）。
// - おうちと おなじ 画面（VisitScene は HouseScene を うけつぐ）: ひだりの ドアから 3人で はいって、家具を よけて あるく（HomeNav）・しぐさ（HomeActions）・
//   なでる・こいぬ（PetWalk）・ピンチで ズーム・さわれる 家具（あかり・テレビ・ピアノ・音楽プレイヤー など。うごきは この 画面の あいだ だけ）・
//   あそぶ（かくれんぼ・ボール）・ごはん（じぶんの もちもの）・きがえ・よその おうちの ことば。
// - よその おうちは かえない: もようがえ・フィギュア だいの いれかえ・ドア・2かい・トイレ・ぱぱ まま・おねがい は うごかない
//   （ほかの ファイルが つつむ まえの おうちの うごき HOUSE_SCENE_BASE〔js/scene-house.js〕を つかう）。よんだ おへやは この 画面の あいだ だけ（セーブしない・サーバーに かかない）。
//   3人の おなか・ごきげん・きがえ・なでなでの きろく など じぶんの 3人の ことは ふだんどおり。
// - 「かえる」（または はいって きた ひだりの ドア）で きた ところ（まち・たてもの・おみせ・おうち）へ もどる。
//   おじゃま から つづけて ほかの おうちへ いっても、もどる ところは さいしょの まま。
const OnlineVisit = {
  wait: 0, // よみこみ中の ばんごう（すまほを とじたら 0 に して いかない）
  seq: 0,
  // ふつうの ひとこと
  LINES: {
    wanko: ["{host}さんの おうち、すてきだね！", "クンクン……ちがう おうちの におい！", "おじゃまして よかったね！", "ぼくたちの おへやも がんばろう！", "{host}さん、いま なに してるかな？", "ひろびろ してて きもちいいね"],
    gachan: ["かべがみの いろ、かわいい♪", "おへやの ならべかた、まねしたいな", "ぴよ♪ {host}さんの センス すき！", "おぎょうぎ よく しようね", "ゆかも ぴかぴか だね", "かえったら もようがえ したいな♪"],
    goji: ["ガォー！ ひろーい！", "ガゥー、よその おうち どきどきする", "ガゥー♪ ここ たのしい！", "{host}さんにも あって みたいな", "ここで おひるね したいな……", "ガゥー、また あそびに こようね"],
  },
  // そばの 家具の ひとこと（{furn} は いちばん ちかい 家具の なまえ）
  NEAR: {
    wanko: ["この {furn}、かっこいい！", "ぼくの おへやにも {furn} おきたいな", "{furn}、さわっても いいかな？"],
    gachan: ["{furn}、すてき！ どこで かったのかな", "{furn}の いろ、かわいいね♪", "{furn}の おきかた じょうず！"],
    goji: ["{furn}で おひるね したいな……", "ガゥー、{furn} おおきい！", "{furn}、ぼくも ほしい〜"],
  },
  // 3人の かけあい
  TALKS: [
    [["wanko", "この おへやで なにが いちばん すき？"], ["gachan", "わたしは かべがみ！"], ["goji", "ガゥー、ぜんぶ！"]],
    [["gachan", "おうちに かえったら もようがえ しようか"], ["wanko", "さんせい！"], ["goji", "ガォー、たのしみ！"]],
    [["goji", "ガゥー、{host}さんって どんな ひと かな？"], ["wanko", "きっと やさしい ひとだよ"], ["gachan", "おへやを みれば わかるね♪"]],
    [["wanko", "そろそろ かえる じかんかな？"], ["goji", "ガゥー、もう ちょっと いたい！"], ["gachan", "じゃあ もう すこしだけね♪"]],
  ],
  // じぶんが みせた おへやに きた とき
  MINE: [["wanko", "あれ？ ぼくたちの おへやだ！"], ["gachan", "みんなには こう みえるんだね♪"], ["goji", "ガゥー、なんだか ふしぎ"]],

  // ---- よんだ おへや → この 画面の へや（OnlineRooms.decode の あと。もとの データは かえない）----
  guest(p) {
    const r = p && p.room;
    if (!r || typeof r !== "object" || !Array.isArray(r.items)) return null;
    const own = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k); // __proto__ などは しらない もの
    const room = { k: r.k, wall: own(WALL_INDEX, r.wall) ? r.wall : WALLPAPERS[0].id, floor: own(FLOOR_INDEX, r.floor) ? r.floor : FLOORS[0].id, size: HomeDesign.SIZE_KEYS.includes(r.size) ? r.size : "standard", n: r.n, t: r.t,
      items: r.items.filter((it) => it && own(FURN_INDEX, it.id) && Number.isFinite(it.x) && Number.isFinite(it.y)).map((it, i) => ({ uid: "v" + i, id: it.id, x: it.x, y: it.y, flip: !!it.flip, ...(it.wallSide === "left" ? { wallSide: "left" } : {}), ...(Array.isArray(it.figs) ? { figs: it.figs.slice() } : {}) })) };
    const mine = !!p.uid && typeof OnlineNet !== "undefined" && p.uid === OnlineNet.uid();
    return { room, uid: String(p.uid || ""), mine, name: r.n ? Online.nickText(r.n) : "", roomName: OnlineRooms.roomName(r.k), back: p.back || { scene: "house", p: {} } };
  },
  title(g) { return (g.name ? `${g.name}さんの おうち` : "だれかの おうち") + (g.mine ? "（あなた）" : ""); },
  fill(sc, text, near) { const g = sc.guest; return text.replace(/\{host\}/g, g.name || "だれか").replace(/\{furn\}/g, near ? near.name : "かぐ"); },
  hello(sc) {
    if (sc.guest.mine) return this.MINE.map(([who, text]) => ({ who, text }));
    return [{ who: "wanko", text: this.fill(sc, sc.guest.name ? "{host}さん、おじゃまします！" : "おじゃまします！") }, { who: "gachan", text: "わあ、すてきな おへや♪" }, { who: "goji", text: "ガゥー、おじゃまします！" }];
  },
  // ときどきの ひとこと・かけあい（HomeLife.say／converse で ふきだし）
  chat(sc) {
    const kids = sc.chars.filter((c) => !c.hidden);
    if (!kids.length) return;
    if (U.chance(0.3)) { HomeLife.converse(sc, U.pick(this.TALKS).map(([who, text]) => ({ who, text: this.fill(sc, text) }))); return; }
    const c = U.pick(kids), near = HomeLife.nearFurn(sc, c)[0];
    HomeLife.say(sc, c.id, this.fill(sc, U.pick(near && U.chance(0.55) ? this.NEAR[c.id] : this.LINES[c.id]), near));
    sc.fx(U.pick(["note", "heart", "dots"]), c);
  },
  // この 画面の 時間（ふきだし・かけあい・うごく 家具・ひとこと。HomeLife.update の よその おうち ばん: けんか・ぱぱ まま・おうちの できごと は ない）
  life(sc, dt) {
    const l = sc.life;
    if (document.hidden || UI.busy || sc.mode) { for (const b of l.bubbles) b.born += dt; return; }
    l.time += dt;
    l.bubbles = l.bubbles.filter((b) => (b.left -= dt) > 0);
    HomeLife.advance(sc, dt);
    for (const uid in l.furniture) { l.furniture[uid] -= dt; if (l.furniture[uid] <= 0) delete l.furniture[uid]; }
    if (!l.queue.length && (l.next -= dt) <= 0) { this.chat(sc); l.next = U.rand(16, 28); }
  },

  // ---- いく・もどる ----
  // いまの 画面から もどる ところ（{ scene, p }）。おじゃまの なかから つづけて いく ときは さいしょの ところ
  backOf() {
    const sc = G.scene, n = G.sceneName, w = sc && sc.party && sc.party[0];
    if (!sc) return null;
    if (n === "visit") return sc.guest ? sc.guest.back : null;
    if (n === "house") return { scene: "house", p: {} };
    if (n === "world" && w) return { scene: "world", p: { map: sc.mapId, x: w.tx, y: w.ty, dir: w.dir } };
    if (n === "venue" && w && sc.def && !sc.closed) return { scene: "venue", p: { venue: sc.id, floor: sc.floor, back: { ...sc.back }, at: [w.tx, w.ty] } };
    if (n === "store" && sc.shopId && !sc.closed) return { scene: "store", p: { shop: sc.shopId, back: { ...sc.back } } };
    return null;
  },
  // よんだ おへやに いく（すまほを とじて 画面を きりかえる）
  start(room, uid) {
    const back = this.backOf();
    if (!room || !back || Game.trans) return false;
    if (typeof Smaho !== "undefined" && Smaho.view) Smaho.close();
    Sound.se("door");
    Game.goto("visit", { room, uid, back }, "circle");
    return true;
  },
  // いちらんの 1けん（entry: OnlineRooms.load の { uid, n, ... }）を よんで いく。btn は おした ぎょう
  async go(entry, btn) {
    if (!entry || this.wait) return false;
    if (!this.backOf()) { UI.toast("ここからは おじゃま できないよ"); return false; }
    const token = this.wait = ++this.seq, sub = btn && btn.querySelector(".onl-sub"), was = sub ? sub.textContent : "";
    if (btn) { btn.disabled = true; btn.classList.add("loading"); if (sub) sub.textContent = "よみこんで いるよ…"; }
    let room = null;
    try { room = await OnlineRooms.fetchRoom(entry.uid); } catch (e) { room = null; }
    const live = this.wait === token;
    if (live) this.wait = 0;
    if (btn) { btn.disabled = false; btn.classList.remove("loading"); if (sub) sub.textContent = was; }
    if (!live) return false; // とちゅうで すまほを とじた
    if (!room) { UI.toast("この おへやは もう みられないよ（けされたか、よめなかったよ）"); return false; }
    return this.start(room, entry.uid);
  },
  cancel() { this.wait = 0; },
  home(sc) { const b = sc.guest && sc.guest.back; Game.goto(b && SCENES[b.scene] ? b.scene : "house", b && SCENES[b.scene] ? b.p : {}, "circle"); },
};

// ---- おじゃまの 画面（おうちの 画面を うけつぐ）----
class VisitScene extends HouseScene {
  async enter(p = {}) {
    const g = this.guest = OnlineVisit.guest(p) || OnlineVisit.guest({ room: { items: [] }, back: p.back });
    HomeDesign.guestSize = g.room.size;
    this.mode = null;
    this.zoom = 1; this.pan = { x: 0, y: 0 };
    this.fingers = new Map(); this.pinch = null; this.gesture = false;
    this.fxs = [];
    this.life = HomeLife.blank(); this.life.next = 12; this.parents = []; HomeActions.init(this);
    // よその データ・ひろさが ちがう ことも ある ので へやの なかに おさめる（この 画面の コピー だけ）
    for (const it of g.room.items) this.clampItem(it);
    // 3人で ひだりの ドア（はいって きた ドア）から はいる
    this.chars = Save.d.order.map((id, i) => ({ id, x: 34, y: ROOM.WALL + 58 + i * 20, dir: "right", state: "walk", tx: 0, ty: 0, t: 1, anim: Math.random() * 2, emo: null, hidden: false, jumpT: -1 }));
    this.chars.forEach((c, i) => { const q = HomeNav.near(this, 132 + i * 64, ROOM.WALL + 118 + (i % 2) * 36); c.tx = q.x; c.ty = q.y; });
    this.layout();
    await Promise.all([this.preloadChars(), this.preloadFurn(), this.buildBg()]);
    Sound.bgm("house");
    UI.showHud(true, ""); // ばしょの なまえは うえの ひょうさつ
    this.buildUI();
    // パソコンでは マウスの ホイール（トラックパッドの ピンチ）で ズーム（おうちと おなじ）
    this.onWheel = (e) => { e.preventDefault(); if (!this.pinchable() || Game.inputLocked) return; const r = G.canvas.getBoundingClientRect(); this.zoomAt(this.zoom * Math.exp(-U.clamp(e.deltaY, -120, 120) * 0.0022), ((e.clientX - r.left) / r.width) * G.W, ((e.clientY - r.top) / r.height) * G.H); };
    G.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    setTimeout(() => { if (G.scene === this && !this.mode) HomeLife.converse(this, OnlineVisit.hello(this)); }, 700);
  }
  exit() {
    HOUSE_SCENE_BASE.exit.call(this);
    HomeDesign.guestSize = null;
    if (typeof FurnLive !== "undefined") FurnLive.forget();
  }
  // うえの ひょうさつ・したの ボタン 1だん
  insets() { return [112, 92]; }
  buildUI() {
    const g = this.guest;
    this.ui = U.el("div", { class: "visit-ui" });
    this.plate = U.el("div", { class: "visit-plate" }, [U.el("b", { text: OnlineVisit.title(g) }), U.el("span", { text: `${g.roomName}・かぐ ${g.room.items.length}こ` })]);
    this.bar = U.el("div", { class: "house-bar visit-bar" });
    const B = (icon, label, fn, cls = "") => {
      const b = U.el("button", { class: "btn " + cls, html: `${HOUSE_ICONS[icon]}<span>${label}</span>` });
      b.addEventListener("click", () => { if (this.mode || UI.busy || Game.trans) return; Sound.se("tap"); fn(); });
      return b;
    };
    this.bar.append(B("food", "ごはん", () => this.menuFood(), "yellow"), B("play", "あそぶ", () => this.menuPlay(), "pink"), B("dress", "きがえ", () => this.menuDress(), "blue"), B("out", "かえる", () => this.goBack(), "visit-back"));
    this.ui.append(this.plate, this.bar);
    document.getElementById("ui").append(this.ui);
  }
  showBar(on) { this.bar.classList.toggle("hidden", !on); this.plate.classList.toggle("hidden", !on); }
  // きた ところへ かえる（「おじゃましました！」）
  goBack() {
    if (this.mode || Game.trans) return;
    this.mode = "out";
    HomeLife.say(this, "wanko", "おじゃましました！");
    for (const c of this.chars) if (!c.hidden && c.id !== "wanko") this.react(c, "happy", "heart");
    Sound.se("door");
    setTimeout(() => { if (G.scene === this) OnlineVisit.home(this); }, 650);
  }
  update(dt) {
    OnlineVisit.life(this, dt);
    HomeActions.update(this, dt);
    for (const c of this.chars) this.updateChar(c, dt);
    this.fxs = this.fxs.filter((f) => (f.t += dt) < f.dur);
    if (this.darkTarget != null) this.dark = (this.dark || 0) + (this.darkTarget - (this.dark || 0)) * Math.min(1, dt * 4);
    if (this.mode === "ball" && this.ball) this.updateBall(dt);
    if (typeof PetWalk !== "undefined") PetWalk.houseUpdate(this, dt);
  }
  up(p) {
    const tap = !!(p && p.tap) && !this.mode && !this.gesture && !this.panDrag?.moved && !(this.fingers.size > 1);
    // こいぬ（js/pet-walk.js。おうちと おなじ）
    if (tap && typeof PetWalk !== "undefined" && PetWalk.houseTap(this, p)) { this.fingers.delete(p.id); this.panDrag = null; return; }
    // はいって きた ひだりの ドア → かえる？（まえに 3人・家具が ある ときは そっちが さき）
    if (tap && this.doorAt(p)) { this.fingers.delete(p.id); this.panDrag = null; this.askBack(); return; }
    return HOUSE_SCENE_BASE.up.call(this, p);
  }
  doorAt(p) {
    if (!this.contains(this.doorRect(), p)) return false;
    if (this.chars.some((c) => !c.hidden && this.contains(this.actorRect(c), p))) return false;
    const r = this.toRoom(p.x, p.y);
    return !this.hitItem(r.x, r.y);
  }
  async askBack() { if (await UI.confirm("おうちを でて かえる？", "かえる", "まだ いる")) this.goBack(); }
  pet(c) {
    const r = HOUSE_SCENE_BASE.pet.call(this, c);
    if (typeof PlayRecords !== "undefined") { try { PlayRecords.add(c.id, "pat"); } catch (e) { /* きろくが なくても なでる */ } } // なでなでの きろく（js/play-records.js。おうちと おなじ）
    return r;
  }
}
// ほかの ファイルが HouseScene に つつんだ うごき（ドア・2かい・トイレ・おねがい・きがえの かえし など）は つかわない: つつむ まえの ものに もどす
for (const [k, fn] of Object.entries(HOUSE_SCENE_BASE)) if (!Object.prototype.hasOwnProperty.call(VisitScene.prototype, k)) VisitScene.prototype[k] = fn;
SCENES.visit = VisitScene;
