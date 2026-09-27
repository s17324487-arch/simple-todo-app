// おうちの会話・みまもり。時間で増える状態は現在のシーン内だけに保持する。
const HomeLife = {
  lines: {
    wanko: ["きょうは どこに いこう？", "みんな いっしょが いいな！", "あそんでー！", "まま、みてみて！", "ぱぱと おさんぽ したいな", "この ふく おきにいり！", "がちゃん、いっしょに あそぼ", "ごじは あったかいね"],
    gachan: ["ぴよ♪ おはなに おみず あげたよ", "みんなの おやつ、わけようね", "あそんでー！", "ぱぱの おひざ すき", "ままに おはな あげよう", "ごじの しっぽ ふかふか？", "わんこ、かくれんぼ しよう", "この へや すてきだね"],
    goji: ["ガォー！ みんな だいすき", "ガゥー♪ なでて〜", "ガゥー、おひるね しよう", "ガォー！ あそんでー", "ぱぱ、だっこ〜", "ままの ごはん すき", "ガゥー、てを つなごう", "ぼくが みんなを まもるよ"],
  },
  rare: { wanko: "ゆめで おほしさまを つかまえた！", gachan: "しあわせは 3にんぶんより おおきいね", goji: "ガゥー……おつきさまも かぞくかな？" },
  init(sc) { sc.life = { next: 4, bubbles: [], quarrel: false, elapsed: 0, furniture: {} }; },
  say(sc, id, text, rare = false) {
    sc.life.bubbles = sc.life.bubbles.filter(b => b.id !== id);
    sc.life.bubbles.push({ id, text, rare, left: 5 });
    if (sc.life.bubbles.length > 3) sc.life.bubbles.shift();
    if (rare) { Save.d.flags.rareChats = (Save.d.flags.rareChats || 0) + 1; Save.mark(); Sound.se("sparkle"); }
  },
  event(sc, kind) {
    const c = U.pick(sc.chars), d = Save.d.chars[c.id];
    if (kind === "quarrel") {
      sc.life.quarrel = true; sc.life.elapsed = 0;
      this.say(sc, "wanko", "その おもちゃ つかいたい！");
      this.say(sc, "gachan", "じゅんばんこに しようよ！");
      sc.chars.slice(0, 2).forEach(c => { c.emo = "angry"; c.state = "idle"; c.t = 12; });
    } else if (kind === "rare") this.say(sc, c.id, this.rare[c.id], true);
    else if (kind === "chat") {
      this.say(sc, "wanko", "つぎは 3にんで なにする？");
      this.say(sc, "gachan", "おはなを みに いこう♪");
      this.say(sc, "goji", "ガゥー！ さんせい！");
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
    } else if (kind === "dance") {
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
      this.say(sc, c.id, "みんなで いち、に、さん♪");
    } else if (d.hunger < 25 || kind === "hungry") {
      this.say(sc, c.id, "ぐぅー……おなか すいたよ"); Sound.se("tummy"); sc.fx("sweat", c);
    } else if (d.wantsDeza) this.say(sc, c.id, c.id === "goji" ? "ガゥー、デザ たべたい！" : "ごはんの あとは デザ ほしいな♪");
    else this.say(sc, c.id, U.pick(this.lines[c.id]));
  },
  settle(sc, tapped = true) {
    if (!sc.life.quarrel) return false;
    sc.life.quarrel = false;
    sc.chars.forEach(c => { c.emo = null; sc.react(c, "happy", "heart"); });
    this.say(sc, "wanko", "ごめんね。いっしょに あそぼ！");
    this.say(sc, "gachan", tapped ? "なかなおり！ ありがとう♪" : "うん！ なかなおり♪");
    if (tapped) Save.careAll({ mood: 2 });
    return true;
  },
  update(sc, dt) {
    const l = sc.life;
    if (document.hidden || UI.busy || sc.mode) return;
    l.bubbles = l.bubbles.filter(b => (b.left -= dt) > 0);
    for (const uid in l.furniture) { l.furniture[uid] -= dt; if (l.furniture[uid] <= 0) delete l.furniture[uid]; }
    if (l.quarrel) { l.elapsed += dt; if (l.elapsed > 12) this.settle(sc, false); return; }
    if ((l.next -= dt) <= 0) {
      const r = Math.random();
      this.event(sc, r < 0.035 ? "rare" : r < 0.13 ? "quarrel" : r < 0.43 ? "chat" : r < 0.58 ? "dance" : "solo");
      l.next = sc.watching ? U.rand(7, 11) : U.rand(12, 20);
    }
  },
  toggle(sc) {
    sc.watching = !sc.watching;
    sc.bar.classList.toggle("hidden", sc.watching); sc.care.classList.toggle("hidden", sc.watching);
    sc.watchExit.classList.toggle("hidden", !sc.watching);
    sc.layout(); sc.buildBg();
    if (sc.watching) { sc.life.next = 1; UI.toast("なでたり、けんかを タップで なかなおり♪"); }
  },
  draw(sc, ctx) {
    if (sc.mode) return;
    ctx.save();
    for (const b of sc.life.bubbles) {
      const index = sc.life.bubbles.indexOf(b), y = (sc.watching ? 145 : 156) + index * 43;
      const w = G.W - 24, x = 12;
      ctx.fillStyle = b.rare ? "#FFF0A5" : "#FFFDF6"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      U.rr(ctx, x, y, w, 38, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#79654E"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left"; ctx.fillText(Save.d.chars[b.id].name + (b.rare ? " ☆" : ""), x + 10, y + 12);
      ctx.fillStyle = INK; ctx.font = "700 11px sans-serif"; ctx.fillText(b.text, x + 10, y + 28, w - 20);
    }
    if (sc.life.quarrel) { ctx.fillStyle = "#FFF3C4"; U.rr(ctx, 35, 128, G.W - 70, 28, 10); ctx.fill(); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = "bold 12px sans-serif"; ctx.fillText("ふたりを タップで なかなおり", G.W / 2, 147); }
    ctx.restore();
  },
  parent(sc, ctx, id, x, y) {
    const p = sc.toScreen(x, y), s = sc.s * 0.72;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round";
    const shape = (x, y, w, h, r, col) => { ctx.fillStyle = col; U.rr(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke(); };
    ctx.fillStyle = "rgba(31,29,27,.14)"; ctx.beginPath(); ctx.ellipse(0, 0, 31, 8, 0, 0, 7); ctx.fill();
    shape(-24, -112, 48, id === "mama" ? 61 : 47, 20, "#594033");
    shape(-22, -65, 44, 52, 13, id === "papa" ? "#8BBED9" : "#EFA6B7");
    shape(-29, -59, 10, 32, 6, "#F9D3B5"); shape(19, -59, 10, 32, 6, "#F9D3B5");
    shape(-18, -23, 13, 22, 5, "#51465E"); shape(5, -23, 13, 22, 5, "#51465E");
    shape(-20, -105, 40, 43, 18, "#F9D3B5");
    ctx.fillStyle = INK; for (const ex of [-8, 8]) { ctx.beginPath(); ctx.arc(ex, -85, 2, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, -78, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    if (id === "papa") { ctx.strokeRect(-15, -91, 13, 10); ctx.strokeRect(2, -91, 13, 10); }
    else { ctx.fillStyle = "#FFE066"; ctx.beginPath(); ctx.arc(18, -103, 7, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.fillText(id === "papa" ? "ぱぱ" : "まま", 0, 20);
    ctx.restore();
  },
};

const HomeRooms = {
  catalog: [{ id: "main", name: "いつもの おへや", price: 0, wins: 0 }, { id: "study", name: "ひだまりの アトリエ", price: 4500, wins: 10 }, { id: "garden", name: "そらの サンルーム", price: 9000, wins: 30 }],
  all() { return [Save.d.room, ...Object.values(Save.d.rooms.stored)]; },
  open(sc) {
    const body = U.el("div"), m = UI.modal({ title: "おへやを ふやす", body });
    for (const r of this.catalog) {
      const own = Save.d.rooms.owned[r.id];
      const card = U.el("div", { class: "note" });
      card.append(U.el("div", { text: r.name + (own ? "（もってる）" : `：${r.price} コイン・バトル ${r.wins}かい しょうり`) }));
      const b = UI.btn(own ? "このへやへ" : "おへやを かう", async () => {
        if (!own) {
          if (Save.d.coins < r.price || Save.d.stats.wins < r.wins) { UI.toast("コインと しょうりすうが たりないよ"); return; }
          if (!await UI.confirm(`${r.price} コインで ${r.name}を かう？`)) return;
          if (Save.d.rooms.owned[r.id]) return;
          Save.addCoins(-r.price); Save.d.rooms.owned[r.id] = true;
        }
        this.switchTo(r.id); m.close(); Game.goto("house");
      }, "wide");
      b.disabled = Save.d.rooms.active === r.id || (!own && (Save.d.coins < r.price || Save.d.stats.wins < r.wins));
      card.append(b); body.append(card);
    }
    body.append(U.el("div", { class: "note", text: "かぐの もちものは ぜんぶの おへやで きょうゆう。へやごとに もようがえを おぼえるよ。" }));
  },
  switchTo(id) {
    const rs = Save.d.rooms;
    if (!rs.owned[id] || rs.active === id) return false;
    const old = Save.d.room;
    rs.stored[rs.active] = old;
    Save.d.room = rs.stored[id] || { wall: "wp_cream", floor: "fl_wood", items: [], wallpapers: {}, floors: {}, nextUid: 1 };
    Object.assign(Save.d.room.wallpapers, old.wallpapers); Object.assign(Save.d.room.floors, old.floors);
    delete rs.stored[id]; rs.active = id; Save.mark(); Save.write(); return true;
  },
};
