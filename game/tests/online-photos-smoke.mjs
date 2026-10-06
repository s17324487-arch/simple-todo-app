// オンライン PR3（E5・UI-96・js/online-photos.js）: みせると きめた ぷりくらを 見せあう（かくす・ほうこく つき）。つなぎさきは にせの Firebase（tests/online-fake.mjs）
// 1. ぷりくら 3まい（PokaDebug.photoSeed）→ オンライン → すまほの「みんな」の タブ 3つ →「ぷりくら」: まだ だれも
// 2. 「しゃしん」アプリ →「みんなに みせる」→ たしかめ（ゲームの 中の えの データ だけ）→ サーバーには ASCII の データ だけ（ことばは ばんごう）→「みんなに みせるのを やめる」に
// 3. ほかの 人の ぷりくら（へんな ポーズ・ふく・ことば・スタンプ・ほうこく 3にん）→ あたらしい じゅん・3にんの ものは でない・へんな ものは なおして 描く・はみ出さない
// 4. 大きく みる →「ほうこく」→ りゆう → サーバーの かず 1（だれが したかは よめない）→ きえる。「かくす」→「この 人の しゃしん ぜんぶ」→ きえる →「かくした ものを もどす」
// 5. じぶんの しゃしんを 大きく →「みせるのを やめる」→ サーバーから きえる。「しゃしん」アプリで けすと サーバーからも きえる
// 6. 「みせた データを けす」→ じぶんの しゃしん・ほうこく・アカウントが きえる
export async function onlinePhotosSmoke({ scenario, expect }) {
  let fake = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitNode = async (fn, ms, what) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return; await sleep(100); } throw new Error("まちきれない: " + what); };
  const menu = async (H) => { await H.page.getByRole("button", { name: "メニュー", exact: true }).click(); await H.page.getByRole("button", { name: "せってい", exact: true }).click(); await H.wait(250); };
  const closeTop = async (H) => { await H.page.locator(".modal-wrap:not(.out)").last().locator(".panel-head .close").click(); await H.wait(260); };
  const lastDlg = (H) => H.page.locator(".dlg-text").last().textContent();
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("online-photos-" + viewport.width, async (H) => {
    if (!fake) fake = await (await import("./online-fake.mjs")).startOnlineFake();
    fake.reset();
    await H.newGameFast(); await H.dbg("hour", 12); await H.page.mouse.click(5, 5);
    expect(await H.dbg("onlineServer", fake.conf) === true, "にせの サーバーに つなげない");
    const ids = await H.dbg("photoSeed", 3);
    expect(ids.length === 3, "テストの ぷりくら " + ids);
    // 1. オンライン → タブ
    await H.phone("みんな");
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await H.until(() => PokaDebug.online().on && !!PokaDebug.online().uid, 10000);
    const uid = (await H.dbg("online")).uid, code = (await H.dbg("online")).code;
    await H.until(() => document.querySelectorAll(".smaho-body .onl-tab").length === 3, 8000);
    expect(JSON.stringify(await H.eval(() => [...document.querySelectorAll(".smaho-body .onl-tab")].map((b) => b.textContent))) === '["ランキング","おうち","ぷりくら"]', "「みんな」の タブ");
    await H.page.locator(".smaho-body .onl-tab", { hasText: "ぷりくら" }).click(); await H.wait(300);
    await H.until(() => document.querySelector(".onl-photo-grid .onl-empty")?.textContent.includes("まだ だれも"), 8000);
    expect((await H.page.locator(".onl-photos-note").textContent()).includes(`0／8まい`) && (await H.dbg("online")).watching === null, "ぷりくらの タブの はじめ");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    // 2. 「しゃしん」アプリで みせる（いちばん あたらしい しゃしん）
    await H.phone("しゃしん");
    await H.page.locator(".smaho .puri-album .puri-photo").first().click(); await H.wait(400);
    const local = await H.dbg("onlinePhotoData", ids[2]);
    expect(local && /^[\x20-\x7e]*$/.test(JSON.stringify(local)) && /^\d+(\.-?\d+){3,4}(,\d+(\.-?\d+){3,4})*$/.test(local.x), "おくる まえの データ " + JSON.stringify(local));
    await H.page.locator(".onl-puri-btn").click(); await H.wait(200);
    expect((await lastDlg(H)).includes("ゲームの 中の えの データ だけ おくるよ"), "みせる まえに おくる ものを いう");
    await H.choose(0);
    await H.until((id) => !!PokaDebug.onlinePhotos().keys[id], 10000, ids[2]);
    const k2 = (await H.dbg("onlinePhotos")).keys[ids[2]];
    expect(new RegExp(`^${uid}_[a-z0-9]{21}$`).test(k2) && !k2.includes(ids[2].slice(1).split("-")[0]), "サーバーの キーは ランダムな ばんごう（とった じこくが わからない） " + k2);
    await waitNode(() => !!fake.at("v1/photos/" + k2), 10000, "ぷりくらが サーバーに とどく");
    const sent = fake.at("v1/photos/" + k2);
    expect(JSON.stringify(Object.keys(sent).sort()) === '["b","c","e","k","m","n","o","p","r","s","t","x","z"]' && sent.n === code && typeof sent.t === "number" && sent.x === local.x && sent.p === local.p && /^[\x20-\x7e]*$/.test(JSON.stringify(sent)), "サーバーの ぷりくら " + JSON.stringify(sent));
    expect(JSON.stringify(Object.keys(fake.data.v1).sort()) === '["photos","players"]', "ぷりくら いがいを おくった " + Object.keys(fake.data.v1));
    await H.until(() => document.querySelector(".onl-puri-btn")?.textContent === "みんなに みせるのを やめる", 5000);
    const one = await H.eval(() => {
      const b = document.querySelector(".smaho-body"), v = document.querySelector(".puri-viewer").getBoundingClientRect(), btns = [...document.querySelectorAll(".puri-viewer .btn")].map((e) => e.getBoundingClientRect());
      return { over: b.scrollWidth > b.clientWidth + 2, small: btns.filter((r) => r.height < 44).length, out: btns.filter((r) => r.right > v.right + 1 || r.left < v.left - 1).length, below: Math.max(...btns.map((r) => r.bottom)) - b.getBoundingClientRect().bottom };
    });
    expect(!one.over && !one.small && !one.out && one.below <= 1, "しゃしんの まどが はみ出す／ボタンが ちいさい／スクロールしないと みえない " + JSON.stringify(one));
    await H.shot("share");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    // 3. ほかの 人の ぷりくら
    const t = { ".sv": "timestamp" };
    fake.write("v1/photos/otherA_pa-1", { ...local, n: "5-7", t });
    fake.write("v1/photos/otherA_pa-2", { ...local, n: "5-7", t, z: 1 });
    fake.write("v1/photos/otherB_pb-1", { ...local, n: "6-8", t, c: "__proto__.happy,peace.toString,stand.love", o: "soft:head=__proto__|dark:body=nope|soft:", x: "200.1.1.1,999.1.1.1", s: "__proto__.1.1.0,heart.1.1.0" });
    fake.write("v1/photos/otherC_pc-1", { ...local, n: "1-1", t });
    fake.write("v1/reportcount/otherC_pc-1", 3);
    await H.phone("みんな");
    await H.until(() => !!document.querySelector(".onl-photo-reload"), 8000); // タブは おぼえて いる
    await H.page.locator(".onl-photo-reload").click();
    await H.until(() => document.querySelectorAll(".onl-photo-grid .onl-photo").length === 4, 10000);
    let ps = await H.dbg("onlinePhotos");
    const B = ps.list.find((x) => x.key === "otherB_pb-1"), C = ps.list.find((x) => x.key === "otherC_pc-1");
    expect(ps.list.length === 5 && C.hidden && C.count === 3 && !B.hidden && ps.list.find((x) => x.key === k2).hidden === false, "いちらん（3にん ほうこくの ものは でない） " + JSON.stringify(ps.list.map((x) => [x.key, x.hidden, x.count])));
    expect(JSON.stringify(B.c) === '{"wanko":["stand","happy"],"gachan":["stand","happy"],"goji":["stand","love"]}' && JSON.stringify(B.o) === '{"wanko":[{},"soft"],"gachan":[{},"dark"],"goji":[{},"soft"]}' && B.x.length === 0 && JSON.stringify(B.s) === '["heart"]', "へんな ぷりくらを なおす " + JSON.stringify(B));
    await H.until((n) => document.querySelectorAll(".onl-photo-grid .onl-photo canvas").length === n, 5000, 4);
    await H.until(() => [...document.querySelectorAll(".onl-photo-grid .onl-photo canvas")].every((c) => { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 53) s.add(d[i] >> 3); return s.size > 6; }), 15000);
    const grid = await H.eval(() => {
      const b = document.querySelector(".smaho-body"), br = b.getBoundingClientRect(), cells = [...document.querySelectorAll(".onl-photo-grid .onl-photo")].map((e) => e.getBoundingClientRect());
      return { over: b.scrollWidth > b.clientWidth + 2, out: cells.filter((r) => r.left < br.left - 1 || r.right > br.right + 1).length, small: cells.filter((r) => r.height < 44 || r.width < 44).length, me: document.querySelectorAll(".onl-photo.me").length, names: [...document.querySelectorAll(".onl-photo-name")].map((e) => e.textContent), hid: document.querySelector(".onl-photos-hid")?.textContent || "" };
    });
    expect(!grid.over && !grid.out && !grid.small && grid.me === 1 && grid.names.includes("あなた") && grid.names.includes("わくわく ぺんぎん") && grid.hid.includes("1まい"), "ぷりくらの いちらんが はみ出す／ちがう " + JSON.stringify(grid));
    await H.shot("feed");
    // 4. 大きく みる → ほうこく
    await H.page.locator('.onl-photo[data-key="otherB_pb-1"]').click();
    await H.until(() => PokaDebug.onlinePhotos().view?.key === "otherB_pb-1" && PokaDebug.onlinePhotos().view.drawn, 10000);
    await H.wait(400); // まどが したから でて くる アニメが おわってから はかる
    const big = await H.eval(() => {
      const p = [...document.querySelectorAll(".modal-wrap:not(.out) .panel")].pop(), pr = p.getBoundingClientRect(), c = p.querySelector(".onl-photo-big").getBoundingClientRect(), btns = [...p.querySelectorAll(".onl-photo-acts .btn")].map((e) => e.getBoundingClientRect());
      return { title: p.querySelector(".panel-title").textContent, cap: p.querySelector(".onl-photo-cap").textContent, p: [pr.left, pr.top, pr.right, pr.bottom], c: [c.left, c.right, c.width], w: innerWidth, h: innerHeight, btn: btns.map((r) => [r.width, r.height, r.bottom]), over: document.documentElement.scrollWidth > innerWidth, labels: [...p.querySelectorAll(".onl-photo-acts .btn")].map((e) => e.textContent) };
    });
    expect(big.title === "ぴかぴか りすさんの ぷりくら" && big.cap.includes("ぴかぴか りす"), "大きく みる まどの なまえ " + JSON.stringify([big.title, big.cap]));
    expect(big.p[0] >= -0.5 && big.p[2] <= big.w + 0.5 && big.c[0] >= big.p[0] - 0.5 && big.c[1] <= big.p[2] + 0.5 && big.c[2] >= 150 && big.btn.every(([w, h, b]) => h >= 44 && w >= 44 && b <= big.h + 0.5) && !big.over && JSON.stringify(big.labels) === '["かくす","ほうこく"]', "大きく みる まどが はみ出す " + JSON.stringify(big));
    await H.shot("view");
    await H.page.locator(".modal-wrap:not(.out) .onl-photo-report").click(); await H.wait(200);
    expect((await lastDlg(H)).includes("だれが ほうこくしたかは ほかの 人には わからないよ"), "ほうこくの せつめい");
    await H.choose(0);
    await waitNode(() => fake.at("v1/reportcount/otherB_pb-1") === 1 && fake.at(`v1/reportlog/otherB_pb-1/${uid}`) === "bad", 10000, "ほうこくが とどく");
    await H.until(() => !document.querySelector('.onl-photo[data-key="otherB_pb-1"]') && !document.querySelector(".onl-photo-panel"), 8000);
    expect((await H.dbg("onlinePhotos")).rep["otherB_pb-1"] === "bad", "ほうこくした きろく");
    // かくす → この 人の しゃしん ぜんぶ → もどす
    await H.page.locator('.onl-photo[data-key="otherA_pa-1"]').click();
    await H.until(() => PokaDebug.onlinePhotos().view?.key === "otherA_pa-1", 8000);
    await H.page.locator(".modal-wrap:not(.out) .onl-photo-hide").click(); await H.wait(200);
    expect((await lastDlg(H)).includes("じぶんの すまほ だけ"), "かくすの せつめい");
    await H.choose(1);
    await H.until(() => !document.querySelector('.onl-photo[data-key="otherA_pa-1"]') && !document.querySelector('.onl-photo[data-key="otherA_pa-2"]') && !!document.querySelector(".onl-photo-unhide"), 8000);
    ps = await H.dbg("onlinePhotos");
    expect(JSON.stringify(ps.hideU) === '["otherA"]', "この 人の しゃしんを かくす " + JSON.stringify(ps.hideU));
    await H.page.locator(".onl-photo-unhide").click();
    await H.until(() => !!document.querySelector('.onl-photo[data-key="otherA_pa-1"]') && !document.querySelector('.onl-photo[data-key="otherB_pb-1"]') && !document.querySelector('.onl-photo[data-key="otherC_pc-1"]'), 8000);
    // 5. じぶんの しゃしんを やめる
    await H.page.locator(`.onl-photo[data-key="${k2}"]`).click();
    await H.until((k) => PokaDebug.onlinePhotos().view?.key === k, 8000, k2);
    expect(JSON.stringify(await H.eval(() => [...document.querySelectorAll(".modal-wrap:not(.out) .onl-photo-acts .btn")].map((e) => e.textContent))) === '["みせるのを やめる"]', "じぶんの しゃしんは ほうこく・かくす が ない");
    await H.page.locator(".modal-wrap:not(.out) .onl-photo-stop").click(); await H.choose(0);
    await waitNode(() => !fake.at("v1/photos/" + k2), 10000, "やめると サーバーから きえる");
    await H.until((k) => !document.querySelector(`.onl-photo[data-key="${k}"]`) && document.querySelectorAll(".onl-photo-grid .onl-photo").length === 2, 8000, k2);
    await H.page.keyboard.press("Escape"); await H.wait(300);
    // 「しゃしん」アプリで みせて → けす → サーバーからも
    await H.phone("しゃしん");
    await H.page.locator(".smaho .puri-album .puri-photo").nth(1).click(); await H.wait(400); // ids[1]
    await H.page.locator(".onl-puri-btn").click(); await H.choose(0);
    await H.until((id) => !!PokaDebug.onlinePhotos().keys[id], 10000, ids[1]);
    const k1 = (await H.dbg("onlinePhotos")).keys[ids[1]];
    expect(k1 !== k2 && new RegExp(`^${uid}_[a-z0-9]{21}$`).test(k1), "2まいめは べつの ばんごう " + k1);
    await waitNode(() => !!fake.at("v1/photos/" + k1), 10000, "2まいめを みせる");
    await H.page.getByRole("button", { name: "けす", exact: true }).click(); await H.choose(0);
    await waitNode(() => !fake.at("v1/photos/" + k1), 10000, "「しゃしん」アプリで けすと サーバーからも きえる");
    ps = await H.dbg("onlinePhotos");
    expect(!ps.shown.includes(ids[1]) && !(ids[1] in ps.sid) && !(await H.dbg("photos")).some((p) => p.id === ids[1]), "けした しゃしんの きろく（ばんごうも わすれる） " + JSON.stringify(ps.sid));
    // 6. みせて → けす（≡）
    await H.page.getByRole("button", { name: "いちらん", exact: true }).click(); await H.wait(300);
    await H.page.locator(".smaho .puri-album .puri-photo").first().click(); await H.wait(400); // ids[2]
    await H.page.locator(".onl-puri-btn").click(); await H.choose(0);
    await waitNode(() => !!fake.at("v1/photos/" + k2), 10000, "もう いちど みせる（おなじ ばんごう）");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    await menu(H);
    await H.page.locator(".onl-settings .onl-wipe").click(); await H.choose(0);
    await waitNode(() => !fake.at("v1/photos/" + k2) && !fake.at("v1/players/" + uid) && fake.at("v1/reportcount/otherB_pb-1") === 0 && fake.at(`v1/reportlog/otherB_pb-1/${uid}`) === null && !fake.users.includes(uid), 10000, "けすと ぷりくらと ほうこくも きえる");
    await H.until(() => !PokaDebug.online().uid && !PokaDebug.onlinePhotos().shown.length, 8000);
    ps = await H.dbg("onlinePhotos");
    expect(JSON.stringify(ps.rep) === "{}" && ps.hide.includes("otherB_pb-1") && fake.at("v1/photos/otherA_pa-1"), "けした あと（ほうこくした ものは かくした まま・ほかの 人の しゃしんは のこる） " + JSON.stringify(ps));
    await closeTop(H);
  }, { viewport, timeout: 180000 });
  if (fake) await fake.close();
}
