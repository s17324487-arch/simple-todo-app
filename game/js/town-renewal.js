// 4つの町の街区。平和台は別の段階的な移植のため、この配置では変更しない。
const TownRenewal = (() => {
  const ids=["town","city","harbor","airport"], originals={};
  const common=["bench","planter","bicycles","postbox","recycle","bollard","newsbox","phone","hydrant","direction","streetclock"];
  const frontages={
    city_diner:["chalkboard","city_coffee","table","city_bikerack"],
    city_salon:["city_billboard","bicycles","planter","city_coffee"],
    town_cakery:["chalkboard","town_cakes","town_milk","planter"],
    city_puzzle:["city_billboard","city_screen","planter","city_bikerack"],city_deliveryhall:["city_delivery","city_kiosk","postbox","recycle"],
    town_home:["postbox","town_milk","planter","town_pinwheel"],town_tailor:["chalkboard","town_yarn","town_yarn","planter"],town_workshop:["chalkboard","town_watering","planter","postbox"],
    town_parlor:["chalkboard","table","town_milk","planter"],town_clinic:["phone","recycle","planter","bicycles"],town_bakery:["chalkboard","town_breadrack","town_milk","town_breadrack"],
    town_greenhouse:["chalkboard","town_herbs","town_watering","town_herbs"],town_bazaar:["chalkboard","town_milk","town_herbs","town_breadrack"],town_station:["newsbox","phone","bicycles","postbox"],town_riverside:["chalkboard","town_pinwheel","town_watering","town_herbs"],
    city_department:["city_screen","city_billboard","planter","city_bikerack"],city_arcade:["city_kiosk","city_delivery","recycle","city_coffee"],city_design:["chalkboard","city_billboard","planter","postbox"],city_cafe:["chalkboard","city_coffee","table","city_bikerack"],
    city_station:["city_metro","city_screen","city_bikerack","newsbox"],city_museum:["newsbox","planter","city_bikerack","chalkboard"],city_gallery:["city_billboard","chalkboard","planter","city_screen"],
    harbor_ferry:["harbor_lifering","harbor_mooring","harbor_rope","direction"],harbor_hangar:["harbor_buoy","harbor_crates","harbor_rope","recycle"],harbor_fishmarket:["chalkboard","harbor_fishbasket","harbor_net","harbor_crates"],harbor_warehouse:["harbor_crates","harbor_net","harbor_rope","harbor_anchor"],harbor_aquarium:["postbox","direction","harbor_anchor","planter"],harbor_pavilion:["direction","harbor_lifering","harbor_rope","harbor_mooring"],
    airport_terminal:["airport_departures","airport_luggage","airport_scanner","airport_cart"],airport_station:["newsbox","airport_departures","airport_luggage","phone"],airport_cargo:["airport_cart","airport_tug","airport_cone","recycle"],airport_service:["airport_stairs","airport_tug","airport_beacon","airport_cone"],airport_museum:["chalkboard","airport_scanner","airport_luggage","planter"],airport_lounge:["chalkboard","table","airport_departures","planter"],
  };
  function begin(id,w,h,fill){
    const old=MAP_DEFS[id];originals[id]=old;
    const d={...old,renewal:true,theme:id,rows:[],buildings:[],objects:[],npcs:[],signs:[],chests:old.chests.map(c=>({...c})),warps:[],spawns:[],roads:[],crosswalks:[],marks:[],surfaces:[],safeSpawn:[2,2],views:[]};
    const g=Array.from({length:h},()=>Array(w).fill(fill)),reserved=new Set(),occupied=new Set();
    const key=(x,y)=>x+","+y,inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h;
    const rect=(x,y,rw,rh,ch)=>{for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++)if(inside(xx,yy))g[yy][xx]=ch;};
    const keep=(x,y)=>reserved.add(key(x,y));
    const prop=(kind,x,y,opt={})=>{
      const a=WorldArt[kind](),pw=opt.w||Math.ceil(a.w/32),ph=opt.h||1;
      for(let yy=y;yy<y+ph;yy++)for(let xx=x;xx<x+pw;xx++)if(!inside(xx,yy)||reserved.has(key(xx,yy))||occupied.has(key(xx,yy))||(!opt.water&&"#~".includes(g[yy][xx])))return null;
      const o={id:opt.id||id+"_decor_"+d.objects.length,kind,x,y,w:pw,h:ph,solid:true,...opt};d.objects.push(o);
      for(let yy=y;yy<y+ph;yy++)for(let xx=x;xx<x+pw;xx++)occupied.add(key(xx,yy));return o;
    };
    const road=(name,a,b,carriage=2,side=2)=>{d.roads.push({id:name,carriage,side,pieces:[{t:"seg",a,b}],center:carriage===4?[{from:1,to:Math.hypot(b[0]-a[0],b[1]-a[1])-1}]:[]});};
    const crossing=(x,y,vertical=false,width=2)=>d.crosswalks.push(vertical?{x0:x-width/2,x1:x+width/2,y0:y-.7,y1:y+.7,bars:"v"}:{x0:x-.7,x1:x+.7,y0:y-width/2,y1:y+width/2,bars:"h"});
    const building=(bid,x,y,bw,bh,style,extra={})=>{
      const b={...(old.buildings.find(b=>b.id===bid)||{id:bid,door:Math.floor(bw/2),label:"まちの たてもの",act:{type:"visit",text:"まちの おはなしを きいて ひとやすみ。"}}),x,y,w:bw,h:bh,style,...extra};
      b.door=extra.door??Math.floor(bw/2);d.buildings.push(b);rect(x,y,bw,bh,"#");g[y+bh-1][x+b.door]="D";
      // 入り口から歩道へ、正面の2マスを必ず空ける。
      for(let yy=y+bh;yy<=y+bh+2&&yy<h;yy++){if(g[yy][x+b.door]!=="~")g[yy][x+b.door]="=";keep(x+b.door,yy);}return b;
    };
    const npc=(nid,x,y,sp="rabbit",line="いろんな けしきが あって おさんぽが たのしいね。")=>{
      const original=old.npcs.find(n=>n.id===nid),n={...(original||{id:nid,sp,dir:"down",name:"まちの なかま",talk:nid}),x,y};
      if(n.wander)n.wander=[x-1,y-1,x+1,y+1];d.npcs.push(n);keep(x,y);if(!original)TALKS[nid]={first:[line],lines:[[line]]};return n;
    };
    const warp=(x,y,rw,rh,to,tx,ty,dir)=>{d.warps.push({x,y,w:rw,h:rh,to,tx,ty,dir});rect(x,y,rw,rh,"=");for(let yy=y-1;yy<=y+rh;yy++)for(let xx=x-1;xx<=x+rw;xx++)keep(xx,yy);};
    function finish({horizontal=[],vertical=[],edge}){
      d.fillets=[];
      for(const [y,hc,x0,x1]of horizontal)for(const [x,vc,y0,y1]of vertical)if(x>x0&&x<x1&&y>=y0&&y<=y1){
        for(const sx of [-1,1])for(const sy of [-1,1])d.fillets.push({at:[x+sx*vc/2,y+sy*hc/2],sx,sy,r:1.3});
      }
      // 中央線は交差点の中へ引かない。
      for(const rd of d.roads.filter(r=>r.carriage===4)){
        const {a,b}=rd.pieces[0],vert=a[0]===b[0],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        const gaps=(vert?horizontal:vertical).map(([p,car])=>[p-(vert?a[1]:a[0])-car/2-1,p-(vert?a[1]:a[0])+car/2+1]).sort((a,b)=>a[0]-b[0]);
        rd.center=[];let at=0;for(const [from,to]of gaps){if(from>at)rd.center.push({from:at,to:from});at=Math.max(at,to);}if(at<length)rd.center.push({from:at,to:length});
      }
      // 道の下地には通れる地面を用意。建物・水面とは独立した滑らかなベクター縁。
      const rg=TownRoads.grid(d,w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rg[y][x]&&g[y][x]!=="#"&&g[y][x]!=="D")g[y][x]="=";
      const palette=[...common,...({town:["town_pinwheel"],city:["city_metro","city_screen","city_bikerack"],harbor:["harbor_lifering","harbor_mooring"],airport:["airport_departures","airport_beacon"]}[id])];
      // 店先のまとまり：看板・品物・郵便受け。正面の通路は予約済み。
      d.buildings.forEach((b,i)=>{
        const items=frontages[b.style];
        for(const [j,dx] of [0,b.w-1,1,b.w-2].entries())prop(items[j],b.x+dx,b.y+b.h);
        for(const [j,dx] of [0,b.w-1].entries())prop(items[j+2],b.x+dx,b.y+b.h+1);
      });
      // 車道側の歩道だけに置く。もう1マスは連続して歩ける。
      horizontal.forEach(([y,car,x0,x1],row)=>{for(let x=x0;x<x1;x+=4)for(const [j,cy] of [y-car/2-1,y+car/2].entries()){
        if(vertical.some(([vx,vc])=>Math.abs(x+.5-vx)<vc/2+2))continue;
        prop((Math.floor((x-x0)/4)+j)%2?"treegrate":"lamp",x,cy);
        prop(palette[(Math.floor(x/4)+row*5+j*7)%palette.length],x+2,cy);
      }});
      vertical.forEach(([x,car,y0,y1],col)=>{for(let y=y0;y<y1;y+=4)for(const [j,cx] of [x-car/2-1,x+car/2].entries()){
        if(horizontal.some(([hy,hc])=>Math.abs(y+.5-hy)<hc/2+2))continue;
        prop((Math.floor((y-y0)/4)+j)%2?"treegrate":"lamp",cx,y);
        prop(palette[(Math.floor(y/4)+col*6+j*9)%palette.length],cx,y+2);
      }});
      // 外周のへい。町ごとの素材を使い、出口・道路・海をふさがない。
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1){
        if(rg[y][x]||reserved.has(key(x,y))||g[y][x]==="~")continue;
        if(g[y][x]==="#")g[y][x]=".";prop(edge,x,y,{background:true});g[y][x]="#";
      }
      for(const n of d.npcs)if("#~".includes(g[n.y][n.x]))throw new Error(id+": NPC blocked "+n.id);
      d.rows=g.map(row=>row.join(""));MAP_DEFS[id]=d;return d;
    }
    return {d,g,rect,prop,road,crossing,building,npc,warp,keep,finish};
  }
  // 川沿いの商店街：切妻・温室・工房・駅舎。3本の生活道路が並木通りにつながる。
  {
    const b=begin("town",48,44,"."),{d}=b;d.safeSpawn=[5,9];
    b.rect(36,0,2,44,"~");
    for(const y of [11,25,39])b.road("market-"+y,[0,y],[48,y]);
    b.road("river-avenue",[31,0],[31,44],4,2);
    b.road("garden-lane",[1,11],[1,39],2,0);
    b.building("home",3,4,6,4,"town_home");b.building("clothes",12,4,5,4,"town_tailor");b.building("furniture",21,4,6,4,"town_workshop");b.building("town_station",37,4,10,4,"town_station");
    b.building("crepe",3,18,6,4,"town_parlor");b.building("dentist",18,18,9,4,"town_clinic");b.building("florist",37,18,9,4,"town_greenhouse");
    b.building("cake",10,32,6,4,"town_cakery",{label:"ケーキやさん",sign:"cake",act:{type:"work",shop:"cake"}});
    b.building("bakery",3,32,6,4,"town_bakery");b.building("market",17,32,10,4,"town_bazaar");
    b.rect(10,15,8,8,"p");b.rect(40,29,7,8,"-");
    b.prop("fountain",12,17,{id:"town_fountain",w:3,h:2,ground:"plaza",text:"しゅわーっ！ ふんすいに にじが みえる！"});
    b.prop("waterwheel",36,15,{id:"town_wheel",w:2,h:2,water:true,text:"くるくる。かわの おみずで すいしゃが まわる！"});
    b.prop("flowercart",41,30,{id:"town_cart",text:"おはなの ワゴン。いい かおり！"});
    b.prop("railway",39,1,{id:"town_railway",background:true});
    b.rect(38,1,9,3,"#");d.surfaces.push({kind:"railbed",x:38,y:1,w:9,h:3});
    b.prop("town_picnic",16,29);b.prop("swing",42,16);b.prop("town_beehive",14,30);b.prop("town_watering",18,30);
    b.building("town_atelier",37,32,9,4,"town_riverside",{label:"かわの アトリエ"});
    [["mayor",13,21],["cat",10,9],["rabbit",17,23],["penguin",42,28],["frog",12,16],["sheep",20,9],["mouse",26,37],["pig",10,37],["parkcat",40,24]].forEach(([id,x,y])=>b.npc(id,x,y));
    for(const [i,x,y] of [[0,42,9],[1,5,23],[2,25,16],[3,33,30]])b.npc("town_walker"+i,x,y,["cat","sheep","bear","mouse"][i]);
    for(const [i,x,y]of [[0,28,8],[1,28,22],[2,17,37],[3,42,37]])b.npc("town_neighbor"+i,x,y,"cat");
    for(const [i,y]of [9,23,37].entries())b.npc("town_riverwalk"+i,34,y,"frog");
    for(const y of [11,25,39]){b.crossing(27.7,y,false);b.crossing(31,y-3.1,true,4);}
    b.warp(30,43,3,1,"meadow",14,1,"down");b.warp(47,10,1,3,"city",1,24,"right");
    d.festivalBoard=[10,21];b.keep(...d.festivalBoard);
    d.signs=[{x:28,y:40,text:"みなみは はらっぱ。ひがしの はしを わたると シティだよ。"}];b.keep(28,40);
    d.views=[[14,11],[13,22],[42,26]];
    b.finish({horizontal:[11,25,39].map(y=>[y,2,3,47]),vertical:[[31,4,3,43]],edge:"gardenwall"});
  }
  // 都会：段状デパート・ガラスの市場・煉瓦カフェ・鉄骨駅舎、広場に彫刻。
  {
    const b=begin("city",48,44,"p"),{d}=b;d.baseGround="plaza";d.safeSpawn=[25,24];
    for(const y of [13,39])b.road("city-street-"+y,[0,y],[48,y]);b.road("city-avenue",[0,24],[48,24],4,2);b.road("city-north",[25,0],[25,44],4,2);
    b.road("gallery-lane",[12,13],[12,39],2,0);
    b.building("city_clothes",3,4,7,6,"city_department");b.building("city_market",29,5,8,5,"city_arcade");
    b.building("city_office",15,5,6,5,"city_design",{label:"まちの こうぼう"});
    b.building("link",40,5,6,5,"city_puzzle");
    // ⑤ まちの としょかん（見学だけ）の 場所に きょうりゅう はくぶつかん（MUSEUM_DATA.buildings.museum.outside）
    b.building("city_museum",3,16,6,4,"city_museum",{label:"きょうりゅう はくぶつかん",act:{type:"indoor",map:"museum"}});
    b.building("city_gallery",15,16,6,4,"city_salon",{label:"びようしつ",sign:"groom",act:{type:"work",shop:"groom"}});b.building("city_cafe",29,16,6,4,"city_cafe");
    b.building("city_furniture",3,31,7,5,"city_design");b.building("city_station",29,31,14,5,"city_station",{door:7});
    b.building("relay",39,16,7,4,"city_deliveryhall");
    b.building("city_reading",15,31,6,5,"city_diner",{label:"バーガーやさん",sign:"burger",act:{type:"work",shop:"burger"}});
    b.rect(31,27,15,4,"p");b.rect(13,27,8,4,"p");
    b.prop("fountain",36,28,{id:"city_fountain",w:3,h:2,text:"ビルの あいだに みずの にじ！"});b.prop("city_sculpture",14,29,{text:"くるんと つながる まちの ちょうこく。"});
    for(const [kind,id,x,y] of [["clocktower","city_clock",18,28],["signal","city_signal",28,21],["flowercart","city_cart",40,28],["busstop","city_bus",15,10],["vending","city_drink",31,10],["bicycles","city_bikes",42,36]])b.prop(kind,x,y,{id,text:"まちの よりみち。ゆっくり ながめてみよう！"});
    b.npc("cityguide",27,26);
    for(const [i,x,y] of [[0,6,11],[1,37,11],[2,5,21],[3,16,21],[4,38,21],[5,7,37],[6,38,37],[7,14,34],[8,44,28]])b.npc("city_local"+i,x,y,["cat","sheep","mouse","bear","pig"][i%5]);
    for(const [i,x,y]of [[0,18,11],[1,22,21],[2,22,37],[3,30,37]])b.npc("city_commuter"+i,x,y,"mouse");
    b.npc("city_editor",14,10,"cat");b.npc("city_musician",26,10,"sheep");
    b.prop("railway",33,1,{id:"city_railway",background:true});
    for(const y of [13,24,39]){b.crossing(20,y,false,y===24?4:2);b.crossing(30,y,false,y===24?4:2);b.crossing(25,y-(y===24?4:3),true,4);}
    b.warp(0,23,1,3,"town",46,11,"left");b.warp(47,23,1,3,"coast",1,9,"right");b.warp(24,0,3,1,"heiwadai",23,42,"up");
    d.chests[0].x=18;d.chests[0].y=34;b.keep(18,34);d.festivalBoard=[10,21];b.keep(...d.festivalBoard);
    d.views=[[7,13],[36,24],[37,39]];
    b.finish({horizontal:[[13,2,2,47],[24,4,2,47],[39,2,2,47]],vertical:[[25,4,3,43]],edge:"citywall"});
  }
  // 港：岸壁の東は海。3本の木の桟橋が水上へ延び、南端は灯台の防波堤。
  {
    const b=begin("harbor",44,40,"p"),{d}=b;d.baseGround="plaza";d.safeSpawn=[13,11];
    b.rect(28,0,16,40,"~");b.rect(0,37,44,3,"~");
    b.road("port-avenue",[13,0],[13,36],4,2);
    for(const y of [11,25,35])b.road("quayside-"+y,[0,y],[27,y]);
    for(const y of [11,25,35]){b.rect(26,y-1,16,3,"b");d.surfaces.push({kind:"pier",x:26,y:y-1,w:16,h:3});for(let x=26;x<43;x++)b.keep(x,y);}
    b.rect(39,31,4,6,"b");d.surfaces.push({kind:"pier",x:39,y:31,w:4,h:6});
    b.building("harbor_market",2,4,7,4,"harbor_fishmarket");b.building("harbor_air",17,4,8,4,"harbor_hangar");
    b.building("harbor_warehouse",2,18,7,4,"harbor_warehouse");b.building("harbor_ferry",17,18,8,4,"harbor_ferry");b.building("harbor_aquarium",2,29,7,3,"harbor_aquarium",{label:"ぽかぽか すいぞくかん",act:{type:"indoor",map:"aquarium"}}); // ⑤ みなとの しりょうかん（見学だけ）の 場所
    b.building("harbor_pier_north",33,9,5,2,"harbor_pavilion",{label:"きたの まちあい"});
    b.building("harbor_pier_south",33,23,6,2,"harbor_pavilion",{label:"みなみの まちあい"});
    b.building("harbor_pier_workshop",33,32,5,3,"harbor_warehouse",{label:"ふねの こうぼう"});
    b.prop("lighthouse",40,32,{id:"port_light",w:2,h:2,text:"うみの むこうへ ぴかーっ！"});b.prop("crane",20,30,{id:"port_crane",w:3,h:2,text:"にもつを ぐいーん。みなとの ちからもち！"});
    b.prop("sailboat",33,21,{id:"port_boat",w:3,h:2,water:true});b.prop("floatplane",33,7,{id:"port_plane",w:4,h:2,water:true});b.prop("telescope",37,26,{id:"port_scope",text:"うみの むこうに しまが みえるよ。"});
    for(let y=1;y<37;y++)if(![10,11,12,24,25,26,34,35,36].includes(y))b.prop("quaywall",27,y,{background:true});
    for(const y of [10,26,36])for(const [i,x] of [28,32,36,40].entries())b.prop(["harbor_mooring","harbor_rope","harbor_lifering","harbor_crates"][i],x,y);
    for(const [i,x,y] of [[0,6,9],[1,21,9],[2,6,23],[3,21,23],[4,6,33],[5,32,12],[6,32,26],[7,35,36]])b.npc(i?"port_local"+i:"portguide",x,y,["penguin","bear","mouse","cat"][i%4]);
    for(const [i,x,y]of [[0,10,9],[1,16,23],[2,10,33],[3,40,12],[4,40,26],[5,40,35]])b.npc("port_sailor"+i,x,y,"penguin");
    for(const y of [11,25,35]){b.crossing(9,y);b.crossing(17,y);b.crossing(13,y-3,true,4);}
    b.warp(12,0,3,1,"coast",11,28,"up");d.chests[0].x=6;d.chests[0].y=34;b.keep(6,34);
    d.views=[[6,11],[24,25],[36,33]];
    b.finish({horizontal:[11,25,35].map(y=>[y,2,2,27]),vertical:[[13,4,3,36]],edge:"quaywall"});
  }
  // 空港：空域と公共側を分離。滑走路・誘導路・エプロンは道路の島に数えない。
  {
    const b=begin("airport",52,44,"p"),{d}=b;d.baseGround="plaza";d.safeSpawn=[16,27];
    b.rect(0,0,52,18,"#");
    d.surfaces.push({kind:"airfield",x:0,y:0,w:52,h:18});
    b.road("terminal-avenue",[0,27],[52,27],4,2);b.road("airport-street",[0,39],[52,39]);
    for(const x of [15,34])b.road("airport-link-"+x,[x,27],[x,44]);
    b.building("airport_air",20,18,10,5,"airport_terminal",{door:5});b.building("airport_station",3,19,7,4,"airport_station",{door:3});
    b.building("airport_service",39,19,9,4,"airport_service",{label:"ひこうき こうぼう"});b.building("airport_cargo",3,32,7,4,"airport_cargo",{label:"にもつセンター"});b.building("airport_museum",20,32,10,4,"airport_museum",{label:"そらの はくぶつかん"});
    for(let x=1;x<51;x++){b.g[17][x]=".";b.prop("airport_fence",x,17,{background:true});b.g[17][x]="#";}
    // 見るための展望テラス。出入口は公共側にだけある。
    b.rect(39,31,11,6,"p");
    b.building("airport_lounge",40,32,8,4,"airport_lounge",{label:"てんぼうラウンジ"});
    b.rect(49,9,2,12,"p");
    d.surfaces.push({kind:"skydeck",x:49,y:9,w:2,h:9});
    // 北側のスカイデッキは飛行場と別の公共通路。滑走路には立ち入れない。
    d.objects=d.objects.filter(o=>!(o.kind==="airport_fence"&&o.y===17&&o.x>=49));
    for(let y=9;y<18;y++)b.prop("airport_fence",48,y,{water:true,background:true});
    d.objects=d.objects.filter(o=>!(o.kind==="airport_fence"&&o.x===48&&o.y===10));b.g[10][48]="p";
    b.prop("controltower",46,9,{id:"airport_tower",w:2,h:2,water:true,text:"かんせいとう。そらの みちを みまもるよ！"});
    b.prop("airport_jet",32,13,{id:"airport_plane",w:5,h:2,water:true});
    b.prop("airport_beacon",50,9);b.prop("airport_departures",49,19);
    b.prop("windsock",7,9,{id:"airport_wind",water:true});
    b.prop("telescope",49,13,{id:"airport_scope",text:"ひこうきが そらへ のぼっていくよ！"});b.prop("clocktower",25,30,{id:"airport_clock",text:"とけいを みて しゅっぱつの じかんを かくにん！"});
    b.prop("airport_departures",28,24);b.prop("airport_luggage",22,24);b.prop("airport_cart",39,36);b.prop("airport_stairs",46,36);
    for(const [i,x,y] of [[0,26,24],[1,6,24],[2,42,24],[3,6,37],[4,25,37],[5,42,37],[6,48,29]])b.npc(i?"air_local"+i:"airguide",x,y,["sheep","mouse","penguin","bear"][i%4]);
    for(const [i,x,y]of [[0,13,24],[1,32,24],[2,13,37],[3,32,37],[4,50,12],[5,50,17]])b.npc("air_passenger"+i,x,y,"sheep");
    b.npc("air_welcome",19,24,"rabbit");b.npc("air_traveler",19,37,"mouse");
    for(const x of [15,34]){b.crossing(x,30.6,true,2);b.crossing(x-3,27,false,4);b.crossing(x-3,39);}
    b.warp(0,26,1,3,"heiwadai",46,23,"left");d.views=[[25,26],[44,31],[50,12]];
    b.finish({horizontal:[[27,4,2,51],[39,2,2,51]],vertical:[[15,2,30,43],[34,2,30,43]],edge:"airport_fence"});
  }
  // 外からの既存出口・交通IDは保持して、新しい入口へ接続し直す。
  const arrivals={"town:meadow":[31,42],"town:city":[46,11],"city:town":[1,24],"city:coast":[46,24],"city:heiwadai":[25,1],"harbor:coast":[13,1],"airport:heiwadai":[1,27]};
  for(const [from,d] of Object.entries(MAP_DEFS))for(const w of d.warps||[]){const at=arrivals[w.to+":"+from];if(at)[w.tx,w.ty]=at;}
  // 古い座標が新しい建物/水面/孤立区画に入った時だけ、接続した公共の道へ救済。
  function safePosition(map,x,y){
    if(!map.def.renewal)return null;
    if(!map.publicTiles){
      const start=map.def.safeSpawn,q=[start],seen=new Set([start.join(",")]);
      for(let i=0;i<q.length;i++){const [xx,yy]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=xx+dx,ny=yy+dy,k=nx+","+ny;if(!map.isSolid(nx,ny)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
      map.publicTiles={seen,points:q};
    }
    const free=(x,y)=>!map.doorAt(x,y)&&!map.warpAt(x,y)&&!(map.def.npcs||[]).some(n=>n.x===x&&n.y===y);
    if(map.publicTiles.seen.has(x+","+y)&&free(x,y))return [x,y];
    let best=map.def.safeSpawn,dist=Infinity;
    for(const p of map.publicTiles.points){if(!free(...p))continue;const n=Math.abs(p[0]-x)+Math.abs(p[1]-y);if(n<dist){dist=n;best=p;}}
    return best;
  }
  function homeExit(){const b=MAP_DEFS.town.buildings.find(b=>b.id==="home");return {map:"town",x:b.x+b.door,y:b.y+b.h,dir:"down"};}
  function drawGround(ctx,d){
    if(!d.renewal)return;
    ctx.save();ctx.scale(32,32);ctx.lineWidth=.06;ctx.strokeStyle="#E8E2CA";
    for(const s of d.surfaces){
      if(s.kind==="pier"){
        ctx.fillStyle="#BAA286";ctx.fillRect(s.x,s.y,s.w,s.h);ctx.strokeStyle="#E3CFAB";
        for(let x=s.x;x<s.x+s.w;x+=.3){ctx.beginPath();ctx.moveTo(x,s.y);ctx.lineTo(x,s.y+s.h);ctx.stroke();}
        ctx.strokeStyle="#756F67";ctx.strokeRect(s.x,s.y,s.w,s.h);
      }else if(s.kind==="railbed"){
        ctx.fillStyle="#B9B5AC";ctx.fillRect(s.x,s.y,s.w,s.h);ctx.strokeStyle="#7E898D";ctx.lineWidth=.12;ctx.strokeRect(s.x,s.y+.15,s.w,s.h-.3);
      }else if(s.kind==="skydeck"){
        ctx.fillStyle="#DBD9C5";ctx.fillRect(s.x,s.y,s.w,s.h);ctx.strokeStyle="#C3C5B6";for(let y=s.y;y<s.y+s.h;y++)ctx.strokeRect(s.x,y,s.w,1);
      }else if(s.kind==="airfield"){
        ctx.fillStyle="#ACBD9B";ctx.fillRect(0,0,s.w,18);ctx.fillStyle="#BBC2BF";ctx.fillRect(19,10,31,7);
        ctx.fillStyle="#929FA6";ctx.fillRect(3,3,46,5);ctx.fillStyle="#EFF0DE";
        ctx.fillRect(3,3.15,46,.12);ctx.fillRect(3,7.73,46,.12);
        for(const x of [5,46])for(let y=3.65;y<7.5;y+=.65)ctx.fillRect(x,y,1.7,.28);
        for(let x=11;x<42;x+=4)ctx.fillRect(x,5.4,2,.17);
        ctx.font="bold 1.35px sans-serif";ctx.textAlign="center";ctx.fillText("09",9,6);ctx.fillText("27",44,6);
        ctx.strokeStyle="#EAD294";ctx.lineWidth=.14;ctx.beginPath();ctx.moveTo(8,8);ctx.bezierCurveTo(8,12,13,12,16,12);ctx.lineTo(46,12);ctx.stroke();
        for(const x of [24,34,44]){ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x,16);ctx.stroke();ctx.strokeRect(x-2.3,13,4.6,3.5);}
        ctx.fillStyle="#E6C989";for(let x=4;x<49;x+=3){ctx.fillRect(x,2.65,.16,.2);ctx.fillRect(x,8.2,.16,.2);}
      }
    }ctx.restore();
  }
  function motion(id,time){return id==="airport"?{x:4+(time%60)/60*42,y:5.5}:null;}
  function drawMoving(ctx,sc,ox,oy){
    const q=motion(sc.mapId,G.t);if(!q)return;const r=sc.objCanvas("airport_jet",null,false);if(!r)return;
    const x=ox+q.x*32,y=oy+q.y*32;ctx.drawImage(r.c,x-65,y-38,130,92);
  }
  return {ids,originals,safePosition,homeExit,drawGround,motion,drawMoving};
})();
