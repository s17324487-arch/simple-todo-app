// プリセットは配置のメモ。家具の所持数や、別室の配置は増減させない。
const RoomPresets = {
  limit:6,
  list(){return Save.d.rooms.presets[Save.d.rooms.active]||[];},
  snapshot(name){const r=Save.d.room;return {name:String(name).replace(/[<>&"'`]/g,'').trim().slice(0,20)||'おきにいり',wall:r.wall,floor:r.floor,size:{...HomeDesign.size()},items:r.items.map(({id,x,y,flip,wallSide})=>({id,x,y,flip:!!flip,...(wallSide?{wallSide}:{})}))};},
  commit(change){const d=JSON.parse(JSON.stringify(Save.d));change(d);try{SaveBackup.install(d);return true;}catch(e){UI.toast(e.message);return false;}},
  save(slot,name){
    if(!Number.isInteger(slot)||slot<0||slot>=this.limit)return false;
    const value=this.snapshot(name),id=Save.d.rooms.active;
    return this.commit(d=>{const a=d.rooms.presets[id]||(d.rooms.presets[id]=[]);a[slot]=value;});
  },
  problem(p){
    if(!p||!Array.isArray(p.items)||p.items.length>64||!p.size||!Number.isFinite(p.size.w)||!Number.isFinite(p.size.d))return 'この プリセットは よみこめないよ。';
    const r=Save.d.room,size=HomeDesign.size();
    if(p.size.w>size.w||p.size.d>size.d)return 'この おへやには はいらないよ。さきに ひろげてね。';
    if(!WALL_INDEX[p.wall]||!FLOOR_INDEX[p.floor]||!r.wallpapers[p.wall]||!r.floors[p.floor])return 'かべがみか ゆかを もっていないよ。';
    const counts={};
    for(const it of p.items){
      if(!FURN_INDEX[it.id]||!Number.isFinite(it.x)||!Number.isFinite(it.y)||it.x<0||it.x>size.w||it.y<0||it.y>size.d+HomeDesign.H)return 'かぐの ばしょを よみこめないよ。';
      counts[it.id]=(counts[it.id]||0)+1;
    }
    for(const [id,n] of Object.entries(counts)){
      const used=Object.values(Save.d.rooms.stored).reduce((a,r)=>a+r.items.filter(it=>it.id===id).length,0);
      if(n+used>(Save.d.furn[id]||0))return FURN_INDEX[id].name+'が たりないよ。べつの おへやで つかっていないか みてね。';
    }
    return null;
  },
  apply(slot){
    const p=this.list()[slot],reason=this.problem(p);if(reason)return {ok:false,reason};
    const ok=this.commit(d=>{const r=d.room;let uid=Math.max(r.nextUid,...r.items.map(it=>it.uid+1),1);r.items=p.items.map(it=>({...it,uid:uid++}));r.nextUid=uid;r.wall=p.wall;r.floor=p.floor;});
    return {ok,reason:ok?null:'ほぞんできなかったよ。'};
  },
  remove(slot){if(!this.list()[slot])return false;const id=Save.d.rooms.active;return this.commit(d=>{d.rooms.presets[id][slot]=null;});},
  open(sc){
    const body=U.el('div'),m=UI.modal({title:'かぐの プリセット',body,cls:'room-presets'}),room=Save.d.rooms.active;
    const valid=()=>G.scene===sc&&Save.d.rooms.active===room&&m.el.isConnected;
    const render=()=>{
      body.replaceChildren(U.el('p',{class:'note',text:'いまの かぐの ばしょ・むき・かべがみ・ゆかを、6つまで おぼえるよ。へやごとに わけて ほぞんするよ。'}));
      for(let i=0;i<this.limit;i++){
        const p=this.list()[i],card=U.el('section',{class:'note','data-preset':i}),row=U.el('div',{class:'row wrap'});
        card.append(U.el('strong',{text:(i+1)+'. '+(p?p.name:'まだ ほぞんしていないよ')}));
        if(p)card.append(U.el('div',{text:`かぐ ${p.items.length}こ ／ ${p.size.w} × ${p.size.d}`}));
        row.append(UI.btn(p?'いまの へやで うわがき':'いまの へやを ほぞん',async()=>{
          const name=await UI.input('プリセットの なまえ',p?.name||'おきにいり '+(i+1),{max:20});if(name===null||!valid())return;
          if(p&&!await UI.confirm('「'+p.name+'」を いまの へやで うわがきする？'))return;
          if(valid()&&this.save(i,name)){Sound.se('ok');render();}
        }));
        if(p){
          row.append(UI.btn('よびだす',async()=>{
            const why=this.problem(p);if(why){UI.toast(why);return;}
            if(!await UI.confirm('「'+p.name+'」の はいちに かえる？\nいまの はいちを のこすなら、さきに ほぞんしてね。')||!valid())return;
            const result=this.apply(i);if(!result.ok){UI.toast(result.reason);return;}
            m.close();Game.goto('house',{msg:'プリセットを よびだしたよ。'});
          },'yellow'));
          row.append(UI.btn('なまえ',async()=>{const name=await UI.input('プリセットの なまえ',p.name,{max:20});if(name===null||!valid())return;const clean=this.snapshot(name).name;if(this.commit(d=>{d.rooms.presets[room][i].name=clean;}))render();}));
          row.append(UI.btn('けす',async()=>{if(await UI.confirm('「'+p.name+'」の プリセットを けす？\nかぐと いまの おへやは そのままだよ。')&&valid()&&this.remove(i))render();}));
        }
        card.append(row);body.append(card);
      }
    };render();return m;
  },
};
