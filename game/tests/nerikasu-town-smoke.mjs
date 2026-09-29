import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/save-v1.json',import.meta.url),'utf8'));
export async function nerikasuTownSmoke({scenario,expect}){
  await scenario('nerikasu-plan',async H=>{
    await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');const before=await H.dbg('saveData');
    const data=await H.dbg('townPlan','town');expect(data.startsWith('data:image/png;base64,'),'全体図を描けない');
    const png=Buffer.from(data.split(',')[1],'base64');expect(png.readUInt32BE(16)===2496&&png.readUInt32BE(20)===2304,'全体図の実寸が違う'); // 78×72マス
    const after=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room','world','shops'])expect(JSON.stringify(after[key])===JSON.stringify(before[key]),'全体図の描画でセーブが変わる '+key);
    mkdirSync(new URL('./screenshots/review/',import.meta.url),{recursive:true});writeFileSync(new URL('./screenshots/review/nerikasu-plan.png',import.meta.url),png);
  },{timeout:90000});
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-art-'+viewport.width,async H=>{
    await H.newGameFast();const old=JSON.parse(JSON.stringify(fixture));old.last=Date.now();old.world={map:'town',x:40,y:5,dir:'down'}; // 前の 町では 道 → いまは びっくぽの 中
    await H.dbg('seedLegacySave',old);await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
    const loaded=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room'])expect(JSON.stringify(loaded[key])===JSON.stringify(old[key]),'再開で持ち物が変わる '+key);
    for(const [id,progress]of Object.entries(old.shops))expect(JSON.stringify(loaded.shops[id])===JSON.stringify(progress),'既存のお店の記録が変わる '+id);
    const routes=await H.dbg('townRoutes');expect(!routes.solid&&routes.doors.every(d=>d.reachable),'新しい町で入口に行けない');expect((await H.dbg('state')).pos.join()!=='40,5','建物の 中に のこった');
    await H.dbg('hour',11);await H.dbg('weather','clear');
    const arts=await H.dbg('nerikasuArt');expect(arts.buildings.length===36&&arts.buildings.every(b=>/^(nerikasu|bld)\./.test(b.asset)),'旧アセットが残る');
    expect(arts.cached.some(k=>k.includes('night')),'夜の原画を先読みしない');
    // オーナーの 配置イメージの 場所: 大通りの 北の 店・公園・池・憩いの森・よこの 道の 店・学校・家の 列・はたけ
    const views=[['avenue-shops',22,22],['lawson-bikkupo',36,11],['park',42,24],['small-park',32,27],['pond-pier',60,20],['forest',20,43],['shop-row',40,60],['school',24,70],['homes',68,33],['farm',6,60]];
    for(const [name,x,y]of views){await H.dbg('teleport','town',x,y,'up');await H.idle();await H.wait(3300);await H.shot(name);}
    // 3つの 池の どれでも つれる（水べに 立つと 魚の かげが 出せる）
    await H.dbg('rod',1);
    for(const [name,near] of [['park-pond',[40,21]],['small-pond',[31,27]],['big-pond',[59,17]]]){
      const sh=await H.dbg('fishShore','town',near);expect(sh&&Math.abs(sh.x-near[0])+Math.abs(sh.y-near[1])<=4,'池の 水べが ない '+name+' '+JSON.stringify(sh));
      await H.dbg('teleport','town',sh.x,sh.y,sh.dir);await H.idle();await H.dbg('fishAuto',false,true);
      expect(await H.dbg('fishSpawn','kingyo',10),'魚の かげが 出ない '+name);await H.wait(300);await H.shot('fish-'+name);await H.dbg('fishAuto',false,true);
    }
    // コンビニ ローリソンは 入口から 店の 中へ（品ぞろえは nerikasu-shops-smoke.mjs）
    const layout=await H.dbg('townLayout','town'),lawson=layout.doors.find(d=>d.id==='neri_lawson');expect(lawson&&lawson.act.shop==='lawson','ローリソンの 入口が ない');
    await H.dbg('teleport','town',lawson.x,lawson.y+1,'up');await H.idle();await H.dbg('walkTo',lawson.x,lawson.y);
    await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),20000);await H.shot('lawson');expect((await H.dbg('saveData')).coins===old.coins,'見るだけで コインが へる');
    await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),15000);
    await H.dbg('hour',21);await H.dbg('teleport','town',36,11,'up');await H.idle();await H.wait(3300);expect((await H.dbg('nerikasuArt')).night,'夜の窓に切り替わらない');await H.shot('avenue-night');
    // 新しい店の絵の入口から、従来の店員・商品へ入れる。
    const tailor=layout.doors.find(d=>d.act.shop==='clothes');await H.dbg('hour',11);await H.dbg('teleport','town',tailor.x,tailor.y+1,'up');await H.idle();await H.dbg('walkTo',tailor.x,tailor.y);await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),30000);await H.shot('tailor-inside');
    const after=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room','shops'])expect(JSON.stringify(after[key])===JSON.stringify(loaded[key]),'町の見学で資産が変わる '+key);
  },{viewport,timeout:180000});
}
