import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext(),d=R.Save.fresh();d.coins=987654;d.chars.wanko.lv=20;d.chars.goji.name='ごじ';d.rooms.expanded.main=true;d.flags.chests.heiwadai_lane=true;d.futureContent={owns:['later-item'],count:5};
R.Save.d=d;const original=JSON.stringify(d),encoded=R.SaveBackup.encode(),restored=R.SaveBackup.decode(encoded);
assert.equal(JSON.stringify(restored),original,'Roundtrip must retain every field');
const old=JSON.parse(original);delete old.parents;delete old.rooms;delete old.puzzle;
assert.equal(R.SaveBackup.decode(R.SaveBackup.encode(old)).coins,987654);assert(R.SaveBackup.decode(R.SaveBackup.encode(old)).parents);
const mutate=fn=>{const data=JSON.parse(original);fn(data);return R.SaveBackup.encode(data);};
const invalid=['oops','{}','{"game":"other","format":1,"data":{}}',mutate(d=>d.coins=-1),mutate(d=>d.coins='99999'),mutate(d=>d.v=999),mutate(d=>d.chars={}),mutate(d=>d.chars.goji.lv=0),mutate(d=>d.order=['goji','goji','goji']),mutate(d=>d.room=null),mutate(d=>d.room.items=[null]),mutate(d=>d.room.items.push({...d.room.items[0]})),mutate(d=>d.room.items[0].id='bad'),mutate(d=>d.chars.wanko.outfit=null),mutate(d=>d.rooms.stored.bad=null),mutate(d=>d.rooms.active='missing'),mutate(d=>d.world.x=.5),encoded.replace('"futureContent": {','"futureContent": {"__proto__":{},'),'x'.repeat(R.SaveBackup.limit+1)];
for(const bad of invalid){assert.throws(()=>R.SaveBackup.decode(bad));assert.equal(JSON.stringify(R.Save.d),original);}
const paid=JSON.parse(original);paid.puzzle.active={id:'paid-backup',practice:false,back:{map:'town',x:12,y:24},state:new R.NakayoshiPuzzle(42).s};
assert.equal(JSON.stringify(R.SaveBackup.decode(R.SaveBackup.encode(paid)).puzzle.active),JSON.stringify(paid.puzzle.active));
for(const change of [d=>d.puzzle.active={},d=>d.puzzle.active.state.remaining='45',d=>d.puzzle.active.state.board=[0],d=>d.puzzle.active.state.shapes=null]){const broken=JSON.parse(JSON.stringify(paid));change(broken);assert.throws(()=>R.SaveBackup.decode(R.SaveBackup.encode(broken)));assert.equal(JSON.stringify(R.Save.d),original);}
let raw=original;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;},removeItem:()=>{raw=null;}};
R.SaveBackup.install(restored,storage);assert.equal(R.Save.d.coins,987654);assert.equal(JSON.parse(raw).coins,987654);assert.equal(JSON.stringify(R.Save.d.room),JSON.stringify(d.room));
assert.equal(JSON.stringify(R.Save.d.wardrobe),JSON.stringify(d.wardrobe));assert.equal(R.Save.d.chars.wanko.lv,20);assert(R.Save.d.rooms.expanded.main);assert.equal(JSON.stringify(R.Save.d.futureContent),JSON.stringify(d.futureContent));
const before=JSON.stringify(R.Save.d),beforeRaw=raw;
assert.throws(()=>R.SaveBackup.install(restored,{getItem:()=>raw,setItem:()=>{throw Error('quota');}}));assert.equal(JSON.stringify(R.Save.d),before);assert.equal(raw,beforeRaw);
console.log('Save backup: roundtrip / old and future additive fields / '+invalid.length+' invalid inputs / quota failure preserve player data');
