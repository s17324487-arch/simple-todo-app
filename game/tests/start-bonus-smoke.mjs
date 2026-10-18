// コインの じょうげん 300まん・はじめからの とくべつ スタート（オーナーの 指示 2026-10-18「お金の上限を300万にして、今からはじめからスタートしたプレイヤーは、3日間限定で、300万円スタートにして。」）
// 1. きかんの あいだ（PokaDebug.startBonus で いまを ふくむ きかんに）: タイトル →「はじめる」→ オープニング → おしらせ → おうち → 3,000,000 コイン・HUD が はみ出さない
// 2. じょうげん: もっと ふえても 3,000,000
// 3. きかんの あと: はじめからは 150 コイン（おしらせ なし）
export async function startBonusSmoke({ scenario, expect }) {
  const begin = async (H, from, to) => {
    await H.open();
    await H.dbg("startBonus", from, to);
    // セーブが ある ときは「はじめから」→ たしかめ（はじめから）・ない ときは「はじめる」
    await H.page.locator(".title-ui .btn").filter({ hasText: /^はじめ(から|る)$/ }).click(); await H.wait(250);
    const said = [];
    for (let i = 0; i < 120; i++) {
      const st = await H.eval(() => ({ house: G.sceneName === "house" && !Game.trans, text: document.querySelector(".dlg-shade:not(.ask) .dlg-text")?.textContent || "", ask: !!document.querySelector(".dlg-shade.ask .choices .btn") }));
      if (st.text && !said.includes(st.text)) said.push(st.text);
      if (st.ask) await H.choose(0);
      else if (st.text) await H.eval(() => document.querySelector(".dlg-shade:not(.ask)").dispatchEvent(new PointerEvent("pointerup", { bubbles: true })));
      else if (st.house) break;
      await H.wait(120);
    }
    await H.until(() => G.sceneName === "house" && !Game.trans, 30000); await H.wait(500); await H.dialogs();
    return said;
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("start-bonus-" + viewport.width, async (H) => {
    await H.open();
    const now = await H.eval(() => Date.now());
    // 1. きかんの あいだ
    let said = await begin(H, now - 60000, now + 3600000);
    let st = await H.dbg("saveData");
    expect(st.coins === 3000000 && st.flags.startBonus > 0, "とくべつ スタートに ならない " + st.coins);
    expect(said.some((t) => t.includes("3,000,000コインで スタート")), "おしらせが ない " + JSON.stringify(said));
    const hud = await H.eval(() => { const e = document.querySelector(".hud .coins"), r = e.getBoundingClientRect(); return { text: e.textContent, ok: r.left >= 0 && r.right <= innerWidth && e.scrollWidth <= e.clientWidth + 1 }; });
    expect(hud.text.includes("3,000,000") && hud.ok, "HUD の コインが はみ出す " + JSON.stringify(hud));
    await H.shot("house");
    // 2. じょうげん
    await H.dbg("coins", 50000);
    expect((await H.dbg("saveData")).coins === 3000000, "300まんを こえた");
    await H.dbg("coins", -1000);
    expect((await H.dbg("saveData")).coins === 2999000, "つかえない");
    // 3. きかんの あと
    said = await begin(H, now - 7200000, now - 3600000);
    st = await H.dbg("saveData");
    expect(st.coins === 150 && !st.flags.startBonus && !said.some((t) => t.includes("キャンペーン")), "きかんの あとなのに とくべつ スタート " + st.coins);
  }, { viewport, timeout: 150000 });
}
