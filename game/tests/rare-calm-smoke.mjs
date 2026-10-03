// レアの キラキラを なくす（UI-50。オーナーの FB 2026-10-02「レアアイテムのキラキラした演出は全て削除して」）
// おうちに レアの 池袋の けいひん（ビッグ ぬいぐるみ・3人の ぬいぐるみ・ガチャの フィギュア・はしわたしの フィギュア）と
// なかよしパズルの けいひん（ほしの ランプ。UI-66）を ならべる →
// どれも sparkle の しるしが ない・へやの 絵の 1コマで ほしを 描かない（FX.star を かぞえる）→ スクリーンショット
export async function rareCalmSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('rare-calm-' + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg('hour', 11); await H.dbg('weather', 'clear');
    await H.dbg('house'); await H.until(() => PokaDebug.state().scene === 'house' && PokaDebug.idle(), 15000);
    const ids = await H.eval(() => {
      const pick = (f) => FURNITURE.find((x) => x.cityItem && x.rare && f(x));
      return [pick((x) => /^ike_plush_/.test(x.id)), pick((x) => /^ike_chibi_/.test(x.id)), pick((x) => x.gachaPrize), pick((x) => x.cityItem.type === 'hashiprize'), FURNITURE.find((x) => x.puzzlePrize && x.rare)].filter(Boolean).map((x) => x.id);
    });
    expect(ids.length === 5, 'レアの けいひんが そろわない ' + ids);
    await H.dbg('homeLayout', ids.map((id, i) => ({ id, ...[{ x: 300, y: 285 }, { x: 375, y: 295 }, { x: 440, y: 310 }, { x: 420, y: 380 }, { x: 190, y: 400 }][i] })));
    await H.dbg('homeBubbleFixture'); await H.wait(900);
    const st = await H.eval((ids) => ({ flags: ids.map((id) => 'sparkle' in FURN_INDEX[id]), placed: Save.d.room.items.map((it) => it.id) }), ids);
    expect(st.flags.every((v) => !v) && ids.every((id) => st.placed.includes(id)), 'レアの けいひんに sparkle の しるしが ある／おけない ' + JSON.stringify(st));
    await H.shot('room');
  }, { full: true, viewport, timeout: 90000 });
}
