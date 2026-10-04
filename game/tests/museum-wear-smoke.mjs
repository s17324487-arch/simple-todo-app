// すいぞくかん・はくぶつかんの きふの ごほうび（js/museum-wear.js・UI-33。オーナーの FB 2026-10-01「寄贈数に応じてもらえる、魚や恐竜とコラボした限定の服」）:
// さかな 4しゅ きふずみ → すいぞくかん（12F）の かんちょう: みだしに「ゴーグルまで あと 1しゅ」→ 5しゅめを きふ → ゴーグルの カード（3人が つけた 絵・44px・はみ出さない）
// → みだしは ネクタイ → はくぶつかん: ほね 63こ きふずみの 人が はなしかけると 4つの カード → もちもの → 3人が きて おうちで
export async function museumWearSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('museum-wear-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const fish = await H.eval(() => FISHING_DATA.fish.map((f) => f.id));
    for (const id of fish.slice(0, 4)) await H.dbg('museumGive', 'fish', id);
    await H.dbg('fishGive', fish[4]); await H.dbg('fishGive', fish[5]); // 2ひき もって いく（1ぴき きふしても まどが とじない）
    const card = async (tag) => {
      await H.page.locator('.modal-wrap:not(.out) .mw-card').waitFor({ timeout: 10000 }); await H.wait(300);
      const c = await H.eval(() => {
        const r = (e) => e.getBoundingClientRect(), w = [...document.querySelectorAll('.modal-wrap:not(.out)')].pop(), p = r(w.querySelector('.panel')), b = w.querySelector('.panel-footer .btn, .btn.yellow');
        return { name: w.querySelector('.mw-name').textContent, need: w.querySelector('.mw-need').textContent, trio: w.querySelectorAll('.mw-who svg').length, art: !!w.querySelector('.mw-art svg'),
          btn: b && b.textContent, h: b && r(b).height, fit: p.left >= -0.5 && p.right <= innerWidth + 0.5 && p.bottom <= innerHeight + 0.5, wide: document.documentElement.scrollWidth > innerWidth };
      });
      expect(c.trio === 3 && c.art && c.btn === 'ありがとう！' && c.h >= 44 && c.fit && !c.wide, tag + ' の カード ' + JSON.stringify(c));
      return c;
    };
    const thanks = async () => { await H.page.locator('.modal-wrap:not(.out)').getByRole('button', { name: 'ありがとう！', exact: true }).click(); await H.wait(300); };
    // 1. すいぞくかんの かんちょう: みだしに つぎの ごほうび
    await H.dbg('museumGo', 'aquarium'); await H.until(() => G.sceneName === 'venue' && PokaDebug.venueState()?.floor === 12 && PokaDebug.idle(), 20000); await H.wait(800);
    expect(await H.dbg('museumDonate'), 'かんちょうに 話しかけられない'); await H.dialogs();
    await H.page.locator('.dn-grid').waitFor({ timeout: 8000 }); await H.wait(300);
    let hint = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .mw-hint')?.textContent || '');
    expect(/ごほうび「おさかな ゴーグル」まで あと 1しゅ（さかなを 5しゅ きふ）/.test(hint), 'きふの みだしに ごほうび が ない ' + hint);
    await H.shot('hint');
    // 2. 5しゅめを きふ → ありがとう → ゴーグルの カード
    expect(await H.dbg('museumPick', fish[4]), '5しゅめを えらべない'); await H.dbg('museumConfirm'); await H.wait(300); await H.dialogs(); await H.wait(200);
    let c = await card('ゴーグル');
    expect(c.name === 'おさかな ゴーグル' && /すいぞくかんに さかなを 5しゅ きふした ごほうび/.test(c.need), 'ゴーグルの カードの ことば ' + JSON.stringify(c));
    await H.shot('card');
    await thanks();
    hint = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .mw-hint')?.textContent || '');
    let st = await H.dbg('museumWear'), d = await H.dbg('saveData');
    expect(/おさかな ネクタイ」まで あと 10しゅ/.test(hint) && st.aquarium.got.join() === 'mw_goggle' && d.wardrobe.mw_goggle === true && d.museum.wear.mw_goggle, 'ゴーグルが もちものに ない ' + JSON.stringify([hint, st.aquarium, d.museum.wear]));
    await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(300); await H.idle();
    // 3. はくぶつかん: ほね 63こ きふずみ → はなすと 4つの カード（つぎつぎ）
    await H.dbg('museumGive', 'bone', 'all');
    await H.dbg('museumGo', 'museum', 'lab'); await H.until(() => { const s = PokaDebug.venueState(); return s?.id === 'museum' && s.floor === 2 && !s.changingFloor && PokaDebug.idle(); }, 20000); await H.wait(800);
    expect(await H.dbg('museumDonate'), 'はかせに 話しかけられない'); await H.dialogs();
    const names = [];
    for (let i = 0; i < 4; i++) { c = await card('はくぶつかん ' + (i + 1)); names.push(c.name); if (i === 3) await H.shot('card-ptera'); await thanks(); await H.dialogs(); }
    expect(names.join() === 'ほねほね めがね,きばの ネックレス,ステゴ パーカー,プテラの つばさ', 'はくぶつかんの カードの じゅん ' + names);
    // ふくの あとで そんちょうさんの ひょうしょう（UI-69）: がいこつ 10たい ぶん まとめて
    const aw = await H.awards();
    expect(aw === 10 && (await H.dbg('fossilSell')).count === 10, 'ひょうしょうが 10たい ぶん でない ' + aw);
    await H.dialogs(); await H.idle();
    st = await H.dbg('museumWear'); d = await H.dbg('persistedSave');
    expect(st.museum.got.length === 4 && st.museum.next === null && ['mw_boneglass', 'mw_fang', 'mw_stego', 'mw_ptera'].every((id) => d.wardrobe[id] === true && d.museum.wear[id]), 'はくぶつかんの ごほうびが ほぞん されない ' + JSON.stringify([st.museum, d.museum.wear]));
    expect(!(await H.eval(() => !!document.querySelector('.modal-wrap:not(.out) .mw-card'))), 'カードが のこる');
    // もういちど はなしても もらわない
    expect(await H.dbg('museumDonate'), 'はかせに もういちど 話しかけられない'); await H.dialogs(); await H.wait(300);
    expect(!(await H.eval(() => !!document.querySelector('.modal-wrap:not(.out) .mw-card'))) && (await H.dbg('museumWear')).museum.got.length === 4, '2かい もらえた');
    await H.dialogs(); await H.idle();
    // 4. おうち: 3人が げんていの 服（1こで ひとり なので 1人 1つ）
    await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.houseButton('きがえ');
    await H.page.locator('.modal-wrap:not(.out) .tabs .tab').filter({ hasText: 'せなか' }).click(); await H.wait(200);
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'プテラの つばさ' }).click(); await H.wait(200);
    const lead = (await H.dbg('saveData')).order[0];
    expect((await H.dbg('saveData')).chars[lead].outfit.back === 'mw_ptera', 'きがえで プテラの つばさを つけられない');
    await H.page.locator('.modal-wrap:not(.out) .close').click(); await H.wait(300);
    d = await H.dbg('saveData'); const [a, b, g] = d.order;
    d.chars[b].outfit = { ...d.chars[b].outfit, face: 'mw_goggle', neck: 'mw_fang' }; d.chars[g].outfit = { ...d.chars[g].outfit, body: 'mw_stego', face: 'mw_boneglass' };
    await H.dbg('seedSave', d); await H.dbg('house'); await H.until(() => G.sceneName === 'house' && PokaDebug.idle(), 15000); await H.dbg('homeBubbleFixture'); await H.wait(900);
    await H.shot('house');
    const wear = await H.dbg('wearStock', 'mw_ptera'); expect(wear.count === 1 && wear.wearers.join() === a, 'プテラの つばさは 1こ ' + JSON.stringify(wear));
  }, { viewport, timeout: 180000 });
}
