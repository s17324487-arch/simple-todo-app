// かさ・ひがさ（js/umbrella-items.js・UI-122。オーナーの 指示 2026-10-13「アイテムとして傘や日傘を実装してほしい。」）
// 1. ようふくやさんの「もちもの」の たなに かさ 4・ひがさ 4（はみ出さない）→ みずたまの かさを ためしぎ → かって「きる！」→ もって いる 絵
// 2. あめの まちを みずたまの かさ・わがさ・レースの ひがさで あるく（絵に でる）
export async function umbrellaSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length, names: cards.map((c) => c.textContent) };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('umbrella-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 20000); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const U8 = await H.eval(() => UmbrellaItems.ITEMS.map((x) => ({ id: x.id, name: x.name })));
    expect(U8.length === 8, 'かさ・ひがさが 8しゅ ない');
    const lead = (await H.dbg('saveData')).order[0];
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(250);
    const L = await fits(H);
    expect(U8.every((u) => L.names.some((t) => t.includes(u.name))) && !L.wide && !L.page && !L.small, 'もちもの の たなに かさ・ひがさが ない・はみ出す ' + JSON.stringify({ ...L, names: L.names.length }));
    await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: 'みずたまの かさ' }).first().click(); await H.wait(250);
    const tryOn = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .dress-stage .who')?.innerHTML || '');
    expect(tryOn.includes('#3F5AA8'), 'ためしぎに かさが ない');
    await H.shot('shop');
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(300);
    let st = await H.dbg('handItems');
    expect(st.held[lead] === 'hi_umb_dot', 'かった かさを もたない ' + JSON.stringify(st.held));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // 2. あめの まち
    const ids = (await H.dbg('saveData')).order;
    await H.dbg('handHold', ids[1], 'hi_para_wagasa'); await H.dbg('handHold', ids[2], 'hi_para_lace');
    await H.dbg('weather', 'rain'); await H.dbg('teleport', 'town', 20, 20, 'down'); await H.idle(); await H.wait(800);
    st = await H.dbg('handItems');
    expect(st.held[ids[0]] === 'hi_umb_dot' && st.held[ids[1]] === 'hi_para_wagasa' && st.held[ids[2]] === 'hi_para_lace', '3人が かさを もって いない ' + JSON.stringify(st.held));
    await H.shot('town-rain');
  }, { viewport, timeout: 120000 });
}
