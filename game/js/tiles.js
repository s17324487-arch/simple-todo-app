// 地面タイル（canvasで直接描く）と、町のオブジェクト（木・家など、SVG）
const TS = 32; // タイルの論理サイズ

const GROUND = {
  ".": "grass", ",": "flower", '"': "tall", "=": "path", "-": "dirt", "~": "water", s: "sand", p: "plaza", b: "bridge",
  v: "road", z: "crosswalk",
  c: "cave", W: "cavewall", d: "forest", "#": "grass", T: "grass", P: "forest", A: "grass", B: "grass", R: "grass", F: "grass",
  L: "path", f: "grass", n: "plaza", x: "forest", m: "forest", k: "cave", r: "cave", h: "grass", g: "dirt", w: "grass",
};
// 通れないタイル
const SOLID_CH = new Set(["~", "W", "#", "T", "P", "A", "B", "R", "F", "L", "f", "n", "x", "k", "r", "h", "w"]);
const OBJ_CH = { T: "tree", P: "pine", A: "appletree", B: "bush", R: "rock", F: "fence", L: "lamp", f: "flowerbed", n: "bench", x: "stump", k: "crystal", r: "caverock", m: "shroom", h: "hedge", w: "well" };

const Tiles = {
  chunks: new Map(),
  clear() { this.chunks.clear(); },

  // ---- 地面 ----
  drawGround(g, map, tx, ty, x, y, s) {
    const type = map.groundAt(tx, ty);
    const H = (k) => U.hash(tx, ty, k);
    const same = (dx, dy) => {
      const t = map.groundAt(tx + dx, ty + dy);
      return t === type || (t == null);
    };
    const u = s / 32;
    switch (type) {
      case "road": case "crosswalk": {
        g.fillStyle="#B7C5CE";g.fillRect(x,y,s,s);
        g.strokeStyle="#E7EBE9";g.lineWidth=2*u;
        if(type==="crosswalk"){g.fillStyle="#F7F3E7";for(let i=0;i<4;i++)g.fillRect(x+3*u,y+(i*8+1)*u,s-6*u,4*u);}
        else {if(tx%3===0&&ty%3===0){g.beginPath();g.moveTo(x+10*u,y+s/2);g.lineTo(x+22*u,y+s/2);g.stroke();}}
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
          if(["road","crosswalk"].includes(map.groundAt(tx+dx,ty+dy)))continue;
          g.fillStyle="#E1E5DC";g.fillRect(x+(dx===1?s-3*u:0),y+(dy===1?s-3*u:0),dx?3*u:s,dy?3*u:s);
        }
        break;
      }
      case "grass": case "flower": case "tall": case "forest": case "fflower": {
        const fr = type === "forest" || type === "fflower";
        const palette=SeasonPalette.get();
        const base = fr ? palette.forest : palette.grass;
        const dark = fr ? palette.forestDark : palette.dark;
        g.fillStyle = base; g.fillRect(x, y, s, s);
        // ちいさな くさ
        g.strokeStyle = dark; g.lineWidth = 1.6 * u; g.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          if (H(i) < 0.45) continue;
          const px = x + (4 + H(i + 10) * 24) * u, py = y + (6 + H(i + 20) * 22) * u;
          g.beginPath(); g.moveTo(px - 2.5 * u, py - 3 * u); g.lineTo(px, py); g.lineTo(px + 2.5 * u, py - 3 * u); g.stroke();
        }
        if (type === "flower" || type === "fflower") {
          const cols = ["#FFFFFF", "#FFB3C8", "#FFE066"];
          for (let i = 0; i < 2; i++) {
            const px = x + (6 + H(i + 30) * 20) * u, py = y + (6 + H(i + 40) * 20) * u;
            const c = cols[Math.floor(H(i + 50) * 3)];
            g.fillStyle = c;
            for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; g.beginPath(); g.arc(px + Math.cos(a) * 2.6 * u, py + Math.sin(a) * 2.6 * u, 2.2 * u, 0, 7); g.fill(); }
            g.fillStyle = "#F29A1F"; g.beginPath(); g.arc(px, py, 1.6 * u, 0, 7); g.fill();
          }
        }
        if (type === "tall") {
          g.fillStyle = palette.dark;
          g.fillRect(x, y + 4 * u, s, s - 4 * u);
          this.tallBlades(g, x, y, s, "#5FA74A", "#8FD06E");
        }
        break;
      }
      case "path": case "plaza": case "dirt": case "sand": case "cave": {
        const themed=map.def.renewal&&{city:["#D8D8CE","#C6C8BD"],harbor:["#D5CEC0","#C1BCB0"],airport:["#DCE0DA","#C5CFCB"]}[map.id];
        const col = type==="plaza"&&themed?themed:{ path: ["#EFE0B9", "#DCC89A"], plaza: ["#F2D3AE", "#E0B98E"], dirt: ["#DDBB8A", "#C9A372"], sand: ["#F6E7B3", "#E6D196"], cave: ["#A3968A", "#8E8175"] }[type];
        // まわりが違う地面なら 草のふちどり
        const bg = type === "cave" ? "#6E6259" : map.baseGround === "forest" ? SeasonPalette.get().forest : SeasonPalette.get().grass;
        g.fillStyle = bg; g.fillRect(x, y, s, s);
        const r = 7 * u;
        const L = same(-1, 0), R = same(1, 0), T = same(0, -1), B = same(0, 1);
        g.fillStyle = col[0];
        const ix = L ? 0 : 2 * u, iy = T ? 0 : 2 * u, iw = s - ix - (R ? 0 : 2 * u), ih = s - iy - (B ? 0 : 2 * u);
        g.beginPath();
        const x0 = x + ix, y0 = y + iy, x1 = x0 + iw, y1 = y0 + ih;
        const tl = !L && !T ? r : 0, tr = !R && !T ? r : 0, br = !R && !B ? r : 0, bl = !L && !B ? r : 0;
        g.moveTo(x0 + tl, y0); g.lineTo(x1 - tr, y0); g.quadraticCurveTo(x1, y0, x1, y0 + tr);
        g.lineTo(x1, y1 - br); g.quadraticCurveTo(x1, y1, x1 - br, y1);
        g.lineTo(x0 + bl, y1); g.quadraticCurveTo(x0, y1, x0, y1 - bl);
        g.lineTo(x0, y0 + tl); g.quadraticCurveTo(x0, y0, x0 + tl, y0);
        g.fill();
        g.strokeStyle = col[1]; g.lineWidth = 1.4 * u;
        if (type === "plaza") {
          g.beginPath();
          for (let k = 1; k < 4; k++) { g.moveTo(x0, y + k * 8 * u); g.lineTo(x1, y + k * 8 * u); }
          for (let k = 0; k < 4; k++) { const off = (k % 2) * 8 * u; for (let j = 0; j < 3; j++) { const xx = x + off + j * 16 * u; if (xx > x0 && xx < x1) { g.moveTo(xx, y + k * 8 * u); g.lineTo(xx, y + (k + 1) * 8 * u); } } }
          g.stroke();
        } else {
          g.fillStyle = col[1];
          for (let i = 0; i < 3; i++) {
            if (H(i + 60) < 0.4) continue;
            g.beginPath(); g.ellipse(x + (6 + H(i + 70) * 20) * u, y + (6 + H(i + 80) * 20) * u, (2 + H(i + 90) * 2) * u, 1.6 * u, 0, 0, 7); g.fill();
          }
        }
        break;
      }
      case "water": {
        if(map.def.renewal){g.fillStyle=map.id==="harbor"?"#87BCCA":"#98C5C7";g.fillRect(x,y,s,s);if(H(9)<.3){g.strokeStyle="#B6D9D8";g.lineWidth=u;g.beginPath();g.moveTo(x+8*u,y+19*u);g.quadraticCurveTo(x+13*u,y+16*u,x+19*u,y+19*u);g.stroke();}break;}
        g.fillStyle = "#A6D883";
        if (map.baseGround === "cave") g.fillStyle = "#6E6259";
        g.fillRect(x, y, s, s);
        const L = same(-1, 0), R = same(1, 0), T = same(0, -1), B = same(0, 1);
        g.fillStyle = "#86CFF2";
        const e = 3 * u;
        g.beginPath();
        const x0 = x + (L ? 0 : e), y0 = y + (T ? 0 : e), x1 = x + s - (R ? 0 : e), y1 = y + s - (B ? 0 : e);
        const r = 8 * u;
        const tl = !L && !T ? r : 0, tr = !R && !T ? r : 0, br = !R && !B ? r : 0, bl = !L && !B ? r : 0;
        g.moveTo(x0 + tl, y0); g.lineTo(x1 - tr, y0); g.quadraticCurveTo(x1, y0, x1, y0 + tr);
        g.lineTo(x1, y1 - br); g.quadraticCurveTo(x1, y1, x1 - br, y1);
        g.lineTo(x0 + bl, y1); g.quadraticCurveTo(x0, y1, x0, y1 - bl);
        g.lineTo(x0, y0 + tl); g.quadraticCurveTo(x0, y0, x0 + tl, y0);
        g.fill();
        g.strokeStyle = "#5BB4E0"; g.lineWidth = 2 * u; g.stroke();
        break;
      }
      case "bridge": {
        g.fillStyle = "#86CFF2"; g.fillRect(x, y, s, s);
        g.fillStyle = "#D9A066"; g.fillRect(x, y + 2 * u, s, s - 4 * u);
        g.strokeStyle = "#B07A45"; g.lineWidth = 1.6 * u;
        g.beginPath(); for (let k = 0; k <= 4; k++) { g.moveTo(x + k * 8 * u, y + 2 * u); g.lineTo(x + k * 8 * u, y + s - 2 * u); } g.stroke();
        g.fillStyle = "#8B5A33"; g.fillRect(x, y + 1 * u, s, 3 * u); g.fillRect(x, y + s - 4 * u, s, 3 * u);
        break;
      }
      case "cavewall": {
        g.fillStyle = "#5E5249"; g.fillRect(x, y, s, s);
        g.fillStyle = "#74665B";
        g.beginPath(); g.moveTo(x, y + 20 * u); g.lineTo(x + 10 * u, y + 12 * u); g.lineTo(x + 20 * u, y + 18 * u); g.lineTo(x + s, y + 8 * u); g.lineTo(x + s, y); g.lineTo(x, y); g.fill();
        if (!same(0, 1)) { g.fillStyle = "#4A4039"; g.fillRect(x, y + s - 6 * u, s, 6 * u); }
        g.fillStyle = "#877868";
        if (H(1) > 0.5) { g.beginPath(); g.arc(x + 22 * u, y + 24 * u, 3 * u, 0, 7); g.fill(); }
        break;
      }
      default:
        g.fillStyle = SeasonPalette.get().grass; g.fillRect(x, y, s, s);
    }
  },
  tallBlades(g, x, y, s, dark, light) {
    const palette=SeasonPalette.get();dark=palette.forestDark;light=palette.dark;
    const u = s / 32;
    for (let i = 0; i < 4; i++) {
      const bx = x + (2 + i * 8) * u, by = y + s;
      g.fillStyle = i % 2 ? dark : light;
      g.beginPath();
      g.moveTo(bx, by); g.lineTo(bx + 3 * u, by - 20 * u); g.lineTo(bx + 6 * u, by - 6 * u); g.lineTo(bx + 9 * u, by - 22 * u); g.lineTo(bx + 11 * u, by);
      g.fill();
    }
    g.strokeStyle = "#4E8F3C"; g.lineWidth = 1.2 * u;
    g.beginPath(); g.moveTo(x, y + s - 0.5 * u); g.lineTo(x + s, y + s - 0.5 * u); g.stroke();
  },

  // 8x8タイルのチャンクを端末ピクセルで描いてキャッシュ
  chunk(map, cx, cy) {
    const season=SeasonPalette.id();if(this.season!==season){this.clear();this.season=season;}
    const key = map.id + ":" + cx + "," + cy + "@" + G.px;
    let c = this.chunks.get(key);
    if (c) return c;
    const s = Math.round(TS * G.px), N = 8, pad=TownRoads.enabled(map.def)?2:0;
    c = document.createElement("canvas");
    c.width = s * N+pad*2; c.height = s * N+pad*2;
    const g = c.getContext("2d");
    if(pad)g.translate(pad,pad);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const tx = cx * N + i, ty = cy * N + j;
      if (tx >= map.w || ty >= map.h) continue;
      this.drawGround(g, map, tx, ty, i * s, j * s, s);
    }
    if(TownRoads.enabled(map.def)) {
      // 毎チャンク同じ世界原点を使う。模様の位相や線の座標をチャンクでリセットしない。
      g.save();g.scale(s/TS,s/TS);g.translate(-cx*N*TS,-cy*N*TS);
      TownRenewal.drawGround(g,map.def);
      const ready=map.def.heiwadai?(HeiwadaiGround.draw(g,[cx*N*TS-pad,cy*N*TS-pad,(cx+1)*N*TS+pad,(cy+1)*N*TS+pad]),true):TownRoads.draw(g,map.def);g.restore();
      if(!ready){const blank=document.createElement("canvas");blank.width=blank.height=s*N;blank.getContext("2d").drawImage(c,-pad,-pad);return blank;}
    }
    if(pad){const cropped=document.createElement("canvas");cropped.width=cropped.height=s*N;cropped.getContext("2d").drawImage(c,-pad,-pad);c=cropped;}
    this.chunks.set(key, c);
    return c;
  },
};

// ================= 町のオブジェクト（SVG・論理px） =================
const OS = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const WorldArt = {
  // それぞれ { w, h, svg } w,h は論理px。足元(下端中央)をタイルの下端中央に合わせる
  tree: () => ({ w: 40, h: 54, svg: `<rect x="16" y="34" width="8" height="16" rx="2" fill="#A8743F" ${OS()}/>
    <ellipse cx="20" cy="50" rx="12" ry="3" fill="${INK}" fill-opacity="0.15"/>
    <circle cx="20" cy="22" r="18" fill="#5DAA4F" ${OS()}/><circle cx="12" cy="28" r="10" fill="#5DAA4F" ${OS()}/><circle cx="28" cy="28" r="10" fill="#5DAA4F" ${OS()}/>
    <path d="M6,26 C8,34 32,34 34,26" fill="#5DAA4F"/><circle cx="14" cy="16" r="5" fill="#7CC468"/><circle cx="24" cy="12" r="3" fill="#7CC468"/>` }),
  appletree: () => ({ w: 40, h: 54, svg: WorldArt.tree().svg + `<circle cx="10" cy="24" r="3" fill="#E8453C" ${OS(1.2)}/><circle cx="26" cy="20" r="3" fill="#E8453C" ${OS(1.2)}/><circle cx="20" cy="31" r="3" fill="#E8453C" ${OS(1.2)}/>` }),
  pine: () => ({ w: 36, h: 58, svg: `<rect x="15" y="44" width="6" height="10" rx="2" fill="#8B5A33" ${OS()}/>
    <ellipse cx="18" cy="54" rx="11" ry="3" fill="${INK}" fill-opacity="0.15"/>
    <path d="M18,2 L32,26 L25,26 L34,44 L2,44 L11,26 L4,26 Z" fill="#3F8E4F" ${OS()}/>
    <path d="M18,8 L24,20 M14,30 L20,40" fill="none" stroke="#5DB06A" stroke-width="2.2" stroke-linecap="round"/>` }),
  bush: () => ({ w: 34, h: 30, svg: `<ellipse cx="17" cy="27" rx="13" ry="3" fill="${INK}" fill-opacity="0.15"/>
    <path d="M4,26 C0,16 8,8 14,12 C16,4 26,4 28,12 C36,12 36,24 30,26 Z" fill="#6DBE5B" ${OS()}/><circle cx="12" cy="17" r="3" fill="#8FD06E"/>` }),
  hedge: () => ({ w: 32, h: 30, svg: `<rect x="1" y="6" width="30" height="22" rx="8" fill="#5DAA4F" ${OS()}/><path d="M6,14 L10,11 M18,12 L22,9" stroke="#7CC468" stroke-width="2" stroke-linecap="round"/>` }),
  rock: () => ({ w: 32, h: 28, svg: `<ellipse cx="16" cy="25" rx="13" ry="3" fill="${INK}" fill-opacity="0.15"/>
    <path d="M3,24 L5,12 L14,5 L25,7 L30,16 L28,24 Z" fill="#B7B0A6" ${OS()}/><path d="M9,11 L15,8 L20,9" fill="none" stroke="#D8D2C8" stroke-width="2" stroke-linecap="round"/>` }),
  caverock: () => ({ w: 32, h: 30, svg: `<path d="M2,28 L4,12 L14,4 L26,6 L31,18 L29,28 Z" fill="#8E8175" ${OS()}/><path d="M8,12 L14,8 L20,9" fill="none" stroke="#A89A8C" stroke-width="2" stroke-linecap="round"/>` }),
  crystal: () => ({ w: 32, h: 40, svg: `<ellipse cx="16" cy="37" rx="12" ry="3" fill="${INK}" fill-opacity="0.2"/>
    <path d="M6,36 L4,22 L9,16 L13,22 L13,36 Z" fill="#B3E5FC" ${OS()}/><path d="M12,37 L11,12 L17,2 L23,12 L22,37 Z" fill="#8FD3F4" ${OS()}/><path d="M21,37 L22,20 L27,15 L30,20 L28,37 Z" fill="#B3E5FC" ${OS()}/>
    <path d="M15,10 L15,26" stroke="#FFF" stroke-width="2" stroke-linecap="round"/>` }),
  stump: () => ({ w: 32, h: 26, svg: `<path d="M5,12 L5,22 C5,26 27,26 27,22 L27,12 Z" fill="#A8743F" ${OS()}/><ellipse cx="16" cy="12" rx="11" ry="5" fill="#E2B982" ${OS()}/><ellipse cx="16" cy="12" rx="5" ry="2" fill="none" stroke="#B98A52" stroke-width="1.4"/>` }),
  shroom: () => ({ w: 24, h: 20, svg: `<rect x="9" y="10" width="6" height="8" rx="2" fill="#F3E3C3" ${OS(1.2)}/><path d="M2,12 C2,4 22,4 22,12 Z" fill="#E35D5B" ${OS(1.2)}/><circle cx="8" cy="8" r="1.6" fill="#FFF"/><circle cx="15" cy="7" r="1.4" fill="#FFF"/>` }),
  fence: () => ({ w: 32, h: 26, svg: `<rect x="0" y="9" width="32" height="4" fill="#E2B982" ${OS(1.2)}/><rect x="0" y="16" width="32" height="4" fill="#E2B982" ${OS(1.2)}/>
    <path d="M4,24 L4,6 L7,3 L10,6 L10,24 Z M22,24 L22,6 L25,3 L28,6 L28,24 Z" fill="#F2D3AE" ${OS(1.4)}/>` }),
  lamp: () => ({ w: 20, h: 52, svg: `<ellipse cx="10" cy="50" rx="6" ry="2" fill="${INK}" fill-opacity="0.2"/><rect x="8" y="16" width="4" height="34" fill="#5B6275" ${OS(1.2)}/>
    <path d="M3,16 L17,16 L14,6 L6,6 Z" fill="#FFE9A8" ${OS(1.4)}/><path d="M5,6 L15,6 L10,1 Z" fill="#5B6275" ${OS(1.2)}/><rect x="5" y="48" width="10" height="3" rx="1" fill="#5B6275" ${OS(1.2)}/>` }),
  flowerbed: () => ({ w: 32, h: 26, svg: `<rect x="1" y="12" width="30" height="12" rx="3" fill="#C98A52" ${OS()}/>
    ${[6, 16, 26].map((x, i) => `<path d="M${x},14 L${x},8" stroke="#4E9A3E" stroke-width="1.6"/>${flowerSvg(x, 7, 2.6, ["#F48FB1", "#FFE066", "#FFFFFF"][i], "#F29A1F", 1)}`).join("")}` }),
  bench: () => ({ w: 34, h: 26, svg: `<rect x="2" y="4" width="30" height="7" rx="2" fill="#D9A066" ${OS(1.4)}/><rect x="1" y="12" width="32" height="6" rx="2" fill="#E2B982" ${OS(1.4)}/><path d="M5,18 L5,24 M29,18 L29,24" ${OS(2.2)}/>` }),
  well: () => ({ w: 34, h: 40, svg: `<path d="M5,10 L17,2 L29,10 Z" fill="#E35D5B" ${OS()}/><path d="M8,10 L8,24 M26,10 L26,24" ${OS(2)}/><ellipse cx="17" cy="28" rx="14" ry="6" fill="#B7B0A6" ${OS()}/><path d="M3,28 L3,34 C3,40 31,40 31,34 L31,28" fill="#B7B0A6" ${OS()}/><ellipse cx="17" cy="28" rx="10" ry="3.5" fill="#5BB4E0"/>` }),
  sign: () => ({ w: 28, h: 30, svg: `<rect x="12" y="16" width="4" height="12" fill="#A8743F" ${OS(1.2)}/><rect x="2" y="4" width="24" height="14" rx="3" fill="#E2B982" ${OS()}/><path d="M7,9 L21,9 M7,13 L17,13" stroke="#A8743F" stroke-width="1.6" stroke-linecap="round"/>` }),
  chest: (o) => ({ w: 30, h: 26, svg: o && o.open ? `<rect x="3" y="12" width="24" height="12" rx="2" fill="#C98A52" ${OS()}/><path d="M3,12 L6,2 L24,2 L27,12 Z" fill="#8B5A33" ${OS()}/><rect x="6" y="12" width="18" height="3" fill="#5E3F24"/>` : `<rect x="3" y="10" width="24" height="14" rx="2" fill="#C98A52" ${OS()}/><path d="M3,12 C3,4 27,4 27,12 Z" fill="#D9A066" ${OS()}/><rect x="3" y="11" width="24" height="3" fill="#F7C948" ${OS(1.2)}/><rect x="12" y="10" width="6" height="7" rx="1" fill="#F7C948" ${OS(1.2)}/>` }),
  sparkle: () => ({ w: 20, h: 20, svg: `<path d="${starPath(10, 10, 8, 2.6, 4)}" fill="#FFF7A8" ${OS(1)}/>` }),
  fountain: () => ({ w: 96, h: 92, svg: `<ellipse cx="48" cy="84" rx="46" ry="9" fill="${INK}" fill-opacity="0.12"/>
    <ellipse cx="48" cy="66" rx="46" ry="20" fill="#D8D2C8" ${OS()}/><ellipse cx="48" cy="62" rx="40" ry="15" fill="#86CFF2" ${OS(1.4)}/>
    <path d="M2,66 L2,72 C2,84 94,84 94,72 L94,66" fill="#C9C3BA" ${OS()}/>
    <rect x="42" y="30" width="12" height="32" rx="3" fill="#D8D2C8" ${OS()}/><ellipse cx="48" cy="32" rx="18" ry="6" fill="#D8D2C8" ${OS()}/><ellipse cx="48" cy="31" rx="13" ry="3.5" fill="#86CFF2"/>
    <path d="M48,28 C44,14 36,12 30,22 M48,28 C52,14 60,12 66,22 M48,28 L48,10" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round"/>
    <path d="M48,28 C44,14 36,12 30,22 M48,28 C52,14 60,12 66,22 M48,28 L48,10" fill="none" stroke="#86CFF2" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M22,60 C30,56 36,60 42,58 M56,64 C62,60 70,64 76,60" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round"/>` }),
  gate: () => ({ w: 96, h: 70, svg: `<rect x="6" y="18" width="10" height="50" fill="#D9A066" ${OS()}/><rect x="80" y="18" width="10" height="50" fill="#D9A066" ${OS()}/>
    <path d="M0,20 C20,2 76,2 96,20 L96,28 C76,12 20,12 0,28 Z" fill="#E35D5B" ${OS()}/>
    <rect x="28" y="14" width="40" height="14" rx="4" fill="#FFF7E0" ${OS(1.4)}/>` }),
  caveentrance: () => ({ w: 64, h: 60, svg: `<path d="M0,60 L2,24 C8,4 56,4 62,24 L64,60 Z" fill="#8E8175" ${OS()}/><path d="M14,60 L14,34 C16,18 48,18 50,34 L50,60 Z" fill="#2B2320" ${OS()}/><path d="M6,30 L12,22 M52,22 L58,30" stroke="#A89A8C" stroke-width="2.5" stroke-linecap="round"/>` }),
  stairs: () => ({ w: 32, h: 32, svg: `<rect x="2" y="2" width="28" height="28" rx="3" fill="#2B2320" ${OS()}/><path d="M6,10 L26,10 M6,17 L26,17 M6,24 L26,24" stroke="#8E8175" stroke-width="3"/>` }),
};

// ---- 建物 ----
// spec: { w,h (タイル), roof, wall, door (ドアのタイル位置 x), sign, awning:[c1,c2], chimney }
const SIGN_ICON = {
  cake: (x,y)=>`<g transform="translate(${x} ${y})"><rect x="-9" y="-4" width="18" height="12" rx="3" fill="#E7C699" ${OS(1)}/><path d="M-9,-4 Q0,-11 9,-4 V0 Q3,5 0,0 Q-5,4 -9,0 Z" fill="#F9D4DF" ${OS(1)}/><path d="M0,-5 V-12" stroke="#B08BA5" stroke-width="2"/><ellipse cx="0" cy="-14" rx="2" ry="3" fill="#ECC16B"/></g>`,

  home: (x, y) => `<path d="${heartPath(x, y - 1, 1.3)}" fill="#F06292" ${OS(1.2)}/>`,
  crepe: (x, y) => `<path d="M${x - 7},${y - 3} L${x},${y + 8} L${x + 7},${y - 3} Z" fill="#E2B982" ${OS(1.2)}/><circle cx="${x - 3}" cy="${y - 4}" r="3.5" fill="#FFF" ${OS(1)}/><circle cx="${x + 3}" cy="${y - 4}" r="3.5" fill="#FFF" ${OS(1)}/><circle cx="${x}" cy="${y - 7}" r="2.5" fill="#E8453C" ${OS(1)}/>`,
  dentist: (x, y) => `<path d="M${x - 6},${y - 6} C${x - 8},${y - 10} ${x - 2},${y - 10} ${x},${y - 7} C${x + 2},${y - 10} ${x + 8},${y - 10} ${x + 6},${y - 6} C${x + 5},${y} ${x + 5},${y + 7} ${x + 3},${y + 7} C${x + 1},${y + 7} ${x + 1},${y + 2} ${x},${y + 2} C${x - 1},${y + 2} ${x - 1},${y + 7} ${x - 3},${y + 7} C${x - 5},${y + 7} ${x - 5},${y} ${x - 6},${y - 6} Z" fill="#FFF" ${OS(1.2)}/>`,
  bakery: (x, y) => `<path d="M${x - 9},${y + 4} C${x - 10},${y - 6} ${x + 10},${y - 6} ${x + 9},${y + 4} Z" fill="#E6B566" ${OS(1.2)}/><path d="M${x - 4},${y - 3} L${x - 2},${y + 2} M${x + 1},${y - 4} L${x + 3},${y + 2}" stroke="#B9853E" stroke-width="1.4"/>`,
  florist: (x, y) => `<path d="M${x},${y + 8} L${x},${y}" stroke="#4E9A3E" stroke-width="1.8"/><path d="M${x - 5},${y - 6} L${x - 5},${y + 1} C${x - 3},${y + 3} ${x + 3},${y + 3} ${x + 5},${y + 1} L${x + 5},${y - 6} L${x + 2},${y - 3} L${x},${y - 7} L${x - 2},${y - 3} Z" fill="#E8453C" ${OS(1.2)}/>`,
  clothes: (x, y) => `<path d="M${x - 8},${y - 5} L${x - 3},${y - 7} C${x - 2},${y - 4} ${x + 2},${y - 4} ${x + 3},${y - 7} L${x + 8},${y - 5} L${x + 7},${y - 1} L${x + 5},${y - 2} L${x + 5},${y + 7} L${x - 5},${y + 7} L${x - 5},${y - 2} L${x - 7},${y - 1} Z" fill="#7EC8F0" ${OS(1.2)}/>`,
  furniture: (x, y) => `<rect x="${x - 9}" y="${y - 4}" width="18" height="8" rx="3" fill="#F48FB1" ${OS(1.2)}/><rect x="${x - 10}" y="${y - 1}" width="4" height="7" rx="2" fill="#F48FB1" ${OS(1.2)}/><rect x="${x + 6}" y="${y - 1}" width="4" height="7" rx="2" fill="#F48FB1" ${OS(1.2)}/>`,
  market: (x, y) => `<path d="M${x},${y - 4} C${x - 4},${y - 8} ${x - 9},${y - 5} ${x - 8},${y + 1} C${x - 7},${y + 6} ${x - 3},${y + 8} ${x},${y + 7} C${x + 3},${y + 8} ${x + 7},${y + 6} ${x + 8},${y + 1} C${x + 9},${y - 5} ${x + 4},${y - 8} ${x},${y - 4} Z" fill="#E8453C" ${OS(1.2)}/><path d="M${x},${y - 4} L${x + 2},${y - 8}" stroke="${INK}" stroke-width="1.4"/>`,
};
WorldArt.building = function (sp) {
  const W = sp.w * TS, H = sp.h * TS, top = 10;
  const roofH = Math.round(H * 0.56);
  const roof = sp.roof, wall = sp.wall || "#FFF4DC";
  const dk = shade(roof, -0.22), lt = shade(roof, 0.25);
  let s = `<ellipse cx="${W / 2}" cy="${H - 1}" rx="${W / 2 - 2}" ry="4" fill="${INK}" fill-opacity="0.12"/>`;
  // 壁
  s += `<rect x="4" y="${top + roofH - 8}" width="${W - 8}" height="${H - roofH + 6 - top}" fill="${wall}" ${OS()}/>`;
  s += `<rect x="4" y="${H - 8}" width="${W - 8}" height="6" fill="${shade(wall, -0.12)}" ${OS(1.2)}/>`;
  // 屋根
  if (sp.chimney) s += `<rect x="${W - 34}" y="${top - 2}" width="12" height="20" fill="#C98A52" ${OS()}/><rect x="${W - 36}" y="${top - 6}" width="16" height="6" rx="2" fill="#A8743F" ${OS()}/>`;
  s += `<path d="M0,${top + roofH} L10,${top} L${W - 10},${top} L${W},${top + roofH} Z" fill="${roof}" ${OS()}/>`;
  for (let y = top + 10; y < top + roofH - 2; y += 9) s += `<path d="M${3 + ((y - top) / roofH) * 7},${y} L${W - 3 - ((y - top) / roofH) * 7},${y}" stroke="${dk}" stroke-width="1.4"/>`;
  s += `<path d="M12,${top + 4} L${W - 12},${top + 4}" stroke="${lt}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M0,${top + roofH} L${W},${top + roofH}" ${OS(2)}/>`;
  // 窓
  const wy = top + roofH + 6;
  const dx = (sp.door + 0.5) * TS;
  const wins = [];
  for (let i = 0; i < sp.w; i++) if (Math.abs((i + 0.5) * TS - dx) > TS * 0.9) wins.push((i + 0.5) * TS);
  wins.forEach((x) => {
    s += `<rect x="${x - 8}" y="${wy}" width="16" height="14" rx="2" fill="#BFE6FF" ${OS(1.4)}/><path d="M${x},${wy} L${x},${wy + 14} M${x - 8},${wy + 7} L${x + 8},${wy + 7}" stroke="#FFF" stroke-width="1.6"/>`;
    if (sp.flowers) s += `<rect x="${x - 10}" y="${wy + 14}" width="20" height="4" rx="1" fill="#C98A52" ${OS(1)}/>${flowerSvg(x - 5, wy + 13, 1.8, "#F48FB1", "#FFE066", 0.8)}${flowerSvg(x + 5, wy + 13, 1.8, "#FFE066", "#F29A1F", 0.8)}`;
  });
  // ひさし
  if (sp.awning) {
    const ay = top + roofH - 2, aw = TS * 1.6;
    let st = "";
    for (let k = 0; k < 6; k++) st += `<path d="M${dx - aw / 2 + (k * aw) / 6},${ay} L${dx - aw / 2 + ((k + 1) * aw) / 6},${ay} L${dx - aw / 2 + ((k + 1) * aw) / 6},${ay + 8} Q${dx - aw / 2 + ((k + 0.5) * aw) / 6},${ay + 12} ${dx - aw / 2 + (k * aw) / 6},${ay + 8} Z" fill="${k % 2 ? sp.awning[1] : sp.awning[0]}" ${OS(1.2)}/>`;
    s += st;
  }
  // ドア
  const dh = 22, dw = 16;
  s += `<path d="M${dx - dw / 2},${H - 6} L${dx - dw / 2},${H - 6 - dh + 6} Q${dx},${H - 6 - dh - 4} ${dx + dw / 2},${H - 6 - dh + 6} L${dx + dw / 2},${H - 6} Z" fill="${sp.doorCol || "#A8743F"}" ${OS(1.6)}/><circle cx="${dx + 4}" cy="${H - 14}" r="1.6" fill="#F7C948"/>`;
  // かんばん
  if (sp.sign) {
    const sy = top + roofH * 0.46;
    s += `<rect x="${W / 2 - 16}" y="${sy - 11}" width="32" height="22" rx="6" fill="#FFF7E0" ${OS(1.6)}/>`;
    s += SIGN_ICON[sp.sign](W / 2, sy);
  }
  return { w: W, h: H + top, svg: s, top };
};

Art.worldSvg = function (kind, opt) {
  const o = kind === "building" ? WorldArt.building(opt) : WorldArt[kind](opt);
  return { ...o, full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${o.w + 4} ${o.h + 4}">${o.svg}</svg>` };
};
