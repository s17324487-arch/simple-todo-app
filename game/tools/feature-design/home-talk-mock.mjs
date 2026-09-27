// ① 吹き出しの 見本画像: 同じ 場面で「いま（before）」と「見本の 実装（after）」を 並べる。ゲームを 実際に 動かして 撮る。
import { readFileSync } from "node:fs";
import { launch } from "../town-design/paths.mjs";
const OUT = new URL("../../docs/design/features/home-talk/", import.meta.url).pathname;
const GAME = new URL("../../index.html", import.meta.url).href;
const REF = readFileSync(new URL("./home-bubble-ref.js", import.meta.url), "utf8");
const IMG = OUT + "img/";
// 場面: [名前, 画面, 時刻, 天気, みまもり, 位置, セリフ]
const SCENES = [
  { id: "a", title: "ふつうの かけあい（390×844・ひる）", vp: [390, 844], hour: 11, weather: "clear", watch: false,
    pos: { wanko: [96, 352], gachan: [184, 380], goji: [270, 356] },
    turns: [["wanko", "たんけん ごっこ しようよ", "say"], ["gachan", "ひとりに しないでね…", "say"], ["goji", "ガウっ！ ずっと いっしょ", "shout"]] },
  { id: "b", title: "みまもり・ぱぱ まま（390×844・ゆうがた）", vp: [390, 844], hour: 17, weather: "cloudy", watch: true,
    pos: { wanko: [150, 360], gachan: [96, 388], goji: [258, 380] },
    turns: [["wanko", "クンクン、クンクン…", "say"], ["mama", "わんこ！ また クンクン して… めっ", "shout"], ["wanko", "くぅん… ごめんなさい", "cry"]] },
  { id: "c", title: "よる・あめ（375×667 の 小さい スマホ）", vp: [375, 667], hour: 21, weather: "rain", watch: false,
    pos: { wanko: [250, 356], gachan: [118, 360], goji: [190, 380] },
    turns: [["mama", "だいじょうぶ、ここに いるよ", "say"], ["gachan", "かみなり… こわいよぉ… ままー たすけてー", "cry"], ["goji", "ねむい …ガゥ", "think"]] },
];
const browser = await launch();
const shots = {};
for (const sc of SCENES) for (const mode of ["before", "after"]) {
  const page = await browser.newPage({ viewport: { width: sc.vp[0], height: sc.vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME); await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.evaluate(({ hour, weather }) => { PokaDebug.newGame(); PokaDebug.hour(hour); PokaDebug.weather(weather); }, sc);
  await page.waitForTimeout(500); await page.evaluate(() => PokaDebug.house()); await page.waitForTimeout(1400);
  await page.evaluate(({ watch, pos }) => { const s = G.scene; if (watch && !s.watching) HomeLife.toggle(s); for (const c of s.chars) { const p = pos[c.id]; if (p) { c.x = p[0]; c.y = p[1]; c.state = "idle"; c.t = 99; c.emo = null; } } s.life.bubbles = []; s.life.next = 999; }, sc);
  await page.waitForTimeout(700); await page.evaluate(() => PokaDebug.pause(true)); await page.waitForTimeout(200);
  if (mode === "before") await page.evaluate((turns) => { const s = G.scene; for (const [id, text] of turns) HomeLife.say(s, id, text); }, sc.turns);
  else await page.evaluate(({ turns, ref }) => {
    eval(ref + ";window.__HB=HomeBubbleRef;");
    const s = G.scene, cv = G.canvas, ov = document.createElement("canvas"), r = cv.getBoundingClientRect();
    ov.width = cv.width; ov.height = cv.height; Object.assign(ov.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", pointerEvents: "none", zIndex: 5 });
    document.body.append(ov); const ctx = ov.getContext("2d"); ctx.scale(cv.width / G.W, cv.height / G.H);
    const heads = {}; for (const c of [...s.chars, ...s.parents]) { if (c.hidden) continue; const kid = !!s.chars.includes(c); const p = s.toScreen(c.x, c.y - (kid ? 84 : 104)); heads[c.id] = { x: p.x, y: p.y, r: (kid ? 24 : 21) * s.s }; }
    const names = { wanko: Save.d.chars.wanko.name, gachan: Save.d.chars.gachan.name, goji: Save.d.chars.goji.name, papa: "ぱぱ", mama: "まま" };
    const area = { top: s.watching ? 112 : 194, bottom: G.H - (s.watching ? 65 : 143), left: 8, right: G.W - 8 };
    const now = 10, bubbles = turns.map(([id, text, kind], i) => ({ id, name: names[id], text, kind, born: now - 1.2 + i * 0.4 }));
    const boxes = __HB.layout(ctx, bubbles, heads, area); __HB.draw(ctx, boxes, now);
  }, { turns: sc.turns, ref: REF });
  await page.waitForTimeout(250);
  const p = `/tmp/pokapoka-home-${sc.id}-${mode}.png`; await page.screenshot({ path: p }); shots[sc.id + mode] = p; await page.close();
}
// 並べた 図
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const card = (sc) => `<div class="sc"><div class="t">${sc.title}</div><div class="row"><div><div class="cap bad">いま</div><img src="${b64(shots[sc.id + "before"])}" style="width:${sc.vp[0] * 0.78}px"></div><div><div class="cap good">見本（home-bubble-ref.js）</div><img src="${b64(shots[sc.id + "after"])}" style="width:${sc.vp[0] * 0.78}px"></div></div></div>`;
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.wrap{padding:22px 26px}.h{font-size:26px;font-weight:800}.s{font-size:14px;margin:4px 0 14px}.all{display:flex;gap:26px;align-items:flex-start}.t{font-weight:800;font-size:16px;margin-bottom:6px}.row{display:flex;gap:10px}.cap{font-weight:800;font-size:14px;margin-bottom:4px}.bad{color:#C0392B}.good{color:#2E7D5B}img{border-radius:14px;border:4px solid #3C352E;display:block}</style>
<body><div class="wrap"><div class="h">おうちの 吹き出し: いま と 見本</div><div class="s">見本は 話し手の 頭の 真上に 出し、しっぽを 短く する。名札の 色で だれか わかり、形で 気持ちが わかる（ぎざぎざ＝さけぶ・なみなみ＝なく・くも＝こころの こえ）。同時に 出すのは 2つまで。</div><div class="all">${SCENES.map(card).join("")}</div></div></body>`;
const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });
await page.setContent(html); await page.waitForTimeout(500); await page.screenshot({ path: IMG + "before-after.png", fullPage: true }); await page.close();
// 形の 見本（6種）
const kindsHtml = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#F6EFE3"><canvas id="c" width="1560" height="620" style="width:780px;height:310px"></canvas><script>${REF}
const cv=document.getElementById("c"),ctx=cv.getContext("2d");ctx.scale(2,2);ctx.fillStyle="#F6EFE3";ctx.fillRect(0,0,780,310);
const items=[["wanko","わんこ","せいぎの みかた、わんこ さんじょう！","shout","さけぶ（shout）"],["gachan","がちゃん","ままー たすけてー","cry","なく（cry）"],["goji","ごじ","むにゃ… ビルより おっきく… ガゥ…","think","こころの こえ（think）"],["wanko","わんこ","しーっ！ ままには ひみつ だよ","whisper","ひそひそ（whisper）"],["gachan","がちゃん","しあわせは 3にんぶんより おおきいね","say","めずらしい（rare・金色）",true],["mama","まま","ごはん できたよ〜","say","ふつう（say）"]];
const heads={};items.forEach((it,i)=>{const x=70+(i%3)*250,y=i<3?130:280;heads["h"+i]={x,y,r:22};ctx.fillStyle="#E8DCC8";ctx.strokeStyle="#1F1D1B";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+22,22,0,7);ctx.fill();ctx.stroke();ctx.fillStyle="#6B6153";ctx.font="700 12px sans-serif";ctx.textAlign="center";ctx.fillText(it[4],x+60,y+60);});
items.forEach((it,i)=>{const hd=heads["h"+i];const x=hd.x+40,area={top:6,bottom:305,left:hd.x-60,right:hd.x+190};const bx=HomeBubbleRef.layout(ctx,[{id:it[0],name:it[1],text:it[2],kind:it[3],rare:!!it[5],born:0}],{[it[0]]:{x:hd.x+30,y:hd.y,r:22}},area);HomeBubbleRef.draw(ctx,bx,1);});
</script></body>`;
const pk = await browser.newPage({ viewport: { width: 780, height: 310 }, deviceScaleFactor: 2 });
pk.on("pageerror", (e) => console.log("kinds pageerror", e.message)); pk.on("console", (m) => console.log("kinds console", m.text()));
await pk.setContent(kindsHtml); await pk.waitForTimeout(400); await pk.screenshot({ path: IMG + "bubble-kinds.png" }); await pk.close();
await browser.close();
console.log("home-talk mock: before-after.png / bubble-kinds.png");
