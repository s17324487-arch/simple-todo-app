// おみせの おてつだい（プチプチおみせっち風ミニゲーム）
// おきゃくさんが来る → ちゅうもん → タッチで作業 → ひょうか → コイン → ひょうばんで お店がレベルアップ

// ---- ミニゲーム用の絵（viewBox 0 0 64 64） ----
const MG_ART = {
  ichigo: `<path d="M32,58 C18,50 10,36 14,24 C18,14 28,16 32,18 C36,16 46,14 50,24 C54,36 46,50 32,58 Z" fill="#E8453C" ${IS()}/><path d="M22,16 L32,22 L42,16 L38,10 L32,14 L26,10 Z" fill="#6DBE5B" ${IS(2.4)}/><circle cx="24" cy="30" r="1.8" fill="#FFE066"/><circle cx="34" cy="34" r="1.8" fill="#FFE066"/><circle cx="42" cy="28" r="1.8" fill="#FFE066"/><circle cx="28" cy="42" r="1.8" fill="#FFE066"/><circle cx="38" cy="44" r="1.8" fill="#FFE066"/>`,
  banana: `<circle cx="32" cy="32" r="22" fill="#FFF3B0" ${IS()}/><circle cx="32" cy="32" r="15" fill="#FFE98A"/><circle cx="32" cy="26" r="2" fill="#A08040"/><circle cx="27" cy="35" r="2" fill="#A08040"/><circle cx="37" cy="35" r="2" fill="#A08040"/>`,
  choco: `<rect x="12" y="16" width="40" height="32" rx="4" fill="#7A4A2A" ${IS()}/><path d="M12,32 L52,32 M25,16 L25,48 M39,16 L39,48" stroke="#5A3218" stroke-width="3"/><path d="M16,20 L20,20" stroke="#A8744A" stroke-width="3" stroke-linecap="round"/>`,
  cream: `<path d="M12,48 C8,40 16,34 22,36 C18,26 30,20 34,28 C36,18 50,20 48,32 C56,34 56,46 48,48 Z" fill="#FFFFFF" ${IS()}/><path d="M22,36 C26,40 32,40 36,36 M34,28 C38,32 42,32 46,30" fill="none" stroke="#D9D4CC" stroke-width="2.4" stroke-linecap="round"/>`,
  blue: `<circle cx="22" cy="36" r="11" fill="#5C6BC0" ${IS()}/><circle cx="42" cy="36" r="11" fill="#5C6BC0" ${IS()}/><circle cx="32" cy="22" r="11" fill="#7986CB" ${IS()}/><path d="M29,19 L35,19 M32,16 L32,22" stroke="#283593" stroke-width="2"/><circle cx="18" cy="32" r="2.4" fill="#FFF" fill-opacity="0.6"/>`,
  kiwi: `<circle cx="32" cy="32" r="22" fill="#8BC34A" ${IS()}/><circle cx="32" cy="32" r="15" fill="#AED581"/><ellipse cx="32" cy="32" rx="6" ry="4" fill="#F1F8E9"/>${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<ellipse cx="${f2(32 + Math.cos(a) * 10)}" cy="${f2(32 + Math.sin(a) * 10)}" rx="1.4" ry="2.4" transform="rotate(${f2((a * 180) / Math.PI + 90)} ${f2(32 + Math.cos(a) * 10)} ${f2(32 + Math.sin(a) * 10)})" fill="${INK}"/>`; }).join("")}`,
  ice: `<path d="M16,40 C12,24 22,12 32,12 C42,12 52,24 48,40 C46,46 44,44 42,48 C40,52 36,46 34,50 C30,54 28,46 24,48 C20,50 18,44 16,40 Z" fill="#FFF3D6" ${IS()}/><circle cx="26" cy="24" r="4" fill="#FFF" fill-opacity="0.8"/>`,
  custard: `<path d="M10,44 C10,30 20,22 32,22 C44,22 54,30 54,44 C44,50 20,50 10,44 Z" fill="#FFD54F" ${IS()}/><path d="M18,34 C22,30 28,28 32,28" fill="none" stroke="#FFF3B0" stroke-width="4" stroke-linecap="round"/>`,
  chip: `<path d="M20,46 C20,36 26,24 32,20 C38,24 44,36 44,46 Z" fill="#6D4226" ${IS()}/>`,
  almond: `<ellipse cx="32" cy="32" rx="12" ry="20" transform="rotate(30 32 32)" fill="#D9A066" ${IS()}/><path d="M28,24 C30,32 32,38 36,42" fill="none" stroke="#B07A45" stroke-width="2"/>`,
  berry: `<path d="M32,54 C20,48 14,36 18,26 C22,18 30,20 32,22 C34,20 42,18 46,26 C50,36 44,48 32,54 Z" fill="#E8453C" ${IS()}/><path d="M24,20 L32,26 L40,20" fill="#6DBE5B" ${IS(2.4)}/>`,
  germ: `<path d="M32,10 C44,10 54,20 54,32 C54,44 44,54 32,54 C20,54 10,44 10,32 C10,20 20,10 32,10 Z" fill="#9C6ADE" ${IS()}/><path d="M10,24 L4,20 M54,24 L60,20 M16,50 L10,56 M48,50 L54,56 M32,10 L32,4" ${IS(3)}/><path d="M20,26 L28,30 M44,26 L36,30" ${IS(3)}/><circle cx="25" cy="33" r="3.2" fill="${INK}"/><circle cx="39" cy="33" r="3.2" fill="${INK}"/><path d="M24,44 L28,40 L32,44 L36,40 L40,44" fill="none" ${IS(2.6)}/>`,
  dirt: `<path d="M14,30 C12,20 26,14 32,20 C40,12 54,22 48,32 C56,40 44,52 34,46 C26,54 12,46 16,38 C10,36 10,32 14,30 Z" fill="#B08858" fill-opacity="0.9" ${IS(2.4)}/>`,
  cavity: `<circle cx="32" cy="32" r="14" fill="#3A2A22" ${IS()}/><circle cx="28" cy="28" r="3" fill="#6A5244"/>`,
};
function breadSvg(id, done = 0.5) {
  // done: 0(なま)〜1(こんがり)〜1.4(こげ)
  const stops = [[0, [246, 231, 200]], [0.45, [242, 211, 154]], [0.8, [224, 168, 96]], [1.05, [185, 122, 62]], [1.4, [70, 50, 40]]];
  let c = stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) if (done <= stops[i + 1][0]) { const [a, ca] = stops[i], [b, cb] = stops[i + 1]; const k = (done - a) / (b - a); c = ca.map((v, j) => Math.round(v + (cb[j] - v) * k)); break; }
  const col = `rgb(${c.join(",")})`, dk = `rgb(${c.map((v) => Math.round(v * 0.78)).join(",")})`;
  switch (id) {
    case "melon": return `<path d="M8,40 C8,20 20,12 32,12 C44,12 56,20 56,40 C56,50 8,50 8,40 Z" fill="${col}" ${IS()}/><path d="M16,26 L40,48 M28,16 L52,38 M40,14 L18,40 M52,24 L30,46" stroke="${dk}" stroke-width="2.4"/>`;
    case "croissant": return `<path d="M6,38 C10,22 22,16 32,16 C42,16 54,22 58,38 C52,36 48,40 46,44 C40,40 36,42 32,46 C28,42 24,40 18,44 C16,40 12,36 6,38 Z" fill="${col}" ${IS()}/><path d="M20,24 C22,32 22,38 18,44 M32,18 L32,46 M44,24 C42,32 42,38 46,44" fill="none" stroke="${dk}" stroke-width="2.4"/>`;
    case "anpan": return `<ellipse cx="32" cy="36" rx="24" ry="16" fill="${col}" ${IS()}/><ellipse cx="32" cy="28" rx="6" ry="3" fill="#FFF7E0" ${IS(1.6)}/><path d="M16,34 C20,28 26,26 30,26" fill="none" stroke="#FFF3D0" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>`;
    case "shoku": return `<path d="M10,52 L10,26 C10,14 20,10 32,14 C44,10 54,14 54,26 L54,52 Z" fill="${col}" ${IS()}/><path d="M16,52 L16,28 C16,20 24,18 32,21 C40,18 48,20 48,28 L48,52" fill="#FFF3D6"/><path d="M16,52 L16,28 C16,20 24,18 32,21 C40,18 48,20 48,28 L48,52" fill="none" stroke="${dk}" stroke-width="2"/>`;
  }
  return "";
}
const CREPE_TOPS = [
  { id: "ichigo", name: "いちご" }, { id: "banana", name: "バナナ" }, { id: "choco", name: "チョコ" }, { id: "cream", name: "ホイップ" },
  { id: "blue", name: "ブルーベリー" }, { id: "kiwi", name: "キウイ" }, { id: "ice", name: "アイス" }, { id: "custard", name: "カスタード" },
];
const BREADS = [{ id: "melon", name: "メロンパン" }, { id: "croissant", name: "クロワッサン" }, { id: "anpan", name: "あんぱん" }, { id: "shoku", name: "しょくパン" }];
const BREAD_TOPS = [{ id: "chip", name: "チョコチップ" }, { id: "almond", name: "アーモンド" }, { id: "berry", name: "いちご" }];
const FLOWER_KINDS = [
  { id: "red", name: "あか", col: "#E8453C" }, { id: "pink", name: "ピンク", col: "#F48FB1" }, { id: "yellow", name: "きいろ", col: "#FFD54F" },
  { id: "white", name: "しろ", col: "#FFFFFF" }, { id: "blue", name: "あお", col: "#64B5F6" }, { id: "purple", name: "むらさき", col: "#B388FF" },
];
const RIBBONS = [{ id: "pink", name: "ピンク", col: "#F48FB1" }, { id: "blue", name: "みずいろ", col: "#64B5F6" }, { id: "yellow", name: "きいろ", col: "#FFD54F" }, { id: "red", name: "あか", col: "#E8453C" }];
function flowerIconSvg(col) {
  return `<path d="M32,60 L32,34" stroke="#4E9A3E" stroke-width="4" stroke-linecap="round"/><path d="M32,48 C24,42 18,46 16,50 C24,52 28,50 32,48 Z" fill="#6DBE5B" ${IS(2)}/>${flowerSvg(32, 24, 9, col, "#FFB74D", 2.6)}`;
}
function mgCanvas(key, inner, size) {
  const px = Math.max(8, Math.ceil(size * G.px));
  return SvgCache.get("mg:" + key, () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner()}</svg>`, px, px);
}
function mgIcon(ctx, key, inner, x, y, size) {
  const c = mgCanvas(key, inner, size);
  if (c) ctx.drawImage(c, x - size / 2, y - size / 2, size, size);
}
const topIcon = (ctx, id, x, y, s) => mgIcon(ctx, id, () => MG_ART[id], x, y, s);

// ---- 店主とおきゃくさん ----
const SHOP_OWNERS = {
  crepe: { sp: "cat", col: "#FFFFFF", name: "ねこの マダム・ミルク", outfit: { head: "chefhat", body: "apron" } },
  dentist: { sp: "rabbit", name: "うさぎの ハミガキせんせい", outfit: { face: "glasses", body: "apron" } },
  bakery: { sp: "bear", col: "#D9A066", name: "くまの ブレッドさん", outfit: { head: "chefhat", neck: "scarf_red" } },
  florist: { sp: "frog", name: "かえるの フローラ", outfit: { head: "flowercrown", body: "apron" } },
};
const HOWTO = {
  crepe: ["いらっしゃい！ きょうは クレープやさんを てつだってね。", "おきゃくさんの ふきだしに ある トッピングを\nしたの ボタンで のせて「できあがり」！", "レベルが あがると ちゅうもんが すぐ きえちゃう。\nよく おぼえてね。"],
  dentist: ["はいしゃの ハミガキです。てつだって くれるのね！", "はに いる ばいきんを タップして やっつけて。\nちゃいろい よごれは ゆびで ゴシゴシ こするの。", "くろい むしばは ながおしで けずるのよ。\nけんこうな はを たたくと いたがるから ちゅうい！"],
  bakery: ["パンやへ ようこそ！ まずは ちゅうもんの パンを えらんで、", "オーブンで やこう。メーターが ちゅうもんの\nやきかげんに なったら「とりだす！」だよ。", "こげちゃうと だいなし！\nトッピングの かずも まちがえないでね。"],
  florist: ["おはなやさんへ ようこそ ケロ。", "ちゅうもんの いろの はなを、ちゅうもんの かずだけ\nバケツから とってね。", "さいごに リボンの いろを えらんで かんせい！"],
};
const CUST_SP = ["cat", "rabbit", "bear", "penguin", "frog", "sheep", "mouse", "pig"];
const CUST_COLS = { cat: ["#F5C07A", "#FFFFFF", "#B9B4C4", "#6B6B78"], rabbit: ["#FFFFFF", "#F6E3BF", "#D7CCC8"], bear: ["#B98555", "#8D6E63", "#F2D9B8"], penguin: ["#3E4E72", "#5B6275"], frog: ["#8BCB6B", "#A5D6A7"], sheep: ["#FFFFFF", "#FFF3E0"], mouse: ["#B9B4C4", "#D7CCC8"], pig: ["#F8B9C6", "#FFCCBC"] };
const CUST_HATS = ["ribbon_pink", "ribbon_blue", "beret", "knit", "strawhat", "partyhat", "catears", null, null, null, null];
const CUST_BODY = ["tshirt_blue", "stripe", "dress", "sweater", "overalls", null, null, null];

class ShopScene {
  async enter(p) {
    this.shopId = p.shop; this.back = p.back;
    this.returnStore = !!p.returnStore; this.returnVenue = p.returnVenue || null; this.variant=p.variant;
    this.S = this.variant==='mac'?{...SHOPS[p.shop],name:'マックさん'}:SHOPS[p.shop]; this.st = Save.d.shops[p.shop];
    this.lv = ShopRewards.level(this.st); this.workLv = Math.min(5, this.lv); this.dailyBoost = DailyPlay.boost(this.shopId);
    this.total = this.S.rounds || 3 + Math.min(4, this.lv);
    this.difficulty = Save.d.settings.difficulty;
    this.n = 0; this.earn = 0; this.tips = 0; this.rep = 0; this.ranks = [];
    this.phase = "intro";
    this.fxs = []; this.coinsFx = [];
    this.team = Save.d.order.map((id, i) => ({ id, i, turn: 0, jump: -1, emo: "normal" }));
    this.owner = SHOP_OWNERS[this.shopId];
    this.layout();
    await this.preload();
    this.homeBtn = UI.btn("やめる", () => this.requestStop(), "home-shortcut small");
    this.homeBtn.setAttribute("aria-label", "おてつだいを やめる");
    document.getElementById("ui").append(this.homeBtn);
    Sound.bgm("shop_" + this.shopId);
    this.flow().catch((e) => { console.error(e); Game.goto("world", this.back); });
  }
  exit() {
    this.closed = true; this.homeBtn?.remove();
    this.finish?.(null);
    if (this.tw) { const w = this.tw; this.tw = null; w.res(); }
  }
  async requestStop() {
    if (UI.busy || Game.trans || this.closed || this.stopAsked || this.phase !== "work") return;
    this.stopAsked = true;
    this.task?.up?.(null, true);
    const total = this.earn + this.tips;
    const yes = await UI.confirm(
      'おてつだいを ここで やめる？\nおわった ' + this.ranks.length + 'にんぶんの ' + total + 'コインを もらえるよ。\nいまの ちゅうもんは コインと ひょうばんに ならないよ。',
      'ここで やめる', 'つづける');
    this.stopAsked = false;
    if (!yes || this.closed) return;
    this.stopping = true;
    this.finish?.(null);
  }
  layout() {
    const W = G.W, H = G.H;
    this.viewH = Math.round(Math.min(H * 0.4, 330));
    this.counterY = this.viewH - 74;
    this.R = { x: 10, y: this.viewH + 40, w: W - 20, h: H - this.viewH - 52 };
    this.custX = W * 0.29;
  }
  resize() { this.layout(); if (this.task && this.task.layout) this.task.layout(this.R); else if (this.board?.layout) this.board.layout(this.R); }
  async preload() {
    const list = [];
    for (const t of this.team) {
      const c = Save.d.chars[t.id];
      for (const [pose, dir, face] of [["idle_01", "up", "normal"], ["idle_02", "up", "normal"], ["idle_01", "down", "happy"], ["jump_01", "down", "happy"], ["idle_01", "down", "sad"], ["idle_01", "down", "surprise"]]) list.push([t.id, { pose, dir, face, outfit: c.outfit, color: c.color }]);
    }
    await Chara.preload(list, 62);
  }
  npcC(spec, size) {
    const key = "npc:" + JSON.stringify(spec);
    const pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    return SvgCache.get(key, () => Art.npcSvg(spec), pw, ph);
  }
  makeCustomer() {
    if (typeof NpcCast !== "undefined" && NpcCast.customers.length) return { ...NpcCast.customer(), x: -60, emo: "normal" }; // 町の人と おなじ 絵の きまった 60人から（1人ずつ ちがう）
    const sp = U.pick(CUST_SP);
    const outfit = {};
    const hat = U.pick(CUST_HATS); if (hat) outfit.head = hat;
    const body = U.pick(CUST_BODY); if (body && sp !== "penguin") outfit.body = body;
    return { sp, col: U.pick(CUST_COLS[sp]), outfit, x: -60, emo: "normal", name: SPECIES[sp].name + "さん" };
  }

  // ---- 進行 ----
  async flow() {
    const face = Art.npcSvg({ ...this.owner, emo: "happy" });
    const first = !this.st.plays;
    const lines = this.variant==='mac' ? [...MacShop.howto] : first ? [...HOWTO[this.shopId]] : [`きょうも よろしくね！ おきゃくさんは ${this.total}にん。\n（おみせ Lv.${this.lv}）`];
    if(this.dailyBoost>1)lines.push('きょうの おすすめ！ コインが 1.2ばいだよ。');
    await UI.say(lines.map((text) => ({ name: this.owner.name, face, text })));
    if (this.closed) return;
    for (this.n = 0; this.n < this.total; this.n++) {
      this.cust = this.makeCustomer();
      this.phase = "enter";
      Sound.se("door");
      await this.tween(0.9, (k) => (this.cust.x = U.lerp(-60, this.custX, U.ease.outCubic(k))));
      if (this.closed) return;
      this.task = new (this.variant==="mac"?MacKitchenTask:MG_TASKS[this.shopId])(this, this.workLv);
      this.task.layout(this.R);
      this.timeLimit = this.task.timeLimit * GameEconomy.mode(this.difficulty).time;
      this.timeLeft = this.timeLimit;
      this.orderT = 0;
      Sound.se("pop");
      this.phase = "work";
      const score = await new Promise((res) => (this.finish = (sc) => { if (this.phase === "work") { this.phase = "judge"; res(sc); } }));
      if (this.closed) return;
      if (this.stopping) { await this.results(true); return; }
      await this.judge(Math.round(U.clamp(score, 0, 100)));
      if (this.closed) return;
      this.phase = "leave";
      await this.tween(0.8, (k) => (this.cust.x = U.lerp(this.custX, G.W + 70, k)));
      this.task = null;
      if (this.closed) return;
    }
    if (!this.closed) await this.results();
  }
  timePenalty() {
    const used = 1 - this.timeLeft / this.timeLimit;
    return Math.max(0, used - 0.5) * 50;
  }
  async judge(score) {
    const rank = score >= 92 ? 3 : score >= 72 ? 2 : score >= 45 ? 1 : 0;
    const R = [
      { mark: "×", label: "ざんねん……", mul: 0.2, rep: 0, emo: "sad", se: "bad", line: "ちゅうもんと ちがう……" },
      { mark: "△", label: "まあまあ", mul: 0.6, rep: 3, emo: "normal", se: "tap", line: "うーん、まあまあかな" },
      { mark: "○", label: "よくできました！", mul: 1, rep: 7, emo: "happy", se: "good", line: "ありがとう！ おいしそう！" },
      { mark: "◎", label: "パーフェクト！", mul: 1.5, rep: 12, emo: "happy", se: "perfect", line: "わぁ！ さいこう！ また くるね！" },
    ][rank];
    if (this.shopId === "dentist") R.line = ["まだ いたいよ〜……", "ちょっと すっきり", "ピカピカ！ ありがとう！", "ピカピカ〜！ いたくない！"][rank];
    if (this.shopId === "florist") R.line = ["ちゅうもんと ちがう……", "うーん、まあまあかな", "きれい！ ありがとう！", "すてき！ さいこうの はなたば！"][rank];
    if (["link", "relay"].includes(this.shopId)) R.line = ["つぎは いっしょに がんばろう！", "もうすこし！", "たくさん あつまったね！", "すごい！ だいせいこう！"][rank];
    if (this.S.lines) R.line = this.S.lines[rank];
    const base = GameEconomy.shopBase[this.shopId] * (1 + 0.28 * (this.workLv - 1)) * GameEconomy.mode(this.difficulty).reward;
    let pay = GameEconomy.pay(this.shopId, this.workLv, rank, this.difficulty);
    if(this.variant==='mac'&&rank>=2)pay=Math.round(pay*1.4);
    let tip = 0;
    if (rank === 3 && this.timeLeft / this.timeLimit > 0.35) tip += Math.round(base * 0.5);
    // おてつだいの とちゅうの ごほうび（ころころ フルーツの 大きな くだもの など）
    tip += Math.max(0, Math.round(this.task?.bonusTip || 0));
    let perkMul = 0;
    if (Stats.perk(this.S.perk)) perkMul += 0.2;
    if (Stats.perk("shop")) perkMul += 0.1;
    if (rank >= 2 && Save.avg("mood") > 80) perkMul += 0.1;
    tip += Math.round((pay + tip) * perkMul);
    ({pay,tip}=DailyPlay.payout(pay,tip,this.dailyBoost));
    this.earn += pay; this.tips += tip; this.rep += R.rep;
    this.ranks.push(rank);
    this.cust.emo = R.emo;
    this.stamp = { ...R, score, t: 0, pay, tip };
    Sound.se(R.se);
    this.team.forEach((t, i) => { t.turn = 1.8; t.emo = rank >= 2 ? "happy" : rank === 1 ? "normal" : "sad"; if (rank >= 2) setTimeout(() => (t.jump = 0), i * 120); });
    if (pay + tip > 0) { this.coinsFx.push({ t: 0, n: pay + tip }); setTimeout(() => Sound.se("coin"), 400); }
    await U.wait(1700);
    this.stamp = null;
  }
  async results(interrupted = false) {
    if (this.paid) return;
    this.paid = true; this.homeBtn?.remove();
    this.phase = "result";
    const total = this.earn + this.tips;
    Save.addCoins(total);
    const st = this.st;
    if (!interrupted) st.plays++;
    st.rep += this.rep;
    const perfect = this.ranks.filter((r) => r === 3).length;
    st.best = Math.max(st.best, total);
    const boardNote = this.board?.summary ? this.board.summary(st) : "";
    if (!interrupted) Save.d.stats.shifts++;
    Save.d.stats.perfects += perfect;
    const good = this.ranks.filter((r) => r >= 2).length / Math.max(1, this.ranks.length);
    const fraction = interrupted ? this.ranks.length / this.total : 1;
    if (fraction) Save.careAll({ hunger: -6 * fraction, mood: (good >= 0.6 ? 4 : -2) * fraction, bond: interrupted ? 0 : 1 });
    const previousLevel = st.lv;
    st.lv = ShopRewards.level(st);
    const lvUp = st.lv > previousLevel;
    const prizes = this.ranks.length ? ShopRewards.claim(this.shopId) : [];
    Save.mark();
    Sound.stopBgm();
    Sound.jingle("victory");
    const body = U.el("div");
    const cnt = [3, 2, 1, 0].map((r) => this.ranks.filter((x) => x === r).length);
    body.append(U.el("div", { class: "result-big", text: interrupted ? "ここまで おつかれさま！" : `${this.S.name} おてつだい おわり！` }));
    const rows = U.el("div", { class: "result-rows" });
    const next = st.lv < ShopRewards.maxLevel ? SHOP_LV_REP[st.lv + 1] : null;
    rows.innerHTML = `<div class="r"><span>◎ ${cnt[0]}　○ ${cnt[1]}　△ ${cnt[2]}　× ${cnt[3]}</span></div>
      <div class="r"><span>うりあげ</span><span>+${this.earn}</span></div>
      <div class="r"><span>チップ</span><span>+${this.tips}</span></div>
      <div class="r"><span>もらった コイン</span><span><b>+${total}</b></span></div>
      <div class="r"><span>ひょうばん</span><span>+${this.rep}（${st.rep}${next ? " / " + next : ""}）</span></div>`;
    body.append(rows);
    if (boardNote) body.append(U.el("div", { class: "note", text: boardNote }));
    if (interrupted) body.append(U.el("div", { class: "note", text: `おわった ${this.ranks.length}にんぶんを うけとったよ。いまの ちゅうもんは ふくまれないよ。` }));
    body.append(U.el("div", { class: "muted", text: `あそびかた: ${GameEconomy.mode(this.difficulty).name}` }));
    if (lvUp) body.append(U.el("div", { class: "note", text: `おみせが レベル${st.lv}に なった！ ${st.lv <= 5 ? "ちゅうもんが むずかしく なって、コインも ふえるよ。" : "つぎの ごほうびを めざそう！"}` }));
    for (const p of prizes) body.append(U.el("div", { class: "note", text: `Lv.${p.level}の ごほうび！ 「${p.name}」を もらったよ。` }));
    if (fraction) body.append(U.el("div", { class: "muted", style: "margin-top:8px", text: "はたらいたので おなかが すこし へった。" }));
    Save.write();
    await new Promise((res) => {
      const m = UI.modal({ title: "きょうの けっか", body, closable: false, footer: UI.btn(this.returnStore || this.returnVenue ? "てんないに もどる" : "まちに もどる", () => { Sound.se("ok"); m.close(); res(); }, "yellow wide") });
    });
    if (lvUp) Sound.se("fanfare");
    Save.write();
    if (this.returnVenue) Game.goto("venue", this.returnVenue, "fade"); // 館の 中の お店（びっくぽの キッチン）から
    else if (this.returnStore) Game.goto("store", { shop: this.shopId, back: this.back, atCounter: true }, "fade");
    else Game.goto("world", this.back, "fade");
  }

  // ---- 入力 ----
  down(p) { if (this.phase === "work" && this.task) this.task.down(p); }
  move(p) { if (this.phase === "work" && this.task && this.task.move) this.task.move(p); }
  up(p, canceled = false) { if (this.phase === "work" && this.task && this.task.up) this.task.up(p, canceled); }
  cancel(p) { this.up(p, true); }
  key(k, down) { if (down && this.phase === "work" && this.task?.key) this.task.key(k); }

  tween(dur, fn) { return new Promise((res) => (this.tw = { t: 0, dur, fn, res })); }
  update(dt) {
    if (this.homeBtn) this.homeBtn.disabled = this.phase !== "work" || this.stopAsked;
    if (this.closed || this.stopAsked) return;
    if (this.tw) { const w = this.tw; w.t += dt; w.fn(Math.min(1, w.t / w.dur)); if (w.t >= w.dur) { this.tw = null; w.res(); } }
    if (this.phase === "work") {
      this.timeLeft -= dt;
      this.orderT += dt;
      if (this.task) this.task.update(dt);
      if (this.timeLeft <= 0 && this.task) { this.timeLeft = 0; this.finish(this.task.timeout()); }
    } else if (this.board && !this.paid) this.board.tick(dt, false); // おきゃくさんの あいだも 箱の 中は うごく（ころころ フルーツ）
    for (const t of this.team) { if (t.turn > 0) t.turn -= dt; if (t.jump >= 0) { t.jump += dt; if (t.jump > 0.7) t.jump = -1; } }
    if (this.stamp) this.stamp.t += dt;
    this.coinsFx = this.coinsFx.filter((c) => (c.t += dt) < 1.4);
    this.fxs = this.fxs.filter((f) => (f.t += dt) < (f.dur || 0.8));
  }
  addFx(kind, x, y, extra = {}) { this.fxs.push({ kind, x, y, t: 0, ...extra }); }
  mistake(text = "いたっ！") {
    this.cust.emo = "surprise";
    this.team.forEach((t) => (t.emo = "surprise"));
    setTimeout(() => { if (this.cust && this.phase === "work") this.cust.emo = "normal"; }, 600);
    Sound.se("bad");
    this.addFx("text", this.custX + 20, this.counterY - 120, { text, dur: 0.9 });
  }

  // ---- 描画 ----
  render(ctx) {
    const W = G.W, H = G.H;
    this.drawShop(ctx);
    // 作業エリア
    ctx.fillStyle = shade(this.S.color, 0.55);
    ctx.fillRect(0, this.viewH, W, H - this.viewH);
    ctx.fillStyle = shade(this.S.color, 0.35);
    for (let x = -20; x < W; x += 28) ctx.fillRect(x + ((G.t * 6) % 28), this.viewH, 12, H - this.viewH);
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, this.viewH); ctx.lineTo(W, this.viewH); ctx.stroke();
    this.drawHeader(ctx);
    const R = this.R;
    U.rr(ctx, R.x, R.y, R.w, R.h, 18);
    ctx.fillStyle = "#FFFDF6"; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    if (this.task && (this.phase === "work" || this.phase === "judge")) this.task.render(ctx);
    else if (this.board && this.phase !== "result") this.board.render(ctx, null);
    else if (this.phase === "intro" || this.phase === "enter") {
      ctx.fillStyle = "#8A7D6A"; ctx.font = "800 15px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.fillText(this.phase === "enter" ? "おきゃくさんが きたよ！" : "じゅんびちゅう……", W / 2, R.y + R.h / 2);
    }
    // 判定スタンプ
    if (this.stamp) {
      const s = this.stamp, k = Math.min(1, s.t / 0.25);
      const sc = 0.6 + U.ease.outBack(k) * 0.4;
      ctx.save();
      ctx.translate(W / 2, R.y + R.h * 0.42);
      ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(255,253,246,0.96)"; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      U.rr(ctx, -130, -80, 260, 160, 26); ctx.fill(); ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 64px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillStyle = ["#8A7D6A", "#F29A1F", "#4FA3E0", "#E8453C"][this.ranks[this.ranks.length - 1]];
      ctx.fillText(s.mark, 0, -26);
      ctx.fillStyle = INK; ctx.font = "900 20px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(s.label, 0, 26);
      ctx.font = "800 13px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(`+${s.pay}コイン${s.tip ? `（チップ +${s.tip}）` : ""}`, 0, 56);
      ctx.restore();
    }
  }
  drawShop(ctx) {
    const W = G.W, vh = this.viewH, cy = this.counterY;
    const wall = shade(this.S.color, 0.62);
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, vh);
    ctx.fillStyle = shade(this.S.color, 0.5);
    for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 18, cy);
    // たな
    ctx.fillStyle = "#C98A52"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (const y of [62, 124]) {
      U.rr(ctx, W * 0.52, y, W * 0.44, 9, 3); ctx.fill(); ctx.stroke();
    }
    const goods = { crepe: ["ichigo", "banana", "cream", "choco", "kiwi"], dentist: [], bakery: [], florist: [] }[this.shopId];
    for (let i = 0; i < 5; i++) {
      const x = W * 0.56 + i * (W * 0.085), y1 = 50, y2 = 112;
      if (this.shopId === "crepe") { topIcon(ctx, goods[i], x, y1, 22); topIcon(ctx, goods[(i + 2) % 5], x, y2, 22); }
      else if (this.shopId === "bakery") { const b = BREADS[i % 4].id; mgIcon(ctx, "bread:" + b, () => breadSvg(b, 0.8), x, y1, 24); mgIcon(ctx, "bread:" + BREADS[(i + 1) % 4].id, () => breadSvg(BREADS[(i + 1) % 4].id, 0.8), x, y2, 24); }
      else if (this.shopId === "florist") { const f = FLOWER_KINDS[i % 6]; mgIcon(ctx, "fl:" + f.id, () => flowerIconSvg(f.col), x, y1 - 4, 26); const g = FLOWER_KINDS[(i + 3) % 6]; mgIcon(ctx, "fl:" + g.id, () => flowerIconSvg(g.col), x, y2 - 4, 26); }
      else if (this.shopId === "dentist") { ctx.fillStyle = "#FFFFFF"; U.rr(ctx, x - 8, y1 - 12, 16, 20, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = ["#7EC8F0", "#F48FB1", "#8BCB6B", "#FFD54F", "#B388FF"][i]; U.rr(ctx, x - 2, y2 - 22, 4, 26, 2); ctx.fill(); ctx.stroke(); }
    }
    ShopDecor.interior(ctx,this.lv,W,cy);
    MG_TASKS[this.shopId]?.backdrop?.(ctx, this, W, cy); // お店ごとの たなの しなもの（ガソリンスタンド・ゆうびんきょく）
    // かんばん
    ctx.fillStyle = "#FFF7E0"; U.rr(ctx, 10, 8, W - 115, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(`${this.S.name} Lv.${this.lv}`, 10 + (W - 115) / 2, 21.5, W - 130);
    // おきゃくさん（カウンターの向こう）
    if (this.cust) {
      const c = this.npcC({ sp: this.cust.sp, col: this.cust.col, outfit: this.cust.outfit, emo: this.cust.emo, dir: this.phase === "enter" || this.phase === "leave" ? "right" : "down", pose: (this.phase === "enter" || this.phase === "leave") && Math.floor(G.t * 8) % 2 ? "walk_01" : "idle_01" }, 112);
      if (c) { const w = 112, h = (w * VB.h) / VB.w; ctx.drawImage(c, this.cust.x - w * ((FOOT.x - VB.x) / VB.w), cy + 14 - h * ((FOOT.y - VB.y) / VB.h), w, h); }
    }
    // 店主（右はし）
    const oc = this.npcC({ ...this.owner, emo: this.stamp && this.ranks[this.ranks.length - 1] >= 2 ? "happy" : "normal" }, 70);
    if (oc) { const w = 70, h = (w * VB.h) / VB.w; ctx.drawImage(oc, W - 52 - w * ((FOOT.x - VB.x) / VB.w), cy + 18 - h * ((FOOT.y - VB.y) / VB.h), w, h); }
    // カウンター
    ctx.fillStyle = "#D9A066"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.fillRect(-4, cy, W + 8, 14); ctx.strokeRect(-4, cy, W + 8, 14);
    ctx.fillStyle = "#B97A45"; ctx.fillRect(-4, cy + 14, W + 8, vh - cy - 14); ctx.strokeRect(-4, cy + 14, W + 8, vh - cy - 14);
    ctx.fillStyle = shade(this.S.color, -0.05);
    for (let x = 10; x < W; x += 50) { U.rr(ctx, x, cy + 24, 34, vh - cy - 32, 6); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
    // ちゅうもんの ふきだし
    if (this.task && (this.phase === "work" || this.phase === "judge")) this.drawBubble(ctx);
    // 3にん（カウンターの手前。ふだんは おきゃくさんの ほうを むいている）
    this.team.forEach((t, i) => {
      const c = Save.d.chars[t.id];
      const x = W * 0.56 + i * 50, y = vh - 3;
      let pose = Math.floor((G.t + i * 0.3) / 0.5) % 2 ? "idle_02" : "idle_01", dy = 0, dir = "up", face = "normal";
      if (t.turn > 0) { dir = "down"; face = t.emo; pose = "idle_01"; }
      if (t.jump >= 0) { pose = t.jump < 0.45 ? "jump_01" : "idle_01"; dy = Math.sin(Math.min(1, t.jump / 0.45) * Math.PI) * 20; }
      Chara.draw(ctx, t.id, { pose, dir, face, outfit: c.outfit, color: c.color }, x, y - dy, 62);
    });
    // コインの演出
    for (const c of this.coinsFx) {
      const k = c.t / 1.4;
      ctx.save(); ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 5; i++) {
        const x = this.custX + 30 + i * 12 - k * 20, y = cy - 10 - Math.sin(k * Math.PI) * 50 - i * 3;
        ctx.fillStyle = "#F7C948"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = INK; ctx.font = "900 18px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.lineWidth = 5; ctx.strokeStyle = "#FFF"; ctx.strokeText(`+${c.n}`, this.custX + 60, cy - 60 - k * 20); ctx.fillText(`+${c.n}`, this.custX + 60, cy - 60 - k * 20);
      ctx.restore();
    }
    for (const f of this.fxs) {
      const k = f.t / (f.dur || 0.8);
      ctx.save(); ctx.globalAlpha = 1 - k;
      if (f.kind === "text") {
        ctx.font = "900 18px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 5; ctx.strokeStyle = "#FFF"; ctx.fillStyle = "#E8453C";
        ctx.strokeText(f.text, f.x, f.y - k * 16); ctx.fillText(f.text, f.x, f.y - k * 16);
      } else if (f.kind === "spark") FX.sparkles(ctx, f.x, f.y, k);
      else if (f.kind === "puff") { ctx.fillStyle = "#FFF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * (6 + k * 14), f.y + Math.sin(a) * (6 + k * 14), 6 * (1 - k * 0.6), 0, 7); ctx.fill(); ctx.stroke(); } }
      ctx.restore();
    }
  }
  drawBubble(ctx) {
    const W = G.W;
    const t = this.task;
    const hidden = t.hideAfter && this.orderT > t.hideAfter && !(t.peekT > 0);
    const x = W * 0.5, y = 44, w = W * 0.47, h = Math.min(this.counterY - 58, 150);
    ctx.save();
    ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    U.rr(ctx, x, y, w, h, 16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + h * 0.55); ctx.lineTo(x - 14, y + h * 0.7); ctx.lineTo(x + 2, y + h * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x + 1, y + h * 0.56, 4, h * 0.15);
    ctx.fillStyle = INK; ctx.font = "900 12px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(t.title, x + w / 2, y + 16);
    if (hidden) {
      ctx.font = "900 34px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = "#C9BBA3";
      ctx.fillText("？ ？ ？", x + w / 2, y + h / 2 + 8);
      ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = INK;
      ctx.fillText("ふきだしを タップで もういちど みる", x + w / 2, y + h - 12);
    } else t.drawOrder(ctx, x + 8, y + 30, w - 16, h - 38);
    ctx.restore();
    this.bubbleRect = { x, y, w, h };
  }
  drawHeader(ctx) {
    const W = G.W, y = this.viewH + 10;
    ctx.save();
    ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textBaseline = "middle"; ctx.fillStyle = INK;
    ctx.textAlign = "left"; ctx.fillText(`${Math.min(this.n + 1, this.total)} / ${this.total} にん`, 14, y + 10);
    ctx.textAlign = "right"; ctx.fillText(`コイン +${this.earn + this.tips}`, W - 14, y + 10);
    if (this.task && this.phase === "work") {
      const k = U.clamp(this.timeLeft / this.timeLimit, 0, 1);
      const bw = W * 0.34, bx = W / 2 - bw / 2;
      U.rr(ctx, bx, y + 3, bw, 14, 7); ctx.fillStyle = "#FFF"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      if (k > 0) { U.rr(ctx, bx + 2, y + 5, (bw - 4) * k, 10, 5); ctx.fillStyle = k > 0.5 ? "#6FCF6A" : k > 0.25 ? "#FFC23D" : "#F0605D"; ctx.fill(); }
    }
    ctx.restore();
  }
}
SCENES.shop = ShopScene;

// ---- キャンバスのボタン ----
function mgBtn(ctx, b) {
  ctx.save();
  const press = b.press > 0 ? 2 : 0;
  ctx.fillStyle = INK;
  U.rr(ctx, b.x, b.y + 3, b.w, b.h, b.r || 14); ctx.fill();
  U.rr(ctx, b.x, b.y + press, b.w, b.h, b.r || 14);
  ctx.fillStyle = b.disabled ? "#E6DCCB" : b.on ? "#FFE27A" : b.color || "#FFFDF6"; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  if (b.icon) b.icon(ctx, b.x + b.w / 2, b.y + press + (b.label ? b.h * 0.42 : b.h / 2), Math.min(b.w, b.h) * (b.label ? 0.6 : 0.72));
  if (b.label) {
    ctx.fillStyle = INK; ctx.font = `800 ${b.fs || 12}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + press + (b.icon ? b.h * 0.84 : b.h / 2));
  }
  if (b.badge) { ctx.fillStyle = "#F06292"; ctx.beginPath(); ctx.arc(b.x + b.w - 6, b.y + 6, 10, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#FFF"; ctx.font = "900 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(b.badge, b.x + b.w - 6, b.y + 6.5); }
  ctx.restore();
}
const inBtn = (b, p) => !b.disabled && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h + 3;
function gridBtns(R, n, cols, top, h, gap = 8) {
  const w = (R.w - 20 - gap * (cols - 1)) / cols;
  return Array.from({ length: n }, (_, i) => ({ x: R.x + 10 + (i % cols) * (w + gap), y: top + Math.floor(i / cols) * (h + gap), w, h }));
}
class TaskBase {
  constructor(sc, lv) { this.sc = sc; this.lv = lv; this.btns = []; this.peekT = 0; this.peeks = 0; }
  down(p) {
    const sc = this.sc;
    if (this.hideAfter && sc.bubbleRect && sc.orderT > this.hideAfter) {
      const r = sc.bubbleRect;
      if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) { this.peekT = 1.6; this.peeks++; Sound.se("tap"); return; }
    }
    for (const b of this.btns) if (inBtn(b, p)) { b.press = 0.12; Sound.se("tap"); b.cb(); return; }
    this.downArea && this.downArea(p);
  }
  update(dt) { if (this.peekT > 0) this.peekT -= dt; for (const b of this.btns) if (b.press > 0) b.press -= dt; this.tick && this.tick(dt); }
  render(ctx) { this.draw(ctx); for (const b of this.btns) mgBtn(ctx, b); }
  peekPenalty() { return this.peeks * 8; }
}

// お店ごとの mg-*.js が、この表へ登録する。
const MG_TASKS = {};
