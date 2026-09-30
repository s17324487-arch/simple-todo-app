// ころころ フルーツ（ネリカスタウンの パズルの おてつだい）。スイカゲームのような おちもの パズル。
// 箱の 上から 小さい くだもの（さくらんぼ・いちご・みかん・りんご）を おとす。おなじ もの どうしが ふれると 1つ 大きく なる。
// なし の つぎは がちゃん → わんこ → ごじ（3人の かおの 玉）。ごじ どうしは はじけて きえる。
// ちゅうもん モード（ここ）: おきゃくさんの ちゅうもん（なし・がちゃん など）が 箱に できると、おきゃくさんに とどく。箱の 中みは おきゃくさんが かわっても つづく。
// スコア モード: js/korokoro-score.js（おなじ KorokoroBoard を mode: "score" で つかう。あふれたら ゲームオーバー）。
// 物理は js/korokoro-physics.js（KorokoroWorld）、絵は js/korokoro-art.js（KorokoroArt）、町の 建物は js/korokoro-town.js。
// すすみかた・ひょうか・コインは minigames.js の ShopScene（sc.board は おきゃくさんの あいだも うごく 箱）。

// レベルごとの ちゅうもん（KOROKORO_TIERS の だん: 4 なし・5 がちゃん・6 わんこ。おなじ だんを 2つ ほしい ことも ある）と 1にんの じかん（びょう）
const KOROKORO_ORDERS = Object.freeze([
  { time: 50, sets: [[4]] },
  { time: 50, sets: [[4], [4], [5]] },
  { time: 55, sets: [[5], [5], [4, 4]] },
  { time: 60, sets: [[5, 4], [5, 4], [6]] },
  { time: 65, sets: [[6], [5, 5], [6, 4]] },
]);
// 3人の かおの 玉を つくった ときの チップ（コイン）。ごじ どうしが はじけると さらに（ちゅうもん モードだけ）
const KOROKORO_BONUS = Object.freeze({ 5: 3, 6: 8, 7: 15, burst: 25 });

const KorokoroSound = {
  tone(o) { if (!Sound.ctx || !Save.d || !Save.d.settings.se) return; Sound.tone(Sound.seGain, o); },
  // 大きい ものほど ひくい 「ぽん」
  merge(tier) { const f = 1180 * Math.pow(0.88, tier); this.tone({ f, f2: f * 1.7, dur: 0.1, type: "sine", vol: 0.22 }); this.tone({ f: f * 1.5, t: 0.06, dur: 0.08, type: "triangle", vol: 0.1 }); },
  land(tier, speed) { if (speed < 60) return; const f = 420 * Math.pow(0.9, tier); this.tone({ f, f2: f * 0.7, dur: 0.07, type: "triangle", vol: Math.min(0.16, 0.05 + speed / 3000) }); },
};

// 箱（物理・おとす・ゆびの 入力・描画）。o.mode: "order"（ちゅうもん モード・よこに つぎ／ポイント／じゅんばん）か "score"（スコア モード・箱を 大きく・したに じゅんばん）
// o.overSec: あふれ までの びょう（スコア モードは みじかい）・o.H: 箱の 高さ（はば 100。スコア モードは 15% たかい）・o.rules: 物理の きまりの 上がき（スコア モードは はねを おさえる）
class KorokoroBoard {
  constructor(sc, seed = (Date.now() ^ 0x5eed) >>> 0, o = {}) {
    this.sc = sc; this.mode = o.mode === "score" ? "score" : "order";
    this.world = new KorokoroWorld(seed, { overSec: o.overSec, H: o.H, rules: o.rules });
    this.held = this.world.pickDrop(); this.next = this.world.pickDrop();
    this.aim = 50; this.cool = 0; this.points = 0; this.spills = 0; this.coins = 0; this.drops = 0; this.merges = 0; this.made = {};
    // over: スコア モードの おしまい（"overflow" = はみだした・"stop" = じぶんで やめた・false = あそんで いる）
    this.fx = []; this.flyers = []; this.aiming = false; this.pid = null; this.want = []; this.over = false;
  }
  // 箱の たて ÷ よこ（ちゅうもん モード 1.1・スコア モード 1.265）。レイアウトでは これに 上の おとす ところ（0.28）を たす
  aspect() { return this.world.H / this.world.W; }
  // ちゅうもん モード: 作業エリア R に 箱（左）と よこの れつ（つぎ・ポイント・じゅんばん）を おく
  layout(R) {
    if (this.mode === "score") return this.layoutScore(R);
    const pad = 8, side = 50, areaW = R.w - pad * 3 - side, k = this.aspect();
    this.R = R; this.row = null;
    this.bw = Math.floor(Math.min(areaW, (R.h - pad * 2) / (k + 0.28)));
    this.s = this.bw / 100; this.bh = this.bw * k;
    this.bx = R.x + pad + Math.max(0, (areaW - this.bw) / 2);
    this.top = Math.round(this.s * 28);
    this.by = R.y + pad + this.top + Math.max(0, (R.h - pad * 2 - this.top - this.bh) / 2);
    this.col = { x: R.x + R.w - pad - side, y: R.y + pad, w: side, h: R.h - pad * 2 };
    this.preload();
  }
  // スコア モード: 箱を できるだけ 大きく（よこの れつは なし。つぎ と スコアは js/korokoro-score.js が うえに 描く）・箱の したに 大きく なる じゅんばん
  layoutScore(R) {
    const pad = 6, rowH = U.clamp(Math.round(R.w / 7.4), 42, 54), room = R.h - rowH - pad * 2 - 16, k = this.aspect() + 0.28;
    this.R = R; this.col = null;
    this.bw = Math.floor(Math.min(R.w - 24, room / k));
    this.s = this.bw / 100; this.bh = this.bw * this.aspect();
    this.bx = R.x + (R.w - this.bw) / 2;
    this.top = Math.round(this.s * 28);
    this.by = R.y + pad + this.top + Math.max(0, (room - this.bw * k) / 2);
    this.row = { x: R.x + 4, y: this.by + this.bh + 16, w: R.w - 8, h: rowH };
    this.preload();
  }
  preload() {
    if (!this.s || typeof document === "undefined") return;
    for (const t of KOROKORO_TIERS) {
      for (const emo of KorokoroArt.FACES) KorokoroArt.ensure(t.tier, emo, t.r * this.s);
      KorokoroArt.ensure(t.tier, "normal", this.chainR());
    }
  }
  px(u) { return this.bx + u * this.s; }
  py(v) { return this.by + v * this.s; }
  ux(x) { return (x - this.bx) / this.s; }
  chainR() {
    const n = KOROKORO_TIERS.length;
    if (this.row) return Math.max(6, Math.min((this.row.w / n) * 0.3, this.row.h * 0.36));
    return Math.max(6, Math.min(((this.col.h - 118) / n) * 0.42, this.col.w * 0.34));
  }
  canDrop() { return this.cool <= 0 && !this.world.floorOpen && !this.over; }
  // ---- すすめる ----
  tick(dt, working) {
    if (!this.over) for (const e of this.world.step(dt)) { this.event(e, working); if (this.over) break; }
    this.cool = Math.max(0, this.cool - dt);
    this.fx = this.fx.filter((f) => (f.t += dt) < f.dur);
    this.flyers = this.flyers.filter((f) => (f.t += dt) < f.dur);
  }
  // がったいの 点は 本物の スイカゲームと おなじ（くっついた 2つの だんの 三角数。e.points）
  event(e, working) {
    const T = KOROKORO_TIERS, order = this.mode === "order";
    if (e.type === "land") KorokoroSound.land(e.tier, e.speed);
    else if (e.type === "merge") {
      const pts = e.points; this.points += pts; this.merges++; this.made[e.tier] = (this.made[e.tier] || 0) + 1;
      this.fx.push({ kind: "pop", x: e.x, y: e.y, r: T[e.tier].r, t: 0, dur: 0.45 }, { kind: "text", x: e.x, y: e.y - T[e.tier].r, text: "+" + pts, t: 0, dur: 0.8 });
      KorokoroSound.merge(e.tier);
      const bonus = order ? KOROKORO_BONUS[e.tier] || 0 : 0;
      if (bonus) { this.coins += bonus; this.fx.push({ kind: "coin", x: e.x, y: e.y, text: `+${bonus}コイン`, t: 0, dur: 1.1 }); Sound.se("coin"); }
      if (e.hero) this.cheer(e.hero);
    } else if (e.type === "burst") {
      const bonus = order ? KOROKORO_BONUS.burst : 0;
      this.points += e.points; this.coins += bonus; this.merges++; this.made.burst = (this.made.burst || 0) + 1;
      this.fx.push({ kind: "burst", x: e.x, y: e.y, r: T[e.tier].r * 1.6, t: 0, dur: 0.9 }, { kind: "coin", x: e.x, y: e.y, text: bonus ? `ごじ パーン！ +${bonus}コイン` : `ごじ パーン！ +${e.points}`, t: 0, dur: 1.4 });
      Sound.se("fanfare");
      // ごじ どうしが きえると 3人 みんなで よろこぶ（こえは ごじ だけ）
      for (const id of ["goji", "wanko", "gachan"]) this.cheer(id, id !== "goji");
    } else if (e.type === "overflow") {
      // スコア モード: あふれたら ゲームオーバー（箱は そのまま とまる）
      if (!order) { if (!this.over) { this.end("overflow"); this.sc.gameOver?.(); } return; }
      this.spills++; this.world.spill(); this.cool = 0.6;
      this.fx.push({ kind: "banner", x: 50, y: 50, text: "いっぱいに なっちゃった！\nはこを からっぽに するね", t: 0, dur: 1.8 });
      if (working && this.sc.cust) this.sc.mistake("あふれちゃった！"); else Sound.se("bad");
    }
  }
  // かおの 玉が できると その子が よろこぶ（ちゅうもん モードは カウンターの うしろで・スコア モードは うえの 3人が ジャンプ）
  cheer(hero, quiet = false) {
    const sc = this.sc, t = sc.team && sc.team.find((m) => m.id === hero);
    if (!quiet) Sound.voice(hero);
    if (!t) return;
    t.turn = 1.4; t.emo = "happy"; t.jump = 0;
    const i = sc.team.indexOf(t), at = sc.teamSpot ? sc.teamSpot(i) : sc.viewH ? { x: G.W * 0.56 + i * 50, y: sc.viewH - 84 } : null;
    if (at && sc.addFx && !quiet) sc.addFx("text", at.x, at.y, { text: { wanko: "わん！", gachan: "ぴよ！", goji: "がおー！" }[hero], dur: 0.9 });
  }
  // スコア モードを おわりに する（箱は とまって もう おとせない）
  end(why = "stop") { if (!this.over) { this.over = why; this.aiming = false; this.pid = null; } }
  // ちゅうもんの だんが 箱に できて いたら とどける（大きく なりおわった もの）
  take(tier) {
    const b = this.world.bodies.find((x) => x.tier === tier && x.grow >= 1);
    if (!b) return false;
    this.world.remove([b]);
    const sc = this.sc;
    this.flyers.push({ tier, x0: this.px(b.x), y0: this.py(b.y), r: b.r * this.s, a: b.a, x1: (sc.custX || G.W * 0.29) + 34, y1: (sc.counterY || 120) - 6, t: 0, dur: 0.75 });
    this.fx.push({ kind: "pop", x: b.x, y: b.y, r: b.r, t: 0, dur: 0.45 });
    Sound.se("good");
    return true;
  }
  dropNow() {
    if (!this.canDrop()) return false;
    this.world.dropAt(this.held, this.aim);
    this.held = this.next; this.next = this.world.pickDrop();
    this.cool = KOROKORO_RULES.cool; this.drops++;
    this.aim = this.world.clampX(this.held, this.aim);
    Sound.se("tap");
    return true;
  }
  aimAt(x) { this.aim = this.world.clampX(this.held, this.ux(x)); }
  // ---- 入力（箱の 上で ゆびを うごかし、はなすと おちる。スコア モードは じゅんばんの れつの 上では おちない）----
  inside(p) { return p && p.x >= this.bx - 14 && p.x <= this.bx + this.bw + 14 && p.y >= this.R.y && p.y <= (this.row ? this.by + this.bh + 8 : this.R.y + this.R.h); }
  down(p) { if (this.over || !this.inside(p)) return; this.aiming = true; this.pid = p.id; this.aimAt(p.x); }
  move(p) { if (this.aiming && p && (p.id == null || p.id === this.pid)) this.aimAt(p.x); }
  up(p, canceled = false) {
    if (!this.aiming) return;
    if (p && p.id != null && this.pid != null && p.id !== this.pid) return;
    this.aiming = false; this.pid = null;
    if (canceled || !p) return;
    this.aimAt(p.x); this.dropNow();
  }
  key(k) {
    if (this.over) return;
    if (k === "left" || k === "right") this.aim = this.world.clampX(this.held, this.aim + (k === "left" ? -6 : 6));
    else if (k === "ok" || k === "down") this.dropNow();
  }
  // ---- 描画 ----
  // ふちより 上に いる じかんが あふれ までの 12% を こえたら あかい わ（ちゅうもん モードは 2びょう・スコア モードは みじかい）
  overShown(b) { return b.over > this.world.overSec * 0.12; }
  emo(b) {
    const W = this.world;
    if (this.over) return this.over === "stop" ? "happy" : b.over > 0 ? "sad" : "surprise";
    if (this.overShown(b) || (W.topGap < KOROKORO_RULES.warn && b.landed && b.y - b.r < KOROKORO_RULES.warn)) return "sad";
    if (!b.landed || b.hit > 140) return "surprise";
    if (b.born === "merge" && b.age < 0.9) return "happy";
    if (b.rest > 12) return "sleep";
    return "normal";
  }
  render(ctx, task) {
    const s = this.s, bx = this.bx, by = this.by, bw = this.bw, bh = this.bh, W = this.world;
    const working = this.mode === "score" ? this.sc.phase === "play" : !!task && this.sc.phase === "work";
    if (!s) return;
    ctx.save();
    // 箱（木の わく・ガラスの なか・うすい しま）
    ctx.lineJoin = "round"; ctx.strokeStyle = INK;
    ctx.fillStyle = "#E4B57F"; ctx.lineWidth = 2.5; U.rr(ctx, bx - 7, by - 6, bw + 14, bh + 15, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FFF8EA"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#FBEFD8"; for (let x = 0; x < bw; x += 16 * s) ctx.fillRect(bx + x, by, 8 * s, bh);
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.moveTo(bx + bw * 0.08, by); ctx.lineTo(bx + bw * 0.2, by); ctx.lineTo(bx + bw * 0.06, by + bh * 0.55); ctx.lineTo(bx, by + bh * 0.55); ctx.lineTo(bx, by + bh * 0.1); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = "#C98E57"; ctx.fillRect(bx - 6, by + bh, bw + 12, 7); ctx.strokeRect(bx - 6, by + bh, bw + 12, 7);
    // あふれ の せん（ちかく なると あかく ちかちか）
    const warn = W.topGap < KOROKORO_RULES.warn || this.over === "overflow", blink = warn && Math.floor(G.t * 6) % 2 === 0;
    ctx.setLineDash([6, 5]); ctx.lineWidth = warn ? 2.5 : 1.6; ctx.strokeStyle = warn ? (blink ? "#E8453C" : "#F3A09A") : "rgba(232,69,60,.35)";
    ctx.beginPath(); ctx.moveTo(bx + 2, by + 1); ctx.lineTo(bx + bw - 2, by + 1); ctx.stroke(); ctx.setLineDash([]);
    // 玉（そとへ おちる とちゅうも 箱の よこから はみださない ように きる）
    ctx.save(); ctx.beginPath(); ctx.rect(bx - 7, by - this.top - 8, bw + 14, bh + this.top + 30); ctx.clip();
    for (const b of W.bodies) {
      const x = this.px(b.x), y = this.py(b.y), r = b.r * s;
      KorokoroArt.draw(ctx, b.tier, this.emo(b), x, y, r, b.a);
      if (this.overShown(b)) { ctx.strokeStyle = "#E8453C"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2 * Math.min(1, b.over / W.overSec)); ctx.stroke(); }
    }
    ctx.restore();
    // 手もと: いまの 玉・おちる ところの めやす
    if (working && !W.floorOpen && !this.over) {
      const t = KOROKORO_TIERS[this.held], x = this.px(this.aim), r = t.r * s, yu = -t.r - 1.5, y = this.py(yu), k = this.cool > 0 ? 1 - this.cool / KOROKORO_RULES.cool : 1;
      ctx.strokeStyle = "#C9A77F"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(bx + 4, by - this.top + 4); ctx.lineTo(bx + bw - 4, by - this.top + 4); ctx.stroke();
      if (k >= 1) {
        const land = this.py(W.landingY(this.held, this.aim));
        ctx.strokeStyle = "rgba(31,29,27,.28)"; ctx.lineWidth = 1.6; ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(x, y + r + 2); ctx.lineTo(x, land); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, by - this.top + 4); ctx.lineTo(x, y - r * 0.8); ctx.stroke();
        ctx.fillStyle = "#F7D78A"; ctx.beginPath(); ctx.arc(x, by - this.top + 4, 4, 0, 7); ctx.fill(); ctx.stroke();
        KorokoroArt.draw(ctx, this.held, "happy", x, y, r, 0);
      } else KorokoroArt.draw(ctx, this.held, "normal", x, y - (1 - k) * 10, r * (0.6 + 0.4 * k), 0, k);
      if (!this.drops) {
        ctx.fillStyle = "rgba(255,253,246,.92)"; U.rr(ctx, bx + bw * 0.1, by + bh * 0.36, bw * 0.8, 46, 12); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif";
        ctx.fillText("ゆびで うごかして", bx + bw / 2, by + bh * 0.36 + 15, bw * 0.76); ctx.fillText("はなすと ころん！", bx + bw / 2, by + bh * 0.36 + 32, bw * 0.76);
      }
    }
    // できごとの しるし
    for (const f of this.fx) {
      const k = f.t / f.dur, x = this.px(f.x), y = this.py(f.y);
      ctx.save(); ctx.globalAlpha = 1 - k;
      if (f.kind === "pop") { ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, f.r * s * (1 + k * 0.6), 0, 7); ctx.stroke(); FX.sparkles(ctx, x, y, k); }
      else if (f.kind === "burst") { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; FX.star(ctx, x + Math.cos(a) * f.r * s * k, y + Math.sin(a) * f.r * s * k, 6 * (1 - k) + 2, ["#FFE066", "#F7A1B0", "#A7D98F"][i % 3]); } }
      else if (f.kind === "text" || f.kind === "coin") {
        ctx.font = `900 ${f.kind === "coin" ? 13 : 12}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#FFFFFF"; ctx.fillStyle = f.kind === "coin" ? "#C98A16" : "#E8453C";
        const ty = y - k * 22; ctx.strokeText(f.text, x, ty, bw); ctx.fillText(f.text, x, ty, bw);
      } else if (f.kind === "banner") {
        ctx.globalAlpha = Math.min(1, (1 - k) * 3); ctx.fillStyle = "rgba(255,253,246,.95)"; U.rr(ctx, bx + bw * 0.06, by + bh * 0.34, bw * 0.88, 50, 12); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#E8453C"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 12px 'M PLUS Rounded 1c', sans-serif";
        f.text.split("\n").forEach((line, i) => ctx.fillText(line, bx + bw / 2, by + bh * 0.34 + 16 + i * 18, bw * 0.84));
      }
      ctx.restore();
    }
    if (this.row) this.drawRow(ctx); else this.drawSide(ctx);
    // とどける くだもの（おきゃくさんの ほうへ とんでいく）
    for (const f of this.flyers) {
      const k = U.ease.inOut(Math.min(1, f.t / f.dur)), x = U.lerp(f.x0, f.x1, k), y = U.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 70;
      KorokoroArt.draw(ctx, f.tier, "happy", x, y, U.lerp(f.r, Math.min(f.r, 22), k), f.a + k * 6);
    }
    ctx.restore();
  }
  drawSide(ctx) {
    const c = this.col, font = "'M PLUS Rounded 1c', sans-serif", n = KOROKORO_TIERS.length;
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // つぎ
    ctx.fillStyle = "#FFF1D6"; U.rr(ctx, c.x, c.y, c.w, 58, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `800 11px ${font}`; ctx.fillText("つぎ", c.x + c.w / 2, c.y + 10);
    KorokoroArt.draw(ctx, this.next, "normal", c.x + c.w / 2, c.y + 35, Math.min(17, KOROKORO_TIERS[this.next].r * this.s));
    // ポイント
    ctx.fillStyle = "#FFFDF6"; U.rr(ctx, c.x, c.y + 64, c.w, 44, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8A7D6A"; ctx.font = `800 9px ${font}`; ctx.fillText("ポイント", c.x + c.w / 2, c.y + 76);
    ctx.fillStyle = INK; ctx.font = `900 14px ${font}`; ctx.fillText(U.fmt(this.points), c.x + c.w / 2, c.y + 95, c.w - 6);
    // じゅんばん（ちいさい → 大きい）。ちゅうもんの だんは きんいろの わ
    const y0 = c.y + 118, cell = (c.h - 118) / n, r = this.chainR(), cx = c.x + c.w / 2;
    ctx.strokeStyle = "#D9C4A2"; ctx.lineWidth = 2; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(cx, y0 + cell / 2); ctx.lineTo(cx, y0 + cell * (n - 0.5)); ctx.stroke(); ctx.setLineDash([]);
    for (const t of KOROKORO_TIERS) {
      const y = y0 + cell * (t.tier + 0.5), wanted = this.want.includes(t.tier);
      if (wanted) { ctx.fillStyle = "#FFE7A3"; ctx.strokeStyle = "#D19B2E"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, y, r + 4, 0, 7); ctx.fill(); ctx.stroke(); }
      KorokoroArt.draw(ctx, t.tier, "normal", cx, y, r);
    }
    ctx.restore();
  }
  // スコア モード: 箱の したに 大きく なる じゅんばん（ちいさい → 大きい。やじるしで つなぐ）
  drawRow(ctx) {
    const w = this.row, n = KOROKORO_TIERS.length, cell = w.w / n, r = this.chainR(), cy = w.y + w.h / 2;
    ctx.save(); ctx.fillStyle = "rgba(255,253,246,.92)"; ctx.strokeStyle = INK; ctx.lineWidth = 2; U.rr(ctx, w.x, w.y, w.w, w.h, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#C9A77F";
    for (let i = 1; i < n; i++) { const ax = w.x + cell * i; ctx.beginPath(); ctx.moveTo(ax - 2.5, cy - 4); ctx.lineTo(ax + 3, cy); ctx.lineTo(ax - 2.5, cy + 4); ctx.closePath(); ctx.fill(); }
    for (const t of KOROKORO_TIERS) KorokoroArt.draw(ctx, t.tier, "normal", w.x + cell * (t.tier + 0.5), cy, r);
    ctx.restore();
  }
  summary(st) { st.pts = Math.max(st.pts || 0, this.points); return `ころころ ポイント ${U.fmt(this.points)}（さいこう ${U.fmt(st.pts)}）`; }
}

class KorokoroTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.board = sc.board instanceof KorokoroBoard ? sc.board : (sc.board = new KorokoroBoard(sc));
    const O = KOROKORO_ORDERS[U.clamp(lv, 1, 5) - 1];
    this.want = U.pick(O.sets).map((tier) => ({ tier, done: false }));
    this.timeLimit = O.time; this.title = "これを つくって！";
    this.spill0 = this.board.spills; this.coin0 = this.board.coins; this.over = false;
    this.board.want = this.want.map((w) => w.tier);
  }
  get bonusTip() { return this.board.coins - this.coin0; }
  spills() { return this.board.spills - this.spill0; }
  layout(R) { this.R = R; this.board.layout(R); }
  tick(dt) {
    this.board.tick(dt, true);
    for (const w of this.want) if (!w.done && this.board.take(w.tier)) {
      w.done = true;
      if (this.sc.cust) this.sc.cust.emo = "happy";
      this.board.want = this.want.filter((x) => !x.done).map((x) => x.tier);
    }
    if (!this.over && this.want.every((w) => w.done)) { this.over = true; this.sc.finish(this.score()); }
  }
  score() { return Math.round(U.clamp(100 - this.sc.timePenalty() - this.spills() * 30, 0, 100)); }
  // 時間切れ: とどいた かず と、箱の いちばん 大きな 玉が ちゅうもんに どれだけ ちかいか
  timeout() {
    let p = 0;
    for (const w of this.want) {
      if (w.done) { p += 1; continue; }
      let best = 0; for (const b of this.board.world.bodies) best = Math.max(best, Math.pow(2, b.tier - w.tier));
      p += Math.min(0.8, best);
    }
    return Math.round(U.clamp(10 + 48 * (p / this.want.length) - this.spills() * 15, 0, 58));
  }
  downArea(p) { this.board.down(p); }
  move(p) { this.board.move(p); }
  up(p, canceled) { this.board.up(p, canceled); }
  key(k) { this.board.key(k); }
  draw(ctx) { this.board.render(ctx, this); }
  drawOrder(ctx, x, y, w, h) {
    const n = this.want.length, cell = Math.min(w / n, h), r = Math.max(10, Math.min(cell * 0.3, h * 0.24, 22)), font = "'M PLUS Rounded 1c', sans-serif";
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    this.want.forEach((it, i) => {
      const cx = x + (w * (i + 0.5)) / n, cy = y + r + 2;
      KorokoroArt.draw(ctx, it.tier, it.done ? "happy" : "normal", cx, cy, r, 0, it.done ? 0.5 : 1);
      ctx.fillStyle = INK; ctx.font = `800 11px ${font}`; ctx.fillText(KOROKORO_TIERS[it.tier].name, cx, cy + r + 10, w / n - 4);
      if (it.done) { ctx.strokeStyle = "#3E9E5A"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy); ctx.lineTo(cx - r * 0.1, cy + r * 0.4); ctx.lineTo(cx + r * 0.6, cy - r * 0.45); ctx.stroke(); }
    });
    // つくりかた: 1つ まえの もの ＋ おなじ もの
    const next = this.want.find((it) => !it.done);
    if (next && h >= r * 2 + 40) {
      const hy = y + h - 10, rr = Math.min(9, r * 0.5), cx = x + w / 2;
      KorokoroArt.draw(ctx, next.tier - 1, "normal", cx - 44, hy, rr); KorokoroArt.draw(ctx, next.tier - 1, "normal", cx - 14, hy, rr); KorokoroArt.draw(ctx, next.tier, "happy", cx + 36, hy, rr);
      ctx.fillStyle = INK; ctx.font = `900 12px ${font}`; ctx.fillText("+", cx - 29, hy); ctx.fillText("→", cx + 11, hy);
    }
    ctx.restore();
  }
}
MG_TASKS.korokoro = KorokoroTask;
SHOP_OWNERS.korokoro = { sp: "squirrel", col: "#E7A66A", col2: "#FFF1DD", name: "りすの コロン", look: { eye: "sparkle", cheek: "peach", tuft: "curl" }, outfit: { head: "beret", body: "apron" } };
// レジでは くだものと ジュースも かえる（もちもの・ねだんは スーパーと おなじ）
BUY_SHOPS.korokoro = { name: SHOPS.korokoro.name, keeper: SHOP_OWNERS.korokoro, keeperName: SHOP_OWNERS.korokoro.name, hello: ["いらっしゃい！ まんまるの くだもの、ゆっくり みていってね。"], kind: "bag",
  tabs: [["goods", "くだものと ジュース"]], items: () => ["apple", "juice", "candy"].map((k) => BAG_INDEX[k]) };
// かんばんの しるし: くだもの と かおの 玉が 3つ
SIGN_ICON.korokoro = (x, y) => `<circle cx="${x - 10}" cy="${y + 3}" r="7" fill="#F7A43A" ${OS(1.5)}/><circle cx="${x + 9}" cy="${y + 4}" r="7.5" fill="#E9525A" ${OS(1.5)}/><circle cx="${x}" cy="${y - 7}" r="6.5" fill="#FADA78" ${OS(1.5)}/><circle cx="${x - 2}" cy="${y - 7}" r="1" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 7}" r="1" fill="${INK}"/><path d="M${x + 9},${y - 3} v-4" stroke="#7A5634" stroke-width="1.5" stroke-linecap="round"/>`;

// お店の BGM: シューマン「たのしい のうふ」（こどもの ための アルバム 作品68 だい10ばん・1848年）。
// Mutopia Project の LilyPond 原本（Mutopia #659・Peters 版）から 写した。4/4・1トークン = 8分音符。
// 小節 1〜4（左手の メロディ）と 小節 9〜12（右手の メロディ）で 8小節。さいごの 8分は はじめに もどる アウフタクト（ド）。
// lead: メロディ（小節 1〜4 は 左手の メロディを 1オクターブ 上げた）・piano: 左手 そのまま・epiano: 右手の うらうちの 和音（小節 9〜12 は かんたんに した）・bass と ドラムは この ゲームの そえもの。
SONGS.shop_korokoro = {
  title: "たのしい のうふ", bpm: 104, key: "F", modern: true, groove: "classic", swing: 0,
  source: { composer: "R. Schumann（1810-1856）", work: "Album für die Jugend Op.68 No.10 Fröhlicher Landmann（1848）", score: "Mutopia #659（Peters 版に もとづく・清書 Philippe Hézaine）", license: "Public Domain" },
  tracks: [
    { instrument: "mallet", vol: 0.17, gate: 0.78, pan: 0.12, notes: "F4 . . A4 C5 . . F4 | A#4 D5 F5 D5 C5 . . A4 | A#4 G4 C4 A#4 A4 F4 C4 A4 | E4 . D4 . C4 . _ C4 | A#4 . . A4 G4 . . C4 | A#4 A4 G4 F4 G4 . . C4 | F4 . . A4 C5 . . F4 | A#4 D5 F5 D5 C5 . . C4" },
    { instrument: "piano", vol: 0.1, gate: 0.8, pan: -0.1, notes: "F3 . . A3 C4 . . F3 | A#3 D4 F4 D4 C4 . . A3 | A#3 G3 C3 A#3 A3 F3 C3 A3 | E3 . D3 . C3 . _ C3 | G3 . . F3 E3 . . C3 | G3 F3 E3 D3 E3 . . C3 | F3 . . A3 C4 . . F3 | A#3 D4 F4 D4 C4 . . C3" },
    { instrument: "epiano", vol: 0.06, gate: 0.55, pan: -0.24, notes: "_ C4+F4+A4 C4+F4+A4 _ _ F4+A4+C5 F4+A4+C5 _ | _ F4+A#4+D5 A#4+D5 _ _ F4+A4+C5 F4+A4+C5 _ | _ A#3+C4+E4 A#3+C4+E4 . _ C4+F4+A4 C4+F4+A4 . | _ C4+G4 _ F4+G4+B4 _ E4+G4+C5 E4+G4+C5 . | _ C4+E4 C4+E4 _ _ A#3+C4 A#3+C4 _ | _ C4 C4 B3 _ C4 C4 _ | _ A3+C4 A3+C4 _ _ F4+A4 F4+A4 _ | _ F4+A#4 _ F4+A#4 _ F4+A4 F4+A4 _" },
    { instrument: "bass", vol: 0.15, gate: 0.7, pan: 0, notes: "F2 . . . C3 . . . | A#2 . . . F2 . . . | C3 . . . F2 . . . | C3 . G2 . C3 . . _ | C3 . . . C3 . . . | C3 . G2 . C3 . . . | F2 . . . C3 . . . | A#2 . . . F2 . C3 ." },
    { drum: true, vol: 0.035, notes: "k _ h _ s _ h _" },
  ],
};
HOWTO.korokoro = [
  "ころころ フルーツへ ようこそ！\nきょうは おちもの パズルを てつだってね。",
  "ゆびで うごかして はなすと、はこに ころん！\nおなじ もの どうしが くっつくと、1つ おおきく なるよ。",
  "なしの つぎは がちゃん・わんこ・ごじの かお！\nおきゃくさんの ほしい ものが できたら とどくからね。",
  "うえの せんから あふれないように きを つけて！",
];
