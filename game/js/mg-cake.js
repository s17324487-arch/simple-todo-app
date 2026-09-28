// 注文を覚えて、土台 → クリーム → 果物 → ろうそくを組み立てる。
const CAKE_BASES=[{id:'vanilla',name:'バニラ',col:'#F0D193'},{id:'cocoa',name:'ココア',col:'#987052'},{id:'tea',name:'まっちゃ',col:'#B3C58C'}];
const CAKE_CREAMS=[{id:'white',name:'しろい クリーム',col:'#FFF8E6'},{id:'pink',name:'いちご クリーム',col:'#EFB6C4'},{id:'brown',name:'チョコ クリーム',col:'#AE8068'}];
const CAKE_FRUITS=CREPE_TOPS.filter(t=>['ichigo','kiwi','blue'].includes(t.id));
class CakeTask extends TaskBase {
  constructor(sc,lv){
    super(sc,lv);
    this.want={base:lv===1?'vanilla':U.pick(CAKE_BASES.slice(0,lv===2?2:3)).id,cream:lv===1?'white':U.pick(CAKE_CREAMS.slice(0,lv===2?2:3)).id,fruit:U.pick(CAKE_FRUITS).id,count:U.randi(1,Math.min(5,lv+1)),candles:lv<3?0:U.randi(1,Math.min(5,lv))};
    this.made={base:lv===1?'vanilla':null,cream:lv===1?'white':null,fruit:null,count:0,candles:0};
    this.steps=lv===1?['fruit']:lv===2?['base','cream','fruit']:['base','cream','fruit','candles'];this.step=0;
    this.timeLimit=[26,34,38,34,30][lv-1];this.hideAfter=[0,0,7,5,3.5][lv-1];this.title='とくべつな ケーキを！';
  }
  layout(R){this.R=R;this.setup();}
  setup(){
    const R=this.R,stage=this.steps[this.step],top=R.y+R.h*.38,h=52;
    this.btns=[];
    const add=(list,field,y,columns=3)=>{const cells=gridBtns(R,list.length,columns,y,h);list.forEach((o,i)=>this.btns.push({...cells[i],label:o.name,fs:12,color:this.made[field]===o.id?'#F7D78E':'#FFF9ED',cb:()=>{this.made[field]=o.id;this.setup();}}));};
    if(stage==='base')add(CAKE_BASES.slice(0,this.lv===2?2:3),'base',top);
    if(stage==='cream')add(CAKE_CREAMS.slice(0,this.lv===2?2:3),'cream',top);
    if(stage==='fruit'){
      add(CAKE_FRUITS,'fruit',top);
      add(Array.from({length:5},(_,i)=>({id:i+1,name:(i+1)+'こ'})),'count',top+h+8,5);
    }
    if(stage==='candles')add(Array.from({length:6},(_,i)=>({id:i,name:i+'ほん'})),'candles',top);
    const y=R.y+R.h-52,w=(R.w-28)/2,ready=stage==='fruit'?this.made.fruit&&this.made.count:stage==='candles'||this.made[stage];
    this.btns.push({x:R.x+10,y,w,h:44,label:this.step?'ひとつ まえへ':'やりなおし',fs:13,cb:()=>{if(this.step)this.step--;else this.made={base:this.lv===1?'vanilla':null,cream:this.lv===1?'white':null,fruit:null,count:0,candles:0};this.setup();}});
    this.btns.push({x:R.x+18+w,y,w,h:44,label:this.step===this.steps.length-1?'できあがり！':'つぎへ ▶',fs:14,color:'#FFD54F',disabled:!ready,cb:()=>{if(this.step===this.steps.length-1){this.sc.finish(this.score());Sound.se('swish');}else{this.step++;this.setup();}}});
  }
  score(){return 100-Object.keys(this.want).reduce((n,k)=>n+(this.want[k]===this.made[k]?0:25),0)-this.sc.timePenalty()-this.peekPenalty();}
  timeout(){return Math.min(40,this.score()-25);}
  drawCake(ctx,x,y,scale,cake){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineWidth=2;ctx.strokeStyle=INK;
    ctx.fillStyle='#E3DDD0';ctx.beginPath();ctx.ellipse(0,23,72,24,0,0,7);ctx.fill();ctx.stroke();
    if(cake.base){
      ctx.fillStyle=CAKE_BASES.find(b=>b.id===cake.base).col;U.rr(ctx,-57,-21,114,48,12);ctx.fill();ctx.stroke();
      ctx.fillStyle='#FFF0D2';ctx.fillRect(-56,1,112,8);
      ctx.fillStyle=CAKE_CREAMS.find(c=>c.id===cake.cream)?.col||'#F0D193';ctx.beginPath();ctx.ellipse(0,-20,57,21,0,0,7);ctx.fill();ctx.stroke();
      if(cake.cream)for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(-50+i*12.5,-16+Math.sin(i/8*Math.PI)*17,7,0,7);ctx.fill();}
      for(let i=0;i<cake.count;i++){const a=i/Math.max(1,cake.count)*Math.PI*2;topIcon(ctx,cake.fruit,Math.cos(a)*38,-23+Math.sin(a)*12,20);}
      for(let i=0;i<cake.candles;i++){const cx=(i-(cake.candles-1)/2)*13;ctx.fillStyle=i%2?'#A6CCD0':'#DCA6BA';ctx.fillRect(cx-2,-43,4,21);ctx.strokeRect(cx-2,-43,4,21);ctx.fillStyle='#EAC15D';ctx.beginPath();ctx.ellipse(cx,-49,3,6,.15,0,7);ctx.fill();}
    }
    ctx.restore();
  }
  drawOrder(ctx,x,y,w,h){
    const label=(list,id)=>list.find(v=>v.id===id).name;
    const lines=[label(CAKE_BASES,this.want.base),label(CAKE_CREAMS,this.want.cream),label(CAKE_FRUITS,this.want.fruit)+' '+this.want.count+'こ',this.want.candles?'ろうそく '+this.want.candles+'ほん':'ろうそく なし'];
    ctx.save();ctx.fillStyle=INK;ctx.textAlign='center';ctx.font="800 11px 'M PLUS Rounded 1c',sans-serif";lines.forEach((line,i)=>ctx.fillText(line,x+w/2,y+12+i*Math.min(18,(h-16)/4)));ctx.restore();
  }
  draw(ctx){
    const R=this.R;this.drawCake(ctx,R.x+R.w/2,R.y+R.h*.23,Math.min(1.1,R.h/320),this.made);
    ctx.save();ctx.fillStyle=INK;ctx.textAlign='center';ctx.font="800 12px 'M PLUS Rounded 1c',sans-serif";
    ctx.fillText((this.step+1)+' / '+this.steps.length+'　'+{base:'ケーキの どだい',cream:'クリームの いろ',fruit:'くだものの しゅるいと かず',candles:'ろうそくの かず'}[this.steps[this.step]],R.x+R.w/2,R.y+15);ctx.restore();
  }
}
MG_TASKS.cake=CakeTask;
SHOP_OWNERS.cake={sp:'sheep',name:'ひつじの パティさん',outfit:{head:'chefhat',body:'apron'}};
HOWTO.cake=['きねんびの ケーキを いっしょに つくろう！','どだい・クリーム・くだもの・ろうそくを\nちゅうもんに あわせて えらんでね。','むずかしい ちゅうもんは すぐ きえちゃうよ。\nふきだしを おすと みられるけれど、すこし げんてん！'];
SONGS.shop_cake={bpm:100,tracks:[{notes:'E5 G5 A5 . G5 E5 D5 . C5 E5 G5 B5 A5 . G5 . F5 A5 G5 . E5 G5 D5 . C5 E5 D5 B4 C5 . . _'}]};
