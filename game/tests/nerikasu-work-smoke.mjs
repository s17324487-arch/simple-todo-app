// ネリカスタウンの ガソリンスタンド・ゆうびんきょく（おてつだい）と ひだまり アパート（js/neri-gas.js・js/neri-post.js・js/neri-apart.js）
export async function nerikasuWorkSmoke({scenario,expect}){
  // おてつだい: 町の 入口 → 店内（3人）→ 店員と はなす → おてつだいする → ぜんぶ ◎ → 店内に もどる
  for(const [shop,lv,total,label] of [['gasstand',3,6,'ガソリンスタンド'],['postoffice',4,7,'ゆうびんきょく']])for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(shop+'-'+viewport.width,async H=>{
    await H.newGameFast();await H.dbg('hour',12);await H.dbg('coins',987504);
    {const s=await H.dbg('saveData');s.shops[shop].lv=lv;await H.dbg('seedSave',s);}const before=await H.dbg('saveData');
    const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.shop===shop);expect(door,label+'の 入口が ない');
    await H.dbg('teleport','town',door.x,door.y+1,'up');await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);
    await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),20000);
    const st=await H.dbg('storeState');expect(st.shop===shop&&st.party.length===3,'3人で 入れない '+shop);await H.wait(400);await H.shot('interior');
    if(shop==='gasstand'){ // レジの のみもの 4しゅ と おやつ 4しゅ（2つの タブ・UI-76）
      await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'かいものを する',exact:true}).click();
      await H.page.locator('.modal-wrap .grid .card').first().waitFor();expect(await H.eval(()=>document.querySelectorAll('.modal-wrap .grid .card').length===4&&document.querySelectorAll('.modal-wrap .tabs .tab').length===2),'スタンドの しなもの');
      await H.page.locator('.modal-wrap .close').last().click();await H.idle();
    }
    await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
    const ranks=await H.playShop(shop,lv,true);expect(ranks.length===total&&ranks.every(r=>r===3),label+'で ◎に ならない: '+JSON.stringify(H.shopGrades));
    expect((await H.dbg('storeState')).shop===shop,'おてつだいの あと 店内に もどらない');
    const after=await H.dbg('persistedSave');expect(after.coins>before.coins&&after.shops[shop].plays===1,label+'の 報酬・記録が のこらない');
    for(const k of ['bag','wardrobe','furn','rooms'])expect(H.kept(before,after,k),label+'で もちものが かわる '+k);
    await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),15000);
  },{viewport,full:viewport.width===375,timeout:200000});
  // ひだまり アパート: 1F（こたつ・おもちゃばこ）→ かいだん → 2F（ギター・え・ベランダ）→ 1F → でる
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('apartment-'+viewport.width,async H=>{
    await H.newGameFast();await H.dbg('hour',12);await H.dbg('needs',40);const start=await H.dbg('saveData');
    const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.venue==='neri_apart');expect(door,'アパートの 入口が ない');
    await H.dbg('teleport','town',door.x,door.y+1,'up');await H.idle();await H.dbg('walkTo',door.x,door.y);
    await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),20000);await H.until(()=>PokaDebug.venueIso()?.ready,20000);
    let v=await H.dbg('venueState');expect(v.id==='neri_apart'&&v.floor===1&&v.party.length===3,'3人で 入れない');await H.wait(700);await H.shot('apart-1f');
    const unreachable=v.routeCount.filter(r=>!r.reachable).map(r=>r.label);expect(!unreachable.length,'1F で いけない ところ '+JSON.stringify(unreachable));
    const say=async(label,re)=>{await H.dbg('venueVisit',label);await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:12000});if(re)expect(re.test(await H.eval(()=>document.querySelector('.dlg-text')?.textContent||'')),label+' の ことば');await H.dialogs();await H.idle();};
    await say('こたつ',/おちゃ/);const d1=await H.dbg('saveData');expect(Object.keys(d1.chars).every(id=>d1.chars[id].mood>start.chars[id].mood||d1.chars[id].mood>=100),'こたつで げんきが でない');
    await say('こたつ',/また/); // 2かいめは げんきが ふえない
    const d2=await H.dbg('saveData');expect(Object.keys(d2.chars).every(id=>d2.chars[id].mood<=d1.chars[id].mood),'こたつで なんども げんきが でる');
    await say('おもちゃばこ',/つみき/);await say('かんりにんさんの まどぐち',/ひだまり/);
    await H.dbg('venueVisit','かいだん（2かいへ）');await H.until(()=>PokaDebug.venueState()?.floor===2&&!PokaDebug.venueState().changingFloor&&PokaDebug.idle(),15000);await H.until(()=>PokaDebug.venueIso()?.ready,20000);
    v=await H.dbg('venueState');expect(v.routeCount.every(r=>r.reachable),'2F で いけない ところ');await H.wait(700);await H.shot('apart-2f');
    await say('ギター',/ギター|じゃか/);await say('かきかけの え',/え/);await say('ベランダの ベンチ',/そよかぜ/);await H.shot('apart-balcony');
    await H.dbg('venueVisit','かいだん（1かいへ）');await H.until(()=>PokaDebug.venueState()?.floor===1&&!PokaDebug.venueState().changingFloor&&PokaDebug.idle(),15000);
    await H.dbg('venueVisit','たてものを でる');await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),15000);
    const w=await H.dbg('state');expect(w.map==='town'&&Math.abs(w.pos[0]-door.x)<=2&&Math.abs(w.pos[1]-door.y)<=2,'アパートの まえに もどらない '+JSON.stringify(w.pos));
    const end=await H.dbg('saveData');for(const k of ['coins','bag','furn','wardrobe','rooms','shops'])expect(JSON.stringify(end[k])===JSON.stringify(start[k]),'アパートで かわった '+k);
  },{viewport,full:viewport.width===375,timeout:180000});
}
