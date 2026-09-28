import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';
import {townMetrics,townFailures} from './town-metrics.mjs';
const R=gameContext(),m=new R.WorldMap('heiwadai'),d=m.def;
const ref=JSON.parse(readFileSync(new URL('../docs/design/towns/heiwadai/heiwadai-v02.json',import.meta.url),'utf8'));
assert.deepEqual([m.w,m.h],[64,68]);
const shape=o=>JSON.stringify([o.asset,o.x,o.y,o.opts||{}]);
assert.deepEqual(Array.from(d.buildings,shape),ref.buildings.map(shape));
assert.deepEqual(Array.from(d.objects.filter(o=>o.asset),shape),ref.props.map(shape));
assert.deepEqual(Array.from(d.decals,shape),ref.decals.map(shape));
assert.equal(JSON.stringify(d.overhead),JSON.stringify(ref.overhead));
for(const b of d.buildings)assert.deepEqual(Array.from(b.doors,dx=>dx+b.x),ref.buildings.find(r=>r.x===b.x&&r.y===b.y).door||[]);
const ids=new Set([...d.buildings,...d.objects,...d.npcs,...d.chests].map(o=>o.id));
for(const id of ['station','market','living','bread','diner','clock','fountain','cart','local','lane','swing','signal','bus','bikes','drink','track',...Array.from({length:10},(_,i)=>'house'+i)])assert(ids.has('heiwadai_'+id)||ids.has(d.idAliases['heiwadai_'+id]),'Missing legacy ID '+id);
assert.deepEqual(townFailures(townMetrics(m)),[]);
assert(!m.isSolid(...d.safeSpawn));assert(m.isSolid(27,11));
for(const b of d.buildings)if(b.act.type==='transit'){const p=R.Transit.arrival(b.act.stop);assert(!m.isSolid(p.x,p.y));}
for(const id of ['city','airport']){const incoming=R.MAP_DEFS[id].warps.find(w=>w.to==='heiwadai');assert(!m.isSolid(incoming.tx,incoming.ty));assert.equal(incoming.ty,66);}
const saved=R.Save.fresh();saved.coins=987654;saved.world={map:'heiwadai',x:27,y:11,dir:'down'};saved.flags.chests.heiwadai_lane=true;
const migrated=R.Save.migrate(saved);assert.equal(migrated.coins,987654);assert(migrated.flags.chests.heiwadai_lane);assert.equal(R.Save.KEY,'pokapoka-town-save-v1');assert.equal(R.Save.SCHEMA,1);
console.log('Heiwadai: exact placement / entrances / legacy IDs / routes / save compatibility OK');
