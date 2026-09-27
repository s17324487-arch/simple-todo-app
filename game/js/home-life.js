// おうちの会話・みまもり。時間で増える状態は現在のシーン内だけに保持する。
const HomeLife = {
  lines: {
    wanko: ["きょうは どこに いこう？", "みんな いっしょが いいな！", "あそんでー！", "まま、みてみて！", "ぱぱと おさんぽ したいな", "この ふく おきにいり！", "がちゃん、いっしょに あそぼ", "ごじは あったかいね"],
    gachan: ["ぴよ♪ おはなに おみず あげたよ", "みんなの おやつ、わけようね", "あそんでー！", "ぱぱの おひざ すき", "ままに おはな あげよう", "ごじの しっぽ ふかふか？", "わんこ、かくれんぼ しよう", "この へや すてきだね"],
    goji: ["ガォー！ みんな だいすき", "ガゥー♪ なでて〜", "ガゥー、おひるね しよう", "ガォー！ あそんでー", "ぱぱ、だっこ〜", "ままの ごはん すき", "ガゥー、てを つなごう", "ぼくが みんなを まもるよ"],
  },
  rare: { wanko: "ゆめで おほしさまを つかまえた！", gachan: "しあわせは 3にんぶんより おおきいね", goji: "ガゥー……おつきさまも かぞくかな？" },
  init(sc) { sc.life = { next: 4, bubbles: [], quarrel: false, elapsed: 0, furniture: {} }; ParentCare.init(sc); },
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
    } else if (d.hunger >= 90) this.say(sc,c.id,Care.fullText(c.id)+(d.wantsDeza?" デザは べつばら♪":""));
    else if (d.wantsDeza) this.say(sc, c.id, c.id === "goji" ? "ガゥー、デザ たべたい！" : "ごはんの あとは デザ ほしいな♪");
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
    sc.parentButton.classList.toggle("watching",sc.watching);
    sc.layout(); sc.buildBg();
    if (sc.watching) sc.life.next = 1;
  },
  bubbleLayout(sc,ctx) {
    const boxes=[], top=sc.watching?112:194, bottom=G.H-(sc.watching?65:143);
    const faces=[...sc.chars,...sc.parents].filter(c=>!c.hidden).map(c=>{const p=sc.toScreen(c.x,c.y);return{x:p.x-30*sc.s,y:p.y-86*sc.s,w:60*sc.s,h:54*sc.s};});
    ctx.font="700 11px sans-serif";
    for(const b of sc.life.bubbles){
      const c=sc.chars.find(c=>c.id===b.id)||sc.parents.find(p=>p.id===b.id);if(!c||c.hidden)continue;
      const anchor=sc.toScreen(c.x,c.y-(b.id==="papa"||b.id==="mama"?100:86));
      const w=Math.min(168,G.W-24),lines=[];let line="";
      for(const ch of b.text){if(ch==="\n"||ctx.measureText(line+ch).width>w-20){lines.push(line);line=ch==="\n"?"":ch;}else line+=ch;}
      if(line)lines.push(line);
      const h=24+lines.length*14, maxY=Math.max(top,bottom-h);
      const xs=[U.clamp(anchor.x-w/2,8,G.W-w-8),8,G.W-w-8];
      const preferred=anchor.y-h-12;
      const ys=[0,-1,1,-2,2,-3,3].map(n=>U.clamp(preferred+n*(h+8),top,maxY));
      let chosen=null;
      for(const y of ys){for(const x of xs){if(![...boxes,...faces].some(r=>x<r.x+r.w+6&&x+w+6>r.x&&y<r.y+r.h+6&&y+h+6>r.y)){chosen={x,y};break;}}if(chosen)break;}
      boxes.push({...b,...(chosen||{x:xs[0],y:top}),w,h,lines,anchor});
    }
    return boxes;
  },
  draw(sc, ctx) {
    if(["edit","sleep","dress"].includes(sc.mode))return;
    ctx.save();
    const boxes=this.bubbleLayout(sc,ctx);sc.life.boxes=boxes;
    // しっぽは話者の方向へ短く。長い線が顔や別の吹き出しを横切らないよう、先に描く。
    for(const b of boxes){
      const below=b.anchor.y>=b.y+b.h/2, ax=U.clamp(b.anchor.x,b.x+12,b.x+b.w-12),ay=below?b.y+b.h-2:b.y+2;
      const dx=b.anchor.x-ax,dy=b.anchor.y-ay,d=Math.hypot(dx,dy),n=Math.min(26,d)/Math.max(1,d);
      ctx.fillStyle=b.rare?"#FFF0A5":"#FFFDF6";ctx.strokeStyle=INK;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(ax-7,ay);ctx.lineTo(ax+dx*n,ay+dy*n);ctx.lineTo(ax+7,ay);ctx.closePath();ctx.fill();ctx.stroke();
    }
    for(const b of boxes){
      const fill=b.rare?"#FFF0A5":"#FFFDF6";
      ctx.fillStyle=fill;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin="round";
      U.rr(ctx,b.x,b.y,b.w,b.h,12);ctx.fill();ctx.stroke();
      ctx.fillStyle="#79654E";ctx.font="bold 10px sans-serif";ctx.textAlign="left";
      ctx.fillText((Save.d.chars[b.id]?.name||ParentCare.name(b.id))+(b.rare?" ☆":""),b.x+10,b.y+13);
      ctx.fillStyle=INK;ctx.font="700 11px sans-serif";
      b.lines.forEach((line,i)=>ctx.fillText(line,b.x+10,b.y+28+i*14));
    }
    if(sc.life.quarrel){ctx.fillStyle="#FFF3C4";U.rr(ctx,12,157,G.W-130,28,10);ctx.fill();ctx.fillStyle=INK;ctx.textAlign="center";ctx.font="bold 11px sans-serif";ctx.fillText("タップで なかなおり",(G.W-106)/2,175);}
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
