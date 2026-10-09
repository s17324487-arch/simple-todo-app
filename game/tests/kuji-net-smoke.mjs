// みんなの くじ（いちばんくじを オンラインの みんなで おなじ ロット・js/kuji-net.js・UI-100。オーナーの 指示 2026-10-06「一番くじについて、他のユーザーのくじ引き結果を連携するようにして。」）
// つなぎさきは にせの Firebase（tests/online-fake.mjs）。ほかの 人の くじは fake.write で かく（でる 賞は PokaDebug.kujiNetT と おなじ KujiNet.timeFor で きめる）
// 0. オンラインに する（18さい いじょうの 同意 → なまえ）
// 1. ほかの 人が さきに 3まい（Aしょう・Hしょう・Iしょう）ひいた ロット
// 2. ローリソンの たな → ボードの うえに「ひとりの くじ」「みんなの くじ」（ひとりの くじ は いままで どおり・みんなの くじの けいひんの しらせ）
// 3. 「みんなの くじ」→ たしかめ（おくる もの）→ きんいろの ボード・ごうかな けいひん（UI-101）・のこり 77まい・Aしょうは「でたよ」・みんなの けっか（なまえ）・はりつけ ひょう・はみ出さない
// 4. ほかの 人が ひくと すぐ ボードが かわる（リアルタイム）・Bしょうの おしらせ
// 5. じぶんで 1まい（Dしょう）→ はこ → めくる → わたす → のこりから えらぶ → けいひん（サーバーに えらんだ しゅるい）・ポイントカードに 50ポイント（UI-102）
// 6. のこり 1まい → じぶんが 80まいめ → ラストワンしょう → つぎの ロット 2（まえの ロットの ラストワンは あなた）
// 7. 「ひとりの くじ」に もどす → てもとの ロット（80まい）・ひらきなおしても ひとりの くじ
export async function kujiNetSmoke({ scenario, expect }) {
  let fake = null;
  const phase = (H, p, ms = 15000) => H.until((p) => { const u = PokaDebug.kujiUi(); return u && u.open && u.phase === p; }, ms, p);
  const btn = (H, name) => H.page.getByRole("button", { name, exact: true }).click();
  const lastDlg = (H) => H.page.locator(".dlg-text").last().textContent();
  const fits = (H) => H.eval(() => {
    const r = (e) => e.getBoundingClientRect(), pn = [...document.querySelectorAll(".modal-wrap:not(.out) .panel")].pop(), body = pn && pn.querySelector(".panel-body");
    const bs = pn ? [...pn.querySelectorAll("button")].filter((b) => b.offsetParent) : [];
    return { wide: !!body && body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth, small: bs.filter((b) => { const q = r(b); return q.width < 43.5 || q.height < 43.5; }).map((b) => b.textContent || b.getAttribute("aria-label")), edge: !!pn && r(pn).left >= 0 && r(pn).right <= innerWidth + 0.5 };
  });
  const board = (H) => H.eval(() => { const v = document.querySelector(".kuji-boardview"); return { text: v ? v.textContent : "", on: document.querySelectorAll(".kuji-cell.on").length, me: document.querySelectorAll(".kuji-cell.me").length, feed: [...document.querySelectorAll(".kuji-feed .kuji-feedrow")].map((li) => ({ g: (li.querySelector(".kuji-g") || {}).textContent, name: (li.querySelector(".kuji-feedname") || {}).textContent, me: li.classList.contains("me") })), status: (document.querySelector(".kuji-netstat") || {}).textContent || "", aGone: !!document.querySelector('.kuji-top .kuji-card[data-id="kj_mlaw_a"].gone'), deluxe: !!document.querySelector(".kuji.deluxe"), title: (document.querySelector(".kuji-title") || {}).textContent || "", ribbon: (document.querySelector(".kuji-ribbon") || {}).textContent || "", hint: (document.querySelector(".kuji-modehint") || {}).textContent || "", top: [...document.querySelectorAll(".kuji-top .kuji-card")].map((c) => c.dataset.id).join(), last: ((document.querySelector(".kuji-last img") || {}).alt) || "" }; });
  const enterStore = async (H, layout, shop) => {
    const door = layout.doors.find((d) => d.act.shop === shop); expect(door, shop + " の 入口が ない");
    await H.dbg("teleport", "town", door.x, door.y + 1, "up"); await H.idle(); await H.dbg("walkTo", door.x, door.y);
    await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 20000); await H.wait(400);
  };
  const tapShelf = async (H, shop) => {
    if (await H.dbg("storeWalkTo", 8, 3)) await H.until(() => { const s = PokaDebug.storeState(); return s && !s.party[0].moving && !s.path; }, 15000);
    await H.wait(700);
    const st = await H.dbg("storeState"), fx = st.fixtures.find((f) => f.kind === "kuji_" + shop);
    await H.tap(fx.cx, fx.cy); await phase(H, "board", 20000); await H.wait(300);
  };
  const closeBoard = async (H) => { await H.page.locator(".modal-wrap:not(.out) .close").last().click(); await H.until(() => !document.querySelector(".modal-wrap") && !PokaDebug.kujiUi().open && PokaDebug.idle(), 8000); };
  // つぎの くじ（lot の n まいめ）が g しょうに なる じこく（from から）
  const tFor = (H, lot, g, from) => H.eval(([lot, g, from]) => KujiNet.timeFor("lawson", 1, lot, g, from), [lot, g, from]);
  // 1まい ひいて けっかまで（D〜F なら はじめの しゅるいを えらぶ）
  const drawOne = async (H, pickId = null) => {
    await btn(H, "1まい ひく（1000コイン）"); await phase(H, "box", 20000);
    await btn(H, "くじを とる（1まい）"); await phase(H, "tickets");
    await H.page.locator(".kuji-ticket").first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(500);
    await btn(H, "てんいんさんに わたす");
    await H.until(() => ["choose", "result"].includes(PokaDebug.kujiUi().phase), 15000);
    if ((await H.dbg("kujiUi")).phase === "choose") { await (pickId ? H.page.locator(`.kuji-choose .kuji-card[data-id="${pickId}"]`) : H.page.locator(".kuji-choose .kuji-card").first()).click(); await phase(H, "result"); }
    await H.wait(300);
  };

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("kuji-net-" + viewport.width, async (H) => {
    if (!fake) fake = await (await import("./online-fake.mjs")).startOnlineFake();
    fake.reset();
    await H.newGameFast(); await H.dbg("kujiTheme", "lawson", "law"); await H.dbg("kujiTheme", "sevenbun", "sev"); await H.dbg("hour", 12); await H.dbg("weather", "clear"); await H.dbg("coins", 150000); await H.dbg("kujiFast", 4);
    expect(await H.dbg("onlineServer", fake.conf) === true, "にせの サーバーに つなげない");
    // 0. オンライン
    await H.phone("みんな");
    await H.page.locator(".smaho-body .onl-start").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-agree").click(); await H.wait(320);
    await H.page.locator(".modal-wrap:not(.out) .onl-nick-ok").click();
    await H.until(() => PokaDebug.online().on && !!PokaDebug.online().uid, 10000);
    const me = (await H.dbg("online")).uid;
    await H.page.keyboard.press("Escape"); await H.wait(300);
    await H.eval(() => { window.__toasts = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }).observe(document.body, { childList: true, subtree: true }); });
    // 1. ほかの 人の くじ（A・H・I）
    const t0 = Date.now() - 600000;
    fake.write("v1/players/otherA", { n: "2-2", t: Date.now() }); fake.write("v1/players/otherB", { n: "5-7", t: Date.now() });
    let lot = { n: 0, d: {} };
    for (const [k, u, g] of [[0, "otherA", "A"], [1, "otherB", "H"], [2, "otherA", "I"]]) { lot.d["k" + k] = { u, t: await tFor(H, lot, g, t0 + k * 5000) }; lot.n = k + 1; }
    fake.write("v1/kuji/lawson/lots/l1", lot);
    // 2. ひとりの くじ（きりかえ つき）
    const layout = await H.dbg("townLayout", "town");
    await enterStore(H, layout, "lawson"); await tapShelf(H, "lawson");
    let u = await H.dbg("kujiUi"), B = await board(H);
    const modes = await H.eval(() => [...document.querySelectorAll(".kuji-modes .kuji-mode")].map((b) => ({ t: b.textContent, on: b.classList.contains("on"), h: b.getBoundingClientRect().height })));
    expect(u.mode === "solo" && modes.length === 2 && modes[0].t === "ひとりの くじ" && modes[0].on && modes[1].t === "みんなの くじ" && !modes[1].on && modes.every((m) => m.h >= 44) && /のこり 80まい/.test(B.text) && /ロット 1/.test(B.text) && !B.feed.length, "ひとりの くじ と きりかえ " + JSON.stringify({ u, modes }));
    expect(!B.deluxe && B.title === "「ローリソンの てんいんさん」" && !B.ribbon && B.hint === "「みんなの くじ」は けいひんが ごうか！ おうかん ごじ など" && B.top === "kj_law_a,kj_law_b,kj_law_c" && B.last === "3にんの レジ ビッグ ぬいぐるみ", "ひとりの くじは いままでの けいひん・みんなの くじの しらせ " + JSON.stringify({ title: B.title, hint: B.hint, top: B.top, last: B.last }));
    await H.shot("solo-modes");
    // 3. みんなの くじ
    await H.page.locator('.kuji-modes .kuji-mode[data-mode="net"]').click(); await H.wait(200);
    expect((await lastDlg(H)).includes("ひいた くじ（なんまいめ・じこく・えらんだ しゅるい）を おくるよ") && (await lastDlg(H)).includes("けいひんは みんなの くじ だけの ごうかな もの！"), "みんなの くじの まえに おくる もの・ごうかな けいひんを いう");
    await H.choose(0);
    await H.until(() => { const n = PokaDebug.kujiNet("lawson"); return PokaDebug.kujiUi().mode === "net" && n.using && n.view && n.view.n === 3 && n.state === "live"; }, 20000);
    await H.until(() => document.querySelectorAll(".kuji-feed .kuji-feedrow").length === 3 && ![...document.querySelectorAll(".kuji-feedname")].some((e) => e.textContent === "…"), 10000);
    B = await board(H);
    expect(/のこり 77まい/.test(B.text) && /みんなの ロット 1/.test(B.text) && /みんなで 3まい ひいたよ（あなたは 0まい）/.test(B.text) && B.on === 3 && B.me === 0 && B.aGone && /リアルタイム/.test(B.status), "みんなの くじの ボード " + JSON.stringify({ ...B, text: B.text.slice(0, 200) }));
    expect(B.deluxe && B.title === "「ローリソンの ロイヤル パーティー」" && B.ribbon === "みんなの くじ だけの ごうかな けいひん" && !B.hint && B.top === "kj_mlaw_a,kj_mlaw_b,kj_mlaw_c" && B.last === "ロイヤル ソファ 3にん ぬいぐるみ" && /みんなの くじの あつめた けいひん 0／24しゅ/.test(B.text), "みんなの くじは ごうかな けいひん（きんいろの ボード） " + JSON.stringify({ title: B.title, ribbon: B.ribbon, top: B.top, last: B.last }));
    expect(JSON.stringify(B.feed) === JSON.stringify([{ g: "Iしょう", name: "ふわふわ ねこさん", me: false }, { g: "Hしょう", name: "わくわく ぺんぎんさん", me: false }, { g: "Aしょう", name: "ふわふわ ねこさん", me: false }]), "みんなの けっか（あたらしい じゅん・なまえ） " + JSON.stringify(B.feed));
    let L = await fits(H);
    expect(!L.wide && !L.page && !L.small.length && L.edge, "みんなの くじの ボードが はみ出す・ボタンが ちいさい " + JSON.stringify(L.small));
    await H.shot("net-board");
    // 4. リアルタイム（ほかの 人が Bしょう）
    lot = fake.at("v1/kuji/lawson/lots/l1");
    lot.d.k3 = { u: "otherB", t: await tFor(H, lot, "B", t0 + 30000) }; lot.n = 4;
    fake.write("v1/kuji/lawson/lots/l1", lot);
    await H.until(() => /のこり 76まい/.test(document.querySelector(".kuji-boardview").textContent) && (document.querySelector(".kuji-feed .kuji-feedrow .kuji-g") || {}).textContent === "Bしょう", 10000);
    await H.until(() => window.__toasts.some((t) => t.includes("わくわく ぺんぎんさんが Bしょうを ひいたよ！")), 5000);
    expect(await H.eval(() => !!document.querySelector('.kuji-top .kuji-card[data-id="kj_mlaw_b"].gone')), "ほかの 人が ひいた Bしょうが「でたよ」に ならない");
    await H.shot("net-live");
    // 5. じぶんで 1まい（Dしょう）→ えらぶ
    lot = fake.at("v1/kuji/lawson/lots/l1");
    fake.kujiT(await tFor(H, lot, "D", Date.now() + 2000));
    const c0 = (await H.dbg("saveData")).coins, pts0 = (await H.dbg("conbiniCard", "lawson")).pts;
    await btn(H, "1まい ひく（1000コイン）"); await phase(H, "box", 20000);
    u = await H.dbg("kujiUi");
    expect(u.tickets.length === 1 && u.tickets[0].g === "D" && u.tickets[0].pick, "ひいた くじ（Dしょう） " + JSON.stringify(u.tickets));
    await btn(H, "くじを とる（1まい）"); await phase(H, "tickets");
    await H.page.locator(".kuji-ticket").first().click(); await H.until(() => PokaDebug.kujiUi().tickets[0].open, 5000); await H.wait(500);
    await btn(H, "てんいんさんに わたす"); await phase(H, "choose");
    const opts = await H.eval(() => [...document.querySelectorAll(".kuji-choose .kuji-card")].map((b) => b.dataset.id));
    L = await fits(H);
    expect(opts.join() === "kj_mlaw_d0,kj_mlaw_d1,kj_mlaw_d2" && !L.wide && !L.small.length && /すきな ものを えらんでね（ベルベット チェア）/.test(await H.eval(() => document.querySelector(".kuji-tap").textContent)), "みんなの くじの Dしょうを えらぶ（ベルベット チェア） " + JSON.stringify(opts));
    await H.shot("net-choose");
    await H.page.locator('.kuji-choose .kuji-card[data-id="kj_mlaw_d1"]').click(); await phase(H, "result");
    let d = await H.dbg("saveData");
    const k4 = fake.at("v1/kuji/lawson/lots/l1/d/k4");
    expect(k4 && k4.u === me && k4.p === 1 && k4.o === 0 && fake.at("v1/kuji/lawson/lots/l1/pc") === 1 && fake.at("v1/kuji/lawson/lots/l1/n") === 5 && d.coins === c0 - 1000 && d.furn.kj_mlaw_d1 === 1 && !d.furn.kj_law_d1 && (await H.dbg("kuji", "lawson")).left === 80, "じぶんの くじ（サーバー・コイン・けいひん・ひとりの くじは そのまま） " + JSON.stringify({ k4, coins: [c0, d.coins] }));
    await H.shot("net-result");
    expect((await H.dbg("conbiniCard", "lawson")).pts === pts0 + 50, "みんなの くじ 1まいで ポイントカードに 50ポイント");
    await H.until(() => window.__toasts.some((t) => t.startsWith("ポイント +50（いま ")), 5000);
    await btn(H, "ボードに もどる"); await phase(H, "board");
    await H.until(() => document.querySelectorAll(".kuji-cell.me").length === 1, 8000);
    B = await board(H);
    expect(/のこり 75まい/.test(B.text) && B.feed[0].me && B.feed[0].name === "あなた" && B.feed[0].g === "Dしょう" && /あなたは 1まい/.test(B.text), "じぶんの くじが みんなの けっかに " + JSON.stringify(B.feed[0]));
    // 6. のこり 1まい → ラストワン → つぎの ロット
    lot = fake.at("v1/kuji/lawson/lots/l1");
    for (let k = 5; k < 79; k++) lot.d["k" + k] = { u: k % 2 ? "otherA" : "otherB", t: t0 + 40000 + k * 1000 };
    lot.n = 79;
    fake.write("v1/kuji/lawson/lots/l1", lot);
    await H.until(() => /のこり 1まい/.test(document.querySelector(".kuji-boardview").textContent), 10000);
    await H.shot("net-last1");
    await drawOne(H);
    d = await H.dbg("saveData");
    expect(await H.eval(() => !!document.querySelector(".kuji-lastone")) && d.furn.kj_mlaw_l === 1 && !d.furn.kj_law_l && fake.at("v1/kuji/lawson/lots/l1/d/k79/u") === me, "みんなの くじの 80まいめで ラストワンしょう（ロイヤル ソファ）");
    await H.shot("net-lastone");
    await btn(H, "ボードに もどる"); await phase(H, "board");
    await H.until(() => /みんなの ロット 2/.test(document.querySelector(".kuji-boardview").textContent), 15000);
    B = await board(H);
    expect(fake.at("v1/kuji/lawson/cur") === 2 && /のこり 80まい/.test(B.text) && /まえの ロット 1 の ラストワンしょうは あなた/.test(B.text) && B.on === 0, "つぎの ロット 2 " + JSON.stringify(B.text.slice(0, 220)));
    L = await fits(H); expect(!L.wide && !L.page && !L.small.length && L.edge, "ロット 2 の ボードが はみ出す");
    // 7. ひとりの くじ に もどす
    await H.page.locator('.kuji-modes .kuji-mode[data-mode="solo"]').click();
    await H.until(() => PokaDebug.kujiUi().mode === "solo" && !PokaDebug.kujiNet("lawson").using, 5000);
    B = await board(H);
    expect(/のこり 80まい/.test(B.text) && /ロット 1/.test(B.text) && !/みんなの ロット/.test(B.text) && !B.feed.length && (await H.dbg("kujiNet", "lawson")).watching === null && !B.deluxe && B.top === "kj_law_a,kj_law_b,kj_law_c", "ひとりの くじに もどる（みはるのを やめる・いままでの けいひん）");
    await closeBoard(H);
    await tapShelf(H, "lawson");
    expect((await H.dbg("kujiUi")).mode === "solo", "ひらきなおしても ひとりの くじ");
    await closeBoard(H);
    expect(fake.streams === 0 || (await H.dbg("kujiNet", "lawson")).watching === null, "ボードを とじたら ストリームも とじる");
  }, { viewport, timeout: 240000 });
  if (fake) await fake.close();
}
