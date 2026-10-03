// おねがいの おれいの しなの 絵（UI-70。しくみ・ことばは js/wish-gifts.js）。
// ふうとう（3人で いろと シールが ちがう・ふたは べつの 絵で ひらく）・びんせんの らくがき（クレヨン）・
// まちで ひろった いし 9しゅ（ハンカチの うえ）・おりがみの つる・クレヨンの え（かべ）・かたたたき けん・
// おこづかいで かった アクセサリー 6しゅの 服の かたち（WEAR.wg_*。hatWrap／neckWrap で 3人の あたま・くびに あわせる）。
// 線は INK。クレヨンの らくがきだけは こどもが かいた 絵 なので いろの 線。id は つかわない（グラデーション なし）。
const WishGiftArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // 3人の いろ（ふうとう・びんせん・クレヨンの もじ）
  const PAL = {
    wanko: { paper: "#DDEBFA", edge: "#9CC3E8", deep: "#6FA3D6", ink: "#2F6DB5", tape: "#F7C873" },
    gachan: { paper: "#FDE3EE", edge: "#F2A7C3", deep: "#E583A8", ink: "#D2477A", tape: "#9ED9D6" },
    goji: { paper: "#E3F2DC", edge: "#A9D49B", deep: "#7DBA6B", ink: "#3B8A3E", tape: "#F4B6C2" },
  };
  const pal = (who) => PAL[who] || PAL.wanko;

  // ---- ふうとう（viewBox 0 0 200 140）: うしろ・まえの ポケット・ふた（ひらく）----
  const ENV_W = 200, ENV_H = 140;
  const seal = (who) => {
    // ふたの さきの シール: わんこ にくきゅう・がちゃん ハート・ごじ きょうりゅうの あしあと
    if (who === "gachan") return `<circle cx="100" cy="76" r="15" fill="#FFFFFF" ${sk(2)}/><path d="${heartPath(100, 76, 1.45)}" fill="#FF7BA8" ${sk(1.8)}/><circle cx="96" cy="72" r="1.8" fill="#FFFFFF"/>`;
    if (who === "goji") return `<circle cx="100" cy="76" r="15" fill="#FFFFFF" ${sk(2)}/><path d="M100,86 C93,86 92,80 95,76 L91,66 C90,63 94,62 95,64 L99,72 L99,63 C99,60 103,60 103,63 L103,72 L107,64 C108,62 112,63 111,66 L106,76 C109,80 107,86 100,86 Z" fill="#6DBE5B" ${sk(1.6)}/>`;
    return `<circle cx="100" cy="76" r="15" fill="#FFFFFF" ${sk(2)}/><ellipse cx="100" cy="80" rx="6.4" ry="5.2" fill="#C98A52" ${sk(1.4)}/>`
      + [[-7, -3.5], [-2.6, -8], [2.6, -8], [7, -3.5]].map(([x, y]) => `<ellipse cx="${100 + x}" cy="${76 + y}" rx="2.6" ry="3.1" fill="#C98A52" ${sk(1.2)}/>`).join("");
  };
  const envBack = (who) => { const p = pal(who); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENV_W} ${ENV_H}"><rect x="2" y="2" width="196" height="136" rx="8" fill="${p.deep}" ${sk(3)}/><path d="M6,8 L100,70 L194,8" fill="none" stroke="${p.edge}" stroke-width="3" stroke-linecap="round"/></svg>`; };
  const envFront = (who, label = "") => {
    const p = pal(who);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENV_W} ${ENV_H}"><path d="M2,40 L100,98 L198,40 L198,130 C198,135 195,138 190,138 L10,138 C5,138 2,135 2,130 Z" fill="${p.paper}" ${sk(3)}/>`
      + `<path d="M4,134 L84,88 M196,134 L116,88" fill="none" stroke="${p.edge}" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M150,108 l8,-8 m-8,0 l8,8" stroke="${p.deep}" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="112" r="3" fill="${p.edge}"/><circle cx="52" cy="118" r="2" fill="${p.edge}"/>${label}</svg>`;
  };
  const envFlap = (who) => { const p = pal(who); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENV_W} ${ENV_H}"><path d="M2,10 C2,5 5,2 10,2 L190,2 C195,2 198,5 198,10 L100,82 Z" fill="${p.paper}" ${sk(3)}/><path d="M14,8 L100,70 L186,8" fill="none" stroke="${p.edge}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>${seal(who)}</svg>`; };
  // ちいさな ふうとう（たからものの いちらん・とじた まま）
  const envSmall = (who) => {
    const p = pal(who);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ENV_W} ${ENV_H}"><rect x="2" y="2" width="196" height="136" rx="8" fill="${p.paper}" ${sk(4)}/><path d="M4,134 L84,88 M196,134 L116,88" fill="none" stroke="${p.edge}" stroke-width="3" stroke-linecap="round"/><path d="M4,8 L100,80 L196,8" fill="${p.paper}" ${sk(4)}/>${seal(who)}</svg>`;
  };

  // ---- びんせんの らくがき（クレヨン・viewBox 0 0 80 64）----
  const cr = (c, w = 3.4) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const sun = (x, y, r, c = "#F2A33A", fill = "#FFD86B") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="0.8" ${cr(c, 2.6)}/>`
    + Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${f1(x + Math.cos(a) * (r + 3))},${f1(y + Math.sin(a) * (r + 3))} L${f1(x + Math.cos(a) * (r + 8))},${f1(y + Math.sin(a) * (r + 8))}" ${cr(c, 2.4)}/>`; }).join("");
  const DOODLE = {
    wanko: [
      // ほねと おひさま
      () => sun(62, 16, 8) + `<path d="M14,46 C10,42 12,36 17,38 C19,33 25,34 24,40 L44,40 C43,34 49,33 51,38 C56,36 58,42 54,46 C58,50 56,56 51,54 C49,59 43,58 44,52 L24,52 C25,58 19,59 17,54 C12,56 10,50 14,46 Z" fill="#FFF6E0" ${cr("#C98A52", 3)}/>`,
      // にくきゅうの あしあと
      () => [[16, 50], [34, 38], [52, 46], [68, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 3}" rx="5.4" ry="4.4" fill="#E9A15F" fill-opacity="0.85" ${cr("#B5733C", 2.2)}/>` + [[-5, -4], [-1.6, -7.4], [1.6, -7.4], [5, -4]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2" fill="#E9A15F" ${cr("#B5733C", 1.6)}/>`).join("")).join(""),
      // ボールと ほし
      () => `<circle cx="28" cy="40" r="15" fill="#FF8A80" fill-opacity="0.75" ${cr("#E0524A", 3)}/><path d="M14,36 C22,42 34,42 42,36 M28,25 C24,34 24,46 28,55" fill="none" ${cr("#FFFFFF", 2.6)}/><path d="${starPath(62, 22, 10, 4.4)}" fill="#FFE066" ${cr("#E0A82E", 2.4)}/>`,
    ],
    gachan: [
      // おはなと ハート
      () => `<path d="M24,62 C24,50 26,44 30,38" fill="none" ${cr("#5FAE5B", 3)}/><path d="M26,52 C18,50 16,44 20,42 C24,44 26,48 26,52 Z" fill="#9AD58F" ${cr("#5FAE5B", 2)}/>` + [0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${f1(30 + Math.cos(a) * 7)}" cy="${f1(30 + Math.sin(a) * 7)}" r="6" fill="#FF9EC0" fill-opacity="0.85" ${cr("#E0598B", 2.2)}/>`; }).join("") + `<circle cx="30" cy="30" r="4.4" fill="#FFE066" ${cr("#E0A82E", 2)}/><path d="${heartPath(62, 30, 1.7)}" fill="#FF7BA8" fill-opacity="0.85" ${cr("#D2477A", 2.6)}/>`,
      // メロンパン
      () => `<path d="M14,48 C14,30 66,30 66,48 C66,56 14,56 14,48 Z" fill="#FFE29A" ${cr("#D9A13A", 3)}/><path d="M24,36 L34,52 M36,33 L46,52 M48,34 L56,50 M22,46 L58,38 M20,52 L62,44" fill="none" ${cr("#E7B95A", 2)}/><path d="${heartPath(66, 18, 1.1)}" fill="#FF7BA8" ${cr("#D2477A", 2)}/>`,
      // リボンと ほし
      () => `<path d="M40,34 C30,22 14,24 16,34 C14,44 30,46 40,34 Z M40,34 C50,22 66,24 64,34 C66,44 50,46 40,34 Z" fill="#C8A8F0" fill-opacity="0.85" ${cr("#8E6CC9", 2.6)}/><circle cx="40" cy="34" r="5" fill="#B08CE0" ${cr("#8E6CC9", 2.2)}/><path d="M36,38 L30,54 M44,38 L50,54" fill="none" ${cr("#8E6CC9", 2.6)}/>` + [[12, 12], [68, 12], [70, 54]].map(([x, y]) => `<path d="${starPath(x, y, 5.4, 2.4)}" fill="#FFE066" ${cr("#E0A82E", 1.6)}/>`).join(""),
    ],
    goji: [
      // ちいさな きょうりゅう（ごじ）
      () => `<path d="M12,52 C12,36 24,26 38,28 C48,22 60,24 62,34 C64,42 56,46 50,44 C52,50 50,56 44,58 L18,58 C14,58 12,56 12,52 Z" fill="#A9B7AD" fill-opacity="0.85" ${cr("#5F7066", 3)}/><circle cx="54" cy="33" r="2.2" fill="#3A3A3A"/><path d="M26,28 L28,20 L32,27 M36,26 L39,18 L42,25" fill="#7DBA6B" ${cr("#4F8F45", 2.2)}/><path d="M50,40 C53,41 56,40 58,38" fill="none" ${cr("#5F7066", 2)}/>`,
      // プリン
      () => `<path d="M22,56 L28,30 C32,24 48,24 52,30 L58,56 Z" fill="#FFE082" ${cr("#D9A13A", 3)}/><path d="M28,30 C32,24 48,24 52,30 C50,36 30,36 28,30 Z" fill="#B57A3E" ${cr("#8D5524", 2.4)}/><path d="M16,58 L64,58" ${cr("#9AA3AB", 3)}/><circle cx="40" cy="20" r="4" fill="#FF6B6B" ${cr("#D84B4B", 2)}/>`,
      // きと おひさま
      () => `<path d="M30,60 L30,42" ${cr("#9C6B3E", 4)}/><circle cx="30" cy="32" r="14" fill="#8FD07F" fill-opacity="0.85" ${cr("#4F8F45", 3)}/><circle cx="24" cy="30" r="2.4" fill="#FF7B7B"/><circle cx="35" cy="36" r="2.4" fill="#FF7B7B"/>` + sun(64, 18, 7),
    ],
  };
  const doodle = (who, n = 0) => { const L = DOODLE[who] || DOODLE.wanko; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" aria-hidden="true">${L[((n % L.length) + L.length) % L.length]()}</svg>`; };

  // ---- まちで ひろった いし（家具・30×26・ハンカチの うえ）----
  // ハンカチ（ひしがたに おいた・ふちに ステッチ）。w×h の はこの したの ほう
  const kerchief = (w, fill, edge, pat) => {
    const L = [2, w.h - 7], F = [w.w / 2, w.h - 1.4], R = [w.w - 2, w.h - 7], B = [w.w / 2, w.h - 12.6];
    const P = (a) => a.map((v) => f1(v)).join(",");
    return `<path d="M${P(L)} L${P(F)} L${P(R)} L${P(B)} Z" fill="${fill}" ${sk(1.5)}/><path d="M${f1(L[0] + 2.6)},${f1(L[1])} L${f1(F[0])},${f1(F[1] - 1.6)} L${f1(R[0] - 2.6)},${f1(R[1])} L${f1(B[0])},${f1(B[1] + 1.6)} Z" fill="none" stroke="${edge}" stroke-width="0.8" stroke-dasharray="1.4 1.2"/>` + pat;
  };
  const CLOTH = {
    // わんこ: みずいろの ギンガム
    wanko: (w) => kerchief(w, "#D6E7F8", "#7FA9D6", `<path d="M${f1(w.w * 0.33)},${f1(w.h - 10.8)} L${f1(w.w * 0.67)},${f1(w.h - 3.2)} M${f1(w.w * 0.67)},${f1(w.h - 10.8)} L${f1(w.w * 0.33)},${f1(w.h - 3.2)}" stroke="#9DC0E6" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`),
    // がちゃん: ピンクに しろい みずたま
    gachan: (w) => kerchief(w, "#FBD3E1", "#E583A8", [[w.w * 0.36, -8], [w.w * 0.5, -5], [w.w * 0.64, -8], [w.w * 0.5, -10.6], [w.w * 0.3, -6.4], [w.w * 0.7, -6.4]].map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(w.h + y)}" r="0.9" fill="#FFFFFF"/>`).join("")),
    // ごじ: みどりに はっぱ
    goji: (w) => kerchief(w, "#D5EBC9", "#7DBA6B", `<path d="M${f1(w.w * 0.28)},${f1(w.h - 6.6)} C${f1(w.w * 0.3)},${f1(w.h - 9.4)} ${f1(w.w * 0.38)},${f1(w.h - 9.6)} ${f1(w.w * 0.4)},${f1(w.h - 8)} C${f1(w.w * 0.37)},${f1(w.h - 6.4)} ${f1(w.w * 0.31)},${f1(w.h - 5.8)} ${f1(w.w * 0.28)},${f1(w.h - 6.6)} Z M${f1(w.w * 0.72)},${f1(w.h - 6.6)} C${f1(w.w * 0.7)},${f1(w.h - 9.4)} ${f1(w.w * 0.62)},${f1(w.h - 9.6)} ${f1(w.w * 0.6)},${f1(w.h - 8)} C${f1(w.w * 0.63)},${f1(w.h - 6.4)} ${f1(w.w * 0.69)},${f1(w.h - 5.8)} ${f1(w.w * 0.72)},${f1(w.h - 6.6)} Z" fill="#8FC77F"/>`),
  };
  const SB = { w: 30, h: 26 }; // いしの はこ
  const hi = (x, y, rx = 3, ry = 1.8, op = 0.75) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FFFFFF" opacity="${op}" transform="rotate(-24 ${x} ${y})"/>`;
  const STONE = {
    // しろい わの いし（ねがいが かなう いし・わんこ）
    wg_stone_ring: () => `<path d="M5,14 C5,7 11,4 16,4 C23,4 26,9 26,14 C26,20 21,22 15,22 C9,22 5,20 5,14 Z" fill="#8E979F" ${sk(2)}/><path d="M9,5.6 C13,11 17,16 22,21" fill="none" stroke="#F6F3EA" stroke-width="2.6" stroke-linecap="round"/><path d="M9,5.6 C13,11 17,16 22,21" fill="none" stroke="#D7D2C6" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>${hi(11, 9)}<circle cx="19" cy="9" r="0.8" fill="#6F777E"/><circle cx="10" cy="17" r="0.7" fill="#6F777E"/>`,
    // ハートの いし（わんこ）
    wg_stone_heart: () => `<path d="${heartPath(15.5, 12.4, 1.55)}" fill="#D7B4AE" ${sk(2)}/><path d="M9.5,9 C10.4,7 12.2,6.4 13.4,7.4" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/><circle cx="18" cy="15" r="0.8" fill="#A9837D"/><circle cx="13" cy="17" r="0.6" fill="#A9837D"/>`,
    // まっしろ つるつるの いし（わんこ）
    wg_stone_white: () => `<ellipse cx="15.5" cy="13.5" rx="10.5" ry="8.2" fill="#F4F1EA" ${sk(2)}/><path d="M7,16 C10,20 20,21 25,15" fill="none" stroke="#D9D3C6" stroke-width="2" stroke-linecap="round"/>${hi(11, 10, 3.4, 2)}`,
    // みずいろの シーグラス（がちゃん）
    wg_seaglass: () => `<path d="M6,12 C6,7 10,5 15,5.4 C21,5.8 25,8 25,13 C25,18 21,21.4 15,21 C9,20.6 6,17 6,12 Z" fill="#A8E0DC" fill-opacity="0.9" ${sk(2)}/><path d="M9,11 C11,8 15,7.4 18,8" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>` + [[12, 15], [17, 13], [20, 17], [14, 18.6], [21, 11]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#FFFFFF" opacity="0.6"/>`).join(""),
    // ピンクの いし（がちゃん）
    wg_stone_pink: () => `<path d="M5.6,15 L9,6.4 L18,4.4 L25,9 L25.4,16 L19,21.4 L10,21 Z" fill="#F4B6C2" ${sk(2)}/><path d="M9,6.4 L13,13 L18,4.4 M13,13 L25,9 M13,13 L10,21 M13,13 L19,21.4 M13,13 L5.6,15" fill="none" stroke="#E08EA0" stroke-width="1" stroke-linejoin="round"/><path d="M10,8.4 L12.6,12" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>`,
    // にじいろの いし（がちゃん）
    wg_stone_opal: () => `<ellipse cx="15.5" cy="13.4" rx="10.4" ry="8.4" fill="#F7F4FB" ${sk(2)}/><path d="M8,12 C10,8 13,7.6 15,9 C13,11 11,12.6 8,12 Z" fill="#FFC6DA"/><path d="M16,8 C19,7 22,8.6 23,11 C20,12 18,11 16,8 Z" fill="#BDEBD8"/><path d="M10,16 C13,14 16,15 17,18 C14,19.4 11,18.6 10,16 Z" fill="#CFC2F4"/><path d="M18,15 C20,13.6 22.6,14 23.6,15.6 C22,18 19.6,18 18,15 Z" fill="#FFE8A8"/>${hi(10.6, 9.4, 2.6, 1.5)}`,
    // きらきらの いし（うんもが はいって いる・ごじ）
    wg_stone_mica: () => `<path d="M5,15 C4,9 9,5 15,5 C22,5 26,9 26,14 C26,20 21,22 15,22 C9,22 5.6,19.6 5,15 Z" fill="#BDB4A8" ${sk(2)}/>` + [[9, 10, "#6D655C"], [14, 16, "#6D655C"], [20, 10, "#6D655C"], [22, 17, "#8A8176"], [11, 18, "#8A8176"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="1" fill="${c}"/>`).join("") + [[16, 9], [10.6, 14], [20, 15]].map(([x, y]) => `<path d="M${x},${y - 1.8} L${x + 1},${y} L${x},${y + 1.8} L${x - 1},${y} Z" fill="#FFFFFF"/>`).join(""),
    // アンモナイトの いし（ごじ）
    wg_stone_ammonite: () => `<path d="M5,14 C5,7 10,4.4 15.5,4.4 C21,4.4 26,8 26,14 C26,19.6 21,22 15.5,22 C10,22 5,19.6 5,14 Z" fill="#D7BE97" ${sk(2)}/><path d="M15.5,13.6 C15.5,12.6 17,12.6 17,13.8 C17,15.6 14,15.6 14,13.4 C14,10.8 18.4,10.8 18.4,14 C18.4,17.4 12.6,17.4 12.6,13.2 C12.6,8.8 20,8.8 20,14 C20,19 10.8,19 10.8,13" fill="none" stroke="#A8865A" stroke-width="1.4" stroke-linecap="round"/>${hi(10, 8.6, 2.4, 1.4, 0.6)}`,
    // まっくろ まんまるの いし（ごじ）
    wg_stone_black: () => `<ellipse cx="15.5" cy="13.6" rx="9.6" ry="8.4" fill="#3E3B3A" ${sk(2)}/>${hi(11.6, 9.4, 3, 1.8, 0.8)}<path d="M20,17 C21.4,15.8 22,14.6 22.2,13.2" fill="none" stroke="#6A6664" stroke-width="1.2" stroke-linecap="round"/>`,
  };
  const stone = (id, who) => `<g>${(CLOTH[who] || CLOTH.wanko)(SB)}<g transform="translate(0 -4.4)">${(STONE[id] || STONE.wg_stone_white)()}</g></g>`;

  // ---- おりがみの つる（家具・34×30・ちょっと まがって いる）----
  const crane = () => `<ellipse cx="17" cy="27" rx="13" ry="2.4" fill="#4F465622"/>`
    + `<path d="M4,15 L14,20 L17,27 L20,20 L31,13 L21,16 L17,6 L13,16 Z" fill="#FF9EC0" ${sk(1.8)}/>`
    + `<path d="M13,16 L17,6 L21,16 L17,19 Z" fill="#FFC1D6" ${sk(1.4)}/><path d="M4,15 L2,8 L6,14 Z" fill="#FF9EC0" ${sk(1.4)}/><path d="M31,13 L33,6.6 L29.4,8 Z" fill="#FF9EC0" ${sk(1.4)}/>`
    + `<path d="M14,20 L17,27 L20,20" fill="none" stroke="#E0598B" stroke-width="1" stroke-linejoin="round"/><path d="M17,19 L17,27" stroke="#E0598B" stroke-width="0.9"/>`;
  // ---- クレヨンの え（かべ・56×44。マスキングテープで はって ある）----
  const drawing = () => {
    const kid = (x, body, ear) => `<circle cx="${x}" cy="27" r="5.6" fill="${body}" ${cr(ear, 1.4)}/><path d="M${x - 3},33 L${x - 3},38 M${x + 3},33 L${x + 3},38 M${x - 5},34 L${x + 5},34" fill="none" ${cr(ear, 1.4)}/><circle cx="${x - 1.8}" cy="26.4" r="0.8" fill="#3A3A3A"/><circle cx="${x + 1.8}" cy="26.4" r="0.8" fill="#3A3A3A"/>`;
    return `<rect x="3" y="3" width="50" height="38" rx="1.4" fill="#FFFDF6" ${sk(1.8)}/>`
      + `<rect x="1" y="0" width="12" height="5" fill="#F7C873" opacity="0.85" transform="rotate(-12 7 2.5)"/><rect x="43" y="0" width="12" height="5" fill="#9ED9D6" opacity="0.85" transform="rotate(12 49 2.5)"/>`
      + `<path d="M7,38 C18,36 38,36 49,38" fill="none" ${cr("#8FD07F", 2.4)}/>` + sun(44, 12, 3.6)
      + `<path d="M8,22 L15,15 L22,22 L22,32 L8,32 Z" fill="#FFD3B0" fill-opacity="0.85" ${cr("#E08A5A", 1.4)}/><path d="M13,32 L13,27 L17,27 L17,32" fill="none" ${cr("#E08A5A", 1.2)}/>`
      + kid(27, "#FFFFFF", "#7A7A7A") + `<path d="M22.6,23.4 C21.4,22 21.4,20.4 23,21.2 M31.4,23.4 C32.6,22 32.6,20.4 31,21.2" fill="none" ${cr("#3A3A3A", 1.2)}/>`
      + kid(37, "#FFE066", "#E0A82E") + `<path d="M36.4,28.6 L38.6,28.6 L37.5,30 Z" fill="#F2994A"/>`
      + kid(47, "#AEB8B0", "#5F7066") + `<path d="M44,21.4 L45,18.6 L46.4,21 M48,21 L49.4,18.4 L50.2,21.4" fill="#7DBA6B" ${cr("#4F8F45", 1)}/>`
      + `<path d="M30.4,31 L34.2,31 M40.4,31 L44.2,31" ${cr("#E0524A", 1.4)}/>` + `<path d="${heartPath(15, 9.4, 0.7)}" fill="#FF7BA8"/>`;
  };
  // ---- かたたたき けん（たからものの えと アイコン・viewBox 0 0 120 64）----
  const coupon = (used = 0, total = 10) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" aria-hidden="true"><rect x="3" y="3" width="114" height="58" rx="6" fill="#FFF3C8" ${sk(2.6)}/><rect x="7" y="7" width="106" height="50" rx="4" fill="none" stroke="#E9B44C" stroke-width="1.4" stroke-dasharray="3 2"/><path d="M88,8 L88,56" stroke="${K}" stroke-width="1.6" stroke-dasharray="3 3"/>`
    // わんこの にくきゅうの はんこ（あかい いんく）
    + `<ellipse cx="24" cy="38" rx="9" ry="7.4" fill="#F06D6D" opacity="0.9"/>` + [[-9.6, -7], [-3.4, -12.6], [3.4, -12.6], [9.6, -7]].map(([x, y]) => `<ellipse cx="${24 + x}" cy="${38 + y}" rx="3.6" ry="4.2" fill="#F06D6D" opacity="0.9"/>`).join("")
    // てがきの もじ（かたたたき けん）の かわりの なみせん
    + `<path d="M40,14 q3,-3 6,0 t6,0 t6,0 t6,0 t6,0 t6,0" fill="none" stroke="#C98A52" stroke-width="2" stroke-linecap="round"/>`
    + Array.from({ length: total }, (_, i) => { const x = 44 + (i % 5) * 9, y = 30 + Math.floor(i / 5) * 14; return `<path d="${heartPath(x, y, 0.66)}" fill="${i < used ? "#FF7BA8" : "#FFFFFF"}" stroke="#E0598B" stroke-width="1.2"/>`; }).join("")
    + `<path d="${heartPath(103, 32, 1.4)}" fill="#FF7BA8" ${sk(1.6)}/></svg>`;

  // ---- おこづかいで かった アクセサリー（WEAR に たす）----
  const pinBar = (s, x1, y1, x2, y2, c = "#F7C948") => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${K}" stroke-width="${f1(s * 1.3)}" stroke-linecap="round"/><path d="M${x1},${y1} L${x2},${y2}" stroke="${c}" stroke-width="${f1(s * 0.55)}" stroke-linecap="round"/>`;
  // ほねの ヘアピン（わんこ）
  WEAR.wg_bonepin = (ctx) => ({
    top: hatWrap(ctx, (s) => pinBar(s, 12, -2, 40, -16)
      + `<g transform="translate(30 -14) rotate(-24) scale(1.2)"><path d="M-13,-3 C-17,-8 -11,-12 -8.6,-7.4 L8.6,-7.4 C11,-12 17,-8 13,-3 C17,2 11,6 8.6,1.4 L-8.6,1.4 C-11,6 -17,2 -13,-3 Z" fill="#FFFDF5" ${stroke(s * 0.8)}/><path d="M-6,-5 L5,-5" stroke="#E8DFC9" stroke-width="${f1(s * 0.5)}" stroke-linecap="round"/></g>`),
  });
  // ビーズの ネックレス（わんこ）: おおきな いろとりどりの ビーズ
  WEAR.wg_beads = (ctx) => ({
    top: neckWrap(ctx, (s) => {
      const cols = ["#FF6B6B", "#FFD54F", "#64B5F6", "#81C784", "#F48FB1"], back = ctx.view === "back";
      const n = back ? 7 : 9, pts = Array.from({ length: n }, (_, i) => { const t = i / (n - 1), x = -40 + 80 * t; return [x, (back ? 2 : 6) + (back ? 6 : 20) * (1 - Math.pow(2 * t - 1, 2))]; });
      return `<path d="M-42,2 C-30,${back ? 10 : 26} 30,${back ? 10 : 26} 42,2" fill="none" stroke="${K}" stroke-width="${f1(s * 0.5)}"/>`
        + pts.map(([x, y], i) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${back ? 5.4 : 6.6}" fill="${cols[i % cols.length]}" ${stroke(s * 0.42)}/><circle cx="${f1(x - 1.8)}" cy="${f1(y - 1.8)}" r="1.6" fill="#FFFFFF" opacity="0.85"/>`).join("");
    }),
  });
  // おはなの ヘアピン（がちゃん）: ちいさな おはな 3つ
  WEAR.wg_flowerpin = (ctx) => ({
    top: hatWrap(ctx, (s) => pinBar(s, 14, -2, 42, -14) + flowerSvg(24, -10, 6.4, "#FF9EC0", "#FFE066", s * 0.55) + flowerSvg(37, -17, 5.4, "#FFFFFF", "#FFB74D", s * 0.55) + flowerSvg(36, -4, 4.6, "#B3E5FC", "#FFF59D", s * 0.5)),
  });
  // ひよこの ペンダント（がちゃん）: ほそい きんの くさり・ちいさな ひよこ（がちゃんと おそろい）
  WEAR.wg_chick = (ctx) => {
    if (ctx.view === "back") return { top: neckWrap(ctx, (s) => `<path d="M-40,2 C-24,10 24,10 40,2" fill="none" stroke="#E0A82E" stroke-width="${f1(s * 0.5)}" stroke-dasharray="${f1(s * 0.6)} ${f1(s * 0.45)}"/>`) };
    return {
      top: neckWrap(ctx, (s) => `<path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="${K}" stroke-width="${f1(s * 1)}" stroke-linecap="round"/><path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="#F7C948" stroke-width="${f1(s * 0.45)}" stroke-dasharray="${f1(s * 0.6)} ${f1(s * 0.45)}" stroke-linecap="round"/>`
        + `<circle cx="0" cy="19" r="2.6" fill="#F7C948" ${stroke(s * 0.32)}/><ellipse cx="0" cy="30" rx="9.4" ry="8.6" fill="#FFE066" ${stroke(s * 0.42)}/><path d="M-3,23 C-2,20 1,20 2,22.6" fill="none" ${stroke(s * 0.3)}/>`
        + `<circle cx="-3.2" cy="28.4" r="1.3" fill="${K}"/><circle cx="3.2" cy="28.4" r="1.3" fill="${K}"/><path d="M-2.2,31.4 L2.2,31.4 L0,34 Z" fill="#F2994A" ${stroke(s * 0.2)}/><path d="M6,31 C9,30 9.6,33.6 6.8,35" fill="#FFD23F" ${stroke(s * 0.28)}/><ellipse cx="-5.6" cy="32.4" rx="1.6" ry="1" fill="#FFB3C7"/>`),
    };
  };
  // きょうりゅうの ヘアピン（ごじ）: みどりの ちいさな きょうりゅう
  WEAR.wg_dinopin = (ctx) => ({
    top: hatWrap(ctx, (s) => pinBar(s, 12, -2, 40, -16)
      + `<g transform="translate(28 -20)"><path d="M-12,6 C-12,-2 -6,-6 0,-5 C2,-10 8,-12 11,-8 C14,-5 12,0 8,0 C9,4 7,8 3,8 L-10,8 C-12,8 -12,7 -12,6 Z" fill="#7DCB6B" ${stroke(s * 0.7)}/><path d="M-12,6 C-16,5 -17,2 -16,0" fill="none" ${stroke(s * 0.7)}/><circle cx="7" cy="-6" r="1.4" fill="${K}"/><path d="M-6,-5 L-5,-9 L-3,-5.6 M-1,-5.6 L0.6,-9.6 L2,-6" fill="#F7C948" ${stroke(s * 0.45)}/></g>`),
  });
  // ほしの バッジ（ごじ）: むねの ひだりに とめる きいろい ほし
  WEAR.wg_starbadge = (ctx) => {
    if (ctx.view === "back") return {};
    const x = ctx.view === "side" ? 6 : -20;
    return {
      top: neckWrap(ctx, (s) => `<path d="M${x - 4},30 L${x - 8},44 L${x - 3},41 L${x},46 L${x + 1},32 Z M${x + 4},30 L${x + 8},44 L${x + 3},41 L${x},46 L${x - 1},32 Z" fill="#E35D5B" ${stroke(s * 0.32)}/>`
        + `<path d="${starPath(x, 26, 13, 6)}" fill="#FFD84D" ${stroke(s * 0.38)}/><circle cx="${x}" cy="26.4" r="3.4" fill="#FFF3B0" stroke="#E0A82E" stroke-width="${f1(s * 0.35)}"/><circle cx="${x - 3}" cy="21.6" r="1.4" fill="#FFFFFF" opacity="0.9"/>`),
    };
  };

  return { PAL, pal, ENV_W, ENV_H, envBack, envFront, envFlap, envSmall, doodle, DOODLE, STONE, stone, crane, drawing, coupon, SB };
})();
