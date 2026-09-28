// 原画を独立SVG、見本HTML、シート、スマホ見本へ。ゲーム本体やセーブへ接続しない。
// node tools/town-design/nerikasu-build.mjs [--no-shots]
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {NERIKASU_ASSETS,nerikasuSvg} from './nerikasu-assets.mjs';
import {R,Rn,C,E,Pth,L,T,defs} from './lib.mjs';
import {REG} from './assets_more.mjs';
const out=fileURLToPath(new URL('../../docs/design/towns/nerikasu-station/',import.meta.url));
const game=fileURLToPath(new URL('../../',import.meta.url));
for(const dir of [out,join(out,'svg'),join(out,'img')])mkdirSync(dir,{recursive:true});
const registry=Object.fromEntries(NERIKASU_ASSETS.map(a=>[a.id.split('.').at(-1),a]));
for(const [alias,id]of Object.entries({totem:'station-totem',bench:'timber-bench',lamp:'lantern-twin',noticeboard:'community-board',mapboard:'walk-map',crossing:'school-crossing',mirror:'corner-mirror',bikerack:'bicycle-rack',planter:'season-planter',fountain:'drinking-fountain',vending:'green-vending',bins:'recycling-bins',hedge:'hedge-fence'}))registry[alias]=registry[id];
const at=(id,x,y,o={})=>{const a=registry[id];if(!a)throw Error('unknown scene asset: '+id);return `<g data-asset="${a.id}" transform="translate(${x},${y})">${a.draw(o)}</g>`;};
const vc=vm.createContext({console});
for(const f of ['util.js','data.js','chara-data.js','chara.js'])vm.runInContext(readFileSync(join(game,'js',f),'utf8'),vc,{filename:f});
const chara=vm.runInContext('Chara',vc);
const child=(id,x,y)=>`<g transform="translate(${x},${y})">`+chara.svg(id,{dir:'down'}).replace('<svg ', '<svg x="-22" y="-47" width="44" height="52" ')+'</g>';
const scene=(night=false)=>{
  let s=defs()+Rn(0,0,960,720,'url(#p-grass)');
  // 本体と同じ素材を配置。中央は歩行広場、車道は外周のみ。
  s+=R(28,66,902,104,'#BEBAA6',{sw:1,rx:12});
  for(let x=0;x<960;x+=128)s+=at('track',x,102)+at('track',x,141);
  s+=at('train',258,78,{night})+at('canopy',235,177)+at('canopy',491,177);
  s+=R(26,198,909,347,'url(#p-paver)',{sw:1,stroke:'#ABA68E',rx:25});
  s+=Pth('M22,525 Q135,518 164,553 L960,553 V588 H131 Q105,564 22,569Z','url(#p-concrete)',{sw:0});
  s+=Rn(0,574,960,99,'url(#p-asphalt)')+Rn(0,673,960,47,'url(#p-paver)');
  for(const y of [581,664])s+=L(0,y,960,y,'#EDE9DA',2.2);
  // 横断歩道は駅入口からの導線の延長。停止線も対で描く。
  for(let y=583;y<662;y+=13)s+=Rn(453,y,66,7,'#F7F2DA');
  s+=L(532,621,532,656,'#F7F2DA',4)+L(438,586,438,619,'#F7F2DA',4);
  for(let x=0;x<960;x+=48)if(x<414||x>550)s+=L(x,625,x+25,625,'#E8D397',2);
  // 木陰の庭と曲線のレンガ見切り。
  s+=R(70,391,245,111,'url(#p-lawn)',{sw:5,stroke:'#B68A6A',rx:38})+R(640,393,228,112,'url(#p-lawn)',{sw:5,stroke:'#B68A6A',rx:35});
  // 点字導線（入口は224+256=480）。警告ブロックは横断歩道手前。
  for(let y=370;y<=530;y+=32)s+=at('tactile_line',464,y);
  s+=at('tactile_warning',448,543)+at('tactile_warning',480,543)+at('tactile_warning',448,678)+at('tactile_warning',480,678);
  for(let x=0;x<7;x++)s+=at('railfence',24+x*96,199);
  s+=at('kiosk',62,203,{night})+at('lift',838,180,{night})+at('bikeshed',737,306)+at('waiting',70,348,{night})+at('station',256,213,{night});
  // 各機能をまとまりとして配置し、中央2マス以上の通路を開ける。
  const props=[['tree',40,327],['tree',196,472],['tree',852,465],['tree',935,309],['busstop',698,517,{night}]];
  const optional=[['totem',373,468],['bench',90,475],['bench',720,460],['lamp',286,520,{night}],['lamp',700,466,{night}],['noticeboard',174,318],['mapboard',587,444],['crossing',550,530],['mirror',36,532],['bikerack',777,422],['planter',286,383],['planter',627,383],['fountain',870,510],['postbox',228,399],['vending',688,360,{night}],['bins',919,423],['hedge',71,515],['hedge',199,515],['hedge',831,533]];
  // Props names are mapped below after metadata is loaded, so missing artwork fails loudly.
  props.push(...optional);
  for(const [id,x,y,o]of props.sort((a,b)=>a[2]-b[2]))s+=at(id,x,y,o||{night});
  s+=child('wanko',437,448)+child('gachan',473,463)+child('goji',517,449);
  if(night){s+=Rn(0,0,960,720,'#233D47',{op:.3});for(const [x,y]of [[302,526],[716,472]])s+=E(x,y,46,22,'#FFDA86',{sw:0,op:.16});s+=E(480,386,75,26,'#FFE2A2',{sw:0,op:.15});}
  return s;
};
const svg=(w,h,body,vb=`0 0 ${w} ${h}`)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>`;
// SVG自身を保存するため、原画がラスター化だけの資料にならない。
const metadata=[];
for(const a of NERIKASU_ASSETS){
  if(!/^[a-z0-9_.-]+$/.test(a.id))throw Error('unsafe id');
  for(const state of a.states){const text=nerikasuSvg(a,{night:state==='night'});if(/NaN|undefined|<script|href=/.test(text))throw Error('invalid svg '+a.id);writeFileSync(join(out,'svg',a.id+'.'+state+'.svg'),text);}
  const {draw,...m}=a;metadata.push({...m,anchor:[a.w*16,a.h*32],source:'game/tools/town-design/'+(NERIKASU_ASSETS.indexOf(a)>=18?'nerikasu-props.mjs':'nerikasu-assets.mjs')});
}
if(new Set(metadata.map(a=>a.id)).size!==metadata.length)throw Error('duplicate id');
writeFileSync(join(out,'assets.json'),JSON.stringify({version:'0.1',tile:32,status:'asset-design-only',assets:metadata},null,2)+'\n');
const day=scene(false),night=scene(true);
writeFileSync(join(out,'svg','station-plaza.day.svg'),svg(960,720,day));
writeFileSync(join(out,'svg','station-plaza.night.svg'),svg(960,720,night));
const palette=['#31594E','#648975','#F3EAD9','#A97850','#BC795C','#E2BC65'];
let cover=Rn(0,0,1440,1280,'#F6F1E6')+T(60,57,'NERIKASU  /  STATION ASSET COLLECTION',{size:13,fill:'#648975',anchor:'start',ls:2})+T(60,116,'ネリカス駅',{size:46,fill:'#273F34',anchor:'start'})+T(60,149,'木のぬくもりと、通学路のある駅。',{size:16,fill:'#756C57',anchor:'start',weight:500})+T(1380,70,'原画集  v0.1',{size:12,fill:'#756C57',anchor:'end'})+T(1380,94,NERIKASU_ASSETS.length+' ASSETS  /  SVG',{size:12,fill:'#756C57',anchor:'end'});
for(let i=0;i<6;i++)cover+=C(1187+i*32,136,12,palette[i],{sw:0});
cover+=`<svg x="60" y="184" width="960" height="720" viewBox="0 0 960 720">${day}</svg>`;
cover+=R(1044,184,336,720,'#E8E6D6',{sw:0,rx:4})+T(1068,219,'01  駅をつくる細部',{size:17,fill:'#31594E',anchor:'start'});
for(const [id,y,label]of [['station',265,'木組みの時計切妻と2つの入口'],['train',490,'若葉ライン：2両の連結車両'],['waiting',650,'ガラス越しに見える待合室']]){const a=registry[id];const [x0,y0,x1,y1]=a.bbox;cover+=`<svg x="1061" y="${y}" width="303" height="${id==='train'?115:165}" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}">${a.draw({})}</svg>`+T(1212,y+(id==='train'?130:184),label,{size:11,fill:'#756C57',weight:500});}
cover+=T(60,946,'02  暮らしの気配を、駅前に。',{size:21,fill:'#31594E',anchor:'start'})+T(1380,944,'1マス = 32px  ·  平和台と同じ3/4見下ろし',{size:12,fill:'#756C57',anchor:'end'});
for(const [i,id]of ['totem','noticeboard','bikerack','bench','vending','crossing'].entries()){const a=registry[id],[x0,y0,x1,y1]=a.bbox,x=60+i*224;cover+=R(x,972,204,214,'#FFFBF1',{sw:.7,stroke:'#D5D3BC',rx:6})+`<svg x="${x+16}" y="993" width="172" height="140" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}">${a.draw({})}</svg>`+T(x+102,1164,a.name,{size:11,fill:'#31594E'});}
cover+=T(60,1236,'駅舎 / ホーム / 待合室 / 駐輪場 / 広場 / 通学路',{size:13,fill:'#756C57',anchor:'start'})+T(1380,1236,'配置・照明はデザイン見本。ゲームへの組み込みは次の段階。',{size:12,fill:'#756C57',anchor:'end',weight:500});
writeFileSync(join(out,'svg','collection.svg'),svg(1440,1280,cover));
// 編集可能なSVGを同じ倍率で整列。大物と小物を別シートにする。
for(const [name,items,cols,cw,ch]of [['buildings',NERIKASU_ASSETS.slice(0,8),2,650,310],['details',NERIKASU_ASSETS.slice(8),4,320,232]]){
  const h=110+Math.ceil(items.length/cols)*ch;let b=Rn(0,0,cols*cw+40,h,'#F6F1E6')+T(28,45,'ネリカス駅 ｜ '+(name==='buildings'?'駅舎と交通':'広場と生活の道具'),{size:24,fill:'#31594E',anchor:'start'})+T(28,72,'ネリカス専用原画 · 名前／ID／足もとのマス数',{size:12,fill:'#756C57',anchor:'start',weight:500});
  items.forEach((a,i)=>{const x=20+i%cols*cw,y=90+Math.floor(i/cols)*ch,[x0,y0,x1,y1]=a.bbox;b+=R(x,y,cw-15,ch-14,'#FFFCF5',{sw:.7,stroke:'#D9D7C4',rx:6});const scale=Math.min(name==='buildings'?1.12:1.65,(cw-60)/(x1-x0),(ch-84)/(y1-y0));b+=`<g transform="translate(${x+(cw-15-(x1-x0)*scale)/2-x0*scale},${y+17-y0*scale+(ch-84-(y1-y0)*scale)/2}) scale(${scale})">${a.draw({})}</g>`+T(x+(cw-15)/2,y+ch-44,a.name,{size:13,fill:'#31594E'})+T(x+(cw-15)/2,y+ch-25,a.id+'  ·  '+a.w+'×'+a.h,{size:10,fill:'#8D8068',weight:500});});
  writeFileSync(join(out,'svg','sheet-'+name+'.svg'),svg(cols*cw+40,h,b));
}
// 平和台と同じ論理倍率で見比べる駅舎の比較シート。
const reference=REG['bld.station'];
writeFileSync(join(out,'svg','reference-comparison.svg'),svg(1280,410,defs()+Rn(0,0,1280,410,'#F6F1E6')+T(30,42,'平和台の描画規則を揃え、ネリカスの形をつくる',{size:22,fill:'#31594E',anchor:'start'})+`<g transform="translate(40,155)">${reference.draw({})}</g><g transform="translate(710,155)">${registry.station.draw({})}</g>`+T(286,352,'平和台駅：既存の原画 / 16×5マス',{size:15,fill:'#756C57'})+T(942,352,'ネリカス駅：新作の原画 / 14×5マス',{size:15,fill:'#31594E'})+T(640,386,'両方とも1マス32px、同じ表示倍率。駅名だけの変更や建物の引き伸ばしは行っていません。',{size:12,fill:'#756C57',weight:500})));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const cards=NERIKASU_ASSETS.map(a=>`<article data-category="${a.category}" data-name="${a.name}" data-id="${a.id}"><a class="art" href="svg/${a.id}.day.svg" target="_blank" aria-label="${a.name}のSVGを開く">${nerikasuSvg(a)}</a><h3>${a.name}</h3><p class="meta">${a.w} × ${a.h} マス · ${a.id}</p><p>${a.details.join('／')}</p><a class="download" href="svg/${a.id}.day.svg" download>SVGを保存</a>${a.states.includes('night')?` <a class="download" href="svg/${a.id}.night.svg" download>夜のSVG</a>`:''}</article>`).join('');
const states=Object.fromEntries(NERIKASU_ASSETS.filter(a=>a.states.includes('night')).map(a=>[a.id,[nerikasuSvg(a),nerikasuSvg(a,{night:true})]]));
const html=`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ネリカス駅 アセット集 v0.1</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f1e6;color:#283f35;font:15px/1.65 'Yu Gothic','Meiryo',sans-serif}button,input,a{font:inherit}a{color:#31594e}header,main{max-width:1440px;margin:auto;padding:30px 4%}header{padding-bottom:12px}small,.meta{color:#827861;font-size:12px}h1{font-size:clamp(30px,5vw,52px);line-height:1.2;margin:12px 0}h2{font-size:24px;margin:0}p{margin:8px 0}.intro{max-width:700px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}button,.download{border:1px solid #b9bba3;border-radius:25px;padding:10px 18px;min-height:44px;background:#fffbf2;text-decoration:none;display:inline-flex;align-items:center;cursor:pointer}button[aria-pressed=true]{background:#31594e;color:#fff8df}.scene{background:#dddcca;overflow:auto;border-radius:12px}.scene svg{width:100%;height:auto;display:block}.scene.zoom svg{width:1440px;max-width:none}.scene-wrap{position:relative}.caption{margin:8px 0 26px;color:#7a715d;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(290px,100%),1fr));gap:16px}.grid article{border:1px solid #d9d4bd;border-radius:10px;background:#fffcf5;padding:16px;min-width:0}.art{height:220px;display:grid;place-items:center;border-bottom:1px solid #e9e3d1}.art svg{width:100%;height:210px}h3{font-size:16px;margin:16px 0 4px}.grid p{font-size:12px}.grid .download{font-size:12px;padding:8px 12px}article[hidden]{display:none}input{padding:10px 14px;min-height:44px;border:1px solid #b9bba3;border-radius:24px;background:#fffdf5;width:230px;max-width:100%}footer{padding:25px 4%;color:#827861;font-size:12px}.phone{display:none}body.phone-mode header,body.phone-mode main,body.phone-mode footer{display:none}body.phone-mode .phone{display:block;height:100vh;overflow:hidden;background:#eee7d6}.phone header{display:block!important;padding:12px 16px;height:82px;background:#fbf4e6;border-bottom:1px solid #bdb99e}.phone h1{font-size:19px;margin:1px 0}.phone small{font-size:10px}.phone .view{width:100%;height:calc(100vh - 126px);overflow:hidden}.phone .view svg{width:100%;height:100%;display:block}.phone aside{height:44px;text-align:center;background:#fbf4e6;padding:10px;font-size:11px}
</style><header><small>NERIKASU / STATION ASSET COLLECTION · v0.1</small><h1>ネリカス駅</h1><p class="intro">木のぬくもりと、通学路のある駅。時計の切妻屋根、若葉色の電車、子ども乗せ自転車。住宅街で暮らす人の一日が見える原画集です。</p></header><main><div class="controls"><button id="day" aria-pressed="true">昼の駅前</button><button id="night" aria-pressed="false">夜のあかり</button><button id="zoom" aria-pressed="false">細部を拡大</button><a class="download" href="svg/collection.svg" download>一覧SVGを保存</a></div><div class="scene-wrap"><div id="scene" class="scene">${svg(960,720,day)}</div></div><p class="caption">配置見本 · 3人は既存のキャラクター原画。駅前の中央通路を空け、小物は待ち合わせ・案内・駐輪のまとまりにしています。</p><h2>${NERIKASU_ASSETS.length}種類の原画</h2><div class="controls" id="filters">${['すべて','駅舎・交通','広場・通学路','道・設備'].map((c,i)=>`<button data-filter="${c}" aria-pressed="${!i}">${c}</button>`).join('')}<input id="search" aria-label="原画を検索" placeholder="原画を検索"></div><div class="grid">${cards}</div></main><footer>SVGはすべてこのゲーム用の新作。平和台の縮尺・線・光の向きを参照。v0.1は原画集で、ゲームへの登録・公開はまだ行っていません。</footer><div class="phone"><header><small>ネリカス駅 · 原画の配置見本</small><h1>おかえり、ネリカス。</h1></header><div class="view"></div><aside>1マス32px ／ ゲーム組み込み前のデザイン確認</aside></div><script>
const scenes=${JSON.stringify([svg(960,720,day),svg(960,720,night)])},states=${JSON.stringify(states)};let isNight=false;
function mode(n){isNight=n;document.getElementById('scene').innerHTML=scenes[+n];document.getElementById('day').setAttribute('aria-pressed',!n);document.getElementById('night').setAttribute('aria-pressed',n);for(const el of document.querySelectorAll('article[data-id]'))if(states[el.dataset.id])el.querySelector('.art').innerHTML=states[el.dataset.id][+n];}
document.getElementById('day').onclick=()=>mode(false);document.getElementById('night').onclick=()=>mode(true);document.getElementById('zoom').onclick=e=>{const z=document.getElementById('scene').classList.toggle('zoom');e.currentTarget.setAttribute('aria-pressed',z);};
let category='すべて';function filter(){const q=document.getElementById('search').value.trim();for(const a of document.querySelectorAll('article'))a.hidden=(category!=='すべて'&&a.dataset.category!==category)||!(a.dataset.name+a.dataset.id).includes(q);}
for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{category=b.dataset.filter;for(const other of document.querySelectorAll('[data-filter]'))other.setAttribute('aria-pressed',other===b);filter();};document.getElementById('search').oninput=filter;
const params=new URLSearchParams(location.search);if(params.has('phone')){document.body.classList.add('phone-mode');document.getElementById('scene').replaceChildren();const h=innerHeight-126,w=innerWidth,cx=params.get('zone')==='west'?230:480,view=document.querySelector('.phone .view');view.innerHTML=scenes[params.get('night')==='1'?1:0];view.querySelector('svg').setAttribute('viewBox',[(cx-w/2),Math.min(139,720-h),w,h].join(' '));view.querySelector('svg').setAttribute('preserveAspectRatio','xMidYMin slice');}
</script></html>`;
writeFileSync(join(out,'index.html'),html);
writeFileSync(join(out,'ASSET_LIST.md'),'# ネリカス駅の原画一覧 v0.1\n\n1マス32px。bboxは足もとの左上基準、anchorは下端中央。形を変えず本編へ移すための一覧です。ゲームへは未登録です。\n\n|ID|名前|足もと|bbox|描いた細部|\n|---|---|---|---|---|\n'+metadata.map(a=>`|${a.id}|${a.name}|${a.w}×${a.h}|${a.bbox.join(', ')}|${a.details.join('・')}|`).join('\n')+'\n');
if(process.argv.includes('--no-shots')){console.log('SVG / HTML generated: '+NERIKASU_ASSETS.length+' assets');process.exit(0);}
const browser=await chromium.launch({args:['--disable-gpu']});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1280},deviceScaleFactor:1});
  page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // 全原画の宣言bboxを実際のSVG形状と突き合わせ、切れを検出。
  await page.setContent('<html lang="ja"><meta charset="utf-8">'+NERIKASU_ASSETS.flatMap(a=>a.states.map(state=>nerikasuSvg(a,{night:state==='night'}))).join('')+'</html>');
  await page.evaluate(()=>document.fonts.ready);
  const bounds=await page.evaluate(()=>[...document.querySelectorAll('svg')].map(s=>{const b=s.getBBox(),v=s.viewBox.baseVal;return {name:s.getAttribute('aria-label'),actual:[b.x,b.y,b.x+b.width,b.y+b.height],box:[v.x,v.y,v.x+v.width,v.y+v.height]};}));
  for(const b of bounds){const a=b.actual,v=b.box;if(a[0]<v[0]||a[1]<v[1]||a[2]>v[2]||a[3]>v[3])throw Error('Clipped SVG '+JSON.stringify(b));}
  for(const [name,width,height]of [['sheet-buildings',1340,1350],['sheet-details',1320,1510],['reference-comparison',1280,410],['station-plaza.day',960,720],['station-plaza.night',960,720],['collection',1440,1280]]){
    console.log('Rendering '+name);await page.setViewportSize({width,height});
    const source=readFileSync(join(out,'svg',name+'.svg'),'utf8');
    await page.setContent('<html lang="ja"><meta charset="utf-8"><style>body{margin:0}img{display:block}</style><img src="data:image/svg+xml;base64,'+Buffer.from(source).toString('base64')+'"></html>');
    await page.locator('img').evaluate(img=>img.decode());
    await page.screenshot({path:join(out,'img',name+'.png')});console.log('Saved '+name);
  }
  for(const [width,height]of [[390,844],[375,667]])for(const zone of ['center','west']){await page.setViewportSize({width,height});await page.goto(pathToFileURL(join(out,'index.html')).href+'?phone=1&zone='+zone);await page.evaluate(()=>document.fonts.ready);const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length-new Set(ids).size;});if(duplicateIds)throw Error('Duplicate SVG IDs hide phone textures');await page.screenshot({path:join(out,'img',`phone-${width}${zone==='west'?'-west':''}.png`)});}
  await page.setViewportSize({width:390,height:844});await page.goto(pathToFileURL(join(out,'index.html')).href);
  await page.getByRole('button',{name:'夜のあかり'}).click();if(await page.getByRole('button',{name:'夜のあかり'}).getAttribute('aria-pressed')!=='true')throw Error('night toggle');
  await page.getByRole('button',{name:'道・設備',exact:true}).click();const shown=await page.locator('article:not([hidden])').count();if(shown!==NERIKASU_ASSETS.filter(a=>a.category==='道・設備').length)throw Error('filter');
  await page.getByRole('button',{name:'すべて',exact:true}).click();await page.getByRole('textbox').fill('ネリカス駅');if(!(await page.locator('article:not([hidden])').count()))throw Error('search');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('mobile horizontal overflow');if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: '+NERIKASU_ASSETS.length+' SVG bounds (all states), unique IDs, self-contained exports, mobile controls / filters / search; 10 design PNGs.');
}finally{await browser.close();}
