// 自発的なしぐさ。所持品・能力値は変えず、シーン内だけで進める。
const HomeActions = {
  INTERVAL: 15,
  kinds: [
    {id:'nap',name:'いねむり',duration:7}, {id:'stretch',name:'のび',duration:4},
    {id:'yawn',name:'あくび',duration:4}, {id:'sit',name:'ひとやすみ',duration:7,near:['chair_wood','stool_oak','sofa','cloudsofa']},
    {id:'read',name:'どくしょ',duration:7,near:['bookshelf']}, {id:'sing',name:'うたう',duration:6},
    {id:'stumble',name:'つまずく',duration:3}, {id:'peek',name:'かくれて のぞく',duration:6,near:'floor'},
    {id:'sweep',name:'おそうじ',duration:6}, {id:'water',name:'みずやり',duration:6,near:['plant','flowerpot','planter']},
    {id:'admire',name:'かぐを ながめる',duration:5,near:'floor'}, {id:'toy',name:'おもちゃで あそぶ',duration:6,near:['toybox','teddy']},
    {id:'aquarium',name:'おさかなを ながめる',duration:7,near:['aquarium','fishbowl']},
    {id:'exercise',name:'たいそう',duration:5}, {id:'spin',name:'くるり',duration:4}, {id:'wave',name:'てを ふる',duration:4},
  ],
  actors(sc) {return [...sc.chars,...sc.parents];},
  free(sc,c) {return !c.hidden&&!c.target&&!c.queue?.length&&(!sc.parents.includes(c)||!sc.work||sc.work.phase==='home')&&!sc.parents.some(p=>p.target===c.id)&&['idle','walk'].includes(c.state);},
  // 座面の中心と高さ。家具と同じ斜め投影・向きで合わせる。
  seat(sc,it,c) {
    const p=sc.anchor(it),{w,d}=HomeDesign.dimensions(it.id),x=0,y=-d*.36;
    const height=it.id==='chair_wood'?29:it.id==='stool_oak'?45:33;
    return {x:p.x+(it.flip?y+d/2:x),y:p.y+(it.flip?x-w/2:y),lift:height-(sc.parents.includes(c)?18:5)*1.35};
  },
  point(sc,c) {return sc.toScreen(c.x,c.y,c.activity?.stage==='act'?(c.activity.lift||0):0);},
  depth(sc,c) {const a=c.activity,it=a?.stage==='act'&&a.id==='sit'&&Save.d.room.items.find(it=>it.uid===a.uid);return it?sc.depth(sc.anchor(it))+1:sc.depth(c)+.5;},
  init(sc) {sc.actions={next:this.INTERVAL,time:0,turn:0,bag:[],log:[]};},
  furniture(sc,k) {
    return (Save.d.room.items||[]).filter(it=>FURN_INDEX[it.id] && (k.near==='floor'?FURN_INDEX[it.id].kind==='floor':k.near?.includes(it.id)));
  },
  available(sc) {return this.kinds.filter(k=>!k.near||this.furniture(sc,k).length);},
  start(sc,c,id) {
    const k=this.available(sc).find(k=>k.id===id);
    if(!k||!c||sc.mode||sc.life.quarrel||!this.free(sc,c))return false;
    const items=k.near?this.furniture(sc,k).filter(it=>!this.actors(sc).some(o=>o!==c&&o.activity?.uid===it.uid)):[];
    if(k.near&&!items.length)return false;
    const it=items.sort((a,b)=>{const p=sc.anchor(a),q=sc.anchor(b);return Math.hypot(p.x-c.x,p.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y);})[0];
    const a=c.activity={id,elapsed:0,duration:k.duration,stage:it?'approach':'act',travel:0,uid:it?.uid};
    c.jumpT=-1;c.emo=null;c.dir='down';
    if(it){const p=sc.anchor(it);a.item={x:it.x,y:it.y,flip:!!it.flip,id:it.id};c.state='walk';c.tx=U.clamp(p.x+(it.flip?32:0),25,ROOM.W-25);c.ty=U.clamp(p.y+(id==='peek'?-60:24),ROOM.WALL+40,ROOM.H-20);a.exit={x:c.tx,y:c.ty};}
    else c.state='activity';
    sc.actions.log.push({id,who:c.id,time:sc.actions.time,uid:a.uid});if(sc.actions.log.length>40)sc.actions.log.shift();
    return true;
  },
  cancel(c) {if(!c?.activity)return;const a=c.activity;if(a.stage==='act'&&a.id==='sit')Object.assign(c,a.exit);delete c.activity;if(['activity','walk'].includes(c.state)){c.state='idle';c.t=2;c.time=2;c.emo=null;}},
  update(sc,dt) {
    if(document.hidden||UI.busy)return;
    if(sc.mode||sc.life.quarrel){for(const c of this.actors(sc))this.cancel(c);return;}
    const a=sc.actions;a.time+=dt;
    for(const c of this.actors(sc)){
      const v=c.activity;if(!v)continue;
      const it=v.uid&&Save.d.room.items.find(it=>it.uid===v.uid);
      if(v.uid&&(!it||it.x!==v.item.x||it.y!==v.item.y||!!it.flip!==v.item.flip||it.id!==v.item.id)){this.cancel(c);continue;}
      if(c.hidden||c.target||(sc.parents.includes(c)&&sc.work?.phase!=='home')||sc.parents.some(p=>p.target===c.id)||!['walk','idle','activity'].includes(c.state)){this.cancel(c);continue;}
      if(v.stage==='approach'){
        v.travel+=dt;
        if(v.travel>12){this.cancel(c);continue;}
        if(c.state!=='idle')continue;
        v.stage='act';c.state='activity';c.dir='down';
        if(v.id==='sit'){const seat=this.seat(sc,it,c);c.x=seat.x;c.y=seat.y;v.lift=seat.lift;v.flip=!!it.flip;}
        if(v.id==='aquarium'){v.flip=!!it.flip;c.dir=it.flip?'left':'up';}
        if(v.id==='admire'&&FURN_INDEX[Save.d.room.items.find(it=>it.uid===v.uid)?.id]?.interactive)sc.life.furniture[v.uid]=v.duration;
      }
      v.elapsed+=dt;if(v.elapsed>=v.duration)this.cancel(c);
    }
    if((a.next-=dt)>0)return;
    a.next=this.INTERVAL;
    const kids=this.actors(sc).filter(c=>!c.activity&&this.free(sc,c));
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
    if(k==='sit'){v.pose='land_01';v.sy=.83;v.face='normal';v.y=0;v.dir=a.flip?'right':'left';}
    if(k==='aquarium'){v.face='normal';v.dir=a.flip?'left':'up';v.angle=.035*Math.sin(t*1.3);v.x=Math.sin(t*1.3)*2;}
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
      const it=Save.d.room.items.find(it=>it.uid===a.uid);
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
