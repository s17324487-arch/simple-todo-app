// おうちの 2かい（HOME-2F）: 3000 コインで かう・1かいと 2かいが いっしょに 見える・かいだんで のぼる／おりる・かいだんの ところに かぐを おかない
// 2かいは 1かいの みぎ うえ（1かいの おくの ながい かべの うえの ふちに 2かいの ゆかの まえの ふちが くっつく・かさならない）
const inPoly = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], q = poly[j]; if ((a.y > p.y) !== (q.y > p.y) && p.x < ((q.x - a.x) * (p.y - a.y)) / (q.y - a.y) + a.x) c = !c; } return c; };
// へりから 1.5px うちがわの 点が あいての 中に ない（へりが くっつくのは よい）
const inner = (poly) => { const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length, cy = poly.reduce((s, p) => s + p.y, 0) / poly.length, out = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; for (let k = 0; k <= 12; k++) { const x = a.x + ((b.x - a.x) * k) / 12, y = a.y + ((b.y - a.y) * k) / 12, d = Math.hypot(cx - x, cy - y) || 1; out.push({ x: x + ((cx - x) / d) * 1.5, y: y + ((cy - y) / d) * 1.5 }); } }
  return out; };
const apart = (A, B) => !inner(A).some((p) => inPoly(B, p)) && !inner(B).some((p) => inPoly(A, p));
export async function home2fSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("home-2f-" + viewport.width, async (H) => {
    await H.newGameFast(); await H.dbg("hour", 11); await H.dbg("weather", "clear"); await H.wait(300);
    const floor = () => H.dbg("homeFloor");
    const inRoom = (id) => H.until((id) => G.sceneName === "house" && !Game.trans && PokaDebug.idle() && Save.d.rooms.active === id && !PokaDebug.homeFloor()?.climbing && PokaDebug.homeFloor()?.ready !== false, 20000, id);
    let st = await floor();
    expect(!st.owned && !st.on && !st.stairs, "かう まえから 2かいが ある");
    await H.dbg("coins", 9000); // coins は たす
    const before = await H.dbg("saveData");
    // おへや → 2かい（3000 コイン・せつめい）→ かう
    await H.houseButton("おへや");
    const card = await H.page.locator('[data-room="upstairs"]').innerText();
    expect(card.includes("3000") && card.includes("かいだん") && card.includes("いっしょに みえる"), "2かいの カードが ない " + card);
    await H.page.locator('[data-room="upstairs"]').getByRole("button", { name: "おへやを かう", exact: true }).click(); await H.choose(0);
    await inRoom("upstairs"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000); await H.wait(300);
    let save = await H.dbg("saveData");
    expect(save.coins === before.coins - 3000 && save.rooms.owned.upstairs && save.room.wall === "wp_cloud", "2かいの ねだん・かべがみ " + JSON.stringify([save.coins, before.coins, save.room.wall]));
    // 1かいと 2かいが いっしょに 画面の 中（おなかの 表示と したの ボタンの あいだ）
    st = await floor();
    const bars = await H.eval(() => { const r = (s) => document.querySelector(s)?.getBoundingClientRect(); return { care: r(".care-bar"), bar: r(".house-bar") }; });
    for (const k of ["main", "upstairs"]) {
      const b = st.rooms[k];
      expect(b.x >= -1 && b.x + b.w <= viewport.width + 1 && b.y >= bars.care.bottom - 2 && b.y + b.h <= bars.bar.top + 2, k + " が 画面から はみ出す／ボタンに かさなる " + JSON.stringify([b, bars.care.bottom, bars.bar.top]));
    }
    expect(st.rooms.upstairs.y < st.rooms.main.y && st.rooms.upstairs.x > st.rooms.main.x, "2かいが 1かいの みぎ うえに ない " + JSON.stringify(st.rooms));
    // 2かいの ゆか（あつみ こみ）・2かいの へやと 1かいは かさならない。ゆかの まえの ふち（ながい 辺）は 1かいの おくの かべの うえの ふちに くっつく
    const P = st.polys, near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1;
    expect(apart(P.floor2, P.main) && apart(P.upstairs, P.main), "2かいの ゆかが 1かいに かさなる");
    expect(near(P.floor2[4], P.wallTop[0]) && near(P.floor2[3], P.wallTop[1]), "2かいの ゆかの ふちが 1かいの かべの うえに くっつかない " + JSON.stringify([P.floor2, P.wallTop]));
    expect(!P.stairs.some((p) => inPoly(P.floor2, p)), "かいだんの タップの ところが 2かいの ゆかに かかる");
    expect(st.chars.length === 3 && st.upper, "3人が 2かいに いない");
    await H.shot("2f");
    // 2かい: かいだんを タップ → 3人で おりる → 1かいの かいだんの した
    await H.tap(st.stairsTap.x, st.stairsTap.y);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "down", 3000);
    await H.until(() => PokaDebug.homeFloor()?.chars.some((c) => c.z < -40), 8000);
    await H.shot("down");
    await inRoom("main"); await H.wait(200);
    st = await floor();
    const R = await H.eval(() => ({ W: ROOM.W, WALL: ROOM.WALL, D: ROOM.H - ROOM.WALL }));
    expect(!st.upper && st.on && st.ready && st.stairs && st.chars.every((c) => c.x < 200 && c.y > R.WALL + R.D - 140 && c.z === 0), "1かいの かいだんの したに つかない " + JSON.stringify(st.chars));
    await H.shot("1f");
    // 1かい: 2かいの へやを タップ → かいだんを のぼる（とちゅうで たかく なる）→ かべの うえの おどりばを おくの かどへ → 2かい
    await H.tap(st.roomTap.x, st.roomTap.y);
    await H.until(() => PokaDebug.homeFloor()?.climbing === "up", 3000);
    await H.until(() => PokaDebug.homeFloor()?.chars.some((c) => c.z > 80), 8000);
    await H.shot("climb");
    await H.until((W) => PokaDebug.homeFloor()?.chars.some((c) => c.z >= 229 && c.y < W + 40), 8000, R.WALL);
    await inRoom("upstairs");
    // 2かいの「おへや」の ドア: 2かいは えらばない（かいだんで いく）→ いつもの おへやへ
    const doors = await H.dbg("homeDoors");
    expect(!doors.rooms.includes("upstairs") && doors.rooms.includes("main"), "ドアで 2かいを えらべる " + doors.rooms);
    // 2かいでも 2本ゆびの ピンチで ズーム（ひろげる → とじる）。ピンチの ゆびでは かいだんを おりない
    await H.pinch(viewport.width / 2, viewport.height * 0.5, 60, 140);
    let z = await H.dbg("homeDesign"); expect(z.zoom > 1.8 && !(await floor()).climbing, "2かいで ピンチの ズームが できない " + z.zoom);
    await H.shot("zoom");
    await H.pinch(viewport.width / 2, viewport.height * 0.5, 160, 40);
    z = await H.dbg("homeDesign"); expect(z.zoom === 1 && z.pan.x === 0 && !(await floor()).climbing && (await floor()).upper, "2かいで ピンチで ぜんたいに もどらない " + JSON.stringify([z.zoom, z.pan]));
    const d2 = doors.doors.find((d) => d.id === "room"); await H.tap(d2.cx, d2.cy);
    await inRoom("main");
    // かいだんの ところの かぐは よける（ゆかの かぐ・ひだりの かべの かぐ）
    await H.dbg("homeLayout", [{ id: "bookshelf", x: 30, y: 470 }, { id: "window", x: 300, y: 116, wallSide: "left" }, { id: "rug_round", x: 150, y: 470 }]);
    await H.dbg("house"); await inRoom("main"); await H.wait(200);
    const dz = await H.dbg("homeDesign"), shelf = dz.items.find((it) => it.id === "bookshelf"), win = dz.items.find((it) => it.id === "window");
    expect(shelf.x >= 58 + 36 && win.x <= 150, "かいだんの ところに かぐが ある " + JSON.stringify([shelf.x, win.x]));
    // セーブして よみなおしても 2かいが ある
    await H.dbg("save"); await H.page.reload(); await H.page.getByRole("button", { name: "つづきから", exact: true }).click();
    await inRoom("main"); await H.until(() => PokaDebug.homeFloor()?.ready, 10000);
    st = await floor(); expect(st.owned && st.on && !st.upper, "よみなおすと 2かいが ない");
    save = await H.dbg("saveData");
    for (const k of ["bag", "wardrobe"]) expect(H.kept(before, save, k), "2かいで もちものが かわった " + k);
    expect(save.coins === before.coins - 3000, "コインが 2かいの ねだん いがいで かわった");
  }, { viewport, timeout: 150000 });
}
