// 天候は端末の日時から決まり、通信やセーブの書き換えを必要としない。
const Weather = {
  override:null,
  kinds:{clear:{name:"はれ",color:"#F6D98F",particles:0},cloudy:{name:"くもり",color:"#CCD7DF",particles:3},rain:{name:"あめ",color:"#A9C7DB",particles:48},snow:{name:"ゆき",color:"#DEE8EB",particles:40},wind:{name:"かぜ",color:"#C1D8BC",particles:14}},
  date() {return Seasonal.override||new Date();},
  forDate(date) {
    const month=date.getMonth()+1,block=Math.floor(date.getHours()/3),winter=month===12||month<=2;
    const choices=winter?["clear","clear","cloudy","cloudy","snow","snow","snow","wind","rain","clear"]:month>=6&&month<=8?["clear","clear","clear","clear","cloudy","cloudy","rain","rain","rain","wind"]:["clear","clear","clear","cloudy","cloudy","rain","rain","wind","wind","clear"];
    return choices[Math.min(9,Math.floor(U.hash(date.getFullYear()*12+month,date.getDate(),block)*10))];
  },
  kind(date=this.date()) {return this.override||this.forDate(date);},
  state(map=G.sceneName==="world"?G.scene.mapId:null) {
    const date=this.date(),kind=this.kind(date),indoors=!map||MAP_DEFS[map]?.baseGround==="cave";
    const forecast=Array.from({length:3},(_,i)=>{const at=new Date(date);at.setHours(Math.floor(date.getHours()/3)*3+i*3,0,0,0);const k=this.kind(at);return{hour:at.getHours(),day:at.getDate(),kind:k,name:this.kinds[k].name};});
    return {kind,...this.kinds[kind],indoors,particles:indoors?0:this.kinds[kind].particles,forecast,season:Seasonal.current(date).id};
  },
  sky() {if(DayTint.isNight())return DayTint.sky();return {cloudy:"#BFCED8",rain:"#A7BECE",snow:"#D4E2E8",wind:"#BEDDE5"}[this.kind()]||DayTint.sky();},
  svg(kind) {
    const line=OS(2),sun=`<circle cx="24" cy="24" r="11" fill="#F6D98F" ${line}/>${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return `<path d="M${24+Math.cos(a)*15},${24+Math.sin(a)*15} L${24+Math.cos(a)*20},${24+Math.sin(a)*20}" ${line}/>`;}).join("")}`;
    const cloud=`<path d="M8,28 C0,26 3,14 13,15 C15,2 32,3 35,16 C47,14 50,29 39,30 H9 Z" fill="#E6ECEC" ${line}/>`;
    const art={clear:sun,cloudy:cloud,rain:cloud+`<path d="M12,35 L9,43 M25,35 L22,43 M38,35 L35,43" stroke="#6F9FBE" stroke-width="3" stroke-linecap="round"/>`,snow:cloud+[12,26,39].map(x=>`<path d="M${x},35 V45 M${x-4},37 L${x+4},43 M${x-4},43 L${x+4},37" stroke="#7BA1B2" stroke-width="2"/>`).join(""),wind:`<path d="M5,15 H29 C42,15 37,2 30,7 M5,24 H38 C49,24 44,39 36,33 M9,33 H24" fill="none" stroke="#769B87" stroke-width="3" stroke-linecap="round"/>`};
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${art[kind]}</svg>`;
  },
  mount(sc) {sc.weatherButton=UI.btn("",()=>this.open(sc),"world-weather");UI.root.append(sc.weatherButton);this.refresh(sc,true);},
  refresh(sc,force=false) {
    if(!force&&G.t<(sc.nextWeather||0))return;sc.nextWeather=G.t+1;
    const s=this.state(sc.mapId);sc.weather=s;
    if(sc.weatherButton){sc.weatherButton.innerHTML=`${this.svg(s.kind)}<span>${s.indoors?"そとの ":""}${s.name}</span>`;sc.weatherButton.setAttribute("aria-label","てんき："+s.name);}
  },
  open(sc) {
    UI.toastBox.replaceChildren();const s=this.state(sc.mapId),body=U.el("div",{class:"weather-panel"});
    body.append(U.el("div",{class:"weather-now",html:this.svg(s.kind)+`<h2>いまは ${s.name}</h2>`}));
    const phrases={clear:"おひさま ぽかぽか。おさんぽ びより！",cloudy:"ふわふわ くもが そらを おさんぽ。",rain:"ぽつぽつ あめ。しずくが きらきら！",snow:"ふわり ふわり。しろい ゆきが おどるよ。",wind:"そよそよ かぜ。はっぱも ダンス！"};
    body.append(U.el("p",{class:"note",text:phrases[s.kind]}),U.el("h3",{text:"このあとの てんき"}));
    const row=U.el("div",{class:"weather-forecast"});
    s.forecast.forEach((f,i)=>row.append(U.el("div",{html:`<b>${i===0?"いま":(f.day!==s.forecast[0].day?"あした ":"")+f.hour+"じ〜"}</b>${this.svg(f.kind)}<span>${f.name}</span>`})));body.append(row);
    body.append(U.el("p",{class:"muted",text:"てんきは 3じかんごとに ゆっくり かわるよ。あめでも ゆきでも いつもどおり あそべるよ。おうちや どうくつの なかには ふらないよ。"}));
    return UI.modal({title:"おてんき よほう",body});
  },
  comment(id) {
    const lines={clear:["おひさま ぽかぽか♪","おさんぽ したいな！"],cloudy:["くもが デザに みえる！","くもは どこへ いくのかな"],rain:["あめの おと、ぽつぽつ♪","まどの しずくが きらきら！"],snow:["ゆきだ！ まっしろだね","ゆきだるま つくりたいな"],wind:["かぜと はっぱが おどってる！","かざぐるま まわるかな？"]};
    return (id==="goji"?"ガゥー♪ ":"")+U.pick(lines[this.kind()]);
  },
  draw(ctx,sc) {
    const s=sc.weather||this.state(sc.mapId);if(s.indoors)return;
    ctx.save();ctx.lineCap="round";
    if(s.kind!=="clear"){ctx.fillStyle={cloudy:"rgba(100,127,144,.035)",rain:"rgba(83,123,157,.08)",snow:"rgba(214,231,239,.07)",wind:"rgba(202,220,187,.025)"}[s.kind];ctx.fillRect(0,0,G.W,G.H);}
    const mod=(n,d)=>((n%d)+d)%d;
    for(let i=0;i<s.particles;i++){
      const seed=i*97.3,t=G.t,x=mod(seed+(s.kind==="rain"?-t*36:s.kind==="wind"?t*55:t*6)+Math.sin(i+t*.5)*12-sc.cam.x*.08,G.W+50)-25;
      const y=mod(i*71+(s.kind==="rain"?t*260:s.kind==="snow"?t*23:0)-sc.cam.y*.07,G.H+50)-25;
      if(s.kind==="rain") {ctx.strokeStyle="rgba(217,240,251,.7)";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+12);ctx.stroke();if(i<8){const ripple=(t*.9+i*.13)%1;ctx.strokeStyle=`rgba(213,235,244,${(1-ripple)*.5})`;ctx.beginPath();ctx.ellipse(mod(seed,G.W),mod(i*83+70,G.H),2+ripple*8,1+ripple*3,0,0,7);ctx.stroke();}}
      else if(s.kind==="snow") {ctx.fillStyle="rgba(255,253,248,.88)";ctx.beginPath();ctx.arc(x,y,1.7+i%3*.6,0,7);ctx.fill();}
      else if(s.kind==="wind") {ctx.strokeStyle="rgba(249,250,220,.55)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-20,y);ctx.quadraticCurveTo(x,y-10,x+28,y-3);ctx.stroke();ctx.fillStyle="#ADC092";ctx.beginPath();ctx.ellipse(x,y+4,4,1.8,t+i,0,7);ctx.fill();}
      else {ctx.fillStyle="rgba(87,110,130,.055)";ctx.beginPath();ctx.ellipse(mod(i*180+t*9,G.W+250)-100,110+i*200,110,32,.1,0,7);ctx.fill();}
    }ctx.restore();
  },
};

// 地面と木の色は四季の4通りだけ。季節をまたいだら地面キャッシュを入れ替える。
const SeasonPalette = {
  values:{spring:{grass:"#B7DC96",dark:"#92C276",forest:"#91C575",forestDark:"#75AB60",tree:"#DFAFC1",light:"#F3D2DD"},summer:{grass:"#A6D883",dark:"#8CC56C",forest:"#86C46A",forestDark:"#6FAE55",tree:"#5DAA4F",light:"#7CC468"},autumn:{grass:"#CDCD91",dark:"#B0B676",forest:"#B8B984",forestDark:"#9EA16D",tree:"#C99D6C",light:"#E8BE8B"},winter:{grass:"#D3E0CD",dark:"#AFBFAC",forest:"#BECEBC",forestDark:"#9AAC9A",tree:"#A7C1B2",light:"#E6EEE4"}},
  id() {return Seasonal.current().id;},
  get() {return this.values[this.id()];},
  vegetation(kind) {return ["tree","appletree","pine","bush","hedge"].includes(kind);},
  object(kind,art,season=this.id()) {
    if(!this.vegetation(kind))return art;
    const p=this.values[season],tree=kind==="pine"?p.forest:p.tree;
    const colors={"#5DAA4F":tree,"#7CC468":p.light,"#3F8E4F":p.forest,"#5DB06A":p.light,"#6DBE5B":p.forest,"#8FD06E":p.light};
    return {...art,full:art.full.replace(/#(?:5DAA4F|7CC468|3F8E4F|5DB06A|6DBE5B|8FD06E)/g,c=>colors[c])};
  },
};
