// UI-56: ネリカス でんき（池袋の 家電の 館・js/kaden-hall.js / js/kaden-hall-art.js）と 家電の 立体（js/kaden-items.js / js/kaden-live.js）の 検査
import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();R.Save.d=R.Save.fresh();
const D=R.VenueHalls.defs.electronics,H=R.KadenHall,A=R.KadenHallArt,K=R.KadenItems;let n=0;const ok=(c,m)=>{assert(c,m);n++;};
const KANJI=/[㐀-鿿]/,kana=(t,what)=>ok(!KANJI.test(String(t||'')),what+' に 漢字: '+t);
ok(D&&D.iso&&D.art===A&&D.guide===R.MallGuide&&D.start===1&&D.bgm==='shop_kaden'&&R.SONGS.shop_kaden,'家電の 館が ない（VenueHalls.defs.electronics）');
ok(JSON.stringify(Object.keys(D.floors).map(Number).sort((a,b)=>a-b))==='[1,2,3,10]','家電の 館は 1F・2F・3F・10F');
kana(D.name,'館の なまえ');kana(R.BUY_SHOPS.ike_electronics.name,'みせの なまえ');
const scene=(room)=>{const sc=new R.SCENES.venue();sc.room=room;sc.fixtures=room.fixtures;sc.party=[{tx:room.spawn[0],ty:room.spawn[1]}];return sc;};
// ---- 階ごと: 部屋の かたち・什器の はんい・かさならない・とどく・ことば ----
const links=[],bought=new Map();
for(const [fl,room] of Object.entries(D.floors)){
  ok(room.iso&&room.rows.length===room.h&&room.rows.every(r=>r.length===room.w)&&room.bgm==='shop_kaden',fl+'F: 部屋の かたち');
  kana(room.title,fl+'F の なまえ');kana(room.short,fl+'F の みじかい なまえ');
  const sc=scene(room);ok(sc.walkable(...room.spawn),fl+'F: スポーンに たてない');
  if(room.elevatorSpawn)ok(sc.walkable(...room.elevatorSpawn)&&sc.route(...room.elevatorSpawn)!==null,fl+'F: エレベーターから でる マス');
  const ground=room.fixtures.filter(f=>!f.walk&&!f.over);
  for(const f of room.fixtures){
    ok(f.x>=0&&f.y>=0&&f.x+f.w<=room.w&&f.y+f.h<=room.h,fl+'F: はみだす '+f.kind+' '+f.label);
    for(const k of ['label','text'])if(f[k])kana(f[k],fl+'F '+f.kind+'.'+k);
    if(f.kind==='hangsign')kana(f.text,fl+'F hangsign');
    if(f.action){const reach=f.spots?f.spots.some(([x,y])=>sc.route(x,y)!==null):(()=>{for(let y=Math.floor(f.y)-1;y<=Math.ceil(f.y+f.h);y++)for(let x=Math.floor(f.x)-1;x<=Math.ceil(f.x+f.w);x++)if(sc.route(x,y)!==null)return true;return false;})();ok(reach,fl+'F: とどかない '+f.label);}
    if(f.action==='floor'){ok(!!D.floors[f.to]&&f.spawn,fl+'F: いきさきが ない '+f.label);links.push([+fl,f.to,f.spawn,f.label]);}
    if(f.action==='buy'){const it=R.VenueHalls.item(f.item);ok(it&&f.shopId==='ike_electronics'&&f.label===it.name&&it.price>0,fl+'F: うれない だい '+f.item);ok(!bought.has(f.item),'おなじ しなものの だいが 2つ '+f.item);bought.set(f.item,+fl);ok(f.buyKind===(R.FURN_INDEX[f.item]?'furn':'wear'),'だいの しゅるい '+f.item);}
    if(f.action==='demo')ok(!!H.DEMO[f.demo],fl+'F: ためしの ことばが ない '+f.demo);
    if(f.action==='shop')ok(f.shopId==='ike_electronics','おかいけいは ネリカス でんき');
  }
  for(let i=0;i<ground.length;i++)for(let j=i+1;j<ground.length;j++){const a=ground[i],b=ground[j],o=a.x<b.x+b.w-1e-6&&b.x<a.x+a.w-1e-6&&a.y<b.y+b.h-1e-6&&b.y<a.y+a.h-1e-6;ok(!o,fl+'F: かさなる '+a.kind+'('+a.label+') / '+b.kind+'('+b.label+')');}
  // うりば（フロアマップ）: なまえは ひらがな・いろが ある・フロアマップに でる
  ok(room.zones.length>=4,fl+'F: うりばが すくない');
  for(const z of room.zones){ok(!!R.MallArt.SHOP[z.shop]&&!!A.SHOPS[z.shop],'うりばの いろが ない '+z.shop);kana(z.label,'うりば');ok(z.x>=0&&z.y>=0&&z.x+z.w<=room.w&&z.y+z.h<=room.h,'うりばが はみだす '+z.shop);}
  const places=R.MallGuide.places(room);ok(room.zones.filter(z=>z.shop!=='kd_register').every(z=>places.some(p=>p.zone&&p.zone.shop===z.shop)),fl+'F: フロアマップに でない うりば');
  ok(room.fixtures.some(f=>f.action==='elevator'),fl+'F: エレベーターが ない');ok(room.fixtures.some(f=>f.action==='guide'),fl+'F: フロアマップが ない');
  // 絵: 什器の SVG（NaN・undefined・おなじ id・おなじ ぞくせい なし）と かべ
  const dupAttr=(svg)=>[...svg.matchAll(/<[^>]+>/g)].some(m=>{const at=[...m[0].matchAll(/\s([a-zA-Z:-]+)=/g)].map(x=>x[1]);return new Set(at).size!==at.length;});
  for(const f of room.fixtures){const m=A.model(f);if(!m)continue;ok(!/NaN|undefined/.test(m.svg),fl+'F: 絵が こわれて いる '+f.kind);ok(!dupAttr(m.svg),fl+'F: 絵の ぞくせいが かさなる '+f.kind);const ids=[...m.svg.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);ok(new Set(ids).size===ids.length,fl+'F: SVG の id が かさなる '+f.kind);}
  for(const side of ['north','west']){const w=A.wallSvg(room,side);ok(!/NaN|undefined/.test(w.svg)&&!dupAttr(w.svg),fl+'F: かべの 絵 '+side);}
  ok(new Set(room.fixtures.map(f=>A.modelKey(f))).size<=room.fixtures.length,'絵の キー');
}
// ---- 階の つながり: 1F ⇔ 2F ⇔ 3F（エスカレーター）・エレベーターは ぜんぶの 階 ----
for(const [from,to,spawn,label] of links){const r=D.floors[to],sc=scene(r);ok(sc.walkable(...spawn)&&sc.route(...spawn)!==null,from+'F → '+to+'F（'+label+'）の ついた マス');}
const has=(a,b)=>links.some(([f,t])=>f===a&&t===b);ok(has(1,2)&&has(2,1)&&has(2,3)&&has(3,2),'エスカレーター（1F⇔2F・2F⇔3F）');
ok(D.floors[1].fixtures.some(f=>f.action==='leave'),'1F に でぐち');
// ---- しなもの: ネリカス でんきの しなもの（家電 30・スマホ 3）が どれも どこかの だいに 1つずつ ----
const group=R.IkebukuroCatalog.groups.electronics;
ok(group.length===33&&group.every(id=>bought.has(id)),'だいに ない しなもの '+group.filter(id=>!bought.has(id)));
for(const id of group){const it=R.FURN_INDEX[id]||R.ITEM_INDEX[id];kana(it.name,'しなものの なまえ');kana(it.desc,'しなものの せつめい');ok(it.exclusive==='ikebukuro'&&it.price>0,'しなもの '+id);}
const furn=R.BUY_SHOPS.ike_electronics.items('furn').map(i=>i.id),phones=R.BUY_SHOPS.ike_electronics.items('phones').map(i=>i.id);
ok(furn.length===30&&phones.length===3&&K.NEW.every(([id])=>furn.includes(id)),'みせの いちらん（家電 30・スマホ 3）');
ok(Object.keys(K.OLD).every(id=>R.FURN_INDEX[id]||R.ITEM_INDEX[id]),'まえの しなものが ある');
// ---- 家電の 立体: 29しゅ（エアコンは かべの 絵）・はんてん・live。さわると うごく ----
ok(K.ids.length===29&&K.ids.every(id=>R.FurnModels.has(id)),'家電の 立体が ない');
for(const id of K.ids){
  for(const opts of [{},{flip:true},{live:true}]){const m=R.FurnModels.build(id,opts);ok(m&&!/NaN|undefined/.test(m.full)&&m.w>0&&m.h>0,'立体が こわれて いる '+id+JSON.stringify(opts));const ids=[...m.full.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);ok(new Set(ids).size===ids.length,'立体の id '+id);}
  ok(R.FURN_INDEX[id].interactive,'さわれない 家電 '+id);
}
const air=R.FURN_INDEX.ike_kaden_aircon;ok(air&&air.kind==='wall'&&typeof R.FURN_ART.ike_kaden_aircon==='function'&&air.interactive,'かべかけ エアコン');
// live で 絵から ぬく ぶぶんが ある 家電は FurnLive が 描く（LIVE に ある）
for(const id of K.ids){const a=R.FurnModels.build(id,{}).full,b=R.FurnModels.build(id,{live:true}).full;if(a.length!==b.length)ok(R.FurnLive.LIVE.has(id),'うごく ぶぶんを 描かない '+id);}
// テレビの ばんぐみは 5しゅ（なまえは ひらがな）
ok(K.CH.length===5,'テレビの ばんぐみ');for(const c of K.CH)kana(c,'ばんぐみの なまえ');
// ---- BGM ----
const song=R.SONGS.shop_kaden;ok(song.tracks.length>=3&&!song.source,'店内 BGM（この ゲームの ために つくった きょく）');kana(song.title,'きょくの なまえ');
console.log(`Kaden hall: ${n} checks; 4 floors (1F phones and cameras, 2F home appliances, 3F TV and PC, 10F lights and theater), ${bought.size} stands, ${K.ids.length} appliance models with live parts, kana-only words`);
