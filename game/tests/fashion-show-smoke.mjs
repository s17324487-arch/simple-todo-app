// ファッションショー（UI-36・js/fashion-show.js・js/fashion-hall.js・js/fashion-scene.js）。オーナーの FB 2026-10-01「池袋駅にファションショーが
// できる所を追加してほしい。ファッションのレベルとタイミングに合わせてごわががポーズをとる(ボタンを押す)ことで、点数が決まる。…参加費500円もとる」:
// 池袋の ほんの ギャラリー（会場）→ うけつけで 500コイン → きがえ スペース（おしゃれ ★ と テーマの ふだ）→ ランウェイの いりぐち
// → ショー: まつ 3人の ひとこと → 1人ずつ あるく → ズーム → ポーズ（はやく おすと ミス・おさないと ミス・ぴったりで おす）→ しんさの ふだと ひとこと
// → フィナーレ → ランク → ごほうびの まど（コイン・しゃしん）→ 会場の ランウェイの まえに もどる → かべに しゃしん → すまほの「しゃしん」
export async function fashionShowSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('fashion-show-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('coins', 2000); await H.dbg('fashionTheme', 'kawaii');
    for (const id of ['ribbon_pink', 'dress', 'necklace']) await H.dbg('wearSet', id, 3);
    const coins0 = (await H.dbg('fashion')).coins;
    await H.dbg('fashionGo');
    await H.until(() => !Game.trans && G.sceneName === 'venue' && PokaDebug.venueIso()?.ready && PokaDebug.idle(), 20000);
    let st = await H.dbg('fashion');
    expect(st.building === 'ike_annex1' && st.venue && !st.entry && st.theme === 'kawaii', 'ほんの ギャラリーが 会場 ' + JSON.stringify(st).slice(0, 200));
    await H.shot('hall');
    // うけつけ: はじめての あいさつ → テーマ → さんかする（500コイン）
    await H.dbg('venueVisit', 'うけつけ');
    await H.page.locator('.dlg-shade').first().waitFor({ timeout: 12000 }); await H.dialogs();
    await H.page.waitForSelector('.choices .btn', { timeout: 8000 });
    const ask = await H.eval(() => document.querySelector('.dlg-text')?.textContent || '');
    expect(/かわいい/.test(ask) && /さんかする/.test(await H.eval(() => document.querySelector('.choices .btn')?.textContent || '')), 'うけつけで テーマと さんかひ ' + ask);
    await H.shot('reception');
    await H.choose(0); await H.dialogs(); await H.idle();
    st = await H.dbg('fashion');
    expect(st.entry && st.coins === coins0 - 500, 'さんかひ 500コイン ' + JSON.stringify([coins0, st.coins]));
    // きがえ スペース: おしゃれ レベル・テーマの ふだ・きると ふえる
    await H.dbg('venueVisit', 'きがえ スペース');
    await H.page.locator('.dress-info').waitFor({ timeout: 12000 }); await H.wait(300);
    const dress = () => H.eval(() => { const pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), r = (e) => e.getBoundingClientRect(); return { info: pn.querySelector('.dress-info')?.textContent || '', marks: [...pn.querySelectorAll('.card .dress-mark')].map((m) => m.closest('.card').textContent), wide: pn.querySelector('.panel-body').scrollWidth > pn.querySelector('.panel-body').clientWidth + 1, out: r(pn.querySelector('.dress-info')).right > r(pn.querySelector('.dress-stage')).right + 1 }; });
    let D = await dress();
    expect(/おしゃれ/.test(D.info) && /テーマ 0こ/.test(D.info) && D.marks.some((t) => /リボン/.test(t)) && !D.wide && !D.out, 'きがえ: おしゃれ レベルと テーマの ふだ ' + JSON.stringify(D));
    await H.page.locator('.modal-wrap:not(.out) .card', { hasText: 'リボン（ピンク）' }).click(); await H.wait(300);
    D = await dress();
    expect(/テーマ 1こ/.test(D.info) && /1\/5かしょ/.test(D.info), 'テーマの ふくを きると ふえる ' + D.info);
    await H.shot('dress');
    await H.page.locator('.modal-wrap:not(.out) .panel .close').last().click(); await H.wait(300); await H.idle();
    // ランウェイの いりぐち → でる！
    await H.dbg('venueVisit', 'ランウェイの いりぐち');
    await H.page.waitForSelector('.choices .btn', { timeout: 12000 });
    expect(/ショーに でる/.test(await H.eval(() => document.querySelector('.dlg-text')?.textContent || '')), 'ランウェイの いりぐちで ショーに でる？');
    await H.choose(0);
    await H.until(() => PokaDebug.fashionScene()?.phase && !Game.trans, 20000);
    await H.dbg('fashionAuto', null); await H.dbg('fashionSpeed', 3);
    // まつ 3人の ひとこと（ズーム）
    await H.until(() => PokaDebug.fashionScene()?.models.some((m) => m.line) && PokaDebug.fashionScene().cam > 1.2, 20000);
    let S = await H.dbg('fashionScene');
    expect(S.models.every((m) => m.face === 'fs_doki' || m.line) && S.order.length === 3, 'まつ 3人は どきどきの かお ' + JSON.stringify(S.models));
    await H.shot('wait');
    // 1人め: あるく（ボタンは みえる・44px いじょう）→ 1かいめは はやく おす（ミス）・2かいめは おさない（ミス）
    await H.until(() => PokaDebug.fashionScene()?.phase === 'walk' && PokaDebug.fashionScene().models[0].z > 0.4, 25000);
    S = await H.dbg('fashionScene');
    expect(S.button && S.button.w >= 44 && S.button.h >= 44 && !S.button.hidden && S.button.disabled, 'ポーズの ボタン（あるく ときは おせない） ' + JSON.stringify(S.button));
    await H.shot('walk');
    // カメラの わは ゆっくり（0.5ばい）で: わが でたら すぐ おす（わが かさなる まえ → ミス）
    await H.until(() => PokaDebug.fashionScene()?.phase === 'pose', 25000); await H.dbg('fashionSpeed', 0.5);
    await H.until(() => PokaDebug.fashionScene()?.ring?.k === 0, 25000);
    await H.page.locator('.fs-pose').click();
    await H.until(() => PokaDebug.fashionScene()?.models[0].judgments.length === 1, 8000);
    await H.until(() => PokaDebug.fashionScene()?.ring?.k === 1, 8000);
    await H.shot('ring');
    await H.until(() => PokaDebug.fashionScene()?.models[0].judgments.length === 2, 8000);
    S = await H.dbg('fashionScene');
    expect(S.models[0].judgments.join() === 'miss,miss', 'はやく おすと ミス・おさないと ミス ' + JSON.stringify(S.models[0].judgments));
    // のこりは じどうで ぴったりに おす（ズームの ポーズ・しんさの ふだと ひとこと）
    await H.dbg('fashionAuto', 0.01); await H.dbg('fashionSpeed', 3);
    await H.until(() => PokaDebug.fashionScene()?.models[0].judgments.length === 3 && PokaDebug.fashionScene().models[0].gesture, 8000);
    S = await H.dbg('fashionScene');
    expect(S.cam > 1.4 && ['perfect', 'great', 'good'].includes(S.models[0].judgments[2]), 'さきで ズームして ポーズ ' + JSON.stringify([S.cam, S.models[0].judgments]));
    await H.shot('pose');
    await H.until(() => PokaDebug.fashionScene()?.panel?.k === 2, 20000);
    S = await H.dbg('fashionScene');
    expect(S.panel.cards.length === 3 && S.panel.cards.every((c) => c >= 1 && c <= 10) && S.panel.comments.every((c) => c.length > 6 && !/[一-龯]/.test(c)), 'しんさいん 3人の ふだと ひとこと ' + JSON.stringify(S.panel));
    await H.shot('judge');
    // フィナーレ → けっか → ごほうびの まど
    await H.dbg('fashionSpeed', 6);
    await H.until(() => PokaDebug.fashionScene()?.phase === 'finale', 60000);
    await H.shot('finale');
    await H.until(() => PokaDebug.fashionScene()?.reward && document.querySelector('.fs-panel .fs-photo'), 60000); await H.wait(500);
    S = await H.dbg('fashionScene');
    const W = await H.eval(() => { const pn = document.querySelector('.fs-panel'), b = pn.querySelector('.panel-body'), btn = pn.querySelector('.panel-foot .btn').getBoundingClientRect(); return { rows: pn.querySelectorAll('.fs-row').length, coins: pn.querySelector('.fs-coins')?.textContent || '', wide: b.scrollWidth > b.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, btn: btn.height, photo: !!pn.querySelector('canvas.fs-photo') }; });
    expect(W.rows === 3 && /コイン もらった/.test(W.coins) && W.photo && !W.wide && !W.page && W.btn >= 44, 'ごほうびの まど（3人の てんすう・コイン・しゃしん・はみ出さない） ' + JSON.stringify(W));
    st = await H.dbg('fashion');
    expect(st.shows === 1 && st.photos === 1 && st.coins === coins0 - 500 + S.summary.coins && S.summary.coins === { grand: 2000, gold: 1200, silver: 800, bronze: 500, try: 200 }[S.summary.rank], 'てんすうで コイン ' + JSON.stringify([st.coins, S.summary]));
    await H.shot('reward');
    // かいじょうに もどる → ランウェイの まえ・かべに しゃしん
    await H.page.locator('.fs-panel .panel-foot .btn').click();
    await H.until(() => !Game.trans && G.sceneName === 'venue' && PokaDebug.venueIso()?.ready && PokaDebug.idle(), 20000); await H.wait(400);
    const back = await H.dbg('venueIso'); st = await H.dbg('fashion');
    expect(back.leader.join() === '13,1' && st.wall === 1 && !st.entry, 'ランウェイの まえに もどる・かべに しゃしん ' + JSON.stringify([back.leader, st.wall]));
    await H.shot('back');
    // すまほの「しゃしん」: ファッションショーの タブ
    // （館の なかは すまほの ボタンが ないので PokaDebug で ひらく）
    await H.dbg('smaho', 'photos'); await H.page.locator('.fs-ph-tabs').waitFor({ timeout: 8000 }); await H.wait(400);
    const P = await H.eval(() => ({ tabs: [...document.querySelectorAll('.fs-ph-tabs .btn')].map((b) => b.textContent), photos: document.querySelectorAll('.fs-ph-box .puri-photo canvas').length, h: Math.min(...[...document.querySelectorAll('.fs-ph-tabs .btn')].map((b) => b.getBoundingClientRect().height)) }));
    expect(P.tabs.join() === 'ぷりくら,ファッションショー' && P.photos === 1 && P.h >= 44, 'すまほの しゃしんに ショーの タブ ' + JSON.stringify(P));
    await H.shot('phone');
  }, { viewport, timeout: 180000 });
}
