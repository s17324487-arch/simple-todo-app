// ② 町の人の 見本画像: ゲームを 実際に 動かし、いまの UI（UI.say / UI.ask / UI.modal）の 形で おねがい・こうかん・ノートを 出して 撮る。
// あわせて、② の 文が ぜんぶ 375×667 の 会話まどに 4行いないで おさまるかを 本物の 画面で はかる（fit-check.json）。
import { readFileSync, writeFileSync } from "node:fs";
import { launch, TMP } from "../town-design/paths.mjs";
const OUT = new URL("../../docs/design/features/townsfolk/", import.meta.url).pathname, IMG = OUT + "img/";
const GAME = new URL("../../index.html", import.meta.url).href;
const REF = readFileSync(new URL("./folk-ref.js", import.meta.url), "utf8");
const CSS = readFileSync(new URL("./folk-ui.css", import.meta.url), "utf8");
const DATA = JSON.parse(readFileSync(OUT + "townsfolk.json", "utf8"));
const browser = await launch();

async function open(vp) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME);
  await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(({ ref, data }) => {
    eval(ref + ";window.__TF=TownFolkRef;window.__TA=TownFolkArt;");
    window.__D = data;
    const npcAll = () => Object.entries(MAP_DEFS).flatMap(([m, d]) => (d.npcs || []).map((n) => ({ ...n, map: m })));
    window.__H = {
      npc: (id) => npcAll().find((n) => n.id === id),
      face: (id) => { const n = __H.npc(id); return Art.npcSvg({ sp: n.sp, col: n.col, stripe: n.stripe, outfit: n.outfit, emo: "happy" }); },
      art: (a) => { const [k, id] = a.split(":"); return k === "folk" ? __TA.item(id) : Art.iconSvg(k, id); },
      thing: (o) => (o.bag ? Art.iconSvg("bag", o.bag) : o.wear ? Art.iconSvg("wear", o.wear) : o.furn ? Art.iconSvg("furn", o.furn) : ""),
      thingName: (o) => (o.bag ? BAG_INDEX[o.bag].name : o.wear ? ITEM_INDEX[o.wear].name : o.furn ? FURN_INDEX[o.furn].name : ""),
      // UI.ask と 同じ 形に、町の人の 顔・名前・下の 部品（extra）を つけたもの。UI.ask に {face, name, extra} を 足す 提案
      ask(text, options, { face, name, extra } = {}) {
        UI.layers++;
        const shade = U.el("div", { class: "dlg-shade ask" }), box = U.el("div", { class: "dialog" + (face ? " with-face" : "") });
        if (face) box.append(U.el("div", { class: "dlg-face", html: face }));
        if (name) box.append(U.el("div", { class: "dlg-name", text: name }));
        box.append(U.el("div", { class: "dlg-text", text }));
        if (extra) box.append(extra);
        const list = U.el("div", { class: "choices" });
        for (const o of options) list.append(U.el("button", { class: "btn choice", html: o }));
        shade.append(list, box); UI.root.append(shade);
      },
      trade(bt) {
        const cell = (o, n) => `<div><div class="folk-it">${__H.thing(o)}<i>×${n || 1}</i></div><div class="folk-lbl">${__H.thingName(o)}</div></div>`;
        return U.el("div", { class: "folk-trade", html: `${cell(bt.give, bt.give.n)}<div class="folk-arrow">→</div>${cell(bt.get, bt.get.n)}` });
      },
      noteBtn(n) { const b = UI.btn(`${__TA.item("note")}<span>おねがい</span><b>${n}</b>`, () => {}, "folk-note-btn"); UI.root.append(b); return b; },
      // ノート（UI.modal の 中身）
      note(reqs) {
        const list = U.el("div", { class: "folk-list" });
        for (const q of reqs) {
          const ev = __D.events.find((e) => e.id === q.id), n = __H.npc(ev.giver);
          const card = U.el("div", { class: "folk-card" });
          const prog = q.total ? `<div class="folk-prog"><div class="folk-bar"><i style="width:${Math.round((q.done / q.total) * 100)}%"></i></div>${q.done}/${q.total}</div>` : "";
          const carry = q.carry ? `<span class="folk-carry">${__H.art(__D.items[q.carry].art)}${__D.items[q.carry].name}</span>` : "";
          card.innerHTML = `<div class="folk-face">${__H.face(ev.giver)}</div><div><div class="folk-ttl">${ev.title}</div><div class="folk-who">${n.name} から</div><div class="folk-hint">${q.hint || ev.lines.remind}</div>${prog}<div class="folk-row"><div>${carry}</div><button class="btn small folk-quit">やめる</button></div></div>`;
          list.append(card);
        }
        const m = UI.modal({ title: `${__TA.item("note").replace("<svg ", '<svg style="width:26px;height:26px;vertical-align:-6px;margin-right:4px" ')}おねがい ノート`, body: list, footer: U.el("div", { class: "muted", text: "おねがいは 3つまで。まちの ひとに はなしかけると ふえるよ。" }) });
        return m;
      },
    };
  }, { ref: REF, data: DATA });
  return page;
}
async function world(page, { map, x, y, hour = 11, weather = "clear" }) {
  await page.evaluate(() => PokaDebug.newGame());
  await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.evaluate(({ map, x, y, hour, weather }) => {
    Save.d.flags.intro = true; Save.d.flags["visit_" + map] = true;
    for (const d of Object.values(MAP_DEFS)) for (const n of d.npcs || []) Save.d.flags.talked[n.id] = true;
    PokaDebug.hour(hour); PokaDebug.weather(weather); PokaDebug.teleport(map, x, y, "down");
  }, { map, x, y, hour, weather });
  await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => PokaDebug.pause(true));
  await page.waitForTimeout(150);
}
// 町の 上に しるし・小物を かく（ゲームの canvas の 上に 同じ 大きさの canvas を かさねる）
async function overlay(page, { marks = [], props = [], kitten = null }) {
  await page.evaluate(async ({ marks, props, kitten }) => {
    const s = G.scene, cv = G.canvas, r = cv.getBoundingClientRect();
    const ov = document.createElement("canvas"); ov.width = cv.width; ov.height = cv.height;
    Object.assign(ov.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", pointerEvents: "none", zIndex: 5 });
    document.body.append(ov);
    const ctx = ov.getContext("2d"); ctx.scale(cv.width / G.W, cv.height / G.H);
    const ox = G.W / 2 - s.cam.x, oy = G.H / 2 - s.cam.y;
    const img = (svg) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    for (const [x, y, id] of props) { const im = await img(__TA.prop(id)); if (im) ctx.drawImage(im, ox + x * TS, oy + (y + 1) * TS - 32, 32, 32); }
    if (kitten) {
      const im = await img(Art.npcSvg({ sp: "cat", col: "#F6C28B", stripe: true, emo: "happy" }));
      const w = CHAR_SIZE * 0.72, h = (w * VB.h) / VB.w, fx = ox + kitten[0] * TS + 16, fy = oy + (kitten[1] + 1) * TS - 6;
      ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.beginPath(); ctx.ellipse(fx, fy, 9, 4, 0, 0, 7); ctx.fill();
      if (im) ctx.drawImage(im, fx - w * ((FOOT.x - VB.x) / VB.w), fy - h * ((FOOT.y - VB.y) / VB.h), w, h);
    }
    for (const [id, kind] of marks) { const n = s.npcs.find((q) => q.id === id); if (!n) continue; const f = n.w.feet(); __TA.marker(ctx, kind, ox + f.x + 12, oy + f.y - 50, 0.3); }
  }, { marks, props, kitten });
}
// その マップで 歩いて 行ける マスから、TownFolkRef.spots で ばしょを えらぶ
async function spots(page, n, seed, near) {
  return page.evaluate(({ n, seed, near }) => {
    const m = G.scene.map, walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.isSolid(x, y);
    const st = [[near.x, near.y]];
    const seen = new Set([st[0].join()]), out = [];
    while (st.length) { const [x, y] = st.shift(); out.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + dx + "," + (y + dy); if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); st.push([x + dx, y + dy]); } } }
    return __TF.spots(G.scene.mapId, n, seed, walk, out, near);
  }, { n, seed, near });
}
const shot = async (page, name) => { await page.waitForTimeout(350); const p = `${TMP}folk-${name}.png`; await page.screenshot({ path: p }); return p; };
const shots = {};

// A. 町で: ことわった おねがいが まっている 人（！）と、おねがいの あいて（▼）、さがす ばしょ（きらきら）
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 14, y: 13 });
  const sp = await spots(page, 3, "ev-lost-kitten:demo", { x: 14, y: 13, r: 9 });
  await overlay(page, { marks: [["sheep", "offer"], ["rabbit", "target"]], props: sp.slice(0, 2).map(([x, y]) => [x, y, "sparkle"]), kitten: sp[2] });
  await page.evaluate(() => __H.noteBtn(2));
  shots.a = await shot(page, "a"); await page.close();
}
// B. おねがいを もちかける（ひつじの メェ・ぎゅうにゅう）
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 15, y: 8 });
  await page.evaluate(() => { const ev = __D.events.find((e) => e.id === "ev-milk"); __H.ask(ev.lines.offer, ["うん、まかせて！", "あとでね"], { face: __H.face("sheep"), name: __H.npc("sheep").name }); });
  shots.b = await shot(page, "b"); await page.close();
}
// C. 物々交換（ぶたの ブー）
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 9, y: 25 });
  await page.evaluate(() => { const bt = __D.barter.find((b) => b.id === "bt-pig-corn"); __H.ask(bt.text, ["こうかん する", "やめておく"], { face: __H.face("pig"), name: __H.npc("pig").name, extra: __H.trade(bt) }); });
  shots.c = await shot(page, "c"); await page.close();
}
// D. でんごんを つたえる（3にんの だれかが 言う → あいてが こたえる）
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 16, y: 17 });
  await overlay(page, { marks: [["rabbit", "target"]] });
  await page.evaluate(() => { const ev = __D.events.find((e) => e.id === "ev-msg-flower"); UI.say([{ who: "wanko", emo: "happy", text: "ミミさん！ " + ev.steps[0].say + "！" }]); });
  await page.waitForTimeout(1500);
  shots.d = await shot(page, "d"); await page.close();
}
// E. おねがい ノート
const NOTE = [{ id: "ev-msg-flower", hint: "ミミに でんごん:『あした おはなを みに いこう』" }, { id: "ev-cleanup", total: 5, done: 2 }, { id: "ev-letter", carry: "letter" }];
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 14, y: 13 });
  await page.evaluate((reqs) => __H.note(reqs), NOTE);
  shots.e = await shot(page, "e"); await page.close();
}
// F. かなえた（おれいの ことば ＋ ごほうびの トースト）
{
  const page = await open([390, 844]);
  await world(page, { map: "town", x: 15, y: 8 });
  await page.evaluate(() => { const ev = __D.events.find((e) => e.id === "ev-milk"); UI.say([{ name: __H.npc("sheep").name, face: __H.face("sheep"), text: ev.lines.done }]); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const ev = __D.events.find((e) => e.id === "ev-milk"); UI.toast(`<span class="folk-reward">${__TA.item("note")}おねがい かなえた！ コイン +${ev.reward.coins}・なかよし +2</span>`); });
  shots.f = await shot(page, "f"); await page.close();
}
// G・H. 小さい スマホ（375×667）で ノートと こうかん
{
  const page = await open([375, 667]);
  await world(page, { map: "town", x: 14, y: 13 });
  await page.evaluate((reqs) => __H.note(reqs), NOTE);
  shots.g = await shot(page, "g"); await page.close();
}
{
  const page = await open([375, 667]);
  await world(page, { map: "town", x: 15, y: 8 });
  await page.evaluate(() => { const bt = __D.barter.find((b) => b.id === "bt-sheep-juice"); __H.ask(bt.text, ["こうかん する", "やめておく"], { face: __H.face("sheep"), name: __H.npc("sheep").name, extra: __H.trade(bt) }); });
  shots.h = await shot(page, "h"); await page.close();
}
// 文が 会話まどに おさまるか（375×667・顔つき）
let fit;
{
  const page = await open([375, 667]);
  await world(page, { map: "town", x: 14, y: 13 });
  fit = await page.evaluate(() => {
    const texts = [];
    for (const l of __D.lines) texts.push(["line " + l.id, l.text]);
    for (const l of __D.react) texts.push(["react " + l.id, l.text]);
    for (const b of __D.barter) texts.push(["barter " + b.id, b.text]);
    for (const e of __D.events) { for (const k of ["offer", "remind", "done"]) texts.push([`${e.id} ${k}`, e.lines[k]]); for (const s of e.steps) { if (s.say) texts.push([`${e.id} say`, s.say]); if (s.chain) for (const c of s.chain) texts.push([`${e.id} ${c[0]}`, c[2]]); if (s.q) for (const q of s.q) texts.push([`${e.id} q`, q[0]]); } }
    const shade = U.el("div", { class: "dlg-shade" }), box = U.el("div", { class: "dialog with-face" }), t = U.el("div", { class: "dlg-text" });
    box.append(U.el("div", { class: "dlg-face" }), t); shade.append(box); UI.root.append(shade);
    t.style.minHeight = "0";
    const lh = parseFloat(getComputedStyle(t).lineHeight), width = t.clientWidth, out = [];
    for (const [k, v] of texts) { t.textContent = v; out.push([k, Math.round(t.scrollHeight / lh), v]); }
    shade.remove();
    return { lineHeight: lh, width, count: out.length, max: Math.max(...out.map((o) => o[1])), over: out.filter((o) => o[1] > 4), hist: out.reduce((a, o) => ((a[o[1]] = (a[o[1]] || 0) + 1), a), {}) };
  });
  await page.close();
}
writeFileSync(OUT + "fit-check.json", JSON.stringify(fit, null, 1));
console.log("fit:", JSON.stringify({ count: fit.count, max: fit.max, over: fit.over.length, hist: fit.hist, width: fit.width }));

// 並べた 図
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const CAP = { a: "① 町で: ！＝まっている おねがい／▼＝あいて／きらきら＝さがす ばしょ", b: "② もちかける（10〜20%）", c: "③ 物々交換（わたす → もらう）", d: "④ でんごんを つたえる", e: "⑤ おねがい ノート（3つまで）", f: "⑥ かなえた: おれい ＋ ごほうび" };
const card = (k, w) => `<div class="sc"><div class="t">${CAP[k]}</div><img src="${b64(shots[k])}" style="width:${w}px"></div>`;
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.wrap{padding:22px 26px}.h{font-size:26px;font-weight:800}.s{font-size:14px;margin:4px 0 14px;max-width:1300px}.grid{display:grid;grid-template-columns:repeat(3,auto);gap:18px 22px;justify-content:start}.t{font-weight:800;font-size:14px;margin-bottom:6px;max-width:300px}img{border-radius:14px;border:4px solid #3C352E;display:block}</style>
<body><div class="wrap"><div class="h">町の人: おねがい・物々交換・ノート（390×844）</div><div class="s">いまの 会話まど（UI.say / UI.ask）と パネル（UI.modal）を そのまま つかう。町の人の 顔と 名前を UI.ask にも 出せるように する。こうかんは 文の 下に「わたす → もらう」の カードを 出す。</div><div class="grid">${["a", "b", "c", "d", "e", "f"].map((k) => card(k, 300)).join("")}</div></div></body>`;
{ const page = await browser.newPage({ viewport: { width: 1060, height: 900 } }); await page.setContent(html); await page.waitForTimeout(400); await page.screenshot({ path: IMG + "flow.png", fullPage: true }); await page.close(); }
const html2 = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.wrap{padding:22px 26px}.h{font-size:22px;font-weight:800;margin-bottom:10px}.row{display:flex;gap:22px}.t{font-weight:800;font-size:14px;margin-bottom:6px}img{border-radius:14px;border:4px solid #3C352E;display:block}</style>
<body><div class="wrap"><div class="h">小さい スマホ（375×667）でも はみ出さない</div><div class="folk-row"><div><div class="t">おねがい ノート</div><img src="${b64(shots.g)}" style="width:300px"></div><div><div class="t">物々交換（服と こうかん）</div><img src="${b64(shots.h)}" style="width:300px"></div></div></div></body>`;
{ const page = await browser.newPage({ viewport: { width: 700, height: 700 } }); await page.setContent(html2); await page.waitForTimeout(400); await page.screenshot({ path: IMG + "small-phone.png", fullPage: true }); await page.close(); }

// もちもの・小物・しるしの 一覧（ゲームの 中で 描く: いまの 絵も 並べて 大きさを くらべる）
{
  const page = await open([1000, 720]);
  await page.evaluate(() => {
    const items = Object.entries(__D.items).map(([id, v]) => [v.name, __H.art(v.art), id]);
    items.push(["おねがい ノート", __TA.item("note"), "note"]);
    const props = Object.keys(__TA.PROP).map((id) => [id, __TA.prop(id)]);
    const kitten = Art.npcSvg({ sp: "cat", col: "#F6C28B", stripe: true, emo: "happy" }), cat = Art.npcSvg({ sp: "cat", emo: "happy" });
    const div = document.createElement("div");
    div.style.cssText = "position:fixed;inset:0;z-index:99;background:#FBF8F1;padding:18px 22px;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E;overflow:hidden";
    div.innerHTML = `<div style="font-size:22px;font-weight:800">② の 絵（もちもの 64×64・小物 1マス・しるし）</div>
      <div style="font-size:13px;margin:4px 0 12px">線は INK #1F1D1B・パステルの ぬり。もちものは FOOD_ART と おなじ viewBox 0 0 64 64。小物は 足もとが 下の まん中。</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">${items.map(([n, svg, id]) => `<div style="width:92px;text-align:center"><div style="width:84px;height:84px;margin:auto;background:#FFF;border:3px solid #3C352E;border-radius:16px;display:grid;place-items:center">${svg.replace("<svg ", '<svg style="width:64px;height:64px" ')}</div><div style="font-size:12px;font-weight:800;margin-top:3px">${n}</div><div style="font-size:10px;color:#8a7d6a">${id}</div></div>`).join("")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;align-items:flex-end">${props.map(([id, svg]) => `<div style="text-align:center"><div style="width:96px;height:96px;background:#8FCB6A;border:3px solid #3C352E;border-radius:12px;display:grid;place-items:end center;background-image:linear-gradient(#0001 1px,transparent 1px),linear-gradient(90deg,#0001 1px,transparent 1px);background-size:32px 32px">${svg.replace("<svg ", '<svg style="width:96px;height:96px" ')}</div><div style="font-size:11px;font-weight:800;margin-top:3px">${id}</div></div>`).join("")}
      <div style="text-align:center"><div style="width:120px;height:96px;background:#8FCB6A;border:3px solid #3C352E;border-radius:12px;position:relative"><div style="position:absolute;left:6px;bottom:4px;width:60px">${cat.replace("<svg ", '<svg style="width:60px;height:auto" ')}</div><div style="position:absolute;left:66px;bottom:4px;width:43px">${kitten.replace("<svg ", '<svg style="width:43px;height:auto" ')}</div></div><div style="font-size:11px;font-weight:800;margin-top:3px">ミケ と こねこ（0.72ばい）</div></div>
      <div style="text-align:center"><canvas id="mk" width="240" height="192" style="width:120px;height:96px;background:#8FCB6A;border:3px solid #3C352E;border-radius:12px"></canvas><div style="font-size:11px;font-weight:800;margin-top:3px">しるし: ！（まつ）・▼（あいて）</div></div></div>`;
    document.body.append(div);
    const c = document.getElementById("mk").getContext("2d"); c.scale(2, 2); __TA.marker(c, "offer", 38, 48, 0); __TA.marker(c, "target", 82, 48, 0);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: IMG + "items.png" }); await page.close();
}
await browser.close();
console.log("townsfolk mock: flow.png / small-phone.png / items.png / fit-check.json");
