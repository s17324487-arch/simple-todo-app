// おうちの 吹き出し（見本の 実装・canvas 2D・classic script）。
// HomeLife.bubbleLayout / HomeLife.draw の 置きかえを 想定。座標は 論理px（G.W×G.H）。
// ・話し手の 頭の 真上に 出す（しっぽは 短く 話し手を さす）。重なるときは 左右に ずらす → 横に 出す → 古い 吹き出しを 消す。
// ・色つきの 名札で だれの ことばか すぐ わかる。形で 気持ちを 見せる（ふつう・さけぶ・なく・こころの こえ・ひそひそ・めずらしい）。
// ・同時に 出すのは 2つまで（かけあいは 順番に）。
const HomeBubbleRef = {
  S: { font: 13, lineH: 18, padX: 11, padY: 8, maxW: 186, minW: 58, r: 13, bw: 2, tail: 10, gap: 6, tabH: 15, tabFont: 10, maxLines: 3 },
  COLOR: { wanko: "#9C7552", gachan: "#E1A21E", goji: "#667A83", papa: "#4F86C6", mama: "#DE7A9C" },
  FILL: { say: "#FFFDF7", shout: "#FFFDF7", cry: "#EEF6FF", think: "#FFFFFF", whisper: "#FBFBF8", rare: "#FFF3B6" },
  INK: "#1F1D1B",
  // 何秒 出すか（文の 長さで かえる）
  life(text) { return Math.max(2.4, Math.min(5.5, 1.8 + text.length * 0.1)); },
  // 文節（半角スペース）で 折りかえす。1文節が 長すぎる ときだけ 文字で 切る
  wrap(ctx, text, maxW) {
    const out = []; let line = "";
    const put = (tok) => { const t = line ? line + " " + tok : tok; if (ctx.measureText(t).width <= maxW) { line = t; return; } if (line) out.push(line); line = "";
      if (ctx.measureText(tok).width <= maxW) { line = tok; return; } let part = ""; for (const ch of tok) { if (ctx.measureText(part + ch).width > maxW) { out.push(part); part = ch; } else part += ch; } line = part; };
    for (const para of String(text).split("\n")) { for (const tok of para.split(" ").filter(Boolean)) put(tok); if (line) { out.push(line); line = ""; } }
    if (out.length > this.S.maxLines) { out.length = this.S.maxLines; out[out.length - 1] = out[out.length - 1].replace(/.$/, "…"); }
    return out;
  },
  // bubbles: [{ id, name, text, kind, rare, born }]（古い 順）。heads: { id: { x, y, r } }（頭の てっぺんの 点と 顔の 半径）
  // area: { top, bottom, left, right }（HUD や ボタンに かからない はんい）
  layout(ctx, bubbles, heads, area) {
    const S = this.S, boxes = [];
    const faces = Object.entries(heads).map(([id, h]) => ({ id, x: h.x - h.r * 0.9, y: h.y + 2, w: h.r * 1.8, h: h.r * 1.5 }));
    const over = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + S.gap) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + S.gap);
    ctx.font = `700 ${S.font}px sans-serif`;
    for (const b of bubbles.slice(-2)) {
      const hd = heads[b.id]; if (!hd) continue;
      const lines = this.wrap(ctx, b.text, S.maxW - S.padX * 2), zig = b.kind === "shout" ? 6 : 0;
      const w = Math.max(S.minW, Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width)) + S.padX * 2) + zig * 2);
      const h = S.padY * 2 + lines.length * S.lineH + 4 + zig * 2;
      // 候補に 点数を つけて いちばん 小さい ものを えらぶ（ほかの 吹き出し・顔に かぶると 大きく 減点）
      let best = null;
      const tryAt = (x0, y0, side, base) => {
        const x = Math.max(area.left, Math.min(area.right - w, x0)), y = Math.max(area.top, Math.min(area.bottom - h, y0)), r = { x, y, w, h };
        let score = base + Math.abs(x - x0) * 2 + Math.abs(y - y0) * 2;
        for (const o of boxes) score += over(r, o) * 6;
        for (const f of faces) score += over(r, f) * (f.id === b.id ? 6 : f.id === "papa" || f.id === "mama" ? (f.id === bubbles[bubbles.length - 1].id ? 4 : 0.8) : 4);   // 話していない ぱぱ・ままの 顔は 少し なら かかって よい
        if (side === "top" && y + h > hd.y - 2) score += 4000;
        if (!best || score < best.score) best = { ...r, side, score };
      };
      for (const tier of [0, 1]) for (const dx of [0, -22, 22, -44, 44, -66, 66, -88, 88, -110, 110, -132, 132, -154, 154]) tryAt(hd.x - w / 2 + dx, hd.y - S.tail - h - tier * (h * 0.6 + 10), "top", Math.abs(dx) * 0.8 + tier * 60);
      tryAt(hd.x - hd.r - S.tail - w, hd.y + hd.r * 0.5 - h / 2, "left", 70); tryAt(hd.x + hd.r + S.tail, hd.y + hd.r * 0.5 - h / 2, "right", 70);
      const pick = best;
      // しっぽ: 吹き出しの ふちで いちばん 頭に 近い 点から、頭の てっぺんへ（遠いときは 少し 長く）
      let base, tip;
      if (pick.side === "top") { base = { x: Math.max(pick.x + 18, Math.min(pick.x + w - 18, hd.x)), y: pick.y + h - zig }; tip = { x: hd.x + (hd.x - base.x) * 0.1, y: hd.y - 3 }; }
      else if (pick.side === "left") { base = { x: pick.x + w - zig, y: Math.max(pick.y + 12, Math.min(pick.y + h - 12, hd.y + hd.r * 0.5)) }; tip = { x: hd.x - hd.r + 2, y: hd.y + hd.r * 0.6 }; }
      else { base = { x: pick.x + zig, y: Math.max(pick.y + 12, Math.min(pick.y + h - 12, hd.y + hd.r * 0.5)) }; tip = { x: hd.x + hd.r - 2, y: hd.y + hd.r * 0.6 }; }
      boxes.push({ ...b, ...pick, lines, base, tip, zig });
    }
    return boxes;
  },
  // 形（ふち）の 道すじ
  shape(ctx, b) {
    const { x, y, w, h } = b, r = this.S.r;
    ctx.beginPath();
    if (b.kind === "shout") {                                    // ぎざぎざ（元気・さけぶ）: 四角の ふちに 小さな とげ
      const z = b.zig || 6, pts = [], ix = x + z, iy = y + z, iw = w - z * 2, ih = h - z * 2;
      const edge = (x0, y0, x1, y1, nx, ny) => { const len = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(len / 11)); for (let i = 0; i < m; i++) { const t = i / m, t2 = (i + 0.5) / m; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], [x0 + (x1 - x0) * t2 + nx * z, y0 + (y1 - y0) * t2 + ny * z]); } };
      edge(ix, iy, ix + iw, iy, 0, -1); edge(ix + iw, iy, ix + iw, iy + ih, 1, 0); edge(ix + iw, iy + ih, ix, iy + ih, 0, 1); edge(ix, iy + ih, ix, iy, -1, 0);
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    } else if (b.kind === "think") {                             // くも（こころの こえ・ねごと）
      const step = 16, bump = 6;
      ctx.moveTo(x + r, y);
      for (let px = x + r; px < x + w - r; px += step) ctx.quadraticCurveTo(px + step / 2, y - bump, Math.min(px + step, x + w - r), y);
      ctx.quadraticCurveTo(x + w + bump, y + h / 2, x + w - r, y + h);
      for (let px = x + w - r; px > x + r; px -= step) ctx.quadraticCurveTo(px - step / 2, y + h + bump, Math.max(px - step, x + r), y + h);
      ctx.quadraticCurveTo(x - bump, y + h / 2, x + r, y);
    } else if (b.kind === "cry") {                               // なみなみ（なく・こわい）
      const pts = []; const seg = 10;
      const edge = (x0, y0, x1, y1, nx, ny) => { const len = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(len / seg)); for (let i = 0; i < m; i++) { const t = i / m, wv = Math.sin(i * 1.7) * 1.6; pts.push([x0 + (x1 - x0) * t + nx * wv, y0 + (y1 - y0) * t + ny * wv]); } };
      edge(x + r, y, x + w - r, y, 0, -1); edge(x + w, y + r, x + w, y + h - r, 1, 0); edge(x + w - r, y + h, x + r, y + h, 0, 1); edge(x, y + h - r, x, y + r, -1, 0);
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    } else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); }
    ctx.closePath();
  },
  draw(ctx, boxes, now) {
    const S = this.S, INK = this.INK;
    for (const b of boxes) {
      const age = now - (b.born || 0), life = this.life(b.text);
      const pop = age < 0.18 ? 0.82 + (age / 0.18) * 0.26 : age < 0.28 ? 1.08 - ((age - 0.18) / 0.1) * 0.08 : 1;
      const alpha = age > life - 0.25 ? Math.max(0, (life - age) / 0.25) : 1;
      if (alpha <= 0) continue;
      const kind = b.rare ? "rare" : b.kind || "say", col = this.COLOR[b.id] || INK, fill = this.FILL[kind] || this.FILL.say;
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.translate(b.tip.x, b.tip.y); ctx.scale(pop, pop); ctx.translate(-b.tip.x, -b.tip.y);
      // かげ
      ctx.save(); ctx.translate(0, 2.5); ctx.fillStyle = "rgba(26,20,16,0.13)"; this.shape(ctx, { ...b, kind }); ctx.fill(); ctx.restore();
      // しっぽ（こころの こえは 小さな まる 2つ）
      ctx.lineWidth = S.bw; ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.fillStyle = fill;
      const vx = b.tip.x - b.base.x, vy = b.tip.y - b.base.y, len = Math.hypot(vx, vy) || 1, nx = -vy / len, ny = vx / len, half = 6.5;
      if (kind === "think") { for (const [k, rr] of [[0.45, 4], [0.9, 2.6]]) { ctx.beginPath(); ctx.arc(b.base.x + vx * k, b.base.y + vy * k, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } }
      else { ctx.beginPath(); ctx.moveTo(b.base.x + nx * half, b.base.y + ny * half); ctx.quadraticCurveTo(b.base.x + vx * 0.5 + nx * 2, b.base.y + vy * 0.5 + ny * 2, b.tip.x, b.tip.y); ctx.quadraticCurveTo(b.base.x + vx * 0.45 - nx * 1, b.base.y + vy * 0.45 - ny * 1, b.base.x - nx * half, b.base.y - ny * half); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // からだ
      this.shape(ctx, { ...b, kind }); ctx.fillStyle = fill; ctx.fill();
      if (kind === "whisper") ctx.setLineDash([4, 3]);
      ctx.lineWidth = kind === "shout" ? 2.4 : S.bw; ctx.stroke(); ctx.setLineDash([]);
      // しっぽの つけねの 線を けす
      if (kind !== "think") { ctx.beginPath(); ctx.moveTo(b.base.x + nx * (half - 1.4) - vx / len * 1.5, b.base.y + ny * (half - 1.4) - vy / len * 1.5); ctx.lineTo(b.base.x - nx * (half - 1.4) - vx / len * 1.5, b.base.y - ny * (half - 1.4) - vy / len * 1.5); ctx.lineWidth = S.bw + 1.6; ctx.strokeStyle = fill; ctx.stroke(); }
      // なく: なみだ / めずらしい: きらきら
      if (kind === "cry") { ctx.fillStyle = "#7CC4F2"; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; for (const [dx, dy] of [[-12, 4], [12, 10]]) { const tx = b.tip.x + dx, ty = b.tip.y + dy - 18; ctx.beginPath(); ctx.moveTo(tx, ty - 4); ctx.quadraticCurveTo(tx + 3.5, ty + 1, tx, ty + 3); ctx.quadraticCurveTo(tx - 3.5, ty + 1, tx, ty - 4); ctx.fill(); ctx.stroke(); } }
      if (kind === "rare") { ctx.fillStyle = "#F2B632"; for (const [px, py, s] of [[b.x + 4, b.y + 2, 5], [b.x + b.w - 4, b.y + b.h - 3, 4], [b.x + b.w - 10, b.y - 1, 3]]) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? s * 0.35 : s; ctx.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); } }
      // 名札（話し手の 色）
      ctx.font = `800 ${S.tabFont}px sans-serif`; const tw = ctx.measureText(b.name).width + 12, tx = b.x + 10, ty = b.y - S.tabH / 2 - 1;
      ctx.beginPath(); ctx.moveTo(tx + 7, ty); ctx.arcTo(tx + tw, ty, tx + tw, ty + S.tabH, 7); ctx.arcTo(tx + tw, ty + S.tabH, tx, ty + S.tabH, 7); ctx.arcTo(tx, ty + S.tabH, tx, ty, 7); ctx.arcTo(tx, ty, tx + tw, ty, 7); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(b.name, tx + 6, ty + S.tabH / 2 + 0.5);
      // 文
      ctx.font = `700 ${kind === "whisper" ? S.font - 1 : S.font}px sans-serif`; ctx.fillStyle = kind === "whisper" ? "#5A5550" : INK; ctx.textBaseline = "alphabetic";
      const single = b.lines.length === 1; ctx.textAlign = single ? "center" : "left";
      b.lines.forEach((ln, i) => { const lx = single ? b.x + b.w / 2 : b.x + S.padX + (b.zig || 0), ly = b.y + S.padY + 4 + (b.zig || 0) + S.lineH * (i + 1) - 5; ctx.fillText(ln, lx, ly); });
      ctx.restore();
    }
  },
};
if (typeof module !== "undefined") module.exports = HomeBubbleRef;
