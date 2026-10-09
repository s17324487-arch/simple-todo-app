// おうちの ドアの いろ（js/home-door-colors.js・UI-111。オーナーの 指示 2026-10-09「トイレとかのドアの色を変えれるようにしたい。」）
// もようがえの「ドア」タブ → ドアを えらぶ（おでかけ・おへや・おトイレ）→ いろの カード 12 → へやの 絵が かわる → さいかいしても のこる。
// 390×844 と 375×667 で はみ出さない・ボタン 44px。
export async function doorColorsSmoke({ scenario, expect }) {
  const hash = (H) => H.eval(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 97) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const layout = (H) => H.eval(() => {
    const bar = document.querySelector('.edit-bar').getBoundingClientRect(), r = (e) => e.getBoundingClientRect();
    const doors = [...document.querySelectorAll('.edit-bar .door-pick .tab')].map((b) => ({ k: b.dataset.door, on: b.classList.contains('on'), h: r(b).height, w: r(b).width, fit: r(b).left >= -1 && r(b).right <= innerWidth + 1 }));
    const cards = [...document.querySelectorAll('.edit-bar .tray .card')].map((c) => ({ id: c.dataset.color, on: c.classList.contains('on'), h: r(c).height, w: r(c).width }));
    const box = r(document.querySelector('.edit-bar .edit-tabs')), heads = [...document.querySelectorAll('.edit-bar .edit-tabs .tab')].map((b) => ({ t: b.textContent, inside: r(b).left >= box.left - 1 && r(b).right <= box.right + 1 }));
    return { heads, doors, cards, barTop: bar.top, barBottom: bar.bottom, h: innerHeight, wide: document.documentElement.scrollWidth > innerWidth };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('door-colors-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && !PokaDebug.state().transitioning, 20000); await H.idle(); await H.wait(300);
    expect(JSON.stringify((await H.dbg('saveData')).doorColors) === '{"out":"wood","room":"wood","toilet":"mint"}', 'はじめの ドアの いろが ちがう');
    await H.houseButton('もようがえ'); await H.wait(300);
    const before = await hash(H);
    await H.page.locator('.edit-bar .tabs .tab', { hasText: 'ドア' }).click(); await H.wait(300);
    let L = await layout(H);
    expect(L.doors.map((d) => d.k).join() === 'out,room,toilet' && L.doors.find((d) => d.on).k === 'toilet', 'ドアの えらびかた ' + JSON.stringify(L.doors));
    expect(L.cards.length === 12 && L.cards.find((c) => c.on)?.id === 'mint', 'いろの カード 12・いまは ミント ' + JSON.stringify(L.cards.map((c) => [c.id, c.on])));
    expect([...L.doors, ...L.cards].every((x) => x.h >= 44 && x.w >= 44) && L.doors.every((d) => d.fit), 'ボタンが ちいさい／はみ出す ' + JSON.stringify(L));
    expect(!L.wide && L.barBottom <= L.h + 1 && L.barTop >= 0, 'もようがえの したの ばんが はみ出す ' + JSON.stringify([L.barTop, L.barBottom, L.h]));
    expect(L.heads.length === 4 && L.heads.every((x) => x.inside), 'もようがえの タブが 1れつに はいらない ' + JSON.stringify(L.heads));
    await H.shot('tab');
    // おトイレ → ピンク・おでかけ → こん
    await H.page.locator('.edit-bar .tray .card[data-color="pink"]').click(); await H.wait(900);
    await H.page.locator('.edit-bar .door-pick .tab[data-door="out"]').click(); await H.wait(250);
    L = await layout(H); expect(L.cards.find((c) => c.on)?.id === 'wood', 'おでかけは き の いろ');
    await H.page.locator('.edit-bar .tray .card[data-color="navy"]').click(); await H.wait(900);
    let sd = await H.dbg('saveData');
    expect(sd.doorColors.toilet === 'pink' && sd.doorColors.out === 'navy' && sd.doorColors.room === 'wood', 'ドアの いろが かわらない ' + JSON.stringify(sd.doorColors));
    expect((await layout(H)).cards.find((c) => c.on)?.id === 'navy', 'えらんだ いろに しるし');
    await H.shot('picked');
    await H.page.locator('.edit-bar').getByRole('button', { name: 'おわる', exact: true }).click(); await H.wait(900);
    expect(await hash(H) !== before, 'へやの 絵が かわらない');
    await H.shot('room');
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle(30000);
    sd = await H.dbg('saveData'); expect(sd.doorColors.toilet === 'pink' && sd.doorColors.out === 'navy', 'さいかいで ドアの いろが もどる');
  }, { viewport, timeout: 120000 });
}
