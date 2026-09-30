// おうちの 2かい（js/home-floors.js）の かたちの 検査: 2かいは 1かいの みぎ うえ。1かいの おくの ながい かべの うえの ふちに
// 2かいの ゆかの まえの ふち（ながい 辺）が くっつき、画面で 2かいの ゆか・へやと 1かいは かさならない（ひろさ 4 とおり）。
// かいだん・おどりばの タップの ところも 2かいの ゆかに かからない。3人の みちは 1かいの かいだん → おどりば → 2かいの ゆか。
import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,HomeFloors:F,HomeDesign,ROOM}=gameContext();
Save.d=Save.fresh();Save.write=()=>{};
const inPoly=(poly,p)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],q=poly[j];if((a.y>p.y)!==(q.y>p.y)&&p.x<((q.x-a.x)*(p.y-a.y))/(q.y-a.y)+a.x)c=!c;}return c;};
const inner=(poly,k=0.5)=>{const cx=poly.reduce((s,p)=>s+p.x,0)/poly.length,cy=poly.reduce((s,p)=>s+p.y,0)/poly.length,out=[];
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];for(let t=0;t<=20;t++){const x=a.x+(b.x-a.x)*t/20,y=a.y+(b.y-a.y)*t/20,d=Math.hypot(cx-x,cy-y)||1;out.push({x:x+(cx-x)/d*k,y:y+(cy-y)/d*k});}}return out;};
const apart=(A,B)=>!inner(A).some(p=>inPoly(B,p))&&!inner(B).some(p=>inPoly(A,p));
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6;
let n=0;
for(const e1 of [false,true])for(const e2 of [false,true])for(const upper of [false,true]){
  Save.d.rooms.owned.upstairs=true;Save.d.rooms.expanded={main:e1,upstairs:e2};Save.d.rooms.active=upper?'upstairs':'main';
  const sc={s:1,ox:0,oy:0,chars:[],life:{}},s1=F.size('main'),s2=F.size('upstairs');
  const main=F.roomPoly(sc,'main'),up=F.roomPoly(sc,'upstairs'),floor2=F.floorPoly(sc,'upstairs'),stairs=F.stairsPoly(sc,F.base(sc)),top=F.roomAt(sc,'main');
  const tag=JSON.stringify({e1,e2,upper});
  // みぎ うえ・かさならない・くっつく（ゆかの まえの ふちの りょうはしが かべの うえの ふちの 上）
  const cx=(ps)=>ps.reduce((s,p)=>s+p.x,0)/ps.length,cy=(ps)=>ps.reduce((s,p)=>s+p.y,0)/ps.length;
  assert(cx(up)>cx(main)&&cy(up)<cy(main),'2F is up-right of 1F '+tag);
  assert(apart(floor2,main)&&apart(up,main),'2F floor/room overlaps 1F '+tag);
  const w0=top(0,0,HomeDesign.H),w1=top(s1.w,0,HomeDesign.H),f0=floor2[4],f1=floor2[3],along=(p)=>Math.abs((w1.x-w0.x)*(p.y-w0.y)-(w1.y-w0.y)*(p.x-w0.x))/Math.hypot(w1.x-w0.x,w1.y-w0.y);
  assert(near(f0,w0)&&along(f1)<1e-6,'2F floor front edge sits on the 1F long wall top '+tag);
  assert(s2.w>=s2.d&&s1.w>=s1.d,'long edges are x '+tag);
  assert(!stairs.some(p=>inPoly(floor2,p)),'stairs tap area covers the 2F floor '+tag);
  // 3人の みち: のぼり（1かいの へやの 座標）は かいだんの した → かべの うえ（z=H）→ 2かいの ゆか（z=H+LIFT・かべの うしろ）
  if(!upper){const w=F.path(sc,'up'),last=w[w.length-1],D=HomeDesign.H+F.LIFT;
    assert(w[0].z===0&&w.some(q=>q.z===HomeDesign.H&&q.y-ROOM.WALL<F.STAIR.top)&&last.z===D&&last.y<ROOM.WALL,'up path via the landing '+tag);
    const at=F.roomAt(sc,'main'),q=at(last.x,last.y-ROOM.WALL,last.z);assert(inPoly(floor2,q),'up path ends on the 2F floor '+tag);}
  else{const w=F.path(sc,'down'),last=w[w.length-1];assert(w[0].z===0&&last.z===-(HomeDesign.H+F.LIFT),'down path ends on the 1F floor '+tag);}
  n++;
}
// ふだ（「1かいへ」「2かいへ」）は ない。かいだん・へやの タップで いどう
assert(!('drawSigns' in F),'floor signs are gone');
console.log(`Home 2F: up-right of 1F on the long wall, no overlap, touching edge, stairs tap area and climb paths OK (${n} layouts)`);
