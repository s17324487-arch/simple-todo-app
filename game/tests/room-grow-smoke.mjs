// おへやを 3ばい・4ばいに ひろげる（UI-114。オーナーの 指示 2026-10-09「部屋を10万円で3倍、50万円で4倍」）
// 1. 2ばいの おへや → 「おへや」→「3ばいに ひろげる」（10まん コイン・ボタンは 44px・はみ出さない）→ めんせき 3ばい
// 2. 「4ばいに ひろげる」（50まん）→ めんせき 4ばい・ボタンは「ひろげたよ」・おへやが がめんに はいる
// 3. ひろがった ゆかの おくに かぐを はこべる・3人が あるける・5ばいまで ズーム・さいかい しても のこる
export async function roomGrowSmoke({ scenario, expect }) {
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('.room-expansion button')].filter((b) => b.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => r(b).height < 44 || r(b).right > innerWidth + 1).length, text: (pn.querySelector('.room-expansion') || {}).textContent || '' };
  });
  const widen = async (H, next) => {
    await H.houseButton('おへや'); await H.wait(200);
    const L = await fits(H);
    expect(!L.wide && !L.page && !L.small, 'おへやの がめんが はみ出す ' + JSON.stringify(L));
    await H.page.getByRole('button', { name: `${next}ばいに ひろげる`, exact: true }).click(); await H.choose(0);
    await H.until((n) => PokaDebug.idle() && PokaDebug.homeDesign()?.level === n, 15000, next); await H.wait(400);
    return L;
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('room-grow-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear');
    const fx = await H.dbg('saveData'); fx.rooms.expanded.main = true; fx.coins = 650000;
    await H.dbg('seedSave', fx); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle(); await H.dbg('hour', 12);
    let d = await H.dbg('homeDesign');
    expect(d.level === 2 && d.width === 640, '2ばいの おへやに ならない ' + JSON.stringify({ level: d.level, w: d.width }));
    // 1. 3ばい
    let L = await widen(H, 3);
    expect(/2ばい → 3ばい：100000 コイン/.test(L.text), '3ばいの ねだんが でない ' + L.text);
    d = await H.dbg('homeDesign');
    expect(d.width * d.depth === 480 * 360 * 3 && (await H.dbg('state')).coins === 550000 && d.zoomMax === 4, '3ばいの めんせき・ねだん・ズーム ' + JSON.stringify({ w: d.width, d: d.depth, z: d.zoomMax }));
    await H.shot('x3');
    // 2. 4ばい
    L = await widen(H, 4);
    expect(/3ばい → 4ばい：500000 コイン/.test(L.text), '4ばいの ねだんが でない ' + L.text);
    d = await H.dbg('homeDesign');
    expect(d.width === 960 && d.depth === 720 && d.width * d.depth === 480 * 360 * 4 && (await H.dbg('state')).coins === 50000 && d.zoomMax === 5, '4ばいの めんせき・ねだん・ズーム');
    await H.houseButton('おへや'); await H.wait(200);
    L = await fits(H);
    expect(await H.page.getByRole('button', { name: 'ひろげたよ', exact: true }).isDisabled() && /いちばん ひろいよ/.test(L.text) && !L.wide && !L.small, '4ばいの あとも ひろげられる ' + L.text);
    await H.page.locator('.modal-wrap .close').last().click(); await H.wait(250);
    // へやが がめんに はいる（ひだり・みぎ）
    const room = await H.eval(() => { const a = PokaDebug.homePoint(0, ROOM.H), b = PokaDebug.homePoint(ROOM.W, ROOM.WALL); return { l: a.x, r: b.x }; });
    expect(room.l >= -2 && room.r <= viewport.width + 2, 'ひろい おへやが がめんから はみ出す ' + JSON.stringify(room));
    await H.dbg('homeBubbleFixture'); await H.wait(500); await H.shot('x4');
    // 3. おくの すみに かぐ・3人が あるく
    await H.houseButton('もようがえ');
    d = await H.dbg('homeDesign'); const kinds = await H.eval(() => Save.d.room.items.map((x) => FURN_INDEX[x.id].kind)), it = d.items.find((x, i) => !['wall', 'rug'].includes(kinds[i]));
    const start = { x: it.rect.x + it.rect.w * 0.5, y: it.rect.y + it.rect.h * 0.3 }, a = await H.dbg('homePoint', it.x, it.y), b = await H.dbg('homePoint', 880, 880);
    await H.drag(start.x, start.y, start.x + b.x - a.x, start.y + b.y - a.y);
    const moved = (await H.dbg('homeDesign')).items.find((x) => x.uid === it.uid);
    expect(Math.abs(moved.x - 880) < 3 && Math.abs(moved.y - 880) < 3, 'ひろがった ゆかに かぐを おけない ' + JSON.stringify({ x: moved.x, y: moved.y }));
    await H.page.locator('.edit-bar').getByRole('button', { name: 'おわる', exact: true }).click(); await H.wait(300);
    await H.pinch(viewport.width / 2, viewport.height * 0.5, 40, 200); expect((await H.dbg('homeDesign')).zoom > 3.2, '4ばいの おへやで 3ばいより 大きく ズーム できない');
    await H.shot('zoom');
    await H.pinch(viewport.width / 2, viewport.height * 0.5, 200, 30); expect((await H.dbg('homeDesign')).zoom === 1, 'ぜんたいに もどらない');
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    d = await H.dbg('homeDesign');
    expect(d.level === 4 && d.width === 960 && Math.abs(d.items.find((x) => x.uid === it.uid).x - 880) < 3, 'さいかいで ひろさ・かぐが もどる');
  }, { viewport, timeout: 150000 });
}
