import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();R.Save.d=R.Save.fresh();R.Save.d.coins=987654;
const before=JSON.stringify(R.Save.d),original=JSON.stringify(R.MAP_DEFS);
let seed=81231;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
R.U.rand=(a,b)=>a+rand()*(b-a);R.U.randi=(a,b)=>Math.floor(a+rand()*(b-a+1));R.U.pick=a=>a[Math.floor(rand()*a.length)];
let moved=0,actors=0;const seen=new Set();
for(const [id,def] of Object.entries(R.MAP_DEFS)){
  const sc=new R.WorldScene();sc.mapId=id;sc.map=new R.WorldMap(id);sc.rocks=[];sc.enemies=[];sc.party=[new R.Walker(-100,-100,'down')];
  sc.npcs=(def.npcs||[]).map(n=>({...n,w:new R.Walker(n.x,n.y,n.dir)}));actors+=sc.npcs.length;
  const walked=new Set();
  for(let i=0;i<1800;i++){
    R.NpcLife.update(sc,0.1);
    const occupied=new Set();
    for(const n of sc.npcs){
      const k=n.w.tx+','+n.w.ty;assert(!occupied.has(k),id+' NPC overlap '+n.id);occupied.add(k);
      if(n.life.action)seen.add(n.life.action);
      if(n.w.tx!==n.x||n.w.ty!==n.y)walked.add(n.id);
      if(n.w.moving){assert(R.NpcLife.safeTile(sc,n.w.tx,n.w.ty),id+' unsafe destination');const b=n.life.bounds;assert(n.w.tx>=b[0]&&n.w.tx<=b[2]&&n.w.ty>=b[1]&&n.w.ty<=b[3]);}
      if(def.indoor||(n.artOffset&&!n.wander))assert(n.w.tx===n.x&&n.w.ty===n.y,'Fixed person left post');
    }
  }
  moved+=walked.size;
  if(sc.npcs.length){
    const n=sc.npcs[0];n.w.update(1);sc.pending={npc:n};const pos=[n.w.tx,n.w.ty];for(let i=0;i<200;i++)R.NpcLife.update(sc,0.1);
    assert.deepEqual([n.w.tx,n.w.ty],pos,'Tapped NPC ran away');
    sc.pending=null;R.Game.paused=true;const frozen=sc.npcs.map(n=>[n.w.tx,n.w.ty]);for(let i=0;i<100;i++)R.NpcLife.update(sc,0.1);
    assert.equal(JSON.stringify(sc.npcs.map(n=>[n.w.tx,n.w.ty])),JSON.stringify(frozen),'NPC walks during menu');R.Game.paused=false;
  }
}
assert(moved>=40,'Too few outdoor residents walk: '+moved);assert.equal(seen.size,10);
for(const sp of Object.keys(R.NpcArt.SP))for(const action of Object.keys(R.NpcLife.actions)){
  const n=R.NpcLife.stationaryActor({sp});R.NpcLife.start(n,action);
  for(const t of [0.3,0.7]){n.life.elapsed=t;const v=R.NpcLife.visual(n);for(const dir of ['down','left','right','up']){const svg=R.Art.npcSvg({sp,dir,...v});assert(!/NaN|undefined/.test(svg),sp+' '+action);}}
}
const keeper=R.NpcLife.stationaryActor({sp:'cat'});for(let i=0;i<600;i++)R.NpcLife.updateStationary(keeper,0.1);assert.equal(keeper.w.tx,0);assert.equal(keeper.w.ty,0);
assert.equal(JSON.stringify(R.Save.d),before,'Animation changed saved assets');assert.equal(JSON.stringify(R.MAP_DEFS),original,'Runtime motion mutated map definitions');
console.log(`NPC life: ${actors} residents, ${moved} walking residents, 10 actions / 35 species / 4 views; stationary posts, tap lock, menu pause and saves retained`);
