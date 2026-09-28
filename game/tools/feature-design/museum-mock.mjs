// ⑤ 水族館・恐竜博物館の 見本画像: 館内の 全体図（寄贈 ぜんぶ）・スマホの 画面（寄贈 とちゅう）・寄贈の 画面（ゲームの UI.modal）を 作る。
import { readFileSync } from "node:fs";
import { launch, TMP } from "../town-design/paths.mjs";
import { renderBuilding, exhibitSvg, DATA, FISH, DINOS } from "./museum-render.mjs";
const OUT = new URL("../../docs/design/features/museum/", import.meta.url).pathname, IMG = OUT + "img/";
const GAME = new URL("../../index.html", import.meta.url).href;
const FART = readFileSync(new URL("./fish-art-ref.js", import.meta.url), "utf8"), BART = readFileSync(new URL("./fossil-art-ref.js", import.meta.url), "utf8");
const browser = await launch();
const png = async (html, file, vp, scale = 1) => { const p = await browser.newPage({ viewport: vp, deviceScaleFactor: scale }); p.on("pageerror", (e) => console.log("pageerror", e.message)); await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E">${html}</body>`); await p.waitForTimeout(700); await p.screenshot({ path: file, fullPage: true }); await p.close(); return file; };

// 1) 全体図（寄贈 ぜんぶ・へやの 名前つき）
for (const bid of ["aquarium", "museum"]) {
  const svg = renderBuilding(bid, { full: true, labels: true, party: bid === "aquarium" ? { x: 4, y: 35 } : { x: 17, y: 30 } });
  const b = DATA.buildings[bid];
  await png(`<div style="padding:16px 20px"><div style="font-size:24px;font-weight:800">${b.name} — 全体図（寄贈が ぜんぶ そろった ところ・${b.W}×${b.H}マス）</div><div style="font-size:14px;margin:4px 0 10px">順路: ${b.route.map((id) => b.rooms.find((r) => r.id === id).name).join(" → ")}</div>${svg}</div>`, IMG + `${bid}-plan.png`, { width: b.W * 32 + 40, height: 900 });
}
// 2) スマホの 画面（寄贈 とちゅう）: 論理 360×779（390×844 の スマホ）を 2ばいで
const someFish = new Set(["iwana", "yamame", "ayu", "oikawa", "ugui", "nijimasu", "unagi", "donko", "magoi", "kingyo", "medaka", "aji", "saba", "iwashi", "madai", "kisu", "hirame", "manbo", "kasago", "haze", "anago", "tachiuo"]);
const someBones = { trex: DINOS.find((d) => d.id === "trex").art.parts.map((p) => p.id), raptor: DINOS.find((d) => d.id === "raptor").art.parts.map((p) => p.id), tricera: ["skull", "neck", "chest", "arm", "leg"], spino: ["skull", "sail"], stego: ["plates", "tail", "skull"], para: [], brachio: ["neck1", "neck2", "skull"], ankylo: ["club"], compso: ["head", "body"], fukui: [] };
const VIEWS = [
  ["a", "aquarium", [12.9, 11.6, 360, 779], { x: 18, y: 28, dir: "up" }, "ぽかぽか すいぞくかん・だいすいそう", "大水槽の まえ。寄贈した 魚だけが およいで いる"],
  ["b", "aquarium", [12.4, 0, 360, 779], { x: 18, y: 4, dir: "up" }, "ぽかぽか すいぞくかん・さとの かわ", "かわの へや。水そうごとに 名前の ふだ"],
  ["c", "aquarium", [9.4, 14.5, 360, 779], { x: 15, y: 34, dir: "up" }, "ぽかぽか すいぞくかん・しんかい", "よるの うみ・しんかい・くらげ・いきている かせき"],
  ["d", "museum", [10.4, -0.5, 360, 779], { x: 18, y: 7, dir: "up" }, "きょうりゅう はくぶつかん・ホール", "そろった 骨格は 骨の いろ、たりない 骨は 点線"],
  ["e", "museum", [22.9, 8.5, 360, 779], { x: 29, y: 27, dir: "up" }, "きょうりゅう はくぶつかん・けんきゅうしつ", "はかせに 骨を 寄贈する まどぐち"],
];
const shots = {}, TOAST = { b: ["aquarium", "river"], d: ["museum", "hall"] };
for (const [k, bid, crop, party, place, cap] of VIEWS) {
  const tr = TOAST[k] && DATA.buildings[TOAST[k][0]].rooms.find((r) => r.id === TOAST[k][1]);
  const toast = tr ? `<div style="position:absolute;left:0;right:0;top:66px;text-align:center"><div style="display:inline-block;max-width:90%;background:#FFFDF6;border:3px solid #1F1D1B;border-radius:14px;padding:6px 14px;font-weight:800;font-size:14px;line-height:1.45;word-break:keep-all;box-shadow:0 3px 0 #1F1D1B"><div style="font-size:15px">${tr.name}</div>${tr.intro}</div></div>` : "";
  const svg = renderBuilding(bid, { fish: someFish, bones: someBones, party, crop }).replace(/width="360" height="779"/, 'width="390" height="844"');
  shots[k] = await png(`<div style="position:relative;width:390px;height:844px;overflow:hidden">${svg}<div style="position:absolute;left:10px;top:10px;display:flex;gap:8px;align-items:center"><span style="background:#FFFDF6;border:3px solid #1F1D1B;border-radius:999px;padding:3px 12px;font-weight:800;font-size:13px;box-shadow:0 3px 0 #1F1D1B">${place}</span></div><div style="position:absolute;right:10px;top:10px;width:44px;height:44px;border-radius:50%;background:#F48FB1;border:3px solid #1F1D1B;box-shadow:0 3px 0 #1F1D1B"></div>${toast}</div>`, `${TMP}museum-${k}.png`, { width: 390, height: 844 }, 2);
  shots[k + "cap"] = cap;
}
// 3) 寄贈の 画面（ゲームの UI.modal）
// 館の 中の 絵だけ（HUD なし）を スマホの 大きさで 画像に する → 寄贈の 画面の うしろに しく
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const BG = {
  aqDesk: ["aquarium", [0, 14.7, 360, 779], { x: 5, y: 35, dir: "left" }],
  aqRiver: ["aquarium", [12.4, 0, 360, 779], { x: 18, y: 4, dir: "up" }],
  muLab: ["museum", [22.9, 8.5, 360, 779], { x: 29, y: 27, dir: "up" }],
  muStreet: ["museum", [0, 3, 360, 779], { x: 4, y: 18, dir: "up" }],
  aqDeskSmall: ["aquarium", [0, 19, 360, 640], { x: 5, y: 35, dir: "left" }],
};
async function bgShot(key, vp) { const [bid, crop, party] = BG[key]; const svg = renderBuilding(bid, { fish: someFish, bones: someBones, party, crop }).replace(/width="360" height="\d+"/, `width="${vp[0]}" height="${vp[1]}"`); return png(`<div style="width:${vp[0]}px;height:${vp[1]}px;overflow:hidden">${svg}</div>`, `${TMP}museum-bg-${key}.png`, { width: vp[0], height: vp[1] }, 2); }
async function gamePage(vp, bgKey = null, place = "") {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME); await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.evaluate(() => PokaDebug.newGame()); await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  if (bgKey) {
    const bg = b64(await bgShot(bgKey, vp));
    await page.evaluate(() => { Save.d.flags.intro = true; Save.d.flags.visit_harbor = true; PokaDebug.teleport("harbor"); });
    await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.evaluate(({ bg, place }) => { const im = document.createElement("img"); im.src = bg; im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover"; document.getElementById("screen").after(im); UI.showHud(true, place); }, { bg, place });
    await page.waitForTimeout(300);
  }
  await page.addStyleTag({ content: readFileSync(new URL("./museum-ui.css", import.meta.url), "utf8") });
  await page.evaluate(({ fart, bart, fish, dinos }) => { eval(fart + ";" + bart + ";window.__FA=FishArtRef;window.__BA=FossilArtRef;"); window.__FISH = fish; window.__DINOS = dinos; }, { fart: FART, bart: BART, fish: FISH, dinos: DINOS });
  return page;
}
{
  const page = await gamePage([390, 844], "aqDesk", "ぽかぽか すいぞくかん");
  await page.evaluate((donated) => {
    const keep = { ayu: 2, yamame: 1, madai: 1, kisu: 3, haze: 1, kasago: 1, saba: 2, ryugunotsukai: 1, magoi: 1 }, body = U.el("div");
    body.innerHTML = `<div class="dn-head"><span class="cnt">きふした さかな ${donated.length} / 50</span><span class="muted">いけすの さかなを えらんでね</span></div>`;
    const grid = U.el("div", { class: "dn-grid" });
    for (const [id, n] of Object.entries(keep)) { const f = __FISH.find((x) => x.id === id), done = donated.includes(id); const c = U.el("button", { class: "dn-cell" + (done ? " done" : "") + (id === "ryugunotsukai" ? " sel" : "") }); c.innerHTML = `${__FA.svg(f.art, { uid: "dn" + id, flip: !!f.flip })}<span class="nm">${f.name}</span><span class="n">×${n}</span>${done ? '<span class="tag">きふずみ</span>' : '<span class="tag new">はじめて！</span>'}`; grid.append(c); }
    body.append(grid);
    const foot = U.el("div", { class: "dn-foot" }); foot.append(UI.btn("リュウグウノツカイを きふする", () => {}, "yellow wide"));
    UI.modal({ title: "🐟 かんちょうの マリン", body, footer: foot });
  }, [...someFish]);
  await page.waitForTimeout(500); shots.f = `${TMP}museum-f.png`; await page.screenshot({ path: shots.f }); await page.close();
}
{
  const page = await gamePage([390, 844], "muLab", "きょうりゅう はくぶつかん");
  await page.evaluate((have) => {
    const body = U.el("div"), bones = { "tricera.hip": 1, "tricera.tail": 1, "spino.neck": 1, "para.skull": 2, "brachio.chest": 1 };
    body.innerHTML = `<div class="dn-head"><span class="cnt">くみたてた きょうりゅう 2 / 10</span><span class="muted">もって いる ほね</span></div>`;
    const list = U.el("div", { class: "dn-list" });
    for (const [key, n] of Object.entries(bones)) { const [di, pi] = key.split("."), d = __DINOS.find((x) => x.id === di), p = d.art.parts.find((x) => x.id === pi), got = (have[di] || []).length; const row = U.el("button", { class: "dn-row" + (key === "tricera.tail" ? " sel" : "") }); row.innerHTML = `<span class="ic">${__BA.partSvg(d, pi)}</span><span class="tx"><b>${d.name}の ${p.name}</b><span class="pr"><span class="bar"><i style="width:${Math.round((got / d.art.parts.length) * 100)}%"></i></span>${got}/${d.art.parts.length}</span></span><span class="n">×${n}</span>`; list.append(row); }
    body.append(list);
    const foot = U.el("div", { class: "dn-foot" }); foot.append(UI.btn("えらんだ ほねを きふする", () => {}, "yellow wide"));
    UI.modal({ title: "🦴 くまの はかせ ドン", body, footer: foot });
  }, someBones);
  await page.waitForTimeout(500); shots.g = `${TMP}museum-g.png`; await page.screenshot({ path: shots.g }); await page.close();
}
{
  const page = await gamePage([390, 844], "muLab", "きょうりゅう はくぶつかん");
  await page.evaluate(() => {
    const d = __DINOS.find((x) => x.id === "tricera"), body = U.el("div", { class: "dn-done" });
    body.innerHTML = `<div class="art">${__BA.svg(d, {})}</div><div class="nm">トリケラトプスの がいこつが かんせい！</div><div class="dn">${d.era}・${d.where}・${d.len}m</div><div class="fact"><b>まめちしき</b>${d.fact}</div>`;
    UI.modal({ title: "🎉 かんせい！", body, footer: UI.btn("ホールで みる", () => {}, "yellow wide") });
  });
  await page.waitForTimeout(500); shots.h = `${TMP}museum-h.png`; await page.screenshot({ path: shots.h }); await page.close();
}
// 展示を タップした とき（j: 水そう → 中の 魚／k: 化石の かべ → 説明）
{
  const page = await gamePage([390, 844], "aqRiver", "ぽかぽか すいぞくかん");
  const tank = DATA.buildings.aquarium.objects.find((o) => o.id === "aq_flow");
  await page.evaluate(({ art, tank, donated, room }) => {
    const body = U.el("div", { class: "ex-card" }), got = tank.fish.filter((id) => donated.includes(id));
    body.innerHTML = `<div class="art">${art}</div><span class="plate">${room}</span><div class="say">${tank.fish.length}しゅの うち ${got.length}しゅが きふされて いるよ。\nさかなを タップすると ずかんが ひらくよ。</div>`;
    const list = U.el("div", { class: "ex-list" });
    for (const id of tank.fish) { const f = __FISH.find((x) => x.id === id), have = donated.includes(id); const c = U.el("button", { class: "ex-fish" + (have ? "" : " no") }); c.innerHTML = `${__FA.svg(f.art, { uid: "ex" + id, flip: !!f.flip })}<span>${have ? f.name : "？？？"}</span>`; list.append(c); }
    body.append(list);
    UI.modal({ title: "🐟 " + tank.label, body });
  }, { art: exhibitSvg("aquarium", "aq_flow", { fish: someFish }), tank, donated: [...someFish], room: DATA.buildings.aquarium.rooms.find((r) => r.id === "river").name });
  await page.waitForTimeout(500); shots.j = `${TMP}museum-j.png`; await page.screenshot({ path: shots.j }); await page.close();
}
{
  const page = await gamePage([390, 844], "muStreet", "きょうりゅう はくぶつかん");
  const wall = DATA.buildings.museum.objects.find((o) => o.id === "mu_f1");
  await page.evaluate(({ art, info, room }) => {
    const body = U.el("div", { class: "ex-card rock" });
    body.innerHTML = `<div class="art">${art}</div><span class="plate">${room}</span><div class="say">${info.text}</div>`;
    UI.modal({ title: "🪨 " + info.name, body });
  }, { art: exhibitSvg("museum", "mu_f1"), info: DATA.info[wall.info], room: DATA.buildings.museum.rooms.find((r) => r.id === "street").name });
  await page.waitForTimeout(500); shots.k = `${TMP}museum-k.png`; await page.screenshot({ path: shots.k }); await page.close();
}
const CAP = { a: shots.acap, b: shots.bcap + "（へやに 入ると 案内が 出る）", c: shots.ccap, d: shots.dcap, e: shots.ecap, f: "水族館: かんちょうに 魚を 寄贈（いけすから えらぶ）", g: "博物館: はかせに 骨を 寄贈（恐竜ごとの あつまりぐあい）", h: "骨が ぜんぶ そろった とき", j: "水そうを タップ: 中の 魚（まだの 魚は ？？？）", k: "化石の かべを タップ: 説明（INFO）" };
await png(`<div style="padding:20px 24px"><div style="font-size:26px;font-weight:800">水族館と 恐竜博物館: スマホの 画面（390×844・寄贈 とちゅうの ようす）</div><div style="font-size:14px;margin:4px 0 14px;max-width:1500px">館内は 町と 同じ 3/4 ビューの マップで、3にんで 歩いて まわる。寄贈した 魚は 水そうで およぎ、寄贈した 骨は 台の 上で 骨格に なる（たりない 骨は 点線の かげ）。展示を タップすると ずかんと 同じ 説明が 出る。</div><div style="display:grid;grid-template-columns:repeat(5,auto);gap:16px 18px;justify-content:start">${["a", "b", "c", "d", "e", "f", "g", "h", "j", "k"].map((k, i) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px;max-width:270px">${"①②③④⑤⑥⑦⑧⑨⑩"[i]} ${CAP[k]}</div><img src="${b64(shots[k])}" style="width:270px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "phones.png", { width: 1500, height: 900 });
// 小さい スマホ（375×667）で 寄贈の 画面
{
  const page = await gamePage([375, 667], "aqDeskSmall", "ぽかぽか すいぞくかん");
  await page.evaluate((donated) => {
    const keep = { ayu: 2, yamame: 1, madai: 1, kisu: 3, haze: 1, kasago: 1, saba: 2, ryugunotsukai: 1, magoi: 1 }, body = U.el("div");
    body.innerHTML = `<div class="dn-head"><span class="cnt">きふした さかな ${donated.length} / 50</span></div>`;
    const grid = U.el("div", { class: "dn-grid" });
    for (const [id, n] of Object.entries(keep)) { const f = __FISH.find((x) => x.id === id), done = donated.includes(id); const c = U.el("button", { class: "dn-cell" + (done ? " done" : "") }); c.innerHTML = `${__FA.svg(f.art, { uid: "sp" + id, flip: !!f.flip })}<span class="nm">${f.name}</span><span class="n">×${n}</span>${done ? '<span class="tag">きふずみ</span>' : '<span class="tag new">はじめて！</span>'}`; grid.append(c); }
    body.append(grid); const foot = U.el("div", { class: "dn-foot" }); foot.append(UI.btn("きふする", () => {}, "yellow wide"));
    UI.modal({ title: "🐟 かんちょうの マリン", body, footer: foot });
  }, [...someFish]);
  await page.waitForTimeout(500); shots.i = `${TMP}museum-i.png`; await page.screenshot({ path: shots.i }); await page.close();
}
await png(`<div style="padding:20px 24px"><div style="font-size:22px;font-weight:800;margin-bottom:10px">小さい スマホ（375×667）</div><div style="display:flex;gap:20px"><div><div style="font-weight:800;font-size:13px;margin-bottom:5px">寄贈の 画面</div><img src="${b64(shots.i)}" style="width:300px;border-radius:12px;border:4px solid #3C352E;display:block"></div></div></div>`, IMG + "small-phone.png", { width: 400, height: 700 });
// 4) 町に たてた ところ（いまの 見学だけの 建物を おきかえて 撮影。外がわの 絵は MuseumArtRef.facade200）
const MART = readFileSync(new URL("./museum-art-ref.js", import.meta.url), "utf8"), outs = {}, was = {}; // was: おきかえた 建物の いまの 名前
for (const bid of ["aquarium", "museum"]) {
  const o = DATA.buildings[bid].outside, page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME); await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.evaluate(() => PokaDebug.newGame()); await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  was[bid] = await page.evaluate(({ o, art }) => {
    eval(art + ";window.__MA=MuseumArtRef;");
    // いまの 見学だけの 建物（o.replace）を 館に おきかえる。外がわは town-renewal-art.js と 同じ つつみかた（200×160 ＋ 入口の とびら）
    // ⑤ の 1番が ゲームに 入った あと（建物が もう o.id）は おきかえずに そのまま 撮る
    const d = MAP_DEFS[o.map], done = d.buildings.find((x) => x.id === o.id), b = done || d.buildings.find((x) => x.id === o.replace), label = done ? { harbor_customs: "みなとの しりょうかん", city_library: "まちの としょかん" }[o.replace] || o.replace : b.label;
    if (!done) Object.assign(b, { id: o.id, label: o.label, style: o.style, act: { type: "indoor", map: o.facility } });
    const base = WorldArt.building, R = (x, y, w, h, c, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" ${OS(1.7)}/>`;
    if (!done) WorldArt.building = (sp) => {
      if (sp.style !== o.style) return base(sp);
      const w = sp.w * TS, h = sp.h * TS + 24, dx = ((sp.door + 0.5) / sp.w) * 200;
      const svg = __MA.facade200(o.facility) + R(dx - 12, 117, 24, 36, "#839FA3") + R(dx - 9, 121, 18, 19, "#B8DADF") + `<circle cx="${dx + 7}" cy="145" r="1.4" fill="#EDD5A4" ${OS(1.5)}/>` + R(dx - 16, 153, 32, 6, "#D4C4AE");
      return { w, h, svg: `<g transform="scale(${w / 200} ${h / 160})">${svg}</g>` };
    };
    Save.d.flags.intro = true; Save.d.flags["visit_" + o.map] = true; PokaDebug.hour(11);
    PokaDebug.teleport(o.map, o.front[0], o.front[1] + 2, "up");
    return label;
  }, { o, art: MART });
  await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
  await page.waitForTimeout(1500); outs[bid] = `${TMP}museum-out-${bid}.png`; await page.screenshot({ path: outs[bid] }); await page.close();
}
{
  const vb = (k) => { const o = DATA.buildings[k].outside; return `${o.map} の (${o.x}, ${o.y}) ${o.w}×${o.h}マス・入口 (${o.doorAt.join(", ")})`; };
  await png(`<div style="padding:20px 24px"><div style="font-size:24px;font-weight:800">町に たてた ところ（390×844・いまの 町の 建物を おきかえて 撮影）</div><div style="font-size:14px;margin:4px 0 12px;max-width:620px">港の「${was.aquarium}」を 水族館に、シティの「${was.museum}」を 恐竜博物館に おきかえる（同じ 場所・大きさ）。外がわの 絵は MuseumArtRef.facade200（town-renewal-art.js の facades と 同じ 200×160）。入口に 入ると 館の マップへ、館の 出入り口から 出ると 入口の まえに もどる。</div><div style="display:flex;gap:20px">${["aquarium", "museum"].map((k) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px">${DATA.buildings[k].name}（${vb(k)}）</div><img src="${b64(outs[k])}" style="width:300px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "outside.png", { width: 700, height: 900 });
}
await browser.close();
console.log("museum mock: aquarium-plan.png / museum-plan.png / phones.png / small-phone.png / outside.png");
