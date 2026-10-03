// ネリカス でんき（池袋の 家電の 館・js/kaden-hall.js / js/kaden-hall-art.js・UI-56。オーナーの FB 2026-10-03「池袋の家電屋さんを、もっとハイクオリティにせよ。
// 内装をサンシャインいけぶレベルまでよくして、家電ももっとクオリティアップせよ」）
// 1. 1F（いりぐち・スマホ・カメラ）: 斜め上の 館・店内 BGM・そうさの ボタン（ひだりうえに 小さく）・スマホの だいを ゆびで タップして かう・ためしの だい
// 2. エスカレーターで 2F（くらしの かでん）: ドラム せんたくき・かべかけ エアコンを かう → 3F へ
// 3. 3F（テレビ・パソコン）: ゲームの ためしあそび・きわくの テレビを かう
// 4. エレベーターで 10F（あかり・シアター・けいば ちゅうけい〔UI-58〕）: ためせる マッサージチェア・シアター
// 5. フロアマップ（1F・2F・3F・10F）から 1F の うりばへ（エレベーターで いって あるく）
// 6. おうちで 家電を さわる（せんたくき・テレビ・ロボット そうじき・せんぷうき・エアコン。js/kaden-live.js）・さいかい しても かった ものが のこる
export async function kadenSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('kaden-hall-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 99850); const before = await H.dbg('saveData');
    const ready = (fl) => H.until((q) => { const s = PokaDebug.venueState(); return s?.id === 'electronics' && s.floor === q && !s.changingFloor && PokaDebug.venueIso()?.ready && PokaDebug.idle(); }, 30000, fl);
    const visit = async (label) => expect(await H.dbg('venueVisit', label), 'しらべられない ' + label);
    const talk = async (label) => { await visit(label); await H.page.locator('.dlg-text').waitFor(); await H.dialogs(); await H.idle(); };
    const buy = async (label, shot) => {
      await visit(label); const b = H.page.getByRole('button', { name: 'かう', exact: true }); await b.waitFor({ timeout: 20000 });
      expect((await H.eval(() => document.querySelector('.panel')?.textContent || '')).includes(label), 'だいの しなものが でない ' + label); if (shot) await H.shot(shot);
      await b.click(); await H.wait(300); const kiru = H.page.getByRole('button', { name: 'きる！', exact: true }); if (await kiru.count()) await kiru.click(); await H.idle();
    };
    const bgm = () => H.eval(() => Sound.cur?.name || Sound.want);
    // 1. 1F
    await H.dbg('venue', 'electronics'); await ready(1);
    let k = await H.dbg('kaden'), v = await H.dbg('venueIso');
    expect(k && k.title === '1F スマホ・カメラ' && k.stands.length === 3 && k.demos.includes('phone') && k.demos.includes('camera') && k.escalators.join() === '2Fへ のぼる' && k.zones.includes('スマホ') && v.iso && v.crowd >= 4, '1F が 斜めの 館で ない ' + JSON.stringify({ k, v }));
    expect(await bgm() === 'shop_kaden', '店内 BGM ' + await bgm());
    const ui = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), rs = [...document.querySelectorAll('.venue-top .btn,.store-home')].map((b) => ({ t: b.textContent, q: r(b) })), hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      return { names: rs.map((b) => b.t).join(), small: rs.filter((b) => b.q.height < 44).length, low: rs.filter((b) => b.q.bottom > 150).length, overlap: rs.some((a, i) => rs.some((b, j) => i < j && hit(a.q, b.q))), out: rs.filter((b) => b.q.left < -0.5 || b.q.right > innerWidth + 0.5).length, wide: document.documentElement.scrollWidth > innerWidth }; });
    expect(ui.names === 'フロア案内,たてものを でる,おうちへ' && !ui.small && !ui.low && !ui.overlap && !ui.out && !ui.wide, 'そうさの ボタン ' + JSON.stringify(ui));
    await H.shot('kaden-1f');
    // スマホの だいの まえまで あるいて、ゆびで タップ → かう
    await H.dbg('venueWalk', 6, 8); await H.until(() => { const v = PokaDebug.venueIso(); return v.leader[0] === 6 && v.leader[1] === 8; }, 20000); await H.wait(600);
    const p = await H.dbg('venuePoint', 0, 0, 'おりたたみ スマホ'); await H.page.touchscreen.tap(p.x, p.y);
    const kau = H.page.getByRole('button', { name: 'かう', exact: true }); await kau.waitFor({ timeout: 20000 });
    expect((await H.eval(() => document.querySelector('.panel')?.textContent || '')).includes('おりたたみ スマホ'), 'タップした だいの しなものが でない');
    await H.shot('kaden-phone'); await kau.click(); await H.wait(300); const kiru = H.page.getByRole('button', { name: 'きる！', exact: true }); if (await kiru.count()) await kiru.click(); await H.idle();
    expect((await H.dbg('saveData')).wardrobe.ike_phone_1, 'だいから スマホが かえない');
    await talk('スマホの ためしの だい'); await talk('カメラの ショーケース');
    // 2. 2F
    await visit('2Fへ のぼる'); await ready(2); k = await H.dbg('kaden');
    expect(k.title === '2F くらしの かでん' && k.stands.length === 18 && ['エアコン', 'せんたくき', 'れいぞうこ', 'そうじき', 'キッチン かでん', 'きせつの かでん'].every((z) => k.zones.includes(z)) && k.escalators.includes('3Fへ のぼる') && k.escalators.includes('1Fへ おりる'), '2F ' + JSON.stringify(k));
    await H.wait(500); await H.shot('kaden-2f');
    await buy('ドラム せんたくき', 'kaden-washer'); await buy('かべかけ エアコン');
    let d = await H.dbg('saveData'); expect(d.furn.ike_washer_0 === 1 && d.furn.ike_kaden_aircon === 1, 'せんたくき・エアコンが かえない ' + JSON.stringify([d.furn.ike_washer_0, d.furn.ike_kaden_aircon]));
    // 3. 3F
    await visit('3Fへ のぼる'); await ready(3); k = await H.dbg('kaden');
    expect(k.title === '3F テレビ・パソコン' && k.stands.length === 8 && k.demos.includes('pc') && k.demos.includes('game') && k.demos.includes('music'), '3F ' + JSON.stringify(k));
    await H.wait(500); await H.shot('kaden-3f');
    await talk('ゲームの ためしあそび'); await buy('きわくの テレビ');
    expect((await H.dbg('saveData')).furn.ike_tv_0 === 1, 'テレビが かえない');
    // 4. エレベーターで 10F
    await visit('エレベーター'); const ten = H.page.getByRole('button', { name: /^10F/ }); await ten.waitFor(); await ten.click(); await ready(10); k = await H.dbg('kaden');
    expect(k.title === '10F あかり・シアター・けいば' && k.stands.length === 4 && k.zones.includes('シアター') && k.zones.includes('マッサージチェア') && k.zones.includes('けいば ちゅうけい'), '10F ' + JSON.stringify(k));
    await H.wait(500); await H.shot('kaden-10f');
    await visit('ためせる マッサージチェア'); await H.until(() => /もみ|ぽかぽか|ねむく/.test(document.querySelector('.dlg-text')?.textContent || ''), 10000); await H.shot('kaden-massage'); await H.dialogs(); await H.idle();
    await talk('シアターの ソファ');
    // 5. フロアマップ → 1F の スマホ
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor();
    const g = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), bs = [...document.querySelectorAll('.mall-guide .btn')]; return { tabs: [...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map((b) => b.textContent).join(), small: bs.filter((b) => r(b).height < 43.5).length, out: bs.filter((b) => r(b).left < -0.5 || r(b).right > innerWidth + 0.5).length, over: bs.filter((b) => b.scrollWidth > b.clientWidth + 1).length, spots: document.querySelectorAll('.mall-guide .mg-spot').length }; });
    expect(g.tabs === '1F,2F,3F,10F' && !g.small && !g.out && !g.over && g.spots >= 4, 'フロアマップの ボタン ' + JSON.stringify(g)); await H.shot('kaden-map');
    await H.page.getByRole('button', { name: '1F', exact: true }).click(); await H.page.locator('.mall-guide .mg-spot[data-label="スマホ"]').click();
    await ready(1); await H.until(() => { const v = PokaDebug.venueIso(); return v.leader[1] >= 9 && v.leader[1] <= 12 && v.leader[0] >= 4 && v.leader[0] <= 9; }, 20000);
    d = await H.dbg('saveData'); expect(d.coins === before.coins - 13500 - 7200 - 16800 - 8100, 'かった ものの ねだん ' + (before.coins - d.coins));
    // 6. おうちで さわる
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.dbg('homeLayout', [{ id: 'ike_washer_0', x: 110, y: 300 }, { id: 'ike_tv_1', x: 300, y: 290 }, { id: 'ike_vacuum_2', x: 200, y: 560 }, { id: 'ike_kaden_fan', x: 430, y: 480 }, { id: 'ike_kaden_aircon', x: 330, y: 100 }]);
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    const touch = async (id, ok, msg) => {
      const a = await H.dbg('furnLive', id); expect(a && a.tap && a.live !== undefined, id + ': タップできる 点が ない ' + JSON.stringify(a));
      await H.tap(a.tap.x, a.tap.y); await H.wait(300);
      const b = await H.dbg('furnLive', id); expect(ok(a, b), msg + ' ' + JSON.stringify([a, b])); expect(b.talk > a.talk, id + ': 3人が なにも いわない');
    };
    await touch('ike_washer_0', (a, b) => b.n === (a.n || 0) + 1 && b.t < 1, 'せんたくきが まわらない');
    await touch('ike_tv_1', (a, b) => a.ch === 0 && b.ch === 1, 'テレビの チャンネルが かわらない');
    await touch('ike_vacuum_2', (a, b) => b.n === 1, 'ロボット そうじきが うごかない');
    await touch('ike_kaden_fan', (a, b) => a.on === true && b.on === false, 'せんぷうきが とまらない');
    await touch('ike_kaden_aircon', (a, b) => a.on === false && b.on === true, 'エアコンが つかない');
    await H.wait(1200); await H.shot('kaden-room');
    // さいかい
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const s = await H.dbg('saveData');
    expect(s.coins === d.coins && s.furn.ike_washer_0 === 1 && s.furn.ike_kaden_aircon === 1 && s.furn.ike_tv_0 === 1 && s.wardrobe.ike_phone_1, 'さいかいで かった ものが きえる');
  }, { viewport, timeout: 240000 });
}
