import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
import {NakayoshiPuzzle,simulate,profiles} from './puzzle-sim.mjs';
const R=gameContext(),{Save,PuzzleArcade,PUZZLE_PRIZES}=R;
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
const copy=o=>JSON.parse(JSON.stringify(o));
function fixture(path){const g=new NakayoshiPuzzle(9);g.s.board=Array.from({length:36},(_,i)=>1+(i+Math.floor(i/6))%3);for(const i of path)g.s.board[i]=0;return g;}
for(const [path,shape,count]of [
  [[0,1,2],'chain',3],[[0,1,2,3],'line',6],[[0,6,12,18],'line',6],
  [[0,1,2,8,14],'elbow',11],[[0,1,7,6,0],'loop',4],[[0,1,7,13,14,20,21],'nova',12],
]){
  const g=fixture(path),p=g.preview(path);ok(p?.shape===shape,`${path}: shape ${p?.shape}`);
  if(shape!=='nova')ok(p.clear.length===count,`${shape}: clear area`);
  const before=g.snapshot(),r=g.play(path);ok(r.points>0&&g.s.score===r.points&&g.s.remaining>before.remaining,`${shape}: score/time`);
  ok(g.s.board.length===36&&g.s.board.every(v=>v>=0&&v<g.types)&&!!g.findMove(),`${shape}: refill/dead board`);
  ok(g.play(path)===null,'Input during settle animation must not score');
}
{
  const g=fixture([0,1,2,3,6,7]);g.s.board[30]=0;
  ok(g.preview([0,1,7,6,0]).clear.includes(30),'Closed loop must clear disconnected same color');
  ok(g.preview([0,1,7,6]).shape==='chain','Unclosed square must not activate');
  const before=JSON.stringify(g.s);
  for(const p of [[0,7,1],[0,1],[0,1,0],[0,1,2,1],[0,1,2,30],[0,1,99],[0,1,NaN],[0,1,8]])ok(g.play(p)===null,'Illegal path accepted '+p);
  ok(JSON.stringify(g.s)===before,'Invalid path mutated score, timer or RNG');
}
{
  const a=new NakayoshiPuzzle(12),b=new NakayoshiPuzzle(12);a.s.remaining=b.s.remaining=65;
  a.advance(47.25);for(let i=0;i<189;i++)b.advance(.25);
  ok(Math.abs(a.s.remaining-b.s.remaining)<1e-6&&a.types===5,'Clock depends on frame rate / color stage');
  const restored=new NakayoshiPuzzle(99,a.snapshot()),path=a.findMove();a.play(path);restored.play(path);
  ok(JSON.stringify(a.s)===JSON.stringify(restored.s),'Resume changes board, RNG, score or extension');
  restored.advance(99999);ok(restored.s.done&&restored.play(restored.findMove())===null,'A clear after time up revived the run');
}
{
  const g=fixture([0,1,2]);g.s.remaining=65;const r=g.play([0,1,2]);ok(g.s.remaining===65&&r.added===0,'Time cap');
  g.advance(.25);const before=g.s.remaining;ok(g.shuffle()&&Math.abs(g.s.remaining-(before-5))<1e-9&&g.s.combo===0,'Shuffle cost/combo');
  for(let i=0;i<2;i++){g.advance(.25);ok(g.shuffle(),'Three paid shuffles allowed');}g.advance(.25);ok(!g.shuffle(),'Shuffle cap');
  const h=fixture([0,1,2,3]);h.s.elapsed=90;const late=h.preview([0,1,2,3]),early=fixture([0,1,2,3]).preview([0,1,2,3]);
  ok(h.types===6&&late.seconds<early.seconds&&h.drain>1,'Late game not harder');
}
{
  const g=fixture([0,1,2,3]);g.play([0,1,2,3]);ok(g.s.charge===1,'First special charge');g.advance(.3);
  g.s.board=fixture([0,1,7,6,0]).s.board;g.play([0,1,7,6,0]);ok(g.s.charge===3,'Shape variety bonus');g.advance(.3);
  g.s.board=fixture([0,1,2,8,14]).s.board;g.play([0,1,2,8,14]);ok(g.s.charge===5,'Cross charge');g.advance(.3);
  g.s.board=fixture([0,1,2,3]).s.board;const r=g.play([0,1,2,3]);ok(r.feverStarted&&g.s.fever===8,'Fever trigger');
  g.advance(4);ok(g.s.combo===0,'Combo expiry');
}
for(let i=1;i<=50;i++){
  const g=new NakayoshiPuzzle(i);for(let n=0;n<40&&!g.s.done;n++){ok(!!g.findMove(),'Dead board seed '+i);g.advance(2.4);g.play(g.findMove());}
}
// Additive migration must not reinterpret the old customer's percentage record as a puzzle score.
Save.reset();const old=copy(Save.d);delete old.puzzle;old.coins=987654;old.shops.link={lv:5,rep:99,best:100,plays:46};
const original=copy(old);Save.d=Save.migrate(old);
ok(Save.KEY==='pokapoka-town-save-v1'&&Save.SCHEMA===1,'Save identity changed');
for(const k of ['coins','shops','furn','wardrobe','room','rooms','stats'])ok(JSON.stringify(Save.d[k])===JSON.stringify(original[k]),'Legacy data changed: '+k);
ok(Save.d.puzzle.best===0,'Old percentage became score');
const back={map:'city',x:1,y:1,dir:'down'};
Save.d.coins=79;ok(PuzzleArcade.start(back)===null&&Save.d.coins===79,'Insufficient balance charged');
Save.d.coins=500;const run=PuzzleArcade.start(back,false,34);
ok(run&&Save.d.coins===420&&PuzzleArcade.start(back)===run&&Save.d.coins===420,'Entry double debit / resume');
ok(PuzzleArcade.start(back,true)===null,'Practice overwrites paid run');
run.state.score=PUZZLE_PRIZES[2].score;run.state.done=true;
const result=PuzzleArcade.settle(run);ok(result.prizes.length===3&&Save.d.puzzle.best===run.state.score&&Save.d.puzzle.plays===1,'Cumulative threshold awards');
ok(PuzzleArcade.settle(run)===result&&Save.d.puzzle.plays===1,'Duplicate settlement');
Save.d=Save.migrate(copy(Save.d));const again=PuzzleArcade.start(back,false,35);again.state.score=run.state.score;again.state.done=true;
ok(PuzzleArcade.settle(again).prizes.length===0&&PUZZLE_PRIZES.slice(0,3).every(p=>Save.d.furn[p.id]===1),'Reload / repeat duplicated reward');
const practice=PuzzleArcade.start(back,true,35),prev=JSON.stringify(Save.d);practice.state.score=999999;PuzzleArcade.settle(practice);
ok(JSON.stringify(Save.d)===prev,'Free practice changed money, stats or prizes');
const write=Save.write;Save.write=()=>{};const coins=Save.d.coins;
ok(PuzzleArcade.start(back,false,44)===null&&Save.d.coins===coins&&!Save.d.puzzle.active,'Failed save charged entry');Save.write=write;
const failedRun=PuzzleArcade.start(back,false,45),before=copy(Save.d);failedRun.state.score=999999;Save.write=()=>{};
ok(PuzzleArcade.settle(failedRun)===null&&JSON.stringify(Save.d.furn)===JSON.stringify(before.furn)&&!!Save.d.puzzle.active,'Failed award save did not roll back');Save.write=write;
ok(PuzzleArcade.settle(failedRun)?.prizes.length===2,'Award retry failed');
for(const p of PUZZLE_PRIZES){
  const f=R.FURN_INDEX[p.id];ok(f.rare&&f.price===0&&f.interactive,'Prize not exclusive/interactive');
  for(const shop of Object.values(R.BUY_SHOPS))for(const [tab]of shop.tabs)ok(!shop.items(tab).some(it=>it.id===p.id),'Prize sold in shop');
  for(const flip of [false,true]){const m=R.HomeDesign.model(p.id,{flip});ok(m.w>0&&m.h>0&&m.full.includes('<svg')&&!/NaN|undefined/.test(m.full),'Prize model broken');}
}
ok(!R.MG_TASKS.link&&R.SHOPS.link.arcade&&R.SCENES.puzzle,'Puzzle still uses customer rounds');
for(const id of ['triples','skilled','expert']){const s=simulate(7919,profiles[id]);ok(s.done&&s.elapsed<=180&&s.score>0,'Run did not terminate: '+id);}
console.log(`Puzzle check: ${checks} passed (shapes, clock, RNG, migration, payments, prizes, save failures).`);
