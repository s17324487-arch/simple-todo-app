// ごわがの おねがい（js/gowaga-wish.js・UI-46。オーナーの FB 2026-10-02「お家で、ごわがからのお願いというイベントを追加して。…お願いを実現できたら、たくさん感謝して甘えて。」）
// 1. おうちで がちゃんの おねがい（ショートケーキ）→ まどに かお・2つの ボタン（はみ出さない・44px）→「いいよ！」→ すまほの「おねがい」に ヒント
//    → ケーキを たべさせる → かなった トースト → 3人が かけよって おれいの かけあい →「あまえて きた！」→「ぎゅー！」→ あまえる（ごきげん・なかよし）
// 2. ごじの おねがい（はくぶつかん）→ さいかい しても のこる → はくぶつかんへ（ついたら かなう）→ おうちに かえると おれい →「なでなで」
// 3. わんこの おねがい（ガチャ）を「また こんどね」→ のこらない → すまほの「3にんに きいて みる」→ まど →「また こんどね」
export async function gowagaWishSmoke({ scenario, expect }) {
  const askBox = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), box = document.querySelector('.dlg-shade.ask .dialog'), btns = [...document.querySelectorAll('.dlg-shade.ask .choices .btn')];
    return { text: box?.querySelector('.dlg-text')?.textContent || '', name: box?.querySelector('.dlg-name')?.textContent || '', face: !!box?.querySelector('.dlg-face svg'), btns: btns.map((b) => b.textContent),
      fit: !!box && [box, ...btns].every((e) => r(e).left >= -1 && r(e).right <= innerWidth + 1 && r(e).top >= -1 && r(e).bottom <= innerHeight + 1), tall: btns.every((b) => r(b).height >= 43.5), page: document.documentElement.scrollWidth > innerWidth };
  });
  const waitAsk = (H, ms = 15000) => H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor({ timeout: ms });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('gowaga-wish-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 20); await H.dbg('weather', 'clear'); await H.wait(800);
    let w = await H.dbg('wish');
    expect(w && w.ids.length === 20 && !w.cur && w.n === 0, 'PokaDebug.wish ' + JSON.stringify(w));
    // 1. ショートケーキ
    expect(await H.dbg('wishAsk', 'eat_cake'), 'おうちで おねがいを きけない');
    await waitAsk(H, 8000); await H.wait(250);
    let a = await askBox(H);
    expect(/ショートケーキ/.test(a.text) && /おねがい/.test(a.name) && a.face && a.btns.join() === 'いいよ！,また こんどね' && a.fit && a.tall && !a.page, 'おねがいの まどが ちがう・はみ出す ' + JSON.stringify(a));
    await H.shot('ask');
    await H.page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
    w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'eat_cake' && !w.cur.done && w.cur.who === 'gachan', 'うけた おねがいが ない ' + JSON.stringify(w));
    await H.phone('おねがい'); await H.wait(200);
    let app = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), A = document.querySelector('.smaho .wish-app'); return { card: !!A?.querySelector('.wish-card'), hint: A?.querySelector('.wish-hint')?.textContent || '', face: !!A?.querySelector('.wish-face svg'), inside: !!A && [...A.querySelectorAll('.wish-card, .btn')].every((e) => r(e).left >= r(A).left - 1 && r(e).right <= r(A).right + 1), over: !!A && A.scrollWidth > A.clientWidth + 1 }; });
    expect(app.card && app.face && /ケーキやさん/.test(app.hint) && app.inside && !app.over, 'すまほの おねがいが ちがう ' + JSON.stringify(app));
    await H.shot('app');
    await H.page.locator('.smaho-close').click(); await H.idle();
    const before = (await H.dbg('saveData')).chars;
    await H.dbg('give', 'cake', 1); await H.dbg('feed', 'gachan', 'cake');
    w = await H.dbg('wish'); expect(w.cur && w.cur.done, 'ケーキを たべさせても かなわない ' + JSON.stringify(w));
    expect(await H.eval(() => [...document.querySelectorAll('.toast .wish-toast')].some((t) => /かなった/.test(t.textContent))), 'かなった トーストが でない');
    const start = (await H.dbg('homeTalkLog')).length;
    await waitAsk(H); await H.wait(250);
    const said = (await H.dbg('homeTalkLog')).slice(start).filter((x) => x.wish === 'eat_cake');
    expect(said.length >= 4 && said[0].id === 'gachan' && /ありがとう/.test(said[0].text) && ['wanko', 'goji'].every((id) => said.some((x) => x.id === id)), 'おれいの かけあいが ない ' + JSON.stringify(said));
    a = await askBox(H);
    expect(/あまえて きた/.test(a.text) && a.btns.join() === 'ぎゅー！,なでなで' && a.fit && a.tall, 'あまえる まどが ちがう ' + JSON.stringify(a));
    await H.shot('amae-ask');
    await H.page.getByRole('button', { name: 'ぎゅー！', exact: true }).click(); await H.wait(700);
    w = await H.dbg('wish'); expect(!w.cur && w.n === 1 && w.log.join() === 'eat_cake' && w.amae > 0, 'おれいの あと ' + JSON.stringify(w));
    const after = (await H.dbg('saveData')).chars;
    expect(['wanko', 'gachan', 'goji'].every((id) => after[id].bond > before[id].bond && after[id].mood >= before[id].mood), 'ごきげん・なかよしが ふえない ' + JSON.stringify([before, after]));
    const hug = (await H.dbg('homeTalkLog')).slice(start).filter((x) => x.how === 'hug');
    expect(hug.length >= 1, 'ぎゅーの へんじが ない');
    await H.wait(1800); await H.shot('amae');
    // 2. はくぶつかん
    await H.wait(1500);
    expect(await H.dbg('wishAsk', 'go_museum'), 'はくぶつかんの おねがいを きけない');
    await waitAsk(H, 8000); await H.page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'go_museum' && !w.cur.done && w.n === 1, 'さいかいで おねがいが きえる ' + JSON.stringify(w));
    await H.dbg('museumGo', 'museum'); await H.until(() => PokaDebug.state().scene === 'venue' && PokaDebug.idle(), 20000);
    w = await H.dbg('wish'); expect(w.cur && w.cur.done && w.place && w.place.venue === 'museum', 'はくぶつかんに ついても かなわない ' + JSON.stringify(w));
    await H.dialogs();
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house', 15000);
    await waitAsk(H, 20000); await H.wait(250);
    expect(/あまえて きた/.test((await askBox(H)).text), 'かえっても おれいが ない');
    await H.page.getByRole('button', { name: 'なでなで', exact: true }).click(); await H.wait(700);
    w = await H.dbg('wish'); expect(!w.cur && w.n === 2 && w.log.join() === 'eat_cake,go_museum', 'はくぶつかんの おれいの あと ' + JSON.stringify(w));
    // 3. ことわる → すまほから きく
    await H.wait(2500);
    expect(await H.dbg('wishAsk', 'do_gacha'), 'ガチャの おねがいを きけない');
    await waitAsk(H, 8000); await H.page.getByRole('button', { name: 'また こんどね', exact: true }).click(); await H.wait(300);
    w = await H.dbg('wish'); expect(!w.cur && w.n === 2, 'ことわっても おねがいが のこる ' + JSON.stringify(w));
    await H.phone('おねがい'); await H.wait(200);
    expect(await H.page.locator('.smaho .wish-log-row').count() === 2, 'かなえた おねがいの きろくが 2つ ない');
    await H.shot('app-log');
    await H.page.getByRole('button', { name: '3にんに きいて みる', exact: true }).click();
    await waitAsk(H, 8000); await H.wait(200);
    a = await askBox(H); expect(a.btns.join() === 'いいよ！,また こんどね' && /おねがい/.test(a.name), 'すまほから きいた まどが ちがう ' + JSON.stringify(a));
    await H.page.getByRole('button', { name: 'また こんどね', exact: true }).click(); await H.wait(300);
    expect(!(await H.dbg('wish')).cur, 'すまほから きいた おねがいを ことわれない');
  }, { full: true, viewport, timeout: 200000 });
}
