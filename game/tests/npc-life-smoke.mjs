export async function npcLifeSmoke({scenario,expect}){
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('npc-life-'+viewport.width,async H=>{
    await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
    await H.dbg('teleport','town',12,10,'up');await H.idle();const before=await H.dbg('saveData');
    const start=await H.dbg('npcLife');await H.dbg('npcLifeAdvance',40);const moving=await H.dbg('npcLife');
    expect(moving.filter(n=>start.some(o=>o.id===n.id&&(o.x!==n.x||o.y!==n.y))).length>=5,'住民が散歩しない');
    await H.shot('walking');
    // 原点に戻したあと、実際のタップ経路で話しかける。相手は選択中に逃げない。
    await H.dbg('teleport','town',12,10,'up');await H.idle();await H.wait(3300);
    for(const action of ['wave','stretch','think','yawn','hum','laugh','look','admire','shy','bow']){
      expect(await H.dbg('npcLifeAct','cat',action),'しぐさを開始できない');await H.wait(400);const n=(await H.dbg('npcLife')).find(n=>n.id==='cat');expect(n.action===action,'しぐさが再生されない');
      if(['wave','stretch','think','yawn'].includes(action))await H.shot(action);
    }
    expect(await H.dbg('npcLifeApproach','cat'),'話しかける経路がない');
    await H.page.locator('.dlg-text').waitFor();const talking=(await H.dbg('npcLife')).find(n=>n.id==='cat');expect(talking.talking,'会話中の状態でない');
    await H.wait(1000);const stopped=(await H.dbg('npcLife')).find(n=>n.id==='cat');expect(stopped.x===talking.x&&stopped.y===talking.y,'会話中に歩いた');await H.shot('talk');await H.dialogs();await H.idle();
    const after=await H.dbg('saveData');for(const key of ['coins','bag','furn','wardrobe','room'])expect(JSON.stringify(before[key])===JSON.stringify(after[key]),'住民の動作で資産が変わる '+key);
    await H.dbg('store','clothes','town');await H.idle();await H.wait(700);await H.shot('keeper');
    await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'また あとで',exact:true}).click();await H.idle();
    await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle());
    await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();expect((await H.dbg('saveData')).coins===before.coins,'再開で所持金が変わる');
  },{viewport,timeout:120000});
}
