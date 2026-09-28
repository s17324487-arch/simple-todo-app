// そらのはいたつと新作ゲームの町への登録。パズルは独立したスコアアタック。
class SkyRelayTask extends TaskBase {
  constructor(sc,lv){super(sc,lv);this.title="そらの おとどけ";this.timeLimit=42;this.target=8+lv*2;this.caught=0;this.misses=0;this.lane=1;this.role=0;this.items=[];this.spawnIn=.4;this.elapsed=0;this.shield=0;this.invincible=0;this.combo=0;this.lastType=null;}
  layout(R){this.R=R;this.trackTop=R.y+28;this.trackBottom=R.y+R.h-103;this.laneW=(R.w-20)/3;
    this.btns=[{x:R.x+10,y:R.y+R.h-94,w:(R.w-28)/2,h:44,label:"← ひだり",cb:()=>this.lane=Math.max(0,this.lane-1)},{x:R.x+18+(R.w-28)/2,y:R.y+R.h-94,w:(R.w-28)/2,h:44,label:"みぎ →",cb:()=>this.lane=Math.min(2,this.lane+1)},
    {x:R.x+10,y:R.y+R.h-44,w:(R.w-28)/2,h:44,label:"3にん こうたい",cb:()=>this.role=(this.role+1)%3},{x:R.x+18+(R.w-28)/2,y:R.y+R.h-44,w:(R.w-28)/2,h:44,label:"まもる（6びょう）",cb:()=>{if(this.shield<=0){this.invincible=1.2;this.shield=6;}}}];}
  key(k) { const i={left:0,right:1,up:2,ok:3}[k]; if(i!=null)this.btns[i].cb(); }
  spawn(){const lane=U.randi(0,2),role=U.randi(0,2),rock=Math.random()<.25;this.items.push({lane,role,rock,y:this.trackTop});}
  tick(dt){
    this.elapsed+=dt;this.shield=Math.max(0,this.shield-dt);this.invincible=Math.max(0,this.invincible-dt);
    if((this.spawnIn-=dt)<=0){this.spawn();this.spawnIn=Math.max(.6,1.25-this.lv*.08);}
    const speed=(this.trackBottom-this.trackTop)/(2.8-this.lv*.15);
    for(const it of this.items){it.y+=speed*dt;if(it.y>=this.trackBottom&&!it.done){it.done=true;if(it.lane===this.lane){
      if(it.rock){if(this.invincible<=0){this.misses++;this.combo=0;Sound.se("bad");}}
      else if(it.role===this.role){this.caught++;this.combo++;Sound.se("coin");}
      else {this.misses++;this.combo=0;Sound.se("bad");}
    }}}
    this.items=this.items.filter(it=>!it.done);if(this.caught>=this.target)this.sc.finish(this.score());
  }
  score(){return U.clamp(Math.round(Math.min(this.caught,this.target)/this.target*100)-this.misses*5,0,100);}
  timeout(){return this.score();}
  drawOrder(ctx,x,y,w,h){ctx.fillStyle=INK;ctx.font="bold 12px sans-serif";ctx.fillText(`${this.caught} / ${this.target} はいたつ`,x+w/2,y+h*.3);ctx.font="10px sans-serif";ctx.fillText("わ→ほね / が→はな / ご→さかな",x+w/2,y+h*.6);}
  draw(ctx){const R=this.R,names=["わんこ","がちゃん","ごじ"],colors=["#D9B2B9","#F0D37F","#AAB5CA"];
    ctx.save();ctx.textAlign="center";ctx.fillStyle=INK;ctx.font="bold 12px sans-serif";ctx.fillText(`${names[this.role]} / ${this.combo} れんぞく / まもる ${this.shield>0?Math.ceil(this.shield):"OK"}`,R.x+R.w/2,R.y+17);
    for(let lane=0;lane<3;lane++){const x=R.x+10+lane*this.laneW;ctx.fillStyle=lane===this.lane?"#D8EEE7":"#E8E4F0";U.rr(ctx,x+2,this.trackTop,this.laneW-4,this.trackBottom-this.trackTop+7,8);ctx.fill();}
    for(const it of this.items){const x=R.x+10+(it.lane+.5)*this.laneW;ctx.fillStyle=it.rock?"#A8A09D":colors[it.role];ctx.strokeStyle=INK;ctx.lineWidth=2;U.rr(ctx,x-18,it.y-16,36,30,7);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.font="bold 12px sans-serif";ctx.fillText(it.rock?"いわ":["ほね","はな","さかな"][it.role],x,it.y+4);}
    for(let role=0;role<3;role++){const id=Chara.IDS[role],c=Save.d.chars[id],x=R.x+10+(this.lane+.5)*this.laneW+(role-this.role)*17;Chara.draw(ctx,id,{outfit:c.outfit,color:c.color,face:"happy"},x,this.trackBottom+8,role===this.role?42:28,role===this.role?1:.5);}
    if(this.invincible>0){ctx.strokeStyle="#E7B74F";ctx.lineWidth=4;ctx.beginPath();ctx.arc(R.x+10+(this.lane+.5)*this.laneW,this.trackBottom-15,32,0,7);ctx.stroke();}ctx.restore();
  }
}
MG_TASKS.relay=SkyRelayTask;
SHOPS.link={name:"なかよし パズル",color:"#C7B5E0",desc:"80コインで挑戦。得点で限定家具を獲得",perk:"shop",arcade:true};
SHOPS.relay={name:"そらの はいたつ",color:"#91C6DA",desc:"3にんを こうたいして はいたつ！",perk:"shop",rounds:3};
SHOP_OWNERS.link={sp:"rabbit",name:"パズルの ララ",outfit:{head:"starclip"}};
SHOP_OWNERS.relay={sp:"penguin",name:"はいたつの ソラ",outfit:{neck:"scarf_red"}};
HOWTO.link=["縦・横に同じ絵を3個以上つなぐ。直線・L字・輪で特殊消去。","消すと時間が延長。30秒ごとに時計が加速するスコアアタック。","詳しいルールと非売品の景品は受付で確認できます。"];
HOWTO.relay=["わんこは ほね、がちゃんは はな、ごじは さかな。\nおとどけものに あわせて こうたいしよう！","ひだり・みぎで いどう。いわは よけてね。\n「まもる」は 1びょうほど むてき。6びょうで また つかえるよ。","まちがえて とると ひょうかが さがるよ。\n3にんで もくひょうの かずを あつめよう！"];
SIGN_ICON.link=(x,y)=>[-11,0,11].map((dx,i)=>`<circle cx="${x+dx}" cy="${y+(i===1?-4:4)}" r="7" fill="${["#EBAABB","#F4D887","#AACBC2"][i]}" ${OS(1.5)}/>`).join("");
SIGN_ICON.relay=(x,y)=>`<rect x="${x-15}" y="${y-9}" width="30" height="20" rx="3" fill="#F2D4AB" ${OS(1.5)}/><path d="M${x},${y-9} V${y+11} M${x-15},${y-1} H${x+15}" stroke="${INK}" stroke-width="2"/>`;
(() => {
  const city=MAP_DEFS.city, rows=city.rows.map(r=>[...r]);
  for(const [id,x,y,roof] of [["link",23,10,"#BAA2D2"],["relay",6,12,"#7FACCA"]]){
    const b={id,x,y,w:5,h:3,door:2,roof,sign:id,label:SHOPS[id].name,act:{type:"work",shop:id}};
    city.buildings.push(b);for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+5;xx++)rows[yy][xx]="#";rows[y+2][x+2]="D";
  }
  city.rows=rows.map(r=>r.join(""));
  const melodies={crepe:"C5 E5 G5 E5 A5 G5 E5 .",dentist:"D5 . A5 . F5 E5 D5 .",bakery:"F5 A5 C6 . A5 G5 F5 .",florist:"G5 . E5 D5 C5 . E5 .",clothes:"A5 E5 G5 B5 A5 . E5 .",furniture:"C5 . G4 E5 D5 . C5 .",market:"E5 G5 E5 C5 F5 A5 G5 .",link:"D5 F5 A5 C6 A5 F5 E5 .",relay:"G5 D5 G5 B5 A5 D6 B5 ."};
  Object.entries(melodies).forEach(([id,notes],i)=>SONGS["shop_"+id]={bpm:92+i*5,tracks:[{wave:i%2?"sine":"pulse",vol:.1,notes:notes+" | "+notes},{wave:"triangle",vol:.18,notes:"C3 . G3 . F3 . G3 . C3 . E3 . G3 . C3 ."}]});
})();
