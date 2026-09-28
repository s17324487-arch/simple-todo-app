import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {Save,TownQuiz:Q,TOWN_QUIZ_DATA:data,U,Sound,localStorage,QuizPrizes}=gameContext();
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
Q._loot=originalLoot;
assert.equal(original.coins,87654);
console.log('✓ quiz transactions: correct/wrong, prizes, quota failure, reload, double answer, stale attempt, daily limit, midnight, all 50 questions');
