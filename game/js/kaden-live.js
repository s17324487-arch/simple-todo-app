// UI-56: ネリカス電機の 家電を おうちで さわった ときの うごき（FurnLive）。絵は js/kaden-items.js（live の とき うごく ところを 絵から ぬく）。
// どの 家電も タップで うごいて、そばの 3人の だれかが ひとこと いう。おとは WebAudio で その場で つくる。SvgCache は つかわない。
// ・せんたくき: ドラムが まわる（にそうしきは ふたの なかの みずが うずを まく）・れいぞうこ: ドアが ひらいて なかが ひかる／こおり／がめん
// ・テレビ: チャンネル（ニュース・アニメ・うみ・ほしぞら・カラーバー）・そうじき: ロボットが へやを まわる
// ・レンジ: なかが ひかって おさらが まわり「チン！」・でんわ: ベルが なる・あかり: つく／きえる（よるは はじめから）
// ・すいはんき・トースター・コーヒー・せんぷうき・くうきせいじょうき・エアコン・パソコン・スピーカー・マッサージチェア
const KadenLive = (() => {
  const TAU = Math.PI * 2;
  const { mapper, say, tone, glow, lampOn, ink, FXS, lamp } = ShopRewardArt.liveKit;
  const ago = (st) => (st.t0 == null ? 1e9 : G.t - st.t0);
  const pick = (st, list) => list[(st.n || 0) % list.length];
  // 面の 上で 描く: (u, v) → 面の (s0 + u, t0 - v)（v は した むき）
  const onPlane = (ctx, P, f, s0, t0) => { const o = P(...f(s0, t0)), a = P(...f(s0 + 1, t0)), c = P(...f(s0, t0 - 1)); ctx.transform(a.x - o.x, a.y - o.y, c.x - o.x, c.y - o.y, o.x, o.y); };
  const FR = (y) => (s, t) => [s, y, t], SD = (x) => (s, t) => [x, s, t], TP = (z) => (s, t) => [s, t, z];
  const poly = (ctx, P, pts) => { ctx.beginPath(); pts.forEach((v, i) => { const q = P(...v); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); };
  const disc = (ctx, P, cx, cy, z, r, n = 28) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, q = P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.closePath(); };
  const fill = (ctx, c, w = 1.2) => { ctx.fillStyle = c; ctx.fill(); if (w) { ink(ctx, w); ctx.stroke(); } };
  const reg = (id, h, live = true) => { if (FURN_INDEX[id]) FurnLive.register(id, h, live); };

  // ======================= せんたくき =======================
  // ドラムの かいてん: 1.5 びょうで はやく → 4.5 びょうまで → 6 びょうで とまる
  const spin = (t) => { const v = 9; if (t >= 6) return v * 1.5 / 2 + v * 3 + v * 1.5 / 2; if (t < 1.5) return (v * t * t) / 3; if (t < 4.5) return v * 0.75 + v * (t - 1.5); const u = t - 4.5; return v * 0.75 + v * 3 + v * u - (v * u * u) / 3; };
  const CLOTHES = [["#F2A7B8", -6, -5, 7, 4.6, 0.4], ["#9FC7E8", 5, -2, 6.4, 4.2, -0.5], ["#F7D56A", -1, 6, 6.8, 4, 0.1], ["#B8DCA6", 7, 7, 4.6, 3.4, 0.9]];
  const drum = (y, cz, dark) => ({
    tap(sc, it, st) { if (ago(st) < 6) { say(sc, it, "ぐるぐる まわってる〜", "note"); return; } st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[147, 131], null, [147, 131], null, [147, 131], null, [196, 165]], 0.4, "triangle", 0.07); say(sc, it, pick(st, ["せんたく かいし！ ごうん ごうん", "あわあわで ぴかぴかに なあれ", "ふわふわに しあがるかな？"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), run = t < 6, a = run ? spin(t) : 0;
      ctx.save(); onPlane(ctx, P, FR(y), 0, cz); ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.clip();
      if (run) { ctx.fillStyle = dark ? "rgba(140,170,190,.5)" : "rgba(159,199,232,.55)"; ctx.beginPath(); ctx.moveTo(-17, 4 + Math.sin(t * 7) * 1.5); for (let x = -17; x <= 17; x += 3) ctx.lineTo(x, 4 + Math.sin(x * 0.4 + t * 9) * 1.6); ctx.lineTo(17, 17); ctx.lineTo(-17, 17); ctx.fill(); }
      ctx.rotate(a);
      for (const [c, x, yy, ax, by, rot] of CLOTHES) { ctx.save(); ctx.translate(x, yy); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, ax, by, 0, 0, TAU); fill(ctx, c, 1); ctx.restore(); }
      if (run) { ctx.fillStyle = "rgba(255,255,255,.8)"; for (let i = 0; i < 5; i++) { const q = (t * 1.3 + i * 0.37) % 1; ctx.beginPath(); ctx.arc(-10 + i * 5, 10 - q * 22, 1.4 + (i % 2), 0, TAU); ctx.fill(); } }
      ctx.restore();
      // ガラスの つや（ふくの うえ）
      ctx.save(); onPlane(ctx, P, FR(y + 0.05), 0, cz); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-3, -14); ctx.lineTo(-1, -12); ctx.lineTo(-8, -7); ctx.fill(); ctx.restore();
      if (run && t > 1.5 && t < 4.5) { const q = P(0, y, 86); ctx.save(); ctx.globalAlpha = 0.5; ink(ctx, 1.2 * P.s); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(q.x + d * 26 * P.s, q.y + 30 * P.s, 4 * P.s, d > 0 ? -1 : 2.1, d > 0 ? 1 : 4.2); ctx.stroke(); } ctx.restore(); }
    },
  });
  reg("ike_washer_0", drum(-5.8, 36, false));
  reg("ike_washer_2", drum(-5.76, 34, true));
  // にそうしき: ひだりの ふたの なかの みずが うずを まく
  reg("ike_washer_1", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[220, 196], [196, 175], [220, 196], [196, 175]], 0.3, "triangle", 0.06); say(sc, it, pick(st, ["ぐるぐる うずまき！", "みずが まわってる", "レトロで かわいい"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), run = t < 6, a = run ? spin(t) * 0.8 : 0;
      ctx.save(); onPlane(ctx, P, TP(68.8), -15, -23); ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = "#C9ECF3"; ctx.fillRect(-12, -10, 24, 20);
      ink(ctx, 1); ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20, ang = a + i * 2.1 + u * 4, rad = 1 + u * 8; const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad * 0.82; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.restore();
    },
  });

  // ======================= れいぞうこ =======================
  // レトロ: ドアが ひだりの ちょうつがいで ひらく（なかの たな・たべもの・あかり）
  const FOOD = [["milk", "#FFFFFF"], ["apple", "#E8453C"], ["jelly", "#F2A7B8"], ["egg", "#FFF6E0"], ["bottle", "#9FD3A0"], ["cake", "#F7E1B5"]];
  reg("ike_fridge_0", {
    tap(sc, it, st) { if (ago(st) < 3.6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 880, 1175], 0.08, "sine", 0.08); say(sc, it, pick(st, ["ひんやり〜！", "プリンが はいってる！", "あけっぱなしは だめだよ"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), k = t < 3.6 ? Math.sin(Math.min(1, t / 3.6) * Math.PI) : 0, th = Math.min(1, k * 1.25) * 1.35;
      const X0 = -26, X1 = 26, Y = -5.94, Z0 = 8, Z1 = 82;
      if (th > 0.02) {
        // なか: おくの かべ・よこの かべ・たな・たべもの・あかり
        poly(ctx, P, [[X0, -44, Z0], [X1, -44, Z0], [X1, -44, Z1], [X0, -44, Z1]]); fill(ctx, "#F4FBF8", 1);
        poly(ctx, P, [[X0, -44, Z0], [X0, Y, Z0], [X0, Y, Z1], [X0, -44, Z1]]); fill(ctx, "#E3F2EC", 1);
        poly(ctx, P, [[X0, -44, Z0], [X1, -44, Z0], [X1, Y, Z0], [X0, Y, Z0]]); fill(ctx, "#DDEFE8", 1);
        FOOD.forEach(([kind, c], i) => {
          const z = [30, 54][Math.floor(i / 3)], x = X0 + 10 + (i % 3) * 16, y = -18;
          if (i % 3 === 0) { poly(ctx, P, [[X0 + 2, -42, z], [X1 - 2, -42, z], [X1 - 2, Y - 1, z], [X0 + 2, Y - 1, z]]); fill(ctx, "rgba(220,240,250,.85)", 0.9); }
          const q = P(x, y, z); ctx.save(); ctx.translate(q.x, q.y); const s = P.s;
          ctx.fillStyle = c; ink(ctx, 1 * s);
          if (kind === "milk" || kind === "bottle") { ctx.beginPath(); ctx.rect(-3 * s, -12 * s, 6 * s, 12 * s); ctx.fill(); ctx.stroke(); }
          else if (kind === "apple") { ctx.beginPath(); ctx.arc(0, -4 * s, 4 * s, 0, TAU); ctx.fill(); ctx.stroke(); }
          else if (kind === "egg") { for (const d of [-3, 3]) { ctx.beginPath(); ctx.ellipse(d * s, -3 * s, 2.4 * s, 3 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); } }
          else { ctx.beginPath(); ctx.rect(-4 * s, -6 * s, 8 * s, 6 * s); ctx.fill(); ctx.stroke(); }
          ctx.restore();
        });
        const lq = P(0, -30, 78); ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, lq.x, lq.y, 40 * P.s, "255,250,220", 0.5 * Math.min(1, th)); ctx.restore();
        if (t > 0.3 && t < 3) FXS.puff(ctx, P, { t0: st.t0 + 0.3 }, 0, 8, 60, 2.6);
      }
      // ドア（ちょうつがいは ひだり。ひらくと 見える のは うらがわ）
      const fx = X0 + (X1 - X0) * Math.cos(th), fy = Y + (X1 - X0) * Math.sin(th), inner = th > Math.PI / 4;
      poly(ctx, P, [[X0, Y, Z0], [fx, fy, Z0], [fx, fy, Z1], [X0, Y, Z1]]); fill(ctx, inner ? "#F4FBF8" : "#C9EADB", 1.3);
      const at = (u, z) => [X0 + (fx - X0) * u, Y + (fy - Y) * u, z];
      if (!inner) {
        poly(ctx, P, [at(0.06, 40), at(0.12, 40), at(0.12, 66), at(0.06, 66)]); fill(ctx, "#EEF1F4", 1);
        const e = P(...at(0.77, 74)); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(Math.max(0.2, Math.cos(th)), 1); ctx.beginPath(); ctx.ellipse(0, 0, 5 * P.s, 3.2 * P.s, 0, 0, TAU); fill(ctx, "#F2A7B8", 1 * P.s); ctx.restore();
      } else for (const z of [24, 46, 66]) { poly(ctx, P, [at(0.1, z), at(0.9, z), at(0.9, z + 7), at(0.1, z + 7)]); fill(ctx, "#DDF0F8", 0.9); }
    },
  });
  // りょうびらき: こおりが からん
  reg("ike_fridge_1", {
    tap(sc, it, st) { if (ago(st) < 1.6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([2093, null, 1760, 2349], 0.09, "sine", 0.06); say(sc, it, pick(st, ["こおり から〜ん！", "つめたい おみず どうぞ", "ドアが 2まい ある！"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st);
      if (t > 1.6) return;
      ctx.save(); onPlane(ctx, P, FR(-5.8), -26, 90); ctx.beginPath(); ctx.rect(0, 0, 14, 20); ctx.clip();
      for (let i = 0; i < 3; i++) { const u = Math.min(1, Math.max(0, t * 1.8 - i * 0.25)), y = 4 + u * 13; ctx.save(); ctx.translate(4 + i * 3, y); ctx.rotate(u * 3 + i); ctx.fillStyle = "rgba(230,248,255,.95)"; ink(ctx, 0.8); ctx.beginPath(); ctx.rect(-1.8, -1.8, 3.6, 3.6); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      FXS.puff(ctx, P, st, -19, -6, 74, 1.6);
    },
  }, false);
  // スマート: ドアの がめん（てんき・なかみ・とけい）
  reg("ike_fridge_2", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1047, 1319], 0.08, "sine", 0.07); say(sc, it, ["きょうの おてんきが わかるよ", "なかに たまごと ミルク", "いま なんじ かな？"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), page = (st.n || 0) % 3, t = G.t;
      ctx.save(); onPlane(ctx, P, FR(-5.86), -22, 104); ctx.beginPath(); ctx.rect(0, 0, 26, 38); ctx.clip();
      ctx.fillStyle = "#1E2733"; ctx.fillRect(0, 0, 26, 38);
      ctx.fillStyle = "#9FE6F2"; ctx.font = "900 5px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (page === 0) { ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.arc(13, 14, 6 + Math.sin(t * 2) * 0.5, 0, TAU); ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(17 + Math.sin(t) * 2, 19, 6, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#9FE6F2"; ctx.fillText("はれ", 13, 31, 22); }
      else if (page === 1) { ["#FFFFFF", "#F2A7B8", "#B8DCA6", "#FFF6E0"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.rect(3 + (i % 2) * 11, 5 + Math.floor(i / 2) * 13, 9, 10); ctx.fill(); }); ctx.fillStyle = "#9FE6F2"; ctx.fillText("なかみ", 13, 33, 22); }
      else { const d = new Date(); ctx.font = "900 8px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`, 13, 17, 24); ctx.font = "900 4.5px 'M PLUS Rounded 1c', sans-serif"; ctx.fillText("とけい", 13, 29, 22); }
      ctx.restore();
    },
  });

  // ======================= テレビ =======================
  const tv = (y, s0, t0, w, h, crt, first) => ({
    // st.ch は タップした かず（FurnLive の はじめは 0）。テレビごとに はじめの ばんぐみが ちがう（first から）
    tap(sc, it, st) { const N = KadenItems.CH.length; st.ch = ((st.ch || 0) + 1) % N; st.t0 = G.t; tone([1319, 988], 0.05, "square", 0.04); say(sc, it, "「" + KadenItems.CH[(first + st.ch) % N] + "」を みよう！", "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), ch = (first + (st.ch || 0)) % KadenItems.CH.length;
      ctx.save(); onPlane(ctx, P, FR(y), s0, t0);
      if (crt) { ctx.beginPath(); U.rr(ctx, 0, 0, w, h, 8); ctx.clip(); }
      KadenItems.tvShow(ctx, ch, G.t, w, h); KadenItems.tvNoise(ctx, w, h, ago(st));
      if (crt) { ctx.fillStyle = "rgba(0,0,0,.08)"; for (let v = 0; v < h; v += 2) ctx.fillRect(0, v, w, 0.7); const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.moveTo(2, h - 2); ctx.lineTo(w * 0.3, h - 2); ctx.lineTo(2, h * 0.5); ctx.fill();
      ctx.restore();
    },
  });
  reg("ike_tv_0", tv(-7.8, -23, 63, 32, 36, true, 0));
  reg("ike_tv_1", tv(-22.85, -33, 74, 66, 44, false, 1));
  reg("ike_tv_2", tv(-33.85, -28, 70, 56, 34, false, 2));

  // ======================= そうじき =======================
  reg("ike_vacuum_0", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[110, 220], [220, 330]], 0.25, "sawtooth", 0.035); say(sc, it, pick(st, ["ぶおーん！ ごみを すいこむよ", "ころころ ついて くる", "ホースが ながーい"]), "note"); },
    draw(ctx, sc, it, r, st) { if (ago(st) < 2) FXS.puff(ctx, mapper(sc, it, r), st, 19, -8, 8, 2); },
  }, false);
  reg("ike_vacuum_1", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([[440, 660]], 0.1, "sawtooth", 0.03); say(sc, it, pick(st, ["かるくて つかいやすい！", "じゅうでん ばっちり", "すいすい おそうじ"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), n = Math.floor(G.t * 1.5) % 4;
      for (let i = 0; i < 3; i++) { const q = P(-5 + i * 4, -29.9, 18); ctx.beginPath(); ctx.arc(q.x, q.y, 1.3 * P.s, 0, TAU); ctx.fillStyle = i < n || ago(st) < 2 ? "#9ED08C" : "#5A616D"; ctx.fill(); }
    },
  });
  // ロボット: タップで 14 びょう へやを まわって もどる
  const robotAt = (t) => {
    if (t >= 14) return { x: 0, y: -18, a: -Math.PI / 2 };
    const u = Math.min(1, t / 1.2), w = Math.max(0, Math.min(1, (14 - t) / 1.4)), k = Math.min(u, w), tt = Math.max(0, t - 1.2);
    const x = Math.sin(tt * 0.9) * 30 * k, y = -18 + (Math.sin(tt * 1.3) * 14 + 18) * k;
    const dx = Math.cos(tt * 0.9) * 0.9 * 30, dy = Math.cos(tt * 1.3) * 1.3 * 14;
    return { x, y, a: Math.atan2(dy, dx) };
  };
  reg("ike_vacuum_2", {
    tap(sc, it, st) { if (ago(st) < 14) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([784, 988, 1175, 1568], 0.08, "sine", 0.07); say(sc, it, pick(st, ["おそうじ かいし！ いってらっしゃい", "ひとりで そうじ してる！", "かしこい ロボット"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), p = robotAt(t), cx = p.x, cy = p.y;
      disc(ctx, P, cx, cy, 0.1, 17); ctx.fillStyle = "rgba(31,29,27,.12)"; ctx.fill();
      // からだ（つつ）: 見る ひとの ほうの はんぶんの おび → うえの いた
      const A = -Math.PI / 4, B = (3 * Math.PI) / 4, band = [];
      for (let i = 0; i <= 16; i++) { const a = A + ((B - A) * i) / 16; band.push([cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 7]); }
      for (let i = 16; i >= 0; i--) { const a = A + ((B - A) * i) / 16; band.push([cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 0]); }
      poly(ctx, P, band); fill(ctx, "#B9C2CB", 1.4);
      disc(ctx, P, cx, cy, 7, 16); fill(ctx, "#E9EDF0", 1.4);
      disc(ctx, P, cx, cy, 7.2, 10); fill(ctx, "#D3DAE0", 1.1);
      const f = P(cx + Math.cos(p.a) * 12, cy + Math.sin(p.a) * 12, 7.4); ctx.beginPath(); ctx.arc(f.x, f.y, 2.2 * P.s, 0, TAU); fill(ctx, t < 14 ? "#9ED08C" : "#7FC6E0", 0.9);
      if (t < 14) { const b = P(cx + Math.cos(p.a + 0.8) * 15, cy + Math.sin(p.a + 0.8) * 15, 1); ink(ctx, 1 * P.s); for (let i = 0; i < 3; i++) { const a = G.t * 14 + (i * TAU) / 3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(a) * 4 * P.s, b.y + Math.sin(a) * 2 * P.s); ctx.stroke(); } }
    },
  });

  // ======================= でんしレンジ =======================
  const oven = (s0, t0, w, h, steam) => ({
    tap(sc, it, st) { if (ago(st) < 4.4) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([880], 0.1, "sine", 0.06); setTimeout(() => tone([1568, 2093], 0.12, "sine", 0.09), 3400); say(sc, it, pick(st, ["あっためて います…", "いい におい してきた", "なにが できるかな？"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), on = t < 3.4;
      ctx.save(); onPlane(ctx, P, FR(-9.85), s0, t0); ctx.beginPath(); U.rr(ctx, 0, 0, w, h, 3); ctx.clip();
      ctx.fillStyle = on ? "#F6D98A" : "#3F4954"; ctx.fillRect(0, 0, w, h);
      if (on) { const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w * 0.6); g.addColorStop(0, "rgba(255,250,210,.9)"); g.addColorStop(1, "rgba(255,220,140,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
      const a = on ? t * 2.4 : 0, px = w / 2, py = h * 0.68;
      ctx.fillStyle = on ? "#FFF6E0" : "#E7DCC9"; ink(ctx, 0.9); ctx.beginPath(); ctx.ellipse(px, py, w * 0.3, h * 0.12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      const cx = px + Math.cos(a) * w * 0.12, sz = Math.max(0.35, Math.abs(Math.sin(a)) * 0.5 + 0.5);
      ctx.fillStyle = "#9FC7E8"; ctx.beginPath(); ctx.rect(cx - 3 * sz, py - 7, 6 * sz, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.moveTo(2, h - 2); ctx.lineTo(w * 0.3, h - 2); ctx.lineTo(2, h * 0.5); ctx.fill();
      ctx.restore();
      if (t > 3.4 && t < 6) FXS.puff(ctx, P, { t0: st.t0 + 3.4 }, steam ? 28 : 0, -16, 82, 2.6);
    },
  });
  reg("ike_microwave_0", oven(-25, 71, 34, 22, false));
  reg("ike_microwave_1", oven(-26, 72, 38, 22, false));
  reg("ike_microwave_2", oven(-27, 73, 36, 24, true));

  // ======================= でんわ =======================
  const ringFx = (ctx, P, x, y, z, t) => { if (t > 2.4) return; const q = P(x, y, z), s = P.s; ctx.save(); ink(ctx, 1.3 * s); for (let i = 0; i < 2; i++) for (const d of [-1, 1]) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 12 + i); ctx.beginPath(); ctx.arc(q.x + d * (12 + i * 5) * s, q.y - 4 * s, (4 + i * 3) * s, d > 0 ? -0.9 : Math.PI - 0.9, d > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); } ctx.restore(); };
  const CALL = [["もしもし？ ままだよ〜", "rabbit"], ["もしもし、ぱぱです。げんき？", "bear"], ["わん！ わんこの でんわ ごっこ", "dog"]];
  const phone = (draw) => ({
    tap(sc, it, st) { if (ago(st) < 2.6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([1320, 1480, 1320, 1480, 1320, 1480, null, 1320, 1480, 1320, 1480], 0.06, "square", 0.03); setTimeout(() => say(sc, it, CALL[st.n % CALL.length][0], "heart"), 1300); },
    draw(ctx, sc, it, r, st) { draw(ctx, mapper(sc, it, r), ago(st), st); },
  });
  reg("ike_telephone_0", phone((ctx, P, t) => {
    // うけき（ゆれる）
    const ring = t < 2.4, jig = ring ? Math.sin(t * 40) * 1.2 : 0, z = 72 + (ring ? Math.abs(Math.sin(t * 20)) * 1.6 : 0), y = -28;
    const pts = [[-9 + jig, y, z], [-5 + jig, y, z + 3], [5 + jig, y, z + 3], [9 + jig, y, z]].map((v) => P(...v));
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.lineWidth = 6.6 * P.s; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); ctx.strokeStyle = "#E57A7A"; ctx.lineWidth = 4.6 * P.s; ctx.stroke(); ctx.restore();
    for (const x of [-10, 10]) { const q = P(x + jig, y, z - 1); ctx.beginPath(); ctx.arc(q.x, q.y, 4.4 * P.s, 0, TAU); fill(ctx, "#E57A7A", 1.1 * P.s); }
    ringFx(ctx, P, 0, -26, 84, t);
  }));
  reg("ike_telephone_1", phone((ctx, P, t) => {
    // こき（たてて ある。ベルの とき ランプが ちかちか）
    const up = t < 2.4 ? Math.abs(Math.sin(t * 18)) * 1.5 : 0;
    poly(ctx, P, [[9, -25, 64 + up], [14, -25, 64 + up], [14, -25, 84 + up], [9, -25, 84 + up]]); fill(ctx, "#F6F3EC", 1.1);
    poly(ctx, P, [[14, -29, 64 + up], [14, -25, 64 + up], [14, -25, 84 + up], [14, -29, 84 + up]]); fill(ctx, "#DAD4C8", 1.1);
    poly(ctx, P, [[9, -29, 84 + up], [14, -29, 84 + up], [14, -25, 84 + up], [9, -25, 84 + up]]); fill(ctx, "#FFFFFF", 1.1);
    poly(ctx, P, [[9.6, -24.95, 76 + up], [13.4, -24.95, 76 + up], [13.4, -24.95, 81 + up], [9.6, -24.95, 81 + up]]); fill(ctx, t < 2.4 && Math.floor(t * 6) % 2 ? "#9FE6F2" : "#3E5664", 0.6);
    ringFx(ctx, P, 0, -26, 86, t);
  }));
  reg("ike_telephone_2", phone((ctx, P, t, st) => {
    // がめんに かおが うつる（ベルの あとは でんわの あいての かお）
    ctx.save(); onPlane(ctx, P, FR(-31.9), -10, 78); ctx.beginPath(); ctx.rect(0, 0, 20, 15); ctx.clip();
    ctx.fillStyle = "#2C3848"; ctx.fillRect(0, 0, 20, 15);
    if (t < 2.4) { ctx.fillStyle = Math.floor(t * 5) % 2 ? "#9FE6F2" : "#2C3848"; ctx.font = "900 4px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillText("でんわ", 10, 9, 18); }
    else { ctx.fillStyle = "#BFE0F0"; ctx.fillRect(0, 0, 20, 15); KadenItems.trio(ctx, 10, 9, 4.2, G.t, (st.n || 0) % 3); }
    ctx.restore();
    ringFx(ctx, P, 0, -34, 88, t);
  }));

  // ======================= あかり =======================
  lamp("ike_lighting_0", { pts: [[0, -26, 72, 28], [0, -26, 64, 18]], rgb: "255,214,150", lines: ["ステンドグラスが きれい！", "あかり おやすみ"], big: 120 });
  lamp("ike_lighting_1", { pts: [[0, -26, 78, 30]], rgb: "255,236,190", lines: ["ふんわり あかるい", "あかりを けしたよ"], big: 130 });
  lamp("ike_lighting_2", { pts: [0.3, 1.35, 2.4, 3.45, 4.5, 5.55].map((a) => [Math.cos(a) * 14, -26 + Math.sin(a) * 9, 70, 12]).concat([[0, -26, 66, 30]]), rgb: "255,226,160", lines: ["シャンデリア、ごうか！", "あかり おやすみ"], big: 140 });

  // ======================= あたらしい 家電 =======================
  reg("ike_kaden_rice", {
    tap(sc, it, st) { if (ago(st) < 3) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([523, 659, 784, 1047, 784, 1047], 0.13, "sine", 0.07); say(sc, it, pick(st, ["ごはんが たけたよ！ ほかほか", "いい におい〜", "おにぎり つくろう"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), q = P(10, -30, 79.2); ctx.beginPath(); ctx.ellipse(q.x, q.y, 2 * P.s, 1.1 * P.s, 0, 0, TAU); fill(ctx, "#C9C2B5", 0.8 * P.s);
      if (ago(st) < 3) FXS.puff(ctx, P, st, 10, -30, 80, 3); else if (Math.floor(G.t / 6) % 2 === 0) FXS.puff(ctx, P, { t0: Math.floor(G.t / 6) * 6 }, 10, -30, 80, 3);
    },
  });
  // トースター: レバーが さがって 1.6 びょうで パンが ポン！
  reg("ike_kaden_toaster", {
    tap(sc, it, st) { if (ago(st) < 4.6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([330], 0.1, "square", 0.04); setTimeout(() => tone([1568, 1175], 0.07, "sine", 0.09), 1600); say(sc, it, pick(st, ["ポン！ やけたよ", "こんがり きつねいろ", "バター ぬろう"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), down = t < 1.6, popped = t >= 1.6 && t < 4.6, k = popped ? 1 - Math.pow(1 - Math.min(1, (t - 1.6) * 4), 3) : 0;
      if (!down) for (const x of [-12, 3]) {
        const z0 = 75, z1 = 77 + k * 11, col = popped ? "#D9954E" : "#E7B672";
        poly(ctx, P, [[x + 1, -21.5, z0], [x + 8, -21.5, z0], [x + 8, -21.5, z1], [x + 1, -21.5, z1]]); fill(ctx, col, 1);
        const c = P(x + 4.5, -21.5, z1); ctx.beginPath(); ctx.ellipse(c.x, c.y, 3.6 * P.s, 1.6 * P.s, 0, Math.PI, TAU); fill(ctx, col, 1);
      }
      const q = P(18.5, -22.5, down ? 58 : 66); ctx.beginPath(); ctx.rect(q.x - 2 * P.s, q.y - 2 * P.s, 4 * P.s, 4 * P.s); fill(ctx, "#5A616D", 1 * P.s);
      if (popped && t < 3) FXS.heart(ctx, P, { t0: st.t0 + 1.6 }, -4, -22, 92, 1.4);
    },
  });
  // コーヒーメーカー: ぽたぽた → ポットに たまる
  reg("ike_kaden_coffee", {
    tap(sc, it, st) { if (ago(st) < 4) return; const lv = st.lv ?? 0.45; st.base = lv >= 0.99 ? 0.1 : lv; st.tgt = Math.min(1, st.base + 0.55); st.t0 = G.t; st.n = (st.n || 0) + 1; tone([392, null, 440, null, 392], 0.2, "sine", 0.05); say(sc, it, pick(st, ["ぽた… ぽた… コーヒー", "いい かおり〜", "ままに もって いこう"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), dripping = t < 4;
      const lv = dripping ? st.base + (st.tgt - st.base) * (t / 4) : (st.lv = st.tgt ?? st.lv ?? 0.45);
      const zTop = 56.5 + 14 * lv, half = [];
      for (let i = 0; i <= 10; i++) { const a = -Math.PI / 4 + (i / 10) * Math.PI; half.push([2 + Math.cos(a) * 7.4, -22 + Math.sin(a) * 7.4]); }
      poly(ctx, P, [...half.map(([x, y]) => [x, y, 56.5]), ...half.slice().reverse().map(([x, y]) => [x, y, zTop])]); fill(ctx, "rgba(107,74,51,.9)", 0);
      disc(ctx, P, 2, -22, zTop, 7.2); fill(ctx, "#7A563D", 0.8);
      if (dripping) for (let i = 0; i < 2; i++) { const u = (t * 2 + i * 0.5) % 1, q = P(2, -22, 84 - u * (84 - zTop)); ctx.beginPath(); ctx.arc(q.x, q.y, 1.2 * P.s, 0, TAU); ctx.fillStyle = "#6B4A33"; ctx.fill(); }
      FXS.puff(ctx, P, { t0: Math.floor(G.t / 4) * 4 }, 22, -22, 60, 4);
    },
  });
  // せんぷうき: はねが まわる（タップで つく／きえる）・リボンが ゆれる
  reg("ike_kaden_fan", {
    isOn: (st) => st.on !== false,
    tap(sc, it, st) { st.on = st.on === false; st.t1 = G.t; st.n = (st.n || 0) + 1; tone(st.on ? [523, 784] : [784, 523], 0.08, "sine", 0.06); say(sc, it, st.on ? "そよそよ〜 すずしい！" : "せんぷうき おやすみ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), on = st.on !== false, since1 = st.t1 == null ? 9 : G.t - st.t1, sp = on ? Math.min(1, since1) * 14 : Math.max(0, 1 - since1) * 14;
      const dt = Math.min(0.1, Math.max(0, G.t - (st.lt ?? G.t))); st.lt = G.t; st.a = (st.a || 0) + sp * dt;
      ctx.save(); onPlane(ctx, P, FR(-12.6), 0, 74);
      for (let i = 0; i < 3; i++) { const a = st.a + (i / 3) * TAU, pp = (t, rr) => [Math.cos(a + t) * rr, -Math.sin(a + t) * rr]; ctx.beginPath(); [pp(0, 3), pp(-0.5, 12), pp(-0.35, 18), pp(0.1, 19), pp(0.45, 14), pp(0.35, 4)].forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = sp > 8 ? "rgba(159,199,232,.55)" : "#9FC7E8"; ctx.fill(); ink(ctx, 1); ctx.stroke(); }
      ctx.restore();
      const f = Math.sin(G.t * (on ? 14 : 2)) * (on ? 4 : 1);
      ctx.save(); onPlane(ctx, P, FR(-11.9), 18, 88); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(5, -3 + f * 0.3, 9, -4 + f); ctx.lineTo(9, 2 + f); ctx.quadraticCurveTo(5, 3, 0, 3); ctx.closePath(); fill(ctx, "#F2A7B8", 0.9); ctx.restore();
    },
  });
  // くうきせいじょうき: ひかりの わ（あお → みどり）・タップで パワフル（かぜの せん）
  reg("ike_kaden_purifier", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([659, 784, 988], 0.09, "sine", 0.06); say(sc, it, pick(st, ["くうきが きれいに なるよ", "パワフル モード！", "すーっと する"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), k = (Math.sin(G.t * 0.6) + 1) / 2, col = t < 5 ? "#9ED08C" : `rgb(159,${Math.round(211 + k * 13)},${Math.round(224 - k * 24)})`;
      ctx.save(); onPlane(ctx, P, FR(-5.85), 0, 58); ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); fill(ctx, col, 1.3); ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, TAU); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.restore();
      if (t < 5) { ctx.save(); ctx.strokeStyle = "rgba(159,199,232,.8)"; ctx.lineWidth = 1.6 * P.s; for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1, a = P(-8 + i * 8, -19, 82 + u * 30), b = P(-8 + i * 8 + Math.sin(u * 6) * 4, -19, 86 + u * 34); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 + 6 * P.s, (a.y + b.y) / 2, b.x, b.y); ctx.stroke(); } ctx.restore(); }
    },
  });
  // パソコン: がめん（デスクトップ・おえかき・ゲーム）
  reg("ike_kaden_pc", {
    tap(sc, it, st) { st.n = (st.n || 0) + 1; st.t0 = G.t; tone([988, 1319], 0.06, "square", 0.035); say(sc, it, ["デスクトップ", "おえかき アプリ！", "ゲーム しよう！"][st.n % 3] + "", "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), mode = (st.n || 0) % 3, t = G.t, W = 55, H = 29;
      ctx.save(); onPlane(ctx, P, FR(-39.9), -27.5, 111.5); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      if (mode === 0) {
        ctx.fillStyle = "#BFE0F0"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#6D86A8"; ctx.fillRect(0, H - 4, W, 4);
        ["#F2A7B8", "#F7D56A", "#9ED08C"].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(3, 3 + i * 7, 5, 5); });
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(14, 3, W * 0.55, H * 0.6); ctx.fillStyle = "#9FC7E8"; ctx.fillRect(14, 3, W * 0.55, 3);
        const cx = 30 + Math.sin(t) * 14, cy = 14 + Math.cos(t * 1.3) * 6; ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx + 3, cy + 3); ctx.closePath(); ctx.fill();
      } else if (mode === 1) {
        ctx.fillStyle = "#FFFDF6"; ctx.fillRect(0, 0, W, H); const k = ((t - (st.t0 || 0)) % 6) / 6;
        ctx.strokeStyle = "#E8453C"; ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i <= 60 * k; i++) { const a = (i / 60) * TAU, rr = 6 + Math.sin(a * 5) * 3; const x = W / 2 + Math.cos(a) * rr, y = H / 2 + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
        ["#E8453C", "#F7D56A", "#9ED08C", "#9FC7E8"].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(2, 2 + i * 6, 4, 4); });
      } else {
        ctx.fillStyle = "#26324A"; ctx.fillRect(0, 0, W, H); const bx = (Math.abs(((t * 22) % (2 * (W - 4))) - (W - 4))) + 2, by = (Math.abs(((t * 15) % (2 * (H - 8))) - (H - 8))) + 2;
        ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = "#9FE6F2"; ctx.fillRect(Math.min(W - 12, Math.max(0, bx - 6)), H - 4, 12, 2);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = ["#F2A7B8", "#9ED08C", "#F7D56A"][i % 3]; ctx.fillRect(3 + i * 8.5, 3, 7, 3); }
      }
      ctx.restore();
    },
  });
  // スピーカー: タップで おんがく（ウーファーが ふるえる・メーターの はりが ゆれる）
  const SONG = ["C5", "E5", "G5", "C6", "A5", "G5", "E5", "F5", "D5", "G5", "C5"];
  const HZ = { C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, C6: 1047 };
  reg("ike_kaden_speaker", {
    tap(sc, it, st) { if (ago(st) < 3.6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone(SONG.map((n) => HZ[n]), 0.3, "triangle", 0.09); say(sc, it, pick(st, ["いい おと〜！", "おどりたく なっちゃう", "ずんずん ひびく"]), "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), play = t < 3.6, beat = play ? Math.max(0, Math.sin(t * Math.PI * 2 / 0.3)) : 0;
      for (const x0 of [-54, 32]) {
        const cx = x0 + 11;
        ctx.save(); onPlane(ctx, P, FR(-7.9), cx, 30); const rr = 8.6 + beat * 0.8;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); fill(ctx, "#5A524A", 1.1); ctx.beginPath(); ctx.arc(0, 0, 4.4 + beat * 0.6, 0, TAU); fill(ctx, "#7D746A", 1); ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fillStyle = "#2E2924"; ctx.fill();
        ctx.restore();
      }
      ctx.save(); onPlane(ctx, P, FR(-11.9), -8, 24); const a = play ? -0.6 + beat * 1.1 : -0.7; ink(ctx, 1); ctx.strokeStyle = "#E8453C"; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(Math.sin(a) * 7, 9 - Math.cos(a) * 7); ctx.stroke(); ctx.restore();
      if (play) FXS.note(ctx, P, st, -43, -8, 100, 3.6);
    },
  });
  // マッサージチェア: もみだまが うえ・したへ・ぶるぶる
  reg("ike_kaden_massage", {
    tap(sc, it, st) { if (ago(st) < 6) return; st.t0 = G.t; st.n = (st.n || 0) + 1; tone([196, 220, 196, 220, 196], 0.25, "sine", 0.06); say(sc, it, pick(st, ["もみ もみ〜 きもちいい", "かたが ぽかぽか", "ねむく なっちゃう…"]), "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = ago(st), on = t < 6, z = on ? 40 + Math.sin(t * 1.6) * 22 : 40;
      // せもたれの 面（kaden-items.js と おなじ かたむき）
      const o = [-24, -57.9, 28], u = [1, 0, 0], v = [0, 0.22, 1], L = Math.hypot(...v), vn = v.map((c) => c / L);
      const at = (s, tt) => [o[0] + s * u[0] + tt * vn[0], o[1] + s * u[1] + tt * vn[1], o[2] + s * u[2] + tt * vn[2]];
      for (const s of [18, 30]) { const q = P(...at(s, z)); ctx.beginPath(); ctx.ellipse(q.x, q.y, 3.6 * P.s, 3 * P.s, 0, 0, TAU); fill(ctx, on ? "#B79A6E" : "#C9B48E", 0.9 * P.s); }
      if (on) { const q = P(0, -30, 60); ctx.save(); ink(ctx, 1.1 * P.s); ctx.globalAlpha = 0.6; for (const d of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const yy = q.y - 10 * P.s + i * 3 * P.s, xx = q.x + d * (44 + Math.sin(i * 1.7 + G.t * 20) * 2) * P.s; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } ctx.restore(); }
    },
  });
  // かべかけ エアコン（かべの 家具）: タップで つく。ふたが ひらいて つめたい かぜ
  const wallTf = (ctx, sc, it) => {
    const f = FURN_INDEX[it.id], p = sc.wallPoint(it, it.x - f.w / 2, it.y - f.h / 2), sign = it.wallSide === "left" ? -1 : 1, s = sc.s;
    ctx.transform(sign * HomeDesign.A * s, HomeDesign.B * s, 0, s, p.x, p.y);
    if (it.flip) { ctx.translate(f.w, 0); ctx.scale(-1, 1); }
  };
  reg("ike_kaden_aircon", {
    isOn: (st) => !!st.on,
    tap(sc, it, st) { st.on = !st.on; st.t0 = G.t; tone(st.on ? [784, 1047] : [1047, 784], 0.09, "sine", 0.07); say(sc, it, st.on ? "ひんやり〜 すずしい！" : "エアコン おやすみ", st.on ? "note" : "dots"); },
    draw(ctx, sc, it, r, st) {
      if (!sc.wallPoint) return;
      const k = Math.min(1, ago(st) * 2), open = st.on ? k : 1 - Math.min(1, k);
      ctx.save(); wallTf(ctx, sc, it);
      ctx.fillStyle = "#E9E5DC"; ink(ctx, 1.2); ctx.beginPath(); ctx.moveTo(8, 30); ctx.quadraticCurveTo(50, 34, 92, 30); ctx.lineTo(90, 34 + open * 6); ctx.quadraticCurveTo(50, 37 + open * 7, 10, 34 + open * 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = st.on ? "#9ED08C" : "#5A616D"; ctx.beginPath(); ctx.arc(74, 19, 1.4, 0, TAU); ctx.fill();
      if (st.on) { ctx.strokeStyle = "rgba(159,215,240,.85)"; ctx.lineWidth = 1.8; for (let i = 0; i < 4; i++) { const u = (G.t * 0.7 + i / 4) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.moveTo(18 + i * 20, 38 + u * 30); ctx.quadraticCurveTo(24 + i * 20, 44 + u * 30, 18 + i * 20 + Math.sin(u * 6 + i) * 6, 52 + u * 30); ctx.stroke(); } }
      ctx.restore();
    },
  });

  return { spin, robotAt };
})();
