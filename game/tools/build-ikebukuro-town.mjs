// 池袋の 原画（tools/town-design/ikebukuro-buildings.mjs）を 本編へ。実行時の ビルドや 外部画像は ない。
//   node tools/build-ikebukuro-town.mjs          js/ikebukuro-town-art.js と 見本（docs/design/towns/ikebukuro-buildings/）を 作る
//   node tools/build-ikebukuro-town.mjs --check  js/ikebukuro-town-art.js が 原画と おなじか しらべる（npm run check）
//   node tools/build-ikebukuro-town.mjs --shots  見本の ページを ブラウザで ひらき、bbox の そとに 絵が ないか しらべて 画像に する
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {IKEBUKURO_BUILDINGS,IKEBUKURO_PROPS,IKEBUKURO_GROUNDS,ikebukuroSvg,ikebukuroDraw} from './town-design/ikebukuro-buildings.mjs';
const all=[...IKEBUKURO_BUILDINGS,...IKEBUKURO_PROPS],entries=[],assets={};
for(const a of all){
  const {draw,...meta}=a;assets[a.id]=meta;
  for(const state of a.states)entries.push({asset:a.id,kind:'heiwadai_'+a.id.replaceAll('.','_'),opts:state==='night'?{night:true}:{},w:a.w,h:a.h,bbox:a.bbox,svg:ikebukuroDraw(a,state==='night'?{night:true}:{})});
}
const data='// 自動生成: tools/build-ikebukuro-town.mjs。原画の 形・実寸・bbox を そのまま（手で なおさない）。\nconst IKEBUKURO_TOWN_ART='+JSON.stringify({assets,entries,grounds:IKEBUKURO_GROUNDS})+';\n';
const file=new URL('../js/ikebukuro-town-art.js',import.meta.url);
if(process.argv.includes('--check')){
  if(readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==data)throw Error('Ikebukuro artwork is stale: node tools/build-ikebukuro-town.mjs');
  console.log('Ikebukuro artwork: '+IKEBUKURO_BUILDINGS.length+' buildings / '+IKEBUKURO_PROPS.length+' props / '+entries.length+' finite variants / '+Object.keys(IKEBUKURO_GROUNDS).length+' ground tiles match');
}else{
  writeFileSync(file,data);
  const out=new URL('../docs/design/towns/ikebukuro-buildings/',import.meta.url);mkdirSync(new URL('svg/',out),{recursive:true});
  for(const a of all)for(const state of a.states)writeFileSync(new URL('svg/'+a.id+'.'+state+'.svg',out),ikebukuroSvg(a,{night:state==='night'}));
  writeFileSync(new URL('assets.json',out),JSON.stringify(all.map(({draw,...a})=>a),null,2)+'\n');
  const card=a=>`<article><div class="drawing">${ikebukuroSvg(a)}</div><h2>${a.name}</h2><p>${a.w}×${a.h}マス${a.buildingId?' ｜ '+a.buildingId:''} ｜ ${a.details.join('・')}</p>${a.states.map(s=>`<a href="svg/${a.id}.${s}.svg">${s==='day'?'ひる':'よる'}の SVG</a>`).join(' / ')}</article>`;
  const sources=all.map(a=>[ikebukuroSvg(a),a.states.includes('night')?ikebukuroSvg(a,{night:true}):ikebukuroSvg(a)]);
  writeFileSync(new URL('index.html',out),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>池袋・建物と 小物の 原画</title><style>*{box-sizing:border-box}body{margin:0;background:#EEE8DA;color:#2F4E58;font:15px/1.7 'Yu Gothic',Meiryo,sans-serif}header,main{max-width:1500px;margin:auto;padding:24px}h1{font-size:32px;margin:4px 0}h2{font-size:17px;margin:8px 0 0}p{color:#6C6553;margin:4px 0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:18px}article{padding:18px;background:#FFFCF4;border:1px solid #D8D0BC;border-radius:12px}.drawing{height:320px;display:grid;place-items:center;border-bottom:1px solid #E6DECB}.drawing svg{max-width:100%;max-height:300px;width:auto;height:auto}a{color:#2F4E58}small{letter-spacing:2px}button{min-height:44px;padding:10px 20px;border:1px solid #9AA3A0;background:#2F5D50;color:#FFF5DF;border-radius:22px;cursor:pointer}</style><header><small>IKEBUKURO / BUILDINGS &amp; LANDMARKS</small><h1>駅から、サンシャインいけぶへ。</h1><p>オーナーの 配置イメージ（2026-09-29）の 建物と めじるし。32px/マスの 実寸・南向き・左上の 光。入口は 建物の 下の はしの door の マス。</p><button id="mode">よるの まどを みる</button></header><main>${all.map(card).join('')}</main><script>const sources=${JSON.stringify(sources)};let night=false;document.getElementById('mode').onclick=e=>{night=!night;document.querySelectorAll('.drawing').forEach((el,i)=>el.innerHTML=sources[i][+night]);e.target.textContent=night?'ひるに もどす':'よるの まどを みる'};</script></html>`);
  console.log('Ikebukuro: generated '+all.length+' assets ('+entries.length+' variants)');
  if(process.argv.includes('--shots')){
    const {chromium}=await import('playwright'),browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
    try{
      const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
      await page.goto(new URL('index.html',out).href);
      mkdirSync(new URL('img/',out),{recursive:true});
      for(const state of ['day','night']){
        if(state==='night')await page.locator('#mode').click();
        const bad=await page.locator('.drawing svg').evaluateAll(els=>els.filter(el=>{const b=el.getBBox(),v=el.viewBox.baseVal;return b.x<v.x-.5||b.y<v.y-.5||b.x+b.width>v.x+v.width+.5||b.y+b.height>v.y+v.height+.5;}).map(el=>el.getAttribute('aria-label')));
        if(bad.length)throw Error('Artwork outside bbox: '+bad.join(', '));
        await page.screenshot({path:fileURLToPath(new URL('img/assets-'+state+'.png',out)),fullPage:true});
      }
      console.log(all.length+' SVGs: day/night bbox and gallery rendering verified');
    }finally{await browser.close();}
  }
}
