// ナンプレ（パズル こうぼうの 4つめの ゲーム・大人むけ。js/mg-numpla.js・UI-81。オーナーの 依頼 2026-10-04「パズルはナンプレ」）
// 1. ネリカスタウンの パズル こうぼう → おてつだいする →「ナンプレ（はじめて）」→ 難しさ 4つ →「中級」→ はじめの せつめい
// 2. 盤は 画面いっぱい（1マス 38px いじょう・ボタン 44px・やめるボタンと かさならない）→ 正しい 数字・まちがい（ミス 1）・メモ・ヒント
// 3. とちゅうで やめる（続きから できる）→ もう いちど えらぶと「続きから」→ おなじ 盤・ミス・ヒント
// 4. のこり 1マスを 入れて クリア → ○・コイン 1500 いじょう・クリアの きろく・続きは けす
export async function numplaSmoke({ scenario, expect }) {
  const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
  const dlgText = (H) => H.eval(() => document.querySelector(".dlg-text")?.textContent || "");
  const askButtons = (H) => H.eval(() => [...document.querySelectorAll(".dlg-shade.ask .choices .btn")].map((b) => b.textContent));
  const order = async (H) => (await H.dbg("mg")).order;
  const button = async (H, label) => (await H.dbg("mg")).buttons.find((b) => b.label === label);
  const press = async (H, label) => { const b = await button(H, label); expect(b, `ボタン「${label}」が ない`); await H.tap(b.cx, b.cy); await H.wait(120); };
  const work = (H) => H.until(() => { const m = PokaDebug.mg(); return m && m.phase === "work" && m.order && m.order.game === "numpla"; }, 30000);
  const talkWork = async (H) => {
    await H.page.getByRole("button", { name: "てんいんと はなす", exact: true }).click();
    await H.page.getByRole("button", { name: "おてつだいする", exact: true }).click();
  };
  for (const viewport of PHONES) await scenario("kobo-numpla-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12);
    const before = await H.dbg("saveData");
    const layout = await H.dbg("townLayout", "town"), door = layout.doors.find((d) => d.act.shop === "kobo");
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(30000); await H.wait(400);
    await H.dbg("walkTo", door.x, door.y); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000); await H.wait(300);
    // 1. えらぶ → 難しさ
    await talkWork(H);
    await H.page.getByRole("button", { name: "ナンプレ（はじめて）", exact: true }).waitFor({ timeout: 8000 });
    const askText = await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
    expect(/ナンプレ：9×9の 数字パズル/.test(askText), "ゲームの いちらんに ナンプレ " + askText);
    await H.page.getByRole("button", { name: "ナンプレ（はじめて）", exact: true }).click();
    await H.page.getByRole("button", { name: "中級", exact: true }).waitFor({ timeout: 8000 });
    const lv = await askButtons(H), lvText = await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
    expect(lv.join("|") === "初級|中級|上級|超上級|やめる" && /難しさ/.test(lvText) && /X-Wing/.test(lvText), "難しさ 4つ " + lv + " / " + lvText);
    const fit = await H.eval(() => { const r = [...document.querySelectorAll(".dlg-shade.ask .choices .btn, .dlg-shade.ask .dialog")].map((e) => e.getBoundingClientRect()); return r.every((b) => b.left >= 0 && b.right <= innerWidth + 0.5 && b.top >= 0 && b.bottom <= innerHeight + 0.5) && document.documentElement.scrollWidth <= innerWidth; });
    expect(fit, "難しさの えらびが 画面に おさまる");
    await H.shot("levels");
    await H.page.getByRole("button", { name: "中級", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
    expect(/ようこそ チク/.test(await dlgText(H)), "はじめの あいさつ");
    await H.page.locator(".dlg-shade:not(.ask)").dispatchEvent("pointerup"); await H.page.locator(".dlg-next:not(.hidden)").waitFor({ timeout: 12000 });
    expect(/9×9/.test(await dlgText(H)), "ナンプレの せつめい " + (await dlgText(H)));
    await H.dialogs(); await work(H); await H.wait(300);
    // 2. 盤
    let m = await H.dbg("mg"), o = m.order;
    expect(m.shop === "kobo" && m.variant === "numpla" && m.total === 1 && o.lv === "normal" && !o.resumed && o.mistakes === 0 && o.blank >= 48 && o.blank <= 52, "中級の 問題 " + JSON.stringify({ total: m.total, lv: o.lv, blank: o.blank }));
    expect(o.cellCss >= 38 && o.grid.cx >= 0 && o.grid.cx + o.grid.size <= viewport.width + 0.5, "盤は よこ いっぱい（1マス " + o.cellCss.toFixed(1) + "px）");
    expect(m.buttons.map((b) => b.label).join() === "1,2,3,4,5,6,7,8,9,消す,メモ,戻す,ヒント", "ボタン " + m.buttons.map((b) => b.label));
    const ui = await H.eval(() => { const b = document.querySelector(".home-shortcut").getBoundingClientRect(); return { bottom: b.bottom, h: b.height }; });
    expect(ui.bottom <= o.grid.cy && ui.h >= 44, "やめる ボタンは 盤の うえ（かさならない） " + JSON.stringify(ui) + " " + o.grid.cy);
    const e0 = o.empty[0], e1 = o.empty[1], e2 = o.empty[2];
    await H.tap(e0.cx, e0.cy); await H.wait(100); await press(H, String(e0.d));
    await H.tap(e1.cx, e1.cy); await H.wait(100); await press(H, String((e1.d % 9) + 1));
    o = await order(H);
    expect(o.filled === 1 && o.mistakes === 1 && o.val[e1.i] !== "." && o.val[e1.i] !== String(e1.d), "正しい 数字・まちがい（赤く のこる・ミス 1） " + JSON.stringify({ f: o.filled, m: o.mistakes }));
    await H.tap(e2.cx, e2.cy); await H.wait(100); await press(H, "メモ");
    for (const d of ["2", "5", "8"]) await press(H, d);
    o = await order(H);
    expect(o.memoMode && o.memo[e2.i] === ((1 << 2) | (1 << 5) | (1 << 8)), "メモ（2・5・8） " + o.memo[e2.i]);
    await press(H, "メモ ON"); await H.shot("play"); // メモの ときは「メモ ON」
    await H.tap(e1.cx, e1.cy); await H.wait(100); await press(H, "ヒント");
    o = await order(H);
    expect(o.hints === 1 && o.val[e1.i] === String(e1.d) && o.filled === 2 && /ここは/.test(o.tip), "ヒント: えらんだ マスに 正しい 数字 " + JSON.stringify({ h: o.hints, tip: o.tip }));
    // ヒントの 数字が e2 の となりなら、e2 の メモから その 数字が きえる（js/mg-numpla.js の placed）
    const memo2 = o.memo[e2.i];
    const want = (1 << 2) | (1 << 5) | (1 << 8);
    expect(memo2 === want || memo2 === (want & ~(1 << e1.d)), "ヒントの あとの メモ " + memo2);
    await H.wait(200); await H.shot("hint");
    // 3. とちゅうで やめる → 続きから
    await H.page.getByRole("button", { name: "おてつだいを やめる", exact: true }).click();
    await H.page.getByRole("button", { name: "ここで やめる", exact: true }).waitFor({ timeout: 8000 });
    expect(/続き/.test(await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "")), "やめる ときに 続きから できると いう");
    await H.page.getByRole("button", { name: "ここで やめる", exact: true }).click();
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000);
    expect(/続きから/.test(await H.eval(() => document.querySelector(".modal-wrap .panel-body").textContent)), "けっかに「続きから できるよ」");
    await H.shot("stop");
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    let np = await H.dbg("numpla");
    expect(np.cont && np.cont.lv === "normal" && np.cont.miss === 1 && np.cont.hint === 1 && np.cont.filled === 2 && np.cont.valid && np.lv === "normal" && np.n.normal === 1, "とちゅうの 問題が のこる " + JSON.stringify(np));
    const sv = await H.dbg("persistedSave");
    expect(sv.shops.kobo.numpla.cont && sv.shops.kobo.games.numpla === 1 && sv.shops.kobo.last === "numpla", "セーブに のこる " + JSON.stringify(sv.shops.kobo.games));
    await talkWork(H);
    await H.page.getByRole("button", { name: "ナンプレ", exact: true }).click();
    await H.page.getByRole("button", { name: "続きから", exact: true }).waitFor({ timeout: 8000 });
    const rs = await askButtons(H), rsText = await H.eval(() => document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "");
    expect(rs.join("|") === "続きから|新しい問題|やめる" && /とちゅうの ナンプレ/.test(rsText) && /中級/.test(rsText) && /ミス 1/.test(rsText), "続きから を えらべる " + rs + " / " + rsText);
    await H.shot("resume-ask");
    await H.page.getByRole("button", { name: "続きから", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning, 15000);
    await H.dialogs(); await work(H); await H.wait(300);
    o = await order(H);
    expect(o.resumed && o.lv === "normal" && o.mistakes === 1 && o.hints === 1 && o.filled === 2 && o.memo[e2.i] === memo2, "続きから: おなじ 盤・メモ・ミス・ヒント " + JSON.stringify({ r: o.resumed, f: o.filled, m: o.mistakes, h: o.hints }));
    // 4. クリア
    expect((await H.dbg("numplaFill", 1)) === 1, "のこり 1マス まで うめる");
    o = await order(H);
    const last = o.empty[0];
    await H.tap(last.cx, last.cy); await H.wait(100); await press(H, String(last.d));
    await H.until(() => PokaDebug.mg().ranks.length === 1, 10000); await H.wait(250); await H.shot("clear");
    m = await H.dbg("mg");
    expect(m.ranks[0] === 2 && m.earn >= 1500, "ミス 1・ヒント 1 → ○・コイン 1500 いじょう " + JSON.stringify({ r: m.ranks, earn: m.earn, tips: m.tips }));
    await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000);
    const res = await H.eval(() => document.querySelector(".modal-wrap .panel-body").textContent);
    expect(/ナンプレ 中級 クリア 1回目/.test(res) && /ミス 1・ヒント 1/.test(res), "けっかに クリアの きろく " + res);
    await H.shot("result");
    await H.page.getByRole("button", { name: "てんないに もどる", exact: true }).click(); await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 15000);
    np = await H.dbg("numpla");
    const after = await H.dbg("persistedSave");
    expect(!np.cont && np.clear.normal === 1 && np.best.normal > 0 && after.coins >= before.coins + 1500 && after.shops.kobo.plays === 1 && after.shops.kobo.rep >= 21, "クリアの きろく・続きは けす・コイン・ひょうばん（7 × 3） " + JSON.stringify({ np, c: after.coins - before.coins, rep: after.shops.kobo.rep }));
  }, { viewport, timeout: 240000 });
}
