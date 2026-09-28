// 下から積む順番を覚える。パンは自動、具材は一段ずつ選ぶ。
const BURGER_FILLINGS=[{id:'patty',name:'パティ',col:'#9E7359'},{id:'cheese',name:'チーズ',col:'#F0CD73'},{id:'lettuce',name:'レタス',col:'#A1C982'},{id:'tomato',name:'トマト',col:'#DD9C89'},{id:'egg',name:'たまご',col:'#FFF2CE'},{id:'fish',name:'おさかな',col:'#D6BC8D'}];
class BurgerTask extends TaskBase {
  constructor(sc,lv){
    super(sc,lv);this.fillings=BURGER_FILLINGS.slice(0,Math.min(6,lv+2));this.want=[];
    for(let i=0;i<lv+2;i++)this.want.push(U.pick(this.fillings.filter(f=>f.id!==this.want[i-1])).id);
    this.made=[];this.timeLimit=[28,30,32,30,28][lv-1];this.hideAfter=[0,8,6,4.5,3][lv-1];this.title='したから このじゅん！';
  }
  layout(R){this.R=R;this.setup();}
  setup(){
    const R=this.R,boxes=gridBtns(R,this.fillings.length,3,R.y+R.h*.46,52);this.btns=this.fillings.map((f,i)=>({...boxes[i],label:f.name,fs:12,disabled:this.made.length>=this.want.length,icon:(ctx,x,y,s)=>this.ingredient(ctx,f.id,x,y,s/64),cb:()=>{this.made.push(f.id);this.setup();}}));
    const w=(R.w-28)/2,y=R.y+R.h-52;
    this.btns.push({x:R.x+10,y,w,h:44,label:'ひとつ もどす',disabled:!this.made.length,cb:()=>{this.made.pop();this.setup();}});
    this.btns.push({x:R.x+18+w,y,w,h:44,label:'できあがり！',color:'#FFD54F',disabled:this.made.length!==this.want.length,cb:()=>{this.sc.finish(this.score());Sound.se('swish');}});
  }
  score(){const wrong=Math.max(this.want.length,this.made.length)-this.want.reduce((n,id,i)=>n+(id===this.made[i]?1:0),0);return Math.max(0,100-wrong*22-this.sc.timePenalty()-this.peekPenalty());}
  timeout(){return Math.min(40,this.score());}
  ingredient(ctx,id,x,y,s=1){
    const f=BURGER_FILLINGS.find(f=>f.id===id);ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle=f?.col||'#E5BC7E';ctx.lineJoin='round';
    if(id==='lettuce'){ctx.beginPath();ctx.moveTo(-30,0);for(let i=0;i<=8;i++)ctx.lineTo(-30+i*7.5,Math.sin(i*2)*5-4);ctx.lineTo(30,8);for(let i=8;i>=0;i--)ctx.lineTo(-30+i*7.5,Math.sin(i*2+1)*4+6);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(id==='cheese'){ctx.beginPath();ctx.moveTo(-29,-6);ctx.lineTo(29,-6);ctx.lineTo(32,6);ctx.lineTo(11,3);ctx.lineTo(0,12);ctx.lineTo(-11,4);ctx.lineTo(-30,7);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(id==='top'){ctx.beginPath();ctx.moveTo(-30,6);ctx.bezierCurveTo(-31,-26,31,-26,30,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#FFF1CB';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(-21+i*7,-4-Math.sin(i/6*Math.PI)*9,2,1,-.4,0,7);ctx.fill();}}
    else {U.rr(ctx,-30,-6,60,14,id==='egg'?9:6);ctx.fill();ctx.stroke();if(id==='egg'){ctx.fillStyle='#EFC76A';ctx.beginPath();ctx.ellipse(0,0,11,5,0,0,7);ctx.fill();}if(id==='patty'||id==='fish'){ctx.strokeStyle=id==='fish'?'#B49A6C':'#79523E';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-22+i*11,-2);ctx.lineTo(-17+i*11,3);ctx.stroke();}}if(id==='tomato'){ctx.strokeStyle='#F4C4A2';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-20+i*13,-2);ctx.lineTo(-18+i*13,4);ctx.stroke();}}}
    ctx.restore();
  }
  drawOrder(ctx,x,y,w,h){
    const cols=Math.min(4,this.want.length),cw=w/cols,rh=h/Math.ceil(this.want.length/cols);ctx.save();ctx.textAlign='center';ctx.fillStyle=INK;ctx.font="800 10px 'M PLUS Rounded 1c',sans-serif";
    this.want.forEach((id,i)=>{const cx=x+(i%cols+.5)*cw,cy=y+Math.floor(i/cols)*rh;ctx.fillText((i+1)+'',cx,cy+5);this.ingredient(ctx,id,cx,cy+Math.min(22,rh*.64),Math.min(.45,cw/70));});ctx.restore();
  }
  draw(ctx){
    const R=this.R,x=R.x+R.w/2,y=R.y+R.h*.37,s=Math.min(1.55,R.h/260),step=8;
    ctx.save();ctx.fillStyle='#E4DACA';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+15,67,12,0,0,7);ctx.fill();ctx.stroke();ctx.restore();
    this.ingredient(ctx,'bottom',x,y,s);this.made.forEach((id,i)=>this.ingredient(ctx,id,x,y-(i+1)*step,s));
    if(this.made.length===this.want.length)this.ingredient(ctx,'top',x,y-(this.made.length+1)*step,s);
    ctx.save();ctx.textAlign='center';ctx.fillStyle=INK;ctx.font="800 12px 'M PLUS Rounded 1c',sans-serif";ctx.fillText('したから つもう　'+this.made.length+' / '+this.want.length+'だん',x,R.y+20);ctx.restore();
  }
}
MG_TASKS.burger=BurgerTask;
SHOP_OWNERS.burger={sp:'pig',name:'ぶたの バンズさん',outfit:{head:'chefhat',body:'apron'}};
HOWTO.burger=['いらっしゃい！ こんがり バーガーを つくろう！','ふきだしの 1ばんから じゅんばんに\nぐざいを したから つんでね。パンは おまかせ！','ちゅうもんを おぼえて つくろう。\nふきだしで みなおせるけれど すこし げんてん！'];
SONGS.shop_burger={bpm:114,tracks:[{notes:'C5 E5 G5 . A5 G5 E5 . D5 F5 A5 . G5 E5 C5 . E5 G5 B5 A5 G5 . E5 . F5 D5 E5 G5 C5 . . _'}]};
