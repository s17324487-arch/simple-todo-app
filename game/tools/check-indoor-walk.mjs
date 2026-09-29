import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {IndoorWalk:I,Game,G,Save,IsoVenue,SCENES}=gameContext();
const p=(x,y,id=1,tap=false)=>({x,y,id,tap});
const sc={path:[[3,4]],pending:{action:'buy'}};
I.down(sc,p(100,200));I.move(sc,p(105,203));
assert(!sc.joy);assert(sc.pending);assert(I.release(sc,p(105,203,1,true),false),'small tap');
I.down(sc,p(100,200));I.move(sc,p(160,200));assert.equal(I.direction(sc),'right');
assert.equal(sc.path.length,0);assert.equal(sc.pending,null);
I.down(sc,p(200,100,2));I.move(sc,p(200,170,2));I.release(sc,p(200,170,2),true);
assert.equal(I.direction(sc),'right','second finger must not take over');
I.move(sc,p(100,200));assert.equal(I.direction(sc),null,'dead zone');
assert(!I.release(sc,p(100,200,1,true),false),'returning drag must not activate a fixture');
for(const blocked of ['busy','interacting','closed','lift']){
  sc[blocked]=1;I.down(sc,p(100,200));assert(!sc.touch);sc[blocked]=false;
}
I.down(sc,p(100,200));I.move(sc,p(100,150));
assert(!I.release(sc,p(100,150),true));assert(!sc.joy);
I.down(sc,p(100,200));I.move(sc,p(100,150));Game.paused=true;
assert(!I.release(sc,p(100,150),false));assert(!sc.joy);Game.paused=false;
sc.iso=true;
for(const [key,x,y]of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){
  const v=IsoVenue.p(x,y),n=Math.hypot(v.x,v.y);
  I.down(sc,p(100,200));I.move(sc,p(100+v.x/n*60,200+v.y/n*60));
  assert.equal(I.direction(sc),key,'projected '+key);I.cancel(sc);
}
G.keys={left:true};assert.equal(I.direction(sc),'left','keyboard retained');G.keys={};
// Moving floors discards a held stick rather than carrying it to the next room.
const venue=new SCENES.venue();venue.def={floors:{1:{w:20,h:20,fixtures:[]}}};
venue.snap=()=>{};venue.joy={x:20,y:30};venue.touch={id:1};
Save.d=Save.fresh();venue.loadFloor(1);
assert(!venue.joy&&!venue.touch,'floor change clears input');assert.equal(venue.party.length,3);
console.log('Indoor input: tap/drag, dead zone, second finger, cancellation, locks, four isometric axes, keyboard OK');
