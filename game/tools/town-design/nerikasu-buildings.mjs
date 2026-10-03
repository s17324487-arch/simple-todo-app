// 町の建物の原画。32px/マスの実寸で描き、駅と同じ材料・線・光源を使う。
import {R,Rn,C,E,Pth,L,T,shade} from './lib.mjs';
const sage='#648975',ink='#31594E',cream='#F3EAD9',wood='#A97850',copper='#BC795C';
const g=(x,y,s)=>`<g transform="translate(${x},${y})">${s}</g>`;
const pane=(x,y,w,h,n=false)=>R(x,y,w,h,n?'#EACB89':'#94BEC2',{sw:.8,stroke:ink})+Pth(`M${x+2},${y+h-2} L${x+w*.6},${y+2} h${w*.2} L${x+w*.2},${y+h-2}Z`,n?'#FFF0C5':'#E5F3EC',{sw:0,op:.7})+L(x+w/2,y,x+w/2,y+h,cream,1.1)+L(x,y+h*.58,x+w,y+h*.58,cream,.8);
function brick(x,y,w,h,c='#BD8E77'){let s=R(x,y,w,h,c,{sw:.7,stroke:'#82634F'});for(let j=0;j<h/6;j++){s+=L(x,y+j*6,x+w,y+j*6,'#E2C9AA',.6);for(let i=1;i<w/14;i++)s+=L(x+i*14-(j%2?7:0),y+j*6,x+i*14-(j%2?7:0),y+Math.min(h,j*6+6),'#E2C9AA',.6);}return s;}
function roof(x,y,w,h,c=sage,tile=false){let s=Pth(`M${x+18},${y} H${x+w-18} L${x+w+4},${y+h} H${x-4}Z`,c,{sw:1.3});for(let i=1;i<Math.ceil(w/13);i++){const t=i/Math.ceil(w/13);s+=L(x+18+t*(w-36),y+1,x-4+t*(w+8),y+h-2,shade(c,-.22),.7)+L(x+19+t*(w-36),y+1,x-3+t*(w+8),y+h-2,shade(c,.24),.5);}if(tile)for(let yy=8;yy<h;yy+=8)s+=L(x+18-22*yy/h,y+yy,x+w-18+22*yy/h,y+yy,shade(c,-.2),.8);return s+R(x-5,y+h,w+10,4,shade(c,-.34),{sw:.9})+Rn(x,y+h+4,w,4,'#332B20',{op:.16});}
function flower(x,y,col='#D79AAF'){return L(x,y+10,x,y-2,'#5B7D51',.8)+E(x-3,y+5,3,1.3,'#87A269',{sw:0})+E(x+3,y+2,3,1.3,'#73925A',{sw:0})+[0,1,2,3,4].map(i=>C(x+Math.sin(i*1.256)*2.6,y+Math.cos(i*1.256)*2.6,1.9,col,{sw:.3,stroke:shade(col,-.25)})).join('')+C(x,y,1,'#F5D88B',{sw:0});}
function planter(x,y,w=28){let s=R(x,y,w,10,'#C59A76',{sw:.7})+Pth(`M${x},${y} l3,-4 h${w-6} l3,4Z`,'#E0BD97',{sw:.6})+Rn(x+3,y-3,w-6,3,'#716C4C');for(let i=6;i<w-2;i+=8)s+=flower(x+i,y-7-(i%3)*2);return s;}
function sign(x,y,w,label,sub,col=ink){return R(x,y,w,23,col,{sw:.8,rx:2})+L(x+2,y+2,x+w-2,y+2,shade(col,.45),.6)+T(x+w/2,y+11,label,{size:Math.min(10,w/(label.length*.95)),fill:cream})+T(x+w/2,y+19,sub,{size:4.8,fill:'#E6D6B0',ls:1});}
function door(x,bottom,n=false,w=32){return R(x-w/2-3,bottom-58,w+6,58,wood,{sw:.9})+pane(x-w/2,bottom-55,w,51,n)+L(x,bottom-54,x,bottom-4,ink,1.2)+L(x+w/2-5,bottom-30,x+w/2-5,bottom-22,copper,1.4)+R(x-w/2-7,bottom-2,w+14,3,'#CCC2AA',{sw:.6});}
function wall(w,h,c=cream){let s=Pth(`M${w-6},27 l13,9 V${h+7} H13 L3,${h-3}Z`,'#312619',{sw:0,op:.14})+R(4,28,w-10,h-29,c,{sw:1.2})+Pth(`M${w-6},28 l6,-6 V${h-6} l-6,5Z`,shade(c,-.18),{sw:.8});for(let y=35;y<h-18;y+=9)s+=L(6,y,w-8,y,shade(c,-.13),.45);return s+brick(4,h-21,w-10,20);}
function drain(w,h){return L(6,35,6,h-9,copper,1.6)+L(w-10,35,w-10,h-10,copper,1.6)+Pth(`M6,${h-9} l4,5 M${w-10},${h-10} l-4,5`,'none',{sw:1.6,stroke:copper});}
function awning(x,y,w,c){let s=Pth(`M${x+4},${y} h${w-8} l5,12 h${-w-2}Z`,cream,{sw:.8});for(let i=0;i<w-8;i+=14)s+=Pth(`M${x+5+i},${y+1} h7 l1,10 h-9Z`,c,{sw:0});return s+R(x-1,y+12,w+2,5,c,{sw:.5})+L(x+5,y+18,x+9,y+12,wood,1)+L(x+w-5,y+18,x+w-9,y+12,wood,1);}
function lamp(x,y,n){return L(x,y,x,y+9,ink,1)+Pth(`M${x-4},${y+10} l2,-5 h4 l2,5Z`,sage,{sw:.7})+R(x-3,y+10,6,8,n?'#F7D589':'#EDE0B3',{sw:.6})+L(x-4,y+18,x+4,y+18,ink,1);}
function shop(kind,w,h,d,n){
  const colors={tailor:'#7699AD',workshop:'#718B71',crepe:'#BB8595',dentist:'#72A4AD',florist:'#719A77',cake:'#AD889E',bakery:'#AB795B',market:'#8C9265',atelier:'#74968F'},col=colors[kind];
  const labels={tailor:['いとと はな','TAILOR'],workshop:['こもれび かぐ工房','WOODWORKS'],crepe:['くるり クレープ','CREPE & DEZA'],dentist:['ねりかす はいしゃ','DENTAL CLINIC'],florist:['はなの こみち','FLOWER & GREEN'],cake:['こはる ケーキ','PATISSERIE'],bakery:['こむぎの いえ','BAKERY'],market:['ねりかす マーケット','LOCAL MARKET'],atelier:['かわの アトリエ','RIVERSIDE ATELIER']};
  let s=wall(w,h,kind==='cake'?'#F1E1DF':cream);const dy=h-2,leftW=d-38,rightX=d+26,rightW=w-rightX-14;
  if(kind==='florist'){
    s=Pth(`M${w-5},35 l10,10 V${h+6} H10 L2,${h-2}Z`,'#312619',{sw:0,op:.14})+R(3,24,w-6,h-25,'#BACCB7',{sw:1.1});
    for(let x=9;x<w-20;x+=27)s+=pane(x,30,25,h-48,n);
    for(const y of [60,95])s+=L(4,y,w-4,y,ink,1.3);
    s+=Pth(`M0,26 L${w*.24},-7 H${w*.75} L${w},26Z`,'#C4D9C5',{sw:1.2});
    for(let x=20;x<w;x+=30)s+=L(w*.24+(x/w)*(w*.51),-5,x,25,ink,.9);
    s+=R(0,25,w,5,ink,{sw:.7});
    for(let x=18;x<w-12;x+=29)if(Math.abs(x-d)>34){s+=R(x-7,h-29,14,24,'#BE9577',{sw:.6});for(let j=0;j<4;j++)s+=flower(x-5+j*4,h-37-(j%2)*7,['#DBA0AD','#E3C46E','#B09BBD'][j%3]);}
  }else{
    if(kind==='tailor'){
      s+=Pth(`M-4,33 L${w/2},-35 L${w+4},33Z`,col,{sw:1.3})+Pth(`M0,31 L${w/2},-31 L${w},31`,'none',{sw:2,stroke:'#C1D0D0'});
      for(let x=12;x<w;x+=12){const top=-35+Math.abs(x-w/2)*68/(w/2);s+=L(x,top+5,x,31,shade(col,-.22),.7);}
      s+=R(-4,33,w+8,4,ink,{sw:.8})+C(w/2,7,15,cream,{sw:1})+Pth(`M${w/2-7},12 l7,-6 l7,6 h-14Z`,'none',{sw:1,stroke:ink})+Pth(`M${w/2},6 v-5 q5,-5 5,0`,'none',{sw:.9,stroke:ink});
    }else if(kind==='crepe'){
      s+=Pth(`M-3,33 Q-3,-15 ${w/2},-15 Q${w+3},-15 ${w+3},33Z`,col,{sw:1.3});
      for(let x=10;x<w;x+=16){const top=-15+48*(1-Math.sqrt(Math.min(x,w-x)/(w/2)))**2;s+=L(x,top+1,x,31,shade(col,.32),.7);}
      s+=R(-3,33,w+6,4,shade(col,-.25),{sw:.8})+C(w/2,9,15,cream,{sw:.8})+Pth(`M${w/2-7},4 h14 l-7,17Z`,'#DCB883',{sw:.6})+E(w/2,4,8,4,'#FFF7DC',{sw:.6})+C(w/2-1,0,2.5,'#C97980',{sw:.4});
    }else if(kind==='cake'){
      s+=Pth(`M-3,33 L17,-11 H${w-17} L${w+3},33Z`,col,{sw:1.2})+R(15,-16,w-30,6,shade(col,.23),{sw:.8});
      for(let i=1;i<Math.ceil(w/12);i++){const t=i/Math.ceil(w/12);s+=L(17+t*(w-34),-10,-3+t*(w+6),32,shade(col,-.23),.6);}
      for(const x of [w*.23,w*.77])s+=Pth(`M${x-15},27 V3 Q${x},-21 ${x+15},3 V27Z`,cream,{sw:.9})+pane(x-10,2,20,20,n)+Pth(`M${x-18},5 Q${x},-25 ${x+18},5`,'none',{sw:2.5,stroke:ink});
      s+=R(-3,33,w+6,4,shade(col,-.25),{sw:.8});
    }else if(kind==='dentist'){
      s+=R(-2,19,w+4,16,'#9EBBB1',{sw:1.1})+R(7,-6,w*.59,25,'#E8EBDC',{sw:1})+R(4,-10,w*.59+6,5,'#789C95',{sw:.8})+L(0,22,w,22,'#E8ECDD',1.5);
      for(let x=17;x<w*.59-17;x+=26)s+=pane(x,-1,21,12,n);
      s+=R(w-80,2,62,16,'#D2DBCB',{sw:.7});for(let x=w-76;x<w-20;x+=6)s+=L(x,5,x,15,'#91AAA0',.6);
    }else{
      s+=roof(0,-9,w,42,col,kind==='bakery');
      if(kind==='market'){
        s+=R(w*.25,-20,w*.5,29,cream,{sw:.9})+roof(w*.25-5,-29,w*.5+10,12,col);
        for(let x=w*.25+9;x<w*.75-12;x+=25)s+=pane(x,-13,19,18,n);
      }
    }
    if(kind==='workshop'||kind==='atelier'){
      const cx=w/2;s+=Pth(`M${cx-39},35 V5 L${cx},-23 L${cx+39},5 V35Z`,cream,{sw:1})+Pth(`M${cx-43},8 L${cx},-29 L${cx+43},8`,'none',{sw:4,stroke:col})+L(cx,0,cx,30,wood,2)+L(cx-30,12,cx+30,12,wood,2)+pane(cx-20,16,40,15,n);
    }
    if(kind==='bakery')s+=brick(w-36,-27,16,34)+R(w-39,-30,22,5,'#B4866B',{sw:.8});
    for(const [x,ww]of [[14,leftW],[rightX,rightW]])if(ww>12){s+=pane(x,69,ww,h-94,n);if(kind!=='dentist')s+=Rn(x+2,h-43,ww-4,3,wood)+Rn(x+2,h-25,ww-4,3,wood);}
    if(!['dentist','workshop','atelier'].includes(kind))s+=awning(9,61,w-18,col);
    // 陳列物は別々の形。ケースの中に「何のお店か」が見える。
    for(const [x,ww]of [[14,leftW],[rightX,rightW]])if(ww>15){
      if(kind==='tailor'){for(let i=0;i<Math.floor(ww/24);i++){const xx=x+12+i*24;s+=L(xx,78,xx,81,wood,.7)+Pth(`M${xx},81 l-9,5 h18Z`,'none',{sw:.6})+Pth(`M${xx-5},85 l-6,6 l4,4 l3,-3 l-3,18 h14 l-3,-18 l3,3 l4,-4 l-7,-6Z`,i%2?'#C5B7D3':'#DBA6B3',{sw:.7})+L(xx-3,88,xx+3,88,cream,.7);}}
      if(kind==='bakery')for(let yy=h-49;yy<h-21;yy+=17)for(let xx=x+8;xx<x+ww-5;xx+=16)s+=E(xx,yy,6,3.5,'#DBB06C',{sw:.5})+L(xx-2,yy-2,xx+1,yy+1,'#F9DB9E',.8);
      if(kind==='cake')for(let xx=x+9;xx<x+ww-5;xx+=18)s+=R(xx-6,h-39,12,13,'#E8C6BE',{sw:.6,rx:2})+Rn(xx-6,h-34,12,2,'#9B705A')+E(xx,h-39,6,2,'#FFF1D4',{sw:.4})+C(xx,h-42,2,'#C77478',{sw:.4});
      if(kind==='crepe')for(let xx=x+11;xx<x+ww-7;xx+=23)s+=Pth(`M${xx-7},${h-48} h14 l-7,20Z`,'#E2BD85',{sw:.6})+E(xx,h-48,8,4,'#FFF0D0',{sw:.6})+C(xx-2,h-51,2.5,'#C68283',{sw:.4});
      if(kind==='market')for(let xx=x+9;xx<x+ww-6;xx+=23){s+=R(xx-9,h-42,21,19,'#C09C6C',{sw:.6})+L(xx-8,h-34,xx+11,h-34,'#E2C196',.7);for(let j=0;j<4;j++)s+=C(xx-5+(j%2)*8,h-45-Math.floor(j/2)*5,4,j%2?'#A1B879':'#CF9277',{sw:.4});}
      if(kind==='workshop'){s+=R(x+5,h-41,ww-10,5,wood,{sw:.7})+L(x+10,h-36,x+8,h-22,ink,1.5)+L(x+ww-10,h-36,x+ww-8,h-22,ink,1.5)+Pth(`M${x+9},83 v13 h${ww-18} v-13`,'none',{sw:2,stroke:wood});for(let xx=x+12;xx<x+ww-6;xx+=13)s+=L(xx,84,xx,93,wood,1);}
      if(kind==='atelier'){s+=R(x+6,80,ww-12,h-107,'#F4EBD2',{sw:2,stroke:wood})+Pth(`M${x+9},${h-30} l${ww*.3},-15 l${ww*.2},9 l${ww*.2},-19 v25Z`,'#96B097',{sw:.5});}
      if(kind==='dentist'){s+=Rn(x+1,h-43,ww-2,15,'#DDEAE1',{op:.8});for(let xx=x+6;xx<x+ww-4;xx+=13)s+=L(xx,h-40,xx,h-30,'#95B7B2',.8);}
    }
  }
  s+=door(d,dy,n)+sign(Math.max(8,d-58),35,Math.min(116,w-16),...labels[kind],col)+drain(w,h)+lamp(d-24,68,n);
  if(kind==='dentist')s+=R(w-33,7,17,17,cream,{sw:.7})+Rn(w-26,10,3,11,col)+Rn(w-30,14,11,3,col);
  if(['tailor','crepe','cake','atelier'].includes(kind))s+=planter(13,h-13,Math.min(30,leftW));
  if(kind==='workshop')s+=R(w-42,h-18,25,8,wood,{sw:.7})+L(w-39,h-10,w-39,h-3,ink,1.3)+L(w-20,h-10,w-20,h-3,ink,1.3);
  return s;
}
function home(kind,w,h,d,n){
  const flat=kind==='modern'||kind==='studio',tile=kind==='tile',terrace=kind==='terrace',row=kind==='row';let s=wall(w,h,flat?'#E2E5DA':kind==='home'?'#F2E5CB':cream);
  if(flat){s+=R(0,10,w,23,'#8DA59A',{sw:1.1})+R(8,-22,w*.62,34,'#DDD9C9',{sw:1})+R(6,-26,w*.62+4,5,ink,{sw:.8});for(let x=15;x<w*.6-16;x+=24)s+=pane(x,-15,20,18,n);s+=R(w-67,-1,54,13,'#435F64',{sw:.7});for(let x=w-63;x<w-15;x+=11)s+=L(x,1,x,10,'#A0BEB7',.6);}
  else if(row){s+=roof(0,-15,w/2+4,47,'#8D9681',true)+roof(w/2,-15,w/2,47,'#8D9681',true);for(const x of [w/4,w*.75])s+=Pth(`M${x-24},20 V-10 L${x},-28 L${x+24},-10 V20Z`,cream,{sw:1})+Pth(`M${x-27},-8 L${x},-32 L${x+27},-8`,'none',{sw:3,stroke:ink})+pane(x-15,-6,30,22,n);}
  else{s+=roof(0,-13,w,45,tile?'#6F8585':kind==='home'?'#B18775':sage,tile);if(kind==='home'||terrace)s+=Pth(`M${d-33},35 V3 L${d},-23 L${d+33},3 V35Z`,cream,{sw:1})+Pth(`M${d-37},5 L${d},-29 L${d+37},5`,'none',{sw:3.5,stroke:ink})+pane(d-19,3,38,25,n);}
  const windowY=h>135?53:49;for(const [x,ww]of [[17,d-44],[d+29,w-d-46]])if(ww>12){s+=pane(x,windowY,ww,35,n)+R(x-2,windowY+35,ww+4,4,wood,{sw:.6});for(const side of [x-5,x+ww+1])s+=R(side,windowY,4,34,'#91A795',{sw:.4});s+=Rn(x+3,windowY+2,5,30,'#EBDBBA',{op:.65});}
  s+=door(d,h-2,n)+drain(w,h)+lamp(d-25,h-60,n);
  if(terrace||kind==='courtyard'){s+=R(10,h-26,Math.max(25,d-45),24,'#CCB58C',{sw:.6});for(let x=12;x<d-35;x+=7)s+=L(x,h-24,x,h-4,'#A68E6D',.6);s+=L(11,h-31,d-36,h-31,wood,2);for(let x=13;x<d-35;x+=9)s+=L(x,h-30,x,h-6,wood,1.2);}
  else s+=planter(14,h-12,Math.max(22,Math.min(40,d-45)));
  s+=R(w-35,h-49,23,22,'#D1D5C2',{sw:.6})+C(w-24,h-38,7,'#BDC5B5',{sw:.5});for(let y=h-44;y<h-31;y+=3)s+=L(w-30,y,w-18,y,'#8F9E90',.5);
  s+=R(d+24,h-31,13,9,'#8C9E85',{sw:.6})+L(d+26,h-28,d+35,h-28,cream,.6)+T(d+30,h-19,'〒',{size:5,fill:ink});
  if(kind==='studio')s+=R(w-58,50,44,41,wood,{sw:.8})+pane(w-54,54,36,33,n);
  return s;
}
function clock(x,y){let s=C(x,y,18,'#B99164',{sw:1})+C(x,y,15,'#FFF5D9',{sw:.8});for(let i=0;i<12;i++)s+=L(x+Math.sin(i*Math.PI/6)*12,y-Math.cos(i*Math.PI/6)*12,x+Math.sin(i*Math.PI/6)*13.5,y-Math.cos(i*Math.PI/6)*13.5,ink,.8);return s+L(x,y,x-6,y-6,ink,1.4)+L(x,y,x+8,y-4,ink,1)+C(x,y,1.5,copper,{sw:.4});}
function school(w,h,d,n){let s=wall(w,h,'#E7E3D3')+R(0,7,w,21,sage,{sw:1.2})+L(0,9,w,9,'#B3C4A0',2);
  for(const y of [39,87]){for(let x=16;x<w-29;x+=40)if(Math.abs(x-d)>55){s+=R(x-3,y-3,37,37,'#B8C7BB',{sw:.6})+pane(x,y,31,30,n);if(y===39)s+=Rn(x+2,y+22,8,6,'#D3B780')+Rn(x+14,y+20,12,8,'#A7BFA1');}s+=R(4,y+37,w-10,5,'#BBC6B7',{sw:.6});}
  s+=R(d-54,-4,108,h,'#D7CDB0',{sw:1})+R(d-36,-32,72,70,cream,{sw:1})+roof(d-41,-40,82,13,sage)+clock(d,-6)+sign(d-83,44,166,'ネリカス小学校','NERIKASU ELEMENTARY SCHOOL')+R(d-43,86,86,h-90,ink,{sw:.8})+door(d,h-2,n,64)+Pth(`M${d-64},96 h128 l9,14 h-146Z`,sage,{sw:1})+R(d-73,110,146,5,ink,{sw:.7});
  for(const x of [d-61,d+58])s+=R(x,114,4,h-118,wood,{sw:.7})+L(x,131,x+(x<d?12:-12),115,wood,1.5);
  for(const x of [18,w-115]){s+=R(x,137,94,36,'#D5C4A0',{sw:.8})+R(x+4,141,86,28,'#75927B',{sw:.5});for(let i=0;i<4;i++)s+=R(x+9+i*19,145,14,19,'#F3E6C6',{sw:.4})+L(x+11+i*19,151,x+20+i*19,151,'#A48E71',.6);}
  for(const x of [150,w-192])s+=planter(x,h-15,42);
  s+=L(w-42,-18,w-42,19,ink,1.3)+Pth(`M${w-42},-18 h27 q-5,5 0,13 h-27Z`,cream,{sw:.6})+C(w-29,-12,3.5,'#BF867D',{sw:0})+drain(w,h);return s;
}
function nursery(w,h,d,n){let s=wall(w,h,'#F0E2CA');
  for(const [x,ww,c]of [[0,w*.32,'#789B80'],[w*.32,w*.35,'#BE967D'],[w*.67,w*.33,'#8DA3A3']]){s+=roof(x,-8,ww,43,c)+Pth(`M${x+ww/2-28},18 V-5 L${x+ww/2},-25 L${x+ww/2+28},-5 V18Z`,cream,{sw:1})+pane(x+ww/2-16,-5,32,19,n);}
  for(let x=18;x<w-36;x+=48)if(Math.abs(x-d)>65){s+=pane(x,67,37,59,n)+R(x-1,128,39,6,wood,{sw:.6});for(let i=0;i<3;i++)s+=C(x+8+i*10,112,3,['#DEB2AA','#D9C17A','#AAC3A0'][i],{sw:.4});}
  s+=sign(d-85,37,170,'ネリカス保育園','LITTLE LEAVES NURSERY',sage)+door(d,h-2,n,60)+awning(d-65,93,130,'#C5A777');
  for(const x of [d-57,d+54])s+=R(x,112,4,h-117,wood,{sw:.7});
  // 左に絵本と靴箱、右に日陰のデッキ。通路は中央にあける。
  s+=R(20,142,91,38,'#C4AB83',{sw:.8});for(let j=0;j<2;j++)for(let i=0;i<5;i++){s+=R(24+i*17,146+j*15,14,12,'#F0DFC0',{sw:.4});s+=E(30+i*17,154+j*15,4,2,['#AEBA98','#D4A8A0','#A1B7C2'][i%3],{sw:.4});}
  s+=R(w-157,144,134,41,'#C9B58D',{sw:.8});for(let x=w-154;x<w-25;x+=9)s+=L(x,146,x,182,'#A68B6C',.6);
  s+=Pth(`M${w-139},172 v-19 q0,-17 18,-17 q18,0 18,17 v19Z`,'#C4D0A4',{sw:1})+Pth(`M${w-129},172 v-16 q0,-9 8,-9 q8,0 8,9 v16Z`,cream,{sw:.8});
  for(const x of [w-87,w-61])s+=R(x,164,19,15,'#D9B78B',{sw:.7})+R(x-2,160,23,5,'#B99073',{sw:.6});
  s+=planter(137,h-14,44)+planter(w-216,h-14,37)+drain(w,h);return s;
}
function gazebo(w,h){let s=Rn(0,h-32,w,30,'#C9BB98')+Pth(`M-4,24 L${w/2},-8 L${w+4},24Z`,sage,{sw:1.2});for(const x of [5,w-8])s+=R(x,25,4,h-29,wood,{sw:.9})+L(x,47,x+(x<20?12:-12),27,wood,1.6);for(let y=h-25;y<h-2;y+=6)s+=L(2,y,w-2,y,'#A89472',.7);return s+R(10,h-54,w-20,6,wood,{sw:.8})+R(10,h-76,w-20,15,wood,{sw:.8})+L(15,h-47,15,h-32,ink,1.5)+L(w-15,h-47,w-15,h-32,ink,1.5)+T(w/2,47,'ひとやすみ',{size:6,fill:ink});}
// ころころ フルーツ（パズルの おてつだい）: まるい 玉が つみかさなる ガラスの 箱を 店さきに。くだもの と わんこ・がちゃん・ごじ の かお。
function koroFace(x,y,r){return C(x-r*.34,y+r*.02,r*.12,ink,{sw:0})+C(x+r*.34,y+r*.02,r*.12,ink,{sw:0})+Pth(`M${x-r*.2},${y+r*.3} q${r*.2},${r*.2} ${r*.4},0`,'none',{sw:Math.max(.45,r*.09)})+E(x-r*.6,y+r*.28,r*.17,r*.1,'#F29FAF',{sw:0,op:.8})+E(x+r*.6,y+r*.28,r*.17,r*.1,'#F29FAF',{sw:0,op:.8});}
function koroBall(kind,x,y,r){
  const shine=E(x-r*.38,y-r*.42,r*.3,r*.17,'#FFFFFF',{sw:0,op:.55}),sw=Math.max(.55,r*.09);
  if(kind==='wanko')return E(x-r*.92,y-r*.3,r*.38,r*.5,ink,{sw}) +E(x+r*.92,y-r*.3,r*.38,r*.5,ink,{sw})+C(x,y,r,'#FFFFFF',{sw})+C(x-r*.33,y+r*.05,r*.11,ink,{sw:0})+C(x+r*.33,y+r*.05,r*.11,ink,{sw:0})+E(x,y+r*.25,r*.13,r*.1,ink,{sw:0})+Pth(`M${x},${y+r*.3} l-${r*.16},${r*.2} M${x},${y+r*.3} l${r*.16},${r*.2}`,'none',{sw:sw*.7});
  if(kind==='gachan')return C(x,y,r,'#FADA78',{sw})+C(x-r*.36,y+r*.08,r*.12,ink,{sw:0})+C(x+r*.36,y+r*.08,r*.12,ink,{sw:0})+Pth(`M${x-r*.22},${y+r*.32} q${r*.22},-${r*.16} ${r*.44},0 q-${r*.06},${r*.26} -${r*.22},${r*.26} q-${r*.16},0 -${r*.22},-${r*.26}Z`,'#F29A1F',{sw:sw*.8});
  if(kind==='goji'){let t='';for(let i=0;i<5;i++)t+=`${i?'L':'M'}${x-r*.45+i*r*.225},${y+(i%2?-r*.02:r*.14)} `;return C(x-r*.72,y-r*.7,r*.3,'#8C8686',{sw})+C(x-r*.72,y-r*.7,r*.14,'#D6C7A1',{sw:sw*.6})+C(x+r*.72,y-r*.7,r*.3,'#8C8686',{sw})+C(x+r*.72,y-r*.7,r*.14,'#D6C7A1',{sw:sw*.6})+C(x,y,r,'#8C8686',{sw})+E(x,y+r*.08,r*.55,r*.3,'#FFFFFF',{sw:sw*.8})+Pth(t,'none',{sw:sw*.9,stroke:'#D8434B'});}
  const fruit={cherry:'#E8545E',strawberry:'#F0606B',mikan:'#F7A43A',apple:'#E9525A',pear:'#EBD27C',peach:'#F8B4BF',melon:'#A7D98F',suika:'#6FBF57'}[kind];
  let s=C(x,y,r,fruit,{sw});
  if(kind==='melon')s+=Pth(`M${x-r*.8},${y-r*.1} q${r*.4},-${r*.3} ${r*.8},0 t${r*.8},0 M${x-r*.2},${y-r*.95} q-${r*.2},${r*.5} 0,${r*.95} t0,${r*.9}`,'none',{sw:sw*.7,stroke:'#E6F4D2'});
  if(kind==='suika')for(const dx of [-.5,0,.5])s+=Pth(`M${x+dx*r},${y-r*.92} l-${r*.12},${r*.3} l${r*.14},${r*.3} l-${r*.14},${r*.3} l${r*.12},${r*.3}`,'none',{sw:sw*1.1,stroke:'#2F7A3B'});
  if(kind==='strawberry')for(const [dx,dy]of [[-.4,-.1],[.4,-.1],[0,.45],[-.2,.25],[.25,.2]])s+=C(x+dx*r,y+dy*r,r*.07,'#FCE58C',{sw:0});
  if(['cherry','apple','pear','mikan','strawberry'].includes(kind))s+=L(x,y-r,x+r*.25,y-r*1.4,kind==='mikan'||kind==='strawberry'?'#5E9A4E':'#7A5634',sw*1.3)+E(x+r*.5,y-r*1.2,r*.32,r*.14,'#7CC46E',{sw:sw*.6});
  if(kind==='peach')s+=E(x-r*.25,y-r*.95,r*.35,r*.14,'#86C874',{sw:sw*.6})+Pth(`M${x},${y-r*.85} q${r*.3},${r*.8} 0,${r*1.7}`,'none',{sw:sw*.8,stroke:'#E488A0'});
  return s+shine+koroFace(x,y+r*.05,r);
}
function korokoro(w,h,d,n){
  const col='#C47B52',green='#7FA873';let s=wall(w,h,'#F6E7D2');
  // くだもの いろの マンサード屋根と、棟に すわる 3人の かおの 玉・まるい りんごの 看板
  s+=Pth(`M-3,33 L15,-6 H${w-15} L${w+3},33Z`,green,{sw:1.2})+R(13,-11,w-26,6,shade(green,.25),{sw:.8});
  for(let i=1;i<Math.ceil(w/12);i++){const t=i/Math.ceil(w/12);s+=L(15+t*(w-30),-5,-3+t*(w+6),32,shade(green,-.22),.6)+L(16+t*(w-30),-5,-2+t*(w+6),32,shade(green,.25),.45);}
  s+=R(-3,33,w+6,4,shade(green,-.28),{sw:.8});
  s+=C(46,-22,17,'#FFF4DE',{sw:1})+C(46,-22,14,'none',{sw:.6,stroke:'#E3C9A0'})+koroBall('apple',46,-20,9.5);
  s+=koroBall('wanko',112,-19,8)+koroBall('gachan',136,-19,8)+koroBall('goji',160,-19,8);
  // かんばん・しまの 日よけ
  s+=sign(10,35,w-20,'ころころ フルーツ','FRUIT PUZZLE',col)+awning(9,61,w-18,'#E9A25A');
  // ひだりの ショーウインドウ: きの わくの ガラス箱に 玉が つみかさなる（パズルの 見本）
  const bx=16,by=83,bw=d-30-bx,bh=h-26-by;
  s+=R(bx-3,by-4,bw+6,bh+7,'#B98457',{sw:.9})+R(bx,by,bw,bh,n?'#F6DDA2':'#FFF6E3',{sw:.7});
  for(let x=bx+6;x<bx+bw;x+=12)s+=Rn(x,by+1,6,bh-2,n?'#F2D08E':'#FBEFD8');
  const cells=[['melon',bx+12,by+bh-11,10.5],['goji',bx+32,by+bh-9,8.5],['apple',bx+bw-11,by+bh-10,9.5],['wanko',bx+10,by+bh-29,6.5],['gachan',bx+25,by+bh-25.5,7.5],['mikan',bx+bw-24,by+bh-26,8],['cherry',bx+bw-9,by+bh-28,5],['strawberry',bx+18,by+bh-41,5.5],['peach',bx+bw-16,by+bh-42,6.5]];
  for(const [k,x,y,r]of cells)s+=koroBall(k,x,y,r);
  s+=L(bx+1,by+6,bx+bw-1,by+6,'#E8453C',.7,{dash:'2 2',op:.8})+Pth(`M${bx+4},${by+bh-2} L${bx+bw*.34},${by+2} h${bw*.12} L${bx+bw*.16},${by+bh-2}Z`,'#FFFFFF',{sw:0,op:n?.18:.35});
  s+=R(bx-5,by+bh+2,bw+10,3,'#CCC2AA',{sw:.6});
  // みぎの まどと、くだものの 木箱
  const rx=d+26,rw=w-rx-14;s+=pane(rx,74,rw,34,n)+R(rx-2,108,rw+4,4,wood,{sw:.6});
  s+=R(rx-2,h-37,rw+4,15,'#C59A6A',{sw:.7})+L(rx-1,h-30,rx+rw+1,h-30,'#E2C196',.7)+L(rx+rw/2,h-37,rx+rw/2,h-22,'#A57D52',.7);
  for(const [k,x,r]of [['mikan',rx+6,4.6],['apple',rx+15,4.8],['mikan',rx+rw-14,4.6],['pear',rx+rw-5,4.6]])s+=koroBall(k,x,h-41.5,r);
  s+=door(d,h-2,n)+drain(w,h)+lamp(d-24,68,n)+planter(12,h-12,Math.min(26,bw-4));
  return s;
}
// あたまの たいそう（のうトレの おてつだい・UI-64）: あおい マンサード屋根・棟の ふくろうの 丸看板・ひらめきの でんきゅう と ほし・
// ひだりの まどに こくばん（1+2=3）・みぎの まどに まちがい さがしの 2まいの え・しまの 日よけ
function owlFace(x,y,r){return E(x,y+r*.08,r,r*.92,'#C7A27A',{sw:Math.max(.6,r*.09)})+Pth(`M${x-r*.82},${y-r*.38} L${x-r*.7},${y-r*1.08} L${x-r*.3},${y-r*.62}Z M${x+r*.82},${y-r*.38} L${x+r*.7},${y-r*1.08} L${x+r*.3},${y-r*.62}Z`,'#C7A27A',{sw:Math.max(.5,r*.08)})+C(x-r*.4,y-r*.05,r*.36,'#FFFFFF',{sw:Math.max(.5,r*.07)})+C(x+r*.4,y-r*.05,r*.36,'#FFFFFF',{sw:Math.max(.5,r*.07)})+C(x-r*.4,y,r*.15,ink,{sw:0})+C(x+r*.4,y,r*.15,ink,{sw:0})+Pth(`M${x-r*.14},${y+r*.3} h${r*.28} l-${r*.14},${r*.24}Z`,'#F2A93B',{sw:Math.max(.4,r*.05)})+E(x,y+r*.66,r*.42,r*.2,'#F3E3C6',{sw:0});}
function brain(w,h,d,n){
  const col='#4E73B8',roofc='#7E9CD8';let s=wall(w,h,'#EEF2F8');
  s+=Pth(`M-3,33 L15,-6 H${w-15} L${w+3},33Z`,roofc,{sw:1.2})+R(13,-11,w-26,6,shade(roofc,.25),{sw:.8});
  for(let i=1;i<Math.ceil(w/12);i++){const t=i/Math.ceil(w/12);s+=L(15+t*(w-30),-5,-3+t*(w+6),32,shade(roofc,-.22),.6)+L(16+t*(w-30),-5,-2+t*(w+6),32,shade(roofc,.25),.45);}
  s+=R(-3,33,w+6,4,shade(roofc,-.28),{sw:.8});
  // 棟の ふくろうの 丸看板・ひらめきの でんきゅう・ほし
  s+=C(w/2,-22,17,'#FFF4DE',{sw:1})+C(w/2,-22,14,'none',{sw:.6,stroke:'#C9D6EE'})+owlFace(w/2,-22,10.5);
  const bx0=40,by0=-15;s+=C(bx0,by0-3,6.5,n?'#FFE48A':'#FFF3B0',{sw:.9})+R(bx0-3,by0+3,6,4,'#A9B4C6',{sw:.6})+L(bx0-2,by0+5,bx0+2,by0+5,'#7E8899',.5)+L(bx0-2.5,by0-4,bx0,by0-1,'#E2B53E',.7)+L(bx0,by0-1,bx0+2.5,by0-4,'#E2B53E',.7);
  for(const a of [0,1,2,3,4,5,6,7]){const u=a/8*Math.PI*2;s+=L(bx0+Math.cos(u)*8.5,by0-3+Math.sin(u)*8.5,bx0+Math.cos(u)*10.5,by0-3+Math.sin(u)*10.5,'#F2C14E',.7);}
  const sx=w-40,sy=-17;let star='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?3:7;star+=`${i?'L':'M'}${(sx+Math.cos(a)*r).toFixed(1)},${(sy+Math.sin(a)*r).toFixed(1)} `;}s+=Pth(star+'Z','#F7D56A',{sw:.8});
  // かんばん・しまの 日よけ
  s+=sign(10,35,w-20,'あたまの たいそう','BRAIN GYM',col)+awning(9,61,w-18,'#8FB3E8');
  // ひだりの まど: きの わくの こくばん
  const bx=16,by=80,bw=d-30-bx,bh=h-26-by;
  s+=R(bx-3,by-4,bw+6,bh+7,'#B98457',{sw:.9})+R(bx,by,bw,bh,n?'#4C7A64':'#3E6B57',{sw:.7});
  s+=T(bx+bw*.38,by+bh*.36,'1+2=3',{size:8.5,fill:'#FFFFFF'})+C(bx+bw*.8,by+bh*.28,4,'none',{sw:.8,stroke:'#FFE48A'})+Pth(`M${bx+6},${by+bh*.68} q${bw*.2},-6 ${bw*.4},0 t${bw*.4},0`,'none',{sw:.8,stroke:'#BFE3EE'})+L(bx+bw*.78,by+bh*.62,bx+bw*.9,by+bh*.62,'#F7B9C9',.8)+L(bx+bw*.84,by+bh*.55,bx+bw*.84,by+bh*.69,'#F7B9C9',.8);
  s+=R(bx-5,by+bh+2,bw+10,3,'#CCC2AA',{sw:.6})+Rn(bx+4,by+bh-1,6,2,'#FFFFFF')+Rn(bx+13,by+bh-1,5,2,'#F7D56A');
  // みぎの まど: まちがい さがしの 2まいの え（ちがう ところに あかい まる）
  const rx=d+26,rw=w-rx-14;s+=pane(rx,74,rw,34,n)+R(rx-2,108,rw+4,4,wood,{sw:.6});
  const fw=(rw-10)/2;for(let i=0;i<2;i++){const fx=rx+3+i*(fw+4);s+=R(fx,h-44,fw,20,'#FFFDF6',{sw:.7})+Rn(fx+1,h-34,fw-2,9,'#C5E6A6')+C(fx+fw*.32,h-36,2.6,'#EF5350',{sw:.5})+C(fx+fw*.72,h-31,2.2,i?'#64B5F6':'#FFD54F',{sw:.5});}
  s+=C(rx+3+fw+4+fw*.72,h-31,4.4,'none',{sw:.9,stroke:'#E53935'});
  s+=door(d,h-2,n)+drain(w,h)+lamp(d-24,68,n)+planter(12,h-12,Math.min(26,bw-4));
  return s;
}
// パズル こうぼう（パズルの おてつだい・UI-65）: のこぎり屋根の こうぼう（あかり とりの まど）・棟の ジグソーの 丸看板・
// ひだりの まどに スライド パズル（1まい あき）と かたち はめ・みぎの まどに おえかき ロジックの ハート・いりぐちの よこに いろの キューブ
function jigsawPiece(x,y,s,col){return Pth(`M${x-s},${y-s} H${x-s*.28} A${s*.32},${s*.32} 0 1 1 ${x+s*.28},${y-s} H${x+s} V${y-s*.28} A${s*.32},${s*.32} 0 1 1 ${x+s},${y+s*.28} V${y+s} H${x-s} Z`,col,{sw:Math.max(.6,s*.1)});}
function kobo(w,h,d,n){
  const col='#B9772F',roofc='#D9934A';let s=wall(w,h,'#F6EBD9');
  // のこぎり屋根 3つ（たての がわに あかり とりの まど）
  const tw=(w+6)/3;
  for(let i=0;i<3;i++){const x0=-3+i*tw,x1=x0+tw;s+=Pth(`M${x0},33 V-4 L${x1},26 V33Z`,roofc,{sw:1.2})+R(x0+2,-1,9,26,n?'#F7D589':'#BFE0EA',{sw:.7})+L(x0+6.5,-1,x0+6.5,25,cream,.7);for(let j=1;j<5;j++){const t=j/5;s+=L(x0+11+t*(tw-14),-4+t*30+2,x0+11+t*(tw-14),33,shade(roofc,-.18),.5);}}
  s+=R(-3,31,w+6,4,shade(roofc,-.3),{sw:.8});
  // 棟の ジグソーの 丸看板
  s+=C(w/2,-22,17,'#FFF4DE',{sw:1})+C(w/2,-22,14,'none',{sw:.6,stroke:'#EBCB93'})+jigsawPiece(w/2,-22,8.5,'#F2C14E')+C(w/2-3,-21,1.3,'#31594E',{sw:0})+C(w/2+3,-21,1.3,'#31594E',{sw:0})+Pth(`M${w/2-2.6},-17.6 q2.6,2.2 5.2,0`,'none',{sw:.8});
  // かんばん・しまの 日よけ
  s+=sign(10,35,w-20,'パズル こうぼう','PUZZLE WORKSHOP',col)+awning(9,61,w-18,'#E9B872');
  // ひだりの まど: スライド パズル（3×3・1まい あき）と かたち はめの いた
  const bx=16,by=80,bw=d-30-bx,bh=h-26-by,TILE=['#F2C14E','#E57373','#64B5F6','#81C784','#BA68C8','#FFB74D','#4DB6AC','#F48FB1'];
  s+=R(bx-3,by-4,bw+6,bh+7,'#B98457',{sw:.9})+R(bx,by,bw,bh,n?'#F6DDA2':'#FFF6E3',{sw:.7});
  const fs=Math.min(bh-8,bw*.52),fx=bx+5,fy=by+(bh-fs)/2,ts=(fs-4)/3;
  s+=R(fx,fy,fs,fs,'#8C6848',{sw:.8});
  for(let i=0;i<8;i++)s+=R(fx+2+(i%3)*ts+.4,fy+2+Math.floor(i/3)*ts+.4,ts-.8,ts-.8,TILE[i],{sw:.5})+T(fx+2+(i%3)*ts+ts/2,fy+2+Math.floor(i/3)*ts+ts*.68,String(i+1),{size:ts*.5,fill:'#FFFFFF'});
  const sx0=fx+fs+5,sw0=bx+bw-sx0-4;
  s+=R(sx0,by+bh*.18,sw0,bh*.64,'#E8C38E',{sw:.7})+C(sx0+sw0*.3,by+bh*.36,3.4,'#6D5D4B',{sw:.4})+R(sx0+sw0*.58,by+bh*.3,6.4,6.4,'#6D5D4B',{sw:.4})+Pth(`M${sx0+sw0*.32},${by+bh*.56} l4,6.8 h-8Z`,'#6D5D4B',{sw:.4})+C(sx0+sw0*.72,by+bh*.66,3.2,'#EF5350',{sw:.5});
  s+=R(bx-5,by+bh+2,bw+10,3,'#CCC2AA',{sw:.6});
  // みぎの まど: おえかき ロジック（5×5 の ハート と すうじ）
  const rx=d+26,rw=w-rx-14;s+=pane(rx,74,rw,34,n)+R(rx-2,108,rw+4,4,wood,{sw:.6});
  const heart=['.#.#.','#####','#####','.###.','..#..'],gs=Math.min(5.4,(rw-26)/5),gx=rx+rw/2-gs*2.5+5,gy=h-50;
  s+=R(gx-12,gy-9,gs*5+15,gs*5+12,'#FFFDF6',{sw:.7});
  heart.forEach((row,y)=>[...row].forEach((v,x)=>{s+=R(gx+x*gs,gy+y*gs,gs,gs,v==='#'?'#EF5350':'#FFFFFF',{sw:.35,stroke:'#C9C2B6'});}));
  s+=T(gx-6,gy+gs*1.7,'5',{size:4.6,fill:'#31594E'})+T(gx+gs*1.5,gy-3,'2',{size:4.6,fill:'#31594E'})+T(gx+gs*3.5,gy-3,'4',{size:4.6,fill:'#31594E'});
  // いりぐちの よこの いろの キューブ（つみかさね）
  for(const [x,y,c] of [[d-34,h-14,'#EF5350'],[d-24,h-14,'#64B5F6'],[d-29,h-23,'#F2C14E']])s+=R(x-4.5,y-4.5,9,9,c,{sw:.7})+L(x-4.5,y-1.5,x+4.5,y-1.5,shade(c,-.25),.4)+L(x-1.5,y-4.5,x-1.5,y+4.5,shade(c,-.25),.4);
  s+=door(d,h-2,n)+drain(w,h)+lamp(d+24,68,n)+planter(w-44,h-12,28);
  return s;
}
// ---- 2026-09-29 配置イメージの 新しい 建物（コンビニ 2つ・ファミレス・ガソリンスタンド・アパート・郵便局・お届けセンター・サロン・中華料理屋・家 3つ） ----
// ガラスの 店さき: たなの しなもの（夜は 店内が あかるい）
function glassFront(x0,x1,y0,y1,n,goods=['#E27A6E','#F2C45E','#8FC39A','#7FA8D8','#F3F0E4']){
  let s=R(x0,y0,x1-x0,y1-y0,n?'#FFF1CE':'#D5E8EF',{sw:.9,stroke:ink});
  const rows=Math.max(2,Math.floor((y1-y0-6)/13));
  for(let r=0;r<rows;r++){const y=y0+6+r*((y1-y0-8)/rows);s+=L(x0+2,y+9,x1-2,y+9,n?'#E0C58E':'#A9C3C9',.8);for(let x=x0+4,i=0;x<x1-6;x+=7,i++)s+=Rn(x,y+(i%3),5,8-(i%3),goods[(i+r)%goods.length],{op:n?1:.85});}
  s+=Pth(`M${x0+3},${y1-3} L${x0+(x1-x0)*.42},${y0+3} h${(x1-x0)*.14} L${x0+(x1-x0)*.17},${y1-3}Z`,'#FFFFFF',{sw:0,op:n?.12:.4});
  for(let x=x0+(x1-x0)/3;x<x1-4;x+=(x1-x0)/3)s+=L(x,y0,x,y1,ink,.9);
  return s;
}
// ガラスの 自動ドア
function autoDoor(x,bottom,n,w=40){return R(x-w/2-4,bottom-60,w+8,60,'#B7C2C7',{sw:.9})+R(x-w/2,bottom-56,w/2,52,n?'#FFF1CE':'#CFE3EA',{sw:.8})+R(x,bottom-56,w/2,52,n?'#FFF1CE':'#CFE3EA',{sw:.8})+L(x-w/4,bottom-40,x-w/4,bottom-26,'#8F9BA1',1.6)+L(x+w/4,bottom-40,x+w/4,bottom-26,'#8F9BA1',1.6)+Pth(`M${x-w/2+3},${bottom-8} l${w*.2},-40`,'none',{sw:2,stroke:'#FFFFFF',op:.5})+R(x-w/2-8,bottom-2,w+16,3,'#CCC2AA',{sw:.6});}
function flatTop(w,c,edge){return R(-2,12,w+4,10,edge,{sw:1.1})+Rn(0,22,w,4,'#332B20',{op:.15})+R(0,20,w,8,c,{sw:.9});}
function conbini(kind,w,h,d,n){
  const lawson=kind==='lawson';let s=wall(w,h,'#F6F7F3')+flatTop(w,'#E9ECE8','#C9CFCC');
  s+=R(w-78,-2,46,15,'#C7CDD0',{sw:.8})+C(w-66,5,5,'#9CA6AB',{sw:.6})+C(w-44,5,5,'#9CA6AB',{sw:.6});
  if(lawson){
    const blue='#3F7FC4';
    s+=R(-3,24,w+6,26,blue,{sw:1.2})+Rn(-3,44,w+6,3,'#FFFFFF')+Rn(-3,28,w+6,2,'#8FC0EA');
    // ミルクの びんの マーク
    const bx=w/2-66;s+=Pth(`M${bx},${47} v-13 q0,-4 3,-6 v-5 h8 v5 q3,2 3,6 v13Z`,'#FFFFFF',{sw:.9})+Rn(bx+3,26,8,3,'#8FC0EA')+C(bx+7,40,2.2,blue,{sw:0});
    s+=T(w/2+10,42,'ローリソン',{size:16,fill:'#FFFFFF'});
  }else{
    for(const [y,c]of [[24,'#F08A24'],[31,'#2F9E5A'],[38,'#D83C3C']])s+=R(-3,y,w+6,7,c,{sw:.7});
    s+=R(w/2-50,22,100,26,'#FFFFFF',{sw:1,rx:3})+T(w/2,40,'せぶんぶん',{size:15,fill:'#2F9E5A',stroke:'#FFFFFF',sw:.5})+C(w/2-40,35,6,'#F08A24',{sw:.6})+Pth(`M${w/2-43},35 l3,3 5,-6`,'none',{sw:1.3,stroke:'#FFFFFF'});
  }
  s+=R(-3,50,w+6,6,'#E3E8EA',{sw:.8});
  const gy=60,gb=h-24;
  s+=glassFront(12,d-26,gy,gb,n,lawson?['#E27A6E','#F2C45E','#7FA8D8','#F7F2E6','#9AC7A2']:['#F08A24','#2F9E5A','#D83C3C','#F4E3B8','#8DB6D6']);
  s+=glassFront(d+26,w-14,gy,gb,n,lawson?['#7FA8D8','#E9B6C8','#F2C45E','#FFFFFF']:['#F4C66E','#E27A6E','#2F9E5A','#F8F1DF']);
  s+=autoDoor(d,h-2,n,40);
  // ポスター（あたらしい しなもの）
  s+=R(20,gy+4,22,28,'#FFFFFF',{sw:.6})+C(31,gy+15,6,lawson?'#F2C45E':'#F08A24',{sw:.5})+Rn(24,gy+24,14,3,lawson?'#3F7FC4':'#D83C3C');
  s+=R(w-44,gy+4,24,16,lawson?'#3F7FC4':'#2F9E5A',{sw:.6})+T(w-32,gy+15,'24',{size:8,fill:'#FFFFFF'});
  return s;
}
function bikkupo(w,h,d,n){
  const red='#B5433A',cream2='#F6E8D2';let s=wall(w,h,cream2);
  s+=roof(0,-14,w,48,red,true);
  // やねの うえの かんばん（びっくぽ と マスコットの ぽっくん）
  s+=R(w/2-70,-44,140,30,'#F7D35C',{sw:1.2,rx:6})+R(w/2-66,-40,132,22,'#D9453B',{sw:.8,rx:4})+T(w/2+12,-23,'びっくぽ',{size:15,fill:'#FFFFFF'});
  const mx=w/2-48,my=-30;s+=C(mx,my,11,'#E9A969',{sw:1})+Pth(`M${mx-10},${my-6} q0,-12 10,-12 q10,0 10,12Z`,'#FFFFFF',{sw:.8})+C(mx-4,my,1.6,ink,{sw:0})+C(mx+4,my,1.6,ink,{sw:0})+Pth(`M${mx-4},${my+4} q4,4 8,0`,'none',{sw:.9})+E(mx-7,my+3,2.2,1.2,'#F29FAF',{sw:0})+E(mx+7,my+3,2.2,1.2,'#F29FAF',{sw:0});
  s+=L(w/2-54,-14,w/2-54,-4,ink,1.6)+L(w/2+54,-14,w/2+54,-4,ink,1.6);
  // おおきな まど: 赤い ボックスせきと テーブルの あかり
  const wy=58,wb=h-30;
  for(const [x0,x1]of [[14,d-40],[d+40,w-16]]){
    s+=R(x0,wy,x1-x0,wb-wy,n?'#FBE3B0':'#CFE3E6',{sw:1});
    for(let x=x0+6;x<x1-20;x+=30){s+=Rn(x,wb-22,24,18,'#C8483F',{op:.95})+Rn(x+2,wb-28,20,6,'#E2665B')+Rn(x+6,wb-30,12,3,'#F4E6CC')+C(x+12,wy+10,3,n?'#FFE6A0':'#F5E0A8',{sw:.4})+L(x+12,wy,x+12,wy+7,ink,.6);}
    for(let x=x0+(x1-x0)/3;x<x1-4;x+=(x1-x0)/3)s+=L(x,wy,x,wb,wood,1.6);
    s+=Pth(`M${x0+3},${wb-3} L${x0+(x1-x0)*.4},${wy+3} h${(x1-x0)*.12} L${x0+(x1-x0)*.16},${wb-3}Z`,'#FFFFFF',{sw:0,op:n?.12:.35})+R(x0-3,wb,x1-x0+6,5,wood,{sw:.7});
  }
  // 入口の ひさし（小さな 切妻）と ガラスの ドア・メニュー
  s+=Pth(`M${d-38},58 L${d},30 L${d+38},58Z`,red,{sw:1.1})+R(d-34,58,68,5,shade(red,-.3),{sw:.7})+R(d-30,63,60,h-65,cream,{sw:.9});
  s+=autoDoor(d,h-2,n,34)+R(d-22,70,44,10,'#FFFFFF',{sw:.6,rx:2})+T(d,78,'ようこそ',{size:6,fill:red});
  s+=planter(16,h-12,34)+planter(w-50,h-12,34)+lamp(d-44,66,n)+lamp(d+44,66,n);
  return s;
}
function gasStation(w,h,d,n){
  const green='#2F8F5B',yellow='#F2C94C';
  // キャノピーの したの コンクリート（あぶらの しみ）と 給油機の しま
  let s=Pth(`M${w-6},30 l12,8 V${h+6} H12 L2,${h-2}Z`,'#312619',{sw:0,op:.12})+R(2,30,194,h-31,'#E6E3DA',{sw:1});
  for(const [x,y]of [[40,h-18],[118,h-26],[158,h-14]])s+=E(x,y,9,3,'#CFC9BA',{sw:0,op:.8});
  for(const x of [46,126]){s+=R(x-8,h-44,42,14,'#C9C3B4',{sw:.8})+Rn(x-6,h-32,38,3,yellow);
    s+=R(x,h-96,26,52,'#F4F2EA',{sw:1})+R(x+3,h-91,20,12,n?'#BFE7C9':'#9FCFB0',{sw:.6})+T(x+13,h-83,'160',{size:6,fill:'#2E3B36'})+R(x+3,h-74,9,16,yellow,{sw:.5})+R(x+14,h-74,9,16,'#D9534F',{sw:.5})+Pth(`M${x+26},${h-80} q12,4 8,26`,'none',{sw:1.8,stroke:ink})+R(x+30,h-58,7,9,'#2E3B36',{sw:.5});}
  // きゅうゆ ちゅうの くるま（ひだりの 給油機）
  const cx=4,cy=h-30;s+=R(cx,cy-24,38,22,'#D8433C',{sw:1,rx:6})+R(cx+6,cy-34,26,12,'#D8433C',{sw:1,rx:4})+R(cx+9,cy-31,20,8,n?'#FFE6A6':'#CFE6EF',{sw:.6,rx:2})+C(cx+9,cy-2,5,'#3A3F44',{sw:.8})+C(cx+30,cy-2,5,'#3A3F44',{sw:.8})+Rn(cx+34,cy-18,4,4,'#FFF3C4');
  // おおきな キャノピー（屋根）と 柱・かげ
  s+=R(-2,-14,202,34,'#F7F7F2',{sw:1.3})+Rn(-2,4,202,9,green)+Rn(-2,13,202,3,yellow)+T(99,0,'ネリカス オイル',{size:12,fill:green})+Rn(0,20,198,8,'#332B20',{op:.14});
  for(const x of [14,100,186])s+=R(x-4,20,8,h-22,'#D8D6CD',{sw:.9});
  if(n){s+=Rn(4,22,190,6,'#FFF5CC',{op:.85});for(const x of [46,126])s+=C(x+13,h-60,28,'#FFF5CC',{sw:0,op:.22});}
  // ねだんの かんばん（いちばん ひだりの 柱）
  s+=R(-6,26,32,30,'#2E3B36',{sw:.8})+T(10,36,'レギュラー',{size:4.2,fill:'#FFFFFF'})+T(10,50,'160',{size:10,fill:n?'#FFD66B':yellow});
  // じむしょ（右）: ガラスの 店と 入口・せんしゃの おしらせ
  const ox=196;s+=R(ox,18,w-ox-6,h-18,'#F4F1E8',{sw:1.1})+R(ox-2,12,w-ox-2,10,green,{sw:.9})+Rn(ox,22,w-ox-6,3,yellow);
  s+=glassFront(ox+6,d-20,40,h-24,n,['#F2C94C','#2F8F5B','#D9534F','#F4EFE0'])+autoDoor(d,h-2,n,30)+R(d+20,40,w-d-32,30,'#FFFFFF',{sw:.6})+T(d+20+(w-d-32)/2,52,'せんしゃ',{size:6,fill:green})+Pth(`M${d+28},62 q6,-6 12,0 q6,-6 12,0`,'none',{sw:1.2,stroke:'#7FB6D6'});
  return s;
}
function apartment(w,h,d,n){
  let s=wall(w,h,'#EDE3CF');
  s+=roof(0,-10,w,40,'#8E7C69');
  const mid=Math.round(28+(h-28)*.47);
  // 2かいの ろうか・てすり・部屋の ドアと まど
  s+=R(4,mid-6,w-10,6,'#B7AD9A',{sw:.8});
  for(let i=0;i<3;i++){const x=16+i*72;s+=R(x,44,26,mid-54,'#9AA9AD',{sw:.9})+C(x+21,44+(mid-54)/2,1.6,'#E3D9C2',{sw:0})+pane(x+34,48,26,26,n)+Rn(x+34,48,26,4,'#A99C83');}
  for(let x=10;x<w-10;x+=8)s+=L(x,mid-22,x,mid-6,'#6E6A63',1.1);s+=L(8,mid-22,w-10,mid-22,'#6E6A63',1.6);
  // せんたくもの と うえきばち
  for(const [x,c]of [[70,'#E8A7B5'],[82,'#9FC7E0'],[154,'#F2D27E'],[166,'#FFFFFF']])s+=Pth(`M${x},${mid-24} l-5,4 v10 h10 v-10Z`,c,{sw:.6});
  s+=C(222,mid-26,5,'#87A269',{sw:.6})+R(217,mid-24,10,6,'#C59A76',{sw:.5});
  // 1かい: 部屋の ドア 3つ（101・102・103）・まど・ポスト
  for(let i=0;i<3;i++){const x=16+i*72,dx=i===1?d-13:x;if(i!==1){s+=R(dx,mid+8,26,h-mid-12,'#9AA9AD',{sw:.9})+C(dx+21,mid+8+(h-mid-12)/2,1.6,'#E3D9C2',{sw:0});}s+=pane(x+34,mid+10,26,26,n)+R(x+32,mid+36,30,4,wood,{sw:.5})+T(x+13,mid+6,'10'+(i+1),{size:5,fill:ink});}
  s+=door(d,h-2,n,26);
  s+=R(w/2-60,mid+2,30,12,'#C2B59B',{sw:.6});for(let i=0;i<4;i++)s+=Rn(w/2-58+i*7,mid+4,5,8,'#E6DCC6');
  // そとの てつの かいだん（右）
  s+=Pth(`M${w-40},${h-2} L${w-10},${mid}`,'none',{sw:3,stroke:'#6E6A63'});for(let i=1;i<7;i++){const t=i/7;s+=L(w-40+30*t-6,h-2-(h-2-mid)*t,w-40+30*t+6,h-2-(h-2-mid)*t,'#6E6A63',1.4);}
  s+=R(w/2-44,18,88,16,'#FFF6E0',{sw:.8,rx:2})+T(w/2,29,'ひだまり アパート',{size:7,fill:ink});
  return s;
}
function postOffice(w,h,d,n){
  const red='#E0553A';let s=wall(w,h,'#F7F4EE')+flatTop(w,'#ECE7DE','#CFC8BA');
  s+=R(-3,24,w+6,26,red,{sw:1.2})+C(30,37,10,'#FFFFFF',{sw:.8})+Pth('M24,31 h12 M24,35 h12 M30,35 v10','none',{sw:2,stroke:red})+T(w/2+14,42,'ゆうびんきょく',{size:12,fill:'#FFFFFF'});
  s+=R(-3,50,w+6,6,'#EFE3DC',{sw:.8});
  s+=glassFront(12,d-24,60,h-24,n,['#F4E3C4','#E0553A','#FFFFFF','#9FC3D9']);
  s+=R(d+24,60,w-d-38,h-84,'#DCE6E3',{sw:.9})+R(d+30,66,w-d-50,22,'#4F7FA6',{sw:.7})+T(d+30+(w-d-50)/2,81,'ATM',{size:9,fill:'#FFFFFF'})+R(d+34,92,w-d-58,10,n?'#FFF1CE':'#BFD6DF',{sw:.6});
  s+=autoDoor(d,h-2,n,36)+R(18,64,20,24,'#FFFFFF',{sw:.6})+Rn(21,68,14,10,'#E8C06A')+Rn(21,80,14,3,red);
  return s;
}
function deliveryCenter(w,h,d,n){
  const blue='#5E8FA8',yellow='#F2C14E';
  let s=Pth(`M${w-6},27 l13,9 V${h+7} H13 L3,${h-3}Z`,'#312619',{sw:0,op:.14})+R(4,22,w-10,h-23,'#C9D6DC',{sw:1.2});
  for(let x=10;x<w-10;x+=6)s+=L(x,24,x,h-4,'#B2C2CA',.7);
  s+=Pth(`M-2,24 Q${w/2},-18 ${w+2},24Z`,'#A9BCC6',{sw:1.2});for(let i=1;i<10;i++)s+=L(i*w/10,24-Math.sin(i/10*Math.PI)*36+4,i*w/10,24,'#93A8B3',.7);
  s+=R(w/2-78,26,156,22,blue,{sw:1,rx:3})+T(w/2+10,41,'おとどけ センター',{size:11,fill:'#FFFFFF'});
  const lx=w/2-66,ly=37;s+=R(lx-8,ly-7,14,12,yellow,{sw:.7})+L(lx-8,ly-1,lx+6,ly-1,ink,.6)+Pth(`M${lx+6},${ly-3} q8,-6 14,-2 q-6,1 -8,5Z`,'#FFFFFF',{sw:.6});
  // シャッター（ひだりは あいて にもつが みえる・みぎは しまって いる）
  for(const [x0,open]of [[14,true],[d+30,false]]){const sw2=d-44-14;
    s+=R(x0,56,sw2,h-60,open?'#6D7A80':'#D6DDE0',{sw:1});
    if(open){for(let r=0;r<3;r++)for(let c=0;c<4;c++)s+=R(x0+6+c*(sw2-12)/4,h-26-r*18,(sw2-12)/4-3,15,['#D8B27A','#C99E66','#E3C58F'][(r+c)%3],{sw:.6})+L(x0+6+c*(sw2-12)/4,h-19-r*18,x0+6+c*(sw2-12)/4+(sw2-12)/4-3,h-19-r*18,'#A8834F',.6);s+=R(x0,56,sw2,14,'#D6DDE0',{sw:.9});for(let y=58;y<70;y+=4)s+=L(x0+2,y,x0+sw2-2,y,'#B9C3C7',.6);if(n)s+=Rn(x0+2,70,sw2-4,h-74,'#FFE6A6',{op:.25});}
    else{for(let y=60;y<h-6;y+=5)s+=L(x0+2,y,x0+sw2-2,y,'#B9C3C7',.7);s+=C(x0+sw2/2,h-46,13,yellow,{sw:.8})+Pth(`M${x0+sw2/2-6},${h-50} h12 v10 h-12Z M${x0+sw2/2-6},${h-45} h12`,'none',{sw:.8});}
  }
  s+=door(d,h-2,n,28)+lamp(d-26,62,n);
  s+=R(d+20,h-24,16,20,'#C99E66',{sw:.6})+L(d+20,h-14,d+36,h-14,'#A8834F',.6);
  return s;
}
function salon(w,h,d,n){
  const mauve='#C79BB8';let s=wall(w,h,'#F4EAF0');
  s+=R(-2,4,w+4,24,'#E9D6E2',{sw:1.1})+R(-2,-2,w+4,8,'#B785A6',{sw:.9});for(let x=10;x<w;x+=22)s+=C(x,-4,4,'#9DBF8E',{sw:.5});
  s+=pane(20,38,40,28,n)+pane(w-60,38,40,28,n)+R(18,66,44,5,'#FFFFFF',{sw:.5})+R(w-62,66,44,5,'#FFFFFF',{sw:.5});
  s+=sign(w/2-54,74,108,'おしゃれサロン','HAIR & SALON','#9C6B8E');
  // 大きな まど: かがみ・いす・うえき
  s+=R(12,102,d-32-12,h-126,n?'#FBE7C8':'#E4EEF0',{sw:1})+R(24,108,26,32,'#D4AF78',{sw:.8,rx:8})+R(28,112,18,24,'#DCECEC',{sw:.6,rx:6})+R(56,124,20,14,'#7A6E7A',{sw:.7,rx:3})+R(62,114,10,12,'#8E818E',{sw:.6,rx:2});
  s+=awning(8,96,d-26,mauve);
  s+=door(d,h-2,n,30);
  // サインポール（あか・あお・しろ）
  const px=w-26;s+=R(px-5,h-64,10,40,'#FFFFFF',{sw:.9,rx:5});for(let i=0;i<4;i++)s+=Pth(`M${px-5},${h-60+i*9} l10,-5 v4 l-10,5Z`,i%2?'#3E73B8':'#D8433C',{sw:0});s+=C(px,h-66,5,'#D6B36F',{sw:.7})+C(px,h-22,5,'#D6B36F',{sw:.7});
  s+=planter(w-62,h-12,26);
  return s;
}
function chuka(w,h,d,n){
  const red='#C6453C',gold='#E8B74A';let s=wall(w,h,'#F3E3CF');
  s+=R(-3,14,w+6,24,'#3E5C50',{sw:1.1});for(let x=0;x<w;x+=10)s+=Pth(`M${x},14 q5,-6 10,0`,'none',{sw:1,stroke:'#2C443B'});s+=R(-5,36,w+10,5,'#2C443B',{sw:.8});
  s+=R(w/2-62,44,124,22,'#2A2622',{sw:1,rx:2})+T(w/2,60,'ちゅうか ねりかす',{size:11,fill:gold});
  // ちょうちん
  for(const x of [18,w-18]){s+=L(x,41,x,48,ink,.8)+E(x,58,8,10,n?'#FF8A6A':red,{sw:.9})+Rn(x-6,50,12,2,gold)+Rn(x-6,65,12,2,gold);if(n)s+=C(x,58,14,'#FFB08A',{sw:0,op:.25});}
  // たべものの みほん（ラーメン・ぎょうざ）
  const sx=30,sy=74;s+=R(sx,sy,d-34-sx,h-98,n?'#FBE7C0':'#E6EEEA',{sw:.9});
  for(let i=0;i<2;i++){const x=sx+12+i*28;s+=Pth(`M${x-10},${sy+22} q10,12 20,0Z`,'#F5F1E6',{sw:.7})+Pth(`M${x-8},${sy+22} q8,-4 16,0`,'none',{sw:1.2,stroke:'#E8C06A'})+C(x+4,sy+18,2.5,'#F2D27E',{sw:.4});}
  s+=Pth(`M${sx+64},${sy+26} q6,-8 12,0 q6,-8 12,0`,'#EACB8F',{sw:.7});
  // のれん（入口）
  s+=door(d,h-2,n,32)+R(d-22,70,44,22,red,{sw:.8});for(const x of [d-11,d+11])s+=L(x,72,x,92,'#9E342D',.8);s+=T(d,84,'らーめん',{size:6,fill:'#FFFFFF'});
  s+=R(w-58,74,40,30,'#FFFFFF',{sw:.6})+T(w-38,86,'ぎょうざ',{size:5.5,fill:red})+T(w-38,97,'チャーハン',{size:5,fill:red});
  return s;
}
function newHouse(kind,w,h,d,n){
  let s='';
  if(kind==='house_a'){
    // ようふうの 2かいだて: スレートの 屋根・まえむきの 切妻・ポーチの 柱・出窓・えんとつ
    s=wall(w,h,'#F4F1EA')+roof(0,-13,w,45,'#6C7F92');
    s+=brick(w-54,-40,16,32)+R(w-57,-43,22,5,'#9C6E58',{sw:.8});
    s+=Pth(`M${d-40},34 V2 L${d},-26 L${d+40},2 V34Z`,'#F4F1EA',{sw:1})+Pth(`M${d-44},4 L${d},-30 L${d+44},4`,'none',{sw:3.5,stroke:'#55667A'})+pane(d-16,0,32,24,n);
    s+=R(12,56,d-50,56,'#E6E0D3',{sw:1})+pane(16,60,(d-58)/3-2,46,n)+pane(16+(d-58)/3,60,(d-58)/3-2,46,n)+pane(16+2*(d-58)/3,60,(d-58)/3-2,46,n)+R(10,112,d-46,5,wood,{sw:.6});
    s+=pane(d+34,58,w-d-52,36,n)+R(d+30,58,5,36,'#7B8FA5',{sw:.4})+R(w-20,58,5,36,'#7B8FA5',{sw:.4});
    s+=Pth(`M${d-30},${h-66} L${d},${h-82} L${d+30},${h-66}Z`,'#55667A',{sw:1})+R(d-28,h-66,4,62,'#FFFFFF',{sw:.7})+R(d+24,h-66,4,62,'#FFFFFF',{sw:.7});
    s+=door(d,h-2,n,26)+planter(w-50,h-12,30)+lamp(d-34,h-60,n);
  }else if(kind==='house_b'){
    // モダンな しろい 家: 陸屋根・木の たて格子・大きな まど・ガラスの バルコニー
    s=Pth(`M${w-6},20 l13,9 V${h+7} H13 L3,${h-3}Z`,'#312619',{sw:0,op:.14})+R(4,4,w-10,h-5,'#F3F3EF',{sw:1.2})+R(0,-2,w+2,8,'#D9DAD4',{sw:1});
    s+=R(w-76,10,64,h-14,'#C39A6B',{sw:1});for(let x=w-70;x<w-14;x+=7)s+=L(x,12,x,h-6,'#A57E54',1);
    s+=R(14,20,w-100,40,n?'#FBE3B0':'#BFD8DE',{sw:1})+L(14+(w-100)/2,20,14+(w-100)/2,60,ink,.9)+R(10,58,w-92,6,'#DCDDD8',{sw:.8});for(let x=14;x<w-86;x+=6)s+=L(x,64,x,76,'#9FB9C0',.6);s+=R(10,64,w-92,12,'#CFE3E8',{sw:.7,op:.6});
    s+=R(14,86,d-40,h-98,n?'#FBE3B0':'#C6DEE3',{sw:1})+L(14+(d-40)/2,86,14+(d-40)/2,h-12,ink,.9)+Pth(`M18,${h-16} l${(d-40)*.35},-40`,'none',{sw:2,stroke:'#FFFFFF',op:.5});
    s+=R(d-16,h-60,32,58,'#4A5256',{sw:1})+L(d+9,h-36,d+9,h-26,'#C9B98E',1.6)+R(d-20,h-2,40,3,'#CCC2AA',{sw:.6});
    s+=C(w-90,h-8,4,n?'#FFE39A':'#EFE6C8',{sw:.6})+L(w-90,h-4,w-90,h-1,ink,.8);
  }else{
    // わふうの 家: かわらの 切妻（のきの そり・棟の おにがわら）・しっくいと 木の はしら・えんがわと しょうじ・こうしの 引き戸
    s=wall(w,h,'#F4EFE3');
    s+=Pth(`M-6,36 Q-2,28 18,-12 H${w-18} Q${w+2},28 ${w+6},36Z`,'#5D6468',{sw:1.3});
    for(let yy=-4;yy<34;yy+=6){const k=(yy+12)/48;s+=L(18-24*k,yy,w-18+24*k,yy,'#4A5054',.8);}
    for(let i=1;i<14;i++){const t=i/14;s+=L(18+t*(w-36),-11,-6+t*(w+12),34,'#6C7377',.5);}
    s+=R(12,-18,w-24,7,'#454B4F',{sw:.9})+C(12,-15,5,'#454B4F',{sw:.8})+C(w-12,-15,5,'#454B4F',{sw:.8})+R(-8,34,w+16,5,'#454B4F',{sw:.9});
    for(const x of [8,d-26,d+26,w-12])s+=R(x,39,6,h-40,'#6F5641',{sw:.7});
    s+=R(14,52,d-44,h-86,'#FAF6EA',{sw:.9});for(let x=14;x<d-30;x+=9)s+=L(x,52,x,h-34,'#B9A889',.6);for(let y=52;y<h-34;y+=10)s+=L(14,y,d-30,y,'#B9A889',.6);if(n)s+=Rn(15,53,d-46,h-88,'#FFE0A0',{op:.45});
    s+=R(8,h-32,d-36,8,'#9C7A55',{sw:.8});for(let x=12;x<d-28;x+=8)s+=L(x,h-32,x,h-24,'#7B5E40',.6);
    s+=R(d-20,h-60,40,58,'#8E6E4E',{sw:1});for(let x=d-16;x<d+18;x+=5)s+=L(x,h-58,x,h-4,'#5E4631',1);if(n)s+=Rn(d-18,h-58,36,54,'#FFE0A0',{op:.35});s+=R(d-24,h-2,48,3,'#CCC2AA',{sw:.6});
    s+=pane(d+34,56,w-d-52,30,n)+R(d+32,86,w-d-48,4,wood,{sw:.5});
    s+=R(w-44,h-20,26,16,'#B98C5E',{sw:.6})+C(w-31,h-26,9,'#5E8A52',{sw:.6})+C(w-37,h-30,6,'#6E9A5E',{sw:.5});
  }
  return s;
}
const specs=[
 ['home','みんなのおうち',6,4,3,'home','切妻・花箱・玄関灯・郵便受け'],
 ['clothes','いととはな・洋服店',5,4,2,'tailor','三角の切妻・ハンガーの丸看板・仕立て屋の服・しまの日よけ'],
 ['furniture','こもれび家具工房',6,4,3,'workshop','木組み・作業台・家具展示・腰壁'],
 ['crepe','くるりクレープ',6,4,3,'crepe','丸いヴォールト屋根・クレープの立体看板と実物展示・軒先ランプ'],
 ['dentist','ネリカス歯科',9,4,4,'dentist','低い陸屋根・受付窓・すりガラス'],
 ['florist','はなのこみち',9,4,4,'florist','ガラス温室・屋根の桟・切花のバケツ'],
 ['cake','こはるケーキ',6,4,3,'cake','マンサード屋根と丸い高窓・苺ケーキのケース・花箱・日よけ'],
 ['bakery','こむぎのいえ',6,4,3,'bakery','レンガ煙突・焼き目のパン・二段棚'],
 ['market','ネリカスマーケット',10,4,5,'market','棟の採光窓・青果箱・すじのある木箱・しまの日よけ'],
 ['town_atelier','川のアトリエ',9,4,4,'atelier','高窓・風景画・木の額・花箱'],
 ['nerikasu_school','ネリカス小学校',24,6,12,'school','時計塔・教室の窓・掲示板・校旗・玄関の庇'],
 ['nerikasu_nursery','ネリカス保育園',19,6,9,'nursery','三つの屋根・靴箱・デッキ・小さな遊具'],
 ['nerikasu_gatehouse','川辺のあずまや',2,4,1,'gazebo','柱と方杖・木のベンチ・板のデッキ'],
 ['nerikasu_home0','駅東の中庭の家',6,5,3,'courtyard','金属屋根・縁側・雨どい・花箱'],
 ['nerikasu_home1','双子切妻の長屋',9,5,4,'row','二つのドーマー・窓のよろい戸'],
 ['nerikasu_home2','パズル こうぼう（パズルの おてつだい）',9,5,4,'kobo','のこぎり屋根と あかり とりの まど・ジグソーの 丸看板・スライド パズルと かたち はめの まど・おえかき ロジックの ハート・いろの キューブ'],
 ['nerikasu_home3','瓦屋根の家',7,5,3,'tile','瓦の重なり・木枠の窓・植木'],
 ['nerikasu_home4','テラスの家',7,5,3,'terrace','時計切妻と異なる高窓・縁側の格子'],
 ['nerikasu_home5','ころころフルーツ（パズルの おてつだい）',6,5,3,'korokoro','りんごの 丸看板・棟に すわる 3人の かお・玉が つみかさなる ガラスの 箱・しまの 日よけ・くだものの 木箱'],
 ['nerikasu_home6','あたまの たいそう（のうトレの おてつだい）',7,5,3,'brain','ふくろうの 丸看板・ひらめきの でんきゅうと ほし・こくばんの まど・まちがい さがしの え・しまの 日よけ'],
 ['nerikasu_home7','画家の家',8,5,4,'studio','大きな仕事窓・片側の屋上・窓辺の花'],
 ['neri_lawson','コンビニ ローリソン',8,4,4,'lawson','あおい 看板の 帯・ミルクの びんの マーク・ガラスの 店さき・たなの しなもの・自動ドア・屋上の 室外機'],
 ['neri_sevenbun','コンビニ せぶんぶん',7,4,3,'sevenbun','だいだい・みどり・あかの 3本の 帯・しろい 看板・ガラスの 店さき・自動ドア'],
 ['neri_bikkupo','レストラン びっくぽ',9,5,4,'bikkupo','かわらの 屋根・屋根の 上の 看板と マスコット・赤い ボックスせきが みえる 大きな まど・入口の ひさし'],
 ['neri_gas','ネリカス ガソリンスタンド',9,5,6,'gas','しろい キャノピー・給油機 2だい・ねだんの かんばん・ガラスの じむしょ・せんしゃの おしらせ'],
 ['neri_apartment','ひだまり アパート',8,6,4,'apartment','2かいだて・ろうかの てすり・せんたくもの・へやの ドア 101〜103・てつの そとかいだん・ポスト'],
 ['neri_post','ネリカス ゆうびんきょく',7,4,3,'post','〒の 帯・ガラスの 店さき・ATMの まど・切手の ポスター'],
 ['neri_delivery','おとどけ センター',9,5,4,'delivery','まるい 屋根の そうこ・あいた シャッターの にもつ・しまった シャッターの マーク・はねの ある にもつの ロゴ'],
 ['neri_salon','おしゃれサロン',6,5,3,'salon','やねの うえの みどり・かがみと いすの まど・しまの 日よけ・サインポール'],
 ['neri_chuka','ちゅうか ねりかす',7,4,3,'chuka','みどりの かわら・ちょうちん・ラーメンと ぎょうざの みほん・のれん'],
 ['neri_house_a','スレート屋根の 洋館',7,5,3,'house_a','まえむきの 切妻・ポーチの 柱・出窓・れんがの えんとつ'],
 ['neri_house_b','しろい モダンな 家',7,5,3,'house_b','陸屋根・木の たて格子・大きな まど・ガラスの バルコニー'],
 ['neri_house_c','かわら屋根の 和の 家',7,5,3,'house_c','かわらの 屋根・しっくいと 木の はしら・えんがわと しょうじ・こうしの 引き戸']
];
export const NERIKASU_BUILDINGS=specs.map(([buildingId,name,w,h,d,kind,detail])=>({id:'nerikasu.bld_'+buildingId,buildingId,name,category:'住宅・お店・学校',w,h,door:d,bbox:[-10,-49,w*32+15,h*32+12],details:detail.split('・'),states:['day','night'],draw:o=>{const args=[w*32,h*32,(d+.5)*32,!!o?.night];return ['lawson','sevenbun'].includes(kind)?conbini(kind,...args):kind==='bikkupo'?bikkupo(...args):kind==='gas'?gasStation(...args):kind==='apartment'?apartment(...args):kind==='post'?postOffice(...args):kind==='delivery'?deliveryCenter(...args):kind==='salon'?salon(...args):kind==='chuka'?chuka(...args):kind.startsWith('house_')?newHouse(kind,...args):kind==='korokoro'?korokoro(...args):kind==='brain'?brain(...args):kind==='kobo'?kobo(...args):kind==='school'?school(...args):kind==='nursery'?nursery(...args):kind==='gazebo'?gazebo(...args):['home','row','modern','tile','terrace','courtyard','studio'].includes(kind)?home(kind,...args):shop(kind,...args);}}));
