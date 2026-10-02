// ガチャガチャ（Meeときょれじゃ の カプセルトイ・UI-12）の 絵。しくみ・画面は js/gacha.js。
// へやに かざる フィギュア（とうめいな まるい だい・クッション・おさら・レールの うえ）・あたらしい 服の かたち（WEAR.gacha_*）・カプセル・台の まえ。
// フィギュアは 100×110（3にん なかよし は 180×110）の 絵。3人は Chara.svg、どうぶつは Art.npcSvg、おかしと のりものは ここで 描く。
// 服は chara.js と おなじ hatWrap／eyeWrap／neckWrap で 3人の あたま・め・くびに あわせる（線は INK・ふとさ s）。
const GachaArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.4) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const star = (x, y, r, fill, extra = "") => `<path d="${starPath(x, y, r, r * 0.45)}" fill="${fill}" ${extra}/>`;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;

  // ---- あたらしい 服の かたち（WEAR に たす）----
  const band = (s, c) => `<path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${K}" stroke-width="${f1(s * 2.6)}" stroke-linecap="round"/><path d="M-48,6 C-36,-26 36,-26 48,6" fill="none" stroke="${c}" stroke-width="${f1(s * 1.2)}" stroke-linecap="round"/>`;
  // くまみみ カチューシャ: まるい みみ
  WEAR.gacha_bearears = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#B98B63", inner = ctx.col[1] || "#F2C9A0";
      return band(s, shade(c, -0.1)) + [-1, 1].map((d) => `<circle cx="${36 * d}" cy="-22" r="16" fill="${c}" ${stroke(s)}/><circle cx="${36 * d}" cy="-22" r="8.5" fill="${inner}"/><path d="M${36 * d - 9},-31 q5 -4 11 -2" fill="none" stroke="#FFFFFF" stroke-width="${f1(s * 0.6)}" stroke-linecap="round" opacity="0.7"/>`).join("");
    }),
  });
  // うさみみ カチューシャ: ながい みみ（すこし ひらく）
  WEAR.gacha_bunnyears = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFFFFF", inner = ctx.col[1] || "#F8A5C2";
      return band(s, "#F4C6D6") + [-1, 1].map((d) => `<g transform="rotate(${14 * d} ${22 * d} -12)"><path d="M${22 * d - 11},-10 C${22 * d - 14},-50 ${22 * d - 8},-74 ${22 * d},-74 C${22 * d + 8},-74 ${22 * d + 14},-50 ${22 * d + 11},-10 Z" fill="${c}" ${stroke(s)}/><path d="M${22 * d - 5},-16 C${22 * d - 7},-44 ${22 * d - 4},-62 ${22 * d},-62 C${22 * d + 4},-62 ${22 * d + 7},-44 ${22 * d + 5},-16 Z" fill="${inner}"/></g>`).join("");
    }),
  });
  // ユニコーン カチューシャ（レア）: きんの つの・ちいさな みみ・おはな
  WEAR.gacha_unicorn = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#D8C8F2", gold = ctx.col[1] || "#F7C948";
      const ear = (d) => `<path d="M${30 * d},-12 L${40 * d},-40 L${16 * d},-22 Z" fill="#FFFFFF" ${stroke(s)}/><path d="M${30 * d},-18 L${36 * d},-33 L${22 * d},-23 Z" fill="#F8BBD0"/>`;
      return band(s, c) + ear(-1) + ear(1)
        + `<path d="M-10,-14 L0,-70 L10,-14 Z" fill="${gold}" ${stroke(s)}/><path d="M-8,-24 L7,-29 M-6,-35 L5,-39 M-4,-46 L3,-49 M-2,-56 L2,-58" fill="none" stroke="${shade(gold, -0.3)}" stroke-width="${f1(s * 0.6)}" stroke-linecap="round"/>`
        + flowerSvg(-18, -14, 6, "#F8BBD0", "#FFD54F", s * 0.6) + flowerSvg(18, -14, 6, "#B3E5FC", "#FFF59D", s * 0.6) + `<circle cx="-4" cy="-66" r="2" fill="#FFFFFF"/>`;
    }),
  });
  // ほしの めがね（かお）
  WEAR.gacha_starglasses = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FFD84D";
      return [-21, 21].map((x) => `<path d="${starPath(x, 0, 19, 9)}" fill="${c}" fill-opacity="0.8" ${stroke(s)}/><circle cx="${x}" cy="1" r="6.5" fill="#FFFFFF" fill-opacity="0.55"/>`).join("")
        + `<path d="M-6,-3 L6,-3" fill="none" ${stroke(s)}/><circle cx="-28" cy="-7" r="2.4" fill="#FFFFFF"/><circle cx="14" cy="-7" r="2.4" fill="#FFFFFF"/>`;
    }),
  });
  // きらきら ペンダント（くび）: きんの くさり と しずくの ほうせき
  WEAR.gacha_pendant = (ctx) => {
    if (ctx.view === "back") return {};
    return {
      top: neckWrap(ctx, (s) => {
        const c = ctx.col[0] || "#7FD3F0", g = ctx.col[1] || "#F7C948";
        let out = `<path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="${K}" stroke-width="${f1(s * 1.1)}" stroke-linecap="round"/><path d="M-40,2 C-30,24 30,24 40,2" fill="none" stroke="${g}" stroke-width="${f1(s * 0.5)}" stroke-dasharray="${f1(s * 0.6)} ${f1(s * 0.5)}" stroke-linecap="round"/>`;
        out += `<circle cx="0" cy="18" r="4" fill="${g}" ${stroke(s * 0.5)}/><path d="M0,22 C-11,30 -9,42 0,48 C9,42 11,30 0,22 Z" fill="${c}" ${stroke(s * 0.7)}/><path d="M-3,30 C-5,34 -4,38 -2,41" fill="none" stroke="#FFFFFF" stroke-width="${f1(s * 0.45)}" stroke-linecap="round"/>`;
        return out;
      }),
    };
  };
  // ハートの ヘアピン（あたま）
  WEAR.gacha_heartclip = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#FF7BA8";
      return `<path d="M14,-4 L42,-18" stroke="${K}" stroke-width="${f1(s * 1.3)}" stroke-linecap="round"/><path d="M14,-4 L42,-18" stroke="#F7C948" stroke-width="${f1(s * 0.55)}" stroke-linecap="round"/><path d="${heartPath(30, -16, 1.5)}" fill="${c}" ${stroke(s)}/><circle cx="25" cy="-20" r="2.6" fill="#FFFFFF" opacity="0.85"/>`;
    }),
  });
  // にじいろ ティアラ（レア）: 5つの とんがりに にじいろの ほうせき
  WEAR.gacha_tiara = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#E6E9F2", gems = ["#FF7BA8", "#FFB25B", "#FFE066", "#7CCB6B", "#6FC7EF"];
      let out = `<path d="M-40,2 L-38,-14 L-26,-24 L-14,-12 L0,-38 L14,-12 L26,-24 L38,-14 L40,2 C20,-4 -20,-4 -40,2 Z" fill="${c}" ${stroke(s)}/>`;
      out += `<path d="M-38,-2 C-20,-8 20,-8 38,-2" fill="none" stroke="#B8BED0" stroke-width="${f1(s * 0.5)}" stroke-linecap="round"/>`;
      [[-26, -18], [-14, -8], [0, -22], [14, -8], [26, -18]].forEach(([x, y], i) => { out += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 7 : 4.6}" fill="${gems[i]}" ${stroke(s * 0.55)}/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="${i === 2 ? 2.2 : 1.4}" fill="#FFFFFF"/>`; });
      return out + star(0, -44, 5, "#FFF6C8", `stroke="${K}" stroke-width="${f1(s * 0.4)}"`);
    }),
  });

  // ---- フィギュアの だい ----
  // とうめいな まるい だい（ふちは シリーズの いろ）
  const base = (cx, rx, col) => `<ellipse cx="${cx}" cy="101" rx="${rx}" ry="7.5" fill="#4F465622"/><path d="M${cx - rx},97 L${cx - rx},100 A${rx} 8 0 0 0 ${cx + rx} 100 L${cx + rx},97" fill="${col}" ${sk(2.2)}/><ellipse cx="${cx}" cy="97" rx="${rx}" ry="8" fill="#FFFFFF" fill-opacity="0.8" ${sk(2.2)}/><path d="M${cx - rx * 0.6},95 q${rx * 0.3} -3 ${rx * 0.6} -3" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
  // ふんわり クッション（すやすや どうぶつ）
  const cushion = (col, dots) => `<ellipse cx="50" cy="102" rx="42" ry="6.5" fill="#4F465622"/><path d="M10,94 C8,84 18,80 50,80 C82,80 92,84 90,94 C92,104 82,106 50,106 C18,106 8,104 10,94 Z" fill="${col}" ${sk(2.2)}/><path d="M18,88 C34,84 66,84 82,88" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>${dots}<path d="M10,94 l-6,-3 m6,3 l-5,4 M90,94 l6,-3 m-6,3 l5,4" fill="none" ${sk(1.8)}/>`;
  // レースの おさら（ミニチュア スイーツ）
  const plate = () => { let s = `<ellipse cx="50" cy="102" rx="44" ry="6" fill="#4F465622"/>`; let d = ""; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, b = ((i + 1) / 16) * Math.PI * 2; d += `${i ? "" : `M${f1(50 + Math.cos(a) * 42)},${f1(97 + Math.sin(a) * 9)} `}Q${f1(50 + Math.cos((a + b) / 2) * 47)},${f1(97 + Math.sin((a + b) / 2) * 10.4)} ${f1(50 + Math.cos(b) * 42)},${f1(97 + Math.sin(b) * 9)} `; } s += `<path d="${d}Z" fill="#FFFFFF" ${sk(2)}/><ellipse cx="50" cy="97" rx="34" ry="6.6" fill="#F3EDF7" stroke="#D9CCE4" stroke-width="1.4"/>`; return s; };
  // レールの だい（のりもの）
  const rail = () => `<ellipse cx="50" cy="103" rx="44" ry="5" fill="#4F465622"/><rect x="8" y="92" width="84" height="9" rx="3" fill="#C9B79C" ${sk(2)}/>${[16, 30, 44, 58, 72, 86].map((x) => `<path d="M${x},93 v7" stroke="#8C7657" stroke-width="2.4"/>`).join("")}<path d="M6,92 H94" ${sk(2.4)}/>`;
  // ほかの SVG を x y w h に（足もとを したに そろえる）
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMax meet" `);
  // 3人・どうぶつの 絵の はんい（まえむき・足もと 210）
  const HERO_VB = { wanko: "0 -8 200 222", gachan: "30 12 140 202", goji: "-6 -6 212 222" };
  const hero = (who, o) => Chara.svg(who, { pose: o.pose, face: o.face, dir: "down", outfit: o.outfit || {}, color: "soft" });
  const zzz = (x, y, c = "#8FA6D8") => `<text x="${x}" y="${y}" font-size="13" font-weight="900" fill="${c}" stroke="#FFFFFF" stroke-width="3" paint-order="stroke" font-family="'M PLUS Rounded 1c',sans-serif">z</text><text x="${x + 9}" y="${y - 10}" font-size="10" font-weight="900" fill="${c}" stroke="#FFFFFF" stroke-width="3" paint-order="stroke" font-family="'M PLUS Rounded 1c',sans-serif">z</text>`;

  // ---- おかし（ミニチュア スイーツ）----
  const cake = () => `<path d="M22,88 L78,88 L78,64 L22,74 Z" fill="#FFF4DC" ${sk()}/><path d="M22,74 L78,64 L66,54 L22,68 Z" fill="#FFFFFF" ${sk()}/><path d="M22,80 L78,74" stroke="#F58FAE" stroke-width="4"/>${[30, 44, 58].map((x, i) => `<circle cx="${x}" cy="${f1(66 - i * 3)}" r="3.4" fill="#FFFFFF" ${sk(1.4)}/>`).join("")}<path d="M50,50 C44,50 42,58 50,62 C58,58 56,50 50,50 Z" fill="#FF5A6E" ${sk(2)}/><path d="M47,50 L50,45 L53,50" fill="#6CBF5B" ${sk(1.6)}/><circle cx="48" cy="55" r="1" fill="#FFF3B0"/><circle cx="52" cy="57" r="1" fill="#FFF3B0"/>`;
  const pudding = () => `<path d="M26,90 L74,90 L66,56 C62,50 38,50 34,56 Z" fill="#FFE08A" ${sk()}/><path d="M34,56 C38,50 62,50 66,56 C66,62 62,64 58,62 C56,68 50,66 50,62 C46,66 40,66 40,60 C36,62 33,60 34,56 Z" fill="#B7743C" ${sk(2)}/><ellipse cx="50" cy="46" rx="11" ry="6" fill="#FFFFFF" ${sk(2)}/><circle cx="50" cy="38" r="5.5" fill="#E8262A" ${sk(1.8)}/><path d="M50,33 q4 -8 10 -9" fill="none" ${sk(1.6)}/><path d="M36,76 q6 4 12 0" fill="none" stroke="#FFF6C8" stroke-width="2.4" stroke-linecap="round"/>`;
  const parfait = () => `<path d="M40,90 L60,90 L56,84 L44,84 Z" fill="#E9F6FB" ${sk(2)}/><path d="M48,84 L52,84 L52,74 L48,74 Z" fill="#E9F6FB" ${sk(1.8)}/><path d="M30,40 L70,40 L60,74 L40,74 Z" fill="#E9F6FB" fill-opacity="0.9" ${sk()}/><path d="M36,60 L64,60 L60,74 L40,74 Z" fill="#F7A9C8"/><path d="M33,50 L67,50 L64,60 L36,60 Z" fill="#FFF6DD"/><path d="M31,44 L69,44 L67,50 L33,50 Z" fill="#8B5A3C"/><path d="M30,40 L70,40 L60,74 L40,74 Z" fill="none" ${sk()}/><path d="M32,40 C28,26 44,24 50,28 C56,22 72,26 68,40 Z" fill="#FFFFFF" ${sk(2)}/><circle cx="50" cy="22" r="5.5" fill="#E8262A" ${sk(1.8)}/><path d="M63,30 L78,16" stroke="#FFD84D" stroke-width="5" stroke-linecap="round"/><path d="M63,30 L78,16" fill="none" ${sk(1.4)}/><path d="M36,34 l6,-8 4,8 Z" fill="#8B5A3C" ${sk(1.4)}/>`;
  const tower = () => {
    const tier = (y, w, h, c) => `<rect x="${50 - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" ${sk()}/><path d="M${50 - w / 2},${y + 4} ${Array.from({ length: Math.round(w / 8) }, (_, i) => `q4 6 8 0`).join(" ")}" fill="#FFFFFF" ${sk(1.6)}/>`;
    let s = tier(72, 66, 18, "#FFF4DC") + tier(54, 50, 18, "#FFE3EF") + tier(38, 34, 16, "#FFF4DC");
    s += [22, 36, 50, 64, 78].map((x) => `<circle cx="${x}" cy="72" r="3.6" fill="#FF5A6E" ${sk(1.3)}/>`).join("") + [30, 44, 56, 70].map((x) => `<circle cx="${x}" cy="54" r="3.2" fill="#FF5A6E" ${sk(1.3)}/>`).join("");
    s += `<path d="M40,38 L40,28 L45,33 L50,24 L55,33 L60,28 L60,38 Z" fill="#F7C948" ${sk(1.8)}/><circle cx="50" cy="32" r="2" fill="#6FC7EF"/>` + star(22, 30, 5, "#FFF3A8", sk(1.2)) + star(80, 42, 4, "#FFF3A8", sk(1.2));
    return s;
  };
  // ---- のりもの ----
  const wheel = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5B5670" ${sk(2)}/><circle cx="${x}" cy="${y}" r="${f1(r * 0.4)}" fill="#D9D4E8"/>`;
  const win = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#BFE6F7" ${sk(1.8)}/><path d="M${x + 2},${y + h - 3} L${x + w * 0.45},${y + 2}" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>`;
  const train = () => `<path d="M12,86 L12,52 C12,44 18,40 26,40 L80,40 C86,40 90,44 90,50 L90,86 Z" fill="#9ED3A8" ${sk()}/><path d="M12,72 L90,72" stroke="#FFF6DD" stroke-width="6"/><path d="M12,69 L90,69 M12,75 L90,75" stroke="${K}" stroke-width="1.6"/>${win(20, 48, 16, 14)}${win(42, 48, 16, 14)}${win(64, 48, 16, 14)}<path d="M30,40 L30,34 M70,40 L70,34 M26,34 L74,34" fill="none" ${sk(2)}/><circle cx="84" cy="80" r="2.6" fill="#FFE066" ${sk(1.2)}/>${wheel(26, 88)}${wheel(76, 88)}`;
  const bus = () => `<path d="M8,86 L8,50 C8,44 12,40 18,40 L86,40 C92,40 94,46 94,52 L94,86 Z" fill="#FFD84D" ${sk()}/><path d="M8,74 L94,74" stroke="#F29B38" stroke-width="5"/>${win(14, 47, 14, 15)}${win(32, 47, 14, 15)}${win(50, 47, 14, 15)}<rect x="70" y="47" width="18" height="31" rx="3" fill="#BFE6F7" ${sk(1.8)}/><path d="M79,47 L79,78" stroke="${K}" stroke-width="1.4"/><rect x="36" y="32" width="28" height="8" rx="3" fill="#FFFFFF" ${sk(1.6)}/><text x="50" y="38.6" font-size="6.4" font-weight="900" text-anchor="middle" fill="${K}" font-family="'M PLUS Rounded 1c',sans-serif">ぽかぽか</text>${wheel(26, 88)}${wheel(76, 88)}`;
  const plane = () => `<path d="M10,66 C10,58 20,54 34,54 L78,54 C90,54 96,60 96,66 C96,72 90,76 78,76 L34,76 C20,76 10,72 10,66 Z" fill="#FFFFFF" ${sk()}/><path d="M34,76 L78,76 C84,76 90,74 93,70 L20,70 C24,74 28,76 34,76 Z" fill="#6FC7EF"/><path d="M10,66 C10,58 20,54 34,54 L78,54 C90,54 96,60 96,66 C96,72 90,76 78,76 L34,76 C20,76 10,72 10,66 Z" fill="none" ${sk()}/><path d="M44,64 L30,90 L44,90 L62,66 Z" fill="#6FC7EF" ${sk(2)}/><path d="M16,58 L10,36 L22,36 L32,56 Z" fill="#FF7BA8" ${sk(2)}/>${[46, 56, 66, 76].map((x) => `<circle cx="${x}" cy="62" r="3.2" fill="#BFE6F7" ${sk(1.4)}/>`).join("")}<path d="M88,58 C92,60 94,63 94,66 L86,66 Z" fill="#BFE6F7" ${sk(1.4)}/>`;
  const rocket = () => `<path d="M50,8 C66,20 70,44 66,72 L34,72 C30,44 34,20 50,8 Z" fill="#FFFFFF" ${sk()}/><path d="M50,8 C58,14 62,22 64,30 L36,30 C38,22 42,14 50,8 Z" fill="#FF5A6E" ${sk(2)}/><circle cx="50" cy="44" r="8" fill="#BFE6F7" ${sk(2.2)}/><path d="M46,41 q2 -3 5 -3" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/><path d="M34,56 L20,76 L34,72 Z M66,56 L80,76 L66,72 Z" fill="#FF5A6E" ${sk(2)}/><path d="M40,72 L60,72 L56,80 L44,80 Z" fill="#8C88A0" ${sk(2)}/><path d="M44,80 C42,88 46,94 50,98 C54,94 58,88 56,80 Z" fill="#FFB25B" ${sk(1.8)}/><path d="M47,80 C46,86 48,90 50,92 C52,90 54,86 53,80 Z" fill="#FFE066"/>${star(50, 62, 4.6, "#FFE066", sk(1.2))}${star(18, 30, 4, "#FFF3A8", sk(1.1))}${star(84, 20, 5, "#FFF3A8", sk(1.1))}`;

  // ---- フィギュア 16しゅ（id → 100×110 の 絵）----
  const FIG = {
    // なかよし フィギュア
    gacha_friends_0: () => svg(100, 110, base(50, 36, "#F29BB2") + nest(hero("wanko", { pose: "jump_01", face: "excited", outfit: { head: "starclip" } }), 8, 2, 84, 96, HERO_VB.wanko)),
    gacha_friends_1: () => svg(100, 110, base(50, 34, "#F29BB2") + nest(hero("gachan", { pose: "land_01", face: "happy", outfit: { neck: "bowtie_blue" } }), 14, 10, 72, 88, HERO_VB.gachan)),
    gacha_friends_2: () => svg(100, 110, base(50, 38, "#F29BB2") + nest(hero("goji", { pose: "idle_02", face: "love", outfit: { head: "flowercrown" } }), 6, 2, 88, 96, HERO_VB.goji)),
    gacha_friends_3: () => svg(180, 110, `<ellipse cx="90" cy="101" rx="84" ry="7.5" fill="#4F465622"/><path d="M8,97 L8,100 A82 8.5 0 0 0 172 100 L172,97" fill="#F7C948" ${sk(2.2)}/><ellipse cx="90" cy="97" rx="82" ry="8.5" fill="#FFFFFF" fill-opacity="0.8" ${sk(2.2)}/>${[34, 90, 146].map((x) => star(x, 101, 2.6, "#FFE066")).join("")}`
      + nest(hero("wanko", { pose: "idle_01", face: "happy", outfit: { head: "partyhat" } }), 4, 8, 64, 90, HERO_VB.wanko) + nest(hero("goji", { pose: "idle_01", face: "happy", outfit: { head: "partyhat" } }), 112, 6, 66, 92, HERO_VB.goji) + nest(hero("gachan", { pose: "jump_01", face: "excited", outfit: { head: "crown" } }), 62, 0, 56, 92, HERO_VB.gachan)
      + star(22, 20, 5, "#FFF3A8", sk(1.2)) + star(160, 16, 6, "#FFF3A8", sk(1.2))),
    // すやすや どうぶつ
    gacha_sleepy_0: () => svg(100, 110, cushion("#CDE8F8", `<circle cx="30" cy="96" r="2.4" fill="#FFFFFF"/><circle cx="70" cy="98" r="2.4" fill="#FFFFFF"/>`) + nest(Art.npcSvg({ sp: "cat", emo: "sleep", pose: "land_01", dir: "down" }), 14, 18, 72, 76, "10 20 180 194") + zzz(74, 28)),
    gacha_sleepy_1: () => svg(100, 110, cushion("#FFE3EF", `<circle cx="30" cy="96" r="2.4" fill="#FFFFFF"/><circle cx="70" cy="98" r="2.4" fill="#FFFFFF"/>`) + nest(Art.npcSvg({ sp: "rabbit", emo: "sleep", pose: "land_01", dir: "down" }), 14, 6, 72, 88, "10 -10 180 224") + zzz(76, 24)),
    gacha_sleepy_2: () => svg(100, 110, cushion("#FFF2C4", `<circle cx="30" cy="96" r="2.4" fill="#FFFFFF"/><circle cx="70" cy="98" r="2.4" fill="#FFFFFF"/>`) + nest(Art.npcSvg({ sp: "hamster", emo: "sleep", pose: "land_01", dir: "down" }), 18, 24, 64, 70, "10 30 180 184") + zzz(72, 34)),
    gacha_sleepy_3: () => svg(100, 110, `<ellipse cx="50" cy="103" rx="42" ry="6" fill="#4F465622"/><path d="M12,70 C12,96 40,108 66,100 C84,94 94,80 92,66 C84,86 58,94 40,86 C26,80 18,70 20,58 C14,60 12,64 12,70 Z" fill="#FFE68A" ${sk(2.4)}/><path d="M22,72 C28,84 44,92 60,92" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>`
      + nest(Art.npcSvg({ sp: "sheep", emo: "sleep", pose: "land_01", dir: "down" }), 20, 14, 64, 76, "10 10 180 204") + star(16, 22, 5, "#FFF3A8", sk(1.2)) + star(86, 14, 4, "#FFF3A8", sk(1.2)) + star(90, 40, 3, "#FFF3A8", sk(1)) + zzz(70, 24, "#B79BEA")),
    // ミニチュア スイーツ
    gacha_sweets_0: () => svg(100, 110, plate() + cake()),
    gacha_sweets_1: () => svg(100, 110, plate() + pudding()),
    gacha_sweets_2: () => svg(100, 110, plate() + parfait()),
    gacha_sweets_3: () => svg(100, 110, plate() + tower()),
    // ぽかぽか のりもの
    gacha_ride_0: () => svg(100, 110, rail() + train()),
    gacha_ride_1: () => svg(100, 110, rail() + bus()),
    gacha_ride_2: () => svg(100, 110, `<ellipse cx="50" cy="103" rx="40" ry="5" fill="#4F465622"/><path d="M50,100 L50,80" ${sk(2.4)}/><ellipse cx="50" cy="100" rx="20" ry="5" fill="#C9B79C" ${sk(2)}/>` + plane()),
    gacha_ride_3: () => svg(100, 110, `<ellipse cx="50" cy="104" rx="36" ry="5" fill="#4F465622"/><ellipse cx="50" cy="102" rx="24" ry="5.5" fill="#6C5A80" ${sk(2)}/>` + rocket()),
  };
  const figure = (id) => (FIG[id] ? FIG[id]() : "");

  // ---- カプセル（ふたは すける いろ・したは シリーズの いろ）----
  const capsule = (col, open = 0, uid = "c") => {
    const up = open ? -16 : 0, tilt = open ? -18 : 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 64"><defs><clipPath id="gcap-${uid}"><circle cx="30" cy="34" r="22"/></clipPath></defs>`
      + `<g transform="translate(0 ${open ? 6 : 0})"><path d="M8,34 A22 22 0 0 0 52,34 Z" fill="${col}" ${sk(2.4)}/><path d="M14,40 q16 10 32 0" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/></g>`
      + `<g transform="translate(0 ${up}) rotate(${tilt} 8 34)"><path d="M8,34 A22 22 0 0 1 52,34 Z" fill="#FFFFFF" fill-opacity="0.72" ${sk(2.4)}/><path d="M17,24 q6 -8 14 -8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g></svg>`;
  };
  // ---- 台の まえ（画面の 大きな 絵。つまみ と でぐちは gacha.js が うごかす）----
  const machine = (S, cards) => {
    const c = S.color, d = shade(c, -0.18), l = shade(c, 0.18);
    let caps = ""; for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = 12 + (k % 4) * 11; caps += `<circle cx="${f1(90 + Math.cos(a) * rr)}" cy="${f1(80 + Math.sin(a) * rr * 0.62)}" r="11" fill="${S.caps[k % S.caps.length]}" ${sk(1.6)}/><path d="M${f1(90 + Math.cos(a) * rr - 11)},${f1(80 + Math.sin(a) * rr * 0.62)} a11 11 0 0 1 22 0" fill="#FFFFFF" fill-opacity="0.55"/>`; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 250" class="gacha-body">`
      + `<rect x="30" y="8" width="120" height="14" rx="6" fill="${d}" ${sk(2.4)}/>`
      + `<path d="M34,22 L146,22 L146,122 L34,122 Z" fill="#E9F6FB" fill-opacity="0.8" ${sk(2.6)}/>${caps}<path d="M44,30 L44,70" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`
      + `<path d="M26,122 L154,122 L154,240 L26,240 Z" fill="${c}" ${sk(2.6)}/><path d="M26,130 L154,130" stroke="${l}" stroke-width="4"/>`
      + `<rect x="36" y="136" width="108" height="42" rx="6" fill="#FFFDF5" ${sk(2)}/>${cards}`
      + `<rect x="110" y="184" width="28" height="10" rx="3" fill="#2A2238" ${sk(1.6)}/><text x="124" y="204" font-size="7" font-weight="900" text-anchor="middle" fill="${K}" font-family="'M PLUS Rounded 1c',sans-serif">200</text>`
      + `<path d="M102,210 L148,210 L148,236 L102,236 Z" fill="#2A2238" ${sk(2)}/><path d="M106,212 L144,212" stroke="#5B5670" stroke-width="3"/>`
      + `<rect x="22" y="238" width="136" height="8" rx="3" fill="${d}" ${sk(2)}/>${S.forest ? leafy() : ""}</svg>`;
  };
  // 4F（ガチャガチャの もり）の 台の かざり: うえの ふちに はっぱ・りょうはしに どんぐり
  const leafy = () => {
    let s = "";
    for (let k = 0; k < 7; k++) { const x = 38 + k * 17.3, a = k % 2 ? 24 : -24, c = ["#7DBA4C", "#9ED36A", "#5E9A3E"][k % 3]; s += `<ellipse cx="${f1(x)}" cy="${k % 2 ? 9 : 6}" rx="10" ry="5" transform="rotate(${a} ${f1(x)} ${k % 2 ? 9 : 6})" fill="${c}" ${sk(1.6)}/>`; }
    for (const x of [30, 150]) s += `<ellipse cx="${x}" cy="17" rx="5.4" ry="6.4" fill="#C98E5C" ${sk(1.6)}/><path d="M${x - 6.4},14 q6.4 -8 12.8 0 z" fill="#7A5230" ${sk(1.6)}/>`;
    return s;
  };
  // つまみ（まわす ところ）
  const knob = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#F4F0FA" ${sk(2.4)}/><circle cx="30" cy="30" r="19" fill="${shade(c, 0.25)}" ${sk(1.6)}/><rect x="10" y="25" width="40" height="10" rx="5" fill="#FFFFFF" ${sk(2.2)}/><circle cx="30" cy="30" r="3.4" fill="${K}"/></svg>`;
  return { FIG, figure, capsule, machine, knob, HERO_VB };
})();
