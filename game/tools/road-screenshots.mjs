// 実際の Tiles.chunk の画像と、変更していない phones.png の同じ座標を並べる。
// npm start は不要。 node tools/road-screenshots.mjs
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { serve } from "./serve.mjs";
const root=new URL("../",import.meta.url),out=new URL("docs/screenshots/",root);
mkdirSync(out,{recursive:true});
const def=runInNewContext(readFileSync(new URL("tests/fixtures/roads-v02.js",root),"utf8")+";ROAD_FIXTURE");
const {server,url}=await serve({port:0,quiet:true}),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
try{
  const phones="data:image/png;base64,"+readFileSync(new URL("docs/design/towns/heiwadai/img/phones.png",root)).toString("base64");
  const scan=await browser.newPage();
  const imageTop=await scan.evaluate(async src=>{
    const i=new Image();i.src=src;await i.decode();const c=document.createElement("canvas");c.width=i.width;c.height=i.height;const g=c.getContext("2d");g.drawImage(i,0,0);
    const d=g.getImageData(0,0,c.width,c.height).data;
    for(let y=120;y<220;y++)if([200,260,320].every(x=>{const p=(y*c.width+x)*4;return d[p]===60&&d[p+1]===53&&d[p+2]===46;}))return y+6;
    throw new Error("phones.png の枠が見つからない");
  },phones);await scan.close();
  const report=[];
  for(const [width,height]of [[390,844],[375,667]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.goto(url+"index.html");await page.waitForFunction(()=>window.PokaDebug&&PokaDebug.state().scene==="title");
    const pictures=[];
    for(const [name,cx,cy]of [["station",43.2,27.4],["junction",43,45]]){
      const frame=await page.evaluate(([d,v])=>PokaDebug.roadPreview(d,v),[def,{cx,cy,width,height}]);
      pictures.push(frame.url);report.push({name,width,height,cx,cy,left:frame.left,top:frame.top});
      await page.evaluate(async src=>{document.querySelector("#road-capture")?.remove();const i=new Image();i.id="road-capture";i.src=src;i.style="position:fixed;inset:0;z-index:999999;width:100vw;height:100vh";document.body.append(i);await i.decode();},frame.url);
      await page.screenshot({path:fileURLToPath(new URL(`town-01-${name}-${width}.png`,out))});
    }
    await page.close();
    const pair=await browser.newPage({viewport:{width:width*4+112,height:height+128},deviceScaleFactor:1});
    const ref=(index)=>{
      // phones.mjs の画像内部は432×935px（360×779論理px）。小画面は中央を同じ世界座標で切り抜く。
      const scale=width/432,left=(34+index*454)*scale,top=(imageTop+(935-height/scale)/2)*scale;
      return `<div class="crop" style="width:${width}px;height:${height}px"><img src="${phones}" style="width:${2300*scale}px;max-width:none;transform:translate(${-left}px,${-top}px)"></div>`;
    };
    await pair.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#fbf8f1;font:15px sans-serif;color:#302c28}h1{font-size:22px;margin:0 0 8px}p{margin:0 0 12px}.row{display:flex;gap:24px}.pair{display:flex;gap:16px}figure{margin:0}figcaption{height:24px}.crop{overflow:hidden}img{display:block}</style><h1>TOWN-01 道のベクター描画 — ${width}×${height}</h1><p>同じ世界座標・縮尺。右は道路のみ（建物・小物・配置は後続PR）。見本は元の phones.png を切り抜き。</p><div class="row">${pictures.map((src,i)=>`<div class="pair"><figure><figcaption>見本 ${i===0?"① 駅前":"② T字路・カーブ"}</figcaption>${ref(i)}</figure><figure><figcaption>実装 ${i+1}（Tiles.chunk）</figcaption><img src="${src}" width="${width}" height="${height}"></figure></div>`).join("")}</div>`);
    await pair.screenshot({path:fileURLToPath(new URL(`town-01-compare-${width}.png`,out)),fullPage:true});await pair.close();
  }
  writeFileSync(new URL("town-01-views.json",out),JSON.stringify({source:"docs/design/towns/heiwadai/img/phones.png",imageTop,views:report},null,2)+"\n");
  console.log("Screenshots: docs/screenshots/town-01-*.png");
}finally{await browser.close();server.close();}
