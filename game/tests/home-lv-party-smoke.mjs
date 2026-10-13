// レベルの おいわいの 会（js/home-lv-party.js・UI-120。オーナーの 指示 2026-10-13「レベルが10上がるごとに、3人がおうちで勝手にお祝いの会を開いている様子を実装して」）
// 1. はじめは まちが ない・Lv.100 まで（UI-119）
// 2. わんこが Lv.9 → 10（けいけんち）→ まちに はいる・Lv.11 では はいらない・PokaDebug.level では はいらない
// 3. なにも しなくても じぶんたちで ひらく → あつまって たつ（とんがりぼうし）・かべの たれまく「わんこ レベル10 おめでとう！」・ケーキの ろうそく 1本・ことば
// 4. 会の あいだに タップ → やめない（ひとこと）
// 5. すすめる →「おめでとう」→「ありがとう」→「かんぱーい」（まちから きえる・きろく）→ ろうそくを ふーっ → おわり → ごきげんが あがる
// 6. 3人とも Lv.20 → 1つの 会（「みんな レベル20 おめでとう！」・ろうそく 2本）→ したの「ごはん」で とちゅうで やめる → まちは のこる（つぎに また ひらく）
// 7. ふきだしが 画面から はみ出さない（390／375）
export async function homeLvPartySmoke({ scenario, expect }) {
  const IDS = ["wanko", "gachan", "goji"];
  const party = (H) => H.dbg("lvParty");
  const bubbles = async (H, vp) => { const b = await H.dbg("homeBubbleState"); return { n: b.boxes.length, out: b.boxes.filter((x) => x.x < -0.5 || x.x + x.w > vp.width + 0.5 || x.y < -0.5 || x.y + x.h > vp.height + 0.5) }; };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-lv-party-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 15); await H.dbg("weather", "clear"); await H.wait(500);
    await H.dbg("homeBubbleFixture"); // 3人と ぱぱ ままを とめる（おいわいの タイマーも）
    // 1. はじめ
    let p = await party(H);
    expect(p && !p.pend.length && IDS.every((id) => p.done[id] === 0) && p.max === 100 && p.step === 10 && p.phase === null && p.can, "はじめの ようす " + JSON.stringify(p));
    // 2. わんこが Lv.10 に
    await H.dbg("level", 9);
    p = await party(H); expect(!p.pend.length, "PokaDebug.level で まちに はいった");
    await H.dbg("nearLevelUp", "wanko", 1);
    expect(JSON.stringify(await H.dbg("gainExp", "wanko", 5)) === "[10]", "わんこが Lv.10 に ならない");
    await H.dbg("nearLevelUp", "wanko", 1); await H.dbg("gainExp", "wanko", 5);
    p = await party(H);
    expect(p.pend.length === 1 && p.pend[0].who === "wanko" && p.pend[0].lv === 10 && p.done.wanko === 10 && p.done.gachan === 0, "Lv.10 で まちに はいる・Lv.11 では はいらない " + JSON.stringify(p.pend));
    // 3. じぶんたちで ひらく（つぎまで 1びょう）
    await H.eval(() => { HomeLvParty.st(G.scene).next = 1; });
    await H.until(() => PokaDebug.lvParty().phase === "gather", 8000);
    await H.until(() => PokaDebug.lvParty().phase === "party", 15000);
    p = await party(H);
    expect(p.via === "self" && p.group.lv === 10 && p.group.who.join() === "wanko" && p.banner === "わんこ レベル10 おめでとう！" && p.candles === 1 && p.kids.every((k) => k.party && k.state === "activity") && p.log2.some((l) => l.party === "start"), "じぶんたちで おいわいの 会を ひらく " + JSON.stringify({ via: p.via, banner: p.banner, kids: p.kids }));
    // ならび: 3人が かさならない（テーブルの まわり）
    const rs = p.kids.map((k) => k.rect).sort((a, b) => a.x - b.x);
    expect(rs.every((r, i) => !i || r.x - rs[i - 1].x >= 0.45 * r.w) && rs.every((r) => r.x >= 0 && r.x + r.w <= viewport.width), "3人が テーブルの まわりで かさなる・はみ出す " + JSON.stringify(rs));
    await H.wait(900); await H.shot("party");
    // 4. タップ → やめない
    const g = p.kids.find((k) => k.id === "goji");
    await H.tap(g.rect.x + g.rect.w / 2, g.rect.y + g.rect.h * 0.5); await H.wait(300);
    p = await party(H);
    expect(p.phase === "party" && p.log2.some((l) => l.party === "cheer" && l.id === "goji"), "タップで やめた・ひとことが ない " + JSON.stringify(p.log2.slice(-3)));
    let B = await bubbles(H, viewport); expect(!B.out.length, "ふきだしが はみ出す " + JSON.stringify(B.out));
    // 5. すすめる
    const mood0 = (await H.dbg("saveData")).chars.wanko.mood;
    p = await H.dbg("lvPartyNext", 12);
    expect(p.log2.some((l) => l.party === "congrats" && l.id !== "wanko" && l.text.includes("レベル10 おめでとう")) && p.log2.some((l) => l.party === "thanks" && l.id === "wanko"), "おめでとう・ありがとう " + JSON.stringify(p.log2));
    p = await H.dbg("lvPartyNext", 3);
    expect(!p.parents.length || p.log2.some((l) => l.party === "parent"), "ぱぱ ままの おめでとう が ない " + JSON.stringify(p.parents));
    p = await H.dbg("lvPartyNext", 3);
    expect(p.done2 && !p.pend.length && p.log.length === 1 && p.log[0].lv === 10 && p.log2.some((l) => l.party === "kanpai"), "かんぱいで まちから きえない " + JSON.stringify(p));
    p = await H.dbg("lvPartyNext", 11);
    expect(p.blown && p.log2.some((l) => l.party === "blow" && l.id === "wanko"), "ろうそくを ふかない " + JSON.stringify(p.log2.slice(-4)));
    await H.shot("blow");
    p = await H.dbg("lvPartyNext", 22);
    if (p.phase) p = await H.dbg("lvPartyNext", 8);
    const d = await H.dbg("saveData");
    expect(p.phase === null && p.why === "done" && p.parties === 1 && p.log2.some((l) => l.party === "end") && d.chars.wanko.mood >= Math.min(100, mood0 + 5) && p.kids.every((k) => !k.party), "おわらない・ごきげんが あがらない " + JSON.stringify({ phase: p.phase, why: p.why, mood: d.chars.wanko.mood, mood0 }));
    // 6. 3人とも Lv.20 → 1つの 会 → とちゅうで やめる
    await H.dbg("homeBubbleFixture");
    await H.dbg("level", 19);
    for (const id of IDS) { await H.dbg("nearLevelUp", id, 1); await H.dbg("gainExp", id, 5); }
    p = await party(H);
    expect(p.pend.length === 3 && p.pend.every((x) => x.lv === 20), "3人とも Lv.20 の まち " + JSON.stringify(p.pend));
    expect(await H.dbg("lvPartyStart") === true, "ひらけない");
    await H.until(() => PokaDebug.lvParty().phase === "party", 15000); await H.wait(600);
    p = await party(H);
    expect(p.banner === "みんな レベル20 おめでとう！" && p.candles === 2 && p.group.who.length === 3, "みんなの 会 " + JSON.stringify({ banner: p.banner, candles: p.candles }));
    await H.shot("all");
    B = await bubbles(H, viewport); expect(!B.out.length, "ふきだしが はみ出す（みんな） " + JSON.stringify(B.out));
    await H.houseButton("ごはん"); await H.wait(400);
    p = await party(H);
    expect(p.phase === null && p.why === "button" && p.pend.length === 3 && p.log2.some((l) => l.party === "stop"), "ごはんで やめない・まちが きえた " + JSON.stringify({ phase: p.phase, why: p.why, pend: p.pend }));
    await H.page.keyboard.press("Escape"); await H.wait(300);
  }, { viewport, timeout: 180000 });
}
