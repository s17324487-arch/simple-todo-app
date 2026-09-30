// はたけ（js/farm.js・オーナーの FB 2026-09-30）: やおやの かわりの はたけ 6まい。町で たねまき → みずやり → そだつ → しゅうかく、
// かんばんから はたけの がめん（大きい はたけ・3人が あるく・ひりょう・ずかん）・あめで みずやり・さいかいしても そのまま
export async function farmSmoke({ scenario, expect }) {
  const setCoins = async (H, n) => { await H.dbg('coins', -1e9); await H.dbg('coins', n); }; // PokaDebug.coins は たす（0 より へらない）
  // 町の はたけ i: まえの マスに たって うえむき → はたけを タップ
  const townTap = async (H, i) => {
    const a0 = await H.dbg('farmPlotAt', i);
    await H.dbg('teleport', 'town', a0.front.x, a0.front.y, 'up'); await H.until(() => G.sceneName === 'world' && PokaDebug.idle(), 10000); await H.wait(300);
    const a = await H.dbg('farmPlotAt', i); await H.tap(a.cx, a.cy);
  };
  const sceneTap = async (H, i) => { await H.until(() => !PokaDebug.farm().busy && !PokaDebug.farm().acting && PokaDebug.idle(), 10000); const a = await H.dbg('farmPlotAt', i); await H.tap(a.cx, a.cy); };
  const seedUi = (H) => H.eval(() => { const r = (e) => e.getBoundingClientRect(), b = [...document.querySelectorAll('.farm-seed')]; return { over: document.documentElement.scrollWidth > innerWidth, n: b.length, big: b.every((x) => r(x).height >= 43.5 && r(x).width >= 43.5), inside: b.every((x) => r(x).left >= -1 && r(x).right <= innerWidth + 1), open: b.filter((x) => !x.disabled).length, fit: b.every((x) => x.scrollWidth <= x.clientWidth + 1) }; });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('farm-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await setCoins(H, 500);
    // やおやは なく、はたけが 6まい
    const lay = await H.dbg('townLayout', 'town');
    expect(!lay.doors.some((d) => d.id === 'neri_farmstand'), 'やおやが のこって いる');
    let f = await H.dbg('farm'); expect(f.plots.length === 6 && f.plots.every((p) => !p.c) && f.tier === 0, 'はたけが 6まい ない ' + JSON.stringify(f.plots));
    // 町: はたけ 0 を タップ → たねを えらぶ まど（13しゅ・はじめは 5しゅ）
    await townTap(H, 0); await H.page.locator('.modal-wrap .farm-seeds').waitFor({ timeout: 10000 }); await H.wait(250);
    const ui = await seedUi(H); expect(!ui.over && ui.n === 13 && ui.big && ui.inside && ui.fit && ui.open === 5, 'たねの まど ' + JSON.stringify(ui));
    await H.shot('seeds');
    await H.page.getByRole('button', { name: 'はつかだいこんの たね', exact: true }).click(); await H.idle();
    f = await H.dbg('farm'); expect(f.plots[0].c === 'radish' && f.plots[0].s === 0 && !f.plots[0].w && (await H.dbg('saveData')).coins === 495, 'たねを まけない ' + JSON.stringify(f.plots[0]));
    // もう いちど → みずやり。はっぱが でると また のどが かわく
    await townTap(H, 0); await H.until(() => PokaDebug.farm().plots[0].w, 10000);
    f = await H.dbg('farmSkip', 1.5); expect(f.plots[0].s === 2 && !f.plots[0].w && f.plots[0].info.state === 'dry', 'はっぱで のどが かわかない ' + JSON.stringify(f.plots[0]));
    // となりの はたけにも トマト
    await townTap(H, 1); await H.page.locator('.modal-wrap .farm-seeds').waitFor({ timeout: 10000 }); await H.wait(200);
    await H.page.getByRole('button', { name: 'トマトの たね', exact: true }).click(); await H.idle();
    await H.wait(1200); await H.shot('town-growing');
    // かんばん → はたけの がめん（3人・6まい・したの ボタン）
    const s0 = await H.dbg('farmSignAt'); await H.dbg('teleport', 'town', s0.front.x, s0.front.y, 'up'); await H.until(() => G.sceneName === 'world' && PokaDebug.idle(), 10000); await H.wait(300);
    const s1 = await H.dbg('farmSignAt'); await H.tap(s1.cx, s1.cy); await H.until(() => PokaDebug.state().scene === 'farm' && PokaDebug.idle(), 15000); await H.wait(600);
    f = await H.dbg('farm'); expect(f.scene && f.team.length === 3, 'はたけの がめんに 3人 いない');
    const bar = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), b = [...document.querySelectorAll('.farm-bar .btn')]; return { n: b.length, big: b.every((x) => r(x).height >= 43.5 && r(x).width >= 43.5), inside: b.every((x) => r(x).left >= -1 && r(x).right <= innerWidth + 1 && r(x).bottom <= innerHeight + 1), fit: b.every((x) => x.scrollWidth <= x.clientWidth + 1), over: document.documentElement.scrollWidth > innerWidth }; });
    expect(bar.n === 2 && bar.big && bar.inside && bar.fit && !bar.over, 'はたけの がめんの ボタン ' + JSON.stringify(bar));
    await H.shot('scene');
    // がめん: はたけ 0 に みずやり（3人が あるいて いく）→ みのる → しゅうかく
    await sceneTap(H, 0); await H.until(() => PokaDebug.farm().plots[0].w, 10000);
    f = await H.dbg('farm'); expect(f.team[0].y < 2000 && Math.abs(f.team[0].x - f.team[1].x) < 20, '3人が はたけの よこに いない ' + JSON.stringify(f.team));
    f = await H.dbg('farmSkip', 1.6); expect(f.plots[0].s === 4 && f.plots[0].info.state === 'ripe', 'みのらない ' + JSON.stringify(f.plots[0]));
    await H.wait(500); await H.shot('ripe');
    const bag0 = (await H.dbg('saveData')).bag.radish || 0, n = f.plots[0].yield;
    await sceneTap(H, 0); await H.until(() => PokaDebug.farm().harvests === 1, 10000); await H.wait(500); await H.shot('harvest');
    f = await H.dbg('farm'); const bag1 = (await H.dbg('saveData')).bag.radish || 0;
    expect(bag1 === bag0 + n && n >= 3 && !f.plots[0].c && f.got.radish === n && f.first.radish, 'しゅうかく できない ' + JSON.stringify([bag0, bag1, n, f.got]));
    // そだって いる はたけ（トマト）: ようすと ひりょう（10コイン・とれる かずが +2）
    await sceneTap(H, 1); await H.until(() => PokaDebug.farm().plots[1].w, 10000);
    const c0 = (await H.dbg('saveData')).coins, y0 = (await H.dbg('farm')).plots[1].yield;
    await sceneTap(H, 1); await H.page.getByRole('button', { name: 'ひりょうを まく（10コイン）', exact: true }).click(); await H.idle();
    f = await H.dbg('farm'); expect(f.plots[1].f && f.plots[1].yield === y0 + 2 && (await H.dbg('saveData')).coins === c0 - 10 && f.fert === 1, 'ひりょうが まけない ' + JSON.stringify(f.plots[1]));
    // あめ: かわいた はたけに かってに みず
    f = await H.dbg('farmSkip', 4); expect(f.plots[1].s === 2 && !f.plots[1].w, 'トマトが のどが かわかない ' + JSON.stringify(f.plots[1]));
    await H.dbg('weather', 'rain'); f = await H.dbg('farm'); expect(f.plots[1].w && f.plots[1].rain, 'あめで みずやり されない ' + JSON.stringify(f.plots[1]));
    await H.wait(700); await H.shot('rain'); await H.dbg('weather', 'clear');
    // さくもつ ずかん
    await H.page.getByRole('button', { name: 'さくもつ ずかん', exact: true }).click(); await H.page.locator('.modal-wrap .farm-dex').waitFor({ timeout: 8000 });
    const dex = await H.eval(() => ({ rows: document.querySelectorAll('.farm-dex-row').length, got: document.querySelectorAll('.farm-dex-row:not(.none)').length, over: document.documentElement.scrollWidth > innerWidth }));
    expect(dex.rows === 13 && dex.got === 1 && !dex.over, 'ずかん ' + JSON.stringify(dex)); await H.shot('dex');
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // まちへ もどる → かんばんの まえ
    await H.page.getByRole('button', { name: 'まちへ もどる', exact: true }).click(); await H.until(() => PokaDebug.state().map === 'town' && PokaDebug.idle(), 15000);
    expect((await H.dbg('state')).pos.join() === [s0.front.x, s0.front.y].join(), 'かんばんの まえに もどらない ' + JSON.stringify((await H.dbg('state')).pos));
    // さいかいしても はたけは そのまま
    const before = await H.dbg('farm'); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const after = await H.dbg('farm');
    expect(JSON.stringify(after.plots.map((p) => [p.c, p.s, p.w, p.f])) === JSON.stringify(before.plots.map((p) => [p.c, p.s, p.w, p.f])) && after.harvests === 1 && after.got.radish === n, 'さいかいで はたけが かわる');
  }, { viewport, timeout: 240000 });
}
