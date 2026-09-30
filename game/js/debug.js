// 開発・テスト用のフック（本編からは使わない）。
// 自動テスト（tests/smoke.mjs）や開発中の確認は、ゲーム内部を直接いじらず この API を使う。
// ブラウザの開発者ツールで PokaDebug.help() と打つと一覧が出る。
// ここの関数名と引数は「約束」なので、変えるときは tests/smoke.mjs と docs も直すこと。
const PokaDebug = {
  version: GAME_VERSION,
  homeRoom(id){if(G.sceneName!=="house"||!HomeRooms.switchTo(id))return false;Game.goto("house");return true;},
  roomPresets(){return JSON.parse(JSON.stringify(RoomPresets.list()));},
  cityCatalog(){return IkebukuroCatalog.groups;},
  // クレーン（crane-scene.js）。arcadeState: いまの 台の ようす・arcadeMove: アームを dx・dz cm うごかす（うごかせる ときだけ）
  arcadeState(){const s=G.sceneName==='prize'?G.scene:null,r=s&&s.round;if(!r)return null;const R=r.rig,claw=r.type==='claw'||r.type==='ring';return{machine:s.i,type:r.type,phase:r.phase,done:r.done,finished:!!s.finished,got:r.got.length,time:claw?+r.time.toFixed(2):null,claw:claw?{x:+R.x.toFixed(2),y:+R.y.toFixed(2),z:+R.z.toFixed(2)}:null,stops:r.stops??null,scoops:r.scoops??null,arms:r.type==='tripod'?R.arms.map(a=>a.up?1:0):null,light:r.type==='tripod'?R.cell():null,strong:r.strong,camera:s.camMode,bodies:r.list().length,coins:Save.d.coins,status:s.status.textContent};},
  arcadeStart(machine=0){const b=MAP_DEFS.city.buildings.find(b=>b.id==='ike_arcade'),back={venue:'arcade',floor:1,back:{map:'city',x:b.x+b.door,y:b.y+b.h,dir:'down'}},run=PrizeArcade.start(machine,back);if(run)Game.goto('prize',{run},'none');return !!run;},
  arcadeMove(dx,dz){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.phase!=='move')return false;r.rig.load({x:r.rig.x+dx,z:r.rig.z+dz});return true;},
  arcadeDrop(){if(G.sceneName!=='prize')return false;const r=G.scene.round;G.scene.press(r.type==='sweet'&&r.phase==='swing2'?1:0);return true;},
  // テスト用: アームを 景品の 上へ（i: 景品の じゅんばん。リングの 台は リングの まえ）・アームの つよさ・はやおくり・カメラ
  arcadeAim(i=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.phase!=='move')return false;const b=r.list()[i];if(!b)return false;const p=b.data.ring?CraneMachines.toWorld(r.W,b,b.data.ring.slice(0,3)):r.W.centroid(b);r.rig.load({x:p[0],z:p[2]});return true;},
  arcadeLuck(strong=true){const r=G.sceneName==='prize'&&G.scene.round;if(!r)return false;r.strong=!!strong;r.rig.power=strong||r.type==='ring'?1:0.34;G.scene.run.strong=!!strong;return true;},
  arcadeFast(k=1){if(G.sceneName!=='prize')return false;G.scene.speed=Math.max(1,Math.min(8,k));return true;},
  arcadeLight(cell=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='tripod')return false;r.rig.light=cell+0.3;return true;},
  arcadeCam(mode){if(G.sceneName!=='prize')return false;if(G.scene.camMode!==mode)G.scene.toggleCam();return G.scene.camMode;},
  mamaWork(){return MamaSchedule.working();},
  venue(id='school',floor){const b=MAP_DEFS.town.buildings.find(b=>b.act.venue===id)||MAP_DEFS.city.buildings.find(b=>b.act.venue===id);if(!b)return false;Game.goto('venue',{venue:id,floor,back:{map:MAP_DEFS.town.buildings.includes(b)?'town':'city',x:b.x+b.door,y:b.y+b.h,dir:'down'}},'none');return true;},
  venueState(){if(G.sceneName!=='venue'||!G.scene?.room)return null;const sc=G.scene;return {id:sc.id,floor:sc.floor,name:sc.def.name,changingFloor:sc.lift>0,party:sc.party.map(p=>({x:p.x,y:p.y})),fixtures:sc.fixtures.map(f=>({...f,screen:sc.screen(f.x+f.w/2-.5,f.y+f.h-1)})),coins:Save.d.coins,walkable:sc.room.w*sc.room.h,routeCount:sc.fixtures.filter(f=>f.action).map(f=>({label:f.label,reachable:Array.from({length:f.h+2},(_,j)=>Array.from({length:f.w+2},(_,i)=>sc.route(f.x-1+i,f.y-1+j)!==null)).flat().some(Boolean)}))};},
  indoorState(){
    if(!['store','venue'].includes(G.sceneName)||!G.scene?.party)return null;
    const sc=G.scene,l=sc.party[0],r=G.canvas.getBoundingClientRect(),u=G.cssPerUnit;
    const screen=(x,y)=>{const p=sc.screen(x,y);return{x:r.left+p.x*u,y:r.top+p.y*u};},at=screen(l.tx,l.ty);
    return {scene:G.sceneName,iso:!!sc.iso,floor:sc.floor,joy:!!sc.joy,path:sc.path.length,pending:!!sc.pending,
      party:sc.party.map(p=>({x:p.tx,y:p.ty,moving:p.moving})),
      directions:Object.entries(DIRS).map(([key,[dx,dy]])=>{let free=0;while(free<80&&sc.walkable(l.tx+dx*(free+1),l.ty+dy*(free+1)))free++;const q=screen(l.tx+dx,l.ty+dy);return{key,dx,dy,free,screen:q,vector:{x:q.x-at.x,y:q.y-at.y}};})};
  },
  venueVisit(label){if(G.sceneName!=='venue')return false;const f=G.scene.fixtures.find(f=>f.label===label);return !!f&&G.scene.request(f);},
  // 斜めの 館（サンシャインいけぶ）: 床の マス (x, y) の まんなか、または 什器の 見えて いる ところの 画面の 位置（CSS の px）。タップの テストに
  venuePoint(x,y,label){if(G.sceneName!=='venue'||!G.scene.iso)return null;const sc=G.scene,rc=G.canvas.getBoundingClientRect(),u=G.cssPerUnit;let q;if(label){const f=sc.fixtures.find(f=>f.label===label);if(!f)return null;const r=IsoVenue.rectOf(IsoVenue.hull(f));q=sc.toScreen({x:r.x+r.w/2,y:r.y+r.h*0.55});}else q=sc.screen(x,y);return {x:rc.left+q.x*u,y:rc.top+q.y*u};},
  venueWalk(x,y){if(G.sceneName!=='venue')return false;return G.scene.walkTo(x,y);},
  venueIso(){if(G.sceneName!=='venue')return null;const sc=G.scene;return {iso:sc.iso,ready:!!sc.isoReady,floor:sc.floor,leader:[sc.party[0].tx,sc.party[0].ty],crowd:(sc._crowd||[]).length,holes:(sc.room.holes||[]).length,guide:!!document.querySelector('.mall-guide')};},
  mac(lv=1) {Save.d.shops.burger.lv=lv;Game.goto('shop',{shop:'burger',variant:'mac',back:{map:'heiwadai',x:27,y:31,dir:'down'},returnStore:true},'none');return true;},
  macState(){if(!(G.scene?.task instanceof MacKitchenTask))return null;const t=G.scene.task,g=t.round;return {want:g.want,made:g.made,falling:g.falling,plate:g.plate,fries:g.fries,stage:g.stage(),time:g.time,score:g.score(),complete:g.complete(),play:t.playRect(),buttons:t.btns.map(b=>({label:b.label,x:b.x+b.w/2,y:b.y+b.h/2,w:b.w,h:b.h})),scale:G.canvas.getBoundingClientRect().width/G.W};},
  macAdvance(dt=.25){if(!this.macState()||!Game.paused||!Number.isFinite(dt)||dt<0||dt>3)return false;G.scene.update(dt);return this.macState();},
  districtTravel() { return {names:{town:MAP_DEFS.town.name,city:MAP_DEFS.city.name},places:AtlasArt.places,walkIns:Object.values(MAP_DEFS).filter(d=>!d.indoor).flatMap(d=>(d.warps||[]).filter(w=>w.to==='city')),coins:Save.d.coins}; },
  atlas() {WorldAtlas.open();return true;},
  station(id) { if(!Transit.stops[id]||UI.busy)return false;Transit.open(id);return true; },

  help() {
    const lines = [
      "PokaDebug.state()                     いまのシーン・マップ・コインなど",
      "PokaDebug.idle()                      画面切り替え中・会話中でなければ true",
      "PokaDebug.newGame({ goji: 'soft' })   オープニングを飛ばして はじめから（おうちへ）",
      "PokaDebug.teleport('meadow', 14, 3)   マップの (x, y) へ移動（town/city/coast/meadow/forest/cave）",
      "PokaDebug.water('coast', 30, 10)   水の かたまりの しゅるい（川・海・湖）・岸・その マスの 色",
      "PokaDebug.cast('town_walker0')   町の人の 名前・種・見た目（id なしで 全員の ようす）",
      "PokaDebug.house()                     おうちへ",
      "PokaDebug.worldZoom(0.5)              町の ズーム（0.5〜1.5・なしで ようす・第2引数 true で ゆっくり）。worldPoint(x, y) で マスの 画面の 位置",
      "PokaDebug.homeDoors()                 おうちの ドア（おでかけ・おへや・おにわの うらぐち）の 画面の ばしょと いける へや",
      "PokaDebug.homeFloor()                 おうちの 2かい（かいだん・1かいと 2かいの 画面の ばしょ・かたち polys・のぼって いるか）",
      "PokaDebug.fishSpawn('magoi', 60)      3人の ちかくに 魚の かげ（cm で ながさが きまる）。fishAuto(false, true) で かってに 出さない",
      "PokaDebug.fishAim()                   かげの あたまの まえ（ながおしする 画面の ばしょ）。fishState() で うき・かげ・じまんの ようす",
      "PokaDebug.smaho('map')                すまほを ひらく（アプリ id: map・status・bag・dex・event・rally・hint・fortune・rewards・music。なしで ホーム・null で とじる）",
      "PokaDebug.smahoState()                すまほの ようす（ひらいて いるか・アプリ・ボタンの ばしょ・しるし）",
      "PokaDebug.fortune('2026-9-28')        その日の うらない（日づけ なしで きょう）",
      "PokaDebug.discs()                     あつめた ディスク・音楽プレイヤー・いま ながれて いる きょく",
      "PokaDebug.discDrop('shop', 'crepe')   ディスクを かならず 手に入れる（'shop' / 'chest' と お店・マップ）",
      "PokaDebug.discLuck(true)              おてつだい・たからばこで ディスクが かならず 出る（false で もとに もどす）",
      "PokaDebug.parentWork('talk')          ぱぱ・ままの おしごと（9〜18じ）の ようす。'alone' / 'talk' で おるすばん、'arrive' / 'leave' で ただいま／いってきます",
      "PokaDebug.furnLive('lamp')            さわれる 家具の ようす（つく・チャンネル・きょく・はと など）と タップする 点",
      "PokaDebug.furnArt('piano', false)     家具の 立体モデル（作りなおしたか・床の 大きさ・絵の 大きさ・うごいて いるか）。id なしで 作りなおした 一覧",
      "PokaDebug.battle([{ kind: 'purun', lv: 2 }], 'meadow')  バトル開始",
      "PokaDebug.battleState()                属性・HP・状態・技・曲を読む",
      "PokaDebug.battleFixture({ hp: 1, condition: 'fire' })  コマンド待ち中に戦闘の状態を再現",
      "PokaDebug.music('town' | null)          曲を試聴/停止。引数なしで音の状態",
      "PokaDebug.musicCatalog()               曲名・楽器・小節数の一覧",
      "await PokaDebug.musicRender('town', 8)  同じ音源でオフライン合成・音量/負荷を検証",
      "PokaDebug.shop('crepe', 3)            お店ミニゲームを Lv3 で開始",
      "PokaDebug.koroSetup({bodies:[[3,40,100],[3,60,100]]}) ころころ フルーツの 箱に 玉を おく（seed・held・next も。スコア モードでも）",
      "PokaDebug.koroScore({ seed: 1 })     ころころ フルーツの スコア モードを はじめる（お店の まえに もどる）",
      "PokaDebug.koro()                      スコア モードの ようす（スコア・ハイスコア・さいきんの きろく・もらった とくべつな かぐ・きろくの まどで とまって いるか・箱の CSS 座標・玉・つぎ・おしまい）",
      "PokaDebug.store('clothes', 'town')    歩ける店内へ（入口のある町を選べる）",
      "PokaDebug.storeState()                店員・展示・通路・3人・出口の状態",
      "PokaDebug.storeWalkTo(5, 3)           店内のマスまで実際に歩く",
      "PokaDebug.coins(1000)                 コインを足す",
      "PokaDebug.level(16)                   3人のレベルを設定して全回復",
      "PokaDebug.unlockAll()                 服・家具・壁紙・床を ぜんぶ持つ",
      "PokaDebug.itemDex('furn')             家具／服の図鑑の記録（'furn' / 'wear'）",
      "PokaDebug.itemDexClaim('wear', 10)    10種類ごとの図鑑のごほうびを受け取る",
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
  homeRoom(id){if(G.sceneName!=="house"||!HomeRooms.switchTo(id))return false;Game.goto("house");return true;},
  roomPresets(){return JSON.parse(JSON.stringify(RoomPresets.list()));},
      scene: G.sceneName,
      map: sc && sc.mapId ? sc.mapId : null,
      pos: sc && sc.party ? [sc.party[0].tx, sc.party[0].ty] : null,
      phase: sc && sc.phase ? sc.phase : null,
      busy: UI.busy,
      transitioning: !!Game.trans,
      coins: Save.d ? Save.d.coins : null,
    };
  },
  idle() { return !Game.trans && !UI.busy && !(G.sceneName==='venue'&&G.scene.busy); },
  townLayout(id) {
    const m=Maps.get(id);return {id,w:m.w,h:m.h,spawn:m.def.safeSpawn,views:m.def.views,doors:m.doors.map(d=>({id:d.b.id,x:d.x,y:d.y,act:d.b.act})),warps:m.warps};
  },
  nerikasuArt() {
    return {night:DayTint.isNight(),buildings:MAP_DEFS.town.buildings.map(b=>({id:b.id,asset:b.asset,x:b.x,y:b.y,w:b.w,h:b.h,door:b.door,model:HeiwadaiArt.model(b.asset,{})})).map(({model,...b})=>({...b,origin:[model.originX,model.originY],size:[model.w,model.h]})),
      cached:[...SvgCache.map.keys()].filter(k=>k.includes('heiwadai_nerikasu'))};
  },
  backupText(){return SaveBackup.encode();},
  backupDecode(text){return SaveBackup.decode(text);},
  dailyVisit(day) {return DailyPlay.visit(day);},
  dailyState() {return {...Save.d.daily,featured:DailyPlay.featured(),shop:SHOPS[DailyPlay.featured()].name,mul:DailyPlay.mul()};},
  saveData() {return JSON.parse(JSON.stringify(Save.d));},
  itemDex(kind = "furn") {
    return { kind, ...ItemDex.progress(kind), entries: ItemDex.entries(kind).map(e => ({ id: e.id, name: e.item.name, category: kind === "furn" ? e.item.kind : e.item.slot, seen: e.seen, owned: e.owned, count: e.count, rare: !!e.item.rare })) };
  },
  itemDexClaim(kind, threshold) { return ItemDex.claim(kind, threshold); },
  shopRewards(shop) {return { rows:ShopRewards.rows(shop), levels:[...SHOP_LV_REP], cap:ShopRewards.maxLevel };},
  shopRewardClaim(shop) {return ShopRewards.claim(shop).map(p=>p.id);},
  shopRewardOpen(shop) {ShopRewards.open(shop);},
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
    sc.map=m;sc.mapId=id;sc.npcs=(d.npcs||[]).map(n=>({...n,w:new Walker(n.x,n.y,n.dir)}));sc.enemies=[];sc.rocks=[];
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
    const point=(x,y)=>{const q=WorldZoom.toScreen(sc,x*TS+16,y*TS+16);return {cx:r.left+q.x*G.cssPerUnit,cy:r.top+q.y*G.cssPerUnit};};
    return {map:sc.mapId,party:sc.party.map((p,i)=>({id:Save.d.order[i],x:p.tx,y:p.ty})),
      objects:(sc.map.def.objects||[]).map(o=>({...o,...point(o.x+(o.w-1)/2,o.y+(o.h-1)/2)})),
      stops:sc.map.doors.filter(d=>d.b.act.type==="transit").map(d=>({id:d.b.act.stop,x:d.x,y:d.y,...point(d.x,d.y-1)})),
      active:sc.objectActive?.until>G.t?sc.objectActive.id:null};
  },
  // 町の ズーム: worldZoom() で ようす、worldZoom(0.5) で すぐに その 倍率（アニメなし）、worldZoom(0.5,true) で ゆっくり
  worldZoom(z,animate=false) {
    if(G.sceneName!=="world")return null;const sc=G.scene;
    if(z!=null)WorldZoom.set(sc,+z,!animate);
    return WorldZoom.state(sc);
  },
  // 町の マス (x, y) の まんなかの 画面の 位置（CSS の px。ズームを ふくむ）
  worldPoint(x,y) {
    if(G.sceneName!=="world")return null;const sc=G.scene,r=G.canvas.getBoundingClientRect(),q=WorldZoom.toScreen(sc,x*TS+16,y*TS+16);
    return {x:r.left+q.x*G.cssPerUnit,y:r.top+q.y*G.cssPerUnit};
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
  homeActions() {
    if(G.sceneName!=='house')return null;const sc=G.scene;
    return {next:sc.actions.next,time:sc.actions.time,available:HomeActions.available(sc).map(k=>k.id),kinds:HomeActions.kinds.map(k=>k.id),log:sc.actions.log.map(x=>({...x})),chars:sc.chars.map(c=>({id:c.id,state:c.state,x:c.x,y:c.y,activity:c.activity?{...c.activity}:null})),talkNext:sc.life.next,talkDelay:{normal:HomeLife.nextDelay(false),watching:HomeLife.nextDelay(true)}};
  },
  homeActionSchedule() {if(G.sceneName!=='house')return false;HomeActions.init(G.scene);return true;},
  homeAction(id,kind) {
    if(G.sceneName!=='house')return false;const sc=G.scene,c=sc.chars.find(c=>c.id===id);if(!c)return false;
    HomeActions.cancel(c);c.state='idle';c.t=100;return HomeActions.start(sc,c,kind);
  },
  homeAdvance(seconds) {
    if(G.sceneName!=='house'||!Game.paused||!Number.isFinite(seconds)||seconds<0||seconds>120)return false;
    for(let t=0;t<seconds;t+=.05)G.scene.update(Math.min(.05,seconds-t));return true;
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
  homeBubbleFixture() {if(G.sceneName!=='house')return false;const sc=G.scene;sc.chars.forEach(c=>HomeActions.cancel(c));sc.chars.forEach((c,i)=>Object.assign(c,{x:160+i*80,y:430+(i%2)*35,state:'idle',t:3600,hidden:false}));sc.parents.forEach((p,i)=>Object.assign(p,{x:i?375:90,y:345,state:'idle',target:null,queue:[]}));sc.parentTimer=3600;sc.actions.next=3600;Object.assign(sc.life,{next:3600,queue:[],bubbles:[],quarrel:false});return true;},
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
    const sc=G.scene,world=this.world(),r=G.canvas.getBoundingClientRect();return {...HeiwadaiLife.state(),night:DayTint.isNight(),cache:SvgCache.map.size,sceneryCache:[...SvgCache.map.keys()].filter(k=>/^(w:heiwadai_|heiwadai-life:|heiwadai-ground:)/.test(k)).length,sceneryLimit:HeiwadaiArt.entries.length+Object.keys(HEIWADAI_LAYOUT_DATA.patterns).length+3,npcs:sc?.mapId==='heiwadai'?sc.npcs.map(n=>({id:n.id,name:n.name,x:n.w.x,y:n.w.y,sp:n.sp,outfit:n.outfit,cx:r.left+WorldZoom.toScreen(sc,(n.w.x+.5+(n.artOffset?.[0]||0))*TS,0).x*G.cssPerUnit,cy:r.top+WorldZoom.toScreen(sc,0,(n.w.y+.5+(n.artOffset?.[1]||0))*TS).y*G.cssPerUnit})):[],...world};
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
  // おうちの ドア（UI-09）: ドアの ばしょ（CSS の px・cx, cy は タップする ところ）・いける へや・あるいて いるか
  homeDoors() { return G.sceneName === "house" ? HomeDoors.state(G.scene) : null; },
  // おうちの 2かい（HOME-2F）: かって いるか・いる かい・かいだんと 2つの へやの 画面の ばしょ・3人の たかさ z
  homeFloor() { return G.sceneName === "house" ? HomeFloors.state(G.scene) : null; },
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
  furnArt(id, flip = false) {
    if (id == null) return { ids: typeof FurnModels !== "undefined" ? [...FurnModels.ids] : [] };
    const f = FURN_INDEX[id];
    if (!f) return null;
    const dm = HomeDesign.dimensions(id), m = f.kind === "wall" ? null : HomeDesign.model(id, { flip }), fm = typeof FurnModels !== "undefined";
    const o = { flip }; if (typeof FurnLive !== "undefined") FurnLive.opts({ id, flip, uid: 0 }, o);
    const key = "furn:" + id + ":" + JSON.stringify(o);
    return { id, kind: f.kind, rebuilt: fm && FurnModels.ids.includes(id), art: fm && FurnModels.has(id), dims: dm,
      foot: !m || (m.footW === (flip ? dm.d : dm.w) && m.footD === (flip ? dm.w : dm.d)), w: m ? m.w : f.w, h: m ? m.h : f.h,
      kb: (m ? m.full.length : Art.furnSvg(id, { flip }).length) / 1024, loaded: [...SvgCache.map.keys()].some((k) => k.startsWith(key + "@")),
      moving: G.sceneName === "house" && Save.d.room.items.some((it) => it.id === id && G.scene.life.furniture[it.uid] > 0) };
  },
  // すまほ: app を わたすと その アプリ、なしで ホーム、null で とじる
  smaho(app) {
    if (typeof Smaho === "undefined") return null;
    if (app === null) { Smaho.close(); return this.smahoState(); }
    if (app) Smaho.show(app); else if (!Smaho.view) Smaho.open(); else Smaho.home();
    return this.smahoState();
  },
  smahoState() {
    if (typeof Smaho === "undefined") return null;
    const b = Smaho.button, r = b && !b.classList.contains("hidden") ? b.getBoundingClientRect() : null;
    const v = Smaho.view, ph = v ? v.phone.getBoundingClientRect() : null;
    return { open: !!v, app: v ? v.app : null, apps: Smaho.apps().map((a) => a.name), button: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, phone: ph ? { x: ph.x, y: ph.y, w: ph.width, h: ph.height } : null, dot: !!b && !b.querySelector(".smaho-dot").classList.contains("hidden"), hints: Smaho.hints().length };
  },
  fortune(day) { return typeof Smaho === "undefined" ? null : Smaho.fortune(day || U.today()); },
  // ART-05: ディスクと 音楽プレイヤー。discDrop("shop", "crepe") / discDrop("chest", "forest") は かならず 出る ときの 手に入れかた
  discs() {
    if (typeof MusicDiscs === "undefined") return null;
    const sc = G.sceneName === "house" ? G.scene : null;
    return { owned: MusicDiscs.DISCS.filter((d) => MusicDiscs.has(d.id)).map((d) => d.id), total: MusicDiscs.DISCS.length, players: Object.fromEntries(Object.keys(MusicDiscs.PLAYERS).map((id) => [id, Save.d.furn[id] || 0])), playing: sc?.music?.disc || null, song: Sound.cur?.name || null };
  },
  discLuck(on = true) { return typeof MusicDiscs === "undefined" ? null : MusicDiscs.luck(on); },
  discDrop(kind, where) {
    if (typeof MusicDiscs === "undefined") return null;
    const always = () => 0;
    return kind === "shop" ? MusicDiscs.fromShop(where, [3, 3, 3], always) : kind === "chest" ? MusicDiscs.fromChest(where, always) : MusicDiscs.grant(where);
  },
  // ぱぱ・ままの おしごと（ART-04）: いまの ようす。event を わたすと おるすばんの できごとを すぐ おこす（"alone" / "talk"）
  parentWork(event) {
    if (G.sceneName !== "house" || typeof ParentWork === "undefined") return null;
    const sc = G.scene, w = sc.work || {};
    const ran = event === "arrive" ? (ParentWork.arrive(sc), event) : event === "leave" ? (ParentWork.leave(sc), event) : event ? ParentWork.event(sc, event) : null;
    return { away: ParentWork.away(), phase: w.phase, visible: sc.parents.filter((p) => !p.hidden).map((p) => p.id), fade: w.fade, left: ParentWork.minutesLeft(), label: sc.parentButton ? sc.parentButton.textContent : null, ran, queued: (w.queue || []).length };
  },
  // さわれる 家具の ようす（とけい・ライト・テレビ など）と、その 家具を タップできる 画面の 点
  furnLive(id) {
    if (G.sceneName !== "house" || typeof FurnLive === "undefined") return null;
    const sc = G.scene, it = Save.d.room.items.find((x) => x.id === id);
    if (!it) return null;
    const r = sc.itemRect(it), c = G.canvas.getBoundingClientRect(), actors = [...sc.chars.map((a) => [a, false]), ...sc.parents.map((a) => [a, true])].filter(([a]) => !a.hidden);
    let tap = null;
    // 3人・ぱぱ ままに かさならず、その 家具に あたる 点（タップは 人が さき）。人の わくの すぐ そとは さける
    // （ブラウザに よっては タッチの 座標が 1px まるめられて 人に あたる）。よゆうが とれない ときだけ わくの そと ぎりぎり
    for (const pad of [10, 0]) for (let fy = 0.2; fy <= 0.9 && !tap; fy += 0.1) for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
      const sx = r.x + r.w * fx, sy = r.y + r.h * fy, q = sc.toRoom(sx, sy);
      if (actors.some(([a, parent]) => sc.contains(sc.actorRect(a, parent), { x: sx, y: sy }, pad))) continue;
      if (sc.hitItem(q.x, q.y) === it) { tap = { x: c.left + sx * G.cssPerUnit, y: c.top + sy * G.cssPerUnit }; break; }
    }
    return { ...FurnLive.state(it), tap, talk: sc.life.log.length };
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
  // 町の人の 見た目（NpcCast）。id を わたすと その人の 名前・種・look、なければ 全員の ようす（おなじ 見た目・名前の ペア）
  cast(id) {
    if (id == null) return { ...NpcCast.report(), customers: NpcCast.customers.length, species: Object.keys(NpcArt.SP).length, used: NpcCast.report().species };
    for (const d of Object.values(MAP_DEFS)) { const n = (d.npcs || []).find((x) => x.id === id); if (n) return { id, name: TownFolk.name(n), sp: n.sp, col: n.col, look: n.look || null, outfit: n.outfit || {}, given: !!n.given }; }
    return null;
  },
  // 水の 絵（川・海・湖）の ようす（WaterArt.info）。x, y を わたすと その マスの まんなかの チャンクの 色 px も かえす
  water(map = G.sceneName === "world" ? G.scene.mapId : "town", x, y) {
    const m = Maps.get(map), info = WaterArt.info(m);
    if (x == null) return info;
    const c = Tiles.chunk(m, Math.floor(x / 8), Math.floor(y / 8)), s = c.width / 8;
    const d = c.getContext("2d").getImageData(Math.floor(((x % 8) + 0.5) * s), Math.floor(((y % 8) + 0.5) * s), 1, 1).data;
    return { ...info, px: [d[0], d[1], d[2]], looksWet: WaterArt.looksWet(m, x, y) };
  },
  teleport(map = "town", x, y, dir = "down") {
    const d = MAP_DEFS[map];
    if (!d) throw new Error("unknown map: " + map);
    Game.trans = null;
    Game.goto("world", { map, x, y, dir, grace: 2 }, "none");
  },
  house() { Game.trans = null; Game.goto("house", {}, "none"); },
  // ② 町の人: その人の マップの となりへ 行って 話しかける（Talk.run）。会話は テストの がわで すすめる（またない）
  npcLife() {
    const sc=G.scene;if(G.sceneName!=="world")return null;
    const r=G.canvas.getBoundingClientRect();
    return sc.npcs.map(n=>{const s=NpcLife.init(sc,n),f=n.w.feet();return {id:n.id,x:n.w.tx,y:n.w.ty,fx:n.w.fx,fy:n.w.fy,moving:n.w.moving,talking:!!n.talking,dir:n.w.dir,action:s.action,elapsed:s.elapsed,bounds:s.bounds,visual:NpcLife.visual(n),
      cx:r.left+WorldZoom.toScreen(sc,f.x+(n.artOffset?.[0]||0)*TS,0).x*G.cssPerUnit,cy:r.top+WorldZoom.toScreen(sc,0,f.y-20+(n.artOffset?.[1]||0)*TS).y*G.cssPerUnit};});
  },
  npcLifeAdvance(seconds=15) { if(G.sceneName!=="world")return null;for(let t=0;t<Math.min(60,Math.max(0,seconds));t+=0.05)NpcLife.update(G.scene,0.05);return this.npcLife(); },
  npcLifeAct(id,action) {const sc=G.scene,n=G.sceneName==="world"&&sc.npcs.find(n=>n.id===id);if(!n)return false;NpcLife.init(sc,n);if(n.w.moving)n.w.update(n.w.dur);n.w.dir="down";return NpcLife.start(n,action);},
  npcLifeApproach(id) {const sc=G.scene,n=G.sceneName==="world"&&sc.npcs.find(n=>n.id===id);if(!n)return false;sc.goInteract(n.w.tx,n.w.ty,{type:"npc",npc:n});return sc.pending?.npc===n||n.talking;},
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
    const at = (x, y) => { if (!(sc && sc.mapId === id)) return {}; const q = WorldZoom.toScreen(sc, x * TS + 16, y * TS + 16); return { cx: r.left + q.x * G.cssPerUnit, cy: r.top + q.y * G.cssPerUnit }; };
    return TownFolk.spotsOn(id).map((s) => ({ ...s, stand: [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).find(([x, y]) => free(x, y)) || null, ...at(s.x, s.y) }));
  },
  // ② しゃしんが とれる マス（手順が photo の とき。なければ null）
  folkPhotoTile(map) { return TownFolk.reach(map).tiles.find(([x, y]) => TownFolk.photoSpot(map, x, y)) || null; },
  // ネリカスタウンの いらい（js/neri-quests.js）: きょうの けいじばん・うけて いる いらいと すすみぐあい
  quests() {
    if (typeof NeriQuests === "undefined") return null;
    NeriQuests.board(); const s = Save.d.quests, Q = NeriQuests.byId;
    return { day: s.day, board: s.board.map((id) => ({ id, type: Q[id].type, stars: Q[id].stars, reward: Q[id].reward, title: NeriQuests.title(Q[id]), enemy: Q[id].enemy || null, n: Q[id].n || 0, item: Q[id].item || null, to: Q[id].to || null, follow: !!Q[id].follow })),
      active: s.active.map((a) => ({ ...JSON.parse(JSON.stringify(a)), title: NeriQuests.title(Q[a.id]), progress: NeriQuests.progress(a) })), done: [...s.done], total: s.total, earned: s.earned };
  },
  // けいじばんの マスと 画面の 位置（町に いる とき）
  questBoardAt() {
    const [x, y] = NeriQuests.BOARD, sc = G.sceneName === "world" && G.scene.mapId === "town" ? G.scene : null, r = G.canvas.getBoundingClientRect();
    if (!sc) return { x, y };
    const q = WorldZoom.toScreen(sc, x * TS + 16, y * TS + 8); return { x, y, cx: r.left + q.x * G.cssPerUnit, cy: r.top + q.y * G.cssPerUnit };
  },
  // バスていの 小物（map を はぶくと いまの 地図。バスていの ない 地図は null）。その 地図に いれば 画面の ばしょ（cx, cy: ひだりはしの マス。まえに 立つ なかまの 頭に かさならない）も。front は バスで ついた ときの マス
  busStopAt(map) {
    const sc = G.sceneName === "world" ? G.scene : null, m = map || sc?.mapId, b = Transit.BUS[m];
    const o = b && b.stop && (MAP_DEFS[m].objects || []).find((o) => o.id === b.stop);
    if (!o) return null;
    const out = { map: m, id: o.id, x: o.x, y: o.y, w: o.w, h: o.h, front: Transit.busArrival(m) };
    if (sc && sc.mapId === m) { const r = G.canvas.getBoundingClientRect(), q = WorldZoom.toScreen(sc, o.x * TS + 16, o.y * TS + 8); out.cx = r.left + q.x * G.cssPerUnit; out.cy = r.top + q.y * G.cssPerUnit; }
    return out;
  },
  // はたけ（js/farm.js）: 6まいの ようす（c・s・w・f・t・n と info〔state・text・left〕・yield）・しゅうかくの きろく・がめんに いるか・3人の ばしょ
  farm() {
    Farm.update();
    const f = Farm.st(), sc = G.sceneName === "farm" ? G.scene : null;
    return { plots: f.plots.map((p, i) => ({ ...p, info: Farm.info(i), yield: Farm.yieldOf(i) })), harvests: f.harvests, sown: f.sown, fert: f.fert, got: { ...f.got }, first: { ...f.first }, tier: Farm.tier(), scene: !!sc, busy: !!sc?.busy, acting: !!Farm.acting, team: sc ? sc.team.map((t) => ({ id: t.id, x: t.x, y: t.y, moving: !!t.moving })) : null };
  },
  // はたけ i の タップする ばしょ: はたけの がめん → 区画の なか（cx, cy）・町 → 小物の マス（x, y, w, h）・まえの マス front・いれば 画面の ばしょ（2れつめの うえの マス）
  farmPlotAt(i) {
    const r = G.canvas.getBoundingClientRect();
    if (G.sceneName === "farm") { const p = G.scene.plots[i]; return { cx: r.left + (p.x + p.w / 2) * G.cssPerUnit, cy: r.top + (p.y + p.h * 0.35) * G.cssPerUnit }; }
    const o = MAP_DEFS.town.objects.find((o) => o.farmPlot === i);
    if (!o) return null;
    const out = { x: o.x, y: o.y, w: o.w, h: o.h, front: { x: o.x + 1, y: o.y + o.h } };
    if (G.sceneName === "world" && G.scene.mapId === "town") { const q = WorldZoom.toScreen(G.scene, (o.x + 1) * TS + 16, o.y * TS + 16); out.cx = r.left + q.x * G.cssPerUnit; out.cy = r.top + q.y * G.cssPerUnit; }
    return out;
  },
  // はたけの かんばん（町）: マス・まえの マス・画面の ばしょ
  farmSignAt() {
    const o = MAP_DEFS.town.objects.find((o) => o.farmSign), r = G.canvas.getBoundingClientRect();
    const out = { x: o.x, y: o.y, front: { x: o.x, y: o.y + 1 } };
    if (G.sceneName === "world" && G.scene.mapId === "town") { const q = WorldZoom.toScreen(G.scene, o.x * TS + 16, o.y * TS + 12); out.cx = r.left + q.x * G.cssPerUnit; out.cy = r.top + q.y * G.cssPerUnit; }
    return out;
  },
  // はたけの じかんを min ぷん すすめる（まいた じかんを まえに ずらす）
  farmSkip(min) { Farm.skip(min); return this.farm(); },
  // はたけの がめんへ（かえりは かんばんの まえ）
  farmGo() { const s = this.farmSignAt(); Game.goto("farm", { back: { map: "town", x: s.front.x, y: s.front.y, dir: "up" } }, "none"); return true; },
  // ② ついて きて いる こねこ（いなければ null）
  folkKitten() { const k = G.sceneName === "world" && G.scene.follower; return k ? { x: k.w.tx, y: k.w.ty, trail: k.trail.length } : null; },
  // ③ 釣り: いけすに 入れる（ずかんにも のる。大きさは Fishing.size）。いまの ずかんの きろくを かえす
  fishGive(id, n = 1) {
    const f = Fishing.fish(id); if (!f) throw new Error("unknown fish: " + id);
    for (let i = 0; i < n; i++) Fishing.record(id, Fishing.size(f));
    return { ...Save.d.fish.dex[id], keep: Save.d.fish.keep[id] };
  },
  // ④ 骨を もたせる（key は "trex.skull" など）。もって いる 数を かえす
  fossilGive(key, n = 1) { if (!Fossils.bone(key)) throw new Error("unknown bone: " + key); Fossils.give(key, n); return Save.d.fossil.bones[key]; },
  // ④ ピッケルを もたせる（0 なし／1 あり）
  pick(n = 1) { Save.d.fossil.pick = n; Save.mark(); return n; },
  // ④ ほる 画面を ひらく（key を わたすと その 骨が 出る。いわとは むすばない）。おわると Fossils.dig の けっか
  fossilDig(site = "cave", key) {
    if (key && !Fossils.bone(key)) throw new Error("unknown bone: " + key);
    const sc = G.sceneName === "world" ? G.scene : null;
    if (sc) sc.busy = true;
    Fossils.dig(null, null, { key: key || null, site }).finally(() => { if (sc) sc.busy = false; });
    return true;
  },
  // ④ ほる 画面の マスを たたく（x 0〜6・y 0〜4）。{ left, done, stars } か null
  digTap(x, y) { return Fossils.digging ? Fossils.digging.tap(x, y) : null; },
  digState() { const g = Fossils.digging && Fossils.digging.dig; return g ? { hp: [...g.hp], area: { ...g.area }, taps: g.taps, done: g.done, cols: g.cols, rows: g.rows } : null; },
  fossilState() { return JSON.parse(JSON.stringify({ pick: Save.d.fossil.pick, bones: Save.d.fossil.bones, dug: Save.d.fossil.dug })); },
  // ④ きょうの いわ（[[x, y], ...]）と、いわの となりの 立てる マス（{ x, y, dir, rock }）
  fossilRocks(map = "cave") { return Fossils.rocksOn(map); },
  fossilSpot(map = "cave") {
    const m = Maps.get(map), D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, rocks = Fossils.rocksOn(map);
    for (const r of rocks) for (const [dir, [dx, dy]] of Object.entries(D)) { const x = r[0] - dx, y = r[1] - dy; if (!m.isSolid(x, y) && !m.warpAt(x, y) && !rocks.some(([a, b]) => a === x && b === y)) return { x, y, dir, rock: r }; }
    return null;
  },
  // ⑤ 館（aquarium / museum）へ。room を わたすと その へやの まんなかの 手前（下の ほう）の 床に（展示の うしろに かくれない）
  museumGo(id = "aquarium", room) {
    // UI-05: すいぞくかんは サンシャインいけぶ 12F・13F（room は あたらしい へや。むかしの へやの 名前も うけつける）
    if (id === "aquarium" && typeof IkeAquarium !== "undefined") {
      const old = { entrance: "lobby", tunnel: "tunnel", esc: "tunnel", stream: "river", river: "river", pond: "pond", ring: "sea", tide: "iso", deep: "deep", shop: "shop" }, zid = old[room] || room || "lobby";
      const fl = IkeAquarium.ZONES[13].some((z) => z.id === zid) ? 13 : 12, z = IkeAquarium.ZONES[fl].find((q) => q.id === zid); if (!z) throw new Error("unknown room: " + room);
      const r = VenueHalls.defs.mall.floors[fl], sc = new SCENES.venue(); sc.room = r; sc.fixtures = r.fixtures; let best = null;
      for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (sc.walkable(x, y)) { const d = Math.abs(x - (z.x + z.w / 2)) + Math.abs(y - (z.y + z.h - 2)); if (!best || d < best[2]) best = [x, y, d]; }
      const b = MAP_DEFS.city.buildings.find((b) => b.id === "ike_mall"); Game.trans = null;
      Game.goto("venue", { venue: "mall", floor: fl, at: best ? [best[0], best[1]] : null, back: { map: "city", x: b.x + b.door, y: b.y + b.h, dir: "down" } }, "none");
      return { floor: fl, x: best && best[0], y: best && best[1] };
    }
    const b = Museum.building(id); if (!b) throw new Error("unknown museum: " + id);
    let x = b.arrive.x, y = b.arrive.y;
    if (room) {
      const r = b.rooms.find((q) => q.id === room); if (!r) throw new Error("unknown room: " + room);
      const m = Maps.get(id), cx = r.x + Math.floor(r.w / 2), cy = r.y + r.h - 2; let best = null;
      for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) if (!m.isSolid(xx, yy) && !m.warpAt(xx, yy)) { const d = Math.abs(xx - cx) + Math.abs(yy - cy); if (!best || d < best[2]) best = [xx, yy, d]; }
      if (best) [x, y] = best;
    }
    this.teleport(id, x, y, "up");
    return { x, y };
  },
  // ⑤ 寄贈した ことに する（kind: "fish" / "bone"。key は 魚 id か "trex.skull"、"all" で ぜんぶ。骨が そろった 恐竜は done も）
  museumGive(kind = "fish", key = "all") {
    const st = Save.d.museum, day = U.today();
    if (kind === "fish") for (const f of FISHING_DATA.fish) { if (key === "all" || key === f.id) st.fish[f.id] = day; }
    else for (const d of FOSSIL_DATA.dinos) { for (const p of d.art.parts) if (key === "all" || key === d.id + "." + p.id) st.bones[d.id + "." + p.id] = day; if (Museum.dinoDone(d) && !st.done[d.id]) st.done[d.id] = day; }
    Save.mark(); if (G.sceneName === "world") Museum.refresh(G.scene);
    return this.museumState();
  },
  // ⑤ 館の 人に 話しかけて 寄贈の 画面へ（会話は テストが すすめる）。museumPick(key) → museumConfirm()
  museumDonate() {
    if (G.sceneName === "venue" && G.scene.room && G.scene.room.aqua) { const sc = G.scene, f = sc.fixtures.find((f) => f.action === "curator"); if (!f || sc.busy) return false; IkeAquarium.interact(sc, f); return true; }
    const sc = G.sceneName === "world" ? G.scene : null, n = sc && sc.map.def.indoor && sc.npcs.find((x) => x.role === "donate");
    if (!n || sc.busy) return false;
    sc.interact({ type: "npc", npc: n });
    return true;
  },
  museumPick(key) { return Museum.picking ? Museum.picking.pick(key) : false; },
  // きふする（ありがとうの 会話は テストが すすめる ので またない）
  museumConfirm() { if (!Museum.picking || !Museum.picking.sel()) return false; Museum.picking.confirm(); return true; },
  // ⑤ 展示の 説明を ひらく（objId は "aq_flow"・"mu_trex"・"mu_f1" など）
  museumShow(objId) {
    const o = Museum.object(objId); if (!o) throw new Error("unknown exhibit: " + objId);
    if (o.map === "aquarium" && typeof IkeAquarium !== "undefined") { const f = [12, 13].flatMap((fl) => VenueHalls.defs.mall.floors[fl].fixtures).find((f) => f.obj === objId && f.action === "tank"); return !!(f && IkeAquarium.show(f)); }
    return !!Museum.show(G.sceneName === "world" ? G.scene : null, o);
  },
  // UI-05: 12F・13F の 水そうで およいで いる 魚（寄贈した 魚だけ・絵が よみこめて いるか）
  aquaTank(objId) {
    const f = G.sceneName === "venue" && G.scene.fixtures.find((f) => f.obj === objId), sc = G.scene, o = IkeAquarium.obj(objId); if (!o) return null;
    const wall = sc && sc.room && [...(sc.room.walls?.north || []), ...(sc.room.walls?.west || [])].find((p) => p.obj === objId);
    return { here: !!(f || wall), floor: G.sceneName === "venue" ? sc.floor : null, fish: o.fish.filter((id) => Museum.gaveFish(id)) };
  },
  // ⑤ 寄贈の きろく（2番で ふえる）と 入った へや
  museumState() { const st = Save.d.museum; return { fish: Object.keys(st.fish).length, bones: Object.keys(st.bones).length, done: Object.keys(st.done), rooms: Object.keys(st.rooms), intro: document.querySelector(".museum-intro")?.innerText || null }; },
  // ③ さおを もたせる（0 なし／1 つりざお／2 りっぱな つりざお）
  // ⑥ 射撃場: ロビーを とばして あそびを はじめる（ロックは むし・もどり先は シティの 入口の まえ）
  range(courseId = "steel", gunId = "auto", who = "wanko", seed) {
    if (!RANGE_DATA.courses[courseId] || !RANGE_DATA.guns.some((g) => g.id === gunId) || !Save.d.chars[who]) throw new Error("unknown range: " + courseId + " / " + gunId + " / " + who);
    Save.d.range.safety = true; Game.trans = null;
    Game.goto("range", { start: { course: courseId, gun: gunId, who, seed: seed || "dbg:" + courseId + ":" + gunId } }, "none");
    return true;
  },
  // 1フレームぶんの 入力 { dx, dy, fire, hold, ads, breath, action, reload, zoomIn, zoomOut, finish }（つぎの フレームで つかう）
  // シーンを きりかえて いる あいだは G.sceneName が さきに "range" に なるので、G.scene が RangeScene か で みる
  rangeInput(inp = {}) { const s = G.scene; if (!(s instanceof RangeScene) || s.mode !== "play") return false; s.dbg = { ...(s.dbg || {}), ...inp }; return true; },
  // じどうで あそぶ（ShootingRange.bot。1/60 びょう ずつ sec びょう ぶん すぐ すすめる）
  rangeAuto(sec = 60, skill = "casual") { const s = G.scene; if (!(s instanceof RangeScene) || s.mode !== "play") return null; s.autoPlay(sec, skill); return this.rangeState(); },
  // game.hud() ＋ { mode, course, gun, who, result, stars, coins, hop }（射撃場で ない ときと きりかえ ちゅうは null）
  rangeState() { return G.scene instanceof RangeScene ? G.scene.state() : null; },
  rangeEnd() { const s = G.scene; if (!(s instanceof RangeScene) || s.mode !== "play") return null; s.game.finish(); s.finish(); return this.rangeState(); },
  rod(n = 1) { Save.d.fish.rod = n; Save.mark(); return n; },
  // ③ UI-02: 見おろしの まま つる（FishLine）。fishState は つりの ようす（町・フィールドで ない ときは null）
  fishState() { return G.sceneName === "world" ? FishLine.state(G.scene) : null; },
  // かってに 魚が 出る／出ない（テストは false に して fishSpawn で 出す）。clear で いまの かげを けす
  fishAuto(on = true, clear = false) { if (G.sceneName !== "world") return null; const S = FishLine.st(G.scene); S.auto = !!on; S.first = false; if (clear) S.shadows = []; return S.auto; },
  // 3人の ちかく（1.6〜3.6マス）に 魚の かげを 1ぴき（あたまが 3人の ほう）。o: { nibbles（ちょんの かず・1）, fickle（0）, swim（true で およぐ。ふつうは うきに 気づく まで とまって いる） }
  fishSpawn(id, cm, o = {}) {
    if (G.sceneName !== "world") return null;
    const sc = G.scene, S = FishLine.st(sc), f = Fishing.fish(id); if (!S.spot) return null; if (!f) throw new Error("unknown fish: " + id);
    cm = cm || Fishing.size(f);
    const len = FishLine.shadowLen(cm), wid = FishLine.shadowWid(f, len), p = sc.party[0].feet(), py = p.y - 12;
    let best = null;
    for (const [tx, ty] of FishLine.waterTiles(sc.map)) for (const [ox, oy] of [[16, 16], [8, 16], [24, 16], [16, 8], [16, 24]]) {
      const x = tx * TS + ox, y = ty * TS + oy, d = Math.hypot(x - p.x, y - py);
      if (d < 1.6 * TS || d > 3.6 * TS) continue;
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8, hx = x + (Math.cos(a) * len) / 2, hy = y + (Math.sin(a) * len) / 2, bx = hx + Math.cos(a) * 18, by = hy + Math.sin(a) * 18;
        if (!FishLine.fits(sc.map, x, y, a, len, wid) || !FishLine.water(sc.map, bx, by) || Math.hypot(bx - p.x, by - py) > FishLine.CAST_MAX - 8 || Math.hypot(bx - p.x, by - py) < FishLine.CAST_MIN + 4) continue;
        const score = (-(Math.cos(a) * (x - p.x) + Math.sin(a) * (y - py)) / d) * 2 - Math.abs(d - 2.6 * TS) / TS;
        if (!best || score > best.score) best = { x, y, a, score };
      }
    }
    if (!best) return null;
    const sh = FishLine.spawn(sc, { fish: id, cm, nibbles: o.nibbles != null ? o.nibbles : 1, fickle: o.fickle || 0, alpha: 1, life: 900, at: best });
    if (sh && !o.swim) sh.pause = 999;
    return sh ? FishLine.state(sc).shadows.find((x) => x.uid === sh.uid) : null;
  },
  // その かげの あたまの すこし まえ（うきを おとす ところ）。x・y は 画面の CSS px（page.mouse で ながおし する ばしょ）
  fishAim(uid) {
    const st = this.fishState(), s = st && (st.shadows.find((x) => x.uid === uid) || st.shadows[0]); if (!s) return null;
    const wx = s.head.x + Math.cos(s.a) * 18, wy = s.head.y + Math.sin(s.a) * 18, r = G.canvas.getBoundingClientRect(), q = WorldZoom.toScreen(G.scene, wx, wy);
    return { x: r.left + q.x * G.cssPerUnit, y: r.top + q.y * G.cssPerUnit, wx, wy };
  },
  // テストの 近道: ながおしと おなじ ところへ なげる（world の px）／「つる」ボタンと おなじ
  fishCast(wx, wy) { return G.sceneName === "world" ? FishLine.aim(G.scene, wx, wy) : false; },
  fishPull() { return G.sceneName === "world" ? FishLine.pull(G.scene) : false; },
  // 釣り場の 水べ（歩いて 行ける マスと、水の ほうの 向き）。near [x, y] を わたすと その ちかくの 水べ（池が いくつも ある 町）
  fishShore(map = "town", near = null) {
    const m = Maps.get(map), d = MAP_DEFS[map], D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const npc = (x, y) => (d.npcs || []).some((n) => Math.abs(n.x - x) + Math.abs(n.y - y) < 2);
    let best = null, bd = Infinity;
    for (const [x, y] of TownFolk.reach(map).tiles) for (const [dir, [dx, dy]] of Object.entries(D)) if ((d.rows[y + dy] || "")[x + dx] === "~" && !m.warpAt(x, y) && !m.doorAt(x, y) && !npc(x, y)) {
      if (!near) return { x, y, dir };
      const n = Math.abs(x - near[0]) + Math.abs(y - near[1]); if (n < bd) { bd = n; best = { x, y, dir }; }
    }
    return best;
  },
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
  conversation() { return JSON.parse(JSON.stringify(Save.d.conversations)); },
  quizState() { return TownQuiz.state(); },
  quizStart(level) { return TownQuiz.start(level); },
  quizAnswer(index) { return TownQuiz.answer(index); },
  quizCancel() { return TownQuiz.cancel(); },
  folkLine(id) { const exchange = TownDialogue.describe(id, (TownFolk.last || {}).npc); if (exchange) return JSON.parse(JSON.stringify(exchange)); const D = typeof TOWNSFOLK_DATA !== "undefined" ? TOWNSFOLK_DATA : null; return D ? JSON.parse(JSON.stringify(D.lines.find(l => l.id === id) || D.react.find(l => l.id === id) || null)) : null; },
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
    if (lv) Save.d.shops[id].lv = U.clamp(lv, 1, 30);
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
  shopPrices() {return Object.fromEntries([['wear',WEAR_ITEMS],['furniture',FURNITURE],['wall',WALLPAPERS],['floor',FLOORS],['food',FOODS]].map(([kind,list])=>[kind,list.map(it=>({id:it.id,name:it.name,price:it.price,rare:!!it.rare}))]));},
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
    const out = { shop: sc.shopId, lv: sc.lv, workLv: sc.workLv, phase: sc.phase, n: sc.n, total: sc.total, ranks: [...(sc.ranks || [])], earn: sc.earn, tips: sc.tips, difficulty: sc.difficulty, dailyBoost: sc.dailyBoost, timeLimit: sc.timeLimit, timeLeft: sc.timeLeft, buttons: [], order: null, targets: [] };
    out.score = sc.stamp?.score ?? null;
    if (!t) return out;
    out.buttons = t.btns.filter((b) => !b.disabled).map((b) => ({ label: b.label || "", ...css(b.x + b.w / 2, b.y + b.h / 2) }));
    out.decorTier=ShopDecor.tier(sc.lv);
    if(sc.shopId==='burger')out.order={want:t.want.map(id=>sc.variant==='mac'?MacKitchen.name(id):BURGER_FILLINGS.find(f=>f.id===id).name),made:[...t.made]};
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

    // ころころ フルーツ: 箱（CSS の 座標と 1たんいの 大きさ）・玉・いまの 玉と つぎ・ちゅうもん
    if (sc.shopId === "korokoro") {
      const b = t.board, w = b.world, rim = css(b.bx, b.by);
      out.order = { want: t.want.map((x) => ({ tier: x.tier, name: KOROKORO_TIERS[x.tier].name, done: x.done })), held: b.held, next: b.next, aim: b.aim, cool: b.cool, canDrop: b.canDrop(), drops: b.drops,
        points: b.points, spills: b.spills, coins: b.coins, bonusTip: t.bonusTip, made: { ...b.made }, danger: w.danger, topGap: w.topGap, floorOpen: w.floorOpen,
        box: { x0: rim.cx, y0: rim.cy, unit: b.s * G.cssPerUnit, w: w.W, h: w.H, dropY: css(0, b.by - b.top / 2).cy },
        bodies: w.bodies.map((o) => ({ tier: o.tier, x: o.x, y: o.y, r: o.r, landed: o.landed, grow: o.grow, emo: b.emo(o), ...css(b.px(o.x), b.py(o.y)) })) };
    }
    if (sc.shopId === "relay") out.order = { target: t.target, caught: t.caught, misses: t.misses, lane: t.lane, role: t.role, shield: t.shield, items: t.items.map(it => ({ ...it, progress: (it.y - t.trackTop) / (t.trackBottom - t.trackTop) })) };
    if (typeof t.debug === "function") out.order = t.debug(css); // 新しい おてつだいは じぶんで ようすを かえす（ガソリンスタンド・ゆうびんきょく）
    return out;
  },
  // ころころ フルーツの 箱を ととのえる（テスト用・おてつだい中か スコア モードの とき）。bodies: [[だん, x, y], …]（箱の 単位: はば 100）
  koroSetup({ bodies = [], held = null, next = null, clear = true, seed = null, points = null } = {}) {
    const sc = G.scene, here = (G.sceneName === "shop" && sc.shopId === "korokoro") || G.sceneName === "koroscore";
    if (!here || !(sc.board instanceof KorokoroBoard)) throw new Error("koroSetup は ころころ フルーツの おてつだい中か スコア モードの ときだけ");
    const b = sc.board;
    if (clear) b.world.bodies = [];
    for (const [tier, x, y] of bodies) b.world.add(tier, x, y, { landed: true });
    if (seed != null) b.world.rng = (seed >>> 0) || 1; // つぎから おちてくる だんの ならびを きめる
    if (held != null) b.held = held;
    if (next != null) b.next = next;
    if (points != null) b.points = Math.max(0, Math.round(points)); // スコア（ハイスコアの ごほうびを ためす）
    b.cool = 0;
    return b.world.bodies.length;
  },
  // ころころ フルーツの スコア モードを はじめる（おわると ネリカスタウンの お店に もどる）。seed で おちてくる ならびを きめる
  koroScore({ seed = null } = {}) {
    const door = Maps.get("town").doors.find((d) => d.b.act.shop === "korokoro");
    Game.trans = null;
    Game.goto("koroscore", { back: door ? { map: "town", x: door.x, y: door.y + 1, dir: "down" } : { map: "town", x: 12, y: 21, dir: "down" }, seed }, "none");
    return !!door;
  },
  // スコア モードの ようす。座標は 画面の CSS ピクセル（box.x0 + x * box.unit で 箱の x）
  koro() {
    if (G.sceneName !== "koroscore") return null;
    const sc = G.scene, b = sc.board, w = b.world, cv = G.canvas.getBoundingClientRect();
    const css = (x, y) => ({ cx: Math.round(cv.left + x * G.cssPerUnit), cy: Math.round(cv.top + y * G.cssPerUnit) });
    const rect = (r) => r && { x: Math.round(cv.left + r.x * G.cssPerUnit), y: Math.round(cv.top + r.y * G.cssPerUnit), w: Math.round(r.w * G.cssPerUnit), h: Math.round(r.h * G.cssPerUnit) };
    const rim = css(b.bx, b.by);
    return { phase: sc.phase, score: b.points, hi: sc.st.hi || 0, hi0: sc.hi0, games: sc.st.games || 0, tops: (sc.st.tops || []).map((e) => ({ ...e })), recent: (sc.st.recent || []).map((e) => ({ ...e })), gifts: { ...(sc.st.gifts || {}) }, over: b.over, stopped: !!sc.stopped, paused: !!sc.recOpen, t: w.t,
      held: b.held, next: b.next, aim: b.aim, cool: b.cool, canDrop: b.canDrop(), drops: b.drops, merges: b.merges, made: { ...b.made }, danger: w.danger, topGap: w.topGap, overSec: w.overSec, dropKinds: KOROKORO_RULES.drop,
      box: { x0: rim.cx, y0: rim.cy, unit: b.s * G.cssPerUnit, w: w.W, h: w.H, dropY: css(0, b.by - b.top / 2).cy, rect: rect({ x: b.bx - 7, y: b.by - b.top, w: b.bw + 14, h: b.top + b.bh + 15 }) },
      row: rect(b.row), panel: rect(sc.panel), nextBox: rect(sc.nextBox), sign: rect(sc.signRect()), team: sc.team.map((t, i) => ({ id: t.id, emo: t.emo, face: sc.teamFace(t, i), ...css(sc.teamSpot(i).x, sc.infoY + sc.infoH - 3) })),
      bodies: w.bodies.map((o) => ({ tier: o.tier, x: o.x, y: o.y, r: o.r, landed: o.landed, grow: o.grow, over: o.over, emo: b.emo(o), ...css(b.px(o.x), b.py(o.y)) })) };
  },
  hour(h) {
    if (!PokaDebug._hourNow) PokaDebug._hourNow = U.hourNow;
    U.hourNow = h == null ? PokaDebug._hourNow : () => h;
  },
  // きょうの 日づけを きめる（U.today と おなじ "2026-10-5" の かたち。null で もとに もどす）。まいにち かわる けいじばん などを きまった 日で ためす
  today(day) {
    if (!PokaDebug._today) PokaDebug._today = U.today;
    U.today = day == null ? PokaDebug._today : () => String(day);
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
