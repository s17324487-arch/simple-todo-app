import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,SaveBackup,ParentCare:P,ParentWardrobe:W,WEAR_ITEMS}=gameContext();
const old=Save.fresh();old.coins=987654;
for(const id of ['papa','mama']){delete old.parents[id].equipment;delete old.parents[id].hairColor;}
Save.d=Save.migrate(old);
for(const id of ['papa','mama']){
 assert.equal(P.look(id).hairColor,'brown');
 assert(!W.equip(id,'head','not-owned'));
 // もちもの（UI-48・slot "hand"）と バッグの チャーム（UI-123・slot "charm"）は 3人 だけ: ぱぱ・ままは もてない
 for(const it of WEAR_ITEMS.filter(it=>it.slot==='hand'||it.slot==='charm')){Save.d.wardrobe[it.id]=true;assert(!W.equip(id,it.slot,it.id),it.id);}
 for(const it of WEAR_ITEMS.filter(it=>it.slot!=='hand'&&it.slot!=='charm')){Save.d.wardrobe[it.id]=true;assert(W.equip(id,it.slot,it.id));const svg=P.svg(id,P.look(id));assert(!/NaN|undefined/.test(svg),it.id);assert(W.equip(id,it.slot,null));}
 for(const key of ['face','hair','hairColor']){
  const shapes=new Set();for(const [v]of P.options[key]){Save.d.parents[id][key]=v;shapes.add(P.svg(id,P.look(id)).replace(/parent-wear-\d+/g,'parent-wear'));}
  assert.equal(shapes.size,P.options[key].length,key+' choices must differ');
 }
}
// ぱぱの かみ（オーナーの 指示 2026-10-13「ぱぱの髪型が男性としては変だ」）: みじかい かみは かおの よこに たれない（うしろの かみは みみの うえまで）・みみが みえる。ながい かみ（ボブ・ロング など）は いままでどおり
{const L=(hair)=>({...P.look('papa'),hair,accessory:'none',equipment:{}}),side=/<rect x="-25" y="-112" width="50" height="48"/,ear=/<ellipse cx="-21" cy="-80"[^>]*\/><ellipse cx="21" cy="-80"/;
 assert.equal(Save.fresh().parents.papa.hair,'short');
 for(const h of ['short','sidepart','pixie','curly']){const svg=P.svg('papa',L(h));assert(!side.test(svg)&&ear.test(svg)&&/<rect x="-25" y="-115" width="50" height="32"/.test(svg),'みじかい かみ '+h);}
 for(const h of ['bob','long','wavy','ponytail','bun','twintail']){const svg=P.svg('papa',L(h));assert(side.test(svg)&&!ear.test(svg),'ながい かみ '+h);}}
const item=WEAR_ITEMS.find(it=>it.slot==='body');assert(W.equip('mama','body',item.id));
const saved=SaveBackup.decode(SaveBackup.encode());assert.equal(saved.parents.mama.equipment.body,item.id);assert.equal(saved.coins,987654);assert.equal(saved.parents.papa.outfit,'casual');
console.log('Parent wardrobe: migration, all 95 owned clothes on both parents, distinct looks, backup and coins OK');
