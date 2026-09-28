import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';
const R=gameContext(),old=JSON.parse(readFileSync(new URL('../tests/fixtures/save-v1.json',import.meta.url),'utf8'));
assert.equal(old.gameVersion,'1.0.0');assert.equal(old.coins,987654);assert.equal(old.rooms,undefined);assert.equal(old.parents,undefined);assert.equal(old.puzzle,undefined);
const source=JSON.stringify(old),d=R.Save.migrate(JSON.parse(source));
// 追加項目を除けば、古いデータの全ての値が同じであることを再帰的に確かめる。
function retained(before,after,path='save'){
  if(before&&typeof before==='object')for(const k of Object.keys(before)){assert(Object.hasOwn(after,k),path+'.'+k+' missing');retained(before[k],after[k],path+'.'+k);}
  else assert.equal(after,before,path+' changed');
}
retained(old,d);assert.equal(JSON.stringify(old),source);assert(d.parents&&d.rooms&&d.puzzle);assert.equal(R.Save.KEY,'pokapoka-town-save-v1');assert.equal(R.Save.SCHEMA,1);
assert.equal(JSON.stringify(R.Save.migrate(d)),JSON.stringify(d),'migration must be repeatable');
retained(old,R.SaveBackup.decode(R.SaveBackup.encode(old)));
console.log('Real v1.0.0 fixture: all old values retained, new defaults supplied, repeated migration and backup roundtrip OK');
