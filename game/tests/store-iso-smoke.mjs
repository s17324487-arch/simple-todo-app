// 歩いて 入る お店の 斜め上の 館（js/store-iso*.js・O10・UI-75。オーナーの FB 2026-10-03「入ることのできるお店の内装で、クオリティの低いものを作り直してほしい。」）
// 1. ネリカスタウンの ローリソンに 町の 入口から 3人で はいる → 斜め上の 館（かべ 2まい・什器の 絵・ぜんぶの 床に いける）
// 2. れいぞうこを タップ → なまえと ひとこと（トースト）
// 3. くじの たなの まえまで あるく → カメラが ついていって くじの たなが 画面に はいる
// 4. 店員を タップ → レジの まえ（5,3）まで あるいて 会話（かいもの・いちばんくじ）→「また あとで」
// 5. ほかの 店（ケーキ・パン・ゆうびんきょく・あたまの たいそう・パズル こうぼう・ころころ フルーツ）も 絵が でて ぜんぶの 床に いける
// 6. 「おみせを でる」→ 町の 入口の まえ
export async function storeIsoSmoke({ scenario, expect }) {
  const ready = (H) => H.until(() => PokaDebug.state().scene === "store" && !PokaDebug.state().transitioning && PokaDebug.idle() && G.scene.isoReady, 20000);
  const look = (H) => H.eval(() => ({ iso: !!G.scene.def.iso, walls: !!(G.scene.room._walls && G.scene.room._walls.north && G.scene.room._walls.west), art: G.scene.fixtures.filter((f) => f.kind !== "keeper" && f.kind !== "npc").every((f) => StoreIsoArt.sprite(G.scene, f)) }));
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("store-iso-" + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear");
    await H.eval(() => { window.__toastLog = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains("toast")) window.__toastLog.push(n.textContent); }).observe(document.body, { childList: true, subtree: true }); });
    // 1. ローリソン
    const layout = await H.dbg("townLayout", "town"), door = layout.doors.find((d) => d.act.shop === "lawson");
    expect(door, "ローリソンの 入口が ない");
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(); await H.dbg("walkTo", door.x, door.y);
    await ready(H); await H.wait(600);
    let st = await H.dbg("storeState");
    expect(st.shop === "lawson" && st.party.length === 3 && st.walkable.length >= 60 && st.walkable.every((p) => p.reachable), "ローリソンに 3人で はいる・ぜんぶの 床に いける " + JSON.stringify({ shop: st.shop, n: st.walkable.length }));
    let v = await look(H);
    expect(v.iso && v.walls && v.art, "斜め上の 館・かべ・什器の 絵 " + JSON.stringify(v));
    expect(st.keeper.cx > 0 && st.keeper.cx < viewport.width && st.keeper.cy > 80 && st.keeper.cy < viewport.height - 150 && st.exit.cy < viewport.height - 120, "店員と でぐちが 画面に はいる " + JSON.stringify({ k: st.keeper, e: st.exit }));
    await H.shot("lawson");
    // 2. れいぞうこ → ひとこと
    const fridge = st.fixtures.find((f) => f.kind === "fridge");
    expect(fridge && fridge.cx > 0 && fridge.cx < viewport.width, "れいぞうこが 画面に ある");
    await H.tap(fridge.cx, fridge.cy);
    await H.until(() => window.__toastLog.some((t) => t.includes("つめたい のみもの。")), 5000);
    // 3. くじの たなの まえ → カメラ
    expect(await H.dbg("storeWalkTo", 8, 3), "くじの たなの まえへ あるけない");
    await H.until(() => { const s = PokaDebug.storeState(); return s && s.party[0].x === 8 && s.party[0].y === 3 && !s.party[0].moving && !s.path; }, 15000); await H.wait(900);
    st = await H.dbg("storeState");
    const kuji = st.fixtures.find((f) => f.kind === "kuji_lawson");
    expect(kuji && kuji.cx > 20 && kuji.cx < viewport.width - 20 && kuji.cy > 80, "くじの たなが 画面に はいる " + JSON.stringify(kuji && { cx: kuji.cx, cy: kuji.cy }));
    await H.shot("lawson-kuji");
    // 4. 店員 → レジの まえで 会話
    await H.tap(st.keeper.cx, st.keeper.cy);
    await page.locator(".dlg-shade.ask .choices .btn").first().waitFor({ timeout: 15000 });
    const choices = await page.locator(".dlg-shade.ask .choices .btn").allTextContents();
    st = await H.dbg("storeState");
    expect(st.party[0].x === 5 && st.party[0].y === 3 && choices.includes("かいものを する") && choices.includes("いちばんくじを ひく"), "レジの まえで 会話 " + JSON.stringify({ p: st.party[0], choices }));
    await page.getByRole("button", { name: "また あとで", exact: true }).click(); await H.until(() => !document.querySelector(".dlg-shade") && PokaDebug.idle(), 8000);
    // 5. ほかの 店
    for (const id of ["cake", "bakery", "postoffice", "brain", "kobo", "korokoro"]) {
      const map = await H.eval((id) => { for (const [m, d] of Object.entries(MAP_DEFS)) if ((d.buildings || []).some((b) => b.act && b.act.shop === id)) return m; return null; }, id);
      expect(map, id + " の 町が ない");
      await H.dbg("store", id, map); await ready(H); await H.wait(500);
      st = await H.dbg("storeState"); v = await look(H);
      expect(st.shop === id && st.walkable.every((p) => p.reachable) && v.iso && v.walls && v.art, id + ": 絵・ぜんぶの 床 " + JSON.stringify({ v, n: st.walkable.length }));
      if (id === "postoffice" || id === "korokoro") await H.shot(id);
    }
    // 6. でる
    await page.getByRole("button", { name: "おみせを でる", exact: true }).click();
    await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle(), 20000);
    expect((await H.dbg("state")).scene === "world", "町へ もどる");
  }, { viewport, timeout: 150000 });
}
