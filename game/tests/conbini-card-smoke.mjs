// コンビニの ポイントカード（js/conbini-card.js・js/conbini-card-art.js・UI-85。オーナーの 指示 2026-10-04「コンビニ（2店舗は別々に扱う）において、ポイントカードを用意して」）
// 1. ローリソンで からあげを 4こ かう（60 × 4 = 240コイン）→ てんいんさん「ポイントカードを つくったよ」→ 10ポイント（のこり 40コイン）
// 2. てんいんさん →「ポイントカード」→ カードの まど（カードの 絵・ポイント・けいひん 5つ・10000 は ？？？・はみ出さない・ボタン 44px）
// 3. 20000ポイント → クレーン チケット → レベル +10 けん（いま つかう → クレープやさん Lv.1 → 11・ごほうび）→ レベル +25 けん（あとで）→ ていきけん → ひみつ（オーナー けん）
// 4. オーナー: とても ていねいな あいさつ・からあげ 54コイン（10%びき）・かうと はらった ぶんの ポイント・せぶんぶんは まだ ふつう
// 5. すまほの もちもの: カード・チケット・ていきけん・レベル +25 けん →「つかう」→ パンやさん Lv.1 → 26
// 6. バス: ていきけんで ただ（ネリカスタウン → 池袋・コインは へらない）
// 7. Meeときょれじゃの クレーン: 台の まどで「チケットで あそぶ」→ コインは へらない・チケットが へる
// 8. さいかい しても のこる
export async function conbiniCardSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [];
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5 };
  }, tag);
  const btn = (H, name) => H.page.getByRole('button', { name, exact: true }).click();
  // たしかめる まど（UI.confirm・UI.ask）の ボタン（もちものの「つかう」と まざらない ように）
  const pick = (H, name) => H.page.locator('.dlg-shade.ask .choices .btn').filter({ hasText: new RegExp('^' + name.replace(/[()（）+?.*[\]\\]/g, '\\$&') + '$') }).click();
  // てんいんさんの せりふ re が でるまで まつ（ちがう せりふは おくる）。rest: のこりの せりふも ぜんぶ おくる（つづく せりふを たしかめる ときは false）
  const say = async (H, re, rest = true, ms = 10000) => {
    const t0 = Date.now();
    for (;;) {
      const hit = await H.eval((src) => { const t = document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent; return t == null ? null : new RegExp(src).test(t); }, re.source);
      if (hit === true) break;
      expect(Date.now() - t0 < ms, 'せりふが でない: ' + re.source);
      if (hit === false) await H.eval(() => document.querySelector('.dlg-shade:not(.ask)')?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
      await H.wait(90);
    }
    if (rest) await H.dialogs();
  };
  const card = (H) => H.dbg('conbiniCard', 'lawson');
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + ' の 入口が ない');
    await H.dbg('teleport', 'town', door.x, door.y + 1, 'up'); await H.idle(); await H.dbg('walkTo', door.x, door.y);
    await H.until(() => PokaDebug.state().scene === 'store' && PokaDebug.idle(), 20000); await H.wait(400);
  };
  const talk = async (H, pick) => { await btn(H, 'てんいんと はなす'); await H.page.locator('.choices .btn').first().waitFor(); const text = await H.eval(() => document.querySelector('.dlg-shade.ask .dlg-text')?.textContent || ''); await btn(H, pick); return text; };
  const closeTop = async (H) => { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.wait(260); };
  const trade = async (H, id) => { await H.page.locator(`.cc-prize[data-id="${id}"] .cc-trade`).click(); await pick(H, 'こうかん'); };
  const rows = (H) => H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .cc-prize')].map((r) => ({ id: r.dataset.id, name: r.querySelector('b').textContent, can: r.classList.contains('can'), off: r.querySelector('.cc-trade').disabled, btn: r.querySelector('.cc-trade').textContent })));

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('conbini-card-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); await H.dbg('coins', 50000);
    const layout = await H.dbg('townLayout', 'town');
    // 1. からあげ 4こ → カードを つくる・10ポイント
    await enterStore(H, layout, 'lawson');
    let c = await card(H); expect(!c.has && c.pts === 0 && c.name === 'ローリソン ポイントカード', 'はじめは カードが ない ' + JSON.stringify(c));
    await talk(H, 'かいものを する'); await H.page.locator('.modal-wrap .grid .card').first().waitFor();
    await H.page.locator('.modal-wrap .grid .card').filter({ hasText: 'からあげ' }).first().click();
    for (let i = 0; i < 3; i++) await btn(H, '＋');
    const coins0 = (await H.dbg('saveData')).coins;
    await btn(H, 'かう'); await say(H, /ポイントカードを つくったよ/);
    c = await card(H); expect(c.has && c.pts === 10 && c.carry === 40 && c.spent === 240 && (await H.dbg('saveData')).coins === coins0 - 240, 'からあげ 4こで 10ポイント ' + JSON.stringify(c));
    await closeTop(H); await H.idle();
    // 2. カードの まど
    await talk(H, 'ポイントカード'); await H.page.locator('.modal-wrap:not(.out) .cc-wrap').waitFor(); await H.wait(300);
    let R = await rows(H), L = await fits(H, 'card');
    const info = await H.eval(() => ({ pts: document.querySelector('.cc-pts b').textContent, label: document.querySelector('.cc-card').getAttribute('aria-label'), svg: !!document.querySelector('.cc-card svg'), title: [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop().querySelector('h2,.panel-title,.title')?.textContent || '' }));
    expect(info.pts === '10' && info.label === 'ローリソン ポイントカード' && info.svg, 'カードの まど ' + JSON.stringify(info));
    const row = (id) => R.find((r) => r.id === id);
    expect(R.map((r) => r.id).join() === 'crane,can,cup,plate,lv10,lv25,bath,bus,owner' && R.every((r) => r.off && !r.can) && row('owner').name === '？？？ ひみつの けいひん', 'けいひん 9だん（まだ こうかん できない・10000 は ひみつ）' + JSON.stringify(R));
    expect(!L.wide && !L.page && !L.small.length && L.edge, 'カードの まどが はみ出す・ボタンが ちいさい ' + JSON.stringify(L));
    await H.shot('card');
    await closeTop(H); await H.idle();
    // 3. 20000ポイントで こうかん
    await H.dbg('conbiniCard', 'lawson', { pts: 20000 });
    await talk(H, 'ポイントカード'); await H.page.locator('.modal-wrap:not(.out) .cc-wrap').waitFor(); await H.wait(200);
    R = await rows(H); expect(R.every((r) => r.can && !r.off), 'ぜんぶ こうかん できる ' + JSON.stringify(R));
    await trade(H, 'crane'); await say(H, /クレーン チケット/);
    c = await card(H); expect(c.pts === 19900 && c.tickets.crane === 1, 'クレーン チケット ' + JSON.stringify(c));
    await trade(H, 'lv10'); await say(H, /レベル \+10 けん/); await pick(H, 'つかう');
    await H.page.locator('.modal-wrap:not(.out) .cc-lv-btn').first().waitFor(); await H.wait(250);
    const lvL = await fits(H, 'lv'), lvN = await H.eval(() => document.querySelectorAll('.modal-wrap:not(.out) .cc-lv-btn').length);
    expect(lvN >= 13 && !lvL.wide && !lvL.page && !lvL.small.length && lvL.edge, 'おみせを えらぶ まど ' + JSON.stringify({ lvN, lvL }));
    await H.shot('lv-pick');
    await H.page.locator('.modal-wrap:not(.out) .cc-lv-btn[data-shop="crepe"]').click(); await pick(H, 'つかう'); await H.wait(400);
    let d = await H.dbg('saveData');
    expect(d.shops.crepe.lv === 11 && d.shopRewards.shop_crepe_5 && d.shopRewards.shop_crepe_10 && d.furn.shop_crepe_10 === 1 && (await card(H)).tickets.lv10 === 0, 'クレープやさん Lv.11・ごほうび ' + JSON.stringify(d.shops.crepe));
    await trade(H, 'lv25'); await say(H, /レベル \+25 けん/); await pick(H, 'あとで'); await H.wait(250);
    await trade(H, 'bus'); await say(H, /ていきけん/);
    c = await card(H); expect(c.tickets.lv25 === 1 && c.bus.free && /まで$/.test(c.bus.text) && c.pts === 20000 - 100 - 1000 - 2000 - 5000, 'レベル +25 けん・ていきけん ' + JSON.stringify(c));
    await trade(H, 'owner'); await say(H, /「コンビニ オーナー けん」/, false); await say(H, /オーナーで ございます。しなものは いつでも 10%びき/);
    c = await card(H); R = await rows(H);
    const label = await H.eval(() => document.querySelector('.cc-card').getAttribute('aria-label')), title = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop().querySelector('.panel-title').textContent);
    const own = R.find((r) => r.id === 'owner');
    expect(c.owner && c.pts === 1900 && label === 'ローリソン オーナー カード' && title === 'ローリソン オーナー カード' && own.name === 'コンビニ オーナー けん' && own.off && own.btn === 'オーナー', 'オーナーに なる ' + JSON.stringify({ c, R, label, title }));
    await H.shot('card-owner');
    await closeTop(H); await H.idle();
    // 4. オーナー: ていねいな あいさつ・10%びき
    const hello = await talk(H, 'かいものを する');
    expect(/おかえりなさいませ、オーナー！/.test(hello), 'ていねいな あいさつ ' + hello);
    await H.page.locator('.modal-wrap .grid .card').first().waitFor();
    const price = await H.eval(() => +[...document.querySelectorAll('.modal-wrap .grid .card')].find((e) => /からあげ$/.test(e.querySelector('.price').previousElementSibling.textContent)).querySelector('.price').textContent.replace(/[^0-9]/g, ''));
    expect(price === 54 && c.sample.price === 54, 'からあげは 54コイン（10%びき） ' + price);
    await H.shot('owner-shop');
    await H.page.locator('.modal-wrap .grid .card').filter({ hasText: 'からあげ' }).first().click();
    const note = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .note')?.textContent || '');
    expect(/10%びき（いつもは 60コイン）/.test(note), 'しなものの せつめいに 10%びき ' + note);
    const coins1 = (await H.dbg('saveData')).coins; await btn(H, 'かう'); await H.wait(400);
    c = await card(H); expect((await H.dbg('saveData')).coins === coins1 - 54 && c.carry === 94 && c.pts === 1900, 'オーナーで かう（54コイン・ポイントは はらった ぶん） ' + JSON.stringify(c));
    await closeTop(H); await H.idle();
    expect(!(await H.dbg('conbiniCard', 'sevenbun')).owner && !/オーナー/.test((await H.dbg('conbiniCard', 'sevenbun')).hello), 'せぶんぶんは まだ ふつう');
    await btn(H, 'おみせを でる'); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    // 5. すまほの もちもの
    await H.dbg('smaho', 'bag'); await H.wait(400);
    let keys = await H.eval(() => [...document.querySelectorAll('.key-item .nm')].map((e) => e.textContent));
    expect(['だいじな もの：ローリソン オーナー カード', 'だいじな もの：クレーン チケット ×1', 'だいじな もの：おてつだい レベル +25 けん ×1', 'だいじな もの：バスの ていきけん'].every((k) => keys.includes(k)), 'もちものの だいじな もの ' + JSON.stringify(keys));
    expect(await H.eval(() => document.documentElement.scrollWidth <= innerWidth), 'もちものが はみ出す');
    await H.shot('bag');
    await H.page.locator('.key-item .cc-use').first().click(); await H.page.locator('.modal-wrap:not(.out) .cc-lv-btn[data-shop="bakery"]').click(); await pick(H, 'つかう'); await H.wait(400);
    d = await H.dbg('saveData'); keys = await H.eval(() => [...document.querySelectorAll('.key-item .nm')].map((e) => e.textContent));
    expect(d.shops.bakery.lv === 26 && (await card(H)).tickets.lv25 === 0 && !keys.some((k) => /\+25/.test(k)), 'もちものから レベル +25 けん（パンやさん Lv.26） ' + JSON.stringify({ lv: d.shops.bakery.lv, keys }));
    await H.dbg('smaho', null); await H.idle();
    // 6. バス: ていきけんで ただ
    const s0 = await H.dbg('busStopAt', 'town'); await H.dbg('teleport', 'town', s0.front.x, s0.front.y, 'up'); await H.until(() => G.sceneName === 'world' && PokaDebug.idle(), 10000); await H.wait(300);
    const s = await H.dbg('busStopAt', 'town'); await H.tap(s.cx, s.cy); await H.page.locator('.modal-wrap .bus-picker').waitFor({ timeout: 8000 }); await H.wait(200);
    const lead = await H.eval(() => document.querySelector('.bus-lead').textContent);
    expect(/バスの ていきけんで ただ（\d{4}ねん \d{1,2}がつ \d{1,2}にち まで）/.test(lead), 'バスの まどに ていきけん ' + lead);
    const coins2 = (await H.dbg('saveData')).coins;
    await btn(H, '池袋 いけぶくろへ'); await H.until(() => PokaDebug.state().map === 'city' && PokaDebug.idle(), 20000);
    expect((await H.dbg('saveData')).coins >= coins2, 'ていきけんなのに コインが へる');
    // 7. クレーン: チケットで あそぶ
    expect(await H.dbg('arcadeOpen', 0), '台の まどが ひらかない');
    await H.page.locator('.dlg-shade.ask .choices .btn').first().waitFor();
    const choices = await H.eval(() => [...document.querySelectorAll('.dlg-shade.ask .choices .btn')].map((b) => b.textContent));
    expect(choices.join('|') === '100コインで あそぶ|チケットで あそぶ（のこり 1まい）|やめる', 'チケットで あそぶ ' + JSON.stringify(choices));
    await H.shot('crane-ticket');
    const coins3 = (await H.dbg('saveData')).coins;
    await pick(H, 'チケットで あそぶ（のこり 1まい）'); await H.until(() => PokaDebug.arcadeState() && !PokaDebug.state().transitioning, 15000);
    expect((await H.dbg('saveData')).coins === coins3 && (await card(H)).tickets.crane === 0 && (await H.dbg('saveData')).arcade.active?.ticket === true, 'チケットで はじめる（コインは へらない）');
    // 8. さいかい
    const before = await card(H);
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const back = await card(H);
    expect(['pts', 'carry', 'total', 'used', 'owner'].every((k) => back[k] === before[k]) && JSON.stringify(back.tickets) === JSON.stringify(before.tickets) && back.bus.until === before.bus.until, 'さいかいで かわる ' + JSON.stringify({ before, back }));
  }, { viewport, timeout: 180000 });
}
