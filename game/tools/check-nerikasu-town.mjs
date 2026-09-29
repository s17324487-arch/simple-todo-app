import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';
import {NERIKASU_ASSETS} from './town-design/nerikasu-assets.mjs';
import {NERIKASU_BUILDINGS} from './town-design/nerikasu-buildings.mjs';
// ネリカスタウン（オーナーの 配置イメージ 2026-09-29 どおり。js/nerikasu-layout.js）
const R=gameContext(),L=R.NerikasuLayout,m=new R.WorldMap('town'),d=m.def,source=[...NERIKASU_ASSETS,...NERIKASU_BUILDINGS];
const B=(id)=>d.buildings.find(b=>b.id===id);
assert.equal(d.rows.length,72);assert.equal(d.rows[0].length,78);assert.equal(d.buildings.length,L.BUILDINGS.length);assert.equal(new Set(source.map(a=>a.id)).size,65);
// 建物の 絵は 原画の 大きさの まま（のばさない）。ネリカスの 原画は 昼と 夜の 2つ
for(const b of d.buildings){
  if(b.asset.startsWith('nerikasu.')){
    const a=source.find(a=>a.id===b.asset);assert(a,'No source artwork for '+b.id);
    assert.equal(b.w,a.w,b.id+' width is stretched');assert.equal(b.h,a.h,b.id+' height is stretched');
    if(a.door!=null)assert.equal(b.door,a.door,b.id+' visible door differs from entrance');
    for(const state of a.states){const opts=state==='night'?{night:true}:{};
      assert.equal(R.HeiwadaiArt.entry(a.id,opts).svg,a.draw(opts),a.id+' lost original details');
      const model=R.HeiwadaiArt.model(a.id,opts);assert.equal(model.originX,a.bbox[0]);assert.equal(model.originY,a.bbox[1]);
    }
  }else{const a=R.HeiwadaiArt.assets[b.asset];assert(a,'No heiwadai artwork for '+b.id);assert.deepEqual([b.w,b.h],[a.w,a.h],b.id+' is stretched');}
  assert(!m.isSolid(b.x+b.door,b.y+b.h),b.id+' entrance');
}
// 配置イメージの ならび: 大通りの 北は 家 → 家具 → 洋服 → クレープ → ローリソン → びっくぽ（右ほど 上）。
// よこの 道（中）の 南は お家 → せぶんぶん → 歯医者 → サロン → パン屋。右の 道の 東は 家の 列
const stair=['nerikasu_home7','furniture','clothes','crepe','neri_lawson','neri_bikkupo'].map(B);
for(let i=1;i<stair.length;i++){assert(stair[i].x>stair[i-1].x&&stair[i].y<stair[i-1].y,'staircase '+stair[i].id);assert(stair[i].y+stair[i].h<=L.oodoriY(stair[i].x+stair[i].w)+1,'north of the avenue '+stair[i].id);}
const row=['home','neri_sevenbun','dentist','nerikasu_home0','bakery'].map(B);
for(let i=1;i<row.length;i++)assert(row[i].x>=row[i-1].x+row[i-1].w&&Math.abs(row[i].y-row[0].y)<=1,'shop row '+row[i].id);
for(const [id,word] of [['neri_lawson','ローリソン'],['neri_sevenbun','せぶんぶん'],['neri_bikkupo','びっくぽ'],['neri_apartment','アパート'],['neri_gas','ガソリンスタンド'],['nerikasu_home1','おとどけ'],['neri_post','ゆうびんきょく'],['neri_chuka','中華']])assert(B(id).label.includes(word),id+' label');
assert(d.buildings.filter(b=>b.x>=68&&b.label==='まちの おうち').length>=7,'houses east of the right road');
// 他の家は なるべく 使いまわさない（ぜんぶ ちがう 絵）
const houses=d.buildings.filter(b=>b.label==='まちの おうち');assert(houses.length>=10);assert.equal(new Set(houses.map(b=>b.asset)).size,houses.length,'reused house art');
// 前の 町の 建物の ID と はたらき（お店・おてつだい・会場・おうち）は のこす。消したのは オーナーが「なくても よい」と した もの だけ
const prev=L.previous;assert.equal(prev.rows.length,68);
for(const old of prev.buildings){
  if(L.REMOVED[old.id]){assert(!B(old.id),old.id+' should be removed');continue;}
  assert(B(old.id),'lost building '+old.id);
  // バーガーの おてつだいは ファミレス びっくぽの 館の 中（キッチンの カウンター）
  const inVenue=old.act.type==='work'&&old.act.shop==='burger'&&R.VenueHalls.defs.bikkupo.floors[1].fixtures.some(f=>f.action==='kitchen');
  if(old.act.type!=='visit')assert(inVenue||d.buildings.some(b=>JSON.stringify(b.act)===JSON.stringify(old.act)),'lost '+JSON.stringify(old.act));
}
const acts=d.buildings.filter(b=>b.act.type!=='visit').map(b=>JSON.stringify(b.act));assert.equal(new Set(acts).size,acts.length,'duplicate shop');
assert.equal(B('neri_bikkupo').act.venue,'bikkupo');assert.equal(B('nerikasu_home5').act.shop,'korokoro');
for(const id of ['home','clothes','furniture','crepe','dentist','florist','cake','bakery','market','nerikasu_school','nerikasu_nursery'])assert(B(id));
// 2つの コンビニ（ちがう 商品・歩いて 入る 店）と ファミレス びっくぽ（斜め上の 館）
for(const id of ['lawson','sevenbun']){
  assert.equal(d.buildings.filter(b=>b.act.type==='buy'&&b.act.shop===id).length,1,id+' building');
  const shop=R.BUY_SHOPS[id],items=shop.items(),design=R.STORE_INTERIORS[id];assert(items.length===6&&items.every(i=>i&&R.BAG_INDEX[i.id]),id+' goods');
  assert(design&&design.fixtures.length===6,id+' interior');for(const [kind] of design.fixtures)assert(R.StoreArt.prop(kind).length>400,id+' fixture art '+kind);
}
const goods=(id)=>R.BUY_SHOPS[id].items().map(i=>i.id);assert(!goods('lawson').some(g=>goods('sevenbun').includes(g)),'the two convenience stores sell the same goods');
for(const id of ['karaage','rollcake','oden','cocoa','hamburg','omurice','doria','kidsplate','pancake','parfait']){const f=R.BAG_INDEX[id];assert(f&&f.exclusive==='nerikasu'&&f.price>0,'food '+id);assert(R.Art.iconSvg('bag',id).length>600,'food art '+id);}
assert(R.BUY_SHOPS.market.items('food').every(f=>!f.exclusive),'convenience foods leak into the supermarket');
{const v=R.VenueHalls.defs.bikkupo,r=v.floors[1],acts=r.fixtures.map(f=>f.action);assert(v.iso&&r.iso,'famires is an iso venue');
  assert(acts.filter(a=>a==='order').length>=10&&['drink','kitchen','register','kids','leave'].every(a=>acts.includes(a)),'famires fixtures '+acts);
  for(const f of r.fixtures)if(!['npc','exitMat'].includes(f.kind))assert(v.art.model(f),'famires model '+f.kind); // でぐちの マットは 床の 絵
  const keys=new Set(r.fixtures.map(f=>v.art.modelKey(f)));assert(keys.size<=30,'famires model keys');
  assert(R.BUY_SHOPS.bikkupo.items().length===5&&R.SONGS.bikkupo_hall&&R.SONGS.shop_lawson&&R.SONGS.shop_sevenbun,'takeout / music');}
// ネリカスえきは ない。でんしゃは 平和台えきから（大通りの 北の はしが 平和台）
assert(!R.Transit.stops.town_station);assert(!R.Transit.destinations('city_station').includes('town_station'));assert.equal(R.Transit.fare('heiwadai_station','city_station'),500);
const toHeiwadai=d.warps.find(w=>w.to==='heiwadai'&&w.y===0&&w.x<=48&&48<w.x+w.w),toMeadow=d.warps.find(w=>w.to==='meadow'&&w.y===d.rows.length-1);
assert(toHeiwadai&&toMeadow,'exits');
for(const w of toHeiwadai?[toHeiwadai,toMeadow]:[])for(let x=w.x;x<w.x+w.w;x++)assert(m.roadGrid[w.y][x],'exit on a road '+w.to);
R.TownRenewal.safePosition(m,0,0);
for(const [map,to] of [['heiwadai','town'],['meadow','town']]){const w=R.MAP_DEFS[map].warps.find(w=>w.to===to);assert(m.publicTiles.seen.has(w.tx+','+w.ty),'arrival from '+map);}
// 公園: 遊具・ベンチ・つりの できる 小さい 池。憩いの森
const within=(x0,y0,x1,y1)=>d.objects.filter(o=>o.x>=x0&&o.y>=y0&&o.x<=x1&&o.y<=y1).map(o=>o.asset||o.kind);
const big=within(36,14,50,31),small=within(25,21,38,32);
for(const a of ['park.slide','park.swing','park.seesaw','park.jungle','park.tetsubo','park.tires','park.fujidana','park.spring','prop.bench','park.clock','park.drink','fountain'])assert(big.includes(a),'big park: '+a);
for(const a of ['park.swing','park.sandbox','park.spring','prop.bench','park.drink'])assert(small.includes(a),'small park: '+a);
assert(B('neri_toilet')&&B('neri_toilet').x>=36&&B('neri_toilet').x<=50,'park toilet');
const water=new Set(),ponds=[];
for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.groundAt(x,y)==='water'&&!water.has(x+','+y)){const q=[[x,y]];water.add(x+','+y);for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=q[i][0]+dx,ny=q[i][1]+dy,k=nx+','+ny;if(m.groundAt(nx,ny)==='water'&&!water.has(k)){water.add(k);q.push([nx,ny]);}}ponds.push(q);}
assert.equal(ponds.length,3,'three ponds');
for(const q of ponds){const shore=q.flatMap(([x,y])=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]).filter(([x,y])=>!m.isSolid(x,y)&&m.publicTiles.seen.has(x+','+y)&&!m.warpAt(x,y)&&!m.doorAt(x,y));assert(shore.length>=4,'no place to fish at '+q[0]);}
assert.equal(R.FISHING_DATA.spots.town.place,'pond');assert(ponds.some(q=>q.length<=6)&&ponds.some(q=>q.length>=40),'small park ponds and the big pond');
let forest=0;for(let y=39;y<=48;y++)for(let x=17;x<=26;x++)if(d.rows[y][x]==='d')forest++;
assert(forest>=50,'forest floor');assert(within(16,38,27,49).filter(a=>/tree|pine/.test(a)).length>=10,'forest trees');
// 住人は 前の 町の 34人 そのまま（決めた 場所に 立つ・かべや 車道には 立たない）
for(const n of prev.npcs){const a=d.npcs.find(x=>x.id===n.id);assert(a,'lost NPC '+n.id);assert(!m.isSolid(a.x,a.y)&&m.roadGrid[a.y][a.x]!=='road','NPC stands on '+a.x+','+a.y);
  const s=L.NPC_SPOTS[n.id];assert(s&&Math.abs(s[0]-a.x)+Math.abs(s[1]-a.y)<=3,'NPC left its spot '+n.id);}
// 前の 町（64×68）で セーブした どこからでも つながった 道へ もどれる（コインや もちものには さわらない）
const previous=new R.WorldMap('prev-town',prev);let rescued=0;
for(let y=0;y<previous.h;y++)for(let x=0;x<previous.w;x++)if(!previous.isSolid(x,y)){const p=R.TownRenewal.safePosition(m,x,y);assert(!m.isSolid(...p)&&m.publicTiles.seen.has(p.join(','))&&!m.warpAt(...p)&&!m.doorAt(...p),'stranded save '+x+','+y);if(p[0]!==x||p[1]!==y)rescued++;}
const save=JSON.parse(readFileSync(new URL('../tests/fixtures/save-v1.json',import.meta.url),'utf8'));
const migrated=R.Save.migrate(JSON.parse(JSON.stringify(save)));assert.equal(migrated.coins,987654);
for(const key of ['bag','furn','wardrobe','room'])assert.equal(JSON.stringify(migrated[key]),JSON.stringify(save[key]),key);
for(const [id,progress]of Object.entries(save.shops))assert.equal(JSON.stringify(migrated.shops[id]),JSON.stringify(progress),id);
assert.equal(R.Save.KEY,'pokapoka-town-save-v1');assert.equal(R.Save.SCHEMA,1);
console.log(`Nerikasu: ${d.buildings.length} native-size buildings on the owner's map, ${ponds.length} fishing ponds, parks and forest; old IDs / shops / NPCs / ${rescued} old save spots rescued`);
