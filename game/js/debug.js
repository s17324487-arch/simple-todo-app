// 開発・テスト用のフック（本編からは使わない）。
// 自動テスト（tests/smoke.mjs）や開発中の確認は、ゲーム内部を直接いじらず この API を使う。
// ブラウザの開発者ツールで PokaDebug.help() と打つと一覧が出る。
// ここの関数名と引数は「約束」なので、変えるときは tests/smoke.mjs と docs も直すこと。
const PokaDebug = {
  version: GAME_VERSION,

  help() {
    const lines = [
      "PokaDebug.state()                     いまのシーン・マップ・コインなど",
      "PokaDebug.idle()                      画面切り替え中・会話中でなければ true",
      "PokaDebug.newGame({ goji: 'soft' })   オープニングを飛ばして はじめから（おうちへ）",
      "PokaDebug.teleport('meadow', 14, 3)   マップの (x, y) へ移動（town/city/coast/meadow/forest/cave）",
      "PokaDebug.house()                     おうちへ",
      "PokaDebug.battle([{ kind: 'purun', lv: 2 }], 'meadow')  バトル開始",
      "PokaDebug.battleState()                属性・HP・状態・技・曲を読む",
      "PokaDebug.battleFixture({ hp: 1, condition: 'fire' })  コマンド待ち中に戦闘の状態を再現",
      "PokaDebug.music('town' | null)          曲を試聴/停止。引数なしで音の状態",
      "PokaDebug.musicCatalog()               曲名・楽器・小節数の一覧",
      "await PokaDebug.musicRender('town', 8)  同じ音源でオフライン合成・音量/負荷を検証",
      "PokaDebug.shop('crepe', 3)            お店ミニゲームを Lv3 で開始",
      "PokaDebug.store('clothes', 'town')    歩ける店内へ（入口のある町を選べる）",
      "PokaDebug.storeState()                店員・展示・通路・3人・出口の状態",
      "PokaDebug.storeWalkTo(5, 3)           店内のマスまで実際に歩く",
      "PokaDebug.coins(1000)                 コインを足す",
      "PokaDebug.level(16)                   3人のレベルを設定して全回復",
      "PokaDebug.unlockAll()                 服・家具・壁紙・床を ぜんぶ持つ",
      "PokaDebug.give('cake', 3)             もちものを足す",
      "PokaDebug.save()                      いますぐセーブ",
      "PokaDebug.walkTo(4, 12)               町・フィールドで (x, y) まで歩く",
      "PokaDebug.mg()                        お店ミニゲームの状態（注文・ボタン位置）",
      "PokaDebug.hour(21)                    時刻を固定（null で戻す）",
      "PokaDebug.roadPreview(def, view)       道の検証画像（セーブ・現在地は変えない）",
      "PokaDebug.fps(2000)                   指定ミリ秒のあいだの平均FPSを返す（Promise）",
    ];
    console.log(lines.join("\n"));
    return lines.length;
  },
  state() {
    const sc = G.scene;
    return {
      version: GAME_VERSION,
      scene: G.sceneName,
      map: sc && sc.mapId ? sc.mapId : null,
      pos: sc && sc.party ? [sc.party[0].tx, sc.party[0].ty] : null,
      phase: sc && sc.phase ? sc.phase : null,
      busy: UI.busy,
      transitioning: !!Game.trans,
      coins: Save.d ? Save.d.coins : null,
    };
  },
  idle() { return !Game.trans && !UI.busy; },
  townLayout(id) {
    const m=Maps.get(id);return {id,w:m.w,h:m.h,spawn:m.def.safeSpawn,views:m.def.views,doors:m.doors.map(d=>({id:d.b.id,x:d.x,y:d.y,act:d.b.act})),warps:m.warps};
  },
  backupText(){return SaveBackup.encode();},
  backupDecode(text){return SaveBackup.decode(text);},
  dailyVisit(day) {return DailyPlay.visit(day);},
  dailyState() {return {...Save.d.daily,featured:DailyPlay.featured(),shop:SHOPS[DailyPlay.featured()].name};},
  saveData() {return JSON.parse(JSON.stringify(Save.d));},
  persistedSave() { try { return JSON.parse(localStorage.getItem(Save.KEY)); } catch { return null; } },
  shopDecor(shop) {return {tier:ShopDecor.level(shop),keys:[...SvgCache.map.keys()].filter(k=>k.startsWith('w:building:')||k.startsWith('shop-decor:'))};},
  // この直後に再読み込みする。pagehide の自動保存にも旧JSONを渡し、通常の load/migrate を検証する。
  seedLegacySave(data){if(data?.gameVersion!=='1.0.0'||data.v!==1)throw Error('v1.0.0 fixture required');const raw=JSON.stringify(data);Save.write=()=>localStorage.setItem(Save.KEY,raw);Save.write();return true;},
  seedSave(data) {Save.d=Save.migrate(JSON.parse(JSON.stringify(data)));Save.write();return true;},
  townRoutes() {
    if(G.sceneName!=="world")return null;
    const sc=G.scene,p=sc.party[0];
    return {doors:sc.map.doors.map(d=>({id:d.b.id,reachable:!!sc.findPath(p.tx,p.ty,d.x,d.y,false)})),solid:sc.map.isSolid(p.tx,p.ty),motion:TownRenewal.motion(sc.mapId,G.t)};
  },
  async townPlan(id,before=false) {
    const d=before?TownRenewal.originals[id]:MAP_DEFS[id],m=new WorldMap(before?"before-"+id:id,d),sc=new WorldScene();
    sc.map=m;sc.mapId=id;sc.npcs=(d.npcs||[]).map(n=>({...n,w:new Walker(n.x,n.y,n.dir)}));sc.enemies=[];
    await sc.preload();
    const cv=document.createElement("canvas");cv.width=m.w*TS;cv.height=m.h*TS;const ctx=cv.getContext("2d");
    for(let y=0;y<m.h;y+=8)for(let x=0;x<m.w;x+=8)ctx.drawImage(Tiles.chunk(m,x/8,y/8),x*TS,y*TS,8*TS,8*TS);
    if(d.renewal)TownRenewal.drawMoving(ctx,sc,0,0);
    for(const it of d.decals||[])HeiwadaiTown.draw(ctx,sc,it,0,0,{w:cv.width,h:cv.height});
    const all=m.sprites.filter(s=>!s.o?.over).map(s=>({z:(s.y+1)*TS,draw:()=>sc.drawStatic(ctx,s,0,0,{w:cv.width,h:cv.height})}));
    for(const n of sc.npcs)all.push({z:(n.y+1)*TS,draw:()=>sc.drawNpc(ctx,n,0,0)});
    all.sort((a,b)=>a.z-b.z);all.forEach(s=>s.draw());HeiwadaiTown.overhead(ctx,sc,0,0,{w:cv.width,h:cv.height});return cv.toDataURL("image/png");
  },
  pause(value) { const previous = !!Game.paused; Game.paused = !!value; if(G.sceneName==="puzzle")G.scene.lastClock=performance.now(); return previous; },
  world() {
    if(G.sceneName!=="world")return null;
    const sc=G.scene,r=G.canvas.getBoundingClientRect();
    const point=(x,y)=>({cx:r.left+(x*TS+16-sc.cam.x+G.W/2)*G.cssPerUnit,cy:r.top+(y*TS+16-sc.cam.y+G.H/2)*G.cssPerUnit});
    return {map:sc.mapId,party:sc.party.map((p,i)=>({id:Save.d.order[i],x:p.tx,y:p.ty})),
      objects:(sc.map.def.objects||[]).map(o=>({...o,...point(o.x+(o.w-1)/2,o.y+(o.h-1)/2)})),
      stops:sc.map.doors.filter(d=>d.b.act.type==="transit").map(d=>({id:d.b.act.stop,x:d.x,y:d.y,...point(d.x,d.y-1)})),
      active:sc.objectActive?.until>G.t?sc.objectActive.id:null};
  },
  travel() { return G.sceneName==="travel"?{...G.scene.trip,elapsed:G.scene.elapsed,party:[...Save.d.order]}:null; },
  calendar(date) {
    if(date==null)Seasonal.override=null;
    else {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("use YYYY-MM-DD");
      const [y,m,d]=date.split("-").map(Number),value=new Date(y,m-1,d,12);
      if(value.getFullYear()!==y||value.getMonth()!==m-1||value.getDate()!==d)throw new Error("invalid calendar date");
      Seasonal.override=value;
    }
    if(G.sceneName==="world"){Seasonal.refresh(G.scene,true);Weather.refresh(G.scene,true);}return Seasonal.state();
  },
  festival() {
    const s=Seasonal.state();return {...s,inventory:{wear:!!Save.d.wardrobe[s.items.wear],furn:Save.d.furn[s.items.furn]||0,food:Save.d.bag[s.items.food]||0}};
  },
  homeLife(event) {
    if (G.sceneName !== "house") return null;
    if (event) HomeLife.event(G.scene, event);
    const l = G.scene.life;
    return { watching: !!G.scene.watching, quarrel: l.quarrel, bubbles: l.bubbles.map(b => ({ ...b })), room: Save.d.rooms.active, owned: { ...Save.d.rooms.owned }, coins: Save.d.coins, rare: Save.d.flags.rareChats || 0, furniture: { ...l.furniture }, chars: Object.fromEntries(Chara.IDS.map(id => [id, { ...Save.d.chars[id] }])) };
  },
  feed(id, food) { return Care.feed(id, food); },
  homeSay(id,text,kind='say') {if(G.sceneName!=='house')return false;HomeLife.say(G.scene,id,String(text),kind==='rare',kind);return true;},
  homeTalkLog() {return G.sceneName==='house'?G.scene.life.log.map(x=>({...x})):[];},
  // かけあいを 1つ 流す（HOME_TALK_DATA.talks の id）
  homeTalk(id) {if(G.sceneName!=='house')return false;return HomeLife.playTalk(G.scene,HomeLife.talkById(id));},
  // 会話データの 数。id を わたすと その セリフ／かけあい（テストで 条件を たしかめる）
  homeLines(id) {
    const D=HomeLife.data();if(!D)return null;
    if(id)return JSON.parse(JSON.stringify(D.lines.find(l=>l.id===id)||D.talks.find(t=>t.id===id)||null));
    const byWho={};for(const l of D.lines)byWho[l.who]=(byWho[l.who]||0)+1;
    return {total:D.lines.length+D.talks.length,lines:D.lines.length,talks:D.talks.length,turns:D.talks.reduce((a,t)=>a+t.turns.length,0),byWho};
  },
  homeBubbleFixture() {if(G.sceneName!=='house')return false;const sc=G.scene;sc.chars.forEach((c,i)=>Object.assign(c,{x:160+i*80,y:430+(i%2)*35,state:'idle',t:3600,hidden:false}));sc.parents.forEach((p,i)=>Object.assign(p,{x:i?375:90,y:345,state:'idle',target:null,queue:[]}));sc.parentTimer=3600;Object.assign(sc.life,{next:3600,queue:[],bubbles:[],quarrel:false});return true;},
  homeBubbleState() {if(G.sceneName!=='house')return null;const sc=G.scene;return {heads:HomeLife.heads(sc),boxes:HomeLife.bubbleLayout(sc,G.ctx),area:{...sc.view,left:8,right:G.W-8},watching:sc.watching};},
  family() {
    if(G.sceneName!=="house")return null;
    const sc=G.scene;
    return {looks:{papa:ParentCare.look("papa"),mama:ParentCare.look("mama")},auto:Save.d.parents.auto,lastCare:{...Save.d.parents.lastCare},bag:{...Save.d.bag},
      parents:sc.parents.map(p=>({...p})),bubbles:HomeLife.bubbleLayout(sc,G.ctx).map(b=>({id:b.id,text:b.text,x:b.x,y:b.y,w:b.w,h:b.h,anchor:b.anchor,kind:b.kind,tail:b.tip})),width:G.W,height:G.H};
  },
  annual() {
    const s=AnnualFestivals.state();return {...s,events:ANNUAL_EVENTS.map(e=>({id:e.id,month:e.month,name:e.name})),inventory:{wear:!!Save.d.wardrobe[s.items.wear],furn:Save.d.furn[s.items.furn]||0,food:Save.d.bag[s.items.food]||0}};
  },
  weather(kind) {
    if(arguments.length){if(kind!==null&&!Weather.kinds[kind])throw new Error("unknown weather");Weather.override=kind;if(G.sceneName==="world")Weather.refresh(G.scene,true);}
    return {...Weather.state(),sky:Weather.sky(),palette:{...SeasonPalette.get()}};
  },
  drift(time=G.t) {
    if(G.sceneName!=="world")return null;
    return {camera:{...G.scene.cam},seasonal:Seasonal.particles(G.scene,time),wind:Seasonal.particles(G.scene,time,"wind")};
  },
  heiwadaiView({cx=43.2,cy=27.4,width=390,height=844}={}) {
    if(G.sceneName!=="world"||G.scene.mapId!=="heiwadai")throw Error("Enter Heiwadai first");
    const sc=G.scene,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    canvas.width=width;canvas.height=height;
    const old={w:G.W,h:G.H,cam:sc.cam,hint:sc.hintT,party:sc.party,grace:sc.grace};
    try{sc.grace=0;sc.party=[41.7,42.95,44.2].map(x=>new Walker(x-.5,29.25-27/32,'right'));G.W=360;G.H=height*360/width;sc.cam={x:Math.round(cx*TS-180)+180,y:Math.round(cy*TS-G.H/2)+G.H/2};sc.hintT=0;
      ctx.scale(width/360,width/360);sc.render(ctx);return canvas.toDataURL();
    }finally{G.W=old.w;G.H=old.h;sc.cam=old.cam;sc.hintT=old.hint;sc.party=old.party;sc.grace=old.grace;}
  },
  heiwadaiLife(time){
    if(arguments.length)HeiwadaiLife.clock=time;
    const sc=G.scene,world=this.world(),r=G.canvas.getBoundingClientRect();return {...HeiwadaiLife.state(),night:DayTint.isNight(),cache:SvgCache.map.size,sceneryCache:[...SvgCache.map.keys()].filter(k=>/^(w:heiwadai_|heiwadai-life:|heiwadai-ground:)/.test(k)).length,sceneryLimit:HeiwadaiArt.entries.length+Object.keys(HEIWADAI_LAYOUT_DATA.patterns).length+3,npcs:sc?.mapId==='heiwadai'?sc.npcs.map(n=>({id:n.id,name:n.name,x:n.w.x,y:n.w.y,sp:n.sp,outfit:n.outfit,cx:r.left+((n.w.x+.5+(n.artOffset?.[0]||0))*TS-sc.cam.x+G.W/2)*G.cssPerUnit,cy:r.top+((n.w.y+.5+(n.artOffset?.[1]||0))*TS-sc.cam.y+G.H/2)*G.cssPerUnit})):[],...world};
  },
  heiwadaiState(){
    const m=Maps.get('heiwadai');return {size:[m.w,m.h],doors:m.doors.map(d=>({id:d.b.id,x:d.x,y:d.y,act:d.b.act})),safe:m.def.safeSpawn,aliases:m.def.idAliases};
  },
  async roadPreview(def, { cx=43.2,cy=27.4,width=390,height=844 }={}) {
    // 定義は開発ページから渡す。本編のMAP_DEFSやプレイデータには登録しない。
    await TownRoads.preload(def);
    const map=new WorldMap("__road_preview",def),canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
    canvas.width=width;canvas.height=height;
    const scale=width/360,left=Math.round(cx*TS-180),top=Math.round(cy*TS-height/scale/2),size=8*TS;
    for(const k of Tiles.chunks.keys())if(k.startsWith("__road_preview:"))Tiles.chunks.delete(k);
    ctx.scale(scale,scale);ctx.translate(-left,-top);
    for(let y=Math.max(0,Math.floor(top/size));y<Math.ceil((top+height/scale)/size);y++)for(let x=Math.max(0,Math.floor(left/size));x<Math.ceil((left+360)/size);x++) {
      if(x*8<map.w&&y*8<map.h)ctx.drawImage(Tiles.chunk(map,x,y),x*size,y*size,size,size);
    }
    return {url:canvas.toDataURL(),width,height,left,top,grid:map.roadGrid,solid:map.solidGrid};
  },
  async roadSeams(def, scale=1) {
    await TownRoads.preload(def);
    const w=def.rows[0].length*TS,h=def.rows.length*TS,make=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
    const whole=make(w*scale,h*scale),tiled=make(w*scale,h*scale),a=whole.getContext("2d"),b=tiled.getContext("2d");
    a.scale(scale,scale);TownRoads.draw(a,def);
    for(let y=0;y<h;y+=256)for(let x=0;x<w;x+=256){const c=make(256*scale+4,256*scale+4),g=c.getContext("2d");g.translate(2,2);g.scale(scale,scale);g.translate(-x,-y);TownRoads.draw(g,def);b.drawImage(c,2,2,256*scale,256*scale,x*scale,y*scale,256*scale,256*scale);}
    const p=a.getImageData(0,0,whole.width,whole.height).data,q=b.getImageData(0,0,tiled.width,tiled.height).data;
    // 透明画素のRGBは比較しない。見える色（白背景へ合成）とアルファを比べる。
    let changed=0,max=0,flatMax=0,flatSamples=0;for(let i=0;i<p.length;i+=4)for(let k=0;k<4;k++){
      const v=k===3?p[i+3]:255+(p[i+k]-255)*p[i+3]/255,u=k===3?q[i+3]:255+(q[i+k]-255)*q[i+3]/255,d=Math.abs(v-u);
      const x=(i/4)%whole.width,y=Math.floor(i/4/whole.width),n=256*scale,onSeam=(x>0&&(x%n<2||x%n>n-3))||(y>0&&(y%n<2||y%n>n-3));
      if(onSeam&&p[i+3]===255){
        // Canvasの大小で曲線のAAが変わる。境界の平坦な面・白線の芯は厳密に検査。
        let lo=v,hi=v,opaque=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          if(x+dx<0||y+dy<0||x+dx>=whole.width||y+dy>=whole.height)continue;
          const j=((y+dy)*whole.width+x+dx)*4,t=k===3?p[j+3]:255+(p[j+k]-255)*p[j+3]/255;lo=Math.min(lo,t);hi=Math.max(hi,t);opaque=opaque&&p[j+3]===255;
        }if(opaque&&hi-lo<=3){flatMax=Math.max(flatMax,d);flatSamples++;}
      }
      if(d>.5)changed++;max=Math.max(max,d);
    }
    return {changed,max,channels:p.length,flatMax,flatSamples};
  },
  groundImage(mapId="town",cx=1,cy=1) { return Tiles.chunk(Maps.get(mapId),cx,cy).toDataURL(); },
  needs(hunger,mood=70) { for(const c of Object.values(Save.d.chars)){c.hunger=U.clamp(hunger,0,100);c.mood=U.clamp(mood,0,100);}Save.mark();if(G.sceneName==="house")G.scene.updateCare(); },
  wins(n) { Save.d.stats.wins = Math.max(0, Math.floor(n)); Save.mark(); },
  homePoint(x, y) { const p = G.scene.toScreen(x, y), r = G.canvas.getBoundingClientRect(); return { x: r.left + p.x * G.cssPerUnit, y: r.top + p.y * G.cssPerUnit }; },
  homeDesign() {
    if(G.sceneName !== "house")return null;
    const sc=G.scene, canvas=G.canvas.getBoundingClientRect(), point=p=>({x:canvas.left+p.x*G.cssPerUnit,y:canvas.top+p.y*G.cssPerUnit});
    const rect=r=>({...point(r),w:r.w*G.cssPerUnit,h:r.h*G.cssPerUnit});
    return {width:ROOM.W,depth:HomeDesign.D,expanded:!!Save.d.rooms.expanded[Save.d.rooms.active],background:sc.bgArgs[0],zoom:sc.zoom,pan:{...sc.pan},mode:sc.mode,selected:sc.sel?.uid,
      items:Save.d.room.items.map(it=>({...it,rect:rect(sc.itemRect(it)),anchor:FURN_INDEX[it.id].kind==="wall"?point(sc.wallPoint(it)):point(sc.toScreen(sc.anchor(it).x,sc.anchor(it).y))})),
      actors:[...sc.chars,...sc.parents].map(c=>({id:c.id,state:c.state,rect:rect(sc.actorRect(c,sc.parents.includes(c)))})),
      ball:sc.ball?{...point(sc.ballPoint(sc.ball)),hits:sc.ball.hits}:null,
      hide:sc.hide?{...sc.hide,spots:sc.chars.filter(c=>c.hidden).map(c=>({id:c.id,rect:rect(c.spot.door?sc.doorRect():sc.itemRect(c.spot.it))}))}:null,
      stored:JSON.parse(JSON.stringify(Save.d.rooms)),furn:{...Save.d.furn},wall:Save.d.room.wall,floor:Save.d.room.floor};
  },
  homeLayout(items,wall="wp_cream",floor="fl_wood") {
    if(G.sceneName!=="house"||items.some(it=>!FURN_INDEX[it.id])||!WALL_INDEX[wall]||!FLOOR_INDEX[floor])throw new Error("invalid home fixture");
    Save.d.room.items=items.map((it,i)=>({uid:i+1,flip:false,...it}));Save.d.room.nextUid=items.length+1;Save.d.room.wall=wall;Save.d.room.floor=floor;
    Save.d.room.wallpapers[wall]=true;Save.d.room.floors[floor]=true;
    for(const it of items)Save.d.furn[it.id]=Math.max(Save.d.furn[it.id]||0,Room.placed(it.id));
    Save.mark();G.scene.preloadFurn();G.scene.buildBg();
  },
  battleLayout() {
    if (G.sceneName !== "battle") return null;
    const sc = G.scene, rect = G.canvas.getBoundingClientRect();
    return { cardBottom: rect.top + (sc.allyY + 59.5) * G.cssPerUnit, menuTop: sc.ui.getBoundingClientRect().top, enemyTop: sc.foeY - sc.FS, active: sc.active?.id };
  },
  battleState() {
    if (G.sceneName !== "battle") return null;
    const sc = G.scene;
    const unit = u => ({ id: u.id || u.kind, hp: sc.hp(u), maxHp: sc.mhp(u), alive: u.alive,
      elements: BattleElements.affinity(u), condition: u.condition ? { ...u.condition } : null,
      sp: u.side === "ally" ? Save.d.chars[u.id].sp : null });
    return { music: sc.music, round: sc.round, active: sc.active?.id, allies: sc.allies.map(unit), foes: sc.foes.map(unit),
      skills: Object.fromEntries(Chara.IDS.map(id => [id, Stats.skills(id)])) };
  },
  music(name) {
    if (name !== undefined) Sound.stopJingles();
    if (name === null) Sound.stopBgm();
    else if (name !== undefined) {
      if (!SONGS[name]) throw new Error("unknown music: " + name);
      Sound.init(); Sound.applySettings();
      if (SONGS[name].once) { Sound.stopBgm(); Sound.jingle(name); } else Sound.bgm(name);
    }
    return { name: Sound.cur?.name || null, pending: Sound.want || null, state: Sound.ctx?.state,
      gain: Sound.bgmGain?.gain.value, voices: Sound.cur?.bus?.voices.size || 0, jingles: Sound.jingles.size, modern: !!Sound.cur?.song.modern };
  },
  musicCatalog() {
    return Object.entries(SONGS).map(([id, song]) => ({ id, title: song.title, bpm: song.bpm, modern: !!song.modern, once: !!song.once,
      steps: Math.max(...song.tracks.map(tr => Sound.parse(tr.notes).length)), instruments: [...new Set(song.tracks.map(tr => tr.drum ? "drums" : tr.instrument))] }));
  },
  async musicRender(name, seconds = 8, wav = false) {
    const { audio, stats } = await ModernMusic.render(name, seconds);
    if (!wav) return stats;
    const bytes = new Uint8Array(44 + audio.length * 4), view = new DataView(bytes.buffer);
    const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    text(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); text(8, "WAVEfmt "); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, audio.sampleRate, true);
    view.setUint32(28, audio.sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
    text(36, "data"); view.setUint32(40, bytes.length - 44, true);
    const left = audio.getChannelData(0), right = audio.getChannelData(1);
    // 試聴ファイルの終端だけフェード。ゲームのループは切り詰めない。
    for (let i = 0; i < audio.length; i++) {
      const fade = Math.min(1, (audio.length - 1 - i) / (audio.sampleRate * .08));
      view.setInt16(44 + i * 4, Math.round(U.clamp(left[i] * fade, -1, 1) * 32767), true);
      view.setInt16(46 + i * 4, Math.round(U.clamp(right[i] * fade, -1, 1) * 32767), true);
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return { ...stats, wav: btoa(binary) };
  },
  battleFixture({ hp, condition } = {}) {
    if (G.sceneName !== "battle" || !G.scene.active || !G.scene.commandResolve) throw new Error("wait for a battle command");
    // 戦闘画面の状態・敗北ルートを再現する開発用入口。実際の決着は通常のターン処理を使う。
    for (const u of G.scene.allies) {
      if (hp !== undefined) G.scene.setHp(u, hp);
      if (condition) { BattleElements.clear(u); u.conditionGrace = 0; BattleElements.inflict(u, condition, 1, 0); }
    }
  },

  newGame({ goji = "soft" } = {}) {
    Save.reset();
    Save.d.chars.goji.color = goji;
    Save.write();
    Game.trans = null;
    Game.goto("house", {}, "none");
  },
  teleport(map = "town", x, y, dir = "down") {
    const d = MAP_DEFS[map];
    if (!d) throw new Error("unknown map: " + map);
    Game.trans = null;
    Game.goto("world", { map, x, y, dir, grace: 2 }, "none");
  },
  house() { Game.trans = null; Game.goto("house", {}, "none"); },
  // ② 町の人: その人の マップの となりへ 行って 話しかける（Talk.run）。会話は テストの がわで すすめる（またない）
  async folkTalk(id) {
    const map = Object.keys(MAP_DEFS).find(k => (MAP_DEFS[k].npcs || []).some(n => n.id === id)); if (!map) return false;
    if (!(G.sceneName === "world" && G.scene.mapId === map)) {
      const d = MAP_DEFS[map].npcs.find(n => n.id === id), w = new WorldMap(map);
      const spot = [[0, 1], [1, 0], [-1, 0], [0, -1], [0, 2], [2, 0]].map(([dx, dy]) => [d.x + dx, d.y + dy]).find(([x, y]) => !w.isSolid(x, y)) || [d.x, d.y + 1];
      this.teleport(map, spot[0], spot[1], "up");
      for (let i = 0; i < 150 && !(G.sceneName === "world" && G.scene.mapId === map && this.idle()); i++) await new Promise(r => setTimeout(r, 100));
    }
    const n = G.sceneName === "world" && G.scene.npcs.find(n => n.id === id); if (!n || G.scene.busy) return false;
    G.scene.interact({ type: "npc", npc: n });
    return true;
  },
  // さいごに 話した 人と、出た セリフ・ひとことの id（TOWNSFOLK_DATA）
  folkLast() { return typeof TownFolk !== "undefined" && TownFolk.last ? { ...TownFolk.last } : null; },
  // ② おねがい: いまの きろく（うつし）
  folk() { return Save.d.folk ? JSON.parse(JSON.stringify(Save.d.folk)) : null; },
  // いまの マップの 町の人の しるし（{ npcId: "target" | "offer" }）
  folkMarks() { if (G.sceneName !== "world") return null; const out = {}; for (const n of G.scene.npcs) { const m = TownFolk.markerOf(n.id, G.scene.mapId); if (m) out[n.id] = m; } return out; },
  // ② その マップに 置いて いる きらきら（find）・小物（tap）。stand は となりの 立てる マス（よこ → うえ → した）。
  // いまの マップなら 画面の 位置（cx, cy）も
  folkSpots(map) {
    const sc = G.sceneName === "world" ? G.scene : null, id = map || (sc && sc.mapId), r = G.canvas.getBoundingClientRect(); if (!id) return [];
    const w = Maps.get(id), free = (x, y) => !w.isSolid(x, y) && !w.warpAt(x, y) && !(sc && sc.mapId === id && sc.blockedByNpc(x, y));
    const at = (x, y) => (sc && sc.mapId === id ? { cx: r.left + (x * TS + 16 - sc.cam.x + G.W / 2) * G.cssPerUnit, cy: r.top + (y * TS + 16 - sc.cam.y + G.H / 2) * G.cssPerUnit } : {});
    return TownFolk.spotsOn(id).map((s) => ({ ...s, stand: [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).find(([x, y]) => free(x, y)) || null, ...at(s.x, s.y) }));
  },
  // ② しゃしんが とれる マス（手順が photo の とき。なければ null）
  folkPhotoTile(map) { return TownFolk.reach(map).tiles.find(([x, y]) => TownFolk.photoSpot(map, x, y)) || null; },
  // ② ついて きて いる こねこ（いなければ null）
  folkKitten() { const k = G.sceneName === "world" && G.scene.follower; return k ? { x: k.w.tx, y: k.w.ty, trail: k.trail.length } : null; },
  // つぎに その人と 話した とき、かならず その おねがい（ev-…）／物々交換（bt-…）を もちかける
  folkOffer(id) {
    const ev = TownFolk.event(id), bt = !ev && TOWNSFOLK_DATA.barter.find((b) => b.id === id), npc = ev ? ev.giver : bt && bt.npc;
    if (!npc) throw new Error("unknown folk event: " + id);
    TownFolk.forced = { npc, id }; return npc;
  },
  // TownFolk.signal を よぶ（アイテムを へらす・ごほうび などの 会話も 出す。会話は またない）。すすんだ 手順を かえす
  folkSignal(sig) {
    const before = { ...Save.d.folk.done }, moved = TownFolk.signal(sig);
    TownFolk.effects(moved, { name: "", face: "" }, before);
    return moved.map(m => ({ id: m.ev.id, step: m.step.do, stepDone: m.stepDone, done: m.done }));
  },
  // TOWNSFOLK_DATA の セリフ／ひとこと 1つ（テストで 条件を たしかめる）
  folkLine(id) { const D = typeof TOWNSFOLK_DATA !== "undefined" ? TOWNSFOLK_DATA : null; return D ? JSON.parse(JSON.stringify(D.lines.find(l => l.id === id) || D.react.find(l => l.id === id) || null)) : null; },
  battle(foes = [{ kind: "purun", lv: 1 }], area = "meadow", boss = false) {
    for (const f of foes) if (!ENEMIES[f.kind]) throw new Error("unknown enemy: " + f.kind);
    const w = Save.d.world;
    Game.trans = null;
    // 終わったら いまの場所（セーブの world）に戻る
    Game.goto("battle", { foes, area, boss, back: { map: w.map, x: w.x, y: w.y, dir: w.dir }, spawnIdx: -99 }, "none");
  },
  shop(id = "crepe", lv) {
    if (!SHOPS[id]) throw new Error("unknown shop: " + id);
    if (id === "link") return this.store("link", "city");
    if (lv) Save.d.shops[id].lv = U.clamp(lv, 1, 5);
    Game.trans = null;
    Game.goto("shop", { shop: id, back: { map: "town", x: 12, y: 21, dir: "down" } }, "none");
  },
  puzzleStart({practice=true,seed=1}={}) {
    const door=Maps.get("city").doors.find(d=>d.b.act.shop==="link");
    const run=PuzzleArcade.start({map:"city",x:door.x,y:door.y+1,dir:"down"},practice,seed);
    if(!run)return false;Game.goto("puzzle",{run});return true;
  },
  puzzleState() {
    if(G.sceneName!=="puzzle"||!(G.scene instanceof PuzzleScene)||!G.scene.model)return null;
    const sc=G.scene,rect=G.canvas.getBoundingClientRect(),s=sc.model.snapshot();
    return {...s,phase:sc.phase,practice:sc.run.practice,id:sc.run.id,chain:[...sc.chain],legal:sc.model.findMove(),
      stage:sc.model.stage,types:sc.model.types,drain:sc.model.drain,preview:sc.model.preview(sc.chain),
      cells:s.board.map((value,i)=>{const p=sc.point(i);return{i,value,cx:rect.left+p.x*G.cssPerUnit,cy:rect.top+p.y*G.cssPerUnit};}),
      prizes:PUZZLE_PRIZES.map(p=>({...p,claimed:!!Save.d.puzzle.claimed[p.id],owned:Save.d.furn[p.id]||0}))};
  },
  puzzleBoard(board) {
    if(G.sceneName!=="puzzle"||!["ready","paused"].includes(G.scene.phase))throw new Error("Pause the puzzle before setting a fixture");
    if(!Array.isArray(board)||board.length!==36||board.some(v=>!Number.isInteger(v)||v<0||v>5))throw new Error("Invalid puzzle board");
    G.scene.model.s.board=[...board];G.scene.model.s.cooldown=0;G.scene.cancelChain();G.scene.persist();return true;
  },
  puzzleClock(manual=false) { if(G.sceneName!=="puzzle")return false;G.scene.debugClock=!!manual;G.scene.lastClock=performance.now();return true; },
  puzzleAdvance(seconds) {
    if(G.sceneName!=="puzzle"||G.scene.phase!=="running"||!Number.isFinite(seconds)||seconds<0||seconds>181)return false;
    G.scene.model.advance(seconds);G.scene.lastClock=performance.now();G.scene.persist();if(G.scene.model.s.done)G.scene.finish();return true;
  },
  store(id="clothes",map="town") {
    if(!STORE_INTERIORS[id])throw new Error("unknown store: "+id);
    const door=Maps.get(map).doors.find(d=>d.b.act.shop===id);
    if(!door)throw new Error("no store entrance: "+map+"/"+id);
    Game.goto("store",{shop:id,back:{map,x:door.x,y:door.y+1,dir:"down"}});
  },
  storeWalkTo(x,y) { return G.sceneName==="store"&&!Game.inputLocked?G.scene.walkTo(x,y):false; },
  storeState() {
    if(G.sceneName!=="store")return null;
    const sc=G.scene,rect=G.canvas.getBoundingClientRect();
    const point=(x,y)=>{const p=sc.screen(x,y);return{cx:rect.left+p.x*G.cssPerUnit,cy:rect.top+p.y*G.cssPerUnit};};
    const walkable=[];for(let y=0;y<12;y++)for(let x=0;x<10;x++)if(sc.walkable(x,y))walkable.push({x,y,...point(x,y),reachable:sc.route(x,y)!==null});
    return {shop:sc.shopId,back:{...sc.back},music:Sound.cur?.name||Sound.want,owner:sc.owner.name,
      party:sc.party.map((p,i)=>({id:Save.d.order[i],x:p.tx,y:p.ty,moving:p.moving})),
      fixtures:sc.fixtures.map(f=>({...f,...point(f.x+(f.w-1)/2,f.y+f.d-1)})),walkable,
      keeper:{...point(5,1),cy:point(5,1).cy-24*sc.scale*G.cssPerUnit},
      path:sc.path.length,interacting:!!sc.interacting,exit:point(5,11),scale:sc.scale};
  },
  coins(n = 1000) { Save.addCoins(n); UI.updateHud(); return Save.d.coins; },
  level(lv = 10) {
    for (const id of Chara.IDS) { const c = Save.d.chars[id]; c.lv = U.clamp(lv, 1, 50); c.exp = 0; }
    Save.healAll();
    return lv;
  },
  unlockAll() {
    const d = Save.d;
    for (const w of WEAR_ITEMS) d.wardrobe[w.id] = true;
    for (const f of FURNITURE) d.furn[f.id] = Math.max(d.furn[f.id] || 0, 1);
    for (const w of WALLPAPERS) d.room.wallpapers[w.id] = true;
    for (const f of FLOORS) d.room.floors[f.id] = true;
    Save.mark();
  },
  give(id, n = 1) {
    if (!BAG_INDEX[id]) throw new Error("unknown item: " + id);
    Save.addBag(id, n);
    return Save.d.bag[id];
  },
  save() { Save.write(); return true; },
  // 町・フィールドで (x, y) まで歩く（タップ移動と同じ道さがし）
  walkTo(x, y) {
    if (G.sceneName !== "world") throw new Error("walkTo は町・フィールドでだけ使える");
    G.scene.goTo(x, y, null);
    return !!G.scene.path;
  },
  // お店ミニゲームの いまの状態（テストが「正しい操作」をするための情報）。座標は画面の CSS ピクセル
  mg() {
    if (G.sceneName !== "shop") return null;
    const sc = G.scene, t = sc.task;
    const cv = G.canvas.getBoundingClientRect();
    const css = (x, y) => ({ cx: Math.round(cv.left + x * G.cssPerUnit), cy: Math.round(cv.top + y * G.cssPerUnit) });
    const out = { shop: sc.shopId, lv: sc.lv, phase: sc.phase, n: sc.n, total: sc.total, ranks: [...(sc.ranks || [])], earn: sc.earn, tips: sc.tips, difficulty: sc.difficulty, dailyBoost: sc.dailyBoost, timeLimit: sc.timeLimit, timeLeft: sc.timeLeft, buttons: [], order: null, targets: [] };
    out.score = sc.stamp?.score ?? null;
    if (!t) return out;
    out.buttons = t.btns.filter((b) => !b.disabled).map((b) => ({ label: b.label || "", ...css(b.x + b.w / 2, b.y + b.h / 2) }));
    out.decorTier=ShopDecor.tier(sc.lv);
    if(sc.shopId==='burger')out.order={want:t.want.map(id=>BURGER_FILLINGS.find(f=>f.id===id).name),made:[...t.made]};
    if(sc.shopId==='groom')out.order={stage:t.stage,style:t.style.id,ribbon:RIBBONS.find(r=>r.id===t.ribbon).name+'の リボン',line:t.outline().map(q=>css(q.x,q.y)),trimmed:[...t.trimmed],offLine:t.offLine,zones:t.zones().map((q,i)=>({...css(q.x,q.y),dry:t.dry[i]}))};
    if(sc.shopId==='cake')out.order={step:t.steps[t.step],want:{...t.want},made:{...t.made},labels:{base:CAKE_BASES.find(x=>x.id===t.want.base).name,cream:CAKE_CREAMS.find(x=>x.id===t.want.cream).name,fruit:CAKE_FRUITS.find(x=>x.id===t.want.fruit).name,count:t.want.count+'こ',candles:t.want.candles+'ほん'}};
    if (sc.shopId === "crepe") out.order = { want: t.want.map((id) => CREPE_TOPS.find((x) => x.id === id).name) };
    if (sc.shopId === "florist") out.order = { step: t.step, want: Object.entries(t.want).map(([k, n]) => ({ name: FLOWER_KINDS.find((f) => f.id === k).name, n })), ribbon: RIBBONS.find((r) => r.id === t.ribbon).name + "の リボン" };
    if (sc.shopId === "bakery") {
      const b = t.breadPos();
      out.order = { step: t.step, bread: BREADS.find((x) => x.id === t.want.bread).name, zone: t.zone, done: t.done, top: t.want.top ? { name: BREAD_TOPS.find((x) => x.id === t.want.top.id).name, n: t.want.top.n } : null, breadAt: css(b.x, b.y) };
    }
    if (sc.shopId === "dentist") {
      for (const g of t.germs) if (g.alive) { const c = t.toothCenter(g.t); out.targets.push({ kind: "germ", ...css(c.x, c.y + Math.sin(g.bob) * 3) }); }
      for (const d of t.dirt) if (d.hp > 0) { const c = t.toothCenter(d.t); out.targets.push({ kind: "dirt", ...css(c.x, c.y) }); }
      for (const v of t.cav) if (!v.fixed) { const c = t.toothCenter(v.t); out.targets.push({ kind: "cavity", ...css(c.x, c.y) }); }
      out.order = { remaining: t.remaining(), mistakes: t.mistakes };
    }

    if (sc.shopId === "relay") out.order = { target: t.target, caught: t.caught, misses: t.misses, lane: t.lane, role: t.role, shield: t.shield, items: t.items.map(it => ({ ...it, progress: (it.y - t.trackTop) / (t.trackBottom - t.trackTop) })) };
    return out;
  },
  hour(h) {
    if (!PokaDebug._hourNow) PokaDebug._hourNow = U.hourNow;
    U.hourNow = h == null ? PokaDebug._hourNow : () => h;
  },
  fps(ms = 2000) {
    return new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(Math.round((n / (performance.now() - t0)) * 1000)); };
      requestAnimationFrame(f);
    });
  },
};
window.PokaDebug = PokaDebug;
