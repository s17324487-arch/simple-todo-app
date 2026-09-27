// 新しい敵は色違いだけでなく、輪郭とシルエットも描き分ける。
(() => {
  const path=(d,col)=>`<path d="${d}" fill="${col}" ${SK()}/>`;
  const bodies={
    snail:c=>path("M32,180 Q14,146 45,148 L62,164 L177,164 Q193,190 168,198 L56,198 Z",c)+`<circle cx="121" cy="132" r="52" fill="#E6C5A1" ${SK()}/><path d="M120,154 C80,149 90,101 126,110 C153,118 137,141 122,132" fill="none" ${SK()}/>`+path("M38,155 L28,106 L48,102 L59,157",c),
    sprout:c=>path("M64,94 C48,126 32,167 56,194 L152,194 C179,164 146,113 132,94 Z",c)+path("M99,96 C36,90 37,32 60,34 C88,34 111,68 101,91 C116,39 157,28 169,47 C179,73 137,104 99,96 Z","#73A980"),
    fox:c=>path("M47,101 L37,24 L85,66 L129,66 L175,24 L169,111 Q183,171 157,196 L54,196 Q24,154 47,101 Z",c)+path("M54,121 Q98,156 157,121 Q149,184 102,192 Q59,180 54,121 Z","#FFF0D8")+path("M166,173 Q214,117 199,102 Q178,111 151,171 Z",c),
    moth:c=>path("M94,112 C14,16 -8,68 22,121 C-13,182 36,214 89,162 L119,162 C182,218 227,172 182,117 C219,32 158,20 116,109 Z",c)+`<ellipse cx="104" cy="138" rx="22" ry="57" fill="#F2D4AB" ${SK()}/>`+path("M93,91 L72,56 M114,91 L138,55","none"),
    robot:c=>`<rect x="49" y="63" width="106" height="125" rx="18" fill="${c}" ${SK()}/>`+path("M70,190 L66,207 L91,207 L92,190 M117,190 L117,207 L142,207 L138,190 M45,116 L22,144 L40,160 M162,116 L187,143 L169,160","#95ACB1")+`<path d="M104,63 L104,37" ${SK()}/><circle cx="104" cy="31" r="9" fill="#F5D995" ${SK()}/><rect x="63" y="85" width="78" height="47" rx="10" fill="#FFF5D8" ${SK()}/>` ,
    crab:c=>path("M48,120 C48,75 154,75 157,120 L171,163 Q146,198 100,191 Q58,198 33,161 Z",c)+path("M47,142 L15,99 L9,67 L30,80 L46,63 L49,103 M154,141 L190,104 L193,64 L174,81 L158,63 L155,108 M58,180 L29,198 M148,180 L177,198",c),
    jelly:c=>path("M32,139 C17,26 185,21 174,139 Q159,161 143,145 Q125,165 107,146 Q88,166 70,146 Q51,163 32,139 Z",c)+path("M59,151 Q83,187 62,205 M102,155 Q78,185 104,205 M144,151 Q168,181 143,202","none"),
    seahorse:c=>path("M104,50 C161,36 169,94 143,120 Q108,135 121,161 Q167,157 164,185 Q150,211 119,199 Q58,183 72,133 L52,118 L26,116 L30,96 L67,90 Q57,55 104,50 Z",c)+path("M115,51 L112,28 L131,44 L145,33 L148,59 M73,134 L43,151 L73,168", "#F1DDAE"),
  };
  for(const [id,body] of Object.entries(bodies)) ENEMY_ART[id]=(col,emo)=>body(col)+enemyFace(emo,104,125);
  const original=WorldArt.building;
  WorldArt.building=function(sp){
    if(!sp.tower) return original(sp);
    const w=sp.w*TS,h=sp.h*TS; let svg=`<rect x="5" y="5" width="${w-10}" height="${h-8}" rx="5" fill="${sp.wall||"#DFDAD9"}" ${OS()}/><rect x="8" y="8" width="${w-16}" height="12" fill="${sp.roof}" ${OS()}/>`;
    for(let y=29;y<h-43;y+=30) for(let x=16;x<w-25;x+=32) svg+=`<rect x="${x}" y="${y}" width="20" height="20" rx="3" fill="#B9DDE7" ${OS(1.3)}/><path d="M${x+3},${y+16} L${x+16},${y+3}" stroke="#FFF" stroke-width="2"/>`;
    const dx=(sp.door+.5)*TS; svg+=`<rect x="${dx-14}" y="${h-34}" width="28" height="32" fill="#87AFC3" ${OS()}/><path d="M${dx},${h-33} V${h-2}" stroke="#FFF" stroke-width="2"/><rect x="${dx-35}" y="${h-59}" width="70" height="23" rx="4" fill="#FFF3CE" ${OS()}/>`;
    if(SIGN_ICON[sp.sign]) svg+=SIGN_ICON[sp.sign](dx,h-47);
    return {w,h:h+10,top:10,svg};
  };
})();
