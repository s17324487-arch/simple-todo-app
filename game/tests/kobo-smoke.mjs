// パズルの おてつだい「パズル こうぼう」（js/mg-kobo.js・UI-65）: ネリカスタウンの お店 → 3しゅから えらぶ → あそぶ（4つめの ナンプレは tests/numpla-smoke.mjs）
export async function koboSmoke({ scenario, expect }) {
  const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
  const dlgText = (H) => H.eval(() => document.querySelector(".dlg-text")?.textContent || "");
  const waitDlg = (H) => H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
  // おきゃくさん 1にんぶんを まつ（つぎの 人が きて 作業に なるまで）
  const nextWork = (H, n) => H.until((k) => { const m = PokaDebug.mg(); return m && m.phase === "work" && m.n === k; }, 20000, n);
  const order = async (H) => (await H.dbg("mg")).order;
  // はじめの せつめい（HELLO → えらんだ ゲーム）を よんで すすめる
  const howto = async (H, re, what) => {
    await waitDlg(H); const t1 = await dlgText(H); expect(/ようこそ チク/.test(t1), "せつめいの はじめ " + t1);
    await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup");
    await waitDlg(H); const t2 = await dlgText(H); expect(re.test(t2), what + " " + t2);
    await H.dialogs();
  };
  // スライド パズル: いちばん すくない てじゅんで タップ（debug の path）
  const solveSlide = async (H) => { const o = await order(H); for (const p of o.path) { await H.tap(p.cx, p.cy); await H.wait(90); } };

  // 1. お店に はいる → はなす → おてつだいする →「スライド パズル」→ 4にん（うごかない いた・ヒント 1）→ 店内に もどる → 2かいめは「かたち はめ」（おみせで せつめい）
  for (const viewport of PHONES) await scenario("kobo-slide-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    const before = await H.dbg("saveData");
    const layout = await H.dbg("townLayout", "town"), door = layout.doors.find((d) => d.act.shop === "kobo");
    expect(door && door.id === "nerikasu_home2", "ネリカスタウンの お店 " + JSON.stringify(door));
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(30000); await H.wait(500); await H.shot("outside");
    await H.dbg("walkTo", door.x, door.y); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000);
    const st = await H.dbg("storeState"); expect(st.shop === "kobo" && st.party.length === 3 && st.owner === "はりねずみの チクタさん", "3人で 店内へ・店主 " + JSON.stringify(st));
    await H.wait(400); await H.shot("store");
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
    await H.page.getByRole("button", { name: "おえかき ロジック（はじめて）", exact: true }).waitFor({ timeout: 8000 });
    const ask = await H.eval(() => [...document.querySelectorAll(".dlg-shade.ask .choices .btn")].map((b) => b.textContent));
    expect(ask.join("|") === "スライド パズル（はじめて）|かたち はめ（はじめて）|おえかき ロジック（はじめて）|ナンプレ（はじめて）|やめる", "えらぶ ボタン（4つめは 大人むけの ナンプレ。tests/numpla-smoke.mjs）" + ask);
    const askText = await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
    expect(/どの パズル/.test(askText) && /スライド パズル/.test(askText) && /かたち はめ/.test(askText) && /おえかき ロジック/.test(askText) && /ナンプレ/.test(askText), "4しゅの せつめい " + askText);
    await H.shot("choose");
    await H.page.getByRole("button", { name: "スライド パズル（はじめて）", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await howto(H, /ばらばら/, "スライド パズルの せつめい");
    expect(await H.eval(() => Sound.want || Sound.cur?.name) === "shop_kobo", "お店の BGM");
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c); await H.wait(250);
      const m = await H.dbg("mg"), o = m.order;
      expect(m.shop === "kobo" && m.total === 4 && o.game === "slide" && o.n === 3 && o.par >= 3 && o.par <= 4 && o.path.length === o.par && m.buttons.some((b) => b.label === "ヒント"), "スライド パズル Lv1 " + JSON.stringify({ ...o, path: o.path.length }));
      if (c === 0) {
        await H.shot("slide");
        await H.tap(o.far.cx, o.far.cy); await H.wait(150);
        const f = await order(H); expect(f.moves === 0 && f.tiles.join() === o.tiles.join(), "あいた ところと べつの れつの いたは うごかない");
      }
      if (c === 1) { await H.tapLabel("ヒント"); await H.wait(200); const h = await order(H); expect(h.hints === 1 && h.hintPos >= 0, "ヒント"); await H.shot("slide-hint"); }
      await solveSlide(H);
      if (c === 0) { await H.wait(300); await H.shot("slide-done"); }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg");
    expect(m.ranks.join() === "3,2,3,3", "ヒント 1 は ○・あとは ◎ " + JSON.stringify(m.ranks));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    let save = await H.dbg("persistedSave");
    expect(save.coins > before.coins && save.shops.kobo.plays === 1 && save.shops.kobo.games.slide === 1 && save.shops.kobo.last === "slide" && save.shops.kobo.rep > 0, "コイン・ひょうばん・ゲームの きろく " + JSON.stringify(save.shops.kobo));
    for (const k of ["bag", "wardrobe", "rooms"]) expect(H.kept(before, save, k), "もちものが かわる " + k);
    // 2かいめ: はじめての「かたち はめ」は おみせで せつめい → おてつだいは「きょうも よろしくね」→ とちゅうで やめる
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
    await H.page.getByRole("button", { name: "スライド パズル", exact: true }).waitFor({ timeout: 8000 });
    await H.page.getByRole("button", { name: "かたち はめ（はじめて）", exact: true }).click();
    await waitDlg(H); const t3 = await dlgText(H); expect(/ピース/.test(t3) && (await H.dbg("state")).scene === "store", "おみせで かたち はめの せつめい " + t3); await H.shot("howto-shape");
    await H.dialogs(); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await waitDlg(H); const t4 = await dlgText(H); expect(/きょうも よろしくね/.test(t4), "2かいめの あいさつ " + t4); await H.dialogs();
    await nextWork(H, 0); expect((await order(H)).game === "shape", "かたち はめに なる");
    await H.page.getByRole("button", { name: "おてつだいを やめる", exact: true }).click(); await H.page.getByRole("button", { name: "ここで やめる", exact: true }).click();
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    save = await H.dbg("persistedSave"); expect(save.shops.kobo.games.shape === 1 && save.shops.kobo.last === "shape" && save.shops.kobo.plays === 1, "やめた ときの きろく " + JSON.stringify(save.shops.kobo));
  }, { viewport, full: viewport.width === 375, timeout: 200000 });

  // 2. かたち はめ（Lv.5: まわす・にた かたち・おおきさ ちがい）: ちがう あな → むきだけ ちがう → タップで まわして ドラッグ → ◎
  for (const viewport of PHONES) await scenario("kobo-shape-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    await H.dbg("shop", "kobo", 5, "shape"); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await howto(H, /ピース/, "かたち はめの せつめい");
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c); await H.wait(250);
      let o = await order(H);
      expect(o.game === "shape" && o.total === 6 && o.rotate && o.holes.filter((h) => h.size < 1).length === 1 && o.pieces.some((p) => p.turns > 0), "かたち はめ Lv5 " + JSON.stringify(o.holes.map((h) => h.kind + ":" + h.size)));
      if (c === 0) {
        await H.shot("shape");
        // ちがう あな（6てん）
        const p = o.pieces.find((q) => q.turns > 0 && !o.pieces.some((r) => r !== q && r.kind === q.kind)), wrong = o.holes.find((h) => h.kind !== p.kind);
        await H.drag(p.cx, p.cy, wrong.cx, wrong.cy); await H.wait(150);
        let now = await order(H); expect(now.misses === 1 && now.placed === 0 && /かたちが ちがう/.test(now.tip), "ちがう あなは もどる " + now.tip); await H.shot("shape-wrong");
        await H.wait(700);
        // むきだけ ちがう（へらない）
        const hole = o.holes[p.hole]; await H.drag(p.cx, p.cy, hole.cx, hole.cy); await H.wait(150);
        now = await order(H); expect(now.misses === 1 && now.wrongTurn === 1 && /むき/.test(now.tip), "むきだけ ちがうと もどる（へらない）"); await H.shot("shape-turn");
        await H.wait(700);
      }
      if (c === 1) {
        // おおきさ ちがい（6てん）
        const small = o.pieces.find((q) => q.size < 1), big = o.holes.find((h) => h.kind === small.kind && h.size === 1);
        await H.drag(small.cx, small.cy, big.cx, big.cy); await H.wait(150);
        const now = await order(H); expect(now.misses === 1 && /おおきさ/.test(now.tip), "おおきさが ちがうと はまらない"); await H.wait(700);
      }
      o = await order(H);
      for (const [i, p] of o.pieces.entries()) {
        for (let t = 0; t < p.turns; t++) { await H.tap(p.cx, p.cy); await H.wait(120); }
        const h = o.holes[p.hole]; await H.drag(p.cx, p.cy, h.cx, h.cy, 240); await H.wait(140);
        if (c === 0 && i === 2) await H.shot("shape-half");
      }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg"); expect(m.ranks.every((r) => r === 3), "まちがい 1かいでも ◎ " + JSON.stringify(m.ranks));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
  }, { viewport, full: viewport.width === 375, timeout: 200000 });

  // 3. おえかき ロジック（Lv.4・6×6・さいしょに 2ます）: ちがう ますは ばつ → よこに なぞって まとめて ぬる → ぜんぶ ぬって ◎
  for (const viewport of PHONES) await scenario("kobo-logic-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    await H.dbg("shop", "kobo", 4, "logic"); await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await howto(H, /すうじ/, "おえかき ロジックの せつめい");
    for (let c = 0; c < 4; c++) {
      await nextWork(H, c); await H.wait(250);
      let o = await order(H);
      expect(o.game === "logic" && o.rows === 6 && o.cols === 6 && o.preset === 2 && o.todo.length === o.total - 2 && o.cellCss >= 44, "おえかき ロジック Lv4 " + JSON.stringify({ name: o.name, total: o.total, css: o.cellCss }));
      if (c === 0) {
        await H.shot("logic");
        const e = o.empty[0]; await H.tap(e.cx, e.cy); await H.wait(150);
        const now = await order(H); expect(now.misses === 1 && now.found === o.found, "ちがう ますは ばつ"); await H.shot("logic-miss");
        // よこに 2ます いじょう つづく ところを なぞる
        const rows = {}; for (const q of now.todo) (rows[q.y] = rows[q.y] || []).push(q);
        let run = null;
        for (const list of Object.values(rows)) { list.sort((a, b) => a.x - b.x); for (let i = 0; i + 1 < list.length && !run; i++) if (list[i + 1].x === list[i].x + 1) { let j = i + 1; while (j + 1 < list.length && list[j + 1].x === list[j].x + 1) j++; run = list.slice(i, j + 1); } if (run) break; }
        expect(run && run.length >= 2, "なぞれる れつ");
        await H.drag(run[0].cx, run[0].cy, run[run.length - 1].cx, run[run.length - 1].cy, 260); await H.wait(150);
        const after = await order(H); expect(after.found === now.found + run.length && after.misses === 1, `なぞると ${run.length}ます まとめて ぬれる（${after.found - now.found}）`);
        o = after;
      }
      for (const q of o.todo) { await H.tap(q.cx, q.cy); await H.wait(70); }
      if (c === 0) { await H.wait(450); await H.shot("logic-done"); }
      await H.until((k) => PokaDebug.mg().ranks.length > k, 8000, c);
    }
    const m = await H.dbg("mg"); expect(m.ranks.every((r) => r === 3), "ばつ 1かいでも ◎ " + JSON.stringify(m.ranks));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000); await H.shot("result");
  }, { viewport, full: viewport.width === 375, timeout: 200000 });
}
