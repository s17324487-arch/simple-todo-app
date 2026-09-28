// 木・柵・背景は小物数に含めない。実際の通行判定と描画モデルで集計する。
export const TOWN_TARGET={propsPer100:8,propKinds:20,emptyPct:10,maxModelShare:30,roadIslands:1,jaggedCorners:0};
export function townMetrics(m){
  const d=m.def,W=m.w,H=m.h,inside=(x,y)=>x>=2&&y>=2&&x<W-2&&y<H-2;
  const excluded=new Set(['building','tree','pine','appletree','treegrate','fence','hedge','bush','gardenwall','citywall','quaywall','airport_fence']);
  const props=m.sprites.filter(s=>!excluded.has(s.kind)&&!s.o?.background),kinds=new Set(props.map(s=>s.kind));
  const occ=new Set(),add=(x,y,w=1,h=1)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)occ.add(xx+','+yy);};
  for(const s of m.sprites)add(s.bx??s.x,s.y,s.tw||1);
  for(const b of d.buildings||[])add(b.x,b.y,b.w,b.h);
  for(const o of d.objects||[])add(o.x,o.y,o.w,o.h);
  const near=(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(occ.has((x+dx)+','+(y+dy)))return true;return false;};
  let walk=0,empty=0;const emptyTiles=[],blind=[];
  const boxes=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++)if(!m.isSolid(x,y)){
    walk++;if(!near(x,y)){empty++;emptyTiles.push([x,y]);}
    // 小さい方のスマホ相当。端では本編と同様にカメラ範囲を止める。
    const view={x:Math.max(0,Math.min(W-11,x-5)),y:Math.max(0,Math.min(H-19,y-9)),w:11,h:19};
    const b=(d.buildings||[]).some(b=>boxes(view,{x:b.x,y:b.y-.75,w:b.w,h:b.h+.75}))||(d.objects||[]).filter(o=>['lighthouse','controltower'].includes(o.kind)).some(o=>boxes(view,{x:o.x,y:o.y-2,w:o.w,h:o.h+2}));
    const p=props.some(s=>boxes(view,{x:s.bx??s.x,y:s.y-1,w:s.tw||1,h:2}));
    const n=(d.npcs||[]).some(n=>boxes(view,{x:n.x,y:n.y-1,w:1,h:2}));
    if(!b||!p||!n)blind.push({x,y,missing:[!b&&'building',!p&&'prop',!n&&'npc'].filter(Boolean)});
  }
  const models={};for(const b of d.buildings||[]){const k=b.style||((b.tower?'tower':b.terminal?'terminal':'house')+':'+b.w+'x'+b.h);models[k]=(models[k]||0)+1;}
  const nb=(d.buildings||[]).length;
  const roadChars=new Set(['=','-','v','z','b','p','D','g']);
  const isRoad=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&(m.roadGrid ? (m.roadGrid[y][x]&&m.roadGrid[y][x]!=='island')||(['=','b','D'].includes(d.rows[y][x])) :roadChars.has(d.rows[y][x]));
  let jag=0,comps=0;const seen=new Set();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(isRoad(x,y)){
    // ベクターは斜め縁が連続。タイルしか描かない場合の対角隣接をギザギザとする。
    if(!m.roadGrid){if(isRoad(x+1,y+1)&&!isRoad(x+1,y)&&!isRoad(x,y+1))jag++;if(isRoad(x-1,y+1)&&!isRoad(x-1,y)&&!isRoad(x,y+1))jag++;}
    if(!seen.has(x+','+y)){
      comps++;const q=[[x,y]];seen.add(x+','+y);
      for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=q[i][0]+dx,ny=q[i][1]+dy,k=nx+','+ny;if(isRoad(nx,ny)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}
    }
  }
  return {id:m.id,size:`${W}x${H}`,buildings:nb,propsPer100:+(props.length/Math.max(1,walk)*100).toFixed(1),propKinds:kinds.size,emptyPct:+(empty/Math.max(1,walk)*100).toFixed(1),maxModelShare:nb?+(Math.max(...Object.values(models))/nb*100).toFixed(1):0,roadIslands:comps,jaggedCorners:jag,emptyTiles,blind,walk,props:props.length};
}
export function townFailures(r){return Object.entries(TOWN_TARGET).filter(([k,v])=>['propsPer100','propKinds'].includes(k)?r[k]<v:k==='roadIslands'?r[k]!==v:r[k]>v).map(([k])=>k);}
