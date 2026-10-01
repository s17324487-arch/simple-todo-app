// 池袋の 建物の 原画。平和台・ネリカスと おなじ 32px/マス・南向き・左上の 光。bbox は 足もとの 左上が 原点。
// 本編へは tools/build-ikebukuro-town.mjs が そのまま 登録する（js/ikebukuro-town-art.js）。昼と 夜の 2つだけ。
// 大きな 建物は「屋上（うえの おく）→ 正面の かべ → 1かいの 入口」の じゅんに 描く。入口の まんなかは 足もとの door の マス。
import {INK,R,Rn,C,E,Pth,L,T,shade,hash} from './lib.mjs';
const g=(x,y,s)=>`<g transform="translate(${x},${y})">${s}</g>`;
const cream='#F4EEE2',stone='#E3DACB',steel='#6F7F8A',night='#F2CF86',nightHi='#FFE7AE',sky='#A9CCD6',skyHi='#E6F4F4';
// ガラス 1まい。昼は 空の 色と ななめの 反射、夜は あかりの ついた へやと 消えた へや（seed で 決まる）
function pane(x,y,w,h,n,seed=0,o={}){
  const lit=n&&hash(Math.round(x),Math.round(y),seed)<(o.litRate??.62);
  const base=n?(lit?night:'#5D6A7B'):(o.tint||sky);
  let s=R(x,y,w,h,base,{sw:o.sw??.8,stroke:o.stroke||INK});
  if(!n)s+=Pth(`M${x+1.5},${y+h-1.5} L${x+w*.55},${y+1.5} H${x+w*.78} L${x+w*.22},${y+h-1.5}Z`,o.hi||skyHi,{sw:0,op:.7});
  else if(lit)s+=Rn(x+1,y+h*.62,w-2,h*.38-1,'#E3B56A',{op:.55})+Rn(x+w*.18,y+2,w*.3,h*.25,nightHi,{op:.8});
  return s;
}
// カーテンウォール（ます目の ガラスと 方立て）
function curtain(x,y,w,h,cols,rows,n,seed=0,o={}){
  const cw=w/cols,rh=h/rows;let s=R(x,y,w,h,o.frame||'#51606B',{sw:1});
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)s+=pane(x+c*cw+1.2,y+r*rh+1.2,cw-2.4,rh-2.4,n,seed+r*31+c,{sw:0,tint:o.tint,hi:o.hi,litRate:o.litRate});
  if(!n)s+=Pth(`M${x+w*.08},${y+h} L${x+w*.46},${y} H${x+w*.6} L${x+w*.22},${y+h}Z`,'#FFFFFF',{sw:0,op:.12});
  return s;
}
// 右がわの おく行き（影の 面）と 足もとの 影
const sideFace=(x,y,h,d=10,c=stone)=>Pth(`M${x},${y} l${d},-${d*.6} V${y+h-d*.6} l-${d},${d*.6}Z`,shade(c,-.2),{sw:.9});
const dropShadow=(w,h,d=14)=>Pth(`M${w},${h-6} l${d},${d*.45} V${h+d*.35} H${d*.8} L0,${h}Z`,'#1A1410',{sw:0,op:.16});
// かんばん（大きな かな＋小さな 英字）
function signBoard(x,y,w,h,jp,en,bg,fg='#FFF7E4',o={}){
  let s=R(x,y,w,h,bg,{sw:1,rx:o.rx??2})+L(x+3,y+2.5,x+w-3,y+2.5,shade(bg,.45),.8);
  const size=o.size||Math.min(h*.5,w/(jp.length*1.02));
  s+=T(x+w/2,y+(en?h*.56:h*.66),jp,{size,fill:fg});
  if(en)s+=T(x+w/2,y+h*.86,en,{size:Math.min(h*.2,6),fill:shade(bg,.6),ls:1});
  return s;
}
// 自動ドア（ガラス 2まい・床の レール）
function autoDoor(cx,bottom,w,h,n,o={}){
  let s=R(cx-w/2-4,bottom-h-4,w+8,h+4,o.frame||'#56636C',{sw:1});
  s+=pane(cx-w/2,bottom-h,w/2-1,h,n,7,{litRate:1})+pane(cx+1,bottom-h,w/2-1,h,n,8,{litRate:1});
  s+=L(cx,bottom-h,cx,bottom,INK,1.1)+Rn(cx-5,bottom-h*.5,2,9,'#E9E4D6')+Rn(cx+3,bottom-h*.5,2,9,'#E9E4D6');
  s+=R(cx-w/2-8,bottom-2.5,w+16,2.5,'#C9C2B2',{sw:.6});
  if(o.mat)s+=Rn(cx-w/2+2,bottom-4.5,w-4,2,o.mat);
  return s;
}
function awning(x,y,w,c1,c2='#FBF4E6',depth=12){
  const bx=(t)=>x-4+t/w*(w+8);let s=Pth(`M${x},${y} h${w} l4,${depth} h-${w+8}Z`,c2,{sw:.9});
  for(let i=0;i<w;i+=12)s+=Pth(`M${x+i},${y} h6 L${bx(i+6)},${y+depth} H${bx(i)}Z`,c1,{sw:0});
  let v=`M${x-4},${y+depth}`;const n=Math.ceil((w+8)/8);for(let i=0;i<n;i++)v+=` q4,6 ${(w+8)/n},0`;
  return s+Pth(v+'Z',c1,{sw:.8});
}
const acUnit=(x,y)=>R(x,y,18,11,'#D8DAD4',{sw:.8})+C(x+6,y+5.5,3.6,'#B9BDB6',{sw:.6})+L(x+6,y+2,x+6,y+9,'#8F948C',.6)+L(x+2.5,y+5.5,x+9.5,y+5.5,'#8F948C',.6)+Rn(x+12,y+3,4,1.2,'#A3A89F')+Rn(x+12,y+6,4,1.2,'#A3A89F');
const tank=(x,y)=>R(x,y+10,22,4,'#8C979D',{sw:.7})+R(x+2,y-4,18,15,'#C3CDD1',{sw:.9,rx:3})+L(x+4,y+1,x+18,y+1,'#E6EDEF',1)+L(x+4,y+14,x+2,y+20,INK,.8)+L(x+18,y+14,x+20,y+20,INK,.8);
const antenna=(x,y,h=22)=>L(x,y,x,y-h,INK,1.1)+L(x-5,y-h*.7,x+5,y-h*.7,INK,.8)+C(x,y-h,1.6,'#E25B4F',{sw:.5});
// 植えこみ（木箱と 花）
function planter(x,y,w,n){
  let s=R(x,y,w,9,'#B98E6B',{sw:.8})+Rn(x+2,y-3,w-4,3.5,'#6C7A4B');
  for(let i=4;i<w-2;i+=7){const c=['#E8A0B4','#F2D16B','#FFFFFF','#B8A2D8'][Math.floor(hash(x+i,y,3)*4)];s+=E(x+i,y-4,4,3,'#7FA563',{sw:.5})+C(x+i+1,y-6,1.6,c,{sw:.3});}
  return s;
}
// サンシャインいけぶの マーク（おひさま）
function sunMark(x,y,r){let s='';for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=L(x+Math.cos(a)*r*1.18,y+Math.sin(a)*r*1.18,x+Math.cos(a)*r*1.55,y+Math.sin(a)*r*1.55,'#F2A33A',r*.22);}return s+C(x,y,r,'#F6B846',{sw:.9})+Pth(`M${x-r*.45},${y+r*.1} q${r*.45},${r*.5} ${r*.9},0`,'none',{sw:r*.12,stroke:'#B5652B'})+C(x-r*.33,y-r*.2,r*.1,'#B5652B',{sw:0})+C(x+r*.33,y-r*.2,r*.1,'#B5652B',{sw:0});}
// いけふくろうの マーク（まるい めの ふくろう）
function owlMark(x,y,s,c='#8C6A4E'){return g(x,y,`<g transform="scale(${s})">`+Pth('M-10,8 Q-12,-6 -7,-11 L-8,-17 L-3,-12 Q0,-13 3,-12 L8,-17 L7,-11 Q12,-6 10,8 Q0,14 -10,8Z',c,{sw:1})+C(-4,-5,4,'#FFF7E4',{sw:.8})+C(4,-5,4,'#FFF7E4',{sw:.8})+C(-4,-5,1.7,INK,{sw:0})+C(4,-5,1.7,INK,{sw:0})+Pth('M-1.5,-1 L0,2 L1.5,-1Z','#F2B23A',{sw:.6})+Pth('M-6,6 q2,-3 4,0 q2,-3 4,0 q2,-3 4,0','none',{sw:.8,stroke:shade(c,.35)})+'</g>');}
// 電球の ならぶ ふち（夜は ひかる）
function bulbs(x,y,w,h,n,step=9){let s='';const dot=(px,py,i)=>s+=C(px,py,1.9,n?(i%2?'#FFE6A0':'#FFF6D5'):(i%2?'#F4E3B0':'#FFFFFF'),{sw:.45});let i=0;for(let t=0;t<=w;t+=step){dot(x+t,y,i++);dot(x+t,y+h,i++);}for(let t=step;t<h;t+=step){dot(x,y+t,i++);dot(x+w,y+t,i++);}return s;}
// 屋上の へり（パラペット）と 屋上の 面
function roofDeck(x,y,w,h,c='#C9CDC8'){return R(x,y,w,h,c,{sw:1})+L(x+3,y+3,x+w-3,y+3,shade(c,.35),1.2)+R(x-2,y+h-4,w+4,6,shade(c,-.18),{sw:.9});}
// たれまくの 文字（行ごと）
const lines=(x,y,rows,size,fill='#FFFFFF',gap=1.25)=>rows.map((t,i)=>T(x,y+i*size*gap,t,{size,fill})).join('');
// 階ごとの 帯
const band=(x,y,w,c)=>R(x,y,w,5,c,{sw:.7})+L(x+2,y+1.3,x+w-2,y+1.3,shade(c,.4),.7);

// ===== 池袋えき（東口の 駅ビル） =====
function station(o={}){
  const n=!!o.night,W=384,H=384,cx=208;let s=dropShadow(W,H,16);
  // 屋上: ガラスの アーチ天窓と 設備
  s+=roofDeck(4,4,W-8,78,'#CBD0CC');
  s+=Pth(`M112,74 V40 Q208,6 304,40 V74Z`,n?'#8FA3B8':'#B5D3DB',{sw:1.2});
  for(let x=124;x<=292;x+=12){const top=40-Math.sin(Math.PI*(x-112)/192)*31;s+=L(x,top+2,x,74,'#6F8794',.9);}
  s+=Pth(`M112,40 Q208,6 304,40`,'none',{sw:2.2,stroke:'#56707D'})+L(112,57,304,57,'#6F8794',.9);
  if(!n)s+=Pth('M132,72 L156,34 H172 L148,72Z','#FFFFFF',{sw:0,op:.35});
  s+=acUnit(18,22)+acUnit(40,22)+acUnit(18,44)+tank(336,18)+antenna(364,22,18)+R(40,48,50,12,'#D9DDD6',{sw:.8});
  // 正面の かべ: 左右の つばさ（横長の まど 3だん）と まんなかの ガラスの 吹きぬけ
  s+=R(6,82,W-12,H-82,cream,{sw:1.3})+sideFace(W-6,82,H-82,10,cream);
  for(const [x0,x1] of [[14,112],[304,370]])for(const y of [96,140,184]){s+=R(x0,y,x1-x0,32,'#51606B',{sw:1});for(let x=x0+3;x<x1-6;x+=19.4)s+=pane(x,y+3,16.4,26,n,y+x0,{sw:0});}
  for(const y of [132,176,220])s+=band(10,y,106,'#E3DACB')+band(300,y,74,'#E3DACB');
  for(const x of [40,86,330])s+=Rn(x,92,4,132,shade(cream,-.08));
  s+=curtain(118,90,180,212,6,8,n,11,{tint:'#9EC3CF'});
  for(const x of [118,298])s+=R(x-4,86,8,220,'#D6CCBA',{sw:1});
  // 駅名の かんばん（ガラスの まえに つるす）・路線の マーク・時計
  s+=L(150,90,150,104,INK,1)+L(266,90,266,104,INK,1)+R(110,102,196,40,'#2F5D50',{sw:1.3,rx:3})+L(114,106,302,106,'#6F9A89',1);
  s+=owlMark(132,122,.95,'#C99A6A')+T(214,127,'池袋えき',{size:21,fill:'#FFF7E4'})+T(214,138,'IKEBUKURO STATION',{size:6.2,fill:'#BFD8CC',ls:1.5});
  s+=C(cx,172,17,'#2F5D50',{sw:1.2})+C(cx,172,13.5,'#FFFCF0',{sw:.8});
  for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=L(cx+Math.sin(a)*10,172-Math.cos(a)*10,cx+Math.sin(a)*12.5,172-Math.cos(a)*12.5,INK,.9);}
  s+=L(cx,172,cx-6,166,INK,1.5)+L(cx,172,cx+8,169,INK,1.2)+C(cx,172,1.4,'#C0735A',{sw:0});
  for(const [i,c,t] of [[0,'#78B267','ま'],[1,'#E3884A','ね'],[2,'#6B93C9','ち']])s+=C(cx-26+i*26,218,9,c,{sw:1})+T(cx-26+i*26,222,t,{size:10,fill:'#FFFFFF'});
  s+=R(cx-58,234,116,15,'#FFF8E8',{sw:.8,rx:7})+T(cx,245,'でんしゃ 3せん ・ ちかてつ',{size:7.2,fill:'#2F5D50'});
  // ひさし（ガラスと はがね・東口の 文字）と 柱
  s+=Pth(`M52,300 H364 L374,316 H42Z`,n?'#9FB2B5':'#CFE3E5',{sw:1.1})+R(40,316,336,6,'#56636C',{sw:.9})+T(208,312,'ひがしぐち  EAST EXIT',{size:7.5,fill:'#2F4E58',ls:1});
  for(const x of [66,352])s+=R(x-3,322,6,H-324,'#8E9AA1',{sw:.8});
  // 1かい: 改札の 見える 入口ホール（大きな 自動ドア 3くみ）
  s+=R(88,322,240,H-324,'#46545D',{sw:1.1});
  s+=R(92,326,232,17,n?'#1E3530':'#243B35',{sw:.8})+T(208,337.5,'のりば 1・2・3   まちのわせん  ネリカスせん  ちかてつ',{size:6.2,fill:n?'#F7E08D':'#C9E7A6'});
  s+=autoDoor(cx,H-3,62,36,n,{mat:'#B6A88E'})+autoDoor(126,H-3,46,34,n)+autoDoor(290,H-3,46,34,n);
  // 左: きっぷうりば、右: コインロッカーと えきの ちず
  s+=R(12,322,70,H-324,'#D9D2C2',{sw:1})+signBoard(16,326,62,14,'きっぷ うりば','TICKETS','#2F5D50');
  for(const x of [18,40,60]){s+=R(x,344,17,H-350,'#D5D9CC',{sw:.8,rx:1.5})+Rn(x+2,347,13,3,'#5E8B73')+R(x+3,352,11,9,n?'#BDE6D1':'#4F7C73',{sw:.5})+R(x+3,366,11,2.5,INK,{sw:0});}
  s+=R(334,322,42,H-324,'#D9D2C2',{sw:1});
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)s+=R(337+c*12.4,326+r*12,11,10.5,['#A9C1CF','#C9B7D5','#E2C38E'][(r+c)%3],{sw:.6})+C(337+c*12.4+8,326+r*12+5,1,'#56636C',{sw:0});
  s+=R(337,364,36,H-368,'#FFF8E8',{sw:.7})+Pth('M341,375 q8,-8 14,-2 t14,-4','none',{sw:1.2,stroke:'#78B267'})+C(349,371,1.6,'#E25B4F',{sw:0})+T(355,367.5,'ちず',{size:5,fill:INK});
  s+=Pth(`M6,${H-1.5} H${W-6}`,'none',{sw:1.2,stroke:'#B3AA98'});
  if(n)s+=E(cx,H-4,96,10,'#FFE3A0',{sw:0,op:.24})+Rn(110,102,196,40,'#FFF1C4',{op:.08})+C(cx,172,20,'#FFF1C4',{sw:0,op:.18});
  return s;
}

// 本だなの ならぶ まど（色とりどりの 背表紙）
function shelfWindow(x,y,w,h,n,seed=0,arch=true){
  let s=arch?Pth(`M${x},${y+h} V${y+w/2} A${w/2},${w/2} 0 0 1 ${x+w},${y+w/2} V${y+h}Z`,n?'#F6D99A':'#F6EEDC',{sw:1}):R(x,y,w,h,n?'#F6D99A':'#F6EEDC',{sw:1});
  const top=arch?y+w/2:y+2;for(let r=0;r<3;r++){const yy=top+r*(h-(top-y))/3;s+=L(x+1,yy+(h-(top-y))/3-1,x+w-1,yy+(h-(top-y))/3-1,'#9B7152',1.4);
    for(let bx=x+2;bx<x+w-4;bx+=4.2){const hh=((h-(top-y))/3-4)*(.65+hash(bx,yy,seed)*.35);s+=Rn(bx,yy+(h-(top-y))/3-1.8-hh,3.4,hh,['#C4696A','#6E97B8','#E0B75A','#7FA66F','#A987B8','#E08E5E'][Math.floor(hash(bx,yy,seed+1)*6)]);}}
  if(!n)s+=Pth(`M${x+3},${y+h-3} L${x+w*.6},${top} h${w*.2} L${x+w*.25},${y+h-3}Z`,'#FFFFFF',{sw:0,op:.28});
  return s;
}
// ===== ほんの ギャラリー（おおきな 本やさん） =====
function bookstore(o={}){
  const n=!!o.night,W=384,H=384,cx=208,brick='#B97A5E';let s=dropShadow(W,H,16);
  // 屋上: ちいさな 庭と「BOOKS」の 文字
  s+=roofDeck(4,4,W-8,56,'#C8C3B6');
  for(const [x,r]of [[40,10],[62,13],[88,9],[300,11],[326,14]])s+=E(x,40,r,r*.8,'#7FA563',{sw:.9})+E(x-r*.3,36,r*.45,r*.35,'#A3C27E',{sw:0});
  s+=R(120,24,150,10,'#9C8A70',{sw:.8});for(const [i,ch]of [...'BOOKS'].entries())s+=R(128+i*28,-10,22,32,n?'#FFE7A8':'#FFF6DE',{sw:1.1,rx:3})+T(139+i*28,15,ch,{size:20,fill:'#2F5D50'});
  // 正面: れんがの かべ・石の 柱・アーチの 本だな まど 4かい
  s+=R(6,58,W-12,H-58,brick,{sw:1.3})+sideFace(W-6,58,H-58,10,brick);
  for(let y=62;y<H-100;y+=9)s+=L(8,y,W-8,y,shade(brick,.18),.5);
  for(const x of [8,72,136,248,312,370])s+=R(x,58,8,H-150,'#E9DCC6',{sw:.8});
  for(let f=0;f<4;f++){const y=66+f*52;for(const x of (f<2?[22,86,262,326]:[22,86,156,204,262,326]))s+=shelfWindow(x,y,38,44,n,f*7+x,true)+R(x-3,y+44,44,4,'#E9DCC6',{sw:.7});}
  // まんなかの たてかんばん（ひらいた 本）
  s+=R(150,66,98,96,'#2F5D50',{sw:1.2,rx:3})+Pth('M174,112 q25,-12 25,4 q0,-16 25,-4 V140 q-25,-10 -25,6 q0,-16 -25,-6Z','#FFF6DE',{sw:1})+L(199,116,199,146,INK,1);
  for(const y of [120,127,134])s+=L(179,y,195,y-4,'#9B7152',.8)+L(203,y-4,219,y,'#9B7152',.8);
  s+=T(199,90,'ほんの',{size:14,fill:'#F4D98C'})+T(199,104,'BOOK GALLERY',{size:6,fill:'#BFD8CC',ls:1.2});
  // 横の かんばん
  s+=R(40,272,304,26,'#2F5D50',{sw:1.2,rx:2})+T(192,290,'ほんの ギャラリー',{size:16,fill:'#F4D98C'})+owlMark(64,285,.7,'#C99A6A')+owlMark(320,285,.7,'#C99A6A');
  // 1かい: 本の かざり まど・木の 入口・えほんの ポスター
  s+=R(8,300,W-16,H-302,'#8A5E45',{sw:1});
  for(const x of [18,262]){s+=R(x,308,104,H-318,'#F3E6CC',{sw:1});for(let i=0;i<5;i++){const bx=x+8+i*19;for(let k=0;k<4;k++)s+=R(bx,H-22-k*6,16,5,['#C4696A','#6E97B8','#E0B75A','#7FA66F','#A987B8'][(i+k)%5],{sw:.5});}
    s+=R(x+30,314,44,34,'#FFFDF4',{sw:.8})+C(x+52,328,8,'#D9A36E',{sw:.7})+C(x+46,322,3,'#D9A36E',{sw:.6})+C(x+58,322,3,'#D9A36E',{sw:.6})+C(x+49,327,1,INK,{sw:0})+C(x+55,327,1,INK,{sw:0})+T(x+52,345,x<200?'えほん フェア':'あたらしい ほん',{size:5.4,fill:INK});
    if(!n)s+=Pth(`M${x+4},${H-12} L${x+40},${310} h14 L${x+18},${H-12}Z`,'#FFFFFF',{sw:0,op:.25});else s+=Rn(x+1,309,102,H-320,'#FFE3A0',{op:.25});}
  s+=Pth(`M150,318 H266 L272,328 H144Z`,'#2F5D50',{sw:1})+autoDoor(cx,H-3,70,40,n,{frame:'#6B4A36',mat:'#B08A62'});
  s+=R(126,H-30,18,26,'#9B7152',{sw:.8})+L(128,H-22,142,H-22,'#E8D5B5',.8)+L(128,H-14,142,H-14,'#E8D5B5',.8);
  for(let i=0;i<3;i++)s+=R(128+i*4.6,H-29,3.6,6,['#C4696A','#6E97B8','#E0B75A'][i],{sw:.3})+R(128+i*4.6,H-21,3.6,6,['#7FA66F','#A987B8','#E08E5E'][i],{sw:.3});
  if(n)s+=E(cx,H-4,70,8,'#FFE3A0',{sw:0,op:.22})+Rn(150,66,98,96,'#FFF1C4',{op:.06});
  return s;
}
// ===== いけぶ えきまえ館（駅に つながる デパート） =====
// ===== えきまえ ビル（駅の となりの ふつうの じむしょの ビル。12×13。オーナーの FB 2026-10-01 で「いけぶ えきまえ館」から かえた） =====
function officeBlock(o={}){
  const n=!!o.night,W=384,H=416,cx=208,wall='#DCD7CC',trim='#B7B0A2';let s=dropShadow(W,H,16);
  s+=roofDeck(4,4,W-8,46,'#C9C6BE')+tank(36,14)+acUnit(118,24)+acUnit(142,24)+acUnit(286,24)+antenna(350,40,24);
  s+=R(6,50,W-12,H-50,wall,{sw:1.3})+sideFace(W-6,50,H-50,10,wall);
  // かべの タイルの め
  {let d='';for(let y=60;y<304;y+=11)d+=`M8,${y} H${W-8}`;s+=Pth(d,'none',{sw:.55,stroke:shade(wall,-.05)});}
  // 6かいぶんの よこながの まど（ひるは ところどころ ブラインド）・まどの したの おび
  for(let f=0;f<6;f++){const y=58+f*42;for(let c=0;c<4;c++){const x=18+c*82;s+=pane(x,y,66,28,n,f*7+c,{tint:'#BCCFD3',litRate:.5});if(!n&&hash(f,c,4)<.4)s+=Rn(x+1,y+1,64,10,'#ECE8DE',{op:.9})+L(x+1,y+11,x+65,y+11,'#C9C5BA',.6);}s+=band(6,y+32,W-56,trim);}
  // たての かんばん（なかの テナント）
  s+=R(W-46,62,28,236,'#55636F',{sw:1,rx:2})+R(W-43,65,22,230,'#5F6E7A',{sw:0});
  for(const [y,rows,c] of [[84,['カ','フ','ェ'],'#F6C76B'],[160,['じ','む','しょ'],'#BFE3EA'],[236,['じゅ','く'],'#F4B1C2']])s+=lines(W-32,y,rows,10,c,1.2);
  s+=L(W-42,138,W-22,138,'#8C9BA6',.8)+L(W-42,214,W-22,214,'#8C9BA6',.8);
  // 1かい: なまえの いた・ガラスの ロビー・あんないばん・うえき
  s+=R(6,322,W-12,10,trim,{sw:1});
  s+=R(124,305,168,19,'#4E5A63',{sw:1,rx:2})+T(cx,319,'えきまえ ビル',{size:12,fill:'#FFFFFF'});
  s+=R(10,336,W-20,H-338,'#5B6670',{sw:1});
  s+=pane(16,342,100,H-348,n,11,{litRate:1})+pane(W-116,342,100,H-348,n,12,{litRate:1});
  s+=autoDoor(cx,H-3,72,56,n,{frame:'#3F4A52',mat:'#9AA3A8'});
  s+=R(126,H-46,24,36,'#EEEAE0',{sw:.9})+L(130,H-38,146,H-38,'#8C9BA6',.8)+L(130,H-32,146,H-32,'#8C9BA6',.8)+L(130,H-26,146,H-26,'#8C9BA6',.8)+L(130,H-20,142,H-20,'#8C9BA6',.8);
  s+=planter(272,H-12,30,n)+planter(30,H-12,30,n);
  if(n)s+=E(cx,H-4,110,10,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== ネリカス電機（10かいだての 家電の お店） =====
function tvSet(x,y,w,h,c,n){return R(x,y,w,h,'#2D3238',{sw:.9,rx:1.5})+Rn(x+2,y+2,w-4,h-5,n?shade(c,.25):c)+Pth(`M${x+2},${y+h-3} q${w*.3},-${h*.4} ${w*.6},-${h*.15} t${w*.4-4},-${h*.2} V${y+h-3}Z`,shade(c,-.25),{sw:0,op:.8})+C(x+w*.75,y+h*.3,h*.13,'#FFF1B8',{sw:0})+R(x+w/2-3,y+h,6,3,'#2D3238',{sw:.5});}
function washer(x,y){return R(x,y,26,32,'#F4F5F2',{sw:.9,rx:2})+R(x+2,y+2,22,5,'#D9DEDD',{sw:.5})+C(x+13,y+19,9,'#BFD8E0',{sw:1})+C(x+13,y+19,5.5,'#E6F3F4',{sw:.6})+C(x+20,y+4.5,1.4,'#8BC48C',{sw:0});}
function electronics(o={}){
  const n=!!o.night,W=576,H=448,cx=304,red='#D8483E',wall='#F5F4EF';let s=dropShadow(W,H,18);
  // 屋上の 大きな 文字の かんばん
  s+=roofDeck(4,8,W-8,36,'#C9CCC7');
  s+=R(120,-30,340,38,'#3C4046',{sw:1.2})+R(124,-26,332,30,n?'#FFF1C9':'#FFFFFF',{sw:.8});
  s+=T(290,-3,'ネリカス電機',{size:25,fill:red,stroke:n?'#FFD27A':'#FFFFFF',sw:2})+Pth('M150,-22 l5,10 l11,1 l-8,7 l3,11 l-11,-6 l-11,6 l3,-11 l-8,-7 l11,-1Z','#F7C948',{sw:.9})+Pth('M430,-22 l5,10 l11,1 l-8,7 l3,11 l-11,-6 l-11,6 l3,-11 l-8,-7 l11,-1Z','#F7C948',{sw:.9});
  for(const x of [140,290,440])s+=L(x,8,x,24,'#3C4046',2);
  // かべと ひだりの あかい たてかんばん
  s+=R(6,44,W-12,H-44,wall,{sw:1.3})+sideFace(W-6,44,H-44,11,wall);
  s+=R(14,52,62,300,red,{sw:1.2})+L(18,56,18,348,shade(red,.35),1);
  for(const [i,ch]of [...'ネリカス電機'].entries())s+=T(45,86+i*38,ch,{size:24,fill:'#FFFFFF'});
  // 10かい: まどの れつと 階の おび（ところどころ 売り場の 名前）
  for(let f=0;f<10;f++){const y=52+f*30;s+=R(84,y,300,26,'#51606B',{sw:.9});for(let x=86;x<380;x+=16.6)s+=pane(x,y+2,14.6,22,n,f*17+x,{sw:0,litRate:.8});
    s+=R(390,y+3,52,20,['#F7C948','#7FB0C9','#E27D6B','#9CCB9A','#B8A2D8'][f%5],{sw:.7,rx:2})+T(416,y+16,(10-f)+'F',{size:9,fill:INK});}
  // 大きな 画面（あたらしい テレビの コマーシャル）
  s+=R(452,56,112,94,'#2D3238',{sw:1.2,rx:3})+Rn(458,62,100,72,n?'#9FD2F2':'#8EC9EE')+Pth('M458,120 q25,-18 50,-6 t50,-8 V134 H458Z','#8ACB7A',{sw:0})+C(534,80,9,'#FFE58A',{sw:0})+T(508,98,'4K テレビ',{size:10,fill:'#FFFFFF',stroke:'#3C77A8',sw:2})+T(508,146,'きれいな えいぞう',{size:6.5,fill:'#FFFFFF'});
  s+=R(452,160,112,188,'#EDEDE8',{sw:1});for(let f=0;f<6;f++)s+=R(458,166+f*30,100,24,'#51606B',{sw:.8})+pane(460,168+f*30,47,20,n,f*3,{sw:0})+pane(509,168+f*30,47,20,n,f*3+1,{sw:0});
  // 横の かんばん（ポイント）
  s+=R(10,356,W-20,30,red,{sw:1.2})+T(250,378,'ネリカス電機  いけぶくろ ほんてん',{size:16,fill:'#FFFFFF'})+R(430,360,132,22,'#F7C948',{sw:.9,rx:11})+T(496,375,'ポイント 10%',{size:11,fill:red});
  // 1かい: ならんだ テレビ・せんたくき・風船・自動ドア
  s+=R(10,388,W-20,H-390,'#4A545C',{sw:1});
  for(const [x,y,w,h,c]of [[20,396,40,26,'#7FB0C9'],[64,396,40,26,'#E27D6B'],[20,424,40,20,'#9CCB9A'],[64,424,40,20,'#F7C948'],[108,400,50,32,'#B8A2D8'],[162,396,40,26,'#8EC9EE'],[162,424,40,20,'#E8A0B4']])s+=tvSet(x,y,w,h,c,n);
  for(const x of [372,402,432])s+=washer(x,H-36);
  s+=R(466,396,100,48,'#F3F1EA',{sw:1})+T(516,414,'きょうの おすすめ',{size:7,fill:red})+R(474,420,40,20,'#FFFFFF',{sw:.7})+C(484,430,5,'#BFD8E0',{sw:.7})+R(520,420,38,20,'#FFFFFF',{sw:.7})+R(526,424,26,6,'#E6E3DA',{sw:.5})+T(539,437,'すいはんき',{size:4.5,fill:INK});
  s+=autoDoor(cx,H-3,84,50,n,{mat:'#D8483E'});
  for(const [x,c]of [[236,'#E25B4F'],[248,'#F7C948'],[362,'#F7C948'],[350,'#E25B4F']])s+=L(x,H-6,x+(x<300?4:-4),H-40,'#8C8578',.7)+E(x+(x<300?4:-4),H-46,6,7.5,c,{sw:.8});
  if(n)s+=E(cx,H-4,150,11,'#FFE3A0',{sw:0,op:.24})+Rn(124,-26,332,30,'#FFE3A0',{op:.15})+Rn(458,62,100,72,'#FFFFFF',{op:.12});
  return s;
}
// ===== Meeときょれじゃ（ゲームセンター） =====
function plush(x,y,kind,r=5){
  if(kind==='wanko')return C(x,y,r,'#FFFFFF',{sw:.7})+E(x-r*.8,y-r*.2,r*.35,r*.6,INK,{sw:0})+E(x+r*.8,y-r*.2,r*.35,r*.6,INK,{sw:0})+C(x-r*.3,y,r*.12,INK,{sw:0})+C(x+r*.3,y,r*.12,INK,{sw:0})+E(x,y+r*.35,r*.2,r*.14,INK,{sw:0});
  if(kind==='gachan')return C(x,y,r,'#F6D35B',{sw:.7})+Pth(`M${x-r*.2},${y+r*.1} l${r*.2},${r*.35} l${r*.2},-${r*.35}Z`,'#F2A33A',{sw:.3})+C(x-r*.35,y-r*.2,r*.12,INK,{sw:0})+C(x+r*.35,y-r*.2,r*.12,INK,{sw:0});
  return C(x,y,r,'#8C9199',{sw:.7})+Pth(`M${x-r*.5},${y-r*.8} l${r*.25},-${r*.45} l${r*.25},${r*.4} M${x},${y-r*.95} l${r*.25},-${r*.45} l${r*.25},${r*.45}`,'#B7BCC4',{sw:.4})+Pth(`M${x-r*.45},${y+r*.3} h${r*.9}`,'none',{sw:.8,stroke:'#FFFFFF'})+C(x-r*.35,y-r*.15,r*.12,INK,{sw:0})+C(x+r*.35,y-r*.15,r*.12,INK,{sw:0});
}
function craneCase(x,y,w,h,c,n,seed){let s=R(x,y,w,h,shade(c,-.1),{sw:.9,rx:2})+R(x+3,y+3,w-6,h*.62,n?'#E9F2F6':'#DDEFF4',{sw:.6})+L(x+w/2,y+3,x+w/2,y+h*.2,INK,.7)+Pth(`M${x+w/2-4},${y+h*.2} l4,4 l4,-4`,'none',{sw:.8,stroke:'#8C8578'});
  const kinds=['wanko','gachan','goji'];for(let i=0;i<3;i++)s+=plush(x+8+i*(w-16)/2,y+h*.56-(i%2)*3,kinds[(i+seed)%3],Math.min(5,w/9));
  return s+R(x+3,y+h*.68,w-6,h*.28,c,{sw:.6})+C(x+w*.3,y+h*.82,2,'#F7C948',{sw:.4})+C(x+w*.7,y+h*.82,2,'#E25B4F',{sw:.4});}
function gacha(x,bottom,c){return R(x,bottom-34,20,34,'#FFFFFF',{sw:.8,rx:2})+R(x+2,bottom-32,16,16,n0(c),{sw:.6,rx:6})+[0,1,2,3].map(i=>C(x+6+(i%2)*8,bottom-28+Math.floor(i/2)*6,2.6,['#E25B4F','#F7C948','#7FB0C9','#9CCB9A'][i],{sw:.3})).join('')+R(x+3,bottom-13,14,8,c,{sw:.5})+C(x+10,bottom-9,2.4,'#FFFFFF',{sw:.4});}
const n0=c=>'#EAF6FA';
function arcade(o={}){
  const n=!!o.night,W=416,H=416,cx=208,wall='#B79CCB';let s=dropShadow(W,H,16);
  s+=roofDeck(4,6,W-8,44,'#C4BCCB');
  // まるい「Mee」の かんばんと ほし
  s+=L(cx,40,cx,20,'#56505E',3)+C(cx,-2,38,'#F7C948',{sw:1.4})+C(cx,-2,31,'#FFE58A',{sw:.9});
  for(let i=0;i<16;i++){const a=i*Math.PI/8;s+=C(cx+Math.cos(a)*34.5,-2+Math.sin(a)*34.5,1.8,n?(i%2?'#FFFFFF':'#FF9FB8'):(i%2?'#FFFFFF':'#F4A7B9'),{sw:.4});}
  s+=T(cx,8,'Mee',{size:27,fill:'#C2447B',stroke:'#FFFFFF',sw:2.5});
  for(const [x,y,r]of [[118,8,14],[298,8,14],[86,26,8],[330,26,8]])s+=Pth(`M${x},${y-r} l${r*.3},${r*.62} l${r*.68},${r*.08} l-${r*.52},${r*.46} l${r*.16},${r*.68} l-${r*.62},-${r*.36} l-${r*.62},${r*.36} l${r*.16},-${r*.68} l-${r*.52},-${r*.46} l${r*.68},-${r*.08}Z`,'#F7C948',{sw:1});
  // かべ（ひしがたの もよう）
  s+=R(6,50,W-12,H-50,wall,{sw:1.3})+sideFace(W-6,50,H-50,10,wall);
  for(let y=58;y<H-120;y+=26)for(let x=14+((y/26)%2)*13;x<W-14;x+=26)s+=Pth(`M${x},${y-6} l6,6 l-6,6 l-6,-6Z`,shade(wall,.18),{sw:0});
  // ネオンの 横かんばん
  s+=R(40,62,336,40,'#3E2D55',{sw:1.3,rx:8})+R(46,68,324,28,'none',{sw:1.6,stroke:n?'#FF9FD0':'#E88BB8',rx:6});
  s+=T(cx,90,'ときょれじゃ',{size:22,fill:n?'#FFE0F0':'#FFD9EC',stroke:'#C2447B',sw:2})+T(96,88,'GAME',{size:8,fill:'#8FE3F0'})+T(322,88,'PRIZE',{size:8,fill:'#8FE3F0'});
  // うえの 2かい: まどの むこうに クレーンゲーム
  for(let f=0;f<2;f++){const y=114+f*96;s+=R(16,y,W-32,86,'#4A3D5C',{sw:1.1});for(let i=0;i<5;i++){const x=24+i*76;s+=craneCase(x,y+6,62,76,['#E88BB8','#7FC3D9','#F7C948','#9CCB9A','#B8A2D8'][(i+f)%5],n,i+f);}
    if(!n)s+=Pth(`M${40+f*120},${y+86} L${90+f*120},${y} h24 L${64+f*120},${y+86}Z`,'#FFFFFF',{sw:0,op:.16});}
  // 1かい: でんきゅうの ふちの 入口・ガチャ・100コイン
  s+=R(6,310,W-12,8,'#3E2D55',{sw:1});
  s+=R(118,322,180,H-324,'#3E2D55',{sw:1.2,rx:4})+bulbs(124,328,168,H-340,n,10.5);
  s+=autoDoor(cx,H-3,82,50,n,{frame:'#2C2140',mat:'#E88BB8'});
  s+=R(14,322,98,H-324,'#EDE5F2',{sw:1});for(let i=0;i<4;i++)s+=gacha(20+i*23,H-6,['#E88BB8','#7FC3D9','#F7C948','#9CCB9A'][i]);
  s+=R(20,326,86,18,'#C2447B',{sw:.8,rx:3})+T(63,339,'ガチャ ガチャ',{size:9,fill:'#FFFFFF'});
  s+=R(304,322,104,H-324,'#EDE5F2',{sw:1})+craneCase(318,344,52,66,'#7FC3D9',n,2)+R(376,334,26,54,'#FFFFFF',{sw:.8,rx:3})+T(389,352,'1かい',{size:7,fill:'#C2447B'})+T(389,366,'100',{size:10,fill:'#C2447B'})+T(389,378,'コイン',{size:6.5,fill:'#C2447B'});
  if(n)s+=C(cx,-2,52,'#FFE58A',{sw:0,op:.2})+Rn(40,62,336,40,'#FF9FD0',{op:.12})+E(cx,H-4,100,10,'#FFD0E8',{sw:0,op:.25});
  return s;
}
// ===== サンシャインいけぶ（モールと 60かいの タワー） =====
function mall(o={}){
  const n=!!o.night,W=480,H=416,wall='#EBDDC7',terra='#C99873';let s=dropShadow(W,H,18);
  // うしろの タワー（60かい）: ほそい たての ひれ・てっぺんの 赤い ランプ
  const tx=250,tw=176,ty=-118;s+=R(tx,ty,tw,340,'#6F8797',{sw:1.3})+Pth(`M${tx+tw},${ty} l12,-8 V${190-8} l-12,8Z`,'#566C7B',{sw:1});
  for(let y=ty+20;y<188;y+=9){s+=Rn(tx+6,y,tw-12,5,n?(hash(y,1,5)<.6?'#F2D08E':'#50627A'):'#A9C3D1');}
  for(let x=tx+10;x<tx+tw-4;x+=12)s+=Rn(x,ty+16,2.4,172,shade('#6F8797',.25));
  s+=R(tx-4,ty-6,tw+8,22,'#56697A',{sw:1.2})+T(tx+tw/2,ty+10,'IKEBU 60',{size:12,fill:'#EAF2F4',ls:2})+L(tx+tw/2,ty-6,tx+tw/2,ty-26,INK,1.2)+C(tx+tw/2,ty-27,2.6,'#E25B4F',{sw:.6});
  if(!n)s+=Pth(`M${tx+20},188 L${tx+80},${ty+20} h26 L${tx+46},188Z`,'#FFFFFF',{sw:0,op:.16});
  // ひだりの 棟（3かい）
  s+=R(6,120,250,80,wall,{sw:1.2})+band(6,120,250,terra);for(let x=16;x<246;x+=26)s+=pane(x,132,20,54,n,x,{tint:'#B8CCCF'});
  // モールの 本体（3かいの ポディウム）
  s+=R(6,196,W-12,H-196,wall,{sw:1.3})+sideFace(W-6,196,H-196,11,wall)+R(6,196,W-12,10,terra,{sw:1});
  for(const y of [214,262])for(let x=16;x<W-18;x+=30)if(x<96||x>262)s+=pane(x,y,24,38,n,x+y,{tint:'#B8CCCF'});
  for(const y of [256,304])s+=band(6,y,W-12,'#DCC9AE');
  // おおきな アーチの ガラスの 入口（まんなか 左）
  const ax=176;s+=Pth(`M${ax-80},${H} V300 A80,80 0 0 1 ${ax+80},300 V${H}Z`,'#8E7A63',{sw:1.3});
  s+=Pth(`M${ax-72},${H} V300 A72,72 0 0 1 ${ax+72},300 V${H}Z`,n?'#F2D08E':'#AFCFD6',{sw:1});
  for(let i=1;i<6;i++){const x=ax-72+i*24;const top=300-Math.sqrt(Math.max(0,72*72-(x-ax)**2));s+=L(x,top,x,H,'#6F8794',1);}
  for(const y of [300,340])s+=L(ax-72,y,ax+72,y,'#6F8794',1);s+=Pth(`M${ax-72},300 A72,72 0 0 1 ${ax+72},300`,'none',{sw:1.6,stroke:'#6F8794'});
  if(!n)s+=Pth(`M${ax-50},${H-4} L${ax-10},250 h18 L${ax-30},${H-4}Z`,'#FFFFFF',{sw:0,op:.3});
  s+=autoDoor(ax,H-3,64,44,n,{frame:'#5A4636',mat:terra});
  // 館の 名前と マーク（アーチの うえ）・たれまく
  s+=R(92,206,172,40,terra,{sw:1.2,rx:3})+sunMark(114,226,12)+T(188,229,'サンシャインいけぶ',{size:15,fill:'#FFF7E4'})+T(188,240,'SUNSHINE IKEBU',{size:6,fill:'#F7E6C8',ls:1.4});
  for(const [x,c,rows]of [[284,'#6FA3BF',['12かい','すいぞく','かん']],[328,'#8FB86B',['3かい','マルシェ']],[372,'#E27D6B',['1かい','ファッ','ション']]]){s+=R(x,210,36,84,c,{sw:1})+Pth(`M${x},294 l18,9 l18,-9`,c,{sw:1})+L(x+3,214,x+33,214,shade(c,.45),.8)+lines(x+18,229,rows,7);
    if(x===284)s+=Pth(`M${x+9},280 q8,-7 16,0 q-8,7 -16,0Z M${x+25},280 l5,-4 v8Z`,'#FFFFFF',{sw:.5});}
  // みぎの 入口（ちいさい）
  s+=R(318,320,100,H-322,'#8E7A63',{sw:1})+autoDoor(368,H-3,56,40,n,{frame:'#5A4636',mat:terra})+awning(322,318,92,'#B5652B');
  s+=planter(16,H-12,60,n)+planter(262,H-12,40,n)+planter(424,H-12,44,n);
  if(n)s+=E(ax,H-4,120,11,'#FFE3A0',{sw:0,op:.24})+C(tx+tw/2,ty-27,8,'#FF8A7A',{sw:0,op:.35});
  return s;
}
// ===== ほそい ふつうの ビル（5×13。れんが ビル・あおぞら ビル。オーナーの FB 2026-10-01 で「マルシェ館」「インテリア館」から かえた） =====
function slimBuilding(kind,o={}){
  const n=!!o.night,W=160,H=416,cx=80,brick=kind==='brick',wall=brick?'#B9705A':'#DDE5E8',trim=brick?'#8E5444':'#AFC0C7';let s=dropShadow(W,H,12);
  s+=roofDeck(4,6,W-8,40,'#C9C6BE')+(brick?acUnit(18,18)+tank(100,14):acUnit(16,18)+acUnit(40,18)+antenna(132,30,24));
  s+=R(6,46,W-12,H-46,wall,{sw:1.3})+sideFace(W-6,46,H-46,9,wall);
  if(brick){
    // れんがの め・まどと ベランダの てすり
    let d='';for(let y=54,r=0;y<318;y+=8,r++){d+=`M8,${y} H${W-8}`;for(let x=8+(r%2)*10;x<W-8;x+=20)d+=` M${x},${y} v8`;}s+=Pth(d,'none',{sw:.5,stroke:shade(wall,.16)});
    for(let f=0;f<6;f++){const y=58+f*44;
      for(const x0 of [18,86]){s+=R(x0-2,y-2,60,34,'#E9E2D4',{sw:.8})+pane(x0+2,y+2,52,26,n,f*5+x0,{tint:'#B8CCCF'});for(let k=0;k<6;k++)s+=L(x0+3+k*10,y+30,x0+3+k*10,y+38,'#5E5A54',.9);s+=L(x0-2,y+30,x0+58,y+30,'#5E5A54',1.1)+L(x0-2,y+38,x0+58,y+38,'#5E5A54',1.1);}}
  }else{
    // そらが うつる ガラスと しろい たての ひれ
    s+=curtain(16,54,W-32,262,3,6,n,7,{tint:'#9EC3D6',hi:'#E8F4F8',frame:'#5D7380'});
    for(const x of [16,58,102,144])s+=R(x-3,52,6,266,'#F1F4F2',{sw:.8});
  }
  // なまえの いた・1かいの ガラスと ドア
  s+=R(16,324,128,22,brick?'#5A3A31':'#3E5966',{sw:1.1,rx:2})+T(cx,339,brick?'れんが ビル':'あおぞら ビル',{size:11,fill:'#FFFFFF'});
  s+=R(8,350,W-16,H-352,brick?'#6E4B3E':'#56636C',{sw:1});
  s+=pane(14,356,30,H-362,n,9,{litRate:1})+pane(W-44,356,30,H-362,n,10,{litRate:1});
  s+=autoDoor(cx,H-3,46,40,n,{frame:brick?'#4A3329':'#3C4E55',mat:trim});
  if(n)s+=E(cx,H-4,50,8,'#FFE3A0',{sw:0,op:.22});
  return s;
}

// まとの マーク（白と あかの わ）
const target=(x,y,r)=>C(x,y,r,'#FFFFFF',{sw:1})+C(x,y,r*.72,'#E25B4F',{sw:.6})+C(x,y,r*.46,'#FFFFFF',{sw:.5})+C(x,y,r*.2,'#E25B4F',{sw:.4});
// ===== シューティング レンジ（競技の 射撃場） =====
function range(o={}){
  const n=!!o.night,W=320,H=224,cx=176,char='#3E434B',orange='#F08A3C';let s=dropShadow(W,H,14);
  s+=roofDeck(4,4,W-8,34,'#BFC3C4')+acUnit(20,12)+acUnit(44,12);
  s+=L(250,20,250,-6,char,2.2)+L(282,20,282,-6,char,2.2)+target(266,-14,22);
  s+=R(6,38,W-12,H-38,'#E6E4DE',{sw:1.3})+sideFace(W-6,38,H-38,9,'#E6E4DE');
  s+=R(6,38,W-12,40,char,{sw:1.2})+Rn(6,74,W-12,4,orange)+target(34,58,14);
  s+=T(170,60,'シューティング レンジ',{size:16,fill:'#FFFFFF'})+T(170,71,'SHOOTING RANGE ・ SPORTS',{size:6,fill:'#F9C08E',ls:1.3});
  // レーンの 見える まど（まとの スタンドと あかり）
  s+=R(16,88,288,54,'#2E3339',{sw:1.1});
  for(let i=0;i<6;i++){const x=20+i*47;s+=Rn(x,92,43,46,n?'#F5E3B8':'#DCE6E6')+Rn(x,122,43,16,n?'#D9C08B':'#B7C2C0')+L(x+43,92,x+43,138,char,1.2)+R(x+16,100,12,16,'#FFFFFF',{sw:.6})+C(x+22,108,4.6,'none',{sw:.8,stroke:INK})+C(x+22,108,1.8,'#E25B4F',{sw:0})+L(x+22,116,x+22,122,INK,.8)+T(x+8,134,String(i+1),{size:7,fill:orange});}
  if(!n)s+=Pth('M40,142 L84,88 h22 L62,142Z','#FFFFFF',{sw:0,op:.22});
  s+=band(6,146,W-12,'#D2D0C8');
  // 1かい: オレンジの わくの 入口・あんぜん だいいち・トロフィー
  s+=R(10,154,W-20,H-156,'#CFCFC8',{sw:1});
  s+=R(cx-44,160,88,H-162,orange,{sw:1.1})+autoDoor(cx,H-3,64,52,n,{frame:char,mat:orange});
  s+=R(18,162,100,H-168,'#FFFFFF',{sw:1})+R(24,168,88,16,'#2F7D5B',{sw:.8,rx:2})+T(68,180,'あんぜん だいいち',{size:8.5,fill:'#FFFFFF'});
  s+=E(46,200,12,6,'#7FC3D9',{sw:.9})+E(70,200,12,6,'#7FC3D9',{sw:.9})+L(58,199,58,201,INK,1.4)+T(92,203,'ゴーグル',{size:6,fill:INK})+T(68,H-10,'かかりの ひとと いっしょに',{size:5.2,fill:'#56636C'});
  s+=R(226,162,86,H-168,n?'#F7E3B5':'#F4F1EA',{sw:1})+R(232,H-22,74,5,'#B98E6B',{sw:.6});
  for(const [x,hh,c]of [[244,26,'#F2C14E'],[266,34,'#E8D48A'],[288,22,'#D8A15A']])s+=Pth(`M${x-7},${H-22-hh} h14 q0,10 -7,12 q-7,-2 -7,-12Z`,c,{sw:.8})+R(x-2,H-22-hh+12,4,hh-16,c,{sw:.6})+R(x-6,H-26,12,4,shade(c,-.2),{sw:.5});
  s+=T(266,172,'トロフィー',{size:6.5,fill:char});
  if(n)s+=E(cx,H-4,70,8,'#FFE3A0',{sw:0,op:.22})+Rn(16,88,288,54,'#FFF1C4',{op:.1});
  return s;
}
// ===== ままの オフィス（ガラスの タワー） =====
function officeTower(o={}){
  const n=!!o.night,W=480,H=544,cx=240,frame='#4E6F78';let s=dropShadow(W,H,18);
  // 屋上: ななめの クラウンと アンテナ
  s+=Pth(`M20,40 L60,-2 H420 L460,40Z`,'#5F8791',{sw:1.3})+Pth(`M60,-2 H420 L412,8 H68Z`,'#8FB5BC',{sw:.8})+antenna(120,-2,26)+antenna(360,-2,20);
  for(let x=80;x<410;x+=22)s+=L(x,6,x-(x-240)*.12,38,'#86ABB2',1);
  // カーテンウォール（12かい）と たての しろい ひれ
  s+=R(10,40,W-20,H-150,'#E9EEEC',{sw:1.3})+sideFace(W-10,40,H-150,12,'#E9EEEC');
  s+=curtain(24,54,W-48,H-176,14,12,n,21,{tint:'#9EC9C9',hi:'#E8F6F2',frame});
  for(let x=24;x<=W-24;x+=(W-48)/7)s+=Rn(x-2,50,4,H-168,'#F4F7F5');
  // 会社の マーク（はっぱと ハート）
  s+=R(150,60,180,34,'#F8FBF8',{sw:1.1,rx:17})+Pth('M176,77 q-9,-9 0,-14 q9,5 0,14Z','#6FAE7E',{sw:.8})+Pth('M176,77 q9,-9 0,-14','none',{sw:.6,stroke:'#3E7A52'})+T(250,82,'ぽかぽか しょうじ',{size:12,fill:'#3E6B5A'});
  // 1かい: 2かいぶんの ロビー・ひさし・受付と エレベーター
  s+=R(10,H-110,W-20,108,'#D9E1DE',{sw:1.2});
  s+=R(40,H-104,W-80,100,'#46545D',{sw:1.1})+curtain(44,H-100,W-88,58,10,2,n,55,{tint:'#B7D7D3',litRate:1});
  s+=R(84,H-38,70,24,'#C8B08A',{sw:.9})+L(84,H-30,154,H-30,'#E8D5B5',.8)+C(118,H-44,6,'#F1E3CF',{sw:.7})+T(119,H-18,'うけつけ',{size:6,fill:INK});
  s+=R(336,H-40,40,34,'#B9C2C4',{sw:.9})+L(356,H-40,356,H-6,INK,1)+T(356,H-44,'▲▼',{size:6,fill:'#E25B4F'})+R(380,H-40,40,34,'#B9C2C4',{sw:.9})+L(400,H-40,400,H-6,INK,1);
  s+=Pth(`M150,${H-112} H330 L344,${H-96} H136Z`,'#E8EEEC',{sw:1.1})+R(134,H-96,212,6,frame,{sw:.9})+T(240,H-100.5,'ままの オフィス',{size:10,fill:'#3E6B5A'});
  s+=autoDoor(cx,H-3,80,46,n,{frame:'#3C4E55',mat:'#8FB5BC'});
  for(const x of [30,450]){s+=R(x-14,H-18,28,16,'#B8B2A6',{sw:.8})+E(x,H-26,13,11,'#6FAE7E',{sw:.9})+E(x-4,H-30,6,5,'#94C48C',{sw:0})+L(x,H-18,x,H-24,'#7A5A40',2);}
  if(n)s+=E(cx,H-4,140,12,'#FFE3A0',{sw:0,op:.22})+Rn(150,60,180,34,'#FFFFFF',{op:.1});
  return s;
}
// ===== オフィス うけつけ（タワーの となりの ロビー館） =====
function officeLobby(o={}){
  const n=!!o.night,W=288,H=384,cx=144,frame='#4E6F78';let s=dropShadow(W,H,14);
  s+=roofDeck(4,4,W-8,50,'#C6CEC8');
  for(const [x,r]of [[36,12],[64,9],[220,13],[250,9]])s+=E(x,34,r,r*.8,'#7FA563',{sw:.9})+E(x-r*.3,30,r*.45,r*.35,'#A3C27E',{sw:0});
  s+=R(110,18,70,22,'#8FB5BC',{sw:.9})+L(110,28,180,28,'#DCEBEA',1);
  s+=R(8,54,W-16,H-54,'#E9EEEC',{sw:1.3})+sideFace(W-8,54,H-54,10,'#E9EEEC');
  for(let f=0;f<5;f++){const y=66+f*48;s+=curtain(18,y,W-36,36,8,1,n,f*9+3,{tint:'#9EC9C9',hi:'#E8F6F2',frame})+band(8,y+40,W-16,'#D5DEDB');}
  s+=R(30,302,W-60,22,'#3E6B5A',{sw:1,rx:3})+T(cx,318,'オフィス うけつけ',{size:12,fill:'#FFFFFF'});
  s+=R(14,328,W-28,H-330,'#46545D',{sw:1})+pane(20,334,70,H-340,n,3,{litRate:1})+pane(198,334,70,H-340,n,4,{litRate:1});
  s+=autoDoor(cx,H-3,70,44,n,{frame:'#3C4E55',mat:'#8FB5BC'});
  if(n)s+=E(cx,H-4,80,9,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== きょうりゅう はくぶつかん（17×7。オーナーの FB 2026-10-01「屋上庭園は削除し、恐竜博物館を大きくしなさい」で 8 → 17マスに） =====
// まんなかの 石の 三角やねと はしら・りょうがわの てんじしつ（大きな まどに ほねの もけい）・うしろから のぞく 2とうの きょうりゅう
function museum(o={}){
  const n=!!o.night,W=544,H=224,cx=272,stoneC='#E6DCC8',pale='#F3ECDD',mid='#E1D5BE',green='#8BBF76',orange='#E59A5C';let s=dropShadow(W,H,14);
  // うしろの きょうりゅう: くびの ながい ブラキオサウルス（ひだりの てんじしつの うしろ）と ティラノサウルスの あたま（みぎ）
  s+=Pth('M96,74 C104,18 114,-50 142,-72 C156,-82 176,-72 168,-60 C162,-52 150,-54 144,-44 C130,-14 124,34 122,76Z',green,{sw:1.4})+C(159,-67,1.9,INK,{sw:0})+Pth('M163,-58 q5,1 7,-2','none',{sw:1,stroke:INK});
  for(const [x,y]of [[134,-34],[128,-8],[124,18],[122,44]])s+=E(x,y,3.6,2.4,'#A9D494',{sw:0});
  s+=Pth('M410,76 C406,52 412,30 430,20 C448,10 482,10 500,24 C510,32 508,44 496,46 L468,48 C462,56 466,66 470,76Z',orange,{sw:1.4})+C(474,28,2.1,INK,{sw:0})+Pth('M476,46 l4,5 l4,-5 l4,5 l4,-5 l4,5','none',{sw:.9,stroke:INK})+E(458,26,3.4,2.2,'#F2BC8C',{sw:0})+Pth('M492,32 q4,-3 7,0','none',{sw:.8,stroke:INK});
  // りょうがわの てんじしつ（ひくい やね）
  s+=R(8,78,W-16,H-78,stoneC,{sw:1.3})+sideFace(W-8,78,H-78,9,stoneC);
  s+=R(4,72,W-8,10,'#D3C6AE',{sw:1})+L(8,75,W-8,75,'#EDE3CF',.9);
  for(const [x0,kind] of [[22,'brachio'],[388,'trike']]){
    s+=R(x0,96,134,82,'#46545D',{sw:1.1,rx:2})+pane(x0+4,100,126,74,n,x0,{litRate:1,tint:'#C9DCE0'});
    // まどの なかの ほねの もけい（しろい せん）
    const bone='#FBF6EA';
    if(kind==='brachio')s+=Pth(`M${x0+18},166 q12,-22 40,-24 q20,-2 32,-26 q8,-18 18,-30 q6,-6 10,0`,'none',{sw:3,stroke:bone})+[0,1,2,3,4].map(i=>L(x0+34+i*10,152-i*3,x0+34+i*10,170,bone,2)).join('')+C(x0+119,110,4,bone,{sw:0});
    else s+=Pth(`M${x0+24},150 q20,-14 52,-10 q14,2 22,-6`,'none',{sw:3,stroke:bone})+Pth(`M${x0+98},134 l14,-14 M${x0+102},140 l16,-8 M${x0+96},128 q10,-14 22,-12`,'none',{sw:2.4,stroke:bone})+[0,1,2,3].map(i=>L(x0+40+i*12,148,x0+40+i*12,170,bone,2)).join('')+C(x0+104,138,4,bone,{sw:0});
    s+=R(x0-4,178,142,6,mid,{sw:.8});
  }
  // まんなかの 石の やかた（たかい やね・三角の ペディメント・あしあとの マーク）
  s+=R(170,46,204,H-46,stoneC,{sw:1.3});
  s+=Pth(`M162,50 L${cx},-8 L382,50Z`,'#EFE7D6',{sw:1.3})+Pth(`M186,46 L${cx},6 L358,46Z`,mid,{sw:.8});
  s+=Pth(`M${cx-12},36 q-4,-8 2,-12 q3,4 -2,12 M${cx},36 q0,-10 6,-12 q1,6 -6,12 M${cx+10},38 q4,-8 10,-8 q-2,6 -10,8`,'#8B7355',{sw:.6})+E(cx+2,42,9,5,'#8B7355',{sw:.6});
  s+=R(166,48,212,8,'#D3C6AE',{sw:1});
  s+=R(186,60,172,24,'#6E5A3E',{sw:1,rx:2})+T(cx,77,'きょうりゅう はくぶつかん',{size:13,fill:'#F6E7C1'});
  for(const x of [184,220,308,344]){s+=R(x,90,16,H-114,pale,{sw:1})+R(x-4,90,24,6,mid,{sw:.8})+R(x-4,H-30,24,6,mid,{sw:.8});for(let k=1;k<4;k++)s+=L(x+k*4,98,x+k*4,H-32,'#DDD2BE',.7);}
  // ガラスの 入口と ほねの かざり
  s+=R(240,92,64,H-114,'#46545D',{sw:1})+pane(244,96,56,38,n,5,{litRate:1});
  s+=Pth(`M${cx-18},124 q18,-16 36,0`,'none',{sw:2,stroke:pale})+L(cx-12,118,cx-12,130,pale,1.6)+L(cx,114,cx,130,pale,1.6)+L(cx+12,118,cx+12,130,pale,1.6);
  s+=autoDoor(cx,H-26,46,50,n,{frame:'#5A4636',mat:'#C9A46A'});
  // たれまく（ほねの てんじ・かせき ほり たいけん）
  for(const [x,c,rows]of [[166,green,['ほね','の','てんじ']],[378,orange,['かせき','ほり','たいけん']]])s+=R(x-12,96,24,58,c,{sw:.9})+Pth(`M${x-12},154 l12,6 l12,-6`,c,{sw:.9})+lines(x,110,rows,6,'#FFFFFF',1.45);
  // まえの かいだん
  s+=R(8,H-26,W-16,10,'#D8CDB8',{sw:.9})+R(2,H-16,W-4,14,'#CBBFA8',{sw:.9})+L(180,H-16,364,H-16,'#E6DCCA',1);
  if(n)s+=E(cx,H-4,120,9,'#FFE3A0',{sw:0,op:.22})+Rn(22,96,134,82,'#FFF1C4',{op:.12})+Rn(388,96,134,82,'#FFF1C4',{op:.12});
  return s;
}
// ===== なかよし パズル（ちいさな パズルの お店） =====
function puzzleShop(o={}){
  const n=!!o.night,W=224,H=128,cx=112;let s=dropShadow(W,H,11);
  const cols=['#E88BB8','#7FC3D9','#F7C948','#9CCB9A','#B8A2D8','#F0A36B'];
  s+=R(6,14,W-12,H-14,'#F7F1E6',{sw:1.2})+sideFace(W-6,14,H-14,8,'#F7F1E6');
  for(let i=0;i<14;i++){const x=6+i*15.2;s+=R(x,4+(i%3)*3,15.2,14-(i%3)*3,cols[i%6],{sw:.8});}
  s+=Pth('M64,20 h38 q-2,-9 8,-9 q10,0 8,9 h38 v24 H64Z','#E88BB8',{sw:1.1})+Pth('M156,26 q9,-2 9,6 q0,8 -9,6','#E88BB8',{sw:1.1})+T(110,38,'なかよし パズル',{size:11,fill:'#FFFFFF',stroke:'#B24C7C',sw:1.8});
  s+=R(14,56,62,H-62,'#46545D',{sw:1})+Rn(18,60,54,H-70,n?'#F6DFA6':'#EAF1F2');
  for(let r=0;r<4;r++)for(let c=0;c<5;c++)s+=C(25+c*10,68+r*10,3.6,cols[(r*2+c)%6],{sw:.5});
  s+=R(148,56,62,H-62,'#46545D',{sw:1})+Rn(152,60,54,H-70,n?'#F6DFA6':'#EAF1F2')+R(160,68,38,26,'#FFFFFF',{sw:.7})+T(179,78,'きょうの',{size:5,fill:INK})+T(179,88,'もんだい',{size:5,fill:'#B24C7C'});
  s+=awning(80,52,64,'#7FC3D9')+autoDoor(cx,H-3,40,48,n,{mat:'#E88BB8'});
  if(n)s+=E(cx,H-4,50,7,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== ひがしぐち ホテル =====
function hotel(o={}){
  const n=!!o.night,W=224,H=320,cx=112,wall='#EBDCC4',terra='#B7765A';let s=dropShadow(W,H,12);
  s+=roofDeck(4,4,W-8,30,'#CDC4B4')+tank(150,6);
  s+=R(8,34,W-16,H-34,wall,{sw:1.3})+sideFace(W-8,34,H-34,9,wall)+R(8,34,W-16,22,terra,{sw:1.1})+T(cx,50,'ひがしぐち ホテル',{size:11,fill:'#FFF3DC'});
  for(let f=0;f<6;f++){const y=64+f*34;for(let c=0;c<4;c++){const x=22+c*42;s+=pane(x,y,26,24,n,f*4+c,{tint:'#B9CCD0'})+R(x-3,y+24,32,4,'#F6EEE0',{sw:.6});if((f+c)%3===0)s+=Rn(x,y+20,26,4,'#A7C98E')+C(x+6,y+19,1.4,'#E8A0B4',{sw:0})+C(x+18,y+19,1.4,'#F2D16B',{sw:0});}}
  s+=R(186,70,22,120,'#3E6B5A',{sw:1,rx:2});for(const [i,ch]of [...'HOTEL'].entries())s+=T(197,90+i*22,ch,{size:13,fill:'#F4D98C'});
  s+=R(10,268,W-20,H-270,'#8C6A52',{sw:1})+Pth(`M50,266 H174 L184,280 H40Z`,'#3E6B5A',{sw:1})+R(40,280,144,4,'#2E5146',{sw:.7});
  s+=autoDoor(cx,H-3,58,34,n,{frame:'#5A4636',mat:'#B7765A'});
  for(const x of [26,198]){s+=R(x-9,H-14,18,12,'#B98E6B',{sw:.8})+Pth(`M${x},${H-40} L${x+9},${H-14} H${x-9}Z`,'#5E8B5A',{sw:.9})+Pth(`M${x},${H-40} L${x+5},${H-24} H${x-5}Z`,'#86B27A',{sw:0});}
  if(n)s+=E(cx,H-4,60,8,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== いけぶ カフェテラス =====
function cafe(o={}){
  const n=!!o.night,W=192,H=320,cx=112,brick='#C68C6E';let s=dropShadow(W,H,12);
  s+=roofDeck(4,4,W-8,30,'#CDC4B4')+acUnit(16,10);
  s+=R(8,34,W-16,H-34,brick,{sw:1.3})+sideFace(W-8,34,H-34,9,brick);
  for(let y=38;y<H-90;y+=8)s+=L(10,y,W-10,y,shade(brick,.16),.5);
  for(let f=0;f<4;f++){const y=46+f*42;for(const x of [22,80,138])s+=Pth(`M${x},${y+30} V${y+10} A16,10 0 0 1 ${x+32},${y+10} V${y+30}Z`,n&&hash(x,y,4)<.6?night:'#B7CCD0',{sw:.9})+R(x-2,y+30,36,4,'#EFE2CC',{sw:.6});}
  s+=R(18,222,W-36,22,'#4F8A5B',{sw:1,rx:3})+C(36,233,8.5,'#FFFFFF',{sw:.9})+Pth('M31,230 h9 v4 q0,4.5 -4.5,4.5 q-4.5,0 -4.5,-4.5Z','#8C6A52',{sw:.7})+Pth('M40,231 q3,0 2.4,2.4 q-.6,1.6 -2.4,.8','none',{sw:.7,stroke:INK})+T(108,238,'カフェテラス',{size:11.5,fill:'#FFFFFF'});
  s+=R(8,248,W-16,H-250,'#5C4A3C',{sw:1})+awning(10,248,172,'#4F8A5B');
  s+=pane(16,270,62,H-276,n,2,{litRate:1})+R(18,H-24,24,18,'#F3ECDD',{sw:.6})+C(30,H-30,5,'#F3ECDD',{sw:.6});
  s+=R(150,H-38,30,34,'#3E4A45',{sw:.9})+T(165,H-26,'きょうの',{size:4.6,fill:'#FFFFFF'})+T(165,H-17,'ケーキ',{size:4.6,fill:'#F2D16B'});
  s+=autoDoor(cx,H-3,44,40,n,{frame:'#4A3A2E',mat:'#4F8A5B'});
  if(n)s+=E(cx,H-4,56,8,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== シネマ いけぶくろ =====
function poster(x,y,w,h,kind){
  let s=R(x,y,w,h,'#FFF8E8',{sw:1})+Rn(x+3,y+3,w-6,h-18,kind==='dino'?'#BFE0A8':kind==='space'?'#2E3F6E':'#F8D6DF');
  if(kind==='dino')s+=Pth(`M${x+8},${y+h-20} q4,-22 18,-20 q8,-10 14,-4 q-2,8 -10,6 q4,10 -4,18Z`,'#6FAE5E',{sw:.8})+C(x+w-12,y+12,5,'#FFE58A',{sw:0});
  if(kind==='space'){for(let i=0;i<8;i++)s+=C(x+6+hash(i,x,1)*(w-12),y+6+hash(i,y,2)*(h-28),.9,'#FFFFFF',{sw:0});s+=Pth(`M${x+w/2},${y+10} q7,8 5,22 h-10 q-2,-14 5,-22Z`,'#F4F1EA',{sw:.8})+C(x+w/2,y+22,2.6,'#7FC3D9',{sw:.5})+Pth(`M${x+w/2-5},${y+32} l5,8 l5,-8Z`,'#F2A33A',{sw:.6});}
  if(kind==='love')s+=Pth(`M${x+w/2},${y+h-26} q-14,-10 -8,-18 q5,-5 8,1 q3,-6 8,-1 q6,8 -8,18Z`,'#E8738E',{sw:.8})+E(x+10,y+h-26,4,8,'#FFFFFF',{sw:.6})+E(x+w-10,y+h-26,4,8,'#FFFFFF',{sw:.6});
  return s+T(x+w/2,y+h-7,kind==='dino'?'きょうりゅう':kind==='space'?'うちゅうの たび':'うさぎの こい',{size:5.2,fill:INK});
}
function cinema(o={}){
  const n=!!o.night,W=224,H=320,cx=112,navy='#34405E';let s=dropShadow(W,H,12);
  s+=roofDeck(4,4,W-8,26,'#C3C0C8');
  s+=R(8,30,W-16,H-30,navy,{sw:1.3})+sideFace(W-8,30,H-30,9,navy);
  s+=R(20,38,W-40,34,'#23293C',{sw:1.1,rx:4})+bulbs(26,43,W-52,24,n,8)+T(cx,62,'CINEMA',{size:17,fill:n?'#FFE7A0':'#F4D98C',ls:3});
  s+=poster(20,84,56,82,'dino')+poster(84,84,56,82,'space')+poster(148,84,56,82,'love');
  s+=R(20,176,W-40,28,'#E25B4F',{sw:1,rx:3})+T(cx,195,'シネマ いけぶくろ',{size:12.5,fill:'#FFFFFF'});
  for(let i=0;i<3;i++)s+=C(40+i*72,222,9,'none',{sw:1.2,stroke:'#8C94AE'})+C(40+i*72,222,2.4,'#8C94AE',{sw:0});
  s+=R(10,240,W-20,H-242,'#23293C',{sw:1});
  s+=R(16,248,52,H-254,'#F4E7C8',{sw:.9})+T(42,262,'きっぷ',{size:7,fill:navy})+Pth(`M28,${H-10} l3,-22 h22 l3,22Z`,'#E25B4F',{sw:.8})+L(34,H-32,36,H-10,'#FFFFFF',2)+L(46,H-32,44,H-10,'#FFFFFF',2);
  for(let i=0;i<6;i++)s+=C(32+hash(i,2,3)*20,H-34-hash(i,4,5)*6,2.6,'#FFF3C8',{sw:.4});
  s+=R(158,248,50,H-254,n?'#F7E3B5':'#E8E6EE',{sw:.9})+T(183,264,'つぎの',{size:6,fill:navy})+T(183,276,'じょうえい',{size:6,fill:navy})+T(183,292,'10:30',{size:9,fill:'#E25B4F'});
  s+=autoDoor(cx,H-3,52,48,n,{frame:'#1A1F2E',mat:'#E25B4F'});
  if(n)s+=E(cx,H-4,60,8,'#FFD6A0',{sw:0,op:.25})+Rn(20,38,W-40,34,'#FFE7A0',{op:.12});
  return s;
}
// ===== いけぶ フードホール =====
function foodHall(o={}){
  const n=!!o.night,W=224,H=224,cx=112,wood='#A97850';let s=dropShadow(W,H,12);
  s+=roofDeck(4,4,W-8,28,'#CDC4B4')+acUnit(20,10)+acUnit(180,10);
  s+=R(8,32,W-16,H-32,'#EFE2CC',{sw:1.3})+sideFace(W-8,32,H-32,9,'#EFE2CC');
  s+=R(8,32,W-16,30,wood,{sw:1.1});for(let x=12;x<W-10;x+=8)s+=L(x,34,x,60,shade(wood,-.15),.6);
  s+=R(52,38,120,20,'#FFF6E3',{sw:.9,rx:10})+T(112,52,'フードホール',{size:10.5,fill:'#8C4A2F'});
  s+=Pth('M24,40 v14 M20,40 v5 q0,3 4,3 q4,0 4,-3 v-5 M24,48 v8','none',{sw:1.3,stroke:'#FFF6E3'})+Pth('M196,40 q6,0 6,8 q0,5 -6,5 Z M196,40 v18','#FFF6E3',{sw:1});
  s+=R(14,70,W-28,86,'#46545D',{sw:1})+Rn(18,74,W-36,78,n?'#F6DFA6':'#E9F0EE');
  for(const x of [30,86,142])s+=R(x,128,44,6,'#B98E6B',{sw:.6})+L(x+6,134,x+6,146,'#8C6A52',1.2)+L(x+38,134,x+38,146,'#8C6A52',1.2);
  for(const x of [40,76,112,148,184])s+=L(x,74,x,86,INK,.6)+E(x,92,7,9,n?'#FFB36B':'#E8604C',{sw:.8})+L(x-6,92,x+6,92,shade('#E8604C',-.2),.6);
  if(!n)s+=Pth('M30,152 L70,74 h16 L46,152Z','#FFFFFF',{sw:0,op:.25});
  s+=band(8,158,W-16,'#D9C8AE');
  s+=R(10,166,W-20,H-168,'#6B5040',{sw:1})+autoDoor(cx,H-3,48,46,n,{frame:'#4A3A2E',mat:'#E8604C'});
  s+=R(20,172,50,H-178,'#3E4A45',{sw:.9})+T(45,186,'メニュー',{size:6,fill:'#FFFFFF'})+lines(45,198,['ラーメン','カレー','パフェ'],5.6,'#F2D16B');
  s+=R(154,172,50,H-178,n?'#F7E3B5':'#F4EEE2',{sw:.9});for(let i=0;i<3;i++)s+=C(166+i*13,196,5,['#F2D16B','#E8A0B4','#9CCB9A'][i],{sw:.6});
  if(n)s+=E(cx,H-4,56,8,'#FFE3A0',{sw:0,op:.22});
  return s;
}
// ===== おくじょう ていえん（屋上に 庭の ある たてもの） =====
// ===== ちかみちの 入口（いけぶへ つづく 地下）と おとどけ ぐち =====
function pavilion(kind,o={}){
  const n=!!o.night,W=128,H=96,cx=80;let s=dropShadow(W,H,9);
  if(kind==='passage'){
    s+=Pth(`M4,30 Q64,4 124,30 V36 H4Z`,n?'#9FB2B5':'#CFE3E5',{sw:1.1})+R(4,34,W-8,6,'#56636C',{sw:.9});
    for(const x of [10,118])s+=R(x-3,40,6,H-42,'#8E9AA1',{sw:.8});
    s+=R(16,42,56,H-44,'#DCD6CA',{sw:.9});for(let i=0;i<6;i++)s+=R(20+i*2,48+i*7,48-i*4,7,shade('#C9C2B2',-.03*i),{sw:.5});
    s+=L(18,46,40,H-4,INK,1)+L(70,46,48,H-4,INK,1);
    s+=R(76,44,44,24,'#F6B846',{sw:1,rx:3})+sunMark(86,56,5)+T(106,54,'いけぶへ',{size:6.2,fill:'#6B3E1C'})+T(106,63,'ちかみち',{size:6.2,fill:'#6B3E1C'});
    s+=R(76,70,44,H-72,'#46545D',{sw:.9})+autoDoor(cx+18,H-3,26,22,n).slice(0,0)+pane(88,74,20,H-78,n,1,{litRate:1});
    s+=R(78,72,10,10,'#FFFFFF',{sw:.6})+T(83,79.5,'B1',{size:5,fill:INK});
  }else{
    s+=R(6,26,W-12,H-26,'#F2EBDC',{sw:1.2})+sideFace(W-6,26,H-26,7,'#F2EBDC')+R(4,18,W-8,12,'#C99873',{sw:1});
    s+=T(64,28,'おとどけ ぐち',{size:8,fill:'#FFFFFF'});
    s+=R(14,38,48,30,'#DDB892',{sw:.9})+R(20,44,16,12,'#C4935F',{sw:.6})+L(28,44,28,56,'#E8C9A0',.8)+R(38,48,18,16,'#D8A56E',{sw:.6})+L(38,56,56,56,'#E8C9A0',.8);
    s+=R(14,70,48,H-72,'#B98E6B',{sw:.9})+T(38,84,'にもつ',{size:6,fill:'#FFFFFF'});
    s+=R(66,38,52,H-40,'#46545D',{sw:.9})+pane(70,42,44,H-48,n,2,{litRate:1});
    s+=R(98,H-22,22,14,'#6FA3BF',{sw:.7})+C(102,H-6,2.4,'#56636C',{sw:.5})+C(116,H-6,2.4,'#56636C',{sw:.5})+R(100,H-30,14,8,'#DDB892',{sw:.5});
  }
  if(n)s+=E(cx,H-4,40,6,'#FFE3A0',{sw:0,op:.22});
  return s;
}

// ===== ひがしどおり こうばん（ちいさな 交番） =====
function koban(o={}){
  const n=!!o.night,W=64,H=96,cx=16;let s=dropShadow(W,H,8);
  s+=Pth('M2,26 L32,6 L62,26Z','#7C8A96',{sw:1.1})+R(0,24,W,6,'#56636C',{sw:.9})+C(32,17,5,n?'#FFD27A':'#E25B4F',{sw:.8});
  s+=R(4,30,W-8,H-30,'#F1EEE6',{sw:1.2})+sideFace(W-4,30,H-30,6,'#F1EEE6');
  s+=R(8,34,48,14,'#2F4E78',{sw:.9,rx:2})+T(32,44,'こうばん',{size:8.5,fill:'#FFFFFF'});
  s+=R(34,54,20,20,n?'#F6DFA6':'#CFE3E5',{sw:.8})+L(44,54,44,74,INK,.7)+L(34,64,54,64,INK,.7);
  s+=R(36,78,16,16,'#FFF8E8',{sw:.7})+T(44,86,'まいご',{size:4.4,fill:'#2F4E78'})+T(44,92,'あんない',{size:4.4,fill:'#2F4E78'});
  s+=autoDoor(cx,H-3,22,40,n,{frame:'#2F4E78',mat:'#8FA1AE'});
  if(n)s+=E(cx,H-4,22,5,'#FFE3A0',{sw:0,op:.22})+C(32,17,10,'#FF8A7A',{sw:0,op:.3});
  return s;
}

// ===== 町の 小物（めじるし） =====
// いけふくろう（駅まえの まちあわせの 石の ふくろう）
function owlStatue(o={}){
  let s=E(34,28,32,6,'#1A1410',{sw:0,op:.16})+R(6,8,52,20,'#B8B0A2',{sw:1.1})+R(3,4,58,6,'#CFC8BA',{sw:1})+R(14,14,36,9,'#8C7B62',{sw:.7})+T(32,21,'いけふくろう',{size:5.4,fill:'#F6EAD0'});
  const st='#A99F90',dk='#857B6C';
  s+=Pth('M12,4 Q8,-26 18,-40 L14,-54 L25,-44 Q32,-47 39,-44 L50,-54 L46,-40 Q56,-26 52,4Z',st,{sw:1.3});
  s+=Pth('M20,2 Q18,-14 26,-22 Q32,-18 38,-22 Q46,-14 44,2Z',shade(st,.18),{sw:.8});
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)s+=Pth(`M${24+j*6},${-14+i*5} q3,3 6,0`,'none',{sw:.8,stroke:dk});
  s+=C(24,-32,7.5,'#E9E3D6',{sw:1})+C(40,-32,7.5,'#E9E3D6',{sw:1})+C(24,-32,3.4,'#5E5448',{sw:0})+C(40,-32,3.4,'#5E5448',{sw:0})+C(25,-33,1.1,'#FFFFFF',{sw:0})+C(41,-33,1.1,'#FFFFFF',{sw:0});
  s+=Pth('M29,-27 L32,-21 L35,-27Z','#C9A46A',{sw:.8})+Pth('M14,-8 q-6,6 -2,12 M50,-8 q6,6 2,12','none',{sw:1,stroke:dk});
  // ちいさな こふくろう
  s+=Pth('M50,4 q-2,-12 4,-16 l-1,-4 3,3 q2,-1 4,0 l3,-3 -1,4 q6,4 4,16Z',shade(st,.1),{sw:.9})+C(54.5,-8,2.2,'#E9E3D6',{sw:.6})+C(59.5,-8,2.2,'#E9E3D6',{sw:.6})+C(54.5,-8,1,'#5E5448',{sw:0})+C(59.5,-8,1,'#5E5448',{sw:0});
  return s;
}
// サンシャイン60どおりの はしらの かんばん
function streetPylon(o={}){
  const n=!!o.night;let s=E(16,29,10,3,'#1A1410',{sw:0,op:.16})+R(12,-6,8,34,'#6F7F8A',{sw:1})+R(8,24,16,6,'#56636C',{sw:.9});
  s+=R(3,-98,26,94,'#F6B846',{sw:1.2,rx:3})+R(6,-95,20,88,n?'#FFF1C4':'#FFF8E8',{sw:.7,rx:2})+sunMark(16,-84,6.5);
  s+=lines(16,-66,['サン','シャ','イン'],7,'#B5652B',1.25)+T(16,-34,'60',{size:11,fill:'#C2447B'})+lines(16,-22,['どお','り'],6.4,'#B5652B',1.2);
  if(n)s+=C(16,-52,26,'#FFE3A0',{sw:0,op:.16});
  return s;
}
// 大きな 画面（すいぞくかんの おしらせ）
function streetVision(o={}){
  const n=!!o.night;let s=E(48,29,40,4,'#1A1410',{sw:0,op:.16});
  for(const x of [14,78])s+=R(x,-40,6,68,'#56636C',{sw:1});
  s+=R(0,-118,96,80,'#2D3238',{sw:1.3,rx:3})+R(4,-114,88,64,n?'#5FA8D8':'#76BDE6',{sw:.6})+Pth('M4,-60 q22,-10 44,0 t44,0 V-50 H4Z','#4E93C6',{sw:0});
  s+=Pth('M20,-86 q12,-12 26,0 q-14,12 -26,0Z M46,-86 l8,-7 v14Z','#F7C948',{sw:.9})+C(26,-88,1.4,INK,{sw:0})+Pth('M58,-74 q8,-7 16,0 q-8,7 -16,0Z M74,-74 l5,-4 v8Z','#F29AAE',{sw:.7});
  for(const [x,y]of [[66,-100],[72,-94],[40,-70]])s+=C(x,y,2,'#DDF3FB',{sw:.5});
  s+=R(4,-50,88,10,'#1E2328',{sw:0})+T(48,-42,'12かい すいぞくかん ひらいてるよ',{size:5.6,fill:'#FFE58A'});
  s+=R(-4,-44,8,14,'#3C4046',{sw:.8})+R(92,-44,8,14,'#3C4046',{sw:.8});
  if(n)s+=R(-8,-122,112,88,'#9FD2F2',{sw:0,op:.14});
  return s;
}
// のぼりの ついた 街灯（サンシャイン60どおり）
function bannerLamp(o={}){
  const n=!!o.night;let s=E(16,29,8,3,'#1A1410',{sw:0,op:.16})+R(14,-58,4,86,'#56636C',{sw:.9})+R(10,24,12,5,'#56636C',{sw:.8});
  s+=Pth('M16,-58 q0,-8 10,-8 h4','none',{sw:2,stroke:'#56636C'})+Pth('M26,-66 h10 l-2,6 h-6Z','#56636C',{sw:.8})+E(31,-59,4,2.4,n?'#FFF1B8':'#F4EFD8',{sw:.6});
  s+=R(2,-48,11,34,'#E88BB8',{sw:.8})+R(19,-48,11,34,'#F6B846',{sw:.8})+C(7.5,-40,3,'#FFFFFF',{sw:.4})+T(7.5,-24,'60',{size:5,fill:'#FFFFFF'})+sunMark(24.5,-38,2.6)+T(24.5,-22,'S',{size:6,fill:'#FFFFFF'});
  if(n)s+=C(31,-58,18,'#FFE3A0',{sw:0,op:.2});
  return s;
}
// いちょう（緑の大通りの 並木）: たかく まっすぐ・おうぎの はっぱ
function ginkgo(o={}){
  let s=E(18,28,15,4,'#1A1410',{sw:0,op:.18})+R(8,20,20,9,'#8F958C',{sw:.8})+Rn(10,21,16,3,'#6C7A4B')+Pth('M16,24 L16.6,-30 L19.4,-30 L20,24Z','#7A5A40',{sw:.9})+Pth('M18,-8 l-7,-9 M18.5,-16 l8,-8','none',{sw:1.8,stroke:'#7A5A40'});
  const leaf=(x,y,r,c)=>Pth(`M${x},${y} l${-r},${-r*1.1} q${r},${-r*.7} ${r*2},0Z`,c,{sw:.5,stroke:shade(c,-.3)});
  for(const [x,y,rx,ry,c]of [[18,-84,8,9,'#8CBB62'],[18,-72,12,10,'#7FAE5A'],[17,-58,15,11,'#6E9E4E'],[19,-44,17,11,'#79A955'],[18,-30,15,9,'#6E9E4E']])s+=E(x,y,rx,ry,c,{sw:1});
  for(let i=0;i<26;i++){const y=-88+hash(i,2,7)*62,rx=7+(y+88)/62*9;s+=leaf(18+(hash(i,1,7)-.5)*rx*1.7,y,3,['#A3C97A','#5E8E44','#B5D58A'][i%3]);}
  return s;
}
// 南北の 電車（まちのわせん・上から 見た 屋根）
function trainNS(o={}){
  const n=!!o.night,W=48,H=352;let s='';
  for(const [y0,y1]of [[0,172],[180,H]]){
    s+=R(2,y0,W-4,y1-y0,'#E9EDEA',{sw:1.2,rx:10})+Rn(5,y0+8,W-10,y1-y0-16,'#C9D0CE',{rx:6})+Rn(2,y0+10,5,y1-y0-20,'#78B267')+Rn(W-7,y0+10,5,y1-y0-20,'#78B267');
    for(let y=y0+22;y<y1-20;y+=44)s+=R(14,y,20,14,'#B8C0BE',{sw:.7})+L(16,y+4,32,y+4,'#DCE2E0',.8)+L(16,y+9,32,y+9,'#9BA4A2',.6);
    for(let y=y0+14;y<y1-10;y+=18)s+=Rn(7,y,3,9,n?'#F2CF86':'#8FB7C5')+Rn(W-10,y,3,9,n?'#F2CF86':'#8FB7C5');
  }
  s+=Pth('M14,40 L34,28 L14,16 M14,28 H34','none',{sw:1.2,stroke:'#56636C'})+R(18,172,12,8,'#8E9AA1',{sw:.7});
  s+=R(8,H-14,W-16,9,'#2F3A3E',{sw:.8})+C(13,H-9.5,2.6,n?'#FFF1B8':'#F4EFD8',{sw:.5})+C(W-13,H-9.5,2.6,n?'#FFF1B8':'#F4EFD8',{sw:.5})+R(8,5,W-16,9,'#2F3A3E',{sw:.8})+C(13,9.5,2,'#E25B4F',{sw:.4})+C(W-13,9.5,2,'#E25B4F',{sw:.4});
  return s;
}
// ===== 地面の もよう（チャンクに 描く。1まいの タイルを くりかえす） =====
function groundTiles(){
  const t={};
  // まちの 広場: うすい グレーの 平板（目地と わずかな むら）
  { let v=Rn(0,0,64,64,'#C9C6BC');for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=32){const xo=(y/16)%2?16:0;for(const dx of [0,32])v+=Rn((x+xo+dx)%64+.6,y+.6,30.8,14.8,['#DCD9CF','#D5D2C7','#E0DDD3'][Math.floor(hash(x+dx,y,1)*3)],{rx:.8});}
    for(let i=0;i<24;i++)v+=Rn(hash(i,3,1)*64,hash(i,4,1)*64,1,1,'#BDB9AE',{op:.8});t['ike-plaza']={w:64,h:64,svg:v};}
  // 駅まえの 御影石（大きな 石の 板）
  { let v=Rn(0,0,64,64,'#B9B0A1');for(const [x,y]of [[0,0],[32,0],[0,32],[32,32]])v+=Rn(x+.8,y+.8,30.4,30.4,['#E4DCCD','#D9D0BF','#DED6C6','#E7E0D2'][(x/32+y/16)%4],{rx:.6});
    for(let i=0;i<30;i++)v+=Rn(hash(i,5,2)*64,hash(i,6,2)*64,1,1,['#B3A994','#F2ECE0'][i%2],{op:.8});t['ike-granite']={w:64,h:64,svg:v};}
  // サンシャイン60どおりの れんが（あたたかい 色の あじろ）
  { let v=Rn(0,0,32,32,'#B98470');const b=(x,y,w,h,c)=>Rn(x+.5,y+.5,w-1,h-1,c,{rx:.6});
    v+=b(0,0,16,8,'#D8A48A')+b(16,0,8,16,'#CF9A80')+b(24,0,8,16,'#DDAE94')+b(0,8,8,16,'#D29D84')+b(8,8,8,16,'#E1B39A')+b(16,16,16,8,'#D8A48A')+b(16,24,16,8,'#CC967C')+b(0,24,16,8,'#DDAE94');t['ike-brick']={w:32,h:32,svg:v};}
  // 線路の バラスト
  { let v=Rn(0,0,32,32,'#9C9486');for(let i=0;i<40;i++)v+=Rn(hash(i,7,3)*32,hash(i,8,3)*32,1+hash(i,9,3)*1.6,1.3,['#B1A99B','#8A8375','#A49C8E','#C0B9AC'][i%4]);t['ike-ballast']={w:32,h:32,svg:v};}
  // 中央分離帯の しばふ
  { let v=Rn(0,0,64,64,'#9DC877')+Rn(0,0,64,16,'#A6D07F')+Rn(0,32,64,16,'#A6D07F');for(let i=0;i<28;i++){const x=hash(i,10,4)*64,y=hash(i,11,4)*64;v+=`<path d="M${x.toFixed(1)},${y.toFixed(1)} l.8,-3" stroke="#83B45F" stroke-width="1" stroke-linecap="round"/>`;}t['ike-lawn']={w:64,h:64,svg:v};}
  // 点字ブロック（線と 点）
  t['ike-tactile-line']={w:16,h:16,svg:Rn(0,0,16,16,'#EFC03A')+Rn(.5,.5,15,15,'#F2C94C')+`<path d="M4,2 V14 M8,2 V14 M12,2 V14" stroke="#D9A61E" stroke-width="1.6" stroke-linecap="round"/>`};
  t['ike-tactile-dot']={w:16,h:16,svg:Rn(0,0,16,16,'#EFC03A')+Rn(.5,.5,15,15,'#F2C94C')+[4,8,12].map(x=>[4,8,12].map(y=>`<circle cx="${x}" cy="${y}" r="1.25" fill="#D9A61E"/>`).join('')).join('')};
  return t;
}
export const IKEBUKURO_GROUNDS=groundTiles();
export const IKEBUKURO_PROPS=[
  {id:'ikebukuro.owl',name:'いけふくろう（石の ふくろうの 像）',w:2,h:1,bbox:[-2,-60,68,36],draw:owlStatue,states:['day'],details:['まるい めの 石の ふくろう','こふくろう','いけふくろうの いしばん']},
  {id:'ikebukuro.pylon',name:'サンシャイン60どおりの かんばん',w:1,h:1,bbox:[-12,-104,44,36],draw:streetPylon,states:['day','night'],details:['おひさまの マーク','たての 文字']},
  {id:'ikebukuro.vision',name:'まちの 大きな 画面',w:3,h:1,bbox:[-10,-124,108,36],draw:streetVision,states:['day','night'],details:['すいぞくかんの おしらせ','スピーカー']},
  {id:'ikebukuro.bannerlamp',name:'のぼりの 街灯',w:1,h:1,bbox:[-2,-80,54,36],draw:bannerLamp,states:['day','night'],details:['ピンクと きいろの のぼり','夜の あかり']},
  {id:'nat.ginkgo',name:'いちょう（並木）',w:1,h:1,bbox:[-10,-100,48,34],draw:ginkgo,states:['day'],details:['おうぎの 形の はっぱ','植えますの ふち']},
  {id:'ikebukuro.train',name:'まちのわせん（南北の 電車・2りょう）',w:2,h:11,bbox:[0,0,48,352],draw:trainNS,states:['day','night'],details:['屋根の 冷房と パンタグラフ','みどりの おび','前と うしろの ライト']},
].map(a=>({category:'池袋の 小物',...a}));

export const IKEBUKURO_BUILDINGS=[
  {id:'ikebukuro.station',buildingId:'city_station',name:'池袋えき（東口の 駅ビル）',w:12,h:12,door:6,draw:station,details:['ガラスの アーチ天窓','ガラスの 吹きぬけと 横長の まど','駅名と 3つの 路線マーク','まちあわせの 時計','東口の ひさしと 改札ホール','きっぷうりば・コインロッカー・えきの ちず']},
  {id:'ikebukuro.bookstore',buildingId:'ike_annex1',name:'ほんの ギャラリー（おおきな 本やさん）',w:12,h:12,door:6,draw:bookstore,details:['屋上の 庭と BOOKS の 文字','れんがと 石の 柱','本だなの 見える アーチの まど','ひらいた 本の たてかんばん','えほんフェアの かざり まど・本の ワゴン']},
  {id:'ikebukuro.officeblock',buildingId:'city_clothes',name:'えきまえ ビル（駅の となりの ふつうの ビル）',w:12,h:13,door:6,draw:officeBlock,details:['屋上の 水の タンクと アンテナ','よこながの まどと ブラインド','たての テナントの かんばん（カフェ・じむしょ・じゅく）','ガラスの ロビーと あんないばん']},
  {id:'ikebukuro.electronics',buildingId:'ike_electronics',name:'ネリカス電機（10かいの 家電の お店）',w:18,h:14,door:9,top:40,draw:electronics,details:['屋上の 文字の かんばんと ほし','あかい たてかんばん','10かいの 売り場の おび','4K テレビの 大きな 画面','ポイント 10%','ならんだ テレビ・せんたくき・すいはんき・風船']},
  {id:'ikebukuro.arcade',buildingId:'ike_arcade',name:'Meeときょれじゃ（ゲームセンター）',w:13,h:13,door:6,top:60,draw:arcade,details:['まるい Mee の かんばんと でんきゅう','ほしの かざり','ネオンの ときょれじゃ','まどの むこうの クレーンゲーム（3人の ぬいぐるみ）','でんきゅうの ふちの 入口','ガチャと 1かい 100コイン']},
  {id:'ikebukuro.mall',buildingId:'ike_mall',name:'サンシャインいけぶ（モールと 60かいの タワー）',w:15,h:13,door:5,top:154,draw:mall,details:['60かいの タワーと 赤い ランプ','3かいの モール','おおきな アーチの ガラスの 入口','おひさまの マーク','たれまく（12かい すいぞくかん・3かい マルシェ・1かい ファッション）','みぎの 入口と 日よけ']},
  {id:'ikebukuro.slim_brick',buildingId:'city_market',name:'れんが ビル（ほそい ふつうの ビル）',w:5,h:13,door:2,draw:o=>slimBuilding('brick',o),details:['れんがの かべ','ベランダの てすり','なまえの いた']},
  {id:'ikebukuro.slim_glass',buildingId:'city_furniture',name:'あおぞら ビル（ほそい ふつうの ビル）',w:5,h:13,door:2,draw:o=>slimBuilding('glass',o),details:['そらが うつる ガラス','しろい たての ひれ','なまえの いた']},
  {id:'ikebukuro.range',buildingId:'city_range',name:'シューティング レンジ（競技の 射撃場）',w:10,h:7,door:5,top:40,draw:range,details:['屋上の 大きな まと','チャコールと オレンジの おび','レーンと まとの スタンドが 見える まど','あんぜん だいいち・ゴーグル','トロフィーの かざり まど']},
  {id:'ikebukuro.office_tower',buildingId:'ike_office',name:'ままの オフィス（ガラスの タワー）',w:15,h:17,door:7,draw:officeTower,details:['ななめの クラウンと アンテナ','12かいの カーテンウォールと しろい ひれ','はっぱの 会社の マーク','2かいぶんの ロビー（受付・エレベーター）','ひさしと 植えこみの 木']},
  {id:'ikebukuro.office_lobby',buildingId:'city_office',name:'オフィス うけつけ（ロビー館）',w:9,h:12,door:4,draw:officeLobby,details:['屋上の 庭','タワーと おなじ ガラスの おび','うけつけの かんばん','ガラスの ロビー']},
  {id:'ikebukuro.museum',buildingId:'city_museum',name:'きょうりゅう はくぶつかん（17マスの 大きな 館）',w:17,h:7,door:8,top:90,draw:museum,details:['うしろから のぞく ブラキオサウルスと ティラノサウルス','石の 三角やねと あしあとの マーク','4本の はしら・ガラスの 入口','りょうがわの てんじしつの ほねの もけい','たれまくと まえの かいだん']},
  {id:'ikebukuro.puzzle',buildingId:'link',name:'なかよし パズル',w:7,h:4,door:3,top:14,draw:puzzleShop,details:['いろとりどりの ブロックの やね','ジグソーの かんばん','玉の ならぶ まど','きょうの もんだい']},
  {id:'ikebukuro.hotel',buildingId:'ike_annex2',name:'ひがしぐち ホテル',w:7,h:10,door:3,draw:hotel,details:['テラコッタの 名前の おび','はなの ある まど','たての HOTEL の 文字','ひさしと 回転ドア・植木']},
  {id:'ikebukuro.cafe',buildingId:'city_cafe',name:'いけぶ カフェテラス',w:6,h:10,door:3,draw:cafe,details:['れんがと アーチの まど','みどりの 日よけ','コーヒーカップの かんばん','テラスの せき・きょうの ケーキ']},
  {id:'ikebukuro.cinema',buildingId:'ike_annex0',name:'シネマ いけぶくろ',w:7,h:10,door:3,draw:cinema,details:['でんきゅうの CINEMA','3まいの ポスター（きょうりゅう・うちゅう・うさぎ）','フィルムの まるい かざり','ポップコーンの きっぷうりば','つぎの じょうえい']},
  {id:'ikebukuro.foodhall',buildingId:'city_reading',name:'いけぶ フードホール',w:7,h:7,door:3,draw:foodHall,details:['木の はりの 名前','フォークと スプーン','ちょうちんと ながい テーブル','メニューの こくばん']},
  {id:'ikebukuro.koban',buildingId:'ike_koban',name:'ひがしどおり こうばん',w:2,h:3,door:0,top:12,draw:koban,details:['あかい ランプの やね','こうばんの かんばん','まいごの あんない']},
  {id:'ikebukuro.passage',buildingId:'city_gallery',name:'いけぶへの ちかみち（地下の 入口）',w:4,h:3,door:2,top:12,draw:o=>pavilion('passage',o),details:['ガラスの まるい やね','地下へ おりる かいだん','おひさまの マークの あんない','B1']},
  {id:'ikebukuro.parcel',buildingId:'relay',name:'いけぶ おとどけ ぐち',w:4,h:3,door:2,top:12,draw:o=>pavilion('parcel',o),details:['テラコッタの やね','にもつの はこと 台車','ガラスの まどぐち']},
].map(a=>({category:'池袋の 建物',states:['day','night'],bbox:[-12,-(a.top||40),a.w*32+22,a.h*32+14],...a}));
// 線の はしと かどは ぜんぶ round。要素ごとに 書かず、外がわの g に まとめる（データを かるく する）
export const ikebukuroDraw=(a,o={})=>'<g stroke-linejoin="round" stroke-linecap="round">'+a.draw(o).replaceAll(' stroke-linejoin="round" stroke-linecap="round"','')+'</g>';
export function ikebukuroSvg(a,o={}){const [x0,y0,x1,y1]=a.bbox;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" width="${x1-x0}" height="${y1-y0}" role="img" aria-label="${a.name}">${ikebukuroDraw(a,o)}</svg>`;}
