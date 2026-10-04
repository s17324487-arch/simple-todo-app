// UI-42: きょうりゅう はくぶつかんを 斜め上の 3かいだての 館に（js/dino-museum.js・js/dino-hall-art.js。オーナーの FB 2026-10-02「博物館のつくりを、水族館レベルにクオリティアップしてくれ。内部の構造も実際の博物館を参考に」）:
// 池袋の 入口 → 3F いりぐち → ふきぬけ（フタバスズキリュウ）→ ながい エスカレーターで 1F の ドーム（ほねの 台 10・うごく ティラノ）→ 2F（いのちの れきし・けんきゅうしつ・キッズ ひろば）
// → かいだんで 3F → カフェで たべる → フロアマップで 1F の にほんの コーナーへ → 3F の でぐち → 町の 入口の まえ。まえの 館（MAP_DEFS.museum）に いく セーブは 池袋の 入口の まえから
export async function dinoMuseumSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('dino-museum-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    for (const k of ['trex.skull', 'compso.head', 'compso.body']) await H.dbg('museumGive', 'bone', k);
    const arrive = async (fl) => { await H.until((f) => { const s = PokaDebug.venueState(); return s?.id === 'museum' && s.floor === f && !s.changingFloor && PokaDebug.venueIso()?.ready && PokaDebug.idle(); }, 30000, fl); await H.wait(900); return (await H.dbg('venueIso')).leader.join(); };
    const spawnOf = async (label) => { const f = (await H.dbg('venueState')).fixtures.find((f) => f.label === label); expect(f && f.spawn, label + ' が ない'); return f.spawn.join(); };
    const fits = async (tag) => {
      const v = await H.eval(() => { const out = [...document.querySelectorAll('.museum-intro, .hud .pill, .venue-top .btn, .modal-wrap:not(.out) .panel, .dialog')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.left < -0.5 || b.right > innerWidth + 0.5); }).map((e) => e.className); return { out, wide: document.documentElement.scrollWidth > innerWidth }; });
      expect(!v.out.length && !v.wide, tag + ' が はみだす ' + JSON.stringify(v));
    };
    const rooms = async () => (await H.dbg('museumState')).rooms;
    // 1. 池袋の 入口 → 3F いりぐち（3人・案内・BGM・HUD）
    const mu = await H.eval(() => { const b = MAP_DEFS.city.buildings.find((b) => b.id === 'city_museum'); return { door: [b.x + b.door, b.y + b.h - 1], label: b.label, act: b.act, front: MUSEUM_DATA.buildings.museum.outside.front }; });
    expect(mu.act.type === 'indoor' && mu.act.map === 'museum' && mu.label === 'きょうりゅう はくぶつかん' && mu.front.join() === [mu.door[0], mu.door[1] + 1].join(), '池袋に はくぶつかんが ない ' + JSON.stringify(mu));
    await H.dbg('teleport', 'city', mu.front[0], mu.front[1], 'up'); await H.until(() => G.sceneName === 'world' && G.scene.mapId === 'city' && PokaDebug.idle(), 10000);
    expect(await H.dbg('walkTo', mu.door[0], mu.door[1]), 'はくぶつかんの 入口へ 歩けない');
    expect(await arrive(3) === '23,19', '3F の いりぐちに たたない');
    let v = await H.eval(() => ({ bgm: Sound.cur?.name || Sound.want, hud: document.querySelector('.hud').innerText, intro: document.querySelector('.museum-intro')?.innerText || '', party: PokaDebug.venueState().party.length, top: [...document.querySelectorAll('.venue-top .btn')].map((b) => [b.textContent, Math.round(b.getBoundingClientRect().height)]) }));
    expect(v.bgm === 'museum' && /きょうりゅう はくぶつかん 3F/.test(v.hud) && /いりぐち/.test(v.intro) && v.party === 3 && v.top.map((t) => t[0]).join() === 'フロア案内,たてものを でる', '3F の いりぐちが 不正 ' + JSON.stringify(v));
    await fits('3F いりぐち'); await H.shot('lobby');
    // 2. ふきぬけ: つりさげの フタバスズキリュウ・あしあと
    await H.dbg('museumGo', 'museum', 'atrium'); expect(await arrive(3), 'ふきぬけへ いけない'); await H.wait(600);
    v = await H.dbg('dinoHall');
    expect(v && v.floor === 3 && v.zone === 'atrium' && (await rooms()).includes('museum.mu3_atrium') && (await H.dbg('venueState')).fixtures.some((f) => f.kind === 'futaba'), 'ふきぬけが 不正 ' + JSON.stringify(v));
    await H.shot('atrium');
    // 3. ながい エスカレーターで 1F の ドームへ（ついた マスは 1F の エスカレーターの した）
    let to = await spawnOf('1Fへ おりる');
    expect(await H.dbg('venueVisit', '1Fへ おりる'), '1F への エスカレーターが ない'); expect(await arrive(1) === to, '1F の ついた 場所');
    // ほねの 台: 10しゅ・寄贈の かず・絵が できて いる
    await H.dbg('museumGo', 'museum', 'hall'); await arrive(1);
    v = await H.dbg('dinoHall');
    const by = (id) => v.stands.find((s) => s.dino === id);
    expect(v.stands.length === 10 && v.stands.every((s) => s.drawn) && by('trex').have === 1 && by('trex').total === 8 && by('compso').have === 2 && by('compso').total === 2 && by('stego').have === 0, 'ほねの 台が 不正 ' + JSON.stringify(v.stands));
    expect((await rooms()).includes('museum.mu1_hall'), 'ドームの 案内が 出ない');
    await fits('1F ドーム'); await H.shot('hall');
    // うごく ティラノサウルス（ロボット）: ほえて うごく → 3人の ことば
    const roars = (await H.dbg('dinoHall')).robot.roars;
    expect(await H.dbg('venueVisit', 'うごく ティラノサウルス'), 'ロボットへ いけない');
    await H.page.locator('.dlg-text').waitFor({ timeout: 15000 }); await H.wait(200);
    v = await H.eval(() => ({ text: document.querySelector('.dlg-text').innerText, robot: PokaDebug.dinoHall().robot }));
    expect(/ガオー/.test(v.text) && v.robot.roars === roars + 1, 'ロボットが ほえない ' + JSON.stringify(v));
    await H.shot('robot'); await H.dialogs(); await H.idle();
    // ほねの 台を しらべる（ほんとうの タップ → となりまで あるいて ④ の くわしい ページ）
    let p = await H.dbg('venuePoint', 0, 0, 'ティラノサウルス'); expect(p && (await H.eval((q) => q.x > 0 && q.x < innerWidth && q.y > 0 && q.y < innerHeight, p)), 'ティラノの 台が 見えない ' + JSON.stringify(p)); await H.page.touchscreen.tap(p.x, p.y);
    await H.page.locator('.fossil-detail').waitFor({ timeout: 12000 }); await H.wait(300);
    expect(/1 \/ 8/.test(await H.eval(() => document.querySelector('.fossil-detail').innerText)), 'ティラノの 台の ほねの かず');
    await fits('ほねの 台の ページ'); await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300); await H.idle();
    // 4. 1F → 2F（エスカレーター）: いのちの れきし・けんきゅうしつの はかせ・キッズ ひろば
    to = await spawnOf('2Fへ のぼる');
    expect(await H.dbg('venueVisit', '2Fへ のぼる'), '2F への エスカレーターが ない'); expect(await arrive(2) === to, '2F の ついた 場所');
    await H.dbg('museumGo', 'museum', 'life'); await arrive(2); expect((await rooms()).includes('museum.mu2_life'), 'いのちの れきしの 案内が 出ない'); await H.shot('life');
    p = await H.dbg('venuePoint', 0, 0, 'アノマロカリス'); expect(p && (await H.eval((q) => q.x > 0 && q.x < innerWidth && q.y > 0 && q.y < innerHeight, p)), 'アノマロカリスの ケースが 見えない ' + JSON.stringify(p)); await H.page.touchscreen.tap(p.x, p.y);
    await H.page.locator('.ex-card.mu-card').waitFor({ timeout: 12000 }); await H.wait(300);
    v = await H.eval(() => { const e = document.querySelector('.ex-card.mu-card'); return { title: document.querySelector('.modal-wrap:not(.out) .panel-title').innerText, plate: e.querySelector('.plate').innerText, say: e.querySelector('.say').innerText, art: !!e.querySelector('.art svg') }; });
    expect(v.title === 'アノマロカリス' && v.plate === 'いのちの れきし' && /5おくねん/.test(v.say) && v.art, 'いのちの れきしの 説明が 不正 ' + JSON.stringify(v));
    await fits('説明の まど'); await H.shot('life-card');
    await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click(); await H.wait(300); await H.idle();
    await H.dbg('museumGo', 'museum', 'lab'); await arrive(2);
    expect((await rooms()).includes('museum.mu2_lab'), 'けんきゅうしつの 案内が 出ない'); await H.shot('lab');
    expect(await H.dbg('museumDonate'), 'はかせに 話しかけられない'); await H.page.locator('.dlg-text').waitFor({ timeout: 10000 }); await H.dialogs();
    expect((await H.awards()) === 1, 'コンプソグナトゥスの ひょうしょう（UI-69）が でない'); await H.idle();
    const mood0 = (await H.dbg('saveData')).chars.wanko.mood;
    expect(await H.dbg('venueVisit', 'かせきほり たいけん'), 'かせきほりへ いけない');
    await H.page.locator('.dlg-text').waitFor({ timeout: 15000 }); await H.dialogs(); await H.idle();
    const mood1 = (await H.dbg('saveData')).chars.wanko.mood; // ごきげんは じかんで すこしずつ へる ので すこし ゆとりを みる
    expect(mood1 >= Math.min(99, mood0 + 1.5), 'かせきほりで ごきげんに ならない ' + JSON.stringify([mood0, mood1]));
    await H.dbg('museumGo', 'museum', 'kids'); await arrive(2); await H.shot('kids');
    // 5. 2F → 3F（かいだん）→ カフェ ジュラで たべる（3にんぶん）
    to = await spawnOf('3Fへ のぼる');
    expect(await H.dbg('venueVisit', '3Fへ のぼる'), '3F への かいだんが ない'); expect(await arrive(3) === to, '3F の ついた 場所');
    const coins = (await H.dbg('saveData')).coins;
    expect(await H.dbg('venueVisit', 'カフェの テーブル'), 'カフェの テーブルへ いけない');
    await H.page.getByRole('button', { name: /^カレー/ }).waitFor({ timeout: 15000 }); await H.wait(200);
    v = await H.eval(() => [...document.querySelectorAll('.dialog .btn, .choices .btn, .ask .btn')].map((b) => { const r = b.getBoundingClientRect(); return [b.textContent, Math.round(r.height), r.left >= -0.5 && r.right <= innerWidth + 0.5]; }));
    expect(v.length === 5 && v.every((b) => b[1] >= 44 && b[2]), 'カフェの メニュー ' + JSON.stringify(v));
    await H.shot('cafe-menu');
    await H.page.getByRole('button', { name: /^カレー/ }).click(); await H.page.locator('.dlg-text').waitFor(); await H.dialogs(); await H.idle();
    const price = await H.eval(() => BAG_INDEX.curry.price);
    expect((await H.dbg('saveData')).coins === coins - price, 'カフェで コインが へらない');
    // 6. フロアマップ: 3つの 階・へやの いちらん → 1F の「にほん」を えらぶと エスカレーターで 1F へ いって あるく
    await H.page.getByRole('button', { name: 'フロア案内', exact: true }).click(); await H.page.locator('.mall-guide svg').waitFor(); await H.wait(300);
    v = await H.eval(() => ({ tabs: [...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map((b) => b.textContent).join(), spots: [...document.querySelectorAll('.mall-guide .mg-spot')].map((b) => b.dataset.label) }));
    expect(v.tabs === '1F,2F,3F' && ['いりぐち ホール', 'ふきぬけの ひろば', 'カフェ ジュラ', 'やすみどころ'].every((n) => v.spots.includes(n)), 'フロアマップ ' + JSON.stringify(v));
    await fits('フロアマップ'); await H.shot('guide');
    await H.page.getByRole('button', { name: '1F', exact: true }).click(); await H.wait(200);
    await H.page.locator('.mall-guide .mg-spot[data-label="にほん"]').click();
    await H.until(() => { const s = PokaDebug.venueState(), z = PokaDebug.dinoHall(); return s?.floor === 1 && !s.changingFloor && z?.zone === 'japan' && PokaDebug.idle(); }, 40000); await H.wait(900);
    expect((await rooms()).includes('museum.mu1_japan'), 'にほんの コーナーの 案内が 出ない'); await H.shot('japan');
    // 7. 3F の でぐち → 池袋の 入口の まえ
    await H.dbg('museumGo', 'museum'); expect(await arrive(3), '3F へ もどれない');
    expect(await H.dbg('venueVisit', 'たてものを でる'), 'でぐちが ない');
    await H.until(() => G.sceneName === 'world' && G.scene.mapId === 'city' && PokaDebug.idle(), 20000);
    v = await H.dbg('world'); expect(v.party[0].x === mu.front[0] && v.party[0].y === mu.front[1], 'でると 入口の まえに もどらない ' + JSON.stringify(v.party[0]));
    // 8. まえの 館（MAP_DEFS.museum）の 中の セーブ: 池袋の 入口の まえから。入った へやの きろくは のこる
    const seen = await rooms();
    await H.dbg('teleport', 'museum', 17, 32, 'up'); await H.until(() => G.sceneName === 'world' && PokaDebug.idle(), 10000);
    v = await H.dbg('world'); expect(v.map === 'city' && v.party[0].x === mu.front[0] && v.party[0].y === mu.front[1], 'まえの 館の 中に はいれる ' + JSON.stringify([v.map, v.party[0]]));
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    v = await H.dbg('world'); expect(v.map === 'city' && (await rooms()).join() === seen.join(), 'よみこむと きろくが きえる ' + JSON.stringify([v.map, seen]));
  }, { viewport, full: viewport.width === 375, timeout: 300000 });
}
