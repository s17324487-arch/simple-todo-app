// バックアップは通信せず、文字列とファイルで持ち運ぶ。検査・確認より前には現在のデータを変えない。
const SaveBackup={
  limit:2*1024*1024,
  encode(data=Save.d){return JSON.stringify({game:'pokapoka-town',format:1,savedAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(data))},null,2);},
  validate(data){
    const bad=()=>{throw Error('データの なかみが こわれているよ。べつの バックアップを ためしてね。');};
    const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
    let count=0;
    const walk=(v,depth=0)=>{
      if(++count>100000||depth>32)bad();
      if(typeof v==='number'&&!Number.isFinite(v))bad();
      if(typeof v==='string'&&v.length>200000)bad();
      if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))bad();walk(x,depth+1);}
    };walk(data);
    if(!object(data)||!Number.isInteger(data.v)||data.v<1)bad();
    if(data.v>Save.SCHEMA)throw Error('この データは あたらしい ばんのものだよ。ゲームを こうしんしてね。');
    if(!Number.isSafeInteger(data.coins)||data.coins<0||!object(data.chars))bad();
    if(!Array.isArray(data.order)||data.order.length!==3||new Set(data.order).size!==3||data.order.some(id=>!Chara.IDS.includes(id)))bad();
    for(const id of Chara.IDS){const c=data.chars[id];if(!object(c)||typeof c.name!=='string'||!Number.isInteger(c.lv)||c.lv<1||c.lv>999||['hp','sp'].some(k=>c[k]!=null&&(typeof c[k]!=='number'||c[k]<0)))bad();}
    // 既知の項目は型を検査。追加された未知の項目も削除せずに保存する。
    const types=(v,t)=>{
      if(t===null)return;
      if(Array.isArray(t)){if(!Array.isArray(v))bad();return;}
      if(object(t)){if(!object(v))bad();for(const k of Object.keys(t))if(v[k]!==undefined)types(v[k],t[k]);}
      else if(typeof v!==typeof t)bad();
    };types(data,Save.fresh());
    for(const field of ['bag','wardrobe','furn','room','flags'])if(!object(data[field]))bad();
    for(const field of ['bag','furn'])for(const n of Object.values(data[field]))if(!Number.isSafeInteger(n)||n<0)bad();
    const room=r=>{
      if(!object(r)||!Array.isArray(r.items)||!WALL_INDEX[r.wall]||!FLOOR_INDEX[r.floor]||r.items.length>1000)bad();
      const ids=new Set();for(const it of r.items){if(!object(it)||!Number.isInteger(it.uid)||it.uid<1||ids.has(it.uid)||!FURN_INDEX[it.id]||!Number.isFinite(it.x)||!Number.isFinite(it.y))bad();ids.add(it.uid);}
      if(!Number.isInteger(r.nextUid)||r.nextUid<=Math.max(0,...ids))bad();
    };room(data.room);
    for(const r of Object.values(data.rooms?.stored||{}))room(r);
    if(data.rooms&&(!HomeRooms.catalog.some(r=>r.id===data.rooms.active)||!data.rooms.owned[data.rooms.active]))bad();
    if(data.world&&(!MAP_DEFS[data.world.map]||!Number.isInteger(data.world.x)||!Number.isInteger(data.world.y)))bad();
    // 有料パズルの中断盤面も、そのまま安全に再開できる形で保持する。
    if(data.puzzle?.active!=null){
      const run=data.puzzle.active,s=run?.state,template=new NakayoshiPuzzle(1).s;
      if(!object(run)||typeof run.id!=='string'||run.practice!==false||!object(s)||!object(run.back)||!MAP_DEFS[run.back.map]||!Number.isInteger(run.back.x)||!Number.isInteger(run.back.y))bad();
      for(const [k,v]of Object.entries(template)){
        if(v===null){if(s[k]!==null&&!Object.hasOwn(PUZZLE_SHAPES,s[k]))bad();}
        else if(typeof v==='number'){if(typeof s[k]!=='number'||s[k]<0)bad();}
        else if(typeof v==='boolean'){if(typeof s[k]!=='boolean')bad();}
        else if(Array.isArray(v)){if(!Array.isArray(s[k])||s[k].length!==36||s[k].some(n=>!Number.isInteger(n)||n<0||n>5))bad();}
        else {if(!object(s[k]))bad();for(const key of Object.keys(v))if(!Number.isSafeInteger(s[k][key])||s[k][key]<0)bad();}
      }
    }
    // migrate()は渡したオブジェクトだけを変える。元のプレイデータには触れない。
    return Save.migrate(JSON.parse(JSON.stringify(data)));
  },
  decode(text){
    if(typeof text!=='string'||text.length>this.limit)throw Error('データが おおきすぎるよ。');
    let pack;try{pack=JSON.parse(text.trim().replace(/^\uFEFF/,''));}catch{throw Error('もじを ぜんぶ はりつけてね。よみこめなかったよ。');}
    if(!pack||pack.game!=='pokapoka-town'||pack.format!==1)throw Error('ぽかぽかタウンの バックアップを えらんでね。');
    return this.validate(pack.data);
  },
  install(data,storage=localStorage){
    const next=this.validate(data);next.last=Date.now();next.gameVersion=GAME_VERSION;
    const raw=JSON.stringify(next);let previous;
    try{
      previous=storage.getItem(Save.KEY);storage.setItem(Save.KEY,raw);
      if(storage.getItem(Save.KEY)!==raw)throw Error('write failed');
    }catch{
      if(previous!==undefined)try{if(previous===null)storage.removeItem(Save.KEY);else storage.setItem(Save.KEY,previous);}catch{}
      throw Error('セーブできなかったよ。あきようりょうを たしかめてね。');
    }
    Save.d=next;Save.dirty=false;return true;
  },
  canImport(){return ['house','world','title'].includes(G.sceneName);},
  download(text){
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='pokapoka-save-'+new Date().toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  exportUI(){
    const text=this.encode(),body=U.el('div'),area=U.el('textarea',{'aria-label':'かきだした セーブ',class:'save-backup-text',readonly:true}),status=U.el('p',{role:'status',class:'note'});area.value=text;
    const copy=UI.btn('コピーする',async()=>{
      area.focus();area.select();
      try{if(!navigator.clipboard?.writeText)throw Error('manual');await navigator.clipboard.writeText(text);status.textContent='コピーしたよ。なくさない ところへ はりつけてね。';}
      catch{status.textContent='もじを えらんだよ。ながく おして コピーしてね。';}
    },'wide yellow');
    body.append(U.el('p',{text:'おかね・ふく・おへや・ぼうけんを まとめて のこせるよ。'}),area,copy,UI.btn('ファイルに ほぞん',()=>this.download(text),'wide'),status);
    UI.modal({title:'セーブを かきだす',body,cls:'save-backup'});
  },
  importUI(){
    if(!this.canImport()){UI.toast('おうちや まちで よみこんでね。');return;}
    const body=U.el('div'),area=U.el('textarea',{'aria-label':'セーブの もじ',class:'save-backup-text',placeholder:'ここに セーブを はりつけてね'}),error=U.el('p',{role:'alert',class:'note'});
    const file=U.el('input',{type:'file',accept:'.txt,.json,text/plain,application/json','aria-label':'セーブの ファイル'}),status=U.el('p',{class:'note'});
    const source=Save.d;let busy=false,closed=false;
    const panel=UI.modal({title:'セーブを よみこむ',body,cls:'save-backup',onClose:()=>{closed=true;}});
    file.addEventListener('change',async()=>{error.textContent='';const f=file.files[0];if(!f)return;if(f.size>this.limit){error.textContent='ファイルが おおきすぎるよ。';return;}try{area.value=await f.text();}catch{error.textContent='ファイルを よめなかったよ。';}});
    const button=UI.btn('なかみを たしかめる',async()=>{
      if(busy||closed)return;busy=true;button.disabled=true;error.textContent='';
      try{
        const next=this.decode(area.value);status.textContent='おかね '+U.fmt(next.coins)+' コイン ／ '+Chara.IDS.map(id=>next.chars[id].name+' Lv.'+next.chars[id].lv).join('・');
        if(!await UI.confirm('いまの セーブは きえるよ。いい？\n'+status.textContent,'よみこむ','やめる'))return;
        if(closed||Save.d!==source||!this.canImport())return;
        this.install(next);location.reload();
      }catch(e){error.textContent=e.message;}finally{busy=false;button.disabled=false;}
    },'wide yellow');
    body.append(U.el('p',{text:'のこしておいた もじを はるか、ファイルを えらんでね。'}),area,file,button,status,error);
  },
};
