// パズルの到達スコアで初回だけ手に入る家具。販売・抽選・能力ブーストはない。
const PUZZLE_PRIZES = [
  { id: "puzzle_crystal", score: 1200, name: "星しずくの結晶灯", tier: "RARE", w: 54, d: 42, h: 86, desc: "多面体の光と、金の輪が浮かぶ真鍮のランプ。" },
  { id: "puzzle_aquarium", score: 4000, name: "月くらげの水族館", tier: "RARE", w: 110, d: 58, h: 126, desc: "月くらげが浮かぶ、アーチ型の宝石水槽。" },
  { id: "puzzle_swing", score: 9000, name: "彗星のブランコ", tier: "EPIC", w: 152, d: 88, h: 174, desc: "大きな三日月の座席と、星を吊るした夜空のブランコ。" },
  { id: "puzzle_piano", score: 16000, name: "オーロラのグランドピアノ", tier: "EPIC", w: 182, d: 122, h: 143, desc: "虹色のふたと星の鍵盤。存在感のある大型ピアノ。" },
  { id: "puzzle_orrery", score: 45000, name: "なかよし銀河の天球儀", tier: "LEGEND", w: 224, d: 160, h: 220, desc: "幅は普通のイスの約6倍。3つの惑星が輝く特大の天球儀。" },
];

const PuzzlePrizeArt = {
  uid: 0,
  model(id, opts = {}) {
    const f = PUZZLE_PRIZES.find(p => p.id === id), { w, d, h } = f, uid = "prize-" + (++this.uid), points = [];
    const pt = (x, y, z = 0) => { const p = opts.flip ? HomeDesign.project(y + d / 2, x - w / 2, z) : HomeDesign.project(x, y, z); points.push(p); return p; };
    const poly = (vs, color, stroke = 1.6) => HomeDesign.poly(vs.map(v => pt(...v)), color, stroke);
    const line = (vs, color = "#DFC88A", width = 2) => `<polyline points="${vs.map(v => { const p = pt(...v); return `${p.x},${p.y}`; }).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const box = (x, y, ww, dd, z, hh, c = ["#586280", "#384661", "#D9DBE7"]) => poly([[x,y+dd,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],c[0]) + poly([[x+ww,y,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x+ww,y,z+hh]],c[1]) + poly([[x,y,z+hh],[x+ww,y,z+hh],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],c[2]);
    const orb = (x, y, z, radius, color) => { const p = pt(x,y,z); points.push({x:p.x-radius,y:p.y-radius},{x:p.x+radius,y:p.y+radius}); return `<circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${color}" stroke="${INK}" stroke-width="1.8"/><ellipse cx="${p.x-radius*.3}" cy="${p.y-radius*.35}" rx="${radius*.28}" ry="${radius*.17}" fill="#FFFDF1" opacity=".8"/>`; };
    const star = (x, y, z, r = 5) => { const p = pt(x,y,z); points.push({x:p.x-r,y:p.y-r},{x:p.x+r,y:p.y+r}); return `<path d="M${p.x},${p.y-r} l${r*.3},${r*.7} ${r*.7},${r*.3} -${r*.7},${r*.3} -${r*.3},${r*.7} -${r*.3},-${r*.7} -${r*.7},-${r*.3} ${r*.7},-${r*.3} Z" fill="#FFF4B8" stroke="#AD8645" stroke-width=".8"/>`; };
    const ring = (x, y, z, rx, ry, tilt = 0) => { const p = pt(x,y,z), r=Math.max(rx,ry); points.push({x:p.x-r,y:p.y-r},{x:p.x+r,y:p.y+r}); return `<ellipse cx="${p.x}" cy="${p.y}" rx="${rx}" ry="${ry}" transform="rotate(${tilt} ${p.x} ${p.y})" fill="none" stroke="#1F1D1B" stroke-width="5"/><ellipse cx="${p.x}" cy="${p.y}" rx="${rx}" ry="${ry}" transform="rotate(${tilt} ${p.x} ${p.y})" fill="none" stroke="#E4C77E" stroke-width="3"/>`; };
    let body = `<defs><linearGradient id="${uid}-aurora" x2="1" y2="1"><stop stop-color="#C9EFE3"/><stop offset=".35" stop-color="#A9CDEB"/><stop offset=".7" stop-color="#C7B5E9"/><stop offset="1" stop-color="#F4C6DA"/></linearGradient><radialGradient id="${uid}-glow"><stop stop-color="#FFFBE0"/><stop offset=".45" stop-color="#AADAD9"/><stop offset="1" stop-color="#6884B0"/></radialGradient></defs>`;
    const gold=["#D4BA79","#977745","#F2DDA0"], aurora=`url(#${uid}-aurora)`;
    if (id === "puzzle_crystal") {
      body += box(-w/2,-d,w,d,0,7,gold)+box(-19,-d+6,38,d-12,7,7)+box(-4,-d/2-4,8,8,14,22,gold);
      const tip=[0,-d/2,84],bottom=[0,-d/2,30],a=[-19,-d/2,52],b=[0,-d/2-15,55],c=[19,-d/2,52],e=[0,-d/2+15,48];
      for(const [v,col] of [[[a,b,tip],"#B9E7DF"],[[b,c,tip],"#A6BDE3"],[[c,e,tip],"#D8BAE3"],[[e,a,tip],"#DAF5ED"],[[a,b,bottom],"#86AFBD"],[[b,c,bottom],"#8094C0"],[[c,e,bottom],"#AA93C3"],[[e,a,bottom],"#B8D5D9"]])body+=poly(v,col);
      // まわりに うかぶ ほし（キラキラ）は 描かない（UI-66）
      body+=ring(0,-d/2,48,26,8,-12);
    } else if(id === "puzzle_aquarium") {
      for(const x of [-w/2+8,w/2-15])body+=box(x,-d+8,7,d-16,0,18,gold);
      body+=box(-w/2,-d,w,d,17,13)+box(-w/2-2,-d-2,w+4,d+4,30,4,gold);
      body+=box(-w/2+4,-d+4,w-8,d-8,34,70,[aurora,"#92B9CF","#D8ECE9"]);
      body+=box(-w/2,-d,7,d,33,75,gold)+box(w/2-7,-d,7,d,33,75,gold);
      const q=pt(-w/2+7,1,37),sx=(opts.flip?-1:1)*HomeDesign.A,sy=HomeDesign.B;
      body+=`<g transform="matrix(${sx} ${sy} 0 -1 ${q.x} ${q.y})"><path d="M0,0 V56 Q${w/2-7},101 ${w-14},56 V0 Z" fill="${aurora}" fill-opacity=".75" stroke="#E6CE91" stroke-width="4"/>`;
      for(const [x,z,r]of[[25,35,12],[62,47,10],[78,19,7]])body+=`<path d="M${x-r},${z} Q${x-r},${z+20} ${x},${z+20} Q${x+r},${z+20} ${x+r},${z} Z" fill="#F4EAFE" stroke="#63597F" stroke-width="1.2"/>${[-.5,0,.5].map(n=>`<path d="M${x+n*r},${z} q-4,-7 0,-12" fill="none" stroke="#F4EAFE" stroke-width="2"/>`).join("")}<circle cx="${x+r*.25}" cy="${z+9}" r="2" fill="#FFFDF4"/>`;
      body+=`<path d="M10,10 Q32,3 46,10 T${w-24},9" fill="none" stroke="#F9F2C8" stroke-width="3"/></g>`;
      body+=orb(-w/2,-d,115,5,"#C1DADA")+orb(w/2,-d,115,5,"#D4B8DC"); // すいそうの うえに うかぶ ほしは 描かない（UI-66）
    } else if(id === "puzzle_swing") {
      for(const x of [-w/2+8,w/2-16])body+=box(x,-d+12,8,d-24,0,7,gold)+box(x,-d/2-4,8,8,7,h-25,gold);
      body+=ring(0,-d/2,h-53,w*.43,45,0);
      body+=line([[-36,-d/2,42],[-36,-d/2,h-35]],"#E6D69C",2)+line([[36,-d/2,42],[36,-d/2,h-35]],"#E6D69C",2);
      const q=pt(0,-d/2,69);points.push({x:q.x-55,y:q.y-61},{x:q.x+55,y:q.y+60});
      body+=`<path d="M${q.x+32},${q.y-52} a57,57 0 1 0 0,104 a47,47 0 0 1 0,-104" fill="${aurora}" stroke="${INK}" stroke-width="2.2"/>`;
      body+=box(-38,-d/2-17,76,36,28,9,gold)+box(-33,-d/2-14,66,30,37,11,["#C4B2DC","#9185AC","#E6D6F0"]);
      for(const [x,z]of[[-48,h-13],[0,h-2],[49,h-18]])body+=line([[x,-d/2,h-3],[x,-d/2,z-17]])+star(x,-d/2,z-20,7);
    } else if(id === "puzzle_piano") {
      for(const [x,y]of[[-70,-96],[61,-92],[-65,-55],[64,-55]])body+=box(x,y,9,9,0,45,gold)+orb(x+4,y+4,5,5,"#384661");
      body+=box(-w/2,-d,w,d-48,44,25)+box(-w/2-3,-d-2,w+6,d-46,69,5,gold);
      body+=poly([[-w/2,-d,76],[w/2,-d,76],[w*.43,-d*.63,h],[w*.15,-60,h-8],[-w/2,-48,76]],aurora,2.5);
      body+=line([[w/2-16,-32,75],[w/2-16,-32,126]],"#D1B46D",3);
      for(let i=0;i<25;i++){const x=-w/2+10+i*(w-20)/25;body+=box(x,-47,(w-20)/25-1,19,53,6,["#E9DECB","#BCAD90","#FFFBEE"]);if(i%7!==2&&i%7!==6)body+=box(x+3,-46,3.4,11,59,4,["#38405C","#222D49","#67738E"]);}
      body+=box(-31,-29,62,28,0,23,gold)+box(-35,-33,70,33,23,7,["#B5B3DB","#7D80A9","#DED7EC"]);
      // ふたの うえに うかぶ ほし（キラキラ）は 描かない（UI-66）
    } else {
      const disk=(rx,ry,z)=>Array.from({length:24},(_,i)=>[Math.cos(i/24*Math.PI*2)*rx,-d/2+Math.sin(i/24*Math.PI*2)*ry,z]);
      body+=poly(disk(w/2,d/2,0),"#374461",2)+poly(disk(w/2,d/2,12),"#D9C384",2)+poly(disk(w/2-8,d/2-7,15),"#546381",2);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;body+=star(Math.cos(a)*(w/2-15),-d/2+Math.sin(a)*(d/2-12),17,4);}
      body+=box(-10,-d/2-10,20,20,16,65,gold)+ring(0,-d/2,118,97,34,-26)+ring(0,-d/2,118,92,35,40)+ring(0,-d/2,118,82,80,12);
      body+=orb(0,-d/2,118,35,`url(#${uid}-glow)`);
      body+=orb(-78,-d/2,142,15,"#E5B7CC")+orb(64,-d/2,78,19,"#B7DAB9")+orb(37,-d/2,194,13,"#DEBC7E");
      body+=ring(64,-d/2,78,26,7,-20); // わの うえと なかに うかぶ ほしは 描かない（UI-66。だいの ほしの もようは のこす）
    }
    const x=Math.min(...points.map(p=>p.x))-7,y=Math.min(...points.map(p=>p.y))-7,ww=Math.max(...points.map(p=>p.x))-x+7,hh=Math.max(...points.map(p=>p.y))-y+7;
    return {x,y,w:ww,h:hh,footW:opts.flip?d:w,footD:opts.flip?w:d,height:h,full:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${ww} ${hh}">${body}</svg>`};
  },
  draw(ctx, id, r, t, active=false) {
    // キャッシュ画像の上に描く うごく ぶぶん（てんきゅうぎの わくせい・すいぞくかんの あわ）。時刻をSVGキャッシュのキーにはしない。
    // まわりで ちらちら ひかる ほしは 描かない（UI-66。オーナーの FB「お家でのレアアイテムの周囲のキラキラを消す」・UI-50 の のこり）
    ctx.save();
    if(id==="puzzle_orrery"||id==="puzzle_aquarium")for(let i=0;i<3;i++){
      const a=t*(active?1.5:.45)+i*Math.PI*2/3,x=r.x+r.w*.5+Math.cos(a)*r.w*.23,y=r.y+r.h*.48+Math.sin(a)*r.h*.10;
      ctx.globalAlpha=.8;ctx.fillStyle=["#F7D2DF","#CBF2D4","#FFE2A1"][i];ctx.beginPath();ctx.arc(x,y,Math.max(2,r.w*.016),0,7);ctx.fill();
    }
    ctx.restore();
  },
};
for(const p of PUZZLE_PRIZES){
  const f={id:p.id,name:p.name,price:0,rare:true,puzzlePrize:true,kind:"floor",w:p.w,h:p.h,depth:p.d,comfort:5,interactive:true,desc:p.desc};
  FURNITURE.push(f);FURN_INDEX[f.id]=f;
  FURN_ART[f.id]=()=>PuzzlePrizeArt.model(f.id).full;
}
