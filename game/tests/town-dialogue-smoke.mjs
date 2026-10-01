// 町の会話とクイズの実操作。smoke.mjs の同じブラウザ・保存・スクリーンショット規約を使う。
export async function townDialogueSmoke({ scenario, expect }) {
  const screens = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
  const assets = ['coins', 'bag', 'furn', 'wardrobe', 'room', 'rooms', 'shops'];
  const assertKept = (before, after, keys = assets) => {
    for (const key of keys) expect(JSON.stringify(before[key]) === JSON.stringify(after[key]), '会話で既存データが変化: ' + key);
  };
  const reload = async H => {
    await H.page.reload();
    await H.page.getByRole('button', { name: 'つづきから', exact: true }).click();
    await H.idle(30000);
  };
  const legacyGame = async H => {
    await H.newGameFast();
    const legacy = await H.dbg('saveData');
    legacy.v = 1; legacy.gameVersion = '1.0.0'; legacy.coins = 987654;
    delete legacy.conversations; delete legacy.townQuiz;
    await H.dbg('seedLegacySave', legacy);
    await reload(H);
    assertKept(legacy, await H.dbg('saveData'));
    await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    return legacy;
  };
  // 文の表示完了ごとに話者と本文を採取し、通常の「つぎへ」で読む。
  // 相談への導線を探すときだけ、最後の任意ボタンの手前で止める。
  const read = async (H, { stopAction = false, stopChoices = false, record = [] } = {}) => {
    for (let step = 0; step < 160; step++) {
      const ui = await H.eval(() => {
        const shade = document.querySelector('.dlg-shade:not(.ask)');
        const ready = shade && !shade.querySelector('.dlg-next')?.classList.contains('hidden');
        const action = document.querySelector('.dialog-action:not(.hidden)');
        return {
          dialog: !!shade, ready, action: !!action,
          name: ready ? shade.querySelector('.dlg-name')?.textContent : null,
          text: ready ? shade.querySelector('.dlg-text')?.textContent : null,
          choices: !!document.querySelector('.modal-wrap:not(.out) .town-story-choice'),
          request: !!document.querySelector('.choices .btn'), idle: PokaDebug.idle(),
        };
      });
      if (ui.ready && ui.text) {
        const last = record.at(-1);
        if (!last || last.name !== ui.name || last.text !== ui.text) record.push({ name: ui.name, text: ui.text });
      }
      if (stopAction && ui.action && ui.ready) return 'action';
      if (stopChoices && ui.choices) return 'choices';
      if (ui.dialog) await H.dialogs(1);
      else if (ui.request) {
        // 既存のおねがい・物々交換は引き受けず、会話だけの検証にする。
        await H.page.locator('.choices .btn').last().click();
      } else if (ui.idle) return 'idle';
      await H.wait(60);
    }
    throw new Error('会話が終わらない、または相談の選択肢へ進まない');
  };
  const consultButton = async (H, npc, label, record = []) => {
    // 通常会話との混在を実際に通る。20回連続で75%の会話が出ない確率は10^-12未満。
    for (let attempt = 0; attempt < 20; attempt++) {
      await H.idle();
      expect(await H.dbg('folkTalk', npc), npc + 'に話しかけられない');
      const reached = await read(H, { stopAction: true, record });
      if (reached === 'action') {
        const action = H.page.locator('.dialog-action:not(.hidden)');
        expect((await action.textContent()) === label, '相談ボタンの進捗表示が違う');
        const box = await action.boundingBox();
        expect(box && box.height >= 44 && box.x >= 0 && box.y >= 0, '相談ボタンが小さい/画面外');
        await action.click();
        return;
      }
    }
    throw new Error('20回話しても任意の相談ボタンが出ない');
  };
  const checkButtons = async (H, selector) => {
    const found = H.page.locator(selector);
    const count = await found.count();
    expect(count > 0, '検査する選択肢がない: ' + selector);
    for (let i = 0; i < count; i++) {
      await found.nth(i).scrollIntoViewIfNeeded();
      const box = await found.nth(i).boundingBox();
      const viewport = H.page.viewportSize();
      expect(box && box.height >= 43.5 && box.width >= 43.5 && box.x >= -0.5 && box.x + box.width <= viewport.width + 0.5,
        '選択肢のタップ領域/横幅が不正: ' + selector);
      expect(box.y >= -0.5 && box.y + box.height <= viewport.height + 0.5, 'スクロールしても選択肢へ届かない');
    }
    expect(await H.eval(() => document.documentElement.scrollWidth <= innerWidth), '横にはみ出した');
  };

  for (const viewport of screens) await scenario('town-dialogue-stories-' + viewport.width, async H => {
    const legacy = await legacyGame(H), story = 'tds-sheep-gift';
    const record = [];
    const defaults = await H.dbg('conversation');
    expect(defaults && !defaults.stories[story], '旧セーブへ相談記録が追加されない/勝手に完了する');
    // 初回の挨拶を保ち、最後まで読むだけでは相談を始めない。
    expect(await H.dbg('folkTalk', 'sheep'), 'ひつじの初回挨拶を開始できない');
    await read(H, { record }); await H.idle();
    expect(!(await H.dbg('conversation')).stories[story], '挨拶だけで相談が始まる');
    await consultButton(H, 'sheep', 'そうだんを きく', record);
    expect(await read(H, { stopChoices: true, record }) === 'choices', '相談の最初の選択肢が出ない');
    await checkButtons(H, '.modal-wrap:not(.out) .town-story-choice, .modal-wrap:not(.out) .town-story-pause');
    await H.page.locator('.modal-wrap:not(.out) .town-story-choice').first().scrollIntoViewIfNeeded();
    await H.shot('choice');
    const first = viewport.width === 390 ? 0 : 1;
    await H.page.locator('.modal-wrap:not(.out) .town-story-choice').nth(first).click();
    expect(await read(H, { stopChoices: true, record }) === 'choices', '2回目の選択肢が出ない');
    const partial = (await H.dbg('conversation')).stories[story];
    expect(partial.path.length === 1 && partial.path[0].choice === first && !partial.ending, '1回目の選択が保存されない');
    expect(partial.node === (first === 0 ? 'things' : 'portrait'), '選択と異なる話題に分岐する');
    await H.page.locator('.modal-wrap:not(.out) .town-story-pause').click();
    await read(H); await H.idle();
    assertKept(legacy, await H.dbg('saveData'));
    await reload(H);
    expect(JSON.stringify((await H.dbg('conversation')).stories[story]) === JSON.stringify(partial), '中断した相談の選択/場所が再読込で変わる');
    await consultButton(H, 'sheep', 'そうだんの つづき', record);
    expect(await read(H, { stopChoices: true, record }) === 'choices', '中断した場所から再開できない');
    const second = viewport.width === 390 ? 1 : 0;
    await H.page.locator('.modal-wrap:not(.out) .town-story-choice').nth(second).click();
    await read(H, { record }); await H.idle();
    const result = (await H.dbg('conversation')).stories[story], ending = viewport.width === 390 ? 'tea' : 'memory';
    expect(result.ending === ending && result.path.length === 2 && result.path[1].choice === second, '2つの選択に応じた結末が記録されない');
    const characters = (await H.dbg('saveData')).chars;
    for (const id of ['wanko', 'gachan', 'goji']) expect(record.some(line => line.name === characters[id].name), '相談で仲間が話さない: ' + id);
    await reload(H);
    expect((await H.dbg('conversation')).stories[story].ending === ending, '相談の結末が再読込で消える');
    const followup = [];
    await consultButton(H, 'sheep', 'そのごの はなし');
    expect(await read(H, { stopChoices: true, record: followup }) === 'choices', '結末後の会話を読めない');
    expect(followup.some(line => line.text.includes(viewport.width === 390 ? 'カップの えを みて' : 'あの はなを みた ひ')), '選んだ結末と異なる再会会話が出た');
    await H.page.locator('.modal-wrap:not(.out) .town-story-pause').click();
    await read(H); await H.idle();
    assertKept(legacy, await H.dbg('saveData'));
    expect((await H.dbg('persistedSave')).conversations.stories[story].ending === ending, '再会後に結末の保存が消えた');
  }, { viewport, timeout: 150000 });

  for (const viewport of screens) await scenario('town-dialogue-quiz-' + viewport.width, async H => {
    const legacy = await legacyGame(H);
    expect(await H.dbg('folkTalk', 'town_walker3'), 'クイズ係に話しかけられない');
    await H.until(() => PokaDebug.quizState().mode === 'menu' && !!document.querySelector('.town-quiz'));
    let quiz = await H.dbg('quizState');
    expect(quiz.questionCount === 50 && !quiz.active && quiz.plays === 0 && quiz.daily.remaining === 10, '50問/初期状態/報酬枠が不正');
    expect(await H.page.locator('.town-quiz-actions button').count() === 3, '難易度が3段階でない');
    await checkButtons(H, '.town-quiz-actions button');
    await H.page.getByRole('button', { name: /^上級 ／/ }).click();
    await H.until(() => PokaDebug.quizState().mode === 'question');
    quiz = await H.dbg('quizState');
    expect(quiz.active.level === 3 && quiz.active.eligible && quiz.active.choices.length >= 3 && quiz.active.choices.length <= 5, '上級の問題/選択肢が不正');
    expect((await H.page.locator('.town-quiz-prompt').textContent()) === quiz.active.prompt, '画面と保存の問題が違う');
    await checkButtons(H, '.town-quiz-actions button');
    await H.page.locator('.town-quiz-prompt').scrollIntoViewIfNeeded(); await H.shot('question');
    const pending = quiz.active, held = (await H.dbg('persistedSave')).townQuiz.active;
    assertKept(legacy, await H.dbg('saveData'));
    await H.page.locator('.town-quiz .close').click(); await H.idle();
    expect((await H.dbg('quizState')).active.token === pending.token, '閉じただけで問題が消えた');
    await reload(H);
    expect(await H.dbg('folkTalk', 'town_walker3'), '再開時にクイズ係へ話しかけられない');
    await H.until(() => PokaDebug.quizState().mode === 'question');
    quiz = await H.dbg('quizState');
    expect(JSON.stringify(quiz.active) === JSON.stringify(pending), '再開で問題/選択肢/正解の順番が変わった');
    expect(JSON.stringify((await H.dbg('persistedSave')).townQuiz.active) === JSON.stringify(held), '再開で問題の景品抽選を引き直した');
    const buttons = H.page.locator('.town-quiz-actions button');
    const right = buttons.nth(quiz.active.correctIndex);
    await right.scrollIntoViewIfNeeded();
    // 同じ古いボタンへ二つのclickが届いても、景品の受け取りは1回。
    await right.evaluate(button => { button.click(); button.click(); });
    await H.until(() => PokaDebug.quizState().mode === 'result');
    quiz = await H.dbg('quizState');
    expect(quiz.last.correct && quiz.last.token === pending.token && quiz.plays === 1 && quiz.correct === 1 && quiz.daily.attempts === 1 && !quiz.active, '正答/二重クリックの確定が不正');
    expect(quiz.last.loot.length >= 1 && quiz.last.question.sources.length >= 2, '正答報酬/複数出典がない');
    const earned = await H.dbg('persistedSave');
    let coins = legacy.coins;
    const bag = { ...legacy.bag }, furn = { ...legacy.furn };
    for (const loot of quiz.last.loot) {
      if (loot.coins) coins += loot.coins;
      else if (loot.bag) bag[loot.bag] = (bag[loot.bag] || 0) + (loot.n || 1);
      else if (loot.furn) furn[loot.furn] = (furn[loot.furn] || 0) + 1;
      else throw new Error('未知のクイズ報酬');
    }
    expect(earned.coins === coins && JSON.stringify(earned.bag) === JSON.stringify(bag) && JSON.stringify(earned.furn) === JSON.stringify(furn), '景品表示と保存された財産が一致しない/二重払い');
    assertKept(legacy, earned, ['wardrobe', 'room', 'rooms', 'shops']);
    expect(await H.dbg('quizAnswer', pending.correctIndex) === false, '確定済み問題に再回答できる');
    assertKept(earned, await H.dbg('saveData'));
    await H.page.locator('.town-quiz-result').scrollIntoViewIfNeeded(); await H.shot('result');
    await H.page.locator('.town-quiz-sources summary').click();
    const sources = H.page.locator('.town-quiz-sources a');
    expect(await sources.count() >= 2, '画面に出典リンクが2件以上ない');
    for (const href of await sources.evaluateAll(links => links.map(a => a.href))) expect(/^https:\/\//.test(href), '出典のURLが不正');
    await sources.last().scrollIntoViewIfNeeded();
    expect(await H.eval(() => document.documentElement.scrollWidth <= innerWidth), '出典を開くと横にはみ出す');
    await checkButtons(H, '.town-quiz-actions button');
    await H.page.getByRole('button', { name: '難易度を選びなおす', exact: true }).click();
    await H.page.getByRole('button', { name: /^中級 ／/ }).click();
    quiz = await H.dbg('quizState');
    expect(quiz.active.level === 2, '中級に切り替わらない');
    const wrong = (quiz.active.correctIndex + 1) % quiz.active.choices.length;
    await H.page.locator('.town-quiz-actions button').nth(wrong).click();
    quiz = await H.dbg('quizState');
    expect(!quiz.last.correct && quiz.last.loot.length === 0 && quiz.plays === 2 && quiz.correct === 1 && quiz.daily.attempts === 2, '誤答でも報酬/正解数が増える、または解説が出ない');
    assertKept(earned, await H.dbg('saveData'));
    await H.page.getByRole('button', { name: '難易度を選びなおす', exact: true }).click();
    await H.page.getByRole('button', { name: /^初級 ／/ }).click();
    expect((await H.dbg('quizState')).active.level === 1, '初級に切り替わらない');
    await H.dbg('quizCancel'); await H.idle();
    await reload(H);
    quiz = await H.dbg('quizState');
    expect(quiz.active.level === 1 && quiz.plays === 2 && quiz.correct === 1, '保留中の初級/これまでの正誤記録が再読込で消える');
    assertKept(earned, await H.dbg('saveData'));
  }, { viewport, timeout: 120000 });

  // クイズ係 6人（オーナーの FB 2026-10-01「クイズを出す人をネリカスタウンに3人、池袋駅に3人配置しなさい」）。
  // 池袋えきの まえの 3人 → れきし はかせ（とくいは れきしと ちり）で 初級 → ネリカスの 2人 → 中級を ほりゅう → ふんすいの 係で つづきを こたえる
  for (const viewport of screens) await scenario('quiz-hosts-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    const before = await H.dbg('saveData');
    const hosts = await H.eval(() => Object.entries(TownQuiz.HOSTS).map(([id, h]) => {
      const map = Object.keys(MAP_DEFS).find(k => (MAP_DEFS[k].npcs || []).some(n => n.id === id)), n = map && MAP_DEFS[map].npcs.find(n => n.id === id);
      return { id, map, theme: h.theme, topics: h.topics, name: n && n.name, x: n && n.x, y: n && n.y };
    }));
    expect(hosts.filter(h => h.map === 'town').length === 3 && hosts.filter(h => h.map === 'city').length === 3 && hosts.every(h => /^クイズずきの /.test(h.name)), 'クイズ係が 3人・3人 で ない ' + JSON.stringify(hosts));
    const topicOf = id => H.eval(id => TOWN_QUIZ_DATA.find(q => q.id === id).topic, id);
    const menu = async (id, theme) => {
      expect(await H.dbg('folkTalk', id), 'クイズ係に はなしかけられない ' + id);
      // とじた 画面は 180ms かけて きえる（.modal-wrap.out）ので、あいて いる 画面だけを みる
      await H.until(() => PokaDebug.quizState().mode === 'menu' && !!document.querySelector('.modal-wrap:not(.out) .town-quiz'), 15000);
      const q = await H.dbg('quizState'), ui = await H.eval(() => { const b = document.querySelector('.modal-wrap:not(.out) .town-quiz .panel-body'); return { text: b.textContent, theme: !!b.querySelector('.town-quiz-theme') }; });
      expect(q.host === id && q.theme === theme && (theme ? ui.text.includes('「' + theme + '」') : !ui.theme) && ui.text.includes(hosts.find(h => h.id === id).name), 'クイズ係の とくい ' + JSON.stringify([id, q.host, q.theme, ui.text.slice(0, 80)]));
      expect(await H.eval(() => document.documentElement.scrollWidth <= innerWidth), 'クイズの がめんが よこに はみ出す');
      await checkButtons(H, '.modal-wrap:not(.out) .town-quiz-actions button');
    };
    // 池袋えきの まえ（3人 と えきの 入口）
    await H.dbg('teleport', 'city', 10, 47, 'up'); await H.idle(); await H.wait(900); await H.shot('station');
    const st = await H.eval(() => { const s = G.scene, near = s.npcs.filter(n => TownQuiz.host(n)).map(n => n.id); return near; });
    expect(['ike_quiz_history', 'ike_quiz_art', 'ike_quiz_all'].every(id => st.includes(id)), '池袋えきの まえに 3人 いない ' + JSON.stringify(st));
    await menu('ike_quiz_history', 'れきしと ちり'); await H.shot('history-menu');
    await H.page.getByRole('button', { name: /^初級 ／/ }).click();
    await H.until(() => PokaDebug.quizState().mode === 'question');
    let quiz = await H.dbg('quizState');
    expect(hosts.find(h => h.id === 'ike_quiz_history').topics.includes(await topicOf(quiz.active.id)), 'れきし はかせの とくいな 分野の 問題が でない ' + quiz.active.id);
    await H.page.locator('.town-quiz-prompt').scrollIntoViewIfNeeded(); await H.shot('history-question');
    await H.page.locator('.town-quiz-actions button').nth(quiz.active.correctIndex).click();
    await H.until(() => PokaDebug.quizState().mode === 'result');
    expect((await H.dbg('quizState')).last.correct, 'せいかいに ならない');
    await H.dbg('quizCancel'); await H.idle();
    await menu('ike_quiz_art', 'げいじゅつと おんがく'); await H.dbg('quizCancel'); await H.idle();
    await menu('ike_quiz_all', null); await H.dbg('quizCancel'); await H.idle();
    // ネリカスタウン: いこいの もりの そば・しょうがっこうの まえ
    const near = async (id, tag) => { const h = hosts.find(h => h.id === id); await H.dbg('teleport', h.map, h.x, h.y + 1, 'up'); await H.idle(); await H.wait(900); await H.shot(tag); };
    await menu('neri_quiz_nature', 'しぜんと いきもの'); await H.dbg('quizCancel'); await H.idle(); await near('neri_quiz_nature', 'forest');
    await menu('neri_quiz_science', 'うちゅうと かがく'); await H.shot('science-menu');
    await H.page.getByRole('button', { name: /^中級 ／/ }).click();
    await H.until(() => PokaDebug.quizState().mode === 'question');
    quiz = await H.dbg('quizState'); const pending = quiz.active;
    expect(hosts.find(h => h.id === 'neri_quiz_science').topics.includes(await topicOf(pending.id)), 'ほしぞら はかせの とくいな 分野の 問題が でない ' + pending.id);
    await H.dbg('quizCancel'); await H.idle(); await near('neri_quiz_science', 'school');
    // ほりゅうした 問題は どの 係でも つづきから（ふんすいの ひろばの 係）
    expect(await H.dbg('folkTalk', 'town_walker3'), 'ふんすいの 係に はなしかけられない');
    await H.until(() => PokaDebug.quizState().mode === 'question', 15000);
    quiz = await H.dbg('quizState');
    expect(quiz.active.token === pending.token && quiz.host === 'town_walker3', 'ほりゅうした 問題が つづかない');
    await H.page.locator('.town-quiz-actions button').nth(quiz.active.correctIndex).click();
    await H.until(() => PokaDebug.quizState().mode === 'result');
    quiz = await H.dbg('quizState');
    expect(quiz.plays === 2 && quiz.correct === 2 && !quiz.active, 'クイズの きろく ' + JSON.stringify([quiz.plays, quiz.correct]));
    await H.dbg('quizCancel'); await H.idle();
    const after = await H.dbg('saveData');
    assertKept(before, after, ['wardrobe', 'room', 'rooms', 'shops']);
  }, { viewport, timeout: 150000 });
}
