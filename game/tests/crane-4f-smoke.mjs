// Meeときょれじゃ 4F の あたらしい しゅるいの クレーン 3台（UI-54。オーナーの FB 2026-10-02「4階を増設して、三つの新しいタイプのクレーンゲーム…を追加して」）:
// 1. 4F の きたの ひがしの かべに 3台（シールの ガチャの となり・まえに いける）・フロアマップに「クレーンゲーム」・しらべると あそびかた
// 2. たこやき: そうさばん → 5本の ツメで ピンポンだまを すくって てっぱんへ → あたりの くぼみに だま（PokaDebug.arcadeTako）→ つつから ミニマスコット → つぎは おみせの 人が だまを もどす
// 3. バーバーカット: ① ② の ボタン（44px いじょう）→ ①を おしつづけて みぎへ → ②の ばん → よこの カメラ → ひもの まえで ②を タップ → ちょきん → はこ（家具）
// 4. バウンドボール: ぬいぐるみの うしろを つかむ → ゴムボールの うえで はなす → おわる・さいかい しても のこる
export async function crane4fSmoke({ scenario, expect }) {
  const arrive = (H, n) => H.until((n) => { try { const v = PokaDebug.venueIso(), s = PokaDebug.venueState(); return v && v.ready && v.floor === n && s && !s.changingFloor && PokaDebug.idle(); } catch (e) { return false; } }, 30000, n);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('crane-4f-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 3000); await H.dbg('calendar', '2026-10-05'); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    await H.eval(() => { window.__toastLog = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toastLog.push(n.textContent); }).observe(document.body, { childList: true, subtree: true }); });
    const panel = () => H.eval(() => { const p = document.querySelector('.crane-panel').getBoundingClientRect(), bs = [...document.querySelectorAll('.crane-panel button')].filter((b) => b.offsetParent).map((b) => ({ t: b.textContent, r: b.getBoundingClientRect() })), st = document.querySelector('.crane-status'); return { p: [p.left, p.top, p.right, p.bottom], w: innerWidth, h: innerHeight, small: bs.filter((b) => b.r.width < 44 || b.r.height < 44).map((b) => b.t), names: bs.map((b) => b.t), over: st.scrollWidth > st.clientWidth + 1 || st.scrollHeight > st.clientHeight + 2, pad: !!document.querySelector('.crane-pad:not(.hidden)') }; });
    const okPanel = async (tag) => { const q = await panel(); expect(q.p[0] >= 0 && q.p[1] >= 64 && q.p[2] <= q.w + 0.5 && q.p[3] <= q.h + 0.5 && !q.small.length && !q.over && q.names.length >= 2, 'そうさばんが 不正 ' + tag + ' ' + JSON.stringify(q)); return q; };
    const done = async (tag, ms = 60000) => { await H.dbg('arcadeFast', 4); await H.until(() => { const r = PokaDebug.arcadeState(); return r && r.finished; }, ms); const r = await H.dbg('arcadeState'); expect(await H.page.getByRole('button', { name: 'おみせに もどる', exact: true }).isVisible() && await H.page.getByRole('button', { name: /もういちど/ }).isVisible(), 'けっかの ボタン ' + tag); return r; };
    const again = async () => { await H.page.getByRole('button', { name: /もういちど/ }).click(); await H.until(() => PokaDebug.arcadeState() && !PokaDebug.arcadeState().finished && !PokaDebug.state().transitioning, 15000); await H.wait(500); };
    const back = async () => { await H.page.getByRole('button', { name: 'おみせに もどる', exact: true }).click(); await H.idle(); await arrive(H, 4); };
    const count = async (pre) => { const f = (await H.dbg('saveData')).furn; return Object.keys(f).filter((k) => k.startsWith(pre)).reduce((a, k) => a + f[k], 0); };
    // 1. 4F: きたの ひがしの かべに 3台・フロアマップ
    await H.dbg('venue', 'arcade', 4); await H.idle(); await arrive(H, 4);
    let s = await H.dbg('venueState'); const cr = s.fixtures.filter((f) => f.action === 'crane');
    expect(cr.map((f) => f.machine).join() === '21,22,23' && cr.map((f) => f.label).join() === 'たこやき,バーバーカット,バウンドボール' && s.routeCount.every((r) => r.reachable), '4F の クレーン 3台 ' + JSON.stringify({ cr: cr.map((f) => [f.machine, f.label]), bad: s.routeCount.filter((r) => !r.reachable) }));
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(300);
    const spots = await H.eval(() => [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label));
    expect(['クレーンゲーム', 'シールの ガチャ', 'もりの ひろば'].every((l) => spots.includes(l)), '4F の フロアマップ ' + JSON.stringify(spots));
    await H.page.locator('.modal-wrap .close').last().click(); await H.idle();
    await H.dbg('venueWalk', 22, 3); await H.until(() => { const v = PokaDebug.venueIso(); return v.leader[0] === 22 && v.leader[1] === 3 && PokaDebug.idle(); }, 25000); await H.wait(700); await H.shot('arrive');
    // しらべると あそびかた（ことばは かな）→ 100コインで あそぶ
    expect(await H.dbg('venueVisit', 'たこやき'), 'たこやきの 台を しらべられない'); await H.page.locator('.dlg-shade.ask .dialog').waitFor();
    const ask = await H.eval(() => document.querySelector('.dlg-shade.ask .dlg-text').textContent);
    expect(/たこやき/.test(ask) && /ピンポンだま/.test(ask) && /あたり/.test(ask) && /きょうは ミニマスコット 3しゅ/.test(ask) && !/[一-鿿]/.test(ask), 'たこやきの あそびかた ' + ask);
    const c0 = (await H.dbg('saveData')).coins; await H.page.getByRole('button', { name: '100コインで あそぶ', exact: true }).click();
    await H.until(() => PokaDebug.arcadeState() && !PokaDebug.state().transitioning, 20000); await H.wait(600);
    // 2. たこやき: アームは やまの うえだけ・すくって てっぱんへ
    let a = await H.dbg('arcadeState'); await okPanel('tako');
    expect(a.type === 'tako' && a.phase === 'move' && a.coins === c0 - 100 && a.tako.balls === 46 && a.tako.lim[1] < 30 && /たまの やまを ねらって/.test(a.status), 'たこやきの はじめ ' + JSON.stringify(a));
    await H.shot('tako');
    await H.page.getByRole('button', { name: 'つかむ', exact: true }).click(); await H.wait(300);
    await H.dbg('arcadeFast', 3); await H.until(() => PokaDebug.arcadeState().phase === 'release', 30000); a = await H.dbg('arcadeState');
    expect(Math.abs(a.claw.x - 40) < 1 && Math.abs(a.claw.z - 21) < 1, 'てっぱんの うえで はなさない ' + JSON.stringify(a.claw));
    await H.wait(600); await H.shot('tako-drop');
    let r = await done('tako');
    // もういちど: あたりの くぼみに だまを おとす（PokaDebug）→ つつから ミニマスコット
    await again(); a = await H.dbg('arcadeState'); const mini0 = await count('ike_mini_');
    expect(await H.dbg('arcadeTako', a.tako.hits[0]), 'arcadeTako'); await H.until(() => PokaDebug.arcadeState().got > 0, 15000);
    await H.page.getByRole('button', { name: 'つかむ', exact: true }).click(); r = await done('tako-win');
    expect(r.got >= 1 && (await count('ike_mini_')) >= mini0 + 1 && /もらったよ/.test(await H.eval(() => document.querySelector('.crane-result-text').textContent)), 'あたりで ミニマスコットが もらえない ' + JSON.stringify([r.got, mini0]));
    await H.shot('tako-win');
    // つぎは おみせの 人が てっぱんの だまを やまへ もどす
    await again(); a = await H.dbg('arcadeState');
    expect(a.tako.staff === 'tako' && !/1/.test(a.tako.filled) && a.tako.onPlate === 0 && (await H.eval(() => window.__toastLog.some((t) => /ピンポンだまを やまに もどしたよ/.test(t)))), 'おみせの 人が だまを もどさない ' + JSON.stringify(a.tako));
    await H.page.getByRole('button', { name: 'つかむ', exact: true }).click(); await done('tako-3'); await back();
    // 3. バーバーカット: ① ② の ボタン
    expect(await H.dbg('arcadeStart', 22), 'バーバーカット'); await H.until(() => PokaDebug.arcadeState() && !PokaDebug.state().transitioning, 15000); await H.wait(500);
    let q = await okPanel('barber'); a = await H.dbg('arcadeState');
    expect(!q.pad && q.names.some((t) => /①/.test(t)) && q.names.some((t) => /②/.test(t)) && a.type === 'barber' && a.phase === 'right' && a.barber.strings.length === 3 && a.barber.strings.every((t) => /^cut_/.test(t.shape)), 'バーバーカットの はじめ ' + JSON.stringify({ q, a: a.barber }));
    await H.shot('barber');
    const b1 = await H.page.locator('.crane-cut').first().boundingBox(); await H.hold(b1.x + b1.width / 2, b1.y + b1.height / 2, 900); await H.wait(200);
    a = await H.dbg('arcadeState'); expect(a.phase === 'back' && a.barber.x > 12 && a.barber.used1, '①を おしつづけても みぎへ うごかない ' + JSON.stringify(a.barber));
    await H.page.getByRole('button', { name: 'カメラ', exact: true }).click(); await H.wait(300); expect((await H.dbg('arcadeState')).camera === 'side', 'よこの カメラ');
    expect(await H.dbg('arcadeBarber', 1, 0, -2), 'arcadeBarber'); await H.wait(300); await H.shot('barber-side');
    await H.page.getByRole('button', { name: 'まえから', exact: true }).click(); await H.wait(200);
    const hashi0 = await count('ike_hashi_');
    await H.page.locator('.crane-cut').nth(1).click(); await H.until(() => ['snip', 'fall', 'return', 'done'].includes(PokaDebug.arcadeState().phase), 8000);
    await H.until(() => PokaDebug.arcadeState().phase !== 'snip', 8000); a = await H.dbg('arcadeState');
    expect(a.barber.cut && a.barber.cut.cut === 1, 'ひもの まえで ちょきん しても きれない ' + JSON.stringify(a.barber)); await H.wait(250); await H.shot('barber-cut');
    r = await done('barber'); expect(r.got === 1 && (await count('ike_hashi_')) === hashi0 + 1, 'きれた はこが もらえない ' + JSON.stringify([r.got, hashi0]));
    await H.shot('barber-win');
    await back();
    // 4. バウンドボール: ぬいぐるみの うしろを つかむ → ゴムボールの うえで はなす
    expect(await H.dbg('arcadeStart', 23), 'バウンドボール'); await H.until(() => PokaDebug.arcadeState() && !PokaDebug.state().transitioning, 15000); await H.wait(500);
    await okPanel('bound'); a = await H.dbg('arcadeState'); expect(a.type === 'bound' && a.phase === 'move' && a.bodies >= 7, 'バウンドボールの はじめ ' + JSON.stringify(a)); await H.shot('bound');
    await H.dbg('arcadeAim', 1); await H.dbg('arcadeMove', 0, 3);
    await H.page.getByRole('button', { name: 'つかむ', exact: true }).click(); await H.wait(300); await H.dbg('arcadeFast', 3);
    await H.until(() => PokaDebug.arcadeState().phase === 'release', 30000); a = await H.dbg('arcadeState');
    expect(Math.abs(a.claw.x - a.bound.home[0]) < 1 && Math.abs(a.claw.z - a.bound.home[1]) < 1 && /まえに はねるかな/.test(a.status), 'ゴムボールの うえで はなさない ' + JSON.stringify([a.claw, a.bound]));
    await H.dbg('arcadeFast', 1); await H.wait(450); await H.shot('bound-release');
    r = await done('bound'); expect(r.finished, 'バウンドボールが おわらない');
    // さいかい しても 台の ようすが のこる（たこやきの やま・バーバーカットの ひも）
    const before = await H.eval(() => ({ b: Object.keys(PrizeArcade.norm().boards).filter((k) => +k >= 21).sort().join(), plays: Save.d.arcade.plays }));
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const after = await H.eval(() => ({ b: Object.keys(PrizeArcade.norm().boards).filter((k) => +k >= 21).sort().join(), plays: Save.d.arcade.plays }));
    expect(before.b === '21,22,23' && JSON.stringify(before) === JSON.stringify(after), 'さいかいで 台の ようすが きえる ' + JSON.stringify([before, after]));
  }, { viewport, timeout: 240000 });
}
