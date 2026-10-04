// おねだり（js/gowaga-wish.js・UI-88。オーナーの 指示 2026-10-04「おねだりは家電やシール、ガチャガチャ、クレーンゲームも対象にして。とくにガチャガチャとクレーンゲームはよくやりたくなるようだ」）
// 1. Meeときょれじゃ 1F: まえの おねがいから 5ふん たつと じぶんから おねだり（クレーン）→ まど（なまえ・かお・2つの ボタン・はみ出さない・44px）→「また こんどね」→ おねがいに ならない
// 2. わんこの「クレーンゲーム やりたい！」→「いいよ！」→ すまほの「おねがい」→ クレーンで 1かい あそぶ → かなう → おうちで おれい →「ぎゅー！」
// 3. ネリカス でんき 10F: ごじの「マッサージチェア」→「いいよ！」→ マッサージチェアに すわると かなう
export async function gowagaBegSmoke({ scenario, expect }) {
  const askBox = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), box = document.querySelector('.dlg-shade.ask .dialog'), btns = [...document.querySelectorAll('.dlg-shade.ask .choices .btn')];
    return { text: box?.querySelector('.dlg-text')?.textContent || '', name: box?.querySelector('.dlg-name')?.textContent || '', face: !!box?.querySelector('.dlg-face svg'), btns: btns.map((b) => b.textContent),
      fit: !!box && [box, ...btns].every((e) => r(e).left >= -1 && r(e).right <= innerWidth + 1 && r(e).top >= -1 && r(e).bottom <= innerHeight + 1), tall: btns.every((b) => r(b).height >= 43.5), page: document.documentElement.scrollWidth > innerWidth };
  });
  const waitAsk = (H, ms = 15000) => H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor({ timeout: ms });
  const ready = (H, venue, fl) => H.until(([v, q]) => { const s = PokaDebug.venueState(); return s?.id === v && s.floor === q && !s.changingFloor && PokaDebug.venueIso()?.ready && PokaDebug.idle(); }, 30000, [venue, fl]);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('gowaga-beg-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 14); await H.dbg('weather', 'clear'); await H.dbg('coins', 3000);
    await H.dbg('wishGift', 'none'); // おれいの しな（UI-70）は wish-gifts の スモークで みる
    await H.dbg('venue', 'arcade', 1); await ready(H, 'arcade', 1);
    let w = await H.dbg('wish');
    expect(w.ids.length === 29 && w.begs.length === 10 && w.begHere.join() === 'do_crane,do_crane_goji' && !w.cur, 'Meeときょれじゃ 1F の おねだり ' + JSON.stringify({ begs: w.begs, here: w.begHere }));
    // 1. じぶんから おねだり（1びょう あと）→ また こんどね
    expect(await H.dbg('wishBegArm', 1), 'おねだりの じゅんびが できない');
    await waitAsk(H, 10000); await H.wait(250);
    let a = await askBox(H);
    expect(/クレーン|ぬいぐるみ/.test(a.text) && /の おねだり$/.test(a.name) && a.face && a.btns.join() === 'いいよ！,また こんどね' && a.fit && a.tall && !a.page, 'おねだりの まどが ちがう・はみ出す ' + JSON.stringify(a));
    await H.shot('beg');
    await H.page.getByRole('button', { name: 'また こんどね', exact: true }).click(); await H.wait(300);
    w = await H.dbg('wish'); expect(!w.cur && w.beg && w.beg.at === null, 'ことわっても おねがいに なる ' + JSON.stringify(w.cur));
    // 2. わんこの クレーン → いいよ → あそぶ → かなう
    expect(await H.dbg('wishBeg', 'do_crane'), 'クレーンの おねだりが できない');
    await waitAsk(H, 8000); await H.wait(200);
    a = await askBox(H); expect(a.name === 'わんこの おねだり' && /クレーンゲーム/.test(a.text), 'わんこの おねだり ' + JSON.stringify(a));
    await H.page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
    w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'do_crane' && !w.cur.done && w.cur.who === 'wanko', 'おねだりが おねがいに ならない ' + JSON.stringify(w.cur));
    expect(await H.eval(() => [...document.querySelectorAll('.toast .wish-toast')].some((t) => /おねがい/.test(t.textContent))), 'すまほに かいた トーストが ない');
    await H.phone('おねがい'); await H.wait(200);
    const hint = await H.eval(() => document.querySelector('.smaho .wish-app .wish-hint')?.textContent || '');
    expect(/クレーンゲーム/.test(hint), 'すまほの おねがいの ヒント ' + hint); await H.shot('app');
    await H.page.locator('.smaho-close').click(); await H.idle();
    expect(await H.dbg('arcadeStart', 0), 'クレーンを はじめられない');
    await H.until(() => PokaDebug.arcadeState() && !PokaDebug.state().transitioning, 20000); await H.wait(400);
    await H.page.getByRole('button', { name: 'つかむ', exact: true }).click(); await H.dbg('arcadeFast', 4);
    await H.until(() => { const r = PokaDebug.arcadeState(); return r && r.finished; }, 45000);
    w = await H.dbg('wish'); expect(w.cur && w.cur.done, 'クレーンで あそんでも かなわない ' + JSON.stringify(w.cur));
    await H.page.getByRole('button', { name: 'おみせに もどる', exact: true }).click(); await H.idle();
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house', 15000);
    await waitAsk(H, 20000); await H.wait(250);
    expect(/あまえて きた/.test((await askBox(H)).text), 'おうちで おれいが ない');
    await H.page.getByRole('button', { name: 'ぎゅー！', exact: true }).click(); await H.wait(700);
    w = await H.dbg('wish'); expect(!w.cur && w.n === 1 && w.log.join() === 'do_crane', 'おれいの あと ' + JSON.stringify(w));
    // きろく（UI-71）: はじめの おねだりは わんこ か ごじ（1F の クレーン 2しゅの どちらか）
    const kids = (await H.dbg('records')).kids, asks = ['wanko', 'gachan', 'goji'].reduce((n, id) => n + (kids[id].ask || 0), 0);
    expect(asks >= 2 && kids.wanko.ask >= 1 && kids.wanko.yes >= 1 && kids.wanko.done >= 1, 'おねだりの きろく ' + JSON.stringify(kids));
    // 3. ネリカス でんき 10F: マッサージチェア
    await H.dbg('venue', 'electronics', 10); await ready(H, 'electronics', 10);
    w = await H.dbg('wish'); expect(w.begHere.join() === 'do_massage', '10F の おねだり ' + JSON.stringify(w.begHere));
    expect(await H.dbg('wishBeg', 'do_massage'), 'マッサージの おねだりが できない');
    await waitAsk(H, 8000); await H.wait(200);
    a = await askBox(H); expect(a.name === 'ごじの おねだり' && /マッサージチェア/.test(a.text) && a.fit && a.tall, 'ごじの おねだり ' + JSON.stringify(a));
    await H.shot('beg-massage');
    await H.page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
    expect(await H.dbg('venueVisit', 'ためせる マッサージチェア'), 'マッサージチェアを しらべられない');
    await H.until(() => /もみ|ぽかぽか|ねむく/.test(document.querySelector('.dlg-text')?.textContent || ''), 15000); await H.dialogs(); await H.idle();
    w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'do_massage' && w.cur.done, 'マッサージチェアで かなわない ' + JSON.stringify(w.cur));
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'do_massage' && w.cur.done && w.n === 1, 'さいかいで おねがいが かわる ' + JSON.stringify(w));
  }, { viewport, timeout: 200000 });
}
