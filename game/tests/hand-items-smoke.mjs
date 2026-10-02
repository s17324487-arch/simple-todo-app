// もちもの（js/hand-items.js・UI-48。オーナーの FB 2026-10-02「持ち物で風船を持てたり…バックを持てたりしたい」）
// 1. ようふくやさん →「もちもの」の たな（7しゅ・はみ出さない）→ あかい ふうせんを ためしぎ → かって「きる！」
// 2. おうちの きがえ →「もちもの」の タブ → がちゃんに トートバッグ・ごじに ほしの ふうせん（カードは 44px・はみ出さない）
// 3. おうちと まちで 3人が もって いる（絵）→ ずかんの「もちもの」→ さいかい しても のこる
export async function handItemsSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [], tabs = pn ? [...pn.querySelectorAll('.tabs .tab, .tabs button')].filter((b) => b.offsetParent) : [];
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length,
      tabsOut: tabs.filter((b) => r(b).right > innerWidth + 1 || r(b).left < -1).length, cards: cards.length };
  }, tag);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('hand-items-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 8000); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    let st = await H.dbg('handItems');
    expect(st && st.items.length === 7 && st.shopTab && Object.values(st.held).every((v) => v === null), 'もちもの の ようす ' + JSON.stringify(st));
    const lead = (await H.dbg('saveData')).order[0];
    const nm = await H.eval(() => Object.fromEntries(HandItems.ITEMS.map((x) => [x.id, x.name])));
    // 1. ようふくやさん
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(250);
    let L = await fits(H, 'おみせ');
    expect(L.cards >= 7 && !L.wide && !L.page && !L.small && !L.tabsOut, 'もちもの の たなが ちがう・はみ出す ' + JSON.stringify(L));
    await H.shot('shop');
    await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: nm.hi_balloon_red }).first().click(); await H.wait(250);
    const tryOn = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .dress-stage .who')?.innerHTML || '');
    expect(tryOn.includes('#EF5350'), 'ためしぎに ふうせんが ない');
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(300);
    st = await H.dbg('handItems');
    expect(st.held[lead] === 'hi_balloon_red' && st.drawn[lead], 'かって きた ふうせんを もたない ' + JSON.stringify(st));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // 2. おうちの きがえ
    await H.dbg('wearSet', 'hi_tote', 1); await H.dbg('wearSet', 'hi_balloon_star', 1);
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.houseButton('きがえ'); await H.wait(300);
    const pick = async (who, item) => {
      await H.page.locator('.modal-wrap:not(.out) .who-tabs .who-tab').filter({ hasText: await H.eval((w) => Save.d.chars[w].name, who) }).first().click(); await H.wait(150);
      await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(200);
      await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm[item] }).first().click(); await H.wait(250);
    };
    await pick('gachan', 'hi_tote'); await pick('goji', 'hi_balloon_star');
    L = await fits(H, 'きがえ');
    expect(!L.wide && !L.page && !L.small && !L.tabsOut, 'きがえの もちもの が はみ出す ' + JSON.stringify(L));
    await H.shot('dress');
    await H.page.click('.modal-wrap:not(.out) .close'); await H.until(() => !G.scene.mode, 8000);
    st = await H.dbg('handItems');
    expect(st.held.gachan === 'hi_tote' && st.held.goji === 'hi_balloon_star' && st.drawn.gachan && st.drawn.goji, 'きがえで もちもの が もてない ' + JSON.stringify(st));
    await H.dbg('homeBubbleFixture'); await H.wait(600); await H.shot('house');
    // 3. まち
    await H.dbg('teleport', 'town', 12, 12); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000); await H.wait(600);
    for (const [dx, dy] of [[0, 3], [3, 0], [-3, 0], [0, -3]]) { const s = await H.dbg('state'); if (await H.dbg('walkTo', s.pos[0] + dx, s.pos[1] + dy)) break; }
    await H.until(() => PokaDebug.idle() && !(G.scene.path && G.scene.path.length) && G.scene.party.every((w) => !w.moving), 8000); await H.wait(700);
    await H.shot('town');
    // ずかん: もちもの の しゅるい
    const cats = await H.eval(() => ItemDex.categories.wear.map((c) => c[0]));
    expect(cats.includes('hand'), 'ずかんに もちもの の しゅるいが ない ' + cats);
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    st = await H.dbg('handItems');
    expect(st.held[lead] === 'hi_balloon_red' && st.held.gachan === 'hi_tote' && st.held.goji === 'hi_balloon_star', 'さいかいで もちもの が きえる ' + JSON.stringify(st));
  }, { full: true, viewport, timeout: 150000 });
}
