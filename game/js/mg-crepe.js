// crepe のおてつだい。進行と共通描画は minigames.js。
class CrepeTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const n = [2, 3, 3, 4, 4][lv - 1];
    this.want = U.shuffle(CREPE_TOPS.map((t) => t.id)).slice(0, n);
    this.placed = [];
    this.timeLimit = [22, 21, 20, 19, 17][lv - 1];
    this.hideAfter = [0, 0, 5, 4, 3.2][lv - 1];
    this.title = "クレープ ください！";
  }
  layout(R) {
    this.R = R;
    this.cx = R.x + R.w / 2; this.cy = R.y + R.h * 0.24; this.cr = Math.min(R.w * 0.3, R.h * 0.19);
    const top = R.y + R.h * 0.47;
    const bh = Math.min(64, (R.h * 0.34 - 8) / 2);
    const cells = gridBtns(R, 8, 4, top, bh);
    this.btns = CREPE_TOPS.map((t, i) => ({ ...cells[i], label: t.name, fs: 10, icon: (ctx, x, y, s) => topIcon(ctx, t.id, x, y, s), cb: () => this.add(t.id) }));
    const y2 = top + (bh + 8) * 2 + 4, h2 = Math.min(52, R.y + R.h - y2 - 10);
    const w2 = (R.w - 28) / 2;
    this.btns.push({ x: R.x + 10, y: y2, w: w2, h: h2, label: "やりなおし", fs: 14, cb: () => { this.placed = []; Sound.se("cancel"); } });
    this.btns.push({ x: R.x + 18 + w2, y: y2, w: w2, h: h2, label: "できあがり！", fs: 15, color: "#FFD54F", cb: () => this.serve() });
  }
  add(id) {
    if (this.placed.length >= 6) { Sound.se("bad"); return; }
    const a = U.rand(0, Math.PI * 2), r = U.rand(0, this.cr * 0.55);
    this.placed.push({ id, dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.7, rot: U.rand(-0.4, 0.4) });
    Sound.se("pop");
  }
  score() {
    const need = [...this.want];
    let extra = 0;
    for (const p of this.placed) { const i = need.indexOf(p.id); if (i >= 0) need.splice(i, 1); else extra++; }
    return 100 - need.length * 30 - extra * 20 - this.sc.timePenalty() - this.peekPenalty();
  }
  serve() { Sound.se("swish"); this.served = true; this.sc.finish(this.score()); }
  timeout() { return this.score() - 25; }
  drawOrder(ctx, x, y, w, h) {
    const n = this.want.length, s = Math.min(40, (w - 8) / n - 6);
    this.want.forEach((id, i) => {
      const cx = x + w / 2 + (i - (n - 1) / 2) * (s + 8);
      topIcon(ctx, id, cx, y + h * 0.42, s);
      ctx.fillStyle = INK; ctx.font = "800 9px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.fillText(CREPE_TOPS.find((t) => t.id === id).name, cx, y + h * 0.42 + s / 2 + 10);
    });
  }
  draw(ctx) {
    const { cx, cy, cr } = this;
    // プレートとクレープ
    ctx.fillStyle = "#E3F2FD"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, cr * 1.3, cr * 0.95, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#F6D48E";
    ctx.beginPath(); ctx.ellipse(cx, cy, cr, cr * 0.72, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#E0B060"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, cr * (0.35 + i * 0.2), cr * 0.72 * (0.35 + i * 0.2), 0, 0.4 + i, 2 + i); ctx.stroke(); }
    for (const p of this.placed) { ctx.save(); ctx.translate(cx + p.dx, cy + p.dy); ctx.rotate(p.rot); topIcon(ctx, p.id, 0, 0, cr * 0.5); ctx.restore(); }
    if (!this.placed.length) { ctx.fillStyle = "#B08A4A"; ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillText("トッピングを のせてね", cx, cy + 4); }
  }
}


MG_TASKS.crepe = CrepeTask;
