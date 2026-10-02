// あたまの アクセサリーは 2つ まで（js/chara.js の HeadPair・UI-43。オーナーの FB 2026-10-02「頭につけるものとか2個くらい同時につけれるように。うさぎみみとリボンとか！」）:
// きがえ: あんない → うさみみ ＋ リボン（2つ とも 描く）→ むぎわらぼうし（みみと あわない → とりかえ・リボンは のこる）→ しろい リボン（2つ まで → 2つめを とりかえ）
// → ぼうしを はずすと 2つめが 1つめに → リボン 2つ（2つめは はんたいがわ）→ はみ出さない・ボタン 44px → なし → さいかい しても のこる
// → ようふくやさんで むぎわらぼうしを かって「きる！」（みみは とりかえ・リボンは のこる）
export async function headPairSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('head-pair-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('coins', 5000);
    for (const id of ['gacha_ears_1', 'strawhat', 'pearl_bow', 'ribbon_blue']) await H.dbg('wearSet', id, 1);
    const lead = (await H.dbg('saveData')).order[0];
    const nm = await H.eval(() => Object.fromEntries(['gacha_ears_1', 'ribbon_pink', 'strawhat', 'pearl_bow', 'ribbon_blue'].map((id) => [id, ITEM_INDEX[id].name])));
    const hp = () => H.dbg('headPair', lead);
    const card = (id) => H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: nm[id] }).first();
    const toasts = () => H.eval(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' '));
    const tapCard = async (id) => { await card(id).click(); await H.wait(260); };
    // 画面: はみ出さない・ボタンは 44px いじょう
    const fits = async (tag) => {
      const L = await H.eval(() => {
        const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(), body = pn && pn.querySelector('.panel-body');
        const cards = pn ? [...pn.querySelectorAll('.grid .card')].filter((c) => c.offsetParent) : [], note = pn && pn.querySelector('.head-pair-note');
        return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth,
          small: cards.filter((c) => r(c).height < 44 || r(c).width < 44).length, note: !!note && r(note).right <= r(body).right + 1 && r(note).left >= r(body).left - 1 };
      });
      expect(!L.wide && !L.page && !L.small && L.note, tag + ' が はみ出す ' + JSON.stringify(L));
    };
    // 1. きがえ: あたまの タブに あんない
    await H.houseButton('きがえ');
    await H.page.locator('.modal-wrap:not(.out) .head-pair-note').waitFor();
    const note = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .head-pair-note').textContent);
    expect(/あたまは 2つ まで つけられるよ/.test(note) && !/[一-鿿]/.test(note), 'あんない ' + note);
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'なし' }).first().click(); await H.wait(200);
    // 2. うさみみ ＋ リボン（オーナーの れい）
    await tapCard('gacha_ears_1'); await tapCard('ribbon_pink');
    let p = await hp();
    expect(p.head === 'gacha_ears_1' && p.head2 === 'ribbon_pink' && p.drawn.length === 2 && p.kinds.join() === 'band,pin', 'うさみみ と リボンを いっしょに つけられない ' + JSON.stringify(p));
    const on = await H.eval(() => [...document.querySelectorAll('.modal-wrap:not(.out) .grid .card.on')].map((c) => c.textContent));
    expect(on.length === 2 && on.some((t) => t.includes(nm.gacha_ears_1)) && on.some((t) => t.includes(nm.ribbon_pink)), 'カードの「つけて いる」が 2つ ない ' + JSON.stringify(on));
    await fits('うさみみ ＋ リボン'); await H.shot('bunny-ribbon');
    // 3. むぎわらぼうし: みみとは あわない → とりかえ（リボンは のこる）
    await tapCard('strawhat');
    p = await hp(); let t = await toasts();
    expect(p.head === 'strawhat' && p.head2 === 'ribbon_pink' && t.includes('いっしょに つけられないよ') && t.includes(nm.gacha_ears_1), 'ぼうしで みみを とりかえない ' + JSON.stringify([p, t]));
    // 4. しろい リボン: 2つ まで → 2つめを とりかえ
    await H.wait(1800); await tapCard('pearl_bow');
    p = await hp(); t = await toasts();
    expect(p.head === 'strawhat' && p.head2 === 'pearl_bow' && t.includes('あたまは 2つ まで'), '3つめで 2つめを とりかえない ' + JSON.stringify([p, t]));
    // 5. ぼうしを はずすと 2つめが 1つめに → リボン（みずいろ）で ピン 2つ（2つめは はんたいがわ）
    await tapCard('strawhat');
    p = await hp(); expect(p.head === 'pearl_bow' && p.head2 === null, 'はずすと 2つめが 1つめに ならない ' + JSON.stringify(p));
    await tapCard('ribbon_blue');
    p = await hp();
    expect(p.head === 'pearl_bow' && p.head2 === 'ribbon_blue' && p.drawn.length === 2 && p.drawn[1][1] === true, 'ピン 2つの 2つめが はんたいがわに ならない ' + JSON.stringify(p));
    const stage = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .dress-stage .who').innerHTML);
    expect(/scale\(-1,1\)/.test(stage), 'ステージの 絵に はんたいがわの ピンが ない');
    await fits('ピン 2つ'); await H.until(() => !document.querySelector('.toast'), 5000); await H.shot('two-pins'); // トーストが きえてから（ステージの 絵が 見える）
    // 6. なし → 2つ とも はずす
    await H.page.locator('.modal-wrap:not(.out) .grid .card').filter({ hasText: 'なし' }).first().click(); await H.wait(200);
    p = await hp(); expect(!p.head && !p.head2, 'なし で 2つ とも はずれない ' + JSON.stringify(p));
    // 7. うさみみ ＋ リボン に もどして とじる → さいかい しても のこる
    await tapCard('gacha_ears_1'); await tapCard('ribbon_pink');
    await H.page.click('.modal-wrap:not(.out) .close'); await H.until(() => !G.scene.mode, 8000);
    await H.dbg('save'); await H.page.reload();
    await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle(); await H.wait(300);
    p = await hp(); expect(p.head === 'gacha_ears_1' && p.head2 === 'ribbon_pink', 'さいかいで 2つめが きえた ' + JSON.stringify(p));
    // 8. ようふくやさん: むぎわらぼうしを かって「きる！」→ みみは とりかえ・リボンは のこる
    await H.dbg('store', 'clothes'); await H.idle();
    await H.page.getByRole('button', { name: 'てんいんと はなす', exact: true }).click();
    await H.page.getByRole('button', { name: 'かいものを する', exact: true }).click();
    const hat = H.page.locator('.modal-wrap:not(.out) .card').filter({ hasText: nm.strawhat }).first();
    await hat.waitFor(); await hat.click();
    const try1 = await H.eval(() => document.querySelector('.modal-wrap:not(.out) .dress-stage .who').innerHTML.length);
    expect(try1 > 0, 'ためしぎが ない');
    await H.page.getByRole('button', { name: 'かう', exact: true }).click();
    await H.page.getByRole('button', { name: 'きる！', exact: true }).click(); await H.wait(260);
    p = await hp();
    expect(p.head === 'strawhat' && p.head2 === 'ribbon_pink', 'おみせの「きる！」で リボンが きえた ' + JSON.stringify(p));
    await H.shot('shop-wear');
  }, { viewport, timeout: 120000 });
}
