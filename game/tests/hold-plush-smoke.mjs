// ぬいぐるみ・フィギュアを もつ（js/hold-plush.js・UI-113。オーナーの 指示 2026-10-09「ぬいぐるみなどを持てるようにして。」）
// 1. くまの ぬいぐるみ・いちばんくじの ぬいぐるみ（1こずつ）を もつ → おうちの きがえ →「もちもの」の タブに でる（カードは 44px・はみ出さない）
// 2. わんこに くま・がちゃんに くじの ぬいぐるみ → ごじが くまを えらぶと わんこから わたして もらう
// 3. おうちと まちで 手に だいて いる（絵）→ さいかい しても のこる
export async function holdPlushSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length,
      names: cards.map((c) => c.textContent), undef: cards.some((c) => /undefined|NaN/.test(c.textContent)) };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('hold-plush-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    let st = await H.dbg('holdPlush');
    expect(st && st.kinds >= 200 && st.owned.length === 0, 'もてる ものの ようす ' + JSON.stringify(st && { kinds: st.kinds, owned: st.owned }));
    expect(await H.dbg('furnSet', 'teddy', 1) && await H.dbg('furnSet', 'kj_law_a', 1), '家具が ない');
    const nm = await H.eval(() => ({ teddy: FURN_INDEX.teddy.name, kuji: FURN_INDEX.kj_law_a.name }));
    // 1. きがえの もちもの
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.houseButton('きがえ'); await H.wait(300);
    const pick = async (who, name) => {
      await H.page.locator('.modal-wrap:not(.out) .who-tabs .who-tab').filter({ hasText: await H.eval((w) => Save.d.chars[w].name, who) }).first().click(); await H.wait(150);
      await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(200);
      await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: name }).first().click(); await H.wait(250);
    };
    // 2. もつ・わたす
    await pick('wanko', nm.teddy); await pick('gachan', nm.kuji);
    st = await H.dbg('holdPlush');
    expect(st.held.wanko === 'hold_teddy' && st.held.gachan === 'hold_kj_law_a', 'えらんでも もてない ' + JSON.stringify(st.held));
    await pick('goji', nm.teddy);
    let L = await fits(H);
    expect(L.names.some((t) => t.includes(nm.teddy)) && L.names.some((t) => t.includes(nm.kuji)) && !L.wide && !L.page && !L.small && !L.undef, 'もちものの タブが ちがう・はみ出す ' + JSON.stringify(L));
    await H.shot('dress');
    st = await H.dbg('holdPlush');
    expect(st.held.goji === 'hold_teddy' && !st.held.wanko && st.held.gachan === 'hold_kj_law_a', 'わんこから わたして もらえない ' + JSON.stringify(st.held));
    await H.page.click('.modal-wrap:not(.out) .close'); await H.until(() => !G.scene.mode, 8000);
    st = await H.dbg('holdPlush');
    expect(st.drawn.goji && st.drawn.gachan, '手に だいて いない ' + JSON.stringify(st.drawn));
    await H.dbg('homeBubbleFixture'); await H.wait(600); await H.shot('house');
    // 3. まち・さいかい
    await H.dbg('teleport', 'town', 12, 12); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000); await H.wait(700);
    await H.shot('town');
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    st = await H.dbg('holdPlush');
    expect(st.held.goji === 'hold_teddy' && st.held.gachan === 'hold_kj_law_a', 'さいかいで きえる ' + JSON.stringify(st.held));
  }, { viewport, timeout: 150000 });
}
