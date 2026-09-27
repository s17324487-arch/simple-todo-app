// ブラウザで実際に遊んで確かめる自動テスト（Playwright + Chromium）。
//   npm test              … 静的チェック + ふだんのスモークテスト（約1〜2分）
//   npm run test:full     … 4つのお店・ボス・小さい画面・夜 もふくむ（約4〜6分）、スクリーンショットも保存
// オプション: --full（全部） --shots（tests/screenshots/ に画像を保存） --headed（画面を表示） --only=名前の一部
// Chromium の場所を指定したいときは 環境変数 CHROMIUM_PATH。
// ゲーム内部の変数にはなるべく触らず、js/debug.js の PokaDebug と 実際のタップ操作で進める。
import { chromium } from "playwright";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "../tools/serve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const FULL = argv.includes("--full");
const SHOTS = argv.includes("--shots") || FULL;
const HEADED = argv.includes("--headed");
const ONLY = (argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const SHOT_DIR = resolve(HERE, "screenshots");
mkdirSync(SHOT_DIR, { recursive: true });
// 前回の画像が残っていると まぎらわしいので消す（--shots のときは全部、ふだんは失敗画像 FAIL_*.png だけ）
for (const f of readdirSync(SHOT_DIR)) if (f.endsWith(".png") && (SHOTS || f.startsWith("FAIL_"))) rmSync(join(SHOT_DIR, f));

const { server, url } = await serve({ port: 0, quiet: true });
const browser = await chromium.launch({ headless: !HEADED, executablePath: process.env.CHROMIUM_PATH || undefined });
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function expect(cond, msg) { if (!cond) throw new Error(msg); }

async function scenario(name, fn, { viewport = { width: 390, height: 844 }, timeout = 90000, full = false } = {}) {
  if (full && !FULL) return;
  if (ONLY && !name.includes(ONLY)) return;
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "ja-JP" });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const problems = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("console", (m) => {
    // フォントなど 外部リソースが オフラインで読めないのは無視する
    if (m.type() === "error" && !/Failed to load resource|ERR_|fonts\.g/.test(m.text())) problems.push("console.error: " + m.text());
  });
  const H = helpers(page, name);
  const t0 = Date.now();
  let timer;
  try {
    await Promise.race([fn(H), new Promise((_, ng) => (timer = setTimeout(() => ng(new Error(`時間切れ（${timeout / 1000}秒）`)), timeout)))]);
    expect(!problems.length, "ブラウザでエラー: " + problems.join(" | "));
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name}（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
    try { await page.screenshot({ path: join(SHOT_DIR, `FAIL_${name}.png`) }); } catch {}
  } finally {
    clearTimeout(timer);
    await context.close();
  }
}

function helpers(page, name) {
  const H = {
    page,
    wait: (ms) => page.waitForTimeout(ms),
    eval: (fn, arg) => page.evaluate(fn, arg),
    until: (fn, ms = 10000, arg) => page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }),
    dbg: (method, ...args) => page.evaluate(([m, a]) => window.PokaDebug[m](...a), [method, args]),
    async shot(label) {
      if (!SHOTS) return;
      // フォント/描画待ちでゲームの制限時間を消費しない。
      const previous = await H.dbg("pause", true);
      try { await page.screenshot({ path: join(SHOT_DIR, `${name}_${label}.png`), animations: "disabled" }); }
      finally { await H.dbg("pause", previous); }
    },
    async open() {
      await page.goto(url + "index.html");
      await H.until(() => window.PokaDebug && typeof G !== "undefined" && G.sceneName === "title" && !Game.trans, 15000);
    },
    async idle(ms = 10000) { await H.until(() => window.PokaDebug.idle(), ms); },
    // 会話を最後まで送る
    async dialogs(max = 30) {
      for (let i = 0; i < max; i++) {
        const more = await page.evaluate(() => {
          const s = document.querySelector(".dlg-shade:not(.ask)");
          if (!s) return false;
          s.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
          return true;
        });
        if (!more) return;
        await page.waitForTimeout(70);
      }
    },
    async choose(i) {
      await page.waitForSelector(".choices .btn");
      await (await page.$$(".choices .btn"))[i].click();
      await page.waitForTimeout(150);
    },
    async tap(x, y) { await page.touchscreen.tap(x, y); await page.waitForTimeout(40); },
    async tapLabel(label) {
      const b = (await H.dbg("mg")).buttons.find((x) => x.label === label);
      expect(b, `ボタン「${label}」が見つからない`);
      await H.tap(b.cx, b.cy);
    },
    async drag(x0, y0, x1, y1, ms = 300) {
      await page.mouse.move(x0, y0); await page.mouse.down();
      const n = Math.max(2, Math.round(ms / 30));
      for (let i = 1; i <= n; i++) { await page.mouse.move(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n); await page.waitForTimeout(ms / n); }
      await page.mouse.up();
    },
    async hold(x, y, ms) { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); },
    // 最初から（オープニングを実際に操作して）おうちまで
    async newGameByUI() {
      await H.open();
      await page.click(".title-ui .btn");
      await H.wait(250); await H.dialogs();
      await H.choose(0); await H.dialogs();
      await H.until(() => G.sceneName === "house" && !Game.trans, 10000);
      await H.wait(700); await H.dialogs();
    },
    async newGameFast() {
      await H.open();
      await H.dbg("newGame", { goji: "soft" });
      await H.until(() => G.sceneName === "house" && !Game.trans, 10000);
      await H.wait(300);
    },
    async houseButton(label) {
      const btns = await page.$$(".house-bar .btn");
      for (const b of btns) if ((await b.textContent()).includes(label)) { await b.click(); await H.wait(250); return; }
      throw new Error(`おうちのボタン「${label}」がない`);
    },
    // お店を「正しい操作」で最後まで遊ぶ。ランクの配列を返す
    async playShop(shop, lv) {
      H.shopGrades = [];
      await H.dbg("shop", shop, lv);
      await H.until(() => G.sceneName === "shop" && !Game.trans, 10000);
      await H.wait(300); await H.dialogs();
      for (let c = 0; c < 12; c++) {
        await H.until(() => ["work", "result"].includes(PokaDebug.mg() && PokaDebug.mg().phase), 15000);
        let st = await H.dbg("mg");
        if (st.phase === "result") break;
        if (c === 0) await H.shot(`${shop}_order`);
        if (shop === "crepe") {
          for (const nm of st.order.want) await H.tapLabel(nm);
          await H.tapLabel("できあがり！");
        } else if (shop === "florist") {
          for (const { name: nm, n } of st.order.want) for (let i = 0; i < n; i++) await H.tapLabel(nm);
          await H.tapLabel("リボンを えらぶ ▶");
          await H.wait(120);
          await H.tapLabel(st.order.ribbon);
        } else if (shop === "bakery") {
          await H.tapLabel(st.order.bread);
          await H.until(() => { const m = PokaDebug.mg(); return m.order && m.order.step === "bake" && m.order.done >= m.order.zone - 1; }, 8000);
          await H.tapLabel("とりだす！");
          if (st.order.top) {
            await H.wait(120);
            st = await H.dbg("mg");
            await H.tapLabel(st.order.top.name);
            for (let i = 0; i < st.order.top.n; i++) await H.tap(st.order.breadAt.cx - 30 + i * 13, st.order.breadAt.cy - 6 + (i % 2) * 10);
            await H.tapLabel("できあがり！");
          }
        } else if (shop === "dentist") {
          for (let k = 0; k < 200; k++) {
            const m = await H.dbg("mg");
            if (!m || m.phase !== "work" || m.n !== st.n) break;
            const t = m.targets.find((x) => x.kind === "germ") || m.targets[0];
            if (!t) { await H.wait(120); continue; }
            if (t.kind === "germ") {
              // 移動する対象は取得と入力を同じフレームで行い、通信待ちで古い座標を押さない。
              await page.locator("#screen").evaluate(canvas => {
                const target = PokaDebug.mg()?.targets.find(x => x.kind === "germ");
                if (!target) return;
                const event = { bubbles: true, pointerId: 99, pointerType: "touch", clientX: target.cx, clientY: target.cy };
                canvas.dispatchEvent(new PointerEvent("pointerdown", event));
                canvas.dispatchEvent(new PointerEvent("pointerup", event));
              });
            }
            else if (t.kind === "dirt") {
              // 指を離さず往復する。短い一方向ドラッグの繰り返しは操作待ちが長くなる。
              await page.mouse.move(t.cx, t.cy); await page.mouse.down();
              for (let stroke = 0; stroke < 12; stroke++) {
                await page.mouse.move(t.cx + (stroke % 2 ? -16 : 16), t.cy, { steps: 2 });
                await H.wait(15);
              }
              await page.mouse.up();
            }
            else await H.hold(t.cx, t.cy, 1100);
          }
        }
        await H.until(() => { const m = PokaDebug.mg(); return m && m.phase !== "work"; }, 8000);
        const grade = await H.dbg("mg");
        H.shopGrades.push({ n: grade.n, score: grade.score, secondsLeft: grade.timeLeft, mistakes: grade.order?.mistakes });
        if (c === 0) { await H.wait(250); await H.shot(`${shop}_judge`); }
      }
      await H.until(() => !!document.querySelector(".modal-wrap .panel-foot .btn"), 15000);
      const st = await H.dbg("mg");
      await H.shot(`${shop}_result`);
      await page.click(".modal-wrap .panel-foot .btn");
      await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
      return st.ranks;
    },
    // たたかう を押し続けて バトルを終わらせる
    async fightToEnd(useTrio = false) {
      for (let i = 0; i < 120; i++) {
        if ((await page.evaluate(() => G.sceneName)) !== "battle") return;
        const trio = useTrio ? await page.$(".battle-ui .btn.small.pink:not([disabled])") : null;
        const attack = await page.$(".battle-ui .cmd-grid .btn.pink");
        if (trio) await trio.click();
        else if (attack) {
          await attack.click();
          await H.wait(120);
          const head = await page.$(".battle-ui .cmd-head");
          if (head && (await head.textContent()).includes("だれに")) { const t = await page.$(".battle-ui .cmd-grid .btn.pink"); if (t) await t.click(); }
        }
        const done = await page.$(".modal-wrap .panel-foot .btn");
        if (done) { await H.shot("battle_result"); await done.click(); }
        await H.dialogs(4);
        await H.wait(400);
      }
      throw new Error("バトルが終わらない");
    },
  };
  return H;
}

console.log(`ぽかぽかタウン スモークテスト ${FULL ? "（full）" : ""}`);

await scenario("起動とタイトル", async (H) => {
  await H.open();
  const ver = await H.eval(() => document.querySelector(".title-ui .ver").textContent);
  const gv = await H.eval(() => GAME_VERSION);
  expect(ver.includes(gv), `タイトルにバージョン ${gv} が出ていない`);
  expect((await H.eval(() => PokaDebug.help())) > 5, "PokaDebug.help() が動かない");
  await H.shot("title");
});

await scenario("はじめから→おうち→ごはん", async (H) => {
  await H.newGameByUI();
  await H.shot("house");
  const before = await H.eval(() => Chara.IDS.reduce((s, id) => s + Save.d.chars[id].hunger, 0));
  await H.houseButton("ごはん");
  const cards = await H.page.$$(".panel .grid .card");
  expect(cards.length > 0, "ごはんの一覧が空");
  // おにぎり（3こ）→ みんなに あげる
  for (const c of cards) if ((await c.textContent()).includes("おにぎり")) { await c.click(); break; }
  const opts = await H.page.$$eval(".choices .btn", (bs) => bs.map((b) => b.textContent));
  await H.choose(opts.findIndex((t) => t.includes("みんな")));
  await H.until(() => !G.scene.mode, 10000);
  await H.dialogs();
  const after = await H.eval(() => Chara.IDS.reduce((s, id) => s + Save.d.chars[id].hunger, 0));
  expect(after > before, `ごはんで おなかが増えていない (${before} → ${after})`);
});

await scenario("きがえ と もようがえ", async (H) => {
  await H.newGameFast();
  await H.dbg("unlockAll");
  await H.houseButton("きがえ");
  const items = await H.page.$$(".panel .grid .card");
  await items[2].click();
  await H.wait(200);
  await H.shot("dressup");
  const head = await H.eval(() => Save.d.chars[Save.d.order[0]].outfit.head);
  expect(head, "服を選んでも 着ていない");
  await H.page.click(".modal-wrap .close");
  await H.until(() => !G.scene.mode, 8000);
  const n0 = await H.eval(() => Save.d.room.items.length);
  await H.houseButton("もようがえ");
  await (await H.page.$$(".edit-bar .tray .card"))[0].click();
  await H.wait(300);
  await H.shot("remodel");
  await H.page.click(".edit-bar .btn.yellow");
  const n1 = await H.eval(() => Save.d.room.items.length);
  expect(n1 === n0 + 1, `家具が置けていない (${n0} → ${n1})`);
});

await scenario("まちへ→お店の入口", async (H) => {
  await H.newGameFast();
  await H.houseButton("おでかけ");
  await H.until(() => G.sceneName === "world" && G.scene.mapId === "town" && !Game.trans, 10000);
  await H.shot("town");
  expect(await H.dbg("walkTo", 4, 12), "クレープやさんへの道が見つからない");
  await H.page.waitForSelector(".choices .btn", { timeout: 12000 });
  await H.choose(1); // やめておく
  await H.until(() => PokaDebug.idle() && !G.scene.busy, 8000);
  const st = await H.dbg("state");
  expect(st.scene === "world" && st.map === "town", "お店をことわったあと 町に いない");
});

await scenario("クレープやさん（正しく作れば ◎）", async (H) => {
  await H.newGameFast();
  const c0 = await H.eval(() => Save.d.coins);
  const ranks = await H.playShop("crepe", 1);
  expect(ranks.length >= 4 && ranks.every((r) => r === 3), `◎にならない客がいる: ${ranks}`);
  const c1 = await H.eval(() => Save.d.coins);
  expect(c1 > c0, "コインが増えていない");
});

for (const shop of ["dentist", "bakery", "florist"]) {
  await scenario(`${shop}（Lv3・正しく操作すれば ◎）`, async (H) => {
    await H.newGameFast();
    const ranks = await H.playShop(shop, 3);
    expect(ranks.length >= 6 && ranks.every((r) => r === 3), `◎にならない客がいる: ${ranks}; ${JSON.stringify(H.shopGrades)}`);
  }, { full: true, timeout: 150000 });
}

for (const shop of ["link", "relay"]) for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario(`新ミニゲーム ${shop}（${viewport.width}）`, async (H) => {
  await H.newGameFast();
  const before = (await H.dbg("state")).coins;
  await H.dbg("shop", shop, 2);
  await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning);
  await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  await H.shot("start");
  for (let round = 0; round < 3; round++) {
    await H.until(() => PokaDebug.mg()?.phase === "work");
    let st;
    for (let n = 0; n < 900; n++) {
      st = await H.dbg("mg");
      if (st.phase !== "work") break;
      if (shop === "link") {
        const cells = st.order.legal.map(i => st.cells[i]);
        await H.page.mouse.move(cells[0].cx, cells[0].cy); await H.page.mouse.down();
        for (const p of cells.slice(1)) await H.page.mouse.move(p.cx, p.cy, { steps: 3 });
        await H.page.mouse.up();
      } else {
        const next = st.order.items.filter(it => it.progress > .48).sort((a,b) => b.progress - a.progress)[0];
        if (next) {
          const lane = next.rock ? (next.lane + 1) % 3 : next.lane;
          if (st.order.lane !== lane) await H.tapLabel(st.order.lane < lane ? "みぎ →" : "← ひだり");
          if (!next.rock && st.order.role !== next.role) await H.tapLabel("3にん こうたい");
        }
        await H.wait(45);
      }
    }
    expect(st.phase !== "work", "ミニゲームが終わらない");
    await H.until(() => PokaDebug.mg().ranks.length > 0 && PokaDebug.mg().phase !== "judge", 8000);
  }
  await H.until(() => PokaDebug.mg()?.phase === "result", 12000);
  const result = await H.dbg("mg");
  expect(result.ranks.length === 3 && result.ranks.every(r => r >= 2), `新作の正しい操作で成功しない: ${result.ranks}`);
  expect((await H.dbg("state")).coins > before, "報酬がない");
  await H.shot("result");
  await H.page.getByRole("button", { name: "まちに もどる", exact: true }).click();
  await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle());
}, { full: true, viewport, timeout: 180000 });

await scenario("難易度の設定と保存", async (H) => {
  await H.newGameFast();
  await H.page.getByRole("button", { name: "メニュー", exact: true }).click();
  await H.page.getByRole("button", { name: "せってい", exact: true }).click();
  await H.page.getByRole("button", { name: /むずかしい ／ コイン/ }).click();
  await H.dbg("save"); await H.page.reload();
  await H.until(() => PokaDebug.state().scene === "title" && PokaDebug.idle());
  await H.page.locator(".title-ui .btn").first().click();
  await H.idle(); await H.dbg("shop", "link", 1);
  await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning); await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  const st = await H.dbg("mg");
  expect(st.difficulty === "hard" && st.timeLimit === 44, "保存した難易度が新ミニゲームに反映されない");
}, { full: true });

await scenario("おうちの生活・デザ・増築", async (H) => {
  await H.newGameFast();
  for (const id of ["wanko", "gachan", "goji"]) {
    await H.dbg("give", "curry");
    const spicy = await H.dbg("feed", id, "curry");
    expect(spicy.dislike, `${id}が辛いものを好む`);
    expect((await H.dbg("homeLife")).chars[id].wantsDeza, "食後のデザ希望がない");
    await H.dbg("give", "pudding"); await H.dbg("feed", id, "pudding");
    expect(!(await H.dbg("homeLife")).chars[id].wantsDeza, "デザ希望が消えない");
  }
  await H.page.getByRole("button", { name: "みまもる", exact: true }).click();
  expect((await H.dbg("homeLife")).watching, "みまもりに入らない");
  await H.dbg("homeLife", "quarrel");
  const pt = await H.dbg("homePoint", 180, 390); await H.tap(pt.x, pt.y);
  expect(!(await H.dbg("homeLife")).quarrel, "仲裁できない");
  await H.dbg("homeLife", "rare");
  expect((await H.dbg("homeLife")).rare === 1, "レア会話が記録されない");
  await H.shot("watch-family");
  await H.page.getByRole("button", { name: "みまもりを おわる" }).click();
  await H.page.getByRole("button", { name: "おへや", exact: true }).click();
  expect(await H.page.getByRole("button", { name: "おへやを かう" }).first().isDisabled(), "増築の条件がない");
  await H.page.locator(".modal-wrap .close").last().click(); await H.wait(250);
  await H.dbg("coins", 5000); await H.dbg("wins", 10);
  await H.page.getByRole("button", { name: "おへや", exact: true }).click();
  const before = (await H.dbg("homeLife")).coins;
  await H.page.getByRole("button", { name: "おへやを かう" }).first().click(); await H.choose(0);
  await H.wait(1000); await H.until(() => PokaDebug.idle());
  const st = await H.dbg("homeLife"); expect(st.room === "study" && st.coins === before - 4500, "購入または部屋切替が不正");
  await H.dbg("save"); await H.page.reload(); await H.page.locator(".title-ui .btn").first().click();
  await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle());
  expect((await H.dbg("homeLife")).room === "study", "部屋が保存されない");
}, { full: true });

await scenario("新エリア・全体マップ・帰宅", async (H) => {
  await H.newGameFast();
  await H.dbg("teleport", "town", 34, 7);
  await H.until(() => PokaDebug.idle()); await H.dbg("walkTo", 35, 7);
  await H.until(() => PokaDebug.state().map === "city" && PokaDebug.idle());
  await H.shot("city");
  await H.page.getByRole("button", { name: "メニュー", exact: true }).click();
  await H.page.getByRole("button", { name: "ちず", exact: true }).click();
  expect(await H.page.getByRole("group", { name: "ぽかぽかの せかいの ちず", exact:true }).isVisible(), "全体マップがない");
  expect(await H.page.locator('.atlas-marker.is-current').getAttribute('data-area') === "city", "入ったエリアが地図の現在地に反映されない");
  await H.shot("atlas"); await H.page.locator(".modal-wrap .close").last().click(); await H.wait(300);
  await H.dbg("teleport", "city", 34, 17); await H.until(() => PokaDebug.idle());
  await H.dbg("walkTo", 35, 17); await H.until(() => PokaDebug.state().map === "coast" && PokaDebug.idle());
  await H.shot("coast");
  await H.dbg("level", 24); await H.dbg("battle", [{ kind:"crab",lv:16 }], "coast");
  await H.page.getByRole("button", { name:"とくぎ",exact:true }).waitFor(); await H.shot("new-enemy");
  await H.page.getByRole("button", { name:"おうちへ",exact:true }).click();
  await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle());
  const coins=(await H.dbg("state")).coins;
  await H.dbg("shop","crepe",1); await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  await H.page.getByRole("button", { name:"おうちへ",exact:true }).click();
  await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle());
  await H.wait(2000); expect((await H.dbg("state")).coins===coins,"途中退出で報酬が発生");
}, {full:true});

await scenario("バトルに勝つ", async (H) => {
  await H.newGameFast();
  await H.dbg("teleport", "meadow", 14, 5);
  await H.until(() => G.sceneName === "world" && G.scene.mapId === "meadow" && !Game.trans, 10000);
  await H.dbg("battle", [{ kind: "purun", lv: 1 }], "meadow");
  await H.until(() => G.sceneName === "battle" && !Game.trans, 10000);
  await H.wait(1500);
  await H.shot("battle");
  await H.fightToEnd();
  await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
  const wins = await H.eval(() => Save.d.stats.wins);
  expect(wins === 1, `勝利数が 1 になっていない (${wins})`);
});

await scenario("ボスに勝つ（王冠がもらえる）", async (H) => {
  await H.newGameFast();
  await H.dbg("level", 24);
  await H.dbg("teleport", "cave", 12, 29);
  await H.until(() => G.sceneName === "world" && G.scene.mapId === "cave" && !Game.trans, 10000);
  await H.shot("cave");
  await H.dbg("battle", [{ kind: "king", lv: 18 }], "cave", true);
  await H.until(() => G.sceneName === "battle" && !Game.trans, 10000);
  await H.wait(1500);
  await H.fightToEnd(true);
  const r = await H.eval(() => ({ boss: Save.d.flags.boss, crown: !!Save.d.wardrobe.crown, trophy: Save.d.furn.trophy || 0 }));
  expect(r.boss && r.crown && r.trophy >= 1, "ボスの ほうしゅうが もらえていない " + JSON.stringify(r));
}, { full: true, timeout: 150000 });

await scenario("セーブ→つづきから", async (H) => {
  await H.newGameFast();
  await H.dbg("teleport", "town", 12, 17, "left");
  await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
  await H.dbg("coins", 777);
  await H.dbg("save");
  await H.page.reload();
  await H.until(() => typeof G !== "undefined" && G.sceneName === "title" && !Game.trans, 15000);
  const labels = await H.page.$$eval(".title-ui .btn", (bs) => bs.map((b) => b.textContent));
  expect(labels[0].includes("つづきから"), "つづきから ボタンがない");
  await H.page.click(".title-ui .btn");
  await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
  const st = await H.dbg("state");
  expect(st.map === "town" && st.pos[0] === 12 && st.pos[1] === 17, "つづきから の位置がちがう " + JSON.stringify(st));
  expect(st.coins >= 777 + 150, "コインが保存されていない");
});

for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) await scenario(`戦闘メニューと体力（${viewport.width}）`, async (H) => {
  await H.newGameFast();
  await H.dbg("level", 24);
  await H.dbg("battle", [{ kind: "king", lv: 18 }], "cave", true);
  await H.page.getByRole("button", { name: "とくぎ", exact: true }).waitFor();
  for (const label of [null, "とくぎ", "もどる", "どうぐ"]) {
    if (label) await H.page.getByRole("button", { name: label, exact: true }).click();
    await H.wait(100);
    const bounds = await H.dbg("battleLayout");
    expect(bounds.cardBottom < bounds.menuTop, `HPが隠れる: ${JSON.stringify(bounds)}`);
    expect(bounds.enemyTop > 0, "敵が画面外");
  }
  await H.shot("menu-hp");
}, { viewport, full: true });

await scenario("小さい画面（375×667）", async (H) => {
  await H.newGameFast();
  await H.shot("se_house");
  await H.dbg("battle", [{ kind: "kinokko", lv: 6 }, { kind: "happa", lv: 7 }, { kind: "donguri", lv: 6 }], "forest");
  await H.until(() => G.sceneName === "battle" && !Game.trans, 10000);
  await H.wait(1500);
  await H.shot("se_battle");
  const bounds = await H.dbg("battleLayout");
  const overlap = bounds.cardBottom >= bounds.menuTop;
  expect(!overlap, "バトルの ステータス欄が コマンド欄と 大きく重なっている");
}, { viewport: { width: 375, height: 667 }, full: true });

await scenario("夜の町", async (H) => {
  await H.newGameFast();
  await H.dbg("hour", 21);
  await H.dbg("teleport", "town", 12, 17);
  await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
  await H.wait(800);
  await H.shot("night");
  const fps = await H.dbg("fps", 1500);
  expect(fps >= 20, `FPS が低すぎる (${fps})`);
}, { full: true });

await scenario("交通（電車・船・飛行機・中止・セーブ）", async H=>{
  await H.newGameFast(); await H.dbg("hour",12);
  const board=async(map,x,y,stop,choice)=>{
    await H.dbg("teleport",map,x,y,"up");
    await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,map);
    const p=(await H.dbg("world")).stops.find(s=>s.id===stop);
    await H.tap(p.cx,p.cy); await H.page.getByRole("button",{name:choice,exact:true}).click();
  };
  await board("town",32,4,"town_station","やめておく");
  await H.idle();expect((await H.dbg("state")).map==="town","乗車中止で移動した");
  for(const [map,x,y,stop,choice,destination,kind] of [
    ["town",32,4,"town_station","平和台えきへ","heiwadai","train"],
    ["coast",24,23,"coast_ferry","みなとの のりばへ","harbor","ferry"],
    ["harbor",21,9,"harbor_air","そらいろくうこうへ","airport","plane"],
  ]) {
    await board(map,x,y,stop,choice);
    await H.until(()=>PokaDebug.state().scene==="travel"&&PokaDebug.idle());
    const trip=await H.dbg("travel");expect(trip.kind===kind&&trip.party.length===3,"3人で乗車できない");
    await H.shot(kind); await H.page.getByRole("button",{name:"ついた！",exact:true}).click();
    await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,destination);
    expect((await H.dbg("world")).party.length===3,"到着後の3人がいない");
  }
  const before=await H.dbg("state");await H.dbg("save");await H.page.reload();
  await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.until(()=>PokaDebug.state().scene==="world"&&PokaDebug.idle());
  const after=await H.dbg("state");expect(after.map==="airport"&&after.coins===before.coins,"交通の到着位置・コインのセーブに失敗");
  await board("airport",6,22,"airport_station","ぽかぽかえきへ");
  await H.until(()=>PokaDebug.state().scene==="travel"&&PokaDebug.idle());
  await H.page.getByRole("button",{name:"おうちへ",exact:true}).click();
  await H.until(()=>PokaDebug.state().scene==="house"&&PokaDebug.idle());
}, {timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`町の景観としかけ（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);
  for(const [map,x,y] of [["heiwadai",27,14],["heiwadai",16,28],["town",12,16],["city",21,22],["harbor",19,23],["airport",25,20],["meadow",10,10],["forest",14,14],["cave",12,12]]){
    await H.dbg("teleport",map,x,y);await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,map);
    await H.shot(`${map}-${x}`);
  }
  await H.dbg("teleport","heiwadai",16,28);await H.until(()=>PokaDebug.state().map==="heiwadai"&&PokaDebug.idle());
  const o=(await H.dbg("world")).objects.find(o=>o.id==="heiwadai_fountain");
  await H.tap(o.cx,o.cy);await H.until(()=>PokaDebug.world()?.active==="heiwadai_fountain",10000);
  await H.shot("fountain-play");
  await H.page.keyboard.press("Escape");await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  await H.page.getByRole("button",{name:"平和台（へいわだい）",exact:true}).click();
  await H.page.getByRole("heading",{name:"平和台（へいわだい）",exact:true}).scrollIntoViewIfNeeded();await H.shot("heiwadai-map");
  const overflow=await H.eval(()=>document.documentElement.scrollWidth>innerWidth);expect(!overflow,"小さい画面で横にはみ出す");
},{viewport,full:true,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`季節のおまつり（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);
  for(const date of ["2026-03-01","2026-06-01","2026-09-01","2026-12-01"]){
    await H.dbg("calendar",date);
    const initial=await H.dbg("festival");expect(initial.count===0&&!initial.claimed,"新しい季節の記録が不正");
    for(const t of initial.targets){
      await H.dbg("teleport",t.map,t.x-1,t.y);
      await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,t.map);
      const o=(await H.dbg("world")).objects.find(o=>o.id===t.id);await H.tap(o.cx,o.cy);
      await H.until(id=>!!PokaDebug.festival().stamps[id],10000,t.id);
    }
    await H.page.locator(".world-festival").click();await H.shot(initial.id+"-rewards");
    await H.page.getByRole("button",{name:"きねんひんを うけとる",exact:true}).click();
    const s=await H.dbg("festival");expect(s.count===3&&s.claimed&&s.inventory.wear&&s.inventory.furn===1&&s.inventory.food===3,"記念品がそろわない");
    expect(await H.page.getByRole("button",{name:"きねんひんは うけとりずみ",exact:true}).isDisabled(),"連打で再受け取りできる");
    expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"おまつり画面がはみ出す");
    await H.page.getByRole("button",{name:"とじる",exact:true}).click();await H.idle();
  }
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.until(()=>PokaDebug.state().scene==="world"&&PokaDebug.idle());
  await H.dbg("calendar","2027-01-01");const saved=await H.dbg("festival");expect(saved.key==="2026-winter"&&saved.claimed&&saved.inventory.furn===1,"冬の年越し・再開で記録が失われた");
  await H.dbg("calendar","2027-03-01");const next=await H.dbg("festival");expect(next.count===0&&!next.claimed&&next.inventory.wear&&next.inventory.furn===1,"翌年への移行で取得済みの品が消えた");
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`地形の全体マップ（${viewport.width}）`,async H=>{
  await H.newGameFast(); await H.dbg("hour",12);
  await H.dbg("teleport","town",12,16); await H.idle();
  const before=await H.dbg("state");
  await H.page.keyboard.press("Escape");
  await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  const atlas=H.page.locator(".world-atlas"), svg=atlas.locator(".atlas-svg");
  expect(await atlas.locator(".atlas-marker").count()===9,"9エリアが表示されない");
  expect(await atlas.locator(".atlas-marker.is-current").getAttribute("data-area")==="town","現在地が違う");
  const touchBox=await atlas.locator('[data-area="town"] .atlas-hit').boundingBox();
  expect(touchBox.width>=44&&touchBox.height>=44,"地点のタップ範囲が44pxより小さい");
  await H.shot("overview");
  for(const [id,label] of [["heiwadai","平和台（へいわだい）"],["airport","そらいろくうこう"],["coast","しおかぜビーチ"],["harbor","あおぞらポート"]]) {
    await atlas.getByRole("button",{name:label,exact:true}).click();
    expect(await atlas.getAttribute("data-selected")===id,`${label}のタップが反応しない`);
    expect(await atlas.getByRole("heading",{name:label,exact:true}).count()===1,"詳細の見出しが変わらない");
  }
  await atlas.locator(".atlas-select").selectOption("forest");
  expect(await atlas.getAttribute("data-selected")==="forest","エリア選択が反応しない");
  const town=atlas.getByRole("button",{name:"ぽかぽかタウン",exact:true});
  await town.focus(); await H.page.keyboard.press("Enter");
  expect(await atlas.getAttribute("data-selected")==="town","キーボードで選択できない");
  await atlas.getByRole("button",{name:"ちずを おおきく",exact:true}).click();
  expect(+(await atlas.getAttribute("data-zoom"))>1,"拡大されない");
  await svg.scrollIntoViewIfNeeded();
  const box=await svg.boundingBox(), initial=await svg.getAttribute("viewBox");
  await H.drag(box.x+box.width*.65,box.y+box.height*.6,box.x+box.width*.35,box.y+box.height*.45);
  expect(await svg.getAttribute("viewBox")!==initial,"地図をなぞって移動できない");
  expect(await atlas.getAttribute("data-selected")==="town","ドラッグが地点のタップになった");
  await atlas.getByRole("button",{name:"いまの ばしょを みる",exact:true}).click();
  expect(+(await atlas.getAttribute("data-zoom"))===2,"現在地へ拡大されない");
  await svg.scrollIntoViewIfNeeded(); await H.shot("zoom-town");
  // 実際の2本指入力で拡大・縮小。指を離したあとも通常のタップが使える。
  const session=await H.page.context().newCDPSession(H.page), r=await svg.boundingBox();
  const cx=r.x+r.width/2,cy=r.y+r.height/2;
  const points=distance=>[{x:cx-distance,y:cy,id:1},{x:cx+distance,y:cy,id:2}];
  await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:points(30)});
  await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:points(55)});
  await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  expect(+(await atlas.getAttribute("data-zoom"))>2,"2本指で拡大できない");
  await session.detach();
  await atlas.getByRole("button",{name:"ちずを ぜんたいに もどす",exact:true}).click();
  expect(await svg.getAttribute("viewBox")==="0 0 800 850","全体に戻らない");
  const routes=atlas.getByRole("button",{name:"のりものの みち",exact:true});
  await routes.click(); expect(!(await atlas.locator(".atlas-transit").isVisible()),"航路を隠せない");
  await routes.click(); expect(await atlas.locator(".atlas-transit").isVisible(),"航路を戻せない");
  await atlas.getByRole("button",{name:"平和台（へいわだい）",exact:true}).click();
  await atlas.locator("summary").click();
  expect(await atlas.getByRole("img",{name:"平和台（へいわだい）の詳細地図",exact:true}).isVisible(),"詳細マップを見られない");
  await atlas.getByRole("heading",{name:"平和台（へいわだい）",exact:true}).scrollIntoViewIfNeeded();
  await H.shot("local-heiwadai");
  expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"全体マップが画面をはみ出す");
  const after=await H.dbg("state");
  expect(after.map===before.map&&after.coins===before.coins&&JSON.stringify(after.pos)===JSON.stringify(before.pos),"地図閲覧でプレイ状態が変わった");
  await H.page.getByRole("button",{name:"とじる",exact:true}).click(); await H.idle();
  await H.dbg("teleport","heiwadai",16,28); await H.idle();
  await H.page.keyboard.press("Escape"); await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  expect(await H.page.locator(".atlas-marker.is-current").getAttribute("data-area")==="heiwadai","再度開いた地図の現在地が古い");
},{viewport,full:viewport.width===375,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`ぱぱまま・吹き出し・セーブ（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("coins",987504);await H.dbg("needs",20);
  const money=(await H.dbg("state")).coins;
  await H.until(()=>Object.values(PokaDebug.family().lastCare).some(n=>n>0),18000);
  expect((await H.dbg("family")).bag.onigiri===2,"自動のお世話で手持ちのごはんを使わない");
  await H.page.getByRole("button",{name:"ぱぱ・まま",exact:true}).click();
  await H.page.getByRole("button",{name:"じどうの おせわ：する",exact:true}).click();
  for(const [key,value] of [["ふく","apron"],["かお","wink"],["かみがた","curly"],["いろ","mint"],["こもの","cap"],["はだいろ","warm"]])await H.page.getByLabel(key,{exact:true}).selectOption(value);
  await H.page.getByRole("button",{name:"まま",exact:true}).click();
  await H.page.getByLabel("ふく",{exact:true}).selectOption("suit");await H.page.getByLabel("かお",{exact:true}).selectOption("round");
  await H.shot("parent-customize");
  const looks=(await H.dbg("family")).looks;
  expect(looks.papa.outfit==="apron"&&looks.papa.face==="wink"&&looks.mama.outfit==="suit"&&looks.mama.face==="round","親の見た目が選べない");
  await H.page.getByRole("button",{name:"3にんを おせわ",exact:true}).click();
  await H.until(()=>Object.values(PokaDebug.family().lastCare).every(n=>n>0),20000);
  expect(((await H.dbg("family")).bag.onigiri||0)===0,"3人のお世話で食事の数が合わない");
  expect((await H.dbg("state")).coins===money,"お世話や着せ替えでおかねが減った");
  await H.until(()=>PokaDebug.family().parents.every(p=>!p.target),10000);
  await H.houseButton("みまもる");await H.dbg("homeLife","chat");await H.dbg("pause",true);
  const f=await H.dbg("family");expect(f.bubbles.length===3,"3人の会話がない");
  for(const b of f.bubbles){expect(b.x>=0&&b.y>=0&&b.x+b.w<=f.width&&b.y+b.h<=f.height,"吹き出しが画面からはみ出す");expect(Number.isFinite(b.anchor.x)&&Number.isFinite(b.anchor.y),"話者へ向くしっぽがない");}
  for(let i=0;i<f.bubbles.length;i++)for(let j=i+1;j<f.bubbles.length;j++){const a=f.bubbles[i],b=f.bubbles[j];expect(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),"吹き出しが重なる");}
  await H.shot("family-bubbles");await H.dbg("pause",false);
  await H.dbg("needs",100);await H.dbg("give","onigiri",2);
  expect(/はらぺん|はらぱん/.test((await H.dbg("feed","gachan","onigiri")).text),"満腹時のことばがない");
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  const restored=await H.dbg("family");expect(JSON.stringify(restored.looks)===JSON.stringify(looks)&&!restored.auto,"見た目や自動お世話の設定が保存されない");
  expect((await H.dbg("state")).coins===money,"再開でおかねが変わった");
  expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"親の画面が横にはみ出す");
},{viewport,full:viewport.width===375,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`12か月のおまつり（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("coins",987504);
  const money=(await H.dbg("state")).coins;
  for(const month of viewport.width===390?Array.from({length:12},(_,i)=>i+1):[7,10]) {
    await H.dbg("calendar",`2026-${String(month).padStart(2,"0")}-15`);
    await H.dbg("teleport","town",12,16);await H.idle();
    await H.page.locator(".world-festival").click();await H.page.locator(".annual-invite").click();
    expect(await H.page.locator(".annual-months .btn").count()===12,"年間予定が12種類ない");
    await H.page.getByRole("button",{name:"この おまつりに さんか",exact:true}).click();await H.idle();
    const s=await H.dbg("annual");expect(s.joined&&!s.claimed,"おまつりに参加できない");
    for(const t of s.targets) {
      await H.dbg("teleport",t.map,t.x-1,t.y);await H.idle();
      const o=(await H.dbg("world")).objects.find(o=>o.id===t.id);await H.tap(o.cx,o.cy);
      await H.page.getByRole("button",{name:t.choices[month%2],exact:true}).click();
      await H.until(id=>!!PokaDebug.annual().stamps[id],10000,t.id);
    }
    await H.page.locator(".world-festival").click();await H.page.locator(".annual-invite").click();
    expect(await H.page.getByRole("heading",{name:s.name,exact:true}).count()===1,"イベント名が表示されない");
    if(month===7||month===10)await H.shot(s.id+"-festival");
    await H.page.getByRole("button",{name:"おまつりの きねんひんを うけとる",exact:true}).click();
    const won=await H.dbg("annual");expect(won.count===3&&won.claimed&&won.inventory.wear&&won.inventory.furn===1&&won.inventory.food===3,"限定品がそろわない");
    expect(await H.page.getByRole("button",{name:"おまつりの きねんひんは うけとりずみ",exact:true}).isDisabled(),"2回受け取れる");
    expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"おまつり画面がはみ出す");
    await H.page.getByRole("button",{name:"1がつ　おしょうがつ",exact:true}).click();
    if(month!==1)expect(await H.page.getByRole("button",{name:"この おまつりに さんか",exact:true}).count()===0,"期間外でも参加できる");
    if(month===10){await H.page.locator(".annual-months").scrollIntoViewIfNeeded();await H.wait(2400);await H.shot("year-calendar");}
    await H.page.getByRole("button",{name:"とじる",exact:true}).click();await H.idle();
    expect((await H.dbg("state")).coins===money,"おまつりでおかねが変わった");
  }
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  await H.dbg("calendar","2026-10-31");const saved=await H.dbg("annual");expect(saved.claimed&&saved.inventory.furn===1,"再開で記録が消えた");
  await H.dbg("calendar","2027-10-01");const next=await H.dbg("annual");expect(!next.claimed&&next.count===0&&next.inventory.furn===1,"翌年に品が消えた");
  expect((await H.dbg("state")).coins===money,"再開でおかねが変わった");
},{viewport,full:viewport.width===375,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`天気・四季・予報（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("coins",987504);
  await H.dbg("teleport","town",12,16);await H.idle();await H.wait(3200);
  const money=(await H.dbg("state")).coins,palettes=[];
  for(const [kind,date] of [["clear","2026-04-15"],["cloudy","2026-06-15"],["rain","2026-06-15"],["snow","2026-12-15"],["wind","2026-10-15"]]) {
    await H.dbg("calendar",date);await H.dbg("weather",kind);await H.wait(400);
    const w=await H.dbg("weather");palettes.push(w.palette.grass);
    expect(w.kind===kind&&!w.indoors&&w.particles<=48,"天気の表示が不正");
    const badge=H.page.getByRole("button",{name:"てんき："+w.name,exact:true}),box=await badge.boundingBox(),hud=await H.page.locator(".hud").boundingBox();
    expect(box.height>=44&&box.y>=hud.y+hud.height&&box.x>=0&&box.x+box.width<=viewport.width,"天気ボタンがHUDと重なる/小さい");
    await H.shot(kind+"-town");
    if(kind==="rain") {
      const fps=await H.dbg("fps",1800);expect(fps>=20,`雨のFPSが低い: ${fps}`);
      await badge.click();expect(await H.page.locator(".weather-forecast div").count()===3,"予報が3枠ない");await H.shot("forecast");
      expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"天気予報が横にはみ出す");
      await H.page.getByRole("button",{name:"とじる",exact:true}).click();await H.idle();
    }
  }
  expect(new Set(palettes).size===4,"四季の地面の色が変わらない");
  await H.dbg("weather","rain");await H.dbg("teleport","cave",4,4);await H.idle();
  expect((await H.dbg("weather")).particles===0,"洞窟に雨が降る");
  await H.dbg("house");await H.idle();expect((await H.dbg("weather")).indoors&&await H.page.locator(".world-weather").count()===0,"家に屋外ボタン/天気が残る");
  await H.dbg("homeLife","weather");expect((await H.dbg("homeLife")).bubbles.some(b=>/あめ|しずく/.test(b.text)),"天気のひとことがない");
  await H.dbg("teleport","town",12,16);await H.idle();expect((await H.dbg("weather")).particles===48,"外で雨が復帰しない");
  await H.dbg("calendar",null);const natural=await H.dbg("weather",null);await H.dbg("save");
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  const restored=await H.dbg("weather"),samePeriod=restored.forecast[0].day===natural.forecast[0].day&&restored.forecast[0].hour===natural.forecast[0].hour;
  expect(!samePeriod||restored.kind===natural.kind,"再開で同じ時間帯の天気が変わった");
  expect((await H.dbg("state")).coins===money,"天気や再開でおかねが変わった");
},{viewport,full:viewport.width===375,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`広いおうち・立体もようがえ（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("pause",true);
  await H.dbg("coins",987504);const original=await H.dbg("homeDesign"),money=(await H.dbg("state")).coins;
  const raw=items=>items.map(({rect,anchor,...it})=>it);
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();await H.dbg("pause",true);await H.dbg("hour",12);
  let d=await H.dbg("homeDesign");
  expect(d.width===480&&d.depth===360,"床の面積が拡張されていない");
  expect(JSON.stringify(raw(d.items))===JSON.stringify(raw(original.items))&&JSON.stringify(d.furn)===JSON.stringify(original.furn),"読み込みで旧家具・座標が変わった");
  expect((await H.dbg("state")).coins===money,"おうちの更新でおかねが変わった");await H.shot("existing-save");
  await H.dbg("unlockAll");
  const layout=[
    {id:"map_frame",x:180,y:85,wallSide:"left"},{id:"window",x:240,y:80},{id:"herb_frame",x:310,y:135},
    {id:"rug_kilim",x:255,y:545},{id:"bed_simple",x:265,y:500},{id:"bookshelf",x:78,y:306},
    {id:"wardrobe_oak",x:382,y:326},{id:"birdcage_brass",x:164,y:310},{id:"table_wood",x:124,y:418},
    {id:"chair_wood",x:72,y:450},{id:"plant",x:54,y:538},{id:"teacart",x:364,y:557},{id:"stool_oak",x:420,y:495},
  ];
  await H.dbg("homeLayout",layout,"wp_sage_panel","fl_walnut");await H.wait(500);
  await H.shot("furnished");await H.dbg("pause",false);await H.houseButton("もようがえ");
  d=await H.dbg("homeDesign");const stool=d.items.find(it=>it.id==="stool_oak");
  const start={x:stool.rect.x+stool.rect.w*.5,y:stool.rect.y+stool.rect.h*.2};
  const a=await H.dbg("homePoint",stool.x,stool.y),b=await H.dbg("homePoint",stool.x-90,stool.y+30);
  await H.page.mouse.move(start.x,start.y);await H.page.mouse.down();await H.page.mouse.move(start.x+b.x-a.x,start.y+b.y-a.y,{steps:12});await H.page.mouse.up();
  d=await H.dbg("homeDesign");const moved=d.items.find(it=>it.uid===stool.uid);
  expect(Math.abs(moved.x-(stool.x-90))<2&&Math.abs(moved.y-(stool.y+30))<2,"斜めの床で家具が指とずれる");
  await H.page.getByRole("button",{name:"はんてん",exact:true}).click();expect((await H.dbg("homeDesign")).items.find(it=>it.uid===stool.uid).flip,"家具が回転しない");
  const map=(await H.dbg("homeDesign")).items.find(it=>it.id==="map_frame");
  await H.tap(map.rect.x+map.rect.w/2,map.rect.y+map.rect.h/2);
  await H.page.getByRole("button",{name:"かべを かえる",exact:true}).click();
  expect((await H.dbg("homeDesign")).items.find(it=>it.id==="map_frame").wallSide==="back","右の壁へ移せない");
  await H.page.getByRole("button",{name:"かべを かえる",exact:true}).click();
  for(const b of await H.page.locator(".home-view-controls button,.edit-tools button").all()){const r=await b.boundingBox();expect(r.height>=44&&r.x>=0&&r.x+r.width<=viewport.width,"操作ボタンが小さい/画面外");}
  await H.page.getByRole("button",{name:"おへやを おおきく",exact:true}).click();expect((await H.dbg("homeDesign")).zoom===1.25,"拡大できない");
  await H.page.mouse.move(20,120);await H.page.mouse.down();await H.page.mouse.move(55,150,{steps:10});await H.page.mouse.up();
  expect(Math.abs((await H.dbg("homeDesign")).pan.x)>5,"拡大後に画面を動かせない");
  await H.page.getByRole("button",{name:"おへやを ぜんたいに",exact:true}).click();d=await H.dbg("homeDesign");
  expect(d.zoom===1&&d.pan.x===0&&d.pan.y===0,"全体表示に戻らない");await H.shot("editing");
  await H.page.locator(".edit-bar .btn.yellow").click();await H.wait(100);
  // 家具と話者のタップ判定は表示された位置を基準にする。
  d=await H.dbg("homeDesign");const cage=d.items.find(it=>it.id==="birdcage_brass");
  await H.tap(cage.rect.x+cage.rect.w*.5,cage.rect.y+cage.rect.h*.3);
  expect((await H.dbg("homeLife")).furniture[cage.uid]>0,"とりかごがタップで動かない");
  await H.houseButton("みまもる");await H.shot("watch");await H.page.getByRole("button",{name:"みまもりを おわる",exact:true}).click();
  const final=await H.dbg("homeDesign");await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  d=await H.dbg("homeDesign");expect(JSON.stringify(raw(d.items))===JSON.stringify(raw(final.items))&&d.wall===final.wall&&d.floor===final.floor,"新しい部屋の配置が保存されない");
  expect((await H.dbg("state")).coins===money,"模様替えでおかねが変わった");
  await H.houseButton("あそぶ");await H.choose(1);
  await H.until(()=>PokaDebug.homeDesign().ball!==null);
  const ball=(await H.dbg("homeDesign")).ball;await H.tap(ball.x,ball.y);
  expect((await H.dbg("homeDesign")).ball.hits===1,"ボールの見た目とタップ位置がずれる");
  await H.until(()=>PokaDebug.homeDesign().mode===null,10000);
  await H.houseButton("あそぶ");await H.choose(0);await H.until(()=>PokaDebug.homeDesign().mode==="hide",10000);
  for(let n=0;n<3;n++){
    const sp=(await H.dbg("homeDesign")).hide.spots[0];if(!sp)break;
    await H.tap(sp.rect.x+sp.rect.w/2,sp.rect.y+sp.rect.h/2);
  }
  expect((await H.dbg("homeDesign")).hide.found===3,"立体家具のかくれんぼで3人を見つけられない");
  await H.until(()=>PokaDebug.homeDesign().mode===null,6000);
  await H.houseButton("ねる");await H.wait(4000);await H.dialogs();await H.until(()=>PokaDebug.homeDesign().mode===null,8000);
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`落ち葉・背景に固定（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("calendar","2026-10-15");await H.dbg("hour",12);await H.dbg("weather","wind");
  await H.dbg("teleport","heiwadai",16,28);await H.idle();await H.wait(300);
  const before=await H.dbg("drift",30),money=(await H.dbg("state")).coins;
  expect(await H.dbg("walkTo",18,30),"公園の移動先に到達できない");
  await H.until(()=>{const p=PokaDebug.state().pos;return p[0]===18&&p[1]===30;});await H.wait(600);
  const after=await H.dbg("drift",30),dx=after.camera.x-before.camera.x,dy=after.camera.y-before.camera.y;
  expect(Math.hypot(dx,dy)>20,"歩いてもカメラ移動が発生していない");
  for(const kind of ["seasonal","wind"]){
    const common=after[kind].filter(p=>before[kind].some(q=>p.id===q.id));expect(common.length>2,"移動で葉が全部入れ替わった");
    for(const p of common){const q=before[kind].find(q=>q.id===p.id);expect(p.wx===q.wx&&p.wy===q.wy&&Math.abs(p.x-q.x+dx)<.001&&Math.abs(p.y-q.y+dy)<.001,"葉が背景と別の速さで動く");}
  }
  await H.shot("autumn-wind");expect(await H.dbg("fps",1800)>=20,"葉の描画でFPSが低下");
  await H.dbg("teleport","cave",4,4);await H.idle();expect((await H.dbg("drift")).seasonal.length===0&&(await H.dbg("drift")).wind.length===0,"洞窟で葉が表示される");
  expect((await H.dbg("state")).coins===money,"演出でおかねが変わった");
  if(viewport.width===390){
    const preview=await H.page.context().newPage(),errors=[];preview.on("pageerror",e=>errors.push(e.message));
    await preview.goto(url+"tools/preview.html");
    await preview.getByRole("heading",{name:"風と落ち葉",exact:true}).waitFor();
    expect(!errors.length,"素材プレビューでエラー: "+errors.join(";"));await preview.close();
  }
},{viewport,full:viewport.width===375,timeout:90000});

await browser.close();
server.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length ? "✗" : "✓"} ${results.length - bad.length}/${results.length} シナリオ成功${SHOTS ? `（スクリーンショット: tests/screenshots/）` : ""}`);
process.exit(bad.length ? 1 : 0);
