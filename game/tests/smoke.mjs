// ブラウザで実際に遊んで確かめる自動テスト（Playwright + Chromium）。
//   npm test              … 静的チェック + ふだんのスモークテスト（約1〜2分）
//   npm run test:full     … 4つのお店・ボス・小さい画面・夜 もふくむ（約4〜6分）、スクリーンショットも保存
// オプション: --full（全部） --shots（tests/screenshots/ に画像を保存） --headed（画面を表示） --only=名前の一部
// Chromium の場所を指定したいときは 環境変数 CHROMIUM_PATH。
// ゲーム内部の変数にはなるべく触らず、js/debug.js の PokaDebug と 実際のタップ操作で進める。
import { chromium } from "playwright";
import { mkdirSync, readdirSync, rmSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
// おうちの 吹き出し（PokaDebug.family()）: 2つまで・画面の 中・重ならない・しっぽの 先が 話し手の 頭から 30px いない・話し手の 顔に かからない
function expectBubbles(f) {
  expect(f.bubbles.length <= 2, `吹き出しが 3つ いじょう 出て いる（${f.bubbles.length}）`);
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (const b of f.bubbles) {
    expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= f.width && b.y + b.h <= f.height, "吹き出しが画面からはみ出す");
    expect(b.head && Math.hypot(b.anchor.x - b.head.x, b.anchor.y - b.head.y) <= 30, `${b.id} の しっぽの 先が 頭から はなれて いる`);
    for (const o of f.bubbles) { const r = o.head.r; expect(!hit(b, { x: o.head.x - r * 0.9, y: o.head.y + 2, w: r * 1.8, h: r * 1.5 }), `${b.id} の 吹き出しが ${o.id} の 顔に かかる`); }
  }
  for (let i = 0; i < f.bubbles.length; i++) for (let j = i + 1; j < f.bubbles.length; j++) expect(!hit(f.bubbles[i], f.bubbles[j]), "吹き出しが重なる");
}

async function scenario(name, fn, { viewport = { width: 390, height: 844 }, timeout = 90000, full = false } = {}) {
  if (full && !FULL) return;
  if (ONLY && !name.includes(ONLY)) return;
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "ja-JP" });
  // ゲームの検証は外部フォントの応答に依存させない（CIのload待ちを安定させる）。
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());
  const page = await context.newPage();
  // SVGの初期描画や負荷のある実行環境でも、操作の待機を早く打ち切らない。
  page.setDefaultTimeout(15000);
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
    expect(!problems.length, "ブラウザでエラー: " + [...new Set(problems)].join(" | "));
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name}（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
    console.log(e.stack);if(problems.length)console.log([...new Set(problems)]);
    console.log(await H.dbg("state").catch(()=>null));
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
      await H.until(scene => PokaDebug.state().scene === scene && PokaDebug.idle(), 10000, fromStore ? "store" : "world");
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
  for(const k of ['bag','wardrobe','furn','rooms'])expect(JSON.stringify(before[k])===JSON.stringify(after[k]),'ケーキ屋で既存の所持品が変わる');
},{viewport,full:viewport.width===375,timeout:150000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('groom-shop-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const before=await H.dbg('saveData');
  const layout=await H.dbg('townLayout','city'),door=layout.doors.find(d=>d.act.shop==='groom');expect(door,'びようしつの入口がない');
  await H.dbg('teleport','city',door.x,door.y+1);await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle());
  expect((await H.dbg('storeState')).party.length===3,'3人で入れない');await H.shot('interior');await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle());
  const ranks=await H.playShop('groom',3);expect(ranks.length===6&&ranks.every(r=>r===3),'正しいカットで◎にならない: '+JSON.stringify(H.shopGrades));
  const after=await H.dbg('saveData');expect(after.coins>before.coins&&after.shops.groom.plays===1,'美容室の報酬・記録が残らない');for(const k of ['bag','wardrobe','furn','rooms'])expect(JSON.stringify(before[k])===JSON.stringify(after[k]),'美容室で所持品が変わる');
},{viewport,full:viewport.width===375,timeout:180000});
for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario('burger-shop-'+viewport.width,async H=>{
  await H.newGameFast();await H.dbg('coins',987504);const before=await H.dbg('saveData');
  const layout=await H.dbg('townLayout','city'),door=layout.doors.find(d=>d.act.shop==='burger');expect(door,'バーガーやさんの入口がない');
  await H.dbg('teleport','city',door.x,door.y+1);await H.idle();await H.shot('exterior');await H.dbg('walkTo',door.x,door.y);await H.until(()=>PokaDebug.state().scene==='store'&&PokaDebug.idle());
  expect((await H.dbg('storeState')).party.length===3,'3人で入れない');await H.shot('interior');await H.page.getByRole('button',{name:'おみせを でる',exact:true}).click();await H.until(()=>PokaDebug.state().scene==='world'&&PokaDebug.idle());
  const ranks=await H.playShop('burger',3);expect(ranks.length===6&&ranks.every(r=>r===3),'正しい順番で◎にならない: '+JSON.stringify(H.shopGrades));
  const after=await H.dbg('saveData');expect(after.coins>before.coins&&after.shops.burger.plays===1,'バーガー屋の報酬・記録が残らない');for(const k of ['bag','wardrobe','furn','rooms'])expect(JSON.stringify(before[k])===JSON.stringify(after[k]),'バーガー屋で所持品が変わる');
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
  const tapVersion=async n=>{await H.page.getByRole("button",{name:/ぽかぽかタウン ver/}).click({clickCount:n,delay:50});};
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
  await H.page.getByRole("button",{name:"ようす",exact:true}).click();await H.page.getByRole("button",{name:"せってい",exact:true}).click();
  expect(await entry.count()===0,"タブ切替で解除状態が残る");await tapVersion(7);
  await H.page.locator(".modal-wrap:not(.out) .close").click();await H.wait(220);await openSettings();expect(await entry.count()===0,"メニューを閉じてもコマンドが隠れない");
  await H.page.reload();await H.page.getByRole("button",{name:"つづきから",exact:true}).click();await H.idle();await openSettings();
  expect(await entry.count()===0&&(await H.dbg("state")).coins===99999&&preserved(await H.dbg("saveData"))===preserved(before),"再開で解除状態/所持金/既存データが不正");
},{viewport,full:viewport.width===375,timeout:120000});

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
  await H.dbg("teleport", "town", 46, 11);
  await H.until(() => PokaDebug.idle()); await H.dbg("walkTo", 47, 11);
  await H.until(() => PokaDebug.state().map === "city" && PokaDebug.idle());
  await H.shot("city");
  await H.page.getByRole("button", { name: "メニュー", exact: true }).click();
  await H.page.getByRole("button", { name: "ちず", exact: true }).click();
  expect(await H.page.getByRole("group", { name: "ぽかぽかの せかいの ちず", exact:true }).isVisible(), "全体マップがない");
  expect(await H.page.locator('.atlas-marker.is-current').getAttribute('data-area') === "city", "入ったエリアが地図の現在地に反映されない");
  await H.shot("atlas"); await H.page.locator(".modal-wrap .close").last().click(); await H.wait(300);
  await H.dbg("teleport", "city", 46, 24); await H.until(() => PokaDebug.idle());
  await H.dbg("walkTo", 47, 24); await H.until(() => PokaDebug.state().map === "coast" && PokaDebug.idle());
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
  await H.dbg("shop","crepe",1); await H.dialogs();
  await H.until(() => PokaDebug.mg()?.phase === "work");
  await H.page.getByRole("button", { name:"おうちへ",exact:true }).click();
  await H.until(() => PokaDebug.state().scene === "house" && PokaDebug.idle());
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
  await area.fill('{"game":"other","format":1,"data":{}}');await review.click();await H.until(()=>document.querySelector('.save-backup [role=alert]')?.textContent.includes('ぽかぽかタウン'));expect((await H.dbg('state')).coins===150,'不正な読み込みで現在のデータが変わる');await H.shot('invalid');
  await area.fill(text);await review.click();await H.choose(1);expect((await H.dbg('state')).coins===150,'キャンセルで上書きされた');
  await H.page.getByLabel('セーブの ファイル',{exact:true}).setInputFiles({name:'backup.txt',mimeType:'text/plain',buffer:Buffer.from(text)});await H.until(()=>document.querySelector('.save-backup-text').value.includes('987654'));await review.click();await H.shot('confirm');await H.choose(0);
  await H.until(()=>window.PokaDebug?.state().scene==='title'&&PokaDebug.idle(),20000);await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle();const restored=await H.dbg('saveData');
  for(const k of ['coins','wardrobe','room','rooms','bag','furn','order'])expect(JSON.stringify(restored[k])===JSON.stringify(fixture[k]),'復元後の値が違う: '+k);
  expect(restored.chars.wanko.lv===20&&restored.chars.gachan.lv===20&&restored.chars.goji.lv===20,'レベルが戻らない');await H.shot('restored');
  if(viewport.width===390){const ctx=await browser.newContext({viewport,locale:'ja-JP'});try{await ctx.route(new RegExp("^https://fonts[.]"),r=>r.abort());const other=await ctx.newPage();await other.goto(url);await other.waitForFunction(()=>window.PokaDebug&&PokaDebug.idle());const imported=await other.evaluate(text=>PokaDebug.backupDecode(text),text);expect(imported.coins===987654&&JSON.stringify(imported.room)===JSON.stringify(fixture.room),'別ブラウザで文字列を読めない');}finally{await ctx.close();}}
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
  await H.page.getByRole('button',{name:'メニュー',exact:true}).click();await H.page.getByRole('button',{name:'おうちへ',exact:true}).click();await H.choose(0);await H.idle();await H.shot('house');
  await H.dbg('feed','goji','apple');await H.dbg('save');await H.page.reload();await H.page.getByRole('button',{name:'つづきから',exact:true}).click();await H.idle(30000);
  const again=await H.dbg('saveData');expect(again.coins===987654&&again.bag.apple===old.bag.apple-1&&again.wardrobe.crown,'ver2で遊んだあと保存できない');
},{viewport,full:viewport.width===375,timeout:90000});

await scenario("セーブ→つづきから", async (H) => {
  await H.newGameFast();
  await H.dbg("teleport", "town", 12, 24, "left");
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
  expect(st.map === "town" && st.pos[0] === 12 && st.pos[1] === 24, "つづきから の位置がちがう " + JSON.stringify(st));
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
    const door=(await H.dbg("townLayout",map)).doors.find(d=>d.act.stop===stop);x=door.x;y=door.y+1;
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
  for(const [map,x,y] of [["heiwadai",31,14],["heiwadai",9,50],["town",12,16],["city",21,22],["harbor",19,23],["airport",25,20],["meadow",10,10],["forest",14,14],["cave",12,12]]){
    await H.dbg("teleport",map,x,y);await H.until(m=>PokaDebug.state().map===m&&PokaDebug.idle(),15000,map);
    await H.shot(`${map}-${x}`);
  }
  await H.dbg("teleport","heiwadai",9,50);await H.until(()=>PokaDebug.state().map==="heiwadai"&&PokaDebug.idle());
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
    // 記念品の検証は安全な町で行う。草原で敵が近づくまでの時間に依存させない。
    await H.dbg("teleport","town",12,16);await H.idle();
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
  await H.dbg("teleport","heiwadai",9,50); await H.idle();
  await H.page.keyboard.press("Escape"); await H.page.getByRole("button",{name:"ちず",exact:true}).click();
  expect(await H.page.locator(".atlas-marker.is-current").getAttribute("data-area")==="heiwadai","再度開いた地図の現在地が古い");
},{viewport,full:viewport.width===375,timeout:90000});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`吹き出しの 形と 場所（${viewport.width}）`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);
  // 形 6しゅ（ふつう・さけぶ・なく・こころの こえ・ひそひそ・めずらしい）を 2つずつ、ふつう と みまもり で
  const pairs=[[["wanko","わうーん！ おさんぽ いきたい！","shout"],["gachan","ままー たすけてー","cry"]],[["goji","おっきく なりたいな …ガゥ","think"],["wanko","ないしょの はなし だよ","whisper"]],[["gachan","きょうは いい ひ だね","say"],["goji","ゆめで おほしさまを つかまえた！","rare"]]];
  for(const watch of [false,true]){
    if(watch)await H.houseButton("みまもる");
    for(const [i,pair] of pairs.entries()){
      await H.dbg("pause",false);for(const [id,text,kind] of pair)await H.dbg("homeSay",id,text,kind);
      await H.wait(400);await H.dbg("pause",true);
      const f=await H.dbg("family");
      expect(f.bubbles.length===2,`2つの 吹き出しが 出ない（${f.bubbles.map(b=>b.id).join(",")}）`);
      expect(pair.every(([id,,kind])=>f.bubbles.some(b=>b.id===id&&(kind==="rare"?b.rare:b.kind===kind&&!b.rare))),"吹き出しの 形が ちがう");
      expectBubbles(f);
      await H.shot(`${watch?"watch":"normal"}-${i+1}`);
    }
    await H.dbg("pause",false);
  }
  const log=await H.dbg("homeTalkLog");expect(pairs.flat().every(([id,text])=>log.some(x=>x.id===id&&x.text===text)),"しゃべった ものが のこらない");
},{viewport});

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
  // かけあいは 2つまで 同時・1つずつ 順番に 出る。6びょう いないに 3人とも しゃべる
  await H.houseButton("みまもる");const since=(await H.dbg("homeTalkLog")).reduce((m,x)=>Math.max(m,x.n),0);await H.dbg("homeLife","chat");
  const spoke=new Set(),t0=Date.now();
  while(Date.now()-t0<6000&&spoke.size<3){expectBubbles(await H.dbg("family"));for(const x of await H.dbg("homeTalkLog"))if(x.n>since&&["wanko","gachan","goji"].includes(x.id))spoke.add(x.id);await H.wait(150);}
  expect(spoke.size===3,"3人の かけあいが 6びょうで そろわない");
  await H.dbg("pause",true);const f=await H.dbg("family");expect(f.bubbles.length>=1,"かけあいの 吹き出しが ない");expectBubbles(f);
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
  await H.page.getByRole("button",{name:"おへやを おおきく",exact:true}).click();expect((await H.dbg("homeDesign")).zoom===1.25,"拡張後に拡大できない");
  await H.page.getByRole("button",{name:"おへやを ぜんたいに",exact:true}).click();
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
  await H.page.context().setOffline(true);
  await H.page.goto(pathToFileURL(resolve(HERE,"../index.html")).href);
  await H.until(()=>window.PokaDebug&&PokaDebug.state().scene==="title");
  const image=await H.dbg("roadPreview",def,{width:375,height:667,cx:43,cy:45});
  expect(image.url.startsWith("data:image/png;")&&image.grid[21][43]==="island","file:// で道路が描けない");
},{full:true});

for(const viewport of [{width:390,height:844},{width:375,height:667}])await scenario(`town-renewal-${viewport.width}`,async H=>{
  await H.newGameFast();await H.dbg("hour",12);await H.dbg("weather","clear");
  const fixture=await H.dbg("saveData");fixture.coins=987654;fixture.bag.cake=7;fixture.wardrobe.crown=true;fixture.furn.trophy=2;fixture.flags.chests.port_boardwalk=true;fixture.shops.crepe.lv=3;
  for(const [id,x,y]of [["town",4,6],["city",17,17],["harbor",4,21],["airport",20,10]]){
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
    const map=["link","relay"].includes(id)?"city":"town";
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

await browser.close();
server.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${bad.length ? "✗" : "✓"} ${results.length - bad.length}/${results.length} シナリオ成功${SHOTS ? `（スクリーンショット: tests/screenshots/）` : ""}`);
process.exit(bad.length ? 1 : 0);
