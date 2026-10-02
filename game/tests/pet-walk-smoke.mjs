// いぬの さんぽ（js/pet-walk.js・UI-49。オーナーの FB 2026-10-02「持ち物で…犬を連れたり…したい」）
// 1. ようふくやさんの「もちもの」で おさんぽ リードを かって「きる！」→ まちで こいぬが よこに いる（リード）→ あるくと ついて くる
// 2. がちゃんにも リード → 2ひき → おうちで 2ひきとも 見えて いる（3人と かさならない がわ）→ こいぬを タップ →「わん！」・ハート → リードを はずすと いない → さいかい しても のこる
export async function petWalkSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('pet-walk-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 6000); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const lead = (await H.dbg('saveData')).order[0];
    const leashName = await H.eval(() => ITEM_INDEX[PetWalk.ITEM].name);
    // 1. ようふくやさん
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.locator('.modal-wrap:not(.out) .tabs').getByText('もちもの', { exact: true }).click(); await H.wait(250);
    await H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: leashName }).first().click(); await H.wait(250);
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(300);
    let st = await H.dbg('pets');
    expect(st.holders.join() === lead, 'リードを もたない ' + JSON.stringify(st));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    // まち
    await H.dbg('teleport', 'town', 12, 12); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000); await H.wait(700);
    st = await H.dbg('pets');
    expect(st.scene === 'world' && st.pets.length === 1 && st.pets[0].id === lead && st.pets[0].dist < 45, 'まちで こいぬが よこに いない ' + JSON.stringify(st));
    const x0 = st.pets[0].x;
    await H.shot('town');
    let walked = false;
    for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) { const s = await H.dbg('state'); if (await H.dbg('walkTo', s.pos[0] + dx, s.pos[1] + dy)) { walked = true; break; } }
    expect(walked, 'あるける ばしょが ない');
    await H.wait(600); await H.shot('walk');
    await H.until(() => PokaDebug.idle() && !(G.scene.path && G.scene.path.length) && G.scene.party.every((w) => !w.moving), 8000); await H.wait(500);
    st = await H.dbg('pets');
    expect(st.pets.length === 1 && Math.abs(st.pets[0].x - x0) > 20 && st.pets[0].dist < 45, 'あるいても ついて こない ' + JSON.stringify(st));
    // 2. 2ひき・おうち
    await H.dbg('wearSet', 'hi_leash', 2); await H.dbg('petHold', 'gachan');
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    st = await H.dbg('pets');
    expect(st.scene === 'house' && st.pets.length === 2 && st.pets.every((p) => p.dist < 120), 'おうちに こいぬが 2ひき いない ' + JSON.stringify(st));
    const pup = st.pets.find((p) => p.id === 'gachan');
    expect(st.pets.every((p) => p.cx !== null) && pup.cx >= 0 && pup.cx <= viewport.width && pup.cy >= 0 && pup.cy <= viewport.height, 'こいぬが 見えない・画面の そと ' + JSON.stringify(st.pets));
    const log0 = (await H.dbg('homeTalkLog')).length;
    await H.tap(pup.cx, pup.cy); await H.wait(300);
    st = await H.dbg('pets');
    expect(st.pets.find((p) => p.id === 'gachan').love > 0 && (await H.dbg('homeTalkLog')).slice(log0).some((x) => x.pet === 'gachan'), 'こいぬを タップしても よろこばない ' + JSON.stringify(st));
    await H.shot('house');
    await H.dbg('petHold', 'gachan', false); await H.wait(200);
    st = await H.dbg('pets'); expect(st.pets.length === 1 && st.pets[0].id === lead, 'リードを はずしても いる ' + JSON.stringify(st));
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    await H.until(() => PokaDebug.state().scene === 'house', 15000); await H.wait(500);
    st = await H.dbg('pets'); expect(st.holders.join() === lead && st.pets.length === 1, 'さいかいで こいぬが いない ' + JSON.stringify(st));
  }, { full: true, viewport, timeout: 150000 });
}
