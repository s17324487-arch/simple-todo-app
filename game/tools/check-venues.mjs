import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();let count=0;
for(const [id,d]of Object.entries(R.VenueHalls.defs))for(const [level,room]of Object.entries(d.floors)){
 const sc=new R.SCENES.venue();sc.room=room;sc.fixtures=room.fixtures;const at=room.spawn||[Math.floor(room.w/2),room.h-3];sc.party=[{tx:at[0],ty:at[1]}];assert(sc.walkable(...at),id+': spawn');
 for(const f of room.fixtures){assert(f.x>=0&&f.y>=0&&f.x+f.w<=room.w&&f.y+f.h<=room.h,id+': fixture bounds '+f.label);if(!f.action)continue;let reached=false;for(let y=f.y-1;y<=f.y+f.h;y++)for(let x=f.x-1;x<=f.x+f.w;x++)if(sc.route(x,y)!==null)reached=true;assert(reached,id+'/'+level+': cannot reach '+f.label);count++;}
}
assert.equal(R.MAP_DEFS.town.rows.length,68);assert.equal(R.MAP_DEFS.town.rows[0].length,64);
for(const id of ['school','nursery'])assert(R.MAP_DEFS.town.buildings.some(b=>b.act.venue===id));
console.log('Venues: '+count+' reachable exhibits; school/nursery and residential neighborhood registered');
