// さわれる 家具（ROADMAP M9 の ART-03b）。タップで うごく ことと、ずっと うごく もの（とけいの はり・魚・火 など）。
// FurnModels の 絵は opts.live の とき うごく ぶぶんを ぬく。その ぶぶんを ここで 毎フレーム canvas に 描く。
// SvgCache は つかわない（キーが ふえない）。音は WebAudio で その場で 作る。じょうたいは へやに いる あいだだけ（セーブしない）。
const FurnLive = (() => {
  const TAU = Math.PI * 2;
  // 絵から うごく ぶぶんを ぬく 家具（とけいの はり・魚・火・ほし・きしゃ・もくば・テレビの 画面・画板の え）
  const LIVE = new Set(["clock", "fishbowl", "aquarium", "fireplace", "musicbox", "train", "rockinghorse", "tv", "desk"]);
  // あたらしく さわれる ように する 家具
  for (const id of ["window", "kotatsu", "tent", "desk"]) if (FURN_INDEX[id]) FURN_INDEX[id].interactive = true;
  const states = new Map();
  // へや・uid・家具の しゅるいで わける（もようがえで 同じ uid に べつの 家具が きても まざらない）
  const keyOf = (it) => (Save.d?.rooms?.active || "main") + ":" + it.uid + ":" + it.id;
  const S = (it) => { const k = keyOf(it); if (!states.has(k)) states.set(k, { id: it.id, t0: -99, ch: 0, on: null, n: 0 }); return states.get(k); };
  const since = (st) => G.t - st.t0;

  // ---- 位置 ----
  // 床の 家具: 家具の ざひょう (x, y, z) → 画面
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; P.d = dm.d; P.w = dm.w; return P;
  };
  // 2D の 絵の 家具（きんぎょばち・もくば）: 絵の ざひょう → 画面
  const artMap = (sc, it, r) => {
    const f = FURN_INDEX[it.id], P = mapper(sc, it, r), q = P(0, -P.d / 2, 0), s = P.s;
    const A = (ax, ay) => ({ x: q.x + (it.flip ? f.w / 2 - ax : ax - f.w / 2) * s, y: q.y + (ay - f.h) * s });
    A.s = s; A.q = q; A.f = f; return A;
  };
  // かべの 家具: 絵の ざひょうで 描けるように ctx を かえる
  const wallTf = (ctx, sc, it) => {
    const f = FURN_INDEX[it.id], p = sc.wallPoint(it, it.x - f.w / 2, it.y - f.h / 2), sign = it.wallSide === "left" ? -1 : 1, s = sc.s;
    ctx.transform(sign * HomeDesign.A * s, HomeDesign.B * s, 0, s, p.x, p.y);
    if (it.flip) { ctx.translate(f.w, 0); ctx.scale(-1, 1); }
  };
  // 面の 上の 四角（左上 o・右 u・下 v）へ 0..W × 0..H を はる
  const onQuad = (ctx, o, u, v, W, H) => ctx.transform((u.x - o.x) / W, (u.y - o.y) / W, (v.x - o.x) / H, (v.y - o.y) / H, o.x, o.y);

  // ---- 小さな 絵（canvas）----
  const ink = (ctx, w) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round"; };
  const glow = (ctx, x, y, r, col, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };
  const fish = (ctx, x, y, sz, col, dir, t) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * sz / 10, sz / 10);
    const wag = Math.sin(t * 9) * 0.25;
    ctx.fillStyle = shade(col, 0.25); ink(ctx, Math.min(1.4, 0.9 * 10 / sz));
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-11, -4 + wag * 4); ctx.lineTo(-10, 0); ctx.lineTo(-11, 4 + wag * 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(3.4, -1, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  };
  const bubble = (ctx, x, y, r) => { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); };
  const puff = (ctx, x, y, r, a) => { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = "#FFFFFF"; ink(ctx, 1.2); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); };
  const star = (ctx, x, y, r, sx = 1, col = "#F5D66B") => {
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.08, Math.abs(sx)), 1); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = sx < 0 ? shade(col, -0.15) : col; ctx.fill(); ink(ctx, 1.5); ctx.stroke(); ctx.restore();
  };
  // いろの ついた 音ぷ
  const NOTE_COLS = ["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2"];
  const note = (ctx, x, y, s, i, a) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ink(ctx, 1.4);
    ctx.fillStyle = NOTE_COLS[i % NOTE_COLS.length]; ctx.beginPath(); ctx.ellipse(-2.6, 5, 3.6, 2.8, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.6, 4.4); ctx.lineTo(0.6, -8); ctx.quadraticCurveTo(5, -6, 6.4, -2.4); ctx.stroke(); ctx.restore();
  };
  const flame = (ctx, x, y, w, h, core) => {
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w * 1.2, y - h * 0.45, x - w * 0.2, y - h * 0.6, x, y - h); ctx.bezierCurveTo(x + w * 0.2, y - h * 0.6, x + w * 1.2, y - h * 0.45, x + w, y); ctx.closePath();
    ctx.fillStyle = core; ctx.fill();
  };
  // 家具の ざひょうで 向きの ある 箱（きしゃの 車両）
  const isoBox = (ctx, P, cx, cy, ang, L, W, z0, H, cols) => {
    const c = Math.cos(ang), s = Math.sin(ang), K = (u, v, z) => P(cx + u * c - v * s, cy + u * s + v * c, z);
    const faces = [[L / 2, 0, 0], [-L / 2, 0, 1], [0, W / 2, 2], [0, -W / 2, 3]];
    ink(ctx, 1.1);
    for (const [u, v, i] of faces) {
      const nx = (u ? Math.sign(u) : 0) * c - (v ? Math.sign(v) : 0) * s, ny = (u ? Math.sign(u) : 0) * s + (v ? Math.sign(v) : 0) * c;
      if (nx + ny <= 0) continue;
      const a = u ? [[u, -W / 2], [u, W / 2]] : [[-L / 2, v], [L / 2, v]], q = [K(a[0][0], a[0][1], z0), K(a[1][0], a[1][1], z0), K(a[1][0], a[1][1], z0 + H), K(a[0][0], a[0][1], z0 + H)];
      ctx.fillStyle = i < 2 ? cols[1] : cols[0]; ctx.beginPath(); q.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const t = [K(-L / 2, -W / 2, z0 + H), K(L / 2, -W / 2, z0 + H), K(L / 2, W / 2, z0 + H), K(-L / 2, W / 2, z0 + H)];
    ctx.fillStyle = cols[2]; ctx.beginPath(); t.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.stroke();
  };

  // ---- 音 ----
  const canPlay = () => typeof Sound !== "undefined" && Sound.ctx && Save.d?.settings?.se;
  const melody = (notes, { type = "triangle", vol = 0.15, step = 0.3, dur = 0.24, r = 0.4, oct = 0 } = {}) => {
    if (canPlay()) notes.forEach((n, i) => { if (n) Sound.tone(Sound.seGain, { f: Sound.freq(n) * 2 ** oct, t: i * step, dur, type, vol, a: 0.005, r }); });
    return notes.length * step;
  };
  const TUNES = [
    { name: "きらきらぼし", notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", null, "F4", "F4", "E4", "E4", "D4", "D4", "C4"] },
    { name: "かえるの うた", notes: ["C4", "D4", "E4", "F4", "E4", "D4", "C4", null, "E4", "F4", "G4", "A4", "G4", "F4", "E4"] },
    { name: "メリーさんの ひつじ", notes: ["E4", "D4", "C4", "D4", "E4", "E4", "E4", null, "D4", "D4", "D4", null, "E4", "G4", "G4"] },
    { name: "ちょうちょう", notes: ["G4", "E4", "E4", null, "F4", "D4", "D4", null, "C4", "D4", "E4", "F4", "G4", "G4", "G4"] },
  ];
  const WHITE = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  // ---- 3人の ことば と しぐさ ----
  const nearest = (sc, it) => {
    const f = FURN_INDEX[it.id], a = f.kind === "wall" ? { x: it.wallSide === "left" ? 40 : it.x, y: it.wallSide === "left" ? ROOM.WALL + it.x : ROOM.WALL + 40 } : sc.anchor(it);
    return sc.chars.filter((c) => !c.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
  };
  const cheer = (sc, it, line, fx = "heart") => {
    const c = nearest(sc, it);
    if (!c) return;
    sc.react(c, "happy", fx);
    HomeLife.say(sc, c.id, line);
  };

  // ---- 家具ごと ----
  const H = {};
  H.lamp = {
    tap(sc, it, st) { st.on = !this.isOn(st); st.t0 = G.t; Sound.se(st.on ? "ding" : "tap"); cheer(sc, it, st.on ? "ぱっ！ あかるく なった" : "あかりを けしたよ", st.on ? "note" : "dots"); },
    isOn(st) { return st.on == null ? DayTint.isNight() : st.on; },
    draw(ctx, sc, it, r, st) {
      if (!this.isOn(st)) return;
      const P = mapper(sc, it, r), sh = P(0, -12, 70), fl = P(0, -12, 0), k = Math.min(1, since(st) * 3);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      glow(ctx, sh.x, sh.y, 34 * P.s, "rgba(255,214,120,A)", 0.34 * k);
      ctx.save(); ctx.translate(fl.x, fl.y); ctx.scale(1, 0.55); glow(ctx, 0, 0, 58 * P.s, "rgba(255,206,120,A)", 0.2 * k); ctx.restore();
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!this.isOn(st)) return; const P = mapper(sc, it, r), p = P(0, -12, 60); glow(ctx, p.x, p.y, 120 * P.s, "rgba(255,196,110,A)", 0.3); },
  };
  const CHANNELS = ["おてんきの ばんぐみ だよ", "どうぶつの ばんぐみ！", "おりょうりの ばんぐみ", "うみの なかの ばんぐみ"];
  H.tv = {
    tap(sc, it, st) {
      st.ch = (st.ch + 1) % (CHANNELS.length + 1); st.t0 = G.t;
      if (st.ch === 1) melody(["C5", "E5", "G5"], { type: "square", vol: 0.05, step: 0.08, dur: 0.06, r: 0.05 }); else Sound.se("tap");
      cheer(sc, it, st.ch ? CHANNELS[st.ch - 1] : "テレビ おしまい", st.ch ? "note" : "dots");
    },
    draw(ctx, sc, it, r, st) {
      if (!st.ch) return;
      const P = mapper(sc, it, r), o = P(-31, -16.8, 75), u = P(31, -16.8, 75), v = P(-31, -16.8, 41), W = 62, Hh = 34, t = G.t;
      ctx.save(); onQuad(ctx, o, u, v, W, Hh);
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, W, Hh, 5) : ctx.rect(0, 0, W, Hh); ctx.clip();
      const ch = st.ch, on = Math.min(1, since(st) * 4);
      if (ch === 1) {
        const kind = typeof Weather !== "undefined" ? Weather.kind() : "clear";
        ctx.fillStyle = "#BFE3F5"; ctx.fillRect(0, 0, W, Hh);
        ctx.fillStyle = "#9ED08C"; ctx.beginPath(); ctx.ellipse(18, 30, 22, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(48, 31, 18, 7, 0, 0, TAU); ctx.fill();
        if (kind === "clear" || kind === "wind") {
          ctx.save(); ctx.translate(31, 14); ctx.rotate(t * 0.8); ctx.strokeStyle = "#F2B34B"; ctx.lineWidth = 1.6;
          for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(11, 0); ctx.stroke(); }
          ctx.restore(); ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.arc(31, 14, 6.5, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = kind === "snow" ? "#FFFFFF" : "#E8EEF3"; for (const [x, y, rr] of [[26, 14, 6], [33, 11, 7], [39, 14, 5.5]]) { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
          if (kind === "rain" || kind === "snow") for (let i = 0; i < 6; i++) { const y = 20 + ((t * 18 + i * 5) % 12); ctx.fillStyle = kind === "snow" ? "#FFFFFF" : "#6FA9CF"; ctx.beginPath(); ctx.arc(24 + i * 3.2, y, 1, 0, TAU); ctx.fill(); }
        }
      } else if (ch === 2) {
        ctx.fillStyle = "#CFEAC0"; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = "#9ED08C"; ctx.fillRect(0, 25, W, 9);
        const x = 31 + Math.sin(t * 1.6) * 18, hop = Math.abs(Math.sin(t * 5)) * 7, dir = Math.cos(t * 1.6) >= 0 ? 1 : -1;
        ctx.save(); ctx.translate(x, 25 - hop); ctx.scale(dir, 1); ink(ctx, 1.1); ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.ellipse(-2, -9, 1.8, 5, -0.2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(2, -9.5, 1.8, 5, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -3, 5.5, 4.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2, -4, 0.8, 0, TAU); ctx.fill(); ctx.fillStyle = "#F2A7B8"; ctx.beginPath(); ctx.arc(4, -2.6, 0.9, 0, TAU); ctx.fill(); ctx.restore();
      } else if (ch === 3) {
        ctx.fillStyle = "#FBEFD9"; ctx.fillRect(0, 0, W, Hh); ctx.strokeStyle = "#F2D9B4"; ctx.lineWidth = 0.8; for (let x = 0; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hh); ctx.stroke(); }
        ctx.fillStyle = "#4A4550"; ctx.beginPath(); ctx.ellipse(31, 26, 13, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillRect(43, 24.5, 12, 3);
        const flip = (t * 1.2) % 1, up = Math.sin(flip * Math.PI) * 12;
        ctx.save(); ctx.translate(31, 24 - up); ctx.scale(1, Math.cos(flip * TAU)); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#F7C548"; ctx.beginPath(); ctx.arc(0, -0.4, 1.8, 0, TAU); ctx.fill(); ctx.restore();
        for (let i = 0; i < 3; i++) { const a = (t * 1.5 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - a)})`; ctx.beginPath(); ctx.arc(24 + i * 7, 20 - a * 14, 2 + a * 2, 0, TAU); ctx.fill(); }
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#8FD0E8"); g.addColorStop(1, "#3F87B5"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
        ctx.fillStyle = "#E9D5A8"; ctx.fillRect(0, 29, W, 5);
        for (const [i, col] of [[0, "#F29A5B"], [1, "#F7D56A"], [2, "#F2A7B8"]]) { const x = (t * (8 + i * 4) + i * 22) % (W + 20) - 10; fish(ctx, x, 9 + i * 7, 6, col, 1, t + i); }
        for (let i = 0; i < 4; i++) { const a = (t * 0.6 + i / 4) % 1; bubble(ctx, 50 + (i % 2) * 2, 30 - a * 28, 0.8 + a); }
      }
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - on)})`; ctx.fillRect(0, 0, W, Hh);
      ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!st.ch) return; const P = mapper(sc, it, r), p = P(0, -10, 56); glow(ctx, p.x, p.y, 70 * P.s, "rgba(150,200,255,A)", 0.22); },
  };
  H.piano = {
    tap(sc, it, st) { if (since(st) < st.len) return; st.song = TUNES[st.n % TUNES.length]; st.n++; st.t0 = G.t; st.len = melody(st.song.notes, { type: "triangle", vol: 0.16, step: 0.3, dur: 0.26, r: 0.5 }) + 0.3; cheer(sc, it, `「${st.song.name}」を ひいたよ♪`, "note"); },
    draw(ctx, sc, it, r, st) {
      if (!st.song || since(st) > st.len) return;
      const P = mapper(sc, it, r), i = Math.floor(since(st) / 0.3), n = st.song.notes[i], kw = 94 / 26;
      if (n) {
        const idx = WHITE[n[0]] + (Number(n.slice(-1)) - 4) * 7 + 5, x0 = -47 + idx * kw;
        const q = [P(x0, -13, 55.3), P(x0 + kw, -13, 55.3), P(x0 + kw, -2, 55.3), P(x0, -2, 55.3)];
        ctx.fillStyle = "rgba(255,214,110,.75)"; ctx.beginPath(); q.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill();
      }
      for (let j = 0; j < 3; j++) { const a = (since(st) * 0.8 + j / 3) % 1, p = P(-20 + j * 20, -30, 100 + a * 40); note(ctx, p.x + Math.sin(a * 6 + j) * 6 * P.s, p.y, P.s * 1.1, j + st.n, Math.min(1, (1 - a) * 1.6)); }
    },
  };
  H.clock = {
    cuckoo(sc, it, st, say) {
      st.t0 = G.t; st.bird = true;
      melody(["A5", "F5", null, "A5", "F5"], { type: "sine", vol: 0.14, step: 0.22, dur: 0.18, r: 0.12 });
      if (say) { const h = U.hourNow() % 12 || 12, m = new Date().getMinutes(); cheer(sc, it, `いまは ${h}じ ${m}ふん だよ`, "note"); }
    },
    tap(sc, it, st) { this.cuckoo(sc, it, st, true); },
    draw(ctx, sc, it, r, st) {
      const now = new Date(), h = U.hourNow() % 12, m = now.getMinutes(), sec = now.getSeconds();
      if (m === 0 && st.lastHour !== h && sec < 30) { st.lastHour = h; if (G.t > 3) this.cuckoo(sc, it, st, false); }
      ctx.save(); wallTf(ctx, sc, it);
      // ふりこ
      const sw = Math.sin(G.t * Math.PI) * 0.32;
      ctx.save(); ctx.translate(22, 49); ctx.rotate(sw); ctx.strokeStyle = "#B38F3F"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
      ctx.fillStyle = "#8FAE6E"; ink(ctx, 1.2); ctx.beginPath(); ctx.moveTo(0, 5.6); ctx.bezierCurveTo(-3.6, 7.4, -3.4, 12.2, 0, 13.2); ctx.bezierCurveTo(3.4, 12.2, 3.6, 7.4, 0, 5.6); ctx.fill(); ctx.stroke(); ctx.restore();
      // はり（ほんとうの 時こく）
      const ha = ((h + m / 60) / 12) * TAU, ma = (m / 60) * TAU;
      ink(ctx, 1.7); ctx.beginPath(); ctx.moveTo(22, 37); ctx.lineTo(22 + Math.sin(ha) * 4.6, 37 - Math.cos(ha) * 4.6); ctx.stroke();
      ink(ctx, 1.2); ctx.beginPath(); ctx.moveTo(22, 37); ctx.lineTo(22 + Math.sin(ma) * 6.8, 37 - Math.cos(ma) * 6.8); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(22, 37, 1.3, 0, TAU); ctx.fill();
      // はとが 出る
      const k = since(st);
      if (st.bird && k < 1.6) {
        const out = Math.sin(Math.min(1, k / 1.6) * Math.PI);
        ctx.save(); ctx.translate(22, 25 - out * 4); ctx.scale(0.4 + out * 0.6, 0.4 + out * 0.6);
        ctx.fillStyle = "#F7D56A"; ink(ctx, 1.2); ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 3.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#F29A5B"; ctx.beginPath(); ctx.moveTo(4, -0.6); ctx.lineTo(7.4, 0.4); ctx.lineTo(4, 1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(1.8, -1, 0.7, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    },
  };
  // きんぎょばち（2D の 絵。魚は ここで およぐ）
  H.fishbowl = {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("pop"); cheer(sc, it, "えさを あげたよ。ぱくぱく！", "heart"); },
    draw(ctx, sc, it, r, st) {
      const A = artMap(sc, it, r), t = G.t, k = since(st), s = A.s, feed = k < 3;
      let fx = 22 + Math.sin(t * 0.8) * 9, fy = 30 + Math.sin(t * 1.9) * 2.6;
      if (feed) { const g = Math.min(1, k / 0.8); fx = fx + (22 - fx) * g; fy = fy + (19 - fy) * g; }
      const dir = (Math.cos(t * 0.8) >= 0 ? 1 : -1) * (it.flip ? -1 : 1), p = A(fx, fy);
      if (feed) for (let i = 0; i < 5; i++) { const y = Math.min(24, 8 + k * 14 + i * 1.5), q = A(17 + i * 2.6, y); ctx.fillStyle = "#C98A52"; ctx.beginPath(); ctx.arc(q.x, q.y, 1.1 * s, 0, TAU); ctx.fill(); }
      fish(ctx, p.x, p.y, 8 * s, "#F29A1F", dir, t);
      for (let i = 0; i < 3; i++) { const a = (t * 0.5 + i / 3) % 1, q = A(28 + (i % 2) * 2, 36 - a * 22); bubble(ctx, q.x, q.y, (0.8 + a) * s); }
    },
  };
  H.aquarium = {
    tap(sc, it, st) { st.t0 = G.t; Sound.se("pop"); cheer(sc, it, "えさの じかん！ みんな あつまって きた", "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = G.t, k = since(st), feed = k < 4, s = P.s;
      const list = [];
      [["#F29A5B", 0.34, -26, 58, 0], ["#F7D56A", 0.27, -18, 66, 2], ["#9CC7E6", 0.42, -34, 50, 4], ["#F2A7B8", 0.3, -12, 62, 1]].forEach(([col, sp, y, z, ph]) => {
        let x = Math.sin(t * sp + ph) * 34, zz = z + Math.sin(t * 1.3 + ph) * 2.5;
        const dir = Math.cos(t * sp + ph) >= 0 ? 1 : -1;
        if (feed) { const g = Math.min(1, k / 1.2) * (1 - Math.max(0, k - 3)); x = x + (6 - x) * g; zz = zz + (70 - zz) * g; }
        list.push({ x, y, z: zz, col, dir });
      });
      if (feed) for (let i = 0; i < 7; i++) { const q = P(-4 + i * 2.2, -22 + (i % 3) * 4, Math.max(42, 74 - k * 9 - i)); ctx.fillStyle = "#C98A52"; ctx.beginPath(); ctx.arc(q.x, q.y, 1.1 * s, 0, TAU); ctx.fill(); }
      list.sort((a, b) => a.x + a.y - (b.x + b.y));
      for (const f of list) { const p = P(f.x, f.y, f.z), sx = P(f.x + 1, f.y, f.z).x - p.x; fish(ctx, p.x, p.y, 9.5 * s, f.col, (sx >= 0 ? 1 : -1) * f.dir, t); }
      for (let i = 0; i < 6; i++) { const a = (t * 0.45 + i / 6) % 1, q = P(-34 + (i % 2) * 1.5, -12, 44 + a * 30); bubble(ctx, q.x, q.y, (0.8 + a * 1.4) * s); }
    },
  };
  const TOYS = [["ボール", "ball"], ["あひる", "duck"], ["おほしさま", "star"], ["つみき", "block"]];
  H.toybox = {
    tap(sc, it, st) { if (since(st) < 1.4) return; st.toy = TOYS[st.n % TOYS.length]; st.n++; st.t0 = G.t; Sound.se("jump"); cheer(sc, it, `${st.toy[0]}が とびだした！`, "heart"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st);
      if (!st.toy || k > 1.4) return;
      const P = mapper(sc, it, r), u = k / 1.4, z = 26 + Math.sin(u * Math.PI) * 46, p = P(2, -18, z), s = P.s, rot = u * TAU * 1.5, kind = st.toy[1];
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot); ink(ctx, 1.4);
      if (kind === "ball") { ctx.fillStyle = "#E77E6E"; ctx.beginPath(); ctx.arc(0, 0, 8 * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(0, 0, 5.5 * s, 0.3, 2.6); ctx.stroke(); }
      else if (kind === "duck") { ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.ellipse(0, 2 * s, 7 * s, 5 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(3 * s, -4 * s, 4 * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#F29A5B"; ctx.beginPath(); ctx.moveTo(6.6 * s, -4.4 * s); ctx.lineTo(10 * s, -3.4 * s); ctx.lineTo(6.6 * s, -2.4 * s); ctx.fill(); }
      else if (kind === "star") { ctx.restore(); star(ctx, p.x, p.y, 8.5 * s, Math.cos(rot)); return; }
      else { ctx.fillStyle = "#9BCB85"; ctx.fillRect(-6 * s, -6 * s, 12 * s, 12 * s); ctx.strokeRect(-6 * s, -6 * s, 12 * s, 12 * s); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, 0, 2.4 * s, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
  };
  H.fireplace = {
    tap(sc, it, st) {
      st.t0 = G.t;
      if (canPlay()) for (let i = 0; i < 7; i++) Sound.noise(Sound.seGain, { t: i * 0.09 + Math.random() * 0.05, dur: 0.04, vol: 0.22, freq: 2400 + Math.random() * 1600, q: 1.4 });
      cheer(sc, it, "ぱちぱち… あったかいね", "heart");
    },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = G.t, s = P.s, base = P(0, -7.3, 12), k = since(st);
      ctx.save();
      glow(ctx, base.x, base.y - 6 * s, 30 * s, "rgba(255,170,80,A)", 0.35 + Math.sin(t * 7) * 0.05);
      for (const [dx, hh, ph] of [[-9, 13, 0], [8, 12, 1.7], [0, 19, 3.1], [-3, 10, 4.2], [4, 9, 5.3]]) {
        const p = P(dx, -7.3, 11), f = 0.8 + Math.sin(t * 8 + ph) * 0.14 + Math.sin(t * 13 + ph * 2) * 0.08, h = hh * f * s, w = (hh * 0.32 + 1) * s;
        flame(ctx, p.x, p.y, w, h, "#F79A3E"); flame(ctx, p.x, p.y, w * 0.6, h * 0.68, "#FFD36B"); flame(ctx, p.x, p.y, w * 0.28, h * 0.36, "#FFF6CF");
      }
      if (k < 1.6) for (let i = 0; i < 9; i++) { const a = (k / 1.6 + (i % 3) * 0.08), p = P(-12 + i * 3, -7.3, 14 + a * 36 + Math.sin(i * 7) * 4); ctx.fillStyle = `rgba(255,${190 + (i % 3) * 20},90,${1 - a})`; ctx.beginPath(); ctx.arc(p.x + Math.sin(k * 6 + i) * 3 * s, p.y, 1.3 * s, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
    light(ctx, sc, it, r) { const P = mapper(sc, it, r), p = P(0, 8, 14); glow(ctx, p.x, p.y, 110 * P.s, "rgba(255,160,80,A)", 0.32 + Math.sin(G.t * 7) * 0.03); },
  };
  H.musicbox = {
    tap(sc, it, st) { if (since(st) < st.len) return; st.t0 = G.t; st.len = melody(TUNES[0].notes, { type: "sine", vol: 0.12, step: 0.34, dur: 0.12, r: 0.9, oct: 1 }) + 0.6; cheer(sc, it, "オルゴールの おと きれい…", "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), k = since(st), play = k < st.len, ang = play ? k * 2.4 : 0, p = P(0, -24, 50), s = P.s;
      star(ctx, p.x, p.y - 15 * s, 15 * s, Math.cos(ang));
      if (Math.cos(ang) > 0.2) { ctx.fillStyle = INK; for (const dx of [-3.2, 3.2]) { ctx.beginPath(); ctx.arc(p.x + dx * s * Math.cos(ang), p.y - 15.4 * s, 1.2 * s, 0, TAU); ctx.fill(); } }
      if (play) for (let j = 0; j < 3; j++) { const a = (k * 0.7 + j / 3) % 1, q = P(-16 + j * 16, -24, 76 + a * 34); note(ctx, q.x + Math.sin(a * 5 + j) * 5 * s, q.y, s, j, Math.min(1, (1 - a) * 1.6)); }
    },
    init(st) { st.len = 0; },
  };
  // きしゃ: だえんの レールを 長さで はしる
  const track = (() => {
    const A = 42, B = 18, cy = -25, N = 240, len = [0];
    for (let i = 1; i <= N; i++) { const a0 = ((i - 1) / N) * TAU, a1 = (i / N) * TAU; len.push(len[i - 1] + Math.hypot(A * (Math.cos(a1) - Math.cos(a0)), B * (Math.sin(a1) - Math.sin(a0)))); }
    const total = len[N];
    const at = (d) => { d = ((d % total) + total) % total; let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= d) lo = m; else hi = m; } const th = ((lo + (d - len[lo]) / (len[hi] - len[lo])) / N) * TAU; return { x: A * Math.cos(th), y: cy + B * Math.sin(th), ang: Math.atan2(B * Math.cos(th), -A * Math.sin(th)) }; };
    return { total, at, rest: total * 0.25 };
  })();
  H.train = {
    tap(sc, it, st) {
      if (since(st) < 8) return; st.t0 = G.t;
      if (canPlay()) { Sound.tone(Sound.seGain, { f: 1175, f2: 1320, dur: 0.4, type: "sine", vol: 0.12 }); for (let i = 0; i < 26; i++) Sound.noise(Sound.seGain, { t: 0.45 + i * 0.28, dur: 0.08, vol: 0.12, freq: 900, q: 0.8 }); }
      cheer(sc, it, "しゅっぱつ しんこう！", "note");
    },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), k = since(st), run = k < 8, u = run ? Math.min(1, k / 8) : 1, ease = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      const head = track.rest + (run ? ease * track.total * 2 : 0), s = P.s;
      const cars = [[0, 17, 8, 8, ["#E77E6E", "#C9604F", "#F29C8E"], "loco"], [-17, 13, 8, 7, ["#9CC7E6", "#7EAAD0", "#BCDBF0"], "box"], [-32, 13, 8, 6, ["#F3D98A", "#D9BD64", "#F8E7AE"], "balls"]];
      const draw = cars.map(([off, L, W, Hh, cols, kind]) => ({ ...track.at(head + off), L, W, Hh, cols, kind })).sort((a, b) => a.x + a.y - (b.x + b.y));
      for (const c of draw) {
        isoBox(ctx, P, c.x, c.y, c.ang, c.L, c.W, 2, c.Hh, c.cols);
        if (c.kind === "loco") {
          const cx = c.x - Math.cos(c.ang) * 4, cy = c.y - Math.sin(c.ang) * 4;
          isoBox(ctx, P, cx, cy, c.ang, 6, c.W, 2 + c.Hh, 6, c.cols); isoBox(ctx, P, cx, cy, c.ang, 7, c.W + 1, 8 + c.Hh, 1.4, ["#4B4550", "#3A3540", "#5E5864"]);
          const fx = c.x + Math.cos(c.ang) * 4.5, fy = c.y + Math.sin(c.ang) * 4.5, top = P(fx, fy, 2 + c.Hh + 5);
          isoBox(ctx, P, fx, fy, c.ang, 3, 3, 2 + c.Hh, 5, ["#4B4550", "#3A3540", "#5E5864"]);
          for (let i = 0; i < 4; i++) { const a = ((run ? k * 1.6 : G.t * 0.35) + i / 4) % 1; puff(ctx, top.x + a * 6 * s, top.y - a * 16 * s, (1.6 + a * 3) * s, (run ? 0.9 : 0.5) * (1 - a)); }
        } else if (c.kind === "box") isoBox(ctx, P, c.x, c.y, c.ang, 7, 5, 2 + c.Hh, 5, ["#E9DCC0", "#CEBFA0", "#F7EEDB"]);
        else for (const [dx, col] of [[-2.5, "#9CC7E6"], [2.5, "#F2A7B8"]]) { const b = P(c.x + Math.cos(c.ang) * dx, c.y + Math.sin(c.ang) * dx, 2 + c.Hh + 2.4); ctx.fillStyle = col; ink(ctx, 1); ctx.beginPath(); ctx.arc(b.x, b.y, 2.8 * s, 0, TAU); ctx.fill(); ctx.stroke(); }
      }
    },
  };
  H.rockinghorse = {
    tap(sc, it, st) { st.t0 = G.t; if (canPlay()) for (let i = 0; i < 5; i++) Sound.tone(Sound.seGain, { f: 220, f2: 180, t: i * 0.6, dur: 0.18, type: "triangle", vol: 0.06 }); cheer(sc, it, "ゆら ゆら〜 たのしい！", "heart"); },
    // もくばの 絵（はんてんで 2まいだけ。SvgCache の キーは ふえない）
    sprite(it, ensure) {
      const f = FURN_INDEX.rockinghorse, key = "furnlive:rockinghorse:" + (it.flip ? 1 : 0), pw = Math.ceil((f.w + 24) * 2), ph = Math.ceil((f.h + 24) * 2);
      const fn = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 ${f.w + 24} ${f.h + 24}">${it.flip ? `<g transform="matrix(-1,0,0,1,${f.w},0)">` : "<g>"}${FURN_ART.rockinghorse({})}</g></svg>`;
      return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph);
    },
    draw(ctx, sc, it, r, st) {
      const A = artMap(sc, it, r), f = A.f, k = since(st), ang = k < 3.2 ? Math.sin(k * 5.5) * 0.2 * (1 - k / 3.2) : Math.sin(G.t * 0.8) * 0.012;
      const img = this.sprite(it, false);
      if (!img) return;
      const pivot = A(50, 80), s = A.s, tl = A(it.flip ? f.w + 12 : -12, -12);
      ctx.save(); ctx.translate(pivot.x, pivot.y); ctx.rotate(ang); ctx.translate(-pivot.x, -pivot.y);
      ctx.drawImage(img, it.flip ? tl.x : tl.x, tl.y, (f.w + 24) * s, (f.h + 24) * s); ctx.restore();
    },
  };
  H.window = {
    tap(sc, it, st) { st.on = !st.on; st.t0 = G.t; Sound.se("swish"); cheer(sc, it, st.on ? "カーテンを しめたよ" : "カーテンを あけたよ", "dots"); },
    draw(ctx, sc, it, r, st) {
      const k = Math.min(1, since(st) / 0.5), c = st.on ? k : 1 - k;
      if (c <= 0.01) return;
      ctx.save(); wallTf(ctx, sc, it);
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? 4 : 72, w = 34 * c, x1 = x0 - side * w;
        ctx.fillStyle = "#F8A5C2"; ink(ctx, 1.6); ctx.beginPath(); ctx.moveTo(x0, 6); ctx.lineTo(x1, 6);
        ctx.quadraticCurveTo(x1 + side * 2, 32, x1, 59); ctx.lineTo(x0, 59); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#EE8FB0"; ctx.lineWidth = 1.2; for (let i = 1; i < 4; i++) { const x = x0 - side * w * (i / 4); ctx.beginPath(); ctx.moveTo(x, 9); ctx.quadraticCurveTo(x + side, 32, x, 57); ctx.stroke(); }
      }
      ctx.restore();
    },
  };
  H.kitchen = {
    tap(sc, it, st) { if (since(st) < 4) return; st.t0 = G.t; Sound.se("bake"); melody([...Array(12).fill(null), "E6", "C6"], { type: "sine", vol: 0.12, step: 0.3, dur: 0.2, r: 0.3 }); cheer(sc, it, "ぐつぐつ… おりょうり ごっこ！", "note"); },
    draw(ctx, sc, it, r, st) {
      const k = since(st);
      if (k > 4) return;
      const P = mapper(sc, it, r), s = P.s, lid = P(-15, -24, 66.5 + Math.abs(Math.sin(k * 14)) * 1.6);
      ctx.fillStyle = "#F2A597"; ink(ctx, 1.2); ctx.beginPath(); ctx.ellipse(lid.x, lid.y, 9.8 * s, 5.4 * s, Math.sin(k * 14) * 0.08, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(lid.x, lid.y - 2 * s, 1.8 * s, 0, TAU); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = (k * 0.9 + i / 4) % 1; puff(ctx, lid.x + Math.sin(a * 5 + i) * 4 * s, lid.y - (6 + a * 26) * s, (2 + a * 3.5) * s, 0.85 * (1 - a)); }
      const egg = P(-37, -24, 60); for (let i = 0; i < 3; i++) { const a = (k * 2 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${1 - a})`; ctx.beginPath(); ctx.arc(egg.x - 6 * s + i * 6 * s, egg.y - a * 8 * s, 1.2 * s, 0, TAU); ctx.fill(); }
    },
  };
  H.kotatsu = {
    tap(sc, it, st) { st.on = !st.on; st.t0 = G.t; Sound.se(st.on ? "ding" : "tap"); cheer(sc, it, st.on ? "ぬくぬく〜" : "こたつ おやすみ", st.on ? "heart" : "dots"); },
    draw(ctx, sc, it, r, st) {
      if (!st.on) return;
      const P = mapper(sc, it, r), p = P(0, -2, 3);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(p.x, p.y); ctx.scale(1, 0.4); glow(ctx, 0, 0, 60 * P.s, "rgba(255,110,70,A)", 0.3 + Math.sin(G.t * 2) * 0.04); ctx.restore();
    },
    light(ctx, sc, it, r, st) { if (!st.on) return; const P = mapper(sc, it, r), p = P(0, 0, 4); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.45); glow(ctx, 0, 0, 90 * P.s, "rgba(255,120,70,A)", 0.3); ctx.restore(); },
  };
  H.tent = {
    tap(sc, it, st) { st.on = !this.isOn(st); st.t0 = G.t; melody(st.on ? ["E6", "G6", "C7"] : ["C7", "G6"], { type: "sine", vol: 0.08, step: 0.07, dur: 0.06, r: 0.2 }); cheer(sc, it, st.on ? "ひみつきちの あかり！" : "あかりを けしたよ", st.on ? "note" : "dots"); },
    isOn(st) { return st.on == null ? true : st.on; },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), s = P.s, on = this.isOn(st);
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7, p = P(44.3, -33 + u * 16, 40 - Math.sin(u * Math.PI) * 10), tw = on ? 0.55 + Math.sin(G.t * 3 + i * 1.7) * 0.35 : 0;
        ctx.fillStyle = on ? "#FFE39A" : "#8C7A6E"; ctx.beginPath(); ctx.arc(p.x, p.y, 1.4 * s, 0, TAU); ctx.fill();
        if (on) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, p.x, p.y, 6 * s, "rgba(255,220,120,A)", tw); ctx.restore(); }
      }
    },
    light(ctx, sc, it, r, st) { if (!this.isOn(st)) return; const P = mapper(sc, it, r), p = P(44, -25, 20); glow(ctx, p.x, p.y, 60 * P.s, "rgba(255,210,120,A)", 0.22); },
  };
  // おえかき デスク: タップで 画板の え が かわる
  const PICS = [
    (g) => { g.fillStyle = "#F7D56A"; g.beginPath(); g.arc(7, 6, 3.4, 0, TAU); g.fill(); g.fillStyle = "#E77E6E"; g.beginPath(); g.moveTo(15, 15); g.lineTo(22, 9); g.lineTo(29, 15); g.fill(); g.fillStyle = "#F2B8C6"; g.fillRect(16.5, 15, 11, 6); g.strokeStyle = "#8DB87A"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, 21); g.quadraticCurveTo(12, 18, 35, 21); g.stroke(); },
    (g) => { for (const [x, c, e] of [[8, "#FFFFFF", "#1F1D1B"], [18, "#F7D56A", "#F29A5B"], [28, "#AEB6BD", "#FFFFFF"]]) { g.fillStyle = c; g.strokeStyle = INK; g.lineWidth = 0.8; g.beginPath(); g.arc(x, 11, 4.4, 0, TAU); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x - 1.5, 10.4, 0.6, 0, TAU); g.arc(x + 1.5, 10.4, 0.6, 0, TAU); g.fill(); g.fillStyle = e; g.beginPath(); g.arc(x, 13, 0.9, 0, TAU); g.fill(); } g.strokeStyle = "#EE8FA6"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(4, 19); g.quadraticCurveTo(18, 23, 32, 19); g.stroke(); },
    (g) => { g.strokeStyle = "#6F9A5E"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(12, 21); g.lineTo(12, 11); g.stroke(); g.fillStyle = "#F2A7B8"; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; g.beginPath(); g.arc(12 + Math.cos(a) * 3, 8 + Math.sin(a) * 3, 2.2, 0, TAU); g.fill(); } g.fillStyle = "#F7D56A"; g.beginPath(); g.arc(12, 8, 1.8, 0, TAU); g.fill(); g.fillStyle = "#C9B6E0"; g.beginPath(); g.ellipse(25, 8, 3, 2, 0.5, 0, TAU); g.ellipse(29, 8, 3, 2, -0.5, 0, TAU); g.fill(); },
    (g) => { ["#E77E6E", "#F7D56A", "#8DB87A", "#6FA9CF", "#C9B6E0"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.arc(18, 22, 15 - i * 2, Math.PI, TAU); g.stroke(); }); g.fillStyle = "#FFFFFF"; g.strokeStyle = INK; g.lineWidth = 0.6; for (const [x, y, r] of [[6, 20, 2.6], [9, 19, 3], [30, 20, 2.6], [27, 19, 3]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); } },
  ];
  H.desk = {
    tap(sc, it, st) { st.n = (st.n + 1) % PICS.length; st.t0 = G.t; Sound.se("swish"); cheer(sc, it, "おえかき できた！", "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), vv = [0, -0.6, 0.8], L = (a, b) => P(-46 + 3 + a, -12 + (3 + b) * vv[1], 63.5 + (3 + b) * vv[2]);
      const o = L(0, 22), u = L(36, 22), v = L(0, 0), wipe = Math.min(1, since(st) / 0.8);
      ctx.save(); onQuad(ctx, o, u, v, 36, 22); ctx.beginPath(); ctx.rect(0, 0, 36 * wipe, 22); ctx.clip(); PICS[st.n](ctx); ctx.restore();
    },
  };

  return {
    LIVE,
    // scene-house の furnCanvas から: うごく ぶぶんを 絵から ぬく
    opts(it, o) { if (LIVE.has(it.id)) o.live = true; if (it.id === "rockinghorse") H.rockinghorse.sprite(it, true); return o; },
    tap(sc, it) { const h = H[it.id]; if (!h) return false; h.tap(sc, it, S(it)); return true; },
    draw(ctx, sc, it, r) { const h = H[it.id]; if (!h) return; const st = S(it); if (h.init && st.len == null) h.init(st); h.draw(ctx, sc, it, r, st); },
    // よるの くらさの 上に、あかりの ひかりを 足す
    lights(ctx, sc) {
      const night = DayTint.isNight() || (sc.dark || 0) > 0.05;
      if (!night) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const it of Room.of(sc).items) { const h = H[it.id]; if (h && h.light) h.light(ctx, sc, it, sc.itemRect(it), S(it)); }
      ctx.restore();
    },
    // ほかの ファイルから さわれる 家具を 足す（音楽プレイヤー など）。live は 絵から うごく ぶぶんを ぬく とき
    register(id, handler, live = false) { H[id] = handler; if (live) LIVE.add(id); if (FURN_INDEX[id]) FURN_INDEX[id].interactive = true; },
    state(it) { const st = S(it), h = H[it.id]; return { id: it.id, uid: it.uid, t: since(st), on: h && h.isOn ? h.isOn(st) : !!st.on, ch: st.ch, n: st.n, song: st.song ? st.song.name : null, toy: st.toy ? st.toy[1] : null, bird: !!st.bird && since(st) < 1.6, live: LIVE.has(it.id) }; },
    reset() { states.clear(); },
    // おじゃま（js/online-visit.js）の おわりに よその おへやの かぐの じょうたいを わすれる（よその かぐの uid は "v" で はじまる）
    forget() { for (const k of [...states.keys()]) if (k.split(":")[1].startsWith("v")) states.delete(k); },
  };
})();

// きんぎょばち: 魚は FurnLive が およがせる（live の ときは 絵から ぬく）
(() => {
  const base = FURN_ART.fishbowl;
  FURN_ART.fishbowl = (o = {}) => (o.live ? base(o).replace(/<path d="M16,22 C20,17[^>]*\/>/, "") : base(o));
})();
