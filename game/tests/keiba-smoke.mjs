// ネリカス でんき 10F の けいば ちゅうけい コーナー（js/keiba-*.js・UI-58。オーナーの FB 2026-10-03「建物内に競馬中継コーナーを用意して、実際に賭けて遊べるようにせよ」）
// 1. 10F の みなみがわに コーナー（什器 16・とどく・フロアマップに「けいば ちゅうけい」）
// 2. じどう はつばいき → しゅつばひょう（はみ出さない・ボタン 44px）→ たんしょう（うまを タップ・3まい）・3れんたん ボックス（3とう → 6てん）・わくれん を かう（コインが へる）。
//    1レース 30まい を こえる ときは かえない
// 3. おおがた ビジョン →「ちゅうけいを みる」→ ゲート → スタート → ちゅうけい → ゴール → ちゃくじゅんの ばん → けっかの まど（はらいもどしの ひょう・あなたの ばけん）
//    →「はらいもどしを うける」で ほんものと おなじ けいさんの コインが ふえる（たんしょう ×3・3れんたん ×1・わくれん）
// 4. 10F に もどる（つぎの レース）・はらいもどしき・けいば しんぶん・あそびかた。さいかい しても のこる。つぎの 日に なると まえの 日の ばけんを しめきる
export async function keibaSmoke({ scenario, expect }) {
  const fits = (H, sel = '.kb-panel') => H.eval((sel) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) ' + sel)].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent && !b.closest('.kb-races')) : [];
    const rows = pn ? [...pn.querySelectorAll('.kb-row:not(.kb-th), .kb-pay, .kb-ticket, .kb-news-row')] : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5,
      small: bs.filter((b) => { const q = r(b); return q.height < 43.5 || q.width < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      over: rows.filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.className), rowsSmall: [...(pn ? pn.querySelectorAll('.kb-row.pick') : [])].filter((x) => r(x).height < 43.5).length, text: pn ? pn.textContent : '' };
  }, sel);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('keiba-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); const c0 = await H.dbg('coins', 20000);
    const ready = () => H.until(() => { const s = PokaDebug.venueState(); return s?.id === 'electronics' && s.floor === 10 && !s.changingFloor && PokaDebug.venueIso()?.ready && PokaDebug.idle(); }, 30000);
    // 1. コーナー
    await H.dbg('venue', 'electronics', 10); await ready();
    let s = await H.dbg('venueState'), k = await H.dbg('keiba');
    const F = s.fixtures.filter((f) => f.action === 'keiba');
    expect(F.length === 16 && k.next === 1 && !k.run.length && s.routeCount.every((r) => r.reachable), '10F の けいば コーナー ' + JSON.stringify({ n: F.length, k, bad: s.routeCount.filter((r) => !r.reachable) }));
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(250);
    const spots = await H.eval(() => [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label));
    expect(spots.includes('けいば ちゅうけい'), 'フロアマップに けいば ちゅうけい ' + spots.join('・'));
    await H.page.locator('.modal-wrap .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    // 2. しゅつばひょう・ばけんを かう（けっかを さきに しらべて、かならず あたる ばけんも かう）
    const R1 = await H.dbg('keibaResult', 1), card = await H.dbg('keibaCard', 1), [w1, w2, w3] = R1.order;
    expect(await H.dbg('venueVisit', 'ばけんの じどう はつばいき'), 'はつばいきが ない');
    await H.page.locator('.modal-wrap:not(.out) .kb-card').waitFor({ timeout: 20000 }); await H.wait(300);
    let L = await fits(H), U0 = await H.dbg('keibaUi');
    expect(U0.open === 'card' && U0.no === 1 && U0.rows === card.n && !L.wide && !L.page && L.edge && !L.small.length && !L.over.length && !L.rowsSmall && L.text.includes('20さいに なってから'), 'しゅつばひょう ' + JSON.stringify({ U0, L: { ...L, text: L.text.slice(0, 80) } }));
    await H.shot('kb-card');
    const row = (no) => H.page.locator(`.modal-wrap:not(.out) .kb-row[data-no="${no}"]`);
    await row(w1).click(); for (let i = 0; i < 2; i++) await H.page.locator('.modal-wrap:not(.out) .kb-units .btn').last().click();
    let ui = await H.dbg('keibaUi'); expect(ui.t === 'tan' && ui.sel.join() === String(w1) && ui.u === 3 && /^1てん × 3まい = 300 コイン・オッズ/.test(ui.sum), 'たんしょうを えらぶ ' + JSON.stringify(ui));
    await H.page.locator('.modal-wrap:not(.out) .kb-buy').click(); await H.wait(250);
    let d = await H.dbg('saveData'); expect(d.coins === c0 - 300 && (await H.dbg('keiba')).open === 1, 'たんしょうを かう ' + d.coins);
    await H.page.locator('.modal-wrap:not(.out) .kb-types .btn[data-t="tierce"]').click(); await H.page.locator('.modal-wrap:not(.out) .kb-method .btn[data-m="box"]').click();
    for (const no of [w3, w1, w2]) await row(no).click();
    ui = await H.dbg('keibaUi'); expect(ui.t === 'tierce' && ui.m === 'box' && ui.sel.length === 3 && ui.sum.startsWith('6てん × 1まい = 600 コイン'), '3れんたん ボックス ' + JSON.stringify(ui));
    L = await fits(H); expect(!L.wide && !L.small.length && !L.over.length, 'ばけんの パネル ' + JSON.stringify(L.small));
    await H.shot('kb-bet');
    await H.page.locator('.modal-wrap:not(.out) .kb-buy').click(); await H.wait(250);
    d = await H.dbg('saveData'); expect(d.coins === c0 - 900, '3れんたん ボックスを かう ' + d.coins);
    // わくれん（9とう いじょう）: 1ちゃくと 2ちゃくの わく
    const waku = card.n >= 9 ? [card.horses[w1 - 1].waku, card.horses[w2 - 1].waku] : null;
    if (waku) {
      await H.page.locator('.modal-wrap:not(.out) .kb-types .btn[data-t="waku"]').click();
      for (const w of waku) await H.page.locator(`.modal-wrap:not(.out) .kb-waku .btn[data-w="${w}"]`).click();
      ui = await H.dbg('keibaUi'); expect(ui.t === 'waku' && ui.sel.length === 2 && ui.sum.startsWith('1てん × 1まい = 100 コイン'), 'わくれん ' + JSON.stringify(ui));
      await H.page.locator('.modal-wrap:not(.out) .kb-buy').click(); await H.wait(250);
    }
    const spent = 900 + (waku ? 100 : 0); d = await H.dbg('saveData'); expect(d.coins === c0 - spent, 'わくれんを かう ' + d.coins);
    // 30まいを こえる ときは かえない（コインは へらない）
    expect((await H.dbg('keibaBuy', 1, 'trio', [1, 2, 3, 4, 5], 10, 'box')).err?.includes('30まい'), '30まいを こえて かえる');
    expect((await H.dbg('saveData')).coins === c0 - spent, '30まいを こえた ときに コインが へる');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    // 3. ちゅうけいを みる
    const R1b = await H.dbg('keibaResult', 1);
    const per = (t, key) => (R1b.pays[t] || []).find(([k]) => k === key)?.[1] || 0;
    const want = per('tan', String(w1)) * 3 + per('tierce', w1 + '>' + w2 + '>' + w3) + (waku ? per('waku', waku.slice().sort((a, b) => a - b).join('-')) : 0);
    await H.dbg('keibaSpeed', 4);
    expect(await H.dbg('venueVisit', 'おおがた ビジョン'), 'ビジョンが ない');
    await H.page.getByRole('button', { name: 'ちゅうけいを みる', exact: true }).click();
    await H.until(() => PokaDebug.keibaScene()?.phase === 'intro', 20000); await H.wait(1200); await H.shot('kb-gate', { pause: false });
    await H.until(() => { const q = PokaDebug.keibaScene(); return q && q.phase === 'race' && q.lead > q.dist * 0.55; }, 60000); await H.shot('kb-race', { pause: false });
    let q = await H.dbg('keibaScene'); expect(q.mine.includes(w1) && q.line.length > 4 && q.won === want, 'ちゅうけいの とちゅう ' + JSON.stringify({ q, want }));
    await H.until(() => PokaDebug.keibaScene()?.kakutei, 90000); await H.wait(300); await H.shot('kb-board', { pause: false });
    q = await H.dbg('keibaScene'); expect(q.result.join() === [w1, w2, w3].join(), 'ちゃくじゅんが けっかと ちがう ' + JSON.stringify(q));
    await H.page.locator('.modal-wrap:not(.out) .kb-result').waitFor({ timeout: 20000 }); await H.wait(300);
    L = await fits(H); const tk = (await H.dbg('keibaUi')).tickets;
    expect(!L.wide && !L.page && !L.small.length && !L.over.length && tk.length === (waku ? 3 : 2) && tk.every((c) => c === 'hit') && L.text.includes('たんしょう') && L.text.includes('3れんたん'), 'けっかの まど ' + JSON.stringify({ L: { ...L, text: L.text.slice(0, 80) }, tk }));
    await H.shot('kb-result');
    const c1 = (await H.dbg('saveData')).coins;
    await H.page.locator('.modal-wrap:not(.out) .kb-claim').click();
    await H.until(() => G.sceneName === 'venue' && PokaDebug.venueIso()?.ready && PokaDebug.idle(), 30000);
    d = await H.dbg('saveData'); k = await H.dbg('keiba');
    expect(d.coins === c1 + want && want > 300 && k.next === 2 && k.run.join() === '1' && k.unpaid === 0 && k.won === want, 'はらいもどし ' + JSON.stringify({ coins: d.coins, c1, want, k }));
    await H.wait(600); await H.shot('kb-corner');
    // 4. はらいもどしき・しんぶん・あそびかた
    expect(await H.dbg('venueVisit', 'はらいもどしき'), 'はらいもどしきが ない'); await H.page.locator('.modal-wrap:not(.out) .kb-refund').waitFor({ timeout: 10000 });
    L = await fits(H); expect(L.text.includes('あたった ばけんは いま ないよ') && !L.small.length && !L.wide, 'はらいもどしき ' + L.text.slice(0, 60));
    await H.page.locator('.modal-wrap:not(.out) .kb-back').click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    expect(await H.dbg('venueVisit', 'けいば しんぶん'), 'しんぶんが ない'); await H.page.locator('.modal-wrap:not(.out) .kb-news').waitFor({ timeout: 10000 });
    L = await fits(H); const rows = await H.eval(() => document.querySelectorAll('.modal-wrap:not(.out) .kb-news-row').length);
    expect(rows === 12 && L.text.includes(R1.order.slice(0, 3).join('-')) && !L.wide && !L.over.length, 'しんぶん ' + JSON.stringify({ rows, over: L.over }));
    await H.shot('kb-news');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    expect(await H.dbg('venueVisit', 'マークカードの だい'), 'マークカードの だいが ない'); await H.page.locator('.modal-wrap:not(.out) .kb-help').waitFor({ timeout: 10000 });
    L = await fits(H); expect(['たんしょう', 'ふくしょう', 'わくれん', 'うまれん', 'ワイド', 'うまたん', '3れんぷく', '3れんたん', '72.5%', 'プラス10', '70コイン', '20さい'].every((w) => L.text.includes(w)) && !L.wide, 'あそびかた');
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && PokaDebug.idle(), 8000);
    // さいかい・つぎの 日（まだ はしらない レースの ばけんは つぎの 日に しめきる）
    expect(!(await H.dbg('keibaBuy', 2, 'fuku', [1, 2], 1, 'one')).err, 'ふくしょうを かえない');
    const before = await H.dbg('keiba'); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const again = await H.dbg('keiba');
    expect(again.run.join() === before.run.join() && again.open === 1 && again.tickets === before.tickets && again.won === before.won, 'さいかいで けいばの きろくが かわる ' + JSON.stringify({ before, again }));
    const next = await H.dbg('keibaDays', 1);
    expect(next.next === 1 && !next.run.length && next.open === 0 && next.races === 2, 'つぎの 日 ' + JSON.stringify(next));
  }, { viewport, timeout: 300000 });
}
