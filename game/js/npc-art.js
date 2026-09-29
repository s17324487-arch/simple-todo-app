// 町の人（どうぶつ）の 絵 ver2。どうぶつの森の ように 1人ずつ ちがう 顔にする。
// 種を 35 に ふやし、目・まゆ・口・ほお・毛の もよう・まえがみ（あたまの かざり）・3つの 色で くみあわせる。
// Art.npcSvg(spec) を おきかえる。spec: { sp, col, col2, stripe, outfit, emo, dir, pose, look }
//   look: { col3, eye, brow, mouth, cheek, pattern, tuft }（ない ところは 種の きほん）。1人ずつの look は js/npc-cast.js が きめる。
// 線は INK・太さ 4.5（キャラと おなじ）。体と 服は これまでと おなじ（NPC_PROFILE・WEAR）。
const NpcArt = (() => {
  const K = (w = 4.5) => SK(w);
  const C = (x, y, r, fill, w = 4.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${K(w)}/>`;
  const E = (x, y, rx, ry, fill, w = 4.5, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ""} fill="${fill}" ${K(w)}/>`;
  const P = (d, fill, w = 4.5) => `<path d="${d}" fill="${fill}" ${K(w)}/>`;
  const Ln = (d, w = 3) => `<path d="${d}" fill="none" ${K(w)}/>`;
  const F = (d, fill, op = 1) => `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ""}/>`; // 線なしの ぬり
  const tail = (d, col) => outlineLine(d, col, 13, 7);
  const PINK = "#F8A5C2", NOSE = "#F48FB1", BEAK = "#F2A93B";
  const HEAD = (r = 55, cy = 86) => `<circle cx="100" cy="${cy}" r="${r}"/>`;

  // ---- 種 ----
  // ears: 頭の うしろ／head: 頭の 形（線なし・ぬり と きりぬきに つかう）／front: 口もと（頭の 線の あと）／nose: はな・くちばし
  // back: しっぽ（体の うしろ）／over: 顔の あと（ひげ・つの の まえ など）。eyeY・gap・mouthY・cheekY・mouth: 顔の いち と きほんの 口
  const SP = {
    cat: { name: "ねこ", cols: [["#F5C07A", "#FFFFFF"], ["#FFFFFF", "#F8D7C4"], ["#B9B4C4", "#FFFFFF"], ["#6B6B78", "#FFFFFF"], ["#E8A97A", "#FCE9D8"], ["#C9E7D8", "#FFFFFF"], ["#F2D4E4", "#FFFFFF"]],
      ears: (c) => P("M56,62 L58,20 L92,42 Z", c.col) + P("M144,62 L142,20 L108,42 Z", c.col) + F("M64,50 L65,31 L80,42 Z", PINK) + F("M136,50 L135,31 L120,42 Z", PINK),
      head: () => HEAD(55, 86), nose: () => P("M96,99 L104,99 L100,104 Z", NOSE, 2.5),
      over: () => Ln("M66,100 L48,96 M66,106 L48,108 M134,100 L152,96 M134,106 L152,108", 2.5),
      back: (c) => tail("M124,184 C152,182 156,150 144,140", c.col), mouth: "cat" },
    dog: { name: "いぬ", cols: [["#E3B37C", "#FFF3E0"], ["#C98F5B", "#F6E0C6"], ["#F2E6D6", "#FFFFFF"], ["#8A6A58", "#E9D2BE"], ["#DDBB8A", "#FFFFFF"], ["#B7A6A0", "#EFE7E3"], ["#F4CDA5", "#FFFFFF"]],
      ears: () => "", head: () => HEAD(55, 86),
      front: (c) => E(100, 107, 21, 15, c.col2, 3.5) + E(56, 78, 13, 26, c.col3 || c.col, 4.5, 18) + E(144, 78, 13, 26, c.col3 || c.col, 4.5, -18),
      nose: () => E(100, 100, 7, 5, INK, 0) + C(98, 98.5, 1.6, "#FFF", 0), mouth: "dog", mouthY: 106,
      back: (c) => tail("M124,182 C142,178 150,160 146,150", c.col) },
    rabbit: { name: "うさぎ", cols: [["#FFFFFF", PINK], ["#F6E3BF", "#F8B8C8"], ["#D7CCC8", "#F8B8C8"], ["#B8A68F", "#F1C3CF"], ["#EEE3F4", "#F8B8C8"], ["#8E8580", "#E8B4C2"]],
      ears: (c) => E(78, 12, 14, 36, c.col, 4.5, -10) + E(78, 14, 6, 24, c.col2, 0, -10).replace(K(0), "") + E(122, 12, 14, 36, c.col, 4.5, 10) + E(122, 14, 6, 24, c.col2, 0, 10).replace(K(0), ""),
      head: () => HEAD(54, 88), nose: () => E(100, 100, 4.5, 3.5, NOSE, 0), mouth: "rabbit",
      back: (c) => C(124, 184, 10, c.col) },
    bear: { name: "くま", cols: [["#B98555", "#F2D9B8"], ["#8D6E63", "#E9D2BE"], ["#D9A066", "#FBE7C6"], ["#6D5445", "#D9BFA7"], ["#EDE3D1", "#FFFFFF"], ["#C98F7B", "#F6DCCF"]],
      ears: (c) => C(56, 44, 17, c.col) + C(56, 44, 8, c.col2, 3) + C(144, 44, 17, c.col) + C(144, 44, 8, c.col2, 3),
      head: () => HEAD(56, 88), front: (c) => E(100, 106, 22, 16, c.col2, 3.5),
      nose: () => E(100, 100, 7, 5, INK, 0), mouth: "dog", mouthY: 105, eyeGap: 40, eyeY: 86 },
    penguin: { name: "ぺんぎん", cols: [["#3E4E72", "#FFFFFF"], ["#2F3542", "#FFFFFF"], ["#5B6B85", "#FFFFFF"], ["#6E88A8", "#FFFFFF"], ["#7A6A5E", "#F6EFE6"], ["#4A6F7A", "#FFFFFF"]], feet: BEAK, noArms: true,
      ears: () => "", head: () => HEAD(56, 88),
      front: (c) => P("M100,62 C84,48 58,58 58,86 C58,118 80,134 100,134 C120,134 142,118 142,86 C142,58 116,48 100,62 Z", c.col2, 3.5),
      nose: () => P("M90,100 L110,100 L100,113 Z", BEAK, 3), mouth: "none", eyeGap: 34, eyeY: 88,
      body: (c) => E(66, 160, 9, 20, c.col, 4.5, 20) + E(134, 160, 9, 20, c.col, 4.5, -20), belly: "#FFFFFF" },
    frog: { name: "かえる", cols: [["#8BCB6B", "#FFFFFF"], ["#6FB35A", "#EAF6D8"], ["#A6D66F", "#FFFFFF"], ["#7FC4B0", "#FFFFFF"], ["#C3D86A", "#FFFFFF"], ["#E7A85C", "#FFF3E0"]],
      ears: (c) => C(70, 50, 18, c.col) + C(130, 50, 18, c.col), head: () => `<ellipse cx="100" cy="94" rx="62" ry="46"/>`,
      front: () => C(70, 50, 11, "#FFF", 3) + C(130, 50, 11, "#FFF", 3), eyeY: 51, eyeGap: 60, mouth: "frog", mouthY: 106, cheekY: 100, cheekGap: 76 },
    sheep: { name: "ひつじ", cols: [["#FFFFFF", "#F6D9B6"], ["#F4EDE0", "#5A4E4A"], ["#EDE3F4", "#F6D9B6"], ["#E8E1D5", "#8C7B6B"], ["#FFF6E0", "#F2CFA8"], ["#D9D6D2", "#F6D9B6"]],
      ears: (c) => E(46, 92, 16, 8, c.col2, 4.5, -20) + E(154, 92, 16, 8, c.col2, 4.5, 20),
      head: () => { let d = ""; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; d += (i ? " A12,12 0 0 1 " : "M") + f2(100 + Math.cos(a) * 58) + "," + f2(86 + Math.sin(a) * 58); } return `<path d="${d} Z"/>`; },
      front: (c) => E(100, 98, 36, 38, c.col2, 3.5), eyeY: 96, eyeGap: 30, mouth: "sheep", mouthY: 114, cheekY: 108, cheekGap: 46, dark: (c) => isDark(c.col2) },
    mouse: { name: "ねずみ", cols: [["#B9B4C4", PINK], ["#D8D2C9", PINK], ["#8E8A99", "#F1B7C9"], ["#F2EDE4", PINK], ["#C9B6A6", "#F1B7C9"], ["#A7B6C4", PINK]],
      ears: (c) => C(50, 46, 24, c.col) + C(50, 46, 13, c.col2, 0).replace(K(0), "") + C(150, 46, 24, c.col) + C(150, 46, 13, c.col2, 0).replace(K(0), ""),
      head: () => HEAD(52, 90), nose: () => C(100, 104, 5, NOSE, 2.5), over: () => Ln("M72,104 L52,100 M72,110 L52,112 M128,104 L148,100 M128,110 L148,112", 2.5),
      back: () => Ln("M124,186 C150,190 160,172 150,160", 4), eyeY: 90, eyeGap: 34, mouth: "small", mouthY: 112 },
    pig: { name: "ぶた", cols: [["#F8B9C6", "#F48FB1"], ["#F6C9B8", "#EE9D8A"], ["#EAD7CF", "#D9A1A0"], ["#F5D0DA", "#EE9CB3"], ["#C9A48E", "#AE7F6A"]],
      ears: (c) => P("M56,58 L52,28 L82,40 Z", c.col) + P("M144,58 L148,28 L118,40 Z", c.col), head: () => HEAD(55, 88),
      nose: (c) => E(100, 104, 17, 12, c.col2, 3.5) + E(94, 104, 3, 4.5, INK, 0) + E(106, 104, 3, 4.5, INK, 0), eyeY: 84, eyeGap: 40, mouth: "small", mouthY: 120,
      back: () => Ln("M124,182 c10,-2 14,-10 8,-14 c-6,-2 -8,6 -2,8 c6,2 12,-2 14,-8", 3.5) },
    duck: { name: "あひる", cols: [["#FFFFFF", BEAK], ["#F3EFE2", BEAK], ["#9FB9A2", "#E7B14A"], ["#C9B08F", "#E9A04A"], ["#DDE6EE", BEAK]],
      ears: () => "", head: () => HEAD(54, 88), over: (c) => P("M100,34 C96,22 102,14 108,18 C104,22 106,28 100,34 Z", c.col, 3),
      nose: (c) => P("M78,100 C80,92 120,92 122,100 C124,110 108,114 100,112 C92,114 76,110 78,100 Z", c.col2, 3.5) + Ln("M84,102 Q100,106 116,102", 2.5), mouth: "none", eyeY: 84, eyeGap: 38 },
    bird: { name: "ことり", cols: [["#8DC3E8", "#FFFFFF"], ["#F29B8E", "#FFF1E6"], ["#9CD39A", "#FFFBEA"], ["#C9A6E4", "#FFF4FB"], ["#F6B26B", "#FFF7E8"]],
      ears: () => "", head: () => HEAD(54, 88),
      front: (c) => E(100, 112, 30, 22, c.col2, 0).replace(K(0), ""), over: (c) => P("M92,36 C88,20 96,12 100,24 C102,12 112,14 108,34 Z", c.col3 || c.col, 3),
      nose: () => P("M92,100 L108,100 L100,110 Z", BEAK, 3), mouth: "none", eyeY: 88, eyeGap: 40, back: (c) => P("M122,176 L150,166 L146,182 L156,190 L126,190 Z", c.col, 3.5) },
    chicken: { name: "にわとり", cols: [["#FFFFFF", "#E8453C"], ["#F3E6D0", "#E8453C"], ["#D9A16B", "#E8453C"], ["#E7D9C4", "#D9534F"]],
      ears: () => "", head: () => HEAD(54, 88), over: (c) => P("M84,40 C80,26 92,22 94,32 C96,18 108,18 106,32 C112,22 122,28 116,42 Z", c.col2, 3.5),
      nose: (c) => P("M92,98 L108,98 L100,108 Z", BEAK, 3) + P("M97,108 C92,118 104,122 103,110 Z", c.col2, 2.5), mouth: "none", eyeY: 86, eyeGap: 38 },
    squirrel: { name: "りす", cols: [["#D98E4A", "#FCE3C4"], ["#B97A4A", "#F6DDC0"], ["#9E8C80", "#F1E6DD"], ["#E7A66A", "#FFF1DD"], ["#C77A5E", "#F9DCCB"]],
      ears: (c) => P("M60,58 L64,22 L90,44 Z", c.col) + P("M140,58 L136,22 L110,44 Z", c.col) + Ln("M64,22 L60,12 M64,22 L68,13 M136,22 L140,12 M136,22 L132,13", 3),
      head: () => HEAD(54, 88), front: (c) => E(72, 108, 16, 12, c.col2, 0).replace(K(0), "") + E(128, 108, 16, 12, c.col2, 0).replace(K(0), ""),
      nose: () => E(100, 100, 5, 3.5, INK, 0), mouth: "teeth", mouthY: 106,
      back: (c) => P("M122,190 C160,196 176,150 158,120 C146,100 124,110 132,126 C150,132 150,160 124,168 Z", c.col3 || c.col, 4.5) + Ln("M140,122 C150,136 150,150 138,160", 3) },
    hamster: { name: "ハムスター", cols: [["#F2C48E", "#FFFFFF"], ["#E8D8C4", "#FFFFFF"], ["#C9A68A", "#FFF6EC"], ["#F7E3C6", "#FFFFFF"], ["#B8B3B8", "#FFFFFF"]],
      ears: (c) => C(62, 46, 14, c.col) + C(62, 46, 6, PINK, 0).replace(K(0), "") + C(138, 46, 14, c.col) + C(138, 46, 6, PINK, 0).replace(K(0), ""),
      head: () => `<ellipse cx="100" cy="92" rx="60" ry="52"/>`, front: (c) => E(68, 108, 20, 16, c.col2, 0).replace(K(0), "") + E(132, 108, 20, 16, c.col2, 0).replace(K(0), "") + E(100, 112, 16, 12, c.col2, 0).replace(K(0), ""),
      nose: () => C(100, 102, 3.5, NOSE, 2), over: () => Ln("M78,104 L60,100 M122,104 L140,100", 2.2), mouth: "small", mouthY: 109, eyeGap: 42 },
    koala: { name: "コアラ", cols: [["#A8A8B3", "#EDEDF2"], ["#8E8E99", "#E3E3EA"], ["#BFB4AA", "#F1ECE6"], ["#9DA6B0", "#E9EEF2"]],
      ears: (c) => C(48, 58, 26, c.col) + C(48, 58, 15, c.col2, 0).replace(K(0), "") + C(152, 58, 26, c.col) + C(152, 58, 15, c.col2, 0).replace(K(0), ""),
      head: () => HEAD(55, 90), nose: () => E(100, 102, 11, 15, "#4A4452", 3), mouth: "small", mouthY: 122, eyeGap: 46, eyeY: 88, cheekY: 106, cheekGap: 68 },
    elephant: { name: "ぞう", cols: [["#A9B4C2", "#F2C9D2"], ["#B9B0C9", "#F2C9D2"], ["#C7C2BB", "#F2C9D2"], ["#9CB8C4", "#F4CFD6"]],
      ears: (c) => E(44, 88, 26, 34, c.col, 4.5, -12) + E(46, 88, 15, 22, c.col2, 0, -12).replace(K(0), "") + E(156, 88, 26, 34, c.col, 4.5, 12) + E(154, 88, 15, 22, c.col2, 0, 12).replace(K(0), ""),
      head: () => HEAD(52, 86), nose: (c) => outlineLine("M100,96 C100,114 96,126 103,133 C109,139 118,133 113,126", c.col, 17, 10.5) + Ln("M95,112 L105,112 M95,120 L104,121", 2),
      mouth: "none", eyeY: 84, eyeGap: 40, cheekY: 102, cheekGap: 64 },
    deer: { name: "しか", cols: [["#C98F5B", "#F8E7D2"], ["#B77F54", "#F3DCC2"], ["#D9A77A", "#FFF1E0"], ["#A0785A", "#EBD6C4"]],
      ears: (c) => E(50, 70, 18, 9, c.col, 4.5, -25) + E(150, 70, 18, 9, c.col, 4.5, 25) + (c.look.pattern === "antler" ? Ln("M76,40 C72,24 66,18 60,14 M70,26 L58,26 M124,40 C128,24 134,18 140,14 M130,26 L142,26", 5.5) : ""),
      head: () => HEAD(52, 88), front: (c) => E(100, 108, 18, 13, c.col2, 3.5), nose: () => E(100, 103, 6, 4.5, INK, 0), mouth: "small", mouthY: 112, eyeGap: 40 },
    fox: { name: "きつね", cols: [["#E8914A", "#FFFFFF"], ["#D97B3E", "#FFF4E6"], ["#F2C27A", "#FFFFFF"], ["#B6B0A8", "#FFFFFF"], ["#C9754A", "#FFEEDD"]],
      ears: (c) => P("M54,64 L52,14 L94,40 Z", c.col) + P("M146,64 L148,14 L106,40 Z", c.col) + F("M53,30 L52,14 L66,23 Z", INK) + F("M147,30 L148,14 L134,23 Z", INK),
      head: () => HEAD(54, 88), front: (c) => P("M54,96 C70,96 88,104 100,120 C112,104 130,96 146,96 C146,124 126,140 100,142 C74,140 54,124 54,96 Z", c.col2, 0).replace(K(0), ""),
      nose: () => E(100, 108, 5.5, 4, INK, 0), mouth: "small", mouthY: 116, eyeY: 90, eyeGap: 40,
      back: (c) => P("M124,186 C156,190 170,160 158,136 C152,126 142,132 146,140 C152,158 140,172 122,172 Z", c.col, 4.5) + F("M158,136 C152,126 142,132 146,140 C148,144 154,144 158,136 Z", "#FFFFFF") },
    raccoon: { name: "たぬき", cols: [["#A58D72", "#FFF4E6"], ["#8E7A68", "#F4E9DC"], ["#B9A48B", "#FFFFFF"], ["#7E7468", "#EFE6DC"]],
      ears: (c) => C(58, 46, 15, c.col3 || "#5A4A40") + C(142, 46, 15, c.col3 || "#5A4A40"), head: () => HEAD(55, 88),
      front: (c) => E(100, 110, 22, 15, c.col2, 3.5), nose: () => E(100, 103, 6, 4.5, INK, 0), mouth: "dog", mouthY: 109, defPattern: "mask",
      back: (c) => tail("M124,184 C152,186 158,160 146,146", c.col) },
    owl: { name: "ふくろう", cols: [["#A98B6D", "#F3E6D3"], ["#8C8A99", "#EFEFF4"], ["#C9A071", "#FFF3E0"], ["#E6E1D6", "#FFFFFF"]],
      ears: (c) => P("M58,56 L56,26 L82,44 Z", c.col) + P("M142,56 L144,26 L118,44 Z", c.col), head: () => HEAD(55, 88),
      front: (c) => C(80, 88, 19, c.col2, 3) + C(120, 88, 19, c.col2, 3), nose: () => P("M94,100 L106,100 L100,112 Z", BEAK, 3), mouth: "none", eyeGap: 40, eyeY: 88, eyeDef: "sparkle" },
    hippo: { name: "かば", cols: [["#B9A9C9", "#F2C9D6"], ["#A6B4C4", "#F4CFD8"], ["#C9A99B", "#F2C4C8"], ["#9FB7AA", "#F2CCD2"]],
      ears: (c) => E(66, 40, 11, 9, c.col) + E(134, 40, 11, 9, c.col), head: () => HEAD(54, 84),
      front: (c) => E(100, 112, 40, 26, c.col, 4.5) + E(86, 104, 4, 5.5, INK, 0) + E(114, 104, 4, 5.5, INK, 0), eyeY: 74, eyeGap: 42, mouth: "wide", mouthY: 122, cheekY: 112, cheekGap: 84 },
    lion: { name: "ライオン", cols: [["#F0C06A", "#FFF1D6"], ["#E6A95B", "#FFEBD0"], ["#F5D28E", "#FFFFFF"], ["#D9B27A", "#FFF4E0"]],
      ears: (c) => { let d = ""; for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI * 2 - Math.PI / 2; d += (i ? " A16,16 0 0 1 " : "M") + f2(100 + Math.cos(a) * 70) + "," + f2(88 + Math.sin(a) * 68); } return `<path d="${d} Z" fill="${c.col3 || "#C9753F"}" ${K()}/>` + C(62, 40, 13, c.col) + C(138, 40, 13, c.col); },
      head: () => HEAD(52, 88), front: (c) => E(100, 106, 20, 14, c.col2, 3.5), nose: () => P("M93,99 L107,99 L100,106 Z", "#B06A4A", 2.5), mouth: "dog", mouthY: 106, eyeGap: 38,
      back: (c) => tail("M124,184 C150,186 156,168 150,154", c.col) + C(150, 150, 8, c.col3 || "#C9753F", 3.5) },
    tiger: { name: "とら", cols: [["#F2A43E", "#FFFFFF"], ["#F3C26B", "#FFFFFF"], ["#FFFFFF", "#FFFFFF"], ["#E88B4A", "#FFF4E6"]],
      ears: (c) => C(58, 44, 15, c.col) + C(58, 44, 6, "#FFFFFF", 0).replace(K(0), "") + C(142, 44, 15, c.col) + C(142, 44, 6, "#FFFFFF", 0).replace(K(0), ""), head: () => HEAD(55, 88),
      front: (c) => E(100, 108, 22, 15, c.col2, 3.5), nose: () => P("M93,100 L107,100 L100,107 Z", "#E57373", 2.5), mouth: "dog", mouthY: 107, defPattern: "stripes", defCol3: "#4A3A34",
      back: (c) => tail("M124,184 C152,182 156,150 144,140", c.col) },
    monkey: { name: "さる", cols: [["#B07A58", "#F6D9C0"], ["#8E6A58", "#F3D5C6"], ["#C99E7A", "#FFE8D6"], ["#A9A09A", "#F8E0D6"]],
      ears: (c) => C(44, 92, 15, c.col) + C(44, 92, 7, c.col2, 0).replace(K(0), "") + C(156, 92, 15, c.col) + C(156, 92, 7, c.col2, 0).replace(K(0), ""), head: () => HEAD(54, 88),
      front: (c) => P("M100,70 C112,56 142,62 140,92 C140,122 120,136 100,136 C80,136 60,122 60,92 C58,62 88,56 100,70 Z", c.col2, 3.5), nose: () => E(96, 104, 2, 2.5, INK, 0) + E(104, 104, 2, 2.5, INK, 0),
      mouth: "smile", mouthY: 114, eyeY: 90, eyeGap: 32, back: (c) => Ln("M124,186 C150,190 160,160 146,150 C140,146 136,152 140,156", 5) },
    horse: { name: "うま", cols: [["#B07A4A", "#F3DCC2"], ["#8E6450", "#E9CDB8"], ["#E7DCCD", "#F8EFE6"], ["#5E4A44", "#C9B6A8"], ["#D9B894", "#FFF0DD"]],
      ears: (c) => P("M68,48 L66,20 L86,38 Z", c.col) + P("M132,48 L134,20 L114,38 Z", c.col), head: () => `<ellipse cx="100" cy="88" rx="48" ry="58"/>`,
      front: (c) => E(100, 118, 30, 22, c.col2, 3.5) + E(90, 118, 3.5, 5, INK, 0) + E(110, 118, 3.5, 5, INK, 0), over: (c) => P("M86,34 C92,20 110,20 114,34 C108,30 104,40 100,34 C96,42 90,32 86,34 Z", c.col3 || "#5E4A44", 3.5),
      mouth: "none", eyeY: 78, eyeGap: 42, cheekY: 98, cheekGap: 72 },
    goat: { name: "やぎ", cols: [["#FFFFFF", "#F6D9B6"], ["#E9E1D6", "#F2CFA8"], ["#C9B6A0", "#F4E3CF"], ["#A7A2A0", "#E9E3E0"]],
      ears: (c) => E(48, 84, 18, 8, c.col, 4.5, -18) + E(152, 84, 18, 8, c.col, 4.5, 18) + P("M78,42 C70,26 58,22 52,30 C62,30 68,38 70,48 Z", "#C9B79C", 3.5) + P("M122,42 C130,26 142,22 148,30 C138,30 132,38 130,48 Z", "#C9B79C", 3.5),
      head: () => `<ellipse cx="100" cy="88" rx="50" ry="54"/>`, front: (c) => E(100, 112, 18, 13, c.col2, 3.5), nose: () => E(95, 108, 2.2, 3, INK, 0) + E(105, 108, 2.2, 3, INK, 0),
      over: (c) => P("M94,134 C94,146 100,154 104,146 C106,142 106,136 106,134 Z", c.col, 3), mouth: "small", mouthY: 118, eyeGap: 40, eyeY: 88 },
    cow: { name: "うし", cols: [["#FFFFFF", "#F6C4CE"], ["#F1E6DA", "#F2BFC9"], ["#C9A48A", "#F2C4C8"], ["#8E7A70", "#EFC3CB"]],
      ears: (c) => E(46, 76, 17, 9, c.col, 4.5, -18) + E(154, 76, 17, 9, c.col, 4.5, 18) + P("M72,40 C66,28 70,20 78,24 C80,30 80,36 80,42 Z", "#F3E3C3", 3) + P("M128,40 C134,28 130,20 122,24 C120,30 120,36 120,42 Z", "#F3E3C3", 3),
      head: () => HEAD(54, 86), front: (c) => E(100, 112, 30, 20, c.col2, 3.5) + E(90, 112, 3.5, 4.5, INK, 0) + E(110, 112, 3.5, 4.5, INK, 0), mouth: "none", eyeY: 84, eyeGap: 44, defPattern: "spots", defCol3: "#4A4040" },
    hedgehog: { name: "はりねずみ", cols: [["#F3E0C8", "#9C7A5E"], ["#F6E6D6", "#7E6454"], ["#EFE0D0", "#B09070"], ["#F4E8DC", "#8B8B99"]],
      ears: (c) => { let d = "M40,110"; for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.05 + (i / 10) * 0.9), r = i % 2 ? 58 : 76; d += ` L${f2(100 + Math.cos(a) * r)},${f2(90 + Math.sin(a) * r)}`; } return `<path d="${d} L160,110 Z" fill="${c.col2}" ${K()}/>`; },
      head: () => HEAD(52, 92), nose: () => C(100, 106, 5, INK, 0), mouth: "small", mouthY: 114, eyeY: 94, eyeGap: 36, cheekY: 108 },
    otter: { name: "かわうそ", cols: [["#9E7A5E", "#F3E3D3"], ["#8A6A54", "#EFDCCB"], ["#B8957A", "#FFF1E4"], ["#7E6A60", "#E9DDD4"]],
      ears: (c) => C(58, 58, 10, c.col) + C(142, 58, 10, c.col), head: () => HEAD(54, 90),
      front: (c) => E(100, 112, 32, 20, c.col2, 0).replace(K(0), ""), nose: () => E(100, 104, 7, 5, INK, 0), over: () => Ln("M74,110 L54,106 M74,116 L54,118 M126,110 L146,106 M126,116 L146,118", 2.2),
      mouth: "cat", mouthY: 110, eyeY: 90, back: (c) => tail("M124,186 C150,194 164,180 160,168", c.col) },
    panda: { name: "パンダ", cols: [["#FFFFFF", "#3A3A42"], ["#F6F2EC", "#3A3A42"], ["#FFFFFF", "#6B4E3E"]], arms: (c) => c.col2, feet: (c) => c.col2,
      ears: (c) => C(58, 44, 16, c.col2) + C(142, 44, 16, c.col2), head: () => HEAD(56, 88),
      front: (c) => E(80, 90, 12, 15, c.col2, 0, -30).replace(K(0), "") + E(120, 90, 12, 15, c.col2, 0, 30).replace(K(0), ""),
      nose: () => E(100, 104, 6, 4.5, INK, 0), mouth: "dog", mouthY: 109, eyeOnDark: true, eyeGap: 40 },
    redpanda: { name: "レッサーパンダ", cols: [["#D9703E", "#FFFFFF"], ["#C95F3A", "#FFF6EC"], ["#E68A52", "#FFFFFF"]], arms: () => "#5A3A30", feet: () => "#5A3A30",
      ears: (c) => P("M54,58 L56,26 L86,42 Z", c.col) + F("M60,50 L61,34 L78,43 Z", "#FFFFFF") + P("M146,58 L144,26 L114,42 Z", c.col) + F("M140,50 L139,34 L122,43 Z", "#FFFFFF"),
      head: () => HEAD(55, 88), front: (c) => E(100, 110, 20, 14, c.col2, 0).replace(K(0), "") + E(78, 78, 8, 5, c.col2, 0).replace(K(0), "") + E(122, 78, 8, 5, c.col2, 0).replace(K(0), ""),
      nose: () => E(100, 103, 6, 4.5, INK, 0), mouth: "cat", mouthY: 108,
      back: (c) => P("M122,188 C156,194 168,160 154,142 C146,134 138,142 144,150 C152,164 142,176 122,174 Z", c.col, 4.5) + Ln("M148,150 L158,146 M150,164 L162,164", 4) },
    wolf: { name: "おおかみ", cols: [["#9EA3AE", "#F2F3F5"], ["#7F8591", "#E4E6EA"], ["#C4B8A8", "#F7F1EA"], ["#5E6470", "#D9DCE2"]],
      ears: (c) => P("M58,60 L60,18 L92,42 Z", c.col) + P("M142,60 L140,18 L108,42 Z", c.col) + F("M65,48 L66,30 L80,41 Z", "#D9DCE2") + F("M135,48 L134,30 L120,41 Z", "#D9DCE2"),
      head: () => HEAD(54, 88), front: (c) => P("M62,104 C74,98 88,100 100,112 C112,100 126,98 138,104 C136,128 120,140 100,140 C80,140 64,128 62,104 Z", c.col2, 0).replace(K(0), ""),
      nose: () => E(100, 110, 6.5, 5, INK, 0), mouth: "small", mouthY: 118, eyeY: 90, eyeGap: 40, back: (c) => tail("M124,184 C152,188 160,166 152,150", c.col) },
    croc: { name: "わに", cols: [["#7DBE6A", "#EAF6D8"], ["#6FAE8C", "#E6F4EC"], ["#9CC46A", "#F3F8DE"], ["#5E9E7A", "#DDEFE4"]],
      ears: (c) => E(72, 52, 16, 13, c.col) + E(128, 52, 16, 13, c.col), head: () => `<ellipse cx="100" cy="92" rx="58" ry="48"/>`,
      front: (c) => E(100, 114, 42, 22, c.col, 4.5) + E(88, 104, 3, 4, INK, 0) + E(112, 104, 3, 4, INK, 0) + P("M72,122 L78,128 L84,122 M116,122 L122,128 L128,122", "#FFFFFF", 2.5),
      eyeY: 54, eyeGap: 56, mouth: "none", cheekY: 96, cheekGap: 80, back: (c) => P("M122,186 C150,190 168,178 172,164 C156,172 140,172 124,170 Z", c.col, 4.5) },
    kangaroo: { name: "カンガルー", cols: [["#D9A06B", "#FBE9D6"], ["#C98F66", "#F7E2D0"], ["#B8977E", "#F4E6DA"]],
      ears: (c) => E(70, 30, 11, 28, c.col, 4.5, -14) + E(70, 32, 5, 18, PINK, 0, -14).replace(K(0), "") + E(130, 30, 11, 28, c.col, 4.5, 14) + E(130, 32, 5, 18, PINK, 0, 14).replace(K(0), ""),
      head: () => HEAD(52, 90), front: (c) => E(100, 110, 20, 15, c.col2, 3.5), nose: () => E(100, 103, 6, 4.5, INK, 0), mouth: "dog", mouthY: 109, eyeGap: 38, defPattern: "pouch",
      back: (c) => tail("M124,186 C152,194 168,190 176,180", c.col) },
    seal: { name: "あざらし", cols: [["#D9DEE6", "#FFFFFF"], ["#B9C2CE", "#F4F6F8"], ["#E8E4DC", "#FFFFFF"], ["#9AA6B4", "#E8ECF0"]], noArms: true, feet: (c) => c.col,
      ears: () => "", head: () => HEAD(56, 88), front: (c) => E(100, 110, 26, 17, c.col2, 0).replace(K(0), ""),
      nose: () => E(100, 104, 6, 4.5, INK, 0), over: () => Ln("M76,110 L54,106 M76,116 L54,118 M124,110 L146,106 M124,116 L146,118", 2.2), mouth: "cat", mouthY: 110, eyeGap: 40,
      body: (c) => E(66, 162, 9, 18, c.col, 4.5, 30) + E(134, 162, 9, 18, c.col, 4.5, -30) },
  };
  function f2(n) { return Math.round(n * 10) / 10; }
  function isDark(h) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return r * 0.3 + g * 0.59 + b * 0.11 < 110; }

  // ---- 顔の ぶひん ----
  const EYE = ["dot", "shine", "oval", "sparkle", "sleepy", "lash", "smile", "button", "cool"];
  function eyes(style, emo, y, gap, col = INK) {
    const l = 100 - gap / 2, r = 100 + gap / 2, hi = col === INK ? "#FFFFFF" : INK;
    if (emo === "happy" || (style === "smile" && (emo === "normal" || !emo))) return Ln(`M${l - 7},${y + 2} Q${l},${y - 7} ${l + 7},${y + 2} M${r - 7},${y + 2} Q${r},${y - 7} ${r + 7},${y + 2}`, 3.5);
    if (emo === "sleep") return Ln(`M${l - 7},${y} Q${l},${y + 4} ${l + 7},${y} M${r - 7},${y} Q${r},${y + 4} ${r + 7},${y}`, 3.5);
    if (emo === "surprise") return C(l, y, 7.5, "#FFF", 3) + C(l, y + 1, 3.2, INK, 0) + C(r, y, 7.5, "#FFF", 3) + C(r, y + 1, 3.2, INK, 0);
    const one = (x, side) => {
      switch (style) {
        case "shine": return `<circle cx="${x}" cy="${y}" r="5" fill="${col}"/><circle cx="${x + 1.7}" cy="${y - 1.8}" r="1.7" fill="${hi}"/>`;
        case "oval": return `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="6.2" fill="${col}"/><circle cx="${x + 1.4}" cy="${y - 2.4}" r="1.5" fill="${hi}"/>`;
        case "sparkle": return `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="7.6" fill="${col}"/><circle cx="${x + 2}" cy="${y - 2.6}" r="2.5" fill="${hi}"/><circle cx="${x - 2.2}" cy="${y + 2.8}" r="1.2" fill="${hi}"/>`;
        case "sleepy": return `<path d="M${x - 6},${y - 1} A6,5 0 0 0 ${x + 6},${y - 1} Z" fill="${col}"/>` + Ln(`M${x - 7.5},${y - 1.5} L${x + 7.5},${y - 1.5}`, 2.6);
        case "lash": return `<circle cx="${x}" cy="${y}" r="4.6" fill="${col}"/><circle cx="${x + 1.5}" cy="${y - 1.6}" r="1.5" fill="${hi}"/>` + Ln(`M${x + side * 4},${y - 3.5} L${x + side * 8.5},${y - 7} M${x + side * 5},${y - 0.5} L${x + side * 9.5},${y - 1.5}`, 2.2);
        case "button": return `<circle cx="${x}" cy="${y}" r="6" fill="#FFFFFF" ${K(2.6)}/><circle cx="${x}" cy="${y + 0.5}" r="2.8" fill="${INK}"/>`;
        case "cool": return `<path d="M${x - 6},${y - 2} L${x + 6},${y - 2} A6,6 0 0 1 ${x - 6},${y - 2} Z" fill="${col}"/>`;
        default: return `<circle cx="${x}" cy="${y}" r="4" fill="${col}"/>`;
      }
    };
    let s = one(l, -1) + one(r, 1);
    if (emo === "sad") s += `<path d="M${l - 2},${y + 8} q-4,8 0,12 q4,-4 0,-12 Z M${r + 2},${y + 8} q-4,8 0,12 q4,-4 0,-12 Z" fill="#4FA3E0"/>`;
    return s;
  }
  function brows(style, emo, y, gap) {
    const l = 100 - gap / 2, r = 100 + gap / 2, t = y - 13;
    if (emo === "angry") return Ln(`M${l - 9},${t - 1} L${l + 6},${t + 5} M${r + 9},${t - 1} L${r - 6},${t + 5}`, 3.5);
    if (emo === "sad" || style === "worry") return Ln(`M${l - 7},${t + 3} L${l + 6},${t - 2} M${r + 7},${t + 3} L${r - 6},${t - 2}`, 3);
    switch (style) {
      case "soft": return Ln(`M${l - 7},${t + 1} Q${l},${t - 4} ${l + 7},${t + 1} M${r - 7},${t + 1} Q${r},${t - 4} ${r + 7},${t + 1}`, 2.6);
      case "thick": return `<path d="M${l - 8},${t} L${l + 7},${t - 1}" fill="none" ${K(5.5)}/><path d="M${r - 7},${t - 1} L${r + 8},${t}" fill="none" ${K(5.5)}/>`;
      case "up": return Ln(`M${l - 6},${t - 1} Q${l},${t - 7} ${l + 7},${t - 2} M${r - 7},${t - 2} Q${r},${t - 7} ${r + 6},${t - 1}`, 2.8);
      default: return "";
    }
  }
  function mouth(style, emo, y) {
    if (style === "none") return "";
    if (emo === "surprise") return `<ellipse cx="100" cy="${y + 2}" rx="4" ry="5" fill="#E57373" ${K(3)}/>`;
    if (emo === "sad") return Ln(`M93,${y + 4} Q100,${y - 1} 107,${y + 4}`, 3);
    if (emo === "angry") return Ln(`M93,${y + 2} L107,${y + 2}`, 3.5);
    if (emo === "sleep") return Ln(`M96,${y + 1} Q100,${y + 3} 104,${y + 1}`, 2.6);
    const happy = emo === "happy";
    switch (style) {
      case "cat": return Ln(`M90,${y} Q95,${y + 6} 100,${y} Q105,${y + 6} 110,${y}`, 3);
      case "dog": return Ln(`M100,${y - 2} L100,${y + 3} M100,${y + 3} Q94,${y + 9} 90,${y + 4} M100,${y + 3} Q106,${y + 9} 110,${y + 4}`, 3) + (happy ? `<path d="M96,${y + 6} Q100,${y + 13} 104,${y + 6} Z" fill="#E57373" ${K(2.2)}/>` : "");
      case "rabbit": return Ln(`M100,${y + 1} L94,${y + 8} M100,${y + 1} L106,${y + 8}`, 3);
      case "frog": return happy ? `<path d="M70,${y - 2} Q100,${y + 24} 130,${y - 2} Q100,${y + 8} 70,${y - 2} Z" fill="#E57373" ${K(3.5)}/>` : Ln(`M70,${y - 2} Q100,${y + 18} 130,${y - 2}`, 3.5);
      case "sheep": return Ln(`M100,${y} L100,${y + 4} M100,${y + 4} Q95,${y + 8} 92,${y + 5} M100,${y + 4} Q105,${y + 8} 108,${y + 5}`, 2.5);
      case "teeth": return Ln(`M92,${y} Q100,${y + 6} 108,${y}`, 3) + `<rect x="96" y="${y + 2}" width="8" height="6" rx="1.5" fill="#FFFFFF" ${K(2)}/>`;
      case "wide": return happy ? `<path d="M80,${y - 4} Q100,${y + 12} 120,${y - 4} Z" fill="#E57373" ${K(3)}/>` : Ln(`M80,${y - 3} Q100,${y + 8} 120,${y - 3}`, 3.2);
      case "smile": return happy ? `<path d="M90,${y - 2} Q100,${y + 11} 110,${y - 2} Z" fill="#E57373" ${K(2.8)}/>` : Ln(`M91,${y - 1} Q100,${y + 7} 109,${y - 1}`, 3);
      case "open": return `<path d="M91,${y - 2} Q100,${y + 12} 109,${y - 2} Z" fill="#E57373" ${K(2.8)}/>`;
      case "flat": return happy ? Ln(`M91,${y} Q100,${y + 6} 109,${y}`, 3) : Ln(`M93,${y + 1} L107,${y + 1}`, 3);
      case "o": return `<ellipse cx="100" cy="${y + 2}" rx="3" ry="3.6" fill="#E57373" ${K(2.4)}/>`;
      case "grin": return `<path d="M88,${y - 2} Q100,${y + 10} 112,${y - 2} Z" fill="#FFFFFF" ${K(2.8)}/>` + Ln(`M92,${y + 1} L108,${y + 1}`, 1.8);
      default: return happy ? Ln(`M94,${y} Q100,${y + 6} 106,${y}`, 3) : Ln(`M96,${y + 1} Q100,${y + 4} 104,${y + 1}`, 2.8);
    }
  }
  const MOUTH = ["smile", "open", "flat", "o", "grin"]; // 種の きほんの 口の かわりに つかえる もの（くちばしの 種は なし）
  const CHEEK = ["pink", "peach", "rose", "freckle", "line", "none"];
  function cheeks(style, y, gap) {
    const l = 100 - gap / 2, r = 100 + gap / 2;
    switch (style) {
      case "pink": return `<ellipse cx="${l}" cy="${y}" rx="8" ry="5" fill="${PINK}" fill-opacity="0.8"/><ellipse cx="${r}" cy="${y}" rx="8" ry="5" fill="${PINK}" fill-opacity="0.8"/>`;
      case "peach": return `<ellipse cx="${l}" cy="${y}" rx="9" ry="5.5" fill="#FFB38A" fill-opacity="0.7"/><ellipse cx="${r}" cy="${y}" rx="9" ry="5.5" fill="#FFB38A" fill-opacity="0.7"/>`;
      case "rose": return `<circle cx="${l}" cy="${y}" r="5" fill="#FF7F9E" fill-opacity="0.65"/><circle cx="${r}" cy="${y}" r="5" fill="#FF7F9E" fill-opacity="0.65"/>`;
      case "freckle": return [-5, 0, 5].map((d, i) => `<circle cx="${l + d}" cy="${y + (i === 1 ? -2 : 1)}" r="1.6" fill="#A0664A"/><circle cx="${r + d}" cy="${y + (i === 1 ? -2 : 1)}" r="1.6" fill="#A0664A"/>`).join("");
      case "line": return Ln(`M${l - 6},${y + 2} L${l - 3},${y - 3} M${l},${y + 2} L${l + 3},${y - 3} M${r - 3},${y + 2} L${r},${y - 3} M${r + 3},${y + 2} L${r + 6},${y - 3}`, 2).replace(`stroke="${INK}"`, 'stroke="#F06292"');
      default: return "";
    }
  }
  // 毛の もよう（頭 と 体の 形で きりぬく）
  const PATTERN = ["none", "patch", "spots", "stripes", "socks", "mask", "belly", "forehead", "calico", "blaze", "heart"];
  function headPattern(p, c, uid) {
    const k = c.col3;
    switch (p) {
      case "patch": return `<ellipse cx="122" cy="84" rx="20" ry="17" fill="${k}"/>`;
      case "spots": return `<ellipse cx="70" cy="62" rx="12" ry="9" fill="${k}"/><ellipse cx="134" cy="112" rx="9" ry="7" fill="${k}"/><circle cx="124" cy="52" r="6" fill="${k}"/>`;
      case "stripes": return Ln("M88,33 L92,50 M100,31 L100,50 M112,33 L108,50", 5).replace(`stroke="${INK}"`, `stroke="${k}"`) + Ln("M46,86 L62,90 M46,100 L60,100 M154,86 L138,90 M154,100 L140,100", 4.5).replace(`stroke="${INK}"`, `stroke="${k}"`);
      case "mask": return `<path d="M50,82 C60,70 80,74 100,86 C120,74 140,70 150,82 C146,98 132,102 118,98 L100,94 L82,98 C68,102 54,98 50,82 Z" fill="${k}"/>`;
      case "forehead": return `<path d="M100,46 L108,56 L100,66 L92,56 Z" fill="${k}"/>`;
      case "heart": return `<path d="M100,66 C92,58 84,52 88,46 C91,42 97,43 100,48 C103,43 109,42 112,46 C116,52 108,58 100,66 Z" fill="${k}"/>`;
      case "calico": return `<ellipse cx="72" cy="58" rx="24" ry="20" fill="${c.col2}"/><ellipse cx="132" cy="64" rx="20" ry="18" fill="${k}"/>`;
      case "blaze": return `<path d="M94,32 C96,52 94,70 92,92 L108,92 C106,70 104,52 106,32 Z" fill="${k}"/>`;
      default: return "";
    }
  }
  function bodyPattern(p, c) {
    const k = c.col3;
    switch (p) {
      case "belly": return `<ellipse cx="100" cy="168" rx="17" ry="22" fill="${c.col2}"/>`;
      case "pouch": return `<ellipse cx="100" cy="168" rx="18" ry="22" fill="${c.col2}"/>` + Ln("M86,168 Q100,178 114,168", 2.6);
      case "spots": return `<ellipse cx="88" cy="150" rx="9" ry="7" fill="${k}"/><ellipse cx="112" cy="178" rx="8" ry="6" fill="${k}"/>`;
      case "stripes": return Ln("M78,150 L90,154 M78,168 L90,170 M122,150 L110,154 M122,168 L110,170", 4.5).replace(`stroke="${INK}"`, `stroke="${k}"`);
      case "calico": return `<ellipse cx="112" cy="160" rx="12" ry="10" fill="${k}"/>`;
      default: return "";
    }
  }
  // まえがみ・あたまの かざり（服では ない もの）
  const TUFT = ["none", "curl", "spike", "bang", "leaf", "bow", "flower", "cowlick", "mustache"];
  function tuft(t, c) {
    const acc = c.acc || "#F06292";
    switch (t) {
      case "curl": return Ln("M100,34 C92,22 104,14 110,22 C114,28 106,32 102,28", 4);
      case "spike": return P("M84,38 L88,20 L96,34 L102,16 L108,34 L116,20 L118,38 Z", c.col3 && c.look.pattern !== "none" ? c.col3 : c.col, 3.5);
      case "bang": return P("M70,50 C78,34 122,34 130,50 C122,48 116,56 110,50 C104,58 96,58 90,50 C84,56 76,50 70,50 Z", c.col3 || c.col, 3.5);
      case "leaf": return P("M100,34 C96,18 110,8 122,12 C120,26 110,34 100,34 Z", "#7CC468", 3) + Ln("M100,34 L114,18", 2.2);
      case "bow": return P("M126,40 L112,32 L112,48 Z", acc, 3) + P("M126,40 L140,32 L140,48 Z", acc, 3) + C(126, 40, 4, acc, 3);
      case "flower": return [0, 72, 144, 216, 288].map((a) => C(f2(130 + Math.cos((a * Math.PI) / 180) * 6), f2(42 + Math.sin((a * Math.PI) / 180) * 6), 5, "#FFFFFF", 2.4)).join("") + C(130, 42, 3.4, "#FFD54F", 2);
      case "cowlick": return Ln("M100,33 C98,22 104,18 108,20", 4);
      case "mustache": return P("M100,110 C92,106 82,108 78,116 C86,114 94,116 100,112 C106,116 114,114 122,116 C118,108 108,106 100,110 Z", c.col3 || "#FFFFFF", 2.6);
      default: return "";
    }
  }

  // ---- 1人ぶんの 絵 ----
  function svg(spec) {
    const sp = SP[spec.sp] ? spec.sp : "cat", S = SP[sp], look = spec.look || {};
    const pat0 = look.pattern || (spec.stripe ? (sp === "cat" ? "stripes" : "stripes") : S.defPattern || "none");
    const c = { col: spec.col || S.cols[0][0], col2: spec.col2 || S.cols[0][1], look: { ...look, pattern: pat0 }, acc: look.acc };
    c.col3 = look.col3 || S.defCol3 || (spec.stripe ? shade(c.col, 0.72) : shade(c.col, 0.62));
    const dir = spec.dir || "down", view = dir === "up" ? "back" : dir === "down" ? "front" : "side";
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
    const feetCol = typeof S.feet === "function" ? S.feet(c) : S.feet || c.col, armCol = S.arms ? S.arms(c) : c.col;
    const feet = [
      `<g transform="${tr[0]}"><ellipse cx="87" cy="199" rx="11" ry="9" fill="${pat0 === "socks" ? c.col2 : feetCol}" ${K()}/></g>`,
      `<g transform="${tr[1]}"><ellipse cx="113" cy="199" rx="11" ry="9" fill="${pat0 === "socks" ? c.col2 : feetCol}" ${K()}/></g>`,
    ].join("");
    const gesture = spec.gesture || "none";
    const angles = {wave:[0,-125],wave_low:[0,-85],stretch:[115,-115],think:[0,-65],yawn:[0,-80],shy:[55,-55],laugh:[30,-30],admire:[25,-25],bow:[12,-12],look:[0,0],talk:[0,-55]}[gesture] || [0,0];
    const arms = S.noArms ? "" : NPC_PROFILE.arms.map((a,i) => `<g transform="rotate(${angles[i]} ${a.cx} ${a.cy-10})"><ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" transform="rotate(${a.rot} ${a.cx} ${a.cy})" fill="${pat0 === "socks" ? c.col2 : armCol}" ${K()}/></g>`).join("");
    const belly = S.belly && view !== "back" ? `<ellipse cx="100" cy="166" rx="18" ry="24" fill="${S.belly}" ${K(3)}/>` : "";
    const torso = NPC_PROFILE.torsoPath;
    const bpat = bodyPattern(pat0, c);
    let body = (view === "back" || !S.back ? "" : S.back(c)) + arms + L.sleeve + (S.body ? S.body(c) : "") +
      `<path d="${torso}" fill="${c.col}"/>` + (bpat ? `<g clip-path="url(#torso${uid})">${bpat}</g>` : "") + `<path d="${torso}" fill="none" ${K()}/>` + belly + L.torso;
    // 頭: うしろ（耳）→ ぬり → もよう（頭の 形で きりぬき）→ 線 → 口もと → 顔
    const shape = S.head(c);
    const hpat = view === "back" ? "" : headPattern(pat0, c, uid);
    let head = S.ears(c) + shape.replace("/>", ` fill="${c.col}"/>`) + (hpat ? `<g clip-path="url(#nh${uid})">${hpat}</g>` : "") + shape.replace("/>", ` fill="none" ${K()}/>`);
    if (view !== "back") {
      const y = S.eyeY || 90, gap = S.eyeGap || 36, emo = spec.emo || "normal", onDark = S.eyeOnDark || (S.dark && S.dark(c)); // くろい 地の 上は 白い ボタンの 目
      let face = (S.front ? S.front(c) : "") + eyes(onDark ? "button" : look.eye || S.eyeDef || "dot", emo, y, gap) + brows(look.brow, emo, y, gap) +
        (S.nose ? S.nose(c) : "") + mouth(S.mouth === "none" || S.mouth === "frog" || S.mouth === "wide" ? S.mouth : look.mouth || S.mouth, gesture === "yawn" ? "surprise" : emo, S.mouthY || 110) +
        cheeks(look.cheek || "pink", S.cheekY || 104, S.cheekGap || 60) + (S.over ? S.over(c) : "") + tuft(look.tuft, c);
      if (ctx.dx) face = `<g transform="translate(${ctx.dx},0)">${face}</g>`;
      head += face;
    } else {
      if (S.back && S.back(c)) head += `<g transform="translate(-24,-4)">${S.back(c)}</g>`;
      if (look.tuft && ["bow", "flower", "leaf", "spike", "curl", "cowlick"].includes(look.tuft)) head += tuft(look.tuft, c);
    }
    const headTilt = {think:-7,yawn:8,shy:9,bow:12,look:-8,admire:-6}[gesture] || 0;
    let inner = `<g transform="${tr[2]}">${L.behind}</g>${feet}<g transform="${tr[2]}">${body}<g transform="rotate(${headTilt} 100 140)">${head}${L.top}</g></g>`;
    if (dir === "right") inner = `<g transform="matrix(-1,0,0,1,200,0)">${inner}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbChar}"><defs><clipPath id="torso${uid}"><path d="${torso}"/></clipPath><clipPath id="nh${uid}">${shape}</clipPath></defs>${inner}</svg>`;
  }
  // 色を こく／うすく（k < 1 で こく）
  function shade(h, k) {
    const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const out = k < 1 ? v.map((x) => Math.round(x * k)) : v.map((x) => Math.round(x + (255 - x) * (k - 1)));
    return "#" + out.map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  // これまでの SPECIES に 名前と きほんの 色を のせる（ほかの ファイルは SPECIES[sp].name・col を みる）
  for (const [id, s] of Object.entries(SP)) SPECIES[id] = { ...(SPECIES[id] || {}), name: s.name, col: s.cols[0][0], col2: s.cols[0][1] };
  return { SP, EYE, MOUTH, CHEEK, PATTERN, TUFT, BROW: ["none", "soft", "thick", "up", "worry"], svg, shade };
})();
Art.npcSvg = NpcArt.svg;
