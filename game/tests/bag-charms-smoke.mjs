// バッグ・ポーチの チャーム（js/bag-charms.js・UI-123。オーナーの 指示 2026-10-13「バッグやポーチにつけられるアイテムも追加、修正してほしい。
// なお、既存の目印アクセサリーやミニフィギュアはバックやポーチにつけられるようにしてほしい。」）
// 1. ようふくやさんの「チャーム」の たな（10しゅ・はみ出さない）→ ポンポン チャームを かう
// 2. おうちの きがえ:「チャーム」の タブ（バッグを もって いないと ヒント）→ わんこに トートバッグ → ポンポン（絵に でる）
//    → がちゃんに ポシェット ＋ もって いる めじるし（わんこの めじるし）→ ごじに ガチャの ポーチ ＋ ミニマスコット
// 3. もって いない めじるしは きがえを ひらくと はずれる
export async function bagCharmsSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [], tabs = pn ? [...pn.querySelectorAll('.tabs .tab, .tabs button')].filter((b) => b.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length,
      tabsOut: tabs.filter((b) => r(b).right > innerWidth + 1 || r(b).left < -1).length, names: cards.map((c) => c.textContent), note: pn ? [...pn.querySelectorAll('.grid .note')].map((n) => n.textContent).join('|') : '' };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('bag-charms-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 20000); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    let st = await H.dbg('bagCharms');
    expect(st && st.items.length === 10 && st.proxies >= 18 && st.shopTab && !st.owned.length, 'チャームの ようす ' + JSON.stringify({ ...st, owned: st && st.owned.length }));
    // 1. ようふくやさん
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('チャーム', { exact: true }).click(); await H.wait(250);
    let L = await fits(H);
    expect(L.names.filter((t) => /チャーム|ポンポン/.test(t)).length >= 10 && !L.wide && !L.page && !L.small && !L.tabsOut, 'チャームの たな ' + JSON.stringify({ ...L, names: L.names.length }));
    await H.shot('shop');
    await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: 'ポンポン チャーム' }).first().click(); await H.wait(250);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(300);
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    expect((await H.dbg('saveData')).wardrobe.bc_pompom_pink, 'ポンポン チャームを かえない');
    // 2. おうちの きがえ
    const pouch = await H.eval(() => WEAR_ITEMS.find((w) => w.wear === 'gacha_pouch').id), meji = await H.eval(() => WEAR_ITEMS.find((w) => w.wear === 'gacha_mejirushi').id);
    await H.dbg('wearSet', meji, 1); await H.dbg('furnSet', 'ike_mini_goji', 1);
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.houseButton('きがえ'); await H.wait(300);
    const tab = async (who, label) => {
      await H.page.locator('.modal-wrap:not(.out) .who-tabs .who-tab').filter({ hasText: await H.eval((w) => Save.d.chars[w].name, who) }).first().click(); await H.wait(150);
      await H.page.locator('.modal-wrap:not(.out) .tabs').getByText(label, { exact: true }).click(); await H.wait(200);
    };
    await tab('wanko', 'チャーム');
    L = await fits(H);
    expect(/バッグや ポーチを もつと つくよ/.test(L.note) && L.names.some((t) => t.includes('ポンポン チャーム')) && L.names.some((t) => t.includes(meji === 'x' ? '' : 'めじるし')) && L.names.some((t) => t.includes('ごじの ミニマスコット')) && !L.wide && !L.tabsOut, 'きがえの チャームの タブ ' + JSON.stringify(L));
    await H.shot('dress-tab');
    await H.page.locator('.modal-wrap .close').last().click(); await H.wait(400);
    await H.dbg('handHold', 'wanko', 'hi_tote'); await H.dbg('charmSet', 'wanko', 'bc_pompom_pink');
    await H.dbg('handHold', 'gachan', 'hi_pochette'); await H.dbg('charmSet', 'gachan', 'charm_' + meji);
    await H.dbg('handHold', 'goji', pouch); await H.dbg('charmSet', 'goji', 'charm_ike_mini_goji');
    st = await H.dbg('bagCharms');
    expect(Object.values(st.bag).every(Boolean) && st.drawn.wanko && st.drawn.gachan && st.drawn.goji && st.owned.length === 2, '3人の チャームが 絵に ない ' + JSON.stringify(st));
    await H.dbg('homeBubbleFixture'); await H.wait(600); await H.shot('room');
    // 3. もって いない めじるしは はずれる
    await H.dbg('wearSet', meji, 0);
    await H.houseButton('きがえ'); await H.wait(300); await tab('gachan', 'チャーム');
    st = await H.dbg('bagCharms');
    expect(st.charm.gachan === null && st.charm.wanko === 'bc_pompom_pink', 'もって いない めじるしが はずれない ' + JSON.stringify(st.charm));
  }, { viewport, timeout: 150000 });
}
