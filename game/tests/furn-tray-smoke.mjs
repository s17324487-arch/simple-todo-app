// もようがえの 一覧を ひろげる・さがす（UI-37・js/furn-tray.js）。オーナーの FB 2026-10-01「模様替えの時にもっている家具が増えると、探しにくい。
// スライド操作で家具一覧の画面の面積を増やせるなど工夫してほしい」:
// かぐを ぜんぶ もつ → もようがえ（ちいさい 1れつ・あたらしい じゅん）→ つまみを うえに スライド（はんぶん・4れつ・しゅるいの ボタン）
// → あかり・ラグ・かべ の しゅるい → なまえで さがす（ひらがなで カタカナも）→ ならびかえ → ▲▼ → ほぼ ぜんぶ → カードを えらぶと へやに おいて ちいさく もどる
// → ちいさい ときに カードの ならびを たてに スライドしても ひろがる（カードは おかない）→ したに スライドで もどる → かべがみの タブも ひろがる
export async function furnTraySmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('furn-tray-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('unlockAll');
    await H.houseButton('もようがえ');
    await H.page.locator('.edit-bar .tray .card').first().waitFor({ timeout: 8000 }); await H.wait(300);
    const tray = () => H.dbg('furnTray');
    const box = (sel) => H.eval((sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; }, sel);
    // ちいさい: 1れつ・ぜんぶ ならぶ・あたらしい じゅん（さいごに てに いれた かぐが さき）
    let t = await tray();
    const newest = await H.eval(() => { const k = Object.keys(Save.d.furn).filter((id) => FURN_INDEX[id] && Room.available(id) > 0); return FURN_INDEX[k[k.length - 1]].name; });
    expect(t.size === 's' && !t.tall && t.rows === 1 && t.cards === t.total && t.total > 200 && t.names[0] === newest && !t.chips.length, 'ちいさい いちらん（1れつ・あたらしい じゅん） ' + JSON.stringify({ ...t, names: t.names.slice(0, 3), newest }));
    const size = await box('.edit-bar .ft-size');
    expect(size && size.w >= 44 && size.h >= 40 && await H.page.locator('.edit-bar .btn.yellow').count() === 1, 'ひろげる ボタン（44px・おわる は 1つ） ' + JSON.stringify(size));
    await H.shot('small');
    // つまみを うえに スライド → はんぶん（4れつ・しゅるいの ボタン・さがす）
    let bar = await box('.edit-bar');
    const half = viewport.height * 0.55;
    await H.drag(bar.x + bar.w / 2, bar.y + 7, bar.x + bar.w / 2, bar.y + 7 - (half - bar.h), 360); await H.wait(400);
    t = await tray(); bar = await box('.edit-bar');
    const perRow = await H.eval(() => { const cs = [...document.querySelectorAll('.edit-bar .tray .card')], top = Math.round(cs[0].getBoundingClientRect().top); return cs.filter((c) => Math.round(c.getBoundingClientRect().top) === top).length; });
    expect(t.size === 'm' && t.tall && Math.abs(t.height - half) < 30 && perRow >= 4 && t.rows > 10 && t.scroll.w <= t.scroll.vw + 1 && t.scroll.h > t.scroll.view, 'スライドで はんぶんに ひろがる（4れつ・たてに うごかせる） ' + JSON.stringify({ size: t.size, h: t.height, half, perRow, rows: t.rows, scroll: t.scroll }));
    const C = Object.fromEntries(t.chips.map((c) => [c.cat, c]));
    expect(C.all && C.all.n === t.total && C.all.on && C.light && C.rug && C.wall && C.sit && C.table && C.toy && C.special, 'しゅるいの ボタン ' + JSON.stringify(t.chips));
    const ui = await H.eval(() => { const b = (s) => [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect()); const all = [...b('.ft-chip'), ...b('.ft-q'), ...b('.ft-sort'), ...b('.edit-bar .row .tab'), ...b('.edit-bar .row .btn')];
      return { small: all.filter((r) => r.width > 0 && r.height < 40).length, out: all.filter((r) => r.width > 0 && r.top < 0).length, page: document.documentElement.scrollWidth > innerWidth, head: b('.edit-bar .row .tab').every((r) => r.right <= innerWidth) }; });
    expect(!ui.small && !ui.out && !ui.page && ui.head, 'ボタンが 40px いじょう・はみ出さない ' + JSON.stringify(ui));
    await H.shot('half');
    // しゅるい: あかり → ぜんぶ あかり の なかま
    const pick = async (label) => { await H.page.locator('.ft-chip', { hasText: label }).first().click(); await H.wait(250); return tray(); };
    const inCat = (cat) => H.eval((cat) => [...document.querySelectorAll('.edit-bar .tray .card .nm')].every((n) => { const f = FURNITURE.find((x) => x.name === n.textContent); return f && FurnTray.cats(f).has(cat); }), cat);
    t = await pick('あかり');
    expect(t.cat === 'light' && t.cards === C.light.n && t.cards >= 3 && await inCat('light') && t.names.some((n) => /ランプ|ライト|あかり/.test(n)), 'あかりの かぐ だけ ' + JSON.stringify(t.names));
    await H.shot('light');
    t = await pick('ラグ');
    expect(t.cat === 'rug' && t.cards === C.rug.n && await H.eval(() => [...document.querySelectorAll('.edit-bar .tray .card .nm')].every((n) => FURNITURE.find((x) => x.name === n.textContent)?.kind === 'rug')), 'ラグ だけ ' + JSON.stringify(t.names));
    t = await pick('かべ');
    expect(t.cat === 'wall' && t.cards === C.wall.n && await H.eval(() => [...document.querySelectorAll('.edit-bar .tray .card .nm')].every((n) => FURNITURE.find((x) => x.name === n.textContent)?.kind === 'wall')), 'かべの かぐ だけ ' + JSON.stringify(t.names));
    // なまえで さがす（ひらがなで カタカナも みつかる・みつからない ときの ことば）
    await pick('ぜんぶ');
    await H.page.fill('.ft-q', 'そふぁ'); await H.wait(250); t = await tray();
    expect(t.cards >= 3 && t.names.slice(0, t.cards).every((n) => /ソファ/.test(n)) && t.names.includes('ふかふかソファ') && t.names.includes('くもいろ ソファ'), 'なまえで さがす（そふぁ → ソファ） ' + JSON.stringify(t.names));
    await H.shot('search');
    await H.page.fill('.ft-q', 'ぞうさんの ろけっと'); await H.wait(250); t = await tray();
    expect(t.cards === 0 && /みつからない/.test(await H.eval(() => document.querySelector('.ft-none')?.textContent || '')), 'みつからない ときの ことば');
    await H.page.fill('.ft-q', ''); await H.wait(200);
    // ならびかえ: なまえ じゅん・いごこち じゅん
    await H.page.selectOption('.ft-sort', 'name'); await H.wait(250); t = await tray();
    const sorted = await H.eval((names) => { const c = new Intl.Collator('ja'); return names.every((n, i) => !i || c.compare(names[i - 1], n) <= 0); }, t.names);
    expect(t.sort === 'name' && sorted, 'なまえ じゅん ' + JSON.stringify(t.names));
    await H.page.selectOption('.ft-sort', 'comfort'); await H.wait(250);
    const comfy = await H.eval(() => { const v = [...document.querySelectorAll('.edit-bar .tray .card .nm')].slice(0, 30).map((n) => FURNITURE.find((x) => x.name === n.textContent)?.comfort || 0); return v.every((x, i) => !i || v[i - 1] >= x); });
    expect(comfy, 'いごこち じゅん');
    await H.page.selectOption('.ft-sort', 'new'); await H.wait(200);
    // ▼ → ちいさい・▲ → ほぼ ぜんぶ
    await H.page.locator('.edit-bar .ft-size').click(); await H.wait(300); t = await tray();
    expect(t.size === 's' && !t.tall && t.rows === 1, '▼ で ちいさく ' + JSON.stringify(t.size));
    await H.page.locator('.edit-bar .ft-size').click(); await H.wait(300); t = await tray(); bar = await box('.edit-bar');
    expect(t.size === 'l' && t.tall && bar.y >= 56 && bar.y <= 80 && bar.y + bar.h <= viewport.height + 1, '▲ で ほぼ ぜんぶ ' + JSON.stringify({ size: t.size, bar }));
    await H.shot('full');
    // ひろげた まま えらぶ → へやに おいて ちいさく もどる（おいた かぐが えらばれて いる）
    const n0 = await H.eval(() => Save.d.room.items.length), name = t.names[1];
    await H.page.locator('.edit-bar .tray .card').nth(1).click(); await H.wait(500);
    t = await tray(); let d = await H.dbg('homeDesign');
    const placed = d.items.find((it) => it.uid === d.selected);
    expect(d.items.length === n0 + 1 && t.size === 's' && !t.tall && placed && (await H.eval((id) => FURN_INDEX[id].name, placed.id)) === name, 'えらぶと おいて ちいさく もどる ' + JSON.stringify({ n0, n1: d.items.length, size: t.size, name, placed }));
    await H.shot('placed');
    // ちいさい ときに カードの ならびを たてに スライド → ひろがる（カードは おかない）
    const c0 = await box('.edit-bar .tray .card');
    await H.drag(c0.x + c0.w / 2, c0.y + c0.h / 2, c0.x + c0.w / 2 + 4, c0.y + c0.h / 2 - (half - 200), 360); await H.wait(400);
    t = await tray(); d = await H.dbg('homeDesign');
    expect(t.size === 'm' && d.items.length === n0 + 1, 'カードの ならびを たてに スライドしても ひろがる（おかない） ' + JSON.stringify({ size: t.size, items: d.items.length }));
    // したに スライド → ちいさい
    bar = await box('.edit-bar');
    await H.drag(bar.x + bar.w / 2, bar.y + 7, bar.x + bar.w / 2, bar.y + 7 + (bar.h - 150), 300); await H.wait(400);
    t = await tray();
    expect(t.size === 's' && !t.tall, 'したに スライドで ちいさく もどる ' + JSON.stringify(t.size));
    // かべがみの タブも ひろげられる（しゅるいの ボタンは かぐ だけ）
    await H.page.locator('.edit-bar .tab', { hasText: 'かべがみ' }).click(); await H.wait(300);
    await H.page.locator('.edit-bar .ft-size').click(); await H.wait(300); t = await tray();
    expect(t.size === 'l' && t.tall && t.cards >= 5 && !t.chips.length, 'かべがみも ひろがる ' + JSON.stringify({ size: t.size, cards: t.cards, chips: t.chips.length }));
    await H.page.locator('.edit-bar .ft-size').click(); await H.wait(200);
    await H.page.locator('.edit-bar').getByRole('button', { name: 'おわる', exact: true }).click(); await H.wait(300);
    expect(!(await H.dbg('furnTray')) && !(await H.eval(() => document.querySelector('.edit-bar'))), 'おわると いちらんが きえる');
  }, { viewport, timeout: 150000 });
}
