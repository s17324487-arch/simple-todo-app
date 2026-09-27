// ⑥ 射撃場の 見本画像: じゅう 9しゅの 一覧・スマホの 画面（ゲームの 上に 重ねて 撮影）・小さい スマホ
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { launch, TMP } from "../town-design/paths.mjs";
import { heroSvg, npcSvg } from "../town-design/heroes.mjs";
const OUT = new URL("../../docs/design/features/range/", import.meta.url).pathname, IMG = OUT + "img/";
const GAME = new URL("../../index.html", import.meta.url).href;
const RD = JSON.parse(readFileSync(OUT + "range.json", "utf8"));
const GART = readFileSync(new URL("./gun-art-ref.js", import.meta.url), "utf8"), RREF = readFileSync(new URL("./range-ref.js", import.meta.url), "utf8"), CSS = readFileSync(new URL("./range-ui.css", import.meta.url), "utf8");
const ctx = { Math, JSON }; vm.createContext(ctx); vm.runInContext(GART + ";" + RREF + ";globalThis.GA=GunArtRef;globalThis.RR=RangeRef;", ctx);
const GA = ctx.GA, RR = ctx.RR;
const browser = await launch();
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const svgUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
const png = async (html, file, vp, scale = 1) => { const p = await browser.newPage({ viewport: vp, deviceScaleFactor: scale }); p.on("pageerror", (e) => console.log("pageerror", e.message)); await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E">${html}</body>`); await p.waitForTimeout(600); await p.screenshot({ path: file, fullPage: true }); await p.close(); return file; };
// 3にんの かお（おうえん・だれが うつ？）
const hero = (id, face, size = 64) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${Math.round(size * 1.12)}" width="${size * 2}" height="${Math.round(size * 2.24)}">${heroSvg(id, size / 2, size * 1.08, { dir: "down", face, size })}</svg>`);
const FACE = { wanko: ["smile", "surprise"], gachan: ["smile", "sparkle"], goji: ["love", "shout"] }, NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
const HEROES = Object.fromEntries(Object.keys(FACE).flatMap((id) => FACE[id].map((f) => [id + ":" + f, hero(id, f)])));
const STAFF = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 66">${npcSvg({ sp: RD.staff.sp, outfit: RD.staff.outfit, dir: "down" }, 30, 64, { size: 56 })}</svg>`);

// 1) じゅう 9しゅの 一覧
{
  const bar = (v, max) => `<span style="display:inline-block;width:100%;min-width:40px;height:9px;border:2px solid #1F1D1B;border-radius:6px;background:#fff;overflow:hidden;vertical-align:middle"><i style="display:block;height:100%;width:${Math.round(Math.min(1, v / max) * 100)}%;background:#7EC8F0"></i></span>`;
  const card = (g) => `<div style="background:#fff;border:3px solid #3C352E;border-radius:14px;padding:10px 12px;width:${g.cat === "hand" ? 330 : 470}px">
    <div style="display:flex;gap:8px;align-items:baseline"><span style="background:${{ hand: "#FFE3EC", rifle: "#DFF3FF", sniper: "#E3F5D4" }[g.cat]};border:2px solid #1F1D1B;border-radius:8px;padding:0 6px;font-size:12px;font-weight:800">${RD.cats[g.cat].name}</span><b style="font-size:18px">${g.name}</b><span style="font-size:12px;color:#8a7d6a">${g.len}×${g.h}mm・${g.power}</span></div>
    <div style="height:${g.cat === "hand" ? 250 : 150}px;display:grid;place-items:center;background:linear-gradient(#F4F7FA,#E4EBF1);border:2px solid #1F1D1B;border-radius:10px;margin:6px 0">${GA.svg(g, { px: g.cat === "hand" ? 1.2 : 0.39, uid: "sh" + g.id })}</div>
    <div style="font-size:11px;color:#8a7d6a;font-weight:700">参考: ${g.ref}</div>
    <div style="display:grid;grid-template-columns:max-content 1fr max-content 1fr;gap:3px 8px;font-size:11px;font-weight:800;margin:6px 0;white-space:nowrap">
      <span>たま ${g.mag}</span>${bar(g.mag, 30)}<span>れんしゃ ${g.rate}${g.auto ? "（おしっぱなし）" : ""}</span>${bar(g.rate, 8)}
      <span>ねらいやすさ</span>${bar(8 - g.spread, 7.5)}<span>はねあがり</span>${bar(g.recoil, 18)}
      ${g.zoom ? `<span>スコープ ×${g.zoom}</span>${bar(g.zoom, 4)}<span>ゆれ</span>${bar(g.sway, 14)}` : ""}
    </div>
    <div style="font-size:13px;font-weight:700;white-space:pre-line;line-height:1.45">${g.desc}</div>
    <div style="margin-top:5px;background:#FFF3C4;border:2px dashed #d9b64a;border-radius:10px;padding:4px 8px;font-size:12px;font-weight:700;white-space:pre-line;line-height:1.45"><b style="font-size:11px;color:#9a6a00">まめちしき</b><br>${g.fact}</div></div>`;
  await png(`<div style="padding:18px 22px"><div style="font-size:26px;font-weight:800">射撃場の エアガン 9しゅ（実物の 長さ・高さの 比の まま・右がわから 見た ところ）</div><div style="font-size:14px;margin:4px 0 12px">名前・絵は オリジナル（刻印・ロゴなし）。じゅうこうの さきは オレンジ（おもちゃの しるし）。ハンドガンは 1mm = 1.2px、ライフルと スナイパーは 1mm = 0.39px で 描いた（同じ しゅるいは 同じ 縮尺）。</div>
    ${["hand", "rifle", "sniper"].map((c) => `<div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start">${RD.guns.filter((g) => g.cat === c).map(card).join("")}</div>`).join("")}</div>`, IMG + "gun-sheet.png", { width: 1500, height: 900 });
}

// 2) ゲームの 上に 重ねて 撮る
async function gamePage(vp, where = { map: "city", x: 3, y: 17 }) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME); await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.evaluate(() => PokaDebug.newGame()); await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(({ art, ref, rd, o }) => {
    eval(art + ";" + ref + ";window.__GA=GunArtRef;window.__RR=RangeRef;"); window.__RD = rd;
    // シティに 射撃場を たてる（ゲームの 町に さしこむ）
    const d = MAP_DEFS[o.map], b = rd.outside, rows = d.rows.map((r) => r.split(""));
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) rows[y][x] = "#";
    rows[b.doorAt[1]][b.doorAt[0]] = "D"; rows[b.front[1]][b.front[0]] = "="; d.rows = rows.map((r) => r.join(""));
    d.buildings.push({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, door: b.door, label: b.label, roof: b.roof, facility: "range", sign: "range", act: { type: "range" } });
    const base = WorldArt.building; WorldArt.building = (sp) => (sp.facility === "range" ? __RR.facade(sp) : base(sp)); SIGN_ICON.range = __RR.signIcon;
    Save.d.flags.intro = true; Save.d.flags["visit_" + o.map] = true; PokaDebug.hour(11); PokaDebug.teleport(o.map, o.x, o.y, "up");
  }, { art: GART, ref: RREF, rd: RD, o: where });
  await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  return page;
}
// 主観の 画面（canvas ＋ HUD ＋ ボタン ＋ おうえん）
async function fpv(page, o) {
  await page.evaluate(async ({ o, heroes }) => {
    const RD = __RD, RR = __RR, vw = innerWidth, vh = innerHeight, W = 360, H = Math.round((360 * vh) / vw);
    const sc = U.el("div", { class: "range-scene" }), cv = document.createElement("canvas"); cv.width = vw * 2; cv.height = vh * 2; sc.append(cv); UI.root.append(sc);
    const c2 = cv.getContext("2d"); c2.setTransform((vw * 2) / W, 0, 0, (vw * 2) / W, 0, 0);
    const imgs = {}, load = (key, svg) => new Promise((res) => { const im = new Image(); im.onload = () => { imgs[key] = im; res(); }; im.onerror = () => res(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const gun = RD.guns.find((g) => g.id === o.gun);
    await Promise.all(RR.artKeys(RD).map((k) => load(k.key, k.make())).concat(load("fpv", RR.fpvSvg(gun, o.who, "soft").svg)));
    const g = new RR.Game(RD, o.gun, { seed: o.seed, W, H });
    for (let i = 0; i < o.secs * 60 && g.phase !== "end"; i++) g.update(1 / 60, RR.bot(g, o.skill));
    if (o.ready) { g.phase = "ready"; }
    RR.draw(c2, g, { img: (k) => imgs[k] });
    // うえの HUD
    const top = U.el("div", { class: "range-top" });
    const ammo = g.reloading > 0 ? `<span class="reload">リロード…</span>` : `<span class="ammo">${gun.mag <= 10 ? Array.from({ length: gun.mag }, (_, i) => `<i class="${i < g.ammo ? "" : "off"}"></i>`).join("") : `${g.ammo} / ${gun.mag}`}</span>`;
    top.innerHTML = `<span class="pill">⏱ ${Math.ceil(g.left)}</span><span class="pill">🎯 ${g.score}てん</span><span class="pill">${ammo}</span><span class="grow"></span>`;
    top.append(UI.btn("✕", () => {}, "round range-quit")); sc.append(top);
    if (g.combo >= 5) sc.append(U.el("div", { class: "range-combo", html: `れんぞく ${g.combo}！` }));
    if (o.ready) sc.append(U.el("div", { class: "range-count", html: "よーい…" }));
    // ボタン
    const ctrl = U.el("div", { class: "range-ctrl" });
    if (gun.zoom) ctrl.append(UI.btn(g.scoped ? "もどす" : "スコープ", () => {}, "range-scope" + (g.scoped ? " on" : "")));
    ctrl.append(UI.btn(g.reloading > 0 ? "…" : "うつ", () => {}, "range-fire" + (g.reloading > 0 ? " wait" : ""))); sc.append(ctrl);
    if (o.hint) sc.append(U.el("div", { class: "range-hint", html: o.hint }));
    // おうえんの 2人
    const ch = U.el("div", { class: "range-cheer" });
    o.buddies.forEach(([id, face, say]) => { const b = U.el("div", { class: "range-buddy" }); b.innerHTML = `<img src="${heroes[id + ":" + face]}">` + (say ? `<span class="range-bubble">${say}</span>` : ""); ch.append(b); });
    sc.append(ch);
    window.__G = g;
  }, { o, heroes: HEROES });
  await page.waitForTimeout(400);
}
const shots = {}, CAP = {};
const shot = async (page, k, cap) => { const p = `${TMP}range-${k}.png`; await page.screenshot({ path: p }); shots[k] = p; CAP[k] = cap; await page.close(); };
// ① 町の 射撃場
{ const page = await gamePage([390, 844]); await shot(page, "a", "シティに たつ 射撃場（入口に 入ると 射撃場の 画面）"); }
// ② やくそく（はじめての とき）
{
  const page = await gamePage([390, 844]);
  await fpv(page, { gun: "auto", who: "wanko", seed: "m2", secs: 0, skill: "casual", ready: true, buddies: [] });
  await page.evaluate(({ staff, talk, name }) => { document.querySelector(".range-scene canvas").style.filter = "brightness(0.75)"; for (const s of document.querySelectorAll(".range-ctrl,.range-count,.range-top")) s.remove(); UI.say([{ name, face: `<img src="${staff}" style="width:100%;height:100%">`, text: talk }]); }, { staff: STAFF, talk: RD.talk.first[1], name: RD.staff.name });
  await page.waitForTimeout(500); await shot(page, "b", "はじめての とき: 安全の やくそく（ゴーグル・まとだけ・ひとや どうぶつに むけない）");
}
// ③ だれが うつ？
{
  const page = await gamePage([390, 844]);
  await page.evaluate(({ heroes, talk }) => {
    const body = U.el("div"), grid = U.el("div", { class: "rg-who" });
    for (const [id, nm, face] of [["wanko", "わんこ", "smile"], ["gachan", "がちゃん", "smile"], ["goji", "ごじ", "love"]]) { const c = U.el("button", { class: "rg-who-card" + (id === "wanko" ? " on" : "") }); c.innerHTML = `<img src="${heroes[id + ":" + face]}"><span class="nm">${nm}</span><span class="ln">${talk.go[id][0]}</span>`; grid.append(c); }
    body.append(grid, U.el("div", { class: "rg-note", html: "のこりの 2人は うしろで おうえん するよ" }));
    UI.modal({ title: "🎯 " + talk.pick, body, footer: UI.btn("この子で うつ", () => {}, "yellow wide") });
  }, { heroes: HEROES, talk: RD.talk });
  await page.waitForTimeout(500); await shot(page, "c", "だれが うつ？（1人を えらぶ。2人は おうえん）");
}
// ④ じゅうを えらぶ
async function gunSelect(page, cat, sel, lockCat) {
  await page.evaluate(({ cat, sel, lockCat }) => {
    const RD = __RD, body = U.el("div"), tabs = U.el("div", { class: "rg-tabs" });
    for (const [c, v] of Object.entries(RD.cats)) { const t = U.el("button", { class: "tab" + (c === cat ? " on" : "") + (c === lockCat ? " lock" : ""), html: (c === lockCat ? "🔒 " : "") + v.short }); tabs.append(t); }
    body.append(tabs);
    const list = U.el("div", { class: "rg-guns" }), best = { auto: 2, revolver: 1, classic: 0, carbine: 1, lever: 0, match: 0 };
    for (const g of RD.guns.filter((x) => x.cat === cat)) { const b = U.el("button", { class: "rg-gun" + (g.id === sel ? " on" : "") }); const n = best[g.id] || 0; b.innerHTML = `<span class="art">${__GA.svg(g, { px: g.cat === "hand" ? 0.52 : 0.14, uid: "sel" + g.id })}</span><span><span class="nm">${g.name}</span><br><span class="sub">たま ${g.mag}・${g.auto ? "おしっぱなしで れんしゃ" : g.zoom ? "スコープ ×" + g.zoom : "1ぱつずつ"}</span><br><span class="best">${"★".repeat(n)}${"☆".repeat(3 - n)}</span></span>`; list.append(b); }
    body.append(list);
    const g = RD.guns.find((x) => x.id === sel), bar = (v, m) => `<span class="bar"><i style="width:${Math.round(Math.min(1, v / m) * 100)}%"></i></span>`;
    body.append(U.el("div", { class: "rg-detail", html: `<div class="desc">${g.desc}</div><div class="rg-stats"><span>たまの かず</span>${bar(g.mag, 30)}<span>れんしゃ</span>${bar(g.rate, 8)}<span>ねらいやすさ</span>${bar(8 - g.spread, 7.5)}<span>はねあがり</span>${bar(g.recoil, 18)}</div><div class="fact"><b>まめちしき</b>${g.fact}</div>` }));
    UI.modal({ title: "🎯 じゅうを えらぶ", body, footer: UI.btn("これで あそぶ", () => {}, "yellow wide") });
  }, { cat, sel, lockCat });
  await page.waitForTimeout(500);
}
{ const page = await gamePage([390, 844]); await gunSelect(page, "hand", "auto", "sniper"); await shot(page, "d", "じゅうを えらぶ（ライフルは ハンドガンで ★1、スナイパーは ライフルで ★1 で あそべる）"); }
// ⑤⑥⑦ 主観の 画面
{ const page = await gamePage([390, 844]); await fpv(page, { gun: "auto", who: "wanko", seed: "m5", secs: 7.3, skill: "casual", hint: "ゆびで ずらして ねらい、「うつ」", buddies: [["gachan", "sparkle", RD.talk.cheer.gachan.hit[1]], ["goji", "love", ""]] }); await shot(page, "e", "ハンドガン（わんこ・オートマチック）: ちかくの まと。かん・ぴょこっと まと・レール"); }
{ const page = await gamePage([390, 844]); await fpv(page, { gun: "carbine", who: "gachan", seed: "m6", secs: 9.6, skill: "good", buddies: [["wanko", "surprise", RD.talk.cheer.wanko.combo[0]], ["goji", "love", ""]] }); await shot(page, "f", "ライフル（がちゃん・カービン）: ふうせん・レール・ふりこの まと・ほし"); }
{ const page = await gamePage([390, 844]); await fpv(page, { gun: "heavy", who: "goji", seed: "m7", secs: 12.4, skill: "good", buddies: [["wanko", "smile", ""], ["gachan", "smile", RD.talk.cheer.gachan.hit[0]]] }); await shot(page, "g", "スナイパー（ごじ・ヘビー ボルト）: スコープで とおくの まと・かね（ゆれに あわせて うつ）"); }
// ⑧ けっか
{
  const page = await gamePage([390, 844]);
  await page.evaluate(({ heroes }) => {
    const RD = __RD, RR = __RR, g = new RR.Game(RD, "auto", { seed: "m8", W: 360, H: 780 }); let n = 0; while (g.phase !== "end" && n++ < 4000) g.update(1 / 60, RR.bot(g, "casual"));
    const body = U.el("div", { class: "rg-result" });
    body.innerHTML = `<div class="stars">${"★".repeat(g.stars)}<span class="off">${"★".repeat(3 - g.stars)}</span></div><div class="score">${g.score} てん</div><div class="sub">あてた ${g.hits} / ${g.shots}ぱつ・いちばん れんぞく ${g.maxCombo}</div><div class="coins"><i class="coin-ico"></i> ${g.coins} コイン</div><div class="sub">${RD.talk.result[g.stars]}</div>
      <div class="says">${[["wanko", "smile", RD.talk.cheer.wanko.end[0]], ["gachan", "sparkle", RD.talk.cheer.gachan.end[0]], ["goji", "love", RD.talk.cheer.goji.end[0]]].map(([id, f, t]) => `<div class="say"><img src="${heroes[id + ":" + f]}">${t}</div>`).join("")}</div>`;
    const foot = U.el("div", { style: "display:flex;gap:8px;flex:1" }); foot.append(UI.btn("もう いちど", () => {}, "yellow"), UI.btn("じゅうを かえる", () => {}, ""), UI.btn("おわる", () => {}, "")); for (const b of foot.children) { b.style.flex = "1"; b.style.minHeight = "48px"; b.style.padding = "6px 2px"; b.style.fontSize = "13px"; }
    UI.modal({ title: "🎉 けっか（ハンドガン・ちかくの まと）", body, footer: foot });
  }, { heroes: HEROES });
  await page.waitForTimeout(500); await shot(page, "h", "けっか（★・てん・コイン・3人の ひとこと）");
}
await png(`<div style="padding:20px 24px"><div style="font-size:26px;font-weight:800">射撃場: スマホの 画面（390×844・ゲームの 上に 重ねて 撮影）</div><div style="font-size:14px;margin:4px 0 14px;max-width:1180px">1人が 目の たかさの 主観で うつ（したに その子の 手と じゅう）。のこりの 2人は ひだりしたで おうえん。まとは 紙の まと・かん・ふうせん・ほし・かね だけ。ゆびで ずらして ねらい、右したの「うつ」で うつ。スナイパーは「スコープ」で ×2.5〜4。</div><div style="display:grid;grid-template-columns:repeat(4,auto);gap:16px 18px;justify-content:start">${["a", "b", "c", "d", "e", "f", "g", "h"].map((k, i) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px;max-width:270px">${"①②③④⑤⑥⑦⑧"[i]} ${CAP[k]}</div><img src="${b64(shots[k])}" style="width:270px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "range-flow.png", { width: 1200, height: 900 });
// 3) 小さい スマホ（375×667）
{ const page = await gamePage([375, 667]); await fpv(page, { gun: "classic", who: "gachan", seed: "s1", secs: 6.2, skill: "casual", buddies: [["wanko", "smile", RD.talk.cheer.wanko.hit[0]], ["goji", "love", ""]] }); await shot(page, "i", "主観の 画面"); }
{ const page = await gamePage([375, 667]); await gunSelect(page, "rifle", "match", ""); await shot(page, "j", "じゅうを えらぶ"); }
await png(`<div style="padding:20px 24px"><div style="font-size:22px;font-weight:800;margin-bottom:10px">小さい スマホ（375×667）</div><div style="display:flex;gap:20px">${["i", "j"].map((k) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px">${CAP[k]}</div><img src="${b64(shots[k])}" style="width:300px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "small-phone.png", { width: 700, height: 700 });
await browser.close();
console.log("range mock: gun-sheet.png / range-flow.png / small-phone.png");
