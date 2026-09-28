// 昔の商店・住民・所持品のIDを残して、住宅街と通学路を拡張する。
const NerikasuNeighborhood={
  styles:['town_school','town_nursery','town_courthouse','town_rowhouse','town_modernhome','town_tilehouse','town_terrace'],
  facade(style){
    const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`,p=(d,c='none')=>`<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    const window=(x,y,w=20,h=26)=>r(x,y,w,h,'#B9D6D8')+p(`M${x+w/2} ${y}v${h}M${x} ${y+h*.55}h${w}`)+p(`M${x+3} ${y+h-4}l${w-6} -${h-8}`,'none');
    let a='';
    if(style==='town_school'){
      a=r(3,16,194,131,'#EEE6D5')+r(0,13,200,8,'#AAB7AF')+r(82,1,36,44,'#D6C8A5');
      for(const y of [37,72,108])for(const x of [12,43,136,167])a+=window(x,y,23,23);
      for(const y of [64,100,139])a+=r(3,y,194,5,'#B9BFB6');
      a+='<circle cx="100" cy="24" r="13" fill="#FCF9E7" stroke="'+INK+'" stroke-width="1.3"/>'+p('M100 15v9l8 5')+r(72,97,56,50,'#809D9B')+r(78,105,44,41,'#D6E3DB')+p('M100 105v40M73 150h54')+'<text x="100" y="76" text-anchor="middle" font-family="sans-serif" font-size="10" fill="'+INK+'">ネリカス小学校</text>';
      a+=p('M188 13V0m0 1h12v8h-12','#F4F0DF');
    }else if(style==='town_nursery'){
      a=r(7,53,186,93,'#F0DFCA')+p('M0 54L42 18h55l28 36Z','#B8C9A4')+p('M94 54L144 12l56 42Z','#E3BC9C')+window(15,82,36,43)+window(149,82,36,43)+r(64,78,72,68,'#F5EDCF');
      for(let i=0;i<6;i++)a+=r(64+i*12,61,12,17,['#E3B4BB','#E7CD93','#ABCCB7'][i%3]);
      a+=p('M69 139V90h61v49','#B9D8CD')+p('M99 90v49')+'<text x="100" y="46" text-anchor="middle" font-family="sans-serif" font-size="10" fill="'+INK+'">ネリカス保育園</text>';
      for(const x of [23,164])a+=p(`M${x} 135v15m-10-7h20`)+`<circle cx="${x}" cy="137" r="6" fill="#E7B3C5" stroke="${INK}"/>`;
    }else{
      const type=this.styles.indexOf(style),flat=type===4,terrace=type===6;
      a=r(12,52,176,95,['#E4D4BC','#DDDCCF','#D0DAD9','#EEE2D2','#E0D2BE'][type-2]);
      a+=flat?r(8,22,127,35,'#B7C8C5')+r(126,38,68,17,'#A9BBB7'):p(type===3?'M0 54L40 10h63l12 17h49l36 27Z':'M0 54L47 16h106l47 38Z',type===5?'#7E898A':'#B99B83');
      for(let x=24;x<175;x+=42)a+=window(x,75,28,29);
      if(type===2)a+=r(13,115,174,18,'#B5A68D')+Array.from({length:14},(_,i)=>p(`M${18+i*12} 115v18`)).join('');
      if(terrace)a+=p('M8 139V93h183v46M10 98h180M20 98v43m30-43v43m30-43v43m30-43v43m30-43v43m30-43v43','#D1BC99');
      a+=r(77,109,45,39,'#849F9C')+window(83,114,32,25)+r(63,148,74,6,'#BFAF97');
      if(type===5)for(let y=27;y<50;y+=8)a+=p(`M${45-y/3} ${y}h${109+y/2}`);
      if(flat)a+=r(26,32,91,15,'#708C98')+p('M49 33v12m24-12v12m23-12v12','#708C98');
      a+=r(20,128,39,15,'#C6A587')+r(143,128,36,15,'#C6A587');for(const x of [28,43,152,167])a+=`<circle cx="${x}" cy="127" r="7" fill="#A6BF94" stroke="${INK}" stroke-width="1"/>`;
    }
    return a;
  },
  wideFacade(sp,w,h){
    const nursery=sp.style==='town_nursery',r=(x,y,ww,hh,c)=>`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${c}" stroke="${INK}" stroke-width="1.5"/>`;let a=r(3,30,w-6,h-34,nursery?'#F0DFCA':'#EEE6D5')+r(0,23,w,9,nursery?'#B8C9A4':'#AAB7AF');
    for(const y of nursery?[73,127]:[51,96,143])for(let x=15;x<w-34;x+=42)if(Math.abs(x-w/2)>62)a+=r(x,y,29,29,'#B9D6D8')+`<path d="M${x+14} ${y}v29m-14-13h29" stroke="${INK}" fill="none" stroke-width="1.2"/>`;
    a+=r(w/2-47,h-65,94,60,'#809D9B')+r(w/2-38,h-55,76,49,'#D6E3DB')+`<path d="M${w/2} ${h-55}v49" stroke="${INK}"/>`+r(w/2-108,h-91,216,24,'#FFF1D6')+`<text x="${w/2}" y="${h-74}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${INK}">${nursery?'ネリカス保育園':'ネリカス小学校'}</text>`;
    if(!nursery)a+=r(w/2-28,2,56,58,'#D6C8A5')+`<circle cx="${w/2}" cy="29" r="20" fill="#FFF5D9" stroke="${INK}" stroke-width="2"/><path d="M${w/2} 14v15l13 7" stroke="${INK}" stroke-width="2" fill="none"/>`;
    else for(let x=0;x<w;x+=80)a+=`<path d="M${x} 24l40-20 40 20Z" fill="${x%160?'#E0BDAB':'#B8C9A4'}" stroke="${INK}"/>`;
    return a;
  },
  installArt(){const original=WorldArt.building;WorldArt.building=sp=>{if(!this.styles.includes(sp.style))return original(sp);const w=sp.w*32,h=sp.h*32+24;return {w,h,svg:['town_school','town_nursery'].includes(sp.style)?this.wideFacade(sp,w,h):`<g transform="scale(${w/200} ${h/160})">${this.facade(sp.style)}</g>`};};},
  install(){
    const d=MAP_DEFS.town,W=64,H=68,oldW=d.rows[0].length,oldH=d.rows.length;
    const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x<oldW&&y<oldH?d.rows[y][x]:'.'));
    d.objects=d.objects.filter(o=>!(o.background&&(o.x===oldW-1||o.y===oldH-1)));
    for(let y=0;y<oldH;y++)if(g[y][oldW-1]==='#')g[y][oldW-1]='.';
    for(let x=0;x<oldW;x++)if(g[oldH-1][x]==='#')g[oldH-1][x]='.';
    for(let y=oldH;y<H;y++){g[y][36]='~';g[y][37]='~';}
    for(const road of d.roads){const b=road.pieces[0].b;if(b[0]===48)b[0]=64;if(b[1]===44)b[1]=68;}
    for(const y of [53,65])d.roads.push({id:'school-street-'+y,carriage:2,side:2,pieces:[{t:'seg',a:[0,y],b:[64,y]}]});
    d.roads.push({id:'residential-walk',carriage:2,side:1,pieces:[{t:'seg',a:[61,0],b:[61,68]}]});
    const build=(id,x,y,w,h,style,label,act)=>{const door=Math.floor(w/2);d.buildings.push({id,x,y,w,h,door,style,label,act:act||{type:'visit',text:'おにわの おはなが きれいだね。しずかに おさんぽ しよう。'}});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)g[yy][xx]='#';g[y+h-1][x+door]='D';for(let yy=y+h;yy<=y+h+2;yy++)g[yy][x+door]='=';};
    build('nerikasu_school',3,56,24,6,'town_school','ネリカス小学校',{type:'venue',venue:'school'});
    build('nerikasu_gatehouse',38,44,2,4,'town_terrace','かわべの あずまや');
    build('nerikasu_nursery',38,56,19,6,'town_nursery','ネリカス保育園',{type:'venue',venue:'nursery'});
    for(const [i,x,y,w]of [[0,49,4,9],[1,49,18,9],[2,49,32,9],[3,3,45,7],[4,13,45,7],[5,22,45,6],[6,40,45,7],[7,50,45,8]])build('nerikasu_home'+i,x,y,w,5,this.styles[2+i%5],'にわのある おうち');
    const reserved=new Set();for(const b of d.buildings)for(let y=b.y+b.h;y<=b.y+b.h+2;y++)reserved.add((b.x+b.door)+','+y);
    let propSerial=0;
    const prop=(kind,x,y,extra={})=>{if(x<0||y<0||x>=W||y>=H||'#~D'.includes(g[y][x])||reserved.has(x+','+y)||d.objects.some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h)||d.npcs.some(n=>n.x===x&&n.y===y))return;
      d.objects.push({id:'nerikasu_decor_'+propSerial++,kind,x,y,w:1,h:1,solid:true,...extra});};
    const palette=['planter','bicycles','postbox','town_watering','town_pinwheel','town_herbs','bench','newsbox','chalkboard','town_milk','recycle','direction'];
    // 家の前庭・塀ぎわ・通学路にだけ、用途のある小物をまとめる。
    for(const b of d.buildings.filter(b=>b.id.startsWith('nerikasu'))){for(let x=b.x;x<b.x+b.w;x+=2){prop(palette[(x+b.y)%palette.length],x,b.y+b.h);if(x!==b.x+b.door)prop('planter',x,b.y-1);}}
    for(const y of [9,13,23,27,37,41,55,67])for(let x=y<43?49:3;x<60;x+=3)if(Math.abs(x-31)>4&&Math.abs(x-36)>2)prop(palette[(x+y)%palette.length],x,y);
    for(let y=3;y<67;y+=4){prop(y%8===3?'lamp':'treegrate',60,y);prop(palette[y%palette.length],58,y+1);}
    for(const y of [53,65]){d.crosswalks.push({x0:27,x1:28.4,y0:y-1,y1:y+1,bars:'h'});d.crosswalks.push({x0:29,x1:33,y0:y-3.7,y1:y-2.3,bars:'v'});}
    for(const [i,x,y]of [[0,53,11],[1,53,25],[2,53,39],[3,7,51],[4,17,51],[5,27,51],[6,42,51],[7,53,51],[8,8,63],[9,22,63],[10,42,63],[11,53,63],[12,34,51],[13,34,63]]){d.objects=d.objects.filter(o=>!(o.x===x&&o.y===y));const id='nerikasu_neighbor'+i;d.npcs.push({id,x,y,sp:['rabbit','cat','sheep','mouse'][i%4],name:i>7?'せんせい':'ごきんじょさん',dir:'down',talk:id});TALKS[id]={first:['ネリカスタウンへ ようこそ。こどもたちの こえが きこえるね。'],lines:[['がっこうも ほいくえんも、なかを みていってね。']]};}
    for(const y of [45,49,53,57,61,65])for(const x of [28,33])prop(palette[y%palette.length],x,y);
    for(const n of d.npcs.filter(n=>n.id.startsWith('nerikasu'))){TOWNSFOLK_DATA.crowd[n.id]='town_walker';}
    const rg=TownRoads.grid(d,W,H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(rg[y][x]&&!['#','D'].includes(g[y][x]))g[y][x]='=';
    for(let x=0;x<W;x++)if(!rg[H-1][x]){g[H-1][x]='#';d.objects.push({id:'nerikasu_edge_b'+x,kind:'gardenwall',x,y:H-1,w:1,h:1,background:true,solid:true});}
    for(let y=oldH;y<H;y++)if(!rg[y][0]){g[y][0]='#';d.objects.push({id:'nerikasu_edge_l'+y,kind:'gardenwall',x:0,y,w:1,h:1,background:true,solid:true});}
    const east=d.warps.find(w=>w.to==='heiwadai');east.x=63;d.warps.find(w=>w.to==='meadow').y=67;
    Object.assign(MAP_DEFS.heiwadai.warps.find(w=>w.to==='town'),{tx:62,ty:11});Object.assign(MAP_DEFS.meadow.warps.find(w=>w.to==='town'),{tx:31,ty:66});
    d.rows=g.map(row=>row.join(''));d.views.push([15,64],[48,64],[18,53]);
  },
};
NerikasuNeighborhood.installArt();NerikasuNeighborhood.install();

VenueHalls.defs.school={name:'ネリカス小学校',floors:{1:{w:22,h:24,title:'ネリカス小学校・きょうしつ',wood:true,accent:'#91ABA3',fixtures:[
  {kind:'blackboard',x:7,y:3,w:8,h:1,label:'こくばん',action:'info',text:'きょうの じかんわり\nこくご・さんすう・おんがく。なにを べんきょう しようかな？'},
  {kind:'npc',sp:'rabbit',x:10,y:5,w:1,h:1,label:'せんせい',action:'info',text:'ようこそ！ 3にんで きょうしつを みていってね。えほんも よめるよ。'},
  ...[9,13].flatMap(y=>[4,10,16].map(x=>({kind:'desk',x,y,w:2,h:1,label:'つくえ',action:'sit',text:'すわって えんぴつを もつよ。\nわんこ・がちゃん・ごじ、3にんの なまえを かけた！'}))),
  {kind:'shelf',x:1,y:8,w:2,h:3,label:'としょコーナー',action:'info',text:'もりと うみの えほん。\nページを めくるたびに、ぼうけんが はじまる。'},
  {kind:'easel',x:17,y:18,w:2,h:1,label:'ずこう',action:'info',text:'まる・さんかく・しかくで おうちを えがこう！'},
  {kind:'shoes',x:2,y:20,w:4,h:1,label:'くつばこ',action:'info',text:'うわばきに はきかえて、ろうかは ゆっくりね。'},
]}}};
VenueHalls.defs.nursery={name:'ネリカス保育園',floors:{1:{w:22,h:24,title:'ネリカス保育園・あそびの へや',wall:'#F3E3CE',floor:'#E7D8BF',accent:'#D7B4BC',wood:true,zones:[{x:5,y:8,w:12,h:8,color:'#B1CDBF',label:'みんなで あそぼう'}],fixtures:[
  {kind:'npc',sp:'sheep',x:10,y:5,w:1,h:1,label:'せんせい',action:'info',text:'いらっしゃい！ つみき・おえかき・おひるね。すきな あそびを みつけよう。'},
  {kind:'toys',x:5,y:10,w:3,h:1,label:'つみき',action:'info',text:'たかーい おしろが できた！\nガゥー！ きょうりゅうの おうち！'},
  {kind:'toys',x:13,y:12,w:3,h:1,label:'おままごと',action:'info',text:'きょうは バーガーやさんごっこ。\nデザも いっしょに どうぞ♪'},
  {kind:'shelf',x:2,y:5,w:4,h:1,label:'えほん',action:'info',text:'ぱぱと ままの だいすきな おはなしを きこう。'},
  {kind:'easel',x:17,y:5,w:2,h:1,label:'おえかき',action:'info',text:'3にんの にがおえを かいたよ。\nごじの おめめは あたまの うえ！'},
  ...[4,9,14].map(x=>({kind:'mat',x,y:18,w:3,h:2,label:'おひるね',action:'sit',text:'ふかふかの おふとん。\n3にんで ちょっと ひとやすみ……すやすや。'})),
  {kind:'shoes',x:2,y:22,w:4,h:1,label:'くつばこ',action:'info',text:'くつは そろえて おこうね。'},
]}}};
