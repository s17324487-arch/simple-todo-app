import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';

const {ItemDex:D,Save,FURNITURE,WEAR_ITEMS,localStorage,PuzzleArcade,PUZZLE_PRIZES}=gameContext();
const copy=value=>JSON.parse(JSON.stringify(value));
const catalogs={furn:FURNITURE,wear:WEAR_ITEMS};
const assets=['coins','bag','furn','wardrobe','room','rooms','chars','shops','flags','stats'];
const keepAssets=(before,after,keys=assets)=>{
  for(const key of keys)assert.deepEqual(copy(after[key]),copy(before[key]),'encyclopedia changed '+key);
};
const empty=()=>{
  const d=Save.fresh();d.coins=987654;d.furn={};d.wardrobe={};d.room.items=[];d.rooms.stored={};
  for(const c of Object.values(d.chars))for(const slot of Object.keys(c.outfit))c.outfit[slot]=null;
  Save.d=d;return d;
};
const entry=(kind,id,d=Save.d)=>D.entries(kind,d).find(row=>row.id===id);
const saved=()=>Save.migrate(JSON.parse(localStorage.getItem(Save.KEY)));

assert.equal(Save.KEY,'pokapoka-town-save-v1');
assert.equal(Save.SCHEMA,1,'additive collection data must keep v1 saves compatible');
assert.deepEqual(copy(Save.fresh().itemDex),{furn:{},wear:{},claimed:{furn:{},wear:{}}});

// The whole runtime catalog is the source of truth, including later prize scripts.
for(const [kind,items] of Object.entries(catalogs)){
  const ids=[...new Set(items.map(item=>item.id))];
  assert.deepEqual([...D.catalog(kind).map(item=>item.id)].sort(),ids.sort(),kind+' catalog omitted items');
  assert(items.some(item=>item.rare),kind+' rare coverage missing');
  empty();assert.equal(D.progress(kind).total,ids.length);
  for(const item of items.filter(item=>item.rare))assert(entry(kind,item.id),kind+' rare omitted: '+item.id);
  items.push(items[0]);
  try{assert.equal(D.catalog(kind).length,ids.length,'duplicate catalog IDs inflate total');}
  finally{items.pop();}
  const added={...items[0],id:'dex_check_late_'+kind,name:'あとから ふえた もの'};
  items.push(added);
  try{
    assert(D.catalog(kind).some(item=>item.id===added.id),'catalog cached before all scripts loaded');
    assert.equal(D.progress(kind).total,ids.length+1);
    Save.d[kind==='furn'?'furn':'wardrobe'][added.id]=kind==='furn'?1:true;
    Save.write();assert(entry(kind,added.id).seen,'late acquisition missing from collection');
  }finally{items.pop();}
}
for(const property of ['quizPrize','shopPrize','puzzlePrize','player']){
  const items=FURNITURE.filter(item=>item[property]);assert(items.length>0,'missing '+property+' test fixtures');
  for(const item of items)assert(D.catalog('furn').some(row=>row.id===item.id&&row.rare),property+' prize omitted: '+item.id);
}

// A real v1.0.0 fixture retains every old value; inspecting the collection awards nothing.
const legacy=JSON.parse(readFileSync(new URL('../tests/fixtures/save-v1.json',import.meta.url),'utf8'));
assert.equal(legacy.coins,987654);assert.equal(legacy.itemDex,undefined);
const legacyRaw=JSON.stringify(legacy);Save.d=Save.migrate(copy(legacy));
function retained(before,after,path='save'){
  if(before&&typeof before==='object')for(const key of Object.keys(before)){
    assert(Object.hasOwn(after,key),path+'.'+key+' missing');retained(before[key],after[key],path+'.'+key);
  }else assert.equal(after,before,path+' changed');
}
retained(legacy,Save.d);D.sync();retained(legacy,Save.d);
assert.equal(JSON.stringify(legacy),legacyRaw,'fixture was mutated');
assert(entry('furn','trophy').seen&&entry('wear','crown').seen,'legacy rare ownership not recovered');
const migrated=copy(Save.d);
for(const kind of ['furn','wear']){D.entries(kind);D.progress(kind);}
keepAssets(migrated,Save.d);Save.write();assert.equal(saved().coins,987654);
assert(saved().itemDex.furn.trophy&&saved().itemDex.wear.crown,'legacy collection not persisted');

// Placed, stored and equipped possessions recover collection history even without bag records.
let d=empty();
const starter=Save.fresh();
const [placed,stored,stock]=D.catalog('furn').filter(item=>!starter.furn[item.id]);
const equipped=D.catalog('wear').find(item=>item.slot==='head'&&!starter.wardrobe[item.id]);
d.room.items=[{uid:1,id:placed.id,x:10,y:10,flip:false},{uid:2,id:stock.id,x:20,y:20,flip:false}];
d.rooms.stored={spare:{...copy(d.room),items:[{uid:3,id:stored.id,x:10,y:10,flip:false}]}};
d.furn[stock.id]=3;d.chars.goji.outfit.head=equipped.id;
d.furn.future_furniture=9;d.wardrobe.future_clothing=true;
d.itemDex.furn.future_furniture=true;d.itemDex.wear.future_clothing=true;
const recovery=copy(d);assert.equal(D.sync(),true);assert.equal(D.sync(),false,'sync is not idempotent');
keepAssets(recovery,d);
assert.equal(D.progress('furn').collected,3);assert.equal(D.progress('wear').collected,1);
assert.equal(entry('furn',stock.id).count,3,'placed inventory counted twice');
for(const id of [placed.id,stored.id,stock.id])assert(entry('furn',id).seen&&entry('furn',id).owned,'furniture recovery failed: '+id);
assert(entry('wear',equipped.id).seen&&entry('wear',equipped.id).owned,'equipped clothing missing');
assert(!entry('furn','future_furniture')&&!entry('wear','future_clothing'),'unknown IDs became collection entries');
assert.equal(d.furn.future_furniture,9);assert.equal(d.wardrobe.future_clothing,true);
d.furn={};d.wardrobe={};d.room.items=[];d.rooms.stored={};d.chars.goji.outfit.head=null;Save.write();
Save.d=saved();
for(const id of [placed.id,stored.id,stock.id]){
  const row=entry('furn',id);assert(row.seen&&!row.owned&&row.count===0,'past ownership forgotten: '+id);
}
assert(entry('wear',equipped.id).seen&&!entry('wear',equipped.id).owned,'unequipped collection forgotten');

// Normal save writes register acquisitions without requiring the player to open the app.
d=empty();const acquisition=D.catalog('furn').find(item=>item.quizPrize);
d.furn[acquisition.id]=1;Save.write();delete d.furn[acquisition.id];Save.write();Save.d=saved();
assert(entry('furn',acquisition.id).seen&&!entry('furn',acquisition.id).owned);

// A prize transaction that rolls back after storage failure must not unlock a collection reward.
d=empty();
const nine=[...D.catalog('furn').filter(item=>starter.furn[item.id]),...D.catalog('furn').filter(item=>!starter.furn[item.id]&&!item.puzzlePrize)].slice(0,9);
for(const item of nine)d.furn[item.id]=1;
Save.write();assert.equal(D.progress('furn').collected,9);
const puzzle=PuzzleArcade.start({map:'city',x:12,y:24},false,42);
assert(puzzle,'paid puzzle fixture did not start');
const firstPrize=[...PUZZLE_PRIZES].sort((a,b)=>a.score-b.score)[0];puzzle.state.score=firstPrize.score;
const puzzleBefore=copy(d),puzzleRaw=localStorage.getItem(Save.KEY),puzzlePersist=localStorage.setItem;
localStorage.setItem=()=>{throw new Error('quota');};
try{
  assert.equal(PuzzleArcade.settle(puzzle),null,'failed puzzle settlement did not roll back');
  keepAssets(puzzleBefore,Save.d);
  assert.deepEqual(copy(Save.d.itemDex),puzzleBefore.itemDex,'failed prize left permanent collection history');
  assert.equal(D.progress('furn').collected,9,'rolled-back prize counted as collected');
  assert.equal(entry('furn',firstPrize.id).seen,false,'rolled-back prize remains visible');
  assert.equal(D.claim('furn',10),false,'rolled-back tenth type unlocked a coin reward');
  assert.equal(localStorage.getItem(Save.KEY),puzzleRaw,'failed settlement changed persisted save');
}finally{localStorage.setItem=puzzlePersist;}
const settled=PuzzleArcade.settle(Save.d.puzzle.active);
assert(settled&&settled.prizes.includes(firstPrize.id),'prize cannot be retried after storage failure');
assert(entry('furn',firstPrize.id).seen);assert.equal(D.progress('furn').collected,10);
assert.equal(D.claim('furn',10),true);assert.equal(Save.d.coins,puzzleBefore.coins+100);

// Each 10 unique types permits one explicit 100-coin claim per collection.
d=empty();
for(const kind of ['furn','wear']){
  const inventory=d[kind==='furn'?'furn':'wardrobe'];
  const defaults=starter[kind==='furn'?'furn':'wardrobe'];
  const first=[...D.catalog(kind).filter(item=>defaults[item.id]),...D.catalog(kind).filter(item=>!defaults[item.id])];
  for(const item of first.slice(0,20))inventory[item.id]=kind==='furn'?4:true;
}
Save.write();const beforeClaims=copy(d);
for(const kind of ['furn','wear']){
  const progress=D.progress(kind);assert.equal(progress.collected,20);
  assert(progress.ready.includes(10)&&progress.ready.includes(20),'earned thresholds unavailable');
}
keepAssets(beforeClaims,d);assert.equal(d.coins,987654,'collection awarded coins automatically');
for(const [kind,threshold] of [['furn',0],['furn',5],['furn',30],['wear',-10],['wear',10.5],['bogus',10]]){
  assert.equal(D.claim(kind,threshold),false,'invalid/unearned claim accepted');
}
assert.equal(d.coins,987654);
const persist=localStorage.setItem,raw=localStorage.getItem(Save.KEY),beforeFailure=copy(d);
localStorage.setItem=()=>{throw new Error('quota');};
try{
  assert.equal(D.claim('furn',10),false,'failed save reported a completed reward');
  keepAssets(beforeFailure,Save.d);assert.deepEqual(copy(Save.d.itemDex),beforeFailure.itemDex);
  assert.equal(localStorage.getItem(Save.KEY),raw,'failed claim changed saved data');
}finally{localStorage.setItem=persist;}
for(const [index,kind] of ['furn','wear'].entries()){
  for(const [offset,threshold] of [10,20].entries()){
    const coins=987654+100*(index*2+offset+1);
    assert.equal(D.claim(kind,threshold),true,'earned claim rejected');assert.equal(Save.d.coins,coins);
    assert.equal(D.claim(kind,threshold),false,'immediate double claim accepted');assert.equal(Save.d.coins,coins);
    Save.d=saved();assert.equal(D.claim(kind,threshold),false,'reload double claim accepted');assert.equal(Save.d.coins,coins);
    assert(Save.d.itemDex.claimed[kind][threshold],'claim marker missing from persisted save');
  }
}
keepAssets(beforeClaims,Save.d,assets.filter(key=>key!=='coins'&&key!=='stats'));
for(const kind of ['furn','wear'])assert.equal(D.progress(kind).ready.length,0);

// Completion is calculated from live unique IDs, and exhausted milestones have no next reward.
d=empty();
for(const kind of ['furn','wear']){
  for(const item of D.catalog(kind))d[kind==='furn'?'furn':'wardrobe'][item.id]=kind==='furn'?1:true;
}
Save.write();
for(const kind of ['furn','wear']){
  const p=D.progress(kind);assert.equal(p.collected,p.total);
  for(let threshold=10;threshold<=p.total;threshold+=10)assert.equal(D.claim(kind,threshold),true);
  assert.equal(D.progress(kind).next,null);assert.equal(D.progress(kind).ready.length,0);
}
console.log('✓ item encyclopedia: complete live catalogs/rare prizes, v1 preservation, placed/stored/equipped recovery, ever-owned history, unique counts, explicit once-only rewards and reload');
