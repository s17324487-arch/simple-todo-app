// 店内は町とは別の、10×12マスの歩ける空間。セーブの座標は入口の外に保つ。
const STORE_INTERIORS = {
  cake: {wall:"#F2DEE5",floor:"#EFE2CA",accent:"#BC98AC",motif:"check",caption:"きねんびを いろどる デザ",fixtures:[
    ["pastrycase",0,0,3,2,"ホールケーキの ショーケース"],["jars",8,0,2,2,"クリームと くだもの"],["pastrycase",0,5,3,2,"ちいさな デザ"],["decorating",7,5,3,2,"ケーキを かざる だい"],["cafe",0,9,3,1,"おいわいの せき"],["dessert",8,9,2,1,"おくりものの ケーキ"]]},
  clothes: { wall: "#F4DCE5", floor: "#EDDAC3", accent: "#B87893", motif: "stripe", caption: "とっておきの いちまい", fixtures: [
    ["rack",0,1,3,1,"ふくの ラック"], ["fitting",8,0,2,3,"しちゃくしつ"], ["mirror",0,4,2,1,"おおきな かがみ"], ["folded",7,5,3,2,"たたんだ おようふく"], ["mannequin",1,7,2,1,"きょうの おすすめ"], ["accessories",7,9,3,1,"ぼうしと リボン"] ] },
  furniture: { wall: "#E8DEC7", floor: "#CDA878", accent: "#7F9A88", motif: "wood", caption: "くらしの どうぐと ぬくもり", fixtures: [
    ["bookcase",0,0,3,2,"きの ほんだな"], ["swatches",8,0,2,2,"かべがみの みほん"], ["bed",0,5,3,3,"ベッドの おへや"], ["sofa",7,5,3,2,"くつろぎ コーナー"], ["lamp",1,9,2,1,"あかりの みほん"], ["table",7,9,3,1,"テーブルの みほん"] ] },
  market: { wall: "#E6EBD3", floor: "#F4F0DE", accent: "#77A785", motif: "tile", caption: "しんせん・おいしい・まいにち", fixtures: [
    ["fridge",0,0,3,2,"ひんやり れいぞうこ"], ["shelf",8,0,2,3,"のみものの たな"], ["produce",0,5,3,2,"くだもの いちば"], ["groceries",7,5,3,2,"たべものの たな"], ["baskets",0,9,2,1,"おかいもの かご"], ["flowers",8,9,2,1,"きせつの はな"] ] },
  crepe: { wall: "#FFE2D3", floor: "#F7DFCF", accent: "#D9979E", motif: "check", caption: "あまい かおりの クレープや", fixtures: [
    ["griddle",0,0,3,2,"クレープの てっぱん"], ["dessert",8,0,2,2,"デザの ショーケース"], ["cafe",0,5,3,2,"まどべの テーブル"], ["cafe",7,6,3,2,"くつろぎの せき"], ["menu",1,9,2,1,"きょうの メニュー"], ["jars",8,9,2,1,"トッピングの びん"] ] },
  dentist: { wall: "#D9EDF0", floor: "#EEF4EE", accent: "#80B8C8", motif: "tile", caption: "にっこり しろい は", fixtures: [
    ["sink",0,0,3,2,"てあらい コーナー"], ["cabinet",8,0,2,2,"きれいな どうぐ"], ["dental",0,5,3,3,"しんさつの いす"], ["waiting",7,6,3,1,"まちあいの いす"], ["books",7,9,2,1,"えほん コーナー"], ["tooth",1,9,2,1,"はみがきの みほん"] ] },
  bakery: { wall: "#F2DFC0", floor: "#CBA17D", accent: "#B8764E", motif: "wood", caption: "まいあさ こんがり やきたて", fixtures: [
    ["oven",0,0,3,2,"いしがま オーブン"], ["flour",8,0,2,2,"こむぎこの ふくろ"], ["bread",0,5,3,2,"やきたての パン"], ["dough",7,5,3,2,"パンを こねる だい"], ["bread",7,9,3,1,"おみやげの パン"], ["cafe",0,9,3,1,"ひとやすみの せき"] ] },
  florist: { wall: "#E1ECD6", floor: "#D2C5A5", accent: "#85A277", motif: "stone", caption: "おはなと みどりの おくりもの", fixtures: [
    ["trellis",0,0,3,2,"つるばなの たな"], ["flowers",8,0,2,2,"いろとりどりの はな"], ["bouquets",0,5,3,2,"はなたば コーナー"], ["potting",7,5,3,2,"おはなの さぎょうだい"], ["pots",0,9,2,1,"ちいさな うえきばち"], ["flowers",8,9,2,1,"まどべの はな"] ] },
  link: { wall: "#DEDDF1", floor: "#C7C9E2", accent: "#9284BB", motif: "stars", caption: "みんなで つなごう パズルひろば", fixtures: [
    ["arcade",0,0,3,2,"パズルの ゲームだい"], ["prizes",8,0,2,2,"ぬいぐるみの たな"], ["puzzle",0,5,3,2,"おためし パズル"], ["arcade",7,5,3,2,"なかよし ゲームだい"], ["waiting",0,9,3,1,"ひとやすみ ベンチ"], ["prizes",8,9,2,1,"きらきら トロフィー"] ] },
  relay: { wall: "#DDE9F0", floor: "#D9C7A6", accent: "#779DB8", motif: "route", caption: "そらへ とどける おくりもの", fixtures: [
    ["parcels",0,0,3,2,"にもつの たな"], ["lockers",8,0,2,3,"はいたつ ロッカー"], ["conveyor",0,5,3,2,"にもつの ベルト"], ["sorting",7,5,3,2,"しわけ コーナー"], ["cart",0,9,2,1,"はこぶ カート"], ["plane",7,9,3,1,"ひこうきの もけい"] ] },
};

const StoreArt = {
  // 絵は有限個の種類だけをキャッシュする。位置・アニメの時刻はキーに含めない。
  svg(body, w=220, h=190) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke="${INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`; },
  rect(x,y,w,h,col,r=4) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${col}"/>`; },
  path(d,col="none") { return `<path d="${d}" fill="${col}"/>`; },
  dot(x,y,r,col) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`; },
  flower(x,y,col) { return this.path(`M${x},${y+35} V${y}`)+this.path(`M${x},${y+23} q-24,-22 -24,-6 q12,15 24,6 m0,-7 q24,-22 24,-6 q-12,15 -24,6`,"#93B882")+[[-9,0],[0,-9],[9,0],[0,9]].map(([dx,dy])=>this.dot(x+dx,y+dy,9,col)).join("")+this.dot(x,y,5,"#F5D48A"); },
  shirt(x,y,col) { return `<g transform="translate(${x} ${y})">${this.path("M0,6 L15,0 Q25,14 35,0 L50,6 L61,29 L46,36 L42,26 L42,76 L8,76 L8,26 L4,36 L-11,29 Z",col)}${this.path("M17,4 Q25,25 33,4")}</g>`; },
  prop(kind) {
    const r=this.rect.bind(this),p=this.path.bind(this),c=this.dot.bind(this),fl=this.flower.bind(this);
    const base=(col="#BA9973")=>r(12,96,196,74,col)+p("M12,96 L32,76 H190 L208,96 Z","#E9CFAD")+p("M29,170 V182 M192,170 V182 M20,112 H200");
    const shelf=(col="#DFC49A")=>r(12,15,196,161,col)+p("M20,66 H200 M20,118 H200 M20,169 H200 M20,20 V169 M200,20 V169");
    const bread=(x,y)=>`<g transform="translate(${x} ${y})">${p("M-21,11 Q-29,-16 0,-22 Q29,-16 21,11 Z","#ECC184")}${p("M-10,-12 L-5,4 M3,-14 L8,2")}</g>`;
    const bottle=(x,y,col)=>r(x+6,y,14,8,"#EFE7D0",2)+r(x,y+8,26,33,col,6)+r(x+3,y+20,20,12,"#FFF4DE",1);
    let a="";
    switch(kind) {
      case "counter": a=base("#CBAE88")+r(18,85,184,16,"#E9DBC6")+r(136,46,52,37,"#B8C9C1")+r(143,52,38,20,"#45645C")+p("M152,83 V94 M126,95 H194")+r(33,68,52,13,"#FFF5DF")+p("M38,68 V54 H78 V68","#D6AB85"); break;
      case "rack": a=p("M24,177 V38 H196 V177 M10,177 H38 M182,177 H210"); for(let i=0;i<3;i++)a+=p(`M${40+i*62},48 l18,-10 18,10`)+this.shirt(33+i*62,55,["#DDA7B8","#AECBD1","#E8C88D"][i]); break;
      case "fitting": a=r(20,10,180,173,"#E8D1BB")+r(33,23,154,157,"#BE859D")+p("M50,27 Q70,105 46,174 M88,27 Q104,110 87,174 M126,27 Q141,110 127,174 M165,27 Q179,110 165,174")+r(13,6,194,15,"#E8CFAB"); break;
      case "mirror": a=r(43,8,134,168,"#D4AF78",24)+r(53,18,114,142,"#D9EBEB",20)+p("M64,107 L144,30 M76,140 L157,59","none")+p("M60,174 L52,187 M160,174 L168,187"); break;
      case "folded": a=base();for(let i=0;i<3;i++)for(let j=0;j<3;j++)a+=r(29+i*58,81-j*14,47,14,["#BCBCD9","#ABD0C9","#E3B5B8"][i])+p(`M${35+i*58},${87-j*14} h32`);break;
      case "mannequin": a=p("M110,103 V178 M72,182 H148")+c(110,28,16,"#EEDBB9")+this.shirt(85,51,"#DFA9BD")+p("M93,122 L73,161 H147 L127,122","#DFA9BD");break;
      case "accessories": a=base()+p("M35,80 Q35,15 90,45 V76 Z","#D6BD91")+r(25,77,82,12,"#E7D0A4")+p("M124,67 Q116,35 148,61 Q181,35 175,67 Q172,95 148,72 Q121,95 124,67","#D399AC")+c(148,67,8,"#EDCF89");break;
      case "bookcase": case "books": a=shelf();for(let y=0;y<3;y++)for(let i=0;i<7;i++)a+=r(26+i*24,30+y*50,18,32,["#AFBB93","#C6927C","#96B7BA","#E5C88B"][i%4],1)+p(`M${30+i*24},${36+y*50} v20`);break;
      case "swatches": a=shelf("#E1D7BF");for(let i=0;i<9;i++)a+=r(27+i%3*57,27+Math.floor(i/3)*50,45,38,["#DDAABD","#B7C8AB","#A5C5D0","#ECD59D"][i%4])+p(`M${33+i%3*57},${33+Math.floor(i/3)*50} h30`);break;
      case "bed": case "sofa": case "lamp": case "table": {
        const id={bed:"bed_simple",sofa:"sofa",lamp:"lamp",table:"table_wood"}[kind];
        a=Art.furnSvg(id).replace("<svg ",'<svg x="5" y="5" width="210" height="175" ');break;
      }
      case "fridge": a=r(12,8,196,172,"#D4E4DD")+r(23,20,174,148,"#BDD9DC")+p("M110,20 V168 M24,69 H195 M24,120 H195 M94,77 V103 M125,77 V103");for(let y=0;y<3;y++)for(let x=0;x<4;x++)a+=bottle(31+x*43,25+y*49,["#E9C97D","#D8B0C0","#A7C59F"][x%3]);a+=p("M35,59 L67,28 M132,111 L174,75");break;
      case "shelf": case "groceries": case "jars": a=shelf();for(let y=0;y<3;y++)for(let i=0;i<5;i++)a+=bottle(27+i*35,23+y*50,["#DBC17E","#D5A5B0","#AFCC98","#A5C8D3"][i%4]);break;
      case "produce": a=base("#92AB80");for(let i=0;i<15;i++)a+=c(36+i%5*36,49+Math.floor(i/5)*21,13,["#DB9982","#C8D183","#ECC874"][Math.floor(i/5)]);a+=p("M25,102 H195 M77,77 V98 M147,77 V98");break;
      case "baskets": for(let i=0;i<4;i++)a+=r(35+i*3,90-i*17,143,67,"#D0B991")+p(`M50,${98-i*17} v45 m25,-45 v45 m25,-45 v45 m25,-45 v45 m25,-45 v45 m-104,-20 h115`);break;
      case "griddle": a=base("#AABBB8")+r(26,70,168,22,"#777E7D")+`<ellipse cx="110" cy="71" rx="58" ry="24" fill="#EED395"/>`+p("M62,69 Q112,40 157,70 M161,39 L183,18");break;
      case "dessert": a=base("#D5ABA8")+r(20,30,180,75,"#DDE9E5");for(let i=0;i<3;i++)a+=p(`M${36+i*58},88 l22,-44 22,44 Z`,"#EDC685")+c(58+i*58,50,15,"#FFF3D9")+c(58+i*58,37,7,"#D78784");a+=p("M25,105 H195 M33,47 L53,34");break;
      case "cafe": a=p("M57,103 L44,180 M163,103 L176,180 M74,102 L77,153 M146,102 L143,153")+`<ellipse cx="110" cy="98" rx="91" ry="33" fill="#DEC19B"/>`+r(72,60,30,30,"#FFF2D9",8)+p("M102,64 Q125,62 120,77 Q117,84 103,80")+r(130,67,25,12,"#C7D4B5")+p("M43,143 H76 M145,143 H178");break;
      case "menu": a=p("M41,184 L58,16 H168 L183,184")+r(48,18,124,138,"#CBB187")+r(57,28,106,116,"#577169")+p("M78,63 H146 M78,86 H141 M78,111 H147")+c(80,45,6,"#EBC88D");break;
      case "sink": a=base("#C8D8D8")+`<ellipse cx="88" cy="87" rx="53" ry="17" fill="#F7FAF0"/>`+p("M94,73 V45 Q115,32 118,58 M110,57 H128")+bottle(155,38,"#ACD5C9");break;
      case "cabinet": case "lockers": a=r(14,12,192,166,kind==="cabinet"?"#DAEBE8":"#99B8C9")+p("M78,13 V176 M142,13 V176 M15,96 H204");for(let i=0;i<6;i++)a+=r(30+i%3*64,26+Math.floor(i/3)*84,28,9,"#F5EADA",1)+p(`M${58+i%3*64},${60+Math.floor(i/3)*84} v16`);break;
      case "dental": a=p("M89,125 V173 H149 V157")+r(70,36,102,79,"#9DC8CD",24)+r(73,12,96,29,"#DAE7DB",10)+p("M71,95 L25,142 Q25,158 46,160 H153 Q173,145 168,118 Z","#8ABABD")+p("M181,158 V39 L144,14 L105,21")+r(84,13,40,18,"#FFF1C1",8)+p("M28,114 L25,142 M169,103 V137");break;
      case "waiting": a=p("M26,151 V180 M191,151 V180")+r(14,60,192,83,"#A6BEC1",12)+r(9,122,202,38,"#C0D4CD",10)+p("M75,66 V119 M141,66 V119");break;
      case "tooth": a=r(31,142,158,31,"#B7D7D3")+p("M110,48 C64,18 44,57 62,98 C78,151 83,137 93,109 Q110,78 126,112 C138,154 151,124 165,93 C190,48 160,15 110,48 Z","#FFFBEB")+p("M154,145 L189,44 M180,42 L202,49");break;
      case "oven": a=r(12,14,196,163,"#D6A88F",18)+p("M23,44 H193 M23,80 H193 M23,118 H193 M23,156 H193 M50,16 V43 M130,16 V43 M87,44 V79 M170,44 V79 M50,119 V154 M170,119 V154")+p("M46,152 V91 Q110,22 174,91 V152 Z","#624E43")+p("M63,144 Q80,122 89,133 Q96,94 111,126 Q137,110 150,144 Z","#EDB46C")+p("M34,163 H186");break;
      case "pastrycase": a=base("#B99FA9")+r(14,17,192,93,"#D3E2E3",9)+p("M18,105 H201 M20,60 H202 M22,22 L46,19");for(let i=0;i<4;i++){const x=54+i%2*105,y=43+Math.floor(i/2)*43;a+=r(x-26,y,51,18,["#E5BAC8","#E6CF99"][i%2],5)+p(`M${x-26},${y+7} h51`,"none")+[x-16,x,x+16].map(cx=>c(cx,y-3,5,"#DB9C9B")).join("");}break;
      case "decorating": a=base("#C2A7A8")+r(23,39,173,48,"#F0DECE")+r(59,33,75,43,"#EDD5A6",9)+p("M59,43 Q71,53 83,43 Q94,53 105,43 Q118,53 134,43","#F8CFD8")+c(78,32,6,"#D9A1AA")+c(111,32,6,"#D9A1AA")+p("M157,32 L178,42 L165,73 L153,65 Z","#F7EBD6")+r(23,88,172,11,"#D6B9A1");break;
      case "flour": a=p("M31,162 L25,77 Q64,51 96,78 L100,167 Z","#F0DEBB")+p("M110,168 L112,43 Q152,22 192,46 L190,166 Z","#E5D1A4")+p("M42,82 H86 M123,49 H180 M146,79 V137 M146,97 L131,86 M146,115 L164,100");break;
      case "bread": a=base("#C49969");for(let i=0;i<6;i++)a+=bread(49+i%3*61,48+Math.floor(i/3)*41);a+=p("M17,111 H201 M76,93 V108 M145,93 V108");break;
      case "dough": a=base()+`<ellipse cx="96" cy="76" rx="45" ry="21" fill="#F7E7B5"/>`+r(64,43,90,13,"#B98457",7)+p("M44,50 H64 M154,50 H176")+bottle(163,44,"#F4E4C3");break;
      case "flowers": a="";for(let i=0;i<3;i++){a+=p(`M${22+i*61},139 h50 l-7,42 h-36 Z`,["#C79E88","#A5BBA3","#D9B492"][i]);for(let j=0;j<2;j++)a+=fl(37+i*61+j*18,88-j*20,["#D5A0B6","#E8C782","#B8B5D5"][i]);}break;
      case "bouquets": for(let i=0;i<2;i++){const x=62+i*97;for(let j=0;j<3;j++)a+=fl(x+(j-1)*21,58+(j%2)*16,["#DFAABE","#F1D39D"][i]);a+=p(`M${x-40},91 L${x},173 L${x+40},91 L${x},104 Z`,"#E7CDA5")+p(`M${x-17},132 Q${x-42},111 ${x-28},142 L${x+24},144 Q${x+40},118 ${x+15},132`,"#B3C7BD");}break;
      case "pots": for(let i=0;i<3;i++){const x=44+i*65;a+=p(`M${x},141 Q${x-43},69 ${x-21},84 Q${x-7},55 ${x},102 Q${x+35},45 ${x+24},101 Z`,"#9ABA90")+p(`M${x-24},136 h48 l-7,43 h-34 Z`,"#D3A98E")+r(x-27,131,54,12,"#E4BE9F");}break;
      case "trellis": a=r(18,12,184,157,"#DCE1C0");for(let i=0;i<5;i++)a+=p(`M${28+i*39},17 V164 M21,${24+i*33} H197`);a+=p("M42,169 Q180,152 70,107 Q15,51 172,29","none");for(let i=0;i<5;i++)a+=fl(51+i*30,45+i%2*40,["#DDAEB9","#EEE0AC"][i%2]);break;
      case "potting": a=base("#B2AE8D")+r(24,49,60,41,"#DAC6A8")+p("M132,43 L150,94 M128,83 L155,60")+c(127,85,9,"#D5A9B0")+c(154,86,9,"#D5A9B0")+fl(102,40,"#E3BF92");break;
      case "arcade": a=p("M26,177 V107 L39,79 V15 H181 V79 L194,107 V177 Z","#A6A0C9")+r(51,29,118,67,"#516479",8)+p("M26,112 H194 M57,153 H90")+c(159,116,9,"#E6ADAD")+p("M63,116 V103")+c(63,99,9,"#EBD89C");for(let i=0;i<6;i++)a+=c(76+i%3*35,49+Math.floor(i/3)*27,10,["#E3A9B8","#C9D89E","#EED48C"][i%3]);break;
      case "prizes": a=shelf("#C8B9D9");for(let i=0;i<6;i++)a+=c(51+i%3*59,46+Math.floor(i/3)*68,18,["#E5C394","#D6B1BC","#ABBFCF"][i%3])+c(40+i%3*59,30+Math.floor(i/3)*68,8,"#E5C394")+c(62+i%3*59,30+Math.floor(i/3)*68,8,"#E5C394")+c(46+i%3*59,47+Math.floor(i/3)*68,2,INK)+c(57+i%3*59,47+Math.floor(i/3)*68,2,INK);break;
      case "puzzle": a=base("#B5A8CF");for(let i=0;i<9;i++)a+=c(60+i%3*48,39+Math.floor(i/3)*25,13,["#E5B1C0","#B7CCA3","#EACD8A"][i%3]);break;
      case "parcels": a=shelf("#AFBAB7");for(let i=0;i<6;i++)a+=r(28+i%3*58,26+Math.floor(i/3)*74,48,47,"#D6BA8D")+p(`M${52+i%3*58},${26+Math.floor(i/3)*74} v47`)+r(32+i%3*58,44+Math.floor(i/3)*74,14,11,"#F6ECD4",1);break;
      case "conveyor": a=base("#B1BEBE")+r(16,61,188,43,"#747F83",16);for(let i=0;i<9;i++)a+=p(`M${27+i*20},70 V95`);a+=r(76,28,60,54,"#DCBD8C")+p("M106,28 V82 M81,57 H130");break;
      case "sorting": a=base("#9CB3B9");for(let i=0;i<3;i++)a+=r(27+i*61,50,51,45,["#D5B0B8","#B6CD9D","#C3D6E3"][i])+r(37+i*61,63,31,15,"#FFF0D3",2);break;
      case "cart": a=c(59,166,15,"#6D777C")+c(171,166,15,"#6D777C")+p("M24,48 H47 V144 H190", "none")+r(59,91,116,51,"#D9B990")+r(93,49,68,42,"#E7D0AC")+p("M125,49 V91 M116,92 V139");break;
      case "plane": a=p("M102,114 V171 M63,178 H160")+p("M18,84 L88,72 L102,20 Q111,5 119,23 L129,71 L202,84 L202,99 L131,95 L123,133 L151,148 V158 L110,148 L69,158 V148 L97,132 L90,95 L18,99 Z","#E8E5D8")+p("M106,38 H117 M107,52 H119");break;
    }
    return this.svg(a);
  },
  room(id) {
    const s=STORE_INTERIORS[id],r=this.rect.bind(this),p=this.path.bind(this);
    let a=r(6,8,340,496,"#BBAB92",12)+r(16,16,320,100,s.wall)+r(16,112,320,384,s.floor,0);
    for(let y=0;y<12;y++)for(let x=0;x<10;x++){
      const px=16+x*32,py=112+y*32;
      if(s.motif==="wood"||s.motif==="stripe")a+=`<path d="M${px},${py} h32 m-32,0 v32 m5,-22 h17" stroke="#A38261" stroke-width=".8" opacity=".35"/>`;
      else a+=`<rect x="${px+1}" y="${py+1}" width="30" height="30" rx="${s.motif==="stone"?5:1}" fill="${(x+y)%2?s.floor:"#FFF8E8"}" stroke="#A89F8A" stroke-width=".6" opacity=".45"/>`;
    }
    // 壁の腰板・タイル・格子も業種に合わせる。
    for(let x=18;x<330;x+=20)a+=`<path d="M${x},86 v20" stroke="${s.accent}" stroke-width="1" opacity=".45"/>`;
    if(["crepe","dentist","market"].includes(id))a+=`<path d="M16,89 H336 M16,98 H336" stroke="${s.accent}" stroke-width="1" opacity=".4"/>`;
    if(s.motif==="stars")for(const [x,y] of [[158,277],[213,329],[156,405]])a+=`<path d="M${x},${y-10} l3,7 8,1 -6,5 2,8 -7,-4 -7,4 2,-8 -6,-5 8,-1 Z" fill="#EEE3AE" stroke="none"/>`;
    if(s.motif==="route")a+=`<path d="M193,449 V407 Q193,386 167,386 H137 M193,387 H224 M193,363 V244" fill="none" stroke="#F7EAD2" stroke-width="6" stroke-dasharray="9 8"/>`;
    a+=r(10,106,332,9,s.accent,0)+r(29,28,62,62,"#E1EEEB",7)+p("M60,29 V88 M29,58 H89")+p("M33,75 L58,36 M65,80 L83,61")+r(262,28,61,61,"#F8EED2",5)+`<g transform="translate(292 58)">${SIGN_ICON[id]?SIGN_ICON[id](0,0):""}</g>`;
    if(id==="florist")a+=`<path d="M22,22 Q76,5 99,26 T251,26 Q293,7 328,24" fill="none" stroke="#789473" stroke-width="3"/>`+[33,87,253,314].map((x,i)=>this.flower(x,26+i%2*5,"#EDCBCA").replace('stroke-width="4.5"','stroke-width="2"')).join("");
    // 展示の値札・道具・小さな飾りを壁際にまとめ、中央の通路を確保。
    for(const f of s.fixtures){const [kind,x,y,w,d]=f;if(y<4)continue;const px=16+x*32+w*16,py=112+(y+d)*32+6;
      a+=`<rect x="${px-16}" y="${py}" width="32" height="10" rx="2" fill="#FFF5DA" stroke="#A58E70" stroke-width=".7"/><path d="M${px-10},${py+4} h19 m-19,3 h11" stroke="#A58E70" stroke-width=".7"/>`;
    }
    a+=`<path d="M103,17 H249 V78 H103 Z" fill="${s.accent}" stroke="none" opacity=".22"/><text x="176" y="49" text-anchor="middle" font-size="15" font-family="sans-serif" font-weight="bold" stroke="none" fill="${INK}">${(BUY_SHOPS[id]||SHOPS[id]).name}</text><text x="176" y="68" text-anchor="middle" font-size="8" font-family="sans-serif" stroke="none" fill="${INK}">${s.caption}</text>`;
    for(const x of [46,304])a+=p(`M${x},12 V20`)+p(`M${x-13},35 Q${x-13},17 ${x},19 Q${x+13},17 ${x+13},35 Z`,"#F8E9BF");
    // 低い展示ラグと入口のマット。どちらも歩ける。
    a+=`<rect x="25" y="256" width="95" height="107" rx="12" fill="${s.accent}" opacity=".19" stroke="none"/><rect x="236" y="256" width="92" height="107" rx="12" fill="${s.accent}" opacity=".19" stroke="none"/>`;
    a+=r(143,460,100,36,s.accent,5)+`<text x="193" y="483" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#FFFAE9" stroke="none">でぐち ▼</text>`+p("M149,504 H239","none");
    return this.svg(a,352,512);
  },
};
