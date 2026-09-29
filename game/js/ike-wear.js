// サンシャインいけぶ の 服の 店（はねーず・あにまるず・ごしごし）の 9ちゃく と、店に かざる マネキン。
// 服は chara.js の WEAR と おなじ かさね（behind・sleeve・torso・top）で 描く。そで・うしろ すがた・よこむきも ある。
// 形は 3人の からだの 目安（PROFILE の a.torso・a.neck・うで）から きめるので、わんこ・がちゃん・ごじ・マネキンの どれにも あう。
// ID・ねだん・ステータスは これまでと おなじ（セーブは そのまま）。名前は ひらがなに した。
const IkeWear = {
  LIST: {
    hane: [
      { name: "はなびら ワンピース", col: ["#F4BCD2"], desc: "はなびらが かさなった すそが ふんわり ゆれる ワンピース。" },
      { name: "リボンの カーディガン", col: ["#EBB4C6"], desc: "むねの おおきな リボンが かわいい ニットの はおりもの。" },
      { name: "ほしくず ケープ", col: ["#A9B6E6"], desc: "ほしが きらきら ちらばった ケープと ワンピースの セット。" },
    ],
    animal: [
      { name: "パンダ ポンチョ", col: ["#FFFFFF"], desc: "うしろの フードは パンダの かお。ポケットにも パンダが いるよ。" },
      { name: "こぐま パーカー", col: ["#C69A70"], desc: "くまの みみの フードつき。おなかの ポケットは ふかふか。" },
      { name: "うさぎ ケープ", col: ["#F2C4D6"], desc: "ながい みみの フードと もこもこの ふち。しっぽも ついてるよ。" },
    ],
    gothic: [
      { name: "ぶとうかいの ドレス", col: ["#6C5A80"], desc: "レースの フリルと ばらの かざり。よるの パーティーに きていこう。" },
      { name: "つきよの マント", col: ["#4E5585"], desc: "みかづきの かざりと ほしの もよう。うしろには おおきな おつきさま。" },
      { name: "くろばらの ジャケット", col: ["#5B5270"], desc: "むねの フリルと きんの ボタン。うしろは つばめの しっぽ みたい。" },
    ],
  },
  // WEAR[id] から よぶ
  wear(shop, v, ctx) { const fn = this.draw[shop + v]; return fn ? fn.call(this, ctx, this.frame(ctx)) : {}; },

  // ---- からだの 目安 ----
  // 見える 上の はし（わんこ・がちゃんは あたまで かくれる。ごじ・マネキンは 胴の 上）
  chin(ctx) { const p = ctx.p; return p.chin ?? (p === PROFILE.wanko ? 138 : p === PROFILE.gachan ? 153 : ctx.a.torso.top); },
  frame(ctx) {
    const T = ctx.a.torso, top = this.chin(ctx), span = T.bottom - top;
    return { T, cx: T.cx, top, bot: T.bottom, span, hw: T.w / 2, v: (k) => top + span * k, sx: ctx.view === "side" ? ctx.dx * 0.35 : 0, back: ctx.view === "back", side: ctx.view === "side", big: T.w > 90 };
  },

  // ---- 小さな 絵の ぶひん ----
  p(d, fill, w = 4.5, extra = "") { return `<path d="${d}" fill="${fill}" ${stroke(w)} ${extra}/>`; },
  line(d, col, w = 2.2, extra = "") { return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`; },
  dot(x, y, r, fill, w = 0) { return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${fill}"${w ? " " + stroke(w) : ""}/>`; },
  ell(x, y, rx, ry, fill, w = 0, rot = 0) { return `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rx)}" ry="${f2(ry)}"${rot ? ` transform="rotate(${f2(rot)} ${f2(x)} ${f2(y)})"` : ""} fill="${fill}"${w ? " " + stroke(w) : ""}/>`; },
  star(x, y, r, fill, w = 0) { return `<path d="${starPath(x, y, r, r * 0.46)}" fill="${fill}"${w ? " " + stroke(w) : ""}/>`; },
  // きらっ（十字の ひかり）
  twinkle(x, y, r, col) { return this.line(`M${f2(x - r)},${f2(y)} H${f2(x + r)} M${f2(x)},${f2(y - r)} V${f2(y + r)}`, col, Math.max(1.4, r * 0.35)); },
  moon(x, y, r, fill, w = 2.4) { return this.p(`M${f2(x + r * 0.2)},${f2(y - r)} A${f2(r)},${f2(r)} 0 1 0 ${f2(x + r * 0.2)},${f2(y + r)} A${f2(r * 0.78)},${f2(r * 0.78)} 0 1 1 ${f2(x + r * 0.2)},${f2(y - r)} Z`, fill, w); },
  // リボン（むすびめ x,y・大きさ s）
  bow(x, y, s, fill, deep, w = 3) {
    const L = (k) => `M${f2(x)},${f2(y)} C${f2(x - 6 * s * k)},${f2(y - 9 * s)} ${f2(x - 17 * s * k)},${f2(y - 10 * s)} ${f2(x - 17 * s * k)},${f2(y - 1 * s)} C${f2(x - 17 * s * k)},${f2(y + 7 * s)} ${f2(x - 7 * s * k)},${f2(y + 6 * s)} ${f2(x)},${f2(y)} Z`;
    const tail = (k) => `M${f2(x - 2 * s * k)},${f2(y + 2 * s)} L${f2(x - 9 * s * k)},${f2(y + 15 * s)} L${f2(x - 5 * s * k)},${f2(y + 13 * s)} L${f2(x - 3 * s * k)},${f2(y + 16 * s)} L${f2(x + 1.5 * s * k)},${f2(y + 3 * s)} Z`;
    return this.p(tail(1), deep, w) + this.p(tail(-1), deep, w) + this.p(L(1), fill, w) + this.p(L(-1), fill, w) +
      this.line(`M${f2(x - 5 * s)},${f2(y - 3 * s)} Q${f2(x - 11 * s)},${f2(y - 4 * s)} ${f2(x - 13 * s)},${f2(y - 1 * s)} M${f2(x + 5 * s)},${f2(y - 3 * s)} Q${f2(x + 11 * s)},${f2(y - 4 * s)} ${f2(x + 13 * s)},${f2(y - 1 * s)}`, deep, 1.6 * s) +
      this.ell(x, y, 3.6 * s, 4.2 * s, deep, w);
  },
  rose(x, y, r, fill, deep, leaf) {
    return this.p(`M${f2(x - r * 0.4)},${f2(y + r * 0.5)} Q${f2(x - r * 2)},${f2(y + r * 0.9)} ${f2(x - r * 1.9)},${f2(y + r * 0.1)} Q${f2(x - r * 1.1)},${f2(y - r * 0.1)} ${f2(x - r * 0.4)},${f2(y + r * 0.5)} Z`, leaf, 2) +
      this.p(`M${f2(x + r * 0.4)},${f2(y + r * 0.5)} Q${f2(x + r * 2)},${f2(y + r * 0.9)} ${f2(x + r * 1.9)},${f2(y + r * 0.1)} Q${f2(x + r * 1.1)},${f2(y - r * 0.1)} ${f2(x + r * 0.4)},${f2(y + r * 0.5)} Z`, leaf, 2) +
      this.dot(x, y, r, fill, 2.4) + this.line(`M${f2(x - r * 0.1)},${f2(y - r * 0.05)} a${f2(r * 0.3)},${f2(r * 0.3)} 0 1 1 ${f2(r * 0.35)},${f2(r * 0.3)} a${f2(r * 0.55)},${f2(r * 0.55)} 0 1 1 ${f2(-r * 0.85)},${f2(-r * 0.45)}`, deep, Math.max(1.4, r * 0.28));
  },
  paw(x, y, s, fill) { return this.ell(x, y + 1.6 * s, 3.2 * s, 2.6 * s, fill) + [[-3.3, -2.2], [0, -3.8], [3.3, -2.2]].map(([a, b]) => this.dot(x + a * s, y + b * s, 1.3 * s, fill)).join(""); },
  // ふちの もこもこ（x0→x1 の 線に そって 白い まる）
  fluff(pts, r, fill = "#FFFFFF") { return pts.map(([x, y]) => this.dot(x, y, r, fill, 2.2)).join(""); },
  // すその 点の ならび（y は まんなかが すこし さがる）
  hemPts(cx, w, y, n, sag = 4) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([cx - w + 2 * w * t, y + Math.sin(Math.PI * t) * sag]); } return out; },
  // ひろがる スカート（こし y0・はば w0 → すそ y1・はば w1）。scal: すその なみの 数（0 は なめらか）
  skirtD(cx, y0, w0, y1, w1, scal = 0, dip = 5) {
    const side = (k) => `C${f2(cx + k * (w0 + (w1 - w0) * 0.25))},${f2(y0 + (y1 - y0) * 0.45)} ${f2(cx + k * w1)},${f2(y1 - (y1 - y0) * 0.3)} ${f2(cx + k * w1)},${f2(y1 - 1)}`;
    let d = `M${f2(cx - w0)},${f2(y0)} ${side(-1)}`;
    if (scal) { const pts = this.hemPts(cx, w1, y1 - 1, scal, 4); for (let i = 1; i < pts.length; i++) { const [xa, ya] = pts[i - 1], [xb, yb] = pts[i]; d += ` Q${f2((xa + xb) / 2)},${f2(Math.max(ya, yb) + dip * 2)} ${f2(xb)},${f2(yb)}`; } }
    else d += ` C${f2(cx - w1 * 0.45)},${f2(y1 + 7)} ${f2(cx + w1 * 0.45)},${f2(y1 + 7)} ${f2(cx + w1)},${f2(y1 - 1)}`;
    return d + ` C${f2(cx + w1)},${f2(y1 - (y1 - y0) * 0.3)} ${f2(cx + w0 + (w1 - w0) * 0.25)},${f2(y0 + (y1 - y0) * 0.45)} ${f2(cx + w0)},${f2(y0)} Z`;
  },
  // 胴の 中を y0〜y1 で ぬる（torsoClip の 中で つかう）
  band(y0, y1, fill) { return `<rect x="-10" y="${f2(y0)}" width="230" height="${f2(y1 - y0)}" fill="${fill}"/>`; },
  hemLine(y) { return `<path d="M-10,${f2(y)} H220" ${stroke()}/>`; },
  // ニットの ゴム（たての すじ）
  rib(y0, y1, fill, col, gap = 5) { let s = this.band(y0, y1, fill); for (let x = 2; x < 210; x += gap) s += this.line(`M${x},${f2(y0 + 1.5)} V${f2(y1 - 1.5)}`, col, 1.3); return s + `<path d="M-10,${f2(y0)} H220" ${stroke(2.6)}/>`; },

  // そで: len は かたから 手の さきまでの わりあい、puff は かたの ふくらみ、cuff は そでぐちの いろ
  sleeves(ctx, fill, o = {}) {
    const len = o.len ?? 0.5, uid = ctx.uid;
    return ctx.p.arms.map((ar, i) => {
      const id = `iws${i}${uid}`;
      if (ar.path) {
        // ごじ: よこに のびた うで。からだ がわ（near）から そとへ
        // そでは からだの ふち（near）から そとへ。からだの 中は 胴に かくれる
        const left = i === 0, T = ctx.a.torso, near = T.cx + (left ? -1 : 1) * (T.w / 2 + 2), far = left ? 14 : 190, end = near + (far - near) * len, x0 = Math.min(near, end) - (left ? 0 : 20), x1 = Math.max(near, end) + (left ? 20 : 0);
        let s = `<clipPath id="${id}"><rect x="${f2(x0)}" y="80" width="${f2(x1 - x0 + 2)}" height="80"/></clipPath><g clip-path="url(#${id})"><path d="${ar.path}" fill="${fill}" ${stroke()}/>`;
        if (o.puff) s += this.ell(near + (left ? -4 : 4), 118, 12, 22, fill, 4.5) + this.line(`M${f2(near + (left ? -9 : 9))},104 Q${f2(near + (left ? -13 : 13))},118 ${f2(near + (left ? -9 : 9))},132`, shade(fill, -0.18), 2);
        if (o.stripe) s += o.stripe(near, end, left);
        s += "</g>";
        if (o.cuff) s += `<clipPath id="${id}c"><path d="${ar.path}"/></clipPath><g clip-path="url(#${id}c)"><rect x="${f2(end - 4)}" y="80" width="8" height="80" fill="${o.cuff}" ${stroke(3)}/></g>`;
        if (o.frill) s += this.fluff([[end, 102], [end - (left ? 2 : -2), 110], [end - (left ? 3 : -3), 118], [end - (left ? 2 : -2), 126], [end, 134]], 3.6, o.frill);
        return s;
      }
      // だ円の うで（上が かた、下が 手）
      const { cx, cy, rx, ry, rot } = ar, top = cy - ry - 8, end = cy - ry + 2 * ry * len, half = rx * Math.sqrt(Math.max(0, 1 - ((end - cy) / ry) ** 2));
      let s = `<g transform="rotate(${rot} ${cx} ${cy})"><clipPath id="${id}"><rect x="${cx - rx - 10}" y="${f2(top)}" width="${rx * 2 + 20}" height="${f2(end - top)}"/></clipPath><g clip-path="url(#${id})">`;
      s += o.puff ? this.ell(cx, cy - ry * 0.28, rx + o.puff, ry * 0.78, fill, 4.5) : this.ell(cx, cy, rx + 0.5, ry, fill, 4.5);
      if (o.puff) s += this.line(`M${f2(cx - rx * 0.4)},${f2(cy - ry * 0.85)} Q${f2(cx - rx * 0.7)},${f2(cy - ry * 0.3)} ${f2(cx - rx * 0.35)},${f2(end - 1)}`, shade(fill, -0.18), 1.8);
      if (o.stripe) s += o.stripe(cx, cy, rx, ry, end);
      s += "</g>";
      if (o.cuff) s += this.ell(cx, end, half + 1.8, 3.3, o.cuff, 3);
      if (o.frill) s += this.fluff([[cx - half, end + 1.5], [cx, end + 3], [cx + half, end + 1.5]], 2.8, o.frill);
      return s + "</g>";
    }).join("");
  },
  // マントや ポンチョから のぞく 手（からだの いろ）
  paws(ctx, k = 0.8) {
    return ctx.p.arms.map((ar) => {
      if (ar.path) return "";
      const { cx, cy, rx, ry, rot } = ar, y = cy - ry + 2 * ry * k;
      return `<g transform="rotate(${rot} ${cx} ${cy})"><path d="M${f2(cx - rx * 0.78)},${f2(y)} C${f2(cx - rx * 0.8)},${f2(cy + ry + 1)} ${f2(cx + rx * 0.8)},${f2(cy + ry + 1)} ${f2(cx + rx * 0.78)},${f2(y)} Z" fill="${ctx.p.fill}" ${stroke()}/></g>`;
    }).join("");
  },
};

// ---- 9ちゃく ----
IkeWear.draw = {
  // はなびら ワンピース: はなびらの カラー・ぱふっとした そで・こしの リボンと はな・2だんの はなびらスカート
  hane0(ctx, F) {
    const P = "#F4BCD2", PL = "#FADDE8", PD = "#E39AB8", C = "#FFF4E2", G = "#9FCB8F", Y = "#F7D77E";
    const { cx, sx } = F, waist = F.v(F.big ? 0.36 : 0.4), y1 = F.bot - (F.big ? 6 : 3), w0 = F.hw + 1, w1 = F.hw + F.hw * (F.big ? 0.42 : 0.5);
    let body = garment(ctx, waist + 3, P) + `<path d="M${f2(cx + F.hw * 0.42)},${f2(F.T.top)} C${f2(cx + F.hw * 0.62)},${f2(waist - 8)} ${f2(cx + F.hw * 0.66)},${f2(waist)} ${f2(cx + F.hw * 0.7)},${f2(waist + 3)} H220 V${f2(F.T.top)} Z" fill="${PD}" opacity=".35"/>`;
    if (F.back) body += [0.25, 0.5, 0.75].map((k) => this.dot(cx, F.top + (waist - F.top) * k + 2, 2.3, C, 1.6)).join("");
    else {
      // はなびらの えり（あごの した）
      const cy = F.top + (F.big ? 8 : 2), r = Math.min(8, (waist - F.top) * 0.42) * (F.big ? 1.5 : 1);
      body += this.ell(cx + sx - r * 0.95, cy, r * 1.25, r * 0.85, C, 3, -18) + this.ell(cx + sx + r * 0.95, cy, r * 1.25, r * 0.85, C, 3, 18) + this.dot(cx + sx, cy + r * 0.6, Math.max(2, r * 0.28), Y, 1.6);
    }
    const sk = this.skirtD(cx, waist, w0, y1 + 3, w1 + 3, 4, 6), front = this.skirtD(cx, waist, w0, y1 - 1, w1, 3, 8);
    const pts = this.hemPts(cx, w1, y1 - 1, 3, 4);
    let skirt = this.p(sk, PL) + this.p(front, P);
    // はなびらの さかいめ と すじ
    for (let i = 1; i < 3; i++) { const [x, y] = pts[i]; skirt += this.line(`M${f2(cx + (x - cx) * 0.25)},${f2(waist + 2)} Q${f2(cx + (x - cx) * 0.8)},${f2(waist + (y - waist) * 0.55)} ${f2(x)},${f2(y)}`, INK, 3); }
    for (let i = 0; i < 3; i++) { const xm = (pts[i][0] + pts[i + 1][0]) / 2; skirt += this.line(`M${f2(cx + (xm - cx) * 0.3)},${f2(waist + 6)} Q${f2(cx + (xm - cx) * 0.75)},${f2(waist + (y1 - waist) * 0.5)} ${f2(xm)},${f2(y1 + 2)}`, PL, 2.4); }
    skirt += this.line(`M${f2(cx - w1 + 4)},${f2(y1 - 6)} Q${f2(cx)},${f2(y1 + 2)} ${f2(cx + w1 - 4)},${f2(y1 - 6)}`, "#FFFFFF", 1.6, `stroke-dasharray="1 6" opacity=".8"`);
    // こしの リボン
    let sash = `<path d="M${f2(cx - w0 - 1)},${f2(waist - 3)} H${f2(cx + w0 + 1)} V${f2(waist + 3.5)} H${f2(cx - w0 - 1)} Z" fill="${C}" ${stroke(3)}/>`;
    sash += F.back ? this.bow(cx, waist, F.big ? 1.3 : 0.8, C, "#F3D2B8") : flowerSvg(cx - w0 * 0.45 + sx, waist, F.big ? 5.5 : 3.6, "#FFFFFF", Y, 2) + this.ell(cx - w0 * 0.45 + sx + (F.big ? 9 : 6), waist + (F.big ? 4 : 3), F.big ? 4.5 : 3, F.big ? 2.4 : 1.7, G, 1.6, 30);
    return { sleeve: this.sleeves(ctx, PL, { len: 0.42, puff: 3, cuff: C }), torso: torsoClip(ctx, body) + skirt + sash };
  },
  // リボンの カーディガン: ブラウスの うえに ニット（Vの あき・なわあみ・ゴムの すそ・パールの ボタン・ポケット）＋ むねの リボン
  hane1(ctx, F) {
    const K = "#EBB4C6", KD = "#D594AD", KL = "#F6D3DF", C = "#FFF7EA", R = "#EF87A4", RD = "#CF6284";
    const { cx, sx } = F, hem = F.v(F.big ? 0.84 : 0.88), vY = F.v(F.big ? 0.42 : 0.5), vw = F.hw * (F.big ? 0.4 : 0.66), ex = cx + sx;
    let body = garment(ctx, 220, C) + this.band(hem, 230, C) + this.line(`M${f2(ex - 3)},${f2(hem + 2)} V${f2(hem + 9)}`, "#E6D8C3", 1.4);
    if (F.back) {
      body += this.band(F.T.top - 20, hem, K);
      // うしろの なわあみ（まんなか）
      for (let y = F.top + 4; y < hem - 8; y += 9) body += this.line(`M${f2(cx - 5)},${f2(y)} q5,4 10,0 M${f2(cx - 5)},${f2(y + 4.5)} q5,4 10,0`, KD, 1.6);
      body += this.line(`M${f2(cx - 9)},${f2(F.top)} V${f2(hem - 8)} M${f2(cx + 9)},${f2(F.top)} V${f2(hem - 8)}`, KD, 1.6);
    } else {
      // まえの ふたつの みごろ（Vの あき）
      const panel = (k) => `M${f2(ex + k * vw)},${f2(F.T.top - 20)} L${f2(ex + k * vw)},${f2(F.T.top)} Q${f2(ex + k * vw * 0.4)},${f2(vY - 6)} ${f2(ex + k * 1.5)},${f2(vY)} L${f2(ex + k * 1.5)},${f2(hem)} L${f2(cx + k * 130)},${f2(hem)} L${f2(cx + k * 130)},${f2(F.T.top - 20)} Z`;
      body += `<path d="${panel(-1)}" fill="${K}"/><path d="${panel(1)}" fill="${K}"/>`;
      for (const k of [-1, 1]) {
        const x = ex + k * F.hw * 0.52;
        for (let y = vY - 2; y < hem - 8; y += 8) body += this.line(`M${f2(x - 3)},${f2(y)} l3,3 l3,-3`, KD, 1.4);
        const px0 = ex + k * F.hw * 0.2, px1 = ex + k * F.hw * 0.68, py0 = F.v(0.64), py1 = py0 + F.span * 0.17;
        body += this.p(`M${f2(px0)},${f2(py0)} L${f2(px1)},${f2(py0)} L${f2(px1)},${f2(py0 + (py1 - py0) * 0.45)} Q${f2(px1)},${f2(py1)} ${f2((px0 + px1) / 2)},${f2(py1)} Q${f2(px0)},${f2(py1)} ${f2(px0)},${f2(py0 + (py1 - py0) * 0.45)} Z`, KL, 2.2) + this.line(`M${f2(px0)},${f2(py0 + 2.2)} L${f2(px1)},${f2(py0 + 2.2)}`, KD, 1.4);
      }
      body += this.line(`M${f2(ex + vw)},${f2(F.T.top)} Q${f2(ex + vw * 0.4)},${f2(vY - 6)} ${f2(ex + 1.5)},${f2(vY)} V${f2(hem)} M${f2(ex - vw)},${f2(F.T.top)} Q${f2(ex - vw * 0.4)},${f2(vY - 6)} ${f2(ex - 1.5)},${f2(vY)} V${f2(hem)}`, INK, 3);
      for (let i = 0; i < 3; i++) body += this.dot(ex + 5.5, vY + 5 + (hem - vY - 12) * (i / 2), F.big ? 3.4 : 2.4, "#FFFFFF", 1.8);
      // ブラウスの えり（Vの 上）
      const cy = F.top + (F.big ? 6 : 2), cr = F.big ? 8 : 5;
      body += this.ell(ex - cr * 0.95, cy, cr * 1.15, cr * 0.72, "#FFFFFF", 2.4, 28) + this.ell(ex + cr * 0.95, cy, cr * 1.15, cr * 0.72, "#FFFFFF", 2.4, -28);
    }
    body += this.rib(hem - (F.big ? 10 : 7), hem, KD, K) + this.hemLine(hem);
    const top = F.back ? "" : neckWrap(ctx, (s) => this.bow(0, 8, 1.7, R, RD, s * 0.7));
    return { sleeve: this.sleeves(ctx, K, { len: 0.82, cuff: KD }), torso: torsoClip(ctx, body), top };
  },
  // ほしくず ケープ: ほしの もようの ワンピース ＋ かたを おおう ケープ（もこもこの ふち・ほしの ブローチ）
  hane2(ctx, F) {
    const D = "#CDD3F1", DD = "#8E9BD3", K = "#A9B6E6", KD = "#8A98D6", Y = "#F6D77A", YL = "#FFF6CF";
    const { cx, sx } = F, waist = F.v(0.42), y1 = F.bot - (F.big ? 6 : 3), w0 = F.hw + 1, w1 = F.hw * (F.big ? 1.32 : 1.4);
    let body = garment(ctx, waist + 3, D);
    let skirt = this.p(this.skirtD(cx, waist, w0, y1, w1), D);
    const hemBand = this.hemPts(cx, w1, y1 - 1, 8, 5);
    skirt += this.line("M" + hemBand.map(([x, y]) => f2(x) + "," + f2(y - 4)).join(" L"), DD, 4);
    for (const [x, y] of [[-0.55, 0.3], [0.1, 0.55], [0.6, 0.25], [-0.2, 0.78], [0.72, 0.75]]) skirt += this.star(cx + x * w1 * 0.85, waist + (y1 - waist) * y, F.big ? 4 : 2.6, Y);
    // ケープ（うでを おおう）
    const cy1 = F.v(F.big ? 0.5 : 0.56), cw1 = F.hw + (F.big ? 22 : 13), ctop = F.T.top - (F.big ? 2 : 6), cw0 = F.hw * 0.78;
    const cape = `M${f2(cx - cw0)},${f2(ctop)} C${f2(cx - cw0 - 10)},${f2(ctop + (cy1 - ctop) * 0.3)} ${f2(cx - cw1)},${f2(cy1 - (cy1 - ctop) * 0.3)} ${f2(cx - cw1)},${f2(cy1)} Q${f2(cx)},${f2(cy1 + (F.big ? 16 : 10))} ${f2(cx + cw1)},${f2(cy1)} C${f2(cx + cw1)},${f2(cy1 - (cy1 - ctop) * 0.3)} ${f2(cx + cw0 + 10)},${f2(ctop + (cy1 - ctop) * 0.3)} ${f2(cx + cw0)},${f2(ctop)} Z`;
    let capeS = this.p(cape, K) + `<path d="M${f2(cx + cw1 * 0.35)},${f2(ctop)} C${f2(cx + cw1 * 0.75)},${f2(ctop + 10)} ${f2(cx + cw1 * 0.95)},${f2(cy1 - 12)} ${f2(cx + cw1 - 1)},${f2(cy1 - 1)} Q${f2(cx + cw1 * 0.7)},${f2(cy1 + 4)} ${f2(cx + cw1 * 0.5)},${f2(cy1 + 6)} Z" fill="${KD}" opacity=".45"/>`;
    if (!F.back) capeS += this.line(`M${f2(cx + sx)},${f2(ctop + 4)} V${f2(cy1 + (F.big ? 12 : 7))}`, KD, 2.4);
    const fl = []; for (let i = 0; i <= 10; i++) { const t = i / 10, x = cx - cw1 + 2 * cw1 * t; fl.push([x, cy1 + Math.sin(Math.PI * t) * (F.big ? 13 : 8.5) - 1]); }
    capeS += this.fluff(fl, F.big ? 4.4 : 3.1);
    const stars = F.back ? [[0, 0.5, 1.9], [-0.55, 0.35, 0.8], [0.55, 0.4, 0.9], [-0.3, 0.8, 0.7], [0.35, 0.82, 0.6]] : [[-0.55, 0.45, 1], [0.6, 0.4, 0.9], [-0.25, 0.8, 0.7], [0.4, 0.78, 0.8]];
    for (const [x, y, k] of stars) capeS += this.star(cx + x * cw1 + (F.back ? 0 : sx), ctop + (cy1 - ctop) * y, (F.big ? 6 : 3.8) * k, Y, 1.6);
    for (const [x, y] of [[-0.75, 0.62], [0.2, 0.3], [0.78, 0.7]]) capeS += this.twinkle(cx + x * cw1, ctop + (cy1 - ctop) * y, F.big ? 3 : 2, YL);
    const top = F.back ? "" : neckWrap(ctx, (s) => this.line("M-16,2 Q-6,14 0,10 M16,2 Q6,14 0,10", "#FFFFFF", s * 0.55) + this.star(0, 12, 14, Y, s * 0.6) + this.dot(0, 12, 4, YL));
    return { torso: torsoClip(ctx, body) + skirt + capeS, top };
  },
  // パンダ ポンチョ: しろい ポンチョ・くろい かたと すそ・パンダの ポケット。うしろは パンダの かおの フードと しっぽ
  animal0(ctx, F) {
    const W = "#FFFFFF", WS = "#ECE8E2", K = "#4B4851", PK = "#F4B6C6", G = "#9CC98A";
    const { cx, sx } = F, top = F.T.top - (F.big ? 2 : 6), y1 = F.v(F.big ? 0.8 : 0.82), w0 = F.hw * 0.8, w1 = F.hw + (F.big ? 20 : 12);
    const shape = `M${f2(cx - w0)},${f2(top)} C${f2(cx - w0 - 12)},${f2(top + (y1 - top) * 0.28)} ${f2(cx - w1)},${f2(y1 - (y1 - top) * 0.35)} ${f2(cx - w1)},${f2(y1)} Q${f2(cx)},${f2(y1 + (F.big ? 16 : 10))} ${f2(cx + w1)},${f2(y1)} C${f2(cx + w1)},${f2(y1 - (y1 - top) * 0.35)} ${f2(cx + w0 + 12)},${f2(top + (y1 - top) * 0.28)} ${f2(cx + w0)},${f2(top)} Z`;
    const cid = "iwp" + ctx.uid;
    let earsTop = "";
    let s = `<clipPath id="${cid}"><path d="${shape}"/></clipPath>` + this.p(shape, W) + `<g clip-path="url(#${cid})">`;
    // くろい かた（パンダの うで）と すその ふち
    s += `<path d="M-10,${f2(top - 10)} H${f2(cx - w0 * 0.55)} C${f2(cx - w0 * 0.2)},${f2(F.v(0.2))} ${f2(cx - w0 * 0.9)},${f2(F.v(0.45))} ${f2(cx - w1 - 2)},${f2(F.v(0.5))} Z" fill="${K}"/><path d="M220,${f2(top - 10)} H${f2(cx + w0 * 0.55)} C${f2(cx + w0 * 0.2)},${f2(F.v(0.2))} ${f2(cx + w0 * 0.9)},${f2(F.v(0.45))} ${f2(cx + w1 + 2)},${f2(F.v(0.5))} Z" fill="${K}"/>`;
    s += this.line(`M${f2(cx - w1)},${f2(y1 - 3)} Q${f2(cx)},${f2(y1 + (F.big ? 13 : 7))} ${f2(cx + w1)},${f2(y1 - 3)}`, K, F.big ? 8 : 5);
    s += `<path d="M${f2(cx + w1 * 0.4)},${f2(F.v(0.35))} Q${f2(cx + w1 * 0.9)},${f2(F.v(0.55))} ${f2(cx + w1)},${f2(y1)} L${f2(cx + w1 * 0.4)},${f2(y1 + 8)} Z" fill="${WS}" opacity=".7"/>`;
    s += "</g>" + this.p(shape, "none");
    if (F.back) {
      // フード（パンダの かお）
      const hy = F.v(F.big ? 0.12 : 0.18), hr = F.hw * (F.big ? 0.42 : 0.62);
      earsTop = this.dot(cx - hr * 0.78, hy - hr * 0.58, hr * 0.34, K, 3) + this.dot(cx + hr * 0.78, hy - hr * 0.58, hr * 0.34, K, 3);
      s += this.p(`M${f2(cx - hr)},${f2(hy - hr * 0.3)} Q${f2(cx - hr)},${f2(hy + hr * 0.95)} ${f2(cx)},${f2(hy + hr * 1.05)} Q${f2(cx + hr)},${f2(hy + hr * 0.95)} ${f2(cx + hr)},${f2(hy - hr * 0.3)} Q${f2(cx)},${f2(hy - hr * 0.75)} ${f2(cx - hr)},${f2(hy - hr * 0.3)} Z`, W, 3.5);
      s += this.ell(cx - hr * 0.4, hy + hr * 0.18, hr * 0.26, hr * 0.34, K, 0, 25) + this.ell(cx + hr * 0.4, hy + hr * 0.18, hr * 0.26, hr * 0.34, K, 0, -25) + this.dot(cx - hr * 0.36, hy + hr * 0.1, hr * 0.08, W) + this.dot(cx + hr * 0.36, hy + hr * 0.1, hr * 0.08, W) + this.ell(cx, hy + hr * 0.55, hr * 0.14, hr * 0.1, K);
      s += this.dot(cx, y1 + (F.big ? 10 : 5), F.big ? 9 : 6, W, 3);
    } else {
      // パンダの ポケット と たけの は
      const py = F.v(F.big ? 0.5 : 0.56), pr = F.hw * (F.big ? 0.26 : 0.34), px = cx + sx;
      s += this.dot(px - pr * 0.75, py - pr * 0.7, pr * 0.34, K, 2.2) + this.dot(px + pr * 0.75, py - pr * 0.7, pr * 0.34, K, 2.2) + this.ell(px, py, pr, pr * 0.9, W, 2.6);
      s += this.ell(px - pr * 0.4, py - pr * 0.05, pr * 0.22, pr * 0.3, K, 0, 25) + this.ell(px + pr * 0.4, py - pr * 0.05, pr * 0.22, pr * 0.3, K, 0, -25) + this.ell(px, py + pr * 0.35, pr * 0.14, pr * 0.1, K) + this.dot(px - pr * 0.62, py + pr * 0.3, pr * 0.12, PK) + this.dot(px + pr * 0.62, py + pr * 0.3, pr * 0.12, PK);
      s += this.ell(px + pr * 1.25, py - pr * 0.9, pr * 0.42, pr * 0.16, G, 1.6, -40) + this.ell(px + pr * 1.45, py - pr * 0.55, pr * 0.38, pr * 0.14, G, 1.6, -10);
    }
    const tie = F.back ? "" : neckWrap(ctx, (sw) => this.line("M-9,4 Q-11,18 -13,28 M9,4 Q11,18 13,28", K, sw * 0.5) + this.dot(-13, 31, 6.5, K, sw * 0.5) + this.dot(13, 31, 6.5, K, sw * 0.5) + this.dot(-15, 29, 1.8, "#8C8894") + this.dot(11, 29, 1.8, "#8C8894"));
    return { torso: s + (F.back ? "" : this.paws(ctx, 0.78)), top: tie + earsTop };
  },
  // こぐま パーカー: ながそで・おなかの ポケット・ひも・ゴムの すそ。うしろは くまみみの フードと しっぽ
  animal1(ctx, F) {
    const B = "#C69A70", BD = "#A77A53", BL = "#D8B18A", C = "#F4E0C3", S = "#FFF6E6";
    const { cx, sx } = F, hem = F.v(F.big ? 0.86 : 0.9);
    let body = garment(ctx, hem, B) + `<path d="M${f2(cx + F.hw * 0.5)},${f2(F.T.top)} C${f2(cx + F.hw * 0.7)},${f2(F.v(0.4))} ${f2(cx + F.hw * 0.7)},${f2(hem - 10)} ${f2(cx + F.hw * 0.62)},${f2(hem)} H220 V${f2(F.T.top)} Z" fill="${BD}" opacity=".3"/>`;
    if (F.back) {
      const hy = F.v(F.big ? 0.1 : 0.16), hr = F.hw * (F.big ? 0.44 : 0.66);
      body += this.p(`M${f2(cx - hr)},${f2(hy - hr * 0.4)} Q${f2(cx - hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx)},${f2(hy + hr * 1.05)} Q${f2(cx + hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx + hr)},${f2(hy - hr * 0.4)} Z`, BL, 3.2) + this.line(`M${f2(cx - hr * 0.7)},${f2(hy - hr * 0.2)} Q${f2(cx)},${f2(hy + hr * 0.75)} ${f2(cx + hr * 0.7)},${f2(hy - hr * 0.2)}`, BD, 2.2);
    } else {
      // カンガルーの ポケット と くまの あしあと
      const py0 = F.v(F.big ? 0.5 : 0.52), py1 = hem - (F.big ? 12 : 8), pw = F.hw * (F.big ? 0.62 : 0.72), px = cx + sx;
      body += this.p(`M${f2(px - pw * 0.72)},${f2(py0)} H${f2(px + pw * 0.72)} Q${f2(px + pw * 0.86)},${f2((py0 + py1) / 2)} ${f2(px + pw)},${f2(py1)} H${f2(px - pw)} Q${f2(px - pw * 0.86)},${f2((py0 + py1) / 2)} ${f2(px - pw * 0.72)},${f2(py0)} Z`, C, 2.6);
      body += this.line(`M${f2(px - pw * 0.72)},${f2(py0 + 2)} Q${f2(px - pw * 0.55)},${f2((py0 + py1) / 2)} ${f2(px - pw * 0.8)},${f2(py1 - 2)} M${f2(px + pw * 0.72)},${f2(py0 + 2)} Q${f2(px + pw * 0.55)},${f2((py0 + py1) / 2)} ${f2(px + pw * 0.8)},${f2(py1 - 2)}`, "#E1C39D", 1.8);
      body += this.paw(px, (py0 + py1) / 2 + 1, F.big ? 1.5 : 0.95, BD);
    }
    body += this.rib(hem - (F.big ? 10 : 7), hem, BD, B) + this.hemLine(hem);
    const out = { sleeve: this.sleeves(ctx, B, { len: 0.84, cuff: BD }), torso: torsoClip(ctx, body) };
    if (F.back) {
      // フードの くまみみ（からだの そとまで はみでる）と まるい しっぽ
      const hy = F.v(F.big ? 0.1 : 0.16), hr = F.hw * (F.big ? 0.44 : 0.66);
      out.top = this.dot(cx - hr * 0.84, hy - hr * 0.44, hr * 0.3, B, 3) + this.dot(cx - hr * 0.84, hy - hr * 0.44, hr * 0.15, C) + this.dot(cx + hr * 0.84, hy - hr * 0.44, hr * 0.3, B, 3) + this.dot(cx + hr * 0.84, hy - hr * 0.44, hr * 0.15, C);
      out.torso += this.dot(cx, hem + (F.big ? 2 : 1), F.big ? 8 : 5, BL, 3);
    } else out.top = neckWrap(ctx, (s) => this.line("M-12,4 C-14,14 -12,24 -13,34 M12,4 C14,14 12,24 13,34", S, s * 0.55) + this.ell(-13, 37, 3.4, 5, BD, s * 0.45) + this.ell(13, 37, 3.4, 5, BD, s * 0.45));
    return out;
  },
  // うさぎ ケープ: みずたまの ワンピース ＋ もこもこの ふちの ケープ。フードの ながい みみが かたから まえに たれる
  animal2(ctx, F) {
    const P = "#F2C4D6", PL = "#F9E1EA", PD = "#E09CB9", W = "#FFFFFF", IN = "#F6A9C2", CA = "#F4A664", G = "#9CC98A", D = "#FFF8F1";
    const { cx, sx } = F, waist = F.v(0.46), y1 = F.bot - (F.big ? 6 : 3), w0 = F.hw + 1, w1 = F.hw * (F.big ? 1.28 : 1.34);
    let body = garment(ctx, waist + 3, D);
    for (let y = F.T.top + 6; y < waist; y += 11) for (let x = 10; x < 200; x += 12) body += this.dot(x + ((y / 11) % 2) * 6, y, 2.1, PL);
    let skirt = this.p(this.skirtD(cx, waist, w0, y1, w1), D);
    const hp = this.hemPts(cx, w1, y1 - 1, 12, 5);
    skirt += this.line("M" + hp.map(([x, y]) => f2(x) + "," + f2(y - 3.5)).join(" L"), P, 4.5);
    for (const [x, y] of [[-0.6, 0.35], [-0.2, 0.62], [0.25, 0.35], [0.62, 0.6], [0.02, 0.2]]) skirt += this.dot(cx + x * w1 * 0.85, waist + (y1 - waist) * y, F.big ? 3.2 : 2.2, P);
    // ケープ
    const ctop = F.T.top - (F.big ? 2 : 6), cy1 = F.v(F.big ? 0.44 : 0.5), cw1 = F.hw + (F.big ? 20 : 12), cw0 = F.hw * 0.78;
    const cape = `M${f2(cx - cw0)},${f2(ctop)} C${f2(cx - cw0 - 10)},${f2(ctop + (cy1 - ctop) * 0.3)} ${f2(cx - cw1)},${f2(cy1 - (cy1 - ctop) * 0.3)} ${f2(cx - cw1)},${f2(cy1)} Q${f2(cx)},${f2(cy1 + (F.big ? 14 : 9))} ${f2(cx + cw1)},${f2(cy1)} C${f2(cx + cw1)},${f2(cy1 - (cy1 - ctop) * 0.3)} ${f2(cx + cw0 + 10)},${f2(ctop + (cy1 - ctop) * 0.3)} ${f2(cx + cw0)},${f2(ctop)} Z`;
    let capeS = this.p(cape, P) + `<path d="M${f2(cx + cw1 * 0.35)},${f2(ctop)} C${f2(cx + cw1 * 0.75)},${f2(ctop + 10)} ${f2(cx + cw1 * 0.95)},${f2(cy1 - 12)} ${f2(cx + cw1 - 1)},${f2(cy1 - 1)} L${f2(cx + cw1 * 0.55)},${f2(cy1 + 5)} Z" fill="${PD}" opacity=".35"/>`;
    const fl = []; for (let i = 0; i <= 9; i++) { const t = i / 9; fl.push([cx - cw1 + 2 * cw1 * t, cy1 + Math.sin(Math.PI * t) * (F.big ? 12 : 7.5) - 1]); }
    capeS += this.fluff(fl, F.big ? 5 : 3.6);
    if (F.back) {
      // フード（ながい みみが せなかに ねている）と しっぽ
      const hy = F.v(F.big ? 0.08 : 0.12), hr = F.hw * (F.big ? 0.42 : 0.6);
      capeS += this.p(`M${f2(cx - hr)},${f2(hy - hr * 0.3)} Q${f2(cx - hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx)},${f2(hy + hr)} Q${f2(cx + hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx + hr)},${f2(hy - hr * 0.3)} Z`, PL, 3) + this.line(`M${f2(cx - hr * 0.7)},${f2(hy - hr * 0.1)} Q${f2(cx)},${f2(hy + hr * 0.7)} ${f2(cx + hr * 0.7)},${f2(hy - hr * 0.1)}`, PD, 2);
      for (const k of [-1, 1]) capeS += this.ell(cx + k * hr * 0.55, hy + hr * 0.2 + hr * 0.95, hr * 0.28, hr * 0.95, P, 3, k * 12) + this.ell(cx + k * hr * 0.55, hy + hr * 0.2 + hr * 0.95, hr * 0.13, hr * 0.7, IN, 0, k * 12);
      capeS += this.dot(cx, y1 - (F.big ? 6 : 4), F.big ? 10 : 7, W, 3) + this.dot(cx - 2, y1 - (F.big ? 9 : 6), F.big ? 3 : 2, "#F1ECE6");
    } else {
      // かたから たれる みみ・にんじんの ブローチ
      // フードの みみ（くびの よこから かたの まえに たれる）
      const ew = F.big ? 17 : 12;
      for (const k of [-1, 1]) {
        const rx = cx + k * cw0 * 0.62, ry = ctop + 2, tx = cx + k * (cw0 + (F.big ? 10 : 5)), ty = cy1 + (F.big ? 16 : 10), L = ty - ry;
        const ear = (w, y0, y1) => `M${f2(rx - w / 2)},${f2(y0)} C${f2(rx - w / 2 - k * 2)},${f2(y0 + (y1 - y0) * 0.45)} ${f2(tx - w / 2)},${f2(y1 - (y1 - y0) * 0.3)} ${f2(tx)},${f2(y1)} C${f2(tx + w / 2)},${f2(y1 - (y1 - y0) * 0.3)} ${f2(rx + w / 2 + k * 2)},${f2(y0 + (y1 - y0) * 0.45)} ${f2(rx + w / 2)},${f2(y0)} Z`;
        capeS += this.p(ear(ew, ry, ty), P, 3) + `<path d="${ear(ew * 0.5, ry + L * 0.1, ty - L * 0.1)}" fill="${IN}"/>`;
      }
      const bx = cx + sx + cw1 * 0.42, by = ctop + (cy1 - ctop) * 0.62, k = F.big ? 1.5 : 1;
      capeS += this.p(`M${f2(bx - 3 * k)},${f2(by - 3 * k)} L${f2(bx + 3 * k)},${f2(by - 3 * k)} L${f2(bx)},${f2(by + 7 * k)} Z`, CA, 1.8) + this.line(`M${f2(bx)},${f2(by - 3 * k)} l${f2(-2.5 * k)},${f2(-4 * k)} M${f2(bx)},${f2(by - 3 * k)} l${f2(2.5 * k)},${f2(-4 * k)}`, G, 2);
    }
    const top = F.back ? "" : neckWrap(ctx, (s) => this.line("M-7,3 Q-7,10 -8,15 M7,3 Q7,10 8,15", PD, s * 0.35) + this.dot(-8, 18, 5, W, s * 0.45) + this.dot(8, 18, 5, W, s * 0.45));
    return { torso: torsoClip(ctx, body) + skirt + capeS + (F.back ? "" : this.paws(ctx, 0.86)), top };
  },
  // ぶとうかいの ドレス: レースあみの むね・ぱふっとした そで・ひらいた うわスカートと 3だんの フリル・ばら
  gothic0(ctx, F) {
    const D = "#6C5A80", DL = "#8A77A0", DD = "#54456A", L = "#F7F1F6", LS = "#E4DAE6", R = "#C8607E", RD = "#98405E", G = "#8FB08A";
    const { cx, sx } = F, waist = F.v(F.big ? 0.38 : 0.4), y1 = F.bot - (F.big ? 4 : 2), w0 = F.hw + 1, w1 = F.hw * (F.big ? 1.42 : 1.55), ex = cx + sx;
    let body = garment(ctx, waist + 3, D);
    if (F.back) {
      body += this.band(F.top, waist + 3, DL) + this.band(F.top, waist + 3, D);
      for (let i = 0; i < 4; i++) { const y = F.top + 2 + (waist - F.top - 2) * (i / 4); body += this.line(`M${f2(cx - 5)},${f2(y)} L${f2(cx + 5)},${f2(y + 4)} M${f2(cx + 5)},${f2(y)} L${f2(cx - 5)},${f2(y + 4)}`, L, 1.6); }
    } else {
      const pw = F.hw * (F.big ? 0.36 : 0.44);
      body += this.p(`M${f2(ex - pw)},${f2(F.T.top - 4)} L${f2(ex + pw)},${f2(F.T.top - 4)} L${f2(ex + pw * 0.55)},${f2(waist + 4)} L${f2(ex - pw * 0.55)},${f2(waist + 4)} Z`, DL, 2.4);
      for (let i = 0; i < 4; i++) { const y = F.top + 3 + (waist - F.top - 2) * (i / 4); body += this.line(`M${f2(ex - pw * 0.45)},${f2(y)} L${f2(ex + pw * 0.45)},${f2(y + 4.5)} M${f2(ex + pw * 0.45)},${f2(y)} L${f2(ex - pw * 0.45)},${f2(y + 4.5)}`, L, 1.6); }
      // むねの レース
      const ly = F.top + (F.big ? 4 : 1), lr = F.big ? 5 : 3.2;
      body += this.fluff([[ex - lr * 2.2, ly], [ex - lr * 1.1, ly + lr * 0.7], [ex, ly + lr], [ex + lr * 1.1, ly + lr * 0.7], [ex + lr * 2.2, ly]], lr, L);
    }
    // うわスカート（まえが ひらく）と フリルの ペチコート
    let skirt = this.p(this.skirtD(cx, waist, w0, y1, w1), D);
    const tiers = 3;
    if (!F.back) {
      for (let i = 0; i < tiers; i++) {
        const ya = waist + 3 + (y1 - waist - 3) * (i / tiers), yb = waist + 3 + (y1 - waist - 3) * ((i + 1) / tiers), wa = F.hw * (0.3 + i * 0.22), wb = F.hw * (0.46 + i * 0.24);
        const pts = this.hemPts(ex, wb, yb, 5 + i, 2.5);
        let d = `M${f2(ex - wa)},${f2(ya)} L${f2(ex + wa)},${f2(ya)} L${f2(ex + wb)},${f2(yb)}`;
        for (let j = pts.length - 2; j >= 0; j--) { const [xa, yA] = pts[j + 1], [xb, yB] = pts[j]; d += ` Q${f2((xa + xb) / 2)},${f2(Math.max(yA, yB) + 5)} ${f2(xb)},${f2(yB)}`; }
        skirt += this.p(d + " Z", i % 2 ? LS : L, 2.6);
      }
      // うわスカートの ふち（ひらいた ところ）
      skirt += this.line(`M${f2(ex - F.hw * 0.3)},${f2(waist + 3)} Q${f2(ex - F.hw * 0.62)},${f2(waist + (y1 - waist) * 0.5)} ${f2(ex - F.hw * 1.02)},${f2(y1 + 3)} M${f2(ex + F.hw * 0.3)},${f2(waist + 3)} Q${f2(ex + F.hw * 0.62)},${f2(waist + (y1 - waist) * 0.5)} ${f2(ex + F.hw * 1.02)},${f2(y1 + 3)}`, INK, 3.2);
    } else {
      for (let i = 1; i < 4; i++) skirt += this.line(`M${f2(cx + (i - 2) * w0 * 0.55)},${f2(waist + 4)} Q${f2(cx + (i - 2) * w1 * 0.5)},${f2(waist + (y1 - waist) * 0.5)} ${f2(cx + (i - 2) * w1 * 0.68)},${f2(y1 + 2)}`, DD, 2.2);
    }
    // すその レース
    const lp = this.hemPts(cx, w1 - 2, y1 + 1, F.big ? 16 : 11, 5);
    skirt += this.fluff(lp.filter((q, i) => F.back || Math.abs(q[0] - ex) > F.hw * 1.02 - 1), F.big ? 3.6 : 2.6, L);
    let deco = `<path d="M${f2(cx - w0 - 1)},${f2(waist - 2.5)} H${f2(cx + w0 + 1)} V${f2(waist + 3.5)} H${f2(cx - w0 - 1)} Z" fill="${DD}" ${stroke(3)}/>`;
    deco += F.back ? this.bow(cx, waist, F.big ? 1.5 : 0.95, R, RD) : this.rose(ex + F.hw * 0.62, waist, F.big ? 6 : 4, R, RD, G);
    return { sleeve: this.sleeves(ctx, D, { len: 0.44, puff: 3.2, frill: L }), torso: torsoClip(ctx, body) + skirt + deco };
  },
  // つきよの マント: ながい マント（まえが ひらいて ほしの うちがわ）・かたの みじかい ケープ・みかづきの かざり。うしろは おおきな つき
  gothic1(ctx, F) {
    const M = "#4E5585", MD = "#3F4571", ML = "#6A71A3", IN = "#D8D2F0", V = "#6B638F", Y = "#F2D27C", YL = "#FFF6D6";
    const { cx, sx } = F, top = F.T.top - (F.big ? 2 : 6), y1 = F.bot + (F.big ? -2 : 4), w0 = F.hw * 0.8, w1 = F.hw + (F.big ? 24 : 16), ex = cx + sx;
    let under = garment(ctx, 220, V);
    if (!F.back) for (let i = 0; i < 3; i++) under += this.dot(ex, F.v(0.3 + i * 0.2), F.big ? 3 : 2.2, Y, 1.6);
    const cloak = `M${f2(cx - w0)},${f2(top)} C${f2(cx - w0 - 12)},${f2(top + (y1 - top) * 0.25)} ${f2(cx - w1)},${f2(y1 - (y1 - top) * 0.3)} ${f2(cx - w1)},${f2(y1)} Q${f2(cx)},${f2(y1 + 8)} ${f2(cx + w1)},${f2(y1)} C${f2(cx + w1)},${f2(y1 - (y1 - top) * 0.3)} ${f2(cx + w0 + 12)},${f2(top + (y1 - top) * 0.25)} ${f2(cx + w0)},${f2(top)} Z`;
    let s = this.p(cloak, M) + `<path d="M${f2(cx + w1 * 0.45)},${f2(top + 4)} C${f2(cx + w1 * 0.85)},${f2(top + 20)} ${f2(cx + w1)},${f2(y1 - 20)} ${f2(cx + w1 - 1)},${f2(y1 - 1)} L${f2(cx + w1 * 0.6)},${f2(y1 + 5)} Z" fill="${MD}" opacity=".55"/>`;
    if (F.back) {
      s += this.moon(cx, F.v(0.5), F.big ? 22 : 13, Y, 3) + this.star(cx + (F.big ? 30 : 18), F.v(0.3), F.big ? 6 : 3.6, YL, 1.6) + this.star(cx - (F.big ? 28 : 16), F.v(0.74), F.big ? 5 : 3, YL, 1.6);
      for (const [x, y] of [[-0.6, 0.3], [0.62, 0.7], [-0.2, 0.9]]) s += this.twinkle(cx + x * w1, F.v(y), F.big ? 3 : 2, YL);
    } else {
      // まえの あき: うちがわ（ほし）と した の ふく
      const oy = F.v(F.big ? 0.12 : 0.2), ow = F.hw * (F.big ? 0.6 : 0.72);
      const open = `M${f2(ex)},${f2(oy)} C${f2(ex - ow * 0.4)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex - ow * 0.9)},${f2(y1 - 12)} ${f2(ex - ow)},${f2(y1 + 4)} L${f2(ex + ow)},${f2(y1 + 4)} C${f2(ex + ow * 0.9)},${f2(y1 - 12)} ${f2(ex + ow * 0.4)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex)},${f2(oy)} Z`;
      const oid = "iwm" + ctx.uid;
      s += `<clipPath id="${oid}"><path d="${open}"/></clipPath><g clip-path="url(#${oid})"><path d="${open}" fill="${IN}"/>` + torsoClip(ctx, under) + "</g>";
      s += this.p(`M${f2(ex)},${f2(oy)} C${f2(ex - ow * 0.4)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex - ow * 0.9)},${f2(y1 - 12)} ${f2(ex - ow)},${f2(y1 + 4)} L${f2(ex - ow - 6)},${f2(y1 + 3)} C${f2(ex - ow * 1.02)},${f2(y1 - 16)} ${f2(ex - ow * 0.55)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex)},${f2(oy)} Z`, IN, 2.6);
      s += this.p(`M${f2(ex)},${f2(oy)} C${f2(ex + ow * 0.4)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex + ow * 0.9)},${f2(y1 - 12)} ${f2(ex + ow)},${f2(y1 + 4)} L${f2(ex + ow + 6)},${f2(y1 + 3)} C${f2(ex + ow * 1.02)},${f2(y1 - 16)} ${f2(ex + ow * 0.55)},${f2(oy + (y1 - oy) * 0.4)} ${f2(ex)},${f2(oy)} Z`, IN, 2.6);
      for (const [x, y] of [[-0.55, 0.55], [-0.8, 0.85], [0.8, 0.82], [0.62, 0.5]]) s += this.star(ex + x * ow, oy + (y1 - oy) * y, F.big ? 3.2 : 2, "#FFFFFF");
      for (const [x, y] of [[-0.75, 0.35], [0.78, 0.3], [0.9, 0.62], [-0.9, 0.7]]) s += this.star(cx + x * w1, F.v(y), F.big ? 3.2 : 2, Y);
    }
    // かたの ケープ（ぎざぎざ の ふち・きんの ふち）
    const cy1 = F.v(F.big ? 0.3 : 0.36), cw1 = F.hw + (F.big ? 18 : 10), n = F.big ? 7 : 5;
    let d = `M${f2(cx - w0 + 2)},${f2(top - 1)} C${f2(cx - w0 - 8)},${f2(top + (cy1 - top) * 0.3)} ${f2(cx - cw1)},${f2(cy1 - (cy1 - top) * 0.5)} ${f2(cx - cw1)},${f2(cy1)}`;
    for (let i = 0; i < n; i++) { const xa = cx - cw1 + (2 * cw1 * i) / n, xb = cx - cw1 + (2 * cw1 * (i + 1)) / n, yb = cy1 + Math.sin(Math.PI * ((i + 1) / n)) * 6; d += ` L${f2((xa + xb) / 2)},${f2(cy1 + Math.sin(Math.PI * ((i + 0.5) / n)) * 6 + (F.big ? 10 : 6))} L${f2(xb)},${f2(yb)}`; }
    d += ` C${f2(cx + cw1)},${f2(cy1 - (cy1 - top) * 0.5)} ${f2(cx + w0 + 8)},${f2(top + (cy1 - top) * 0.3)} ${f2(cx + w0 - 2)},${f2(top - 1)} Z`;
    s += this.p(d, ML) + `<path d="${d}" fill="none" stroke="${Y}" stroke-width="1.6" transform="translate(0 -2.2)" opacity=".9"/>` + this.p(d, "none");
    const top2 = F.back ? "" : neckWrap(ctx, (sw) => this.line("M-26,4 Q0,18 26,4", Y, sw * 0.4) + this.moon(0, 12, 12, Y, sw * 0.6) + this.dot(7, 5, 2.4, YL));
    return { torso: s + (F.back ? "" : this.paws(ctx, 0.84)), top: top2 };
  },
  // くろばらの ジャケット: えり・むねの フリル・きんの ボタン 4つ・レースの そでぐち・ばらの かざり。うしろは つばめの しっぽ
  gothic2(ctx, F) {
    const J = "#5B5270", JD = "#453E57", SA = "#3E3750", SH = "#FBF7F2", VE = "#8E4D6D", W = "#FFFFFF", GO = "#E8C872", R = "#B45A84", RD = "#7E3558", G = "#7FA37A";
    const { cx, sx } = F, waist = F.v(F.big ? 0.5 : 0.55), hem = F.v(F.big ? 0.74 : 0.76), ex = cx + sx;
    let body = garment(ctx, 220, SH);
    const tails = (fill) => `M${f2(cx - F.hw * 0.9)},${f2(waist)} C${f2(cx - F.hw * 1.05)},${f2(waist + 20)} ${f2(cx - F.hw * 0.8)},${f2(F.bot + 4)} ${f2(cx - F.hw * 0.42)},${f2(F.bot + (F.big ? 2 : 8))} L${f2(cx - 3)},${f2(waist + (F.bot - waist) * 0.35)} L${f2(cx + 3)},${f2(waist + (F.bot - waist) * 0.35)} L${f2(cx + F.hw * 0.42)},${f2(F.bot + (F.big ? 2 : 8))} C${f2(cx + F.hw * 0.8)},${f2(F.bot + 4)} ${f2(cx + F.hw * 1.05)},${f2(waist + 20)} ${f2(cx + F.hw * 0.9)},${f2(waist)} Z`;
    let after = "";
    if (F.back) {
      body += this.band(F.T.top - 20, waist + 2, J) + `<path d="M${f2(cx + F.hw * 0.45)},${f2(F.T.top)} C${f2(cx + F.hw * 0.7)},${f2(F.v(0.3))} ${f2(cx + F.hw * 0.75)},${f2(waist - 6)} ${f2(cx + F.hw * 0.7)},${f2(waist + 2)} H220 V${f2(F.T.top)} Z" fill="${JD}" opacity=".35"/>`;
      body += this.line(`M${f2(cx)},${f2(F.top)} V${f2(waist)}`, JD, 2);
      after = this.p(tails(J), J) + this.line(`M${f2(cx)},${f2(waist + 2)} V${f2(waist + (F.bot - waist) * 0.35)}`, INK, 3) + `<path d="M${f2(cx - F.hw * 0.62)},${f2(waist - 3)} H${f2(cx + F.hw * 0.62)} V${f2(waist + 4)} H${f2(cx - F.hw * 0.62)} Z" fill="${JD}" ${stroke(2.6)}/>` + this.dot(cx - F.hw * 0.3, waist + 0.5, F.big ? 3.2 : 2.3, GO, 1.6) + this.dot(cx + F.hw * 0.3, waist + 0.5, F.big ? 3.2 : 2.3, GO, 1.6);
    } else {
      // まえ: みごろ・えり・フリル・ボタン
      const ow = F.hw * (F.big ? 0.3 : 0.36), oy = waist - 2;
      const side = (k) => `M${f2(ex + k * ow)},${f2(F.T.top - 20)} L${f2(ex + k * ow)},${f2(F.T.top)} L${f2(ex + k * 3)},${f2(oy)} C${f2(ex + k * F.hw * 0.4)},${f2(hem - 4)} ${f2(ex + k * F.hw * 0.7)},${f2(hem)} ${f2(cx + k * F.hw * 1.2)},${f2(hem + 4)} L${f2(cx + k * 130)},${f2(hem + 4)} L${f2(cx + k * 130)},${f2(F.T.top - 20)} Z`;
      // ベスト（ワインいろ・とがった すそ・ボタン）
      const vh = F.v(F.big ? 0.84 : 0.86), vv = F.v(F.big ? 0.3 : 0.36);
      body += `<path d="M-10,${f2(F.T.top - 20)} H220 V${f2(vh)} H${f2(ex + F.hw * 0.5)} L${f2(ex)},${f2(vh + 6)} L${f2(ex - F.hw * 0.5)},${f2(vh)} H-10 Z" fill="${VE}"/><path d="M${f2(ex - ow * 0.95)},${f2(F.T.top - 20)} H${f2(ex + ow * 0.95)} V${f2(F.T.top)} L${f2(ex)},${f2(vv)} L${f2(ex - ow * 0.95)},${f2(F.T.top)} Z" fill="${SH}"/>`;
      body += this.line(`M${f2(ex - ow * 0.95)},${f2(F.T.top)} L${f2(ex)},${f2(vv)} L${f2(ex + ow * 0.95)},${f2(F.T.top)} M${f2(ex - F.hw * 0.9)},${f2(vh)} H${f2(ex - F.hw * 0.5)} L${f2(ex)},${f2(vh + 6)} L${f2(ex + F.hw * 0.5)},${f2(vh)} H${f2(ex + F.hw * 0.9)}`, INK, 2.8);
      for (let i = 0; i < 3; i++) body += this.dot(ex, vv + 4 + (vh - vv - 6) * (i / 2), F.big ? 2.4 : 1.7, GO, 1.3);
      body += `<path d="${side(-1)}" fill="${J}"/><path d="${side(1)}" fill="${J}"/>` + `<path d="${side(1)}" fill="${JD}" opacity=".3" transform="translate(${f2(F.hw * 0.5)} 0)"/>`;
      body += this.line(`M${f2(ex + ow)},${f2(F.T.top)} L${f2(ex + 3)},${f2(oy)} C${f2(ex + F.hw * 0.4)},${f2(hem - 4)} ${f2(ex + F.hw * 0.7)},${f2(hem)} ${f2(cx + F.hw * 1.2)},${f2(hem + 4)} M${f2(ex - ow)},${f2(F.T.top)} L${f2(ex - 3)},${f2(oy)} C${f2(ex - F.hw * 0.4)},${f2(hem - 4)} ${f2(ex - F.hw * 0.7)},${f2(hem)} ${f2(cx - F.hw * 1.2)},${f2(hem + 4)}`, INK, 3.2);
      // えり（サテン）
      for (const k of [-1, 1]) body += this.p(`M${f2(ex + k * ow)},${f2(F.T.top - 4)} L${f2(ex + k * ow * 1.9)},${f2(F.top + (oy - F.top) * 0.35)} L${f2(ex + k * ow * 1.25)},${f2(F.top + (oy - F.top) * 0.55)} L${f2(ex + k * 4)},${f2(oy - 1)} Z`, SA, 2.4);
      // むねの フリル
      const fy = F.top + (F.big ? 4 : 1), fr = F.big ? 5 : 3.3;
      for (let i = 0; i < 3; i++) body += this.fluff([[ex - fr * (0.9 - i * 0.12), fy + i * fr * 1.35], [ex + fr * (0.9 - i * 0.12), fy + i * fr * 1.35]], fr * (1 - i * 0.1), W) + this.dot(ex, fy + i * fr * 1.35 + fr * 0.4, fr * 0.95, W, 2);
      body += this.dot(ex, fy + fr * 3.4, F.big ? 3 : 2.1, "#B494D8", 1.6);
      for (const k of [-1, 1]) body += this.dot(ex + k * F.hw * 0.34, oy + 2, F.big ? 3.4 : 2.4, GO, 1.6);
      after = this.rose(ex - ow * 1.55, F.top + (oy - F.top) * 0.42, F.big ? 5 : 3.2, R, RD, G);
    }
    const out = { sleeve: this.sleeves(ctx, J, { len: 0.84, cuff: JD, frill: W }), torso: torsoClip(ctx, body) + after };
    // まえから 見ると つばめの しっぽは からだの うしろ
    if (!F.back) out.behind = this.p(tails(JD), JD);
    return out;
  },
};

// ---- マネキン（かおの ない 人形。服の 店の 台に かざる）----
// からだの 目安は わんこと おなじ くらい。服の WEAR を そのまま きせる（正面だけ）。
const WearMannequin = {
  P: {
    name: "マネキン", chin: 114, fill: "#F3EADB",
    torsoPath: "M76,116 C66,122 64,138 66,152 C68,164 73,170 73,178 C73,186 69,192 74,195 C84,201 116,201 126,195 C131,192 127,186 127,178 C127,170 132,164 134,152 C136,138 134,122 124,116 C114,111 86,111 76,116 Z",
    arms: [
      { cx: 64, cy: 149, rx: 8, ry: 23, rot: 10 },
      { cx: 136, cy: 149, rx: 8, ry: 23, rot: -10 },
    ],
    a: {
      hat: { x: 100, y: 52, w: 64 },
      eyes: { x: 100, y: 72, gap: 24 },
      cheek: { y: 82, gap: 34 },
      mouth: { x: 100, y: 86 },
      neck: { x: 100, y: 114, w: 54 },
      torso: { top: 114, bottom: 197, cx: 100, w: 66 },
      back: { x: 100, y: 134, w: 62 },
    },
  },
  n: 0,
  // item: 服の ID（ない ときは はだかの マネキン）
  svg(item) {
    const P = this.P, it = typeof ITEM_INDEX !== "undefined" ? ITEM_INDEX[item] : null, uid = "mq" + ++this.n, c = P.fill, cs = shade(c, -0.07);
    const ctx = { p: P, a: P.a, view: "front", dx: 0, col: (it && it.col) || [], uid };
    const L = { behind: "", sleeve: "", torso: "", top: "" };
    if (it && WEAR[it.wear]) { const r = WEAR[it.wear](ctx); for (const k in r) if (r[k]) L[k] += r[k]; }
    const stand = `<rect x="96" y="188" width="8" height="19" rx="2" fill="#CBAA7C" ${stroke(3)}/><ellipse cx="100" cy="206" rx="27" ry="7" fill="#A7815F" ${stroke()}/><ellipse cx="95" cy="204.3" rx="13" ry="2.4" fill="#C29C77"/>`;
    const arms = P.arms.map((a) => `<ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" transform="rotate(${a.rot} ${a.cx} ${a.cy})" fill="${c}" ${stroke()}/>`).join("");
    const neck = `<path d="M91,94 V118 H109 V94 Z" fill="${cs}" ${stroke()}/>`;
    const body = `<path d="${P.torsoPath}" fill="${c}" ${stroke()}/><path d="M114,117 C126,124 128,146 122,164 C119,176 123,188 121,196 C125,195 129,191 127,180 C126,170 132,162 133,150 C135,136 132,122 123,116 Z" fill="${cs}"/><path d="M100,122 V192" fill="none" stroke="${shade(c, -0.14)}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
    const head = `<ellipse cx="100" cy="70" rx="25" ry="30" fill="${c}" ${stroke()}/><ellipse cx="90" cy="58" rx="7" ry="11" fill="#FFFFFF" opacity=".7" transform="rotate(20 90 58)"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}"><defs><clipPath id="torso${uid}"><path d="${P.torsoPath}"/></clipPath></defs>${stand}${L.behind}${arms}${L.sleeve}${neck}<g>${body}</g>${L.torso}${head}${L.top}</svg>`;
  },
};
