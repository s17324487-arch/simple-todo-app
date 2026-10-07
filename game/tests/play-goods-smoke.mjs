// あそびどうぐ・ほん・ドリル（js/play-goods.js・UI-105。オーナーの 依頼 2026-10-07「…これらのアイテムは、景品やコンビニなどであるようにしろ。遊び道具、本、ドリル、はそれぞれ8種類以上あると良い。」）
// 1. ローリソン: てんいんと はなす → かいもの →「あそび」3・「ほん・ドリル」10（ねだんは 1.5ばい・タブは 2だん・はみ出さない）→ トランプを かって「もつ！」→ せんとうの 子が もつ
// 2. せぶんぶん: すうがく ドリルを かう（「あとで」）→ おうちの きがえの「もちもの」で がちゃんに もたせる
// 3. Meeときょれじゃ: けいひん カウンター →「おもちゃを みる」→ 5しゅ（ゲームき 9800）→ けんだまを かう
// 4. おうちで 3人が もつ（絵に でる）→ ずかんの「てにいれる ヒント」→ さいかいしても のこる
export async function playGoodsSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [], tabs = pn ? [...pn.querySelectorAll('.tabs .tab')].filter((b) => b.offsetParent) : [];
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: [...cards, ...tabs].filter((c) => r(c).height < 43.5 || r(c).width < 43.5).length,
      tabsOut: tabs.filter((b) => r(b).right > innerWidth + 1 || r(b).left < -1).length, rows: tabs.map((b) => r(b).top).sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 8).length, cards: cards.length,
      // rows: えらんだ タブは 2px したに ずれる ので 8px いじょう はなれた だんを かぞえる
      names: cards.map((c) => c.querySelector('.price')?.previousElementSibling?.textContent || ''), prices: cards.map((c) => +(c.querySelector('.price')?.textContent || '').replace(/[^0-9]/g, '')) };
  }, tag);
  const shopTab = async (H, k) => { await H.page.locator(`.modal-wrap:not(.out) .tab[data-k="${k}"]`).click(); await H.wait(250); };
  const enterStore = async (H, id) => { await H.dbg('store', id); await H.until(() => PokaDebug.state().scene === 'store' && PokaDebug.idle(), 20000); await H.wait(300); await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click(); await H.page.locator('.modal-wrap .grid .card').first().waitFor(); await H.wait(250); };
  const leaveStore = async (H) => { for (let i = 0; i < 3 && await H.page.locator('.modal-wrap:not(.out) .close').count(); i++) { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(250); } await H.idle(); await H.page.getByRole('button', { name: 'おみせを でる', exact: true }).click(); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000); };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('play-goods-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 30000); await H.dbg('hour', 12); await H.dbg('weather', 'clear');
    let st = await H.dbg('playGoods');
    expect(st && st.cats.toy === 10 && st.cats.book === 10 && st.cats.drill === 10 && Object.values(st.held).every((v) => v === null), 'あそびどうぐ・ほん・ドリルの ようす ' + JSON.stringify(st && st.cats));
    const lead = (await H.dbg('saveData')).order[0], nm = await H.eval(() => Object.fromEntries(PlayGoods.ITEMS.map((x) => [x.id, x.name])));
    // 1. ローリソン
    await enterStore(H, 'lawson');
    await shopTab(H, 'play');
    let L = await fits(H, 'ローリソン あそび');
    const want = st.shops.lawson;
    expect(L.cards === 3 && L.names.join() === want.play.map((x) => x.name).join() && L.prices.every((p, i) => p === want.play[i].price && p === Math.round(want.play[i].base * 1.5)) && !L.wide && !L.page && !L.small && !L.tabsOut && L.rows === 2, 'ローリソンの「あそび」 ' + JSON.stringify(L));
    await H.shot('lawson-play');
    await shopTab(H, 'book');
    L = await fits(H, 'ローリソン ほん・ドリル');
    expect(L.cards === 10 && L.names.join() === want.book.map((x) => x.name).join() && !L.wide && !L.page && !L.small && !L.tabsOut, 'ローリソンの「ほん・ドリル」 ' + JSON.stringify(L));
    await H.shot('lawson-book');
    await shopTab(H, 'play');
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.pg_cards }).first().click(); await H.wait(300);
    const det = await H.eval(() => ({ note: document.querySelector('.modal-wrap:not(.out) .note')?.textContent || '', stage: document.querySelector('.modal-wrap:not(.out) .dress-stage .who')?.innerHTML || '' }));
    expect(/1こで ひとり もてるよ/.test(det.note) && det.stage.includes('#E53935'), 'トランプの ためしもち・ことば ' + det.note);
    const coins0 = (await H.dbg('saveData')).coins;
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'もつ！', exact: true }).click(); await H.wait(300);
    await H.until(() => /ポイントカードを つくったよ/.test(document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent || ''), 8000); await H.dialogs(); await H.wait(200);
    st = await H.dbg('playGoods');
    expect(st.held[lead] === 'pg_cards' && st.drawn[lead] && (await H.dbg('saveData')).coins === coins0 - 300 && (await H.dbg('conbiniCard', 'lawson')).has, 'トランプを かって もつ ' + JSON.stringify(st.held));
    await leaveStore(H);
    // 2. せぶんぶん: すうがく ドリル（あとで）
    await enterStore(H, 'sevenbun');
    await shopTab(H, 'book');
    L = await fits(H, 'せぶんぶん ほん・ドリル');
    expect(L.cards === 10 && L.names.includes(nm.dr_math) && !L.names.some((x) => st.shops.lawson.book.some((y) => y.name === x)), 'せぶんぶんの「ほん・ドリル」は ローリソンと ちがう ' + JSON.stringify(L.names));
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.dr_math }).first().click(); await H.wait(300);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'あとで', exact: true }).click(); await H.wait(300);
    await H.until(() => /ポイントカードを つくったよ/.test(document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent || ''), 8000); await H.dialogs(); await H.wait(200);
    expect((await H.dbg('wearStock', 'dr_math')).count === 1 && (await H.dbg('playGoods')).held.gachan === null, 'すうがく ドリルを かう（あとで）');
    await leaveStore(H);
    // 3. Meeときょれじゃ: けいひん カウンターの「おもちゃ」
    expect(await H.dbg('venue', 'arcade', 1), 'Meeときょれじゃ に いけない'); await H.until(() => PokaDebug.state().scene === 'venue' && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000);
    expect(await H.dbg('venueVisit', 'けいひん カウンター'), 'けいひん カウンター');
    await H.page.getByRole('button', { name: 'おもちゃを みる', exact: true }).click(); await H.page.locator('.modal-wrap .grid .card').first().waitFor(); await H.wait(300);
    L = await fits(H, 'おもちゃ');
    expect(L.cards === 5 && L.names.join() === st.shops.ike_arcade.toy.map((x) => x.name).join() && L.prices[0] === 9800 && !L.wide && !L.page && !L.small, 'けいひん カウンターの「おもちゃ」 ' + JSON.stringify(L));
    await H.shot('counter-toy');
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.pg_kendama }).first().click(); await H.wait(300);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'あとで', exact: true }).click(); await H.wait(300);
    expect((await H.dbg('wearStock', 'pg_kendama')).count === 1, 'けんだまを こうかん');
    for (let i = 0; i < 3 && await H.page.locator('.modal-wrap:not(.out) .close').count(); i++) { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(250); }
    await H.idle();
    // 4. おうち: きがえの「もちもの」で がちゃんに すうがく ドリル・ごじに きょうりゅう ずかん
    await H.dbg('playHold', 'goji', 'bk_dino');
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.houseButton('きがえ'); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out) .who-tabs .who-tab').filter({ hasText: await H.eval(() => Save.d.chars.gachan.name) }).first().click(); await H.wait(150);
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(200);
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.dr_math }).first().click(); await H.wait(250);
    L = await fits(H, 'きがえ');
    expect(!L.wide && !L.page && !L.tabsOut, 'きがえの もちもの が はみ出す ' + JSON.stringify(L));
    await H.page.click('.modal-wrap:not(.out) .close'); await H.until(() => !G.scene.mode, 8000);
    st = await H.dbg('playGoods');
    expect(st.held[lead] === 'pg_cards' && st.held.gachan === 'dr_math' && st.held.goji === 'bk_dino' && st.drawn.gachan && st.drawn.goji, '3人が もつ ' + JSON.stringify(st.held));
    await H.dbg('homeBubbleFixture'); await H.wait(600); await H.shot('house');
    // ずかんの ヒント
    const hint = await H.eval(() => [ItemDexSources.source('wear', ITEM_INDEX.pg_game), ItemDexSources.source('wear', ITEM_INDEX.dr_math)]);
    expect(/けいひん カウンター/.test(hint[0]) && /せぶんぶん/.test(hint[1]), 'ずかんの ヒント ' + hint.join(' / '));
    // 5. さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    st = await H.dbg('playGoods');
    expect(st.held[lead] === 'pg_cards' && st.held.gachan === 'dr_math' && st.held.goji === 'bk_dino', 'さいかいで もちものが きえる ' + JSON.stringify(st.held));
  }, { full: viewport.width === 375, viewport, timeout: 220000 });
}
