// かせきの ほねを うる（スーパー）・そんちょうさんの ひょうしょう（js/fossil-sell.js・UI-69。オーナーの FB 2026-10-03）
// ① スーパーで「ほねを うる」: もって いる ほね・まだ はくぶつかんに ない しるし・あまりを ぜんぶ うる・まだ ない ほねは「それでも うる？」
// ② はくぶつかんで さいごの ほねを きふ → がいこつ かんせい → そんちょうさんの ひょうしょう（コイン・ひょうしょうじょう）
// ③ まえの セーブで かんせいして いた きょうりゅうは はかせに はなすと まとめて ひょうしょう → おうちに かざる
export async function fossilSellSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('fossil-sell-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    await H.dbg('museumGive', 'bone', 'compso.body');
    await H.dbg('fossilGive', 'compso.head', 2); await H.dbg('fossilGive', 'compso.body', 1); await H.dbg('fossilGive', 'trex.skull', 1);
    // ① スーパー
    await H.dbg('store', 'market', 'town'); await H.idle();
    await page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await page.getByRole('button', { name: 'ほねを うる', exact: true }).click();
    await page.locator('.fossil-sell').waitFor({ timeout: 8000 }); await H.wait(300);
    const lay = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), rows = [...document.querySelectorAll('.fossil-sell-row')], foot = document.querySelector('.fossil-sell-foot .btn');
      return { rows: rows.map((x) => ({ key: x.dataset.key, need: x.classList.contains('need'), text: x.innerText })), tall: rows.every((x) => r(x.querySelector('.btn')).height >= 43.5) && (!foot || r(foot).height >= 43.5),
        inside: rows.every((x) => r(x).left >= 0 && r(x).right <= innerWidth + 1), foot: foot ? foot.textContent : '', over: document.documentElement.scrollWidth > innerWidth };
    });
    expect(lay.rows.map((x) => x.key).join() === 'trex.skull,compso.head,compso.body' && lay.rows[0].need && lay.rows[1].need && !lay.rows[2].need, 'ほねの ならび・まだ ない しるしが 不正 ' + JSON.stringify(lay.rows));
    expect(/×2/.test(lay.rows[1].text) && /1こ 450コイン・はくぶつかんに まだ ない/.test(lay.rows[1].text) && /きふずみ/.test(lay.rows[2].text) && /1こ 1,200コイン/.test(lay.rows[0].text), 'ねだん・しるしの ことばが 不正 ' + JSON.stringify(lay.rows));
    expect(lay.foot === 'あまった ほねを ぜんぶ うる（750コイン）' && lay.tall && lay.inside && !lay.over, 'あまりの ボタン・はみ出し ' + JSON.stringify(lay));
    await H.shot('sell');
    // まだ ない ほね（1こ）は「それでも うる？」→ やめる
    const c0 = (await H.dbg('state')).coins;
    await page.locator('.fossil-sell-row[data-key="trex.skull"] .btn').click();
    await page.getByRole('button', { name: 'やめる', exact: true }).waitFor({ timeout: 5000 }); await H.wait(200); await H.shot('warn');
    await page.getByRole('button', { name: 'やめる', exact: true }).click(); await H.wait(300);
    let st = await H.dbg('fossilSell');
    expect(st.held.find((h) => h.key === 'trex.skull')?.n === 1 && st.coins === c0, 'やめたのに うれた');
    // あまりを ぜんぶ うる（あたま 1こ ＋ からだ 1こ）
    await page.locator('.fossil-sell-foot .btn').click(); await H.wait(400);
    st = await H.dbg('fossilSell');
    expect(st.coins === c0 + 750 && st.held.find((h) => h.key === 'compso.head')?.n === 1 && !st.held.find((h) => h.key === 'compso.body') && st.spareCoins === 0, 'あまりを うると コイン・のこりが 不正 ' + JSON.stringify(st));
    await page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300); await H.idle();
    // ② はくぶつかん（2F の けんきゅうしつ）: のこりの あたまを きふ → かんせい → ひょうしょう
    await H.dbg('museumGo', 'museum', 'lab'); await H.until(() => { const s = PokaDebug.venueState(); return s?.id === 'museum' && s.floor === 2 && !s.changingFloor && PokaDebug.idle(); }, 20000); await H.wait(800);
    expect(await H.dbg('museumDonate'), 'はかせに 話しかけられない'); await H.dialogs();
    await page.locator('.dn-list').waitFor({ timeout: 8000 }); await H.wait(300);
    await H.dbg('museumPick', 'compso.head'); await H.dbg('museumConfirm'); await H.wait(300); await H.dialogs();
    await page.locator('.dn-done').waitFor({ timeout: 8000 }); await H.wait(300);
    const c1 = (await H.dbg('state')).coins;
    await page.getByRole('button', { name: 'ホールで みる', exact: true }).click(); await H.wait(300); await H.dialogs();
    await page.locator('.award-card').waitFor({ timeout: 8000 }); await H.wait(400);
    const aw = await H.eval(() => { const e = document.querySelector('.award-card'), p = e.closest('.panel').getBoundingClientRect(), b = document.querySelector('.panel-foot .btn').getBoundingClientRect();
      return { text: e.innerText, inside: p.left >= 0 && p.right <= innerWidth + 1 && b.bottom <= innerHeight + 1 && b.height >= 43.5, over: document.documentElement.scrollWidth > innerWidth }; });
    expect(/ひょうしょうじょう/.test(aw.text) && /わんこ・がちゃん・ごじ どの/.test(aw.text) && /コンプソグナトゥスの がいこつを かんせい/.test(aw.text) && /おいわい コイン \+1,100/.test(aw.text) && /そんちょうさんの ひょうしょうじょう」も もらった/.test(aw.text) && /ひょうしょう 1 \/ 10/.test(aw.text) && aw.inside && !aw.over, 'ひょうしょうの カードが 不正 ' + JSON.stringify(aw));
    await H.shot('award');
    await page.getByRole('button', { name: 'ありがとう！', exact: true }).click(); await H.wait(300); await H.dialogs();
    // まだ きふできる ほね（ティラノサウルスの あたま）が ある ので きふの まどは そのまま → とじる
    await page.locator('.dn-list').waitFor({ timeout: 8000 }); await page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300); await H.idle();
    st = await H.dbg('fossilSell');
    expect(st.coins === c1 + 1100 && st.awards.compso && st.count === 1 && (await H.dbg('saveData')).furn.dino_award_cert === 1, 'ひょうしょうの コイン・ひょうしょうじょうが 不正 ' + JSON.stringify(st));
    // ③ まえの セーブで かんせいして いた（ヴェロキラプトル）→ はかせに はなすと ひょうしょう
    await H.idle();
    await H.dbg('museumDino', 'raptor');
    const c2 = (await H.dbg('state')).coins;
    expect(await H.dbg('museumDonate'), 'はかせに もう いちど 話しかけられない');
    await H.dialogs();
    // ほねが 5こ いじょうに なったので さきに ふくの ごほうび（MuseumWear）が でる → ありがとう で とじてから ひょうしょう
    await H.until(() => !!document.querySelector('.mw-panel, .award-card'), 8000);
    for (let i = 0; i < 6 && !(await page.locator('.award-card').isVisible()); i++) {
      if (await page.locator('.mw-panel').isVisible()) { await page.locator('.mw-panel .panel-foot .btn').click(); await H.wait(300); }
      await H.dialogs(); await H.wait(300);
    }
    await page.locator('.award-card').waitFor({ timeout: 8000 }); await H.wait(300);
    const aw2 = await H.eval(() => document.querySelector('.award-card').innerText);
    expect(/ヴェロキラプトルの がいこつを かんせい/.test(aw2) && /おいわい コイン \+4,100/.test(aw2) && !/も もらった/.test(aw2) && /ひょうしょう 2 \/ 10/.test(aw2), 'まえの ぶんの ひょうしょうが 不正 ' + aw2);
    await page.getByRole('button', { name: 'ありがとう！', exact: true }).click(); await H.wait(300); await H.dialogs();
    await page.locator('.dn-list').waitFor({ timeout: 8000 }); await page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300); await H.idle();
    st = await H.dbg('fossilSell');
    expect(st.coins === c2 + 4100 && st.count === 2 && st.pending.length === 0, 'まえの ぶんの コインが 不正 ' + JSON.stringify(st));
    // おうちに かざる（かべの ひょうしょうじょう・ゆかの トロフィー 2つ）
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.dbg('homeLayout', [{ id: 'dino_award_cert', x: 120, y: 112 }, { id: 'dino_award_trophy', x: 300, y: 300 }, { id: 'dino_award_gold', x: 380, y: 300 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    await H.shot('room');
  }, { full: true, viewport, timeout: 180000 });
}
