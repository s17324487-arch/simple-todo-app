import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {heiwadaiSources,heiwadaiBbox} from './heiwadai-assets-source.mjs';
const check=process.argv.includes('--check'),group=process.argv.includes('--ab')?'AB':'S';
const out=new URL('../js/heiwadai-assets-'+group.toLowerCase()+'.js',import.meta.url);
const name='HEIWADAI_ASSETS_'+group,data=heiwadaiSources(group);
if(check){
  const old=vm.runInNewContext(readFileSync(out,'utf8')+';'+name,{HeiwadaiArt:{register(){}}});
  const normalized=JSON.parse(JSON.stringify(old));
  for(const e of normalized.entries){assert(e.bbox.length===4&&e.bbox.every(Number.isFinite));if(!Object.keys(e.opts).length)assert.deepEqual(e.bbox,heiwadaiBbox[e.asset]);delete e.bbox;}
  assert.deepEqual(normalized,data,'元のSVG・色・細部・種類・オプションが一致しない');
  console.log('Heiwadai '+group+': '+Object.keys(data.assets).length+' assets / '+data.entries.length+' exact SVG variants verified.');
}else{
  const {chromium}=await import('playwright');
  const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  try{
    const page=await browser.newPage();
    await page.setContent('<!doctype html><meta charset="utf-8"><svg xmlns="http://www.w3.org/2000/svg">'+data.defs+data.entries.map((e,i)=>'<g id="measure'+i+'">'+e.svg+'</g>').join('')+'</svg>');
    await page.evaluate(()=>document.fonts.ready);
    const bounds=await page.evaluate(n=>Array.from({length:n},(_,i)=>{const b=document.getElementById('measure'+i).getBBox();return [Math.floor(b.x),Math.floor(b.y),Math.ceil(b.x+b.width),Math.ceil(b.y+b.height)];}),data.entries.length);
    data.entries.forEach((e,i)=>e.bbox=Object.keys(e.opts).length?bounds[i]:heiwadaiBbox[e.asset]);
  }finally{await browser.close();}
  writeFileSync(out,'// 自動生成: node tools/build-heiwadai-assets.mjs'+(group==='AB'?' --ab':'')+'。見本のSVGを手で変更しない。\nconst '+name+' = '+JSON.stringify(data)+';\nHeiwadaiArt.register('+name+');\n');
  console.log('Generated '+Object.keys(data.assets).length+' assets / '+data.entries.length+' variants.');
}
