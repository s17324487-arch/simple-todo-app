// ⑥ 射撃場の 見本画像: じゅう 9しゅの 一覧・BB弾の 弾道の グラフ・スマホの 画面（ゲームの 上に 重ねて 撮影）・小さい スマホ
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
// 3にんの かお（おうえん・だれが うつ？）と レンジ オフィサー
const hero = (id, face, size = 64) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${Math.round(size * 1.12)}" width="${size * 2}" height="${Math.round(size * 2.24)}">${heroSvg(id, size / 2, size * 1.08, { dir: "down", face, size })}</svg>`);
const FACE = { wanko: ["smile", "surprise"], gachan: ["smile", "sparkle"], goji: ["love", "shout"] };
const HEROES = Object.fromEntries(Object.keys(FACE).flatMap((id) => FACE[id].map((f) => [id + ":" + f, hero(id, f)])));
const STAFF = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 66">${npcSvg({ sp: RD.staff.sp, outfit: RD.staff.outfit, dir: "down" }, 30, 64, { size: 56 })}</svg>`);
const POWER = { gbb: "ガス ブローバック", gas: "ガス", aeg: "でんどう", spring: "エアー コッキング" }, ACTION = { semi: "セミオート", da: "ダブル アクション", auto: "フルオート", lever: "レバー", bolt: "ボルト", single: "1ぱつずつ" };

// 1) じゅう 9しゅの 一覧（実物の 長さ・高さの 比・性能）
{
  const bar = (v, max) => `<span style="display:block;height:9px;border:2px solid #1F1D1B;border-radius:6px;background:#fff;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(Math.max(0.04, Math.min(1, v / max)) * 100)}%;background:#7EC8F0"></i></span>`;
  const row = (k, v, max, txt) => `<span>${k}</span>${bar(v, max)}<span style="color:#6a5d4a">${txt}</span>`;
  const card = (g) => `<div style="background:#fff;border:3px solid #3C352E;border-radius:14px;padding:10px 12px;width:470px">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><span style="background:${{ hand: "#FFE3EC", rifle: "#DFF3FF", sniper: "#E3F5D4" }[g.cat]};border:2px solid #1F1D1B;border-radius:8px;padding:0 6px;font-size:12px;font-weight:800">${RD.cats[g.cat].name}</span><b style="font-size:18px">${g.name}</b><span style="font-size:12px;color:#8a7d6a">${g.len}×${g.h}mm・${POWER[g.power]}・${ACTION[g.action]}</span></div>
    <div style="height:${g.cat === "hand" ? 250 : 150}px;display:grid;place-items:center;background:linear-gradient(#F4F7FA,#E4EBF1);border:2px solid #1F1D1B;border-radius:10px;margin:6px 0">${GA.svg(g, { px: g.cat === "hand" ? 1.2 : 0.39, uid: "sh" + g.id })}</div>
    <div style="font-size:11px;color:#8a7d6a;font-weight:700">参考: ${g.ref}</div>
    <div style="display:grid;grid-template-columns:max-content 1fr max-content max-content 1fr max-content;gap:3px 7px;align-items:center;font-size:11px;font-weight:800;margin:6px 0;white-space:nowrap">
      ${row("しょそく", g.v0, 100, `${g.v0}m/s（${g.bb}g・${(0.5 * g.bb / 1000 * g.v0 * g.v0).toFixed(2)}J）`)}${row("まとまり", 6 - g.group, 5.7, `10mで ${g.group}cm`)}
      ${row("れんしゃ", g.rate, 14, `${g.rate}はつ/びょう`)}${row("たま", g.mag, 30, `${g.mag}はつ`)}
      ${row("はねあがり", g.recoil, 12, `${g.recoil}mrad`)}${row("おもさ", g.weight, 4.5, `${g.weight}kg`)}
      ${row("ばいりつ", Array.isArray(g.zoom) ? g.zoom[1] : g.zoom, 12, Array.isArray(g.zoom) ? `${g.zoom[0]}〜${g.zoom[1]}ばい` : `×${g.zoom}`)}${row("ゼロイン", g.zero, 30, `${g.zero}m`)}
    </div>
    <div style="font-size:13px;font-weight:700;white-space:pre-line;line-height:1.45">${g.desc}</div>
    <div style="margin-top:5px;background:#FFF3C4;border:2px dashed #d9b64a;border-radius:10px;padding:4px 8px;font-size:12px;font-weight:700;white-space:pre-line;line-height:1.45"><b style="font-size:11px;color:#9a6a00">まめちしき</b><br>${g.fact}</div></div>`;
  await png(`<div style="padding:18px 22px"><div style="font-size:26px;font-weight:800">射撃場の エアソフトガン 9しゅ（実物の 長さ・高さの 比の まま・右がわから 見た ところ）</div><div style="font-size:14px;margin:4px 0 12px;max-width:1440px">名前・絵は オリジナル（刻印・ロゴなし）。日本の エアソフトガンと 同じく じゅうこうの さきは オレンジに しない。エネルギーは ぜんぶ 0.98J いか。ハンドガンは 1mm = 1.2px、ライフルと スナイパーは 1mm = 0.39px（同じ しゅるいは 同じ 縮尺）。数は GUN_LIST.md。</div>
    ${["hand", "rifle", "sniper"].map((c) => `<div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start">${RD.guns.filter((g) => g.cat === c).map(card).join("")}</div>`).join("")}</div>`, IMG + "gun-sheet.png", { width: 1500, height: 900 });
}

// 2) BB弾の 弾道（range-ref.js の ballistics と 同じ 計算）。色は dataviz の 3色（青・オレンジ・アクア）＋ 線の かたちで 見わける・線の はしに 名前
{
  const COL = ["#2a78d6", "#eb6834", "#1baf7a"], DASH = ["", "7 4", "2 3"], INK = "#0b0b0b", SUB = "#52514e", GRID = "#e6e3dc";
  const gun = (id) => RD.guns.find((g) => g.id === id), B = RD.ballistics, xs = Array.from({ length: 71 }, (_, i) => i);
  const path = (g, hop, f) => { const b = RR.ballistics(g, hop, B); return xs.map((d) => [d, f(b.at(d), d, g)]); };
  let uid = 0;
  const chart = ({ title, note, yMin, yMax, yStep, unit, series }) => {
    const w = 470, h = 330, L = 56, R = 104, T = 58, Bm = 44, pw = w - L - R, ph = h - T - Bm, id = "clip" + ++uid;
    const X = (x) => L + (x / 70) * pw, Y = (y) => T + ((yMax - y) / (yMax - yMin)) * ph;
    let s = `<rect width="${w}" height="${h}" rx="12" fill="#fcfcfb" stroke="#d8d4ca"/><text x="16" y="24" font-size="15" font-weight="800" fill="${INK}">${title}（${unit}）</text><text x="16" y="42" font-size="11.5" fill="${SUB}">${note}</text>`;
    s += `<clipPath id="${id}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath>`;
    for (let y = yMin; y <= yMax + 1e-9; y += yStep) s += `<path d="M${L},${Y(y)} H${L + pw}" stroke="${y === 0 ? "#9a968c" : GRID}" stroke-width="${y === 0 ? 1.4 : 1}"/><text x="${L - 6}" y="${Y(y) + 4}" font-size="11" text-anchor="end" fill="${SUB}">${y > 0 ? "+" : ""}${y}</text>`;
    for (let x = 0; x <= 70; x += 10) s += `<path d="M${X(x)},${T + ph} v4" stroke="${SUB}"/><text x="${X(x)}" y="${T + ph + 17}" font-size="11" text-anchor="middle" fill="${SUB}">${x}m</text>`;
    const ends = [];
    series.forEach((se, i) => {
      s += `<path clip-path="url(#${id})" d="${se.pts.map(([x, y], j) => `${j ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ")}" fill="none" stroke="${COL[i]}" stroke-width="2" stroke-dasharray="${DASH[i]}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const last = [...se.pts].reverse().find(([, y]) => y >= yMin && y <= yMax) || se.pts[0];
      ends.push({ i, x: X(last[0]), y: Y(last[1]), name: se.name, out: last[0] < 70 });
    });
    // 名前は 線の はし（かさならない ように たてに ずらす）。色は 線の しるし だけ、文字は インクの 色
    ends.sort((a, b) => a.y - b.y); for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
    for (const e of ends) { const px = e.out ? e.x : L + pw, label = e.name + (e.out ? " ↓" : ""), tw = [...label].length * 11.5, right = px + 10 + tw <= w - 6; s += `<circle cx="${px}" cy="${e.y}" r="4" fill="${COL[e.i]}" stroke="#fcfcfb" stroke-width="2"/><text x="${right ? px + 10 : px - 10}" y="${e.y + 4}" font-size="11.5" font-weight="700" text-anchor="${right ? "start" : "end"}" fill="${INK}">${label}</text>`; }
    // はんれい（2しゅ いじょう なので かならず）
    let lx = L; s += series.map((se, i) => { const g = `<g transform="translate(${lx} ${h - 12})"><path d="M0,-4 H18" stroke="${COL[i]}" stroke-width="2.5" stroke-dasharray="${DASH[i]}"/><text x="23" y="0" font-size="11" fill="${INK}">${se.name}</text></g>`; lx += 23 + [...se.name].length * 11 + 16; return g; }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="'Noto Sans CJK JP',sans-serif">${s}</svg>`;
  };
  const trio = [["auto", "ハンドガン"], ["carbine", "ライフル"], ["bolt", "スナイパー"]];
  const A = chart({ title: "ねらった 点からの 高さ", note: "ホップ ダイヤル 10。ハンドガン・ライフル・スナイパーは 10 / 20 / 30m で あう", yMin: -150, yMax: 25, yStep: 25, unit: "cm",
    series: trio.map(([id]) => ({ name: gun(id).name, pts: path(gun(id), gun(id).hop, (a) => a.y * 100) })) });
  const bolt = gun("bolt");
  const Bc = chart({ title: "ホップ ダイヤルの ちがい", note: "ボルトアクション。つよく すると とおくで おちにくいが 30〜50m で 上に あがる", yMin: -200, yMax: 75, yStep: 25, unit: "cm",
    series: [5, 10, 15].map((st) => ({ name: `ダイヤル ${st}`, pts: path(bolt, RR.hopAt(bolt, st, B), (a) => a.y * 100) })) });
  const Cc = chart({ title: "よこかぜ 1m/s で ながれる はば", note: "かぜ ×（とぶ 時間 − くうきが ない ときの 時間）。とおいほど ふえる", yMin: 0, yMax: 180, yStep: 30, unit: "cm",
    series: trio.map(([id]) => ({ name: gun(id).name, pts: path(gun(id), gun(id).hop, (a, d, g) => RR.drift(g, d, a.t, 1) * 100) })) });
  await png(`<div style="padding:18px 22px"><div style="font-size:24px;font-weight:800">BB弾の 弾道（くうきの ていこう ＋ ホップの 浮く 力 ＋ じゅうりょく・range-ref.js の ballistics と 同じ 計算）</div><div style="font-size:13px;margin:4px 0 12px">数の 表は GUN_LIST.md の「弾道」。ゲームに 移した あとも この 線と 同じ に なる ことを たしかめる（1m ごとの 表・10m で 1cm = 1mrad）。</div><div style="display:flex;gap:16px">${A}${Bc}${Cc}</div></div>`, IMG + "ballistics.png", { width: 1480, height: 420 });
}

// 3) ゲームの 上に 重ねて 撮る（シティに 射撃場を たてる・外がわは town-renewal-art.js と 同じ 200×160 の デザイン）
async function gamePage(vp, where) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(GAME); await page.waitForFunction(() => typeof PokaDebug !== "undefined", null, { timeout: 20000 });
  await page.evaluate(() => PokaDebug.newGame()); await page.waitForFunction(() => G.sceneName === "house" && PokaDebug.idle(), null, { timeout: 15000 });
  await page.addStyleTag({ content: CSS });
  const o = where || { map: "city", x: RD.outside.front[0], y: RD.outside.front[1] + 2 };
  await page.evaluate(({ art, ref, rd, o }) => {
    eval(art + ";" + ref + ";window.__GA=GunArtRef;window.__RR=RangeRef;"); window.__RD = rd;
    const d = MAP_DEFS[rd.outside.map], b = rd.outside, rows = d.rows.map((r) => r.split(""));
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) rows[y][x] = "#";
    rows[b.doorAt[1]][b.doorAt[0]] = "D"; d.rows = rows.map((r) => r.join(""));
    d.buildings.push({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, door: b.door, label: b.label, style: b.style, act: { type: "range" } });
    // town-renewal-art.js の つつみかたと 同じ（入口の とびら・ガラス・とって・ステップ）
    const base = WorldArt.building, R = (x, y, w, h, c, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" ${OS(1.7)}/>`;
    WorldArt.building = (sp) => {
      if (sp.style !== b.style) return base(sp);
      const w = sp.w * TS, h = sp.h * TS + 24, dx = ((sp.door + 0.5) / sp.w) * 200;
      const svg = __RR.facade200() + R(dx - 12, 117, 24, 36, "#839FA3") + R(dx - 9, 121, 18, 19, "#B8DADF") + `<circle cx="${dx + 7}" cy="145" r="1.4" fill="#EDD5A4" ${OS(1.5)}/>` + R(dx - 16, 153, 32, 6, "#D4C4AE");
      return { w, h, svg: `<g transform="scale(${w / 200} ${h / 160})">${svg}</g>` };
    };
    Save.d.flags.intro = true; Save.d.flags["visit_" + o.map] = true; PokaDebug.hour(11); PokaDebug.teleport(o.map, o.x, o.y, "up");
  }, { art: GART, ref: RREF, rd: RD, o });
  await page.waitForFunction(() => G.sceneName === "world" && PokaDebug.idle() && !document.querySelector(".house-bar"), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  // 射撃場の 画面を つくる 道具（ページの 中）
  await page.evaluate(() => {
    const T = __RD.talk, NAME = { wanko: "わんこ", gachan: "がちゃん", goji: "ごじ" };
    const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    window.__rangeShot = async (o, heroes) => {
      const RD = __RD, RR = __RR, vw = innerWidth, vh = innerHeight, W = 360, H = Math.round((360 * vh) / vw);
      const sc = U.el("div", { class: "range-scene" }), cv = document.createElement("canvas"); cv.width = vw * 2; cv.height = vh * 2; sc.append(cv); UI.root.append(sc);
      const c2 = cv.getContext("2d"); c2.setTransform((vw * 2) / W, 0, 0, (vw * 2) / W, 0, 0);
      const imgs = {}, load = (key, svg) => new Promise((res) => { const im = new Image(); im.onload = () => { imgs[key] = im; res(); }; im.onerror = () => res(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
      const gun = RD.guns.find((g) => g.id === o.gun);
      await Promise.all(RR.artKeys(RD).map((k) => load(k.key, k.make())).concat(load("fpv", RR.fpvSvg(gun, o.who, "soft").svg)));
      const g = new RR.Game(RD, o.course, o.gun, { seed: o.seed, W, H, who: o.who, hopStep: o.hop });
      // じどうで すすめて、o.until の ところで とめる
      const u = o.until || {}; let after = null;
      for (let i = 0; i < (o.max || 150) * 60 && g.phase !== "end"; i++) {
        const inp = RR.bot(g, o.skill || "good"); if (o.noAds) inp.ads = false; g.update(1 / 60, inp);
        const ok = ["phase", "string", "series", "run", "shots", "hits", "clock", "hold"].every((k) => u[k] == null || (k === "phase" ? g.phase === u.phase : k === "hold" ? g.breath.hold === u.hold : k === "clock" ? g.clock >= u.clock : (g[k] || 0) >= u[k]));
        if (ok && after == null) after = u.after || 0;
        if (after != null) { after -= 1 / 60; if (after <= 0) break; }
      }
      RR.draw(c2, g, { img: (k) => imgs[k] });
      const h = g.hud(), pill = (x, cls = "") => `<span class="pill ${cls}">${x}</span>`;
      // うえ（1だんめ）
      const top = U.el("div", { class: "range-top" }), p = [];
      if (h.kind === "steel") p.push(pill(`ストリング <b>${h.string}/${h.strings}</b>`), pill(`⏱ <b>${(h.phase === "play" ? h.clock : 0).toFixed(2)}</b>`));
      if (h.kind === "bull") p.push(pill(`シリーズ <b>${h.series}/${h.seriesN}</b>`), pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`, h.left <= 20 ? "warn" : ""));
      if (h.kind === "issf") p.push(pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`, h.left <= 20 ? "warn" : ""));
      if (h.kind === "ipsc") p.push(pill(`⏱ <b>${h.clock.toFixed(2)}</b>`, h.limit - h.clock <= 10 ? "warn" : ""));
      if (h.kind === "long") p.push(pill(`<b>${h.shot}/${h.shots}</b>はつ`), pill(`⏱ <b>${mmss(h.left)}</b>`), pill(`<b>${h.score}</b>てん`));
      if (h.kind === "run") p.push(pill(`ラン <b>${h.run}/${h.runs}</b> ${h.fast ? "はやい" : "おそい"}`), pill(`<b>${h.score}</b>てん`));
      if (h.kind !== "issf" && h.kind !== "bull") p.push(pill(gun.mag <= 10 ? `<span class="range-ammo">${Array.from({ length: gun.mag }, (_, i) => `<i class="${i < h.ammo ? "" : "off"}"></i>`).join("")}</span>` : `🔸 <b>${h.ammo}</b>/${h.mag}`, h.busy === "reload" ? "warn" : ""));
      top.innerHTML = p.join("") + `<span class="grow"></span>`;
      if (h.kind === "ipsc") top.append(UI.btn("おわり", () => {}, "range-finish"));
      top.append(UI.btn("✕", () => {}, "round")); sc.append(top);
      // 2だんめ（いまの かね・かぜ・ズーム）／ スコア モニター
      const sub = U.el("div", { class: "range-sub" }), q = [];
      if (h.kind === "long") q.push(pill(`いま <b>${h.cur}m</b>（${h.curShot}/${h.per}）`));
      if (h.windLevel != null) q.push(pill(`かぜ <span class="arrow">${(h.windDir < 0 ? "←" : "→").repeat(h.windLevel + 1)}</span> ${["ほぼ なし", "よわい", "つよい"][h.windLevel]}`));
      sub.innerHTML = q.join("") + `<span class="grow"></span>`;
      if (q.length) sc.append(sub);
      if (gun.sight === "scope") { const z = U.el("div", { class: "range-zoom" }); z.append(UI.btn("＋", () => {}, "round"), U.el("span", { class: "v", html: h.zoom.toFixed(1) + "×" }), UI.btn("−", () => {}, "round")); sc.append(z); }
      if (h.kind === "bull" || h.kind === "issf") {
        const card = g.targets[0], vb = RR.targetSvg(card.def.shape, card.def).vb, inner = RR.targetSvg(card.def.shape, card.def).svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        const zoom = h.kind === "issf" ? [-30, -30, 60, 60] : vb;
        const holes = card.marks.map(([x, y]) => `<circle cx="${(x * 1000).toFixed(1)}" cy="${(-y * 1000).toFixed(1)}" r="3" fill="#F29A1F" stroke="#1F1D1B" stroke-width="0.8"/>`).join("");
        const mon = U.el("div", { class: "range-monitor" });
        mon.innerHTML = `<svg viewBox="${zoom.join(" ")}">${inner}${holes}</svg><div class="v">${h.last == null ? "—" : h.last}</div><div class="s">ごうけい ${h.score}${h.kind === "bull" ? `・X ${g.xs}` : ""}</div>`;
        sc.append(mon);
      }
      if (o.cmd) sc.append(U.el("div", { class: "range-cmd", html: `<span>${o.cmd}</span>${o.cmdSub ? `<small>${o.cmdSub}</small>` : ""}` }));
      // そうさ
      const ctrl = U.el("div", { class: "range-ctrl" });
      if (gun.action !== "single") ctrl.append(UI.btn(gun.action === "lever" ? "こめる" : "リロード", () => {}, "range-reload"));
      ctrl.append(UI.btn(h.ads ? "もどす" : "のぞく", () => {}, "range-ads" + (h.ads ? " on" : "")));
      if (["bolt", "lever", "single"].includes(gun.action)) ctrl.append(UI.btn({ bolt: "ボルト", lever: "レバー", single: "こめる" }[gun.action], () => {}, "range-act" + (h.needAction || (gun.action === "single" && !h.chamber) ? " need" : "")));
      ctrl.append(UI.btn(h.busy ? "…" : "うつ", () => {}, "range-fire" + (h.busy || !h.chamber || h.phase !== "play" ? " wait" : ""))); sc.append(ctrl);
      const br = U.el("button", { class: "btn range-breath" + (h.hold ? " on" : "") + (h.shake ? " shake" : ""), html: `いき<span class="bar"><i style="width:${Math.round(h.stamina * 100)}%"></i></span>` }); sc.append(br);
      // おうえんの 2人
      const ch = U.el("div", { class: "range-cheer" });
      (o.buddies || []).forEach(([id, face, say]) => { const b = U.el("div", { class: "range-buddy" }); b.innerHTML = `<img src="${heroes[id + ":" + face]}">` + (say ? `<span class="range-bubble">${say}</span>` : ""); ch.append(b); });
      sc.append(ch);
      window.__G = g; return h;
    };
    // けっか（シート つき）
    window.__rangeResult = (o, heroes) => {
      const RD = __RD, RR = __RR, g = new RR.Game(RD, o.course, o.gun, { seed: o.seed, W: 360, H: 780, who: o.who }); let n = 0;
      while (g.phase !== "end" && n++ < 60 * 400) g.update(1 / 60, RR.bot(g, o.skill));
      const C = RD.courses[o.course], gun = RD.guns.find((x) => x.id === o.gun), body = U.el("div", { class: "rg-result" });
      let main = "", sheet = "";
      if (C.kind === "steel") {
        const worst = g.times.reduce((a, t, i) => (t.time > g.times[a].time ? i : a), 0);
        main = `${g.result.toFixed(2)} <span style="font-size:15px">びょう</span>`;
        sheet = `<table class="rg-sheet"><tr><th>ストリング</th><th>タイム</th><th>のこし</th></tr>${g.times.map((t, i) => `<tr class="${i === worst ? "drop" : ""}"><td>${i + 1}</td><td>${t.time.toFixed(2)}</td><td>${t.left ? `${t.left}まい（+${t.left * C.penalty}）` : "—"}</td></tr>`).join("")}<tr class="tot"><td>ごうけい</td><td colspan="2">${g.result.toFixed(2)}びょう</td></tr></table><div class="sub">せんの ひいた 1かい（いちばん おそい）は かぞえない</div>`;
      } else if (C.kind === "ipsc") {
        const s = g.sheet; main = `${s.hf.toFixed(2)} <span style="font-size:15px">ヒット ファクター</span>`;
        sheet = `<table class="rg-sheet"><tr><th>A</th><th>C</th><th>D</th><th>ミス</th><th>NS</th></tr><tr><td>${s.zones.A}</td><td>${s.zones.C}</td><td>${s.zones.D}</td><td>${s.miss}</td><td>${s.ns}</td></tr><tr class="tot"><td colspan="2">てん ${s.total}</td><td colspan="3">じかん ${s.time.toFixed(2)}びょう</td></tr></table>`;
      } else main = `${g.result} <span style="font-size:15px">てん</span>`;
      const st = C.stars, fmt = (v) => (C.score === "time" ? v.toFixed(1) + "びょう" : C.score === "hf" ? v.toFixed(2) : v);
      const buddies = ["wanko", "gachan", "goji"].filter((x) => x !== o.who);
      body.innerHTML = `<div class="stars">${"★".repeat(g.stars)}<span class="off">${"★".repeat(3 - g.stars)}</span></div><div class="score">${main}</div><div class="sub">${C.name}・${gun.name}　★1 ${fmt(st[0])}／★2 ${fmt(st[1])}／★3 ${fmt(st[2])}</div>${sheet}
        <div class="coins"><i class="coin-ico"></i> ${g.coins} コイン</div><div class="sub">RO: ${RD.talk.result[g.stars]}</div>
        <div class="says">${[o.who, ...buddies].map((id) => `<div class="say"><img src="${heroes[id + ":" + { wanko: "smile", gachan: "sparkle", goji: "love" }[id]]}">${RD.talk.cheer[id].end[0]}</div>`).join("")}</div>`;
      const foot = U.el("div", { style: "display:flex;gap:8px;flex:1" }); foot.append(UI.btn("もう いちど", () => {}, "yellow"), UI.btn("えらびなおす", () => {}, ""), UI.btn("おわる", () => {}, "")); for (const b of foot.children) { b.style.flex = "1"; b.style.minHeight = "48px"; b.style.padding = "6px 2px"; b.style.fontSize = "13px"; }
      UI.modal({ title: "🎯 けっか", body, footer: foot });
      return { result: g.result, stars: g.stars };
    };
    // ロビー: しゅるい → しゅもく → じゅう（ホップ ダイヤル つき）
    window.__rangeLobby = (o) => {
      const RD = __RD, body = U.el("div"), tabs = U.el("div", { class: "rg-tabs" });
      for (const [c, v] of Object.entries(RD.cats)) tabs.append(U.el("button", { class: "tab" + (c === o.cat ? " on" : "") + (o.lock === c ? " lock" : ""), html: (o.lock === c ? "🔒 " : "") + v.short }));
      body.append(tabs, U.el("div", { class: "rg-h", html: "しゅもく" }));
      const cs = U.el("div", { class: "rg-courses" }), ORIGIN = { steel: "スティール チャレンジ", bull: "APS カップ", ipsc: "IPSC", issf: "ISSF 10m", long: "30〜70m の かね", run: "ランニング ターゲット" };
      for (const [cid, C] of Object.entries(RD.courses).filter(([, x]) => x.cat === o.cat)) { const n = (o.best || {})[cid] || 0; cs.append(U.el("button", { class: "rg-course" + (cid === o.course ? " on" : ""), html: `<span class="nm">${C.name}</span><span class="sub">${ORIGIN[C.kind]}・${{ time: "タイム", points: "てん", hf: "ヒット ファクター" }[C.score]}</span><span class="best">${"★".repeat(n)}${"☆".repeat(3 - n)}</span>` })); }
      body.append(cs, U.el("div", { class: "rg-rule", html: RD.courses[o.course].rule }), U.el("div", { class: "rg-h", html: "じゅう" }));
      const list = U.el("div", { class: "rg-guns" });
      for (const g of RD.guns.filter((x) => x.cat === o.cat)) { const n = (o.bestGun || {})[g.id] || 0; list.append(U.el("button", { class: "rg-gun" + (g.id === o.gun ? " on" : ""), html: `<span class="art">${__GA.svg(g, { px: g.cat === "hand" ? 0.5 : 0.105, uid: "sel" + g.id })}</span><span><span class="nm">${g.name}</span><br><span class="sub">${{ gbb: "ガス ブローバック", gas: "ガス", aeg: "でんどう", spring: "エアー コッキング" }[g.power]}・たま ${g.mag}・${Array.isArray(g.zoom) ? g.zoom.join("〜") + "ばい" : { semi: "セミオート", da: "ダブル アクション", auto: "フルオート", lever: "レバー", bolt: "ボルト", single: "1ぱつずつ" }[g.action]}</span><br><span class="best">${"★".repeat(n)}${"☆".repeat(3 - n)}</span></span>` })); }
      body.append(list);
      const g = RD.guns.find((x) => x.id === o.gun), bar = (v, m) => `<span class="bar"><i style="width:${Math.round(Math.max(0.04, Math.min(1, v / m)) * 100)}%"></i></span>`;
      const hop = g.cat === "hand" ? "" : `<div class="rg-hop">ホップ ${UI.btn("−", () => {}, "round").outerHTML}<span class="dial"><i style="left:${(o.hop / RD.ballistics.hop.steps) * 100}%"></i></span>${UI.btn("＋", () => {}, "round").outerHTML}<span class="v">${o.hop}</span></div>`;
      body.append(U.el("div", { class: "rg-detail", html: `<div class="desc">${g.desc}</div><div class="rg-stats"><span>しょそく</span>${bar(g.v0, 100)}<span class="n">${g.v0}m/s</span><span>まとまり</span>${bar(6 - g.group, 5.7)}<span class="n">10mで ${g.group}cm</span><span>れんしゃ</span>${bar(g.rate, 14)}<span class="n">${g.rate}はつ/びょう</span><span>はねあがり</span>${bar(g.recoil, 12)}<span class="n">${g.recoil}</span><span>おもさ</span>${bar(g.weight, 4.5)}<span class="n">${g.weight}kg</span></div>${hop}<div class="fact"><b>まめちしき</b>${g.fact}</div>` }));
      UI.modal({ title: "🎯 しゅもくと じゅう", body, footer: UI.btn("これで うつ", () => {}, "yellow wide") });
    };
    window.__NAME = NAME; window.__T = T;
  });
  return page;
}
const shots = {}, CAP = {};
const shot = async (page, k, cap) => { await page.waitForTimeout(450); const p = `${TMP}range-${k}.png`; await page.screenshot({ path: p }); shots[k] = p; CAP[k] = cap; await page.close(); };
const T = RD.talk;
// ① 町の 射撃場
{ const page = await gamePage([390, 844]); await shot(page, "a", "シティに たつ 射撃場（デパートと こうぼうの あいだ。入口に 入ると 射撃場）"); }
// ② はじめての とき: RO の きまり
{
  const page = await gamePage([390, 844]);
  await page.evaluate(({ heroes }) => __rangeShot({ course: "steel", gun: "auto", who: "wanko", seed: "m2", noAds: true, until: { phase: "standby" }, buddies: [] }, heroes), { heroes: HEROES });
  await page.evaluate(({ staff, talk, name }) => { document.querySelector(".range-scene canvas").style.filter = "brightness(0.7)"; for (const s of document.querySelectorAll(".range-ctrl,.range-top,.range-breath,.range-sub")) s.remove(); UI.say([{ name, face: `<img src="${staff}" style="width:100%;height:100%">`, text: talk }]); }, { staff: STAFF, talk: T.first[1], name: RD.staff.name });
  await page.waitForTimeout(2600);
  await shot(page, "b", "はじめての とき: レンジ オフィサーの きまり（ゴーグル・ひきがねに ゆびを かけない・じゅうこうは まとへ）");
}
// ③ だれが うつ？
{
  const page = await gamePage([390, 844]);
  await page.evaluate(({ heroes, talk }) => {
    const body = U.el("div"), grid = U.el("div", { class: "rg-who" });
    for (const [id, nm, face] of [["wanko", "わんこ", "smile"], ["gachan", "がちゃん", "smile"], ["goji", "ごじ", "love"]]) { const c = U.el("button", { class: "rg-who-card" + (id === "goji" ? " on" : "") }); c.innerHTML = `<img src="${heroes[id + ":" + face]}"><span class="nm">${nm}</span><span class="ln">${talk.go[id][0]}</span>`; grid.append(c); }
    body.append(grid, U.el("div", { class: "rg-note", html: "のこりの 2人は うしろで 見て おうえん するよ" }));
    UI.modal({ title: "🎯 " + talk.pick, body, footer: UI.btn("この子で うつ", () => {}, "yellow wide") });
  }, { heroes: HEROES, talk: T });
  await shot(page, "c", "だれが うつ？（1人。2人は うしろで おうえん）");
}
// ④ しゅもくと じゅう（スナイパー・ホップ ダイヤル）
{ const page = await gamePage([390, 844]); await page.evaluate(() => __rangeLobby({ cat: "sniper", course: "long", gun: "bolt", hop: 12, best: { long: 1 }, bestGun: { bolt: 1 } })); await shot(page, "d", "しゅもくと じゅう: しゅるいの タブ・しゅもく 2つ・じゅう 3しゅ・せいのう・ホップ ダイヤル"); }
// ⑤⑥ スチール チャレンジ（スタンバイ → ブザーの あと）
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes, t }) => __rangeShot({ course: "steel", gun: "auto", who: "wanko", seed: "m5", noAds: true, until: { phase: "standby" }, cmd: t.cmd.standby, cmdSub: "ブザーが なったら じゅうを あげて うつ", buddies: [["gachan", "smile", ""], ["goji", "love", ""]] }, heroes), { heroes: HEROES, t: T }); await shot(page, "e", "スチール チャレンジ: RO の「スタンバイ…」（じゅうは さげて まつ）"); }
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes, t }) => __rangeShot({ course: "steel", gun: "auto", who: "wanko", seed: "m6", until: { string: 2, phase: "play", hits: 7, after: 0.05 }, buddies: [["gachan", "sparkle", t.cheer.gachan.hit[1]], ["goji", "love", ""]] }, heroes), { heroes: HEROES, t: T }); await shot(page, "f", "スチール チャレンジ（わんこ・オートマチック）: 3ドットで ねらい、カーンで つぎの プレートへ"); }
// ⑦ プラクティカル（IPSC）
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes, t }) => __rangeShot({ course: "practical", gun: "carbine", who: "gachan", seed: "m7", until: { phase: "play", shots: 13, after: 0.2 }, buddies: [["wanko", "surprise", t.cheer.wanko.combo[0]], ["goji", "love", ""]] }, heroes), { heroes: HEROES, t: T }); await shot(page, "g", "プラクティカル（がちゃん・カービン）: ピープで ねらう。ポッパーで ふりこの 的が うごきだす・NS は うたない"); }
// ⑧ 10m エアライフル（ダイオプター・スコア モニター）
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes }) => __rangeShot({ course: "precision", gun: "match", who: "goji", seed: "m8", until: { shots: 6, hold: true, after: 0 }, buddies: [["wanko", "smile", ""], ["gachan", "smile", ""]] }, heroes), { heroes: HEROES }); await shot(page, "h", "10m エアライフル（ごじ・きょうぎ エアライフル）: ダイオプターと スコア モニター（10.9 まで）"); }
// ⑨ ロングレンジ（スコープ・かぜ・いき）
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes, t }) => __rangeShot({ course: "long", gun: "bolt", who: "goji", seed: "m9", hop: 10, until: { shots: 5, hold: true, after: 0 }, buddies: [["wanko", "smile", ""], ["gachan", "smile", t.cheer.gachan.hit[1]]] }, heroes), { heroes: HEROES, t: T }); await shot(page, "i", "ロングレンジ（ごじ・ボルトアクション）: 1mrad の めもり・はたで かぜを よむ・いきを とめる"); }
// ⑩ ムービング ターゲット
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes }) => __rangeShot({ course: "moving", gun: "semi", who: "wanko", seed: "m10", until: { shots: 7, after: 0 }, buddies: [["gachan", "smile", ""], ["goji", "love", ""]] }, heroes), { heroes: HEROES }); await shot(page, "j", "ムービング ターゲット（わんこ・セミオート スコープ）: はしる 的の すこし まえを ねらう"); }
// ⑪⑫ けっか
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes }) => __rangeResult({ course: "steel", gun: "auto", who: "wanko", seed: "m11", skill: "casual" }, heroes), { heroes: HEROES }); await shot(page, "k", "けっか（スチール）: 5ストリングの タイム・いちばん おそい 1かいを のぞく"); }
{ const page = await gamePage([390, 844]); await page.evaluate(({ heroes }) => __rangeResult({ course: "practical", gun: "carbine", who: "gachan", seed: "m12", skill: "good" }, heroes), { heroes: HEROES }); await shot(page, "l", "けっか（IPSC）: A・C・D・ミス・NS・てん ÷ じかん"); }
await png(`<div style="padding:20px 24px"><div style="font-size:26px;font-weight:800">射撃場: スマホの 画面（390×844・ゲームの 上に 重ねて 撮影）</div><div style="font-size:14px;margin:4px 0 14px;max-width:1180px">えらんだ 1人の 目の たかさの 主観で、実際の 射撃競技の ルールで うつ。ゆびで ずらして ねらい、「のぞく」で サイト・スコープ、「うつ」で うつ。ボルト・レバー・リロードは じぶんで。「いき」を おしている あいだ ゆれが へる。のこりの 2人は ひだりしたで おうえん。</div><div style="display:grid;grid-template-columns:repeat(4,auto);gap:16px 18px;justify-content:start">${"abcdefghijkl".split("").map((k, i) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px;max-width:270px">${"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[i]} ${CAP[k]}</div><img src="${b64(shots[k])}" style="width:270px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "range-flow.png", { width: 1200, height: 900 });
// 4) 小さい スマホ（375×667）
{ const page = await gamePage([375, 667]); await page.evaluate(({ heroes, t }) => __rangeShot({ course: "practical", gun: "lever", who: "wanko", seed: "s1", until: { phase: "play", shots: 6, after: 0.1 }, buddies: [["gachan", "sparkle", t.cheer.gachan.hit[0]], ["goji", "love", ""]] }, heroes), { heroes: HEROES, t: T }); await shot(page, "m", "プラクティカル（レバーアクション）"); }
{ const page = await gamePage([375, 667]); await page.evaluate(({ heroes }) => __rangeShot({ course: "long", gun: "heavy", who: "gachan", seed: "s2", until: { shots: 7, hold: true, after: 0 }, buddies: [["wanko", "smile", ""], ["goji", "love", ""]] }, heroes), { heroes: HEROES }); await shot(page, "n", "ロングレンジ（ヘビー ボルト）"); }
{ const page = await gamePage([375, 667]); await page.evaluate(() => __rangeLobby({ cat: "rifle", course: "precision", gun: "match", hop: 10, lock: "sniper", best: { practical: 1 }, bestGun: { carbine: 1 } })); await shot(page, "o", "しゅもくと じゅう（ライフル）"); }
await png(`<div style="padding:20px 24px"><div style="font-size:22px;font-weight:800;margin-bottom:10px">小さい スマホ（375×667）</div><div style="display:flex;gap:20px">${["m", "n", "o"].map((k) => `<div><div style="font-weight:800;font-size:13px;margin-bottom:5px">${CAP[k]}</div><img src="${b64(shots[k])}" style="width:300px;border-radius:12px;border:4px solid #3C352E;display:block"></div>`).join("")}</div></div>`, IMG + "small-phone.png", { width: 1020, height: 700 });
await browser.close();
console.log("range mock: gun-sheet.png / ballistics.png / range-flow.png / small-phone.png");
