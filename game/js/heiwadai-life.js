// 見本のSVGを保持したまま、位置・光・水しぶきを時間で動かす。画像キーに時刻は入れない。
const HeiwadaiLife={
  clock:null,
  time(){return this.clock??G.t;},
  state(t=this.time()){
    const p=((t%50)+50)%50;
    const trainX=p<18?18:p<30?18+58*((p-18)/12)**2:p<40?-18:-18+36*(1-(1-(p-40)/10)**2);
    return {trainX,trainStopped:p<18,signal:((t%16)+16)%16<7?'green':t%16<9?'amber':'red',flagScale:1+Math.sin(t*2)*.08,waterPhase:(t*.75)%1};
  },
  position(it){return it.asset==='rail.train'?{...it,x:this.state().trainX}:it;},
  swingParts(){
    if(this.swing)return this.swing;
    const raw=HeiwadaiArt.entry('park.swing').svg,a=HeiwadaiArt.model('park.swing'),full=HeiwadaiArt.full('park.swing');
    const elements=[...raw.matchAll(/<(?:path|rect)\b[^>]*\/>/g)].map(m=>m[0]);
    const seats=[34,62].map(x=>elements.filter(s=>s.includes('d="M'+(x-6)+',-4 L'+(x-6)+',42"')||s.includes('d="M'+(x+6)+',-4 L'+(x+6)+',42"')||s.includes('x="'+(x-9)+'" y="40"')));
    if(seats.some(parts=>parts.length!==3))throw Error('Swing SVG changed: verify moving parts');
    let frame=raw;for(const part of seats.flat())frame=frame.replace(part,'');
    return this.swing={a,svg:[frame,...seats.map(parts=>parts.join(''))].map(s=>full.replace(raw,s))};
  },
  preload(def){
    if(!def.heiwadai)return Promise.resolve();
    const {a,svg}=this.swingParts();return Promise.all(svg.map((s,i)=>SvgCache.ensure('heiwadai-life:swing:'+i,()=>s,Math.ceil((a.w+4)*G.px),Math.ceil((a.h+4)*G.px))));
  },
  drawSwing(ctx,active){
    const {a,svg}=this.swingParts();
    for(let i=0;i<3;i++){
      const c=SvgCache.get('heiwadai-life:swing:'+i,()=>svg[i],Math.ceil((a.w+4)*G.px),Math.ceil((a.h+4)*G.px));if(!c)continue;
      ctx.save();if(i){const x=i===1?34:62;ctx.translate(x,-4);ctx.rotate(Math.sin(this.time()*1.8+i*.4)*(active?.18:.03));ctx.translate(-x,4);}
      ctx.drawImage(c,a.originX-2,a.originY-2,a.w+4,a.h+4);ctx.restore();
    }
  },
  install(){
    const d=MAP_DEFS.heiwadai,src=HEIWADAI_LAYOUT_DATA.layout;
    const lines=[
      ['えきまえへ ようこそ！ にしの しょうてんがいから、さつきの こうえんへ いけるよ。','とけいの まわりは まちあわせに ぴったり。3にんで おさんぽ？'],
      ['あおに なっても、みぎと ひだりを たしかめようね。','おとしものは こうばんへ。まちの あんしんを みまもっているよ。'],
      ['でんしゃが きたよ。えきの いりぐちから、シティや くうこうへ いけるよ。','りょうきんは むりょう。3にん いっしょに いってらっしゃい！'],
      ['きょうの おやさいも ぴかぴか！ からくない ごはんを つくろうね。','ごはんの あとは デザ。おとなりの パンも いい かおりだよ。'],
      ['おふろの あとは、えんがわで ひとやすみ。よるの あかりも きれいだよ。','むかしから この しょうてんがいが だいすき。みんなの こえで にぎやかね。'],
      ['ふんすいを タップしてみて！ みずが きらきら するよ。','ブランコ ゆらゆら。じゅんばんに あそぼう！'],
      ['きの あいだを かぜが とおるね。しずかな さんどうを おさんぽしよう。','よるの とうろうは やさしい あかり。あしもとに きをつけてね。'],
      ['バスを まちながら おはなを みているの。','きょうは 3にんで どこへ？ わたしは しょうてんがいに よりみち！']
    ];
    d.npcs=src.npcs.map((n,i)=>{
      const id=i?'heiwadai_person_'+i:'heiwadai_local';
      TALKS[id]={first:[lines[i][0]],lines:lines[i].map(text=>[text])};
      return {...n,id,talk:id,x:Math.floor(n.x),y:Math.floor(n.y),artOffset:[n.x-Math.floor(n.x),n.y-Math.floor(n.y)+.00625],size:44,dir:n.dir||'down'};
    });
    for(const [i,n]of src.walkers.entries()){
      const x=Math.floor(n.x),y=Math.floor(n.y),id='heiwadai_walker_'+i;
      TALKS[id]={first:['こんにちは！ いい おさんぽ びよりだね。'],lines:[['しょうてんがいで おかいもの。いいもの みつけた？'],['まちの すみまで、よりみちが たくさん あるよ。']]};
      d.npcs.push({...n,x,y,id,name:'おさんぽの ひと',talk:id,size:44,artOffset:[n.x-x,n.y-y+.00625],wander:[x-2,y-1,x+2,y+1]});
    }
  },
  effect(ctx,it,active){
    const t=this.time()*(active?1.5:1),id=it.asset;
    if(id==='prop.signal'){
      const signal=this.state(t+(it.x<38?8:0)).signal;
      const dot=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=.5;ctx.stroke();};
      for(const [x,phase,col]of [[15,'green','#43A047'],[23,'amber','#F2C14E'],[31,'red','#E74A42']])dot(x,-57.5,3,signal===phase?col:'#5B5B5B');
      dot(9.5,-30,2.6,signal!=='red'?'#E74A42':'#6B6B6B');dot(9.5,-22.5,2.6,signal==='red'?'#43A047':'#6B6B6B');
    }
    if(id==='park.fountain'){
      ctx.strokeStyle='#DDF3FB';ctx.fillStyle='#DDF3FB';ctx.lineWidth=1.4;
      for(let i=0;i<12;i++){const p=(t*.75+i/12)%1,side=i%2?1:-1,x=48+side*(18+(active?10:0))*p,y=10+20*p*p;ctx.beginPath();ctx.ellipse(x,y,1.2,2,0,0,7);ctx.fill();}
      for(let i=0;i<3;i++){const p=(t*.6+i/3)%1;ctx.globalAlpha=1-p;ctx.beginPath();ctx.ellipse(48,65,8+p*25,3+p*10,0,0,7);ctx.stroke();}ctx.globalAlpha=1;
    }
    if(id==='shrine.chozuya'){ctx.strokeStyle='#DDF3FB';ctx.lineWidth=1.3;for(let i=0;i<3;i++){const p=(t+i/3)%1;ctx.beginPath();ctx.moveTo(44,37+p*5);ctx.lineTo(44,39+p*5);ctx.stroke();}}
  },
  lights(ctx,scene,ox,oy){
    if(!scene.map.def.heiwadai||!DayTint.isNight())return;
    const glow=(x,y,r,strength)=>{if(x+r<0||y+r<0||x-r>G.W||y-r>G.H)return;const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'rgba(255,218,147,'+strength+')');g.addColorStop(1,'rgba(255,218,147,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);};
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const p of scene.map.def.objects){const x=ox+p.x*TS,y=oy+p.y*TS;
      if(p.asset==='prop.lamp')glow(x+26.5,y-43.5,45,.42);
      if(p.asset==='prop.vending')glow(x+16,y+4,32,.25);
      if(p.asset==='shrine.lantern')glow(x+16,y+1,28,.3+Math.sin(this.time()*2)*.025);
      if(p.asset==='prop.arcade_gate')for(const dx of [8,88])glow(x+dx,y+10,24,.25);
    }ctx.restore();
  },
};
HeiwadaiLife.install();
