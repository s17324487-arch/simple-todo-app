// ネリカス駅の原画。平和台と同じ32px/マス、南向き、左上光源。
// 本編へはbuild-nerikasu-town.mjsで原画のまま登録。bboxは足もとの左上基準。横長の絵をマスへ圧縮しない。
import {INK,R,Rn,C,E,Pth,L,T,groundShadow,shade} from './lib.mjs';
import {NERIKASU_PROPS,nerikasuBicycle} from './nerikasu-props.mjs';
const green='#648975', dark='#31594E', cream='#F3EAD9', wood='#A97850', copper='#BC795C';
const group=(x,y,s)=>`<g transform="translate(${x},${y})">${s}</g>`;
const glass=(x,y,w,h,night=false)=>R(x,y,w,h,night?'#D8B96F':'#8CB8BF',{sw:.9,stroke:dark})+Pth(`M${x+2},${y+h-2} L${x+w*.56},${y+2} H${x+w*.8} L${x+w*.25},${y+h-2}Z`,night?'#F5DB99':'#DBEDEE',{sw:0,op:.75})+L(x+w/2,y,x+w/2,y+h,'#E8E9D8',1.4);
const bolt=(x,y)=>C(x,y,.8,'#D8CFAD',{sw:.4,stroke:dark});
function brick(x,y,w,h){let s=R(x,y,w,h,'#B78067',{sw:.7,stroke:'#765B4C'});for(let j=0;j<h/5;j++){s+=L(x,y+j*5,x+w,y+j*5,'#DBBE9E',.7);for(let i=0;i<w/14;i++)s+=L(x+i*14+(j%2?7:0),y+j*5,x+i*14+(j%2?7:0),y+Math.min(h,j*5+5),'#DBBE9E',.7);}return s;}
function leaf(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})">`+Pth('M0,6 Q-13,-2 -7,-12 Q6,-10 0,6Z','#E5C77D',{sw:.7})+Pth('M0,6 Q12,-4 9,-14 Q-3,-11 0,6Z','#8DAD79',{sw:.7})+L(0,10,0,-6,dark,.8)+L(-1,2,-5,-6,dark,.6)+L(1,0,6,-8,dark,.6)+'</g>';}
function clock(x,y,r=12){let s=C(x+1,y+1,r+2,dark,{sw:1.1})+C(x,y,r,cream,{sw:1})+C(x,y,r-2,'#FFFCED',{sw:.5,stroke:'#C5B284'});for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=L(x+Math.sin(a)*(r-4),y-Math.cos(a)*(r-4),x+Math.sin(a)*(r-2.5),y-Math.cos(a)*(r-2.5),dark,.75);}return s+L(x,y,x-4,y-4,dark,1.3)+L(x,y,x+6,y-3,dark,1)+C(x,y,1.3,copper,{sw:.4});}
function roof(x,y,w,depth){let s=Pth(`M${x+12},${y} H${x+w-12} L${x+w+3},${y+depth} H${x-3}Z`,green,{sw:1.3});for(let i=0;i<20;i++){const a=(i+.5)/20;s+=L(x+12+a*(w-24),y+1,x-3+a*(w+6),y+depth-2,'#456956',.7)+L(x+13+a*(w-24),y+1,x-2+a*(w+6),y+depth-3,'#91AA8A',.6);}return s+L(x+12,y,x+w-12,y,'#A8BBA1',2)+R(x-4,y+depth,w+8,4,dark,{sw:.9})+Rn(x-3,y+depth+4,w+6,4,'#312F26',{op:.17});}
function flower(x,y,c='#D99891'){return L(x,y+9,x,y-2,'#5B7D51',.7)+E(x-3,y+4,3,1.2,'#72935B',{sw:0})+E(x+3,y+2,3,1.2,'#72935B',{sw:0})+Array.from({length:5},(_,i)=>C(x+Math.sin(i*1.256)*2,y+Math.cos(i*1.256)*2,1.5,c,{sw:.3,stroke:shade(c,-.25)})).join('')+C(x,y,.9,'#EDD47F',{sw:0});}
const plant=(x,y)=>group(x,y,R(0,0,24,9,'#C39773',{sw:.7})+Pth('M0,0 l3,-5 h18 l3,5Z','#DAB698',{sw:.7})+Rn(3,-4,18,4,'#6F644B')+flower(6,-7)+flower(12,-11,'#F4DFC0')+flower(19,-8,'#C594B5'));
const station=(o={})=>{
  const n=!!o.night;let s=Pth('M448,8 l17,10 V166 H18 L0,157 H448Z','#1A1410',{sw:0,op:.17});
  s+=R(0,27,448,132,cream,{sw:1.3})+Pth('M448,27 l10,-6 V151 l-10,8Z','#C6BDA8',{sw:1});
  for(let y=36;y<145;y+=8)s+=L(3,y,444,y,'#D8CDB7',.5);
  s+=brick(0,139,448,20);
  for(const x of [6,102,162,278,340,436])s+=R(x,39,7,114,wood,{sw:.8})+L(x+1.4,40,x+1.4,148,'#C39769',1)+bolt(x+3,132);
  // 左側の駅員窓口。室内の棚とカーテンをガラス越しに見せる。
  s+=glass(20,76,70,46,n)+R(20,112,70,10,'#E9D7AC',{sw:.8})+T(55,119,'えきいん',{size:6,fill:dark});
  s+=Rn(23,79,9,28,'#C5C9A1',{op:.7})+Rn(76,79,10,28,'#C5C9A1',{op:.7})+R(47,103,18,8,'#C19D7A',{sw:.5})+L(24,99,86,99,cream,1.2);
  s+=R(22,125,27,9,'#FCF5DF',{sw:.6})+T(35.5,131,'ごあんない',{size:4.2,fill:dark})+R(60,124,29,13,'#648975',{sw:.6});
  s+=T(74.5,130,'おとしもの',{size:3.8})+L(65,133,84,133,'#E3DDC1',.7);
  // 入口の奥に改札。ガラスの入口2組は下端で開く。
  s+=R(172,82,104,73,'#435B52',{sw:1.1})+R(176,87,96,62,n?'#B5A87F':'#A8B6A3',{sw:0});
  s+=T(224,94,'← 平和台　池袋 →',{size:5.2,fill:n?'#FFF0B6':'#EBF0DB'});
  for(const x of [182,211,244])s+=R(x,122,13,26,'#718F83',{sw:.6,rx:2})+Pth(`M${x},122 l4,-4 h13 l-4,4Z`,'#DCE6CF',{sw:.6})+R(x+3,124,6,5,dark,{sw:.3})+C(x+7,127,1.3,'#B1D5A0',{sw:0});
  for(const x of [173,226]){s+=R(x,96,49,58,'none',{sw:1.6,stroke:dark});for(const xx of [x+1.5,x+26]){s+=R(xx,97,22,56,'#B7D9D3',{sw:.5,op:.35})+L(xx+2,146,xx+17,100,'#EEF7EC',1,{op:.8})+R(xx,120,22,3,'#E8EDCE',{sw:0,op:.8});}s+=L(x+24,98,x+24,151,dark,1)+Rn(x+19,128,1.2,8,'#FAF0D5')+Rn(x+29,128,1.2,8,'#FAF0D5');}
  // 右側の券売機のくぼみ・路線図・チャージ端末。
  s+=R(350,76,75,63,'#BDB9A3',{sw:.9})+R(352,78,71,18,'#FFFCED',{sw:.5})+T(387,84,'きっぷ・チャージ',{size:5.4,fill:dark})+L(357,90,414,90,green,1.4);
  for(const x of [365,381,399,411])s+=C(x,90,1.6,cream,{sw:.5,stroke:dark});
  for(const x of [355,381])s+=ticket(x,100,n);
  s+=R(410,100,12,34,'#EAE3CC',{sw:.7})+R(412,103,8,9,dark,{sw:.4})+C(416,118,2,'#84ABA4',{sw:.5})+T(416,129,'IC',{size:4.3,fill:dark});
  // 腰窓、ポスター、花箱は入口を避ける。
  for(const x of [117,291]){s+=glass(x,95,32,29,n)+plant(x+3,138)+R(x+1,77,30,12,cream,{sw:.5})+T(x+16,85,x===117?'通学路':'おかえり',{size:5.4,fill:dark});}
  s+=roof(-1,-8,449,45);
  // 木組みの時計切妻。中央の高い屋根で郊外駅のシルエットを作る。
  s+=Pth('M155,44 V2 L224,-34 L293,2 V44Z',cream,{sw:1.1})+Pth('M150,6 L224,-42 L298,6 L294,12 L224,-32 L154,12Z',dark,{sw:1.3});
  s+=L(161,4,224,-32,wood,3)+L(224,-32,286,4,wood,3)+L(224,-27,224,36,wood,3)+L(162,26,286,26,wood,2)+L(164,4,192,26,wood,1.5)+L(284,4,257,26,wood,1.5)+clock(224,5,15);
  for(const x of [166,178,264,276])s+=R(x,31,7,9,'#9DB4A9',{sw:.6});
  // 広い駅名看板と分離した庇、木の方杖。
  s+=R(150,45,148,24,dark,{sw:1,rx:2})+L(152,47,296,47,'#9CB591',.7)+leaf(163,58,.5)+T(232,58,'ネリカス駅',{size:11.5,fill:'#FFF5D9'})+T(228,66,'N E R I K A S U',{size:5.4,fill:'#D8DDBD'});
  s+=Pth('M154,76 H294 L305,87 H143Z',green,{sw:1.1})+R(143,87,162,4,dark,{sw:.8})+Rn(155,91,138,5,'#152E23',{op:.2});
  for(const x of [155,288])s+=L(x,94,x,139,wood,3)+L(x,108,x+(x<200?10:-10),93,wood,2)+R(x-3,141,6,12,'#B0A68E',{sw:.6});
  s+=L(0,35,0,148,copper,2)+L(445,37,445,148,copper,2)+Pth('M0,148 l5,5 M445,148 l-5,5','none',{sw:2,stroke:copper});
  s+=R(170,155,108,5,'#CBC3AE',{sw:.7})+Rn(215,155,16,5,'#DFC170');
  if(n)s+=E(224,164,73,13,'#FCE1A0',{sw:0,op:.18})+Rn(153,48,143,19,'#FFE8B2',{op:.08});
  return s;
};
function ticket(x,y,n){return group(x,y,R(0,0,22,36,'#D7D8C4',{sw:.8,rx:1})+R(2,3,18,3,green,{sw:.4})+R(3,9,16,12,n?'#BEE2D0':'#517A74',{sw:.5})+Rn(5,11,5,3,'#D1E3B9')+Rn(12,11,5,3,'#D1E3B9')+Rn(5,16,12,2,'#ABC1B0')+R(3,24,8,3,dark,{sw:.4})+C(16,25,2,'#B9B8AC',{sw:.5})+R(3,31,16,3,'#3B4541',{sw:.4}));}
function canopy(){let s=R(0,45,256,19,'#CBC6B4',{sw:.8});for(const x of [13,122,236])s+=R(x,0,4,56,dark,{sw:.8})+L(x,24,x+14,4,dark,1.5)+R(x-3,55,10,6,'#969E94',{sw:.6});s+=Pth('M-6,-26 H246 L260,3 H-4Z',green,{sw:1.2});for(let x=5;x<250;x+=13)s+=L(x,-25,x+6,1,'#A2B497',.7);s+=R(-4,3,264,5,dark,{sw:1})+T(61,17,'1　平和台・池袋 →',{size:6,fill:dark})+R(22,45,54,5,wood,{sw:.7})+R(22,32,54,9,wood,{sw:.7});for(let x=24;x<76;x+=8)s+=L(x,33,x,40,'#795438',.6);return s+Rn(2,61,252,3,'#E7C766');}
function train(o={}){let s=groundShadow(212,65,211,8);for(const base of [0,216]){s+=group(base,0,(()=>{let a=R(9,3,193,58,'#E9E5D5',{sw:1.2,rx:9})+R(14,7,183,17,'#BDC8BD',{sw:.7,rx:5});for(const x of [26,83,145])a+=R(x,9,24,9,'#ABB8AE',{sw:.5,rx:2})+L(x+3,12,x+21,12,'#D6DDD0',.8)+L(x+3,15,x+21,15,'#7F9289',.6);a+=Rn(10,48,191,7,green)+Rn(10,55,191,2,'#DCC279');for(const x of [22,67,112,157]){a+=glass(x,28,27,17,!!o.night)+L(x+2,40,x+25,40,'#6D8074',.6);}for(const x of [51,96,141]){a+=R(x,27,13,31,'#CDD8C7',{sw:.7})+glass(x+2,29,9,13,!!o.night)+L(x+6.5,28,x+6.5,57,dark,.6)+Rn(x+2,46,9,2,green);}for(const x of [32,151])a+=R(x,60,26,5,'#54675D',{sw:.7,rx:1})+C(x+5,65,3,'#3C443F',{sw:.5})+C(x+22,65,3,'#3C443F',{sw:.5});a+=R(169,20,26,6,dark,{sw:.5})+T(182,24.5,'池袋',{size:4.7,fill:'#E9C989'})+leaf(21,52,.27);if(base===216)a+=Pth('M200,16 Q212,21 211,49 L202,56Z','#CBD5C5',{sw:.9})+glass(202,26,7,15,!!o.night)+C(205,49,1.8,'#FFF5C7',{sw:.5});return a;})());}return s+R(204,29,18,20,'#5E6D64',{sw:.8,rx:2})+[0,1,2,3].map(i=>L(207+i*3,30,207+i*3,48,'#89968B',.7)).join('')+Pth('M310,10 l11,-13 l12,13 M315,0 h18','none',{sw:1.3,stroke:'#53665D'});}
function waiting(o={}){let s=groundShadow(74,96,70,9)+R(0,20,128,75,cream,{sw:1.1})+brick(0,79,128,16);for(const x of [9,46]){s+=glass(x,39,30,37,!!o.night)+L(x,58,x+30,58,wood,1);s+=Rn(x+2,67,26,4,wood)+L(x+5,69,x+5,75,dark,1)+L(x+25,69,x+25,75,dark,1);}s+=glass(86,40,29,51,!!o.night)+L(110,62,110,71,copper,1.5)+roof(-2,-5,132,33)+R(30,24,72,10,dark,{sw:.7})+T(66,31,'まちあいしつ',{size:6.5})+plant(7,85)+L(124,30,124,89,copper,1.4);return s;}
function kiosk(o={}){let s=groundShadow(54,98,52,7)+R(0,29,96,67,cream,{sw:1})+brick(0,80,96,16)+R(6,45,51,35,'#5C6F5B',{sw:.8})+glass(65,40,25,54,!!o.night)+L(84,68,84,74,copper,1.4);for(let y=55;y<=73;y+=9){s+=R(9,y,45,2,wood,{sw:.5});for(let x=14;x<=47;x+=11)s+=E(x,y-3,4,2,'#D4A45D',{sw:.5})+L(x-1,y-4,x+2,y-4,'#F4D49D',.6);}s+=roof(0,0,96,25)+R(6,29,84,12,copper,{sw:.7})+T(48,37.5,'こむぎの まど',{size:6.5});s+=Pth('M4,42 H59 L64,50 H0Z','#E6C282',{sw:.8});for(let x=3;x<60;x+=12)s+=Pth(`M${x+2},43 h5 l3,6 h-6Z`,'#FAEDCA',{sw:0});return s+plant(1,86)+R(37,82,17,13,dark,{sw:.7})+T(45,88,'やきたて',{size:3.5})+T(45,93,'パン',{size:4.2});}
function bikeshed(){let s=R(0,51,160,42,'#CBCABB',{sw:.8});for(let i=0;i<3;i++){const x=8+i*49,c=['#608C81','#BF8E82','#DFBA69'][i];s+=E(x+23,90,22,3,'#334C3E',{sw:0,op:.12})+`<g transform="translate(${x},61) scale(.75)">${nerikasuBicycle(c,i===2,i===1?1:0)}</g>`+Pth(`M${x+4},89 v-8 q0,-4 4,-4 v12`,'none',{sw:1.1,stroke:'#83978A'});}for(const x of [3,79,154])s+=R(x,14,3,70,dark,{sw:.6});s+=Pth('M-4,-3 H146 L165,27 H-3Z','#BBD3BE',{sw:1.1,op:.88});for(let x=4;x<155;x+=13)s+=L(x,-2,x+10,26,'#6E927D',.8);return s+R(-3,27,168,4,dark,{sw:.8})+R(46,31,67,10,cream,{sw:.7})+T(79.5,38,'じてんしゃ おきば',{size:5.4,fill:dark});}
function lift(o={}){let s=groundShadow(45,66,41,8)+R(4,-29,64,93,'#BED1C1',{sw:1.1})+glass(8,-20,56,66,!!o.night)+L(8,2,64,2,dark,1)+L(8,26,64,26,dark,1)+R(5,-30,62,8,green,{sw:.8});s+=R(19,25,35,38,'#DBE2D0',{sw:.8})+glass(22,28,29,31,!!o.night)+R(20,15,33,8,dark,{sw:.6})+T(36.5,21,'↑ EV ↓',{size:5.6})+L(36,29,36,58,dark,1)+R(59,34,4,9,cream,{sw:.5})+C(61,37,.8,'#BF735B',{sw:0});return s+T(35,9,'ホームへ',{size:5.5,fill:dark});}
function busstop(o={}){let s=groundShadow(50,51,49,7);for(const x of [4,92])s+=R(x,-28,3,76,dark,{sw:.8});s+=glass(8,-27,82,41,!!o.night)+R(8,-23,20,32,cream,{sw:.6})+T(18,-16,'時刻表',{size:4.8,fill:dark});for(let i=0;i<7;i++)s+=L(10,-12+i*2.6,25,-12+i*2.6,'#AEB7A0',.5);s+=R(37,-17,43,24,'#DBE5C9',{sw:.5})+leaf(56,-4,.6)+T(58,4,'おかえり',{size:4.6,fill:dark});s+=R(12,29,71,6,wood,{sw:.8})+R(12,15,71,9,wood,{sw:.8})+L(18,34,18,44,dark,2)+L(76,34,76,44,dark,2);return s+Pth('M-3,-41 H89 L103,-28 H-3Z',green,{sw:1.1})+R(-3,-28,106,5,dark,{sw:.7})+T(49,-17,'ネリカス駅 のりば',{size:5.4,fill:dark})+L(113,48,113,-20,green,2)+C(113,-27,9,cream,{sw:1})+T(113,-24,'バス',{size:5.6,fill:dark})+R(106,-13,14,23,cream,{sw:.6})+T(113,-6,'01',{size:5,fill:dark});}
function tree(){let s=groundShadow(32,29,30,12)+R(5,17,43,12,'#968F78',{sw:.8})+Pth('M5,17 l10,-10 h32 l1,10Z','#BDBDA0',{sw:.7})+E(26,16,18,8,'#5B6950',{sw:.6})+Pth('M24,20 L25,-26 L18,-38 M26,-15 l15,-24 M25,-8 L12,-28','none',{sw:5,stroke:'#786448'})+L(24,15,24,-21,'#A68A60',1.2);for(const [x,y,r,c]of [[12,-34,15,'#5E8557'],[38,-37,20,'#6B935D'],[26,-58,22,'#8CA868'],[7,-53,16,'#81A369'],[44,-59,14,'#9BB279'],[25,-73,16,'#AABD7A']]){s+=`<g transform="translate(${x},${y}) scale(${r/20})">`+Pth('M-19,1 Q-25,-5 -17,-9 Q-19,-16 -9,-14 Q-4,-22 4,-15 Q13,-19 15,-11 Q26,-9 20,-2 Q27,5 16,9 Q14,17 3,13 Q-6,18 -11,11 Q-23,13 -19,1Z',c,{sw:1,stroke:'#475E42'});for(let k=0;k<10;k++){const xx=-13+(k*11)%28,yy=-10+(k*7)%21;s+=Pth(`M${xx},${yy} q2,-4 5,-2 q-2,5 -5,2Z`,shade(c,k%3? .12:-.12),{sw:0});}s+=Pth('M-17,-8 q3,-6 7,-3 M-5,-14 q5,-4 8,0','none',{sw:1,stroke:shade(c,.25)})+'</g>';}return s;}
function track(){let s=R(0,0,128,32,'#A29D8E',{sw:.4,stroke:'#817F70'});for(let i=0;i<64;i++){const x=(i*37)%127,y=(i*13)%31;s+=Pth(`M${x},${y} l2,-1 l2,2 l-3,1Z`,['#B7B2A0','#8C8C7E','#C9C3B0'][i%3],{sw:0});}for(let x=3;x<128;x+=12)s+=R(x,3,5,27,'#86705B',{sw:.5});for(const y of [8,24])s+=L(0,y,128,y,'#45524D',3)+L(0,y-1,128,y-1,'#D6DBCE',1);return s;}
function tactile(kind){let s=Rn(0,0,32,32,'#DDD1B8');for(let y=0;y<32;y+=16)for(let x=0;x<32;x+=16)s+=R(x,y,16,16,'#DFC272',{sw:.4,stroke:'#B89F57'});if(kind==='warning'){for(let x=3;x<32;x+=5)for(let y=3;y<32;y+=5)s+=C(x,y,1.1,'#F7D78A',{sw:.35,stroke:'#BA9D52'});}else {for(const x of [5,10,15,20,25])s+=L(x,2,x,kind==='corner'?16:30,'#F7D78A',1.6);if(kind==='corner')for(const y of [18,23,28])s+=L(2,y,30,y,'#F7D78A',1.6);}return s;}
const def=(id,name,category,w,h,bbox,details,draw,states=['day'])=>({id:'nerikasu.'+id,name,category,w,h,bbox,details,states,draw});
export const NERIKASU_ASSETS=[
  def('station','ネリカス駅・木組みの駅舎','駅舎・交通',14,5,[-8,-47,470,179],['時計切妻と金属屋根のはぜ','木の柱・方杖・銅の雨どい','葉の駅章・和英駅名','ガラス越しの改札','左：駅員窓口／右：券売機','入口の点字ブロック'],station,['day','night']),
  def('waiting','ひだまりの待合室','駅舎・交通',4,3,[-8,-12,150,109],['室内ベンチの見える窓','花箱・レンガ腰壁','駅舎と同じ切妻屋根'],waiting,['day','night']),
  def('kiosk','こむぎのまど・駅前売店','駅舎・交通',3,3,[-8,-5,114,111],['パン棚・しまの日よけ','独立した入口','黒板メニュー・花箱'],kiosk,['day','night']),
  def('bikeshed','屋根付き駐輪場','駅舎・交通',5,3,[-9,-8,171,104],['半透明の屋根と骨組み','3台の自転車・子供乗せ','スポーク・かご・駐輪ラック'],bikeshed),
  def('canopy','ホームの屋根','駅舎・交通',8,2,[-11,-31,267,69],['金属屋根・方杖・支柱','行先案内・木のベンチ','端の警告色帯'],canopy),
  def('train','若葉ライン・2両編成','駅舎・交通',14,2,[-4,-9,440,81],['2両の連結幌','台車・車輪・冷房機','パンタグラフ・行先表示','セージと金の帯'],train,['day','night']),
  def('lift','ホームのエレベーター','駅舎・交通',3,2,[-4,-36,93,80],['ガラスの昇降塔','操作盤・階表示','段差のない入口'],lift,['day','night']),
  def('busstop','木のベンチのバス停','駅舎・交通',4,2,[-10,-47,129,65],['時刻表・丸い停留所標識','透明な風よけ・木のベンチ','駅章ポスター'],busstop,['day','night']),
  def('tree','ケヤキと植えます','広場・通学路',2,1,[-14,-90,71,46],['6段の葉のかたまり','枝・根元・植えます','右下の木もれ日影'],tree),
  def('track','連結できる線路','道・設備',4,1,[-3,-4,131,37],['砕石・まくら木・2本のレール','左右の端を連結可能'],track),
  def('railfence','線路沿いのさく','道・設備',3,1,[-4,-21,102,35],['3本の支柱・縦格子','コンクリートの基礎','続けて置ける端'],()=>{let s=R(0,22,96,8,'#BFC0AD',{sw:.7});for(let x=3;x<96;x+=6)s+=L(x,-12,x,23,green,1);for(const x of [1,47,94])s+=R(x,-17,3,43,dark,{sw:.6})+C(x+1.5,-18,2,'#DBC78D',{sw:.5});return s+L(1,-12,96,-12,dark,1.8)+L(1,15,96,15,dark,1.5);}),
  def('ticket','券売機・2台','道・設備',2,1,[-3,-14,60,36],['運賃画面・選択ボタン','紙幣と硬貨投入口','きっぷ取出口'],o=>group(3,-7,ticket(0,0,!!o?.night)+ticket(27,0,!!o?.night)),['day','night']),
  def('gates','改札・幅広通路つき','道・設備',3,1,[-3,-18,103,38],['IC読取部・矢印表示','透明なフラップ','広い通路と通常通路'],()=>{let s=Rn(0,10,96,22,'#D6D3BB');for(const x of [0,28,81])s+=R(x,0,13,31,'#82A38A',{sw:.8,rx:2})+Pth(`M${x},0 l5,-9 h13 l-5,9Z`,'#D4DBC8',{sw:.7})+R(x+3,2,7,6,dark,{sw:.5})+Pth(`M${x+5},4 h3 l-1,-1 m1,1 l-1,1`,'none',{sw:.6,stroke:'#C9EFA8'})+R(x+11,13,8,10,'#99C5BA',{sw:.5,op:.8});return s;}),
  def('departure','発車案内と駅時計','道・設備',3,1,[-3,-27,102,35],['ホーム番号・行先・時刻','木枠とつり金具','丸い駅時計'],()=>L(8,-24,8,-13,dark,1)+L(75,-24,75,-13,dark,1)+R(0,-15,82,29,wood,{sw:1})+R(3,-12,76,23,dark,{sw:.6})+T(41,-5,'1　平和台・池袋',{size:5.3,fill:'#F0D295'})+T(41,4,'ふつう　10:24',{size:5.5,fill:'#D7E5A3'})+clock(90,-3,9)),
  ...['line','corner','warning'].map((kind,i)=>def('tactile_'+kind,['点字ブロック・誘導','点字ブロック・曲がり角','点字ブロック・警告'][i],'道・設備',1,1,[-1,-1,33,33],['線と点を描き分け','32px角・段差なし'],()=>tactile(kind))),
  def('paving','駅前の敷石','道・設備',2,2,[-1,-1,65,65],['ずらし積み・2色の敷石','小さな欠け・目地'],()=>{let s=Rn(0,0,64,64,'#B7AA8D');for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=16)s+=R(x+.6,y+.6,14.8,6.8,(x+y)%24?'#DBCFB8':'#E8DBC2',{sw:.4,stroke:'#C4B595',rx:.6});return s;}),
  ...NERIKASU_PROPS
];
export function nerikasuSvg(a,o={}){const [x0,y0,x1,y1]=a.bbox;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" width="${x1-x0}" height="${y1-y0}" role="img" aria-label="${a.name}">${a.draw(o)}</svg>`;}
