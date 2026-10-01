// ブラウザで実際に遊んで確かめる自動テスト（Playwright + Chromium / WebKit）。
//   npm test              … 静的チェック + ふだんのスモークテスト（約1〜2分）
//   npm run test:full     … 4つのお店・ボス・小さい画面・夜 もふくむ（約4〜6分）、スクリーンショットも保存
// オプション: --full（全部） --shots（tests/screenshots/ に画像を保存） --headed（画面を表示） --only=名前の一部
// --browser=webkit でWebKit。実行ファイルは CHROMIUM_PATH / WEBKIT_PATH。
// --skip-missing はブラウザ未導入時だけ理由を表示して飛ばす（CIでは使わない）。
// ゲーム内部の変数にはなるべく触らず、js/debug.js の PokaDebug と 実際のタップ操作で進める。
import { chromium, webkit } from "playwright";
import { mkdirSync, readdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "../tools/serve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const FULL = argv.includes("--full");
// CIは1倍。負荷の高いPCでは待機上限だけを延ばせる（検証項目は同じ）。
const WAIT_SCALE=Number((argv.find(a=>a.startsWith("--timeout-scale="))||"--timeout-scale=1").split("=")[1]);
if(!Number.isFinite(WAIT_SCALE)||WAIT_SCALE<1||WAIT_SCALE>5)throw new Error("timeout-scale must be 1..5");
const SHOTS = argv.includes("--shots") || FULL;
const HEADED = argv.includes("--headed");
const ONLY = (argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const LIST = argv.includes('--list');
const shardArg=(argv.find(a=>a.startsWith('--shard='))||'--shard=1/1').slice(8);
if(!/^\d+\/\d+$/.test(shardArg))throw new Error('--shard は 1/4 の形式で指定してください');
const [SHARD,SHARDS]=shardArg.split('/').map(Number);
if(SHARD<1||SHARDS<1||SHARD>SHARDS)throw new Error('--shard の範囲が不正です');
let eligibleCount=0;
const ENGINE = (argv.find(a=>a.startsWith("--browser=")) || "--browser=chromium").slice(10);
if (!["chromium","webkit"].includes(ENGINE)) throw new Error("--browser は chromium または webkit を指定してください");
const BROWSER_TYPE = ENGINE === "webkit" ? webkit : chromium;
const EXECUTABLE = process.env[ENGINE === "webkit" ? "WEBKIT_PATH" : "CHROMIUM_PATH"] || BROWSER_TYPE.executablePath();
if (!LIST && !existsSync(EXECUTABLE)) {
  const msg = `${ENGINE} がありません。game/ で npx playwright install ${ENGINE} を実行してください。`;
  if (argv.includes("--skip-missing")) { console.log("SKIP: " + msg); process.exit(0); }
  throw new Error(msg);
}
const SHOT_DIR = resolve(HERE, "screenshots", ...(ENGINE === "webkit" ? ["webkit"] : []));
if(!LIST) mkdirSync(SHOT_DIR, { recursive: true });
// 前回の画像が残っていると まぎらわしいので消す（--shots のときは全部、ふだんは失敗画像 FAIL_*.png だけ）
for (const f of LIST ? [] : readdirSync(SHOT_DIR)) if (f.endsWith(".png") && (SHOTS || f.startsWith("FAIL_"))) rmSync(join(SHOT_DIR, f));

const { server, url } = LIST ? {server:{close(){}},url:''} : await serve({ port: 0, quiet: true });
if(!LIST) console.log('検証ブラウザ: '+ENGINE+' / 分割 '+SHARD+'/'+SHARDS);
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function expect(cond, msg) { if (!cond) throw new Error(msg); }

async function scenario(name, fn, { viewport = { width: 390, height: 844 }, timeout = 90000, full = false } = {}) {
  if (full && !FULL) return;
  if (ONLY && !name.includes(ONLY)) return;
  if(eligibleCount++ % SHARDS !== SHARD-1)return;
  if(LIST){console.log(name);return;}
  // SVGを多用するシナリオ間でWebKitの描画プロセスも確実に解放する。
  // 各シナリオ内の長時間プレイ・画面遷移は従来どおり全部検査する。
  const browser = await BROWSER_TYPE.launch({ headless: !HEADED, executablePath: EXECUTABLE });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "ja-JP" });
  // ゲームの検証は外部フォントの応答に依存させない（CIのload待ちを安定させる）。
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());
  const page = await context.newPage();
  // SVGの初期描画や負荷のある実行環境でも、操作の待機を早く打ち切らない。
  page.setDefaultTimeout(15000*WAIT_SCALE);
  const problems = [];
  page.on('crash',()=>problems.push('ブラウザの描画プロセスがクラッシュしました'));
  page.on("pageerror", (e) => problems.push("pageerror: " + e.stack));
  page.on("console", (m) => {
    // フォントなど 外部リソースが オフラインで読めないのは無視する
    if (m.type() === "error" && !/Failed to load resource|ERR_|fonts\.g/.test(m.text())) problems.push("console.error: " + m.text()+" @"+JSON.stringify(m.location()));
  });
  const H = helpers(page, name);
  const t0 = Date.now();
  let timer;
  try {
    await Promise.race([fn(H), new Promise((_, ng) => (timer = setTimeout(() => ng(new Error(`時間切れ（${timeout / 1000}秒）`)), timeout*WAIT_SCALE)))]);
    expect(!problems.length, "ブラウザでエラー: " + [...new Set(problems)].join(" | "));
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name}（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
    console.log(e.stack);if(problems.length)console.log([...new Set(problems)]);
    console.log(await Promise.race([H.dbg('state').catch(e=>({diagnostic:e.message})),sleep(5000).then(()=>({diagnostic:'状態の応答がありません'}))]));
    try { await page.screenshot({ path: join(SHOT_DIR, `FAIL_${name}.png`), timeout:5000 }); } catch {}
  } finally {
    clearTimeout(timer);
    await context.close();
    await browser.close();
  }
}

function helpers(page, name) {
  const H = {
    page,
    wait: (ms) => page.waitForTimeout(ms),
    eval: (fn, arg) => page.evaluate(fn, arg),
    until: (fn, ms = 10000, arg) => page.waitForFunction(fn, arg, { timeout: ms*WAIT_SCALE, polling: 100 }),
    dbg: (method, ...args) => page.evaluate(([m, a]) => window.PokaDebug[m](...a), [method, args]),
    // 2本ゆびの ピンチ: (cx, cy) を まんなかに、ゆびの あいだを d0 → d1 に（canvas に タッチの PointerEvent を おくる。Chromium も WebKit も おなじ）
    async pinch(cx, cy, d0, d1, steps = 8) {
      await page.evaluate(async ([cx, cy, d0, d1, steps]) => {
        const cv = document.getElementById("screen"), ev = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: "touch", isPrimary: id === 71, clientX: x, clientY: y, bubbles: true, cancelable: true }));
        const at = (d) => [[71, cx - d / 2, cy], [72, cx + d / 2, cy]], frame = () => new Promise((r) => requestAnimationFrame(() => r()));
        for (const [id, x, y] of at(d0)) ev("pointerdown", id, x, y);
        for (let i = 1; i <= steps; i++) { for (const [id, x, y] of at(d0 + ((d1 - d0) * i) / steps)) ev("pointermove", id, x, y); await frame(); }
        for (const [id, x, y] of at(d1)) ev("pointerup", id, x, y);
      }, [cx, cy, d0, d1, steps]);
      await page.waitForTimeout(120);
    },
    async shot(label, {pause=true} = {}) {
      if (!SHOTS) return;
      // フォント/描画待ちでゲームの制限時間を消費しない。
      const previous = pause ? await H.dbg("pause", true) : null;
      try { await page.screenshot({ path: join(SHOT_DIR, `${name}_${label}.png`), animations: "disabled" }); }
      finally { if(pause) await H.dbg("pause", previous); }
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
      await H.until(() => G.sceneName === "house" && !Game.trans, 30000);
      await H.wait(700); await H.dialogs();
    },
    async newGameFast() {
      await H.open();
      await H.dbg("newGame", { goji: "soft" });
      await H.until(() => G.sceneName === "house" && !Game.trans, 30000);
      await H.wait(300);
    },
    async houseButton(label) {
      const btns = await page.$$(".house-bar .btn");
      for (const b of btns) if ((await b.textContent()).includes(label)) { await b.click(); await H.wait(250); return; }
      throw new Error(`おうちのボタン「${label}」がない`);
    },
    // お店を「正しい操作」で最後まで遊ぶ。ランクの配列を返す
    // すまほ: 左下の ボタンで ひらく（app が あれば その アプリを タップ）
    async phone(app) {
      await page.locator(".smaho-btn:not(.hidden)").waitFor({ timeout: 8000 });
      await page.locator(".smaho-btn").click(); await H.wait(260);
      if (app) { await page.locator(".smaho").getByRole("button", { name: app, exact: true }).click(); await H.wait(260); }
    },
    // もって いた ものが そのまま か（ディスクと いっしょに ふえる 音楽プレイヤー player_* は のぞく。ART-05）
    kept(before, after, k) {
      const f = (o) => (k === "furn" ? Object.fromEntries(Object.entries(o || {}).filter(([id]) => !id.startsWith("player_"))) : o);
      return JSON.stringify(f(before[k])) === JSON.stringify(f(after[k]));
    },
    async playShop(shop, lv, fromStore = false) {
      H.shopGrades = [];
      if (!fromStore) await H.dbg("shop", shop, lv);
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
        } else if(shop==='burger'){
          for(const label of st.order.want)await H.tapLabel(label);if(c===0)await H.shot('burger_prepared');await H.tapLabel('できあがり！');
        } else if(shop==='cake'){
          for(let step=0;step<4;step++){
            const m=await H.dbg('mg'),o=m.order;if(m.phase!=='work')break;
            if(o.step==='fruit'){await H.tapLabel(o.labels.fruit);await H.tapLabel(o.labels.count);}
            else await H.tapLabel(o.labels[o.step]);
            const now=await H.dbg('mg');if(c===0&&!now.buttons.some(b=>b.label==='つぎへ ▶'))await H.shot('cake_prepared');await H.tapLabel(now.buttons.some(b=>b.label==='つぎへ ▶')?'つぎへ ▶':'できあがり！');
          }
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
        } else if(shop==='groom'){
          await page.locator('#screen').evaluate(async canvas=>{
            const line=PokaDebug.mg().order.line,send=(type,q)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:91,pointerType:'touch',clientX:q.cx,clientY:q.cy}));
            send('pointerdown',line[0]);for(const q of line.slice(1)){send('pointermove',q);await new Promise(r=>requestAnimationFrame(r));}send('pointerup',line.at(-1));
          });
          expect((await H.dbg('mg')).order.trimmed.every(Boolean),'見本に沿って切れない');if(c===0)await H.shot('groom_trimmed');
          await H.tapLabel('カット おわり');await page.locator('#screen').evaluate(async canvas=>{
            const round=PokaDebug.mg().n,zones=PokaDebug.mg().order.zones,send=(type,q)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:91,pointerType:'touch',clientX:q.cx,clientY:q.cy}));
            for(let i=0;i<zones.length;i++){const q=zones[i],start=performance.now();send('pointerdown',q);
              while(PokaDebug.mg()?.order?.zones?.[i]?.dry!==1){if(PokaDebug.mg().n!==round||performance.now()-start>10000)throw Error('ドライヤーの操作が終わらない');await new Promise(r=>requestAnimationFrame(r));}send('pointerup',q);
            }
          });
          if(c===0)await H.shot('groom_dried');await H.tapLabel('リボンを えらぶ');await H.tapLabel(st.order.ribbon);
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
        } else if (shop === "gasstand") {
          // ちゅうもんの ノズル → ながおしで ちゅうもんの りょう（まんたんは カチッと とまる）→ よごれを こする →（Lv.3 から）ぺしゃんこの タイヤを ながおし
          if (st.order.choose) await H.tapLabel(st.order.fuelName);
          await page.locator("#screen").evaluate(async (canvas) => {
            const m = PokaDebug.mg(), b = m.buttons.find((x) => x.label === "ながおしで きゅうゆ"), a = m.order.amount, goal = a.hi >= 1 ? 1 : (a.lo + a.hi) / 2, t0 = performance.now();
            const send = (type) => canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 93, pointerType: "touch", clientX: b.cx, clientY: b.cy }));
            send("pointerdown");
            while ((PokaDebug.mg()?.order?.fill ?? 1) < goal - 0.004 && performance.now() - t0 < 9000) await new Promise((r) => requestAnimationFrame(r));
            send("pointerup");
          });
          if (c === 0) await H.shot("gasstand_fuel");
          await H.tapLabel("つぎへ ▶");
          await page.locator("#screen").evaluate(async (canvas) => {
            const send = (type, q) => canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 94, pointerType: "touch", clientX: q.cx, clientY: q.cy }));
            const n = PokaDebug.mg().order.spots.length, t0 = performance.now();
            for (let i = 0; i < n; i++) while ((PokaDebug.mg()?.order?.spots?.[i]?.dirt ?? 0) > 0 && performance.now() - t0 < 12000) {
              const q = PokaDebug.mg().order.spots[i]; send("pointerdown", q);
              for (let k = 0; k < 6; k++) { send("pointermove", { cx: q.cx + (k % 2 ? -12 : 12), cy: q.cy + ((k % 3) - 1) * 4 }); await new Promise((r) => requestAnimationFrame(r)); }
              send("pointerup", q);
            }
          });
          if (c === 0) await H.shot("gasstand_wash");
          if ((await H.dbg("mg")).order.tires.some((x) => x.flat)) {
            await H.tapLabel("つぎへ ▶");
            await page.locator("#screen").evaluate(async (canvas) => {
              for (const q of PokaDebug.mg().order.tires.filter((x) => x.flat)) {
                const i = PokaDebug.mg().order.tires.findIndex((x) => x.cx === q.cx), t0 = performance.now(), ev = { bubbles: true, pointerId: 95, pointerType: "touch", clientX: q.cx, clientY: q.cy };
                canvas.dispatchEvent(new PointerEvent("pointerdown", ev));
                while ((PokaDebug.mg()?.order?.tires?.[i]?.air ?? 1) < 1 && performance.now() - t0 < 5000) await new Promise((r) => requestAnimationFrame(r));
                canvas.dispatchEvent(new PointerEvent("pointerup", ev));
              }
            });
            if (c === 0) await H.shot("gasstand_tires");
          }
          await H.tapLabel("できあがり！");
        } else if (shop === "postoffice") {
          // けしいんを おす → あてさきの はこ（Lv.4 から てがみは しるしだけ）
          for (let k = 0; k < 10; k++) {
            const m = await H.dbg("mg"); if (!m || m.phase !== "work" || m.n !== st.n || !m.order.cur) break;
            const o = m.order; if (o.flying) { await H.wait(80); continue; }
            if (!o.cur.stamped) { await H.tapLabel("けしいんを おす"); if (c === 0 && k === 0) await H.shot("postoffice_stamp"); }
            await H.tapLabel(o.cur.name);
            await H.until((i) => { const q = PokaDebug.mg(); return !q || q.phase !== "work" || q.order.index !== i; }, 4000, o.index);
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
      H.shopResult = await H.eval(() => document.querySelector(".modal-wrap")?.textContent || "");
      await page.click(".modal-wrap .panel-foot .btn");
      await H.until(scene => PokaDebug.state().scene === scene && PokaDebug.idle(), 10000, fromStore ? (typeof fromStore === "string" ? fromStore : "store") : "world");
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

if(!LIST) console.log(`ネリカスタウン スモークテスト ${FULL ? "（full）" : ""}`);

await scenario("現代的BGM・全曲の音声合成",async H=>{
  await H.newGameFast();await H.page.mouse.click(5,5);
  const catalog=await H.dbg("musicCatalog");
  expect(catalog.length>=30&&catalog.every(s=>s.modern),"未更新のBGMがある");
  const rendered=[];
  for(const song of catalog){
    const audio=await H.dbg("musicRender",song.id,6);
    expect(audio.finite&&audio.peak>.005&&audio.peak<.95&&audio.rms>.001,`${song.id}: 無音・クリップ・非数値 ${JSON.stringify(audio)}`);
    expect(audio.peakVoices<60,`${song.id}: 同時発音が多すぎる ${audio.peakVoices}`);
    rendered.push(audio);
  }
  console.log(`    audio: ${rendered.length} tracks; peak ${Math.max(...rendered.map(s=>s.peak)).toFixed(3)}; max voices ${Math.max(...rendered.map(s=>s.peakVoices))}`);
  for(const name of ['town','shop_clothes','heiwadai','house','battle_water','battle_elite','battle_crown']){
    await H.dbg("music",name);await H.wait(180);
    const current=await H.dbg("music");expect(current.name===name&&current.modern&&current.voices<60,"曲の切替に失敗");
  }
  const saved=await H.dbg("saveData");
  await H.dbg("seedSave",{...saved,settings:{...saved.settings,bgm:false}});
  await H.dbg("music","town");expect((await H.dbg("music")).gain===0,"BGMオフが効かない");
  await H.dbg("seedSave",saved);await H.dbg("music","town");expect((await H.dbg("music")).gain>0,"BGMオンに戻せない");
  await H.dbg("music","victory");expect((await H.dbg("music")).jingles===1,"結果曲が鳴らない");
  await H.dbg("music",null);await H.wait(200);const stopped=await H.dbg("music");expect(!stopped.name&&!stopped.pending&&stopped.voices===0&&stopped.jingles===0,"停止後も音が予約される");
  expect((await H.dbg("saveData")).coins===saved.coins,"音楽更新でおかねが変わった");
},{timeout:180000});

await scenario("起動とタイトル", async (H) => {
  await H.open();
  const ver = await H.eval(() => document.querySelector(".title-ui .ver").textContent);
  const gv = await H.eval(() => GAME_VERSION);
  expect(ver.includes(gv), `タイトルにバージョン ${gv} が出ていない`);
  expect((await H.eval(() => PokaDebug.help())) > 5, "PokaDebug.help() が動かない");
  await H.shot("title");
});

for(const viewport of [{width:390,height:844},{width:375,height:667}]) await scenario(`BGM試聴室・${viewport.width}`,async H=>{
  await H.newGameFast();await H.dbg('coins',76543);await H.dbg('save');
  const coins=(await H.dbg('saveData')).coins;
  await H.page.goto(url+"tools/music-preview.html");
  const town=H.page.locator('[data-track="town"]');await town.waitFor();await town.click();
  const stored=await H.eval(()=>JSON.stringify(document.getElementById('game').contentWindow.PokaDebug.persistedSave()));
  expect(JSON.parse(stored).coins===coins,'試聴の開始でおかねが変わった');
  await H.until(()=>document.getElementById('game').contentWindow.PokaDebug.music().name==='town');
  expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"試聴ページが横にはみ出す");
  if(SHOTS)await H.page.screenshot({path:join(SHOT_DIR,`music-preview-${viewport.width}.png`)});
  await H.page.locator('[data-track="victory"]').click();
  expect(await H.eval(()=>document.getElementById('game').contentWindow.PokaDebug.music().jingles===1),"結果曲を試聴できない");
  await H.page.getByRole('button',{name:'停止',exact:true}).click();
  expect(await H.eval(()=>document.getElementById('game').contentWindow.PokaDebug.music().jingles===0),"結果曲を停止できない");
  if(viewport.width===390)await H.wait(21000); // 本編の自動保存周期を超えても保存に触れない。
  expect(await H.eval(()=>JSON.stringify(document.getElementById('game').contentWindow.PokaDebug.persistedSave()))===stored,'試聴中に保存データを書き換えた');
  await H.open();
  expect(JSON.stringify(await H.dbg('persistedSave'))===stored,'試聴を閉じたときに保存データを書き換えた');
},{viewport,full:true});

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
  const door=(await H.dbg("townLayout","town")).doors.find(d=>d.id==="crepe");
  expect(await H.dbg("walkTo", door.x, door.y), "クレープやさんへの道が見つからない");
  await H.until(() => PokaDebug.state().scene === "store" && PokaDebug.idle(), 12000);
  await H.page.getByRole("button",{name:"おみせを でる",exact:true}).click();
  await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle(), 8000);
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

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('cake-shop-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const before=await H.dbg('saveData');
  const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.id==='cake');expect(door,'町にケーキ屋がない');
  await H.dbg('teleport','town',door.x,door.y+1);await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);
  await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),20000);expect((await H.dbg('storeState')).party.length===3,'3人で入れない');await H.shot('interior');
  await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle());
  const ranks=await H.playShop('cake',3);expect(ranks.length===6&&ranks.every(r=>r===3),'ケーキの正解で◎にならない: '+JSON.stringify(H.shopGrades));
  const after=await H.dbg('saveData');expect(after.coins>before.coins&&after.shops.cake.plays===1,'報酬・お店の記録が残らない');
  for(const k of ['bag','wardrobe','furn','rooms'])expect(H.kept(before,after,k),'ケーキ屋で既存の所持品が変わる');
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('groom-shop-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const before=await H.dbg('saveData');
  const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.shop==='groom');expect(door,'びようしつの入口がない');
  await H.dbg('teleport','town',door.x,door.y+1);await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle());
  expect((await H.dbg('storeState')).party.length===3,'3人で入れない');await H.shot('interior');await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle());
  const ranks=await H.playShop('groom',3);expect(ranks.length===6&&ranks.every(r=>r===3),'正しいカットで◎にならない: '+JSON.stringify(H.shopGrades));
  const after=await H.dbg('saveData');expect(after.coins>before.coins&&after.shops.groom.plays===1,'美容室の報酬・記録が残らない');for(const k of ['bag','wardrobe','furn','rooms'])expect(H.kept(before,after,k),'美容室で所持品が変わる');
},{viewport,full:viewport.width===375,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('burger-shop-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);{const s=await H.dbg('saveData');s.shops.burger.lv=3;await H.dbg('seedSave',s);}const before=await H.dbg('saveData');
  // バーガーの おてつだいは ファミレス びっくぽ（ネリカスタウン）の キッチンの カウンター。おわると 店の 中へ もどる（おみせ Lv.3 = おきゃくさん 6人）
  const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.venue==='bikkupo');expect(door,'びっくぽの入口がない');
  await H.dbg('teleport','town',door.x,door.y+1);await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle());
  expect((await H.dbg('venueState')).party.length===3,'3人で入れない');await H.shot('interior');
  await H.dbg('venueVisit','キッチンの カウンター');await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
  const ranks=await H.playShop('burger',3,'venue');expect(ranks.length===6&&ranks.every(r=>r===3),'正しい順番で◎にならない: '+JSON.stringify(H.shopGrades));
  const back=await H.dbg('venueState');expect(back.id==='bikkupo'&&back.party[0].x===18&&back.party[0].y===4,'おてつだいの あと キッチンの まえに もどらない '+JSON.stringify(back.party[0]));
  const after=await H.dbg('saveData');expect(after.coins>before.coins&&after.shops.burger.plays===1,'バーガー屋の報酬・記録が残らない');for(const k of ['bag','wardrobe','furn','rooms'])expect(H.kept(before,after,k),'バーガー屋で所持品が変わる');
},{viewport,full:viewport.width===375,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('daily-stamps-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const saved=await H.dbg('saveData');saved.daily={last:'',stamps:0,total:0,cycles:0};await H.dbg('seedSave',saved);
  const before=await H.dbg('saveData');for(const date of ['2030-12-29','2030-12-30','2030-12-31','2031-1-1','2031-1-2','2031-1-3','2031-1-4'])await H.dbg('dailyVisit',date);
  const earned=await H.dbg('saveData');expect(earned.coins===987804&&earned.bag.pudding===(before.bag.pudding||0)+1,'7日のごほうびが不正');expect(!await H.dbg('dailyVisit','2030-12-31')&&!await H.dbg('dailyVisit','2031-1-4'),'日付を戻して重複取得できる');
  await H.page.keyboard.press('Escape');await H.page.getByRole('button',{name:'スタンプラリー',exact:true}).click();await H.page.getByRole('button',{name:'まいにち スタンプ',exact:true}).click();expect(await H.page.locator('.daily-stamp.stamped').count()===7,'7個のスタンプが出ない');await H.shot('seven-days');expect(!await H.eval(()=>document.documentElement.scrollWidth>innerWidth),'スタンプがはみ出す');
  // まいにち スタンプは すまほの 中（まどは 1まい）
  await H.page.locator('.modal-wrap:not(.out)').last().getByRole('button',{name:'とじる',exact:true}).click();await H.idle();
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();const after=await H.dbg('saveData');expect(after.coins===987804&&after.daily.total===7,'再開で報酬/スタンプが変わる');for(const k of ['wardrobe','furn','room'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'毎日スタンプで所持品が変わる');
  const featured=(await H.dbg('dailyState')).featured;await H.dbg('shop',featured,1);await H.until(()=>PokaDebug.state().scene==='shop'&&!PokaDebug.state().transitioning);await H.dialogs();await H.until(()=>PokaDebug.mg()?.phase==='work');const ds=await H.dbg('dailyState');expect((await H.dbg('mg')).dailyBoost===ds.mul&&ds.mul>=1.2&&ds.mul<=2,'おすすめの倍率が適用されない '+ds.mul);await H.shot('featured-shop');
},{viewport,full:viewport.width===375,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('shop-level-decor-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const before=await H.dbg('saveData');
  const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.shop==='crepe');
  for(const lv of [1,3,5]){
    const data=JSON.parse(JSON.stringify(before));data.shops.crepe.lv=lv;await H.dbg('seedSave',data);
    await H.dbg('teleport','town',door.x,door.y+1);await H.idle(30000);await H.wait(3300);await H.shot('outside-lv'+lv);
    expect((await H.dbg('shopDecor','crepe')).tier===lv,'外観のレベルが反映されない');
    await H.dbg('store','crepe','town');await H.idle();await H.wait(3300);await H.shot('store-lv'+lv);
    await H.dbg('shop','crepe',lv);await H.until(()=>PokaDebug.state().scene==='shop'&&!PokaDebug.state().transitioning);await H.dialogs();await H.until(()=>PokaDebug.mg()?.phase==='work');
    expect((await H.dbg('mg')).decorTier===lv,'おてつだいの飾りがレベルに対応しない');await H.shot('work-lv'+lv);
    await H.page.getByRole('button',{name:'おてつだいを やめる',exact:true}).click();await H.page.getByRole('button',{name:'ここで やめる',exact:true}).click();await H.page.getByRole('button',{name:'まちに もどる',exact:true}).click();await H.idle();
  }
  const data=await H.dbg('saveData');data.shops.burger.lv=5;await H.dbg('seedSave',data);const hd=(await H.dbg('townLayout','heiwadai')).doors.find(d=>d.act.shop==='burger');await H.dbg('teleport','heiwadai',hd.x,hd.y+1);await H.idle(30000);await H.wait(300);await H.shot('heiwadai-lv5');
  const keys=(await H.dbg('shopDecor','crepe')).keys;expect(keys.some(k=>k.startsWith('shop-decor:5:')),'平和台の原画に飾りを重ねられない');
  const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn','rooms'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'店の飾りで所持品が変わる: '+k);
},{viewport,full:viewport.width===375,timeout:180000});

for (const shop of ["dentist", "bakery", "florist"]) {
  await scenario(`${shop}（Lv3・正しく操作すれば ◎）`, async (H) => {
    await H.newGameFast();
    const ranks = await H.playShop(shop, 3);
    expect(ranks.length >= 6 && ranks.every((r) => r === 3), `◎にならない客がいる: ${ranks}; ${JSON.stringify(H.shopGrades)}`);
  }, { full: true, timeout: 150000 });
}

for (const shop of ["relay"]) for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) await scenario(`新ミニゲーム ${shop}（${viewport.width}）`, async (H) => {
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
      {
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

for (const viewport of [{width:390,height:844},{width:375,height:667}]) await scenario(`隠し管理者コマンド（${viewport.width}）`, async H => {
  await H.newGameFast();await H.dbg("level",1);
  const fixture=await H.dbg("saveData"),fullHealth=Object.fromEntries(Object.entries(fixture.chars).map(([id,c])=>[id,{hp:c.hp,sp:c.sp}]));
  fixture.parents.auto=false;
  for(const c of Object.values(fixture.chars)){c.hp=1;c.sp=0;c.hunger=12;c.mood=14;}
  await H.dbg("seedSave",fixture);await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle(30000);
  const preserved=d=>JSON.stringify({bag:d.bag,wardrobe:d.wardrobe,furn:d.furn,room:d.room,rooms:d.rooms,flags:d.flags,events:d.events,stats:d.stats,order:d.order,settings:d.settings,chars:Object.fromEntries(Object.entries(d.chars).map(([id,c])=>[id,{lv:c.lv,exp:c.exp,boost:c.boost,outfit:c.outfit,name:c.name,color:c.color}]))});
  const openSettings=async()=>{await H.page.getByRole("button",{name:"メニュー",exact:true}).click();await H.page.getByRole("button",{name:"せってい",exact:true}).click();};
  const tapVersion=async n=>{await H.page.getByRole("button",{name:/ネリカスタウン ver/}).click({clickCount:n,delay:50});};
  const entry=H.page.getByRole("button",{name:"かんりしゃ コマンド",exact:true});
  await openSettings();expect(await entry.count()===0,"通常の設定に管理者コマンドが出ている");
  await H.page.locator(".menu-version").scrollIntoViewIfNeeded();await H.shot("locked");
  await tapVersion(6);expect(await entry.count()===0,"6回で隠しコマンドが開いた");
  await H.wait(1650);await tapVersion(1);expect(await entry.count()===0,"間を空けた操作が連続タップに数えられた");
  await H.wait(1650);await tapVersion(7);expect(await entry.count()===1,"7回で入口が出ない");
  await tapVersion(2);expect(await entry.count()===1,"入口が重複する");await H.shot("unlocked");
  await entry.tap();const admin=H.page.locator(".admin-commands"),money=admin.getByRole("button",{name:"おかねを 99,999にする",exact:true});
  // 拡大表示のアニメーションが終わってから実寸を測る。
  await admin.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished)));
  for(const b of await admin.getByRole("button").all()){const box=await b.boundingBox();expect(box.height>=44&&box.x>=0&&box.x+box.width<=viewport.width,"管理者ボタンが小さい/画面外: "+JSON.stringify(box));}
  await H.shot("commands");let before=await H.dbg("saveData");
  await money.tap();expect(await money.isDisabled(),"確認中にコマンドが連打できる");await H.choose(1);
  expect((await H.dbg("state")).coins===before.coins&&preserved(await H.dbg("saveData"))===preserved(before),"キャンセルでデータが変わった");
  await money.tap();await H.choose(0);
  expect((await H.dbg("state")).coins===99999&&(await H.dbg("persistedSave")).coins===99999,"所持金が99999にならない/即時保存されない");
  expect(preserved(await H.dbg("saveData"))===preserved(before),"所持金設定で進行・所持品・配置・獲得コイン統計が変わった");
  expect((await H.page.locator(".hud .coins").textContent()).includes("99,999"),"HUDのコインが更新されない");
  await H.dbg("coins",100001);before=await H.dbg("saveData");await money.tap();
  expect((await H.page.locator(".dlg-text").last().textContent()).includes("200,000 → 99,999"),"減額になる場合の確認がない");
  await H.choose(0);expect((await H.dbg("state")).coins===99999&&preserved(await H.dbg("saveData"))===preserved(before),"99999への設定が加算になった/ほかのデータを変えた");
  await admin.getByRole("button",{name:"3にんの HP・SPを ぜんかいふく",exact:true}).tap();await H.choose(0);
  let saved=await H.dbg("persistedSave");
  expect(Object.entries(fullHealth).every(([id,c])=>saved.chars[id].hp===c.hp&&saved.chars[id].sp===c.sp),"3人のHP/SPが回復・保存されない");
  await admin.getByRole("button",{name:"おなか・ごきげんを 100にする",exact:true}).tap();await H.choose(0);saved=await H.dbg("persistedSave");
  // 自動セーブの20秒周期をまたぐと実時間ぶんわずかに減るため、その自然減少だけ許容する。
  expect(Object.values(saved.chars).every(c=>c.hunger>=99.9&&c.hunger<=100&&c.mood>=99.9&&c.mood<=100)&&saved.coins===99999&&preserved(saved)===preserved(before),"おなか/ごきげんの設定が不正/ほかのデータが変わった: "+JSON.stringify({needs:Object.fromEntries(Object.entries(saved.chars).map(([id,c])=>[id,[c.hunger,c.mood]])),coins:saved.coins,otherDataPreserved:preserved(saved)===preserved(before)}));
  await H.shot("saved");await admin.getByRole("button",{name:"もどる",exact:true}).click();await H.wait(220);
  await H.page.getByRole("button",{name:"あそびかた",exact:true}).click();await H.page.getByRole("button",{name:"せってい",exact:true}).click();
  expect(await entry.count()===0,"タブ切替で解除状態が残る");await tapVersion(7);
  await H.page.locator(".modal-wrap:not(.out) .close").click();await H.wait(220);await openSettings();expect(await entry.count()===0,"メニューを閉じてもコマンドが隠れない");
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();await openSettings();
  expect(await entry.count()===0&&(await H.dbg("state")).coins===99999&&preserved(await H.dbg("saveData"))===preserved(before),"再開で解除状態/所持金/既存データが不正");
},{viewport,full:viewport.width===375,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('smaho-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.page.mouse.click(5,5);
  // おうち: 左下に すまほ（下の ボタンと かさならない）
  let s=await H.dbg("smahoState");
  const barTop=await H.eval(()=>document.querySelector(".house-bar").getBoundingClientRect().top);
  expect(s.button&&s.button.h>=44&&s.button.y+s.button.h<=barTop&&s.button.x>=0,"おうちの すまほ ボタンが 不正 "+JSON.stringify([s,barTop]));
  // ≡ は せってい と あそびかた だけ
  await H.page.getByRole("button",{name:"メニュー",exact:true}).click();await H.wait(300);
  const tabs=await H.eval(()=>[...document.querySelectorAll(".menu-tabs .tab")].map(b=>b.textContent));
  expect(tabs.join()==="せってい,あそびかた","≡ に ゲームの タブが のこって いる "+tabs);
  const wrapped=await H.eval(()=>[...document.querySelectorAll(".menu-tabs .tab")].filter(b=>{const r=document.createRange();r.selectNodeContents(b);return new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size>1;}).map(b=>b.textContent));
  expect(!wrapped.length,"≡ の タブの 字が 2ぎょうに なる "+wrapped);
  await H.page.getByRole("button",{name:"あそびかた",exact:true}).click();await H.wait(200);
  expect(await H.page.locator(".help-row").count()>=5,"あそびかたが ない");
  await H.shot("menu-help");
  await H.page.locator(".modal-wrap:not(.out) .close").click();await H.wait(300);
  // すまほ: ホーム画面（時計・アプリ 12こ・44px いじょう・はみ出さない）
  await H.phone();await H.shot("home");
  s=await H.dbg("smahoState");
  const home=await H.eval(()=>{const ph=document.querySelector(".smaho").getBoundingClientRect(),apps=[...document.querySelectorAll(".smaho-app")].map(b=>b.getBoundingClientRect());return {ph:[ph.left,ph.top,ph.right,ph.bottom],w:innerWidth,h:innerHeight,apps:apps.length,small:apps.filter(r=>r.width<44||r.height<44).length,clock:document.querySelector(".smaho-clock")?.textContent||"",date:document.querySelector(".smaho-date")?.textContent||""};});
  expect(s.open&&home.apps===12&&home.small===0&&/^\d\d:\d\d$/.test(home.clock),"すまほの ホームが 不正 "+JSON.stringify(home));
  expect(/^\d+がつ \d+にち（(にち|げつ|か|すい|もく|きん|ど)ようび）$/.test(home.date),"すまほの 日づけが 不正 "+home.date);
  expect(home.ph[0]>=0&&home.ph[1]>=0&&home.ph[2]<=home.w+0.5&&home.ph[3]<=home.h+0.5,"すまほが 画面から はみ出す "+JSON.stringify(home));
  // アプリを ひとつずつ（もどる で ホーム）
  const checks={"いらい":".neri-quests","ようす":".chara-card","もちもの":".card, .note","ずかん":".dex-kinds","イベント":".annual-hero","スタンプラリー":".festival-target","ひんと":".smaho-hint","うらない":".smaho-draw","ごほうび":"select","おんがく":".smaho-disc","しゃしん":".puri-album, .note","ちず":".area-map .amap-svg"};
  for(const [app,sel] of Object.entries(checks)){
    await H.page.locator(".smaho").getByRole("button",{name:app,exact:true}).click();await H.wait(300);
    expect(await H.page.locator(".smaho-body").locator(sel).count()>0,app+" の 中みが ない");
    expect(!(await H.eval(()=>{const b=document.querySelector(".smaho-body");return b.scrollWidth>b.clientWidth+2;})),app+" が よこに はみ出す");
    const shot={"ようす":"status","もちもの":"bag","イベント":"event","スタンプラリー":"rally","ひんと":"hint","ちず":"map"}[app];
    if(shot)await H.shot(shot);
    await H.page.getByRole("button",{name:"もどる",exact:true}).click();await H.wait(250);
  }
  // うらない: 1にち 1かい・おなじ 日は おなじ けっか
  await H.page.locator(".smaho").getByRole("button",{name:"うらない",exact:true}).click();await H.wait(250);
  await H.page.locator(".smaho-draw").click();await H.wait(1300);
  const f=await H.dbg("fortune");
  expect(await H.page.locator(".smaho-omikuji.show .luck").textContent()===f.luck,"うらないの けっかが 出ない");
  await H.shot("fortune");
  expect(JSON.stringify(await H.dbg("fortune","2026-1-5"))===JSON.stringify(await H.dbg("fortune","2026-1-5")),"おなじ 日で けっかが かわる");
  await H.page.getByRole("button",{name:"もどる",exact:true}).click();await H.wait(250);
  await H.page.locator(".smaho").getByRole("button",{name:"うらない",exact:true}).click();await H.wait(250);
  expect(await H.page.locator(".smaho-draw").count()===0&&await H.page.locator(".smaho-omikuji.show").count()===1,"2かい うらなえる");
  // Esc で とじる → 町で ひらく（おまつり ボタンは ない）
  await H.page.keyboard.press("Escape");await H.wait(300);expect(!(await H.dbg("smahoState")).open,"Esc で とじない");
  await H.dbg("teleport","town",20,60);await H.idle();await H.wait(400);
  s=await H.dbg("smahoState");
  expect(s.button&&s.button.x<=12&&s.button.y+s.button.h<=viewport.height-50,"町の すまほ ボタンが 左下に ない "+JSON.stringify(s));
  expect(await H.page.locator(".world-festival").count()===0,"おまつり ボタンが のこって いる");
  await H.shot("town");
  await H.page.keyboard.press("Escape");await H.wait(300);expect((await H.dbg("smahoState")).open,"Esc で すまほが ひらかない");
  await H.page.locator(".smaho").getByRole("button",{name:"ちず",exact:true}).click();await H.wait(300);
  await H.page.getByRole("button",{name:"おうちへ かえる",exact:true}).click();await H.choose(0);
  await H.until(()=>G.sceneName==="house"&&PokaDebug.idle(),15000);
  expect(!(await H.dbg("smahoState")).open,"おうちへ かえったのに すまほが ひらいた まま");
  await H.dbg("hour",null);
},{viewport,timeout:120000});

await scenario("難易度の設定と保存", async (H) => {
  await H.newGameFast();
  await H.page.getByRole("button", { name: "メニュー", exact: true }).click();
  await H.page.getByRole("button", { name: "せってい", exact: true }).click();
  await H.page.getByRole("button", { name: /むずかしい ／ コイン/ }).click();
  await H.dbg("save"); await H.page.reload();
  await H.until(() => PokaDebug.state().scene === "title" && PokaDebug.idle());
  await H.page.locator(".title-ui .btn").first().click();
  await H.idle(); await H.dbg("shop", "relay", 1);
  await H.until(() => PokaDebug.state().scene === "shop" && !PokaDebug.state().transitioning); await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  const st = await H.dbg("mg");
  expect(st.difficulty === "hard" && Math.abs(st.timeLimit - 33.6) < .001, "保存した難易度が新ミニゲームに反映されない");
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
  await H.dbg("teleport", "town", 48, 3, "up"); // 大通りの 北の はし → 平和台
  await H.until(() => PokaDebug.idle()); await H.dbg("walkTo", 48, 0);
  await H.until(() => PokaDebug.state().map === "heiwadai" && PokaDebug.idle());
  await H.shot("heiwadai");
  await H.phone("ちず");
  expect(await H.page.getByRole("img", { name: "平和台（へいわだい）の詳細地図", exact:true }).isVisible(), "ちずが この エリアから ひらかない");
  await H.page.getByRole("tab", { name: "せかい ちず", exact:true }).click();
  expect(await H.page.getByRole("group", { name: "ぽかぽかの せかいの ちず", exact:true }).isVisible(), "全体マップがない");
  expect(await H.page.locator('.atlas-marker.is-current').getAttribute('data-area') === "heiwadai", "入ったエリアが地図の現在地に反映されない");
  await H.shot("atlas"); await H.page.locator(".modal-wrap .close").last().click(); await H.wait(300);
  await H.dbg("teleport", "heiwadai", 25, 66); await H.until(() => PokaDebug.idle());
  await H.dbg("walkTo", 25, 67); await H.until(() => PokaDebug.state().map === "coast" && PokaDebug.idle());
  await H.shot("coast");
  await H.dbg("level", 24); await H.dbg("battle", [{ kind:"crab",lv:16 }], "coast");
  await H.page.getByRole("button", { name:"とくぎ",exact:true }).waitFor(); await H.shot("new-enemy");
  expect(await H.page.getByRole("button", { name:"おうちへ",exact:true }).count() === 0, "戦闘中に帰宅ボタンがある");
  await H.dbg("give", "smoke", 1);
  await H.page.getByRole("button", { name:"どうぐ",exact:true }).click();
  await H.page.getByRole("button", { name:/にげだまくん/ }).click();
  await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle());
  expect((await H.dbg("state")).map === "coast", "逃走後に元のフィールドへ戻らない");
  const coins=(await H.dbg("state")).coins;
  await H.dbg("shop","crepe",1); await H.until(()=>PokaDebug.state().scene==="shop"&&!PokaDebug.state().transitioning); await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  await H.page.getByRole("button", { name:"おてつだいを やめる",exact:true }).click();
  await H.page.getByRole("button", { name:"ここで やめる",exact:true }).click();
  await H.page.getByRole("button", { name:"まちに もどる",exact:true }).click();
  await H.until(() => PokaDebug.state().scene === "world" && PokaDebug.idle());
  await H.wait(2000); expect((await H.dbg("state")).coins===coins,"途中退出で報酬が発生");
}, {full:true});

for (const viewport of [{width:390,height:844},{width:375,height:667}]) await scenario(`属性技と状態異常・${viewport.width}`, async H => {
  await H.newGameFast(); await H.dbg("level",18); await H.dbg("coins",123456);
  await H.dbg("teleport","cave",12,29); await H.idle();
  const before=await H.dbg("saveData");
  await H.dbg("battle",[{kind:"iwagoro",lv:22}],"cave");
  await H.page.getByRole("button",{name:"とくぎ",exact:true}).waitFor();
  const st=await H.dbg("battleState");
  expect(st.active==="gachan"&&st.music==="battle_elite","味方の行動または強敵BGMが不正");
  expect(st.allies.length===3&&st.foes[0].elements[0]==="rock","属性または3人編成がない");
  expect(await H.page.getByRole("button",{name:"おうちへ",exact:true}).count()===0,"戦闘中の帰宅ボタンがある");
  await H.dbg("house"); await H.wait(100);
  expect((await H.dbg("state")).scene==="battle","戦闘から帰宅できてしまう");
  await H.shot("commands");
  await H.page.getByRole("button",{name:"ぞくせい・じょうたい",exact:true}).click();
  expect(await H.page.getByText("ひ → くさ → いわ → かみなり → みず → ひ",{exact:true}).isVisible(),"相性の説明がない");
  await H.shot("help"); await H.page.locator(".modal-wrap:not(.out) .close").click(); await H.wait(300);
  await H.page.getByRole("button",{name:"とくぎ",exact:true}).click();
  expect(await H.page.locator('.battle-ui [data-skill^="grass_"]').count()===5,"草の5技がない");
  await H.page.locator('[data-skill="grass_leaf"]').scrollIntoViewIfNeeded(); await H.shot("skills");
  await H.page.locator('[data-skill="grass_bloom"]').click();
  await H.until(()=>PokaDebug.battleState()?.foes[0].condition?.element==="grass");
  expect((await H.dbg("battleState")).foes[0].hp<st.foes[0].hp,"属性技でダメージがない");
  await H.page.getByRole("button",{name:"とくぎ",exact:true}).waitFor();
  await H.dbg("battleFixture",{condition:"fire"}); await H.wait(100); await H.shot("condition");
  const active=(await H.dbg("battleState")).active;
  await H.page.getByRole("button",{name:"ぼうぎょ",exact:true}).click();
  await H.until(id=>PokaDebug.battleState()?.allies.find(a=>a.id===id)?.condition===null,10000,active);
  await H.page.getByRole("button",{name:"とくぎ",exact:true}).waitFor();
  const bounds=await H.dbg("battleLayout");expect(bounds.cardBottom<=bounds.menuTop&&bounds.enemyTop>=0,"HPや敵が画面に収まらない");
  await H.dbg("give","smoke",1);await H.page.getByRole("button",{name:"どうぐ",exact:true}).click();
  await H.page.getByRole("button",{name:/にげだまくん/}).click();
  await H.until(()=>PokaDebug.state().scene==="world"&&PokaDebug.idle());
  const after=await H.dbg("saveData");
  expect(after.coins===before.coins&&after.stats.wins===before.stats.wins,"逃走で所持金または勝利数を変更した");
  expect(after.world.map===before.world.map,"逃走先が違う");
  expect(!Object.values(after.chars).some(c=>c.condition),"一時的な状態異常を保存した");
  await H.dbg("save");await H.page.reload();await H.page.locator(".title-ui .btn").first().click();await H.idle();
  expect((await H.dbg("saveData")).coins===before.coins,"再開時におかねが消えた");
},{viewport,full:viewport.width===375});

await scenario("戦闘の敗北だけ帰宅",async H=>{
  await H.newGameFast();await H.dbg("level",24);await H.dbg("coins",87654);
  const before=await H.dbg("saveData");
  await H.dbg("battle",[{kind:"king",lv:18}],"cave",true);
  await H.page.getByRole("button",{name:"とくぎ",exact:true}).waitFor();
  expect((await H.dbg("battleState")).music==="battle_crown","ボス専用BGMがない");
  await H.dbg("battleFixture",{hp:1,condition:"fire"});
  for(let i=0;i<10;i++){
    const guard=H.page.getByRole("button",{name:/^ぼうぎょ/});
    if(await guard.count())await guard.click();
    await H.wait(1000);
    if((await H.dbg("state")).scene==="house")break;
  }
  await H.until(()=>PokaDebug.state().scene==="house"&&PokaDebug.idle(),20000);
  const after=await H.dbg("saveData");
  expect(after.coins===before.coins&&after.stats.wins===before.stats.wins,"敗北でおかねまたは勝利報酬が変わった");
  expect(Object.values(after.chars).every(c=>c.hp>0),"3人を回復して帰宅していない");
  await H.shot("recovered");
});

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

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('save-backup-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('level',20);await H.dbg('coins',987504);let fixture=await H.dbg('saveData');fixture.rooms.expanded.main=true;fixture.bag.apple=23;fixture.furn.plant=3;fixture.order=['goji','wanko','gachan'];await H.dbg('seedSave',fixture);
  const settings=async()=>{await H.page.getByRole('button',{name:'メニュー',exact:true}).click();await H.page.getByRole('button',{name:'せってい',exact:true}).click();};
  await settings();await H.page.getByRole('button',{name:'セーブを かきだす',exact:true}).click();const text=await H.page.getByLabel('かきだした セーブ',{exact:true}).inputValue();expect(JSON.parse(text).data.coins===987654,'所持金を正確に書き出せない');await H.shot('export');
  const download=H.page.waitForEvent('download');await H.page.getByRole('button',{name:'ファイルに ほぞん',exact:true}).click();const file=await download;expect(file.suggestedFilename().endsWith('.txt'),'ファイルを書き出せない');expect(readFileSync(await file.path(),'utf8')===text,'ダウンロード内容が違う');
  await H.page.locator('.modal-wrap:not(.out) .close').last().click();await H.wait(200);await H.page.locator('.modal-wrap:not(.out) .close').last().click();await H.wait(200);
  await H.dbg('newGame');await H.idle();expect((await H.dbg('state')).coins===150,'はじめからにならない');
  await settings();await H.page.getByRole('button',{name:'セーブを よみこむ',exact:true}).click();const area=H.page.getByLabel('セーブの もじ',{exact:true}),review=H.page.getByRole('button',{name:'なかみを たしかめる',exact:true});
  await area.fill('{"game":"other","format":1,"data":{}}');await review.click();await H.until(()=>document.querySelector('.save-backup [role=alert]')?.textContent.includes('ネリカスタウン'));expect((await H.dbg('state')).coins===150,'不正な読み込みで現在のデータが変わる');await H.shot('invalid');
  await area.fill(text);await review.click();await H.choose(1);expect((await H.dbg('state')).coins===150,'キャンセルで上書きされた');
  await H.page.getByLabel('セーブの ファイル',{exact:true}).setInputFiles({name:'backup.txt',mimeType:'text/plain',buffer:Buffer.from(text)});await H.until(()=>document.querySelector('.save-backup-text').value.includes('987654'));await review.click();await H.shot('confirm');await H.choose(0);
  await H.until(()=>window.PokaDebug?.state().scene==='title'&&PokaDebug.idle(),20000);await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();const restored=await H.dbg('saveData');
  for(const k of ['coins','wardrobe','room','rooms','bag','furn','order'])expect(JSON.stringify(restored[k])===JSON.stringify(fixture[k]),'復元後の値が違う: '+k);
  expect(restored.chars.wanko.lv===20&&restored.chars.gachan.lv===20&&restored.chars.goji.lv===20,'レベルが戻らない');await H.shot('restored');
  if(viewport.width===390){const ctx=await H.page.context().browser().newContext({viewport,locale:'ja-JP'});try{await ctx.route(new RegExp("^https://fonts[.]"),r=>r.abort());const other=await ctx.newPage();await other.goto(url);await other.waitForFunction(()=>window.PokaDebug&&PokaDebug.idle());const imported=await other.evaluate(text=>PokaDebug.backupDecode(text),text);expect(imported.coins===987654&&JSON.stringify(imported.room)===JSON.stringify(fixture.room),'別ブラウザで文字列を読めない');}finally{await ctx.close();}}
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('save-v1-compat-'+viewport.width,async H=>{
  const old=JSON.parse(readFileSync(new URL('./fixtures/save-v1.json',import.meta.url),'utf8'));
  await H.open();await H.dbg('seedLegacySave',old);expect((await H.dbg('persistedSave')).gameVersion==='1.0.0','旧形式をそのまま置けない');await H.page.reload();
  await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);await H.shot('continued');
  const data=await H.dbg('saveData');expect(data.coins===987654,'ver1のおかねが変わる');
  for(const k of ['bag','wardrobe','furn','order','stats','dex'])expect(JSON.stringify(data[k])===JSON.stringify(old[k]),'ver1の持ち物・進行が変わる: '+k);
  for(const id of old.order)for(const k of ['name','lv','exp','outfit','boost','color'])expect(JSON.stringify(data.chars[id][k])===JSON.stringify(old.chars[id][k]),'ver1のキャラが変わる: '+id+'.'+k);
  for(const [id,rec]of Object.entries(old.shops))expect(JSON.stringify(data.shops[id])===JSON.stringify(rec),'旧お店の記録が変わる');
  expect(data.flags.boss&&JSON.stringify(data.flags.chests)===JSON.stringify(old.flags.chests),'宝箱・ボスの記録が変わる');
  for(const it of old.room.items){const kept=data.room.items.find(x=>x.uid===it.uid);expect(kept&&['id','x','y','flip'].every(k=>kept[k]===it[k]),'部屋の配置が変わる');}
  expect((await H.dbg('world')).party.length===3,'3人で再開できない');
  await H.phone('ちず');await H.page.getByRole('button',{name:'おうちへ かえる',exact:true}).click();await H.choose(0);await H.idle();await H.shot('house');
  await H.dbg('feed','goji','apple');await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
  const again=await H.dbg('saveData');expect(again.coins===987654&&again.bag.apple===old.bag.apple-1&&again.wardrobe.crown,'ver2で遊んだあと保存できない');
},{viewport,full:viewport.width===375,timeout:90000});

await scenario("セーブ→つづきから", async (H) => {
  await H.newGameFast();
  await H.dbg("teleport", "town", 20, 60, "left");
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
  expect(st.map === "town" && st.pos[0] === 20 && st.pos[1] === 60, "つづきから の位置がちがう " + JSON.stringify(st));
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
  await H.dbg("teleport", "town", 44, 60);
  await H.until(() => G.sceneName === "world" && !Game.trans, 10000);
  await H.wait(800);
  await H.shot("night");
  const fps = await H.dbg("fps", 1500);
  expect(fps >= 20, `FPS が低すぎる (${fps})`);
}, { full: true });

await scenario("交通（電車・船・飛行機・中止・セーブ）", async H=>{
  await H.newGameFast(); await H.dbg("hour",12);
  const board=async(map,x,y,stop,choice)=>{
    const door=(await H.dbg("townLayout",map)).doors.find(d=>d.act.stop===stop);x=door.x;y=door.y+1;
    await H.dbg("teleport",map,x,y,"up");
    await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,map);
    const p=(await H.dbg("world")).stops.find(s=>s.id===stop);
    await H.tap(p.cx,p.cy); await H.page.getByRole("button",{name:choice,exact:true}).click();
  };
  await board("heiwadai",0,0,"heiwadai_station","やめておく");
  await H.idle();expect((await H.dbg("state")).map==="heiwadai","乗車中止で移動した");
  for(const [map,x,y,stop,choice,destination,kind] of [
    ["heiwadai",0,0,"heiwadai_station","くうこうえきへ","airport","train"],
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
  await board("airport",6,22,"airport_station","平和台えきへ");
  await H.until(()=>PokaDebug.state().scene==="travel"&&PokaDebug.idle());
  await H.page.getByRole("button",{name:"おうちへ",exact:true}).click();
  await H.until(()=>PokaDebug.state().scene==="house"&&PokaDebug.idle());
}, {timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('heiwadai-life-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',12);await H.dbg('calendar','2026-06-01');await H.dbg('weather','clear');await H.dbg('teleport','heiwadai',27,19);await H.idle();
  const before=await H.dbg('saveData'),life=await H.dbg('heiwadaiLife',0);expect(life.npcs.length===13,'8人と5人の通行人がいない');
  const haru=life.npcs.find(n=>n.id==='heiwadai_local');expect(haru.sp==='cat','ハルの見た目が見本と違う');await H.tap(haru.cx,haru.cy);await H.page.locator('.dlg-text').waitFor();await H.until(()=>document.querySelector('.dlg-text')?.textContent.includes('えきまえ'));await H.dialogs();await H.idle();
  await H.dbg('teleport','heiwadai',42,35);await H.idle();await H.dbg('heiwadaiLife',0);await H.shot('signal-green');const red=await H.dbg('heiwadaiLife',10);expect(red.signal==='red','信号が変わらない');await H.shot('signal-red');
  const moving=await H.dbg('heiwadaiLife',25);expect(moving.trainX>30&&!moving.trainStopped,'電車が出発しない');
  await H.dbg('teleport','heiwadai',9,50);await H.idle();const f=(await H.dbg('world')).objects.find(o=>o.id==='heiwadai_fountain');await H.tap(f.cx,f.cy);await H.until(()=>PokaDebug.world()?.active==='heiwadai_fountain');await H.shot('fountain');
  await H.dbg('teleport','heiwadai',20,33);await H.idle();await H.dbg('hour',21);expect((await H.dbg('heiwadaiLife')).night,'夜にならない');await H.shot('night');
  await H.dbg('heiwadaiLife',null);const fps=await H.dbg('fps',2000);expect(fps>=20,'景観描画が20FPS未満: '+fps);const cache0=await H.dbg('heiwadaiLife');
  for(let t=0;t<200;t+=17){await H.dbg('heiwadaiLife',t);await H.wait(40);}expect((await H.dbg('heiwadaiLife')).sceneryCache<=cache0.sceneryLimit,'時刻でSVGキャッシュが増える');
  expect((await H.dbg('saveData')).coins===before.coins,'景観や会話でおかねが変わる');await H.dbg('heiwadaiLife',null);
},{viewport,timeout:120000,full:viewport.width===375});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('heiwadai-layout-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',12);await H.dbg('calendar','2026-05-01');await H.dbg('weather','clear');
  const fixture=await H.dbg('saveData');fixture.coins=987654;fixture.world={map:'heiwadai',x:27,y:11,dir:'down'};fixture.flags.chests.heiwadai_lane=true;
  await H.dbg('seedSave',fixture);await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
  let state=await H.dbg('state');expect(state.coins===987654&&state.map==='heiwadai'&&state.pos[0]===27&&state.pos[1]===19,'古い位置から駅前へ安全に復帰できない');
  expect((await H.dbg('saveData')).flags.chests.heiwadai_lane,'旧宝箱フラグが失われた');
  const layout=await H.dbg('heiwadaiState');expect(layout.size[0]===64&&layout.size[1]===68,'v0.2の広さではない');
  const market=layout.doors.find(d=>d.id==='heiwadai_market');await H.dbg('teleport','heiwadai',market.x,market.y+1);await H.idle(30000);
  expect(await H.dbg('walkTo',market.x,market.y),'駅前マーケットへ入れない');await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle());
  expect((await H.dbg('storeState')).shop==='market','別の店へ入った');
  await H.dbg('teleport','heiwadai',42,29,'right');await H.idle(30000);await H.shot('station');
  await H.dbg('teleport','heiwadai',9,50);await H.idle(30000);const fountain=(await H.dbg('world')).objects.find(o=>o.id==='heiwadai_fountain');await H.tap(fountain.cx,fountain.cy);await H.until(()=>PokaDebug.world()?.active==='heiwadai_fountain');
  expect((await H.dbg('world')).party.length===3,'なかまが欠ける');await H.dbg('save');
  expect((await H.dbg('persistedSave')).coins===987654,'配置の更新でおかねが変わる');
},{viewport,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`町の景観としかけ（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);
  for(const [map,x,y] of [["heiwadai",31,14],["heiwadai",9,50],["town",42,24],["city",10,45],["harbor",19,23],["airport",25,20],["meadow",10,10],["forest",14,14],["cave",12,12]]){
    await H.dbg("teleport",map,x,y);await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,map);
    await H.shot(`${map}-${x}`);
  }
  await H.dbg("teleport","heiwadai",9,50);await H.until(()=>PokaDebug.state().map==="heiwadai"&&PokaDebug.idle());
  const o=(await H.dbg("world")).objects.find(o=>o.id==="heiwadai_fountain");
  await H.tap(o.cx,o.cy);await H.until(()=>PokaDebug.world()?.active==="heiwadai_fountain",10000);
  await H.shot("fountain-play");
  await H.page.keyboard.press("Escape");await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  await H.page.getByRole("tab",{name:"せかい ちず",exact:true}).click();
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
    // 記念品の検証は安全な町で行う。草原で敵が近づくまでの時間に依存させない。
    await H.dbg("teleport","town",20,60);await H.idle();
    await H.phone("スタンプラリー");await H.page.getByRole("button",{name:"きせつの スタンプ",exact:true}).click();await H.shot(initial.id+"-rewards");
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
  await H.dbg("teleport","town",20,60); await H.idle();
  const before=await H.dbg("state");
  await H.page.keyboard.press("Escape");
  await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  await H.page.getByRole("tab",{name:"せかい ちず",exact:true}).click();
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
  const town=atlas.getByRole("button",{name:"ネリカスタウン",exact:true});
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
  // Chromium はネイティブ2本指入力、WebKit は同じ PointerEvent 経路を検証する。
  if(ENGINE==='chromium') {
    const session=await H.page.context().newCDPSession(H.page),r=await svg.boundingBox();
    const cx=r.x+r.width/2,cy=r.y+r.height/2,points=d=>[{x:cx-d,y:cy,id:1},{x:cx+d,y:cy,id:2}];
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(30)});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(55)});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  } else await svg.evaluate(el=>{
    const r=el.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2;
    const send=(type,id,x)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:id,clientX:x,clientY:cy}));
    // WebKit の Playwright API は2本指を送れないため、合成入力だけ捕捉を代替する。
    const capture=el.setPointerCapture;el.setPointerCapture=()=>{};
    try {send('pointerdown',91,cx-30);send('pointerdown',92,cx+30);
      send('pointermove',91,cx-55);send('pointermove',92,cx+55);
      send('pointerup',91,cx-55);send('pointerup',92,cx+55);
    } finally {el.setPointerCapture=capture;}
  });
  expect(+(await atlas.getAttribute('data-zoom'))>2,'2本指で拡大できない');
  await atlas.getByRole("button",{name:"ちずを ぜんたいに もどす",exact:true}).click();
  expect(await svg.getAttribute("viewBox")==="0 0 800 850","全体に戻らない");
  const routes=atlas.getByRole("button",{name:"のりものの みち",exact:true});
  await routes.click(); expect(!(await atlas.locator(".atlas-transit").isVisible()),"航路を隠せない");
  await routes.click(); expect(await atlas.locator(".atlas-transit").isVisible(),"航路を戻せない");
  await atlas.getByRole("button",{name:"平和台（へいわだい）",exact:true}).click();
  await atlas.locator(".atlas-open-local").click();
  expect(await H.page.getByRole("img",{name:"平和台（へいわだい）の詳細地図",exact:true}).isVisible(),"詳細マップを見られない");
  await H.page.locator(".area-map .amap-frame").scrollIntoViewIfNeeded();
  await H.shot("local-heiwadai");
  expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"全体マップが画面をはみ出す");
  const after=await H.dbg("state");
  expect(after.map===before.map&&after.coins===before.coins&&JSON.stringify(after.pos)===JSON.stringify(before.pos),"地図閲覧でプレイ状態が変わった");
  await H.page.getByRole("button",{name:"とじる",exact:true}).click(); await H.idle();
  await H.dbg("teleport","heiwadai",9,50); await H.idle();
  await H.page.keyboard.press("Escape"); await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  expect(await H.page.locator(".atlas-marker.is-current").getAttribute("data-area")==="heiwadai","再度開いた地図の現在地が古い");
},{viewport,full:viewport.width===375,timeout:90000});

// UI-13: すまほ の ちず「この エリア」（ポンチ絵の ちず・タップで せつめい・いちらん・2ばい・ほかの エリア）
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`area-map-${viewport.width}`,async H=>{
  await H.newGameFast(); await H.dbg("hour",12);
  await H.dbg("teleport","town",21,61); await H.idle();
  const before=await H.dbg("state");
  await H.phone("ちず");
  const pane=H.page.locator(".area-map"), svg=pane.locator(".amap-svg");
  expect(await H.page.getByRole("tab",{name:"この エリア",exact:true}).getAttribute("aria-selected")==="true","ちずが この エリアから ひらかない");
  expect(await H.page.getByRole("img",{name:"ネリカスタウンの詳細地図",exact:true}).isVisible(),"エリアの ちずが ない");
  let st=await H.dbg("areaMap");
  expect(st&&st.id==="town"&&st.here&&st.here.x===21.5&&st.here.y===61.5,"いま ここ が ちがう "+JSON.stringify(st&&st.here));
  expect(st.places.filter(p=>p.type==="building").length>=30&&st.places.some(p=>p.type==="exit"),"たてもの・でぐちが たりない");
  const labels=st.labels.map(b=>b.text);
  for(const t of ["おうち","スーパー","しょうがっこう","へいわだい","ぽかぽかはらっぱ","バスてい"]) expect(labels.includes(t),`なまえ「${t}」が ちずに ない: `+labels.join("・"));
  // なまえ（もじ）が かさならない・ちずから はみ出さない（ほんとうの もじの おおきさで）
  const lay=async(tag)=>{
    const g=await svg.evaluate(el=>{const r=el.getBoundingClientRect();return {r:[r.left,r.top,r.right,r.bottom],t:[...el.querySelectorAll("text.amap-label, .amap-here text")].map(e=>{const b=e.getBoundingClientRect();return [b.left,b.top,b.right,b.bottom,e.textContent];})};});
    for(const [x0,y0,x1,y1,t] of g.t) expect(x0>=g.r[0]-0.5&&y0>=g.r[1]-0.5&&x1<=g.r[2]+0.5&&y1<=g.r[3]+0.5,`${tag}: 「${t}」が ちずから はみ出す`);
    for(let i=0;i<g.t.length;i++)for(let j=i+1;j<g.t.length;j++){const a=g.t[i],b=g.t[j];expect(!(a[0]<b[2]-1&&a[2]>b[0]+1&&a[1]<b[3]-1&&a[3]>b[1]+1),`${tag}: 「${a[4]}」と「${b[4]}」が かさなる`);}
    return g.t.length;
  };
  expect(await lay("town")>=20,"なまえが すくない");
  await H.shot("town");
  // タップ: スーパー → せつめい（しゅるい・できること・むき）
  const sup=st.places.find(p=>p.name==="スーパー");
  await svg.scrollIntoViewIfNeeded();
  let box=await svg.boundingBox(); const vb=await svg.evaluate(el=>el.viewBox.baseVal.width);
  await H.tap(box.x+sup.x*box.width/vb,box.y+sup.y*box.width/vb); await H.wait(250);
  expect((await H.dbg("areaMap")).sel===sup.key,"タップで えらべない");
  const card=pane.locator(".amap-card");
  expect(await card.locator("h4").textContent()==="スーパー"&&(await card.locator(".amap-card-cat").textContent())==="かいもの"&&/かいものが できる/.test(await card.textContent()),"せつめいが でない");
  expect(/いま いる ところから みて ひだりうえの ほう/.test(await card.locator(".amap-card-dir").textContent()),"むきが でない");
  await card.scrollIntoViewIfNeeded(); await H.shot("card");
  // なにも ない ところを タップ → えらばない
  await svg.scrollIntoViewIfNeeded(); box=await svg.boundingBox();
  await H.tap(box.x+4,box.y+box.height*0.02+4); await H.wait(200);
  expect((await H.dbg("areaMap")).sel===null&&await pane.locator(".amap-hint").count()===1,"そとを タップしても えらんだ まま");
  // いちらん → パンやさん
  await pane.locator(".amap-list summary").click(); await H.wait(200);
  const items=await pane.locator(".amap-item").evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return [e.textContent,r.width,r.height];}));
  expect(items.length>=25&&items.every(i=>i[2]>=43.5&&i[1]>=44),"いちらんの ボタンが 44px より 小さい "+JSON.stringify(items.filter(i=>i[2]<43.5)));
  expect(!items.some(i=>i[0]==="")&&new Set(items.map(i=>i[0])).size===items.length,"いちらんに おなじ なまえ");
  await pane.getByRole("button",{name:"パンやさん",exact:true}).click(); await H.wait(250);
  st=await H.dbg("areaMap");
  expect(st.places.find(p=>p.key===st.sel).name==="パンやさん"&&await card.locator("h4").textContent()==="パンやさん","いちらんから えらべない");
  expect(await pane.getByRole("button",{name:"パンやさん",exact:true}).getAttribute("aria-pressed")==="true","いちらんの えらんだ しるし");
  await pane.locator(".amap-list").scrollIntoViewIfNeeded(); await H.shot("list");
  // いま ここ ボタン: ちかくの たてもの
  await pane.getByRole("button",{name:"いま ここ",exact:true}).click(); await H.wait(200);
  expect((await H.dbg("areaMap")).sel==="here"&&await card.locator("h4").textContent()==="いま ここ"&&/ちかくの たてもの: おうち/.test(await card.textContent()),"いま ここ の せつめいが でない");
  expect(await H.page.locator(".amap-now").textContent()==="★ いま ここ","いま いる エリアの しるし");
  // おおきく みる（2ばい）: ぜんぶの なまえ・よこにも スクロール
  await pane.getByRole("button",{name:"おおきく みる",exact:true}).click(); await H.wait(300);
  st=await H.dbg("areaMap");
  expect(st.z===2&&st.hidden.length===0,"2ばいで でない なまえ "+JSON.stringify(st.hidden));
  expect(await pane.locator(".amap-frame").evaluate(f=>f.scrollWidth>f.clientWidth+10&&f.scrollHeight>f.clientHeight+10),"2ばいで スクロール できない");
  expect(await lay("town x2")>=30,"2ばいの なまえが すくない");
  await pane.locator(".amap-frame").scrollIntoViewIfNeeded(); await H.shot("zoom");
  await pane.getByRole("button",{name:"ちいさく みる",exact:true}).click(); await H.wait(200);
  expect((await H.dbg("areaMap")).z===1,"もどらない");
  // ほかの エリア（いけぶくろ）: いま ここ は ない
  await pane.locator(".amap-select").selectOption("city"); await H.wait(300);
  st=await H.dbg("areaMap");
  expect(st.id==="city"&&!st.here&&await pane.getByRole("button",{name:"いま ここ",exact:true}).isDisabled(),"いけぶくろの ちずに いま ここ");
  for(const t of ["サンシャインいけぶ","Meeときょれじゃ","いけぶくろ えき"]) expect(st.labels.some(b=>b.text===t),`いけぶくろの ちずに「${t}」が ない`);
  await lay("city"); await pane.locator(".amap-frame").scrollIntoViewIfNeeded(); await H.shot("city");
  // せかい ちず → しおかぜビーチ → この エリアの ちずを みる
  await H.page.getByRole("tab",{name:"せかい ちず",exact:true}).click(); await H.wait(200);
  expect(await H.page.getByRole("group",{name:"ぽかぽかの せかいの ちず",exact:true}).isVisible()&&!(await svg.isVisible()),"タブが きりかわらない");
  await H.page.locator(".world-atlas").getByRole("button",{name:"しおかぜビーチ",exact:true}).click();
  await H.page.locator(".atlas-open-local").click(); await H.wait(300);
  st=await H.dbg("areaMap");
  expect(st.id==="coast"&&await H.page.getByRole("img",{name:"しおかぜビーチの詳細地図",exact:true}).isVisible(),"せかい ちずから エリアの ちずへ いけない");
  expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"よこに はみ出す");
  // みる だけ: ばしょ・コインは かわらない。つぎに ひらくと いまの エリア
  await H.page.keyboard.press("Escape"); await H.wait(300);
  const after=await H.dbg("state");
  expect(after.map===before.map&&after.coins===before.coins&&JSON.stringify(after.pos)===JSON.stringify(before.pos),"ちずを みただけで ようすが かわった");
  await H.phone("ちず");
  expect((await H.dbg("areaMap")).id==="town","つぎに ひらくと いまの エリアで ない");
},{viewport,full:viewport.width===375,timeout:90000});

function checkHomeBubbles(s) {
  expect(s.boxes.length<=2,'同時に3つ以上の吹き出し');
  for(const b of s.boxes){expect(b.x>=s.area.left&&b.y>=s.area.top&&b.x+b.w<=s.area.right+.01&&b.y+b.h<=s.area.bottom+.01,'吹き出しが表示範囲からはみ出す');expect(Math.hypot(b.tail.x-b.anchor.x,b.tail.y-b.anchor.y)<=30,'しっぽが話者の頭から離れる');}
  for(let i=0;i<s.boxes.length;i++)for(let j=i+1;j<s.boxes.length;j++){const a=s.boxes[i],b=s.boxes[j];expect(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'吹き出しが重なる');}
}
// ② 町の人の セリフ: 時間・天気で えらぶ・町の なかまは 役の 名前と セリフ・3人の ひとこと
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('townsfolk-lines-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);await H.dbg('hour',7);await H.dbg('weather','clear');
  const talk=async(id)=>{expect(await H.dbg('folkTalk',id),id+' に 話しかけられない');await H.wait(350);return H.dbg('folkLast');};
  // 会話を おえる（おねがいを もちかけられたら うける。村長は ev-msg-poster を もって いる）
  const end=async()=>{for(let i=0;i<4;i++){await H.dialogs();if(!await H.page.$('.choices .btn'))break;await H.choose(0);}await H.idle();};
  for(const id of ['mayor','town_walker0']){await talk(id);await end();} // はじめては いまの あいさつ（村長の プレゼントも いまの まま）
  const before=await H.dbg('saveData');
  // セリフは でたらめに えらぶ（3わりは あそびかたの ヒント・おねがいを すすめる 会話も ある）ので、5かい 出るまで 話す（30かい まで）
  let data=0,shot=false,tries=0;
  for(let i=0;i<30&&data<5;i++){tries++;
    const last=await talk('mayor');
    if(last.line){data++;const l=await H.dbg('folkLine',last.line),w=l.when||{};expect(l.npc==='mayor','村長で ない セリフ: '+l.text);
      expect(!w.time||w.time.includes('morning'),'あさ なのに ほかの 時間の セリフ: '+l.text);expect(!w.weather||w.weather.includes('clear'),'はれ なのに ほかの 天気の セリフ: '+l.text);expect(!w.bond,'なかよしの セリフが まだ 出る: '+l.text);
      if(!shot){shot=true;await H.wait(1200);await H.shot('mayor');}}
    await end();
    const r=(await H.dbg('folkLast')).react;if(r){const x=await H.dbg('folkLine',r);expect(x&&['wanko','gachan','goji'].includes(x.who)&&(!x.when.person||x.when.person.includes('mayor')),'3人の ひとことが 不正');}
  }
  expect(data>=5,'町の人の セリフが データから 出ない（'+data+'/'+tries+'）');
  // 町の なかま（town_walker0）: 会話まどの 名前は 役の 名前、セリフは 役の もの
  // 町の なかまは 1人ずつ 名前を もつ（役の まえの ことば ＋ 名前。セリフは 役の もの）
  const walker=await H.dbg('cast','town_walker0');
  await talk('town_walker0');expect(walker.given&&walker.name.startsWith('おさんぽの ')&&(await H.page.locator('.dlg-name').first().textContent())===walker.name,'町の なかまの 名前が ちがう '+JSON.stringify(walker));await end();
  if((await H.dbg('folkLast')).line)expect((await H.dbg('folkLine',(await H.dbg('folkLast')).line)).npc==='town_walker','町の なかまが 役の セリフを つかわない');
  let crowd=0;for(let i=0;i<20&&crowd<2;i++){const last=await talk('town_walker0');if(last.line){crowd++;expect((await H.dbg('folkLine',last.line)).npc==='town_walker','町の なかまが 役の セリフを つかわない');if(crowd===1){await H.wait(1200);await H.shot('crowd');}}await end();}
  expect(crowd>=2,'町の なかまの セリフが 出ない');
  const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn','rooms'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'会話で セーブが 変わる: '+k);
},{viewport,full:viewport.width===375,timeout:150000});

// ② 町の人の おねがい: もちかける → うける → ノート → かって わたす → ごほうび・なかよし／ことわると ！
async function folkTalk(H,id,{greet=true}={}){expect(await H.dbg('folkTalk',id),id+' に 話しかけられない');await H.wait(300);if(greet){await H.dialogs();await H.idle();expect(await H.dbg('folkTalk',id),id+' に もう一度 話しかけられない');await H.wait(300);}}
async function folkAnswer(H,i){await H.dialogs();await H.page.waitForSelector('.choices .btn',{timeout:8000});await H.choose(i);await H.wait(250);}
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('folk-requests-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  // かいもの: ひつじの メェ「ぎゅうにゅうを かって きて」
  await H.dbg('folkOffer','ev-milk');await folkTalk(H,'sheep');await folkAnswer(H,0);await H.dialogs();await H.idle();
  let f=await H.dbg('folk');expect(f.req.length===1&&f.req[0].id==='ev-milk','おねがいを うけられない');
  // ことわる: ペンギンの ペン → ！ → つぎに 話すと もう一度
  await H.dbg('folkOffer','ev-bread3');await folkTalk(H,'penguin');await folkAnswer(H,1);await H.dialogs();await H.idle();
  expect((await H.dbg('folkMarks')).penguin==='offer','ことわった おねがいの ！ が 出ない');
  expect(await H.dbg('folkTalk','penguin'),'ペンに 話しかけられない');await folkAnswer(H,0);await H.dialogs();await H.idle();
  f=await H.dbg('folk');expect(f.req.map(r=>r.id).sort().join()==='ev-bread3,ev-milk','ことわった おねがいを もう一度 うけられない');
  // ノート: 2つの カード・画面の 中・ボタンは 44px いじょう
  await H.page.locator('.folk-note-btn').click();await H.wait(400);
  const note=await H.eval(()=>{const r=e=>e.getBoundingClientRect();const cards=[...document.querySelectorAll('.folk-card')];return {n:cards.length,inside:cards.every(c=>{const b=r(c);return b.left>=0&&b.right<=innerWidth+1;}),quit:[...document.querySelectorAll('.folk-quit')].every(b=>r(b).height>=43.5),btn:r(document.querySelector('.folk-note-btn')).height>=43.5,text:document.querySelector('.panel').innerText};});
  expect(note.n===2&&note.inside&&note.quit&&note.btn,'ノートの 表示が 不正 '+JSON.stringify({n:note.n,inside:note.inside,quit:note.quit,btn:note.btn}));
  expect(/ぎゅうにゅう/.test(note.text)&&/メロンパン/.test(note.text),'ノートに おねがいが 出ない');
  await H.shot('note');await H.page.getByRole('button',{name:'とじる',exact:true}).click();await H.wait(300);
  // かって わたす → コイン +80・なかよし +2・おわり
  const coins=(await H.dbg('state')).coins;await H.dbg('give','milk',1);
  expect(await H.dbg('folkTalk','sheep'),'メェに 話しかけられない');await H.wait(400);await H.shot('done');await H.dialogs();await H.idle();
  f=await H.dbg('folk');expect(f.done['ev-milk']&&f.bond.sheep===2&&!f.req.some(r=>r.id==='ev-milk'),'おねがいが おわらない');
  expect((await H.dbg('state')).coins===coins+80,'おねがいの コインが もらえない');
  expect(((await H.dbg('saveData')).bag.milk||0)===0,'わたした ぎゅうにゅうが へらない');
  // セーブして 再開しても のこる
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  f=await H.dbg('folk');expect(f.req.length===1&&f.req[0].id==='ev-bread3'&&f.done['ev-milk']&&f.bond.sheep===2,'おねがいが セーブに のこらない');
  // 町に もどった ときも 右上の ボタンが 出る（数は 1）
  await H.until(()=>document.querySelector('.folk-note-btn b')?.textContent==='1',5000).catch(()=>{});
  expect(await H.eval(()=>document.querySelector('.folk-note-btn b')?.textContent==='1'),'町に もどると おねがい ボタンが 出ない');
},{viewport,full:viewport.width===375,timeout:150000});

// ② でんごん・なぞなぞ・わらしべ（とどける もちものを つぎの 人へ）
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('folk-chain-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');let coins=(await H.dbg('state')).coins;
  // でんごん: ミケ → ミミ → ミケ
  await H.dbg('folkOffer','ev-msg-flower');await folkTalk(H,'cat');await folkAnswer(H,0);await H.dialogs();await H.idle();
  expect((await H.dbg('folkMarks')).rabbit==='target','でんごんの あいてに ▼ が 出ない');
  // ミミとは はじめて なので、あいさつの あとに そのまま でんごん
  await folkTalk(H,'rabbit',{greet:false});for(let i=0;i<6&&!(await H.dbg('folkLast')).relay;i++){await H.dialogs(1);await H.wait(200);}
  await H.wait(900);await H.shot('relay');await H.dialogs();await H.idle();const relay=(await H.dbg('folkLast')).relay||'';
  await folkTalk(H,'cat',{greet:false});await H.dialogs();await H.idle();
  let f=await H.dbg('folk');expect(f.done['ev-msg-flower']&&f.bond.cat===2&&f.bond.rabbit===2,'でんごんが おわらない');
  expect((await H.dbg('state')).coins===coins+60,'でんごんの コインが ちがう');coins+=60;
  // なぞなぞ: 3もん ぜんぶ あたり
  await H.dbg('folkOffer','ev-quiz');await folkTalk(H,'mouse');await folkAnswer(H,0);
  for(const ans of [0,1,0])await folkAnswer(H,ans);
  await H.dialogs();await H.idle();f=await H.dbg('folk');expect(f.done['ev-quiz']&&(await H.dbg('state')).coins===coins+80,'なぞなぞが おわらない');coins+=80;
  // わらしべ: たびの ひつじ → ミミ → ブー → そんちょう → たびの ひつじ（はとどけい ＋ 200）
  const clocks=(await H.dbg('saveData')).furn.clock||0;
  await H.dbg('folkOffer','ev-warashibe');await folkTalk(H,'traveler');await folkAnswer(H,0);await H.dialogs();await H.idle();
  expect((await H.dbg('folk')).req.find(r=>r.id==='ev-warashibe').carry==='straw','わらしべを もらえない');
  // こうかんは はじめての あいさつの あとでも すすむので 1回だけ 話す（2回めは 何も すすまず、たまに べつの おねがいが 出る）
  for(const [id,carry] of [['rabbit','seeds'],['pig','bigcorn'],['mayor','cuckoo']]){await folkTalk(H,id,{greet:false});await H.dialogs();await H.idle();expect((await H.dbg('folk')).req.find(r=>r.id==='ev-warashibe').carry===carry,'わらしべの こうかんが すすまない: '+id);}
  coins=(await H.dbg('state')).coins; // そんちょうは はじめて 話すと プレゼント（いまの まま）
  await folkTalk(H,'traveler',{greet:false});await H.dialogs();await H.idle();
  f=await H.dbg('folk');expect(f.done['ev-warashibe']==='once','わらしべが おわらない');
  expect(((await H.dbg('saveData')).furn.clock||0)===clocks+1&&(await H.dbg('state')).coins===coins+200,'わらしべの ごほうび（はとどけい・200）が ちがう');
  expect(/ミミさん/.test(relay),'でんごんを つたえる ことばが 出ない: '+relay);
},{viewport,full:viewport.width===375,timeout:180000});

// ② さがす・つれていく・さわる: しらべる ばしょの となりへ 行って、きらきら・小物を タップする
async function folkTapSpot(H,map,s,shot){
  expect(s&&s.stand,'しらべる ばしょの となりに 立てない: '+JSON.stringify(s));
  const [x,y]=s.stand,dir=x<s.x?'right':x>s.x?'left':y<s.y?'down':'up';
  await H.dbg('teleport',map,x,y,dir);await H.until(m=>G.sceneName==='world'&&G.scene.mapId===m&&PokaDebug.idle(),10000,map);await H.wait(300);
  const now=(await H.dbg('folkSpots',map)).find(q=>q.req===s.req&&q.i===s.i);expect(now&&now.cx>0&&now.cy>0,'しらべる ばしょが 画面に ない');
  if(shot)await H.shot(shot);
  await H.tap(now.cx,now.cy);await H.wait(400);
}
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('folk-find-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  // まいごの こねこ（タウン）: はずれ →「ここには ない みたい…」→ あたり → うしろを ついて くる → ミケに 話すと おわり
  await H.dbg('folkOffer','ev-lost-kitten');await folkTalk(H,'cat');await folkAnswer(H,0);await H.dialogs();await H.idle();
  let coins=(await H.dbg('state')).coins,spots=await H.dbg('folkSpots','town');
  expect(spots.length===3&&spots.filter(s=>s.hit).length===1&&spots.every(s=>s.prop==='sparkle'),'きらきらが 3つ（あたり 1つ）で ない');
  const miss=spots.find(s=>!s.hit),hit=spots.find(s=>s.hit);
  // ことばは 1もじずつ でるので、でおわった しるし（.dlg-next）を まってから よむ
  await folkTapSpot(H,'town',miss,'sparkle');await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:10000});
  expect(/ここには ない/.test(await H.eval(()=>document.querySelector('.dlg-text').innerText)),'はずれの ことばが 出ない');
  await H.dialogs();await H.idle();
  spots=await H.dbg('folkSpots','town');expect(spots.length===2&&!spots.some(s=>s.i===miss.i),'しらべた きらきらが きえない');
  await folkTapSpot(H,'town',hit);await H.until(()=>!!PokaDebug.folkKitten(),5000);
  expect(!(await H.dbg('folkSpots','town')).length&&(await H.dbg('folk')).req[0].follow==='kitten','みつけた あとも きらきらが のこる');
  // 歩くと 3人の うしろを ついて くる（はずれの ばしょまで もどる）
  expect(await H.dbg('walkTo',miss.stand[0],miss.stand[1]),'はずれの ばしょへ 歩けない');
  await H.until(([x,y])=>{const w=PokaDebug.world(),k=PokaDebug.folkKitten();return w&&w.party[0].x===x&&w.party[0].y===y&&k&&!k.trail;},30000,miss.stand);await H.wait(500);
  const gap=await H.eval(()=>{const w=PokaDebug.world(),k=PokaDebug.folkKitten(),t=w.party[w.party.length-1];return Math.abs(k.x-t.x)+Math.abs(k.y-t.y);});
  expect(gap<=2,'こねこが うしろに いない（はなれ '+gap+'）');await H.shot('kitten');
  // おうちに もどって、また 町に 出ても ついて くる
  await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),10000);
  await H.dbg('teleport','town',miss.stand[0],miss.stand[1],'down');await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);
  expect(await H.dbg('folkKitten'),'マップを かえると こねこが いなくなる');
  await folkTalk(H,'cat',{greet:false});await H.dialogs();await H.idle();
  let f=await H.dbg('folk');expect(f.done['ev-lost-kitten']&&f.bond.cat===4&&!(await H.dbg('folkKitten')),'こねこの おねがいが おわらない');
  expect((await H.dbg('state')).coins===coins+120,'こねこの コインが ちがう');
  // むぎわら ぼうし（はらっぱ）: あたりを しらべる → ミミに わたす
  await H.dbg('folkOffer','ev-lost-hat');await folkTalk(H,'rabbit');await folkAnswer(H,0);await H.dialogs();await H.idle();coins=(await H.dbg('state')).coins;
  await folkTapSpot(H,'meadow',(await H.dbg('folkSpots','meadow')).find(s=>s.hit));
  await H.until(()=>PokaDebug.folk().req.some(r=>r.id==='ev-lost-hat'&&r.carry==='hat'),5000);
  await folkTalk(H,'rabbit',{greet:false});await H.dialogs();await H.idle();
  f=await H.dbg('folk');expect(f.done['ev-lost-hat']&&f.bond.rabbit===3&&(await H.dbg('state')).coins===coins+90,'ぼうしの おねがいが おわらない');
  // みずやり（タウン）: ミミの ちかくの かだん 3つ（みずを あげると 花が さく）→ ミミに 話す
  await H.dbg('folkOffer','ev-water');await folkTalk(H,'rabbit',{greet:false});await folkAnswer(H,0);await H.dialogs();await H.idle();
  coins=(await H.dbg('state')).coins;const apples=(await H.dbg('saveData')).bag.apple||0,beds=await H.dbg('folkSpots','town');
  expect(beds.length===3&&beds.every(s=>s.prop==='flowerbed'),'かだんが 3つ ない');
  for(let i=0;i<3;i++){
    await folkTapSpot(H,'town',beds[i],i===1?'water':null);
    await H.until(n=>{const r=PokaDebug.folk().req.find(r=>r.id==='ev-water');return r&&(r.n===n||r.step===1);},5000,i+1);
    if(i===0){const b=(await H.dbg('folkSpots','town')).find(s=>s.i===beds[0].i);expect(b&&b.prop==='flowerbed_ok'&&b.tapped,'みずを あげた かだんが かわらない');}
  }
  f=await H.dbg('folk');expect(f.req.find(r=>r.id==='ev-water').step===1&&!(await H.dbg('folkSpots','town')).length,'みずやりが すすまない');
  await folkTalk(H,'rabbit',{greet:false});await H.dialogs();await H.idle();
  f=await H.dbg('folk');expect(f.done['ev-water']&&(await H.dbg('state')).coins===coins+70&&((await H.dbg('saveData')).bag.apple||0)===apples+1,'みずやりの ごほうびが ちがう');
},{viewport,full:viewport.width===375,timeout:180000});

// ② 物々交換（わたす → もらう の カード）と しゃしん（ふんすいの ちかくで ボタン → ひかる → あんないの ひとに 話す）
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('folk-photo-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  await H.dbg('give','corn',2);let d=await H.dbg('saveData');const corn=d.bag.corn||0,bread=d.bag.bread||0;
  await H.dbg('folkOffer','bt-pig-corn');await folkTalk(H,'pig');await H.dialogs();await H.page.waitForSelector('.folk-trade',{timeout:8000});
  const card=await H.eval(()=>{const e=document.querySelector('.folk-trade'),b=e.getBoundingClientRect();return {inside:b.left>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,its:e.querySelectorAll('.folk-it svg').length,text:e.innerText};});
  expect(card.inside&&card.its===2&&/とうもろこし/.test(card.text)&&/メロンパン/.test(card.text),'こうかんの カードが 不正 '+JSON.stringify(card));
  await H.wait(500);await H.shot('barter');await H.choose(0);await H.dialogs();await H.idle();
  d=await H.dbg('saveData');expect((d.bag.corn||0)===corn-2&&(d.bag.bread||0)===bread+1&&d.folk.barter['bt-pig-corn']===1,'こうかん できない');
  // しゃしん（シティ）
  await H.dbg('folkOffer','ev-photo');await folkTalk(H,'cityguide');await folkAnswer(H,0);await H.dialogs();await H.idle();
  const tile=await H.dbg('folkPhotoTile','city');expect(tile,'しゃしんが とれる マスが ない');
  await H.dbg('teleport','city',tile[0],tile[1],'up');await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='city'&&PokaDebug.idle(),10000);
  await H.page.waitForSelector('.folk-photo-btn',{timeout:5000});await H.wait(300);
  const btn=await H.eval(()=>{const r=(e)=>e.getBoundingClientRect(),b=r(document.querySelector('.folk-photo-btn')),o=[...document.querySelectorAll('.smaho-btn:not(.hidden),.world-weather,.folk-note-btn')].map(r);
    return {h:b.height,inside:b.left>=0&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1,apart:o.every(q=>b.right<=q.left||b.left>=q.right||b.bottom<=q.top||b.top>=q.bottom)};});
  expect(btn.h>=43.5&&btn.inside&&btn.apart,'しゃしんの ボタンが 不正 '+JSON.stringify(btn));
  await H.shot('photo');const coins=(await H.dbg('state')).coins,posters=(await H.dbg('saveData')).furn.poster||0;
  await H.page.locator('.folk-photo-btn').click();await H.page.waitForSelector('.folk-flash',{timeout:2000});
  await H.until(()=>!document.querySelector('.folk-photo-btn')&&PokaDebug.folk().req.find(r=>r.id==='ev-photo')?.step===1,5000);
  await folkTalk(H,'cityguide',{greet:false});await H.dialogs();await H.idle();
  const f=await H.dbg('folk');d=await H.dbg('saveData');
  expect(f.done['ev-photo']&&(await H.dbg('state')).coins===coins+100&&(d.furn.poster||0)===posters+1,'しゃしんの おねがいが おわらない');
},{viewport,full:viewport.width===375,timeout:150000});

// ③ さかな ずかん: fishGive で いけすに 入れると ずかんに のる。まもの／さかな・しぼりこみ・くわしい ページ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fish-dex-'+viewport.width,async H=>{
  await H.newGameFast();
  for(const [id,n] of [['magoi',1],['ayu',2],['kingyo',1],['madai',1],['aji',1]])await H.dbg('fishGive',id,n);
  const d=await H.dbg('saveData');expect(d.fish.dex.ayu.n===2&&d.fish.keep.ayu===2&&d.fish.caught===6&&d.fish.rod===0,'fishGive で ずかん・いけすに のらない');
  await H.phone('ずかん');
  expect(await H.eval(()=>document.querySelectorAll('.grid .card').length>0&&!!document.querySelector('.dex-kinds .tab.on[data-k="enemy"]')),'まものの ずかんが さいしょに 出ない');
  await H.page.locator('.dex-kinds .tab[data-k="fish"]').click();await H.wait(400);
  const view=()=>H.eval(()=>{const r=e=>e.getBoundingClientRect(),cells=[...document.querySelectorAll('.fish-cell')];
    return {n:cells.length,ids:cells.map(c=>c.dataset.id),known:cells.filter(c=>!c.classList.contains('unknown')).map(c=>c.querySelector('.nm').textContent),hidden:cells.filter(c=>c.classList.contains('unknown')).every(c=>c.querySelector('.nm').textContent==='？？？'),
      news:document.querySelectorAll('.fish-cell .new').length,cnt:document.querySelector('.fish-dex-head .cnt').textContent,inside:cells.every(c=>{const b=r(c);return b.left>=0&&b.right<=innerWidth+1;}),
      tabs:[...document.querySelectorAll('.fish-dex-tabs .tab,.dex-kinds .tab')].every(b=>r(b).height>=43.5)};});
  let v=await view();
  expect(v.n===50&&v.known.length===5&&v.hidden&&v.news===5&&v.cnt.startsWith('5 / 50')&&v.inside&&v.tabs,'さかな ずかんの 表示が 不正 '+JSON.stringify({...v,ids:undefined}));
  expect(['マゴイ','アユ','キンギョ','マダイ','マアジ'].every(n=>v.known.includes(n)),'つった 魚の なまえが 出ない '+v.known.join(','));
  await H.shot('dex');
  // しぼりこみ: かわ（かわの 魚 11しゅ）
  await H.page.locator('.fish-dex-tabs .tab[data-k="river"]').click();await H.wait(300);
  v=await view();expect(v.n===11&&v.ids.includes('ayu')&&!v.ids.includes('magoi')&&v.known.join()==='アユ','かわで しぼれない '+JSON.stringify({n:v.n,known:v.known}));
  // くわしい ページ: アユ（すむ ところ・つった 数・まめちしき）
  await H.page.locator('.fish-cell[data-id="ayu"]').click();await H.page.locator('.fish-detail').waitFor();await H.wait(300);
  const page=await H.eval(()=>{const e=document.querySelector('.fish-detail'),b=e.getBoundingClientRect();return {text:e.innerText,inside:b.left>=0&&b.right<=innerWidth+1,svg:!!e.querySelector('.art svg')};});
  expect(page.svg&&page.inside&&/アユ/.test(page.text)&&/かわ/.test(page.text)&&/2ひき つった/.test(page.text)&&/まめちしき/.test(page.text),'くわしい ページが 不正 '+JSON.stringify(page));
  await H.shot('detail');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);
  expect(await H.eval(()=>!document.querySelector('.fish-detail')&&!!document.querySelector('.fish-dex')),'くわしい ページを とじると ずかんに もどらない');
},{viewport,full:viewport.width===375,timeout:120000});

// ③ 釣り（UI-02）: 見おろしの まま つる。水を ながおし（page.mouse・0.45びょう より ながく）→ うき → ちょんちょん → しずむ → 「つる」→ ズームで じまん → いけす
// 魚の かげは fishSpawn で 3人の ちかくに 出す（かってには 出さない）。「つる」ボタンは しずむと ぷるぷる うごくので force で おす
async function fishCast(H,aim=null,ms=650){const a=aim||await H.dbg('fishAim');expect(a,'魚の かげが ない');await H.page.mouse.move(a.x,a.y);await H.page.mouse.down();await H.wait(ms);await H.page.mouse.up();await H.until(()=>!!PokaDebug.fishState()?.line,3000);}
async function fishCatch(H,id,cm,{nibbles=1,shot=false}={}){
  await H.dbg('fishAuto',false,true);
  expect(await H.dbg('fishSpawn',id,cm,{nibbles}),id+' の かげが 出ない');
  await fishCast(H);
  await H.until(()=>PokaDebug.fishState()?.line==='bite',15000);
  if(shot)await H.shot('bite');
  await H.page.locator('.fish-go-btn').click({force:true});
  await H.until(()=>PokaDebug.fishState()?.brag?.talking,6000);await H.wait(300);
}
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fishing-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  // タウンの ペンが つりざおを くれる（はじめての あいさつの あと）
  expect(await H.dbg('folkTalk','penguin'),'ペンに 話しかけられない');await H.dialogs();await H.idle();
  expect((await H.dbg('saveData')).fish.rod===1,'ペンから つりざおが もらえない');
  const shore=await H.dbg('fishShore','town');expect(shore,'タウンに 水べが ない');
  await H.dbg('teleport','town',shore.x,shore.y,shore.dir);await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);
  await H.dbg('fishAuto',false,true);await H.wait(300);
  // 水べに 立っても「つる」ボタンは 出ない（なげて から だけ）
  expect(await H.page.locator('.fish-go-btn').count()===0,'なげる まえから「つる」ボタンが ある');
  // 魚の かげ: ながさは cm × 0.8px（マゴイ 60cm → 48px）
  const sh=await H.dbg('fishSpawn','magoi',60,{nibbles:2});
  expect(sh&&Math.abs(sh.len-48)<0.01&&sh.wid<sh.len,'かげの ながさが cm に 比例 しない '+JSON.stringify(sh));
  await H.wait(300);await H.shot('shadow');
  // ながおし: わが たまって → さおを ふって なげる
  const aim=await H.dbg('fishAim');
  await H.page.mouse.move(aim.x,aim.y);await H.page.mouse.down();await H.wait(250);
  expect((await H.dbg('fishState')).press,'ながおしの わが 出ない');
  await H.wait(400);await H.page.mouse.up();
  await H.until(()=>!!PokaDebug.fishState()?.line,3000);
  await H.page.locator('.fish-go-btn').waitFor({timeout:3000});
  const ui=await H.eval(()=>{const r=document.querySelector('.fish-go-btn').getBoundingClientRect(),s=PokaDebug.fishState(),L=G.scene.party[0].feet(),cv=G.canvas.getBoundingClientRect(),u=G.cssPerUnit,ox=G.W/2-G.scene.cam.x,oy=G.H/2-G.scene.cam.y;
    const kid={x:cv.left+(ox+L.x)*u,y:cv.top+(oy+L.y-20)*u},bob={x:cv.left+s.bobber.sx*u,y:cv.top+s.bobber.sy*u},inR=(p)=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;
    return {w:r.width,h:r.height,inside:r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,kid:inR(kid),bob:inR(bob)};});
  expect(ui.w>=44&&ui.h>=44&&ui.inside&&!ui.kid,'「つる」ボタンが 不正（ちいさい・はみ出す・3人に かさなる） '+JSON.stringify(ui));
  await H.until(()=>PokaDebug.fishState()?.line==='float',4000);await H.shot('float');
  // ちょんちょん 2かい → しずむ（「！」・ボタンが きいろ）
  await H.until(()=>PokaDebug.fishState()?.line==='bite',15000);
  let st=await H.dbg('fishState');
  expect(st.nibbled===2&&st.button&&st.button.bite,'ちょんちょん 2かい → しずむ に ならない '+JSON.stringify({n:st.nibbled,b:st.button}));
  await H.shot('bite');
  await H.page.locator('.fish-go-btn').click({force:true});
  // つりあげる → カメラが せんとうの 子に ズーム → 魚を かかげて じまん
  await H.until(()=>PokaDebug.fishState()?.brag?.talking,6000);await H.wait(400);
  st=await H.dbg('fishState');
  await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:5000});
  const text=await H.eval(()=>document.querySelector('.dlg-text')?.textContent||'');
  expect(st.zoom>1.8&&st.brag.id==='magoi'&&st.brag.held===48,'じまんで ズーム しない '+JSON.stringify(st.brag)+st.zoom);
  expect(/わん！ マゴイを つりあげた！/.test(text)&&/まごまご/.test(text)&&/60cm/.test(text),'じまんの ことばが 出ない '+text);
  await H.shot('brag');
  await H.dialogs();await H.until(()=>!PokaDebug.fishState()?.brag,5000);
  let d=await H.dbg('saveData');expect(d.fish.dex.magoi.n===1&&d.fish.keep.magoi===1&&d.fish.caught===1,'つった マゴイが ずかん・いけすに のらない');
  st=await H.dbg('fishState');expect(st.zoom===1&&!st.line&&(await H.page.locator('.fish-go-btn').count())===0,'じまんの あと もとに もどらない');
  // はやすぎ: ちょん で おすと にげる
  await H.dbg('fishSpawn','kingyo',12,{nibbles:3});await fishCast(H);
  await H.until(()=>PokaDebug.fishState()?.nibbled>=1,15000);
  await H.page.locator('.fish-go-btn').click({force:true});
  await H.until(()=>/はやすぎ/.test(PokaDebug.fishState()?.last||'')&&!PokaDebug.fishState()?.line,4000);
  // おそすぎ: しずんでも おさないと にげられる（うきは のこる → おすと もどす）
  await H.dbg('fishAuto',false,true);await H.dbg('fishSpawn','kingyo',12,{nibbles:0});await fishCast(H);
  await H.until(()=>PokaDebug.fishState()?.line==='bite',15000);
  await H.until(()=>PokaDebug.fishState()?.escaped===1,3000);
  expect(/にげられ/.test((await H.dbg('fishState')).last||'')&&(await H.dbg('fishState')).line==='float','にげられた ときの ことばが 出ない');
  await H.page.locator('.fish-go-btn').click({force:true});await H.until(()=>!PokaDebug.fishState()?.line,3000);
  d=await H.dbg('saveData');expect(d.fish.keep.magoi===1&&!d.fish.keep.kingyo&&d.fish.caught===1,'にげても いけすが かわった');
  // ② アユの おねがい: はらっぱの かわで つる → ミントに わたす（いけすから へる）
  await H.dbg('folkOffer','ev-fish-ayu');await folkTalk(H,'parkcat');await folkAnswer(H,0);await H.dialogs();await H.idle();
  expect((await H.dbg('folk')).req.some(r=>r.id==='ev-fish-ayu'),'アユの おねがいを うけられない');
  const river=await H.dbg('fishShore','meadow');expect(river,'はらっぱに 水べが ない');
  await H.dbg('teleport','meadow',river.x,river.y,river.dir);await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='meadow'&&PokaDebug.idle(),20000);
  expect((await H.dbg('fishState')).spot==='river','はらっぱが かわの 釣り場に ならない');
  await fishCatch(H,'ayu',20);await H.dialogs();await H.until(()=>!PokaDebug.fishState()?.brag,5000);await H.dialogs();await H.idle();
  expect((await H.dbg('folk')).req.find(r=>r.id==='ev-fish-ayu').step===1&&(await H.dbg('saveData')).fish.keep.ayu===1,'アユを つっても おねがいが すすまない');
  const coins=(await H.dbg('state')).coins;
  await folkTalk(H,'parkcat',{greet:false});await H.dialogs();await H.idle();
  d=await H.dbg('saveData');
  expect(d.folk.done['ev-fish-ayu']&&(d.fish.keep.ayu||0)===0&&(await H.dbg('state')).coins===coins+160,'アユを わたしても おねがいが おわらない');
},{viewport,full:viewport.width===375,timeout:180000});

// ③ いけす・うる・りっぱな つりざお: うるのは スーパー（1ぴき／ぜんぶ・すいぞくかんに まだ いない 魚に しるし）・いけすが いっぱい（30ぴき）なら つっても にがす・みなとの マルシェで さおを かう
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fish-keep-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('rod',1);await H.dbg('hour',11);
  await H.dbg('fishGive','kingyo',2);await H.dbg('fishGive','ayu');await H.dbg('museumGive','fish','ayu');
  let coins=(await H.dbg('state')).coins;
  const price=await H.eval(()=>Object.fromEntries(FISHING_DATA.fish.map(f=>[f.id,f.sell])));
  // スーパー（タウン）で「さかなを うる」
  await H.dbg('store','market','town');await H.idle();
  await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.waitForSelector('.choices .btn',{timeout:8000});
  await H.page.getByRole('button',{name:'さかなを うる',exact:true}).click();await H.page.locator('.fish-sell').waitFor({timeout:5000});await H.wait(300);
  const rows=await H.eval(()=>[...document.querySelectorAll('.fish-sell-row')].map(r=>{const b=r.querySelector('.btn').getBoundingClientRect(),q=r.getBoundingClientRect();return {id:r.dataset.id,aq:r.classList.contains('aq'),h:b.height,inside:q.left>=0&&q.right<=innerWidth+1&&b.right<=innerWidth+1};}));
  expect(rows.length===2&&rows.find(r=>r.id==='kingyo')?.aq&&!rows.find(r=>r.id==='ayu')?.aq&&rows.every(r=>r.h>=43.5&&r.inside),'さかなを うる がめんが 不正 '+JSON.stringify(rows));
  await H.shot('sell');
  await H.page.locator('.fish-sell-row[data-id="kingyo"] .btn').click();await H.wait(200);
  let d=await H.dbg('saveData');expect((await H.dbg('state')).coins===coins+price.kingyo&&d.fish.keep.kingyo===1,'1ぴき うっても コインが ふえない');
  // ぜんぶ うる（すいぞくかんに まだ いない 魚が いるので たしかめる → はい）
  await H.page.getByRole('button',{name:/^ぜんぶ うる/}).click();await H.choose(0);await H.wait(300);
  d=await H.dbg('saveData');expect((await H.dbg('state')).coins===coins+price.kingyo*2+price.ayu&&!d.fish.keep.kingyo&&!d.fish.keep.ayu&&d.fish.dex.kingyo.n===2,'ぜんぶ うっても いけすが からに ならない');
  await H.page.locator('.modal-wrap:not(.out) .close').last().click();await H.idle();
  // いけすが からの ときは「さかなを うる」が 出ない
  await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.waitForSelector('.choices .btn',{timeout:8000});
  expect(!(await H.eval(()=>[...document.querySelectorAll('.choices .btn')].some(b=>/さかなを うる/.test(b.textContent)))),'いけすが からでも「さかなを うる」が 出る');
  await H.page.getByRole('button',{name:'また あとで',exact:true}).click();await H.idle();
  await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),15000);
  // いけすが いっぱい: つって じまんした あと にがす（いけすは 30 の まま・ずかんは ふえる）
  await H.dbg('fishGive','ginbuna',30);
  const shore=await H.dbg('fishShore','town');await H.dbg('teleport','town',shore.x,shore.y,shore.dir);await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);
  await fishCatch(H,'kingyo',12);
  let full=false;
  for(let i=0;i<8&&!full;i++){full=/いけすが いっぱい/.test(await H.eval(()=>document.querySelector('.dlg-text')?.textContent||''));if(!full){await H.eval(()=>document.querySelector('.dlg-shade')?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})));await H.wait(250);}}
  expect(full,'いけすが いっぱいの ときに ことばが 出ない');
  await H.page.locator('.dlg-next:not(.hidden)').waitFor({timeout:5000});await H.shot('full');
  await H.dialogs();await H.until(()=>!PokaDebug.fishState()?.brag,5000);
  d=await H.dbg('saveData');expect(Object.values(d.fish.keep).reduce((a,n)=>a+n,0)===30&&d.fish.dex.kingyo.n===3,'いけすが 30ぴきを こえた／ずかんに のらない');
  // ずかんに いけすの かず
  await H.phone('ずかん');
  await H.page.locator('.dex-kinds .tab[data-k="fish"]').click();await H.wait(300);
  expect(/30 \/ 30/.test(await H.eval(()=>document.querySelector('.fish-keep')?.textContent||'')),'ずかんに いけすの かずが 出ない');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);
  // りっぱな つりざお: シティの マルシェには ない・みなとの マルシェで 1200コイン
  await H.dbg('coins',1200);
  await H.dbg('venue','mall',3);await H.idle();expect(!(await H.dbg('venueState')).fixtures.some(f=>/りっぱな/.test(f.label)),'池袋のマルシェで港限定の竿が買える');
  await H.dbg('store','market','harbor');await H.idle();
  await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();
  const pro=H.page.locator('.choices .btn',{hasText:'りっぱな つりざお'});await pro.waitFor({timeout:8000});await H.wait(300);await H.shot('marche');
  coins=(await H.dbg('state')).coins;await pro.click();
  await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.dialogs();await H.idle();
  d=await H.dbg('saveData');expect(d.fish.rod===2&&(await H.dbg('state')).coins===coins-1200,'みなとの マルシェで りっぱな つりざおが かえない');
},{viewport,full:viewport.width===375,timeout:180000});

// 水の 絵: 川（もり）・海（ビーチ）・湖（はらっぱ）を 形で 見わけて 描きわける。水べに 立つと 水の マスが 水の 色・マスの まんなかの 見た目と 水の マスが ぜんぶ そろう・雨の 日も うごく
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('water-'+viewport.width,async H=>{
  await H.newGameFast();
  for(const [map,kind] of [['forest','river'],['coast','sea'],['meadow','lake']]){
    const info=await H.dbg('water',map),b=info.bodies.find(b=>b.kind===kind);
    expect(info.any&&b&&b.shore,map+' の 水が '+kind+' に ならない／水べに 立てない '+JSON.stringify(info.bodies));
    await H.dbg('teleport',map,b.shore.x,b.shore.y);await H.until(m=>G.sceneName==='world'&&G.scene.mapId===m&&PokaDebug.idle(),20000,map);await H.wait(600);
    const w=await H.dbg('water',map,b.shore.wx,b.shore.wy);
    expect(w.looksWet&&w.px&&w.px[2]>w.px[0]+8,map+': 水の マスが 水の 色に 見えない '+JSON.stringify(w.px));
    await H.shot(kind);
  }
  for(const map of ['town','forest','coast','meadow','cave','harbor']){const w=await H.dbg('water',map);expect(!w.any||w.mismatch===0,map+': マスの まんなかの 見た目と 水の マスが ずれる '+w.mismatch);}
  await H.dbg('weather','rain');await H.wait(900);await H.shot('rain');
},{viewport,full:viewport.width===375,timeout:90000});

// 町の人（モブ）: 35しゅ・おなじ 見た目や 名前の 人が いない。町の なかまに 話すと 自分の 名前と 顔。お店の お客さんも きまった 60人から（ちがう 見た目）
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('npc-cast-'+viewport.width,async H=>{
  await H.newGameFast();
  const c=await H.dbg('cast');
  expect(c.species>=35&&c.people>=80&&!c.sameLook.length&&!c.sameName.length&&c.customers===60,'町の人の 見た目・名前が かさなる '+JSON.stringify(c).slice(0,300));
  // シティの なかまに 話す（名前は 1人ずつ・顔の 絵が 出る）
  const who=await H.dbg('cast','city_local0');expect(who&&who.given&&who.name.startsWith('シティの '),'シティの なかまに 名前が ない '+JSON.stringify(who));
  expect(await H.dbg('folkTalk','city_local0'),'シティの なかまに 話しかけられない');await H.page.locator('.dlg-name').first().waitFor({timeout:8000});await H.wait(400);
  const v=await H.eval(()=>({name:document.querySelector('.dlg-name').textContent,face:!!document.querySelector('.dlg-face svg')}));
  expect(v.name===who.name&&v.face,'会話まどの 名前・顔が ちがう '+JSON.stringify(v));await H.shot('talk');
  // お店の お客さん: つづけて 6人 ちがう 人
  const cust=await H.eval(()=>{const out=[];for(let i=0;i<6;i++)out.push(NpcCast.customer().cid);return out;});
  expect(new Set(cust).size===6,'お客さんが つづけて おなじ 人 '+cust);
},{viewport,full:viewport.width===375,timeout:90000});

// ④ かせき ノート: fossilGive で 骨を もつと ノートに のる。まもの／さかな／かせき・そろった！・くわしい ページ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fossil-note-'+viewport.width,async H=>{
  await H.newGameFast();
  for(const k of ['trex.skull','trex.leg','compso.head','compso.body'])await H.dbg('fossilGive',k);
  expect((await H.dbg('saveData')).fossil.bones['trex.skull']===1&&(await H.dbg('saveData')).fossil.pick===0,'fossilGive で 骨が もてない');
  await H.phone('ずかん');
  await H.page.locator('.dex-kinds .tab[data-k="fossil"]').click();await H.wait(400);
  const v=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),cells=[...document.querySelectorAll('.fossil-cell')];
    return {n:cells.length,names:cells.map(c=>c.querySelector('.nm').textContent),cnt:cells.map(c=>c.querySelector('.cnt').textContent),done:cells.filter(c=>c.classList.contains('done')).map(c=>c.dataset.id),
      sum:document.querySelector('.fossil-sum').textContent,inside:cells.every(c=>{const b=r(c);return b.left>=0&&b.right<=innerWidth+1;}),tabs:[...document.querySelectorAll('.dex-kinds .tab')].map(b=>[b.textContent,r(b).height>=43.5,r(b).right<=innerWidth+1])};});
  expect(v.n===10&&v.names[0]==='ティラノサウルス'&&v.cnt[0]==='ほね 2/8'&&v.done.join()==='compso'&&v.cnt[9]==='そろった！'&&v.names.filter(n=>n==='？？？').length===8&&/4 \/ 63/.test(v.sum)&&v.inside&&v.tabs.map(t=>t[0]).join('|')==='まもの|さかな|かせき|かぐ|ふく'&&v.tabs.every(t=>t[1]&&t[2]),'かせき ノートが 不正 '+JSON.stringify(v));
  await H.shot('note');
  // くわしい ページ（ティラノサウルス）
  await H.page.locator('.fossil-cell[data-id="trex"]').click();await H.page.locator('.fossil-detail').waitFor();await H.wait(300);
  const page=await H.eval(()=>{const e=document.querySelector('.fossil-detail'),b=e.getBoundingClientRect();return {text:e.innerText,inside:b.left>=0&&b.right<=innerWidth+1,svg:!!e.querySelector('.art svg')};});
  expect(page.svg&&page.inside&&/ティラノサウルス/.test(page.text)&&/きたアメリカ/.test(page.text)&&/12m/.test(page.text)&&/2 \/ 8/.test(page.text)&&/まめちしき/.test(page.text),'くわしい ページが 不正 '+JSON.stringify(page));
  await H.shot('detail');
  // まだ 骨が ない 恐竜は ひらかない
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);
  await H.page.locator('.fossil-cell[data-id="stego"]').click();await H.wait(300);
  expect(await H.eval(()=>!document.querySelector('.fossil-detail')),'まだ 骨が ない 恐竜の ページが ひらく');
},{viewport,full:viewport.width===375,timeout:120000});

// ④ 化石ほり: ほる 画面の 骨の マスを（ほんとうに マウスで）たたいて ほりだす。おわると ほる 画面が とじる
// まえの ほる 画面が きえてから つぎを ひらく（とじた まどは 180ms のこる。はやい CI では .dig-wrap canvas が 2つに なって いた）
const noDig=(H)=>H.until(()=>!document.querySelector('.dig-wrap'),5000);
async function digAll(H){
  for(let i=0;i<40;i++){
    const st=await H.dbg('digState');if(!st||st.done)break;
    let cell=null;for(let y=st.area.y;y<st.area.y+st.area.h&&!cell;y++)for(let x=st.area.x;x<st.area.x+st.area.w&&!cell;x++)if(st.hp[y*st.cols+x]>0)cell=[x,y];
    const b=await H.page.locator('.dig-wrap canvas').boundingBox(),pad=10,cw=(b.width-pad*2)/st.cols,ch=(b.height-pad*2)/st.rows;
    await H.page.mouse.click(b.x+pad+cw*(cell[0]+0.5),b.y+pad+ch*(cell[1]+0.5));await H.wait(60);
  }
  const st=await H.dbg('digState');expect(st&&st.done,'骨が ほりだせない '+JSON.stringify(st));
  return st;
}
// ④ 化石ほり: ケロスケから ピッケル → きょうの いわ（どうくつ 4・もり 3・ビーチ 3。とおれない）→「ほる」→ たたいて ほりだす → カード → ノート。ほった いわは きえる
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fossil-dig-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  // もりの ケロスケが ピッケルを くれる（はじめての あいさつの あと）
  expect(await H.dbg('folkTalk','explorer'),'ケロスケに 話しかけられない');await H.dialogs();await H.idle();
  expect((await H.dbg('saveData')).fossil.pick===1,'ケロスケから ピッケルが もらえない');
  const rocks=await H.dbg('fossilRocks','cave');
  expect(rocks.length===4&&(await H.dbg('fossilRocks','forest')).length===3&&(await H.dbg('fossilRocks','coast')).length===3,'きょうの いわの 数が 不正 '+JSON.stringify(rocks));
  // いわの となりで「ほる」（44px いじょう・はみ出さない）。いわの マスは とおれない
  const spot=await H.dbg('fossilSpot','cave');expect(spot,'いわの となりに 立てない');
  await H.dbg('teleport','cave',spot.x,spot.y,spot.dir);await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);
  expect(await H.eval(([x,y])=>!G.scene.walkable(x,y)&&!!G.scene.rockAt(x,y),spot.rock),'いわの マスを とおれる');
  await H.page.locator('.fossil-go-btn').waitFor({timeout:5000});
  const go=await H.eval(()=>{const r=document.querySelector('.fossil-go-btn').getBoundingClientRect();return {h:r.height,inside:r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,fish:!!document.querySelector('.fish-go-btn')};});
  expect(go.h>=43.5&&go.inside&&!go.fish,'「ほる」ボタンが 不正 '+JSON.stringify(go));
  await H.shot('rock');
  await H.page.locator('.fossil-go-btn').click();await H.page.locator('.dig-wrap canvas').waitFor({timeout:5000});await H.wait(400);
  let st=await H.dbg('digState');expect(st&&st.cols===7&&st.rows===5&&st.taps===0&&!st.done,'ほる 画面が 不正 '+JSON.stringify(st));
  const panel=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),w=r(document.querySelector('.dig-wrap'));return {inside:w.left>=0&&w.right<=innerWidth+1&&w.bottom<=innerHeight+1,text:document.querySelector('.dig-info').innerText};});
  expect(panel.inside&&/タップ/.test(panel.text)&&/たたいた かず 0/.test(panel.text),'ほる 画面が はみ出す '+JSON.stringify(panel));
  const before=(await H.dbg('saveData'));
  st=await digAll(H);await H.shot('dug');
  // 骨なら カード、おまけなら ひとこと（どちらも いわは きえる）
  await H.until(()=>!!document.querySelector('.bone-card')||!!document.querySelector('.dlg-shade'),8000);
  if(await H.eval(()=>!!document.querySelector('.bone-card'))){await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);}
  await H.dialogs();await H.idle();
  let d=await H.dbg('saveData');
  const gotBone=Object.values(d.fossil.bones).reduce((a,n)=>a+n,0)===Object.values(before.fossil.bones).reduce((a,n)=>a+n,0)+1,gotExtra=d.coins>before.coins||(d.bag.candy||0)>(before.bag.candy||0);
  expect(gotBone!==gotExtra,'ほった あとに 骨か おまけが 1つ もらえない');
  expect(d.fossil.dug.at.cave.includes(spot.rock.join(','))&&(await H.dbg('fossilRocks','cave')).length===3,'ほった いわが きえない');
  expect(await H.eval(([x,y])=>G.scene.walkable(x,y)&&!document.querySelector('.fossil-go-btn'),spot.rock),'ほった いわが のこって いる');
  // ティラノサウルスの あたまを ほる → はじめて！ の カード（あつまりぐあい・骨格の 小さい 絵）
  const had=d.fossil.bones['trex.skull']||0;
  await noDig(H);await H.dbg('fossilDig','cave','trex.skull');await H.page.locator('.dig-wrap canvas').waitFor({timeout:5000});await H.wait(400);
  await H.shot('dig');
  st=await digAll(H);
  const info=await H.eval(()=>document.querySelector('.dig-info').innerText);expect(/ティラノサウルスの あたま！/.test(info)&&/★/.test(info),'ほりだした ときの ことばが 不正 '+info);
  await H.page.locator('.bone-card').waitFor({timeout:6000});await H.wait(300);
  const card=await H.eval(()=>{const e=document.querySelector('.bone-card'),b=e.getBoundingClientRect();return {text:e.innerText,first:!!e.querySelector('.badge'),mini:!!e.querySelector('svg.mini'),inside:b.left>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1};});
  const n=Object.keys((await H.dbg('saveData')).fossil.bones).filter(k=>k.startsWith('trex.')).length;
  expect(/ティラノサウルスの あたま/.test(card.text)&&card.text.includes(n+'/8')&&card.mini&&card.inside&&card.first===(had===0),'みつけた カードが 不正 '+JSON.stringify(card));
  await H.shot('card');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.idle();
  d=await H.dbg('saveData');expect(d.fossil.bones['trex.skull']===had+1,'ほった 骨が もてない');
  // とちゅうで とじると なにも もらえない（しっぱいは ない・また ほれる）
  await noDig(H);await H.dbg('fossilDig','cave','trex.leg');await H.page.locator('.dig-wrap canvas').waitFor({timeout:5000});await H.wait(300);
  await H.dbg('digTap',3,2);await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(400);await H.idle();
  expect(((await H.dbg('saveData')).fossil.bones['trex.leg']||0)===(d.fossil.bones['trex.leg']||0)&&!(await H.dbg('digState')),'とちゅうで とじたのに 骨が もらえた');
  // ② おねがい「ほねを みせて」: ケロスケに たのまれる → ほる → ケロスケに 話すと おわる（コイン +150）
  await H.dbg('folkOffer','ev-bone-show');await folkTalk(H,'explorer',{greet:false});await folkAnswer(H,0);await H.dialogs();await H.idle();
  expect((await H.dbg('folk')).req.some(r=>r.id==='ev-bone-show'),'ほねを みせての おねがいを うけられない');
  await noDig(H);await H.dbg('fossilDig','forest','stego.tail');await H.page.locator('.dig-wrap canvas').waitFor({timeout:5000});await H.wait(300);await digAll(H);
  await H.page.locator('.bone-card').waitFor({timeout:6000});await H.wait(200);await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.dialogs();await H.idle();
  expect((await H.dbg('folk')).req.find(r=>r.id==='ev-bone-show')?.step===1,'ほっても おねがいが すすまない');
  const coins=(await H.dbg('state')).coins;
  await folkTalk(H,'explorer',{greet:false});await H.dialogs();await H.idle();
  expect((await H.dbg('saveData')).folk.done['ev-bone-show']&&(await H.dbg('state')).coins===coins+150,'ケロスケに みせても おねがいが おわらない');
  // ノート: ティラノサウルスが「ほね n/8」
  await H.phone('ずかん');
  await H.page.locator('.dex-kinds .tab[data-k="fossil"]').click();await H.wait(400);
  const cnt=await H.eval(()=>document.querySelector('.fossil-cell[data-id="trex"] .cnt').textContent);expect(cnt==='ほね '+n+'/8','ノートに ほった 骨が のらない '+cnt);
  await H.page.keyboard.press('Escape');await H.wait(300);
  // セーブして よみこんでも ピッケル・骨・ほった いわは そのまま
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  const after=await H.dbg('saveData');expect(after.fossil.pick===1&&after.fossil.bones['trex.skull']===had+1&&after.fossil.dug.at.cave.includes(spot.rock.join(',')),'セーブで 化石の きろくが きえる');
},{viewport,full:viewport.width===375,timeout:180000});

// ④ 3番: ケロスケの 物々交換（だぶった 骨 → 同じ 恐竜の まだ ない 骨）。カードは はみ出さない・もらった 骨は カードと ノートに
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('fossil-trade-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  await H.dbg('pick',1);await H.dbg('fossilGive','trex.skull',2);await H.dbg('fossilGive','trex.tail1');
  await H.dbg('folkOffer','bt-explorer-bone');await folkTalk(H,'explorer');await H.dialogs();
  await H.page.waitForSelector('.choices .btn',{timeout:8000});await H.wait(200);
  const card=await H.eval(()=>{const e=document.querySelector('.folk-trade'),b=e.getBoundingClientRect(),p=document.querySelector('.dlg-box,.dlg')?.getBoundingClientRect();return {text:e.innerText,inside:b.left>=0&&b.right<=innerWidth+1&&b.top>=0,svgs:e.querySelectorAll('svg').length,wide:document.documentElement.scrollWidth>innerWidth};});
  expect(/ティラノサウルスの あたま/.test(card.text)&&/ティラノサウルスの くび/.test(card.text)&&card.inside&&card.svgs===2&&!card.wide,'こうかんの カードが 不正 '+JSON.stringify(card));
  await H.shot('offer');
  await H.choose(0);
  await H.page.locator('.bone-card').waitFor({timeout:6000});await H.wait(300);
  const got=await H.eval(()=>{const e=document.querySelector('.bone-card'),b=e.getBoundingClientRect();return {text:e.innerText,first:!!e.querySelector('.badge'),inside:b.left>=0&&b.right<=innerWidth+1};});
  expect(/ティラノサウルスの くび/.test(got.text)&&got.text.includes('3/8')&&got.first&&got.inside,'もらった 骨の カードが 不正 '+JSON.stringify(got));
  await H.shot('card');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.dialogs();await H.idle();
  const d=await H.dbg('saveData');
  expect(d.fossil.bones['trex.skull']===1&&d.fossil.bones['trex.neck']===1&&d.folk.barter['bt-explorer-bone']===1,'こうかんで 骨が かわらない '+JSON.stringify(d.fossil.bones));
  // だぶりが なくなったら もう もちかけない
  expect(await H.eval(()=>!TownFolk.canGive(TOWNSFOLK_DATA.barter.find(b=>b.id==='bt-explorer-bone').give)),'だぶりが ないのに こうかん できる');
},{viewport,full:viewport.width===375,timeout:120000});

// ⑤ 1番（UI-05）: すいぞくかんは サンシャインいけぶ 12F。みなとの 建物は おひっこしの おしらせ → いけぶの エレベーターで 12F → いりぐちの 案内・BGM → 13F の へや → エレベーターで 1F → 外（池袋）
async function aquaVisit(H){
  await H.dbg('teleport','harbor',5,32,'up');await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='harbor'&&PokaDebug.idle(),10000);
  const hb=await H.eval(()=>{const b=G.scene.map.def.buildings.find(b=>b.id==='harbor_aquarium');return b&&{label:b.label,act:b.act};});
  expect(hb&&hb.act.type==='visit'&&/12かい/.test(hb.act.text)&&/おひっこし/.test(hb.label),'みなとの すいぞくかんが おひっこしの おしらせに なって いない '+JSON.stringify(hb));
  await H.dbg('venue','mall',1);await H.idle();await H.until(()=>PokaDebug.venueIso()?.ready,20000);
  await H.dbg('venueVisit','エレベーター');await H.page.getByRole('button',{name:/^12F/}).click();
  await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===12&&!s.changingFloor;},20000);await H.until(()=>PokaDebug.venueIso()?.ready&&PokaDebug.idle(),20000);await H.wait(1200);
  const inside=await H.eval(()=>{const r=document.querySelector('.museum-intro')?.getBoundingClientRect();return {bgm:Sound.cur?.name||Sound.want,hud:document.querySelector('.hud').innerText,intro:document.querySelector('.museum-intro')?.innerText||'',introIn:!!r&&r.left>=0&&r.right<=innerWidth+1,leader:PokaDebug.venueIso().leader,wide:document.documentElement.scrollWidth>innerWidth};});
  expect(inside.bgm==='aquarium'&&/12F/.test(inside.hud)&&/いりぐち/.test(inside.intro)&&inside.introIn&&inside.leader.join()==='2,12'&&!inside.wide,'12F の すいぞくかんが 不正 '+JSON.stringify(inside));
  await H.shot('aquarium-entrance');
  // ぐるっと 一周: 12F の トンネルの さきの かいだんで 13F へ → 13F の かいだんで 12F の おみやげの よこへ おりる
  const at=async(fl,xy)=>{await H.until(f=>{const s=PokaDebug.venueState();return s?.floor===f&&!s.changingFloor&&PokaDebug.idle();},30000,fl);const v=await H.dbg('venueIso');expect(v.leader.join()===xy,fl+'F の かいだんの ついた 場所 '+v.leader);};
  expect(await H.dbg('venueVisit','13Fへ のぼる'),'13F への かいだんが ない');await at(13,'30,23');
  expect(await H.dbg('venueVisit','12Fへ おりる'),'12F への かいだんが ない');await at(12,'21,23');
  // フロアマップ: 13F の テラスを えらぶと かいだんで 13F へ いって あるく（13F へは エレベーターが いかない）
  await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
  const tabs=await H.eval(()=>[...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map(b=>b.textContent).join());expect(tabs==='1F,2F,3F,12F,13F','フロアマップの 階 '+tabs);
  await H.page.getByRole('button',{name:'13F',exact:true}).click();await H.page.locator('.mall-guide .mg-spot[data-label="てんくうの テラス"]').click();
  await H.until(()=>{const s=PokaDebug.venueState(),v=PokaDebug.venueIso();return s?.floor===13&&!s.changingFloor&&v.leader[0]<10&&PokaDebug.idle();},30000);await H.wait(900);
  expect((await H.dbg('museumState')).rooms.includes('aquarium.ike13_sky'),'テラスの 案内が 出ない');
  await H.shot('aquarium-terrace');
  // 13F の へや（案内は 1かいだけ）
  await H.dbg('museumGo','aquarium','river');await H.until(()=>PokaDebug.venueState()?.floor===13&&PokaDebug.idle(),20000);await H.wait(1400);
  expect((await H.dbg('museumState')).rooms.includes('aquarium.ike13_river'),'13F の へやの 案内が 出ない');
  await H.shot('aquarium-river');
  await H.dbg('museumGo','aquarium');await H.until(()=>PokaDebug.venueState()?.floor===12&&PokaDebug.idle(),20000);await H.wait(500);
  expect(!(await H.dbg('museumState')).intro,'2かいめも 入口の 案内が 出る');
  // エレベーターで 1F → 外へ（池袋の サンシャインいけぶの まえ）
  await H.dbg('venueVisit','エレベーター');await H.page.getByRole('button',{name:'1F',exact:true}).click();await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===1&&!s.changingFloor;},20000);await H.idle();
  await H.dbg('venueVisit','たてものを でる');await H.until(()=>PokaDebug.state().map==='city'&&PokaDebug.idle(),20000);
}
// ⑤ 1番: すいぞくかん・はくぶつかんに 入って 出る（町の 入口 → 館の 入口と 案内 → へや → 出口 → 町の 入口の まえ）。3人いっしょ・敵なし・館の BGM
async function museumVisit(H,{map,door,front,id,label,arrive,exit,room}){
  await H.dbg('teleport',map,front[0],front[1],'up');await H.until(m=>G.sceneName==='world'&&G.scene.mapId===m&&PokaDebug.idle(),10000,map);
  const b=await H.eval(i=>{const b=G.scene.map.def.buildings.find(b=>b.act?.map===i);return b&&{label:b.label,act:b.act,door:[b.x+b.door,b.y+b.h-1]};},id);
  expect(b&&b.act.type==='indoor'&&b.label===label&&b.door.join()===door.join(),`${map}に ${label}が ない `+JSON.stringify(b));
  await H.wait(600);await H.shot(id+'-outside');
  expect(await H.dbg('walkTo',door[0],door[1]),label+'の 入口へ 歩けない');
  await H.until(i=>G.sceneName==='world'&&G.scene.mapId===i&&PokaDebug.idle(),15000,id);await H.wait(1200);
  const w=await H.dbg('world');
  const inside=await H.eval(()=>{const r=document.querySelector('.museum-intro')?.getBoundingClientRect();return {bgm:Sound.cur?.name||Sound.want,enemies:G.scene.enemies.length,hud:document.querySelector('.hud').innerText,intro:document.querySelector('.museum-intro')?.innerText||'',introIn:!!r&&r.left>=0&&r.right<=innerWidth+1,
    ex:G.scene.map.sprites.filter(s=>s.kind==='exhibit').length,ready:G.scene.map.sprites.filter(s=>s.kind==='exhibit'&&G.scene.spriteCanvas(s,false)).length,wide:document.documentElement.scrollWidth>innerWidth};});
  expect(w.party.length===3&&w.party[0].x===arrive[0]&&w.party[0].y===arrive[1],label+'の 入口に 3人で 立たない '+JSON.stringify(w.party));
  expect(inside.bgm===id&&inside.enemies===0&&inside.hud.includes(label)&&/いりぐち/.test(inside.intro)&&inside.introIn&&inside.ex>=10&&inside.ready===inside.ex&&!inside.wide,label+'の 中が 不正 '+JSON.stringify(inside));
  await H.shot(id+'-entrance');
  // へや（案内は 1かいだけ）
  await H.dbg('museumGo',id,room);await H.until(i=>G.sceneName==='world'&&G.scene.mapId===i&&PokaDebug.idle(),10000,id);await H.wait(1200);
  expect((await H.dbg('museumState')).rooms.includes(id+'.'+room),label+'の へやの 案内が 出ない');
  await H.shot(id+'-'+room);
  // 出口から 出ると 町の 入口の まえ
  await H.dbg('museumGo',id);await H.until(i=>G.sceneName==='world'&&G.scene.mapId===i&&PokaDebug.idle(),10000,id);await H.wait(400);
  expect(!(await H.dbg('museumState')).intro,'2かいめも 入口の 案内が 出る');
  expect(await H.dbg('walkTo',exit[0],exit[1]),label+'の 出口へ 歩けない');
  await H.until(m=>G.sceneName==='world'&&G.scene.mapId===m&&PokaDebug.idle(),15000,map);
  const out=await H.dbg('world');expect(out.party[0].x===front[0]&&out.party[0].y===front[1],label+'から 出ると 入口の まえに もどらない '+JSON.stringify(out.party[0]));
}
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('museum-visit-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  await aquaVisit(H);
  const mu=await H.eval(()=>{const b=MAP_DEFS.city.buildings.find(b=>b.id==='city_museum');return [b.x+b.door,b.y+b.h-1];});
  await museumVisit(H,{map:'city',door:mu,front:[mu[0],mu[1]+1],id:'museum',label:'きょうりゅう はくぶつかん',arrive:[17,32],exit:[17,33],room:'hall'});
  // セーブして よみこんでも 入った へやの きろくは のこる
  const seen=(await H.dbg('museumState')).rooms;expect(['aquarium.ike12_lobby','aquarium.ike13_river','aquarium.ike13_sky','museum.entrance','museum.hall'].every(k=>seen.includes(k)),'入った へやの きろく '+seen);
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  expect((await H.dbg('museumState')).rooms.join()===seen.join(),'入った へやの きろくが きえる');
},{viewport,full:viewport.width===375,timeout:180000});

// ⑤ 2番: 寄贈。いけすの アユを かんちょうに → 水そうで およぐ・いけすから へる。コンプソグナトゥスの 骨 2つを はかせに → かんせい。寄贈しても ノートは そろった まま
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('museum-donate-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  await H.dbg('fishGive','ayu',2);await H.dbg('fishGive','magoi');
  await H.dbg('museumGo','aquarium');await H.until(()=>G.sceneName==='venue'&&PokaDebug.venueState()?.floor===12&&PokaDebug.idle(),20000);await H.wait(800);
  expect(await H.dbg('museumDonate'),'かんちょうに 話しかけられない');await H.dialogs();
  await H.page.locator('.dn-grid').waitFor({timeout:8000});await H.wait(300);
  let v=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),cells=[...document.querySelectorAll('.dn-cell')],go=document.querySelector('.dn-foot .btn');
    return {cells:cells.map(c=>[c.dataset.key,c.querySelector('.tag').textContent,c.disabled]),tall:cells.every(c=>r(c).height>=43.5)&&r(go).height>=43.5,inside:cells.every(c=>r(c).left>=0&&r(c).right<=innerWidth+1),go:go.textContent,off:go.disabled,head:document.querySelector('.dn-head').innerText};});
  expect(v.cells.length===2&&v.cells.every(c=>c[1]==='はじめて！'&&!c[2])&&v.tall&&v.inside&&v.off&&/0 \/ 50/.test(v.head),'寄贈の 画面が 不正 '+JSON.stringify(v));
  expect(await H.dbg('museumPick','ayu'),'アユを えらべない');await H.wait(200);
  expect((await H.eval(()=>document.querySelector('.dn-foot .btn').textContent))==='アユを きふする','きふする ボタンの ことばが 不正');
  await H.shot('pick-fish');
  expect(await H.dbg('museumConfirm'),'きふ できない');await H.wait(300);await H.dialogs();await H.wait(300);
  let d=await H.dbg('saveData');expect(d.museum.fish.ayu&&d.fish.keep.ayu===1&&d.fish.dex.ayu.n===2,'アユの 寄贈が 不正 '+JSON.stringify({m:d.museum.fish,k:d.fish.keep}));
  v=await H.eval(()=>[...document.querySelectorAll('.dn-cell')].map(c=>[c.dataset.key,c.querySelector('.tag').textContent,c.disabled]));
  expect(v.find(c=>c[0]==='ayu')[1]==='きふずみ'&&v.find(c=>c[0]==='ayu')[2],'寄贈した 魚が「きふずみ」に ならない '+JSON.stringify(v));
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.idle();
  // 水そう（13F かわの ながれ）に アユが およぐ
  await H.dbg('museumGo','aquarium','river');await H.until(()=>G.sceneName==='venue'&&PokaDebug.venueState()?.floor===13&&PokaDebug.idle(),20000);await H.wait(1400);
  const swim=await H.dbg('aquaTank','aq_flow');expect(swim&&swim.here&&swim.floor===13&&swim.fish.join()==='ayu','水そうに アユが いない '+JSON.stringify(swim));
  await H.shot('swim');
  // はかせ: コンプソグナトゥスの あたまと からだ → かんせい
  await H.dbg('fossilGive','compso.head');await H.dbg('fossilGive','compso.body');
  await H.dbg('museumGo','museum');await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='museum'&&PokaDebug.idle(),10000);await H.wait(800);
  expect(await H.dbg('museumDonate'),'はかせに 話しかけられない');await H.dialogs();
  await H.page.locator('.dn-list').waitFor({timeout:8000});await H.wait(300);
  v=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),rows=[...document.querySelectorAll('.dn-row')];return {rows:rows.map(x=>[x.dataset.key,x.innerText]),inside:rows.every(x=>r(x).left>=0&&r(x).right<=innerWidth+1&&r(x).height>=43.5)};});
  expect(v.rows.length===2&&/コンプソグナトゥスの あたまと くび/.test(v.rows[0][1])&&v.inside,'骨の 寄贈の 画面が 不正 '+JSON.stringify(v));
  await H.dbg('museumPick','compso.head');await H.wait(200);await H.shot('pick-bone');
  await H.dbg('museumConfirm');await H.wait(300);await H.dialogs();await H.wait(300);
  await H.dbg('museumPick','compso.body');await H.dbg('museumConfirm');await H.wait(300);await H.dialogs();
  await H.page.locator('.dn-done').waitFor({timeout:8000});await H.wait(300);
  v=await H.eval(()=>{const e=document.querySelector('.dn-done'),b=e.getBoundingClientRect();return {text:e.innerText,inside:b.left>=0&&b.right<=innerWidth+1};});
  expect(/コンプソグナトゥスの がいこつが かんせい！/.test(v.text)&&/まめちしき/.test(v.text)&&v.inside,'かんせいの 画面が 不正 '+JSON.stringify(v));
  await H.shot('done');
  await H.page.getByRole('button',{name:'ホールで みる',exact:true}).click();await H.wait(300);await H.dialogs();await H.idle();
  d=await H.dbg('saveData');expect(d.museum.done.compso&&d.museum.bones['compso.head']&&!d.fossil.bones['compso.head']&&!d.fossil.bones['compso.body'],'骨の 寄贈・かんせいが 不正');
  const st=await H.dbg('museumState');expect(st.fish===1&&st.bones===2&&st.done.join()==='compso','museumState が 不正 '+JSON.stringify(st));
  // 寄贈しても ノートは そろった まま（寄贈した 骨も 数える）
  await H.phone('ずかん');
  await H.page.locator('.dex-kinds .tab[data-k="fossil"]').click();await H.wait(400);
  expect((await H.eval(()=>document.querySelector('.fossil-cell[data-id="compso"] .cnt').textContent))==='そろった！','寄贈すると ノートから 骨が きえる');
  await H.page.keyboard.press('Escape');await H.wait(300);
  // 骨格の 台に コンプソグナトゥス（ぜんぶ 骨の 色）
  expect(await H.eval(()=>Museum.shown(G.scene,G.scene.map.sprites.find(x=>x.o?.dino==='compso').o))==='11','骨格の 台に 反映されない');
  await H.dbg('teleport','museum',9,14,'left');await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);await H.wait(1200);await H.shot('hall');
  // セーブして よみこんでも 寄贈は のこる
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  const after=await H.dbg('museumState');expect(after.fish===1&&after.bones===2&&after.done.join()==='compso','セーブで 寄贈が きえる');
},{viewport,full:viewport.width===375,timeout:180000});

// ⑤ 3番: 展示を しらべる。水そう（ok キーで）→ 中の 魚（まだは ？？？）→ ③ の ずかん（すいぞくかんに いるよ）・化石の かべ → 説明・骨格の 台 → ④ の くわしい ページ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('museum-show-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  await H.dbg('fishGive','ayu');await H.dbg('museumGive','fish','ayu');await H.dbg('museumGive','bone','trex.skull');
  // かわの ながれ（aq_flow: 13〜23, 1〜2）の まえで 上を むいて ok
  await H.dbg('museumGo','aquarium','river');await H.until(()=>G.sceneName==='venue'&&PokaDebug.venueState()?.floor===13&&PokaDebug.idle(),20000);await H.wait(1400);
  expect(await H.dbg('museumShow','aq_flow'),'水そうを しらべられない');await H.page.locator('.ex-card').waitFor({timeout:6000});await H.wait(300);
  let v=await H.eval(()=>{const e=document.querySelector('.ex-card'),b=e.getBoundingClientRect(),fish=[...e.querySelectorAll('.ex-fish')];return {say:e.querySelector('.say').innerText,plate:e.querySelector('.plate').innerText,fish:fish.map(x=>[x.dataset.key,x.innerText,x.disabled]),inside:b.left>=0&&b.right<=innerWidth+1,tall:fish.every(x=>x.getBoundingClientRect().height>=43.5),svg:!!e.querySelector('.art svg')};});
  expect(/7しゅの うち 1しゅ/.test(v.say)&&v.plate==='かわと たき'&&v.fish.length===7&&v.fish[0][1]==='アユ'&&!v.fish[0][2]&&v.fish.slice(1).every(x=>x[1]==='？？？'&&x[2])&&v.inside&&v.tall&&v.svg,'水そうの 説明が 不正 '+JSON.stringify(v));
  await H.shot('tank');
  await H.page.locator('.ex-fish[data-key="ayu"]').click();await H.page.locator('.fish-detail').waitFor({timeout:6000});await H.wait(300);
  expect(/すいぞくかんに いるよ/.test(await H.eval(()=>document.querySelector('.fish-detail').innerText)),'ずかんに「すいぞくかんに いるよ」が ない');
  await H.shot('dex');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(250);await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.idle();
  // 展示を タップ（ほんとうの タップ）→ となりまで 歩いて 説明（かわの そこ aq_bed）
  const bed=await H.dbg('venuePoint',0,0,'かわの そこ');await H.page.touchscreen.tap(bed.x,bed.y);
  await H.page.locator('.ex-card').waitFor({timeout:10000});await H.wait(300);
  expect(/かわの そこ/.test(await H.eval(()=>document.querySelector('.modal-wrap:not(.out) .panel-title').innerText)),'タップした 展示の 説明が 出ない');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);await H.idle();
  // はくぶつかん: 化石の かべ（説明）・ティラノサウルスの 台（寄贈した 骨 1 / 8）
  await H.dbg('museumGo','museum');await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='museum'&&PokaDebug.idle(),10000);await H.wait(600);
  expect(await H.dbg('museumShow','mu_f1'),'化石の かべを しらべられない');await H.page.locator('.ex-card.rock').waitFor({timeout:6000});await H.wait(300);
  v=await H.eval(()=>{const e=document.querySelector('.ex-card.rock'),b=e.getBoundingClientRect();return {title:document.querySelector('.modal-wrap:not(.out) .panel-title').innerText,say:e.querySelector('.say').innerText,inside:b.left>=0&&b.right<=innerWidth+1};});
  expect(v.say.length>10&&v.title.length>1&&v.inside,'化石の かべの 説明が 不正 '+JSON.stringify(v));
  await H.shot('info');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);
  expect(await H.dbg('museumShow','mu_trex'),'骨格の 台を しらべられない');await H.page.locator('.fossil-detail').waitFor({timeout:6000});await H.wait(300);
  v=await H.eval(()=>document.querySelector('.fossil-detail').innerText);
  expect(/ティラノサウルス/.test(v)&&/きふされた ほね/.test(v)&&/1 \/ 8/.test(v),'骨格の 台の 説明が 不正 '+v);
  await H.shot('stand');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.wait(300);
  // まだ 寄贈が ない 台も しらべられる（0 / n）
  expect(await H.dbg('museumShow','mu_stego'),'寄贈 0 の 台を しらべられない');await H.page.locator('.fossil-detail').waitFor({timeout:6000});
  expect(/0 \/ 8/.test(await H.eval(()=>document.querySelector('.fossil-detail').innerText)),'寄贈 0 の 台の 数が 不正');
},{viewport,full:viewport.width===375,timeout:150000});

// ⑥ 1番: 射撃場の ロビー。シティの 建物から 入る → RO の ラビの きまり（はじめて だけ）→ だれが うつ？ → しゅもくと じゅう（タブ・ロック・ホップ ダイヤル）→ これで うつ（2番）→ ✕ で 町の 入口の まえ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('range-lobby-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  const rd=await H.eval(()=>RANGE_DATA.outside.doorAt);
  await H.dbg('teleport','city',rd[0],rd[1]+2,'up');await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='city'&&PokaDebug.idle(),10000);
  const b=await H.eval(()=>{const b=G.scene.map.def.buildings.find(b=>b.id==='city_range');return b&&{label:b.label,act:b.act,door:[b.x+b.door,b.y+b.h-1]};});
  expect(b&&b.act.type==='range'&&b.label==='シティ シューティング レンジ'&&b.door.join()===rd.join(),'池袋に 射撃場が ない '+JSON.stringify(b));
  await H.wait(700);await H.shot('outside');
  expect(await H.dbg('walkTo',rd[0],rd[1]),'射撃場の 入口へ 歩けない');
  await H.until(()=>G.sceneName==='range'&&!Game.trans,15000);
  // はじめて: RO の きまり（ゴーグル・ひきがね・じゅうこう・ショウ クリア）
  await H.page.locator('.dlg-shade').waitFor({timeout:8000});await H.wait(700);
  expect(/ラビ/.test(await H.eval(()=>document.querySelector('.dlg-name').innerText)),'RO の ラビが 話さない');
  await H.shot('safety');await H.dialogs();
  expect(await H.eval(()=>Save.d.range.safety===true),'きまりを きいた ことが のこらない');
  // だれが うつ？（3人。のこりの 2人は おうえん）
  await H.page.locator('.rg-who').waitFor({timeout:8000});await H.wait(400);
  let v=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),cards=[...document.querySelectorAll('.rg-who-card')];return {n:cards.length,on:document.querySelector('.rg-who-card.on')?.dataset.who,lead:Save.d.order[0],
    inView:cards.every(c=>r(c).left>=0&&r(c).right<=innerWidth+0.5&&r(c).height>=44),img:cards.every(c=>c.querySelector('img')?.complete),note:document.querySelector('.rg-note').innerText,wide:document.documentElement.scrollWidth>innerWidth};});
  expect(v.n===3&&v.on===v.lead&&v.inView&&v.img&&/おうえん/.test(v.note)&&!v.wide,'だれが うつ？ が 不正 '+JSON.stringify(v));
  await H.page.locator('.rg-who-card[data-who="goji"]').click();await H.wait(200);await H.shot('who');
  await H.page.getByRole('button',{name:'この子で うつ',exact:true}).click();
  // しゅもくと じゅう（ハンドガン: しゅもく 2つ・じゅう 3しゅ・ホップ ダイヤルは なし。ライフル・スナイパーは まだ ロック）
  await H.page.locator('.rg-guns').waitFor({timeout:8000});await H.wait(400);
  const lobby=()=>H.eval(()=>{const r=e=>e.getBoundingClientRect(),q=s=>[...document.querySelectorAll(s)];return {tabs:q('.rg-tabs .tab').map(t=>t.dataset.cat+(t.classList.contains('on')?'*':'')+(t.classList.contains('lock')?'!':'')),
    courses:q('.rg-course').map(c=>c.dataset.course+(c.classList.contains('on')?'*':'')),guns:q('.rg-gun').map(g=>g.dataset.gun+(g.classList.contains('on')?'*':'')),art:q('.rg-gun .art svg').length,
    rule:document.querySelector('.rg-rule')?.innerText||'',desc:document.querySelector('.rg-detail .desc')?.innerText||'',hop:document.querySelector('.rg-hop .v')?.textContent||null,lock:document.querySelector('.rg-lock')?.innerText||'',
    go:document.querySelector('.rg-go')?.disabled,small:q('.rg-tabs .tab,.rg-course,.rg-gun,.rg-hop .btn,.rg-go').filter(e=>r(e).height<44||r(e).width<44).length,wide:document.documentElement.scrollWidth>innerWidth,
    out:q('.panel .rg-course,.panel .rg-gun,.panel .rg-detail').filter(e=>r(e).left<0||r(e).right>innerWidth+0.5).length};});
  v=await lobby();
  expect(v.tabs.join()==='hand*,rifle!,sniper!'&&v.courses.join()==='steel*,bullseye'&&v.guns.join()==='auto*,revolver,classic'&&v.art===3&&/ストップ プレート/.test(v.rule)&&/25はつ/.test(v.desc)&&v.hop===null&&v.go===false&&!v.small&&!v.wide&&!v.out,'ハンドガンの しゅもくと じゅうが 不正 '+JSON.stringify(v));
  await H.shot('pick');
  await H.page.locator('.rg-course[data-course="bullseye"]').click();await H.page.locator('.rg-gun[data-gun="revolver"]').click();await H.wait(200);
  v=await lobby();expect(v.courses.join()==='steel,bullseye*'&&v.guns.join()==='auto,revolver*,classic'&&/5はつ × 2シリーズ/.test(v.rule)&&/6はつ/.test(v.desc),'しゅもく・じゅうを えらべない '+JSON.stringify(v));
  // ロック: ライフルは ハンドガンで ★1 から
  await H.page.locator('.rg-tabs .tab[data-cat="rifle"]').click();await H.wait(200);
  v=await lobby();expect(/ハンドガンで ★1/.test(v.lock)&&v.go===true&&!v.guns.length,'ロックが 不正 '+JSON.stringify(v));
  await H.page.locator('.rg-tabs .tab[data-cat="hand"]').click();await H.wait(100);
  await H.eval(()=>{Save.d.range.best['steel:auto']={result:31.2,stars:1};});
  await H.page.locator('.rg-tabs .tab[data-cat="rifle"]').click();await H.wait(300);
  v=await lobby();expect(v.tabs.join()==='hand,rifle*,sniper!'&&v.courses.join()==='practical*,precision'&&v.guns.join()==='carbine*,lever,match'&&v.hop==='10'&&!v.small&&!v.out,'ライフルが あかない／ホップ ダイヤルが ない '+JSON.stringify(v));
  await H.page.locator('.rg-hop-up').click();await H.page.locator('.rg-hop-up').click();await H.page.locator('.rg-hop-down').click();await H.wait(100);
  expect((await lobby()).hop==='11'&&await H.eval(()=>Save.d.range.hop.carbine===11),'ホップ ダイヤルが のこらない');
  await H.page.locator('.rg-detail').scrollIntoViewIfNeeded();await H.wait(200);await H.shot('rifle');
  // これで うつ → えらんだ 子・しゅもく・じゅう・ホップで あそぶ 画面（2番）→ ✕（たしかめ）で ロビー → ✕ で だれが うつ？ → ✕ で 町の 入口の まえ
  await H.page.getByRole('button',{name:'これで うつ',exact:true}).click();
  await H.until(()=>PokaDebug.rangeState()?.mode==='play'&&!!document.querySelector('.range-scene'),10000);
  const s=await H.dbg('rangeState');expect(s.course==='practical'&&s.gun==='carbine'&&s.who==='goji'&&s.hop===11,'えらんだ ものと ちがう あそびが はじまる '+JSON.stringify(s));
  await H.page.locator('.range-quit').click();await H.page.locator('.choices .btn').first().waitFor({timeout:6000});await H.choose(0);
  await H.page.locator('.rg-guns').waitFor({timeout:8000});await H.wait(250);
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.page.locator('.rg-who').waitFor({timeout:6000});await H.wait(250);
  expect(await H.eval(()=>document.querySelector('.rg-who-card.on')?.dataset.who==='goji'),'えらんだ 子が もどる');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();
  await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='city'&&PokaDebug.idle(),15000);
  const w=await H.dbg('world');expect(w.party.length===3&&w.party[0].x===rd[0]&&w.party[0].y===rd[1]+1,'射撃場から 出ると 入口の まえに もどらない '+JSON.stringify(w.party[0]));
  // 2かいめは きまりを 話さない・ホップ ダイヤルは のこる
  expect(await H.dbg('walkTo',rd[0],rd[1]),'2かいめ 入口へ 歩けない');await H.until(()=>G.sceneName==='range'&&!Game.trans,15000);
  await H.page.locator('.rg-who').waitFor({timeout:8000});expect(!(await H.eval(()=>document.querySelector('.dlg-shade'))),'2かいめも きまりを 話す');
},{viewport,full:viewport.width===375,timeout:150000});

// ⑥ 2番: 射撃場で あそぶ。スチール（わんこ・オートマチック）を じどうで ★2 いじょう → けっかの シート・きろく・コイン・ライフルが あく。
// ロングレンジ（ごじ・ボルトアクション）: のぞく・ズーム・うつと ボルト・ボルトを うごかす・かぜ。プラクティカル（がちゃん・カービン）: ヒット ファクター・もう いちど・✕ で ロビー
const rangePlaying=(H,course)=>H.until(c=>{const s=PokaDebug.rangeState();return s&&s.mode==='play'&&s.course===c&&!Game.trans;},15000,course);
const rangeHud=(H)=>H.eval(()=>{const r=e=>e.getBoundingClientRect(),q=s=>[...document.querySelectorAll(s)];return {top:document.querySelector('.range-top')?.innerText||'',sub:document.querySelector('.range-sub')?.innerText||'',
  small:q('.range-scene .btn').filter(b=>r(b).width<44||r(b).height<44).map(b=>b.className),out:q('.range-scene .btn,.range-scene .pill,.range-monitor').filter(e=>r(e).left<-0.5||r(e).right>innerWidth+0.5||r(e).bottom>innerHeight+0.5||r(e).top<-0.5).map(e=>e.className),
  over:(()=>{const bs=q('.range-top .pill,.range-top .btn,.range-sub .pill,.range-zoom,.range-monitor,.range-ctrl .btn,.range-breath');const bad=[];for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=r(bs[i]),b=r(bs[j]);if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)bad.push(bs[i].className+'/'+bs[j].className);}return bad;})(),
  fire:Math.round(r(document.querySelector('.range-fire')).width),buddies:q('.range-buddy').map(b=>b.dataset.who),hud:document.querySelector('.hud').classList.contains('hidden'),wide:document.documentElement.scrollWidth>innerWidth};});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('range-play-'+viewport.width,async H=>{
  await H.newGameFast();const coins0=await H.eval(()=>Save.d.coins);
  // シーンを きりかえて いる とちゅう（G.sceneName だけ さきに "range"）でも rangeState は null で こわれない
  const mid=await H.eval(()=>{PokaDebug.range('steel','auto','wanko','t1');try{return PokaDebug.rangeState()===null&&PokaDebug.rangeInput({ads:true})===false&&PokaDebug.rangeAuto(1)===null;}catch(e){return 'throws: '+e.message;}});
  expect(mid===true,'きりかえ ちゅうの 射撃場の PokaDebug が こわれる '+mid);
  await rangePlaying(H,'steel');await H.wait(500);
  let v=await rangeHud(H);
  expect(/ストリング\s*1\/5/.test(v.top)&&/25/.test(v.top)&&!v.small.length&&!v.out.length&&!v.over.length&&v.fire>=92&&v.buddies.join()==='gachan,goji'&&v.hud&&!v.wide,'射撃場の HUD・そうさが 不正 '+JSON.stringify(v));
  await H.shot('steel-standby');
  await H.until(()=>PokaDebug.rangeState().phase==='play',8000);await H.dbg('rangeAuto',2.2,'good');await H.wait(200);await H.shot('steel-play');
  let s=await H.dbg('rangeAuto',90,'good');
  expect(s.phase==='end'&&s.stars>=2&&s.times.length===5,'スチールが おわらない／★が たりない '+JSON.stringify(s));
  await H.page.locator('.rg-result').waitFor({timeout:8000});await H.wait(400);
  v=await H.eval(()=>({rows:document.querySelectorAll('.rg-sheet tr').length,drop:document.querySelectorAll('.rg-sheet .drop').length,best:Save.d.range.best['steel:auto'],plays:Save.d.range.plays,coins:Save.d.coins,text:document.querySelector('.rg-result').innerText,
    says:document.querySelectorAll('.rg-result .say img').length,btns:[...document.querySelectorAll('.rg-foot .btn')].map(b=>Math.round(b.getBoundingClientRect().height)),wide:document.documentElement.scrollWidth>innerWidth}));
  expect(v.rows===7&&v.drop===1&&v.best&&v.best.stars>=2&&v.best.result===s.result&&v.plays===1&&v.coins>coins0&&/コイン/.test(v.text)&&/RO:/.test(v.text)&&v.says===3&&v.btns.length===3&&v.btns.every(h=>h>=44)&&!v.wide,'けっかが 不正 '+JSON.stringify(v));
  await H.shot('steel-result');
  // えらびなおす → しゅもくと じゅう（ハンドガンで ★ を とったので ライフルが あく）→ ✕ ✕ で 町
  await H.page.getByRole('button',{name:'えらびなおす',exact:true}).click();await H.page.locator('.rg-guns').waitFor({timeout:8000});
  expect(await H.eval(()=>!document.querySelector('.rg-tabs .tab[data-cat="rifle"]').classList.contains('lock')&&/★★/.test(document.querySelector('.rg-gun.on .best').innerText)),'★ の あと ライフルが あかない／★ が 出ない');
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.page.locator('.rg-who').waitFor({timeout:6000});await H.wait(250);
  await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='city'&&PokaDebug.idle(),15000);
  // ロングレンジ: のぞく → ズーム → うつと ボルトを ひく まで うてない → ボルト
  await H.dbg('range','long','bolt','goji','t2');await rangePlaying(H,'long');
  await H.dbg('rangeInput',{ads:true});await H.wait(700);
  s=await H.dbg('rangeState');expect(s.ads&&s.zoom>1,'のぞけない '+JSON.stringify(s));
  const z0=s.zoom;
  // 入力は次の描画フレームで消費される。300msより遅い更新でも、反映を待ってから判定する。
  await H.dbg('pause',true);expect(await H.dbg('rangeInput',{zoomIn:true}),'ズーム入力を受け付けない');
  await H.eval(()=>{setTimeout(()=>PokaDebug.pause(false),450);});
  await H.until(z=>PokaDebug.rangeState()?.zoom>z,3000,z0);
  s=await H.dbg('rangeState');expect(s.zoom>z0,'ズームが かわらない '+JSON.stringify([z0,s.zoom]));
  // ブザーの あと じゅうを あげる（0.3びょう）まで うてない
  await H.until(()=>{const s=PokaDebug.rangeState();return s.phase==='play'&&s.clock>0.45;},8000);
  v=await rangeHud(H);expect(/いま\s*30m/.test(v.sub)&&/かぜ/.test(v.sub)&&!v.small.length&&!v.out.length&&!v.over.length,'ロングレンジの HUD が 不正 '+JSON.stringify(v));
  // 文字が ひろい ブラウザ（WebKit など）でも うえの 列の ✕ は 44px の まま 画面の 中（字間を ひろげて たしかめる。ピルが いちばん 多い しゅもく。
  // 3.4px は Chromium でも 列に はいりきらない ひろさ → ピルの ほうが ちぢむ ことを たしかめる）
  v=await H.eval(()=>{document.body.style.letterSpacing='3.4px';const r=document.querySelector('.range-quit').getBoundingClientRect(),out={w:r.width,h:r.height,right:r.right,iw:innerWidth};document.body.style.letterSpacing='';return out;});
  expect(v.w>=44&&v.h>=44&&v.right<=v.iw+0.5,'文字が ひろいと ✕ が つぶれる／はみ出す '+JSON.stringify(v));
  await H.dbg('rangeInput',{fire:true});await H.wait(300);
  s=await H.dbg('rangeState');expect(s.needAction===true&&s.shot===1,'うった あと ボルトが いらない '+JSON.stringify(s));
  expect(await H.eval(()=>document.querySelector('.range-act').classList.contains('need')&&document.querySelector('.range-fire').classList.contains('wait')),'ボルトの ボタンが 光らない／うつ が まてに ならない');
  await H.dbg('rangeInput',{fire:true});await H.wait(200);expect((await H.dbg('rangeState')).shot===1,'ボルトを ひく まえに 2はつめが うてる');
  await H.shot('long-bolt');
  await H.dbg('rangeInput',{action:true});await H.until(()=>PokaDebug.rangeState().needAction===false,3000);
  s=await H.dbg('rangeAuto',150,'good');expect(s.phase==='end'&&s.shot===10,'ロングレンジが おわらない '+JSON.stringify(s));
  await H.page.locator('.rg-result').waitFor({timeout:8000});
  await H.page.getByRole('button',{name:'おわる',exact:true}).click();await H.until(()=>G.sceneName==='world'&&G.scene.mapId==='city'&&PokaDebug.idle(),15000);
  const rf=await H.eval(()=>RANGE_DATA.outside.front),w=await H.dbg('world');expect(w.party.length===3&&w.party[0].x===rf[0]&&w.party[0].y===rf[1],'けっかの あと 入口の まえに もどらない '+JSON.stringify(w.party[0]));
  // プラクティカル: ヒット ファクター（A・C・D・ミス・NS）→ もう いちど → ✕（たしかめ）→ ロビー（コインは ふえない）
  await H.dbg('range','practical','carbine','gachan','t3');await rangePlaying(H,'practical');
  s=await H.dbg('rangeAuto',70,'good');expect(s.phase==='end'&&s.result>0,'プラクティカルが おわらない '+JSON.stringify(s));
  await H.page.locator('.rg-sheet').waitFor({timeout:8000});await H.wait(300);
  v=await H.eval(()=>document.querySelector('.rg-sheet').innerText);expect(/A/.test(v)&&/NS/.test(v)&&/ミス/.test(v)&&/じかん/.test(v),'IPSC の シートが 不正 '+v);
  await H.shot('ipsc-result');
  await H.page.getByRole('button',{name:'もう いちど',exact:true}).click();await rangePlaying(H,'practical');
  // SvgCache の キーは 有限: 的は artKeys の 14こ だけ・主観の じゅうは いまの 1まい だけ（まえの じゅうの 絵は すてる）
  v=await H.eval(()=>{const keys=[...SvgCache.map.keys()],art=new Set(ShootingRange.artKeys(RANGE_DATA).map(k=>k.key));return {fpv:keys.filter(k=>k.startsWith('rg:')&&!k.startsWith('rg:staff@')),rt:keys.filter(k=>k.startsWith('rt:')).every(k=>art.has(k.split('@')[0]))};});
  expect(v.fpv.length===1&&v.fpv[0].startsWith('rg:carbine:gachan:soft@')&&v.rt,'射撃場の 絵の キャッシュが 不正 '+JSON.stringify(v));
  const coins1=await H.eval(()=>Save.d.coins);
  await H.page.locator('.range-quit').click();await H.page.locator('.choices .btn').first().waitFor({timeout:6000});await H.choose(0);
  await H.page.locator('.rg-guns').waitFor({timeout:8000});
  expect(await H.eval(c=>Save.d.coins===c&&G.scene.mode==='lobby',coins1),'✕ で やめても コインが ふえる／ロビーに もどらない');
  // セーブして よみこんでも きろくと ホップは のこる
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  v=await H.eval(()=>({best:Object.keys(Save.d.range.best).sort().join(),plays:Save.d.range.plays}));
  expect(v.best==='long:bolt,practical:carbine,steel:auto'&&v.plays===3,'射撃場の きろくが のこらない '+JSON.stringify(v));
},{viewport,full:viewport.width===375,timeout:180000});

// ⑥ 2番: サイトと スコープ（ブルズアイ: あかい ランプと スコア モニター・10m: ダイオプター・ムービング: スコープと まど）。じどうで さいごまで
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('range-sights-'+viewport.width,async H=>{
  await H.newGameFast();
  for(const [course,gun,who,kind] of [['bullseye','revolver','wanko','bull'],['precision','match','goji','issf'],['moving','semi','gachan','run']]){
    await H.dbg('range',course,gun,who,'s-'+course);await rangePlaying(H,course);
    await H.until(()=>PokaDebug.rangeState().phase==='play',8000);await H.dbg('rangeAuto',kind==='run'?9:4,'good');await H.wait(200);
    const v=await rangeHud(H),mon=await H.eval(()=>document.querySelector('.range-monitor')?.innerText||'');
    expect(!v.small.length&&!v.out.length&&!v.over.length&&!v.wide&&(kind==='run'?/ラン/.test(v.top)&&/かぜ/.test(v.sub):/ごうけい/.test(mon)),course+' の HUD が 不正 '+JSON.stringify(v)+mon);
    await H.shot(course);
    const s=await H.dbg('rangeAuto',300,'good');expect(s.phase==='end'&&s.stars>=1,course+' が おわらない '+JSON.stringify(s));
    await H.page.locator('.rg-result').waitFor({timeout:8000});await H.wait(200);
    await H.page.getByRole('button',{name:'おわる',exact:true}).click();await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),15000);
  }
},{viewport,full:viewport.width===375,timeout:150000});

// ⑥ 3番: RO の 号令と 2人の おうえん。メイク レディ → アー ユー レディ？ → スタンバイ…（ブザーまで）→ ブザーで きえる。あたりと のこしの ない ストリングで ひとこと。
// おわると アンロード。ショウ クリア。→ けっか・② に signal（do: "range"）。ブルズアイで のこり 10びょう → いそいで
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('range-ro-'+viewport.width,async H=>{
  await H.newGameFast();
  await H.eval(()=>{window.__rangeSig=[];const o=TownFolk.signal.bind(TownFolk);TownFolk.signal=(s)=>{window.__rangeSig.push(s);return o(s);};});
  const cmd=()=>H.eval(()=>{const e=document.querySelector('.range-cmd');return e&&e.style.display!=='none'?e.innerText:'';});
  await H.dbg('range','steel','auto','wanko','ro1');await rangePlaying(H,'steel');
  expect(/メイク レディ/.test(await cmd()),'はじめに メイク レディ が 出ない '+await cmd());await H.shot('make-ready');
  await H.until(()=>/アー ユー レディ/.test(document.querySelector('.range-cmd').innerText),4000);
  await H.until(()=>/スタンバイ/.test(document.querySelector('.range-cmd').innerText),4000);
  expect(/ブザー/.test(await cmd())&&(await H.dbg('rangeState')).phase==='standby','スタンバイの ことばが 不正');await H.shot('standby');
  await H.until(()=>PokaDebug.rangeState().phase==='play',6000);await H.wait(150);
  expect(!(await cmd()),'ブザーの あとも 号令が のこる');
  // スチールの 1ストリング: あたり 3かいで ひとこと・のこしの ない ストリングで combo（おうえんは えらんで いない 2人）
  let s=await H.dbg('rangeAuto',6,'good');
  const cheers=await H.eval(()=>RANGE_DATA.talk.cheer);
  expect(s.hits>=3&&s.bubble&&['gachan','goji'].includes(s.bubble.who)&&cheers[s.bubble.who][s.bubble.kind].includes(s.bubble.text)&&!/ゾーン/.test(s.bubble.text),'おうえんが 出ない／ことばが ちがう '+JSON.stringify(s.bubble));
  let v=await H.eval(()=>{const b=document.querySelector('.range-bubble'),r=b&&b.getBoundingClientRect();return {text:b?.innerText||'',inView:!!r&&r.left>=0&&r.right<=innerWidth+0.5&&r.top>=0};});
  expect(v.text===s.bubble.text&&v.inView,'ふきだしが 画面に 出ない '+JSON.stringify(v));
  await H.shot('cheer');
  // すぐ おわらせる → アンロード。ショウ クリア。→ けっか（とちゅうの スチールは ★ なし）→ ② に signal
  await H.dbg('rangeEnd');await H.wait(100);
  expect(/アンロード/.test(await cmd())&&!(await H.eval(()=>document.querySelector('.rg-result'))),'おわりに アンロード の 号令が 出ない');await H.shot('unload');
  await H.page.locator('.rg-result').waitFor({timeout:6000});
  v=await H.eval(()=>({sig:window.__rangeSig,best:Save.d.range.best['steel:auto']||null}));
  expect(v.sig.length===1&&v.sig[0].do==='range'&&v.sig[0].stars===0&&!v.best,'けっかの あとの signal／とちゅうの きろくが 不正 '+JSON.stringify(v));
  await H.page.getByRole('button',{name:'おわる',exact:true}).click();await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),15000);
  // ブルズアイ（1シリーズ 2ふん）: うたずに 111びょう → のこり 10びょう いかで「いそいで」
  await H.dbg('range','bullseye','classic','goji','ro2');await rangePlaying(H,'bullseye');await H.until(()=>PokaDebug.rangeState().phase==='play',8000);
  await H.dbg('rangeAuto',111,{tol:0});
  await H.until(()=>PokaDebug.rangeState().bubble?.kind==='hurry',3000);
  s=await H.dbg('rangeState');expect(s.left<=10&&cheers[s.bubble.who].hurry.includes(s.bubble.text)&&['wanko','gachan'].includes(s.bubble.who),'のこり 10びょうで いそいで が 出ない '+JSON.stringify(s));
  await H.shot('hurry');
},{viewport,full:viewport.width===375,timeout:150000});

// ① おうちの 会話データ: まわりの ようすで えらぶ・かけあいは 順番に・3人の くせ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('home-talk-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);await H.dbg('hour',7);await H.dbg('weather','rain');await H.wait(600);await H.dbg('homeBubbleFixture');const before=await H.dbg('saveData');
  const n=await H.dbg('homeLines');expect(n.total>=500&&n.lines>=600&&n.talks>=50,'おうちの 会話が 500 より すくない');
  let start=(await H.dbg('homeTalkLog')).length;
  for(let i=0;i<8;i++){await H.dbg('homeLife','solo');await H.wait(60);}
  const said=(await H.dbg('homeTalkLog')).slice(start).filter(x=>x.line);expect(said.length>=4,'ひとりごとが データから 出ない');
  for(const x of said){const l=await H.dbg('homeLines',x.line);expect(l&&l.who===x.id,'話し手と セリフが あわない');const w=l.when||{};
    expect(!w.time||w.time.includes('morning'),'あさ なのに ほかの 時間の セリフ: '+l.text);expect(!w.weather||w.weather.includes('rain'),'あめ なのに ほかの 天気の セリフ: '+l.text);expect(!w.room||w.room.includes('main'),'ほかの へやの セリフ: '+l.text);}
  // ふだんの かけあい: データから えらび、1.3秒おきに 順番どおり
  await H.wait(4500);start=(await H.dbg('homeTalkLog')).length;await H.dbg('homeLife','chat');await H.wait(150);
  const first=(await H.dbg('homeTalkLog')).slice(start).find(x=>x.talk);expect(first,'かけあいが データから 出ない');
  const talk=await H.dbg('homeLines',first.talk);let got=[];
  for(let i=0;i<40&&got.length<talk.turns.length;i++){await H.wait(200);checkHomeBubbles(await H.dbg('homeBubbleState'));got=(await H.dbg('homeTalkLog')).slice(start).filter(x=>x.talk===first.talk);}
  expect(got.map(x=>x.id).join()===talk.turns.map(t=>t.who).join(),'かけあいの 順番が ちがう: '+first.talk);
  // わんこの クンクン → ままに おこられる
  await H.wait(1500);start=(await H.dbg('homeTalkLog')).length;expect(await H.dbg('homeTalk','sniff-scold'),'かけあい sniff-scold が ない');
  for(let i=0;i<40;i++){await H.wait(200);if((await H.dbg('homeTalkLog')).slice(start).length>=4)break;}
  const scold=(await H.dbg('homeTalkLog')).slice(start);expect(scold.some(x=>x.id==='mama'&&/めっ/.test(x.text))&&scold.at(-1).id==='wanko'&&scold.at(-1).kind==='cry','ままに おこられて しょんぼり しない');
  await H.shot('scold');
  const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn','rooms'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'会話で セーブが 変わる: '+k);
},{viewport,full:viewport.width===375,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('home-bubbles-'+viewport.width,async H=>{
  // 時こくを 固定する（ほんとうの 9:00／18:00 を またぐと ぱぱ・ままの「いってきます／ただいま」の ふきだしが たしかめる ふきだしを おしだす）
  await H.newGameFast();await H.dbg('hour',7);await H.dbg('coins',987504);await H.wait(4000);const before=await H.dbg('saveData');
  for(const watching of [false,true]){
    if(watching)await H.houseButton('みまもる');await H.dbg('homeBubbleFixture');
    for(const [i,kind]of ['say','shout','cry','think','whisper','rare'].entries()){
      const ids=['wanko','gachan','goji'];await H.dbg('homeSay',ids[i%3],'みんな いっしょが いいな！',kind);await H.dbg('homeSay',ids[(i+1)%3],'ぼくも いっしょ！','say');await H.wait(320);
      const st=await H.dbg('homeBubbleState');expect(st.boxes.some(b=>b.kind===kind),'指定した形が表示されない: '+kind);checkHomeBubbles(st);await H.shot((watching?'watch-':'normal-')+kind);
    }
  }
  const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn','rooms'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'吹き出しでセーブが変わる: '+k);
},{viewport,full:viewport.width===375,timeout:120000});

// ART-04: ぱぱ・ままは 9〜18じ おしごとで いない。3人は おるすばん。18じに「ただいま」、9じに「いってきます」
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('parents-work-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.wait(400);await H.dbg("needs",20);
  let w=await H.dbg("parentWork");
  expect(w.away&&w.phase==="away"&&w.visible.length===0,"12じ なのに ぱぱ・ままが いる "+JSON.stringify(w));
  expect(w.label==="おしごと ちゅう","ボタンが「おしごと ちゅう」に ならない "+w.label);
  const btn=H.page.getByRole("button",{name:"おしごと ちゅう",exact:true}),r=await btn.boundingBox();
  expect(r&&r.height>=44&&r.x>=0&&r.x+r.width<=viewport.width,"「おしごと ちゅう」の ボタンが 小さい／はみ出す");
  await btn.click();await H.wait(250);
  expect(await H.page.getByText("ぱぱと ままは おしごとに いって いるよ",{exact:false}).count()>0,"おしごとの せつめいが 出ない");
  await H.shot("away-modal");await H.page.getByRole("button",{name:"わかった！",exact:true}).click();
  const care=JSON.stringify((await H.dbg("family")).lastCare);
  let start=(await H.dbg("homeTalkLog")).length;await H.dbg("parentWork","alone");await H.wait(2600);
  let log=(await H.dbg("homeTalkLog")).slice(start);
  expect(log.length>=1&&log.every(x=>["wanko","gachan","goji"].includes(x.id)),"おるすばんの ひとりごとが 出ない "+JSON.stringify(log));
  start=(await H.dbg("homeTalkLog")).length;await H.dbg("parentWork","talk");await H.wait(8400);
  log=(await H.dbg("homeTalkLog")).slice(start);expect(log.length>=3,"おるすばんの かけあいが 出ない "+JSON.stringify(log));
  await H.shot("rusuban");
  expect(JSON.stringify((await H.dbg("family")).lastCare)===care,"おしごと ちゅうに ぱぱ・ままが おせわ した");
  start=(await H.dbg("homeTalkLog")).length;expect(await H.dbg("homeTalk","bath")===false,"おしごと ちゅうに ぱぱ・ままの かけあいが はじまる");await H.wait(1500);
  expect(!(await H.dbg("homeTalkLog")).slice(start).some(x=>x.id==="papa"||x.id==="mama"),"いない ぱぱ・ままが しゃべった");
  // PokaDebug.hour で とばすと すぐ かわる（えんしゅつなし）
  await H.dbg("hour",19);await H.wait(300);w=await H.dbg("parentWork");
  expect(!w.away&&w.phase==="home"&&w.visible.length===2&&w.label==="ぱぱ・まま","19じ なのに ぱぱ・ままが いない "+JSON.stringify(w));
  // 18じの「ただいま」: ドアから 入って きて、3人が「おかえり」
  start=(await H.dbg("homeTalkLog")).length;await H.dbg("parentWork","arrive");await H.wait(1200);await H.shot("tadaima");await H.wait(4600);
  log=(await H.dbg("homeTalkLog")).slice(start);w=await H.dbg("parentWork");
  expect(log.some(x=>x.id==="papa"&&/ただいま/.test(x.text))&&log.some(x=>/おかえり/.test(x.text))&&w.phase==="home"&&w.visible.length===2,"ただいまの ばめんが 出ない "+JSON.stringify([log,w]));
  // 9じの「いってきます」: ドアへ あるいて いなく なる
  await H.dbg("hour",10);await H.wait(300);start=(await H.dbg("homeTalkLog")).length;await H.dbg("parentWork","leave");await H.wait(1500);await H.shot("ittekimasu");await H.wait(4600);
  log=(await H.dbg("homeTalkLog")).slice(start);w=await H.dbg("parentWork");
  expect(log.some(x=>x.id==="papa"&&/いってきます/.test(x.text))&&log.some(x=>/いってらっしゃ/.test(x.text))&&w.phase==="away"&&w.visible.length===0,"いってきますの ばめんが 出ない "+JSON.stringify([log,w]));
  await H.dbg("hour",null);
},{viewport,full:viewport.width===375,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`ぱぱまま・吹き出し・セーブ（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",20);await H.dbg("coins",987504);await H.dbg("needs",20);
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
  // 3人が 出る かけあい（fall-down）を 流して、2つまで・順番に 出る ことを たしかめる（ふだんの かけあいは データから えらぶので 3人 そろうとは かぎらない）
  await H.houseButton("みまもる");const logStart=(await H.dbg('homeTalkLog')).length;expect(await H.dbg('homeTalk','fall-down'),'かけあい fall-down が ない');
  for(let i=0;i<7;i++){await H.wait(450);const f=await H.dbg('family');expect(f.bubbles.length<=2,'同時に3つ以上の吹き出し');checkHomeBubbles(await H.dbg('homeBubbleState'));}
  const spoken=(await H.dbg('homeTalkLog')).slice(logStart);expect(['wanko','gachan','goji'].every(id=>spoken.some(x=>x.id===id)),'順番に3人の会話が出ない');
  await H.shot('family-bubbles');
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
    await H.dbg("teleport","town",20,60);await H.idle();
    await H.phone("イベント");
    expect(await H.page.locator(".annual-months .btn").count()===12,"年間予定が12種類ない");
    await H.page.getByRole("button",{name:"この おまつりに さんか",exact:true}).click();await H.idle();
    const s=await H.dbg("annual");expect(s.joined&&!s.claimed,"おまつりに参加できない");
    for(const t of s.targets) {
      await H.dbg("teleport",t.map,t.x-1,t.y);await H.idle();
      const o=(await H.dbg("world")).objects.find(o=>o.id===t.id);await H.tap(o.cx,o.cy);
      await H.page.getByRole("button",{name:t.choices[month%2],exact:true}).click();
      await H.until(id=>!!PokaDebug.annual().stamps[id],10000,t.id);
    }
    await H.phone("イベント");
    expect(await H.page.getByRole("heading",{name:s.name,exact:true}).count()===1,"イベント名が表示されない");
    if(month===7||month===10)await H.shot(s.id+"-festival");
    await H.page.getByRole("button",{name:"おまつりの きねんひんを うけとる",exact:true}).click();
    const won=await H.dbg("annual");expect(won.count===3&&won.claimed&&won.inventory.wear&&won.inventory.furn===1&&won.inventory.food===3,"限定品がそろわない");
    expect(await H.page.getByRole("button",{name:"おまつりの きねんひんは うけとりずみ",exact:true}).isDisabled(),"2回受け取れる");
    expect(!(await H.eval(()=>document.documentElement.scrollWidth>innerWidth)),"おまつり画面がはみ出す");
    await H.page.getByRole("button",{name:"1がつ　おしょうがつ",exact:true}).click();
    if(month!==1)expect(await H.page.getByRole("button",{name:"この おまつりに さんか",exact:true}).count()===0,"期間外でも参加できる");
    if(month===10){await H.page.locator(".annual-months").scrollIntoViewIfNeeded();await H.wait(2400);await H.shot("year-calendar");}
    // 切替前のモーダルは閉じる演出の180msだけDOMに残る。操作中の画面を選ぶ。
    await H.page.locator(".modal-wrap:not(.out)").getByRole("button",{name:"とじる",exact:true}).click();await H.idle();
    expect((await H.dbg("state")).coins===money,"おまつりでおかねが変わった");
  }
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  await H.dbg("calendar","2026-10-31");const saved=await H.dbg("annual");expect(saved.claimed&&saved.inventory.furn===1,"再開で記録が消えた");
  await H.dbg("calendar","2027-10-01");const next=await H.dbg("annual");expect(!next.claimed&&next.count===0&&next.inventory.furn===1,"翌年に品が消えた");
  expect((await H.dbg("state")).coins===money,"再開でおかねが変わった");
},{viewport,full:viewport.width===375,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`天気・四季・予報（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("coins",987504);
  await H.dbg("teleport","town",20,60);await H.idle();await H.wait(3200);
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
  await H.dbg("homeLife","weather");{const x=(await H.dbg("homeTalkLog")).at(-1),l=x&&x.line?await H.dbg("homeLines",x.line):null;expect(x&&(x.talk==="thunder"||(l&&l.when&&l.when.weather&&l.when.weather.includes("rain"))||/あめ|しずく/.test(x.text)),"天気のひとことがない");}
  await H.dbg("teleport","town",20,60);await H.idle();expect((await H.dbg("weather")).particles===48,"外で雨が復帰しない");
  await H.dbg("calendar",null);const natural=await H.dbg("weather",null);await H.dbg("save");
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  const restored=await H.dbg("weather"),samePeriod=restored.forecast[0].day===natural.forecast[0].day&&restored.forecast[0].hour===natural.forecast[0].hour;
  expect(!samePeriod||restored.kind===natural.kind,"再開で同じ時間帯の天気が変わった");
  expect((await H.dbg("state")).coins===money,"天気や再開でおかねが変わった");
},{viewport,full:viewport.width===375,timeout:90000});

// ART-03: 家具の 立体モデル（まるい ラグ・天がい・キッチン・ピアノ など）が 部屋に 出る。床の 大きさは かわらない
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('furniture-art-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("pause",true);await H.dbg("unlockAll");
  const rooms=[
    [{id:"window",x:190,y:116},{id:"clock",x:330,y:90},{id:"poster",x:80,y:110},{id:"rug_round",x:220,y:430},{id:"bed_simple",x:80,y:330},{id:"table_wood",x:230,y:410},{id:"plant",x:420,y:290},{id:"lamp",x:160,y:285},{id:"bookshelf",x:330,y:280},{id:"toybox",x:390,y:480}],
    [{id:"rug_star",x:240,y:450},{id:"bed_royal",x:90,y:350},{id:"vanity",x:250,y:290},{id:"piano",x:390,y:300},{id:"kotatsu",x:250,y:500},{id:"lamp",x:440,y:460,flip:true}],
    [{id:"kitchen",x:90,y:300},{id:"teacart",x:210,y:300},{id:"aquarium",x:350,y:300},{id:"cloudsofa",x:330,y:500},{id:"train",x:120,y:510},{id:"tv",x:440,y:420,flip:true}],
    [{id:"fireplace",x:240,y:285},{id:"tent",x:390,y:340},{id:"musicbox",x:100,y:320},{id:"desk",x:130,y:480},{id:"console_oak",x:320,y:500},{id:"plantshelf",x:440,y:520,flip:true},{id:"sofa",x:230,y:420}],
  ];
  const seen=new Set();
  for(const [i,layout] of rooms.entries()){
    await H.dbg("homeLayout",layout);await H.wait(600);
    const d=await H.dbg("homeDesign");
    expect(d.items.length===layout.length,"家具が 部屋に ならばない");
    for(const it of d.items){
      const a=await H.dbg("furnArt",it.id,!!it.flip);seen.add(it.id);
      expect(a&&a.foot&&(a.kind==="wall"||a.art),`${it.id}: 立体モデルに なって いない／床の 大きさが かわった ${JSON.stringify(a)}`);
      expect(a.kind==="wall"||a.loaded,`${it.id}: 部屋で 絵が 読みこまれて いない`);
      expect([it.rect.x,it.rect.y,it.rect.w,it.rect.h].every(Number.isFinite)&&it.rect.w>8&&it.rect.h>8,`${it.id}: 部屋の 中の 絵の はんいが 不正 ${JSON.stringify(it.rect)}`);
    }
    await H.shot("room-"+(i+1));
  }
  const rebuilt=(await H.dbg("furnArt")).ids.filter(id=>!seen.has(id));
  expect(rebuilt.length===0,"スモークで 見て いない 作りなおした 家具 "+rebuilt.join());
  // さわれる 家具は タップで うごく（くわしくは furniture-touch）
  await H.dbg("pause",false);
  const box=(await H.dbg("homeDesign")).items.find(it=>it.id==="musicbox");
  await H.tap(box.rect.x+box.rect.w*.5,box.rect.y+box.rect.h*.62);await H.wait(250);
  expect((await H.dbg("furnLive","musicbox")).t<1,"オルゴールを タップしても うごかない");
},{viewport,full:viewport.width===375,timeout:90000});

// ART-03b: さわれる 家具。タップで つく・かわる・なる・とびだす。3人の だれかが ひとこと
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('furniture-touch-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("hour",21);await H.dbg("unlockAll");
  const touch=async(id,ok,msg)=>{
    const a=await H.dbg("furnLive",id);expect(a&&a.tap,`${id}: タップできる 点が ない`);
    await H.tap(a.tap.x,a.tap.y);await H.wait(300);
    const b=await H.dbg("furnLive",id);expect(ok(a,b),`${msg} ${JSON.stringify([a,b])}`);expect(b.talk>a.talk,`${id}: 3人が なにも いわない`);
    return b;
  };
  const rooms=[
    [{id:"window",x:190,y:116},{id:"clock",x:350,y:95},{id:"lamp",x:80,y:300},{id:"tv",x:420,y:330},{id:"piano",x:240,y:290},{id:"toybox",x:150,y:500}],
    [{id:"fishbowl",x:60,y:560},{id:"aquarium",x:300,y:290},{id:"train",x:200,y:540},{id:"desk",x:170,y:320},{id:"fireplace",x:440,y:480,flip:true}],
    [{id:"musicbox",x:80,y:560},{id:"kitchen",x:260,y:290},{id:"kotatsu",x:300,y:560},{id:"tent",x:430,y:450},{id:"rockinghorse",x:170,y:310}],
  ];
  const layout=async i=>{await H.dbg("homeLayout",rooms[i]);await H.dbg("homeBubbleFixture");await H.wait(600);};
  await layout(0);
  expect((await H.dbg("furnArt","clock")).loaded!==false,"はとどけいの 絵が ない");
  let b=await touch("lamp",(a,b)=>a.on===true&&b.on===false,"よるの スタンドライトが タップで きえない");
  b=await touch("lamp",(a,b)=>b.on===true,"スタンドライトが つかない");
  b=await touch("tv",(a,b)=>a.ch===0&&b.ch===1,"テレビが つかない");await H.shot("tv-on");
  b=await touch("tv",(a,b)=>b.ch===2,"テレビの チャンネルが かわらない");
  b=await touch("piano",(a,b)=>!!b.song,"ピアノが なりださない");await H.shot("piano");
  b=await touch("clock",(a,b)=>b.bird,"はとどけいの はとが 出ない");
  b=await touch("window",(a,b)=>!a.on&&b.on,"カーテンが しまらない");
  b=await touch("toybox",(a,b)=>!!b.toy,"おもちゃが とびださない");await H.shot("room-a");
  await layout(1);
  for(const id of ["fishbowl","aquarium","train","desk","fireplace"])await touch(id,(a,b)=>b.t<1,`${id} を タップしても うごかない`);
  expect((await H.dbg("furnLive","desk")).n===1,"おえかきの え が かわらない");await H.shot("room-b");
  await layout(2);
  for(const id of ["musicbox","kitchen","rockinghorse"])await touch(id,(a,b)=>b.t<1,`${id} を タップしても うごかない`);
  await touch("kotatsu",(a,b)=>b.on===true,"こたつが つかない");await touch("tent",(a,b)=>a.on===true&&b.on===false,"テントの あかりが きえない");
  await H.shot("room-c");
  await H.dbg("hour",null);
},{viewport,full:viewport.width===375,timeout:90000});

// ART-05: レアの 音楽プレイヤーと ディスク。おてつだい・たからばこで 手に入り、へやで きける
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('music-disc-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("hour",20);await H.page.mouse.click(5,5);
  let d=await H.dbg("discs");expect(d.owned.length===0&&Object.values(d.players).every(n=>n===0)&&d.total>=20,"さいしょから ディスクや プレーヤーが ある "+JSON.stringify(d));
  // ほんとうの おてつだい: ぜんぶ ◎ の あと「きょうの けっか」に ディスクと ラジカセ
  await H.dbg("discLuck",true);const ranks=await H.playShop("crepe",1);expect(ranks.every(r=>r===3),"クレープが ◎ に ならない "+ranks);
  expect(/ディスク「あまい カフェ」/.test(H.shopResult)&&/ラジカセ/.test(H.shopResult),"おてつだいの けっかに ディスクが 出ない "+H.shopResult);
  await H.dbg("house");await H.until(()=>G.sceneName==="house"&&!Game.trans,15000);await H.wait(300);
  d=await H.dbg("discs");expect(d.owned.includes("disc_shop_crepe")&&d.owned.includes("disc_twinkle")&&d.owned.includes("disc_theme")&&d.players.player_boombox===1,"ディスク・ラジカセ（3にんの テーマ・きらきらぼし つき）が セーブに ない "+JSON.stringify(d));
  const chest=await H.dbg("discDrop","chest","forest");expect(chest.some(t=>/もりの こもれび/.test(t)),"たからばこで その ばしょの ディスクが 出ない "+JSON.stringify(chest));
  await H.dbg("homeLayout",[{id:"player_boombox",x:110,y:560},{id:"rug_round",x:300,y:560}]);await H.dbg("homeBubbleFixture");await H.wait(500);
  let a=await H.dbg("furnLive","player_boombox");expect(a&&a.tap,"ラジカセを タップできない");
  await H.tap(a.tap.x,a.tap.y);await H.wait(350);
  const btn=H.page.getByRole("button",{name:"あまい カフェ",exact:true});expect(await btn.count()===1,"ディスクを えらぶ まどが 出ない");
  for(const b of await H.page.locator(".disc-picker button").all()){const q=await b.boundingBox();expect(q.height>=44&&q.x>=0&&q.x+q.width<=viewport.width,"ディスクの ボタンが 小さい／はみ出す");}
  await H.shot("disc-list");await btn.click();await H.wait(500);
  d=await H.dbg("discs");expect(d.playing==="disc_shop_crepe"&&d.song==="shop_crepe","ディスクの きょくが ながれない "+JSON.stringify(d));
  await H.wait(1200);await H.shot("playing");
  a=await H.dbg("furnLive","player_boombox");await H.tap(a.tap.x,a.tap.y);await H.wait(350);
  await H.page.getByRole("button",{name:"とめる",exact:true}).click();await H.wait(300);
  d=await H.dbg("discs");expect(!d.playing&&d.song==="house","とめても おうちの きょくに もどらない "+JSON.stringify(d));
  // 8まいで ジュークボックス、ちくおんきは たからばこ（3まい いじょう）
  for(const shop of ["bakery","florist","dentist","cake","groom"])await H.dbg("discDrop","shop",shop);
  d=await H.dbg("discs");expect(d.owned.length>=8&&d.players.player_jukebox===1&&d.owned.includes("disc_turkish")&&d.owned.includes("disc_march"),"8まいで ジュークボックス（ぽかぽか マーチ・トルコ こうしんきょく つき）が もらえない "+JSON.stringify(d));
  await H.dbg("discDrop","chest","cave");d=await H.dbg("discs");expect(d.players.player_gramophone===1&&d.owned.includes("disc_nacht")&&d.owned.includes("disc_lullaby"),"たからばこで ちくおんき（ほしぞら ララバイ・アイネ クライネ つき）が 出ない "+JSON.stringify(d));
  await H.dbg("homeLayout",[{id:"player_gramophone",x:210,y:560},{id:"player_jukebox",x:400,y:560},{id:"player_boombox",x:80,y:560}]);await H.dbg("homeBubbleFixture");await H.wait(500);
  a=await H.dbg("furnLive","player_jukebox");await H.tap(a.tap.x,a.tap.y);await H.wait(350);
  // タップの あとから くる click が、ひらいた まどの ボタン（タップした ばしょに ある）を おさない
  d=await H.dbg("discs");expect(await H.eval(()=>!!document.querySelector(".disc-picker"))&&!d.playing,"ジュークボックスの まどが タップの あとの click で とじて きょくが ながれる "+JSON.stringify(d));
  await H.page.getByRole("button",{name:"トルコ こうしんきょく",exact:true}).click();await H.wait(900);
  d=await H.dbg("discs");expect(d.song==="disc_turkish","ジュークボックスで ディスクだけの 名曲が ながれない "+JSON.stringify(d));
  await H.shot("jukebox");
  // ぽかぽかの きょく（この ゲームの ために つくった きょく）も ちくおんきで きける（3人が まえに こないよう おきなおす）
  await H.dbg("homeLayout",[{id:"player_gramophone",x:400,y:560},{id:"player_jukebox",x:210,y:560},{id:"player_boombox",x:80,y:560}]);await H.dbg("homeBubbleFixture");await H.wait(500);
  a=await H.dbg("furnLive","player_gramophone");await H.tap(a.tap.x,a.tap.y);await H.wait(350);
  await H.page.getByRole("button",{name:"ほしぞら ララバイ",exact:true}).click();await H.wait(700);
  d=await H.dbg("discs");expect(d.song==="disc_lullaby","ちくおんきで ぽかぽかの きょく「ほしぞら ララバイ」が ながれない "+JSON.stringify(d));
  // ほんとうの たからばこ（はらっぱの m1）: 中みの あとに ディスクの ページが べつに 出る
  await H.dbg("teleport","meadow",5,7,"up");await H.idle();await H.wait(400);await H.page.keyboard.press("z");
  const pages=[];
  for(let i=0;i<6;i++){
    const ok=await H.until(()=>{const s=document.querySelector(".dlg-shade:not(.ask)");return !s||!s.querySelector(".dlg-next").classList.contains("hidden");},6000).then(()=>true,()=>false);if(!ok)break;
    const p=await H.eval(()=>{const s=document.querySelector(".dlg-shade:not(.ask)");if(!s)return null;const r=s.querySelector(".dialog").getBoundingClientRect();return {text:s.querySelector(".dlg-text").textContent,top:r.top,bottom:r.bottom};});
    if(!p){if(pages.length)break;await H.wait(300);continue;}
    pages.push(p);if(/ディスク「/.test(p.text)&&pages.length===2)await H.shot("chest-disc");
    await H.eval(()=>document.querySelector(".dlg-shade:not(.ask)")?.dispatchEvent(new PointerEvent("pointerup",{bubbles:true})));await H.wait(200);
  }
  expect(pages.length>=2&&/たからばこを あけた/.test(pages[0].text)&&pages.slice(1).some(p=>/ディスク「はらっぱを こえて」/.test(p.text)),"たからばこで ディスクの ページが 出ない "+JSON.stringify(pages));
  expect(pages.every(p=>p.top>=0&&p.bottom<=viewport.height),"たからばこの まどが はみ出す");
  await H.dbg("discLuck",false);
  d=await H.dbg("discs");expect(d.owned.includes("disc_meadow"),"たからばこの ディスクが セーブに ない "+JSON.stringify(d));
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  const after=await H.dbg("discs");expect(after.owned.length===d.owned.length&&after.players.player_jukebox===1,"ディスクが セーブされない");
  await H.dbg("hour",null);
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
  for(const b of await H.page.locator(".edit-tools button").all()){const r=await b.boundingBox();expect(r.height>=44&&r.x>=0&&r.x+r.width<=viewport.width,"操作ボタンが小さい/画面外");}
  // ズームは 2本ゆびの ピンチ（ボタンは ない）。ゆびを ひろげると おおきく、1本ゆびの ドラッグで うごかす、とじると ぜんたいに もどる
  expect(await H.page.locator(".home-view-controls").count()===0,"ズームの ボタンが のこって いる");
  const sel0=(await H.dbg("homeDesign")).selected;
  await H.pinch(viewport.width/2,viewport.height*0.5,70,150);d=await H.dbg("homeDesign");expect(d.zoom>1.8&&d.mode==="edit"&&d.selected===sel0,"ピンチで 拡大できない／えらんだ かぐが かわる "+JSON.stringify([d.zoom,d.mode,d.selected,sel0]));
  // かぐの ない ところから 1本ゆびで ドラッグ（ひろげた 画面では 左上にも かぐが 見える）
  const free=await H.eval(items=>{const cv=document.getElementById("screen"),ok=(x,y)=>document.elementFromPoint(x,y)===cv&&!items.some(it=>it.rect&&x>=it.rect.x-10&&x<=it.rect.x+it.rect.w+10&&y>=it.rect.y-10&&y<=it.rect.y+it.rect.h+10);
    for(let y=100;y<innerHeight-120;y+=24)for(let x=16;x<innerWidth-60;x+=24)if(ok(x,y)&&ok(x+35,y+30))return [x,y];return null;},d.items);
  expect(free,"ひろげた 画面で かぐの ない ところが ない");
  const pan0=d.pan.x;await H.page.mouse.move(free[0],free[1]);await H.page.mouse.down();await H.page.mouse.move(free[0]+35,free[1]+30,{steps:10});await H.page.mouse.up();
  expect(Math.abs((await H.dbg("homeDesign")).pan.x-pan0)>5,"拡大後に画面を動かせない "+JSON.stringify(free));
  await H.pinch(viewport.width/2,viewport.height*0.5,170,40);d=await H.dbg("homeDesign");
  expect(d.zoom===1&&d.pan.x===0&&d.pan.y===0,"ピンチで 全体表示に戻らない "+JSON.stringify([d.zoom,d.pan]));await H.shot("editing");
  await H.page.locator(".edit-bar .btn.yellow").click();await H.wait(100);
  // 家具と話者のタップ判定は表示された位置を基準にする。
  d=await H.dbg("homeDesign");const cage=d.items.find(it=>it.id==="birdcage_brass");
  // おうちの タップは 人が さき。あるいて いる 3人が とりかごの まえに いると「なでる」に なるので、きまった ばしょに とめてから タップ
  await H.dbg("homeBubbleFixture");
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

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`おへやの2倍拡張（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);
  const raw=items=>items.map(({rect,anchor,...it})=>it);
  await H.dbg("homeLayout",[...raw((await H.dbg("homeDesign")).items),{id:"stool_oak",x:390,y:540}]);
  const legacy=await H.dbg("saveData");delete legacy.rooms.expanded;legacy.coins=987654;legacy.rooms.owned.study=true;
  legacy.rooms.stored.study={wall:"wp_cream",floor:"fl_wood",items:[],wallpapers:{wp_cream:true},floors:{fl_wood:true},nextUid:1};
  await H.dbg("seedSave",legacy);await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();await H.dbg("hour",12);
  let d=await H.dbg("homeDesign");
  expect(d.width===480&&d.depth===360&&!d.expanded,"旧セーブの部屋が勝手に広がった");
  expect(JSON.stringify(raw(d.items))===JSON.stringify(legacy.room.items)&&(await H.dbg("state")).coins===987654,"旧セーブの配置/おかねが変わった");
  await H.shot("before");
  await H.dbg("coins",5999-987654);await H.houseButton("おへや");
  expect(await H.page.getByRole("button",{name:"2ばいに ひろげる",exact:true}).isDisabled(),"残高不足でも拡張できる");
  await H.page.locator(".modal-wrap .close").last().click();await H.wait(220);
  await H.dbg("coins",987654-5999);await H.houseButton("おへや");
  const button=H.page.getByRole("button",{name:"2ばいに ひろげる",exact:true}),box=await button.boundingBox();
  expect(box.height>=44&&box.x>=0&&box.x+box.width<=viewport.width,"拡張ボタンが小さい/画面外");
  await H.shot("menu");await button.click();await H.choose(1);
  expect((await H.dbg("state")).coins===987654&&!(await H.dbg("homeDesign")).expanded,"キャンセルで支払い/拡張が起きた");
  await button.click();await H.choose(0);await H.until(()=>PokaDebug.idle()&&PokaDebug.homeDesign()?.expanded);
  d=await H.dbg("homeDesign");
  expect(d.width*d.depth===480*360*2&&(await H.dbg("state")).coins===981654,"2倍の面積または6000コインの支払いが不正");
  expect(JSON.stringify(raw(d.items))===JSON.stringify(legacy.room.items)&&JSON.stringify(d.furn)===JSON.stringify(legacy.furn)&&d.wall===legacy.room.wall&&d.floor===legacy.room.floor,"拡張で家具・壁紙・床が変わった");
  const expandedBg=d.background;await H.wait(500);await H.shot("expanded");
  await H.houseButton("おへや");expect(await H.page.getByRole("button",{name:"ひろげたよ",exact:true}).isDisabled(),"2回目の拡張が可能");
  await H.page.locator(".modal-wrap .close").last().click();await H.wait(220);await H.houseButton("もようがえ");
  d=await H.dbg("homeDesign");const stool=d.items.find(it=>it.id==="stool_oak"),start={x:stool.rect.x+stool.rect.w*.5,y:stool.rect.y+stool.rect.h*.2};
  const a=await H.dbg("homePoint",stool.x,stool.y),b=await H.dbg("homePoint",550,690);
  await H.drag(start.x,start.y,start.x+b.x-a.x,start.y+b.y-a.y);
  const moved=(await H.dbg("homeDesign")).items.find(it=>it.uid===stool.uid);
  expect(Math.abs(moved.x-550)<2&&Math.abs(moved.y-690)<2,"広がった床へ家具を置けない");await H.shot("new-floor");
  await H.page.locator(".edit-bar").getByRole("button",{name:"おわる",exact:true}).click();
  const arranged=raw((await H.dbg("homeDesign")).items);
  await H.houseButton("おへや");await H.page.locator('[data-room="study"]').getByRole("button",{name:"このへやへ",exact:true}).click();await H.idle();
  d=await H.dbg("homeDesign");expect(!d.expanded&&d.width===480&&d.depth===360&&d.background!==expandedBg,"未拡張の別室へ広さ/背景が漏れた");
  await H.houseButton("おへや");await H.page.getByRole("button",{name:"2ばいに ひろげる",exact:true}).click();await H.choose(0);await H.until(()=>PokaDebug.idle()&&PokaDebug.homeDesign()?.expanded);
  expect((await H.dbg("state")).coins===975654,"別室拡張の支払いが不正");
  await H.houseButton("おへや");await H.page.locator('[data-room="main"]').getByRole("button",{name:"このへやへ",exact:true}).click();await H.idle();
  await H.dbg("save");await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  d=await H.dbg("homeDesign");expect(d.expanded&&d.stored.expanded.study&&d.width*d.depth===480*360*2&&JSON.stringify(raw(d.items))===JSON.stringify(arranged)&&(await H.dbg("state")).coins===975654,"再開で拡張・家具・おかねが変わった");
  await H.pinch(viewport.width/2,viewport.height*0.5,80,130);expect((await H.dbg("homeDesign")).zoom>1.4,"拡張後に拡大できない");
  await H.pinch(viewport.width/2,viewport.height*0.5,160,40);expect((await H.dbg("homeDesign")).zoom===1,"拡張後に全体に戻らない");
},{viewport,full:viewport.width===375,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`落ち葉・背景に固定（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("calendar","2026-10-15");await H.dbg("hour",12);await H.dbg("weather","wind");
  await H.dbg("teleport","heiwadai",9,50);await H.idle();await H.wait(300);
  const before=await H.dbg("drift",30),money=(await H.dbg("state")).coins;
  expect(await H.dbg("walkTo",11,52),"公園の移動先に到達できない");
  await H.until(()=>{const p=PokaDebug.state().pos;return p[0]===11&&p[1]===52;});await H.wait(600);
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

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`vector-roads-${viewport.width}`,async H=>{
  const def=runInNewContext(readFileSync(new URL("./fixtures/roads-v02.js",import.meta.url),"utf8")+";ROAD_FIXTURE");
  await H.newGameFast();await H.dbg("coins",927);await H.dbg("teleport","heiwadai",9,50);await H.idle();
  await H.dbg("pause",true);const state=await H.dbg("state"),world=await H.dbg("world");
  const oldGround=await H.dbg("groundImage","meadow",1,1);
  for(const [name,cx,cy]of [["station",43.2,27.4],["junction",43,45]]){
    const r=await H.dbg("roadPreview",def,{...viewport,cx,cy});
    expect(r.width===viewport.width&&r.height===viewport.height,"道路画像のサイズが不正");
    for(const [x,y,kind]of [[43,28,"road"],[43,21,"island"],[40,34,"sidewalk"],[45,34,"driveway"],[40,42,"road"],[24,50,"road"],[45,53,"road"],[50,58,"road"]])expect(r.grid[y][x]===kind,`道路セル ${x},${y}: ${r.grid[y][x]} != ${kind}`);
    expect(r.solid[21][43]&&!r.solid[28][43],"島と車道の当たり判定が不正");
    // 本編の Tiles.chunk が描いた画像を、端末サイズそのままで記録。
    await H.eval(url=>{const img=document.createElement("img");img.id="road-shot";img.src=url;img.style="position:fixed;inset:0;width:100vw;height:100vh;z-index:99999";document.body.append(img);return img.decode();},r.url);
    await H.shot(name);await H.eval(()=>document.querySelector("#road-shot").remove());
  }
  for(const scale of viewport.width===390?[1,1.5,2.15625]:[2.09375]){
    const r=await H.dbg("roadSeams",def,scale);console.log(`    road seams @${scale}: ${JSON.stringify(r)}`);
    expect(r.flatSamples>1000&&r.flatMax<=3&&r.changed/r.channels<.001,"道路・模様がチャンク境界でずれる");
  }
  const blocked=structuredClone(def);blocked.objects=[{kind:"rock",x:43,y:28,w:1,h:1,solid:true}];
  expect((await H.dbg("roadPreview",blocked,viewport)).solid[28][43],"道路が小物の当たり判定を消した");
  expect(await H.dbg("groundImage","meadow",1,1)===oldGround,"道路のないはらっぱの地面が変わった");
  const after=await H.dbg("state");expect(after.map===state.map&&after.pos.join()===state.pos.join()&&after.coins===state.coins,"道路プレビューでプレイ状態が変化");
  expect(JSON.stringify((await H.dbg("world")).party)===JSON.stringify(world.party),"道路プレビューで3人が移動した");
  await H.dbg("pause",false);expect(await H.dbg("walkTo",11,52),"噴水から近くの歩道へ進めない");await H.until(()=>PokaDebug.state().pos.join() === "11,52");
  expect((await H.dbg("world")).party.length===3,"3人が一緒に歩かない");
},{viewport,full:viewport.width===375,timeout:90000});

await scenario("vector-roads-file",async H=>{
  const def=runInNewContext(readFileSync(new URL("./fixtures/roads-v02.js",import.meta.url),"utf8")+";ROAD_FIXTURE");
  // WebKit のオフライン模擬は file:// も遮断するため、HTTP(S) 通信だけを遮断する。
  await H.page.context().route(/^https?:\/\//,route=>route.abort());
  await H.page.goto(pathToFileURL(resolve(HERE,"../index.html")).href);
  await H.until(()=>window.PokaDebug&&PokaDebug.state().scene==="title");
  const image=await H.dbg("roadPreview",def,{width:375,height:667,cx:43,cy:45});
  expect(image.url.startsWith("data:image/png;")&&image.grid[21][43]==="island","file:// で道路が描けない");
},{full:true});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`town-renewal-${viewport.width}`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("weather","clear");
  const fixture=await H.dbg("saveData");fixture.coins=987654;fixture.bag.cake=7;fixture.wardrobe.crown=true;fixture.furn.trophy=2;fixture.flags.chests.port_boardwalk=true;fixture.shops.crepe.lv=3;
  for(const [id,x,y]of [["town",4,6],["city",30,10],["harbor",4,21],["airport",20,10]]){
    const old=structuredClone(fixture);old.world={map:id,x,y,dir:"down"};
    await H.dbg("pause",true);await H.dbg("seedSave",old);await H.page.reload();
    await H.page.getByRole("button",{name:"つづきから",exact:true}).click();
    await H.until(id=>PokaDebug.state().map===id&&PokaDebug.idle(),15000,id);
    const state=await H.dbg("state"),after=await H.dbg("saveData"),routes=await H.dbg("townRoutes");
    expect(state.coins===987654,"古いセーブのおかねが変わった");expect(!routes.solid,"古い位置が建物や滑走路に取り残された");
    expect(state.pos.join()!==[x,y].join(),"塞がれた古い位置を救済していない");
    for(const key of ["bag","wardrobe","furn","room","rooms","shops","events"])expect(JSON.stringify(after[key])===JSON.stringify(old[key]),id+": "+key+"が変わった");
    expect(after.flags.chests.port_boardwalk,"取得済み宝箱が復活した");expect((await H.dbg("world")).party.length===3,"仲間が欠けた");
    expect(routes.doors.every(d=>d.reachable),id+": 人を避けて到達できない入口 "+JSON.stringify(routes.doors.filter(d=>!d.reachable)));
    const layout=await H.dbg("townLayout",id),view=layout.views[0];
    await H.dbg("teleport",id,...view);await H.idle();await H.shot(id+"-renewal");
    expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth),"スマホで横にはみ出す");
    const door=layout.doors.find(d=>d.act.type==="buy")||layout.doors.find(d=>d.act.type==="transit");
    await H.dbg("teleport",id,door.x,door.y+1,"up");await H.idle();
    expect(await H.dbg("walkTo",door.x,door.y),"入口へ歩けない");await H.wait(600);
    if(door.act.type==="transit"){
      expect(await H.page.locator('.choices').count()>0,"交通の入口が開かない");
      await H.page.getByRole("button",{name:"やめておく",exact:true}).click();
    } else {
      await H.until(()=>PokaDebug.state().scene==="store"&&PokaDebug.idle());
      await H.page.getByRole("button",{name:"おみせを でる",exact:true}).click();
      await H.until(()=>PokaDebug.state().scene==="world"&&PokaDebug.idle());
    }
    await H.dbg("teleport",id,...view);await H.idle();await H.dbg("save");await H.page.reload();
    await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.until(id=>PokaDebug.idle()&&PokaDebug.state().map===id,15000,id);
    expect((await H.dbg("state")).coins===987654,"更新後の再保存でコインが変わった");
  }
  expect(await H.dbg("fps",1000)>=20,"街区描画が20FPS未満");
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`walk-in-stores-${viewport.width}`,async H=>{
  await H.newGameFast();
  const legacy=await H.dbg("saveData");legacy.coins=987654;
  await H.dbg("seedSave",legacy);
  for(const id of ["clothes","furniture","market","crepe","dentist","bakery","florist","link","relay"]){
    const map=id==="link"?"city":"town";
    const door=(await H.dbg("townLayout",map)).doors.find(d=>d.act.shop===id);
    expect(door,"お店の入口がない: "+id);
    await H.dbg("teleport",map,door.x,door.y+1,"up");await H.idle();
    expect(await H.dbg("walkTo",door.x,door.y),"入口に歩けない: "+id);
    await H.until(()=>PokaDebug.state().scene==="store"&&PokaDebug.idle());
    let s=await H.dbg("storeState");
    expect(s.shop===id&&s.party.length===3,"店内/3人が不正");
    expect(s.walkable.every(p=>p.reachable),"店内に到達できない床: "+id);
    expect(s.music==="shop_"+id,"お店の曲が違う: "+id);
    expect((await H.dbg("weather")).indoors,"店内に屋外の天気が残る");
    expect(await H.page.locator(".modal-wrap,.choices").count()===0,"入店だけで購入/会話が始まった");
    await H.shot(id);
    for(const btn of await H.page.locator(".store-bar .btn,.store-home").all()){
      const box=await btn.boundingBox();expect(box.height>=44&&box.x>=0&&box.x+box.width<=viewport.width,"操作ボタンが小さい/画面外");
    }
    const floor=s.walkable.find(p=>p.x===5&&p.y===8);await H.tap(floor.cx,floor.cy);
    await H.until(()=>{const s=PokaDebug.storeState();return s&&s.party[0].y===8&&!s.party[0].moving&&!s.path;});
    const fixture=s.fixtures[0];expect(!await H.dbg("storeWalkTo",fixture.x,fixture.y),"展示を通り抜ける");
    await H.tap(s.keeper.cx,s.keeper.cy);
    await H.page.waitForSelector(id==="link"?".puzzle-lobby":".choices");
    s=await H.dbg("storeState");expect(s.party[0].x===5&&s.party[0].y===3,"店員の前まで歩いていない");
    if(id==="link")await H.page.locator(".puzzle-lobby .close").click();
    else await H.page.getByRole("button",{name:"また あとで",exact:true}).click();await H.idle();
    await H.page.getByRole("button",{name:"おみせを でる",exact:true}).click();
    await H.until(()=>PokaDebug.state().scene==="world"&&PokaDebug.idle());
    const w=await H.dbg("state");expect(w.map===map&&w.pos[0]===door.x&&w.pos[1]===door.y+1,"元のお店の出口へ戻らない");
  }
  const after=await H.dbg("saveData");
  for(const key of ["coins","bag","furn","wardrobe","shops","rooms"])expect(JSON.stringify(after[key])===JSON.stringify(legacy[key]),"入退出で保存内容が変化: "+key);
  await H.dbg("store","market","heiwadai");await H.idle();
  const branch=(await H.dbg("storeState")).back;
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  const st=await H.dbg("state");expect(st.scene==="world"&&st.map===branch.map&&st.pos[0]===branch.x&&st.pos[1]===branch.y,"店内から安全に再開できない");
  expect(st.coins===987654,"再読み込みで所持金が変わった");
},{viewport,full:viewport.width===375,timeout:180000});

await scenario("店員から購入・保存・おてつだい",async H=>{
  await H.newGameFast();await H.dbg("coins",5000);
  const original=await H.dbg("saveData");
  for(const [id,kind] of [["clothes","wardrobe"],["furniture","furn"],["market","bag"],["crepe","bag"],["bakery","bag"],["florist","furn"]]){
    await H.dbg("store",id);await H.idle();
    await H.page.getByRole("button",{name:"てんいんと はなす",exact:true}).click();
    await H.page.getByRole("button",{name:"かいものを する",exact:true}).click();
    const before=await H.dbg("saveData"),card=H.page.locator(".modal-wrap .card:not(.on)").first();
    const price=Number((await card.locator(".price").textContent()).replace(/[^0-9]/g,""));
    expect(price>0,"購入価格がない");await card.click();
    await H.page.getByRole("button",{name:"かう",exact:true}).click();
    if(id==="clothes"){await H.page.getByRole("button",{name:"あとで",exact:true}).click();}
    await H.wait(220);
    const saved=await H.dbg("persistedSave");
    expect(saved.coins===before.coins-price,"購入金額が違う/未保存: "+id);
    expect(JSON.stringify(saved[kind])!==JSON.stringify(before[kind]),"購入品が保存されない: "+id);
    await H.page.locator(".modal-wrap .close").last().click();await H.idle();
    expect((await H.dbg("state")).scene==="store","購入画面を閉じると店外へ出る");
  }
  let before=await H.dbg("saveData");await H.page.reload();
  await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  let saved=await H.dbg("saveData");
  for(const key of ["coins","bag","furn","wardrobe","rooms"])expect(JSON.stringify(saved[key])===JSON.stringify(before[key]),"購入後の再読み込みで変化: "+key);
  expect(JSON.stringify(saved.rooms)===JSON.stringify(original.rooms),"部屋の保存が変わった");
  await H.dbg("store","crepe");await H.idle();await H.dbg("needs",0);
  await H.page.getByRole("button",{name:"てんいんと はなす",exact:true}).click();
  await H.page.getByRole("button",{name:"おてつだいする",exact:true}).click();await H.dialogs();await H.idle();
  expect((await H.dbg("state")).scene==="store","空腹でおてつだいを始めた");
  await H.dbg("needs",100);
  await H.page.getByRole("button",{name:"てんいんと はなす",exact:true}).click();
  await H.page.getByRole("button",{name:"おてつだいする",exact:true}).click();
  before=await H.dbg("saveData");
  const ranks=await H.playShop("crepe",1,true);expect(ranks.every(r=>r>=2),"店内経由のおてつだいで採点が不正");
  expect((await H.dbg("storeState")).shop==="crepe","おてつだいから店内に戻らない");
  saved=await H.dbg("persistedSave");expect(saved.coins>before.coins&&saved.shops.crepe.plays===before.shops.crepe.plays+1,"報酬/お店の進行が保存されない");
  await H.page.getByRole("button",{name:"おうちへ",exact:true}).click();await H.idle();
  expect((await H.dbg("state")).scene==="house","店内から帰宅できない");
},{timeout:180000});

for (const viewport of [{width:390,height:844},{width:375,height:667}]) await scenario(`なかよしパズル・参加料と形と景品（${viewport.width}）`, async H=>{
  await H.newGameFast();await H.dbg("coins",5000);
  const original=await H.dbg("saveData");H.page.setDefaultTimeout(30000);
  const lobby=async()=>{await H.dbg("store","link","city");await H.idle();await H.page.getByRole("button",{name:"てんいんと はなす",exact:true}).click();await H.page.locator(".puzzle-lobby").waitFor();};
  const board=path=>{const b=Array.from({length:36},(_,i)=>1+(i+Math.floor(i/6))%3);for(const i of path)b[i]=0;return b;};
  const draw=async(path,release=true)=>{const s=await H.dbg("puzzleState"),points=path.map(i=>s.cells[i]);await H.page.mouse.move(points[0].cx,points[0].cy);await H.page.mouse.down();for(const p of points.slice(1))await H.page.mouse.move(p.cx,p.cy,{steps:3});if(release)await H.page.mouse.up();};
  await lobby();expect(await H.page.getByRole("button",{name:"おてつだいする",exact:true}).count()===0,"パズルにお客さん式の受付が残った");
  await H.shot("lobby");await H.page.getByRole("button",{name:"80コインで挑戦",exact:true}).click();
  await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
  await H.dbg("puzzleClock",true);
  let state=await H.dbg("puzzleState"),paid=await H.dbg("persistedSave");
  expect(paid.coins===original.coins-80&&paid.puzzle.active.id===state.id,"参加料と盤面が同時に保存されない");
  for(const [path,shape] of [[[0,1,2,3],"line"],[[0,1,2,8,14],"elbow"],[[0,1,7,6,0],"loop"]]){
    await H.dbg("puzzleBoard",board(path));await H.page.getByRole("button",{name:state.phase==="ready"?"スタート":"再開する",exact:true}).click();
    await draw(path,false);state=await H.dbg("puzzleState");expect(state.preview?.shape===shape,"指で形の技を作れない: "+shape);
    if(shape==="loop")await H.shot("loop-preview");
    const before=state.score;await H.page.mouse.up();state=await H.dbg("puzzleState");expect(state.score>before&&state.extended>0,"消去でスコア/時間が増えない");
    await H.page.getByRole("button",{name:"一時停止",exact:true}).click();state=await H.dbg("puzzleState");
  }
  const snapshot=await H.dbg("puzzleState");await H.page.getByRole("button",{name:"中断して受付へ",exact:true}).click();await H.idle();
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();
  await lobby();await H.page.getByRole("button",{name:"中断したゲームを再開",exact:true}).click();await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
  await H.dbg("puzzleClock",true);state=await H.dbg("puzzleState");
  expect(state.score===snapshot.score&&state.rng===snapshot.rng&&JSON.stringify(state.board)===JSON.stringify(snapshot.board)&&Math.abs(state.remaining-snapshot.remaining)<.05,"中断・再読み込みで盤面や時計が変わった");
  expect((await H.dbg("persistedSave")).coins===original.coins-80,"再開で二重払い");
  await H.page.getByRole("button",{name:"スタート",exact:true}).click();await H.shot("play");
  // タッチ中断は得点にしない。
  state=await H.dbg("puzzleState");const before=state.score,chain=state.legal,first=state.cells[chain[0]];
  await H.eval(({first})=>{const el=document.getElementById("screen");el.dispatchEvent(new PointerEvent("pointerdown",{pointerId:71,clientX:first.cx,clientY:first.cy,bubbles:true}));el.dispatchEvent(new PointerEvent("pointercancel",{pointerId:71,bubbles:true}));},{first});
  expect((await H.dbg("puzzleState")).score===before,"タッチ中断が得点になった");
  await H.page.getByRole("button",{name:"一時停止",exact:true}).click();await H.page.getByRole("button",{name:"中断して受付へ",exact:true}).click();await H.idle();
  const fixture=await H.dbg("saveData");fixture.puzzle.active.state.score=state.prizes[2].score;fixture.puzzle.active.state.remaining=.4;
  await H.dbg("seedSave",fixture);await lobby();await H.page.getByRole("button",{name:"中断したゲームを再開",exact:true}).click();await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
  await H.page.getByRole("button",{name:"スタート",exact:true}).click();await H.dbg("puzzleAdvance",1);await H.until(()=>PokaDebug.puzzleState()?.phase==="result");await H.shot("prizes");
  paid=await H.dbg("persistedSave");expect(!paid.puzzle.active&&paid.puzzle.plays===1&&paid.puzzle.best===fixture.puzzle.active.state.score,"結果未保存");
  for(const p of state.prizes.slice(0,3))expect(paid.furn[p.id]===1&&paid.puzzle.claimed[p.id],"下位の景品を含めて配布されない");
  expect(JSON.stringify(paid.shops)===JSON.stringify(original.shops)&&JSON.stringify(paid.rooms)===JSON.stringify(original.rooms),"既存のお店/部屋のデータが変化");
  await H.page.getByRole("button",{name:"受付へ戻る",exact:true}).click();await H.idle();await lobby();
  await H.page.getByRole("button",{name:"無料で練習（景品なし）",exact:true}).click();await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
  await H.dbg("puzzleClock",true);const beforePractice=await H.dbg("persistedSave");await H.page.getByRole("button",{name:"スタート",exact:true}).click();await draw((await H.dbg("puzzleState")).legal);
  await H.dbg("puzzleAdvance",181);await H.until(()=>PokaDebug.puzzleState()?.phase==="result");
  const afterPractice=await H.dbg("persistedSave");for(const key of ["coins","furn","puzzle"])expect(JSON.stringify(beforePractice[key])===JSON.stringify(afterPractice[key]),"練習で記録や所持品が変わる: "+key);
  await H.page.getByRole("button",{name:"おうちへ",exact:true}).click();await H.idle();
  const items=state.prizes.slice(0,3).map((p,i)=>({id:p.id,x:90+i*140,y:450,uid:i+1}));await H.dbg("homeLayout",items);await H.wait(400);await H.shot("rare-room");
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario("puzzle-collab-"+viewport.width,async H=>{
  // ごわが × なかよしパズル の コラボ グッズ（UI-18。オーナーの FB 2026-09-30「30000pt〜150000pt の 景品を ごわがと なかよしパズルの コラボグッズに。限定洋服系や 限定家具系に」）:
  // うけつけの つみたての メーター・5しゅの カード → 1かい あそぶと スコアが つみたてに たされ、とどいた パーカーを もらう → つぎの めやす → もう 1かいで のこり 4しゅ → 3にんが きる・へやに かざる・さわる
  await H.newGameFast();await H.dbg("coins",5000);H.page.setDefaultTimeout(30000);
  const lobby=async()=>{await H.dbg("store","link","city");await H.idle();await H.page.getByRole("button",{name:"てんいんと はなす",exact:true}).click();await H.page.locator(".puzzle-lobby").waitFor();};
  const play=async score=>{
    await H.page.getByRole("button",{name:"80コインで挑戦",exact:true}).click();await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
    await H.page.getByRole("button",{name:"中断して受付へ",exact:true}).click();await H.idle();
    const f=await H.dbg("saveData");f.puzzle.active.state.score=score;f.puzzle.active.state.remaining=.4;await H.dbg("seedSave",f);
    await lobby();await H.page.getByRole("button",{name:"中断したゲームを再開",exact:true}).click();await H.until(()=>PokaDebug.puzzleState()?.phase==="ready"&&PokaDebug.idle());
    await H.page.getByRole("button",{name:"スタート",exact:true}).click();await H.dbg("puzzleAdvance",1);await H.until(()=>PokaDebug.puzzleState()?.phase==="result");
    return H.eval(()=>{const b=document.querySelector(".collab-result");b.scrollIntoView({block:"center"});return {text:b.innerText,cards:[...b.querySelectorAll(".collab-card")].map(c=>c.dataset.collab)};});
  };
  // まえから あそんで いる 人（ベスト 29000・コラボの きろくは まだ ない）
  let d=await H.dbg("saveData");d.puzzle.best=29000;d.puzzle.plays=4;delete d.collab;await H.dbg("seedSave",d);
  await lobby();await H.page.locator(".collab-box").scrollIntoViewIfNeeded();
  const lob=await H.eval(()=>{const b=document.querySelector(".collab-box"),r=b.getBoundingClientRect(),cs=[...b.querySelectorAll(".collab-card")];return {text:b.innerText,cards:cs.map(c=>c.dataset.collab),own:b.querySelectorAll(".collab-card.own").length,arts:cs.filter(c=>c.querySelector(".collab-art svg")).length,l:r.left,r:r.right,w:document.documentElement.scrollWidth,iw:innerWidth};});
  expect(lob.cards.join()==="pc_hoodie,pc_cushion,pc_band,pc_table,pc_arcade"&&lob.own===0&&lob.arts===5&&/つみたて 29,000 pt/.test(lob.text)&&/あと 1,000 pt/.test(lob.text)&&lob.l>=0&&lob.r<=lob.iw+0.5&&lob.w<=lob.iw,"うけつけの コラボ "+JSON.stringify(lob));
  await H.shot("lobby");
  // 1かいめ: 2000 pt → つみたて 31000 → パーカー
  let res=await play(2000);
  expect(res.cards.join()==="pc_hoodie"&&/\+2,000/.test(res.text)&&/31,000 pt/.test(res.text)&&/クッション」まで あと 19,000 pt/.test(res.text),"1かいめの けっか "+JSON.stringify(res));await H.shot("result-1");
  let saved=await H.dbg("persistedSave");
  expect(saved.collab.puzzle.total===31000&&saved.collab.puzzle.got.pc_hoodie&&saved.wardrobe.pc_hoodie===true&&saved.puzzle.best===29000&&!saved.furn.pc_cushion,"パーカーが ほぞん されない "+JSON.stringify(saved.collab));
  await H.page.getByRole("button",{name:"受付へ戻る",exact:true}).click();await H.idle();await lobby();
  const lob2=await H.eval(()=>({own:[...document.querySelectorAll(".collab-card.own")].map(c=>c.dataset.collab),text:document.querySelector(".collab-box").innerText}));
  expect(lob2.own.join()==="pc_hoodie"&&/クッション」まで あと 19,000 pt/.test(lob2.text)&&/もって いるよ/.test(lob2.text),"うけつけの つぎの めやす "+JSON.stringify(lob2));
  // 2かいめ: 120000 pt → つみたて 151000 → のこり 4しゅ いっぺんに
  res=await play(120000);
  expect(res.cards.join()==="pc_cushion,pc_band,pc_table,pc_arcade"&&/151,000 pt/.test(res.text)&&/ぜんぶ そろったよ/.test(res.text),"2かいめの けっか "+JSON.stringify(res));await H.shot("result-2");
  saved=await H.dbg("persistedSave");
  expect(saved.collab.puzzle.total===151000&&["pc_cushion","pc_table","pc_arcade"].every(id=>saved.furn[id]===1)&&saved.wardrobe.pc_band===true,"のこりの コラボ グッズ "+JSON.stringify(saved.collab));
  // おうち: 3にんが パーカーと カチューシャ・家具を かざる・アーケードを さわる
  await H.page.getByRole("button",{name:"おうちへ",exact:true}).click();await H.idle();
  // 服は 1こで ひとり（UI-31）なので 3人が きる ぶん 3こに して から
  d=await H.dbg("saveData");d.wardrobe.pc_hoodie=3;d.wardrobe.pc_band=3;for(const id of ["wanko","gachan","goji"])d.chars[id].outfit={...d.chars[id].outfit,body:"pc_hoodie",head:"pc_band"};await H.dbg("seedSave",d);await H.dbg("house");await H.idle();
  await H.dbg("homeLayout",[{id:"pc_arcade",x:300,y:420},{id:"pc_table",x:150,y:470},{id:"pc_cushion",x:120,y:360}]);await H.wait(500);
  const lv=await H.dbg("furnLive","pc_arcade");expect(lv&&lv.tap,"アーケードを さわれない "+JSON.stringify(lv));
  await H.page.mouse.click(lv.tap.x,lv.tap.y);await H.wait(700);const lv2=await H.dbg("furnLive","pc_arcade");expect(lv2.t>=0&&lv2.t<3,"アーケードの うごき "+JSON.stringify(lv2));
  await H.shot("room");
  expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth),"よこに はみ出す");
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario("shop-rewards-"+viewport.width,async H=>{
  await H.newGameFast();await H.dbg("pause",true);
  const legacy=await H.dbg("saveData");legacy.coins=987654;delete legacy.shopRewards;
  legacy.shops.crepe.lv=5;legacy.shops.crepe.rep=1600;
  await H.dbg("seedSave",legacy);await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle(30000);await H.dbg("pause",true);
  let data=await H.dbg("saveData");for(const k of ["coins","bag","wardrobe","furn","shops"])expect(JSON.stringify(data[k])===JSON.stringify(legacy[k]),"古いセーブが変化: "+k);
  expect(Object.keys(data.shopRewards).length===0,"旧データの受取記録が不正");
  await H.dbg("shopRewardOpen","crepe");await H.shot("level5");
  const claim=H.page.getByRole("button",{name:"ごほうびを うけとる",exact:true});await claim.click();expect(await claim.isDisabled(),"受け取り後に再配布できる");
  let stored=await H.dbg("persistedSave");expect(stored.coins===987654&&stored.furn.shop_crepe_5===1&&stored.shopRewards.shop_crepe_5,"レベル5報酬か保存が不正");
  await H.page.getByRole("button",{name:"とじる",exact:true}).last().click();
  const levels=(await H.dbg("shopRewards","crepe")).levels;
  data=await H.dbg("saveData");for(const shop of ["burger","groom","cake","crepe","dentist","bakery","florist","relay","korokoro"]){data.shops[shop].lv=5;data.shops[shop].rep=levels[30];}
  await H.dbg("seedSave",data);
  for(const shop of ["burger","groom","cake","crepe","dentist","bakery","florist","relay","korokoro"]){
    const got=await H.dbg("shopRewardClaim",shop);expect(got.length===(shop==="crepe"?3:4),"過去の評判からの報酬不足: "+shop);
    expect((await H.dbg("shopRewardClaim",shop)).length===0,"報酬の二重配布");
  }
  stored=await H.dbg("persistedSave");expect(stored.coins===987654&&Object.keys(stored.shopRewards).length===36,"おかねか報酬数が不正");
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle(30000);await H.dbg("pause",true);
  expect((await H.dbg("shopRewardClaim","crepe")).length===0,"再読み込みで重複");
  await H.dbg("shopRewardOpen","crepe");const cards=H.page.locator(".shop-prize-card");await cards.last().scrollIntoViewIfNeeded();await H.shot("level30");
  expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth),"横にはみ出す");
  await H.page.getByRole("button",{name:"とじる",exact:true}).last().click();
  const rows=(await H.dbg("shopRewards","crepe")).rows;await H.dbg("homeLayout",rows.map((p,i)=>({id:p.id,x:65+i*90,y:450})));await H.wait(700);await H.shot("rare-room");
  await H.dbg("pause",false);
  if(viewport.width===390){
    const step=await H.dbg("saveData");step.shops.crepe={lv:4,rep:1599,plays:1,best:0};delete step.shopRewards.shop_crepe_5;delete step.furn.shop_crepe_5;
    await H.dbg("seedSave",step);await H.playShop("crepe",4);
    const earned=await H.dbg("persistedSave");expect(earned.shops.crepe.lv===5&&earned.shopRewards.shop_crepe_5&&earned.furn.shop_crepe_5===1,"レベルアップ時の自動配布が不正");
  }
  await H.dbg("shop","crepe",30);await H.until(()=>PokaDebug.state().scene==="shop"&&!PokaDebug.state().transitioning,30000);await H.dialogs();await H.until(()=>PokaDebug.mg()?.phase==="work",30000);
  const mg=await H.dbg("mg");expect(mg.lv===30&&mg.workLv===5&&mg.total===7,"Lv30で難易度や客数が際限なく上がる");await H.shot("work-lv30");
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('home-idle-life-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('pause',true);await H.dbg('homeBubbleFixture');await H.dbg('homeActionSchedule');
  const before=await H.dbg('saveData');
  await H.dbg('homeAdvance',14);let st=await H.dbg('homeActions');expect(st.log.length===0,'15秒より早く生活動作が出る');
  await H.dbg('homeAdvance',1.1);st=await H.dbg('homeActions');expect(st.log.length===1,'約15秒で動作が出ない');
  expect(st.talkDelay.normal>=24&&st.talkDelay.normal<=40&&st.talkDelay.watching>=14&&st.talkDelay.watching<=22,'自動会話の間隔が倍になっていない');
  await H.dbg('homeAdvance',15);expect((await H.dbg('homeActions')).log.length===2,'次の動作が15秒間隔でない');
  await H.dbg('homeLayout',[{id:'chair_wood',x:170,y:400,uid:1},{id:'bookshelf',x:245,y:380,uid:2},{id:'plant',x:310,y:390,uid:3},{id:'toybox',x:360,y:460,uid:4}]);
  await H.dbg('homeBubbleFixture');st=await H.dbg('homeActions');expect(st.kinds.length===15&&st.available.length===15,'15種類の動作がそろわない');
  for(const [i,kind] of st.kinds.entries()){
    await H.dbg('homeBubbleFixture');const who=['wanko','gachan','goji'][i%3];expect(await H.dbg('homeAction',who,kind),'動作を始められない: '+kind);
    for(let n=0;n<80;n++){const c=(await H.dbg('homeActions')).chars.find(c=>c.id===who);if(c.activity?.stage==='act')break;await H.dbg('homeAdvance',.1);}
    expect((await H.dbg('homeActions')).chars.find(c=>c.id===who).activity?.stage==='act','家具へ歩いて動作を始めない: '+kind);
    await H.dbg('homeAdvance',.6);await H.wait(100);
    if(['nap','read','sing','peek','water','stumble'].includes(kind))await H.shot(kind);
    await H.dbg('homeAdvance',8);expect(!(await H.dbg('homeActions')).chars.find(c=>c.id===who).activity,'動作がおわらない: '+kind);
  }
  const after=await H.dbg('saveData');for(const key of ['coins','bag','wardrobe'])expect(JSON.stringify(before[key])===JSON.stringify(after[key]),'動作で持ち物が変わる: '+key);
  await H.dbg('homeLayout',[]);await H.dbg('homeBubbleFixture');expect(!(await H.dbg('homeAction','wanko','read')),'家具がないのに読書する');
  await H.dbg('pause',false);
},{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('slow-life-prices-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);await H.dbg('save');const before=await H.dbg('saveData'),prices=await H.dbg('shopPrices');
  const price=(kind,id)=>prices[kind].find(p=>p.id===id).price;
  expect(price('furniture','chair_wood')===320&&price('furniture','bed_royal')===5600&&price('wear','ribbon_pink')===150,'新しい販売価格でない');
  expect(price('wear','crown')===0&&price('wall','wp_cream')===0&&price('food','onigiri')===20,'非売品・初期内装・食事を値上げした');
  await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
  const after=await H.dbg('saveData');for(const key of ['coins','furn','wardrobe','bag','room','rooms','shops'])expect(JSON.stringify(after[key])===JSON.stringify(before[key]),'アップデートで既存財産が変わる: '+key);
  expect(JSON.stringify(await H.dbg('shopPrices'))===JSON.stringify(prices),'再読み込みで値上げが累積する');
  await H.dbg('store','furniture');await H.idle(30000);await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'かいものを する',exact:true}).click();await H.shot('catalog');
  const card=H.page.locator('.modal-wrap .card:not(.on)').first();const cost=Number((await card.locator('.price').textContent()).replace(/[^0-9]/g,''));expect(cost>=320,'家具屋の表示に値上げが反映されない');await card.click();await H.shot('confirm');await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.wait(250);
  const saved=await H.dbg('persistedSave');expect(saved.coins===before.coins-cost,'表示価格と差し引き額が違う');expect(JSON.stringify(saved.furn)!==JSON.stringify(before.furn),'購入家具を受け取れない');
},{viewport,timeout:120000});
for (const viewport of [{width:390,height:844},{width:375,height:667}]) await scenario('おてつだいの途中終了（'+viewport.width+'）', async H=>{
  await H.newGameFast();await H.dbg('coins',12345);
  const start=async()=>{await H.dbg('store','crepe');await H.idle();await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='shop'&&!PokaDebug.state().transitioning);await H.dialogs();await H.until(()=>PokaDebug.mg()?.phase==='work');};
  const quit=()=>H.page.getByRole('button',{name:'おてつだいを やめる',exact:true}).click();
  const before=await H.dbg('saveData');await start();await H.shot('work');
  await quit();const clock=(await H.dbg('mg')).timeLeft;await H.wait(1000);
  expect((await H.dbg('mg')).timeLeft===clock,'終了確認中に時間が減る');await H.shot('confirm');
  await H.page.getByRole('button',{name:'つづける',exact:true}).click();await H.wait(250);
  expect((await H.dbg('mg')).timeLeft<clock,'続けるで時計が再開しない');
  await quit();await H.page.getByRole('button',{name:'ここで やめる',exact:true}).click();await H.until(()=>PokaDebug.mg()?.phase==='result');
  let saved=await H.dbg('persistedSave');expect(saved.coins===before.coins,'未完了の注文で報酬が出る');
  expect(JSON.stringify(saved.shops)===JSON.stringify(before.shops),'未完了の注文で店の進行が変わる');
  await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.idle();
  expect((await H.dbg('storeState')).shop==='crepe','元の店内へ戻らない');
  await start();const order=await H.dbg('mg');for(const label of order.order.want)await H.tapLabel(label);await H.tapLabel('できあがり！');
  await H.until(()=>PokaDebug.mg()?.n===1&&PokaDebug.mg()?.phase==='work');
  const round=await H.dbg('mg');await quit();await H.page.getByRole('button',{name:'ここで やめる',exact:true}).click();await H.until(()=>PokaDebug.mg()?.phase==='result');await H.shot('result');
  saved=await H.dbg('persistedSave');expect(saved.coins===before.coins+round.earn+round.tips,'完了した注文だけの精算でない');
  expect(saved.shops.crepe.rep>before.shops.crepe.rep&&saved.shops.crepe.plays===before.shops.crepe.plays,'ひょうばん/完走数の精算が違う');
  for(const key of ['bag','wardrobe','furn','rooms'])expect(JSON.stringify(saved[key])===JSON.stringify(before[key]),'持ち物が変化: '+key);
  await H.wait(2000);expect((await H.dbg('persistedSave')).coins===saved.coins,'途中終了で二重払い');
  await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();expect((await H.dbg('saveData')).coins===saved.coins,'再読み込みで報酬が消える');
},{viewport,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('district-travel-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');
  const d=await H.dbg('saveData');d.coins=49;await H.dbg('seedSave',d);await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
  let t=await H.dbg('districtTravel');expect(t.names.town==='ネリカスタウン'&&t.names.city==='池袋'&&!t.walkIns.length,'地名/電車専用');expect(t.places.city.y===159&&t.places.heiwadai.y===358,'町の位置');
  await H.dbg('station','heiwadai_station');await H.page.getByRole('button',{name:'池袋えきへ（50コイン）',exact:true}).click();await H.dialogs();expect((await H.dbg('saveData')).coins===49,'残高不足で差引');
  await H.dbg('coins',51);const before=(await H.dbg('saveData')).coins;
  await H.dbg('station','heiwadai_station');await H.page.getByRole('button',{name:'やめておく',exact:true}).click();expect((await H.dbg('saveData')).coins===before,'中止で差引');
  await H.dbg('station','heiwadai_station');await H.page.getByRole('button',{name:'池袋えきへ（50コイン）',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='travel'&&PokaDebug.idle());await H.shot('train');
  await H.until(()=>PokaDebug.state().map==='city'&&PokaDebug.idle(),15000);expect((await H.dbg('saveData')).coins===before-50,'運賃一回');
  await H.dbg('station','city_station');await H.page.getByRole('button',{name:'平和台えきへ',exact:true}).click();await H.until(()=>PokaDebug.state().map==='heiwadai'&&PokaDebug.idle(),15000);expect((await H.dbg('saveData')).coins===before-50,'帰り無料');
  await H.dbg('atlas');await H.shot('map');
},{viewport,timeout:90000});

// バス（js/transit.js の Transit.bus・オーナーの FB 2026-09-30）: おうちの よこの バスていから どこの 地図へも 100コイン。池袋の バスていから かえる。けいじばんは おうちの ひだり よこ
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-bus-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('hour',12);await H.dbg('weather','clear');
  const setCoins=async n=>{await H.dbg('coins',-1e9);await H.dbg('coins',n);}; // PokaDebug.coins は たす（0 より へらない）
  await setCoins(99);
  const tapStop=async map=>{
    const s0=await H.dbg('busStopAt',map);await H.dbg('teleport',map,s0.front.x,s0.front.y,'up');await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);await H.wait(300);
    const s=await H.dbg('busStopAt',map);await H.tap(s.cx,s.cy);await H.page.locator('.modal-wrap .bus-picker').waitFor({timeout:8000});await H.wait(250);return s;
  };
  const home=await tapStop('town');
  const lay=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),b=[...document.querySelectorAll('.bus-grid .btn')];return {over:document.documentElement.scrollWidth>innerWidth,n:b.length,big:b.every(x=>r(x).height>=43.5&&r(x).width>=43.5),inside:b.every(x=>r(x).left>=-1&&r(x).right<=innerWidth+1&&r(x).bottom<=innerHeight+1),fit:b.every(x=>x.scrollWidth<=x.clientWidth+1),names:b.map(x=>x.getAttribute('aria-label'))};});
  expect(!lay.over&&lay.n===8&&lay.big&&lay.inside&&lay.fit,'バスの まどが はみ出す '+JSON.stringify(lay));
  expect(!lay.names.includes('ネリカスタウンへ')&&lay.names.includes('池袋 いけぶくろへ')&&lay.names.includes('どんぐりのもりへ'),'バスの いきさき '+JSON.stringify(lay.names));
  await H.shot('picker');
  // コインが たりない → ひとこと・へらない・町の まま
  await H.page.getByRole('button',{name:'池袋 いけぶくろへ',exact:true}).click();await H.until(()=>document.querySelector('.dlg-text')?.textContent.includes('100コインが ひつようだよ'),8000);await H.dialogs();await H.idle();
  expect((await H.dbg('saveData')).coins===99&&(await H.dbg('state')).map==='town','コインが たりないのに のれる');
  // 250コイン → 池袋へ（100コイン）→ 池袋の バスていの まえに つく
  await setCoins(250);await tapStop('town');await H.page.getByRole('button',{name:'池袋 いけぶくろへ',exact:true}).click();
  await H.until(()=>PokaDebug.state().scene==='travel'&&PokaDebug.idle(),10000);const trip=await H.dbg('travel');expect(trip.kind==='bus'&&trip.party.length===3&&trip.label==='池袋 いけぶくろ','バスの たび '+JSON.stringify(trip));await H.wait(600);await H.shot('bus');
  await H.until(()=>PokaDebug.state().map==='city'&&PokaDebug.idle(),15000);
  let st=await H.dbg('state');const cs=await H.dbg('busStopAt','city');expect((await H.dbg('saveData')).coins===150&&st.pos.join()===[cs.front.x,cs.front.y].join(),'池袋の バスていの まえに つかない '+JSON.stringify([st.pos,cs.front]));await H.shot('city');
  // 池袋の バスていから ネリカスタウンへ（100コイン）→ おうちの よこの バスていの まえ
  await tapStop('city');await H.page.getByRole('button',{name:'ネリカスタウンへ',exact:true}).click();await H.until(()=>PokaDebug.state().map==='town'&&PokaDebug.idle(),20000);
  st=await H.dbg('state');expect((await H.dbg('saveData')).coins===50&&st.pos.join()===[home.front.x,home.front.y].join(),'おうちの よこに かえれない '+JSON.stringify([st.pos,home.front]));
  // まどを とじる → へらない
  await tapStop('town');await H.page.locator('.modal-wrap .close').last().click();await H.idle();expect((await H.dbg('saveData')).coins===50&&(await H.dbg('state')).map==='town','とじても へる');
  // けいじばんは おうちの ひだり よこ（タップで ひらく）
  const at0=await H.dbg('questBoardAt');await H.dbg('teleport','town',at0.x,at0.y+1,'up');await H.until(()=>G.sceneName==='world'&&PokaDebug.idle(),10000);await H.wait(300);
  const at=await H.dbg('questBoardAt');await H.tap(at.cx,at.cy);await H.page.locator('.modal-wrap .neri-quests').waitFor({timeout:8000});await H.wait(250);await H.page.locator('.modal-wrap .close').last().click();await H.idle();await H.wait(2500);await H.shot('home-row');
  // もり（てきの いる 地図）へも いける
  if(viewport.width===390){await setCoins(100);await tapStop('town');await H.page.getByRole('button',{name:'どんぐりのもりへ',exact:true}).click();await H.until(()=>PokaDebug.state().map==='forest'&&PokaDebug.idle(),20000);await H.wait(500);st=await H.dbg('state');expect((await H.dbg('saveData')).coins===0&&st.scene==='world','もりへ いけない '+JSON.stringify(st));await H.shot('forest');}
  await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();expect((await H.dbg('saveData')).coins===(viewport.width===390?0:50),'さいかいで コインが かわる');
},{viewport,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('mac-kitchen-'+viewport.width,async H=>{
 await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');await H.dbg('teleport','heiwadai',27,32,'up');await H.idle();await H.shot('outside');
 await H.dbg('mac',2);await H.until(()=>PokaDebug.state().scene==='shop'&&!PokaDebug.state().transitioning);await H.dialogs();await H.until(()=>!!PokaDebug.macState());
 const money=(await H.dbg('saveData')).coins;let s=await H.dbg('macState');expect(s.want.length===6&&s.buttons.every(b=>b.w>=44&&b.h>=44),'注文と操作サイズ');
 await H.tapLabel('◀');expect((await H.dbg('macState')).plate<s.plate,'受け皿が左へ動かない');await H.tapLabel('▶');
 await H.tapLabel('あげる');await H.until(()=>PokaDebug.macState()?.stage==='gold',12000);await H.shot('gold');await H.tapLabel('ひきあげる');s=await H.dbg('macState');expect(s.fries.score===100&&s.fries.state==='done','音の合図でカリッと揚がらない');
 expect(s.time>6&&s.falling.length>0,'ポテト中にバーガーが止まる');
 await H.page.getByRole('button',{name:'おてつだいを やめる',exact:true}).click();const paused=await H.dbg('macState');await H.wait(1000);expect((await H.dbg('macState')).time===paused.time,'中止確認中に調理時計が進む');await H.page.getByRole('button',{name:'ここで やめる',exact:true}).click();await H.until(()=>PokaDebug.mg()?.phase==='result');expect((await H.dbg('saveData')).coins===money,'未完成の注文が報酬になる');
},{viewport,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-school-'+viewport.width,async H=>{
 await H.newGameFast();await H.dbg('hour',11);await H.dbg('weather','clear');await H.dbg('coins',9000);const before=await H.dbg('saveData');
 const layout=await H.dbg('townLayout','town');expect(layout,'町の配置');
 const sd=layout.doors.find(d=>d.act.venue==='school');await H.dbg('teleport','town',sd.x+2,sd.y+1,'left');await H.idle();await H.shot('school-street');await H.dbg('walkTo',sd.x,sd.y);await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),20000);
 let s=await H.dbg('venueState');expect(s.id==='school'&&s.party.length===3&&s.routeCount.every(x=>x.reachable),'学校の通路');await H.dbg('venueVisit','こくばん');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();await H.shot('classroom');
 await H.page.getByRole('button',{name:'たてものを でる',exact:true}).click();await H.until(()=>PokaDebug.state().map==='town'&&PokaDebug.idle());
 await H.dbg('venue','nursery');await H.idle();await H.dbg('venueVisit','つみき');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();await H.shot('nursery');s=await H.dbg('venueState');expect(s.id==='nursery'&&s.party.length===3&&s.routeCount.every(x=>x.reachable),'保育園の通路');
 await H.dbg('save');const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn','rooms'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'見学で持ち物が変わる '+k);expect(after.world.map==='town','屋内座標を町へ保存');
 await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();expect((await H.dbg('state')).map==='town','見学から再開できない');
},{viewport,timeout:120000});

await (await import("./town-dialogue-smoke.mjs")).townDialogueSmoke({scenario,expect});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-retail-'+viewport.width,async H=>{
 await H.newGameFast();await H.dbg('coins',199850);await H.dbg('hour',12);const before=await H.dbg('saveData');
 await H.dbg('teleport','city',68,30,'up');await H.idle();await H.wait(300);await H.shot('sunshine-street');
 await H.dbg('venue','electronics');await H.idle();let s=await H.dbg('venueState');expect(s.floor===2&&s.party.length===3,'家電2F');
 await H.dbg('venueVisit','ドラム洗濯機');await H.page.getByRole('button',{name:'かう',exact:true}).waitFor();await H.shot('washer-display');await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.idle();
 expect((await H.dbg('saveData')).furn.ike_washer_0===1,'展示から洗濯機を購入');
 await H.dbg('venueVisit','エレベーター 2F／10F');await H.page.getByRole('button',{name:'10F',exact:true}).click();await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===10&&!s.changingFloor;},20000);await H.shot('electronics-10f');
 await H.dbg('venueVisit','星あかりスマホ');await H.page.getByRole('button',{name:'かう',exact:true}).waitFor();await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.page.getByRole('button',{name:'きる！',exact:true}).click();await H.idle();expect((await H.dbg('saveData')).wardrobe.ike_phone_0,'スマホ購入');
 await H.dbg('venue','mall');await H.idle();await H.dbg('venueVisit','ふんすい ひろば');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();await H.shot('mall-atrium');
 await H.dbg('venueVisit','2Fへ のぼる');await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===2&&!s.changingFloor;},20000);await H.shot('mall-2f');
 await H.dbg('venueVisit','すばーたっくすの テーブル');await H.page.getByRole('button',{name:/ふわラテ/}).click();await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();
 await H.dbg('venueVisit','3Fへ のぼる');await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===3&&!s.changingFloor;},20000);s=await H.dbg('venueState');expect(s.fixtures.some(f=>f.action==='puzzle'),'3Fパズル');await H.shot('mall-3f');
 await H.dbg('venue','office');await H.until(()=>document.querySelector('.dlg-text')?.textContent.includes('あいにきたよー')); await H.dialogs();await H.idle();await H.dbg('venueVisit','まま');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();await H.shot('mama-office');
 await H.dbg('hour',18);await H.wait(200);expect(!(await H.dbg('mamaWork'))&&(await H.dbg('venueState')).fixtures.find(f=>f.kind==='parent').hidden,'18時退勤');
 const after=await H.dbg('saveData');expect(after.coins===before.coins-7200-9000-390,'購入・食事の合計');await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();const saved=await H.dbg('saveData');expect(saved.coins===after.coins&&saved.furn.ike_washer_0===1&&saved.wardrobe.ike_phone_0,'買い物の保存');
},{viewport,timeout:180000});

// 池袋: サンシャインいけぶに 入れるのは いけぶの 入口だけ（js/ikebukuro-town.js の NOT_MALL）。
// えきまえ館など まえは いけぶに つながって いた 建物は ひとこと → 町の まま。ちかみちは いけぶの 入口の まえに でる → いけぶの 入口から 入る
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-mall-doors-'+viewport.width,async H=>{
 await H.newGameFast();await H.dbg('hour',12);await H.dbg('weather','clear');const before=await H.dbg('saveData');
 const layout=await H.dbg('townLayout','city'),door=id=>layout.doors.find(d=>d.id===id),mall=layout.doors.filter(d=>d.act.type==='venue'&&d.act.venue==='mall');
 expect(mall.length===2&&mall.every(d=>d.id==='ike_mall'),'いけぶに 入れる 入口が いけぶの 入口 だけで ない '+JSON.stringify(mall.map(d=>d.id)));
 const said=t=>H.until(t=>document.querySelector('.dlg-text')?.textContent.includes(t),10000,t);
 for(const id of ['city_clothes','city_market','city_furniture','city_cafe','city_reading','relay']){
  const d=door(id);expect(d&&d.act.type==='visit','ひとことの 入口 '+id+' '+JSON.stringify(d?.act));
  await H.dbg('teleport','city',d.x,d.y+1,'up');await H.idle();await H.dbg('walkTo',d.x,d.y);
  await said(d.act.text.split('\n')[0].slice(0,12));if(id==='city_clothes'){await said(d.act.text.slice(-8));await H.shot('annex-visit');}
  await H.dialogs();await H.idle();const s=await H.dbg('state');
  expect(s.scene==='world'&&s.map==='city'&&Math.abs(s.pos[0]-d.x)<=1&&s.pos[1]>d.y,id+' の 入口で いけぶに 入って しまう '+JSON.stringify(s));
 }
 const g=door('city_gallery'),to=g?.act.to,main=to&&mall.find(d=>d.x===to.x&&d.y===to.y-1);
 expect(g&&g.act.type==='walkway'&&to.map==='city'&&main,'ちかみちの でぐちが いけぶの 入口の まえで ない '+JSON.stringify(g?.act));
 await H.dbg('teleport','city',g.x,g.y+1,'up');await H.idle();await H.dbg('walkTo',g.x,g.y);await said('ちかみち');await H.dialogs();
 await H.until(t=>{const s=PokaDebug.state();return s.scene==='world'&&s.map==='city'&&s.pos[0]===t[0]&&s.pos[1]===t[1]&&PokaDebug.idle();},20000,[to.x,to.y]);
 await H.wait(300);await H.shot('walkway-exit');
 await H.dbg('walkTo',main.x,main.y);await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),20000);
 expect((await H.dbg('venueState'))?.id==='mall','いけぶの 入口から いけぶに 入れない');
 const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'入口で 持ち物が 変わる '+k);
},{viewport,timeout:120000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-buildings-'+viewport.width,async H=>{
 // 池袋の ふつうの ビル と 大きな はくぶつかん（オーナーの FB 2026-10-01「池袋のマルシェ館とインテリア館、サンシャイン池袋駅前館は普通のビルに改めなさい。屋上庭園は削除し、恐竜博物館を大きくしなさい」）
 await H.newGameFast();await H.dbg('hour',12);await H.dbg('weather','clear');const before=await H.dbg('saveData');
 const B=await H.eval(()=>MAP_DEFS.city.buildings.map(b=>({id:b.id,x:b.x,y:b.y,w:b.w,h:b.h,door:b.door,label:b.label||'',asset:b.asset,act:b.act||null})));
 const by=id=>B.find(b=>b.id===id),labels=B.map(b=>b.label).join('／');
 expect(!by('ike_annex3')&&!/ていえん|マルシェ館|インテリア館|えきまえ館/.test(labels),'おくじょう ていえん・いけぶの 別館が のこって いる '+labels);
 for(const [id,label,asset] of [['city_clothes','えきまえ ビル','ikebukuro.officeblock'],['city_market','れんが ビル','ikebukuro.slim_brick'],['city_furniture','あおぞら ビル','ikebukuro.slim_glass']]){
  const b=by(id);expect(b&&b.label===label&&b.asset===asset&&b.act.type==='visit'&&/ふつうの ビル/.test(b.act.text)&&!/いけぶの いりぐち|じゅんびちゅう/.test(b.act.text),'ふつうの ビル '+id+' '+JSON.stringify(b));}
 const mu=by('city_museum');expect(mu.x===33&&mu.y===38&&mu.w===17&&mu.h===7&&mu.door===8&&mu.asset==='ikebukuro.museum'&&mu.act.type==='indoor','はくぶつかんが 大きく ない '+JSON.stringify(mu));
 // はくぶつかんの まえの みち（いりぐちの まえ）・ほかの 建物と かさならない
 expect(B.every(b=>b===mu||b.x+b.w<=mu.x||b.x>=mu.x+mu.w||b.y+b.h<=mu.y||b.y>=mu.y+mu.h),'はくぶつかんが ほかの 建物と かさなる');
 const said=t=>H.until(t=>document.querySelector('.dlg-text')?.textContent.includes(t),10000,t);
 // まちで みる: えきまえ ビル（駅の となり）・れんが ビルと あおぞら ビル（Mee と いけぶの あいだ）→ はいると ひとこと
 for(const [id,tag] of [['city_clothes','station'],['city_market','slim']]){
  const b=by(id),d=[b.x+b.door,b.y+b.h-1];await H.dbg('teleport','city',d[0],d[1]+2,'up');await H.idle();await H.wait(900);await H.shot(tag);
  await H.dbg('walkTo',d[0],d[1]);await said(b.act.text.split('\n')[0].slice(0,10));await H.dialogs();await H.idle();
  const st=await H.dbg('state');expect(st.scene==='world'&&st.map==='city','ふつうの ビルに はいって しまう '+id+' '+JSON.stringify(st));}
 // はくぶつかん（ひる・よる）。ひるの 画面に はくぶつかんの なまえの いた
 const md=[mu.x+mu.door,mu.y+mu.h-1];
 for(const [tag,hour] of [['museum',12],['museum-night',21]]){await H.dbg('hour',hour);await H.dbg('teleport','city',md[0],md[1]+3,'up');await H.idle();await H.wait(900);await H.shot(tag);}
 await H.dbg('hour',12);
 const after=await H.dbg('saveData');for(const k of ['coins','bag','wardrobe','furn'])expect(JSON.stringify(after[k])===JSON.stringify(before[k]),'もちものが かわる '+k);
},{viewport,full:viewport.width===375,timeout:120000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-mall-'+viewport.width,async H=>{
 // サンシャインいけぶ（斜め上から 見る モール・js/iso-venue.js・mall-art.js・ike-mall.js）: 1F〜3F・タップで あるく・台を タップして かう・フロアマップ・エレベーター・エスカレーター・ステージ
 await H.newGameFast();await H.dbg('coins',99850);await H.dbg('hour',12);
 await H.dbg('venue','mall');await H.idle();await H.until(()=>PokaDebug.venueIso()?.ready,20000);let v=await H.dbg('venueIso');expect(v.iso&&v.floor===1&&v.crowd>=4&&v.holes===0,'1Fが 斜めの 館で ない '+JSON.stringify(v));
 // フロア案内・たてものを でる は ひだりうえに 小さく（オーナーの FB 2026-10-01）・おうちへ は みぎうえ・HUD と かさならない・したは ひとことだけ（ボタン なし・1ぎょう）
 const ui=async()=>H.eval(()=>{const r=e=>e.getBoundingClientRect(),bs=[...document.querySelectorAll('.venue-top .btn,.store-home')],hud=[...document.querySelectorAll('.hud > *')].filter(e=>e.offsetParent).map(r),bar=document.querySelector('.venue-controls'),hit=(a,b)=>a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5,rs=bs.map(r);
  return {names:bs.map(b=>b.textContent),small:rs.filter(q=>q.height<44).length,big:rs.filter(q=>q.height>48||q.width>150).length,low:rs.filter(q=>q.bottom>150).length,overlap:rs.some((a,i)=>rs.some((b,j)=>i<j&&hit(a,b)))||rs.some(a=>hud.some(h=>hit(a,h))),out:rs.filter(q=>q.left<-0.5||q.right>innerWidth+0.5).length,wide:document.documentElement.scrollWidth>innerWidth,barBtns:bar.querySelectorAll('.btn').length,barH:r(bar).height};});
 let u=await ui();expect(u.names.join()==='フロア案内,たてものを でる,おうちへ'&&!u.small&&!u.big&&!u.low&&!u.overlap&&!u.out&&!u.wide&&u.barBtns===0&&u.barH<=32,'そうさの ボタン '+JSON.stringify(u));await H.shot('mall-1f');
 // 店内 BGM は フロアの 名曲（1F ガヴォット）。服の 台は マネキン（わんこの ミニモデルを つかわない）
 const bgm=()=>H.eval(()=>Sound.cur?.name||Sound.want);expect(await bgm()==='mall_1f','1F の BGM '+await bgm());
 const mq=await H.eval(()=>{const k=[...SvgCache.map.keys()];return {mq:new Set(k.filter(x=>x.startsWith('mannequin:')).map(x=>x.split('@')[0])).size,wanko:k.filter(x=>x.startsWith('mallwear:')).length};});
 expect(mq.mq>=9&&!mq.wanko,'服の 台が マネキンで ない '+JSON.stringify(mq));
 // ゆかを タップして あるく
 const tapTile=async(x,y)=>{const p=await H.dbg('venuePoint',x,y);await H.page.touchscreen.tap(p.x,p.y);};
 await tapTile(5,21);await H.until(()=>{const v=PokaDebug.venueIso();return v.leader[0]===5&&v.leader[1]===21;},15000);
 // 店の まえまで あるいて、マネキンの 台を タップ → かう
 await H.dbg('venueWalk',3,7);await H.until(()=>{const v=PokaDebug.venueIso();return v.leader[0]===3&&v.leader[1]===7;},20000);await H.wait(700);
 await tapTile(4,6);await H.until(()=>{const v=PokaDebug.venueIso();return v.leader[0]===4&&v.leader[1]===6;},15000);await H.wait(500);
 let s=await H.dbg('venueState');const wears=s.fixtures.filter(f=>f.action==='buy'&&f.buyKind==='wear'&&f.shopId==='ike_hane'),p=await H.dbg('venuePoint',0,0,wears[0].label);await H.page.touchscreen.tap(p.x,p.y);
 await H.page.getByRole('button',{name:'かう',exact:true}).waitFor({timeout:20000});await H.shot('mall-buy');
 const shown=await H.eval(()=>document.querySelector('.panel')?.textContent||''),wear=wears.find(f=>shown.includes(f.label));expect(wear,'タップした 台の 品物が 出ない '+shown.slice(0,80));
 await H.page.getByRole('button',{name:'かう',exact:true}).click();await H.wait(300);
 const kiru=H.page.getByRole('button',{name:'きる！',exact:true});if(await kiru.count())await kiru.click();await H.idle();expect((await H.dbg('saveData')).wardrobe[wear.item],'台から かえない '+wear.item);
 // レジの 画面でも フロアの 曲の まま（とちゅうから やりなおさない）
 await H.dbg('venueVisit','はねーずの レジ');const closeBtn=H.page.getByRole('button',{name:'とじる',exact:true}).last();await closeBtn.waitFor();expect(await bgm()==='mall_1f','レジの 画面の BGM '+await bgm());
 await closeBtn.click();await H.idle();expect(await bgm()==='mall_1f','レジを とじた あとの BGM '+await bgm());
 // ステージ・ふんすい
 await H.dbg('venueVisit','ステージ');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();
 await H.dbg('venueVisit','ふんすい ひろば');await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();await H.shot('mall-fountain');
 // フロアマップ: 3F の パズルへ（エレベーターで いって あるく）
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const g=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),bs=[...document.querySelectorAll('.mall-guide .btn')];return {tabs:[...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map(b=>b.textContent).join(),small:bs.filter(b=>r(b).height<43.5).length,out:bs.filter(b=>r(b).left<-0.5||r(b).right>innerWidth+0.5).length,over:bs.filter(b=>b.scrollWidth>b.clientWidth+1).length,spots:document.querySelectorAll('.mall-guide .mg-spot').length};});
 expect(g.tabs==='1F,2F,3F,12F,13F'&&!g.small&&!g.out&&!g.over&&g.spots>=8,'フロアマップの ボタン '+JSON.stringify(g));await H.shot('mall-map');
 await H.page.getByRole('button',{name:'3F',exact:true}).click();await H.page.locator('.mall-guide .mg-spot[data-label="なかよしパズル"]').click();
 await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===3&&!s.changingFloor;},20000);await H.until(()=>{const v=PokaDebug.venueIso();return v.leader[1]>=7&&v.leader[1]<=10&&v.leader[0]>=14&&v.leader[0]<=23;},20000);
 v=await H.dbg('venueIso');expect(v.holes>=2,'3Fの ふきぬけ');expect(await bgm()==='mall_3f','3F の BGM '+await bgm());await H.shot('mall-3f');
 // エスカレーターで 2F・エレベーターで 1F
 await H.dbg('venueVisit','2Fへ おりる');await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===2&&!s.changingFloor;},20000);await H.idle();expect(await bgm()==='mall_2f','2F の BGM '+await bgm());await H.shot('mall-2f');
 await H.dbg('venueVisit','すばーたっくすの テーブル');await H.page.getByRole('button',{name:/ふわラテ/}).click();await H.page.locator('.dlg-text').waitFor();await H.dialogs();await H.idle();
 await H.dbg('venueVisit','エレベーター');await H.page.getByRole('button',{name:'1F',exact:true}).click();await H.until(()=>{const s=PokaDebug.venueState();return s?.floor===1&&!s.changingFloor;},20000);await H.idle();
 expect((await H.dbg('venueIso')).leader.join()==='2,12','エレベーターを おりた 場所');
 // でぐちの マットから 外へ（池袋の まち）
 await H.dbg('venueVisit','たてものを でる');await H.until(()=>PokaDebug.state().map==='city'&&PokaDebug.idle(),20000);
 const d=await H.dbg('saveData');expect(d.coins<99850&&d.world.map==='city','おかね・もどる 場所 '+d.coins+' '+JSON.stringify(d.world));
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-arcade-'+viewport.width,async H=>{
 // クレーンゲーム（crane-*.js）: 12台・4しゅるいを ボタンで あそぶ・100コイン・ごほうび（ぬいぐるみ・コイン）・中断して つづきから。館は 斜め上（ArcadeArt）
 // 1F の 7台は 日がわり（UI-16）で 山の ならびが 日で かわる → 日を きめる（10/9 は わんこの 台の 山で 1〜3こめを ねらうと とれる 日）
 await H.newGameFast();await H.dbg('coins',9850);await H.dbg('calendar','2026-10-09');await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 const iso=await H.dbg('venueIso');expect(iso.iso&&iso.crowd>=2,'斜めの 館・あるく おきゃくさん '+JSON.stringify(iso));
 const s=await H.dbg('venueState');expect(s.fixtures.filter(f=>f.action==='crane').length===12&&!s.fixtures.some(f=>f.kind==='gacha')&&!s.fixtures.some(f=>f.kind==='photobooth')&&s.fixtures.some(f=>f.kind==='directory')&&s.fixtures.some(f=>f.kind==='counter'),'12台の筐体・フロア あんない・カウンター（ガチャは 2F・ぷりくらは 3F）');await H.shot('hall');
 expect(s.routeCount.every(r=>r.reachable),'いけない ところが ある '+JSON.stringify(s.routeCount.filter(r=>!r.reachable)));
 const vis=s.fixtures.filter(f=>f.action==='crane'&&f.screen.x>0&&f.screen.x<viewport.width);expect(vis.length>=3,'店に はいった ところで 台が 見えない '+vis.length);
 const bgm=await H.eval(()=>Sound.want||Sound.cur?.name);expect(bgm==='arcade_hall','店の BGM '+bgm);
 // フロアマップ: コーナーの 一覧 → けいひん カウンター まで あるく → まえの けいひんの こうかん
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const g=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),bs=[...document.querySelectorAll('.mall-guide .btn')];return {spots:[...document.querySelectorAll('.mall-guide .mg-spot')].map(b=>b.dataset.label),small:bs.filter(b=>r(b).height<43.5).length,out:bs.filter(b=>r(b).left<-0.5||r(b).right>innerWidth+0.5).length};});
 expect(['ぬいぐるみ コーナー','スウィートランド','コイン プッシャー','トライポッド','リングフック','けいひん カウンター','フロア あんない'].every(l=>g.spots.includes(l))&&!g.spots.some(l=>/カプセル|ガチャ|ぷりくら/.test(l))&&g.small===0&&g.out===0,'フロアマップ '+JSON.stringify(g));await H.shot('guide');
 await H.page.locator('.mall-guide .mg-spot[data-label="けいひん カウンター"]').click();await H.until(()=>{const v=PokaDebug.venueState();return v&&v.party[0].y>=17.5&&PokaDebug.idle();},20000);
 await H.dbg('venueVisit','けいひん カウンター');await H.page.getByRole('button',{name:'まえの けいひんを みる',exact:true}).click();await H.page.locator('.modal-wrap .grid > *').first().waitFor();
 const shop=await H.eval(()=>[...document.querySelectorAll('.modal-wrap .grid > *')].length);expect(shop===2,'こうかんの しなもの（かざり）'+shop);await H.shot('counter');
 await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.idle();
 // そうさばん: はみ出さない・ボタンは 44px いじょう・ことばが 1ぎょう
 const panel=async()=>H.eval(()=>{const p=document.querySelector('.crane-panel').getBoundingClientRect(),bs=[...document.querySelectorAll('.crane-panel button')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect()),st=document.querySelector('.crane-status');return {p:[p.left,p.top,p.right,p.bottom],w:innerWidth,h:innerHeight,small:bs.filter(r=>r.width<44||r.height<44).length,n:bs.length,over:st.scrollWidth>st.clientWidth+1||st.scrollHeight>st.clientHeight+2};});
 const okPanel=async(tag)=>{const q=await panel();expect(q.p[0]>=0&&q.p[1]>=64&&q.p[2]<=q.w+0.5&&q.p[3]<=q.h+0.5&&q.small===0&&!q.over&&q.n>=2,'そうさばんが 不正 '+tag+' '+JSON.stringify(q));};
 const start=async(i)=>{const before=(await H.dbg('saveData')).coins;expect(await H.dbg('arcadeStart',i),'100コインで 開始 '+i);await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning);expect((await H.dbg('arcadeState')).coins===before-100,'100コイン '+i);await H.wait(500);};
 const done=async(i,ms=45000)=>{await H.dbg('arcadeFast',4);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},ms);const r=await H.dbg('arcadeState');expect(await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).isVisible()&&await H.page.getByRole('button',{name:/もういちど/}).isVisible(),'けっかの ボタン '+i);return r;};
 const back=async()=>{await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();expect((await H.dbg('state')).scene==='venue','店に もどらない');};
 // 1) 3本アーム: やじるしを おしつづけると うごく・タップで すこし・カメラ・つかむ → けっか
 await start(0);await okPanel('claw');await H.shot('claw');
 let a=await H.dbg('arcadeState');expect(a.type==='claw'&&a.phase==='move'&&a.time>25&&/のこり/.test(a.status),'3本アームの はじめ '+JSON.stringify(a));
 const right=await H.page.getByRole('button',{name:'みぎ',exact:true}).boundingBox();await H.hold(right.x+right.width/2,right.y+right.height/2,700);
 const back1=await H.page.getByRole('button',{name:'おく',exact:true}).boundingBox();await H.hold(back1.x+back1.width/2,back1.y+back1.height/2,500);
 let b=await H.dbg('arcadeState');expect(b.claw.x>a.claw.x+3&&b.claw.z>a.claw.z+2,'やじるしで アームが うごかない '+JSON.stringify([a.claw,b.claw]));
 await H.page.getByRole('button',{name:'カメラ',exact:true}).click();await H.wait(300);expect((await H.dbg('arcadeState')).camera==='side','よこの カメラに ならない');await H.shot('claw-side');
 await H.page.getByRole('button',{name:'まえから',exact:true}).click();await H.wait(200);expect((await H.dbg('arcadeState')).camera==='front','まえの カメラに もどらない');
 // ねらって（テスト用に アームは つよく）つかむ。とれたら わんこの ぬいぐるみ（4しゅの どれか）が ふえる
 const count=async(prefix)=>{const f=(await H.dbg('saveData')).furn;return Object.keys(f).filter(k=>k.startsWith(prefix)).reduce((a,k)=>a+f[k],0);};
 let won=false;
 for(let k=0;k<3&&!won;k++){
  if(k)await start(0);
  await H.dbg('arcadeAim',k);await H.dbg('arcadeLuck',true);const furn=await count('ike_chibi_wanko_');
  await H.page.getByRole('button',{name:'つかむ',exact:true}).click();await H.wait(400);expect((await H.dbg('arcadeState')).phase!=='move','つかむで おりない');
  const r=await done(0);if(k===0)await H.shot('claw-result');
  const now=await count('ike_chibi_wanko_');expect(now===furn+r.got,'ごほうびの かずが ちがう '+JSON.stringify([furn,now,r.got]));won=r.got>0;
  if(won){const txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);expect(/わんこの ぬいぐるみ ×1/.test(txt),'けっかの ことば '+txt);}
  await back();
 }
 expect(won,'つよい アームで ねらっても 3かい とれない');
 // 2) トライポッド: ひかりが アームの ところで「とめる」→ アームが おちる（3かい）
 await start(4);await okPanel('tripod');await H.shot('tripod');
 // ひかりが まわる はやさは 人の ゆびの ため。テストでは アームの ランプに おいて、おなじ しゅんかんに ボタンを おす
 for(let k=0;k<3;k++){await H.until(()=>PokaDebug.arcadeState().phase==='spin',12000);await H.eval(()=>{const r=PokaDebug.arcadeState();PokaDebug.arcadeLight(r.arms.indexOf(1)*2);document.querySelector('.crane-go').click();});await H.wait(150);expect((await H.dbg('arcadeState')).arms.filter(x=>!x).length===k+1,'とめるで アームが おちない '+k);}
 let t=await done(4);expect(t.arms.filter(x=>!x).length>=2&&t.stops===0,'トライポッドの アームが おちない '+JSON.stringify(t));await back();
 // 3) スウィートランド: すくう → おとす を 3かい
 await start(2);await okPanel('sweet');await H.shot('sweet');
 for(let k=0;k<3;k++){await H.until(()=>PokaDebug.arcadeState().phase==='swing',20000);await H.wait(700);await H.page.getByRole('button',{name:'すくう',exact:true}).click();await H.until(()=>PokaDebug.arcadeState().phase==='swing2',20000);await H.wait(600);await H.page.getByRole('button',{name:'おとす',exact:true}).click();await H.wait(300);}
 const sw=await done(2,60000);expect(sw.scoops===0,'スウィートを 3かい できない');const mini=await count('ike_mini_');expect(mini===sw.got,'ミニマスコットの かず '+JSON.stringify([mini,sw.got]));await back();
 // コイン プッシャー: ◀ ▶ で ランチャー・「いれる」で 10まい・チャンス → スロット・てまえに おちた メダル 1まい 10コイン（1にちの 上限）
 {const c0=(await H.dbg('saveData')).coins;await start(3);await okPanel('pusher');
  const p0=await H.dbg('arcadeState');expect(p0.type==='pusher'&&p0.phase==='play'&&p0.pusher.left===10&&p0.bodies>=25&&p0.got===0&&/のこり 10まい/.test(p0.status),'プッシャーの はじめ '+JSON.stringify([p0.pusher,p0.bodies,p0.got,p0.status]));await H.shot('pusher');
  expect(await H.page.getByRole('button',{name:'おく',exact:true}).count()===0&&!(await H.page.getByRole('button',{name:'カメラ',exact:true}).isVisible().catch(()=>false)),'プッシャーに ▲ ▼・カメラが ある');
  const lb=await H.page.getByRole('button',{name:'ひだり',exact:true}).boundingBox();await H.hold(lb.x+lb.width/2,lb.y+lb.height/2,600);
  const p1=await H.dbg('arcadeState');expect(p1.pusher.lx<p0.pusher.lx-4,'◀ で ランチャーが うごかない '+JSON.stringify([p0.pusher.lx,p1.pusher.lx]));
  const put=H.page.getByRole('button',{name:'いれる',exact:true});
  for(let k=0;k<3;k++){await put.click();await H.wait(420);}
  expect((await H.dbg('arcadeState')).pusher.left===7,'「いれる」で メダルが へらない');await H.shot('pusher-drop');
  await H.dbg('arcadeChance');await H.until(()=>{const r=PokaDebug.arcadeState();return r.pusher.slot&&r.pusher.slot.paid;},8000);await H.shot('pusher-slot');
  for(let k=0;k<7;k++){await H.until(()=>!document.querySelector('.crane-go').disabled,8000);await put.click();await H.wait(420);}
  const pd=await done(3,90000),d=await H.dbg('saveData'),pay=Math.min(pd.got*10,600);
  expect(pd.pusher.left===0&&d.coins===c0-100+pay&&d.arcade.coinToday===pay,'プッシャーの コイン '+JSON.stringify([c0,d.coins,pd.got,d.arcade.coinToday]));
  const txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);expect(pd.got===0||txt.includes('メダル '+pd.got+'まいで コイン '+pay),'けっかの ことば '+txt);
  await H.shot('pusher-result');await back();}
 // 4) リングフック: リングに ねらって つかむ
 await start(6);await okPanel('ring');await H.dbg('arcadeAim',0);await H.shot('ring');await H.page.getByRole('button',{name:'つかむ',exact:true}).click();const rg=await done(6);await H.shot('ring-result');await back();
 const save=await H.dbg('saveData');expect(save.arcade.plays>=4&&save.arcade.boards[0]&&save.arcade.boards[4]&&save.arcade.boards[2],'プレイ記録・台の ようす '+JSON.stringify({plays:save.arcade.plays,b:Object.keys(save.arcade.boards)}));
 // 5) 中断して つづきから（おかねは もう はらわない・おなじ 台・アームの ばしょ）
 await start(7);await H.hold(right.x+right.width/2,right.y+right.height/2,500);await H.wait(900);const mid=await H.dbg('arcadeState'),paid=(await H.dbg('saveData')).coins; // はなしても すこし すべる（とまるまで まつ）
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
 await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);await H.dbg('venueVisit','わんこ ぬいぐるみ');await H.page.getByRole('button',{name:'つづける',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning);
 const re=await H.dbg('arcadeState');expect(re.machine===7&&(await H.dbg('saveData')).coins===paid&&Math.abs(re.claw.x-mid.claw.x)<0.6,'つづきから: 台・おかね・アームの ばしょ '+JSON.stringify([mid.claw,re.claw]));
 await H.page.getByRole('button',{name:'つかむ',exact:true}).click();await done(7);await back();
 const end=await H.dbg('saveData');expect(end.arcade.plays===save.arcade.plays+1&&end.arcade.active===null,'中断のあとの 精算');
 await H.dbg('calendar',null);
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('ikebukuro-arcade-2f-'+viewport.width,async H=>{
 // Meeときょれじゃ 2F（UI-14。オーナーの FB 2026-09-30「2階を 実装」「2階に お菓子の UFO キャッチャー」「日替わりで プライズが 変わる」）:
 // 1F の エスカレーター → 2F（ふきぬけ・おかし キャッチャー 5台）→ フロアマップの 1F／2F → おかしの 3本アームで とる（もちものの たべもの）→ スウィートランド おかし → 日づけを かえると けいひんが かわる
 await H.newGameFast();await H.dbg('coins',9850);await H.dbg('calendar','2026-10-05');await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 const s1=await H.dbg('venueState');expect(s1.floor===1&&s1.fixtures.filter(f=>f.action==='crane').length===12&&s1.fixtures.some(f=>f.kind==='escalator'&&f.to===2)&&s1.routeCount.find(r=>r.label==='2Fへ のぼる')?.reachable,'1F の のぼりの エスカレーター '+JSON.stringify(s1.routeCount.filter(r=>/2F/.test(r.label))));
 // エスカレーターに のる → 2F（のりばの まえ）
 expect(await H.dbg('venueVisit','2Fへ のぼる'),'エスカレーターを しらべられない');await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.floor===2&&v.ready&&PokaDebug.idle()&&!PokaDebug.venueState().changingFloor;},20000);await H.wait(300);
 const iso=await H.dbg('venueIso'),s2=await H.dbg('venueState');
 expect(iso.holes===1&&iso.crowd>=2&&s2.floor===2&&/2F/.test(await H.eval(()=>document.querySelector('.hud').textContent)),'2F（ふきぬけ・おきゃくさん・HUD）'+JSON.stringify(iso));
 const gachas=s2.fixtures.filter(f=>f.kind==='gacha'&&f.action==='gacha');expect(gachas.length===12&&gachas.every(f=>f.x>=8&&f.x+f.w<=18&&f.y>=5&&f.y<=10)&&s2.fixtures.filter(f=>f.kind==='gachaboard').length===2,'2F の まんなかの ガチャ コーナー（12だい・2れつ・かんばん）'+JSON.stringify(gachas.map(f=>[f.x,f.y])));
 const cranes=s2.fixtures.filter(f=>f.action==='crane');expect(cranes.length===7&&cranes.map(f=>f.machine).sort((a,b)=>a-b).join()==='12,13,14,15,16,17,18'&&s2.fixtures.some(f=>f.kind==='escalator'&&f.to===1),'2F の おかし キャッチャー 5台・はしわたし 2台・くだりの エスカレーター '+cranes.map(f=>f.machine));
 expect(s2.routeCount.every(r=>r.reachable),'2F に いけない ところ '+JSON.stringify(s2.routeCount.filter(r=>!r.reachable)));
 const vis=cranes.filter(f=>f.screen.x>-40&&f.screen.x<viewport.width+40&&f.screen.y>0&&f.screen.y<viewport.height);await H.shot('arrive');
 const bgm=await H.eval(()=>Sound.want||Sound.cur?.name);expect(bgm==='arcade_hall','2F の BGM '+bgm);
 // フロアマップ: 1F・2F の タブ・2F の コーナー → 1F を えらぶと エスカレーターで おりて あるく
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const g=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),bs=[...document.querySelectorAll('.mall-guide .btn')];return {tabs:[...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map(b=>b.textContent),spots:[...document.querySelectorAll('.mall-guide .mg-spot')].map(b=>b.dataset.label),small:bs.filter(b=>r(b).height<43.5).length,out:bs.filter(b=>r(b).left<-0.5||r(b).right>innerWidth+0.5).length};});
 expect(g.tabs.join()==='1F,2F,3F'&&['おかし キャッチャー','スウィートランド','はしわたし','ガチャ コーナー','1Fへ おりる','3Fへ のぼる'].every(l=>g.spots.includes(l))&&g.small===0&&g.out===0,'2F の フロアマップ '+JSON.stringify(g));await H.shot('guide');
 await H.page.getByRole('button',{name:'1F',exact:true}).click();await H.page.locator('.mall-guide .mg-spot[data-label="けいひん カウンター"]').click();
 await H.until(()=>{const v=PokaDebug.venueState();return v&&v.floor===1&&v.party[0].y>=17.5&&PokaDebug.idle();},25000);
 expect(await H.dbg('venueVisit','2Fへ のぼる'),'1F から もういちど のぼれない');await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.floor===2&&v.ready&&PokaDebug.idle()&&!PokaDebug.venueState().changingFloor;},20000);
 // おかしの 3本アーム（ふくろ）: しらべると きょうの けいひん（日がわり）→ 100コインで あそぶ → ねらって つかむ → とれた おかしは もちもの
 const lineup=await H.dbg('arcadeLineup',12);expect(lineup.day==='2026-10-5'&&lineup.names.length===3&&new Set(lineup.names).size===3,'きょうの けいひん '+JSON.stringify(lineup));
 await H.dbg('venueVisit','おかし ふくろ');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(lineup.names.every(n=>ask.includes(n))&&/まいにち かわる/.test(ask),'けいひんの せつめい '+ask);
 const c0=(await H.dbg('saveData')).coins;await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(500);
 let a=await H.dbg('arcadeState');expect(a.machine===12&&a.type==='claw'&&a.coins===c0-100,'おかしの 3本アーム '+JSON.stringify([a.machine,a.type,a.coins,c0]));
 const q=await H.eval(()=>{const p=document.querySelector('.crane-panel').getBoundingClientRect(),bs=[...document.querySelectorAll('.crane-panel button')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect());return {p:[p.left,p.top,p.right,p.bottom],small:bs.filter(r=>r.width<44||r.height<44).length};});
 expect(q.p[0]>=0&&q.p[1]>=64&&q.p[2]<=viewport.width+0.5&&q.p[3]<=viewport.height+0.5&&q.small===0,'そうさばん '+JSON.stringify(q));await H.shot('snack-claw');
 const bagOf=async()=>{const b=(await H.dbg('saveData')).bag;return lineup.prizes.reduce((n,id)=>n+(b[id]||0),0);};
 const done=async(ms=45000)=>{await H.dbg('arcadeFast',4);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},ms);return H.dbg('arcadeState');};
 let won=false;
 for(let k=0;k<3&&!won;k++){
  if(k){expect(await H.dbg('arcadeStart',12),'もういちど '+k);await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);}
  const before=await bagOf();await H.dbg('arcadeAim',k);await H.dbg('arcadeLuck',true);
  await H.page.getByRole('button',{name:'つかむ',exact:true}).click();const r=await done();if(k===0)await H.shot('snack-result');
  const now=await bagOf();expect(now===before+r.got,'おかしの かず '+JSON.stringify([before,now,r.got]));won=r.got>0;
  if(won){const txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);expect(lineup.names.some(n=>txt.includes(n+' ×')),'けっかの ことば '+txt);}
  await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.ready;},20000);
  const v=await H.dbg('venueIso');expect(v.floor===2&&Math.abs(v.leader[0]-2)<=2&&v.leader[1]<=4,'2F の 台の まえに もどらない '+JSON.stringify(v));
 }
 expect(won,'つよい アームで ねらっても おかしが 3かい とれない');
 // スウィートランド おかし: すくう → おとす を 3かい・おちた ぶんだけ（その日の こつぶ）
 const pieces=await H.dbg('arcadeLineup',15),pb=(await H.dbg('saveData')).bag,p0=pieces.prizes.reduce((n,id)=>n+(pb[id]||0),0);
 expect(await H.dbg('arcadeStart',15),'スウィートランド おかし');await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);await H.shot('snack-sweet');
 for(let k=0;k<3;k++){await H.until(()=>PokaDebug.arcadeState().phase==='swing',20000);await H.wait(700);await H.page.getByRole('button',{name:'すくう',exact:true}).click();await H.until(()=>PokaDebug.arcadeState().phase==='swing2',20000);await H.wait(600);await H.page.getByRole('button',{name:'おとす',exact:true}).click();await H.wait(300);}
 const sw=await done(60000),pa=(await H.dbg('saveData')).bag,p1=pieces.prizes.reduce((n,id)=>n+(pa[id]||0),0);expect(sw.scoops===0&&p1===p0+sw.got,'スウィートの こつぶ '+JSON.stringify([p0,p1,sw.got]));
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();
 // つぎの 日: けいひんが かわる（しらべた ときの せつめいも）・きのうの 台の ようすは つかわない
 await H.dbg('calendar','2026-10-06');const next=await H.dbg('arcadeLineup',12);expect(next.day==='2026-10-6'&&next.names.join()!==lineup.names.join(),'つぎの 日も おなじ けいひん '+JSON.stringify([lineup.names,next.names]));
 await H.dbg('venueVisit','おかし ふくろ');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask2=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(next.names.every(n=>ask2.includes(n)),'つぎの 日の せつめい '+ask2);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 const bag=(await H.dbg('saveData')).bag,got=lineup.prizes.filter(id=>bag[id]>0);expect(got.length>=1&&(await H.eval(ids=>ids.every(id=>BAG_INDEX[id].kind==='food'&&/<svg/.test(Art.iconSvg('bag',id))),got)),'とった おかしが たべものに ならない');
 await H.dbg('calendar',null);
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-daily-1f-'+viewport.width,async H=>{
 // Meeときょれじゃ 1F の 日がわり（UI-16。オーナーの FB 2026-09-30「プライズも もっと 増やして よい。日替わりで プライズは 変わる ように して くれ」）:
 // 1F の 7台は まいにち けいひんが かわる（3人の ぬいぐるみ・ミニマスコット・どうぶつえん・ビッグ ぬいぐるみ・みずべの なかま）→ しらべる（きょうの けいひん・まとめた よびかた）→
 // どうぶつえん（トライポッド）は つぎの 日も とちゅうの けいひんと アームの まま → とれると 家具・つぎから その日の けいひん → もようがえで かざる
 await H.newGameFast();await H.dbg('coins',3000);await H.dbg('calendar','2026-10-05');await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 const s=await H.dbg('venueState'),want={0:'わんこ ぬいぐるみ',2:'ミニマスコット',5:'どうぶつえん',8:'がちゃん ぬいぐるみ',9:'ごじ ぬいぐるみ',10:'ビッグ ぬいぐるみ',11:'みずべの なかま'};
 for(const [i,label] of Object.entries(want)){const f=s.fixtures.find(f=>f.machine===+i);expect(f&&f.label===label&&s.routeCount.find(r=>r.label===label)?.reachable,'1F の 台 '+i+' '+JSON.stringify(f&&f.label));}
 const L={};for(const i of Object.keys(want))L[i]=await H.dbg('arcadeLineup',+i);
 expect(Object.values(L).every(l=>l&&l.day==='2026-10-5')&&[L[0],L[8],L[9]].every(l=>l.names.length===4)&&L[2].names.length===3&&L[5].names.length===1&&L[10].names.length===1&&L[11].names.length===3&&L[5].keep&&!L[0].keep,'きょうの けいひん '+JSON.stringify(Object.values(L).map(l=>l&&l.names)));
 expect(/^わんこの ぬいぐるみ 4しゅ（/.test(L[0].text)&&/^ミニマスコット 3しゅ（/.test(L[2].text)&&/^みずべの なかま 3しゅ（/.test(L[11].text)&&L[10].text===L[10].names[0],'まとめた よびかた '+[L[0].text,L[2].text,L[11].text,L[10].text]);
 const key=await H.eval(()=>ArcadeArt.modelKey(G.scene.fixtures.find(f=>f.machine===10)));expect(key.includes(L[10].prizes[0]),'館の 台の 絵が きょうの けいひんで ない '+key);await H.shot('hall');
 // しらべる: まとめた よびかた・まいにち かわる・どうぶつえんは とれるまで そのまま
 const ask=async(label)=>{await H.dbg('venueVisit',label);await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);return H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);};
 const fits=()=>H.eval(()=>{const d=document.querySelector('.dlg-shade.ask .dialog').getBoundingClientRect();return d.left>=-0.5&&d.right<=innerWidth+0.5&&d.top>=-0.5&&d.bottom<=innerHeight+0.5;});
 let t=await ask('わんこ ぬいぐるみ');expect(t.includes(L[0].text)&&/まいにち かわる/.test(t)&&await fits(),'わんこの 台の せつめい '+t);await H.shot('ask-wanko');
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 t=await ask('みずべの なかま');expect(t.includes('リングフック・みずべの なかま')&&t.includes(L[11].text)&&await fits(),'みずべの せつめい '+t);await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 t=await ask('ビッグ ぬいぐるみ');expect(t.includes(L[10].names[0])&&await fits(),'ビッグの せつめい '+t);await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 t=await ask('どうぶつえん');expect(t.includes('トライポッド・どうぶつえん')&&t.includes(L[5].names[0])&&/とれるまで そのまま/.test(t)&&await fits(),'どうぶつえんの せつめい '+t);await H.shot('ask-zoo');
 // どうぶつえん 1かいめ: アームを 3ぼん おとす（まだ とれない）
 await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);
 const shapes=()=>H.eval(()=>G.scene.round.list().map(b=>b.data.shape));
 expect((await shapes()).join()===L[5].shapes.join(),'どうぶつえんの けいひんが きょうの ものと ちがう '+(await shapes()));
 const stop3=async()=>{for(let k=0;k<3;k++){await H.until(()=>PokaDebug.arcadeState().phase==='spin'||PokaDebug.arcadeState().phase==='settle'||PokaDebug.arcadeState().done,12000);if((await H.dbg('arcadeState')).phase!=='spin')break;await H.eval(()=>{const r=PokaDebug.arcadeState();PokaDebug.arcadeLight(r.arms.indexOf(1)*2);document.querySelector('.crane-go').click();});await H.wait(150);}};
 const done=async(ms=45000)=>{await H.dbg('arcadeFast',4);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},ms);return H.dbg('arcadeState');};
 await stop3();await H.shot('zoo');let r=await done();
 expect(r.got===0&&r.arms.filter(x=>!x).length===3,'どうぶつえんの 1かいめ '+JSON.stringify([r.got,r.arms]));
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 // つぎの 日: ほかの 台は あたらしい けいひん・どうぶつえんは きのうの けいひんと アームの まま
 await H.dbg('calendar','2026-10-06');
 const n0=await H.dbg('arcadeLineup',0),z1=await H.dbg('arcadeLineup',5);
 expect(n0.day==='2026-10-6'&&n0.names.join()!==L[0].names.join()&&z1.day==='2026-10-5'&&z1.names[0]===L[5].names[0],'つぎの 日の けいひん '+JSON.stringify([n0,z1]));
 t=await ask('どうぶつえん');expect(t.includes(L[5].names[0]),'つぎの 日の どうぶつえんの せつめい '+t);
 await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);
 expect((await H.dbg('arcadeState')).arms.filter(x=>!x).length===3&&(await shapes()).join()===L[5].shapes.join(),'つぎの 日に アームや けいひんが もどった');
 // 2かいめ: のこりの アームを おとして とる → 家具（けっかの ことば）
 const id=L[5].prizes[0],f0=(await H.dbg('saveData')).furn[id]||0;await stop3();r=await done();
 const sd=await H.dbg('saveData');expect(r.got===1&&(sd.furn[id]||0)===f0+1,'どうぶつえんの けいひんが とれない／家具に ならない '+JSON.stringify([r.got,r.arms,id]));
 const txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);expect(txt.includes(L[5].names[0]+' ×1'),'けっかの ことば '+txt);await H.shot('zoo-win');
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 // とれた あとは きょうの けいひん・アームは ぜんぶ もどる
 const z2=await H.dbg('arcadeLineup',5);expect(z2.day==='2026-10-6','とれた あとも きのうの けいひん '+JSON.stringify(z2));
 expect(await H.dbg('arcadeStart',5),'どうぶつえんを もういちど');await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);
 const a3=await H.dbg('arcadeState');expect(a3.arms.every(x=>x)&&a3.bodies===1&&(await shapes()).join()===z2.shapes.join(),'とれた あとの どうぶつえん '+JSON.stringify([a3.arms,a3.bodies]));await H.shot('zoo-next');
 await stop3();await done();await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();
 // おうち: もようがえで かざる（おうちの 立体）
 await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),15000);await H.wait(300);
 const k0=await H.eval(()=>Save.d.room.items.length);
 await H.houseButton('もようがえ');await H.page.locator('.edit-bar .tray .card').filter({hasText:L[5].names[0]}).click();await H.wait(300);
 await H.page.click('.edit-bar .btn.yellow');
 const room=await H.eval(()=>Save.d.room.items.map((it)=>it.id));expect(room.length===k0+1&&room.includes(id),'もようがえで どうぶつえんの けいひんが かざれない '+room);
 await H.wait(600);await H.shot('room');
 await H.dbg('calendar',null);
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-bgm-'+viewport.width,async H=>{
 // Meeときょれじゃ の 店内 BGM（UI-17。オーナーの FB 2026-09-30「BGMが ゲームセンターっぽくない。フリーの jpopを 5曲くらい 探して 店内BGMと せよ。それらを ランダムで 流せ」）:
 // 館に はいると J-POP 5きょくの どれか（「♪ 曲の なまえ（BGM：魔王魂）」）→ つぎの 曲（ちがう 曲）→ あそぶ 画面・けいひん カウンターでも おなじ 曲 → 町に でると 町の 曲 → また はいると J-POP → せっていの クレジット → 曲の まんなかも 合成できる
 await H.newGameFast();await H.dbg('coins',9850);await H.page.mouse.click(5,5);
 await H.eval(()=>{window.__toastLog=[];new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.classList&&n.classList.contains('toast'))window.__toastLog.push(n.textContent);}).observe(document.body,{childList:true,subtree:true});});
 await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready&&PokaDebug.arcadeMusic().playing,20000);
 const m1=await H.dbg('arcadeMusic');
 expect(m1.name==='arcade_hall'&&m1.list.length===5&&new Set(m1.titles).size===5&&m1.list.includes(m1.playing)&&m1.jpop&&m1.titles.includes(m1.title),'館の BGM が J-POP 5きょくの どれか で ない '+JSON.stringify(m1));
 await H.until(t=>window.__toastLog.some(x=>x.includes('♪ '+t)&&x.includes('BGM：魔王魂')),5000,m1.title);await H.shot('hall');
 // つぎの 曲: ちがう 曲・また しらせ
 await H.dbg('arcadeMusic','skip');await H.until(id=>{const m=PokaDebug.arcadeMusic();return m.playing&&m.playing!==id;},8000,m1.playing);
 const m2=await H.dbg('arcadeMusic');expect(m2.name==='arcade_hall'&&m2.list.includes(m2.playing)&&m2.playing!==m1.playing,'つぎの 曲 '+JSON.stringify([m1.playing,m2.playing]));
 await H.until(t=>window.__toastLog.some(x=>x.includes('♪ '+t)),5000,m2.title);
 // あそぶ 画面（クレーン）でも おなじ 曲が つづく → やめて 館に もどっても おなじ
 expect(await H.dbg('arcadeStart',1),'クレーンの 台');await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(400);
 let m=await H.dbg('arcadeMusic');expect(m.playing===m2.playing&&m.name==='arcade_hall','あそぶ 画面で 曲が かわった '+JSON.stringify(m));
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.ready;},20000);
 m=await H.dbg('arcadeMusic');expect(m.playing===m2.playing,'館に もどって 曲が かわった '+JSON.stringify(m));
 // けいひん カウンター（shop_ike_arcade）も おなじ 再生リスト: 曲は とぎれない
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 await H.page.locator('.mall-guide .mg-spot[data-label="けいひん カウンター"]').click();await H.until(()=>{const v=PokaDebug.venueState();return v&&v.party[0].y>=17.5&&PokaDebug.idle();},20000);
 await H.dbg('venueVisit','けいひん カウンター');await H.page.getByRole('button',{name:'まえの けいひんを みる',exact:true}).click();await H.page.locator('.modal-wrap .grid > *').first().waitFor();
 m=await H.dbg('arcadeMusic');expect(m.playing===m2.playing&&m.name==='arcade_hall','けいひん カウンターで 曲が かわった '+JSON.stringify(m));
 await H.page.keyboard.press('Escape');await H.until(()=>!document.querySelector('.modal-wrap'),5000);await H.idle();
 m=await H.dbg('arcadeMusic');expect(m.playing===m2.playing,'カウンターを とじて 曲が かわった '+JSON.stringify(m));
 // 町に でると 町の 曲・また はいると J-POP（まえの 曲と ちがう）
 await H.dbg('teleport','city',30,40);await H.idle();await H.until(()=>PokaDebug.state().scene==='world',10000);
 m=await H.dbg('arcadeMusic');expect(!m.playing&&m.name&&m.name!=='arcade_hall','町でも J-POP の まま '+JSON.stringify(m));
 await H.dbg('venue','arcade');await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready&&PokaDebug.arcadeMusic().playing,20000);
 const m3=await H.dbg('arcadeMusic');expect(m3.list.includes(m3.playing)&&m3.playing!==m2.playing,'また はいった ときの 曲 '+JSON.stringify([m2.playing,m3.playing]));
 // せっていの いちばん したに クレジット（はみ出さない）
 await H.page.getByRole('button',{name:'メニュー',exact:true}).click();await H.page.getByRole('button',{name:'せってい',exact:true}).click();
 await H.page.locator('.menu-credit').scrollIntoViewIfNeeded();await H.wait(200);
 const cr=await H.eval(()=>{const e=document.querySelector('.menu-credit'),r=e.getBoundingClientRect();return {t:e.textContent,l:r.left,r:r.right,w:document.documentElement.scrollWidth};});
 expect(/魔王魂/.test(cr.t)&&/maou\.audio/.test(cr.t)&&/fungamemake\.com/.test(cr.t)&&cr.l>=0&&cr.r<=viewport.width+0.5&&cr.w<=viewport.width,'せっていの クレジット '+JSON.stringify(cr));await H.shot('credit');
 await H.page.keyboard.press('Escape');await H.until(()=>!document.querySelector('.modal-wrap'),5000);
 // ほんとうの 音源で 曲の まんなか（トークン 1200 から）を 合成: 音が ある・クリップ しない・同時発音 60 みまん
 for(const id of [m1.playing,m2.playing]){const a=await H.dbg('musicRender',id,4,false,1200);expect(a.finite&&a.peak>.01&&a.peak<.95&&a.rms>.002&&a.peakVoices<60,id+': 曲の まんなか '+JSON.stringify(a));}
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-bridge-'+viewport.width,async H=>{
 // Meeときょれじゃ 2F の はしわたし（UI-15。オーナーの FB 2026-09-30「新しい 種類の クレーンゲームを 実装して ほしい」）:
 // 2台（ぎんの ぼう の フィギュア・ゴムの ぼう の ざっか）→ しらべる（あそびかた・きょうの けいひん）→ はこの はしを ねらって ずらす →
 // はずれ 4かいで おみせの ひとが はこを たてむきに なおして「ここ！」の しるし → しるしの ちかくで つかむ（ぴったり）→ とれる（家具）→ 台の まえに もどる
 await H.newGameFast();await H.dbg('coins',2000);await H.dbg('calendar','2026-10-05');await H.dbg('venue','arcade',2);await H.idle();await H.until(()=>PokaDebug.venueIso()&&PokaDebug.venueIso().ready,20000);
 const s2=await H.dbg('venueState'),br=s2.fixtures.filter(f=>f.action==='crane'&&(f.machine===17||f.machine===18));
 expect(br.length===2&&br.every(f=>s2.routeCount.find(r=>r.label===f.label)?.reachable),'2F の はしわたし 2台 '+JSON.stringify(br.map(f=>[f.machine,f.label])));
 const lineup=await H.dbg('arcadeLineup',17);expect(lineup.day==='2026-10-5'&&lineup.names.length===1,'きょうの はしわたし '+JSON.stringify(lineup));
 await H.dbg('venueVisit','フィギュア');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(/はしわたし・フィギュア/.test(ask)&&/2ほんの ぼう/.test(ask)&&ask.includes(lineup.names[0])&&/まいにち かわる/.test(ask),'はしわたしの せつめい '+ask);
 await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(500);
 let a=await H.dbg('arcadeState');expect(a.machine===17&&a.type==='bridge'&&a.bridge.box&&Math.abs(a.bridge.box.x-30)<0.5&&a.bridge.box.along<0.1&&!a.bridge.hint&&/はこの はしを ねらおう/.test(a.status)&&a.bridge.shape===lineup.shapes[0],'はしわたしの 台 '+JSON.stringify(a.bridge)+a.status);
 const panel=async()=>H.eval(()=>{const p=document.querySelector('.crane-panel').getBoundingClientRect(),st=document.querySelector('.crane-status'),rg=document.createRange();rg.selectNodeContents(st);const lines=new Set([...rg.getClientRects()].map(r=>Math.round(r.top))).size,bs=[...document.querySelectorAll('.crane-panel button')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect());return {p:[p.left,p.top,p.right,p.bottom],small:bs.filter(r=>r.width<44||r.height<44).length,wrap:st.scrollWidth>st.clientWidth+1||lines>1,lines};});
 let q=await panel();expect(q.p[0]>=0&&q.p[1]>=64&&q.p[2]<=viewport.width+0.5&&q.p[3]<=viewport.height+0.5&&q.small===0&&!q.wrap,'そうさばん '+JSON.stringify(q));await H.shot('start');
 const done=async(ms=45000)=>{await H.dbg('arcadeFast',4);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},ms);return H.dbg('arcadeState');};
 // 1かいめ: はこの ひだりの はしを ねらう → はこが アームの ほう（ひだり）へ ずれる
 expect(await H.dbg('arcadeMove',a.bridge.box.x-a.claw.x-8,a.bridge.box.z-a.claw.z),'アームが うごかない');await H.page.getByRole('button',{name:'つかむ',exact:true}).click();
 let r=await done();expect(r.got===0&&r.bridge.box&&r.bridge.box.x<27&&r.bridge.miss===1,'はこが ずれない '+JSON.stringify(r.bridge));await H.shot('shift');
 // はずれを 4かいに して「もういちど」→ おみせの ひとが たてむきに なおす・しるし
 await H.dbg('arcadeMiss',17,4);
 await H.page.getByRole('button',{name:'もういちど（100コイン）',exact:true}).click();await H.until(()=>{const s=PokaDebug.arcadeState();return s&&!s.finished&&s.bridge&&s.bridge.staff&&!PokaDebug.state().transitioning;},15000);await H.wait(600);
 a=await H.dbg('arcadeState');expect(a.bridge.staff==='assist'&&a.bridge.hint&&a.bridge.box.along>0.9&&/ひかる しるし/.test(a.status),'おみせの ひとの たすけ '+JSON.stringify(a.bridge)+a.status);
 const toast=await H.eval(()=>[...document.querySelectorAll('.toast')].map(t=>t.textContent).join());expect(/たてむき/.test(toast),'おみせの ひとの しらせ '+toast);
 q=await panel();expect(!q.wrap&&q.small===0,'たすけの ときの そうさばん '+JSON.stringify(q));await H.shot('assist');
 // しるしの ちかくで つかむ → しるしに ぴったり → とれる（家具・けっかの ことば）
 const id=lineup.prizes[0],f0=(await H.dbg('saveData')).furn[id]||0;expect(await H.dbg('arcadeHint',1.2,-1),'しるしへ うごかない');await H.page.getByRole('button',{name:'つかむ',exact:true}).click();
 r=await done();expect(r.got===1&&r.bridge.snapped,'しるしを ねらっても とれない '+JSON.stringify(r.bridge));
 const sd=await H.dbg('saveData');expect((sd.furn[id]||0)===f0+1&&(sd.arcade.miss[17]||0)===0,'はしわたしの けいひんが 家具に ならない／はずれが のこる '+id);
 const txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);expect(txt.includes(lineup.names[0]+' ×1'),'けっかの ことば '+txt);await H.shot('win');
 // もどる → はしわたしの まえ
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.ready;},20000);
 const v=await H.dbg('venueIso');expect(v.floor===2&&Math.abs(v.leader[0]-16)<=2&&v.leader[1]<=4,'はしわたしの まえに もどらない '+JSON.stringify(v));
 // ざっか（ゴムの ぼう）: きょうの けいひんの せつめい
 const l2=await H.dbg('arcadeLineup',18);expect(l2.names.length===1&&l2.prizes[0]!==id,'ざっかの けいひん '+JSON.stringify(l2));
 await H.dbg('venueVisit','ざっか');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask2=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(/はしわたし・ざっか/.test(ask2)&&ask2.includes(l2.names[0]),'ざっかの せつめい '+ask2);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 // おうち: もようがえで とった けいひんを かざる（おうちの 立体）
 await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),15000);await H.wait(300);
 const n0=await H.eval(()=>Save.d.room.items.length);
 await H.houseButton('もようがえ');await H.page.locator('.edit-bar .tray .card').filter({hasText:lineup.names[0]}).click();await H.wait(300);
 await H.page.click('.edit-bar .btn.yellow');
 const room=await H.eval(()=>Save.d.room.items.map((it)=>it.id));expect(room.length===n0+1&&room.includes(id),'もようがえで はしわたしの けいひんが かざれない '+room);
 await H.wait(600);await H.shot('room');
 await H.dbg('calendar',null);
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('purikura-'+viewport.width,async H=>{
 // ぷりくら（purikura.js・UI-11。オーナーの FB 2026-09-30「有料で プリクラを 撮る」「表情や ポーズを 変えて、文字を 書いたり スタンプで デコレーション」「写真として スマホから 見れる」）:
 // Meeときょれじゃ の ブース → 300コイン → はいけい → ポーズ・かお・アップ → 4まい → ペン・スタンプ・もじ・もどす → できあがり → すまほの「しゃしん」→ ほぞん・けす → さいかいしても のこる → やめても つぎは ただ
 await H.newGameFast();const c0=await H.dbg('coins',850);
 // ぷりくらは 3F（UI-21）の 3台。ここでは ゆめかわ（まえからの はいけい 6つ）
 await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 expect(await H.dbg('venueVisit','ゆめかわ ぷりくら'),'ぷりくらの ブースが ない');
 await H.page.getByRole('button',{name:'300コインで とる',exact:true}).click();
 await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(400);
 let st=await H.dbg('puriState');
 expect(st.phase==='bg'&&st.coins===c0-300&&st.active&&st.photos===0,'300コインで はじまらない '+JSON.stringify({c0,st}));
 // そうさばん: はみ出さない・ボタンは 44px いじょうで 1ぎょう・しゃしんの がめんに かさならない（チップの ならびは よこに スクロール）
 const fits=async(tag)=>{const L=await H.eval(()=>{const r=(e)=>e.getBoundingClientRect(),P=document.querySelector('.puri-panel'),pr=r(P),v=PokaDebug.puriState().view,bs=[...P.querySelectorAll('button')].filter((b)=>b.offsetParent);
   // もじの ぎょう（え の よこの もじも かぞえる ので、もじの ノード だけ）
   const lines=(b)=>{const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT),tops=new Set();for(let t=w.nextNode();t;t=w.nextNode()){if(!t.textContent.trim())continue;const g=document.createRange();g.selectNodeContents(t);for(const x of g.getClientRects())tops.add(Math.round(x.top));}return tops.size;};
   return {small:bs.filter((b)=>{const q=r(b);return q.height<43.5||q.width<43.5;}).map((b)=>b.textContent||b.getAttribute('aria-label')),out:bs.filter((b)=>!b.closest('.puri-chips')).filter((b)=>{const q=r(b);return q.left<pr.left-0.5||q.right>pr.right+0.5;}).map((b)=>b.textContent||b.getAttribute('aria-label')),
    wrap:[...bs.filter((b)=>b.textContent&&lines(b)>1),...[...P.querySelectorAll('.puri-title')].filter((t)=>lines(t)>t.textContent.split('\n').length)].map((b)=>b.textContent),over:P.scrollWidth>P.clientWidth+1,edge:pr.left>=0&&pr.right<=innerWidth&&pr.bottom<=innerHeight+0.5,view:v&&v.x>=0&&v.x+v.w<=innerWidth&&v.y>=40&&v.y+v.h<=pr.top+1,p:[pr.left,pr.top,pr.right,pr.bottom],v};});
  expect(!L.small.length&&!L.out.length&&!L.wrap.length&&!L.over&&L.edge&&L.view,tag+'の そうさばんが はみ出す／ちいさい／2ぎょう／しゃしんに かさなる '+JSON.stringify(L));};
 await fits('はいけい');await H.shot('bg');
 // はいけい → さつえい
 await H.page.getByRole('button',{name:'ほしぞら',exact:true}).click();
 await H.page.getByRole('button',{name:'とりはじめる',exact:true}).click();await H.wait(250);
 st=await H.dbg('puriState');expect(st.phase==='shoot'&&st.bg==='hoshi','はいけいが えらべない '+JSON.stringify(st));
 await fits('さつえい');
 // 1人ずつ ポーズと かお（ほかの 2人は そのまま）
 await H.page.getByRole('button',{name:'わんこ',exact:true}).click();await H.page.getByRole('button',{name:'ジャンプ',exact:true}).click();
 await H.page.getByRole('button',{name:'かお',exact:true}).click();await H.page.getByRole('button',{name:'びっくり',exact:true}).click();
 st=await H.dbg('puriState');
 expect(st.sel.wanko.join()==='jump,surprise'&&st.sel.gachan.join()==='stand,happy'&&st.sel.goji.join()==='stand,happy','1人だけ ポーズ・かおが かわらない '+JSON.stringify(st.sel));
 await H.wait(300);await H.shot('shoot');
 // 3・2・1（とちゅうは おせない）→ 1まいめ
 await H.dbg('puriFast',4);
 await H.page.getByRole('button',{name:'とる！',exact:true}).click();
 st=await H.dbg('puriState');expect(st.count===3&&await H.page.getByRole('button',{name:'とる！',exact:true}).isDisabled(),'カウントダウンに ならない '+JSON.stringify(st));
 await H.until(()=>PokaDebug.puriState().shots===1,8000);
 // 2まいめ: みんなで らぶらぶ・アップ
 await H.page.getByRole('button',{name:'みんな',exact:true}).click();await H.page.getByRole('button',{name:'らぶらぶ',exact:true}).click();await H.page.getByRole('button',{name:'アップに',exact:true}).click();
 st=await H.dbg('puriState');expect(st.z===1&&Object.values(st.sel).every((s)=>s[1]==='love')&&await H.page.getByRole('button',{name:'ぜんしんに',exact:true}).count()===1,'みんなの かお・アップが かわらない '+JSON.stringify(st));
 await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until(()=>PokaDebug.puriState().shots===2,8000);
 await H.page.getByRole('button',{name:'ポーズ',exact:true}).click();await H.page.getByRole('button',{name:'よこむき',exact:true}).click();
 for(let n=3;n<=4;n++){await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until((n)=>PokaDebug.puriState().shots>=n||PokaDebug.puriState().phase==='deco',8000,n);}
 st=await H.dbg('puriState');
 expect(st.phase==='deco'&&st.shots===4&&st.shotSel[0].c.wanko.join()==='jump,surprise'&&st.shotSel[0].z===0&&st.shotSel[1].z===1&&st.shotSel[1].c.goji[1]==='love'&&st.shotSel[2].c.gachan[0]==='side','4まい とれない／とった ときの ポーズが のこらない '+JSON.stringify(st.shotSel));
 await H.wait(600);await fits('らくがき');
 // ペンで なぞる → スタンプ → もじ → もどす（もじが きえる）
 const v=st.view,at=(fx,fy)=>[v.x+v.w*fx,v.y+v.h*fy];
 let [x,y]=at(0.2,0.25);await H.page.mouse.move(x,y);await H.page.mouse.down();
 for(let i=1;i<=12;i++){[x,y]=at(0.2+i*0.05,0.25+Math.sin(i/2)*0.05);await H.page.mouse.move(x,y);}
 await H.page.mouse.up();await H.wait(150);
 st=await H.dbg('puriState');expect(st.deco[0].p===1&&st.deco[0].pts>=8,'ペンで かけない '+JSON.stringify(st.deco[0]));
 await H.page.getByRole('button',{name:'スタンプ',exact:true}).click();await H.page.getByRole('button',{name:'ハート',exact:true}).click();await H.page.getByRole('button',{name:'おおきい',exact:true}).click();
 await H.page.mouse.click(...at(0.8,0.15));
 await H.page.getByRole('button',{name:'もじ',exact:true}).click();await H.page.getByRole('button',{name:'なかよし',exact:true}).click();
 await H.page.mouse.click(...at(0.5,0.35));await H.wait(150);
 st=await H.dbg('puriState');expect(st.deco[0].s===1&&st.deco[0].x===1,'スタンプ・もじが おけない '+JSON.stringify(st.deco[0]));
 await H.page.getByRole('button',{name:'もどす',exact:true}).click();st=await H.dbg('puriState');
 expect(st.deco[0].x===0&&st.deco[0].s===1&&st.deco[0].p===1,'もどすで もじが きえない '+JSON.stringify(st.deco[0]));
 await H.page.mouse.click(...at(0.5,0.35));await H.wait(300);await H.shot('deco');
 // 2まいめ: じぶんで かいた ことば（きごうは のぞく）とスタンプ。もどすは その しゃしんだけ
 await H.page.getByRole('button',{name:'2まいめ',exact:true}).click();
 await H.page.getByRole('button',{name:'じぶんで かく',exact:true}).click();await H.page.locator('#text-input').fill('なかま!<b>');await H.page.getByRole('button',{name:'けってい',exact:true}).click();await H.wait(150);
 await H.page.mouse.click(...at(0.5,0.2));
 await H.page.getByRole('button',{name:'スタンプ',exact:true}).click();await H.page.getByRole('button',{name:'おうかん',exact:true}).click();await H.page.mouse.click(...at(0.3,0.1));
 st=await H.dbg('puriState');expect(st.di===1&&st.deco[1].x===1&&st.deco[1].s===1&&st.deco[0].x===1,'2まいめに かけない '+JSON.stringify(st.deco));
 // できあがり → すまほに 4まい（コインは そのまま・はらったのは 1かい）
 await H.page.getByRole('button',{name:'できあがり',exact:true}).click();await H.wait(300);await H.dialogs();
 st=await H.dbg('puriState');
 expect(st.phase==='done'&&st.saved&&st.active===null&&st.photos===4&&st.coins===c0-300,'できあがりで しゃしんが はいらない '+JSON.stringify(st));
 let ph=await H.dbg('photos');
 expect(ph.length===4&&ph[0].bg==='hoshi'&&ph[0].p===1&&ph[0].s===1&&ph[0].x.join()==='なかよし'&&ph[1].z===1&&ph[1].x.join()==='なかま!b'&&ph[1].s===1&&ph[2].c.gachan[0]==='side'&&ph[3].p===0,'しゃしんの なかみ '+JSON.stringify(ph));
 await fits('できあがり');await H.shot('done');
 // すまほの「しゃしん」: あたらしい じゅんに 4まい（ちゃんと 描けて いる）
 await H.page.getByRole('button',{name:'すまほで みる',exact:true}).click();await H.page.locator('.smaho .puri-album .puri-photo').first().waitFor();await H.wait(500);
 const album=()=>H.eval(()=>{const body=document.querySelector('.smaho-body'),ps=[...body.querySelectorAll('.puri-photo')];
  const drawn=ps.map((b)=>{const cv=b.querySelector('canvas'),c=cv.getContext('2d'),d=c.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4*97)if(d[i]>0)n++;return cv.width>0&&n>20;});
  return {n:ps.length,drawn:drawn.every(Boolean),small:ps.filter((b)=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44;}).length,wide:body.scrollWidth>body.clientWidth+2,note:body.querySelector('.note')?.textContent||''};});
 let a=await album();expect(a.n===4&&a.drawn&&!a.small&&!a.wide&&/しゃしん 4まい/.test(a.note),'しゃしんの いちらん '+JSON.stringify(a));await H.shot('album');
 // 1まい: まえ／つぎ・ほぞん（この 端末に PNG）・けす
 await H.page.locator('.smaho .puri-photo').first().click();await H.page.locator('.smaho .puri-big').waitFor();
 const pos=()=>H.eval(()=>document.querySelector('.smaho .puri-pos').textContent);
 expect(await pos()==='1 / 4'&&await H.page.getByRole('button',{name:'‹ まえ',exact:true}).isDisabled(),'1まいの がめん '+await pos());
 // おおきい しゃしん: よこにも たてにも はいる（まえ／つぎ・いちらん／ほぞん／けす が スクロール しないで 見える）
 const big=await H.eval(()=>{const c=document.querySelector('.smaho .puri-big'),r=c.getBoundingClientRect(),b=document.querySelector('.smaho-body'),br=b.getBoundingClientRect(),bs=[...document.querySelectorAll('.smaho .puri-nav .btn')].map((x)=>x.getBoundingClientRect());return {w:r.width,h:r.height,in:r.left>=br.left-0.5&&r.right<=br.right+0.5,wide:b.scrollWidth>b.clientWidth+2,btns:bs.length,seen:bs.every((q)=>q.top>=br.top-0.5&&q.bottom<=br.bottom+0.5&&q.height>=44)};});
 expect(big.w>=150&&Math.abs(big.h/big.w-4/3)<0.02&&big.in&&!big.wide&&big.btns===5&&big.seen,'おおきい しゃしんが はみ出す／ボタンが かくれる '+JSON.stringify(big));await H.shot('photo');
 await H.page.getByRole('button',{name:'つぎ ›',exact:true}).click();expect(await pos()==='2 / 4','つぎ に いけない');
 await H.eval(()=>{window.__puriDl=[];const c=HTMLAnchorElement.prototype.click;window.__puriClick=c;HTMLAnchorElement.prototype.click=function(){if(this.download){window.__puriDl.push({name:this.download,png:this.href.startsWith('data:image/png;base64,'),len:this.href.length});return;}return c.call(this);};});
 await H.page.getByRole('button',{name:'ほぞん',exact:true}).click();await H.until(()=>window.__puriDl.length===1,8000);
 const dl=await H.eval(()=>{HTMLAnchorElement.prototype.click=window.__puriClick;return window.__puriDl[0];});
 expect(/^pokapoka-purikura-\d{4}-\d{1,2}-\d{1,2}\.png$/.test(dl.name)&&dl.png&&dl.len>5000,'がぞうに ほぞん できない '+JSON.stringify(dl));
 await H.page.getByRole('button',{name:'けす',exact:true}).click();await H.page.getByRole('button',{name:'けす',exact:true}).last().click();await H.wait(300);
 ph=await H.dbg('photos');expect(ph.length===3&&await pos()==='2 / 3','しゃしんが けせない '+JSON.stringify([ph.length,await pos()]));
 await H.page.getByRole('button',{name:'いちらん',exact:true}).click();a=await album();expect(a.n===3,'けした しゃしんが いちらんに のこる');
 // とじて おみせに もどる（ブースの まえ）→ もういちど しらべると 300コインの かくにん（やめると へらない）
 await H.page.keyboard.press('Escape');await H.wait(300);
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),15000);
 const back=await H.dbg('venueState');expect(back.floor===3&&Math.abs(back.party[0].x-3)<=1&&Math.abs(back.party[0].y-3)<=1,'ブースの まえに もどらない '+JSON.stringify([back.floor,back.party[0]]));
 // セーブ → さいかいしても しゃしんは のこる
 await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
 const ph2=await H.dbg('photos');expect(JSON.stringify(ph2)===JSON.stringify(ph),'さいかいで しゃしんが かわる '+JSON.stringify([ph.length,ph2.length]));
 await H.phone('しゃしん');await H.page.locator('.smaho .puri-album .puri-photo').first().waitFor();a=await album();
 expect(a.n===3&&a.drawn,'さいかいした あとの しゃしん '+JSON.stringify(a));await H.page.keyboard.press('Escape');await H.wait(300);
 // とちゅうで やめても おかねは もどらないが、つぎは ただで とりなおせる
 await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 const c1=(await H.dbg('state')).coins;
 await H.dbg('venueVisit','ゆめかわ ぷりくら');await H.page.getByRole('button',{name:'300コインで とる',exact:true}).click();await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(300);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.page.getByRole('button',{name:'やめる',exact:true}).last().click();
 await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),15000);
 expect((await H.dbg('state')).coins===c1-300&&(await H.dbg('saveData')).purikura.active,'やめた あとの ようす');
 await H.dbg('venueVisit','ゆめかわ ぷりくら');await H.page.getByRole('button',{name:'もういちど とる',exact:true}).click();await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);
 st=await H.dbg('puriState');expect(st.phase==='bg'&&st.coins===c1-300&&st.active,'とりなおしで また はらう '+JSON.stringify(st));
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('purikura-pose-'+viewport.width,async H=>{
 // ぷりくらの はっきりした ポーズ 5しゅ・3人の かお・ならびを うごかす（UI-24。オーナーの FB 2026-10-01「もっと 違いの わかる、はっきりした ポーズを 5種 追加せよ」
 // 「ごわがの 配置も 動かせる ように しろ」「わんこと がちゃで、顔の ボタンは あるが 変わらない ものが ある ので 直しなさい」）
 await H.newGameFast();await H.dbg('coins',900);
 await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 expect(await H.dbg('venueVisit','ゆめかわ ぷりくら'),'ぷりくらの ブースが ない');
 await H.page.getByRole('button',{name:'300コインで とる',exact:true}).click();
 await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(300);
 await H.page.getByRole('button',{name:'とりはじめる',exact:true}).click();await H.wait(300);
 let st=await H.dbg('puriState');expect(st.phase==='shoot'&&st.pos&&st.spots,'さつえいに ならない '+JSON.stringify(st));
 // ポーズの チップ: あたらしい 5しゅは「たつ」の つぎ（ぜんぶで 11・44px いじょう）
 const chips=await H.eval(()=>[...document.querySelectorAll('.puri-chips .puri-chip')].map((b)=>{const r=b.getBoundingClientRect();return{t:b.textContent,h:r.height,w:r.width};}));
 expect(chips.length===11&&chips.slice(0,6).map((c)=>c.t).join()==='たつ,ピース,しゃきーん,わーい,ハート,にゃん'&&chips.every((c)=>c.h>=43.5&&c.w>=43.5),'ポーズの チップ '+JSON.stringify(chips));
 // カメラの がめんの 3人の ところ（しゃしんの たて 55〜95%）の ピクセル（えらんだ 人の ▼ は それより うえ）
 const pix=()=>H.eval(()=>{const cv=document.querySelector('canvas'),v=PokaDebug.puriState().view,k=cv.width/innerWidth,d=cv.getContext('2d').getImageData(Math.round(v.x*k),Math.round((v.y+v.h*0.55)*k),Math.round(v.w*k),Math.round(v.h*0.4*k)).data;let h=0;for(let i=0;i<d.length;i+=4*5)h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)>>>0;return h;});
 // 5しゅの ポーズ（みんな）: 3人とも その ポーズ・絵が ぜんぶ ちがう
 const POSE={たつ:'stand',ピース:'peace',しゃきーん:'shakin',わーい:'wai',ハート:'heart',にゃん:'nyan'},hs={};
 for(const name of Object.keys(POSE)){await H.page.getByRole('button',{name,exact:true}).click();await H.wait(250);st=await H.dbg('puriState');expect(Object.values(st.sel).every((s)=>s[0]===POSE[name]),name+' が 3人に つかない '+JSON.stringify(st.sel));hs[name]=await pix();if(name==='ピース')await H.shot('peace');}
 expect(new Set(Object.values(hs)).size===6,'ポーズの 絵が おなじ '+JSON.stringify(hs));
 // かおの ボタン 8つ: わんこ・がちゃん・ごじ とも ぜんぶ ちがう かお（まえは わんこの にっこり・わくわく・らぶらぶ、がちゃんの わくわく・らぶらぶ・びっくり が おなじ だった）
 await H.page.getByRole('button',{name:'たつ',exact:true}).click();await H.page.getByRole('button',{name:'かお',exact:true}).click();
 for(const who of ['わんこ','がちゃん','ごじ']){await H.page.getByRole('button',{name:who,exact:true}).click();const fs=[];
  for(const f of ['にっこり','わくわく','らぶらぶ','びっくり','ぷんぷん','えーん','すやすや','ふつう']){await H.page.getByRole('button',{name:f,exact:true}).click();await H.wait(180);fs.push(await pix());}
  expect(new Set(fs).size===8,who+' の かおの ボタンで おなじ かおに なる '+JSON.stringify(fs));}
 // わんこ らぶらぶ・がちゃん びっくり（いまの えらび）で 1まいめ の まえに わんこを ゆびで うごかす（さわった 人が えらばれる）
 await H.page.getByRole('button',{name:'わんこ',exact:true}).click();await H.page.getByRole('button',{name:'らぶらぶ',exact:true}).click();
 await H.page.getByRole('button',{name:'がちゃん',exact:true}).click();await H.page.getByRole('button',{name:'びっくり',exact:true}).click();
 st=await H.dbg('puriState');const sp=st.spots.wanko;
 await H.page.mouse.move(sp.x,sp.y);await H.page.mouse.down();for(let i=1;i<=8;i++)await H.page.mouse.move(sp.x+i*8,sp.y-i*5);await H.page.mouse.up();await H.wait(200);
 st=await H.dbg('puriState');
 expect(st.who==='wanko'&&st.pos.wanko[0]>15&&st.pos.wanko[1]<-10&&st.pos.gachan.join()==='0,0'&&st.pos.goji.join()==='0,0','わんこが うごかない '+JSON.stringify({pos:st.pos,who:st.who}));
 expect(await H.page.locator('.puri-reset').isVisible(),'「もとの ならび」が でない');
 const rb=await H.page.locator('.puri-reset').boundingBox(),v=st.viewCss;
 expect(rb&&rb.height>=43.5&&rb.x>=v.x&&rb.x+rb.width<=v.x+v.w+0.5&&rb.y>=v.y&&rb.y+rb.height<=v.y+v.h,'「もとの ならび」が カメラの がめんの そと／ちいさい '+JSON.stringify({rb,v}));
 await H.wait(200);await H.shot('moved');
 await H.dbg('puriFast',8);
 await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until(()=>PokaDebug.puriState().shots===1,8000);
 // もとの ならび → 2〜4まいめ（ピース・わーい・ハート）
 await H.page.locator('.puri-reset').click();st=await H.dbg('puriState');
 expect(Object.values(st.pos).every((p)=>p.join()==='0,0')&&!(await H.page.locator('.puri-reset').isVisible()),'もとの ならびに もどらない '+JSON.stringify(st.pos));
 await H.page.getByRole('button',{name:'みんな',exact:true}).click();await H.page.getByRole('button',{name:'ポーズ',exact:true}).click();
 for(const [n,name] of [[2,'ピース'],[3,'わーい'],[4,'ハート']]){await H.page.getByRole('button',{name,exact:true}).click();await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until((n)=>PokaDebug.puriState().shots>=n||PokaDebug.puriState().phase==='deco',8000,n);}
 st=await H.dbg('puriState');expect(st.phase==='deco'&&st.shots===4,'4まい とれない '+JSON.stringify(st));
 await H.page.getByRole('button',{name:'できあがり',exact:true}).click();await H.wait(300);await H.dialogs();
 const ph=await H.dbg('photos');
 expect(ph.length===4&&ph[0].m&&ph[0].m.wanko[0]>15&&ph[0].c.wanko[1]==='love'&&ph[0].c.gachan[1]==='surprise'&&ph[1].m===null&&ph[1].c.goji[0]==='peace'&&ph[2].c.wanko[0]==='wai'&&ph[3].c.gachan[0]==='heart','しゃしんに ポーズ・かお・ばしょが のこらない '+JSON.stringify(ph.map((p)=>({c:p.c,m:p.m}))));
 await H.wait(500);await H.shot('done');
 },{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('purikura-deco-'+viewport.width,async H=>{
 // ぷりくらの らくがき（UI-25。オーナーの FB 2026-10-01「スタンプと文字は回転可能にせよ」「キラキラなどのエフェクトも用意せよ」「ほほの赤らめや、まつ毛パーマ、涙、くしゃみ、などのスタンプも追加せよ」）:
 // どうぐ 5つ → スタンプを おく → さわって えらぶ → ↻ で まわす・⇆ はんてん・うごかす・× けす・もどす → かおの スタンプ → もじを まわす → キラキラ → できあがり → しゃしんに のこる → さいかい
 await H.newGameFast();await H.dbg('coins',900);
 await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 expect(await H.dbg('venueVisit','がっこう ぷりくら'),'ぷりくらの ブースが ない');
 await H.page.getByRole('button',{name:'300コインで とる',exact:true}).click();
 await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(300);
 await H.page.getByRole('button',{name:'とりはじめる',exact:true}).click();await H.wait(300);await H.dbg('puriFast',8);
 for(let n=1;n<=4;n++){await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until((n)=>PokaDebug.puriState().shots>=n||PokaDebug.puriState().phase==='deco',8000,n);}
 await H.until(()=>PokaDebug.puriState().phase==='deco',8000);await H.wait(800);
 let st=await H.dbg('puriState');const V=st.viewCss,at=(fx,fy)=>[V.x+V.w*fx,V.y+V.h*fy],per=300/V.w;
 // そうさばん: はみ出さない・ボタンは 44px いじょうで 1ぎょう・しゃしんに かさならない（どうぐ 5つ ぜんぶ）
 const fits=async(tag)=>{const L=await H.eval(()=>{const r=(e)=>e.getBoundingClientRect(),P=document.querySelector('.puri-panel'),pr=r(P),v=PokaDebug.puriState().viewCss,bs=[...P.querySelectorAll('button')].filter((b)=>b.offsetParent);
   const lines=(b)=>{const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT),tops=new Set();for(let t=w.nextNode();t;t=w.nextNode()){if(!t.textContent.trim())continue;const g=document.createRange();g.selectNodeContents(t);for(const x of g.getClientRects())tops.add(Math.round(x.top));}return tops.size;};
   const hint=P.querySelector('.puri-hint');
   return {small:bs.filter((b)=>{const q=r(b);return q.height<43.5||q.width<43.5;}).map((b)=>b.textContent||b.getAttribute('aria-label')),out:bs.filter((b)=>!b.closest('.puri-chips')).filter((b)=>{const q=r(b);return q.left<pr.left-0.5||q.right>pr.right+0.5;}).map((b)=>b.textContent||b.getAttribute('aria-label')),
    wrap:[...bs.filter((b)=>b.textContent&&lines(b)>1).map((b)=>b.textContent),...(hint&&lines(hint)>1?[hint.textContent]:[])],over:P.scrollWidth>P.clientWidth+1,edge:pr.left>=0&&pr.right<=innerWidth&&pr.bottom<=innerHeight+0.5,view:v.x>=0&&v.x+v.w<=innerWidth&&v.y>=40&&v.y+v.h<=pr.top+1};});
  expect(!L.small.length&&!L.out.length&&!L.wrap.length&&!L.over&&L.edge&&L.view,tag+'の そうさばんが はみ出す／ちいさい／2ぎょう／しゃしんに かさなる '+JSON.stringify(L));};
 const tabs=await H.eval(()=>[...document.querySelectorAll('.puri-panel .puri-tabs .puri-chip')].map((b)=>b.textContent));
 expect(tabs.join()==='ペン,スタンプ,かお,もじ,キラキラ','らくがきの どうぐ '+JSON.stringify(tabs));await fits('ペン');
 // スタンプ（ハート・おおきい）を おく: おいただけ では えらばれない → さわって えらぶ（↻・×・⇆ の とって）
 await H.page.getByRole('button',{name:'スタンプ',exact:true}).click();await H.page.getByRole('button',{name:'ハート',exact:true}).click();await H.page.getByRole('button',{name:'おおきい',exact:true}).click();await fits('スタンプ');
 await H.page.mouse.click(...at(0.3,0.3));await H.wait(150);st=await H.dbg('puriState');
 const s0=st.items.s[0].slice();expect(st.items.s.length===1&&s0[0]==='heart'&&Math.abs(s0[1]-90)<=2&&Math.abs(s0[2]-120)<=2&&s0[3]===2&&s0.length===4&&st.pick===null,'スタンプを おけない／おいた だけで えらばれる '+JSON.stringify([st.items.s,st.pick]));
 let c=st.itemsCss.s[0];await H.page.mouse.click(c.x,c.y);await H.wait(150);st=await H.dbg('puriState');
 const hs=st.handles,inView=(p)=>p.x>=V.x&&p.x<=V.x+V.w&&p.y>=V.y&&p.y<=V.y+V.h;
 expect(st.pick&&st.pick.k==='s'&&st.pick.j===0&&hs&&['rot','del','flip'].every((k)=>hs[k]&&inView(hs[k]))&&Math.min(Math.hypot(hs.rot.x-hs.del.x,hs.rot.y-hs.del.y),Math.hypot(hs.del.x-hs.flip.x,hs.del.y-hs.flip.y))>=44,'さわっても えらべない／とって '+JSON.stringify([st.pick,hs]));
 expect((await H.page.locator('.puri-hint').textContent())==='↻ で まわす・⇆ はんてん・× けす','えらんだ ときの ひんと');
 await H.shot('picked');
 // ↻ を ゆびで ぐるっと: 90°（45°の ちかくは ぴったり）→ もどして 28°ぐらい
 const rotBy=async(deg)=>{const s=await H.dbg('puriState'),h=s.handles.rot,q=s.itemsCss[s.pick.k][s.pick.j],dx=h.x-q.x,dy=h.y-q.y;await H.page.mouse.move(h.x,h.y);await H.page.mouse.down();for(let i=1;i<=12;i++){const a=(deg*Math.PI/180)*i/12;await H.page.mouse.move(q.x+dx*Math.cos(a)-dy*Math.sin(a),q.y+dx*Math.sin(a)+dy*Math.cos(a));}await H.page.mouse.up();await H.wait(150);return (await H.dbg('puriState')).items;};
 let it=await rotBy(90);expect(it.s[0][4]===90,'90° まわらない '+JSON.stringify(it.s));
 it=await rotBy(-62);expect(Math.abs(it.s[0][4]-28)<=3,'28° に ならない '+JSON.stringify(it.s));
 // ⇆ はんてん → ゆびで うごかす（しゃしんの 座標で うごいた ぶん）→ もどす で もとの ばしょ
 st=await H.dbg('puriState');await H.page.mouse.click(st.handles.flip.x,st.handles.flip.y);await H.wait(150);st=await H.dbg('puriState');
 expect(st.items.s[0][5]===1&&st.pick&&st.pick.j===0,'はんてん できない '+JSON.stringify(st.items.s));
 c=st.itemsCss.s[0];await H.page.mouse.move(c.x,c.y);await H.page.mouse.down();for(let i=1;i<=8;i++)await H.page.mouse.move(c.x+i*5,c.y+i*7);await H.page.mouse.up();await H.wait(150);st=await H.dbg('puriState');
 expect(Math.abs(st.items.s[0][1]-s0[1]-40*per)<=2&&Math.abs(st.items.s[0][2]-s0[2]-56*per)<=2&&st.items.s[0][5]===1,'ゆびで うごかせない '+JSON.stringify(st.items.s));
 await H.page.getByRole('button',{name:'もどす',exact:true}).click();st=await H.dbg('puriState');
 expect(st.items.s[0][1]===s0[1]&&st.items.s[0][2]===s0[2]&&st.items.s[0][5]===1&&st.pick&&st.pick.j===0,'もどすで うごかす まえに もどらない '+JSON.stringify(st.items.s));
 await H.shot('rotated');
 // べつの スタンプ（ほし）を おいて × で けす → もどす で もどる
 await H.page.getByRole('button',{name:'ほし',exact:true}).click();st=await H.dbg('puriState');expect(st.pick===null,'スタンプを えらぶと えらんだ ものが はなれない');
 await H.page.mouse.click(...at(0.78,0.2));await H.wait(150);st=await H.dbg('puriState');expect(st.items.s.length===2&&st.items.s[1][0]==='star','ほしを おけない '+JSON.stringify(st.items.s));
 c=st.itemsCss.s[1];await H.page.mouse.click(c.x,c.y);await H.wait(150);st=await H.dbg('puriState');
 await H.page.mouse.click(st.handles.del.x,st.handles.del.y);await H.wait(150);st=await H.dbg('puriState');
 expect(st.items.s.length===1&&st.pick===null,'× で けせない '+JSON.stringify(st.items.s));
 await H.page.getByRole('button',{name:'もどす',exact:true}).click();st=await H.dbg('puriState');expect(st.items.s.length===2&&st.items.s[1][0]==='star','もどすで けした スタンプが もどらない');
 // えらんで いる ときに なにも ない ところ → はなす（おかない）
 c=st.itemsCss.s[1];await H.page.mouse.click(c.x,c.y);await H.page.mouse.click(...at(0.5,0.92));await H.wait(150);st=await H.dbg('puriState');
 expect(st.pick===null&&st.items.s.length===2,'なにも ない ところで はなれない／おいて しまう '+JSON.stringify([st.pick,st.items.s.length]));
 // かおの スタンプ 8しゅ（ほっぺ・まつげ・なみだ・くしゃみ ほか）
 await H.page.getByRole('button',{name:'かお',exact:true}).click();await fits('かお');
 const faces=await H.eval(()=>[...document.querySelectorAll('.puri-chips .puri-chip.stamp')].map((b)=>({n:b.getAttribute('aria-label'),ok:b.querySelector('img').complete&&b.querySelector('img').naturalWidth>0})));
 expect(faces.map((f)=>f.n).join()==='ほっぺ,まつげ,なみだ,くしゃみ,ねこひげ,あせ,ねこみみ,てんしの わ'&&faces.every((f)=>f.ok),'かおの スタンプ '+JSON.stringify(faces));
 await H.page.getByRole('button',{name:'ちいさい',exact:true}).click();
 await H.page.mouse.click(...at(0.19,0.66));await H.page.getByRole('button',{name:'まつげ',exact:true}).click();await H.page.mouse.click(...at(0.56,0.56));
 await H.page.getByRole('button',{name:'くしゃみ',exact:true}).click();await H.page.mouse.click(...at(0.88,0.62));await H.wait(150);st=await H.dbg('puriState');
 expect(st.items.s.slice(2).map((s)=>s[0]+':'+s[3]).join()==='hoppe:0,matsuge:0,kushami:0','かおの スタンプを おけない '+JSON.stringify(st.items.s));
 // まつげを ⇆ で はんたいの 目に
 c=st.itemsCss.s[3];await H.page.mouse.click(c.x,c.y);st=await H.dbg('puriState');await H.page.mouse.click(st.handles.flip.x,st.handles.flip.y);await H.wait(150);st=await H.dbg('puriState');
 expect(st.items.s[3][0]==='matsuge'&&st.items.s[3][5]===1,'まつげが はんてん できない '+JSON.stringify(st.items.s[3]));
 await H.shot('face');
 // もじ: おいて さわって まわす（もじに はんてんは ない）
 await H.page.getByRole('button',{name:'もじ',exact:true}).click();await fits('もじ');await H.page.getByRole('button',{name:'おなじ クラス',exact:true}).click();
 await H.page.mouse.click(...at(0.5,0.12));await H.wait(150);st=await H.dbg('puriState');c=st.itemsCss.x[0];await H.page.mouse.click(c.x,c.y);await H.wait(150);st=await H.dbg('puriState');
 expect(st.pick&&st.pick.k==='x'&&st.handles.rot&&st.handles.del&&!st.handles.flip,'もじを えらべない '+JSON.stringify([st.pick,st.handles]));
 it=await rotBy(-30);expect(it.x.length===1&&it.x[0][0]==='おなじ クラス'&&Math.abs(it.x[0][4]+30)<=3,'もじが まわらない '+JSON.stringify(it.x));
 await H.shot('text');
 // キラキラ: えらぶと しゃしんの 絵が かわる・いくつでも・もう いちど で けす・もどす
 await H.page.getByRole('button',{name:'キラキラ',exact:true}).click();await fits('キラキラ');st=await H.dbg('puriState');expect(st.pick===null,'キラキラで えらんだ ものが のこる');
 const fxs=await H.eval(()=>[...document.querySelectorAll('.puri-chips .puri-chip')].map((b)=>b.textContent));
 expect(fxs.join()==='きらきら,ハート,ほし,しゃぼんだま,さくら,ゆき,ふんわり,にじいろ','キラキラの しゅるい '+JSON.stringify(fxs));
 const pix=()=>H.eval(()=>{const cv=document.querySelector('canvas'),v=PokaDebug.puriState().view,k=cv.width/innerWidth,d=cv.getContext('2d').getImageData(Math.round(v.x*k),Math.round(v.y*k),Math.round(v.w*k),Math.round(v.h*k)).data;let h=0,n=0;for(let i=0;i<d.length;i+=4*7){h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)>>>0;n++;}return h;});
 const p0=await pix();
 await H.page.getByRole('button',{name:'にじいろ',exact:true}).click();await H.page.getByRole('button',{name:'きらきら',exact:true}).click();await H.wait(400);st=await H.dbg('puriState');
 expect(st.items.e.join()==='kira,niji'&&(await pix())!==p0,'キラキラが かからない '+JSON.stringify(st.items.e));
 await H.page.getByRole('button',{name:'にじいろ',exact:true}).click();st=await H.dbg('puriState');expect(st.items.e.join()==='kira','キラキラを けせない');
 await H.page.getByRole('button',{name:'もどす',exact:true}).click();st=await H.dbg('puriState');expect(st.items.e.join()==='kira,niji','もどすで キラキラが もどらない');
 await H.wait(300);await H.shot('fx');
 // できあがり → しゃしんに かたむき・はんてん・キラキラが のこる（ほかの 3まいは なし）
 await H.page.getByRole('button',{name:'できあがり',exact:true}).click();await H.wait(300);await H.dialogs();
 let ph=await H.dbg('photos');const p1=ph[0];
 expect(ph.length===4&&p1.k==='school'&&p1.st[0][0]==='heart'&&Math.abs(p1.st[0][4]-28)<=3&&p1.st[0][5]===1&&p1.st[3].join()==='matsuge,'+p1.st[3].slice(1,4).join()+',0,1'&&Math.abs(p1.xt[0][4]+30)<=3&&p1.e.join()==='kira,niji'&&ph[1].e.length===0&&ph[1].st.length===0,'しゃしんに らくがきが のこらない '+JSON.stringify(p1));
 await H.wait(500);await H.shot('done');
 // さいかいしても おなじ・すまほの「しゃしん」で 描ける
 await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
 expect(JSON.stringify(await H.dbg('photos'))===JSON.stringify(ph),'さいかいで しゃしんが かわる');
 await H.phone('しゃしん');await H.page.locator('.smaho .puri-album .puri-photo').first().waitFor();await H.wait(600);
 const drawn=await H.eval(()=>[...document.querySelectorAll('.smaho .puri-photo canvas')].every((cv)=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4*97)if(d[i]>0)n++;return cv.width>0&&n>20;}));
 expect(drawn,'すまほで しゃしんが 描けない');await H.page.locator('.smaho .puri-photo').last().click();await H.page.locator('.smaho .puri-big').waitFor();await H.wait(500);await H.shot('album');
},{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-3f-'+viewport.width,async H=>{
 // Meeときょれじゃ 3F（UI-21。オーナーの FB 2026-10-01「3Fを 追加して プリクラを 3台 おけ。残り 2台は コンセプトを 変えよ（使える 背景などを 新たに 加えよ。例えば 学校など）」）:
 // 2F の 南西の エスカレーター → 3F（ふきぬけ・ぷりくら 3台・おめかし コーナー）→ フロアマップの 1F／2F／3F → がっこう ぷりくら（がっこうの はいけい 6つ・ことば）で 4まい → しゃしんに ブース → おでかけ ぷりくらの はいけい
 await H.newGameFast();const c0=await H.dbg('coins',2000);
 await H.dbg('venue','arcade',2);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 let s=await H.dbg('venueState');expect(s.floor===2&&s.routeCount.find(r=>r.label==='3Fへ のぼる')?.reachable,'2F に 3F への エスカレーターが ない');
 expect(await H.dbg('venueVisit','3Fへ のぼる'),'3F への エスカレーターを しらべられない');
 await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.floor===3&&v.ready&&PokaDebug.idle()&&!PokaDebug.venueState().changingFloor;},25000);await H.wait(300);
 const iso=await H.dbg('venueIso');s=await H.dbg('venueState');const booths=s.fixtures.filter(f=>f.kind==='photobooth');
 expect(iso.holes===1&&s.floor===3&&booths.length===3&&booths.map(f=>f.booth).join()==='yume,school,odekake'&&s.fixtures.some(f=>f.kind==='vanity')&&s.fixtures.some(f=>f.kind==='escalator'&&f.to===2)&&/3F/.test(await H.eval(()=>document.querySelector('.hud').textContent)),'3F（ふきぬけ・ぷりくら 3台・おめかし・くだりの エスカレーター）'+JSON.stringify([iso.holes,booths.map(f=>f.booth)]));
 expect(s.routeCount.every(r=>r.reachable),'3F に いけない ところ '+JSON.stringify(s.routeCount.filter(r=>!r.reachable)));await H.shot('arrive');
 // フロアマップ: 1F・2F・3F の タブ・3F の コーナー
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const g=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),bs=[...document.querySelectorAll('.mall-guide .btn')];return {tabs:[...document.querySelectorAll('.mall-guide .mg-tabs .btn')].map(b=>b.textContent),spots:[...document.querySelectorAll('.mall-guide .mg-spot')].map(b=>b.dataset.label),small:bs.filter(b=>r(b).height<43.5).length,out:bs.filter(b=>r(b).left<-0.5||r(b).right>innerWidth+0.5).length};});
 expect(g.tabs.join()==='1F,2F,3F'&&['ゆめかわ ぷりくら','がっこう ぷりくら','おでかけ ぷりくら','おめかし コーナー','2Fへ おりる'].every(l=>g.spots.includes(l))&&g.small===0&&g.out===0,'3F の フロアマップ '+JSON.stringify(g));await H.shot('guide');
 await H.page.locator('.modal-wrap .close').last().click();await H.idle();
 // がっこう ぷりくら: かくにんに がっこうの はいけい → 300コイン → はいけいは がっこうの 6つ
 expect(await H.dbg('venueVisit','がっこう ぷりくら'),'がっこう ぷりくらが ない');await H.page.locator('.dlg-shade.ask .dialog').waitFor();
 const ask=await H.eval(()=>document.querySelector('.dlg-shade.ask .dlg-text').textContent);expect(/がっこう ぷりくら/.test(ask)&&/きょうしつ/.test(ask)&&/たいいくかん/.test(ask)&&/300コイン/.test(ask),'がっこう ぷりくらの せつめい '+ask);
 await H.page.getByRole('button',{name:'300コインで とる',exact:true}).click();await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(400);
 let st=await H.dbg('puriState');const bgNames=await H.eval(()=>[...document.querySelectorAll('.puri-bgs .puri-bg')].map(b=>b.getAttribute('aria-label')));
 expect(st.booth==='school'&&st.bg==='kyoshitsu'&&st.bgs.join()==='kyoshitsu,rouka,taiiku,kotei,okujo,toshokan'&&bgNames.join()==='きょうしつ,ろうか,たいいくかん,こうてい,おくじょう,としょしつ'&&st.coins===c0-300&&/がっこう ぷりくら/.test(await H.eval(()=>document.querySelector('.hud').textContent)),'がっこうの はいけい '+JSON.stringify([st.booth,st.bgs,bgNames]));
 await H.shot('bg');
 await H.page.getByRole('button',{name:'たいいくかん',exact:true}).click();await H.page.getByRole('button',{name:'とりはじめる',exact:true}).click();await H.wait(250);
 await H.dbg('puriFast',8);
 for(let n=1;n<=4;n++){await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until((n)=>PokaDebug.puriState().shots>=n||PokaDebug.puriState().phase==='deco',8000,n);}
 st=await H.dbg('puriState');expect(st.phase==='deco'&&st.shots===4&&st.bg==='taiiku','4まい とれない '+JSON.stringify(st));
 // もじは がっこうの ことばが さきに ならぶ
 await H.page.getByRole('button',{name:'もじ',exact:true}).click();
 const words=await H.eval(()=>[...document.querySelectorAll('.puri-chips .puri-chip')].map(b=>b.textContent).filter(Boolean));
 expect(words.slice(0,3).join()==='おなじ クラス,がっこう だいすき,なかよし はん'&&words.includes('なかよし'),'がっこうの ことば '+JSON.stringify(words));
 await H.page.getByRole('button',{name:'がっこう だいすき',exact:true}).click();const v=st.view;await H.page.mouse.click(v.x+v.w*0.5,v.y+v.h*0.2);await H.wait(250);await H.shot('deco');
 await H.page.getByRole('button',{name:'できあがり',exact:true}).click();await H.until(()=>PokaDebug.puriState()?.saved,8000);await H.dialogs();
 const ph=await H.dbg('photos');expect(ph.length===4&&ph.every(p=>p.k==='school'&&p.bg==='taiiku')&&ph[0].x[0]==='がっこう だいすき','しゃしんに ブースが のこらない '+JSON.stringify(ph.map(p=>[p.k,p.bg,p.x])));
 await H.wait(300);await H.shot('done');
 // おでかけ ぷりくら: はいけいは おでかけの 6つ（みるだけ → やめる）
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),15000);
 s=await H.dbg('venueState');expect(s.floor===3,'3F に もどらない');
 expect(await H.dbg('venueVisit','おでかけ ぷりくら'),'おでかけ ぷりくらが ない');await H.page.locator('.dlg-shade.ask .dialog').waitFor();
 const ask2=await H.eval(()=>document.querySelector('.dlg-shade.ask .dlg-text').textContent);expect(/おでかけ ぷりくら/.test(ask2)&&/ゆうえんち/.test(ask2)&&/うちゅう/.test(ask2),'おでかけ ぷりくらの せつめい '+ask2);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 expect((await H.dbg('state')).coins===c0-300,'やめても コインが へる');
},{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-fitting-'+viewport.width,async H=>{
 // Meeときょれじゃ 3F の こういしつ（UI-22。オーナーの FB 2026-10-01「3Fには、更衣室を 設置し、服を 着替えられる ように せよ」）:
 // こういしつで じぶんの Tシャツ → かしだしの ラックで セーラーふく・つうがく ぼうし（みんな おそろい）→ がっこう ぷりくらの しゃしんに のこる → たてものを でると もとの ふくに もどる
 await H.newGameFast();await H.dbg('coins',2000);
 await H.eval(()=>{window.__toastLog=[];new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.classList&&n.classList.contains('toast'))window.__toastLog.push(n.textContent);}).observe(document.body,{childList:true,subtree:true});});
 await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 let s=await H.dbg('venueState');
 expect(s.fixtures.filter(f=>f.action==='fitting').map(f=>f.kind).sort().join()==='costumerack,fitting'&&s.routeCount.every(r=>r.reachable),'3F の こういしつ・かしだしの ラック '+JSON.stringify(s.routeCount.filter(r=>!r.reachable)));
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const spots=await H.eval(()=>[...document.querySelectorAll('.mall-guide .mg-spot')].map(b=>b.dataset.label));
 expect(spots.includes('こういしつ')&&spots.includes('かしだし いしょう'),'フロアマップ '+JSON.stringify(spots));
 await H.page.locator('.modal-wrap .close').last().click();await H.idle();
 const lead=await H.eval(()=>Save.d.order[0]);
 const tab=async(name)=>{await H.page.locator('.modal-wrap:not(.out) .tabs .tab',{hasText:name}).first().click();await H.wait(150);};
 const cards=()=>H.eval(()=>[...document.querySelectorAll('.modal-wrap:not(.out) .grid .card')].map(c=>({t:c.textContent.trim(),lent:c.classList.contains('lent'),on:c.classList.contains('on')})));
 const pick=async(name)=>{await H.page.locator('.modal-wrap:not(.out) .grid .card',{hasText:name}).first().click();await H.wait(150);};
 const close=async()=>{await H.page.locator('.modal-wrap:not(.out) .close').click();await H.until(()=>!document.querySelector('.modal-wrap:not(.out)'),8000);await H.wait(300);};
 // 1かいめ: はじめての せつめい（かしだしの いしょうの なまえ）→ じぶんの Tシャツ（あか）
 expect(await H.dbg('venueVisit','こういしつ'),'こういしつを しらべられない');
 await H.page.locator('.dlg-next:not(.hidden)').first().waitFor({timeout:15000});
 const intro=await H.eval(()=>document.querySelector('.dlg-text').textContent);
 expect(/セーラーふく/.test(intro)&&/ランドセル/.test(intro)&&/ただ/.test(intro),'はじめての せつめい '+intro);
 await H.dialogs();
 await H.page.locator('.modal-wrap:not(.out) .panel.dress-extra .who-tabs').waitFor({timeout:15000});
 expect(await H.eval(()=>document.querySelector('.modal-wrap:not(.out) .panel-title').textContent)==='こういしつ','こういしつの がめんの なまえ');
 await tab('ふく');let cs=await cards();
 expect(cs.filter(c=>c.lent).map(c=>c.t.replace('かしだし','')).join()==='セーラーふく,ブレザー,たいそうふく,ゆかた'&&cs.some(c=>!c.lent&&/Tシャツ（あか）/.test(c.t)),'ふくの かしだし '+JSON.stringify(cs));
 await pick('Tシャツ（あか）');await close();
 let fit=await H.dbg('fitting');
 expect(fit.count===0&&fit.outfits[lead].body==='tshirt_red'&&Object.keys(fit.rental).length===0,'じぶんの ふくは かしだしに ならない '+JSON.stringify(fit));
 // 2かいめ（かしだしの ラック）: つうがく ぼうし・セーラーふく → みんな おそろい
 expect(await H.dbg('venueVisit','かしだし いしょう'),'かしだしの ラックを しらべられない');
 await H.page.locator('.modal-wrap:not(.out) .panel.dress-extra .who-tabs').waitFor({timeout:15000});
 await tab('あたま');cs=await cards();expect(cs.some(c=>c.lent&&/つうがく ぼうし/.test(c.t)),'あたまの かしだし '+JSON.stringify(cs));
 await pick('つうがく ぼうし');await tab('ふく');await pick('セーラーふく');
 await tab('せなか');cs=await cards();expect(cs.some(c=>c.lent&&/ランドセル/.test(c.t)),'せなかの かしだし '+JSON.stringify(cs));
 await H.page.getByRole('button',{name:'みんな おそろい',exact:true}).click();await H.wait(250);
 const lay=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),cs=[...document.querySelectorAll('.modal-wrap:not(.out) .grid .card'),...document.querySelectorAll('.modal-wrap:not(.out) .tabs .tab')],tag=document.querySelector('.modal-wrap:not(.out) .dress-tag'),note=document.querySelector('.modal-wrap:not(.out) .dress-note');return {out:cs.filter(c=>r(c).left<-0.5||r(c).right>innerWidth+0.5).length,tag:!!tag&&r(tag).width>10,note:!!note&&r(note).right<=innerWidth+0.5,parents:document.querySelectorAll('.modal-wrap:not(.out) .who-tab').length};});
 expect(lay.out===0&&lay.tag&&lay.note&&lay.parents===3,'こういしつの がめん '+JSON.stringify(lay));
 await H.shot('dress');
 await close();
 fit=await H.dbg('fitting');
 expect(fit.count===6&&Object.values(fit.outfits).every(o=>o.body==='mee_sailor'&&o.head==='mee_schoolhat')&&fit.rental[lead].body==='tshirt_red'&&fit.rental[lead].head===null,'かしだしを きた '+JSON.stringify(fit));
 await H.until(()=>window.__toastLog.some(x=>x.includes('かえしてね')),5000);
 await H.shot('wear');
 // がっこう ぷりくら: しゃしんに かしだしの いしょう
 expect(await H.dbg('puriStart','school'),'ぷりくらを はじめられない');
 await H.until(()=>!!PokaDebug.puriState()&&!Game.trans,20000);await H.wait(300);
 await H.page.getByRole('button',{name:'とりはじめる',exact:true}).click();await H.wait(250);await H.dbg('puriFast',8);
 for(let n=1;n<=4;n++){await H.page.getByRole('button',{name:'とる！',exact:true}).click();await H.until((n)=>PokaDebug.puriState().shots>=n||PokaDebug.puriState().phase==='deco',8000,n);}
 await H.page.getByRole('button',{name:'できあがり',exact:true}).click();await H.until(()=>PokaDebug.puriState()?.saved,8000);await H.dialogs();
 let ph=await H.dbg('photos');
 expect(ph.length===4&&ph.every(p=>p.k==='school'&&Object.values(p.o).every(o=>o.body==='mee_sailor'&&o.head==='mee_schoolhat')),'しゃしんに かしだしの いしょう '+JSON.stringify(ph.map(p=>p.o)));
 await H.wait(300);await H.shot('photo');
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='venue'&&PokaDebug.idle(),15000);
 expect((await H.dbg('fitting')).count===6,'ぷりくらの あとも きて いる');
 // たてものを でる → もとの ふくに もどる（しゃしんは そのまま）
 await H.page.getByRole('button',{name:'たてものを でる',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle(),15000);
 await H.until(()=>window.__toastLog.some(x=>x.includes('かえしたよ')),5000);
 fit=await H.dbg('fitting');
 expect(fit.count===0&&fit.outfits[lead].body==='tshirt_red'&&fit.outfits[lead].head===null&&Object.entries(fit.outfits).every(([id,o])=>id===lead||(!o.body&&!o.head))&&Object.keys(fit.rental).length===0,'でると もとの ふく '+JSON.stringify(fit));
 ph=await H.dbg('photos');expect(ph.length===4&&ph.every(p=>Object.values(p.o).every(o=>o.body==='mee_sailor')),'しゃしんは かしだしの まま');
 await H.wait(300);await H.shot('returned');
},{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('arcade-snack3f-'+viewport.width,async H=>{
 // Meeときょれじゃ 3F の おかし コーナー（UI-23。オーナーの FB 2026-10-01「3Fにも 新たに ゲーム機を 置いて ほしい。お菓子が 積んであり、棒で 押し出す タイプや、輪っかに 引っ掛けて 崩す タイプだ」）:
 // 3F に 2台・フロアマップ → おかし ロード（UI-29・トレジャーロード の しくみ。せつめい → 100コイン → ひかりが 7れつを うごく → とめた れつの ベルトだけ うごく → 3かい → おちた おかしは たべもの）→
 // おかし タワー（みどりの わっかを ねらって つかむ → はこが ぬけて くずれる → とれる → もういちど: おみせの 人が つみなおす）
 await H.newGameFast();await H.dbg('coins',2000);await H.dbg('calendar','2026-10-05');await H.dbg('venue','arcade',3);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 const s=await H.dbg('venueState'),m=s.fixtures.filter(f=>f.action==='crane');
 expect(s.floor===3&&m.map(f=>f.machine).sort().join()==='19,20'&&m.every(f=>s.routeCount.find(r=>r.label===f.label)?.reachable),'3F の おかし コーナー '+JSON.stringify(m.map(f=>[f.machine,f.label])));
 await H.page.getByRole('button',{name:'フロア案内',exact:true}).click();await H.page.locator('.mall-guide svg').waitFor();
 const g=await H.eval(()=>[...document.querySelectorAll('.mall-guide .mg-spot')].map(b=>b.dataset.label));expect(g.includes('おかし コーナー')&&g.includes('おめかし コーナー'),'フロアマップの おかし コーナー '+JSON.stringify(g));
 await H.shot('guide');await H.page.locator('.modal-wrap .close').last().click();await H.idle();
 // おかし コーナーの まえ（館の 台の 絵）
 expect(await H.dbg('venueWalk',18,10),'おかし コーナーへ あるけない');await H.until(()=>{const v=PokaDebug.venueState();return v&&Math.hypot(v.party[0].x-18,v.party[0].y-10)<0.6&&PokaDebug.idle();},25000);await H.wait(600);await H.shot('hall');
 // ---- おかし ロード（UI-29。トレジャーロード の しくみ）: せつめい（きょうの おかし 3しゅ）→ 100コイン ----
 const lineup=await H.dbg('arcadeLineup',19);expect(lineup.names.length===3&&lineup.prizes.every(id=>/^ike_snack_/.test(id)),'きょうの おかし '+JSON.stringify(lineup));
 await H.dbg('venueVisit','おかし ロード');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(/おかし ロード/.test(ask)&&/7れつの ベルト/.test(ask)&&/ランプが おおい れつほど ながく/.test(ask)&&lineup.names.every(n=>ask.includes(n)),'おかし ロードの せつめい '+ask);await H.shot('road-ask');
 const c0=(await H.dbg('state')).coins;await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(500);
 let a=await H.dbg('arcadeState');expect(a.machine===19&&a.type==='road'&&a.phase==='sweep'&&a.road.stops===3&&a.road.lit.length===7&&a.road.lit.every(n=>n>=3&&n<=15)&&a.road.lit.includes(15)&&a.road.moved.every(v=>v===0)&&a.bodies===12&&a.coins===c0-100&&/のこり 3かい/.test(a.status),'おかし ロード '+JSON.stringify([a.road,a.status,a.coins,c0]));
 // そうさばん:「とめる」と「やめる」だけ（◀ ▶・カメラは ない）。44px いじょう・はみ出さない・せつめいは 1ぎょう
 const panel=async()=>H.eval(()=>{const p=document.querySelector('.crane-panel').getBoundingClientRect(),st=document.querySelector('.crane-status'),rg=document.createRange();rg.selectNodeContents(st);const lines=new Set([...rg.getClientRects()].map(r=>Math.round(r.top))).size,bs=[...document.querySelectorAll('.crane-panel button')].filter(b=>b.offsetParent);
   return {p:[p.left,p.top,p.right,p.bottom],names:bs.map(b=>b.getAttribute('aria-label')||b.textContent),small:bs.filter(b=>{const r=b.getBoundingClientRect();return r.width<43.5||r.height<43.5;}).length,lines};});
 let q=await panel();expect(q.p[0]>=0&&q.p[2]<=viewport.width+0.5&&q.p[3]<=viewport.height+0.5&&q.small===0&&q.lines===1&&q.names.includes('とめる')&&q.names.includes('やめる')&&!['うえ','ひだり','みぎ','した','カメラ'].some(n=>q.names.includes(n)),'おかし ロードの そうさばん '+JSON.stringify(q));
 // ひかりは 7れつを いったり きたり する（しばらく まつと ちがう れつ）
 await H.until(at0=>{const r=PokaDebug.arcadeState();return r&&r.road.at!==at0;},5000,a.road.at);await H.shot('road');
 // れつ 2（ランプ 15）で「とめる」→ その れつの ベルトだけ 15 × 0.6 = 9cm まえへ → のこり 2
 expect(await H.dbg('arcadeRoadAt',2,15),'ひかりを あわせられない');await H.page.getByRole('button',{name:'とめる',exact:true}).click();await H.wait(150);
 a=await H.dbg('arcadeState');expect(a.phase==='run'&&a.road.lane===2&&a.road.lastLit===15&&a.road.stops===2&&a.road.left>0&&/15こ ぶん ベルトが うごくよ/.test(a.status),'とめても ベルトが うごかない '+JSON.stringify([a.phase,a.road,a.status]));await H.shot('road-run');
 await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.phase==='sweep';},30000);a=await H.dbg('arcadeState');
 expect(Math.abs(a.road.moved[2]-9)<0.05&&a.road.moved.every((v,k)=>k===2||v===0)&&a.road.stops===2&&/のこり 2かい/.test(a.status),'れつ 2 の ベルトだけ うごく '+JSON.stringify([a.road,a.status]));
 // れつ 3・れつ 4（ランプ 15）: れつ 2 と 3 の さかいめの はこ（2だん）が まえへ でて おちる → おわり
 for(const k of [3,4]){await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.phase==='sweep';},30000);expect(await H.dbg('arcadeRoadAt',k,15),'ひかりを あわせられない '+k);await H.page.getByRole('button',{name:'とめる',exact:true}).click();await H.wait(200);}
 await H.dbg('arcadeFast',3);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},40000);a=await H.dbg('arcadeState');
 const sd=await H.dbg('saveData'),txt=await H.eval(()=>document.querySelector('.crane-result-text').textContent);
 expect(a.got>=1&&[2,3,4].every(k=>Math.abs(a.road.moved[k]-9)<0.05)&&lineup.prizes.some(id=>(sd.bag[id]||0)>=1)&&/を もらったよ/.test(txt),'おちた おかしが もちものに ない '+JSON.stringify([a.got,a.road,txt]));
 expect(sd.arcade.boards[19]&&sd.arcade.boards[19].b.length===12-a.got,'台の ようすが のこらない');await H.shot('road-done');
 // ---- おかし タワー: もういちどは しない で もどる → タワーの 台 ----
 await H.page.getByRole('button',{name:'おみせに もどる',exact:true}).click();await H.idle();await H.until(()=>{const v=PokaDebug.venueIso();return v&&v.ready;},20000);
 await H.dbg('venueVisit','おかし タワー');await H.page.locator('.dlg-shade.ask .dialog').waitFor();await H.wait(200);
 const ask2=await H.eval(()=>document.querySelector('.dlg-shade.ask .dialog').textContent);expect(/おかし タワー/.test(ask2)&&/みどりの わっか/.test(ask2)&&/くずれて/.test(ask2),'おかし タワーの せつめい '+ask2);
 await H.page.getByRole('button',{name:'100コインで あそぶ',exact:true}).click();await H.until(()=>PokaDebug.arcadeState()&&!PokaDebug.state().transitioning,15000);await H.wait(500);
 a=await H.dbg('arcadeState');expect(a.machine===20&&a.type==='ring'&&a.tower&&a.tower.ok&&a.bodies===5&&a.tower.ring&&a.phase==='move','おかし タワー '+JSON.stringify(a.tower));
 q=await panel();expect(q.small===0&&q.names.includes('カメラ')&&q.names.includes('つかむ'),'タワーの そうさばん '+JSON.stringify(q));await H.shot('tower');
 // みどりの わっかの まうえ → よこから みる → つかむ → もちあげると はこが ぬけて くずれる → とれる
 expect(await H.dbg('arcadeAimRing',0,0),'わっかを ねらえない');await H.dbg('arcadeCam','side');await H.wait(250);await H.shot('tower-side');await H.dbg('arcadeCam','front');
 await H.page.getByRole('button',{name:'つかむ',exact:true}).click();
 await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.phase==='carry';},30000);await H.shot('tower-lift');
 await H.dbg('arcadeFast',3);await H.until(()=>{const r=PokaDebug.arcadeState();return r&&r.finished;},40000);a=await H.dbg('arcadeState');
 const sd2=await H.dbg('saveData');expect(a.got>=1&&!a.tower.ok&&lineup.prizes.concat((await H.dbg('arcadeLineup',20)).prizes).some(id=>(sd2.bag[id]||0)>((sd.bag||{})[id]||0)),'タワーで とれない '+JSON.stringify([a.got,a.tower]));await H.shot('tower-done');
 // もういちど: おみせの 人が タワーを つみなおす（しらせ）
 await H.page.getByRole('button',{name:'もういちど（100コイン）',exact:true}).click();await H.until(()=>{const r=PokaDebug.arcadeState();return r&&!r.finished&&r.phase==='move'&&!PokaDebug.state().transitioning;},15000);await H.wait(600);
 a=await H.dbg('arcadeState');const toast=await H.eval(()=>[...document.querySelectorAll('.toast')].map(t=>t.textContent).join());
 expect(a.tower.ok&&a.tower.staff==='tower'&&a.bodies===5&&/つみなおして/.test(toast),'タワーを つみなおさない '+JSON.stringify([a.tower,toast]));
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();
 await H.dbg('calendar',null);
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('gacha-'+viewport.width,async H=>{
 // ガチャガチャ（gacha.js・UI-12。オーナーの FB 2026-09-30「ガチャガチャも 実際の 機能として」「景品は ミニマスコットみたいに 部屋に 置けたり、服だったり」「シリーズで 4種類・一つは レアで 確率を 下げて」）:
 // 館の 台 → ラインナップ → 200コインで まわす → カプセル → あける（レア）→ ふくの 台で ダブりは 2こめ（服は 1こで ひとり・UI-31）・5こ もって いれば 50コイン もどる・4しゅで コンプリート → さいかい → きがえで きる・もようがえで かざる → コインが たりないと まわせない
 await H.newGameFast();const c0=await H.dbg('coins',1850);
 // ガチャは 2F の まんなかの ガチャ コーナー（UI-20。1F では エスカレーターの うえの ゆかに かくれて いた）
 await H.dbg('venue','arcade',2);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 const s0=await H.dbg('venueState');expect(s0.floor===2&&s0.fixtures.filter((f)=>f.kind==='gacha'&&f.action==='gacha').length===12,'2F に ガチャの 台が 12だい ない');
 // ガチャ コーナーの まえ（2F の まんなかの とおりみち）まで あるく
 expect(await H.dbg('venueWalk',12,9),'ガチャ コーナーへ あるけない');await H.until(()=>{const v=PokaDebug.venueState();return v&&Math.hypot(v.party[0].x-12,v.party[0].y-9)<0.6&&PokaDebug.idle();},25000);await H.wait(500);await H.shot('corner');
 // いちばん ひだりの 台（なかよし フィギュア）まで あるいて しらべる
 expect(await H.dbg('venueVisit','カプセルトイ'),'カプセルトイ が ない');
 await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({timeout:20000});await H.wait(400);
 // がめん: はみ出さない・ボタンは 44px いじょう・まわす ボタンは スクロール しないで 見える・4しゅで レアは 1つ・みだしは 1ぎょう
 const lay=async(tag)=>{const L=await H.eval(()=>{const r=(e)=>e.getBoundingClientRect(),pn=document.querySelector('.modal-wrap:not(.out) .panel'),body=pn.querySelector('.panel-body'),br=r(body),bs=[...pn.querySelectorAll('button')].filter((b)=>b.offsetParent),go=pn.querySelector('.gacha-go'),t=pn.querySelector('.panel-title'),g=document.createRange();g.selectNodeContents(t);
   return {small:bs.filter((b)=>{const q=r(b);return q.width<43.5||q.height<43.5;}).map((b)=>b.textContent||b.getAttribute('aria-label')),wide:body.scrollWidth>body.clientWidth+1,edge:r(pn).left>=0&&r(pn).right<=innerWidth+0.5&&r(pn).bottom<=innerHeight+0.5,go:!go||(r(go).top>=br.top-0.5&&r(go).bottom<=br.bottom+0.5),cards:pn.querySelectorAll('.gacha-card').length,rare:pn.querySelectorAll('.gacha-card.rare').length,title:t.textContent,lines:new Set([...g.getClientRects()].map((x)=>Math.round(x.top))).size};});
  expect(!L.small.length&&!L.wide&&L.edge&&L.go&&L.cards===4&&L.rare===1&&L.lines===1,tag+'の ガチャの がめんが はみ出す／ボタンが ちいさい／かくれる '+JSON.stringify(L));return L;};
 let L=await lay('はじめ');expect(L.title==='「なかよし フィギュア」','なかよし フィギュア の 台で ない '+L.title);
 const text=await H.eval(()=>document.querySelector('.modal-wrap:not(.out) .gacha').textContent);
 expect(/1かい 200コイン/.test(text)&&/30%/.test(text)&&/10%/.test(text)&&/ばんざい わんこ/.test(text)&&/3にん なかよし/.test(text)&&/レア・まだ/.test(text),'ラインナップ・ねだん・かくりつが ない '+text);
 await H.shot('lineup');
 // まわす（レア）: 200コイン → つまみ → カプセル → タップで あける
 await H.dbg('gachaFast',4);await H.dbg('gachaNext',3);
 await H.page.getByRole('button',{name:'200コインで まわす',exact:true}).click();
 let g=await H.dbg('gachaState');expect(g.coins===c0-200&&g.plays===1&&['turn','capsule'].includes(g.phase)&&await H.page.locator('.gacha-go').isDisabled(),'まわす ときに 200コイン へらない／もう1かい おせる '+JSON.stringify(g));
 await H.until(()=>PokaDebug.gachaState().phase==='capsule',8000);
 const cap=await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).boundingBox();expect(cap&&cap.width>=44&&cap.height>=44,'カプセルが ちいさい '+JSON.stringify(cap));
 await H.shot('capsule');
 await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).click();await H.until(()=>PokaDebug.gachaState().phase==='done',8000);await H.wait(300);
 g=await H.dbg('gachaState');const prize=await H.eval(()=>document.querySelector('.gacha-prize').textContent);
 expect(g.last.id==='gacha_friends_3'&&g.last.rare&&g.last.first&&/レア！/.test(prize)&&/NEW/.test(prize)&&/3にん なかよし/.test(prize)&&(await H.dbg('saveData')).furn.gacha_friends_3===1,'レアが でない／もちものに ない '+JSON.stringify([g,prize]));
 expect(/レア・もってる ×1/.test(await H.eval(()=>document.querySelector('.gacha-card.rare').textContent)),'ラインナップに もってる が でない');
 await lay('けっか');await H.shot('rare');
 // ✕ で とじる → 館に もどる
 await H.page.locator('.modal-wrap:not(.out) .close').click();await H.until(()=>!PokaDebug.gachaState().open&&PokaDebug.idle(),8000);
 // ふくの 台（どうぶつ みみ）: はじめては ふくに・ダブりは 2こめ（1こで ひとり）・5こ もって いれば 50コイン もどる・4しゅで コンプリート
 await H.dbg('gachaOpen',4);await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor();await H.wait(300);
 const turn=async(k)=>{await H.dbg('gachaNext',k);await H.page.locator('.gacha-go').click();await H.until(()=>PokaDebug.gachaState().phase==='capsule',8000);await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).click();await H.until(()=>PokaDebug.gachaState().phase==='done',8000);return H.dbg('gachaState');};
 g=await turn(1);expect(g.last.id==='gacha_ears_1'&&!g.last.refund&&(await H.dbg('saveData')).wardrobe.gacha_ears_1===true,'ふくが もちものに ない '+JSON.stringify(g));
 const c1=g.coins;g=await turn(1);
 expect(!g.last.refund&&g.coins===c1-200&&(await H.dbg('saveData')).wardrobe.gacha_ears_1===2&&/2こめ！ 2にんで つかえるよ/.test(await H.eval(()=>document.querySelector('.gacha-prize').textContent)),'ダブった ふくが 2こめに ならない '+JSON.stringify(g));
 await H.dbg('wearSet','gacha_ears_1',5);const c2=g.coins;g=await turn(1);
 expect(g.last.refund===50&&g.coins===c2-150&&(await H.dbg('wearStock','gacha_ears_1')).count===5&&/5こ もって いる ので 50コイン もどったよ/.test(await H.eval(()=>document.querySelector('.gacha-prize').textContent)),'5こ もって いる ふくで 50コイン もどらない '+JSON.stringify(g));
 await turn(0);await turn(2);g=await turn(3);
 expect(g.last.complete&&g.done.ears&&/コンプリート/.test(await H.eval(()=>document.querySelector('.gacha').textContent)),'4しゅ そろっても コンプリートに ならない '+JSON.stringify(g));
 await lay('コンプリート');await H.shot('complete');
 await H.page.locator('.modal-wrap:not(.out) .close').click();await H.until(()=>!PokaDebug.gachaState().open&&PokaDebug.idle(),8000);
 // さいかい しても のこる
 const before=await H.dbg('gachaState');await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
 const after=await H.dbg('gachaState');expect(JSON.stringify(after.got)===JSON.stringify(before.got)&&after.plays===before.plays&&after.done.ears===before.done.ears&&after.coins===before.coins,'さいかいで ガチャの きろくが かわる '+JSON.stringify([before,after]));
 // おうち: きがえで ユニコーン カチューシャ・もようがえで 3にん なかよし を かざる
 await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),15000);await H.wait(300);
 await H.houseButton('きがえ');await H.page.locator('.panel .grid .card').filter({hasText:'ユニコーン カチューシャ'}).click();await H.wait(200);
 const head=await H.eval(()=>Save.d.chars[Save.d.order[0]].outfit.head);expect(head==='gacha_ears_3','きがえで ガチャの ふくが きられない '+head);
 await H.shot('dressup');await H.page.click('.modal-wrap .close');await H.until(()=>!G.scene.mode,8000);
 const n0=await H.eval(()=>Save.d.room.items.length);
 await H.houseButton('もようがえ');await H.page.locator('.edit-bar .tray .card').filter({hasText:'3にん なかよし'}).click();await H.wait(300);
 await H.page.click('.edit-bar .btn.yellow');
 const room=await H.eval(()=>Save.d.room.items.map((it)=>it.id));expect(room.length===n0+1&&room.includes('gacha_friends_3'),'もようがえで フィギュアが かざれない '+room);
 await H.wait(600);await H.shot('room');
 // コインが たりないと まわせない
 await H.dbg('venue','arcade');await H.idle();await H.dbg('gachaOpen',1);await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor();
 while((await H.dbg('state')).coins>=200){await H.dbg('gachaNext',0);await H.page.locator('.gacha-go').click();await H.until(()=>PokaDebug.gachaState().phase==='capsule',8000);await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).click();await H.until(()=>PokaDebug.gachaState().phase==='done',8000);}
 expect(await H.page.locator('.gacha-go').isDisabled()&&/コインが たりないよ/.test(await H.eval(()=>document.querySelector('.gacha').textContent)),'コインが たりなくても まわせる');
},{viewport,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('gacha-more-'+viewport.width,async H=>{
 // ガチャを 2ばいに（UI-28。オーナーの FB 2026-10-01「meeときょれじゃのガチャガチャを2倍の規模にしなさい。ガチャガチャの景品にはアクセサリーを追加しなさい」）:
 // 2F の ガチャ コーナーは 2れつ 12だい → てまえの とおりみちから 12だい ぜんぶ みえる → アクセサリーの 台（ゆめかわ ヘアアクセ）で レアの ちょうちょ → きょうりゅうの 台 → きがえで つける・もようがえで かざる
 await H.newGameFast();const c0=await H.dbg('coins',1850);
 await H.dbg('venue','arcade',2);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 let s=await H.dbg('venueState');const g=s.fixtures.filter(f=>f.kind==='gacha'&&f.action==='gacha');
 expect(g.length===12&&new Set(g.map(f=>f.series)).size===12&&g.filter(f=>f.y===9).length===6&&g.filter(f=>f.y===6).length===6&&s.routeCount.every(r=>r.reachable),'2れつ 12だい '+JSON.stringify(g.map(f=>[f.x,f.y,f.series])));
 expect(await H.dbg('venueWalk',13,11),'ガチャ コーナーの まえへ あるけない');await H.until(()=>{const v=PokaDebug.venueState();return v&&Math.hypot(v.party[0].x-13,v.party[0].y-11)<0.6&&PokaDebug.idle();},25000);await H.wait(600);
 s=await H.dbg('venueState');const vis=s.fixtures.filter(f=>f.kind==='gacha'&&f.screen.x>8&&f.screen.x<viewport.width-8&&f.screen.y>40&&f.screen.y<viewport.height-120);
 expect(vis.length===12,'ガチャの 台が 画面に ぜんぶ みえない '+vis.length+' '+JSON.stringify(s.fixtures.filter(f=>f.kind==='gacha').map(f=>[f.series,Math.round(f.screen.x),Math.round(f.screen.y)])));await H.shot('corner');
 // アクセサリーの 台（てまえの れつ・ゆめかわ ヘアアクセ）
 expect(await H.dbg('venueVisit','アクセサリー'),'アクセサリー の 台が ない');
 await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor({timeout:20000});await H.wait(400);
 const L=await H.eval(()=>{const r=(e)=>e.getBoundingClientRect(),pn=document.querySelector('.modal-wrap:not(.out) .panel'),body=pn.querySelector('.panel-body'),t=pn.querySelector('.panel-title'),g=document.createRange();g.selectNodeContents(t);const bs=[...pn.querySelectorAll('button')].filter((b)=>b.offsetParent);
  return {small:bs.filter((b)=>{const q=r(b);return q.width<43.5||q.height<43.5;}).length,wide:body.scrollWidth>body.clientWidth+1,edge:r(pn).left>=0&&r(pn).right<=innerWidth+0.5,cards:pn.querySelectorAll('.gacha-card').length,rare:pn.querySelectorAll('.gacha-card.rare').length,title:t.textContent,lines:new Set([...g.getClientRects()].map((x)=>Math.round(x.top))).size,text:pn.textContent};});
 expect(!L.small&&!L.wide&&L.edge&&L.cards===4&&L.rare===1&&L.lines===1&&L.title==='「ゆめかわ ヘアアクセ」'&&/でるのは アクセサリー/.test(L.text)&&/リボンの バレッタ/.test(L.text)&&/ちょうちょの ヘアクリップ/.test(L.text),'アクセサリーの 台の がめん '+JSON.stringify({...L,text:L.text.slice(0,120)}));
 await H.shot('lineup');
 await H.dbg('gachaFast',4);await H.dbg('gachaNext',3);
 await H.page.getByRole('button',{name:'200コインで まわす',exact:true}).click();
 await H.until(()=>PokaDebug.gachaState().phase==='capsule',8000);await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).click();await H.until(()=>PokaDebug.gachaState().phase==='done',8000);await H.wait(300);
 let st=await H.dbg('gachaState');expect(st.last.id==='gacha_hair_3'&&st.last.rare&&st.last.first&&(await H.dbg('saveData')).wardrobe.gacha_hair_3===true,'レアの ちょうちょが でない '+JSON.stringify(st.last));
 await H.shot('rare');
 await H.page.locator('.modal-wrap:not(.out) .close').click();await H.until(()=>!PokaDebug.gachaState().open&&PokaDebug.idle(),8000);
 // きょうりゅうの 台（てまえの れつ）: ティラノサウルス → もちものの 家具
 await H.dbg('gachaOpen',8);await H.page.locator('.modal-wrap:not(.out) .gacha').waitFor();await H.wait(300);
 expect(/ちび きょうりゅう/.test(await H.eval(()=>document.querySelector('.modal-wrap:not(.out) .panel-title').textContent))&&/でるのは へやに かざる フィギュア/.test(await H.eval(()=>document.querySelector('.modal-wrap:not(.out) .gacha').textContent)),'きょうりゅうの 台で ない');
 await H.dbg('gachaNext',0);await H.page.locator('.gacha-go').click();await H.until(()=>PokaDebug.gachaState().phase==='capsule',8000);await H.page.getByRole('button',{name:'カプセルを あける',exact:true}).click();await H.until(()=>PokaDebug.gachaState().phase==='done',8000);
 st=await H.dbg('gachaState');expect(st.last.id==='gacha_dino_0'&&(await H.dbg('saveData')).furn.gacha_dino_0===1&&st.coins===c0-400,'ティラノサウルスが でない '+JSON.stringify(st.last));
 await H.page.locator('.modal-wrap:not(.out) .close').click();await H.until(()=>!PokaDebug.gachaState().open&&PokaDebug.idle(),8000);
 // おうち: きがえで ちょうちょの ヘアクリップ・もようがえで ティラノサウルス
 await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),15000);await H.wait(300);
 await H.houseButton('きがえ');await H.page.locator('.panel .grid .card').filter({hasText:'ちょうちょの ヘアクリップ'}).click();await H.wait(200);
 expect(await H.eval(()=>Save.d.chars[Save.d.order[0]].outfit.head)==='gacha_hair_3','きがえで ちょうちょの ヘアクリップを つけられない');
 await H.shot('dressup');await H.page.click('.modal-wrap .close');await H.until(()=>!G.scene.mode,8000);
 const n0=await H.eval(()=>Save.d.room.items.length);
 await H.houseButton('もようがえ');await H.page.locator('.edit-bar .tray .card').filter({hasText:'ティラノサウルス'}).click();await H.wait(300);await H.page.click('.edit-bar .btn.yellow');
 const room=await H.eval(()=>Save.d.room.items.map(it=>it.id));expect(room.length===n0+1&&room.includes('gacha_dino_0'),'ティラノサウルスを かざれない '+room);
 await H.wait(600);await H.shot('room');
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('aqua-gifts-'+viewport.width,async H=>{
 // すいぞくかんの おみやげ（js/aqua-gifts.js。オーナーの FB 2026-10-01「水族館のお土産コーナーに、海の生き物とごわががコラボしたグッズ5種や、海の生き物フィギュア10種を販売しなさい（どれも少し高めの価格）」）:
 // 12F の おみやげ（フィギュアの ショーケース 10・コラボの 台 5・レジ）→ レジの 3つの タブ → フィギュアを かう → ぼうしの 台で かって きる → リュック・クッション → たりないと かえない → おうちに かざって さわる
 await H.newGameFast();const c0=await H.dbg('coins',9000);
 // かった あとの 画面は 180ms かけて きえる（.modal-wrap.out。なかの「かう」は おせない まま のこる）ので、あいて いる 画面の「かう」だけを さがす
 const buyBtn=()=>H.page.locator('.modal-wrap:not(.out)').getByRole('button',{name:'かう',exact:true});
 let a=await H.dbg('aquaGifts');
 expect(a.figs.length===10&&a.goods.length===5&&a.stands.length===15&&a.register&&a.figs.every(f=>f.price>=1280&&f.price<=1880&&!f.own)&&a.goods.every(g=>g.price>=1580&&g.price<=2980&&!g.own)&&/すいぞくかん/.test(a.source),'おみやげの しなもの・ねだん '+JSON.stringify(a));
 await H.dbg('venue','mall',12);await H.idle();await H.until(()=>{try{return PokaDebug.venueIso()&&PokaDebug.venueIso().ready;}catch(e){return false;}},20000);
 expect(await H.dbg('venueWalk',7,22),'おみやげの コーナーへ あるけない');await H.until(()=>{const v=PokaDebug.venueState();return v&&Math.hypot(v.party[0].x-7,v.party[0].y-22)<0.6&&PokaDebug.idle();},25000);await H.wait(800);await H.shot('corner');
 // レジ: 3つの タブ。タイトルは 1ぎょう・はみ出さない・なまえは ことばの きれめで おりかえす（フィギュ／ア に ならない）・カードと タブは 44px いじょう
 expect(await H.dbg('venueVisit','おみやげの レジ'),'レジが ない');
 await H.page.locator('.modal-wrap:not(.out) .tabs .tab').first().waitFor({timeout:20000});await H.wait(400);
 const lay=async(tag,count)=>{const L=await H.eval(()=>{const r=e=>e.getBoundingClientRect(),pn=document.querySelector('.modal-wrap:not(.out) .panel'),body=pn.querySelector('.panel-body'),t=pn.querySelector('.panel-title'),g=document.createRange();g.selectNodeContents(t);const cards=[...pn.querySelectorAll('.grid .card')],names=cards.map(c=>c.querySelector('div'));
   return {cards:cards.length,small:[...cards,...pn.querySelectorAll('.tab')].filter(b=>{const q=r(b);return q.width<43.5||q.height<43.5;}).length,wide:body.scrollWidth>body.clientWidth+1,lines:g.getClientRects().length,keep:names.every(d=>d&&getComputedStyle(d).wordBreak==='keep-all'),tab:pn.querySelector('.tab.on').textContent,text:pn.textContent};});
  expect(L.cards===count&&!L.small&&!L.wide&&L.lines===1&&L.keep,tag+'の がめん '+JSON.stringify({...L,text:undefined}));return L;};
 let L=await lay('フィギュア',10);expect(L.tab==='フィギュア'&&/うみの ポケット/.test(L.text)&&/ケープペンギン フィギュア/.test(L.text)&&/1880/.test(L.text),'フィギュアの タブ '+L.text.slice(0,120));await H.shot('shop-fig');
 const tab=async(name)=>{await H.page.locator('.modal-wrap:not(.out) .tab',{hasText:name}).click();await H.wait(250);};
 await tab('コラボ かぐ');L=await lay('コラボ かぐ',3);expect(/ペンギン わんこ ぬいぐるみ/.test(L.text)&&/2980/.test(L.text),'コラボ かぐ');await H.shot('shop-goods');
 await tab('コラボ ふく');L=await lay('コラボ ふく',2);expect(/シャチ ごじ リュック/.test(L.text)&&/ジンベエザメ ごわが ぼうし/.test(L.text),'コラボ ふく');
 // フィギュアを かう（シャチ 1880 コイン）
 await tab('フィギュア');await H.page.locator('.modal-wrap:not(.out) .grid .card',{hasText:'シャチ フィギュア'}).click();
 await buyBtn().waitFor();await H.wait(300);await H.shot('detail-fig');
 await buyBtn().click();await H.wait(400);
 let d=await H.dbg('saveData');expect(d.coins===c0-1880&&d.furn.aqfig_orca===1,'フィギュアが かえない '+d.coins);
 await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.idle();
 // ぼうしの 台（マネキン）を タップ → かう → いま きる
 expect(await H.dbg('venueVisit','ジンベエザメ ごわが ぼうし'),'ぼうしの 台が ない');await buyBtn().waitFor({timeout:20000});await H.wait(300);await H.shot('detail-hat');
 await buyBtn().click();await H.page.getByRole('button',{name:'きる！',exact:true}).click();await H.idle();
 d=await H.dbg('saveData');const lead=d.order[0];expect(d.coins===c0-1880-1580&&d.wardrobe.aqc_whalehat&&d.chars[lead].outfit.head==='aqc_whalehat','ぼうしが かえない／きられない '+JSON.stringify([d.coins,d.chars[lead].outfit]));
 // リュック（うしろむきの 台）・チンアナゴの クッション
 expect(await H.dbg('venueVisit','シャチ ごじ リュック'),'リュックの 台が ない');await buyBtn().waitFor({timeout:20000});await buyBtn().click();await H.page.getByRole('button',{name:'あとで',exact:true}).click();await H.idle();
 expect(await H.dbg('venueVisit','チンアナゴ ごわが クッション'),'クッションの 台が ない');await buyBtn().waitFor({timeout:20000});await buyBtn().click();await H.idle();
 d=await H.dbg('saveData');expect(d.coins===c0-1880-1580-2480-2280&&d.wardrobe.aqc_orcapack&&d.furn.aqc_eel===1,'リュック・クッションが かえない '+d.coins);
 // のこりは 1000 コイン より すくない: ペンギンの ぬいぐるみ（2980）は かえない
 expect(await H.dbg('venueVisit','ペンギン わんこ ぬいぐるみ'),'ぬいぐるみの 台が ない');await buyBtn().waitFor({timeout:20000});await buyBtn().click();await H.wait(300);
 d=await H.dbg('saveData');expect(d.coins===c0-1880-1580-2480-2280&&d.coins<2980&&!d.furn.aqc_penguin&&/たりない/.test(await H.eval(()=>document.querySelector('.toasts')?.textContent||'')),'コインが たりないのに かえる '+d.coins);
 await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.idle();await H.wait(400);await H.shot('wear-hat');
 // おうちに かざる: チンアナゴの クッションを タップすると すなに かくれて、3人の だれかが ひとこと。シャチの フィギュアも おける
 await H.dbg('house');await H.until(()=>G.sceneName==='house'&&PokaDebug.idle(),10000);
 await H.dbg('homeLayout',[{id:'aqc_eel',x:150,y:560},{id:'aqfig_orca',x:330,y:520}]);await H.dbg('homeBubbleFixture');await H.wait(700);
 const e0=await H.dbg('furnLive','aqc_eel');expect(e0&&e0.tap&&e0.live,'クッションを タップできない '+JSON.stringify(e0));
 await H.tap(e0.tap.x,e0.tap.y);await H.wait(300);const e1=await H.dbg('furnLive','aqc_eel');
 expect(e1.n===1&&e1.t<1&&e1.talk>e0.talk,'チンアナゴが かくれない／3人が なにも いわない '+JSON.stringify([e0,e1]));await H.shot('home-eel');
 a=await H.dbg('aquaGifts');expect(a.figs.find(f=>f.id==='aqfig_orca').own===1&&a.goods.filter(g=>g.own).map(g=>g.id).join()==='aqc_eel,aqc_whalehat,aqc_orcapack','もちものの かず '+JSON.stringify(a.goods));
},{viewport,full:viewport.width===375,timeout:150000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('figure-stand-'+viewport.width,async H=>{
 // フィギュア台（js/figure-stand.js。オーナーの FB 2026-10-01「家具として、各種フィギュアを置ける、フィギュア台を作りなさい」）:
 // ひなだんを おいて タップ → 3×3 の ばしょ → ばしょを えらんで フィギュアを かざる → ぜんぶ ならべる → とりだす → もようがえの のこり → さいかいしても のこる → ガラスの ケースは よるに あかり
 await H.newGameFast();await H.dbg('unlockAll');await H.dbg('hour',20);
 await H.dbg('homeLayout',[{id:'figstand_step',x:80,y:540}]);await H.dbg('homeBubbleFixture');await H.wait(600);
 let f=await H.dbg('figStand');expect(f.stands.length===1&&f.stands[0].figs.every(x=>x===null)&&f.figures>=32&&f.own===f.figures&&f.free.aqfig_penguin===1,'だいが からっぽで ない／フィギュアの かず '+JSON.stringify({...f,free:undefined}));
 const c0=f.comfort;
 const a=await H.dbg('furnLive','figstand_step');expect(a&&a.tap,'だいを タップできない');await H.tap(a.tap.x,a.tap.y);
 await H.page.locator('.modal-wrap:not(.out) .figst').waitFor({timeout:15000});await H.wait(300);
 // がめん: ばしょ 9（44px いじょう）・ボタン 44px・はみ出さない・みだしは 1ぎょう
 const lay=async(tag,sel)=>{const L=await H.eval((sel)=>{const r=e=>e.getBoundingClientRect(),pn=[...document.querySelectorAll('.modal-wrap:not(.out) .panel')].pop(),body=pn.querySelector('.panel-body'),t=pn.querySelector('.panel-title'),g=document.createRange();g.selectNodeContents(t);const bs=[...pn.querySelectorAll(sel)].filter(b=>b.offsetParent);
   return {n:bs.length,small:bs.filter(b=>{const q=r(b);return q.width<43.5||q.height<43.5;}).length,wide:body.scrollWidth>body.clientWidth+1,edge:r(pn).left>=-0.5&&r(pn).right<=innerWidth+0.5,lines:g.getClientRects().length,title:t.textContent};},sel);
  expect(!L.small&&!L.wide&&L.edge&&L.lines===1,tag+'の がめん '+JSON.stringify(L));return L;};
 let L=await lay('かざる','.figst-slot, .btn');expect(L.title==='フィギュアを かざる'&&await H.page.locator('.figst-slot').count()===9,'ばしょが 9つ ない');await H.shot('stand-empty');
 // うしろの だんの ひだり に ケープペンギン
 await H.page.getByRole('button',{name:'うしろの だんの ひだり・あいて いる',exact:true}).click();await H.wait(300);
 L=await lay('えらぶ','.card, .btn');expect(L.title==='うしろの だんの ひだり'&&L.n>=32,'えらぶ がめん '+JSON.stringify(L));await H.shot('stand-pick');
 // フィギュアの 絵: いれこの svg（ガチャの 3人 など）が アイコンの わくから でない（CSS の「svg { width: 100% }」で 大きく ならない）
 const spill=sel=>H.eval(sel=>{const names=FigureStand.figures().map(id=>FURN_INDEX[id].name);return [...document.querySelectorAll(sel)].filter(ic=>names.some(n=>(ic.closest('.card')||ic).textContent.includes(n))).flatMap(ic=>{const b=ic.getBoundingClientRect();return [...ic.querySelectorAll('svg svg')].filter(s=>{const q=s.getBoundingClientRect();return q.width>0&&(q.left<b.left-1||q.top<b.top-1||q.right>b.right+1||q.bottom>b.bottom+1);}).map(()=>(ic.closest('.card')||ic).textContent.trim());});},sel);
 let out=await spill('.modal-wrap:not(.out) .figst-list .figst-ico');expect(!out.length,'えらぶ がめんの フィギュアの 絵が ずれる '+JSON.stringify(out));
 await H.page.locator('.modal-wrap:not(.out) .figst-list .card',{hasText:'ケープペンギン フィギュア'}).click();await H.wait(400);
 f=await H.dbg('figStand');expect(f.stands[0].figs[0]==='aqfig_penguin'&&f.free.aqfig_penguin===0&&!f.pick&&f.open,'かざれない '+JSON.stringify(f.stands));
 expect(await H.page.getByRole('button',{name:'うしろの だんの ひだり・ケープペンギン フィギュア',exact:true}).count()===1,'ばしょに かざった フィギュアが でない');
 // ぜんぶ ならべる → 9つ。いごこちが あがる
 await H.page.getByRole('button',{name:'ぜんぶ ならべる',exact:true}).click();await H.wait(400);
 f=await H.dbg('figStand');expect(f.stands[0].figs.every(Boolean)&&new Set(f.stands[0].figs).size===9&&f.comfort>c0&&f.stands[0].figs.every(id=>f.free[id]===0),'ぜんぶ ならばない／いごこち '+JSON.stringify([f.stands[0].figs,c0,f.comfort]));await H.shot('stand-full');
 // とりだす（まえの だんの みぎ）→ もちものに もどる
 const last=f.stands[0].figs[8];await H.page.locator('.figst-slot[data-slot="8"]').click();await H.page.getByRole('button',{name:'とりだす',exact:true}).click();await H.wait(300);
 f=await H.dbg('figStand');expect(f.stands[0].figs[8]===null&&f.free[last]===1,'とりだせない '+JSON.stringify(f.stands[0].figs));
 await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.idle();await H.wait(600);await H.shot('stand-room');
 // さいかいしても のこる
 await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();
 f=await H.dbg('figStand');expect(f&&f.stands[0].figs[0]==='aqfig_penguin'&&f.stands[0].figs.filter(Boolean).length===8,'さいかいで フィギュアが きえる '+JSON.stringify(f&&f.stands));
 // ガラスの ケース: よるは あかり・なかに フィギュア
 await H.dbg('hour',20);await H.dbg('homeLayout',[{id:'figstand_case',x:70,y:540,figs:['aqfig_whaleshark','aqfig_turtle',null,'gacha_friends_3']}]);await H.dbg('homeBubbleFixture');await H.wait(700);
 const c=await H.dbg('furnLive','figstand_case');f=await H.dbg('figStand');expect(c&&c.on&&c.live&&f.stands[0].figs.filter(Boolean).length===3&&f.free.aqfig_penguin===1,'ケースの あかり／フィギュア '+JSON.stringify([c,f.stands]));await H.shot('case-night');
 // もようがえの 一覧（UI.icon）でも フィギュアの 絵が わくから でない（おすわり がちゃん・すやすや ねこ など）
 await H.houseButton('もようがえ');await H.page.locator('.edit-bar .tray .card').filter({hasText:'おすわり がちゃん'}).first().waitFor({timeout:8000});
 const figN=await H.eval(()=>{const names=FigureStand.figures().map(id=>FURN_INDEX[id].name);return [...document.querySelectorAll('.edit-bar .tray .card')].filter(c=>names.some(n=>c.textContent.includes(n))).length;});
 out=await spill('.edit-bar .tray .card .ico');expect(figN>=20&&!out.length,'もようがえの フィギュアの 絵が ずれる '+JSON.stringify([figN,out.slice(0,5)]));
},{viewport,full:viewport.width===375,timeout:150000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-korokoro-'+viewport.width,async H=>{
 // ころころ フルーツ（mg-korokoro.js）: ネリカスタウンの お店 → レジで おてつだい →「ちゅうもん モード」→ 小さい くだものを ゆびで おとす → がったい → ちゅうもんが とどく
 await H.newGameFast();const before=await H.dbg('saveData');
 const layout=await H.dbg('townLayout','town'),door=layout.doors.find(d=>d.act.shop==='korokoro');expect(door&&door.id==='nerikasu_home5','ネリカスタウンの お店 '+JSON.stringify(door));
 await H.dbg('teleport','town',door.x,door.y+1);await H.idle(30000);await H.wait(600);await H.shot('outside');
 await H.dbg('store','korokoro','town');await H.idle();await H.wait(500);expect((await H.dbg('storeState')).owner==='りすの コロン','店主');await H.shot('store');
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
 await H.page.getByRole('button',{name:'ちゅうもん モード',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='shop'&&!PokaDebug.state().transitioning,15000);await H.wait(300);await H.dialogs();
 await H.until(()=>PokaDebug.mg()?.phase==='work',15000);await H.wait(500);
 let m=await H.dbg('mg');const box=m.order.box;
 expect(m.shop==='korokoro'&&m.total===4&&m.order.want.length===1&&m.order.want[0].name==='なし'&&m.buttons.length===0,'Lv1 の ちゅうもんは なし '+JSON.stringify(m.order.want));
 expect(box.x0>=8&&box.x0+box.w*box.unit<=viewport.width-50&&box.y0+box.h*box.unit<=viewport.height-4&&box.unit>=2.2,'箱が 画面から はみ出す／ちいさすぎる '+JSON.stringify(box));
 expect(await H.eval(()=>Sound.want||Sound.cur?.name)==='shop_korokoro','お店の BGM');await H.shot('start');
 // 1にんめ: ゆびで おとす（おなじ だんの 玉の 上か、いちばん ひくい ところ）。おちてくるのは 小さい 4しゅ（3人の かおは くっつけて つくる）
 const R=[4.6,6,7.7,10,12.4,15.4,19,23.6],held=[];
 await H.dbg('koroSetup',{seed:20260929,held:0,next:1}); // おちてくる ならびを きめる（さくらんぼ → いちご → …）
 const aim=o=>{const r=R[o.held];let x=null,best=-1;for(const q of o.bodies)if(q.tier===o.held&&q.grow>=1&&q.y>best){best=q.y;x=q.x;}
  if(x==null){let by=-1e9;for(let i=0;i<=20;i++){const xx=r+(100-2*r)*i/20;let y=110-r;for(const q of o.bodies){const dx=Math.abs(q.x-xx),rs=r+q.r;if(dx<rs)y=Math.min(y,q.y-Math.sqrt(rs*rs-dx*dx));}if(y>by){by=y;x=xx;}}}return x;};
 for(let k=0;k<80;k++){
  m=await H.dbg('mg');if(m.phase!=='work'||m.n!==0)break;
  if(!m.order.canDrop){await H.wait(60);continue;}
  held.push(m.order.held);const x=aim(m.order);await H.tap(box.x0+x*box.unit,m.order.box.dropY);await H.wait(380);
  if(k===4)await H.shot('play');
 }
 await H.until(()=>PokaDebug.mg().ranks.length>=1,20000);m=await H.dbg('mg');
 expect(m.ranks[0]>=2&&held.length>=3&&held.every(t=>t>=0&&t<4)&&new Set(held).size>=2,'ゆびで あそんで なしが とどかない／おちてくるのが 小さい 4しゅ でない '+JSON.stringify({ranks:m.ranks,held}));
 expect(m.order&&m.order.points>0&&Object.keys(m.order.made).length>=2,'がったいの ポイント '+JSON.stringify(m.order&&m.order.made));await H.shot('judge');
 // 2にんめ: りんご 2つを ならべると なしに なって とどく
 await H.until(()=>PokaDebug.mg()?.phase==='work'&&PokaDebug.mg().n===1,20000);
 await H.dbg('koroSetup',{bodies:[[3,40,100],[3,59.8,100]]});await H.until(()=>PokaDebug.mg().ranks.length>=2,8000);
 m=await H.dbg('mg');expect(m.ranks[1]===3,'りんご 2つで なしが できない '+m.ranks);
 // 3にんめ: あふれ → 箱が からっぽ → あふれの 減点（それでも とどけられる）
 await H.until(()=>PokaDebug.mg()?.phase==='work'&&PokaDebug.mg().n===2,20000);
 await H.dbg('koroSetup',{bodies:Array.from({length:10},(_,i)=>[(Math.floor(i/2)+i%2)%2?6:7,24+(i%2)*52,86.4-Math.floor(i/2)*44])});
 await H.until(()=>PokaDebug.mg().order.spills===1,8000);await H.wait(300);await H.shot('overflow');
 await H.until(()=>{const o=PokaDebug.mg().order;return !o.floorOpen&&o.bodies.length===0;},8000);
 await H.dbg('koroSetup',{bodies:[[3,40,100],[3,59.8,100]]});await H.until(()=>PokaDebug.mg().ranks.length>=3,8000);
 m=await H.dbg('mg');expect(m.ranks[2]===1,'あふれの 減点が ない '+m.ranks);
 // 4にんめ: がちゃん 2つで わんこを つくると チップ（3人の かおの 玉）
 await H.until(()=>PokaDebug.mg()?.phase==='work'&&PokaDebug.mg().n===3,20000);
 await H.dbg('koroSetup',{bodies:[[5,30,94],[5,60.4,94],[3,40,40],[3,59.8,40]]});await H.until(()=>PokaDebug.mg().ranks.length>=4,8000);
 m=await H.dbg('mg');expect(m.ranks[3]===3&&m.tips>=8,'わんこの チップ '+JSON.stringify([m.ranks,m.tips]));
 await H.until(()=>!!document.querySelector('.modal-wrap .panel-foot .btn'),15000);
 const text=await H.eval(()=>document.querySelector('.modal-wrap').textContent);expect(/ころころ ポイント/.test(text)&&/さいこう/.test(text),'けっかに ポイントが ない '+text);await H.shot('result');
 await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),15000);
 const after=await H.dbg('saveData');
 expect(after.coins>before.coins&&after.shops.korokoro.plays===1&&after.shops.korokoro.pts>0&&after.shops.korokoro.rep>0,'コイン・ひょうばん・ポイントの きろく '+JSON.stringify(after.shops.korokoro));
 // レジの かいもの（くだものと ジュース）
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'かいものを する',exact:true}).click();
 await H.page.locator('.modal-wrap .grid > *').first().waitFor();expect(await H.eval(()=>document.querySelectorAll('.modal-wrap .grid > *').length)===3,'レジの しなもの');
 await H.page.getByRole('button',{name:'とじる',exact:true}).last().click();await H.idle();
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('nerikasu-korokoro-score-'+viewport.width,async H=>{
 // ころころ フルーツの スコア モード（korokoro-score.js）: お店で「おてつだいする」→「スコア モード」→ あそびかた → ゆびで おとす →
 // 本物の スイカゲームと おなじ 点（くっつけた だんの 三角数）→ ふちから はみだして おしまい → ハイスコア・ランキング・コイン → もういちど → やめる → てんないへ
 await H.newGameFast();const before=await H.dbg('saveData');
 await H.dbg('store','korokoro','town');await H.idle();await H.wait(400);
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
 await H.page.getByRole('button',{name:'スコア モード',exact:true}).waitFor();
 const ask=await H.eval(()=>document.querySelector('.dlg-shade.ask .dlg-text').textContent);
 expect(/ちゅうもん/.test(ask)&&/スコア/.test(ask)&&!/ハイスコア/.test(ask),'モードの せつめい '+ask);
 const fit=await H.eval(()=>{const r=document.querySelector('.dlg-shade.ask .dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});expect(fit,'モードの えらびが 画面から はみ出す');
 await H.shot('mode');
 await H.page.getByRole('button',{name:'スコア モード',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning,15000);await H.wait(300);
 // はじめては あそびかた（店主の ことば）→ あそぶ
 const howto=await H.eval(()=>document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent||'');expect(/スコア モード/.test(howto),'はじめての あそびかた '+howto);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);await H.wait(300);
 let k=await H.dbg('koro');const box=k.box;
 expect(k.score===0&&k.hi===0&&k.dropKinds===4&&k.overSec<=0.6&&k.held<4&&k.next<4,'はじめの ようす '+JSON.stringify({score:k.score,hi:k.hi,held:k.held,next:k.next,overSec:k.overSec}));
 const stop=await H.page.getByRole('button',{name:'スコア モードを やめる',exact:true}).boundingBox();
 const apart=(a,b)=>a.x+a.w<=b.x+1||b.x+b.w<=a.x+1||a.y+a.h<=b.y+1||b.y+b.h<=a.y+1,sb={x:stop.x,y:stop.y,w:stop.width,h:stop.height};
 expect(box.rect.x>=0&&box.rect.x+box.rect.w<=viewport.width&&k.row.y>=box.rect.y+box.rect.h-8&&k.row.y+k.row.h<=viewport.height-4&&box.unit>=2.8&&Math.abs(box.h-110*1.15)<0.01,'箱と じゅんばんが 画面に おさまらない／ちいさい／15% たかく ない '+JSON.stringify({box,row:k.row}));
 expect(stop.height>=44&&[k.sign,k.panel,k.nextBox,box.rect].every(r=>apart(sb,r))&&apart(k.panel,k.nextBox)&&k.team.every(t=>t.cx>k.panel.x+k.panel.w&&t.cx<k.nextBox.x),'「やめる」・スコア・3人・つぎ が かさなる '+JSON.stringify({stop:sb,sign:k.sign,panel:k.panel,next:k.nextBox,team:k.team}));
 expect(await H.eval(()=>Sound.want||Sound.cur?.name)==='shop_korokoro','お店の BGM');await H.shot('start');
 // ゆびで おとす（おなじ だんの 玉の 上か、いちばん ひくい ところ）。点は くっつけた だんの 三角数（made から けいさん）
 const RR=[4.6,6,7.7,10,12.4,15.4,19,23.6],PT=[1,3,6,10,15,21,28,36],held=[];
 await H.dbg('koroSetup',{seed:20260930,held:0,next:1});
 const aim=o=>{const r=RR[o.held];let x=null,best=-1;for(const q of o.bodies)if(q.tier===o.held&&q.grow>=1&&q.y>best){best=q.y;x=q.x;}
  if(x==null){let by=-1e9;for(let i=0;i<=20;i++){const xx=r+(100-2*r)*i/20;let y=110-r;for(const q of o.bodies){const dx=Math.abs(q.x-xx),rs=r+q.r;if(dx<rs)y=Math.min(y,q.y-Math.sqrt(rs*rs-dx*dx));}if(y>by){by=y;x=xx;}}}return x;};
 for(let i=0;i<60&&held.length<14;i++){
  k=await H.dbg('koro');if(k.phase!=='play')break;
  if(!k.canDrop){await H.wait(60);continue;}
  held.push(k.held);await H.tap(box.x0+aim(k)*box.unit,box.dropY);await H.wait(420);
  if(held.length===6)await H.shot('play');
 }
 await H.wait(1200);k=await H.dbg('koro');
 const want=Object.entries(k.made).reduce((s,[t,n])=>s+(t==='burst'?36:PT[t-1])*n,0);
 expect(k.phase==='play'&&held.length>=10&&held.every(t=>t<4)&&k.merges>=2&&k.score>0&&k.score===want,'ゆびで あそんだ 点が 本物の きまりに ならない '+JSON.stringify({score:k.score,want,made:k.made,held}));
 // きまった 点: さくらんぼ 2つ = 1・わんこ 2つ = 28（ごじが できる）・ごじ 2つ = 36（きえる）
 let s0=k.score;await H.dbg('koroSetup',{bodies:[[0,30,105],[0,39.2,105]]});await H.until(s=>PokaDebug.koro().score===s+1,5000,s0);
 s0=s0+1;await H.dbg('koroSetup',{bodies:[[6,30,91],[6,67.8,91]]});await H.until(s=>PokaDebug.koro().score===s+28&&PokaDebug.koro().bodies.some(b=>b.tier===7),5000,s0);
 k=await H.dbg('koro');expect(k.team.find(t=>t.id==='goji').emo==='happy','ごじが できても ごじが よろこばない '+JSON.stringify(k.team));await H.shot('goji');
 s0=s0+28;await H.dbg('koroSetup',{bodies:[[7,26,86],[7,73,86]]});await H.until(s=>PokaDebug.koro().score===s+36&&PokaDebug.koro().bodies.length===0,5000,s0);
 // ふちから はみだすと すぐ おしまい（あかい わ → おしまい → けっか）
 const final=s0+36;await H.dbg('koroSetup',{bodies:Array.from({length:10},(_,i)=>[(Math.floor(i/2)+i%2)%2?6:7,24+(i%2)*52,86.4-Math.floor(i/2)*44])});
 const t0=Date.now();await H.until(()=>PokaDebug.koro().phase==='over',5000);const took=Date.now()-t0;
 k=await H.dbg('koro');expect(k.over&&!k.canDrop&&k.score===final&&took<2500,'はみだしても すぐ おしまいに ならない '+JSON.stringify({took,score:k.score,final}));await H.wait(250);await H.shot('over');
 await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn'),8000);await H.wait(300);
 const text=await H.eval(()=>document.querySelector('.modal-wrap').textContent);
 expect(/しんきろく/.test(text)&&/ハイスコア/.test(text)&&/ランキング/.test(text)&&/1い/.test(text)&&/いま！/.test(text)&&text.includes(final+'てん'),'けっかの まど '+text);
 const modalFit=await H.eval(()=>{const p=document.querySelector('.modal-wrap .panel').getBoundingClientRect(),b=[...document.querySelectorAll('.modal-wrap .koro-foot .btn')].map(x=>x.getBoundingClientRect());return p.left>=0&&p.right<=innerWidth&&b.length===2&&b.every(r=>r.height>=44&&r.right<=innerWidth&&r.bottom<=innerHeight);});
 expect(modalFit,'けっかの まどが 画面から はみ出す／ボタンが ちいさい');await H.shot('result');
 let after=await H.dbg('saveData');const kr=after.shops.korokoro,mul=await H.eval(()=>GameEconomy.mode(Save.d.settings.difficulty).reward*DailyPlay.boost('korokoro')),pay=Math.round(Math.min(400,Math.floor(final/6))*mul);
 expect(kr.hi===final&&kr.games===1&&kr.tops.length===1&&kr.tops[0].s===final&&after.coins-before.coins===pay&&kr.rep===Math.min(12,Math.floor(final/100))&&after.stats.shifts===before.stats.shifts+1&&kr.plays===0,'ハイスコア・ランキング・コイン・ひょうばんの きろく '+JSON.stringify({kr,coins:after.coins-before.coins,pay}));
 // もういちど: 2かいめは ハイスコアの ひとことだけ → あそぶ → やめる（いまの 点で けっか）→ てんないへ
 await H.page.getByRole('button',{name:'もういちど',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning&&PokaDebug.koro()?.phase==='intro',15000);
 const again=await H.eval(()=>document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent||'');expect(again.includes('ハイスコアは')&&again.includes(String(final)),'2かいめの ひとこと '+again);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);
 k=await H.dbg('koro');expect(k.score===0&&k.hi0===final&&k.games===1,'もういちど の はじめ '+JSON.stringify({score:k.score,hi0:k.hi0}));
 await H.dbg('koroSetup',{bodies:[[1,30,103],[1,41.6,103]]});await H.until(()=>PokaDebug.koro().score===3,5000);
 await H.page.getByRole('button',{name:'スコア モードを やめる',exact:true}).click();await H.page.getByRole('button',{name:'おわりに する',exact:true}).click();
 await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn'),8000);
 const text2=await H.eval(()=>document.querySelector('.modal-wrap').textContent);expect(!/しんきろく/.test(text2)&&/2い/.test(text2)&&/いま！/.test(text2),'やめた ときの けっか '+text2);
 await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),15000);
 after=await H.dbg('saveData');expect(after.shops.korokoro.games===2&&after.shops.korokoro.hi===final&&after.shops.korokoro.tops.map(e=>e.s).join()===final+',3','2かいめの きろく '+JSON.stringify(after.shops.korokoro));
 // つぎに お店で えらぶ ときは ハイスコアが みえる
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
 await H.page.getByRole('button',{name:'スコア モード',exact:true}).waitFor();
 const ask2=await H.eval(()=>document.querySelector('.dlg-shade.ask .dlg-text').textContent);expect(ask2.includes('ハイスコア '+final),'お店で ハイスコアが みえない '+ask2);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.idle();expect((await H.dbg('state')).scene==='store','やめると てんないの まま');
},{viewport,timeout:180000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('korokoro-prizes-'+viewport.width,async H=>{
 // ハイスコアの ごほうび（korokoro-prizes.js）: スコア モードで 850てん → とくべつな かぐ 3つ（200・500・800てん）→ つぎの めやす → おうちの よるの へやに 6つ おいて タップ
 await H.newGameFast();
 await H.dbg('koroScore',{seed:5});await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning,15000);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);await H.wait(200);
 await H.dbg('koroSetup',{points:850,bodies:Array.from({length:10},(_,i)=>[(Math.floor(i/2)+i%2)%2?6:7,24+(i%2)*52,86.4-Math.floor(i/2)*44])});
 await H.until(()=>PokaDebug.koro().phase==='over',6000);
 await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn'),8000);await H.wait(400);
 const text=await H.eval(()=>document.querySelector('.modal-wrap').textContent);
 const cards=await H.eval(()=>[...document.querySelectorAll('.modal-wrap .koro-gift')].map(e=>({t:e.textContent,img:e.querySelector('img').naturalWidth>0,w:e.getBoundingClientRect().right<=innerWidth})));
 expect(cards.length===3&&cards.every(c=>c.img&&c.w)&&/さくらんぼの ランプ/.test(cards[0].t)&&/いちごの ソファ/.test(cards[1].t)&&/みかんの テーブル/.test(cards[2].t),'とくべつな かぐの カード '+JSON.stringify(cards));
 expect(/つぎの とくべつな かぐは 1,200てん（あと 350てん）/.test(text)&&/850てん/.test(text),'つぎの めやす '+text);
 const fit=await H.eval(()=>{const p=document.querySelector('.modal-wrap .panel').getBoundingClientRect(),b=[...document.querySelectorAll('.modal-wrap .koro-foot .btn')].map(x=>x.getBoundingClientRect());return p.left>=0&&p.right<=innerWidth&&b.every(r=>r.height>=44&&r.bottom<=innerHeight);});
 expect(fit,'けっかの まどが 画面から はみ出す');await H.shot('gifts');
 let save=await H.dbg('saveData');const got=['koro_cherry_lamp','koro_strawberry_sofa','koro_mikan_table'];
 expect(got.every(id=>save.furn[id]===1&&save.shops.korokoro.gifts[id])&&!save.furn.koro_apple_shelf&&Object.keys(save.shops.korokoro.gifts).length===3,'とくべつな かぐが もらえない '+JSON.stringify(save.shops.korokoro.gifts));
 // もういちど 900てんでは もう もらえない（おなじ かぐは 1かいだけ）
 await H.page.getByRole('button',{name:'もういちど',exact:true}).click();
 await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning&&PokaDebug.koro()?.phase==='intro',15000);
 const again=await H.eval(()=>document.querySelector('.dlg-shade:not(.ask) .dlg-text')?.textContent||'');expect(/ハイスコアは 850てん/.test(again),'2かいめの ひとこと '+again);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);
 await H.dbg('koroSetup',{points:900});await H.page.getByRole('button',{name:'スコア モードを やめる',exact:true}).click();await H.page.getByRole('button',{name:'おわりに する',exact:true}).click();
 await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn'),8000);
 expect(await H.eval(()=>document.querySelectorAll('.modal-wrap .koro-gift').length)===0,'おなじ かぐを また もらえる');
 await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),15000);
 save=await H.dbg('saveData');expect(got.every(id=>save.furn[id]===1),'かぐの かずが ふえる');
 // おうち（よる 21じ）: 6つの かぐを おいて タップ。ランプは よるは ついて いて タップで きえる・ほかは うごいて 3人が ひとこと
 await H.dbg('hour',21);await H.dbg('house');await H.until(()=>PokaDebug.state().scene==='house'&&!PokaDebug.state().transitioning,15000);await H.idle(20000);
 // 3人・ぱぱ ままの たつ ところ（homeBubbleFixture）から 画面で 30px いじょう はなれた ところに おく（まえは クッションが ごじの すぐ よこで、WebKit では ごじを なでて いた）
 await H.dbg('homeLayout',[{id:'koro_apple_shelf',x:160,y:250},{id:'koro_fruit_tower',x:430,y:280},{id:'koro_cherry_lamp',x:40,y:550},{id:'koro_strawberry_sofa',x:190,y:340},{id:'koro_mikan_table',x:40,y:490},{id:'koro_pear_cushion',x:110,y:550}]);
 await H.dbg('homeBubbleFixture');await H.wait(900);await H.shot('room-night');
 const touch=async(id,ok,msg)=>{
  // まえの タップで うごいた 3人・ぱぱ ままを とめてから おす 点を きめる（人が かぶると 人を タップして しまう）
  await H.dbg('homeBubbleFixture');await H.wait(120);
  const a=await H.dbg('furnLive',id);expect(a&&a.tap,`${id}: タップできる 点が ない`);
  await H.tap(a.tap.x,a.tap.y);await H.wait(320);
  const b=await H.dbg('furnLive',id);expect(ok(a,b),`${msg} ${JSON.stringify([a,b])}`);expect(b.talk>a.talk,`${id}: 3人が なにも いわない`);
  return b;
 };
 await touch('koro_cherry_lamp',(a,b)=>a.on===true&&b.on===false,'よるの さくらんぼの ランプが タップで きえない');
 await touch('koro_cherry_lamp',(a,b)=>b.on===true,'さくらんぼの ランプが つかない');
 await touch('koro_fruit_tower',(a,b)=>b.t<1&&b.live,'ころころ タワーが はずまない');await H.wait(150);await H.shot('tower-bounce');
 for(const id of ['koro_strawberry_sofa','koro_mikan_table','koro_apple_shelf','koro_pear_cushion'])await touch(id,(a,b)=>b.t<1,`${id} を タップしても うごかない`);
 await H.wait(300);await H.shot('room-tapped');
},{viewport,timeout:200000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('korokoro-records-'+viewport.width,async H=>{
 // きろくと けいひんの まど（korokoro-score.js・オーナーの FB 2026-09-30「過去の スコアの 記録を 見る ボタン」「スコアに 応じて 貰える 景品 一覧」）:
 // あそんで いる ときの「きろく」（あいて いる あいだ 箱が とまる）→ けっかの「きろくと けいひんを みる」→ お店の モードえらびの「きろくと けいひん」
 await H.newGameFast();
 await H.dbg('koroScore',{seed:7});await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning,15000);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);await H.wait(200);
 // みぎ うえの「きろく」「やめる」: 44px いじょう・ならんで いて かんばん／スコア／つぎ／箱に かさならない
 const k=await H.dbg('koro'),box=async(name)=>{const b=await H.page.getByRole('button',{name,exact:true}).boundingBox();return {x:b.x,y:b.y,w:b.width,h:b.height};};
 const rb=await box('スコア モードの きろくと けいひん'),sb=await box('スコア モードを やめる'),apart=(a,b)=>a.x+a.w<=b.x+1||b.x+b.w<=a.x+1||a.y+a.h<=b.y+1||b.y+b.h<=a.y+1;
 expect(rb.h>=44&&sb.h>=44&&rb.w>=44&&rb.x+rb.w<=sb.x+1&&sb.x+sb.w<=viewport.width&&k.sign.x+k.sign.w<=rb.x+1&&[k.sign,k.panel,k.nextBox,k.box.rect].every(r=>apart(rb,r)&&apart(sb,r)),'「きろく」「やめる」が かさなる／小さい '+JSON.stringify({rb,sb,sign:k.sign,panel:k.panel}));
 await H.shot('top');
 // おちて いる とちゅうで「きろく」→ まどが あいて いる あいだ 箱は とまる
 await H.dbg('koroSetup',{bodies:[[3,50,30]]});await H.wait(80);
 await H.page.getByRole('button',{name:'スコア モードの きろくと けいひん',exact:true}).click();
 await H.page.getByRole('tab',{name:'きろく',exact:true}).waitFor();await H.wait(200);
 const p0=await H.dbg('koro');await H.wait(700);const p1=await H.dbg('koro');
 expect(p0.paused&&p1.paused&&p1.t===p0.t&&p1.bodies[0].y===p0.bodies[0].y,'きろくの まどの あいだ 箱が とまらない '+JSON.stringify([p0.t,p1.t,p0.bodies[0]?.y,p1.bodies[0]?.y]));
 const book=()=>H.eval(()=>document.querySelector('.modal-wrap .koro-book').textContent);
 let text=await book();expect(/まだ きろくが ないよ/.test(text)&&/ランキング/.test(text)&&/あそんだ かいすう0かい/.test(text),'はじめての きろく '+text);
 // はみ出さない: まど・タブ（44px いじょう）・なかみ（よこに スクロールしない）。
 // はかるのは いちばん うえの まど（あそんだ あとは けっかの まどの うえに ひらく）で、ひらく うごきが おわって から。だめな ときは どこが だめかを だす
 // うごきの おわりは 3つで みる: getAnimations が running でない・まどの transform が none・まどの 位置が 2フレーム つづけて おなじ
 // （WebKit は おわる すこし まえに running で なくなる ことが あり、のこり 2px の ところで はかって いた）
 const fit=async(msg)=>{
  await H.eval(()=>{window.__koroFitLast=null;});
  await H.until(()=>{const w=[...document.querySelectorAll('.modal-wrap:not(.out)')].pop();if(!w||!w.querySelector('.koro-book'))return false;const p=w.querySelector('.panel'),r=p.getBoundingClientRect(),k=[r.left,r.top,r.right,r.bottom].join(),same=window.__koroFitLast===k;window.__koroFitLast=k;
   return same&&getComputedStyle(p).transform==='none'&&getComputedStyle(w).opacity==='1'&&(typeof w.getAnimations!=='function'||[w,...w.querySelectorAll('.panel')].every(e=>e.getAnimations().every(a=>a.playState!=='running')));},5000);
  const r=await H.eval(()=>{const w=[...document.querySelectorAll('.modal-wrap:not(.out)')].pop(),p=w.querySelector('.panel').getBoundingClientRect(),body=w.querySelector('.panel-body'),tabs=[...w.querySelectorAll('.koro-tabs .btn')].map(b=>b.getBoundingClientRect());
   const out=[...w.querySelectorAll('.koro-book *')].filter(e=>{const r=e.getBoundingClientRect();return !(r.width===0||(r.left>=p.left-0.5&&r.right<=p.right+0.5));}).map(e=>e.className||e.tagName);
   const edge=!(p.left>=0&&p.right<=innerWidth&&p.bottom<=innerHeight+0.5),tab=!(tabs.length===3&&tabs.every(r=>r.height>=44)),wide=body.scrollWidth>body.clientWidth+1;
   return {ok:!edge&&!tab&&!out.length&&!wide,why:{edge,tab,out:out.slice(0,4),wide,p:[p.left,p.top,p.right,p.bottom],vw:[innerWidth,innerHeight],tabs:tabs.map(r=>r.height),sw:[body.scrollWidth,body.clientWidth]}};});
  expect(r.ok,msg+' '+JSON.stringify(r.why));
 };
 await fit('きろくの まどが はみ出す');
 // けいひん: 6つの とくべつな かぐ（めやす・まだ・つぎは あと なんてん）と そのほかの ごほうび（コイン・ひょうばん・ディスク）
 await H.page.getByRole('tab',{name:'けいひん',exact:true}).click();await H.wait(300);
 const prizes=()=>H.eval(()=>[...document.querySelectorAll('.modal-wrap .koro-prize')].map(e=>({t:e.textContent,own:e.classList.contains('own'),next:e.classList.contains('next'),img:e.querySelector('img').naturalWidth>0})));
 let list=await prizes();text=await book();
 expect(list.length===6&&list.every(p=>p.img&&!p.own)&&list[0].next&&list.filter(p=>p.next).length===1&&/さくらんぼの ランプ/.test(list[0].t)&&/あと 200てん/.test(list[0].t)&&/2,500てん/.test(list[5].t)&&/コイン6てんで 1まい/.test(text)&&/ひょうばん/.test(text)&&/ディスク/.test(text),'けいひん いちらん '+JSON.stringify(list.map(p=>p.t)));
 await fit('けいひんの まどが はみ出す');await H.shot('prizes-first');
 // とじると また うごく
 await H.page.getByRole('button',{name:'とじる',exact:true}).click();await H.wait(500);
 const p2=await H.dbg('koro');expect(!p2.paused&&p2.t>p1.t,'まどを とじても 箱が とまった まま '+JSON.stringify([p1.t,p2.t]));
 // がちゃん 2つで わんこ（+21てん）→ 850てんで やめる → けっかの「きろくと けいひんを みる」
 await H.dbg('koroSetup',{points:829,bodies:[[5,38,110],[5,62,110]]});
 await H.until(()=>PokaDebug.koro().made[6]===1,5000);await H.wait(200);
 await H.page.getByRole('button',{name:'スコア モードを やめる',exact:true}).click();await H.page.getByRole('button',{name:'おわりに する',exact:true}).click();
 await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn'),8000);await H.wait(400);
 const more=await H.page.getByRole('button',{name:'きろくと けいひんを みる',exact:true}).boundingBox();expect(more&&more.height>=44,'けっかに「きろくと けいひんを みる」が ない');
 await H.page.getByRole('button',{name:'きろくと けいひんを みる',exact:true}).click();
 await H.page.getByRole('tab',{name:'きろく',exact:true}).waitFor();await H.wait(300);
 const save=await H.dbg('saveData'),rec=save.shops.korokoro.recent,today=await H.eval(()=>KorokoroScore.day(U.today()));
 expect(rec.length===1&&rec[0].s===850&&rec[0].t===6&&save.shops.korokoro.tops[0].s===850&&!('t' in save.shops.korokoro.tops[0]),'さいきんの きろくが セーブに ない '+JSON.stringify(save.shops.korokoro));
 text=await book();
 const rows=await H.eval(()=>[...document.querySelectorAll('.modal-wrap .koro-recent .koro-rank-row')].map(e=>({t:e.textContent,img:!!e.querySelector('img.koro-ball')&&e.querySelector('img.koro-ball').naturalWidth>0})));
 expect(new RegExp(`ハイスコア850てん（${today}）`).test(text)&&/あそんだ かいすう1かい/.test(text)&&/1い850てん/.test(text)&&rows.length===1&&rows[0].img&&rows[0].t===`${today}わんこ850てん`,'きろくの まどの なかみ '+JSON.stringify({text,rows}));
 await fit('きろくの まどが はみ出す（あそんだ あと）');await H.shot('records');
 await H.page.getByRole('tab',{name:'けいひん',exact:true}).click();await H.wait(300);
 list=await prizes();
 expect(list.slice(0,3).every(p=>p.own&&p.t.includes('もってる！')&&p.t.includes(today))&&list[3].next&&/あと 350てん/.test(list[3].t)&&!list[4].own&&!list[4].next,'もらった けいひん '+JSON.stringify(list.map(p=>p.t)));
 await fit('けいひんの まどが はみ出す（あそんだ あと）');await H.shot('prizes');
 await H.page.getByRole('button',{name:'とじる',exact:true}).click();await H.wait(400);
 expect(await H.eval(()=>!!document.querySelector('.modal-wrap .koro-foot .btn')&&!document.querySelector('.koro-book')),'きろくを とじると けっかも きえる');
 // お店の モードえらびの「きろくと けいひん」→ みて から また えらべる
 await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),15000);
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
 await H.page.getByRole('button',{name:'きろくと けいひん',exact:true}).waitFor();
 const ask=await H.eval(()=>{const d=document.querySelector('.dlg-shade.ask .dialog').getBoundingClientRect(),c=[...document.querySelectorAll('.dlg-shade.ask .choices .btn')].map(b=>b.getBoundingClientRect());return {n:c.length,ok:d.top>=0&&d.bottom<=innerHeight&&c.every(r=>r.height>=44&&r.top>=0&&r.right<=innerWidth)};});
 expect(ask.n===4&&ask.ok,'モードえらびが はみ出す '+JSON.stringify(ask));await H.shot('mode');
 await H.page.getByRole('button',{name:'きろくと けいひん',exact:true}).click();
 await H.page.getByRole('tab',{name:'きろく',exact:true}).waitFor();await H.wait(200);text=await book();
 expect(/ハイスコア850てん/.test(text),'お店からの きろく '+text);
 await H.page.getByRole('button',{name:'とじる',exact:true}).click();
 await H.page.getByRole('button',{name:'スコア モード',exact:true}).waitFor();await H.wait(200);
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.until(()=>PokaDebug.idle()&&!document.querySelector('.dlg-shade'),8000);
 expect((await H.dbg('state')).scene==='store','モードえらびを やめると お店に もどらない');
},{viewport,timeout:200000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('korokoro-collab-'+viewport.width,async H=>{
 // ごわが × ころころ フルーツ の コラボ グッズ（UI-19。js/korokoro-collab.js・オーナーの FB 2026-09-30「5000〜15000てんの 景品を コロコロフルーツと ごわがの コラボグッズとして」・
 // 2026-10-01「積立になっているが、そうでなく、一度の達成ポイントにしてくれ」→ 1かいの スコアで 1000・1600・2000・2600・3000てん）:
 // まえから あそんで いる 人（ハイスコア 1700てん）→ スコア モード 600てん → まえの ハイスコアで とどいて いた Tシャツと ボールプール（600は たさない）→ きろくの まどの「コラボ」タブ → もういちど 3000てん → のこり 3しゅ →
 // お店の モードえらびに「コラボ 5/5」→ おうち: 3にんが Tシャツと いちご ぼうし・ボールプール／ベッド／ぬいぐるみを さわる・よるの ベッドは ねむる・「ねる」で ベッドの ふかふか
 await H.newGameFast();
 const old={koro_cherry_lamp:1,koro_strawberry_sofa:1,koro_mikan_table:1,koro_apple_shelf:1,koro_pear_cushion:1};
 let d=await H.dbg('saveData');Object.assign(d.shops.korokoro,{hi:1700,games:6,tops:[{s:1700,d:'2026-9-20'},{s:1500,d:'2026-9-21'},{s:1000,d:'2026-9-22'}],gifts:Object.fromEntries(Object.keys(old).map(id=>[id,'2026-9-20']))});
 Object.assign(d.furn,old);delete d.collab;await H.dbg('seedSave',d);
 const play=async(points,again=false)=>{
  if(again){await H.page.getByRole('button',{name:'もういちど',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning&&PokaDebug.koro()?.phase==='intro',15000);}
  else{await H.dbg('koroScore',{seed:5});await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning,15000);}
  await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);await H.wait(200);
  await H.dbg('koroSetup',{points});await H.page.getByRole('button',{name:'スコア モードを やめる',exact:true}).click();await H.page.getByRole('button',{name:'おわりに する',exact:true}).click();
  await H.until(()=>!!document.querySelector('.modal-wrap .koro-foot .btn')&&!!document.querySelector('.modal-wrap .collab-result'),8000);await H.wait(400);
  return H.eval(()=>{const b=document.querySelector('.modal-wrap .collab-result');b.scrollIntoView({block:'center'});const cs=[...b.querySelectorAll('.collab-card')],p=document.querySelector('.modal-wrap .panel').getBoundingClientRect(),f=[...document.querySelectorAll('.modal-wrap .koro-foot .btn')].map(x=>x.getBoundingClientRect());
   return {text:b.innerText,cards:cs.map(c=>c.dataset.collab),arts:cs.filter(c=>c.querySelector('.collab-art svg')).length,fit:p.left>=0&&p.right<=innerWidth&&f.every(r=>r.height>=44&&r.bottom<=innerHeight)&&cs.every(c=>{const r=c.getBoundingClientRect();return r.left>=p.left-0.5&&r.right<=p.right+0.5;})};});
 };
 // 1かいめ: 600てん（とどかない・たさない）→ まえの ハイスコア 1700てんで とどいて いた Tシャツ（1000）と ボールプール（1600）を もらう
 let res=await play(600);
 expect(res.cards.join()==='kc_tee,kc_pool'&&res.arts===2&&res.fit&&/こんかい 600 てん（1かいの さいこう 1,700 てん）/.test(res.text)&&/いちご ぼうし」は 1かいで 2,000 てん（あと 1,400 てん）/.test(res.text)&&!/つみたて/.test(res.text),'1かいめの けっか '+JSON.stringify(res));
 await H.shot('result-1');
 let saved=await H.dbg('persistedSave');
 expect(saved.collab.korokoro.best===1700&&saved.collab.korokoro.mode==='best'&&saved.collab.korokoro.got.kc_tee&&saved.collab.korokoro.got.kc_pool&&!saved.collab.korokoro.got.kc_cap&&saved.wardrobe.kc_tee===true&&saved.furn.kc_pool===1&&saved.shops.korokoro.tops[0].s===1700,'Tシャツと ボールプールが ほぞん されない '+JSON.stringify(saved.collab));
 // きろくと けいひんの まどの「コラボ」タブ: メーター・5しゅ（もって いるのは 1つ）・つぎの めやす・はみ出さない
 await H.page.getByRole('button',{name:'きろくと けいひんを みる',exact:true}).click();
 await H.page.getByRole('tab',{name:'コラボ',exact:true}).click();await H.wait(400);
 const tab=await H.eval(()=>{const w=[...document.querySelectorAll('.modal-wrap:not(.out)')].pop(),b=w.querySelector('.collab-box'),p=w.querySelector('.panel').getBoundingClientRect(),body=w.querySelector('.panel-body'),cs=[...b.querySelectorAll('.collab-card')],tabs=[...w.querySelectorAll('.koro-tabs .btn')].map(t=>t.getBoundingClientRect());
  return {text:b.innerText,cards:cs.map(c=>c.dataset.collab),own:b.querySelectorAll('.collab-card.own').length,arts:cs.filter(c=>c.querySelector('.collab-art svg')).length,tabs:tabs.length,tabH:tabs.every(r=>r.height>=44&&r.right<=p.right+0.5),
   inside:cs.every(c=>{const r=c.getBoundingClientRect();return r.left>=p.left-0.5&&r.right<=p.right+0.5;}),wide:body.scrollWidth>body.clientWidth+1,edge:p.left>=0&&p.right<=innerWidth&&p.bottom<=innerHeight+0.5};});
 expect(tab.cards.join()==='kc_tee,kc_pool,kc_cap,kc_bed,kc_plush'&&tab.own===2&&tab.arts===5&&tab.tabs===3&&tab.tabH&&tab.inside&&!tab.wide&&tab.edge&&/1かいの さいこう 1,700 てん/.test(tab.text)&&/いちご ぼうし」は 1かいで 2,000 てん/.test(tab.text)&&/1かいの スコアが めやすに とどくと/.test(tab.text)&&!/つみたて/.test(tab.text),'コラボの タブ '+JSON.stringify(tab));
 await H.shot('collab-tab');
 await H.page.getByRole('button',{name:'とじる',exact:true}).click();await H.wait(400);
 // 2かいめ: 1かいで 3000てん → のこり 3しゅ（いちご ぼうし 2000・ベッド 2600・ぬいぐるみ 3000）いっぺんに
 res=await play(3000,true);
 expect(res.cards.join()==='kc_cap,kc_bed,kc_plush'&&res.arts===3&&res.fit&&/こんかい 3,000 てん（1かいの さいこう 3,000 てん）/.test(res.text)&&/ぜんぶ そろったよ/.test(res.text),'2かいめの けっか '+JSON.stringify(res));
 await H.shot('result-2');
 saved=await H.dbg('persistedSave');
 expect(saved.collab.korokoro.best===3000&&['kc_pool','kc_bed','kc_plush'].every(id=>saved.furn[id]===1)&&saved.wardrobe.kc_cap===true&&!saved.collab.puzzle,'のこりの コラボ グッズ '+JSON.stringify(saved.collab));
 // お店の モードえらび: 「コラボ 5/5」（はみ出さない）
 await H.page.getByRole('button',{name:'てんないに もどる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle(),15000);
 await H.page.getByRole('button',{name:'てんいんと はなす',exact:true}).click();await H.page.getByRole('button',{name:'おてつだいする',exact:true}).click();
 await H.page.getByRole('button',{name:'きろくと けいひん',exact:true}).waitFor();
 const ask=await H.eval(()=>{const d=document.querySelector('.dlg-shade.ask .dialog').getBoundingClientRect(),c=[...document.querySelectorAll('.dlg-shade.ask .choices .btn')].map(b=>b.getBoundingClientRect());return {text:document.querySelector('.dlg-shade.ask .dlg-text').textContent,ok:d.top>=0&&d.bottom<=innerHeight&&c.every(r=>r.height>=44&&r.top>=0&&r.right<=innerWidth)};});
 expect(/とくべつな かぐ 6\/6・コラボ 5\/5/.test(ask.text)&&ask.ok,'モードえらびの コラボ '+JSON.stringify(ask));
 await H.page.getByRole('button',{name:'やめる',exact:true}).click();await H.until(()=>PokaDebug.idle()&&!document.querySelector('.dlg-shade'),8000);
 // おうち（ひる 14じ）: 3にんが Tシャツと いちご ぼうし。ボールプール・ベッド・ぬいぐるみを おいて さわる
 await H.dbg('hour',14);
 // 服は 1こで ひとり（UI-31）なので 3人が きる ぶん 3こに して から
 d=await H.dbg('saveData');d.wardrobe.kc_tee=3;d.wardrobe.kc_cap=3;for(const id of ['wanko','gachan','goji'])d.chars[id].outfit={...d.chars[id].outfit,body:'kc_tee',head:'kc_cap'};await H.dbg('seedSave',d);
 await H.dbg('house');await H.until(()=>PokaDebug.state().scene==='house'&&!PokaDebug.state().transitioning,15000);await H.idle(20000);
 await H.dbg('homeLayout',[{id:'kc_bed',x:150,y:262},{id:'kc_pool',x:420,y:300},{id:'kc_plush',x:70,y:540}]);
 await H.dbg('homeBubbleFixture');await H.wait(900);await H.shot('room');
 const touch=async(id,ok,msg)=>{
  await H.dbg('homeBubbleFixture');await H.wait(120);
  const a=await H.dbg('furnLive',id);expect(a&&a.tap,`${id}: タップできる 点が ない`);
  await H.tap(a.tap.x,a.tap.y);await H.wait(320);
  const b=await H.dbg('furnLive',id);expect(ok(a,b),`${msg} ${JSON.stringify([a,b])}`);expect(b.talk>a.talk,`${id}: 3人が なにも いわない`);
  return b;
 };
 await touch('kc_pool',(a,b)=>b.t<1&&b.live,'ボールプールが はねない');await H.wait(200);await H.shot('pool-tap');
 await touch('kc_bed',(a,b)=>a.on===false&&b.on===true&&b.live,'ひるの ベッドが タップで おひるね しない');
 await touch('kc_plush',(a,b)=>b.t<1&&b.live,'ぬいぐるみが ゆれない');await H.wait(200);await H.shot('room-tapped');
 // よる 21じ: ベッドの まくらの 3人は ねむって いる
 await H.dbg('hour',21);await H.wait(4300);
 const night=await H.dbg('furnLive','kc_bed');expect(night.on===true,'よるの ベッドが ねむらない '+JSON.stringify(night));
 // 「ねる」: ころころ はこの ベッドで ふかふか（ごきげん +12）
 await H.dbg('homeBubbleFixture');await H.page.getByRole('button',{name:'ねる',exact:true}).click();
 // ことばは 1もじずつ でるので、さいごの「）」まで でるのを まつ
 await H.until(()=>/ぐっすり[\s\S]*）/.test(document.querySelector('.dlg-text')?.textContent||''),15000);
 const slept=await H.eval(()=>document.querySelector('.dlg-text').textContent);
 expect(/ころころ はこの ベッドで ふかふか/.test(slept)&&/ごきげん \+12/.test(slept),'ベッドで ねても ふかふかに ならない '+slept);
 await H.shot('sleep');
 await H.dialogs();
 expect(await H.eval(()=>document.documentElement.scrollWidth<=innerWidth),'よこに はみ出す');
},{viewport,timeout:240000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('korokoro-faces-'+viewport.width,async H=>{
 // 玉と うえの 3人の 表情（korokoro-art.js・mg-korokoro.js・オーナーの FB 2026-09-30「ごじ・わんこ・がちゃの 表情を 増やせ。瞬きも 追加せよ」）:
 // しずかな 玉と うえの 3人は ときどき まばたき・たかい ところから おちた 玉は くらくら・がったいの あとは にっこり → ウインク
 await H.newGameFast();
 await H.dbg('koroScore',{seed:11});await H.until(()=>PokaDebug.state().scene==='koroscore'&&!PokaDebug.state().transitioning,15000);
 await H.dialogs();await H.until(()=>PokaDebug.koro()?.phase==='play',15000);await H.wait(200);
 const watch=async(ms,pick)=>{const seen=new Set(),t0=Date.now();while(Date.now()-t0<ms){const k=await H.dbg('koro');for(const v of pick(k))seen.add(v);await H.wait(30);}return seen;};
 // ごじ・わんこ・がちゃんの 玉を ゆかに ならべる → まばたき（ふだんは ふつうの かお）
 await H.dbg('koroSetup',{bodies:[[7,26,100],[6,70,106],[5,90,110]]});await H.wait(1200);
 const calm=await watch(6000,k=>k.bodies.map(b=>b.tier+':'+b.emo));
 expect([5,6,7].every(t=>calm.has(t+':blink')&&calm.has(t+':normal')),'3人の 玉が まばたき しない '+[...calm]);
 const team=await watch(4500,k=>k.team.map(m=>m.id+':'+m.face));
 expect(['wanko','gachan'].every(id=>team.has(id+':blink')&&team.has(id+':normal')),'うえの 3人が まばたき しない '+[...team]);
 await H.shot('calm');
 // たかい ところから おちると くらくら
 await H.dbg('koroSetup',{bodies:[[3,50,-12]]});
 const fall=await watch(1600,k=>k.bodies.map(b=>b.emo));
 expect(fall.has('dizzy'),'おちた あとに くらくら しない '+[...fall]);
 // さくらんぼ 2つで いちご → にっこり → ウインク
 await H.dbg('koroSetup',{bodies:[[0,45,121],[0,54.2,121]]});
 const merged=await watch(1800,k=>k.bodies.filter(b=>b.tier===1).map(b=>b.emo));
 expect(merged.has('happy')&&merged.has('wink'),'がったいの あとの かお '+[...merged]);
 // いろいろな かおを いちどに（ならびは 物理で かわるので かおは すこしずつ ちがう）
 await H.dbg('koroSetup',{bodies:[[7,25,100],[0,72,121],[6,72,100],[3,50,40],[4,88,112],[4,62,112]]});await H.wait(700);await H.shot('faces');
 const k=await H.dbg('koro');expect(k.bodies.every(b=>typeof b.emo==='string'&&b.emo.length>0),'かおの ない 玉が ある');
},{viewport,timeout:120000});

await (await import("./item-dex-smoke.mjs")).itemDexSmoke({scenario,expect});

await (await import("./nerikasu-town-smoke.mjs")).nerikasuTownSmoke({scenario,expect});

await (await import("./nerikasu-shops-smoke.mjs")).nerikasuShopsSmoke({scenario,expect});
await (await import("./nerikasu-work-smoke.mjs")).nerikasuWorkSmoke({scenario,expect});
await (await import("./nerikasu-quests-smoke.mjs")).nerikasuQuestsSmoke({scenario,expect,folkTalk,folkTapSpot});
await (await import("./farm-smoke.mjs")).farmSmoke({scenario,expect});

await (await import("./world-zoom-smoke.mjs")).worldZoomSmoke({scenario,expect});

await (await import("./home-doors-smoke.mjs")).homeDoorsSmoke({scenario,expect});

await (await import("./home-2f-smoke.mjs")).home2fSmoke({scenario,expect});

await (await import("./npc-life-smoke.mjs")).npcLifeSmoke({scenario,expect});

await (await import("./indoor-walk-smoke.mjs")).indoorWalkSmoke({scenario,expect});

await (await import("./room-presets-smoke.mjs")).roomPresetsSmoke({scenario,expect});

await (await import("./parent-wardrobe-smoke.mjs")).parentWardrobeSmoke({scenario,expect});
// 服は 1こで ひとり（UI-31）: かう・きがえ・わたす・おそろい・ぱぱ・さいかい・5こ まで
await (await import("./wear-stock-smoke.mjs")).wearStockSmoke({scenario,expect});
// すいぞくかん・はくぶつかんの きふの ごほうび（UI-33）: みだし・カード・はくぶつかんで 4つ・もちもの・おうち
await (await import("./museum-wear-smoke.mjs")).museumWearSmoke({scenario,expect});
await (await import("./burger-menu-smoke.mjs")).burgerMenuSmoke({scenario,expect});
await (await import("./food-balance-smoke.mjs")).foodBalanceSmoke({scenario,expect});

await (await import("./home-garden-smoke.mjs")).homeGardenSmoke({scenario,expect});

server.close();
if(LIST)process.exit(0);
if (!results.length) { console.error("検証対象がありません。--only の名前を確認してください。"); process.exit(1); }
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length ? "✗" : "✓"} ${results.length - bad.length}/${results.length} シナリオ成功${SHOTS ? `（スクリーンショット: tests/screenshots/）` : ""}`);
process.exit(bad.length ? 1 : 0);
