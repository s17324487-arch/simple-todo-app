// 展示・学校・モールに共通の歩ける屋内。保存する座標は屋外の入口のみ。
const VenueHalls = {
  defs:{},
  enter(id,back){if(!this.defs[id])return false;Game.goto('venue',{venue:id,back},'circle');return true;},
  item(id){return FURN_INDEX[id]||ITEM_INDEX[id]||BAG_INDEX[id];},
};
class VenueScene {
  async enter(p){
    this.id=p.venue;this.def=VenueHalls.defs[this.id];this.back={...p.back};this.floor=p.floor||this.def.start||1;this.cam={x:0,y:0};this.closed=false;this.busy=false;this.clock=0;
    this.loadFloor(this.floor);Save.d.world={...this.back};Save.write();
    await Chara.preload(Save.d.order.flatMap(id=>Object.keys(DIRS).flatMap(dir=>['idle_01','walk_01','walk_02'].map(pose=>[id,{dir,pose,outfit:Save.d.chars[id].outfit,color:Save.d.chars[id].color}]))),46);
    UI.showHud(true,this.def.name);Sound.bgm(this.def.bgm||'house');
    this.bar=U.el('div',{class:'venue-controls'});this.guide=U.el('span',{text:'スライド・タップで あるく・展示を しらべる'});
    this.bar.append(this.guide);UI.root.append(this.bar);
    // フロア案内・たてものを でる は 上に 小さく（オーナーの FB 2026-10-01「ボタンサイズを小さくして、上側に持っていけ」）。おうちへ は みぎうえ の まま
    this.top=U.el('div',{class:'venue-top'});this.top.append(UI.btn('フロア案内',()=>this.guideMenu(),'small'),UI.btn('たてものを でる',()=>this.leave(),'small'));UI.root.append(this.top);
    this.home=UI.btn('おうちへ',()=>{if(!this.busy&&!Game.inputLocked)Game.goto('house',{},'circle');},'store-home small');UI.root.append(this.home);
    if(this.def.arrive)this.def.arrive(this);
  }
  loadFloor(floor,spawn){
    this.cancel();this.floor=floor;this.room=this.def.floors[floor];this.fixtures=this.room.fixtures.map(f=>({...f}));this.path=[];this.pending=null;
    const at=spawn||this.room.spawn||[Math.floor(this.room.w/2),this.room.h-3];this.party=Save.d.order.map((id,i)=>new Walker(at[0]-i,at[1],'up'));this.snap();
  }
  exit(){this.cancel();this.closed=true;this.bar?.remove();this.top?.remove();this.home?.remove();UI.showHud(false);}
  resize(){this.snap();}
  cameraTarget(){const p=this.party[0],r=this.room;return {x:U.clamp(p.x*32+16,G.W/2,r.w*32-G.W/2),y:U.clamp(p.y*32+16,G.H/2-50,Math.max(G.H/2-50,r.h*32-G.H/2+95))};}
  snap(){if(this.party)this.cam=this.cameraTarget();}
  point(x,y){return {x:x*32+16,y:y*32+27};}
  screen(x,y){const p=this.point(x,y);return {x:p.x-this.cam.x+G.W/2,y:p.y-this.cam.y+G.H/2};}
  walkable(x,y){const r=this.room;return x>=1&&x<r.w-1&&y>=3&&y<r.h-1&&!this.fixtures.some(f=>!f.hidden&&!f.walk&&x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h)&&!(r.hole&&x>=r.hole.x&&x<r.hole.x+r.hole.w&&y>=r.hole.y&&y<r.hole.y+r.hole.h);}
  route(x,y){
    if(!this.walkable(x,y))return null;const l=this.party[0],key=l.tx+','+l.ty+':'+this.fixtures.map(f=>f.hidden?'1':'0').join('');
    if(!this.routeCache||this.routeCache.room!==this.room||this.routeCache.key!==key){
      const queue=[[l.tx,l.ty]],prev=new Map([[l.tx+','+l.ty,null]]);
      for(let i=0;i<queue.length;i++){const [cx,cy]=queue[i];for(const [dx,dy]of Object.values(DIRS)){const nx=cx+dx,ny=cy+dy,k=nx+','+ny;if(this.walkable(nx,ny)&&!prev.has(k)){prev.set(k,cx+','+cy);queue.push([nx,ny]);}}}
      this.routeCache={key,room:this.room,prev};
    }
    const prev=this.routeCache.prev;let k=x+','+y;if(!prev.has(k))return null;const path=[];while(prev.get(k)!==null){path.unshift(k.split(',').map(Number));k=prev.get(k);}return path;
  }
  walkTo(x,y,action=null){const path=this.route(x,y);if(!path)return false;this.path=path;this.pending=action;return true;}
  request(f){
    if(Game.inputLocked||this.busy||f.hidden)return false;const spots=[];
    for(let y=f.y-1;y<=f.y+f.h;y++)for(let x=f.x-1;x<=f.x+f.w;x++)if(x===f.x-1||x===f.x+f.w||y===f.y-1||y===f.y+f.h){const p=this.route(x,y);if(p)spots.push({x,y,p});}
    spots.sort((a,b)=>a.p.length-b.p.length);if(!spots.length)return false;const s=spots[0];this.walkTo(s.x,s.y,f);return true;
  }
  async interact(f){
    if(this.busy||this.closed)return;this.busy=true;
    try{
      if(f.action==='floor'){this.changeFloor(f.to,f.spawn);return;}
      if(f.action==='elevator'){const levels=Object.keys(this.def.floors),i=await UI.ask('エレベーター\nなんかいへ いく？',[...levels.map(k=>k+'F'),'やめておく']);if(i>=0&&i<levels.length)this.changeFloor(+levels[i],[this.room.w-4,5]);return;}
      if(f.action==='buy'){const it=VenueHalls.item(f.item);ShopUI.detail(f.shop,f.kind,it,()=>UI.updateHud());return;}
      if(f.action==='shop'){await ShopUI.open(f.shop);return;}
      if(f.action==='puzzle'){await PuzzleArcade.open({...this.back,venueReturn:{venue:this.id,floor:this.floor,back:this.back}});return;}
      if(f.action==='eat'){await this.eat(f);return;}
      if(f.action==='crane'){if(typeof PrizeArcade!=='undefined')await PrizeArcade.open(f.machine,{venue:this.id,floor:this.floor,back:this.back});return;}
      if(f.action==='parent'){if(!MamaSchedule.working()){UI.toast('ままは おうちに いるよ');return;}await UI.say([{who:Save.d.order[0],emo:'love',text:'あいにきたよー♡'},{name:'まま',face:ParentCare.svg('mama',ParentCare.look('mama'),'wave'),text:'きてくれて ありがとう♡ おしごと がんばるね。'}]);return;}
      if(f.action==='sit'){this.sitting=4;Sound.se('good');for(const id of Save.d.order)Save.care(id,{mood:1});Save.write();}
      await UI.say([{name:f.label,text:f.text||'ゆっくり ながめて たのしもう。'}]);
    }finally{this.busy=false;}
  }
  async eat(f){
    const ids=f.menu,i=await UI.ask(f.label+'\nテーブルで 3にん いっしょに たべよう。',[...ids.map(id=>BAG_INDEX[id].name+'（'+BAG_INDEX[id].price+'コイン／3にん）'),'やめておく']);if(i<0||i>=ids.length)return;
    const food=BAG_INDEX[ids[i]];if(Save.d.coins<food.price){UI.toast('コインが たりないよ');return;}Save.d.coins-=food.price;
    for(const id of Save.d.order)Save.care(id,{hunger:food.hunger,mood:food.mood});Save.write();UI.updateHud();this.sitting=6;
    await UI.say(Save.d.order.map(id=>({who:id,emo:'happy',text:id==='goji'?'ガゥー♡ おいしい！':food.deza?'デザ、だいすき♡':'おいしいね！ あとで デザも たべたいな♪'})));
  }
  changeFloor(floor,spawn){if(floor===this.floor)return;this.previous={floor:this.floor,room:this.room,fixtures:this.fixtures,party:this.party,cam:{...this.cam}};this.liftDirection=floor>this.floor?1:-1;this.loadFloor(floor,spawn);this.lift=1.2;Sound.se('door');UI.showHud(true,this.def.name+' '+floor+'F');}
  async guideMenu(){
    if(this.busy||Game.inputLocked)return;this.busy=true;const places=this.fixtures.filter(f=>f.action&&!f.hidden);
    try{const i=await UI.ask(this.def.name+' '+this.floor+'F\nいきたい ばしょまで あるくよ。',[...places.map(f=>f.label),'やめておく']);this.busy=false;if(i>=0&&i<places.length)this.request(places[i]);}finally{this.busy=false;}
  }
  leave(){if(this.busy||Game.inputLocked)return;Save.write();Game.goto('world',this.back,'circle');}
  // Esc（cancel）は 町・おうちと おなじ すまほ
  key(k,down){if(down&&k==='cancel'){Game.openMenu();return;}if(down&&k==='ok'){const l=this.party[0],[dx,dy]=DIRS[l.dir];const f=this.fixtures.find(f=>l.tx+dx>=f.x&&l.tx+dx<f.x+f.w&&l.ty+dy>=f.y&&l.ty+dy<f.y+f.h);if(f)this.request(f);}}
  down(p) { IndoorWalk.down(this,p); }
  move(p) { IndoorWalk.move(this,p); }
  cancel() { IndoorWalk.cancel(this); }
  up(p,cancel){if(!IndoorWalk.release(this,p,cancel))return;const x=(p.x-G.W/2+this.cam.x)/32,y=(p.y-G.H/2+this.cam.y)/32;
    const f=[...this.fixtures].reverse().find(f=>f.action&&!f.hidden&&x>=f.x-.2&&x<f.x+f.w+.2&&y>=f.y-.7&&y<f.y+f.h+.2);if(f)this.request(f);else this.walkTo(Math.floor(x),Math.floor(y));}
  update(dt){
    if(Game.inputLocked||this.busy||document.hidden){this.cancel();return;}this.clock+=dt;if(this.lift>0){this.cancel();this.lift-=dt;return;}if(this.sitting>0)this.sitting-=dt;
    for(const p of this.party)p.update(dt);const l=this.party[0];if(!l.moving){const key=IndoorWalk.direction(this);if(key){const [dx,dy]=DIRS[key];l.dir=key;this.path=[];this.pending=null;if(this.walkable(l.tx+dx,l.ty+dy))this.path=[[l.tx+dx,l.ty+dy]];}
      if(this.path.length){const [x,y]=this.path.shift();for(let i=2;i>0;i--)this.party[i].moveTo(this.party[i-1].tx,this.party[i-1].ty,WALK_DUR);l.moveTo(x,y,WALK_DUR);this.sitting=0;}
      else if(this.pending){const f=this.pending;this.pending=null;this.interact(f);}}
    const desired=this.cameraTarget();this.cam.x=U.lerp(this.cam.x,desired.x,Math.min(1,dt*12));this.cam.y=U.lerp(this.cam.y,desired.y,Math.min(1,dt*12));
    if(this.def.update)this.def.update(this,dt);
  }
  render(ctx){
    ctx.fillStyle='#DDD7CC';ctx.fillRect(0,0,G.W,G.H);
    const layer=(room,fixtures,party,cam,floor,offset)=>{ctx.save();ctx.beginPath();ctx.rect(0,offset,G.W,G.H);ctx.clip();ctx.translate(G.W/2-cam.x,G.H/2-cam.y+offset);VenueHallArt.floor(ctx,room,floor,this.clock);
      const list=fixtures.filter(f=>!f.hidden&&f.x*32<cam.x+G.W/2+64&&(f.x+f.w)*32>cam.x-G.W/2-64&&(f.y+f.h)*32>cam.y-G.H/2-32&&f.y*32<cam.y+G.H/2+128).map(f=>({z:(f.y+f.h)*32,draw:()=>VenueHallArt.fixture(ctx,f,this.clock)}));
      party.forEach((p,i)=>list.push({z:p.y*32+27,draw:()=>{const q=this.point(p.x,p.y),id=Save.d.order[i],c=Save.d.chars[id];ctx.fillStyle='#45392B22';ctx.beginPath();ctx.ellipse(q.x,q.y,15,5,0,0,7);ctx.fill();Chara.draw(ctx,id,{pose:p.pose(),dir:p.dir,face:this.sitting>0?'happy':'normal',outfit:c.outfit,color:c.color},q.x,q.y+(this.sitting>0?5:0),46);}}));list.sort((a,b)=>a.z-b.z).forEach(o=>o.draw());ctx.restore();};
    let offset=0;if(this.lift>0&&this.previous){const t=U.clamp(1-this.lift/1.2,0,1),ease=t*t*(3-2*t),p=this.previous;offset=(1-ease)*G.H*this.liftDirection;layer(p.room,p.fixtures,p.party,p.cam,p.floor,-ease*G.H*this.liftDirection);}
    layer(this.room,this.fixtures,this.party,this.cam,this.floor,offset);
    IndoorWalk.render(this,ctx);
  }
}
SCENES.venue=VenueScene;
