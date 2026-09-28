// ⑥ 射撃場の 画面（RangeScene・SCENES.range）。シティの「シティ シューティング レンジ」の 入口から 入り（scene-world.js の enterDoor）、おわると 入口の まえに もどる。
// 1番: ロビー（DOM の UI.modal）。はじめての ときは RO の ラビが 安全の きまりを 話す（RANGE_DATA.talk.first → Save.d.range.safety）。
//   だれが うつ？（3人から 1人。のこりの 2人は うしろで おうえん）→ しゅもくと じゅう（しゅるいの タブ・しゅもく 2つ・ルール・じゅう 3しゅ・せいのう・ホップ ダイヤル・まめちしき）。
//   ロックは RANGE_DATA.cats.*.unlock（まえの しゅるいの どれかの しゅもくで ★ いくつ）。ホップ ダイヤルは じゅう ごとに Save.d.range.hop に のこす。
//   2番で「これで うつ」から あそぶ 画面（ShootingRange.Game）と けっかを 足す。
class RangeScene {
  async enter(p = {}) {
    const D = RANGE_DATA, o = D.outside, m = RangeScene.memo || {};
    this.back = p.back || { map: o.map, x: o.front[0], y: o.front[1], dir: "down" };
    this.t = 0; this.started = false; this.closed = false;
    // えらんだ もの（おなじ あそびの あいだは おぼえておく。さいしょは 先頭の 子・しゅるいごとに はじめの しゅもくと じゅう）
    this.who = m.who && Save.d.chars[m.who] ? m.who : Save.d.order[0];
    this.cat = m.cat || "hand";
    this.pick = m.pick || Object.fromEntries(Object.keys(D.cats).map((c) => [c, { course: Object.keys(D.courses).find((k) => D.courses[k].cat === c), gun: D.guns.find((g) => g.cat === c).id }]));
    await SvgCache.ensure("rg:staff", () => this.staffSvg(), Chara.pxSize(64), Math.round((Chara.pxSize(64) * Chara.VB.h) / Chara.VB.w));
    UI.showHud(true, o.label);
  }
  exit() { this.closed = true; RangeScene.memo = { who: this.who, cat: this.cat, pick: this.pick }; }
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
  // 2番で あそぶ 画面に つなぐ
  start() {
    UI.toast("しゃてきじょうは じゅんび ちゅう… もうすこし まってね");
    this.pickGame();
  }
  leave() {
    if (this.closed || Game.trans) return;
    this.closed = true; Sound.se("door");
    Game.goto("world", this.back, "circle");
  }
  update(dt) {
    this.t += dt;
    if (!this.started && !Game.trans) { this.started = true; this.lobby(); }
  }
  // ロビーの うしろ: コンクリートの かべ・まとの マーク・カウンターと RO の ラビ
  render(ctx) {
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
RangeScene.FACE = { wanko: "smile", gachan: "smile", goji: "love" };
RangeScene.ORIGIN = { steel: "スティール チャレンジ", bull: "APS カップ", ipsc: "IPSC", issf: "ISSF 10m", long: "30〜70m の かね", run: "ランニング ターゲット" };
RangeScene.SCORE = { time: "タイム", points: "てん", hf: "ヒット ファクター" };
RangeScene.POWER = { gbb: "ガス ブローバック", gas: "ガス", aeg: "でんどう", spring: "エアー コッキング" };
RangeScene.ACTION = { semi: "セミオート", da: "ダブル アクション", auto: "フルオート", lever: "レバー", bolt: "ボルト", single: "1ぱつずつ" };
SCENES.range = RangeScene;
