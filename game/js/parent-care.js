// ぱぱ・ままの着せ替えとお世話。外見の選択肢・ポーズは有限個。
const ParentCare = {
  options: {
    outfit:[["casual","いつもの ふく"],["apron","エプロン"],["cardigan","カーディガン"],["suit","おでかけの ふく"],["pajamas","パジャマ"]],
    color:[["blue","そらいろ"],["pink","ももいろ"],["mint","みどり"],["yellow","きいろ"],["purple","むらさき"]],
    face:[["smile","にっこり"],["laugh","にこにこ"],["calm","おだやか"],["wink","ウインク"],["round","まんまる おめめ"]],
    hair:[["short","みじかい かみ"],["bob","ボブ"],["curly","ふわふわ"],["ponytail","ひとつむすび"]],
    accessory:[["none","なし"],["glasses","めがね"],["flower","おはな"],["cap","ぼうし"]],
    skin:[["light","はだいろ 1"],["warm","はだいろ 2"],["deep","はだいろ 3"]],
  },
  name:id=>id==="papa"?"ぱぱ":"まま",
  look(id) {
    const saved=Save.d.parents[id], out={};
    for(const [key,options] of Object.entries(this.options)) out[key]=options.some(o=>o[0]===saved[key])?saved[key]:options[0][0];
    return out;
  },
  svg(id, look, pose="idle") {
    const ink='stroke="#1F1D1B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
    const color={blue:"#93BED6",pink:"#E9AEBD",mint:"#AED0AA",yellow:"#EDD18B",purple:"#C5B1D8"}[look.color]||"#93BED6";
    const skin={light:"#F9D3B5",warm:"#DFA780",deep:"#AE7656"}[look.skin]||"#F9D3B5";
    const rect=(x,y,w,h,r,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}" ${ink}/>`;
    const path=(d,c="none")=>`<path d="${d}" fill="${c}" ${ink}/>`;
    const step=pose==="walk1"?5:pose==="walk2"?-5:0, wave=pose==="care"||pose==="wave";
    let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-65 -136 130 160">';
    s+='<ellipse cy="3" rx="29" ry="7" fill="#1F1D1B" opacity=".12"/>';
    if(look.hair==="ponytail")s+=path("M15-109Q47-117 33-62L18-75Z","#654D40");
    if(look.hair==="bob")s+=rect(-26,-117,52,64,20,"#654D40");
    s+=rect(-18,-27+step,13,27,5,"#655E72")+rect(5,-27-step,13,27,5,"#655E72");
    s+=rect(-21,-7+step,18,9,4,"#605248")+rect(3,-7-step,18,9,4,"#605248");
    s+=rect(-23,-68,46,49,13,color);
    if(look.outfit==="apron")s+=path("M-10-67H10L13-51 19-25H-19L-13-51Z","#FFF0CF")+rect(-8,-43,16,11,3,color);
    if(look.outfit==="cardigan")s+=path("M-9-67L0-49 9-67M0-49V-22")+'<g fill="#FFF4D8"><circle cy="-42" r="2"/><circle cy="-32" r="2"/></g>';
    if(look.outfit==="suit")s+=path("M-10-68L0-43 10-68Z","#FFF7E4")+path("M0-61L4-54 0-42-4-54Z","#AC7C85");
    if(look.outfit==="pajamas")s+='<path d="M-17-53H17M-19-39H19M-17-27H17" stroke="#FFF4E1" stroke-width="4"/>'+rect(7,-59,10,11,2,color);
    s+=`<g transform="rotate(${step*2} -24 -61)">${rect(-31,-62,11,34,6,skin)}</g>`;
    s+=`<g transform="rotate(${wave?-110:-step*2} 24 -61)">${rect(20,-62,11,34,6,skin)}</g>`;
    s+=rect(-25,-112,50,48,21,"#654D40")+rect(-21,-105,42,43,19,skin);
    s+=path(look.hair==="short"?"M-23-99Q-26-124 0-120Q27-122 24-97L14-107 6-101 0-111-7-103-18-107Z":look.hair==="curly"?"M-23-96Q-35-103-23-111Q-24-125-11-120Q-2-133 8-121Q23-127 25-113Q38-102 24-95L17-106Q5-99-3-111Q-12-102-23-96Z":"M-23-97Q-27-124 0-123Q27-123 25-97L14-105 8-113Q-6-101-23-97Z","#654D40");
    if(look.face==="laugh")s+=path("M-13-87Q-9-94-5-87M5-87Q9-94 13-87");
    else if(look.face==="calm")s+=path("M-13-87Q-9-83-5-87M5-87Q9-83 13-87");
    else { s+=`<circle cx="-9" cy="-87" r="${look.face==="round"?3.7:2.4}" fill="#1F1D1B"/>`; s+=look.face==="wink"?path("M5-89L12-86 5-84"):`<circle cx="9" cy="-87" r="${look.face==="round"?3.7:2.4}" fill="#1F1D1B"/>`; }
    s+=look.face==="laugh"?path("M-6-77H6Q4-65-4-71Z","#D48C86"):path("M-5-76Q0-71 5-76");
    s+='<ellipse cx="-15" cy="-79" rx="4" ry="2" fill="#E6A19A"/><ellipse cx="15" cy="-79" rx="4" ry="2" fill="#E6A19A"/>';
    if(look.accessory==="glasses")s+=rect(-17,-94,14,12,4,"none")+rect(3,-94,14,12,4,"none")+path("M-3-89H3");
    if(look.accessory==="flower")s+=flowerSvg(21,-108,8,"#F5D68B","#FAF0CD",2);
    if(look.accessory==="cap")s+=path("M-25-114Q-21-135 7-129Q23-127 23-113Z",color)+path("M-27-113H30");
    return s+'</svg>';
  },
  init(sc) {
    sc.parents=[{id:"papa",x:75,y:280},{id:"mama",x:285,y:280}].map(p=>({...p,tx:p.x,ty:p.y,anim:0,state:"idle",time:0,target:null,queue:[]}));
    sc.parentTimer=8; sc.parentTurn=0; sc.careTurn=0;
  },
  request(sc,id,all=false) {
    const p=sc.parents.find(p=>p.id===id);
    if(!p)return;
    if(p.target||p.queue.length){if(all)p.queue=Save.d.order.filter(id=>id!==p.target);return;}
    p.queue=all?[...Save.d.order]:[Save.d.order[sc.careTurn++%3]];
    this.next(sc,p);
  },
  next(sc,p) {
    const id=p.queue.shift(); if(!id){p.target=null;p.state="idle";p.time=3;return;}
    p.target=id;p.state="walk";
    const c=sc.chars.find(c=>c.id===id);
    c.state="idle";c.t=6;
    p.tx=U.clamp(c.x+(p.id==="papa"?-38:38),38,322);p.ty=c.y-4;
  },
  care(sc,p) {
    const id=p.target, c=sc.chars.find(c=>c.id===id), d=Save.d.chars[id], now=Date.now();
    const last=Save.d.parents.lastCare[id]||0;
    if(now-last>=30000) {
      // ごはんは手持ちの普段の食事だけ。コインの自動使用・限定品の消費はしない。
      const food=["onigiri","bread","sandwich","soup","mild_curry"].find(f=>Save.d.bag[f]>0);
      if(d.hunger<70&&food) {
        const res=Care.feed(id,food); HomeLife.say(sc,p.id,`${d.name}、ごはん どうぞ♪`);
        HomeLife.say(sc,id,d.hunger>=90?Care.fullText(id):"ありがとう！ おいしいね♪");
        c.food=food;c.state="eat";c.t=1.7;c.emo=res.emo;Sound.se("eat");
      } else {
        Save.care(id,{mood:3,bond:1});sc.react(c,"love","heart");
        HomeLife.say(sc,p.id,d.hunger<70?"ごはんは あとでね。ぎゅーっ♪":"よしよし、だいすきだよ♪");
        HomeLife.say(sc,id,d.hunger>=90?Care.fullText(id):"えへへ♪ ありがとう！");
      }
      Save.d.parents.lastCare[id]=now;Save.mark();Save.write();sc.updateCare();
    }else {HomeLife.say(sc,p.id,"いっしょに のんびり しようね♪");sc.fx("heart",c);}
    p.state="care";p.time=2.5;
  },
  update(sc,dt) {
    if(document.hidden||UI.busy||sc.mode)return;
    if((sc.parentTimer-=dt)<=0){
      const p=sc.parents[sc.parentTurn++%2];
      if(Save.d.parents.auto){if(sc.life.quarrel){HomeLife.settle(sc,false);HomeLife.say(sc,p.id,"みんなで じゅんばんこに しようね♪");}this.request(sc,p.id);}
      else if(p.state==="idle"){p.tx=U.rand(55,305);p.ty=U.rand(278,315);p.state="walk";}
      sc.parentTimer=U.rand(13,18);
    }
    for(const p of sc.parents){
      p.anim+=dt;
      if(p.state==="walk"){
        const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),step=Math.min(d,90*dt);
        if(d>1){p.x+=dx/d*step;p.y+=dy/d*step;}
        else if(p.target)this.care(sc,p);else{p.state="idle";p.time=3;}
      }else if(p.state==="care" && (p.time-=dt)<=0)this.next(sc,p);
    }
  },
  draw(sc,ctx,p) {
    const pos=sc.toScreen(p.x,p.y),size=98.8*sc.s;
    const pose=p.state==="walk"?(Math.floor(p.anim*7)%2?"walk1":"walk2"):p.state==="care"?"care":Math.floor(p.anim/4)%3===0?"wave":"idle";
    const look=this.look(p.id), key=`parent:${p.id}:${JSON.stringify(look)}:${pose}`;
    const img=SvgCache.get(key,()=>this.svg(p.id,look,pose),Math.ceil(size*G.px),Math.ceil(size*160/130*G.px));
    if(img)ctx.drawImage(img,pos.x-size/2,pos.y-size*136/130-Math.sin(p.anim*2)*sc.s,size,size*160/130);
    ctx.fillStyle=INK;ctx.font=`bold ${11*sc.s}px sans-serif`;ctx.textAlign="center";ctx.fillText(this.name(p.id),pos.x,pos.y+16*sc.s);
  },
  open(sc,id="papa") {
    const body=U.el("div"),m=UI.modal({title:"ぱぱ・まま",body,cls:"full"});let who=id;
    const render=()=>{
      body.replaceChildren();
      const tabs=U.el("div",{class:"parent-tabs"});
      for(const p of ["papa","mama"]){const b=UI.btn(this.name(p),()=>{who=p;render();},who===p?"yellow":"");b.setAttribute("aria-pressed",String(who===p));tabs.append(b);}
      const preview=U.el("div",{class:"parent-preview",html:this.svg(who,this.look(who),"wave")});
      body.append(tabs,preview,U.el("p",{class:"note",text:"すきな すがたに しよう！ きがえは むりょうだよ。"}));
      const names={outfit:"ふく",color:"いろ",face:"かお",hair:"かみがた",accessory:"こもの",skin:"はだいろ"};
      for(const [key,options] of Object.entries(this.options)){
        const label=U.el("label",{class:"parent-choice",text:names[key]}),select=U.el("select",{"aria-label":names[key]});
        for(const [value,text] of options)select.append(U.el("option",{value,text}));select.value=this.look(who)[key];
        select.onchange=()=>{Save.d.parents[who][key]=select.value;Save.mark();Save.write();preview.innerHTML=this.svg(who,this.look(who),"wave");Sound.se("tap");};label.append(select);body.append(label);
      }
      const auto=UI.btn(Save.d.parents.auto?"じどうの おせわ：する":"じどうの おせわ：しない",()=>{Save.d.parents.auto=!Save.d.parents.auto;Save.mark();Save.write();render();},"wide");auto.setAttribute("aria-pressed",String(Save.d.parents.auto));
      body.append(auto,U.el("p",{class:"note",text:"おなかが すいたら、もちものの おにぎり・パン・サンド・スープ・あまくちカレーを 1こ あげるよ。おかねは つかわないよ。"}));
      body.append(UI.btn("3にんを おせわ",()=>{this.request(sc,who,true);m.close();},"wide yellow"));
    };render();return m;
  },
};
