// 新作2種。既存4店の TaskBase / ShopScene と同じ進行で遊ぶ。
class LinkGardenTask extends TaskBase {
  constructor(sc,lv) {
    super(sc,lv); this.title="なかよし つなぎ"; this.timeLimit=55; this.target=36+lv*9;
    this.types=Math.min(5,3+Math.floor(lv/2)); this.board=Array.from({length:25},()=>U.randi(0,this.types-1));
    this.chain=[]; this.collected=0; this.combo=0; this.comboTime=0; this.fever=0; this.penalty=0; this.shuffles=3; this.bursts=[]; this.ensureMove();
  }
  neighbors(a,b) { return a!==b && Math.abs(a%5-b%5)<=1 && Math.abs(Math.floor(a/5)-Math.floor(b/5))<=1; }
  legalMove() {
    for(let i=0;i<25;i++) for(let j=0;j<25;j++) if(this.neighbors(i,j)&&this.board[i]===this.board[j]) for(let k=0;k<25;k++) if(k!==i&&this.neighbors(j,k)&&this.board[k]===this.board[i]) return [i,j,k];
    return null;
  }
  ensureMove() { if(!this.legalMove()) this.board[0]=this.board[1]=this.board[2]=U.randi(0,this.types-1); }
  layout(R) {
    this.R=R; this.cell=Math.min((R.w-16)/5,(R.h-77)/5); this.bx=R.x+(R.w-5*this.cell)/2; this.by=R.y+29;
    this.btns=[{x:R.x+8,y:R.y+R.h-44,w:R.w-16,h:44,label:`まぜる（あと ${this.shuffles}かい・ひょうか -3）`,cb:()=>{
      if(this.shuffles<=0) return; this.shuffles--; this.penalty+=3; this.board=U.shuffle(this.board);this.chain=[];this.ensureMove();this.btns[0].label=`まぜる（あと ${this.shuffles}かい）`;
    }}];
  }
  point(i) { return {x:this.bx+(i%5+.5)*this.cell,y:this.by+(Math.floor(i/5)+.5)*this.cell}; }
  hit(p) {const x=Math.floor((p.x-this.bx)/this.cell),y=Math.floor((p.y-this.by)/this.cell);return x>=0&&x<5&&y>=0&&y<5?y*5+x:-1;}
  down(p) { if (this.pointerId != null) return; super.down(p); }
  downArea(p) {const i=this.hit(p);this.chain=i<0?[]:[i];this.pointerId=i<0?null:p.id;}
  move(p) {
    if (this.pointerId != null && p.id !== this.pointerId) return;
    const i=this.hit(p), chain=this.chain;
    if(i<0||!chain.length)return;
    if(chain.length>1&&chain[chain.length-2]===i){chain.pop();return;}
    if(!chain.includes(i)&&this.neighbors(chain[chain.length-1],i)&&this.board[i]===this.board[chain[0]]) {chain.push(i);Sound.se("tap");}
  }
  up(p,canceled=false) {
    if (this.pointerId != null && p.id !== this.pointerId) return;
    this.pointerId=null;
    if(canceled) {this.chain=[];return;}
    if(this.chain.length<3){this.chain=[];return;}
    const clear=new Set(this.chain),last=this.chain[this.chain.length-1];
    if(this.chain.length>=7) for(let i=0;i<25;i++)if(this.neighbors(last,i))clear.add(i);
    this.combo=this.comboTime>0?this.combo+1:1;this.comboTime=5;
    if(this.combo>=4)this.fever=8;
    this.collected+=clear.size*(this.fever>0?2:1);
    this.bursts=[...clear].map(i=>({...this.point(i),left:.45}));
    for(let x=0;x<5;x++) {const keep=[];for(let y=4;y>=0;y--)if(!clear.has(y*5+x))keep.push(this.board[y*5+x]);for(let y=4;y>=0;y--)this.board[y*5+x]=keep[4-y]??U.randi(0,this.types-1);}
    this.chain=[];this.ensureMove();Sound.se(clear.size>=7?"fanfare":"pop");
    if(this.collected>=this.target)this.sc.finish(this.score());
  }
  tick(dt){this.comboTime-=dt;this.fever=Math.max(0,this.fever-dt);this.bursts=this.bursts.filter(b=>(b.left-=dt)>0);}
  score(){return U.clamp(Math.round(100*Math.min(this.collected,this.target)/this.target)-this.penalty,0,100);}
  timeout(){return this.score();}
  drawOrder(ctx,x,y,w,h){ctx.fillStyle=INK;ctx.font="bold 13px sans-serif";ctx.fillText(`${this.collected} / ${this.target} こ`,x+w/2,y+h*.35);ctx.font="11px sans-serif";ctx.fillText("3こから なぞって つなごう",x+w/2,y+h*.65);}
  draw(ctx){
    const colors=["#EBAABB","#F4D887","#AACBC2","#A3CBE7","#C6B3DD"],symbols=["わ","が","ご","★","☾"];
    ctx.save();ctx.fillStyle=this.fever>0?"#FFF0A6":"#EAE1CF";U.rr(ctx,this.bx-5,this.by-5,this.cell*5+10,this.cell*5+10,16);ctx.fill();
    ctx.textAlign="center";ctx.fillStyle=INK;ctx.font="bold 12px sans-serif";ctx.fillText(this.fever>0?"フィーバー！ あつめた かず 2ばい":`${this.combo} コンボ / 7こで まわりも けせる`,this.R.x+this.R.w/2,this.R.y+16);
    for(let i=0;i<25;i++){
      const p=this.point(i),v=this.board[i];
      ctx.fillStyle=colors[v];ctx.strokeStyle=this.chain.includes(i)?"#D77465":INK;ctx.lineWidth=this.chain.includes(i)?4:2;
      ctx.beginPath();ctx.arc(p.x,p.y,this.cell*.4,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(v<3){
        const id=Chara.IDS[v],c=Save.d.chars[id];
        Chara.draw(ctx,id,{face:"happy",outfit:c.outfit,color:c.color},p.x,p.y+this.cell*.33,this.cell*.64);
      } else {
        ctx.fillStyle=INK;ctx.font=`bold ${this.cell*.42}px sans-serif`;ctx.fillText(symbols[v],p.x,p.y+this.cell*.13);
      }
    }
    if(this.chain.length>1){ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=5;ctx.beginPath();this.chain.forEach((i,n)=>{const p=this.point(i);if(n)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}
    for(const b of this.bursts)FX.star(ctx,b.x,b.y,15*b.left/.45,"#FFF7CE");ctx.restore();
  }
}

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
MG_TASKS.link=LinkGardenTask; MG_TASKS.relay=SkyRelayTask;
SHOPS.link={name:"なかよし パズル",color:"#C7B5E0",desc:"3こいじょう なぞって つなぐ パズル",perk:"shop",rounds:3};
SHOPS.relay={name:"そらの はいたつ",color:"#91C6DA",desc:"3にんを こうたいして はいたつ！",perk:"shop",rounds:3};
SHOP_OWNERS.link={sp:"rabbit",name:"パズルの ララ",outfit:{head:"starclip"}};
SHOP_OWNERS.relay={sp:"penguin",name:"はいたつの ソラ",outfit:{neck:"scarf_red"}};
HOWTO.link=["おなじ えを 3こ いじょう なぞってね。\nたて・よこ・ななめに つながるよ。","7こ つなぐと まわりも けせる！\n5びょう いないに つづけて 4コンボで フィーバー！","まぜるのは 3かいまで。ひょうかが 3ずつ へるよ。\nもくひょうの かずまで あつめよう！"];
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
