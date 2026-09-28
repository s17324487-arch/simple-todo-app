// 元の SVG と実ゲームの WorldArt を同じピクセル寸法で比較する。
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {heiwadaiSources} from './heiwadai-assets-source.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),ab=process.argv.includes('--ab'),group=ab?'AB':'S';
const dir=join(root,'docs/screenshots/heiwadai-assets-'+group.toLowerCase());mkdirSync(dir,{recursive:true});
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
try{
  const page=await browser.newPage({viewport:{width:1300,height:850}});
  await page.setContent('<!doctype html><meta charset="utf-8"><style>body{background:#fbf8f1;font:14px sans-serif;color:#3c352e}main{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{background:white;padding:12px;margin:0}img{display:block;max-width:100%;height:250px;object-fit:contain;margin:auto}h1{font-size:24px}</style><h1>平和台 v0.2：左＝元のSVG ／ 右＝ゲームのWorldArt</h1><main></main>');
  await page.addScriptTag({content:'const WorldArt={};'});
  for(const p of ['js/heiwadai-art.js','js/heiwadai-assets-s.js',...(ab?['js/heiwadai-assets-ab.js']:[])])await page.addScriptTag({path:join(root,p)});
  const source=heiwadaiSources(group);
  const comparison=await page.evaluate(async source=>{
    const uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s),load=s=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=uri(s);});
    let worst=0;const rows=[];
    for(const e of source.entries){
      const actual=HeiwadaiArt.entry(e.asset,e.opts),[x0,y0,x1,y1]=actual.bbox,w=x1-x0+4,h=y1-y0+4;
      const before='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[x0-2,y0-2,w,h].join(' ')+'">'+source.defs+e.svg+'</svg>';
      const after=HeiwadaiArt.full(e.asset,e.opts),images=await Promise.all([load(before),load(after)]);
      const raster=images.map(im=>{const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const cx=c.getContext('2d');cx.drawImage(im,0,0,c.width,c.height);return cx.getImageData(0,0,c.width,c.height).data;});
      let diff=0;for(let i=0;i<raster[0].length;i++)diff=Math.max(diff,Math.abs(raster[0][i]-raster[1][i]));
      worst=Math.max(worst,diff);if(diff>0)throw new Error(e.asset+' SVG mismatch '+diff);
      rows.push({asset:e.asset,opts:e.opts,pixelDifference:diff});
      if(!Object.keys(e.opts).length){const row=document.createElement('article');row.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px';document.querySelector('main').append(row);for(let i=0;i<2;i++){ const f=document.createElement('figure'),title=document.createElement('strong');title.textContent=(i?'ゲーム：':'見本：')+source.assets[e.asset].name;f.append(title,images[i]);row.append(f);}}
    }
    return {variants:rows.length,maxChannelDifference:worst,rows};
  },source);
  writeFileSync(join(dir,'comparison.json'),JSON.stringify(comparison,null,2));
  for(let i=0;i<await page.locator('article').count();i++)await page.locator('article').nth(i).screenshot({path:join(dir,'asset-'+String(i+1).padStart(2,'0')+'.png')});
  for(const viewport of [{width:390,height:844},{width:375,height:667}]){
    await page.setViewportSize(viewport);await page.goto(pathToFileURL(join(root,'tools/heiwadai-preview.html')).href+'?priority='+group);await page.locator('img').first().waitFor();await page.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));
    await page.screenshot({path:join(dir,viewport.width+'-preview.png')});
  }
  console.log('Heiwadai '+group+': '+comparison.variants+' SVG variants pixel-identical; phone previews saved.');
}finally{await browser.close();}
