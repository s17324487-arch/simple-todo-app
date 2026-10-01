// ネリカスタウンの いらいの けいじばん（js/neri-quests.js）: たいじ・おつかい・さがしもの を うけて、やって、ほうこく
export async function nerikasuQuestsSmoke({scenario,expect,folkTalk,folkTapSpot}){
  // けいじばんは 日づけで かわるので、きまった 日で ためす（ねこ・ポーチ・ココア・からあげ・キノッコ・アカプルン の 日）。
  // ほかの 日の いらいは NERI_QUEST_DAY=2026-1-4 などで ためせる
  const DAY=process.env.NERI_QUEST_DAY||'2026-10-5';
  const openBoard=async(H)=>{
    const at0=await H.dbg('questBoardAt');await H.dbg('teleport','town',at0.x,at0.y+1,'up');await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);await H.wait(300);
    const at=await H.dbg('questBoardAt');await H.tap(at.cx,at.cy);await H.page.locator('.modal-wrap .neri-quests').waitFor({timeout:8000});await H.wait(250);
  };
  const closeBoard=async(H)=>{await H.page.locator('.modal-wrap .close').last().click();await H.idle();};
  for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('neri-quests-'+viewport.width,async H=>{
    await H.newGameFast();await H.dbg('hour',12);await H.dbg('today',DAY);await H.dbg('weather','clear');await H.dbg('coins',1000);
    // けいじばん（おうちの ひだり よこ）を タップ → きょうの 6まい（たいじ 2・おつかい 2・さがしもの 2）
    await openBoard(H);await H.until(()=>!document.querySelector('.toast'),6000);await H.shot('board');
    let q=await H.dbg('quests');
    expect(q.day===DAY&&q.board.length===6&&['hunt','errand','find'].every(t=>q.board.filter(b=>b.type===t).length===2),'けいじばんの いらいが 6まい（2・2・2）で ない '+JSON.stringify(q.board));
    const lay=await H.eval(()=>{const r=e=>e.getBoundingClientRect();return {over:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.nq-card')].every(c=>r(c).left>=-1&&r(c).right<=innerWidth+1),btn:[...document.querySelectorAll('.nq-btns .btn')].every(b=>r(b).height>=43.5&&r(b).width>=43.5),n:document.querySelectorAll('.nq-card').length,heads:[...document.querySelectorAll('.nq-head')].every(h=>r(h).height<=46&&h.scrollWidth<=h.clientWidth+1)};});
    expect(!lay.over&&lay.cards&&lay.btn&&lay.heads&&lay.n===6,'けいじばんの 画面が はみ出す '+JSON.stringify(lay));
    const hunt=q.board.find(b=>b.type==='hunt'),errand=q.board.find(b=>b.type==='errand'),find=q.board.find(b=>b.type==='find');
    for(const b of [hunt,errand,find])await H.page.getByRole('button',{name:`「${b.title}」を うける`,exact:true}).click();
    const other=q.board.find(b=>![hunt,errand,find].includes(b));
    expect(await H.page.getByRole('button',{name:`「${other.title}」を うける`,exact:true}).isDisabled(),'4つめの いらいを うけられる');
    await H.shot('accepted');await closeBoard(H);
    q=await H.dbg('quests');expect(q.active.length===3&&q.active.every(a=>!a.progress.done),'いらいを 3つ うけられない');
    // たいじ: その モンスターに かつ（3びきずつ）
    for(let left=hunt.n;left>0;left-=3){
      await H.dbg('battle',Array.from({length:Math.min(3,left)},()=>({kind:hunt.enemy,lv:1})),'meadow');await H.until(()=>G.sceneName==='battle',10000);
      await H.fightToEnd();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),20000);
    }
    q=await H.dbg('quests');expect(q.active.find(a=>a.id===hunt.id).progress.done,'たいじが すすまない '+JSON.stringify(q.active));
    // おつかい: まだ もって いない ときは ひとこと（もって きて ね）→ ふだんの 会話も つづく（はじめての あいさつが すむ）
    const had=(await H.dbg('saveData')).bag[errand.item]||0;
    {const s=await H.dbg('saveData');s.bag[errand.item]=0;await H.dbg('seedSave',s);} // 0 に する（けすと Save.migrate が はじめの もちもの（おにぎり 3こ）を おぎなう）
    await folkTalk(H,errand.to,{greet:false});await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:10000});
    expect(/もって きて ね/.test(await H.eval(()=>document.querySelector('.dlg-text')?.textContent||'')),'おつかいの ヒントが 出ない');
    for(let i=0;i<4;i++){await H.dialogs();const c=await H.page.locator('.choices .btn').count();if(!c)break;await H.choose(c-1);}await H.idle();
    {const s=await H.dbg('saveData');q=await H.dbg('quests');expect(s.flags.talked[errand.to]&&!q.active.find(a=>a.id===errand.id).progress.done,'おつかいの あいてと ふだんの 会話が できない');}
    // しなものを もって、たのんだ 町の人に はなす → わたす
    {const s=await H.dbg('saveData');s.bag[errand.item]=had+errand.n;await H.dbg('seedSave',s);}
    await folkTalk(H,errand.to,{greet:false});await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:10000});
    expect(/ありがとう/.test(await H.eval(()=>document.querySelector('.dlg-text')?.textContent||'')),'おつかいの おれいが 出ない');await H.dialogs();await H.idle();
    q=await H.dbg('quests');expect(q.active.find(a=>a.id===errand.id).progress.done&&((await H.dbg('saveData')).bag[errand.item]||0)===had,'おつかいで わたせない');
    // さがしもの: きらきら（はずれ →「ここには ない」→ あたり）。ねこ・インコは ついて くる
    const spots=(await H.dbg('folkSpots','town')).filter(s=>s.req==='neriq:'+find.id);
    expect(spots.length>=4&&spots.filter(s=>s.hit).length===1,'さがしものの きらきらが ない '+spots.length);
    const miss=spots.find(s=>!s.hit),hit=spots.find(s=>s.hit);
    // ことばは 1もじずつ でるので、でおわった しるし（.dlg-next）を まってから よむ（WebKit で 会話が おそく ひらくと とちゅうの 文を よんで いた）
    await folkTapSpot(H,'town',miss);await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:10000});expect(/ここには ない/.test(await H.eval(()=>document.querySelector('.dlg-text').innerText)),'はずれの ことばが 出ない');await H.dialogs();await H.idle();
    await folkTapSpot(H,'town',hit,'found');await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:10000});await H.dialogs();await H.idle();
    q=await H.dbg('quests');expect(q.active.find(a=>a.id===find.id).progress.done,'さがしものが みつからない');
    if(find.follow){expect(await H.dbg('folkKitten'),'みつけた どうぶつが ついて こない');await H.shot('follow');}
    expect(!(await H.dbg('folkSpots','town')).some(s=>s.req==='neriq:'+find.id),'みつけた あとも きらきらが のこる');
    // すまほの「いらい」: 3つとも ほうこく できる
    await H.phone('いらい');expect(await H.page.locator('.smaho .nq-prog.ok').count()===3,'すまほの いらいに ほうこく できる しるしが ない');
    {const ph=await H.eval(()=>[...document.querySelectorAll('.smaho .nq-head')].map(h=>({h:Math.round(h.getBoundingClientRect().height),over:h.scrollWidth>h.clientWidth+1})));expect(ph.length===3&&ph.every(p=>p.h<=46&&!p.over),'すまほの いらいの 見出しが 2行に なる '+JSON.stringify(ph));}await H.shot('phone');
    await H.page.locator('.smaho-close').click();await H.idle();
    // けいじばんで ほうこく → ほうしゅう
    const coins0=(await H.dbg('saveData')).coins;await openBoard(H);
    for(const b of [hunt,errand,find])await H.page.getByRole('button',{name:`「${b.title}」を ほうこくする`,exact:true}).click();
    await H.shot('reported');
    const d=await H.dbg('saveData');expect(d.coins===coins0+hunt.reward+errand.reward+find.reward,'ほうしゅうが ちがう '+[coins0,d.coins]);
    q=await H.dbg('quests');expect(!q.active.length&&q.done.length===3&&q.total===3&&q.earned===hunt.reward+errand.reward+find.reward,'ほうこくが のこらない');
    expect(await H.eval(()=>[...document.querySelectorAll('.nq-stamp')].length)===3,'おわった いらいに しるしが ない');
    await closeBoard(H);if(find.follow)expect(!(await H.dbg('folkKitten')),'ほうこくした あとも ついて くる');
    // さいかいしても そのまま
    await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
    await H.dbg('today',DAY);q=await H.dbg('quests');const back=await H.dbg('saveData');expect(q.total===3&&q.done.length===3&&back.coins===d.coins,'さいかいで いらいの きろくが かわる');
  },{viewport,full:viewport.width===375,timeout:240000});
}
