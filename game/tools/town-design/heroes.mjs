// ゲームの キャラ素材（chara-data.js / chara.js / art.js）から 3人と 町の人の SVG を 作る（見本の 画面に のせる）
import { readFileSync } from "node:fs";
import vm from "node:vm";
const GAME = new URL("../../js/", import.meta.url).pathname;
const ctx = { console, Math, JSON }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["chara-data.js", "chara.js", "data.js", "art.js"]) vm.runInContext(readFileSync(GAME + f, "utf8"), ctx, { filename: f });
const build = vm.runInContext("buildCharaSvg", ctx), CH = vm.runInContext("Chara", ctx), ART = vm.runInContext("Art", ctx);
const place = (svg, fx, fy, size) => { const VB = CH.VB, FOOT = CH.FOOT, h = (size * VB.h) / VB.w, ax = ((FOOT.x - VB.x) / VB.w) * size, ay = ((FOOT.y - VB.y) / VB.h) * h;
  return `<ellipse cx="${fx}" cy="${fy}" rx="${(size * 0.3).toFixed(1)}" ry="${(size * 0.09).toFixed(1)}" fill="#1A1410" opacity="0.2"/>` + svg.replace("<svg ", `<svg x="${(fx - ax).toFixed(1)}" y="${(fy - ay).toFixed(1)}" width="${size}" height="${h.toFixed(1)}" `); };
// (fx, fy) = 足もとの 位置（px）、size = 表示の はば（論理px。ゲームでは 46）
export const heroSvg = (id, fx, fy, o = {}) => place(build(id, { dir: o.dir || "down", pose: o.pose || "idle_01", face: o.face }), fx, fy, o.size || 46);
export const npcSvg = (spec, fx, fy, o = {}) => place(ART.npcSvg(spec), fx, fy, o.size || 44);
