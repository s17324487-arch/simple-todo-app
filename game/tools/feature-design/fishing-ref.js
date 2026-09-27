// ③ 釣りの 見本の 実装（classic script）。ゲームに 入れるときは js/fishing.js に うつし、data は FISHING_DATA を つかう。
// ・FishingRef.pick   … その 場所・季節・時間・天気で つれる 魚を 1ぴき えらぶ
// ・FishingRef.Game   … なげる → まつ → ぐいっ！（タップ）→ まく（テンション）→ つれた／にげた の 流れ
// ・FishingRef.draw   … 横から 見た 釣りの 画面（水・うき・魚の かげ・3にん・ボタン）を canvas に かく
// 3にんは いつも いっしょ: 1人が さおを もち、2人は となりで おうえんする（AGENTS.md の 9）。
const FishingRef = {
  WEIGHT: { 1: 10, 2: 6, 3: 3, 4: 1.2, 5: 0.35 }, // rarity ごとの 出やすさ
  period(h) { return h >= 5 && h < 10 ? "morning" : h < 16 && h >= 10 ? "day" : h < 19 && h >= 16 ? "evening" : h < 23 && h >= 19 ? "night" : "late"; },
  ok(v, x) { return v === "all" || v == null || (Array.isArray(v) ? v.includes(x) : v === x); },
  // その ときに つれる 魚の 一覧（weather は あると 出やすい「ボーナス」。なくても つれる）
  pool(data, place, c, caughtKinds = 0) {
    return data.fish.filter((f) => (f.place === place || (f.also || []).includes(place)) && this.ok(f.season, c.season) && this.ok(f.time, c.time) && (!f.unlock || caughtKinds >= f.unlock))
      .map((f) => ({ f, w: this.WEIGHT[f.rarity] * (f.weather && f.weather.includes(c.weather) ? 2 : 1) * (c.rodPower > 1 && f.rarity >= 3 ? 1.4 : 1) }));
  },
  pick(data, place, c, rand = Math.random, caughtKinds = 0) {
    const p = this.pool(data, place, c, caughtKinds); if (!p.length) return null;
    let r = rand() * p.reduce((a, x) => a + x.w, 0);
    for (const x of p) { r -= x.w; if (r < 0) return x.f; }
    return p[p.length - 1].f;
  },
  // 大きさ（cm）: min〜max の 三角分布（まんなかが 出やすい）。0.1cm きざみ
  size(f, rand = Math.random) { const t = (rand() + rand()) / 2; return Math.round((f.size[0] + (f.size[1] - f.size[0]) * t) * 10) / 10; },
  shadowOf(f) { return f.shadow || (f.size[1] < 12 ? "S" : f.size[1] <= 30 ? "M" : f.size[1] <= 80 ? "L" : "XL"); },

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
};
if (typeof module !== "undefined") module.exports = FishingRef;
