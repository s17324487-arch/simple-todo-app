// 町の住人・てき・かぐ・アイコンのSVG（素材キャラと同じ線の太さ・色で描く）
const Art = {};
const SK = (w = 4.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
// 太い線の上に色の線を重ねる（しっぽ・ひげ等）
const outlineLine = (d, col, w = 9, iw = 4.5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${iw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const vbChar = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;

// ================= 町の住人（どうぶつ） =================
const NPC_PROFILE = {
  torsoPath: "M78,130 C72,148 71,172 75,188 C81,199 119,199 125,188 C129,172 128,148 122,130 Z",
  arms: [
    { cx: 72, cy: 156, rx: 8, ry: 13, rot: 28 },
    { cx: 128, cy: 156, rx: 8, ry: 13, rot: -28 },
  ],
  a: {
    hat: { x: 100, y: 44, w: 88 },
    eyes: { x: 100, y: 90, gap: 36 },
    cheek: { y: 104, gap: 60 },
    mouth: { x: 100, y: 110 },
    neck: { x: 100, y: 137, w: 54 },
    torso: { top: 130, bottom: 197, cx: 100, w: 56 },
    back: { x: 100, y: 148, w: 58 },
  },
  faceShift: 12,
};
function npcEyes(emo, y = 90, gap = 36) {
  const l = 100 - gap / 2, r = 100 + gap / 2;
  switch (emo) {
    case "happy":
      return `<path d="M${l - 7},${y + 2} Q${l},${y - 7} ${l + 7},${y + 2} M${r - 7},${y + 2} Q${r},${y - 7} ${r + 7},${y + 2}" fill="none" ${SK(3.5)}/>`;
    case "sad":
      return `<circle cx="${l}" cy="${y}" r="4" fill="${INK}"/><circle cx="${r}" cy="${y}" r="4" fill="${INK}"/><path d="M${l - 2},${y + 8} q-4,8 0,12 q4,-4 0,-12 Z M${r + 2},${y + 8} q-4,8 0,12 q4,-4 0,-12 Z" fill="#4FA3E0"/>`;
    case "surprise":
      return `<circle cx="${l}" cy="${y}" r="7.5" fill="#FFF" ${SK(3)}/><circle cx="${l}" cy="${y + 1}" r="3.2" fill="${INK}"/><circle cx="${r}" cy="${y}" r="7.5" fill="#FFF" ${SK(3)}/><circle cx="${r}" cy="${y + 1}" r="3.2" fill="${INK}"/>`;
    case "angry":
      return `<circle cx="${l}" cy="${y + 1}" r="4" fill="${INK}"/><circle cx="${r}" cy="${y + 1}" r="4" fill="${INK}"/><path d="M${l - 9},${y - 12} L${l + 6},${y - 7} M${r + 9},${y - 12} L${r - 6},${y - 7}" ${SK(3.5)}/>`;
    case "sleep":
      return `<path d="M${l - 7},${y} L${l + 7},${y} M${r - 7},${y} L${r + 7},${y}" ${SK(3.5)}/>`;
    default:
      return `<circle cx="${l}" cy="${y}" r="4" fill="${INK}"/><circle cx="${r}" cy="${y}" r="4" fill="${INK}"/>`;
  }
}
const SPECIES = {
  cat: {
    name: "ねこ", col: "#F5C07A", col2: "#FFFFFF",
    back: (c) => `<path d="M124,184 C152,182 156,150 144,140" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M124,184 C152,182 156,150 144,140" fill="none" stroke="${c.col}" stroke-width="7" stroke-linecap="round"/>`,
    ears: (c) => `<path d="M56,62 L58,20 L92,42 Z" fill="${c.col}" ${SK()}/><path d="M144,62 L142,20 L108,42 Z" fill="${c.col}" ${SK()}/><path d="M64,50 L65,31 L80,42 Z" fill="#F8A5C2"/><path d="M136,50 L135,31 L120,42 Z" fill="#F8A5C2"/>`,
    head: (c) => `<circle cx="100" cy="86" r="55" fill="${c.col}" ${SK()}/>` + (c.stripe ? `<path d="M88,33 L92,48 M100,31 L100,48 M112,33 L108,48" ${SK(4)}/>` : ""),
    face: (c, emo) => npcEyes(emo) + `<path d="M96,99 L104,99 L100,104 Z" fill="#F48FB1" ${SK(2.5)}/><path d="M90,106 Q95,112 100,106 Q105,112 110,106" fill="none" ${SK(3)}/><path d="M66,100 L48,96 M66,106 L48,108 M134,100 L152,96 M134,106 L152,108" ${SK(2.5)}/>`,
  },
  rabbit: {
    name: "うさぎ", col: "#FFFFFF", col2: "#F8A5C2",
    back: (c) => `<circle cx="124" cy="184" r="10" fill="${c.col}" ${SK()}/>`,
    ears: (c) => `<ellipse cx="78" cy="12" rx="14" ry="36" transform="rotate(-10 78 12)" fill="${c.col}" ${SK()}/><ellipse cx="78" cy="14" rx="6" ry="24" transform="rotate(-10 78 14)" fill="#F8A5C2"/><ellipse cx="122" cy="12" rx="14" ry="36" transform="rotate(10 122 12)" fill="${c.col}" ${SK()}/><ellipse cx="122" cy="14" rx="6" ry="24" transform="rotate(10 122 14)" fill="#F8A5C2"/>`,
    head: (c) => `<circle cx="100" cy="88" r="54" fill="${c.col}" ${SK()}/>`,
    face: (c, emo) => npcEyes(emo) + `<ellipse cx="100" cy="100" rx="4.5" ry="3.5" fill="#F48FB1"/><path d="M100,103 L94,110 M100,103 L106,110" ${SK(3)}/><ellipse cx="70" cy="104" rx="8" ry="5" fill="#F8A5C2" fill-opacity="0.8"/><ellipse cx="130" cy="104" rx="8" ry="5" fill="#F8A5C2" fill-opacity="0.8"/>`,
  },
  bear: {
    name: "くま", col: "#B98555", col2: "#F2D9B8",
    back: () => "",
    ears: (c) => `<circle cx="56" cy="44" r="17" fill="${c.col}" ${SK()}/><circle cx="56" cy="44" r="8" fill="${c.col2}" ${SK(3)}/><circle cx="144" cy="44" r="17" fill="${c.col}" ${SK()}/><circle cx="144" cy="44" r="8" fill="${c.col2}" ${SK(3)}/>`,
    head: (c) => `<circle cx="100" cy="88" r="56" fill="${c.col}" ${SK()}/><ellipse cx="100" cy="106" rx="22" ry="16" fill="${c.col2}" ${SK(3.5)}/>`,
    face: (c, emo) => npcEyes(emo, 86, 40) + `<ellipse cx="100" cy="100" rx="7" ry="5" fill="${INK}"/><path d="M100,104 L100,110 M100,110 Q94,116 90,111 M100,110 Q106,116 110,111" fill="none" ${SK(3)}/>`,
  },
  penguin: {
    name: "ぺんぎん", col: "#3E4E72", col2: "#FFFFFF", feet: "#F29A1F", noArms: true,
    back: () => "",
    ears: () => "",
    head: (c) => `<circle cx="100" cy="88" r="56" fill="${c.col}" ${SK()}/><path d="M100,62 C84,48 58,58 58,86 C58,118 80,134 100,134 C120,134 142,118 142,86 C142,58 116,48 100,62 Z" fill="${c.col2}" ${SK(3.5)}/>`,
    face: (c, emo) => npcEyes(emo, 88, 34) + `<path d="M90,100 L110,100 L100,113 Z" fill="#F29A1F" ${SK(3)}/><ellipse cx="72" cy="106" rx="8" ry="5" fill="#F8A5C2" fill-opacity="0.8"/><ellipse cx="128" cy="106" rx="8" ry="5" fill="#F8A5C2" fill-opacity="0.8"/>`,
    body: (c) => `<ellipse cx="66" cy="160" rx="9" ry="20" transform="rotate(20 66 160)" fill="${c.col}" ${SK()}/><ellipse cx="134" cy="160" rx="9" ry="20" transform="rotate(-20 134 160)" fill="${c.col}" ${SK()}/>`,
  },
  frog: {
    name: "かえる", col: "#8BCB6B", col2: "#FFFFFF",
    back: () => "",
    ears: (c) => `<circle cx="70" cy="50" r="18" fill="${c.col}" ${SK()}/><circle cx="130" cy="50" r="18" fill="${c.col}" ${SK()}/>`,
    head: (c) => `<ellipse cx="100" cy="94" rx="62" ry="46" fill="${c.col}" ${SK()}/><circle cx="70" cy="50" r="11" fill="#FFF" ${SK(3)}/><circle cx="130" cy="50" r="11" fill="#FFF" ${SK(3)}/>`,
    face: (c, emo) => {
      const e = emo === "happy" ? `<path d="M63,52 Q70,44 77,52 M123,52 Q130,44 137,52" fill="none" ${SK(3.5)}/>` : emo === "sleep" ? `<path d="M63,50 L77,50 M123,50 L137,50" ${SK(3.5)}/>` : `<circle cx="71" cy="51" r="4.5" fill="${INK}"/><circle cx="129" cy="51" r="4.5" fill="${INK}"/>`;
      const tears = emo === "sad" ? `<path d="M66,64 q-4,8 0,12 q4,-4 0,-12 Z M134,64 q-4,8 0,12 q4,-4 0,-12 Z" fill="#4FA3E0"/>` : "";
      return e + tears + `<path d="M70,104 Q100,124 130,104" fill="none" ${SK(3.5)}/><ellipse cx="62" cy="100" rx="9" ry="6" fill="#F8A5C2" fill-opacity="0.85"/><ellipse cx="138" cy="100" rx="9" ry="6" fill="#F8A5C2" fill-opacity="0.85"/>`;
    },
  },
  sheep: {
    name: "ひつじ", col: "#FFFFFF", col2: "#F6D9B6",
    back: () => "",
    ears: (c) => `<ellipse cx="46" cy="92" rx="16" ry="8" transform="rotate(-20 46 92)" fill="${c.col2}" ${SK()}/><ellipse cx="154" cy="92" rx="16" ry="8" transform="rotate(20 154 92)" fill="${c.col2}" ${SK()}/>`,
    head: (c) => {
      let d = "";
      const n = 12, R = 58;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + Math.cos(a) * R, y = 86 + Math.sin(a) * R;
        d += (i ? ` A12,12 0 0 1 ` : `M`) + f2(x) + "," + f2(y);
      }
      return `<path d="${d} Z" fill="${c.col}" ${SK()}/><ellipse cx="100" cy="98" rx="36" ry="38" fill="${c.col2}" ${SK(3.5)}/>`;
    },
    face: (c, emo) => npcEyes(emo, 96, 30) + `<path d="M96,110 L104,110 L100,114 Z" fill="${INK}"/><path d="M100,114 L100,118 M100,118 Q95,122 92,119 M100,118 Q105,122 108,119" fill="none" ${SK(2.5)}/>`,
  },
  mouse: {
    name: "ねずみ", col: "#B9B4C4", col2: "#F8A5C2",
    back: (c) => `<path d="M124,186 C150,190 160,172 150,160" fill="none" ${SK(4)}/>`,
    ears: (c) => `<circle cx="50" cy="46" r="24" fill="${c.col}" ${SK()}/><circle cx="50" cy="46" r="13" fill="${c.col2}"/><circle cx="150" cy="46" r="24" fill="${c.col}" ${SK()}/><circle cx="150" cy="46" r="13" fill="${c.col2}"/>`,
    head: (c) => `<circle cx="100" cy="90" r="52" fill="${c.col}" ${SK()}/>`,
    face: (c, emo) => npcEyes(emo, 90, 34) + `<circle cx="100" cy="104" r="5" fill="#F48FB1" ${SK(2.5)}/><path d="M72,104 L52,100 M72,110 L52,112 M128,104 L148,100 M128,110 L148,112" ${SK(2.5)}/>`,
  },
  pig: {
    name: "ぶた", col: "#F8B9C6", col2: "#F48FB1",
    back: (c) => `<path d="M124,182 c10,-2 14,-10 8,-14 c-6,-2 -8,6 -2,8 c6,2 12,-2 14,-8" fill="none" ${SK(3.5)}/>`,
    ears: (c) => `<path d="M56,58 L52,28 L82,40 Z" fill="${c.col}" ${SK()}/><path d="M144,58 L148,28 L118,40 Z" fill="${c.col}" ${SK()}/>`,
    head: (c) => `<circle cx="100" cy="88" r="55" fill="${c.col}" ${SK()}/>`,
    face: (c, emo) => npcEyes(emo, 84, 40) + `<ellipse cx="100" cy="104" rx="17" ry="12" fill="${c.col2}" ${SK(3.5)}/><ellipse cx="94" cy="104" rx="3" ry="4.5" fill="${INK}"/><ellipse cx="106" cy="104" rx="3" ry="4.5" fill="${INK}"/>`,
  },
};

// spec: { sp, col, col2, emo, dir, pose, outfit:{slot: itemId}, stripe }
Art.npcSvg = function (spec) {
  const S = SPECIES[spec.sp] || SPECIES.cat;
  const c = { col: spec.col || S.col, col2: spec.col2 || S.col2, stripe: spec.stripe };
  const dir = spec.dir || "down";
  const view = dir === "up" ? "back" : dir === "down" ? "front" : "side";
  const tr = CHARA_DATA.wanko.poses[spec.pose || "idle_01"] || CHARA_DATA.wanko.poses.idle_01;
  const uid = "n" + ++buildCharaSvg.n;
  const ctx = { p: NPC_PROFILE, a: NPC_PROFILE.a, view, dx: view === "side" ? -NPC_PROFILE.faceShift : 0, col: [], uid };
  const L = { behind: "", sleeve: "", torso: "", top: "" };
  const outfit = spec.outfit || {};
  for (const slot of SLOT_ORDER) {
    const it = outfit[slot] && ITEM_INDEX[outfit[slot]];
    if (!it || !WEAR[it.wear]) continue;
    ctx.col = it.col || [];
    const r = WEAR[it.wear](ctx);
    for (const k in r) if (r[k]) L[k] += r[k];
  }
  const feetCol = S.feet || c.col;
  const feet = [
    `<g transform="${tr[0]}"><ellipse cx="87" cy="199" rx="11" ry="9" fill="${feetCol}" ${SK()}/></g>`,
    `<g transform="${tr[1]}"><ellipse cx="113" cy="199" rx="11" ry="9" fill="${feetCol}" ${SK()}/></g>`,
  ].join("");
  const arms = S.noArms ? "" : NPC_PROFILE.arms.map((a) => `<ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" transform="rotate(${a.rot} ${a.cx} ${a.cy})" fill="${c.col}" ${SK()}/>`).join("");
  const belly = spec.sp === "penguin" ? `<ellipse cx="100" cy="166" rx="18" ry="24" fill="#FFFFFF" ${SK(3)}/>` : "";
  let body = (view === "back" ? "" : S.back(c)) + arms + L.sleeve + (S.body ? S.body(c) : "") + `<path d="${NPC_PROFILE.torsoPath}" fill="${c.col}" ${SK()}/>` + belly + L.torso;
  let head = S.ears(c) + S.head(c);
  if (view !== "back") {
    let face = S.face(c, spec.emo || "normal");
    if (ctx.dx) face = `<g transform="translate(${ctx.dx},0)">${face}</g>`;
    head += face;
  } else if (S.back(c)) head += `<g transform="translate(-24,-4)">${S.back(c)}</g>`;
  let inner = `<g transform="${tr[2]}">${L.behind}</g>${feet}<g transform="${tr[2]}">${body}${head}${L.top}</g>`;
  if (dir === "right") inner = `<g transform="matrix(-1,0,0,1,200,0)">${inner}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbChar}"><defs><clipPath id="torso${uid}"><path d="${NPC_PROFILE.torsoPath}"/></clipPath></defs>${inner}</svg>`;
};

// ================= てき =================
function enemyFace(emo, x, y, gap = 30, big = false) {
  const l = x - gap / 2, r = x + gap / 2, s = big ? 1.4 : 1;
  if (emo === "hurt") return `<path d="M${l - 7 * s},${y - 6 * s} L${l + 5 * s},${y} L${l - 7 * s},${y + 6 * s} M${r + 7 * s},${y - 6 * s} L${r - 5 * s},${y} L${r + 7 * s},${y + 6 * s}" fill="none" ${SK(4)}/>`;
  if (emo === "sleep") return `<path d="M${l - 7 * s},${y} Q${l},${y + 6 * s} ${l + 7 * s},${y} M${r - 7 * s},${y} Q${r},${y + 6 * s} ${r + 7 * s},${y}" fill="none" ${SK(4)}/>`;
  if (emo === "angry") return `<ellipse cx="${l}" cy="${y}" rx="${5 * s}" ry="${7 * s}" fill="${INK}"/><ellipse cx="${r}" cy="${y}" rx="${5 * s}" ry="${7 * s}" fill="${INK}"/><path d="M${l - 10 * s},${y - 14 * s} L${l + 6 * s},${y - 8 * s} M${r + 10 * s},${y - 14 * s} L${r - 6 * s},${y - 8 * s}" ${SK(4)}/>`;
  return `<ellipse cx="${l}" cy="${y}" rx="${5 * s}" ry="${7 * s}" fill="${INK}"/><ellipse cx="${r}" cy="${y}" rx="${5 * s}" ry="${7 * s}" fill="${INK}"/><circle cx="${l + 1.5 * s}" cy="${y - 3 * s}" r="${1.8 * s}" fill="#FFF"/><circle cx="${r + 1.5 * s}" cy="${y - 3 * s}" r="${1.8 * s}" fill="#FFF"/>`;
}
const ENEMY_ART = {
  slime: (col, emo) => `<ellipse cx="100" cy="206" rx="64" ry="7" fill="${INK}" fill-opacity="0.12"/>
    <path d="M100,78 C122,78 166,132 170,166 C174,196 150,206 100,206 C50,206 26,196 30,166 C34,132 78,78 100,78 Z" fill="${col}" ${SK()}/>
    <path d="M66,128 C74,112 84,102 92,98" fill="none" stroke="#FFF" stroke-width="7" stroke-linecap="round" stroke-opacity="0.8"/>
    ${enemyFace(emo, 100, 156, 40)}
    ${emo === "hurt" ? "" : `<path d="M92,176 Q100,183 108,176" fill="none" ${SK(3.5)}/>`}
    <ellipse cx="70" cy="174" rx="8" ry="5" fill="#F48FB1" fill-opacity="0.6"/><ellipse cx="130" cy="174" rx="8" ry="5" fill="#F48FB1" fill-opacity="0.6"/>`,
  slime_king: (col, emo) => ENEMY_ART.slime(col, emo).replace('M100,78 C122,78 166,132 170,166', "M100,78 C122,78 166,132 170,166") +
    `<path d="M68,86 L64,48 L84,66 L100,40 L116,66 L136,48 L132,86 C112,92 88,92 68,86 Z" fill="#F7C948" ${SK()}/>
    <circle cx="100" cy="64" r="6" fill="#E8262A" ${SK(3)}/><circle cx="64" cy="46" r="4" fill="#FFF" ${SK(2.5)}/><circle cx="136" cy="46" r="4" fill="#FFF" ${SK(2.5)}/>
    <path d="M84,188 C90,178 110,178 116,188" fill="none" ${SK(3)}/>
    <path d="M78,184 C70,176 64,184 72,188 M122,184 C130,176 136,184 128,188" fill="#6B4A2B" ${SK(3)}/>`,
  fluff: (col, emo) => {
    let d = "";
    const n = 14, R = 56, cx = 100, cy = 146;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.92;
      d += (i ? ` A13,13 0 0 1 ` : `M`) + f2(x) + "," + f2(y);
    }
    return `<ellipse cx="100" cy="206" rx="50" ry="6" fill="${INK}" fill-opacity="0.12"/>
      <ellipse cx="82" cy="200" rx="10" ry="7" fill="${col}" ${SK()}/><ellipse cx="118" cy="200" rx="10" ry="7" fill="${col}" ${SK()}/>
      <path d="${d} Z" fill="${col}" ${SK()}/>${enemyFace(emo, 100, 142, 34)}
      <ellipse cx="74" cy="160" rx="9" ry="5" fill="#F06292" fill-opacity="0.5"/><ellipse cx="126" cy="160" rx="9" ry="5" fill="#F06292" fill-opacity="0.5"/>
      ${emo === "hurt" ? "" : `<path d="M95,160 Q100,165 105,160" fill="none" ${SK(3)}/>`}`;
  },
  bee: (col, emo) => `<ellipse cx="100" cy="206" rx="40" ry="6" fill="${INK}" fill-opacity="0.12"/>
    <ellipse cx="72" cy="92" rx="22" ry="30" transform="rotate(-30 72 92)" fill="#E3F4FF" fill-opacity="0.9" ${SK()}/>
    <ellipse cx="128" cy="92" rx="22" ry="30" transform="rotate(30 128 92)" fill="#E3F4FF" fill-opacity="0.9" ${SK()}/>
    <path d="M100,196 L94,208 L106,208 Z" fill="${INK}"/>
    <ellipse cx="100" cy="146" rx="50" ry="52" fill="${col}" ${SK()}/>
    <path d="M56,160 C80,170 120,170 144,160 L140,176 C120,184 80,184 60,176 Z" fill="${INK}"/>
    <path d="M52,130 C80,136 120,136 148,130" fill="none" stroke="${INK}" stroke-width="9"/>
    <path d="M84,98 C78,80 70,70 62,66 M116,98 C122,80 130,70 138,66" fill="none" ${SK(4)}/><circle cx="62" cy="66" r="6" fill="${INK}"/><circle cx="138" cy="66" r="6" fill="${INK}"/>
    ${enemyFace(emo, 100, 116, 36)}`,
  mushroom: (col, emo) => `<ellipse cx="100" cy="206" rx="50" ry="6" fill="${INK}" fill-opacity="0.12"/>
    <ellipse cx="84" cy="200" rx="11" ry="7" fill="#F3E3C3" ${SK()}/><ellipse cx="116" cy="200" rx="11" ry="7" fill="#F3E3C3" ${SK()}/>
    <path d="M70,120 C64,150 66,184 76,196 C90,202 110,202 124,196 C134,184 136,150 130,120 Z" fill="#F3E3C3" ${SK()}/>
    <path d="M30,122 C30,72 64,48 100,48 C136,48 170,72 170,122 C140,132 60,132 30,122 Z" fill="${col}" ${SK()}/>
    <circle cx="70" cy="90" r="12" fill="#FFF" ${SK(3)}/><circle cx="118" cy="76" r="9" fill="#FFF" ${SK(3)}/><circle cx="142" cy="104" r="8" fill="#FFF" ${SK(3)}/><circle cx="96" cy="108" r="7" fill="#FFF" ${SK(3)}/>
    ${enemyFace(emo, 100, 156, 28)}${emo === "hurt" ? "" : `<path d="M94,172 Q100,177 106,172" fill="none" ${SK(3)}/>`}`,
  acorn: (col, emo) => `<ellipse cx="100" cy="206" rx="46" ry="6" fill="${INK}" fill-opacity="0.12"/>
    <ellipse cx="86" cy="200" rx="10" ry="7" fill="${col}" ${SK()}/><ellipse cx="114" cy="200" rx="10" ry="7" fill="${col}" ${SK()}/>
    <ellipse cx="60" cy="150" rx="8" ry="12" transform="rotate(30 60 150)" fill="${col}" ${SK()}/><ellipse cx="140" cy="150" rx="8" ry="12" transform="rotate(-30 140 150)" fill="${col}" ${SK()}/>
    <path d="M58,110 C54,160 74,198 100,198 C126,198 146,160 142,110 Z" fill="${col}" ${SK()}/>
    <path d="M50,112 C50,76 74,62 100,62 C126,62 150,76 150,112 C120,122 80,122 50,112 Z" fill="#7A5230" ${SK()}/>
    <path d="M64,96 L136,96 M60,106 L140,106 M72,84 L128,84" stroke="#5E3F24" stroke-width="3"/>
    <path d="M100,62 C100,52 104,44 112,40" fill="none" ${SK(5)}/>
    ${enemyFace(emo, 100, 146, 30)}${emo === "hurt" ? "" : `<path d="M92,164 L100,160 L108,164" fill="none" ${SK(3)}/>`}`,
  leaf: (col, emo) => `<ellipse cx="100" cy="206" rx="46" ry="6" fill="${INK}" fill-opacity="0.12"/>
    <ellipse cx="86" cy="200" rx="10" ry="7" fill="${shade(col, -0.2)}" ${SK()}/><ellipse cx="114" cy="200" rx="10" ry="7" fill="${shade(col, -0.2)}" ${SK()}/>
    <path d="M100,56 C150,80 160,140 140,176 C126,196 74,196 60,176 C40,140 50,80 100,56 Z" fill="${col}" ${SK()}/>
    <path d="M100,70 L100,186 M100,110 L78,96 M100,110 L122,96 M100,146 L74,132 M100,146 L126,132" fill="none" stroke="${shade(col, -0.25)}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M100,58 C96,44 104,34 116,32 C116,44 110,52 100,58 Z" fill="${shade(col, 0.2)}" ${SK(3.5)}/>
    <ellipse cx="100" cy="134" rx="30" ry="22" fill="${shade(col, 0.35)}" ${SK(3)}/>${enemyFace(emo, 100, 132, 26)}`,
  bat: (col, emo) => `<ellipse cx="100" cy="206" rx="40" ry="6" fill="${INK}" fill-opacity="0.12"/>
    <path d="M70,120 C44,90 14,96 4,112 C18,114 22,124 20,134 C34,128 44,136 44,148 C54,140 66,142 74,150 Z" fill="${shade(col, -0.15)}" ${SK()}/>
    <path d="M130,120 C156,90 186,96 196,112 C182,114 178,124 180,134 C166,128 156,136 156,148 C146,140 134,142 126,150 Z" fill="${shade(col, -0.15)}" ${SK()}/>
    <path d="M72,92 L66,56 L90,78 Z M128,92 L134,56 L110,78 Z" fill="${col}" ${SK()}/>
    <circle cx="100" cy="128" r="44" fill="${col}" ${SK()}/>
    ${enemyFace(emo, 100, 120, 32)}
    <path d="M88,142 L92,152 L96,142 M104,142 L108,152 L112,142" fill="#FFF" ${SK(2.5)}/>`,
  rock: (col, emo) => `<ellipse cx="100" cy="206" rx="66" ry="7" fill="${INK}" fill-opacity="0.12"/>
    <path d="M40,196 L30,150 L50,104 L86,82 L128,86 L160,112 L172,156 L160,198 Z" fill="${col}" ${SK()}/>
    <path d="M60,112 L74,126 L70,142 M148,150 L134,160 L138,176" fill="none" stroke="${shade(col, -0.3)}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M50,104 L86,82 L128,86 L112,96 L70,104 Z" fill="${shade(col, 0.25)}"/>
    ${enemyFace(emo === "normal" ? "angry" : emo, 100, 146, 36)}
    ${emo === "hurt" ? "" : `<path d="M88,172 L112,172" fill="none" ${SK(4)}/>`}`,
  crystal: (col, emo) => `<ellipse cx="100" cy="206" rx="56" ry="7" fill="${INK}" fill-opacity="0.12"/>
    <path d="M44,200 L40,150 L54,132 L68,150 L66,200 Z" fill="${shade(col, 0.2)}" ${SK()}/>
    <path d="M156,200 L160,158 L146,140 L132,158 L134,200 Z" fill="${shade(col, 0.2)}" ${SK()}/>
    <path d="M66,202 L64,110 L100,62 L136,110 L134,202 Z" fill="${col}" ${SK()}/>
    <path d="M100,62 L100,202 M64,110 L100,126 L136,110" fill="none" stroke="${shade(col, 0.45)}" stroke-width="3"/>
    <path d="M78,120 L78,150" stroke="#FFF" stroke-width="6" stroke-linecap="round" stroke-opacity="0.8"/>
    ${enemyFace(emo, 100, 156, 28)}
    <path d="${starPath(150, 92, 9, 3.5, 4)}" fill="#FFF" ${SK(2)}/><path d="${starPath(48, 116, 7, 3, 4)}" fill="#FFF" ${SK(2)}/>`,
};
Art.enemySvg = function (kind, col, emo = "normal") {
  const f = ENEMY_ART[kind] || ENEMY_ART.slime;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbChar}">${f(col, emo)}</svg>`;
};

// ================= かぐ（論理px座標、viewBox 0 0 w h） =================
const FS = (w = 2.2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FURN_ART = {
  bed_simple: () => `<rect x="4" y="10" width="14" height="60" rx="5" fill="#C98A52" ${FS()}/>
    <rect x="10" y="34" width="90" height="30" rx="8" fill="#FFFFFF" ${FS()}/>
    <path d="M40,34 L96,34 C100,34 100,40 100,44 L100,60 C100,64 96,66 92,66 L40,66 Z" fill="#8FC6F0" ${FS()}/>
    <path d="M48,44 L92,44 M48,54 L92,54" stroke="#6FA8D8" stroke-width="2"/>
    <rect x="14" y="26" width="26" height="16" rx="7" fill="#FFFFFF" ${FS()}/>
    <rect x="8" y="62" width="94" height="10" rx="3" fill="#B97A45" ${FS()}/>
    <rect x="94" y="40" width="8" height="32" rx="3" fill="#C98A52" ${FS()}/>`,
  bed_royal: () => `<path d="M6,34 L6,8 C20,0 34,0 44,12 C54,0 70,0 76,10 C84,0 102,0 112,8 L112,34 Z" fill="#F8C8DC" ${FS()}/>
    <path d="M6,8 C30,40 88,40 112,8" fill="none" stroke="#F48FB1" stroke-width="3"/>
    <rect x="4" y="18" width="12" height="82" rx="4" fill="#F7C948" ${FS()}/><rect x="102" y="18" width="12" height="82" rx="4" fill="#F7C948" ${FS()}/>
    <rect x="12" y="56" width="94" height="32" rx="8" fill="#FFF" ${FS()}/>
    <path d="M40,56 L102,56 C106,56 106,62 106,66 L106,84 L40,88 Z" fill="#F48FB1" ${FS()}/>
    <path d="${heartPath(72, 72, 1.6)}" fill="#FFF"/>
    <rect x="16" y="48" width="26" height="16" rx="7" fill="#FFF" ${FS()}/>
    <rect x="8" y="86" width="102" height="12" rx="4" fill="#F7C948" ${FS()}/>
    <circle cx="10" cy="16" r="5" fill="#FFF" ${FS(2)}/><circle cx="108" cy="16" r="5" fill="#FFF" ${FS(2)}/>`,
  table_wood: () => `<rect x="8" y="20" width="8" height="28" rx="2" fill="#B97A45" ${FS()}/><rect x="60" y="20" width="8" height="28" rx="2" fill="#B97A45" ${FS()}/>
    <rect x="2" y="12" width="72" height="12" rx="4" fill="#D9A066" ${FS()}/>
    <path d="M28,12 L28,4 C28,0 40,0 40,4 L40,12" fill="#FFF" ${FS(2)}/><path d="M50,12 C50,6 58,6 58,12" fill="#E35D5B" ${FS(2)}/>`,
  chair_wood: () => `<rect x="6" y="2" width="22" height="26" rx="6" fill="#D9A066" ${FS()}/><rect x="11" y="8" width="12" height="12" rx="3" fill="#C98A52"/>
    <rect x="3" y="26" width="28" height="8" rx="3" fill="#D9A066" ${FS()}/>
    <rect x="6" y="33" width="5" height="18" rx="2" fill="#B97A45" ${FS(2)}/><rect x="23" y="33" width="5" height="18" rx="2" fill="#B97A45" ${FS(2)}/>`,
  sofa: () => `<rect x="10" y="8" width="84" height="30" rx="12" fill="#F48FB1" ${FS()}/>
    <rect x="4" y="30" width="96" height="22" rx="8" fill="#F8A5C2" ${FS()}/>
    <rect x="2" y="22" width="16" height="32" rx="8" fill="#F48FB1" ${FS()}/><rect x="86" y="22" width="16" height="32" rx="8" fill="#F48FB1" ${FS()}/>
    <path d="M52,32 L52,50" stroke="#E07A9C" stroke-width="2"/>
    <rect x="12" y="52" width="6" height="8" rx="2" fill="#8B5A33" ${FS(2)}/><rect x="86" y="52" width="6" height="8" rx="2" fill="#8B5A33" ${FS(2)}/>
    <circle cx="30" cy="22" r="6" fill="#FFF" ${FS(2)}/>`,
  bookshelf: () => `<rect x="2" y="2" width="58" height="88" rx="4" fill="#B97A45" ${FS()}/>
    <rect x="7" y="8" width="48" height="22" fill="#8B5A33"/><rect x="7" y="36" width="48" height="22" fill="#8B5A33"/><rect x="7" y="64" width="48" height="20" fill="#8B5A33"/>
    ${["#E35D5B", "#7EC8F0", "#FFD54F", "#8BCB6B", "#B388FF", "#F48FB1"].map((c, i) => `<rect x="${9 + i * 7.5}" y="${12 + (i % 2) * 3}" width="6" height="${18 - (i % 2) * 3}" rx="1" fill="${c}" ${FS(1.4)}/>`).join("")}
    ${["#8BCB6B", "#FFD54F", "#E35D5B", "#7EC8F0"].map((c, i) => `<rect x="${9 + i * 8}" y="${40 + (i % 2) * 2}" width="7" height="${18 - (i % 2) * 2}" rx="1" fill="${c}" ${FS(1.4)}/>`).join("")}
    <path d="M42,58 L50,40 L54,42 L46,58 Z" fill="#F48FB1" ${FS(1.4)}/>
    <circle cx="20" cy="75" r="7" fill="#FFD54F" ${FS(1.6)}/><rect x="36" y="68" width="14" height="16" rx="3" fill="#FFF" ${FS(1.6)}/>`,
  tv: () => `<rect x="8" y="46" width="54" height="24" rx="4" fill="#B97A45" ${FS()}/><circle cx="35" cy="58" r="3" fill="#8B5A33"/>
    <rect x="2" y="4" width="66" height="44" rx="8" fill="#5B6275" ${FS()}/>
    <rect x="8" y="10" width="54" height="32" rx="5" fill="#9FD3F5" ${FS(2)}/>
    <path d="M14,34 C22,24 30,30 38,22 C44,16 52,22 56,18 L56,36 L14,36 Z" fill="#8BCB6B"/>
    <circle cx="48" cy="18" r="4" fill="#FFD54F"/>
    <path d="M28,4 L20,-6 M42,4 L50,-6" ${FS(2)}/>`,
  plant: () => `<path d="M20,40 C4,34 2,16 10,8 C16,18 18,26 20,40 Z" fill="#6DBE5B" ${FS()}/>
    <path d="M20,40 C36,34 38,14 30,4 C24,16 22,26 20,40 Z" fill="#8BCB6B" ${FS()}/>
    <path d="M20,42 C8,44 0,34 2,26 C10,30 16,34 20,42 Z" fill="#8BCB6B" ${FS()}/>
    <path d="M20,42 C32,46 40,36 38,28 C30,32 24,36 20,42 Z" fill="#6DBE5B" ${FS()}/>
    <path d="M8,44 L32,44 L28,68 L12,68 Z" fill="#E88D5A" ${FS()}/><rect x="6" y="42" width="28" height="7" rx="2" fill="#D9774A" ${FS()}/>`,
  lamp: () => `<path d="M6,22 L10,2 L24,2 L28,22 Z" fill="#FFE9A8" ${FS()}/><path d="M17,22 L17,80" ${FS(3)}/>
    <ellipse cx="17" cy="82" rx="12" ry="4" fill="#8B5A33" ${FS()}/><circle cx="17" cy="12" r="3" fill="#FFF6C8"/>`,
  toybox: () => `<rect x="2" y="12" width="56" height="30" rx="4" fill="#7EC8F0" ${FS()}/>
    <rect x="0" y="8" width="60" height="8" rx="3" fill="#5BA8DA" ${FS()}/>
    <path d="${starPath(30, 28, 8, 3.5)}" fill="#FFD54F" ${FS(1.6)}/>
    <circle cx="14" cy="6" r="6" fill="#E35D5B" ${FS(2)}/><rect x="36" y="-2" width="12" height="11" rx="2" fill="#8BCB6B" ${FS(2)}/>`,
  piano: () => `<rect x="4" y="4" width="92" height="56" rx="6" fill="#3A3A48" ${FS()}/>
    <rect x="2" y="44" width="96" height="14" rx="3" fill="#FFF" ${FS()}/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${10 + i * 8},44 L${10 + i * 8},58" stroke="${INK}" stroke-width="1.2"/>`).join("")}
    ${[0, 1, 3, 4, 5, 7, 8].map((i) => `<rect x="${12 + i * 8}" y="44" width="4" height="8" fill="${INK}"/>`).join("")}
    <rect x="8" y="58" width="6" height="24" rx="2" fill="#3A3A48" ${FS()}/><rect x="86" y="58" width="6" height="24" rx="2" fill="#3A3A48" ${FS()}/>
    <path d="M30,14 C30,10 38,10 38,14 L38,28 M60,18 C60,14 68,14 68,18 L68,30" fill="none" stroke="#FFF" stroke-width="2"/><circle cx="35" cy="28" r="3" fill="#FFF"/><circle cx="65" cy="30" r="3" fill="#FFF"/>`,
  kotatsu: () => `<path d="M8,20 L88,20 L94,50 L2,50 Z" fill="#F29A7E" ${FS()}/>
    <path d="M8,20 C30,28 66,28 88,20" fill="none" stroke="#E07A62" stroke-width="2"/>
    <path d="M14,34 L82,34 M10,42 L86,42" stroke="#FFE0B0" stroke-width="3"/>
    <rect x="4" y="12" width="88" height="10" rx="3" fill="#C98A52" ${FS()}/>
    <circle cx="40" cy="8" r="6" fill="#F29A1F" ${FS(2)}/><circle cx="54" cy="8" r="6" fill="#F29A1F" ${FS(2)}/><circle cx="47" cy="2" r="6" fill="#F29A1F" ${FS(2)}/>`,
  mushroom: () => `<path d="M12,24 L28,24 L30,38 L10,38 Z" fill="#F3E3C3" ${FS()}/>
    <path d="M2,24 C2,8 12,2 20,2 C28,2 38,8 38,24 Z" fill="#E35D5B" ${FS()}/>
    <circle cx="12" cy="14" r="3.5" fill="#FFF"/><circle cx="26" cy="10" r="3" fill="#FFF"/><circle cx="30" cy="19" r="2.5" fill="#FFF"/>`,
  teddy: () => `<circle cx="9" cy="8" r="6" fill="#C98A52" ${FS()}/><circle cx="31" cy="8" r="6" fill="#C98A52" ${FS()}/>
    <ellipse cx="20" cy="34" rx="14" ry="10" fill="#C98A52" ${FS()}/>
    <circle cx="20" cy="17" r="12" fill="#C98A52" ${FS()}/><ellipse cx="20" cy="21" rx="5" ry="4" fill="#F2D9B8" ${FS(1.6)}/>
    <circle cx="15" cy="15" r="1.6" fill="${INK}"/><circle cx="25" cy="15" r="1.6" fill="${INK}"/><circle cx="20" cy="20" r="1.5" fill="${INK}"/>
    <path d="M14,28 L20,31 L26,28 L20,25 Z" fill="#E35D5B" ${FS(1.4)}/>
    <ellipse cx="11" cy="42" rx="5" ry="3" fill="#C98A52" ${FS(1.8)}/><ellipse cx="29" cy="42" rx="5" ry="3" fill="#C98A52" ${FS(1.8)}/>`,
  fishbowl: () => `<rect x="10" y="44" width="24" height="18" rx="3" fill="#B97A45" ${FS()}/>
    <circle cx="22" cy="26" r="20" fill="#CFEFFF" fill-opacity="0.85" ${FS()}/>
    <path d="M4,26 C14,30 30,30 40,26 L40,30 C36,42 8,42 4,30 Z" fill="#7EC8F0" fill-opacity="0.7"/>
    <path d="M16,22 C20,17 27,18 29,22 C27,26 20,27 16,22 Z M16,22 L11,18 L11,26 Z" fill="#F29A1F" ${FS(1.4)}/>
    <ellipse cx="22" cy="7" rx="9" ry="3" fill="none" ${FS(1.8)}/><circle cx="12" cy="16" r="2" fill="#FFF"/>`,
  trophy: () => `<path d="M10,6 L30,6 L28,26 C26,32 14,32 12,26 Z" fill="#F7C948" ${FS()}/>
    <path d="M10,10 C2,10 2,22 12,22 M30,10 C38,10 38,22 28,22" fill="none" ${FS(2.2)}/>
    <rect x="16" y="30" width="8" height="10" fill="#E0AE2E" ${FS(2)}/><rect x="8" y="40" width="24" height="12" rx="2" fill="#8B5A33" ${FS()}/>
    <path d="${starPath(20, 16, 6, 2.5)}" fill="#FFF"/>`,
  rug_round: () => `<ellipse cx="75" cy="23" rx="72" ry="20" fill="#F7C6A3" ${FS()}/><ellipse cx="75" cy="23" rx="56" ry="13" fill="#F4A987" ${FS(1.6)}/><ellipse cx="75" cy="23" rx="36" ry="7" fill="#F7C6A3"/>`,
  rug_star: () => `<ellipse cx="75" cy="25" rx="72" ry="22" fill="#3B4A86" ${FS()}/>
    <path d="M75,8 L81,20 L95,21 L84,28 L88,40 L75,33 L62,40 L66,28 L55,21 L69,20 Z" fill="#FFE66D" ${FS(1.6)}/>
    <circle cx="30" cy="20" r="2.5" fill="#FFE66D"/><circle cx="118" cy="28" r="2.5" fill="#FFE66D"/><circle cx="108" cy="14" r="1.8" fill="#FFF"/><circle cx="42" cy="34" r="1.8" fill="#FFF"/>`,
  window: () => `<rect x="2" y="2" width="72" height="56" rx="6" fill="#FFFFFF" ${FS()}/>
    <rect x="8" y="8" width="60" height="44" rx="3" fill="#A8DBFF" class="sky" ${FS(1.6)}/>
    <path d="M38,8 L38,52 M8,30 L68,30" stroke="#FFF" stroke-width="4"/><path d="M38,8 L38,52 M8,30 L68,30" ${FS(1.4)}/>
    <path d="M2,2 C14,14 14,40 6,60 L2,60 Z" fill="#F8A5C2" ${FS(1.8)}/><path d="M74,2 C62,14 62,40 70,60 L74,60 Z" fill="#F8A5C2" ${FS(1.8)}/>
    <rect x="-1" y="58" width="78" height="6" rx="2" fill="#D9A066" ${FS()}/>`,
  clock: () => `<path d="M4,22 L22,4 L40,22 Z" fill="#8B5A33" ${FS()}/>
    <rect x="7" y="20" width="30" height="30" rx="4" fill="#C98A52" ${FS()}/>
    <circle cx="22" cy="34" r="10" fill="#FFF" ${FS(1.8)}/><path d="M22,34 L22,27 M22,34 L27,36" ${FS(1.6)}/>
    <path d="M18,50 L18,58 M26,50 L26,56" ${FS(1.6)}/><ellipse cx="18" cy="59" rx="3" ry="4" fill="#F7C948" ${FS(1.4)}/><ellipse cx="26" cy="57" rx="3" ry="4" fill="#F7C948" ${FS(1.4)}/>
    <rect x="16" y="11" width="12" height="7" rx="2" fill="#FFF" ${FS(1.4)}/>`,
  painting: () => `<rect x="2" y="2" width="66" height="48" rx="3" fill="#F7C948" ${FS()}/>
    <rect x="8" y="8" width="54" height="36" fill="#BFE6FF" ${FS(1.6)}/>
    <path d="M8,44 L24,22 L34,32 L44,18 L62,44 Z" fill="#8BCB6B" ${FS(1.6)}/><path d="M44,18 L39,25 L49,25 Z" fill="#FFF"/>
    <circle cx="20" cy="16" r="4" fill="#FFB74D"/>`,
  shelf: () => `<rect x="2" y="22" width="70" height="7" rx="2" fill="#C98A52" ${FS()}/>
    <path d="M12,29 L12,34 M62,29 L62,34" ${FS(2.4)}/>
    <rect x="8" y="6" width="12" height="16" rx="3" fill="#7EC8F0" ${FS(1.8)}/><circle cx="34" cy="16" r="6" fill="#F48FB1" ${FS(1.8)}/>
    <path d="M48,22 L52,4 L58,4 L62,22 Z" fill="#8BCB6B" ${FS(1.8)}/>`,
  garland: () => `<path d="M2,4 C30,20 90,20 118,4" fill="none" ${FS(1.8)}/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 10 + i * 16.5, y = 4 + Math.sin((i / 6) * Math.PI) * 12; const c = ["#F48FB1", "#FFD54F", "#7EC8F0", "#8BCB6B"][i % 4]; return `<path d="M${x - 7},${f2(y)} L${x + 7},${f2(y)} L${x},${f2(y + 16)} Z" fill="${c}" ${FS(1.6)}/>`; }).join("")}`,
  poster: () => `<rect x="2" y="2" width="46" height="62" rx="2" fill="#FFF7E0" ${FS()}/>
    <circle cx="25" cy="3" r="2.5" fill="#E35D5B" ${FS(1.4)}/>
    <circle cx="15" cy="30" r="8" fill="#FFF" ${FS(1.6)}/><path d="M8,26 C4,22 6,18 10,22 M22,26 C26,22 24,18 20,22" fill="${INK}"/>
    <circle cx="33" cy="32" r="7" fill="#FADA78" ${FS(1.6)}/>
    <path d="M18,56 C16,42 20,36 25,36 C30,36 34,42 32,56 Z" fill="#8C8686" ${FS(1.6)}/><ellipse cx="25" cy="44" rx="4" ry="2" fill="#E8262A"/>
    <path d="M8,12 L42,12" stroke="#F48FB1" stroke-width="4" stroke-linecap="round"/>`,
};
Art.furnSvg = function (id, opts = {}) {
  const f = FURN_INDEX[id];
  const body = FURN_ART[id] ? FURN_ART[id](opts) : "";
  const pad = 12; // 線・はみ出し用の余白
  let inner = body;
  if (opts.sky) inner = inner.replace('fill="#A8DBFF" class="sky"', `fill="${opts.sky}" class="sky"`);
  if (opts.flip) inner = `<g transform="matrix(-1,0,0,1,${f.w},0)">${inner}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${f.w + pad * 2} ${f.h + pad * 2}">${inner}</svg>`;
};
Art.FURN_PAD = 12;

// ================= たべもの・どうぐ のアイコン（viewBox 0 0 64 64） =================
const IS = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FOOD_ART = {
  burger:`<rect x="8" y="42" width="48" height="14" rx="6" fill="#E6BA76" ${IS()}/><rect x="6" y="35" width="52" height="10" rx="5" fill="#9B7357" ${IS()}/><path d="M6,28 H57 L51,37 L36,34 L29,41 L20,34 L8,37 Z" fill="#F1CF76" ${IS()}/><path d="M7,26 Q15,18 23,25 Q31,18 39,25 Q48,18 57,26 V30 H7 Z" fill="#A6C584" ${IS()}/><path d="M7,25 C7,0 57,0 57,25 Z" fill="#E8BF81" ${IS()}/><path d="M19,15 L22,13 M31,10 L34,11 M43,14 L45,16" stroke="#FFF0CE" stroke-width="2.5"/>`,
  apple: `<path d="M32,18 C22,10 8,16 10,32 C12,48 24,58 32,54 C40,58 52,48 54,32 C56,16 42,10 32,18 Z" fill="#E8453C" ${IS()}/><path d="M32,18 C32,12 34,8 38,6" fill="none" ${IS()}/><path d="M36,12 C42,6 50,8 50,12 C44,16 38,14 36,12 Z" fill="#6DBE5B" ${IS(2.4)}/><ellipse cx="22" cy="28" rx="4" ry="7" fill="#FFF" fill-opacity="0.6"/>`,
  onigiri: `<path d="M32,8 C40,8 58,40 56,48 C54,56 10,56 8,48 C6,40 24,8 32,8 Z" fill="#FFF" ${IS()}/><rect x="20" y="38" width="24" height="18" rx="3" fill="#2F3B2F" ${IS(2.4)}/><circle cx="26" cy="30" r="2" fill="${INK}"/><circle cx="38" cy="30" r="2" fill="${INK}"/>`,
  bread: `<path d="M8,40 C8,20 20,12 32,12 C44,12 56,20 56,40 C56,50 8,50 8,40 Z" fill="#F7D774" ${IS()}/><path d="M16,24 L40,46 M28,16 L52,38 M40,14 L18,40 M52,24 L30,46" stroke="#D9B04A" stroke-width="2.4"/>`,
  corn: `<path d="M32,6 C44,6 48,22 46,40 C44,54 38,58 32,58 C26,58 20,54 18,40 C16,22 20,6 32,6 Z" fill="#FFD54F" ${IS()}/><path d="M26,14 L26,54 M32,8 L32,58 M38,14 L38,54 M20,24 L44,24 M18,34 L46,34 M19,44 L45,44" stroke="#E0AE2E" stroke-width="2"/><path d="M18,40 C6,36 6,52 16,58 C22,56 26,54 28,58 C22,48 20,44 18,40 Z" fill="#8BCB6B" ${IS(2.4)}/><path d="M46,40 C58,36 58,52 48,58 C42,56 38,54 36,58 C42,48 44,44 46,40 Z" fill="#6DBE5B" ${IS(2.4)}/>`,
  bone: `<path d="M16,26 C8,20 12,10 20,14 C22,6 32,8 30,18 L40,28 C50,26 52,36 46,40 C54,44 50,54 42,50 C40,58 30,56 32,48 L22,38 C12,40 10,30 16,26 Z" fill="#F6E3BF" ${IS()}/><circle cx="26" cy="26" r="2" fill="#C9A06A"/><circle cx="36" cy="38" r="2" fill="#C9A06A"/>`,
  fish: `<path d="M8,32 C16,18 36,16 48,26 L58,18 L56,32 L58,46 L48,38 C36,48 16,46 8,32 Z" fill="#9FB8D0" ${IS()}/><path d="M20,28 L36,24 M20,36 L36,40" stroke="#E08A5A" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="30" r="2.6" fill="${INK}"/>`,
  meat: `<path d="M36,12 C52,12 58,26 54,38 C50,50 36,54 26,48 C16,42 16,24 24,16 C28,13 32,12 36,12 Z" fill="#C8604A" ${IS()}/><path d="M30,22 C36,18 46,20 48,28" fill="none" stroke="#E88A6A" stroke-width="3" stroke-linecap="round"/><path d="M24,44 L12,56" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M24,44 L12,56" stroke="#F6E3BF" stroke-width="4.5" stroke-linecap="round"/><circle cx="10" cy="56" r="4.5" fill="#F6E3BF" ${IS(2.4)}/><circle cx="14" cy="60" r="4" fill="#F6E3BF" ${IS(2.4)}/>`,
  curry: `<ellipse cx="32" cy="40" rx="26" ry="14" fill="#FFF" ${IS()}/><path d="M10,38 C16,30 30,30 34,38 C40,30 52,30 54,38 C50,48 16,50 10,38 Z" fill="#C98A2E" ${IS(2.4)}/><path d="M12,38 C14,32 22,30 30,34 C24,40 16,42 12,38 Z" fill="#FFF8E6"/><circle cx="42" cy="38" r="3" fill="#F29A1F"/><circle cx="24" cy="42" r="2.5" fill="#E35D5B"/>`,
  pepper: `<path d="M20,22 C10,26 10,44 18,52 C26,58 42,58 48,48 C54,38 50,24 40,20 C34,18 26,18 20,22 Z" fill="#4CAF50" ${IS()}/><path d="M30,20 C30,14 32,10 36,8" fill="none" ${IS()}/><path d="M24,20 C28,14 36,14 40,20" fill="#2E7D32" ${IS(2.4)}/><ellipse cx="22" cy="34" rx="3" ry="8" fill="#FFF" fill-opacity="0.5"/>`,
  milk: `<path d="M18,20 L32,8 L46,20 L46,56 L18,56 Z" fill="#FFF" ${IS()}/><path d="M18,20 L46,20" ${IS(2.4)}/><rect x="18" y="30" width="28" height="14" fill="#7EC8F0"/><path d="M18,30 L46,30 M18,44 L46,44" ${IS(2)}/><circle cx="32" cy="37" r="3" fill="#FFF"/>`,
  juice: `<path d="M16,16 L48,16 L44,58 L20,58 Z" fill="#FFCC80" ${IS()}/><path d="M17,26 L47,26 L44,58 L20,58 Z" fill="#FFA726"/><path d="M16,16 L48,16 L44,58 L20,58 Z" fill="none" ${IS()}/><path d="M36,16 L42,4 L48,4" fill="none" stroke="#E35D5B" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="16" r="8" fill="#FFB74D" ${IS(2.4)}/>`,
  candy: `<circle cx="32" cy="32" r="13" fill="#F48FB1" ${IS()}/><path d="M24,26 C30,22 38,26 40,34" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round"/><path d="M19,32 L6,22 L8,42 Z M45,32 L58,22 L56,42 Z" fill="#F8BBD0" ${IS(2.4)}/>`,
  pudding: `<ellipse cx="32" cy="52" rx="24" ry="6" fill="#FFF" ${IS()}/><path d="M16,50 L20,22 C24,16 40,16 44,22 L48,50 Z" fill="#FFE082" ${IS()}/><path d="M20,22 C24,16 40,16 44,22 C44,28 20,28 20,22 Z" fill="#8D5524" ${IS(2.4)}/><circle cx="32" cy="14" r="4" fill="#E53935" ${IS(2)}/>`,
  cake: `<path d="M10,30 L32,18 L54,30 L54,50 L10,50 Z" fill="#FFF" ${IS()}/><path d="M10,38 L54,38" stroke="#F8A5C2" stroke-width="5"/><path d="M10,30 L32,18 L54,30" fill="none" ${IS()}/><path d="M10,30 L54,30" ${IS(2.4)}/><path d="M28,14 C28,8 38,8 36,16 C36,20 30,20 28,14 Z" fill="#E53935" ${IS(2.4)}/><rect x="10" y="30" width="44" height="20" fill="none" ${IS()}/>`,
  protein: `<circle cx="32" cy="32" r="22" fill="#D9A066" ${IS()}/><path d="M22,32 L42,32 M18,26 L18,38 M46,26 L46,38 M22,24 L22,40 M42,24 L42,40" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  katatea: `<path d="M14,22 L50,22 L46,52 C44,56 20,56 18,52 Z" fill="#B0BEC5" ${IS()}/><path d="M50,28 C60,28 60,42 48,42" fill="none" ${IS()}/><path d="M18,30 L46,30" stroke="#8D6E63" stroke-width="4"/><path d="M32,34 L24,46 L32,46 L28,54" fill="none" stroke="#FFD54F" stroke-width="3" stroke-linecap="round"/>`,
  byuname: `<circle cx="32" cy="32" r="16" fill="#7EC8F0" ${IS()}/><path d="M14,20 L2,20 M12,30 L0,30 M14,40 L4,40" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M26,24 C32,20 40,24 42,32" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round"/><path d="M46,32 L60,24 L58,40 Z" fill="#B3E5FC" ${IS(2.4)}/>`,
  vitamin: `<rect x="16" y="10" width="32" height="46" rx="8" fill="#FFF" ${IS()}/><rect x="16" y="10" width="32" height="12" rx="6" fill="#8BCB6B" ${IS()}/><path d="M32,30 L32,46 M24,38 L40,38" stroke="#E35D5B" stroke-width="5" stroke-linecap="round"/>`,
  bandaid: `<g transform="rotate(-30 32 32)"><rect x="4" y="22" width="56" height="20" rx="10" fill="#F5C99B" ${IS()}/><rect x="22" y="24" width="20" height="16" fill="#E9B384"/><circle cx="12" cy="32" r="1.6" fill="#C98A52"/><circle cx="52" cy="32" r="1.6" fill="#C98A52"/></g>`,
  bigbandaid: `<g transform="rotate(-30 32 32)"><rect x="2" y="16" width="60" height="32" rx="14" fill="#F5C99B" ${IS()}/><rect x="20" y="20" width="24" height="24" fill="#E9B384"/><path d="M32,24 L32,40 M24,32 L40,32" stroke="#E35D5B" stroke-width="4" stroke-linecap="round"/></g>`,
  drink: `<path d="M22,10 L42,10 L42,18 L48,26 L48,56 L16,56 L16,26 L22,18 Z" fill="#7EC8F0" ${IS()}/><rect x="16" y="32" width="32" height="14" fill="#FFD54F"/><path d="M16,32 L48,32 M16,46 L48,46" ${IS(2)}/><path d="M30,35 L26,41 L32,41 L28,46" fill="none" ${IS(2)}/><rect x="22" y="6" width="20" height="6" rx="2" fill="#E35D5B" ${IS(2.4)}/>`,
  feather: `<path d="M50,8 C30,10 14,28 14,50 L20,52 C34,46 50,30 50,8 Z" fill="#FFF9C4" ${IS()}/><path d="M14,58 L42,20" fill="none" ${IS(2.4)}/><path d="M26,42 L18,38 M32,34 L24,28 M38,26 L32,20" stroke="#E0C34A" stroke-width="2"/>`,
  smoke: `<circle cx="32" cy="36" r="18" fill="#9E9E9E" ${IS()}/><path d="M32,18 L36,8" ${IS(3)}/><path d="M36,8 C40,4 44,8 42,10" fill="none" stroke="#FF7043" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="32" r="4" fill="#FFF" fill-opacity="0.6"/>`,
};
Art.iconSvg = function (kind, id) {
  if (kind === "bag") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${FOOD_ART[id] || ""}</svg>`;
  }
  if (kind === "furn") return Art.furnSvg(id);
  if (kind === "wall" || kind === "floor") {
    const w = kind === "wall" ? WALL_INDEX[id] : FLOOR_INDEX[id];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="sw${id}"><rect x="4" y="4" width="56" height="56" rx="10"/></clipPath></defs><g clip-path="url(#sw${id})">${Art.patternSvg(w, 64, 64)}</g><rect x="4" y="4" width="56" height="56" rx="10" fill="none" ${IS()}/></svg>`;
  }
  if (kind === "wear") {
    const it = ITEM_INDEX[id];
    const vb = { head: "22 -40 156 110", face: "52 58 96 60", neck: "52 112 96 76", body: "28 108 144 102", back: "-4 74 208 150" }[it.slot];
    const ctx = { p: PROFILE.wanko, a: PROFILE.wanko.a, view: "front", dx: 0, col: it.col || [], uid: "i" + id };
    let r = WEAR[it.wear](ctx);
    const ghost = it.slot === "body" ? `<path d="${PROFILE.wanko.torsoPath}" fill="#FFF" ${SK()}/>` + PROFILE.wanko.arms.map((a) => `<ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" transform="rotate(${a.rot} ${a.cx} ${a.cy})" fill="#FFF" ${SK()}/>`).join("") : "";
    const face = it.slot === "face" ? `<circle cx="100" cy="86" r="60" fill="#FFF" fill-opacity="0.001"/>` : "";
    if (it.slot === "back") {
      // 背中アイテムは うしろ姿で見せる
      r = WEAR[it.wear]({ ...ctx, view: "back" });
    }
    const inner = `<defs><clipPath id="torso${ctx.uid}"><path d="${PROFILE.wanko.torsoPath}"/></clipPath></defs><g class="content">${r.behind || ""}${ghost}${r.sleeve || ""}${r.torso || ""}${r.top || ""}</g>`;
    // 服(からだ)以外は 実際の大きさに合わせて切り抜く（小さいアイテムも見やすく）
    const box = it.slot === "body" ? vb : Art.fitBox("wear:" + id, inner, vb);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${face}${inner}</svg>`;
  }
  return "";
};

// DOMで一度だけ getBBox して、正方形の viewBox を作る
Art.boxCache = {};
Art.fitBox = function (key, inner, fallback) {
  if (Art.boxCache[key]) return Art.boxCache[key];
  let box = fallback;
  try {
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-9999px;top:0;width:200px;height:200px;visibility:hidden;pointer-events:none";
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fallback}" width="200" height="200">${inner}</svg>`;
    document.body.appendChild(host);
    const b = host.querySelector(".content").getBBox();
    host.remove();
    if (b.width > 0 && b.height > 0) {
      const size = Math.max(b.width, b.height) * 1.18 + 8;
      box = `${f2(b.x + b.width / 2 - size / 2)} ${f2(b.y + b.height / 2 - size / 2)} ${f2(size)} ${f2(size)}`;
    }
  } catch (e) { /* 計測できないときは そのまま */ }
  Art.boxCache[key] = box;
  return box;
};

// かべがみ・ゆか の模様（SVG）
Art.patternSvg = function (p, w, h) {
  const b = p.base, c = p.c2;
  let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="${b}"/>`;
  switch (p.pat) {
    case "stripe": for (let x = 0; x < w; x += 16) s += `<rect x="${x}" y="0" width="8" height="${h}" fill="${c}"/>`; break;
    case "dots": for (let y = 6; y < h; y += 16) for (let x = 6 + ((y / 16) % 2) * 8; x < w; x += 16) s += `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}"/>`; break;
    case "check": for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 16; x < w; x += 32) s += `<rect x="${x}" y="${y}" width="16" height="16" fill="${c}"/>`; break;
    case "wood": for (let y = 0; y < h; y += 14) s += `<rect x="0" y="${y}" width="${w}" height="2" fill="${c}"/>`; break;
    case "brick": for (let y = 0; y < h; y += 14) { s += `<rect x="0" y="${y}" width="${w}" height="2" fill="${c}"/>`; for (let x = ((y / 14) % 2) * 14; x < w; x += 28) s += `<rect x="${x}" y="${y}" width="2" height="14" fill="${c}"/>`; } break;
    case "star": for (let i = 0; i < (w * h) / 500; i++) s += `<path d="${starPath(U.hash(i, 1) * w, U.hash(i, 2) * h, 4, 1.6)}" fill="${c}"/>`; break;
    case "cloud": for (let i = 0; i < (w * h) / 1800 + 1; i++) { const x = U.hash(i, 3) * w, y = U.hash(i, 4) * h; s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="12" ry="6" fill="${c}"/><circle cx="${f2(x - 4)}" cy="${f2(y - 4)}" r="6" fill="${c}"/><circle cx="${f2(x + 5)}" cy="${f2(y - 3)}" r="5" fill="${c}"/>`; } break;
    case "plank": for (let y = 0; y < h; y += 12) { s += `<rect x="0" y="${y}" width="${w}" height="1.6" fill="${c}"/>`; for (let x = ((y / 12) % 2) * 20; x < w; x += 40) s += `<rect x="${x}" y="${y}" width="1.6" height="12" fill="${c}"/>`; } break;
    case "checker": for (let y = 0; y < h; y += 14) for (let x = ((y / 14) % 2) * 14; x < w; x += 28) s += `<rect x="${x}" y="${y}" width="14" height="14" fill="${c}"/>`; break;
    case "carpet": for (let y = 4; y < h; y += 8) for (let x = 4 + ((y / 8) % 2) * 4; x < w; x += 8) s += `<circle cx="${x}" cy="${y}" r="1.2" fill="${c}"/>`; break;
    case "tatami": for (let y = 0; y < h; y += 24) for (let x = ((y / 24) % 2) * 24; x < w; x += 48) s += `<rect x="${x}" y="${y}" width="48" height="24" fill="none" stroke="${c}" stroke-width="2"/>`; break;
    case "grass": for (let i = 0; i < (w * h) / 60; i++) { const x = U.hash(i, 5) * w, y = U.hash(i, 6) * h; s += `<path d="M${f2(x)},${f2(y)} l2,-5 l2,5" fill="none" stroke="${c}" stroke-width="1.4"/>`; } break;
    case "stone": for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 12; x < w; x += 24) s += `<rect x="${x + 1}" y="${y + 1}" width="22" height="14" rx="4" fill="${c}"/>`; break;
  }
  return s;
};
