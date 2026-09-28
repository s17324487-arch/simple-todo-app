import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),out=join(root,'docs/screenshots/heiwadai-layout');mkdirSync(out,{recursive:true});
const {server,url}=await serve({port:0,quiet:true}),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
const views=[['station',43.2,27.4,390,844],['junction',43,45,390,844],['shotengai',20.5,34,390,844],['residential',28.2,55.5,390,844],['plaza',27.5,20.2,375,667]];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.route(/^https:\/\/fonts\./,r=>r.abort());page.on('pageerror',e=>console.error(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.PokaDebug&&PokaDebug.state().scene==='title'&&PokaDebug.idle());
 await page.evaluate(()=>PokaDebug.newGame());await page.waitForFunction(()=>PokaDebug.state().scene==='house'&&PokaDebug.idle());
 await page.evaluate(()=>{PokaDebug.hour(12);PokaDebug.calendar('2026-05-01');PokaDebug.weather('clear');PokaDebug.teleport('heiwadai',42,29,'right');});
 await page.waitForFunction(()=>PokaDebug.state().map==='heiwadai'&&PokaDebug.idle(),null,{timeout:60000});
 await page.evaluate(()=>PokaDebug.pause(true));
 const images=[];
 for(const [id,cx,cy,width,height]of views){const png=await page.evaluate(v=>PokaDebug.heiwadaiView(v),{cx,cy,width,height});writeFileSync(join(out,id+'.png'),Buffer.from(png.split(',')[1],'base64'));images.push(png);}
 await page.screenshot({path:join(out,'play-390.png')});await page.setViewportSize({width:375,height:667});await page.evaluate(()=>PokaDebug.pause(false));await page.waitForTimeout(400);await page.screenshot({path:join(out,'play-375.png')});
 const ref='data:image/png;base64,'+readFileSync(join(root,'docs/design/towns/heiwadai/img/phones.png')).toString('base64');
 const paired=await browser.newPage({viewport:{width:830,height:940}});
 for(let i=0;i<views.length;i++){
  const [id,,,w,h]=views[i];
  await paired.setContent('<meta charset="utf-8"><style>body{margin:0;padding:16px;background:#fbf8f1;font:14px sans-serif}main{display:flex;gap:18px}h1{font-size:18px}figure{margin:0}img{display:block}</style><h1>平和台 v0.2 '+(i+1)+' '+id+' ／ '+w+'×'+h+'</h1><main><figure>見本 img/phones.png<canvas id="ref"></canvas></figure><figure>実ゲームの描画<img width="'+w+'" height="'+h+'" src="'+images[i]+'"></figure></main>');
  await paired.evaluate(async({ref,i,w,h})=>{const im=new Image();im.src=ref;await im.decode();const c=document.getElementById('ref');c.width=w;c.height=h;c.style.display='block';c.getContext('2d').drawImage(im,34+i*454,166,432,i===4?768:935,w*0,0,w,h);},{ref,i,w,h});
  await paired.screenshot({path:join(out,'compare-'+id+'.png'),fullPage:true});
 }
 console.log('Heiwadai phone comparisons: '+out);
}finally{await browser.close();server.close();}
