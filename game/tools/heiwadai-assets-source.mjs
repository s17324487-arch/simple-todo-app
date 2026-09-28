// 元の draw() をそのまま使う。ゲームはここから生成した有限個の SVG を読む。
import {readFileSync} from 'node:fs';
import {REG} from './town-design/assets_more.mjs';
import {defs} from './town-design/lib.mjs';
export const heiwadaiDesign=JSON.parse(readFileSync(new URL('../docs/design/towns/heiwadai/heiwadai-v02.json',import.meta.url),'utf8'));
export const heiwadaiBbox=JSON.parse(readFileSync(new URL('../docs/design/towns/heiwadai/asset-bbox.json',import.meta.url),'utf8'));
export const optionKey=o=>JSON.stringify(Object.fromEntries(Object.entries(o||{}).sort(([a],[b])=>a.localeCompare(b))));
export function assetFoot(asset,o={}){
  let {w,h}=REG[asset];
  if(o.len){if(o.dir==='v'){w=1;h=o.len;}else{w=o.len;h=1;}}
  if(['veh.car','veh.taxi','veh.kei'].includes(asset)&&['e','w'].includes(o.dir)){w=2;h=1;}
  return {w,h};
}
export function heiwadaiSources(priorities='S'){
  const entries=[],assets={};
  const placed=['buildings','props','overhead','decals'].flatMap(k=>heiwadaiDesign[k]);
  for(const a of Object.values(REG).filter(a=>priorities.includes(a.prio))){
    const {draw,...meta}=a;assets[a.id]=meta;
    const options=new Map([['{}',{}]]);
    for(const it of placed.filter(it=>it.asset===a.id))options.set(optionKey(it.opts),it.opts||{});
    for(const [key,opts] of options)entries.push({asset:a.id,kind:'heiwadai_'+a.id.replaceAll('.','_'),opts:JSON.parse(key),...assetFoot(a.id,opts),svg:draw({...opts})});
  }
  return {priorities,defs:defs(),assets,entries};
}
