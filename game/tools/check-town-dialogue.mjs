import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameContext} from './game-context.mjs';

const g=gameContext(),{Save,TownDialogue,TOWN_DIALOGUE_DATA:D,TownFolk,UI,U,TOWN_QUIZ_DATA:Q,QuizPrizes,FURN_INDEX,HomeDesign,BAG_INDEX,localStorage}=g;
Save.d=Save.fresh();
const copy=x=>JSON.parse(JSON.stringify(x));
const ids=new Set();
const people=new Set(Object.values(g.MAP_DEFS).flatMap(m=>(m.npcs||[]).map(n=>n.id)));
let lineCount=0,routeCount=0;
const lines=ls=>{assert(ls.length>=2);for(const l of ls){assert(['npc','wanko','gachan','goji'].includes(l.speaker));assert.equal(typeof l.text,'string');assert(l.text.length>0);lineCount++;}};
assert(D.exchanges.length>=60);
for(const e of D.exchanges){assert(!ids.has(e.id));ids.add(e.id);lines(e.lines);assert(e.lines.length>=4);assert(e.lines.some(l=>l.speaker==='npc'));assert(e.lines.some(l=>l.speaker!=='npc'));assert((e.npcs||[]).every(id=>id==='*'||people.has(id)));}
assert.equal(D.stories.length,8);
for(const s of D.stories){
 assert(people.has(s.npc),`missing story npc ${s.npc}`);assert(s.nodes[s.start]);const reached=new Set();
 const walk=(id,path=[],depth=0,speakers=new Set())=>{
  assert(!path.includes(id),`cycle ${s.id}`);const n=s.nodes[id];assert(n,`missing ${s.id}/${id}`);reached.add(id);lines(n.lines);n.lines.forEach(l=>speakers.add(l.speaker));
  if(n.ending){assert(depth>=2,`${s.id} requires two decisions`);assert(s.followup[n.ending]);lines(s.followup[n.ending]);assert(['npc','wanko','gachan','goji'].every(x=>speakers.has(x)),`missing participant ${s.id}/${id}`);routeCount++;return;}
  assert(n.choices.length>=2);for(const c of n.choices){assert(c.label);walk(c.to,[...path,id],depth+1,new Set(speakers));}
 };walk(s.start);assert.equal(reached.size,Object.keys(s.nodes).length,`unreachable story node ${s.id}`);
}

// All branches use the real dialogue runner; optional interruptions retain the selected route.
const originalSay=UI.say, originalChoose=TownDialogue.choose;
UI.say=async()=>false;
const before=copy({coins:Save.d.coins,bag:Save.d.bag,furn:Save.d.furn,wardrobe:Save.d.wardrobe});
for(const story of D.stories){
 for(const a of [0,1])for(const b of [0,1]){
  delete Save.d.conversations.stories[story.id];let queue=[a,b];TownDialogue.choose=async()=>queue.shift()??-1;
  await TownDialogue.consult(story,{name:'test',face:''});assert(Save.d.conversations.stories[story.id].ending);assert.equal(queue.length,0);
 }
 delete Save.d.conversations.stories[story.id];let queue=[1,-1];TownDialogue.choose=async()=>queue.shift();await TownDialogue.consult(story,{name:'test',face:''});
 const pending=copy(Save.d.conversations.stories[story.id]);assert(!pending.ending);assert.equal(pending.path.length,1);
 Save.d=Save.migrate(JSON.parse(localStorage.getItem(Save.KEY)));assert.equal(Save.d.conversations.stories[story.id].node,pending.node);
 TownDialogue.choose=async()=>0;await TownDialogue.consult(story,{name:'test',face:''});assert(Save.d.conversations.stories[story.id].ending);
 let follow=[];UI.say=async(ls)=>{follow.push(...ls);return false;};TownDialogue.choose=async()=>-1;await TownDialogue.consult(story,{name:'test',face:''});assert(follow.length>=2);UI.say=async()=>false;
}
assert.deepEqual(copy({coins:Save.d.coins,bag:Save.d.bag,furn:Save.d.furn,wardrobe:Save.d.wardrobe}),before);
UI.say=originalSay;TownDialogue.choose=originalChoose;
for(const map of Object.values(g.MAP_DEFS))for(const n of map.npcs||[]){
 for(let i=0;i<12;i++){const e=TownDialogue.pick(n);if(e)assert(U.condScore(e.when,TownFolk.context(n.id))>=0);}
 assert((Save.d.conversations.recent[n.id]||[]).length<=8);
}

assert.equal(Q.length,50);assert.equal(new Set(Q.map(q=>q.id)).size,50);assert.equal(new Set(Q.map(q=>q.prompt)).size,50);
for(const level of [1,2,3])assert(Q.filter(q=>q.level===level).length>=15);
for(const q of Q){
 assert(q.choices.length>=3&&q.choices.length<=5);assert.equal(new Set(q.choices).size,q.choices.length);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);assert(q.explanation.length>=15);
 assert(q.sources.length>=2);assert.equal(new Set(q.sources.map(s=>s.url)).size,q.sources.length);for(const s of q.sources){assert(s.title&&s.evidence&&/^20\d\d-\d\d-\d\d$/.test(s.checked));assert(new URL(s.url).protocol==='https:');}
}
// ごうかは 4つ（UI-40 で ほしぞらの だんろ が ふえた。js/furniture-collection.js）
assert.equal(QuizPrizes.items.length,6);
for(const tier of ['rare','luxury']){
 const ps=QuizPrizes.items.filter(p=>p.tier===tier);assert.equal(ps.length,tier==='rare'?2:4);
 for(let i=0;i<ps.length;i++){const got=tier==='rare'?QuizPrizes.rollRare(()=>i/ps.length):QuizPrizes.rollLuxury(()=>i/ps.length);assert.equal(got.furn,ps[i].id);}
}
const art=new Set();
for(const p of QuizPrizes.items){const f=FURN_INDEX[p.id];assert(f&&f.rare&&f.quizPrize);if(p.tier==='luxury')assert(f.price>=10000);for(const flip of [false,true]){const m=HomeDesign.model(p.id,{flip});assert(m.w>0&&m.h>0&&m.footW>0&&m.footD>0);assert(m.full.includes('<svg'));assert(!/NaN|undefined/.test(m.full));art.add(m.full);}}
assert.equal(art.size,12);

// Original v1 fixture preserves balances/possessions and receives only additive defaults.
const old=JSON.parse(readFileSync(new URL('../tests/fixtures/save-v1.json',import.meta.url),'utf8'));
const preserved=copy(old);const migrated=Save.migrate(copy(old));for(const k of ['coins','bag','wardrobe','furn'])assert.deepEqual(copy(migrated[k]),preserved[k]);assert(migrated.conversations&&migrated.townQuiz);assert.equal(Save.KEY,'pokapoka-town-save-v1');assert.equal(Save.SCHEMA,2);
for(const id of ['deza_jelly','deza_ice','deza_tart'])assert(BAG_INDEX[id]);
console.log(`✓ dialogue: ${D.exchanges.length} exchanges / ${D.stories.length} stories / ${routeCount} routes; quiz: ${Q.length} sourced questions / ${QuizPrizes.items.length} prizes; save v1 preserved`);
