// きろく（js/play-records.js・UI-71。オーナーの FB 2026-10-03「実績をもっと細かくしてほしい。…」）
// ① おうちで ごはん（りんご・だいすきな ほねっこ・ごはんの あとの デザの おねだり → デザ）・なでなで（タップ）
//   → すまほの「ようす」→「きろく」タブ（3人の ひょう・みんなの きろく・はみ出さない）
// ② バトルを 1かい（たたかう）→ せんとうで たたかった・たおした まもの・みんなの きろくの バトル
// ③ ずかんの「たべもの」（タブは 44px・はみ出さない）: たべた かず・よく たべた じゅん → りんごの カード（3人べつ）
export async function playRecordsSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('play-records-' + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg('hour', 20); await H.dbg('weather', 'clear'); await H.dbg('wishGift', 'none'); await H.wait(500);
    const order = (await H.dbg('saveData')).order, lead = order[0];
    // ① ごはん
    const meal = 'onigiri', deza = await H.eval(() => FOODS.find((f) => f.deza && !f.spicy && !['apple', 'bone', 'onigiri'].includes(f.id)).id);
    for (const [id, n] of [['apple', 3], ['bone', 1], [meal, 1], [deza, 1]]) await H.dbg('give', id, n);
    for (const [who, food] of [['wanko', 'apple'], ['wanko', 'apple'], ['wanko', 'bone'], ['gachan', 'apple'], ['goji', meal], ['goji', deza]]) expect(await H.dbg('feed', who, food), `${who} に ${food} を たべさせられない`);
    // なでなで（がちゃんを タップ）
    await H.dbg('homeBubbleFixture'); await H.wait(300);
    const kid = await H.eval(() => { const c = G.scene.chars.find((k) => k.id === 'gachan'); return { x: c.x, y: c.y }; });
    const p = await H.dbg('homePoint', kid.x, kid.y - 26);
    await page.mouse.click(p.x, p.y); await H.wait(400);
    let r = await H.dbg('records');
    expect(r.kids.wanko.ate === 3 && r.kids.gachan.ate === 1 && r.kids.goji.ate === 2 && r.kids.wanko.fav === 1 && r.kids.goji.deza === 1 && r.kids.goji.dezaYes === 1 && r.kids.gachan.pat >= 1, 'ごはん・なでなでの きろくが ちがう ' + JSON.stringify(r.kids));
    expect(r.food.apple.wanko === 2 && r.food.apple.gachan === 1 && r.food.bone.wanko === 1, 'たべものごとの きろくが ちがう ' + JSON.stringify(r.food));
    // すまほの「ようす」→「きろく」
    await H.phone('ようす'); await H.wait(300);
    expect(await page.locator('.smaho-body .rec-tabs .tab').count() === 2 && await page.locator('.smaho-body .chara-card').count() === 3, 'ようすに タブと 3人の カードが ない');
    await page.locator('.smaho-body .rec-tabs .tab', { hasText: 'きろく' }).click(); await H.wait(300);
    let v = await H.eval(() => {
      const b = document.querySelector('.smaho-body'), t = b.querySelector('.rec-table'), rows = Object.fromEntries([...t.querySelectorAll('.rec-row')].map((tr) => [tr.dataset.key, [...tr.querySelectorAll('.rec-v')].map((td) => parseInt(td.textContent.replace(/,/g, ''), 10))]));
      return { rows, faces: t.querySelectorAll('.rec-who svg').length, team: [...b.querySelectorAll('.rec-team-row')].map((e) => e.textContent), over: b.scrollWidth > b.clientWidth + 2, wide: t.getBoundingClientRect().right > b.getBoundingClientRect().right + 1, since: b.querySelector('.rec-since')?.textContent || '' };
    });
    const col = (key, id) => v.rows[key][order.indexOf(id)];
    expect(v.faces === 3 && col('ate', 'wanko') === 3 && col('ate', 'goji') === 2 && col('fav', 'wanko') === 1 && col('deza', 'goji') === 1 && col('dezaYes', 'goji') === 1 && col('pat', 'gachan') >= 1 && Object.keys(v.rows).length === 15, 'きろくの ひょうが ちがう ' + JSON.stringify(v.rows));
    expect(!v.over && !v.wide && /から かぞえて いるよ/.test(v.since) && v.team.some((t) => /^ごはんを あげた6かい$/.test(t)), 'きろくの がめんが はみ出す・みんなの きろく ' + JSON.stringify(v));
    await H.shot('records');
    await page.locator('.smaho-close').click(); await H.wait(300); await H.idle();
    // ② バトル
    await H.dbg('battle', [{ kind: 'purun', lv: 1 }], 'meadow');
    await H.until(() => G.sceneName === 'battle' && !Game.trans, 15000);
    await H.fightToEnd();
    await H.until(() => G.sceneName !== 'battle' && !Game.trans, 20000); await H.dialogs();
    r = await H.dbg('records');
    const ko = Object.values(r.kids).reduce((a, k) => a + k.ko, 0), team = Object.fromEntries(r.team);
    expect(r.kids[lead].leadBattle === 1 && ko >= 1 && /^1かい（かち 1・まけ 0・にげた 0）$/.test(team['バトル']), 'バトルの きろくが ちがう ' + JSON.stringify({ kids: r.kids, team }));
    // ③ ずかんの「たべもの」
    await H.idle(20000);
    await H.phone('ずかん'); await H.wait(300);
    const tabs = await H.eval(() => { const r = (e) => e.getBoundingClientRect(), ts = [...document.querySelectorAll('.smaho-body .dex-kinds .tab')]; return { labels: ts.map((t) => t.textContent), small: ts.filter((t) => r(t).height < 43.5).length, wrap: ts.filter((t) => t.scrollWidth > t.clientWidth + 1).length }; });
    expect(tabs.labels.includes('たべもの') && tabs.small === 0 && tabs.wrap === 0, 'ずかんの タブが ちがう・はみ出す ' + JSON.stringify(tabs));
    await page.locator('.smaho-body .dex-kinds .tab', { hasText: 'たべもの' }).click(); await H.wait(300);
    v = await H.eval(() => { const b = document.querySelector('.smaho-body'), cards = [...b.querySelectorAll('.rec-food')]; return { note: b.querySelector('.note').textContent, first: cards.slice(0, 4).map((c) => c.dataset.id + ':' + c.querySelector('.rec-food-n').textContent), n: cards.length, lock: b.querySelectorAll('.rec-food.lock').length, over: b.scrollWidth > b.clientWidth + 2 }; });
    expect(/^たべた たべもの 4 \/ \d+しゅ・ぜんぶで 6かい$/.test(v.note) && v.first[0] === 'apple:3かい' && v.n - v.lock === 4 && !v.over, 'たべものの ずかんが ちがう ' + JSON.stringify(v));
    await H.shot('food-dex');
    await page.locator('.smaho-body .rec-food[data-id="apple"]').click();
    await page.locator('.modal-wrap:not(.out) .rec-food-card').waitFor({ timeout: 5000 }); await H.wait(300);
    // まどは ひらく とき したから すこし うごく（.panel の slideUp 0.22びょう）。うごきが おわってから はかる（おそい WebKit では 300ms で おわらない ことが ある）。
    // おわりは korokoro-records の fit と おなじ 3つで みる: getAnimations が running でない・まどの transform が none・まどの 位置が 2かい つづけて おなじ
    await H.eval(() => { window.__recFoodLast = null; });
    await H.until(() => { const m = document.querySelector('.modal-wrap:not(.out) .rec-food-panel'); if (!m) return false; const w = m.closest('.modal-wrap'), r = m.getBoundingClientRect(), k = [r.left, r.top, r.right, r.bottom].join(), same = window.__recFoodLast === k; window.__recFoodLast = k;
      return same && getComputedStyle(m).transform === 'none' && getComputedStyle(w).opacity === '1' && [w, m].every((e) => typeof e.getAnimations !== 'function' || e.getAnimations().every((a) => a.playState !== 'running')); }, 5000);
    v = await H.eval(() => { const m = document.querySelector('.modal-wrap:not(.out) .rec-food-panel'), r = m.getBoundingClientRect(); return { total: m.querySelector('.rec-food-total').textContent, kids: [...m.querySelectorAll('.rec-food-kid')].map((e) => e.textContent.replace(/\s+/g, '')), inside: r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 }; });
    expect(v.total === '3にんで 3かい たべたよ' && v.kids.some((k) => /わんこ2かい/.test(k)) && v.kids.some((k) => /がちゃん1かい/.test(k)) && v.kids.some((k) => /ごじ0かい/.test(k)) && v.inside, 'りんごの カードが ちがう ' + JSON.stringify(v));
    await H.shot('food-card');
    await page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300);
  }, { full: true, viewport, timeout: 200000 });
}
