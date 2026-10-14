// LINE れんけい（UI-126・js/line-link.js・game/line/Code.gs。オーナーの 指示 2026-10-14「③にしたいので許可する。」）
// つなぎさきは にせの GAS（tests/line-fake.mjs が Code.gs を そのまま うごかす・ネット なし）。本番の GAS・LINE への つうしんは tests/smoke.mjs の route が とめる
// 0. つなぎさきが から → ≡ の せっていは「じゅんびちゅう」・どこにも つながらない
// 1. 「LINE と つなぐ」→ 18さい いじょうの 同意（おくる もの・おくらない もの）→「やめる」は なにも おくらない → 同意 → 6もじの ばんごう・ともだち ついかの ボタン（はみ出さない）
// 2. LINE で ともだち ついか・ばんごうを おくる（にせの LINE）→「つながったか たしかめる」→ つながる・ようす（3人の [おなか, ごきげん]）が とどく
// 3. おくった もの は きまった かぎ だけ（op・code・sec・s）・つけた なまえは おくらない
// 4. テストの おしらせ → LINE へ push → 「LINE を はなす」→ サーバーから ばんごう・LINE の ID・ようすが きえる
import { lineFake } from "./line-fake.mjs";
export async function lineLinkSmoke({ scenario, expect }) {
  const URL = "https://script.google.com/macros/s/TESTtestTESTtestTEST1234/exec", FRIEND = "https://lin.ee/TestFriend1", UID = "U" + "a".repeat(32);
  const menu = async (H) => { await H.page.getByRole("button", { name: "メニュー", exact: true }).click(); await H.page.getByRole("button", { name: "せってい", exact: true }).click(); await H.wait(250); };
  const closeTop = async (H) => { await H.page.locator(".modal-wrap:not(.out)").last().locator(".panel-head .close").click(); await H.wait(260); };
  const fits = (H) => H.eval(() => {
    const p = [...document.querySelectorAll(".modal-wrap:not(.out) .panel")].pop(), r = p.getBoundingClientRect(), body = p.querySelector(".panel-body");
    const small = [...p.querySelectorAll(".btn")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent);
    return { ok: r.left >= -0.5 && r.right <= innerWidth + 0.5 && body.scrollWidth <= body.clientWidth + 1, small };
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("line-link-" + viewport.width, async (H) => {
    const fake = lineFake(), reqs = [];
    await H.page.route(URL, async (route) => {
      const body = route.request().postData() || ""; reqs.push(JSON.parse(body));
      await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(fake.post(body)) });
    });
    await H.newGameFast(); await H.wait(300);
    // 0. じゅんびちゅう
    expect(await H.dbg("lineServer", null) === false, "はじめから つなぎさきが ある");
    await menu(H);
    expect(await H.page.locator(".line-soon").isVisible(), "じゅんびちゅう が でない");
    await closeTop(H);
    // 1. つなぐ → 同意
    expect(await H.dbg("lineServer", { lineUrl: URL, lineFriend: FRIEND }) === true, "テストの つなぎさきに ならない");
    await H.eval(() => { Save.d.chars.gachan.name = "ひみつの なまえ"; });
    await menu(H);
    await H.page.getByRole("button", { name: "LINE と つなぐ", exact: true }).click(); await H.wait(400);
    const consent = await H.eval(() => document.querySelector(".line-consent")?.textContent || "");
    expect(/18さい いじょう/.test(consent) && /おくる もの/.test(consent) && /おくらない もの/.test(consent) && /LINE の ID/.test(consent), "同意の まど " + consent);
    let f = await fits(H); expect(f.ok && !f.small.length, "同意の まどが はみ出す " + JSON.stringify(f));
    await H.shot("consent");
    await H.page.getByRole("button", { name: "やめる", exact: true }).click(); await H.wait(300);
    expect(!reqs.length && !(await H.dbg("lineLink")).on, "やめた のに つながった");
    await H.page.getByRole("button", { name: "LINE と つなぐ", exact: true }).click(); await H.wait(400);
    await H.page.locator(".line-agree").click();
    await H.page.locator(".line-code").waitFor(); await H.wait(400);
    let st = await H.dbg("lineLink");
    const shown = await H.eval(() => document.querySelector(".line-code").textContent), href = await H.eval(() => document.querySelector(".line-friend")?.getAttribute("href"));
    expect(st.on && /^[A-HJ-NP-Z2-9]{6}$/.test(st.code) && shown === st.code && href === FRIEND && reqs.length === 1 && reqs[0].op === "hello" && fake.code(st.code), "ばんごうの まど " + JSON.stringify({ st, shown, href, reqs }));
    f = await fits(H); expect(f.ok && !f.small.length, "ばんごうの まどが はみ出す " + JSON.stringify(f));
    await H.shot("pair");
    // まだ ばんごうを おくって いない → まだ
    await H.page.getByRole("button", { name: "つながったか たしかめる", exact: true }).click(); await H.wait(400);
    expect(/まだ つながって いない/.test(await H.eval(() => document.querySelector(".line-msg").textContent)) && !(await H.dbg("lineLink")).linked, "まだ つながって いないのに");
    // 2. LINE で ともだち ついか → ばんごうを おくる
    fake.line([{ type: "follow", replyToken: "rf", source: { type: "user", userId: UID } }]);
    fake.text(UID, st.code);
    expect(fake.code(st.code).u === UID && fake.last().path === "reply", "にせの LINE で つながらない");
    await H.page.getByRole("button", { name: "つながったか たしかめる", exact: true }).click();
    await H.until(() => PokaDebug.lineLink().linked && !document.querySelector(".line-code"), 8000); await H.wait(300);
    st = await H.dbg("lineLink");
    const srv = fake.code(st.code);
    expect(st.linked && srv.s && srv.s.w.length === 2 && srv.t > 0, "つながった あとに ようすが とどかない " + JSON.stringify(srv));
    // 3. おくった もの
    expect(reqs.every((b) => Object.keys(b).every((k) => ["op", "code", "sec", "s"].includes(k))) && reqs.some((b) => b.op === "state") && !JSON.stringify(reqs).includes("ひみつ"), "おくった もの " + JSON.stringify(reqs));
    // 4. せってい: つながって いる → テスト → はなす
    await closeTop(H); await menu(H);
    expect(await H.page.getByText("LINE と つながって いるよ").isVisible(), "つながって いる が でない");
    await H.shot("settings");
    await H.page.getByRole("button", { name: "テストの おしらせを おくる", exact: true }).click(); await H.wait(500);
    expect(fake.sent.some((x) => x.path === "push" && x.body.to === UID), "テストの おしらせが LINE に いかない");
    await H.page.getByRole("button", { name: "LINE を はなす", exact: true }).click(); await H.wait(300);
    await H.page.getByRole("button", { name: "はなす", exact: true }).click(); await H.wait(500);
    st = await H.dbg("lineLink");
    expect(!st.on && !st.code && !fake.code(srv && reqs[0].code) && !fake.store.has("u:" + UID), "はなしても サーバーに のこった " + JSON.stringify([st, Object.keys(fake.props())]));
    expect(await H.page.getByRole("button", { name: "LINE と つなぐ", exact: true }).isVisible(), "はなした あとに また つなげない");
    await closeTop(H);
    await H.dbg("lineServer", null);
  }, { viewport, timeout: 120000 });
}
