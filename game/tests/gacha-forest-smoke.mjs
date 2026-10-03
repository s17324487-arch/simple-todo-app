// ガチャガチャの もり（Meeときょれじゃ 4F・js/gacha-forest.js・UI-52。オーナーの FB 2026-10-02「4階を増設して…新しい景品のガチャガチャ18台を追加して、4階はガチャガチャの森の名称にして（待ちぼうけや、スクイーズ、ポーチ、目印アクセサリー、面白いグッズなど）」）
// 1. 3F の 南東の エスカレーターで 4F へ → 「Meeときょれじゃ 4F」・ガチャ 18だい（どれも まえに いける）・フロアマップは 1F〜4F
// 2. まんなかの ガチャの しま（オーナーの FB 2026-10-03 で かべぎわから うつした）の「まちぼうけ ぽかぽか」→ はっぱの 台・レアの「まちぼうけ 3にん」（あける まで わからない）→ ポーチ・かぶりもの・スクイーズの 台
// 3. おうち: きがえで ポーチ（もちもの）と えびフライの かぶりもの・へやに スクイーズを おいて タップ → むにっ・3人が しゃべる
// 4. さいかい しても のこる → 4F から 3F へ おりる
export async function gachaForestSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [], t = pn && pn.querySelector('.panel-title'), g = document.createRange(); if (t) g.selectNodeContents(t);
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5, lines: t ? new Set([...g.getClientRects()].map((q) => Math.round(q.top))).size : 0, title: t ? t.textContent : '', text: pn ? pn.textContent : '' };
  }, tag);
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('gacha-forest-' + viewport.width, async (H) => {
    await H.newGameFast(); const c0 = await H.dbg('coins', 3000); await H.dbg('calendar', '2026-10-05'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const gf = await H.dbg('gachaForest'), idx = Object.fromEntries(gf.series.map((S) => [S.id, S.index]));
    expect(gf.series.length === 18 && gf.first === 12 && gf.machines.length === 18 && gf.squish.length === 12, '4F の シリーズ ' + JSON.stringify(gf).slice(0, 300));
    // 1. 3F → 4F（南東の すみの エスカレーター）
    await H.dbg('venue', 'arcade', 3); await H.idle(); await arrive(H, 3);
    expect(await H.dbg('venueVisit', '4Fへ のぼる'), '3F に 4F への エスカレーターが ない'); await arrive(H, 4); await H.wait(900);
    let s = await H.dbg('venueState');
    const hud = await H.eval(() => document.querySelector('.hud').textContent);
    const g4 = s.fixtures.filter((f) => f.kind === 'gacha' && f.action === 'gacha' && gf.machines.includes(f.series)); // シールの 台（UI-53）は sticker-book-smoke
    expect(s.floor === 4 && /Meeときょれじゃ 4F/.test(hud) && g4.length === 18 && g4.map((f) => f.series).join() === gf.machines.join() && s.routeCount.every((r) => r.reachable), '4F（ガチャ 18だい・いける） ' + JSON.stringify({ hud, n: g4.length, bad: s.routeCount.filter((r) => !r.reachable) }));
    await H.shot('arrive');
    // フロアマップ: 1F〜4F・4F の へや
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(300);
    const gd = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), bs = [...document.querySelectorAll('.mall-guide .btn')]; return { tabs: [...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map((b) => b.textContent).join(), spots: [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label), small: bs.filter((b) => r(b).height < 43.5).length, out: bs.filter((b) => r(b).left < -0.5 || r(b).right > innerWidth + 0.5).length, text: document.querySelector('.mall-guide').textContent }; });
    expect(gd.tabs === '1F,2F,3F,4F' && ['ガチャの しま（にし）', 'ガチャの しま（ひがし）', 'もりの あんない', 'おおきな カプセル', '3Fへ おりる'].every((l) => gd.spots.includes(l)) && !gd.spots.includes('もりの き') && !gd.small && !gd.out, '4F の フロアマップ ' + JSON.stringify(gd));
    await H.shot('guide');
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // 2. まちぼうけ ぽかぽか（まんなかの ガチャの しまの「まちぼうけ」の くみの はし）: はっぱの 台 → レアの 3にん
    expect(await H.dbg('venueVisit', 'まちぼうけ'), 'ガチャの しまの まちぼうけ が ない');
    await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400);
    let L = await fits(H, 'まちぼうけ');
    const leaf = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .gacha-machine').innerHTML.includes('#7DBA4C'));
    expect(L.title === '「まちぼうけ ぽかぽか」' && L.lines === 1 && leaf && /でるのは へやに かざる フィギュア/.test(L.text) && /まちぼうけ 3にん/.test(L.text) && /レア・まだ/.test(L.text) && !L.wide && !L.page && !L.small.length && L.edge, 'まちぼうけの 台の がめん ' + JSON.stringify({ ...L, text: L.text.slice(0, 160), leaf }));
    await H.shot('lineup');
    await H.dbg('gachaFast', 4);
    const turn = async (k) => { await H.dbg('gachaNext', k); await H.page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000);
      const hid = await H.eval(() => document.querySelectorAll('.modal-wrap:not(.out) .gacha-card.own').length);
      await H.page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(250); return { ...(await H.dbg('gachaState')), hid }; };
    let g = await turn(3);
    expect(g.last.id === 'gacha_machi3_3' && g.last.rare && g.hid === 0 && (await H.dbg('saveData')).furn.gacha_machi3_3 === 1 && g.coins === c0 - 200, 'レアの まちぼうけ 3にんが でない／あける まえに わかる ' + JSON.stringify(g.last));
    await H.shot('rare');
    await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000);
    // ポーチ（もちもの）・かぶりもの・スクイーズの 台
    const spin = async (id, k) => { await H.dbg('gachaOpen', idx[id]); await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor(); await H.wait(300); const L2 = await fits(H, id); const r = await turn(k); await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000); return { L: L2, r }; };
    let t = await spin('pouchzoo', 0);
    expect(t.r.last.id === 'gacha_pouchzoo_0' && /でるのは もちもの/.test(t.L.text) && t.L.lines === 1 && !t.L.wide && !t.L.small.length && (await H.dbg('saveData')).wardrobe.gacha_pouchzoo_0, 'ねこの ポーチが でない ' + JSON.stringify({ last: t.r.last, title: t.L.title }));
    t = await spin('kaburi', 0);
    expect(t.r.last.id === 'gacha_kaburi_0' && /でるのは アクセサリー/.test(t.L.text) && (await H.dbg('saveData')).wardrobe.gacha_kaburi_0, 'えびフライの かぶりものが でない ' + JSON.stringify(t.r.last));
    t = await spin('squishbread', 0);
    expect(t.r.last.id === 'gacha_squishbread_0' && (await H.dbg('saveData')).furn.gacha_squishbread_0 === 1 && t.r.coins === c0 - 800, 'しょくパン スクイーズが でない ' + JSON.stringify(t.r.last));
    // 3. おうち: きがえ（もちもの・あたま）→ へやに スクイーズ → タップで むにっ
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    const nm = await H.eval(() => ({ pouch: ITEM_INDEX.gacha_pouchzoo_0.name, ebi: ITEM_INDEX.gacha_kaburi_0.name }));
    await H.houseButton('きがえ'); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(200);
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.pouch }).first().click(); await H.wait(250);
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('あたま', { exact: true }).click(); await H.wait(200);
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm.ebi }).first().click(); await H.wait(250);
    L = await fits(H, 'きがえ');
    const of = await H.eval(() => Save.d.chars[Save.d.order[0]].outfit);
    expect(of.hand === 'gacha_pouchzoo_0' && (of.head === 'gacha_kaburi_0' || of.head2 === 'gacha_kaburi_0') && !L.wide && !L.page, 'きがえで ポーチ・かぶりものが つけられない ' + JSON.stringify({ of, L: { wide: L.wide, page: L.page } }));
    await H.shot('dress');
    await H.page.click('.modal-wrap:not(.out) .close'); await H.until(() => !G.scene.mode, 8000);
    await H.dbg('homeLayout', [{ id: 'gacha_squishbread_0', x: 300, y: 300 }, { id: 'gacha_machi3_3', x: 400, y: 290 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    let sq = await H.dbg('furnLive', 'gacha_squishbread_0');
    expect(sq && sq.tap, 'スクイーズを タップする ところが ない ' + JSON.stringify(sq));
    const n0 = sq.n || 0, talk0 = sq.talk;
    await H.tap(sq.tap.x, sq.tap.y); await H.wait(140); await H.shot('squish');
    await H.wait(500); sq = await H.dbg('furnLive', 'gacha_squishbread_0');
    expect((sq.n || 0) === n0 + 1 && sq.talk > talk0, 'スクイーズを タップしても むにっと しない ' + JSON.stringify(sq));
    await H.wait(900); await H.shot('room');
    // 4. さいかい → 4F から 3F へ
    const before = await H.dbg('gachaState'); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const after = await H.dbg('gachaState');
    expect(JSON.stringify(after.got) === JSON.stringify(before.got) && after.plays === before.plays && after.plays === 4, 'さいかいで ガチャの きろくが かわる ' + JSON.stringify([before.plays, after.plays]));
    await H.dbg('venue', 'arcade', 4); await H.idle(); await arrive(H, 4);
    expect(await H.dbg('venueVisit', '3Fへ おりる'), '4F に 3F への エスカレーターが ない'); await arrive(H, 3);
    s = await H.dbg('venueState'); expect(s.floor === 3, '3F へ おりられない');
  }, { full: true, viewport, timeout: 200000 });
}
