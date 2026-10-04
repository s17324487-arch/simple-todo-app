// びようしつ・おはなやさんの しなもの（js/salon-goods.js・js/florist-goods.js・UI-77）
// 1. びようしつ: 店員と はなす →「かいものを する」→ リボン 6 → ヘアアクセ 10 → 「ほしの カチューシャ」を かう（服の かずが ふえる・セーブ）→「きる！」
// 2. おはなやさん: はちうえ 6 → 「ぼんさい」を かう → はな・かざり 5 → 「ばらの かびん」を かう
// 3. おうちで カチューシャを つけて いる → かった うえきを おく → さわると 3人が ひとこと
export async function salonFloristSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("salon-florist-" + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.dbg("coins", 9000);
    const look = () => H.eval(() => {
      const cards = [...document.querySelectorAll(".modal-wrap .grid .card")];
      return {
        tabs: [...document.querySelectorAll(".modal-wrap .tabs .tab")].map((b) => b.textContent),
        names: cards.map((c) => c.querySelector(".price")?.previousElementSibling?.textContent || ""),
        fit: cards.every((c) => { const r = c.getBoundingClientRect(), t = c.querySelector(".price").previousElementSibling.getBoundingClientRect(); return t.left >= r.left - 1 && t.right <= r.right + 1; }),
        over: document.documentElement.scrollWidth > innerWidth,
      };
    });
    const openShop = async (shop) => {
      const map = await H.eval((id) => { for (const [m, d] of Object.entries(MAP_DEFS)) if ((d.buildings || []).some((b) => b.act && b.act.shop === id)) return m; return null; }, shop);
      expect(map, shop + " の 町が ない");
      await H.dbg("store", shop, map);
      await H.until(() => PokaDebug.state().scene === "store" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000); await H.wait(400);
      await page.getByRole("button", { name: "てんいんと はなす", exact: true }).click(); await page.getByRole("button", { name: "かいものを する", exact: true }).click();
      await page.locator(".modal-wrap .grid .card").first().waitFor({ timeout: 15000 }); await H.wait(300);
    };
    const buy = async (name) => { await page.locator(".modal-wrap .grid .card").filter({ hasText: name }).first().click(); await page.getByRole("button", { name: "かう", exact: true }).click(); await H.wait(300); };
    const close = async () => { await page.locator(".modal-wrap .close").last().click(); await H.until(() => !document.querySelector(".modal-wrap") && PokaDebug.idle(), 8000); };
    // 1. びようしつ
    let want = await H.dbg("shopGoods", "groom");
    expect(want && want.total === 16 && want.tabs.map((t) => t.ids.length).join() === "6,10", "びようしつの しなぞろえ " + JSON.stringify(want));
    await openShop("groom");
    let v = await look();
    expect(v.tabs.join() === "リボン,ヘアアクセ" && v.names.length === 6 && v.fit && !v.over, "びようしつ リボン " + JSON.stringify(v));
    await page.locator(".modal-wrap .tabs .tab").nth(1).click(); await H.wait(300);
    v = await look();
    expect(v.names.length === 10 && v.names.includes("ほしの カチューシャ") && v.fit && !v.over, "びようしつ ヘアアクセ " + JSON.stringify(v));
    await H.shot("salon");
    let before = await H.dbg("saveData");
    const bandPrice = await H.eval(() => ITEM_INDEX.salon_starband.price);
    await buy("ほしの カチューシャ");
    await page.getByRole("button", { name: "きる！", exact: true }).click(); await H.wait(300); // かった あとの「いま きる？」
    let saved = await H.dbg("persistedSave");
    expect(saved.coins === before.coins - bandPrice && (await H.dbg("wearStock", "salon_starband")).count === 1, "カチューシャが かえない " + JSON.stringify({ c: [before.coins, saved.coins, bandPrice], s: await H.dbg("wearStock", "salon_starband") }));
    await close();
    // 2. おはなやさん
    want = await H.dbg("shopGoods", "florist");
    expect(want && want.total === 11 && want.tabs.map((t) => t.ids.length).join() === "6,5", "おはなやさんの しなぞろえ " + JSON.stringify(want));
    await openShop("florist");
    v = await look();
    expect(v.tabs.join() === "はちうえ,はな・かざり" && v.names.length === 6 && v.names.includes("ぼんさい") && v.fit && !v.over, "おはなやさん はちうえ " + JSON.stringify(v));
    await H.shot("florist");
    before = await H.dbg("saveData");
    await buy("ぼんさい");
    await page.locator(".modal-wrap .tabs .tab").nth(1).click(); await H.wait(300);
    v = await look();
    expect(v.names.length === 5 && v.names.includes("ばらの かびん") && v.fit && !v.over, "おはなやさん はな・かざり " + JSON.stringify(v));
    await buy("ばらの かびん");
    saved = await H.dbg("persistedSave");
    const cost = await H.eval(() => FURN_INDEX.flo_bonsai.price + FURN_INDEX.flo_rosevase.price);
    expect(saved.coins === before.coins - cost && saved.furn.flo_bonsai === 1 && saved.furn.flo_rosevase === 1, "うえきが かえない " + JSON.stringify({ c: [before.coins, saved.coins, cost], f: saved.furn }));
    await close();
    // 3. おうちで おく・さわる・カチューシャ
    await H.dbg("house"); await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle(), 15000); await H.wait(300);
    { const sd = await H.dbg("saveData"), o = sd.chars[sd.order[0]].outfit; expect([o.head, o.head2].includes("salon_starband"), "カチューシャを つけて いない " + JSON.stringify(o)); }
    await H.dbg("homeLayout", [{ id: "flo_bonsai", x: 150, y: 300 }, { id: "flo_rosevase", x: 330, y: 300 }]);
    await H.dbg("homeBubbleFixture"); await H.wait(900);
    for (const id of ["flo_bonsai", "flo_rosevase"]) {
      const a = await H.dbg("furnLive", id); expect(a && a.tap, id + ": タップできる 点が ない " + JSON.stringify(a));
      await H.tap(a.tap.x, a.tap.y); await H.wait(400);
      const b = await H.dbg("furnLive", id); expect(b.talk > a.talk, id + ": さわっても 3人が なにも いわない " + JSON.stringify([a, b]));
    }
    await H.wait(900); await H.shot("room");
  }, { viewport, timeout: 150000 });
}
