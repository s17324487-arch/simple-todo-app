import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
export function gameContext(){
  const root=fileURLToPath(new URL('..',import.meta.url)),noop=()=>{},store=new Map();
  const el=()=>({style:{setProperty:noop},append:noop,appendChild:noop,remove:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},getContext:()=>null,setAttribute:noop,dataset:{}});
  const c={console:{log:noop,warn:noop,error:noop,info:noop},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL,TextEncoder,requestAnimationFrame:noop,navigator:{},location:{protocol:'http:',origin:'http://localhost',search:''},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},document:{addEventListener:noop,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:el,body:el(),documentElement:el(),fonts:null},Image:class{set src(v){}},addEventListener:noop};
  c.window=c;vm.createContext(c);
  for(const m of readFileSync(join(root,'index.html'),'utf8').matchAll(/<script src="(js\/[^"]+)"><\/script>/g))vm.runInContext(readFileSync(join(root,m[1]),'utf8'),c,{filename:m[1]});
  return vm.runInContext('({NpcLife,WorldScene,Walker,Game,G,NpcArt,TownDialogue,TOWN_DIALOGUE_DATA,TownQuiz,TOWN_QUIZ_DATA,QuizPrizes,TownFolk,TALKS,U,UI,Chara,BAG_INDEX,ITEM_INDEX,localStorage,VenueHalls,VenueHallArt,NerikasuNeighborhood,MacKitchenRound,MacKitchen,SaveBackup,HeiwadaiLife,HeiwadaiArt,HEIWADAI_LAYOUT_DATA,MAP_DEFS,WorldMap,TownRenewal,TownRenewalArt,Save,Transit,WorldArt,Art,BattleElements,SKILLS,ENEMIES,Stats,Sound,SONGS,ModernMusic,NakayoshiPuzzle,PuzzleArcade,PUZZLE_PRIZES,FURN_INDEX,BUY_SHOPS,HomeDesign,MG_TASKS,SHOPS,SCENES,CranePhys,CraneMachines,CraneArt,CraneScene,CraneCam,PrizeArcade,MamaSchedule,FOODS,IkebukuroCatalog,IkebukuroDistrict,IkebukuroVenues,NerikasuTown,ItemDex,ItemDexSources,FURNITURE,WEAR_ITEMS,IsoVenue,IsoVenueScene,MallArt,IkeMall,MallGuide})',c);
}
