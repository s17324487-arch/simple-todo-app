// サンシャインいけぶの フードコートと マルシェの たべもの（js/mall-food.js・UI-78）
// 0. おうちで がちゃんの おねがい「クレープ たべたい」を きく
// 1. 2F の すばーたっくすの テーブル: 3人が すわる → メニュー 6しゅ（ちいさな 絵・はみださない・44px・ねだんは とちゅうで おれない）→「シナモン ロール」→ コインが へる
// 2. でぃっぱーどんの テーブル: メニュー 6しゅ →「やめておく」→ コインは そのまま・3人は たつ
// 3. でぃっぱーどんで「いちご デザクレープ」を いっしょに たべる → クレープの おねがいが かなう
// 4. たぴの テーブル: メニュー 6しゅ（スクリーンショット）→「やめておく」
// 5. 3F の マルシェ: はこの なまえ（ひらがな）→「はちみつ パン」を かう → もちものに はいる
export async function mallFoodSmoke({ scenario, expect }) {
  const seated = (H, ms = 25000) => H.until(() => PokaDebug.dine()?.seated, ms);
  const askOpen = (H) => H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor({ timeout: 15000 });
  const menu = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), btns = [...document.querySelectorAll('.dlg-shade.ask .choices .btn')];
    return {
      names: btns.map((b) => (b.querySelector('.menu-txt') ? b.querySelector('.menu-txt').firstChild.textContent : b.textContent).trim()),
      ico: btns.filter((b) => b.querySelector('.menu-ico svg')).length,
      fit: btns.every((b) => r(b).left >= -1 && r(b).right <= innerWidth + 1 && r(b).top >= -1 && r(b).bottom <= innerHeight + 1),
      tall: btns.every((b) => r(b).height >= 43.5),
      price: btns.filter((b) => b.querySelector('.menu-price')).every((b) => b.querySelector('.menu-price').getClientRects().length === 1),
      over: document.documentElement.scrollWidth > innerWidth,
    };
  });
  const coins = async (H) => (await H.dbg('saveData')).coins;
  const standUp = async (H, label) => {
    await H.idle(); await H.until(() => !PokaDebug.dine(), 15000);
    const walk = await H.eval(() => G.scene.party.every((p) => G.scene.walkable(p.tx, p.ty)));
    expect(walk, label + ': たった あとの 3人が あるける ところに いない');
  };
  const sitAt = async (H, label) => {
    expect(await H.dbg('venueVisit', label), label + ' へ いけない');
    await seated(H); await askOpen(H); await H.wait(300);
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('mall-food-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 9000); await H.wait(600);
    await H.dbg('wishGift', 'none'); // おれいの しな（UI-70）は wish-gifts の スモークで みる
    await H.eval(() => { window.__toastLog = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toastLog.push(n.textContent); }).observe(document.body, { childList: true, subtree: true }); });
    const want = await H.dbg('shopGoods', 'mall');
    expect(want && want.total === 21 && ['cafe', 'crepes', 'boba'].every((k) => want.menus[k].length === 6) && want.menus.marche.length === 3, 'いけぶの メニュー ' + JSON.stringify(want && want.menus));
    // 0. クレープの おねがい
    expect(await H.dbg('wishAsk', 'eat_crepe'), 'クレープの おねがいを きけない');
    await askOpen(H); await H.wait(250);
    await page.getByRole('button', { name: 'いいよ！', exact: true }).click(); await H.wait(300);
    let w = await H.dbg('wish'); expect(w.cur && w.cur.id === 'eat_crepe' && !w.cur.done, 'クレープの おねがいを うけて いない ' + JSON.stringify(w));
    // 1. すばーたっくす
    expect(await H.dbg('venue', 'mall'), 'サンシャインいけぶに いけない');
    await H.until(() => PokaDebug.state().scene === 'venue' && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000); await H.until(() => PokaDebug.venueIso()?.ready, 20000); await H.idle();
    await H.dbg('venueVisit', '2Fへ のぼる'); await H.until(() => { const s = PokaDebug.venueState(); return s?.floor === 2 && !s.changingFloor; }, 20000); await H.idle();
    await H.until(() => PokaDebug.venueIso()?.ready, 20000);
    await sitAt(H, 'すばーたっくすの テーブル');
    let m = await menu(H);
    expect(m.names.join() === 'ふわラテ,ごほうびモカ,きせつの パフェ,キャラメル フローズン,シナモン ロール,ベリー スムージー,やめておく' && m.ico === 6 && m.fit && m.tall && m.price && !m.over, 'カフェの メニュー ' + JSON.stringify(m));
    await H.shot('cafe-menu');
    let c0 = await coins(H);
    await page.getByRole('button', { name: /^シナモン ロール/ }).click();
    await H.until(() => PokaDebug.dine()?.food === 'ike_cafe_4', 12000); await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 8000 }); await H.wait(600);
    expect(await coins(H) === c0 - 420, 'シナモン ロールで コインが 420 へらない ' + JSON.stringify([c0, await coins(H)]));
    await H.shot('cafe-meal');
    await H.dialogs(); await standUp(H, 'カフェ');
    // 2. でぃっぱーどん: やめておく
    await sitAt(H, 'でぃっぱーどんの テーブル');
    m = await menu(H);
    expect(m.names.length === 7 && ['いちご デザクレープ', 'バナナ キャラメル クレープ', 'ツナコーン クレープ', 'ベリー アイス クレープ'].every((x) => m.names.includes(x)) && m.ico === 6 && m.fit && m.tall && m.price && !m.over, 'クレープの メニュー ' + JSON.stringify(m));
    await H.shot('crepe-menu');
    c0 = await coins(H);
    await page.getByRole('button', { name: 'やめておく', exact: true }).click();
    await standUp(H, 'やめておく');
    expect(await coins(H) === c0, '「やめておく」で コインが へった');
    // 3. いちご デザクレープで おねがいが かなう
    await sitAt(H, 'でぃっぱーどんの テーブル');
    await page.getByRole('button', { name: /^いちご デザクレープ/ }).click();
    await H.until(() => PokaDebug.dine()?.food === 'ike_crepes_0', 12000);
    w = await H.dbg('wish');
    expect(w.cur && w.cur.id === 'eat_crepe' && w.cur.done, 'いけぶで クレープを たべても おねがいが かなわない ' + JSON.stringify(w));
    await H.until(() => window.__toastLog.some((t) => /おねがい かなった/.test(t)), 8000);
    await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 8000 }); await H.wait(400);
    await H.shot('crepe-wish');
    await H.dialogs(); await standUp(H, 'クレープ');
    // 4. たぴ
    await sitAt(H, 'たぴの テーブル');
    m = await menu(H);
    expect(m.names.length === 7 && ['こくとう たぴ', 'マンゴー たぴ', 'ほうじちゃ ラテ たぴ', 'チーズ ティー'].every((x) => m.names.includes(x)) && m.ico === 6 && m.fit && m.tall && m.price && !m.over, 'たぴの メニュー ' + JSON.stringify(m));
    await H.shot('boba-menu');
    await page.getByRole('button', { name: 'やめておく', exact: true }).click(); await standUp(H, 'たぴ');
    // 5. 3F の マルシェ
    await H.dbg('venueVisit', '3Fへ のぼる'); await H.until(() => { const s = PokaDebug.venueState(); return s?.floor === 3 && !s.changingFloor; }, 25000); await H.idle();
    const crates = (await H.dbg('venueState')).fixtures.filter((f) => f.kind === 'crate' && f.shop === 'marche').map((f) => f.label);
    expect(crates.join() === 'くだものの ギフトばこ,はちみつ パン,きせつの やきがし', 'マルシェの はこ ' + JSON.stringify(crates));
    c0 = await coins(H);
    expect(await H.dbg('venueVisit', 'はちみつ パン'), 'はちみつ パンの はこへ いけない');
    await page.getByRole('button', { name: 'かう', exact: true }).waitFor({ timeout: 15000 }); await H.wait(300);
    await H.shot('marche');
    await page.getByRole('button', { name: 'かう', exact: true }).click(); await H.wait(300);
    const saved = await H.dbg('persistedSave');
    expect(saved.coins === c0 - 540 && (saved.bag.ike_marche_1 || 0) === 1, 'はちみつ パンが かえない ' + JSON.stringify({ c: [c0, saved.coins], bag: saved.bag.ike_marche_1 }));
  }, { viewport, timeout: 180000 });
}
