// おうちの ドア（UI-09）: ドアを タップして べつの へや・おにわの うらぐち・おでかけ
export async function homeDoorsSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-doors-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.wait(300);
    const door = async (id) => (await H.dbg("homeDoors")).doors.find((d) => d.id === id);
    const tapDoor = async (id, dx = 0) => { const d = await door(id); expect(d, "ドアが ない " + id); await H.tap(d.cx + dx, d.cy); };
    const inRoom = (id) => H.until((id) => G.sceneName === "house" && !Game.trans && PokaDebug.idle() && Save.d.rooms.active === id && !PokaDebug.homeDoors()?.walking, 15000, id);
    let st = await H.dbg("homeDoors");
    expect(st.doors.map((d) => d.id).join() === "out,room" && st.doors.every((d) => d.w > 0 && d.h > 0), "おへやの ドアが 2つ ない " + JSON.stringify(st.doors));
    for (const d of st.doors) expect(d.x >= 0 && d.x + d.w <= viewport.width && d.y >= 0 && d.y + d.h <= viewport.height, "ドアが 画面の そと " + d.id);
    await H.shot("main");
    // ほかの へやが ない: しらせるだけ（ドアの はしを タップ → はば 44px の はんい）
    await tapDoor("room", 17); await H.wait(300);
    expect(await H.eval(() => [...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("ほかの おへやは まだ ないよ"))), "へやが ない ときの しらせが ない");
    st = await H.dbg("homeDoors"); expect(st.room === "main" && !st.walking && !st.mode, "へやが ないのに うごく");
    const before = await H.dbg("saveData");
    // アトリエを かう（おへやの ボタンから）→ アトリエ
    await H.dbg("coins", 60000); await H.dbg("wins", 40); // coins は たす
    await H.houseButton("おへや"); await H.page.locator('[data-room="study"]').getByRole("button", { name: "おへやを かう", exact: true }).click(); await H.choose(0);
    await inRoom("study");
    // アトリエの ドア → へやは 1つ だけ なので すぐ いつもの おへやへ。3人が ドアまで あるく
    await tapDoor("room"); await H.until(() => PokaDebug.homeDoors()?.walking, 3000);
    await H.shot("walk");
    await inRoom("main");
    const R = await H.eval(() => ({ W: ROOM.W, WALL: ROOM.WALL }));
    st = await H.dbg("homeDoors");
    // ドアの まえに あらわれて すこし 中へ あるきだす
    expect(st.chars.length === 3 && st.chars.every((c) => Math.abs(c.x - (R.W - 92)) < 80 && c.y < R.WALL + 150), "ドアの まえに 3人が あらわれない " + JSON.stringify(st.chars));
    // おにわも かう → うらぐちの ドアで おうちへ
    await H.houseButton("おへや"); await H.page.locator('[data-room="yard"]').getByRole("button", { name: "おへやを かう", exact: true }).click(); await H.choose(0);
    await inRoom("yard");
    st = await H.dbg("homeDoors"); expect(st.doors.map((d) => d.id).join() === "inside", "おにわの うらぐちが ない");
    await H.shot("yard");
    await tapDoor("inside"); await inRoom("main");
    // へやが 2つ いじょう: えらぶ（やめる も ある）
    await tapDoor("room"); await H.page.waitForSelector(".choices .btn");
    const names = await H.eval(() => [...document.querySelectorAll(".choices .btn")].map((b) => b.textContent.trim()));
    expect(names.join() === "ひだまりの アトリエ,こもれびの おにわ,やめる", "えらべる へやが ちがう " + names);
    await H.shot("choose");
    await H.choose(2); expect((await H.dbg("homeDoors")).room === "main" && !(await H.dbg("homeDoors")).walking, "やめても うごく");
    await tapDoor("room"); await H.choose(0); await inRoom("study");
    // おでかけの ドア: たしかめる → やめる → いく で まちへ
    await tapDoor("out"); await H.page.waitForSelector(".choices .btn");
    expect(await H.eval(() => document.body.innerText.includes("まちへ おでかけ する？")), "おでかけの たしかめが ない");
    await H.choose(1); expect((await H.dbg("state")).scene === "house" && !(await H.dbg("homeDoors")).walking, "やめても でかける");
    // ドアで うごいても もちものは かわらない（コインは へやの ぶんだけ。まちでは まいにちの スタンプが ふえる ので その まえに）
    const after = await H.dbg("saveData");
    expect(after.coins === before.coins + 60000 - 4500 - 20000, "コインが へやの ねだん いがいで かわった " + after.coins);
    await tapDoor("out"); await H.choose(0);
    await H.until(() => G.sceneName === "world" && !Game.trans && PokaDebug.idle(), 15000);
    // かぐは おにわの 4つ（テーブル・いす 2・うえき）が ふえる ので、もちもの と ふく を くらべる
    for (const k of ["bag", "wardrobe"]) expect(H.kept(before, after, k), "ドアで もちものが かわった " + k);
    expect(JSON.stringify(after.rooms.stored.main.items) === JSON.stringify(before.room.items), "いつもの おへやの かぐが かわった");
  }, { viewport, timeout: 120000 });
}
