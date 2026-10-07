// かざりだな（js/display-shelves.js・UI-104。オーナーの 依頼 2026-10-07「また、飾り棚系の家具を増やしてほしい。」）
// 1. かぐやさん: 「かぐ」に ゆかの たな 6しゅ・「かべかざり」に かべの たな 2しゅ
// 2. しょっきだな・サイドボード・かべの かざりだな（おくの かべ）・ハニカム（ひだりの かべ）に しょっきと フィギュア → へやの 絵が かわる・そうの 絵が よめる
// 3. しょっきだなを タップ →「たなに かざる」（9・44px・はみ出さない）→ ぜんぶ もどす → ぜんぶ ならべる（しょっきから）
// 4. かべの たなを タップ → ばしょ 6 → 1つ えらんで かえる
// 5. よる: ミニ ステージ・まるい ガラスの たな に あかり・ステージは「フィギュアを かざる」（5）・はしごと きの たな
// 6. さいかいしても のこる
export async function displayShelvesSmoke({ scenario, expect }) {
  const hash = (H) => H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 61) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const lay = async (H, tag) => {
    const L = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn.querySelector('.panel-body'), bs = [...pn.querySelectorAll('.figst-slot, .btn')].filter((b) => b.offsetParent);
      return { slots: pn.querySelectorAll('.figst-slot').length, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).length, wide: body.scrollWidth > body.clientWidth + 1, edge: r(pn).left >= -0.5 && r(pn).right <= innerWidth + 0.5, page: document.documentElement.scrollWidth > innerWidth, title: pn.querySelector('.panel-title').textContent, names: [...pn.querySelectorAll('.figst-slot')].map((b) => b.getAttribute('aria-label')) };
    });
    expect(!L.small && !L.wide && L.edge && !L.page, tag + 'の がめんが はみ出す／ちいさい ' + JSON.stringify({ ...L, names: undefined }));
    return L;
  };
  const tapShelf = async (H, id) => { const a = await H.dbg('furnLive', id); expect(a && a.tap, id + ' を タップできない'); await H.tap(a.tap.x, a.tap.y); await H.page.locator('.modal-wrap:not(.out) .figst').waitFor({ timeout: 15000 }); await H.wait(300); };
  const close = async (H) => { await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.idle(); await H.wait(400); };
  const zoomShot = async (H, id, name) => {
    const a = await H.dbg('furnLive', id); await H.pinch(a.tap.x, a.tap.y, 70, 150); await H.wait(800); await H.shot(name);
    await H.pinch(a.tap.x, a.tap.y, 160, 40); await H.wait(400); expect((await H.dbg('homeDesign')).zoom === 1, 'ズームが もどらない');
  };
  const shelf = async (H, id) => (await H.dbg('displayShelves')).shelves.find((s) => s.id === id);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('display-shelves-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('unlockAll'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    // 1. かぐやさん
    const names = await H.eval(() => Object.fromEntries(DisplayShelves.IDS.map((id) => [id, FURN_INDEX[id].name])));
    await H.dbg('store', 'furniture'); await H.idle(30000);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.waitForSelector('.modal-wrap .grid .card'); await H.wait(300);
    const cards = () => H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .grid .card')].map((c) => c.textContent));
    let cs = await cards();
    const floorIds = Object.keys(names).filter((id) => !['figstand_wall', 'figstand_hex'].includes(id));
    expect(floorIds.every((id) => cs.some((t) => t.includes(names[id]))), '「かぐ」に ゆかの たなが ない ' + floorIds.filter((id) => !cs.some((t) => t.includes(names[id]))).join());
    await H.page.locator('.modal-wrap:not(.out) .tabs .tab', { hasText: 'かべかざり' }).click(); await H.wait(300);
    cs = await cards();
    expect(['figstand_wall', 'figstand_hex'].every((id) => cs.some((t) => t.includes(names[id]))), '「かべかざり」に かべの たなが ない');
    for (let i = 0; i < 4 && await H.page.locator('.modal-wrap:not(.out)').count(); i++) { await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'とじる', exact: true }).click(); await H.wait(300); }
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle();
    // 2. しょっきだな・サイドボード・かべの たな 2つ
    const { F, D } = await H.eval(() => ({ F: FigureStand.figures(), D: TableWare.DISHES }));
    const A = [{ id: 'figstand_cupboard', x: 80, y: 330 }, { id: 'figstand_sideboard', x: 270, y: 370 }, { id: 'figstand_wall', x: 150, y: 95 }, { id: 'figstand_hex', x: 120, y: 112, wallSide: 'left' }];
    await H.dbg('homeLayout', A); await H.dbg('homeBubbleFixture'); await H.wait(1200);
    const empty = await hash(H);
    let ds = await H.dbg('displayShelves');
    expect(ds.kinds === 8 && ds.wallKinds === 2 && ds.shelves.length === 4 && ds.shelves.every((s) => s.figs.every((x) => x === null) && s.live), 'からっぽの たな ' + JSON.stringify(ds.shelves));
    const comfort0 = ds.comfort;
    await H.dbg('homeLayout', [{ ...A[0], figs: D.slice(0, 9) }, { ...A[1], figs: [...F.slice(0, 3), ...D.slice(9, 12), ...F.slice(3, 6)] }, { ...A[2], figs: D.slice(14, 20) }, { ...A[3], figs: F.slice(6, 11) }]); await H.dbg('homeBubbleFixture');
    await H.until(() => { const d = PokaDebug.displayShelves(); return d.shelves.every((s) => s.ready === s.layers); }, 15000); await H.wait(600);
    ds = await H.dbg('displayShelves');
    expect(ds.shelves.map((s) => s.id + ':' + s.figs.filter(Boolean).length).join() === 'figstand_cupboard:9,figstand_sideboard:9,figstand_wall:6,figstand_hex:5' && ds.shelves[3].wallSide === 'left' && ds.comfort > comfort0, 'たなに かざれない ' + JSON.stringify(ds.shelves.map((s) => [s.id, s.figs.filter(Boolean).length, s.ready, s.layers])));
    expect(await hash(H) !== empty, 'かざっても へやの 絵が かわらない');
    await H.shot('shelves'); await zoomShot(H, 'figstand_cupboard', 'cupboard-zoom'); await zoomShot(H, 'figstand_hex', 'hex-zoom');
    // 3. しょっきだなを タップ
    await tapShelf(H, 'figstand_cupboard');
    let L = await lay(H, 'しょっきだな');
    expect(L.title === 'たなに かざる' && L.slots === 9 && L.names[0].startsWith('うえの だんの ひだり・') && L.names[8].startsWith('したの だんの みぎ・'), 'しょっきだなの まど ' + JSON.stringify({ title: L.title, n: L.slots, a: L.names[0], b: L.names[8] }));
    await H.shot('cupboard-panel');
    await H.page.getByRole('button', { name: 'ぜんぶ もどす', exact: true }).click(); await H.wait(300);
    expect((await shelf(H, 'figstand_cupboard')).figs.every((x) => x === null), 'ぜんぶ もどせない');
    await H.page.getByRole('button', { name: 'ぜんぶ ならべる', exact: true }).click(); await H.wait(400);
    let s = await shelf(H, 'figstand_cupboard');
    expect(s.figs.filter(Boolean).length === 9 && new Set(s.figs).size === 9 && await H.eval((id) => TableWare.isDish(id), s.figs[0]), 'ぜんぶ ならばない（しょっきから） ' + JSON.stringify(s.figs));
    await close(H);
    // 4. かべの たな: ばしょ 1 を えらんで かえる
    await tapShelf(H, 'figstand_wall');
    L = await lay(H, 'かべの かざりだな');
    expect(L.title === 'たなに かざる' && L.slots === 6 && L.names[0].startsWith('うえの いたの ひだり・'), 'かべの たなの まど ' + JSON.stringify({ title: L.title, n: L.slots, a: L.names[0] }));
    await H.page.locator('.modal-wrap:not(.out) .figst-slot').first().click(); await H.wait(300);
    const pick = await H.eval(() => { const c = [...document.querySelectorAll('.modal-wrap:not(.out) .figst-list .card')]; return { n: c.length, first: c[0] ? c[0].getAttribute('aria-label') : null }; });
    expect(pick.n >= 1 && pick.first, 'えらべる ものが ない ' + JSON.stringify(pick));
    await H.page.locator('.modal-wrap:not(.out) .figst-list .card').first().click(); await H.wait(400);
    s = await shelf(H, 'figstand_wall');
    expect(s.figs[0] && (await H.eval((id) => FURN_INDEX[id].name, s.figs[0])) === pick.first, 'えらんだ ものが かざれない ' + JSON.stringify([s.figs[0], pick.first]));
    await close(H);
    // 5. よる: ステージ・まるい ガラスの たな・はしご・きの たな
    await H.dbg('hour', 21);
    const B = [{ id: 'figstand_stage', x: 150, y: 400, figs: F.slice(0, 5) }, { id: 'figstand_curio', x: 340, y: 330, figs: F.slice(5, 11) }, { id: 'figstand_ladder', x: 60, y: 300, figs: [...D.slice(0, 4), ...F.slice(11, 15)] }, { id: 'figstand_tree', x: 360, y: 520, figs: F.slice(15, 22) }];
    await H.dbg('homeLayout', B); await H.dbg('homeBubbleFixture');
    await H.until(() => { const d = PokaDebug.displayShelves(); return d.shelves.every((s) => s.ready === s.layers); }, 15000); await H.wait(800);
    ds = await H.dbg('displayShelves');
    const on = Object.fromEntries(ds.shelves.map((x) => [x.id, x.on]));
    expect(on.figstand_stage === true && on.figstand_curio === true && on.figstand_ladder === false && ds.shelves.find((x) => x.id === 'figstand_tree').live === false, 'よるの あかり ' + JSON.stringify(on));
    await H.shot('night'); await zoomShot(H, 'figstand_stage', 'stage-night-zoom');
    await tapShelf(H, 'figstand_stage');
    L = await lay(H, 'ミニ ステージ');
    expect(L.title === 'フィギュアを かざる' && L.slots === 5 && L.names[0].startsWith('おくの ひだり・'), 'ステージの まど ' + JSON.stringify({ title: L.title, n: L.slots, a: L.names[0] }));
    await close(H);
    // 6. さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    ds = await H.dbg('displayShelves');
    expect(ds && ds.shelves.map((x) => x.id + ':' + x.figs.filter(Boolean).length).join() === 'figstand_stage:5,figstand_curio:6,figstand_ladder:8,figstand_tree:7', 'さいかいで かざった ものが きえる ' + JSON.stringify(ds && ds.shelves.map((x) => [x.id, x.figs.filter(Boolean).length])));
  }, { viewport, timeout: 220000 });
}
