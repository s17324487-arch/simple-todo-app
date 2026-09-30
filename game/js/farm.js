// はたけ（オーナーの FB 2026-09-30「やおやを 削除して、お家の 横に、畑での 作物を 育てる 機能を 追加して ほしい。水やりや 種まきを して、
// 料理の 素材や フルーツを 育てられる ように。イラストで 畑に 実際に 実る ように して タップすると 収穫できる イメージ。
// デザインなどは リアルファームを 参考に。難易度は 低めで 良い」）。
// ・ネリカスタウンの おうちの ひだり（まえの やおや の ところ）に はたけ 6まい（js/nerikasu-layout.js が おく）。
//   町で はたけを タップ → 3人が となりまで あるいて たねまき・みずやり・しゅうかく。かんばん「はたけ」を タップ → 6まいを 大きく 見る がめん（SCENES.farm）。
// ・そだつ しくみ（リアルファームの たね・みず・えいよう・てんき を やさしく）: たねを まく（コイン）→ みず → め → はっぱ（のどが かわく）→ みず → はな → みのり。
//   ほんとうの じかんで そだつ（3〜30ぷん。リアルファームは げんじつの 1ぷんが 1にち・アスパラガスで 6じかん）。あめの ときは かってに みずやり。
//   ひりょう（10コイン）で とれる かずが +2。くさらない・かれない・しっぱいしない。しゅうかくの かずで あたらしい たねが ふえる（3かい・8かい）。
// ・とれた さくもつは もちもの（たべもの）に ふえる（おみせでは うらない）。
// セーブは あたらしい 項目 Save.d.farm だけ（Save.SCHEMA は そのまま）。絵は js/farm-art.js。
const FARM_RULES = Object.freeze({ plots: 6, fert: 10, fertBonus: 2, luck: 0.2, tiers: [0, 3, 8], waterAt: [0, 2] });
// id・なまえ・かたち（FarmArt.K）・min（ぜんぶで なんぷん）・seed（たねの コイン）・yield（とれる かず）・tier（0 はじめから・1 しゅうかく 3かい・2 8かい）
// grid（がめんの はたけ 1まいに なんかぶ〔よこ, たて〕）・town（町の はたけ）・flower（はなが さく）・たべものの ねだん・おなか・きぶん・たいりょく・せつめい
const FARM_CROPS = [
  { id: "radish", name: "はつかだいこん", kind: "root", min: 3, seed: 5, yield: 3, tier: 0, grid: [3, 2], town: [4, 2], price: 12, hunger: 8, mood: 4, hp: 10, desc: "ちいさくて まっかな だいこん。しゃきしゃき", col: { seed: "#EFE3C0", fruit: "#E2455A" } },
  { id: "carrot", name: "にんじん", kind: "root", min: 6, seed: 8, yield: 3, tier: 0, grid: [3, 2], town: [4, 2], price: 15, hunger: 10, mood: 4, hp: 14, desc: "あまい にんじん。ぽりぽり かじろう", col: { seed: "#D9C08A", fruit: "#F08A2C" } },
  { id: "potato", name: "じゃがいも", kind: "potato", min: 8, seed: 10, yield: 4, tier: 0, grid: [3, 1], town: [3, 1], flower: true, price: 18, hunger: 16, mood: 4, hp: 16, desc: "ほくほくの じゃがいも。ふかして たべよう", col: { seed: "#D2A76A", fruit: "#D2A76A" } },
  { id: "tomato", name: "トマト", kind: "stake", min: 8, seed: 10, yield: 4, tier: 0, grid: [3, 1], town: [3, 1], flower: true, price: 18, hunger: 10, mood: 8, hp: 14, desc: "まっかで あまずっぱい トマト", col: { seed: "#EFE3C0", fruit: "#E8412F" } },
  { id: "strawberry", name: "いちご", kind: "berry", min: 10, seed: 15, yield: 5, tier: 0, grid: [3, 2], town: [4, 2], flower: true, price: 30, hunger: 8, mood: 14, hp: 12, desc: "あまくて まっかな いちご", col: { seed: "#F2D36A", fruit: "#E53935" } },
  { id: "pepper", name: "ピーマン", kind: "stake", food: "pepper", min: 5, seed: 5, yield: 4, tier: 1, grid: [3, 1], town: [3, 1], flower: true, col: { seed: "#EFE3C0", fruit: "#48A843" } },
  { id: "onion", name: "たまねぎ", kind: "bulb", min: 8, seed: 8, yield: 3, tier: 1, grid: [3, 2], town: [4, 2], price: 15, hunger: 8, mood: 2, hp: 12, desc: "やくと あまく なる たまねぎ", col: { seed: "#3A3A3A", fruit: "#D9A04E" } },
  { id: "eggplant", name: "なす", kind: "stake", min: 10, seed: 10, yield: 3, tier: 1, grid: [3, 1], town: [3, 1], flower: true, price: 18, hunger: 10, mood: 3, hp: 14, desc: "つやつや むらさきの なす", col: { seed: "#EFE3C0", fruit: "#5B3A8E", stem: "#6D4E8C" } },
  { id: "cabbage", name: "キャベツ", kind: "head", min: 12, seed: 12, yield: 2, tier: 1, grid: [2, 1], town: [2, 1], price: 25, hunger: 14, mood: 4, hp: 18, desc: "まるまる おおきな キャベツ", col: { seed: "#8A6A4A", fruit: "#CDEAA5" } },
  { id: "corn", name: "とうもろこし", kind: "tall", food: "corn", min: 12, seed: 15, yield: 3, tier: 1, grid: [3, 1], town: [3, 1], flower: true, col: { seed: "#F7D24A", fruit: "#F7D24A" } },
  { id: "pumpkin", name: "かぼちゃ", kind: "vine", min: 20, seed: 20, yield: 2, tier: 2, grid: [2, 1], town: [2, 1], flower: true, price: 40, hunger: 24, mood: 8, hp: 26, desc: "ほくほく あまい かぼちゃ", col: { seed: "#EFE3C0", fruit: "#F08A24" } },
  { id: "watermelon", name: "スイカ", kind: "vine", min: 25, seed: 30, yield: 2, tier: 2, grid: [2, 1], town: [2, 1], flower: true, price: 80, hunger: 20, mood: 24, hp: 30, desc: "しましまの おおきな スイカ。3にんで わけよう", col: { seed: "#3A3A3A", fruit: "#5DB24A" } },
  { id: "melon", name: "メロン", kind: "vine", min: 30, seed: 40, yield: 2, tier: 2, grid: [2, 1], town: [2, 1], flower: true, price: 120, hunger: 20, mood: 28, hp: 30, desc: "あみあみの メロン。とびきり あまい", col: { seed: "#EFE3C0", fruit: "#BBD68A" } },
];
// あたらしい 食べ物（とうもろこし・ピーマンは まえからの 食べ物を つかう）。おみせの たなには ならばない（exclusive）
for (const c of FARM_CROPS) {
  c.food = c.food || c.id;
  if (BAG_INDEX[c.food]) continue;
  const f = { id: c.food, name: c.name, price: c.price, hunger: c.hunger, mood: c.mood, hp: c.hp, deza: false, rare: false, exclusive: "farm", desc: c.desc };
  FOODS.push(f); BAG_INDEX[f.id] = { ...f, kind: "food" };
}

const Farm = {
  crops: Object.fromEntries(FARM_CROPS.map((c) => [c.id, c])),
  fx: {}, // はたけ ごとの えんしゅつ（{ kind, t0, crop, n }・セーブしない）
  now() { return Date.now(); },
  st() {
    if (!Save.d.farm || typeof Save.d.farm !== "object") Save.d.farm = Save.fresh().farm;
    const f = Save.d.farm;
    if (!Array.isArray(f.plots)) f.plots = [];
    for (let i = 0; i < FARM_RULES.plots; i++) { const p = f.plots[i]; if (!p || typeof p !== "object" || (p.c && !this.crops[p.c])) f.plots[i] = { c: null }; }
    f.plots.length = FARM_RULES.plots;
    for (const k of ["got", "first", "cooked"]) if (!f[k] || typeof f[k] !== "object") f[k] = {};
    for (const k of ["harvests", "sown", "fert"]) if (!Number.isFinite(f[k])) f[k] = 0;
    return f;
  },
  plot(i) { return this.st().plots[i]; },
  stageMs(c) { return (c.min * 60000) / 4; },
  needsWater(s) { return FARM_RULES.waterAt.includes(s); },
  // あめの はじまり（from〜to の あいだで さいしょに あめの 3じかんの くぎりに はいった とき）。てんきは 端末の 日時で きまる（Weather.forDate）
  rainAt(from, to) {
    if (!(to >= from) || typeof Weather === "undefined") return null;
    if (Weather.override) return Weather.override === "rain" ? from : null;
    let T = from;
    for (let i = 0; i < 400 && T <= to; i++) {
      if (Weather.forDate(new Date(T)) === "rain") return T;
      const d = new Date(T); d.setHours(Math.floor(d.getHours() / 3) * 3 + 3, 0, 0, 0); T = d.getTime();
    }
    return null;
  },
  // はたけを いまの じかんまで すすめる（みずが ある あいだ だけ そだつ・はっぱが ふえたら また のどが かわく）
  step(i, now = this.now()) {
    const p = this.plot(i), c = p.c && this.crops[p.c];
    if (!c) return false;
    let ch = false;
    for (let k = 0; k < 12 && p.s < 4; k++) {
      if (!p.w) { const r = this.rainAt(p.t, now); if (r == null) break; p.w = true; p.t = r; p.rain = true; ch = true; continue; }
      const d = this.stageMs(c);
      if (now - p.t < d) break;
      p.t += d; p.s++; ch = true;
      if (p.s < 4 && this.needsWater(p.s)) p.w = false;
    }
    return ch;
  },
  update(now = this.now()) { let ch = false; for (let i = 0; i < FARM_RULES.plots; i++) ch = this.step(i, now) || ch; if (ch) Save.mark(); return ch; },
  // 町と がめんの 絵から よぶ（1びょうに 1かい）
  tick() { if (G.t < (this.nextTick || 0)) return; this.nextTick = G.t + 1; this.update(); },
  tier() { const h = this.st().harvests; let t = 0; FARM_RULES.tiers.forEach((n, i) => { if (h >= n) t = i; }); return t; },
  unlocked(c) { return c.tier <= this.tier(); },
  leftFor(c) { return Math.max(0, FARM_RULES.tiers[c.tier] - this.st().harvests); },
  sow(i, id) {
    const c = this.crops[id], f = this.st(), p = f.plots[i];
    if (!c || !p || p.c || !this.unlocked(c)) return "bad";
    if (Save.d.coins < c.seed) return "coins";
    Save.addCoins(-c.seed); f.sown++;
    f.plots[i] = { c: id, s: 0, w: false, t: this.now(), f: false, n: f.sown, rain: false };
    this.update(); Save.write(); UI.updateHud();
    return "ok";
  },
  water(i) { const p = this.plot(i); if (!p.c || p.w || p.s >= 4) return false; p.w = true; p.t = this.now(); p.rain = false; Save.mark(); Save.write(); return true; },
  fertilize(i) {
    const p = this.plot(i);
    if (!p.c || p.f || p.s >= 4) return "bad";
    if (Save.d.coins < FARM_RULES.fert) return "coins";
    Save.addCoins(-FARM_RULES.fert); p.f = true; this.st().fert++; Save.mark(); Save.write(); UI.updateHud();
    return "ok";
  },
  lucky(i, p) { return U.hash(i + 1, p.n || 0, 77) < FARM_RULES.luck; },
  yieldOf(i) { const p = this.plot(i), c = p.c && this.crops[p.c]; return c ? c.yield + (p.f ? FARM_RULES.fertBonus : 0) + (this.lucky(i, p) ? 1 : 0) : 0; },
  harvest(i) {
    const f = this.st(), p = f.plots[i], c = p.c && this.crops[p.c];
    if (!c || p.s < 4) return null;
    const before = this.tier(), lucky = this.lucky(i, p), n = this.yieldOf(i), first = !f.first[c.id];
    Save.addBag(c.food, n); f.harvests++; f.got[c.id] = (f.got[c.id] || 0) + n;
    if (first) f.first[c.id] = U.today();
    f.plots[i] = { c: null };
    const unlocked = this.tier() > before ? FARM_CROPS.filter((k) => k.tier === this.tier()) : [];
    Save.mark(); Save.write();
    return { crop: c, n, lucky, fert: !!p.f, first, unlocked };
  },
  fmt(ms) { return ms < 60000 ? `${Math.max(1, Math.ceil(ms / 1000))}びょう` : `${Math.ceil(ms / 60000)}ふん`; },
  stageName(c, s) { return ["", "めが でる", "はっぱが ふえる", c.flower ? "はなが さく" : "おおきく なる", "みのる"][s] || ""; },
  // はたけの ようす: empty・dry（みずが ほしい）・grow（そだって いる）・ripe（とれる）
  info(i, now = this.now()) {
    const p = this.plot(i), c = p.c && this.crops[p.c];
    if (!c) return { state: "empty", text: "たねを まこう" };
    if (p.s >= 4) return { state: "ripe", crop: c, text: "とれるよ！" };
    if (!p.w) return { state: "dry", crop: c, text: p.s === 0 ? "みずを あげよう" : "のどが かわいた" };
    const left = Math.max(0, this.stageMs(c) - (now - p.t));
    return { state: "grow", crop: c, left, text: `あと ${this.fmt(left)}で ${this.stageName(c, p.s + 1)}` };
  },
  // はたけの ふだの みじかい ことば（がめんの 2ぎょうめ）
  short(inf) { return inf.state === "grow" ? `あと ${this.fmt(inf.left)}` : inf.text; },
  // ---- タップ（町と がめんで おなじ）: からっぽ → たねを えらぶ・かわいた → みず・みのった → しゅうかく・そだって いる → ようす と ひりょう ----
  async act(i) {
    if (this.acting) return null;
    this.acting = true;
    try {
      this.update();
      const p = this.plot(i), c = p.c && this.crops[p.c];
      if (!c) {
        const id = await this.pick(i);
        if (!id) return null;
        const r = this.sow(i, id), k = this.crops[id];
        if (r === "coins") { await UI.say([{ name: "はたけ", text: `${k.name}の たねは ${k.seed}コイン。コインが たりないよ。` }]); return null; }
        if (r !== "ok") return null;
        Sound.se("pop"); this.fx[i] = { kind: "sow", t0: G.t };
        UI.toast(`${k.name}の たねを まいたよ。みずを あげてね！`, "good");
        return "sow";
      }
      if (p.s >= 4) {
        const h = this.harvest(i);
        Sound.se(h.first ? "fanfare" : "good"); this.fx[i] = { kind: "harvest", t0: G.t, crop: c.id, n: h.n };
        UI.toast(`${c.name}を ${h.n}こ とったよ！${h.lucky ? " おおきく そだったね！" : ""}${h.fert ? " ひりょうの おかげ！" : ""}`, "good");
        if (h.unlocked.length) setTimeout(() => { Sound.se("levelup"); UI.toast(`あたらしい たねが ふえたよ！<br>${h.unlocked.map((k) => k.name).join("・")}`, "good"); }, 1200);
        return "harvest";
      }
      if (!p.w) {
        this.water(i); Sound.se("swish"); this.fx[i] = { kind: "water", t0: G.t };
        UI.toast(p.s === 0 ? "みずを あげたよ。めが でるのが たのしみ！" : "みずを あげたよ。ぐんぐん そだつよ！", "good");
        return "water";
      }
      const inf = this.info(i);
      if (!p.f) {
        const k = await UI.ask(`${c.name}\n${inf.text}。\nひりょうを まくと、とれる かずが ${FARM_RULES.fertBonus}こ ふえるよ。`, [`ひりょうを まく（${FARM_RULES.fert}コイン）`, "このまま まつ"]);
        if (k !== 0) return null;
        const r = this.fertilize(i);
        if (r === "coins") { await UI.say([{ name: "はたけ", text: `ひりょうは ${FARM_RULES.fert}コイン。コインが たりないよ。` }]); return null; }
        if (r !== "ok") return null;
        Sound.se("sparkle"); this.fx[i] = { kind: "fert", t0: G.t };
        UI.toast("ひりょうを まいたよ！ げんき いっぱい", "good");
        return "fert";
      }
      UI.toast(`${c.name}: ${inf.text}`);
      return "info";
    } finally { this.acting = false; }
  },
  // たねを えらぶ まど（2れつ）。とじたら null
  pick(i) {
    UI.toastBox.replaceChildren();
    return new Promise((res) => {
      let m = null;
      const done = (v) => { if (!m) return; const mm = m; m = null; mm.close(); res(v); };
      const body = U.el("div", { class: "farm-seeds" }), grid = U.el("div", { class: "farm-seed-grid" });
      body.append(U.el("p", { class: "farm-lead", text: "どの たねを まく？ みずを 2かい あげると みのるよ。" }));
      for (const c of FARM_CROPS) {
        const open = this.unlocked(c), b = U.el("button", { class: "btn farm-seed" + (open ? "" : " locked") });
        b.setAttribute("aria-label", c.name + "の たね");
        b.innerHTML = `<span class="farm-seed-ico">${Art.iconSvg("bag", c.food)}</span><span class="farm-seed-txt"><b>${c.name}</b><small>${c.min}ふんで ${c.yield}こ</small><small class="farm-seed-price">${open ? `たね ${c.seed}コイン` : `しゅうかく あと ${this.leftFor(c)}かい`}</small></span>`;
        if (open) b.addEventListener("click", () => { Sound.se("ok"); done(c.id); }); else b.disabled = true;
        grid.append(b);
      }
      body.append(grid, U.el("p", { class: "note", text: `いまの コイン ${U.fmt(Save.d.coins)}まい。たくさん しゅうかくすると あたらしい たねが ふえるよ。` }));
      m = UI.modal({ title: `たねを えらぶ（はたけ ${i + 1}）`, body, onClose: () => { if (m) { m = null; res(null); } } });
    });
  },
  // さくもつ ずかん（とった かず・はじめて とった 日）
  openDex() {
    UI.toastBox.replaceChildren();
    const f = this.st(), body = U.el("div", { class: "farm-dex" });
    body.append(U.el("p", { class: "farm-lead", text: `しゅうかく ${f.harvests}かい。とれた さくもつは もちものに はいるよ。` }));
    const list = U.el("div", { class: "farm-dex-list" });
    for (const c of FARM_CROPS) {
      const got = f.got[c.id] || 0, row = U.el("div", { class: "farm-dex-row" + (got ? "" : " none") });
      const day = f.first[c.id] && f.first[c.id].split("-"), when = day && day.length === 3 ? `はじめて ${+day[1]}がつ ${+day[2]}にち` : "";
      row.innerHTML = `<span class="farm-seed-ico">${Art.iconSvg("bag", c.food)}</span><span class="farm-dex-txt"><b>${got ? c.name : "？？？"}</b><small>${got ? `${got}こ とった` : this.unlocked(c) ? "まだ とって いない" : `しゅうかく あと ${this.leftFor(c)}かい`}</small>${when ? `<small>${when}</small>` : ""}</span>`;
      list.append(row);
    }
    body.append(list);
    return UI.modal({ title: "さくもつ ずかん", body });
  },

  // ---- 町の はたけ（MAP_DEFS.town の farmPlot の 小物・4×2マス）----
  townGrid(c) { return c.town || c.grid; },
  drawTown(ctx, o, ox, oy, bounds) {
    const i = o.farmPlot, x = ox + o.x * TS, y = oy + o.y * TS, w = o.w * TS, h = o.h * TS;
    if (x > (bounds?.w || G.W) + 40 || x + w < -40 || y > (bounds?.h || G.H) + 70 || y + h < -70) return;
    this.tick();
    const p = this.plot(i), c = p.c && this.crops[p.c];
    if (c && p.w && p.s < 4) { const img = FarmArt.bedImg(w, h, true, true); if (img) ctx.drawImage(img, x, y, w, h); }
    if (c) {
      const [cols, rows] = this.townGrid(c), cw = w / cols, ch = h / rows, size = Math.min(cw * 1.2, ch * 1.55, 48);
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const img = FarmArt.plantImg(c, p.s, size);
        if (img) ctx.drawImage(img, x + cw * (k + 0.5) - size / 2, y + ch * (r + 1) - size * 0.9 - 1, size, size);
      }
    }
    this.drawBadge(ctx, i, x + w - 12, y - 4, 13);
    this.drawFx(ctx, i, x, y, w, h);
  },
  // はたけの うえの しるし（みず・とれる）
  drawBadge(ctx, i, x, y, r) {
    const inf = this.info(i);
    if (inf.state !== "dry" && inf.state !== "ripe") return;
    const bob = Math.sin(G.t * 4 + i) * 2;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = inf.state === "dry" ? "#EAF6FF" : "#FFF6C8"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    if (inf.state === "dry") { const img = FarmArt.toolImg("drop", r * 1.5); if (img) ctx.drawImage(img, -r * 0.75, -r * 0.8, r * 1.5, r * 1.5); }
    else { const R = r * 0.72, q = r * 0.2; ctx.rotate(Math.sin(G.t * 2 + i) * 0.25); ctx.fillStyle = "#F4B400"; ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(q, -q); ctx.lineTo(R, 0); ctx.lineTo(q, q); ctx.lineTo(0, R); ctx.lineTo(-q, q); ctx.lineTo(-R, 0); ctx.lineTo(-q, -q); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.restore();
  },
  // えんしゅつ（みずの しずく・たね・ひりょうの きらきら・しゅうかくの ぽん）。x, y, w, h は はたけの 画面の ばしょ
  drawFx(ctx, i, x, y, w, h, to = null) {
    const f = this.fx[i];
    if (!f) return;
    const k = (G.t - f.t0) / (f.kind === "harvest" ? 1.3 : 0.95);
    if (k >= 1 || k < 0) { delete this.fx[i]; return; }
    ctx.save();
    if (f.kind === "water") {
      ctx.strokeStyle = "rgba(111,183,230,.95)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (let n = 0; n < 14; n++) { const px = x + w * ((n * 0.37 + 0.07) % 1), py = y - 14 + ((k * 1.6 + n * 0.13) % 1) * (h + 10); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 1.5, py + 6); ctx.stroke(); }
    } else if (f.kind === "sow") {
      ctx.fillStyle = "#7A5230";
      for (let n = 0; n < 12; n++) { const px = x + w * ((n * 0.29 + 0.1) % 1), py = y + h * 0.5 - Math.sin(k * Math.PI) * 18 + ((n * 7) % 11); ctx.globalAlpha = 1 - k * 0.6; ctx.beginPath(); ctx.ellipse(px, py, 2, 1.4, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (f.kind === "fert") {
      ctx.globalAlpha = 1 - k;
      if (typeof FX !== "undefined" && FX.sparkles) FX.sparkles(ctx, x + w / 2, y + h / 2, k);
      ctx.fillStyle = "#7BC46A"; for (let n = 0; n < 8; n++) { const a = n * 0.785 + k * 2, rr = 8 + k * w * 0.35; ctx.beginPath(); ctx.arc(x + w / 2 + Math.cos(a) * rr, y + h / 2 + Math.sin(a) * rr * 0.5, 2.4, 0, Math.PI * 2); ctx.fill(); }
    } else if (f.kind === "harvest") {
      const c = this.crops[f.crop], n = Math.min(6, f.n || 3), size = Math.min(34, w * 0.34);
      for (let j = 0; j < n; j++) {
        const img = FarmArt.foodImg(c.food, size);
        let px = x + w * (0.2 + (0.6 * j) / Math.max(1, n - 1)), py = y + h * 0.45 - Math.sin(Math.min(1, k * 2.4) * Math.PI * 0.5) * (26 + (j % 2) * 10), sz = size;
        // がめん: ぽんと とびでて、かごへ（to）
        if (to && k > 0.42) { const q = Math.min(1, (k - 0.42 - j * 0.03) / 0.45); if (q > 0) { const e = q * q * (3 - 2 * q); px += (to.x - px) * e; py += (to.y - py) * e - Math.sin(e * Math.PI) * 30; sz = size * (1 - 0.55 * e); } }
        ctx.globalAlpha = to ? (k < 0.9 ? 1 : (1 - k) * 10) : k < 0.75 ? 1 : (1 - k) * 4;
        if (img) ctx.drawImage(img, px - sz / 2, py - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1 - k; if (typeof FX !== "undefined" && FX.sparkles) FX.sparkles(ctx, x + w / 2, y + h * 0.3, k);
    }
    ctx.restore();
  },
  // 町で はたけを タップ（3人が となりに ついてから）
  async townTap(sc, o) {
    const r = await this.act(o.farmPlot);
    if (!r || r === "info") return;
    sc.party.forEach((w) => { w.hop = 0.35; });
    if (r === "harvest") sc.party.forEach((w) => sc.addFx("heart", w));
    else sc.addFx("note", sc.party[0]);
  },
  // かんばん → はたけの がめん（かえりは かんばんの まえ）
  openScene(sc, o) {
    if (Game.trans) return;
    Sound.se("door");
    Game.goto("farm", { back: { map: sc.mapId, x: o.x, y: o.y + o.h, dir: "up" } }, "circle");
  },
  // テスト用: じかんを すすめる（はたけの じかんを min ぷん まえに ずらす）
  skip(min) { for (const p of this.st().plots) if (p.c && Number.isFinite(p.t)) p.t -= min * 60000; this.update(); Save.write(); },
};

// 町の はたけ: 絵（ぬれた つち・さくもつ・しるし・えんしゅつ）と タップ
(() => {
  const draw0 = WorldScenery.draw.bind(WorldScenery), act0 = WorldScenery.activate.bind(WorldScenery);
  WorldScenery.draw = (ctx, s, ox, oy, bounds) => { if (s.o && s.o.farmPlot != null) { Farm.drawTown(ctx, s.o, ox, oy, bounds); return; } draw0(ctx, s, ox, oy, bounds); };
  WorldScenery.activate = (sc, o) => { if (o && o.farmPlot != null) return Farm.townTap(sc, o); if (o && o.farmSign) return Farm.openScene(sc, o); return act0(sc, o); };
})();

// ---- はたけの がめん（6まいを 大きく・3人が まんなかの みちを あるいて おせわ）----
class FarmScene {
  async enter(p = {}) {
    this.back = { ...(p.back || { map: "town", x: 11, y: 58, dir: "up" }) };
    this.closed = false; this.busy = false; this.leaving = false; this.rainMsg = false;
    this.team = Save.d.order.map((id, i) => ({ id, i, x: 0, y: 0, tx: 0, ty: 0, dir: "up", hop: 0, face: "normal", faceT: 0 }));
    Farm.update();
    this.resize();
    for (const t of this.team) { t.x = t.tx; t.y = t.ty; }
    await this.preload();
    if (this.closed) return;
    UI.showHud(true, "はたけ");
    this.bar = U.el("div", { class: "farm-bar" });
    this.bar.append(UI.btn("ずかん", () => { if (!this.busy) Farm.openDex(); }, "small"), UI.btn("りょうり", () => { if (!this.busy && typeof FarmCook !== "undefined") FarmCook.open(); }, "small"), UI.btn("まちへ", () => this.leave(), "small yellow"));
    for (const [b, label] of [[this.bar.children[0], "さくもつ ずかん"], [this.bar.children[1], "とれたて りょうり"], [this.bar.children[2], "まちへ もどる"]]) b.setAttribute("aria-label", label);
    document.getElementById("ui").append(this.bar);
    UI.toastBox.classList.add("farm-toasts"); // おしらせは したの ボタンの うえ（うえの はたけに かさならない）
    Sound.bgm("meadow");
  }
  exit() { this.closed = true; this.bar?.remove(); UI.toastBox.classList.remove("farm-toasts"); }
  // うえから: HUD（0〜54）・おうちの かべと さく（54〜104）・はたけ 3だん×2れつ（まんなかに みち）・したの くさはら（3人・ボタン）
  resize() {
    const W = G.W, H = G.H, top = 106, bottom = H - 118, gap = 12, pathW = 60;
    const ph = U.clamp(Math.floor((bottom - top - gap * 2) / 3), 88, 158), pw = Math.floor((W - 20 - pathW) / 2);
    const y0 = top + Math.max(0, Math.floor((bottom - top - (ph * 3 + gap * 2)) / 2));
    this.path = { x: 10 + pw, w: pathW, cx: W / 2 };
    this.plots = Array.from({ length: FARM_RULES.plots }, (_, i) => ({ x: i % 2 ? W - 10 - pw : 10, y: y0 + Math.floor(i / 2) * (ph + gap), w: pw, h: ph }));
    this.fieldBottom = y0 + ph * 3 + gap * 2;
    this.charSize = U.clamp(Math.round(ph * 0.34), 36, 46);
    this.foot = 36; // はたけの まえの いた（なふだ）
    this.home = { y: Math.min(H - 70, this.fieldBottom + 44) };
    this.basket = { x: W / 2 + 25, y: 90 }; // しゅうかくした さくもつが とんで いく かご（drawBackdrop）
    this.spots(null);
  }
  // 3人の たちいち: target の はたけの よこ（みちの うえ）か、したの くさはら
  spots(i) {
    const cx = this.path.cx;
    if (i == null) { this.team.forEach((t, k) => { t.tx = cx + (k - 1) * 46; t.ty = this.home.y; t.dir = "up"; }); return; }
    const r = this.plots[i], left = i % 2 === 0, y = r.y + r.h * 0.62;
    this.team.forEach((t, k) => { t.tx = cx + (k === 0 ? 0 : k === 1 ? -6 : 6); t.ty = Math.min(this.home.y, y + k * 30); t.dir = k === 0 ? (left ? "left" : "right") : "up"; });
  }
  async preload() {
    const list = [];
    for (const t of this.team) { const c = Save.d.chars[t.id]; for (const dir of ["up", "left", "right", "down"]) for (const pose of ["idle_01", "walk_01", "walk_02"]) list.push([t.id, { pose, dir, outfit: c.outfit, color: c.color }]); list.push([t.id, { pose: "jump_01", dir: "down", face: "happy", outfit: c.outfit, color: c.color }], [t.id, { pose: "idle_01", dir: "down", face: "happy", outfit: c.outfit, color: c.color }]); }
    const jobs = [Chara.preload(list, this.charSize)];
    const r = this.plots[0];
    for (const wet of [false, true]) for (const rows of [1, 2, 3]) jobs.push(FarmArt.bedReady(r.w, r.h, wet, false, rows, this.foot));
    for (const c of FARM_CROPS) for (let s = 0; s <= 4; s++) jobs.push(FarmArt.plantReady(c, s, this.plantSize(c)));
    for (const t of ["can", "drop", "seeds", "fert", "basket"]) jobs.push(FarmArt.toolReady(t, 40));
    await Promise.all(jobs);
  }
  // はたけ 1まいの なかの さくもつの 大きさ（まえの いたの うえの つち）
  plantSize(c) { const r = this.plots[0], [cols, rows] = c.grid, cw = (r.w - 16) / cols, so = FarmArt.soil(r.w, r.h, rows, this.foot); return Math.round(Math.min(cw * (rows === 1 ? 1.75 : 1.5), (so.h / rows) * (rows === 1 ? 1.15 : 1.5), 92)); }
  plotAt(x, y) { return this.plots.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y - 10 && y <= r.y + r.h); }
  up(p, cancel) {
    if (cancel || !p.tap || this.busy || this.leaving || Game.inputLocked) return;
    const i = this.plotAt(p.x, p.y);
    if (i >= 0) { this.tapPlot(i); return; }
    const t = this.team.find((t) => Math.abs(p.x - t.x) < 20 && p.y < t.y + 4 && p.y > t.y - this.charSize * 1.1);
    if (t) { t.hop = 0.35; Sound.se(t.id === "wanko" ? "wan" : t.id === "gachan" ? "piyo" : "gao"); }
  }
  async tapPlot(i) {
    this.busy = true;
    try {
      Sound.se("tap");
      this.spots(i);
      await this.arrive();
      const r = await Farm.act(i);
      if (r && r !== "info") this.team.forEach((t, k) => { t.hop = 0.35 + k * 0.05; if (r === "harvest") { t.face = "happy"; t.faceT = 1.4; } });
    } finally { this.busy = false; }
  }
  arrive() { return new Promise((res) => { const chk = () => { if (this.closed || this.team.every((t) => Math.hypot(t.tx - t.x, t.ty - t.y) < 1)) res(); else setTimeout(chk, 50); }; chk(); }); }
  leave() { if (this.leaving || Game.trans || this.busy) return; this.leaving = true; Game.goto("world", this.back, "circle"); }
  key(k, down) { if (down && k === "cancel") this.leave(); }
  update(dt) {
    Farm.tick();
    const sp = 330 * dt;
    for (const t of this.team) {
      const dx = t.tx - t.x, dy = t.ty - t.y, d = Math.hypot(dx, dy);
      t.moving = d > 1;
      if (t.moving) { const m = Math.min(1, sp / d); t.x += dx * m; t.y += dy * m; t.walkT = (t.walkT || 0) + dt; if (Math.abs(dy) > Math.abs(dx) * 0.6) t.walkDir = dy < 0 ? "up" : "down"; else t.walkDir = dx < 0 ? "left" : "right"; }
      if (t.hop > 0) t.hop = Math.max(0, t.hop - dt);
      if (t.faceT > 0 && (t.faceT -= dt) <= 0) t.face = "normal";
    }
    if (!this.rainMsg && typeof Weather !== "undefined" && Weather.kind() === "rain") { this.rainMsg = true; if (Save.d.farm.plots.some((p) => p.rain)) UI.toast("あめが ふって、はたけに みずを あげて くれたよ。", "good"); }
  }
  render(ctx) {
    const W = G.W, H = G.H;
    // くさはら・うしろの さくと おうちの かべ
    ctx.fillStyle = "#A9D08A"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#9BC77C"; for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = 110 + ((i * 61) % Math.max(60, H - 120)); ctx.beginPath(); ctx.ellipse(x, y, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    this.drawBackdrop(ctx, W);
    // まんなかの みち（つち）
    ctx.fillStyle = "#D9BE8C"; U.rr(ctx, this.path.x + 6, 96, this.path.w - 12, H - 96, 14); ctx.fill();
    ctx.strokeStyle = "rgba(160,120,70,.45)"; ctx.lineWidth = 1.5; for (let y = 120; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(this.path.cx - 8, y); ctx.lineTo(this.path.cx - 3, y + 3); ctx.stroke(); }
    for (let i = 0; i < FARM_RULES.plots; i++) this.drawPlot(ctx, i);
    // 3人（うしろから）
    const order = [...this.team].sort((a, b) => a.y - b.y);
    for (const t of order) this.drawMember(ctx, t);
    this.drawCan(ctx);
    if (typeof Weather !== "undefined" && Weather.kind() === "rain") this.drawRain(ctx, W, H);
  }
  drawBackdrop(ctx, W) {
    // おうちの かべ（クリームいろの いた・まど・はなだん）と しろい さく
    ctx.fillStyle = "#F6ECD6"; ctx.fillRect(0, 54, W, 42);
    ctx.strokeStyle = "#E3D3B2"; ctx.lineWidth = 1.2; for (let y = 60; y < 96; y += 7) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (const x of [W * 0.2, W * 0.8]) { ctx.fillStyle = "#BFE2F2"; U.rr(ctx, x - 22, 58, 44, 26, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, 84); ctx.stroke(); ctx.fillStyle = "#C98B57"; U.rr(ctx, x - 25, 84, 50, 7, 3); ctx.fill(); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.fillStyle = ["#F48FB1", "#FFE08A", "#F48FB1", "#B39DDB"][k]; ctx.beginPath(); ctx.arc(x - 16 + k * 11, 83, 3.6, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    for (let x = 6; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x, 88); ctx.lineTo(x + 5, 83); ctx.lineTo(x + 10, 88); ctx.lineTo(x + 10, 104); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = "#FFFDF6"; U.rr(ctx, 0, 92, W, 5, 2); ctx.fill(); ctx.stroke();
    // どうぐ（じょうろ・かご）
    for (const [id, x] of [["can", W / 2 - 44], ["basket", W / 2 + 10]]) { const img = FarmArt.toolImg(id, 30); if (img) ctx.drawImage(img, x, 76, 30, 30); }
  }
  drawPlot(ctx, i) {
    const r = this.plots[i], p = Farm.plot(i), c = p.c && Farm.crops[p.c], inf = Farm.info(i), rows = c ? c.grid[1] : 3;
    const bed = FarmArt.bedImg(r.w, r.h, !!(c && p.w && p.s < 4), false, rows, this.foot);
    if (bed) ctx.drawImage(bed, r.x, r.y, r.w, r.h);
    if (c) {
      // うねの まんなかに ならべる（うしろの うねから）
      const cols = c.grid[0], cw = (r.w - 16) / cols, size = this.plantSize(c), so = FarmArt.soil(r.w, r.h, rows, this.foot);
      for (let rr = 0; rr < rows; rr++) for (let k = 0; k < cols; k++) {
        const img = FarmArt.plantImg(c, p.s, size), sway = p.s >= 2 ? Math.sin(G.t * 1.6 + k + rr + i) * 0.6 : 0;
        if (img) ctx.drawImage(img, r.x + 8 + cw * (k + 0.5) - size / 2 + sway, r.y + so.row(rr) + (rows === 1 ? so.h * 0.22 : 4) - size * 0.875, size, size);
      }
    }
    // まえの いたの なふだ（1ぎょうめ なまえ・2ぎょうめ ようす。からっぽは「たねを まこう」だけ）
    const name = c ? c.name : "", say = Farm.short(inf), fy = r.y + r.h - this.foot - 1.5, lh = name ? 30 : 20, ly = fy + (this.foot - lh) / 2;
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 11.5px 'M PLUS Rounded 1c',sans-serif"; const w1 = ctx.measureText(name).width; ctx.font = "800 11px 'M PLUS Rounded 1c',sans-serif"; const w2 = ctx.measureText(say).width;
    const lw = Math.min(r.w - 14, Math.max(w1, w2) + 20);
    ctx.fillStyle = inf.state === "ripe" ? "#FFF3B0" : inf.state === "dry" ? "#E3F2FB" : "rgba(255,253,246,.96)"; U.rr(ctx, r.x + (r.w - lw) / 2, ly, lw, lh, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    if (name) { ctx.fillStyle = INK; ctx.font = "800 11.5px 'M PLUS Rounded 1c',sans-serif"; ctx.fillText(this.fit(ctx, name, lw - 12), r.x + r.w / 2, ly + 9); }
    ctx.fillStyle = inf.state === "dry" ? "#1E6FA8" : inf.state === "ripe" ? "#9A5B00" : "#5A5046"; ctx.font = "800 11px 'M PLUS Rounded 1c',sans-serif"; ctx.fillText(this.fit(ctx, say, lw - 12), r.x + r.w / 2, ly + (name ? 21.5 : 10.5));
    if (c && p.f) { const img = FarmArt.toolImg("fert", 20); if (img) ctx.drawImage(img, r.x + 6, r.y + 4, 20, 20); }
    ctx.restore();
    Farm.drawBadge(ctx, i, r.x + r.w - 14, r.y + 10, 13);
    Farm.drawFx(ctx, i, r.x, r.y, r.w, r.h - this.foot, this.basket);
  }
  fit(ctx, s, w) { if (ctx.measureText(s).width <= w) return s; while (s.length > 1 && ctx.measureText(s + "…").width > w) s = s.slice(0, -1); return s + "…"; }
  drawMember(ctx, t) {
    const c = Save.d.chars[t.id], hop = t.hop > 0 ? Math.sin((t.hop / 0.35) * Math.PI) * 9 : 0;
    const pose = t.moving ? ["walk_01", "idle_01", "walk_02", "idle_01"][Math.floor((t.walkT || 0) * 8) % 4] : t.hop > 0 && t.face === "happy" ? "jump_01" : "idle_01";
    const dir = t.moving ? t.walkDir || "up" : t.hop > 0 && t.face === "happy" ? "down" : t.dir;
    ctx.fillStyle = "rgba(31,29,27,0.16)"; ctx.beginPath(); ctx.ellipse(t.x, t.y, this.charSize * 0.3, this.charSize * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    Chara.draw(ctx, t.id, { pose, dir, face: t.face === "happy" ? "happy" : undefined, outfit: c.outfit, color: c.color }, t.x, t.y - hop, this.charSize);
  }
  // みずやりの とき、せんとうの 子が じょうろを かたむける
  drawCan(ctx) {
    const lead = this.team[0], f = Object.entries(Farm.fx).find(([, v]) => v.kind === "water");
    if (!f || lead.moving) return;
    const k = (G.t - f[1].t0) / 0.95, img = FarmArt.toolImg("can", 34);
    if (!img || k > 1) return;
    const side = lead.dir === "left" ? -1 : 1;
    ctx.save(); ctx.translate(lead.x + side * 18, lead.y - this.charSize * 0.55); ctx.scale(-side, 1); ctx.rotate(-0.5 - Math.sin(Math.min(1, k * 2) * Math.PI * 0.5) * 0.35); ctx.drawImage(img, -17, -17, 34, 34); ctx.restore();
  }
  drawRain(ctx, W, H) {
    ctx.save(); ctx.fillStyle = "rgba(83,123,157,.08)"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(217,240,251,.75)"; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let i = 0; i < 46; i++) { const x = ((i * 97.3 - G.t * 36) % (W + 40) + W + 40) % (W + 40) - 20, y = ((i * 71 + G.t * 260) % (H + 40)) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); }
    ctx.stroke(); ctx.restore();
  }
}
SCENES.farm = FarmScene;
