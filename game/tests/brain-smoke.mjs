// のうトレの おてつだい「あたまの たいそう」（js/mg-brain.js・UI-64）: ネリカスタウンの お店 → 3しゅから えらぶ → あそぶ（4つめの 英語は tests/english-smoke.mjs）
export async function brainSmoke({ scenario, expect }) {
  const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
  const dlgText = (H) => H.eval(() => document.querySelector(".dlg-text")?.textContent || "");
  const waitDlg = (H) => H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
  // おきゃくさん 1にんぶんを まつ（つぎの 人が きて 作業に なるまで）
  const nextWork = (H, n) => H.until((k) => { const m = PokaDebug.mg(); return m && m.phase === "work" && m.n === k; }, 20000, n);

  // 1. お店に はいる → はなす → おてつだいする →「まちがい さがし」→ 4にん（はずれ 1・ヒント 1）→ 店内に もどる → 2かいめは べつの ゲーム（おみせで せつめい）
  for (const viewport of PHONES) await scenario("brain-spot-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    const before = await H.dbg("saveData");
    const layout = await H.dbg("townLayout", "town"), door = layout.doors.find((d) => d.act.shop === "brain");
    expect(door && door.id === "nerikasu_home6", "ネリカスタウンの お店 " + JSON.stringify(door));
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(30000); await H.wait(500); await H.shot("outside");
    await H.dbg("walkTo", door.x, door.y); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000);
    const st = await H.dbg("storeState"); expect(st.shop === "brain" && st.party.length === 3 && st.owner === "ふくろうの ホーせんせい", "3人で 店内へ・店主 " + JSON.stringify(st));
    await H.wait(400); await H.shot("store");
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
    // 3しゅから えらぶ（はじめては「（はじめて）」）
    await H.page.getByRole("button", { name: "くだもの けいさん（はじめて）", exact: true }).waitFor({ timeout: 8000 });
    const ask = await H.eval(() => [...document.querySelectorAll(".dlg-shade.ask .choices .btn")].map((b) => b.textContent));
    expect(ask.join("|") === "まちがい さがし（はじめて）|おなじ え さがし（はじめて）|くだもの けいさん（はじめて）|英語（はじめて）|やめる", "えらぶ ボタン（4つめは 大人むけの 英語。tests/english-smoke.mjs）" + ask);
    const askText = await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
    expect(/まちがい さがし/.test(askText) && /おなじ え さがし/.test(askText) && /くだもの けいさん/.test(askText) && /英語/.test(askText), "4しゅの せつめい " + askText);
    await H.shot("choose");
    await H.page.getByRole("button", { name: "まちがい さがし（はじめて）", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    // はじめての おてつだいは えらんだ ゲームの せつめい
    await waitDlg(H); const t1 = await dlgText(H); expect(/ようこそ ホー/.test(t1), "せつめいの はじめ " + t1);
    await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup");
    await waitDlg(H); const t2 = await dlgText(H); expect(/ひだりと みぎ/.test(t2), "まちがい さがしの せつめい " + t2);
    await H.dialogs();
    expect(await H.eval(() => Sound.want || Sound.cur?.name) === "shop_brain", "お店の BGM");
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c); await H.wait(250);
      let m = await H.dbg("mg"); const o = m.order;
      expect(m.shop === "brain" && m.total === 4 && o.game === "spot" && o.total === 3 && o.diffs.length === 3 && m.buttons.some((b) => b.label === "ヒント"), "まちがい さがし Lv1 " + JSON.stringify(o));
      if (c === 0) {
        await H.shot("spot");
        await H.tap(o.same.cx, o.same.cy); await H.wait(150); m = await H.dbg("mg");
        expect(m.order.misses === 1 && m.order.found === 0, "おなじ ところは はずれ " + JSON.stringify(m.order)); await H.shot("spot-miss"); await H.wait(450);
      }
      if (c === 1) { await H.tapLabel("ヒント"); await H.wait(200); m = await H.dbg("mg"); expect(m.order.hints === 1 && m.order.hintCell >= 0, "ヒント"); await H.shot("spot-hint"); }
      for (const [i, d] of o.diffs.entries()) {
        const q = i % 2 ? d.left : d.right; await H.tap(q.cx, q.cy); await H.wait(160);
        if (c === 0 && i === 1) await H.shot("spot-found");
      }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg");
    expect(m.ranks.join() === "3,2,3,3", "はずれ 1 は ◎・ヒント 1 は ○ " + JSON.stringify([m.ranks, H.shopGrades]));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    let save = await H.dbg("persistedSave");
    expect(save.coins > before.coins && save.shops.brain.plays === 1 && save.shops.brain.games.spot === 1 && save.shops.brain.last === "spot" && save.shops.brain.rep > 0, "コイン・ひょうばん・ゲームの きろく " + JSON.stringify(save.shops.brain));
    for (const k of ["bag", "wardrobe", "rooms"]) expect(H.kept(before, save, k), "もちものが かわる " + k);
    // 2かいめ: はじめての「おなじ え さがし」は おみせで せつめい → おてつだいは「きょうも よろしくね」→ とちゅうで やめる
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
    await H.page.getByRole("button", { name: "まちがい さがし", exact: true }).waitFor({ timeout: 8000 });
    await H.page.getByRole("button", { name: "おなじ え さがし（はじめて）", exact: true }).click();
    await waitDlg(H); const t3 = await dlgText(H); expect(/カード/.test(t3) && (await H.dbg("state")).scene === "store", "おみせで おなじ え さがしの せつめい " + t3); await H.shot("howto-pair");
    await H.dialogs(); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await waitDlg(H); const t4 = await dlgText(H); expect(/きょうも よろしくね/.test(t4), "2かいめの あいさつ " + t4); await H.dialogs();
    await nextWork(H, 0); expect((await H.dbg("mg")).order.game === "pair", "おなじ え さがしに なる");
    await H.page.getByRole("button", { name: "おてつだいを やめる", exact: true }).click(); await H.page.getByRole("button", { name: "ここで やめる", exact: true }).click();
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    save = await H.dbg("persistedSave"); expect(save.shops.brain.games.pair === 1 && save.shops.brain.last === "pair" && save.shops.brain.plays === 1, "やめた ときの きろく " + JSON.stringify(save.shops.brain));
  }, { viewport, full: viewport.width === 375, timeout: 200000 });

  // 2. おなじ え さがし（Lv.4・いろだけ ちがう くみ）: みせる あいだ → 1かい まちがえて もどる → ぜんぶ そろえる → ◎
  for (const viewport of PHONES) await scenario("brain-pair-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    await H.dbg("shop", "brain", 4, "pair"); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await waitDlg(H); await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup"); await waitDlg(H);
    expect(/カード/.test(await dlgText(H)), "おなじ え さがしの せつめい"); await H.dialogs();
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c);
      let o = (await H.dbg("mg")).order;
      expect(o.game === "pair" && o.pairs === 8 && o.cards.length === 16, "Lv4 は 8くみ " + JSON.stringify(o));
      const kinds = {}; for (const k of new Set(o.cards.map((q) => q.key))) kinds[k.split(":")[0]] = (kinds[k.split(":")[0]] || 0) + 1;
      expect(Object.values(kinds).filter((k) => k === 2).length === 2, "いろだけ ちがう くみが 2つ");
      if (c === 0) { await H.wait(200); await H.shot("pair-peek"); }
      await H.until(() => PokaDebug.mg().order.peek <= 0, 6000); await H.wait(120);
      o = (await H.dbg("mg")).order;
      const by = {}; for (const q of o.cards) (by[q.key] = by[q.key] || []).push(q);
      const pairs = Object.values(by);
      if (c === 0) {
        const a = pairs[0][0], b = pairs[1][0];
        await H.tap(a.cx, a.cy); await H.wait(120); await H.tap(b.cx, b.cy); await H.wait(150); await H.shot("pair-miss");
        expect((await H.dbg("mg")).order.misses === 1, "ちがう えは みのがし");
        await H.until(() => PokaDebug.mg().order.lock <= 0 && PokaDebug.mg().order.cards.every((q) => !q.open || q.done), 4000);
      }
      for (const [i, two] of pairs.entries()) {
        for (const q of two) { await H.tap(q.cx, q.cy); await H.wait(110); }
        if (c === 0 && i === 3) await H.shot("pair-half");
      }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg"); expect(m.ranks.every((r) => r === 3), "ぜんぶ ◎ " + JSON.stringify([m.ranks, m.score]));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
  }, { viewport, full: viewport.width === 375, timeout: 200000 });

  // 3. くだもの けいさん（Lv.5・20まで）: 1もんめは まちがえて もういちど → ○、あとは ◎
  for (const viewport of PHONES) await scenario("brain-math-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    await H.dbg("shop", "brain", 5, "math"); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await waitDlg(H); await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup"); await waitDlg(H);
    expect(/くだもの/.test(await dlgText(H)), "くだもの けいさんの せつめい"); await H.dialogs();
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c);
      for (let k = 0; k < 5; k++) {
        await H.until((i) => { const o = PokaDebug.mg()?.order; return o && o.cur && o.index === i && !o.waiting; }, 6000, k);
        const m = await H.dbg("mg"), q = m.order.cur;
        expect(m.order.total === 5 && q.ans >= 0 && q.ans <= 20 && q.choices.includes(q.ans) && m.buttons.length === 4, "Lv5 の もんだい " + JSON.stringify(q));
        if (c === 0 && k === 0) {
          await H.shot("math");
          await H.tapLabel(String(q.choices.find((v) => v !== q.ans))); await H.wait(200);
          const w = await H.dbg("mg"); expect(w.order.misses === 1 && w.buttons.length === 3, "まちがえた こたえは きえる"); await H.shot("math-wrong");
        }
        await H.tapLabel(String(q.ans));
        if (c === 0 && k === 0) { await H.wait(150); await H.shot("math-right"); }
      }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg"); expect(m.ranks.join() === "2,3,3,3", "1もんめ 2かいめで ○・あとは ◎ " + JSON.stringify(m.ranks));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
  }, { viewport, full: viewport.width === 375, timeout: 200000 });
}
