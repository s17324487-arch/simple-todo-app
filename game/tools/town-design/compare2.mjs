// v0.1 と v0.2 の 比べ図（全体・ロータリーと大通りの つながり）
import { readFileSync } from "node:fs";
import { IMG, TMP, launch } from "./paths.mjs";
const b64 = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
const v1 = b64(IMG + "v01_plan.png"), v2 = b64(TMP + "clean.png"), v2p = b64(IMG + "plan.png");
// 画像の 一部を 表示する箱（src の x,y,w,h を scale 倍で）
const crop = (src, x, y, w, h, s) => `<div style="width:${w * s}px;height:${h * s}px;overflow:hidden;position:relative;border-radius:10px;border:2px solid #D9CFBE"><img src="${src}" style="position:absolute;left:${-x * s}px;top:${-y * s}px;transform-origin:0 0;transform:scale(${s})"></div>`;
const css = `body{margin:0;background:#FBF8F1;font-family:'Noto Sans CJK JP',sans-serif;color:#3C352E}h1{font-size:30px;margin:0 0 6px}h2{font-size:22px;margin:22px 0 8px}p{margin:4px 0;font-size:16px;line-height:1.55}.row{display:flex;gap:26px;align-items:flex-start}.cap{font-weight:800;font-size:18px;margin:8px 0 4px}.bad{color:#C0392B}.good{color:#2E7D5B}.box{background:#fff;border:1px solid #E2DACB;border-radius:12px;padding:14px 16px}ul{margin:6px 0 0 20px;padding:0;font-size:16px;line-height:1.6}`;
const html = `<!doctype html><meta charset="utf-8"><style>${css}</style><body><div style="padding:26px 30px;width:1540px">
<h1>平和台 v0.1 → v0.2 の ちがい</h1><p>同じ 縮尺ではなく、それぞれ 全体が 入る 大きさで 並べた（v0.1 は 48×44 マス、v0.2 は 64×68 マス ＝ 面積 約2.1倍）。</p>
<div class="row"><div><div class="cap">v0.1（48×44）</div>${crop(v1, 30, 30, 1440, 1320, 0.52)}</div><div><div class="cap">v0.2（64×68）</div>${crop(v2p, 0, 64, 2048, 2176, 0.345)}</div></div>
<h2>ロータリーと 大通りの つながり</h2>
<div class="row"><div><div class="cap bad">v0.1: 斜めの 大通りが ロータリーの 角に ぶつかる</div>${crop(v1, 520, 330, 640, 560, 0.95)}</div>
<div><div class="cap good">v0.2: カーブ → まっすぐ 北へ → ロータリーの 南がわに 直角</div>${crop(v2, 1040, 430, 820, 1420, 0.56)}</div>
<div class="box" style="width:430px"><div class="cap">v0.2 で 直したこと</div><ul>
<li>大通りは 半径8マスの カーブで 向きを かえ、駅前は まっすぐ 北へ（駅前通り）</li>
<li>ロータリーの 南がわに 直角で 入る。角は まるく（隅切り）</li>
<li>ロータリーは <b>時計回り</b>（日本の 環状交差点と 同じ）。入るのも 出るのも 左折だけ</li>
<li>バス停・タクシーのりばは <b>外がわ（駅がわ）</b>。車の 左がわで 乗り降り</li>
<li>さつき通りとは 信号つきの T字路。横断歩道 3本・停止線・右左折の 矢印</li>
<li>信号のない 横断歩道の 手前に ひし形の 予告マーク</li>
<li>歩道は 2マス。並木・街灯・点字ブロックを 歩道に</li></ul></div></div>
</div></body>`;
const b = await launch(), page = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(html); await page.waitForTimeout(800);
await page.screenshot({ path: IMG + "compare.png", fullPage: true }); await b.close(); console.log("ok");
