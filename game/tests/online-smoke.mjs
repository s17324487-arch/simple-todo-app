// オンライン（E5・UI-94・js/online.js・js/online-net.js）。オーナーの 指示（2026-10-02）「リアルタイム通信無料でできること。さらにその機能をオンにするには、18歳以上であることの同意ボタンを用意すること。」と 2026-10-05 の 許可
// （おくるのは 匿名の ID・きまった ことばの なまえ・おてつだいの スコア だけ）。つなぎさきは にせの Firebase（tests/online-fake.mjs・ネット なし）
// 0. ほんとうの つなぎさき（js/online-config.js）: 同意の まえは どこにも つながらない（本番への つうしんは tests/smoke.mjs の route が とめて しっぱいに する）・同意の まどの データの おきば・「やめる」
//    つなぎさきが から（PokaDebug.onlineServer で から に する）→ ≡ と すまほの「みんな」は「じゅんびちゅう」・どこにも つながらない
// 1. ≡ → オンラインを はじめる → 18さい いじょうの 同意（おくる もの・おくらない もの）→「やめる」は なにも おくらない → 同意 → なまえ（きまった ことば 2つ）→ サーバーに なまえ
// 2. クレープの おてつだい → けっかに「てんすう」・「みんなの ランキングに おくったよ」→ サーバーに スコア（なまえ・おみせ Lv・あそびかた・じこく）
// 3. すまほの「みんな」: じぶんの ぎょう・ほかの 人の きろくが リアルタイムで ふえる（ストリーム）・へんな データは でない・31い いじょうの とき・ボードを かえる・とじると ストリームも とじる
// 4. なまえを かえる（トークンが きれて いても つなぎなおす）→ サーバーの なまえも かわる
// 5. とめる → もう おくらない → また はじめる（同意だけ もう いちど。「やめる」の すぐ あとの Esc は すまほを とじる）→ たまって いた きろくを おくる
// 6. みせた データを けす → サーバーの データと アカウントが きえる・てもとの きろくは のこる・つぎは また 同意から
export async function onlineSmoke({ scenario, expect }) {
  let fake = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitNode = async (fn, ms, what) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return; await sleep(100); } throw new Error("まちきれない: " + what); };
  const menu = async (H) => { await H.page.getByRole("button", { name: "メニュー", exact: true }).click(); await H.page.getByRole("button", { name: "せってい", exact: true }).click(); await H.wait(250); };
  const closeTop = async (H) => { await H.page.locator(".modal-wrap:not(.out)").last().locator(".panel-head .close").click(); await H.wait(260); };
  // いちばん うえの まどが 画面に はいって いて、よこに はみ出さない・ボタンは 44px いじょう
  const fits = async (H, sel, what) => {
    const r = await H.eval((sel) => {
      const p = [...document.querySelectorAll(".modal-wrap:not(.out) .panel")].pop(), pr = p.getBoundingClientRect();
      const small = [...p.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((b) => b.height < 44 || b.width < 44 || b.left < pr.left - 1 || b.right > pr.right + 1);
      const body = p.querySelector(".panel-body");
      return { p: [pr.left, pr.top, pr.right, pr.bottom], w: innerWidth, h: innerHeight, small: small.length, over: body.scrollWidth > body.clientWidth + 2 || document.documentElement.scrollWidth > innerWidth };
    }, sel);
    expect(r.p[0] >= -0.5 && r.p[1] >= -0.5 && r.p[2] <= r.w + 0.5 && r.p[3] <= r.h + 0.5 && !r.small && !r.over, what + ": まどが はみ出す／ボタンが ちいさい " + JSON.stringify(r));
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("online-" + viewport.width, async (H) => {
    if (!fake) fake = await (await import("./online-fake.mjs")).startOnlineFake();
    fake.reset();
    await H.newGameFast(); await H.dbg("hour", 12); await H.page.mouse.click(5, 5);
    // 0. ほんとうの つなぎさき: 同意の まえは つながらない・データの おきば・「やめる」
    let o = await H.dbg("online");
    expect(o && !o.on && !o.agreed && !o.uid, "はじめから オンライン " + JSON.stringify(o));
    if (o.ready) {
      expect(o.place && o.place !== "テストの サーバー", "ほんとうの つなぎさきの データの おきば " + o.place);
      await H.phone("みんな");
      expect(await H.page.locator(".smaho-body .onl-start").count() === 1 && await H.page.locator(".smaho-body .onl-app .onl-soon").count() === 0, "すまほの「みんな」に「はじめる」が ない");
      await H.page.keyboard.press("Escape"); await H.wait(300);
      await menu(H);
      await H.page.locator(".onl-settings .onl-begin").click(); await H.wait(320);
      const c0 = await H.eval(() => [...document.querySelectorAll(".modal-wrap:not(.out) .onl-modal")].pop()?.textContent || "");
      expect(c0.includes(o.place) && c0.includes("18さい いじょう"), "同意の まどの データの おきば " + c0);
      await H.page.locator(".modal-wrap:not(.out) .onl-cancel").click(); await H.wait(300);
      await closeTop(H);
      o = await H.dbg("online");
      expect(!o.on && !o.agreed && !o.uid && !(await H.eval(() => localStorage.getItem("pokapoka-town-online-v1"))), "「やめる」で つながった " + JSON.stringify(o));
    }
    // つなぎさきが から（js/online-config.js が から の とき と おなじ）→ じゅんびちゅう
    expect(await H.dbg("onlineServer", { apiKey: "", databaseURL: "", projectId: "" }) === false, "から の つなぎさきで じゅんびちゅう に ならない");
    o = await H.dbg("online");
    expect(o && !o.ready && !o.on, "から の つなぎさき " + JSON.stringify(o));
    for (const b of ["crepe", "burger", "burger_mac", "relay", "korokoro", "korokoro_score", "brain_spot", "brain_eng_jh_word", "brain_eng_hs_fill", "kobo_logic", "kobo_numpla_easy", "kobo_numpla_expert", "gasstand", "postoffice"]) expect(o.boards.includes(b), "ボードが ない " + b + " " + o.boards);
    expect(!o.boards.includes("link") && !o.boards.includes("brain_eng") && !o.boards.includes("kobo_numpla"), "ボードが へん " + o.boards);
    await H.phone("みんな");
    expect(await H.page.locator(".smaho-body .onl-app .onl-soon").count() === 1 && await H.page.locator(".smaho-body .onl-start").count() === 0, "すまほの「みんな」が じゅんびちゅう で ない");
    await H.shot("soon");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    await menu(H);
    expect(await H.page.locator(".onl-settings .onl-soon").count() === 1 && await H.page.locator(".onl-settings .btn").count() === 0, "≡ の オンラインが じゅんびちゅう で ない");
    await closeTop(H);
    expect(fake.log.length === 0, "じゅんびちゅう なのに つながった " + JSON.stringify(fake.log));
    // 1. にせの サーバー → 同意（やめる）→ 同意 → なまえ
    expect(await H.dbg("onlineServer", fake.conf) === true, "にせの サーバーに つなげない");
    await menu(H);
    await H.page.locator(".onl-settings .onl-begin").click(); await H.wait(320);
    const consent = await H.eval(() => [...document.querySelectorAll(".modal-wrap:not(.out) .onl-modal")].pop()?.textContent || "");
    for (const t of ["オンラインの まえに", "おくる もの", "おくらない もの", "ほんとうの なまえ・メール・いばしょ・カメラの しゃしん", "18さい いじょう", "テストの サーバー"]) expect(consent.includes(t), "同意の まどに「" + t + "」が ない " + consent);
    await fits(H, ".onl-foot .btn", "同意の まど"); await H.shot("consent");
    await H.page.locator(".modal-wrap:not(.out) .onl-cancel").click(); await H.wait(300);
    o = await H.dbg("online");
    expect(!o.on && !o.agreed && fake.log.length === 0 && !(await H.eval(() => localStorage.getItem("pokapoka-town-online-v1"))), "「やめる」で つながった " + JSON.stringify([o, fake.log]));
    await H.page.locator(".onl-settings .onl-begin").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").waitFor();
    await fits(H, ".onl-nick-sel, .onl-dice, .onl-nick-ok", "なまえの まど");
    expect(fake.log.length === 0, "なまえを きめる まえに つながった");
    await H.page.locator(".modal-wrap:not(.out) .onl-dice").click(); await H.wait(120);
    const sels = H.page.locator(".modal-wrap:not(.out) .onl-nick-sel");
    await sels.nth(0).selectOption("2"); await sels.nth(1).selectOption("2"); await H.wait(120);
    expect((await H.page.locator(".modal-wrap:not(.out) .onl-nick-prev").textContent()) === "ふわふわ ねこ", "なまえの みほんが ちがう");
    await H.shot("name");
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await H.until(() => PokaDebug.online().on && !!PokaDebug.online().uid, 10000);
    o = await H.dbg("online");
    await waitNode(() => !!fake.at("v1/players/" + o.uid), 8000, "なまえが サーバーに とどく");
    const player = fake.at("v1/players/" + o.uid);
    expect(player.n === "2-2" && typeof player.t === "number" && Object.keys(player).sort().join() === "n,t" && fake.users.includes(o.uid), "サーバーの なまえが ちがう " + JSON.stringify(player));
    expect(JSON.stringify(Object.keys(fake.data.v1)) === '["players"]', "なまえ いがいを おくった " + JSON.stringify(fake.data));
    const stored = await H.eval(() => JSON.parse(localStorage.getItem("pokapoka-town-online-v1")));
    expect(stored && stored.uid === o.uid && stored.refresh && !("id" in stored) && !JSON.stringify(await H.dbg("persistedSave")).includes(stored.refresh), "ログインの きろくが へん（セーブに はいって いる） " + JSON.stringify(stored));
    await H.until(() => !!document.querySelector(".onl-settings .onl-state.on"), 5000);
    expect((await H.page.locator(".onl-settings .onl-state").textContent()).includes("ふわふわ ねこ") && await H.page.locator(".onl-settings .onl-rename, .onl-settings .onl-stop, .onl-settings .onl-wipe").count() === 3, "≡ の オンの ようすが ない");
    await H.shot("settings-on");
    await closeTop(H);
    // 2. おてつだい → てんすう → サーバー
    await H.playShop("crepe", 1);
    expect(/てんすう\s*\d+/.test(H.shopResult) && H.shopResult.includes("じこベスト") && H.shopResult.includes("みんなの ランキングに おくったよ"), "けっかに てんすうが ない " + H.shopResult);
    await H.until(() => (PokaDebug.online().sent.crepe || 0) > 0, 10000);
    o = await H.dbg("online");
    const best = o.best.crepe.s, mine = fake.at(`v1/scores/crepe/${o.uid}`);
    expect(best > 0 && H.shopResult.includes(best.toLocaleString("ja-JP")) && mine && mine.s === best && mine.n === "2-2" && mine.l >= 1 && mine.m === "normal" && typeof mine.t === "number", "サーバーの スコアが ちがう " + JSON.stringify([best, mine]));
    expect(Object.keys(fake.data.v1.scores).join() === "crepe", "ほかの ボードまで おくった " + Object.keys(fake.data.v1.scores));
    // 3. すまほの「みんな」: ランキング・リアルタイム
    await H.phone("みんな");
    await H.until(() => !!document.querySelector(".onl-rank .onl-row.me") && document.querySelector(".onl-status")?.dataset.state === "live", 10000);
    expect(await H.page.locator(".onl-board").inputValue() === "crepe", "さいしょの ボードが クレープで ない");
    expect((await H.page.locator(".onl-row.me").textContent()).includes("ふわふわ ねこ（あなた）") && (await H.page.locator(".onl-row.me .onl-score").textContent()) === best.toLocaleString("ja-JP"), "じぶんの ぎょうが ちがう");
    await waitNode(() => fake.streams === 1, 5000, "ストリームが 1つ");
    fake.write("v1/scores/crepe/otherA1", { s: best + 500, n: "5-7", t: { ".sv": "timestamp" }, l: 12, m: "hard" });
    // ふえた ぎょうと おしらせ（トーストは 2.4びょうで きえる ので いっしょに まつ）
    await H.until(() => document.querySelectorAll(".onl-rank .onl-row").length === 2 && !document.querySelector(".onl-row.top1").classList.contains("me") && [...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("わくわく ぺんぎんさんが")), 8000);
    expect((await H.page.locator(".onl-row.top1").textContent()).includes("わくわく ぺんぎん") && (await H.page.locator(".onl-row.top1 .onl-sub").textContent()) === "Lv.12・むずかしい" && await H.page.locator(".onl-row.top1.fresh").count() === 1, "ほかの 人の きろくが でない");
    // へんな データ（かず で ない・タグの ような なまえ）は でない／もじの まま
    fake.write("v1/scores/crepe/badA", { s: "lots", n: "1-1" });
    fake.write("v1/scores/crepe/badB", { s: 7, n: '<img src=x onerror="window.__onlXss=1">' });
    await H.until(() => document.querySelectorAll(".onl-rank .onl-row").length === 3, 8000);
    expect(await H.page.locator(".onl-rank img").count() === 0 && !(await H.eval(() => window.__onlXss)) && (await H.page.locator(".onl-rank").textContent()).includes("なまえ なし"), "へんな データの あつかいが ちがう");
    await H.shot("rank");
    const rows = await H.eval(() => ({ small: [...document.querySelectorAll(".onl-row, .onl-board")].filter((e) => e.getBoundingClientRect().height < 44).length, over: (() => { const b = document.querySelector(".smaho-body"); return b.scrollWidth > b.clientWidth + 2; })() }));
    expect(!rows.small && !rows.over, "ランキングが ちいさい／はみ出す " + JSON.stringify(rows));
    // 31い いじょう: ボードを まるごと かきかえ（put "/"）→ 30い まで・じぶんの いち
    const many = fake.at("v1/scores/crepe");
    for (let i = 0; i < 31; i++) many["many" + i] = { s: best + 1000 + i, n: `${i % 24}-${(i * 5) % 24}`, t: Date.now() - i };
    fake.write("v1/scores/crepe", many);
    await H.until(() => document.querySelectorAll(".onl-rank .onl-row").length === 30 && /^あなたは \d+い/.test(document.querySelector(".onl-mine").textContent), 8000);
    expect((await H.page.locator(".onl-mine").textContent()).startsWith("あなたは 33い"), "じぶんの じゅんいが ちがう " + await H.page.locator(".onl-mine").textContent());
    // ボードを かえる → ストリームも かわる
    await H.page.locator(".onl-board").selectOption("brain_spot");
    await H.until(() => PokaDebug.online().watching?.board === "brain_spot" && PokaDebug.online().watching.loaded, 8000);
    expect((await H.page.locator(".onl-rank").textContent()).includes("まだ だれも いないよ") && (await H.page.locator(".onl-mine").textContent()).includes("まだ ないよ"), "からの ボードの ことばが ない");
    await waitNode(() => fake.streams === 1, 5000, "まえの ストリームが とじる");
    await H.page.keyboard.press("Escape"); await H.wait(300);
    expect((await H.dbg("online")).watching === null, "すまほを とじても みはって いる");
    await waitNode(() => fake.streams === 0, 5000, "すまほを とじると ストリームも とじる");
    // 4. なまえを かえる（トークンが きれて いても つなぎなおす）
    fake.expireTokens();
    await menu(H);
    await H.page.locator(".onl-settings .onl-rename").click(); await H.wait(300);
    await sels.nth(0).selectOption("0"); await sels.nth(1).selectOption("23"); await H.wait(100);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await waitNode(() => fake.at("v1/players/" + o.uid)?.n === "0-23" && fake.at(`v1/scores/crepe/${o.uid}`)?.n === "0-23", 10000, "あたらしい なまえが サーバーに とどく");
    await H.until(() => document.querySelector(".onl-settings .onl-state")?.textContent.includes("ぽかぽか きのこ"), 5000);
    // 5. とめる → おくらない → また はじめる
    await H.page.locator(".onl-settings .onl-stop").click(); await H.choose(0);
    await H.until(() => !PokaDebug.online().on && !!document.querySelector(".onl-settings .onl-begin"), 5000);
    await closeTop(H);
    const n0 = fake.log.length;
    let r = await H.dbg("onlineRecord", "crepe", best + 9999, 3);
    await H.wait(600);
    expect(r && r.best && !r.sent && fake.log.length === n0 && fake.at(`v1/scores/crepe/${o.uid}`).s === best, "とめたのに おくった " + JSON.stringify([r, fake.log.slice(n0)]));
    await H.phone("みんな");
    expect(await H.page.locator(".smaho-body .onl-start").count() === 1 && fake.log.length === n0, "とめた ときの「みんな」が ちがう");
    // 同意を「やめる」→ すぐ Esc（同意の まどが とじる アニメの とちゅうでも、Esc は その したの すまほを とじる）
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-cancel").click(); await H.page.keyboard.press("Escape"); await H.wait(300);
    expect(!(await H.dbg("smahoState")).open && !(await H.dbg("online")).on && fake.log.length === n0, "やめた すぐ あとの Esc で すまほが とじない／おくった");
    await H.phone("みんな");
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click();
    await H.until(() => PokaDebug.online().on, 8000);
    expect(await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").count() === 0, "2かいめも なまえを きく");
    await waitNode(() => fake.at(`v1/scores/crepe/${o.uid}`)?.s === best + 9999, 10000, "たまって いた きろくを おくる");
    expect(await H.page.locator(".onl-board").inputValue() === "brain_spot", "さいごに みた ボードを おぼえて いない");
    await H.page.locator(".onl-board").selectOption("crepe");
    await H.until((s) => document.querySelector(".onl-rank .onl-row.me .onl-score")?.textContent === s, 10000, (best + 9999).toLocaleString("ja-JP"));
    await H.page.keyboard.press("Escape"); await H.wait(300);
    // 6. みせた データを けす
    await menu(H);
    await H.page.locator(".onl-settings .onl-wipe").click(); await H.choose(0);
    await H.until(() => !PokaDebug.online().uid && !PokaDebug.online().agreed, 10000);
    expect(!fake.at("v1/players/" + o.uid) && !fake.at(`v1/scores/crepe/${o.uid}`) && !fake.users.includes(o.uid), "サーバーに のこって いる " + JSON.stringify(fake.data));
    o = await H.dbg("online");
    expect(!o.on && o.best.crepe.s === best + 9999 && !Object.keys(o.sent).length && !(await H.eval(() => localStorage.getItem("pokapoka-town-online-v1"))), "けした あとの てもとが ちがう " + JSON.stringify(o));
    await H.until(() => !!document.querySelector(".onl-settings .onl-begin") && !document.querySelector(".onl-settings .onl-wipe"), 5000);
    await H.shot("wiped");
    await closeTop(H);
    // セーブに のこる（さいかい）・オフの あいだは つながらない
    await H.dbg("save");
    const saved = await H.dbg("persistedSave");
    expect(saved.online && saved.online.best.crepe.s === best + 9999 && saved.online.agreed === 0 && saved.online.nick.join() === "0,23", "セーブに オンラインの きろくが ない " + JSON.stringify(saved.online));
    const n1 = fake.log.length;
    await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click(); await H.idle(30000);
    await H.dbg("onlineServer", fake.conf);
    await H.phone("みんな");
    expect(await H.page.locator(".smaho-body .onl-start").count() === 1 && fake.log.length === n1, "けした あとに つながった");
    await H.page.keyboard.press("Escape"); await H.wait(200);
  }, { viewport, timeout: 180000 });
  if (fake) await fake.close();
}
