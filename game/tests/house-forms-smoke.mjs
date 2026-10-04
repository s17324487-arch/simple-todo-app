// たてものの かたち（js/house-ext*.js・js/koumuten.js・UI-91。オーナーの FB 2026-10-04「工務店について、もっと建物の形から変わるような種類を増やして。
// 3階建てにできたり、奇抜な建物にできたりしてよい。」）
// 1. 工務店の「たてものの みほん」を タップ → 「たてもの」の タブ（7しゅ・タブ 11・はみ出さない・44px）
// 2. おしろを ためす → たかい 絵の わく → えんとつの タブは「つかわないよ」・やねの タブは つかう → きのこの ペンキは「かさ」「じく」→ おしろを かう（9800）
// 3. 7しゅ × やね 5 × やねの うえ 4 × えんとつ 4 の 絵が わくの なかに おさまる（ブラウザで はかる・きれない）
// 4. 町の おうち: おしろ（たかい 絵）・よる → 3かいだて → さいかい しても のこる
export async function houseFormsSmoke({ scenario, expect }) {
  const advance = async (H) => { for (let i = 0; i < 8; i++) { if (!(await H.page.locator(".dlg-shade:not(.ask)").count())) return; await H.page.locator(".dlg-shade:not(.ask)").last().click({ position: { x: 20, y: 20 } }); await H.wait(350); } };
  // 町の おうちの 絵の キャッシュ（たかさ）。key の さいごは @はば x たかさ
  const townPic = (H, night) => H.eval((night) => { const pre = "w:house_ext:" + JSON.stringify(night ? { ext: HouseExt.key(), night: true } : { ext: HouseExt.key() }) + "@", k = [...SvgCache.map.keys()].find((k) => k.startsWith(pre)); if (!k) return null; const [, ph] = k.slice(pre.length).split("x").map(Number), m = HouseExtArt.model(HouseExt.resolve(), !!night); return { ph, want: Math.ceil((m.h + 4) * G.px), h: m.h }; }, night);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("house-forms-" + viewport.width, async (H) => {
    const page = H.page;
    await H.newGameFast(); await H.dbg("hour", 12); await H.dbg("weather", "clear");
    const coins0 = await H.eval(() => { Save.d.coins = 30000; UI.updateHud(); return Save.d.coins; });
    expect(await H.dbg("venue", "koumuten"), "工務店に はいれない");
    await H.until(() => PokaDebug.state().scene === "venue" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000);
    await H.until(() => PokaDebug.venueIso()?.ready, 20000); await H.idle();
    expect((await H.dbg("venueState")).fixtures.some((f) => f.label === "たてものの みほん"), "たてものの みほんが ない");
    await H.shot("koumuten");
    // 1. たてものの みほん → たてものの タブ
    expect(await H.dbg("venueVisit", "たてものの みほん"), "たてものの みほんへ いけない");
    await page.locator(".hx-panel").waitFor({ timeout: 15000 }); await H.wait(450);
    let ui = (await H.dbg("exterior")).ui;
    expect(ui.open && ui.tab === "form" && !ui.dirty && (await page.locator(".hx-tab").count()) === 11 && (await page.locator('.hx-card[data-cat="form"]').count()) === 7, "たてものの タブ " + JSON.stringify(ui));
    const L = await H.eval(() => {
      const pn = document.querySelector(".hx-panel"), r = (e) => e.getBoundingClientRect(), body = pn.querySelector(".panel-body"), P = r(pn);
      const tabs = [...pn.querySelectorAll(".hx-tab")].map((b) => { const q = r(b); return { id: b.dataset.tab, w: q.width, h: q.height, ok: q.left >= P.left - 0.5 && q.right <= P.right + 0.5 && b.scrollWidth <= b.clientWidth + 1 }; });
      const cards = [...pn.querySelectorAll(".hx-card")].map((b) => { const q = r(b); return { w: q.width, h: q.height, name: b.querySelector(".hx-name").textContent, ok: b.querySelector(".hx-name").scrollWidth <= b.clientWidth }; });
      return { tabs, cards, wide: body.scrollWidth > body.clientWidth + 1, page: document.documentElement.scrollWidth > innerWidth };
    });
    expect(L.tabs.every((t) => t.ok && t.h >= 44 && t.w >= 44) && L.cards.every((c) => c.ok && c.h >= 44) && !L.wide && !L.page, "タブ・カードが はみ出す／ちいさい " + JSON.stringify(L));
    const tw = Object.fromEntries(L.tabs.map((t) => [t.id, t.w]));
    expect(tw.form > tw.roof * 1.8 && L.cards.map((c) => c.name).join() === "いつもの,3かいだて,おしろ,きのこ,ケーキ,ツリーハウス,ユーフォー", "たてものの タブは 2つぶん・7しゅの なまえ " + JSON.stringify([tw, L.cards.map((c) => c.name)]));
    await H.shot("ui-form");
    // 2. おしろを ためす
    await page.locator('.hx-card[data-cat="form"][data-id="castle"]').click();
    ui = (await H.dbg("exterior")).ui;
    expect(ui.dirty && ui.cost === 9800 && ui.draft.parts.form === "castle" && (await page.locator(".hx-preview.tall").count()) === 1 && /9,800/.test(await page.locator(".hx-go").textContent()), "おしろを ためす " + JSON.stringify(ui));
    await H.shot("ui-castle");
    await page.locator('.hx-tab[data-tab="chimney"]').click();
    expect(/おしろ では えんとつは つかわないよ/.test((await page.locator(".hx-note").textContent()) || "") && (await page.locator('.hx-card[data-cat="chimney"]').count()) === 4, "えんとつの タブに「つかわないよ」");
    await H.shot("ui-note");
    await page.locator('.hx-tab[data-tab="roof"]').click();
    expect((await page.locator(".hx-note").count()) === 0 && (await page.locator('.hx-card[data-cat="roof"]').count()) === 5, "おしろは やねの かたちを つかう（とうの やね）");
    await page.locator('.hx-card[data-cat="roof"][data-id="round"]').click();
    expect((await H.dbg("exterior")).ui.cost === 9800 + 2200, "まるやねも ためせる");
    await page.locator('.hx-card[data-cat="roof"][data-id="gable"]').click();
    // きのこの ペンキは「かさ」「じく」
    await page.locator('.hx-tab[data-tab="form"]').click(); await page.locator('.hx-card[data-cat="form"][data-id="mushroom"]').click();
    await page.locator('.hx-tab[data-tab="paint"]').click();
    expect((await page.locator(".hx-target").allTextContents()).map((t) => t.trim()).join() === "かさ,じく,ドア,まどわく", "きのこの ペンキの ところ");
    await H.shot("ui-mushroom");
    // おしろに もどして かう
    await page.locator('.hx-tab[data-tab="form"]').click(); await page.locator('.hx-card[data-cat="form"][data-id="castle"]').click();
    expect((await H.dbg("exterior")).ui.cost === 9800, "おしろ 9800コイン");
    await page.locator(".hx-go").click();
    await page.locator(".hx-panel").waitFor({ state: "detached", timeout: 8000 });
    await page.locator(".dlg-shade:not(.ask)").first().waitFor({ timeout: 8000 });
    expect(/まいど あり/.test(await page.locator(".dlg-shade:not(.ask) .dlg-text").first().textContent()), "とうりょうさんの おれいが ない");
    await advance(H);
    let ex = await H.dbg("exterior");
    expect(ex.custom && ex.parts.form === "castle" && ex.owned.includes("form:castle") && (await H.eval(() => Save.d.coins)) === coins0 - 9800, "おしろを かって たてた " + JSON.stringify(ex));
    // 3. どの くみあわせも 絵が わくの なかに おさまる
    const bad = await H.eval(() => {
      const NS = "http://www.w3.org/2000/svg", host = document.createElementNS(NS, "svg"), out = []; let n = 0;
      host.setAttribute("width", "300"); host.setAttribute("height", "300"); host.style.cssText = "position:absolute;left:-9999px;top:0"; document.body.append(host);
      const ids = (c) => HouseExt.CAT[c].parts.map((p) => p.id);
      for (const form of ids("form")) for (const roof of ids("roof")) for (const top of ids("top")) for (const chimney of ids("chimney")) {
        const p = HouseExt.resolve({ parts: { ...HouseExt.DEFAULT_PARTS, form, roof, top, chimney, lamp: "string", yard: "doghouse", door: "double", window: "bay", post: "bird" }, paint: { ...HouseExt.DEFAULT_PAINT } });
        host.innerHTML = `<g>${HouseExtArt.body(p, true)}</g>`;
        const b = host.firstChild.getBBox(), [x0, y0, x1, y1] = HouseExtArt.box(p); n++;
        if (b.x < x0 + 1 || b.y < y0 + 1.5 || b.x + b.width > x1 - 1 || b.y + b.height > y1 - 1) out.push([form, roof, top, chimney, [b.x, b.y, b.x + b.width, b.y + b.height].map((v) => Math.round(v * 10) / 10), [x0, y0, x1, y1]]);
      }
      host.remove();
      return { n, out: out.slice(0, 8), more: out.length };
    });
    expect(bad.n === 560 && !bad.more, "絵が わくから はみ出す（町で きれる）" + JSON.stringify(bad));
    // 4. 町の おうち
    await H.dbg("teleport", "town", 21, 61);
    await H.until(() => PokaDebug.state().scene === "world" && !PokaDebug.state().transitioning && PokaDebug.idle(), 20000);
    await H.until(() => PokaDebug.exterior().drawn, 15000); await H.wait(600);
    let tp = await townPic(H, false);
    expect(tp && tp.ph === tp.want && tp.h > 189, "町の おしろは たかい 絵 " + JSON.stringify(tp));
    await H.shot("town-castle");
    await H.dbg("hour", 21); await H.wait(1200);
    tp = await townPic(H, true); expect(tp && tp.ph === tp.want, "よるの おしろ " + JSON.stringify(tp));
    await H.shot("town-castle-night");
    // 3かいだて（とんがり やね・かざみどり）
    ex = await H.dbg("exteriorSet", { form: "three", roof: "steep", top: "vane", window: "arch" }, { wall: "sakura", roof: "murasaki", trim: "shiro" });
    expect(ex && ex.parts.form === "three", "3かいだてに できない");
    await H.dbg("hour", 12); await H.until(() => PokaDebug.exterior().drawn, 15000); await H.wait(800);
    tp = await townPic(H, false); expect(tp && tp.ph === tp.want && tp.h === 140 + 36 + 32 + 112 + 4, "町の 3かいだて（やね・かざみどり まで）" + JSON.stringify(tp));
    await H.shot("town-three");
    await H.dbg("save"); await page.reload(); await page.getByRole("button", { name: "つづきから", exact: true }).click(); await H.idle();
    ex = await H.dbg("exterior");
    expect(ex.parts.form === "three" && ex.owned.includes("form:castle") && ex.owned.includes("form:three") && ex.custom, "さいかい しても のこる " + JSON.stringify(ex));
  }, { viewport, timeout: 180000 });
}
