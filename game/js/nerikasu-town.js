// 駅で承認された原画と、同じ実寸の住宅・お店・学校。既存IDと施設の動作は保持。
const NerikasuTown={
  originals:null,
  install(){
    HeiwadaiArt.register({...NERIKASU_TOWN_ART,defs:HeiwadaiArt.defs});
    const d=MAP_DEFS.town;this.originals=JSON.parse(JSON.stringify(d));
    const grid=d.rows.map(row=>row.split(''));
    const station=d.buildings.find(b=>b.id==='town_station'),eastHome=d.buildings.find(b=>b.id==='nerikasu_home0');
    // 承認された14×5の駅舎を縮めない。駅東の一戸だけ敷地を東へ移す。
    for(const b of [station,eastHome])for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)grid[y][x]='.';
    Object.assign(station,{x:37,y:3,w:14,h:5,door:7,asset:'nerikasu.station'});
    Object.assign(eastHome,{x:53,y:4,w:6,h:5,door:3});
    for(const b of d.buildings){
      b.asset=b.asset||'nerikasu.bld_'+b.id;
      const art=NERIKASU_TOWN_ART.assets[b.asset];if(!art)throw Error('Missing Nerikasu building '+b.id);
      b.opts={};
      for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)grid[y][x]='#';
      grid[b.y+b.h-1][b.x+b.door]='D';
      for(let y=b.y+b.h;y<=b.y+b.h+2;y++)if(y<grid.length)grid[y][b.x+b.door]='=';
    }
    // 同じ足もとの範囲にある旧小物だけを除き、他の街区は動かさない。
    const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    const corridors=d.buildings.map(b=>({x:b.x+b.door,y:b.y+b.h,w:1,h:3}));
    const cleared=[{x:37,y:0,w:16,h:3},{x:37,y:8,w:16,h:2},{x:43,y:12,w:3,h:2}];
    d.objects=d.objects.filter(o=>o.id!=='town_railway'&&!cleared.some(b=>overlaps(o,b))&&!d.buildings.some(b=>overlaps(o,b))&&!corridors.some(b=>overlaps(o,b)));
    for(let y=0;y<3;y++)for(let x=37;x<53;x++)grid[y][x]='#';
    d.surfaces=d.surfaces.filter(s=>s.kind!=='railbed');d.surfaces.push({kind:'railbed',x:37,y:0,w:16,h:3});
    const add=(id,asset,x,y,{ground=false,solid=false,background=false,text}={})=>{
      const a=NERIKASU_TOWN_ART.assets['nerikasu.'+asset];
      const o={id:id==='train'?'town_railway':'nerikasu_art_'+id,asset:a.id,kind:'heiwadai_'+a.id.replaceAll('.','_'),x,y,w:a.w,h:a.h,opts:{},solid,background,text};
      if(ground){(d.decals||(d.decals=[])).push(o);return;}
      if(d.buildings.some(b=>overlaps(o,b))||corridors.some(b=>overlaps(o,b)))return;
      if(d.npcs.some(n=>overlaps(o,{...n,w:1,h:1})))return;
      d.objects=d.objects.filter(p=>p.asset?.startsWith('nerikasu.')||!overlaps(o,p));d.objects.push(o);
    };
    // 駅前：線路→ホーム→駅舎→歩行広場。通路は入口から横断歩道へ直結。
    for(let x=37;x<53;x+=4)add('track'+x,'track',x,1,{ground:true});
    add('train','train',37,0,{background:true});
    add('canopy','canopy',37,1,{solid:true});
    for(let x=37;x<52;x+=2)add('paving'+x,'paving',x,8,{ground:true});
    for(let y=8;y<10;y++)add('tactile'+y,'tactile_line',44,y,{ground:true});
    add('warning','tactile_warning',44,9,{ground:true});
    add('warning-south','tactile_warning',44,12,{ground:true});
    add('tactile-south','tactile_line',44,13,{ground:true});
    // 標識は入口横。地図・掲示板・ベンチは歩行広場の外縁にまとめる。
    add('totem','station-totem',40,8,{solid:true,text:'ネリカスえき。がっこうと ほいくえんは みなみだよ。'});
    add('map','walk-map',47,8,{solid:true,text:'えきの まえから、かわぞいの みちを みなみへ。がっこうと ほいくえんに つづくよ。'});
    add('station-flower','season-planter',50,8,{solid:true});
    add('station-lamp','lantern-twin',38,8,{solid:true});
    // 町の1マス設備は寸法を保ったまま同じ細密さへ。
    const replacements={postbox:'postbox',lamp:'lantern-twin',direction:'school-crossing'};
    for(const o of d.objects){if(!o.asset&&replacements[o.kind]&&o.w===1&&o.h===1){o.asset='nerikasu.'+replacements[o.kind];o.opts={};}}
    add('school-board','community-board',4,62,{solid:true,text:'がっこうだより。うんどうかいと おんがくかいの おしらせ。'});
    add('school-flowers','season-planter',23,62,{solid:true});
    add('nursery-bench','timber-bench',51,62,{solid:true,text:'ほいくえんの まえで ひとやすみ。ちいさな うたが きこえるね。'});
    add('nursery-flowers','season-planter',39,62,{solid:true});
    add('school-flag','school-crossing',26,64,{solid:true});
    // 新しい交差点だけに横断歩道を付ける。道路の幅・町の出口は元のまま。
    d.crosswalks.push({x0:43.7,x1:45.3,y0:10,y1:12,bars:'h'});
    d.rows=grid.map(row=>row.join(''));d.nerikasuArt=true;
    d.views.push([44,10],[6,10],[24,10],[15,63],[47,63]);
  },
  isAsset(it){return !!it.asset?.startsWith('nerikasu.');},
};
NerikasuTown.install();
// 既存のbbox描画経路を共用。キーは素材ID×昼夜の2状態だけ。
(() => {
  const canvas=HeiwadaiTown.canvas,draw=HeiwadaiTown.draw;
  HeiwadaiTown.canvas=function(scene,it,ensure){
    if(!NerikasuTown.isAsset(it))return canvas.call(this,scene,it,ensure);
    const a=NERIKASU_TOWN_ART.assets[it.asset],night=a.states.includes('night')&&DayTint.isNight();
    if(ensure)return Promise.all(a.states.map(state=>canvas.call(this,scene,{...it,opts:state==='night'?{night:true}:{}},true)));
    return canvas.call(this,scene,{...it,opts:night?{night:true}:{}},false);
  };
  HeiwadaiTown.draw=function(ctx,scene,it,ox,oy,bounds){
    if(it.asset!=='nerikasu.train')return draw.call(this,ctx,scene,it,ox,oy,bounds);
    // 本体の絵を動かすだけ。ホーム両端でクリップし、民家の上を走らせない。
    const phase=((G.t%48)+48)%48,x=phase<20?37:phase<30?37+((phase-20)/10)**2*18:phase<38?18:18+19*(1-(1-(phase-38)/10)**2);
    ctx.save();ctx.beginPath();ctx.rect(ox+37*TS,oy-16,16*TS,3*TS+16);ctx.clip();draw.call(this,ctx,scene,{...it,x},ox,oy,bounds);ctx.restore();
  };
})();
