// たべものの バランス（js/food-balance.js・UI-35。オーナーの FB 2026-10-01「野菜単体のお腹の回復量を下げて。料理の回復量を少し上げて、ごきげんも回復するようにして。
// 他のアイテムについても、価格が高いものはごきげんも少し回復するようにバランス調整して」）:
// おうちの ごはん → カードに「おなか+N ごきげん+M」（トマト・やさいサラダ・ピーマン・きせつの パフェ。はみ出さない）
// → やさいサラダを 1ばんめの 子に → おなか +28・ごきげん +18 → トマトを そのまま → おなか +5 だけ
// → とれたて りょうりの まど: せつめい と どの ぎょうにも おなか・ごきげん（はみ出さない・ボタン 44px）
export async function foodBalanceSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('food-balance-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 12);
    for (const [id, n] of [['tomato', 2], ['salad', 1], ['pepper', 1], ['ike_cafe_2', 1]]) await H.dbg('give', id, n);
    await H.dbg('needs', 30, 40);
    const st = await H.dbg('foodBalance');
    expect(st.rawVeg.length === 10 && st.dishes.length === 10 && st.raised.length >= 30, 'PokaDebug.foodBalance() ' + JSON.stringify([st.rawVeg.length, st.dishes.length, st.raised.length]));
    const openMeal = async () => { await H.houseButton('ごはん'); await H.page.locator('.modal-wrap:not(.out) .grid .card').first().waitFor({ timeout: 8000 }); await H.wait(300); };
    const meal = () => H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), cards = [...pn.querySelectorAll('.grid .card')];
      const one = (c) => ({ name: [...c.children].find((x) => x.tagName === 'DIV' && !x.classList.contains('muted') && !x.classList.contains('ico'))?.textContent, gain: c.querySelector('.food-gain')?.textContent.replace(/\s+/g, ' ').trim(),
        down: !!c.querySelector('.fb-gain.down'), out: [...c.querySelectorAll('.fb-gain')].some((g) => r(g).right > r(c).right + 1 || r(g).left < r(c).left - 1), h: r(c).height });
      return { cards: cards.map(one), wide: pn.querySelector('.panel-body').scrollWidth > pn.querySelector('.panel-body').clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth };
    });
    await openMeal();
    let L = await meal();
    const gain = (name) => (L.cards.find((c) => c.name === name) || {}).gain;
    expect(gain('トマト') === 'おなか+5 ごきげん+8' && gain('やさいサラダ') === 'おなか+28 ごきげん+18' && gain('ピーマン') === 'おなか+5 ごきげん-4' && gain('季節のパフェ') === 'おなか+18 ごきげん+31', 'ごはんの カードに おなか・ごきげん ' + JSON.stringify(L.cards));
    expect(L.cards.find((c) => c.name === 'ピーマン').down && !L.cards.find((c) => c.name === 'トマト').down, 'ごきげんが へる ものは あかく ' + JSON.stringify(L.cards));
    expect(!L.wide && !L.page && L.cards.every((c) => !c.out && c.h >= 44), 'ごはんの カードが はみ出す ' + JSON.stringify(L));
    await H.shot('meal');
    // やさいサラダを 1ばんめの 子に（おなか 30 → 58・ごきげん 40 → 58）
    const who = (await H.dbg('saveData')).order[0];
    await H.page.locator('.modal-wrap:not(.out) .grid .card', { hasText: 'やさいサラダ' }).click(); await H.page.waitForSelector('.choices .btn', { timeout: 8000 }); await H.choose(0);
    await H.until(() => !G.scene.mode, 10000); await H.dialogs();
    let c = (await H.dbg('saveData')).chars[who];
    expect(c.hunger === 58 && c.mood === 58, 'やさいサラダで おなか +28・ごきげん +18 ' + JSON.stringify([c.hunger, c.mood]));
    // トマトを そのまま（おなか +5・ごきげん +8）
    await openMeal();
    await H.page.locator('.modal-wrap:not(.out) .grid .card', { hasText: 'トマト' }).click(); await H.page.waitForSelector('.choices .btn', { timeout: 8000 }); await H.choose(0);
    await H.until(() => !G.scene.mode, 10000); await H.dialogs();
    c = (await H.dbg('saveData')).chars[who];
    expect(c.hunger === 63 && c.mood === 66, 'トマトを そのまま たべると おなか +5 だけ ' + JSON.stringify([c.hunger, c.mood]));
    // とれたて りょうりの まど: せつめい・どの ぎょうにも おなか・ごきげん
    await openMeal();
    await H.page.locator('.modal-wrap:not(.out) .farm-cook-btn').click(); await H.page.locator('.modal-wrap:not(.out) .farm-cook').waitFor({ timeout: 8000 }); await H.wait(300);
    const ck = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), rows = [...document.querySelectorAll('.modal-wrap:not(.out) .farm-recipe')];
      return { lead: document.querySelector('.modal-wrap:not(.out) .farm-lead').textContent, rows: rows.map((x) => [x.querySelector('b').textContent, x.querySelector('.farm-gain')?.textContent.replace(/\s+/g, ' ').trim()]),
        fit: rows.every((x) => x.scrollWidth <= x.clientWidth + 1 && r(x).left >= -1 && r(x).right <= innerWidth + 1), big: rows.every((x) => r(x.querySelector('.btn')).height >= 43.5), page: document.documentElement.scrollWidth > innerWidth };
    });
    const row = (name) => (ck.rows.find((x) => x[0] === name) || [])[1];
    expect(/りょうりに すると、そのまま たべるより おなかも ごきげんも もっと もどるよ。/.test(ck.lead), 'りょうりの まどの せつめい ' + ck.lead);
    expect(ck.rows.length === 10 && ck.rows.every((x) => /^おなか\+\d+ ごきげん\+\d+$/.test(x[1] || '')) && row('やさいサラダ') === 'おなか+28 ごきげん+18' && row('ピーマンの にくづめ') === 'おなか+54 ごきげん+20', 'りょうりの まどに おなか・ごきげん ' + JSON.stringify(ck.rows));
    expect(ck.fit && ck.big && !ck.page, 'りょうりの まどが はみ出す ' + JSON.stringify(ck));
    await H.shot('cook');
  }, { viewport, timeout: 120000 });
}
