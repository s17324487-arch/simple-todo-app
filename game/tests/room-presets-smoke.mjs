export async function roomPresetsSmoke({scenario,expect}){
 for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('room-presets-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',7);await H.dbg('coins',987504);
  const before=await H.dbg('saveData');
  const open=async()=>{await H.houseButton('おへや');await H.page.getByRole('button',{name:'かぐの プリセット',exact:true}).click();};
  await open();await H.page.locator('[data-preset="0"]').getByRole('button',{name:'いまの へやを ほぞん',exact:true}).click();
  await H.page.locator('.dlg-shade input').fill('のんびり');await H.page.getByRole('button',{name:'けってい',exact:true}).click();
  await H.until(()=>PokaDebug.roomPresets()[0]?.name==='のんびり');await H.shot('saved');
  await H.page.keyboard.press('Escape');await H.idle();
  await H.dbg('homeLayout',[]);await open();await H.page.locator('[data-preset="0"]').getByRole('button',{name:'よびだす',exact:true}).click();
  await H.choose(0);await H.idle();const after=await H.dbg('saveData');
  const layout=r=>r.items.map(({uid,...it})=>it);expect(JSON.stringify(layout(before.room))===JSON.stringify(layout(after.room)),'配置を戻せない');
  for(const k of ['coins','furn','bag','wardrobe'])expect(JSON.stringify(before[k])===JSON.stringify(after[k]),k+'が変わる');
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  expect((await H.dbg('roomPresets'))[0].name==='のんびり','再読み込みで消えた');await H.shot('restored');
 },{viewport,timeout:90000});
}
