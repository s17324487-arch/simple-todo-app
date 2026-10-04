// 2かいから 見た 1かいの フィギュア だい（UI-92。オーナーの FB 2026-10-04「アイテムを飾れる棚について、一階に設置して、ごわがが2階にいくと表示されないので改善してほしい」）
// いない ほうの かいは かぐごと 1まいの 絵（js/home-floors.js の prepare）。その 絵に だいの フィギュアが はいる か:
// 1. 2かいを かう → 1かいに ひなだん（フィギュア 9こ）と ガラスの ケース（3こ）→ 2かいへ → 1かいの 絵に フィギュア 12こ
// 2. フィギュアを ぜんぶ もどして 2かいへ → 絵が かわる（さっきの 絵には フィギュアが 描かれて いた）
// 3. ぎゃく: 2かいの だいの フィギュアも 1かいから 見える
export async function home2fFigsSmoke({ scenario, expect }) {
  const FIGS = ['aqfig_whaleshark', 'aqfig_turtle', 'aqfig_penguin', 'aqfig_orca', 'aqfig_jelly', 'aqfig_eel', 'aqfig_mola', 'gacha_friends_0', 'gacha_friends_3'];
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('home-2f-figs-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear'); await H.dbg('coins', 9000); await H.wait(300);
    const inRoom = (id) => H.until((id) => G.sceneName === 'house' && !Game.trans && PokaDebug.idle() && Save.d.rooms.active === id && !PokaDebug.homeFloor()?.climbing && PokaDebug.homeFloor()?.ready, 20000, id);
    const go = async (id) => { expect(await H.dbg('homeRoom', id), id + ' へ いけない'); await inRoom(id); await H.wait(300); };
    // 1. 2かいを かう（おへや → おへやを かう）
    await H.houseButton('おへや');
    await H.page.locator('[data-room="upstairs"]').getByRole('button', { name: 'おへやを かう', exact: true }).click(); await H.choose(0);
    await inRoom('upstairs');
    await go('main');
    await H.dbg('homeLayout', [{ id: 'figstand_step', x: 210, y: 300, figs: FIGS }, { id: 'figstand_case', x: 330, y: 300, figs: [FIGS[0], null, FIGS[7], null, FIGS[2]] }]); await H.wait(800);
    await H.shot('1f');
    await go('upstairs');
    const a = await H.dbg('homeFloorBake');
    expect(a && a.id === 'main' && a.figs === 12 && a.solid > 1000, '2かいから 見た 1かいの 絵が ない ' + JSON.stringify(a));
    await H.shot('2f-sees-1f');
    // 2. フィギュアを ぜんぶ もどして もういちど
    await go('main');
    await H.dbg('homeLayout', [{ id: 'figstand_step', x: 210, y: 300 }, { id: 'figstand_case', x: 330, y: 300 }]); await H.wait(500);
    await go('upstairs');
    const b = await H.dbg('homeFloorBake');
    expect(b && b.id === 'main' && b.figs === 0 && b.w === a.w && b.h === a.h && b.hash !== a.hash, '1かいの 絵に フィギュアが 描かれて いない（かざっても かざらなくても おなじ 絵）' + JSON.stringify([a, b]));
    // 3. ぎゃく: 2かいの だいを 1かいから 見る
    await H.dbg('homeLayout', [{ id: 'figstand_step', x: 200, y: 260, figs: FIGS }], 'wp_cloud'); await H.wait(500);
    await go('main');
    const c = await H.dbg('homeFloorBake');
    expect(c && c.id === 'upstairs' && c.figs === 9, '1かいから 見た 2かいの 絵 ' + JSON.stringify(c));
    await H.shot('1f-sees-2f');
    await H.dbg('homeRoom', 'upstairs'); await inRoom('upstairs');
    await H.dbg('homeLayout', [{ id: 'figstand_step', x: 200, y: 260 }], 'wp_cloud'); await H.wait(500);
    await go('main');
    const d = await H.dbg('homeFloorBake');
    expect(d && d.id === 'upstairs' && d.figs === 0 && d.hash !== c.hash, '2かいの だいの フィギュアが 1かいから 見えない ' + JSON.stringify([c, d]));
  }, { viewport, timeout: 180000 });
}
