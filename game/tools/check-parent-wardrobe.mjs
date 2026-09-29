import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,SaveBackup,ParentCare:P,ParentWardrobe:W,WEAR_ITEMS}=gameContext();
const old=Save.fresh();old.coins=987654;
for(const id of ['papa','mama']){delete old.parents[id].equipment;delete old.parents[id].hairColor;}
Save.d=Save.migrate(old);
for(const id of ['papa','mama']){
 assert.equal(P.look(id).hairColor,'brown');
 assert(!W.equip(id,'head','not-owned'));
 for(const it of WEAR_ITEMS){Save.d.wardrobe[it.id]=true;assert(W.equip(id,it.slot,it.id));const svg=P.svg(id,P.look(id));assert(!/NaN|undefined/.test(svg),it.id);assert(W.equip(id,it.slot,null));}
 for(const key of ['face','hair','hairColor']){
  const shapes=new Set();for(const [v]of P.options[key]){Save.d.parents[id][key]=v;shapes.add(P.svg(id,P.look(id)).replace(/parent-wear-\d+/g,'parent-wear'));}
  assert.equal(shapes.size,P.options[key].length,key+' choices must differ');
 }
}
const item=WEAR_ITEMS.find(it=>it.slot==='body');assert(W.equip('mama','body',item.id));
const saved=SaveBackup.decode(SaveBackup.encode());assert.equal(saved.parents.mama.equipment.body,item.id);assert.equal(saved.coins,987654);assert.equal(saved.parents.papa.outfit,'casual');
console.log('Parent wardrobe: migration, all 95 owned clothes on both parents, distinct looks, backup and coins OK');
