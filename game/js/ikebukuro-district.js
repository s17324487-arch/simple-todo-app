// 駅東口からサンシャイン通りへ。地下鉄専用の大型商業地区。
const IkebukuroDistrict={
  changed:{city_clothes:'mall',city_market:'mall',city_furniture:'mall',city_gallery:'mall',relay:'mall',city_reading:'mall',city_cafe:'mall',city_office:'office'},
  install(){
    const d=MAP_DEFS.city,W=64,H=68,g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<44&&x<48?d.rows[y][x]:'p'));
    d.objects=d.objects.filter(o=>!(o.background&&(o.x===47||o.y===43)));
    for(let y=0;y<44;y++)if(g[y][47]==='#')g[y][47]='p';for(let x=0;x<48;x++)if(g[43][x]==='#')g[43][x]='p';
    for(const r of d.roads){const b=r.pieces[0].b;if(b[0]===48)b[0]=64;if(b[1]===44)b[1]=68;}
    for(const y of [53,65])d.roads.push({id:'ike-sunshine-'+y,carriage:2,side:2,pieces:[{t:'seg',a:[0,y],b:[64,y]}]});
    d.roads.push({id:'ike-east-ring',carriage:2,side:2,pieces:[{t:'seg',a:[61,0],b:[61,68]}]});
    const add=(id,x,y,w,h,style,label,act)=>{const door=Math.floor(w/2);d.buildings.push({id,x,y,w,h,door,style,label,act});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)g[yy][xx]='#';g[y+h-1][x+door]='D';for(let yy=y+h;yy<y+h+3;yy++)g[yy][x+door]='=';};
    add('ike_electronics',3,44,18,6,'city_electronics','ネリカス電機 10F',{type:'venue',venue:'electronics'});
    add('ike_mall',29,44,28,6,'city_sunshine','サンシャインいけぶ',{type:'venue',venue:'mall'});
    add('ike_arcade',3,56,18,6,'city_gamecenter','Meeときょれじゃ',{type:'venue',venue:'arcade'});
    add('ike_office',29,56,16,6,'city_officetower','ままの オフィス',{type:'venue',venue:'office'});
    for(const [i,y]of [4,17,31,56].entries())add('ike_annex'+i,49,y,i===3?8:8,y===56?6:6,['city_cinema','city_bookshop','city_hotel','city_garden'][i],['シネマの壁画','本のギャラリー','東口ホテル','屋上庭園'][i],{type:'visit',text:'池袋の まちなみを たのしもう。おかいものは 大きな おみせの なかへ！'});
    for(const [id,venue]of Object.entries(this.changed)){const b=d.buildings.find(b=>b.id===id);b.act={type:'venue',venue};b.label=venue==='office'?'オフィス受付':'サンシャインいけぶ 別館';delete b.sign;}
    // お手伝いの評判IDを残し、住宅街で続けられる入口を設ける。
    for(const [i,shop,label]of [[0,'groom','おしゃれサロン'],[1,'relay','おとどけセンター'],[2,'burger','バーガーキッチン']]){const b=MAP_DEFS.town.buildings.find(b=>b.id==='nerikasu_home'+i);b.act={type:'work',shop};b.label=label;b.sign=shop;}
    d.warps=[];d.name='池袋';d.views.push([12,53],[43,53],[12,65],[37,65]);
    const reserved=new Set(d.npcs.map(n=>n.x+','+n.y));for(const b of d.buildings)for(let yy=b.y+b.h;yy<b.y+b.h+3;yy++)reserved.add((b.x+b.door)+','+yy);
    let serial=0;const props=['city_metro','city_screen','city_bikerack','city_coffee','city_delivery','city_kiosk','city_billboard','planter','lamp','treegrate','bench','direction'];
    const prop=(kind,x,y)=>{if(x<0||y<0||x>=W||y>=H||'#D'.includes(g[y][x])||reserved.has(x+','+y)||d.objects.some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h))return;d.objects.push({id:'ike_decor_'+serial++,kind,x,y,w:1,h:1,solid:true});};
    for(const b of d.buildings.filter(b=>b.id.startsWith('ike_')))for(let x=b.x;x<b.x+b.w;x+=2){prop(props[(x+b.y)%props.length],x,b.y+b.h);prop('planter',x,b.y-1);}
    for(const y of [10,16,21,27,36,42,55,67])for(let x=49;x<59;x+=2)prop(props[(x+y)%props.length],x,y);
    for(const x of [22,28,58,60])for(let y=45;y<67;y+=4)prop(props[(x+y)%props.length],x,y);
    for(const [i,x,y]of [[0,6,51],[1,18,51],[2,34,51],[3,45,51],[4,55,51],[5,8,63],[6,19,63],[7,35,63],[8,43,63],[9,52,63],[10,54,11],[11,54,22],[12,54,37],[13,46,11],[14,46,37],[15,26,51],[16,26,63],[17,47,22],[18,13,51]]){const id='ike_visitor'+i;d.npcs.push({id,x,y,sp:['cat','rabbit','sheep'][i%3],dir:'down',name:'おかいものの ひと',talk:id});TALKS[id]={first:['東口の 通りを あるいて、今日は なにを えらぼうかな。'],lines:[['展示を タップすると、その場で おかいもの できるよ。']]};TOWNSFOLK_DATA.crowd[id]='city_commuter';d.objects=d.objects.filter(o=>!(x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h));}
    const rg=TownRoads.grid(d,W,H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(rg[y][x]&&!['#','D'].includes(g[y][x]))g[y][x]='=';
    for(let y=44;y<H;y++)if(!rg[y][0]){g[y][0]='#';d.objects.push({id:'ike_edge'+y,kind:'citywall',x:0,y,w:1,h:1,solid:true,background:true});}
    d.rows=g.map(r=>r.join(''));
  },
  facade(sp){
    const w=sp.w*32,h=sp.h*32+24,type=sp.style,r=(x,y,ww,hh,c)=>`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${c}" stroke="${INK}" stroke-width="1.5"/>`;
    const colors={city_electronics:'#A8BAC5',city_sunshine:'#DFCDB7',city_gamecenter:'#CEB5CD',city_officetower:'#A8C0C2',city_cinema:'#AEA8BA',city_bookshop:'#B7C8B0',city_hotel:'#C6B6A8',city_garden:'#B1C9AB'},c=colors[type];let a=r(4,15,w-8,h-20,c)+r(0,10,w,10,'#677C80');
    const rows=type==='city_electronics'?10:type==='city_sunshine'?3:5,step=(h-70)/rows;
    for(let row=0;row<rows;row++)for(let x=13;x<w-25;x+=35)a+=r(x,28+row*step,23,Math.max(5,step-5),'#D9E5DE');
    if(type==='city_electronics'){a+=r(6,28,34,h-38,'#657D9A');for(let i=0;i<10;i++)a+=`<text x="23" y="${39+i*(h-60)/10}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="${i===0||i===8?'#FFE6A3':'#D4E0DF'}">${10-i}F</text>`;a+=r(w-49,29,38,h-40,'#8FABC1');for(let i=0;i<3;i++)a+=r(w-44,40+i*40,28,29,['#D9DCAB','#D8B9C6','#B2CEC8'][i]);}
    if(type==='city_sunshine'){for(let x=10;x<w-30;x+=50)a+=r(x,h-54,39,36,'#9CBFC0');for(const y of [46,98])a+=r(0,y,w,9,'#B9A58E');a+=`<path d="M${w/2-76} 28Q${w/2} -16 ${w/2+76} 28Z" fill="#B1D1D0" stroke="${INK}" stroke-width="2"/>`;for(let x=12;x<w;x+=96)a+=r(x,30,9,h-35,'#EDE1CB');}
    if(type==='city_officetower'){a+=r(w-78,6,69,h-11,'#72949B');for(let x=w-70;x<w-20;x+=17)a+=r(x,17,9,h-39,'#B4D0CE');a+=r(9,15,w*.32,15,'#799397');}
    if(type==='city_cinema')a+=r(14,36,w-28,h-105,'#746C83')+`<path d="M30 50L70 89 111 48 159 84 204 42V${h-73}H30Z" fill="#B7AEC9"/><circle cx="${w-50}" cy="58" r="17" fill="#EDD9A4"/>`;
    if(type==='city_bookshop')for(let x=20;x<w-20;x+=22)a+=r(x,h-103,15,38,['#BB9299','#AAC2B1','#9EAFCE'][Math.floor(x/22)%3]);
    if(type==='city_hotel')a+=`<path d="M0 17L40 0H${w-40}L${w} 17Z" fill="#968477" stroke="${INK}"/><path d="M${w/2-44} ${h-48}Q${w/2} ${h-100} ${w/2+44} ${h-48}" fill="#D8C2A5" stroke="${INK}"/>`;
    if(type==='city_garden')for(let x=17;x<w-10;x+=25)a+=`<circle cx="${x}" cy="21" r="15" fill="#9FB68F" stroke="${INK}" stroke-width="1.5"/>`;
    a+=r(w/2-30,h-48,60,43,'#517A80')+r(w/2-25,h-41,50,35,'#B7D7D6')+r(w/2-140,h-76,280,24,'#FFF4D8')+`<text x="${w/2}" y="${h-59}" text-anchor="middle" font-family="sans-serif" font-size="15" fill="${INK}">${sp.label}</text>`;
    if(type==='city_gamecenter'){a+=`<path d="M0 ${h-75}Q${w/2} ${h-108} ${w} ${h-75}v12H0Z" fill="#AA8AB3" stroke="${INK}"/><circle cx="${w/2}" cy="45" r="23" fill="#FAE4AD" stroke="${INK}"/><text x="${w/2}" y="51" text-anchor="middle" font-size="18">Mee</text>`;for(const x of [w*.2,w*.8])a+=`<path d="${starPath(x,62,25,12)}" fill="#E7C987" stroke="${INK}"/>`+r(x-31,h-53,62,47,'#B4D3D5');}
    return {w,h,svg:a};
  },
  art(){const previous=WorldArt.building;WorldArt.building=sp=>['city_electronics','city_sunshine','city_gamecenter','city_officetower','city_cinema','city_bookshop','city_hotel','city_garden'].includes(sp.style)?this.facade(sp):previous(sp);},
};
IkebukuroDistrict.install();IkebukuroDistrict.art();
for(const sign of MAP_DEFS.town.signs)sign.text=sign.text.replace('シティ','平和台');

const IkebukuroVenues={
  exhibit(id,x,y,shop){const it=VenueHalls.item(id),kind=ITEM_INDEX[id]?'wear':BAG_INDEX[id]?'bag':'furn';return {kind,item:id,x,y,w:2,h:1,label:it.name,action:'buy',shop:'ike_'+shop,kindOf:kind};},
  install(){
    const ids=IkebukuroCatalog.groups.electronics;
    const electronics={name:'ネリカス電機',start:2,bgm:'shop_ike_electronics',floors:{}};
    for(const floor of [2,10]){const items=ids.slice(floor===2?0:12,floor===2?12:24);electronics.floors[floor]={w:28,h:30,title:floor+'F '+(floor===2?'くらしの 家電':'映像・電話・あかり'),floor:'#DDE3DF',accent:'#8BACBA',fixtures:[{kind:'elevator',x:22,y:3,w:4,h:1,label:'エレベーター 2F／10F',action:'elevator'},...items.map((id,i)=>this.exhibit(id,3+i%4*6,8+Math.floor(i/4)*7,'electronics'))]};}
    VenueHalls.defs.electronics=electronics;
    const mall={name:'サンシャインいけぶ',bgm:'shop_ike_hane',floors:{}};
    for(let floor=1;floor<=3;floor++){
      const r={w:38,h:38,title:floor+'F サンシャインいけぶ',floor:'#E8DFCD',accent:['','#B6C9BD','#CBB6A7','#B2BDD0'][floor],fixtures:[],zones:[]};
      if(floor===1)r.fixtures.push({kind:'fountain',x:16,y:15,w:6,h:4,label:'ふんすい広場',action:'info',text:'3かいまで つながる ふきぬけ。\nみずのおとが きこえるね。'});else r.hole={x:15,y:14,w:8,h:9};
      if(floor<3)r.fixtures.push({kind:'escalator',x:27,y:17,w:4,h:2,label:(floor+1)+'Fへ のぼる',action:'floor',to:floor+1,spawn:[27,20]});
      if(floor>1)r.fixtures.push({kind:'escalator',x:8,y:17,w:4,h:2,label:(floor-1)+'Fへ おりる',action:'floor',to:floor-1,spawn:[10,20]});
      if(floor===1)for(const [shop,x,y,label,color]of [['hane',3,6,'はねーず','#DDB5CC'],['animal',23,6,'あにまるず','#B3C7AC'],['gothic',3,27,'ごしごし','#B7A7C3'],['luxury',23,27,'いいつか家具','#C8B78F']]){r.zones.push({x:x-1,y:y-2,w:13,h:9,label,color});IkebukuroCatalog.groups[shop].forEach((id,i)=>r.fixtures.push(this.exhibit(id,x+i%3*4,y+Math.floor(i/3)*4,shop)));}
      if(floor===2)for(const [shop,x,y,label,color]of [['cafe',3,6,'すばーたっくす','#B0C3AD'],['crepes',23,6,'でぃっぱーどん','#E0BFBC'],['boba',23,27,'たぴ','#C7B5D0']]){r.zones.push({x:x-1,y:y-2,w:13,h:9,label,color});r.fixtures.push({kind:'counter',x,y,w:10,h:1,label,action:'eat',menu:IkebukuroCatalog.groups[shop]});for(let i=0;i<2;i++)r.fixtures.push({kind:'table',x:x+i*6,y:y+4,w:3,h:1,label:label+'の テーブル',action:'eat',menu:IkebukuroCatalog.groups[shop]});}
      if(floor===3){r.zones.push({x:2,y:4,w:14,h:9,color:'#B1C1A1',label:'池袋マルシェ'},{x:23,y:4,w:13,h:9,color:'#C0B0D1',label:'なかよしパズル'});IkebukuroCatalog.groups.marche.forEach((id,i)=>r.fixtures.push(this.exhibit(id,3+i*4,7,'marche')));r.fixtures.push({kind:'counter',x:24,y:7,w:8,h:1,label:'なかよしパズル',action:'puzzle'},{kind:'table',x:5,y:28,w:3,h:1,label:'ひとやすみ',action:'sit'});}
      r.mall=true;
      for(const z of r.zones){r.fixtures.push({kind:'partition',x:z.x,y:z.y,w:z.w,h:1,height:30},{kind:'npc',sp:floor===2?'cat':floor===3?'pig':'sheep',x:z.x+1,y:z.y+4,w:1,h:1,label:'てんいん',action:'info',text:floor===2?'テーブルで メニューを えらんでね。':'展示を タップすると、その場で 買えるよ。'});if(floor===1)r.fixtures.push({kind:z.label==='いいつか家具'?'shelf':'rack',x:z.x+10,y:z.y+6,w:2,h:1});}
      for(const [x,y]of [[13,12],[24,12],[13,24],[24,24]])r.fixtures.push({kind:'planter',x,y,w:1,h:1});
      for(const [x,y]of [[16,10],[19,26]])r.fixtures.push({kind:'bench',x,y,w:3,h:1,label:'ベンチ',action:'sit'});
      for(const f of r.fixtures)if(f.kind==='counter'&&f.action==='eat')f.kind='foodcounter';
      mall.floors[floor]=r;
    }
    VenueHalls.defs.mall=mall;
    VenueHalls.defs.arcade={name:'Meeときょれじゃ',floors:{1:{w:14,h:32,title:'Meeときょれじゃ・1かい 100コイン',wall:'#3A3052',floor:'#5A4A7E',accent:'#E98DB5',fixtures:Array.from({length:8},(_,i)=>({kind:'crane',x:1+i%2*7,y:5+Math.floor(i/2)*6,w:5,h:2,label:['つかむ','スイーツ','トライポッド','リングフック'][Math.floor(i/2)]+' '+(i%2+1),action:'crane',machine:i}))}}};
    VenueHalls.defs.office={name:'ままの オフィス',floors:{1:{w:24,h:24,title:'ままの おしごと',floor:'#D7DDD6',fixtures:[{kind:'parent',x:12,y:7,w:1,h:1,label:'まま',action:'parent'},...[5,12,19].flatMap(x=>[10,16].map(y=>({kind:'officeDesk',x:x-1,y,w:3,h:1,label:'デスク',action:'info',text:'おしごとの じゃまを しないように、しずかにね。'})))]}}};
  },
};
IkebukuroVenues.install();
