// 町の寄り道と交通。古いドア・宝箱・ワープの ID と位置は残す。
(() => {
  const patch = (id, fn) => { const d = MAP_DEFS[id], g = d.rows.map(r => [...r]); fn(g, d); d.rows = g.map(r => r.join("")); };
  const road = (g, points, width = 1, ch = "=") => {
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1], [bx, by] = points[i], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let k = 0; k <= n; k++) for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) {
        const x = Math.round(ax + (bx - ax) * k / (n || 1)) + dx, y = Math.round(ay + (by - ay) * k / (n || 1)) + dy;
        if (g[y] && g[y][x] != null) g[y][x] = ch;
      }
    }
  };
  const house = (g, d, id, x, y, w, h, label, roof, act, extra = {}) => {
    const b = { id, x, y, w, h, door: Math.floor(w / 2), label, roof, sign: "home", act: act || { type: "visit", text: "おにわの おはなが きれい！\n3にんで ひとやすみ しよう。" }, ...extra };
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g[yy][xx] = "#";
    g[y + h - 1][x + b.door] = "D"; g[y + h][x + b.door] = "=";
    d.buildings.push(b); return b;
  };
  const blank = (id, name, w, h, fill, bgm) => {
    const f = new FieldGen(id, w, h, fill); f.border("T", 1, 0);
    const d = { name, bgm, baseGround: "grass", rows: [], buildings: [], objects: [], npcs: [], signs: [], chests: [], warps: [], spawns: [] };
    MAP_DEFS[id] = d; return { g: f.g, d, finish: () => { d.rows = f.rows(); } };
  };
  const station = (g, d, id, x, y, label) => house(g, d, id, x, y, 5, 3, label, "#85B5B0", { type: "transit", stop: id }, { terminal: "train", sign: "train" });
  const person = (d, id, x, y, name, text, sp = "rabbit") => {
    d.npcs.push({ id, x, y, name, sp, dir: "down", talk: id });
    TALKS[id] = { first: [text], lines: [[text]] };
  };
  const prop = (d, id, kind, x, y, w, h, text, extra = {}) => d.objects.push({ id, kind, x, y, w, h, solid: true, text, ...extra });

  // 平和台：画像の斜めの幹線、駅前の店、南西の大きな公園、住宅の路地をゲームの縮尺で表す。
  const hw = blank("heiwadai", "平和台（へいわだい）", 48, 44, ".", "heiwadai"), { g, d } = hw;
  road(g, [[1,30],[12,23],[25,13],[36,5],[46,2]], 5, "=");
  road(g, [[1,30],[12,23],[25,13],[36,5],[46,2]], 3, "v");
  road(g, [[10,1],[20,9],[30,16],[39,23],[44,31]], 5, "=");
  road(g, [[10,1],[20,9],[30,16],[39,23],[44,31]], 3, "v");
  road(g, [[23,43],[23,38],[30,33],[31,26],[27,22],[27,18]], 2);
  road(g, [[2,38],[10,38],[13,34],[19,33],[23,38],[36,38],[40,34],[46,34]], 2);
  road(g, [[4,29],[7,32],[12,34]], 2);
  road(g, [[31,26],[37,27],[41,23],[47,23]], 2);
  road(g, [[5,18],[11,16],[15,12],[17,7]], 2);
  road(g, [[33,3],[38,10],[44,11],[44,18],[39,23]], 2);
  road(g, [[3,9],[8,9],[10,15]], 1);
  for (const [x,y] of [[24,13],[26,14],[28,15],[39,23]]) for(let j=0;j<3;j++) g[y+j][x]="z";
  station(g,d,"heiwadai_station",27,7,"平和台えき");
  road(g, [[29,10],[29,13]],2);
  for(let y=10;y<14;y++)for(let x=27;x<35;x++)if(!"vz#D".includes(g[y][x]))g[y][x]="p";
  house(g,d,"heiwadai_market",15,15,6,4,"えきまえ マーケット","#81BFAB",{type:"buy",shop:"market"},{sign:"market",awning:["#87CAB9","#FFF8E9"]});
  house(g,d,"heiwadai_diner",29,19,5,4,"ファミリー キッチン","#E8AB88",{type:"work",shop:"crepe"},{sign:"crepe",awning:["#F4BD93","#FFF8E9"]});
  house(g,d,"heiwadai_living",13,5,5,4,"くらしの おみせ","#9EABCB",{type:"buy",shop:"furniture"},{sign:"furniture",tower:true});
  house(g,d,"heiwadai_bread",4,11,5,3,"こみちの パンや","#D5AA82",{type:"work",shop:"bakery"},{sign:"bakery"});
  for(const [i,x,y] of [[0,3,3],[1,9,3],[2,4,20],[3,10,19],[4,35,12],[5,41,13],[6,34,29],[7,40,29],[8,27,36],[9,35,39]]) {
    house(g,d,"heiwadai_house"+i,x,y,3,3,"ろじうらの おうち",["#D6A7B5","#98BBAE","#D6B68D"][i%3],null,{flowers:true});
  }
  // 公園の外周と小道。通路から池・あそび場へ寄り道できる。
  for(let y=25;y<=32;y++) for(let x=11;x<=22;x++) g[y][x]=".";
  road(g, [[11,25],[22,25],[22,32],[11,32],[11,25]],1,"p");
  road(g, [[11,28],[15,28],[18,30],[22,30]],1,"-");
  prop(d,"heiwadai_fountain","fountain",17,26,3,2,"しゅわーっ！ みずの にじが みえた！");
  prop(d,"heiwadai_swing","swing",12,29,2,1,"ゆらゆら。じゅんばんこで あそぼう！");
  prop(d,"heiwadai_clock","clocktower",24,18,1,1,"えきまえの とけい。でんしゃは いつでも のれるよ。");
  prop(d,"heiwadai_signal","signal",26,11,1,1,"ぴっぽー。みぎ ひだりを よく みてね。");
  prop(d,"heiwadai_cart","flowercart",9,26,2,1,"ろじうらで みつけた おはなの ワゴン！");
  prop(d,"heiwadai_track","railway",25,4,8,1,null);
  prop(d,"heiwadai_bus","busstop",23,10,2,1,"えきまえの バスてい。あめの ひも ぬれずに まてるね。");
  prop(d,"heiwadai_bikes","bicycles",32,11,2,1,"じてんしゃが ずらり！ えきまで すいすい。");
  prop(d,"heiwadai_drink","vending",34,9,1,1,"つめたい ジュースの じどうはんばいき。\nおやつは マーケットで えらぼう！");
  for(const [x,y,ch] of [[27,11,"f"],[31,11,"f"],[33,13,"L"],[21,12,"A"],[23,17,"f"],[34,17,"f"],[8,18,"L"],[38,26,"L"],[15,35,"A"],[20,35,"A"],[24,32,"f"],[35,35,"A"]])if(!"#D".includes(g[y][x]))g[y][x]=ch;
  for(const [x,y,ch] of [[12,26,"A"],[21,29,"A"],[16,31,"n"],[14,26,","],[20,31,","],[22,20,"L"],[37,18,"L"],[7,36,"f"],[29,31,"f"],[32,39,"n"]]) g[y][x]=ch;
  person(d,"heiwadai_local",25,21,"まちの ハル","えきまえから ろじへ はいると、こうえんが あるよ。\nふんすいや ブランコを タップしてみて！");
  d.signs.push({x:22,y:40,text:"きた：平和台えき ／ ひがし：そらいろくうこう\nにしの ろじを ぬけると さつきの こうえん"});
  d.chests.push({id:"heiwadai_lane",x:6,y:36,loot:{bag:"deza_tart",n:2}});
  d.warps.push({x:23,y:43,w:2,h:1,to:"city",tx:17,ty:1,dir:"down"},{x:47,y:23,w:1,h:2,to:"airport",tx:1,ty:24,dir:"right"});
  hw.finish();

  const port=blank("harbor","あおぞらポート",40,34,"p","harbor");
  for(let y=1;y<33;y++) for(let x=23;x<39;x++) port.g[y][x]="~";
  road(port.g,[[11,0],[11,9],[18,13],[18,26],[8,29]],3,"=");
  road(port.g,[[2,18],[11,18],[18,23],[34,23]],2,"b");
  road(port.g,[[18,12],[33,12]],2,"b");
  house(port.g,port.d,"harbor_ferry",19,17,5,3,"ふねの のりば","#8ABACC",{type:"transit",stop:"harbor_ferry"},{terminal:"ferry",sign:"ferry"});
  house(port.g,port.d,"harbor_air",19,6,5,3,"すいじょうき のりば","#B6ACC9",{type:"transit",stop:"harbor_air"},{terminal:"plane",sign:"plane"});
  house(port.g,port.d,"harbor_market",3,5,5,4,"みなと マルシェ","#DFAC88",{type:"buy",shop:"market"},{sign:"market",awning:["#EEBDA0","#FFF"]});
  house(port.g,port.d,"harbor_warehouse",3,22,5,4,"みなとの かぐや","#A6B9BC",{type:"buy",shop:"furniture"},{sign:"furniture"});
  prop(port.d,"port_light","lighthouse",33,27,2,2,"とおくの ふねへ ぴかーっ！",{ground:"plaza"});
  road(port.g,[[18,28],[34,28]],1,"b");
  prop(port.d,"port_crane","crane",4,13,3,2,"おもたい にもつを ぐいーん。みんなで はこぼう！");
  prop(port.d,"port_boat","sailboat",28,19,3,2,null);
  prop(port.d,"port_plane","floatplane",29,8,4,2,null);
  prop(port.d,"port_scope","telescope",30,24,1,1,"うみの むこうに ちいさな しまが みえる！");
  person(port.d,"portguide",15,17,"みなとの ペペ","ふねは ビーチへ、すいじょうきは くうこうへ。\nりょうきんは かからないよ！","penguin");
  port.d.warps.push({x:10,y:0,w:3,h:1,to:"coast",tx:11,ty:28,dir:"up"});
  for(let x=10;x<=12;x++)port.g[0][x]="=";
  port.d.chests.push({id:"port_boardwalk",x:8,y:30,loot:{coins:100}});
  port.finish();

  const air=blank("airport","そらいろくうこう",44,34,".","airport");
  for(let y=3;y<14;y++)for(let x=3;x<41;x++)air.g[y][x]="v";
  road(air.g,[[0,24],[12,24],[20,28],[37,28],[37,18]],3,"=");
  road(air.g,[[8,18],[28,18],[28,29]],2,"p");
  house(air.g,air.d,"airport_air",14,15,9,5,"そらの ターミナル","#89B8CD",{type:"transit",stop:"airport_air"},{terminal:"plane",sign:"plane"});
  station(air.g,air.d,"airport_station",4,19,"くうこうえき");
  prop(air.d,"airport_plane","floatplane",25,7,4,2,null);
  prop(air.d,"airport_tower","controltower",34,15,2,2,"かんせいとうから くうこうを みわたそう！");
  prop(air.d,"airport_wind","windsock",7,6,1,1,"かぜは どっちから？ ふきながしが おしえてくれるよ。");
  prop(air.d,"airport_scope","telescope",29,19,1,1,"ひこうきが はなれていく！\nガゥー！ そらを とんでみたいね。");
  prop(air.d,"airport_clock","clocktower",24,25,1,1,"そらの たびは ターミナルから。3にんで しゅっぱつ！");
  for(const [x,y,ch] of [[4,28,"A"],[10,27,"f"],[13,29,"n"],[31,29,"A"],[38,22,"L"]])air.g[y][x]=ch;
  person(air.d,"airguide",25,21,"パイロットの ソラ","みなとの すいじょうき のりばへ とべるよ。\nくうこうえきからは でんしゃで おでかけ！","sheep");
  air.d.warps.push({x:0,y:24,w:1,h:3,to:"heiwadai",tx:46,ty:23,dir:"left"});
  air.finish();

  patch("town",(g,d)=>{
    station(g,d,"town_station",30,1,"ぽかぽかえき");
    road(g,[[32,4],[32,7]],1);
    road(g,[[24,21],[26,22],[26,26],[30,28]],1);
    d.objects[0].id="town_fountain"; d.objects[0].text="しゅわーっ！ ふんすいが たかく あがった！";
    prop(d,"town_wheel","waterwheel",27,16,2,2,"くるくる まわる すいしゃ。おみずの ちからだね。",{solid:true});
    prop(d,"town_cart","flowercart",30,13,2,1,"かわぞいの おはなは いい かおり！");
  });
  patch("city",(g,d)=>{
    // 区画のあいだを折れ曲がる路地と、噴水・広場を中心にした環状の散歩道。
    for(let y=16;y<=18;y++)for(let x=1;x<35;x++)if(g[y][x]==="=")g[y][x]="v";
    for(let y=1;y<31;y++)for(let x=16;x<=18;x++)if(g[y][x]==="=")g[y][x]="v";
    road(g,[[11,2],[12,10],[14,11],[14,20],[11,22],[11,29]],1);
    road(g,[[21,8],[21,21],[33,21],[33,29]],1);
    station(g,d,"city_station",10,25,"シティえき");
    prop(d,"city_fountain","fountain",22,20,3,2,"ビルの あいだに みずの にじ！");
    prop(d,"city_clock","clocktower",12,21,1,1,"とけいが こつこつ。まちは きょうも にぎやか！");
    prop(d,"city_signal","signal",19,19,1,1,"あおに なったら みぎ ひだりを みて わたろう。");
    prop(d,"city_cart","flowercart",29,13,2,1,"マルシェの おはなを ながめて ひとやすみ。");
    prop(d,"city_bus","busstop",11,13,2,1,"シティの バスてい。まどに ビルが うつっている！");
    prop(d,"city_drink","vending",21,5,1,1,"いろんな ジュースが ならんでいるよ。");
    prop(d,"city_bikes","bicycles",20,28,2,1,"こうえんの よこに じてんしゃおきば。");
    house(g,d,"city_cafe",6,19,4,3,"ろじうら カフェ","#C2A3C7",{type:"visit",text:"テラスで ひとやすみ。\nここの デザは あまい かおり！"},{sign:"crepe",awning:["#DBBEDF","#FFF"]});
    for(let x=16;x<=18;x++){g[0][x]="v";g[1][x]="v";g[15][x]="z";}
    d.warps.push({x:16,y:0,w:3,h:1,to:"heiwadai",tx:23,ty:42,dir:"up"});
    d.signs.push({x:19,y:3,text:"きたへ いくと 平和台（へいわだい）\nえきからは でんしゃで おでかけ！"});
  });
  patch("coast",(g,d)=>{
    road(g,[[11,29],[11,26],[16,24],[19,23]],2,"=");
    house(g,d,"coast_ferry",22,20,5,3,"ビーチの のりば","#99C5C9",{type:"transit",stop:"coast_ferry"},{terminal:"ferry",sign:"ferry"});
    d.warps.push({x:11,y:29,w:2,h:1,to:"harbor",tx:11,ty:1,dir:"down"});
    prop(d,"coast_parasol","parasol",4,13,2,1,"パラソルの かげで ひとやすみ。うみかぜが きもちいい！");
    prop(d,"coast_scope","telescope",32,24,1,1,"とおくで ふねが てを ふっているよ！",{ground:"bridge"});
    prop(d,"coast_boat","sailboat",30,15,3,2,null);
    prop(d,"coast_parasol2","parasol",19,7,2,1,"なみの おとを ききながら のんびり。",{solid:true});
  });

  // 外の世界では、既存の道・敵・宝箱をふさがない空き地だけを使う。
  const clearing = (id, kind, wantX, wantY, w, h, text) => {
    const d=MAP_DEFS[id], m=new WorldMap(id), candidates=[];
    for(let y=2;y<m.h-h-2;y++)for(let x=2;x<m.w-w-2;x++) {
      let free=true;
      for(let yy=y-1;yy<=y+h;yy++)for(let xx=x-1;xx<=x+w;xx++) {
        if(m.isSolid(xx,yy)||m.warpAt(xx,yy)||(d.spawns||[]).some(p=>p[0]===xx&&p[1]===yy)||(d.npcs||[]).some(n=>n.x===xx&&n.y===yy)||(d.boss&&Math.abs(d.boss.x-xx)<3&&Math.abs(d.boss.y-yy)<3))free=false;
      }
      if(free)candidates.push({x,y,dist:Math.abs(x-wantX)+Math.abs(y-wantY)});
    }
    candidates.sort((a,b)=>a.dist-b.dist);
    if(candidates.length) { const {x,y}=candidates[0]; prop(d,id+"_"+kind,kind,x,y,w,h,text); }
  };
  clearing("meadow","windmill",6,9,2,2,"くるくる！ はらっぱの かぜを つかまえた！");
  clearing("meadow","flowercart",22,29,2,1,"はらっぱの おはなを みつけたよ！");
  clearing("forest","waterwheel",7,15,2,2,"こぽこぽ。もりに みずの おとが ひびく。");
  clearing("forest","swing",20,23,2,1,"もりの ブランコ！ 3にんで じゅんばんこ。");
  clearing("cave","glowstone",8,12,2,1,"ぽわーん。すいしょうが こえに あわせて ひかる！");
  clearing("cave","minecart",18,24,2,1,"ごとごと。むかしの トロッコが うごいた！");

  for(const [id,bpm,notes] of [["heiwadai",105,"E5 . G5 A5 G5 . E5 D5 C5 . E5 G5 D5 . C5 ."],["harbor",92,"G5 . E5 D5 C5 E5 G5 . A5 . G5 E5 D5 . C5 ."],["airport",112,"C5 E5 G5 . A5 G5 C6 . B5 A5 G5 E5 F5 D5 C5 ."]]) SONGS[id]={bpm,tracks:[{wave:"sine",vol:.12,notes},{wave:"triangle",vol:.15,notes:"C3 . G3 . A2 . E3 . F3 . C3 . G2 . D3 ."}]};
})();
