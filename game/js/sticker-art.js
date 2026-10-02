// シールの 絵（Meeときょれじゃ 4F の シールの ガチャ・すまほの「シール」の シールちょう。UI-53）。
// ・シールは 100×100。しろい ふちどり（ダイカット）・したの かげ・線は INK。3しゅの てざわり: ぷっくり（つやの ひかり）・ふわふわ（ふちに けの つぶ）・うるうる（ゼリーの ような 2ほんの ひかり）。
// ・シート（ガチャの けいひん）は 100×110 の だいし に シールが 4まい。ページ（シールちょう）は 300×360 の かみ 6しゅ（ひだりに ミニ 6あなの あな）。
// ・どれも この ゲームの ための オリジナルの 絵（しょうひんの なまえや 絵は つかわない）。SVG の id は つかわない（グラデーション なし）。キャラの 絵は よぶ たびに あたらしい id（Chara.svg の uid）。
const StickerArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.4) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMid meet" `);
  const place = (s, x, y, w, h) => s.replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" `);
  // ダイカット: かたち（path の d）の まわりを しろく ふとく ふちどって から なかを ぬる
  const cut = (d, fill, inner = "", o = {}) => {
    const w = o.rim || 9;
    return `<path d="${d}" fill="#00000018" transform="translate(1.6 2.6)" stroke="#00000018" stroke-width="${w}" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="#FFFFFF" stroke="#D9D2C6" stroke-width="${w + 1.2}" stroke-linejoin="round" opacity="0.55"/>`
      + `<path d="${d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="${w}" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="${fill}" ${sk(2.2)}/>` + inner;
  };
  // てざわり
  const puff = (cx, cy, r) => `<path d="M${f1(cx - r * 0.62)},${f1(cy - r * 0.18)} q${f1(r * 0.12)} ${f1(-r * 0.5)} ${f1(r * 0.62)} ${f1(-r * 0.6)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(3, r * 0.16))}" stroke-linecap="round" opacity="0.85"/>`
    + `<circle cx="${f1(cx - r * 0.5)}" cy="${f1(cy - r * 0.62)}" r="${f1(Math.max(1.6, r * 0.07))}" fill="#FFFFFF" opacity="0.9"/>`;
  const fluff = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + 0.2; return `<circle cx="${f1(cx + Math.cos(a) * (r - 3.4))}" cy="${f1(cy + Math.sin(a) * (r - 3.4))}" r="${f1(1.4 + (i % 3) * 0.4)}" fill="#FFFFFF" opacity="0.55"/>`; }).join("")
    + `<path d="M${f1(cx - r * 0.55)},${f1(cy - r * 0.3)} q${f1(r * 0.15)} ${f1(-r * 0.36)} ${f1(r * 0.5)} ${f1(-r * 0.46)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(2.4, r * 0.11))}" stroke-linecap="round" opacity="0.75"/>`;
  const gloss = (cx, cy, r) => `<path d="M${f1(cx - r * 0.7)},${f1(cy - r * 0.05)} q${f1(r * 0.08)} ${f1(-r * 0.6)} ${f1(r * 0.68)} ${f1(-r * 0.7)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(3.4, r * 0.18))}" stroke-linecap="round" opacity="0.9"/>`
    + `<path d="M${f1(cx + r * 0.36)},${f1(cy + r * 0.52)} q${f1(r * 0.22)} ${f1(-r * 0.1)} ${f1(r * 0.3)} ${f1(-r * 0.34)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(2.2, r * 0.1))}" stroke-linecap="round" opacity="0.7"/>`
    + `<ellipse cx="${f1(cx - r * 0.42)}" cy="${f1(cy - r * 0.6)}" rx="${f1(Math.max(1.8, r * 0.08))}" ry="${f1(Math.max(1.4, r * 0.06))}" fill="#FFFFFF"/>`;
  const circle = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)} a${f1(r)},${f1(r)} 0 1,0 ${f1(r * 2)},0 a${f1(r)},${f1(r)} 0 1,0 ${f1(-r * 2)},0 Z`;
  const heartD = (cx, cy, s) => `M${f1(cx)},${f1(cy + 26 * s)} C${f1(cx - 34 * s)},${f1(cy + 2 * s)} ${f1(cx - 26 * s)},${f1(cy - 24 * s)} ${f1(cx)},${f1(cy - 10 * s)} C${f1(cx + 26 * s)},${f1(cy - 24 * s)} ${f1(cx + 34 * s)},${f1(cy + 2 * s)} ${f1(cx)},${f1(cy + 26 * s)} Z`;
  const starD = (cx, cy, R, r) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, l = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + Math.cos(a) * l) + "," + f1(cy + Math.sin(a) * l); } return d + "Z"; };
  const cheeks = (cx, cy, dx, s = 1) => `<ellipse cx="${f1(cx - dx)}" cy="${f1(cy)}" rx="${f1(4 * s)}" ry="${f1(2.4 * s)}" fill="#F7A0B4" opacity="0.8"/><ellipse cx="${f1(cx + dx)}" cy="${f1(cy)}" rx="${f1(4 * s)}" ry="${f1(2.4 * s)}" fill="#F7A0B4" opacity="0.8"/>`;
  const eyes = (cx, cy, dx, s = 1, o = {}) => o.happy
    ? `<path d="M${f1(cx - dx - 3.4 * s)},${f1(cy + 1)} q${f1(3.4 * s)} ${f1(-4 * s)} ${f1(6.8 * s)} 0 M${f1(cx + dx - 3.4 * s)},${f1(cy + 1)} q${f1(3.4 * s)} ${f1(-4 * s)} ${f1(6.8 * s)} 0" fill="none" ${sk(2.2 * s)}/>`
    : `<circle cx="${f1(cx - dx)}" cy="${f1(cy)}" r="${f1(3 * s)}" fill="${K}"/><circle cx="${f1(cx + dx)}" cy="${f1(cy)}" r="${f1(3 * s)}" fill="${K}"/><circle cx="${f1(cx - dx + 1 * s)}" cy="${f1(cy - 1.1 * s)}" r="${f1(1.1 * s)}" fill="#FFFFFF"/><circle cx="${f1(cx + dx + 1 * s)}" cy="${f1(cy - 1.1 * s)}" r="${f1(1.1 * s)}" fill="#FFFFFF"/>`;
  const mouth = (cx, cy, s = 1) => `<path d="M${f1(cx - 3.6 * s)},${f1(cy)} q${f1(1.8 * s)} ${f1(2.4 * s)} ${f1(3.6 * s)} 0 q${f1(1.8 * s)} ${f1(2.4 * s)} ${f1(3.6 * s)} 0" fill="none" ${sk(1.8 * s)}/>`;
  const hero = (who, face = "smile") => Chara.svg(who, { pose: "idle_01", face, dir: "down", outfit: {}, color: "soft" });
  const npc = (sp, emo = "happy") => Art.npcSvg({ sp, emo, pose: "idle_01", dir: "down" });
  // かおの シール（キャラの あたまを まるい ふちの なかに）
  const headCrop = { wanko: "2 -16 196 172", gachan: "24 -2 152 152", goji: "2 -12 196 170" };
  const faceSticker = (img, crop, bg, tex) => svg(cut(circle(50, 50, 38), bg) + nest(img, 15, 14, 70, 66, crop) + tex(50, 50, 38));

  const FIG = {
    // ---- ぷっくり シール（3人の かお・ハート・おほしさま。レアは 3人 いっしょ）----
    stk_wanko: () => faceSticker(hero("wanko"), headCrop.wanko, "#BFE6F7", puff),
    stk_gachan: () => faceSticker(hero("gachan"), headCrop.gachan, "#FFF1B8", puff),
    stk_goji: () => faceSticker(hero("goji"), headCrop.goji, "#E3D9F5", puff),
    stk_heart: () => svg(cut(heartD(50, 50, 1.32), "#FF8FB0") + puff(40, 46, 22) + eyes(50, 52, 10, 1.1) + cheeks(50, 59, 17, 1.1) + mouth(50, 60, 1.1)),
    stk_star: () => svg(cut(starD(50, 53, 44, 21), "#FFD966") + puff(46, 44, 26) + eyes(50, 55, 9, 1, { happy: true }) + cheeks(50, 62, 14, 1)),
    stk_trio: () => { // レア: 3人 いっしょ（くもの かたち）
      const d = "M16,66 C4,64 4,44 18,42 C18,26 36,20 46,30 C52,18 72,18 78,32 C94,30 98,52 86,60 C92,74 76,82 66,76 C58,86 36,86 30,76 C20,80 10,74 16,66 Z";
      return svg(cut(d, "#FFE2EE") + nest(hero("wanko"), 8, 30, 34, 34, headCrop.wanko) + nest(hero("gachan"), 33, 22, 34, 34, headCrop.gachan) + nest(hero("goji"), 58, 30, 34, 34, headCrop.goji) + puff(38, 40, 30));
    },
    // ---- ふわふわ シール（どうぶつ。レアは ユニコーン）----
    stk_cat: () => faceSticker(npc("cat"), "4 -8 192 176", "#FFE7C7", fluff),
    stk_rabbit: () => faceSticker(npc("rabbit"), "4 -40 192 196", "#FFE2EE", fluff),
    stk_bear: () => faceSticker(npc("bear"), "4 -8 192 176", "#F2E3CF", fluff),
    stk_panda: () => faceSticker(npc("panda"), "4 -8 192 176", "#E9F6E4", fluff),
    stk_chick: () => svg(cut(circle(50, 54, 34), "#FFE680") + fluff(50, 54, 34) + `<path d="M40,22 q4 -10 10 -2 q6 -8 10 2" fill="#FFE680" ${sk(2)}/>` + eyes(50, 50, 11, 1.1) + `<path d="M44,58 L50,64 L56,58 Z" fill="#F7A23B" ${sk(1.8)}/>` + cheeks(50, 60, 20)),
    stk_unicorn: () => svg(cut(circle(50, 56, 32), "#FFFFFF") + fluff(50, 56, 32) + `<path d="M50,8 L57,30 L43,30 Z" fill="#FFD966" ${sk(2)}/><path d="M46,20 L54,17 M45,25 L55,22" ${sk(1.4)}/>`
      + `<path d="M22,40 C14,52 18,70 26,76 C24,62 28,50 34,44 Z" fill="#C9B6EE" ${sk(2)}/><path d="M78,40 C86,52 82,70 74,76 C76,62 72,50 66,44 Z" fill="#9FD3F0" ${sk(2)}/>`
      + `<path d="M34,30 L30,18 L42,26 Z M66,30 L70,18 L58,26 Z" fill="#FFFFFF" ${sk(2)}/>` + eyes(50, 56, 11, 1, { happy: true }) + cheeks(50, 64, 19) + mouth(50, 66)),
    // ---- うるうる シール（おかし。レアは にじいろ パフェ）----
    stk_strawberry: () => svg(cut("M50,90 C24,76 16,50 22,36 C28,24 42,24 50,30 C58,24 72,24 78,36 C84,50 76,76 50,90 Z", "#FF6F7D") + `<path d="M34,26 C40,14 46,22 50,28 C54,22 60,14 66,26 C58,30 42,30 34,26 Z" fill="#7CC36B" ${sk(2)}/>` + [[36, 46], [50, 44], [64, 46], [42, 60], [58, 60], [50, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#FFF3B8"/>`).join("") + gloss(48, 52, 28)),
    stk_icecream: () => svg(cut("M36,52 L50,92 L64,52 Z", "#F2B66B") + cut("M28,54 C22,40 34,28 42,30 C44,16 64,16 64,30 C76,28 80,46 72,54 Z", "#FFD1E3") + `<path d="M40,58 L60,58 M42,66 L58,66 M45,74 L55,74" stroke="#D99A4E" stroke-width="2"/>` + eyes(50, 42, 8, 0.9) + cheeks(50, 47, 14, 0.9) + gloss(48, 38, 20)),
    stk_candy: () => svg(cut("M14,38 L28,46 L28,56 L14,64 Z M86,38 L72,46 L72,56 L86,64 Z", "#9FD3F0") + cut(circle(50, 51, 24), "#FFE680") + `<path d="M34,40 q16 -6 30 10 M32,56 q18 10 34 -4" fill="none" stroke="#FF8FB0" stroke-width="5" stroke-linecap="round"/>` + gloss(50, 51, 24)),
    stk_donut: () => svg(cut(`${circle(50, 52, 36)} ${circle(50, 52, 11)}`, "#E8B06A") + `<path d="M18,48 C18,26 82,26 82,48 C76,56 70,50 64,58 C58,64 54,58 50,62 C46,58 40,64 34,58 C28,50 22,56 18,48 Z" fill="#F59AC0" ${sk(2)}/>` + `<circle cx="50" cy="52" r="11" fill="#FFFFFF" ${sk(2)}/>` + [[30, 38, "#FFFFFF"], [42, 30, "#9FD3F0"], [62, 32, "#FFE680"], [72, 42, "#FFFFFF"]].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="7" height="2.6" rx="1.3" fill="${c}" transform="rotate(${i * 40 - 30} ${x} ${y})"/>`).join("") + gloss(46, 46, 30)),
    stk_macaron: () => svg(cut("M14,44 C14,22 86,22 86,44 L86,46 C86,50 14,50 14,46 Z M14,58 L86,58 C86,80 14,80 14,58 Z", "#B9E3C9") + `<rect x="17" y="47" width="66" height="10" rx="4" fill="#FFF6E8" ${sk(2)}/>` + eyes(50, 66, 9, 0.9) + cheeks(50, 71, 15, 0.9) + gloss(48, 38, 26)),
    stk_parfait: () => svg(cut("M30,40 L70,40 L62,76 L38,76 Z", "#E9F6FB")
      + [["#FF8FB0", 46], ["#FFE680", 54], ["#9FD3F0", 62], ["#C9B6EE", 70]].map(([c, y]) => `<path d="M${f1(30 + (y - 40) * 0.22)},${y} L${f1(70 - (y - 40) * 0.22)},${y} L${f1(70 - (y - 32) * 0.22)},${y + 8} L${f1(30 + (y - 32) * 0.22)},${y + 8} Z" fill="${c}" opacity="0.9"/>`).join("")
      + `<path d="M30,40 L70,40 L62,76 L38,76 Z" fill="none" ${sk(2.2)}/><rect x="44" y="76" width="12" height="10" fill="#E9F6FB" ${sk(2)}/><rect x="34" y="86" width="32" height="6" rx="3" fill="#E9F6FB" ${sk(2)}/>`
      + cut("M28,40 C26,26 40,20 50,26 C60,20 74,26 72,40 Z", "#FFFFFF", "", { rim: 6 }) + `<circle cx="50" cy="20" r="7" fill="#FF6F7D" ${sk(2)}/><path d="M50,13 q4 -6 8 -4" fill="none" ${sk(1.6)}/>` + gloss(44, 56, 18)),
  };
  // シール 1まい（100×100）
  const piece = (id) => (FIG[id] ? FIG[id]() : "");

  // ---- シート（ガチャの けいひん・100×110）。だいしに シールが 4まい（1まいめが おおきい）----
  const SLOTS = [[6, 14, 52, 52], [54, 18, 40, 40], [8, 64, 40, 40], [50, 60, 44, 44]];
  const sheet = (it, paper = "#FFF6FA", rare = false) => {
    const ids = (it.stickers || []).flatMap(([id, n]) => Array(n).fill(id)).slice(0, SLOTS.length);
    let s = `<ellipse cx="50" cy="106" rx="40" ry="3.4" fill="#4F465622"/>`;
    if (rare) { // レアの シート: ふちが なみなみ（ほかの かざりは つけない）
      s += `<rect x="4" y="4" width="92" height="100" rx="10" fill="${paper}" ${sk(2.2)}/>`;
      for (let k = 0; k < 10; k++) s += `<circle cx="${f1(9 + k * 9.1)}" cy="5" r="3.2" fill="${paper}" ${sk(1.4)}/><circle cx="${f1(9 + k * 9.1)}" cy="103" r="3.2" fill="${paper}" ${sk(1.4)}/>`;
      s += `<rect x="6" y="6" width="88" height="96" rx="8" fill="${paper}"/>`;
    } else s += `<rect x="4" y="4" width="92" height="100" rx="8" fill="${paper}" ${sk(2.2)}/>`;
    s += `<rect x="9" y="9" width="82" height="90" rx="5" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="3 3" opacity="0.9"/>`;
    ids.forEach((id, i) => { const [x, y, w, h] = SLOTS[i]; s += place(piece(id), x, y, w, h); });
    return svg(s, 100, 110);
  };

  // ---- シールちょうの ページ（300×360）。ひだりに ミニ 6あなの あな ----
  const rnd = (seed) => { let a = seed >>> 0; return () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296); };
  const holes = () => Array.from({ length: 6 }, (_, i) => `<circle cx="13" cy="${f1(52 + i * 51)}" r="5.4" fill="#FFFFFF" stroke="#CFC4B4" stroke-width="1.6"/>`).join("") + `<path d="M26,10 V350" stroke="#00000010" stroke-width="2"/>`;
  const heartP = (x, y, s, c) => `<path d="${heartD(x, y, s)}" fill="${c}"/>`;
  const PAPERS = [
    { id: "heart", name: "ハート", base: "#FFE6EF", draw: () => { const r = rnd(5); let s = ""; for (let i = 0; i < 26; i++) s += heartP(36 + r() * 254, 14 + r() * 336, 0.16 + r() * 0.16, i % 2 ? "#FFFFFF" : "#FFC2D6"); return s; } },
    { id: "dot", name: "みずたま", base: "#DDF1FB", draw: () => { let s = ""; for (let y = 0; y < 10; y++) for (let x = 0; x < 8; x++) s += `<circle cx="${f1(44 + x * 34 + (y % 2) * 17)}" cy="${f1(20 + y * 36)}" r="6" fill="#FFFFFF" opacity="0.85"/>`; return s; } },
    { id: "check", name: "チェック", base: "#FFF5CC", draw: () => { let s = ""; for (let x = 30; x < 300; x += 30) s += `<rect x="${x}" y="0" width="14" height="360" fill="#FFE07A" opacity="0.42"/>`; for (let y = 0; y < 360; y += 30) s += `<rect x="0" y="${y}" width="300" height="14" fill="#FFE07A" opacity="0.42"/>`; return s; } },
    { id: "leaf", name: "はっぱ", base: "#E4F4DC", draw: () => { const r = rnd(11); let s = ""; for (let i = 0; i < 20; i++) { const x = 40 + r() * 248, y = 14 + r() * 334, a = Math.round(r() * 180); s += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><path d="M0,-11 C8,-6 8,6 0,11 C-8,6 -8,-6 0,-11 Z" fill="${i % 3 ? "#BFE3A6" : "#9ED38A"}"/><path d="M0,-9 V9" stroke="#FFFFFF" stroke-width="1.2" opacity="0.8"/></g>`; } return s; } },
    { id: "yume", name: "ゆめ", base: "#ECE4FA", draw: () => { const r = rnd(17); let s = ""; for (let i = 0; i < 9; i++) { const x = 50 + r() * 220, y = 20 + r() * 320; s += `<path d="M${f1(x - 20)},${f1(y + 6)} q0 -12 12 -10 q6 -12 18 -4 q14 -2 12 12 Z" fill="#FFFFFF" opacity="0.9"/>`; } for (let i = 0; i < 6; i++) { const x = 46 + r() * 230, y = 26 + r() * 310; s += `<path d="M${f1(x)},${f1(y - 9)} a9 9 0 1 0 8 13 a7 7 0 1 1 -8 -13 Z" fill="#FFE9A8"/>`; } return s; } },
    { id: "note", name: "ノート", base: "#FFFDF6", draw: () => { let s = ""; for (let y = 34; y < 356; y += 22) s += `<path d="M26,${y} H300" stroke="#BFDDF2" stroke-width="1.4"/>`; return s + `<path d="M50,0 V360" stroke="#F5A3B5" stroke-width="1.6"/>`; } },
  ];
  const paper = (n) => { const P = PAPERS[((n % PAPERS.length) + PAPERS.length) % PAPERS.length]; return svg(`<rect width="300" height="360" fill="${P.base}"/>${P.draw()}${holes()}`, 300, 360); };

  // ---- ガチャの 台の かざり（シールの 台）: うえの まんなかに ハートの シール・りょうはしに まるい シール ----
  const topper = () => `<g transform="translate(70 -6) scale(0.4)">${cut(heartD(50, 50, 1.2), "#FF8FB0") + puff(42, 42, 28)}</g>`
    + [[30, 15, "#9FD3F0"], [150, 15, "#FFE680"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="#FFFFFF" stroke="#D9D2C6" stroke-width="1"/><circle cx="${x}" cy="${y}" r="6" fill="${c}" ${sk(1.4)}/>`).join("");
  return { FIG, piece, sheet, SLOTS, PAPERS, paper, topper, heartD, cut, puff };
})();
