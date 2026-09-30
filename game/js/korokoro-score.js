// ころころ フルーツの「スコア モード」（おてつだいの もう 1つの あそびかた・オーナーの FB 2026-09-30）。本物の スイカゲームと おなじ きまり:
//  ・おちてくるのは 小さい ほうの はんぶん（8しゅの うち 4しゅ。本物は 11しゅの うち 5しゅ）で、どれも おなじ くらいの 確率。つぎの 1こが みえる
//  ・おなじ もの 2つが ふれると 1だん 大きく なる。いちばん 大きい ごじ どうしは きえる
//  ・点は くっつけた 2つの だんの 三角数（さくらんぼ 1・いちご 3・みかん 6・りんご 10・なし 15・がちゃん 21・わんこ 28・ごじ どうし 36）。おとすだけでは 0点
//  ・大きく なれない まま 箱の ふちから はみだすと おしまい（物理の ゆれで すぐ おわらない ように 0.5びょう まつ）。時間の せいげんは ない
// おわると ハイスコア・ランキング（上から 5つ）・コイン・ひょうばん（Save.d.shops.korokoro の hi・tops・games）。
// 箱・物理・絵は js/mg-korokoro.js の KorokoroBoard（mode: "score"）。お店の「おてつだいする」で モードを えらぶ（KorokoroScore.choose）。
// overSec: はみだして から おしまい まで・overWait: おしまいの しるしを 見せて から けっかまで・tops: ランキングの かず・コイン = スコア ÷ coinDiv（上限 coinMax）・ひょうばん = スコア ÷ repDiv（上限 repMax）・grades: △○◎ の スコア
// H: はこの 高さ（はば 100。ちゅうもん モードの 110 より 15% たかい・オーナーの FB 2026-09-30）
// rules: 物理の 上がき（くっついた ときに はねすぎて すぐ あふれない ように）: up = うえむきの はやさの 上限・depen = かさなりを なおす ときの はなれる はやさの 上限・keep = がったいで できた 玉が ひきつぐ はやさ
const KOROKORO_SCORE = Object.freeze({ overSec: 0.5, overWait: 1.8, tops: 5, coinDiv: 6, coinMax: 400, repDiv: 100, repMax: 12, grades: [150, 400, 1000],
  H: 126.5, rules: Object.freeze({ up: 90, depen: 20, keep: 0.3 }) });
const KOROKORO_SCORE_HOWTO = Object.freeze([
  "スコア モードへ ようこそ！\nあふれるまで とことん あそんで、ハイスコアを めざそう。",
  "おちてくるのは ちいさい 4しゅ だけ。\nうえの「つぎ」を みて、おとす ばしょを きめてね。",
  "おなじ もの 2つで 1つ おおきく なるよ。\nなしの つぎは がちゃん・わんこ・ごじ！",
  "くっつけると てんすう。おおきい ものほど たかいよ。\nごじ どうしは きえて 36てん！",
  "ふちから はみだしたら おしまい！\nあかい せんに きを つけてね。",
]);

const KorokoroScore = {
  st() { return Save.d.shops.korokoro; },
  best() { return this.st().hi || 0; },
  // 1かいの けっかを のこす。rank: ランキングの じゅんい（1〜5・はいらなければ 0）・newBest: ハイスコアを こえたか
  record(score, day = U.today()) {
    const st = this.st(), before = st.hi || 0, entry = { s: Math.max(0, Math.round(score) || 0), d: String(day) };
    st.games = (st.games || 0) + 1;
    st.hi = Math.max(before, entry.s);
    const list = (Array.isArray(st.tops) ? st.tops : []).filter((e) => e && Number.isFinite(e.s));
    list.push(entry); list.sort((a, b) => b.s - a.s); // おなじ 点なら まえの きろくが うえ
    st.tops = list.slice(0, KOROKORO_SCORE.tops);
    return { rank: st.tops.indexOf(entry) + 1, newBest: entry.s > before, hi: st.hi };
  },
  // コイン: スコアの 1/6（上限 400）× あそびかた（のんびり・ふつう・むずかしい）× きょうの おすすめ
  pay(score, mode = "normal", boost = 1) { return Math.round(Math.min(KOROKORO_SCORE.coinMax, Math.floor(Math.max(0, score) / KOROKORO_SCORE.coinDiv)) * GameEconomy.mode(mode).reward * boost); },
  rep(score) { return Math.min(KOROKORO_SCORE.repMax, Math.floor(Math.max(0, score) / KOROKORO_SCORE.repDiv)); },
  // スコア モードの 箱（KorokoroBoard の o）: 15% たかい はこ・はねを おさえる 物理
  board() { return { mode: "score", overSec: KOROKORO_SCORE.overSec, H: KOROKORO_SCORE.H, rules: KOROKORO_SCORE.rules }; },
  // ディスクと きもちの めやす（0 ×・1 △・2 ○・3 ◎）
  grade(score) { return KOROKORO_SCORE.grades.filter((v) => score >= v).length; },
  day(d) { const m = /^\d+-(\d+)-(\d+)$/.exec(String(d || "")); return m ? `${m[1]}/${m[2]}` : ""; },
  // もらった とくべつな かぐの カード（家具の 立体の 絵・なまえ・めやす・せつめい）。絵は img に して id が ほかの 絵と かさならない ように
  giftEl(p, fresh = false) {
    const el = U.el("div", { class: "koro-gift" + (fresh ? " fresh" : "") });
    el.append(U.el("img", { src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(KorokoroPrizes.svg(p.id)), alt: p.name }));
    const t = U.el("div");
    t.append(U.el("b", { text: fresh ? `とくべつな かぐ「${p.name}」を もらった！` : p.name }), U.el("small", { text: `${U.fmt(p.score)}てんの ごほうび・おうちの「もようがえ」で おけるよ` }));
    el.append(t);
    return el;
  },
  // お店で「おてつだいする」を えらんだ あと: ころころ フルーツ だけ モードを きく。"order" / "score" / null（やめる）
  async choose(store) {
    if (store.shopId !== "korokoro") return "order";
    const hi = this.best();
    const got = typeof KorokoroPrizes !== "undefined" ? KorokoroPrizes.list().filter((p) => p.own).length : 0;
    const text = `${store.owner.name}\nどっちの モードで あそぶ？\n・ちゅうもん … ほしい ものを とどける\n・スコア … あふれるまで とことん！${hi ? `\nハイスコア ${U.fmt(hi)}てん` : ""}${got ? `（とくべつな かぐ ${got}/${KOROKORO_PRIZES.length}）` : ""}`;
    const i = await UI.ask(text, ["ちゅうもん モード", "スコア モード", "やめる"]);
    return i === 0 ? "order" : i === 1 ? "score" : null;
  },
  start(back, seed = null) { Game.goto("koroscore", { back: { ...back }, seed }, "circle"); },
};

class KorokoroScoreScene {
  async enter(p = {}) {
    this.back = { ...(p.back || { map: "town", x: 12, y: 21, dir: "down" }) };
    this.st = Save.d.shops.korokoro; this.hi0 = this.st.hi || 0;
    this.phase = "intro"; this.closed = false; this.paid = false; this.stopAsked = false; this.overT = 0; this.danger = false;
    this.difficulty = Save.d.settings.difficulty; this.dailyBoost = DailyPlay.boost("korokoro");
    this.owner = SHOP_OWNERS.korokoro; this.fxs = [];
    this.team = Save.d.order.map((id, i) => ({ id, i, turn: 0, jump: -1, emo: "normal" }));
    const seed = p.seed != null ? p.seed >>> 0 : (Date.now() ^ 0x5eed) >>> 0;
    this.board = new KorokoroBoard(this, seed, KorokoroScore.board());
    this.resize();
    await this.preload();
    if (this.closed) return;
    this.stopBtn = UI.btn("やめる", () => this.requestStop(), "home-shortcut small");
    this.stopBtn.setAttribute("aria-label", "スコア モードを やめる");
    document.getElementById("ui").append(this.stopBtn);
    UI.showHud(false);
    Sound.bgm("shop_korokoro");
    this.flow().catch((e) => { console.error(e); this.leave(); });
  }
  exit() { this.closed = true; this.stopBtn?.remove(); }
  // うえから: かんばん（8〜34・みぎに「やめる」）・スコア／3人／つぎ の おび（「やめる」の したから）・箱（KorokoroBoard が 大きさを きめる）・大きく なる じゅんばん
  resize() {
    const W = G.W, H = G.H;
    this.infoY = 58; this.infoH = U.clamp(Math.round(H * 0.1), 60, 90);
    this.charSize = Math.round(U.clamp(this.infoH * 0.66, 42, 58));
    this.panel = { x: 10, y: this.infoY, w: Math.round(Math.min(160, W * 0.38)), h: this.infoH };
    this.nextBox = { x: W - 76, y: this.infoY, w: 66, h: this.infoH };
    const top = this.infoY + this.infoH + 6;
    this.R = { x: 8, y: top, w: W - 16, h: H - top - 10 };
    this.board.layout(this.R);
  }
  async preload() {
    const list = [];
    for (const t of this.team) {
      const c = Save.d.chars[t.id];
      for (const [pose, face] of [["idle_01", "normal"], ["idle_02", "normal"], ["idle_01", "happy"], ["idle_02", "happy"], ["jump_01", "happy"], ["idle_01", "surprise"], ["idle_02", "surprise"]]) list.push([t.id, { pose, dir: "down", face, outfit: c.outfit, color: c.color }]);
    }
    await Chara.preload(list, this.charSize);
  }
  // 3人の 立つ ところ（スコアと つぎ の あいだ）。KorokoroBoard.cheer が「わん！」などを だす ばしょにも つかう
  teamSpot(i) {
    const a = this.panel.x + this.panel.w + 4, b = this.nextBox.x - 4, gap = (b - a) / 3;
    return { x: a + gap * (i + 0.5), y: this.infoY + 10 };
  }
  addFx(kind, x, y, extra = {}) { this.fxs.push({ kind, x, y, t: 0, ...extra }); }

  // ---- すすみかた ----
  async flow() {
    const face = Art.npcSvg({ ...this.owner, emo: "happy" }), first = !this.st.games;
    const lines = first ? [...KOROKORO_SCORE_HOWTO] : [this.hi0 ? `ハイスコアは ${U.fmt(this.hi0)}てん。\nきょうは こえられるかな？` : "こんどこそ たくさん くっつけよう！"];
    const nx = typeof KorokoroPrizes !== "undefined" ? KorokoroPrizes.next() : null;
    if (nx) lines.push(`${U.fmt(nx.score)}てんに とどくと、とくべつな かぐ「${nx.name}」を あげるね！`);
    if (this.dailyBoost > 1) lines.push(`きょうの おすすめ！ コインが ${DailyPlay.label(this.dailyBoost)}だよ。`);
    await UI.say(lines.map((text) => ({ name: this.owner.name, face, text })));
    if (this.closed) return;
    this.phase = "play";
  }
  // KorokoroBoard から: ふちから はみだした（ゲームオーバー）
  gameOver() {
    if (this.phase !== "play") return;
    this.phase = "over"; this.overT = 0;
    Sound.se("bad");
    for (const t of this.team) { t.turn = 2.2; t.emo = "surprise"; }
  }
  async requestStop() {
    if (UI.busy || Game.trans || this.closed || this.stopAsked || this.phase !== "play") return;
    this.stopAsked = true; this.board.up(null, true);
    const yes = await UI.confirm(`ここで おわりに する？\nいまの ${U.fmt(this.board.points)}てんが きろくに なるよ。`, "おわりに する", "つづける");
    this.stopAsked = false;
    if (!yes || this.closed || this.phase !== "play") return;
    this.board.end("stop"); this.stopped = true;
    this.phase = "over"; this.overT = KOROKORO_SCORE.overWait;
  }
  async results() {
    if (this.paid || this.closed) return;
    this.paid = true; this.phase = "result"; this.stopBtn?.remove();
    const score = this.board.points, st = this.st, rec = KorokoroScore.record(score);
    // ハイスコアの ごほうび: とくべつな かぐ（js/korokoro-prizes.js）
    const gifts = typeof KorokoroPrizes !== "undefined" ? KorokoroPrizes.claim(score) : [];
    const coins = KorokoroScore.pay(score, this.difficulty, this.dailyBoost), rep = KorokoroScore.rep(score), grade = KorokoroScore.grade(score);
    Save.addCoins(coins); st.rep += rep;
    const before = st.lv; st.lv = ShopRewards.level(st);
    const lvUp = st.lv > before, prizes = ShopRewards.claim("korokoro");
    const discs = typeof MusicDiscs !== "undefined" ? MusicDiscs.fromShop("korokoro", [grade]) : [];
    Save.d.stats.shifts++;
    Save.careAll({ hunger: -6, mood: grade >= 2 ? 4 : 1, bond: 1 });
    Save.mark(); Save.write();
    Sound.stopBgm(); Sound.jingle("victory");
    if ((rec.newBest && score > 0) || gifts.length) { setTimeout(() => Sound.se("fanfare"), 600); for (const t of this.team) { t.turn = 9; t.emo = "happy"; t.jump = 0; } }
    const body = U.el("div", { class: "koro-result" });
    body.append(U.el("div", { class: "result-big", text: rec.newBest && score > 0 ? `しんきろく！ ${U.fmt(score)}てん` : `${U.fmt(score)}てん` }));
    const next = st.lv < ShopRewards.maxLevel ? SHOP_LV_REP[st.lv + 1] : null, rows = U.el("div", { class: "result-rows" });
    rows.innerHTML = `<div class="r"><span>スコア</span><span><b>${U.fmt(score)}</b></span></div>
      <div class="r"><span>ハイスコア</span><span>${U.fmt(rec.hi)}</span></div>
      <div class="r"><span>もらった コイン</span><span><b>+${coins}</b></span></div>
      <div class="r"><span>ひょうばん</span><span>+${rep}（${st.rep}${next ? " / " + next : ""}）</span></div>`;
    body.append(rows);
    for (const p of gifts) body.append(KorokoroScore.giftEl(p, true));
    body.append(this.rankingEl(rec.rank));
    if (typeof KorokoroPrizes !== "undefined") { const nx = KorokoroPrizes.next(); body.append(U.el("div", { class: "muted koro-next", text: nx ? `つぎの とくべつな かぐは ${U.fmt(nx.score)}てん（あと ${U.fmt(nx.score - rec.hi)}てん）` : "とくべつな かぐを ぜんぶ あつめた！" })); }
    const gojis = this.board.made[KOROKORO_TIERS.length - 1] || 0, bursts = this.board.made.burst || 0;
    if (gojis || bursts) body.append(U.el("div", { class: "note", text: `ごじを ${gojis}かい つくったよ${bursts ? `（ごじ どうしで ${bursts}かい きえた）` : ""}！` }));
    if (lvUp) body.append(U.el("div", { class: "note", text: `おみせが レベル${st.lv}に なった！` }));
    for (const p of prizes) body.append(U.el("div", { class: "note", text: `Lv.${p.level}の ごほうび！ 「${p.name}」を もらったよ。` }));
    for (const t of discs) body.append(U.el("div", { class: "note", text: t }));
    body.append(U.el("div", { class: "muted", text: `あそびかた: ${GameEconomy.mode(this.difficulty).name}` }));
    body.append(U.el("div", { class: "muted", style: "margin-top:6px", text: "はたらいたので おなかが すこし へった。" }));
    let pick = await new Promise((res) => {
      const foot = U.el("div", { class: "koro-foot" });
      let m = null;
      const go = (v) => () => { if (!m) return; Sound.se("ok"); m.close(); m = null; res(v); };
      foot.append(UI.btn("もういちど", go("again"), "yellow"), UI.btn("てんないに もどる", go("store")));
      m = UI.modal({ title: "スコア モードの けっか", body, closable: false, footer: foot });
    });
    if (this.closed) return;
    if (pick === "again" && Chara.IDS.some((id) => Save.d.chars[id].hunger < 8)) {
      await UI.say([{ who: "wanko", emo: "sad", text: "おなかが ぺこぺこだよ〜。\nごはんを たべてから また あそぼう。" }]);
      pick = "store";
    }
    if (this.closed) return;
    if (pick === "again") Game.goto("koroscore", { back: this.back }, "fade");
    else Game.goto("store", { shop: "korokoro", back: this.back, atCounter: true }, "fade");
  }
  // ランキング（上から 5つ・いまの きろくに しるし）
  rankingEl(rank) {
    const box = U.el("div", { class: "koro-rank" }), tops = this.st.tops || [];
    box.append(U.el("div", { class: "koro-rank-title", text: "ランキング" }));
    for (let i = 0; i < KOROKORO_SCORE.tops; i++) {
      const e = tops[i], row = U.el("div", { class: "koro-rank-row" + (i + 1 === rank ? " now" : "") });
      row.append(U.el("span", { class: "n", text: `${i + 1}い` }), U.el("span", { class: "s", text: e ? `${U.fmt(e.s)}てん` : "ー" }), U.el("span", { class: "d", text: e ? (i + 1 === rank ? "いま！" : KorokoroScore.day(e.d)) : "" }));
      box.append(row);
    }
    return box;
  }
  leave() { if (this.closed || Game.trans) return; Game.goto("store", { shop: "korokoro", back: this.back, atCounter: true }, "fade"); }

  // ---- 入力（あそんで いる ときだけ）----
  down(p) { if (this.phase === "play") this.board.down(p); }
  move(p) { if (this.phase === "play") this.board.move(p); }
  up(p, canceled = false) { if (this.phase === "play") this.board.up(p, canceled); }
  cancel(p) { this.up(p, true); }
  key(k, down) { if (down && this.phase === "play") this.board.key(k); }

  update(dt) {
    if (this.stopBtn) this.stopBtn.disabled = this.phase !== "play" || this.stopAsked;
    if (this.closed || this.stopAsked) return;
    if (this.phase === "play" || this.phase === "over") this.board.tick(dt, this.phase === "play");
    if (this.phase === "over") { this.overT += dt; if (this.overT >= KOROKORO_SCORE.overWait && !this.paid) this.results(); }
    this.danger = this.phase === "play" && this.board.world.topGap < KOROKORO_RULES.warn;
    for (const t of this.team) { if (t.turn > 0) t.turn -= dt; if (t.jump >= 0) { t.jump += dt; if (t.jump > 0.7) t.jump = -1; } }
    this.fxs = this.fxs.filter((f) => (f.t += dt) < (f.dur || 0.8));
  }

  // ---- 描画 ----
  render(ctx) {
    const W = G.W, H = G.H, col = SHOPS.korokoro.color;
    ctx.fillStyle = shade(col, 0.62); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(col, 0.52); for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 18, H);
    // スコアの おび（お店の カウンターの いろ）
    ctx.fillStyle = shade(col, 0.28); ctx.fillRect(0, this.infoY - 4, W, this.infoH + 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, this.infoY + this.infoH + 4); ctx.lineTo(W, this.infoY + this.infoH + 4); ctx.stroke();
    this.drawSign(ctx); this.drawScore(ctx); this.drawNext(ctx); this.drawTeam(ctx);
    this.board.render(ctx, null);
    if (this.phase === "over" || this.phase === "result") this.drawOver(ctx);
    this.drawFx(ctx);
  }
  drawSign(ctx) {
    const W = G.W;
    ctx.save(); ctx.fillStyle = "#FFF7E0"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, 10, 8, W - 115, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("ころころ フルーツ　スコア モード", 10 + (W - 115) / 2, 21.5, W - 130);
    ctx.restore();
  }
  drawScore(ctx) {
    const p = this.panel, score = this.board.points, beat = this.hi0 > 0 && score > this.hi0, font = "'M PLUS Rounded 1c', sans-serif", cx = p.x + p.w / 2;
    ctx.save(); ctx.fillStyle = beat ? "#FFF1C2" : "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#8A7D6A"; ctx.font = `800 10px ${font}`; ctx.fillText("スコア", cx, p.y + 11);
    ctx.fillStyle = INK; ctx.font = `900 ${p.h >= 76 ? 28 : 24}px ${font}`; ctx.fillText(U.fmt(score), cx, p.y + p.h * 0.5, p.w - 12);
    ctx.fillStyle = beat ? "#E8453C" : "#8A7D6A"; ctx.font = `800 10px ${font}`;
    ctx.fillText(beat ? "ハイスコア こうしんちゅう！" : `ハイスコア ${U.fmt(Math.max(this.hi0, score))}`, cx, p.y + p.h - 11, p.w - 10);
    ctx.restore();
  }
  drawNext(ctx) {
    const n = this.nextBox, b = this.board, T = KOROKORO_TIERS, big = T[KOROKORO_RULES.drop - 1].r;
    ctx.save(); ctx.fillStyle = "#FFF1D6"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; U.rr(ctx, n.x, n.y, n.w, n.h, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("つぎ", n.x + n.w / 2, n.y + 11);
    // 大きさの ちがいが わかる ように（いちばん 大きい りんごで まどいっぱい）
    const cap = Math.min(20, (n.h - 26) / 2 / KorokoroArt.CROP, (n.w - 10) / 2 / KorokoroArt.CROP), r = cap * (0.5 + 0.5 * Math.min(1, T[b.next].r / big));
    KorokoroArt.draw(ctx, b.next, "normal", n.x + n.w / 2, n.y + 14 + (n.h - 14) / 2, r);
    ctx.restore();
  }
  drawTeam(ctx) {
    const baseY = this.infoY + this.infoH - 3, ended = this.phase === "over" || this.phase === "result";
    this.team.forEach((t, i) => {
      const c = Save.d.chars[t.id], at = this.teamSpot(i);
      let pose = Math.floor((G.t + i * 0.3) / 0.5) % 2 ? "idle_02" : "idle_01", dy = 0, face = "normal";
      if (t.turn > 0) face = t.emo; else if (this.danger || ended) face = "surprise";
      if (t.jump >= 0) { pose = t.jump < 0.45 ? "jump_01" : "idle_01"; dy = Math.sin(Math.min(1, t.jump / 0.45) * Math.PI) * 10; }
      Chara.draw(ctx, t.id, { pose, dir: "down", face, outfit: c.outfit, color: c.color }, at.x, baseY - dy, this.charSize);
    });
  }
  // おしまいの しるし（箱の まんなか）
  drawOver(ctx) {
    const b = this.board, k = Math.min(1, (this.phase === "result" ? 1 : this.overT) / 0.3), sc = 0.7 + U.ease.outBack(k) * 0.3;
    const x = b.bx + b.bw / 2, y = b.by + b.bh * 0.42, w = Math.min(b.bw * 0.86, 280), font = "'M PLUS Rounded 1c', sans-serif";
    const newBest = this.hi0 < b.points && b.points > 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = k;
    ctx.fillStyle = "rgba(255,253,246,.96)"; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; U.rr(ctx, -w / 2, -58, w, 116, 22); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#E8453C"; ctx.font = `900 26px ${font}`; ctx.fillText(this.stopped ? "おつかれさま！" : "おしまい！", 0, -26, w - 20);
    ctx.fillStyle = INK; ctx.font = `900 18px ${font}`; ctx.fillText(`スコア ${U.fmt(b.points)}てん`, 0, 10, w - 20);
    if (newBest) { ctx.fillStyle = "#C98A16"; ctx.font = `900 14px ${font}`; ctx.fillText("しんきろく！", 0, 38, w - 20); }
    ctx.restore();
  }
  drawFx(ctx) {
    for (const f of this.fxs) {
      const k = f.t / (f.dur || 0.8);
      ctx.save(); ctx.globalAlpha = 1 - k;
      if (f.kind === "text") {
        ctx.font = "900 15px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#FFF"; ctx.fillStyle = "#E8453C";
        ctx.strokeText(f.text, f.x, f.y - k * 12); ctx.fillText(f.text, f.x, f.y - k * 12);
      }
      ctx.restore();
    }
  }
}
SCENES.koroscore = KorokoroScoreScene;
