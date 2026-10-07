// おうちで あそぶ・よむ・しゅくだい（js/home-play.js・UI-106。オーナーの 依頼 2026-10-07「3人で遊んだり、本を読んだり、宿題をしたりさせてくれ。…誰かが遊び道具…や本、
// 国語や数学のドリル、のアイテムを持っている必要があるようにしろ。…種類によっても行動・会話パターンを変えよう」）
// 1. なにも もって いない:「あそぶ」→ かくれんぼ・ボールあそび・やめる と かいかたの ヒント
// 2. 3人に トランプ・きょうりゅう ずかん・くくの ドリルを もたせる →「あそぶ」に「トランプ（わんこ）」など → トランプ → さそう・こたえる → まるく すわる（手の もちものは おいて てもちの カード）
// 3. あそんで いる 子を タップ → やめない（ひとこと）
// 4. すすめる → かけあい → ぱぱ・ままの ひとこと → おわり（かった 子）→ ごきげんが あがる → たちあがる
// 5. ずかん → よこ 一列 → したの「ごはん」→ やめて「また あとでね」→ ごはんの まど
// 6. おうちに ある もの（わんこ・がちゃんが てばなした トランプ・ずかん）:「あそぶ」に「あそびどうぐで あそぶ」「ほんを よむ」→ ほんを よむ → ずかんが すきな ごじが とりだして もって くる
// 7. なにも いわなくても じぶんたちで はじめる（つぎまでの びょうを 1に・オーナーの 追加 2026-10-07「何も指示しなくても自律的にごわがが行う」）→ こころの こえ → ドリル → はなまる
// 8. ふきだし・えらぶ まどが 画面から はみ出さない（390／375）
export async function homePlaySmoke({ scenario, expect }) {
  const IDS = ["wanko", "gachan", "goji"];
  const play = (H) => H.dbg("homePlay");
  const choices = async (H) => { await H.page.locator(".dlg-shade.ask .choices .btn").first().waitFor(); await H.wait(200); return H.eval(() => ({ q: document.querySelector(".dlg-shade.ask .dlg-text")?.textContent || "", ch: [...document.querySelectorAll(".dlg-shade.ask .choices .btn")].map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent, l: r.left, r: r.right, top: r.top, b: r.bottom, h: r.height }; }) })); };
  const pick = (H, t) => H.page.locator(".dlg-shade.ask .choices .btn").filter({ hasText: new RegExp("^" + t.replace(/[()（）]/g, "\\$&") + "$") }).click();
  const fits = (vp, ch) => ch.every((b) => b.l >= 0 && b.r <= vp.width + 0.5 && b.top >= 0 && b.b <= vp.height + 0.5 && b.h >= 43.5);
  const bubbles = async (H, vp) => { const b = await H.dbg("homeBubbleState"); return { n: b.boxes.length, out: b.boxes.filter((x) => x.x < -0.5 || x.x + x.w > vp.width + 0.5 || x.y < -0.5 || x.y + x.h > vp.height + 0.5) }; };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-play-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 19); await H.dbg("weather", "clear"); await H.wait(400);
    let p = await play(H);
    expect(p && p.phase === null && p.next >= 45 && p.next <= 100 && p.options.length === 0, "はじめの ようす（さいしょは 45びょう〜1ふん40びょう あと・あそべる ものは まだ ない）" + JSON.stringify(p && { next: p.next, options: p.options }));
    await H.dbg("homeBubbleFixture");
    const name = await H.eval(() => Object.fromEntries(["wanko", "gachan", "goji"].map((id) => [id, Save.d.chars[id].name])));
    // 1. なにも もって いない
    await H.houseButton("あそぶ");
    let c = await choices(H);
    expect(c.ch.map((b) => b.t).join() === "かくれんぼ,ボールあそび,やめる" && /コンビニ/.test(c.q) && fits(viewport, c.ch), "もって いない ときの「あそぶ」 " + JSON.stringify(c));
    await pick(H, "やめる"); await H.wait(300);
    // 2. 3人に もたせる → トランプ
    await H.dbg("playHold", "wanko", "pg_cards"); await H.dbg("playHold", "gachan", "bk_dino"); await H.dbg("playHold", "goji", "dr_kuku");
    await H.dbg("homeBubbleFixture"); await H.wait(300);
    p = await play(H);
    expect(p.options.length === 3 && p.can, "あそべる もの 3つ " + JSON.stringify(p.options));
    await H.houseButton("あそぶ");
    c = await choices(H);
    const labels = c.ch.map((b) => b.t), dino = await H.eval(() => PlayGoods.INDEX.bk_dino.name), kuku = await H.eval(() => PlayGoods.INDEX.dr_kuku.name);
    expect(labels.length === 6 && labels[0] === "かくれんぼ" && labels[1] === "ボールあそび" && labels[5] === "やめる" && labels.includes(`トランプ（${name.wanko}）`) && labels.includes(`${dino}（${name.gachan}）`) && labels.includes(`${kuku}（${name.goji}）`) && fits(viewport, c.ch), "「あそぶ」に もって いる もの " + JSON.stringify(c));
    await H.shot("menu");
    await pick(H, `トランプ（${name.wanko}）`);
    await H.until(() => PokaDebug.homePlay().phase === "gather", 5000);
    p = await play(H);
    expect(p.kind === "cards" && p.holder === "wanko" && p.form === "circle" && p.via === "menu", "トランプで あつまる " + JSON.stringify({ kind: p.kind, holder: p.holder, form: p.form }));
    await H.until(() => PokaDebug.homePlay().phase === "play", 20000);
    p = await play(H);
    const start = p.log.find((l) => l.at === "start"), agree = p.log.filter((l) => l.at === "agree");
    expect(start && start.id === "wanko" && agree.length === 2 && agree.every((l) => l.id !== "wanko"), "さそう → ふたりが こたえる " + JSON.stringify(p.log));
    expect(p.kids.every((k) => k.play && k.state === "activity" && !k.handShown), "3人が すわる・もって いる あそびどうぐ・ほん・ドリルは 手から おく（トランプは てもちの カードを 描く） " + JSON.stringify(p.kids));
    // まるく すわる: もって いる 子が おく・ふたりが まえの ひだり みぎ（画面で）
    const k = Object.fromEntries(p.kids.map((x) => [x.id, x])), others = p.order.slice(1).map((id) => k[id]);
    expect(others.every((o) => o.y > k.wanko.y - 5) && Math.abs(others[0].x - others[1].x) > 40 && others.some((o) => o.dir === "right") && others.some((o) => o.dir === "left"), "まるく すわって いない " + JSON.stringify(p.kids));
    await H.wait(500); await H.shot("cards");
    // 3. タップ → やめない
    const g = k.gachan;
    await H.tap(g.rect.x + g.rect.w / 2, g.rect.y + g.rect.h * 0.45); await H.wait(300);
    p = await play(H);
    expect(p.phase === "play" && p.log.some((l) => l.at === "cheer" && l.id === "gachan"), "なでても やめない（ひとこと） " + JSON.stringify(p.log.slice(-3)));
    // 4. すすめる → おわり
    await H.dbg("needs", 80, 50);
    const mood0 = Object.fromEntries((await play(H)).kids.map((x) => [x.id, x.mood]));
    await H.dbg("pause", true);
    await H.dbg("homePlayNext", 40);
    p = await play(H);
    await H.dbg("pause", false);
    const beats = p.log.filter((l) => l.at === "beat");
    expect(p.phase === null && p.why === "done" && p.plays === 1 && p.last === "cards" && beats.length >= 9 && p.log.some((l) => l.at === "end") && p.log.some((l) => l.at === "parent" && (l.id === "papa" || l.id === "mama")) && p.log.some((l) => l.at === "reply"), "かけあい → ぱぱ ままの ひとこと → おわり " + JSON.stringify({ phase: p.phase, why: p.why, log: p.log.map((l) => l.at + ":" + l.id) }));
    expect(p.kids.every((x) => !x.play && x.mood >= mood0[x.id] + 5 && x.handShown) && p.next >= 145, "おわると ごきげん・たちあがる・つぎは しばらく あと " + JSON.stringify(p.kids.map((x) => [x.id, x.mood, mood0[x.id]])));
    // 5. ずかん → したの「ごはん」で やめる
    await H.dbg("homeBubbleFixture"); await H.wait(200);
    expect(await H.dbg("homePlayStart", "gachan", "bk_dino") === true, "ずかんで はじまらない");
    await H.until(() => PokaDebug.homePlay().phase === "play", 20000);
    p = await play(H);
    const ys = p.kids.map((x) => x.rect.y + x.rect.h), xs = p.kids.map((x) => x.rect.x).sort((a, b) => a - b);
    expect(p.form === "row" && Math.max(...ys) - Math.min(...ys) < 8 && xs[1] - xs[0] > 20 && xs[2] - xs[1] > 20 && p.kids.every((x) => x.dir === "down"), "ずかんは よこ 一列で いっしょに みる " + JSON.stringify(p.kids));
    await H.wait(1600);
    let bb = await bubbles(H, viewport);
    expect(bb.out.length === 0, "ふきだしが はみ出す " + JSON.stringify(bb));
    await H.shot("book");
    await H.houseButton("ごはん");
    await H.until(() => PokaDebug.homePlay().phase === null, 3000);
    p = await play(H);
    expect(p.why === "button" && p.log.some((l) => l.at === "stop" && l.id === "gachan") && p.kids.every((x) => !x.play), "ボタンで やめる（また あとでね） " + JSON.stringify(p.log.slice(-2)));
    expect((await H.page.$$(".panel .grid .card")).length > 0, "ごはんの まどが ひらかない");
    await H.page.keyboard.press("Escape"); await H.until(() => !document.querySelector(".modal-wrap:not(.out)"), 5000); await H.wait(300);
    // 6. おうちに ある もの: わんこ・がちゃんが てばなす（トランプ・ずかんは おうちに ある）→「ほんを よむ」→ ごじが ずかんを とりだす
    await H.dbg("playHold", "wanko", null); await H.dbg("playHold", "gachan", null);
    await H.dbg("homeBubbleFixture"); await H.wait(200);
    await H.houseButton("あそぶ");
    c = await choices(H);
    const l2 = c.ch.map((b) => b.t);
    expect(l2.join() === ["かくれんぼ", "ボールあそび", `${kuku}（${name.goji}）`, "あそびどうぐで あそぶ", "ほんを よむ", "やめる"].join() && fits(viewport, c.ch), "「あそぶ」に おうちに ある ものの しゅるい " + JSON.stringify(c));
    await H.shot("menu-house");
    await pick(H, "ほんを よむ");
    await H.until(() => PokaDebug.homePlay().phase === "gather", 5000);
    p = await play(H);
    expect(p.kind === "dino" && p.house && p.holder === "goji" && p.via === "menu" && p.kids.find((x) => x.id === "goji").handShown && !p.kids.find((x) => x.id === "gachan").handShown, "ずかんが すきな ごじが おうちの ずかんを とりだして もって くる " + JSON.stringify({ kind: p.kind, house: p.house, holder: p.holder, kids: p.kids.map((x) => [x.id, x.handShown]) }));
    await H.wait(300); await H.shot("house-book-gather");
    await H.until(() => PokaDebug.homePlay().phase === "play", 20000);
    p = await play(H);
    expect(p.form === "row" && p.kids.every((x) => x.play && !x.handShown) && (await H.dbg("playGoods")).held.goji === "dr_kuku", "すわって よむ（ずかんは canvas・ごじの もちものは ドリルの まま） " + JSON.stringify(p.kids));
    // 7. なにも いわなくても じぶんたちで（おうちの トランプ・ずかんを なくして ごじの ドリル だけ）→ こころの こえ → ドリル → はなまる
    await H.dbg("playStock", "pg_cards", 0); await H.dbg("playStock", "bk_dino", 0);
    await H.dbg("homeBubbleFixture"); await H.wait(200);
    await H.dbg("homePlayStart", null, null, 1);
    await H.until(() => PokaDebug.homePlay().phase === "gather", 8000);
    await H.until(() => PokaDebug.homePlay().log.some((l) => l.at === "start"), 6000);
    p = await play(H);
    const th = p.log.filter((l) => l.at === "think");
    expect(p.kind === "kuku" && p.holder === "goji" && p.cat === "drill" && p.via === "self" && !p.house && th.length === 1 && th[0].id === "goji" && p.log.some((l) => l.at === "start" && l.id === "goji"), "じぶんたちで はじめる（ごじの こころの こえ → ドリル） " + JSON.stringify({ kind: p.kind, holder: p.holder, log: p.log.map((l) => l.at + ":" + l.id) }));
    await H.until(() => PokaDebug.homePlay().phase === "play", 20000);
    await H.wait(1500); bb = await bubbles(H, viewport);
    expect(bb.out.length === 0, "ドリルの ふきだしが はみ出す " + JSON.stringify(bb));
    await H.shot("drill");
    await H.dbg("pause", true); await H.dbg("homePlayNext", 31);
    p = await play(H);
    expect(p.phase === "end" && p.ev === "stamp" && !p.winner, "ドリルの おわりは はなまる " + JSON.stringify({ phase: p.phase, ev: p.ev }));
    await H.dbg("pause", false); await H.wait(600); await H.shot("drill-end");
    await H.until(() => PokaDebug.homePlay().phase === null, 12000);
    // さいかい: セーブに のこらない（もちものは のこる）
    await H.dbg("save"); await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click(); await H.idle();
    await H.until(() => G.sceneName === "house" && !Game.trans, 20000);
    p = await play(H);
    expect(p && p.phase === null && p.plays === 0 && (await H.dbg("playGoods")).held.goji === "dr_kuku", "さいかい: あそびは はじめから・もちものは のこる");
  }, { viewport, timeout: 200000, full: viewport.width === 375 });
}
