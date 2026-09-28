// 平和台 v0.2。配置・絵は見本の自動生成データ、操作と永続IDだけここで接続する。
const HeiwadaiTown={
  install(){
    const src=HEIWADAI_LAYOUT_DATA.layout,old=MAP_DEFS.heiwadai;
    const names={'bld.station':'station','bld.supermarket':'market','bld.shop.furniture':'living','bld.shop.bakery':'bread','bld.shop.diner':'diner'};
    const d={name:'平和台（へいわだい）',bgm:'heiwadai',baseGround:'grass',heiwadai:true,safeSpawn:[27,19],festivalBoard:[23,19],
      rows:src.ascii.map(row=>[...row].map(c=>'#tXo'.includes(c)?'#':c==='D'?'D':'.').join('')),
      authoredGround:src.ground,authoredAscii:src.ascii,roads:src.roads,ring:src.ring,fillets:src.fillets,crosswalks:src.crosswalks,marks:src.marks,driveways:src.driveways,
      buildings:[],objects:[],npcs:[],signs:[],chests:[],warps:[],decals:src.decals,overhead:src.overhead,wires:src.wires,idAliases:{}};
    let homes=0;
    for(const [i,b]of src.buildings.entries()){
      const home=/^bld\.(house|apartment|mansion)/.test(b.asset);
      const id='heiwadai_'+(names[b.asset]||(home?'house'+homes++:'building_'+i));
      const previous=old.buildings.find(o=>o.id===id);
      let act=previous?.act||{type:'visit',text:b.name+'。\nまちの くらしを ながめて ひとやすみ。'};
      if(b.act?.includes(':')){const [type,shop]=b.act.split(':');act={type,shop};}
      if(b.act==='transit')act={type:'transit',stop:'heiwadai_station'};
      d.buildings.push({...b,id,label:previous?.label||b.name,door:b.door?b.door[0]-b.x:undefined,doors:(b.door||[]).map(x=>x-b.x),act});
    }
    // 旧版の住宅IDは同じ住宅群への別名として保持（絵の数を増やさない）。
    for(let i=homes;i<10;i++)d.idAliases['heiwadai_house'+i]='heiwadai_house'+(homes-1);
    const matches={'park.clock':'clock','park.fountain':'fountain','park.swing':'swing','prop.signal':'signal','prop.busstop':'bus','prop.bikerack':'bikes','prop.vending':'drink','rail.train':'track'};
    const assigned=new Set();
    for(const [i,p]of src.props.entries()){
      const suffix=matches[p.asset],legacy=suffix&&!assigned.has(suffix)&&!(suffix==='drink'&&p.y<9);if(legacy)assigned.add(suffix);
      const id='heiwadai_'+(legacy?suffix:'prop_'+i),prev=old.objects.find(o=>o.id===id);
      d.objects.push({...p,id,kind:'heiwadai_'+p.asset.replaceAll('.','_'),solid:false,text:prev?.text||null});
    }
    d.objects.push({id:'heiwadai_cart',kind:'flowercart',x:17,y:32,w:2,h:1,text:'おはなの ワゴン！ あまい かおりが するね。'});
    const haru=old.npcs.find(n=>n.id==='heiwadai_local');d.npcs.push({...haru,x:27,y:18});
    d.chests.push({...old.chests.find(c=>c.id==='heiwadai_lane'),x:34,y:58});
    for(const w of src.warps){
      const destination=MAP_DEFS[w.to].warps.find(v=>v.to==='heiwadai');
      const x=w.x+Math.floor(w.w/2);destination.tx=x;destination.ty=66;destination.dir='up';
      let tx=destination.x+Math.floor(destination.w/2),ty=destination.y+Math.floor(destination.h/2);
      if(tx===0)tx=1;else if(tx===MAP_DEFS[w.to].rows[0].length-1)tx--;
      if(ty===0)ty=1;else if(ty===MAP_DEFS[w.to].rows.length-1)ty--;
      d.warps.push({...w,tx,ty,dir:w.to==='city'?'down':'right'});
    }
    MAP_DEFS.heiwadai=d;
  },
  canvas(scene,it,ensure){return scene.objCanvas('heiwadai_'+it.asset.replaceAll('.','_'),it.opts||{},ensure);},
  draw(ctx,scene,it,ox,oy,bounds){
    const r=this.canvas(scene,it,false);if(!r)return;const {c,a}=r;
    const at=HeiwadaiLife.position(it);let x=ox+at.x*TS,y=oy+at.y*TS;
    if(x+a.originX+a.w<0||x+a.originX>(bounds?.w||G.W)||y+a.originY+a.h<0||y+a.originY>(bounds?.h||G.H))return;
    const flip=it.opts?.flip&&!['shrine.komainu','nat.pine'].includes(it.asset);
    ctx.save();ctx.translate(x,y);if(flip){ctx.translate(a.footW*TS,0);ctx.scale(-1,1);}
    if(it.asset==='prop.bunting')ctx.scale(1,HeiwadaiLife.state().flagScale);
    if(it.asset==='park.swing')HeiwadaiLife.drawSwing(ctx,scene.objectActive?.until>G.t&&scene.objectActive.id===it.id);
    else ctx.drawImage(c,a.originX-2,a.originY-2,a.w+4,a.h+4);
    HeiwadaiLife.effect(ctx,it,scene.objectActive?.until>G.t&&scene.objectActive.id===it.id);ctx.restore();
  },
  overhead(ctx,scene,ox,oy,bounds){
    if(!scene.map.def.heiwadai)return;
    const d=scene.map.def;
    for(const p of d.objects)if(p.over)this.draw(ctx,scene,p,ox,oy,bounds);
    for(const p of d.overhead)this.draw(ctx,scene,{...p,y:p.y-p.h},ox,oy,bounds);
    ctx.save();ctx.translate(ox,oy);ctx.strokeStyle='#34322F';ctx.lineWidth=.9;ctx.globalAlpha=.75;ctx.beginPath();
    for(const chain of d.wires)for(let i=0;i<chain.length-1;i++)for(const dy of [0,5]){
      const a=chain[i],b=chain[i+1],ax=a[0]*TS+16,ay=a[1]*TS-60+dy,bx=b[0]*TS+16,by=b[1]*TS-60+dy;
      ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2,(ay+by)/2+Math.hypot(bx-ax,by-ay)*.04+6,bx,by);
    }ctx.stroke();ctx.beginPath();ctx.lineWidth=.8;ctx.globalAlpha=.7;
    for(const dy of [7,12]){ctx.moveTo(0,dy);for(let x=3;x<scene.map.w+8;x+=8)ctx.quadraticCurveTo((x-4)*TS+16,dy+5,x*TS+16,dy);}
    ctx.stroke();ctx.restore();
  },
};
HeiwadaiTown.install();
