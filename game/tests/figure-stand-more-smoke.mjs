// フィギュア だいの あたらしい 5しゅ（js/figure-stand.js・UI-93。オーナーの FB 2026-10-04「もっと棚の種類を増やせ」）
// 1. かぐやさんの「かぐ」に 5しゅ（キューブの たな・おうちの たな・アクリルの ひなだん・まわる ターンテーブル・コレクション タワー）
// 2. キューブ・おうち・タワーに フィギュアを かざる → へやの 絵に フィギュアが でる（からっぽの ときと ちがう）
// 3. タワーの かざる がめん: ばしょ 12（44px・はみ出さない）→ ぜんぶ もどす → ぜんぶ ならべる
// 4. アクリル・ターンテーブル: ターンテーブルの ばしょ 6（1ばん〜6ばん）・じかんで まわる
// 5. よるは タワーに あかり・さいかいしても のこる
export async function figureStandMoreSmoke({ scenario, expect }) {
  const NEW = { figstand_cube: 'キューブの たな', figstand_house: 'おうちの たな', figstand_acryl: 'アクリルの ひなだん', figstand_turn: 'まわる ターンテーブル', figstand_tower: 'コレクション タワー' };
  const hash = (H) => H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 61) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const lay = async (H, tag) => {
    const L = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn.querySelector('.panel-body'), bs = [...pn.querySelectorAll('.figst-slot, .btn')].filter((b) => b.offsetParent);
      return { slots: pn.querySelectorAll('.figst-slot').length, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).length, wide: body.scrollWidth > body.clientWidth + 1, edge: r(pn).left >= -0.5 && r(pn).right <= innerWidth + 0.5, page: document.documentElement.scrollWidth > innerWidth, names: [...pn.querySelectorAll('.figst-slot')].map((b) => b.getAttribute('aria-label')) };
    });
    expect(!L.small && !L.wide && L.edge && !L.page, tag + 'の がめんが はみ出す／ちいさい ' + JSON.stringify({ ...L, names: undefined }));
    return L;
  };
  const tapStand = async (H, id) => { const a = await H.dbg('furnLive', id); expect(a && a.tap, id + ' を タップできない'); await H.tap(a.tap.x, a.tap.y); await H.page.locator('.modal-wrap:not(.out) .figst').waitFor({ timeout: 15000 }); await H.wait(300); };
  // その だいを まんなかに ピンチで 2ばいに して しゃしん → もとに もどす
  const zoomShot = async (H, id, name) => {
    const a = await H.dbg('furnLive', id); await H.pinch(a.tap.x, a.tap.y, 70, 150); await H.wait(700); await H.shot(name);
    await H.pinch(a.tap.x, a.tap.y, 160, 40); await H.wait(400); expect((await H.dbg('homeDesign')).zoom === 1, 'ズームが もどらない');
  };
  const close = async (H) => { await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.idle(); await H.wait(400); };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('figure-stand-more-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('unlockAll'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    // 1. かぐやさん
    await H.dbg('store', 'furniture'); await H.idle(30000);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.waitForSelector('.modal-wrap .grid .card'); await H.wait(300);
    const shop = await H.eval((names) => { const cs = [...document.querySelectorAll('.modal-wrap:not(.out) .grid .card')]; return names.map((n) => cs.some((c) => c.textContent.includes(n))); }, Object.values(NEW));
    expect(shop.every(Boolean), 'かぐやに あたらしい だいが ない ' + JSON.stringify(shop));
    for (let i = 0; i < 4 && await H.page.locator('.modal-wrap:not(.out)').count(); i++) { await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'とじる', exact: true }).click(); await H.wait(300); }
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle();
    // 2. キューブ・おうち・タワー
    const figs = await H.eval(() => FigureStand.figures()), pick = (n, off) => figs.slice(off, off + n);
    expect(figs.length >= 30, 'フィギュアが すくない ' + figs.length);
    const A = [{ id: 'figstand_cube', x: 100, y: 330 }, { id: 'figstand_house', x: 230, y: 330 }, { id: 'figstand_tower', x: 360, y: 330 }];
    await H.dbg('homeLayout', A); await H.dbg('homeBubbleFixture'); await H.wait(900);
    const empty = await hash(H);
    await H.dbg('homeLayout', [{ ...A[0], figs: pick(9, 0) }, { ...A[1], figs: pick(9, 9) }, { ...A[2], figs: pick(12, 18) }]); await H.dbg('homeBubbleFixture'); await H.wait(1500);
    let f = await H.dbg('figStand');
    expect(f.stands.map((s) => s.id + ':' + s.figs.filter(Boolean).length).join() === 'figstand_cube:9,figstand_house:9,figstand_tower:12', 'だいに かざれない ' + JSON.stringify(f.stands.map((s) => [s.id, s.figs.filter(Boolean).length])));
    expect(await hash(H) !== empty, 'フィギュアを かざっても へやの 絵が かわらない');
    await H.shot('shelves'); await zoomShot(H, 'figstand_house', 'shelves-zoom');
    // 3. タワーの かざる がめん（12）
    await tapStand(H, 'figstand_tower');
    let L = await lay(H, 'タワー');
    expect(L.slots === 12 && L.names[0] === 'いちばん うえの ひだり・' + (await H.eval((id) => FURN_INDEX[id].name, figs[18])) && L.names[11].startsWith('いちばん したの みぎ'), 'タワーの ばしょ ' + JSON.stringify(L.names.slice(0, 2)));
    await H.shot('tower-panel');
    await H.page.getByRole('button', { name: 'ぜんぶ もどす', exact: true }).click(); await H.wait(300);
    f = await H.dbg('figStand'); expect(f.stands[2].figs.every((x) => x === null), 'ぜんぶ もどせない');
    await H.page.getByRole('button', { name: 'ぜんぶ ならべる', exact: true }).click(); await H.wait(400);
    f = await H.dbg('figStand'); expect(f.stands[2].figs.filter(Boolean).length === 12 && new Set(f.stands[2].figs).size === 12, 'ぜんぶ ならばない ' + JSON.stringify(f.stands[2].figs));
    await close(H);
    // 4. アクリル・ターンテーブル
    await H.dbg('homeLayout', [{ id: 'figstand_acryl', x: 130, y: 420, figs: pick(6, 0) }, { id: 'figstand_turn', x: 310, y: 420, figs: pick(6, 6) }]); await H.dbg('homeBubbleFixture'); await H.wait(1500);
    await H.shot('acryl-turn'); await zoomShot(H, 'figstand_turn', 'acryl-turn-zoom');
    await tapStand(H, 'figstand_turn');
    L = await lay(H, 'ターンテーブル');
    expect(L.slots === 6 && L.names.every((n, i) => n.startsWith((i + 1) + 'ばん・')), 'ターンテーブルの ばしょ ' + JSON.stringify(L.names));
    await close(H);
    const r0 = await H.eval(() => FigureStand.ringAt(FigureStand.STANDS.figstand_turn).map((p) => p.map((v) => Math.round(v * 10) / 10)));
    await H.wait(1200);
    const r1 = await H.eval(() => FigureStand.ringAt(FigureStand.STANDS.figstand_turn).map((p) => p.map((v) => Math.round(v * 10) / 10)));
    expect(JSON.stringify(r0) !== JSON.stringify(r1), 'ターンテーブルが まわらない');
    // 5. よるの タワー・さいかい
    await H.dbg('hour', 21); await H.dbg('homeLayout', [{ ...A[2], figs: pick(12, 18) }]); await H.dbg('homeBubbleFixture'); await H.wait(1200);
    const t = await H.dbg('furnLive', 'figstand_tower'); expect(t && t.on && t.live, 'よるの タワーに あかりが ない ' + JSON.stringify(t));
    await H.shot('tower-night'); await zoomShot(H, 'figstand_tower', 'tower-night-zoom');
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    f = await H.dbg('figStand'); expect(f && f.stands.length === 1 && f.stands[0].id === 'figstand_tower' && f.stands[0].figs.filter(Boolean).length === 12, 'さいかいで フィギュアが きえる ' + JSON.stringify(f && f.stands));
  }, { viewport, timeout: 200000 });
}
