// おてつだいの「もういちど」と 1つの おみせで 1にち 20000コイン まで（UI-67。オーナーの FB 2026-10-03）
// ① クレープやさん（Lv1・3にん）を ただしく つくる → けっか: 「もういちど」と きょう もらった コイン → もういちど で すぐ つぎの シフト
// ② のこり 10コイン: はじめに「あと 10コイン」→ 1にんめ（ふつうは 28コイン）で 10コイン だけ・「きょうの コインは ここまで」→ けっかに もういちど が ない
// ③ もう いちど くると おみせの 人が「また あした」と いって まちへ もどる・お店の カウンターでも はじめない・つぎの 日は また できる
export async function shopAgainSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('shop-again-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast();
    const enter = async () => {
      await H.dbg('shop', 'crepe', 1);
      await H.until(() => PokaDebug.state().scene === 'shop' && !PokaDebug.state().transitioning, 10000);
      await H.wait(300);
    };
    // せりふを 1まいずつ よむ（text を ふくむ まいが でたら しゃしん）
    const readLines = async (want, shot) => {
      let seen = false;
      for (let i = 0; i < 12; i++) {
        const t = await page.evaluate(() => { const s = document.querySelector('.dlg-shade:not(.ask)'); return s ? s.querySelector('.dlg-text')?.textContent || '' : null; });
        if (t === null) break;
        if (want && !seen && t.includes(want)) { await H.wait(900); seen = true; if (shot) await H.shot(shot); }
        await page.evaluate(() => document.querySelector('.dlg-shade:not(.ask)')?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
        await H.wait(120);
      }
      return seen;
    };
    const crepe = async () => {
      const st = await H.dbg('mg'), k = st.ranks.length;
      for (const nm of st.order.want) await H.tapLabel(nm);
      await H.tapLabel('できあがり！');
      await H.until((k) => PokaDebug.mg() && PokaDebug.mg().ranks.length > k, 8000, k);
    };
    const resultModal = async () => {
      await H.until(() => PokaDebug.mg()?.phase === 'result' && !!document.querySelector('.again-foot'), 20000);
      await H.wait(500);
      return page.evaluate(() => {
        const foot = document.querySelector('.again-foot'), btns = [...foot.querySelectorAll('.btn')].map((b) => { const r = b.getBoundingClientRect(); return { text: b.textContent, x: r.left, y: r.top, w: r.width, h: r.height }; });
        const panel = foot.closest('.panel').getBoundingClientRect();
        return { btns, line: document.querySelector('.shop-cap-line')?.textContent || '', notes: [...document.querySelectorAll('.panel .note')].map((e) => e.textContent), panel: { top: panel.top, bottom: panel.bottom, left: panel.left, right: panel.right }, vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth };
      });
    };
    const fits = (m) => m.btns.every((b) => b.h >= 44 && b.x >= m.panel.left && b.x + b.w <= m.panel.right + 0.5 && b.y + b.h <= m.vh + 0.5) && m.sw <= m.vw && m.panel.bottom <= m.vh + 0.5
      && m.btns.every((b, i) => m.btns.every((c, j) => i === j || b.x + b.w <= c.x + 0.5 || c.x + c.w <= b.x + 0.5));

    // ① ふつうの シフト → もういちど
    await enter(); await H.dialogs();
    for (let c = 0; c < 6; c++) {
      await H.until(() => ['work', 'result'].includes(PokaDebug.mg()?.phase), 15000);
      if ((await H.dbg('mg')).phase === 'result') break;
      await crepe();
    }
    const r1 = await resultModal(), cap1 = await H.dbg('shopCap', 'crepe'), mg1 = await H.dbg('mg');
    const got = mg1.earn + mg1.tips;
    expect(mg1.ranks.length === 4 && got > 0 && cap1.earn.crepe === got && cap1.left === 20000 - got, 'きょう もらった コインが かぞえられない ' + JSON.stringify({ ranks: mg1.ranks, got, cap1 }));
    expect(r1.btns.map((b) => b.text).join('/') === 'もういちど/まちに もどる' && fits(r1), '「もういちど」と「まちに もどる」が ならばない／はみ出す ' + JSON.stringify(r1));
    expect(r1.line === `この おみせで きょう もらった コイン ${got.toLocaleString('ja-JP')} / 20,000`, 'きょうの コインの ぎょうが ない ' + r1.line);
    await H.shot('result');
    await page.getByRole('button', { name: 'もういちど', exact: true }).click();
    await H.until(() => PokaDebug.state().scene === 'shop' && !PokaDebug.state().transitioning && PokaDebug.mg()?.phase !== 'result', 10000);
    await H.dialogs();
    await H.until(() => PokaDebug.mg()?.phase === 'work', 15000);
    const again = await H.dbg('mg');
    expect(again.shop === 'crepe' && again.n === 0 && again.ranks.length === 0 && again.earn === 0, 'もういちど で つぎの シフトが はじまらない ' + JSON.stringify(again));
    await H.shot('again');
    await page.getByRole('button', { name: 'おてつだいを やめる', exact: true }).click(); await page.getByRole('button', { name: 'ここで やめる', exact: true }).click();
    await page.getByRole('button', { name: 'まちに もどる', exact: true }).click();
    await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);

    // ② のこり 10コイン → 1にんめで おしまい
    await H.dbg('shopCap', 'crepe', 19990);
    const coins0 = (await H.dbg('state')).coins;
    await enter();
    expect(await readLines('あと 10コイン', 'left'), 'はじめに「あと 10コイン」と いわない');
    await H.until(() => PokaDebug.mg()?.phase === 'work', 15000);
    await crepe();
    await H.until(() => !!document.querySelector('.dlg-shade:not(.ask)') || !!document.querySelector('.again-foot'), 15000);
    expect(await readLines('きょうの コインは ここまで', 'stop'), '「きょうの コインは ここまで」と いわない');
    const r2 = await resultModal(), mg2 = await H.dbg('mg'), cap2 = await H.dbg('shopCap', 'crepe');
    expect(mg2.ranks.length === 1 && mg2.earn + mg2.tips === 10 && mg2.capHit && cap2.left === 0 && (await H.dbg('state')).coins === coins0 + 10, 'のこり 10コイン だけに ならない ' + JSON.stringify({ mg2, cap2 }));
    expect(r2.btns.map((b) => b.text).join('/') === 'まちに もどる' && r2.notes.some((t) => t.includes('きょうの コインは ここまで')) && fits(r2), 'いっぱいの ときに もういちど が でる／はみ出す ' + JSON.stringify(r2));
    await H.shot('capped');
    await page.getByRole('button', { name: 'まちに もどる', exact: true }).click();
    await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);

    // ③ いっぱいの 日は はじめない（おてつだいの がめん・お店の カウンター）→ つぎの 日は また できる
    await enter();
    expect(await readLines('また あした', 'full'), 'いっぱいの 日に「また あした」と いわない');
    await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    expect((await H.dbg('state')).coins === coins0 + 10, 'いっぱいの 日に コインが ふえた');
    await H.dbg('store', 'crepe', 'town'); await H.idle();
    await page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await page.getByRole('button', { name: 'おてつだいする', exact: true }).click();
    expect(await readLines('また あした', 'full-store'), 'お店の カウンターでも「また あした」と いわない');
    await H.wait(300);
    expect((await H.dbg('state')).scene === 'store', 'いっぱいの 日に お店から おてつだいが はじまった');
    const next = await H.dbg('shopCap', null, null, '2000-1-1');
    expect(next.day === '2000-1-1' && (await H.dbg('shopCap', 'crepe')).left === 20000, 'つぎの 日に 0 から に ならない');
  }, { full: true, viewport, timeout: 150000 });
}
