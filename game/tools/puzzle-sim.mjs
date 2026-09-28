// 可視盤面だけを評価する操作モデル。未来の補充色を読まない。人の実測ではない。
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
export const {NakayoshiPuzzle,PUZZLE_RULES}=vm.runInNewContext(readFileSync(new URL('../js/puzzle-engine.js',import.meta.url),'utf8')+';({NakayoshiPuzzle,PUZZLE_RULES})');
export function candidates(game,maxLength=10,budget=2200){
  const found=[],b=game.s.board;let visits=0;
  const visit=p=>{
    if(++visits>budget)return;
    if(p.length>=3){const r=game.preview(p);if(r)found.push({p:[...p],r});}
    if(p.length>=4&&game.adjacent(p.at(-1),p[0])){const loop=[...p,p[0]];found.push({p:loop,r:game.preview(loop)});}
    if(p.length>=maxLength)return;
    for(const i of game.around(p.at(-1)))if(b[i]===b[p[0]]&&!p.includes(i))visit([...p,i]);
  };
  for(let i=0;i<36;i++)visit([i]);return found;
}
export const profiles={
  triples:{label:'3個消去中心',think:4.6,maxLength:3,budget:300,selection:'first'},
  learning:{label:'形を探す練習中',think:3.0,maxLength:6,budget:500,selection:'limited'},
  skilled:{label:'特殊形を使い分ける',think:1.9,maxLength:10,budget:2200,selection:'best'},
  expert:{label:'高速・長鎖を選ぶ',think:1.1,maxLength:12,budget:3500,selection:'best'},
};
export function simulate(seed,profile){
  const g=new NakayoshiPuzzle(seed);
  while(!g.s.done){
    let list=candidates(g,profile.maxLength,profile.budget);
    if(profile.selection==='first')list=list.slice(0,1);else if(profile.selection==='limited')list=list.slice(0,35);
    list.sort((a,b)=>{
      const value=x=>(x.r.points+x.r.seconds*45+(x.r.shape!==g.s.lastShape&&x.r.shape!=='chain'?90:0))/(1+(x.p.length-3)*.06);
      return value(b)-value(a);
    });
    const move=list[0];
    if(!move)throw new Error('No legal move');
    g.advance(profile.think+Math.max(0,move.p.length-3)*.12);g.play(move.p);
  }
  return g.s;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const count=Number(process.argv[2])||200;
  const prizes=vm.runInNewContext(readFileSync(new URL('../js/puzzle-prizes.js',import.meta.url),'utf8').split('const PuzzlePrizeArt')[0]+';PUZZLE_PRIZES');
  const report={seeds:count,seedFormula:'i * 7919, i = 1..N',note:'可視盤面を評価する操作モデル。人の達成率や指での操作性の実測ではない。',profiles:{}};
  for(const [id,profile]of Object.entries(profiles)){
    const runs=Array.from({length:count},(_,i)=>simulate((i+1)*7919,profile)),scores=runs.map(s=>s.score).sort((a,b)=>a-b),q=p=>scores[Math.floor((count-1)*p)];
    report.profiles[id]={...profile,p10:q(.1),median:q(.5),p90:q(.9),max:q(1),meanSeconds:+(runs.reduce((n,s)=>n+s.elapsed,0)/count).toFixed(1),prizeRate:Object.fromEntries(prizes.map(p=>[p.score,+(runs.filter(s=>s.score>=p.score).length/count*100).toFixed(1)]))};
  }
  console.log(JSON.stringify(report,null,2));
}
