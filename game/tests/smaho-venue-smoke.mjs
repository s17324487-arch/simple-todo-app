// たてものの 中の すまほ（js/smaho.js。オーナーの FB 2026-10-03「ときょれじゃ内部やさんしゃいん内部などでスマホが見れないが、見れるようにしたい」）
// 1. Meeときょれじゃ（1F・4F）・サンシャインいけぶ（1F・12F の すいぞくかん）・はくぶつかん・ネリカス でんき・びっくぽ・アパート・がっこう で
//    左下に すまほ（44px いじょう・画面の 中・うえの ボタン〔フロア案内・たてものを でる・おうちへ〕と したの ふだに かさならない）
// 2. ひらくと 3人は あるかない（すまほの まどが ある あいだは とまる）・アプリが ひらける・とじると また あるける・Esc で ひらく／とじる
// 3. ちず:「いまは「…」の 4F に いるよ。」→「この たてものの フロアマップ」で フロアマップ・「おうちへ かえる」で おうち
export async function smahoVenueSmoke({ scenario, expect }) {
  const ready = (H, id, floor) => H.until((a) => { const s = PokaDebug.venueState(), v = PokaDebug.venueIso(); return s?.id === a[0] && s.floor === a[1] && !s.changingFloor && (!v?.iso || v.ready) && !PokaDebug.state().transitioning && PokaDebug.idle(); }, 30000, [id, floor]);
  // すまほ ボタンと ほかの ボタン・ふだの かさなり
  const layout = (H) => H.eval(() => {
    const r = (e) => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; };
    const b = document.querySelector('.smaho-btn'), on = b && !b.classList.contains('hidden');
    const others = [...document.querySelectorAll('.venue-top .btn, .store-home, .venue-controls, .hud')].filter((e) => e.offsetParent || getComputedStyle(e).position === 'fixed').map((e) => ({ t: (e.textContent || '').trim().slice(0, 12), ...r(e) }));
    const me = on ? r(b) : null, hit = (a, c) => a.x < c.x + c.w && a.x + a.w > c.x && a.y < c.y + c.h && a.y + a.h > c.y;
    return { on, me, w: innerWidth, h: innerHeight, over: me ? others.filter((o) => hit(me, o)).map((o) => o.t) : [], label: on ? b.getAttribute('aria-label') : '' };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('smaho-venue-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear');
    // 1. どの たてものの 中でも 左下に すまほ
    for (const [id, floor] of [['arcade', 1], ['arcade', 4], ['mall', 1], ['mall', 12], ['museum', 3], ['electronics', 1], ['bikkupo', 1], ['neri_apart', 1], ['school', 1]]) {
      await H.dbg('venue', id, floor); await H.until(() => !PokaDebug.state().transitioning); await H.dialogs(); await ready(H, id, floor); await H.wait(350);
      const L = await layout(H);
      expect(L.on && L.label === 'すまほ', id + floor + ' に すまほ ボタンが ない ' + JSON.stringify(L));
      expect(L.me.w >= 44 && L.me.h >= 44 && L.me.x >= 0 && L.me.x <= 12 && L.me.y >= 0 && L.me.y + L.me.h <= L.h - 40, id + floor + ' の すまほ ボタンが 左下に ない ' + JSON.stringify(L));
      expect(!L.over.length, id + floor + ' の すまほ ボタンが ほかと かさなる ' + JSON.stringify(L));
      if (id === 'arcade' && floor === 4 || id === 'mall' && floor === 12 || id === 'school') await H.shot(id + floor);
    }
    // 2. Meeときょれじゃ 4F で ひらく → 3人は とまる・アプリ → とじる → あるける
    await H.dbg('venue', 'arcade', 4); await H.until(() => !PokaDebug.state().transitioning); await H.dialogs(); await ready(H, 'arcade', 4); await H.wait(300);
    await H.page.locator('.smaho-btn:not(.hidden)').click(); await H.wait(320);
    let s = await H.dbg('smahoState');
    expect(s.open && s.phone && s.phone.x >= -0.5 && s.phone.y >= -0.5 && s.phone.x + s.phone.w <= viewport.width + 0.5 && s.phone.y + s.phone.h <= viewport.height + 0.5, 'たてものの 中で すまほが ひらかない／はみ出す ' + JSON.stringify(s));
    expect(s.apps.length === 14, 'たてものの 中の アプリの かず ' + s.apps.length);
    await H.shot('open');
    // いちばん ながく あるける むきの やじるしキー
    const way = (await H.dbg('indoorState')).directions.sort((a, b) => b.free - a.free)[0], key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[way.key];
    expect(way.free >= 2, '4F に あるける みちが ない ' + JSON.stringify(way));
    const before = (await H.dbg('venueState')).party[0];
    await H.page.keyboard.down(key); await H.wait(700); await H.page.keyboard.up(key);
    const after = (await H.dbg('venueState')).party[0];
    expect(after.x === before.x && after.y === before.y, 'すまほを ひらいて いるのに 3人が あるく ' + JSON.stringify([before, after]));
    for (const [app, sel] of [['もちもの', '.card, .note'], ['ようす', '.chara-card'], ['シール', '.stk-book .stk-page']]) {
      await H.page.locator('.smaho').getByRole('button', { name: app, exact: true }).click(); await H.wait(300);
      expect(await H.page.locator('.smaho-body').locator(sel).count() > 0, 'たてものの 中で ' + app + ' が ひらかない');
      expect(!(await H.eval(() => { const b = document.querySelector('.smaho-body'); return b.scrollWidth > b.clientWidth + 2; })), app + ' が よこに はみ出す');
      await H.page.getByRole('button', { name: 'もどる', exact: true }).click(); await H.wait(250);
    }
    // 3. ちず: いまの かい・フロアマップ
    await H.page.locator('.smaho').getByRole('button', { name: 'ちず', exact: true }).click(); await H.wait(350);
    const at = await H.eval(() => document.querySelector('.smaho-inside-at')?.textContent || '');
    expect(at === 'いまは「Meeときょれじゃ」の 4F に いるよ。', 'ちずに いまの かいが ない ' + at);
    expect(await H.page.locator('.smaho-body .area-map .amap-svg').count() > 0 && await H.page.getByRole('button', { name: 'おうちへ かえる', exact: true }).count() === 1, 'たてものの 中の ちずが 不正');
    const small = await H.eval(() => [...document.querySelectorAll('.smaho-inside .btn, .smaho-home-go')].filter((b) => { const q = b.getBoundingClientRect(); return q.height < 43.5 || q.width < 43.5; }).length);
    expect(!small, 'ちずの ボタンが 44px より ちいさい');
    await H.shot('map');
    await H.page.getByRole('button', { name: 'この たてものの フロアマップ', exact: true }).click(); await H.wait(150);
    expect(!(await H.dbg('smahoState')).open, 'フロアマップへ いくのに すまほが とじない');
    await H.page.locator('.mall-guide svg').waitFor({ timeout: 8000 }); await H.wait(250);
    expect(await H.page.locator('.mall-guide .mg-spot').count() > 3, 'すまほから フロアマップが ひらかない');
    await H.shot('guide');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(320);
    // とじたら また あるける
    await H.page.keyboard.down(key); await H.wait(700); await H.page.keyboard.up(key); await H.wait(300);
    const moved = (await H.dbg('venueState')).party[0];
    expect(moved.x !== before.x || moved.y !== before.y, 'すまほを とじても あるけない ' + JSON.stringify([before, moved]));
    // Esc で ひらく・とじる（町・おうちと おなじ）
    await H.page.keyboard.press('Escape'); await H.wait(300); expect((await H.dbg('smahoState')).open, 'たてものの 中で Esc で すまほが ひらかない');
    await H.page.keyboard.press('Escape'); await H.wait(300); expect(!(await H.dbg('smahoState')).open, 'たてものの 中で Esc で すまほが とじない');
    // おうちへ かえる（ちずから）
    await H.page.locator('.smaho-btn:not(.hidden)').click(); await H.wait(300);
    await H.page.locator('.smaho').getByRole('button', { name: 'ちず', exact: true }).click(); await H.wait(300);
    await H.page.getByRole('button', { name: 'おうちへ かえる', exact: true }).click(); await H.choose(0);
    await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000);
    expect(!(await H.dbg('smahoState')).open, 'おうちへ かえったのに すまほが ひらいた まま');
    await H.dbg('hour', null);
  }, { viewport, timeout: 180000 });
}
