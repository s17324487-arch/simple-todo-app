// いちばんくじ（ネリカスタウンの コンビニ 2つ・js/ichiban-kuji.js・js/kuji-ui.js・UI-55。オーナーの FB 2026-10-03「一回1000円のクジ(一番くじ)…仕組みは、実際の一番くじと同じに」）
// 1. ローリソンに はいる → レジの みぎの たな（いちばんくじ）を タップ → ボード（A〜C・ラストワン・D〜I・はりつけ ひょう 80ます・のこり 80まい）。はみ出さない・ボタン 44px
// 2. 1まい ひく（1000コイン）→ はこから とる → くじけんを うえに スライドで めくる → Aしょう → てんいんさんに わたす → ビッグ ぬいぐるみ（家具）・はりつけ ひょう・はんけん
// 3. Dしょう: のこりから えらぶ（おにぎり クッション）
// 4. 10まい ひく（たしかめる まど・ぜんぶ めくる・えらぶ）
// 5. のこり 2まい（ほかの おきゃくさんが ひいた）→ のこり ぜんぶ ひく → ラストワンしょう・うりきれ
// 6. はんけんで ダブルチャンスに おうぼ → つぎの 日: あたり（タペストリー）・あたらしい ロット
// 7. Hしょうの クーポンで かいもの（コインは へらない）・Iしょうの シールが シールちょうに
// 8. おうちで ビッグ ぬいぐるみを タップ → ぎゅっ・3人が しゃべる
// 9. せぶんぶんの ボード（けいひんが ちがう）・さいかい しても のこる
export async function kujiSmoke({ scenario, expect }) {
  const fits = (H, tag) => H.eval((tag) => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
    const bs = pn ? [...pn.querySelectorAll('button')].filter((b) => b.offsetParent) : [];
    return { tag, wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
      edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5, text: pn ? pn.textContent : '' };
  }, tag);
  const phase = (H, p, ms = 10000) => H.until((p) => { const u = PokaDebug.kujiUi(); return u && u.open && u.phase === p; }, ms, p);
  const chooseAll = async (H) => { for (let i = 0; i < 40; i++) { const u = await H.dbg('kujiUi'); if (u.phase !== 'choose') return i; await H.page.locator('.kuji-choose .kuji-card').first().click(); await H.wait(80); } return 40; };
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + ' の 入口が ない');
    await H.dbg('teleport', 'town', door.x, door.y + 1, 'up'); await H.idle(); await H.dbg('walkTo', door.x, door.y);
    await H.until(() => PokaDebug.state().scene === 'store' && PokaDebug.idle(), 20000); await H.wait(400);
  };
  // くじの たなは レジの みぎの かべ（7,0・3ます。O10 から 斜め上の 館）。はいった ところからは 画面の みぎに かくれる ので、まえまで あるいて カメラを よせてから タップ
  const tapShelf = async (H, shop) => {
    if (await H.dbg('storeWalkTo', 8, 3)) await H.until(() => { const s = PokaDebug.storeState(); return s && !s.party[0].moving && !s.path; }, 15000);
    await H.wait(700);
    const st = await H.dbg('storeState'), fx = st.fixtures.find((f) => f.kind === 'kuji_' + shop);
    expect(st.shop === shop && fx && fx.label === 'いちばんくじ' && fx.x === 7 && fx.y === 0 && fx.w === 3, 'くじの たなが ない ' + JSON.stringify(st.fixtures.map((f) => f.kind)));
    await H.tap(fx.cx, fx.cy); await phase(H, 'board', 20000); await H.wait(300);
    return fx;
  };
  const board = (H) => H.eval(() => ({ text: (document.querySelector('.kuji-boardview') || {}).textContent || '', top: document.querySelectorAll('.kuji-top .kuji-card').length, rows: document.querySelectorAll('.kuji-row').length, cells: document.querySelectorAll('.kuji-cell').length, on: document.querySelectorAll('.kuji-cell.on').length, me: document.querySelectorAll('.kuji-cell.me').length, names: [...document.querySelectorAll('.kuji-top .kuji-name, .kuji-lasttext b')].map((e) => e.textContent), buttons: [...document.querySelectorAll('.kuji-actions .btn')].map((b) => ({ t: b.textContent, off: b.disabled })) }));
  const btn = (H, name) => H.page.getByRole('button', { name, exact: true }).click();
  // ボードを とじる（とじた まどは 0.18びょう かけて きえる。きえる まで canvas の タップが とどかない ので、まどが なくなる まで まつ）
  const closeBoard = async (H) => { await H.page.locator('.modal-wrap:not(.out) .close').last().click(); await H.until(() => !document.querySelector('.modal-wrap') && !PokaDebug.kujiUi().open && PokaDebug.idle(), 8000); };

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('kuji-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('kujiTheme', 'lawson', 'law'); await H.dbg('kujiTheme', 'sevenbun', 'sev'); await H.dbg('hour', 12); await H.dbg('weather', 'clear'); const c0 = await H.dbg('coins', 150000); await H.dbg('kujiFast', 4);
    const layout = await H.dbg('townLayout', 'town');
    // 1. ローリソン → たな → ボード
    await enterStore(H, layout, 'lawson'); await H.shot('lawson-store');
    await tapShelf(H, 'lawson');
    let B = await board(H), L = await fits(H, 'board');
    expect(B.top === 3 && B.rows === 6 && B.cells === 80 && B.on === 0 && /のこり 80まい（ぜんぶで 80まい）/.test(B.text) && /ラストワンしょう/.test(B.text) && /ダブルチャンス/.test(B.text) && B.names.some((n) => /てんいん ごじ/.test(n)) && B.buttons.map((b) => b.t).join('|') === '1まい ひく（1000コイン）|10まい ひく（10,000コイン）|のこり ぜんぶ ひく（80まい・80,000コイン）', 'ボード ' + JSON.stringify({ ...B, text: B.text.slice(0, 160) }));
    expect(!L.wide && !L.page && !L.small.length && L.edge, 'ボードが はみ出す・ボタンが ちいさい ' + JSON.stringify(L.small));
    await H.shot('lawson-board');
    // 2. 1まい（Aしょう）: はこ → くじけん → うえに スライドで めくる → わたす
    await H.dbg('kujiNext', 'A'); await btn(H, '1まい ひく（1000コイン）'); await phase(H, 'box'); await H.wait(200); await H.shot('box');
    await btn(H, 'くじを とる（1まい）'); await phase(H, 'tickets'); await H.wait(200);
    let u = await H.dbg('kujiUi'); expect(u.tickets.length === 1 && !u.tickets[0].open && (await H.dbg('kuji', 'lawson')).left === 79, 'くじけんが めくる まえ ' + JSON.stringify(u));
    expect(!/Aしょう/.test(await H.eval(() => document.querySelector('.kuji-ticket').getAttribute('aria-label'))), 'めくる まえに 賞が わかる');
    await H.shot('ticket');
    const t = await H.eval(() => { const r = document.querySelector('.kuji-ticket').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.75 }; });
    await H.page.mouse.move(t.x, t.y); await H.page.mouse.down(); await H.page.mouse.move(t.x, t.y - 44, { steps: 6 }); await H.page.mouse.up();
    await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(550); await H.shot('ticket-open');
    expect(/Aしょう/.test(await H.eval(() => document.querySelector('.kuji-ticket').getAttribute('aria-label'))), 'めくっても 賞が でない');
    await btn(H, 'てんいんさんに わたす'); await phase(H, 'result'); await H.wait(300);
    let k = await H.dbg('kuji', 'lawson'), d = await H.dbg('saveData');
    expect(k.left === 79 && k.got.includes('kj_law_a') && d.furn.kj_law_a === 1 && d.coins === c0 - 1000 && k.log.length === 1 && k.log[0][0] === 'A' && k.log[0][1] === 1 && k.stubs === 1 && (await H.dbg('kujiUi')).results.join() === 'kj_law_a', 'Aしょう ' + JSON.stringify({ left: k.left, got: k.got, coins: d.coins }));
    L = await fits(H, 'result'); expect(!L.wide && !L.page && !L.small.length && /Aしょう、でました/.test(L.text), 'けっかの がめん ' + JSON.stringify(L.small));
    await H.shot('result-a');
    await btn(H, 'ボードに もどる'); await phase(H, 'board');
    B = await board(H);
    expect(await H.eval(() => document.querySelector('.kuji-top .kuji-card[data-id="kj_law_a"]').classList.contains('gone')) && B.on === 1 && B.me === 1 && /のこり 79まい/.test(B.text), 'Aしょうが「でたよ」に ならない・はりつけ ひょう');
    // 3. Dしょう: えらぶ
    await H.dbg('kujiNext', 'D'); await btn(H, '1まい ひく（1000コイン）'); await phase(H, 'box'); await btn(H, 'くじを とる（1まい）'); await phase(H, 'tickets');
    await H.page.locator('.kuji-ticket').first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(500);
    await btn(H, 'てんいんさんに わたす'); await phase(H, 'choose'); await H.wait(200);
    const opts = await H.eval(() => [...document.querySelectorAll('.kuji-choose .kuji-card')].map((b) => b.dataset.id));
    L = await fits(H, 'choose'); expect(opts.join() === 'kj_law_d0,kj_law_d1,kj_law_d2' && !L.wide && !L.small.length && /すきな ものを えらんでね/.test(L.text), 'Dしょうを えらぶ ' + JSON.stringify(opts));
    await H.shot('choose');
    await H.page.locator('.kuji-choose .kuji-card[data-id="kj_law_d1"]').click(); await phase(H, 'result');
    k = await H.dbg('kuji', 'lawson'); d = await H.dbg('saveData');
    expect(d.furn.kj_law_d1 === 1 && k.byId.kj_law_d1 === 0 && !k.pending.length && k.left === 78, 'えらんだ クッションが もらえない ' + JSON.stringify(k.byId));
    await btn(H, 'ボードに もどる'); await phase(H, 'board');
    // 4. 10まい（たしかめる まど・ぜんぶ めくる・えらぶ）
    await btn(H, '10まい ひく（10,000コイン）'); await btn(H, 'ひく'); await phase(H, 'box'); await btn(H, 'くじを とる（10まい）'); await phase(H, 'tickets'); await H.wait(200);
    L = await fits(H, 'tickets'); expect(!L.wide && !L.page && !L.small.length, '10まいの くじけんが はみ出す ' + JSON.stringify(L.small)); await H.shot('tickets-10');
    await btn(H, 'ぜんぶ めくる'); await H.until(() => PokaDebug.kujiUi().tickets.every((x) => x.open), 5000); await H.wait(500); await H.shot('tickets-10-open');
    await btn(H, 'てんいんさんに わたす'); await chooseAll(H); await phase(H, 'result'); await H.wait(300);
    u = await H.dbg('kujiUi'); k = await H.dbg('kuji', 'lawson');
    expect(u.results.length === 10 && k.left === 68 && k.mine === 12 && k.stubs === 12 && !k.pending.length, '10まいの けっか ' + JSON.stringify({ n: u.results.length, left: k.left }));
    L = await fits(H, 'result-10'); expect(!L.wide && !L.page && !L.small.length, '10まいの けっかが はみ出す'); await H.shot('result-10');
    await btn(H, 'ボードに もどる'); await phase(H, 'board');
    // 5. のこり 2まい → のこり ぜんぶ → ラストワン
    expect((await H.dbg('kujiLeft', 'lawson', 2)) === 2, 'ほかの おきゃくさんで のこり 2まいに ならない');
    await closeBoard(H);
    await tapShelf(H, 'lawson'); B = await board(H);
    expect(/のこり 2まい/.test(B.text) && B.on === 78 && B.me === 12 && B.buttons.map((b) => b.t).join('|') === '1まい ひく（1000コイン）|のこり ぜんぶ ひく（2まい・2,000コイン）', 'のこり 2まいの ボード ' + JSON.stringify(B.buttons));
    await H.shot('board-2left');
    await btn(H, 'のこり ぜんぶ ひく（2まい・2,000コイン）'); await phase(H, 'box'); await btn(H, 'くじを とる（2まい）'); await phase(H, 'tickets');
    await btn(H, 'ぜんぶ めくる'); await H.until(() => PokaDebug.kujiUi().tickets.every((x) => x.open), 5000); await H.wait(400);
    expect((await H.dbg('kujiUi')).tickets[1].last, 'さいごの くじけんに ラストワンの しるし');
    await btn(H, 'てんいんさんに わたす'); await chooseAll(H); await phase(H, 'result'); await H.wait(400);
    u = await H.dbg('kujiUi'); k = await H.dbg('kuji', 'lawson'); d = await H.dbg('saveData');
    expect(u.results.includes('kj_law_l') && d.furn.kj_law_l === 1 && k.left === 0 && k.sold && await H.eval(() => !!document.querySelector('.kuji-lastone')), 'ラストワンしょう ' + JSON.stringify({ r: u.results, left: k.left }));
    await H.shot('lastone');
    await btn(H, 'ボードに もどる'); await phase(H, 'board'); B = await board(H);
    expect(/うりきれ！ あした あたらしい くじが はいるよ/.test(B.text) && B.buttons.every((b) => b.off), 'うりきれの ボード');
    // 6. ダブルチャンス: はんけん 14まいで おうぼ → つぎの 日に あたり・あたらしい ロット
    await btn(H, 'おうぼ する'); await H.wait(200);
    k = await H.dbg('kuji', 'lawson'); expect(k.stubs === 0 && k.dc && k.dc.n === 14, 'おうぼ できない ' + JSON.stringify(k.dc));
    await H.shot('dc-entry');
    await closeBoard(H);
    await H.dbg('kujiDc', true); await H.dbg('kujiDays', 'lawson', 1);
    await tapShelf(H, 'lawson'); B = await board(H); k = await H.dbg('kuji', 'lawson'); d = await H.dbg('saveData');
    expect(/ダブルチャンスの けっか: あたり！/.test(B.text) && d.furn.kj_law_dc === 1 && k.lot === 2 && k.left === 80 && k.dcLast && k.dcLast.win && !k.dc, 'ダブルチャンス・つぎの ロット ' + JSON.stringify({ lot: k.lot, left: k.left, dc: k.dcLast }));
    await H.shot('dc-win');
    // 7. Hしょうの クーポン・Iしょうの シール（1ロットめでも でて いる ので、ふえた かずで くらべる）
    const nCoupon = (k) => k.coupons.reduce((a, c) => a + c.n, 0), nSticker = (st) => Object.entries(st.have).filter(([id]) => id.startsWith('stk_kjlaw_')).reduce((a, [, n]) => a + n, 0);
    const cp0 = nCoupon(await H.dbg('kuji', 'lawson'));
    await H.dbg('kujiNext', 'H'); await btn(H, '1まい ひく（1000コイン）'); await phase(H, 'box'); await btn(H, 'くじを とる（1まい）'); await phase(H, 'tickets');
    await H.page.locator('.kuji-ticket').first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(400); await btn(H, 'てんいんさんに わたす'); await phase(H, 'result');
    k = await H.dbg('kuji', 'lawson'); expect(nCoupon(k) === cp0 + 1, 'Hしょうで クーポンが ふえない ' + JSON.stringify(k.coupons));
    await btn(H, 'ボードに もどる'); await phase(H, 'board');
    const sk0 = nSticker(await H.dbg('stickers'));
    await H.dbg('kujiNext', 'I'); await btn(H, '1まい ひく（1000コイン）'); await phase(H, 'box'); await btn(H, 'くじを とる（1まい）'); await phase(H, 'tickets');
    await H.page.locator('.kuji-ticket').first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(400); await btn(H, 'てんいんさんに わたす'); await phase(H, 'result');
    const stk = await H.dbg('stickers');
    expect(nSticker(stk) === sk0 + 4, 'Iしょうの シールが 4まい シールちょうに ふえない ' + JSON.stringify(stk.have));
    await btn(H, 'ボードに もどる'); await phase(H, 'board'); await H.shot('board-coupon');
    await closeBoard(H);
    // かいもので つかう: しなものが きまって いる クーポンを さきに（なければ「なんでも」で からあげ）
    const cp = k.coupons.find((c) => c.item) || k.coupons[0], item = cp.item || 'karaage', name = await H.eval((id) => BAG_INDEX[id].name, item);
    await btn(H, 'てんいんと はなす'); await btn(H, 'かいものを する'); await H.page.locator('.modal-wrap .grid .card').first().waitFor();
    // コンビニの まどは「ごはん」「おやつ」「のみもの」の タブ（js/conbini-goods.js）: その しなものの タブを ひらく
    const tab = (await H.dbg('conbini', 'lawson')).goods.find((g) => g.id === item).tab;
    await H.page.locator(`.modal-wrap .tab[data-k="${tab}"]`).click(); await H.wait(200);
    await H.page.locator('.modal-wrap .grid .card').filter({ hasText: name }).first().click(); await H.wait(250);
    const before = await H.dbg('saveData');
    const label = await H.eval(() => (document.querySelector('.coupon-use') || {}).textContent || '');
    expect(new RegExp(`むりょう けんで もらう（のこり ${cp.n}まい）`).test(label), 'かいものの まどに クーポンが でない ' + label);
    // かいものの まど（ShopUI.detail）の −／＋ は まえからの ボタン なので、クーポンの ボタンだけ 大きさを みる
    L = await fits(H, 'coupon'); const cb = await H.eval(() => { const r = document.querySelector('.coupon-use').getBoundingClientRect(); return { h: r.height, in: r.left >= 0 && r.right <= innerWidth + 0.5 }; });
    expect(!L.wide && !L.page && L.edge && cb.h >= 44 && cb.in, 'クーポンの まどが はみ出す・ボタンが ちいさい ' + JSON.stringify({ wide: L.wide, page: L.page, edge: L.edge, cb })); await H.shot('coupon');
    await H.page.locator('.coupon-use').click(); await H.wait(300);
    let saved = await H.dbg('persistedSave');
    expect(saved.coins === before.coins && (saved.bag[item] || 0) === (before.bag[item] || 0) + 1 && (saved.kuji.coupons[cp.id] || 0) === cp.n - 1 && saved.kuji.used === 1, 'クーポンで もらえない ' + JSON.stringify({ c: [before.coins, saved.coins], bag: saved.bag[item], left: saved.kuji.coupons[cp.id] }));
    await closeBoard(H);
    // 8. おうちで ビッグ ぬいぐるみ（さわると ぎゅっ）
    await btn(H, 'おみせを でる'); await H.until(() => PokaDebug.state().scene === 'world' && PokaDebug.idle(), 15000);
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000); await H.wait(300);
    await H.dbg('homeLayout', [{ id: 'kj_law_a', x: 300, y: 300 }, { id: 'kj_law_d1', x: 420, y: 300 }]); await H.dbg('homeBubbleFixture'); await H.wait(900);
    let lv = await H.dbg('furnLive', 'kj_law_a'); expect(lv && lv.tap, 'ビッグ ぬいぐるみを タップする ところが ない ' + JSON.stringify(lv));
    const n0 = lv.n || 0, talk0 = lv.talk;
    await H.tap(lv.tap.x, lv.tap.y); await H.wait(160); await H.shot('room-hug');
    await H.wait(500); lv = await H.dbg('furnLive', 'kj_law_a');
    expect((lv.n || 0) === n0 + 1 && lv.talk > talk0, 'ビッグ ぬいぐるみを タップしても うごかない ' + JSON.stringify(lv));
    // 9. せぶんぶん（けいひんが ちがう）・さいかい
    await enterStore(H, layout, 'sevenbun'); await tapShelf(H, 'sevenbun'); B = await board(H); L = await fits(H, 'sevenbun');
    expect(B.names.some((n) => /メロンパン わんこ/.test(n)) && !B.names.some((n) => /てんいん ごじ/.test(n)) && /のこり 80まい/.test(B.text) && !L.wide && !L.page && !L.small.length, 'せぶんぶんの ボード ' + JSON.stringify(B.names));
    await H.shot('sevenbun-board');
    await closeBoard(H);
    const k1 = await H.dbg('kuji', 'lawson'); await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const k2 = await H.dbg('kuji', 'lawson');
    expect(k2.lot === k1.lot && k2.left === k1.left && k2.got.join() === k1.got.join() && k2.draws === k1.draws && k2.spent === k1.spent, 'さいかいで くじの きろくが かわる ' + JSON.stringify([k1.left, k2.left]));
  }, { viewport, timeout: 240000 });
}
