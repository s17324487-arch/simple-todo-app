// シールの ガチャ と シールちょう（Meeときょれじゃ 4F・js/sticker-book.js・UI-53。オーナーの FB 2026-10-02「シールが出るタイプのガチャガチャ3台」）
// 1. 4F の きたの かべ（もりの ひろば）に シールの 台 3つ（まえに いける）・フロアマップに「シールの ガチャ」
// 2. ぷっくり シール: ハートの 台・1かい 100コイン・「でるのは シールが 4まい …」→ まわす（あける まえは わからない）→ わんこの シート（シールが 4まい ふえる）→ レアの なかよしの シート
// 3. おうちに かえって すまほの「シール」（館の なかでは すまほの ボタンは でない）: したの シールを タップで はる → ゆびで うごかす → まわす・おおきく → かみを かえる → つぎの ページ → もどって はがす。はみ出さない・ボタン 44px
// 4. さいかい しても のこる
export async function stickerBookSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [], t = pn && pn.querySelector('.panel-title'), g = document.createRange(); if (t) g.selectNodeContents(t);
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5, lines: t ? new Set([...g.getClientRects()].map((q) => Math.round(q.top))).size : 0, title: t ? t.textContent : '', text: pn ? pn.textContent : '' };
  }, tag);
  // シールちょうの がめん: はみ出さない・ボタン 44px（すまほの したの ホームバーは のぞく）・ページが みえる
  const book = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), ph = r(document.querySelector('.smaho')), b = document.querySelector('.smaho-body'), pg = document.querySelector('.stk-page'), tray = document.querySelector('.stk-tray');
    const bs = [...document.querySelectorAll('.smaho button')].filter((x) => x.offsetParent && x.getAttribute('aria-label') !== 'ホームへ');
    const P = r(pg), B = r(b), T = r(tray);
    return { small: bs.filter((x) => { const q = r(x); return q.width < 43.5 || q.height < 43.5; }).map((x) => x.textContent || x.getAttribute('aria-label')), wide: b.scrollWidth > b.clientWidth + 1, tall: b.scrollHeight > b.clientHeight + 1, page: document.documentElement.scrollWidth > innerWidth,
      phone: ph.left >= 0 && ph.right <= innerWidth + 0.5 && ph.top >= 0 && ph.bottom <= innerHeight + 0.5, pg: { w: P.width, h: P.height, in: P.left >= B.left - 0.5 && P.right <= B.right + 0.5 && P.top >= B.top - 0.5 && P.bottom <= T.top + 0.5 }, ratio: P.width / P.height,
      no: document.querySelector('.stk-no').textContent, hint: (document.querySelector('.stk-hint') || {}).textContent || '', tools: [...document.querySelectorAll('.stk-tool')].map((x) => x.getAttribute('aria-label')), slots: document.querySelectorAll('.stk-slot').length, on: document.querySelectorAll('.stk-on').length };
  });
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('sticker-book-' + viewport.width, async (H) => {
    await H.newGameFast(); const c0 = await H.dbg('coins', 3000); await H.dbg('calendar', '2026-10-05'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const st0 = await H.dbg('stickers');
    expect(st0 && st0.series.map((S) => S.index).join() === '30,31,32' && st0.series.every((S) => S.price === 100) && st0.machines.length === 3 && st0.designs.length === 102 && !Object.keys(st0.have).length, 'シールの シリーズ ' + JSON.stringify(st0).slice(0, 300));
    // 1. 4F の シールの 台（きたの かべ・もりの ひろば）
    await H.dbg('venue', 'arcade', 4); await H.idle(); await arrive(H, 4); await H.wait(700);
    let s = await H.dbg('venueState');
    const g = s.fixtures.filter((f) => f.kind === 'gacha' && st0.machines.some((m) => m.series === f.series));
    expect(g.length === 3 && s.routeCount.every((r) => r.reachable), '4F の シールの 台 3つ・どこでも いける ' + JSON.stringify({ n: g.length, bad: s.routeCount.filter((r) => !r.reachable) }));
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(300);
    const gd = await H.eval(() => [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label));
    expect(gd.includes('シールの ガチャ') && gd.includes('もりの ひろば') && gd.includes('ガチャの しま（にし）'), '4F の フロアマップに シールの ガチャ ' + gd.join('・'));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // 2. ぷっくり シール の 台（あるいて いって ひらく）
    expect(await H.dbg('venueVisit', 'シールの ガチャ'), 'シールの ガチャ が ない');
    await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(500);
    let L = await fits(H, 'シール');
    const heart = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .gacha-machine').innerHTML.includes('#FF8FB0'));
    expect(L.title === '「ぷっくり シール」' && L.lines === 1 && heart && /1かい 100コイン/.test(L.text) && /100コインで まわす/.test(L.text) && /でるのは シールが 4まい はいった シート/.test(L.text) && /なかよしの シート/.test(L.text) && /レア・まだ/.test(L.text) && !L.wide && !L.page && !L.small.length && L.edge, 'シールの 台の がめん ' + JSON.stringify({ ...L, text: L.text.slice(0, 200) }));
    await H.shot('lineup');
    await H.dbg('gachaFast', 4);
    const turn = async (k) => { await H.dbg('gachaNext', k); await H.page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000);
      const hid = await H.eval(() => document.querySelectorAll('.modal-wrap:not(.out) .gacha-card.own').length);
      await H.page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(250); return { ...(await H.dbg('gachaState')), hid }; };
    let r = await turn(0);
    const prize = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .gacha-prize').textContent);
    let st = await H.dbg('stickers');
    expect(r.last.id === 'gacha_stkpuku_0' && r.last.price === 100 && r.hid === 0 && r.coins === c0 - 100 && /わんこの シート/.test(prize) && /シールが 4まい ふえたよ/.test(prize) && /すまほの「シール」で はれるよ/.test(prize), 'わんこの シートが でない／あける まえに わかる ' + JSON.stringify({ last: r.last, hid: r.hid, prize }));
    expect(st.have.stk_wanko === 2 && st.have.stk_heart === 1 && st.have.stk_star === 1 && (await H.dbg('saveData')).furn.gacha_stkpuku_0 === undefined, 'シートの シールが てもとに はいらない ' + JSON.stringify(st.have));
    L = await fits(H, 'けっか'); expect(!L.wide && !L.page && !L.small.length, 'けっかの がめんが はみ出す ' + JSON.stringify(L.small));
    await H.shot('open');
    r = await turn(3); st = await H.dbg('stickers');
    expect(r.last.id === 'gacha_stkpuku_3' && r.last.rare && st.have.stk_trio === 1 && st.have.stk_wanko === 3 && r.coins === c0 - 200, 'レアの なかよしの シート ' + JSON.stringify({ last: r.last, have: st.have }));
    await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000);
    // 3. おうちに かえって すまほの「シール」
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.phone('シール'); await H.page.locator('.stk-page').waitFor({ timeout: 8000 }); await H.wait(500);
    let B = await book(H);
    expect(B.no === '1 / 6' && B.slots === st0.designs.length && B.on === 0 && /したの シールを タップして はろう/.test(B.hint) && !B.small.length && !B.wide && !B.tall && !B.page && B.phone && B.pg.in && Math.abs(B.ratio - 300 / 360) < 0.02 && B.pg.h >= 250, 'シールちょうの がめん ' + JSON.stringify(B));
    await H.page.locator('.stk-slot[data-id="stk_wanko"]').click(); await H.wait(250);
    st = await H.dbg('stickers'); let u = await H.dbg('stickerUi');
    expect(st.pages[0].list.length === 1 && st.pages[0].list[0][0] === 'stk_wanko' && st.have.stk_wanko === 2 && u.sel === 0, 'シールを タップで はれない ' + JSON.stringify({ p: st.pages[0], have: st.have, u }));
    B = await book(H); expect(B.tools.join() === 'ひだりに まわす,みぎに まわす,ちいさく,おおきく,はがす' && !B.small.length, 'えらんだ シールの ボタン ' + JSON.stringify(B.tools));
    // ゆびで うごかす（ページの みぎ したへ）
    const im = await H.page.locator('.stk-on').first().boundingBox(), x0 = st.pages[0].list[0][1], y0 = st.pages[0].list[0][2];
    await H.page.mouse.move(im.x + im.width / 2, im.y + im.height / 2); await H.page.mouse.down();
    await H.page.mouse.move(im.x + im.width / 2 + 40, im.y + im.height / 2 + 60, { steps: 8 }); await H.page.mouse.up(); await H.wait(200);
    st = await H.dbg('stickers'); const [, x1, y1] = st.pages[0].list[0], k = 300 / u.rect.w;
    expect(Math.abs(x1 - x0 - 40 * k) <= 3 && Math.abs(y1 - y0 - 60 * k) <= 3, 'ゆびで うごかせない ' + JSON.stringify({ x0, y0, x1, y1, k }));
    await H.page.getByRole('button', { name: 'みぎに まわす', exact: true }).click(); await H.page.getByRole('button', { name: 'みぎに まわす', exact: true }).click();
    await H.page.getByRole('button', { name: 'おおきく', exact: true }).click(); await H.wait(200);
    st = await H.dbg('stickers'); expect(st.pages[0].list[0][3] === 30 && st.pages[0].list[0][4] === 3, 'まわす・おおきく が きかない ' + JSON.stringify(st.pages[0].list[0]));
    for (const id of ['stk_trio', 'stk_heart', 'stk_star']) { await H.page.locator(`.stk-slot[data-id="${id}"]`).click(); await H.wait(150); }
    await H.page.getByRole('button', { name: 'かみを かえる', exact: true }).click(); await H.wait(250);
    st = await H.dbg('stickers'); B = await book(H);
    expect(st.pages[0].list.map((x) => x[0]).join() === 'stk_wanko,stk_trio,stk_heart,stk_star' && st.pages[0].bg === 1 && B.on === 4 && !B.small.length && !B.wide && !B.tall, '4まい はって かみを かえる ' + JSON.stringify({ p: st.pages[0], B }));
    await H.shot('book');
    // つぎの ページ（ちがう かみ）
    await H.page.getByRole('button', { name: 'つぎの ページ', exact: true }).click(); await H.wait(250);
    await H.page.locator('.stk-slot[data-id="stk_wanko"]').click(); await H.wait(200);
    st = await H.dbg('stickers'); B = await book(H);
    expect(B.no === '2 / 6' && st.pages[1].list.length === 1 && st.have.stk_wanko === 1 && B.on === 1, 'つぎの ページに はれない ' + JSON.stringify({ no: B.no, p1: st.pages[1] }));
    // まえの ページに もどって ハートを はがす（さわると えらぶ → はがす）
    await H.page.getByRole('button', { name: 'まえの ページ', exact: true }).click(); await H.wait(250);
    const hb = await H.page.locator('.stk-on[data-id="stk_heart"]').boundingBox();
    await H.page.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2); await H.wait(200);
    await H.page.getByRole('button', { name: 'はがす', exact: true }).click(); await H.wait(250);
    st = await H.dbg('stickers');
    expect(st.pages[0].list.length === 3 && !st.pages[0].list.some((x) => x[0] === 'stk_heart') && st.have.stk_heart === 1, 'はがすと てもとに もどらない ' + JSON.stringify({ p: st.pages[0], have: st.have }));
    await H.shot('book2');
    // 4. さいかい しても のこる
    const before = await H.dbg('stickers'); await H.dbg('smaho', null); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const after = await H.dbg('stickers');
    expect(JSON.stringify(after.pages) === JSON.stringify(before.pages) && JSON.stringify(after.have) === JSON.stringify(before.have) && JSON.stringify(after.got) === JSON.stringify(before.got), 'さいかいで シールちょうが かわる ' + JSON.stringify([before.pages[0], after.pages[0]]));
    await H.phone('シール'); await H.page.locator('.stk-page').waitFor({ timeout: 8000 }); await H.wait(300);
    B = await book(H); expect(B.on === 3 && B.no === '1 / 6', 'さいかい した あとの シールちょう ' + JSON.stringify(B));
  }, { full: true, viewport, timeout: 200000 });
}
