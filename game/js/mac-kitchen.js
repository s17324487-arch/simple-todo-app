// 平和台のマックさん。1つの時計で落下具材とフライヤーを進める。
const MacKitchen = {
  ingredients:[{id:'bottom',name:'したの バンズ'},{id:'lettuce',name:'キャベツ'},{id:'patty',name:'バーガー'},{id:'tomato',name:'トマト'},{id:'cheese',name:'チーズ'},{id:'avocado',name:'アボカド'},{id:'top',name:'うえの バンズ'}],
  name(id){return this.ingredients.find(f=>f.id===id)?.name||id;},
  sizzle(stage){
    if(!Sound.ctx||!Save.d.settings.se||document.hidden)return;
    Sound.noise(Sound.seGain,{dur:.13,vol:stage==='gold'?.07:.035,freq:stage==='gold'?5100:stage==='burnt'?900:2200,q:.6});
  },
};
class MacKitchenRound {
  constructor(level=1,rng=Math.random){
    this.level=U.clamp(level,1,5);this.rng=rng;this.time=0;this.spawnIn=.2;this.serial=0;this.plate=.5;this.falling=[];this.made=[];this.mistakes=0;this.offset=0;
    const pool=['lettuce','patty','tomato','cheese','avocado'];
    this.want=['bottom','patty'];for(let i=0;i<this.level+1;i++)this.want.push(pool[Math.floor(this.rng()*pool.length)]);this.want.push('top');
    this.fries={state:'ready',time:0,score:0};this.limit=40+this.level*6;
  }
  stage(){const f=this.fries;return f.state!=='frying'?f.state:f.time<6?'raw':f.time<=8?'gold':'burnt';}
  fry(){const f=this.fries;if(f.state==='ready'||f.state==='done'&&f.score<100){this.fries={state:'frying',time:0,score:0};return;}if(f.state==='frying'){f.score=f.time>=6&&f.time<=8?100:Math.max(0,100-Math.round(Math.abs(f.time-7)*28));f.state='done';}}
  move(x){this.plate=U.clamp(x,.12,.88);}
  undo(){if(this.made.length){this.made.pop();this.mistakes++;}}
  tick(dt){
    this.time+=dt;if(this.fries.state==='frying')this.fries.time+=dt;
    if(this.fries.state==='done'){this.fries.held=(this.fries.held||0)+dt;if(this.fries.held>10)this.fries.score=Math.max(0,this.fries.score-dt*3);}
    this.spawnIn-=dt;
    if(this.spawnIn<=0){
      const next=this.want[this.made.length];
      if(next){const id=this.serial++%3===0||this.rng()<.55?next:MacKitchen.ingredients[Math.floor(this.rng()*7)].id;this.falling.push({id,n:this.serial,x:.12+this.rng()*.76,y:0,v:(.28+this.level*.035),vx:(this.rng()-.5)*.08});}
      this.spawnIn=.95-this.level*.07;
    }
    for(const f of this.falling){f.x=U.clamp(f.x+f.vx*dt,.08,.92);f.y+=f.v*dt;if(f.y>=1&&!f.done){f.done=true;if(Math.abs(f.x-this.plate)<.14&&this.made.length<this.want.length){this.made.push(f.id);this.offset+=Math.abs(f.x-this.plate);if(f.id!==this.want[this.made.length-1])this.mistakes++;}}}
    this.falling=this.falling.filter(f=>!f.done);
  }
  score(){const right=this.want.reduce((n,id,i)=>n+(this.made[i]===id?1:0),0);return Math.max(0,Math.round(right/this.want.length*70+this.fries.score*.3-this.mistakes*4));}
  complete(){return this.made.length===this.want.length&&this.fries.state==='done';}
}
class MacKitchenTask extends BurgerTask {
  constructor(sc,lv){super(sc,lv);this.round=new MacKitchenRound(lv);this.want=this.round.want;this.made=this.round.made;this.title='バーガー ＋ ポテト';this.hideAfter=0;this.timeLimit=this.round.limit;this.soundClock=0;}
  setup(){
    const R=this.R;if(!R)return;const y=R.y+R.h-48,w=(R.w-38)/4;
    this.btns=[{label:'◀',cb:()=>this.round.move(this.round.plate-.12)},{label:'▶',cb:()=>this.round.move(this.round.plate+.12)},{label:'つみなおす',cb:()=>this.round.undo()},{label:'できあがり',cb:()=>{if(this.round.complete())this.sc.finish(this.score());}}].map((b,i)=>({...b,x:R.x+10+i*(w+6),y,w,h:44,fs:11}));
    this.btns.push({x:R.x+R.w-98,y:R.y+R.h-105,w:88,h:48,label:this.round?.fries.state==='frying'?'ひきあげる':'あげる',fs:11,cb:()=>{this.round.fry();this.setup();}});
  }
  downArea(p){const r=this.playRect();if(p.y>=r.y&&p.y<=r.y+r.h&&p.x<r.x+r.w){this.drag=true;this.round.move((p.x-r.x)/r.w);}}
  move(p){if(this.drag){const r=this.playRect();this.round.move((p.x-r.x)/r.w);}}
  up(){this.drag=false;}
  key(k){if(k==='left')this.round.move(this.round.plate-.1);if(k==='right')this.round.move(this.round.plate+.1);if(k==='ok'){this.round.fry();this.setup();}}
  playRect(){const R=this.R;return {x:R.x+14,y:R.y+28,w:R.w-126,h:Math.max(62,R.h-125)};}
  tick(dt){this.round.tick(dt);if((this.soundClock-=dt)<=0&&this.round.fries.state==='frying'){MacKitchen.sizzle(this.round.stage());this.soundClock=.18;}this.btns[3].disabled=!this.round.complete();}
  score(){return this.round.score();}
  timeout(){return Math.min(55,this.score());}
  drawOrder(ctx,x,y,w,h){const n=this.want.length;ctx.save();ctx.fillStyle=INK;ctx.textAlign='center';ctx.font='bold 10px sans-serif';this.want.forEach((id,i)=>{const xx=x+(i%4+.5)*w/4,yy=y+Math.floor(i/4)*Math.min(32,h/3);ctx.fillText(String(i+1),xx,yy+8);this.ingredient(ctx,id,xx,yy+20,.32);});ctx.restore();}
  ingredient(ctx,id,x,y,s=1){if(id!=='avocado')return super.ingredient(ctx,id,x,y,s);ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.fillStyle='#719D60';ctx.beginPath();ctx.ellipse(0,0,29,8,-.07,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#C7D989';ctx.beginPath();ctx.ellipse(0,0,21,4,-.07,0,7);ctx.fill();ctx.restore();}
  draw(ctx){
    const R=this.R,p=this.playRect(),g=this.round,fx=R.x+R.w-55,fy=R.y+65;ctx.save();
    ctx.fillStyle='#FFF6DE';U.rr(ctx,p.x-4,p.y-4,p.w+8,p.h+15,9);ctx.fill();ctx.strokeStyle='#C8AE8C';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=INK;ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.fillText('ゆびで おさらを うごかそう',p.x,R.y+15);
    for(const f of g.falling)this.ingredient(ctx,f.id,p.x+f.x*p.w,p.y+f.y*(p.h-12)-g.made.length*3,.55);
    const x=p.x+g.plate*p.w,y=p.y+p.h;ctx.fillStyle='#BBCBD0';U.rr(ctx,x-26,y-4,52,8,4);ctx.fill();
    g.made.forEach((id,i)=>this.ingredient(ctx,id,x,y-10-i*5,.55));
    ctx.fillStyle='#68767B';ctx.strokeStyle=INK;U.rr(ctx,fx-39,fy,78,63,6);ctx.fill();ctx.stroke();ctx.fillStyle=g.stage()==='burnt'?'#8A583F':'#DFB369';U.rr(ctx,fx-31,fy+7,62,42,4);ctx.fill();
    if(g.fries.state!=='ready'){ctx.strokeStyle=g.stage()==='gold'?'#F6CC63':g.stage()==='burnt'?'#86532F':'#F7E7A2';ctx.lineWidth=4;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(fx-23+i*8,fy+13);ctx.lineTo(fx-23+i*8,fy+40);ctx.stroke();}}
    if(g.fries.state==='frying'){ctx.strokeStyle='#FFF0BF';ctx.lineWidth=1;for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(fx-25+i*8,fy+26+Math.sin(g.time*7+i)*10,2+Math.sin(g.time+i),0,7);ctx.stroke();}}
    const label={ready:'ポテトを あげよう',raw:'ジュワーー…',gold:'パチ パチッ！',burnt:'こげちゃう！',done:g.fries.held>10?'さめて きたよ！':g.fries.score===100?'カリッと できた！':'もういちど あげる？'}[g.stage()];
    ctx.fillStyle=INK;ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillText('ポテト',fx,fy-12);ctx.fillText(label,fx,fy+78,95);ctx.fillText('パチパチで あげる',fx,fy+94,96);
    ctx.textAlign='left';ctx.fillText(`${g.made.length} / ${g.want.length} だん`,p.x,R.y+R.h-62);ctx.restore();
  }
}
const MacShop = {
  howto:['マックさんへ ようこそ！ バーガーと ポテトを いっしょに つくろう。','おさらを なぞって、ちゅうもんの じゅんに うけとめてね。\nちがう ぐざいは よける。まちがえたら「つみなおす」。','ポテトは「あげる」で スタート。\nパチ パチッ！と なったら「ひきあげる」。\nおとも もじも あいずだよ。','ポテトは 10びょうで さめはじめるよ。\nバーガーと いっしょに できあがるように！'],
  install(){
    const b=MAP_DEFS.heiwadai.buildings.find(b=>b.id==='heiwadai_diner');b.label='マックさん';b.act={type:'work',shop:'burger',variant:'mac'};
    const original=WorldArt.heiwadai_bld_shop_diner;WorldArt.heiwadai_bld_shop_diner=o=>{const m=original(o);return {...m,svg:m.svg.replaceAll('キッチン','マックさん')};};
  },
};
MacShop.install();
