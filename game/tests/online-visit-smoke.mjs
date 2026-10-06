// おじゃま（E5・UI-97・js/online-visit.js）: ほかの 人の おうちに 3人で おじゃまして、おうちと おなじ ように あるく・さわる・あそぶ・かえる。
// サーバーは つかわない（PokaDebug.visitRoom で よんだ ことに する。すまほの「みんな」→「おうち」から いく ながれは tests/online-rooms-smoke.mjs）。
// 1. まちから おじゃま: ひょうさつ（だれの おうち・おへや・かぐの かず）・ボタン 4つ（44px いじょう）・はみ出さない・すまほの ボタン
// 2. 3人は ひだりの ドアから はいって、家具を よけて あるく（家具の 足もとに とまらない）・「おじゃまします！」・ピンチで ズーム
// 3. なでる → よろこぶ・なでなでの きろく +1。さわれる 家具（ランプ）→ つく・ひとこと。フィギュア だい → まどは ださない・フィギュアは そのまま
// 4. ボールあそび（ひょうさつ・ボタンが かくれて もどる）・かくれんぼ（かくれる ばしょは よその おへやの 家具か ドア → ぜんぶ みつける）
// 5. ひだりの ドア →「かえる？」→ まだ いる。「かえる」→ もとの まちの おなじ ばしょ・じぶんの おへや／セーブの おへやは かわらない・ひろさも もとどおり
export async function onlineVisitSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("online-visit-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 12); await H.page.mouse.click(5, 5);
    // まちへ
    await H.houseButton("おでかけ");
    await H.until(() => G.sceneName === "world" && !Game.trans, 20000); await H.wait(500);
    const from = await H.dbg("state"), before = await H.dbg("saveData"), pats0 = (await H.dbg("records")).kids;
    expect(from.scene === "world" && Array.isArray(from.pos), "まちに でられない " + JSON.stringify(from));
    // 1. おじゃま
    const stand = await H.eval(() => Object.keys(FigureStand.STANDS)[0]), figs = await H.eval(() => FigureStand.figures().slice(0, 2));
    const room = { n: "5-7", t: Date.now(), k: "study", w: "wp_star", f: "fl_carpet", z: "s",
      i: [{ a: "sofa", x: 300, y: 560 }, { a: "lamp", x: 150, y: 300 }, { a: "bookshelf", x: 330, y: 290 }, { a: stand, x: 430, y: 440, g: `${figs[0]},,${figs[1]}` },
        { a: "plant", x: 420, y: 300 }, { a: "window", x: 190, y: 116 }, { a: "clock", x: 330, y: 95 }] };
    expect(await H.dbg("visitRoom", room, "hostV") === true, "おじゃまに いけない");
    await H.until(() => G.sceneName === "visit" && !Game.trans && PokaDebug.visit() && PokaDebug.visit().ready, 20000);
    let v = await H.dbg("visit");
    expect(v.host === "わくわく ぺんぎん" && v.plate === "わくわく ぺんぎんさんの おうちひだまりの アトリエ・かぐ 7こ" && v.kind === "study" && v.size === "standard" && v.wall === "wp_star", "ひょうさつ " + JSON.stringify([v.plate, v.kind]));
    expect(JSON.stringify(v.back) === JSON.stringify({ scene: "world", p: { map: from.map, x: from.pos[0], y: from.pos[1], dir: v.back.p.dir } }), "もどる ところ " + JSON.stringify(v.back));
    expect(JSON.stringify(v.buttons.map((b) => b.label)) === '["ごはん","あそぶ","きがえ","かえる"]', "ボタン " + JSON.stringify(v.buttons.map((b) => b.label)));
    const look = await H.eval(() => { const h = document.querySelector(".hud").getBoundingClientRect(); return { w: innerWidth, h: innerHeight, over: document.documentElement.scrollWidth > innerWidth, hud: h.bottom, place: document.querySelector(".hud .place").classList.contains("hidden") }; });
    expect(v.buttons.every((b) => b.w >= 44 && b.h >= 44 && b.x >= -0.5 && b.x + b.w <= look.w + 0.5 && b.y + b.h <= look.h + 0.5), "ボタンが 44px より ちいさい・はみ出す " + JSON.stringify(v.buttons));
    expect(v.plateBox.x >= 0 && v.plateBox.x + v.plateBox.w <= look.w && v.plateBox.y >= look.hud - 2 && v.plateBox.h < 70 && !look.over && look.place, "ひょうさつが はみ出す・HUD に かさなる " + JSON.stringify([v.plateBox, look]));
    await H.until(() => !!PokaDebug.smahoState().button, 5000); // すまほの ボタンは 250ms ごとに おく
    const sm = await H.dbg("smahoState");
    expect(sm.button && sm.button.y + sm.button.h <= v.barBox.y + 1, "すまほの ボタンが ない・ボタンに かさなる " + JSON.stringify([sm.button, v.barBox]));
    // 2. ドアから はいって 家具を よけて あるく
    expect(v.chars.length === 3 && v.chars.every((c) => c.x < 60), "3人は ドアの まえから " + JSON.stringify(v.chars.map((c) => [c.x, c.y])));
    await H.until(() => PokaDebug.visit().chars.every((c) => c.state !== "walk") && PokaDebug.visit().chars.some((c) => c.x > 100), 15000);
    const nav = await H.dbg("homeNav");
    expect(nav && nav.feet.length === 5 && !nav.feet.some((f) => f.id === "stairs") && nav.actors.every((a) => !a.inside), "家具の 足もとに 3人が いる・よその 家具で ない " + JSON.stringify(nav && nav.actors));
    await H.until(() => PokaDebug.visit().log.some((l) => l.text.includes("おじゃまします")), 8000);
    await H.wait(1200); await H.shot("visit");
    // ズーム（おうちと おなじ ピンチ）
    const cv = await H.eval(() => { const r = document.getElementById("screen").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; });
    await H.pinch(cv.x, cv.y, 80, 200);
    expect((await H.dbg("visit")).zoom > 1.3, "ピンチで ズーム できない");
    await H.pinch(cv.x, cv.y, 220, 40); await H.pinch(cv.x, cv.y, 220, 40);
    expect((await H.dbg("visit")).zoom === 1, "ズームが もどらない");
    // 3. なでる・さわる（とめて いる あいだは タップを うけつけない ので とめない）
    v = await H.dbg("visit");
    const kid = v.chars.slice().sort((a, b) => b.y - a.y)[0]; // いちばん てまえ（ほかの 子の うしろに かくれない）
    await H.tap(kid.rect.x + kid.rect.w / 2, kid.rect.y + kid.rect.h * 0.55); await H.wait(200);
    v = await H.dbg("visit");
    const pats1 = (await H.dbg("records")).kids;
    const petted = v.chars.filter((c) => c.state === "jump").map((c) => c.id);
    expect(petted.length === 1 && pats1[petted[0]].pat === pats0[petted[0]].pat + 1, "なでても よろこばない・きろくが ふえない " + JSON.stringify([petted, pats0, pats1]));
    await H.wait(1500);
    const lamp0 = await H.dbg("furnLive", "lamp");
    expect(lamp0 && lamp0.tap && lamp0.on === false, "ランプを タップ できない " + JSON.stringify(lamp0));
    await H.tap(lamp0.tap.x, lamp0.tap.y); await H.wait(250);
    const lamp1 = await H.dbg("furnLive", "lamp");
    expect(lamp1.on === true && lamp1.talk > lamp0.talk, "よその ランプが つかない・3人が なにも いわない " + JSON.stringify([lamp0, lamp1]));
    const st0 = await H.dbg("furnLive", stand);
    expect(st0 && st0.tap, "フィギュア だいを タップ できない");
    await H.tap(st0.tap.x, st0.tap.y); await H.wait(400);
    const st1 = await H.dbg("furnLive", stand), modals = await H.eval(() => document.querySelectorAll(".modal-wrap:not(.out)").length);
    v = await H.dbg("visit");
    expect(modals === 0 && st1.talk > st0.talk && JSON.stringify(v.items.find((it) => it.id === stand).figs) === JSON.stringify([figs[0], null, figs[1]]), "よその フィギュア だいで まどが ひらいた・フィギュアが かわった " + JSON.stringify([modals, v.items.find((it) => it.id === stand).figs]));
    // 4. ボールあそび
    const mood0 = (await H.dbg("saveData")).chars;
    await H.houseButton("あそぶ"); await H.choose(1);
    await H.until(() => PokaDebug.visit().mode === "ball" && PokaDebug.visit().hidden, 5000);
    for (let k = 0; k < 2; k++) { const b = (await H.dbg("visit")).ball; if (b) await H.tap(b.x, b.y); await H.wait(260); }
    await H.shot("ball");
    await H.until(() => !PokaDebug.visit().mode && !PokaDebug.visit().hidden, 30000);
    const mood1 = (await H.dbg("saveData")).chars;
    expect(Object.keys(mood1).some((id) => mood1[id].mood > mood0[id].mood || mood0[id].mood >= 100), "ボールあそびで ごきげんが ふえない");
    // かくれんぼ: よその おへやの 家具か ドアに かくれる
    await H.houseButton("あそぶ"); await H.choose(0);
    await H.until(() => PokaDebug.visit().mode === "hide", 10000);
    v = await H.dbg("visit");
    expect(v.hide && v.hide.spots.length === 3 && v.hide.spots.every((s) => s.door || /^v\d+$/.test(s.uid)), "かくれる ばしょが よその おへやで ない " + JSON.stringify(v.hide));
    await H.shot("hide");
    for (const sp of v.hide.spots) {
      if (!(await H.dbg("visit")).hide || (await H.dbg("visit")).mode !== "hide") break;
      const now = (await H.dbg("visit")).hide.spots.find((s) => s.id === sp.id);
      if (now) { await H.tap(now.rect.x + now.rect.w / 2, now.rect.y + now.rect.h / 2); await H.wait(350); }
    }
    await H.until(() => !PokaDebug.visit().mode && !PokaDebug.visit().hidden && PokaDebug.visit().chars.every((c) => !c.hidden), 15000);
    // 5. ドア →「かえる？」→ まだ いる（3人は ドアから はなれて もらう）
    for (const [i, id] of ["wanko", "gachan", "goji"].entries()) await H.dbg("homeWalk", id, 200 + i * 50, 420 + (i % 2) * 40);
    await H.until(() => PokaDebug.visit().chars.every((c) => c.state !== "walk"), 15000);
    v = await H.dbg("visit");
    expect(v.chars.every((c) => c.x > 120), "3人が ドアから はなれない " + JSON.stringify(v.chars.map((c) => [c.x, c.y])));
    await H.tap(v.door.x + v.door.w * 0.5, v.door.y + v.door.h * 0.45); await H.wait(250);
    const ask = await H.eval(() => [...document.querySelectorAll(".dlg-text")].pop()?.textContent || "");
    expect(ask.includes("おうちを でて かえる？"), "ドアで かえるか きかない " + ask);
    await H.choose(1); await H.wait(300);
    expect((await H.eval(() => G.sceneName)) === "visit", "まだ いる のに かえった");
    // かえる → もとの まち
    await H.houseButton("かえる");
    await H.until(() => G.sceneName === "world" && !Game.trans, 20000); await H.wait(300);
    const back = await H.dbg("state"), after = await H.dbg("saveData");
    expect(back.map === from.map && JSON.stringify(back.pos) === JSON.stringify(from.pos), "もとの ばしょに もどらない " + JSON.stringify([from, back]));
    expect(JSON.stringify(after.room) === JSON.stringify(before.room) && JSON.stringify(after.rooms) === JSON.stringify(before.rooms) && JSON.stringify(after.furn) === JSON.stringify(before.furn), "じぶんの おへや・かぐが かわった");
    expect(await H.eval(() => HomeDesign.guestSize === null && ROOM.W === HomeDesign.sizes.standard.w), "おうちの ひろさが もどらない");
    expect(await H.dbg("visit") === null, "おじゃまが おわらない");
  }, { viewport, timeout: 180000 });
}
