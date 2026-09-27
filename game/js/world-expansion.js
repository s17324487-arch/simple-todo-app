// 川沿いの町・都会・海辺。既存エリアと宝箱IDは保つ。
(() => {
  const town = MAP_DEFS.town, grid = town.rows.map((row, y) => [...row, ...Array(12).fill(y === 0 || y === 31 ? "T" : ".")]);
  for (let y = 1; y < 31; y++) { grid[y][35] = "T"; grid[y][28] = "~"; grid[y][29] = "~"; grid[y][26] = "="; grid[y][32] = "="; }
  for (const y of [7, 20, 28]) for (let x = 23; x < 35; x++) grid[y][x] = x === 28 || x === 29 ? "b" : "=";
  for (const [x,y] of [[24,3],[25,12],[33,12],[30,24],[24,24],[31,4],[34,17]]) grid[y][x] = ",";
  for (const [x,y] of [[24,10],[33,22],[30,10]]) grid[y][x] = "n";
  for (const [x,y] of [[25,4],[33,4],[24,16],[33,26]]) grid[y][x] = "A";
  grid[7][35] = "=";
  town.rows = grid.map(row => row.join(""));
  town.warps.push({ x:35,y:7,w:1,h:1,to:"city",tx:1,ty:17,dir:"right" });
  town.signs.push({ x:31,y:6,text:"かわぞいの さんぽみち\nひがしへ いくと きらめきシティ" });
  town.npcs.push({ id:"parkcat",sp:"cat",x:31,y:21,dir:"down",name:"さんぽの ミント",talk:"parkcat" });
  TALKS.parkcat = { first:["かわを みながら のんびり しよう。"], lines:[["はしを わたると ちがう けしきが みえるね。"]] };
  const city = new FieldGen("city", 36, 32, "p"); city.border("T",1,0);
  city.path([[0,17],[35,17]],3,"="); city.path([[17,2],[17,30]],3,"=");
  city.blob(26,25,5,3,"."); city.blob(26,25,2,1.4,"~");
  for (const [x,y] of [[7,23],[9,25],[23,23],[29,27],[30,23]]) city.force(x,y,"A");
  for (const [x,y] of [[14,8],[20,8],[14,22],[20,22],[32,16],[3,16]]) city.force(x,y,"L");
  const buildings = [
    { id:"city_clothes",x:3,y:3,w:7,h:7,door:3,roof:"#7CA9C6",wall:"#E8E4DC",sign:"clothes",label:"そらいろ デパート",tower:true,act:{type:"buy",shop:"clothes"} },
    { id:"city_market",x:23,y:3,w:8,h:5,door:4,roof:"#D9A0AF",sign:"market",label:"シティ マルシェ",tower:true,act:{type:"buy",shop:"market"} },
    { id:"city_furniture",x:3,y:23,w:6,h:5,door:3,roof:"#9CB3A4",sign:"furniture",label:"インテリアの もり",tower:true,act:{type:"buy",shop:"furniture"} },
  ];
  for (const b of buildings) { for(let y=b.y;y<b.y+b.h;y++) for(let x=b.x;x<b.x+b.w;x++) city.force(x,y,"#"); city.force(b.x+b.door,b.y+b.h-1,"D"); }
  MAP_DEFS.city = { name:"きらめきシティ",bgm:"city",baseGround:"plaza",rows:city.rows(),buildings,objects:[],npcs:[{id:"cityguide",sp:"rabbit",x:19,y:16,dir:"down",name:"あんないの ルル",talk:"cityguide"}],signs:[{x:31,y:18,text:"ひがしは しおかぜビーチ\nてきの めやす Lv.16〜22"}],chests:[{id:"city_welcome",x:30,y:29,loot:{coins:150}}],spawns:[],warps:[{x:0,y:16,w:1,h:3,to:"town",tx:34,ty:7,dir:"left"},{x:35,y:16,w:1,h:3,to:"coast",tx:1,ty:9,dir:"right"}] };
  TALKS.cityguide={first:["ようこそ！ ここは きらめきシティ。\nデパートや こうえんで あそんでね。"],lines:[["つかれたら メニューから おうちへ かえれるよ。"],["うみべは つよい てきが いるよ。Lv.16 くらいから おすすめ！"]]};
  const beach=new FieldGen("coast",38,30,"s"); beach.border("R",1,0);
  for(let y=1;y<29;y++) for(let x=27;x<37;x++) beach.force(x,y,"~");
  beach.path([[0,9],[11,9],[14,17],[20,23],[31,23]],2,"s"); beach.path([[24,23],[35,23]],2,"b");
  for(const [x,y] of [[5,4],[8,5],[20,5],[5,20],[13,25],[23,13]]) beach.force(x,y,"A");
  MAP_DEFS.coast={name:"しおかぜビーチ",bgm:"coast",baseGround:"sand",area:"coast",rows:beach.rows(),objects:[],buildings:[],npcs:[{id:"beachpenguin",sp:"penguin",x:9,y:10,dir:"down",name:"うみの ペペ",talk:"beachpenguin"}],signs:[{x:3,y:8,text:"しおかぜビーチ\nつよい てきに きをつけてね"}],chests:[{id:"sea1",x:7,y:3,loot:{coins:200}},{id:"sea2",x:21,y:26,loot:{bag:"deza_ice",n:3}},{id:"sea3",x:34,y:22,loot:{wear:"marine_stripe"}},{id:"sea4",x:20,y:3,loot:{furn:"aquarium"}}],warps:[{x:0,y:9,w:1,h:2,to:"city",tx:34,ty:17,dir:"left"}],spawns:[[12,5],[20,10],[17,18],[8,22],[23,26],[21,16]]};
  TALKS.beachpenguin={first:["なみの おとって おちつくね。\nみんなで かいがらを さがそう！"],lines:[["あつい ひの デザは アイスだね！"]]};
  const enemyRows=[
    ["snail","カタコロン","snail","#D3B38F",3,32,10,10,4,10,[9,15],["e_tackle"]],
    ["sprout","メバエル","sprout","#A1CF8E",4,28,12,6,13,12,[10,16],["e_leaf","e_heal"]],
    ["fox","コギツネン","fox","#EDBD84",8,58,21,12,19,26,[17,25],["e_bite","e_sleep"]],
    ["moth","ユメチョウ","moth","#C7AED8",9,50,19,10,21,28,[18,27],["e_sleep","e_wave"]],
    ["robot","ブリキン","robot","#AAC7CB",14,104,30,27,10,52,[31,45],["e_rock","e_shine"]],
    ["crab","カニポン","crab","#EEA195",16,122,34,30,15,68,[38,52],["e_bite","e_tackle"]],
    ["jelly","クララ","jelly","#B3C7EA",18,110,36,20,24,78,[43,60],["e_sleep","e_wave"]],
    ["seahorse","タツノコロン","seahorse","#EAC384",20,154,40,29,22,95,[52,72],["e_shine","e_rock"]],
  ];
  for(const [id,name,art,col,lv,hp,atk,def,spd,exp,coin,skills] of enemyRows) ENEMIES[id]={name,art,col,lv,hp,atk,def,spd,exp,coin,skills,desc:"みんなと あそびたい ちょっぴり やんちゃな なかま。"};
  AREAS.meadow.table.push(["snail",3,4,2],["sprout",4,5,2]); AREAS.forest.table.push(["fox",8,10,3],["moth",9,10,2]); AREAS.cave.table.push(["robot",14,16,3]);
  AREAS.coast={name:"しおかぜビーチ",bg:"coast",table:[["crab",16,19,4],["jelly",18,21,3],["seahorse",20,22,2]],group:[1,2]};
  SONGS.city={bpm:124,tracks:[{wave:"pulse",vol:.09,notes:"E5 G5 B5 . A5 G5 E5 . D5 F#5 A5 . G5 E5 D5 ."},{wave:"triangle",vol:.18,notes:"C3 . G3 . A2 . E3 . D3 . A3 . G2 . D3 ."}]};
  SONGS.coast={bpm:94,tracks:[{wave:"sine",vol:.13,notes:"D5 . F5 A5 . G5 F5 . C5 . E5 G5 . F5 E5 ."},{wave:"triangle",vol:.16,notes:"D3 . A3 . F3 . A3 . C3 . G3 . E3 . G3 ."}]};
})();

const WorldAtlas = {
  open() { const body=U.el("div"); this.render(body); return UI.modal({title:"ぜんたい ちず",body,cls:"full"}); },
  render(el) {
    const current=G.sceneName === "world" ? G.scene.mapId : Save.d.world.map;
    const nodes={town:[70,70],city:[225,70],coast:[225,160],meadow:[70,160],forest:[70,250],cave:[225,250]};
    const edges=[["town","city"],["city","coast"],["town","meadow"],["meadow","forest"],["forest","cave"]];
    let svg=edges.map(([a,b])=>`<path d="M${nodes[a]} L${nodes[b]}" stroke="#BBA888" stroke-width="8" fill="none"/>`).join("");
    for(const [id,[x,y]] of Object.entries(nodes)) svg+=`<g><rect x="${x-62}" y="${y-24}" width="124" height="48" rx="14" fill="${id===current?"#FFE29C":"#FDF6E8"}" stroke="#544633" stroke-width="2"/><text x="${x}" y="${y-2}" text-anchor="middle" font-size="11" font-family="sans-serif">${MAP_DEFS[id].name}</text><text x="${x}" y="${y+14}" text-anchor="middle" font-size="10">${id===current?"★ いま ここ":AREAS[id]?`Lv.${AREAS[id].table[0][1]}〜` :"おみせ・おさんぽ"}</text></g>`;
    el.append(U.el("div",{html:`<svg viewBox="0 0 300 290" role="img" aria-label="町とエリアのつながり">${svg}</svg>`}));
    const tabs=U.el("div",{class:"atlas-areas"}), detail=U.el("div"); el.append(tabs,detail);
    const show=id=>{
      const d=MAP_DEFS[id], width=d.rows[0].length; let tiles="";
      d.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{const col=ch==="~"?"#8AC8E2":ch==="#"?"#C89CAA":"TPABRhWF".includes(ch)?"#7FA18A":"=-pbD".includes(ch)?"#EEE4CF":ch==="s"?"#F0D7A0":"#BDD6A1";tiles+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;}));
      if(id===current && G.sceneName==="world") {const p=G.scene.party[0];tiles+=`<circle cx="${p.tx+.5}" cy="${p.ty+.5}" r=".8" fill="#E45662" stroke="white" stroke-width=".3"/>`;}
      for(const warp of d.warps||[]) tiles+=`<rect x="${warp.x}" y="${warp.y}" width="${warp.w}" height="${warp.h}" fill="#BD87CF"/>`;
      detail.innerHTML=`<h3>${d.name}</h3><svg viewBox="0 0 ${width} ${d.rows.length}" style="width:100%;max-height:360px" role="img" aria-label="${d.name}の詳細地図">${tiles}</svg><div class="note">あかい まる：いまの ばしょ ／ むらさき：つぎの エリア</div>`;
      for(const b of d.buildings||[]) detail.append(U.el("div",{class:"muted",text:`${b.label}：よこ ${b.x+b.door+1}・たて ${b.y+b.h}`}));
    };
    for(const id in nodes) tabs.append(UI.btn(MAP_DEFS[id].name,()=>show(id),"small")); show(nodes[current]?current:"town");
  },
};
