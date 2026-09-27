// 季節の記念品は取得後も消えず、通常の服・家具・デザとして使える。
const SEASON_ITEMS = {
  spring:{wear:"sakura_wreath",furn:"sakura_lamp",food:"deza_sakura"},
  summer:{wear:"star_happi",furn:"star_lantern",food:"deza_shavedice"},
  autumn:{wear:"maple_scarf",furn:"acorn_cart",food:"deza_chestnut"},
  winter:{wear:"snow_knit",furn:"snow_globe",food:"deza_snow"},
};
(() => {
  WEAR.sakura_wreath=ctx=>({top:hatWrap(ctx,s=>`<path d="M-39,-3 Q0,-22 39,-3" fill="none" stroke="#88AE7B" stroke-width="8"/>${[-32,-16,0,16,32].map((x,i)=>flowerSvg(x,-9-Math.sin(i/4*Math.PI)*8,7,ctx.col[0],ctx.col[1],.4*s)).join("")}`)});
  for(const [id,name,slot,wear,col] of [
    ["sakura_wreath","さくらの はなかんむり","head","sakura_wreath",["#F2B9CD","#F3D995"]],
    ["star_happi","ほしまつりの はっぴ","body","happi",["#5D719E","#F6D68E"]],
    ["maple_scarf","もみじの スカーフ","neck","scarf",["#CD815F"]],
    ["snow_knit","ゆきあかり ニット","head","knit",["#A4CDDF","#FFFAEE"]],
  ]) {const it={id,name,slot,wear,col,price:0,rare:true};WEAR_ITEMS.push(it);ITEM_INDEX[id]=it;}
  const r=(x,y,w,h,c,rad=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${c}" ${FS(2.5)}/>`;
  const p=(d,c)=>`<path d="${d}" fill="${c}" ${FS(2.5)}/>`;
  const c=(x,y,rad,col)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" ${FS(2.5)}/>`;
  const art={
    sakura_lamp:[66,96,"さくらの あかり",()=>r(28,34,10,51,"#BBA487")+r(13,83,40,9,"#D9BE99")+p("M9,18 L57,18 L53,54 L13,54 Z","#F5C8D8")+p("M4,18 Q33,-4 62,18 Z","#D995AE")+flowerSvg(33,35,10,"#FFF3DE","#E6BB6D",2)],
    star_lantern:[66,96,"ほしの ちょうちん",()=>r(6,5,7,85,"#BA9F87")+r(9,7,49,7,"#D4B28D")+p("M44,14 V24","none")+r(25,24,38,46,"#F5D998",14)+p("M28,38 H60 M28,55 H60","none")+p(starPath(44,47,11,5),"#FFF6CF")+r(2,88,60,7,"#BA9F87")],
    acorn_cart:[88,82,"どんぐり デザワゴン",()=>c(17,72,8,"#AF9783")+c(73,72,8,"#AF9783")+r(5,30,78,34,"#D4AC7F")+r(10,8,4,24,"#A78C70")+r(74,8,4,24,"#A78C70")+p("M1,10 L10,0 H78 L87,10 Z","#CC8F6B")+[22,44,66].map(x=>c(x,31,9,"#E9C99E")+p(`M${x-10},29 Q${x},15 ${x+10},29 Z`,"#A98565")).join("")+p("M12,48 H77","none")],
    snow_globe:[76,90,"ゆきあかり ドーム",()=>c(38,38,34,"#C9E7EE")+p("M9,50 Q38,65 67,50 L64,64 H12 Z","#FFF7E9")+c(38,47,12,"#FFFCED")+c(38,30,9,"#FFFCED")+r(30,17,16,7,"#A5AFC9")+p("M26,23 H50","none")+c(35,29,1,"#554D43")+c(42,29,1,"#554D43")+p("M37,32 L43,34 L37,35 Z","#D7A270")+r(8,67,60,17,"#B4B2D1")+[18,28,52,61].map((x,i)=>c(x,18+i*8,2,"#FFF9E9")).join("")],
  };
  for(const [id,[w,h,name,draw]] of Object.entries(art)) {
    const it={id,name,w,h,price:0,kind:"floor",comfort:6,rare:true,interactive:true};FURNITURE.push(it);FURN_INDEX[id]=it;FURN_ART[id]=draw;
  }
  const sweets={
    deza_sakura:`<ellipse cx="32" cy="37" rx="24" ry="20" fill="#EFB7CA" ${IS()}/><path d="M5,38 Q29,19 60,42 Q42,61 5,38 Z" fill="#A9BF8A" ${IS()}/><path d="M13,39 L51,43" fill="none" ${IS(1.4)}/>${flowerSvg(33,21,6,"#FFF1D7","#DBB975",1.3)}`,
    deza_shavedice:`<path d="M8,38 L32,6 L56,38 Z" fill="#F6F6EB" ${IS()}/><path d="M20,23 L32,6 L44,23 Q38,34 31,22 Q24,32 20,23" fill="#D7B1D7" ${IS(1.5)}/><path d="M6,38 H58 Q52,59 32,59 Q12,59 6,38 Z" fill="#AFD7E5" ${IS()}/><path d="M41,23 L53,7" stroke="#B8997F" stroke-width="3"/>`,
    deza_chestnut:`<path d="M8,42 L13,55 H51 L56,42 Z" fill="#D6B296" ${IS()}/><path d="M10,41 L18,34 L14,31 L25,24 L22,21 L33,11 L43,21 L40,24 L50,31 L46,34 L55,41 Z" fill="#D9BC91" ${IS()}/><path d="M20,28 H43 M14,39 H51" fill="none" ${IS(1.4)}/><ellipse cx="34" cy="15" rx="9" ry="7" fill="#A77D59" ${IS(1.6)}/>`,
    deza_snow:`<path d="${starPath(32,32,26,16,6)}" fill="#EBD5AD" ${IS()}/><path d="M32,13 V51 M16,23 L48,41 M16,41 L48,23 M27,16 L32,22 L37,16 M27,48 L32,42 L37,48" fill="none" stroke="#FFFAEF" stroke-width="4" stroke-linecap="round"/>`,
  };
  for(const [id,name] of [["deza_sakura","デザ・さくらもち"],["deza_shavedice","デザ・かきごおり"],["deza_chestnut","デザ・くりケーキ"],["deza_snow","デザ・ゆきクッキー"]]) {
    const f={id,name,price:0,rare:true,deza:true,hunger:14,mood:20,hp:20,desc:"きせつの おまつりの きねんデザ"};FOODS.push(f);BAG_INDEX[id]={...f,kind:"food"};
    FOOD_ART[id]=sweets[id];
  }
})();
