// おうちの 2かい（js/home-floors.js）の かたちの 検査: 2かいは 1かいの みぎ うえ。1かいの おくの ながい かべの うえの ふちに
// 2かいの ゆかの まえの ふち（ながい 辺）が くっつき、画面で 2かいの ゆか・へやと 1かいは かさならない（ひろさ 4 とおり）。
// かいだん・おどりばの タップの ところも 2かいの ゆかに かからない。3人の みちは 1かいの かいだん → おどりば → 2かいの ゆか。
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';
const {Save,HomeFloors:F,HomeDesign,ROOM,SvgCache}=gameContext();
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
// UI-92: いない ほうの かいの 1まいの 絵に、描く ときに はじめて よみこむ 絵（フィギュア だいの フィギュア・うごく かぐ）も はいる。
// よみこみの とちゅうで もういちど よんだ／へやを でた／かいを うつった ときは まえの ぶんを すてる
const realm=F.swap.constructor('return this')(),doc=realm.document,mk=doc.createElement,drawn=[];
doc.createElement=(tag)=>{const e=mk(tag);if(tag==='canvas')e.getContext=()=>({drawImage:(img)=>drawn.push([e,img&&img.k])});return e;};
SvgCache.clear();SvgCache._load=function(k){return new Promise((res)=>setTimeout(()=>{const c={k};this.map.set(k,c);this.pending.delete(k);res(c);},3));};
const bakeRooms=()=>{Save.d=Save.fresh();Save.write=()=>{};const rs=Save.d.rooms,main=Save.d.room;rs.owned.upstairs=true;
  main.items=[{uid:1,id:'figstand_step',x:200,y:300,figs:['aqfig_turtle']}];rs.stored={main};Save.d.room={wall:main.wall,floor:main.floor,items:[],wallpapers:{},floors:{},nextUid:1};rs.active='upstairs';};
const bakeScene=()=>({ox:0,oy:0,s:1,mode:null,sel:null,life:{furniture:{}},
  furnCanvas(it,ensure){return ensure?SvgCache.ensure('furn:'+it.id,()=>'',8,8):SvgCache.get('furn:'+it.id,()=>'',8,8);},
  drawOrder(){return Save.d.room.items.slice();},
  // うごく ぶぶん（FurnLive の フィギュア など）は 描く ときに SvgCache.get で よむ
  drawFurn(ctx,it){const a=this.furnCanvas(it,false);if(a)ctx.drawImage(a);const live=SvgCache.get('live:'+it.id,()=>'',4,4);if(live)ctx.drawImage(live);}});
bakeRooms();let sc=bakeScene();await F.prepare(sc);
const on=(cv)=>drawn.filter(([e])=>e===cv).map(([,k])=>k);
assert(sc.floorImage&&sc.floorImage.id==='main','the 1F picture is baked while on 2F');
const got=on(sc.floorImage.cv);
assert(got.some((k)=>/^house-design:main:/.test(k))&&got.includes('furn:figstand_step@8x8')&&got.some((k)=>/^house-stairs:/.test(k)),'1F picture has the room, the stand and the stairs '+JSON.stringify(got));
assert(got.includes('live:figstand_step@4x4'),'1F picture has the figures on the stand (loaded on first draw) '+JSON.stringify(got));
assert(Save.d.rooms.active==='upstairs'&&Save.d.room.items.length===0&&Save.d.rooms.stored.main.items.length===1,'rooms are put back after baking');
// とちゅうで もういちど: あとの ほうだけ のこる（まえの 絵は 描かない）
bakeRooms();SvgCache.clear();sc=bakeScene();drawn.length=0;
const p1=F.prepare(sc),p2=F.prepare(sc);await Promise.all([p1,p2]);
const bgs=new Set(drawn.filter(([,k])=>/^house-design:/.test(k)).map(([e])=>e));
assert(sc.floorImage&&bgs.size===1&&bgs.has(sc.floorImage.cv),'only the latest bake draws '+bgs.size);
// へやを でた（exit で floorSeq が すすむ）・かいを うつった: 絵を のこさない
bakeRooms();SvgCache.clear();sc=bakeScene();let p=F.prepare(sc);sc.floorSeq++;await p;
assert(sc.floorImage===null,'a bake that finishes after leaving the room is dropped');
bakeRooms();SvgCache.clear();sc=bakeScene();p=F.prepare(sc);{const rs=Save.d.rooms,up=Save.d.room;Save.d.room=rs.stored.main;rs.stored={upstairs:up};rs.active='main';}await p;
assert(sc.floorImage===null,'a bake for the floor we moved to is dropped');
assert(/this\.floorSeq = \(this\.floorSeq \|\| 0\) \+ 1/.test(readFileSync(new URL('../js/home-floors.js',import.meta.url),'utf8').match(/wrap\("exit"[^\n]*/)[0]),'exit drops a bake in flight');
console.log(`Home 2F: up-right of 1F on the long wall, no overlap, touching edge, stairs tap area and climb paths OK (${n} layouts); the other floor's picture waits for figures on stands and drops stale bakes`);
