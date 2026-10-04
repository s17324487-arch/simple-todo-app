// おうちの みち（js/home-nav.js・UI-73。オーナーの FB 2026-10-03「お家で、できるだけ家具とごわがやぱぱままが交差(重なり、通過してしまう)しないようにして。
// だだ、詰まることを避けるため、状況に応じて許されるものとする。」）
// 1. ごじ: まっすぐだと テーブルを よこぎる ところへ → まわりこんで つく（とちゅうで 家具の 足もとに はいらない）
// 2. ぱぱ: テーブルの むこうへ → よけて つく
// 3. わんこ: いきさきが テーブルの なか → そばで とまる
// 4. がちゃん: テーブルを がちゃんの うえに おく → いちばん ちかい ところへ でて から（ゆるす）・でた あとは はいらない
export async function homeNavSmoke({ scenario, expect }) {
  const LAYOUT = [{ id: "table_wood", x: 240, y: 390 }, { id: "plant", x: 420, y: 300 }, { id: "rug_round", x: 240, y: 520 }];
  // あるいて いる あいだの いち（50ms ごと・あるき おわるか ms まで）
  const follow = (H, who, ms = 15000) => H.eval(async ([who, ms]) => {
    const out = [], t0 = performance.now();
    while (performance.now() - t0 < ms) {
      const n = PokaDebug.homeNav(), a = n && n.actors.find((x) => x.id === who);
      if (!a) break;
      out.push({ x: a.x, y: a.y, inside: a.inside, state: a.state });
      if (a.state !== "walk") break;
      await new Promise((r) => setTimeout(r, 50));
    }
    return out;
  }, [who, ms]);
  const inFeet = (feet, x, y) => feet.some((r) => x > r.x0 + 0.5 && x < r.x1 - 0.5 && y > r.y0 + 0.5 && y < r.y1 - 0.5);
  const crosses = (feet, pts) => pts.some((a, i) => i > 0 && Array.from({ length: 101 }, (_, s) => s / 100).some((s) => inFeet(feet, pts[i - 1].x + (a.x - pts[i - 1].x) * s, pts[i - 1].y + (a.y - pts[i - 1].y) * s)));
  const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-nav-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 20); await H.dbg("weather", "clear"); await H.wait(600);
    await H.dbg("homeLayout", LAYOUT);
    await H.dbg("homeBubbleFixture"); // 3人と ぱぱ ままを とめる
    let nav = await H.dbg("homeNav");
    const table = nav && nav.feet.find((r) => r.id === "table_wood");
    expect(table && nav.feet.length === 2 && !nav.feet.some((r) => r.id === "rug_round") && nav.blocked > 0 && nav.actors.every((a) => !a.inside), "家具の 足もと（ラグは のぞく）" + JSON.stringify(nav));
    const at = (id) => nav.actors.find((a) => a.id === id);
    // 1. ごじ
    const g0 = at("goji"), goal = { x: 120, y: 340 };
    expect(crosses(nav.feet, [g0, goal]), "まっすぐだと テーブルを よこぎる ばしょに なって いない " + JSON.stringify(g0));
    let plan = await H.dbg("homeWalk", "goji", goal.x, goal.y);
    expect(plan && !plan.loose && plan.pts.length >= 3 && !crosses(nav.feet, plan.pts) && len(plan.pts) > Math.hypot(goal.x - g0.x, goal.y - g0.y) + 5, "ごじの みちが テーブルを よけない " + JSON.stringify(plan));
    let tr = await follow(H, "goji", 1300);
    await H.shot("detour");
    tr = tr.concat(await follow(H, "goji"));
    let end = tr[tr.length - 1];
    expect(tr.length > 5 && tr.every((p) => !p.inside) && end.state !== "walk" && Math.hypot(end.x - goal.x, end.y - goal.y) < 3, "ごじが テーブルを よけて つかない " + JSON.stringify(tr.filter((p, i) => p.inside || i === tr.length - 1)));
    // 2. ぱぱ
    nav = await H.dbg("homeNav");
    const p0 = at("papa"), pg = { x: 400, y: 360 };
    expect(p0 && !p0.hidden && crosses(nav.feet, [p0, pg]), "ぱぱが いない・まっすぐでも よこぎらない " + JSON.stringify(p0));
    plan = await H.dbg("homeWalk", "papa", pg.x, pg.y);
    expect(plan && !plan.loose && !crosses(nav.feet, plan.pts), "ぱぱの みちが テーブルを よけない " + JSON.stringify(plan));
    tr = await follow(H, "papa"); end = tr[tr.length - 1];
    expect(tr.every((p) => !p.inside) && end.state !== "walk" && Math.hypot(end.x - pg.x, end.y - pg.y) < 3, "ぱぱが テーブルを よけて つかない " + JSON.stringify(end));
    // 3. わんこ: いきさきが テーブルの なか
    const wg = { x: (table.x0 + table.x1) / 2, y: (table.y0 + table.y1) / 2 };
    plan = await H.dbg("homeWalk", "wanko", wg.x, wg.y);
    expect(plan && !plan.loose && !crosses(nav.feet, plan.pts), "わんこの みち " + JSON.stringify(plan));
    tr = await follow(H, "wanko"); end = tr[tr.length - 1];
    expect(tr.every((p) => !p.inside) && end.state !== "walk" && Math.hypot(end.x - wg.x, end.y - wg.y) > 10, "いきさきが テーブルの なか → そばで とまらない " + JSON.stringify(end));
    await H.wait(300); await H.shot("stop-near");
    // 4. がちゃん: テーブルの うえから でる
    const c0 = at("gachan");
    await H.dbg("homeLayout", [{ id: "table_wood", x: c0.x, y: c0.y + 25 }, LAYOUT[1], LAYOUT[2]]);
    nav = await H.dbg("homeNav");
    expect(nav.actors.find((a) => a.id === "gachan").inside, "がちゃんが テーブルの うえに いない " + JSON.stringify(nav.feet));
    plan = await H.dbg("homeWalk", "gachan", 420, 560);
    expect(plan && plan.loose, "テーブルの うえから でる ときは ゆるす " + JSON.stringify(plan));
    tr = await follow(H, "gachan"); end = tr[tr.length - 1];
    const out = tr.findIndex((p) => !p.inside);
    expect(out >= 0 && tr.slice(out).every((p) => !p.inside) && end.state !== "walk" && Math.hypot(end.x - 420, end.y - 560) < 3, "テーブルの うえから でて つかない・また はいる " + JSON.stringify(tr.slice(Math.max(0, out - 1))));
  }, { viewport, timeout: 120000 });
}
