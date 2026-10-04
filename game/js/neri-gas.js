// ネリカス ガソリンスタンドの おてつだい（オーナーの FB 2026-09-29「薄いグレーの 要素は … お手伝いや 買い物が できる ものに」）。
// おきゃくさんの くるまに きゅうゆ → あわで せんしゃ →（Lv.3 から）ぺしゃんこの タイヤに くうき。
// ノズルの いろは 日本の スタンドと おなじ（レギュラー あか・ハイオク きいろ・けいゆ みどり）。まんたんは カチッと とまる（オートストップ）。
// 店内（10×12 の 歩ける 店）の 什器・かんばんの しるし・レジの のみもの・店内 BGM も ここで 登録する。
const GAS_FUELS = [
  { id: "regular", name: "レギュラー", col: "#E8453C" },
  { id: "high", name: "ハイオク", col: "#F7C948" },
  { id: "diesel", name: "けいゆ", col: "#4FAE5A" },
];
const GAS_AMOUNTS = [
  { id: "full", name: "まんたん", lo: 0.9, hi: 1 },
  { id: "half", name: "はんぶん", lo: 0.45, hi: 0.6 },
  { id: "little", name: "すこしだけ", lo: 0.2, hi: 0.32 },
];
// くるまの 形（よこから 見た 絵・まえは ひだり）。spots は よごれの つく ところ（0〜1 の わりあい）、wheels は タイヤの 中心
const GAS_CARS = {
  mini: {
    name: "まるい くるま", lid: [0.83, 0.5], wheels: [[0.25, 0.8], [0.77, 0.8]],
    spots: [[0.14, 0.62], [0.3, 0.55], [0.44, 0.34], [0.6, 0.36], [0.52, 0.6], [0.68, 0.62], [0.88, 0.62], [0.38, 0.7]],
    body: `<path d="M16,96 C12,74 24,64 44,62 L72,60 C84,34 104,24 132,24 L160,24 C188,24 202,42 212,60 L224,64 C234,68 236,80 234,96 Z" fill="@" ${IS(4)}/>
      <path d="M80,60 C92,40 104,32 124,32 L126,60 Z" fill="#CDEBF7" ${IS(3)}/><path d="M134,32 L158,32 C176,32 188,44 196,60 L134,60 Z" fill="#CDEBF7" ${IS(3)}/>
      <path d="M92,52 L104,40 M140,52 L150,42" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M130,62 V94" stroke="${INK}" stroke-width="2.5"/>`,
  },
  wagon: {
    name: "ワゴン", lid: [0.85, 0.48], wheels: [[0.22, 0.8], [0.8, 0.8]],
    spots: [[0.12, 0.62], [0.3, 0.56], [0.42, 0.33], [0.62, 0.33], [0.8, 0.33], [0.5, 0.62], [0.7, 0.64], [0.9, 0.64]],
    body: `<path d="M12,96 C10,74 22,66 40,64 L66,62 C78,38 92,26 116,26 L214,26 C224,26 228,34 228,44 L232,96 Z" fill="@" ${IS(4)}/>
      <path d="M74,62 C84,42 96,34 114,34 L120,62 Z" fill="#CDEBF7" ${IS(3)}/><path d="M128,34 L166,34 L166,62 L128,62 Z" fill="#CDEBF7" ${IS(3)}/><path d="M174,34 L214,34 C218,34 220,38 220,42 L220,62 L174,62 Z" fill="#CDEBF7" ${IS(3)}/>
      <path d="M104,18 H206" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M124,64 V94 M170,64 V94" stroke="${INK}" stroke-width="2.5"/>`,
  },
  suv: {
    name: "おおきな くるま", lid: [0.86, 0.46], wheels: [[0.24, 0.8], [0.78, 0.8]],
    spots: [[0.12, 0.6], [0.28, 0.52], [0.42, 0.28], [0.6, 0.28], [0.76, 0.28], [0.52, 0.58], [0.7, 0.6], [0.9, 0.58]],
    body: `<path d="M16,98 L14,68 C14,60 20,56 30,56 L58,54 L76,22 L198,22 C208,22 214,28 216,36 L222,54 C230,56 234,64 234,74 L234,98 Z" fill="@" ${IS(4)}/>
      <path d="M68,54 L82,30 L126,30 L126,54 Z" fill="#CDEBF7" ${IS(3)}/><path d="M134,30 L196,30 C202,30 206,34 208,40 L212,54 L134,54 Z" fill="#CDEBF7" ${IS(3)}/>
      <path d="M130,56 V96" stroke="${INK}" stroke-width="2.5"/><rect x="36" y="74" width="190" height="8" rx="3" fill="#FFFFFF" fill-opacity=".45"/>`,
  },
};
const GAS_COLORS = ["#F28B82", "#8EC5F4", "#FFD54F", "#8FD19E", "#C7B8E8", "#F7B267"];
function gasCarSvg(shape, ci) {
  const c = GAS_CARS[shape], col = GAS_COLORS[ci];
  // ライト・バンパー・ドアの とって（タイヤは canvas で 描く。ぺしゃんこに できる ように）
  const lamp = `<circle cx="24" cy="76" r="7" fill="#FFF3B0" ${IS(2.6)}/><rect x="222" y="70" width="10" height="12" rx="3" fill="#E8453C" ${IS(2.4)}/>`;
  const trim = `<rect x="10" y="94" width="228" height="10" rx="5" fill="#C9C1B3" ${IS(3)}/><path d="M104,76 h14 M150,76 h14" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
  const lid = `<rect x="${Math.round(c.lid[0] * 240) - 8}" y="${Math.round(c.lid[1] * 130) - 6}" width="16" height="12" rx="3" fill="${shade(col, -0.12)}" ${IS(2.4)}/>`;
  const arch = c.wheels.map(([u, v]) => `<path d="M${u * 240 - 27},${v * 130} A27,27 0 0,1 ${u * 240 + 27},${v * 130} Z" fill="#3E3A40" ${IS(3)}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 130">${c.body.replace("@", col)}${trim}${arch}${lamp}${lid}</svg>`;
}

class GasTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const fuels = GAS_FUELS.slice(0, lv >= 3 ? 3 : lv >= 2 ? 2 : 1), amounts = GAS_AMOUNTS.slice(0, lv >= 3 ? 3 : 2);
    this.shape = U.pick(Object.keys(GAS_CARS)); this.ci = Math.floor(Math.random() * GAS_COLORS.length);
    this.want = { fuel: U.pick(fuels).id, amount: U.pick(amounts) };
    this.fuels = fuels; this.fuel = lv >= 2 ? null : this.want.fuel; this.fill = 0; this.holding = false; this.clicked = false;
    this.stage = "fuel"; this.mistakes = 0; this.bubbles = []; this.fx = [];
    // よごれ（Lv で ふえる）と ぺしゃんこの タイヤ（Lv.3 から 1こ、Lv.5 は 2こ の ことも）。位置は くるまの 中の わりあい
    this.spots = U.shuffle(GAS_CARS[this.shape].spots.map(([u, v]) => ({ u, v, dirt: 1 }))).slice(0, Math.min(8, 3 + lv));
    const flats = lv >= 3 ? (lv >= 5 && Math.random() < 0.5 ? [0, 1] : [Math.random() < 0.5 ? 0 : 1]) : [];
    this.tires = GAS_CARS[this.shape].wheels.map(([u, v], i) => ({ u, v, flat0: flats.includes(i), air: flats.includes(i) ? 0 : 1 }));
    this.speed = 0.26 + 0.04 * lv; this.need = 70 + lv * 10;
    this.timeLimit = [42, 40, 40, 38, 36][lv - 1]; this.title = "きゅうゆ おねがい！";
  }
  layout(R) {
    this.R = R;
    const fuel = this.stage === "fuel", top = R.y + 34, bottom = R.y + R.h - (fuel ? (this.lv >= 2 ? 166 : 112) : 70), room = Math.max(96, bottom - top);
    this.carW = Math.min(R.w * (fuel ? 0.72 : 0.8), room * 1.75, fuel ? 280 : 300); this.carH = (this.carW * 130) / 240;
    this.carX = R.x + (R.w - this.carW) / 2; if (fuel) this.carX = Math.min(this.carX, R.x + R.w - 76 - this.carW); // みぎに きゅうゆき
    this.carY = top + Math.max(0, (room - this.carH) / 2);
    const at = (q) => { q.x = this.carX + q.u * this.carW; q.y = this.carY + q.v * this.carH; return q; };
    this.spots.forEach(at); this.tires.forEach((t) => { at(t); t.r = this.carW * 0.085; });
    this.lid = at({ u: GAS_CARS[this.shape].lid[0], v: GAS_CARS[this.shape].lid[1] });
    this.setup();
  }
  setup() {
    const R = this.R; this.btns = []; this.holdBtn = this.nextBtn = null;
    const wide = (label) => ({ x: R.x + 10, y: R.y + R.h - 54, w: R.w - 20, h: 46, label, fs: 14, color: "#FFD54F", cb: () => this.advance() });
    if (this.stage === "fuel") {
      if (this.lv >= 2) {
        const cells = gridBtns(R, this.fuels.length, 3, R.y + R.h - 108, 46);
        this.fuels.forEach((f, i) => this.btns.push({ ...cells[i], label: f.name, fs: 13, color: f.col, on: this.fuel === f.id, cb: () => this.pickFuel(f) }));
      }
      const w = (R.w - 28) / 2, y = R.y + R.h - 54;
      this.holdBtn = { x: R.x + 10, y, w, h: 46, label: "ながおしで きゅうゆ", fs: 12, color: "#FFF3B0", disabled: !this.fuel || this.fill >= 1, cb: () => { if (this.fuel && this.fill < 1) this.holding = true; } };
      this.nextBtn = { x: R.x + 18 + w, y, w, h: 46, label: "つぎへ ▶", fs: 14, color: "#FFD54F", disabled: this.fill < 0.02, cb: () => this.advance() };
      this.btns.push(this.holdBtn, this.nextBtn);
    } else this.btns.push(wide(this.stage === "wash" && this.lv >= 3 ? "つぎへ ▶" : "できあがり！"));
  }
  pickFuel(f) {
    if (f.id !== this.want.fuel) { this.mistakes++; this.sc.mistake("ちがう いろ！"); return; }
    this.fuel = f.id; Sound.se("good"); this.setup();
  }
  advance() {
    this.holding = false; this.pointer = null;
    if (this.stage === "fuel") this.stage = "wash";
    else if (this.stage === "wash" && this.lv >= 3) this.stage = "tires";
    else { this.sc.finish(this.score()); Sound.se("sparkle"); return; }
    Sound.se("ok"); this.layout(this.R);
  }
  downArea(p) { if (this.stage !== "fuel") this.pointer = { ...p }; }
  move(p) {
    if (!this.pointer) return;
    const b = this.pointer, d = Math.hypot(p.x - b.x, p.y - b.y), steps = Math.max(1, Math.ceil(d / 5)), rad = this.carW * 0.1;
    this.pointer = { ...p };
    if (this.stage !== "wash") return;
    for (let i = 1; i <= steps; i++) {
      const x = U.lerp(b.x, p.x, i / steps), y = U.lerp(b.y, p.y, i / steps);
      for (const s of this.spots) if (s.dirt > 0 && Math.hypot(x - s.x, y - s.y) < rad) {
        s.dirt = Math.max(0, s.dirt - d / steps / this.need);
        if (!s.dirt) { this.fx.push({ kind: "spark", x: s.x, y: s.y, t: 0 }); Sound.se("sparkle"); }
      }
    }
    if (this.bubbles.length < 36 && d > 2) this.bubbles.push({ x: p.x + (Math.random() - 0.5) * 18, y: p.y + (Math.random() - 0.5) * 14, r: 4 + Math.random() * 6, t: 0 });
  }
  up() { this.holding = false; this.pointer = null; }
  tick(dt) {
    if (this.holding && this.fill < 1) {
      this.fill = Math.min(1, this.fill + this.speed * dt);
      if (this.fill >= 1) { this.holding = false; this.clicked = true; Sound.se("coin"); this.fx.push({ kind: "text", x: this.lid.x, y: this.lid.y - 22, t: 0, text: "カチッ！" }); }
      if (this.nextBtn) this.nextBtn.disabled = this.fill < 0.02;
      if (this.holdBtn) this.holdBtn.disabled = this.fill >= 1;
    }
    if (this.stage === "tires" && this.pointer) for (const t of this.tires) if (t.flat0 && t.air < 1 && Math.hypot(this.pointer.x - t.x, this.pointer.y - t.y) < t.r * 1.5) {
      t.air = Math.min(1, t.air + dt / 0.9);
      if (t.air >= 1) { this.fx.push({ kind: "puff", x: t.x, y: t.y, t: 0 }); Sound.se("pop"); }
    }
    this.bubbles = this.bubbles.filter((b) => (b.t += dt) < 1.1);
    this.fx = this.fx.filter((f) => (f.t += dt) < 0.9);
  }
  fuelPts() {
    if (this.fuel !== this.want.fuel || this.fill <= 0) return 0;
    const a = this.want.amount, x = this.fill, off = x < a.lo ? a.lo - x : x > a.hi ? x - a.hi : 0;
    return Math.max(0, 40 - off * 200);
  }
  washPts() { return (40 * this.spots.reduce((n, s) => n + (1 - s.dirt), 0)) / this.spots.length; }
  tirePts() { const f = this.tires.filter((t) => t.flat0); return f.length ? (20 * f.reduce((n, t) => n + t.air, 0)) / f.length : 20; }
  score() { return this.fuelPts() + this.washPts() + this.tirePts() - this.mistakes * 8 - this.sc.timePenalty(); }
  timeout() { return Math.min(40, this.score() - 20); }
  // ふきだし: ノズルの いろと なまえ・りょう・せんしゃ（Lv.3 から タイヤ）
  drawOrder(ctx, x, y, w, h) {
    const f = GAS_FUELS.find((q) => q.id === this.want.fuel), a = this.want.amount, font = "'M PLUS Rounded 1c', sans-serif", row = Math.min(28, h / 3);
    ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "middle";
    GasStand.nozzle(ctx, x + 16, y + row * 0.5, f.col, 0.8);
    ctx.fillStyle = INK; ctx.font = `900 13px ${font}`; ctx.fillText(f.name, x + 36, y + row * 0.5, w - 40);
    GasStand.gauge(ctx, x + 4, y + row * 1.5 - 6, 26, 12, a, a.hi >= 1 ? 1 : (a.lo + a.hi) / 2);
    ctx.fillStyle = INK; ctx.fillText(a.name, x + 36, y + row * 1.5, w - 40);
    ctx.font = `800 12px ${font}`; ctx.fillText(this.lv >= 3 ? "せんしゃ ＋ タイヤ" : "せんしゃも おねがい", x + 4, y + row * 2.5, w - 8);
    ctx.restore();
  }
  draw(ctx) {
    const R = this.R, font = "'M PLUS Rounded 1c', sans-serif";
    ctx.save();
    // ゆか（スタンドの コンクリート）と 白い せん
    ctx.fillStyle = "#E7E3DA"; U.rr(ctx, R.x + 6, this.carY + this.carH * 0.82, R.w - 12, this.carH * 0.24, 10); ctx.fill();
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(R.x + 24, this.carY + this.carH * 1.02); ctx.lineTo(R.x + R.w - 24, this.carY + this.carH * 1.02); ctx.stroke();
    if (this.stage === "fuel") GasStand.pump(ctx, R.x + R.w - 42, this.carY - 6, this.carH * 1.04, this.fuels, this.fuel, this.lid, this.holding);
    // くるま（SVG）と タイヤ（canvas。ぺしゃんこに できる）
    const key = "gas:car:" + this.shape + ":" + this.ci, c = SvgCache.get(key, () => gasCarSvg(this.shape, this.ci), Math.ceil(this.carW * G.px), Math.ceil(this.carH * G.px));
    if (c) ctx.drawImage(c, this.carX, this.carY, this.carW, this.carH);
    for (const t of this.tires) GasStand.tire(ctx, t.x, t.y, t.r, t.air);
    if (this.stage === "fuel" && this.fuel) GasStand.hose(ctx, R.x + R.w - 64, this.carY + 50 + this.fuels.findIndex((f) => f.id === this.fuel) * 22, this.lid, GAS_FUELS.find((f) => f.id === this.fuel).col);
    for (const s of this.spots) if (s.dirt > 0) { ctx.save(); ctx.globalAlpha = 0.3 + s.dirt * 0.7; topIcon(ctx, "dirt", s.x, s.y, this.carW * (0.08 + s.dirt * 0.06)); ctx.restore(); }
    for (const b of this.bubbles) { ctx.save(); ctx.globalAlpha = 1 - b.t / 1.1; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#9CC3D5"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y - b.t * 12, b.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (this.stage === "tires") for (const t of this.tires) if (t.flat0 && t.air < 1) {
      ctx.strokeStyle = "#FFFDF6"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 1.25, -Math.PI / 2, -Math.PI / 2 + t.air * Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#E8453C"; ctx.font = `900 12px ${font}`; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#FFFFFF"; ctx.strokeText("ぺしゃんこ", t.x, t.y - t.r - 12); ctx.fillText("ぺしゃんこ", t.x, t.y - t.r - 12);
    }
    if (this.stage === "wash" && this.pointer) GasStand.sponge(ctx, this.pointer.x, this.pointer.y);
    if (this.stage === "tires" && this.pointer) GasStand.pumpGun(ctx, this.pointer.x, this.pointer.y);
    for (const f of this.fx) {
      const k = f.t / 0.9; ctx.save(); ctx.globalAlpha = 1 - k;
      if (f.kind === "spark") FX.sparkles(ctx, f.x, f.y, k);
      else if (f.kind === "puff") { ctx.fillStyle = "#FFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * (8 + k * 16), f.y + Math.sin(a) * (8 + k * 16), 6 * (1 - k * 0.6), 0, 7); ctx.fill(); ctx.stroke(); } }
      else { ctx.font = `900 16px ${font}`; ctx.textAlign = "center"; ctx.lineWidth = 5; ctx.strokeStyle = "#FFF"; ctx.fillStyle = "#E8453C"; ctx.strokeText(f.text, f.x, f.y - k * 14); ctx.fillText(f.text, f.x, f.y - k * 14); }
      ctx.restore();
    }
    // きゅうゆの メーター（みどりの ところで はなす）
    if (this.stage === "fuel") {
      const gy = R.y + R.h - (this.lv >= 2 ? 142 : 88), gx = R.x + 20, gw = R.w - 40;
      GasStand.gauge(ctx, gx, gy, gw, 20, this.want.amount, this.fill, true);
      ctx.fillStyle = INK; ctx.font = `800 12px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(Math.round(this.fill * 100) + "%　" + (this.clicked ? "カチッ！ まんたん" : "みどりの ところで はなす"), R.x + R.w / 2, gy - 11);
    }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `800 13px ${font}`;
    ctx.fillText({ fuel: this.lv >= 2 && !this.fuel ? "ちゅうもんの いろの ノズルを えらんでね" : "ながおしで ガソリンを いれよう", wash: "よごれを ゆびで ごしごし こすってね", tires: "ぺしゃんこの タイヤを ながおし！" }[this.stage], R.x + R.w / 2, R.y + 20, R.w - 16);
    if (this.stage === "wash") { ctx.font = `800 11px ${font}`; ctx.fillText("ぴかぴか " + Math.round((this.washPts() / 40) * 100) + "%", R.x + R.w / 2, R.y + R.h - 62); }
    ctx.restore();
  }
  // テスト（PokaDebug.mg）の ための いまの ようす
  debug(css) {
    const f = GAS_FUELS.find((q) => q.id === this.want.fuel);
    return { stage: this.stage, choose: this.lv >= 2, fuel: this.fuel, fuelName: f.name, amount: { ...this.want.amount }, fill: this.fill, car: this.shape,
      spots: this.spots.map((s) => ({ ...css(s.x, s.y), dirt: s.dirt })), tires: this.tires.map((t) => ({ ...css(t.x, t.y), flat: t.flat0, air: t.air })), mistakes: this.mistakes };
  }
  // おみせの おく（たなに オイルの かんと タイヤ）
  static backdrop(ctx, sc, W) {
    for (let i = 0; i < 5; i++) {
      const x = W * 0.56 + i * (W * 0.085);
      ctx.fillStyle = ["#E8453C", "#F7C948", "#4FAE5A", "#8EC5F4", "#F7B267"][i]; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      U.rr(ctx, x - 7, 38, 14, 22, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#FFFDF6"; ctx.fillRect(x - 4, 45, 8, 6);
      GasStand.tire(ctx, x, 110, 9, 1);
    }
  }
}

// 絵の 部品（canvas）: ノズル・メーター・きゅうゆき・タイヤ・スポンジ
const GasStand = {
  nozzle(ctx, x, y, col, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = "round";
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(6, -8); ctx.lineTo(10, 4); ctx.lineTo(-2, 10); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#B9B4AC"; ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(18, -10); ctx.lineTo(19, -6); ctx.lineTo(8, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  gauge(ctx, x, y, w, h, amount, fill, big = false) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = big ? 2.5 : 1.8;
    U.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.fillStyle = "#BDE5B2"; ctx.fillRect(x + w * amount.lo, y + 1, w * (amount.hi - amount.lo) - (amount.hi >= 1 ? 2 : 0), h - 2);
    if (fill > 0) { U.rr(ctx, x + 2, y + 2, Math.max(0, (w - 4) * Math.min(1, fill)), h - 4, (h - 4) / 2); ctx.fillStyle = fill >= amount.lo && fill <= amount.hi ? "#4FAE5A" : "#F7B267"; ctx.fill(); }
    U.rr(ctx, x, y, w, h, h / 2); ctx.stroke();
    ctx.restore();
  },
  pump(ctx, x, y, h, fuels, chosen, lid, holding) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.fillStyle = "#F4EFE6"; U.rr(ctx, x - 22, y, 44, h, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#E8453C"; U.rr(ctx, x - 22, y, 44, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2F3A3E"; U.rr(ctx, x - 15, y + 22, 30, 18, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8FF0A0"; ctx.font = "900 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(holding ? "▶▶" : "000", x, y + 31);
    // ノズルの ホルダー（えらんだ ノズルは くるまの きゅうゆこうへ いって いる）
    fuels.forEach((f, i) => { if (f.id !== chosen) this.nozzle(ctx, x - 6, y + 56 + i * 22, f.col, 0.75); else { ctx.fillStyle = "#CFC8BC"; U.rr(ctx, x - 16, y + 50 + i * 22, 16, 12, 3); ctx.fill(); ctx.stroke(); } });
    ctx.restore();
  },
  tire(ctx, x, y, r, air) {
    const squash = 1 - (1 - air) * 0.35;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.fillStyle = "#4A4550"; ctx.beginPath(); ctx.ellipse(x, y + r * (1 - squash), r * (1 + (1 - squash) * 0.35), r * squash, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#D9D4CC"; ctx.beginPath(); ctx.ellipse(x, y + r * (1 - squash), r * 0.46, r * 0.46 * squash, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  hose(ctx, x, y, lid, col) {
    ctx.save(); ctx.strokeStyle = "#3E3A40"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + lid.x) / 2 + 8, Math.max(y, lid.y) + 46, lid.x + 14, lid.y + 2); ctx.stroke();
    this.nozzle(ctx, lid.x + 6, lid.y - 2, col, 0.9); ctx.restore();
  },
  pumpGun(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = "#8EC5F4"; U.rr(ctx, x - 6, y - 22, 26, 14, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3E3A40"; ctx.fillRect(x - 12, y - 17, 8, 4); ctx.beginPath(); ctx.moveTo(x + 6, y - 8); ctx.lineTo(x + 2, y + 6); ctx.stroke(); ctx.restore();
  },
  sponge(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = "#FFD54F"; U.rr(ctx, x - 16, y - 10, 32, 20, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#F2B632"; for (const [dx, dy] of [[-8, -3], [3, 2], [9, -4], [-2, 5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2, 0, 7); ctx.fill(); }
    ctx.restore();
  },
};

MG_TASKS.gasstand = GasTask;
SHOP_OWNERS.gasstand = { sp: "lion", name: "ライオンの ブンさん", outfit: { body: "overalls", neck: "scarf_red" }, look: { eye: "smile", brow: "thick", mouth: "grin" } };
HOWTO.gasstand = [
  "ネリカス ガソリンスタンドへ ようこそ！\nきょうは おてつだい よろしくね。",
  "まずは きゅうゆ。ちゅうもんの いろの ノズルを えらんで、\nながおしで ガソリンを いれてね。",
  "メーターの みどりの ところで ゆびを はなそう。\nまんたんは カチッと とまるよ。",
  "つぎは せんしゃ。よごれを ゆびで ごしごし！\nぺしゃんこの タイヤには くうきを いれてね。",
];
// レジでは のみものと おやつ（しなぞろえと タブは js/shop-goods.js が あとで かきかえる・UI-76）
BUY_SHOPS.gasstand = { name: SHOPS.gasstand.name, keeper: SHOP_OWNERS.gasstand, keeperName: SHOP_OWNERS.gasstand.name, hello: ["いらっしゃい！ ドライブの おともに どうぞ。"], kind: "bag",
  tabs: [["goods", "のみものと おやつ"]], items: () => ["drink", "juice", "candy"].map((k) => BAG_INDEX[k]) };
// かんばんの しるし: きゅうゆき
SIGN_ICON.gasstand = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-8" y="-10" width="12" height="20" rx="2" fill="#E8453C" ${OS(1.5)}/><rect x="-5" y="-6" width="6" height="5" fill="#FFFDF6" stroke="none"/><path d="M4,-6 H8 V6 Q8,9 5,8" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/></g>`;
// 店内（10×12・斜め上の 館 js/store-iso.js）: 事務所の なか。オイルの たな・タイヤの ラック・じどうはんばいき・きょうの ガソリン・せんしゃの メニュー・まちあい
STORE_INTERIORS.gasstand = {
  wall: "#FDF0E2", wallPat: "tile", accent: "#E8453C", wainscot: "#F2C9B8", wainPat: "tile", wood: "#B8B2A6", caption: "ぴかぴか せんしゃと きゅうゆ",
  mats: { ".": { c: ["#E6E3DB", "#DCD8CE"], pat: "tile" } },
  counter: { body: "#E8453C", top: "#F2F2EE", items: ["gas", "bell"] },
  walls: {
    north: [{ t: "board", a: 0.3, b: 2.7, z0: 150, z1: 196, lines: ["タイヤ こうかん", "うけつけ ちゅう"], col: "#FFFDF4" }, { t: "sign", a: 4.0, b: 7.0, z0: 174, z1: 220 }, { t: "window", a: 7.2, b: 9.8, z0: 178, z1: 224 }],
    west: [{ t: "window", a: 2.8, b: 6.2, z0: 104, z1: 204 }, { t: "poster", a: 7.0, b: 8.4, z0: 120, z1: 196, art: `<g transform="scale(1.3)"><rect x="-14" y="-6" width="28" height="9" rx="3" fill="#8EC5F4" stroke="${INK}" stroke-width=".9"/><path d="M-8,-6 L-4,-12 H5 L9,-6 Z" fill="#CFE9F7" stroke="${INK}" stroke-width=".9"/><circle cx="-8" cy="4" r="3.4" fill="#3F4448"/><circle cx="8" cy="4" r="3.4" fill="#3F4448"/><circle cx="12" cy="-12" r="3" fill="#FFFFFF" stroke="#8EC5F4"/><circle cx="-13" cy="-11" r="2.4" fill="#FFFFFF" stroke="#8EC5F4"/></g>`, text: "せんしゃ" }, { t: "poster", a: 8.8, b: 10.2, z0: 120, z1: 196, art: `<g transform="scale(1.8)"><path d="M-5,0 V-12 L-2,-15 H5 V0 Z" fill="#F3C24F" stroke="${INK}" stroke-width=".7"/><rect x="1" y="-18" width="3" height="3" fill="#2F3540"/></g>`, text: "オイル" }, { t: "clock", a: 10.6, z: 206 }],
  },
  fixtures: [
    ["wallshelf", 4, 0, 3, 1, "エンジンオイルの たな", { variant: "oil", sign: "オイル", height: 150 }], ["toolchest", 4, 1, 1, 1, "どうぐばこ"], ["tirestack", 6, 1, 1, 1, "タイヤの やま"],
    ["tirerack", 0, 0, 3, 1, "タイヤの ラック"], ["vending", 7, 0, 2, 1, "じどうはんばいき"], ["trash", 9, 0, 1, 1, "ごみばこ", { col: "#5DA676" }],
    ["wallshelf", 0, 3, 1, 2, "カーグッズの たな", { variant: "tools", sign: "カーグッズ", height: 130, levels: 3 }],
    ["seat", 0, 6, 1, 3, "まちあいの いす", { col: "#E8453C" }], ["magazines", 2, 6, 1, 1, "ざっしの ラック"],
    ["priceboard", 7, 4, 1, 1, "きょうの ガソリン"], ["board", 9, 4, 1, 1, "せんしゃの メニュー", { lines: ["せんしゃ", "ぴかぴか", "コース"], col: "#2F6CA8" }],
    ["tirerack", 7, 8, 2, 1, "ふゆの タイヤ"], ["plant", 9, 10, 1, 1, null, { variant: "bush" }],
    ["npc", 2, 8, 1, 1, "ドライブの おきゃくさん", { sp: "dog", ci: 3, dir: "left", action: "chat", lines: ["せんしゃ したら くるまが ぴかぴか！", "ガソリン まんたんで しゅっぱつ！"] }],
  ],
};
// 店内 BGM: モーツァルト「トルコ こうしんきょく」（パブリックドメイン。ディスクの 写し）を げんきな 音で
(() => {
  const src = SONGS.disc_turkish, inst = ["pluck", "mallet", "bass"];
  if (src) SONGS.shop_gasstand = { ...src, title: "ぴかぴか トルコマーチ", disc: false, bpm: 176, tracks: src.tracks.map((t, k) => (t.drum ? t : { ...t, instrument: inst[k] || t.instrument })) };
})();
