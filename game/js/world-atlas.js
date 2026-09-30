// 地図は閲覧専用。移動やセーブを書き換えず、開いたパネル内だけで入力を処理する。
const WorldAtlas = {
  open() {
    const body=U.el("div"); this.render(body);
    return UI.modal({title:"ぜんたい ちず",body,cls:"full"});
  },
  render(el) {
    const saved=G.sceneName==="world"?G.scene.mapId:Save.d.world.map;
    const current=AtlasArt.places[saved]?saved:"town";
    const root=U.el("section",{class:"world-atlas","aria-label":"ぜんたい ちず"});
    const heading=U.el("div",{class:"atlas-heading",html:'<strong>ぽかぽかの せかい</strong><span>きになる ばしょを タップ</span>'});
    const frame=U.el("div",{class:"atlas-frame",html:AtlasArt.svg()});
    const svg=frame.querySelector("svg");
    const toolbar=U.el("div",{class:"atlas-toolbar","aria-label":"ちずの そうさ"});
    const info=U.el("div",{class:"atlas-info","aria-live":"polite"});
    const details=U.el("details",{class:"atlas-local"});
    const summary=U.el("summary",{text:"このエリアを くわしく みる"}), local=U.el("div");
    details.append(summary,local);
    const select=U.el("select",{"aria-label":"エリアを えらぶ",class:"atlas-select"});
    for(const id of Object.keys(AtlasArt.places)) select.append(U.el("option",{value:id,text:MAP_DEFS[id].name}));
    const hint=U.el("p",{class:"atlas-hint",text:"なぞって うごかす ／ 2ほんゆびで ひろげる"});
    const legend=U.el("div",{class:"atlas-legend",html:'<span class="walk">みち</span><span class="train">でんしゃ</span><span class="ferry">ふね</span><span class="plane">ひこうき</span><span class="boundary">エリアの さかい</span>'});
    root.append(heading,frame,toolbar,hint,legend,select,info,details);
    el.append(root);
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
      this.localMap(local,id,current);
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
  },
  localMap(el,id,current) {
    const d=MAP_DEFS[id], width=d.rows[0].length; let tiles="";
    d.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{
      const col=ch==="~"?"#8AC8E2":ch==="#"?"#C89CAA":"TPABRhWF".includes(ch)?"#7FA18A":"vz".includes(ch)?"#AABACB":"=-pbD".includes(ch)?"#EEE4CF":ch==="s"?"#F0D7A0":"#BDD6A1";
      tiles+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;
    }));
    for(const o of d.objects||[]) if(o.text) tiles+=`<circle cx="${o.x+o.w/2}" cy="${o.y+o.h/2}" r=".8" fill="#D69A55"/>`;
    for(const b of d.buildings||[]) if(b.act.type==="transit") tiles+=`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#70B6A7"/>`;
    if(id===current && G.sceneName==="world") {
      const p=G.scene.party[0]; tiles+=`<circle cx="${p.tx+.5}" cy="${p.ty+.5}" r=".8" fill="#E45662" stroke="white" stroke-width=".3"/>`;
    }
    for(const w of d.warps||[]) tiles+=`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="#BD87CF"/>`;
    el.innerHTML=`<svg viewBox="0 0 ${width} ${d.rows.length}" role="img" aria-label="${d.name}の詳細地図">${tiles}</svg><p class="atlas-hint">あか：いまの ばしょ ／ むらさき：つぎの エリア<br>みどり：のりば ／ オレンジ：あそべる もの</p>`;
    const neighbors=[...new Set((d.warps||[]).map(w=>w.to))];
    el.append(U.el("p",{class:"atlas-hint",text:`あるいて いける ばしょ：${neighbors.map(n=>MAP_DEFS[n].name).join(" ／ ")}`}));
    for(const b of d.buildings||[]) el.append(U.el("div",{class:"muted",text:`${b.label}：よこ ${b.x+b.door+1}・たて ${b.y+b.h}`}));
    const stops=Object.values(Transit.stops).filter(s=>s.map===id);
    if(stops.length) el.append(U.el("p",{class:"atlas-hint",text:`のりものは のりばから。池袋へは でんしゃで ${Transit.CITY_FARE}コイン（かえりは むりょう）。バスていからは どこへでも ${Transit.BUS_FARE}コイン。`}));
  },
};
