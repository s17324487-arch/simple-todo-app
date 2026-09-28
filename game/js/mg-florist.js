// florist のおてつだい。進行と共通描画は minigames.js。
class FloristTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const kinds = [2, 2, 3, 3, 3][lv - 1];
    const total = [3, 4, 5, 6, 7][lv - 1];
    const ks = U.shuffle(FLOWER_KINDS.map((f) => f.id)).slice(0, kinds);
    this.want = {};
    ks.forEach((k) => (this.want[k] = 1));
    for (let i = kinds; i < total; i++) { const k = U.pick(ks); this.want[k]++; }
    this.ribbon = U.pick(RIBBONS).id;
    this.picked = [];
    this.step = "pick";
    this.timeLimit = [22, 22, 24, 24, 24][lv - 1];
    this.hideAfter = [0, 0, 0, 5.5, 4.5][lv - 1];
    this.title = "はなたば ください！";
  }
  layout(R) { this.R = R; this.setup(); }
  setup() {
    const R = this.R;
    if (this.step === "pick") {
      const cells = gridBtns(R, 6, 3, R.y + R.h * 0.42, Math.min(70, (R.h * 0.4 - 8) / 2));
      this.btns = FLOWER_KINDS.map((f, i) => ({ ...cells[i], label: f.name, fs: 11, color: "#EAF6FF", icon: (ctx, x, y, s) => { ctx.fillStyle = "#8D6E63"; U.rr(ctx, x - s * 0.4, y + s * 0.05, s * 0.8, s * 0.42, 6); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); mgIcon(ctx, "fl:" + f.id, () => flowerIconSvg(f.col), x, y - s * 0.12, s * 0.8); }, cb: () => this.pick(f.id) }));
      const w2 = (R.w - 28) / 2, y2 = R.y + R.h - 58;
      this.btns.push({ x: R.x + 10, y: y2, w: w2, h: 46, label: "ひとつ もどす", fs: 13, cb: () => { this.picked.pop(); Sound.se("cancel"); } });
      this.btns.push({ x: R.x + 18 + w2, y: y2, w: w2, h: 46, label: "リボンを えらぶ ▶", fs: 13, color: "#FFD54F", cb: () => { this.step = "ribbon"; this.setup(); } });
    } else {
      const cells = gridBtns(R, 4, 2, R.y + R.h * 0.5, Math.min(62, (R.h * 0.44 - 8) / 2));
      this.btns = RIBBONS.map((r, i) => ({ ...cells[i], label: r.name + "の リボン", fs: 12, icon: (ctx, x, y, s) => this.ribbonIcon(ctx, x, y, s * 0.7, r.col), cb: () => this.finishR(r.id) }));
    }
  }
  pick(id) {
    if (this.picked.length >= 10) { Sound.se("bad"); return; }
    this.picked.push(id);
    Sound.se("pop");
  }
  ribbonIcon(ctx, x, y, s, col) {
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - s * 0.5, y - s * 0.5, x - s * 0.8, y + s * 0.1, x, y); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + s * 0.5, y - s * 0.5, x + s * 0.8, y + s * 0.1, x, y); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, s * 0.12, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  finishR(id) { this.chosen = id; this.sc.finish(this.score()); }
  score() {
    let diff = 0;
    const cnt = {};
    for (const p of this.picked) cnt[p] = (cnt[p] || 0) + 1;
    for (const f of FLOWER_KINDS) diff += Math.abs((cnt[f.id] || 0) - (this.want[f.id] || 0));
    return 100 - diff * 15 - (this.chosen === this.ribbon ? 0 : 20) - this.sc.timePenalty() - this.peekPenalty();
  }
  timeout() { return this.score() - 20; }
  drawOrder(ctx, x, y, w, h) {
    const ks = Object.keys(this.want);
    const colW = Math.min(54, w / ks.length);
    ks.forEach((k, i) => {
      const f = FLOWER_KINDS.find((q) => q.id === k);
      const cx = x + w / 2 + (i - (ks.length - 1) / 2) * colW;
      mgIcon(ctx, "fl:" + k, () => flowerIconSvg(f.col), cx, y + h * 0.3, 32);
      ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("×" + this.want[k], cx, y + h * 0.3 + 25);
    });
    // リボンは したの だんに
    const r = RIBBONS.find((q) => q.id === this.ribbon);
    const ry = y + h - 12;
    this.ribbonIcon(ctx, x + w / 2 - 34, ry, 24, r.col);
    ctx.fillStyle = INK; ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`${r.name}の リボン`, x + w / 2 - 18, ry + 1);
  }
  draw(ctx) {
    const R = this.R;
    const cx = R.x + R.w / 2, top = R.y + 10, h = R.h * (this.step === "pick" ? 0.38 : 0.44);
    // はなたば
    ctx.save();
    const n = this.picked.length;
    this.picked.forEach((id, i) => {
      const f = FLOWER_KINDS.find((q) => q.id === id);
      const a = n > 1 ? (i / (n - 1) - 0.5) * 1.2 : 0;
      const fx = cx + Math.sin(a) * h * 0.42, fy = top + h * 0.34 - Math.cos(a) * h * 0.18 + (i % 2) * 8;
      ctx.strokeStyle = "#4E9A3E"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, top + h * 0.95); ctx.lineTo(fx, fy); ctx.stroke();
      mgIcon(ctx, "fl:" + id, () => flowerIconSvg(f.col), fx, fy + 6, 40);
    });
    ctx.fillStyle = "#FFF3E0"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - h * 0.5, top + h * 0.45); ctx.lineTo(cx + h * 0.5, top + h * 0.45); ctx.lineTo(cx + 12, top + h); ctx.lineTo(cx - 12, top + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#F8BBD0"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - h * 0.3, top + h * 0.55); ctx.lineTo(cx - 6, top + h * 0.9); ctx.moveTo(cx + h * 0.3, top + h * 0.55); ctx.lineTo(cx + 6, top + h * 0.9); ctx.stroke();
    if (this.chosen) this.ribbonIcon(ctx, cx, top + h * 0.72, 30, RIBBONS.find((r) => r.id === this.chosen).col);
    ctx.fillStyle = INK; ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    ctx.fillText(this.step === "pick" ? `${n}ほん` : "リボンの いろは？", R.x + 44, top + 14);
    ctx.restore();
  }
}

MG_TASKS.florist = FloristTask;
