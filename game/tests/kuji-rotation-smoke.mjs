// いちばんくじの いれかわる けいひん（js/kuji-rotation.js・js/kuji-rotation-art.js・UI-112。オーナーの 指示 2026-10-09「一番くじは定期的に景品を変えて。」）
// 1. ローリソンの くじを「よるの パジャマ パーティー」に（PokaDebug.kujiTheme）→ たな → ボード: あたらしい けいひん・「あたらしい くじが はいったよ」・いつまで／つぎの セット・はみ出さない
// 2. 1まい ひく（Aしょう）→ ナイトキャップ ごじ（家具）
// 3. せぶんぶん「フルーツ パーラー」の ボード
// 4. おうちに あたらしい けいひんを おく（ぬいぐるみ・クッション・マグ・タペストリー）→ タップで ぎゅっ
export async function kujiRotationSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [], rota = document.querySelector('.kuji-rota');
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent), rota: rota ? rota.textContent : '', rotaFit: !!rota && r(rota).right <= r(pn).right + 0.5 && r(rota).left >= r(pn).left - 0.5 };
  });
  const phase = (H, p, ms = 10000) => H.until((p) => { const u = PokaDebug.kujiUi(); return u && u.open && u.phase === p; }, ms, p);
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + ' の 入口が ない');
    await H.dbg('teleport', 'town', door.x, door.y + 1, 'up'); await H.idle(); await H.dbg('walkTo', door.x, door.y);
    await H.until(() => PokaDebug.state().scene === 'store' && PokaDebug.idle(), 20000); await H.wait(400);
  };
  const tapShelf = async (H, shop) => {
    if (await H.dbg('storeWalkTo', 8, 3)) await H.until(() => { const s = PokaDebug.storeState(); return s && !s.party[0].moving && !s.path; }, 15000);
    await H.wait(700);
    const st = await H.dbg('storeState'), fx = st.fixtures.find((f) => f.kind === 'kuji_' + shop);
    await H.tap(fx.cx, fx.cy); await phase(H, 'board', 20000); await H.wait(300);
  };
  const names = (H) => H.eval(() => [...document.querySelectorAll('.kuji-top .kuji-name, .kuji-lasttext b')].map((e) => e.textContent));
  const title = (H) => H.eval(() => (document.querySelector('.kuji-title') || {}).textContent || '');
  const btn = (H, name) => H.page.getByRole('button', { name, exact: true }).click();
  const closeBoard = async (H) => { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && !PokaDebug.kujiUi().open && PokaDebug.idle(), 8000); };

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('kuji-rotation-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 50000); await H.dbg('kujiFast', 4);
    expect(await H.dbg('kujiTheme', 'lawson', 'law2') && await H.dbg('kujiTheme', 'sevenbun', 'sev2'), 'セットを きめられない');
    const layout = await H.dbg('townLayout', 'town');
    // 1. ローリソン
    await enterStore(H, layout, 'lawson'); await tapShelf(H, 'lawson');
    let N = await names(H), L = await fits(H), k = await H.dbg('kuji', 'lawson');
    expect(k.theme === 'law2' && /よるの パジャマ パーティー/.test(await title(H)) && N.some((n) => /ナイトキャップ ごじ/.test(n)) && N.some((n) => /おふとん/.test(n)) && !N.some((n) => /てんいん ごじ/.test(n)), 'あたらしい セットの ボード ' + JSON.stringify(N));
    expect(/がつ \d+にち まで。つぎは「(てんいんさん|よるの パジャマ パーティー)」/.test(L.rota) && L.rotaFit, 'いつまで・つぎの セットの しらせ ' + L.rota);
    expect(!L.wide && !L.page && !L.small.length, 'ボードが はみ出す・ボタンが ちいさい ' + JSON.stringify(L.small));
    await H.shot('lawson-board');
    // 2. Aしょう
    await H.dbg('kujiNext', 'A'); await btn(H, '1まい ひく（1000コイン）'); await phase(H, 'box'); await btn(H, 'くじを とる（1まい）'); await phase(H, 'tickets'); await H.wait(200);
    const t = await H.eval(() => { const r = document.querySelector('.kuji-ticket').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.75 }; });
    await H.page.mouse.move(t.x, t.y); await H.page.mouse.down(); await H.page.mouse.move(t.x, t.y - 44, { steps: 6 }); await H.page.mouse.up();
    await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(500);
    await btn(H, 'てんいんさんに わたす'); await phase(H, 'result'); await H.wait(300); await H.shot('lawson-result');
    let d = await H.dbg('saveData'); k = await H.dbg('kuji', 'lawson');
    expect(d.furn.kj_law2_a === 1 && k.got.includes('kj_law2_a') && k.left === 79, 'ナイトキャップ ごじが もらえない');
    await closeBoard(H);
    // 3. せぶんぶん
    await enterStore(H, layout, 'sevenbun'); await tapShelf(H, 'sevenbun');
    N = await names(H); L = await fits(H);
    expect(/フルーツ パーラー/.test(await title(H)) && N.some((n) => /いちご わんこ/.test(n)) && N.some((n) => /パフェ/.test(n)) && /つぎは「(ほかほか|フルーツ パーラー)」/.test(L.rota) && !L.wide && !L.page && !L.small.length, 'せぶんぶんの あたらしい セット ' + JSON.stringify(N) + L.rota);
    await H.shot('sevenbun-board');
    await closeBoard(H);
    // 4. おうち
    await btn(H, 'おみせを でる'); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.dbg('homeLayout', [{ id: 'kj_law2_a', x: 250, y: 300 }, { id: 'kj_sev2_l', x: 400, y: 330 }, { id: 'kj_law2_d0', x: 170, y: 430 }, { id: 'kj_sev2_e1', x: 330, y: 470 }, { id: 'kj_law2_dc', x: 200, y: 110 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(1200);
    let lv = await H.dbg('furnLive', 'kj_sev2_l'); expect(lv && lv.tap, 'パフェの ぬいぐるみを タップする ところが ない');
    const n0 = lv.n || 0; await H.tap(lv.tap.x, lv.tap.y); await H.wait(160); await H.shot('room');
    await H.wait(400); lv = await H.dbg('furnLive', 'kj_sev2_l'); expect((lv.n || 0) === n0 + 1, 'タップしても うごかない');
  }, { viewport, timeout: 200000 });
}
