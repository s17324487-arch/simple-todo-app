// ようふく 50しゅ（js/closet-wear.js・UI-125。オーナーの 指示 2026-10-13「洋服の種類を50種類増やして欲しい。もっと可愛いやつとか、実際にあるような服をリサーチして。」）
// 1. ようふくやさんの「トレンド」の たなに 50しゅ（はみ出さない・おせる おおきさ）・「ふく」の たなには まざらない
// 2. ペプラム ブラウスを ためしぎ → かって「きる！」→ きて いる 絵
// 3. のこりの 2人に ノルディック セーター・ギンガムの ワンピースを きせて おうちで ならぶ（絵に でる）
export async function closetWearSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [];
    const over = cards.filter((c) => [...c.querySelectorAll('div')].some((d) => d.scrollWidth > d.clientWidth + 1)).length;
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length, over, names: cards.map((c) => c.textContent) };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('closet-wear-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 50000); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    let st = await H.dbg('closetWear');
    expect(st && st.items.length === 50 && st.tab && st.tab[1] === 'トレンド' && st.shelf.length === 50 && !st.mixed, 'トレンドの たな ' + JSON.stringify(st && { n: st.items.length, tab: st.tab, mixed: st.mixed }));
    const names = await H.eval(() => ClosetWear.ITEMS.map((x) => x.name));
    const lead = (await H.dbg('saveData')).order[0];
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('ふく', { exact: true }).click(); await H.wait(250);
    let L = await fits(H);
    expect(!names.some((n) => L.names.some((t) => t.includes(n))), 'ふくの たなに まざった');
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('トレンド', { exact: true }).click(); await H.wait(300);
    L = await fits(H);
    expect(names.every((n) => L.names.some((t) => t.includes(n))) && L.names.length === 50 && !L.wide && !L.page && !L.small, 'トレンドの たなに 50しゅ ない・はみ出す ' + JSON.stringify({ ...L, names: L.names.length }));
    await H.shot('shop');
    await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: 'ペプラム ブラウス' }).first().click(); await H.wait(250);
    const tryOn = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .dress-stage .who')?.innerHTML || '');
    expect(tryOn.includes('fill="#F8BBD0"'), 'ためしぎに ペプラム ブラウスが ない');
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(300);
    st = await H.dbg('closetWear');
    expect(st.body[lead] === 'cw_peplum' && st.drawn[lead], 'かった ふくを きて いない ' + JSON.stringify(st.body));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // 3. おうちで 3人
    const ids = (await H.dbg('saveData')).order;
    await H.dbg('closetPut', ids[1], 'cw_nordic'); st = await H.dbg('closetPut', ids[2], 'cw_gingham');
    expect(st.body[ids[1]] === 'cw_nordic' && st.body[ids[2]] === 'cw_gingham' && ids.every((id) => st.drawn[id]), '3人が きて いない ' + JSON.stringify(st));
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000); await H.wait(800);
    await H.shot('home');
  }, { viewport, timeout: 120000 });
}
