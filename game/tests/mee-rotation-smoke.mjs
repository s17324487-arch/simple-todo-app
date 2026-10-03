// Meeときょれじゃ の ガチャの しゅうがわり（js/mee-rotation.js・js/gacha-forest-more.js・UI-62。オーナーの FB 2026-10-03「ときょれじゃの景品やガチャガチャの中身は、定期的に変わるようにしろ。そのための機能と景品も実装しておけ」）
// 1. 2026-10-01（1しゅうめ）の 4F: しまごとに 1だい あたらしい シリーズ（NEW の はた）・ガチャの がめんに「NEW！ あたらしい ガチャ」・あたらしい けいひんが でる
// 2. 2026-10-05（2しゅうめ）: 3F へ おりて また 4F → 「ガチャの なかみが いれかわったよ」・しまごとに 1だい だけ かわる（ほかは おなじ 台）・「また はいった」「らいしゅうは おやすみ」
// 3. さいかい しても さいごに みた しゅう（Save.d.gacha.week）が のこる
// mee-corner: 2F の ガチャ コーナーの 4くみ（UI-63）・かんばんの おしらせ・めがねを かける
export async function meeRotationSmoke({ scenario, expect }) {
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const tag = pn && pn.querySelector('.gacha-week'), side = pn && pn.querySelector('.gacha-side'), g = document.createRange(); if (tag) g.selectNodeContents(tag);
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5,
      tag: tag ? tag.textContent : '', tagIn: !!tag && !!side && r(tag).right <= r(side).right + 0.5 && r(tag).left >= r(side).left - 0.5, tagLines: tag ? new Set([...g.getClientRects()].map((q) => Math.round(q.top))).size : 0, title: (pn && pn.querySelector('.panel-title') || {}).textContent || '' };
  });
  const machines = (s) => s.fixtures.filter((f) => f.kind === 'gacha' && f.ring).map((f) => ({ ring: f.ring, slot: f.slot, series: f.series, fresh: !!f.fresh, x: f.x, y: f.y })).sort((a, b) => (a.ring + a.slot).localeCompare(b.ring + b.slot));
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('mee-rotation-' + viewport.width, async (H) => {
    await H.newGameFast(); const c0 = await H.dbg('coins', 3000); await H.dbg('calendar', '2026-10-01'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    // 1. 1しゅうめ: あたらしい 6シリーズが しまに 1だいずつ（NEW）
    const rot = await H.dbg('meeRotation'), gf = await H.dbg('gachaForest'), idx = Object.fromEntries(gf.series.map((S) => [S.id, S.index]));
    const more = gf.series.filter((S) => S.more).map((S) => S.id);
    expect(rot.week === 1 && more.length === 6 && rot.rings.filter((r) => r.floor === 4).every((r) => r.slots.filter((x) => x.fresh && x.debut).length === 1 && more.includes(r.slots.find((x) => x.fresh).id)), '1しゅうめの しまに あたらしい シリーズ ' + JSON.stringify(rot).slice(0, 300));
    await H.dbg('venue', 'arcade', 4); await H.idle(); await arrive(H, 4); await H.wait(900);
    let s = await H.dbg('venueState'); const m1 = machines(s);
    expect(m1.length === 18 && m1.filter((m) => m.fresh).length === 6 && more.every((id) => m1.some((m) => m.series === idx[id] && m.fresh)), '4F の 台に あたらしい シリーズ（NEW） ' + JSON.stringify(m1).slice(0, 300));
    await H.shot('week1');
    // うみの まちぼうけ の 台 → ふだ「NEW！ あたらしい ガチャ」・レアの しろくま
    expect(await H.dbg('gachaVisit', 'machisea'), 'うみの まちぼうけ の 台が ない');
    await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400);
    let L = await fits(H);
    expect(L.title === '「うみの まちぼうけ」' && L.tag === 'NEW！ あたらしい ガチャ' && L.tagIn && L.tagLines === 1 && !L.wide && !L.page && L.edge, 'あたらしい ガチャの がめん ' + JSON.stringify(L));
    await H.shot('new-open');
    await H.dbg('gachaFast', 4); await H.dbg('gachaNext', 3); await H.page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000);
    await H.page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(300);
    const g = await H.dbg('gachaState');
    expect(g.last.id === 'gacha_machisea_3' && g.last.rare && (await H.dbg('saveData')).furn.gacha_machisea_3 === 1 && g.coins === c0 - 200, 'あたらしい けいひんが でない ' + JSON.stringify(g.last));
    await H.shot('new-prize');
    await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000);
    expect((await H.dbg('saveData')).gacha.week === 1, 'はじめて きた しゅうが きろく されない');
    // 2. 2しゅうめ（げつようび）: 3F へ おりて また 4F → おしらせ・しまごとに 1だい だけ いれかわる
    await H.dbg('calendar', '2026-10-05');
    expect(await H.dbg('venueVisit', '3Fへ おりる'), '4F に 3F への エスカレーターが ない'); await arrive(H, 3); await H.wait(300);
    expect(await H.dbg('venueVisit', '4Fへ のぼる'), '3F に 4F への エスカレーターが ない'); await arrive(H, 4);
    await H.page.locator('.toast', { hasText: 'ガチャの なかみが いれかわったよ' }).waitFor({ timeout: 5000 });
    await H.shot('week2');
    s = await H.dbg('venueState'); const m2 = machines(s);
    const changed = m2.filter((m, i) => m.series !== m1[i].series), byRing = new Set(changed.map((m) => m.ring));
    expect(m2.length === 18 && changed.length === 6 && byRing.size === 6 && changed.every((m) => m.fresh) && m2.filter((m) => m.fresh).length === 6 && m2.every((m, i) => m.x === m1[i].x && m.y === m1[i].y), '2しゅうめ: しまごとに 1だい だけ いれかわる ' + JSON.stringify(changed));
    expect((await H.dbg('saveData')).gacha.week === 2, 'しゅうの きろくが かわらない');
    // もどって きた シリーズ（また）と らいしゅう やすむ シリーズ（おやすみ）の ふだ
    const rot2 = await H.dbg('meeRotation'), r0 = rot2.rings.find((r) => r.id === '4f-machi'), back = r0.slots.find((x) => x.fresh), last = r0.slots.find((x) => x.leaving);
    for (const [x, want] of [[back, 'NEW！ また きた ガチャ'], [last, 'らいしゅうは おやすみ']]) {
      expect(await H.dbg('gachaVisit', x.id), x.id + ' の 台が ない');
      await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(350);
      L = await fits(H);
      expect(L.tag === want && L.tagIn && L.tagLines === 1 && !L.wide && !L.page, x.id + ' の ふだ ' + JSON.stringify(L));
      await H.shot('tag-' + x.id);
      await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000);
    }
    // やすみの シリーズは 4F に ない
    const rest = r0.resting[0]; expect(rest && !m2.some((m) => m.series === idx[rest]) && !(await H.dbg('gachaVisit', rest)), 'やすみの シリーズが 台に ある ' + rest);
    // あんない（4F）に いれかえの こと
    const dir = s.fixtures.find((f) => f.kind === 'directory');
    expect(dir && /まいしゅう げつようびに しまごとに 1だいずつ いれかわる/.test(dir.text), 'もりの あんないに いれかえの こと が ない');
    // 3. さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    expect((await H.dbg('saveData')).gacha.week === 2 && (await H.dbg('saveData')).furn.gacha_machisea_3 === 1, 'さいかいで しゅうの きろく・けいひんが きえる');
    await H.dbg('calendar', null); await H.dbg('hour', null);
  }, { viewport, timeout: 240000 });
  // 2F の ガチャ コーナー（UI-63・js/gacha-corner-more.js）: 3だいずつ 4くみ。1しゅうめに あたらしい 4シリーズ → かんばんの おしらせ → 2しゅうめに くみごとに 1だい → めがねを かける
  const NEWS = ['okashihouse', 'workcar', 'mushi', 'funglasses'], NEWNAMES = ['おかしの おうち', 'はたらく くるま', 'ころころ むしさん', 'ゆかいな めがね'];
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('mee-corner-' + viewport.width, async (H) => {
    await H.newGameFast(); const c0 = await H.dbg('coins', 3000); await H.dbg('calendar', '2026-10-01'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const rot = await H.dbg('meeRotation'), r2 = rot.rings.filter((r) => r.floor === 2);
    expect(r2.length === 4 && r2.every((r) => r.slots.length === 3 && r.slots.filter((x) => x.fresh && x.debut).length === 1) && NEWS.every((id) => r2.some((r) => r.slots.some((x) => x.id === id && x.debut))), '1しゅうめの 2F の くみ ' + JSON.stringify(r2).slice(0, 300));
    await H.dbg('venue', 'arcade', 2); await H.idle(); await arrive(H, 2); await H.wait(900);
    let s = await H.dbg('venueState'); const m1 = machines(s);
    expect(m1.length === 12 && m1.filter((m) => m.fresh).length === 4 && new Set(m1.map((m) => m.series)).size === 12, '2F の 12だい・NEW は 4だい ' + JSON.stringify(m1));
    // ガチャ コーナーの まえ（てまえの とおりみち）から 12だい ぜんぶ みえる
    expect(await H.dbg('venueWalk', 13, 11), 'ガチャ コーナーの まえへ あるけない'); await H.until(() => { const v = PokaDebug.venueState(); return v && Math.hypot(v.party[0].x - 13, v.party[0].y - 11) < 0.6 && PokaDebug.idle(); }, 25000); await H.wait(600);
    await H.shot('week1');
    // はたらく くるま の 台 → ふだ「NEW！ あたらしい ガチャ」・レアの はしごしゃ（へやに かざる）
    expect(await H.dbg('gachaVisit', 'workcar'), 'はたらく くるま の 台が ない');
    await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400);
    let L = await fits(H);
    expect(L.title === '「はたらく くるま」' && L.tag === 'NEW！ あたらしい ガチャ' && L.tagIn && L.tagLines === 1 && !L.wide && !L.page && L.edge, 'はたらく くるま の がめん ' + JSON.stringify(L));
    await H.shot('workcar');
    const spin = async (k) => { await H.dbg('gachaFast', 4); await H.dbg('gachaNext', k); await H.page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000); await H.page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(300); return H.dbg('gachaState'); };
    const close = async () => { await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000); };
    let g = await spin(3);
    expect(g.last.id === 'gacha_workcar_3' && g.last.rare && (await H.dbg('saveData')).furn.gacha_workcar_3 === 1 && g.coins === c0 - 200, 'はしごしゃが でない ' + JSON.stringify(g.last));
    await H.shot('workcar-rare'); await close();
    // ゆかいな めがね（てまえ みぎの くみ・アクセサリー）→ ぐるぐる めがね
    expect(await H.dbg('gachaVisit', 'funglasses'), 'ゆかいな めがね の 台が ない');
    await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400);
    L = await fits(H);
    expect(L.title === '「ゆかいな めがね」' && L.tag === 'NEW！ あたらしい ガチャ' && L.tagLines === 1 && !L.wide && !L.page && L.edge, 'ゆかいな めがね の がめん ' + JSON.stringify(L));
    g = await spin(0);
    expect(g.last.id === 'gacha_funglasses_0' && (await H.dbg('saveData')).wardrobe.gacha_funglasses_0 === true, 'ぐるぐる めがねが もちものに ない ' + JSON.stringify(g.last));
    await H.shot('glasses-prize'); await close();
    // かんばん（ガチャ コーナー）: こんしゅうの NEW・つぎの いれかえ
    expect(await H.dbg('venueVisit', 'ガチャ コーナー'), 'ガチャ コーナーの かんばんが ない');
    await H.page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 20000 });
    const board = await H.eval(() => { const d = document.querySelector('.dialog').getBoundingClientRect(); return { text: document.querySelector('.dlg-text').innerText, name: document.querySelector('.dlg-name').textContent, fit: d.left >= -0.5 && d.right <= innerWidth + 0.5 && d.top >= -0.5 && d.bottom <= innerHeight + 0.5 }; });
    expect(board.name === 'ガチャ コーナー' && /こんしゅうの NEW/.test(board.text) && NEWNAMES.every((n) => board.text.includes(n)) && board.text.includes('つぎの いれかえは 10がつ 5にち') && board.fit, 'かんばんの おしらせ ' + JSON.stringify(board));
    await H.shot('board'); await H.dialogs(); await H.idle();
    // 2. 2しゅうめ: 1F へ おりて また 2F → おしらせ・くみごとに 1だい だけ いれかわる
    await H.dbg('calendar', '2026-10-05');
    expect(await H.dbg('venueVisit', '1Fへ おりる'), '2F に 1F への エスカレーターが ない'); await arrive(H, 1); await H.wait(300);
    expect(await H.dbg('venueVisit', '2Fへ のぼる'), '1F に 2F への エスカレーターが ない'); await arrive(H, 2);
    await H.page.locator('.toast', { hasText: 'ガチャの なかみが いれかわったよ' }).waitFor({ timeout: 5000 });
    s = await H.dbg('venueState'); const m2 = machines(s);
    const changed = m2.filter((m, i) => m.series !== m1[i].series), byRing = new Set(changed.map((m) => m.ring));
    expect(m2.length === 12 && changed.length === 4 && byRing.size === 4 && changed.every((m) => m.fresh) && m2.filter((m) => m.fresh).length === 4 && m2.every((m, i) => m.x === m1[i].x && m.y === m1[i].y), '2しゅうめ: くみごとに 1だい だけ いれかわる ' + JSON.stringify(changed));
    await H.shot('week2');
    // 3. おうちの きがえで ぐるぐる めがねを かける（かおの タブ）
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ'); await H.page.getByRole('button', { name: 'かお', exact: true }).click(); await H.wait(200);
    await H.page.locator('.panel .grid .card').filter({ hasText: 'ぐるぐる めがね' }).click(); await H.wait(300);
    expect(await H.eval(() => Save.d.chars[Save.d.order[0]].outfit.face) === 'gacha_funglasses_0', 'きがえで ぐるぐる めがねを かけられない');
    await H.shot('glasses'); await H.page.click('.modal-wrap .close'); await H.until(() => !G.scene.mode, 8000);
    await H.dbg('calendar', null); await H.dbg('hour', null);
  }, { viewport, timeout: 240000 });
}
