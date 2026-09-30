import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();
// 町の 配置（オーナーの 配置イメージ 2026-09-29: 西に 駅・上に 家電／Mee／いけぶ・ななめの 東通りと サンシャイン60通り・下に 緑の大通り）
const T=R.IkebukuroTown,city=R.MAP_DEFS.city,B=id=>city.buildings.find(b=>b.id===id),road=id=>city.roads.find(r=>r.id===id),doorOf=b=>[b.x+b.door,b.y+b.h-1];
assert.equal(city.rows.length,T.H);assert.equal(city.rows[0].length,T.W);assert(city.ikeTown&&city.renewal);
const st=B('city_station'),el=B('ike_electronics'),mee=B('ike_arcade'),mall=B('ike_mall'),rg=B('city_range'),of=B('ike_office');
const east=road('ike-east'),s60=road('ike-s60'),green=road('ike-green'),meiji=road('ike-meiji');
assert(st.x<=4&&city.buildings.every(b=>b===st||b.x>=st.x),'駅は いちばん 西（線路の となり）');
assert(meiji.pieces[0].a[0]===meiji.pieces[0].b[0]&&meiji.pieces[0].a[0]>st.x+st.w,'明治通りは 駅の ひがしを 南北に');
const ex=y=>{const {a,b}=east.pieces[0];return a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]);};
assert(east.pieces[0].b[0]>east.pieces[0].a[0]&&east.pieces[0].a[1]<0,'東通りは 上から 右下へ ななめ');
assert(el.x+el.w<=ex(el.y)&&mee.x>=ex(mee.y+mee.h),'家電は 東通りの 左・Mee は 右');
assert(el.y<=5&&mee.y<=5&&mall.y<=5,'家電・Mee・いけぶは 上の 列');
assert(mall.x+mall.w===T.W&&city.buildings.every(b=>b.x+b.w<=mall.x+mall.w),'いけぶは 右上の すみ');
const [sa,sb]=[s60.pieces[0].a,s60.pieces[0].b];assert(sb[0]>sa[0]&&sb[1]<sa[1],'サンシャイン60通りは 右上へ');assert.equal(sb[0],doorOf(mall)[0],'サンシャイン60通りの はしに いけぶの 入口');
assert(Math.abs(sa[0]-ex(sa[1]))<.01,'サンシャイン60通りは 東通りの かどから');
const gy=green.pieces[0].a[1];assert(city.roads.every(r=>r.id==='ike-meiji'||Math.max(r.pieces[0].a[1],r.pieces[0].b[1])<=gy),'緑の大通りは いちばん 南');
const gTop=gy-green.carriage/2-green.side;
for(const b of [rg,of])assert(b.y+b.h<=gTop&&b.y>sb[1],b.id+' は 緑の大通りの 北・サンシャイン60通りの 南');
assert(rg.x>ex(rg.y+rg.h)&&rg.x+rg.w<of.x&&of.x+of.w===T.W,'射撃場は 下の まんなか・ままの オフィスは 右下');
// どの 入口にも 駅から あるいて いける
{const m=new R.WorldMap('city'),start=[st.x+st.door,st.y+st.h],seen=new Set([start.join()]),q=[start];
  for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&!m.isSolid(nx,ny)){seen.add(k);q.push([nx,ny]);}}}
  for(const b of city.buildings)for(const dx of b.doors||[b.door])assert(seen.has((b.x+dx)+','+(b.y+b.h)),'入口に いけない '+b.id);}
// 建物と めじるしの 絵は 生成データの 原画（昼と 夜）・キーは 有限
for(const b of city.buildings){const a=R.HeiwadaiArt.assets[b.asset];assert(a&&a.w===b.w&&a.h===b.h&&a.buildingId===b.id,'建物の 絵 '+b.id);for(const st2 of a.states)assert(R.HeiwadaiArt.lookup.has(b.asset+'|'+R.HeiwadaiArt.optionKey(st2==='night'?{night:true}:{})));}
assert(new Set(city.buildings.map(b=>b.asset)).size===city.buildings.length,'おなじ 絵の 建物が ない');
for(const id of ['ike_owl','ike_s60_sign','ike_vision','city_fountain','city_clock','city_bus'])assert(city.objects.some(o=>o.id===id),'めじるし '+id);
assert(R.RANGE_DATA.outside.x===rg.x&&R.RANGE_DATA.outside.front[1]===rg.y+rg.h&&R.MAP_DEFS.museum.warps.every(w=>w.to!=='city'||(w.tx===B('city_museum').x+B('city_museum').door&&w.ty===B('city_museum').y+B('city_museum').h)),'射撃場・はくぶつかんの 出口');
assert.equal(R.MAP_DEFS.city.warps.length,0);assert(!R.MAP_DEFS.city.buildings.some(b=>b.act.type==='work'&&b.act.shop!=='link'));
for(const type of Object.keys(R.IkebukuroCatalog.appliances))for(let i=0;i<3;i++){const f=R.FURN_INDEX['ike_'+type+'_'+i];assert(f&&f.price>=7200);assert(R.Art.furnSvg(f.id).includes('<svg'));}
for(let i=0;i<3;i++)assert(R.ITEM_INDEX['ike_phone_'+i].rare&&R.ITEM_INDEX['ike_phone_'+i].slot==='neck');
for(const id of R.IkebukuroCatalog.groups.luxury)assert(R.FURN_INDEX[id].price>=10000&&R.FURN_INDEX[id].price<=50000);
for(const shop of ['clothes','furniture','market'])for(const [tab]of R.BUY_SHOPS[shop].tabs)assert(!R.BUY_SHOPS[shop].items(tab).some(i=>i.exclusive));
assert.equal(R.PrizeArcade.machines.length,17);assert.equal(R.CraneMachines.DEFS.length,17);
for(const id of ['prize_uma','prize_pie','prize_cookie',...R.IkebukuroCatalog.groups.marche])assert.equal(R.BAG_INDEX[id].kind,'food',id+' must be edible');
for(const food of R.FOODS.filter(f=>f.exclusive==='ikebukuro')){const svg=R.Art.iconSvg('bag',food.id);assert(!/=>|\$\{|undefined/.test(svg),food.id+' must register SVG markup, not a renderer function');assert(/<(path|rect|circle)\b/.test(svg),food.id+' must have visible artwork');}
for(const [type,min] of [['claw',2],['sweet',1],['pusher',1],['tripod',2],['ring',2]])assert(R.PrizeArcade.machines.filter(m=>m.type===type).length>=min,type);
// 100コインの 支払いと ごほうびは 1かいだけ（くわしい 物理の 検査は tools/check-crane.mjs）
R.Save.d=R.Save.fresh();R.Save.d.coins=99999;const before=R.Save.d.coins,back={venue:'arcade',floor:1,back:{map:'city',x:mee.x+mee.door,y:mee.y+mee.h}};
const run=R.PrizeArcade.start(0,back);assert(run);assert.equal(R.Save.d.coins,before-100);assert.equal(R.PrizeArcade.start(1,back),null);
const round={got:[1],board:()=>({v:1,n:2,b:[],s:{}})};assert(R.PrizeArcade.finish(run,round));assert.equal(R.Save.d.furn.ike_chibi_wanko_0,1);assert(!R.PrizeArcade.finish(run,round));assert.equal(R.Save.d.furn.ike_chibi_wanko_0,1);
const migrated=R.Save.migrate({...R.Save.fresh(),coins:987654,arcade:undefined});assert.equal(migrated.coins,987654);assert(migrated.arcade);
console.log('Ikebukuro: layout (station west / electronics・Mee・mall top / S60 to the mall / range・office on Green Odori), '+city.buildings.length+' buildings reachable, exclusive catalogs, seventeen machines (twelve on 1F, five snack catchers on 2F), five distinct mechanics, fee/reward idempotency and legacy money OK');
