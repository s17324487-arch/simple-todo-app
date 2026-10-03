// ネリカス でんき 1F の シール うりば（js/kaden-stickers.js・js/kaden-sticker-art.js・UI-57。オーナーの FB 2026-10-03「家電屋ではあるが、シールの販売を充実させよ。シールを新たに30種以上用意して…網羅せよ」）
// 1. 1F の いりぐちの ひがしに シール うりば（たな 6つ・フロアマップに「シール」）
// 2. ぷくぷくの テーブルを タップ → うりばの がめん（タブ 6・しなものの カード・はみ出さない・ボタン 44px）→ マシュマロ・シャカシャカ・タイル・ドロップを かう（コインが へる・てもとに ふえる）
// 3. おうちで すまほの「シール」: したの ならびは しゅるいごとの まとまり → マシュマロを はって タップ（ふにっ）→ シャカシャカを はって ゆびで うごかす（なかみが まう → しずむ）→ タイル シートを「きる」（9まい）
// 4. さいかい しても のこる
export async function kadenStickersSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5,
      small: bs.filter((b) => { const q = r(b); return q.height < 43.5 || q.width < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      over: [...(pn ? pn.querySelectorAll('.kst-card') : [])].filter((c) => c.scrollWidth > c.clientWidth + 1).length, text: pn ? pn.textContent : '' };
  });
  const book = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), b = document.querySelector('.smaho-body'), bs = [...document.querySelectorAll('.smaho button')].filter((x) => x.offsetParent && x.getAttribute('aria-label') !== 'ホームへ');
    return { small: bs.filter((x) => { const q = r(x); return q.width < 43.5 || q.height < 43.5; }).map((x) => x.textContent || x.getAttribute('aria-label')), wide: b.scrollWidth > b.clientWidth + 1, tall: b.scrollHeight > b.clientHeight + 1,
      tools: [...document.querySelectorAll('.stk-tool')].map((x) => x.getAttribute('aria-label')), toolsOut: [...document.querySelectorAll('.stk-tool')].some((x) => r(x).right > r(b).right + 0.5 || r(x).left < r(b).left - 0.5),
      groups: [...document.querySelectorAll('.stk-grp')].map((x) => x.textContent), slots: document.querySelectorAll('.stk-slot').length, on: document.querySelectorAll('.stk-on').length };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('kaden-stickers-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); const c0 = await H.dbg('coins', 5000);
    const ready = () => H.until(() => { const s = PokaDebug.venueState(); return s?.id === 'electronics' && s.floor === 1 && !s.changingFloor && PokaDebug.venueIso()?.ready && PokaDebug.idle(); }, 30000);
    // 1. うりば
    await H.dbg('venue', 'electronics'); await ready();
    let s = await H.dbg('venueState'), k = await H.dbg('kadenStickers');
    const F = s.fixtures.filter((f) => f.action === 'stickers');
    expect(F.length === 6 && k && k.products.length === 12 && !k.open && s.routeCount.every((r) => r.reachable), '1F の シール うりば ' + JSON.stringify({ n: F.length, k }));
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(250);
    const spots = await H.eval(() => [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label));
    expect(spots.includes('シール'), 'フロアマップに シール ' + spots.join('・'));
    await H.page.locator('.modal-wrap .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    // 2. ぷくぷくの テーブル → うりばの がめん
    expect(await H.dbg('venueVisit', 'ぷくぷく シールの テーブル'), 'テーブルが ない');
    await H.page.locator('.modal-wrap:not(.out) .kst-shop').waitFor({ timeout: 20000 }); await H.wait(300);
    k = await H.dbg('kadenStickers'); let L = await fits(H); const shown = await H.eval(() => 'もって いる コイン: ' + U.fmt(Save.d.coins));
    expect(k.open && k.tab === 'puku' && k.cards.join() === 'kst_mm3,kst_mmfood' && !L.wide && !L.page && L.edge && !L.small.length && !L.over && L.text.includes(shown), 'うりばの がめん ' + JSON.stringify({ k, L: { ...L, text: L.text.slice(0, 60) } }));
    await H.shot('kst-shop');
    const buy = async (pid) => { await H.page.locator(`.kst-card[data-id="${pid}"] .kst-buy`).click(); await H.wait(250); };
    await buy('kst_mm3');
    let st = await H.dbg('stickers'); let d = await H.dbg('saveData');
    expect(st.have.stk_mm_wanko === 1 && st.have.stk_mm_gachan === 1 && st.have.stk_mm_goji === 1 && d.coins === c0 - 300, 'マシュマロを かう ' + JSON.stringify({ have: st.have, coins: d.coins }));
    for (const [tab, pid] of [['シャカシャカ', 'kst_sk1'], ['タイル・レトロ', 'kst_tl'], ['ドロップ', 'kst_dp1']]) {
      await H.page.locator('.modal-wrap:not(.out) .kst-tabs .btn', { hasText: tab }).click(); await H.wait(200);
      if (pid === 'kst_sk1') { L = await fits(H); expect(!L.wide && !L.small.length && !L.over, 'シャカシャカの タブ ' + JSON.stringify(L.small)); await H.shot('kst-shop-shaka'); }
      await buy(pid);
    }
    st = await H.dbg('stickers'); d = await H.dbg('saveData');
    expect(st.have.stk_sk_sea === 1 && st.have.stk_sk_snow === 1 && st.have.stk_tl_sheet === 1 && st.have.stk_dp_heart === 2 && d.coins === c0 - 300 - 500 - 400 - 400 && (await H.dbg('kadenStickers')).bought === 4, '4つ かう ' + JSON.stringify({ have: st.have, coins: d.coins }));
    // コインが たりない ときは かえない（コインは へらない）
    await H.dbg('coins', 100 - d.coins); await H.page.locator('.modal-wrap:not(.out) .kst-tabs .btn', { hasText: 'そざい' }).click(); await H.wait(200); await buy('kst_mt2');
    d = await H.dbg('saveData'); st = await H.dbg('stickers'); expect(d.coins === 100 && !st.have.stk_mt_mirror, 'コインが たりないのに かえる');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    await H.wait(400); await H.shot('kst-corner');
    // 3. おうちで シールちょう
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.phone('シール'); await H.page.locator('.stk-page').waitFor({ timeout: 8000 }); await H.wait(400);
    let B = await book(H);
    expect(B.groups.join() === 'ガチャ,くじ,ぷくぷく,ドロップ,シャカシャカ,フレーク,タイル,そざい' && B.slots === st.designs.length && !B.small.length && !B.wide && !B.tall, 'したの ならびの まとまり ' + JSON.stringify(B));
    // マシュマロ: はって タップ → ふにっ
    await H.page.locator('.stk-slot[data-id="stk_mm_wanko"]').scrollIntoViewIfNeeded(); await H.page.locator('.stk-slot[data-id="stk_mm_wanko"]').click(); await H.wait(250);
    let bb = await H.page.locator('.stk-on[data-id="stk_mm_wanko"]').boundingBox();
    await H.page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await H.page.mouse.down();
    const squish = await H.eval(() => document.querySelector('.stk-on[data-id="stk_mm_wanko"]').classList.contains('squish'));
    await H.page.mouse.up(); expect(squish, 'マシュマロを タップしても ふにっと しない');
    // シャカシャカ: はって ゆびで うごかす → なかみが まう（shake）→ はなすと しずむ
    await H.page.locator('.stk-slot[data-id="stk_sk_sea"]').scrollIntoViewIfNeeded(); await H.page.locator('.stk-slot[data-id="stk_sk_sea"]').click(); await H.wait(250);
    const layers = await H.eval(() => { const e = document.querySelector('.stk-on.stk-shaka[data-id="stk_sk_sea"]'); return e ? [...e.querySelectorAll('img')].map((i) => i.className).join() : ''; });
    expect(layers === 'stk-shk-base,stk-shk-rest,stk-shk-up,stk-shk-top', 'シャカシャカの 4まい ' + layers);
    bb = await H.page.locator('.stk-on[data-id="stk_sk_sea"]').boundingBox();
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, n0 = await H.eval(() => StickerBook.ui.shake);
    await H.page.mouse.move(cx, cy); await H.page.mouse.down();
    for (let i = 1; i <= 8; i++) await H.page.mouse.move(cx + (i % 2 ? 34 : -34), cy + (i % 2 ? -10 : 10), { steps: 3 });
    const mid = await H.eval(() => { const e = document.querySelector('.stk-on.stk-shaka[data-id="stk_sk_sea"]'); return { shake: e.classList.contains('shake'), up: +getComputedStyle(e.querySelector('.stk-shk-up')).opacity }; });
    await H.shot('kst-shake', { pause: false });
    await H.page.mouse.up(); await H.wait(1400);
    const after = await H.eval(() => { const e = document.querySelector('.stk-on.stk-shaka[data-id="stk_sk_sea"]'); return { shake: e.classList.contains('shake'), up: +getComputedStyle(e.querySelector('.stk-shk-up')).opacity, n: StickerBook.ui.shake }; });
    expect(mid.shake && mid.up > 0.3 && !after.shake && after.up < 0.05 && after.n > n0, 'シャカシャカの なかみが うごかない ' + JSON.stringify({ mid, after }));
    // タイル シート: はって「きる」→ 9まい
    await H.page.locator('.stk-slot[data-id="stk_tl_sheet"]').scrollIntoViewIfNeeded(); await H.page.locator('.stk-slot[data-id="stk_tl_sheet"]').click(); await H.wait(250);
    B = await book(H);
    expect(B.tools.join() === 'ひだりに まわす,みぎに まわす,ちいさく,おおきく,はさみで きる,はがす' && !B.small.length && !B.toolsOut, 'タイル シートの ボタン ' + JSON.stringify(B));
    await H.shot('kst-tile-sheet');
    await H.page.getByRole('button', { name: 'はさみで きる', exact: true }).click(); await H.wait(300);
    st = await H.dbg('stickers');
    const ids = st.pages[0].list.map((x) => x[0]);
    expect(!ids.includes('stk_tl_sheet') && ['stk_tl_heart', 'stk_tl_star', 'stk_tl_smile', 'stk_tl_rainbow', 'stk_tl_berry', 'stk_tl_cho', 'stk_tl_phone', 'stk_tl_note', 'stk_tl_ribbon'].every((id) => ids.includes(id) && st.got[id] === 1) && ids.length === 11, 'タイルを きると 9まいに ならない ' + JSON.stringify(ids));
    B = await book(H); expect(B.on === 11 && !B.small.length && !B.wide && !B.tall, 'きった あとの ページ ' + JSON.stringify(B));
    await H.shot('kst-book');
    // 4. さいかい
    const before = await H.dbg('stickers'); await H.dbg('smaho', null); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const again = await H.dbg('stickers');
    expect(JSON.stringify(again.pages) === JSON.stringify(before.pages) && JSON.stringify(again.have) === JSON.stringify(before.have) && JSON.stringify(again.got) === JSON.stringify(before.got), 'さいかいで シールちょうが かわる');
  }, { viewport, timeout: 240000 });
}
