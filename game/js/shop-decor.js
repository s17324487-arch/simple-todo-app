// お店の成長を3段階の飾りで見せる。元の建物・見本素材・通行判定はそのまま。
const ShopDecor={
  tier(lv){return lv>=5?5:lv>=3?3:1;},
  level(shop){return this.tier(Save.d?.shops?.[shop]?.lv||1);},
  options(kind,sp){return kind==='building'?{...sp,shopTier:sp.act?.type==='work'?this.level(sp.act.shop):1}:sp;},
  star(x,y,r){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?.44:1;d+=(i?' L':'M')+(x+Math.cos(a)*r*k).toFixed(1)+','+(y+Math.sin(a)*r*k).toFixed(1);}return `<path d="${d} Z" fill="#EEC86D" stroke="${INK}" stroke-width="1.2"/>`;},
  exterior(lv,w,h){
    const tier=this.tier(lv);if(tier===1)return '';
    const k=w/200,y=h*.15,plaqueX=w*.83,stars=tier===5?3:1;let s=`<g data-shop-level="${tier}" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"><path d="M${plaqueX-16*k},${y+7*k} V${h*.42} M${plaqueX+16*k},${y+7*k} V${h*.42}" stroke="#778D8C" stroke-width="${2*k}"/><rect x="${plaqueX-24*k}" y="${y-10*k}" width="${48*k}" height="${20*k}" rx="${7*k}" fill="#FFF0CD" stroke-width="1.5"/>`;
    for(let i=0;i<stars;i++)s+=this.star(plaqueX+(i-(stars-1)/2)*15*k,y,5*k);
    for(const x of [w*.13,w*.87]){const py=h-18; s+=`<path d="M${x-9*k},${py} h${18*k} l${-3*k},${14*k} h${-12*k} Z" fill="#BC927D" stroke-width="1.3"/>`;
      for(const dx of [-5,0,5])s+=`<path d="M${x},${py} L${x+dx*k},${py-13*k}" fill="none" stroke="#789971" stroke-width="2"/>`+flowerSvg(x+dx*k,py-14*k,3*k,dx?'#D9A7B4':'#EDD38E','#F1E6BC',.8);}
    if(tier===5){s+=`<path d="M${w*.07},${h*.42} Q${w/2},${h*.56} ${w*.93},${h*.42}" fill="none" stroke-width="1.5"/>`;for(let i=0;i<9;i++){const t=i/8,x=w*(.07+.86*t),fy=h*(.42+.07*4*t*(1-t));s+=`<path d="M${x-6*k},${fy} L${x+6*k},${fy} L${x},${fy+11*k} Z" fill="${['#B2C7BC','#DBA9B5','#E4C894'][i%3]}" stroke-width="1"/>`;}}
    return s+'</g>';
  },
  overlay(ctx,lv,x,y,w,h){
    const tier=this.tier(lv);if(tier===1)return;
    const c=SvgCache.get('shop-decor:'+tier+':'+w+':'+h,()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${this.exterior(tier,w,h)}</svg>`,Math.ceil(w*G.px),Math.ceil(h*G.px));if(c)ctx.drawImage(c,x,y,w,h);
  },
  store(ctx,lv){
    const tier=this.tier(lv);if(tier===1)return;
    const c=SvgCache.get('shop-decor:store:'+tier,()=>{
      let body='<rect x="150" y="17" width="52" height="16" rx="6" fill="#FFF1D0" stroke="'+INK+'" stroke-width="1.2"/>';
      const n=tier===5?3:1;for(let i=0;i<n;i++)body+=this.star(176+(i-(n-1)/2)*15,25,5);
      for(const x of [26,326])body+='<path d="M'+(x-8)+',99 h16 l-3,10 h-10 Z" fill="#C39B83" stroke="'+INK+'" stroke-width="1.2"/>'+flowerSvg(x,94,4,'#DDB0BC','#E6CC86',1);
      if(tier===5){body+='<path d="M103,79 Q176,98 249,79" fill="none" stroke="'+INK+'" stroke-width="1"/>';for(let i=0;i<9;i++){const t=i/8,x=107+138*t,y=80+8*4*t*(1-t);body+='<path d="M'+(x-4)+','+y+' h8 l-4,7 Z" fill="'+['#ACC7B5','#DFB0BD','#E8CE94'][i%3]+'" stroke="'+INK+'" stroke-width=".7"/>';}}
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 112">'+body+'</svg>';
    },Math.ceil(352*G.px),Math.ceil(112*G.px));if(c)ctx.drawImage(c,0,0,352,112);
  },
  interior(ctx,lv,w,bottom){
    const tier=this.tier(lv);if(tier===1)return;ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=1.5;
    ctx.fillStyle='#FFF1D0';U.rr(ctx,15,42,78,27,8);ctx.fill();ctx.stroke();
    const n=tier===5?3:1;for(let i=0;i<n;i++){const x=54+(i-(n-1)/2)*21;ctx.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?3.6:8;const px=x+Math.cos(a)*r,py=55+Math.sin(a)*r;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle='#EBC569';ctx.fill();ctx.stroke();}
    for(const x of [15,w-15]){ctx.fillStyle='#A8C19A';for(const dx of [-6,0,6]){ctx.beginPath();ctx.ellipse(x+dx,bottom-18-Math.abs(dx),4,9,dx*.1,0,7);ctx.fill();ctx.stroke();}ctx.fillStyle='#C59B88';U.rr(ctx,x-10,bottom-14,20,13,3);ctx.fill();ctx.stroke();}
    if(tier===5){ctx.beginPath();ctx.moveTo(10,78);ctx.quadraticCurveTo(w/2,111,w-10,78);ctx.stroke();for(let i=0;i<12;i++){const t=i/11,x=12+t*(w-24),y=78+16*4*t*(1-t);ctx.fillStyle=['#B1CABB','#DFB0B8','#E8D097'][i%3];ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.lineTo(x,y+11);ctx.closePath();ctx.fill();ctx.stroke();}}
    ctx.restore();
  },
};
(() => {const original=WorldArt.building;WorldArt.building=sp=>{const a=original(sp);return {...a,svg:a.svg+ShopDecor.exterior(sp.shopTier||1,a.w,a.h)};};})();
