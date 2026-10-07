// しょっきを テーブルに ならべる（js/table-ware.js・UI-103。オーナーの 依頼 2026-10-07「食器系のアイテムについて、テーブルに置けるようにせよ。…新たに4,5種類がくわわると望ましい」）
// 1. かぐやさん: 「しょっき」の タブに あたらしい しょっき 8しゅ・「かぐ」に あたらしい テーブル 5しゅ（タブが はみ出さない）
// 2. あたらしい テーブル 4つに しょっきを ならべる → へやの 絵が かわる・かざりを かたづけた 絵（bare）・おいた かず と いごこち
// 3. きのテーブルを タップ → ならべる がめん（4・44px・はみ出さない）→ ぜんぶ もどす → ぜんぶ ならべる
// 4. こたつは タップで その まま つく（まえからの うごき）・もようがえで えらぶと「しょっき」の ボタン → ならべる
// 5. さいかいしても のこる
export async function tableWareSmoke({ scenario, expect }) {
  const NEW_T = { tbl_dining: 'ダイニング テーブル', tbl_cafe: 'カフェ テーブル', tbl_chabudai: 'ちゃぶだい', tbl_glass: 'ガラスの ローテーブル', tbl_heart: 'ハートの テーブル' };
  const hash = (H) => H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 61) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const lay = async (H, tag) => {
    const L = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn.querySelector('.panel-body'), bs = [...pn.querySelectorAll('.figst-slot, .btn')].filter((b) => b.offsetParent);
      return { slots: pn.querySelectorAll('.figst-slot').length, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).length, wide: body.scrollWidth > body.clientWidth + 1, edge: r(pn).left >= -0.5 && r(pn).right <= innerWidth + 0.5, page: document.documentElement.scrollWidth > innerWidth, title: pn.querySelector('.panel-title').textContent, names: [...pn.querySelectorAll('.figst-slot')].map((b) => b.getAttribute('aria-label')) };
    });
    expect(!L.small && !L.wide && L.edge && !L.page, tag + 'の がめんが はみ出す／ちいさい ' + JSON.stringify({ ...L, names: undefined }));
    return L;
  };
  const close = async (H) => { await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.idle(); await H.wait(400); };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('table-ware-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('unlockAll'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    // 1. かぐやさん
    await H.dbg('store', 'furniture'); await H.idle(30000);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.waitForSelector('.modal-wrap .grid .card'); await H.wait(300);
    const tables = await H.eval((names) => { const cs = [...document.querySelectorAll('.modal-wrap:not(.out) .grid .card')]; return names.map((n) => cs.some((c) => c.textContent.includes(n))); }, Object.values(NEW_T));
    expect(tables.every(Boolean), 'かぐやの「かぐ」に あたらしい テーブルが ない ' + JSON.stringify(tables));
    const tabs = await H.eval(() => { const ts = [...document.querySelectorAll('.modal-wrap:not(.out) .tabs .tab')], r = (e) => e.getBoundingClientRect(); return { names: ts.map((t) => t.textContent), out: ts.filter((t) => r(t).left < -0.5 || r(t).right > innerWidth + 0.5).length, page: document.documentElement.scrollWidth > innerWidth }; });
    expect(tabs.names.join() === 'かぐ,しょっき,かべかざり,かべがみ,ゆか' && !tabs.out && !tabs.page, 'かぐやの タブ ' + JSON.stringify(tabs));
    await H.page.locator('.modal-wrap:not(.out) .tabs .tab', { hasText: 'しょっき' }).click(); await H.wait(300);
    const dishes = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .grid .card')].map((c) => c.textContent));
    const want = await H.eval(() => TableWare.NEW.map((id) => FURN_INDEX[id].name));
    expect(dishes.length === 8 && want.every((n) => dishes.some((t) => t.includes(n))), '「しょっき」の タブ ' + JSON.stringify(dishes));
    await H.shot('shop-dish');
    for (let i = 0; i < 4 && await H.page.locator('.modal-wrap:not(.out)').count(); i++) { await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'とじる', exact: true }).click(); await H.wait(300); }
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle();
    // 2. あたらしい テーブル 4つ（からっぽ → しょっきを ならべる）
    const D = await H.eval(() => TableWare.DISHES), pick = (n, off) => D.slice(off, off + n);
    expect(D.length === 30, 'しょっきの かず ' + D.length);
    const A = [{ id: 'tbl_dining', x: 150, y: 330 }, { id: 'tbl_cafe', x: 360, y: 320 }, { id: 'tbl_chabudai', x: 150, y: 500 }, { id: 'tbl_heart', x: 360, y: 500 }];
    await H.dbg('homeLayout', A); await H.dbg('homeBubbleFixture'); await H.wait(900);
    const empty = await hash(H);
    let w = await H.dbg('tableWare');
    expect(w.tables.length === 4 && w.tables.every((t) => !t.bare && t.figs.every((x) => x === null)) && w.dishes === 30 && w.newDishes === 8 && w.tableKinds === 9, 'からっぽの テーブル ' + JSON.stringify(w.tables));
    const comfort0 = w.comfort;
    await H.dbg('homeLayout', [{ ...A[0], figs: pick(6, 0) }, { ...A[1], figs: pick(3, 8) }, { ...A[2], figs: pick(4, 11) }, { ...A[3], figs: ['cvc_law_plate_wanko', 'tw_soup', 'cvc_sev_plate_trio'] }]); await H.dbg('homeBubbleFixture'); await H.wait(1500);
    w = await H.dbg('tableWare');
    expect(w.tables.map((t) => t.id + ':' + t.figs.filter(Boolean).length).join() === 'tbl_dining:6,tbl_cafe:3,tbl_chabudai:4,tbl_heart:3' && w.tables.every((t) => t.bare), 'テーブルに ならばない ' + JSON.stringify(w.tables.map((t) => [t.id, t.figs.filter(Boolean).length, t.bare])));
    expect(w.free[D[0]] === 0 && w.free.tw_soup === 0 && w.free.cvc_law_plate_wanko === 0 && w.comfort > comfort0, 'おいた かず・いごこち ' + JSON.stringify({ free: w.free[D[0]], soup: w.free.tw_soup, plate: w.free.cvc_law_plate_wanko, comfort: [comfort0, w.comfort] }));
    expect(await hash(H) !== empty, 'しょっきを ならべても へやの 絵が かわらない');
    await H.shot('tables');
    const z = await H.dbg('furnLive', 'tbl_dining'); await H.pinch(z.tap.x, z.tap.y, 70, 150); await H.wait(700); await H.shot('tables-zoom');
    await H.pinch(z.tap.x, z.tap.y, 160, 40); await H.wait(400); expect((await H.dbg('homeDesign')).zoom === 1, 'ズームが もどらない');
    // 3. きのテーブルを タップ → ならべる がめん
    await H.dbg('homeLayout', [{ id: 'table_wood', x: 240, y: 380 }, { id: 'kotatsu', x: 240, y: 540 }, { id: 'teacart', x: 400, y: 330 }]); await H.dbg('homeBubbleFixture'); await H.wait(900);
    const a = await H.dbg('furnLive', 'table_wood'); expect(a && a.tap, 'きのテーブルを タップできない');
    await H.tap(a.tap.x, a.tap.y); await H.page.locator('.modal-wrap:not(.out) .figst').waitFor({ timeout: 15000 }); await H.wait(300);
    let L = await lay(H, 'きのテーブル');
    expect(L.title === 'しょっきを ならべる' && L.slots === 4 && L.names[0] === 'おくの ひだり・あいて いる' && L.names[3] === 'てまえの みぎ・あいて いる', 'きのテーブルの ばしょ ' + JSON.stringify(L));
    await H.page.getByRole('button', { name: 'ぜんぶ ならべる', exact: true }).click(); await H.wait(400);
    w = await H.dbg('tableWare'); let t = w.tables.find((x) => x.id === 'table_wood');
    expect(t.figs.filter(Boolean).length === 4 && t.bare, 'ぜんぶ ならばない ' + JSON.stringify(t));
    await H.shot('wood-panel');
    await H.page.getByRole('button', { name: 'ぜんぶ もどす', exact: true }).click(); await H.wait(300);
    w = await H.dbg('tableWare'); t = w.tables.find((x) => x.id === 'table_wood');
    expect(t.figs.every((x) => x === null) && !t.bare, 'ぜんぶ もどせない ' + JSON.stringify(t));
    // 1つずつ: ばしょ 1 に ティーセット
    await H.page.locator('.modal-wrap:not(.out) .figst-slot').first().click(); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out) .figst-list .card', { hasText: 'はなの ティーセット' }).click(); await H.wait(400);
    w = await H.dbg('tableWare'); t = w.tables.find((x) => x.id === 'table_wood');
    expect(t.figs[0] === 'tw_teaset' && t.figs.filter(Boolean).length === 1, 'えらんだ しょっきが ならばない ' + JSON.stringify(t));
    await close(H);
    // 4. こたつ: タップは まえからの うごき（つく）・もようがえの「しょっき」
    const k0 = await H.dbg('furnLive', 'kotatsu'); await H.tap(k0.tap.x, k0.tap.y); await H.wait(300);
    const k1 = await H.dbg('furnLive', 'kotatsu');
    expect(k1.on === true && !(await H.dbg('tableWare')).open, 'こたつが タップで つかない／ならべる がめんが でる ' + JSON.stringify([k0.on, k1.on]));
    await H.houseButton('もようがえ'); await H.wait(300);
    const kr = (await H.dbg('homeDesign')).items.find((x) => x.id === 'kotatsu').rect;
    await H.tap(kr.x + kr.w * 0.5, kr.y + kr.h * 0.3); await H.wait(300);
    const tool = H.page.locator('.edit-tools button', { hasText: 'しょっき' });
    expect(await tool.count() === 1, 'もようがえの「しょっき」の ボタンが ない');
    for (const b of await H.page.locator('.edit-tools button').all()) { const r = await b.boundingBox(); expect(r.height >= 44 && r.x >= 0 && r.x + r.width <= viewport.width, '操作ボタンが ちいさい／がめんの そと'); }
    await tool.click(); await H.page.locator('.modal-wrap:not(.out) .figst').waitFor({ timeout: 15000 }); await H.wait(300);
    L = await lay(H, 'こたつ');
    expect(L.slots === 4, 'こたつの ばしょ ' + L.slots);
    await H.page.getByRole('button', { name: 'ぜんぶ ならべる', exact: true }).click(); await H.wait(400);
    await close(H);
    await H.page.getByRole('button', { name: 'おわる', exact: true }).click(); await H.wait(600);
    w = await H.dbg('tableWare');
    expect(w.tables.find((x) => x.id === 'kotatsu').figs.filter(Boolean).length === 4 && w.tables.find((x) => x.id === 'kotatsu').bare, 'こたつに ならばない ' + JSON.stringify(w.tables));
    await H.shot('wood-kotatsu');
    // 5. さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    w = await H.dbg('tableWare');
    expect(w && w.tables.find((x) => x.id === 'table_wood').figs[0] === 'tw_teaset' && w.tables.find((x) => x.id === 'kotatsu').figs.filter(Boolean).length === 4, 'さいかいで しょっきが きえる ' + JSON.stringify(w && w.tables));
  }, { viewport, timeout: 200000 });
}
