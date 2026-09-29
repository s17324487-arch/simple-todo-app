export async function indoorWalkSmoke({scenario,expect}) {
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('indoor-walk-'+viewport.width,async H=>{
    await H.newGameFast(); const saved=await H.dbg('saveData');
    const settle=()=>H.until(()=>PokaDebug.indoorState()?.party.every(p=>!p.moving)&&!PokaDebug.indoorState().path);
    const begin=async d=>{
      const x=viewport.width*.53,y=viewport.height*.56,v=d.vector,n=Math.hypot(v.x,v.y);
      await H.page.mouse.move(x,y);await H.page.mouse.down();await H.page.mouse.move(x+v.x/n*60,y+v.y/n*60,{steps:3});
    };
    for(const [id,floor] of [['clothes'],['school'],['nursery'],['electronics'],['arcade'],['office'],['mall',1],['mall',12],['mall',13]]){
      if(id==='clothes')await H.dbg('store',id);else await H.dbg('venue',id,floor);
      await H.until(()=>!PokaDebug.state().transitioning);await H.dialogs();await H.idle();if(id==='mall')await H.until(()=>PokaDebug.venueIso()?.ready);await H.wait(200);
      const before=await H.dbg('indoorState'),d=before.directions.filter(d=>d.free>=2).sort((a,b)=>b.free-a.free)[0];
      expect(d,id+' 歩ける通路がない');await begin(d);
      await H.until(b=>{const s=PokaDebug.indoorState();return s.joy&&Math.abs(s.party[0].x-b.x)+Math.abs(s.party[0].y-b.y)>=2;},10000,before.party[0]);
      // スティックを保持して描画。停止するとロックでスティックが隠れるため通常描画を撮る。
      await H.shot(id+(floor||'')+'-drag',{pause:false});
      await H.page.mouse.up();await settle();const after=await H.dbg('indoorState');
      expect(!after.joy&&!after.pending,id+' 指を離しても入力が残る');
      expect((after.party[0].x-before.party[0].x)*d.dx+(after.party[0].y-before.party[0].y)*d.dy>0,id+' ドラッグと違う方向に移動');
      expect(after.party.length===3,id+' 3人同行が崩れる');
      await H.wait(450);expect(JSON.stringify((await H.dbg('indoorState')).party)===JSON.stringify(after.party),id+' 指を離した後に歩き続ける');
      // 短い床タップも残る（展示が被りにくい通常店の通路で実タップ）。
      if(id==='clothes'){
        const s=await H.dbg('storeState'),target=s.walkable.find(p=>p.x===5&&p.y===8);
        await H.tap(target.cx,target.cy);await settle();const tap=await H.dbg('indoorState');
        expect(tap.party[0].x===5&&tap.party[0].y===8,'床タップが効かない');
        await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();
        await H.page.getByRole('button',{name:'また あとで',exact:true}).click();await H.idle();
      }
    }
    // 壁の手前で停止、別の指では解除しない、pointercancel と画面離脱で解除。
    await H.dbg('venue','school');await H.idle();let s=await H.dbg('indoorState');
    const d=s.directions.filter(d=>d.free>0).sort((a,b)=>a.free-b.free)[0],end={x:s.party[0].x+d.dx*d.free,y:s.party[0].y+d.dy*d.free};
    await begin(d);await H.until(p=>{const l=PokaDebug.indoorState().party[0];return l.x===p.x&&l.y===p.y&&!l.moving;},15000,end);
    await H.wait(400);s=await H.dbg('indoorState');expect(s.party[0].x===end.x&&s.party[0].y===end.y,'壁をすり抜ける');
    await H.page.locator('canvas').first().dispatchEvent('pointercancel',{pointerId:99});expect((await H.dbg('indoorState')).joy,'別の指でスティック解除');
    await H.page.locator('canvas').first().dispatchEvent('pointercancel',{pointerId:1});await H.page.mouse.up();expect(!(await H.dbg('indoorState')).joy,'pointercancelで解除されない');
    s=await H.dbg('indoorState');await begin(s.directions.find(d=>d.free>0));await H.eval(()=>window.dispatchEvent(new Event('blur')));await H.page.mouse.up();
    expect(!(await H.dbg('indoorState')).joy,'画面離脱で解除されない');await settle();
    const after=await H.dbg('saveData');for(const k of ['coins','bag','furn','wardrobe'])expect(JSON.stringify(saved[k])===JSON.stringify(after[k]),'移動で所持品が変わる '+k);
  },{viewport,timeout:180000});
}
