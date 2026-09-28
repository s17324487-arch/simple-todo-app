// 同じSVGから景品と既存キャラを確認する。ユーザーのセーブは使用しない。
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {gameContext} from './game-context.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),dir=join(root,'docs/screenshots/puzzle-score-attack');mkdirSync(dir,{recursive:true});
const R=gameContext();R.Save.reset();
const html=`<!doctype html><html lang="ja"><meta charset="utf-8"><title>星のコレクション</title><style>
body{margin:0;padding:32px;background:#20283f;color:#fff4dc;font:15px/1.6 sans-serif}h1{font-size:28px;margin:6px 0}p{color:#ced5e2}main{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}figure{margin:0;padding:16px;background:#f5f0e4;color:#283147;border:1px solid #cfb97c;border-radius:14px}.art{height:270px;display:flex;align-items:center;justify-content:center}.art svg{max-width:100%;max-height:100%;filter:drop-shadow(0 5px 4px #52617940)}b{font-size:14px}small{display:block;color:#776345}footer{margin-top:24px;font-size:13px}</style>
<small>SCORE ATTACK / EXCLUSIVE COLLECTION</small><h1>なかよしパズル · 星のコレクション</h1><p>得点で獲得する非売品の家具。お部屋では光がまたたき、タップで反応します。</p><main>${R.PUZZLE_PRIZES.map(p=>`<figure><small>${p.tier} · ${p.score.toLocaleString()} pt</small><div class="art">${R.Art.furnSvg(p.id)}</div><b>${p.name}</b><small>幅 ${p.w} / 奥行き ${p.d} / 高さ ${p.h}</small></figure>`).join('')}</main><footer>1,200 / 4,000 / 9,000 / 16,000 / 45,000 pt　·　初回達成時に下位の景品も同時獲得　·　各1個</footer></html>`;
writeFileSync(join(dir,'prize-gallery.html'),html);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:590},deviceScaleFactor:1});
  await page.goto(pathToFileURL(join(dir,'prize-gallery.html')).href);await page.screenshot({path:join(dir,'prize-gallery.png')});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(join(root,'tools/preview.html')).href);
  const heading=page.getByRole('heading',{name:'3人 × 向き（上の選択を反映）',exact:true});
  await heading.waitFor();await heading.locator('xpath=following-sibling::div[1]').screenshot({path:join(dir,'characters.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Prize gallery + tools/preview.html characters: OK (file://).');
}finally{await browser.close();}
