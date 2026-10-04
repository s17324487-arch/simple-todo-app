// コンビニの しなぞろえと ねだん（UI-84。オーナーの FB 2026-10-04「コンビニは商品ラインナップを充実させて価格を今の1.5倍に引き上げて」）。
// ・ネリカスタウンの 2つの コンビニ（ローリソン・せぶんぶん。js/neri-shops.js）の しなものを 6 → 16 に（2つの みせで おなじ ものは うらない）。
//   あたらしい たべもの 20しゅ（ローリソン 10・せぶんぶん 10）の 絵は FOOD_ART（64×64・INK）。スーパーの たなには ならばない（exclusive）。
// ・コンビニで かう ときの ねだんは もとの ねだんの 1.5ばい（ConbiniGoods.price。おなじ たべものを ほかの おみせで かう ねだんは かわらない）。
//   いちばんくじ（1かい 1000コイン・js/ichiban-kuji.js）と クーポンは そのまま。
// ・おみせの まどは「ごはん」「おやつ」「のみもの」の 3つの タブ。たなの かざりにも あたらしい しなものを ならべる。
// セーブは かわらない（もちもの Save.d.bag に ふえる だけ）。neri-shops.js の あと・food-balance.js の まえに よむ。
const ConbiniGoods = (() => {
  const MUL = 1.5;
  const S = (w = 3) => IS(w);
  const hi = (x, y, rx, ry, rot = 0, op = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#FFFFFF" fill-opacity="${op}"/>`;
  const shadow = (cy = 57, rx = 22, ry = 4) => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1F1D1B" fill-opacity=".12"/>`;
  const plate = (cy = 52, rx = 26, ry = 7) => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFFFF" ${S()}/><ellipse cx="32" cy="${cy - 0.8}" rx="${rx - 7}" ry="${ry - 2.6}" fill="none" stroke="#D5E2EA" stroke-width="2"/>`;
  const steam = (x, y) => `<path d="M${x},${y} c-4,-4 4,-6 0,-11 M${x + 9},${y + 1} c-4,-4 4,-6 0,-11" fill="none" stroke="#B9C6CF" stroke-width="2.6" stroke-linecap="round"/>`;
  // ごはんつぶ（おにぎりの おもて）
  const grains = (pts) => pts.map(([x, y, r]) => `<path d="M${x - 1.6},${y} q1.6,-1.6 3.2,0" transform="rotate(${r} ${x} ${y})" fill="none" stroke="#E4DCCB" stroke-width="1.3" stroke-linecap="round"/>`).join("");
  const onigiriBody = `<path d="M32,9 C37,9 52,33 54,43 C55.5,51 47,55.5 32,55.5 C17,55.5 8.5,51 10,43 C12,33 27,9 32,9 Z" fill="#FFFDF5" ${S()}/>`;
  // からあげの ひとつ
  const nugget = (x, y, r, rot = 0, c = "#D98A2E") => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-r},0 C${-r},${-r * 0.9} ${-r * 0.3},${-r * 1.1} ${r * 0.3},${-r} C${r},${-r * 0.8} ${r * 1.1},${-r * 0.1} ${r * 0.9},${r * 0.5} C${r * 0.6},${r} ${-r * 0.4},${r * 1.05} ${-r * 0.8},${r * 0.6} C${-r},${r * 0.4} ${-r},${r * 0.2} ${-r},0 Z" fill="${c}" ${S(2.2)}/><path d="M${-r * 0.4},${-r * 0.35} q${r * 0.3},-${r * 0.25} ${r * 0.6},0" fill="none" stroke="#F2B866" stroke-width="1.6" stroke-linecap="round"/></g>`;
  // ちゅうかまん（むした まん・かみの しき）
  const bun = (body, top) => shadow(56, 21, 3.6) + `<path d="M12,52 L52,52 L49,57 L15,57 Z" fill="#F4ECDD" ${S(2.2)}/>` +
    `<path d="M10,46 C9,30 20,18 32,18 C44,18 55,30 54,46 C54,52 10,52 10,46 Z" fill="${body}" ${S()}/>` + top + hi(22, 30, 6, 3.5, -30, 0.6);
  // ペットボトル（なかみの いろ・ラベル）
  const bottle = (liquid, label, mark) => shadow(58, 13, 3) + `<path d="M27,8 L37,8 L37,13 L27,13 Z" fill="#FFFFFF" ${S(2.4)}/>` +
    `<path d="M27,13 L37,13 C37,17 44,19 44,26 L44,54 C44,57 41,58 38,58 L26,58 C23,58 20,57 20,54 L20,26 C20,19 27,17 27,13 Z" fill="#EAF6FA" ${S()}/>` +
    `<path d="M21.6,24 L42.4,24 L42.4,54 C42.4,56 40.6,56.6 38,56.6 L26,56.6 C23.4,56.6 21.6,56 21.6,54 Z" fill="${liquid}"/>` +
    `<path d="M20,32 L44,32 L44,46 L20,46 Z" fill="${label}" ${S(2.2)}/>` + mark + `<path d="M24,20 L24,52" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".7"/>`;

  const ART = {
    // ===== ローリソン =====
    // しゃけ おにぎり（てっぺんに しゃけ・したに のり）
    cv_onigiri_salmon: shadow(57, 21, 3.6) + onigiriBody + grains([[22, 38, -20], [40, 36, 15], [30, 33, 5], [36, 44, -10], [26, 44, 20], [44, 44, 0]]) +
      `<path d="M22,40.5 L42,40.5 L42.6,55.4 L21.4,55.4 Z" fill="#2F3B33" ${S(2.4)}/><path d="M26,44 L26,52 M32,44 L32,52 M38,44 L38,52" stroke="#45564A" stroke-width="1.4"/>` +
      `<path d="M25.5,22 C27,16.5 37,16.5 38.5,22 C37.5,27 26.5,27 25.5,22 Z" fill="#F49C84" ${S(2.2)}/><path d="M28,21 l3,-1.6 M32,22.5 l3,-1.6 M29.5,24.2 l3,-1.4" stroke="#FBD3C6" stroke-width="1.4" stroke-linecap="round"/>`,
    // ツナマヨ おにぎり（のりで まいた・ツナマヨが のぞく）
    cv_onigiri_tuna: shadow(57, 21, 3.6) + onigiriBody + grains([[24, 30, -15], [40, 30, 20], [32, 26, 0]]) +
      `<path d="M12.5,40 C20,36 44,36 51.5,40 C54.5,46 54,51.5 46,54 C40,55.6 24,55.6 18,54 C10,51.5 9.5,46 12.5,40 Z" fill="#2F3B33" ${S(2.4)}/>` +
      `<path d="M27,40 C27,34 37,34 37,40 C37,44 27,44 27,40 Z" fill="#EAD9A8" ${S(2)}/><path d="M29.5,39 q2.5,-2 5,0" fill="none" stroke="#FFFDF5" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M18,47 L46,47" stroke="#45564A" stroke-width="1.4" stroke-dasharray="2.5 3"/>`,
    // からあげ べんとう（くろい はこ・ごはんと うめぼし・からあげ・たまごやき・はらん）
    cv_bento_karaage: shadow(57, 27, 4) + `<path d="M6,26 L58,26 L55,54 C55,56 53,57 51,57 L13,57 C11,57 9,56 9,54 Z" fill="#3A3F45" ${S()}/>` +
      `<path d="M10,29 L31,29 L30,53 L12.5,53 Z" fill="#FFFDF5" ${S(2)}/><circle cx="21" cy="40" r="4" fill="#E2465B" ${S(1.8)}/>` + hi(19.8, 38.8, 1.4, 0.9, 0, 0.7) +
      `<path d="M31,29 L54,29 L52,53 L30,53 Z" fill="#E9EEF0" ${S(2)}/>` + nugget(38, 37, 6.4, -10) + nugget(47, 36, 5.6, 20) + nugget(42, 46, 6, 5) +
      `<path d="M31,47 L36,43 L36,53 L31,53 Z" fill="#6DBE5B" stroke="none"/><rect x="45" y="44.5" width="8" height="7" rx="1.6" fill="#FFD54F" ${S(1.8)}/><path d="M45.5,48 L52.5,48" stroke="#F2B53A" stroke-width="1.2"/>`,
    // フランクフルト（くしに さした ながい ソーセージ・ケチャップと マスタード）
    cv_frank: `<path d="M38,40 L56,58" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M38,40 L56,58" stroke="#E8C88A" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="M12.5,10.5 C15.5,7.5 20.5,8 23.5,11 L42.5,30 C45.5,33 45.5,38.5 42.5,41.5 C39.5,44.5 34.5,44.5 31.5,41.5 L12.5,22.5 C9.5,19.5 9.5,13.5 12.5,10.5 Z" fill="#C8643A" ${S()}/>` +
      `<path d="M15,13 C18,11 21,14 18,17 C15,20 19,23 22,20 C25,17 28,21 25,24 C22,27 26,30 29,27 C32,24 35,28 32,31 C29,34 33,37 36,34" fill="none" stroke="#E53935" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M19,11.5 C22,13 24,15 22,18 M26,18 C29,20 30,23 28,25 M33,25 C36,27 37,30 35,33" fill="none" stroke="#FFC93C" stroke-width="2" stroke-linecap="round"/>` + hi(16, 14, 3, 1.4, 45, 0.45),
    // やきとり（たれの くし 2ほん・ねぎ）
    cv_yakitori: [[0, "#A85A2C"], [12, "#B8682F"]].map(([dy, c]) => `<g transform="translate(0 ${dy})"><path d="M8,22 L58,22" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M8,22 L58,22" stroke="#E8C88A" stroke-width="3" stroke-linecap="round"/>` +
      [14, 27, 40].map((x, k) => (k === 1 ? `<rect x="${x}" y="15" width="9" height="14" rx="3" fill="#E7F2C8" ${S(2.2)}/><path d="M${x + 2},18 L${x + 2},26" stroke="#8CC26B" stroke-width="1.6"/>` : `<path d="M${x},16 C${x + 2},12.5 ${x + 9},12.5 ${x + 11},16 L${x + 11},28 C${x + 9},31.5 ${x + 2},31.5 ${x},28 Z" fill="${c}" ${S(2.2)}/><path d="M${x + 3},18 q3,-2 5,0" fill="none" stroke="#D99254" stroke-width="1.6" stroke-linecap="round"/>`)).join("") + `</g>`).join("") +
      `<ellipse cx="32" cy="46" rx="24" ry="5" fill="#1F1D1B" fill-opacity=".1"/>`,
    // カップめん（しろい カップ・あかい おび・ふたを すこし あけて ゆげ）
    cv_cupnoodle: shadow(58, 18, 3.6) + `<path d="M14,22 L50,22 L45,58 L19,58 Z" fill="#FFFFFF" ${S()}/><path d="M15.3,30 L48.7,30 L47.3,40 L16.7,40 Z" fill="#E53935"/><path d="M14,22 L50,22 L45,58 L19,58 Z" fill="none" ${S()}/>` +
      `<path d="M22,35 q4,-3 8,0 t8,0 t8,0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="22" rx="18.5" ry="4.6" fill="#F6E8C8" ${S(2.6)}/>` +
      `<path d="M14,21 C18,12 36,10 44,14 L50,22 C40,19 24,19 14,22 Z" fill="#EDE3D0" ${S(2.4)}/>` + steam(28, 12) + `<path d="M40,9 L56,20 M43,6 L58,17" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M40,9 L56,20 M43,6 L58,17" stroke="#E8C88A" stroke-width="2.4" stroke-linecap="round"/>`,
    // デザ・ジャンボ シュー（ひびの ある シュー・カスタード・こなざとう）
    cv_creampuff: shadow(56, 21, 3.8) + `<path d="M12,44 C12,36 20,33 32,33 C44,33 52,36 52,44 C52,52 44,55 32,55 C20,55 12,52 12,44 Z" fill="#E9B260" ${S()}/>` +
      `<path d="M12.5,40 C18,35.5 46,35.5 51.5,40 C50,45 14,45 12.5,40 Z" fill="#FFE59A" ${S(2.2)}/>` +
      `<path d="M10.5,36 C8.5,27 15.5,20 21.5,21 C23.5,13 34,10.5 39,16 C45,12.5 54.5,19 52.5,27 C56.5,30 55.5,37 50,38.5 C42,41.5 20,41.5 10.5,36 Z" fill="#EDBC6C" ${S()}/>` +
      `<path d="M22,23 l3,5 M35,16 l0.4,6 M45,22 l-3,5 M17,31 l5,1.6 M40,31 l5,-1" stroke="#C98A3E" stroke-width="1.8" stroke-linecap="round"/><path d="M16,47 q16,5 32,0" fill="none" stroke="#C98A3E" stroke-width="1.4" stroke-linecap="round"/>` +
      [[24, 20], [31, 15], [38, 19], [46, 24], [18, 27], [28, 27], [42, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#FFFFFF"/>`).join("") + hi(24, 25, 5.5, 2.6, -20, 0.45),
    // デザ・どらやき（2まいの かわで あんこ）
    cv_dorayaki: shadow(56, 24, 4) + `<ellipse cx="32" cy="44" rx="24" ry="9" fill="#E9B868" ${S()}/><ellipse cx="32" cy="40.5" rx="22" ry="6.4" fill="#6B3A2E" ${S(2.2)}/>` +
      `<ellipse cx="32" cy="33" rx="24" ry="10" fill="#E9B868" ${S()}/><ellipse cx="32" cy="31" rx="20" ry="7.4" fill="#A8582C" stroke="none"/><ellipse cx="32" cy="30" rx="15" ry="5" fill="#B9672F" stroke="none"/>` + hi(24, 28.5, 5, 1.8, -8, 0.4) +
      `<path d="M14,41.5 q3,1.6 6,0.4 M44,42 q3,1 6,-0.6" fill="none" stroke="#8C4A33" stroke-width="1.4" stroke-linecap="round"/>`,
    // ミルクティー（ペットボトル・ベージュ・ティーカップの ラベル）
    cv_milktea: bottle("#E3C49A", "#FFFFFF", `<path d="M26,36 L36,36 L35,42 C35,43.5 27,43.5 27,42 Z" fill="#E3C49A" ${S(1.6)}/><path d="M36,37.4 C40,37.4 40,41 35.6,41" fill="none" ${S(1.6)}/><path d="M24,44.6 L40,44.6" stroke="#B98C5E" stroke-width="1.2"/>`),
    // りょくちゃ（ペットボトル・みどり・はっぱの ラベル）
    cv_greentea: bottle("#B9D98A", "#2E7D4F", `<path d="M26,42 C26,35 34,33 38,35 C38,41 32,44 26,42 Z" fill="#9BE07A" ${S(1.6)}/><path d="M27.5,41 C30,39 33,37.5 36.5,36" fill="none" stroke="#2E7D4F" stroke-width="1.2" stroke-linecap="round"/>`),
    // ===== せぶんぶん =====
    // にくまん（ひだの ある しろい まん）
    cv_nikuman: bun("#FFFDF5", `<path d="M32,18 C30,22 29,25 32,28 C35,25 34,22 32,18 Z" fill="#F4ECDD" ${S(1.8)}/><path d="M25,21 q4,3 6,7 M39,21 q-4,3 -6,7 M20,26 q6,1 10,4 M44,26 q-6,1 -10,4" fill="none" stroke="#D9CDB7" stroke-width="1.8" stroke-linecap="round"/>`),
    // あんまん（つるんと まるく・てっぺんに あかい ぽち）
    cv_anman: bun("#FFFDF5", `<circle cx="32" cy="24" r="2.6" fill="#E2465B" ${S(1.4)}/><path d="M18,40 q14,4 28,0" fill="none" stroke="#EFE6D6" stroke-width="2" stroke-linecap="round"/>`),
    // ピザまん（オレンジいろ の まん・トマトの ぽち）
    cv_pizzaman: bun("#F8C27A", `<path d="M26,24 q6,-3 12,0" fill="none" stroke="#E79A4E" stroke-width="2" stroke-linecap="round"/><circle cx="26" cy="33" r="1.6" fill="#E53935"/><circle cx="38" cy="31" r="1.6" fill="#E53935"/><circle cx="33" cy="38" r="1.6" fill="#7DBE5A"/>`),
    // やきそばパン（コッペパンに やきそば・べにしょうが・あおのり）
    cv_yakisobapan: shadow(56, 25, 4) + `<path d="M6,40 C6,30 16,26 32,26 C48,26 58,30 58,40 C58,50 48,54 32,54 C16,54 6,50 6,40 Z" fill="#E7A95A" ${S()}/>` +
      `<path d="M12,36 C16,24 48,24 52,36 C46,42 18,42 12,36 Z" fill="#9C5B2E" ${S(2.2)}/>` +
      `<path d="M15,34 q4,-5 8,-1 t8,-1 t8,1 t8,-1 M17,37 q4,-4 8,0 t8,-1 t8,1 t6,-1" fill="none" stroke="#C88A4E" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M28,30 l3,1 M34,29 l3,1.4 M24,33 l2.6,0.4" stroke="#E2465B" stroke-width="2.4" stroke-linecap="round"/>` + [[21, 31], [38, 33], [44, 31], [30, 35]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#6DBE5B"/>`).join("") + hi(16, 44, 5, 2, -10, 0.35),
    // ナポリタン（ケチャップの スパゲッティ・ピーマン・ウインナー・フォーク）
    cv_napolitan: plate(50, 28, 8) + `<path d="M12,46 C10,36 20,30 32,30 C44,30 54,36 52,46 C44,50 20,50 12,46 Z" fill="#F08A4B" ${S(2.4)}/>` +
      `<path d="M15,43 C20,36 28,40 32,35 C36,40 44,36 49,43 M18,46 C24,41 30,45 34,40 C38,44 44,42 47,46 M24,37 C28,33 34,36 38,33" fill="none" stroke="#F7B27A" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M22,40 a3,2 0 1,1 6,0 a3,2 0 1,1 -6,0 Z" fill="#7DBE5A" ${S(1.6)}/><path d="M38,39 a3,2 0 1,1 6,0 a3,2 0 1,1 -6,0 Z" fill="#7DBE5A" ${S(1.6)}/>` +
      `<ellipse cx="31" cy="44" rx="3.4" ry="2.4" fill="#E86A6A" ${S(1.6)}/><ellipse cx="42" cy="45" rx="3" ry="2.2" fill="#E86A6A" ${S(1.6)}/>` +
      `<path d="M50,16 L42,38" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M50,16 L42,38" stroke="#D5DDE3" stroke-width="2.6" stroke-linecap="round"/><path d="M47,12 L53,14 M48.5,11 L51.5,20" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    // ざるそば（たけの ざる・そば・のり・つゆ）
    cv_zarusoba: shadow(57, 27, 4) + `<path d="M4,40 L44,40 L41,54 L7,54 Z" fill="#E7C98E" ${S()}/><path d="M8,44 L40,44 M9,48 L39.5,48 M10,52 L39,52" stroke="#C9A462" stroke-width="1.4"/>` +
      `<path d="M8,40 C8,30 18,25 25,25 C32,25 40,30 40,40 Z" fill="#9C8E7C" ${S(2.4)}/><path d="M12,38 C14,31 20,28 24,28 M17,39 C19,33 23,31 27,31 M23,39 C25,34 29,32 33,33 M29,39 C31,36 34,35 37,37" fill="none" stroke="#7B6E5E" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M16,28 l4,-2 M24,26 l4,-1 M30,28 l4,0" stroke="#2F3B33" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M44,40 L60,40 L58,54 C58,56 46,56 46,54 Z" fill="#FFFFFF" ${S(2.4)}/><ellipse cx="52" cy="40" rx="8" ry="2.6" fill="#6B3E2A" ${S(2)}/>`,
    // デザ・わらびもち（ぷるぷるの もち・きなこ・くろみつ・ようじ）
    cv_warabimochi: plate(51, 26, 7) + [[20, 40], [32, 37], [44, 40], [26, 46], [38, 46]].map(([x, y]) => `<path d="M${x - 6},${y + 2} C${x - 6},${y - 4} ${x + 6},${y - 4} ${x + 6},${y + 2} C${x + 6},${y + 5} ${x - 6},${y + 5} ${x - 6},${y + 2} Z" fill="#E9DCB4" fill-opacity=".92" ${S(2)}/>` + hi(x - 2, y - 1, 2, 1, -20, 0.6)).join("") +
      [[17, 39], [23, 38], [30, 35], [35, 36], [42, 38], [47, 40], [24, 45], [29, 47], [36, 45], [41, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#C9A46A"/>`).join("") +
      `<path d="M18,43 C24,41 30,44 36,42 C40,41 44,43 46,42" fill="none" stroke="#4A2C1E" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".85"/><path d="M42,30 L54,18" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M42,30 L54,18" stroke="#E8C88A" stroke-width="1.8" stroke-linecap="round"/>`,
    // デザ・まきまき ソフト（まきまきの バニラ・コーン）
    cv_softcream: `<path d="M23,33 L41,33 L32,60 Z" fill="#E8B06A" ${S()}/><path d="M26,38 L38,38 M28,44 L36,44 M30,50 L34,50 M27,36 L35,52 M37,36 L29,52" stroke="#C98A3E" stroke-width="1.4"/>` +
      `<path d="M19,34 C16,30 19,26 24,26 C22,21 27,18 31,19 C30,13 36,9 37,4 C41,9 42,14 39,18 C44,18 46,23 43,26 C48,26 49,31 45,34 Z" fill="#FFFBF0" ${S()}/>` +
      `<path d="M22,30 q9,3 20,0 M25,23 q7,2 14,0 M30,16 q4,1.5 7,0" fill="none" stroke="#E8DCC8" stroke-width="1.8" stroke-linecap="round"/>` + hi(26, 28, 3, 1.6, -15, 0.7),
    // カフェラテ（とうめいな カップ・コーヒーと ミルクの だん・ストロー）
    cv_cafelatte: shadow(58, 16, 3.4) + `<path d="M15,22 L49,22 L45,58 L19,58 Z" fill="#EAF6FA" ${S()}/><path d="M16.6,32 L47.4,32 L46.4,42 L17.6,42 Z" fill="#F4E6CF"/><path d="M17.6,42 L46.4,42 L45,57 L19,57 Z" fill="#8A5A3C"/>` +
      `<path d="M15,22 L49,22 L45,58 L19,58 Z" fill="none" ${S()}/><path d="M12,18 L52,18 L50,22 L14,22 Z" fill="#FFFFFF" ${S(2.2)}/>` +
      `<path d="M36,4 L33,46" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M36,4 L33,46" stroke="#3FA36B" stroke-width="3.2" stroke-linecap="round"/><path d="M21,26 L21,54" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".75"/>`,
    // コーンスープ（あったかい かん・とうもろこしの え・ゆげ）
    cv_cornsoup: shadow(58, 15, 3.4) + `<path d="M19,16 L45,16 L45,56 C45,58 19,58 19,56 Z" fill="#FFD54F" ${S()}/><ellipse cx="32" cy="16" rx="13" ry="3.6" fill="#D5DDE3" ${S(2.4)}/><path d="M28,15 L36,15" stroke="#9AA6AE" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M19,24 L45,24 M19,50 L45,50" stroke="#F2A93A" stroke-width="2.4"/><path d="M30,30 C34,30 36,34 36,38 C36,44 33,47 30,47 C27,47 25,44 25,38 C25,34 27,30 30,30 Z" fill="#FFE98A" ${S(1.8)}/>` +
      [[28, 34], [31, 34], [27, 38], [30, 38], [33, 38], [28, 42], [31, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#F2B53A"/>`).join("") +
      `<path d="M36,40 C40,36 42,38 41,42 C40,45 37,45 35,44 Z" fill="#7DBE5A" ${S(1.6)}/>` + steam(26, 10) + `<path d="M22,20 L22,52" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".6"/>`,
  };

  // ---- あたらしい たべもの（id, なまえ, もとの ねだん, おなか, きぶん, 体力, SP, せつめい）。コンビニでは ×1.5 ----
  const FOOD = [
    ["cv_onigiri_salmon", "しゃけ おにぎり", 30, 26, 5, 25, 0, "ピンクの しゃけが のぞく おにぎり。のりは パリパリ"],
    ["cv_onigiri_tuna", "ツナマヨ おにぎり", 30, 26, 6, 25, 0, "まろやかな ツナマヨ。いちばん にんきの あじ"],
    ["cv_bento_karaage", "からあげ べんとう", 90, 50, 12, 52, 0, "からあげ・たまごやき・うめぼしの ごはん。おなか いっぱい"],
    ["cv_frank", "フランクフルト", 35, 20, 8, 24, 0, "ぱりっと やいた ながい ソーセージ。ケチャップと マスタード"],
    ["cv_yakitori", "やきとり", 30, 16, 8, 20, 0, "あまからい たれの くし 2ほん。ねぎも いっしょ"],
    ["cv_cupnoodle", "カップめん", 40, 30, 8, 30, 0, "おゆを いれて 3ぷん まつ。しょうゆ あじ"],
    ["cv_creampuff", "デザ・ジャンボ シュー", 45, 12, 18, 12, 0, "カスタードが たっぷりの おおきな シュー"],
    ["cv_dorayaki", "デザ・どらやき", 40, 14, 16, 14, 0, "ふかふかの かわで あんこを はさんだ"],
    ["cv_milktea", "ミルクティー", 30, 6, 12, 0, 12, "あまい こうちゃに ミルク。げんき(SP)が もどる"],
    ["cv_greentea", "りょくちゃ", 25, 2, 8, 0, 14, "すっきり にがい みどりの おちゃ。げんき(SP)が もどる"],
    ["cv_nikuman", "にくまん", 40, 28, 8, 30, 0, "ほかほかの むしたて。なかは じゅわっと おにく"],
    ["cv_anman", "あんまん", 40, 24, 12, 24, 0, "なめらかな こしあんが はいった まん"],
    ["cv_pizzaman", "ピザまん", 45, 26, 12, 26, 0, "トマトと チーズが のびる まん"],
    ["cv_yakisobapan", "やきそばパン", 45, 30, 8, 30, 0, "コッペパンに ソースやきそば。べにしょうがを のせて"],
    ["cv_napolitan", "ナポリタン", 90, 48, 12, 50, 0, "ケチャップの スパゲッティ。ピーマンと ウインナー"],
    ["cv_zarusoba", "ざるそば", 80, 40, 10, 44, 0, "つめたい そばを つゆに つけて ちゅるっ"],
    ["cv_warabimochi", "デザ・わらびもち", 45, 10, 18, 10, 0, "ぷるぷるの もちに きなこと くろみつ"],
    ["cv_softcream", "デザ・まきまき ソフト", 40, 8, 18, 8, 0, "まきまきの バニラ。とけない うちに どうぞ"],
    ["cv_cafelatte", "カフェラテ", 35, 6, 12, 0, 12, "ミルク たっぷりの つめたい コーヒー。げんき(SP)が もどる"],
    ["cv_cornsoup", "コーンスープ", 30, 10, 12, 12, 8, "あったか あまい とうもろこしの スープ。かんで ぽかぽか"],
  ];
  for (const [id, name, price, hunger, mood, hp, sp, desc] of FOOD) {
    const f = { id, name, price, hunger, mood, ...(hp ? { hp } : {}), ...(sp ? { sp } : {}), deza: name.startsWith("デザ・"), rare: false, exclusive: "nerikasu", desc };
    FOODS.push(f); BAG_INDEX[id] = { ...f, kind: "food" }; FOOD_ART[id] = ART[id];
  }

  // ---- しなぞろえ（[id, タブ]）。2つの みせで おなじ ものは うらない ----
  const TABS = [["meal", "ごはん"], ["sweet", "おやつ"], ["drink", "のみもの"]];
  const LINEUP = {
    lawson: [
      ["karaage", "meal"], ["cv_frank", "meal"], ["cv_yakitori", "meal"], ["onigiri", "meal"], ["cv_onigiri_salmon", "meal"], ["cv_onigiri_tuna", "meal"],
      ["sandwich", "meal"], ["cv_bento_karaage", "meal"], ["cv_cupnoodle", "meal"],
      ["rollcake", "sweet"], ["pudding", "sweet"], ["cv_creampuff", "sweet"], ["cv_dorayaki", "sweet"],
      ["milk", "drink"], ["cv_milktea", "drink"], ["cv_greentea", "drink"],
    ],
    sevenbun: [
      ["oden", "meal"], ["cv_nikuman", "meal"], ["cv_anman", "meal"], ["cv_pizzaman", "meal"], ["bread", "meal"], ["cv_yakisobapan", "meal"],
      ["cv_napolitan", "meal"], ["cv_zarusoba", "meal"],
      ["deza_ice", "sweet"], ["cv_softcream", "sweet"], ["deza_jelly", "sweet"], ["cv_warabimochi", "sweet"],
      ["cocoa", "drink"], ["cv_cornsoup", "drink"], ["juice", "drink"], ["cv_cafelatte", "drink"],
    ],
  };
  // たなの かざり（js/neri-shops.js の design.fixtures の foods を あたらしい しなぞろえに）
  const SHELVES = {
    lawson: { "おにぎりと サンドイッチ": ["cv_onigiri_salmon", "onigiri", "cv_onigiri_tuna", "sandwich", "cv_bento_karaage"], "ロールケーキと プリン": ["rollcake", "pudding", "cv_creampuff", "cv_dorayaki", "milk"] },
    sevenbun: { "おにぎりと ゼリー": ["cv_napolitan", "cv_zarusoba", "cv_yakisobapan", "deza_jelly", "cv_warabimochi"], "アイスの れいとうこ": ["deza_ice", "cv_softcream", "deza_snow"] },
  };
  const RENAME = { lawson: { "おにぎりと サンドイッチ": "おにぎりと おべんとう", "ロールケーキと プリン": "スイーツ" }, sevenbun: { "おにぎりと ゼリー": "めんと パンと わらびもち" } };

  // コンビニで かう ときの ねだん（もとの ねだん × 1.5。ポイントカードの オーナーの 10%びき は js/conbini-card.js が つつむ）
  const price = (shop, it) => Math.round(it.price * MUL);
  const API = {
    MUL, TABS, LINEUP, FOOD: FOOD.map((f) => f[0]), ART,
    price,
    goods(shop) { return (LINEUP[shop] || []).map(([id]) => id); },
    tabOf(shop, id) { const g = (LINEUP[shop] || []).find((x) => x[0] === id); return g ? g[1] : null; },
    // おみせの まどに だす しなもの（ねだんは コンビニの ねだん。タブ なし・しらない タブ なら ぜんぶ）
    items(shop, tab) {
      const known = TABS.some(([t]) => t === tab);
      return (LINEUP[shop] || []).filter(([, t]) => !known || t === tab).map(([id]) => BAG_INDEX[id]).filter(Boolean).map((it) => ({ ...it, price: API.price(shop, it), basePrice: it.price }));
    },
  };
  for (const shop of Object.keys(LINEUP)) {
    const S2 = NeriShops.SHOPS[shop], B = BUY_SHOPS[shop];
    S2.goods.length = 0; S2.goods.push(...API.goods(shop));
    B.tabs = TABS.map((t) => [...t]);
    B.items = (tab) => API.items(shop, tab);
    B.cls = ((B.cls || "") + " shop-goods").trim(); // なまえは ことばの きれめで おりかえす・タブは 44px（css の .shop-goods）
    for (const f of S2.design.fixtures) {
      const want = SHELVES[shop][f[5]], o = f[6];
      if (want && o) o.foods = [...want];
      if (RENAME[shop][f[5]]) f[5] = RENAME[shop][f[5]];
    }
  }
  return API;
})();
