// 元SVGと同じ原点・模様・描画順。Path2Dは一度だけ作り、見えるチャンクだけ描く。
const HeiwadaiGround={
  compiled:null,patterns:new Map(),
  async preload(def){
    if(!def.heiwadai)return;
    await Promise.all(Object.entries(HEIWADAI_LAYOUT_DATA.patterns).map(async([id,p])=>{
      const scale=4,svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+p.w+' '+p.h+'">'+p.svg+'</svg>';
      const c=await SvgCache.ensure('heiwadai-ground:'+id,()=>svg,p.w*scale,p.h*scale);
      this.patterns.set(id,c);
    }));
  },
  compile(){
    if(this.compiled)return this.compiled;
    return this.compiled=HEIWADAI_LAYOUT_DATA.commands.map(c=>{
      const a=c.a,n=k=>+(a[k]||0),path=new Path2D(c.type==='path'?a.d:undefined);
      if(c.type==='rect')path.roundRect(n('x'),n('y'),n('width'),n('height'),n('rx'));
      if(c.type==='circle'||c.type==='ellipse')path.ellipse(n('cx'),n('cy'),c.type==='circle'?n('r'):n('rx'),c.type==='circle'?n('r'):n('ry'),0,0,Math.PI*2);
      return {...c,path};
    });
  },
  draw(g,clip){
    const patterns={};for(const [id,c]of this.patterns){const p=g.createPattern(c,'repeat');p.setTransform(new DOMMatrix().scale(.25));patterns[id]=p;}
    for(const c of this.compile()){
      const [x0,y0,x1,y1]=c.bounds;if(x1<clip[0]||y1<clip[1]||x0>clip[2]||y0>clip[3])continue;
      g.save();g.transform(...c.m);g.lineWidth=c.width;g.lineCap=c.cap;g.lineJoin=c.join;g.setLineDash(c.dash);
      const id=/url\(#([^)]*)\)/.exec(c.fill)?.[1];
      g.fillStyle=id?patterns[id]:c.fill;g.strokeStyle=c.stroke;
      const text=c.type==='text';if(text){g.font=c.font;g.textAlign=({middle:'center',end:'right'})[c.align]||'left';g.textBaseline='alphabetic';}
      if(c.fill!=='none'){g.globalAlpha=c.alpha*c.fillAlpha;if(text)g.fillText(c.text,+c.a.x||0,+c.a.y||0);else g.fill(c.path,c.rule);}
      if(c.stroke!=='none'){g.globalAlpha=c.alpha*c.strokeAlpha;if(text)g.strokeText(c.text,+c.a.x||0,+c.a.y||0);else g.stroke(c.path);}
      g.restore();
    }
  },
};
