const Seasonal = {
  override:null,
  events:{
    spring:{name:"さくらさんぽ",period:"3〜5がつ",color:"#F2B7CD",targets:[["town","town_fountain","タウンの ふんすい"],["heiwadai","heiwadai_fountain","平和台の こうえん"],["meadow","meadow_flowercart","はらっぱの はなワゴン"]]},
    summer:{name:"ほしあかりまつり",period:"6〜8がつ",color:"#F0D48D",targets:[["town","town_wheel","タウンの すいしゃ"],["coast","coast_parasol","ビーチの パラソル"],["harbor","port_light","みなとの とうだい"]]},
    autumn:{name:"どんぐりまつり",period:"9〜11がつ",color:"#DBA27D",targets:[["heiwadai","heiwadai_cart","平和台の はなワゴン"],["meadow","meadow_windmill","はらっぱの ふうしゃ"],["forest","forest_waterwheel","もりの すいしゃ"]]},
    winter:{name:"ゆきあかりまつり",period:"12〜2がつ",color:"#B8D8E6",targets:[["town","town_fountain","タウンの ふんすい"],["heiwadai","heiwadai_clock","平和台の とけい"],["airport","airport_clock","くうこうの とけい"]]},
  },
  current(date=this.override || new Date()) {
    const month=date.getMonth()+1, season=month>=3&&month<=5?"spring":month<=8&&month>=6?"summer":month>=9&&month<=11?"autumn":"winter";
    const year=date.getFullYear()-(month<=2?1:0);
    return {id:season,key:`${year}-${season}`,year,...this.events[season],items:SEASON_ITEMS[season]};
  },
  record(key,create=false) {
    const records=Save.d.events.records;
    if(create&&!records[key])records[key]={stamps:{},claimed:false};
    return records[key]||{stamps:{},claimed:false};
  },
  state() {
    const e=this.current(),r=this.record(e.key);
    return {...e,stamps:{...r.stamps},claimed:r.claimed,count:e.targets.filter(t=>r.stamps[t[1]]).length,
      targets:e.targets.map(([map,id,label])=>{const o=MAP_DEFS[map].objects.find(o=>o.id===id);return{map,id,label,x:o.x,y:o.y,w:o.w,h:o.h};})};
  },
  collect(map,object) {
    const e=this.current();if(!e.targets.some(t=>t[0]===map&&t[1]===object.id))return null;
    const r=this.record(e.key,true);if(r.stamps[object.id])return null;
    r.stamps[object.id]=true;Save.mark();Save.write();
    return `きせつの スタンプ！ ${Object.keys(r.stamps).length}/3\nすまほの「スタンプラリー」で きねんひんを うけとろう！`;
  },
  claim(key) {
    const e=this.current();if(e.key!==key)return false;
    const r=this.record(key);if(r.claimed||!e.targets.every(t=>r.stamps[t[1]]))return false;
    // 表示・演出より先に一度だけ確定する。連打・閉じ直し・再起動で増えない。
    r.claimed=true;WearStock.add(e.items.wear,1);
    Save.d.furn[e.items.furn]=(Save.d.furn[e.items.furn]||0)+1;Save.addBag(e.items.food,3);
    Save.mark();Save.write();return true;
  },
  open() {
    UI.root.querySelector(".toasts")?.replaceChildren();
    const body=U.el("div"),m=UI.modal({title:"きせつの おまつり",body,cls:"full"});
    const render=()=>{
      const s=this.state();body.innerHTML="";
      const monthly=AnnualFestivals.current();
      body.append(UI.btn(`${monthly.month}がつ：${monthly.name}（ねんかん12しゅるい）`,()=>{m.close();AnnualFestivals.open();},"annual-invite wide"));
      body.append(U.el("h2",{text:s.name}),U.el("div",{class:"note",text:`${s.period}に かいさい ／ ${s.count}/3 スタンプ\n！のある めいしょを タップして あつめよう。`}),U.el("p",{class:"muted",text:"きねんひんは この きせつに もらえるよ。てにいれた ものは ずっと つかえる！ まいとし また さんかできるよ。"}));
      for(const t of s.targets)body.append(U.el("div",{class:"festival-target",text:`${s.stamps[t.id]?"✓":"○"} ${t.label}\n${MAP_DEFS[t.map].name}：よこ ${t.x+1}・たて ${t.y+1}`}));
      const reward=U.el("div",{class:"festival-rewards"});
      for(const [kind,id,n] of [["wear",s.items.wear,1],["furn",s.items.furn,1],["bag",s.items.food,3]]) {
        const it=kind==="wear"?ITEM_INDEX[id]:kind==="furn"?FURN_INDEX[id]:BAG_INDEX[id];
        reward.append(U.el("div",{class:"festival-reward",html:`${UI.icon(kind,id,60)}<b>${it.name}</b><div>×${n}</div>`}));
      }
      body.append(reward);
      const b=UI.btn(s.claimed?"きねんひんは うけとりずみ":"きねんひんを うけとる",()=>{
        if(this.claim(s.key)){Sound.se("fanfare");UI.toast("きねんひんを てにいれた！ おうちで つかおう！","good");}
        else if(this.current().key!==s.key)UI.toast("きせつが かわったよ。あたらしい おまつりを みよう！");
        render();
      },"yellow wide");b.disabled=s.claimed||s.count<3;body.append(b);
      body.append(UI.btn("ぜんたい ちずを みる",()=>{m.close();WorldAtlas.open();},"wide"));
      body.append(U.el("p",{class:"muted",text:"でんしゃ・ふね・ひこうきは むりょう。まものが いる ばしょは、HPと ごはんを じゅんびして いこう。"}));
    };
    render();return m;
  },
  mount(sc) {
    sc.festivalButton=UI.btn("おまつり",()=>this.open(),"world-festival");UI.root.append(sc.festivalButton);this.refresh(sc,true);
  },
  refresh(sc,force=false) {
    if(!force&&G.t<(sc.nextFestival||0))return;sc.nextFestival=G.t+1;
    const s=this.state();if(sc.festivalButton){sc.festivalButton.textContent=`おまつり ${s.claimed?"✓":s.count+"/3"}`;sc.festivalButton.style.background=s.color;}
  },
  particles(sc,time=G.t,kind=this.current().id,size={w:G.W,h:G.H}) {
    if(sc.map.baseGround==="cave"||kind==="winter")return [];
    // World-space cells move with the wind only. The camera chooses which cells to draw;
    // it never enters a particle's path, seed, wrapping period or animation.
    const step=208, wind=kind==="wind",dx=time*(wind?30:kind==="summer"?2:7),dy=time*(kind==="summer"?-4:wind?16:11);
    const left=sc.cam.x-size.w/2,top=sc.cam.y-size.h/2,margin=28,particles=[];
    const x0=Math.floor((left-dx-margin)/step),x1=Math.floor((left+size.w-dx+margin)/step);
    const y0=Math.floor((top-dy-margin)/step),y1=Math.floor((top+size.h-dy+margin)/step);
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      const seed=U.hash(cx+(wind?701:0),cy+311),phase=seed*Math.PI*2;
      const wx=cx*step+U.hash(cx+41,cy+19)*step+dx+Math.sin(time*.9+phase)*9;
      const wy=cy*step+U.hash(cx+79,cy+137)*step+dy+Math.cos(time*.6+phase)*6;
      const x=wx-left,y=wy-top;
      if(x< -margin||x>size.w+margin||y< -margin||y>size.h+margin)continue;
      particles.push({id:`${kind}:${cx}:${cy}`,wx,wy,x,y,seed,angle:Math.sin(time*.7+phase)*.8+phase,fold:.35+Math.abs(Math.cos(time*1.1+phase))*.65});
    }
    return particles;
  },
  leaf(ctx,p,autumn=true) {
    const colors=autumn?["#BA7548","#D49A4D","#B86E52","#AC9651"]:["#9BA96D","#A8B17D","#899B68"];
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);const scale=.52+p.seed*.24;ctx.scale(scale*p.fold,scale);
    ctx.fillStyle=colors[Math.floor(p.seed*colors.length)];ctx.strokeStyle=autumn?"#865D3C":"#677E50";ctx.lineWidth=1;ctx.lineJoin="round";
    ctx.beginPath();
    if(p.seed<.45){ctx.moveTo(0,-12);ctx.lineTo(3,-5);ctx.lineTo(8,-8);ctx.lineTo(7,-2);ctx.lineTo(12,-2);ctx.lineTo(8,3);ctx.lineTo(9,6);ctx.lineTo(3,6);ctx.lineTo(0,10);ctx.lineTo(-3,6);ctx.lineTo(-9,6);ctx.lineTo(-8,3);ctx.lineTo(-12,-2);ctx.lineTo(-7,-2);ctx.lineTo(-8,-8);ctx.lineTo(-3,-5);}
    else {ctx.moveTo(0,-13);ctx.bezierCurveTo(12,-7,10,3,0,10);ctx.bezierCurveTo(-10,4,-9,-6,0,-13);}
    ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=autumn?"#F1C582":"#D7DDB3";ctx.lineWidth=.85;
    ctx.beginPath();ctx.moveTo(0,-9);ctx.quadraticCurveTo(-1,0,0,10);ctx.moveTo(0,-3);ctx.lineTo(5,-6);ctx.moveTo(0,2);ctx.lineTo(6,-1);ctx.moveTo(0,-1);ctx.lineTo(-5,-5);ctx.moveTo(0,5);ctx.lineTo(-6,1);ctx.stroke();
    ctx.strokeStyle=autumn?"#865D3C":"#677E50";ctx.beginPath();ctx.moveTo(0,9);ctx.quadraticCurveTo(0,12,2,14);ctx.stroke();ctx.restore();
  },
  draw(ctx,sc,ox,oy) {
    if(sc.map.baseGround==="cave"||sc.map.def.indoor)return;
    const e=this.current();ctx.save();
    // 同じ地面に対して同じ軌道。秋は葉脈と葉柄のある2種類の落ち葉。
    for(const p of this.particles(sc)){
      ctx.globalAlpha=e.id==="summer"?.3+Math.sin(G.t*2+p.seed*9)**2*.45:.84;
      if(e.id==="autumn")this.leaf(ctx,p,true);
      else {ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(p.x,p.y,e.id==="summer"?2:3.5,e.id==="summer"?2:1.7,p.angle,0,7);ctx.fill();}
    }
    ctx.globalAlpha=1;
    for(const o of sc.map.def.objects||[]) {
      if(!e.targets.some(t=>t[0]===sc.mapId&&t[1]===o.id)&&!o.festival)continue;
      const x=ox+(o.x+o.w/2)*TS,y=oy+(o.y+o.h)*TS+12;
      if(x< -90||x>G.W+90||y< -20||y>G.H+30)continue;
      ctx.strokeStyle="#A78F74";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-38,y);ctx.quadraticCurveTo(x,y+12,x+38,y);ctx.stroke();
      for(let j=0;j<5;j++){ctx.fillStyle=j%2?"#FFF0CD":e.color;ctx.beginPath();ctx.moveTo(x-34+j*14,y+2);ctx.lineTo(x-24+j*14,y+3);ctx.lineTo(x-29+j*14,y+14);ctx.closePath();ctx.fill();}
    }
    ctx.restore();
    AnnualFestivals.draw(ctx,sc,ox,oy);
  },
};

WorldArt.festivalboard=()=>({w:32,h:52,svg:`<path d="M7,28 V50 M25,28 V50" ${OS(3)}/><rect x="1" y="4" width="30" height="34" rx="5" fill="#FFF2CE" ${OS()}/><path d="${starPath(16,18,10,5)}" fill="#E2AD90" ${OS(1.4)}/><path d="M8,32 H24" ${OS(2)}/>`});
// 素材プレビューは地図を読み込まず、葉の描画だけを共用する。
if(typeof MAP_DEFS!=="undefined")for(const [map,oldX,oldY] of [["town",8,21],["heiwadai",25,24],["city",14,24]]){
  const [x,y]=MAP_DEFS[map].festivalBoard||[oldX,oldY];
  MAP_DEFS[map].objects.push({id:map+"_festivalboard",kind:"festivalboard",x,y,w:1,h:1,solid:true,festival:true,text:"きせつの おまつり"});
}
