// 英語ゲーム（あたまの たいそうの 4つめ・大人むけ。js/mg-english.js・UI-82。オーナーの 依頼 2026-10-04「脳トレは、英語ゲーム」）
// 1. ネリカスタウンの あたまの たいそう → おてつだいする →「英語（はじめて）」→ レベル（中学・高校）→ あそびかた（単語の意味・文の穴うめ）
// 2. 高校・文の穴うめ: 1問めを まちがえる（正解は みどり・解説・次へ）→ のこり 9問 正解 → 結果へ → ○・450コイン いじょう・まちがえた もの
// 3. もう いちど: 中学・単語の意味（2かいめの ひとこと）→ 1問 → とちゅうで やめる → ベスト・かずが セーブに のこる
export async function englishSmoke({ scenario, expect }) {
  const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
  const dlgText = (H) => H.eval(() => document.querySelector(".dlg-text")?.textContent || "");
  const askText = (H) => H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
  const askButtons = (H) => H.eval(() => [...document.querySelectorAll(".dlg-shade.ask .choices .btn")].map((b) => b.textContent));
  const order = async (H) => (await H.dbg("mg")).order;
  const work = (H) => H.until(() => { const m = PokaDebug.mg(); return m && m.phase === "work" && m.order && m.order.game === "eng"; }, 30000);
  const talkWork = async (H) => {
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
  };
  // こたえる（right: 正解か）→ 次へ
  const answer = async (H, right) => {
    const o = await order(H), c = o.choices.find((b) => (b.label === o.cur.ans) === right);
    await H.tap(c.cx, c.cy); await H.wait(150);
    return order(H);
  };
  const next = async (H) => { const o = await order(H); expect(o.next, "次へ が ない"); await H.tap(o.next.cx, o.next.cy); await H.wait(150); };
  for (const viewport of PHONES) await scenario("brain-english-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    const before = await H.dbg("saveData");
    const layout = await H.dbg("townLayout", "town"), door = layout.doors.find((d) => d.act.shop === "brain");
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(30000); await H.wait(400);
    await H.dbg("walkTo", door.x, door.y); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000); await H.wait(300);
    // 1. えらぶ
    await talkWork(H);
    await H.page.getByRole("button", { name: "英語（はじめて）", exact: true }).waitFor({ timeout: 8000 });
    expect(/英語：単語の意味・文の穴うめ/.test(await askText(H)), "ゲームの いちらんに 英語");
    await H.page.getByRole("button", { name: "英語（はじめて）", exact: true }).click();
    await H.page.getByRole("button", { name: "高校レベル", exact: true }).waitFor({ timeout: 8000 });
    let ask = await askButtons(H), at = await askText(H);
    expect(ask.join("|") === "中学レベル|高校レベル|やめる" && /英語の レベル/.test(at) && /受験レベル/.test(at), "レベル 2つ " + ask + " / " + at);
    await H.shot("levels");
    await H.page.getByRole("button", { name: "高校レベル", exact: true }).click();
    await H.page.getByRole("button", { name: "文の穴うめ", exact: true }).waitFor({ timeout: 8000 });
    ask = await askButtons(H); at = await askText(H);
    expect(ask.join("|") === "単語の意味|文の穴うめ|やめる" && /高校レベルだね/.test(at), "あそびかた 2つ " + ask + " / " + at);
    const fit = await H.eval(() => [...document.querySelectorAll(".dlg-shade.ask .choices .btn, .dlg-shade.ask .dialog")].map((e) => e.getBoundingClientRect()).every((b) => b.left >= 0 && b.right <= innerWidth + 0.5 && b.top >= 0 && b.bottom <= innerHeight + 0.5) && document.documentElement.scrollWidth <= innerWidth);
    expect(fit, "えらぶ ところが 画面に おさまる");
    await H.shot("modes");
    await H.page.getByRole("button", { name: "文の穴うめ", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
    expect(/ようこそ ホー/.test(await dlgText(H)), "はじめの あいさつ");
    await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup"); await H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
    expect(/中学レベルと 高校レベル/.test(await dlgText(H)), "英語の せつめい " + (await dlgText(H)));
    await H.dialogs(); await work(H); await H.wait(300);
    // 2. 高校・文の穴うめ
    let m = await H.dbg("mg"), o = m.order;
    expect(m.variant === "eng" && m.total === 1 && o.lv === "hs" && o.mode === "fill" && o.nq === 10 && o.index === 0 && o.cur.kind === "fill" && /___/.test(o.cur.en) && o.cur.ja, "高校の 穴うめ " + JSON.stringify({ lv: o.lv, mode: o.mode, en: o.cur.en }));
    expect(o.choices.length === 4 && o.choices.every((c) => c.h >= 44 && c.cx > 0 && c.cx < viewport.width), "選択肢 4つ（44px いじょう）");
    const ui = await H.eval(() => document.querySelector(".home-shortcut").getBoundingClientRect().bottom);
    expect(o.choices.every((c) => c.cy - c.h / 2 > ui), "やめる ボタンと かさならない");
    await H.shot("question");
    o = await answer(H, false);
    expect(o.answered && !o.answered.ok && o.next && o.next.label === "次へ" && o.missed.length === 1, "1問め まちがい → 次へ " + JSON.stringify(o.answered));
    await H.shot("wrong");
    await next(H);
    for (let k = 1; k < 10; k++) {
      o = await answer(H, true);
      expect(o.answered && o.answered.ok && o.correct === k, `${k + 1}問め 正解`);
      if (k === 9) expect(o.next.label === "結果へ", "さいごは「結果へ」");
      await next(H);
    }
    await H.until(() => PokaDebug.mg().ranks.length === 1, 10000); await H.wait(250); await H.shot("stamp");
    m = await H.dbg("mg");
    expect(m.ranks[0] === 2 && m.earn >= 450, "9問 正解 → ○・450コイン いじょう " + JSON.stringify({ r: m.ranks, earn: m.earn }));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000);
    const res = await H.eval(() => document.querySelector(".modal-wrap .panel-body").textContent);
    expect(/英語 高校レベル・文の穴うめ 9\/10問 正解（ベスト 9）/.test(res) && /まちがえた: /.test(res), "けっかに 正解の かずと まちがえた もの " + res);
    await H.shot("result");
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    // 3. 中学・単語の意味
    await talkWork(H);
    await H.page.getByRole("button", { name: "英語", exact: true }).click();
    await H.page.getByRole("button", { name: "中学レベル", exact: true }).click();
    await H.page.getByRole("button", { name: "単語の意味", exact: true }).waitFor({ timeout: 8000 });
    ask = await askButtons(H);
    expect(ask.join("|") === "単語の意味|文の穴うめ|やめる", "中学は まだ ベストなし " + ask);
    await H.page.getByRole("button", { name: "単語の意味", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
    expect(/英語（中学・単語の意味）を/.test(await dlgText(H)), "2かいめの ひとこと " + (await dlgText(H)));
    await H.dialogs(); await work(H); await H.wait(300);
    o = await order(H);
    expect(o.lv === "jh" && o.mode === "word" && o.cur.kind === "word" && /^[a-z-]+$/.test(o.cur.en) && o.cur.pos, "中学の 単語 " + JSON.stringify(o.cur));
    o = await answer(H, true);
    expect(o.answered.ok && o.correct === 1, "単語 1問 正解");
    await H.shot("word");
    await H.page.getByRole("button", { name: "おてつだいを やめる", exact: true }).click(); await H.page.getByRole("button", { name: "ここで やめる", exact: true }).click();
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000);
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    const en = await H.dbg("english"), sv = await H.dbg("persistedSave");
    expect(en.best.hs_fill === 9 && en.plays.hs_fill === 1 && en.lv === "jh" && en.mode === "word" && en.recent.hs_fill === 10 && en.recent.jh_word === 10, "セーブ: ベスト・かず・さいきんの 問題 " + JSON.stringify(en));
    expect(sv.shops.brain.games.eng === 2 && sv.shops.brain.last === "eng" && sv.coins >= before.coins + 450 && sv.shops.brain.rep >= 21, "えらんだ かず・コイン・ひょうばん（○ の 7 × 高校 3） " + JSON.stringify({ g: sv.shops.brain.games, c: sv.coins - before.coins, rep: sv.shops.brain.rep }));
  }, { viewport, timeout: 240000 });
}
