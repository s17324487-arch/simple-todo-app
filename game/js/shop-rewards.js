// おてつだいの節目。セーブは受取済みIDを足すだけで、所持金には触らない。
const ShopRewards = {
  levels: [5, 10, 15, 30],
  maxLevel: 30,
  themes: {
    burger: { name: "バーガー", color: "#EDB56F", motif: "burger" },
    groom: { name: "おしゃれ", color: "#C7B3DD", motif: "scissors" },
    cake: { name: "いちごケーキ", color: "#ECB5C8", motif: "cake" },
    crepe: { name: "クレープ", color: "#F0CE92", motif: "crepe" },
    dentist: { name: "しんじゅの は", color: "#B6DDE6", motif: "tooth" },
    bakery: { name: "こんがりパン", color: "#DCB58B", motif: "bread" },
    florist: { name: "はなたば", color: "#B7D3AE", motif: "flower" },
    relay: { name: "ながれぼし", color: "#AEBFDF", motif: "star" },
    korokoro: { name: "ころころ フルーツ", color: "#F2C48D", motif: "fruit" },
  },
  prizes: [],
  level(st) {
    let lv = Math.max(1, Math.min(this.maxLevel, st.lv || 1));
    while (lv < this.maxLevel && st.rep >= SHOP_LV_REP[lv + 1]) lv++;
    return lv;
  },
  rows(shop) {
    const st = Save.d.shops[shop];
    if (!st || !this.themes[shop]) return [];
    const lv = this.level(st), claimed = Save.d.shopRewards;
    return this.prizes.filter(p => p.shop === shop).map(p => ({ ...p, ready: lv >= p.level, claimed: !!claimed[p.id] }));
  },
  claim(shop) {
    const rows = this.rows(shop).filter(p => p.ready && !p.claimed);
    for (const p of rows) {
      // 家具と受取記録を同じセーブに書く。再入場・再読み込みでも二重配布しない。
      Save.d.furn[p.id] = (Save.d.furn[p.id] || 0) + 1;
      Save.d.shopRewards[p.id] = true;
    }
    if (rows.length) { Save.mark(); Save.write(); }
    return rows;
  },
  open(selected = "burger") {
    const body = U.el("div"), select = U.el("select", { "aria-label": "ごほうびの おみせ", style: "width:100%;min-height:44px;margin-bottom:10px" });
    for (const shop of Object.keys(this.themes)) select.append(U.el("option", { value: shop, text: SHOPS[shop].name }));
    select.value = selected;
    const content = U.el("div");
    const render = () => {
      const shop = select.value, rows = this.rows(shop), lv = this.level(Save.d.shops[shop]);
      content.replaceChildren();
      content.append(U.el("div", { class: "note", text: `おみせ Lv.${lv} ／ 30　ひょうばん ${Save.d.shops[shop].rep}${lv < 30 ? " / " + SHOP_LV_REP[lv + 1] : ""}` }));
      const claim = UI.btn("ごほうびを うけとる", () => { const got = this.claim(shop); if (got.length) { Sound.se("fanfare"); UI.toast(`${got.length}こ の かぐを もらったよ！`); } render(); }, "wide yellow");
      claim.disabled = !rows.some(p => p.ready && !p.claimed); content.append(claim);
      for (const p of rows) {
        const card = U.el("div", { class: "shop-prize-card" });
        card.append(U.el("div", { class: "shop-prize-picture", html: ShopRewardArt.model(p.id).full }));
        const info = U.el("div");
        info.append(U.el("b", { text: `Lv.${p.level}　${p.name}` }), U.el("div", { class: "muted", text: p.desc }), U.el("div", { class: "note", text: p.claimed ? "うけとりずみ" : p.ready ? "うけとれるよ！" : `あと ${p.level - lv} レベル` }));
        card.append(info); content.append(card);
      }
    };
    select.addEventListener("change", render);
    body.append(U.el("p", { text: "この おてつだいだけの かぐだよ。もらった かぐは おうちの「もようがえ」で かざろう！" }), select, content);
    render(); UI.modal({ title: "おみせの ごほうび", body, cls: "full" });
  },
};

// 5以降は収入・注文の難しさを据え置き、評判による長期目標を増やす。
for (let lv = SHOP_LV_REP.length; lv <= ShopRewards.maxLevel; lv++) SHOP_LV_REP[lv] = SHOP_LV_REP[lv - 1] + 200 + lv * 40;
for (const [shop, theme] of Object.entries(ShopRewards.themes)) {
  for (const [i, level] of ShopRewards.levels.entries()) {
    const dims = [[50,34,64],[64,48,110],[100,55,130],[150,92,204]][i];
    const p = { id: `shop_${shop}_${level}`, shop, level, tier: i, name: theme.name + ["の きらめきたて", "の ほしランプ", "の たからだな", "の おおどけい"][i], w:dims[0], d:dims[1], h:dims[2], desc:["きんの ふちで かがやく おみせの しるし。", "ほしの ひかりに つつまれた ランプ。", "おみせの たからものが ならぶ ガラスだな。", "ふりこが ゆれる おおきな とけい。タップで ひかるよ。"][i] };
    ShopRewards.prizes.push(p);
    const f = { id:p.id, name:p.name, price:0, rare:true, shopPrize:true, kind:"floor", w:p.w, depth:p.d, h:p.h, comfort:5, interactive:true, desc:p.desc };
    FURNITURE.push(f); FURN_INDEX[f.id] = f;
    FURN_ART[f.id] = () => ShopRewardArt.model(f.id).full;
  }
}

// 町の家具と同じ投影。4種類の形と8種類のしるしで32個の有限モデル。
const ShopRewardArt = {
  motif(kind, color) {
    const edge = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
    const path = (d, fill) => `<path d="${d}" fill="${fill}" ${edge}/>`;
    if (kind === "burger") return path("M-23,-2 Q-22,-25 0,-25 Q22,-25 23,-2 Z", "#ECC07D")+path("M-24,0 H24 V7 H-24 Z", "#83B976")+path("M-24,8 H24 V16 Q0,25 -24,16 Z", "#C08755")+'<path d="M-11,-14 l3,-3 M1,-18 l3,2 M11,-12 l3,-2" stroke="#FFF3CC" stroke-width="3"/>';
    if (kind === "scissors") return '<g '+edge+' fill="'+color+'"><circle cx="-12" cy="14" r="9"/><circle cx="12" cy="14" r="9"/></g>'+path("M-7,8 L17,-26 L4,6 Z M7,8 L-17,-26 L-4,6 Z", "#E9ECED")+'<circle cy="3" r="3" fill="#D8BB6A"/>';
    if (kind === "cake") return path("M-22,22 V-6 Q0,-17 22,-6 V22 Z", color)+path("M-23,-6 Q0,-18 23,-6 V1 Q15,9 7,1 Q0,10 -7,1 Q-15,9 -23,1 Z", "#FFF8E6")+path("M-7,-17 Q-9,-29 0,-29 Q9,-29 7,-17 L0,-12 Z", "#E8989C");
    if (kind === "crepe") return path("M-25,-16 L0,29 L25,-16 Z", "#EED8A5")+path("M-24,-16 Q-17,-34 -9,-22 Q0,-39 9,-22 Q17,-34 24,-16 Z", "#FFF6E2")+path("M-4,-15 L-11,14 L0,28 L9,12 Z", color);
    if (kind === "tooth") return path("M0,-23 C-30,-38 -23,-7 -18,8 C-13,38 -6,29 -4,12 Q0,4 4,12 C6,29 13,38 18,8 C23,-7 30,-38 0,-23 Z", "#F8FCF6");
    if (kind === "bread") return path("M-22,23 V-8 C-32,-25 -10,-35 0,-25 C10,-35 32,-25 22,-8 V23 Z", "#C89158")+path("M-15,17 V-10 Q-18,-24 0,-17 Q18,-24 15,-10 V17 Z", "#FFF0C7");
    if (kind === "fruit") return '<circle cx="-10" cy="8" r="13" fill="#A7D98F" '+edge+'/><circle cx="12" cy="9" r="12" fill="#E9525A" '+edge+'/><circle cx="1" cy="-12" r="11" fill="#FADA78" '+edge+'/><circle cx="-3" cy="-12" r="1.6" fill="'+INK+'"/><circle cx="5" cy="-12" r="1.6" fill="'+INK+'"/>'+path("M-2,-7 q3,-2 6,0 q-1,3 -3,3 q-2,0 -3,-3Z", "#F29A1F")+'<path d="M12,-3 q2,-6 6,-8" stroke="#7A5634" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    if (kind === "flower") return '<path d="M0,27 V-8 M0,16 Q-22,0 -18,18 Z" stroke="#568761" fill="#A7C695" stroke-width="3"/>'+[0,1,2,3,4].map(i=>`<ellipse cx="0" cy="-18" rx="10" ry="15" transform="rotate(${i*72} 0 -6)" fill="${i%2?color:"#EBC5CE"}" ${edge}/>`).join('')+'<circle cy="-6" r="8" fill="#ECD693" '+edge+'/>';
    return path("M0,-29 L8,-10 L28,-9 L13,5 L18,25 L0,14 L-18,25 L-13,5 L-28,-9 L-8,-10 Z", "#F0D88F")+'<path d="M-32,13 l-13,10 M-28,25 l-10,10" stroke="'+color+'" stroke-width="4"/>';
  },
  model(id, opts = {}) {
    const f=ShopRewards.prizes.find(p=>p.id===id), theme=ShopRewards.themes[f.shop], {w,d,h,tier}=f, points=[];
    const pt=(x,y,z=0)=>{const p=opts.flip?HomeDesign.project(y+d/2,x-w/2,z):HomeDesign.project(x,y,z);points.push(p);return p;};
    const poly=(vs,c)=>HomeDesign.poly(vs.map(v=>pt(...v)),c,1.7);
    const box=(x,y,ww,dd,z,hh,c=theme.color)=>poly([[x,y+dd,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],c)+poly([[x+ww,y,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x+ww,y,z+hh]],"#9A8264")+poly([[x,y,z+hh],[x+ww,y,z+hh],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],"#F3E4BA");
    const face=(x,y,z,scale,art)=>{const p=pt(x,y,z);points.push({x:p.x-35*scale,y:p.y-40*scale},{x:p.x+35*scale,y:p.y+40*scale});return `<g transform="matrix(${(opts.flip?-1:1)*HomeDesign.A*scale} ${HomeDesign.B*scale} 0 ${scale} ${p.x} ${p.y})">${art}</g>`;};
    const emblem=(x,y,z,s=1)=>face(x,y,z,s,this.motif(theme.motif,theme.color));
    let body=box(-w/2,-d,w,d,0,9,"#BEA15E");
    if(tier===0){
      body+=box(-w/2+4,-d+8,w-8,8,9,h-13)+emblem(0,-d+17,37,.58);
      body+=box(-w/2+3,-d+5,w-6,13,h-5,5,"#DEC88A");
    }else if(tier===1){
      body+=box(-5,-d/2-5,10,10,9,42,"#BCA46C")+box(-w/2+3,-d+3,w-6,d-6,51,7,"#E8D49E");
      body+=box(-w/2+7,-d+7,w-14,d-14,58,44,"#E5EBCF")+emblem(0,-3,80,.66);
      body+=box(-w/2+3,-d+3,w-6,d-6,102,8,"#DBC78F");
    }else if(tier===2){
      body+=box(-w/2+4,-d+5,w-8,10,9,h-14);
      for(const x of [-w/2+4,w/2-11])body+=box(x,-d+6,7,d-12,9,h-20,"#C6B17A");
      for(const z of [20,70,120])body+=box(-w/2+3,-d+3,w-6,d-6,z,5,"#E7D5A3");
      for(const z of [46,97])for(const x of [-24,24])body+=emblem(x,-12,z,.5);
      body+=poly([[-w/2+12,-5,28],[w/2-12,-5,28],[w/2-12,-5,118],[-w/2+12,-5,118]],"#E4F8F433");
    }else{
      body+=box(-w/2+14,-d+12,w-28,d-24,9,h-43);
      body+=box(-w/2+6,-d+4,w-12,d-8,h-34,13,"#D7BD79");
      body+=poly([[-w/2+4,-d+4,h-21],[w/2-4,-d+4,h-21],[0,-d/2,h]],"#F1DEA6");
      body+=face(0,-10,h-72,1,'<circle r="36" fill="#FCF5DC" stroke="'+INK+'" stroke-width="3"/>'+Array.from({length:12},(_,i)=>`<path d="M0,-28 V-32" transform="rotate(${i*30})" stroke="#977A43" stroke-width="2"/>`).join('')+'<path d="M0,-23 V0 L18,10" stroke="'+INK+'" fill="none" stroke-width="3"/>');
      body+=emblem(0,-10,58,.86);
    }
    const x=Math.min(...points.map(p=>p.x))-6,y=Math.min(...points.map(p=>p.y))-6,ww=Math.max(...points.map(p=>p.x))-x+6,hh=Math.max(...points.map(p=>p.y))-y+6;
    return {x,y,w:ww,h:hh,footW:opts.flip?d:w,footD:opts.flip?w:d,height:h,full:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${ww} ${hh}">${body}</svg>`};
  },
  draw(ctx,id,r,t,active) {
    PuzzlePrizeArt.draw(ctx,id,r,t,active);
    if(ShopRewards.prizes.find(p=>p.id===id)?.tier!==3)return;
    ctx.save();const x=r.x+r.w*.52,y=r.y+r.h*.54,angle=Math.sin(t*2)*.2;
    ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle="#BFA35F";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,r.h*.12);ctx.stroke();ctx.fillStyle="#E7D69A";
    ctx.beginPath();ctx.arc(0,r.h*.12,Math.max(3,r.w*.035),0,Math.PI*2);ctx.fill();ctx.restore();
  },
};
