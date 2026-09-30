import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
import {townMetrics,townFailures} from './town-metrics.mjs';
const R=gameContext();let rescued=0;
for(const id of R.TownRenewal.ids){
  const m=new R.WorldMap(id),d=m.def,old=R.TownRenewal.originals[id],metrics=townMetrics(m);
  assert.deepEqual(townFailures(metrics),[],id+': density / road audit');assert.equal(metrics.blind.length,0,id+': empty phone viewport');
  const styles=[...new Set(d.buildings.map(b=>b.style))];
  assert(styles.filter(s=>s.startsWith(id+'_')).length>=2,id+': exclusive buildings');
  const pictures=styles.map(style=>R.Art.worldSvg('building',{style,w:6,h:4,door:3}).full);
  assert.equal(new Set(pictures).size,styles.length,id+': renamed identical building art');
  assert(new Set(d.objects.filter(o=>R.TownRenewalArt.exclusive(id).includes(o.kind)).map(o=>o.kind)).size>=6,id+': exclusive props');
  for(const b of old.buildings){const n=d.buildings.find(n=>n.id===b.id);if(!n&&id==='town'&&R.NerikasuLayout.REMOVED[b.id])continue; // オーナーが「なくても よい」と した 建物（js/nerikasu-layout.js）
    assert(n,id+': lost building '+b.id);
    // 池袋で いけぶの 中へ つながって いた 建物は ひとこと・ちかみちに かえた（js/ikebukuro-town.js の NOT_MALL）。下で くわしく しらべる
    const notMall=id==='city'&&R.IkebukuroTown.NOT_MALL[b.id];
    if(notMall)assert.equal(JSON.stringify([n.act.type,n.act.text]),JSON.stringify([notMall.type,notMall.text]),id+': not-mall entrance '+b.id);
    else assert.equal(JSON.stringify(n.act),JSON.stringify(id==='city'&&R.IkebukuroDistrict.changed[b.id]?{type:'venue',venue:R.IkebukuroDistrict.changed[b.id]}:b.act),id+': changed shop/transit');}
  if(id==='city'){
    // サンシャインいけぶに 入れるのは いけぶの 入口（ike_mall の 2つ）だけ。ほかの 入口は ひとこと（visit）か、いけぶの 入口の まえに でる ちかみち（walkway）
    const mall=d.buildings.filter(b=>b.act?.type==='venue'&&b.act.venue==='mall');
    assert.equal(JSON.stringify(mall.map(b=>b.id)),'["ike_mall"]','city: only the Sunshine Ikebu entrances lead into the mall');
    const mallDoors=m.doors.filter(o=>o.b.act?.type==='venue'&&o.b.act.venue==='mall');
    assert.equal(JSON.stringify(mallDoors.map(o=>o.b.id+'@'+o.x+','+o.y).sort()),JSON.stringify(mall[0].doors.map(dx=>'ike_mall@'+(mall[0].x+dx)+','+(mall[0].y+mall[0].h-1)).sort()),'city: mall doors');
    const kanji=/[\u4E00-\u9FFF]/,front=[mall[0].x+mall[0].door,mall[0].y+mall[0].h];
    for(const [bid,a] of Object.entries(R.IkebukuroTown.NOT_MALL)){
      const b=d.buildings.find(b=>b.id===bid);assert(b,'city: not-mall building '+bid);
      assert(['visit','walkway'].includes(b.act.type)&&b.act.text&&!kanji.test(b.act.text),'city: not-mall entrance text '+bid);
      // 375×667 の ふきだしは 1ぎょう 20もじ くらい: ことばの とちゅうで おりかえさない ように 19もじ まで
      assert(b.act.text.split('\n').every(l=>[...l].length<=19),'city: not-mall entrance line too long '+bid);
      if(b.act.type==='walkway'){const t=b.act.to;assert.equal(JSON.stringify([t.map,t.x,t.y]),JSON.stringify(['city',...front]),'city: walkway must end at the mall entrance '+bid);
        assert(!m.isSolid(t.x,t.y)&&!m.doorAt(t.x,t.y)&&!m.warpAt(t.x,t.y),'city: walkway exit blocked '+bid);}
    }
  }
  for(const o of old.objects.filter(o=>o.id))assert(d.objects.some(n=>n.id===o.id),id+': lost object '+o.id);
  for(const n of old.npcs)assert(d.npcs.some(a=>a.id===n.id),id+': lost NPC '+n.id);
  for(const c of old.chests){const n=d.chests.find(n=>n.id===c.id);assert(n,id+': lost chest');assert.deepEqual(n.loot,c.loot,id+': changed chest reward');}
  const objects=new Set();for(const o of d.objects){assert(!objects.has(o.id),id+': duplicate object '+o.id);objects.add(o.id);}
  for(const b of d.buildings){
    for(const o of d.objects)assert(!(o.x<b.x+b.w&&o.x+o.w>b.x&&o.y<b.y+b.h&&o.y+o.h>b.y),id+': object overlaps building '+o.id+' / '+b.id);
    // 入口が 2つ ある 建物（b.doors）は それぞれの 入口を しらべる
    const doors=b.doors||[b.door];assert(doors.includes(b.door),id+': main entrance '+b.id);
    for(const dx of doors){assert.equal(d.rows[b.y+b.h-1][b.x+dx],'D',id+': south entrance');assert(!m.isSolid(b.x+dx,b.y+b.h),id+': blocked doorstep '+b.id);}
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(y!==b.y+b.h-1||!doors.includes(x-b.x))assert(m.isSolid(x,y),id+': terrain erased building collision');
  }
  const previous=new R.WorldMap('old-'+id,old);
  // 旧マップの全ての歩けた座標を新マップへ。救済はコイン等に一切触れない。
  const data=R.Save.fresh();data.coins=987654;data.world={map:id,x:1,y:1,dir:'down'};R.Save.d=data;
  const before=JSON.stringify(data);
  for(let y=0;y<previous.h;y++)for(let x=0;x<previous.w;x++)if(!previous.isSolid(x,y)){
    const p=R.TownRenewal.safePosition(m,x,y);assert(!m.isSolid(...p)&&!m.warpAt(...p)&&!m.doorAt(...p),id+': stranded old save');
    assert(!d.npcs.some(n=>n.x===p[0]&&n.y===p[1]),id+': rescue overlaps NPC');
    assert(m.publicTiles.seen.has(p.join(',')),id+': isolated rescue');if(p[0]!==x||p[1]!==y)rescued++;
  }
  assert.equal(JSON.stringify(R.Save.d),before,id+': rescue mutated persistent data');
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(!m.isSolid(x,y))assert(m.publicTiles.seen.has(x+','+y),id+': isolated walkable tile '+x+','+y);
  assert.equal(R.Save.migrate(JSON.parse(before)).coins,987654,id+': migration lost money');
}
const port=new R.WorldMap('harbor');
for(const y of [11,25,35]){assert.equal(port.groundAt(30,y),'bridge','pier must cross sea');assert.equal(port.groundAt(30,y-3),'water','sea beside pier');assert(!port.isSolid(30,y),'pier lane blocked');}
const air=new R.WorldMap('airport');assert(air.isSolid(20,5),'runway must be closed');assert(!air.isSolid(50,11),'observation deck must open');
assert.notDeepEqual(R.TownRenewal.motion('airport',0),R.TownRenewal.motion('airport',30));
assert.equal(R.Save.KEY,'pokapoka-town-save-v1');assert.equal(R.Save.SCHEMA,1);
console.log(`Town audit / entrances / old IDs / old save positions: OK (${rescued} positions rescued; 987654 coins preserved)`);
