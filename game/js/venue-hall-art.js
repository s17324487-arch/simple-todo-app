// 屋内の床・什器。SVGは種類ごとに有限キャッシュ、動きはCanvasだけで描く。
const VenueHallArt={
  svg(kind){
    const r=(x,y,w,h,c,rx=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" stroke="${INK}" stroke-width="1.7"/>`,p=(d,c='none')=>`<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>`,c=(x,y,z,col)=>`<circle cx="${x}" cy="${y}" r="${z}" fill="${col}" stroke="${INK}" stroke-width="1.4"/>`;
    let a='';
    if(kind==='blackboard')a=r(3,5,122,60,'#BCA279')+r(8,10,112,46,'#466960')+r(0,63,128,5,'#D3BE99')+'<g stroke="#F5EFDB" fill="none" stroke-width="2"><path d="M16 22h26m-26 9h38m-38 9h29M75 20v22m-10-11h20M98 20l17 22m0-22-17 22"/></g>'+r(99,59,18,4,'#FAF5DF');
    else if(kind==='desk')a=p('M15 44v28m98-28v28M21 27v37m86-37v37')+r(5,19,118,30,'#D9B88A')+r(22,23,43,22,'#FFF9E8')+p('M44 24v19m-16-13h12m-12 6h12m9-6h12m-12 6h12')+r(84,23,22,5,'#8FB6B1')+r(38,54,48,12,'#B8C7B1')+p('M43 65v10m36-10v10');
    else if(kind==='shelf'||kind==='shoes'){
      a=r(4,1,120,73,'#BCA17C');for(let y=7;y<64;y+=20)for(let x=10;x<114;x+=24){a+=r(x,y,20,16,'#73644E');a+=kind==='shoes'?p(`M${x+2} ${y+12}q4-12 9-2l7 1v4h-16Z`,'#E7D5C5'):r(x+2,y+3,5,12,'#B0C9BE')+r(x+8,y+1,5,14,'#DEB999')+r(x+14,y+4,4,11,'#C5B8D4');}
    }else if(kind==='toys')a=r(5,38,117,35,'#DAC5A5')+c(25,35,14,'#B1CDBA')+c(25,22,8,'#B1CDBA')+c(19,17,4,'#B1CDBA')+c(31,17,4,'#B1CDBA')+p('M43 40l15-25 16 25Z','#E5B28D')+r(82,16,20,22,'#A3BECE')+c(101,36,11,'#E8C77C')+p('M13 55h101');
    else if(kind==='mat')a=p('M3 24L106 9 126 54 24 73Z','#E6CEBF')+p('M14 29L99 17 112 47 30 60Z','#B7CBBE')+r(14,23,38,14,'#FFF4D9')+p('M58 22l10 10-9 10-10-10Z','#E7C986');
    else if(kind==='easel')a=p('M28 74L47 5m30 0 24 69M25 68h78')+r(18,11,93,45,'#F7E9C8')+p('M25 49l18-23 15 12 22-18 23 29Z','#A8BF94')+c(82,23,6,'#E7C882');
    else if(kind==='fountain')a='<ellipse cx="64" cy="54" rx="60" ry="22" fill="#CED5CD" stroke="'+INK+'" stroke-width="2"/><ellipse cx="64" cy="49" rx="50" ry="15" fill="#91C4D0"/>'+p('M52 48V27h24v21Z','#DDDCC9')+'<ellipse cx="64" cy="26" rx="30" ry="10" fill="#B3D4D6" stroke="'+INK+'" stroke-width="2"/>';
    else if(kind==='escalator')a=p('M4 60L80 7h42L47 69Z','#B1BCBE')+p('M8 46L82 0h6L14 52Z','#657B82')+p('M49 57L120 10v8L53 65Z','#657B82')+Array.from({length:8},(_,i)=>p(`M${16+i*9} ${56-i*6}h25`)).join('');
    else if(kind==='elevator')a=r(14,0,99,74,'#ABAEB5')+r(21,8,75,64,'#D8E0DF')+p('M58 9v61')+r(101,32,6,15,'#516D70')+c(104,35,1,'#EAD89D')+r(38,2,39,9,'#405B64');
    else if(kind==='table')a=p('M16 41v31m95-31v31')+'<ellipse cx="64" cy="32" rx="58" ry="23" fill="#D9BD92" stroke="'+INK+'" stroke-width="2"/>'+c(48,28,11,'#FFF5D8')+r(67,19,14,18,'#BACFC3')+p('M81 22q13-3 9 10h-9')+r(2,59,25,13,'#C6AAA1')+r(100,59,25,13,'#C6AAA1');
    else if(kind==='officeDesk')a=r(3,30,120,24,'#C1B49E')+p('M12 53v21m105-21v21')+r(39,2,53,32,'#6C7E87')+r(44,7,43,22,'#B1CFD2')+p('M65 33v7m-11 0h22')+r(36,43,59,6,'#DDDFDA')+r(103,22,14,20,'#A2B894');
    else if(kind==='rack')a=p('M12 74V5h104v69M6 73h13m90 0h13')+Array.from({length:4},(_,i)=>p(`M${18+i*24} 21l9-9 9 9-4 9v24h-11V30Z`,['#EABCCF','#BACCB9','#ACBDD2','#D2BBDB'][i])).join('');
    else a=r(7,25,114,48,'#D2C1A4')+r(2,17,124,12,'#EEE4D0')+p('M15 48h98m-51-17v37');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 128 82">${a}</svg>`;
  },
  floor(ctx,r,floor,time){
    const W=r.w*32,H=r.h*32;ctx.fillStyle=r.wall||'#E7E6D9';ctx.fillRect(0,0,W,H);ctx.fillStyle=r.floor||'#DBCCB4';ctx.fillRect(16,96,W-32,H-112);
    ctx.strokeStyle='#FFFFFF33';ctx.lineWidth=1;for(let y=96;y<H-16;y+=32)for(let x=16;x<W-16;x+=32){ctx.strokeRect(x,y,32,32);if(r.wood){ctx.beginPath();ctx.moveTo(x+5,y+7);ctx.lineTo(x+23,y+7);ctx.stroke();}}
    ctx.fillStyle=r.accent||'#8EA99E';ctx.fillRect(12,82,W-24,14);ctx.fillStyle=INK;ctx.textAlign='center';ctx.font='bold 19px sans-serif';ctx.fillText(r.title||'',W/2,42);ctx.font='bold 12px sans-serif';ctx.fillText(floor+'F',W/2,65);
    for(let x=48;x<W-48;x+=160){ctx.fillStyle='#B8D4D8';ctx.fillRect(x,24,62,45);ctx.strokeStyle='#F4F3DC';ctx.lineWidth=4;ctx.strokeRect(x,24,62,45);ctx.beginPath();ctx.moveTo(x+31,24);ctx.lineTo(x+31,69);ctx.stroke();}
    ctx.fillStyle='#FFF7E8';U.rr(ctx,W/2-140,20,280,47,5);ctx.fill();ctx.fillStyle=INK;ctx.font='bold 16px sans-serif';ctx.fillText(r.title||'',W/2,40,264);ctx.font='bold 12px sans-serif';ctx.fillText(floor+'F',W/2,58);
    if(r.hole){const h=r.hole,x=h.x*32,y=h.y*32,w=h.w*32,hh=h.h*32;ctx.fillStyle='#B9B3A9';ctx.fillRect(x,y,w,hh);ctx.save();ctx.translate(x+w/2-64,y+hh/2-38);const m=SvgCache.get('venue:fountain',()=>this.svg('fountain'),256,164);if(m)ctx.drawImage(m,0,0,128,82);ctx.restore();ctx.strokeStyle='#698B91';ctx.lineWidth=6;ctx.strokeRect(x,y,w,hh);ctx.strokeStyle='#D7ECE9';ctx.lineWidth=2;ctx.strokeRect(x-4,y-4,w+8,hh+8);for(let xx=x;xx<=x+w;xx+=32){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y-17);ctx.moveTo(xx,y+hh);ctx.lineTo(xx,y+hh-17);ctx.stroke();}ctx.fillStyle=INK;ctx.font='bold 12px sans-serif';ctx.fillText('1Fの ふんすい',x+w/2,y+hh/2+52);}
    if(r.zones)for(const z of r.zones){ctx.fillStyle=z.color+'44';ctx.fillRect(z.x*32,z.y*32,z.w*32,z.h*32);ctx.fillStyle=z.color;ctx.fillRect(z.x*32,z.y*32,z.w*32,4);ctx.fillStyle=INK;ctx.font='bold 13px sans-serif';ctx.fillText(z.label,(z.x+z.w/2)*32,z.y*32-9);}
  },
  fixture(ctx,f,time){
    const x=f.x*32,y=(f.y+f.h)*32,w=f.w*32,h=f.height||Math.max(44,Math.min(94,w*.64));let img;
    if(f.kind==='parent'){const look=ParentCare.look('mama');img=SvgCache.get('venue:mama:'+JSON.stringify(look),()=>ParentCare.svg('mama',look,'wave'),130,160);if(img)ctx.drawImage(img,x+w/2-27,y-65,54,67);}
    else if(f.kind==='npc'){img=SvgCache.get('venue:npc:'+f.sp,()=>Art.npcSvg({sp:f.sp||'rabbit',emo:'happy'}),80,100);if(img)ctx.drawImage(img,x+w/2-23,y-53,46,58);}
    else if(f.item){const it=VenueHalls.item(f.item),kind=f.kind==='wear'?'wear':f.kind==='bag'?'bag':'furn';ctx.fillStyle='#DDD9CC';U.rr(ctx,x,y-12,w,12,3);ctx.fill();img=SvgCache.get('venue:display:'+f.item,()=>kind==='furn'?Art.furnSvg(f.item):kind==='wear'?Chara.svg('wanko',{outfit:{[it.slot]:it.id}}):Art.iconSvg('bag',it.id),160,180);if(img)ctx.drawImage(img,x+3,y-h-8,w-6,h);}
    else{img=SvgCache.get('venue:fixture:'+f.kind,()=>this.svg(f.kind),256,164);if(img)ctx.drawImage(img,x,y-h,w,h);}
    if(f.kind==='fountain'){ctx.strokeStyle='#DEF7ED';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x+w/2,y-h*.62);ctx.quadraticCurveTo(x+w/2+Math.sin(i)*w*.22,y-h*(1+.12*Math.sin(time*3+i)),x+w/2+Math.cos(i)*w*.29,y-h*.25);ctx.stroke();}}
    if(f.kind==='escalator'){ctx.strokeStyle='#F6E9B2';ctx.lineWidth=2;for(let i=0;i<5;i++){const t=(time*.3+i*.2)%1;ctx.beginPath();ctx.moveTo(x+w*t*.7+7,y-h*t*.7-9);ctx.lineTo(x+w*t*.7+24,y-h*t*.7-9);ctx.stroke();}}
    if(f.label){ctx.font='bold 10px sans-serif';ctx.textAlign='center';const width=Math.min(w+44,Math.max(58,ctx.measureText(f.label).width+12));ctx.fillStyle='#FFF9E6';U.rr(ctx,x+w/2-width/2,y+2,width,17,4);ctx.fill();ctx.fillStyle=INK;ctx.fillText(f.label,x+w/2,y+14,width-5);}
  },
};
