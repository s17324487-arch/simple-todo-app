export async function homeGardenSmoke({scenario,expect}){
 for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('home-garden-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',20);await H.dbg('coins',987504);const before=await H.dbg('saveData');
  await H.houseButton('おへや');await H.page.locator('[data-room="yard"]').getByRole('button',{name:'おへやを かう',exact:true}).click();await H.choose(0);await H.idle();
  const save=await H.dbg('saveData');expect(save.rooms.active==='yard'&&save.coins===before.coins-20000,'購入と移動');
  expect(JSON.stringify(save.rooms.stored.main.items)===JSON.stringify(before.room.items),'室内の家具が変わった');
  let v=await H.dbg('homeDesign');expect(v.background.includes(':yard:'),'お庭の背景');expect(v.actors.filter(a=>['wanko','gachan','goji'].includes(a.id)).length===3,'3人がいない');
  for(const changed of [viewport.width===390?{width:375,height:667}:{width:390,height:844},viewport]){
   await H.page.setViewportSize(changed);await H.wait(200);
   const controls=await H.page.locator('.parent-open').boundingBox(),care=await H.page.locator('.care-bar').boundingBox();
   expect(controls.y>=care.y+care.height+4,'画面サイズ変更で操作ボタンがおなか表示と重なる');
  }
  // おにわでも 2本ゆびの ピンチで ズーム → とじると ぜんたいに もどる
  await H.pinch(viewport.width/2,viewport.height*0.55,70,140);expect((await H.dbg('homeDesign')).zoom>1.5,'おにわで ピンチの 拡大が できない');
  await H.pinch(viewport.width/2,viewport.height*0.55,150,40);const z=await H.dbg('homeDesign');expect(z.zoom===1&&z.pan.x===0&&z.pan.y===0,'おにわで ピンチで 全体に もどらない');
  await H.shot('resized');await H.shot('garden');await H.houseButton('もようがえ');expect(await H.page.getByRole('button',{name:'かべがみ',exact:true}).count()===0,'お庭に室内の壁タブ');await H.page.getByRole('button',{name:'おわる',exact:true}).click();
  await H.houseButton('おへや');await H.page.getByRole('button',{name:'かぐの プリセット',exact:true}).click();await H.page.locator('[data-preset="0"]').getByRole('button',{name:'いまの へやを ほぞん',exact:true}).click();await H.page.locator('.dlg-shade input').fill('おちゃの にわ');await H.page.getByRole('button',{name:'けってい',exact:true}).click();await H.page.keyboard.press('Escape');await H.idle();
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();expect((await H.dbg('saveData')).rooms.active==='yard','再読み込みで別室になる');expect((await H.dbg('roomPresets'))[0].name==='おちゃの にわ','庭プリセット消失');
  await H.houseButton('おへや');await H.page.locator('[data-room="main"]').getByRole('button',{name:'このへやへ',exact:true}).click();await H.idle();const after=await H.dbg('saveData');expect(JSON.stringify(before.room.items)===JSON.stringify(after.room.items),'おうちに帰ると家具が変わる');expect(after.coins===before.coins-20000,'余分な支払い');
 },{viewport,timeout:90000});
}
