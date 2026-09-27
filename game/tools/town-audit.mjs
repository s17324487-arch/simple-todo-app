// ゲーム本体を読む。背景・へい・木で小物数を水増ししない。
import {gameContext} from './game-context.mjs';
import {townMetrics,townFailures} from './town-metrics.mjs';
const R=gameContext(),args=process.argv.slice(2),index=args.indexOf('--check'),ids=index<0?[]:args.slice(index+1).filter(a=>!a.startsWith('--'));
const rows=['town','city','heiwadai','harbor','airport'].map(id=>townMetrics(new R.WorldMap(id)));
console.table(rows.map(({id,size,buildings,propsPer100,propKinds,emptyPct,maxModelShare,roadIslands,jaggedCorners,blind})=>({id,size,buildings,propsPer100,propKinds,emptyPct,maxModelShare,roadIslands,jaggedCorners,blind:blind.length})));
if(args.includes('--detail'))for(const r of rows.filter(r=>R.MAP_DEFS[r.id].renewal))console.log(r.id,JSON.stringify({empty:r.emptyTiles,blind:r.blind}));
let failures=0;
for(const id of ids){const r=rows.find(r=>r.id===id),bad=r?townFailures(r):['missing map'];if(r&&R.MAP_DEFS[id].renewal&&r.blind.length)bad.push('phone coverage');if(bad.length){failures++;console.log('✗',id,bad.join(', '));}else console.log('✓',id);}
process.exitCode=failures?1:0;
