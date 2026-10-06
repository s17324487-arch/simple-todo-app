// おひるね（js/home-doze.js・UI-99。オーナーの 依頼 2026-10-06「おうちで、たまに3人寝ていて(2分くらい)、寝言を言っている行動を追加して」）
// 1. ねむく なる（PokaDebug.homeDozeStart）→「ふわぁ…」→ ベッドの まえに あつまって 3人とも おひるね（すわって ねがお・Z）・ぱぱ ままの「しーっ」
// 2. ときどき ねごと（くもの ふきだし・画面の なか）・ほかの できごとは おやすみ
// 3. ねて いる 子を タップ → おきない（ねごと・なでなでの きろく +1）
// 4. 2ふん たつと おきる（「よく ねた！」・のび）→ つぎは しばらく ねない
// 5. もう いちど ねむる → したの「ごはん」→「ん… おはよう…」と おきてから ごはんの まど
// 6. もう いちど ねむる → 3かい タップすると おきる
export async function homeDozeSmoke({ scenario, expect }) {
  const IDS = ["wanko", "gachan", "goji"];
  const doze = (H) => H.dbg("homeDoze");
  const sleepNow = async (H) => {
    expect(await H.dbg("homeDozeStart") === true, "ねむく ならない（へやが しずかで ない）" + JSON.stringify(await doze(H)));
    await H.until(() => PokaDebug.homeDoze().phase === "sleep", 15000);
    return doze(H);
  };
  const tapKid = async (H, id) => { const k = (await doze(H)).kids.find((x) => x.id === id); await H.tap(k.rect.x + k.rect.w / 2, k.rect.y + k.rect.h * 0.45); await H.wait(250); };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-doze-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 20); await H.dbg("weather", "clear"); await H.wait(600);
    let d = await doze(H); // はいって すぐ（まだ 1びょう くらいしか すすんで いない）
    expect(d && d.phase === null && d.len === 120 && d.next > 140 && d.next <= 300, "はじめの ようす（2ふん・さいしょは 2ふん半〜5ふん あと）" + JSON.stringify(d));
    await H.dbg("homeBubbleFixture"); // 3人と ぱぱ ままを とめる（おしゃべり・しぐさ・おひるねの タイマーも）
    d = await doze(H);
    expect(d.phase === null && d.next === 3600 && d.can, "とめた あとの ようす（しずかで ねむれる・ひとりでには ねない）" + JSON.stringify(d));
    const pats0 = (await H.dbg("records")).kids;
    // 1. ねむく なる → あつまって ねる
    d = await sleepNow(H);
    // 画面で よこ 一列（となりと かさなりすぎない・おなじ たかさ・はなれすぎない）
    const rs = d.kids.map((k) => k.rect).sort((a, b) => a.x - b.x), w = rs[0].w, h = rs[0].h;
    expect(d.kids.every((k) => k.doze && k.state === "activity" && !k.hidden) && rs.every((r, i) => !i || (r.x - rs[i - 1].x >= 0.6 * w && Math.abs(r.y - rs[i - 1].y) <= 0.2 * h)) && rs[2].x - rs[0].x < 4 * w, "3人で いっしょに よこ 一列に ねて いない " + JSON.stringify(d.kids));
    expect(d.spot && ["bed", "rug", "room"].includes(d.spot.by) && d.spot.bad === 0 && d.log.some((l) => l.doze === "start") && d.log.some((l) => l.doze === "hush" && (l.id === "papa" || l.id === "mama")), "ねむく なる ことば・ぱぱ ままの しーっ " + JSON.stringify([d.spot, d.log]));
    // ぱぱ ままは ねて いる 3人の まえから よける（かさならない）
    await H.until(() => PokaDebug.homeDoze().parents.every((p) => p.hidden || p.state === "idle"), 8000);
    d = await doze(H);
    const gap = Math.min(...d.parents.filter((p) => !p.hidden).flatMap((p) => d.kids.map((k) => Math.hypot(p.x - k.x, p.y - k.y))), 999);
    expect(gap >= 60 && d.parents.every((p) => !p.target), "ぱぱ ままが ねて いる 3人に かさなる・おせわに くる " + JSON.stringify([gap, d.parents, d.kids.map((k) => [k.x, k.y])]));
    await H.wait(300); await H.shot("doze");
    // 2. ねごと（さいしょは 4〜7びょうで）
    await H.until(() => PokaDebug.homeDoze().log.some((l) => l.doze === "talk"), 12000);
    d = await doze(H);
    const talk = d.log.find((l) => l.doze === "talk");
    expect(talk && talk.kind === "think" && IDS.includes(talk.id) && d.phase === "sleep" && d.kids.every((k) => k.doze), "ねごとが くもの ふきだしで ない " + JSON.stringify(d.log));
    const bub = await H.dbg("homeBubbleState");
    expect(bub.boxes.length > 0 && bub.boxes.every((b) => b.x >= 0 && b.x + b.w <= viewport.width + 0.5 && b.y >= 0 && b.y + b.h <= viewport.height), "ねごとの ふきだしが はみ出す " + JSON.stringify(bub.boxes));
    await H.shot("talk");
    // 3. タップ → おきない・なでなでの きろく
    await tapKid(H, "gachan");
    d = await doze(H);
    const pats1 = (await H.dbg("records")).kids;
    expect(d.phase === "sleep" && d.pokes === 1 && d.kids.every((k) => k.doze) && d.log.some((l) => l.doze === "poke" && l.id === "gachan") && pats1.gachan.pat === pats0.gachan.pat + 1, "タップで おきた・ねごとが ない・きろくが ふえない " + JSON.stringify([d, pats0.gachan, pats1.gachan]));
    // 4. 2ふん たつと おきる（とめて すすめる）
    await H.dbg("pause", true);
    expect(await H.dbg("homeAdvance", 120) === true, "じかんを すすめられない");
    await H.dbg("homeAdvance", 6);
    d = await doze(H);
    expect(d.phase === null && d.wakes === 1 && d.last === "time" && d.kids.every((k) => !k.doze) && d.talks >= 6 && d.next >= 400, "2ふんで おきない・ねごとが すくない " + JSON.stringify(d));
    const wakeLines = d.log.filter((l) => l.doze === "wake");
    expect(IDS.every((id) => wakeLines.some((l) => l.id === id)), "おきた ときの ことば " + JSON.stringify(wakeLines));
    await H.dbg("pause", false); await H.wait(300); await H.shot("wake");
    // 5. したの ボタンで おきる → その ボタンの こと
    await H.dbg("homeBubbleFixture");
    d = await sleepNow(H);
    await H.houseButton("ごはん");
    await H.until(() => PokaDebug.homeDoze().phase === null, 3000);
    d = await doze(H);
    expect(d.last === "button" && d.kids.every((k) => !k.doze) && d.log.some((l) => l.doze === "woken"), "ボタンで おきない " + JSON.stringify(d));
    expect((await H.page.$$(".panel .grid .card")).length > 0, "ごはんの まどが ひらかない");
    await H.page.keyboard.press("Escape"); await H.until(() => !document.querySelector(".modal-wrap:not(.out)"), 5000); await H.wait(300);
    // 6. 3かい タップで おきる
    await H.dbg("homeBubbleFixture");
    d = await sleepNow(H);
    for (const id of ["wanko", "goji", "wanko"]) await tapKid(H, id);
    d = await doze(H);
    expect(d.phase === null && d.last === "poke" && d.pokes === 3 && d.log.some((l) => l.doze === "woken") && d.kids.every((k) => !k.doze), "3かい タップで おきない " + JSON.stringify(d));
  }, { viewport, timeout: 180000 });
}
