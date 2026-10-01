const PuzzleArcade = {
  rulesHtml() {
    return `<div class="puzzle-rules"><p>同じ絵を<strong>縦・横に3個以上</strong>なぞる。斜めは不可。戻るとなぞり直せます。</p>
      <div class="puzzle-shape-list"><div><b>●─●─●─●</b><strong>直線4個〜</strong>その行・列を消去</div><div><b>●─●─●<br>　　　│<br>　　　●<br>　　　│<br>　　　●</b><strong>L字5個〜</strong>角の行＋列を消去</div><div><b>●─●<br>│　│<br>●─●</b><strong>輪4個〜</strong>始点に戻ると同じ色を全消去</div><div><b>✦ 7 LINK</b><strong>その他7個〜</strong>終点の周囲も消去</div></div>
      <p>3.5秒以内に続けると最大2.2倍。特殊な形でゲージをためると<strong>8秒間、得点1.6倍のフィーバー</strong>。直前と違う特殊形ならゲージ＋2、同じ形は＋1（6で発動）。</p>
      <p>開始45秒。消去で時間を回復（残り時間は最大65秒）。30秒ごとに時計が速くなり、延長量も減少。45秒・90秒経過で絵が1種類ずつ増えます。最長180秒で終了。</p>
      <p>シャッフルは残り時間を5秒消費し、コンボをリセット（3回まで）。消せる場所がない場合は自動で混ぜます。装備・育成・全体の難易度設定は得点に影響しません。</p></div>`;
  },
  card(p, obtained = false) {
    return U.el("div", { class: "puzzle-prize" + (obtained ? " obtained" : ""), "data-prize": p.id, html: `<div class="puzzle-prize-art">${Art.furnSvg(p.id)}</div><div><span class="puzzle-tier">${p.tier} · ${p.score.toLocaleString()} pt</span><strong>${p.name}</strong><p>${p.desc}</p><small>${obtained ? "獲得済み" : "パズル限定・非売品"}</small></div>` });
  },
  open(back) {
    return new Promise(resolve => {
      const body=U.el("div"),footer=U.el("div",{class:"puzzle-entry"});
      const m=UI.modal({title:"なかよしパズル",body,footer,cls:"full puzzle-lobby",onClose:resolve});
      const rec=Save.d.puzzle,active=rec.active;
      body.append(U.el("div",{class:"puzzle-intro",html:`<span>SCORE ATTACK / 星のコレクション</span><h2>つなぐ形で、限界を超える。</h2><p>1回 <strong>${PUZZLE_RULES.fee}コイン</strong>。得点で限定家具を獲得。<br>各景品は初回達成時に1個、下位の景品も同時獲得。</p><p>所持金 ${U.fmt(Save.d.coins)} ／ BEST ${U.fmt(rec.best)} pt</p>`}));
      if(active)body.append(U.el("div",{class:"note",text:`中断中：${U.fmt(active.state.score)} pt・残り${active.state.remaining.toFixed(1)}秒。追加料金なしで再開できます。`}));
      const details=U.el("details",{class:"puzzle-howto",html:`<summary>遊び方・形の技・時間のルール</summary>${this.rulesHtml()}`});body.append(details);
      for(const p of PUZZLE_PRIZES)body.append(this.card(p,!!rec.claimed[p.id]));
      body.append(U.el("p",{class:"note",text:"景品は抽選ではありません。獲得済みの景品の重複配布・コイン報酬はありません。景品は「おうち → もようがえ」から飾れます。"}));
      // ごわが × なかよしパズル の コラボ グッズ（あそんだ スコアの つみたて。js/puzzle-collab.js）
      if(typeof CollabGoods!=="undefined"&&CollabGoods.LINES.puzzle)body.append(CollabGoods.section("puzzle"));
      let starting=false;
      const play=UI.btn(active?"中断したゲームを再開":`${PUZZLE_RULES.fee}コインで挑戦`,()=>{
        if(starting)return;starting=true;
        const run=this.start(back);if(!run){starting=false;UI.toast("コインが足りないか、保存できませんでした");return;}
        m.close();Game.goto("puzzle",{run});
      },"yellow wide");
      play.disabled=!active&&Save.d.coins<PUZZLE_RULES.fee;
      const practice=UI.btn("無料で練習（景品なし）",()=>{
        if(starting)return;starting=true;const run=this.start(back,true);if(!run){starting=false;return;}m.close();Game.goto("puzzle",{run});
      },"wide");practice.disabled=!!active;footer.append(play,practice);
      if(play.disabled)footer.append(U.el("small",{text:`あと${PUZZLE_RULES.fee-Save.d.coins}コイン。練習は何度でも無料。`}));
    });
  },
  start(back, practice=false, seed=Date.now()) {
    const rec=Save.d.puzzle;
    if(rec.active)return practice?null:rec.active;
    if(!practice&&Save.d.coins<PUZZLE_RULES.fee)return null;
    const run={id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2),practice,back:{...back},state:new NakayoshiPuzzle(seed).s};
    if(practice)return run;
    const coins=Save.d.coins;Save.d.coins-=PUZZLE_RULES.fee;rec.active=run;Save.write();
    // 引き落としと盤面を同じセーブに保存。保存できない端末では開始しない。
    try { if(JSON.parse(localStorage.getItem(Save.KEY))?.puzzle?.active?.id===run.id)return run; } catch(e) { /* 下でロールバック */ }
    Save.d.coins=coins;rec.active=null;Save.mark();return null;
  },
  settle(run) {
    if(run.practice)return {score:run.state.score,prizes:[],practice:true};
    const rec=Save.d.puzzle;if(rec.last?.id===run.id)return rec.last;
    if(rec.active?.id!==run.id)return null;
    // コラボの つみたては この 1かいの まえの ベストから はじめる（はじめて よむ とき）
    const collabOn=typeof CollabGoods!=="undefined"&&!!CollabGoods.LINES.puzzle;if(collabOn)CollabGoods.state("puzzle");
    const previous=JSON.parse(JSON.stringify(rec)),furniture={...Save.d.furn},wardrobe={...Save.d.wardrobe},collab=JSON.parse(JSON.stringify(Save.d.collab||{}));
    const prizes=PUZZLE_PRIZES.filter(p=>run.state.score>=p.score&&!rec.claimed[p.id]).map(p=>p.id);
    for(const id of prizes){rec.claimed[id]=true;Save.d.furn[id]=(Save.d.furn[id]||0)+1;}
    const goods=collabOn?CollabGoods.add("puzzle",run.state.score).map(it=>it.id):[];
    rec.best=Math.max(rec.best,run.state.score);rec.plays++;
    rec.last={id:run.id,score:run.state.score,prizes,collab:goods,practice:false};rec.active=null;Save.write();
    try { if(JSON.parse(localStorage.getItem(Save.KEY))?.puzzle?.last?.id===run.id)return rec.last; } catch(e) { /* 再試行できる状態に戻す */ }
    Save.d.puzzle=previous;Save.d.furn=furniture;Save.d.wardrobe=wardrobe;Save.d.collab=collab;Save.mark();return null;
  },
};

class PuzzleScene {
  async enter({run}) {
    this.run=run;this.model=new NakayoshiPuzzle(1,run.state);this.run.state=this.model.s;
    this.phase="ready";this.chain=[];this.pointerId=null;this.bursts=[];this.lastClock=performance.now();this.lastSave=0;
    this.resize();UI.showHud(false);Sound.bgm("shop_link");
    const list=Save.d.order.map(id=>[id,{face:"happy",outfit:Save.d.chars[id].outfit,color:Save.d.chars[id].color}]);
    await Chara.preload(list,38);
    this.controls=U.el("div",{class:"puzzle-controls"});
    this.shuffleButton=UI.btn("混ぜる −5秒",()=>{if(this.phase!=="running")return;this.clock();if(this.model.shuffle()){this.cancelChain();this.persist();Sound.se("pop");}},"puzzle-mix");
    this.pauseButton=UI.btn("一時停止",()=>this.pause());this.controls.append(this.shuffleButton,this.pauseButton);UI.root.append(this.controls);
    this.visibility=()=>{if(document.hidden)this.pause();};this.pagehide=()=>{this.pause();this.persist();};
    document.addEventListener("visibilitychange",this.visibility);window.addEventListener("pagehide",this.pagehide);
    this.overlayReady(false);
    if(this.model.s.done)this.finish();
  }
  exit() {this.persist();this.controls?.remove();this.overlay?.remove();document.removeEventListener("visibilitychange",this.visibility);window.removeEventListener("pagehide",this.pagehide);this.closed=true;}
  resize() {
    this.cell=Math.min((G.W-28)/6,(G.H-348)/6,62);this.bx=(G.W-this.cell*6)/2;
    this.by=214+Math.max(0,G.H-700)*.20;this.cancelChain();
  }
  point(i){return {x:this.bx+(i%6+.5)*this.cell,y:this.by+(Math.floor(i/6)+.5)*this.cell};}
  hit(p){const x=Math.floor((p.x-this.bx)/this.cell),y=Math.floor((p.y-this.by)/this.cell);return x>=0&&x<6&&y>=0&&y<6?y*6+x:-1;}
  cancelChain(){this.chain=[];this.pointerId=null;this.previousPointer=null;}
  persist(){if(!this.run||this.run.practice||Save.d.puzzle.active?.id!==this.run.id)return;Save.d.puzzle.active.state=this.model.s;Save.applyElapsed(false);Save.write();}
  clock(){const now=performance.now();if(this.phase==="running"&&!this.debugClock)this.model.advance(Math.max(0,(now-this.lastClock)/1000));this.lastClock=now;}
  begin(){if(Game.trans||this.closed||!["ready","paused"].includes(this.phase))return;this.overlay?.remove();this.overlay=null;this.phase="running";this.lastClock=performance.now();this.controls.classList.remove("hidden");Sound.se("ok");}
  overlayReady(paused) {
    this.overlay?.remove();this.controls?.classList.add("hidden");
    this.overlay=U.el("div",{class:"puzzle-cover"});const box=U.el("div",{class:"puzzle-cover-card"});
    box.append(U.el("span",{class:"puzzle-eyebrow",text:this.run.practice?"PRACTICE · 景品なし":"SCORE ATTACK · 限定家具に挑戦"}),
      U.el("h2",{text:paused?"一時停止":this.model.s.moves?"続きから挑戦":"なかよしパズル"}),
      U.el("p",{text:`残り ${this.model.s.remaining.toFixed(1)}秒 ／ ${U.fmt(this.model.s.score)} pt`}),
      U.el("p",{text:"同じ絵を縦・横につなぐ。形の技で時間を取り戻そう。"}),
      U.el("details",{class:"puzzle-howto",html:`<summary>遊び方を確認</summary>${PuzzleArcade.rulesHtml()}`}),
      UI.btn(paused?"再開する":"スタート",()=>this.begin(),"yellow wide"),
      UI.btn(this.run.practice?"練習をやめて受付へ":"中断して受付へ",()=>this.leave(),"wide"));
    this.overlay.append(box);UI.root.append(this.overlay);
  }
  pause(){if(this.phase!=="running")return;this.clock();this.cancelChain();if(this.model.s.done){this.finish();return;}this.phase="paused";this.persist();this.overlayReady(true);}
  leave(home=false){if(this.closed||Game.trans)return;this.persist();if(home)Game.goto("house");else if(this.run.back.venueReturn)Game.goto("venue",this.run.back.venueReturn);else Game.goto("store",{shop:"link",back:this.run.back,atCounter:true});}
  finish(){
    if(this.phase==="result")return;this.phase="result";this.cancelChain();this.controls.classList.add("hidden");this.overlay?.remove();
    const result=PuzzleArcade.settle(this.run);this.overlay=U.el("div",{class:"puzzle-cover puzzle-results"});
    const box=U.el("div",{class:"puzzle-cover-card"}),s=this.model.s;
    if(!result){
      box.append(U.el("h2",{text:"記録を保存できません"}),U.el("p",{text:"盤面と結果を保持しています。保存できる状態にしてから再試行してください。"}),UI.btn("保存を再試行",()=>{this.phase="retry";this.finish();},"yellow wide"));
    }else{
      Sound.se(result.prizes.length||result.collab?.length?"fanfare":"ok");
      box.append(U.el("span",{class:"puzzle-eyebrow",text:this.run.practice?"PRACTICE RESULT":"SCORE ATTACK RESULT"}),U.el("h2",{text:"TIME UP"}),
        U.el("div",{class:"puzzle-final-score",text:U.fmt(s.score)+" pt"}),
        U.el("p",{text:`${s.moves}回消去 ／ 最大${s.bestCombo}コンボ ／ 延長 +${s.extended.toFixed(1)}秒`}),
        U.el("p",{text:`ライン ${s.shapes.line} · クロス ${s.shapes.elbow} · 輪 ${s.shapes.loop} · スター ${s.shapes.nova}`}));
      if(this.run.practice)box.append(U.el("p",{text:"無料練習のため、景品とベストスコアは記録されません。"}));
      else{
        box.append(U.el("strong",{text:result.prizes.length?"限定家具を獲得！":"BEST "+U.fmt(Save.d.puzzle.best)+" pt"}));
        for(const id of result.prizes)box.append(PuzzleArcade.card(PUZZLE_PRIZES.find(p=>p.id===id),true));
        const next=PUZZLE_PRIZES.find(p=>!Save.d.puzzle.claimed[p.id]);
        box.append(U.el("p",{text:next?`次の目標：${next.name}（${U.fmt(next.score)} pt）`:"星のコレクション、全5種を達成！"}));
        if(result.prizes.length)box.append(U.el("p",{text:"おうちの「もようがえ」から飾れます。タップすると光が弾けます。"}));
        if(typeof CollabGoods!=="undefined"&&CollabGoods.LINES.puzzle)box.append(CollabGoods.result("puzzle",(result.collab||[]).map(id=>CollabGoods.find(id)?.item).filter(Boolean),s.score));
      }
      box.append(UI.btn("受付へ戻る",()=>this.leave(),"yellow wide"),UI.btn("おうちへ",()=>this.leave(true),"wide"));
    }
    this.overlay.append(box);UI.root.append(this.overlay);
  }
  down(p){if(this.phase!=="running"||this.pointerId!==null)return;this.clock();if(this.model.s.done||this.model.s.cooldown>0)return;const i=this.hit(p);if(i<0)return;this.pointerId=p.id;this.chain=[i];this.previousPointer={x:p.x,y:p.y};}
  append(i){
    const c=this.chain;if(i<0||!c.length||i===c[c.length-1])return;
    if(c.length>1&&i===c[c.length-2]){c.pop();return;}
    if(c.length>3&&c[c.length-1]===c[0])return;
    if(!this.model.adjacent(c[c.length-1],i)||this.model.s.board[i]!==this.model.s.board[c[0]])return;
    if(c.includes(i)){if(i===c[0]&&c.length>=4)c.push(i);return;}
    c.push(i);Sound.se("tap");
  }
  move(p){
    if(this.phase!=="running"||p.id!==this.pointerId)return;
    const prev=this.previousPointer||p,n=Math.max(1,Math.ceil(Math.hypot(p.x-prev.x,p.y-prev.y)/(this.cell*.2)));
    for(let k=1;k<=n;k++)this.append(this.hit({x:prev.x+(p.x-prev.x)*k/n,y:prev.y+(p.y-prev.y)*k/n}));this.previousPointer={x:p.x,y:p.y};
  }
  up(p,canceled=false){
    if(p.id!==this.pointerId)return;if(canceled){this.cancelChain();return;}this.move(p);this.clock();
    const r=this.model.play(this.chain);this.cancelChain();if(!r)return;
    this.bursts=r.clear.map(i=>({...this.point(i),until:G.t+.45}));
    this.message={text:`${PUZZLE_SHAPES[r.shape]} +${U.fmt(r.points)}　+${r.added.toFixed(1)}秒`,until:G.t+1.8};
    if(r.reshuffled)this.message.text+=" ／ 自動シャッフル";
    Sound.se(r.feverStarted?"fanfare":r.shape==="chain"?"pop":"sparkle");this.persist();
  }
  key(k,down){if(down&&k==="ok"){if(this.phase==="running")this.pause();else if(this.phase==="paused"||this.phase==="ready")this.begin();}}
  update(){
    if(this.phase!=="running"){this.lastClock=performance.now();return;}
    if(Game.trans){this.lastClock=performance.now();return;}
    if(document.hidden||UI.busy){this.pause();return;}
    this.clock();if(this.model.s.done){this.finish();return;}
    if(this.model.s.elapsed-this.lastSave>=1){this.lastSave=this.model.s.elapsed;this.persist();}
    this.shuffleButton.disabled=this.model.s.shuffles>=3||this.model.s.remaining<=5;
    this.shuffleButton.textContent=`混ぜる −5秒（${3-this.model.s.shuffles}）`;
  }
  render(ctx){
    const s=this.model.s,W=G.W,H=G.H,bottom=this.by+6*this.cell;
    ctx.save();ctx.fillStyle="#20283F";ctx.fillRect(0,0,W,H);
    for(let i=0;i<28;i++){ctx.fillStyle=i%3?"#526079":"#CFB87C";ctx.beginPath();ctx.arc((i*83+17)%W,(i*137+25)%H,i%3?1:1.7,0,7);ctx.fill();}
    ctx.textAlign="center";ctx.fillStyle="#D4C196";ctx.font="700 10px sans-serif";ctx.fillText(this.run.practice?"PRACTICE / 練習・景品なし":"SCORE ATTACK / 星のコレクション",W/2,22);
    ctx.fillStyle="#FCF4E1";ctx.font="800 20px sans-serif";ctx.fillText("なかよしパズル",W/2,49);
    ctx.textAlign="left";ctx.font="700 10px sans-serif";ctx.fillStyle="#C4C8D6";ctx.fillText("SCORE",21,72);
    ctx.font="800 29px sans-serif";ctx.fillStyle="#FFF4DA";ctx.fillText(U.fmt(s.score),20,103);
    ctx.textAlign="right";ctx.font="800 26px sans-serif";ctx.fillStyle=s.remaining<10?"#FFACAA":"#C3EEE1";ctx.fillText(s.remaining.toFixed(1)+"s",W-20,99);
    ctx.font="700 10px sans-serif";ctx.fillStyle="#C4C8D6";ctx.fillText(`時計 ×${this.model.drain.toFixed(2)} · ${this.model.types}種類`,W-20,116);
    ctx.fillStyle="#46506A";U.rr(ctx,20,126,W-40,6,3);ctx.fill();ctx.fillStyle=s.remaining<10?"#F3989C":"#AFD9CB";U.rr(ctx,20,126,Math.max(1,(W-40)*s.remaining/65),6,3);ctx.fill();
    const next=PUZZLE_PRIZES.find(p=>s.score<p.score);ctx.textAlign="left";ctx.font="700 10px sans-serif";ctx.fillStyle="#DCD3BC";
    ctx.fillText(next?`次の景品 ${U.fmt(next.score)} pt ／ あと ${U.fmt(next.score-s.score)}`:"全景品のスコア達成！",20,148);
    for(let i=0;i<3;i++){const id=Save.d.order[i],c=Save.d.chars[id];Chara.draw(ctx,id,{face:"happy",outfit:c.outfit,color:c.color},W/2+(i-1)*42,this.by-7,30);}
    ctx.fillStyle=s.fever>0?"#D8B96D":"#111A2C";ctx.strokeStyle="#B8A679";ctx.lineWidth=2;U.rr(ctx,this.bx-5,this.by-5,this.cell*6+10,this.cell*6+10,15);ctx.fill();ctx.stroke();
    const preview=this.model.preview(this.chain),colors=["#E8B8CA","#EDDB9B","#B9D8C8","#B6CEE8","#C7B5E1","#E9BC9D"];
    for(let i=0;i<36;i++){
      const p=this.point(i),v=s.board[i],selected=this.chain.includes(i),willClear=preview?.clear.includes(i);
      ctx.fillStyle=colors[v];ctx.strokeStyle=selected?"#FFF9DA":willClear?"#FADEA0":"#354159";ctx.lineWidth=selected?3.5:willClear?3:1.5;
      ctx.beginPath();ctx.arc(p.x,p.y,this.cell*.405,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(v<3){const id=Chara.IDS[v],c=Save.d.chars[id];Chara.draw(ctx,id,{face:"happy",outfit:c.outfit,color:c.color},p.x,p.y+this.cell*.31,this.cell*.59);}
      else{ctx.fillStyle="#354159";ctx.textAlign="center";ctx.font=`800 ${this.cell*.44}px sans-serif`;ctx.fillText(["✦","☾","◆"][v-3],p.x,p.y+this.cell*.16);}
    }
    if(this.chain.length>1){ctx.strokeStyle="#FFFCED";ctx.lineWidth=4;ctx.lineJoin="round";ctx.lineCap="round";ctx.beginPath();this.chain.forEach((i,n)=>{const p=this.point(i);if(n)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}
    this.bursts=this.bursts.filter(b=>b.until>G.t);for(const b of this.bursts)FX.star(ctx,b.x,b.y,18*(b.until-G.t)/.45,"#FFF4AC");
    ctx.textAlign="center";ctx.font="800 12px sans-serif";ctx.fillStyle="#FFF2BC";
    const msg=preview?`${PUZZLE_SHAPES[preview.shape]} · ${preview.clear.length}個 · +${preview.points} pt · +${Math.min(PUZZLE_RULES.maxTime-s.remaining,preview.seconds).toFixed(1)}秒`:this.message?.until>G.t?this.message.text:"同じ絵を縦・横に3個から。輪は始点まで！";
    ctx.fillText(msg,W/2,bottom+25,W-24);
    ctx.font="700 11px sans-serif";ctx.fillStyle="#DADFEF";
    ctx.fillText(s.fever>0?`FEVER ×1.6　${s.fever.toFixed(1)}秒`:`${s.combo} COMBO　／　FEVER ${"◆".repeat(Math.min(6,s.charge))}${"◇".repeat(Math.max(0,6-s.charge))}`,W/2,bottom+46);
    ctx.font="10px sans-serif";ctx.fillStyle="#AFB9CD";ctx.fillText(`経過 ${s.elapsed.toFixed(0)} / 180秒　·　30秒ごとに時計が加速`,W/2,bottom+65);
    ctx.restore();
  }
}
SCENES.puzzle=PuzzleScene;
