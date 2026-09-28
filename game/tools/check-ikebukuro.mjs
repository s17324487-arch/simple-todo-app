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
for(const type of ['claw','sweet','tripod','ring']){
 assert.equal(R.PrizeArcade.machines.filter(m=>m.type===type).length,2);
 const r=new R.PrizeMachineRound(type,()=>0);r.move(10,-10);assert.equal(r.x,.92);assert.equal(r.y,.08);r.x=r.target.x;r.y=r.target.y;r.time=0;
 if(type==='sweet'){for(let i=0;i<6;i++){r.time=.5/.38;r.drop();}assert(r.win);}
 else if(type==='tripod'){r.x=.15;r.y=.5;r.drop();r.x=.5;r.time=(1/3)/.56;r.drop();assert(r.win);}
 else {if(type==='ring')r.time=.5/.38;r.drop();assert(r.win);}
 const stale=new R.PrizeMachineRound(type);stale.tick(40);assert(stale.done&&!stale.win);
}
R.Save.d=R.Save.fresh();R.Save.d.coins=99999;const before=R.Save.d.coins,back={venue:'arcade',floor:1,back:{map:'city',x:12,y:62}};
const run=R.PrizeArcade.start(0,back);assert(run);assert.equal(R.Save.d.coins,before-100);assert.equal(R.PrizeArcade.start(1,back),null);run.state.win=true;run.state.done=true;assert(R.PrizeArcade.finish(run));assert.equal(R.Save.d.furn.ike_prize_0,1);assert(!R.PrizeArcade.finish(run));assert.equal(R.Save.d.furn.ike_prize_0,1);
const migrated=R.Save.migrate({...R.Save.fresh(),coins:987654,arcade:undefined});assert.equal(migrated.coins,987654);assert(migrated.arcade);
console.log('Ikebukuro: exclusive catalogs, eight machines, four distinct mechanics, fee/reward idempotency and legacy money OK');
