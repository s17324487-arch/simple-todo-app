// なぞった線の近さ、乾かし残し、リボンを採点するトリミング。
const GROOM_STYLES=[{id:'round',name:'まあるく'},{id:'wave',name:'ふんわり'},{id:'peak',name:'やまがた'}];
class GroomTask extends TaskBase {
  constructor(sc,lv){
    super(sc,lv);this.style=U.pick(GROOM_STYLES.slice(0,Math.min(lv,3)));this.ribbon=U.pick(RIBBONS).id;
    this.stage='cut';this.trimmed=Array(17+lv*2).fill(false);this.offLine=0;this.dry=[0,0,0];this.chosen=null;
    this.timeLimit=[46,44,42,40,38][lv-1];this.title='すっきり おねがい！';
    this.spec={sp:sc.cust?.sp||'sheep',col:sc.cust?.col||'#F3E6D1',outfit:{},emo:'happy'};
  }
  layout(R){this.R=R;this.cx=R.x+R.w/2;this.cy=R.y+R.h*.44;this.radius=Math.min(93,R.w*.28,R.h*.28);this.setup();}
  outline(){return this.trimmed.map((_,i)=>{const a=Math.PI+i/(this.trimmed.length-1)*Math.PI,t=i/(this.trimmed.length-1),shape=this.style.id==='wave'?Math.sin(t*Math.PI*4)*7:this.style.id==='peak'?Math.max(0,1-Math.abs(t-.5)*4)*-14:0;return {x:this.cx+Math.cos(a)*this.radius,y:this.cy+Math.sin(a)*this.radius*.66+shape};});}
  zones(){return [-.62,0,.62].map((x,i)=>({x:this.cx+this.radius*x,y:this.cy+(i===1?-.35:.12)*this.radius}));}
  setup(){
    const R=this.R;this.pointer=null;this.btns=[];
    if(this.stage==='ribbon'){
      const cells=gridBtns(R,4,2,R.y+R.h-116,48);this.btns=RIBBONS.map((r,i)=>({...cells[i],label:r.name+'の リボン',color:r.col,fs:12,cb:()=>{this.chosen=r.id;this.sc.finish(this.score());Sound.se('sparkle');}}));
    }else{
      const w=(R.w-28)/2,y=R.y+R.h-54;
      this.btns=[{x:R.x+10,y,w,h:44,label:'やりなおし',fs:13,cb:()=>{this.trimmed.fill(false);this.offLine=0;this.dry.fill(0);this.stage='cut';this.setup();}},
        {x:R.x+18+w,y,w,h:44,label:this.stage==='cut'?'カット おわり':'リボンを えらぶ',fs:13,color:'#FFD54F',cb:()=>{this.stage=this.stage==='cut'?'dry':'ribbon';this.setup();}}];
    }
  }
  downArea(p){if(this.stage==='ribbon')return;if(p.y<this.R.y+30||p.y>this.R.y+this.R.h-70)return;this.pointer={...p};}
  move(p){
    if(!this.pointer)return;
    const before=this.pointer;this.pointer={...p};if(this.stage!=='cut')return;
    const points=this.outline(),distance=Math.hypot(p.x-before.x,p.y-before.y),steps=Math.max(1,Math.ceil(distance/4)),tolerance=20-this.lv;
    for(let i=1;i<=steps;i++){
      const x=U.lerp(before.x,p.x,i/steps),y=U.lerp(before.y,p.y,i/steps);
      const nearest=Math.min(...points.map(q=>Math.hypot(x-q.x,y-q.y)));
      if(nearest>tolerance)this.offLine+=distance/steps;
      else for(let j=0;j<points.length;j++)if(Math.hypot(points[j].x-x,points[j].y-y)<=tolerance)this.trimmed[j]=true;
    }
  }
  up(){this.pointer=null;}
  tick(dt){
    if(this.stage!=='dry'||!this.pointer)return;
    this.zones().forEach((q,i)=>{if(Math.hypot(this.pointer.x-q.x,this.pointer.y-q.y)<29)this.dry[i]=Math.min(1,this.dry[i]+dt/(.6+this.lv*.1));});
  }
  score(){return this.trimmed.filter(Boolean).length/this.trimmed.length*60+this.dry.reduce((n,v)=>n+v,0)/3*20+(this.chosen===this.ribbon?20:0)-Math.min(25,this.offLine*.045)-this.sc.timePenalty();}
  timeout(){return Math.min(40,this.score()-20);}
  drawOrder(ctx,x,y,w,h){
    ctx.save();ctx.fillStyle=INK;ctx.textAlign='center';ctx.font="800 13px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(this.style.name+' カット',x+w/2,y+22);const r=RIBBONS.find(r=>r.id===this.ribbon);ctx.fillStyle=r.col;ctx.beginPath();ctx.moveTo(x+w/2,y+47);ctx.lineTo(x+w/2-20,y+35);ctx.lineTo(x+w/2-20,y+58);ctx.lineTo(x+w/2+20,y+35);ctx.lineTo(x+w/2+20,y+58);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=INK;ctx.font="800 11px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(r.name+'の リボン',x+w/2,y+h-8);ctx.restore();
  }
  draw(ctx){
    const R=this.R,points=this.outline();ctx.save();
    ctx.fillStyle='#DCE9E6';ctx.strokeStyle='#AAA995';ctx.lineWidth=5;U.rr(ctx,this.cx-this.radius-13,this.cy-this.radius*.8,this.radius*2+26,this.radius*1.65,35);ctx.fill();ctx.stroke();
    ctx.fillStyle='#EFE1C6';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();
    points.forEach((p,i)=>{const extra=this.trimmed[i]?0:12+Math.sin(i*2)*4,x=p.x+(p.x-this.cx)/this.radius*extra,y=p.y-extra;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
    ctx.lineTo(this.cx+this.radius,this.cy+50);ctx.quadraticCurveTo(this.cx,this.cy+75,this.cx-this.radius,this.cy+50);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#D1BB97';ctx.lineWidth=1.7;
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.arc(this.cx+i*this.radius*.22,this.cy-this.radius*(.36-Math.abs(i)*.045),this.radius*.07,.15,Math.PI-.15);ctx.stroke();}
    const key='groom:portrait:'+this.spec.sp+':'+this.spec.col;
    const face=SvgCache.get(key,()=>Art.npcSvg(this.spec).replace('viewBox="'+vbChar+'"','viewBox="15 -30 170 175"'),Math.ceil(170*G.px),Math.ceil(175*G.px));
    if(face)ctx.drawImage(face,this.cx-this.radius*.98,this.cy-this.radius*1.02,this.radius*1.96,this.radius*2.02);
    if(this.stage==='cut'){
      ctx.strokeStyle='#5F9E94';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
      points.forEach((p,i)=>{ctx.fillStyle=this.trimmed[i]?'#F2C965':'#FFF9E8';ctx.beginPath();ctx.arc(p.x,p.y,i===0?8:3,0,7);ctx.fill();});
    }
    if(this.stage==='dry')this.zones().forEach((q,i)=>{ctx.fillStyle=this.dry[i]>=1?'#E8C46F':'#9EC9DC';ctx.beginPath();ctx.arc(q.x,q.y,18,0,7);ctx.fill();ctx.strokeStyle='#FFF9E8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(q.x,q.y,22,-Math.PI/2,-Math.PI/2+this.dry[i]*Math.PI*2);ctx.stroke();ctx.fillStyle=INK;ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText(this.dry[i]>=1?'✓':String(i+1),q.x,q.y+4);});
    if(this.pointer&&this.stage==='cut'){ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.fillStyle='#C3BCD7';ctx.beginPath();ctx.arc(this.pointer.x-8,this.pointer.y+7,6,0,7);ctx.arc(this.pointer.x+8,this.pointer.y+7,6,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(this.pointer.x-8,this.pointer.y+3);ctx.lineTo(this.pointer.x+7,this.pointer.y-13);ctx.moveTo(this.pointer.x+8,this.pointer.y+3);ctx.lineTo(this.pointer.x-7,this.pointer.y-13);ctx.stroke();}
    if(this.pointer&&this.stage==='dry'){const {x,y}=this.pointer;ctx.fillStyle='#B9B0CD';ctx.strokeStyle=INK;ctx.lineWidth=2;U.rr(ctx,x-17,y-6,29,17,6);ctx.fill();ctx.stroke();U.rr(ctx,x-9,y+9,8,14,2);ctx.fill();ctx.stroke();ctx.strokeStyle='#81B8C2';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+17,y-4+i*6);ctx.lineTo(x+29,y-5+i*7);ctx.stroke();}}
    ctx.fillStyle=INK;ctx.textAlign='center';ctx.font="800 13px 'M PLUS Rounded 1c',sans-serif";ctx.fillText({cut:'てんせんを ゆっくり なぞって カット',dry:'3かしょを おさえて かわかそう',ribbon:'ちゅうもんの リボンを えらんでね'}[this.stage],this.cx,R.y+20);
    if(this.stage==='cut'){ctx.font="800 11px 'M PLUS Rounded 1c',sans-serif";ctx.fillText('ととのった '+Math.round(this.trimmed.filter(Boolean).length/this.trimmed.length*100)+'%　ていねいさ '+Math.max(0,100-Math.round(this.offLine*.18))+'%',this.cx,R.y+R.h-70);}
    ctx.restore();
  }
}
MG_TASKS.groom=GroomTask;
SHOP_OWNERS.groom={sp:'cat',name:'ねこの チョキさん',outfit:{head:'beret',body:'apron'}};
HOWTO.groom=['こんにちは。ふんわり すっきり びようしつ！','てんせんに そって ゆびを うごかして カット。\nせんから はみださないように してね。','カットの あとは 3かしょを おさえて かわかして、\nちゅうもんの リボンを えらぼう！'];
SONGS.shop_groom={bpm:110,tracks:[{notes:'A5 E5 G5 . E5 C5 D5 E5 G5 . A5 B5 G5 E5 . _ A5 G5 E5 D5 C5 E5 G5 . F5 E5 D5 B4 C5 . . _'}]};
