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
  for(const b of old.buildings){const n=d.buildings.find(n=>n.id===b.id);assert(n,id+': lost building '+b.id);assert.equal(JSON.stringify(n.act),JSON.stringify(id==='city'&&R.IkebukuroDistrict.changed[b.id]?{type:'venue',venue:R.IkebukuroDistrict.changed[b.id]}:b.act),id+': changed shop/transit');}
  for(const o of old.objects.filter(o=>o.id))assert(d.objects.some(n=>n.id===o.id),id+': lost object '+o.id);
  for(const n of old.npcs)assert(d.npcs.some(a=>a.id===n.id),id+': lost NPC '+n.id);
  for(const c of old.chests){const n=d.chests.find(n=>n.id===c.id);assert(n,id+': lost chest');assert.deepEqual(n.loot,c.loot,id+': changed chest reward');}
  const objects=new Set();for(const o of d.objects){assert(!objects.has(o.id),id+': duplicate object '+o.id);objects.add(o.id);}
  for(const b of d.buildings){
    for(const o of d.objects)assert(!(o.x<b.x+b.w&&o.x+o.w>b.x&&o.y<b.y+b.h&&o.y+o.h>b.y),id+': object overlaps building '+o.id+' / '+b.id);
    assert.equal(d.rows[b.y+b.h-1][b.x+b.door],'D',id+': south entrance');
    assert(!m.isSolid(b.x+b.door,b.y+b.h),id+': blocked doorstep '+b.id);
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(y!==b.y+b.h-1||x!==b.x+b.door)assert(m.isSolid(x,y),id+': terrain erased building collision');
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
