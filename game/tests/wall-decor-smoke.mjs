// かべかざり 24しゅ（js/wall-decor.js・UI-116。オーナーの 指示 2026-10-09「壁に飾れるアイテムを増やして。」）
// 1. かぐやさんの「かべかざり」: ひがわり 2つの つぎに あたらしい 24しゅ（「あたらしい」の ふだ・カードは 44px・はみ出さない）→ すいそうを かう
// 2. おうちの かべに 8つ かざる（おくの かべ・ひだりの かべ）→ すいそう・かざぐるま・とけいを タップすると うごく・よるは ほしの ライトが つく
export async function wallDecorSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length,
      tags: cards.map((c) => { const t = c.querySelector('.wd-tag'); if (!t) return null; const a = r(c), b = r(t); return b.left >= a.left - 1 && b.right <= a.right + 1 && b.top >= a.top - 1; }), daily: cards.map((c) => !!c.querySelector('.daily-tag')) };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('wall-decor-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear'); await H.dbg('coins', 20000);
    const names = await H.eval(() => Object.fromEntries(WallDecor.IDS.map((id) => [id, FURN_INDEX[id].name])));
    // 1. かぐやさん
    await H.dbg('store', 'furniture'); await H.idle(30000);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.waitForSelector('.modal-wrap .grid .card'); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out) .tabs .tab', { hasText: 'かべかざり' }).click(); await H.wait(300);
    const L = await fits(H);
    expect(L.daily[0] && L.daily[1] && L.tags.slice(2, 26).every((x) => x === true) && L.tags.filter((x) => x !== null).length === 24, '「かべかざり」の ならび・ふだ ' + JSON.stringify(L.tags.slice(0, 28)));
    expect(!L.wide && !L.page && !L.small, 'かぐやの カードが はみ出す・ちいさい ' + JSON.stringify(L));
    await H.shot('shop');
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: names.wd_fish_tank }).first().click(); await H.wait(300);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click(); await H.wait(400);
    expect(((await H.dbg('saveData')).furn.wd_fish_tank || 0) === 1, 'すいそうが かえない');
    for (let i = 0; i < 4 && await H.page.locator('.modal-wrap:not(.out)').count(); i++) { await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'とじる', exact: true }).click(); await H.wait(300); }
    // 2. おうちの かべ
    for (const id of ['wd_round_clock', 'wd_pinwheel', 'wd_star_lights', 'wd_trio_portrait', 'wd_records', 'wd_kite', 'wd_world_map']) await H.dbg('furnSet', id, 1);
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle();
    await H.dbg('homeLayout', [{ id: 'wd_fish_tank', x: 120, y: 120 }, { id: 'wd_round_clock', x: 230, y: 70 }, { id: 'wd_star_lights', x: 330, y: 40 }, { id: 'wd_trio_portrait', x: 400, y: 120 },
      { id: 'wd_pinwheel', x: 90, y: 110, wallSide: 'left' }, { id: 'wd_kite', x: 200, y: 100, wallSide: 'left' }, { id: 'wd_records', x: 300, y: 70, wallSide: 'left' }, { id: 'bed_simple', x: 360, y: 440 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(1200); await H.shot('room');
    for (const id of ['wd_fish_tank', 'wd_pinwheel', 'wd_round_clock', 'wd_kite']) {
      let lv = await H.dbg('furnLive', id); expect(lv && lv.tap, id + ' を タップする ところが ない ' + JSON.stringify(lv));
      const n0 = lv.n || 0, t0 = lv.t; await H.tap(lv.tap.x, lv.tap.y); await H.wait(260);
      lv = await H.dbg('furnLive', id); expect(lv.t < 1 && (id === 'wd_round_clock' ? true : (lv.n || 0) === n0 + 1) && lv.live === ['wd_fish_tank', 'wd_pinwheel', 'wd_round_clock', 'wd_kite'].includes(id), id + ' を タップしても うごかない ' + JSON.stringify([lv, n0, t0]));
    }
    await H.shot('tap');
    // よるは ほしの ライトが はじめから つく
    await H.dbg('hour', 21); await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle(); await H.wait(800);
    const lt = await H.dbg('furnLive', 'wd_star_lights'); expect(lt && lt.on, 'よるに ほしの ライトが つかない ' + JSON.stringify(lt));
    await H.shot('night');
  }, { viewport, timeout: 150000 });
}
