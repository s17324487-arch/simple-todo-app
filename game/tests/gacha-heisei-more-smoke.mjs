// 4F の へいせい じょじ ふうの ガチャ 5シリーズ（js/gacha-heisei-more.js・UI-80。オーナーの FB 2026-10-04 の つづき「平成女児シリーズとは、例えば ナルミヤキャラクターズ・たまごっち・セボンスター・ほっぺちゃん・ラブ and ベリー・一期一会 など」）
// 1. 2026-10-05（2しゅうめ）: Meeときょれじゃ 4F の しま 5つに 1だいずつ へいせいの 台（NEW の はた）・もりの あんないに こんしゅうの NEW
// 2. 「キラキラ ステージ」→ せつめいは「ふくと アクセサリー」→ レアの ステージ ドレス・ヘッドセット
// 3. 「ぷにぷに しずく」の レア・「おかしの ほうせき」の にじいろ・「ゆめかわ ジュニア」の トレーナー・「ポエムの ぶんぐ」の ダイアリー
// 4. おうちで ドレスと ヘッドセットを きる → ぷにっこ と ダイアリーを へやに おく（ぷにっこは さわると むにっ）
export async function gachaHeiseiMoreSmoke({ scenario, expect }) {
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const tag = pn && pn.querySelector('.gacha-week');
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5,
      tag: tag ? tag.textContent : '', kind: (pn && pn.querySelector('.gacha-kind') || {}).textContent || '', title: (pn && pn.querySelector('.panel-title') || {}).textContent || '' };
  });
  const NAMES = ['ゆめかわ ジュニア', 'おかしの ほうせき', 'ぷにぷに しずく', 'キラキラ ステージ', 'ポエムの ぶんぐ'];
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('gacha-heisei-more-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); const c0 = await H.dbg('coins', 6000); await H.dbg('calendar', '2026-10-05'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const st = await H.dbg('gachaHeiseiMore');
    expect(st && st.series.length === 5 && st.series.map((s) => s.index).join() === '47,48,49,50,51' && st.series.every((s) => s.on && s.fresh && s.debut), '2しゅうめに 4F の へいせい 5シリーズが はじめて でる ' + JSON.stringify(st && st.series.map((s) => [s.id, s.on, s.debut])));
    // 1. 4F の しま
    await H.dbg('venue', 'arcade', 4); await H.idle(); await arrive(H, 4); await H.wait(900);
    const s = await H.dbg('venueState'), m = s.fixtures.filter((f) => f.kind === 'gacha' && f.ring), fresh = m.filter((f) => f.fresh).map((f) => f.series);
    expect(m.length === 18 && [47, 48, 49, 50, 51].every((i) => fresh.includes(i)) && fresh.length === 6, '4F の 18だいに へいせいの 5だい（NEW） ' + JSON.stringify(m.map((f) => [f.ring, f.series, !!f.fresh])));
    await H.shot('forest');
    expect(await H.dbg('venueVisit', 'もりの あんない'), 'もりの あんないが ない');
    await page.locator('.dlg-next:not(.hidden)').waitFor({ timeout: 20000 });
    const board = await H.eval(() => document.querySelector('.dlg-text').innerText);
    expect(/こんしゅうの NEW/.test(board) && NAMES.every((n) => board.includes(n)), 'もりの あんないに へいせいの NEW ' + board);
    await H.dialogs(); await H.idle();
    const spin = async (k) => { await H.dbg('gachaFast', 4); await H.dbg('gachaNext', k); await page.locator('.gacha-go').click(); await H.until(() => PokaDebug.gachaState().phase === 'capsule', 8000); await page.getByRole('button', { name: 'カプセルを あける', exact: true }).click(); await H.until(() => PokaDebug.gachaState().phase === 'done', 8000); await H.wait(300); return H.dbg('gachaState'); };
    const open = async (id) => { expect(await H.dbg('gachaVisit', id), id + ' の 台が ない'); await page.locator('.modal-wrap:not(.out) .gacha').waitFor({ timeout: 25000 }); await H.wait(400); };
    const close = async () => { await page.locator('.modal-wrap:not(.out) .close').click(); await H.until(() => !PokaDebug.gachaState().open && PokaDebug.idle(), 8000); };
    // 2. キラキラ ステージ → ドレス・ヘッドセット
    await open('heiseistage');
    let L = await fits(H);
    expect(L.title === '「キラキラ ステージ」' && L.tag === 'NEW！ あたらしい ガチャ' && /ふくと アクセサリー/.test(L.kind) && !L.wide && !L.page && L.edge, 'キラキラ ステージ の がめん ' + JSON.stringify(L));
    await H.shot('stage-machine');
    let g = await spin(3);
    expect(g.last.id === 'gacha_heiseistage_3' && g.last.rare && (await H.dbg('wearStock', 'gacha_heiseistage_3')).count === 1 && g.coins === c0 - 200, 'ステージ ドレスが でない ' + JSON.stringify(g.last));
    await H.shot('dress');
    g = await spin(0);
    expect(g.last.id === 'gacha_heiseistage_0' && (await H.dbg('wearStock', 'gacha_heiseistage_0')).count === 1, 'ヘッドセットが でない ' + JSON.stringify(g.last));
    await close();
    // 3. ぷにぷに しずく・おかしの ほうせき・ゆめかわ ジュニア・ポエムの ぶんぐ
    await open('heiseipuni'); L = await fits(H);
    expect(L.title === '「ぷにぷに しずく」' && /フィギュア/.test(L.kind) && !L.wide && !L.page && L.edge, 'ぷにぷに しずく の がめん ' + JSON.stringify(L));
    g = await spin(3); expect(g.last.id === 'gacha_heiseipuni_3' && g.last.rare && (await H.dbg('saveData')).furn.gacha_heiseipuni_3 === 1, 'ぷにっこ ゆめいろ が でない ' + JSON.stringify(g.last)); await H.shot('puni'); await close();
    await open('heiseijewel'); L = await fits(H);
    expect(L.title === '「おかしの ほうせき」' && /アクセサリー/.test(L.kind) && !L.wide && !L.page && L.edge, 'おかしの ほうせき の がめん ' + JSON.stringify(L));
    g = await spin(3); expect(g.last.id === 'gacha_heiseijewel_3' && (await H.dbg('wearStock', 'gacha_heiseijewel_3')).count === 1, 'にじいろ ペンダントが でない ' + JSON.stringify(g.last)); await close();
    await open('heiseijunior'); g = await spin(0); expect(g.last.id === 'gacha_heiseijunior_0', 'くまの トレーナーが でない ' + JSON.stringify(g.last)); await close();
    await open('heiseipoem'); g = await spin(2); expect(g.last.id === 'gacha_heiseipoem_2', 'かぎつき ダイアリーが でない ' + JSON.stringify(g.last)); await H.shot('poem'); await close();
    const sd = await H.dbg('persistedSave');
    expect(sd.coins === c0 - 1200 && sd.furn.gacha_heiseipuni_3 === 1 && sd.furn.gacha_heiseipoem_2 === 1, '6かい まわして 1200コイン・けいひんが セーブに のこる ' + JSON.stringify({ c: sd.coins, f: [sd.furn.gacha_heiseipuni_3, sd.furn.gacha_heiseipoem_2] }));
    // 4. おうちで きる・かざる
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ');
    await page.getByRole('button', { name: 'ふく', exact: true }).click(); await H.wait(200);
    await page.locator('.panel .grid .card').filter({ hasText: 'スターの ステージ ドレス' }).click(); await H.wait(300);
    await page.getByRole('button', { name: 'あたま', exact: true }).click(); await H.wait(200);
    await page.locator('.panel .grid .card').filter({ hasText: 'ほしの ヘッドセット' }).click(); await H.wait(300);
    const o = await H.eval(() => Save.d.chars[Save.d.order[0]].outfit);
    expect(o.body === 'gacha_heiseistage_3' && (o.head === 'gacha_heiseistage_0' || o.head2 === 'gacha_heiseistage_0'), 'ドレスと ヘッドセットを きられない ' + JSON.stringify(o));
    await H.shot('dressup'); await page.click('.modal-wrap .close'); await H.until(() => !G.scene.mode, 8000);
    await H.dbg('homeLayout', [{ id: 'gacha_heiseipuni_3', x: 170, y: 300 }, { id: 'gacha_heiseipoem_2', x: 260, y: 300 }]);
    await H.wait(900);
    const items = await H.eval(() => Save.d.room.items.map((it) => it.id));
    expect(['gacha_heiseipuni_3', 'gacha_heiseipoem_2'].every((id) => items.includes(id)), 'へやに かざれない ' + JSON.stringify(items));
    await H.shot('room');
    await H.dbg('calendar', null); await H.dbg('hour', null);
  }, { viewport, timeout: 240000 });
}
