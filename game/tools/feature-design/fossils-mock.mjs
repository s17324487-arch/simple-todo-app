// ④ 化石の 見本画像: ゲームを 実際に 動かし、どうくつに「ひびの ある いわ」・ほる 画面・みつけた カード・かせき ノートを 出して 撮る。
// あわせて 恐竜 10種の 骨格（dino-sheet.png）と 骨 63こ（bone-sheet-1〜2.png）の 絵を 作る。
import { readFileSync } from "node:fs";
import { launch, TMP } from "../town-design/paths.mjs";
const OUT = new URL("../../docs/design/features/fossils/", import.meta.url).pathname, IMG = OUT + "img/";
const GAME = new URL("../../index.html", import.meta.url).href;
const ART = readFileSync(new URL("./fossil-art-ref.js", import.meta.url), "utf8"), REF = readFileSync(new URL("./fossils-ref.js", import.meta.url), "utf8");
const CSS = readFileSync(new URL("./fossil-ui.css", import.meta.url), "utf8");
const DATA = JSON.parse(readFileSync(OUT + "fossils.json", "utf8"));
const browser = await launch();

async function open(vp, world) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME);
  await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => PokaDebug.newGame());
  await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  if (world) {
    await page.waitForTimeout(500);
    await page.evaluate(({ map, x, y }) => { Save.d.flags.intro = true; Save.d.flags["visit_" + map] = true; PokaDebug.hour(11); PokaDebug.teleport(map, x, y, "down"); }, world);
    await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
    await page.waitForTimeout(1200);
  }
  await page.evaluate(({ art, ref, data }) => {
    eval(art + ";" + ref + ";window.__FA=FossilArtRef;window.__FR=FossilRef;"); window.__D = data;
    window.__H = {
      dino: (id) => __D.dinos.find((d) => d.id === id),
      img: (svg, w) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", `<svg width="${w}" height="${Math.round(w * 0.62)}" `)); }),
      digPanel(dinoId, partId, taps, done, stars) {
        const d = __H.dino(dinoId), p = d.art.parts.find((x) => x.id === partId);
        const body = U.el("div"), wrap = U.el("div", { class: "dig-wrap" }), cv = document.createElement("canvas"); wrap.append(cv); body.append(wrap);
        body.append(U.el("div", { class: "dig-info", html: done ? `<span>${d.name}の ${p.name}！</span><span class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>` : `<span>いわを タップして こつこつ ほろう</span><span class="taps">たたいた かず ${taps}</span>` }));
        const m = UI.modal({ title: "⛏️ かせきを ほる", body });
        requestAnimationFrame(async () => {
          const r = wrap.getBoundingClientRect(), px = 2; cv.width = r.width * px; cv.height = r.height * px; const ctx = cv.getContext("2d"); ctx.scale(px, px);
          const dig = new __FR.Dig(d, { rand: __FR.rng("mock" + dinoId + partId) }); dig.area = { x: 1, y: 1, w: 5, h: 3 };
          const order = [[3, 2], [2, 2], [4, 2], [1, 1], [5, 1], [2, 1], [4, 3], [3, 1], [1, 3], [5, 3], [2, 3], [4, 1], [3, 3], [1, 2], [5, 2]];
          for (let i = 0; i < taps && i < order.length; i++) dig.tap(order[i][0], order[i][1]);
          if (done) for (let i = 0; i < dig.hp.length; i++) { const [x, y] = dig.cellOf(i); if (dig.isBone(x, y)) dig.hp[i] = 0; }
          dig.done = !!done;
          const im = await __H.img(__FA.partSvg(d, partId), 400);
          __FR.drawDig(ctx, r.width, r.height, dig, im, 0.4);
        });
        return m;
      },
      found(dinoId, partId, have) {
        const d = __H.dino(dinoId), p = d.art.parts.find((x) => x.id === partId), pr = __FR.progress(d, Object.fromEntries(have.map((h) => [dinoId + "." + h, 1])));
        const body = U.el("div", { class: "bone-card" });
        body.innerHTML = `<div class="art">${__FA.partSvg(d, partId)}</div><div class="nm">${d.name}の ${p.name}</div><div class="dn">${d.era}・${d.where}</div><div class="prog"><span>${d.name}</span><div class="bar"><i style="width:${Math.round((pr.n / pr.total) * 100)}%"></i></div><span>${pr.n}/${pr.total}</span></div>${__FA.svg(d, { have }).replace("<svg ", '<svg class="mini" ')}<div class="muted">そろったら はくぶつかんに もって いこう！</div>`;
        return UI.modal({ title: "ほねを みつけた！", body });
      },
      note(have) {
        const body = U.el("div"), grid = U.el("div", { class: "fossil-note" });
        const total = __D.dinos.reduce((a, d) => a + d.art.parts.length, 0), got = Object.values(have).reduce((a, x) => a + x.length, 0);
        body.append(U.el("div", { class: "muted", text: `あつめた ほね ${got} / ${total}。そろった きょうりゅうは はくぶつかんで くみたてられるよ。` }));
        for (const d of __D.dinos) { const h = have[d.id] || [], done = h.length === d.art.parts.length; const c = U.el("div", { class: "fossil-cell" + (done ? " done" : "") }); c.innerHTML = `${__FA.svg(d, { have: h })}<div class="nm">${h.length ? d.name : "？？？"}</div><div class="cnt">${done ? "そろった！" : `ほね ${h.length}/${d.art.parts.length}`}</div>`; grid.append(c); }
        body.append(grid);
        return UI.modal({ title: "🦴 かせき ノート", body, cls: "full" });
      },
      // どうくつに いわを おいて「ほる」ボタン
      async world(rocks) {
        PokaDebug.pause(true);
        const s = G.scene, cv = G.canvas, r = cv.getBoundingClientRect(), ov = document.createElement("canvas"); ov.width = cv.width; ov.height = cv.height;
        Object.assign(ov.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", pointerEvents: "none", zIndex: 5 });
        document.body.append(ov); const ctx = ov.getContext("2d"); ctx.scale(cv.width / G.W, cv.height / G.H);
        const ox = G.W / 2 - s.cam.x, oy = G.H / 2 - s.cam.y, im = await __H.img(__FR.rockSvg(), 64);
        for (const [x, y] of rocks) ctx.drawImage(im, ox + x * TS, oy + (y + 1) * TS - 32, 32, 32);
        const b = UI.btn(`${__FR.pickSvg()}<span>ほる</span>`, () => {}, "act-btn"); UI.root.append(b);
      },
    };
  }, { art: ART, ref: REF, data: DATA });
  return page;
}
const shot = async (page, name) => { await page.waitForTimeout(600); const p = `${TMP}fossil-${name}.png`; await page.screenshot({ path: p }); await page.close(); return p; };
const shots = {};
// どうくつで いわが 見える 場所（ゲームの マップで 歩ける マスの となりの かべ）を さがして おく
{
  const page = await open([390, 844], { map: "cave", x: 12, y: 8 });
  const rocks = await page.evaluate(() => { const m = G.scene.map, px = Save.d.world.x, py = Save.d.world.y, out = []; for (let y = py - 5; y <= py + 6; y++) for (let x = px - 5; x <= px + 5; x++) { if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1) continue; if (!m.isSolid(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.isSolid(x + dx, y + dy)) && Math.abs(x - px) + Math.abs(y - py) > 2) out.push([x, y]); } return __FR.rocks("cave", 3, "2026-9-27", out); });
  await page.evaluate((rocks) => __H.world(rocks), rocks);
  shots.a = await shot(page, "a");
}
{ const page = await open([390, 844]); await page.evaluate(() => __H.digPanel("trex", "skull", 6, false)); shots.b = await shot(page, "b"); }
{ const page = await open([390, 844]); await page.evaluate(() => __H.digPanel("trex", "skull", 9, true, 2)); shots.c = await shot(page, "c"); }
{ const page = await open([390, 844]); await page.evaluate(() => __H.found("trex", "skull", ["skull", "neck", "leg"])); shots.d = await shot(page, "d"); }
const HAVE = { trex: ["skull", "neck", "leg"], tricera: ["skull", "neck", "chest", "arm", "hip", "leg", "tail"], stego: ["plates", "tail"], raptor: ["skull", "leg"], compso: ["head", "body"], ankylo: ["club"] };
{ const page = await open([390, 844]); await page.evaluate((h) => __H.note(h), HAVE); shots.e = await shot(page, "e"); }
{ const page = await open([375, 667]); await page.evaluate(() => __H.digPanel("stego", "plates", 7, false)); shots.f = await shot(page, "f"); }
{ const page = await open([375, 667]); await page.evaluate(() => __H.found("stego", "plates", ["plates", "tail"])); shots.g = await shot(page, "g"); }
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const CAP = { a: "① どうくつの「ひびの ある いわ」と ほる ボタン", b: "② こつこつ たたく（となりの マスも けずれる）", c: "③ ほりだせた！（たたいた かずで ★）", d: "④ みつけた ほね（あつまりぐあい）", e: "⑤ かせき ノート（10しゅ）" };
const pg = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await pg.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.w{padding:20px 24px}.h{font-size:26px;font-weight:800}.s{font-size:14px;margin:4px 0 14px;max-width:1300px}.g{display:grid;grid-template-columns:repeat(5,auto);gap:16px;justify-content:start}.t{font-weight:800;font-size:13px;margin-bottom:5px;max-width:250px}img{border-radius:12px;border:4px solid #3C352E;display:block}</style><body><div class="w"><div class="h">化石ほり: 画面の 見本（390×844・ゲームの 上に 重ねて 撮影）</div><div class="s">ピッケルを もって「ひびの ある いわ」の となりで「ほる」。いわを タップして こつこつ けずると 骨が 出てくる（しっぱいは ない）。骨は 恐竜ごとに 2〜10こ。ぜんぶ そろうと ⑤ 恐竜博物館で くみたてられる。</div><div class="g">${["a", "b", "c", "d", "e"].map((k) => `<div><div class="t">${CAP[k]}</div><img src="${b64(shots[k])}" style="width:250px"></div>`).join("")}</div></div></body>`);
await pg.waitForTimeout(400); await pg.screenshot({ path: IMG + "dig-flow.png", fullPage: true }); await pg.close();
const pg2 = await browser.newPage({ viewport: { width: 700, height: 700 } });
await pg2.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.w{padding:20px 24px}.h{font-size:22px;font-weight:800;margin-bottom:10px}.r{display:flex;gap:20px}.t{font-weight:800;font-size:13px;margin-bottom:5px}img{border-radius:12px;border:4px solid #3C352E;display:block}</style><body><div class="w"><div class="h">小さい スマホ（375×667）</div><div class="r"><div><div class="t">ほる</div><img src="${b64(shots.f)}" style="width:300px"></div><div><div class="t">みつけた ほね</div><img src="${b64(shots.g)}" style="width:300px"></div></div></div></body>`);
await pg2.waitForTimeout(400); await pg2.screenshot({ path: IMG + "small-phone.png", fullPage: true }); await pg2.close();

// 骨格 10しゅ と 骨 63こ の 一覧
const sheet = async (file, html, w = 1400) => { const p = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1.5 }); await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#EFE6D6;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E">${html}</body>`); await p.waitForTimeout(500); await p.screenshot({ path: IMG + file, fullPage: true }); await p.close(); };
await sheet("dino-sheet.png", `<div style="padding:16px 20px"><div style="font-size:22px;font-weight:800">恐竜 10しゅの 骨格（fossil-art-ref.js・左むき・展示の 台つき）</div><div id="w" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px"></div></div><script>${ART}
const D=${JSON.stringify(DATA.dinos)};for(const d of D){const e=document.createElement("div");e.style.cssText="background:#FFF9EC;border:3px solid #3C352E;border-radius:14px;padding:8px 10px";e.innerHTML='<div style="display:flex;justify-content:space-between;font-weight:800"><span>'+d.name+'</span><span style="font-size:12px;color:#8a7d6a">'+d.era+'・'+d.where+'・'+d.len+'m・ほね '+d.art.parts.length+'こ</span></div>'+FossilArtRef.svg(d,{}).replace("<svg ",'<svg style="width:100%;height:230px" ')+'<div style="font-size:12px;font-weight:700">'+d.fact.replace(/\\n/g,"")+'</div>';document.getElementById("w").append(e);}</script>`);
for (let s = 0; s < 2; s++) {
  const list = DATA.dinos.slice(s * 5, s * 5 + 5);
  await sheet(`bone-sheet-${s + 1}.png`, `<div style="padding:16px 20px"><div style="font-size:22px;font-weight:800">骨（化石の アイテム） ${s + 1}/2（FossilArtRef.partSvg）</div><div id="w" style="margin-top:8px"></div></div><script>${ART}
const D=${JSON.stringify(list)};for(const d of D){const row=document.createElement("div");row.style.cssText="margin:10px 0";row.innerHTML='<div style="font-weight:800;margin-bottom:4px">'+d.name+'（'+d.art.parts.length+'こ）</div>';const g=document.createElement("div");g.style.cssText="display:flex;flex-wrap:wrap;gap:8px";for(const p of d.art.parts){const c=document.createElement("div");c.style.cssText="width:150px;background:#FFF9EC;border:2.5px solid #3C352E;border-radius:12px;padding:4px;text-align:center";c.innerHTML=FossilArtRef.partSvg(d,p.id).replace("<svg ",'<svg style="width:100%;height:90px" ')+'<div style="font-size:12px;font-weight:800">'+p.name+'</div><div style="font-size:10px;color:#8a7d6a">'+d.id+'.'+p.id+'</div>';g.append(c);}row.append(g);document.getElementById("w").append(row);}</script>`);
}
await browser.close();
console.log("fossils mock: dig-flow.png / small-phone.png / dino-sheet.png / bone-sheet-1〜2.png");
