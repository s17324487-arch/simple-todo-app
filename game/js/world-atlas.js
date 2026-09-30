// 地図は閲覧専用。移動やセーブを書き換えず、開いたパネル内だけで入力を処理する。
const WorldAtlas = {
  tab: null, // さいごに えらんだ タブ（"area"＝この エリア／"world"＝せかい ちず）。セーブしない
  open() {
    const body=U.el("div"); this.render(body,{tab:"world"});
    return UI.modal({title:"ぜんたい ちず",body,cls:"full"});
  },
  render(el,opts={}) {
    const saved=G.sceneName==="world"?G.scene.mapId:Save.d.world.map;
    const current=AtlasArt.places[saved]?saved:"town";
    // タブ: この エリア（AreaMap の ポンチ絵）／せかい ちず（下の 地形図）
    const tabs=U.el("div",{class:"atlas-tabs",role:"tablist","aria-label":"ちずの しゅるい"});
    const tabArea=U.el("button",{class:"atlas-tab",type:"button",role:"tab",text:"この エリア"}), tabWorld=U.el("button",{class:"atlas-tab",type:"button",role:"tab",text:"せかい ちず"});
    const areaPane=U.el("div",{class:"atlas-pane",role:"tabpanel","aria-label":"この エリアの ちず"}), worldPane=U.el("div",{class:"atlas-pane",role:"tabpanel","aria-label":"せかい ちず"});
    tabs.append(tabArea,tabWorld); el.append(tabs,areaPane,worldPane);
    const area=AreaMap.render(areaPane,current);
    // タブを おぼえるのは じぶんで えらんだ ときだけ（季節イベントの「ぜんたい ちず」は おぼえない）
    const choose=(t,remember)=>{
      if(remember) this.tab=t;
      for(const [b,pane,id] of [[tabArea,areaPane,"area"],[tabWorld,worldPane,"world"]]) {b.setAttribute("aria-selected",String(t===id));pane.hidden=t!==id;}
      if(t==="area") area.refresh();
    };
    tabArea.onclick=()=>{Sound.se("ok");choose("area",true);}; tabWorld.onclick=()=>{Sound.se("ok");choose("world",true);};
    const root=U.el("section",{class:"world-atlas","aria-label":"ぜんたい ちず"});
    const heading=U.el("div",{class:"atlas-heading",html:'<strong>ぽかぽかの せかい</strong><span>きになる ばしょを タップ</span>'});
    const frame=U.el("div",{class:"atlas-frame",html:AtlasArt.svg()});
    const svg=frame.querySelector("svg");
    const toolbar=U.el("div",{class:"atlas-toolbar","aria-label":"ちずの そうさ"});
    const info=U.el("div",{class:"atlas-info","aria-live":"polite"});
    const openLocal=UI.btn("この エリアの ちずを みる",()=>{Sound.se("ok");area.show(selected);choose("area",true);},"wide atlas-open-local");
    const select=U.el("select",{"aria-label":"エリアを えらぶ",class:"atlas-select"});
    for(const id of Object.keys(AtlasArt.places)) select.append(U.el("option",{value:id,text:MAP_DEFS[id].name}));
    const hint=U.el("p",{class:"atlas-hint",text:"なぞって うごかす ／ 2ほんゆびで ひろげる"});
    const legend=U.el("div",{class:"atlas-legend",html:'<span class="walk">みち</span><span class="train">でんしゃ</span><span class="ferry">ふね</span><span class="plane">ひこうき</span><span class="boundary">エリアの さかい</span>'});
    root.append(heading,frame,toolbar,hint,legend,select,info,openLocal);
    worldPane.append(root);
    let view={x:0,y:0,z:1}, selected=current, routes=true;
    const paint=()=>{
      const w=800/view.z,h=850/view.z;
      view.x=U.clamp(view.x,0,800-w); view.y=U.clamp(view.y,0,850-h);
      svg.setAttribute("viewBox",`${view.x} ${view.y} ${w} ${h}`);
      root.dataset.zoom=view.z.toFixed(2);
      smaller.disabled=view.z<=1; bigger.disabled=view.z>=3;
    };
    const zoom=(z,fx=.5,fy=.5)=>{
      z=U.clamp(z,1,3);
      view.x+=fx*(800/view.z-800/z); view.y+=fy*(850/view.z-850/z); view.z=z;
      paint();
    };
    const control=(label,text,action)=>{
      const b=UI.btn(text,action,"small"); b.setAttribute("aria-label",label); toolbar.append(b); return b;
    };
    const smaller=control("ちずを ちいさく","−",()=>zoom(view.z/1.5));
    const bigger=control("ちずを おおきく","＋",()=>zoom(view.z*1.5));
    control("ちずを ぜんたいに もどす","ぜんたい",()=>{view={x:0,y:0,z:1};paint();});
    control("いまの ばしょを みる","いま ここ",()=>{
      show(current); const p=AtlasArt.places[current]; view={x:p.x-200,y:p.y-212.5,z:2}; paint();
    });
    const routeButton=control("のりものの みち","のりもの",()=>{
      routes=!routes; svg.querySelector(".atlas-transit").style.display=routes?"":"none";
      routeButton.setAttribute("aria-pressed",String(routes));
      legend.classList.toggle("without-transit",!routes);
    });
    routeButton.setAttribute("aria-pressed","true");
    const show=id=>{
      selected=id; root.dataset.selected=id; select.value=id;
      for(const marker of svg.querySelectorAll(".atlas-marker")) {
        const active=marker.dataset.area===id, here=marker.dataset.area===current;
        marker.setAttribute("aria-pressed",String(active));
        marker.querySelector(".atlas-selection").setAttribute("visibility",active?"visible":"hidden");
        marker.querySelector(".atlas-here").setAttribute("visibility",here?"visible":"hidden");
        marker.classList.toggle("is-current",here);
      }
      const d=MAP_DEFS[id], p=AtlasArt.places[id];
      const levels=AREAS[id]?.table.flatMap(row=>[row[1],row[2]]);
      info.innerHTML=`<div class="atlas-area-icon" style="background:${p.color}"><svg viewBox="-40 -40 80 80" aria-hidden="true">${AtlasArt.icon(p.kind)}</svg></div><div><h3>${d.name}</h3><div class="atlas-area-meta">${id===current?"★ いま ここ　":""}${levels?`てき Lv.${Math.min(...levels)}〜${Math.max(...levels)}`:"おみせ・おさんぽ"}</div><p>${p.desc}</p></div>`;
      openLocal.textContent=`「${AreaMap.placeName(id)}」の ちずを みる`;
    };
    select.onchange=()=>show(select.value);
    // マーカーはEnter/Spaceでも選択できる。キー操作をゲーム側に流さない。
    svg.addEventListener("keydown",e=>{
      const marker=e.target.closest(".atlas-marker");
      if(marker && ["Enter"," "].includes(e.key)) {e.preventDefault();e.stopPropagation();show(marker.dataset.area);}
    });
    // 支援技術からのclick（ポインターの選択はpointerupで行う）。
    svg.addEventListener("click",e=>{
      const marker=e.target.closest(".atlas-marker");
      if(e.detail===0 && marker) show(marker.dataset.area);
    });
    const pointers=new Map(); let gesture=null;
    const point=e=>({x:e.clientX,y:e.clientY});
    const start=()=>{
      const ps=[...pointers.values()], a=ps[0], b=ps[1];
      gesture=ps.length?{view:{...view},x:b?(a.x+b.x)/2:a.x,y:b?(a.y+b.y)/2:a.y,d:b?Math.hypot(a.x-b.x,a.y-b.y):0,moved:!!b,marker:null}:null;
    };
    svg.addEventListener("pointerdown",e=>{
      if(e.button>0) return;
      e.preventDefault(); pointers.set(e.pointerId,point(e)); svg.setPointerCapture(e.pointerId); start();
      if(pointers.size===1) gesture.marker=e.target.closest(".atlas-marker")?.dataset.area;
    });
    svg.addEventListener("pointermove",e=>{
      if(!pointers.has(e.pointerId)||!gesture) return;
      pointers.set(e.pointerId,point(e));
      const ps=[...pointers.values()], a=ps[0], b=ps[1], r=svg.getBoundingClientRect();
      const x=b?(a.x+b.x)/2:a.x,y=b?(a.y+b.y)/2:a.y;
      if(Math.hypot(x-gesture.x,y-gesture.y)>6 || b) gesture.moved=true;
      const v=gesture.view, z=b&&gesture.d?U.clamp(v.z*Math.hypot(a.x-b.x,a.y-b.y)/gesture.d,1,3):v.z;
      view={z,x:v.x+(gesture.x-r.left)/r.width*800/v.z-(x-r.left)/r.width*800/z,y:v.y+(gesture.y-r.top)/r.height*850/v.z-(y-r.top)/r.height*850/z};
      paint();
    });
    const end=(e,canceled)=>{
      if(!pointers.has(e.pointerId)) return;
      if(!canceled && pointers.size===1 && gesture && !gesture.moved && gesture.marker) show(gesture.marker);
      pointers.delete(e.pointerId);
      if(svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      start();
      // ピンチ後に残った1本の指をタップと取り違えない。
      if(gesture) gesture.moved=true;
    };
    svg.addEventListener("pointerup",e=>end(e,false));
    svg.addEventListener("pointercancel",e=>end(e,true));
    svg.addEventListener("lostpointercapture",e=>end(e,true));
    svg.addEventListener("wheel",e=>{
      if(!e.ctrlKey) return; // 通常のスクロールはモーダルへ。
      e.preventDefault(); const r=svg.getBoundingClientRect();
      zoom(view.z*(e.deltaY<0?1.15:1/1.15),(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);
    },{passive:false});
    show(selected); paint();
    choose(opts.tab||this.tab||"area");
  },
};
