// スマホ 1画面の 見本を 1枚に 並べる
import { readFileSync } from "node:fs";
import { IMG, TMP, launch } from "./paths.mjs";
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const V = [["station", "① 駅前ロータリー → 駅前通り（3人が 横断歩道を わたる）", 779], ["junction", "② さつき通りとの T字路 → カーブ", 779], ["shotengai", "③ 商店街（アーチ・のぼり・屋台・旗かざり）", 779], ["residential", "④ 住宅地の 路地（塀・門柱・電柱・側溝・止まれ）", 779], ["plaza", "⑤ 駅前広場（小さい スマホ 375×667 の 見え方）", 640]];
const cell = ([n, cap, h]) => `<div style="width:432px"><div style="font-weight:800;font-size:17px;margin:0 0 8px;height:48px">${cap}</div><img src="${b64(TMP + `phone_${n}.png`)}" style="width:432px;height:${Math.round(h * 1.2)}px;border-radius:18px;border:6px solid #3C352E;display:block"></div>`;
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E"><div style="padding:24px 28px"><div style="font-size:28px;font-weight:800">平和台 v0.2 ・ スマホ 1画面の 見本（ゲームと 同じ 360 論理px 幅・キャラは 実物の 素材）</div><div style="font-size:15px;margin:4px 0 16px">390×844 の 端末で 見える 範囲（11.25×24.3 マス）。⑤だけ 375×667（11.25×20 マス）。</div><div style="display:flex;gap:22px;align-items:flex-start">${V.map(cell).join("")}</div></div></body>`;
const b = await launch(), page = await b.newPage({ viewport: { width: 2300, height: 1000 } });
await page.setContent(html); await page.waitForTimeout(600); await page.screenshot({ path: IMG + "phones.png", fullPage: true }); await b.close(); console.log("ok");
