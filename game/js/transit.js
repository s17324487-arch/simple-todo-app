const Transit = {
  stops: {
    town_station: { map:"town", label:"ぽかぽかえき", kind:"train" },
    city_station: { map:"city", label:"シティえき", kind:"train" },
    heiwadai_station: { map:"heiwadai", label:"平和台えき", kind:"train" },
    airport_station: { map:"airport", label:"くうこうえき", kind:"train" },
    coast_ferry: { map:"coast", label:"ビーチの のりば", kind:"ferry" },
    harbor_ferry: { map:"harbor", label:"みなとの のりば", kind:"ferry" },
    airport_air: { map:"airport", label:"そらいろくうこう", kind:"plane" },
    harbor_air: { map:"harbor", label:"みなとの すいじょうき", kind:"plane" },
  },
  names: { train:"でんしゃ", ferry:"ふね", plane:"ひこうき" },
  destinations(id) { const s=this.stops[id]; return Object.keys(this.stops).filter(k=>k!==id && this.stops[k].kind===s.kind); },
  arrival(id) { const s=this.stops[id],b=MAP_DEFS[s.map].buildings.find(b=>b.act?.stop===id); return {map:s.map,x:b.x+b.door,y:b.y+b.h,dir:"down",grace:4}; },
  async open(id) {
    const s=this.stops[id], ids=this.destinations(id);
    const i=await UI.ask(`${s.label}\n${this.names[s.kind]}で どこへ いく？（むりょう）`,[...ids.map(k=>this.stops[k].label+"へ"),"やめておく"]);
    if(i<0||i>=ids.length)return false;
    Game.goto("travel",{from:id,to:ids[i],kind:s.kind},"circle"); return true;
  },
};

class TravelScene {
  async enter(p) {
    this.trip={...p};this.elapsed=0;this.done=false;
    UI.showHud(false);
    await Chara.preload(Save.d.order.map(id=>[id,{face:"happy",outfit:Save.d.chars[id].outfit,color:Save.d.chars[id].color}]),46);
    const bar=U.el("div",{class:"travel-controls"});
    bar.append(UI.btn("ついた！",()=>this.arrive(),"yellow"),UI.btn("おうちへ",()=>this.home()));
    document.getElementById("ui").append(bar);this.ui=bar;
    Sound.bgm(this.trip.kind==="ferry"?"harbor":this.trip.kind==="plane"?"airport":"heiwadai");Sound.se("door");
  }
  exit(){this.ui?.remove();}
  update(dt){if(Game.trans||Game.inputLocked||this.done)return;this.elapsed+=dt;if(this.elapsed>=4)this.arrive();}
  arrive(){if(this.done||Game.trans)return;this.done=true;Game.goto("world",Transit.arrival(this.trip.to),"circle");}
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
    if(kind==="ferry") {ctx.strokeStyle="#DFEEF1";ctx.lineWidth=3;for(let i=0;i<9;i++){const xx=(i*91-this.elapsed*30+900)%(G.W+100)-50;ctx.beginPath();ctx.ellipse(xx,cy+110+(i%3)*30,32,5,0,0,Math.PI);ctx.stroke();}}
    WorldScenery.vehicle(ctx,kind,x,cy,s);
    for(let i=0;i<3;i++){
      const id=Save.d.order[i],c=Save.d.chars[id];
      const px=kind==="train"?i*86+40:kind==="ferry"?75+i*49:64+i*49;
      Chara.draw(ctx,id,{face:"happy",outfit:c.outfit,color:c.color},x+px*s,cy+(kind==="ferry"?43:33)*s,34*s);
    }
    ctx.fillStyle=INK;ctx.textAlign="center";ctx.font="800 19px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(Transit.names[kind]+"で おでかけ",G.W/2,100);
    ctx.font="800 14px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(Transit.stops[this.trip.to].label+"へ",G.W/2,132);
    ctx.font="700 13px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(["3にん いっしょに しゅっぱつ！","まどの そとを みて！","ガゥー！ もうすぐ つくよ！"][Math.min(2,Math.floor(this.elapsed))],G.W/2,cy+156);
  }
}
SCENES.travel=TravelScene;
