// ごはんの せき（js/dine-seats.js・UI-72。オーナーの FB 2026-10-03「ご飯を食べるショップ系に関して、ちゃんと3人が席に座って注文できるようにして。」）
// ① びっくぽ: まどぎわの ボックス席 2 → 3人が あるいて すわる（おくの ソファ 2人・てまえ 1人・いつもの ところには 描かない）→ メニュー → ハンバーグ → はいぜん ロボ → おさら 3まい → たつ
// ② びっくぽ: ほかの おきゃくさんが いる 席（まどぎわ 1）→「ほかの おきゃくさんの せき」→ あいている 席へ あるいて すわる → やめておく → たつ
// ③ びっくぽ: テーブル 1（4にんがけ）→ すわる（きた・にし・ひがし）→ やめておく
// ④ サンシャインいけぶ 2F: すばーたっくすの カウンター →「テーブルに すわって」→ テーブルへ → すわる → ふわラテ → おさら
// ⑤ はくぶつかん 3F: カフェの テーブル → まるい いすに すわる → カレー → おさら
export async function dineSeatsSmoke({ scenario, expect }) {
  const seated = (H, ms = 20000) => H.until(() => PokaDebug.dine()?.seated, ms);
  const askOpen = (H) => H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor({ timeout: 15000 });
  const inBox = (d, f) => d.kids.every((k) => k.x > f.x && k.x < f.x + f.w && k.y > f.y && k.y < f.y + f.h);
  const enter = async (H, id) => { expect(await H.dbg('venue', id), id + ' に いけない'); await H.until(() => PokaDebug.state().scene === 'venue' && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000); await H.until(() => PokaDebug.venueIso()?.ready, 20000); await H.idle(); };
  const fixture = async (H, label) => (await H.dbg('venueState')).fixtures.find((f) => f.label === label);
  const freeAfter = async (H, label) => {
    await H.idle(); const d = await H.dbg('dine'), v = await H.dbg('venueState');
    const walk = await H.eval(() => G.scene.party.every((p) => G.scene.walkable(p.tx, p.ty)));
    expect(!d && walk && v.party.every((p) => Number.isInteger(p.x) && Number.isInteger(p.y)), label + ': たった あとの 3人 ' + JSON.stringify({ d, party: v.party, walk }));
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('dine-seats-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 5000);
    await H.eval(() => { window.__toastLog = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toastLog.push(n.textContent); }).observe(document.body, { childList: true, subtree: true }); });
    // ① びっくぽの ボックス席
    await enter(H, 'bikkupo');
    const booth = await fixture(H, 'まどぎわの ボックス席 2');
    expect(await H.dbg('venueVisit', 'まどぎわの ボックス席 2'), 'ボックス席へ いけない');
    // すわる まえに あるいて いる（いつもの 3人の ところに 描く）
    await H.until(() => PokaDebug.dine(), 15000);
    await seated(H); await askOpen(H); await H.wait(300);
    let d = await H.dbg('dine');
    expect(d.kind === 'booth' && d.ready && d.kids.length === 3 && new Set(d.kids.map((k) => k.seat)).size === 3 && d.kids.every((k) => k.inside && k.pose === 'sit_01' && k.z >= 30) && d.kids.filter((k) => k.layer === 1 && k.dir === 'right').length === 2 && d.kids.filter((k) => k.layer === 3 && k.dir === 'left').length === 1 && inBox(d, booth), 'ボックス席に すわって いない ' + JSON.stringify(d));
    expect(await H.eval(() => G.scene.drawn.filter((o) => o.who && !o.ghost).length === 0 && G.scene.drawn.filter((o) => o.ghost).length === 3 && G.scene.drawn.some((o) => o.f && o.f.label === 'まどぎわの ボックス席 2')), 'すわった 3人が いつもの ところに 描かれる');
    const ask = await H.eval(() => document.querySelector('.dlg-shade.ask .dlg-text')?.textContent || '');
    expect(/メニューを ひらいた/.test(ask), 'すわってから メニュー ' + ask);
    await H.shot('booth-seated');
    await page.getByRole('button', { name: 'ごはん', exact: true }).click();
    await page.getByRole('button', { name: 'ハンバーグ（120コイン）', exact: true }).click();
    await H.until(() => PokaDebug.dine()?.food === 'hamburg', 12000);
    await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 8000 }); await H.wait(700);
    d = await H.dbg('dine'); const robot = (await H.dbg('venueState')).fixtures.find((f) => f.robot);
    expect(d.phase === 'eat' && d.kids.every((k) => k.inside) && robot && (robot.x !== 13 || robot.y !== 5), 'おさらが でない・ロボが こない ' + JSON.stringify({ d, robot: robot && [robot.x, robot.y] }));
    await H.shot('booth-meal');
    await H.dialogs(); await freeAfter(H, 'ボックス席');
    // ② ほかの おきゃくさんが いる 席 → あいている 席
    expect((await fixture(H, 'まどぎわの ボックス席 1')).taken, 'おきゃくさんの 席に taken が ない');
    await H.dbg('venueVisit', 'まどぎわの ボックス席 1');
    await H.until(() => window.__toastLog.some((t) => /ほかの おきゃくさんの せき/.test(t)), 15000);
    await seated(H, 25000); d = await H.dbg('dine');
    expect(d.label !== 'まどぎわの ボックス席 1' && !(await fixture(H, d.label)).taken, 'あいている 席に いかない ' + JSON.stringify(d));
    await askOpen(H); await page.getByRole('button', { name: 'やめておく', exact: true }).click(); await freeAfter(H, 'あいている 席');
    // ③ 4にんがけの テーブル
    const t1 = await fixture(H, 'テーブル 1');
    await H.dbg('venueVisit', 'テーブル 1'); await seated(H); await askOpen(H); await H.wait(300);
    d = await H.dbg('dine');
    expect(d.kind === 'fmtable' && inBox(d, t1) && d.kids.map((k) => k.dir).sort().join() === 'down,left,right', '4にんがけに すわって いない ' + JSON.stringify(d));
    await H.shot('table-seated');
    await page.getByRole('button', { name: 'やめておく', exact: true }).click(); await freeAfter(H, 'テーブル');
    // ④ サンシャインいけぶ 2F の カフェ（カウンター → テーブル）
    await enter(H, 'mall');
    await H.dbg('venueVisit', '2Fへ のぼる'); await H.until(() => { const s = PokaDebug.venueState(); return s?.floor === 2 && !s.changingFloor; }, 20000); await H.idle();
    await H.until(() => PokaDebug.venueIso()?.ready, 20000);
    const coins = (await H.dbg('saveData')).coins;
    expect(await H.dbg('venueVisit', 'すばーたっくす'), 'カウンターへ いけない');
    await H.until(() => window.__toastLog.some((t) => /テーブルに すわって ちゅうもん/.test(t)), 15000);
    await seated(H, 25000); await askOpen(H); await H.wait(300);
    d = await H.dbg('dine'); const ct = await fixture(H, d.label);
    expect(d.kind === 'table' && d.label === 'すばーたっくすの テーブル' && inBox(d, (await H.dbg('venueState')).fixtures.find((f) => f.label === d.label && f.x <= d.kids[0].x && d.kids[0].x < f.x + f.w)), 'カウンターから テーブルに すわらない ' + JSON.stringify({ d, ct }));
    await H.shot('cafe-seated');
    await page.getByRole('button', { name: /ふわラテ/ }).click();
    await H.until(() => PokaDebug.dine()?.food, 10000); await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 8000 }); await H.wait(600);
    expect((await H.dbg('saveData')).coins < coins, 'カフェで コインが へらない');
    await H.shot('cafe-meal');
    await H.dialogs(); await freeAfter(H, 'カフェ');
    // ⑤ はくぶつかんの カフェ ジュラ
    await enter(H, 'museum');
    const mt = await fixture(H, 'カフェの テーブル');
    expect(await H.dbg('venueVisit', 'カフェの テーブル'), 'カフェの テーブルへ いけない');
    await seated(H, 25000); await askOpen(H); await H.wait(300);
    d = await H.dbg('dine');
    expect(d.kind === 'mucafetable' && inBox(d, mt) && d.kids.every((k) => k.z >= 20), 'まるい いすに すわって いない ' + JSON.stringify(d));
    await page.getByRole('button', { name: /^カレー/ }).click();
    await H.until(() => PokaDebug.dine()?.food === 'curry', 10000); await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 8000 }); await H.wait(600);
    await H.shot('museum-cafe');
    await H.dialogs(); await freeAfter(H, 'はくぶつかん');
  }, { full: true, viewport, timeout: 260000 });
}
