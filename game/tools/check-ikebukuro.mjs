import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();
assert.equal(R.MAP_DEFS.city.rows.length,68);assert.equal(R.MAP_DEFS.city.rows[0].length,64);
assert.equal(R.MAP_DEFS.city.warps.length,0);assert(!R.MAP_DEFS.city.buildings.some(b=>b.act.type==='work'&&b.act.shop!=='link'));
for(const type of Object.keys(R.IkebukuroCatalog.appliances))for(let i=0;i<3;i++){const f=R.FURN_INDEX['ike_'+type+'_'+i];assert(f&&f.price>=7200);assert(R.Art.furnSvg(f.id).includes('<svg'));}
for(let i=0;i<3;i++)assert(R.ITEM_INDEX['ike_phone_'+i].rare&&R.ITEM_INDEX['ike_phone_'+i].slot==='neck');
for(const id of R.IkebukuroCatalog.groups.luxury)assert(R.FURN_INDEX[id].price>=10000&&R.FURN_INDEX[id].price<=50000);
for(const shop of ['clothes','furniture','market'])for(const [tab]of R.BUY_SHOPS[shop].tabs)assert(!R.BUY_SHOPS[shop].items(tab).some(i=>i.exclusive));
assert.equal(R.PrizeArcade.machines.length,8);
for(const id of ['prize_uma','prize_pie','prize_cookie',...R.IkebukuroCatalog.groups.marche])assert.equal(R.BAG_INDEX[id].kind,'food',id+' must be edible');
for(const food of R.FOODS.filter(f=>f.exclusive==='ikebukuro')){const svg=R.Art.iconSvg('bag',food.id);assert(!/=>|\$\{|undefined/.test(svg),food.id+' must register SVG markup, not a renderer function');assert(/<(path|rect|circle)\b/.test(svg),food.id+' must have visible artwork');}
for(const type of ['claw','sweet','tripod','ring'])assert.equal(R.PrizeArcade.machines.filter(m=>m.type===type).length,2);
// 100コインの 支払いと ごほうびは 1かいだけ（くわしい 物理の 検査は tools/check-crane.mjs）
R.Save.d=R.Save.fresh();R.Save.d.coins=99999;const before=R.Save.d.coins,back={venue:'arcade',floor:1,back:{map:'city',x:12,y:62}};
const run=R.PrizeArcade.start(0,back);assert(run);assert.equal(R.Save.d.coins,before-100);assert.equal(R.PrizeArcade.start(1,back),null);
const round={got:[1],board:()=>({v:1,n:2,b:[],s:{}})};assert(R.PrizeArcade.finish(run,round));assert.equal(R.Save.d.furn.ike_prize_0,1);assert(!R.PrizeArcade.finish(run,round));assert.equal(R.Save.d.furn.ike_prize_0,1);
const migrated=R.Save.migrate({...R.Save.fresh(),coins:987654,arcade:undefined});assert.equal(migrated.coins,987654);assert(migrated.arcade);
console.log('Ikebukuro: exclusive catalogs, eight machines, four distinct mechanics, fee/reward idempotency and legacy money OK');
