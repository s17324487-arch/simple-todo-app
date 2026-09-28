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
    this.returnStore = !!p.returnStore;
    this.S = SHOPS[p.shop]; this.st = Save.d.shops[p.shop];
    this.lv = this.st.lv;
    this.total = this.S.rounds || 3 + Math.min(4, this.lv);
    this.difficulty = Save.d.settings.difficulty;
    this.n = 0; this.earn = 0; this.tips = 0; this.rep = 0; this.ranks = [];
    this.phase = "intro";
    this.fxs = []; this.coinsFx = [];
    this.team = Save.d.order.map((id, i) => ({ id, i, turn: 0, jump: -1, emo: "normal" }));
    this.owner = SHOP_OWNERS[this.shopId];
    this.layout();
    await this.preload();
    this.homeBtn = UI.btn("おうちへ", () => {
      if (UI.busy || Game.trans || this.closed) return;
      this.closed = true;
      UI.toast("おてつだいを やめて かえるよ。コインは さいごまで あそぶと もらえるよ");
      Game.goto("house");
    }, "home-shortcut small");
    document.getElementById("ui").append(this.homeBtn);
    Sound.bgm("shop_" + this.shopId);
    this.flow().catch((e) => { console.error(e); Game.goto("world", this.back); });
  }
  exit() { this.closed = true; this.homeBtn?.remove(); }
  layout() {
    const W = G.W, H = G.H;
    this.viewH = Math.round(Math.min(H * 0.4, 330));
    this.counterY = this.viewH - 74;
    this.R = { x: 10, y: this.viewH + 40, w: W - 20, h: H - this.viewH - 52 };
    this.custX = W * 0.29;
  }
  resize() { this.layout(); if (this.task && this.task.layout) this.task.layout(this.R); }
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
    const lines = first ? HOWTO[this.shopId] : [`きょうも よろしくね！ おきゃくさんは ${this.total}にん。\n（おみせ Lv.${this.lv}）`];
    await UI.say(lines.map((text) => ({ name: this.owner.name, face, text })));
    if (this.closed) return;
    for (this.n = 0; this.n < this.total; this.n++) {
      this.cust = this.makeCustomer();
      this.phase = "enter";
      Sound.se("door");
      await this.tween(0.9, (k) => (this.cust.x = U.lerp(-60, this.custX, U.ease.outCubic(k))));
      this.task = new MG_TASKS[this.shopId](this, this.lv);
      this.task.layout(this.R);
      this.timeLimit = this.task.timeLimit * GameEconomy.mode(this.difficulty).time;
      this.timeLeft = this.timeLimit;
      this.orderT = 0;
      Sound.se("pop");
      this.phase = "work";
      const score = await new Promise((res) => (this.finish = (sc) => { if (this.phase === "work") { this.phase = "judge"; res(sc); } }));
      await this.judge(Math.round(U.clamp(score, 0, 100)));
      if (this.closed) return;
      this.phase = "leave";
      await this.tween(0.8, (k) => (this.cust.x = U.lerp(this.custX, G.W + 70, k)));
      this.task = null;
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
    const base = GameEconomy.shopBase[this.shopId] * (1 + 0.28 * (this.lv - 1)) * GameEconomy.mode(this.difficulty).reward;
    let pay = GameEconomy.pay(this.shopId, this.lv, rank, this.difficulty);
    let tip = 0;
    if (rank === 3 && this.timeLeft / this.timeLimit > 0.35) tip += Math.round(base * 0.5);
    let perkMul = 0;
    if (Stats.perk(this.S.perk)) perkMul += 0.2;
    if (Stats.perk("shop")) perkMul += 0.1;
    if (rank >= 2 && Save.avg("mood") > 80) perkMul += 0.1;
    tip += Math.round((pay + tip) * perkMul);
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
  async results() {
    this.phase = "result";
    const total = this.earn + this.tips;
    Save.addCoins(total);
    const st = this.st;
    st.plays++;
    st.rep += this.rep;
    const perfect = this.ranks.filter((r) => r === 3).length;
    st.best = Math.max(st.best, total);
    Save.d.stats.shifts++;
    Save.d.stats.perfects += perfect;
    const good = this.ranks.filter((r) => r >= 2).length / this.ranks.length;
    Save.careAll({ hunger: -6, mood: good >= 0.6 ? 4 : -2, bond: 1 });
    let lvUp = false;
    while (st.lv < 5 && st.rep >= SHOP_LV_REP[st.lv + 1]) { st.lv++; lvUp = true; }
    Save.mark();
    Sound.stopBgm();
    Sound.jingle("victory");
    const body = U.el("div");
    const cnt = [3, 2, 1, 0].map((r) => this.ranks.filter((x) => x === r).length);
    body.append(U.el("div", { class: "result-big", text: `${this.S.name} おてつだい おわり！` }));
    const rows = U.el("div", { class: "result-rows" });
    const next = st.lv < 5 ? SHOP_LV_REP[st.lv + 1] : null;
    rows.innerHTML = `<div class="r"><span>◎ ${cnt[0]}　○ ${cnt[1]}　△ ${cnt[2]}　× ${cnt[3]}</span></div>
      <div class="r"><span>うりあげ</span><span>+${this.earn}</span></div>
      <div class="r"><span>チップ</span><span>+${this.tips}</span></div>
      <div class="r"><span>もらった コイン</span><span><b>+${total}</b></span></div>
      <div class="r"><span>ひょうばん</span><span>+${this.rep}（${st.rep}${next ? " / " + next : ""}）</span></div>`;
    body.append(rows);
    body.append(U.el("div", { class: "muted", text: `あそびかた: ${GameEconomy.mode(this.difficulty).name}` }));
    if (lvUp) body.append(U.el("div", { class: "note", html: `<b>おみせが レベル${st.lv}に なった！</b><br>おきゃくさんが ふえて、ちゅうもんが むずかしく なるよ。そのぶん コインも たくさん もらえる！` }));
    body.append(U.el("div", { class: "muted", style: "margin-top:8px", text: "はたらいたので おなかが すこし へった。" }));
    await new Promise((res) => {
      const m = UI.modal({ title: "きょうの けっか", body, closable: false, footer: UI.btn(this.returnStore ? "てんないに もどる" : "まちに もどる", () => { Sound.se("ok"); m.close(); res(); }, "yellow wide") });
    });
    if (lvUp) Sound.se("fanfare");
    Save.write();
    if (this.returnStore) Game.goto("store", { shop: this.shopId, back: this.back, atCounter: true }, "fade");
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
    if (this.tw) { const w = this.tw; w.t += dt; w.fn(Math.min(1, w.t / w.dur)); if (w.t >= w.dur) { this.tw = null; w.res(); } }
    if (this.phase === "work") {
      this.timeLeft -= dt;
      this.orderT += dt;
      if (this.task) this.task.update(dt);
      if (this.timeLeft <= 0 && this.task) { this.timeLeft = 0; this.finish(this.task.timeout()); }
    }
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
    ctx.textAlign = "left"; ctx.fillText(`おきゃくさん ${Math.min(this.n + 1, this.total)}/${this.total}`, 14, y + 10);
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

// ================= クレープやさん =================
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

// ================= はいしゃさん =================
class DentistTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.nGerm = [4, 5, 6, 7, 8][lv - 1];
    this.nDirt = [0, 2, 2, 3, 3][lv - 1];
    this.nCav = [0, 0, 1, 2, 2][lv - 1];
    this.hop = [1.8, 1.5, 1.3, 1.1, 0.9][lv - 1];
    this.timeLimit = [20, 21, 22, 22, 21][lv - 1];
    this.title = "はが いたいの……";
    this.mistakes = 0;
    this.killed = 0;
  }
  layout(R) {
    this.R = R;
    const mx = R.x + 16, my = R.y + 14, mw = R.w - 32, mh = R.h - 28;
    this.mouth = { x: mx, y: my, w: mw, h: mh };
    const n = 6, tw = (mw - 40) / n, th = Math.min(mh * 0.3, tw * 1.35);
    if (!this.teeth) this.teeth = Array.from({ length: n * 2 }, (_, k) => ({ up: k % 2 === 0 }));
    // 画面サイズが変わっても 同じ はの オブジェクトを使いつづける
    for (let i = 0; i < n; i++) {
      Object.assign(this.teeth[i * 2], { x: mx + 20 + i * tw + 3, y: my + mh * 0.12, w: tw - 6, h: th });
      Object.assign(this.teeth[i * 2 + 1], { x: mx + 20 + i * tw + 3, y: my + mh * 0.88 - th, w: tw - 6, h: th });
    }
    if (!this.targets) {
      const idx = U.shuffle([...this.teeth.keys()]);
      this.dirt = idx.slice(0, this.nDirt).map((i) => ({ t: this.teeth[i], hp: 4, rub: 0 }));
      this.cav = idx.slice(this.nDirt, this.nDirt + this.nCav).map((i) => ({ t: this.teeth[i], drill: 0, fixed: false }));
      this.germs = [];
      this.targets = true;
      this.spawnT = 0.2;
    }
  }
  toothCenter(t) { return { x: t.x + t.w / 2, y: t.y + t.h * (t.up ? 0.55 : 0.45) }; }
  tick(dt) {
    this.spawnT -= dt;
    const alive = this.germs.filter((g) => g.alive);
    if (this.spawnT <= 0 && alive.length < 3 && this.killed + alive.length < this.nGerm) {
      const t = U.pick(this.teeth);
      this.germs.push({ t, alive: true, hopT: this.hop * U.rand(0.8, 1.2), bob: Math.random() * 6 });
      this.spawnT = U.rand(0.5, 1.1);
      Sound.se("pop");
    }
    for (const g of alive) {
      g.hopT -= dt; g.bob += dt * 8;
      if (g.hopT <= 0) { g.t = U.pick(this.teeth); g.hopT = this.hop * U.rand(0.8, 1.2); }
    }
    if (this.drilling && !this.drilling.fixed) {
      this.drilling.drill += dt / 0.9;
      if (Math.floor(this.drilling.drill * 12) !== Math.floor((this.drilling.drill - dt / 0.9) * 12)) Sound.se("tap");
      if (this.drilling.drill >= 1) { this.drilling.fixed = true; const c = this.toothCenter(this.drilling.t); this.sc.addFx("spark", c.x, c.y); Sound.se("ding"); this.drilling = null; this.check(); }
    }
  }
  check() {
    const done = this.killed >= this.nGerm && this.dirt.every((d) => d.hp <= 0) && this.cav.every((c) => c.fixed);
    if (done) { Sound.se("sparkle"); this.sc.finish(this.score()); }
  }
  remaining() { return (this.nGerm - this.killed) + this.dirt.filter((d) => d.hp > 0).length + this.cav.filter((c) => !c.fixed).length; }
  score() { return 100 - this.mistakes * 8 - this.remaining() * 14 - this.sc.timePenalty(); }
  timeout() { return this.score(); }
  downArea(p) {
    // ばいきん
    for (const g of this.germs) {
      if (!g.alive) continue;
      const c = this.toothCenter(g.t);
      if (Math.hypot(p.x - c.x, p.y - (c.y + Math.sin(g.bob) * 3)) < 26) {
        g.alive = false; this.killed++;
        Sound.se("germ"); this.sc.addFx("puff", c.x, c.y);
        this.check();
        return;
      }
    }
    for (const cv of this.cav) {
      if (cv.fixed) continue;
      const c = this.toothCenter(cv.t);
      if (Math.hypot(p.x - c.x, p.y - c.y) < 24) { this.drilling = cv; return; }
    }
    for (const d of this.dirt) {
      if (d.hp <= 0) continue;
      const c = this.toothCenter(d.t);
      if (Math.hypot(p.x - c.x, p.y - c.y) < 28) { this.rubbing = { d, lx: p.x, ly: p.y }; return; }
    }
    const tooth = this.teeth.find((t) => p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.y + t.h);
    if (tooth) { this.mistakes++; this.sc.mistake("いたっ！"); }
  }
  move(p) {
    if (this.rubbing) {
      const r = this.rubbing;
      r.d.rub += Math.hypot(p.x - r.lx, p.y - r.ly);
      r.lx = p.x; r.ly = p.y;
      if (r.d.rub > 42) {
        r.d.rub = 0; r.d.hp--;
        Sound.se("swish");
        if (r.d.hp <= 0) { const c = this.toothCenter(r.d.t); this.sc.addFx("spark", c.x, c.y); Sound.se("ding"); this.rubbing = null; this.check(); }
      }
    }
  }
  up() { this.drilling = null; this.rubbing = null; }
  drawOrder(ctx, x, y, w, h) {
    const items = [["germ", this.nGerm - this.killed], ["dirt", this.dirt.filter((d) => d.hp > 0).length], ["cavity", this.cav.filter((c) => !c.fixed).length]].filter((i) => i[1] > 0);
    const s = 30;
    items.forEach(([id, n], i) => {
      const cx = x + w / 2 + (i - (items.length - 1) / 2) * 58;
      topIcon(ctx, id, cx, y + h * 0.4, s);
      ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("×" + n, cx, y + h * 0.4 + 26);
    });
    if (!items.length) { ctx.fillStyle = INK; ctx.font = "900 16px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillText("ピカピカ！", x + w / 2, y + h / 2); }
  }
  draw(ctx) {
    const m = this.mouth;
    ctx.save();
    ctx.fillStyle = "#F48FB1"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    U.rr(ctx, m.x, m.y, m.w, m.h, 60); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8E2F45"; U.rr(ctx, m.x + 16, m.y + m.h * 0.3, m.w - 32, m.h * 0.4, 30); ctx.fill();
    ctx.fillStyle = "#E57390"; ctx.beginPath(); ctx.ellipse(m.x + m.w / 2, m.y + m.h * 0.62, m.w * 0.26, m.h * 0.1, 0, 0, 7); ctx.fill();
    for (const t of this.teeth) {
      ctx.fillStyle = "#FFFFFF";
      U.rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    }
    for (const d of this.dirt) if (d.hp > 0) { const c = this.toothCenter(d.t); ctx.globalAlpha = 0.35 + d.hp * 0.16; topIcon(ctx, "dirt", c.x, c.y, 34); ctx.globalAlpha = 1; }
    for (const cv of this.cav) {
      const c = this.toothCenter(cv.t);
      if (cv.fixed) { ctx.fillStyle = "#E0E0E0"; ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, 7); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); continue; }
      topIcon(ctx, "cavity", c.x, c.y, 30);
      if (cv.drill > 0) { ctx.strokeStyle = "#4FA3E0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, 18, -Math.PI / 2, -Math.PI / 2 + cv.drill * Math.PI * 2); ctx.stroke(); }
    }
    for (const g of this.germs) if (g.alive) { const c = this.toothCenter(g.t); topIcon(ctx, "germ", c.x, c.y + Math.sin(g.bob) * 3, 38); }
    ctx.fillStyle = INK; ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    const hint = this.nCav && this.cav.some((c) => !c.fixed) ? "むしばは ながおし・よごれは こする" : this.nDirt && this.dirt.some((d) => d.hp > 0) ? "ちゃいろい よごれは ゆびで こすってね" : "ばいきんを タップ！";
    ctx.fillText(hint, m.x + m.w / 2, m.y + m.h / 2 + 2);
    ctx.restore();
  }
}

// ================= パンやさん =================
class BakeryTask extends TaskBase {
  constructor(sc, lv) {
    super(sc, lv);
    this.want = { bread: U.pick(BREADS).id, bake: U.pick(["soft", "golden"]), top: lv >= 2 ? { id: U.pick(BREAD_TOPS).id, n: U.randi(2, [0, 3, 4, 4, 5][lv - 1]) } : null };
    this.timeLimit = [24, 26, 25, 24, 22][lv - 1];
    this.speed = [22, 26, 30, 34, 38][lv - 1]; // 1秒あたりの やけぐあい
    this.zoneW = [20, 18, 15, 13, 11][lv - 1];
    this.zone = this.want.bake === "soft" ? 40 : 70;
    this.step = "choose";
    this.pen = 0;
    this.done = 0;
    this.tops = [];
    this.curTop = BREAD_TOPS[0].id;
    this.title = "パン ください！";
  }
  layout(R) { this.R = R; this.setupStep(); }
  setupStep() {
    const R = this.R;
    if (this.step === "choose") {
      const cells = gridBtns(R, 4, 2, R.y + 46, Math.min(96, (R.h - 70) / 2 - 6));
      this.btns = BREADS.map((b, i) => ({ ...cells[i], label: b.name, fs: 13, icon: (ctx, x, y, s) => mgIcon(ctx, "bread:" + b.id + ":raw", () => breadSvg(b.id, 0.05), x, y, s * 1.1), cb: () => this.choose(b.id) }));
    } else if (this.step === "bake") {
      const bw = R.w - 60;
      this.btns = [{ x: R.x + 30, y: R.y + R.h - 70, w: bw, h: 56, label: "とりだす！", fs: 18, color: "#FFD54F", cb: () => this.takeOut() }];
      Sound.se("bake");
    } else if (this.step === "top") {
      const cells = gridBtns(R, 3, 3, R.y + R.h - 142, 62);
      this.btns = BREAD_TOPS.map((t, i) => ({ ...cells[i], label: t.name, fs: 11, on: this.curTop === t.id, icon: (ctx, x, y, s) => topIcon(ctx, t.id, x, y, s), cb: () => { this.curTop = t.id; this.btns.forEach((b, j) => j < 3 && (b.on = j === i)); } }));
      const w2 = (R.w - 28) / 2;
      this.btns.push({ x: R.x + 10, y: R.y + R.h - 64, w: w2, h: 50, label: "やりなおし", fs: 14, cb: () => { this.tops = []; Sound.se("cancel"); } });
      this.btns.push({ x: R.x + 18 + w2, y: R.y + R.h - 64, w: w2, h: 50, label: "できあがり！", fs: 15, color: "#FFD54F", cb: () => this.finishTop() });
    }
  }
  choose(id) {
    this.bread = id;
    if (id !== this.want.bread) { this.pen += 30; this.sc.mistake("ちがう パン……"); }
    else Sound.se("good");
    this.step = "bake"; this.setupStep();
  }
  takeOut() {
    const d = this.done;
    let p = 0;
    if (d > 100) p = 60;
    else { const off = Math.abs(d - this.zone) - this.zoneW / 2; if (off > 0) p = Math.min(55, off * 2.4); }
    this.pen += p;
    Sound.se(p === 0 ? "ding" : p < 20 ? "good" : "bad");
    this.bakeMsg = p === 0 ? "ばっちり！" : d > 100 ? "こげちゃった……" : d < this.zone ? "ちょっと はやかった" : "ちょっと やきすぎ";
    this.sc.addFx("text", G.W / 2, this.R.y + 30, { text: this.bakeMsg, dur: 1 });
    if (this.want.top) { this.step = "top"; this.setupStep(); }
    else this.sc.finish(this.score());
  }
  downArea(p) {
    if (this.step !== "top") return;
    const b = this.breadPos();
    if (Math.hypot(p.x - b.x, (p.y - b.y) * 1.4) < b.s * 0.45 && this.tops.length < 9) {
      this.tops.push({ id: this.curTop, dx: p.x - b.x, dy: p.y - b.y });
      Sound.se("pop");
    }
  }
  finishTop() {
    const t = this.want.top;
    const right = this.tops.filter((x) => x.id === t.id).length, wrong = this.tops.length - right;
    this.pen += Math.abs(right - t.n) * 12 + wrong * 10;
    this.sc.finish(this.score());
  }
  score() { return 100 - this.pen - this.sc.timePenalty(); }
  timeout() {
    if (this.step === "choose") return 0;
    if (this.step === "bake") return 100 - this.pen - 60;
    return this.score() - 20;
  }
  tick(dt) {
    if (this.step === "bake") {
      this.done += this.speed * dt;
      if (this.done > 135) { this.done = 135; }
    }
  }
  breadPos() {
    const R = this.R;
    if (this.step === "top") return { x: R.x + R.w / 2, y: R.y + (R.h - 150) / 2 + 6, s: Math.min(170, R.h - 170) };
    return { x: R.x + R.w / 2, y: R.y + R.h * 0.34, s: Math.min(130, R.h * 0.34) };
  }
  drawOrder(ctx, x, y, w, h) {
    const W = this.want;
    mgIcon(ctx, "bread:" + W.bread + ":ord", () => breadSvg(W.bread, W.bake === "soft" ? 0.45 : 0.85), x + 34, y + h * 0.42, 50);
    ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = "900 12px 'M PLUS Rounded 1c', sans-serif";
    ctx.fillText(BREADS.find((b) => b.id === W.bread).name, x + 64, y + 12);
    ctx.fillStyle = W.bake === "soft" ? "#E6B566" : "#B97A3E";
    U.rr(ctx, x + 64, y + 22, 64, 20, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#FFF"; ctx.font = "900 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    ctx.fillText(W.bake === "soft" ? "ふんわり" : "こんがり", x + 96, y + 32.5);
    if (W.top) {
      topIcon(ctx, W.top.id, x + 76, y + h - 16, 22);
      ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(`×${W.top.n}`, x + 90, y + h - 15);
    }
  }
  draw(ctx) {
    const R = this.R;
    ctx.save();
    ctx.fillStyle = INK; ctx.font = "900 14px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center";
    if (this.step === "choose") { ctx.fillText("ちゅうもんの パンを えらんでね", R.x + R.w / 2, R.y + 26); ctx.restore(); return; }
    const b = this.breadPos();
    if (this.step === "bake") {
      // オーブン
      const ow = Math.min(R.w - 60, 250), oh = b.s * 1.05;
      ctx.fillStyle = "#8D6E63"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      U.rr(ctx, b.x - ow / 2, b.y - oh / 2 - 10, ow, oh + 20, 18); ctx.fill(); ctx.stroke();
      const glow = Math.min(1, this.done / 100);
      ctx.fillStyle = `rgba(255,${Math.round(170 - glow * 60)},60,${0.45 + glow * 0.3})`;
      U.rr(ctx, b.x - ow / 2 + 14, b.y - oh / 2, ow - 28, oh, 12); ctx.fill(); ctx.stroke();
      mgIcon(ctx, "bread:" + this.bread + ":" + Math.round(this.done / 5), () => breadSvg(this.bread, this.done / 100), b.x, b.y + 4, b.s * 0.8);
      if (this.done > 100 && Math.floor(G.t * 6) % 2) { ctx.fillStyle = "rgba(90,90,90,0.5)"; ctx.beginPath(); ctx.arc(b.x - 20, b.y - 30 - (G.t * 20) % 20, 12, 0, 7); ctx.fill(); }
      // メーター
      const mx = R.x + 30, mw = R.w - 60, my = R.y + R.h - 116;
      const g = ctx.createLinearGradient(mx, 0, mx + mw, 0);
      g.addColorStop(0, "#F6E7C8"); g.addColorStop(0.35, "#F2D39A"); g.addColorStop(0.6, "#E0A860"); g.addColorStop(0.74, "#B97A3E"); g.addColorStop(1, "#46322A");
      U.rr(ctx, mx, my, mw, 22, 11); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      const zx = mx + (mw * (this.zone - this.zoneW / 2)) / 135, zw = (mw * this.zoneW) / 135;
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.strokeRect(zx, my - 4, zw, 30); ctx.setLineDash([]);
      ctx.fillStyle = INK; ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(this.want.bake === "soft" ? "ふんわり" : "こんがり", zx + zw / 2, my - 10);
      const nx = mx + (mw * Math.min(this.done, 135)) / 135;
      ctx.fillStyle = "#E8453C"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(nx, my + 24); ctx.lineTo(nx - 8, my + 36); ctx.lineTo(nx + 8, my + 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (this.step === "top") {
      mgIcon(ctx, "bread:" + this.bread + ":big", () => breadSvg(this.bread, this.done / 100), b.x, b.y, b.s);
      for (const t of this.tops) topIcon(ctx, t.id, b.x + t.dx, b.y + t.dy, 22);
      ctx.fillStyle = INK; ctx.font = "800 12px 'M PLUS Rounded 1c', sans-serif";
      ctx.fillText(`パンを タップして のせる（${this.tops.length}こ）`, R.x + R.w / 2, R.y + 20);
    }
    ctx.restore();
  }
}

// ================= おはなやさん =================
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

const MG_TASKS = { crepe: CrepeTask, dentist: DentistTask, bakery: BakeryTask, florist: FloristTask };
