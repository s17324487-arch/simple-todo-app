// お庭はサンルームとは別の部屋。家具の所有数と室内の配置を保ったまま行き来する。
const HomeGarden = {
  active(){return Save.d.rooms.active==='yard';},
  starter(){return {wall:'wp_cream',floor:'fl_wood',wallpapers:{wp_cream:true},floors:{fl_wood:true},nextUid:5,items:[
    {uid:1,id:'table_wood',x:335,y:470,flip:false},
    {uid:2,id:'chair_wood',x:265,y:470,flip:true},
    {uid:3,id:'chair_wood',x:410,y:470,flip:false},
    {uid:4,id:'plant',x:410,y:320,flip:false}
  ]};},
  svg(size){
    const H=HomeDesign,W=size.w,D=size.d,b=H.bounds(size),p=(x,y,z=0)=>H.project(x,y,z);
    const poly=(a,c,sw=1.2)=>H.poly(a.map(v=>p(...v)),c,sw);
    const line=(a,c,w=2)=>`<polyline points="${a.map(v=>{const q=p(...v);return `${q.x},${q.y}`;}).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const ellipse=(x,y,z,rx,ry,c)=>{const q=p(x,y,z);return `<ellipse cx="${q.x}" cy="${q.y}" rx="${rx}" ry="${ry}" fill="${c}"/>`;};
    let s=poly([[0,D,0],[W,D,0],[W,D,-22],[0,D,-22]],'#8D7854')+poly([[W,0,0],[W,D,0],[W,D,-22],[W,0,-22]],'#746543');
    s+=poly([[0,0,0],[W,0,0],[W,D,0],[0,D,0]],'#A5BE82');
    // 芝の色むらと葉。乱数や時刻を使わず、背景のキャッシュは有限にする。
    for(let x=12;x<W-10;x+=23)for(let y=12;y<D-10;y+=23){const n=U.hash(x,y);s+=ellipse(x,y,1,9+n*6,3+n*3,n>.55?'#AEC68B':'#96B578');s+=line([[x-3,y,1],[x,y,5],[x+2,y,1]],'#819F66',.8);}
    // 石畳のテラスと、玄関から曲がって続く飛び石。
    for(let x=W-260;x<W-35;x+=32)for(let y=D-165;y<D-60;y+=30)s+=poly([[x,y,2],[x+30,y,2],[x+30,y+28,2],[x,y+28,2]],(x+y)%3?'#DDD1B5':'#C7C2AC',.7);
    for(let i=0;i<8;i++){const x=26+i*31,y=80+Math.sin(i*.65)*18+i*11;s+=poly([[x-10,y-9,3],[x+9,y-11,3],[x+15,y+2,3],[x+4,y+12,3],[x-12,y+7,3]],i%2?'#CFCCB8':'#E1D6BC',.8);}
    // 奥の白い板塀。手前は低い石積みで家族と家具が隠れない。
    for(const [side,L]of [[0,W],[1,D]]){
      const pt=(u,z)=>side?[0,u,z]:[u,0,z];
      for(const z of [20,43])s+=line([pt(0,z),pt(L,z)],'#C6BFA4',7);
      for(let u=4;u<L;u+=19)s+=poly([pt(u,0),pt(u+10,0),pt(u+10,55),pt(u+5,62),pt(u,55)],'#F0E9CF',.9);
      s+=line([pt(0,1),pt(L,1)],'#718D60',4);
    }
    // 家の裏口、庇、ステンドグラス、壁灯。室内と同じ木・漆喰の配色。
    s+=`<g transform="matrix(${-H.A} ${H.B} 0 1 0 -190)"><path d="M20 190V25H126V190" fill="#E9DDBB" stroke="#665A43" stroke-width="2"/><path d="M12 30L68 0 136 30Z" fill="#9BA895" stroke="#4F6254" stroke-width="3"/><path d="M23 30H124" stroke="#778D79" stroke-width="5"/><rect x="43" y="76" width="59" height="114" rx="4" fill="#A67F52" stroke="#6F5439" stroke-width="4"/><rect x="51" y="84" width="43" height="40" rx="3" fill="#BBD1C6" stroke="#E8D8AE" stroke-width="3"/><path d="M72 85V123M52 104H93M53 133H91V178H53Z" fill="none" stroke="#D9C294" stroke-width="2"/><circle cx="91" cy="143" r="3.5" fill="#E5BC66"/><path d="M29 80V99" stroke="#4B5547" stroke-width="3"/><rect x="23" y="81" width="12" height="17" rx="2" fill="#F6DD8D" stroke="#4B5547" stroke-width="2"/></g>`;
    // 花壇は境界に集め、歩く場所と家具を置く場所を空ける。
    const flower=(x,y,i)=>{s+=ellipse(x,y,1,10,4,'#739660');s+=line([[x,y,0],[x,y,14]],'#568553',1.5);const q=p(x,y,15);s+=flowerSvg(q.x,q.y,4.5,['#E9A7AB','#E9CA71','#BAAFD8','#F6E8C4'][i%4],'#F5D580',.8);};
    for(let x=145;x<W-24;x+=19)flower(x,14,Math.floor(x/19));
    for(let y=145;y<D-24;y+=19)flower(15,y,Math.floor(y/19));
    for(let x=12;x<W;x+=26)s+=poly([[x,D,0],[Math.min(W,x+24),D,0],[Math.min(W,x+24),D,9],[x,D,9]],'#C2BEA5',.7);
    for(let y=12;y<D;y+=26)s+=poly([[W,y,0],[W,Math.min(D,y+24),0],[W,Math.min(D,y+24),9],[W,y,9]],'#ACA991',.7);
    // 果樹は奥の角。鉢と枝、果実まで描き込む。
    for(const [x,y]of [[W-38,35],[32,D-42]]){
      s+=ellipse(x,y,1,24,10,'#809B66');s+=line([[x,y,2],[x,y,78]],'#82664B',8)+line([[x,y,53],[x-13,y,75]],'#82664B',4);
      for(const [dx,z,r]of [[-13,88,20],[13,92,24],[0,112,23]])s+=ellipse(x+dx,y,z,r,r*.88,'#6E9B68')+ellipse(x+dx-5,y,z+5,r*.62,r*.56,'#87AF79');
      for(const [dx,z]of [[-15,86],[10,109],[15,86]])s+=ellipse(x+dx,y,z,4,4,'#D7A968');
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">${s}</svg>`;
  }
};
