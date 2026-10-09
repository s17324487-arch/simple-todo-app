// おうちの 3かい（UI-115。オーナーの 指示 2026-10-09「80万円で3階を増やして」）
// 1. 2かいが ない ときは 3かいの「おへやを かう」が おせない（2かいを かってから）
// 2. 2かいを かう → 3かいを かう（800000 コイン・ほしぞら）→ 2かいと 3かいが いっしょに 画面の 中（3かいは 2かいの みぎ うえ）
// 3. 2かいの かいだんを タップ → 3人で 2かいへ おりる → 2かいの かいだん（3かいへ）を タップ → 3かいへ のぼる → さいかい
export async function home3fSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-3f-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.wait(300);
    const floor = () => H.dbg("homeFloor");
    const inRoom = (id) => H.until((id) => G.sceneName === "house" && !Game.trans && PokaDebug.idle() && Save.d.rooms.active === id && !PokaDebug.homeFloor()?.climbing && PokaDebug.homeFloor()?.ready !== false, 20000, id);
    const buy = async (id) => { await H.page.locator(`[data-room="${id}"]`).getByRole("button", { name: "おへやを かう", exact: true }).click(); await H.choose(0); };
    await H.dbg("coins", 900000);
    // 1. 2かいの まえ
    await H.houseButton("おへや");
    let card = await H.page.locator('[data-room="third"]').innerText();
    expect(card.includes("800000") && card.includes("2かいを かってから") && await H.page.locator('[data-room="third"]').getByRole("button", { name: "おへやを かう", exact: true }).isDisabled(), "2かいの まえに 3かいが かえる " + card);
    // 2. 2かい → 3かい
    await buy("upstairs"); await inRoom("upstairs");
    await H.houseButton("おへや");
    card = await H.page.locator('[data-room="third"]').innerText();
    expect(!card.includes("2かいを かってから") && card.includes("ほしぞら"), "3かいの カード " + card);
    const coins0 = (await H.dbg("state")).coins;
    await buy("third"); await inRoom("third"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000); await H.wait(300);
    let save = await H.dbg("saveData"), st = await floor();
    expect(save.coins === coins0 - 800000 && save.rooms.owned.third && save.room.wall === "wp_star", "3かいの ねだん・かべがみ " + JSON.stringify([save.coins, coins0, save.room.wall]));
    expect(st.lo === "upstairs" && st.hi === "third" && st.upper && !st.upTap, "3かいで 2かいと 3かいが 見えない " + JSON.stringify([st.lo, st.hi]));
    const bars = await H.eval(() => { const r = (s) => document.querySelector(s)?.getBoundingClientRect(); return { care: r(".care-bar"), bar: r(".house-bar") }; });
    for (const k of ["upstairs", "third"]) {
      const b = st.rooms[k];
      expect(b.x >= -1 && b.x + b.w <= viewport.width + 1 && b.y >= bars.care.bottom - 2 && b.y + b.h <= bars.bar.top + 2, k + " が 画面から はみ出す " + JSON.stringify(b));
    }
    expect(st.rooms.third.y < st.rooms.upstairs.y && st.rooms.third.x > st.rooms.upstairs.x, "3かいが 2かいの みぎ うえに ない");
    await H.shot("3f");
    // 3. 3かい → 2かい
    await H.tap(st.stairsTap.x, st.stairsTap.y);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "down", 3000);
    await inRoom("upstairs"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000); await H.wait(200);
    st = await floor();
    const D = await H.eval(() => ROOM.H - ROOM.WALL), W = await H.eval(() => ROOM.WALL);
    expect(st.lo === "main" && st.hi === "upstairs" && st.upTap && st.chars.every((c) => c.x < 200 && c.y > W + D - 140 && c.z === 0), "2かいの かいだんの したに つかない " + JSON.stringify(st.chars));
    await H.shot("2f");
    // 2かい → 3かい（2かいの かいだん）
    await H.tap(st.upTap.x, st.upTap.y);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "up", 3000);
    await H.until(() => PokaDebug.homeFloor()?.chars.some((c) => c.z > 80), 8000);
    await H.shot("climb");
    await inRoom("third");
    // さいかい
    await H.dbg("save"); await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click();
    await inRoom("third"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000);
    st = await floor(); save = await H.dbg("saveData");
    expect(st.on && st.upper && st.third && save.rooms.owned.upstairs && save.rooms.stored.upstairs, "よみなおすと 3かいが ない");
  }, { viewport, timeout: 150000 });
}
