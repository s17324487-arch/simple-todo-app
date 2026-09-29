// ネリカスタウンの あたらしい お店（js/neri-shops.js・js/neri-bikkupo.js）: 2つの コンビニ（ちがう 商品）と ファミレス びっくぽ
export async function nerikasuShopsSmoke({scenario,expect}){
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-shops-'+viewport.width,async H=>{
    await H.newGameFast();await H.dbg('hour',12);await H.dbg('weather','clear');await H.dbg('coins',5000);
    const start=await H.dbg('saveData'),layout=await H.dbg('townLayout','town'),lists={};
    // コンビニ 2つ: 町の 入口から 入る → 店員と はなす → かいもの（しなものが ちがう）→ 1つ かう
    for(const [shop,item] of [['lawson','karaage'],['sevenbun','oden']]){
      const door=layout.doors.find(d=>d.act.shop===shop);expect(door,shop+' の 入口が ない');
      await H.dbg('teleport','town',door.x,door.y+1,'up');await H.idle();await H.dbg('walkTo',door.x,door.y);
      await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),20000);
      const st=await H.dbg('storeState');expect(st.shop===shop&&st.party.length===3,'3人で 入れない '+shop);await H.wait(500);await H.shot(shop+'-inside');
      await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'かいものを する',exact:true}).click();
      await H.page.locator('.modal-wrap .grid .card').first().waitFor();
      lists[shop]=await H.eval(()=>[...document.querySelectorAll('.modal-wrap .grid .card')].map(c=>c.querySelector('.price')?.previousElementSibling?.textContent||''));
      expect(lists[shop].length===6&&lists[shop].every(Boolean),shop+' の しなもの '+JSON.stringify(lists[shop]));
      expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth),'しなものが よこに はみ出す');await H.shot(shop+'-goods');
      const name=await H.eval(id=>BAG_INDEX[id].name,item),price=await H.eval(id=>BAG_INDEX[id].price,item),before=await H.dbg('saveData');
      await H.page.locator('.modal-wrap .grid .card').filter({hasText:name}).first().click();await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.wait(250);
      const saved=await H.dbg('persistedSave');expect(saved.coins===before.coins-price&&(saved.bag[item]||0)===(before.bag[item]||0)+1,shop+' で かえない '+item);
      await H.page.locator('.modal-wrap .close').last().click();await H.idle();
      await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),15000);
    }
    expect(!lists.lawson.some(n=>lists.sevenbun.includes(n)),'2つの コンビニで おなじ しなもの '+JSON.stringify(lists));
    // スーパーの たなには コンビニの 食べ物が ならばない
    expect(await H.eval(()=>BUY_SHOPS.market.items('food').every(f=>!f.exclusive)),'スーパーに コンビニの しなもの');
    // びっくぽ: ファミレスの 館（斜め上）→ ボックス席で ハンバーグ → ドリンクバー → レジ（おもちかえり）
    const door=layout.doors.find(d=>d.act.venue==='bikkupo');expect(door,'びっくぽの 入口が ない');
    await H.dbg('teleport','town',door.x,door.y+1,'up');await H.idle();await H.dbg('walkTo',door.x,door.y);
    await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),20000);await H.until(()=>PokaDebug.venueIso()?.ready,20000);
    let v=await H.dbg('venueState');expect(v.id==='bikkupo'&&v.party.length===3,'3人で 入れない');await H.wait(800);await H.shot('bikkupo');
    const labels=v.fixtures.filter(f=>f.action).map(f=>f.label);
    for(const l of ['まどぎわの ボックス席 1','かべぞいの ボックス席 1','テーブル 1','ドリンクバー','キッチンの カウンター','レジ（おもちかえり）','デザートの ショーケース','キッズ コーナー'])expect(labels.includes(l),'ファミレスに ない: '+l);
    const d0=await H.dbg('saveData');
    await H.dbg('venueVisit','まどぎわの ボックス席 2');await H.page.getByRole('button',{name:'ごはん',exact:true}).click();
    await H.page.getByRole('button',{name:'ハンバーグ（120コイン）',exact:true}).click();await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:8000});
    expect(/ハンバーグ/.test(await H.eval(()=>document.querySelector('.dlg-text')?.textContent||'')),'はいぜん ロボが はこばない');await H.wait(900);await H.shot('bikkupo-meal');await H.dialogs();await H.idle();
    const d1=await H.dbg('saveData');expect(d1.coins===d0.coins-120&&Object.keys(d1.chars).every(id=>d1.chars[id].hunger>=Math.min(100,d0.chars[id].hunger)),'ハンバーグの ねだん・おなか');
    v=await H.dbg('venueState');const robot=v.fixtures.find(f=>f.robot);expect(robot&&(robot.x!==13||robot.y!==5||robot.goal),'はいぜん ロボが うごかない');
    await H.dbg('venueVisit','ドリンクバー');await H.page.getByRole('button',{name:'のむ（30コイン）',exact:true}).click();await H.dialogs();await H.idle();
    expect((await H.dbg('saveData')).coins===d1.coins-30,'ドリンクバーの ねだん');
    await H.dbg('venueVisit','レジ（おもちかえり）');await H.page.locator('.modal-wrap .grid .card').first().waitFor();
    expect(await H.eval(()=>document.querySelectorAll('.modal-wrap .grid .card').length)===5,'おもちかえりの しなもの');await H.shot('bikkupo-takeout');
    await H.page.locator('.modal-wrap .close').last().click();await H.idle();
    // たべた ものと のみものの ほかは かわらない
    const after=await H.dbg('saveData');for(const k of ['furn','wardrobe','room','rooms','shops'])expect(JSON.stringify(after[k])===JSON.stringify(start[k]),'お店で かわった '+k);
    expect(after.bag.karaage===(start.bag.karaage||0)+1&&after.bag.oden===(start.bag.oden||0)+1,'かった ものが もちものに ない');
    await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
    const back=await H.dbg('saveData');expect(back.coins===after.coins&&back.bag.karaage===after.bag.karaage,'再開で かわる');
  },{viewport,timeout:180000});
}
