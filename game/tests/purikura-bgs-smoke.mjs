// ぷりくらの 1まいずつの はいけい（js/purikura.js・UI-87。オーナーの 指示 2026-10-04「プリクラについて撮影ごとに背景を変えられるようにして」）
// 1. おでかけ ぷりくら → はいけいの まど: ぜんぶ・1〜4まいめ（はみ出さない・44px・1ぎょう）
// 2. ぜんぶ → おまつり（4まい おなじ）→ 2まいめ → うちゅう・4まいめ → おしろ（ほかの まいは そのまま・ボタンの ちいさい 絵・カメラの 絵も かわる）
// 3. とりはじめる → 1まいめ おまつり → とる → 2まいめは うちゅう →「はいけい」タブで すいぞくかんに → とる → 3・4まいめ
// 4. らくがき・できあがりの しゃしんに 1まいずつ → すまほの しゃしん → さいかい
export async function purikuraBgsSmoke({ scenario, expect }) {
  const fits = async (H, tag) => {
    const L = await H.eval(() => {
      const r = (e) => e.getBoundingClientRect(), P = document.querySelector('.puri-panel'), pr = r(P), v = PokaDebug.puriState().view, bs = [...P.querySelectorAll('button')].filter((b) => b.offsetParent);
      const lines = (b) => { const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), tops = new Set(); for (let t = w.nextNode(); t; t = w.nextNode()) { if (!t.textContent.trim()) continue; const g = document.createRange(); g.selectNodeContents(t); for (const x of g.getClientRects()) tops.add(Math.round(x.top)); } return tops.size; };
      const hint = P.querySelector('.puri-hint');
      return { small: bs.filter((b) => { const q = r(b); return q.height < 43.5 || q.width < 43.5; }).map((b) => b.textContent || b.getAttribute('aria-label')), out: bs.filter((b) => !b.closest('.puri-chips')).filter((b) => { const q = r(b); return q.left < pr.left - 0.5 || q.right > pr.right + 0.5; }).map((b) => b.textContent || b.getAttribute('aria-label')),
        wrap: [...bs.filter((b) => b.textContent && lines(b) > 1), ...(hint && lines(hint) > 1 ? [hint] : [])].map((b) => b.textContent), over: P.scrollWidth > P.clientWidth + 1, edge: pr.left >= 0 && pr.right <= innerWidth && pr.bottom <= innerHeight + 0.5, view: v && v.x >= 0 && v.x + v.w <= innerWidth && v.y >= 40 && v.y + v.h <= pr.top + 1 };
    });
    expect(!L.small.length && !L.out.length && !L.wrap.length && !L.over && L.edge && L.view, tag + 'の そうさばんが はみ出す／ちいさい／2ぎょう／しゃしんに かさなる ' + JSON.stringify(L));
  };
  const btn = (H, name) => H.page.getByRole('button', { name, exact: true }).click();
  // カメラの がめんの うえの ほう（はいけいが みえる ところ）の いろの まとめ
  const pix = (H) => H.eval(() => { const cv = document.querySelector('canvas'), v = PokaDebug.puriState().view, k = cv.width / innerWidth, d = cv.getContext('2d').getImageData(Math.round(v.x * k), Math.round((v.y + v.h * 0.04) * k), Math.round(v.w * k), Math.round(v.h * 0.2 * k)).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 7) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; });
  const slots = (H) => H.eval(() => [...document.querySelectorAll('.puri-slots .puri-chip')].map((b) => ({ t: b.textContent, on: b.classList.contains('on'), img: b.querySelector('img')?.getAttribute('src') || null })));

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('purikura-bgs-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('coins', 900);
    await H.dbg('venue', 'arcade', 3); await H.idle(); await H.until(() => { try { return PokaDebug.venueIso() && PokaDebug.venueIso().ready; } catch (e) { return false; } }, 20000);
    expect(await H.dbg('venueVisit', 'おでかけ ぷりくら'), 'おでかけ ぷりくらの ブースが ない');
    await btn(H, '300コインで とる'); await H.until(() => !!PokaDebug.puriState() && !Game.trans, 20000); await H.wait(400);
    // 1. はいけいの まど
    let st = await H.dbg('puriState'), S = await slots(H);
    expect(st.phase === 'bg' && st.slot === 'all' && st.shotBgs.join() === 'yuenchi,yuenchi,yuenchi,yuenchi' && st.bg === 'yuenchi', 'はじめは 4まい ゆうえんち ' + JSON.stringify(st.shotBgs));
    expect(S.map((s) => s.t).join() === 'ぜんぶ,1まいめ,2まいめ,3まいめ,4まいめ' && S[0].on && !S[0].img && S.slice(1).every((s) => s.img && !s.on), 'ぜんぶ・1〜4まいめの ボタン ' + JSON.stringify(S.map((s) => [s.t, s.on, !!s.img])));
    await fits(H, 'はいけい');
    // 2. ぜんぶ → おまつり・2まいめ → うちゅう・4まいめ → おしろ
    await btn(H, 'おまつり'); st = await H.dbg('puriState');
    expect(st.shotBgs.join() === 'matsuri,matsuri,matsuri,matsuri', 'ぜんぶ おなじに ならない ' + st.shotBgs.join());
    const h0 = await pix(H);
    await btn(H, '2まいめ'); await btn(H, 'うちゅう'); await H.wait(150);
    st = await H.dbg('puriState'); const h1 = await pix(H);
    expect(st.slot === 1 && st.shotBgs.join() === 'matsuri,uchu,matsuri,matsuri' && st.bg === 'uchu' && h1 !== h0, '2まいめ だけ かわらない・カメラの 絵が かわらない ' + JSON.stringify({ s: st.shotBgs, h0, h1 }));
    await btn(H, '4まいめ'); await btn(H, 'おしろ'); await H.wait(150);
    st = await H.dbg('puriState'); S = await slots(H);
    expect(st.slot === 3 && st.shotBgs.join() === 'matsuri,uchu,matsuri,oshiro' && S[4].on && S[1].img === S[3].img && S[1].img !== S[2].img && S[2].img !== S[4].img, '4まいめ だけ かわらない・ボタンの 絵 ' + JSON.stringify(st.shotBgs));
    expect(await H.eval(() => document.querySelector('.puri-hint').textContent) === '4まいめの はいけいを えらんでね' && await H.eval(() => document.querySelector('.puri-bg.on span')?.textContent) === 'おしろ', '4まいめの ひんと・えらんで いる はいけい');
    await fits(H, '4まいめ'); await H.shot('slots');
    // 3. さつえい: 1まいめ おまつり → 2まいめ うちゅう → タブで すいぞくかん
    await btn(H, 'とりはじめる'); await H.wait(300); await H.dbg('puriFast', 8);
    st = await H.dbg('puriState'); expect(st.phase === 'shoot' && st.bg === 'matsuri', '1まいめが おまつりで ない ' + JSON.stringify(st.bg));
    await fits(H, 'さつえい');
    await btn(H, 'とる！'); await H.until(() => PokaDebug.puriState().shots === 1, 8000); await H.wait(200);
    st = await H.dbg('puriState'); expect(st.bg === 'uchu' && st.shotSel[0].bg === 'matsuri', '2まいめが うちゅうで ない ' + JSON.stringify([st.bg, st.shotSel]));
    await btn(H, 'はいけい'); await H.wait(150);
    const chips = await H.eval(() => [...document.querySelectorAll('.puri-chips .bgchip')].map((b) => ({ t: b.textContent, on: b.classList.contains('on'), img: !!b.querySelector('img') })));
    expect(chips.map((c) => c.t).join() === 'ゆうえんち,おまつり,カフェ,すいぞくかん,うちゅう,おしろ' && chips.every((c) => c.img) && chips.filter((c) => c.on).map((c) => c.t).join() === 'うちゅう', '「はいけい」の チップ ' + JSON.stringify(chips));
    await fits(H, 'はいけいの タブ');
    const h2 = await pix(H);
    await btn(H, 'すいぞくかん'); await H.wait(150);
    st = await H.dbg('puriState'); const h3 = await pix(H);
    expect(st.bg === 'suizoku' && st.shotBgs.join() === 'matsuri,suizoku,matsuri,oshiro' && st.shotSel[0].bg === 'matsuri' && h3 !== h2, 'とちゅうで つぎの まいの はいけいが かわらない ' + JSON.stringify({ s: st.shotBgs, h2, h3 }));
    await H.shot('shoot-bg');
    for (let n = 2; n <= 4; n++) { await btn(H, 'とる！'); await H.until((n) => PokaDebug.puriState().shots >= n || PokaDebug.puriState().phase === 'deco', 8000, n); }
    await H.until(() => PokaDebug.puriState().phase === 'deco', 8000); await H.wait(600);
    st = await H.dbg('puriState');
    expect(st.shots === 4 && st.shotSel.map((s) => s.bg).join() === 'matsuri,suizoku,matsuri,oshiro' && st.bg === 'matsuri', '4まいの はいけい ' + JSON.stringify(st.shotSel.map((s) => s.bg)));
    // 4. らくがき（2まいめ）→ できあがり → しゃしんに 1まいずつ
    await btn(H, '2まいめ'); await H.wait(200); st = await H.dbg('puriState'); expect(st.di === 1 && st.bg === 'suizoku', 'らくがきの 2まいめ');
    await H.shot('deco');
    await btn(H, 'できあがり'); await H.wait(300); await H.dialogs();
    let ph = await H.dbg('photos');
    expect(ph.length === 4 && ph.map((p) => p.bg).join() === 'matsuri,suizoku,matsuri,oshiro', 'しゃしんの はいけい ' + JSON.stringify(ph.map((p) => p.bg)));
    await H.shot('done');
    await btn(H, 'すまほで みる'); await H.page.locator('.smaho .puri-album .puri-photo').first().waitFor(); await H.wait(400);
    expect(await H.page.locator('.smaho .puri-album .puri-photo').count() === 4, 'すまほの しゃしん 4まい');
    await H.page.keyboard.press('Escape'); await H.wait(300);
    // さいかいしても のこる
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const ph2 = await H.dbg('photos'); expect(JSON.stringify(ph2.map((p) => p.bg)) === JSON.stringify(ph.map((p) => p.bg)), 'さいかいで はいけいが かわる');
  }, { viewport, timeout: 180000 });
}
