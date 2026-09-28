// 見本の地面SVGをCanvasの命令へ機械変換する。元の絵や配置は編集しない。
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {chromium} from 'playwright';
import * as M from './town-design/heiwadai-v02.mjs';
import * as lib from './town-design/lib.mjs';
import {REG} from './town-design/assets_more.mjs';
import {heiwadaiDesign as design,assetFoot} from './heiwadai-assets-source.mjs';
const root=new URL('../',import.meta.url),output=new URL('js/heiwadai-layout-data.js',root);
const source=readFileSync(new URL('./town-design/render.mjs',import.meta.url),'utf8').split('const selfFlip')[0].replace(/^import .*;\r?\n/gm,'');
const ctx=vm.createContext({...lib,M});
vm.runInContext(source,ctx);
const svg=vm.runInContext('sGround+sEdge+sRail+sRoad+sTact+sMark',ctx);
const extra='<pattern id="p-tactile-line-h" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#EFC03A"/><path d="M2,4 H14 M2,8 H14 M2,12 H14" stroke="#D9A61E" stroke-width="1.6" stroke-linecap="round"/></pattern>';
const defs=lib.defs().replace('</defs>',extra+'</defs>');
const patterns={};
for(const m of defs.matchAll(/<pattern id="([^"]+)"[^>]*width="([^"]+)" height="([^"]+)">([\s\S]*?)<\/pattern>/g))if(svg.includes('url(#'+m[1]+')'))patterns[m[1]]={w:+m[2],h:+m[3],svg:m[4]};
const items=list=>list.map(it=>({...it,...assetFoot(it.asset,it.opts),name:REG[it.asset].name}));
const layout={...design,buildings:items(design.buildings),props:items(design.props),decals:items(design.decals),walkers:M.WALKERS};
layout.roads=M.ROADS.map(r=>({...r,center:M.CENTER.filter(c=>c.road===r.id).map(c=>({from:c.from-26,to:c.to-26})),...(r.id==='avenue'?{edges:[{from:4,to:11},{from:21,to:99}]}:{})}));
const fingerprint=createHash('sha256').update(JSON.stringify({svg,defs,layout})).digest('hex');
if(process.argv.includes('--check')){
  const c=vm.createContext({});vm.runInContext(readFileSync(output,'utf8')+';this.data=HEIWADAI_LAYOUT_DATA;',c);
  if(c.data.fingerprint!==fingerprint)throw Error('Heiwadai layout source changed: regenerate');
  console.log('Heiwadai layout source: OK');
}else{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
  try{
    const page=await browser.newPage();
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2176">'+defs+'<g id="ground">'+svg+'</g></svg>');
    const commands=await page.evaluate(()=>[...document.querySelectorAll('#ground *')].filter(el=>el.tagName!=='g').map(el=>{
      const type=el.tagName;if(!['path','rect','circle','ellipse','text'].includes(type))throw Error('Unhandled SVG '+type);
      const s=getComputedStyle(el),m=el.getCTM(),b=el.getBBox(),pad=+parseFloat(s.strokeWidth)+2;
      const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
      let alpha=1;for(let p=el;p&&p.id!=='ground';p=p.parentElement)alpha*=parseFloat(getComputedStyle(p).opacity);
      return {type,a:Object.fromEntries([...el.attributes].map(a=>[a.name,a.value])),text:type==='text'?el.textContent:null,m:[m.a,m.b,m.c,m.d,m.e,m.f],bounds:[Math.min(...pts.map(p=>p.x))-pad,Math.min(...pts.map(p=>p.y))-pad,Math.max(...pts.map(p=>p.x))+pad,Math.max(...pts.map(p=>p.y))+pad],fill:s.fill.replace(/url\("?[^#]*#([^)"]+)"?\)/,'url(#$1)'),stroke:s.stroke,alpha,fillAlpha:+s.fillOpacity,strokeAlpha:+s.strokeOpacity,width:parseFloat(s.strokeWidth),cap:s.strokeLinecap,join:s.strokeLinejoin,dash:s.strokeDasharray==='none'?[]:s.strokeDasharray.split(/[, ]+/).map(parseFloat),rule:s.fillRule,font:s.font,align:s.textAnchor};
    }));
    writeFileSync(output,'// 自動生成: node tools/build-heiwadai-layout.mjs\nconst HEIWADAI_LAYOUT_DATA = '+JSON.stringify({fingerprint,layout,patterns,commands})+';\n');
    console.log('Heiwadai layout: '+commands.length+' vector commands, '+Object.keys(patterns).length+' patterns');
  }finally{await browser.close();}
}
