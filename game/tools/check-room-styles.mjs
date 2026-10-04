// かべがみ 15しゅ・ゆか 15しゅ（js/room-styles.js・UI-90）の 検査:
// かず（なかまごとに 5）・id と なまえ（ひらがな・カタカナ）・ねだん（3ばい）と いごこち・もようの 絵（かべ 4とおり・ゆか 2とおり・見本 64）が こわれない・
// SVG の id が かさならない・ゆかは わくの そとに でない（clipPath）・まえの もようは かわらない・かぐやの ならびと ふだ・セーブの かたちは かわらない
import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {RoomStyles:RS,WALLPAPERS,FLOORS,WALL_INDEX,FLOOR_INDEX,HomeDesign,Art,Save,BUY_SHOPS,SlowLifePrices}=gameContext();
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const KANJI=/[一-鿿]/,TAGS=['svg','g','defs','clipPath','linearGradient','rect','circle','ellipse','path','polygon','stop'];
const svgOk=(svg,what)=>{
  ok(typeof svg==='string'&&svg.length>60&&!/NaN|undefined|Infinity|null/.test(svg),what+': 絵が こわれている');
  for(const t of TAGS){const open=(svg.match(new RegExp(`<${t}[\\s>]`,'g'))||[]).length,self=(svg.match(new RegExp(`<${t}\\b[^>]*/>`,'g'))||[]).length,close=(svg.match(new RegExp(`</${t}>`,'g'))||[]).length;ok(open-self===close,`${what}: <${t}> の かず`);}
  const ids=[...svg.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(ids).size===ids.length,what+': おなじ id が ある '+ids.join());
  for(const m of svg.matchAll(/url\(#([^)]+)\)/g))ok(ids.includes(m[1]),what+': url(#'+m[1]+') が ない');
};
// 1. かず・なかま
ok(RS.WALLS.length===15&&RS.FLOORS.length===15,'かべがみ・ゆかは 15しゅずつ');
for(const [list,idx] of [[RS.WALLS,WALL_INDEX],[RS.FLOORS,FLOOR_INDEX]]){
  const by={};for(const id of list){const it=idx[id];ok(it&&it.style===RS.groupOf(id)&&RS.GROUPS[it.style],id+': なかまが ない');by[it.style]=(by[it.style]||0)+1;}
  ok(JSON.stringify(by)===JSON.stringify({cute:5,cool:5,concept:5}),'なかまごとに 5しゅ '+JSON.stringify(by));
}
ok(JSON.stringify(Object.values(RS.GROUPS))==='["かわいい","かっこいい","コンセプト"]','なかまの なまえ');
// 2. id・なまえ・ねだん・いごこち
const all=[...WALLPAPERS,...FLOORS];
ok(new Set(WALLPAPERS.map(w=>w.id)).size===WALLPAPERS.length&&new Set(FLOORS.map(f=>f.id)).size===FLOORS.length,'id が かさなる');
ok(new Set(all.map(w=>w.name)).size===all.length,'なまえが かさなる');
const PRICE={cute:SlowLifePrices.price('wall',380),cool:SlowLifePrices.price('wall',420),concept:SlowLifePrices.price('wall',520)};
ok(PRICE.cute===1140&&PRICE.cool===1260&&PRICE.concept===1560,'ねだんは かべがみと おなじ 3ばい '+JSON.stringify(PRICE));
for(const id of [...RS.WALLS,...RS.FLOORS]){
  const it=WALL_INDEX[id]||FLOOR_INDEX[id],wall=!!WALL_INDEX[id];
  ok(it&&(wall?/^wp_/:/^fl_/).test(id)&&!(WALL_INDEX[id]&&FLOOR_INDEX[id]),id+': id の かたち');
  ok(!KANJI.test(it.name)&&it.name.replace(/ /g,'').length<=7&&/^[ぁ-んァ-ヶー ]+$/.test(it.name),id+': なまえは ひらがな・カタカナ 7もじ まで（375 の カードで 1ぎょう）: '+it.name);
  ok(it.price===PRICE[it.style]&&it.comfort===(it.style==='concept'?5:4)&&!it.rare,id+': ねだん・いごこち '+it.price+'/'+it.comfort);
  ok(RS.has(it.pat)&&RS.isFloor(it.pat)===!wall&&/^#[0-9A-F]{6}$/i.test(it.base)&&/^#[0-9A-F]{6}$/i.test(it.c2),id+': もよう・いろ');
}
// 3. もようの 絵: かべ（L × H）・ゆか（W × D）・見本（64）・へや ぜんぶ
const H=HomeDesign.H,{standard:S1,expanded:S2}=HomeDesign.sizes;
for(const id of RS.WALLS){const p=WALL_INDEX[id];for(const L of [S1.d,S1.w,S2.d,S2.w])svgOk(`<svg xmlns="http://www.w3.org/2000/svg">${HomeDesign.texture(p,L,H)}</svg>`,`${id} ${L}×${H}`);
  for(const s of [S1,S2])svgOk(HomeDesign.roomSvg(id,'fl_wood',s),`へや ${id} ${s.w}`);svgOk(Art.iconSvg('wall',id),'見本 '+id);}
for(const id of RS.FLOORS){const p=FLOOR_INDEX[id];for(const s of [S1,S2]){const t=HomeDesign.texture(p,s.w,s.d);svgOk(`<svg xmlns="http://www.w3.org/2000/svg">${t}</svg>`,`${id} ${s.w}×${s.d}`);
  // ゆかは きりぬきが ない ので じぶんの clipPath で わくの なかに（いちばん そとの g）
  const m=/^<defs><clipPath id="([^"]+)"><rect width="([\d.]+)" height="([\d.]+)"\/><\/clipPath><\/defs><g clip-path="url\(#\1\)">[\s\S]*<\/g>$/.exec(t);ok(m&&+m[2]===s.w&&+m[3]===s.d,id+': ゆかの もようが わくの そとに でる');}
  for(const s of [S1,S2])svgOk(HomeDesign.roomSvg('wp_cream',id,s),`へや ${id} ${s.w}`);svgOk(Art.iconSvg('floor',id),'見本 '+id);}
// あたらしい かべ と ゆかの くみあわせ（id が かさならない）
for(const w of RS.WALLS)for(const f of RS.FLOORS)svgOk(HomeDesign.roomSvg(w,f,S1),`へや ${w}/${f}`);
// 見本は もようを 半分に（64 で もようの なかみが みえる）・よぶ たびに id が かわる
{const a=HomeDesign.texture(WALL_INDEX.wp_heart,64,64),b=HomeDesign.texture(WALL_INDEX.wp_heart,480,230);ok(a.length<b.length&&/<path/.test(a),'見本の ハート');
 const g1=HomeDesign.texture(WALL_INDEX.wp_sea,64,64),g2=HomeDesign.texture(WALL_INDEX.wp_sea,64,64),id=(t)=>/id="([^"]+)"/.exec(t)[1];ok(id(g1)!==id(g2),'グラデーションの id が おなじ');}
// 4. まえの もようは かわらない（まえの かべがみ・ゆかの もようは RoomStyles を とおらない）
for(const w of WALLPAPERS.filter(w=>!w.style))ok(!RS.has(w.pat)&&!/rs\d/.test(HomeDesign.texture(w,120,80)),'まえの かべがみが かわった '+w.id);
for(const f of FLOORS.filter(f=>!f.style))ok(!RS.has(f.pat)&&!/rs\d/.test(HomeDesign.texture(f,120,80)),'まえの ゆかが かわった '+f.id);
ok(WALLPAPERS.length===30&&FLOORS.length===27,'かべがみ 30・ゆか 27 '+WALLPAPERS.length+'/'+FLOORS.length);
// 5. かぐやの ならび: あたらしい もの（かわいい → かっこいい → コンセプト）が さき・まえの ものは そのあと・かぐ／かべかざりは かわらない
for(const [tab,ids] of [['wp',RS.WALLS],['fl',RS.FLOORS]]){
  const list=BUY_SHOPS.furniture.items(tab).map(it=>it.id);
  ok(JSON.stringify(list.slice(0,15))===JSON.stringify(ids)&&list.slice(15).every(id=>!RS.groupOf(id))&&list.length===(tab==='wp'?29:26),tab+': かぐやの ならび '+list.slice(0,3).join());
}
ok(BUY_SHOPS.furniture.items('floor').every(f=>!RS.groupOf(f.id)),'かぐの タブに かべがみが まざる');
// ふだ（カードの ひだり うえの なかまの なまえ）は DOM が いるので スモーク「room-styles」で みる
// 6. セーブ: かたちは かわらない（はじめは クリームいろ・フローリング・あたらしい id は もって いない）
const fresh=Save.fresh();ok(fresh.room.wall==='wp_cream'&&fresh.room.floor==='fl_wood'&&[...RS.WALLS,...RS.FLOORS].every(id=>!fresh.room.wallpapers[id]&&!fresh.room.floors[id]),'はじめの セーブ');
console.log(`✓ room styles (UI-90): ${n} checks — 15 wallpapers + 15 floors (cute / cool / concept × 5), names, prices ×3, patterns at 4 wall and 2 floor sizes and 64 swatches, unique SVG ids, floors clipped, old patterns untouched, shop order (tags: smoke room-styles), save shape`);
