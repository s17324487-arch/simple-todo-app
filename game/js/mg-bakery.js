// bakery のおてつだい。進行と共通描画は minigames.js。
class BakeryTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.want = { bread: U.pick(BREADS).id, bake: U.pick(["soft", "golden"]), top: lv >= 2 ? { id: U.pick(BREAD_TOPS).id, n: U.randi(2, [0, 3, 4, 4, 5][lv - 1]) } : null };
    this.timeLimit = [24, 26, 25, 24, 22][lv - 1];
    this.speed = [22, 26, 30, 34, 38][lv - 1]; // 1秒あたりの やけぐあい
    this.zoneW = [20, 18, 15, 13, 11][lv - 1];
    this.zone = this.want.bake === "soft" ? 40 : 70;
    this.step = "choose";
    this.pen = 0;
    this.done = 0;
    this.tops = [];
    this.curTop = BREAD_TOPS[0].id;
    this.title = "パン ください！";
  }
  layout(R) { this.R = R; this.setupStep(); }
  setupStep() {
    const R = this.R;
    if (this.step === "choose") {
      const cells = gridBtns(R, 4, 2, R.y + 46, Math.min(96, (R.h - 70) / 2 - 6));
      this.btns = BREADS.map((b, i) => ({ ...cells[i], label: b.name, fs: 13, icon: (ctx, x, y, s) => mgIcon(ctx, "bread:" + b.id + ":raw", () => breadSvg(b.id, 0.05), x, y, s * 1.1), cb: () => this.choose(b.id) }));
    } else if (this.step === "bake") {
      const bw = R.w - 60;
      this.btns = [{ x: R.x + 30, y: R.y + R.h - 70, w: bw, h: 56, label: "とりだす！", fs: 18, color: "#FFD54F", cb: () => this.takeOut() }];
      Sound.se("bake");
    } else if (this.step === "top") {
      const cells = gridBtns(R, 3, 3, R.y + R.h - 142, 62);
      this.btns = BREAD_TOPS.map((t, i) => ({ ...cells[i], label: t.name, fs: 11, on: this.curTop === t.id, icon: (ctx, x, y, s) => topIcon(ctx, t.id, x, y, s), cb: () => { this.curTop = t.id; this.btns.forEach((b, j) => j < 3 && (b.on = j === i)); } }));
      const w2 = (R.w - 28) / 2;
      this.btns.push({ x: R.x + 10, y: R.y + R.h - 64, w: w2, h: 50, label: "やりなおし", fs: 14, cb: () => { this.tops = []; Sound.se("cancel"); } });
      this.btns.push({ x: R.x + 18 + w2, y: R.y + R.h - 64, w: w2, h: 50, label: "できあがり！", fs: 15, color: "#FFD54F", cb: () => this.finishTop() });
    }
  }
  choose(id) {
    this.bread = id;
    if (id !== this.want.bread) { this.pen += 30; this.sc.mistake("ちがう パン……"); }
    else Sound.se("good");
    this.step = "bake"; this.setupStep();
  }
  takeOut() {
    const d = this.done;
    let p = 0;
    if (d > 100) p = 60;
    else { const off = Math.abs(d - this.zone) - this.zoneW / 2; if (off > 0) p = Math.min(55, off * 2.4); }
    this.pen += p;
    Sound.se(p === 0 ? "ding" : p < 20 ? "good" : "bad");
    this.bakeMsg = p === 0 ? "ばっちり！" : d > 100 ? "こげちゃった……" : d < this.zone ? "ちょっと はやかった" : "ちょっと やきすぎ";
    this.sc.addFx("text", G.W / 2, this.R.y + 30, { text: this.bakeMsg, dur: 1 });
    if (this.want.top) { this.step = "top"; this.setupStep(); }
    else this.sc.finish(this.score());
  }
  downArea(p) {
    if (this.step !== "top") return;
    const b = this.breadPos();
    if (Math.hypot(p.x - b.x, (p.y - b.y) * 1.4) < b.s * 0.45 && this.tops.length < 9) {
      this.tops.push({ id: this.curTop, dx: p.x - b.x, dy: p.y - b.y });
      Sound.se("pop");
    }
  }
  finishTop() {
    const t = this.want.top;
    const right = this.tops.filter((x) => x.id === t.id).length, wrong = this.tops.length - right;
    this.pen += Math.abs(right - t.n) * 12 + wrong * 10;
    this.sc.finish(this.score());
  }
  score() { return 100 - this.pen - this.sc.timePenalty(); }
  timeout() {
    if (this.step === "choose") return 0;
    if (this.step === "bake") return 100 - this.pen - 60;
    return this.score() - 20;
  }
  tick(dt) {
    if (this.step === "bake") {
      this.done += this.speed * dt;
      if (this.done > 135) { this.done = 135; }
    }
  }
  breadPos() {
    const R = this.R;
    if (this.step === "top") return { x: R.x + R.w / 2, y: R.y + (R.h - 150) / 2 + 6, s: Math.min(170, R.h - 170) };
    return { x: R.x + R.w / 2, y: R.y + R.h * 0.34, s: Math.min(130, R.h * 0.34) };
  }
  drawOrder(ctx, x, y, w, h) {
    const W = this.want;
    mgIcon(ctx, "bread:" + W.bread + ":ord", () => breadSvg(W.bread, W.bake === "soft" ? 0.45 : 0.85), x + 34, y + h * 0.42, 50);
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = "900 12px 'M PLUS Rounded 1c', sans-serif";
    ctx.fillText(BREADS.find((b) => b.id === W.bread).name, x + 64, y + 12);
    ctx.fillStyle = W.bake === "soft" ? "#E6B566" : "#B97A3E";
    U.rr(ctx, x + 64, y + 22, 64, 20, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#FFF"; ctx.font = "900 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    ctx.fillText(W.bake === "soft" ? "ふんわり" : "こんがり", x + 96, y + 32.5);
    if (W.top) {
      topIcon(ctx, W.top.id, x + 76, y + h - 16, 22);
      ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(`×${W.top.n}`, x + 90, y + h - 15);
    }
  }
  draw(ctx) {
    const R = this.R;
    ctx.save();
    ctx.fillStyle = INK; ctx.font = "900 14px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    if (this.step === "choose") { ctx.fillText("ちゅうもんの パンを えらんでね", R.x + R.w / 2, R.y + 26); ctx.restore(); return; }
    const b = this.breadPos();
    if (this.step === "bake") {
      // オーブン
      const ow = Math.min(R.w - 60, 250), oh = b.s * 1.05;
      ctx.fillStyle = "#8D6E63"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      U.rr(ctx, b.x - ow / 2, b.y - oh / 2 - 10, ow, oh + 20, 18); ctx.fill(); ctx.stroke();
      const glow = Math.min(1, this.done / 100);
      ctx.fillStyle = `rgba(255,${Math.round(170 - glow * 60)},60,${0.45 + glow * 0.3})`;
      U.rr(ctx, b.x - ow / 2 + 14, b.y - oh / 2, ow - 28, oh, 12); ctx.fill(); ctx.stroke();
      mgIcon(ctx, "bread:" + this.bread + ":" + Math.round(this.done / 5), () => breadSvg(this.bread, this.done / 100), b.x, b.y + 4, b.s * 0.8);
      if (this.done > 100 && Math.floor(G.t * 6) % 2) { ctx.fillStyle = "rgba(90,90,90,0.5)"; ctx.beginPath(); ctx.arc(b.x - 20, b.y - 30 - (G.t * 20) % 20, 12, 0, 7); ctx.fill(); }
      // メーター
      const mx = R.x + 30, mw = R.w - 60, my = R.y + R.h - 116;
      const g = ctx.createLinearGradient(mx, 0, mx + mw, 0);
      g.addColorStop(0, "#F6E7C8"); g.addColorStop(0.35, "#F2D39A"); g.addColorStop(0.6, "#E0A860"); g.addColorStop(0.74, "#B97A3E"); g.addColorStop(1, "#46322A");
      U.rr(ctx, mx, my, mw, 22, 11); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      const zx = mx + (mw * (this.zone - this.zoneW / 2)) / 135, zw = (mw * this.zoneW) / 135;
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.strokeRect(zx, my - 4, zw, 30); ctx.setLineDash([]);
      ctx.fillStyle = INK; ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(this.want.bake === "soft" ? "ふんわり" : "こんがり", zx + zw / 2, my - 10);
      const nx = mx + (mw * Math.min(this.done, 135)) / 135;
      ctx.fillStyle = "#E8453C"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(nx, my + 24); ctx.lineTo(nx - 8, my + 36); ctx.lineTo(nx + 8, my + 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (this.step === "top") {
      mgIcon(ctx, "bread:" + this.bread + ":big", () => breadSvg(this.bread, this.done / 100), b.x, b.y, b.s);
      for (const t of this.tops) topIcon(ctx, t.id, b.x + t.dx, b.y + t.dy, 22);
      ctx.fillStyle = INK; ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(`パンを タップして のせる（${this.tops.length}こ）`, R.x + R.w / 2, R.y + 20);
    }
    ctx.restore();
  }
}


MG_TASKS.bakery = BakeryTask;
