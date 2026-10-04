// おねがいの おれいの しな（js/wish-gifts.js・UI-70。オーナーの FB 2026-10-03）
// ① がちゃんの おねがい（ショートケーキ）→ ぎゅー → がちゃんが「おてがみ かいたの♪」→ ふうとう（はみ出さない・✕ なし）→ ふうとうを タップ → びんせん（2ぎょう・がちゃんより・らくがき）→ だいじに する
// ② わんこの おねがい（ハンバーガー）→ なでなで → しろい わの いし（ねがいが かなう いし）の カード → ありがとう → 家具が 1こ
// ③ ごじの おねがい（プリン）→ きょうりゅうの ヘアピン → 服が 1こ
// ④ すまほの「たからもの」: 4 / 42・てがみを もう いちど あける・かたたたき けんを つかう（のこり 9かい）
// ⑤ おうちに かざる（クレヨンの え・いし・つる）
export async function wishGiftsSmoke({ scenario, expect }) {
  const waitAsk = (H, ms = 15000) => H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor({ timeout: ms });
  const panel = (H) => H.eval(() => {
    const p = document.querySelector('.modal-wrap:not(.out) .wg-panel'), r = p.getBoundingClientRect(), btns = [...p.querySelectorAll('.panel-foot .btn')];
    return { title: p.querySelector('.panel-title').textContent, close: !!p.querySelector('.panel-head .close'), btns: btns.map((b) => b.textContent),
      inside: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, tall: btns.every((b) => b.getBoundingClientRect().height >= 43.5), over: document.documentElement.scrollWidth > innerWidth,
      name: p.querySelector('.wg-name')?.textContent || '', say: p.querySelector('.wg-say')?.textContent || '', use: p.querySelector('.wg-use')?.textContent || '', art: !!p.querySelector('.wg-art svg'), to: p.querySelector('.wg-env-to')?.textContent || '' };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('wish-gifts-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('hour', 20); await H.dbg('weather', 'clear'); await H.wait(800);
    // おねがいを きいて かなえて ぎゅー／なでなで → おれいの まど
    const grant = async (wish, who, food, how, force) => {
      await H.dbg('wishGift', force);
      expect(await H.dbg('wishAsk', wish), wish + ' を きけない');
      await waitAsk(H, 8000); await page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
      await H.dbg('give', food, 1); await H.dbg('feed', who, food);
      await waitAsk(H); await H.wait(250);
      await page.getByRole('button', { name: how, exact: true }).click();
      await page.locator('.modal-wrap:not(.out) .wg-panel').waitFor({ timeout: 15000 }); await H.wait(500);
    };
    // ① おてがみ
    await grant('eat_cake', 'gachan', 'cake', 'ぎゅー！', 'wg_l_gachan_4');
    let v = await panel(H);
    expect(/がちゃんから おてがみ/.test(v.title) && v.to === 'がちゃんより' && !v.close && v.btns.join() === 'あける' && v.inside && v.tall && !v.over, 'てがみの まどが ちがう ' + JSON.stringify(v));
    const said = (await H.dbg('homeTalkLog')).filter((x) => x.gift === 'wg_l_gachan_4');
    expect(said.some((x) => x.id === 'gachan' && /おてがみ かいたの/.test(x.text)), 'がちゃんが てがみを わたす ことばが ない ' + JSON.stringify(said));
    await H.shot('letter-env');
    await page.locator('.wg-env').click();
    await page.locator('.wg-letter-box.read').waitFor({ timeout: 5000 }); await H.wait(700);
    v = await H.eval(() => {
      const L = document.querySelector('.wg-letter'), r = L.getBoundingClientRect(), t = L.querySelector('.wg-text'), p = document.querySelector('.modal-wrap:not(.out) .wg-panel').getBoundingClientRect();
      const lines = [...t.querySelectorAll('.wg-ln')].map((e) => e.textContent), words = [...t.querySelectorAll('.wg-w')];
      return { text: lines.join('\n'), split: words.filter((w) => w.getClientRects().length > 1 || w.getBoundingClientRect().right > t.getBoundingClientRect().right + 1).length, sign: L.querySelector('.wg-sign').textContent, doodle: !!L.querySelector('.wg-doodle svg'), inside: r.left >= p.left && r.right <= p.right + 1 && p.bottom <= innerHeight + 1, hscroll: t.scrollWidth > t.clientWidth + 1, btn: document.querySelector('.wg-panel .panel-foot .btn').textContent };
    });
    expect(v.text.split('\n').length === 2 && v.split === 0 && /めろんぱん/.test(v.text) && v.sign === 'がちゃんより' && v.doodle && v.inside && !v.hscroll && v.btn === 'だいじに する', 'びんせんが ちがう ' + JSON.stringify(v));
    await H.shot('letter');
    await page.getByRole('button', { name: 'だいじに する', exact: true }).click(); await H.wait(600);
    let g = await H.dbg('wishGifts'), d = await H.dbg('saveData');
    expect(g.got.wg_l_gachan_4 === 1 && g.have === 1 && g.miss === 0 && d.wish.log[d.wish.log.length - 1].gift === 'wg_l_gachan_4', 'てがみが たからものに ない ' + JSON.stringify(g));
    expect(!(await H.eval(() => !!document.querySelector('.modal-wrap:not(.out) .wg-panel'))), 'てがみの まどが のこる');
    // ② いし
    await H.wait(1500);
    await grant('eat_burger', 'wanko', 'burger', 'なでなで', 'wg_stone_ring');
    v = await panel(H);
    expect(/わんこから おれい/.test(v.title) && v.name === 'しろい わの いし' && /ねがいが かなう/.test(v.say) && v.art && /もようがえ/.test(v.use) && v.btns.join() === 'ありがとう！' && !v.close && v.inside && v.tall && !v.over, 'いしの カードが ちがう ' + JSON.stringify(v));
    await H.shot('stone');
    await page.getByRole('button', { name: 'ありがとう！', exact: true }).click(); await H.wait(600);
    expect((await H.dbg('saveData')).furn.wg_stone_ring === 1, 'いしが 家具に ない');
    // ③ アクセサリー
    await H.wait(1500);
    await grant('eat_pudding', 'goji', 'pudding', 'ぎゅー！', 'wg_dinopin');
    v = await panel(H);
    expect(/ごじから おれい/.test(v.title) && v.name === 'きょうりゅうの ヘアピン' && /おこづかい/.test(v.say) && /きがえ/.test(v.use) && v.inside, 'アクセサリーの カードが ちがう ' + JSON.stringify(v));
    await H.shot('acc');
    await page.getByRole('button', { name: 'ありがとう！', exact: true }).click(); await H.wait(600);
    d = await H.dbg('saveData');
    expect(d.wardrobe.wg_dinopin === true || d.wardrobe.wg_dinopin >= 1, 'ヘアピンが ふくに ない ' + JSON.stringify(d.wardrobe.wg_dinopin));
    // ④ すまほの「たからもの」
    await H.wait(1200);
    await H.dbg('wishGift', 'none');
    expect(await H.dbg('wishGiftGive', 'wg_coupon'), 'かたたたき けんを もらえない');
    await H.phone('たからもの'); await H.wait(300);
    v = await H.eval(() => {
      const A = document.querySelector('.smaho .wg-app'), cells = [...A.querySelectorAll('.wg-cell')], body = document.querySelector('.smaho-body'), r = (e) => e.getBoundingClientRect();
      return { count: A.querySelector('.wg-count').textContent, cells: cells.length, own: cells.filter((c) => c.classList.contains('own')).map((c) => c.dataset.id).sort().join(), small: cells.filter((c) => r(c).height < 44 || r(c).width < 44).length, over: body.scrollWidth > body.clientWidth + 2, secs: [...A.querySelectorAll('.wg-sec span')].map((e) => e.textContent).join('/') };
    });
    expect(v.count === '4 / 42' && v.cells === 42 && v.own === 'wg_coupon,wg_dinopin,wg_l_gachan_4,wg_stone_ring' && v.small === 0 && !v.over && v.secs === 'おてがみ/まちで ひろった いし/おこづかいで かった アクセサリー/てづくりの もの', 'たからものの がめんが ちがう ' + JSON.stringify(v));
    await H.shot('app');
    // てがみを もう いちど（こんどは ✕ で とじられる）
    await page.locator('.smaho .wg-cell[data-id="wg_l_gachan_4"]').click();
    await page.locator('.modal-wrap:not(.out) .wg-panel .wg-env').waitFor({ timeout: 5000 }); await H.wait(300);
    v = await panel(H);
    expect(v.close && v.btns.join() === 'あける', 'たからものの てがみの まどが ちがう ' + JSON.stringify(v));
    await page.getByRole('button', { name: 'あける', exact: true }).click();
    await page.locator('.wg-letter-box.read').waitFor({ timeout: 5000 }); await H.wait(300);
    await page.getByRole('button', { name: 'だいじに する', exact: true }).click(); await H.wait(500);
    // かたたたき けん
    await page.locator('.smaho .wg-cell[data-id="wg_coupon"]').click();
    await page.getByRole('button', { name: 'つかう', exact: true }).waitFor({ timeout: 5000 }); await H.wait(200);
    await page.getByRole('button', { name: 'つかう', exact: true }).click(); await H.wait(700);
    v = await panel(H);
    expect(/とんとん/.test(v.say) && /のこり 9かい/.test(v.use) && (await H.dbg('wishGifts')).used.wg_coupon === 1 && v.inside && v.tall, 'かたたたき けんが つかえない ' + JSON.stringify(v));
    await H.shot('coupon');
    await page.locator('.modal-wrap:not(.out) .wg-panel .panel-head .close').click(); await H.wait(400);
    await page.locator('.smaho-close').click(); await H.wait(300); await H.idle();
    // ⑤ おうちに かざる
    for (const id of ['wg_crane', 'wg_drawing', 'wg_seaglass']) await H.dbg('wishGiftGive', id);
    await H.dbg('homeLayout', [{ id: 'wg_drawing', x: 140, y: 110 }, { id: 'wg_stone_ring', x: 300, y: 540 }, { id: 'wg_crane', x: 350, y: 545 }, { id: 'wg_seaglass', x: 400, y: 540 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    await H.shot('room');
    expect((await H.dbg('wishGifts')).have === 7, 'たからものの かず');
  }, { full: true, viewport, timeout: 200000 });
}
