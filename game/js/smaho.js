// すまほ（ぽかぽかフォン）: ちず・ようす・もちもの・ずかん・イベント・スタンプラリー・ひんと・うらない・ごほうび・おんがく・しゃしん・シール を 1つに まとめる。
// どうぶつの森の スマホの ように、ホーム画面の アプリを タップして ひらく（もどる で ホーム、✕ か Esc で とじる）。
// 町・フィールドの「おまつり」ボタンの かわりに 左下の「すまほ」ボタン（おうち・おみせ・たてものの 中〔Meeときょれじゃ・サンシャインいけぶ など〕でも 出る）。≡ は せってい だけ（Menu.open）。
// Esc（cancel キー）は すまほを ひらく。いままでの まどを つかう アプリ（おまつり・スタンプ・ごほうび）は その まどの 中みを すまほの 画面に いれる。
const Smaho = {
  ICON: {
    map: `<path d="M6,10 L16,6 L28,10 L38,6 L38,34 L28,38 L16,34 L6,38 Z" fill="#FFF6DD" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M16,6 L16,34 M28,10 L28,38" stroke="#C9A06A" stroke-width="2"/><path d="M11,27 C15,22 19,25 22,20" fill="none" stroke="#6FA9CF" stroke-width="2.4" stroke-linecap="round"/><path d="M27,15 C27,10 35,10 35,15 C35,19 31,23 31,23 C31,23 27,19 27,15 Z" fill="#E35D5B" stroke="${INK}" stroke-width="2"/><circle cx="31" cy="15" r="1.6" fill="#FFF"/>`,
    status: `<circle cx="12" cy="25" r="7.5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/><path d="M5.6,21 C4,18 6,15 8.6,17 M18.4,21 C20,18 18,15 15.4,17" fill="#2B2B2B" stroke="${INK}" stroke-width="1.6"/><circle cx="22" cy="18" r="7.5" fill="#FFE08A" stroke="${INK}" stroke-width="2.4"/><circle cx="32" cy="25" r="7.5" fill="#B9C3CC" stroke="${INK}" stroke-width="2.4"/>${[[10, 25], [14, 25], [20, 18], [24, 18], [30, 25], [34, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}"/>`).join("")}<path d="M21,21 L23,21 L22,22.6 Z" fill="#F29A1F"/><path d="M10,36 C14,33 30,33 34,36" fill="none" stroke="#E35D5B" stroke-width="2.6" stroke-linecap="round"/>`,
    bag: `<path d="M16,16 C16,8 28,8 28,16" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M8,16 L36,16 L33,38 L11,38 Z" fill="#F2B36B" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><rect x="16" y="23" width="12" height="8" rx="2" fill="#FFE39A" stroke="${INK}" stroke-width="2"/>`,
    dex: `<rect x="9" y="6" width="26" height="32" rx="3" fill="#8FC9F0" stroke="${INK}" stroke-width="2.6"/><path d="M14,6 L14,38" stroke="${INK}" stroke-width="2.2"/><path d="M${24.5},12 L26.6,16.6 L31.4,17 L27.8,20.2 L28.9,25 L24.5,22.4 L20.1,25 L21.2,20.2 L17.6,17 L22.4,16.6 Z" fill="#FFE066" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M18,30 L31,30" stroke="#FFF" stroke-width="2.4" stroke-linecap="round"/>`,
    event: `<rect x="6" y="10" width="32" height="27" rx="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2.6"/><path d="M6,14 C6,11 8,10 10,10 L34,10 C36,10 38,11 38,14 L38,18 L6,18 Z" fill="#F29A5B" stroke="${INK}" stroke-width="2.4"/><path d="M14,6 L14,13 M30,6 L30,13" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M22,21 L24,25.4 L28.8,25.8 L25.2,29 L26.3,33.6 L22,31.2 L17.7,33.6 L18.8,29 L15.2,25.8 L20,25.4 Z" fill="#F7D56A" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    rally: `<path d="M17,22 L17,13 C17,7 27,7 27,13 L27,22" fill="#C98A52" stroke="${INK}" stroke-width="2.6"/><rect x="10" y="21" width="24" height="7" rx="2" fill="#8E5A34" stroke="${INK}" stroke-width="2.4"/><ellipse cx="22" cy="35" rx="12" ry="4.4" fill="none" stroke="#E35D5B" stroke-width="2.6"/><path d="M17,35 L27,35" stroke="#E35D5B" stroke-width="2.4" stroke-linecap="round"/>`,
    hint: `<path d="M22,5 C13,5 9,12 10,18 C11,23 15,25 16,30 L28,30 C29,25 33,23 34,18 C35,12 31,5 22,5 Z" fill="#FFE066" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M17,34 L27,34 M18,38 L26,38" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M17,15 C18,11 21,10 23,10" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
    fortune: `<path d="M12,38 L32,38 L29,31 L15,31 Z" fill="#B58A69" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="22" cy="19" r="12.5" fill="#C9B6E0" stroke="${INK}" stroke-width="2.6"/><path d="M15,15 C16,11 19,9 22,9" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/><path d="M26,19 L27.4,22 L30.6,22.4 L28.2,24.6 L28.9,27.8 L26,26.2 L23.1,27.8 L23.8,24.6 L21.4,22.4 L24.6,22 Z" fill="#FFF59D"/>`,
    rewards: `<rect x="8" y="18" width="28" height="19" rx="2" fill="#F48FB1" stroke="${INK}" stroke-width="2.6"/><rect x="6" y="12" width="32" height="7" rx="2" fill="#F8BBD0" stroke="${INK}" stroke-width="2.4"/><path d="M22,12 L22,37" stroke="#FFE066" stroke-width="4"/><path d="M22,12 C16,4 10,8 14,12 M22,12 C28,4 34,8 30,12" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    quests: `<rect x="7" y="7" width="30" height="26" rx="3" fill="#D9A066" stroke="${INK}" stroke-width="2.6"/><rect x="10" y="10" width="11" height="9" rx="1" fill="#FFFDF5" stroke="${INK}" stroke-width="1.6"/><rect x="24" y="11" width="10" height="8" rx="1" fill="#F4A6A0" stroke="${INK}" stroke-width="1.6"/><rect x="13" y="22" width="18" height="8" rx="1" fill="#9CC7E6" stroke="${INK}" stroke-width="1.6"/><path d="M12,33 V40 M32,33 V40" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    music: `<path d="M16,31 L16,11 L33,7 L33,27" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M16,15 L33,11" stroke="${INK}" stroke-width="2.8"/><ellipse cx="12.4" cy="31" rx="5" ry="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/><ellipse cx="29.4" cy="27" rx="5" ry="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>`,
    photos: `<rect x="6" y="12" width="32" height="24" rx="4" fill="#F8C8DA" stroke="${INK}" stroke-width="2.6"/><path d="M15,12 L18,7 L26,7 L29,12" fill="#F29BB8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="22" cy="24" r="7" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/><circle cx="22" cy="24" r="3.2" fill="#8FC9F0"/><path d="M${31.5},16.5 L32.6,18.8 L35,19 L33.2,20.6 L33.7,23 L31.5,21.7 L29.3,23 L29.8,20.6 L28,19 L30.4,18.8 Z" fill="#FFE066" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
    wish: `<path d="M22,37 C10,29 6,22.5 6,16.5 C6,11.4 9.8,7.6 14.6,7.6 C18,7.6 20.6,9.6 22,12.4 C23.4,9.6 26,7.6 29.4,7.6 C34.2,7.6 38,11.4 38,16.5 C38,22.5 34,29 22,37 Z" fill="#F48FB1" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M13,15.5 C13.4,13 15,11.8 17,11.8" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><path d="M33,4 L34.2,7 L37.2,8.2 L34.2,9.4 L33,12.4 L31.8,9.4 L28.8,8.2 L31.8,7 Z" fill="#FFE066" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    stickers: `<rect x="8" y="6" width="28" height="32" rx="4" fill="#FFF0F5" stroke="${INK}" stroke-width="2.6"/><path d="M8,12 h-3 M8,22 h-3 M8,32 h-3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M22,30 C14,25 12,21 12,18 C12,15.4 14,13.6 16.4,13.6 C18.2,13.6 19.6,14.6 20.2,16 C20.8,14.6 22.2,13.6 24,13.6 C26.4,13.6 28.4,15.4 28.4,18 C28.4,21 26,25 22,30 Z" fill="#FF8FB0" stroke="#FFFFFF" stroke-width="3.4" stroke-linejoin="round" transform="translate(-1 -2)"/><path d="M22,30 C14,25 12,21 12,18 C12,15.4 14,13.6 16.4,13.6 C18.2,13.6 19.6,14.6 20.2,16 C20.8,14.6 22.2,13.6 24,13.6 C26.4,13.6 28.4,15.4 28.4,18 C28.4,21 26,25 22,30 Z" fill="#FF8FB0" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" transform="translate(-1 -2)"/><circle cx="29" cy="31" r="5.6" fill="#9FD3F0" stroke="#FFFFFF" stroke-width="2.6"/><circle cx="29" cy="31" r="5.6" fill="none" stroke="${INK}" stroke-width="1.6"/><path d="M15,14 q1 -2.4 3.4 -3" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`,
    phone: `<rect x="11" y="3" width="22" height="38" rx="5" fill="#FFF6DD" stroke="${INK}" stroke-width="2.8"/><rect x="14" y="8" width="16" height="25" rx="2" fill="#9ED9B1" stroke="${INK}" stroke-width="2"/><path d="M19,37 L25,37" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><circle cx="18.5" cy="14" r="2" fill="#F7D56A"/><circle cx="25.5" cy="14" r="2" fill="#F48FB1"/><circle cx="18.5" cy="21" r="2" fill="#8FC9F0"/><circle cx="25.5" cy="21" r="2" fill="#C9B6E0"/>`,
  },
  // name は ボタンの なまえ（ひらがな）。render(el, ph) は アプリの 中みを el に 入れる
  APPS: [
    { id: "map", name: "ちず", color: "#9ED9B1", render(el, ph) {
      if (G.sceneName === "world" || G.sceneName === "store" || G.sceneName === "venue") el.append(UI.btn("おうちへ かえる", async () => { if (await UI.confirm("3にんで おうちに かえる？")) { ph.close(); Game.goto("house", {}, "circle"); } }, "wide yellow smaho-home-go"));
      Smaho.inside(el, ph);
      WorldAtlas.render(el);
    } },
    { id: "status", name: "ようす", color: "#F7B7CB", render(el) { Menu.status(el); } },
    { id: "bag", name: "もちもの", color: "#F7D878", render(el) { Menu.bag(el); } },
    { id: "dex", name: "ずかん", color: "#9CC7E6", render(el) { Menu.dex(el, null); } },
    { id: "event", name: "イベント", color: "#F4A97A", render(el, ph) { ph.embed(() => AnnualFestivals.open()); } },
    { id: "rally", name: "スタンプラリー", color: "#C3AEE3", render(el, ph) { Smaho.rally(el, ph); } },
    { id: "hint", name: "ひんと", color: "#BDE3A6", render(el) { Smaho.hintList(el); } },
    { id: "fortune", name: "うらない", color: "#D7C6EE", render(el) { Smaho.fortuneView(el); } },
    { id: "rewards", name: "ごほうび", color: "#F2C1CC", render(el, ph) { ph.embed(() => ShopRewards.open()); } },
    { id: "quests", name: "いらい", color: "#F7D56A", when: () => typeof NeriQuests !== "undefined", render(el) { NeriQuests.phoneView(el); } },
    { id: "music", name: "おんがく", color: "#8EC5E0", when: () => typeof MusicDiscs !== "undefined", render(el) { Smaho.musicList(el); } },
    { id: "photos", name: "しゃしん", color: "#F8C8DA", when: () => typeof Purikura !== "undefined", render(el, ph) { Purikura.phoneView(el, ph); } },
    { id: "stickers", name: "シール", color: "#FFC9DE", when: () => typeof StickerBook !== "undefined", render(el, ph) { StickerBook.phoneView(el, ph); } },
    { id: "wish", name: "おねがい", color: "#F9C3D2", when: () => typeof GowagaWish !== "undefined", render(el, ph) { GowagaWish.phoneView(el, ph); } },
  ],
  view: null, // ひらいて いる すまほ（{ wrap, screen, app }）
  apps() { return this.APPS.filter((a) => !a.when || a.when()); },
  svg(id, size = 40) { return `<svg viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">${this.ICON[id]}</svg>`; },
  toggle() { if (this.view) this.close(); else this.open(); },
  open(app = null) {
    if (this.view) { if (app) this.show(app); return this.view; }
    Sound.se("ok");
    UI.layers++;
    const wrap = U.el("div", { class: "modal-wrap smaho-wrap" });
    const phone = U.el("div", { class: "smaho", role: "dialog", "aria-label": "すまほ" });
    const close = U.el("button", { class: "btn round close smaho-close", "aria-label": "とじる", html: "✕" });
    close.addEventListener("click", () => { Sound.se("cancel"); this.close(); });
    const status = U.el("div", { class: "smaho-status" });
    const screen = U.el("div", { class: "smaho-screen" });
    const homebar = U.el("button", { class: "smaho-homebar", "aria-label": "ホームへ" });
    homebar.addEventListener("click", () => { Sound.se("tap"); this.home(); });
    screen.append(status, U.el("div", { class: "smaho-page" }));
    phone.append(close, screen, homebar);
    wrap.append(phone);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) { Sound.se("cancel"); this.close(); } });
    UI.root.append(wrap);
    this.view = { wrap, phone, screen, status, app: null };
    this.clock();
    this.view.timer = setInterval(() => this.clock(), 15000);
    if (app) this.show(app); else this.home();
    return this.view;
  },
  close() {
    const v = this.view;
    if (!v) return;
    this.view = null;
    clearInterval(v.timer);
    v.wrap.classList.add("out");
    setTimeout(() => v.wrap.remove(), 180);
    UI.layers--;
  },
  clock() {
    const v = this.view; if (!v) return;
    const d = new Date(), hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
    v.status.innerHTML = `<b>${hh}:${mm}</b><span class="smaho-brand">ぽかぽかフォン</span><span class="smaho-signal" aria-hidden="true"><svg viewBox="0 0 30 14" width="30" height="14"><path d="M1,12 h3 v-3 h-3 z M6,12 h3 v-6 h-3 z M11,12 h3 v-9 h-3 z" fill="${INK}"/><rect x="17" y="2" width="11" height="10" rx="2" fill="none" stroke="${INK}" stroke-width="1.8"/><rect x="19" y="4" width="6" height="6" fill="#5CB85C"/></svg></span>`;
    const c = v.screen.querySelector(".smaho-clock");
    if (c) c.textContent = `${hh}:${mm}`;
  },
  page() { return this.view.screen.querySelector(".smaho-page"); },
  home() {
    const v = this.view; if (!v) return;
    v.app = null;
    const page = U.el("div", { class: "smaho-page smaho-home" });
    const d = new Date(), wd = ["にち", "げつ", "か", "すい", "もく", "きん", "ど"][d.getDay()];
    page.append(U.el("div", { class: "smaho-clock", text: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }), U.el("div", { class: "smaho-date", text: `${d.getMonth() + 1}がつ ${d.getDate()}にち（${wd}ようび）` }));
    const grid = U.el("div", { class: "smaho-apps" });
    for (const a of this.apps()) {
      const b = U.el("button", { class: "smaho-app", "aria-label": a.name, html: `<span class="ico" style="background:${a.color}">${this.svg(a.id)}${this.badge(a.id) ? '<i class="smaho-dot"></i>' : ""}</span><span class="nm">${a.name}</span>` });
      b.dataset.app = a.id;
      b.addEventListener("click", () => { Sound.se("tap"); this.show(a.id); });
      grid.append(b);
    }
    page.append(grid);
    this.page().replaceWith(page);
    v.screen.classList.remove("in-app");
    v.screen.style.removeProperty("--app-color");
  },
  // アプリを ひらく
  show(id) {
    const v = this.view || this.open(); const a = this.apps().find((x) => x.id === id);
    if (!a) return false;
    v.app = id;
    const page = U.el("div", { class: "smaho-page smaho-app-view" });
    const bar = U.el("div", { class: "smaho-bar" });
    const back = U.el("button", { class: "btn smaho-back", "aria-label": "もどる", html: "‹ もどる" });
    back.addEventListener("click", () => { Sound.se("cancel"); this.home(); });
    const title = U.el("div", { class: "smaho-title", html: `${this.svg(a.id, 26)}<span>${a.name}</span>` });
    bar.append(back, title);
    const body = U.el("div", { class: `smaho-body app-${a.id}` });
    page.append(bar, body);
    this.page().replaceWith(page);
    v.screen.classList.add("in-app");
    v.screen.style.setProperty("--app-color", a.color);
    const ph = {
      close: () => this.close(), home: () => this.home(), body, setTitle: () => {},
      // UI.modal を 1かいだけ かりて、まどの 中みを すまほの 画面に いれる（おまつり・スタンプ・ごほうび）
      embed: (fn) => {
        const real = UI.modal;
        UI.modal = (o = {}) => {
          UI.modal = real;
          if (o.body) body.append(o.body);
          if (o.footer) body.append(U.el("div", { class: "smaho-foot" }, o.footer));
          // もとの まどを とじる ＝ すまほを とじる（さんか・ちずを みる の あとは あそびに もどる）
          return { el: page, body, close: () => this.close(), setTitle: () => {} };
        };
        try { fn(); } finally { if (UI.modal !== real) UI.modal = real; }
      },
    };
    a.render(body, ph);
    return true;
  },
  // ---- スタンプラリー: きせつの スタンプ（3つの めいしょ）と まいにち スタンプ ----
  rally(el, ph) {
    const tabs = U.el("div", { class: "tabs smaho-tabs" }), box = U.el("div");
    const T = [["season", "きせつの スタンプ"], ["daily", "まいにち スタンプ"]];
    const show = (k) => {
      this.rallyTab = k;
      tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
      box.replaceChildren();
      const inner = { ...ph, body: box, embed: (fn) => {
        const real = UI.modal;
        UI.modal = (o = {}) => { UI.modal = real; if (o.body) box.append(o.body); return { el: box, body: box, close: () => this.close(), setTitle: () => {} }; };
        try { fn(); } finally { if (UI.modal !== real) UI.modal = real; }
      } };
      if (k === "season") { inner.embed(() => Seasonal.open()); box.querySelector(".annual-invite")?.remove(); }
      else inner.embed(() => DailyPlay.open());
    };
    for (const [k, label] of T) {
      const b = U.el("button", { class: "tab", text: label });
      b.dataset.k = k;
      b.addEventListener("click", () => { Sound.se("tap"); show(k); });
      tabs.append(b);
    }
    el.append(tabs, box);
    show(this.rallyTab || "season");
  },
  // ---- ひんと: いま できる こと（セーブから）----
  hints() {
    const d = Save.d, out = [], add = (icon, text) => out.push({ icon, text });
    const npcAt = (npc) => { for (const [map, def] of Object.entries(MAP_DEFS)) { const n = (def.npcs || []).find((x) => x.id === npc); if (n) return `${def.name}の ${n.name || "ひと"}`; } return null; };
    const kids = d.order.map((id) => d.chars[id]);
    const hungry = kids.filter((c) => c.hunger < 30);
    if (hungry.length) add("bag", `${hungry.map((c) => c.name).join("・")}が おなか ぺこぺこ。「もちもの」か おうちの「ごはん」で たべさせよう。`);
    if (typeof AnnualFestivals !== "undefined") {
      const a = AnnualFestivals.current(), s = AnnualFestivals.state(a.month);
      if (s.available && !s.claimed) add("event", `こんげつの おまつり「${s.name}」は ${s.count}/3。「イベント」で さんかして めいしょを まわろう。`);
    }
    if (typeof Seasonal !== "undefined") {
      const s = Seasonal.state();
      if (!s.claimed) add("rally", `きせつの スタンプ ${s.count}/3。${s.targets.filter((t) => !s.stamps[t.id]).map((t) => t.label).join("・") || "きねんひんを うけとろう"}`);
    }
    if (typeof DailyPlay !== "undefined") { const shop = DailyPlay.featured(); add("rewards", `きょうの おすすめ おみせは「${SHOPS[shop]?.name || shop}」。おてつだいの コインが ${DailyPlay.label(DailyPlay.mul())}！`); }
    if (typeof Fishing !== "undefined" && Fishing.data() && !Fishing.rod()) { const g = Fishing.data().rods[0].get, who = npcAt(g.npc); add("map", `${who ? who + "に" : "まちの ひとに"} はなすと つりざおが もらえるよ。`); }
    else if (typeof Fishing !== "undefined" && Fishing.data()) add("map", Fishing.keepCount() >= Fishing.KEEP_MAX ? "いけすが いっぱい！ スーパーで うるか すいぞくかんに きふ しよう。" : "みずべの さかなの かげを ねらって みずを ながおし。うきが しずんだら「つる」！");
    if (typeof Fossils !== "undefined" && Fossils.data() && !Fossils.hasPick()) { const g = Fossils.data().pick.get, who = npcAt(g.npc); add("map", `${who ? who + "に" : "もりの ひとに"} はなすと ピッケルが もらえるよ。ひびの ある いわを ほろう。`); }
    if (typeof MusicDiscs !== "undefined") { const n = MusicDiscs.count(), all = MusicDiscs.DISCS.length; if (n < all) add("music", `ディスク ${n}/${all}。おてつだいで ○ いじょう・たからばこで みつかるよ。`); }
    if (typeof ParentWork !== "undefined" && ParentWork.away()) add("status", "ぱぱと ままは 9じ〜18じ おしごと。3にんで おるすばん しようね。");
    if (d.coins < 100) add("rewards", "コインは おみせの おてつだいで ためられるよ。");
    add("phone", "こまったら ひだり したの「すまほ」。≡ は おとや セーブの せってい。");
    add("map", "タップで いどう・ドラッグで スティック。「！」の ある ひとに はなしかけよう。");
    return out;
  },
  hintList(el) {
    for (const h of this.hints()) {
      const row = U.el("div", { class: "smaho-hint", html: `<span class="ico">${this.svg(h.icon, 30)}</span><span class="t"></span>` });
      row.querySelector(".t").textContent = h.text;
      el.append(row);
    }
  },
  // ---- うらない: その日 ずっと おなじ けっか（日づけから きめる）----
  LUCK: [["だいきち", "#E35D5B", "なにを しても うまく いく 1にち！"], ["ちゅうきち", "#F29A5B", "みんなで いっしょに いると いい こと が ある よ。"], ["しょうきち", "#F7C948", "ちいさな しあわせが みつかる 1にち。"], ["きち", "#5CB85C", "のんびり すごすと ほっこり できるよ。"], ["すえきち", "#6FA9CF", "あとから どんどん よく なる 1にち。"]],
  COLORS: [["ピンク", "#F48FB1"], ["みずいろ", "#8FD3F4"], ["きいろ", "#FFE066"], ["みどり", "#8BCB6B"], ["むらさき", "#C9B6E0"], ["オレンジ", "#F6A04D"], ["しろ", "#FFFFFF"]],
  fortune(day = U.today()) {
    let h = 2166136261;
    for (const ch of "ぽかぽか" + day) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x6D2B79F5) >>> 0; return (h >>> 8) / 16777216; };
    const pick = (list) => list[Math.floor(rnd() * list.length) % list.length];
    const luck = this.LUCK[[0, 1, 1, 2, 2, 3, 3, 3, 4][Math.floor(rnd() * 9) % 9]];
    const foods = FOODS.filter((f) => !f.rare && !f.boost && f.price > 0), food = pick(foods);
    const places = ["town", "city", "heiwadai", "harbor", "meadow", "forest", "coast"].filter((id) => MAP_DEFS[id]).map((id) => MAP_DEFS[id].name);
    const shop = typeof DailyPlay !== "undefined" ? DailyPlay.featured(day) : null, mul = shop ? DailyPlay.mul(day) : 1;
    const words = { wanko: ["しっぽが ぶんぶん！", "おさんぽ びより！", "ボールあそびが いいかも"], gachan: ["おうたが じょうずに うたえそう♪", "おはなを そだてると いいよ", "ぴよっと ひらめく 1にち"], goji: ["ガオー！ げんき いっぱい", "おやつが おいしく かんじる 1にち", "たからものが みつかるかも"] };
    return { day, luck: luck[0], luckColor: luck[1], message: luck[2], color: pick(this.COLORS), food: food ? food.id : null, place: pick(places), shop, mul, words: Object.fromEntries(Object.entries(words).map(([k, v]) => [k, pick(v)])) };
  },
  fortuneView(el) {
    const f = this.fortune(), drawn = Save.d.flags.fortuneDay === f.day;
    const box = U.el("div", { class: "smaho-fortune" });
    const ball = U.el("div", { class: "smaho-ball", html: this.svg("fortune", 110) });
    const result = U.el("div", { class: "smaho-omikuji" });
    const reveal = () => {
      const food = f.food && BAG_INDEX[f.food];
      result.innerHTML = `<div class="luck" style="--luck:${f.luckColor}"></div><p class="msg"></p><div class="rows"><div><b>ラッキー カラー</b><span class="swatch" style="background:${f.color[1]}"></span><span class="t1"></span></div><div><b>ラッキー たべもの</b>${food ? UI.icon("bag", f.food, 32) : ""}<span class="t2"></span></div><div><b>ラッキー ばしょ</b><span class="t3"></span></div>${f.shop ? `<div><b>ラッキー おみせ</b><span class="t4"></span></div>` : ""}</div><div class="kids"></div>`;
      result.querySelector(".luck").textContent = f.luck;
      result.querySelector(".msg").textContent = f.message;
      result.querySelector(".t1").textContent = f.color[0];
      result.querySelector(".t2").textContent = food ? food.name : "";
      result.querySelector(".t3").textContent = f.place;
      if (f.shop) result.querySelector(".t4").textContent = `${SHOPS[f.shop]?.name || f.shop}（コイン ${DailyPlay.label(f.mul)}）`;
      const kids = result.querySelector(".kids");
      for (const id of Save.d.order) {
        const c = Save.d.chars[id];
        const row = U.el("div", { class: "kid", html: `<span class="face">${Chara.svg(id, { face: "happy", outfit: c.outfit, color: c.color })}</span><span class="w"></span>` });
        row.querySelector(".w").textContent = `${c.name}: ${f.words[id] || "いい 1にちに なるよ"}`;
        kids.append(row);
      }
      result.classList.add("show");
    };
    box.append(ball, result);
    if (drawn) { reveal(); box.append(U.el("p", { class: "muted", text: "また あした うらなおう。" })); }
    else {
      const go = UI.btn("うらなう", () => {
        go.disabled = true; Sound.se("sparkle"); ball.classList.add("shake");
        setTimeout(() => { ball.classList.remove("shake"); Save.d.flags.fortuneDay = f.day; Save.mark(); Sound.se("fanfare"); reveal(); go.remove(); }, 900);
      }, "wide yellow smaho-draw");
      box.append(go, U.el("p", { class: "muted", text: "1にち 1かい。ラッキー おみせは ほんとうに コインが ふえるよ（ひによって 1.2〜2ばい）。" }));
    }
    el.append(box);
  },
  // ---- おんがく: あつめた ディスク ----
  musicList(el) {
    const D = MusicDiscs.DISCS, n = MusicDiscs.count();
    el.append(U.el("p", { class: "note", text: `あつめた ディスク ${n} / ${D.length}。へやの プレーヤーを タップすると きけるよ。` }));
    const where = (d) => d.from.shop ? `おてつだい: ${SHOPS[d.from.shop]?.name || d.from.shop}` : d.from.map ? `たからばこ: ${MAP_DEFS[d.from.map]?.name || d.from.map}` : d.from.town ? "おてつだい・たからばこで まれに" : d.from.starter ? "はじめての ディスクと いっしょ" : d.from.gramophone ? "ちくおんきと いっしょ" : d.from.jukebox ? "ディスク 8まいで" : "";
    const grid = U.el("div", { class: "smaho-discs" });
    for (const d of D) {
      const own = MusicDiscs.has(d.id);
      const row = U.el("div", { class: "smaho-disc" + (own ? "" : " lock"), html: `${MusicDiscs.art(d, 34)}<div><b></b><small></small></div>` });
      row.querySelector("b").textContent = own ? MusicDiscs.title(d) : "？？？";
      row.querySelector("small").textContent = where(d);
      grid.append(row);
    }
    el.append(grid);
  },
  // ---- たてものの 中の「ちず」: いまの かいと フロアマップへ（ちずの まちは たてものの いりぐちが「いま ここ」） ----
  inside(el, ph) {
    const sc = G.scene;
    if (G.sceneName !== "venue" || !sc || !sc.def) return;
    const box = U.el("div", { class: "smaho-inside" });
    box.append(U.el("p", { class: "smaho-inside-at", text: `いまは「${sc.def.name}」の ${sc.floor}F に いるよ。` }));
    box.append(UI.btn("この たてものの フロアマップ", () => {
      ph.close();
      // すまほが とじてから（おなじ たてものの まま なら）フロア案内を ひらく
      setTimeout(() => { if (G.scene === sc && !sc.closed && sc.guideMenu) sc.guideMenu(); }, 220);
    }, "wide smaho-floor-go"));
    el.append(box);
  },
  // ---- 左下の「すまほ」ボタン ----
  badge(id) {
    if (id === "fortune") return Save.d?.flags?.fortuneDay !== U.today();
    if (id === "rally" && typeof DailyPlay !== "undefined") return Save.d?.daily?.last !== U.today();
    if (id === "event" && typeof AnnualFestivals !== "undefined") { const s = AnnualFestivals.state(AnnualFestivals.current().month); return s.available && !s.claimed && s.count >= 3; }
    return false;
  },
  button: null,
  mountButton() {
    if (this.button) return this.button;
    const b = U.el("button", { class: "btn smaho-btn hidden", "aria-label": "すまほ", html: `${this.svg("phone", 30)}<span>すまほ</span><i class="smaho-dot hidden"></i>` });
    b.addEventListener("click", () => { if (!Game.inputLocked && !UI.busy) this.open(); });
    UI.root.append(b);
    this.button = b;
    setInterval(() => this.place(), 250);
    return b;
  },
  // どの 画面で どこに 出すか（町・フィールド・たてものの 中: おまつりボタンの ばしょ〔たてものの したの「スライド・タップで あるく」の ふだより うえ〕。おうち・おみせ: 下の ボタンの 上）
  place() {
    const b = this.button; if (!b) return;
    const sc = G.scene, name = G.sceneName;
    const hud = UI.hud && !UI.hud.classList.contains("hidden");
    const ok = hud && (name === "world" || name === "store" || (name === "venue" && !sc?.closed) || (name === "house" && !sc?.mode && !sc?.watching)) && !Game.trans;
    b.classList.toggle("hidden", !ok);
    if (!ok) return;
    const bar = name === "house" ? sc.bar : name === "store" ? sc.bar : null;
    const h = bar && bar.isConnected && !bar.classList.contains("hidden") ? bar.getBoundingClientRect().height : 0;
    b.style.bottom = h ? `${Math.round(h + 10)}px` : "";
    b.querySelector(".smaho-dot").classList.toggle("hidden", !["fortune", "rally", "event"].some((id) => this.badge(id)));
  },
};

// ---- つなぎ ----
(() => {
  // 町・フィールドの「おまつり」ボタンは 出さない（すまほの イベント・スタンプラリーへ）
  Seasonal.mount = function (sc) { Smaho.mountButton(); sc.festivalButton = null; };
  Seasonal.refresh = function () {};
  // Esc（cancel）は すまほ。≡ は Menu.open（せってい）
  Game.openMenu = function () { if (!this.inputLocked) Smaho.toggle(); };
  const showHud = UI.showHud;
  UI.showHud = function (on, place) { const r = showHud.call(this, on, place); if (Save.d) Smaho.mountButton(); Smaho.place(); return r; };
})();
