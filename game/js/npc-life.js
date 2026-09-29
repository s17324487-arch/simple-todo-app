// 町の人の散歩としぐさ。状態はシーン内だけに持ち、セーブと原画の個性は変えない。
const NpcLife = {
  actions: {
    wave: { label: "てを ふる", emo: "happy", dur: 2.6 },
    stretch: { label: "のび", emo: "sleep", dur: 3.2 },
    think: { label: "かんがえごと", emo: "normal", dur: 3.6 },
    look: { label: "きょろきょろ", emo: "normal", dur: 3.2 },
    laugh: { label: "わらう", emo: "happy", dur: 2.8 },
    yawn: { label: "あくび", emo: "sleep", dur: 3.6 },
    hum: { label: "はなうた", emo: "happy", dur: 3.6 },
    admire: { label: "みとれる", emo: "surprise", dur: 3.2 },
    shy: { label: "てれる", emo: "happy", dur: 2.8 },
    bow: { label: "おじぎ", emo: "happy", dur: 2.4 },
  },
  init(sc, n) {
    if (n.life) return n.life;
    // カウンター・看板位置に描く人は持ち場を守る。屋外の住人には局所的な散歩を足す。
    const fixed = n.stationary || (n.artOffset && !n.wander) || sc.map.def.indoor;
    return n.life = { action: null, elapsed: 0, wait: U.rand(3, 12), walkWait: U.rand(1, 5),
      greetWait: U.rand(8, 20), steps: 0, bounds: fixed ? null : n.wander || [n.x-3,n.y-3,n.x+3,n.y+3], last: null };
  },
  start(n, action) {
    if (!n.life || !this.actions[action]) return false;
    n.life.action = action; n.life.elapsed = 0; n.life.last = action; n.life.steps = 0;
    return true;
  },
  clear(n) { if(n.life){n.life.action=null;n.life.elapsed=0;n.life.wait=U.rand(10,18);n.life.walkWait=U.rand(2,5);} },
  stationaryActor(spec) {
    const n={...spec,w:new Walker(0,0,"down"),stationary:true};
    this.init({map:{def:{indoor:true}}},n);this.start(n,"wave");return n;
  },
  updateStationary(n,dt,talking=false) {
    n.talking=talking;
    this.update({npcs:[n],party:[{tx:100,ty:100}],busy:false},dt);
  },
  safeTile(sc, x, y) {
    const m=sc.map;
    if(m.isSolid(x,y)||sc.rockAt(x,y)||m.warpAt(x,y))return false;
    if(m.doors.some(d=>Math.abs(d.x-x)+Math.abs(d.y-y)<=1))return false;
    if(m.warps.some(d=>x>=d.x-1&&x<=d.x+d.w&&y>=d.y-1&&y<=d.y+d.h))return false;
    if([...m.signs,...m.chests].some(d=>Math.abs(d.x-x)+Math.abs(d.y-y)<=1))return false;
    // 1マスの通路・袋小路を散歩先にしない。
    return Object.values(DIRS).filter(([dx,dy])=>!m.isSolid(x+dx,y+dy)).length>=3;
  },
  canStep(sc,n,x,y) {
    const b=n.life.bounds;if(!b||x<b[0]||x>b[2]||y<b[1]||y>b[3]||!this.safeTile(sc,x,y))return false;
    const occupies=w=>(w.tx===x&&w.ty===y)||(w.moving&&w.fx===x&&w.fy===y);
    if(sc.party.some(occupies)||sc.follower&&occupies(sc.follower.w))return false;
    if(sc.npcs.some(o=>o!==n&&occupies(o.w))||sc.enemies.some(e=>occupies(e.w)))return false;
    if(sc.path?.some(p=>p[0]===x&&p[1]===y))return false;
    return true;
  },
  update(sc, dt) {
    for(const n of sc.npcs){
      const s=this.init(sc,n);n.w.update(dt);
      if(n.talking||sc.pending?.npc===n){s.action=null;s.elapsed=0;continue;}
      if(sc.busy||Game.inputLocked)continue;
      s.greetWait-=dt;
      if(n.w.moving)continue;
      if(s.action){s.elapsed+=dt;if(s.elapsed>=this.actions[s.action].dur)this.clear(n);continue;}
      const lead=sc.party[0],dist=Math.abs(n.w.tx-lead.tx)+Math.abs(n.w.ty-lead.ty);
      if(dist<=3&&dist>0&&s.greetWait<=0){
        n.w.dir=dirOf(lead.tx-n.w.tx,lead.ty-n.w.ty)||n.w.dir;this.start(n,"wave");s.greetWait=U.rand(25,45);continue;
      }
      s.wait-=dt;s.walkWait-=dt;
      if(s.wait<=0){
        const choices=Object.keys(this.actions).filter(a=>a!==s.last);
        this.start(n,U.pick(choices));continue;
      }
      if(!s.bounds||s.walkWait>0)continue;
      const dirs=Object.values(DIRS).filter(([dx,dy])=>this.canStep(sc,n,n.w.tx+dx,n.w.ty+dy));
      if(!dirs.length){s.walkWait=1.5;continue;}
      const [dx,dy]=U.pick(dirs);n.w.moveTo(n.w.tx+dx,n.w.ty+dy,0.48);
      s.steps=s.steps||U.randi(2,4);s.steps--;s.walkWait=s.steps?0.5:U.rand(3,6);
    }
  },
  visual(n) {
    const s=n.life,t=s?.elapsed||0,a=n.talking?"talk":s?.action;
    if(n.w.moving)return {pose:n.w.pose(),emo:n.emo||"normal",gesture:"none",dy:0,tilt:0};
    const phase=Math.floor((n.talking?n.w.anim:t)*3)%2;
    let gesture=a||"none",dy=0,tilt=0;
    if(a==="wave")gesture=phase?"wave":"wave_low";
    if(a==="hum"){gesture=phase?"wave_low":"think";tilt=Math.sin(t*4)*3;}
    if(a==="laugh")dy=-Math.abs(Math.sin(t*8))*2;
    if(a==="bow")tilt=Math.sin(Math.min(1,t/2.4)*Math.PI)*8;
    if(a==="look")tilt=Math.sin(t*3)*4;
    if(a==="shy")tilt=-5;
    if(a==="talk")gesture=phase?"think":"wave_low";
    // まばたきも有限の表情。時刻をキャッシュキーへ入れない。
    const blink=n.w.anim%4.7<0.14;
    return {pose:phase?"idle_02":"idle_01",emo:blink?"sleep":a==="talk"?"happy":this.actions[a]?.emo||n.emo||"normal",gesture,dy,tilt};
  },
  accent(ctx,n,x,y) {
    const a=n.life?.action;if(!a||n.talking)return;
    const mark={hum:"♪",think:"…",yawn:"ふぁ",admire:"✧"}[a];if(!mark)return;
    ctx.save();ctx.font="bold 11px sans-serif";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#fffdf2";ctx.fillStyle="#66547d";
    const fy=y-47-Math.sin(n.life.elapsed*2)*2;ctx.strokeText(mark,x-15,fy);ctx.fillText(mark,x-15,fy);ctx.restore();
  },
};
