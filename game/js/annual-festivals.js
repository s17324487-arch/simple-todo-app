// 毎月のおまつり。四季のスタンプと別のキーで記録し、昔の記念品も残す。
const ANNUAL_EVENTS = [
  {id:"newyear",name:"おしょうがつ",color:"#ADCEAF",motif:"bamboo",goal:"ことしの ねがいを 3にんで かざろう。",tasks:["ねがいを えらぼう","かざりを つくろう","あいさつを しよう"],choices:[["げんきに あそぶ","みんな なかよし"],["まつの かざり","うめの かざり"],["ことしも よろしく！","いっしょに あそぼう！"]],wear:"happi",slot:"body",furn:"かどまつ",food:"おもちデザ"},
  {id:"setsubun",name:"せつぶん",color:"#D8B1B1",motif:"oni",goal:"やさしい おにさんと まめあそび！",tasks:["おにの おめんを えらぼう","まめの まとを えらぼう","ふくを よぼう"],choices:[["にこにこ おに","おねむの おに"],["まるい まと","ほしの まと"],["ふくは うち！","なかよしは うち！"]],wear:"knit",slot:"head",furn:"にこにこ おにかざり",food:"まめクッキー"},
  {id:"hina",name:"ひなまつり",color:"#EDBDCF",motif:"dolls",goal:"3にんで おひなさまを かざろう。",tasks:["おきものを えらぼう","おはなを かざろう","デザを わけよう"],choices:[["ももの きもの","そらの きもの"],["ももの おはな","なのはな"],["みんなに ひとつずつ","ぱぱ・ままにも！"]],wear:"sakura_wreath",slot:"head",furn:"ひなだん",food:"ひしもちデザ"},
  {id:"picnic",name:"おはなピクニック",color:"#E4C397",motif:"basket",goal:"おべんとうを もって おはなみしよう。",tasks:["おべんとうを えらぼう","シートを ひこう","おはなを ながめよう"],choices:[["おにぎりべんとう","サンドイッチべんとう"],["みずたま シート","おはな シート"],["おはなの うた","おはなの スケッチ"]],wear:"apron",slot:"body",furn:"おはなみ バスケット",food:"さくらゼリー"},
  {id:"children",name:"こどものひ",color:"#9CCDC9",motif:"fish",goal:"おそらに およぐ こいのぼりを つくろう。",tasks:["こいの いろを えらぼう","もようを つけよう","かぜに およがせよう"],choices:[["そらいろの こい","ももいろの こい"],["まるい うろこ","ほしの うろこ"],["3にんで ひっぱる","ぱぱ・ままも いっしょ"]],wear:"happi",slot:"body",furn:"こいのぼり",food:"かしわもちデザ"},
  {id:"hydrangea",name:"あじさいさんぽ",color:"#BEB8DF",motif:"flower",goal:"あじさいの いろを みつけよう。",tasks:["すきな いろを さがそう","しずくを ながめよう","さんぽの えを かこう"],choices:[["むらさきの はな","あおい はな"],["はっぱの しずく","はなの しずく"],["あじさいの え","3にんの え"]],wear:"raincoat",slot:"body",furn:"あじさいの はち",food:"しずくゼリー"},
  {id:"tanabata",name:"たなばた",color:"#A8CFBE",motif:"wish",goal:"たんざくに ねがいを こめよう。",tasks:["たんざくに ねがいを かこう","ささかざりを つくろう","ほしへ ねがいを とどけよう"],choices:[["ずっと なかよし！","おいしい デザが たべたい！"],["おほしさま","いろとりどりの わっか"],["3にんで おいのり","ぱぱ・ままと おいのり"]],wear:"happi",slot:"body",furn:"たなばたの ささ",food:"ほしゼリー"},
  {id:"fireworks",name:"はなびまつり",color:"#C3AED8",motif:"firework",goal:"すきな はなびで まちを かざろう。",tasks:["はなびの いろを えらぼう","はなびの かたちを えらぼう","みんなで かけごえ！"],choices:[["ももいろの はなび","きんいろの はなび"],["おはなの はなび","ハートの はなび"],["たーまやー！","きーれいー！"]],wear:"happi",slot:"body",furn:"はなびの ライト",food:"はなびアイス"},
  {id:"moon",name:"おつきみ",color:"#E5D199",motif:"moon",goal:"まんまるの おつきさまを おむかえしよう。",tasks:["おだんごを ならべよう","すすきを かざろう","おつきさまへ ごあいさつ"],choices:[["まるく ならべる","やまに つむ"],["ながい すすき","ふわふわ すすき"],["うさぎさん いるかな？","おつきさま こんばんは！"]],wear:"scarf",slot:"neck",furn:"おつきみ ランプ",food:"おつきみだんご"},
  {id:"halloween",name:"ハロウィン",color:"#E4B27D",motif:"pumpkin",goal:"こわくない かそうで デザを わけよう！",tasks:["かそうを えらぼう","あいことばを いおう","デザを わけよう"],choices:[["にこにこ かぼちゃ","やさしい おばけ"],["トリック オア トリート！","デザを くださいな！"],["3にんで わけっこ","ぱぱ・ままにも おすそわけ"]],wear:"cape",slot:"back",furn:"かぼちゃ ランタン",food:"かぼちゃプリン"},
  {id:"harvest",name:"あきのしゅうかく",color:"#CCB494",motif:"acorn",goal:"あきの めぐみを みんなで あつめよう。",tasks:["きのみを あつめよう","かごを かざろう","しゅうかくを おいわい！"],choices:[["まんまる どんぐり","つやつや くり"],["もみじを そえる","リボンを むすぶ"],["みんなで いただきます！","もりに ありがとう！"]],wear:"scarf",slot:"neck",furn:"きのみの たからばこ",food:"やきいもデザ"},
  {id:"christmas",name:"クリスマス",color:"#ACC7B3",motif:"tree",goal:"ツリーを かざって プレゼントを とどけよう。",tasks:["ツリーを かざろう","プレゼントを つつもう","メッセージを とどけよう"],choices:[["きんの おほしさま","ももの かざり"],["あかい リボン","あおい リボン"],["メリークリスマス！","だいすきだよ！"]],wear:"knit",slot:"head",furn:"おほしさま ツリー",food:"いちごケーキ"},
].map((e,i)=>({...e,month:i+1,items:{wear:`annual_${e.id}_wear`,furn:`annual_${e.id}_furn`,food:`annual_${e.id}_deza`}}));

const AnnualArt = {
  motif(kind,color) {
    const p=(d,c)=>`<path d="${d}" fill="${c}" ${FS(2.5)}/>`;
    const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" ${FS(2.5)}/>`;
    const c=(x,y,rad,col)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" ${FS(2.5)}/>`;
    const star=(x,y,size)=>p(starPath(x,y,size,size*.46),"#F8DC93");
    const eyes=(x,y)=>c(x-7,y,1.4,INK)+c(x+7,y,1.4,INK)+p(`M${x-5},${y+7} Q${x},${y+12} ${x+5},${y+7}`,"none");
    const bamboo=r(25,34,11,47,"#9DBA80")+r(42,13,12,70,"#B3D090")+r(59,29,11,52,"#8CAE7B")+p("M26,51 H35 M43,34 H53 M43,55 H53 M60,49 H69","none");
    const designs={
      bamboo:()=>bamboo+r(17,75,62,16,"#D5B38B")+flowerSvg(24,69,10,"#EDBEC8","#F7DC97",2)+flowerSvg(69,66,10,"#EDBEC8","#F7DC97",2),
      oni:()=>p("M24,30 L21,8 L37,23 M57,23 L74,8 L70,33", "#F6DB98")+r(17,26,62,59,color)+c(30,50,8,"#F9E3C4")+c(66,50,8,"#F9E3C4")+eyes(48,55)+p("M23,30 Q32,12 42,29 Q50,10 58,29 Q70,13 77,31",color),
      dolls:()=>r(5,77,86,14,"#C493A7")+[28,68].map((x,i)=>p(`M${x},45 L${x-21},75 H${x+21} Z`,i?"#E7ACC3":"#A9C6D5")+c(x,37,13,"#F4DCBD")+p(`M${x-14},34 Q${x},10 ${x+14},34 Z`,"#6E5A4D")+eyes(x,37)).join("")+star(48,10,8),
      basket:()=>p("M21,47 Q20,2 48,6 Q77,3 76,47","none")+r(10,39,76,48,"#D4AF83")+p("M15,53 H81 M15,67 H81 M29,43 V83 M48,43 V83 M67,43 V83","none")+flowerSvg(48,41,16,color,"#F7DD94",2),
      fish:()=>p("M16,8 V92","none")+c(16,8,5,"#F3D795")+[28,56].map((y,i)=>p(`M21,${y-13} Q51,${y-23} 74,${y-8} L90,${y-15} L84,${y} L90,${y+15} L74,${y+8} Q49,${y+21} 21,${y+13} Z`,i?"#EABDCB":color)+c(31,y-2,4,"#FFFAEC")+c(32,y-2,1,INK)+p(`M45,${y-8} Q56,${y} 45,${y+8} M58,${y-8} Q69,${y} 58,${y+8}`,"none")).join("")+r(5,88,24,7,"#D7BB91"),
      flower:()=>p("M48,45 L18,60 L45,65 L78,49 L53,46 Z","#A5C28E")+p("M25,61 H71 L65,90 H31 Z","#D6B49B")+[[28,34],[49,24],[65,36],[45,46]].map(([x,y])=>flowerSvg(x,y,17,color,"#FFF1C6",2)).join(""),
      wish:()=>bamboo+p("M13,28 L81,47 M17,59 L79,19","none")+r(12,29,13,24,"#EABAD1")+r(70,45,13,24,"#F2D897")+r(68,17,13,21,"#AACDDD")+star(48,7,7)+r(19,84,59,9,"#D7B795"),
      firework:()=>r(10,76,76,14,"#C3AED8")+p("M31,42 V77 M69,35 V77","none")+[[31,35],[68,23]].map(([x,y])=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return p(`M${x+Math.cos(a)*8},${y+Math.sin(a)*8} L${x+Math.cos(a)*22},${y+Math.sin(a)*22}`,"none");}).join("")+star(x,y,8)).join(""),
      moon:()=>r(13,78,70,13,"#C0ABC8")+c(48,39,33,"#F7DEA2")+c(28,32,7,"#E8CB8B")+c(61,21,5,"#E8CB8B")+r(52,42,7,22,"#FFF9ED")+r(63,39,7,25,"#FFF9ED")+c(60,70,14,"#FFF9ED")+eyes(60,67),
      pumpkin:()=>p("M48,20 Q43,5 57,5 L60,13 Q51,14 54,23","#90AB78")+c(48,54,33,"#EAB478")+p("M37,24 Q18,54 37,83 M57,24 Q77,54 57,83","none")+eyes(48,51)+r(27,87,42,6,"#CAB292"),
      acorn:()=>r(9,57,78,32,"#D3B38B")+p("M12,70 H85 M48,59 V86","none")+[29,64].map(x=>c(x,44,19,"#DDBA8B")+p(`M${x-21},38 Q${x},8 ${x+21},38 Z`,"#AC8865")+p(`M${x},23 V13`,"none")).join(""),
      tree:()=>r(41,72,14,17,"#BC9576")+p("M48,10 L20,46 H30 L10,74 H86 L66,46 H76 Z",color)+star(48,10,10)+c(34,41,5,"#ECB9C7")+c(57,51,5,"#F6D18B")+c(34,65,5,"#B7CBDC")+r(12,81,22,15,"#EDBCC8")+p("M23,81 V96 M12,88 H34","none")+r(65,81,22,15,"#F2D593"),
    };
    return designs[kind]();
  },
  svg(e) {return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100">${this.motif(e.motif,e.color)}</svg>`;},
};

for(const e of ANNUAL_EVENTS) {
  const wear={id:e.items.wear,name:e.name+"の ふく",slot:e.slot,wear:e.wear,col:[e.color,"#FFF0C4"],price:0,rare:true};
  WEAR_ITEMS.push(wear);ITEM_INDEX[wear.id]=wear;
  const furn={id:e.items.furn,name:e.furn,w:96,h:100,price:0,kind:"floor",comfort:6,rare:true,interactive:true};
  FURNITURE.push(furn);FURN_INDEX[furn.id]=furn;FURN_ART[furn.id]=()=>AnnualArt.motif(e.motif,e.color);
  const food={id:e.items.food,name:"デザ・"+e.food.replace(/デザ$/, ""),price:0,rare:true,deza:true,hunger:14,mood:20,hp:20,desc:e.name+"の きねんデザ"};
  FOODS.push(food);BAG_INDEX[food.id]={...food,kind:"food"};
  FOOD_ART[food.id]=`<ellipse cx="32" cy="40" rx="28" ry="20" fill="#E9D4AD" ${IS()}/><ellipse cx="32" cy="35" rx="25" ry="17" fill="${e.color}" ${IS()}/><g transform="translate(12 5) scale(.42)">${AnnualArt.motif(e.motif,e.color)}</g>`;
}

const AnnualFestivals = {
  locations:[[["town","town_fountain","タウンの ふんすい"],["heiwadai","heiwadai_clock","平和台の とけい"],["city","city_fountain","シティの ふんすい"]],[["town","town_wheel","タウンの すいしゃ"],["heiwadai","heiwadai_cart","平和台の はなワゴン"],["harbor","port_light","みなとの とうだい"]],[["town","town_fountain","タウンの ふんすい"],["heiwadai","heiwadai_fountain","平和台の こうえん"],["airport","airport_clock","くうこうの とけい"]]],
  current(date=Seasonal.override||new Date()) {return this.event(date.getMonth()+1,date.getFullYear());},
  event(month,year) {const e=ANNUAL_EVENTS[month-1];return {...e,year,key:`${year}-annual-${e.id}`,targets:this.locations[(month-1)%3]};},
  state(month) {
    const now=this.current(),e=month?this.event(month,now.year):now,r=Seasonal.record(e.key);
    return {...e,available:e.key===now.key,joined:Save.d.events.activeAnnual===e.key,claimed:r.claimed,stamps:{...r.stamps},count:e.targets.filter(t=>r.stamps[t[1]]).length,
      targets:e.targets.map(([map,id,label],i)=>{const o=MAP_DEFS[map].objects.find(o=>o.id===id);return {map,id,label,x:o.x,y:o.y,task:e.tasks[i],choices:e.choices[i]};})};
  },
  start(key) {if(key!==this.current().key)return false;Save.d.events.activeAnnual=key;Save.mark();Save.write();return true;},
  complete(key,map,id,choice) {
    const e=this.current(),i=e.targets.findIndex(t=>t[0]===map&&t[1]===id);
    if(key!==e.key||Save.d.events.activeAnnual!==key||i<0||!Number.isInteger(choice)||!e.choices[i][choice])return false;
    const r=Seasonal.record(key,true);if(r.stamps[id])return false;
    r.stamps[id]=true;r.answers=r.answers||{};r.answers[id]=choice;Save.mark();Save.write();return true;
  },
  async interact(sc,o) {
    const s=this.state(),t=s.targets.find(t=>t.map===sc.mapId&&t.id===o.id);
    if(!s.joined||!t||s.stamps[o.id])return;
    const answer=await UI.ask(`${s.name}\n${t.task}`,t.choices);
    if(this.complete(s.key,sc.mapId,o.id,answer)){Sound.se("sparkle");UI.toast(`みんなで できた！ ${this.state().count}/3\nおまつりで きねんひんを うけとろう！`,"good");}
  },
  claim(key) {
    const e=this.current(),r=Seasonal.record(key);
    if(key!==e.key||r.claimed||!e.targets.every(t=>r.stamps[t[1]]))return false;
    r.claimed=true;Save.d.wardrobe[e.items.wear]=true;Save.d.furn[e.items.furn]=(Save.d.furn[e.items.furn]||0)+1;Save.addBag(e.items.food,3);Save.mark();Save.write();return true;
  },
  open() {
    UI.toastBox.replaceChildren();let month=this.current().month;
    const body=U.el("div",{class:"annual-calendar"}),modal=UI.modal({title:"12かげつの おまつり",body,cls:"full"});
    const render=()=>{
      const s=this.state(month);body.innerHTML="";
      const header=U.el("div",{class:"annual-hero",style:`--festival-color:${s.color}`});
      header.append(U.el("div",{class:"annual-art",html:AnnualArt.svg(s)}),U.el("div",{},[U.el("small",{text:`${s.month}がつ 1にち〜さいごのひ`}),U.el("h2",{text:s.name}),U.el("p",{text:s.goal})]));body.append(header);
      body.append(U.el("p",{class:"note",text:s.available?(s.claimed?"ことしの きねんひんは うけとりずみ！":`${s.count}/3 できた！ 3つの めいしょで あそぼう。`):`${s.month}がつに なったら あそべるよ。いまは よていを みられるよ。`}));
      for(const t of s.targets)body.append(U.el("div",{class:"festival-target",text:`${s.stamps[t.id]?"✓":"○"} ${t.task}\n${t.label}（よこ ${t.x+1}・たて ${t.y+1}）`}));
      if(s.available&&!s.claimed){
        if(!s.joined)body.append(UI.btn("この おまつりに さんか",()=>{if(this.start(s.key)){modal.close();UI.toast("3つの めいしょで あそぼう！","good");}else render();},"yellow wide"));
        else body.append(U.el("p",{class:"muted",text:"さんかちゅう！ めいしょを タップして すきな こたえを えらぼう。"}));
      }
      const rewards=U.el("div",{class:"festival-rewards"});
      for(const [kind,id,n] of [["wear",s.items.wear,1],["furn",s.items.furn,1],["bag",s.items.food,3]]){
        const it=kind==="wear"?ITEM_INDEX[id]:kind==="furn"?FURN_INDEX[id]:BAG_INDEX[id];rewards.append(U.el("div",{class:"festival-reward",html:`${UI.icon(kind,id,60)}<b>${it.name}</b><div>×${n}</div>`}));
      }body.append(rewards);
      const claim=UI.btn(s.claimed?"おまつりの きねんひんは うけとりずみ":"おまつりの きねんひんを うけとる",()=>{if(this.claim(s.key)){Sound.se("fanfare");UI.toast("ふく・かぐ・デザを てにいれた！","good");}render();},"yellow wide");claim.disabled=!s.available||s.count<3||s.claimed;body.append(claim);
      body.append(UI.btn("ぜんたい ちずを みる",()=>{modal.close();WorldAtlas.open();},"wide"));
      body.append(U.el("h3",{text:"1ねんの おまつり よてい"}));const grid=U.el("div",{class:"annual-months"});
      for(const e of ANNUAL_EVENTS){const b=UI.btn(`${e.month}がつ　${e.name}`,()=>{month=e.month;render();body.parentElement.scrollTop=0;},e.month===month?"selected":"");b.setAttribute("aria-pressed",String(e.month===month));grid.append(b);}body.append(grid);
      body.append(U.el("p",{class:"muted",text:"さんかは むりょう。もらった ふく・かぐ・デザは ずっと のこるよ。きねんひんは それぞれ 1ねんに 1かい。"}));
    };render();return modal;
  },
  draw(ctx,sc,ox,oy) {
    const s=this.current();
    for(const [map,id] of s.targets){if(map!==sc.mapId)continue;const o=sc.map.def.objects.find(o=>o.id===id),x=ox+(o.x+o.w/2)*TS,y=oy+o.y*TS-24;
      if(x< -40||x>G.W+40||y< -60||y>G.H+30)continue;
      const art=SvgCache.get("annual-banner:"+s.id,()=>AnnualArt.svg(s),40,42);if(art)ctx.drawImage(art,x-20,y+Math.sin(G.t*1.6)*2,40,42);
    }
  },
};
