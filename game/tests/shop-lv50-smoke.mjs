// おてつだいの おみせ Lv は 50 まで・Lv.6 から コインが すこしずつ ふえる（UI-108。オーナーの 指示 2026-10-07
// 「お店のお手伝いのレベル上限をあげて。50くらいまで。…レベルが上がると少しずつお金も稼ぎやすくなるようにしてね。」）
// ① ひょうばんの しきいは 50 まで（Lv.1〜30 は まえと おなじ）
// ② クレープやさん Lv.30（ひょうばんは Lv.31 の 1 てまえ）で おてつだい → うりあげは Lv.30 の コイン（+50%）・
//    けっかの まどに「おみせ Lv.30の ボーナス +50%」と「レベル31に なった！ … +52%」・まどは 画面の なか
// ③ ごほうびの まど: ひょうばんが もっと あっても Lv.50 で とまる・「+90%」
export async function shopLv50Smoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('shop-lv50-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('pause', true);
    // ① しきい
    const levels = (await H.dbg('shopRewards', 'crepe')).levels;
    expect(levels.length === 51 && levels[5] === 1600 && levels[30] === 24600 && levels[31] === 26040 && levels[50] === 61000, 'ひょうばんの しきい ' + JSON.stringify([levels.length, levels[30], levels[31], levels[50]]));
    // ② Lv.30 の おてつだい
    const d = await H.dbg('saveData');
    d.shops.crepe.lv = 30; d.shops.crepe.rep = levels[31] - 1;
    await H.dbg('seedSave', d); await H.dbg('pause', false);
    const r0 = await H.dbg('shopRewards', 'crepe');
    expect(r0.cap === 50 && r0.lv === 30 && r0.bonusPct === 50, 'Lv.30 の ボーナス ' + JSON.stringify({ cap: r0.cap, lv: r0.lv, pct: r0.bonusPct }));
    const coins0 = (await H.dbg('saveData')).coins;
    let win = null;
    H.atShopResult = async () => {
      win = await H.eval(() => {
        const w = document.querySelector('.modal-wrap .panel'), r = w.getBoundingClientRect(), row = w.querySelector('.shop-lv-bonus');
        return { text: w.textContent, row: row ? [...row.querySelectorAll('span')].map((e) => e.textContent).join('|') : null, inside: r.left >= 0 && r.right <= innerWidth + 1, wide: document.documentElement.scrollWidth <= innerWidth };
      });
    };
    const ranks = await H.playShop('crepe', 30);
    H.atShopResult = null;
    const st = await H.eval(() => ({ diff: Save.d.settings.difficulty, boost: DailyPlay.boost('crepe') }));
    const want = await H.eval((a) => a.ranks.reduce((s, r) => s + Math.round(GameEconomy.pay('crepe', 30, r, a.diff) * a.boost), 0), { ranks, ...st });
    const at5 = await H.eval((a) => a.ranks.reduce((s, r) => s + Math.round(GameEconomy.pay('crepe', 5, r, a.diff) * a.boost), 0), { ranks, ...st });
    const after = await H.dbg('persistedSave');
    expect(ranks.length === 7 && ranks.some((r) => r >= 1), 'クレープの おてつだい ' + JSON.stringify(ranks));
    expect(win && /うりあげ\s*\+(\d+)/.test(win.text) && +win.text.match(/うりあげ\s*\+(\d+)/)[1] === want && want > at5, `うりあげは Lv.30 の コイン（${want}・Lv.5 なら ${at5}）: ` + (win && win.text.slice(0, 120)));
    expect(after.coins > coins0 && after.coins - coins0 >= want, 'コインが ふえない ' + (after.coins - coins0));
    expect(win.row === 'おみせ Lv.30の ボーナス|+50%', 'ボーナスの ぎょう ' + win.row);
    expect(after.shops.crepe.lv === 31 && /おみせが レベル31に なった！ もらえる コインが すこし ふえたよ（\+52%）。/.test(win.text), 'Lv.31 に あがった ことば ' + win.text.slice(-260));
    expect(win.inside && win.wide, 'けっかの まどが はみ出す ' + JSON.stringify({ inside: win.inside, wide: win.wide }));
    // ③ ごほうびの まど: Lv.50 で とまる・+90%
    await H.dbg('pause', true);
    const e = await H.dbg('saveData'); e.shops.crepe.rep = levels[50] * 2; await H.dbg('seedSave', e);
    const r1 = await H.dbg('shopRewards', 'crepe');
    expect(r1.lv === 50 && r1.bonusPct === 90, 'Lv.50 で とまる ' + JSON.stringify({ lv: r1.lv, pct: r1.bonusPct }));
    await H.dbg('shopRewardOpen', 'crepe'); await H.wait(400);
    const m = await H.eval(() => {
      const w = document.querySelector('.modal-wrap:not(.out) .panel'), notes = [...w.querySelectorAll('.note')].map((n) => n.textContent);
      return { notes: notes.slice(0, 3), wide: document.documentElement.scrollWidth <= innerWidth, right: w.getBoundingClientRect().right <= innerWidth + 1 };
    });
    expect(/^おみせ Lv\.50 ／ 50　ひょうばん \d+$/.test(m.notes[0]) && m.notes[1] === 'おみせ Lv.50の ボーナス: もらえる コインが +90%', 'ごほうびの まどの Lv ' + JSON.stringify(m.notes));
    expect(m.wide && m.right, 'ごほうびの まどが はみ出す');
    await H.shot('rewards-lv50');
    await page.getByRole('button', { name: 'とじる', exact: true }).last().click();
  }, { viewport, timeout: 180000 });
}
