// たべものの おみせの しなもの（js/shop-goods.js・UI-76。オーナーの FB 2026-10-03「各お店の売っているものが種類が少なく見た目もチープなので、作り直してほしい」）
// 5けん（ケーキ・クレープ・パン・ころころ フルーツ・ガソリンスタンド）それぞれ:
// 1. 店員と はなす →「かいものを する」→ 2つの タブ・しなものの かず（PokaDebug.shopGoods と おなじ）・アイコン 56・よこに はみださない・なまえが カードに おさまる
// 2. あたらしい しなものを 1つ かう → コインが へって もちものが ふえる（セーブに のこる）
// 3. 2つめの タブに きりかえる → しなものが かわる
export async function shopGoodsSmoke({ scenario, expect }) {
  const SHOPS = [["cake", "deza_montblanc"], ["crepe", "crepe_berry"], ["bakery", "bread_croissant"], ["korokoro", "fruit_peach"], ["gasstand", "drink_tea"]];
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("shop-goods-" + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.dbg("coins", 5000);
    for (const [shop, buy] of SHOPS) {
      const map = await H.eval((id) => { for (const [m, d] of Object.entries(MAP_DEFS)) if ((d.buildings || []).some((b) => b.act && b.act.shop === id)) return m; return null; }, shop);
      expect(map, shop + " の 町が ない");
      await H.dbg("store", shop, map);
      await H.until(() => PokaDebug.state().scene === "store" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000); await H.wait(400);
      const want = await H.dbg("shopGoods", shop);
      expect(want && want.tabs.length === 2 && want.total >= 8, shop + ": しなぞろえ " + JSON.stringify(want));
      // 1. かいものの まど
      await page.getByRole("button", { name: "てんいんと はなす", exact: true }).click(); await page.getByRole("button", { name: "かいものを する", exact: true }).click();
      await page.locator(".modal-wrap .grid .card").first().waitFor({ timeout: 15000 }); await H.wait(300);
      const look = () => H.eval(() => {
        const cards = [...document.querySelectorAll(".modal-wrap .grid .card")];
        return {
          tabs: [...document.querySelectorAll(".modal-wrap .tabs .tab")].map((b) => b.textContent),
          names: cards.map((c) => c.querySelector(".price")?.previousElementSibling?.textContent || ""),
          ico: cards.every((c) => Math.round(c.querySelector(".ico").getBoundingClientRect().width) === 56),
          fit: cards.every((c) => { const r = c.getBoundingClientRect(), t = c.querySelector(".price").previousElementSibling.getBoundingClientRect(); return t.left >= r.left - 1 && t.right <= r.right + 1 && r.height < 190; }),
          over: document.documentElement.scrollWidth > innerWidth,
        };
      });
      let v = await look();
      expect(v.tabs.join() === want.tabs.map((t) => t.label).join() && v.names.length === want.tabs[0].ids.length && v.names.every(Boolean), shop + ": タブと しなもの " + JSON.stringify({ v, want }));
      expect(v.ico && v.fit && !v.over, shop + ": アイコン 56・なまえが カードに おさまる・よこに はみださない " + JSON.stringify(v));
      if (shop === "cake" || shop === "crepe") await H.shot(shop);
      // 2. あたらしい しなものを かう
      const name = await H.eval((id) => BAG_INDEX[id].name, buy), price = await H.eval((id) => BAG_INDEX[id].price, buy), before = await H.dbg("saveData");
      expect(want.tabs[0].ids.includes(buy), shop + ": さいしょの タブに " + buy);
      await page.locator(".modal-wrap .grid .card").filter({ hasText: name }).first().click(); await page.getByRole("button", { name: "かう", exact: true }).click(); await H.wait(300);
      const saved = await H.dbg("persistedSave");
      expect(saved.coins === before.coins - price && (saved.bag[buy] || 0) === (before.bag[buy] || 0) + 1, shop + ": " + buy + " を かえない " + JSON.stringify({ c: [before.coins, saved.coins, price], n: saved.bag[buy] }));
      // 3. 2つめの タブ
      await page.locator(".modal-wrap .tabs .tab").nth(1).click(); await H.wait(300);
      v = await look();
      const second = await H.eval((ids) => ids.map((id) => BAG_INDEX[id].name), want.tabs[1].ids);
      expect(v.names.join() === second.join() && v.fit && !v.over, shop + ": 2つめの タブ " + JSON.stringify({ v, second }));
      if (shop === "cake") await H.shot("cake-sweets");
      await page.locator(".modal-wrap .close").last().click(); await H.until(() => !document.querySelector(".modal-wrap") && PokaDebug.idle(), 8000);
    }
  }, { viewport, timeout: 150000 });
}
