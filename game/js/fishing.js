// ③ 釣り（docs/design/features/fishing の 見本 tools/feature-design/fishing-ref.js の FishingRef を 移した もの）。
// 1番: 魚の えらびかた（pool・pick・size・shadowOf は 見本と おなじ 計算）・ずかんの きろく・メニューの「さかな ずかん」。
// 釣りの 画面（Game・draw・FishingScene）は 2番で 足す。データは FISHING_DATA（自動生成）、セーブは Save.d.fish。
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

  // ---- さかな ずかん（メニューの「ずかん」→「さかな」。見本 img/fishing-flow.png の ⑥）----
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
      b.addEventListener("click", () => { Sound.se("tap"); for (const n of [head, tabs, grid]) n.remove(); this.dex(el, k); });
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
    el.append(head, tabs, grid);
  },
  // くわしい ページ（⑦）: すむ 場所・季節・時間・大きさ・いちばん 大きい 記録・つった 数・説明・まめちしき
  detail(id) {
    const f = this.fish(id), rec = this.st().dex[id]; if (!f || !rec) return null;
    const body = U.el("div", { class: "fish-card fish-detail" });
    body.innerHTML = `<div class="art">${this.svg(f, "x" + f.id)}</div><div class="nm"></div><div class="star">${this.stars(f)}</div>`
      + `<div class="facts"><span>すんで いる ところ</span><span>${this.where(f)}</span><span>つれる きせつ</span><span>${this.when(f.season, this.SEASONS)}</span>`
      + `<span>つれる じかん</span><span>${this.when(f.time, this.TIMES)}</span><span>おおきさ</span><span>${f.size[0]}〜${f.size[1]}cm</span>`
      + `<span>いちばん おおきい</span><span>${rec.max}cm（${rec.n}ひき つった）</span></div><div class="desc"></div><div class="fact"><b>まめちしき</b><span></span></div>`;
    body.querySelector(".nm").textContent = f.name; body.querySelector(".desc").textContent = f.desc; body.querySelector(".fact span").textContent = f.fact;
    return UI.modal({ title: f.name, body });
  },
};
