const Transit = {
  stops: {
    town_station: { map:"town", label:"ネリカスえき", kind:"train" },
    city_station: { map:"city", label:"池袋えき", kind:"train" },
    heiwadai_station: { map:"heiwadai", label:"平和台えき", kind:"train" },
    airport_station: { map:"airport", label:"くうこうえき", kind:"train" },
    coast_ferry: { map:"coast", label:"ビーチの のりば", kind:"ferry" },
    harbor_ferry: { map:"harbor", label:"みなとの のりば", kind:"ferry" },
    airport_air: { map:"airport", label:"そらいろくうこう", kind:"plane" },
    harbor_air: { map:"harbor", label:"みなとの すいじょうき", kind:"plane" },
  },
  names: { train:"でんしゃ", ferry:"ふね", plane:"ひこうき", bus:"バス" },
  // でんしゃで 池袋へ（かえりは むりょう）・バス（どの バスていからでも どこへでも）の ねだん（オーナーの FB 2026-09-30: 池袋の でんしゃ 500 → 50・バスは 100）
  CITY_FARE: 50, BUS_FARE: 100,
  // バスの いきさき（地図 → つく ところ）: stop = その 町の バスていの 小物の id（まえに つく）・at = のりばの 建物（入口の まえ）・x, y = はいって すぐの マス
  BUS: {
    town: { stop: "town_busstop" }, heiwadai: { stop: "heiwadai_bus" }, city: { stop: "city_bus" },
    coast: { at: "coast_ferry" }, harbor: { at: "harbor_ferry" }, airport: { at: "airport_station" },
    meadow: { x: 14, y: 2, dir: "down" }, forest: { x: 14, y: 2, dir: "down" }, cave: { x: 12, y: 3, dir: "down" },
  },
  fare(from,to) { return this.stops[from]?.kind==='train'&&to==='city_station'?this.CITY_FARE:0; },
  pay(from,to) {
    if(!this.stops[from]||!this.destinations(from).includes(to))return false;
    const price=this.fare(from,to);if(Save.d.coins<price)return false;
    Save.d.coins-=price;Save.write();UI.updateHud();return true;
  },
  destinations(id) { const s=this.stops[id]; return Object.keys(this.stops).filter(k=>k!==id && this.stops[k].kind===s.kind); },
  arrival(id) { const s=this.stops[id],b=MAP_DEFS[s.map].buildings.find(b=>b.act?.stop===id); return {map:s.map,x:b.x+b.door,y:b.y+b.h,dir:"down",grace:4}; },
  async open(id) {
    const s=this.stops[id], ids=this.destinations(id);
    const i=await UI.ask(`${s.label}\n${this.names[s.kind]}で どこへ いく？${s.kind==="train"?`\n池袋へは ${this.CITY_FARE}コイン。かえりは むりょう。`:""}`,[...ids.map(k=>this.stops[k].label+"へ"+(this.fare(id,k)?`（${this.fare(id,k)}コイン）`:"")),"やめておく"]);
    if(i<0||i>=ids.length)return false;
    if(!this.pay(id,ids[i])){await UI.say([{name:s.label,text:`${this.fare(id,ids[i])}コインが ひつようだよ。`}]);return false;}
    Game.goto("travel",{from:id,to:ids[i],kind:s.kind},"circle"); return true;
  },

  // ---- バス（オーナーの FB 2026-09-30「お家の 近くに バス停を 追加して、どこの マップにも 100円で 行ける ように」）----
  // バスていは 町の 小物（BUS の stop）。ネリカスタウンは おうちの みぎ よこ（js/nerikasu-layout.js）。どの バスていからも ほかの 地図 ぜんぶへ
  busStopOf(o) { return !!o && (o.busStop || Object.values(this.BUS).some((b) => b.stop === o.id)); },
  busMaps(from) { return Object.keys(this.BUS).filter((m) => m !== from && MAP_DEFS[m]); },
  busName(map) { const p = typeof AtlasArt !== "undefined" && AtlasArt.places[map]; return p ? p.lines.join(" ") : MAP_DEFS[map].name; },
  busArrival(map) {
    const b = this.BUS[map], d = MAP_DEFS[map];
    if (b.stop) { const o = (d.objects || []).find((o) => o.id === b.stop); if (o) return { map, x: o.x + Math.floor(o.w / 2), y: o.y + o.h, dir: "down", grace: 4 }; }
    if (b.at && this.stops[b.at]) return this.arrival(b.at);
    return { map, x: b.x ?? d.safeSpawn?.[0] ?? 1, y: b.y ?? d.safeSpawn?.[1] ?? 1, dir: b.dir || "down", grace: 4 };
  },
  // いきさきを えらぶ まど（2れつ）→ はらう → バスの たび。まどを とじたら null
  busPick(from) {
    return new Promise((res) => {
      let m = null;
      const done = (v) => { if (!m) return; const mm = m; m = null; mm.close(); res(v); };
      const body = U.el("div", { class: "bus-picker" }), grid = U.el("div", { class: "bus-grid" });
      // バスの ていきけん（コンビニの ポイントカードの けいひん・js/conbini-card.js・UI-85）が あれば ただ
      const pass = this.busPass();
      body.append(U.el("p", { class: "bus-lead", text: pass ? `どこへ いく？ バスの ていきけんで ただ（${pass}）。` : `どこへ いく？ どこでも ${this.BUS_FARE}コイン。` }));
      for (const map of this.busMaps(from)) {
        const p = typeof AtlasArt !== "undefined" ? AtlasArt.places[map] : null, b = UI.btn(this.busName(map), () => { Sound.se("ok"); done(map); });
        b.setAttribute("aria-label", this.busName(map) + "へ");
        if (p) b.style.borderLeft = `10px solid ${p.color}`;
        grid.append(b);
      }
      body.append(grid, U.el("p", { class: "note", text: `いまの コイン ${U.fmt(Save.d.coins)}まい。ネリカスタウン・へいわだい・いけぶくろの バスていから のれるよ。` }));
      m = UI.modal({ title: "バスてい", body, onClose: () => { if (m) { m = null; res(null); } } });
    });
  },
  // バスの ていきけんの のこり（「○ねん ○がつ ○にち まで」・なければ ""）
  busPass() { return typeof ConbiniCard !== "undefined" && ConbiniCard.busFree() ? ConbiniCard.busText() : ""; },
  async bus(from) {
    if (UI.busy || Game.trans) return false;
    const map = await this.busPick(from);
    if (!map || !this.BUS[map] || map === from) return false;
    const pass = !!this.busPass();
    if (!pass && Save.d.coins < this.BUS_FARE) { await UI.say([{ name: "バスてい", text: `${this.BUS_FARE}コインが ひつようだよ。` }]); return false; }
    if (pass) UI.toast("バスの ていきけんで のったよ", "good"); else Save.d.coins -= this.BUS_FARE;
    Save.write(); UI.updateHud();
    Game.goto("travel", { from: "bus:" + from, to: "bus:" + map, kind: "bus", label: this.busName(map), arrival: this.busArrival(map) }, "circle");
    return true;
  },
};
// バスていの 小物を さわると バスの まど（ほかの 小物は まえの まま。けいじばん などは あとから かさねる）
(() => { const act0 = WorldScenery.activate.bind(WorldScenery); WorldScenery.activate = (sc, o) => (Transit.busStopOf(o) ? (Sound.se("tap"), Transit.bus(sc.mapId)) : act0(sc, o)); })();

class TravelScene {
  async enter(p) {
    this.trip={...p};this.elapsed=0;this.done=false;
    UI.showHud(false);
    await Chara.preload(Save.d.order.map(id=>[id,{face:"happy",outfit:Save.d.chars[id].outfit,color:Save.d.chars[id].color}]),46);
    const bar=U.el("div",{class:"travel-controls"});
    bar.append(UI.btn("ついた！",()=>this.arrive(),"yellow"),UI.btn("おうちへ",()=>this.home()));
    document.getElementById("ui").append(bar);this.ui=bar;
    Sound.bgm(this.trip.kind==="ferry"?"harbor":this.trip.kind==="plane"?"airport":this.trip.kind==="bus"?"town":"heiwadai");Sound.se("door");
  }
  exit(){this.ui?.remove();}
  update(dt){if(Game.trans||Game.inputLocked||this.done)return;this.elapsed+=dt;if(this.elapsed>=4)this.arrive();}
  arrive(){if(this.done||Game.trans)return;this.done=true;Game.goto("world",this.trip.arrival||Transit.arrival(this.trip.to),"circle");}
  home(){if(this.done||Game.trans)return;this.done=true;Game.goto("house",{},"circle");}
  key(k,down){if(down&&k==="ok")this.arrive();}
  render(ctx){
    const kind=this.trip.kind,cy=G.H*.51,s=Math.min(1.15,(G.W-35)/255),x=(G.W-255*s)/2;
    ctx.fillStyle=kind==="plane"?"#C4E6F1":"#D3E8DF";ctx.fillRect(0,0,G.W,G.H);
    for(let i=0;i<8;i++){
      const xx=(i*117-this.elapsed*(kind==="train"?80:25)+1000)%(G.W+150)-75;
      ctx.fillStyle="#FAF8E8";ctx.beginPath();ctx.ellipse(xx,cy-130+(i%3)*33,40,14,0,0,7);ctx.fill();
    }
    ctx.fillStyle=kind==="ferry"?"#96CADC":kind==="plane"?"#EAF1E5":"#B3CD9C";ctx.fillRect(0,cy+55,G.W,G.H);
    if(kind==="train"){
      for(let i=0;i<7;i++){const xx=(i*87-this.elapsed*95+1200)%(G.W+120)-60;ctx.fillStyle=["#D6BDB1","#A4BAAC","#D7CFB1"][i%3];U.rr(ctx,xx,cy-70,49,112-(i%2)*25,5);ctx.fill();ctx.fillStyle="#E8EEE4";ctx.fillRect(xx+8,cy-58,11,15);}
      ctx.strokeStyle="#8C9D8D";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,cy+60);ctx.lineTo(G.W,cy+60);ctx.stroke();
    }
    if(kind==="bus"){
      // まちの いえと 木が うしろへ ながれる・どうろの しろい せん
      for(let i=0;i<8;i++){const xx=(i*97-this.elapsed*70+1200)%(G.W+140)-70,hh=46+(i%3)*14;ctx.fillStyle=["#F2D9C4","#DCE8D2","#F4E6B8","#D8E2EC"][i%4];U.rr(ctx,xx,cy-hh+18,60,hh,5);ctx.fill();ctx.fillStyle=["#D9826C","#8FB27E","#C99A5B","#8FA8C8"][i%4];ctx.beginPath();ctx.moveTo(xx-4,cy-hh+20);ctx.lineTo(xx+30,cy-hh-4);ctx.lineTo(xx+64,cy-hh+20);ctx.closePath();ctx.fill();ctx.fillStyle="#F7FBFF";ctx.fillRect(xx+10,cy-hh+30,13,12);ctx.fillRect(xx+37,cy-hh+30,13,12);}
      ctx.fillStyle="#9A9E9F";ctx.fillRect(0,cy+55,G.W,40);ctx.fillStyle="#F4F1E6";for(let i=0;i<9;i++){const xx=(i*70-this.elapsed*160+1400)%(G.W+80)-40;ctx.fillRect(xx,cy+73,34,4);}
    }
    if(kind==="ferry") {ctx.strokeStyle="#DFEEF1";ctx.lineWidth=3;for(let i=0;i<9;i++){const xx=(i*91-this.elapsed*30+900)%(G.W+100)-50;ctx.beginPath();ctx.ellipse(xx,cy+110+(i%3)*30,32,5,0,0,Math.PI);ctx.stroke();}}
    WorldScenery.vehicle(ctx,kind,x,cy,s);
    for(let i=0;i<3;i++){
      const id=Save.d.order[i],c=Save.d.chars[id];
      const px=kind==="train"?i*86+40:kind==="ferry"?75+i*49:kind==="bus"?78+i*52:64+i*49;
      Chara.draw(ctx,id,{face:"happy",outfit:c.outfit,color:c.color},x+px*s,cy+(kind==="ferry"?43:kind==="bus"?30:33)*s,34*s);
    }
    ctx.fillStyle=INK;ctx.textAlign="center";ctx.font="800 19px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(Transit.names[kind]+"で おでかけ",G.W/2,100);
    ctx.font="800 14px 'M PLUS Rounded 1c',sans-serif";ctx.fillText((this.trip.label||Transit.stops[this.trip.to].label)+"へ",G.W/2,132);
    ctx.font="700 13px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(["3にん いっしょに しゅっぱつ！","まどの そとを みて！","ガゥー！ もうすぐ つくよ！"][Math.min(2,Math.floor(this.elapsed))],G.W/2,cy+156);
  }
}
SCENES.travel=TravelScene;
