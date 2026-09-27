// ③ 釣りの 見本画像: ゲームを 実際に 動かし、その 上に 釣りの 画面（fishing-ref.js）・つれたカード・ずかん を 出して 撮る。
// あわせて 魚 50種の 絵の 一覧（fish-sheet-1〜3.png）を 作る。
import { readFileSync } from "node:fs";
import { launch, TMP } from "../town-design/paths.mjs";
const OUT = new URL("../../docs/design/features/fishing/", import.meta.url).pathname, IMG = OUT + "img/";
const GAME = new URL("../../index.html", import.meta.url).href;
const ART = readFileSync(new URL("./fish-art-ref.js", import.meta.url), "utf8"), REF = readFileSync(new URL("./fishing-ref.js", import.meta.url), "utf8");
const CSS = readFileSync(new URL("./fishing-ui.css", import.meta.url), "utf8");
const DATA = JSON.parse(readFileSync(OUT + "fishing.json", "utf8"));
const browser = await launch();

async function open(vp) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME);
  await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => PokaDebug.newGame());
  await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  await page.evaluate(({ art, ref, data }) => {
    eval(art + ";" + ref + ";window.__FA=FishArtRef;window.__FR=FishingRef;"); window.__D = data;
    const P = { pond: "いけ", river: "かわ", stream: "さわ", beach: "うみべ", harbor: "みなと" };
    window.__H = {
      fish: (id) => __D.fish.find((f) => f.id === id),
      svg: (f, uid) => __FA.svg(f.art, { uid: uid || "m" + f.id, flip: !!f.flip }),
      img: (svg) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }),
      // 釣りの 画面を 1まい つくる（ゲームの 上に かさねる）
      async scene({ place, time, phase, t = 0, fish, tension = 0.5, prog = 0.4, talk = "", faces, btn, meter = false }) {
        PokaDebug.pause(true);
        const root = U.el("div", { class: "fish-scene" }), cv = document.createElement("canvas"), W = G.W, H = G.H, px = 2;
        cv.width = Math.round(W * px); cv.height = Math.round(H * px); root.append(cv); UI.root.append(root);
        const ctx = cv.getContext("2d"); ctx.scale(px, px);
        const heroes = ["goji", "gachan", "wanko"], size = __FR.heroSize(W);
        const fc = faces || { wanko: "normal", gachan: "normal", goji: "normal" };
        await Chara.preload(heroes.map((id) => [id, { pose: "idle_01", dir: "right", face: fc[id], outfit: Save.d.chars[id].outfit, color: Save.d.chars[id].color }]), size);
        const f = __H.fish(fish), g = new __FR.Game(f); g.phase = phase; g.t = t; g.waitFor = 3; g.tension = tension; g.prog = prog;
        const sh = await __H.img(__FA.shadow(__FR.shadowOf(f)));
        __FR.draw(ctx, W, H, { place, time, game: g, t: 1.3, heroes, faces: fc, shadowImg: sh, px: 1, nib: talk.includes("ちょん"),
          charDraw: (c, id, face, x, y, s, dir) => Chara.draw(c, id, { pose: "idle_01", dir, face, outfit: Save.d.chars[id].outfit, color: Save.d.chars[id].color }, x, y, s) });
        const top = U.el("div", { class: "fish-top" }); top.innerHTML = `<div class="pill place">🎣 ${{ pond: "タウンの いけ", river: "はらっぱの かわ", stream: "もりの さわ", beach: "しおかぜビーチ", harbor: "あおぞらポートの ていぼう" }[place]}</div><div class="grow"></div>`; top.append(UI.btn("やめる", () => {}, "small")); root.append(top);
        if (talk) root.append(U.el("div", { class: "fish-talk", html: `<span>${talk}</span>` }));
        const ctrl = U.el("div", { class: "fish-ctrl" });
        if (meter) ctrl.append(U.el("div", { class: "fish-meter", html: `<div class="lbl"><span>いとの ぴんと ぐあい</span><span>${tension > 0.8 ? "あぶない！" : tension < 0.2 ? "ゆるい" : "いいかんじ！"}</span></div><div class="fish-gauge"><i style="left:${Math.round(tension * 100)}%"></i></div><div class="lbl" style="margin-top:6px"><span>ひきよせ</span><span>${Math.round(prog * 100)}%</span></div><div class="fish-prog"><i style="width:${Math.round(prog * 100)}%"></i></div>` }));
        const b = U.el("button", { class: "btn fish-btn " + (btn.cls || ""), html: btn.html }); if (btn.disabled) b.disabled = true; ctrl.append(b); root.append(ctrl);
      },
      card(id, sizeCm, first) {
        const f = __H.fish(id), body = U.el("div", { class: "fish-card" });
        body.innerHTML = `<div class="art">${first ? '<span class="badge">はじめて！</span>' : ""}${__H.svg(f, "c" + id)}</div><div class="nm">${f.name}</div><div class="sz">${sizeCm}cm <span class="star">${"★".repeat(f.rarity)}${"☆".repeat(5 - f.rarity)}</span></div><div class="desc">${f.desc}</div><div class="fact"><b>まめちしき</b>${f.fact}</div><div class="acts"></div>`;
        const acts = body.querySelector(".acts"); acts.append(UI.btn("いけすへ", () => {}, "yellow"), UI.btn("にがす", () => {}), UI.btn(`うる ${f.sell}`, () => {}));
        return UI.modal({ title: "つれた！", body });
      },
      dex(caught, tab) {
        const body = U.el("div"), n = Object.keys(caught).length;
        body.innerHTML = `<div class="fish-dex-head"><span class="cnt">${n} / ${__D.fish.length} しゅ</span><span class="muted">つった ことの ある 魚だけ 絵が でるよ</span></div>`;
        const tabs = U.el("div", { class: "fish-dex-tabs" }); for (const [k, v] of [["all", "ぜんぶ"], ["pond", "いけ"], ["river", "かわ"], ["stream", "さわ"], ["beach", "うみべ"], ["harbor", "みなと"]]) tabs.append(U.el("button", { class: "tab" + (k === tab ? " on" : ""), text: v })); body.append(tabs);
        const grid = U.el("div", { class: "fish-dex" });
        __D.fish.forEach((f, i) => { if (tab !== "all" && f.place !== tab && !(f.also || []).includes(tab)) return; const c = caught[f.id]; const cell = U.el("div", { class: "fish-cell" + (c ? "" : " unknown") }); cell.innerHTML = `<span class="no">${i + 1}</span>${c && c.isNew ? '<span class="new">NEW</span>' : ""}${__H.svg(f, "d" + f.id)}<div class="nm">${c ? f.name : "？？？"}</div>`; grid.append(cell); });
        body.append(grid);
        return UI.modal({ title: "🐟 さかな ずかん", body, cls: "full" });
      },
      detail(id, rec) {
        const f = __H.fish(id), body = U.el("div", { class: "fish-card fish-detail" }), SE = { spring: "はる", summer: "なつ", autumn: "あき", winter: "ふゆ" }, TI = { morning: "あさ", day: "ひる", evening: "ゆうがた", night: "よる", late: "しんや" };
        const L = (v, M) => (v === "all" ? "いつでも" : v.map((x) => M[x]).join("・"));
        body.innerHTML = `<div class="art">${__H.svg(f, "x" + id)}</div><div class="nm">${f.name}</div><div class="star">${"★".repeat(f.rarity)}${"☆".repeat(5 - f.rarity)}</div><div class="facts"><span>すんで いる ところ</span><span>${[f.place, ...(f.also || [])].map((p) => P[p]).join("・")}</span><span>つれる きせつ</span><span>${L(f.season, SE)}</span><span>つれる じかん</span><span>${L(f.time, TI)}</span><span>おおきさ</span><span>${f.size[0]}〜${f.size[1]}cm</span><span>いちばん おおきい</span><span>${rec.max}cm（${rec.n}ひき つった）</span></div><div class="desc">${f.desc}</div><div class="fact"><b>まめちしき</b>${f.fact}</div>`;
        return UI.modal({ title: "🐟 " + f.name, body });
      },
    };
  }, { art: ART, ref: REF, data: DATA });
  return page;
}
const shot = async (page, name) => { await page.waitForTimeout(450); const p = `${TMP}fish-${name}.png`; await page.screenshot({ path: p }); await page.close(); return p; };
const shots = {};
const S = [
  ["a", [390, 844], { place: "pond", time: "day", phase: "ready", fish: "magoi", talk: "みずべで「なげる」を おしてね", btn: { html: "なげる" } }],
  ["b", [390, 844], { place: "river", time: "morning", phase: "wait", t: 2.1, fish: "ayu", talk: "ちょん…ちょん… まだ まって！", btn: { html: "まつ…", disabled: true } }],
  ["c", [390, 844], { place: "beach", time: "evening", phase: "bite", fish: "madai", talk: "ぐいっ！ いまだ！", faces: { wanko: "surprise", gachan: "sparkle", goji: "surprise" }, btn: { html: "つる！<small>いま タップ</small>", cls: "go" } }],
  ["d", [390, 844], { place: "harbor", time: "night", phase: "reel", fish: "tachiuo", tension: 0.62, prog: 0.55, talk: "おしつづけて まく！ あかく なったら はなす", faces: { wanko: "smile", gachan: "sparkle", goji: "shout" }, btn: { html: "まく<small>おしつづける</small>", cls: "reel" }, meter: true }],
];
for (const [k, vp, sc] of S) { const page = await open(vp); await page.evaluate((sc) => __H.scene(sc), sc); shots[k] = await shot(page, k); }
{ const page = await open([390, 844]); await page.evaluate(() => __H.card("madai", 52.3, true)); shots.e = await shot(page, "e"); }
const CAUGHT = Object.fromEntries(["magoi", "kingyo", "ginbuna", "medaka", "motsugo", "ayu", "oikawa", "ugui", "kawamutsu", "yamame", "yoshinobori", "iwana", "aji", "kisu", "haze", "kasago", "madai", "saba", "iwashi", "mebaru"].map((id, i) => [id, { n: 1 + (i % 4), max: 20, isNew: i === 16 }]));
{ const page = await open([390, 844]); await page.evaluate((c) => __H.dex(c, "all"), CAUGHT); shots.f = await shot(page, "f"); }
{ const page = await open([390, 844]); await page.evaluate(() => __H.detail("ayu", { max: 23.6, n: 3 })); shots.g = await shot(page, "g"); }
{ const page = await open([375, 667]); await page.evaluate(() => __H.scene({ place: "harbor", time: "night", phase: "reel", fish: "tachiuo", tension: 0.86, prog: 0.7, talk: "あかい ところ！ いちど はなして！", faces: { wanko: "surprise", gachan: "cry", goji: "shout" }, btn: { html: "まく<small>おしつづける</small>", cls: "reel" }, meter: true })); shots.h = await shot(page, "h"); }
{ const page = await open([375, 667]); await page.evaluate(() => __H.card("ryugunotsukai", 382.5, true)); shots.i = await shot(page, "i"); }

const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const CAP = { a: "① なげる（いけ・ひる）", b: "② まつ: 魚の かげが 近づく（かわ・あさ）", c: "③ ぐいっ！ で タップ（うみべ・ゆうがた）", d: "④ まく: いとの ぴんと ぐあい（みなと・よる）", e: "⑤ つれた！（はじめての 魚）", f: "⑥ さかな ずかん（50しゅ）", g: "⑦ ずかんの くわしい ページ" };
const card = (k) => `<div><div class="t">${CAP[k]}</div><img src="${b64(shots[k])}" style="width:250px"></div>`;
const page0 = await browser.newPage({ viewport: { width: 1140, height: 900 } });
await page0.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.w{padding:20px 24px}.h{font-size:26px;font-weight:800}.s{font-size:14px;margin:4px 0 14px;max-width:1080px}.g{display:grid;grid-template-columns:repeat(4,auto);gap:16px 18px;justify-content:start}.t{font-weight:800;font-size:13px;margin-bottom:5px;max-width:250px}img{border-radius:12px;border:4px solid #3C352E;display:block}</style><body><div class="w"><div class="h">釣り: 画面の 見本（390×844・ゲームの 上に 重ねて 撮影）</div><div class="s">水べで「つる」→ よこから 見た 釣りの 画面へ。3にんは いっしょに 岸に 立ち、1人が さおを もって 2人が おうえんする。ぐいっ！ の あいだに タップ → おしつづけて まく（あかい ところで はなす）。つれた 魚は ずかんに のり、いけすに いれる・にがす・うる を えらぶ。</div><div class="g">${["a", "b", "c", "d", "e", "f", "g"].map(card).join("")}</div></div></body>`);
await page0.waitForTimeout(400); await page0.screenshot({ path: IMG + "fishing-flow.png", fullPage: true }); await page0.close();
const page1 = await browser.newPage({ viewport: { width: 700, height: 700 } });
await page1.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}.w{padding:20px 24px}.h{font-size:22px;font-weight:800;margin-bottom:10px}.r{display:flex;gap:20px}.t{font-weight:800;font-size:13px;margin-bottom:5px}img{border-radius:12px;border:4px solid #3C352E;display:block}</style><body><div class="w"><div class="h">小さい スマホ（375×667）</div><div class="r"><div><div class="t">まく（あぶない！）</div><img src="${b64(shots.h)}" style="width:300px"></div><div><div class="t">つれた！（でんせつ）</div><img src="${b64(shots.i)}" style="width:300px"></div></div></div></body>`);
await page1.waitForTimeout(400); await page1.screenshot({ path: IMG + "small-phone.png", fullPage: true }); await page1.close();

// 魚 50種の 絵の 一覧（3まい）
const P = { pond: "いけ", river: "かわ", stream: "さわ", beach: "うみべ", harbor: "みなと" };
for (let s = 0; s < 3; s++) {
  const list = DATA.fish.slice(s * 17, s * 17 + 17);
  const pg = await browser.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1.5 });
  await pg.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#EAF4F7;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E"><div style="padding:16px 20px"><div style="font-size:22px;font-weight:800">魚の 絵 ${s + 1}/3（fish-art-ref.js・${s * 17 + 1}〜${s * 17 + list.length}）</div><div id="w" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px"></div></div><script>${ART}
const L=${JSON.stringify(list.map((f, i) => [s * 17 + i + 1, f.id, f.name, f.art, !!f.flip, f.size, P[f.place], f.rarity]))};
for(const [no,id,name,a,flip,size,pl,r] of L){const d=document.createElement("div");d.style.cssText="background:#fff;border:3px solid #3C352E;border-radius:14px;padding:6px 8px;text-align:center";d.innerHTML='<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:#8a7d6a"><span>'+no+'. '+id+'</span><span>'+pl+' '+'★'.repeat(r)+'</span></div>'+FishArtRef.svg(a,{uid:"s"+id,flip}).replace("<svg ",'<svg style="width:100%;height:120px" ')+'<div style="font-weight:800">'+name+' <span style="font-size:12px;color:#9a6a00">'+size[0]+'〜'+size[1]+'cm</span></div>';document.getElementById("w").append(d);}
</script>`);
  await pg.waitForTimeout(500); await pg.screenshot({ path: IMG + `fish-sheet-${s + 1}.png`, fullPage: true }); await pg.close();
}
await browser.close();
console.log("fishing mock: fishing-flow.png / small-phone.png / fish-sheet-1〜3.png");
