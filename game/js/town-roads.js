// TOWN-01: render.mjs の道を Canvas 2D へ移植。単位はマス、Path2D は論理32px。
// コンパイルは定義ごとに1回。道路データのないマップには何もしない。
const TownRoads = (() => {
  const compiled = new WeakMap(), textures = new Map();
  const f = n => +(+n).toFixed(1), X = n => f(n * 32), WHITE = "#F7F7F2";
  const hash = (x,y) => { let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296; };
  function sample(rd) {
    const pts=[];
    for(const q of rd.pieces) {
      if(q.t === "seg") {
        const dx=q.b[0]-q.a[0],dy=q.b[1]-q.a[1],len=Math.hypot(dx,dy);
        if(!len)continue;
        const t=[dx/len,dy/len],n=Math.max(1,Math.ceil(len/.5));
        for(let i=0;i<=n;i++)pts.push({p:[q.a[0]+dx*i/n,q.a[1]+dy*i/n],t});
      } else {
        const n=Math.max(2,Math.ceil(Math.abs(q.a1-q.a0)/(Math.PI/120))),s=Math.sign(q.a1-q.a0);
        for(let i=0;i<=n;i++){const a=q.a0+(q.a1-q.a0)*i/n;pts.push({p:[q.c[0]+q.r*Math.cos(a),q.c[1]+q.r*Math.sin(a)],t:[-Math.sin(a)*s,Math.cos(a)*s]});}
      }
    }
    const out=pts.filter((o,i)=>i===0||Math.hypot(o.p[0]-pts[i-1].p[0],o.p[1]-pts[i-1].p[1])>1e-6);
    let s=0;out.forEach((o,i)=>{if(i)s+=Math.hypot(o.p[0]-out[i-1].p[0],o.p[1]-out[i-1].p[1]);o.s=s;});
    return out;
  }
  const off=(o,d)=>[o.p[0]-o.t[1]*d,o.p[1]+o.t[0]*d];
  const path=pts=>pts.length?"M"+pts.map(([x,y])=>`${X(x)},${X(y)}`).join(" L"):"";
  function band(sm,d,ext=0){let s=sm;if(ext&&sm.length){const o=sm[0];s=[{p:[o.p[0]-o.t[0]*ext,o.p[1]-o.t[1]*ext],t:o.t},...sm];}return path([...s.map(o=>off(o,d)),...s.slice().reverse().map(o=>off(o,-d))])+" Z";}
  const line=(sm,d,s0=-1e9,s1=1e9)=>path(sm.filter(o=>o.s>=s0-1e-6&&o.s<=s1+1e-6).map(o=>off(o,d)));
  const rr=(x0,y0,x1,y1,r)=>`M${X(x0+r)},${X(y0)} H${X(x1-r)} A${X(r)},${X(r)} 0 0 1 ${X(x1)},${X(y0+r)} V${X(y1-r)} A${X(r)},${X(r)} 0 0 1 ${X(x1-r)},${X(y1)} H${X(x0+r)} A${X(r)},${X(r)} 0 0 1 ${X(x0)},${X(y1-r)} V${X(y0+r)} A${X(r)},${X(r)} 0 0 1 ${X(x0+r)},${X(y0)} Z`;
  const ringBox=(r,d)=>rr(r.x0-d,r.y0-d,r.x1+d,r.y1+d,Math.max(.2,r.r+d));
  function drivewayPolygon(d,roads){
    if(d.kind==="rect")return [[d.x0,d.y0],[d.x1,d.y0],[d.x1,d.y1],[d.x0,d.y1]];
    const rd=roads.find(r=>r.id===(d.road||"avenue")),arc=rd?.pieces.find(q=>q.t==="arc");
    if(!arc)throw new Error("driveway needs road arc: "+(d.road||"avenue"));
    if(d.kind==="arc"||d.kind==="arcO"){
      const sg=d.kind==="arc"?-1:1,pt=(r,a)=>[arc.c[0]+r*Math.cos(a),arc.c[1]+r*Math.sin(a)];
      const inner=arc.r+sg*rd.carriage/2,outer=arc.r+sg*(rd.carriage/2+(rd.side||0)+.02);
      return [pt(inner,d.a0),pt(outer,d.a0),pt(outer,d.a1),pt(inner,d.a1)];
    }
    const seg=rd.pieces[rd.pieces.indexOf(arc)+1];
    if(!seg||seg.t!=="seg")throw new Error("diagonal driveway needs segment after arc");
    const dx=seg.b[0]-seg.a[0],dy=seg.b[1]-seg.a[1],len=Math.hypot(dx,dy),u=[dx/len,dy/len],sg=d.kind==="diagSW"?1:-1,n=[-u[1]*sg,u[0]*sg];
    const o=(t,k)=>[seg.a[0]+u[0]*t+n[0]*k,seg.a[1]+u[1]*t+n[1]*k],a=rd.carriage/2,b=a+(rd.side||0)+.02;
    return [o(d.t0,a),o(d.t0,b),o(d.t1,b),o(d.t1,a)];
  }

  function compile(def) {
    if(compiled.has(def))return compiled.get(def);
    const commands=[],rs=(def.roads||[]).map(r=>({side:0,...r,sm:sample(r)}));
    const add=(d,fill,stroke,width=1,extra={})=>{if(!d||d===" Z")return;const cmd={p:new Path2D(d),fill,stroke,width,...extra};commands.push(cmd);return cmd;};
    const rect=(x,y,w,h,fill,extra={})=>add(`M${f(x)},${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z`,fill,null,1,extra);
    const stroke=(d,c,w,extra={})=>add(d,null,c,w,extra);
    const ln=(a,b,c,w)=>stroke(path([a,b]),c,w,{cap:"round"});
    const curb=d=>stroke(d,"#DCD6CA",5.8);
    // 歩道 → 縁石 → 車道。交差点の口は後の車道で縁石を覆う。
    for(const r of rs)add(band(r.sm,r.carriage/2+r.side),"p-paver");
    for(const r of rs)for(const sg of [1,-1]){curb(line(r.sm,sg*(r.carriage/2+.09)));stroke(line(r.sm,sg*(r.carriage/2+.2)),"#B3AC9F",.9);}
    const ring=def.ring,hw=ring?ring.w/2:0;
    if(ring){curb(ringBox(ring,hw+.09));stroke(ringBox(ring,hw+.2),"#B3AC9F",.9);}
    for(const r of rs)add(band(r.sm,r.carriage/2,r.extendStart||0),"p-asphalt");
    if(ring){
      add(ringBox(ring,hw)+ringBox(ring,-hw),"p-asphalt",null,1,{rule:"evenodd"});
      add(ringBox(ring,-hw),"p-lawn");
      curb(ringBox(ring,-hw-.09));stroke(ringBox(ring,-hw-.2),"#B3AC9F",.9);
    }
    for(const q of def.fillets||[]){
      const [ax,ay]=q.at,{sx,sy,r}=q,cx=ax+sx*r,cy=ay+sy*r,sweep=sx*sy>0?0:1;
      add(`M${X(ax)},${X(ay)} L${X(ax+sx*r)},${X(ay)} A${X(r)},${X(r)} 0 0 ${sweep} ${X(ax)},${X(ay+sy*r)} Z`,"p-asphalt");
      const r2=r-.09;curb(`M${X(cx)},${X(cy-sy*r2)} A${X(r2)},${X(r2)} 0 0 ${sweep} ${X(cx-sx*r2)},${X(cy)}`);
    }
    // JSONの arc/arcO/diag/diagSW は指定道路（省略時 avenue）の円弧・次の直線を使う。
    for(const d of def.driveways||[]){
      if(d.kind==="rect"){
        rect(X(d.x0),X(d.y0),X(d.x1-d.x0),X(d.y1-d.y0),"p-concrete");
        stroke(`M${X(d.x0)+1.5},${X(d.y0)} V${X(d.y1)}`,"#E9E5DD",3,{cap:"round"});
        ln([d.x0,d.y0],[d.x1,d.y0],"#B8B1A4",.8);ln([d.x0,d.y1],[d.x1,d.y1],"#B8B1A4",.8);continue;
      }
      const q=drivewayPolygon(d,rs);
      add(path(q)+" Z","p-concrete");stroke(path([q[0],q[3]]),"#E9E5DD",4);
      stroke(path([q[0],q[1]])+path([q[2],q[3]]),"#B8B1A4",.8);
    }
    // 中央線・外側線は中心線に沿った距離。交差点の区間はデータで空ける。
    for(const r of rs){
      for(const c of r.center||[])stroke(line(r.sm,0,c.from,c.to),"#F2C14E",4);
      for(const sg of [1,-1])for(const e of r.edges||[])stroke(line(r.sm,sg*(r.carriage/2-.38),e.from,e.to),WHITE,2.4,{alpha:.9});
    }
    for(const cw of def.crosswalks||[]){
      const bar=.28,gap=.28,vertical=cw.bars==="v",span=vertical?cw.x1-cw.x0:cw.y1-cw.y0;
      const n=Math.floor((span+gap)/(bar+gap)),used=n*bar+(n-1)*gap,start=(vertical?cw.x0:cw.y0)+(span-used)/2;
      for(let i=0;i<n;i++)rect(X(vertical?start+i*(bar+gap):cw.x0),X(vertical?cw.y0:start+i*(bar+gap)),X(vertical?bar:cw.x1-cw.x0),X(vertical?cw.y1-cw.y0:bar),WHITE,{alpha:.95});
      for(let i=0;i<10;i++)rect(X(cw.x0+hash(i,cw.x0*7)*(cw.x1-cw.x0)),X(cw.y0+hash(i,cw.y0*5)*(cw.y1-cw.y0)),3,1.4,"#9AA0A6",{alpha:.55});
    }
    const ROT={n:0,e:90,s:180,w:-90};
    const text=(x,y,t,size,extra={})=>commands.push({text:t,x,y,size,...extra});
    for(const m of def.marks||[]){
      if(m.k==="stop")rect(X(m.x0),X(m.y)-3.5,X(m.x1-m.x0),7,WHITE);
      if(m.k==="stopv")rect(X(m.x)-3.5,X(m.y0),7,X(m.y1-m.y0),WHITE);
      if(m.k==="diamond")stroke(path([[m.x,m.y-.8],[m.x+.3,m.y],[m.x,m.y+.8],[m.x-.3,m.y]])+" Z",WHITE,3,{join:"miter"});
      if(m.k==="text")text(X(m.x),X(m.y),m.t,(m.size||.55)*32,{rot:m.rot||0,sx:1,sy:2});
      if(m.k==="bay"){
        rect(X(m.x0),X(m.y0),X(m.x1-m.x0),X(m.y1-m.y0),null,{stroke:m.c||WHITE,width:2.2,dash:[8,5],alpha:.9,join:"miter"});
        if(m.label)text(X(m.x1)-18,X(m.y1)-3,m.label,7,{color:m.c||WHITE});
      }
      const xf={x:X(m.x),y:X(m.y),rot:ROT[m.dir],sx:.9,sy:1.25,alpha:.95};
      if(m.k==="arrow"){
        if(m.turn!=="lr"){stroke("M0,34 V-14",WHITE,5,xf);add("M-9,-12 L0,-34 L9,-12 Z",WHITE,null,1,xf);}
        for(const sg of m.turn==="lr"?[-1,1]:m.turn==="l"?[-1]:m.turn==="r"?[1]:[]){
          stroke(`M0,${m.turn==="lr"?34:18} V0 Q0,-8 ${sg*10},-8 H${sg*14}`,WHITE,5,xf);
          add(`M${sg*12},-16 L${sg*26},-8 L${sg*12},0 Z`,WHITE,null,1,xf);
          if(m.turn==="lr"&&sg===1)stroke("M0,34 V0",WHITE,5,xf);
        }
      }
      if(m.k==="ringArrow"){
        const tr={...xf,sx:.8,sy:.8,alpha:.9};stroke("M0,24 V-8",WHITE,5,tr);add("M-9,-6 L0,-26 L9,-6 Z",WHITE,null,1,tr);
      }
    }
    const result={commands};compiled.set(def,result);return result;
  }
  function enabled(def){return !!(def.roads?.length||def.ring);}
  let ready;
  function preload(def){
    if(!enabled(def))return Promise.resolve();
    if(!ready)ready=Promise.all(Object.entries(ROAD_PATTERNS).map(async([id,p])=>{
      const canvas=await SvgCache.ensure("town-road:"+id,()=>`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">${p.svg}</svg>`,p.w*4,p.h*4);
      if(!canvas)throw new Error("road pattern failed: "+id);
      textures.set(id,canvas);
    })).catch(e=>{ready=null;throw e;});
    return ready;
  }
  function draw(ctx,def){
    if(!enabled(def))return;
    if(textures.size!==Object.keys(ROAD_PATTERNS).length)return false;
    const pats={};for(const [id,c]of textures){pats[id]=ctx.createPattern(c,"repeat");pats[id].setTransform(new DOMMatrix().scale(.25));}
    for(const c of compile(def).commands){
      ctx.save();ctx.globalAlpha=c.alpha??1;
      if(c.x!=null){ctx.translate(c.x,c.y);ctx.rotate((c.rot||0)*Math.PI/180);ctx.scale(c.sx||1,c.sy||1);}
      if(c.text!=null){ctx.fillStyle=c.color||WHITE;ctx.font=`800 ${c.size}px 'Noto Sans CJK JP','Noto Sans JP',sans-serif`;ctx.textAlign="center";ctx.fillText(c.text,0,0);}
      else{
        if(c.fill){ctx.fillStyle=pats[c.fill]||c.fill;ctx.fill(c.p,c.rule||"nonzero");}
        if(c.stroke){ctx.strokeStyle=c.stroke;ctx.lineWidth=c.width;ctx.lineJoin=c.join||"round";ctx.lineCap=c.cap||"butt";ctx.setLineDash(c.dash||[]);ctx.stroke(c.p);}
      }ctx.restore();
    }
    return true;
  }
  // 衝突判定はマスの中心。以後の建物/小物/入口の判定は WorldMap が従来どおり重ねる。
  function grid(def,w,h){
    if(!enabled(def))return null;
    // Canvasに依存しないので check/audit でも同じマスを検査できる。
    const roads=def.roads||[],drive=(def.driveways||[]).map(d=>drivewayPolygon(d,roads));
    function distance(r,p,extend=false){
      return Math.min(...r.pieces.map((q,i)=>{
        if(q.t==="seg"){
          const dx=q.b[0]-q.a[0],dy=q.b[1]-q.a[1],len=Math.hypot(dx,dy);if(!len)return Infinity;
          const t=((p[0]-q.a[0])*dx+(p[1]-q.a[1])*dy)/len;
          return t<-(extend&&i===0?r.extendStart||0:0)-1e-9||t>len+1e-9?Infinity:Math.abs((p[0]-q.a[0])*dy-(p[1]-q.a[1])*dx)/len;
        }
        const turn=Math.PI*2,a=Math.atan2(p[1]-q.c[1],p[0]-q.c[0]),s=Math.sign(q.a1-q.a0),d=((a-q.a0)*s%turn+turn)%turn;
        return d>Math.abs(q.a1-q.a0)+1e-9?Infinity:Math.abs(Math.hypot(p[0]-q.c[0],p[1]-q.c[1])-q.r);
      }));
    }
    function inside(poly,p){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
    }return yes;}
    return Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>{
      const p=[x+.5,y+.5];let kind=null;
      for(const r of roads)if(distance(r,p)<=r.carriage/2+(r.side||0))kind="sidewalk";
      for(const r of roads)if(distance(r,p,true)<=r.carriage/2)kind="road";
      const r=def.ring;if(r){const qx=Math.abs(p[0]-(r.x0+r.x1)/2)-((r.x1-r.x0)/2-r.r),qy=Math.abs(p[1]-(r.y0+r.y1)/2)-((r.y1-r.y0)/2-r.r),sd=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r.r;if(Math.abs(sd)<=r.w/2)kind="road";else if(sd<-r.w/2)kind="island";}
      for(const q of def.fillets||[]){const a=(p[0]-q.at[0])*q.sx,b=(p[1]-q.at[1])*q.sy;if(a>=0&&b>=0&&a<=q.r&&b<=q.r&&Math.hypot(a-q.r,b-q.r)>=q.r)kind="road";}
      if(drive.some(poly=>inside(poly,p)))kind="driveway";return kind;
    }));
  }
  return {enabled,preload,draw,grid};
})();
