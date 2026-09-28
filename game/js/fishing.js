// ③ 釣り（docs/design/features/fishing の 見本 tools/feature-design/fishing-ref.js の FishingRef を 移した もの）。
// 1番: 魚の えらびかた（pool・pick・size・shadowOf は 見本と おなじ 計算）・ずかんの きろく・すまほの「ずかん」の さかな。
// 2番: つりざお。つる ながれ（魚の かげ・なげる・うき・じまん）は js/fishing-line.js（FishLine。UI-02 で 見おろしの まま つる ように した）。
// 3番: いけす・スーパーで うる（sell）。データは FISHING_DATA（自動生成）、セーブは Save.d.fish。
const Fishing = {
  WEIGHT: { 1: 10, 2: 6, 3: 3, 4: 1.2, 5: 0.35 }, // rarity ごとの 出やすさ
  PLACES: { pond: "いけ", river: "かわ", stream: "さわ", beach: "うみべ", harbor: "みなと" },
  SEASONS: { spring: "はる", summer: "なつ", autumn: "あき", winter: "ふゆ" },
  TIMES: { morning: "あさ", day: "ひる", evening: "ゆうがた", night: "よる", late: "しんや" },
  data() { return typeof FISHING_DATA !== "undefined" ? FISHING_DATA : null; },
  fish(id) { return ((this.data() || {}).fish || []).find((f) => f.id === id) || null; },
  st() { return Save.d.fish; },
  ok(v, x) { return v === "all" || v == null || (Array.isArray(v) ? v.includes(x) : v === x); },
  // その ときに つれる 魚の 一覧（weather は あると 出やすい「ボーナス」。なくても つれる）
  pool(place, c, caughtKinds = 0) {
    return this.data().fish.filter((f) => (f.place === place || (f.also || []).includes(place)) && this.ok(f.season, c.season) && this.ok(f.time, c.time) && (!f.unlock || caughtKinds >= f.unlock))
      .map((f) => ({ f, w: this.WEIGHT[f.rarity] * (f.weather && f.weather.includes(c.weather) ? 2 : 1) * (c.rodPower > 1 && f.rarity >= 3 ? 1.4 : 1) }));
  },
  pick(place, c, rand = Math.random, caughtKinds = 0) {
    const p = this.pool(place, c, caughtKinds); if (!p.length) return null;
    let r = rand() * p.reduce((a, x) => a + x.w, 0);
    for (const x of p) { r -= x.w; if (r < 0) return x.f; }
    return p[p.length - 1].f;
  },
  // 大きさ（cm）: min〜max の 三角分布（まんなかが 出やすい）。0.1cm きざみ
  size(f, rand = Math.random) { const t = (rand() + rand()) / 2; return Math.round((f.size[0] + (f.size[1] - f.size[0]) * t) * 10) / 10; },
  shadowOf(f) { return f.shadow || (f.size[1] < 12 ? "S" : f.size[1] <= 30 ? "M" : f.size[1] <= 80 ? "L" : "XL"); },
  // いまの ようす（時間の くぎりは ①② と おなじ U.dayPart）
  context(rodPower = 1) { return { time: U.dayPart(), season: Seasonal.current().id, weather: Weather.kind(), rodPower }; },
  kinds() { return Object.keys(this.st().dex).length; },
  // つれた（テストの fishGive も）: ずかんに のせて、いけすに 入れる。はじめての 魚なら true
  record(id, cm, { keep = true } = {}) {
    const st = this.st(), rec = st.dex[id], first = !rec;
    st.dex[id] = { n: (rec ? rec.n : 0) + 1, max: Math.max(rec ? rec.max : 0, cm), first: rec ? rec.first : U.today() };
    if (keep) st.keep[id] = (st.keep[id] || 0) + 1;
    st.caught++;
    Save.mark();
    return first;
  },
  // DOM に 入れる 魚の 絵（uid ごとに 1かい だけ つくる。uid は "d"+id・"x"+id など 有限個）
  svgs: {},
  svg(f, uid) { return this.svgs[uid] || (this.svgs[uid] = FishArt.svg(f.art, { uid, flip: !!f.flip })); },
  stars(f) { return "★".repeat(f.rarity) + "☆".repeat(5 - f.rarity); },
  where(f) { return [f.place, ...(f.also || [])].map((p) => this.PLACES[p]).join("・"); },
  when(v, names) { return v === "all" ? "いつでも" : v.map((x) => names[x]).join("・"); },

  // ---- さかな ずかん（すまほの「ずかん」→「さかな」。見本 img/fishing-flow.png の ⑥）----
  // つった 魚だけ 絵が 出る。まだの 魚は かげ（おなじ 絵を くろく する）。きょう はじめて つった 魚に NEW
  dex(el, tab = this.dexTab || "all") {
    this.dexTab = tab;
    const D = this.data(), dex = this.st().dex, today = U.today();
    const head = U.el("div", { class: "fish-dex-head" });
    head.innerHTML = `<span class="cnt">${Object.keys(dex).filter((id) => this.fish(id)).length} / ${D.fish.length} しゅ</span><span class="muted">つった ことの ある 魚だけ 絵が でるよ</span>`;
    const tabs = U.el("div", { class: "fish-dex-tabs" });
    for (const [k, label] of [["all", "ぜんぶ"], ...Object.entries(this.PLACES)]) {
      const b = U.el("button", { class: "tab" + (k === tab ? " on" : ""), text: label });
      b.dataset.k = k;
      b.addEventListener("click", () => { Sound.se("tap"); for (const n of [head, keep, tabs, grid]) n.remove(); this.dex(el, k); });
      tabs.append(b);
    }
    const grid = U.el("div", { class: "fish-dex" });
    D.fish.forEach((f, i) => {
      if (tab !== "all" && f.place !== tab && !(f.also || []).includes(tab)) return;
      const c = dex[f.id], cell = U.el("div", { class: "fish-cell" + (c ? "" : " unknown") });
      cell.dataset.id = f.id;
      cell.innerHTML = `<span class="no">${i + 1}</span>${c && c.first === today ? '<span class="new">NEW</span>' : ""}${this.svg(f, "d" + f.id)}<div class="nm">${c ? f.name : "？？？"}</div>`;
      if (c) cell.addEventListener("click", () => { Sound.se("tap"); this.detail(f.id); });
      grid.append(cell);
    });
    const keep = U.el("div", { class: "fish-keep", text: `いけすに いる さかな ${this.keepCount()} / ${this.KEEP_MAX} ぴき` });
    el.append(head, keep, tabs, grid);
  },
  // くわしい ページ（⑦）: すむ 場所・季節・時間・大きさ・いちばん 大きい 記録・つった 数・説明・まめちしき
  detail(id) {
    const f = this.fish(id), rec = this.st().dex[id]; if (!f || !rec) return null;
    const body = U.el("div", { class: "fish-card fish-detail" });
    const aq = typeof Museum !== "undefined" && Museum.data() && Museum.gaveFish(f.id); // ⑤ 寄贈した 魚
    body.innerHTML = `<div class="art">${this.svg(f, "x" + f.id)}</div><div class="nm"></div><div class="star">${this.stars(f)}</div>${aq ? '<div class="aq-mark">すいぞくかんに いるよ</div>' : ""}`
      + `<div class="facts"><span>すんで いる ところ</span><span>${this.where(f)}</span><span>つれる きせつ</span><span>${this.when(f.season, this.SEASONS)}</span>`
      + `<span>つれる じかん</span><span>${this.when(f.time, this.TIMES)}</span><span>おおきさ</span><span>${f.size[0]}〜${f.size[1]}cm</span>`
      + `<span>いちばん おおきい</span><span>${rec.max}cm（${rec.n}ひき つった）</span></div><div class="desc"></div><div class="fact"><b>まめちしき</b><span></span></div>`;
    body.querySelector(".nm").textContent = f.name; body.querySelector(".desc").textContent = f.desc; body.querySelector(".fact span").textContent = f.fact;
    return UI.modal({ title: f.name, body });
  },

  // ---- 3番: いけす（ぜんぶで 30ぴきまで。⑤ の 寄贈・② の 物々交換で へる）----
  KEEP_MAX: 30,
  keepCount() { return Object.values(this.st().keep).reduce((a, n) => a + (n || 0), 0); },

  // ---- 2番: つりざお（だいじな もの）----
  rod() { const n = (Save.d.fish || {}).rod || 0; return n > 0 ? this.data().rods[n - 1] : null; },
  // 3番: りっぱな つりざおの お店（rods[1].get.shop の 建物が ある マップと、その 建物の お店）
  proShop() {
    const g = this.data().rods[1].get;
    for (const [map, d] of Object.entries(MAP_DEFS)) { const b = (d.buildings || []).find((x) => x.id === g.shop); if (b && b.act) return { map, shop: b.act.shop, price: g.price }; }
    return null;
  },
  // StoreScene.talk の えらぶ ことば（みなとの マルシェで、まだ りっぱな さおが ない とき）
  proChoice(store) {
    const p = this.data() && this.proShop();
    return p && store.shopId === p.shop && store.back && store.back.map === p.map && this.st().rod < 2 ? `${this.data().rods[1].name}（${p.price}コイン）` : null;
  },
  async buyPro(owner) {
    const r = this.data().rods[1], p = this.proShop(), face = Art.npcSvg({ ...owner, emo: "happy" });
    if (Save.d.coins < p.price) { await UI.say([{ name: owner.name, face, text: `${r.name}は ${p.price}コインだよ。\nコインを ためて また きてね。` }]); return false; }
    if (await UI.ask(`${r.name}を ${p.price}コインで かう？\n${r.note}よ。`, ["かう", "やめておく"], { face, name: owner.name }) !== 0) return false;
    Save.addCoins(-p.price); this.st().rod = 2; Save.mark(); Save.write();
    Sound.se("fanfare"); UI.toast(`<span class="fish-got">${this.rodSvg()}「${r.name}」を てにいれた！</span>`, "good");
    await UI.say([{ text: `だいじな もの「${r.name}」を てにいれた！\n${r.note}よ。` }]);
    return true;
  },
  rodSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10,56 C22,40 36,24 54,8" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M10,56 C22,40 36,24 54,8" fill="none" stroke="#C98A52" stroke-width="3" stroke-linecap="round"/>`
      + `<circle cx="19" cy="45" r="6.5" fill="#8FD0F0" stroke="${INK}" stroke-width="2.6"/><circle cx="19" cy="45" r="2" fill="${INK}"/><path d="M54,8 C57,24 58,36 56,44" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
      + `<ellipse cx="56" cy="50" rx="4.4" ry="5.2" fill="#FFFFFF" stroke="${INK}" stroke-width="2.2"/><path d="M51.6,49 A4.4,4.4 0 0 1 60.4,49 Z" fill="#E0525B" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  },
  // Talk.run から（はじめての あいさつの あと）: タウンの いけの ペンが つりざおを くれる
  async talked(n, who) {
    const D = this.data(), g = D && D.rods[0].get; if (!g || n.id !== g.npc || this.st().rod > 0) return false;
    await UI.say([{ name: who.name, face: who.face, text: g.talk }]);
    this.st().rod = 1; Save.mark(); Save.write();
    Sound.se("fanfare"); UI.toast(`<span class="fish-got">${this.rodSvg()}「${D.rods[0].name}」を もらった！</span>`, "good");
    await UI.say([{ text: `だいじな もの「${D.rods[0].name}」を てにいれた！\nみずを ながおしすると さおを なげるよ。\nさかなの かげの まえを ねらって、うきが しずんだら「つる」！` }]);
    return true;
  },

  // ---- 3番: スーパーで うる（どうぶつの森の おみせの ように。つった ときには うらない）----
  // StoreScene.talk の えらぶ ことば（スーパー・いけすに 魚が いる とき）
  sellChoice(store) { return this.data() && store.shopId === "market" && this.keepCount() > 0 ? "さかなを うる" : null; },
  // いけすから n ひき うる。ふえた コインを かえす（いなければ 0）
  sellFish(id, n = 1) {
    const f = this.fish(id), k = this.st().keep; if (!f) return 0;
    const m = Math.min(n, k[id] || 0); if (m <= 0) return 0;
    k[id] -= m; if (!k[id]) delete k[id];
    Save.addCoins(f.sell * m); Save.mark();
    return f.sell * m;
  },
  notInAquarium(id) { return typeof Museum !== "undefined" && !!Museum.data() && !Museum.gaveFish(id); },
  sell() {
    return new Promise((done) => {
      const body = U.el("div", { class: "fish-sell" }), list = U.el("div", { class: "fish-sell-list" }), foot = U.el("div", { class: "fish-sell-foot" });
      const draw = () => {
        const keep = this.st().keep, ids = this.data().fish.map((f) => f.id).filter((id) => keep[id] > 0);
        list.replaceChildren(); foot.replaceChildren();
        if (!ids.length) list.append(U.el("p", { class: "muted", text: "いけすが からっぽに なったよ。" }));
        for (const id of ids) {
          const f = this.fish(id), row = U.el("div", { class: "fish-sell-row" + (this.notInAquarium(id) ? " aq" : "") });
          row.dataset.id = id;
          row.innerHTML = `${this.svg(f, "s" + id)}<div class="t"><b></b><small></small></div>`;
          row.querySelector("b").textContent = `${f.name} ×${keep[id]}`;
          row.querySelector("small").textContent = `1ぴき ${f.sell}コイン` + (this.notInAquarium(id) ? "・すいぞくかんに まだ いない" : "");
          row.append(UI.btn("1ぴき うる", () => { const c = this.sellFish(id, 1); if (c) { Sound.se("coin"); UI.updateHud(); UI.toast(`${f.name}を うって コイン +${c}`, "good"); } draw(); }, "small yellow"));
          list.append(row);
        }
        if (!ids.length) return;
        const total = ids.reduce((a, id) => a + this.fish(id).sell * keep[id], 0);
        foot.append(UI.btn(`ぜんぶ うる（${total}コイン）`, async () => {
          if (ids.some((id) => this.notInAquarium(id)) && !(await UI.confirm("すいぞくかんに まだ いない さかなも いっしょに うる？"))) return;
          let c = 0; for (const id of ids) c += this.sellFish(id, keep[id] || 0);
          Sound.se("coin"); UI.updateHud(); UI.toast(`ぜんぶ うって コイン +${c}`, "good"); draw();
        }, "wide"));
      };
      body.append(U.el("p", { class: "note", text: "いけすの さかなを かいとるよ。すいぞくかんに まだ いない さかなは きふも できるよ。" }), list, foot);
      draw();
      UI.modal({ title: "さかなを うる", body, onClose: () => { Save.write(); done(); } });
    });
  },
};
