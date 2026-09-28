// おうちの会話・みまもり。時間で増える状態は現在のシーン内だけに保持する。
const HomeLife = {
  lines: {
    wanko: ["きょうは どこに いこう？", "みんな いっしょが いいな！", "あそんでー！", "まま、みてみて！", "ぱぱと おさんぽ したいな", "この ふく おきにいり！", "がちゃん、いっしょに あそぼ", "ごじは あったかいね"],
    gachan: ["ぴよ♪ おはなに おみず あげたよ", "みんなの おやつ、わけようね", "あそんでー！", "ぱぱの おひざ すき", "ままに おはな あげよう", "ごじの しっぽ ふかふか？", "わんこ、かくれんぼ しよう", "この へや すてきだね"],
    goji: ["ガォー！ みんな だいすき", "ガゥー♪ なでて〜", "ガゥー、おひるね しよう", "ガォー！ あそんでー", "ぱぱ、だっこ〜", "ままの ごはん すき", "ガゥー、てを つなごう", "ぼくが みんなを まもるよ"],
  },
  rare: { wanko: "ゆめで おほしさまを つかまえた！", gachan: "しあわせは 3にんぶんより おおきいね", goji: "ガゥー……おつきさまも かぞくかな？" },
  init(sc) { sc.life = { next: 4, bubbles: [], quarrel: false, elapsed: 0, furniture: {}, queue: [], talkWait: 0, log: [] }; ParentCare.init(sc); },
  say(sc, id, text, rare = false, kind = "say") {
    sc.life.bubbles = sc.life.bubbles.filter(b => b.id !== id);
    kind = rare ? 'rare' : kind;
    const life = HomeBubbles.life(text);
    sc.life.bubbles.push({ id, text, kind, rare, born:G.t, life, left:life });
    if (sc.life.bubbles.length > 2) sc.life.bubbles.shift();
    sc.life.log.push({id,text,kind,t:G.t});if(sc.life.log.length>80)sc.life.log.shift();
    if (rare) { Save.d.flags.rareChats = (Save.d.flags.rareChats || 0) + 1; Save.mark(); Sound.se("sparkle"); }
  },
  converse(sc, turns) {
    sc.life.queue=turns.map(t=>({...t}));sc.life.talkWait=0;this.advance(sc,0);
  },
  advance(sc,dt) {
    if(sc.life.queue.length && (sc.life.talkWait-=dt)<=1e-9){
      const t=sc.life.queue.shift();this.say(sc,t.who,t.text,!!t.rare,t.kind||'say');sc.life.talkWait=1.3;
    }
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
      this.converse(sc,[{who:'wanko',text:'つぎは 3にんで なにする？'},{who:'gachan',text:'おはなを みに いこう♪'},{who:'goji',text:'ガゥー！ さんせい！'}]);
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
    } else if (kind === "weather") this.say(sc,c.id,Weather.comment(c.id));
    else if (kind === "dance") {
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
      this.say(sc, c.id, "みんなで いち、に、さん♪");
    } else if (d.hunger < 25 || kind === "hungry") {
      this.say(sc, c.id, "ぐぅー……おなか すいたよ"); Sound.se("tummy"); sc.fx("sweat", c);
    } else if (d.hunger >= 90) this.say(sc,c.id,Care.fullText(c.id)+(d.wantsDeza?" デザは べつばら♪":""));
    else if (d.wantsDeza) this.say(sc, c.id, c.id === "goji" ? "ガゥー、デザ たべたい！" : "ごはんの あとは デザ ほしいな♪");
    else this.say(sc, c.id, U.chance(.16)?Weather.comment(c.id):U.pick(this.lines[c.id]));
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
    if (document.hidden || UI.busy || sc.mode) { for(const b of l.bubbles)b.born+=dt; return; }
    l.bubbles = l.bubbles.filter(b => (b.left -= dt) > 0);
    this.advance(sc,dt);
    for (const uid in l.furniture) { l.furniture[uid] -= dt; if (l.furniture[uid] <= 0) delete l.furniture[uid]; }
    if (l.quarrel) { l.elapsed += dt; if (l.elapsed > 12) this.settle(sc, false); return; }
    if (!l.queue.length && (l.next -= dt) <= 0) {
      const r = Math.random();
      this.event(sc, r < 0.035 ? "rare" : r < 0.13 ? "quarrel" : r < 0.43 ? "chat" : r < 0.58 ? "dance" : "solo");
      l.next = sc.watching ? U.rand(7, 11) : U.rand(12, 20);
    }
  },
  toggle(sc) {
    sc.watching = !sc.watching;
    sc.bar.classList.toggle("hidden", sc.watching); sc.care.classList.toggle("hidden", sc.watching);
    sc.watchExit.classList.toggle("hidden", !sc.watching);
    sc.parentButton.classList.toggle("watching",sc.watching);
    sc.layout(); sc.buildBg();
    if (sc.watching) sc.life.next = 1;
  },
  heads(sc) {
    const heads={},k=sc.actorScale;
    for(const c of [...sc.chars,...sc.parents]){
      if(c.hidden)continue;const parent=c.id==='papa'||c.id==='mama',p=sc.toScreen(c.x,c.y),h={x:p.x,y:p.y-(parent?104:84)*k,r:(parent?21:24)*k};
      if(h.x>=8&&h.x<=G.W-8&&h.y>=sc.view.top&&h.y<=sc.view.bottom)heads[c.id]=h;
    }
    return heads;
  },
  bubbleLayout(sc,ctx) {
    const heads=this.heads(sc),bubbles=sc.life.bubbles.map(b=>({...b,name:(Save.d.chars[b.id]?.name||ParentCare.name(b.id))+(b.rare?' ☆':'')}));
    return HomeBubbles.layout(ctx,bubbles,heads,{top:sc.view.top,bottom:sc.view.bottom,left:8,right:G.W-8}).map(b=>({...b,anchor:heads[b.id],tail:b.tip}));
  },
  draw(sc, ctx) {
    if(['edit','sleep','dress'].includes(sc.mode))return;
    ctx.save();const boxes=this.bubbleLayout(sc,ctx);sc.life.boxes=boxes;HomeBubbles.draw(ctx,boxes,G.t);
    if(sc.life.quarrel){ctx.fillStyle="#FFF3C4";U.rr(ctx,12,157,G.W-130,28,10);ctx.fill();ctx.fillStyle=INK;ctx.textAlign="center";ctx.font="bold 11px sans-serif";ctx.fillText("タップで なかなおり",(G.W-106)/2,175);}
    ctx.restore();
  },

};

const HomeRooms = {
  catalog: [{ id: "main", name: "いつもの おへや", price: 0, wins: 0 }, { id: "study", name: "ひだまりの アトリエ", price: 4500, wins: 10 }, { id: "garden", name: "そらの サンルーム", price: 9000, wins: 30 }],
  expansionPrice: 6000,
  all() { return [Save.d.room, ...Object.values(Save.d.rooms.stored)]; },
  expand(id) {
    const rs = Save.d.rooms;
    if (id !== rs.active || !this.catalog.some(r => r.id === id) || !rs.owned[id] || rs.expanded[id] || Save.d.coins < this.expansionPrice) return false;
    Save.addCoins(-this.expansionPrice); rs.expanded[id] = true;
    Save.mark(); Save.write(); return true;
  },
  open(sc) {
    const body = U.el("div"), m = UI.modal({ title: "おへや", body });
    const id = Save.d.rooms.active, expanded = Save.d.rooms.expanded[id], price = this.expansionPrice;
    const current = this.catalog.find(r => r.id === id), card = U.el("div", { class: "note room-expansion" });
    card.append(U.el("strong", { text: "いまの おへやを ひろげる" }), U.el("div", { text: current.name }),
      U.el("div", { text: expanded ? "ひろさ 2ばい（ひろげたよ）" : `ひろさ 1ばい → 2ばい：${price} コイン` }),
      U.el("div", { text: "かぐの ばしょ・かべがみ・ゆかは そのまま。\nひとつの おへやに 1かいだけ。" }));
    const expand = UI.btn(expanded ? "ひろげたよ" : "2ばいに ひろげる", async () => {
      if (expand.disabled) return;
      expand.disabled = true;
      if (!await UI.confirm(`${price} コインで ${current.name}を 2ばいに ひろげる？\nかぐの ばしょは そのままだよ。`)) { expand.disabled = Save.d.coins < price; return; }
      if (G.scene !== sc || !this.expand(id)) { UI.toast("いまは ひろげられないよ"); expand.disabled = !!Save.d.rooms.expanded[id] || Save.d.coins < price; return; }
      m.close(); Game.goto("house", { msg: "おへやが 2ばいに ひろがったよ！" });
    }, "wide yellow");
    expand.disabled = !!expanded || Save.d.coins < price;
    card.append(expand);
    if (!expanded && Save.d.coins < price) card.append(U.el("div", { text: `あと ${price - Save.d.coins} コイン ためよう。` }));
    body.append(card, U.el("strong", { text: "べつの おへや" }));
    for (const r of this.catalog) {
      const own = Save.d.rooms.owned[r.id];
      const card = U.el("div", { class: "note", "data-room": r.id });
      card.append(U.el("div", { text: r.name + (own ? `（もってる・ひろさ ${Save.d.rooms.expanded[r.id] ? 2 : 1}ばい）` : `：${r.price} コイン・バトル ${r.wins}かい しょうり`) }));
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
