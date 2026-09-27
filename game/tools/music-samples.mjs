// 実際のWebAudio音源で試聴用WAVを作成。ゲーム本体はファイルを読み込まない。
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
const out=fileURLToPath(new URL('../docs/audio/',import.meta.url));mkdirSync(out,{recursive:true});
const {server,url}=await serve({port:0,quiet:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
try{
  const page=await browser.newPage();await page.route(/^https:\/\/fonts\./,route=>route.abort());
  await page.goto(url+'index.html');await page.waitForFunction(()=>window.PokaDebug&&PokaDebug.idle());
  const stats=[];
  for(const name of ['town','house','city','heiwadai','shop_crepe','battle_crown']){
    const {wav,...metrics}=await page.evaluate(async name=>PokaDebug.musicRender(name,8,true),name);
    writeFileSync(out+name+'.wav',Buffer.from(wav,'base64'));stats.push(metrics);
  }
  writeFileSync(out+'metrics.json',JSON.stringify(stats,null,2)+'\n');
  console.log(JSON.stringify(stats));
}finally{await browser.close();server.close();}
