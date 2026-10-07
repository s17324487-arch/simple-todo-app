// おうちの かけあいを 倍に（UI-107。オーナーの 依頼 2026-10-07「お家での会話パターンをいまの倍以上にしてくれ。ぱぱとままとの絡みや、3人の掛け合い…」）
// 1. かけあいは 160 いじょう（UI-45 の 80 の 倍）・ぱぱ ままとの からみ 60 いじょう・3人の かけあい 100 いじょう
// 2. あたらしい 91 の かけあい: 3人の だれかが でる・ふきだしが きまった ぎょう数に おさまる
// 3. ぱぱ ままとの からみ（ぱぱの だじゃれ・5ふん だけ）と 3人の かけあい（しりとり）を ながす → じゅんばん・こえの しゅるい・ふきだしが 画面の なか
// 4. ぱぱ・ままが おしごと（12じ）: ふだんの かけあいを 30かい えらんでも ぱぱ・ままが でる ものは でない（3人だけの ものは でる）
// 5. よる（20じ）: ぱぱ・ままが でる かけあいも えらばれる
const HOME_TALK_FAMILY = ["papa-shoulder", "papa-pun", "papa-diy", "papa-curry", "papa-paper", "arm-wrestle", "papa-dozes", "mama-bento", "laundry-fold", "mama-brush", "mama-button", "mama-hum", "mama-taste", "hands-wash", "five-more", "mama-little", "papa-little", "parents-sweet", "black-egg", "family-photo", "holiday-plan", "papa-glasses", "tickle-attack", "papa-fishing", "papa-snore", "cookie-shapes", "morning-water", "tidy-race", "one-more-snack", "bike-practice", "summer-triangle", "rainy-indoor", "umbrella-bag", "family-dance", "forehead-check", "bath-song", "shopping-list", "night-tea", "papa-magic", "bear-sewing", "papa-tired", "mama-rest", "taller-than-papa", "papa-shiritori", "family-drawing", "tie-fix"];
const HOME_TALK_TRIO = ["shiritori-three", "rock-paper", "tongue-twister", "cloud-shapes", "curry-nose", "grown-up", "fav-colors", "if-wings", "copy-parents", "shooting-star", "blanket-fort", "nice-things", "tail-chase", "funny-faces", "pillow-fight", "guess-thought", "beetle", "goldfish-names", "relay-story", "hiccups", "last-cookie", "rain-piano", "snow-angel", "acorn-top", "butterfly-nose", "seed-spit", "squeeze-warm", "lost-hairpin", "dark-hallway", "morning-jumps", "height-check", "surprise-clean", "miss-parents", "trio-song", "big-sneeze", "onion-tears", "three-promises", "shadow-play", "animal-sounds", "best-season", "yawn-chain", "treasure-map", "doorbell", "cheer-up", "happy-hop"];
export async function homeTalkFamilySmoke({ scenario, expect }) {
  const KIDS = ["wanko", "gachan", "goji"], PARENTS = ["papa", "mama"];
  const inScreen = (b, vp) => b.boxes.every((x) => x.x >= -0.5 && x.x + x.w <= vp.width + 0.5 && x.y >= -0.5 && x.y + x.h <= vp.height + 0.5);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-talk-family-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 20); await H.dbg("weather", "clear"); await H.wait(600); await H.dbg("homeBubbleFixture");
    const before = await H.dbg("saveData");
    // 1. かず
    const n = await H.dbg("homeLines");
    expect(n.talks >= 160 && n.total >= 800, "かけあいが 160 より すくない " + JSON.stringify(n));
    // 2. あたらしい かけあい
    for (const id of [...HOME_TALK_FAMILY, ...HOME_TALK_TRIO]) {
      const t = await H.dbg("homeLines", id);
      expect(t && t.turns && t.turns.length >= 3 && t.turns.some((x) => KIDS.includes(x.who)), "かけあい " + id + " が ない " + JSON.stringify(t));
      expect(HOME_TALK_TRIO.includes(id) ? t.turns.every((x) => KIDS.includes(x.who)) : t.turns.some((x) => PARENTS.includes(x.who)), `${id}: ぱぱ・ままとの からみ／3人の かけあい の わけかた`);
      const r = await H.dbg("homeTalkRows", id);
      expect(r && r.rows.length === t.turns.length && r.rows.every((k) => k >= 1 && k <= r.max), `${id}: ふきだしが ${r && r.max}ぎょうを こえる ` + JSON.stringify(r));
    }
    // 3. ながす
    for (const id of ["papa-pun", "five-more", "shiritori-three"]) {
      await H.wait(1500); const start = (await H.dbg("homeTalkLog")).length;
      expect(await H.dbg("homeTalk", id), "かけあい " + id + " が ながれない");
      const talk = await H.dbg("homeLines", id); let got = [];
      for (let i = 0; i < 60 && got.length < talk.turns.length; i++) { await H.wait(200); const b = await H.dbg("homeBubbleState"); expect(inScreen(b, viewport), id + ": ふきだしが 画面から でる " + JSON.stringify(b.boxes)); got = (await H.dbg("homeTalkLog")).slice(start).filter((x) => x.talk === id); }
      expect(got.map((x) => x.id).join() === talk.turns.map((t) => t.who).join() && got.every((x, i) => x.kind === (talk.turns[i].kind || "say")), "かけあいの じゅんばん・こえ: " + id + " " + JSON.stringify(got));
      await H.shot(id);
    }
    // 4. ぱぱ・ままが おしごとの あいだ
    await H.wait(1500); await H.dbg("hour", 12); await H.wait(900);
    let c = await H.dbg("homeChat", 30);
    expect(c && c.phase !== "home" && c.parents === 0 && c.ids.filter(Boolean).length >= 25, "おしごとの あいだに ぱぱ・ままの かけあいを えらんだ／えらべない " + JSON.stringify(c));
    // 5. よる: ぱぱ・ままも
    await H.dbg("hour", 20); await H.wait(900); await H.dbg("homeBubbleFixture");
    for (let i = 0; i < 40 && (await H.dbg("homeChat", 1)).phase !== "home"; i++) await H.wait(250); // ただいま（ParentWork）を まつ
    c = await H.dbg("homeChat", 40);
    expect(c.phase === "home" && c.here.length === 2 && c.parents >= 3 && c.ids.every(Boolean), "よるに ぱぱ・ままの かけあいが えらばれない " + JSON.stringify(c));
    await H.wait(300);
    const after = await H.dbg("saveData"); for (const k of ["coins", "bag", "wardrobe", "furn", "rooms"]) expect(JSON.stringify(after[k]) === JSON.stringify(before[k]), "会話で セーブが 変わる: " + k);
  }, { full: viewport.width === 375, viewport, timeout: 150000 });
}
