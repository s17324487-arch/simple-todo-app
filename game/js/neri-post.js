// ネリカス ゆうびんきょくの おてつだい（オーナーの FB 2026-09-29「薄いグレーの 要素は … お手伝いや 買い物が できる ものに」）。
// おきゃくさんの てがみ・はがき・こづつみに けしいんを ぽん → あてさき（ゲームの 町）の はこへ しわける。
// 局長は やぎの メエさん（どうよう「やぎさん ゆうびん」に ちなむ。てがみは たべない）。店内の 什器・かんばんの しるし・BGM も ここで 登録する。
const POST_DESTS = [
  { id: "neri", name: "ネリカス", col: "#F4A6B8" },
  { id: "heiwa", name: "へいわだい", col: "#8FD19E" },
  { id: "ikebu", name: "いけぶくろ", col: "#8EC5F4" },
  { id: "minato", name: "みなと", col: "#7FA6D9" },
  { id: "sora", name: "くうこう", col: "#B9E1F5" },
  { id: "hara", name: "はらっぱ", col: "#F7D56A" },
];
// あてさきの しるし（64×64。町の めじるし: おうち・き・ビル・いかり・ひこうき・はな）
const POST_ICONS = {
  neri: `<path d="M12,34 L32,14 L52,34 Z" fill="#E8766A" ${IS(3)}/><rect x="17" y="33" width="30" height="20" fill="#FFF6E2" ${IS(3)}/><rect x="28" y="40" width="9" height="13" fill="#C98A52" ${IS(2.4)}/>`,
  heiwa: `<rect x="29" y="38" width="7" height="16" fill="#A0724A" ${IS(2.6)}/><circle cx="32" cy="27" r="16" fill="#8FD19E" ${IS(3)}/><circle cx="25" cy="23" r="4" fill="#B6E3BF"/>`,
  ikebu: `<rect x="14" y="26" width="14" height="28" fill="#B9C6D2" ${IS(2.6)}/><rect x="28" y="10" width="20" height="44" fill="#8EC5F4" ${IS(3)}/><path d="M33,18 h10 M33,26 h10 M33,34 h10 M33,42 h10 M18,32 h6 M18,40 h6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  minato: `<circle cx="32" cy="14" r="5" fill="none" ${IS(3)}/><path d="M32,19 V52 M22,26 H42 M14,38 C16,50 26,54 32,52 C38,54 48,50 50,38" fill="none" ${IS(3.4)}/><path d="M10,40 L14,34 L19,40 M45,40 L50,34 L54,40" fill="none" ${IS(3)}/>`,
  sora: `<path d="M8,36 L56,24 C60,23 60,29 56,30 L40,36 L30,52 L24,52 L28,38 L14,42 L10,48 L6,48 Z" fill="#FFFFFF" ${IS(3)}/><circle cx="46" cy="28" r="2" fill="#8EC5F4"/>`,
  hara: `<path d="M32,56 V34" stroke="#4E9A3E" stroke-width="4" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="32" cy="16" rx="7" ry="10" transform="rotate(${i * 72} 32 26)" fill="#F7D56A" ${IS(2.4)}/>`).join("")}<circle cx="32" cy="26" r="6" fill="#E8766A" ${IS(2.4)}/>`,
};
const postIcon = (ctx, id, x, y, s) => mgIcon(ctx, "post:" + id, () => POST_ICONS[id], x, y, s);

class PostTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    const k = [3, 4, 4, 5, 5][lv - 1], nb = [3, 4, 5, 5, 6][lv - 1];
    this.bins = U.shuffle([...POST_DESTS]).slice(0, nb);
    this.items = Array.from({ length: k }, () => ({ dest: U.pick(this.bins).id, kind: U.pick(lv >= 2 ? ["letter", "letter", "card", "parcel"] : ["letter", "card"]), stamped: false, ok: false, miss: 0 }));
    this.bins = POST_DESTS.filter((d) => this.bins.includes(d)); // はこは いつも おなじ ならび
    this.iconOnly = lv >= 4; this.index = 0; this.mistakes = 0; this.fly = null; this.hint = 0; this.shake = 0;
    this.timeLimit = 12 + k * 6 - lv; this.title = "ゆうびん おねがいします！";
  }
  get cur() { return this.items[this.index] || null; }
  layout(R) {
    this.R = R;
    const rows = Math.ceil(this.bins.length / 3); this.binTop = R.y + R.h - 10 - rows * 58 - (rows - 1) * 8;
    this.stampY = this.binTop - 54;
    const room = this.stampY - (R.y + 34) - 8; this.cardW = Math.min(R.w * 0.56, 200, room * 1.7); this.cardH = this.cardW * 0.6;
    this.cardX = R.x + (R.w - this.cardW) / 2 - R.w * 0.08; this.cardY = R.y + 34 + Math.max(0, (room - this.cardH) / 2);
    this.setup();
  }
  setup() {
    const R = this.R, cells = gridBtns(R, this.bins.length, 3, this.binTop, 58);
    this.btns = this.bins.map((d, i) => ({ ...cells[i], label: d.name, fs: 12, color: d.col, icon: (ctx, x, y, s) => postIcon(ctx, d.id, x, y, s), cb: () => this.sort(d) }));
    this.btns.push({ x: R.x + R.w / 2 - 96, y: this.stampY, w: 192, h: 44, label: "けしいんを おす", fs: 13, color: "#FFF3B0", cb: () => this.stamp() });
  }
  stamp() {
    const c = this.cur; if (!c || this.fly) return;
    if (c.stamped) { this.hint = 1.2; return; }
    c.stamped = true; Sound.se("pop"); this.stampT = 0.35;
  }
  sort(d) {
    const c = this.cur; if (!c || this.fly) return;
    if (!c.stamped) { this.hint = 1.4; this.shake = 0.3; Sound.se("tap"); return; }
    if (d.id !== c.dest) { c.miss++; this.mistakes++; this.shake = 0.3; this.sc.mistake("ちがう はこ！"); return; }
    c.ok = true; Sound.se("good");
    const b = this.btns.find((x) => x.label === d.name);
    this.fly = { t: 0, x0: this.cardX + this.cardW / 2, y0: this.cardY + this.cardH / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 };
  }
  downArea(p) {
    // てがみを タップしても けしいん
    if (p.x > this.cardX && p.x < this.cardX + this.cardW && p.y > this.cardY && p.y < this.cardY + this.cardH) this.stamp();
  }
  tick(dt) {
    if (this.hint > 0) this.hint -= dt; if (this.shake > 0) this.shake -= dt; if (this.stampT > 0) this.stampT -= dt;
    if (this.fly && (this.fly.t += dt) >= 0.35) {
      this.fly = null; this.index++;
      if (!this.cur) { this.sc.finish(this.score()); Sound.se("sparkle"); }
    }
  }
  score() {
    const n = this.items.length, first = this.items.filter((c) => c.ok && !c.miss).length, later = this.items.filter((c) => c.ok && c.miss).length, stamped = this.items.filter((c) => c.stamped).length;
    return (80 * (first + later * 0.5)) / n + (20 * stamped) / n - this.mistakes * 6 - this.sc.timePenalty();
  }
  timeout() { return Math.min(40, this.score() - 20); }
  drawItem(ctx, c, x, y, w, h, big = true) {
    const d = POST_DESTS.find((q) => q.id === c.dest), font = "'M PLUS Rounded 1c', sans-serif";
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = big ? 3 : 2;
    if (c.kind === "parcel") {
      ctx.fillStyle = "#D9A066"; U.rr(ctx, x, y, w, h, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#C28A52"; ctx.fillRect(x + w * 0.44, y + 1, w * 0.12, h - 2);
      ctx.fillStyle = "#FFFDF6"; U.rr(ctx, x + w * 0.1, y + h * 0.2, w * 0.3, h * 0.6, 4); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = c.kind === "card" ? "#FFF8E6" : "#FFFFFF"; U.rr(ctx, x, y, w, h, 6); ctx.fill(); ctx.stroke();
      if (c.kind === "letter") { ctx.strokeStyle = "#D7CCC8"; ctx.lineWidth = big ? 2 : 1.2; ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w / 2, y + h * 0.45); ctx.lineTo(x + w - 4, y + 4); ctx.stroke(); }
      else { ctx.fillStyle = "#CDEBF7"; U.rr(ctx, x + w * 0.06, y + h * 0.12, w * 0.34, h * 0.7, 4); ctx.fill(); ctx.fillStyle = "#8FD19E"; ctx.beginPath(); ctx.arc(x + w * 0.23, y + h * 0.66, w * 0.12, Math.PI, 0); ctx.fill(); }
    }
    // きって（みぎ うえ）と けしいん
    const sx = x + w * 0.78, sy = y + h * 0.1, sw = w * 0.16, sh = h * 0.28;
    ctx.fillStyle = d.col; ctx.strokeStyle = INK; ctx.lineWidth = big ? 2 : 1.2; ctx.fillRect(sx, sy, sw, sh); ctx.strokeRect(sx, sy, sw, sh);
    if (c.stamped) { ctx.strokeStyle = "#C62828"; ctx.lineWidth = big ? 2.4 : 1.4; ctx.beginPath(); ctx.arc(sx + sw * 0.2, sy + sh * 0.7, sh * 0.62, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx - sh * 0.4, sy + sh * 0.7); ctx.lineTo(sx + sw * 0.8, sy + sh * 0.7); ctx.stroke(); }
    // あてさき（しるしと なまえ。Lv.4 から しるしだけ）
    const ix = c.kind === "parcel" ? x + w * 0.25 : x + w * 0.62, iy = y + h * 0.56;
    postIcon(ctx, d.id, ix, iy - (this.iconOnly || !big ? 0 : h * 0.08), Math.min(w, h) * (big ? 0.42 : 0.5));
    if (big && !this.iconOnly) { ctx.fillStyle = INK; ctx.font = `900 ${Math.round(h * 0.15)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.name + " あて", ix, y + h * 0.86, w * 0.6); }
    ctx.restore();
  }
  drawOrder(ctx, x, y, w, h) {
    const n = this.items.length, gap = 6, iw = Math.min(40, (w - gap * (n - 1)) / n), ih = iw * 0.66, font = "'M PLUS Rounded 1c', sans-serif";
    ctx.save();
    this.items.forEach((c, i) => {
      const ix = x + (w - (iw * n + gap * (n - 1))) / 2 + i * (iw + gap);
      if (c.ok) ctx.globalAlpha = 0.35;
      this.drawItem(ctx, c, ix, y + 6, iw, ih, false); ctx.globalAlpha = 1;
    });
    ctx.fillStyle = INK; ctx.font = `800 12px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(n + "つ おねがい", x + w / 2, y + ih + 22); ctx.font = `800 11px ${font}`; ctx.fillText("けしいん → あてさきの はこ", x + w / 2, y + ih + 40, w);
    ctx.restore();
  }
  draw(ctx) {
    const R = this.R, font = "'M PLUS Rounded 1c', sans-serif", c = this.cur;
    ctx.save();
    // しわけの だい（ベルト）と つぎの てがみ
    ctx.fillStyle = "#E3DCCF"; U.rr(ctx, R.x + 8, this.cardY + this.cardH * 0.7, R.w - 16, this.cardH * 0.44, 12); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = "#C9BBA3"; ctx.lineWidth = 2; for (let x = R.x + 20 + ((G.t * 30) % 24); x < R.x + R.w - 12; x += 24) { ctx.beginPath(); ctx.moveTo(x, this.cardY + this.cardH * 0.76); ctx.lineTo(x - 8, this.cardY + this.cardH * 1.08); ctx.stroke(); }
    const rest = this.items.slice(this.index + 1);
    rest.slice(0, 3).forEach((q, i) => this.drawItem(ctx, q, this.cardX + this.cardW + 16 + i * 10, this.cardY + 10 + i * 8, this.cardW * 0.42, this.cardH * 0.42, false));
    if (c) {
      let x = this.cardX, y = this.cardY, s = 1;
      if (this.shake > 0) x += Math.sin(this.shake * 60) * 5;
      if (this.fly) { const k = U.ease.outCubic(Math.min(1, this.fly.t / 0.35)); x = U.lerp(this.cardX, this.fly.x1 - this.cardW * 0.2, k); y = U.lerp(this.cardY, this.fly.y1 - this.cardH * 0.2, k); s = 1 - k * 0.6; }
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); this.drawItem(ctx, c, 0, 0, this.cardW, this.cardH, true); ctx.restore();
      if (this.stampT > 0) { const k = 1 - this.stampT / 0.35; ctx.save(); ctx.globalAlpha = Math.min(1, this.stampT / 0.15); PostOffice.hanko(ctx, this.cardX + this.cardW * 0.86, this.cardY + this.cardH * 0.36 - (1 - k) * 12); ctx.restore(); }
    }
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `800 13px ${font}`;
    const say = !c ? "おしまい！" : this.hint > 0 && !c.stamped ? "さきに けしいんを おしてね" : !c.stamped ? "けしいんを ぽん！（ボタンか てがみを タップ）" : "あてさきと おなじ はこへ いれよう";
    ctx.fillText(say, R.x + R.w / 2, R.y + 20, R.w - 16);
    ctx.font = `800 11px ${font}`; ctx.fillText("のこり " + Math.max(0, this.items.length - this.index) + "つ", R.x + R.w - 40, this.stampY + 26);
    ctx.restore();
  }
  debug(css) {
    const c = this.cur, d = c && POST_DESTS.find((q) => q.id === c.dest);
    return { index: this.index, total: this.items.length, iconOnly: this.iconOnly, mistakes: this.mistakes, bins: this.bins.map((b) => b.name),
      cur: c ? { name: d.name, kind: c.kind, stamped: c.stamped, ...css(this.cardX + this.cardW / 2, this.cardY + this.cardH / 2) } : null, flying: !!this.fly };
  }
  // おみせの おく（たなに てがみと こづつみ）
  static backdrop(ctx, sc, W) {
    for (let i = 0; i < 5; i++) {
      const x = W * 0.56 + i * (W * 0.085);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x - 9, 42, 18, 13); ctx.strokeRect(x - 9, 42, 18, 13);
      ctx.fillStyle = POST_DESTS[i].col; ctx.fillRect(x + 3, 44, 4, 5);
      ctx.fillStyle = "#D9A066"; ctx.fillRect(x - 9, 100, 18, 16); ctx.strokeRect(x - 9, 100, 18, 16); ctx.fillStyle = "#C28A52"; ctx.fillRect(x - 2, 101, 4, 14);
    }
  }
}

const PostOffice = {
  // ゴムの はんこ（けしいん）
  hanko(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = "#A0724A"; U.rr(ctx, x - 5, y - 26, 10, 18, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#E8453C"; U.rr(ctx, x - 12, y - 10, 24, 10, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
};

MG_TASKS.postoffice = PostTask;
SHOP_OWNERS.postoffice = { sp: "goat", name: "やぎの メエさん", outfit: { face: "glasses", neck: "bowtie_blue" }, look: { eye: "oval", brow: "soft", cheek: "pink" } };
HOWTO.postoffice = [
  "ネリカス ゆうびんきょくへ ようこそ メエ〜。\nてがみは たべたり しないから あんしんしてね。",
  "まずは てがみに けしいんを ぽん！\nボタンか てがみを タップしてね。",
  "つぎに あてさきと おなじ はこを えらんで いれよう。\nまちがえると とどかないよ。",
];
// かんばんの しるし: ふうとう
SIGN_ICON.postoffice = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-10" y="-7" width="20" height="14" rx="2" fill="#FFFFFF" ${OS(1.5)}/><path d="M-9,-6 L0,1 L9,-6" fill="none" stroke="${INK}" stroke-width="1.4"/><rect x="4" y="-5" width="4" height="4" fill="#E8453C" stroke="none"/></g>`;
// 店内（10×12）: まどぐち・ポスト・ゆうびんうけの ロッカー・こづつみの はかり・きっての ケース・てがみを かく だい
(() => {
  const r = (x, y, w, h, col, rr = 4) => StoreArt.rect(x, y, w, h, col, rr), p = (d, col = "none") => StoreArt.path(d, col), c = (x, y, rr, col) => StoreArt.dot(x, y, rr, col);
  const PROPS = {
    postbox: () => r(78, 20, 64, 34, "#E53935", 18) + r(78, 36, 64, 118, "#E53935", 6) + r(92, 56, 36, 7, INK, 2) + r(96, 92, 28, 30, "#FFFDF6", 3) + p("M104,100 h12 M110,100 v16 M102,108 h16") + r(86, 154, 48, 22, "#B71C1C", 3),
    pobox: () => { let a = r(12, 20, 196, 156, "#C9C1B3", 6); for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) a += r(22 + x * 38, 30 + y * 48, 32, 40, "#E6E1D6", 3) + c(48 + x * 38, 50 + y * 48, 3, "#8C8890"); return a; },
    parcelscale: () => r(30, 110, 160, 60, "#D9D4CC", 8) + r(40, 96, 140, 16, "#B9B4AC", 4) + r(70, 50, 80, 48, "#D9A066", 4) + p("M110,50 V98") + r(126, 128, 44, 22, "#2F3A3E", 3) + `<text x="148" y="144" text-anchor="middle" font-size="12" font-family="sans-serif" font-weight="bold" fill="#8FF0A0" stroke="none">1.2</text>` + p("M40,170 V184 M180,170 V184"),
    stampcase: () => { let a = r(14, 70, 192, 100, "#D9C7A6") + r(22, 44, 176, 36, "#E6F4FA", 4); for (let i = 0; i < 6; i++) a += r(30 + i * 28, 50, 22, 24, ["#F4A6B8", "#8FD19E", "#8EC5F4", "#F7D56A", "#C7B8E8", "#F7B267"][i], 2); return a + p("M14,110 H206") + p("M26,170 V182 M194,170 V182"); },
    writingdesk: () => r(20, 80, 180, 20, "#C98A52", 4) + p("M34,100 V176 M186,100 V176") + r(50, 60, 60, 22, "#FFFFFF", 2) + p("M54,64 L80,76 L106,64") + r(130, 50, 12, 30, "#8EC5F4", 3) + r(152, 62, 30, 18, "#FFF3B0", 2),
  };
  const prop0 = StoreArt.prop.bind(StoreArt);
  StoreArt.prop = (kind) => (PROPS[kind] ? StoreArt.svg(PROPS[kind]()) : prop0(kind));
  STORE_INTERIORS.postoffice = { wall: "#FBE9E4", floor: "#EEE9E0", accent: "#E53935", motif: "tile", caption: "てがみと こづつみを とどけよう", fixtures: [
    ["pobox", 0, 0, 3, 2, "ゆうびんうけの ロッカー"], ["stampcase", 8, 0, 2, 2, "きっての ケース"], ["parcelscale", 0, 5, 3, 2, "こづつみの はかり"], ["writingdesk", 7, 5, 3, 2, "てがみを かく だい"], ["waiting", 0, 9, 3, 1, "まちあいの いす"], ["postbox", 8, 9, 2, 1, "あかい ポスト"]] };
  // 店内 BGM: ヘンデル「ガヴォット」（パブリックドメイン。サンシャインいけぶ 1F の 写し）を ていねいな 音で
  const src = SONGS.mall_1f, inst = ["mallet", "pluck", "bass"];
  if (src) SONGS.shop_postoffice = { ...src, title: "ゆうびんの ガヴォット", disc: false, mall: undefined, bpm: 88, tracks: src.tracks.map((t, k) => (t.drum ? t : { ...t, instrument: inst[k] || t.instrument })) };
})();
