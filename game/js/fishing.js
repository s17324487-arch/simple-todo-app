// ③ 釣り（docs/design/features/fishing の 見本 tools/feature-design/fishing-ref.js の FishingRef を 移した もの）。
// 1番: 魚の えらびかた（pool・pick・size・shadowOf は 見本と おなじ 計算）・ずかんの きろく・メニューの「さかな ずかん」。
// 2番: 釣りの 流れ（Game）・画面（draw）は 見本の まま。つりざお・「つる」ボタン・FishingScene。データは FISHING_DATA（自動生成）、セーブは Save.d.fish。
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

  // ---- 2番: 釣りの 流れ（Game）と 画面（SCENE・tint・heroSize・draw）は 見本 FishingRef の まま ----
  // ---- 釣りの 流れ（入力: tap = ボタンを おした 1回 / hold = おしている あいだ true）----
  Game: class {
    constructor(fish, { rodPower = 1, rand = Math.random } = {}) {
      this.f = fish; this.rand = rand; this.rodPower = rodPower;
      this.phase = "ready"; this.t = 0; this.tension = 0; this.prog = 0; this.over = 0; this.events = [];
      this.power = fish ? fish.power : 1;
    }
    emit(e) { this.events.push(e); }
    // 1コマ すすめる。dt 秒
    update(dt, { tap = false, hold = false } = {}) {
      const R = this.rand;
      this.t += dt;
      switch (this.phase) {
        case "ready": if (tap) { this.phase = "cast"; this.t = 0; this.emit("cast"); } break;
        case "cast": if (this.t > 0.7) { this.phase = "wait"; this.t = 0; this.waitFor = 2 + R() * 3; this.nibbles = 1 + Math.floor(R() * 3); this.nextNib = 0.8 + R() * 0.8; this.emit("land"); } break;
        case "wait":
          if (tap) { this.phase = "miss"; this.t = 0; this.why = "early"; this.emit("early"); break; } // はやすぎ（ちょんちょんで おした）
          if (this.nibbles > 0 && this.t > this.nextNib) { this.nibbles--; this.nextNib = this.t + 0.6 + R() * 0.7; this.emit("nibble"); }
          if (this.t > this.waitFor && this.nibbles === 0) { this.phase = "bite"; this.t = 0; this.emit("bite"); }
          break;
        case "bite": // ぐいっ！ 1.1 びょう いないに タップ（こどもでも まにあう ながさ）
          if (tap) { this.phase = "reel"; this.t = 0; this.tension = 0.35; this.prog = 0.12; this.nextPull = 0.5; this.emit("hook"); }
          else if (this.t > 1.1) { this.phase = "miss"; this.t = 0; this.why = "late"; this.emit("late"); }
          break;
        case "reel": {
          const P = this.power, rp = this.rodPower;
          if (hold) { this.prog += dt * (0.34 / (0.6 + P * 0.18)) * rp * (this.tension > 0.2 && this.tension < 0.8 ? 1.25 : 0.8); this.tension += dt * (0.55 + P * 0.08); }
          else this.tension -= dt * 0.9;
          if (this.t > this.nextPull) { this.tension += 0.1 + P * 0.045 + R() * 0.08; this.prog -= 0.02 + P * 0.008; this.nextPull = this.t + 1.3 - P * 0.12 + R() * 0.6; this.emit("pull"); }
          this.tension = Math.max(0, Math.min(1.08, this.tension)); this.prog = Math.max(0, Math.min(1, this.prog));
          this.over = this.tension >= 1 ? this.over + dt : Math.max(0, this.over - dt * 2);
          if (this.over > 0.6 / rp) { this.phase = "miss"; this.t = 0; this.why = "snap"; this.emit("snap"); }   // いとが きれた
          else if (this.prog >= 1) { this.phase = "caught"; this.t = 0; this.emit("caught"); }
          break;
        }
      }
      const out = this.events; this.events = []; return out;
    }
  },

  // ---- 画面（横から 見た 釣り場）----
  SCENE: {
    pond: { sky: ["#BFE3F2", "#EAF6F2"], water: ["#6FB7B0", "#2F6E74"], far: "#7FB069", near: "#8CC26B", edge: "#6E5A3C", name: "いけ" },
    river: { sky: ["#BFE0F4", "#EEF7F6"], water: ["#7CC4CC", "#2E6A80"], far: "#8DBB6A", near: "#A8C46E", edge: "#8A7A5E", name: "かわ" },
    stream: { sky: ["#CFE8E0", "#EEF6EE"], water: ["#7CC8C0", "#2A6068"], far: "#4E8A56", near: "#6E9A5A", edge: "#7A7466", name: "さわ" },
    beach: { sky: ["#A8D8F4", "#E8F6FA"], water: ["#5AB4D8", "#1E5A8A"], far: "#E8D8A8", near: "#F0DDA8", edge: "#D8C48E", name: "うみ" },
    harbor: { sky: ["#A8CCE8", "#E4F0F6"], water: ["#4E9CC4", "#1A4A74"], far: "#8C9AA6", near: "#B8BCC0", edge: "#8C9096", name: "みなと" },
  },
  // 時間で そらの 色を かえる（夕方・夜）
  tint(time) { return time === "evening" ? { sky: ["#F4B98A", "#F8E2C4"], dark: 0.12 } : time === "night" || time === "late" ? { sky: ["#1E2A4A", "#3E4E78"], dark: 0.45 } : null; },
  heroSize(W) { return Math.round(Math.min(76, W * 0.2)); },
  // st: { place, time, game, heroes: [id,...], t, shadowImg, charDraw(ctx,id,face,x,y,size,dir) }
  draw(ctx, W, H, st) {
    const S = this.SCENE[st.place], tt = this.tint(st.time), sky = tt ? tt.sky : S.sky, g = st.game, T = st.t || 0;
    const horizon = H * 0.3, surf = H * 0.47, landX = W * 0.42;
    // そら
    let gr = ctx.createLinearGradient(0, 0, 0, horizon); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, horizon + 2);
    if (st.time === "night" || st.time === "late") { ctx.fillStyle = "#FFF6C8"; for (let i = 0; i < 18; i++) { const x = (i * 97) % W, y = (i * 53) % (horizon * 0.8); ctx.globalAlpha = 0.5 + ((i * 7) % 5) / 10; ctx.fillRect(x, y, 1.6, 1.6); } ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(W * 0.8, horizon * 0.35, 12, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = "rgba(255,255,255,.85)"; for (const [x, y, s] of [[W * 0.2, horizon * 0.35, 1], [W * 0.68, horizon * 0.22, 1.3]]) { ctx.beginPath(); ctx.ellipse(x, y, 22 * s, 8 * s, 0, 0, 7); ctx.ellipse(x + 14 * s, y - 5 * s, 14 * s, 8 * s, 0, 0, 7); ctx.fill(); } }
    // とおくの けしき（場所ごと）
    ctx.fillStyle = S.far;
    if (st.place === "beach") { ctx.fillStyle = "#6EB8DC"; ctx.fillRect(0, horizon - 6, W, 8); }
    else if (st.place === "harbor") { ctx.fillStyle = "#9AA6B0"; ctx.fillRect(W * 0.45, horizon - 10, W * 0.55, 10); ctx.fillStyle = "#F4F4F0"; ctx.fillRect(W * 0.86, horizon - 38, 10, 30); ctx.fillStyle = "#E0525B"; ctx.fillRect(W * 0.86, horizon - 44, 10, 8); ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 1.5; ctx.strokeRect(W * 0.86, horizon - 44, 10, 36); }
    else { ctx.beginPath(); ctx.moveTo(0, horizon); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, horizon - 14 - Math.sin(x * 0.05) * 8 - (x % 40 ? 0 : 6)); ctx.lineTo(W, horizon + 2); ctx.closePath(); ctx.fill(); }
    // みず（おもて → そこ）
    gr = ctx.createLinearGradient(0, horizon, 0, H); gr.addColorStop(0, S.water[0]); gr.addColorStop(0.28, mixC(S.water[0], S.water[1], 0.4)); gr.addColorStop(1, S.water[1]); ctx.fillStyle = gr; ctx.fillRect(0, horizon, W, H - horizon);
    // 水の 中の ひかり
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 5; i++) { const x = W * (0.4 + i * 0.14) + Math.sin(T * 0.6 + i) * 8; ctx.beginPath(); ctx.moveTo(x, surf); ctx.lineTo(x + 18, surf); ctx.lineTo(x + 40, H); ctx.lineTo(x + 10, H); ctx.closePath(); ctx.fill(); } ctx.restore();
    // 水面の なみ
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = horizon + 10 + i * ((surf - horizon) / 7); const x0 = ((i * 83 + T * 12) % (W + 60)) - 30; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + 10, y - 3, x0 + 20, y); ctx.stroke(); }
    // 水底（場所ごと）
    ctx.fillStyle = st.place === "beach" ? "#D8C28E" : st.place === "harbor" ? "#4A5A66" : "#5E6E4E"; ctx.beginPath(); ctx.moveTo(landX - 20, H); for (let x = landX - 20; x <= W; x += 24) ctx.lineTo(x, H - 18 - Math.sin(x * 0.07) * 6); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    if (st.place === "pond") { ctx.fillStyle = "#5FA24F"; for (const x of [W * 0.62, W * 0.84]) { ctx.beginPath(); ctx.ellipse(x, surf - 2, 16, 4, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(x, surf - 2); ctx.fill(); ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 1.4; ctx.stroke(); } }
    // きし（3にんが 立つ ところ）
    ctx.fillStyle = S.near; ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, surf - 18); ctx.lineTo(landX - 30, surf - 18); ctx.quadraticCurveTo(landX, surf - 16, landX + 4, surf + 20); ctx.lineTo(landX - 12, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = S.edge; ctx.beginPath(); ctx.moveTo(landX - 4, surf - 4); ctx.quadraticCurveTo(landX + 4, surf + 10, landX - 6, H); ctx.lineTo(landX - 22, H); ctx.quadraticCurveTo(landX - 10, surf + 20, landX - 18, surf - 8); ctx.closePath(); ctx.fill();
    if (st.place === "harbor") { ctx.fillStyle = "#C8CCD0"; ctx.fillRect(0, surf - 26, landX, 10); ctx.strokeRect(0, surf - 26, landX, 10); ctx.fillStyle = "#6A6E72"; ctx.fillRect(landX - 40, surf - 38, 14, 12); ctx.strokeRect(landX - 40, surf - 38, 14, 12); }
    if (st.place === "pond" || st.place === "river") { ctx.strokeStyle = "#4E8A3E"; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = landX - 6 + i * 5; ctx.beginPath(); ctx.moveTo(x, surf + 4); ctx.quadraticCurveTo(x + 4, surf - 20, x + 2 + i, surf - 34 - i * 3); ctx.stroke(); } }
    // 3にん（左から: おうえん・おうえん・さおを もつ子）
    // 大きさは 3にん おなじ（SvgCache の キーを ふやさない）
    const heroes = st.heroes || [], base = surf - 18, size = this.heroSize(W);
    const rodX = landX - 34, rodY = base - size * 0.66;
    heroes.forEach((id, i) => { const x = [landX * 0.16, landX * 0.45, landX * 0.76][i], face = st.faces ? st.faces[id] : "normal"; if (st.charDraw) st.charDraw(ctx, id, face, x, base + (i === 2 ? 0 : 3), size, "right"); });
    // さお と いと
    const tipX = rodX + 70, tipY = rodY - 46 + (g && g.phase === "reel" ? Math.sin(T * 14) * 3 + g.tension * 14 : 0);
    ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 4.2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(rodX + 4, rodY + 10); ctx.quadraticCurveTo(rodX + 36, rodY - 14, tipX, tipY); ctx.stroke();
    ctx.strokeStyle = "#C98A52"; ctx.lineWidth = 2; ctx.stroke();
    const bob = st.bob || { x: W * 0.72, y: surf };
    let by = bob.y;
    if (g) { if (g.phase === "cast") { const k = Math.min(1, g.t / 0.7); bob.x = tipX + (W * 0.72 - tipX) * k; by = tipY + (surf - tipY) * k - Math.sin(k * Math.PI) * 50; } else if (g.phase === "wait") by = surf + Math.sin(T * 3) * 1.2 + (st.nib ? 3 : 0); else if (g.phase === "bite") by = surf + 9; else if (g.phase === "reel") by = surf + 6 + Math.sin(T * 10) * 2; }
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tipX, tipY);
    if (g && g.phase === "reel") ctx.lineTo(bob.x, by); else ctx.quadraticCurveTo((tipX + bob.x) / 2, Math.max(tipY, by) + 10, bob.x, by); ctx.stroke();
    // うき（赤と 白）
    if (!g || g.phase !== "caught") { ctx.save(); ctx.translate(bob.x, by); ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, 2, 5, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#E0525B"; ctx.beginPath(); ctx.ellipse(0, -3, 5, 5, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -13); ctx.stroke(); ctx.restore(); }
    // 水の 中の いと・はり と 魚の かげ
    if (g && (g.phase === "wait" || g.phase === "bite" || g.phase === "reel")) {
      const hookY = surf + (H - surf) * 0.42; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bob.x, by + 8); ctx.lineTo(bob.x, hookY); ctx.stroke();
      const k = g.phase === "wait" ? Math.min(1, g.t / (g.waitFor || 3)) : 1, sx = W + 40 - (W + 40 - bob.x - 26) * k, sy = hookY + 8 + Math.sin(T * 2) * 3;
      if (st.shadowImg) { const s = st.shadowImg; ctx.drawImage(s, sx - s.width / 2 / (st.px || 1) * 0.5, sy - s.height / 2 / (st.px || 1) * 0.5, s.width / (st.px || 1) * 0.5, s.height / (st.px || 1) * 0.5); }
      else { ctx.fillStyle = "rgba(20,50,70,.4)"; ctx.beginPath(); ctx.ellipse(sx, sy, 24, 9, 0, 0, 7); ctx.fill(); }
    }
    if (tt) { ctx.fillStyle = `rgba(20,24,60,${tt.dark})`; ctx.fillRect(0, 0, W, H); }
    // ぐいっ！ の しるし
    if (g && g.phase === "bite") { ctx.save(); ctx.translate(bob.x, surf - 40); const s = 1 + Math.sin(T * 20) * 0.08; ctx.scale(s, s); ctx.fillStyle = "#FFE38A"; ctx.strokeStyle = "#1F1D1B"; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 26; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#1F1D1B"; ctx.font = "900 24px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("！", 0, 1); ctx.restore(); }
    // しぶき
    if (g && (g.phase === "bite" || g.phase === "reel")) { ctx.fillStyle = "rgba(255,255,255,.9)"; for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.15 + i * 0.14), r = 10 + ((T * 30 + i * 7) % 12); ctx.beginPath(); ctx.arc(bob.x + Math.cos(a) * r, surf + Math.sin(a) * r, 2.2, 0, 7); ctx.fill(); } }
    function mixC(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k); return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); }
  },

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

  // 3人の かお（見本の とおり）: まつ normal・ぐいっ！ surprise・まく excited・つれた love（EMO の 名前）。あかい ところでは ↓
  FACES: ["normal", "surprise", "excited", "love"],
  DANGER_FACES: { wanko: "surprise", gachan: "cry", goji: "shout" },

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
    await UI.say([{ text: `だいじな もの「${D.rods[0].name}」を てにいれた！\nみずべで みずの ほうを むくと「つる」が でるよ。` }]);
    return true;
  },

  // ---- 2番: 町・外の 世界の「つる」ボタン ----
  // 釣り場（spots）の マップで、先頭の 子が 水（'~'）の マスを 向いて いて、さおを もって いる ときだけ
  spotAt(sc) {
    const D = this.data(); if (!D || !Save.d.fish || !this.rod() || !sc.party) return null;
    const sp = D.spots[sc.mapId], L = sc.party[0]; if (!sp || L.moving) return null;
    const [dx, dy] = DIRS[L.dir];
    return (sc.map.def.rows[L.ty + dy] || "")[L.tx + dx] === "~" ? sp : null;
  },
  refreshButton(sc) {
    const sp = G.scene === sc && !sc.busy && !UI.busy && !Game.trans && this.spotAt(sc);
    if (!sp) { this.hideButton(); return; }
    if (this.button) return;
    this.button = UI.btn(`${this.rodSvg()}<span>つる</span>`, () => this.start(sc), "act-btn fish-go-btn");
    this.button.setAttribute("aria-label", "つる");
    UI.root.append(this.button);
  },
  hideButton() { if (this.button) this.button.remove(); this.button = null; },
  start(sc) {
    const sp = this.spotAt(sc); if (!sp || sc.busy || Game.inputLocked || UI.busy) return;
    const L = sc.party[0]; sc.busy = true; this.hideButton(); Sound.se("ok");
    Game.goto("fishing", { place: sp.place, name: sp.name, back: { map: sc.mapId, x: L.tx, y: L.ty, dir: L.dir } });
  },

  // ---- つれた！ カード（見本 ⑤）。いけすへ／にがす／うる。いけすが いっぱいなら いけすへ の かわりに「いけすが いっぱい」----
  card(f, cm, first) {
    return new Promise((done) => {
      const body = U.el("div", { class: "fish-card" });
      body.innerHTML = `<div class="art">${first ? '<span class="badge">はじめて！</span>' : ""}${this.svg(f, "c" + f.id)}</div><div class="nm"></div>`
        + `<div class="sz">${cm}cm <span class="star">${this.stars(f)}</span></div><div class="desc"></div><div class="fact"><b>まめちしき</b><span></span></div><div class="acts"></div>`;
      body.querySelector(".nm").textContent = f.name; body.querySelector(".desc").textContent = f.desc; body.querySelector(".fact span").textContent = f.fact;
      // 1かい だけ きめる（✕ で とじた ときは いけすへ。いっぱいなら にがす）
      let m = null, settled = false;
      const pick = (v) => { if (settled) return; settled = true; const mm = m; m = null; if (mm) mm.close(); done(v); };
      const full = this.keepCount() >= this.KEEP_MAX, keep = UI.btn(full ? "いけすが いっぱい" : "いけすへ", () => { Sound.se("coin"); pick("keep"); }, "yellow");
      if (full) keep.disabled = true;
      body.querySelector(".acts").append(keep, UI.btn("にがす", () => { Sound.se("tap"); pick("release"); }), UI.btn(`うる ${f.sell}`, () => { Sound.se("coin"); pick("sell"); }));
      m = UI.modal({ title: "つれた！", body, onClose: () => pick(full ? "release" : "keep") });
    });
  },
};

// ---- 2番: 釣りの 画面（横から 見た 岸）。3人は いつも いっしょ: 先頭の 子が さおを もち、2人は となりで おうえん ----
// 入る・出るは ShopScene と おなじ（back の 町の 場所に もどる）。ボタンは 1つ: なげる → まつ… → つる！ → まく（おしつづける）
class FishingScene {
  async enter(p = {}) {
    this.place = p.place || "pond"; this.back = p.back || { map: "town" }; this.forced = p.fish || null;
    this.spotName = p.name || (Object.values(Fishing.data().spots).find((s) => s.place === this.place) || {}).name || Fishing.PLACES[this.place];
    this.heroes = [...Save.d.order].reverse(); // 左から おうえん・おうえん・さおを もつ 子（先頭）
    this.t = 0; this.hold = false; this.tapQ = false; this.nib = 0; this.msg = null; this.busy = false;
    this.round();
    await this.preload();
    UI.showHud(false);
    this.mount();
    this.refresh();
  }
  exit() { this.closed = true; this.root?.remove(); }
  // 1かい ぶんの 釣り（魚は なげる まえに きめる。テストでは p.fish の 魚）
  round() {
    const rod = Fishing.rod() || { power: 1 }, c = Fishing.context(rod.power);
    this.time = c.time;
    this.fish = (this.forced && Fishing.fish(this.forced)) || Fishing.pick(this.place, c, Math.random, Fishing.kinds()) || Fishing.data().fish[0];
    this.game = new Fishing.Game(this.fish, { rodPower: rod.power });
    this.msg = null; this.hold = false; this.tapQ = false; this.nibbled = false;
  }
  // 3人の かお（見本の とおり。大きさは 3人 おなじ・キーを ふやさない）
  faces() {
    const g = this.game, all = (e) => Object.fromEntries(this.heroes.map((id) => [id, e]));
    if (g.phase === "bite") return all("surprise");
    if (g.phase === "reel") return g.tension > 0.8 ? Object.fromEntries(this.heroes.map((id) => [id, Fishing.DANGER_FACES[id] || "surprise"])) : all("excited");
    if (g.phase === "caught") return all("love");
    return all("normal");
  }
  async preload() {
    const size = Fishing.heroSize(G.W), list = [];
    for (const id of this.heroes) { const c = Save.d.chars[id]; for (const face of [...Fishing.FACES, Fishing.DANGER_FACES[id] || "surprise"]) list.push([id, { pose: "idle_01", dir: "right", face, outfit: c.outfit, color: c.color }]); }
    const jobs = [Chara.preload(list, size)];
    for (const k of ["S", "M", "L", "XL", "thin"]) jobs.push(this.shadowCanvas(k, true));
    await Promise.all(jobs);
  }
  // 魚の かげ（SvgCache「fishshadow:<kind>」。viewBox の 1.2ばいの 大きさで 描く）
  shadowCanvas(kind, ensure) {
    const svg = FishArt.shadow(kind), vb = svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/), w = +vb[1] * 1.2, h = +vb[2] * 1.2;
    const pw = Math.ceil(w * G.px), ph = Math.ceil(h * G.px), key = "fishshadow:" + kind;
    return ensure ? SvgCache.ensure(key, () => svg, pw, ph) : SvgCache.get(key, () => svg, pw, ph);
  }
  mount() {
    const root = (this.root = U.el("div", { class: "fish-ui" }));
    const top = U.el("div", { class: "fish-top" });
    top.innerHTML = `<div class="pill place">${Fishing.rodSvg()}<span></span></div><div class="grow"></div>`;
    top.querySelector(".place span").textContent = this.spotName;
    top.append(UI.btn("やめる", () => this.leave(), "small"));
    this.talkEl = U.el("div", { class: "fish-talk", html: "<span></span>" });
    const ctrl = U.el("div", { class: "fish-ctrl" });
    this.meter = U.el("div", { class: "fish-meter", html: `<div class="lbl"><span>いとの ぴんと ぐあい</span><b></b></div><div class="fish-gauge"><i></i></div><div class="lbl" style="margin-top:6px"><span>ひきよせ</span><b></b></div><div class="fish-prog"><i></i></div>` });
    this.btn = U.el("button", { class: "btn fish-btn" });
    // まく: おしつづける あいだ hold。なげる・つる！: おした ときに tap
    const down = (e) => { e.preventDefault(); if (this.btn.disabled || this.busy) return; if (this.game.phase === "reel") this.hold = true; else this.tapQ = true; };
    const up = () => { this.hold = false; };
    this.btn.addEventListener("pointerdown", down);
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) this.btn.addEventListener(ev, up);
    ctrl.append(this.meter, this.btn);
    root.append(top, this.talkEl, ctrl);
    UI.root.append(root);
  }
  leave() {
    if (this.closed || Game.trans || this.busy) return;
    this.closed = true; Sound.se("cancel");
    Game.goto("world", this.back);
  }
  say(t) { this.msg = t; }
  // いまの ようすの ことばと ボタン
  refresh() {
    if (!this.btn) return;
    const g = this.game, p = g.phase;
    let text = this.msg, html = "なげる", cls = "", off = false;
    if (p === "ready") text = text || "みずべで「なげる」を おしてね";
    else if (p === "cast") { text = "えいっ！"; html = "まつ…"; off = true; }
    else if (p === "wait") { text = this.nibbled ? "ちょん…ちょん… まだ まって！" : "うきを よく みてね…"; html = "まつ…"; off = true; }
    else if (p === "bite") { text = "ぐいっ！ いまだ！"; html = "つる！<small>いま タップ</small>"; cls = "go"; }
    else if (p === "reel") { text = g.tension > 0.8 ? "あかい ところ！ いちど はなして！" : g.tension < 0.2 ? "もっと まいて！" : "おしつづけて まく！ あかく なったら はなす"; html = "まく<small>おしつづける</small>"; cls = "reel"; }
    else { html = "…"; off = true; }
    this.talkEl.firstChild.textContent = text || "";
    this.talkEl.style.visibility = text ? "" : "hidden";
    const key = html + cls + off;
    if (this.btnKey !== key) { this.btnKey = key; this.btn.innerHTML = html; this.btn.className = "btn fish-btn " + cls; this.btn.disabled = off; }
    this.meter.style.display = p === "reel" ? "" : "none";
    if (p === "reel") {
      const [a, b] = this.meter.querySelectorAll(".lbl b");
      a.textContent = g.tension > 0.8 ? "あぶない！" : g.tension < 0.2 ? "ゆるい" : "いいかんじ！"; b.textContent = Math.round(g.prog * 100) + "%";
      this.meter.querySelector(".fish-gauge i").style.left = Math.round(Math.min(1, g.tension) * 100) + "%";
      this.meter.querySelector(".fish-prog i").style.width = Math.round(g.prog * 100) + "%";
    }
  }
  update(dt) {
    if (this.closed) return;
    this.t += dt; if (this.nib > 0) this.nib -= dt;
    if (!this.busy && !UI.busy && !Game.trans) {
      const evs = this.game.update(dt, { tap: this.tapQ, hold: this.hold }); this.tapQ = false;
      for (const e of evs) this.onEvent(e);
    }
    this.refresh();
  }
  onEvent(e) {
    if (e === "cast") Sound.se("tap");
    else if (e === "land") Sound.se("pop");
    else if (e === "nibble") { this.nib = 0.25; this.nibbled = true; Sound.se("tap"); }
    else if (e === "bite") Sound.se("sparkle");
    else if (e === "hook") Sound.se("ok");
    else if (e === "early" || e === "late" || e === "snap") { Sound.se("cancel"); this.missed(e); }
    else if (e === "caught") this.caught();
  }
  // にげても なにも なくならない。すこし まって また なげられる
  async missed(why) {
    this.busy = true;
    this.say({ early: "はやすぎた！ ぐいっ！ まで まってね", late: "にげちゃった… また なげよう", snap: "いとが きれちゃった… また なげよう" }[why]);
    this.refresh();
    await U.wait(1300);
    if (this.closed) return;
    const msg = this.msg; this.round(); this.msg = msg; this.busy = false;
  }
  async caught() {
    this.busy = true;
    const f = this.fish, cm = Fishing.size(f), first = !Save.d.fish.dex[f.id];
    Sound.se("coin");
    this.say(`${f.name}が つれた！`); this.refresh();
    await U.wait(500);
    const how = await Fishing.card(f, cm, first);
    Fishing.record(f.id, cm, { keep: how === "keep" });
    if (how === "keep") UI.toast(`${f.name}を いけすに いれたよ（${Fishing.keepCount()} / ${Fishing.KEEP_MAX}）`);
    if (how === "sell") { Save.addCoins(f.sell); UI.updateHud(); UI.toast(`${f.name}を うって コイン +${f.sell}`, "good"); }
    // ② 町の人の おねがい（つる → わたす）
    if (typeof TownFolk !== "undefined") await TownFolk.progress({ do: "catch", fish: f.id }, { name: "", face: "" });
    Save.write();
    if (this.closed) return;
    this.round(); this.busy = false;
  }
  render(ctx) {
    const g = this.game, img = this.shadowCanvas(Fishing.shadowOf(this.fish), false);
    Fishing.draw(ctx, G.W, G.H, { place: this.place, time: this.time, game: g, t: this.t, heroes: this.heroes, faces: this.faces(), shadowImg: img, px: G.px / 2, nib: this.nib > 0,
      charDraw: (c, id, face, x, y, s, dir) => { const ch = Save.d.chars[id]; Chara.draw(c, id, { pose: "idle_01", dir, face, outfit: ch.outfit, color: ch.color }, x, y, s); } });
  }
  key(k, down) {
    if (k === "ok") { if (!down) this.hold = false; else if (this.game.phase === "reel") this.hold = true; else this.tapQ = true; }
    if (down && k === "cancel") this.leave();
  }
}
SCENES.fishing = FishingScene;
