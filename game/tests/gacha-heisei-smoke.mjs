// へいせい じょじ ふうの ガチャ 4シリーズ（js/gacha-heisei.js・UI-79。オーナーの FB 2026-10-04「服、顔などのアイテムや家具、ガチャの定期入れ替えの種類として、実際の平成女児シリーズのガチャガチャを追加してほしい。」）
// 1. 2026-10-05（2しゅうめ）: Meeときょれじゃ 2F の ガチャ コーナーの 4くみに 1だいずつ へいせいの 台（NEW の はた）・かんばんの おしらせ
// 2. 「へいせい おへや」→ ふだ「NEW！ あたらしい ガチャ」→ レアの ハートの でんわ（へやに かざる）
// 3. 「へいせい おしゃれ」→ せつめいは「ふくと アクセサリー」→ レアの デニムの ジャンスカ と ちょうちょの いろめがね
// 4. 「ぽけっと たまご」「へいせい ぶんぐ」も まわす → おうちで ジャンスカ・めがねを きる → でんわ・たまご ペット・シールちょうを へやに おく
export async function gachaHeiseiSmoke({ scenario, expect }) {
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const tag = pn && pn.querySelector('.gacha-week');
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5,
      tag: tag ? tag.textContent : '', kind: (pn && pn.querySelector('.gacha-kind') || {}).textContent || '', title: (pn && pn.querySelector('.panel-title') || {}).textContent || '' };
  });
  const machines = (s) => s.fixtures.filter((f) => f.kind === 'gacha' && f.ring).map((f) => ({ ring: f.ring, slot: f.slot, series: f.series, fresh: !!f.fresh }));
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('gacha-heisei-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); const c0 = await H.dbg('coins', 5000); await H.dbg('calendar', '2026-10-05'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const st = await H.dbg('gachaHeisei');
    expect(st && st.series.length === 4 && st.series.map((s) => s.index).join() === '43,44,45,46' && st.series.every((s) => s.on && s.fresh && s.debut), '2しゅうめに へいせいの 4シリーズが はじめて でる ' + JSON.stringify(st && st.series.map((s) => [s.id, s.on, s.debut])));
    // 1. 2F の ガチャ コーナー
    await H.dbg('venue', 'arcade', 2); await H.idle(); await arrive(H, 2); await H.wait(900);
    const m = machines(await H.dbg('venueState')), fresh = m.filter((x) => x.fresh).map((x) => x.series).sort();
    expect(m.length === 12 && fresh.join() === '43,44,45,46', '2F の 12だいに へいせいの 4だい（NEW） ' + JSON.stringify(m));
    expect(await H.dbg('venueWalk', 13, 11), 'ガチャ コーナーの まえへ あるけない'); await H.until(() => { const v = PokaDebug.venueState(); return v && Math.hypot(v.party[0].x - 13, v.party[0].y - 11) < 0.6 && PokaDebug.idle(); }, 25000); await H.wait(600);
    await H.shot('corner');
    expect(await H.dbg('venueVisit', 'ガチャ コーナー'), 'ガチャ コーナーの かんばんが ない');
    await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 20000 });
    const board = await H.eval(() => document.querySelector('.dlg-text').innerText);
    expect(/こんしゅうの NEW/.test(board) && ['へいせい ぶんぐ', 'へいせい おへや', 'ぽけっと たまご', 'へいせい おしゃれ'].every((n) => board.includes(n)), 'かんばんに へいせいの NEW ' + board);
    await H.dialogs(); await H.idle();
    const spin = async (k) => { await H.dbg('gachaFast', 4); await H.dbg('gachaNext', k); await page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000); await page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(300); return H.dbg('gachaState'); };
    const open = async (id) => { expect(await H.dbg('gachaVisit', id), id + ' の 台が ない'); await page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400); };
    const close = async () => { await page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000); };
    // 2. へいせい おへや → ハートの でんわ
    await open('heiseiroom');
    let L = await fits(H);
    expect(L.title === '「へいせい おへや」' && L.tag === 'NEW！ あたらしい ガチャ' && /フィギュア/.test(L.kind) && !L.wide && !L.page && L.edge, 'へいせい おへや の がめん ' + JSON.stringify(L));
    await H.shot('room-machine');
    let g = await spin(3);
    expect(g.last.id === 'gacha_heiseiroom_3' && g.last.rare && (await H.dbg('saveData')).furn.gacha_heiseiroom_3 === 1 && g.coins === c0 - 200, 'ハートの でんわが でない ' + JSON.stringify(g.last));
    await H.shot('phone'); await close();
    // 3. へいせい おしゃれ → ジャンスカ・いろめがね
    await open('heiseioshare');
    L = await fits(H);
    expect(L.title === '「へいせい おしゃれ」' && /ふくと アクセサリー/.test(L.kind) && !L.wide && !L.page && L.edge, 'へいせい おしゃれ の がめん ' + JSON.stringify(L));
    g = await spin(3);
    expect(g.last.id === 'gacha_heiseioshare_3' && g.last.rare && (await H.dbg('wearStock', 'gacha_heiseioshare_3')).count === 1, 'デニムの ジャンスカが でない ' + JSON.stringify(g.last));
    await H.shot('jumper');
    g = await spin(1);
    expect(g.last.id === 'gacha_heiseioshare_1' && (await H.dbg('wearStock', 'gacha_heiseioshare_1')).count === 1, 'ちょうちょの いろめがねが でない ' + JSON.stringify(g.last));
    await close();
    // 4. ぽけっと たまご・へいせい ぶんぐ
    await open('heiseitama'); g = await spin(0); expect(g.last.id === 'gacha_heiseitama_0', 'たまご ペットが でない ' + JSON.stringify(g.last)); await H.shot('egg'); await close();
    await open('heiseibungu'); g = await spin(0); expect(g.last.id === 'gacha_heiseibungu_0', 'シールちょうが でない ' + JSON.stringify(g.last)); await close();
    const sd = await H.dbg('persistedSave');
    expect(sd.coins === c0 - 1000 && sd.furn.gacha_heiseitama_0 === 1 && sd.furn.gacha_heiseibungu_0 === 1, '5かい まわして 1000コイン・けいひんが セーブに のこる ' + JSON.stringify({ c: sd.coins, f: [sd.furn.gacha_heiseitama_0, sd.furn.gacha_heiseibungu_0] }));
    // おうちで きる・かざる
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ');
    await page.getByRole('button', { name: 'ふく', exact: true }).click(); await H.wait(200);
    await page.locator('.panel .grid .card').filter({ hasText: 'デニムの ジャンスカ' }).click(); await H.wait(300);
    await page.getByRole('button', { name: 'かお', exact: true }).click(); await H.wait(200);
    await page.locator('.panel .grid .card').filter({ hasText: 'ちょうちょの いろめがね' }).click(); await H.wait(300);
    const o = await H.eval(() => Save.d.chars[Save.d.order[0]].outfit);
    expect(o.body === 'gacha_heiseioshare_3' && o.face === 'gacha_heiseioshare_1', 'ジャンスカと めがねを きられない ' + JSON.stringify(o));
    await H.shot('dressup'); await page.click('.modal-wrap .close'); await H.until(() => !G.scene.mode, 8000);
    await H.dbg('homeLayout', [{ id: 'gacha_heiseiroom_3', x: 150, y: 300 }, { id: 'gacha_heiseitama_0', x: 230, y: 300 }, { id: 'gacha_heiseibungu_0', x: 310, y: 300 }]);
    await H.wait(900);
    const items = await H.eval(() => Save.d.room.items.map((it) => it.id));
    expect(['gacha_heiseiroom_3', 'gacha_heiseitama_0', 'gacha_heiseibungu_0'].every((id) => items.includes(id)), 'へやに かざれない ' + JSON.stringify(items));
    await H.shot('room');
    await H.dbg('calendar', null); await H.dbg('hour', null);
  }, { viewport, timeout: 240000 });
}
