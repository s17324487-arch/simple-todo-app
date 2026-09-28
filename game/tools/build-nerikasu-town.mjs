// 原画のSVGをそのまま本編へ。実行時のビルドや外部画像読み込みは不要。
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {NERIKASU_ASSETS,nerikasuSvg} from './town-design/nerikasu-assets.mjs';
import {NERIKASU_BUILDINGS} from './town-design/nerikasu-buildings.mjs';
const all=[...NERIKASU_ASSETS,...NERIKASU_BUILDINGS],entries=[],assets={};
for(const a of all){
  const {draw,...meta}=a;assets[a.id]=meta;
  for(const state of a.states){const opts=state==='night'?{night:true}:{};
    entries.push({asset:a.id,kind:'heiwadai_'+a.id.replaceAll('.','_'),opts,w:a.w,h:a.h,bbox:a.bbox,svg:draw(opts)});
  }
}
const data='// 自動生成: tools/build-nerikasu-town.mjs。原画の形・実寸・bboxを保持。\nconst NERIKASU_TOWN_ART='+JSON.stringify({assets,entries})+';\n';
const file=new URL('../js/nerikasu-town-art.js',import.meta.url);
if(process.argv.includes('--check')){
  if(readFileSync(file,'utf8')!==data)throw Error('Nerikasu artwork is stale: node tools/build-nerikasu-town.mjs');
  console.log('Nerikasu artwork: '+all.length+' original SVG assets / '+entries.length+' finite variants match');
}else{
  writeFileSync(file,data);
  const out=new URL('../docs/design/towns/nerikasu-buildings/',import.meta.url);mkdirSync(out,{recursive:true});mkdirSync(new URL('svg/',out),{recursive:true});
  const buildings=[NERIKASU_ASSETS[0],...NERIKASU_BUILDINGS];
  for(const a of buildings)for(const state of a.states)writeFileSync(new URL('svg/'+a.id+'.'+state+'.svg',out),nerikasuSvg(a,{night:state==='night'}));
  writeFileSync(new URL('assets.json',out),JSON.stringify(buildings.map(({draw,...a})=>a),null,2)+'\n');
  const cards=buildings.map(a=>`<article><div class="drawing">${nerikasuSvg(a)}</div><h2>${a.name}</h2><p>${a.w}×${a.h}マス ｜ ${a.details.join('・')}</p><a href="svg/${a.id}.day.svg">昼のSVG</a> / <a href="svg/${a.id}.night.svg">夜のSVG</a></article>`).join('');
  writeFileSync(new URL('index.html',out),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ネリカスタウン・建物原画</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f0e4;color:#31594e;font:15px/1.7 'Yu Gothic',Meiryo,sans-serif}header,main{max-width:1450px;margin:auto;padding:28px}h1{font-size:36px;margin:5px 0}h2{font-size:18px}p{color:#756c58}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:20px}article{padding:20px;background:#fffcf3;border:1px solid #dad6bf;border-radius:12px}.drawing{height:260px;display:grid;place-items:center;border-bottom:1px solid #e8dfcb}.drawing svg{max-width:100%;max-height:240px;width:auto;height:auto}a{color:#31594e}small{letter-spacing:2px}button{min-height:44px;padding:10px 20px;border:1px solid #a6ad92;background:#31594e;color:#fff5df;border-radius:22px;cursor:pointer}</style><header><small>NERIKASU / BUILDINGS COLLECTION</small><h1>駅から、暮らしの町へ。</h1><p>木組み・金属屋根・レンガ・ガラス。同じ細密さで描いた22棟。各建物の実寸に合わせ、入口は南側へ。学校と保育園、お店の営業内容、住宅の暮らしが見える原画です。</p><button id="mode">夜の窓を見る</button></header><main>${cards}</main><script>const sources=${JSON.stringify(buildings.map(a=>[nerikasuSvg(a),nerikasuSvg(a,{night:true})]))};let night=false;document.getElementById('mode').onclick=e=>{night=!night;document.querySelectorAll('.drawing').forEach((el,i)=>el.innerHTML=sources[i][+night]);e.target.textContent=night?'昼の窓に戻す':'夜の窓を見る'};</script></html>`);
  console.log('Nerikasu: generated '+all.length+' assets; gallery has '+buildings.length+' buildings');
  if(process.argv.includes('--shots')){
    const {chromium}=await import('playwright'),browser=await chromium.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
      await page.goto(new URL('index.html',out).href);await page.evaluate(()=>document.fonts.ready);
      mkdirSync(new URL('img/',out),{recursive:true});
      for(const state of ['day','night']){
        if(state==='night')await page.locator('#mode').click();
        const bad=await page.locator('.drawing svg').evaluateAll(els=>els.filter(el=>{const b=el.getBBox(),v=el.viewBox.baseVal;return b.x<v.x||b.y<v.y||b.x+b.width>v.x+v.width||b.y+b.height>v.y+v.height;}).map(el=>el.getAttribute('aria-label')));
        if(bad.length)throw Error('Artwork outside bbox: '+bad.join(', '));
        await page.screenshot({path:fileURLToPath(new URL('img/buildings-'+state+'.png',out)),fullPage:true});
      }
      console.log('22 building SVGs: day/night bbox and gallery rendering verified');
    }finally{await browser.close();}
  }
}
