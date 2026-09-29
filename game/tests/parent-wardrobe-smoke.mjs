export async function parentWardrobeSmoke({scenario,expect}){
 for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('parent-wardrobe-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',20);await H.dbg('unlockAll');await H.dbg('homeBubbleFixture');
  const before=await H.dbg('saveData'),view=await H.dbg('homeDesign');
  for(const id of ['papa','mama']){const r=view.actors.find(a=>a.id===id).rect;await H.page.mouse.click(r.x+r.w/2,r.y+r.h/2);await H.wait(150);expect(await H.page.locator('.modal-wrap').count()===0,'親タップで画面が開く');}
  await H.page.getByRole('button',{name:'ぱぱ・まま',exact:true}).click();await H.page.getByRole('button',{name:'きがえ・みため',exact:true}).click();
  const modal=H.page.locator('.modal-wrap').last();
  await modal.getByLabel('かみがた',{exact:true}).selectOption('twintail');await modal.getByLabel('かお',{exact:true}).selectOption('shy');await modal.getByLabel('かみのいろ',{exact:true}).selectOption('rose');
  await modal.locator('.grid button.card').nth(1).click();
  expect(!!(await H.dbg('family')).looks.papa.equipment.body,'ぱぱに着せられない');
  await modal.getByRole('button',{name:'まま',exact:true}).click();await modal.getByLabel('かみがた',{exact:true}).selectOption('bun');await modal.getByLabel('かお',{exact:true}).selectOption('confident');await modal.locator('.grid button.card').nth(2).click();
  await H.shot('wardrobe');
  const looks=(await H.dbg('family')).looks;const after=await H.dbg('saveData');for(const k of ['coins','furn','wardrobe'])expect(JSON.stringify(before[k])===JSON.stringify(after[k]),k+' changed');
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  expect(JSON.stringify((await H.dbg('family')).looks)===JSON.stringify(looks),'再読込で見た目が消える');
 },{viewport,timeout:90000});
}
