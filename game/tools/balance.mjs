// 実装の報酬式と販売価格から、1回の収入・家具を買う回数を確認する。
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const CHECK=process.argv.includes('--check');
const read=name=>readFileSync(new URL('../js/'+name,import.meta.url),'utf8');
const d=vm.runInNewContext(read('data.js')+'\n'+read('economy.js')+'\n'+read('slow-life-prices.js')+';({economy:GameEconomy,prices:SlowLifePrices,furn:FURNITURE,wear:WEAR_ITEMS,food:FOODS,walls:WALLPAPERS,floors:FLOORS})');
const food=d.food.find(x=>x.id==='onigiri'), upkeep=Math.ceil(18/food.hunger*food.price);
const rows=[];
for(const shop of Object.keys(d.economy.shopBase).filter(shop=>shop!=='range'))for(const lv of [1,5,30,50])for(const mode of ['easy','normal','hard']){
  const rounds=shop==='relay'?3:3+Math.min(4,lv);
  const pay=d.economy.pay(shop,lv,2,mode), gross=rounds*(pay+Math.round(pay*.1));
  const base=d.economy.unit(shop,lv,mode); // Lv.6 から 1レベル +2%（UI-108）
  const perfect=d.economy.pay(shop,lv,3,mode),fastTip=Math.round(base*.5);
  const ceiling=rounds*(perfect+fastTip+Math.round((perfect+fastTip)*.4));
  rows.push({shop,lv,mode,rounds,normalScoreIncome:gross,foodAllowance:upkeep,net:gross-upkeep,perfectWithPerks:ceiling});
  assert(gross>upkeep,'通常成功でも基本の食費を払えない: '+shop+'/'+mode);
}
if(!CHECK)console.table(rows);
const normal=rows.find(r=>r.shop==='bakery'&&r.lv===1&&r.mode==='normal'),expert=rows.find(r=>r.shop==='bakery'&&r.lv===5&&r.mode==='normal');
// おみせ Lv の ボーナス（UI-108）: Lv.30 は Lv.5 の 1.5ばい・Lv.50 は 1.9ばい くらい（1にんずつの まるめで 4% まで ずれる）。それより おおきく ならない
for(const shop of Object.keys(d.economy.shopBase).filter(shop=>shop!=='range'))for(const mode of ['easy','normal','hard']){
  const at=lv=>rows.find(r=>r.shop===shop&&r.lv===lv&&r.mode===mode).normalScoreIncome;
  const near=(a,b)=>Math.abs(a/b-1)<=0.04;
  assert(near(at(30),at(5)*1.5)&&near(at(50),at(5)*1.9)&&at(50)>=at(30)&&at(30)>=at(5),'おみせ Lv の ボーナスが おおきすぎる／へる: '+shop+'/'+mode+' '+[at(5),at(30),at(50)]);
}
const master=rows.find(r=>r.shop==='bakery'&&r.lv===50&&r.mode==='normal');
if(!CHECK)console.table(['chair_wood','table_wood','sofa','piano','bed_royal'].map(id=>{const f=d.furn.find(f=>f.id===id);return {id,price:f.price,shiftsAtLv1:Math.ceil(f.price/normal.net),shiftsAtLv5:Math.ceil(f.price/expert.net),shiftsAtLv50:Math.ceil(f.price/master.net)};}));
assert.equal(d.furn.find(f=>f.id==='chair_wood').price,320);
assert.equal(d.furn.find(f=>f.id==='bed_royal').price,5600);
assert.equal(d.wear.find(w=>w.id==='crown').price,0);
assert.equal(d.walls.find(w=>w.id==='wp_cream').price,0);
for(const list of [d.furn,d.wear,d.walls,d.floors])for(const it of list)assert(Number.isInteger(it.price)&&it.price>=0,'不正な価格: '+it.id);
if(!CHECK)console.log('Battle (original 100 coins):',Object.fromEntries(['easy','normal','hard'].map(mode=>[mode,[d.economy.battle(100,mode,1),d.economy.battle(100,mode,3)]])));
if(!CHECK)console.log('Examples use rank ○, mood bonus only, 18 hunger of food allowance for all three. Daily bonus, battle loot, fishing and free parent affection are not included. Maximum column uses quick ◎ plus all 40% perks; daily recommendation can add 20%.');
const rules=vm.runInNewContext(read('puzzle-engine.js')+';PUZZLE_RULES');if(!CHECK)console.log('Puzzle: '+rules.fee+' coins entry, no coin wages, exclusive score prizes. Free practice remains available.');

if(CHECK)console.log(`Economy: ${rows.length} shift budgets (Lv1/5/30/50) cover food; shop level bonus, furniture prices, starter goods and rare items checked.`);
