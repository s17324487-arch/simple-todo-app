// 服は 1こで ひとり（js/wear-stock.js・UI-31。オーナーの FB 2026-10-01「1アイテム1人まで（3人に着せたい場合は、三つ買わなくてはならない）」）:
// ようふくやさんで むぎわらぼうしを 1こ → わんこが かぶる → きがえ: みんな おそろいは「たりないよ」→ がちゃんの カードは「わんこが つかってる」
// → おすと「わたす？」（やめる → そのまま／わたす → がちゃんへ）→ もう 2こ（×2）かう → 3にん おそろい → ぱぱは のこりが ない
// → さいかい しても のこる → 5こ で「もってる」
export async function wearStockSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('wear-stock-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('coins', 5000);
    const lead = (await H.dbg('saveData')).order[0], second = (await H.dbg('saveData')).order[1];
    const names = await H.eval(() => Object.fromEntries(Save.d.order.map((id) => [id, Save.d.chars[id].name])));
    const stock = () => H.dbg('wearStock', 'strawhat');
    const openShop = async () => {
      await H.dbg('store', 'clothes'); await H.idle();
      await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
      await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
      await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: 'むぎわらぼうし' }).first().waitFor();
    };
    const hatCard = () => H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: 'むぎわらぼうし' }).first();
    const closeAll = async () => { while (await H.page.locator('.modal-wrap:not(.out) .close').count()) { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(240); } };
    // 画面: はみ出さない・ボタンは 44px いじょう
    const fits = async (tag) => {
      const L = await H.eval(() => {
        const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
        const cards = pn ? [...pn.querySelectorAll('.card')].filter((c) => c.offsetParent) : [];
        return { wide: !!body && body.scrollWidth > body.clientWidth + 1, edge: !!pn && r(pn).left >= -0.5 && r(pn).right <= innerWidth + 0.5, page: document.documentElement.scrollWidth > innerWidth,
          over: cards.filter((c) => [...c.children].some((k) => r(k).right > r(c).right + 1 || r(k).left < r(c).left - 1)).map((c) => c.textContent) };
      });
      expect(!L.wide && L.edge && !L.page && !L.over.length, tag + ' が はみ出す ' + JSON.stringify(L));
    };
    // 1. 1こ かう → わんこが かぶる
    await openShop();
    await hatCard().click();
    const note = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .note')].map((e) => e.textContent).join(' '));
    expect(/1こで ひとり きられるよ（もってる: 0こ）/.test(note), 'かう まえの せつめいに 1こで ひとり が ない ' + note);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(260);
    let st = await stock();
    expect(st.count === 1 && st.raw === true && st.wearers.join() === lead, '1こ かって ' + names[lead] + 'が かぶる ' + JSON.stringify(st));
    await closeAll(); await H.idle();
    // 2. おうちの きがえ: みんな おそろいは たりない
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ');
    await H.page.getByRole('button', { name: 'みんな おそろい', exact: true }).click(); await H.wait(200);
    const toast = await H.eval(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' '));
    st = await stock();
    expect(/むぎわらぼうし」が たりないよ/.test(toast) && st.wearers.join() === lead, 'おそろいで 1こを 3にんに した ' + JSON.stringify([toast, st]));
    // 3. 2ばんめの 子の カード: 「わんこが つかってる」→ やめる → わたす
    await H.page.locator('.modal-wrap:not(.out) .who-tab').filter({ hasText: names[second] }).click(); await H.wait(200);
    const card = H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'むぎわらぼうし' });
    const tag = await card.textContent();
    expect(await card.evaluate((c) => c.classList.contains('busy')) && tag.includes(names[lead] + 'が つかってる'), 'のこりが ない 服の カードに つかって いる 人が でない ' + tag);
    await fits('きがえ（つかってる）'); await H.shot('busy');
    await card.click(); await H.page.locator('.dlg-shade .dlg-text').waitFor();
    const ask = await H.eval(() => document.querySelector('.dlg-shade .dlg-text').textContent);
    expect(/「むぎわらぼうし」は 1こ だけ。/.test(ask) && ask.includes('いまは ' + names[lead] + 'が つかって いるよ。') && ask.includes(names[second] + 'に わたす？'), 'わたす？ の ことば ' + ask);
    await H.shot('ask');
    await H.page.getByRole('button', { name: 'やめる', exact: true }).click(); await H.wait(200);
    expect((await stock()).wearers.join() === lead, 'やめても わたった');
    await card.click(); await H.page.getByRole('button', { name: 'わたす', exact: true }).click(); await H.wait(250);
    st = await stock();
    expect(st.wearers.join() === second && st.count === 1, 'わたすと ' + names[second] + ' だけが かぶる ' + JSON.stringify(st));
    await closeAll(); await H.idle();
    // 4. もう 2こ（×2）かう → ×3
    await openShop();
    expect((await hatCard().textContent()).includes('×1'), 'おみせの カードに ×1 が ない');
    await hatCard().click();
    await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: '＋', exact: true }).click();
    const price = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .pill')].pop().textContent);
    expect(/600/.test(price), '2こで 600コイン ' + price);
    await fits('おみせ（2こ）'); await H.shot('buy2');
    const c0 = (await H.dbg('saveData')).coins;
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    const done = await H.eval(() => document.querySelector('.dlg-shade .dlg-text')?.textContent || '');
    expect(/「むぎわらぼうし」を 2こ かったよ！/.test(done), '2こ かった ことば ' + done);
    await H.page.getByRole('button', { name: 'あとで', exact: true }).click(); await H.wait(250);
    st = await stock(); const saved = await H.dbg('persistedSave');
    expect(st.count === 3 && saved.wardrobe.strawhat === 3 && saved.coins === c0 - 600 && (await hatCard().textContent()).includes('×3'), '2こ たして 3こ・600コイン ' + JSON.stringify([st, saved.coins, c0]));
    await closeAll(); await H.idle();
    // 5. 3にん おそろい（ぜんいん かぶる）→ ぱぱは のこりが ない
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ');
    expect((await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'むぎわらぼうし' }).textContent()).includes('×3'), 'きがえの カードに ×3 が ない');
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'むぎわらぼうし' }).click(); await H.wait(200);
    await H.page.getByRole('button', { name: 'みんな おそろい', exact: true }).click(); await H.wait(200);
    st = await stock();
    expect(st.wearers.length === 3 && st.count === 3 && /3にん おそろいに したよ/.test(await H.eval(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' '))), '3こで 3にん おそろい ' + JSON.stringify(st));
    await fits('きがえ（3こ）'); await H.shot('matching');
    await H.page.locator('.modal-wrap:not(.out) .who-tab').filter({ hasText: 'ぱぱ' }).click(); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: 'あたま', exact: true }).click(); await H.wait(200);
    const pc = H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'むぎわらぼうし' });
    expect(await pc.evaluate((c) => c.classList.contains('busy')) && (await pc.textContent()).includes(names[lead] + 'が つかってる'), 'ぱぱの カードに つかって いる 人が でない');
    expect(/1こで ひとり きられるよ/.test(await H.eval(() => document.querySelector('.modal-wrap:not(.out) .note').textContent)), 'ぱぱの せつめい');
    await fits('ぱぱの きがえ'); await H.shot('papa');
    await closeAll(); await H.idle();
    // 6. さいかい しても のこる
    const before = await H.dbg('saveData'); await H.dbg('save'); await H.page.reload();
    await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const after = await H.dbg('saveData');
    // （おなか・ごきげんは じかんで かわる ので、きている 服だけ くらべる）
    const outfits = (d) => JSON.stringify([d.order.map((id) => d.chars[id].outfit), d.parents.papa.equipment, d.parents.mama.equipment]);
    expect(after.v === 2 && after.wardrobe.strawhat === 3 && outfits(after) === outfits(before) && JSON.stringify(after.wardrobe) === JSON.stringify(before.wardrobe), 'さいかいで かわる ' + JSON.stringify([after.v, after.wardrobe.strawhat, outfits(after), outfits(before)]));
    // 7. 5こ まで（「もってる」・「もってるよ」）
    await openShop(); await hatCard().click();
    await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: '＋', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: '＋', exact: true }).click(); // 3こめは ふえない（あと 2こ）
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'あとで', exact: true }).click(); await H.wait(250);
    st = await stock();
    expect(st.count === 5 && st.room === 0 && (await hatCard().textContent()).includes('もってる') && await hatCard().evaluate((c) => c.classList.contains('on')), '5こ で もってる ' + JSON.stringify(st));
    await hatCard().click();
    expect(await H.page.getByRole('button', { name: 'もってるよ', exact: true }).isDisabled(), '6こめが かえる');
    await closeAll();
  }, { viewport, timeout: 180000 });
}
