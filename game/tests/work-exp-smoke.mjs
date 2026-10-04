// まいにちの いらい・おてつだいで けいけんち（js/work-exp.js・UI-44。オーナーの FB 2026-10-02「日々のクエストやバイトで、少しずつ経験値が増えてレベルがアップするようにして欲しい」）
// クレープやさんで ぜんぶ ◎ →「きょうの けっか」に 3人の けいけんちの ぼう（さいごの 子は あと 1 で つぎの レベル → あがる）→ はみ出さない
// → 3人 みんな ふえる・かずが あう → さいかい しても のこる
// （いらいの ほうこくは neri-quests、町の人の おねがいは folk-requests の スモークで たしかめる）
export async function workExpSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('work-exp-' + viewport.width, async H => {
    await H.newGameFast();
    const w0 = await H.dbg('workExp');
    expect(w0 && w0.kind === null && w0.levels.length === 3 && w0.levels.every((l) => l.lv >= 1 && l.lv < 50), 'PokaDebug.workExp が ない ' + JSON.stringify(w0));
    const last = w0.levels[2].id, near = await H.dbg('nearLevelUp', last, 1);
    expect(near && near.id === last && near.exp === near.need - 1, 'PokaDebug.nearLevelUp ' + JSON.stringify(near));
    let lay = null;
    H.atShopResult = async () => {
      lay = await H.eval(() => {
        const r = (e) => e.getBoundingClientRect(), box = document.querySelector('.modal-wrap .wexp-box'), grid = box && box.querySelector('.wexp');
        const cells = box ? [...box.querySelectorAll('.wexp-name, .wexp-lv, .wexp-bar, .wexp-n, .wexp-lvup')] : [], g = grid && r(grid);
        return { box: !!box, rows: box ? box.querySelectorAll('.wexp-row').length : 0, names: box ? [...box.querySelectorAll('.wexp-name')].map((x) => x.textContent) : [],
          inside: !!g && cells.every((c) => r(c).left >= g.left - 1 && r(c).right <= g.right + 1), over: !!grid && grid.scrollWidth > grid.clientWidth + 1,
          cut: cells.some((c) => c.scrollWidth > c.clientWidth + 1), page: document.documentElement.scrollWidth > innerWidth,
          bar: box ? [...box.querySelectorAll('.wexp-bar')].map((b) => Math.round(r(b).width)) : [], up: box ? [...box.querySelectorAll('.wexp-lvup')].map((x) => x.textContent) : [],
          foot: (() => { const b = document.querySelector('.modal-wrap .panel-foot .btn'); return !!b && r(b).top >= 0 && r(b).bottom <= innerHeight + 1; })(), // 「まちに もどる」が 画面の 中に 見える
          fav: box ? box.querySelectorAll('.wexp-fav').length : 0, favline: box?.querySelector('.wexp-favline')?.textContent || '' }; // とくいな おてつだい（UI-68）
      });
      await H.shot('result');
    };
    const ranks = await H.playShop('crepe', 1);
    H.atShopResult = null;
    expect(ranks.length >= 4 && ranks.every((r) => r === 3), '◎に ならない ' + ranks);
    expect(lay && lay.box && lay.rows === 3 && lay.inside && !lay.over && !lay.cut && !lay.page && lay.foot && lay.bar.every((w) => w >= 40), 'けいけんちの まどが ない・はみ出す ' + JSON.stringify(lay));
    expect(lay.up.length === 1 && new RegExp(`レベル${near.lv + 1}に あがった`).test(lay.up[0]), 'レベルアップが でない ' + JSON.stringify(lay));
    const w1 = await H.dbg('workExp');
    expect(w1.kind === 'shift' && w1.rows.length === 3 && w1.rows.every((r) => r.n > 0), 'おてつだいで けいけんちが ふえない ' + JSON.stringify(w1));
    // とくいな おてつだい（UI-68）: クレープやさんは がちゃんの とくい → がちゃん だけ 1.5ばい・まどに「とくい」
    const g0 = w0.levels.find((l) => l.id === 'gachan'), g1 = w1.rows.find((x) => x.id === 'gachan'), o1 = w1.rows.find((x) => x.id !== 'gachan' && x.id !== last), o0 = w0.levels.find((l) => l.id === o1.id);
    expect(w1.fav === 'gachan' && w1.shop === 'crepe' && w1.rows.filter((x) => x.fav).map((x) => x.id).join() === 'gachan', 'とくいな 子が ちがう ' + JSON.stringify(w1));
    const gb = Math.max(1, Math.round(g0.need * w1.rate));
    expect(g1.n === Math.max(gb + 1, Math.round(g0.need * w1.rate * 1.5)) && o1.n === Math.max(1, Math.round(o0.need * w1.rate)) && g1.n > o1.n, 'がちゃん だけ 1.5ばいに ならない ' + JSON.stringify([w1.rate, g0, g1, o0, o1]));
    expect(lay.fav === 1 && /の とくいな おてつだい！ けいけんち 1\.5ばい/.test(lay.favline), 'まどに とくいの しるしが ない ' + JSON.stringify(lay));
    const r = w1.rows.find((x) => x.id === last);
    expect(r.lv0 === near.lv && r.lv === near.lv + 1 && r.ups.length === 1, 'レベルが あがらない ' + JSON.stringify(r));
    for (const x of w1.rows) if (x.id !== last) { const l0 = w0.levels.find((l) => l.id === x.id); expect(x.lv === l0.lv && x.exp === l0.exp + x.n, 'けいけんちの かずが あわない ' + JSON.stringify([l0, x])); }
    // さいかい しても のこる
    await H.dbg('save'); await H.page.reload(); await H.page.getByRole('button', { name: 'つづきから', exact: true }).click(); await H.idle();
    const w2 = await H.dbg('workExp');
    expect(JSON.stringify(w2.levels) === JSON.stringify(w1.levels), 'セーブに のこらない ' + JSON.stringify([w1.levels, w2.levels]));
    // すまほの「ようす」に 3人の とくいな おてつだい（UI-68）
    await H.phone('ようす');
    const fs = await H.eval(() => ({ t: [...document.querySelectorAll('.fav-shops')].map((e) => e.textContent), over: document.documentElement.scrollWidth > innerWidth }));
    expect(fs.t.length === 3 && fs.t.every((t) => t.startsWith('とくいな おてつだい（けいけんち 1.5ばい）: ')) && fs.t.some((t) => t.includes('クレープやさん')) && !fs.over, 'ようすに とくいな おてつだいが ない ' + JSON.stringify(fs));
    await H.shot('status');
  }, { full: true, viewport, timeout: 180000 });
}
