// おうちの かけあいを 20しゅ ふやした（UI-45。オーナーの FB 2026-10-02「お家での会話パターンを20種類増やして」）
// かけあいは 80しゅ いじょう → あたらしい 20しゅが ある（3人の だれかが はなす）・ふきだしは 3ぎょう いない（「…」で きれない）
// → 3つ ながす（3人だけ・ままも いる・ないしょばなし）: じゅんばんどおり・ふきだしが かさならない・はみ出さない
// → ぱぱ・ままの おしごとの あいだ（9〜18じ）は ままの いる かけあいは ながれない → セーブは かわらない
export const HOME_TALK_NEW = ['farm-carrot', 'fish-story', 'purikura-album', 'runway-practice', 'korokoro-ball', 'crane-plush', 'jellyfish', 'dino-family', 'bus-button', 'train-tunnel',
  'burger-toy', 'riddle', 'gacha-rare', 'star-gazing', 'lunch-menu', 'tooth-brush', 'parents-work', 'secret-letter', 'mittens', 'sofa-jump'];
export async function homeTalkMoreSmoke({ scenario, expect }) {
  const bubbles = (s) => {
    expect(s.boxes.length <= 2, '同時に3つ以上の吹き出し');
    for (const b of s.boxes) expect(b.x >= s.area.left && b.y >= s.area.top && b.x + b.w <= s.area.right + .01 && b.y + b.h <= s.area.bottom + .01, '吹き出しが表示範囲からはみ出す');
    for (let i = 0; i < s.boxes.length; i++) for (let j = i + 1; j < s.boxes.length; j++) { const a = s.boxes[i], b = s.boxes[j]; expect(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y), '吹き出しが重なる'); }
  };
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario('home-talk-more-' + viewport.width, async H => {
    await H.newGameFast(); await H.dbg('hour', 20); await H.dbg('weather', 'clear'); await H.wait(600); await H.dbg('homeBubbleFixture');
    const before = await H.dbg('saveData');
    const n = await H.dbg('homeLines');
    expect(n.talks >= 80 && n.total >= 500, 'かけあいが 80 より すくない ' + JSON.stringify(n));
    for (const id of HOME_TALK_NEW) {
      const t = await H.dbg('homeLines', id);
      expect(t && t.turns && t.turns.length >= 3 && t.turns.some((x) => ['wanko', 'gachan', 'goji'].includes(x.who)), 'かけあい ' + id + ' が ない ' + JSON.stringify(t));
      const r = await H.dbg('homeTalkRows', id);
      expect(r && r.rows.length === t.turns.length && r.rows.every((k) => k >= 1 && k <= r.max), `${id}: ふきだしが ${r && r.max}ぎょうを こえる ` + JSON.stringify(r));
    }
    // 3つ ながす
    for (const id of ['riddle', 'sofa-jump', 'secret-letter']) {
      await H.wait(1500); const start = (await H.dbg('homeTalkLog')).length;
      expect(await H.dbg('homeTalk', id), 'かけあい ' + id + ' が ながれない');
      const talk = await H.dbg('homeLines', id); let got = [];
      for (let i = 0; i < 50 && got.length < talk.turns.length; i++) { await H.wait(200); bubbles(await H.dbg('homeBubbleState')); got = (await H.dbg('homeTalkLog')).slice(start).filter((x) => x.talk === id); }
      expect(got.map((x) => x.id).join() === talk.turns.map((t) => t.who).join(), 'かけあいの 順番が ちがう: ' + id + ' ' + JSON.stringify(got));
      expect(got.every((x, i) => x.kind === (talk.turns[i].kind || 'say')), 'かけあいの こえの しゅるいが ちがう: ' + id);
      if (id !== 'secret-letter') await H.shot(id);
    }
    // ぱぱ・ままが おしごとの あいだは、ままの いる かけあいは ながれない（3人だけの かけあいは ながれる）
    await H.wait(1500); await H.dbg('hour', 12); await H.wait(800);
    expect(!(await H.dbg('homeTalk', 'sofa-jump')), 'ままが いないのに ままの かけあいが ながれる');
    expect(await H.dbg('homeTalk', 'parents-work'), 'おるすばんの かけあいが ながれない');
    await H.wait(400);
    const after = await H.dbg('saveData'); for (const k of ['coins', 'bag', 'wardrobe', 'furn', 'rooms']) expect(JSON.stringify(after[k]) === JSON.stringify(before[k]), '会話で セーブが 変わる: ' + k);
  }, { full: true, viewport, timeout: 120000 });
}
