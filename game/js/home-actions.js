// 自発的なしぐさ。所持品・能力値は変えず、シーン内だけで進める。家具は その 画面の へや（Room.of。おじゃま〔js/online-visit.js〕では よその おへや）。
const HomeActions = {
  INTERVAL: 15,
  kinds: [
    {id:'nap',name:'いねむり',duration:7}, {id:'stretch',name:'のび',duration:4},
    {id:'yawn',name:'あくび',duration:4}, {id:'sit',name:'ひとやすみ',duration:7,near:['chair_wood','sofa','mushroom','kotatsu']},
    {id:'read',name:'どくしょ',duration:7,near:['bookshelf']}, {id:'sing',name:'うたう',duration:6},
    {id:'stumble',name:'つまずく',duration:3}, {id:'peek',name:'かくれて のぞく',duration:6,near:'floor'},
    {id:'sweep',name:'おそうじ',duration:6}, {id:'water',name:'みずやり',duration:6,near:['plant','flowerpot','planter']},
    {id:'admire',name:'かぐを ながめる',duration:5,near:'floor'}, {id:'toy',name:'おもちゃで あそぶ',duration:6,near:['toybox','teddy']},
    {id:'exercise',name:'たいそう',duration:5}, {id:'spin',name:'くるり',duration:4}, {id:'wave',name:'てを ふる',duration:4},
  ],
  init(sc) {sc.actions={next:this.INTERVAL,time:0,turn:0,bag:[],log:[]};},
  furniture(sc,k) {
    return (Room.of(sc).items||[]).filter(it=>FURN_INDEX[it.id] && (k.near==='floor'?FURN_INDEX[it.id].kind==='floor':k.near?.includes(it.id)));
  },
  available(sc) {return this.kinds.filter(k=>!k.near||this.furniture(sc,k).length);},
  start(sc,c,id) {
    const k=this.available(sc).find(k=>k.id===id);
    if(!k||!c||c.hidden||sc.mode||sc.life.quarrel||sc.parents.some(p=>p.target===c.id)||!['idle','walk'].includes(c.state))return false;
    const items=k.near?this.furniture(sc,k):[];
    const it=items.sort((a,b)=>{const p=sc.anchor(a),q=sc.anchor(b);return Math.hypot(p.x-c.x,p.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y);})[0];
    const a=c.activity={id,elapsed:0,duration:k.duration,stage:it?'approach':'act',travel:0,uid:it?.uid};
    c.jumpT=-1;c.emo=null;c.dir='down';
    // かくれて のぞく ときは 家具の うしろ（足もとの おく。家具の なかに はいらない。js/home-nav.js）
    if(it){const p=sc.anchor(it),m=HomeDesign.model(it.id,it);c.state='walk';c.tx=U.clamp(p.x+30,40,ROOM.W-40);c.ty=U.clamp(id==='peek'?Math.min(p.y-60,p.y-m.footD-16):p.y+24,ROOM.WALL+65,ROOM.H-30);}
    else c.state='activity';
    sc.actions.log.push({id,who:c.id,time:sc.actions.time,uid:a.uid});if(sc.actions.log.length>40)sc.actions.log.shift();
    return true;
  },
  cancel(c) {if(!c.activity)return;delete c.activity;if(c.state==='activity'){c.state='idle';c.t=2;c.emo=null;}},
  update(sc,dt) {
    if(document.hidden||UI.busy)return;
    if(sc.mode||sc.life.quarrel){for(const c of sc.chars)this.cancel(c);return;}
    const a=sc.actions;a.time+=dt;
    for(const c of sc.chars){
      const v=c.activity;if(!v)continue;
      if(c.hidden||sc.parents.some(p=>p.target===c.id)||!['walk','idle','activity'].includes(c.state)){this.cancel(c);continue;}
      if(v.stage==='approach'){
        v.travel+=dt;
        if(v.travel>12){this.cancel(c);continue;}
        if(c.state!=='idle')continue;
        v.stage='act';c.state='activity';c.dir='down';
        if(v.id==='admire'&&FURN_INDEX[Room.of(sc).items.find(it=>it.uid===v.uid)?.id]?.interactive)sc.life.furniture[v.uid]=v.duration;
      }
      v.elapsed+=dt;if(v.elapsed>=v.duration)this.cancel(c);
    }
    if((a.next-=dt)>0)return;
    a.next=this.INTERVAL;
    const kids=sc.chars.filter(c=>!c.activity&&!c.hidden&&['idle','walk'].includes(c.state)&&!sc.parents.some(p=>p.target===c.id));
    if(!kids.length)return;
    const allowed=this.available(sc).map(k=>k.id);a.bag=a.bag.filter(id=>allowed.includes(id));
    if(!a.bag.length)a.bag=U.shuffle([...allowed]);
    this.start(sc,kids[a.turn++%kids.length],a.bag.pop());
  },
  visual(c) {
    const a=c.activity;if(!a||a.stage!=='act')return null;
    const t=a.elapsed,k=a.id,osc=Math.sin(t*5),v={pose:'idle_01',face:'happy',dir:'down',x:0,y:0,angle:0,sx:1,sy:1,alpha:1};
    if(k==='nap'){v.face='sleep';v.angle=.12*Math.sin(t);v.sy=.94;}
    if(k==='stretch'){v.sy=1+.09*Math.sin(Math.PI*t/a.duration);v.sx=1-.05*Math.sin(Math.PI*t/a.duration);v.pose='idle_02';}
    if(k==='yawn'){v.face='surprise';v.angle=-.08;v.sy=.95;}
    if(k==='sit'){v.pose='land_01';v.sy=.83;v.face='normal';v.y=-10*Math.min(1,t*2);}
    if(k==='read'){v.face='normal';v.angle=.035*Math.sin(t*2);}
    if(k==='sing'){v.pose=osc>0?'idle_02':'idle_01';v.angle=osc*.09;v.y=-Math.abs(osc)*3;}
    if(k==='stumble'){v.face='surprise';v.angle=.5*Math.sin(Math.PI*Math.min(1,t/1.7));v.y=7*Math.sin(Math.PI*Math.min(1,t/1.7));v.pose=t<1.5?'land_01':'idle_02';}
    if(k==='peek'){v.x=8*osc;v.sy=.87;v.dir=osc>0?'right':'left';}
    if(k==='sweep'){v.angle=osc*.08;v.dir='right';}
    if(k==='water'){v.angle=.12;v.dir='left';v.pose='jump_01';}
    if(k==='admire'){v.face='love';v.y=-Math.abs(Math.sin(t*2))*3;}
    if(k==='toy'){v.pose='land_01';v.sy=.92;v.dir=osc>0?'right':'left';}
    if(k==='exercise'){v.sy=1-.15*Math.max(0,osc);v.pose=osc>0?'land_01':'idle_02';}
    if(k==='spin'){v.dir=['down','left','up','right'][Math.floor(t*4)%4];v.y=-Math.abs(osc)*4;}
    if(k==='wave'){v.pose=osc>0?'jump_01':'idle_01';v.angle=osc*.05;}
    return v;
  },
  props(sc,ctx,c,p,s) {
    const a=c.activity;if(!a||a.stage!=='act')return;
    const t=a.elapsed,k=a.id;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineCap='round';
    if(k==='nap'||k==='yawn'){ctx.fillStyle=INK;ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(k==='nap'?'z Z':'ふぁ…',25,-85-Math.sin(t*2)*4);}
    if(k==='sing')for(let i=0;i<3;i++)FX.note(ctx,-30+i*26,-80-((t*18+i*12)%35));
    if(k==='read'){
      ctx.fillStyle='#F6E6BE';ctx.beginPath();ctx.moveTo(-22,-35);ctx.lineTo(-22,-57);ctx.quadraticCurveTo(-9,-61,0,-54);ctx.quadraticCurveTo(11,-61,23,-57);ctx.lineTo(23,-35);ctx.quadraticCurveTo(10,-39,0,-33);ctx.quadraticCurveTo(-10,-39,-22,-35);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-54);ctx.lineTo(0,-33);ctx.moveTo(-17,-49);ctx.lineTo(-5,-46);ctx.moveTo(6,-46);ctx.lineTo(18,-49);ctx.stroke();
    }
    if(k==='sweep'){
      const x=25+Math.sin(t*5)*8;ctx.strokeStyle='#956B44';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-8,-44);ctx.lineTo(x+5,1);ctx.stroke();ctx.fillStyle='#DDBB79';ctx.beginPath();ctx.moveTo(x-3,-6);ctx.lineTo(x+11,-10);ctx.lineTo(x+20,3);ctx.lineTo(x-4,8);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke();
    }
    if(k==='water'){
      const it=Room.of(sc).items.find(it=>it.uid===a.uid);
      if(it){const r=sc.itemRect(it);ctx.translate((r.x+r.w*.5-p.x)/s+54,(r.y+r.h*.3-p.y)/s+39);}
      ctx.fillStyle='#98C5C9';ctx.beginPath();ctx.roundRect(-42,-45,23,17,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-39,-31);ctx.lineTo(-53,-42);ctx.stroke();ctx.strokeStyle='#77ADCD';for(let i=0;i<3;i++){const y=(t*28+i*7)%21;ctx.beginPath();ctx.moveTo(-54-i*3,-39+y);ctx.lineTo(-55-i*3,-35+y);ctx.stroke();}
    }
    if(k==='toy'){
      ctx.fillStyle='#F1B3B4';ctx.beginPath();ctx.arc(25+Math.sin(t*4)*15,-9-Math.abs(Math.sin(t*4))*16,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    if(k==='admire'){FX.star(ctx,-26,-68,5,'#FFE066');FX.star(ctx,30,-90,6,'#FFE066');}
    if(k==='stumble'&&t<1.7){ctx.strokeStyle='#D69D53';ctx.beginPath();ctx.moveTo(28,-66);ctx.lineTo(37,-72);ctx.moveTo(28,-57);ctx.lineTo(39,-58);ctx.stroke();}
    ctx.restore();
  },
};
