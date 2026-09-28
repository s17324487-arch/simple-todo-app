// タイトル画面とオープニング
class TitleScene {
  async enter() {
    this.t = 0;
    this.hops = Chara.IDS.map((id, i) => ({ id, t: -i * 0.35 }));
    const list = [];
    for (const id of Chara.IDS) {
      const c = Save.d.chars[id];
      for (const pose of ["idle_01", "idle_02", "jump_01", "land_01"]) list.push([id, { pose, face: pose === "jump_01" ? "happy" : "normal", outfit: c.outfit, color: c.color }]);
    }
    await Chara.preload(list, 108);
    Sound.bgm("title");
    this.buildUI();
  }
  exit() { if (this.ui) this.ui.remove(); }
  buildUI() {
    const has = Save.exists();
    this.ui = U.el("div", { class: "title-ui" });
    if (has) {
      this.ui.append(UI.btn("つづきから", () => { Sound.init(); Sound.se("ok"); this.start(false); }, "yellow"));
      this.ui.append(UI.btn("はじめから", async () => {
        Sound.init(); Sound.se("tap");
        if (await UI.confirm("はじめから あそぶと、いまの セーブデータは きえてしまいます。\nほんとうに いい？", "はじめから", "やめる")) this.start(true);
      }));
    } else {
      this.ui.append(UI.btn("はじめる", () => { Sound.init(); Sound.se("ok"); this.start(true); }, "yellow"));
    }
    this.ui.append(U.el("div", { class: "ver", text: `ver ${GAME_VERSION}　タップで おとが でます ♪` }));
    document.getElementById("ui").append(this.ui);
  }
  async start(fresh) {
    if (this.starting) return;
    this.starting = true;
    this.ui.remove();
    if (fresh) {
      Save.reset();
      await this.opening();
      DailyPlay.visit();
      Save.write();
      Game.goto("house", { intro: true }, "circle");
    } else {
      Save.applyElapsed(true);
      DailyPlay.visit();
      const w = Save.d.world;
      if (w.house) Game.goto("house", {}, "circle");
      else Game.goto("world", { map: w.map, x: w.x, y: w.y, dir: w.dir }, "circle");
    }
  }
  async opening() {
    await UI.say([
      { name: "ナレーション", text: "ここは ぽかぽかタウン。\nのんびりした どうぶつたちが くらす ちいさな まち。" },
      { who: "wanko", emo: "happy", text: "ワン！ ぼく わんこ！\nきょうから この まちで くらすんだ！" },
      { who: "gachan", emo: "love", text: "ぴよっ！ がちゃんだよ。\n3にん いっしょの おうち、たのしみだね！" },
      { who: "goji", emo: "happy", text: "ガオー。……ごじ です。\nふたりと いっしょなら、どこでも へいき。" },
    ]);
    const i = await UI.ask("ごじの からだの いろは どっち？\n（あとから「きがえ」で かえられるよ）", ["ふんわり グレー", "かっこいい ダーク"], { cancel: false, who: "goji" });
    Save.d.chars.goji.color = i === 1 ? "dark" : "soft";
    await UI.say([
      { name: "ナレーション", text: "3にんは いつも いっしょ。\nごはんを たべて、あそんで、おしゃれして、\nときには ぼうけんにも でかけよう！" },
    ]);
  }
  update(dt) {
    this.t += dt;
    for (const h of this.hops) { h.t += dt; if (h.t > 2.4) h.t -= 2.4; }
  }
  render(ctx) {
    const W = G.W, H = G.H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#A8DBFF"); g.addColorStop(0.55, "#DFF3FF"); g.addColorStop(0.56, "#A6D883"); g.addColorStop(1, "#8CC56C");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // くも
    for (let i = 0; i < 4; i++) {
      const x = ((i * 130 + this.t * (8 + i * 3)) % (W + 160)) - 80, y = 70 + i * 48;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath(); ctx.ellipse(x, y, 34, 14, 0, 0, 7); ctx.ellipse(x - 18, y + 2, 18, 11, 0, 0, 7); ctx.ellipse(x + 16, y - 6, 20, 14, 0, 0, 7); ctx.fill();
    }
    // 丘と町
    const hy = H * 0.56;
    ctx.fillStyle = "#8FCB6B";
    ctx.beginPath(); ctx.moveTo(0, hy); ctx.quadraticCurveTo(W * 0.25, hy - 40, W * 0.5, hy - 6); ctx.quadraticCurveTo(W * 0.78, hy - 38, W, hy - 4); ctx.lineTo(W, hy + 20); ctx.lineTo(0, hy + 20); ctx.fill();
    const houses = [[0.16, "#E8665F"], [0.34, "#5C9DED"], [0.66, "#F48FB1"], [0.84, "#6DBE5B"]];
    for (const [fx, col] of houses) {
      const x = W * fx, y = hy - 18;
      ctx.fillStyle = "#FFF4DC"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillRect(x - 13, y, 26, 18); ctx.strokeRect(x - 13, y, 26, 18);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 17, y + 1); ctx.lineTo(x, y - 14); ctx.lineTo(x + 17, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#A8743F"; ctx.fillRect(x - 3, y + 8, 6, 10);
    }
    // ロゴ
    const ly = H * 0.2;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 44px 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
    const title = "ぽかぽかタウン";
    const wob = Math.sin(this.t * 2) * 2;
    ctx.lineJoin = "round";
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText(title, W / 2, ly + wob);
    const tg = ctx.createLinearGradient(0, ly - 22, 0, ly + 22);
    tg.addColorStop(0, "#FFE066"); tg.addColorStop(1, "#F29A1F");
    ctx.fillStyle = tg; ctx.fillText(title, W / 2, ly + wob);
    ctx.font = "800 15px 'M PLUS Rounded 1c', sans-serif";
    const sub = "わんこ・がちゃん・ごじの なかよし生活";
    const sw = ctx.measureText(sub).width + 28;
    U.rr(ctx, W / 2 - sw / 2, ly + 34, sw, 28, 14);
    ctx.fillStyle = "#FFFDF6"; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.fillText(sub, W / 2, ly + 48.5);
    ctx.restore();
    // 3にん（README推奨: idle_02 → jump_01 → land_01 → idle_01）
    const gy = H * 0.64;
    this.hops.forEach((h, i) => {
      const x = W / 2 + (i - 1) * 104;
      let pose = "idle_01", dy = 0;
      const t = h.t;
      if (t >= 0 && t < 0.12) pose = "idle_02";
      else if (t >= 0.12 && t < 0.52) { pose = "jump_01"; dy = Math.sin(((t - 0.12) / 0.4) * Math.PI) * 38; }
      else if (t >= 0.52 && t < 0.66) pose = "land_01";
      else pose = Math.floor(this.t / 0.5) % 2 ? "idle_02" : "idle_01";
      ctx.fillStyle = "rgba(31,29,27,0.18)";
      ctx.beginPath(); ctx.ellipse(x, gy + 94, 34 - dy * 0.3, 8, 0, 0, 7); ctx.fill();
      const c = Save.d.chars[h.id];
      Chara.draw(ctx, h.id, { pose, face: pose === "jump_01" ? "happy" : "normal", outfit: c.outfit, color: c.color }, x, gy + 94 - dy, 108);
    });
  }
  down() { Sound.init(); }
}
SCENES.title = TitleScene;
