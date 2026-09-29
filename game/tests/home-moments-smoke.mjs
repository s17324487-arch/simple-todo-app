export async function homeMomentsSmoke({scenario,expect}) {
 for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('home-moments-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',20);await H.wait(200);await H.dbg('pause',true);
  const fixture=async()=>{await H.dbg('homeBubbleFixture');};
  const state=async who=>(await H.dbg('homeActions')).chars.find(c=>c.id===who);
  const act=async(who,kind)=>{expect(await H.dbg('homeAction',who,kind),'開始失敗 '+who+kind);for(let n=0;n<110;n++){if((await state(who)).activity?.stage==='act')return;await H.dbg('homeAdvance',.1);}throw Error('家具に到着しない '+who+kind);};
  const layout=[{id:'chair_wood',x:160,y:510},{id:'aquarium',x:365,y:440},{id:'bookshelf',x:100,y:385},{id:'plant',x:95,y:485}];
  await H.dbg('homeLayout',layout);await fixture();const before=await H.dbg('saveData');
  for(const who of ['wanko','gachan','goji','papa','mama'])for(const kind of ['sit','aquarium']){
    await fixture();await act(who,kind);const c=await state(who);expect(c.activity.uid===(kind==='sit'?1:2),'違う家具を使用');
    if(kind==='sit'){expect(c.activity.lift>0&&c.y<layout[0].y,'床に立ったまま');expect(!await H.dbg('homeAction',who==='wanko'?'mama':'wanko','sit'),'同じ椅子の二重使用');}
    await H.dbg('homeAdvance',.4);await H.dbg('homeThought',who,kind==='sit'?0:1);await H.wait(350);
    const bubble=(await H.dbg('homeBubbleState')).boxes.find(b=>b.id===who);expect(bubble?.kind==='think'&&bubble.w<=172,'雲のこころの声でない');
    if(who==='goji'||who==='mama')await H.shot(who+'-'+kind);
    await H.dbg('homeAdvance',8);expect(!(await state(who)).activity,'動作が終了しない');
  }
  for(const id of ['chair_wood','stool_oak','sofa','cloudsofa']){
    await H.dbg('homeLayout',[{id,x:230,y:450,flip:true}]);await fixture();await act('papa','sit');expect((await state('papa')).activity.flip,'反転未対応');
    await H.dbg('homeLayout',[]);await H.dbg('homeAdvance',.1);expect(!(await state('papa')).activity,'撤去後も座り続ける');
  }
  await H.dbg('homeLayout',layout);await fixture();await act('mama','sit');await H.dbg('hour',10);await H.dbg('homeAdvance',.2);expect(!(await state('mama')).activity,'出勤後も座り続ける');expect(!await H.dbg('homeAction','papa','aquarium'),'留守の親が動作');
  await H.dbg('hour',20);await H.dbg('homeAdvance',.2);await fixture();await act('wanko','sit');
  await H.houseButton('もようがえ');await H.dbg('homeAdvance',.1);expect(!(await state('wanko')).activity,'模様替えで動作が中断しない');await H.page.getByRole('button',{name:'おわる',exact:true}).click();
  const after=await H.dbg('saveData');for(const key of ['coins','bag','wardrobe'])expect(JSON.stringify(before[key])===JSON.stringify(after[key]),'動作で所持品変更 '+key);
  await H.dbg('pause',false);
 },{viewport,timeout:150000});
}
