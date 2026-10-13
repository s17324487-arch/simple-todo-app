// みんなの くじの いれかわる けいひん（js/kuji-net-rotation.js・UI-117。オーナーの 指示 2026-10-12「みんなのくじの景品も2週間で入れ替わるようにしてほしい。…入れ替わりのタイミングは、ひとりの1番くじとずらしてくれ。」）
// つなぎさきは にせの Firebase（tests/online-fake.mjs）。セットは PokaDebug.kujiNetTheme で あたらしい セットに きめる（こよみの けいさんは tools/check-kuji-net-rotation.mjs）
// 0. オンラインに する
// 1. まえの きかんに はじまった みんなの ロット 1（ほかの 人が 2まい）→ ローリソンの たな → みんなの くじ → つぎの ロット 2 に すすむ・「まほうの おしろ」の ボード・
//    「あたらしい くじ … が はいったよ」・いつまで／つぎ・ひとりの くじとの ずれ・むらさきの いろ・はみ出さない
// 2. 1まい（Aしょう）→ まほうつかい ごじ（家具）
// 3. せぶんぶん「りゅうぐうじょう」の ボード
// 4. おうちに あたらしい けいひんを おく（ぬいぐるみ・チェア・なみの ラグ・おきもの・おしろ）→ タップで ぎゅっ
export async function kujiNetRotationSmoke({ scenario, expect }) {
  let fake = null;
  const phase = (H, p, ms = 15000) => H.until((p) => { const u = PokaDebug.kujiUi(); return u && u.open && u.phase === p; }, ms, p);
  const btn = (H, name) => H.page.getByRole("button", { name, exact: true }).click();
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll(".modal-wrap:not(.out) .panel")].pop(), body = pn && pn.querySelector(".panel-body"), rota = document.querySelector(".kuji-rota");
    const bs = pn ? [...pn.querySelectorAll("button")].filter((b) => b.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent),
      rota: rota ? rota.textContent : "", rotaFit: !!rota && r(rota).right <= r(pn).right + 0.5 && r(rota).left >= r(pn).left - 0.5, title: (document.querySelector(".kuji-title") || {}).textContent || "",
      kc: getComputedStyle(document.querySelector(".kuji")).getPropertyValue("--kc").trim(), top: [...document.querySelectorAll(".kuji-top .kuji-card")].map((c) => c.dataset.id).join() };
  });
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + " の 入口が ない");
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(); await H.dbg("walkTo", door.x, door.y);
    await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000); await H.wait(400);
  };
  const tapShelf = async (H, shop) => {
    if (await H.dbg("storeWalkTo", 8, 3)) await H.until(() => { const s = PokaDebug.storeState(); return s && !s.party[0].moving && !s.path; }, 15000);
    await H.wait(700);
    const st = await H.dbg("storeState"), fx = st.fixtures.find((f) => f.kind === "kuji_" + shop);
    await H.tap(fx.cx, fx.cy); await phase(H, "board", 20000); await H.wait(300);
  };
  const closeBoard = async (H) => { await H.page.locator(".modal-wrap:not(.out) .close").last().click(); await H.until(() => !document.querySelector(".modal-wrap") && !PokaDebug.kujiUi().open && PokaDebug.idle(), 8000); };

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("kuji-net-rotation-" + viewport.width, async (H) => {
    if (!fake) fake = await (await import("./online-fake.mjs")).startOnlineFake();
    fake.reset();
    await H.newGameFast(); await H.dbg("hour", 12); await H.dbg("weather", "clear"); await H.dbg("coins", 150000); await H.dbg("kujiFast", 4);
    expect(await H.dbg("kujiNetTheme", "lawson", "mlaw2") && await H.dbg("kujiNetTheme", "sevenbun", "msev2"), "みんなの くじの セットを きめられない");
    expect(await H.dbg("onlineServer", fake.conf) === true, "にせの サーバーに つなげない");
    // 0. オンライン
    await H.phone("みんな");
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await H.until(() => PokaDebug.online().on && !!PokaDebug.online().uid, 10000);
    await H.page.keyboard.press("Escape"); await H.wait(300);
    // 1. まえの きかんに はじまった ロット 1（2まい）
    const E = await H.eval(() => IchibanKuji.NET_EPOCH);
    fake.write("v1/players/otherA", { n: "2-2", t: Date.now() });
    fake.write("v1/kuji/lawson/lots/l1", { n: 2, d: { k0: { u: "otherA", t: E - 7200000 }, k1: { u: "otherA", t: E - 3600000 } } });
    const layout = await H.dbg("townLayout", "town");
    await enterStore(H, layout, "lawson"); await tapShelf(H, "lawson");
    await H.page.locator('.kuji-modes .kuji-mode[data-mode="net"]').click(); await H.wait(200); await H.choose(0);
    await H.until(() => { const n = PokaDebug.kujiNet("lawson"); return PokaDebug.kujiUi().mode === "net" && n.view && n.cur === 2 && n.state === "live"; }, 20000); await H.wait(300);
    let k = await H.dbg("kujiNet", "lawson"), L = await fits(H);
    expect(fake.at("v1/kuji/lawson/cur") === 2 && k.view.no === 2 && k.view.n === 0 && k.view.th === "mlaw2" && k.deluxe.theme === "mlaw2" && k.prev && k.prev.ended && !k.view.stale, "まえの きかんの ロットが つぎへ すすまない " + JSON.stringify({ cur: k.cur, prev: k.prev, th: k.view && k.view.th }));
    expect(L.title === "「ローリソンの まほうの おしろ」" && L.top === "kj_mlaw2_a,kj_mlaw2_b,kj_mlaw2_c" && L.kc === "#5B3FA0", "まほうの おしろの ボード " + JSON.stringify({ t: L.title, top: L.top, kc: L.kc }));
    expect(/あたらしい くじ「まほうの おしろ」が はいったよ！（まえの ロット 1 は おわったよ）/.test(L.rota) && /\d+がつ \d+にち まで。つぎは「.+」（2しゅうかん ごとに いれかわる・ひとりの くじとは 1しゅうかん ずれて いるよ）/.test(L.rota) && L.rotaFit, "いれかわりの しらせ " + L.rota);
    expect(!L.wide && !L.page && !L.small.length, "ボードが はみ出す・ボタンが ちいさい " + JSON.stringify(L.small));
    await H.shot("lawson-board");
    // 2. Aしょう
    fake.kujiT(await H.dbg("kujiNetT", "lawson", "A", Date.now() + 2000));
    await btn(H, "1まい ひく（1000コイン）"); await phase(H, "box", 20000);
    await btn(H, "くじを とる（1まい）"); await phase(H, "tickets");
    await H.page.locator(".kuji-ticket").first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(500);
    await btn(H, "てんいんさんに わたす"); await phase(H, "result"); await H.wait(300);
    await H.shot("lawson-result");
    const d = await H.dbg("saveData");
    expect(d.furn.kj_mlaw2_a === 1 && fake.at("v1/kuji/lawson/lots/l2/n") === 1, "まほうつかい ごじが もらえない " + JSON.stringify(d.furn));
    await closeBoard(H);
    // 3. せぶんぶん
    await btn(H, "おみせを でる"); await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle(), 15000);
    await enterStore(H, layout, "sevenbun"); await tapShelf(H, "sevenbun");
    await H.until(() => { const n = PokaDebug.kujiNet("sevenbun"); return PokaDebug.kujiUi().mode === "net" && n.view && n.state === "live"; }, 20000); await H.wait(300);
    L = await fits(H);
    expect(L.title === "「せぶんぶんの りゅうぐうじょう」" && L.top === "kj_msev2_a,kj_msev2_b,kj_msev2_c" && L.kc === "#1E8A9A" && !L.wide && !L.small.length, "りゅうぐうじょうの ボード " + JSON.stringify({ t: L.title, top: L.top, kc: L.kc }));
    await H.shot("sevenbun-board");
    await closeBoard(H);
    // 4. おうち
    await btn(H, "おみせを でる"); await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle(), 15000);
    for (const id of ["kj_msev2_c", "kj_mlaw2_d1", "kj_msev2_e2", "kj_msev2_g0", "kj_mlaw2_l"]) await H.dbg("furnSet", id, 1);
    await H.dbg("house"); await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle(), 15000); await H.wait(300);
    await H.dbg("homeLayout", [{ id: "kj_msev2_e2", x: 250, y: 470 }, { id: "kj_mlaw2_a", x: 140, y: 330 }, { id: "kj_msev2_c", x: 380, y: 320 }, { id: "kj_mlaw2_d1", x: 300, y: 300 }, { id: "kj_msev2_g0", x: 420, y: 420 }, { id: "kj_mlaw2_l", x: 120, y: 470 }]);
    await H.dbg("homeBubbleFixture"); await H.wait(1200);
    let lv = await H.dbg("furnLive", "kj_mlaw2_a"); expect(lv && lv.tap, "まほうつかい ごじを タップする ところが ない");
    const n0 = lv.n || 0; await H.tap(lv.tap.x, lv.tap.y); await H.wait(160); await H.shot("room");
    await H.wait(400); lv = await H.dbg("furnLive", "kj_mlaw2_a"); expect((lv.n || 0) === n0 + 1, "タップしても うごかない");
  }, { viewport, timeout: 200000 });
}
