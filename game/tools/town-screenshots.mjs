// 同じ公開APIで全体図と2種類のスマホ画面を保存する。
import {chromium} from 'playwright';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {serve} from './serve.mjs';
import {gameContext} from './game-context.mjs';
import {townMetrics} from './town-metrics.mjs';
const out=fileURLToPath(new URL('../docs/screenshots/towns/',import.meta.url));mkdirSync(out,{recursive:true});
const {server,url}=await serve({port:0,quiet:true});const browser=await chromium.launch({headless:true});
try{
  for(const [width,height]of [[390,844],[375,667]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',e=>console.error(e.message));await page.goto(url);await page.waitForFunction(()=>typeof PokaDebug!=='undefined');
    await page.evaluate(()=>PokaDebug.newGame());await page.waitForFunction(()=>PokaDebug.idle()&&PokaDebug.state().scene==='house');
    await page.evaluate(()=>{PokaDebug.hour(12);PokaDebug.calendar('2026-06-01');PokaDebug.weather('clear');});
    for(const id of ['town','city','harbor','airport']){
      const layout=await page.evaluate(id=>PokaDebug.townLayout(id),id);
      for(const [i,[x,y]]of layout.views.entries()){
        await page.evaluate(({id,x,y})=>PokaDebug.teleport(id,x,y),{id,x,y});
        await page.waitForFunction(id=>PokaDebug.idle()&&PokaDebug.state().map===id,id);await page.waitForTimeout(id==='town'&&i===0?3800:2600);
        await page.evaluate(()=>PokaDebug.pause(true));await page.screenshot({path:join(out,`${id}-${width}-${i+1}.png`)});await page.evaluate(()=>PokaDebug.pause(false));
      }
      if(width===390)for(const before of [false,true]){
        const png=await page.evaluate(({id,before})=>PokaDebug.townPlan(id,before),{id,before});
        writeFileSync(join(out,`${id}-${before?'before':'plan'}.png`),Buffer.from(png.split(',')[1],'base64'));
      }
      console.log(`${id} ${width}x${height}: captured`);
    }await page.close();
  }
  const R=gameContext(),report=[];
  const data=name=>'data:image/png;base64,'+readFileSync(join(out,name)).toString('base64');
  for(const id of R.TownRenewal.ids){
    const m=new R.WorldMap(id),prior=new R.WorldMap('before-'+id,R.TownRenewal.originals[id]);
    const reportRow=({emptyTiles,blind,...metrics})=>({...metrics,phoneMissing:blind.length});
    report.push({id,before:reportRow(townMetrics(prior)),after:reportRow(townMetrics(m)),views:m.def.views,phones:[[390,844],[375,667]]});
    const width=(m.w+prior.w)*16+72,height=Math.max(m.h,prior.h)*16+110;
    const page=await browser.newPage({viewport:{width,height}});
    await page.setContent(`<style>body{margin:0;padding:24px;background:#f7f4eb;color:#272e35;font:18px sans-serif}h1{font-size:24px;margin:0 0 15px}section{display:flex;gap:24px}p{margin:0 0 10px}img{display:block}</style><h1>${m.name} — 街区の比較</h1><section><div><p>変更前</p><img width="${prior.w*16}" src="${data(id+'-before.png')}"></div><div><p>変更後</p><img width="${m.w*16}" src="${data(id+'-plan.png')}"></div></section>`);
    await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:join(out,id+'-comparison.png')});await page.close();
  }
  writeFileSync(join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
  const page=await browser.newPage({viewport:{width:1648,height:1750}});
  await page.setContent(`<style>body{margin:0;padding:20px;background:#f7f4eb;color:#272e35;font:16px sans-serif}h1{font-size:25px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}section{background:white;padding:12px}h2{margin:0 0 8px;font-size:21px}.phones{display:flex;gap:10px}img{display:block;width:375px}p{margin:0 0 5px}</style><h1>4つの町 · 390×844 / 375×667</h1><main>${R.TownRenewal.ids.map(id=>`<section><h2>${R.MAP_DEFS[id].name}</h2><div class="phones">${[390,375].map(w=>`<div><p>${w}×${w===390?844:667}</p><img src="${data(id+'-'+w+'-1.png')}"></div>`).join('')}</div></section>`).join('')}</main>`);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:join(out,'phones.png'),fullPage:true});await page.close();
}finally{await browser.close();server.close();}
