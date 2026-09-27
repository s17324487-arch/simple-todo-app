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
      try { await page.screenshot({ path: join(SHOT_DIR, `${name}_${label}.png`) }); }
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
  expect(await H.page.getByRole("img", { name: "町とエリアのつながり" }).isVisible(), "全体マップがない");
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

await browser.close();
server.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length ? "✗" : "✓"} ${results.length - bad.length}/${results.length} シナリオ成功${SHOTS ? `（スクリーンショット: tests/screenshots/）` : ""}`);
process.exit(bad.length ? 1 : 0);
