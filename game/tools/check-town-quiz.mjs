import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,TownQuiz:Q,TOWN_QUIZ_DATA:data,U,Sound,localStorage,QuizPrizes,MAP_DEFS,WorldMap,TALKS}=gameContext();
const copy=x=>JSON.parse(JSON.stringify(x));
Sound.se=()=>{};
const reset=()=>{Save.d=Save.fresh();Save.d.coins=87654;Save.write();Q._working=false;};
reset();
const originalLoot=Q._loot;
// The actual exclusive prize IDs are obtained from the catalog, not duplicated in this check.
const rare=QuizPrizes.items.find(p=>p.tier==='rare').id,luxury=QuizPrizes.items.find(p=>p.tier==='luxury').id;
Q._loot=(level,eligible)=>eligible?[{coins:Q.LEVELS[level].coins},{bag:'deza_tart',n:1},{furn:rare},{furn:luxury}]:[];
let active=Q.start(3);assert(active&&active.eligible);
const pending=copy(Save.d.townQuiz.active), original=copy(Save.d);
Q.cancel();Save.d=Save.migrate(JSON.parse(localStorage.getItem(Save.KEY)));active=Q.start(1);
assert.equal(active.token,pending.token);assert.equal(active.level,3);assert.deepEqual(copy(Save.d.townQuiz.active),pending);
const result=Q.answer(active.correctIndex);assert(result.correct);assert.equal(Save.d.coins,87754);assert.equal(Save.d.bag.deza_tart,1);assert.equal(Save.d.furn[rare],1);assert.equal(Save.d.furn[luxury],1);
assert.equal(Q.answer(active.correctIndex),false);assert.equal(Save.d.coins,87754);assert.equal(Save.d.townQuiz.plays,1);
Save.d=Save.migrate(JSON.parse(localStorage.getItem(Save.KEY)));assert.equal(Q.answer(active.correctIndex),false);assert.equal(Save.d.furn[luxury],1);
active=Q.start(2);const beforeWrong=copy(Save.d);assert.equal(Q.answer((active.correctIndex+1)%active.choices.length).correct,false);for(const k of ['coins','bag','furn','wardrobe'])assert.deepEqual(copy(Save.d[k]),beforeWrong[k]);
assert.equal(Q.answer(-1),false);

// A quota failure at either boundary must leave both the saved and in-memory balance untouched.
const set=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota');};
const beforeStart=copy(Save.d);assert.equal(Q.start(1),false);assert.deepEqual(copy(Save.d),beforeStart);localStorage.setItem=set;
active=Q.start(1);const beforeAnswer=copy(Save.d), raw=localStorage.getItem(Save.KEY);localStorage.setItem=()=>{throw new Error('quota');};
assert.equal(Q.answer(active.correctIndex),false);assert.deepEqual(copy(Save.d),beforeAnswer);assert.equal(localStorage.getItem(Save.KEY),raw);localStorage.setItem=set;
assert(Q.answer(active.correctIndex).correct);assert.equal(Save.d.furn[luxury],2);

// A stale in-memory pending question cannot distribute its prize for a second time.
const savedAfter=localStorage.getItem(Save.KEY);Save.d=copy(beforeAnswer);assert.equal(Q.answer(active.correctIndex),false);assert.equal(localStorage.getItem(Save.KEY),savedAfter);assert.equal(Save.d.townQuiz.active,null);const syncCoins=Save.d.coins;Save.write();assert.equal(JSON.parse(localStorage.getItem(Save.KEY)).townQuiz.active,null);assert.equal(Q.answer(active.correctIndex),false);assert.equal(Save.d.coins,syncCoins);Save.d=Save.migrate(JSON.parse(savedAfter));

reset();for(let i=0;i<10;i++){active=Q.start(1);assert(active.eligible);Q.answer(active.correctIndex);}const capped=copy(Save.d);active=Q.start(3);assert(!active.eligible);assert(Q.answer(active.correctIndex).correct);for(const k of ['coins','bag','furn'])assert.deepEqual(copy(Save.d[k]),capped[k]);assert.equal(Q.state().daily.remaining,0);

// A held question belongs to the day it started. New-day allowance starts after it is answered.
reset();const today=U.today;U.today=()=> '2026-9-29';active=Q.start(2);U.today=()=> '2026-9-30';assert.equal(Q.start(3).token,active.token);Q.answer(active.correctIndex);assert.equal(Save.d.townQuiz.daily.day,'2026-9-29');active=Q.start(3);assert(active.eligible);assert.equal(active.slot,1);assert.equal(active.day,'2026-9-30');U.today=today;

// Each level is a shuffle bag. No repeat inside a round, or across the round boundary.
Q._loot=()=>[];
for(const level of [1,2,3]){reset();const seen=new Set(),count=data.filter(q=>q.level===level).length;let previous;
 for(let i=0;i<count;i++){active=Q.start(level);assert(!seen.has(active.id));seen.add(active.id);assert.equal(new Set(active.choices).size,active.choices.length);previous=active.id;Q.answer(active.correctIndex);}
 assert.equal(seen.size,count);assert.notEqual(Q.start(level).id,previous);
}

// クイズ係（オーナーの FB 2026-10-01「クイズを出す人をネリカスタウンに3人、池袋駅に3人配置しなさい」）
const hostAt=id=>{for(const [m,d] of Object.entries(MAP_DEFS)){const n=(d.npcs||[]).find(n=>n.id===id);if(n)return {m,n};}return null;};
const hosts=Object.keys(Q.HOSTS).map(id=>[id,hostAt(id)]);
assert.equal(hosts.filter(([,w])=>w&&w.m==='town').length,3,'ネリカスタウンの クイズ係は 3人');
assert.equal(hosts.filter(([,w])=>w&&w.m==='city').length,3,'池袋の クイズ係は 3人');
for(const [id,w] of hosts){assert(w&&Q.host(w.n)&&Q.HOSTS[id].map===w.m,'クイズ係が いない '+id);assert(/^クイズずきの /.test(w.n.name)&&!/[一-鿿]/.test(w.n.name),'クイズ係の なまえ '+w.n.name);assert(TALKS[w.n.talk],'クイズ係の 会話 '+id);
  assert.equal(Object.values(MAP_DEFS).flatMap(d=>d.npcs||[]).filter(n=>n.id===id).length,1,'クイズ係が 2か所に いる '+id);
  assert(!new WorldMap(w.m).isSolid(w.n.x,w.n.y),'クイズ係が かべの 中 '+id);}
assert.equal(new Set(hosts.map(([,w])=>w.n.name)).size,hosts.length,'クイズ係の なまえが かさなる');
// 池袋の 3人は 駅の 入口の まえの ひろば（入口から 8マス いない）
{const st=MAP_DEFS.city.buildings.find(b=>b.id==='city_station'),door=[st.x+st.door,st.y+st.h];
 for(const [id,w] of hosts.filter(([,w])=>w.m==='city'))assert(Math.abs(w.n.x-door[0])+Math.abs(w.n.y-door[1])<=8&&w.n.y>=st.y+st.h,'池袋えきの まえに いない '+id+' '+w.n.x+','+w.n.y);}
// とくいな 分野: ある 分野だけ・どの 難易度にも 1もん いじょう・なまえは かな
{const topics=new Set(data.map(q=>q.topic));
 for(const [id,h] of Object.entries(Q.HOSTS))if(h.topics){assert(h.topics.length&&h.topics.every(t=>topics.has(t)),'分野 '+id);for(const lv of [1,2,3])assert(data.some(q=>q.level===lv&&h.topics.includes(q.topic)),'難易度 '+lv+' の とくいな 問題が ない '+id);assert(h.theme&&!/[一-鿿]/.test(h.theme),'とくいの なまえ '+id);}else assert(h.theme===null,'ぜんぶの 係に とくいは ない '+id);}
// 係に はなしかけると その 係の とくいが でる（画面が なくても うごく）
{const w=hostAt('ike_quiz_art');Q.talk(w.n,null,{name:'x',face:''});const st=Q.state();assert(st.host==='ike_quiz_art'&&st.theme==='げいじゅつと おんがく'&&st.hosts.length===6,'係の じょうたい '+JSON.stringify([st.host,st.theme]));Q.cancel();}
// とくいな 分野の 問題を さきに だす・一巡は みんなで 1つ（係を かえても 一巡するまで おなじ 問題は でない・さかいめでも つづけない）
Q._loot=()=>[];
for(const lv of [1,2,3]){
 const pool=data.filter(q=>q.level===lv);
 for(const hid of ['ike_quiz_history','neri_quiz_nature','neri_quiz_science','ike_quiz_art']){
  reset();Q._host=hid;const tp=Q.HOSTS[hid].topics,mine=pool.filter(q=>tp.includes(q.topic)).length,seen=[];let prev;
  for(let i=0;i<pool.length;i++){const a=Q.start(lv);assert(!seen.includes(a.id),'おなじ 問題 '+hid);seen.push(a.id);if(i<mine)assert(tp.includes(data.find(q=>q.id===a.id).topic),'とくいな 分野が さきに でない '+hid+' '+lv+' '+i);prev=a.id;Q.answer(a.correctIndex);}
  assert.equal(seen.length,pool.length);assert.notEqual(Q.start(lv).id,prev,'一巡の さかいめで おなじ 問題 '+hid);
 }
 reset();const seen=new Set(),order=['neri_quiz_nature','ike_quiz_art','town_walker3','ike_quiz_history','ike_quiz_all','neri_quiz_science'];
 for(let i=0;i<pool.length;i++){Q._host=order[i%order.length];const a=Q.start(lv);assert(!seen.has(a.id),'係を かえると おなじ 問題');seen.add(a.id);Q.answer(a.correctIndex);}
 assert.equal(seen.size,pool.length,'係を かえても 一巡で ぜんぶ');
}
Q._host=null;
Q._loot=originalLoot;
assert.equal(original.coins,87654);
console.log('✓ quiz transactions: correct/wrong, prizes, quota failure, reload, double answer, stale attempt, daily limit, midnight, all 50 questions; 6 quiz hosts (3 in Nerikasu, 3 at Ikebukuro station) with favourite topics first and one shared rotation');
