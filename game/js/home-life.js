// おうちの会話・みまもり。時間で増える状態は現在のシーン内だけに保持する。
const HomeLife = {
  lines: {
    wanko: ["きょうは どこに いこう？", "みんな いっしょが いいな！", "あそんでー！", "まま、みてみて！", "ぱぱと おさんぽ したいな", "この ふく おきにいり！", "がちゃん、いっしょに あそぼ", "ごじは あったかいね"],
    gachan: ["ぴよ♪ おはなに おみず あげたよ", "みんなの おやつ、わけようね", "あそんでー！", "ぱぱの おひざ すき", "ままに おはな あげよう", "ごじの しっぽ ふかふか？", "わんこ、かくれんぼ しよう", "この へや すてきだね"],
    goji: ["ガォー！ みんな だいすき", "ガゥー♪ なでて〜", "ガゥー、おひるね しよう", "ガォー！ あそんでー", "ぱぱ、だっこ〜", "ままの ごはん すき", "ガゥー、てを つなごう", "ぼくが みんなを まもるよ"],
  },
  rare: { wanko: "ゆめで おほしさまを つかまえた！", gachan: "しあわせは 3にんぶんより おおきいね", goji: "ガゥー……おつきさまも かぞくかな？" },
  // time: この シーンで あそんだ 秒（メニュー中などは すすまない）。events: できごと → いつまで 覚えて いるか（time）
  init(sc) {
    sc.life = { next: 8, bubbles: [], quarrel: false, elapsed: 0, furniture: {}, queue: [], talkWait: 0, log: [],
      time: 0, events: {}, recent: [], recentTalks: [], sniffs: [], aloneT: 0, aloneAt: -999, lastMode: null };
    this.enterEvents(sc); ParentCare.init(sc); HomeActions.init(sc);
  },
  say(sc, id, text, rare = false, kind = "say", meta = null) {
    sc.life.bubbles = sc.life.bubbles.filter(b => b.id !== id);
    kind = rare ? 'rare' : kind;
    const life = HomeBubbles.life(text);
    sc.life.bubbles.push({ id, text, kind, rare, born:G.t, life, left:life });
    if (sc.life.bubbles.length > 2) sc.life.bubbles.shift();
    sc.life.log.push({id,text,kind,t:G.t,...(meta||{})});if(sc.life.log.length>80)sc.life.log.shift();
    if (rare) { Save.d.flags.rareChats = (Save.d.flags.rareChats || 0) + 1; Save.mark(); Sound.se("sparkle"); }
  },
  converse(sc, turns) {
    sc.life.queue=turns.map(t=>({...t}));sc.life.talkWait=0;this.advance(sc,0);
  },
  advance(sc,dt) {
    if(sc.life.queue.length && (sc.life.talkWait-=dt)<=1e-9){
      const t=sc.life.queue.shift();this.say(sc,t.who,t.text,!!t.rare,t.kind||'say',t.meta);sc.life.talkWait=1.3;
    }
  },
  event(sc, kind) {
    const D = this.data(), c = U.pick(sc.chars), d = Save.d.chars[c.id];
    if (kind === "quarrel") {
      sc.life.quarrel = true; sc.life.elapsed = 0;
      const t = this.triggerTalk("quarrel");
      if (this.playTalk(sc, t)) sc.chars.filter(c => t.turns.some(x => x.who === c.id && x.kind === "shout")).forEach(c => { c.emo = "angry"; c.state = "idle"; c.t = 12; });
      else {
        this.say(sc, "wanko", "その おもちゃ つかいたい！");
        this.say(sc, "gachan", "じゅんばんこに しようよ！");
        sc.chars.slice(0, 2).forEach(c => { c.emo = "angry"; c.state = "idle"; c.t = 12; });
      }
    } else if (kind === "rare") { if (!this.sayLine(sc, this.pickLine(sc, c.id, ["rare"]))) this.say(sc, c.id, this.rare[c.id], true); }
    else if (kind === "chat") {
      if (!this.chat(sc)) this.converse(sc,[{who:'wanko',text:'つぎは 3にんで なにする？'},{who:'gachan',text:'おはなを みに いこう♪'},{who:'goji',text:'ガゥー！ さんせい！'}]);
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
    } else if (kind === "weather") {
      if (this.scared(sc)) return;
      if (!this.sayLine(sc, this.pickLine(sc, c.id, ["context", "persona"], "weather"))) this.say(sc,c.id,Weather.comment(c.id));
    } else if (kind === "dance") {
      sc.chars.forEach(c => sc.react(c, "happy", "note"));
      this.say(sc, c.id, "みんなで いち、に、さん♪");
    } else if (d.hunger < 25 || kind === "hungry") {
      if (!this.sayLine(sc, this.pickLine(sc, c.id, ["context", "persona"], "state"))) this.say(sc, c.id, "ぐぅー……おなか すいたよ", false, "cry");
      Sound.se("tummy"); sc.fx("sweat", c);
    } else if (D && (d.hunger >= 90 || d.wantsDeza) && U.chance(0.5)) {
      if (!this.sayLine(sc, this.pickLine(sc, c.id, ["context", "persona"], "state"))) this.say(sc,c.id,Care.fullText(c.id));
    } else if (!D && d.hunger >= 90) this.say(sc,c.id,Care.fullText(c.id)+(d.wantsDeza?" デザは べつばら♪":""));
    else if (!D && d.wantsDeza) this.say(sc, c.id, c.id === "goji" ? "ガゥー、デザ たべたい！" : "ごはんの あとは デザ ほしいな♪");
    else if (D) this.solo(sc);
    else this.say(sc, c.id, U.chance(.16)?Weather.comment(c.id):U.pick(this.lines[c.id]));
  },
  settle(sc, tapped = true) {
    if (!sc.life.quarrel) return false;
    sc.life.quarrel = false;
    sc.chars.forEach(c => { c.emo = null; sc.react(c, "happy", "heart"); });
    if (!this.playTalk(sc, this.triggerTalk("settle"))) {
      this.say(sc, "wanko", "ごめんね。いっしょに あそぼ！");
      this.say(sc, "gachan", tapped ? "なかなおり！ ありがとう♪" : "うん！ なかなおり♪");
    }
    if (tapped) Save.careAll({ mood: 2 });
    return true;
  },

  // ---- 会話データ（HOME_TALK_DATA）から えらぶ（docs/design/features/home-talk/CODEX_TASK.md §3） ----
  RETURN_SEC: 20, AFTER_SEC: 30, RECENT: 40, NEAR: 70,
  data() { return typeof HOME_TALK_DATA !== "undefined" ? HOME_TALK_DATA : null; },
  timeOfDay(h) { return U.dayPart(h); },
  // 家に 入った ときの できごと: return は いつも 20秒。win・work は 前に 家に いた ときより しょうり・おてつだいが ふえて いたら（セーブしない）
  enterEvents(sc) {
    const l = sc.life, wins = Save.d.stats?.wins || 0, plays = Object.values(Save.d.shops || {}).reduce((a, s) => a + (s.plays || 0), 0);
    l.events.return = this.RETURN_SEC;
    if (this.seen) { if (wins > this.seen.wins) l.events.win = this.AFTER_SEC; if (plays > this.seen.plays) l.events.work = this.AFTER_SEC; }
    this.seen = { wins, plays };
  },
  // きがえ・もようがえが おわったら 30秒 覚える
  watchMode(sc) {
    const l = sc.life;
    if (l.lastMode === sc.mode) return;
    if (!sc.mode && (l.lastMode === "dress" || l.lastMode === "edit")) l.events[l.lastMode] = l.time + this.AFTER_SEC;
    l.lastMode = sc.mode;
  },
  stateOf(id) {
    const d = Save.d.chars[id], st = [];
    if (!d) return st;
    if (d.hunger < 30) st.push("hungry"); if (d.hunger >= 90) st.push("full"); if (d.wantsDeza) st.push("deza"); if (d.mood >= 80) st.push("happy"); if (d.mood < 30) st.push("sad");
    return st;
  },
  // 話し手の まわり（when の キーと 同じ 名前）。c が ない（かけあい）ときと ぱぱ・ままの state は 3人の ようすを あわせた もの
  talkCtx(sc, c) {
    const l = sc.life, event = Object.keys(l.events).filter(k => l.events[k] > l.time);
    if (sc.watching) event.push("watch");
    const kid = c && Save.d.chars[c.id], all = (f) => [...new Set(sc.chars.filter(k => !k.hidden).flatMap(f))];
    return { time: this.timeOfDay(), weather: Weather.kind(), season: Seasonal.current().id, festival: AnnualFestivals.current().id, room: Save.d.rooms.active,
      near: c ? this.nearFurn(sc, c).map(n => n.key) : all(k => this.nearFurn(sc, k).map(n => n.key)), state: kid ? this.stateOf(c.id) : all(k => this.stateOf(k.id)), event };
  },
  // 話し手から 70 いないの 家具（へやの 座標で。ゆかの 家具は 足もとの 四角、かべの 家具は かべの 足もとの 点まで）
  nearFurn(sc, c) {
    const out = [];
    for (const it of Save.d.room.items || []) {
      const f = FURN_INDEX[it.id]; if (!f) continue;
      let dx, dy;
      if (f.kind === "wall") { const p = it.wallSide === "left" ? { x: 0, y: ROOM.WALL + it.x } : { x: it.x, y: ROOM.WALL }; dx = c.x - p.x; dy = c.y - p.y; }
      else { const m = HomeDesign.model(it.id, it), a = sc.anchor(it); dx = Math.max(a.x - m.footW / 2 - c.x, 0, c.x - a.x - m.footW / 2); dy = Math.max(a.y - m.footD - c.y, 0, c.y - a.y); }
      const d = Math.hypot(dx, dy);
      if (d <= this.NEAR) out.push({ it, key: /^bed_/.test(it.id) ? "bed" : it.id, name: f.name, d });
    }
    return out.sort((a, b) => a.d - b.d);
  },
  // who の セリフから 1つ（groups の どれか・need の キーが ある ものだけ）。さいきん 40この id は さける
  pickLine(sc, who, groups, need) {
    const D = this.data(); if (!D) return null;
    const c = sc.chars.find(x => x.id === who) || (sc.parents || []).find(x => x.id === who);
    const list = D.lines.filter(l => l.who === who && groups.includes(l.group) && (!need || (l.when && l.when[need])));
    return U.condPick(list, this.talkCtx(sc, c), sc.life.recent);
  },
  sayLine(sc, l) {
    if (!l) return false;
    const r = sc.life.recent; r.push(l.id); if (r.length > this.RECENT) r.shift();
    this.say(sc, l.who, l.who === "goji" ? this.gojiVoice(l.text, l.kind) : l.text, l.group === "rare" || !!l.rare, l.kind || "say", { line: l.id });
    return true;
  },
  // ごじの くせ: 8% で「ガウっ！ 」を 前に、12% で「 …ガゥ」を あとに（文に ガウ・ガゥ・ガォ が あれば つけない）
  gojiVoice(text, kind = "say") {
    const v = (this.data()?.voice || {}).goji || {}, has = (v.suffix?.skipIf || ["ガウ", "ガゥ", "ガォ"]).some(w => text.includes(w));
    if (has) return text;
    if (v.prefix && (v.prefix.kinds || ["say"]).includes(kind) && U.chance(v.prefix.chance)) return v.prefix.text + text;
    if (v.suffix && U.chance(v.suffix.chance)) return text + v.suffix.text;
    return text;
  },
  talkById(id) { return (this.data()?.talks || []).find(t => t.id === id) || null; },
  triggerTalk(trigger) { return (this.data()?.talks || []).find(t => t.trigger === trigger) || null; },
  // かけあいを 1.3秒おきに 流す（HomeLife.converse）
  playTalk(sc, t) {
    if (!t) return false;
    const r = sc.life.recentTalks; r.push(t.id); if (r.length > 12) r.shift();
    this.converse(sc, t.turns.map(x => ({ who: x.who, text: x.text, kind: x.kind || "say", meta: { talk: t.id } })));
    return true;
  },
  // 条件に あう かけあい（trigger なし）を 1つ
  chat(sc) {
    const D = this.data(); if (!D) return false;
    return this.playTalk(sc, U.condPick(D.talks.filter(t => !t.trigger), this.talkCtx(sc, null), sc.life.recentTalks));
  },
  // がちゃんは あめの 日 10% で かみなりが こわい（かけあい thunder）
  scared(sc) {
    const v = this.data()?.voice?.gachan?.scared;
    return !!(v && sc.chars.some(c => c.id === "gachan" && !c.hidden) && v.weather.includes(Weather.kind()) && U.chance(v.chance) && this.playTalk(sc, this.talkById(v.talk)));
  },
  // ひとりごと: ぱぱ・まま（見えて いる とき 2わり）か 3人の だれか。くせ（わうーん・クンクン・かみなり）→ 性格 3わり・まわり 7わり
  // 新しいこころの声。自動会話の枠を使い、追加の発話タイマーは作らない。
  thoughts: {
    wanko:['デザの かくしばしょ… ばれてるかな','おふろの あわで ひげを つくろう'],
    gachan:['みんなが いると あんしん するな','おさかなも さみしく なるのかな'],
    goji:['おっきく なったら くもに とどく？','おさかなの おうちも つくりたい ガゥ'],
    papa:['この のんびりした じかんが すきだな','つぎの おやすみ、どこへ いこうかな'],
    mama:['みんなの えがおが いちばんの ごほうび','あとで いっしょに デザを たべようかな'],
  },
  thought(sc,id,index=null) {
    const c=[...sc.chars,...sc.parents].find(c=>c.id===id&&!c.hidden);if(!c||!this.thoughts[id])return false;
    const list=this.thoughts[id],last=sc.life.lastThought?.[id];
    const n=Number.isInteger(index)?index:list.findIndex((text,i)=>i!==last);
    if(!list[n])return false;
    (sc.life.lastThought||={})[id]=n;this.say(sc,id,list[n],false,'think',{thought:id+'-'+n});return true;
  },
  solo(sc) {
    const D = this.data(), V = D.voice || {}, heads = this.heads(sc);
    if(U.chance(.3)){const actors=[...sc.chars,...sc.parents].filter(c=>heads[c.id]&&!c.target);if(actors.length&&this.thought(sc,U.pick(actors).id))return;}
    const parents = (sc.parents || []).filter(p => heads[p.id]);
    if (parents.length && U.chance(0.2) && this.sayLine(sc, this.pickLine(sc, U.pick(parents).id, ["parent"]))) return;
    const kids = sc.chars.filter(c => !c.hidden), c = U.pick(kids.length ? kids : sc.chars);
    if (c.id === "wanko") {
      const v = V.wanko || {}, near = this.nearFurn(sc, c)[0];
      if (v.howl && U.chance(v.howl.chance)) { this.say(sc, "wanko", v.howl.text, false, v.howl.kind || "shout"); return; }
      if (v.sniff && near && U.chance(v.sniff.chance)) { this.sniff(sc, near, v.sniff); return; }
    }
    if (c.id === "gachan" && this.scared(sc)) return;
    this.sayLine(sc, this.pickLine(sc, c.id, [U.chance(0.3) ? "persona" : "context"]) || this.pickLine(sc, c.id, ["context", "persona"]));
  },
  // わんこの クンクン。60秒に 3回で ままに おこられる（かけあい sniff-scold）
  sniff(sc, near, v) {
    const l = sc.life;
    l.sniffs = l.sniffs.filter(t => l.time - t < (v.scoldWindowSec || 60)); l.sniffs.push(l.time);
    if (l.sniffs.length >= (v.scoldAfter || 3)) { l.sniffs = []; if (this.playTalk(sc, this.talkById(v.talk))) return; }
    this.say(sc, "wanko", v.template.replace("{furn}", near.name), false, "say", { sniff: near.key });
  },
  // がちゃんが ほかの 2人から 120 いじょう はなれて 8秒 → かけあい not-alone（60秒に 1回まで）
  alone(sc, dt) {
    const v = this.data()?.voice?.gachan?.alone, l = sc.life; if (!v) return;
    const g = sc.chars.find(c => c.id === "gachan"), others = sc.chars.filter(c => c.id !== "gachan" && !c.hidden);
    const far = !!g && !g.hidden && others.length > 0 && others.every(o => Math.hypot(o.x - g.x, o.y - g.y) > v.distPx);
    l.aloneT = far ? l.aloneT + dt : 0;
    if (l.aloneT > v.sec && !l.queue.length && !l.quarrel && l.time - l.aloneAt > 120) { l.aloneT = 0; l.aloneAt = l.time; this.playTalk(sc, this.talkById(v.talk)); }
  },
  nextDelay(watching) { return watching ? U.rand(14, 22) : U.rand(24, 40); },
  update(sc, dt) {
    const l = sc.life;
    this.watchMode(sc);
    if (document.hidden || UI.busy || sc.mode) { for(const b of l.bubbles)b.born+=dt; return; }
    l.time += dt;
    l.bubbles = l.bubbles.filter(b => (b.left -= dt) > 0);
    this.advance(sc,dt);
    this.alone(sc,dt);
    for (const uid in l.furniture) { l.furniture[uid] -= dt; if (l.furniture[uid] <= 0) delete l.furniture[uid]; }
    if (l.quarrel) { l.elapsed += dt; if (l.elapsed > 12) this.settle(sc, false); return; }
    if (!l.queue.length && (l.next -= dt) <= 0) {
      const r = Math.random();
      this.event(sc, r < 0.035 ? "rare" : r < 0.13 ? "quarrel" : r < 0.43 ? "chat" : r < 0.58 ? "dance" : "solo");
      l.next = this.nextDelay(sc.watching);
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
      if(c.hidden)continue;const parent=c.id==='papa'||c.id==='mama',p=HomeActions.point(sc,c),motion=HomeActions.visual(c),h={x:p.x+(motion?.x||0)*k,y:p.y+(motion?.y||0)*k-(parent?104:84*(motion?.sy||1))*k,r:(parent?21:24)*k};
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
  catalog: [{ id: "main", name: "いつもの おへや", price: 0, wins: 0 }, { id: "study", name: "ひだまりの アトリエ", price: 4500, wins: 10 }, { id: "garden", name: "そらの サンルーム", price: 9000, wins: 30 }, { id: "yard", name: "こもれびの おにわ", price: 20000, wins: 0 }],
  purchase(id) {
    const r=this.catalog.find(r=>r.id===id);
    if(!r||Save.d.rooms.owned[id]||Save.d.coins<r.price||Save.d.stats.wins<r.wins)return false;
    const data=JSON.parse(JSON.stringify(Save.d));data.coins-=r.price;data.rooms.owned[id]=true;
    if(id==='yard'){data.rooms.stored.yard=HomeGarden.starter();for(const it of data.rooms.stored.yard.items)data.furn[it.id]=(data.furn[it.id]||0)+1;}
    try{SaveBackup.install(data);UI.updateHud();return true;}catch(e){UI.toast(e.message);return false;}
  },
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
    body.append(UI.btn("かぐの プリセット",()=>{m.close();RoomPresets.open(sc);},"wide yellow"),card, U.el("strong", { text: "べつの おへや" }));
    for (const r of this.catalog) {
      const own = Save.d.rooms.owned[r.id];
      const card = U.el("div", { class: "note", "data-room": r.id });
      card.append(U.el("div", { text: r.name + (own ? `（もってる・ひろさ ${Save.d.rooms.expanded[r.id] ? 2 : 1}ばい）` : `：${r.price} コイン${r.wins?`・バトル ${r.wins}かい しょうり`:""}`) }));
      if(r.id==='yard')card.append(U.el('div',{text:'しばふ・はなだん・テラスの おにわ。テーブル・いす2つ・うえきつき。かぐを おけるよ。'}));
      const b = UI.btn(own ? "このへやへ" : "おへやを かう", async () => {
        if (!own) {
          if (Save.d.coins < r.price || Save.d.stats.wins < r.wins) { UI.toast("コインと しょうりすうが たりないよ"); return; }
          if (!await UI.confirm(`${r.price} コインで ${r.name}を かう？`)) return;
          if (Save.d.rooms.owned[r.id]) return;
          if(!this.purchase(r.id))return;
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
