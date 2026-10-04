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
  arcadeState(){const s=G.sceneName==='prize'?G.scene:null,r=s&&s.round;if(!r)return null;const R=r.rig,claw=CraneMachines.clawy(r.type),hb=r.type==='bridge'&&r.list()[0],hc=hb&&r.W.centroid(hb),hx=hb&&CranePhys.qrot(hb.q,[1,0,0]);return{bridge:r.type==='bridge'?{box:hc?{x:+hc[0].toFixed(2),y:+hc[1].toFixed(2),z:+hc[2].toFixed(2),along:+Math.abs(hx[2]).toFixed(2)}:null,hint:r.hint?r.hint.slice():null,staff:r.staff||null,snapped:!!r.snapped,shape:hb?hb.data.shape:null,miss:PrizeArcade.norm().miss[s.i]||0}:null,machine:s.i,type:r.type,phase:r.phase,done:r.done,finished:!!s.finished,got:r.got.length,time:claw?+r.time.toFixed(2):null,claw:claw?{x:+R.x.toFixed(2),y:+R.y.toFixed(2),z:+R.z.toFixed(2)}:null,stops:r.stops??null,scoops:r.scoops??null,arms:r.type==='tripod'?R.arms.map(a=>a.up?1:0):null,light:r.type==='tripod'?R.cell():null,strong:r.strong,camera:s.camMode,bodies:r.list().length,coins:Save.d.coins,status:s.status.textContent,pusher:r.type==='pusher'?{left:r.left,lost:r.lost,hits:r.hits,queue:r.queue,shower:r.shower,slot:r.slot?{res:r.slot.res.slice(),win:r.slot.win,paid:r.slot.paid}:null,lx:+R.lx.toFixed(2),gate:+R.gateX().toFixed(2)}:null,tako:r.def.plate?{filled:(r.filled||[]).map(v=>v?1:0).join(''),hits:r.def.plate.hits.slice(),balls:r.list().filter(b=>b.data.ball).length,onPlate:r.list().filter(b=>b.data.ball&&r.onPlate(r.W.centroid(b))).length,held:r.list().filter(b=>b.data.ball&&r.W.centroid(b)[1]>20).length,staff:r.staff||null,lim:R.o.lim.slice()}:null,barber:r.type==='barber'?{x:+R.x.toFixed(2),z:+R.z.toFixed(2),used1:R.used1,used2:R.used2,open:+R.open.toFixed(2),sharp:!!r.sharp,cut:r.lastCut||null,staff:r.staff||null,strings:r.list().filter(b=>b.pin).map(b=>{const c=r.W.centroid(b);return{sid:b.data.sid,slot:r.slotOf(b),shape:b.data.shape,x:+c[0].toFixed(2),z:+c[2].toFixed(2),fray:R.fray[b.data.sid]||0};}),falling:r.list().filter(b=>b.data.cut).length,miss:PrizeArcade.norm().miss[s.i]||0}:null,bound:r.type==='bound'?{ball:r.def.ball.c.slice(),home:[r.def.home.x,r.def.home.z],claw:[+R.x.toFixed(2),+R.z.toFixed(2)]}:null,
    // 3F の おかしの 台（UI-23）: おかし ロード（UI-29。ひかりの れつ・ランプ・のこり・とめた れつ・うごいて いる ベルトの のこり・れつごとの うごいた ながさ・おみせの 人）・おかし タワー（たって いるか・ペラわの わの ばしょ・おみせの 人）
    road:r.type==='road'?{at:R.at(),pos:+R.pos.toFixed(2),lit:r.lit.slice(),stops:r.stops,lane:r.lastLane??null,lastLit:r.lastLit??null,left:+R.left.toFixed(2),moved:R.moved.map(v=>+v.toFixed(2)),staff:r.staff||null}:null,
    tower:r.def.tower?(()=>{const pb=r.list().find(b=>b.data.pera),p=pb&&CraneMachines.toWorld(r.W,pb,pb.data.ring.slice(0,3));return{ok:r.towerOk(),ring:p?p.map(v=>+v.toFixed(2)):null,staff:r.staff||null,minY:r.def.minY};})():null};},
  // おかし ロード: ひかりを れつ lane へ（lit を わたすと その れつの ランプの かず も。ひかりが うごいて いる ときだけ）・おかし タワー: フックを ペラわの まうえへ（dx・dz cm ずらす）
  arcadeRoadAt(lane,lit){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='road'||r.phase!=='sweep'||!(lane>=0&&lane<r.def.lanes.n))return false;r.rig.pos=lane;r.rig.hold=lane;if(Number.isInteger(lit)&&lit>=0&&lit<=r.def.lanes.lamps)r.lit[lane]=lit;G.scene.refresh();return true;},
  arcadeAimRing(dx=0,dz=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||!r.def.tower||r.phase!=='move')return false;const pb=r.list().find(b=>b.data.pera);if(!pb)return false;const p=CraneMachines.toWorld(r.W,pb,pb.data.ring.slice(0,3));r.rig.load({x:p[0]+dx,z:p[2]+dz});return true;},
  // コイン プッシャー: ランチャーを x cm へ（うごかせる ときだけ）・チャンス（スロットを まわす）
  arcadePusherAt(x){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='pusher'||r.phase!=='play')return false;r.rig.lx=Math.max(r.rig.o.lim[0],Math.min(r.rig.o.lim[1],x));return true;},
  arcadeChance(){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='pusher')return false;r.chance();return true;},
  // ガチャガチャ（gacha.js）: gachaOpen シリーズの 台を ひらく・gachaNext つぎに でる 0〜3（3 が レア）・gachaFast えんしゅつの はやさ・gachaState ようす
  gachaOpen(i=0){if(typeof Gacha==='undefined'||!Gacha.SERIES[i])return false;Gacha.open(i);return true;},
  gachaNext(k){if(!(k>=0&&k<4))return false;Gacha.next=k;return true;},
  gachaFast(k=1){Gacha.speed=Math.max(1,Math.min(20,k));return true;},
  gachaState(){const v=Gacha.view,g=Gacha.st();return{open:!!document.querySelector('.modal-wrap:not(.out) .gacha'),phase:v?v.phase:null,series:v?v.S.id:null,last:v&&v.last?{id:v.last.item.id,k:v.last.k,rare:v.last.rare,first:v.last.first,refund:v.last.refund,complete:v.last.complete,note:v.last.note||'',price:v.last.price}:null,plays:g.plays,got:{...g.got},done:{...g.done},coins:Save.d.coins};},
  // ガチャガチャの もり（gacha-forest.js・UI-52）: 4F の 18シリーズ（ばんごう・しゅるい）・4F の 台の ならび・スクイーズの 家具
  // シールちょう（sticker-book.js・UI-53）: stickers ようす（てもと・もらった かず・ページ・4F の 台）・stickerGive シールを もらう・stickerUi ひらいて いる ページと えらんで いる シール
  stickers(){if(typeof StickerBook==='undefined')return null;const s=StickerBook.st(),f4=VenueHalls.defs.arcade.floors[4];return{have:{...s.have},got:{...s.got},pages:s.pages.map(p=>({bg:p.bg,list:p.s.map(x=>x.slice())})),designs:StickerBook.DESIGNS.map(d=>d.id),rare:StickerBook.DESIGNS.filter(d=>d.rare).map(d=>d.id),series:StickerBook.SERIES.map(S=>({id:S.id,index:S.index,name:S.name,price:Gacha.priceOf(S.index),sheets:S.list.map(it=>({id:it.id,stickers:it.stickers.map(x=>x.slice())}))})),machines:f4?f4.fixtures.filter(f=>f.kind==='gacha'&&StickerBook.isSticker(f.series)).map(f=>({series:f.series,x:f.x,y:f.y,label:f.label||''})):[]};},
  stickerGive(id,n=1){if(typeof StickerBook==='undefined')return false;const ok=StickerBook.add(id,n);if(ok)Save.write();return ok;},
  stickerUi(){if(typeof StickerBook==='undefined')return null;const pg=document.querySelector('.stk-page');return{open:!!pg,page:StickerBook.ui.page,sel:StickerBook.ui.sel,rect:pg?(r=>({x:r.left,y:r.top,w:r.width,h:r.height}))(pg.getBoundingClientRect()):null};},
  // いちばんくじ（ichiban-kuji.js・UI-55）: kuji ようす（ロット・のこり・はりつけ ひょう・はんけん・ダブルチャンス・クーポン・もらった けいひん）・kujiOpen ボードを ひらく・
  // kujiNext つぎに ひく 賞（'A'〜'I'）・kujiLeft のこりを n まいに（ほかの おきゃくさんが ひいた ことに）・kujiDays n にち たった ことに（ロットの 日づけを まえへ）・
  // kujiDc つぎの ダブルチャンスの けっか・kujiFast えんしゅつの はやさ・kujiUi がめんの ようす
  kuji(s='lawson'){if(typeof IchibanKuji==='undefined'||!IchibanKuji.has(s))return null;const K=IchibanKuji,d=K.st(),L=K.lot(s),S=K.BY[s];return{store:s,price:K.PRICE,lot:L.no,left:K.total(s),total:S.total,tickets:K.tickets(s),byId:{...L.left},hold:{...L.hold},log:L.log.map(x=>x.slice()),others:L.others,mine:L.mine,seen:L.seen,sold:L.sold,news:L.news?{...L.news}:null,stubs:d.stubs[s]||0,dc:d.dc[s]?{...d.dc[s]}:null,dcLast:d.dcLast[s]?{...d.dcLast[s]}:null,coupons:K.coupons(s).map(c=>({id:c.id,n:c.n,item:c.item.item})),got:S.lineup.filter(id=>K.got(id)>0),lineup:S.lineup.slice(),ids:Object.fromEntries(K.GRADES.map(g=>[g,S.ids[g].slice()])),lastId:S.lastId,dcId:S.dcId,complete:K.complete(s),done:d.done[s]||null,pending:K.pendingOf(s).map(p=>p[1]),draws:d.draws,spent:d.spent};},
  kujiOpen(s='lawson'){if(typeof KujiUI==='undefined'||!IchibanKuji.has(s))return false;KujiUI.open(s,G.sceneName==='store'?G.scene:null);return true;},
  kujiNext(g){if(typeof IchibanKuji==='undefined'||!IchibanKuji.GRADES.includes(g))return false;IchibanKuji.next=g;return true;},
  kujiLeft(s='lawson',n=1){if(typeof IchibanKuji==='undefined'||!IchibanKuji.has(s)||!(n>=0))return null;const K=IchibanKuji;K.sync(s);while(K.total(s)>n&&K.drawOne(s,'other'));Save.write();return K.total(s);},
  kujiDays(s='lawson',n=1){if(typeof IchibanKuji==='undefined'||!IchibanKuji.has(s)||!(n>0))return false;const K=IchibanKuji,d=K.st(),L=K.lot(s),fmt=no=>{const t=new Date(no*864e5);return t.getUTCFullYear()+'-'+(t.getUTCMonth()+1)+'-'+t.getUTCDate();},back=v=>v?fmt(K.dayNo(v)-n):v;L.seen=back(L.seen);L.sold=back(L.sold);if(L.news)L.news.day=back(L.news.day);if(d.dc[s])d.dc[s].day=back(d.dc[s].day);Save.write();return true;},
  kujiDc(win=true){if(typeof IchibanKuji==='undefined')return false;IchibanKuji.dcNext=!!win;return true;},
  kujiFast(k=1){if(typeof KujiUI==='undefined')return false;KujiUI.ui.speed=Math.max(1,Math.min(20,k));return true;},
  kujiUi(){if(typeof KujiUI==='undefined')return null;const v=KujiUI.view;return{open:!!(v.open&&document.querySelector('.modal-wrap:not(.out) .kuji')),store:v.store,phase:v.phase,tickets:v.tickets.map(t=>({g:t.g,id:t.id,pick:t.pick,last:t.last,open:t.open})),results:v.results.slice(),dc:v.dc?{...v.dc}:null};},
  // ガチャガチャの もり（4F）: series は もりの ぜんぶの シリーズ（12〜29 と UI-62 の 33〜38・more）・machines は いまの しゅうに 台に はいって いる 18
  gachaForest(){if(typeof GachaForest==='undefined')return null;if(typeof MeeRotation!=='undefined')MeeRotation.apply();const f4=VenueHalls.defs.arcade.floors[4],all=[...GachaForest.SERIES,...(typeof GachaForestMore!=='undefined'?GachaForestMore.SERIES:[])];return{first:GachaForest.first,series:all.map(S=>({id:S.id,index:S.index,name:S.name,kind:S.kind,hand:!!S.hand,squish:!!S.squish,more:!!S.more,rare:S.list[Gacha.RARE].id})),machines:f4?f4.fixtures.filter(f=>f.kind==='gacha'&&Gacha.SERIES[f.series]&&Gacha.SERIES[f.series].forest).map(f=>f.series):[],squish:[...GachaForest.SQUISH]};},
  // ガチャの しゅうがわり（js/mee-rotation.js・UI-62）: day の しゅうの わごとの 台（slot・シリーズ・fresh・leaving）と やすみ（day なしで きょう。calendar() で かわる）
  meeRotation(day){return typeof MeeRotation==='undefined'?null:MeeRotation.info(day||undefined);},
  // いまの かいの その シリーズの ガチャの 台まで あるいて まわす（id: "machi3" など。台に いなければ false）
  // へいせい じょじ ふうの ガチャ（js/gacha-heisei.js・UI-79）: 4シリーズの ばんごう・くみ・けいひん と、こんしゅう 台に でて いるか
  // 英語（あたまの たいそう・UI-82。js/mg-english.js）: セーブの ようす（さいごの レベル・あそびかた・かず・ベスト・さいきんの 問題の かず）と 問題の かず
  english(){if(typeof EnglishGame==='undefined')return null;const E=EnglishGame.state();return{lv:E.lv,mode:E.mode,plays:{...E.plays},best:{...E.best},recent:Object.fromEntries(Object.entries(E.recent).map(([k,v])=>[k,v.length])),words:{jh:ENG_WORDS.jh.length,hs:ENG_WORDS.hs.length},fill:{jh:ENG_FILL.jh.length,hs:ENG_FILL.hs.length}};},
  // コンビニの しなぞろえ（UI-84。js/conbini-goods.js）: しなもの・タブ・もとの ねだん・コンビニの ねだん（×1.5）
  conbini(shop='lawson'){if(typeof ConbiniGoods==='undefined'||!ConbiniGoods.LINEUP[shop])return null;return{shop,mul:ConbiniGoods.MUL,tabs:ConbiniGoods.TABS.map(t=>t[0]),goods:BUY_SHOPS[shop].items().map(it=>({id:it.id,name:it.name,tab:ConbiniGoods.tabOf(shop,it.id),base:it.basePrice,price:it.price}))};},
  // コンビニの ポイントカード（UI-85。js/conbini-card.js）: カード・チケット・ていきけん・オーナーの ようす。
  // set { has, pts, carry, owner: true/false, tickets: { crane, lv10, lv25 }, busUntil: "2027-4-3" } で きめる（pts を きめると カードも つくる）
  conbiniCard(shop='lawson',set=null){if(typeof ConbiniCard==='undefined'||!ConbiniCard.card(shop))return null;const C=ConbiniCard,d=C.st(),c=d.shops[shop],n=(v)=>Math.max(0,Math.floor(Number(v)||0));
    if(set){if(set.has!=null)c.has=!!set.has;if(set.pts!=null){c.has=true;c.pts=n(set.pts);}if(set.carry!=null)c.carry=Math.min(C.PER-1,n(set.carry));if(set.owner!=null)c.owner=set.owner?U.today():'';if(set.tickets)for(const[k,v]of Object.entries(set.tickets))if(d.tickets[k]!==undefined)d.tickets[k]=n(v);if(set.busUntil!=null)d.bus.until=String(set.busUntil);Save.mark();Save.write();}
    const g=BUY_SHOPS[shop].items().find(i=>i.id===(shop==='lawson'?'karaage':'oden')),v=C.view&&C.view.shop===shop&&document.querySelector('.modal-wrap:not(.out) .cc-wrap');
    return{shop,name:C.cardName(shop),has:c.has,pts:c.pts,carry:c.carry,total:c.total,used:c.used,spent:c.spent,owner:!!c.owner,got:{...c.got},tickets:{...d.tickets},bus:{until:d.bus.until,free:C.busFree(),text:C.busText()},hello:BUY_SHOPS[shop].hello[0],sample:g?{id:g.id,price:g.price,base:g.basePrice}:null,prizes:C.prizes(shop).map(p=>({id:p.id,cost:p.cost,can:c.has&&c.pts>=p.cost&&!(p.id==='owner'&&c.owner),...(p.kinds?{kinds:p.kinds.map(k=>({id:k,name:p.kindName(k),have:p.have(k)}))}:{})})),kindsOpen:[...document.querySelectorAll('.modal-wrap:not(.out) .cc-kind')].map(b=>b.dataset.kind),open:!!v,rows:v?[...v.querySelectorAll('.cc-prize')].map(r=>({id:r.dataset.id,can:r.classList.contains('can'),done:r.classList.contains('done'),name:r.querySelector('b').textContent})):[]};},
  // ナンプレ（パズル こうぼう・UI-81。js/mg-numpla.js）: セーブの ようす（さいごの 難しさ・だした かず・クリア・ベスト・とちゅうの 問題）
  numpla(){if(typeof Numpla==='undefined')return null;const N=Numpla.state(),c=N.cont;return{lv:N.lv,n:{...N.n},clear:{...N.clear},best:{...N.best},cont:c?{lv:c.lv,used:c.used,miss:c.miss||0,hint:c.hint||0,filled:[...c.v].filter((ch,i)=>ch!=='.'&&c.p[i]==='.').length,valid:Numpla.validCont(c)}:null,bank:Object.fromEntries(Object.entries(NUMPLA_BANK).map(([k,v])=>[k,v.length]))};},
  // あそんで いる ナンプレの あきマス（まちがいも）を 正しい 数字で うめる。leave マス だけ のこす（テストを みじかく する）。のこした かずを かえす
  numplaFill(leave=1){const t=G.sceneName==='shop'&&G.scene.task;if(typeof NumplaTask==='undefined'||!(t instanceof NumplaTask)||t.done)return -1;const todo=t.val.map((v,i)=>(v===t.sol[i]?-1:i)).filter((i)=>i>=0),k=Math.max(0,todo.length-Math.max(0,leave));for(const i of todo.slice(0,k)){t.val[i]=t.sol[i];t.memo[i]=0;}t.refresh();t.save();if(t.filled()>=t.blank)t.complete();return todo.length-k;},
  gachaHeiseiMore(){if(typeof GachaHeiseiMore==='undefined')return null;const st=GachaHeiseiMore.state();if(typeof MeeRotation!=='undefined')for(const s of st.series){const x=MeeRotation.stateOf(s.index);s.on=!!x;s.fresh=!!(x&&x.fresh);s.debut=!!(x&&x.debut);}return st;},
  gachaHeisei(){if(typeof GachaHeisei==='undefined')return null;const st=GachaHeisei.state();if(typeof MeeRotation!=='undefined')for(const s of st.series){const x=MeeRotation.stateOf(s.index);s.on=!!x;s.fresh=!!(x&&x.fresh);s.debut=!!(x&&x.debut);}return st;},
  gachaVisit(id){if(G.sceneName!=='venue'||typeof Gacha==='undefined')return false;const S=Gacha.byId(id);if(!S)return false;const f=G.scene.fixtures.find(f=>f.kind==='gacha'&&f.series===S.index);return !!f&&G.scene.request(f);},
  // すいぞくかんの おみやげ（aqua-gifts.js）: しなもの（ねだん・もって いる かず）・12F の 台と レジ・ずかんの ヒント
  aquaGifts(){if(typeof AquaGifts==='undefined')return null;const own=(id)=>AquaGifts.INDEX[id].slot?!!Save.d.wardrobe[id]:(Save.d.furn[id]||0),fx=VenueHalls.defs.mall.floors[12].fixtures.filter(f=>f.shopId===AquaGifts.SHOP);return{shop:AquaGifts.SHOP,figs:AquaGifts.FIGS.map(f=>({id:f.id,name:f.name,price:f.price,own:own(f.id)})),goods:AquaGifts.GOODS.map(g=>({id:g.id,name:g.name,price:g.price,kind:g.kind,slot:g.slot||null,own:own(g.id)})),stands:fx.filter(f=>f.action==='buy').map(f=>f.item),register:fx.some(f=>f.kind==='register'&&f.action==='shop'),source:ItemDexSources.source('furn',FURN_INDEX.aqfig_penguin)};},
  // フィギュア台（figure-stand.js）: いまの へやの だい（figs）・かざれる フィギュア・もって いて おいて いない かず・いごこち・画面
  figStand(){if(typeof FigureStand==='undefined')return null;const own=FigureStand.figures().filter(id=>(Save.d.furn[id]||0)>0),v=FigureStand.view;return{stands:(Save.d.room.items||[]).filter(it=>FigureStand.isStand(it.id)).map(it=>({uid:it.uid,id:it.id,figs:FigureStand.figsOf(it)})),figures:FigureStand.figures().length,own:own.length,free:Object.fromEntries(own.map(id=>[id,Room.available(id)])),comfort:Room.comfort(),open:!!document.querySelector('.modal-wrap:not(.out) .figst'),pick:!!(v&&v.pick&&v.pick.m.el.isConnected&&!v.pick.m.el.closest('.out'))};},
  // こういしつ（mee-fitting.js）: fitting かりて いる いしょうの かず・まえの ふくの きろく・3人の ふく
  fitting(){return{count:MeeFitting.count(),rental:JSON.parse(JSON.stringify(MeeFitting.st())),outfits:Object.fromEntries(Chara.IDS.map(id=>[id,{...Save.d.chars[id].outfit}])),ids:MeeRentalWear.IDS.slice(),open:!!document.querySelector('.modal-wrap:not(.out) .dress-extra, .modal-wrap:not(.out).dress-extra')};},
  // ぷりくら（purikura.js）: puriState いまの ようす（らくがきの pick・items・handles・itemsCss は UI-25。bg は いま うつる はいけい・slot えらんで いる まい・shotBgs 4まいの はいけいは UI-87）・puriStart(ブース) 300コインで はじめる（Meeときょれじゃ 3F の その ブースの まえに もどる）・puriFast カウントダウンの はやさ・photos しゃしんの いちらん
  puriState(){const s=G.sceneName==='purikura'&&G.scene instanceof PurikuraScene&&Array.isArray(G.scene.deco)?G.scene:null;if(!s)return null;const v=s.view,d=s.deco.map(x=>({p:x.p.length,pts:x.p.reduce((a,q)=>a+q.pts.length,0),s:x.s.length,x:x.x.length,e:(x.e||[]).length}));return{phase:s.phase,booth:s.booth.id,bgs:s.booth.bgs.slice(),words:s.words.slice(),bg:s.curBg(),slot:s.slot,shotBgs:s.bgs.slice(),z:s.z,who:s.who,tab:s.tab,tool:s.tool,shots:s.shots.length,sel:JSON.parse(JSON.stringify(s.sel)),shotSel:s.shots.map(x=>({c:x.c,z:x.z,bg:x.bg})),di:s.di,deco:d,count:s.count?s.count.n:null,saved:s.saved,active:Save.d.purikura.active,photos:Save.d.photos.length,coins:Save.d.coins,view:v&&{x:v.x,y:v.y,w:v.w,h:v.h},pos:s.pos&&JSON.parse(JSON.stringify(s.pos)),pick:s.pickItem?(s.pickItem()&&{k:s.pick.k,j:s.pick.j}):null,items:s.deco[s.di]?JSON.parse(JSON.stringify({s:s.deco[s.di].s,x:s.deco[s.di].x,e:s.deco[s.di].e||[]})):null,...(()=>{if(!v)return{viewCss:null,spots:null,handles:null,itemsCss:null};const u=G.cssPerUnit||1,rc=G.canvas.getBoundingClientRect(),k=v.w/Purikura.PW,L=PurikuraArt.LAYOUT[s.z?1:0],css=(x,y)=>({x:+(rc.left+x*u).toFixed(1),y:+(rc.top+y*u).toFixed(1)}),cur=s.deco[s.di];return{viewCss:{x:rc.left+v.x*u,y:rc.top+v.y*u,w:v.w*u,h:v.h*u},handles:s.phase==='deco'&&s.handles?Object.fromEntries(s.handles().map(h=>[h.id,css(h.x,h.y)])):null,itemsCss:s.phase==='deco'&&cur?{s:cur.s.map(a=>css(v.x+a[1]*k,v.y+a[2]*k)),x:cur.x.map(a=>css(v.x+a[1]*k,v.y+a[2]*k))}:null,spots:s.phase==='shoot'?Object.fromEntries(PurikuraArt.placed(s.photoOf(null,null)).map(q=>[q.id,{x:+(rc.left+(v.x+q.x*k)*u).toFixed(1),y:+(rc.top+(v.y+(q.y-L.S*0.45)*k)*u).toFixed(1)}])):null};})()};},
  puriStart(booth='yume'){const b=MAP_DEFS.city.buildings.find(b=>b.id==='ike_arcade'),f=VenueHalls.defs.arcade.floors[3].fixtures.find(f=>f.booth===booth);if(!f||!Purikura.BOOTH[booth])return false;const back={venue:'arcade',floor:3,back:{map:'city',x:b.x+b.door,y:b.y+b.h,dir:'down'},at:f.spots[0]};if(!Save.d.purikura.active&&!Purikura.pay())return false;Game.goto('purikura',{back,booth},'none');return true;},
  puriFast(k=1){if(G.sceneName!=='purikura')return false;G.scene.speed=Math.max(1,Math.min(8,k));return true;},
  photos(){return Purikura.list().map(p=>({id:p.id,bg:p.bg,k:p.k,z:p.z,c:p.c,o:Object.fromEntries(Object.entries(p.o).map(([id,v])=>[id,{...v[0]}])),p:p.d.p.length,s:p.d.s.length,x:p.d.x.map(t=>t[0]),m:p.m||null,st:p.d.s,xt:p.d.x,e:p.d.e||[]}));},
  // 台の ある 階へ もどる（2F の おかし キャッチャーは 2F の 台の まえ）
  // pay: "coin"（100コイン）・"ticket"（クレーン チケット。js/conbini-card.js・UI-85）
  arcadeStart(machine=0,pay='coin'){const run=PrizeArcade.start(machine,this.arcadeBack(machine),pay);if(run)Game.goto('prize',{run},'none');return !!run;},
  // 台の まど（あそびかたと「○コインで あそぶ」・チケットが あれば「チケットで あそぶ」）を ひらく。もどりさきは その台の まえ
  arcadeOpen(machine=0){if(!PrizeArcade.machines[machine])return false;PrizeArcade.open(machine,this.arcadeBack(machine));return true;},
  arcadeBack(machine){const b=MAP_DEFS.city.buildings.find(b=>b.id==='ike_arcade'),fl=IkeArcade.floorOf(machine),f=VenueHalls.defs.arcade.floors[fl].fixtures.find(f=>f.machine===machine);return{venue:'arcade',floor:fl,back:{map:'city',x:b.x+b.door,y:b.y+b.h,dir:'down'},...(fl>1&&f?{at:f.spots[0]}:{})};},
  // 日がわりの 台の その日の けいひん（day: "2026-10-1" の かたち・なしで その台の いまの 日〔PrizeArcade.dayOf〕。calendar("2026-10-01") でも かわる）。text: 台の せつめいの よびかた・keep: とれるまで かわらない 台
  // season: 3人の 台の きせつの ぬいぐるみ（UI-63。その きせつの いま めだまの けいひんの id）・note: 台の せつめいの ひとこと
  arcadeLineup(machine=12,day){const d=CraneMachines.DEFS[machine];if(!d||!d.pool)return null;const dd=day||PrizeArcade.dayOf(machine),prizes=PrizeArcade.prizeList(machine,dd),se=d.season?ArcadePrizes.seasonal(d.season,dd):null;return {day:dd,shapes:CraneMachines.lineup(d,dd),prizes,names:prizes.map(id=>PrizeArcade.item(id).name),text:PrizeArcade.todayText(machine,dd),keep:!!d.keep,season:se?se.id:null,note:PrizeArcade.seasonNote(machine,dd)};},
  // はしわたし: はずれの かず（おみせの ひとの たすけは PrizeArcade.ASSIST かい）・アームを しるしから dx・dz cm へ
  // 4F（UI-54）。arcadeTako(k): たこやきの あな k の まうえに ピンポンだまを 1こ（テスト用）・arcadeBarber(slot, dx, dz): バーバーカットの ハサミを その ひもの dx・dz cm てまえへ（②の ばん）
  arcadeTako(k=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||!r.def.plate||r.done)return false;const h=r.def.plate.holes[k];if(!h)return false;r.add('pingpong',[h[0],r.def.plate.top+6,h[1]],[1,0,0,0]);return true;},
  arcadeBarber(slot=1,dx=0,dz=-2){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='barber'||(r.phase!=='right'&&r.phase!=='back'))return false;const b=r.list().find(b=>b.pin&&r.slotOf(b)===slot);if(!b)return false;const c=r.W.centroid(b),C=r.def.cut;r.rig.x=Math.max(C.lim[0],Math.min(C.lim[1],c[0]+dx));r.rig.z=Math.max(C.lim[2],Math.min(C.lim[3],c[2]+dz));r.rig.used1=true;if(r.phase==='right')r.go('back');G.scene.refresh();return true;},
  arcadeMiss(machine,n){const a=PrizeArcade.norm();a.miss[machine]=Math.max(0,n|0);Save.write();return a.miss[machine];},
  arcadeHint(dx=0,dz=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.phase!=='move'||!r.hint)return false;r.rig.load({x:r.hint[0]+dx,z:r.hint[1]+dz});return true;},
  arcadeMove(dx,dz){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.phase!=='move')return false;r.rig.load({x:r.rig.x+dx,z:r.rig.z+dz});return true;},
  arcadeDrop(){if(G.sceneName!=='prize')return false;const r=G.scene.round;G.scene.press(r.type==='sweet'&&r.phase==='swing2'?1:0);return true;},
  // テスト用: アームを 景品の 上へ（i: 景品の じゅんばん。リングの 台は リングの まえ）・アームの つよさ・はやおくり・カメラ
  arcadeAim(i=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.phase!=='move')return false;const b=r.list()[i];if(!b)return false;const p=b.data.ring?CraneMachines.toWorld(r.W,b,b.data.ring.slice(0,3)):r.W.centroid(b);r.rig.load({x:p[0],z:p[2]});return true;},
  arcadeLuck(strong=true){const r=G.sceneName==='prize'&&G.scene.round;if(!r)return false;r.strong=!!strong;r.rig.power=strong||r.type==='ring'?1:0.34;G.scene.run.strong=!!strong;return true;},
  arcadeFast(k=1){if(G.sceneName!=='prize')return false;G.scene.speed=Math.max(1,Math.min(8,k));return true;},
  arcadeLight(cell=0){const r=G.sceneName==='prize'&&G.scene.round;if(!r||r.type!=='tripod')return false;r.rig.light=cell+0.3;return true;},
  arcadeCam(mode){if(G.sceneName!=='prize')return false;if(G.scene.camMode!==mode)G.scene.toggleCam();return G.scene.camMode;},
  mamaWork(){return MamaSchedule.working();},
  venue(id='school',floor){const has=b=>b.act.venue===id||(b.act.type==='indoor'&&b.act.map===id&&!!VenueHalls.defs[id]);const b=MAP_DEFS.town.buildings.find(has)||MAP_DEFS.city.buildings.find(has);if(!b)return false;Game.goto('venue',{venue:id,floor,back:{map:MAP_DEFS.town.buildings.includes(b)?'town':'city',x:b.x+b.door,y:b.y+b.h,dir:'down'}},'none');return true;},
  venueState(){if(G.sceneName!=='venue'||!G.scene?.room)return null;const sc=G.scene;return {id:sc.id,floor:sc.floor,name:sc.def.name,changingFloor:sc.lift>0,party:sc.party.map(p=>({x:p.x,y:p.y})),fixtures:sc.fixtures.map(f=>({...f,screen:sc.screen(f.x+f.w/2-.5,f.y+f.h-1)})),coins:Save.d.coins,walkable:sc.room.w*sc.room.h,routeCount:sc.fixtures.filter(f=>f.action).map(f=>({label:f.label,reachable:Array.from({length:f.h+2},(_,j)=>Array.from({length:f.w+2},(_,i)=>sc.route(f.x-1+i,f.y-1+j)!==null)).flat().some(Boolean)}))};},
  indoorState(){
    if(!['store','venue'].includes(G.sceneName)||!G.scene?.party)return null;
    const sc=G.scene,l=sc.party[0],r=G.canvas.getBoundingClientRect(),u=G.cssPerUnit;
    const screen=(x,y)=>{const p=sc.screen(x,y);return{x:r.left+p.x*u,y:r.top+p.y*u};},at=screen(l.tx,l.ty);
    return {scene:G.sceneName,iso:!!sc.iso,floor:sc.floor,joy:!!sc.joy,path:sc.path.length,pending:!!sc.pending,
      party:sc.party.map(p=>({x:p.tx,y:p.ty,moving:p.moving})),
      directions:Object.entries(DIRS).map(([key,[dx,dy]])=>{let free=0;while(free<80&&sc.walkable(l.tx+dx*(free+1),l.ty+dy*(free+1)))free++;const q=screen(l.tx+dx,l.ty+dy);return{key,dx,dy,free,screen:q,vector:{x:q.x-at.x,y:q.y-at.y}};})};
  },
  // ごはんの せき（O7・UI-72）: 3人が すわって いる テーブル・すわる ところ・おさら（すわって いない ときは null）
  dine(){return G.sceneName==='venue'&&typeof DineSeats!=='undefined'?DineSeats.state(G.scene):null;},
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
  // UI-13: すまほ の「ちず」→「この エリア」の ようす（ひらいて いない ときは null）
  areaMap() { return typeof AreaMap === "undefined" ? null : AreaMap.state(); },
  // UI-13: エリアの ちずの なまえの ならび（ブラウザ なしと おなじ 計算。k は 1マスの px）
  areaMapLayout(id = "town", k = 4.46) { const m = AreaMap.model(id, null), L = AreaMap.layout(m, k); return { places: m.places.length, labels: L.labels.length, hidden: L.hidden.map((key) => m.places.find((p) => p.key === key).name), streets: L.streets.map((t) => t.name) }; },
  station(id) { if(!Transit.stops[id]||UI.busy)return false;Transit.open(id);return true; },

  help() {
    const lines = [
      "PokaDebug.state()                     いまのシーン・マップ・コインなど",
      "PokaDebug.idle()                      画面切り替え中・会話中でなければ true",
      "PokaDebug.newGame({ goji: 'soft' })   オープニングを飛ばして はじめから（おうちへ）",
      "PokaDebug.teleport('meadow', 14, 3)   マップの (x, y) へ移動（town/city/coast/meadow/forest/cave）",
      "PokaDebug.clearFoes()                 いまの マップの てきを けす（テスト用・ボスは のこす）",
      "PokaDebug.water('coast', 30, 10)   水の かたまりの しゅるい（川・海・湖）・岸・その マスの 色",
      "PokaDebug.cast('town_walker0')   町の人の 名前・種・見た目（id なしで 全員の ようす）",
      "PokaDebug.house()                     おうちへ",
      "PokaDebug.worldZoom(0.5)              町の ズーム（0.5〜1.5・なしで ようす・第2引数 true で ゆっくり）。worldPoint(x, y) で マスの 画面の 位置",
      "PokaDebug.homeDoors()                 おうちの ドア（おでかけ・おへや・おにわの うらぐち）の 画面の ばしょと いける へや",
      "PokaDebug.toilet()                    おトイレ（3人の いきたさ・ドアの ばしょ・はいって いる 子）。toiletNeed('goji', 80) で いきたさを きめる",
      "PokaDebug.homeFloor()                 おうちの 2かい（かいだん・1かいと 2かいの 画面の ばしょ・かたち polys・のぼって いるか）",
      "PokaDebug.homeNav()                   おうちの みち（家具の 足もと・ふさいだ マス・3人と ぱぱ ままの いち・いきさき・みち）。homeWalk('goji', 300, 400) で あるかせる",
      "PokaDebug.exterior()                  おうちの そと（パーツ・ペンキ・もって いる もの・町の 絵の キー・かう がめん）。exteriorSet({ roof: 'steep' }, { wall: 'sora' }) で つける",
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
      "PokaDebug.furnTray()                  もようがえの 一覧（ひろさ s/m/l・しゅるい・ならび・さがす ことば・カードの かず と れつ・しゅるいの ボタン）",
      "PokaDebug.furnDaily()                 かぐやさんの ひがわり（2にちごとに かわる ゆかの かぐ 2つ・かべかざり 2つ・あと なんにち）",
      "PokaDebug.furnTraySize('l')           もようがえの 一覧の ひろさを かえる（'s' ちいさい・'m' はんぶん・'l' ほぼ ぜんぶ）",
      "PokaDebug.battle([{ kind: 'purun', lv: 2 }], 'meadow')  バトル開始",
      "PokaDebug.battleState()                属性・HP・状態・技・曲を読む",
      "PokaDebug.battleFixture({ hp: 1, condition: 'fire' })  コマンド待ち中に戦闘の状態を再現",
      "PokaDebug.music('town' | null)          曲を試聴/停止。引数なしで音の状態",
      "PokaDebug.musicCatalog()               曲名・楽器・小節数の一覧",
      "await PokaDebug.musicRender('town', 8)  同じ音源でオフライン合成・音量/負荷を検証（4つめ = はじめる トークン）",
      "PokaDebug.arcadeMusic()     Meeときょれじゃ の J-POP（いまの 曲・再生リスト）。'skip' で つぎの 曲",
      "PokaDebug.shop('crepe', 3)            お店ミニゲームを Lv3 で開始",
      "PokaDebug.shop('brain', 2, 'pair')    あたまの たいそうを ゲーム（spot・pair・math）を きめて 開始",
      "PokaDebug.shop('kobo', 3, 'logic')    パズル こうぼうを ゲーム（slide・shape・logic）を きめて 開始",
      "PokaDebug.shopCap('crepe', 19950)     おみせで きょう もらった コインの きろく（じょうげんは なし・UI-83）を きめる・ようす",
      "PokaDebug.mgFinish(100)               いまの おきゃくさんを その てんすうで おわらせる",
      "PokaDebug.koroSetup({bodies:[[3,40,100],[3,60,100]]}) ころころ フルーツの 箱に 玉を おく（seed・held・next も。スコア モードでも）",
      "PokaDebug.koroScore({ seed: 1 })     ころころ フルーツの スコア モードを はじめる（お店の まえに もどる）",
      "PokaDebug.koro()                      スコア モードの ようす（スコア・ハイスコア・さいきんの きろく・もらった とくべつな かぐ・きろくの まどで とまって いるか・箱の CSS 座標・玉・つぎ・おしまい）",
      "PokaDebug.collab('korokoro')          コラボ グッズの つみたて・もらった もの・つぎ（'puzzle' も）",
      "PokaDebug.aquaGifts()                 すいぞくかんの おみやげ（フィギュア 10・コラボ 5・ねだん・もって いる かず・12F の 台・ずかんの ヒント）",
      "PokaDebug.figStand()                  フィギュア台（へやの だいと かざった フィギュア・のこりの かず・いごこち・かざる 画面が ひらいて いるか）",
      "PokaDebug.burgerMenu()                バーガーやさんの メニュー（4つの タブ）・にこにこ セットの おまけの おもちゃ（6しゅ・もって いる かず）",
      "PokaDebug.shopGoods('cake')           おみせの しなぞろえ（タブ・しなものの id・かず。'crepe'・'bakery'・'korokoro'・'gasstand'・'groom'・'florist'・'mall'〔サンシャインいけぶの メニュー〕）",
      "PokaDebug.foodBalance()               たべものの バランス（そのままの やさい・りょうりと ざいりょうの ごうけい・ねだんで ごきげんを あげた もの）",
      "PokaDebug.fashion()                   ファッションショー（うけつけ・テーマ・3人の おしゃれ レベル・ランク・けいひん・しゃしん）",
      "PokaDebug.fashionGo([13, 2])          ファッションかん（ファッションショーの 会場）へ（at: たつ マス）",
      "PokaDebug.fashionStart()              ショーを はじめる（うけつけが まだ なら さんかひを はらう）",
      "PokaDebug.fashionAuto(0.02)           カメラの わが かさなって から 0.02びょうで じどうで おす（null で やめる）",
      "PokaDebug.fashionSpeed(4)             ショーを 4ばいで すすめる",
      "PokaDebug.fashionTheme('kawaii')      きょうの テーマを きめる（null で 日がわりに もどす）",
      "PokaDebug.fashionScene()              ランウェイの ようす（だんかい・いま あるく 人・カメラの わ・はんてい・しんさ・けっか）",
      "PokaDebug.fashionPress()              「ポーズ！」を おす（いまの じこくで はんてい）",
      "PokaDebug.store('clothes', 'town')    歩ける店内へ（入口のある町を選べる）",
      "PokaDebug.storeState()                店員・展示・通路・3人・出口の状態",
      "PokaDebug.storeWalkTo(5, 3)           店内のマスまで実際に歩く",
      "PokaDebug.coins(1000)                 コインを足す",
      "PokaDebug.level(16)                   3人のレベルを設定して全回復",
      "PokaDebug.unlockAll()                 服（5こずつ）・家具・壁紙・床を ぜんぶ持つ",
      "PokaDebug.wearStock('ribbon_pink')     服の かず（1こで 1人）・つかって いる 人・あと なんこ",
      "PokaDebug.wearSet('ribbon_pink', 3)    服の かずを きめる（0〜5。0 は もって いない）",
      "PokaDebug.itemDex('furn')             家具／服の図鑑の記録（'furn' / 'wear'）",
      "PokaDebug.itemDexClaim('wear', 10)    10種類ごとの図鑑のごほうびを受け取る",
      "PokaDebug.give('cake', 3)             もちものを足す",
      "PokaDebug.save()                      いますぐセーブ",
      "PokaDebug.walkTo(4, 12)               町・フィールドで (x, y) まで歩く",
      "PokaDebug.mg()                        お店ミニゲームの状態（注文・ボタン位置）",
      "PokaDebug.hour(21)                    時刻を固定（null で戻す）",
      "PokaDebug.roadPreview(def, view)       道の検証画像（セーブ・現在地は変えない）",
      "PokaDebug.fps(2000)                   指定ミリ秒のあいだの平均FPSを返す（Promise）",
      "PokaDebug.venue('arcade', 2)         Meeときょれじゃ の 2F（おかし キャッチャー・はしわたし）。arcadeLineup(12) で 日がわりの けいひん・arcadeStart(12〜18) で 2F の 台・arcadeMiss(17, 4) で はしわたしの たすけ・arcadeHint() で しるしへ",
      "PokaDebug.venue('arcade', 3)         Meeときょれじゃ の 3F（ぷりくら・こういしつ・おかしの 台）。arcadeStart(19) で おかし ロード（arcadeRoadAt(2, 15) で ひかりを れつ 2 に まつ・ランプ 15）・arcadeStart(20) で おかし タワー（arcadeAimRing() で わっかの うえ）",
      "PokaDebug.venue('arcade', 4)         Meeときょれじゃ の 4F（ガチャガチャの もり・ガチャ 18だい・シールの ガチャ・クレーン 3台）。gachaForest() で シリーズの ばんごう（12〜29）・gachaOpen(12) で まちぼうけ ぽかぽか の 台",
      "PokaDebug.meeRotation('2026-10-5')   ガチャの しゅうがわり（まいしゅう げつようびに しまごとに 1だい いれかわる・NEW の はた）。gachaVisit('machisea') で その シリーズの 台へ",
      "PokaDebug.gachaHeisei()             へいせい じょじ ふうの ガチャ 4シリーズ（ばんごう・くみ・けいひん・こんしゅう でて いるか。UI-79）",
      "PokaDebug.gachaHeiseiMore()         4F の へいせい じょじ ふうの ガチャ 5シリーズ（ばんごう・しま・けいひん・こんしゅう でて いるか。UI-80）",
      "PokaDebug.english()                 英語の セーブ（レベル・あそびかた・かず・ベスト・さいきんの 問題）と 問題の かず（UI-82）",
      "PokaDebug.conbini('lawson')          コンビニの しなぞろえ（16しゅ・タブ・もとの ねだん・コンビニの ねだん ×1.5。UI-84）",
      "PokaDebug.conbiniCard('lawson', set) コンビニの ポイントカード（ポイント・チケット・ていきけん・オーナー。set { pts, owner, tickets, busUntil } で きめる。UI-85）",
      "PokaDebug.numpla()                  ナンプレの セーブ（さいごの 難しさ・クリア・ベスト・とちゅうの 問題・たばの かず。UI-81）",
      "PokaDebug.numplaFill(leave=1)       あそんで いる ナンプレを leave マス だけ のこして 正しく うめる（0 で クリア）",
      "PokaDebug.arcadeStart(21〜23)       4F の たこやき（arcadeTako(0) で あたりの あなに だま）・バーバーカット（arcadeBarber(1, 0, -2) で まん中の ひもの てまえ）・バウンドボール",
      "PokaDebug.stickers()                 シールの ガチャ（4F・30〜32）と シールちょう（てもと・ページ）。stickerGive('stk_wanko', 3) で シールを もらう・stickerUi() で ひらいて いる ページ",
      "PokaDebug.kuji('lawson')             ネリカスタウンの コンビニの いちばんくじ（ロット・のこり・はりつけ ひょう・はんけん・クーポン）。kujiOpen で ボード・kujiNext('A') で つぎの 賞・kujiLeft(s, n) で のこり n まい・kujiDays(s, 1) で つぎの 日・kujiDc(true)・kujiUi()",
      "PokaDebug.areaMap()                  すまほ の ちず「この エリア」の ようす（めじるし・なまえ・えらんだ もの）。areaMapLayout('town', 4.46) で ならびだけ",
      "PokaDebug.venue('electronics', 2)    ネリカス でんき（池袋の 家電の 館。1F スマホ・カメラ／2F くらしの かでん／3F テレビ・パソコン／10F あかり・シアター・けいば ちゅうけい）。kaden() で 階・うりば・だいの しなもの・ためしの だい",
      "PokaDebug.kadenStickers()           ネリカス でんき 1F の シール うりば（ひらいて いる タブ・しなもの・かった かず）。シールちょうは stickers()・stickerUi()",
      "PokaDebug.keiba()                    ネリカス でんき 10F の けいば ちゅうけい（つぎの レース・しめきった レース・ばけん・あたり）。keibaCard(no)・keibaBuy(no, 'tan', [5], 1, 'one')・keibaResult(no)・keibaWatch(no)・keibaSpeed(8)・keibaScene()・keibaUi()・keibaDays(1)",
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
  // たべものの バランス（js/food-balance.js・UI-35）: そのままの やさい・りょうり（ざいりょうの ごうけい つき）・ねだんで ごきげんを あげた もの
  foodBalance() { return FoodBalance.state(); },
  // ファッションショー（js/fashion-show.js・js/fashion-hall.js・js/fashion-scene.js・UI-36）
  fashion() { const st = FashionShow.state(), d = VenueHalls.defs.fashion; return { ...st, fee: FashionShow.FEE, coins: Save.d.coins, prizes: { ...FashionShow.PRIZES }, venue: !!d, building: (MAP_DEFS.city.buildings.find((b) => b.act && b.act.venue === "fashion") || {}).id || null, trophies: FashionHall.trophiesGot(), wall: FashionHall.myPhotos().length, source: ItemDexSources.source("wear", ITEM_INDEX.fs_star_tiara) }; },
  fashionGo(at = null) { const b = MAP_DEFS.city.buildings.find((b) => b.act && b.act.venue === "fashion"); if (!b) return false; Game.goto("venue", { venue: "fashion", ...(at ? { at } : {}), back: { map: "city", x: b.x + b.door, y: b.y + b.h, dir: "down" } }, "none"); return true; },
  fashionStart() { const b = MAP_DEFS.city.buildings.find((b) => b.act && b.act.venue === "fashion"); if (!b) return false; if (!FashionShow.hasEntry() && !FashionShow.pay().ok) return false; Game.goto("fashion", { back: { venue: "fashion", floor: 1, back: { map: "city", x: b.x + b.door, y: b.y + b.h, dir: "down" }, at: FashionHall.AT_GATE } }, "none"); return true; },
  fashionAuto(off = 0.02) { FashionScene.auto = off == null ? null : +off; return FashionScene.auto; },
  fashionSpeed(k = 1) { FashionScene.speed = Math.max(0.25, Math.min(8, +k || 1)); return FashionScene.speed; },
  fashionTheme(id = null) { FashionShow.override = id && FashionShow.THEME[id] ? id : null; return FashionShow.theme().id; },
  fashionPress() { if (G.sceneName !== "fashion") return false; G.scene.press(); return true; },
  fashionScene() {
    const s = G.sceneName === "fashion" ? G.scene : null; if (!s || !s.models) return null;
    const btn = s.btn && s.btn.getBoundingClientRect();
    return { phase: s.phase, cur: s.cur, theme: s.show.theme, order: s.show.order.slice(), t: +s.t.toFixed(2), cam: +s.cam.k.toFixed(2), ring: s.ring ? { k: s.ring.k, dur: s.ring.dur, left: +(s.ring.t1 - s.t).toFixed(3) } : null,
      models: s.models.map((m) => ({ id: m.id, z: +m.z.toFixed(2), face: s.face(m.id, m.face), gesture: m.gesture, judgments: m.judgments.slice(), line: m.line ? m.line.text : null })),
      mc: s.mc ? s.mc.text : null, panel: s.panel ? { k: s.panel.k, cards: s.panel.r.cards.slice(), comments: s.panel.r.comments.slice(), total: s.panel.r.total } : null, results: s.results.map((r) => r && r.total),
      banner: s.banner ? { rank: s.banner.R.id, score: s.banner.score } : null, summary: s.summary ? { score: s.summary.score, rank: s.summary.rank, coins: s.summary.coins, got: s.summary.got.slice() } : null,
      button: btn ? { w: Math.round(btn.width), h: Math.round(btn.height), disabled: s.btn.disabled, hidden: s.ui.classList.contains("fs-off") } : null, reward: !!document.querySelector(".fs-panel") };
  },
  homeSay(id,text,kind='say') {if(G.sceneName!=='house')return false;HomeLife.say(G.scene,id,String(text),kind==='rare',kind);return true;},
  homeTalkLog() {return G.sceneName==='house'?G.scene.life.log.map(x=>({...x})):[];},
  // かけあいを 1つ 流す（HOME_TALK_DATA.talks の id）
  homeTalk(id) {if(G.sceneName!=='house')return false;return HomeLife.playTalk(G.scene,HomeLife.talkById(id));},
  // ごわがの おねがい（js/gowaga-wish.js・UI-46）: いまの おねがい・かなえた かず・きろく・きいて いる か・あまえる のこり・いる ばしょ・おねだり（UI-88: begs・beg〔館の この かいの ようす〕・begHere）
  wish() {
    if(typeof GowagaWish==='undefined')return null;
    const w=GowagaWish.st(),x=w.cur&&GowagaWish.INDEX[w.cur.id],h=G.sceneName==='house'&&G.scene?G.scene.wishFx:null;
    return {cur:w.cur?{...w.cur,kind:x.kind,who:x.who}:null,n:w.n||0,log:w.log.map(l=>l.id),how:w.log.map(l=>l.how),asking:GowagaWish.asking,busy:!!(h&&h.busy),amae:h?Math.max(0,Math.round(h.amae*10)/10):0,ids:GowagaWish.WISHES.map(x=>x.id),place:GowagaWish.place(),begs:GowagaWish.WISHES.filter(x=>x.beg).map(x=>x.id),beg:G.sceneName==='venue'&&G.scene&&G.scene.begFx?{...G.scene.begFx}:null,begHere:G.sceneName==='venue'&&G.scene?GowagaWish.begList({venue:G.scene.id,floor:G.scene.floor}).map(x=>x.id):[]};
  },
  // おねがいの おれいの しな（js/wish-gifts.js・UI-70）: mode "none"（でない）・しゅるい（letter／stone／acc／hand）・id（つぎ だけ）・null（ふつう）
  wishGift(mode=null) {if(typeof WishGifts==='undefined')return null;WishGifts.force=mode===null?undefined:mode;return WishGifts.state();},
  wishGifts() {return typeof WishGifts==='undefined'?null:WishGifts.state();},
  // きろく（js/play-records.js・UI-71）: 3人の きろく・たべものごとの かず・みんなの きろく。recordsAdd は テスト用に かずを たす
  records() {return typeof PlayRecords==='undefined'?null:PlayRecords.state();},
  recordsAdd(id,key,n=1) {return typeof PlayRecords==='undefined'?null:PlayRecords.add(id,key,n);},
  wishGiftGive(id) {return !!(typeof WishGifts!=='undefined'&&WishGifts.give(id));},
  wishLetter(id) {if(typeof WishGifts==='undefined'||!WishGifts.INDEX[id])return false;WishGifts.openLetter(id);return true;},
  // 館の おねだり（UI-88）: wishBeg(id) その おねがいを いま おねだり（まどが ひらく）・wishBegArm(びょう) まえの おねがいから 5ふん たった ことに して、この かいで その びょうすう あとに じぶんから おねだり する
  wishBeg(id) {if(G.sceneName!=='venue'||typeof GowagaWish==='undefined'||!GowagaWish.INDEX[id])return false;GowagaWish.beg(G.scene,id);return true;},
  wishBegArm(sec=1) {if(G.sceneName!=='venue'||typeof GowagaWish==='undefined')return false;GowagaWish.st().last=0;G.scene.begFx={venue:G.scene.id,floor:G.scene.floor,t:0,at:sec};return true;},
  // おうちで その おねがいを きく（まどが ひらく。こたえは テストの がわで おす）
  wishAsk(id) {if(G.sceneName!=='house'||typeof GowagaWish==='undefined'||!GowagaWish.INDEX[id])return false;GowagaWish.ask(G.scene,id);return true;},
  // もちもの（UI-48）: 7しゅ・ようふくやさんの たな・3人が もって いる もの・絵に でて いるか
  handItems() {
    if(typeof HandItems==='undefined')return null;
    const held=Object.fromEntries(Chara.IDS.map(id=>[id,HandItems.held(id)]));
    return {items:HandItems.ITEMS.map(x=>x.id),shopTab:BUY_SHOPS.clothes.tabs.some(t=>t[0]===HandItems.SLOT),held,
      drawn:Object.fromEntries(Chara.IDS.map(id=>{const it=held[id]&&ITEM_INDEX[held[id]],c=Save.d.chars[id];return [id,!!it&&Chara.svg(id,{outfit:c.outfit,color:c.color}).includes(it.col[0])];}))};
  },
  // いぬの さんぽ（UI-49）: リードを もった 子・いまの シーンの こいぬ（ばしょ・もった 子からの きょり・おうちでは どちらの よこか side と タップ できる 点 cx, cy〔見えて いなければ null〕）
  pets() {
    if(typeof PetWalk==='undefined')return null;
    const sc=G.scene,name=G.sceneName,cv=G.canvas?G.canvas.getBoundingClientRect():{left:0,top:0},u=G.cssPerUnit||1,out={holders:PetWalk.holders(),scene:name,pets:[]};
    if(sc&&sc.pets)for(const [id,p] of Object.entries(sc.pets)){
      const base={id,name:PetWalk.PUPS[id].name,x:p.x,y:p.y,dir:p.dir,moving:!!p.moving,love:p.love||0};
      if(name==='world'){const f=sc.party[Save.d.order.indexOf(id)].feet();out.pets.push({...base,dist:Math.hypot(p.x-f.x,p.y-f.y)});}
      else if(name==='house'){const c=sc.chars.find(k=>k.id===id),t=PetWalk.houseTapPoint(sc,id);out.pets.push({...base,side:p.side,dist:Math.hypot(p.x-c.x,p.y-c.y),cx:t?cv.left+t.x*u:null,cy:t?cv.top+t.y*u:null});}
    }
    return out;
  },
  // リードを もたせる（on=false で はずす）。もって いなければ 1こ たす
  petHold(who,on=true) {
    if(typeof PetWalk==='undefined'||!Save.d.chars[who])return null;
    if(on){if(!WearStock.can(PetWalk.ITEM,who))WearStock.add(PetWalk.ITEM,1);WearStock.put(who,HandItems.SLOT,PetWalk.ITEM);}
    else if(Save.d.chars[who].outfit.hand===PetWalk.ITEM)WearStock.put(who,HandItems.SLOT,null);
    Save.mark();return this.pets();
  },
  // おトイレ（UI-47）: 3人の いきたさ・ドアの ばしょ（homeDoors と おなじ）・はいって いる 子・つかった かず・3人の ようす（face は ふだんの かお）
  toilet() {
    if(typeof HomeToilet==='undefined')return null;
    const t=HomeToilet.st(),sc=G.sceneName==='house'?G.scene:null,W=sc&&sc.wc;
    return {need:Object.fromEntries(HomeToilet.IDS.map(id=>[id,HomeToilet.need(id)])),n:t.n,who:W?W.who:null,inside:!!(W&&W.inside),door:sc?HomeDoors.state(sc).doors.find(d=>d.id==='toilet')||null:null,
      kids:sc?sc.chars.map(c=>({id:c.id,state:c.state,hidden:!!c.hidden,wc:c.wc?c.wc.phase:null,face:sc.baseFace(c)})):[],hold:W?{...W.hold}:{}};
  },
  // いきたさを きめる（0〜100）。o.hold: 100 で がまんした びょう・o.nag: つぎの もじもじ までの びょう（おうちに いる とき）
  toiletNeed(id,v,o={}) {
    if(typeof HomeToilet==='undefined')return null;
    HomeToilet.set(id,v);const sc=G.sceneName==='house'?G.scene:null;
    if(sc&&HomeToilet.IDS.includes(id)){const W=HomeToilet.scene(sc);if(o.hold!=null)W.hold[id]=Number(o.hold);if(o.nag!=null)W.nag[id]=Number(o.nag);}
    return HomeToilet.need(id);
  },
  // かけあいの ふきだしの ぎょう数（HomeBubbles.wrap の おりかえし。max を こえると「…」で きれる）
  homeTalkRows(id) {
    const t=HomeLife.talkById(id);if(!t||typeof HomeBubbles==='undefined')return null;
    const S=HomeBubbles.S,keep=S.maxLines,ctx=G.ctx;ctx.save();ctx.font=`700 ${S.font}px sans-serif`;
    try{S.maxLines=99;return {max:keep,rows:t.turns.map(x=>HomeBubbles.wrap(ctx,x.text,S.maxW-S.padX*2).length)};}finally{S.maxLines=keep;ctx.restore();}
  },
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
  // いない ほうの かいの 1まいの 絵（UI-92）: どの かいか・大きさ・いろの まとめ（hash）・その かいの フィギュア だいに かざって いる かず
  homeFloorBake() {
    const F = G.sceneName === "house" && G.scene.floorImage; if (!F) return null;
    const c = F.cv, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, room = Save.d.rooms.stored[F.id];
    let hash = 0, solid = 0; for (let i = 0; i < d.length; i += 4) { hash = (hash * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3] * 11) >>> 0; if (d[i + 3] > 200) solid++; }
    const figs = typeof FigureStand === "undefined" || !room ? 0 : room.items.reduce((n, it) => n + (FigureStand.isStand(it.id) ? FigureStand.figsOf(it).filter(Boolean).length : 0), 0);
    return { id: F.id, w: c.width, h: c.height, hash, solid, figs };
  },
  // おうちの みち（UI-73・js/home-nav.js）: マス・家具の 足もと（へやの 座標）・3人と ぱぱ ままの いち・いきさき・みち・家具の うえか（inside）・ゆるして いるか（loose）
  homeNav() {
    if (G.sceneName !== "house" || typeof HomeNav === "undefined") return null;
    const sc = G.scene, I = HomeNav.info(sc), nav = (a) => a._nav && !a._nav.done ? a._nav : null;
    return { ...I, actors: [...sc.chars, ...sc.parents].map((a) => ({ id: a.id, x: a.x, y: a.y, tx: a.tx, ty: a.ty, state: a.state, hidden: !!a.hidden, inside: HomeNav.blockedAt(sc, a.x, a.y), path: nav(a) ? nav(a).pts.map((p) => ({ x: p.x, y: p.y })) : null, loose: !!(nav(a) && nav(a).loose), straight: !!(nav(a) && nav(a).straight) })) };
  },
  // おうちの そと（UI-74・js/house-ext.js）: パーツ・ペンキ・もって いる もの・かえて いるか・町の 絵の キー・町で 描いた か（drawn）・かう がめん（ui）
  exterior() {
    if (typeof HouseExt === "undefined") return null;
    const e = HouseExt.view(), key = HouseExt.key(), pre = "w:house_ext:" + JSON.stringify({ ext: key });
    return { parts: { ...e.parts }, paint: { ...e.paint }, owned: Object.keys(e.owned), paints: Object.keys(e.paints), custom: HouseExt.custom(), key, total: HouseExt.total(),
      drawn: [...SvgCache.map.keys()].some((k) => k.startsWith(pre)), ui: typeof HouseExtUI !== "undefined" ? HouseExtUI.state() : null };
  },
  // テスト よう: パーツと いろを もって いる ことに して つける（exteriorSet({ roof: "steep" }, { wall: "sora" })。{} で はじめの おうち）
  exteriorSet(parts = {}, paint = {}) {
    if (typeof HouseExt === "undefined") return null;
    const e = HouseExt.st();
    for (const [c, id] of Object.entries(parts)) { const p = HouseExt.part(c, id); if (p && p.price > 0) e.owned[p.key] = true; }
    for (const id of Object.values(paint)) if (HouseExt.PAINT[id]?.price > 0) e.paints[id] = true;
    const reset = !Object.keys(parts).length && !Object.keys(paint).length;
    if (!HouseExt.apply(reset ? { parts: { ...HouseExt.DEFAULT_PARTS }, paint: { ...HouseExt.DEFAULT_PAINT } } : { parts, paint })) return null;
    return this.exterior();
  },
  // 3人の だれか（papa・mama も）を へやの (x, y) へ あるかせる。みちを かえす
  homeWalk(who, x, y) {
    if (G.sceneName !== "house" || typeof HomeNav === "undefined") return null;
    const sc = G.scene, a = [...sc.chars, ...sc.parents].find((c) => c.id === who);
    if (!a || a.hidden || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    HomeActions.cancel(a); if (sc.parents.includes(a)) a.target = null;
    a.state = "walk"; a.tx = x; a.ty = y; a._nav = null;
    const p = HomeNav.plan(sc, a, x, y); return { pts: p.pts.map((q) => ({ x: q.x, y: q.y })), loose: p.loose };
  },
  homePoint(x, y) { const p = G.scene.toScreen(x, y), r = G.canvas.getBoundingClientRect(); return { x: r.left + p.x * G.cssPerUnit, y: r.top + p.y * G.cssPerUnit }; },
  homeDesign() {
    if(G.sceneName !== "house")return null;
    const sc=G.scene, canvas=G.canvas.getBoundingClientRect(), point=p=>({x:canvas.left+p.x*G.cssPerUnit,y:canvas.top+p.y*G.cssPerUnit});
    const rect=r=>({...point(r),w:r.w*G.cssPerUnit,h:r.h*G.cssPerUnit});
    return {width:ROOM.W,depth:HomeDesign.D,expanded:!!Save.d.rooms.expanded[Save.d.rooms.active],background:sc.bgArgs[0],zoom:sc.zoom,zoomMax:sc.ZMAX,tier:sc.rasterK(),fine:!!SvgCache.map.get(sc.bgFine[0]+"@"+sc.bgFine[2]+"x"+sc.bgFine[3]),pan:{...sc.pan},mode:sc.mode,selected:sc.sel?.uid,
      items:Save.d.room.items.map(it=>({...it,rect:rect(sc.itemRect(it)),anchor:FURN_INDEX[it.id].kind==="wall"?point(sc.wallPoint(it)):point(sc.toScreen(sc.anchor(it).x,sc.anchor(it).y))})),
      actors:[...sc.chars,...sc.parents].map(c=>({id:c.id,state:c.state,rect:rect(sc.actorRect(c,sc.parents.includes(c)))})),
      ball:sc.ball?{...point(sc.ballPoint(sc.ball)),hits:sc.ball.hits}:null,
      hide:sc.hide?{...sc.hide,spots:sc.chars.filter(c=>c.hidden).map(c=>({id:c.id,rect:rect(c.spot.door?sc.doorRect():sc.itemRect(c.spot.it))}))}:null,
      stored:JSON.parse(JSON.stringify(Save.d.rooms)),furn:{...Save.d.furn},wall:Save.d.room.wall,floor:Save.d.room.floor};
  },
  furnTray() { return G.sceneName === "house" && G.scene.mode === "edit" ? FurnTray.view(G.scene) : null; },
  // かぐやさんの ひがわり（js/furniture-collection.js）: きょうの 日・2にちの くぎり・あと なんにち・ならぶ かぐ と かべかざり（calendar() で 日を かえられる）
  furnDaily() { return typeof FurnCollection !== "undefined" ? FurnCollection.state() : null; },
  furnTraySize(size) { if (G.sceneName !== "house" || G.scene.mode !== "edit" || !["s", "m", "l"].includes(size)) return false; FurnTray.setSize(G.scene, size); return FurnTray.state.size === size; },
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
    // （ブラウザに よっては タッチの 座標が 1px まるめられて 人に あたる）。家具の ふちも さける: まわり 2px（CSS）も その 家具に あたる 点
    // （WebKit は タッチの 座標を まるめるので、ふちの 点は 家具の そとに でる。おはなばたけの ラグの うえの ふち など）。よゆうが とれない ときだけ ぎりぎり
    const inside = (sx, sy, m) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].every(([dx, dy]) => { const q = sc.toRoom(sx + dx, sy + dy); return sc.hitItem(q.x, q.y) === it; });
    for (const [pad, edge] of [[10, 2], [0, 2], [10, 0], [0, 0]]) for (let fy = 0.2; fy <= 0.9 && !tap; fy += 0.1) for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
      const sx = r.x + r.w * fx, sy = r.y + r.h * fy;
      if (actors.some(([a, parent]) => sc.contains(sc.actorRect(a, parent), { x: sx, y: sy }, pad))) continue;
      if (inside(sx, sy, edge / (G.cssPerUnit || 1))) { tap = { x: c.left + sx * G.cssPerUnit, y: c.top + sy * G.cssPerUnit }; break; }
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
  // Meeときょれじゃ の 店内 BGM（再生リスト）の ようす。"skip" で いまの 曲を おわりまで とばす（つぎの 曲へ）
  arcadeMusic(cmd) {
    const cur = Sound.cur;
    if (cmd === "skip" && cur && cur.list) cur.step = cur.len;
    return { list: ArcadeJpop.LIST.slice(), titles: ArcadeJpop.LIST.map((id) => ArcadeJpop.title(id)), name: cur?.name || Sound.want || null,
      playing: cur?.list ? cur.id : null, title: cur?.list ? ArcadeJpop.title(cur.id) : null, step: cur?.step ?? null, len: cur?.len ?? null,
      jpop: !!cur?.song?.jpop, gap: Sound.GAP, voices: cur?.bus?.voices.size || 0 };
  },
  async musicRender(name, seconds = 8, wav = false, from = 0) {
    const { audio, stats } = await ModernMusic.render(name, seconds, from);
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
  // いまの マップの てきを けす（テスト用。ボスは のこす。てきは マップに はいった ときだけ でる ので、つぎに はいるまで でない）。けした かず
  clearFoes() { if (G.sceneName !== "world" || !G.scene.enemies) return 0; const sc = G.scene, n = sc.enemies.length; sc.enemies = sc.enemies.filter((e) => e.boss); return n - sc.enemies.length; },
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
  // いらい・おてつだい・町の人の おねがいの けいけんち（js/work-exp.js・UI-44）: いちばん あとの けっか（kind: shift・quest・folk）と 3人の レベル
  workExp() {
    if (typeof WorkExp === "undefined") return null;
    const l = WorkExp.last;
    return { kind: l ? l.kind : null, rate: l ? l.rate : 0, fav: l ? l.fav || null : null, shop: l ? l.shop || null : null, rows: l ? l.rows.map((r) => ({ id: r.id, n: r.n, lv0: r.lv0, lv: r.lv, exp: r.exp, need: r.need, ups: r.ups.map((u) => u.lv), fav: !!r.fav })) : [],
      levels: Save.d.order.map((id) => { const c = Save.d.chars[id]; return { id, lv: c.lv, exp: c.exp, need: Stats.expNeed(c.lv) }; }) };
  },
  // その 子を つぎの レベルの あと left の ところに（テスト用）
  nearLevelUp(id = "goji", left = 1) {
    const c = Save.d.chars[id]; if (!c || c.lv >= 50) return null;
    c.exp = Math.max(0, Stats.expNeed(c.lv) - Math.max(1, left)); Save.mark();
    return { id, lv: c.lv, exp: c.exp, need: Stats.expNeed(c.lv) };
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
  // とれたて りょうり（js/farm-cook.js）: りょうりごとの ざいりょう・つくれるか・もって いる かず・つくった かず・まどが ひらいて いるか
  cookState() { return { recipes: FARM_RECIPES.map((r) => ({ id: r.id, name: FarmCook.nameOf(r.id), needs: { ...r.needs }, can: FarmCook.can(r), have: Save.d.bag[r.id] || 0 })), cooked: { ...Farm.st().cooked }, open: !!document.querySelector(".modal-wrap .farm-cook") }; },
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
  // ほねを うる・そんちょうさんの ひょうしょう（js/fossil-sell.js・UI-69）の ようす
  fossilSell() {
    if (typeof FossilSell === "undefined") return null;
    const held = FossilSell.held().map((key) => ({ key, n: Save.d.fossil.bones[key], price: FossilSell.price(key), needed: FossilSell.needed(key), spare: FossilSell.spare(key) }));
    return { held, spareCoins: held.reduce((a, h) => a + h.price * h.spare, 0), awards: { ...DinoAward.st() }, pending: DinoAward.pending(), count: DinoAward.count(), coins: Save.d.coins,
      rows: [...document.querySelectorAll(".fossil-sell-row")].map((r) => ({ key: r.dataset.key, text: r.innerText })) };
  },
  // その きょうりゅうの ほねを ぜんぶ きふした ことに する（かんせい・ひょうしょうは まだ。まえの セーブの かわり）
  museumDino(id = "raptor") { const d = Fossils.dino(id); if (!d) throw new Error("unknown dino: " + id); for (const p of d.art.parts) this.museumGive("bone", d.id + "." + p.id); return this.fossilSell(); },
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
    // UI-42: はくぶつかんは 斜め上の 3かいだての 館（js/dino-museum.js。room は あたらしい へや。むかしの へやの 名前も うけつける）
    if (id === "museum" && typeof DinoMuseum !== "undefined" && VenueHalls.defs.museum) {
      const old = { entrance: "lobby", esc: "atrium", street: "street", hall: "hall", lab: "lab", eggs: "eggs", shop: "cafe" }, zid = old[room] || room || "lobby";
      const fl = [3, 1, 2].find((k) => DinoMuseum.ZONES[k].some((z) => z.id === zid)); if (!fl) throw new Error("unknown room: " + room);
      const z = DinoMuseum.ZONES[fl].find((q) => q.id === zid), r = VenueHalls.defs.museum.floors[fl], sc = new SCENES.venue(); sc.room = r; sc.fixtures = r.fixtures; let best = null;
      for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (sc.walkable(x, y)) { const d = Math.abs(x - (z.x + z.w / 2)) + Math.abs(y - (z.y + z.h - 2)); if (!best || d < best[2]) best = [x, y, d]; }
      const o = MUSEUM_DATA.buildings.museum.outside; Game.trans = null;
      Game.goto("venue", { venue: "museum", floor: fl, at: best ? [best[0], best[1]] : null, back: { map: "city", x: o.front[0], y: o.front[1], dir: "down" } }, "none");
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
    if (G.sceneName === "venue" && G.scene.room && G.scene.room.museum) { const sc = G.scene, f = sc.fixtures.find((f) => f.action === "curator"); if (!f || sc.busy) return false; DinoMuseum.interact(sc, f); return true; }
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
    if (o.map === "museum" && typeof DinoMuseum !== "undefined" && VenueHalls.defs.museum) {
      const all = [1, 2, 3].flatMap((fl) => VenueHalls.defs.museum.floors[fl].fixtures.map((f) => ({ f, fl }))), q = all.find((q) => q.f.obj === objId || (o.dino && q.f.dino === o.dino) || (o.info && q.f.info === o.info));
      return !!(q ? DinoMuseum.show(q.f, q.fl) : o.info && DinoMuseum.card(o.info, 1));
    }
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
  // きふの ごほうびの 服（js/museum-wear.js・UI-33）: 館ごとの きふの かず・もらった 服・つぎ・みだしの ことば
  museumWear() { return typeof MuseumWear === "undefined" ? null : MuseumWear.state(); },
  // バーガーやさんの メニュー（タブ・食べ物の id）と にこにこ セットの おまけの おもちゃ（もって いる かず。js/burger-menu.js）
  burgerMenu() { return typeof BurgerMenu === "undefined" ? null : BurgerMenu.state(); },
  // UI-76: たべものの おみせ 5けんの しなぞろえ（タブ・しなものの id・かず。js/shop-goods.js）
  shopGoods(shop = "cake") { if (shop === "mall") return typeof MallFood === "undefined" ? null : MallFood.state(); if (shop === "groom") return typeof SalonGoods === "undefined" ? null : SalonGoods.state(); if (shop === "florist") return typeof FloristGoods === "undefined" ? null : FloristGoods.state(); return typeof ShopGoods === "undefined" ? null : ShopGoods.state(shop); },
  // UI-42: はくぶつかんの ようす（階・へや・ほねの 台の 寄贈の かず と 絵が できたか・ロボット）
  dinoHall() { return typeof DinoMuseum === "undefined" || G.sceneName !== "venue" ? null : DinoMuseum.state(G.scene); },
  // UI-56: ネリカス でんき（池袋の 家電の 館）の ようす（階・うりば・だいの しなもの・ためしの だい・エスカレーター・絵が できたか）
  kaden() { return typeof KadenHall === "undefined" || G.sceneName !== "venue" ? null : KadenHall.state(G.scene); },
  // UI-57: ネリカス でんきの シール うりば（ひらいて いる か・タブ・でて いる しなもの・かった かず）
  // UI-58: けいば ちゅうけい（10F）。keibaCard は しゅつばひょうの データ・keibaBuy は かう（コインが へる）・keibaResult は けっかと はらいもどし（テスト用。がめんでは はしる まで みせない）・
  // keibaWatch は ちゅうけいへ（館の 中から）・keibaSpeed は ちゅうけいの はやさ・keibaDays(n) は n にち たった ことに（ばんぐみが かわる・まえの 日の ばけんは しめきる）
  keiba() { return typeof KeibaCorner === "undefined" ? null : KeibaCorner.state(); },
  keibaCard(no) { if (typeof KeibaRace === "undefined") return null; const day = KeibaCorner.today(), rc = KeibaRace.race(day, no || KeibaCorner.next() || 1), b = KeibaRace.board(rc, KeibaCorner.open()); return { no: rc.no, title: KeibaRace.title(rc), dist: rc.dist, surf: rc.surf, n: rc.n, going: rc.going, horses: rc.horses.map((h) => ({ no: h.no, waku: h.waku, name: h.name, odds: b[h.no - 1].odds, pop: b[h.no - 1].pop })) }; },
  keibaBuy(no, t = "tan", sel = [1], u = 1, m = "one") { if (typeof KeibaCorner === "undefined") return null; const r = KeibaCorner.buy(no, t, sel, m, u); if (r.ticket && typeof UI.updateHud === "function") UI.updateHud(); return r.err ? { err: r.err } : { id: r.ticket.id, keys: r.ticket.keys.length, cost: r.ticket.cost }; },
  keibaResult(no) { if (typeof KeibaRace === "undefined") return null; const day = KeibaCorner.today(), rc = KeibaRace.race(day, no), res = KeibaRace.result(rc), pays = KeibaRace.payouts(rc, KeibaCorner.ticketsOf(day, no)); return { order: res.order, margins: res.margins, time: KeibaRace.fmtTime(res.time[0]), pays: Object.fromEntries(Object.entries(pays).map(([t, p]) => [t, p.sold ? p.wins.map((w) => [w.key, w.per]) : null])) }; },
  keibaWatch(no) { if (typeof KeibaCorner === "undefined" || G.sceneName !== "venue") return false; KeibaCorner.watch(G.scene, no || KeibaCorner.next()); return true; },
  keibaSpeed(x = 1) { if (typeof KeibaScene === "undefined") return null; KeibaScene.speed = x; return x; },
  keibaScene() { return G.sceneName === "keiba" && G.scene && G.scene.state ? G.scene.state() : null; },
  keibaUi() { return typeof KeibaUI === "undefined" ? null : KeibaUI.state(); },
  keibaDays(n = 1) { if (typeof KeibaRace === "undefined") return null; KeibaRace.clock.shift += n; return KeibaCorner.state(); },
  kadenStickers() { return typeof KadenStickers === "undefined" ? null : { ...KadenStickers.state(), products: KadenStickers.PRODUCTS.map((p) => ({ id: p.id, kind: p.kind, price: p.price, n: KadenStickers.count(p) })) }; },
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
  // variant: あたまの たいそう（"spot"・"pair"・"math"・"eng"。js/mg-brain.js・js/mg-english.js）・パズル こうぼう（"slide"・"shape"・"logic"・"numpla"。js/mg-kobo.js・js/mg-numpla.js）の ゲーム
  shop(id = "crepe", lv, variant = null) {
    if (!SHOPS[id]) throw new Error("unknown shop: " + id);
    if (id === "link") return this.store("link", "city");
    if (variant && !(SHOP_GAMES[id] && SHOP_GAMES[id].tasks[variant])) throw new Error("unknown variant: " + variant);
    if (lv) Save.d.shops[id].lv = U.clamp(lv, 1, 30);
    Game.trans = null;
    Game.goto("shop", { shop: id, back: { map: "town", x: 12, y: 21, dir: "down" }, variant }, "none");
  },
  // おみせで きょう もらった コインの きろく（UI-67・ShopDayCap。1にちの じょうげんは UI-83 で なくした）。earn を わたすと きょう もらった ことに する（day を わたすと その 日づけ）
  shopCap(key = null, earn = null, day = null) {
    const s = ShopDayCap.state();
    if (day) s.day = String(day);
    if (key && earn != null) { s.earn[key] = Math.max(0, Math.floor(earn)); Save.mark(); }
    return { day: s.day, today: U.today(), earn: { ...s.earn }, earned: key ? ShopDayCap.earned(key) : null };
  },
  // いまの おきゃくさんを その てんすう（0〜100）で おわらせる（テスト用。はたらいて いる ときだけ）
  mgFinish(score = 100) { if (G.sceneName !== "shop" || G.scene.phase !== "work" || !G.scene.finish) return false; G.scene.finish(score); return true; },
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
  // コラボ グッズ（js/collab-goods.js）の ようす: つみたて・もらった もの・つぎ
  collab(line = "puzzle") {
    const L = CollabGoods.LINES[line]; if (!L) return null;
    const st = CollabGoods.state(line), nx = CollabGoods.next(line);
    return { line, total: st.total, got: { ...st.got }, next: nx ? nx.id : null, left: nx ? nx.need - st.total : 0,
      items: L.items.map((it) => ({ id: it.id, need: it.need, kind: it.kind, name: it.name, own: !!st.got[it.id], wardrobe: !!Save.d.wardrobe[it.id], furn: Save.d.furn[it.id] || 0 })) };
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
    for (const w of WEAR_ITEMS) WearStock.set(w.id, WearStock.CAP); // 服は 1こで 1人なので 5こずつ（3人と ぱぱ・ままで おそろいに できる）
    for (const f of FURNITURE) d.furn[f.id] = Math.max(d.furn[f.id] || 0, 1);
    for (const w of WALLPAPERS) d.room.wallpapers[w.id] = true;
    for (const f of FLOORS) d.room.floors[f.id] = true;
    Save.mark();
  },
  // 服の かず（js/wear-stock.js・UI-31）: もって いる かず・つかって いる 人（3人 → ぱぱ・まま）・あと なんこ もてるか
  wearStock(id) { if (!ITEM_INDEX[id]) throw new Error("unknown wear: " + id); return { id, count: WearStock.count(id), raw: Save.d.wardrobe[id] ?? null, wearers: WearStock.wearers(id), room: WearStock.room(id), cap: WearStock.CAP }; },
  wearSet(id, n) { if (!ITEM_INDEX[id]) throw new Error("unknown wear: " + id); WearStock.set(id, n); Save.mark(); return this.wearStock(id); },
  // あたまの 2つ（js/chara.js の HeadPair・UI-43）: 1つめ・2つめ・しゅるい・描く じゅん（[id, はんたいがわ]）
  headPair(who = Save.d.order[0]) {
    const o = Save.d.chars[who].outfit;
    return { who, head: o.head || null, head2: o.head2 || null, kinds: [o.head ? HeadPair.kind(o.head) : null, o.head2 ? HeadPair.kind(o.head2) : null], drawn: HeadPair.list(o) };
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
    const out = { shop: sc.shopId, lv: sc.lv, workLv: sc.workLv, phase: sc.phase, n: sc.n, total: sc.total, ranks: [...(sc.ranks || [])], earn: sc.earn, tips: sc.tips, difficulty: sc.difficulty, dailyBoost: sc.dailyBoost, timeLimit: sc.timeLimit, timeLeft: sc.timeLeft, buttons: [], order: null, targets: [],
      variant: sc.variant || null, capKey: sc.capKey, dayEarned: ShopDayCap.earned(sc.capKey) };
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
