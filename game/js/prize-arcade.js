// 4方式の筐体。技量で確率が変わるゲーム内コイン専用のプライズ遊び。
class PrizeMachineRound {
  constructor(type,rng=Math.random){this.type=type;this.rng=rng;this.x=.5;this.y=.5;this.time=0;this.phase='aim';this.tries=0;this.score=0;this.supports=[true,true,true];this.target=type==='tripod'?{x:.5,y:.5}:{x:.25+rng()*.5,y:.28+rng()*.42};this.seed=rng();this.done=false;this.win=false;this.quality=0;this.scoop=0;}
  tick(dt){if(this.done)return;this.time+=dt;if(this.time>=40){this.done=true;this.win=false;}}
  move(dx,dy){if(!this.done){this.x=U.clamp(this.x+dx,.08,.92);this.y=U.clamp(this.y+dy,.08,.92);}}
  indicator(){return (this.time*(this.type==='tripod'?.56:.38)+this.seed)%1;}
  drop(){
    if(this.done)return;const precision=U.clamp(1-Math.hypot(this.x-this.target.x,this.y-this.target.y)*2.5,0,1),phase=this.indicator();this.tries++;
    if(this.type==='claw'){this.quality=precision;this.win=this.rng()<.12+.78*precision;this.done=true;}
    else if(this.type==='ring'){const swing=Math.abs(Math.sin((phase-.5)*Math.PI*2));this.quality=precision*(1-.7*swing);this.win=this.rng()<.04+.86*this.quality;this.done=true;}
    else if(this.type==='sweet'){
      if(this.phase==='aim'){const offset=Math.abs(phase-.5);this.scoop=Math.round((1-offset*2)*precision*4);this.phase='push';}
      else{const push=1-Math.abs(phase-.5)*2;this.score+=this.scoop*push;this.phase='aim';this.scoop=0;if(this.tries>=6){this.quality=U.clamp(this.score/7,0,1);this.win=this.score>=3&&this.rng()<.12+.78*this.quality;this.done=true;}}
    }else{
      const selected=Math.min(2,Math.floor(this.x*3)),angle=selected/3,delta=Math.min(Math.abs(phase-angle),1-Math.abs(phase-angle)),depth=1-Math.abs(this.y-.5);
      if(delta<.095&&this.rng()<.5+.48*depth)this.supports[selected]=false;
      this.score=this.supports.filter(x=>!x).length;this.quality=this.score/3;
      if(this.score>=2){this.win=this.rng()<.6+(this.score===3?.35:0);if(this.win||this.tries>=6)this.done=true;}
      if(this.tries>=6)this.done=true;
    }
    return this.done;
  }
}
const PrizeArcade={
  machines:[
    {type:'claw',name:'つかむクレーン・星のソファ',prize:'ike_prize_0',qty:1},
    {type:'claw',name:'つかむクレーン・ごじ',prize:'ike_prize_1',qty:1},
    {type:'sweet',name:'スイーツランド・おかしの山',prize:'prize_uma',qty:15},
    {type:'sweet',name:'スイーツランド・ぱいのみん',prize:'prize_pie',qty:12},
    {type:'tripod',name:'トライポッド・メリーゴーランド',prize:'ike_prize_2',qty:1},
    {type:'tripod',name:'トライポッド・わんこ',prize:'ike_prize_3',qty:1},
    {type:'ring',name:'リングフック・がちゃん',prize:'ike_prize_4',qty:1},
    {type:'ring',name:'リングフック・まむまむ',prize:'prize_cookie',qty:12},
  ],
  rules:{claw:'左右・前後で ねらって「おろす」。中心に 近いほど つかみやすいよ。アームの 強さには 運も あるよ。',sweet:'回る おかしの皿を ねらい「すくう」。次に、台が手前にくる 黄色の合図で「おとす」。3セットで おかしを 押し出そう。',tripod:'左右で 支えを えらび、前後で 中心を あわせる。回る光が 選んだ 支えに重なる とき「とめる」。6回までに 2本以上 はずそう。',ring:'左右・前後で フックを ねらう。リングの 揺れが 中心に戻る とき「おろす」。向きと タイミングが 大事だよ。'},
  async open(machine,back){
    const m=this.machines[machine];if(!m)return;
    const active=Save.d.arcade.active;
    if(active){const yes=await UI.confirm('中断中の クレーンが あるよ。追加料金なしで つづける？','つづける','やめる');if(yes)Game.goto('prize',{run:active});return;}
    if(!await UI.confirm(m.name+'\n'+this.rules[m.type]+'\n景品：'+VenueHalls.item(m.prize).name+' ×'+m.qty+'\n1回100コイン。40秒。取れないことも あるよ。','100コインで あそぶ','やめる'))return;
    const run=this.start(machine,back);if(run)Game.goto('prize',{run});else UI.toast('コインが 足りないか、保存できなかったよ');
  },
  start(machine,back){
    if(Save.d.arcade.active||!this.machines[machine]||Save.d.coins<100)return null;
    const run={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),machine,back,state:JSON.parse(JSON.stringify(new PrizeMachineRound(this.machines[machine].type)))};
    const coins=Save.d.coins;Save.d.coins-=100;Save.d.arcade.active=run;Save.write();
    try{if(JSON.parse(localStorage.getItem(Save.KEY))?.arcade?.active?.id===run.id)return run;}catch(e){}
    Save.d.coins=coins;Save.d.arcade.active=null;Save.mark();return null;
  },
  finish(run){
    if(Save.d.arcade.active?.id!==run.id||Save.d.arcade.settled===run.id)return false;
    const m=this.machines[run.machine];if(run.state.win){if(FURN_INDEX[m.prize])Save.d.furn[m.prize]=(Save.d.furn[m.prize]||0)+m.qty;else Save.addBag(m.prize,m.qty);Save.d.arcade.wins++;}
    Save.d.arcade.plays++;Save.d.arcade.settled=run.id;Save.d.arcade.active=null;Save.write();return true;
  },
};
class PrizeArcadeScene{
  async enter(p){
    this.run=p.run;this.machine=PrizeArcade.machines[this.run.machine];this.round=Object.assign(new PrizeMachineRound(this.machine.type),this.run.state);this.closed=false;this.saved=0;
    UI.showHud(true,'Meeときょれじゃ');Sound.bgm('shop_link');this.buildUI();if(this.round.done)this.finish();
    await Chara.preload(Save.d.order.map(id=>[id,{pose:'idle_01',dir:'down',outfit:Save.d.chars[id].outfit,color:Save.d.chars[id].color}]),45);
  }
  buildUI(){
    this.bar=U.el('div',{class:'prize-controls'});this.status=U.el('div',{class:'note'});this.bar.append(this.status);
    const controls=U.el('div',{class:'prize-directions'});
    for(const [name,dx,dy]of [['←',-.065,0],['↑',0,-.065],['↓',0,.065],['→',.065,0]])controls.append(UI.btn(name,()=>{this.round.move(dx,dy);this.persist();},'prize-dir'));
    this.action=UI.btn('おろす',()=>this.drop(),'yellow');controls.append(this.action);this.bar.append(controls);
    this.backButton=UI.btn('店内に もどる',()=>this.leave(),'wide');this.bar.append(this.backButton);UI.root.append(this.bar);this.refresh();
  }
  refresh(){const r=this.round;this.status.textContent=r.done?(r.win?'とれた！ '+VenueHalls.item(this.machine.prize).name+' ×'+this.machine.qty:'おしい！ また チャレンジしよう。'):`あと ${Math.max(0,40-r.time).toFixed(1)}秒 ／ ${r.type==='tripod'?'支え '+r.score+'/2本・操作 '+r.tries+'/6回':r.type==='sweet'?'押し出し '+r.score.toFixed(1)+'・'+Math.floor(r.tries/2)+'/3セット':'左右・前後を あわせて タイミングよく！'}`;this.action.textContent=r.type==='sweet'?(r.phase==='aim'?'すくう':'おとす'):r.type==='tripod'?'とめる':'おろす';this.action.disabled=r.done;this.backButton.textContent=r.done?'店内に もどる':'中断して 店内へ';}
  persist(){if(this.round.done)return;this.run.state=JSON.parse(JSON.stringify(this.round));Save.d.arcade.active=this.run;Save.write();}
  drop(){if(this.round.done||this.dropAnim>0)return;this.round.drop();this.dropAnim=.9;this.run.state=JSON.parse(JSON.stringify(this.round));Save.d.arcade.active=this.run;Save.write();Sound.se('tap');this.refresh();this.action.disabled=true;this.backButton.disabled=true;}
  finish(){this.run.state=JSON.parse(JSON.stringify(this.round));PrizeArcade.finish(this.run);Sound.se(this.round.win?'fanfare':'bad');UI.updateHud();this.refresh();}
  leave(){if(Game.inputLocked)return;this.persist();Game.goto('venue',this.run.back,'circle');}
  exit(){this.closed=true;this.persist();this.bar?.remove();UI.showHud(false);}
  update(dt){if(Game.inputLocked||document.hidden||this.closed)return;if(this.dropAnim>0){this.dropAnim-=dt;if(this.dropAnim<=0){this.backButton.disabled=false;if(this.round.done)this.finish();else this.refresh();}return;}if(this.round.done)return;const r=this.round;let dx=0,dy=0;if(G.keys.left)dx-=dt*.35;if(G.keys.right)dx+=dt*.35;if(G.keys.up)dy-=dt*.35;if(G.keys.down)dy+=dt*.35;r.move(dx,dy);r.tick(dt);if(r.done)this.finish();else if((this.saved+=dt)>1){this.saved=0;this.persist();}this.refresh();}
  key(k,down){if(down&&k==='ok')this.drop();}
  render(ctx){
    const W=G.W,H=G.H,r=this.round,top=100,bottom=H-225,hh=Math.max(120,bottom-top),left=22,width=W-44;
    ctx.fillStyle='#E8DDEB';ctx.fillRect(0,0,W,H);ctx.fillStyle='#FFF8E5';ctx.strokeStyle=INK;ctx.lineWidth=3;U.rr(ctx,left,top,width,hh,16);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.textAlign='center';ctx.font='bold 14px sans-serif';ctx.fillText(this.machine.name,W/2,top-16,W-35);
    const X=x=>left+18+x*(width-36),Y=y=>top+35+y*(hh-65);
    ctx.strokeStyle='#BECBCD';ctx.lineWidth=1;for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(X(i/6),Y(0));ctx.lineTo(X(i/6),Y(1));ctx.moveTo(X(0),Y(i/6));ctx.lineTo(X(1),Y(i/6));ctx.stroke();}
    const id=this.machine.prize,svg=FURN_INDEX[id]?Art.furnSvg(id):Art.iconSvg('bag',id),img=SvgCache.get('crane-prize:'+id,()=>svg,160,180),tx=X(r.target.x),ty=Y(r.target.y);if(img)ctx.drawImage(img,tx-37,ty-40,74,80);
    if(r.type==='sweet'){
      const phase=r.indicator();ctx.strokeStyle='#AD96AD';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(W/2,Y(.48),width*.33,hh*.22,0,0,7);ctx.stroke();for(let i=0;i<8;i++){const a=phase*Math.PI*2+i*Math.PI/4;ctx.fillStyle=['#E5B4AA','#EFD495','#BFCBDE'][i%3];ctx.beginPath();ctx.arc(W/2+Math.cos(a)*width*.33,Y(.48)+Math.sin(a)*hh*.22,8,0,7);ctx.fill();}ctx.fillStyle='#96B9AC';ctx.fillRect(X(.12),Y(.8)+Math.sin(phase*Math.PI*2)*12,width*.7,15);
    }else if(r.type==='tripod'){
      const cx=W/2,cy=Y(.5),rad=Math.min(width*.32,hh*.3);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.strokeStyle=r.supports[i]?'#AC8B65':'#D9D2CA';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);ctx.lineTo(cx+Math.cos(a)*rad*.3,cy+Math.sin(a)*rad*.3);ctx.stroke();ctx.fillStyle=Math.floor(r.x*3)===i?'#D06C8C':'#677D8B';ctx.font='bold 15px sans-serif';ctx.fillText(String(i+1),cx+Math.cos(a)*(rad+16),cy+Math.sin(a)*(rad+16));}const a=r.indicator()*Math.PI*2;ctx.fillStyle='#FFE56F';ctx.beginPath();ctx.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad,8,0,7);ctx.fill();
    }else if(r.type==='ring'){ctx.strokeStyle='#B58B4E';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(tx,ty-28);ctx.lineTo(tx,ty+8);ctx.arc(tx+7,ty+8,7,Math.PI,0,true);ctx.stroke();}
    const x=X(r.x),y=Y(r.y)+(this.dropAnim>0?Math.sin(this.dropAnim/.9*Math.PI)*32:0);ctx.strokeStyle='#667986';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top+8);ctx.lineTo(x,y-14);ctx.stroke();ctx.strokeStyle='#D67D9B';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+(r.type==='ring'?Math.sin((r.indicator()-.5)*Math.PI*2)*22:0),y,14,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(x-23,y);ctx.lineTo(x+23,y);ctx.moveTo(x,y-23);ctx.lineTo(x,y+23);ctx.stroke();
    if(r.type==='sweet'||r.type==='ring'){ctx.fillStyle='#D4D8D7';ctx.fillRect(35,bottom+13,W-70,12);ctx.fillStyle='#F3D981';ctx.fillRect(W/2-20,bottom+13,40,12);ctx.fillStyle='#85668D';ctx.fillRect(35+r.indicator()*(W-70),bottom+9,5,20);}
    Save.d.order.forEach((id,i)=>{const c=Save.d.chars[id];Chara.draw(ctx,id,{pose:'idle_01',dir:'down',face:r.done&&r.win?'happy':'normal',outfit:c.outfit,color:c.color},W/2+(i-1)*57,bottom+84,42);});
  }
}
SCENES.prize=PrizeArcadeScene;
