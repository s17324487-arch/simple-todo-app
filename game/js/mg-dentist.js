// dentist のおてつだい。進行と共通描画は minigames.js。
class DentistTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.nGerm = [4, 5, 6, 7, 8][lv - 1];
    this.nDirt = [0, 2, 2, 3, 3][lv - 1];
    this.nCav = [0, 0, 1, 2, 2][lv - 1];
    this.hop = [1.8, 1.5, 1.3, 1.1, 0.9][lv - 1];
    this.timeLimit = [20, 21, 22, 22, 21][lv - 1];
    this.title = "はが いたいの……";
    this.mistakes = 0;
    this.killed = 0;
  }
  layout(R) {
    this.R = R;
    const mx = R.x + 16, my = R.y + 14, mw = R.w - 32, mh = R.h - 28;
    this.mouth = { x: mx, y: my, w: mw, h: mh };
    const n = 6, tw = (mw - 40) / n, th = Math.min(mh * 0.3, tw * 1.35);
    if (!this.teeth) this.teeth = Array.from({ length: n * 2 }, (_, k) => ({ up: k % 2 === 0 }));
    // 画面サイズが変わっても 同じ はの オブジェクトを使いつづける
    for (let i = 0; i < n; i++) {
      Object.assign(this.teeth[i * 2], { x: mx + 20 + i * tw + 3, y: my + mh * 0.12, w: tw - 6, h: th });
      Object.assign(this.teeth[i * 2 + 1], { x: mx + 20 + i * tw + 3, y: my + mh * 0.88 - th, w: tw - 6, h: th });
    }
    if (!this.targets) {
      const idx = U.shuffle([...this.teeth.keys()]);
      this.dirt = idx.slice(0, this.nDirt).map((i) => ({ t: this.teeth[i], hp: 4, rub: 0 }));
      this.cav = idx.slice(this.nDirt, this.nDirt + this.nCav).map((i) => ({ t: this.teeth[i], drill: 0, fixed: false }));
      this.germs = [];
      this.targets = true;
      this.spawnT = 0.2;
    }
  }
  toothCenter(t) { return { x: t.x + t.w / 2, y: t.y + t.h * (t.up ? 0.55 : 0.45) }; }
  tick(dt) {
    this.spawnT -= dt;
    const alive = this.germs.filter((g) => g.alive);
    if (this.spawnT <= 0 && alive.length < 3 && this.killed + alive.length < this.nGerm) {
      const t = U.pick(this.teeth);
      this.germs.push({ t, alive: true, hopT: this.hop * U.rand(0.8, 1.2), bob: Math.random() * 6 });
      this.spawnT = U.rand(0.5, 1.1);
      Sound.se("pop");
    }
    for (const g of alive) {
      g.hopT -= dt; g.bob += dt * 8;
      if (g.hopT <= 0) { g.t = U.pick(this.teeth); g.hopT = this.hop * U.rand(0.8, 1.2); }
    }
    if (this.drilling && !this.drilling.fixed) {
      this.drilling.drill += dt / 0.9;
      if (Math.floor(this.drilling.drill * 12) !== Math.floor((this.drilling.drill - dt / 0.9) * 12)) Sound.se("tap");
      if (this.drilling.drill >= 1) { this.drilling.fixed = true; const c = this.toothCenter(this.drilling.t); this.sc.addFx("spark", c.x, c.y); Sound.se("ding"); this.drilling = null; this.check(); }
    }
  }
  check() {
    const done = this.killed >= this.nGerm && this.dirt.every((d) => d.hp <= 0) && this.cav.every((c) => c.fixed);
    if (done) { Sound.se("sparkle"); this.sc.finish(this.score()); }
  }
  remaining() { return (this.nGerm - this.killed) + this.dirt.filter((d) => d.hp > 0).length + this.cav.filter((c) => !c.fixed).length; }
  score() { return 100 - this.mistakes * 8 - this.remaining() * 14 - this.sc.timePenalty(); }
  timeout() { return this.score(); }
  downArea(p) {
    // ばいきん
    for (const g of this.germs) {
      if (!g.alive) continue;
      const c = this.toothCenter(g.t);
      if (Math.hypot(p.x - c.x, p.y - (c.y + Math.sin(g.bob) * 3)) < 26) {
        g.alive = false; this.killed++;
        Sound.se("germ"); this.sc.addFx("puff", c.x, c.y);
        this.check();
        return;
      }
    }
    for (const cv of this.cav) {
      if (cv.fixed) continue;
      const c = this.toothCenter(cv.t);
      if (Math.hypot(p.x - c.x, p.y - c.y) < 24) { this.drilling = cv; return; }
    }
    for (const d of this.dirt) {
      if (d.hp <= 0) continue;
      const c = this.toothCenter(d.t);
      if (Math.hypot(p.x - c.x, p.y - c.y) < 28) { this.rubbing = { d, lx: p.x, ly: p.y }; return; }
    }
    const tooth = this.teeth.find((t) => p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.y + t.h);
    if (tooth) { this.mistakes++; this.sc.mistake("いたっ！"); }
  }
  move(p) {
    if (this.rubbing) {
      const r = this.rubbing;
      r.d.rub += Math.hypot(p.x - r.lx, p.y - r.ly);
      r.lx = p.x; r.ly = p.y;
      if (r.d.rub > 42) {
        r.d.rub = 0; r.d.hp--;
        Sound.se("swish");
        if (r.d.hp <= 0) { const c = this.toothCenter(r.d.t); this.sc.addFx("spark", c.x, c.y); Sound.se("ding"); this.rubbing = null; this.check(); }
      }
    }
  }
  up() { this.drilling = null; this.rubbing = null; }
  drawOrder(ctx, x, y, w, h) {
    const items = [["germ", this.nGerm - this.killed], ["dirt", this.dirt.filter((d) => d.hp > 0).length], ["cavity", this.cav.filter((c) => !c.fixed).length]].filter((i) => i[1] > 0);
    const s = 30;
    items.forEach(([id, n], i) => {
      const cx = x + w / 2 + (i - (items.length - 1) / 2) * 58;
      topIcon(ctx, id, cx, y + h * 0.4, s);
      ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("×" + n, cx, y + h * 0.4 + 26);
    });
    if (!items.length) { ctx.fillStyle = INK; ctx.font = "900 16px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillText("ピカピカ！", x + w / 2, y + h / 2); }
  }
  draw(ctx) {
    const m = this.mouth;
    ctx.save();
    ctx.fillStyle = "#F48FB1"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    U.rr(ctx, m.x, m.y, m.w, m.h, 60); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8E2F45"; U.rr(ctx, m.x + 16, m.y + m.h * 0.3, m.w - 32, m.h * 0.4, 30); ctx.fill();
    ctx.fillStyle = "#E57390"; ctx.beginPath(); ctx.ellipse(m.x + m.w / 2, m.y + m.h * 0.62, m.w * 0.26, m.h * 0.1, 0, 0, 7); ctx.fill();
    for (const t of this.teeth) {
      ctx.fillStyle = "#FFFFFF";
      U.rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    }
    for (const d of this.dirt) if (d.hp > 0) { const c = this.toothCenter(d.t); ctx.globalAlpha = 0.35 + d.hp * 0.16; topIcon(ctx, "dirt", c.x, c.y, 34); ctx.globalAlpha = 1; }
    for (const cv of this.cav) {
      const c = this.toothCenter(cv.t);
      if (cv.fixed) { ctx.fillStyle = "#E0E0E0"; ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, 7); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); continue; }
      topIcon(ctx, "cavity", c.x, c.y, 30);
      if (cv.drill > 0) { ctx.strokeStyle = "#4FA3E0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, 18, -Math.PI / 2, -Math.PI / 2 + cv.drill * Math.PI * 2); ctx.stroke(); }
    }
    for (const g of this.germs) if (g.alive) { const c = this.toothCenter(g.t); topIcon(ctx, "germ", c.x, c.y + Math.sin(g.bob) * 3, 38); }
    ctx.fillStyle = INK; ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    const hint = this.nCav && this.cav.some((c) => !c.fixed) ? "むしばは ながおし・よごれは こする" : this.nDirt && this.dirt.some((d) => d.hp > 0) ? "ちゃいろい よごれは ゆびで こすってね" : "ばいきんを タップ！";
    ctx.fillText(hint, m.x + m.w / 2, m.y + m.h / 2 + 2);
    ctx.restore();
  }
}


MG_TASKS.dentist = DentistTask;
