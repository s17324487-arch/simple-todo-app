// UI-58: けいば ちゅうけい の がめん（SCENES.keiba）。ネリカス でんき 10F の おおきな がめんで みる レース。
// ながれ: しょうめんの ゲート と レースの なまえ（ファンファーレ）→ ゲートイン → スタート → よこから みる ちゅうけい（カメラは せんとうの むれを おう・
// ちず・のこりの きょり・タイム・いまの じゅんい・じっきょう）→ ゴール →（きわどい ときは しゃしん はんてい）→ ちゃくじゅんの ばん・かくてい → けっかと はらいもどしの まど。
// ・レースは ここに はいった ときに しめきる（KeibaCorner.start: ばけんは もう かえない・けっかは きまって いる）。とちゅうで やめても けっかは かわらない。
// ・3人は したで いっしょに みて おうえん する（わーい の ポーズ・ひとこと）。かった うまには ▼ と ちずの わ。
// ・はやさ: ほんものの じかんの 1.6〜3.4ばい（だいたい 30びょう）。「はやおくり」で その 2ばい・「とばす」で ゴールまで。
// PokaDebug: keibaWatch(no)・keibaSpeed(ばい)・keibaScene()（js/debug.js）。
class KeibaScene {
  async enter(p = {}) {
    this.back = p.back || null; this.day = p.day || KeibaRace.dayKey(); this.no = p.no || 1;
    this.rc = KeibaRace.race(this.day, this.no); this.res = KeibaRace.result(this.rc);
    this.set = KeibaCorner.start(this.day, this.no);
    this.mine = new Set(this.set.horses);
    this.t = 0; this.rt = 0; this.phase = "intro"; this.ff = 1; this.flash = 0; this.fired = new Set(); this.line = ""; this.lineT = -9; this.bubble = null; this.done = false;
    this.base = U.clamp(this.res.tw / 34, 1.6, 3.4);
    this.last = Math.max(...this.rc.horses.map((h) => KeibaRace.finishAt(this.rc, h.no)));
    this.photo = this.res.cum[1] - this.res.cum[0] < 0.2;
    this.cam = { cx: -8, wm: 18 }; this.hoofT = 0; this.cheerT = 0;
    this.pos = KeibaRace.pos(this.rc, 0);
    UI.showHud(false); Sound.stopBgm();
    this.buildUI(); this.resize();
    const size = this.g.cs, list = Save.d.order.flatMap((id) => [[id, this.look(id, "normal", null)], [id, this.look(id, "happy", "wai")], [id, this.look(id, "happy", null)]]);
    await Promise.all([KeibaArt.preload(this.rc), Chara.preload(list, size)]);
    if (Sound.ctx && Save.d.settings.se) Sound.jingle("keiba_fanfare");
  }
  exit() { this.closed = true; this.ui?.remove(); }
  get speed() { return (KeibaScene.speed || 1) * this.base * this.ff; }
  look(id, face, gesture) { const c = Save.d.chars[id]; return { pose: "idle_01", dir: "down", face, outfit: c.outfit, color: c.color, ...(gesture ? { gesture } : {}) }; }
  // ---- ボタン（はやおくり・とばす）----
  buildUI() {
    this.ui?.remove();
    const ui = (this.ui = U.el("div", { class: "kb-ui" }));
    this.ffBtn = UI.btn("はやおくり", () => { this.ff = this.ff > 1 ? 1 : 2; this.ffBtn.classList.toggle("yellow", this.ff > 1); Sound.se("tap"); }, "small kb-ff");
    this.skipBtn = UI.btn("とばす", () => this.skip(), "small kb-skip");
    ui.append(this.ffBtn, this.skipBtn); UI.root.append(ui);
  }
  skip() {
    if (this.phase === "board" || this.phase === "result" || this.done) return;
    Sound.se("tap"); this.phase = "race"; this.rt = this.last + 1.4; this.fired.add("finish"); this.say("ゴール！ " + this.winText());
  }
  // ---- がめんの かたち ----
  resize() {
    const W = G.W, H = G.H, top = 64, vh = Math.round(U.clamp(H * 0.47, 250, 380)), vb = top + vh, info = vb + 6, chips = info + 30, panel = chips + 40, bottom = H - 66;
    this.g = { W, H, top, vh, vb, info, chips, panel, bottom, cs: Math.round(Math.min(96, Math.max(60, (bottom - panel) * 0.62))) };
  }
  // ---- じっきょう ----
  say(text) { this.line = text; this.lineT = this.t; }
  cheer(lines, dur = 2.2) { this.bubble = { lines, t: this.t, dur }; }
  name(no) { return no + "ばん " + this.rc.horses[no - 1].name; }
  winText() { return this.name(this.res.order[0]) + "、1ちゃくで ゴールイン！"; }
  order() { return this.pos.slice().sort((a, b) => b.s - a.s).map((p) => p.no); }
  events() {
    const rc = this.rc, D = rc.dist, lead = Math.max(...this.pos.map((p) => p.s)), rem = D - lead, ord = this.order(), F = (k, cond, fn) => { if (!this.fired.has(k) && cond) { this.fired.add(k); fn(); } };
    F("start", this.rt > 0.05, () => { this.say("ゲートが ひらいて スタート！"); Sound.se("keiba_gate"); this.cheer({ wanko: "がんばれー！", gachan: "ぴよ〜 はしった！", goji: "ガゥー！ いけいけ！" }); });
    F("lead", this.rt > 7, () => this.say("まず ハナに たったのは " + this.name(ord[0]) + "。"));
    F("mid", lead > D * 0.38 && rem > 700, () => this.say(ord[0] + "ばん、" + ord[1] + "ばん と つづいて、うしろの ほうに " + ord[ord.length - 1] + "ばん。"));
    F("c3", rem < 1000 && rem > 650 && D >= 1600, () => this.say("3コーナー から 4コーナーへ。せんとうは " + this.name(ord[0]) + "！"));
    F("c4", rem < 600, () => { this.say("4コーナーを まわって さいごの ちょくせん！"); Sound.se("keiba_cheer"); });
    F("r400", rem < 400, () => { const mover = this.mover(ord); this.say(ord[0] + "ばんが がんばる！ " + (mover ? "そとから " + mover + "ばんが おいこんで くる！" : "うしろは まだ くるか！")); this.cheer({ wanko: "いけー！", gachan: "がんばれ〜！", goji: "ガォー！" }, 3); });
    F("r200", rem < 200, () => { this.say("のこり 200！ " + ord[0] + "ばんか " + ord[1] + "ばんか！"); Sound.se("keiba_cheer"); });
    F("finish", lead >= D, () => { this.say((this.photo ? "ならんで ゴール！ " : "") + this.winText()); Sound.se("keiba_goal"); });
  }
  // さいごに いちばん まえへ でて くる うま（いまの 5ばん いないで、ゴールの じゅんいの ほうが よい）
  mover(ord) { const top = ord.slice(0, 5); let best = 0, who = 0; for (const no of top) { const fin = this.res.order.indexOf(no), now = top.indexOf(no), gain = now - fin; if (gain > best) { best = gain; who = no; } } return who; }
  // ---- うごき ----
  update(dt) {
    if (this.closed) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 2.5);
    const rc = this.rc;
    if (this.phase === "intro" && this.t > 3.6) { this.phase = "gate"; this.say("ゲートイン かんりょう。"); }
    if (this.phase === "gate" && this.t > 5.2) { this.phase = "open"; this.openT = this.t; Sound.se("keiba_gate"); }
    if (this.phase === "open" && this.t - this.openT > 0.45) { this.phase = "race"; this.rt = 0.06; }
    if (this.phase === "race") {
      this.rt += dt * this.speed;
      this.pos = KeibaRace.pos(rc, this.rt);
      this.events();
      // カメラ（せんとうの むれ）
      const ss = this.pos.map((p) => p.s).sort((a, b) => b - a), lead = ss[0], sixth = ss[Math.min(5, ss.length - 1)];
      const wm = U.clamp(lead - sixth + 8, 13, 26), cx = Math.min(lead, rc.dist + 14) - wm * 0.2, k = 1 - Math.exp(-dt * 4 * Math.max(1, this.speed / 2));
      this.cam.wm += (wm - this.cam.wm) * k; this.cam.cx += (cx - this.cam.cx) * k;
      if (this.rt < 1.5) { this.cam.cx = Math.max(this.cam.cx, lead - this.cam.wm * 0.3); }
      // あしおと・かんせい
      if (Sound.ctx && Save.d.settings.se) {
        this.hoofT -= dt; if (this.hoofT <= 0 && lead < rc.dist + 20) { this.hoofT = 0.11; Sound.noise(Sound.seGain, { dur: 0.06, vol: 0.05, freq: 170 + Math.random() * 60, q: 1.2 }); }
        this.cheerT -= dt; if (this.cheerT <= 0 && rc.dist - lead < 420 && lead < rc.dist + 30) { this.cheerT = 0.45; Sound.noise(Sound.seGain, { dur: 0.9, vol: 0.05 + 0.08 * U.clamp(1 - (rc.dist - lead) / 420, 0, 1), freq: 900, q: 0.35 }); }
      }
      if (this.rt >= this.last + 1.2) { this.phase = this.photo ? "photo" : "board"; this.phaseT = this.t; this.pos = KeibaRace.pos(rc, this.last + 1.2); if (this.photo) { this.say("しゃしん はんてい です。"); this.flash = 1; Sound.se("fs_shutter"); } }
    }
    if (this.phase === "photo" && this.t - this.phaseT > 1.6) { this.phase = "board"; this.phaseT = this.t; }
    if (this.phase === "board" && !this.boardSaid) { this.boardSaid = true; this.say("1ちゃく " + this.name(this.res.order[0]) + "。2ちゃく " + this.res.order[1] + "ばん、3ちゃく " + this.res.order[2] + "ばん。"); }
    if (this.phase === "board" && this.t - this.phaseT > 1.5 && !this.kakutei) { this.kakutei = true; Sound.se("keiba_kakutei"); this.say("かくてい しました！"); const hit = this.set.won > 0; this.cheer(hit ? { wanko: "やったー！ あたった！", gachan: "ぴよぴよ〜♪", goji: "ガォー♪ すごい！" } : this.set.tickets.length ? { wanko: "ざんねん…", gachan: "つぎは あたるよ！", goji: "ガゥ、おしかった" } : { wanko: "はやかったね！", gachan: "かっこいい〜", goji: "ガゥー！" }, 3.5); }
    if (this.phase === "board" && this.t - this.phaseT > 3.2 && !this.done) { this.done = true; this.phase = "result"; this.ui?.classList.add("kb-end"); this.showResult(); }
  }
  async showResult() { await KeibaUI.result(this.rc, this.set); this.leave(); }
  leave() { this.closed = true; this.ui?.remove(); if (this.back) Game.goto("venue", this.back, "circle"); else Game.goto("world", {}, "circle"); }
  // ---- 描く ----
  render(ctx) {
    const g = this.g, rc = this.rc, W = g.W;
    ctx.fillStyle = "#2E2A33"; ctx.fillRect(0, 0, W, g.H);
    const V = { x: 0, y: g.top, w: W, h: g.vh, cx: this.cam.cx, ppm: W / this.cam.wm, D: rc.dist, surf: rc.surf, weather: rc.weather, t: this.t, n: rc.n };
    if (this.phase === "intro" || this.phase === "gate" || this.phase === "open") KeibaArt.drawGate(ctx, V, rc, this.phase === "open" ? U.clamp((this.t - this.openT) / 0.35, 0, 1) : 0, this.t);
    else {
      V.horses = this.pos.map((p) => { const h = rc.horses[p.no - 1]; return { h, s: p.s, lane: p.lane, fr: Math.floor(p.s / 1.7 + p.no * 0.7) % 4, mine: this.mine.has(p.no) }; });
      KeibaArt.drawView(ctx, V);
      if (this.phase === "race") KeibaArt.drawMap(ctx, W - 116, g.top + 6, 110, 62, rc, this.pos, this.mine);
    }
    // うえの おび（レースの なまえ）・じっきょう
    ctx.fillStyle = "#3F7D5A"; ctx.fillRect(0, 0, W, 40); ctx.fillStyle = "#FFFFFF"; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(15); ctx.fillText(KeibaRace.title(rc), 10, 20, W * 0.62);
    ctx.textAlign = "right"; ctx.font = KeibaArt.FONT(11); ctx.fillText(KeibaRace.course(rc) + "・" + rc.going + "・" + rc.n + "とう", W - 8, 20, W * 0.36);
    ctx.fillStyle = "#FFFDF6"; ctx.fillRect(0, 40, W, 24); ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(12); ctx.fillText(this.line || "まもなく スタートです", 8, 52, W - 16);
    // まんなかの だい（はじまる まえ）
    if (this.phase === "intro" || this.phase === "gate") this.titleCard(ctx, g);
    if (this.phase === "photo" || this.phase === "board" || this.phase === "result") this.board(ctx, g);
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, g.top, W, g.vh); }
    // のこりの きょり・タイム・いまの じゅんい
    this.info(ctx, g);
    this.trio(ctx, g);
  }
  titleCard(ctx, g) {
    const rc = this.rc, W = g.W, a = U.clamp(this.t / 0.5, 0, 1), y = g.top + g.vh * 0.08;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(255,253,246,.94)"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, 24, y, W - 48, 92, 14); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#3F7D5A"; ctx.font = KeibaArt.FONT(13); ctx.fillText(rc.no + "R " + rc.post + " はっそう" + (rc.sub ? "・" + rc.sub : ""), W / 2, y + 18, W - 70);
    ctx.fillStyle = INK; ctx.font = KeibaArt.FONT(22); ctx.fillText(rc.name + (rc.grade ? "（" + rc.grade + "）" : ""), W / 2, y + 46, W - 70);
    ctx.font = KeibaArt.FONT(13); ctx.fillText(KeibaRace.COURSE.name + "・" + KeibaRace.course(rc) + "（" + rc.dir + "）・" + rc.weather + "・" + rc.going, W / 2, y + 74, W - 70);
    ctx.restore();
  }
  board(ctx, g) {
    const rc = this.rc, res = this.res, W = g.W, x = 18, y = g.top + 14, w = W - 36, rowH = Math.min(30, (g.vh - 70) / 5);
    if (this.phase === "photo") { ctx.fillStyle = "rgba(31,29,27,.55)"; ctx.fillRect(0, g.top + g.vh * 0.36, W, 46); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.font = KeibaArt.FONT(20); ctx.fillText("しゃしん はんてい", W / 2, g.top + g.vh * 0.36 + 23); return; }
    ctx.save(); ctx.fillStyle = "rgba(34,40,48,.94)"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, x, y, w, rowH * 5 + 46, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FFE27A"; ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(13); ctx.fillText("ちゃくじゅん", x + 12, y + 16);
    const lamp = this.kakutei; ctx.fillStyle = lamp ? "#E5483F" : "#5A5A62"; U.rr(ctx, x + w - 78, y + 6, 66, 22, 6); ctx.fill(); ctx.fillStyle = lamp ? "#FFFFFF" : "#9A9AA2"; ctx.textAlign = "center"; ctx.font = KeibaArt.FONT(12); ctx.fillText("かくてい", x + w - 45, y + 17);
    for (let i = 0; i < Math.min(5, rc.n); i++) {
      const no = res.order[i], h = rc.horses[no - 1], ry = y + 36 + i * rowH + rowH / 2;
      ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.font = KeibaArt.FONT(14); ctx.fillText(i + 1 + "", x + 16, ry);
      KeibaArt.chip(ctx, x + 42, ry, 10, no, h.waku, this.mine.has(no));
      ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(13); ctx.fillText(h.name, x + 62, ry, w - 160);
      ctx.textAlign = "right"; ctx.font = KeibaArt.FONT(11); ctx.fillStyle = "#CFE8D8"; ctx.fillText(i ? res.margins[i] : KeibaRace.fmtTime(res.time[0]), x + w - 12, ry, 80);
    }
    ctx.restore();
  }
  info(ctx, g) {
    const rc = this.rc, W = g.W, lead = Math.max(...this.pos.map((p) => p.s)), rem = Math.max(0, rc.dist - lead), racing = this.phase === "race";
    ctx.fillStyle = "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; U.rr(ctx, 8, g.info, W - 16, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(13);
    ctx.fillText(!racing && this.phase !== "photo" && this.phase !== "board" && this.phase !== "result" ? "スタートまで もう すこし" : rem > 0 ? "のこり " + (rem > 400 ? Math.ceil(rem / 100) * 100 : Math.ceil(rem / 10) * 10) + "m" : "ゴール！", 18, g.info + 13, W * 0.5);
    ctx.textAlign = "right"; ctx.fillText(racing || this.rt > 0 ? KeibaRace.fmtTime(Math.min(this.rt, this.res.time[0] + (lead >= rc.dist ? 0 : 999))) : "0:00.0", W - 18, g.info + 13);
    // いまの じゅんい（6とう まで）
    if (!(this.rt > 0)) return;
    const ord = lead >= rc.dist ? this.res.order : this.order();
    ctx.textAlign = "left"; ctx.font = KeibaArt.FONT(11); ctx.fillStyle = "#FFFFFF"; ctx.fillText(lead >= rc.dist ? "ちゃくじゅん" : "いまの じゅんい", 10, g.chips + 15);
    for (let i = 0; i < Math.min(6, ord.length); i++) KeibaArt.chip(ctx, 104 + i * 40, g.chips + 15, 13, ord[i], rc.horses[ord[i] - 1].waku, this.mine.has(ord[i]));
  }
  trio(ctx, g) {
    const W = g.W, ids = Save.d.order, ph = g.bottom - g.panel, roomy = ph >= 190, cheer = this.bubble && this.t - this.bubble.t < this.bubble.dur;
    ctx.fillStyle = "rgba(255,253,246,.08)"; U.rr(ctx, 8, g.panel, W - 16, ph, 12); ctx.fill();
    // かった ばけん（ひろい がめんは 3まい まで・せまい がめんは 1ぎょう）
    const tk = this.set.tickets, lines = roomy ? Math.min(3, tk.length) : 0, cs = Math.round(Math.min(g.cs, ph - 52 - lines * 15)), y = Math.min(g.bottom - 6, g.panel + 34 + lines * 15 + cs * 1.2);
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = KeibaArt.FONT(11); ctx.fillStyle = "#CFE8D8";
    ctx.fillText(!tk.length ? "ばけんは かって いないよ（みるだけ）" : roomy ? "かった ばけん" : "かった ばけん " + tk.reduce((a, t) => a + t.keys.length * t.u, 0) + "まい（" + tk.map((t) => KeibaRules.BY[t.t].name).filter((v, i, a) => a.indexOf(v) === i).join("・") + "）", 18, g.panel + 14, W - 36);
    for (let i = 0; i < lines; i++) { const t = tk[i]; ctx.fillStyle = "#FFFDF6"; ctx.fillText(KeibaCorner.ticketText(t) + "（" + t.keys.length * t.u + "まい）" + (i === 2 && tk.length > 3 ? "　ほか " + (tk.length - 3) + "まい" : ""), 18, g.panel + 30 + i * 15, W - 36); }
    ids.forEach((id, i) => {
      const x = W * (0.2 + i * 0.3), happy = cheer || this.phase === "result" || (this.kakutei && this.set.won > 0), jump = cheer ? Math.abs(Math.sin((this.t - this.bubble.t) * 7 + i)) * 8 : 0;
      Chara.draw(ctx, id, this.look(id, happy ? "happy" : "normal", cheer ? "wai" : null), x, y - jump, cs);
      if (cheer && this.bubble.lines[id]) this.balloon(ctx, x, y - cs * 1.2 - 4, this.bubble.lines[id], i);
    });
  }
  balloon(ctx, x, y, text, i) {
    ctx.save(); ctx.font = KeibaArt.FONT(11); const w = Math.min(108, ctx.measureText(text).width + 16), bx = U.clamp(x - w / 2, 6, this.g.W - w - 6), by = y - 24 - (i % 2) * 8;
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; U.rr(ctx, bx, by, w, 24, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, by + 24); ctx.lineTo(x, by + 31); ctx.lineTo(x + 5, by + 24); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, bx + w / 2, by + 12, w - 10); ctx.restore();
  }
  // PokaDebug
  state() { return { phase: this.phase, no: this.no, day: this.day, rt: Math.round(this.rt * 10) / 10, line: this.line, lead: Math.round(Math.max(...this.pos.map((p) => p.s))), dist: this.rc.dist, order: this.order(), result: this.res.order.slice(0, 3), mine: [...this.mine], won: this.set.won, photo: this.photo, kakutei: !!this.kakutei, cam: { cx: Math.round(this.cam.cx), wm: Math.round(this.cam.wm) } }; }
}
SCENES.keiba = KeibaScene;
KeibaScene.speed = 1; // PokaDebug.keibaSpeed（テスト）

// ファンファーレ（この ゲームの ために つくった みじかい きょく）
SONGS.keiba_fanfare = {
  title: "ぽかぽか ファンファーレ", bpm: 132, modern: true, once: true, groove: "classic", swing: 0,
  tracks: [
    { instrument: "lead", vol: 0.15, gate: 0.85, pan: 0.06, notes: "G4 . C5 . E5 . G5 . . . E5 G5 C6 . . . | A5 . G5 . E5 . C5 . D5 . E5 . D5 . . . | G4 . C5 . E5 . G5 . . . E5 G5 C6 . . . | D6 . C6 . B5 . A5 . G5 . . . C6 . . ." },
    { instrument: "chip", vol: 0.06, gate: 0.8, pan: -0.12, notes: "E4 . G4 . C5 . E5 . . . C5 E5 G5 . . . | F5 . E5 . C5 . A4 . B4 . C5 . B4 . . . | E4 . G4 . C5 . E5 . . . C5 E5 G5 . . . | B5 . A5 . G5 . F5 . E5 . . . E5 . . ." },
    { instrument: "bass", vol: 0.17, gate: 0.7, pan: 0, notes: "C3 . . . G2 . . . C3 . . . E3 . . . | F2 . . . C3 . . . G2 . . . . . . . | C3 . . . G2 . . . C3 . . . E3 . . . | F2 . . . G2 . . . C3 . . . . . . ." },
  ],
};
// こうかおん（ゲートが ひらく・かんせい・ゴール・かくてい）
(() => {
  const se0 = Sound.se;
  Sound.se = function (name) {
    if (name === "keiba_gate" || name === "keiba_cheer" || name === "keiba_goal" || name === "keiba_kakutei") {
      if (!this.ctx || !Save.d || !Save.d.settings.se) return;
      if (name === "keiba_gate") { this.noise(this.seGain, { dur: 0.18, vol: 0.32, freq: 700, q: 0.9 }); this.tone(this.seGain, { f: 180, f2: 90, dur: 0.16, type: "square", vol: 0.1 }); }
      else if (name === "keiba_cheer") { this.noise(this.seGain, { dur: 1.6, vol: 0.14, freq: 1000, q: 0.3 }); this.noise(this.seGain, { t: 0.2, dur: 1.4, vol: 0.1, freq: 1700, q: 0.4 }); }
      else if (name === "keiba_goal") { this.noise(this.seGain, { dur: 2.2, vol: 0.2, freq: 1100, q: 0.3 }); ["C5", "E5", "G5", "C6"].forEach((n, i) => this.tone(this.seGain, { f: this.freq(n), t: 0.1 + i * 0.08, dur: i === 3 ? 0.4 : 0.07, type: "pulse", vol: 0.09 })); }
      else { this.tone(this.seGain, { f: 988, dur: 0.12, type: "square", vol: 0.1 }); this.tone(this.seGain, { f: 1319, t: 0.14, dur: 0.3, type: "square", vol: 0.1 }); }
      return;
    }
    return se0.call(this, name);
  };
})();
