// オンライン PR2（E5・UI-95・js/online-rooms.js）: ほかの 人の おうち。つなぎさきは にせの Firebase（tests/online-fake.mjs）
// 1. オンライン → すまほの「みんな」に タブ（ランキング・おうち）→「おうち」: まだ みせて いない
// 2. 「この おへやを みせる」→ たしかめ → サーバーに かべがみ・ゆか・ひろさ・かぐの ならび だけ（v1/rooms・v1/roomlist）
// 3. ほかの 人の おへや（しらない かぐ・__proto__・へんな ばしょ・へんな フィギュア）→「あたらしく する」→ あたらしい じゅん → タップで 3人で おじゃま
//    （UI-97・js/online-visit.js。すまほが とじて おじゃまの 画面・よその おへや・じぶんの おへやは かわらない →「かえる」で おうちへ。くわしくは tests/online-visit-smoke.mjs）
// 4. なまえを かえる → おへやの なまえも かわる・「みせるのを やめる」→ サーバーから きえる・もう いちど みせて「みせた データを けす」→ おへやも きえる
export async function onlineRoomsSmoke({ scenario, expect }) {
  let fake = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitNode = async (fn, ms, what) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return; await sleep(100); } throw new Error("まちきれない: " + what); };
  const menu = async (H) => { await H.page.getByRole("button", { name: "メニュー", exact: true }).click(); await H.page.getByRole("button", { name: "せってい", exact: true }).click(); await H.wait(250); };
  const closeTop = async (H) => { await H.page.locator(".modal-wrap:not(.out)").last().locator(".panel-head .close").click(); await H.wait(260); };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("online-rooms-" + viewport.width, async (H) => {
    if (!fake) fake = await (await import("./online-fake.mjs")).startOnlineFake();
    fake.reset();
    await H.newGameFast(); await H.dbg("hour", 12); await H.page.mouse.click(5, 5);
    expect(await H.dbg("onlineServer", fake.conf) === true, "にせの サーバーに つなげない");
    // 1. オンライン → タブ
    await H.phone("みんな");
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await H.until(() => PokaDebug.online().on && !!PokaDebug.online().uid, 10000);
    const uid = (await H.dbg("online")).uid, code = (await H.dbg("online")).code;
    await H.until(() => document.querySelectorAll(".smaho-body .onl-tab").length === 3 && !!document.querySelector(".smaho-body .onl-board"), 8000);
    expect(JSON.stringify(await H.eval(() => [...document.querySelectorAll(".smaho-body .onl-tab")].map((b) => b.textContent))) === '["ランキング","おうち","ぷりくら"]', "「みんな」の タブ");
    await H.page.locator(".smaho-body .onl-tab", { hasText: "おうち" }).click(); await H.wait(300);
    expect((await H.page.locator(".onl-room-state").textContent()) === "まだ みせて いないよ。" && await H.page.locator(".onl-room-stop").isHidden() && (await H.page.locator(".onl-room-sel").inputValue()) === "main", "おうちの タブの はじめ");
    expect((await H.dbg("online")).watching === null, "おうちの タブでは ランキングを みはらない");
    await waitNode(() => fake.streams === 0, 5000, "おうちの タブでは ランキングの ストリームを とじる");
    await H.until(() => !!document.querySelector(".onl-room-list .onl-empty") && document.querySelector(".onl-room-list .onl-empty").textContent.includes("まだ だれも"), 8000);
    // 2. みせる
    const local = await H.dbg("onlineRoomData", "main");
    expect(local && local.w === "wp_cream" && local.f === "fl_wood" && local.z === "s" && local.k === "main" && local.i.length === 5, "おくる まえの データ " + JSON.stringify(local));
    await H.page.locator(".onl-room-show").click(); await H.wait(200);
    expect((await H.page.locator(".dlg-text").last().textContent()).includes("かべがみ・ゆか・かぐの しゅるいと ばしょ だけ"), "みせる まえに おくる ものを いう");
    await H.choose(0);
    await waitNode(() => !!fake.at("v1/rooms/" + uid) && !!fake.at("v1/roomlist/" + uid), 10000, "おへやが サーバーに とどく");
    const room = fake.at("v1/rooms/" + uid), entry = fake.at("v1/roomlist/" + uid);
    expect(JSON.stringify(Object.keys(room).sort()) === '["f","i","k","n","t","w","z"]' && room.n === code && room.i.length === 5 && room.i.every((o) => Object.keys(o).every((k) => ["a", "x", "y", "r", "s", "g"].includes(k))) && JSON.stringify(room.i) === JSON.stringify(local.i), "サーバーの おへや " + JSON.stringify(room));
    expect(JSON.stringify(Object.keys(entry).sort()) === '["c","k","n","t"]' && entry.c === 5 && entry.k === "main" && entry.n === code && typeof entry.t === "number", "サーバーの いちらん " + JSON.stringify(entry));
    await H.until(() => document.querySelector(".onl-room-state").textContent.startsWith("みせて いるよ（いつもの おへや") && !document.querySelector(".onl-room-stop").hidden && document.querySelectorAll(".onl-room-row.me").length === 1, 8000);
    expect((await H.page.locator(".onl-room-row.me").textContent()).includes("（あなた）") && (await H.page.locator(".onl-room-row.me .onl-sub").textContent()).startsWith("いつもの おへや・かぐ 5こ"), "いちらんの じぶん");
    await H.shot("tab");
    // 3. ほかの 人の おへや
    const stand = await H.eval(() => Object.keys(FigureStand.STANDS)[0]), figs = await H.eval(() => FigureStand.figures().slice(0, 2));
    fake.write("v1/rooms/otherC", { n: "5-7", t: Date.now(), k: "study", w: "wp_star", f: "fl_carpet", z: "e",
      i: { 0: { a: "sofa", x: 300, y: 560 }, 1: { a: "zzz_future", x: 10, y: 10 }, 2: { a: "__proto__", x: 1, y: 1 }, 3: { a: "window", x: 200, y: 110 }, 4: { a: "bookshelf", x: 99999, y: -99999, r: true }, 5: { a: stand, x: 420, y: 420, g: `${figs[0]},<b>,__proto__,${figs[1]}` } } });
    fake.write("v1/roomlist/otherC", { n: "5-7", t: Date.now() + 5000, c: 6, k: "study" });
    await H.page.locator(".onl-room-reload").click();
    await H.until(() => document.querySelectorAll(".onl-room-row").length === 2, 8000);
    const rows = await H.eval(() => [...document.querySelectorAll(".onl-room-row")].map((b) => ({ t: b.textContent, h: b.getBoundingClientRect().height })));
    expect(rows[0].t.includes("わくわく ぺんぎん") && rows[0].t.includes("ひだまりの アトリエ・かぐ 6こ") && rows[1].t.includes("（あなた）") && rows.every((r) => r.h >= 44), "いちらんは あたらしい じゅん・44px " + JSON.stringify(rows));
    const before = await H.dbg("saveData");
    await H.page.locator(".onl-room-row:not(.me)").click();
    await H.until(() => G.sceneName === "visit" && !Game.trans && PokaDebug.visit() && PokaDebug.visit().ready, 20000);
    const v = await H.dbg("visit");
    expect(JSON.stringify(v.items.map((it) => it.id)) === JSON.stringify(["sofa", "window", "bookshelf", stand]) && JSON.stringify(v.items[3].figs.slice(0, 4)) === JSON.stringify([figs[0], null, null, figs[1]]), "しらない かぐ・__proto__・へんな フィギュアは すてる " + JSON.stringify(v.items));
    expect(v.plate === "わくわく ぺんぎんさんの おうちひだまりの アトリエ・かぐ 4こ" && v.size === "expanded" && v.width === 640 && v.uid === "otherC" && v.back.scene === "house", "おじゃまの ひょうさつ・ひろさ・もどる ところ " + JSON.stringify([v.plate, v.size, v.uid, v.back]));
    expect(await H.eval(() => !Smaho.view), "おじゃまに いく とき すまほが とじない");
    expect(v.items.every((it) => [it.rect.x, it.rect.y, it.rect.w, it.rect.h].every(Number.isFinite) && it.rect.w > 4) && v.items.find((it) => it.id === "bookshelf").x <= v.width, "へんな ばしょの かぐは へやの なかに おさめる " + JSON.stringify(v.items.map((it) => [it.id, it.x, it.y])));
    await H.wait(600); await H.shot("visit");
    // おじゃま しても じぶんの おへやは かわらない →「かえる」で おうちへ
    await H.houseButton("かえる");
    await H.until(() => G.sceneName === "house" && !Game.trans, 20000); await H.wait(300);
    const after = await H.dbg("saveData");
    expect(JSON.stringify(after.room) === JSON.stringify(before.room) && JSON.stringify(after.furn) === JSON.stringify(before.furn) && JSON.stringify(after.rooms) === JSON.stringify(before.rooms), "おじゃまで じぶんの おへやが かわった");
    // 4. なまえを かえる → おへやの なまえも
    await menu(H);
    await H.page.locator(".onl-settings .onl-rename").click(); await H.wait(300);
    const sels = H.page.locator(".modal-wrap:not(.out) .onl-nick-sel");
    await sels.nth(0).selectOption("1"); await sels.nth(1).selectOption("1"); await H.wait(100);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await waitNode(() => fake.at(`v1/rooms/${uid}/n`) === "1-1" && fake.at(`v1/roomlist/${uid}/n`) === "1-1", 10000, "おへやの なまえも かわる");
    await closeTop(H);
    // みせるのを やめる（タブは おぼえて いる）
    await H.phone("みんな");
    await H.until(() => !!document.querySelector(".smaho-body .onl-room-stop") && !document.querySelector(".smaho-body .onl-room-stop").hidden, 8000);
    await H.page.locator(".onl-room-stop").click(); await H.choose(0);
    await waitNode(() => !fake.at("v1/rooms/" + uid) && !fake.at("v1/roomlist/" + uid), 10000, "みせるのを やめると サーバーから きえる");
    await H.until(() => document.querySelector(".onl-room-state").textContent === "まだ みせて いないよ。", 5000);
    expect(!(await H.dbg("onlineRooms")).shown, "やめた のに みせて いる");
    // もう いちど みせて → けす（≡）
    await H.page.locator(".onl-room-show").click(); await H.choose(0);
    await waitNode(() => !!fake.at("v1/rooms/" + uid), 10000, "もう いちど みせる");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    await menu(H);
    await H.page.locator(".onl-settings .onl-wipe").click(); await H.choose(0);
    await waitNode(() => !fake.at("v1/rooms/" + uid) && !fake.at("v1/roomlist/" + uid) && !fake.at("v1/players/" + uid), 10000, "けすと おへやも きえる");
    await H.until(() => !PokaDebug.online().uid && !PokaDebug.onlineRooms().shown, 8000);
    await closeTop(H);
  }, { viewport, timeout: 180000 });
  if (fake) await fake.close();
}
