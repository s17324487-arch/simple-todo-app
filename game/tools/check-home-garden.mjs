import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,SaveBackup,HomeRooms:R,HomeGarden:Y,RoomPresets,HomeDesign,UI,localStorage}=gameContext();
UI.toast=()=>{};UI.updateHud=()=>{};Save.d=Save.fresh();
const home=JSON.stringify(Save.d.room),coins=Save.d.coins;
assert(!R.purchase('yard'));assert.equal(Save.d.coins,coins);
Save.d.coins=987654;const original=JSON.stringify(Save.d),set=localStorage.setItem;
localStorage.setItem=()=>{throw Error('quota');};assert(!R.purchase('yard'));assert.equal(JSON.stringify(Save.d),original);localStorage.setItem=set;
assert(R.purchase('yard'));assert.equal(Save.d.coins,967654);assert(!R.purchase('yard'));assert.equal(Save.d.coins,967654);
assert.equal(JSON.stringify(Save.d.room),home);assert(R.switchTo('yard'));assert(Y.active());assert.equal(Save.d.room.items.length,4);
assert(RoomPresets.save(0,'おにわ'));Save.d.room.items=[];assert(RoomPresets.apply(0).ok);
assert(R.switchTo('main'));assert.equal(JSON.stringify(Save.d.room),home);assert(R.switchTo('yard'));
assert(R.expand('yard'));assert.equal(HomeDesign.size().w,640);assert.equal(Save.d.coins,961654);
for(const size of Object.values(HomeDesign.sizes)){const svg=Y.svg(size);assert(!/NaN|undefined/.test(svg));assert(svg.length>20000);}
Save.d=SaveBackup.decode(SaveBackup.encode());assert.equal(Save.d.rooms.active,'yard');assert.equal(Save.d.coins,961654);assert.equal(Save.d.rooms.presets.yard[0].name,'おにわ');
assert(R.catalog.some(r=>r.id==='garden'&&r.name==='そらの サンルーム'));assert(R.switchTo('main'));assert.equal(JSON.stringify(Save.d.room),home);
console.log('Garden: purchase, affordability, duplicate prevention, quota rollback, furniture, room preservation, presets, expansion, backup OK');
