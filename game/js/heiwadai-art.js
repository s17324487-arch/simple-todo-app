// 見本と同じSVGを、足もとの原点を保って描く。キーは登録済みの種類・オプションだけ。
const HeiwadaiArt = {
  assets:{},entries:[],lookup:new Map(),models:new Map(),defs:'',
  optionKey(o){return JSON.stringify(Object.fromEntries(Object.entries(o||{}).sort(([a],[b])=>a.localeCompare(b))));},
  register(data){
    this.defs=data.defs;Object.assign(this.assets,data.assets);
    for(const record of data.entries){
      const key=record.asset+'|'+this.optionKey(record.opts);
      if(this.lookup.has(key))throw new Error('Duplicate Heiwadai asset: '+key);
      const e={...record,index:this.entries.length,key};this.entries.push(e);this.lookup.set(key,e);
      WorldArt[e.kind]=opts=>this.model(e.asset,opts);
    }
  },
  entry(asset,opts){const e=this.lookup.get(asset+'|'+this.optionKey(opts));if(!e)throw new Error('Unknown Heiwadai variant: '+asset);return e;},
  model(asset,opts){
    const e=this.entry(asset,opts);if(this.models.has(e.key))return this.models.get(e.key);
    const [x0,y0,x1,y1]=e.bbox,prefix='hw'+e.index+'-';
    const namespaced=(this.defs+e.svg).replace(/id="([^"]+)"/g,(_,id)=>'id="'+prefix+id+'"').replace(/url\(#([^)]*)\)/g,(_,id)=>'url(#'+prefix+id+')');
    const model={w:x1-x0,h:y1-y0,top:-y0,originX:x0,originY:y0,footW:e.w,footH:e.h,
      svg:'<g transform="translate('+(-x0)+','+(-y0)+')">'+namespaced+'</g>'};
    this.models.set(e.key,model);return model;
  },
  full(asset,opts){const m=this.model(asset,opts);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 '+(m.w+4)+' '+(m.h+4)+'">'+m.svg+'</svg>';},
};
