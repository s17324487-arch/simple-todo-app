// コンビニ × ごわがの コラボ けいひん（js/conbini-collab.js・UI-86。オーナーの 指示 2026-10-04「景品は2店舗でコラボ系はことなり」）
// 1. せぶんぶんの ポイントカード（5000ポイント）→ けいひんは 9だん（200・500・800・3000 は コラボ）
// 2. 200: かんジュース → 4しゅから えらぶ まど（はみ出さない・44px）→ なかよし いちごミルク（もちもの）
// 3. 500: タンブラー（ごじ）・800: しましまざら（がちゃん）・3000: おふろ グッズ（わんこ せっけん）→ 家具・もってる かず・ポイント
// 4. ローリソンの まどは ちがう しなもの（グラス・プレート・おふろおけ）
// 5. おうちで おふろ グッズを タップ → ぴょこっ・3人が しゃべる・かんジュースを のむ
export async function conbiniCollabSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [];
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')), edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5 };
  }, tag);
  const btn = (H, name) => H.page.getByRole('button', { name, exact: true }).click();
  const pick = (H, name) => H.page.locator('.dlg-shade.ask .choices .btn').filter({ hasText: new RegExp('^' + name + '$') }).click();
  const say = async (H, re, ms = 10000) => {
    const t0 = Date.now();
    for (;;) {
      const hit = await H.eval((src) => { const t = document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent; return t == null ? null : new RegExp(src).test(t); }, re.source);
      if (hit === true) break;
      expect(Date.now() - t0 < ms, 'せりふが でない: ' + re.source);
      if (hit === false) await H.eval(() => document.querySelector('.dlg-shade:not(.ask)')?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
      await H.wait(90);
    }
    await H.dialogs();
  };
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + ' の 入口が ない');
    await H.dbg('teleport', 'town', door.x, door.y + 1, 'up'); await H.idle(); await H.dbg('walkTo', door.x, door.y);
    await H.until(() => PokaDebug.state().scene === 'store' && PokaDebug.idle(), 20000); await H.wait(400);
  };
  const openCard = async (H) => { await btn(H, 'てんいんと はなす'); await H.page.locator('.choices .btn').first().waitFor(); await btn(H, 'ポイントカード'); await H.page.locator('.modal-wrap:not(.out) .cc-wrap').waitFor(); await H.wait(250); };
  const rows = (H) => H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .cc-prize')].map((r) => ({ id: r.dataset.id, name: r.querySelector('b').textContent, cost: r.querySelector('.cc-cost').textContent, can: r.classList.contains('can') })));
  const kinds = (H) => H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .cc-kind')].map((b) => ({ id: b.dataset.kind, name: b.querySelector('.cc-kind-name').textContent, svg: !!b.querySelector('svg') })));
  const trade = async (H, tier, kind, re) => {
    await H.page.locator(`.cc-prize[data-id="${tier}"] .cc-trade`).click();
    await H.page.locator('.modal-wrap:not(.out) .cc-kind').first().waitFor(); await H.wait(200);
    const K = await kinds(H);
    expect(K.length === 4 && K.every((k) => k.svg && k.name) && K.some((k) => k.id === kind), tier + ': 4しゅから えらぶ ' + JSON.stringify(K));
    if (tier === 'can') { const L = await fits(H, 'kinds'); expect(!L.wide && !L.page && !L.small.length && L.edge, 'えらぶ まどが はみ出す・ボタンが ちいさい ' + JSON.stringify(L)); await H.shot('pick-' + tier); }
    await H.page.locator(`.modal-wrap:not(.out) .cc-kind[data-kind="${kind}"]`).click();
    await pick(H, 'こうかん'); await say(H, re); await H.wait(200);
  };

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('conbini-collab-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 5000);
    const layout = await H.dbg('townLayout', 'town');
    // 1. せぶんぶん: 9だん
    await H.dbg('conbiniCard', 'sevenbun', { pts: 5000 });
    await enterStore(H, layout, 'sevenbun'); await openCard(H);
    let R = await rows(H);
    expect(R.map((r) => r.id).join() === 'crane,can,cup,plate,lv10,lv25,bath,bus,owner' && R.filter((r) => r.can).length === 8 && /コラボ かんジュース/.test(R[1].name) && /0／4しゅ/.test(R[1].cost), '9だん ' + JSON.stringify(R));
    await H.shot('card');
    // 2. かんジュース（なかよし いちごミルク）
    await trade(H, 'can', 'cvc_sev_can_trio', /「なかよし いちごミルク」だよ/);
    let d = await H.dbg('saveData'), c = await H.dbg('conbiniCard', 'sevenbun');
    expect(d.bag.cvc_sev_can_trio === 1 && c.pts === 4800 && c.got.cvc_sev_can_trio === 1, 'かんジュースが もちものに ' + JSON.stringify({ bag: d.bag.cvc_sev_can_trio, c: c.pts }));
    expect(/1／4しゅ/.test((await rows(H))[1].cost), 'もってる かず');
    // 3. タンブラー・しましまざら・おふろ グッズ
    await trade(H, 'cup', 'cvc_sev_cup_goji', /「ごじ タンブラー」だよ/);
    await trade(H, 'plate', 'cvc_sev_plate_gachan', /「がちゃん しましまざら」だよ/);
    await trade(H, 'bath', 'cvc_sev_bath_wanko', /「わんこ せっけん」だよ/);
    d = await H.dbg('saveData'); c = await H.dbg('conbiniCard', 'sevenbun');
    expect(d.furn.cvc_sev_cup_goji === 1 && d.furn.cvc_sev_plate_gachan === 1 && d.furn.cvc_sev_bath_wanko === 1 && c.pts === 500, 'タンブラー・しましまざら・せっけんが 家具に ' + JSON.stringify(c.pts));
    R = await rows(H); expect(R.filter((r) => r.can).map((r) => r.id).join() === 'crane,can,cup', 'のこり 500ポイントで こうかん できる もの ' + JSON.stringify(R));
    await H.shot('card-after');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(260); await H.idle();
    await btn(H, 'おみせを でる'); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    // 4. ローリソンは ちがう しなもの
    await H.dbg('conbiniCard', 'lawson', { pts: 5000 });
    await enterStore(H, layout, 'lawson'); await openCard(H);
    for (const [tier, names] of [['cup', ['わんこ グラス', 'がちゃん グラス', 'ごじ グラス', 'なかよし グラス']], ['plate', ['わんこ プレート', 'がちゃん プレート', 'ごじ プレート', 'なかよし プレート']], ['bath', ['わんこ おふろおけ', 'がちゃん おふろ ひよこ', 'ごじ バスチェア', 'なかよし タオルかけ']]]) {
      await H.page.locator(`.cc-prize[data-id="${tier}"] .cc-trade`).click(); await H.page.locator('.modal-wrap:not(.out) .cc-kind').first().waitFor(); await H.wait(150);
      const K = await kinds(H); expect(JSON.stringify(K.map((k) => k.name)) === JSON.stringify(names), 'ローリソンの ' + tier + ' ' + JSON.stringify(K));
      if (tier === 'bath') await H.shot('pick-lawson-bath');
      await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(260);
    }
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(260); await H.idle();
    await btn(H, 'おみせを でる'); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    // 5. おうち: せっけんを タップ・かんジュースを のむ
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.dbg('homeLayout', [{ id: 'cvc_sev_bath_wanko', x: 300, y: 300 }, { id: 'cvc_sev_cup_goji', x: 420, y: 300 }]); await H.dbg('homeBubbleFixture'); await H.wait(900);
    let lv = await H.dbg('furnLive', 'cvc_sev_bath_wanko'); expect(lv && lv.tap, 'せっけんを タップする ところが ない ' + JSON.stringify(lv));
    const n0 = lv.n || 0;
    await H.tap(lv.tap.x, lv.tap.y); await H.wait(160); await H.shot('room-soap'); await H.wait(500);
    lv = await H.dbg('furnLive', 'cvc_sev_bath_wanko'); expect((lv.n || 0) === n0 + 1, 'せっけんを タップしても うごかない ' + JSON.stringify(lv));
    await H.dbg('smaho', 'bag'); await H.wait(400);
    await H.page.locator('.smaho-page .card').filter({ hasText: 'なかよし いちごミルク' }).first().click(); await H.page.locator('.choices .btn').first().waitFor();
    await H.page.locator('.dlg-shade.ask .choices .btn').first().click(); await H.wait(400);
    expect(!((await H.dbg('saveData')).bag.cvc_sev_can_trio > 0), 'かんジュースを のめない');
    await H.dbg('smaho', null); await H.idle();
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    d = await H.dbg('saveData'); expect(d.furn.cvc_sev_cup_goji === 1 && d.furn.cvc_sev_bath_wanko === 1 && (await H.dbg('conbiniCard', 'sevenbun')).got.bath === 1, 'さいかいで かわる');
  }, { viewport, timeout: 180000 });
}
