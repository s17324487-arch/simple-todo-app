import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/save-v1.json',import.meta.url),'utf8'));
export async function nerikasuTownSmoke({scenario,expect}){
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-art-'+viewport.width,async H=>{
    await H.newGameFast();const old=JSON.parse(JSON.stringify(fixture));old.last=Date.now();old.world={map:'town',x:47,y:6,dir:'down'};
    await H.dbg('seedLegacySave',old);await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
    const loaded=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room'])expect(JSON.stringify(loaded[key])===JSON.stringify(old[key]),'再開で持ち物が変わる '+key);
    for(const [id,progress]of Object.entries(old.shops))expect(JSON.stringify(loaded.shops[id])===JSON.stringify(progress),'既存のお店の記録が変わる '+id);
    const routes=await H.dbg('townRoutes');expect(!routes.solid&&routes.doors.every(d=>d.reachable),'新しい町で入口に行けない');
    await H.dbg('hour',11);await H.dbg('weather','clear');
    const arts=await H.dbg('nerikasuArt');expect(arts.buildings.length===22&&arts.buildings.every(b=>b.asset.startsWith('nerikasu.')),'旧アセットが残る');
    expect(arts.cached.some(k=>k.includes('night')),'夜の原画を先読みしない');
    const views=[['station',44,10],['home-tailor',10,10],['workshop',24,10],['crepe-clinic',16,24],['flowers',41,24],['food-street',14,38],['school',15,64],['nursery',47,64],['homes',17,52]];
    for(const [name,x,y]of views){await H.dbg('teleport','town',x,y,'up');await H.idle();await H.wait(3300);await H.shot(name);}
    await H.dbg('teleport','town',44,10,'up');await H.idle();await H.dbg('walkTo',44,7);await H.page.getByRole('button',{name:'やめておく',exact:true}).waitFor();await H.shot('station-destinations');await H.page.getByRole('button',{name:'やめておく',exact:true}).click();await H.idle();
    expect((await H.dbg('saveData')).coins===old.coins,'乗車しなくても料金が引かれる');
    await H.dbg('hour',21);await H.dbg('teleport','town',44,10,'up');await H.idle();await H.wait(3300);expect((await H.dbg('nerikasuArt')).night,'夜の窓に切り替わらない');await H.shot('station-night');
    // 新しい店の絵の入口から、従来の店員・商品へ入れる。
    await H.dbg('hour',11);await H.dbg('teleport','town',14,9,'up');await H.idle();await H.dbg('walkTo',14,7);await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),30000);await H.shot('tailor-inside');
    const after=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room','shops'])expect(JSON.stringify(after[key])===JSON.stringify(loaded[key]),'町の見学で資産が変わる '+key);
  },{viewport,timeout:180000});
}
