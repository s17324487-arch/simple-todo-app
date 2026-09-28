// 池袋の専売素材を、ゲームと同じSVGで一覧確認する（出力は docs/screenshots/ikebukuro）。
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gameContext } from './game-context.mjs';
const R=gameContext(),dir=fileURLToPath(new URL('../docs/screenshots/ikebukuro/',import.meta.url));
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1200,height:950},deviceScaleFactor:1});
try{
  for(const group of ['hane','animal','gothic','electronics','luxury','prize']){
    const cards=[];
    for(const id of R.IkebukuroCatalog.groups[group]){
      const f=R.FURN_INDEX[id];
      if(f){cards.push({name:f.name,svg:R.Art.furnSvg(id)});continue;}
      if(R.BAG_INDEX[id]){cards.push({name:R.BAG_INDEX[id].name,svg:R.Art.iconSvg('bag',id)});continue;}
      const it=R.ITEM_INDEX[id];
      for(const who of ['wanko','gachan','goji'])for(const dir of ['down','left','right','up'])cards.push({name:it.name+' / '+who+' '+dir,svg:R.Chara.svg(who,{dir,outfit:{[it.slot]:id}})});
    }
    const columns=['hane','animal','gothic'].includes(group)?12:6;
    await page.setContent(`<html lang="ja"><meta charset="utf-8"><style>body{margin:16px;background:#f2ecdf;color:#1f1d1b;font:12px sans-serif}h1{font-size:20px}.grid{display:grid;grid-template-columns:repeat(${columns},1fr);gap:6px}.card{padding:8px;background:#fff9ec;border:1px solid #d3c4af;border-radius:9px;text-align:center}.card>svg{width:100%;height:${columns===12?120:160}px;display:block}p{margin:5px 0}</style><h1>池袋・${group} / 同じゲーム素材の全方向プレビュー</h1><div class="grid">${cards.map(c=>`<div class="card">${c.svg}<p>${c.name}</p></div>`).join('')}</div></html>`);
    await page.screenshot({path:dir+'catalog-'+group+'.png',fullPage:true});
    console.log('preview '+group+': '+cards.length+' views');
  }
}finally{await browser.close();}
