import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {BattleElements:B,SKILLS,ENEMIES,SONGS,Save,Stats}=gameContext();
const types=['fire','grass','rock','lightning','water'];
const matrix=[[1,1.5,1,1,.75],[.75,1,1.5,1,1],[1,.75,1,1.5,1],[1,1,.75,1,1.5],[1.5,1,1,.75,1]];
for(let a=0;a<5;a++) for(let d=0;d<5;d++) assert.equal(B.multiplier(types[a],[types[d]]),matrix[a][d]);
assert.equal(B.multiplier('water',['fire','lightning']),1);
assert.equal(B.multiplier(undefined,['fire']),1);
for(const element of types){
  const skills=Object.values(SKILLS).filter(s=>s.user&&s.element===element);
  assert(skills.length>=5,element+' needs five skills');
  assert.equal(new Set(skills.map(s=>s.name)).size,skills.length);
  for(const s of skills){assert(B.party[s.user].includes(element));assert(s.sp>=2&&s.sp<=12);assert(s.lv<=18&&s.power>0);}
  const unit={side:'ally',id:'goji',alive:true};
  assert(B.inflict(unit,element,1,0));
  assert(!B.inflict(unit,element,1,0),'cannot refresh a condition endlessly');
  let skips=0,ticks=0;
  while(unit.condition){const result=B.startTurn(unit,100,0);skips+=Number(result.skip);ticks+=result.damage;B.endTurn(unit);}
  assert(skips<=1);assert.equal(ticks,element==='fire'?12:0);
  assert(!B.inflict(unit,element,1,0),'recovery grace blocks immediate reapplication');
  B.endTurn(unit);B.endTurn(unit);assert(B.inflict(unit,element,1,0));
  B.clear(unit);assert.equal(B.startTurn(unit,100,0).damage,0);
  assert.equal(B.stat(unit,'def'),1);assert.equal(B.stat(unit,'atk'),1);assert.equal(B.stat(unit,'spd'),1);
  unit.guard=true;unit.conditionGrace=0;assert(!B.inflict(unit,element,1,0));
  unit.guard=false;unit.alive=false;assert(!B.inflict(unit,element,1,0));
}
const boss={alive:true,e:{boss:true}};
assert(!B.inflict(boss,'fire',1,.6));assert(B.inflict(boss,'fire',1,.4));assert.equal(B.startTurn(boss,1000).damage,12);
for(const [kind,e] of Object.entries(ENEMIES)){
  assert(B.types[B.enemies[kind]],kind+' missing element');
  assert(SKILLS[`e_${B.enemies[kind]}_touch`]);
  assert(SONGS[B.music([{kind,lv:e.lv}],false,20)]);
}
assert.equal(B.music([{kind:'king',lv:18}],false,50),'battle_crown');
assert.equal(B.music([{kind:'purun',lv:6}],false,1),'battle_elite');
assert.equal(B.music([{kind:'crab',lv:16}],false,50),'battle_elite');
assert.equal(B.music([{kind:'purun',lv:1},{kind:'akapurun',lv:8}],false,10),'battle_fire');
assert.equal(new Set(types.map(e=>JSON.stringify(SONGS['battle_'+e].tracks))).size,5);
// Existing saves gain the new unlocks without losing money, inventory or old skills.
const old=Save.fresh();old.coins=987654;old.bag.drink=37;old.chars.goji.lv=18;
Save.d=Save.migrate(JSON.parse(JSON.stringify(old)));
assert.equal(Save.d.coins,987654);assert.equal(Save.d.bag.drink,37);assert(Stats.skills('goji').includes('breath'));
assert(Stats.skills('goji').includes('fire_sun'));assert(Stats.skills('goji').includes('rock_mountain'));
assert.equal(Save.KEY,'pokapoka-town-save-v1');
console.log('Battle checks: 25 matchups, 25 new skills, conditions/recovery/boss limits, enemy music and save compatibility OK');
