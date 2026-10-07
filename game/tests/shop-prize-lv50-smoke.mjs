// おてつだいの ごほうび Lv40・50 の 26こ（UI-109。js/shop-reward-art-more.js。オーナーの 指示 2026-10-07「…それにともない、景品も追加して。」）
// ① よる: あかりの 5こ（ジュークボックス・ケーキの おしろ・はの ランプ・ひまわり・でんきゅう）は はじめから ついて いる
// ② まわる 6こ（メリーゴーランド・かんらんしゃ・ふうしゃ・ひこうせんの プロペラ・せんしゃきの ブラシ・からくり どけい）は live で、まって いると かくが すすむ
// ③ ひる: 26こ ぜんぶ タップで うごく（あかりは つく）・3人が ひとこと　④ ごほうびの まど: 1つの おみせに 6こ（Lv.40・50）・はみ出さない
export async function shopPrizeLv50Smoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('shop-prize-lv50-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 21); await H.dbg('unlockAll');
    const touch = async (id, ok, msg) => {
      const a = await H.dbg('furnLive', id); expect(a && a.tap, `${id}: タップできる 点が ない`);
      await H.tap(a.tap.x, a.tap.y); await H.wait(300);
      const b = await H.dbg('furnLive', id); expect(ok(a, b), `${msg} ${JSON.stringify([a, b])}`); expect(b.talk > a.talk, `${id}: 3人が なにも いわない`);
      return b;
    };
    const sets = [
      [{ id: 'shop_burger_40', x: 60, y: 330 }, { id: 'shop_dentist_40', x: 420, y: 330 }, { id: 'shop_burger_50', x: 150, y: 560 }, { id: 'shop_crepe_50', x: 370, y: 585 }],
      [{ id: 'shop_florist_40', x: 60, y: 330 }, { id: 'shop_brain_40', x: 420, y: 330 }, { id: 'shop_cake_50', x: 140, y: 570 }, { id: 'shop_groom_50', x: 370, y: 580 }],
      [{ id: 'shop_groom_40', x: 70, y: 340 }, { id: 'shop_korokoro_40', x: 380, y: 380 }, { id: 'shop_bakery_50', x: 130, y: 585 }, { id: 'shop_relay_50', x: 370, y: 585 }],
      [{ id: 'shop_cake_40', x: 110, y: 360 }, { id: 'shop_crepe_40', x: 380, y: 380 }, { id: 'shop_dentist_50', x: 130, y: 585 }, { id: 'shop_gasstand_50', x: 370, y: 585 }],
      [{ id: 'shop_bakery_40', x: 110, y: 360 }, { id: 'shop_relay_40', x: 380, y: 380 }, { id: 'shop_florist_50', x: 130, y: 585 }, { id: 'shop_kobo_50', x: 370, y: 585 }],
      [{ id: 'shop_gasstand_40', x: 110, y: 360 }, { id: 'shop_postoffice_40', x: 380, y: 380 }, { id: 'shop_korokoro_50', x: 130, y: 585 }, { id: 'shop_postoffice_50', x: 370, y: 585 }],
      [{ id: 'shop_kobo_40', x: 110, y: 360 }, { id: 'shop_brain_50', x: 370, y: 585 }],
    ];
    const ids = sets.flat().map((it) => it.id);
    expect(ids.length === 26 && new Set(ids).size === 26, 'ごほうびが 26こ でない ' + ids.length);
    const lamps = new Set(['shop_burger_40', 'shop_cake_50', 'shop_dentist_40', 'shop_florist_40', 'shop_brain_40']);
    const live = new Set(['shop_groom_50', 'shop_crepe_50', 'shop_bakery_50', 'shop_relay_50', 'shop_gasstand_50', 'shop_kobo_50']);
    const layout = async (i) => { await H.dbg('homeLayout', sets[i]); await H.dbg('homeBubbleFixture'); await H.wait(700); };
    // ① ② よる
    for (const [i, set] of sets.entries()) {
      await layout(i);
      for (const it of set) {
        const st = await H.dbg('furnLive', it.id);
        expect(st && st.live === live.has(it.id), `${it.id}: live の とうろく`);
        if (lamps.has(it.id)) expect(st.on === true, `${it.id}: よるに あかりが ついて いない`);
      }
      const spinning = set.filter((it) => live.has(it.id));
      if (spinning.length) {
        const a = await Promise.all(spinning.map((it) => H.dbg('furnLive', it.id))); await H.wait(600);
        const b = await Promise.all(spinning.map((it) => H.dbg('furnLive', it.id)));
        spinning.forEach((it, j) => expect(typeof b[j].ang === 'number' && b[j].ang > (a[j].ang ?? -1e9), `${it.id}: まわらない ${JSON.stringify([a[j].ang, b[j].ang])}`));
      }
      if (i < 2) await H.shot('night-' + (i + 1));
    }
    // ③ ひる: タップ
    await H.dbg('hour', 11); await H.until(() => { const w = PokaDebug.parentWork(); return !!w && w.away && !w.visible.length; }, 8000);
    for (const [i, set] of sets.entries()) {
      await layout(i);
      for (const it of set) {
        if (lamps.has(it.id)) await touch(it.id, (a, b) => a.on === false && b.on === true, `${it.id}: ひるに タップで あかりが つかない`);
        else await touch(it.id, (a, b) => b.n === a.n + 1 && b.t < 1, `${it.id}: タップしても うごかない`);
      }
      await H.shot('day-' + (i + 1));
    }
    // ④ ごほうびの まど
    await H.dbg('shopRewardOpen', 'kobo'); await H.wait(400);
    const win = await H.eval(() => {
      const w = document.querySelector('.modal-wrap:not(.out) .panel'), pics = [...w.querySelectorAll('.shop-prize-picture svg')].map((s) => { const r = s.getBoundingClientRect(); return r.width > 20 && r.height > 20; });
      return { pics, text: w.textContent, wide: document.documentElement.scrollWidth <= innerWidth };
    });
    expect(win.pics.length === 6 && win.pics.every(Boolean), 'ごほうびの 絵が 6つ でない ' + JSON.stringify(win.pics));
    expect(/Lv\.40\s*ブロックの パズル だな/.test(win.text) && /Lv\.50\s*はぐるまの からくり どけい/.test(win.text), 'Lv.40・50 の ごほうびが ない');
    expect(win.wide, 'ごほうびの まどが 横に はみ出す');
    await H.shot('prize-list-kobo');
    await H.page.getByRole('button', { name: 'とじる', exact: true }).last().click();
    await H.dbg('hour', null);
  }, { viewport, full: viewport.width === 375, timeout: 240000 });
}
