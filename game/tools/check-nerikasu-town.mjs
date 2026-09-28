import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';
import {NERIKASU_ASSETS} from './town-design/nerikasu-assets.mjs';
import {NERIKASU_BUILDINGS} from './town-design/nerikasu-buildings.mjs';
const R=gameContext(),m=new R.WorldMap('town'),d=m.def,source=[...NERIKASU_ASSETS,...NERIKASU_BUILDINGS];
assert.equal(d.buildings.length,22);assert.equal(new Set(source.map(a=>a.id)).size,53);
for(const b of d.buildings){
  const a=source.find(a=>a.id===b.asset);assert(a,'No source artwork for '+b.id);
  assert.equal(b.w,a.w,b.id+' width is stretched');assert.equal(b.h,a.h,b.id+' height is stretched');
  if(a.door!=null)assert.equal(b.door,a.door,b.id+' visible door differs from entrance');
  assert(!m.isSolid(b.x+b.door,b.y+b.h),b.id+' entrance');
  for(const state of a.states){const opts=state==='night'?{night:true}:{};
    assert.equal(R.HeiwadaiArt.entry(a.id,opts).svg,a.draw(opts),a.id+' lost original details');
    const model=R.HeiwadaiArt.model(a.id,opts);assert.equal(model.originX,a.bbox[0]);assert.equal(model.originY,a.bbox[1]);
  }
}
const station=d.buildings.find(b=>b.id==='town_station');assert.equal(station.asset,'nerikasu.station');assert.deepEqual([station.w,station.h],[14,5]);
assert.equal(station.act.stop,'town_station');assert.equal(R.Transit.fare('town_station','city_station'),500);assert.equal(R.Transit.fare('city_station','town_station'),0);
assert(d.objects.some(o=>o.id==='town_railway'&&o.asset==='nerikasu.train'));
// 元の施設のID、機能、プレイヤー資産を保持。駅・駅東の家以外は足もとも変えない。
const original=R.NerikasuTown.originals;
for(const old of original.buildings){const b=d.buildings.find(b=>b.id===old.id);assert(b);assert.equal(JSON.stringify(b.act),JSON.stringify(old.act));if(!['town_station','nerikasu_home0'].includes(b.id))assert.equal(JSON.stringify([b.x,b.y,b.w,b.h,b.door]),JSON.stringify([old.x,old.y,old.w,old.h,old.door]));}
for(const id of ['home','clothes','furniture','crepe','dentist','florist','cake','bakery','market','nerikasu_school','nerikasu_nursery'])assert(d.buildings.some(b=>b.id===id));
const save=JSON.parse(readFileSync(new URL('../tests/fixtures/save-v1.json',import.meta.url),'utf8'));
const migrated=R.Save.migrate(JSON.parse(JSON.stringify(save)));assert.equal(migrated.coins,987654);
for(const key of ['bag','furn','wardrobe','room'])assert.equal(JSON.stringify(migrated[key]),JSON.stringify(save[key]),key);
for(const [id,progress]of Object.entries(save.shops))assert.equal(JSON.stringify(migrated.shops[id]),JSON.stringify(progress),id);
for(const [x,y]of [[47,6],[49,3],[53,9]]){const safe=R.TownRenewal.safePosition(m,x,y);assert(!m.isSolid(...safe));assert(m.publicTiles.seen.has(safe.join(',')));}
assert.equal(R.Save.KEY,'pokapoka-town-save-v1');assert.equal(R.Save.SCHEMA,1);
console.log('Nerikasu: 22 native-size buildings, original SVG day/night, existing entrances / transit / saves retained');
