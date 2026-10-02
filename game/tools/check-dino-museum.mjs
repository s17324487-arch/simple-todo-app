// UI-42: きょうりゅう はくぶつかん（斜め上の 3かいだての 館・js/dino-museum.js / js/dino-hall-art.js）の 検査
import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const R=gameContext();R.Save.d=R.Save.fresh();
const D=R.VenueHalls.defs.museum,M=R.DinoMuseum,A=R.DinoHallArt;let n=0;const ok=(c,m)=>{assert(c,m);n++;};
ok(D&&D.iso&&D.art===A&&D.start===3&&D.bgm==='museum'&&R.SONGS.museum,'はくぶつかんの 館が ない（VenueHalls.defs.museum）');
ok(JSON.stringify(Object.keys(D.floors).sort())==='["1","2","3"]','はくぶつかんは 1F・2F・3F');
const KANJI=/[㐀-鿿]/,kana=(t,what)=>ok(!KANJI.test(String(t||'')),what+' に 漢字: '+t);
const scene=(room)=>{const sc=new R.SCENES.venue();sc.room=room;sc.fixtures=room.fixtures;return sc;};
const routeFrom=(room,at)=>{const sc=scene(room);sc.party=[{tx:at[0],ty:at[1]}];return sc;};
// ---- 階ごと: 什器の はんい・かさならない・タップできる ものに とどく・へやの 案内 ----
const links=[];
for(const [fl,room] of Object.entries(D.floors)){
  ok(room.iso&&room.museum&&room.bgm==='museum'&&room.rows.length===room.h&&room.rows.every(r=>r.length===room.w),fl+'F: 部屋の かたち');
  const sc=routeFrom(room,room.spawn);ok(sc.walkable(...room.spawn),fl+'F: スポーンに たてない');
  const ground=room.fixtures.filter(f=>!f.walk&&!f.over);
  for(const f of room.fixtures){
    ok(f.x>=0&&f.y>=0&&f.x+f.w<=room.w&&f.y+f.h<=room.h,fl+'F: はみだす '+f.kind+' '+f.label);
    for(const k of ['label','text'])if(f[k])kana(f[k],fl+'F '+f.kind+'.'+k);
    if(f.kind==='hangsign')kana(f.text,fl+'F hangsign');
    if(f.info)ok(!!M.info(f.info),fl+'F: 説明が ない '+f.info);
    if(f.action){const reach=f.spots?f.spots.some(([x,y])=>sc.route(x,y)!==null):(()=>{for(let y=Math.floor(f.y)-1;y<=Math.ceil(f.y+f.h);y++)for(let x=Math.floor(f.x)-1;x<=Math.ceil(f.x+f.w);x++)if(sc.route(x,y)!==null)return true;return false;})();ok(reach,fl+'F: とどかない '+f.label);}
    if(f.action==='floor'){ok(!!D.floors[f.to]&&f.spawn,fl+'F: いきさきが ない '+f.label);links.push([+fl,f.to,f.spawn,f.label]);}
    if(f.action==='eat')ok(f.menu.every(id=>R.BAG_INDEX[id]&&R.BAG_INDEX[id].price>0),'カフェの メニュー');
  }
  // じめんの 什器どうしは かさならない（奥行きの じゅんが くずれない）
  for(let i=0;i<ground.length;i++)for(let j=i+1;j<ground.length;j++){const a=ground[i],b=ground[j],o=a.x<b.x+b.w-1e-6&&b.x<a.x+a.w-1e-6&&a.y<b.y+b.h-1e-6&&b.y<a.y+a.h-1e-6;ok(!o,fl+'F: かさなる '+a.kind+'('+a.label+') / '+b.kind+'('+b.label+')');}
  // へや（案内と フロアマップ）: なまえ・ことばは ひらがな、いろが ある、フロアマップに でる
  const zs=M.ZONES[fl];ok(zs&&zs.length>=4,fl+'F: へやが すくない');
  ok(new Set(zs.map(z=>z.id)).size===zs.length,fl+'F: へやの id が かさなる');
  for(const z of zs){kana(z.name,'へや');kana(z.intro,'へやの 案内');ok(z.intro.split('\n').every(l=>l.length<=20),'へやの 案内は 1ぎょう 20もじ まで（375 の はばで おりかえさない）: '+z.id);ok(!!R.MallArt.SHOP['mu_'+z.id],'へやの いろが ない '+z.id);ok(z.x>=0&&z.y>=0&&z.x+z.w<=room.w&&z.y+z.h<=room.h,'へやが はみだす '+z.id);let any=false;for(let y=z.y;y<z.y+z.h;y++)for(let x=z.x;x<z.x+z.w;x++)if(sc.route(x,y)!==null)any=true;ok(any,fl+'F: はいれない へや '+z.id);}
  const places=R.MallGuide.places(room);ok(zs.every(z=>places.some(p=>p.zone&&p.zone.shop==='mu_'+z.id)),fl+'F: フロアマップに でない へや '+zs.filter(z=>!places.some(p=>p.zone&&p.zone.shop==='mu_'+z.id)).map(z=>z.id));
  // 絵: 什器の SVG（NaN・undefined なし・id は ひとつ）と かべ
  for(const f of room.fixtures){const m=A.model(f);if(!m)continue;ok(!/NaN|undefined/.test(m.svg),fl+'F: 絵が こわれて いる '+f.kind);const ids=[...m.svg.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);ok(new Set(ids).size===ids.length,fl+'F: SVG の id が かさなる '+f.kind);}
  for(const side of ['north','west']){const w=A.wallSvg(room,side);ok(!/NaN|undefined/.test(w.svg),fl+'F: かべの 絵 '+side);const ids=[...w.svg.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);ok(new Set(ids).size===ids.length,fl+'F: かべの id が かさなる '+side);}
}
// ---- 階の つながり: 3F → 1F（ながい エスカレーター）→ 2F → 3F（かいだん）。どの 階からも もどれる。ついた マスに たてる ----
for(const [from,to,spawn,label] of links){const r=D.floors[to],sc=routeFrom(r,r.spawn);ok(sc.walkable(...spawn)&&sc.route(...spawn)!==null,from+'F → '+to+'F（'+label+'）の ついた マス');}
const has=(a,b)=>links.some(([f,t])=>f===a&&t===b);
ok(has(3,1)&&has(1,3)&&has(1,2)&&has(2,1)&&has(2,3)&&has(3,2),'階の つながり（3F⇔1F・1F⇔2F・2F⇔3F）');
// ---- ほねの 台: 10しゅ 1つずつ（1F・ドーム）。寄贈の ようすで 絵の キーが かわる（有限）----
const stands=D.floors[1].fixtures.filter(f=>f.kind==='dinostand');
ok(stands.length===R.FOSSIL_DATA.dinos.length&&R.FOSSIL_DATA.dinos.every(d=>stands.filter(f=>f.dino===d.id).length===1),'ほねの 台は 10しゅ 1つずつ');
for(const f of stands){const d=R.Fossils.dino(f.dino);ok(f.len<=f.w&&f.action==='stand'&&f.obj==='mu_'+d.id&&f.height>26,'ほねの 台の かたち '+f.dino);ok(R.MUSEUM_DATA.buildings.museum.objects.some(o=>o.id===f.obj&&o.dino===d.id),'MUSEUM_DATA に ない 台 '+f.obj);}
const d0=R.Fossils.dino('trex'),b0=A.bits(d0);ok(b0===d0.art.parts.map(()=>'0').join(''),'寄贈 0 の ビット');
R.Save.d.museum.bones['trex.skull']='2026-10-2';const b1=A.bits(d0);ok(b1[0]==='1'&&b1.slice(1)===b0.slice(1),'寄贈した ほねの ビット');
const keys=new Set();for(const d of R.FOSSIL_DATA.dinos)for(let k=0;k<=d.art.parts.length;k++)keys.add(d.id+':'+'1'.repeat(k)+'0'.repeat(d.art.parts.length-k));ok(keys.size<=80,'ほねの 絵の キーは かぎられる');
// ---- 説明（INFO と MUSEUM_DATA.info）: ことばは ひらがな・絵が ある ----
for(const [k,v] of Object.entries(M.INFO)){kana(v.name,'説明の なまえ '+k);kana(v.text,'説明 '+k);const svg=A.iconSvg(v.icon||k,120,'t'+k);ok(!/NaN|undefined/.test(svg)&&svg.startsWith('<svg'),'説明の 絵 '+k);}
for(const k of Object.keys(R.MUSEUM_DATA.info))ok(!/NaN|undefined/.test(A.iconSvg(k,120,'u'+k)),'説明の 絵 '+k);
ok(['futaba','kabutogani','gyoryu','stromatolite','anomalocaris','dunkle','ichthyostega','archaeo','meteorite','mammoth','globe','volcano','strata','skull'].every(k=>M.INFO[k]),'2F・1F の 説明が そろう');
// ---- 町の 入口 → この 館の 3F（まえの 館の マップは のこす・セーブは あたらしい 館へ）----
const city=R.MAP_DEFS.city.buildings.find(b=>b.id==='city_museum');ok(city&&city.act.type==='indoor'&&city.act.map==='museum'&&R.MAP_DEFS.museum,'池袋の はくぶつかんの 入口');
let went=null;const goto=R.Game.goto;R.Game.goto=(scene,p)=>{went={scene,p};};
const fake={mapId:'city',busy:false};ok(R.Museum.enter(fake,city.act)&&fake.busy&&went&&went.scene==='venue'&&went.p.venue==='museum','町の 入口から 館へ '+JSON.stringify(went));
const o=R.MUSEUM_DATA.buildings.museum.outside;ok(went.p.back.map==='city'&&went.p.back.x===o.front[0]&&went.p.back.y===o.front[1],'館を でると 入口の まえ');
R.Game.goto=goto;
// ---- しらべる ことば ----
for(const fl of [1,2,3])for(const f of D.floors[fl].fixtures)if(f.kind==='npc'&&f.text)kana(f.text,'おきゃくさんの ことば');
console.log(`Dino museum: ${n} checks; 3 floors (3F entrance → long escalator → 1F dome → 2F earth and life → stairs to 3F), ${stands.length} skeleton stands, ${Object.keys(M.INFO).length} new exhibit texts, zones on the floor map, kana-only words, finite art keys, entrance redirected to the new hall`);
