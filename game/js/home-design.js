// 家具の所持ID・配置座標を変えず、床と高さを斜め上から投影する。
const HomeDesign = {
  sizes:{standard:{w:480,d:360},expanded:{w:640,d:540}},
  size() {
    const rooms=typeof Save!=="undefined"&&Save.d?.rooms;
    return this.sizes[rooms?.expanded?.[rooms.active]===true?"expanded":"standard"];
  },
  get W() {return this.size().w;},
  get D() {return this.size().d;},
  H:230,A:.88,B:.48,uid:0,models:new Map(),
  project(x,y,z=0) {return {x:(x-y)*this.A,y:(x+y)*this.B-z};},
  inverse(x,y) {return {x:(x/this.A+y/this.B)/2,y:(y/this.B-x/this.A)/2};},
  bounds(size=this.size()) {return {x:-size.d*this.A-12,y:-this.H-14,w:(size.w+size.d)*this.A+24,h:(size.w+size.d)*this.B+this.H+48};},
  poly(points,fill,line=1.5) {return `<polygon points="${points.map(p=>`${f2(p.x)},${f2(p.y)}`).join(" ")}" fill="${fill}" stroke="${INK}" stroke-width="${line}" stroke-linejoin="round"/>`;},
  texture(p,w,h) {
    if(p.pat==="plank"||p.pat==="parquet"){
      let s=`<rect width="${w}" height="${h}" fill="${p.base}"/>`;
      const ph=p.pat==="parquet"?18:24,pw=p.pat==="parquet"?64:110;
      for(let y=0;y<h;y+=ph)for(let x=-((y/ph)%3)*pw/3;x<w;x+=pw){
        const xx=Math.max(0,x),ww=Math.min(w,x+pw)-xx;if(ww<=0)continue;
        s+=`<rect x="${xx}" y="${y}" width="${ww}" height="${Math.min(ph,h-y)}" fill="${U.hash(x,y)>.5?p.base:p.c2}" stroke="#62452F" stroke-opacity=".35" stroke-width="1"/>`;
        for(let i=0;i<2;i++)s+=`<path d="M${xx+3},${y+7+i*8} Q${xx+ww*.4},${y+4+i*8} ${xx+ww-3},${y+8+i*8}" fill="none" stroke="#E5C895" stroke-opacity=".18" stroke-width=".9"/>`;
      }return s;
    }
    let s=this.oldPattern(p,w,h);
    if(p.pat==="plaster"||p.pat==="panel"){
      for(let i=0;i<w*h/300;i++){const x=U.hash(i,11)*w,y=U.hash(i,12)*h;s+=`<path d="M${f2(x)},${f2(y)} l3,1" stroke="${p.c2}" stroke-opacity=".38" stroke-width="1"/>`;}
      if(p.pat==="panel")s+=`<rect y="${h-70}" width="${w}" height="70" fill="${p.c2}"/>`+Array.from({length:Math.ceil(w/32)},(_,i)=>`<path d="M${i*32+7},${h-61} h20 v52 h-20 Z" fill="none" stroke="${p.base}" stroke-opacity=".55" stroke-width="1.5"/>`).join("");
    }return s;
  },
  roomSvg(wall,floor,size=this.size()) {
    const b=this.bounds(size),wp=WALL_INDEX[wall]||WALLPAPERS[0],fl=FLOOR_INDEX[floor]||FLOORS[0],uid="room-design-"+(++this.uid),p=(x,y,z=0)=>this.project(x,y,z),W=size.w,D=size.d,H=this.H;
    let s=`<defs><clipPath id="${uid}-left"><rect width="${D}" height="${H}"/></clipPath><clipPath id="${uid}-right"><rect width="${W}" height="${H}"/></clipPath></defs>`;
    s+=this.poly([p(0,D),p(W,D),p(W,D,-22),p(0,D,-22)],"#6B4934")+this.poly([p(W,0),p(W,D),p(W,D,-22),p(W,0,-22)],"#8A6140");
    for(const [side,L] of [["left",D],["right",W]]){
      const sign=side==="left"?-1:1;
      s+=`<g transform="matrix(${sign*this.A} ${this.B} 0 1 0 ${-H})"><g clip-path="url(#${uid}-${side})">${this.texture(wp,L,H)}<rect width="${L}" height="${H}" fill="${side==="left"?"#716845":"#FFF9D1"}" opacity="${side==="left"?.13:.07}"/>`;
      s+=`<path d="M0,4 H${L} M0,${H-10} H${L}" stroke="#9C8058" stroke-width="8"/><path d="M0,12 H${L} M0,${H-17} H${L}" stroke="#F1DDB4" stroke-width="2"/>`;
      // 木枠のドアと真鍮の金具。左はおでかけ、右はおへや選択。
      const u=side==="left"?62:W-92;
      s+=`<g transform="translate(${u-32} ${H-145})"><path d="M0,145 V22 Q0,0 32,0 Q64,0 64,22 V145 Z" fill="#75543D" stroke="${INK}" stroke-width="3"/><path d="M7,145 V24 Q7,8 32,8 Q57,8 57,24 V145" fill="#A68252" stroke="#CFB681" stroke-width="2"/>${[18,32,46].map(x=>`<path d="M${x},19 V143" stroke="#775731" stroke-width="1.5"/>`).join("")}<path d="M8,38 H56 M8,108 H56" stroke="#645044" stroke-width="5"/><circle cx="48" cy="79" r="4" fill="#E0BD66" stroke="#5E4937" stroke-width="1.5"/><rect x="22" y="17" width="20" height="13" rx="3" fill="#D4B980"/><text x="32" y="27" text-anchor="middle" fill="#5F4B31" font-size="9">${side==="left"?"I":"II"}</text></g>`;
      s+=`</g></g>`;
    }
    s+=`<g transform="matrix(${this.A} ${this.B} ${-this.A} ${this.B} 0 0)">${this.texture(fl,W,D)}<rect width="${W}" height="${D}" fill="none" stroke="#D9BC8A" stroke-width="6"/><rect x="8" y="8" width="${W-16}" height="${D-16}" fill="none" stroke="#65492F" stroke-opacity=".35" stroke-width="1.3"/></g>`;
    s+=`<path d="M0,${-H} V0" stroke="#B29B71" stroke-width="3"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">${s}</svg>`;
  },
  dimensions(id) {
    const f=FURN_INDEX[id],special={bed_simple:[110,82,64],bed_royal:[124,92,88],table_wood:[88,68,53],chair_wood:[36,38,65],sofa:[112,64,67],cloudsofa:[116,66,67],bookshelf:[72,34,112],wardrobe_oak:[90,48,142],desk:[102,52,63],kitchen:[100,46,108],vanity:[90,42,102],piano:[108,44,93],tv:[78,38,82],fireplace:[98,44,91],toybox:[66,42,39],teacart:[83,48,74],plantshelf:[86,38,103],stool_oak:[38,38,53],birdcage_brass:[48,40,116],console_oak:[104,38,71],rug_round:[176,128,2],rug_star:[176,128,2],rug_kilim:[184,140,2]};
    const [w,d,h]=special[id]||[f.w,f.depth||Math.min(50,f.w*.7),f.h];return {w,d,h};
  },
  model(id,opts={}) {
    const key=id+":"+!!opts.flip;if(this.models.has(key))return this.models.get(key);
    if(FURN_INDEX[id]?.puzzlePrize){const m=PuzzlePrizeArt.model(id,opts);this.models.set(key,m);return m;}
    if(FURN_INDEX[id]?.shopPrize){const m=ShopRewardArt.model(id,opts);this.models.set(key,m);return m;}
    const f=FURN_INDEX[id],dim=this.dimensions(id),w=dim.w,d=dim.d,h=dim.h,points=[];
    const pt=(x,y,z=0)=>{const q=opts.flip?this.project(y+d/2,x-w/2,z):this.project(x,y,z);points.push(q);return q;};
    const poly=(vs,col,stroke=1.5)=>this.poly(vs.map(v=>pt(...v)),col,stroke);
    const line=(vs,col="#72543A",stroke=1.5)=>`<polyline points="${vs.map(v=>{const p=pt(...v);return `${f2(p.x)},${f2(p.y)}`;}).join(" ")}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const face=(x,y,z,ww,hh,col)=>poly([[x,y,z],[x+ww,y,z],[x+ww,y,z+hh],[x,y,z+hh]],col);
    const box=(x,y,ww,dd,z,hh,col=["#B39767","#8C704B","#CAAE7E"])=>{
      const yy=y+dd;
      return poly([[x,yy,z],[x+ww,yy,z],[x+ww,yy,z+hh],[x,yy,z+hh]],col[0])+poly([[x+ww,y,z],[x+ww,y+dd,z],[x+ww,y+dd,z+hh],[x+ww,y,z+hh]],col[1])+poly([[x,y,z+hh],[x+ww,y,z+hh],[x+ww,y+dd,z+hh],[x,y+dd,z+hh]],col[2]);
    };
    const ellipse=(x,y,z,rx,ry,col)=>{const q=pt(x,y,z);points.push({x:q.x-rx,y:q.y-ry},{x:q.x+rx,y:q.y+ry});return `<ellipse cx="${f2(q.x)}" cy="${f2(q.y)}" rx="${rx}" ry="${ry}" fill="${col}" stroke="${INK}" stroke-width="1.4"/>`;};
    const legs=(z,thick=6)=>[-w/2+5,w/2-thick-5].flatMap(x=>[-d+5,-thick-5].map(y=>box(x,y,thick,thick,0,z))).join("");
    const books=(x,y,z,n)=>Array.from({length:n},(_,i)=>box(x+i*8,y,6,12,z,15+i%3*4,[["#B87859","#7F9D8B","#CAAB69","#9096A6"][i%4],"#79674F","#E4D8B9"])).join("");
    let body="";
    if(f.kind==="rug"){
      const corners=[[-w/2,-d,1],[w/2,-d,1],[w/2,0,1],[-w/2,0,1]];
      body=poly(corners,id==="rug_star"?"#A7B6BB":"#AD6046")+poly([[-w/2+7,-d+7,2],[w/2-7,-d+7,2],[w/2-7,-7,2],[-w/2+7,-7,2]],"#D2AC75")+poly([[-w/2+13,-d+13,3],[w/2-13,-d+13,3],[w/2-13,-13,3],[-w/2+13,-13,3]],id==="rug_star"?"#718D9E":"#A55943");
      for(let x=-w/2+28;x<w/2-20;x+=30)for(let y=-d+29;y< -18;y+=30)body+=poly([[x,y-8,4],[x+8,y,4],[x,y+8,4],[x-8,y,4]],"#E4C797",.8);
      for(let x=-w/2+5;x<w/2;x+=8)body+=line([[x,0,1],[x,5,1]],"#D7BF94",2);
    }else if(id.startsWith("bed_")){
      body=legs(22,7)+box(-w/2,-d,w,d,15,12)+box(-w/2,-d,7,d,26,id==="bed_royal"?49:32)+box(w/2-7,-d,7,d,24,20)+box(-w/2+8,-d+4,w-16,d-8,28,12,["#E8DABD","#C8B697","#FCF1D5"]);
      body+=box(-w/2+12,-d+10,24,d-20,41,7,["#E6D1A1","#CBB484","#F3E4BC"]);
      const colors=id==="bed_royal"?["#B68283","#DFC3AF","#A77D7C","#EAD5AE"]:["#BA6C47","#E6B85B","#D88747","#F4D38A"];
      for(let x=-w/2+39,i=0;x<w/2-8;x+=14,i++)for(let y=-d+4,j=0;y< -4;y+=15,j++)body+=poly([[x,y,41],[Math.min(x+14,w/2-8),y,41],[Math.min(x+14,w/2-8),Math.min(y+15,-4),41],[x,Math.min(y+15,-4),41]],colors[(i+j)%4],.35);
      for(let y=-d+12;y< -8;y+=15)body+=line([[-w/2+3,y,28],[-w/2+3,y,52]],"#D7C199",1.6);
    }else if(["table_wood","desk","stool_oak","chair_wood","teacart","console_oak"].includes(id)){
      const top=id==="chair_wood"?29:h-8;body=legs(top)+box(-w/2,-d,w,d,top,7);
      if(id==="chair_wood")body+=box(-w/2,-d,w,6,30,30)+line([[-w/2+7,-d,38],[w/2-7,-d,38]],"#D7C199",3);
      if(id==="desk"||id==="console_oak")body+=box(-w/2+8,-d+5,w*.38,d-10,top-20,18)+books(0,-d+4,top+8,4);
      if(id==="teacart")body+=box(-w/2+3,-d+3,w-6,d-6,12,5)+books(-w/2+12,-d+10,18,5);
      if(id==="table_wood"||id==="teacart")body+=ellipse(10,-d/2,top+9,12,5,"#EEE2C5")+box(4,-d/2-6,10,10,top+10,11,["#AEC3B1","#809A86","#D4DFCB"])+ellipse(-15,-d/2,top+10,7,4,"#C79A66");
    }else if(id==="sofa"||id==="cloudsofa"){
      const c=id==="cloudsofa"?["#AEBEBB","#819692","#D0D8C9"]:["#A7AD81","#7D835F","#CFCEAA"];
      body=legs(13)+box(-w/2,-d,w,d,12,14)+box(-w/2,-d,w,12,25,38,c)+box(-w/2, -d,13,d,25,23,c)+box(w/2-13,-d,13,d,25,23,c);
      body+=box(-w/2+14,-d+14,(w-30)/2,d-16,26,11,c)+box(1,-d+14,(w-30)/2,d-16,26,11,c)+box(-w/2+18,-d+16,23,10,38,21,["#D1AE8F","#AA8466","#ECD8B7"]);
    }else if(["bookshelf","wardrobe_oak","kitchen","vanity","piano","tv","fireplace","toybox","plantshelf"].includes(id)){
      body=box(-w/2,-d,w,d,5,h-5)+box(-w/2-3,-d-2,w+6,d+4,h,5);
      if(id==="bookshelf"||id==="plantshelf"){
        for(let z=17;z<h-15;z+=29){body+=face(-w/2+5,1,z,w-10,24,"#66533D")+box(-w/2+4,-d+3,w-8,d+4,z,3)+books(-w/2+10,-14,z+4,Math.floor((w-18)/8));}
      }else if(id==="wardrobe_oak"){
        body+=face(-w/2+6,1,13,w/2-8,h-20,"#C8B18A")+face(2,1,13,w/2-8,h-20,"#C8B18A");
        body+=line([[-5,2,55],[-5,2,69]],"#725739",3)+line([[7,2,55],[7,2,69]],"#725739",3);
      }else{
        // 趣味の家具は元のモチーフを正面パネルへ組み込み、側板と天板をそろえる。
        const art=FURN_ART[id]({}),origin=pt(-w/2+5,1,h-7),scale=(w-10)/f.w;
        body+=`<g transform="matrix(${(opts.flip?-1:1)*this.A*scale} ${this.B*scale} 0 ${Math.min((h-12)/f.h,scale)} ${f2(origin.x)} ${f2(origin.y)})">${art}</g>`;
      }
    }else if(id==="birdcage_brass"){
      body=legs(31,4)+box(-w/2,-d,w,d,29,5);const q=pt(0,-d/2,35);
      points.push({x:q.x-24,y:q.y-88},{x:q.x+24,y:q.y+8});
      body+=`<g transform="translate(${q.x} ${q.y})"><ellipse cy="0" rx="24" ry="8" fill="#B29B67" stroke="${INK}" stroke-width="1.5"/><path d="M-24,0 V-48 Q-24,-76 0,-76 Q24,-76 24,-48 V0 M0,-76 V0 M-12,-69 V4 M12,-69 V4" fill="none" stroke="#8A997E" stroke-width="2"/><path d="M-23,-44 H23 M-24,-8 H24" stroke="#8A997E" stroke-width="2"/><path d="M-13,-17 Q2,-39 12,-17 Q0,-10-13,-17" fill="#E0B65F" stroke="${INK}" stroke-width="1.3"/><circle cx="7" cy="-22" r="1.3" fill="${INK}"/><path d="M11,-20 L18,-17 L11,-15" fill="#C87F50"/><path d="M0,-77 V-85" stroke="#A38F60" stroke-width="2"/></g>`;
    }else{
      // 植物・ぬいぐるみ・限定かざりも同じ床面に接地し、品物の意匠は保つ。
      body=box(-w/2,-d,w,d,0,5,["#AD9165","#876C4A","#D6BD8B"]);
      const q=pt(0,-d/2,6);points.push({x:q.x-f.w/2-12,y:q.y-f.h-12},{x:q.x+f.w/2+12,y:q.y+8});
      body+=`<g transform="translate(${f2(q.x-f.w/2)} ${f2(q.y-f.h)})">${FURN_ART[id]({})}</g>`;
    }
    const minX=Math.min(...points.map(p=>p.x))-6,minY=Math.min(...points.map(p=>p.y))-6,maxX=Math.max(...points.map(p=>p.x))+6,maxY=Math.max(...points.map(p=>p.y))+6;
    const model={x:minX,y:minY,w:maxX-minX,h:maxY-minY,footW:opts.flip?d:w,footD:opts.flip?w:d,height:h,full:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}">${body}</svg>`};
    this.models.set(key,model);return model;
  },
};

// 既存のIDと価格は維持する。新しい木製家具・壁の飾りは通常の家具店に追加。
(() => {
  HomeDesign.oldPattern=Art.patternSvg;Art.patternSvg=(p,w,h)=>HomeDesign.texture(p,w,h);
  HomeDesign.oldFurnSvg=Art.furnSvg;
  Art.furnSvg=(id,opts={})=>FURN_INDEX[id]?.kind==="wall"?HomeDesign.oldFurnSvg(id,opts):HomeDesign.model(id,opts).full;
  const palettes={wp_cream:["#EEE6C9","#CFC5A1","plaster"],wp_stripe:["#EBDDD0","#D9C4B7"],wp_dots:["#DEE7E0","#F3EEDD"],wp_check:["#DEE4CB","#C5CFAD"],wp_wood:["#C4A77A","#AD8D62"],wp_brick:["#D6B59A","#BB967C"],wp_star:["#485874","#D8C58D"],wp_cloud:["#BED0D5","#E8E6D2"],fl_wood:["#A87641","#976337"],fl_checker:["#E0D6BC","#B69783"],fl_carpet:["#B78C88","#A27874"],fl_stone:["#BDB9A8","#9F9E91"]};
  for(const [id,[base,c2,pat]] of Object.entries(palettes)){const f=WALL_INDEX[id]||FLOOR_INDEX[id];Object.assign(f,{base,c2,...(pat?{pat}:{})});}
  for(const [id,name,price,w,h,kind] of [["wardrobe_oak","オークの クローゼット",780,90,142,"floor"],["stool_oak","きの スツール",170,38,53,"floor"],["console_oak","こもれびの コンソール",420,104,71,"floor"],["birdcage_brass","ことりの とりかご",680,48,116,"floor"],["rug_kilim","あかい おりものラグ",320,184,140,"rug"],["map_frame","ぼうけんの ちず",200,82,60,"wall"],["herb_frame","おはなの おしばな",180,48,68,"wall"]]){
    const f={id,name,price,w,h,kind,comfort:4,interactive:id==="birdcage_brass"};FURNITURE.push(f);FURN_INDEX[id]=f;
    FURN_ART[id]=()=>`<rect x="2" y="2" width="${w-4}" height="${h-4}" rx="3" fill="#C5AA79" ${FS(2)}/><rect x="7" y="7" width="${w-14}" height="${h-14}" fill="#E8DBB2" stroke="#876C48" stroke-width="1"/>`+(id==="map_frame"?`<path d="M14,39 L24,23 L40,28 L54,15 L66,25 L58,44 L38,39 L25,50 Z" fill="#B8BB82"/><path d="M20,32 Q44,18 59,37 T72,40" fill="none" stroke="#739996" stroke-width="2"/><path d="M55,43 L62,47 M62,43 L55,47" stroke="#A76C4B" stroke-width="2"/>`:id==="herb_frame"?`<path d="M24,54 V21 M24,37 L14,31 M24,43 L34,36" stroke="#8C9D68" stroke-width="2"/>${flowerSvg(24,21,8,"#C99482","#E2C97E",1.2)}`:"");
  }
  for(const [id,name,base,c2,pat] of [["wp_sage_panel","セージの こしかべ","#ECE6D1","#ACB79A","panel"],["wp_ochre_plaster","はちみつの ぬりかべ","#E9D8AE","#CBB98C","plaster"],["wp_blue_panel","あおい こしかべ","#E6E5D5","#92A8AF","panel"]]){const f={id,name,price:340,comfort:3,base,c2,pat};WALLPAPERS.push(f);WALL_INDEX[id]=f;}
  for(const [id,name,base,c2,pat] of [["fl_walnut","くるみの きのゆか","#855C3F","#775036","plank"],["fl_parquet","よりぎの ゆか","#C19D67","#A88452","parquet"],["fl_aged_oak","こいろの オーク","#B9A27C","#A98D64","plank"]]){const f={id,name,price:380,comfort:3,base,c2,pat};FLOORS.push(f);FLOOR_INDEX[id]=f;}
})();
