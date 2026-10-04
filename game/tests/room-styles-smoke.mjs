// かべがみ 15しゅ・ゆか 15しゅ（js/room-styles.js・UI-90。オーナーの FB 2026-10-04「壁紙とゆかについて、15種類ずつ増やして。もっと可愛い系、かっこいい系、コンセプト系がほしい」）
// 1. かぐやさんの「かべがみ」「ゆか」: あたらしい 15しゅが さき（かわいい 5・かっこいい 5・コンセプト 5 の ふだ）・ふだは カードの なか・はみ出さない・44px
// 2. 「うみの なか」と「おしろの ゆか」を かう → おうちの もようがえで はる → へやの 絵が かわる → さいかいしても のこる
// 3. 30しゅ ぜんぶの へやの 絵と 見本が ブラウザで よめる（SVG が こわれて いない）
export async function roomStylesSmoke({ scenario, expect }) {
  const GROUPS = ['かわいい', 'かっこいい', 'コンセプト'];
  const cards = (H) => H.page.$$eval('.modal-wrap:not(.out) .grid .card', (cs) => cs.map((c) => {
    const r = c.getBoundingClientRect(), t = c.querySelector('.rs-tag'), q = t && t.getBoundingClientRect();
    return { name: ((c.querySelector('.ico + div') || {}).textContent || '').trim(), tag: t ? t.textContent : null, inside: !t || (q.left >= r.left - 1 && q.right <= r.right + 1 && q.top >= r.top - 1 && q.bottom <= r.bottom + 1), h: r.height, w: r.width, fit: r.left >= -1 && r.right <= innerWidth + 1 };
  }));
  const tab = async (H, label) => { await H.page.locator('.modal-wrap:not(.out) .tab', { hasText: label }).click(); await H.wait(300); };
  const front = async (H, what) => {
    const c = await cards(H), want = GROUPS.flatMap((g) => Array(5).fill(g));
    expect(c.length >= 26 && JSON.stringify(c.slice(0, 15).map((x) => x.tag)) === JSON.stringify(want) && c.slice(15).every((x) => !x.tag), what + ': あたらしい 15しゅが さき・なかまの ふだ ' + JSON.stringify(c.slice(0, 16).map((x) => [x.name, x.tag])));
    expect(c.every((x) => x.inside && x.h >= 44 && x.w >= 44), what + ': ふだが はみ出す／カードが ちいさい ' + JSON.stringify(c.filter((x) => !x.inside || x.h < 44 || x.w < 44)));
    expect(!(await H.eval(() => document.documentElement.scrollWidth > innerWidth)) && c.every((x) => x.fit), what + ': よこに はみ出す');
  };
  // かう まえと あとの コインの さ（みせに はいった ときの ほかの コインは かぞえない）
  const buy = async (H, name) => {
    const c0 = (await H.dbg('saveData')).coins;
    await H.page.locator('.modal-wrap:not(.out) .grid .card', { hasText: name }).first().click(); await H.wait(300);
    await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'かう', exact: true }).click(); await H.wait(400);
    return c0 - (await H.dbg('saveData')).coins;
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('room-styles-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear'); await H.dbg('coins', 9000);
    // 1. かぐやさん
    await H.dbg('store', 'furniture'); await H.idle(30000);
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click(); await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    await H.page.waitForSelector('.modal-wrap .grid .card'); await H.wait(300);
    await tab(H, 'かべがみ'); await front(H, 'かべがみ'); await H.shot('shop-wp');
    const c0 = await cards(H);
    expect(c0[0].name === 'ハートの かべ' && c0[10].name === 'うみの なか' && c0[14].name === 'おしろの かべ', 'かべがみの ならび ' + JSON.stringify(c0.slice(0, 15).map((x) => x.name)));
    const paid1 = await buy(H, 'うみの なか');
    let sd = await H.dbg('saveData');
    expect(sd.room.wallpapers.wp_sea === true && paid1 === 1560, 'うみの なかを かえない ' + JSON.stringify({ wp: sd.room.wallpapers.wp_sea, paid1 }));
    expect((await cards(H)).find((x) => x.name === 'うみの なか')?.tag === 'コンセプト', 'かった あとも ふだ');
    await tab(H, 'ゆか'); await front(H, 'ゆか'); await H.shot('shop-fl');
    const paid2 = await buy(H, 'おしろの ゆか');
    sd = await H.dbg('saveData'); expect(sd.room.floors.fl_castle === true && paid2 === 1560, 'おしろの ゆかを かえない ' + paid2);
    for (let i = 0; i < 4 && await H.page.locator('.modal-wrap:not(.out)').count(); i++) { await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button', { name: 'とじる', exact: true }).click(); await H.wait(300); }
    // 2. おうちで はる
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle(); await H.wait(300);
    const before = await H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 97) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
    await H.houseButton('もようがえ'); await H.wait(300);
    for (const [label, name] of [['かべがみ', 'うみの なか'], ['ゆか', 'おしろの ゆか']]) {
      await H.page.locator('.edit-bar .tabs .tab', { hasText: label }).click(); await H.wait(250);
      await H.page.locator('.edit-bar .tray .card', { hasText: name }).first().click(); await H.wait(900);
    }
    sd = await H.dbg('saveData'); expect(sd.room.wall === 'wp_sea' && sd.room.floor === 'fl_castle', 'もようがえで はれない ' + JSON.stringify([sd.room.wall, sd.room.floor]));
    await H.shot('edit');
    await H.page.locator('.edit-bar').getByRole('button', { name: 'おわる', exact: true }).click(); await H.wait(900);
    const after = await H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 97) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
    expect(after !== before, 'へやの 絵が かわらない');
    await H.shot('room');
    // 3. 30しゅ ぜんぶ ブラウザで よめる
    const bad = await H.eval(async () => {
      const ids = [...RoomStyles.WALLS.map((id) => ['wall', id]), ...RoomStyles.FLOORS.map((id) => ['floor', id])], out = [];
      const load = (svg) => new Promise((res) => { const im = new Image(); im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = U.svgUrl(svg); });
      for (const [kind, id] of ids) {
        const room = kind === 'wall' ? HomeDesign.roomSvg(id, 'fl_wood') : HomeDesign.roomSvg('wp_cream', id);
        if (!(await load(room)) || !(await load(Art.iconSvg(kind, id)))) out.push(id);
      }
      return { n: ids.length, out };
    });
    expect(bad.n === 30 && !bad.out.length, 'ブラウザで よめない かべがみ・ゆか ' + JSON.stringify(bad));
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    sd = await H.dbg('saveData'); expect(sd.room.wall === 'wp_sea' && sd.room.floor === 'fl_castle' && sd.room.wallpapers.wp_sea && sd.room.floors.fl_castle, 'さいかいで かわる');
  }, { viewport, timeout: 180000 });
}
