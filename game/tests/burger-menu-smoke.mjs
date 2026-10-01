// バーガーやさんの メニュー（js/burger-menu.js・UI-34。オーナーの FB 2026-10-01「ハンバーガー屋さんのお買い物に、複数のハンバーガーの種類と、ポテト、シェイク、ハッピーセットを加えて」）:
// マックさん（平和台）→ てんいんと はなす → かいものを する → 4つの タブ（バーガー 8・サイド 4・のみもの 5・セット 1。はみ出さない）
// → てりやき バーガー ×2・ポテト L・いちご シェイク → にこにこ セット ×2 → おまけの おもちゃ 2こ（はじめて！・あつめ 2/6）→ やったー！
// → もちもの と 家具に のこる → フィギュア だいに かざれる → にこにこ セットを たべる
export async function burgerMenuSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('burger-menu-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('coins', 5000); await H.dbg('hour', 12);
    await H.dbg('store', 'burger', 'heiwadai'); await H.idle(); await H.wait(400);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    const tabs = H.page.locator('.modal-wrap:not(.out) .tabs .tab');
    await tabs.first().waitFor({ timeout: 10000 }); await H.wait(300);
    // がめん: 4つの タブが 1れつに みえる・カードが はみ出さない
    const look = async (tag) => {
      const L = await H.eval(() => {
        const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn.querySelector('.panel-body'), tb = pn.querySelector('.tabs');
        const cards = [...pn.querySelectorAll('.grid .card')];
        return { tabs: [...tb.querySelectorAll('.tab')].map((t) => t.textContent), tabsFit: tb.scrollWidth <= tb.clientWidth + 1, tabH: Math.min(...[...tb.querySelectorAll('.tab')].map((t) => r(t).height)),
          cards: cards.map((c) => { const k = [...c.children].find((x) => x.tagName === 'DIV' && !x.classList.contains('ico') && !x.classList.contains('price')); return k ? k.textContent : ''; }), wide: body.scrollWidth > body.clientWidth + 1, edge: r(pn).left >= -0.5 && r(pn).right <= innerWidth + 0.5, page: document.documentElement.scrollWidth > innerWidth,
          over: cards.filter((c) => [...c.children].some((k) => r(k).right > r(c).right + 1 || r(k).left < r(c).left - 1)).map((c) => c.textContent), small: cards.filter((c) => r(c).height < 44).length };
      });
      expect(L.tabsFit && L.tabH >= 30 && !L.wide && L.edge && !L.page && !L.over.length && !L.small, tag + ' が はみ出す ' + JSON.stringify(L));
      return L;
    };
    const openTab = async (label) => { await tabs.filter({ hasText: label }).click(); await H.wait(250); };
    let L = await look('バーガー');
    expect(L.tabs.join() === 'バーガー,サイド,のみもの,セット', 'タブ ' + L.tabs);
    expect(L.cards.join() === 'ハンバーガー,チーズバーガー,てりやき バーガー,フィッシュ バーガー,チキン バーガー,えび バーガー,ダブル チーズバーガー,ビッグ バーガー', 'バーガー 8しゅ ' + L.cards);
    await H.shot('burgers');
    const card = (name) => H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: name }).first();
    const buy = async (name, qty = 1) => {
      await card(name).click(); await H.page.getByRole('button', { name: 'かう', exact: true }).waitFor();
      for (let i = 1; i < qty; i++) await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: '＋', exact: true }).click();
      await H.page.getByRole('button', { name: 'かう', exact: true }).click(); await H.wait(300);
    };
    const c0 = (await H.dbg('saveData')).coins;
    await buy('てりやき バーガー', 2);
    let d = await H.dbg('saveData');
    expect(d.bag.bm_teriyaki === 2 && d.coins === c0 - 180, 'てりやき バーガー ×2（180コイン） ' + JSON.stringify([d.bag.bm_teriyaki, c0 - d.coins]));
    await openTab('サイド'); L = await look('サイド');
    expect(L.cards.join() === 'ポテト S,ポテト M,ポテト L,チキン ナゲット', 'サイド ' + L.cards); await H.shot('sides');
    await buy('ポテト L');
    await openTab('のみもの'); L = await look('のみもの');
    expect(L.cards.join() === 'バニラ シェイク,いちご シェイク,チョコ シェイク,オレンジジュース,ぎゅうにゅう', 'のみもの ' + L.cards); await H.shot('drinks');
    await buy('いちご シェイク');
    await openTab('セット'); L = await look('セット');
    expect(L.cards.join() === 'にこにこ セット', 'セット ' + L.cards); await H.shot('set');
    // にこにこ セット: せつめいに おまけ → 2こ かう → おまけの まど
    await card('にこにこ セット').click(); await H.page.getByRole('button', { name: 'かう', exact: true }).waitFor();
    const note = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .note')].map((e) => e.textContent).join(' '));
    expect(/おまけの おもちゃは ぜんぶで 6しゅ（もってる: 0しゅ）/.test(note), 'セットの せつめいに おまけ が ない ' + note);
    await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: '＋', exact: true }).click();
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .bm-reveal').waitFor({ timeout: 8000 }); await H.wait(400);
    const rv = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), w = [...document.querySelectorAll('.modal-wrap:not(.out)')].pop(), p = r(w.querySelector('.panel')), b = [...w.querySelectorAll('.btn')].find((x) => x.textContent === 'やったー！');
      return { lead: w.querySelector('.bm-lead').textContent, toys: [...w.querySelectorAll('.bm-toy .bm-name')].map((e) => e.textContent), fresh: w.querySelectorAll('.bm-new').length, count: w.querySelector('.bm-count').textContent,
        minis: w.querySelectorAll('.bm-mini').length, none: w.querySelectorAll('.bm-mini.none').length, pics: [...w.querySelectorAll('.bm-pic')].every((e) => r(e).width > 20 && e.querySelector('svg')),
        btn: b && r(b).height, fit: p.left >= -0.5 && p.right <= innerWidth + 0.5 && p.top >= -0.5 && p.bottom <= innerHeight + 0.5, wide: document.documentElement.scrollWidth > innerWidth };
    });
    expect(rv.lead === 'おまけの おもちゃが 2こ はいってた！' && rv.toys.length === 2 && rv.toys[0] !== rv.toys[1] && rv.fresh === 2 && rv.count === 'おもちゃ あつめ 2 / 6' && rv.minis === 6 && rv.none === 4 && rv.pics, 'おまけの まど ' + JSON.stringify(rv));
    expect(rv.btn >= 44 && rv.fit && !rv.wide, 'おまけの まどが はみ出す ' + JSON.stringify(rv));
    await H.shot('toys');
    await H.page.getByRole('button', { name: 'やったー！', exact: true }).click(); await H.wait(300);
    expect(!(await H.eval(() => !!document.querySelector('.modal-wrap:not(.out) .bm-reveal'))), 'おまけの まどが とじない');
    // もちもの・家具に のこる（さいかい しても）
    const st = await H.dbg('burgerMenu'); d = await H.dbg('persistedSave');
    const toys = st.toys.filter((t) => t.n > 0).map((t) => t.id);
    expect(st.count === 2 && toys.length === 2 && d.bag.bm_nikoniko === 2 && d.bag.bm_fries_l === 1 && d.bag.bm_shake_berry === 1 && toys.every((id) => d.furn[id] === 1), 'セーブに のこらない ' + JSON.stringify([st, d.bag]));
    while (await H.page.locator('.modal-wrap:not(.out) .close').count()) { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(240); }
    await H.idle();
    // フィギュア だいに かざれる（おうち）・にこにこ セットを たべる
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000);
    await H.dbg('homeLayout', [{ id: 'figstand_step', x: 80, y: 540, figs: toys }]); await H.dbg('homeBubbleFixture'); await H.wait(700);
    const fs = await H.dbg('figStand');
    expect(fs.stands[0].figs[0] === toys[0] && fs.stands[0].figs[1] === toys[1], 'フィギュア だいに かざれない ' + JSON.stringify(fs.stands));
    await H.shot('stand');
    const who = (await H.dbg('saveData')).order[0], before = (await H.dbg('saveData')).chars[who].hunger;
    const ate = await H.dbg('feed', who, 'bm_nikoniko'); d = await H.dbg('saveData');
    expect(ate && d.bag.bm_nikoniko === 1 && d.chars[who].hunger >= Math.min(100, before + 1), 'にこにこ セットを たべられない ' + JSON.stringify([ate, before, d.chars[who].hunger]));
  }, { viewport, timeout: 180000 });
}
