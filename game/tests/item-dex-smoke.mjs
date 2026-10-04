import {readFileSync} from 'node:fs';

// Real player JSON goes through PokaDebug and the ordinary load/migrate path.
const itemDexV1Fixture=JSON.parse(readFileSync(new URL('./fixtures/save-v1.json',import.meta.url),'utf8'));

export async function itemDexSmoke({scenario,expect}) {
  const screens=[{width:390,height:844},{width:375,height:667}];
  const retained=(before,after,path)=>{
    if(before&&typeof before==='object'){
      expect(after&&typeof after==='object','旧セーブの記録がなくなった: '+path);
      for(const [key,value] of Object.entries(before)){
        expect(Object.hasOwn(after,key),'旧セーブの記録がなくなった: '+path+'.'+key);
        retained(value,after[key],path+'.'+key);
      }
    }else expect(after===before,'旧セーブの記録が変化: '+path);
  };
  const assetView=d=>({coins:d.coins,bag:d.bag,furn:d.furn,wardrobe:d.wardrobe,room:d.room,rooms:d.rooms,
    shops:d.shops,flags:d.flags,outfits:Object.fromEntries(Object.entries(d.chars).map(([id,c])=>[id,c.outfit]))});
  const kept=(before,after,withCoins=true)=>{
    const a=assetView(before),b=assetView(after);
    if(!withCoins){delete a.coins;delete b.coins;}
    for(const key of Object.keys(a))expect(JSON.stringify(a[key])===JSON.stringify(b[key]),'ずかんで既存データが変わった: '+key);
  };
  const reload=async H=>{
    await H.page.reload();
    await H.page.getByRole('button',{name:'つづきから',exact:true}).click();
    await H.idle(30000);
    await H.dbg('pause',true);
  };
  const ids=H=>H.page.locator('.item-dex-card').evaluateAll(cards=>cards.map(card=>card.dataset.id));
  const closeDetail=async H=>{
    await H.page.locator('.modal-wrap:not(.out) .item-dex-detail .close').click();
    await H.page.locator('.modal-wrap:not(.out) .item-dex-detail').waitFor({state:'detached'});
  };
  const tab=async(H,kind)=>{
    await H.page.locator('.dex-kinds [data-k="'+kind+'"]').click();
    await H.page.locator('.item-dex').waitFor();
  };
  const layout=async(H,selector)=>{
    expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth+1),'ずかんが画面の横にはみ出す');
    const overflow=await H.eval(()=>[...document.querySelectorAll('.smaho-body,.item-dex-detail .panel-body')]
      .some(el=>el.scrollWidth>el.clientWidth+2));
    expect(!overflow,'ずかん/詳細の中身が横にはみ出す');
    const targets=H.page.locator(selector);
    for(let i=0;i<await targets.count();i++){
      const target=targets.nth(i);if(!await target.isVisible())continue;
      await target.scrollIntoViewIfNeeded();const box=await target.boundingBox(),viewport=H.page.viewportSize();
      expect(box&&box.width>=43.5&&box.height>=43.5,'ずかんのタップ領域が小さい: '+selector);
      expect(box.x>=-1&&box.x+box.width<=viewport.width+1,'ずかんのボタンが横にはみ出す');
      expect(box.y>=-1&&box.y+box.height<=viewport.height+1,'スクロールしてもずかんのボタンへ届かない');
    }
  };

  for(const viewport of screens)await scenario('item-dex-'+viewport.width,async H=>{
    await H.newGameFast();
    const catalog={furn:await H.dbg('itemDex','furn'),wear:await H.dbg('itemDex','wear')};
    const legacy=JSON.parse(JSON.stringify(itemDexV1Fixture));
    legacy.last=Date.now();
    for(const row of catalog.furn.entries.slice(0,20))legacy.furn[row.id]=3;
    for(const row of catalog.wear.entries.slice(0,20))legacy.wardrobe[row.id]=true;
    const quiz=catalog.furn.entries.find(row=>row.id.startsWith('quiz_'));
    expect(quiz&&quiz.rare,'クイズ限定家具が図鑑の表にない');legacy.furn[quiz.id]=1;
    legacy.furn.future_furniture=7;legacy.wardrobe.future_clothing=true;
    expect(legacy.coins===987654&&!legacy.itemDex,'v1互換性の検証データが違う');
    await H.dbg('seedLegacySave',legacy);await reload(H);
    const loaded=await H.dbg('saveData');
    for(const key of ['coins','bag','furn','wardrobe','room'])expect(JSON.stringify(loaded[key])===JSON.stringify(legacy[key]),'旧セーブが変化: '+key);
    // WorldScene.enter records the first visit to town; every pre-existing nested flag must survive it.
    retained(legacy.flags,loaded.flags,'flags');
    expect(loaded.flags.visit_town===true,'旧セーブから再開した町の訪問記録が付かない');
    for(const id of ['wanko','gachan','goji'])expect(JSON.stringify(loaded.chars[id].outfit)===JSON.stringify(legacy.chars[id].outfit),'旧セーブの服が変化: '+id);
    const baseline=await H.dbg('saveData');
    await H.dbg('smaho','dex');
    expect((await H.dbg('smahoState')).app==='dex','通常のすまほからずかんを開けない');
    for(const kind of ['furn','wear','enemy','fish','fossil'])expect(await H.page.locator('.dex-kinds [data-k="'+kind+'"]').count()===1,'ずかんのタブがない: '+kind);

    for(const kind of ['furn','wear']){
      await tab(H,kind);const state=await H.dbg('itemDex',kind),byId=new Map(state.entries.map(row=>[row.id,row]));
      expect(state.total===state.entries.length&&new Set(state.entries.map(row=>row.id)).size===state.total,'種類の総数が重複/欠落');
      expect(state.collected>=20&&state.ready.includes(10)&&state.ready.includes(20),'旧所持品が登録されない');
      expect(!byId.has('future_furniture')&&!byId.has('future_clothing'),'不明なIDが図鑑に表示される');
      expect((await H.page.locator('.item-dex-total').textContent()).includes(state.collected+' / '+state.total),'集めた数/全種類が表示されない');
      expect(await H.page.locator('.item-dex-card').count()<=24,'1ページの描画数が24を超える');
      await layout(H,'.dex-kinds button,.item-dex-search,.item-dex-category,.item-dex-filter,.item-dex-claim');
      await H.page.locator('.item-dex-search').scrollIntoViewIfNeeded();await H.shot(kind+'-list');

      // Visit every page once: complete catalog, stable order, no duplicated entries.
      const visited=[];let page=0;
      for(;;){
        const current=await ids(H);expect(current.length>0&&current.length<=24,'ページの表示数が不正');
        visited.push(...current);
        expect(page>0||await H.page.locator('.item-dex-prev').isDisabled(),'最初のページで前へ進める');
        const next=H.page.locator('.item-dex-next');if(!await next.count()||await next.isDisabled())break;
        await next.click();page++;expect(page<Math.ceil(state.entries.length/24),'ページ送りが終わらない '+page); // ページの かずは ずかんの しゅるいで きまる（家具が ふえても よい）
      }
      expect(JSON.stringify(visited)===JSON.stringify(state.entries.map(row=>row.id)),'ページ送りで種類が欠落/重複');
      expect(page>0,'ページ送りの検証対象がない');
      await H.page.locator('.item-dex-prev').click();
      expect((await ids(H))[0]===state.entries[(page-1)*24].id,'前のページへ戻れない');

      // Each filter resets to page 1 and respects both category and collection status.
      for(const filter of ['seen','missing','rare','all']){
        await H.page.locator('.item-dex-filter').selectOption(filter);
        const expected=state.entries.filter(row=>filter==='all'||filter==='seen'&&row.seen||filter==='missing'&&!row.seen||filter==='rare'&&row.rare);
        expect(JSON.stringify(await ids(H))===JSON.stringify(expected.slice(0,24).map(row=>row.id)),'絞り込みが違う: '+kind+'/'+filter);
      }
      const categories=await H.page.locator('.item-dex-category option').evaluateAll(options=>options.map(option=>option.value));
      for(const category of categories.filter(value=>value!=='all')){
        await H.page.locator('.item-dex-category').selectOption(category);
        expect(JSON.stringify(await ids(H))===JSON.stringify(state.entries.filter(row=>row.category===category).slice(0,24).map(row=>row.id)),'部位/家具の種類で絞れない: '+category);
      }
      await H.page.locator('.item-dex-category').selectOption('all');

      await H.page.locator('.item-dex-filter').selectOption('missing');
      const unknown=H.page.locator('.item-dex-card').first(),unknownId=await unknown.getAttribute('data-id');
      expect(await unknown.locator('.item-dex-name').textContent()==='？？？','未入手の名前が隠れていない');
      expect((await unknown.getAttribute('class')).includes('unknown'),'未入手がシルエットにならない');
      await unknown.click();
      const detail=H.page.locator('.modal-wrap:not(.out) .item-dex-detail');
      await detail.locator('.item-dex-preview > svg').waitFor({state:'visible'});
      expect(await detail.locator('.item-dex-preview.unknown > svg').count()===1,'未入手の詳細がシルエットでない');
      expect((await detail.locator('.item-dex-hint p').textContent()).trim().length>0,'未入手の入手ヒントがない');
      expect(!await detail.locator('.item-dex-who').count(),'未入手の服を試着できてしまう');
      expect(!(await detail.textContent()).includes(byId.get(unknownId).name),'未入手の詳細が名前を公開する');
      await H.shot(kind+'-unknown');await closeDetail(H);

      // Search a collected rare and inspect real art without changing saved possessions.
      await H.page.locator('.item-dex-filter').selectOption('all');
      const known=kind==='furn'?state.entries.find(row=>row.id===quiz.id):state.entries.find(row=>row.seen&&row.rare);
      expect(known&&known.name,'表示名/レアの検証対象がない');
      await H.page.locator('.item-dex-search').fill(known.name);
      expect((await ids(H)).includes(known.id),'名前で検索できない');
      await H.page.locator('.item-dex-card[data-id="'+known.id+'"]').click();
      await detail.locator('.item-dex-preview > svg').waitFor({state:'visible'});
      expect(await detail.locator('.item-dex-preview > svg').count()===1,'入手済みの絵がない');
      expect(await detail.locator('.item-dex-preview.unknown').count()===0,'入手済みの絵がシルエットのまま');
      expect((await detail.locator('.panel-title').textContent()).includes(known.name),'入手済みの名前が表示されない');
      expect((await detail.locator('.item-dex-hint p').textContent()).trim().length>0,'入手済みの入手ヒントがない');
      if(kind==='wear'){
        const pictures=[];
        for(const who of ['wanko','gachan','goji']){
          const button=detail.locator('.item-dex-who button[data-id="'+who+'"]');await button.click();
          expect(await button.getAttribute('aria-pressed')==='true','試着する仲間を選べない: '+who);
          pictures.push(await detail.locator('.item-dex-preview').innerHTML());
        }
        expect(new Set(pictures).size===3,'3人の試着画像が切り替わらない');
        await detail.locator('.item-dex-turn').click();
        expect(await detail.locator('.item-dex-preview').innerHTML()!==pictures.at(-1),'服の前後を見られない');
        await layout(H,'.modal-wrap:not(.out) .item-dex-who button,.modal-wrap:not(.out) .item-dex-turn');
      }
      await H.shot(kind+'-detail');await closeDetail(H);
      await H.page.locator('.item-dex-search').fill('ぜったいに みつからない ずかんの ことば');
      expect(await H.page.locator('.item-dex-card').count()===0&&await H.page.locator('.item-dex-empty').count()===1,'検索結果ゼロが表示されない');
      await H.page.locator('.item-dex-search').fill('');
      kept(baseline,await H.dbg('saveData'));
    }

    // Existing fish/fossil/enemy pages remain reachable through the same five-tab menu.
    for(const kind of ['enemy','fish','fossil']){
      await H.page.locator('.dex-kinds [data-k="'+kind+'"]').click();
      expect(await H.page.locator('.smaho-body .item-dex').count()===0,'元のずかんへ切り替わらない: '+kind);
      expect((await H.page.locator('.smaho-body').textContent()).trim().length>30,'元のずかんが空: '+kind);
    }
    kept(baseline,await H.dbg('saveData'));

    // Use the real reward button, then repeat through the debug boundary after reload.
    let rewards=0;
    for(const kind of ['furn','wear']){
      await tab(H,kind);
      for(const threshold of [10,20]){
        await H.page.locator('.item-dex-claim[data-threshold="'+threshold+'"]').click();rewards++;
        expect((await H.dbg('saveData')).coins===baseline.coins+100*rewards,'種類のごほうびが100コインでない');
        expect(await H.dbg('itemDexClaim',kind,threshold)===false,'ごほうびを続けて二重受領できる');
      }
    }
    await H.dbg('smaho',null);await H.dbg('save');await reload(H);
    kept(baseline,await H.dbg('saveData'),false);
    expect((await H.dbg('saveData')).coins===baseline.coins+400,'再読込でごほうびのコインが変わる');
    for(const kind of ['furn','wear'])for(const threshold of [10,20])expect(await H.dbg('itemDexClaim',kind,threshold)===false,'再読込後にごほうびを二重受領できる');
    expect((await H.dbg('persistedSave')).coins===baseline.coins+400,'二重受領の試行で保存コインが変わる');
  },{viewport,timeout:180000});
}
