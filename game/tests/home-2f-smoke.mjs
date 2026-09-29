// おうちの 2かい（HOME-2F）: 3000 コインで かう・1かいと 2かいが いっしょに 見える・かいだんで のぼる／おりる・かいだんの ところに かぐを おかない
export async function home2fSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-2f-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.wait(300);
    const floor = () => H.dbg("homeFloor");
    const inRoom = (id) => H.until((id) => G.sceneName === "house" && !Game.trans && PokaDebug.idle() && Save.d.rooms.active === id && !PokaDebug.homeFloor()?.climbing && PokaDebug.homeFloor()?.ready !== false, 20000, id);
    let st = await floor();
    expect(!st.owned && !st.on && !st.stairs, "かう まえから 2かいが ある");
    await H.dbg("coins", 9000); // coins は たす
    const before = await H.dbg("saveData");
    // おへや → 2かい（3000 コイン・せつめい）→ かう
    await H.houseButton("おへや");
    const card = await H.page.locator('[data-room="upstairs"]').innerText();
    expect(card.includes("3000") && card.includes("かいだん") && card.includes("いっしょに みえる"), "2かいの カードが ない " + card);
    await H.page.locator('[data-room="upstairs"]').getByRole("button", { name: "おへやを かう", exact: true }).click(); await H.choose(0);
    await inRoom("upstairs"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000); await H.wait(300);
    let save = await H.dbg("saveData");
    expect(save.coins === before.coins - 3000 && save.rooms.owned.upstairs && save.room.wall === "wp_cloud", "2かいの ねだん・かべがみ " + JSON.stringify([save.coins, before.coins, save.room.wall]));
    // 1かいと 2かいが いっしょに 画面の 中（おなかの 表示と したの ボタンの あいだ）
    st = await floor();
    const bars = await H.eval(() => { const r = (s) => document.querySelector(s)?.getBoundingClientRect(); return { care: r(".care-bar"), bar: r(".house-bar") }; });
    for (const k of ["main", "upstairs"]) {
      const b = st.rooms[k];
      expect(b.x >= -1 && b.x + b.w <= viewport.width + 1 && b.y >= bars.care.bottom - 2 && b.y + b.h <= bars.bar.top + 2, k + " が 画面から はみ出す／ボタンに かさなる " + JSON.stringify([b, bars.care.bottom, bars.bar.top]));
    }
    expect(st.rooms.upstairs.y < st.rooms.main.y && st.rooms.upstairs.x < st.rooms.main.x, "2かいが 1かいの ななめ うえ（ひだり おく）に ない");
    expect(st.chars.length === 3 && st.upper, "3人が 2かいに いない");
    await H.shot("2f");
    // 2かい: かいだんを タップ → 3人で おりる → 1かいの かいだんの した
    await H.tap(st.stairsTap.x, st.stairsTap.y);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "down", 3000);
    await H.until(() => PokaDebug.homeFloor()?.chars.some((c) => c.z < -40), 8000);
    await H.shot("down");
    await inRoom("main"); await H.wait(200);
    st = await floor();
    const R = await H.eval(() => ({ W: ROOM.W, WALL: ROOM.WALL, D: ROOM.H - ROOM.WALL }));
    expect(!st.upper && st.on && st.ready && st.stairs && st.chars.every((c) => c.x < 200 && c.y > R.WALL + R.D - 140 && c.z === 0), "1かいの かいだんの したに つかない " + JSON.stringify(st.chars));
    await H.shot("1f");
    // 1かい: 2かいの へやを タップ → かいだんを のぼる（とちゅうで たかく なる）→ 2かい
    await H.tap(st.rooms.upstairs.cx, st.rooms.upstairs.cy + st.rooms.upstairs.h * 0.15);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "up", 3000);
    await H.until(() => PokaDebug.homeFloor()?.chars.some((c) => c.z > 80), 8000);
    await H.shot("climb");
    await inRoom("upstairs");
    // 2かいの「おへや」の ドア: 2かいは えらばない（かいだんで いく）→ いつもの おへやへ
    const doors = await H.dbg("homeDoors");
    expect(!doors.rooms.includes("upstairs") && doors.rooms.includes("main"), "ドアで 2かいを えらべる " + doors.rooms);
    const d2 = doors.doors.find((d) => d.id === "room"); await H.tap(d2.cx, d2.cy);
    await inRoom("main");
    // かいだんの ところの かぐは よける（ゆかの かぐ・ひだりの かべの かぐ）
    await H.dbg("homeLayout", [{ id: "bookshelf", x: 30, y: 470 }, { id: "window", x: 300, y: 116, wallSide: "left" }, { id: "rug_round", x: 150, y: 470 }]);
    await H.dbg("house"); await inRoom("main"); await H.wait(200);
    const dz = await H.dbg("homeDesign"), shelf = dz.items.find((it) => it.id === "bookshelf"), win = dz.items.find((it) => it.id === "window");
    expect(shelf.x >= 58 + 36 && win.x <= 150, "かいだんの ところに かぐが ある " + JSON.stringify([shelf.x, win.x]));
    // セーブして よみなおしても 2かいが ある
    await H.dbg("save"); await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click();
    await inRoom("main"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000);
    st = await floor(); expect(st.owned && st.on && !st.upper, "よみなおすと 2かいが ない");
    save = await H.dbg("saveData");
    for (const k of ["bag", "wardrobe"]) expect(H.kept(before, save, k), "2かいで もちものが かわった " + k);
    expect(save.coins === before.coins - 3000, "コインが 2かいの ねだん いがいで かわった");
  }, { viewport, timeout: 150000 });
}
