// 3人と同じ所持服・5スロットを、人間の体形に合わせて合成する。
const ParentWardrobe = {
  uid:0,
  equipment(id){const saved=Save.d.parents[id].equipment||{},out={};for(const slot of Object.keys(SLOT_NAMES)){const it=ITEM_INDEX[saved[slot]];out[slot]=it?.slot===slot&&Save.d.wardrobe[it.id]?it.id:null;}return out;},
  equip(id,slot,item){if(!['papa','mama'].includes(id)||!Object.hasOwn(SLOT_NAMES,slot)||item&&(!Save.d.wardrobe[item]||ITEM_INDEX[item]?.slot!==slot))return false;Save.d.parents[id].equipment[slot]=item;Save.mark();Save.write();return true;},
  layers(equipment){
    const p={torsoPath:'M65,105 Q64,100 76,103 L124,103 Q138,102 135,116 L135,171 Q136,181 123,181 H77 Q64,181 65,170Z',arms:[]};
    const a={hat:{x:100,y:32,w:78},eyes:{x:100,y:76,gap:28},cheek:{y:89,gap:46},mouth:{x:100,y:94},neck:{x:100,y:109,w:66},torso:{cx:100,top:103,bottom:181,w:70},back:{x:100,y:128,w:80}};
    const ctx={p,a,view:'front',dx:0,uid:'parent-wear-'+(++this.uid),col:[]},out={behind:'',torso:'',top:''};
    for(const slot of SLOT_ORDER){const it=ITEM_INDEX[equipment?.[slot]];if(!it||!WEAR[it.wear])continue;ctx.col=it.col||[];const layers=WEAR[it.wear](ctx);for(const key of ['behind','torso','top'])out[key]+=layers[key]||'';}
    const defs=`<defs><clipPath id="torso${ctx.uid}"><path d="${p.torsoPath}"/></clipPath></defs>`;
    for(const key of Object.keys(out))out[key]=`<g transform="scale(.65) translate(-100 -210)">${key==='torso'?defs:''}${out[key]}</g>`;
    return out;
  },
  open(start='papa'){
    return new Promise(resolve=>{
      let who=start,slot='body';const body=U.el('div'),tabs=U.el('div',{class:'who-tabs'}),stage=U.el('div',{class:'parent-preview'}),slots=U.el('div',{class:'tabs row wrap'}),grid=U.el('div',{class:'grid'}),looks=U.el('div');
      body.append(tabs,stage,slots,grid,looks);const m=UI.modal({title:'かぞくの きがえ',body,cls:'full',onClose:resolve});
      const render=()=>{
        tabs.replaceChildren();for(const id of [...Save.d.order,'papa','mama']){
          const parent=['papa','mama'].includes(id),name=parent?ParentCare.name(id):Save.d.chars[id].name;
          const b=U.el('button',{class:'who-tab'+(who===id?' on':''),'aria-label':name,html:(parent?ParentCare.svg(id,ParentCare.look(id)):Chara.svg(id,{outfit:Save.d.chars[id].outfit}))+name});
          b.onclick=()=>{if(parent){who=id;render();}else{m.close();DressUp.open(id);}};tabs.append(b);
        }
        stage.innerHTML=ParentCare.svg(who,ParentCare.look(who),'wave');slots.replaceChildren();grid.replaceChildren();looks.replaceChildren();
        for(const [id,name]of Object.entries(SLOT_NAMES)){const b=UI.btn(name,()=>{slot=id;render();},slot===id?'yellow':'');b.setAttribute('aria-pressed',String(slot===id));slots.append(b);}
        const equipped=this.equipment(who)[slot];
        const none=UI.btn('なし',()=>{this.equip(who,slot,null);render();},'card'+(!equipped?' on':''));grid.append(none);
        for(const it of WEAR_ITEMS.filter(it=>it.slot===slot&&Save.d.wardrobe[it.id])){
          const b=U.el('button',{class:'card'+(equipped===it.id?' on':''),'aria-label':it.name,html:UI.icon('wear',it.id,44)+'<div>'+it.name+'</div>'});b.onclick=()=>{this.equip(who,slot,equipped===it.id?null:it.id);Sound.se('pop');render();};grid.append(b);
        }
        looks.append(U.el('p',{class:'note',text:'もっている ふくを みんなで つかえるよ。ふくは へらないよ。'}));
        const names={outfit:'いつもの ふく',color:'いろ',face:'かお',hair:'かみがた',accessory:'こもの',skin:'はだいろ',hairColor:'かみのいろ'};
        for(const [key,options]of Object.entries(ParentCare.options)){
          const label=U.el('label',{class:'parent-choice',text:names[key]}),select=U.el('select',{'aria-label':names[key]});
          for(const [value,text]of options)select.append(U.el('option',{value,text}));select.value=ParentCare.look(who)[key];
          select.onchange=()=>{Save.d.parents[who][key]=select.value;Save.mark();Save.write();stage.innerHTML=ParentCare.svg(who,ParentCare.look(who),'wave');};label.append(select);looks.append(label);
        }
        looks.append(UI.btn('ふくを ぜんぶ はずす',()=>{for(const slot of Object.keys(SLOT_NAMES))this.equip(who,slot,null);render();},'wide'));
      };render();
    });
  },
};
