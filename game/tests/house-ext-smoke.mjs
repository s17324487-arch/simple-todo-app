// おうちの そとの カスタマイズと 工務店（js/house-ext*.js・js/koumuten.js・UI-74。オーナーの FB 2026-10-03「お家の外見カスタマイズ機能もつけて。
// それに伴い、工務店をネリカスタウンに追加して、そこでパーツや塗装を購入してカスタマイズできるようにして。」）
// 1. ネリカスタウンの 工務店「ぽかぽか こうむてん」に はいる（斜め上の 館・什器・とうりょうさん）
// 2. うけつけ →「おうちの そとを かえる」→ がめん（おうちの 絵・タブ 11〔UI-91 で たてもの〕・ペンキ 18いろ）→ やね「とんがり」・にわ「ちいさな き」・かべを「さくら」に ためす
//    → 「かって きめる（3900コイン）」→ コインが へる・とうりょうさんの ことば
// 3. やねの みほんを タップ → やねの タブから ひらく → もう もって いる ので「これに きめる」だけ（ただ）→ とじる
// 4. 町の おうちが あたらしい 絵（ひる・よる）・さいかい しても のこる
export async function houseExtSmoke({ scenario, expect }) {
  const advance = async (H) => { for (let i = 0; i < 8; i++) { if (!(await H.page.locator(".dlg-shade:not(.ask)").count())) return; await H.page.locator(".dlg-shade:not(.ask)").last().click({ position: { x: 20, y: 20 } }); await H.wait(350); } };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("house-ext-" + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg("hour", 12); await H.dbg("weather", "clear");
    const coins0 = await H.eval(() => { Save.d.coins = 20000; UI.updateHud(); return Save.d.coins; });
    // 1. 工務店
    expect(await H.dbg("venue", "koumuten"), "工務店に はいれない");
    await H.until(() => PokaDebug.state().scene === "venue" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000);
    await H.until(() => PokaDebug.venueIso()?.ready, 20000); await H.idle();
    const vs = await H.dbg("venueState");
    expect(vs && vs.fixtures.some((f) => f.label === "ペンキの たな") && vs.fixtures.some((f) => f.label === "くまの とうりょう ガンさん") && vs.fixtures.some((f) => f.label === "もけいの おうち"), "工務店の 什器が ない " + JSON.stringify(vs && vs.fixtures.map((f) => f.label)));
    await H.shot("koumuten");
    // 2. うけつけ → がめん → ためす → かって きめる
    expect(await H.dbg("venueVisit", "うけつけ"), "うけつけへ いけない");
    await page.locator(".dlg-shade.ask .choices .btn").first().waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "おうちの そとを かえる", exact: true }).click();
    await page.locator(".hx-panel").waitFor({ timeout: 8000 });
    let ui = (await H.dbg("exterior")).ui;
    expect(ui.open && ui.tab === "paint" && !ui.dirty && (await page.locator(".hx-tab").count()) === 11 && (await page.locator(".hx-swatch").count()) === 18 && (await page.locator(".hx-preview svg").count()) === 1, "がめんの かたち " + JSON.stringify(ui));
    await H.wait(450); // パネルが したから でて くる うごきが おわってから はかる
    const box = await page.locator(".hx-panel").boundingBox(), go0 = await page.locator(".hx-go").boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= viewport.width + 1 && go0 && go0.y + go0.height <= viewport.height && go0.height >= 44, "がめんが はみ出す・ボタンが ちいさい " + JSON.stringify({ box, go0 }));
    await H.shot("ui-paint");
    await page.locator('.hx-tab[data-tab="roof"]').click();
    expect((await page.locator(".hx-card").count()) === 5, "やねは 5しゅ");
    await page.locator('.hx-card[data-cat="roof"][data-id="steep"]').click();
    await page.locator('.hx-tab[data-tab="yard"]').click();
    await page.locator('.hx-card[data-cat="yard"][data-id="tree"]').click();
    await page.locator('.hx-tab[data-tab="paint"]').click();
    await page.locator('.hx-target[data-target="wall"]').click();
    await page.locator('.hx-swatch[data-paint="sakura"]').click();
    ui = (await H.dbg("exterior")).ui;
    expect(ui.dirty && ui.cost === 3900 && ui.draft.parts.roof === "steep" && ui.draft.parts.yard === "tree" && ui.draft.paint.wall === "sakura" && ui.unpaid.length === 3, "ためした ところ " + JSON.stringify(ui));
    expect(/かって きめる/.test(await page.locator(".hx-go").textContent()) && /3,900/.test(await page.locator(".hx-go").textContent()), "かって きめる（3900コイン）");
    await page.locator('.hx-tab[data-tab="roof"]').click();
    await H.shot("ui-try");
    await page.locator(".hx-go").click();
    await page.locator(".hx-panel").waitFor({ state: "detached", timeout: 8000 });
    await page.locator(".dlg-shade:not(.ask)").first().waitFor({ timeout: 8000 });
    expect(/まいど あり/.test(await page.locator(".dlg-shade:not(.ask) .dlg-text").first().textContent()), "とうりょうさんの おれいが ない");
    await advance(H);
    let ex = await H.dbg("exterior");
    expect(ex.custom && ex.parts.roof === "steep" && ex.parts.yard === "tree" && ex.paint.wall === "sakura" && ex.owned.includes("roof:steep") && ex.paints.includes("sakura") && (await H.eval(() => Save.d.coins)) === coins0 - 3900, "かって つけた " + JSON.stringify(ex));
    // 3. やねの みほん → やねの タブ → まるやね を ためして もどす → いまの まま（ただ）
    await H.idle();
    expect(await H.dbg("venueVisit", "やねの みほん"), "やねの みほんへ いけない");
    await page.locator(".hx-panel").waitFor({ timeout: 15000 });
    ui = (await H.dbg("exterior")).ui;
    expect(ui.tab === "roof" && !ui.dirty, "みほんからは その タブ " + JSON.stringify(ui));
    expect(/いまの/.test(await page.locator('.hx-card[data-cat="roof"][data-id="steep"] .hx-price').textContent()), "いまの やねに「いまの」");
    await page.locator('.hx-card[data-cat="roof"][data-id="round"]').click();
    expect((await H.dbg("exterior")).ui.cost === 2200, "まるやねは 2200コイン");
    await page.locator(".hx-reset").click();
    ui = (await H.dbg("exterior")).ui;
    expect(!ui.dirty && (await page.locator(".hx-go").isDisabled()), "もとに もどす と きめられない");
    await page.locator(".hx-panel .close").click();
    await page.locator(".hx-panel").waitFor({ state: "detached", timeout: 8000 });
    await advance(H);
    expect((await H.eval(() => Save.d.coins)) === coins0 - 3900, "ためした だけ では コインは へらない");
    // 4. 町の おうち
    await H.dbg("teleport", "town", 21, 61);
    await H.until(() => PokaDebug.state().scene === "world" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000);
    await H.until(() => PokaDebug.exterior().drawn, 15000);
    await H.wait(600); await H.shot("town-day");
    await H.dbg("hour", 21); await H.wait(1200);
    expect(await H.eval(() => [...SvgCache.map.keys()].some((k) => k.startsWith("w:house_ext:" + JSON.stringify({ ext: HouseExt.key(), night: true })))), "よるの おうちの 絵");
    await H.shot("town-night");
    await H.dbg("save"); await page.reload(); await page.getByRole("button", { name: "つづきから", exact: true }).click(); await H.idle();
    ex = await H.dbg("exterior");
    expect(ex.custom && ex.parts.roof === "steep" && ex.paint.wall === "sakura" && ex.owned.length === 2, "さいかい しても のこる " + JSON.stringify(ex));
  }, { viewport, timeout: 150000 });
}
