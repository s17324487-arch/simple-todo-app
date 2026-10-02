// おトイレ（js/home-toilet.js・UI-47。オーナーの FB 2026-10-02「おトイレにも行かせたい」）
// 1. おくの かべに「おトイレ」の ドア（ふだ・画面の なか）→ だれも いきたく ない ときに タップ →「いまは だいじょうぶ」
// 2. がちゃん（55）が いちばん → ドアを タップ → ドアまで あるいて はいる（ふだが「つかってるよ」）→ コンコン「はいってまーす」→ でて きて「すっきり」・ごきげん
// 3. わんこ（85）が もじもじ（こまった かお・ことば）→ ごじ（100）が がまんの げんかいで じぶんで いく
// 4. ぎゅうにゅうで いきたさが ふえる → さいかい しても のこる
export async function homeToiletSmoke({ scenario, expect }) {
  const door = async (H) => (await H.dbg("toilet")).door;
  const tapDoor = async (H) => { const d = await door(H); expect(d, "おトイレの ドアが ない"); await H.tap(d.cx, d.cy); };
  const said = async (H, kind, from = 0) => (await H.dbg("homeTalkLog")).slice(from).filter((x) => x.wc === kind);
  const kid = async (H, id) => (await H.dbg("toilet")).kids.find((k) => k.id === id);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-toilet-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 20); await H.dbg("weather", "clear"); await H.wait(600);
    await H.dbg("homeBubbleFixture"); // 3人を ドアから はなれた ところに とめる・ぱぱ ままも とめる
    let t = await H.dbg("toilet");
    expect(t && t.door && t.door.label === "おトイレ" && t.n === 0 && Object.values(t.need).every((v) => v >= 0 && v < 30), "おトイレの ようす " + JSON.stringify(t));
    const d = t.door;
    expect(d.x >= 0 && d.x + d.w <= viewport.width && d.y >= 0 && d.y + d.h <= viewport.height && d.w > 8 && d.h > 20, "ドアが 画面の そと・ちいさすぎる " + JSON.stringify(d));
    expect((await H.dbg("homeDoors")).doors.map((x) => x.id).join() === "out,room,toilet", "ドアの いちらんに おトイレが ない");
    await H.shot("door");
    // 1. だれも いきたく ない
    for (const id of ["wanko", "gachan", "goji"]) await H.dbg("toiletNeed", id, 0);
    let log0 = (await H.dbg("homeTalkLog")).length;
    await tapDoor(H); await H.wait(300);
    expect((await said(H, "fine", log0)).length === 1 && !(await H.dbg("toilet")).who, "だれも いきたく ない ときの ことばが ない");
    // 2. がちゃんが いく
    await H.dbg("toiletNeed", "gachan", 55); await H.dbg("toiletNeed", "goji", 20);
    const before = (await H.dbg("saveData")).chars.gachan.mood;
    log0 = (await H.dbg("homeTalkLog")).length;
    await tapDoor(H);
    await H.until(() => PokaDebug.toilet().who === "gachan", 3000);
    expect((await said(H, "go", log0)).some((x) => x.id === "gachan"), "いってきます が ない");
    await H.until(() => PokaDebug.toilet().kids.find((k) => k.id === "gachan").wc === "in", 8000);
    t = await H.dbg("toilet");
    expect(t.door.label === "つかってるよ" && t.kids.find((k) => k.id === "gachan").hidden && t.need.gachan < 3 && t.n === 1, "はいった あと " + JSON.stringify(t));
    await tapDoor(H); await H.wait(250);
    expect((await said(H, "knock", log0)).some((x) => x.id === "gachan" && /はいって/.test(x.text)), "ノックの へんじが ない");
    const bub = await H.dbg("homeBubbleState");
    expect(bub.boxes.some((b) => b.id === "gachan") && bub.boxes.every((b) => b.x >= 0 && b.x + b.w <= viewport.width), "なかからの ふきだしが ない・はみ出す " + JSON.stringify(bub.boxes));
    await H.shot("inside");
    await H.until(() => { const k = PokaDebug.toilet().kids.find((k) => k.id === "gachan"); return !k.wc && !k.hidden; }, 8000);
    expect((await said(H, "done", log0)).some((x) => x.id === "gachan" && /すっきり/.test(x.text)), "すっきり が ない");
    t = await H.dbg("toilet");
    expect(t.door.label === "おトイレ" && !t.who && (await H.dbg("saveData")).chars.gachan.mood >= Math.min(100, before + 6), "でた あと " + JSON.stringify(t));
    await H.wait(500); await H.shot("done");
    // 3. もじもじ → がまんの げんかい
    log0 = (await H.dbg("homeTalkLog")).length;
    await H.dbg("toiletNeed", "wanko", 85, { nag: 0.3 });
    await H.until((n) => PokaDebug.homeTalkLog().slice(n).some((x) => x.wc === "nag" && x.id === "wanko"), 5000, log0);
    const w = await kid(H, "wanko");
    expect(w.state === "moji" && w.face === "fs_doki", "もじもじ・こまった かおに ならない " + JSON.stringify(w));
    await H.shot("moji");
    await H.dbg("toiletNeed", "goji", 100, { hold: 29.6 });
    await H.until(() => PokaDebug.toilet().who === "goji", 5000);
    expect((await said(H, "hold", log0)).some((x) => x.id === "goji"), "がまん できない が ない");
    await H.until(() => { const k = PokaDebug.toilet().kids.find((k) => k.id === "goji"); return !k.wc && !k.hidden && PokaDebug.toilet().n === 2; }, 12000);
    // 4. のみもので ふえる・さいかい
    await H.dbg("toiletNeed", "wanko", 0);
    await H.dbg("give", "milk", 1); await H.dbg("feed", "wanko", "milk");
    t = await H.dbg("toilet");
    expect(t.need.wanko >= 11 && t.need.wanko < 15, "ぎゅうにゅうで いきたさが ふえない " + JSON.stringify(t.need));
    await H.dbg("save"); await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click(); await H.idle();
    t = await H.dbg("toilet");
    expect(t.n === 2 && t.need.wanko >= 11 && t.need.gachan < 5 && t.need.goji < 5 && t.door, "さいかいで のこらない " + JSON.stringify(t));
  }, { full: true, viewport, timeout: 120000 });
}
