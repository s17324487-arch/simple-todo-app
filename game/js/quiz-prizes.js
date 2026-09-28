// クイズでだけ手に入る、読書と発見のための家具。既存のお店の限定品とは別のID。
const QuizPrizes = {
  items: [
    { id:"quiz_star_booklamp", tier:"rare", name:"ほしの ブックランプ", price:0, w:64, depth:44, h:108, comfort:7, desc:"ひらいた本から 星のあかりが ともる、クイズ限定のランプ。" },
    { id:"quiz_crystal_terrarium", tier:"rare", name:"ちいさな けっしょうの テラリウム", price:0, w:48, depth:42, h:76, comfort:7, desc:"真鍮のガラス箱に こけと結晶を とじこめた、手のひらの庭。" },
    { id:"quiz_grand_armillary", tier:"luxury", name:"おおきな 天球儀", price:15000, w:134, depth:112, h:180, comfort:12, desc:"星座を刻んだ 青い球を、いくつもの真鍮の輪が つつむ天球儀。" },
    { id:"quiz_stainedglass_desk", tier:"luxury", name:"ステンドグラスの 書斎机", price:32000, w:164, depth:82, h:111, comfort:14, desc:"青と若葉色のガラス、真鍮のふち、彫刻の引き出しをそなえた机。" },
    { id:"quiz_carved_pendulum", tier:"luxury", name:"もくちょうの 真鍮ふりこどけい", price:48000, w:70, depth:48, h:204, comfort:16, desc:"葉もようの彫刻と 透ける扉。おおきな真鍮のふりこが かがやく時計。" },
  ],
  models: new Map(),
  rollRare(rng = Math.random) { return this.roll("rare", rng); },
  rollLuxury(rng = Math.random) { return this.roll("luxury", rng); },
  roll(tier, rng) {
    const pool=this.items.filter(f=>f.tier===tier), sample=Number(rng());
    const n=Number.isFinite(sample)?Math.max(0,Math.min(1-Number.EPSILON,sample)):0;
    return {furn:pool[Math.floor(n*pool.length)].id};
  },
  model(id, opts = {}) {
    const f=this.items.find(v=>v.id===id);
    if(!f)return null;
    // 5品 × 2方向だけ。時刻や乱数によるキーを作らない。
    const key=id+":"+!!opts.flip;
    if(this.models.has(key))return this.models.get(key);
    const {w,depth:d,h}=f, points=[], A=HomeDesign.A, B=HomeDesign.B;
    const pt=(x,y,z=0)=>{const p=opts.flip?HomeDesign.project(y+d/2,x-w/2,z):HomeDesign.project(x,y,z);points.push(p);return p;};
    const fmt=n=>Number(n.toFixed(3));
    const poly=(vs,color,stroke=1.4)=>HomeDesign.poly(vs.map(v=>pt(...v)),color,stroke);
    const line=(vs,color="#715138",stroke=1.4)=>`<polyline points="${vs.map(v=>{const p=pt(...v);return fmt(p.x)+","+fmt(p.y);}).join(" ")}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const box=(x,y,ww,dd,z,hh,c=["#A98258","#765239","#D3AF7A"])=>
      poly([[x,y+dd,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],c[0])+
      poly([[x+ww,y,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x+ww,y,z+hh]],c[1])+
      poly([[x,y,z+hh],[x+ww,y,z+hh],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],c[2]);
    const face=(x,y,z,ww,hh,art)=>{
      const p=pt(x,y,z+hh);
      pt(x+ww,y,z+hh);pt(x,y,z);pt(x+ww,y,z);
      return `<g transform="matrix(${opts.flip?-A:A} ${B} 0 1 ${fmt(p.x)} ${fmt(p.y)})">${art}</g>`;
    };
    const circle=(x,y,z,r,fill,stroke=INK,sw=1.5)=>{
      const p=pt(x,y,z);points.push({x:p.x-r-sw,y:p.y-r-sw},{x:p.x+r+sw,y:p.y+r+sw});
      return `<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    };
    const ground=(x,y,z,rx,ry,fill,stroke=1)=>poly(Array.from({length:40},(_,i)=>{const a=i*Math.PI/20;return[x+Math.cos(a)*rx,y+Math.sin(a)*ry,z];}),fill,stroke);
    const star=(cx,cy,r,inner=.43)=>Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*inner:r;return `${fmt(cx+Math.cos(a)*rr)},${fmt(cy+Math.sin(a)*rr)}`;}).join(" ");
    const ink=`stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;
    const brass=["#C2A45F","#967945","#E9D595"], wood=["#9D7651","#694C38","#C8A578"], dark=["#705541","#503F35","#A58966"];
    let body="";

    if(id==="quiz_star_booklamp"){
      body=box(-32,-44,64,44,0,6,dark)+box(-29,-41,58,38,6,3,brass);
      // 本の背を中心に、ページ束と左右に開いた表紙を立体で描く。
      body+=poly([[-29,-39,13],[-2,-35,21],[-2,-4,14],[-29,-6,8]],"#748F90")+
        poly([[2,-35,21],[29,-39,13],[29,-6,8],[2,-4,14]],"#809D98");
      for(let z=0;z<4;z++){
        body+=poly([[-27,-37,15+z*.8],[-1,-34,23+z*.8],[-1,-5,16+z*.8],[-27,-8,10+z*.8]],z===3?"#FFF0CC":"#DCCDA9",.7);
        body+=poly([[1,-34,23+z*.8],[27,-37,15+z*.8],[27,-8,10+z*.8],[1,-5,16+z*.8]],z===3?"#F3E1B7":"#C9B993",.7);
      }
      for(let y=-30;y<-10;y+=5){
        body+=line([[-22,y,18],[-7,y+2,23]],"#B39973",.8)+line([[7,y+2,23],[22,y,18]],"#B39973",.8);
      }
      body+=poly([[10,-6,17],[15,-7,16],[15,2,12],[12,0,13],[10,2,13]],"#BB746D",.7);
      body+=box(-3,-28,6,6,23,31,brass)+ground(0,-25,55,11,9,"#D9C080");
      const center=pt(0,-25,77),r=24;
      points.push({x:center.x-29,y:center.y-29},{x:center.x+29,y:center.y+29});
      body+=`<g transform="translate(${fmt(center.x)} ${fmt(center.y)})"><circle r="28" fill="#F5DE9725"/><circle r="23" fill="#FFF1B635"/><polygon points="${star(0,0,r)}" fill="#E9CD7A" ${ink} stroke-width="1.7"/><polygon points="${star(0,0,19)}" fill="#FFF0B3" stroke="#B99851" stroke-width="1"/><path d="M-5,3 Q0,10 5,3 M-6,-4 L-2,-8 M2,-8 L6,-4" fill="none" stroke="#C3A35C" stroke-width="1.2"/><path d="M-2,-15 L0,-20 L2,-15 M13,3 L18,2" stroke="#FFFBDE" stroke-width="2.3" stroke-linecap="round"/></g>`;
    }else if(id==="quiz_crystal_terrarium"){
      const ring=(z,rx,ry)=>Array.from({length:6},(_,i)=>{const a=Math.PI/6+i*Math.PI/3;return[Math.cos(a)*rx,-d/2+Math.sin(a)*ry,z];});
      const lower=ring(8,25,21), upper=ring(49,25,21),crown=[0,-d/2,73];
      body=ground(0,-d/2,1,25,21,"#7B6950")+poly(lower,"#C0A25F");
      // 奥側のガラス→内部の苔と結晶→手前側のガラスと真鍮の桟。
      for(let i=2;i<5;i++){const j=(i+1)%6;body+=poly([lower[i],lower[j],upper[j],upper[i]],"#C5ECE940",.8)+poly([upper[i],upper[j],crown],"#DEF4E840",.8);}
      body+=ground(0,-d/2,10,21,17,"#688466")+ground(-7,-25,12,10,8,"#93AD79")+ground(9,-17,13,10,7,"#B1BD8A");
      const gem=(x,y,z,ww,hh,c)=>poly([[x-ww/2,y,z],[x-ww/2,y,z+hh*.67],[x,y-ww*.28,z+hh],[x,y-ww*.28,z]],c[0],1)+poly([[x,y-ww*.28,z],[x,y-ww*.28,z+hh],[x+ww/2,y,z+hh*.67],[x+ww/2,y,z]],c[1],1)+poly([[x-ww/2,y,z+hh*.67],[x,y-ww*.28,z+hh],[x+ww/2,y,z+hh*.67],[x,y+ww*.22,z+hh*.64]],c[2],1);
      body+=gem(-7,-25,12,15,39,["#A4D9D3","#638FBA","#E2F5D6"])+gem(9,-18,12,13,26,["#C3B4DF","#8F8DB9","#E5D9EF"])+gem(-8,-10,13,9,18,["#E8CDA0","#C09469","#FFF0C9"]);
      for(const [x,y] of [[-13,-19],[11,-29],[3,-9]]){
        body+=line([[x,y,13],[x,y,26]],"#4D795B",1.5);
        for(const z of [17,21])body+=poly([[x,y,z],[x-6,y-1,z+5],[x-4,y,z]],"#A5BD88",.65)+poly([[x,y,z+2],[x+6,y+1,z+7],[x+3,y,z+2]],"#74956B",.65);
      }
      for(let i=0;i<6;i++){const j=(i+1)%6;if(i<2||i===5)body+=poly([lower[i],lower[j],upper[j],upper[i]],"#DDF5EA22",.8)+poly([upper[i],upper[j],crown],"#EAFBF122",.8);body+=line([lower[i],upper[i],crown],"#A08B59",1.9);}
      body+=line([...upper,upper[0]],"#C9B074",2)+line([...lower,lower[0]],"#C9B074",2)+circle(0,-21,74,2,"#E8D896");
      body+=line([[19,-17,22],[19,-17,38]],"#FFFFFF",1.6)+line([[18,-15,40],[18,-15,45]],"#FFFFFF",1.2);
    }else if(id==="quiz_grand_armillary"){
      body=ground(0,-56,2,61,48,"#785D42")+ground(0,-56,7,60,47,"#B29465")+ground(0,-56,10,51,39,"#4B6776");
      // 三脚には真鍮の靴と、曲線をもつ木の支柱。
      for(const [x,y] of [[0,-99],[-45,-31],[45,-31]]){
        body+=box(x-6,y-5,12,10,4,5,brass);
        body+=poly([[x-5,y,9],[x+5,y,9],[x*.64+4,-56+(y+56)*.65,48],[x*.33+5,-56+(y+56)*.33,60],[x*.33-5,-56+(y+56)*.33,60],[x*.64-4,-56+(y+56)*.65,46]],wood[0]);
        body+=line([[x,y,13],[x*.64,-56+(y+56)*.65,46],[x*.33,-56+(y+56)*.33,57]],"#D5B383",2);
      }
      body+=ground(0,-56,59,39,31,"#A68855")+ground(0,-56,63,35,27,"#D9C07D")+box(-5,-61,10,10,62,11,brass);
      const rr=58, cz=117;
      const ring=(kind,from=0,to=2*Math.PI)=>Array.from({length:65},(_,i)=>{const a=from+(to-from)*i/64;return kind===0?[rr*Math.cos(a),-56+rr*.72*Math.sin(a),cz]:kind===1?[rr*.86*Math.cos(a),-56+rr*.32*Math.cos(a),cz+rr*Math.sin(a)]:[rr*.25*Math.cos(a),-56+rr*.83*Math.cos(a),cz+rr*.87*Math.sin(a)];});
      for(const n of [1,2,0])body+=line(ring(n),"#80673F",5.5);
      const c=pt(0,-56,cz),r=36;
      points.push({x:c.x-r-3,y:c.y-r-3},{x:c.x+r+3,y:c.y+r+3});
      body+=`<g transform="translate(${fmt(c.x)} ${fmt(c.y)})"><circle r="36" fill="#6C8FA6" ${ink} stroke-width="1.6"/><path d="M-28,-22 Q-42,9 -16,31 Q9,43 31,18 Q17,35 -6,22 Q-22,7 -17,-26Z" fill="#41697D"/><ellipse rx="14" ry="35" fill="none" stroke="#B1CBCB" stroke-width=".9"/><ellipse rx="27" ry="35" fill="none" stroke="#A6C3C7" stroke-width=".8"/><ellipse rx="35" ry="13" fill="none" stroke="#B4CDCB" stroke-width=".9"/><path d="M-30,-18 Q0,-8 30,-18 M-30,18 Q0,8 30,18 M-21,-12 L-7,-20 L7,-8 L19,-17 M-18,12 L-5,2 L9,13 L23,5" fill="none" stroke="#DEC57F" stroke-width="1.2"/>${[[-21,-12],[-7,-20],[7,-8],[19,-17],[-18,12],[-5,2],[9,13],[23,5]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7" fill="#FCEBB5"/>`).join("")}<path d="M-21,-23 Q-9,-31 0,-30" stroke="#DCE5D3" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
      // 手前の半周だけを球に重ね、球が輪の中に入っている奥行きを保つ。
      body+=line(ring(0,0,Math.PI),"#E9D294",4)+line(ring(1,0,Math.PI),"#D3B873",3.3)+line(ring(2,Math.PI,Math.PI*2),"#CAB073",3);
      for(let i=0;i<24;i++){
        const a=i*Math.PI/12,r2=i%3===0?52:54;
        body+=line([[r2*Math.cos(a),-56+r2*.72*Math.sin(a),cz],[rr*Math.cos(a),-56+rr*.72*Math.sin(a),cz]],"#F5E7B5",i%3===0?1.7:1);
      }
      body+=circle(0,-56,cz+rr,3.5,"#EDD79A")+face(-13,-7,7,26,7,'<rect width="26" height="7" rx="1" fill="#C7AE71"/><path d="M6,3.5 H20" stroke="#665133" stroke-width=".8"/>');
    }else if(id==="quiz_stainedglass_desk"){
      // 対になった脚と引き出し、中央のひざ元は空けておく。
      for(const x of [-76,64])for(const y of [-76,-13]){
        body+=box(x,y,10,9,0,5,brass)+box(x+1,y+1,8,7,5,53,wood);
        body+=box(x-1,y-1,12,11,43,7,dark)+box(x,y,10,9,56,8,brass);
      }
      body+=box(-77,-77,43,68,34,27,dark)+box(35,-77,43,68,34,27,dark);
      for(const x of [-74,38])for(const z of [36,48]){
        body+=box(x,-10,37,4,z,10,wood);
        body+=face(x+2,-5.5,z+1,33,8,'<rect x="1" y="1" width="31" height="6" rx="2" fill="none" stroke="#D5B889" stroke-width=".8"/><path d="M13,3 Q16,7 20,3" fill="none" stroke="#EDD797" stroke-width="1.5"/>');
      }
      body+=box(-82,-82,164,82,63,6,dark)+box(-80,-80,160,78,69,3,brass)+box(-76,-76,152,70,72,2,["#8DA5A1","#789296","#AECAC2"]);
      const glass=["#93B5BA","#C2D6BB","#839DBD","#DFCB95","#B9B0CB"];
      for(let x=-72,ix=0;x<70;x+=24,ix++)for(let y=-72,iy=0;y<-7;y+=21,iy++){
        const ww=Math.min(23,72-x),dd=Math.min(20,-7-y);
        body+=poly([[x,y,74.5],[x+ww,y,74.5],[x+ww,y+dd,74.5],[x,y+dd,74.5]],glass[(ix+iy*2)%glass.length],.65);
        body+=poly([[x+ww/2,y+3,74.7],[x+ww-3,y+dd/2,74.7],[x+ww/2,y+dd-3,74.7],[x+3,y+dd/2,74.7]],glass[(ix+iy*2+2)%glass.length],.6);
      }
      body+=line([[-73,-71,75],[70,-71,75]],"#F9EBC6",1.5)+line([[-73,-71,75],[-73,-9,75]],"#F9EBC6",1.2);
      // 小さな背棚、洋書、革の筆記マット、インクと羽根ペン。
      body+=box(-69,-79,138,9,75,24,wood)+box(-72,-81,144,13,99,4,brass);
      for(let i=0;i<7;i++){
        const x=-62+i*6,hh=19+i%3*3;
        body+=box(x,-64,5,13,75,hh,[["#78988C","#9E828D","#C7AA6F"][i%3],"#6E604A","#E8DEC5"]);
        body+=line([[x+1,-50.7,80],[x+4,-50.7,80]],"#EED69C",.9)+line([[x+1,-50.7,75+hh-4],[x+4,-50.7,75+hh-4]],"#EED69C",.9);
      }
      body+=poly([[-23,-49,76],[39,-49,76],[39,-16,76],[-23,-16,76]],"#556F70")+poly([[-13,-44,76.3],[24,-44,76.3],[24,-21,76.3],[-13,-21,76.3]],"#F1E9CF",.5);
      for(let y=-38;y<-24;y+=4)body+=line([[-8,y,76.8],[18-(y%3),y,76.8]],"#9D927D",.7);
      body+=box(49,-54,12,11,75,13,["#567786","#385360","#89A8AF"])+box(51,-52,8,7,88,3,brass);
      body+=line([[56,-50,91],[62,-54,109]],"#C4AE76",1.8)+poly([[59,-52,99],[60,-55,108],[65,-56,111],[65,-53,104]],"#EEE8D0",.8);
      body+=face(-31,-4,52,62,9,'<path d="M2,5 Q9,0 15,5 Q21,10 27,5 Q33,0 39,5 Q45,10 51,5 Q56,0 60,5" fill="none" stroke="#C7A475" stroke-width="1.4"/>');
    }else{
      // 彫刻入りの台座と、上部を丸く張り出させた長時計のケース。
      body=box(-35,-48,70,48,0,8,dark)+box(-32,-45,64,42,8,6,brass)+box(-28,-42,56,36,14,158,wood);
      body+=box(-32,-45,64,42,172,7,dark)+box(-34,-47,68,46,179,5,brass);
      body+=poly([[-29,-43,184],[29,-43,184],[24,-43,194],[14,-43,194],[0,-43,204],[-14,-43,194],[-24,-43,194]],"#C6A273")+poly([[29,-43,184],[29,-5,184],[24,-5,194],[14,-5,194],[0,-5,204],[0,-43,204],[14,-43,194],[24,-43,194]],"#8B6547")+poly([[-29,-5,184],[29,-5,184],[24,-5,194],[14,-5,194],[0,-5,204],[-14,-5,194],[-24,-5,194]],"#B99465");
      body+=face(-23,-4,28,46,100,`<rect width="46" height="100" rx="20" fill="#443E38" ${ink} stroke-width="1.2"/><rect x="3" y="4" width="40" height="92" rx="17" fill="#748D8840" stroke="#E0C18A" stroke-width="1"/><path d="M12,16 V67 M34,16 V58" stroke="#B49C66" stroke-width="1.3"/><rect x="9" y="65" width="6" height="17" rx="2" fill="#C8AE66" stroke="#80683F" stroke-width="1"/><rect x="31" y="55" width="6" height="19" rx="2" fill="#C8AE66" stroke="#80683F" stroke-width="1"/><path d="M23,10 V69" stroke="#E6CB7D" stroke-width="3"/><circle cx="23" cy="74" r="13" fill="#D1B263" stroke="#80663F" stroke-width="1.6"/><circle cx="23" cy="74" r="9" fill="#EBD595" stroke="#A48A53" stroke-width=".9"/><path d="M17,69 Q23,64 29,69" fill="none" stroke="#FFF0B6" stroke-width="1.5"/><path d="M8,36 L17,23 M8,44 L20,27" stroke="#DEEEE6" stroke-opacity=".65" stroke-width="1.2"/>`);
      body+=face(-25,-4,130,50,43,`<path d="M0,43 V20 Q0,0 25,0 Q50,0 50,20 V43Z" fill="#CFB275" ${ink} stroke-width="1.1"/><circle cx="25" cy="23" r="19" fill="#F4ECD0" stroke="#7A6343" stroke-width="1.3"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=25+Math.sin(a)*15,y=23-Math.cos(a)*15;return `<path d="M${fmt(x)},${fmt(y)} l${fmt(-Math.sin(a)*2)},${fmt(Math.cos(a)*2)}" stroke="#6E604F" stroke-width="1"/>`;}).join("")}<text x="25" y="13" text-anchor="middle" fill="#655843" font-family="serif" font-size="5.8">XII</text><text x="37" y="25" text-anchor="middle" fill="#655843" font-family="serif" font-size="5.8">III</text><text x="25" y="38" text-anchor="middle" fill="#655843" font-family="serif" font-size="5.8">VI</text><text x="13" y="25" text-anchor="middle" fill="#655843" font-family="serif" font-size="5.8">IX</text><path d="M25,11 V23 L34,27" fill="none" stroke="#5C574D" stroke-width="1.6" stroke-linecap="round"/><circle cx="25" cy="23" r="2.1" fill="#B79A5B"/>`);
      for(const x of [-27,23]){
        body+=box(x,-4,4,3,24,148,brass);
        for(const z of [38,66,94,119,160])body+=face(x-1,-.8,z,6,10,'<path d="M3,9 Q-1,5 3,1 Q7,5 3,9Z" fill="#B99560" stroke="#7B5A3C" stroke-width=".6"/><path d="M3,2 V8" stroke="#F0D293" stroke-width=".7"/>');
      }
      body+=face(-21,-3,15,42,11,'<path d="M2,6 Q7,0 14,6 Q21,11 21,3 Q21,11 28,6 Q35,0 40,6 M12,8 Q15,4 18,6 M24,6 Q27,4 30,8" fill="none" stroke="#E5C696" stroke-width="1.2"/>');
      body+=face(-20,-4,184,40,16,`<path d="M2,13 Q7,2 16,10 Q20,14 20,4 Q20,14 24,10 Q33,2 38,13" fill="none" stroke="#765437" stroke-width="1.5"/><polygon points="${star(20,5,4)}" fill="#EED78F" stroke="#8E754C" stroke-width=".6"/>`);
    }
    const x=Math.min(...points.map(p=>p.x))-7,y=Math.min(...points.map(p=>p.y))-7;
    const width=Math.max(...points.map(p=>p.x))-x+7,height=Math.max(...points.map(p=>p.y))-y+7;
    const model={x,y,w:width,h:height,footW:opts.flip?d:w,footD:opts.flip?w:d,height:h,full:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)}" role="img" aria-label="${f.name}">${body}</svg>`};
    this.models.set(key,model);return model;
  },
};

for(const prize of QuizPrizes.items){
  const f={...prize,kind:"floor",rare:true,quizPrize:true};
  FURNITURE.push(f);FURN_INDEX[f.id]=f;
  FURN_ART[f.id]=(opts={})=>QuizPrizes.model(f.id,opts).full;
}
