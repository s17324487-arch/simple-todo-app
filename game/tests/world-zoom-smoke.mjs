// 町の ズーム（UI-08）: ＋ − ボタン・ゆび 2ほんの ピンチ・キーボード・ひろく した まま タップで あるく・セーブ
export async function worldZoomSmoke({ scenario, expect }) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario("world-zoom-" + viewport.width, async (H) => {
    await H.newGameFast();
    await H.dbg("teleport", "heiwadai", 30, 30, "down");
    await H.until(() => G.sceneName === "world" && PokaDebug.idle(), 20000); await H.wait(500);
    let st = await H.dbg("worldZoom");
    expect(st.z === 1 && st.saved === 1, "はじめの ズームが 1 で ない " + JSON.stringify(st));
    const view1 = st.view;
    // ボタン: 44px・画面の 中・ほかの ボタンと かさならない
    const rects = await H.eval(() => [".world-weather", ".smaho-btn", ".menu-btn", ".hud > *", ".folk-note-btn"].flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return { c: e.className, x: r.x, y: r.y, w: r.width, h: r.height }; }));
    expect(st.buttons.length === 2, "ズームの ボタンが 2つ ない");
    for (const b of st.buttons) {
      expect(b.w >= 44 && b.h >= 44, "ボタンが 小さい " + JSON.stringify(b));
      expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= viewport.width && b.y + b.h <= viewport.height, "ボタンが 画面から はみ出す " + JSON.stringify(b));
      for (const r of rects) expect(b.x + b.w <= r.x || r.x + r.w <= b.x || b.y + b.h <= r.y || r.y + r.h <= b.y, "ボタンが かさなる " + b.label + " / " + r.c);
    }
    // − を 2かい → 0.5（ひろく みえる）。− は おせなく なる
    await H.page.getByRole("button", { name: "まちを ひろく みる" }).click(); await H.wait(650);
    await H.page.getByRole("button", { name: "まちを ひろく みる" }).click();
    await H.until(() => PokaDebug.worldZoom().z === 0.5, 5000); await H.wait(400);
    st = await H.dbg("worldZoom");
    // 1マスが 端末の 画素の 整数に なる ように まるめるので ちょうど 2ばい では ない（1.9〜2.1）
    const kw = st.view.tilesW / view1.tilesW, kh = st.view.tilesH / view1.tilesH;
    expect(kw > 1.9 && kw < 2.1 && Math.abs(kw - kh) < 1e-6, "0.5 で 2ばい ひろく ない " + JSON.stringify([view1, st.view]));
    expect(st.buttons[0].disabled && !st.buttons[1].disabled, "0.5 で − が おせる");
    expect(st.raster < st.px && Math.abs(st.raster - st.dev) < 1e-9, "ひろく した ときに 絵を ちいさく 描きなおさない " + JSON.stringify(st));
    expect(Object.keys(st.chunks).length <= 2, "地面の チャンクの 大きさが 3しゅ いじょう " + JSON.stringify(st.chunks));
    await H.shot("wide");
    // ひろく した まま マスを タップ → その マスへ あるく
    const L = (await H.dbg("world")).party[0];
    const target = await H.eval(([px, py]) => {
      const sc = G.scene;
      for (const [dx, dy] of [[6, 5], [-6, 6], [5, -6], [-7, -5], [8, 0], [0, 9], [-9, 0], [0, -10], [4, 4], [-4, 4]]) {
        const x = px + dx, y = py + dy;
        if (!sc.map.isSolid(x, y) && !sc.blockedByNpc(x, y) && sc.findPath(px, py, x, y, false) && !WorldScenery.at(sc.map, x, y) && !sc.map.doorAt(x, y) && !sc.buildingDoorAt(x, y) && !sc.map.signs.some((s) => s.x === x && s.y === y) && !sc.map.chests.some((c) => c.x === x && c.y === y)) return [x, y];
      }
      return null;
    }, [L.x, L.y]);
    expect(target, "あるける マスが ない");
    const pt = await H.dbg("worldPoint", ...target);
    await H.tap(pt.x, pt.y); await H.wait(120);
    const end = await H.eval(() => { const p = G.scene.path; return p && p.length ? p[p.length - 1] : null; });
    expect(end && end[0] === target[0] && end[1] === target[1], "ひろく した ときの タップの マスが ずれる " + JSON.stringify([target, end]));
    await H.until(() => PokaDebug.idle() && !G.scene.path?.length && !G.scene.party[0].moving, 20000);
    const at = (await H.dbg("world")).party[0];
    expect(at.x === target[0] && at.y === target[1], "タップした マスに つかない " + JSON.stringify([target, at]));
    // ゆび 2ほんで ひろげる → ちかく（1.5 まで）。あるきださない・スティックに ならない
    const cv = await H.eval(() => { const r = G.canvas.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
    const pinch = (d0, d1) => H.eval(({ cx, cy, d0, d1 }) => {
      const ev = (type, id, x) => G.canvas.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: id === 11 }));
      ev("pointerdown", 11, cx - d0 / 2); ev("pointerdown", 12, cx + d0 / 2);
      for (let i = 1; i <= 8; i++) { const d = d0 + (d1 - d0) * i / 8; ev("pointermove", 11, cx - d / 2); ev("pointermove", 12, cx + d / 2); }
      ev("pointerup", 11, cx - d1 / 2); ev("pointerup", 12, cx + d1 / 2);
    }, { ...cv, d0, d1 });
    await pinch(60, 240); await H.wait(300);
    st = await H.dbg("worldZoom");
    const still = await H.eval(() => ({ party: PokaDebug.world().party[0], path: G.scene.path?.length || 0, joy: !!G.scene.joy, tap: !!G.scene.tapMark }));
    expect(st.z === 1.5 && st.saved === 1.5, "ピンチで ちかく ならない " + JSON.stringify(st));
    expect(still.party.x === at.x && still.party.y === at.y && !still.path && !still.joy && !still.tap, "ピンチで あるきだす／スティックに なる " + JSON.stringify(still));
    expect(!st.buttons[0].disabled && st.buttons[1].disabled, "1.5 で ＋ が おせる");
    expect(st.raster === st.px, "ちかく する ときに 絵を 描きなおす（メモリが ふえる）");
    await H.shot("near");
    // すぼめる → ひろく
    await pinch(240, 150); await H.wait(300);
    st = await H.dbg("worldZoom");
    expect(Math.abs(st.z - 0.938) < 0.01, "ピンチで ひろく ならない " + st.z);
    // キーボードの − と 0
    await H.page.keyboard.press("-"); await H.until(() => PokaDebug.worldZoom().z === 0.75, 5000);
    await H.page.keyboard.press("0"); await H.until(() => PokaDebug.worldZoom().z === 1, 5000);
    // おうちには ボタンが ない・町に もどると おぼえて いる
    await H.dbg("worldZoom", 0.75);
    await H.dbg("house"); await H.until(() => G.sceneName === "house" && !Game.trans, 20000);
    expect(!(await H.eval(() => document.querySelectorAll(".world-zoom").length)), "おうちに ズームの ボタンが のこる");
    await H.dbg("teleport", "heiwadai", 30, 30, "down");
    await H.until(() => G.sceneName === "world" && PokaDebug.idle(), 20000);
    st = await H.dbg("worldZoom");
    expect(st.z === 0.75 && (await H.eval(() => document.querySelectorAll(".world-zoom").length)) === 1, "町に もどると ズームを わすれる " + JSON.stringify(st));
    // ズームの ない ふるい セーブ → 1
    const old = await H.dbg("saveData"); delete old.settings.worldZoom;
    await H.dbg("seedSave", old);
    expect((await H.eval(() => Save.d.settings.worldZoom)) === 1, "ふるい セーブに ズームが たりない");
  }, { viewport, timeout: 120000 });
}
