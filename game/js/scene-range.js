// ⑥ 射撃場の 画面（RangeScene・SCENES.range）。シティの「シティ シューティング レンジ」の 入口から 入り（scene-world.js の enterDoor）、おわると 入口の まえに もどる。
// 1番: ロビー（DOM の UI.modal）。はじめての ときは RO の ラビが 安全の きまりを 話す（RANGE_DATA.talk.first → Save.d.range.safety）。
//   だれが うつ？（3人から 1人。のこりの 2人は うしろで おうえん）→ しゅもくと じゅう（しゅるいの タブ・しゅもく 2つ・ルール・じゅう 3しゅ・せいのう・ホップ ダイヤル・まめちしき）。
//   ロックは RANGE_DATA.cats.*.unlock（まえの しゅるいの どれかの しゅもくで ★ いくつ）。ホップ ダイヤルは じゅう ごとに Save.d.range.hop に のこす。
// 2番: あそぶ 画面。ShootingRange.Game を まいフレーム うごかし、ShootingRange.draw で #screen に 主観の 画面を 描く。
//   うえに かさねる .range-scene（DOM）が HUD（game.hud()）・そうさ（うつ／のぞく／ボルト・レバー・こめる／リロード／いき・ズーム・おわり・✕）と ねらいの ドラッグを うける。
//   おわると けっか（.rg-result／.rg-sheet）・Save.d.range（plays・best）・コイン（GameEconomy.pay("range", 1, ★, むずかしさ)）。
//   絵は SvgCache: 的は ShootingRange.artKeys（14こ）・主観の じゅうは "rg:" + じゅう + ":" + だれ + ":" + いろ（9×3×2）。
class RangeScene {
  async enter(p = {}) {
    const D = RANGE_DATA, o = D.outside, m = RangeScene.memo || {};
    this.back = p.back || { map: o.map, x: o.front[0], y: o.front[1], dir: "down" };
    this.t = 0; this.started = false; this.closed = false; this.mode = "lobby"; this.game = null; this.first = p.start || null;
    this.q = RangeScene.noInput(); this.firing = false; this.breathing = false; this.aimId = null; this.dbg = null;
    // えらんだ もの（おなじ あそびの あいだは おぼえておく。さいしょは 先頭の 子・しゅるいごとに はじめの しゅもくと じゅう）
    this.who = m.who && Save.d.chars[m.who] ? m.who : Save.d.order[0];
    this.cat = m.cat || "hand";
    this.pick = m.pick || Object.fromEntries(Object.keys(D.cats).map((c) => [c, { course: Object.keys(D.courses).find((k) => D.courses[k].cat === c), gun: D.guns.find((g) => g.cat === c).id }]));
    await SvgCache.ensure("rg:staff", () => this.staffSvg(), Chara.pxSize(64), Math.round((Chara.pxSize(64) * Chara.VB.h) / Chara.VB.w));
    UI.showHud(true, o.label);
  }
  exit() { this.closed = true; this.unmount(); RangeScene.memo = { who: this.who, cat: this.cat, pick: this.pick }; }
  resize() { if (this.game) { this.game.W = G.W; this.game.H = G.H; } }
  st() { return Save.d.range; }
  staffSvg() { const S = RANGE_DATA.staff; return Art.npcSvg({ sp: S.sp, outfit: S.outfit, emo: "happy" }); }
  // 3人の かお（DOM の img。Chara の 絵を そのまま つかう）
  heroImg(id, face) { const c = Save.d.chars[id]; return `<img alt="" src="${U.svgUrl(Chara.svg(id, { face, color: c.color, outfit: c.outfit }))}">`; }
  // しゅもく × じゅう の ★（まだ あそんで いなければ 0）
  stars(course, gun) { const b = this.st().best[course + ":" + gun]; return b ? b.stars : 0; }
  courseStars(cid) { return Math.max(0, ...RANGE_DATA.guns.filter((g) => g.cat === RANGE_DATA.courses[cid].cat).map((g) => this.stars(cid, g.id))); }
  starText(n) { return "★".repeat(n) + "☆".repeat(3 - n); }
  // しゅるいが あそべるか: unlock の しゅるいの どれかの しゅもく × じゅう で ★ が stars いじょう
  unlocked(cat) {
    const D = RANGE_DATA, u = D.cats[cat].unlock;
    if (!u) return true;
    return Object.entries(this.st().best).some(([k, v]) => { const C = D.courses[k.split(":")[0]]; return !!C && C.cat === u.cat && v.stars >= u.stars; });
  }
  hopOf(gunId) { const h = this.st().hop[gunId]; return h != null ? h : RANGE_DATA.ballistics.hop.steps / 2; }

  // ---- ロビー ----
  async lobby() {
    const D = RANGE_DATA, st = this.st();
    if (!st.safety) {
      const face = this.staffSvg();
      await UI.say(D.talk.first.map((text) => ({ name: D.staff.name, face, text })));
      st.safety = true; Save.write();
    }
    if (!this.closed) this.pickWho();
  }
  // だれが うつ？（のこりの 2人は うしろで おうえん）
  pickWho() {
    const D = RANGE_DATA, body = U.el("div"), grid = U.el("div", { class: "rg-who" }), cards = {};
    let sel = this.who, next = false, m = null;
    for (const id of Chara.IDS) {
      const card = U.el("button", { class: "rg-who-card" + (id === sel ? " on" : ""), html: `${this.heroImg(id, RangeScene.FACE[id])}<span class="nm">${Save.d.chars[id].name}</span><span class="ln">${D.talk.go[id][0]}</span>` });
      card.dataset.who = id;
      card.addEventListener("click", () => { sel = id; Sound.se("tap"); for (const [k, el] of Object.entries(cards)) el.classList.toggle("on", k === id); });
      cards[id] = card; grid.append(card);
    }
    body.append(grid, U.el("div", { class: "rg-note", html: "のこりの 2人は うしろで 見て おうえん するよ" }));
    const go = UI.btn("この子で うつ", () => { this.who = sel; next = true; Sound.se("ok"); m.close(); }, "yellow wide rg-go");
    m = UI.modal({ title: "🎯 " + D.talk.pick, body, cls: "rg-lobby", footer: go, onClose: () => (next ? this.pickGame() : this.leave()) });
  }
  // しゅもくと じゅう: しゅるいの タブ → しゅもく 2つ（ルール）→ じゅう 3しゅ → せいのう・ホップ ダイヤル・まめちしき
  pickGame() {
    const D = RANGE_DATA, body = U.el("div", { class: "rg-pick" });
    let next = false, m = null;
    const go = UI.btn("これで うつ", () => { next = true; Sound.se("ok"); m.close(); }, "yellow wide rg-go");
    const draw = () => {
      body.innerHTML = "";
      const tabs = U.el("div", { class: "rg-tabs" });
      for (const [c, v] of Object.entries(D.cats)) {
        const lock = !this.unlocked(c), b = U.el("button", { class: "tab" + (c === this.cat ? " on" : "") + (lock ? " lock" : ""), html: (lock ? "🔒 " : "") + v.short });
        b.dataset.cat = c;
        b.addEventListener("click", () => { if (c === this.cat) return; Sound.se("tap"); this.cat = c; draw(); });
        tabs.append(b);
      }
      body.append(tabs);
      if (!this.unlocked(this.cat)) {
        body.append(U.el("div", { class: "rg-lock", html: D.talk.lock.replace("{cat}", D.cats[D.cats[this.cat].unlock.cat].name) }));
        go.disabled = true; return;
      }
      go.disabled = false;
      const P = this.pick[this.cat], C = D.courses[P.course], g = D.guns.find((x) => x.id === P.gun);
      const cs = U.el("div", { class: "rg-courses" });
      for (const [cid, c] of Object.entries(D.courses).filter(([, x]) => x.cat === this.cat)) {
        const b = U.el("button", { class: "rg-course" + (cid === P.course ? " on" : ""), html: `<span class="nm">${c.name}</span><span class="sub">${RangeScene.ORIGIN[c.kind]}・${RangeScene.SCORE[c.score]}</span><span class="best">${this.starText(this.courseStars(cid))}</span>` });
        b.dataset.course = cid;
        b.addEventListener("click", () => { if (cid === P.course) return; Sound.se("tap"); P.course = cid; draw(); });
        cs.append(b);
      }
      body.append(U.el("div", { class: "rg-h", html: "しゅもく" }), cs, U.el("div", { class: "rg-rule", html: C.rule }), U.el("div", { class: "rg-h", html: "じゅう" }));
      const list = U.el("div", { class: "rg-guns" });
      for (const x of D.guns.filter((y) => y.cat === this.cat)) {
        const how = Array.isArray(x.zoom) ? x.zoom.join("〜") + "ばい" : RangeScene.ACTION[x.action];
        const b = U.el("button", { class: "rg-gun" + (x.id === P.gun ? " on" : ""), html: `<span class="art">${GunArt.svg(x, { px: x.cat === "hand" ? 0.5 : 0.105, uid: "sel" + x.id })}</span><span><span class="nm">${x.name}</span><br><span class="sub">${RangeScene.POWER[x.power]}・たま ${x.mag}・${how}</span><br><span class="best">${this.starText(this.stars(P.course, x.id))}</span></span>` });
        b.dataset.gun = x.id;
        b.addEventListener("click", () => { if (x.id === P.gun) return; Sound.se("tap"); P.gun = x.id; draw(); });
        list.append(b);
      }
      body.append(list, this.detail(g));
    };
    draw();
    m = UI.modal({ title: "🎯 しゅもくと じゅう", body, cls: "rg-lobby", footer: go, onClose: () => (next ? this.start() : this.pickWho()) });
  }
  // じゅうの せつめい・せいのう（しょそく・まとまり・れんしゃ・はねあがり・おもさ）・ホップ ダイヤル（ライフル・スナイパー）・まめちしき
  detail(g) {
    const D = RANGE_DATA, H = D.ballistics.hop, el = U.el("div", { class: "rg-detail" });
    const bar = (v, max) => `<span class="bar"><i style="width:${Math.round(Math.max(0.04, Math.min(1, v / max)) * 100)}%"></i></span>`;
    el.innerHTML = `<div class="desc">${g.desc}</div><div class="rg-stats"><span>しょそく</span>${bar(g.v0, 100)}<span class="n">${g.v0}m/s</span><span>まとまり</span>${bar(6 - g.group, 5.7)}<span class="n">10mで ${g.group}cm</span><span>れんしゃ</span>${bar(g.rate, 14)}<span class="n">${g.rate}はつ/びょう</span><span>はねあがり</span>${bar(g.recoil, 12)}<span class="n">${g.recoil}</span><span>おもさ</span>${bar(g.weight, 4.5)}<span class="n">${g.weight}kg</span></div>`;
    if (g.cat !== "hand") {
      const hop = U.el("div", { class: "rg-hop" }), dial = U.el("span", { class: "dial", html: "<i></i>" }), v = U.el("span", { class: "v" });
      const show = () => { const n = this.hopOf(g.id); dial.firstChild.style.left = (n / H.steps) * 100 + "%"; v.textContent = n; };
      const step = (d) => { const n = U.clamp(this.hopOf(g.id) + d, 0, H.steps); if (n === this.hopOf(g.id)) return; this.st().hop[g.id] = n; Save.mark(); Sound.se("tap"); show(); };
      hop.append("ホップ", UI.btn("−", () => step(-1), "round rg-hop-down"), dial, UI.btn("＋", () => step(1), "round rg-hop-up"), v);
      show(); el.append(hop);
    }
    el.append(U.el("div", { class: "fact", html: `<b>まめちしき</b>${g.fact}` }));
    return el;
  }

  // ---- あそぶ ----
  // o = { course, gun, who, seed }（ないものは ロビーで えらんだ もの）
  async start(o = {}) {
    const D = RANGE_DATA, P = this.pick[this.cat];
    const course = o.course || P.course, gunId = o.gun || P.gun, who = o.who || this.who, gun = D.guns.find((g) => g.id === gunId), C = D.courses[course];
    this.who = who; this.cat = C.cat; this.pick[C.cat] = { course, gun: gunId };
    this.mode = "load"; this.game = null; this.unmount();
    // まえの 主観の じゅうの 絵は すてる（画面の はばの 大きな 絵なので、じゅうや 子を かえるたびに ためない）
    const keep = this.artKey(gun, who) + "@";
    for (const k of [...SvgCache.map.keys()]) if (k.startsWith("rg:") && !k.startsWith("rg:staff@") && !k.startsWith(keep)) SvgCache.map.delete(k);
    await this.preload(course, gun, who);
    if (this.closed) return;
    this.tone = who === "goji" ? Save.d.chars.goji.color || "soft" : "soft";
    this.game = new ShootingRange.Game(D, course, gunId, { seed: o.seed || `${course}:${gunId}:${Date.now()}`, W: G.W, H: G.H, who, hopStep: gun.cat === "hand" ? undefined : this.hopOf(gunId) });
    this.q = RangeScene.noInput(); this.firing = false; this.breathing = false; this.aimId = null; this.dbg = null; this.shown = {};
    this.mode = "play";
    UI.showHud(false);
    this.mount();
    this.refresh();
  }
  // 的の 絵は 400px はば（10m の まとを ダイオプターで のぞいても あらく ならない）。主観の じゅうは 画面の はば
  artSize(key) {
    const vb = this.vbs[key], pw = 400;
    return [pw, Math.min(1400, Math.round((pw * vb[3]) / vb[2]))];
  }
  artKey(gun, who) { return "rg:" + gun.id + ":" + who + ":" + (who === "goji" ? Save.d.chars.goji.color || "soft" : "soft"); }
  fpvSize() { const pw = Math.round(G.W * G.px); return [pw, Math.round((pw * 260) / 360)]; }
  // この しゅもくの 的（ShootingRange.artKeys を しゅもく 1つで）と 主観の じゅうを さきに よみこむ
  preload(course, gun, who) {
    const D = RANGE_DATA;
    if (!this.arts) { this.arts = {}; this.vbs = {}; for (const k of ShootingRange.artKeys(D)) { this.arts[k.key] = k.make; this.vbs[k.key] = k.make().match(/viewBox="([^"]+)"/)[1].split(" ").map(Number); } }
    const jobs = ShootingRange.artKeys({ courses: { [course]: D.courses[course] } }).map((k) => SvgCache.ensure(k.key, this.arts[k.key], ...this.artSize(k.key)));
    const tone = who === "goji" ? Save.d.chars.goji.color || "soft" : "soft";
    jobs.push(SvgCache.ensure(this.artKey(gun, who), () => ShootingRange.fpvSvg(gun, who, tone).svg, ...this.fpvSize()));
    return Promise.all(jobs);
  }
  // ShootingRange.draw に わたす 絵（ない ときは よみこみを はじめて null）
  art() {
    const g = this.game, gun = g.gun, who = g.who, tone = this.tone;
    return { img: (k) => (k === "fpv" ? SvgCache.get(this.artKey(gun, who), () => ShootingRange.fpvSvg(gun, who, tone).svg, ...this.fpvSize()) : this.arts[k] ? SvgCache.get(k, this.arts[k], ...this.artSize(k)) : null) };
  }
  // .range-scene（HUD・そうさ・おうえんの 2人）。ボタンの そとの ドラッグで ねらう
  mount() {
    const g = this.game, gun = g.gun, root = (this.root = U.el("div", { class: "range-scene rg-live" }));
    const btn = (label, cls, down) => { const b = U.el("button", { class: "btn " + cls, html: label }); b.addEventListener("pointerdown", (e) => { e.preventDefault(); Sound.init(); down(e); }); return b; };
    this.top = U.el("div", { class: "range-top" }); this.pills = U.el("span", { class: "range-pills" }); this.pills.style.display = "contents";
    this.top.append(this.pills, U.el("span", { class: "grow" }));
    if (g.C.kind === "ipsc") this.top.append(btn("おわり", "range-finish", () => { this.q.finish = true; }));
    const quit = UI.btn("✕", () => this.quit(), "round range-quit"); quit.setAttribute("aria-label", "やめる"); this.top.append(quit);
    this.sub = U.el("div", { class: "range-sub" });
    root.append(this.top, this.sub);
    if (gun.sight === "scope") {
      this.zoomEl = U.el("div", { class: "range-zoom" }); this.zoomV = U.el("span", { class: "v" });
      this.zoomEl.append(btn("＋", "round range-zoom-in", () => { this.q.zoomIn = true; Sound.se("tap"); }), this.zoomV, btn("−", "round range-zoom-out", () => { this.q.zoomOut = true; Sound.se("tap"); }));
      root.append(this.zoomEl);
    }
    if (g.C.kind === "bull" || g.C.kind === "issf") { this.monitor = U.el("div", { class: "range-monitor" }); root.append(this.monitor); } else this.monitor = null;
    // そうさ（右した）: [リロード][のぞく] / [ボルト][うつ]
    const ctrl = U.el("div", { class: "range-ctrl" });
    this.reloadBtn = gun.action !== "single" ? btn(gun.action === "lever" ? "こめる" : "リロード", "range-reload", () => { this.q.reload = true; }) : null;
    this.adsBtn = btn("のぞく", "range-ads", () => { this.q.ads = true; Sound.se("tap"); });
    this.actBtn = ["bolt", "lever", "single"].includes(gun.action) ? btn(RangeScene.ACT_LABEL[gun.action], "range-act", () => { this.q.action = true; }) : null;
    this.fireBtn = btn("うつ", "range-fire", () => { this.q.fire = true; this.firing = true; });
    const stop = () => { this.firing = false; };
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) this.fireBtn.addEventListener(ev, stop);
    for (const b of [this.reloadBtn, this.adsBtn, this.actBtn, this.fireBtn]) if (b) ctrl.append(b);
    // いき（おしている あいだ とめる）
    this.breathBtn = btn(`いき<span class="bar"><i></i></span>`, "range-breath", () => { this.breathing = true; });
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) this.breathBtn.addEventListener(ev, () => { this.breathing = false; });
    // おうえんの 2人（うしろで 見て いる）
    this.cheer = U.el("div", { class: "range-cheer" });
    this.buddies = Chara.IDS.filter((id) => id !== g.who).map((id) => { const b = U.el("div", { class: "range-buddy", html: this.heroImg(id, "normal") }); b.dataset.who = id; this.cheer.append(b); return b; });
    root.append(ctrl, this.breathBtn, this.cheer);
    // ねらい: ボタンの そとで ゆびを うごかす（はなしても ねらいは その まま）
    root.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".btn") || this.aimId != null) return;
      e.preventDefault(); Sound.init(); this.aimId = e.pointerId; this.aimAt = [e.clientX, e.clientY];
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
    });
    root.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.aimId) return;
      const u = G.cssPerUnit || 1; this.q.dx += (e.clientX - this.aimAt[0]) / u; this.q.dy += (e.clientY - this.aimAt[1]) / u; this.aimAt = [e.clientX, e.clientY];
    });
    const up = (e) => { if (e.pointerId === this.aimId) this.aimId = null; };
    root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up);
    UI.root.append(root);
  }
  unmount() { if (this.root) this.root.remove(); this.root = null; this.firing = false; this.breathing = false; this.aimId = null; }
  // 1フレームぶんの 入力（ボタン・ドラッグ・キー・PokaDebug.rangeInput）
  input(dt) {
    const q = this.q, k = G.keys, sp = 140 * dt, inp = { dx: q.dx, dy: q.dy, fire: q.fire, hold: this.firing, ads: q.ads, breath: this.breathing, action: q.action, reload: q.reload, zoomIn: q.zoomIn, zoomOut: q.zoomOut, finish: q.finish };
    if (k.left) inp.dx -= sp; if (k.right) inp.dx += sp; if (k.up) inp.dy -= sp; if (k.down) inp.dy += sp;
    if (this.keyFire) { inp.fire = inp.fire || this.keyFire === 1; inp.hold = true; if (this.keyFire === 1) this.keyFire = 2; }
    if (this.dbg) { const d = this.dbg; this.dbg = null; Object.assign(inp, d, { dx: inp.dx + (d.dx || 0), dy: inp.dy + (d.dy || 0) }); }
    this.q = RangeScene.noInput();
    return inp;
  }
  key(k, down) {
    if (this.mode !== "play") return;
    if (k === "ok") this.keyFire = down ? this.keyFire || 1 : 0;
    if (down && k === "cancel") this.quit();
  }
  update(dt) {
    this.t += dt;
    if (!this.started && !Game.trans) { this.started = true; if (this.first) this.start(this.first); else this.lobby(); }
    if (this.mode !== "play" || !this.game || UI.busy || Game.trans) return;
    const g = this.game;
    g.update(dt, this.input(dt));
    this.events(g.take());
    this.refresh();
    if (g.phase === "end") this.finish();
  }
  // できごと → 音（スチール・ポッパー・かねは きょり ÷ 340m/s おくれて カーン）
  events(evs, quiet) {
    const S = RANGE_DATA.sound;
    for (const e of evs) {
      if (quiet) continue;
      if (e.ev === "fire") Sound.se(S.fire[e.power]);
      else if (e.ev === "hit") { const se = S.hit[e.kind]; if (se) setTimeout(() => { if (!this.closed) Sound.se(se); }, Math.round((e.delay || 0) * 1000)); }
      else if (e.ev === "beep") Sound.se(S.beep);
      else if (e.ev === "reload") Sound.se(S.reload);
      else if (e.ev === "cycle") Sound.se(S.cycle);
      else if (e.ev === "load") Sound.se(S.load);
      else if (e.ev === "gasp") Sound.se(S.gasp);
      else if (e.ev === "series") Sound.se(S.series);
    }
  }
  // HUD（game.hud() の 数。かわった ところだけ 書きかえる）
  refresh() {
    const g = this.game, h = g.hud(), gun = g.gun, pill = (x, cls = "") => `<span class="pill ${cls}">${x}</span>`, mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`, p = [];
    if (h.kind === "steel") p.push(pill(`ストリング <b>${h.string}/${h.strings}</b>`), pill(`⏱ <b>${(h.phase === "play" ? h.clock : 0).toFixed(2)}</b>`));
    if (h.kind === "bull") p.push(pill(`シリーズ <b>${h.series}/${h.seriesN}</b>`), pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`, h.left <= 20 ? "warn" : ""));
    if (h.kind === "issf") p.push(pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`, h.left <= 20 ? "warn" : ""));
    if (h.kind === "ipsc") p.push(pill(`⏱ <b>${h.clock.toFixed(2)}</b>`, h.limit - h.clock <= 10 ? "warn" : ""));
    if (h.kind === "long") p.push(pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`, h.left <= 20 ? "warn" : ""), pill(`<b>${h.score}</b>てん`));
    if (h.kind === "run") p.push(pill(`ラン <b>${h.run}/${h.runs}</b> ${h.fast ? "はやい" : "おそい"}`), pill(`<b>${h.score}</b>てん`));
    if (h.kind !== "issf" && h.kind !== "bull") p.push(pill(gun.mag <= 10 ? `<span class="range-ammo">${Array.from({ length: gun.mag }, (_, i) => `<i class="${i < h.ammo ? "" : "off"}"></i>`).join("")}</span>` : `🔸 <b>${h.ammo}</b>/${h.mag}`, h.busy === "reload" ? "warn" : ""));
    this.put("pills", this.pills, p.join(""));
    const s = [];
    if (h.kind === "long") s.push(pill(`いま <b>${h.cur}m</b>（${h.curShot}/${h.per}）`));
    if (h.windLevel != null) s.push(pill(`かぜ <span class="arrow">${(h.windDir < 0 ? "←" : "→").repeat(h.windLevel + 1)}</span> ${["ほぼ なし", "よわい", "つよい"][h.windLevel]}`));
    this.put("sub", this.sub, s.join("") + `<span class="grow"></span>`);
    this.sub.style.display = s.length ? "" : "none";
    if (this.zoomV) this.put("zoom", this.zoomV, h.zoom.toFixed(1) + "×");
    if (this.monitor) {
      const card = g.targets[0];
      if (card) {
        const t = ShootingRange.targetSvg(card.def.shape, card.def), inner = t.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), vb = h.kind === "issf" ? [-30, -30, 60, 60] : t.vb;
        const holes = card.marks.map(([x, y]) => `<circle cx="${(x * 1000).toFixed(1)}" cy="${(-y * 1000).toFixed(1)}" r="${h.kind === "issf" ? 2.25 : 3}" fill="#F29A1F" stroke="#1F1D1B" stroke-width="0.8"/>`).join("");
        this.put("monitor", this.monitor, `<svg viewBox="${vb.join(" ")}">${inner}${holes}</svg><div class="v">${h.last == null ? "—" : h.last}</div><div class="s">ごうけい ${h.score}${h.kind === "bull" ? `・X ${g.xs}` : ""}</div>`);
      }
    }
    // ボタン: のぞく／もどす・ボルトなどが いる とき .need・うてない とき .wait
    this.put("ads", this.adsBtn, h.ads ? "もどす" : "のぞく");
    this.adsBtn.classList.toggle("on", h.ads);
    if (this.actBtn) this.actBtn.classList.toggle("need", h.needAction || (gun.action === "single" && !h.chamber && !h.busy));
    const wait = !!h.busy || !h.chamber || h.phase !== "play";
    this.fireBtn.classList.toggle("wait", wait);
    this.put("fire", this.fireBtn, h.busy ? "…" : "うつ");
    this.breathBtn.classList.toggle("on", h.hold); this.breathBtn.classList.toggle("shake", h.shake);
    this.breathBtn.querySelector(".bar i").style.width = Math.round(h.stamina * 100) + "%";
  }
  put(k, el, html) { if (this.shown[k] !== html) { this.shown[k] = html; el.innerHTML = html; } }
  // ✕: たしかめて ロビーへ（コインは なし）
  async quit() {
    if (this.mode !== "play" || UI.busy) return;
    this.firing = false; this.breathing = false;
    if (!(await UI.confirm("やめて ロビーに もどる？（コインは もらえないよ）", "もどる", "つづける"))) return;
    if (this.mode !== "play") return;
    this.toLobby();
  }
  toLobby() { this.mode = "lobby"; this.game = null; this.unmount(); UI.showHud(true, RANGE_DATA.outside.label); this.pickGame(); }
  // じどうで あそぶ（PokaDebug.rangeAuto）: 1/60 びょう ずつ sec びょう ぶん すすめる（音は ならさない）
  autoPlay(sec, skill) {
    const g = this.game;
    for (let i = 0; i < sec * 60 && g.phase !== "end"; i++) { g.update(1 / 60, ShootingRange.bot(g, skill)); this.events(g.take(), true); }
    this.refresh();
    if (g.phase === "end" && this.mode === "play") this.finish();
  }
  // ---- けっか ----
  finish() {
    const D = RANGE_DATA, g = this.game, C = g.C, st = this.st(), key = g.cid + ":" + g.gun.id, old = st.best[key];
    this.mode = "result"; this.unmount();
    const open = Object.keys(D.cats).filter((c) => !this.unlocked(c));
    // スチールは 5ストリング ぜんぶ うって はじめて きろく（とちゅうで おわると ★ も コインも なし）
    if (C.kind === "steel" && g.times.length < C.strings) g.stars = 0;
    st.plays++;
    const counted = C.kind !== "steel" || g.times.length >= C.strings;
    const better = counted && (!old || (C.score === "time" ? g.result < old.result : g.result > old.result || (g.result === old.result && C.kind === "bull" && (g.xs || 0) > (old.xs || 0))));
    if (better) st.best[key] = C.kind === "bull" ? { result: g.result, stars: g.stars, xs: g.xs || 0 } : { result: g.result, stars: g.stars };
    const coins = GameEconomy.pay("range", 1, g.stars, Save.d.settings.difficulty);
    if (coins) Save.addCoins(coins);
    this.lastCoins = coins; Save.write();
    UI.showHud(true, D.outside.label);
    Sound.se(g.stars >= 3 ? D.sound.end[3] : D.sound.end.other);
    const opened = open.filter((c) => this.unlocked(c));
    this.result(g, coins, better && !!old);
    for (const c of opened) UI.toast(`${D.cats[c].name}で あそべる ように なった！`, "good");
  }
  result(g, coins, record) {
    const D = RANGE_DATA, C = g.C, gun = g.gun, body = U.el("div", { class: "rg-result" }), st = C.stars;
    const fmt = (v) => (C.score === "time" ? v.toFixed(1) + "びょう" : C.score === "hf" ? v.toFixed(2) : C.kind === "issf" ? v.toFixed(1) : String(v));
    let main = "", sheet = "";
    if (C.kind === "steel") {
      const worst = g.times.reduce((a, t, i) => (t.time > g.times[a].time ? i : a), 0);
      main = `${g.result.toFixed(2)} <span style="font-size:15px">びょう</span>`;
      sheet = `<table class="rg-sheet"><tr><th>ストリング</th><th>タイム</th><th>のこし</th></tr>${g.times.map((t, i) => `<tr class="${i === worst && g.times.length > C.drop ? "drop" : ""}"><td>${i + 1}</td><td>${t.time.toFixed(2)}</td><td>${t.left ? `${t.left}まい（+${t.left * C.penalty}）` : "—"}</td></tr>`).join("")}<tr class="tot"><td>ごうけい</td><td colspan="2">${g.result.toFixed(2)}びょう</td></tr></table><div class="sub">せんの ひいた 1かい（いちばん おそい）は かぞえない</div>`;
    } else if (C.kind === "ipsc") {
      const s = g.sheet; main = `${s.hf.toFixed(2)} <span style="font-size:15px">ヒット ファクター</span>`;
      sheet = `<table class="rg-sheet"><tr><th>A</th><th>C</th><th>D</th><th>ミス</th><th>NS</th></tr><tr><td>${s.zones.A}</td><td>${s.zones.C}</td><td>${s.zones.D}</td><td>${s.miss}</td><td>${s.ns}</td></tr><tr class="tot"><td colspan="2">てん ${s.total}</td><td colspan="3">じかん ${s.time.toFixed(2)}びょう</td></tr></table>`;
    } else {
      main = `${C.kind === "issf" ? g.result.toFixed(1) : g.result} <span style="font-size:15px">てん</span>`;
      if (g.log && g.log.length) sheet = `<div class="sub rg-log">${g.log.join("・")}${C.kind === "bull" ? `（X ${g.xs || 0}）` : ""}</div>`;
    }
    const buddies = Chara.IDS.filter((x) => x !== g.who), faces = { wanko: "smile", gachan: "sparkle", goji: "love" };
    body.innerHTML = `<div class="stars">${"★".repeat(g.stars)}<span class="off">${"★".repeat(3 - g.stars)}</span></div><div class="score">${main}</div><div class="sub">${C.name}・${gun.name}　★1 ${fmt(st[0])}／★2 ${fmt(st[1])}／★3 ${fmt(st[2])}</div>${record ? `<div class="sub rg-record">じこ ベスト！</div>` : ""}${sheet}
      <div class="coins"><i class="coin-ico"></i> ${coins} コイン</div><div class="sub">RO: ${D.talk.result[g.stars]}</div>
      <div class="says">${[g.who, ...buddies].map((id) => `<div class="say">${this.heroImg(id, faces[id])}${D.talk.cheer[id].end[0]}</div>`).join("")}</div>`;
    let m = null, then = "lobby";
    const foot = U.el("div", { class: "rg-foot" });
    foot.append(UI.btn("もう いちど", () => { then = "again"; m.close(); }, "yellow"), UI.btn("えらびなおす", () => { then = "lobby"; m.close(); }, ""), UI.btn("おわる", () => { then = "leave"; m.close(); }, ""));
    m = UI.modal({ title: "🎯 けっか", body, footer: foot, cls: "rg-lobby", onClose: () => {
      if (then === "again") this.start({ course: g.cid, gun: gun.id, who: g.who });
      else if (then === "leave") this.leave();
      else { this.mode = "lobby"; this.game = null; this.pickGame(); }
    } });
  }
  leave() {
    if (this.closed || Game.trans) return;
    this.closed = true; Sound.se("door");
    Game.goto("world", this.back, "circle");
  }
  state() {
    const g = this.game;
    if (!g) return { mode: this.mode, phase: null };
    return { ...g.hud(), mode: this.mode, course: g.cid, gun: g.gun.id, who: g.who, result: g.result == null ? null : g.result, stars: g.stars == null ? null : g.stars, coins: this.lastCoins == null ? null : this.lastCoins, hop: g.hopStep };
  }
  // ロビーの うしろ: コンクリートの かべ・まとの マーク・カウンターと RO の ラビ。あそぶ ときと けっかは 主観の 画面
  render(ctx) {
    if (this.game && (this.mode === "play" || this.mode === "result")) { ShootingRange.draw(ctx, this.game, this.art()); return; }
    const W = G.W, H = G.H, g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#4A4E55"); g.addColorStop(0.55, "#33363C"); g.addColorStop(1, "#22252B");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#C96A64"; ctx.fillRect(0, H * 0.07, W, 6);
    const cx = W / 2, cy = H * 0.19;
    [[34, "#FFF6DF"], [25, "#D9776F"], [16, "#FFF6DF"], [7, "#D9776F"]].forEach(([r, c]) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); });
    const im = SvgCache.get("rg:staff", () => this.staffSvg(), Chara.pxSize(64), Math.round((Chara.pxSize(64) * Chara.VB.h) / Chara.VB.w));
    const top = H * 0.36, s = 64;
    if (im) ctx.drawImage(im, cx + 64 - s / 2, top - s * 1.05 + Math.sin(this.t * 2) * 0.8, s, (s * Chara.VB.h) / Chara.VB.w);
    ctx.fillStyle = "#8D9AA5"; ctx.fillRect(-2, top, W + 4, 18); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-2, top, W + 4, 18);
    ctx.fillStyle = "#5F656E"; ctx.fillRect(-2, top + 18, W + 4, H * 0.12);
  }
}
RangeScene.memo = null;
RangeScene.noInput = () => ({ dx: 0, dy: 0, fire: false, ads: false, action: false, reload: false, zoomIn: false, zoomOut: false, finish: false });
RangeScene.FACE = { wanko: "smile", gachan: "smile", goji: "love" };
RangeScene.ORIGIN = { steel: "スティール チャレンジ", bull: "APS カップ", ipsc: "IPSC", issf: "ISSF 10m", long: "30〜70m の かね", run: "ランニング ターゲット" };
RangeScene.SCORE = { time: "タイム", points: "てん", hf: "ヒット ファクター" };
RangeScene.POWER = { gbb: "ガス ブローバック", gas: "ガス", aeg: "でんどう", spring: "エアー コッキング" };
RangeScene.ACTION = { semi: "セミオート", da: "ダブル アクション", auto: "フルオート", lever: "レバー", bolt: "ボルト", single: "1ぱつずつ" };
RangeScene.ACT_LABEL = { bolt: "ボルト", lever: "レバー", single: "こめる" };
SCENES.range = RangeScene;
