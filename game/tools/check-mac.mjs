import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {MacKitchenRound:Round,MAP_DEFS,Save}=gameContext();
for(let level=1;level<=5;level++){
 const g=new Round(level,()=>.5);assert.equal(g.want.length,level+4);g.fry();g.tick(6);assert.equal(g.stage(),'gold');g.fry();assert.equal(g.fries.score,100);
 // 実際の落下・横移動・受け止め判定で順番通りに完成させる。
 g.falling=[];g.made=[];g.mistakes=0;g.spawnIn=999;for(const id of g.want){g.falling.push({id,n:0,x:.5,y:.9,v:1,vx:0});g.move(.5);g.tick(.11);}
 assert(g.complete());assert.equal(g.score(),100);g.undo();assert(!g.complete());assert(g.score()<100);
 const miss=new Round(level,()=>.5);miss.spawnIn=999;miss.falling=[{id:'bottom',x:.1,y:.99,v:1,vx:0}];miss.move(.9);miss.tick(.1);assert.equal(miss.made.length,0);
 const wrong=new Round(level,()=>.5);wrong.spawnIn=999;wrong.falling=[{id:'top',x:.5,y:.99,v:1,vx:0}];wrong.tick(.1);assert.equal(wrong.mistakes,1);assert(wrong.score()<30);
 for(const sec of [1,5,9,15]){const f=new Round(level);f.fry();f.tick(sec);f.fry();assert(f.fries.score<100);}
 const pause=new Round(level);pause.fry();const before=JSON.stringify(pause);assert.equal(JSON.stringify(pause),before);
}
assert.equal(MAP_DEFS.heiwadai.buildings.find(b=>b.id==='heiwadai_diner').act.variant,'mac');
const d=Save.fresh();d.coins=987654;d.shops.burger.rep=360;assert.equal(Save.migrate(d).coins,987654);assert.equal(d.shops.burger.rep,360);
console.log('Mac kitchen: five levels, falling catches/misses, order, fryer windows, retry and save compatibility OK');
