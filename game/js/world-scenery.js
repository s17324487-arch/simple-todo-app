// 静止画は有限個の SVG、動く部分は canvas。時間を画像キャッシュのキーにしない。
const WorldScenery = {
  at(map, x, y) { return (map.def.objects || []).find(o => o.text && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h); },
  activate(sc, o) {
    if(o.festival){Seasonal.open();return;}
    sc.objectActive = { id: o.id, until: G.t + 5 };
    Sound.se(o.kind === "fountain" ? "heal" : "sparkle");
    sc.party.forEach(w => { w.hop = .35; sc.addFx("note", w); });
    UI.toast(Seasonal.collect(sc.mapId,o)||o.text, "good");
  },
  draw(ctx, s, ox, oy) {
    const o=s.o; if(!o) return;
    if(!WorldArt[o.kind])return;
    const a=WorldArt[o.kind]();
    const x=ox+o.x*TS+(o.w*TS-a.w)/2, y=oy+(o.y+o.h)*TS-a.h;
    if(x>G.W+80||x+a.w< -80||y>G.H+80||y+a.h< -80)return;
    const active=!!o.id && G.scene.objectActive?.id===o.id && G.scene.objectActive.until>G.t;
    const t=G.t*(active?2.2:1), line=(pts,col="#FFF6D9",width=2)=>{ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();pts.forEach(([xx,yy],i)=>i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy));ctx.stroke();};
    ctx.save();ctx.translate(x,y);ctx.lineCap="round";ctx.lineJoin="round";
    if(o.kind==="fountain") {
      ctx.strokeStyle=active?"#FAF2C0":"#ECFBFF";ctx.lineWidth=2.3;
      for(let i=0;i<7;i++){
        const p=(G.t*.8+i/7)%1, spread=(i-3)*7, lift=active?60:36;
        const px=48+spread*p,py=32-lift*Math.sin(p*Math.PI)+p*26;
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+spread*.035,py+3);ctx.stroke();
      }
      for(let i=0;i<3;i++){const p=(G.t*.6+i/3)%1;ctx.globalAlpha=1-p;ctx.beginPath();ctx.ellipse(48,62,9+p*28,3+p*8,0,0,7);ctx.stroke();}ctx.globalAlpha=1;
    } else if(o.kind==="windmill"||o.kind==="waterwheel") {
      ctx.save();ctx.translate(32,o.kind==="windmill"?32:36);ctx.rotate(t*.6);ctx.strokeStyle=INK;ctx.lineWidth=2;
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillStyle=o.kind==="windmill"?"#FFF0D0":"#BC8B61";ctx.beginPath();ctx.rect(2,-6,27,10);ctx.fill();ctx.stroke();}
      ctx.fillStyle="#EFC58D";ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.stroke();ctx.restore();
    } else if(o.kind==="swing") {
      const dx=Math.sin(t*2)*10;
      line([[18,12],[18+dx,44]],INK);line([[46,12],[46+dx,44]],INK);
      ctx.fillStyle="#ECAAAB";ctx.strokeStyle=INK;U.rr(ctx,13+dx,42,38,7,3);ctx.fill();ctx.stroke();
    } else if(o.kind==="clocktower") {
      ctx.save();ctx.translate(16,19);ctx.rotate(t*.05);line([[0,0],[0,-7]],INK);ctx.rotate(t*.4);line([[0,0],[6,0]],INK);ctx.restore();
    } else if(o.kind==="signal") {
      const green=Math.floor(G.t/6)%2===0;ctx.fillStyle=green?"#A0E2B4":"#F1A3A3";ctx.beginPath();ctx.arc(16,green?29:12,5,0,7);ctx.fill();
    } else if(o.kind==="lighthouse") {
      const spread=Math.sin(t*.8)*45;ctx.fillStyle="rgba(255,246,182,.35)";ctx.beginPath();ctx.moveTo(32,22);ctx.lineTo(32+spread-24,-8);ctx.lineTo(32+spread+24,-8);ctx.closePath();ctx.fill();
      ctx.fillStyle="#FFF0AA";ctx.beginPath();ctx.arc(32,22,5+Math.sin(t)*2,0,7);ctx.fill();
    } else if(o.kind==="railway") {
      ctx.save();ctx.beginPath();ctx.rect(0,0,256,32);ctx.clip();
      const tx=(G.t*26)%470-190;
      this.vehicle(ctx,"train",tx,7,.65);ctx.restore();
    } else if(o.kind==="windsock") {
      const k=Math.sin(t*3)*5;ctx.fillStyle="#E99C8C";ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(11,7);ctx.lineTo(31,10+k);ctx.lineTo(31,16+k);ctx.lineTo(11,21);ctx.closePath();ctx.fill();ctx.stroke();line([[19,9],[19,18]],"#FFF",3);
    } else if(o.kind==="glowstone") {
      ctx.globalAlpha=.2+Math.sin(t*2)**2*.4;ctx.fillStyle="#D7C3FF";ctx.beginPath();ctx.ellipse(32,30,30,24,0,0,7);ctx.fill();
    } else if(o.kind==="crane") {
      const swing=Math.sin(t)*6;line([[66,8],[66+swing,50]],INK);ctx.fillStyle="#D3B08C";ctx.strokeStyle=INK;ctx.fillRect(53+swing,50,25,18);ctx.strokeRect(53+swing,50,25,18);
    } else if(o.kind==="minecart") {
      const xx=5+Math.sin(t)*4;ctx.fillStyle="#BAACA0";ctx.strokeStyle=INK;ctx.lineWidth=2;U.rr(ctx,xx,16,48,21,4);ctx.fill();ctx.stroke();for(const wx of [xx+8,xx+40]){ctx.beginPath();ctx.arc(wx,40,5,0,7);ctx.fillStyle="#666B79";ctx.fill();ctx.stroke();}
    } else if(o.kind==="sailboat") {
      ctx.save();ctx.translate(48,39);ctx.rotate(Math.sin(t)*.035);ctx.fillStyle="#FFF0D0";ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-36);ctx.lineTo(-2,-3);ctx.lineTo(27,-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    } else if(o.kind==="floatplane") {
      const yy=Math.sin(t)*2;line([[15,23+yy],[15,39+yy]],INK,3);line([[9,31+yy],[21,31+yy]],INK,2);
    }
    if(o.text){ctx.globalAlpha=1;ctx.fillStyle=active?"#FFD36F":"#FFF7DF";ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(a.w/2,-5+Math.sin(G.t*2)*1.5,6,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.font="bold 9px sans-serif";ctx.textAlign="center";ctx.fillText(active?"♪":"！",a.w/2,-2+Math.sin(G.t*2)*1.5);}
    ctx.restore();
  },
  vehicle(ctx, kind, x, y, scale=1) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=INK;ctx.lineWidth=2;
    const rect=(x,y,w,h,c,r=6)=>{ctx.fillStyle=c;U.rr(ctx,x,y,w,h,r);ctx.fill();ctx.stroke();};
    if(kind==="train") {
      for(let i=0;i<3;i++){rect(i*86,0,82,43,"#F6EFE2");rect(i*86+6,7,66,21,"#A9D8E3",3);ctx.fillStyle="#8DB8AA";ctx.fillRect(i*86+2,31,78,7);for(const xx of [14,68]){ctx.fillStyle="#666B79";ctx.beginPath();ctx.arc(i*86+xx,46,5,0,7);ctx.fill();}}
    } else if(kind==="ferry") {
      rect(36,0,178,58,"#FFF5DC",12);rect(58,-15,115,22,"#B7D8DF");for(let i=0;i<3;i++)rect(58+i*49,15,34,23,"#AEDAE6");ctx.fillStyle="#8BBCCB";ctx.beginPath();ctx.moveTo(0,48);ctx.lineTo(254,48);ctx.lineTo(229,86);ctx.lineTo(30,86);ctx.closePath();ctx.fill();ctx.stroke();
    } else {
      ctx.fillStyle="#D6DCEC";ctx.beginPath();ctx.moveTo(73,32);ctx.lineTo(114,-33);ctx.lineTo(145,-33);ctx.lineTo(135,38);ctx.lineTo(160,89);ctx.lineTo(127,89);ctx.lineTo(87,41);ctx.closePath();ctx.fill();ctx.stroke();rect(0,0,255,48,"#FFF4D7",24);for(let i=0;i<3;i++)rect(47+i*49,7,35,26,"#B6DDE7");ctx.fillStyle="#A7B5D2";ctx.fillRect(26,37,178,6);
    }
    ctx.restore();
  },
};

(() => {
  const rect=(x,y,w,h,c,r=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}" ${OS(2)}/>`;
  const path=(d,c)=>`<path d="${d}" fill="${c}" ${OS(2)}/>`;
  const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${OS(2)}/>`;
  const defs={
    swing:[64,58,path("M7,55 L16,8 L48,8 L58,55 M10,11 L55,11","none")],
    windmill:[64,85,path("M13,82 L21,27 L43,27 L51,82 Z","#F2D8B1")+path("M16,27 L32,9 L48,27 Z","#C99C9D")+rect(27,58,12,24,"#A6CED4")],
    waterwheel:[64,64,rect(13,12,38,47,"#D9C3A7")+circle(32,36,26,"#B78B65")+circle(32,36,21,"#DFBC8E")],
    clocktower:[32,85,rect(11,32,10,48,"#A5B9B0")+rect(6,76,20,7,"#7D9B92")+circle(16,19,15,"#E4C4A0")+circle(16,19,11,"#FFFAE9")],
    signal:[32,65,rect(13,38,6,25,"#919BA4")+rect(6,2,20,38,"#626F7B")+circle(16,12,5,"#855D60")+circle(16,29,5,"#627F72")],
    lighthouse:[64,112,path("M12,109 L21,34 L43,34 L53,109 Z","#FFF3DD")+path("M18,58 L46,58 L49,76 L15,76 Z","#DCA09E")+rect(18,12,28,25,"#BADFE6")+path("M12,12 L32,1 L52,12 Z","#9DAFC6")+rect(25,85,14,24,"#A3B9C9")],
    railway:[256,32,rect(0,0,256,32,"#D0C8BD",0)+Array.from({length:26},(_,i)=>path(`M${i*10},4 V28`,"none")).join("")+path("M0,8 H256 M0,25 H256","none")],
    flowercart:[64,55,circle(13,48,6,"#A89A8F")+circle(52,48,6,"#A89A8F")+rect(5,25,54,20,"#D4B493")+path("M7,27 V8 H57 V27","none")+path("M2,10 L10,1 H54 L62,10 Z","#EAAFC0")+[14,31,48].map((x,i)=>`<path d="M${x},30 V19" stroke="#708F61" stroke-width="2"/>${flowerSvg(x,19,5,["#F0ABBE","#EED17B","#C6B1DB"][i],"#E7BB6D",1.3)}`).join("")],
    crane:[96,105,rect(13,15,13,87,"#CFB77E")+path("M5,20 L25,5 L87,5 L87,18 Z","#E4CA8D")+rect(7,42,25,19,"#B9D7DA")+path("M15,67 L25,79 L15,92","none")],
    sailboat:[96,64,path("M3,40 L93,40 L78,59 L22,59 Z","#A7BBCD")+path("M46,40 V2","none")],
    floatplane:[128,64,path("M48,33 L70,2 L89,2 L77,37 L89,59 L73,59 Z","#C6CCDF")+rect(15,22,107,22,"#FFF0CB",11)+rect(72,26,22,12,"#B2D9E1")+path("M30,52 L109,52","none")],
    telescope:[32,54,path("M8,52 L17,29 L26,52","none")+path("M5,14 L26,3 L30,16 L9,27 Z","#ADC7CB")],
    windsock:[32,64,path("M10,2 V61 M3,62 H19","none")],
    controltower:[64,126,rect(21,39,22,83,"#D2D5CF")+rect(4,13,56,28,"#B4DAE5")+path("M0,13 L9,3 H56 L64,13 Z","#A1ADBA")+path("M19,15 V38 M44,15 V38 M32,3 V0","none")],
    parasol:[64,67,path("M32,22 V62","none")+path("M2,26 Q32,-16 62,26 Q47,36 32,26 Q17,36 2,26 Z","#ECB4B2")+rect(9,52,24,8,"#E8D1A5")],
    glowstone:[64,58,path("M8,49 L5,25 L17,16 L29,27 L29,49 Z","#BDCFDC")+path("M26,52 L26,15 L39,2 L52,19 L55,51 Z","#C6B1DA")],
    minecart:[64,51,path("M0,46 H64 M0,50 H64","none")],
    vending:[32,49,rect(2,1,28,46,"#B5C6DB")+rect(5,6,21,23,"#F5ECD7")+[10,17,24].map(x=>rect(x-4,11,5,13,["#EAA9A5","#B1CDA4","#DFCCA0"][Math.floor(x/7)-1],1)).join("")+rect(7,35,17,5,"#7B898B",1)],
    bicycles:[64,32,[0,27].map(x=>circle(x+9,24,7,"#E4E2D6")+circle(x+29,24,7,"#E4E2D6")+path(`M${x+9},24 L${x+16},11 L${x+29},24 H${x+9} M${x+16},11 H${x+23} L${x+29},24 M${x+23},11 V7 H${x+28}`,"none")).join("")],
    busstop:[64,64,rect(4,9,56,43,"#C0D8D9")+rect(0,2,64,11,"#92B5A7")+path("M6,52 V62 M58,52 V62 M32,14 V51","none")+rect(8,43,48,7,"#DEBF98")+rect(41,18,13,17,"#FFF2CC")],
  };
  for(const [kind,[w,h,svg]] of Object.entries(defs)) WorldArt[kind]=()=>({w,h,svg});
  SIGN_ICON.train=(x,y)=>rect(x-10,y-8,20,15,"#B8DADB")+path(`M${x-7},${y+10} L${x-4},${y+6} M${x+7},${y+10} L${x+4},${y+6}`,"none");
  SIGN_ICON.ferry=(x,y)=>path(`M${x-11},${y} H${x+11} L${x+6},${y+8} H${x-6} Z`,"#9AC4D5")+rect(x-6,y-7,12,7,"#FFF0D0");
  SIGN_ICON.plane=(x,y)=>path(`M${x-11},${y} L${x+11},${y} M${x-3},${y} L${x+2},${y-9} M${x-3},${y} L${x+2},${y+9}`,"none");
  const building=WorldArt.building;
  WorldArt.building=function(sp){
    if(!sp.terminal)return building(sp);
    const w=sp.w*TS,h=sp.h*TS,dx=(sp.door+.5)*TS;
    let svg=rect(4,14,w-8,h-16,"#ECE5D7",5)+rect(0,6,w,17,sp.roof,5);
    for(let x=10;x<w-10;x+=26)svg+=rect(x,29,22,Math.max(16,h-61),"#B7DCE5",2);
    svg+=rect(dx-17,h-37,34,34,"#7EADB9",3)+path(`M${dx},${h-36} V${h-4}`,"none")+rect(w/2-24,3,48,26,"#FFF1CF",7)+SIGN_ICON[sp.sign](w/2,16);
    return {w,h,svg};
  };
})();
