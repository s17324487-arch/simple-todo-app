// 買い物とミニゲームに共通の、歩いて入る店内。
// 専門店でも既存の商品ID・価格・所持品を共用する。
for (const [id,kind,label,ids] of [
  ["burger","bag","バーガーと のみもの",["burger","milk","juice"]],
  ["groom","wear","リボン",["ribbon_pink","ribbon_blue"]],
  ["cake","bag","ケーキと デザ",["cake","pudding","milk"]],
  ["crepe","bag","デザ",["pudding","cake","juice"]],
  ["bakery","bag","パンと おやつ",["bread","bone","milk"]],
  ["florist","furn","おはなと みどり",["plant","plantshelf","garland"]],
]) {
  const owner=SHOP_OWNERS[id];
  BUY_SHOPS[id]={name:SHOPS[id].name,keeper:owner,keeperName:owner.name,hello:["いらっしゃい！ ゆっくり みていってね。"],kind,
    tabs:[["goods",label]],items:()=>ids.map(k=>kind==="bag"?BAG_INDEX[k]:kind==="wear"?ITEM_INDEX[k]:FURN_INDEX[k])};
}

class StoreScene {
  async enter(p) {
    this.shopId=p.shop; this.design=STORE_INTERIORS[p.shop];
    this.back={...p.back}; this.closed=false; this.path=[]; this.pending=null;
    const retail=BUY_SHOPS[p.shop];
    this.owner=retail?{...retail.keeper,name:retail.keeperName}:SHOP_OWNERS[p.shop];
    this.keeperActor=NpcLife.stationaryActor(this.owner);
    this.name=(retail||SHOPS[p.shop]).name;
    if(p.shop==='burger'&&this.back.map==='heiwadai')this.name='マックさん';
    this.fixtures=this.design.fixtures.map(([kind,x,y,w,d,label])=>({kind,x,y,w,d,label}));
    this.fixtures.push({kind:"counter",x:4,y:2,w:3,d:1,label:"レジ"});
    this.party=Save.d.order.map((id,i)=>new Walker(5-i,p.atCounter?4:10,"up"));
    this.resize();
    Save.d.world={...this.back}; Save.write();
    await this.preload();
    Sound.bgm("shop_"+this.shopId); UI.showHud(true,this.name);
    this.bar=U.el("div",{class:"store-bar"});
    this.hint=U.el("div",{class:"store-hint",text:"スライド・タップで あるく・てんいんに はなそう"});
    this.talkButton=UI.btn("てんいんと はなす",()=>this.request("talk"),"yellow");
    this.bar.append(this.hint,this.talkButton,UI.btn("おみせを でる",()=>this.request("exit")));
    UI.root.append(this.bar);
    this.homeButton=UI.btn("おうちへ",()=>{if(!Game.inputLocked&&!this.interacting){Save.write();Game.goto("house",{},"circle");}},"store-home small");
    UI.root.append(this.homeButton);
  }
  exit() { this.cancel();this.closed=true;this.bar?.remove();this.homeButton?.remove();UI.showHud(false); }
  resize() {
    this.scale=Math.min((G.W-10)/352,(G.H-206)/512,1.3);
    this.ox=(G.W-352*this.scale)/2; this.oy=114+(G.H-206-512*this.scale)/2;
  }
  async preload() {
    const list=[];
    for(const id of Save.d.order)for(const dir of Object.keys(DIRS))for(const pose of ["idle_01","idle_02","walk_01","walk_02"]){
      const c=Save.d.chars[id];list.push([id,{dir,pose,outfit:c.outfit,color:c.color}]);
    }
    await Promise.all([Chara.preload(list,42),this.background(true),...this.fixtures.map(f=>this.propCanvas(f,true)),this.keeperCanvas(true),this.keeperCanvas(true,true)]);
  }
  background(ensure=false) { return SvgCache[ensure?"ensure":"get"]("store:room:"+this.shopId,()=>StoreArt.room(this.shopId),Math.ceil(352*G.px),Math.ceil(512*G.px)); }
  propCanvas(f,ensure=false) { return SvgCache[ensure?"ensure":"get"]("store:prop:"+f.kind,()=>StoreArt.prop(f.kind),Math.ceil(180*G.px),Math.ceil(155*G.px)); }
  keeperCanvas(ensure=false,neutral=false) { const v=neutral?{pose:"idle_01",emo:"normal",gesture:"none"}:NpcLife.visual(this.keeperActor),spec={...this.owner,pose:v.pose,emo:v.emo,gesture:v.gesture};return SvgCache[ensure?"ensure":"get"]("store:keeper:"+this.shopId+":"+[v.pose,v.emo,v.gesture].join(":"),()=>Art.npcSvg(spec),Chara.pxSize(46),Math.round(Chara.pxSize(46)*VB.h/VB.w)); }
  point(x,y) { return {x:16+x*32+16,y:112+y*32+27}; }
  screen(x,y) { const p=this.point(x,y);return{x:this.ox+p.x*this.scale,y:this.oy+p.y*this.scale}; }
  walkable(x,y) { return x>=0&&x<10&&y>=0&&y<12&&!(x===5&&y===1)&&!this.fixtures.some(f=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.d); }
  route(x,y) {
    if(!this.walkable(x,y))return null;
    const l=this.party[0],queue=[[l.tx,l.ty]],prev=new Map([[l.tx+","+l.ty,null]]);
    for(let i=0;i<queue.length;i++){
      const [cx,cy]=queue[i];if(cx===x&&cy===y){const path=[];let k=x+","+y;while(prev.get(k)!==null){path.unshift(k.split(",").map(Number));k=prev.get(k);}return path;}
      for(const [dx,dy] of Object.values(DIRS)){const nx=cx+dx,ny=cy+dy,key=nx+","+ny;if(this.walkable(nx,ny)&&!prev.has(key)){prev.set(key,cx+","+cy);queue.push([nx,ny]);}}
    }
    return null;
  }
  walkTo(x,y,action=null) { const path=this.route(x,y);if(!path)return false;this.path=path;this.pending=action;return true; }
  request(action) {
    if(Game.inputLocked||this.interacting||this.closed)return;
    Sound.se("tap");this.walkTo(5,action==="talk"?3:11,action);
  }
  async talk() {
    if(this.interacting||this.closed)return;
    this.interacting=true;this.party[0].dir="up";
    try {
      if(this.shopId==="link"){await PuzzleArcade.open(this.back);return;}
      const retail=BUY_SHOPS[this.shopId],work=SHOPS[this.shopId];
      // ③ みなとの マルシェでは りっぱな つりざおも かえる
      const pro=typeof Fishing!=="undefined"&&Fishing.proChoice(this);
      // ③ スーパーでは いけすの さかなを うれる（つった ときには うらない）
      const sell=typeof Fishing!=="undefined"&&Fishing.sellChoice(this);
      // ネリカスタウンの コンビニでは いちばんくじも ひける（js/ichiban-kuji.js）
      const kuji=typeof IchibanKuji!=="undefined"&&IchibanKuji.talkChoice(this);
      const choices=[...(retail?["かいものを する"]:[]),...(kuji?[kuji.label]:[]),...(sell?[sell]:[]),...(pro?[pro]:[]),...(work?["おてつだいする"]:[]),"また あとで"];
      const text=retail?retail.hello[0]:`${work.desc}。\nおみせ Lv.${ShopRewards.level(Save.d.shops[this.shopId])}`;
      const answer=await UI.ask(`${this.owner.name}\n${text}`,choices),picked=choices[answer];
      if(this.closed)return;
      if(retail&&picked==="かいものを する"){await ShopUI.open(this.shopId);Save.write();}
      else if(kuji&&picked===kuji.label){await kuji.run();Save.write();}
      else if(sell&&picked===sell){await Fishing.sell();Save.write();}
      else if(pro&&picked===pro){await Fishing.buyPro(this.owner);Save.write();}
      else if(work&&picked==="おてつだいする"){
        if(Chara.IDS.some(id=>Save.d.chars[id].hunger<8))await UI.say([{who:"wanko",emo:"sad",text:"おなかが ぺこぺこだよ〜。\nごはんを たべてから おてつだい しよう。"}]);
        else {
          // ころころ フルーツは ちゅうもん モード と スコア モード（js/korokoro-score.js）を えらべる
          const mode=typeof KorokoroScore!=="undefined"?await KorokoroScore.choose(this):"order";
          if(this.closed||!mode)return;
          // あたまの たいそうは 3しゅの ゲームから えらぶ（js/mg-brain.js。ほかの おみせは ""）
          const game=mode==="order"&&typeof BrainGames!=="undefined"?await BrainGames.choose(this):"";
          if(this.closed||game===null)return;
          if(mode==="score")KorokoroScore.start(this.back);
          else Game.goto("shop",{shop:this.shopId,back:this.back,returnStore:true,variant:game||(this.shopId==="burger"&&this.back.map==="heiwadai"?"mac":null)});
        }
      }
    } finally { this.interacting=false; }
  }
  leave() { if(this.closed||Game.trans)return;Save.write();Sound.se("door");Game.goto("world",this.back); }
  key(k,down) { if(down&&k==="ok")this.request("talk"); }
  down(p) { IndoorWalk.down(this,p); }
  move(p) { IndoorWalk.move(this,p); }
  cancel() { IndoorWalk.cancel(this); }
  up(p,cancel) {
    if(!IndoorWalk.release(this,p,cancel))return;
    const x=(p.x-this.ox)/this.scale,y=(p.y-this.oy)/this.scale,keeper=this.point(5,1);
    // 店員の絵とカウンターをまとめて大きいタップ領域にする。
    if(x>=144&&x<=240&&y>=keeper.y-80&&y<=223){this.request("talk");return;}
    if(x>=143&&x<=243&&y>=460&&y<=504){this.request("exit");return;}
    const tx=Math.floor((x-16)/32),ty=Math.floor((y-112)/32);
    if(tx===5&&ty===11){this.request("exit");return;}
    if(this.walkTo(tx,ty))return;
    const f=this.fixtures.find(f=>tx>=f.x&&tx<f.x+f.w&&ty>=f.y&&ty<f.y+f.d);
    // いちばんくじの たな: まえまで あるいて くじの ボード（js/ichiban-kuji.js）
    if(f&&typeof IchibanKuji!=="undefined"&&IchibanKuji.tapFixture(this,f)){this.highlight={f,until:G.t+1.5};return;}
    if(f){Sound.se("tap");UI.toast(f.label+"。ゆっくり みていってね");this.highlight={f,until:G.t+1.5};}
  }
  update(dt) {
    NpcLife.updateStationary(this.keeperActor,dt,!!this.interacting);
    if(IndoorWalk.blocked(this)){this.cancel();return;}
    for(const w of this.party)w.update(dt);
    const l=this.party[0];if(l.moving)return;
    const key=IndoorWalk.direction(this);
    if(key){const [dx,dy]=DIRS[key];this.path=[];this.pending=null;l.dir=key;if(this.walkable(l.tx+dx,l.ty+dy))this.path=[[l.tx+dx,l.ty+dy]];}
    if(this.path.length){
      const [x,y]=this.path.shift();
      for(let i=this.party.length-1;i>0;i--)this.party[i].moveTo(this.party[i-1].tx,this.party[i-1].ty,WALK_DUR);
      l.moveTo(x,y,WALK_DUR);
    } else if(this.pending){const action=this.pending;this.pending=null;if(typeof action==="function")action();else if(action==="talk")this.talk();else this.leave();}
    else if(l.tx===5&&l.ty===11)this.leave();
  }
  render(ctx) {
    ctx.fillStyle="#EDE5D4";ctx.fillRect(0,0,G.W,G.H);
    ctx.save();ctx.translate(this.ox,this.oy);ctx.scale(this.scale,this.scale);
    const bg=this.background();if(bg)ctx.drawImage(bg,0,0,352,512);
    ShopDecor.store(ctx,ShopDecor.level(this.shopId));
    const objects=this.fixtures.map(f=>({z:112+(f.y+f.d)*32,draw:()=>this.drawProp(ctx,f)}));
    objects.push({z:this.point(5,1).y,draw:()=>this.drawKeeper(ctx)});
    this.party.forEach((w,i)=>objects.push({z:this.point(w.x,w.y).y,draw:()=>{
      const p=this.point(w.x,w.y),id=Save.d.order[i],c=Save.d.chars[id];
      this.shadow(ctx,p.x,p.y,13);Chara.draw(ctx,id,{pose:w.pose(),dir:w.dir,outfit:c.outfit,color:c.color},p.x,p.y,42);
    }}));
    objects.sort((a,b)=>a.z-b.z);objects.forEach(o=>o.draw());
    // 会話の入口はキャラの頭より上に描く（レジや顔に重ねない）。
    const k=this.point(5,1),bob=Math.sin(G.t*3)*1.5;
    ctx.fillStyle="#FFF7D9";ctx.strokeStyle=INK;ctx.lineWidth=1.4;U.rr(ctx,k.x-29,k.y-75+bob,58,21,9);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText("はなす",k.x,k.y-61+bob);
    ctx.restore();
    IndoorWalk.render(this,ctx);
  }
  shadow(ctx,x,y,r) { ctx.fillStyle="rgba(62,49,32,.15)";ctx.beginPath();ctx.ellipse(x,y,r,r*.23,0,0,Math.PI*2);ctx.fill(); }
  drawProp(ctx,f) {
    const c=this.propCanvas(f),w=f.w*32-4,h=f.kind==="counter"?57:f.kind==="lamp"?80:Math.max(57,w*.86),x=18+f.x*32,y=112+(f.y+f.d)*32-3;
    this.shadow(ctx,x+w/2,y,w*.48);if(c)ctx.drawImage(c,x,y-h,w,h);
    if(this.highlight?.f===f&&this.highlight.until>G.t){ctx.strokeStyle="#FFF2B1";ctx.lineWidth=3;U.rr(ctx,x-2,y-h-2,w+4,h+4,6);ctx.stroke();}
    if(f.kind==="oven"||f.kind==="griddle"){
      ctx.save();ctx.strokeStyle="#FFF4DC";ctx.lineWidth=2;ctx.globalAlpha=.5;
      for(let i=0;i<3;i++){const t=(G.t*.4+i*.3)%1;ctx.beginPath();ctx.moveTo(x+w*(.3+i*.18),y-h*(.6+t*.3));ctx.quadraticCurveTo(x+w*(.3+i*.18)+Math.sin(t*6)*4,y-h*(.7+t*.3),x+w*(.3+i*.18),y-h*(.8+t*.3));ctx.stroke();}ctx.restore();
    }
    if(f.kind==="arcade"||f.kind==="conveyor"){
      ctx.fillStyle=Math.floor(G.t*2)%2?"#FFE49C":"#B8DFD2";ctx.beginPath();ctx.arc(x+w*.8,y-h*.3,2.2,0,7);ctx.fill();
    }
  }
  drawKeeper(ctx) {
    const c=this.keeperCanvas()||this.keeperCanvas(false,true),p=this.point(5,1),w=46,h=w*VB.h/VB.w;
    const v=NpcLife.visual(this.keeperActor);this.shadow(ctx,p.x,p.y,13);
    if(c){ctx.save();ctx.translate(p.x,p.y+v.dy);ctx.rotate(v.tilt*Math.PI/180);ctx.drawImage(c,-w*((FOOT.x-VB.x)/VB.w),-h*((FOOT.y-VB.y)/VB.h),w,h);ctx.restore();}
  }
}
SCENES.store=StoreScene;
