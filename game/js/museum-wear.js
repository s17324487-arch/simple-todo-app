// すいぞくかん・はくぶつかんの きふの ごほうび（UI-33。オーナーの FB 2026-10-01「水族館、博物館の寄贈数に応じてもらえる、魚や恐竜とコラボした
// 限定の服、かお、くび、ふく、せなかのアイテムを用意せよ」）。
// すいぞくかん（サンシャインいけぶ 12F・13F）: きふした さかなの しゅるい（50しゅ）が 5・15・25・40 で かお・くび・ふく・せなか。
// はくぶつかん（池袋）: きふした ほねの かず（10しゅ 63こ）が 5・15・30・50 で かお・くび・ふく・せなか。
// 館の 人に はなした とき・きふした あとに とどいた ものを わたす（まえから きふして いる 人も つぎに はなすと もらえる）。
// 服は 1こずつ（1こで ひとり・js/wear-stock.js）。おみせには ならばない（exclusive）。絵は 3人 × 4むき（chara.js の WEAR と おなじ かさね）。
// セーブ: Save.d.museum.wear = { id: もらった 日 }（fresh に たす だけ・Save.SCHEMA は そのまま）。
const MuseumWear = (() => {
  const HALL = { aquarium: { name: "すいぞくかん", unit: "しゅ", what: "さかなを" }, museum: { name: "はくぶつかん", unit: "こ", what: "ほねを" } };
  const ITEMS = [
    { id: "mw_goggle", hall: "aquarium", need: 5, slot: "face", col: ["#3BA3D0", "#F28A3A"], st: { sp: 2 }, name: "おさかな ゴーグル",
      desc: "もぐる ときの ゴーグル。ベルトに オレンジの さかなが およいで いるよ。" },
    { id: "mw_fishtie", hall: "aquarium", need: 15, slot: "neck", col: ["#F08A3C", "#FFFFFF"], st: { def: 2 }, name: "おさかな ネクタイ",
      desc: "さかなの かたちの ネクタイ。むすびめが あたま、さきっぽが おびれ。" },
    { id: "mw_clownhood", hall: "aquarium", need: 25, slot: "body", col: ["#F07B2D", "#FFFFFF"], st: { hp: 6, spd: 1 }, name: "クマノミ パーカー",
      desc: "オレンジに しろい しまの クマノミの パーカー。フードには ちいさな ひれ。" },
    { id: "mw_manta", hall: "aquarium", need: 40, slot: "back", col: ["#2D4A78", "#F2F6FA"], st: { spd: 2, def: 1 }, name: "マンタの マント",
      desc: "おおきな マンタが せなかで つばさを ひろげる マント。40しゅ きふの あかし。" },
    { id: "mw_boneglass", hall: "museum", need: 5, slot: "face", col: ["#F4EBD3", "#BCA67F"], st: { sp: 2 }, name: "ほねほね めがね",
      desc: "ふちが ほねの かたちの めがね。はっくつの きぶんに なれるよ。" },
    { id: "mw_fang", hall: "museum", need: 15, slot: "neck", col: ["#8A5A3B", "#FFF9EA"], st: { atk: 2 }, name: "きばの ネックレス",
      desc: "ティラノサウルスの きばの もけいを かざった かわひもの ネックレス。" },
    { id: "mw_stego", hall: "museum", need: 30, slot: "body", col: ["#7CB663", "#F2B347"], st: { hp: 6, def: 1 }, name: "ステゴ パーカー",
      desc: "みどりの ステゴサウルスの パーカー。せなかに オレンジの いたが ならぶよ。" },
    { id: "mw_ptera", hall: "museum", need: 50, slot: "back", col: ["#C77E48", "#F2CDA2"], st: { spd: 2, atk: 1 }, name: "プテラの つばさ",
      desc: "そらを とぶ プテラノドンの つばさ。50こ きふの あかし。" },
  ];
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

  // ---- 絵 ----
  const ink = (w) => `stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
  // ちいさな さかな（よこむき・みぎむき）: からだ・おびれ・め
  const fish = (x, y, r, fill, w, flip = false) => {
    const k = flip ? -1 : 1, X = (a) => f2(x + a * r * k), Y = (b) => f2(y + b * r);
    return `<path d="M${X(-1)},${Y(0)} C${X(-0.6)},${Y(-0.7)} ${X(0.5)},${Y(-0.7)} ${X(1)},${Y(0)} C${X(0.5)},${Y(0.7)} ${X(-0.6)},${Y(0.7)} ${X(-1)},${Y(0)} Z" fill="${fill}" ${ink(w)}/>` +
      `<path d="M${X(-0.92)},${Y(0)} L${X(-1.6)},${Y(-0.62)} L${X(-1.5)},${Y(0)} L${X(-1.6)},${Y(0.62)} Z" fill="${fill}" ${ink(w)}/>` +
      `<circle cx="${X(0.5)}" cy="${Y(-0.1)}" r="${f2(Math.max(0.7, r * 0.16))}" fill="${INK}"/>`;
  };
  // ほね（x0,y → x1,y の ぼうと りょうはしの こぶ）
  const bone = (x0, y0, x1, y1, r, fill, w) => {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), knob = (x, y) => [1, -1].map((s) => `<circle cx="${f2(x + nx * r * 0.62 * s)}" cy="${f2(y + ny * r * 0.62 * s)}" r="${f2(r * 0.72)}" fill="${fill}" ${ink(w)}/>`).join("");
    return knob(x0, y0) + knob(x1, y1) + `<path d="M${f2(x0)},${f2(y0)} L${f2(x1)},${f2(y1)}" stroke="${INK}" stroke-width="${f2(r * 1.15 + w * 2)}" stroke-linecap="round"/>` +
      `<path d="M${f2(x0)},${f2(y0)} L${f2(x1)},${f2(y1)}" stroke="${fill}" stroke-width="${f2(r * 1.15)}" stroke-linecap="round"/>`;
  };

  // 1. おさかな ゴーグル: まるい 2つの レンズ・ふとい ふち・よこの ベルト（ベルトに さかな）
  WEAR.mw_goggle = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#3BA3D0", f = ctx.col[1] || "#F28A3A", side = ctx.view === "side";
      let o = `<path d="M-50,-2 L-34,-1 M34,-1 L50,-2" fill="none" stroke="${INK}" stroke-width="${f2(s * 2.4)}" stroke-linecap="round"/><path d="M-50,-2 L-34,-1 M34,-1 L50,-2" fill="none" stroke="${c}" stroke-width="${f2(s * 1.3)}" stroke-linecap="round"/>`;
      for (const x of [-21, 21]) o += `<rect x="${x - 15}" y="-13" width="30" height="26" rx="11" fill="#CFF0FA" fill-opacity="0.55" stroke="${c}" stroke-width="${f2(s * 1.5)}"/>` +
        `<rect x="${x - 15}" y="-13" width="30" height="26" rx="11" fill="none" ${ink(s * 0.55)}/>` + `<path d="M${x - 9},-6 Q${x - 6},-9 ${x - 1},-9" fill="none" stroke="#FFFFFF" stroke-width="${f2(s * 0.6)}" stroke-linecap="round"/>`;
      o += `<rect x="-6" y="-5" width="12" height="7" rx="3" fill="${c}" ${ink(s * 0.5)}/>`;
      return o + fish(side ? -38 : 40, -10, 6.5, f, s * 0.45, side);
    }),
  });
  // 2. おさかな ネクタイ: むすびめが あたま（め）・したが おびれ・しろい しま。うしろは えりの ひもだけ
  WEAR.mw_fishtie = (ctx) => ({
    top: neckWrap(ctx, (s) => {
      const c = ctx.col[0] || "#F08A3C", wh = ctx.col[1] || "#FFFFFF", cd = shade(c, -0.2);
      if (ctx.view === "back") return `<path d="M-44,-2 C-20,6 20,6 44,-2" fill="none" stroke="${INK}" stroke-width="${f2(s * 1.5)}" stroke-linecap="round"/><path d="M-44,-2 C-20,6 20,6 44,-2" fill="none" stroke="${c}" stroke-width="${f2(s * 0.7)}" stroke-linecap="round"/>`;
      // ほそい ぶひんなので せんは ほそめ（ふといと ちいさい アイコンで まっくろに なる）
      let o = `<path d="M-30,-2 C-16,5 16,5 30,-2" fill="none" stroke="${cd}" stroke-width="${f2(s * 0.8)}" stroke-linecap="round"/>`;
      o += `<path d="M-10,1 L10,1 L8,14 L-8,14 Z" fill="${c}" ${ink(s * 0.55)}/>`;
      o += `<path d="M-8,14 C-17,23 -16,38 0,47 C16,38 17,23 8,14 Z" fill="${c}" ${ink(s * 0.55)}/>`;
      o += `<path d="M-12,29 Q0,33 12,29" fill="none" stroke="${INK}" stroke-width="${f2(s * 1.05)}" stroke-linecap="round"/><path d="M-12,29 Q0,33 12,29" fill="none" stroke="${wh}" stroke-width="${f2(s * 0.55)}" stroke-linecap="round"/>`;
      o += `<path d="M0,45 L-11,59 L0,54 L11,59 Z" fill="${cd}" ${ink(s * 0.5)}/>`;
      return o + `<circle cx="0" cy="20" r="2.8" fill="${INK}"/><circle cx="-1" cy="19" r="1" fill="#FFFFFF"/>`;
    }),
  });
  // 3. クマノミ パーカー: オレンジに しろい しま 2本（くろい ふち）・そでにも しま・うしろは フード（せびれ つき）
  WEAR.mw_clownhood = (ctx) => {
    const W = IkeWear, F = W.frame(ctx), c = ctx.col[0] || "#F07B2D", wh = ctx.col[1] || "#FFFFFF", cd = shade(c, -0.22);
    const { cx, sx } = F, hem = F.v(F.big ? 0.86 : 0.9);
    const band = (k, h) => { const y = F.v(k); return W.p(`M-10,${f2(y - h)} Q${f2(cx + sx)},${f2(y - h + (F.back ? -4 : 5))} 220,${f2(y - h)} V${f2(y + h)} Q${f2(cx + sx)},${f2(y + h + (F.back ? -4 : 5))} -10,${f2(y + h)} Z`, wh, 3.2); };
    let body = garment(ctx, hem, c) + band(F.big ? 0.36 : 0.42, F.big ? 6.5 : 4.6) + band(F.big ? 0.68 : 0.72, F.big ? 5.5 : 3.8);
    if (F.back) {
      // せなかに たれた フード（しろい ふち）と ちいさな せびれ
      const hy = F.v(F.big ? 0.1 : 0.16), hr = F.hw * (F.big ? 0.44 : 0.66);
      body += W.p(`M${f2(cx - hr * 0.2)},${f2(hy - hr * 0.42)} L${f2(cx)},${f2(hy - hr * 0.9)} L${f2(cx + hr * 0.28)},${f2(hy - hr * 0.4)} Z`, cd, 2.6) +
        W.p(`M${f2(cx - hr)},${f2(hy - hr * 0.4)} Q${f2(cx - hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx)},${f2(hy + hr * 1.05)} Q${f2(cx + hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx + hr)},${f2(hy - hr * 0.4)} Z`, shade(c, 0.1), 3.2) +
        W.line(`M${f2(cx - hr * 0.78)},${f2(hy - hr * 0.2)} Q${f2(cx)},${f2(hy + hr * 0.78)} ${f2(cx + hr * 0.78)},${f2(hy - hr * 0.2)}`, wh, F.big ? 3 : 2.2);
    } else {
      // おなかの ポケット（しろい ステッチ）
      const py0 = F.v(F.big ? 0.5 : 0.52), py1 = F.v(F.big ? 0.62 : 0.64), pw = F.hw * (F.big ? 0.55 : 0.62), px = cx + sx;
      body += W.line(`M${f2(px - pw)},${f2(py1)} Q${f2(px)},${f2(py0 - 2)} ${f2(px + pw)},${f2(py1)}`, cd, F.big ? 2.4 : 1.8);
    }
    body += W.rib(hem - (F.big ? 10 : 7), hem, cd, c) + W.hemLine(hem);
    const out = { sleeve: W.sleeves(ctx, c, { len: 0.84, cuff: wh }), torso: torsoClip(ctx, body) };
    if (!F.back) out.top = neckWrap(ctx, (s) => W.line("M-12,4 C-14,14 -12,24 -13,34 M12,4 C14,14 12,24 13,34", wh, s * 0.55) + W.dot(-13, 37, 3.6, wh, s * 0.35) + W.dot(13, 37, 3.6, wh, s * 0.35));
    return out;
  };
  // 4. マンタの マント: ひろい ひしがたの つばさ・あたまの ひれ 2つ・ほそい しっぽ。うしろから みると せなかの しろい もよう
  const manta = (ctx, s, back) => {
    const c = ctx.col[0] || "#2D4A78", wh = ctx.col[1] || "#F2F6FA", cl = shade(c, 0.16);
    let o = `<path d="M0,30 C2,40 1,48 5,58" fill="none" stroke="${INK}" stroke-width="${f2(s * 0.9)}" stroke-linecap="round"/>`;
    o += [-1, 1].map((d) => `<path d="M${6 * d},-27 C${11 * d},-37 ${18 * d},-40 ${20 * d},-33 C${18 * d},-28 ${13 * d},-26 ${8 * d},-24 Z" fill="${c}" ${ink(s * 0.8)}/>`).join("");
    o += `<path d="M0,-30 C18,-30 40,-18 84,0 C62,8 42,18 24,24 C15,28 7,29 0,29 C-7,29 -15,28 -24,24 C-42,18 -62,8 -84,0 C-40,-18 -18,-30 0,-30 Z" fill="${c}" ${ink(s)}/>`;
    o += `<path d="M-60,2 C-40,-6 -20,-12 0,-13 C20,-12 40,-6 60,2" fill="none" stroke="${cl}" stroke-width="${f2(s * 0.5)}" stroke-linecap="round"/>`;
    if (back) o += [-1, 1].map((d) => `<path d="M${10 * d},-20 C${24 * d},-20 ${34 * d},-12 ${36 * d},-4 C${26 * d},-8 ${16 * d},-10 ${8 * d},-10 Z" fill="${wh}" fill-opacity="0.9"/>`).join("") +
      [-1, 1].map((d) => `<circle cx="${30 * d}" cy="6" r="2.2" fill="${wh}" fill-opacity="0.8"/><circle cx="${42 * d}" cy="4" r="1.6" fill="${wh}" fill-opacity="0.7"/>`).join("");
    return o;
  };
  WEAR.mw_manta = (ctx) => {
    if (ctx.view === "back") return { top: backWrap(ctx, (s) => manta(ctx, s, true)) };
    return {
      behind: backWrap(ctx, (s) => manta(ctx, s, false)),
      top: neckWrap(ctx, (s) => `<path d="M-40,-3 C-20,6 20,6 40,-3" fill="none" stroke="${INK}" stroke-width="${f2(s * 1.6)}" stroke-linecap="round"/><path d="M-40,-3 C-20,6 20,6 40,-3" fill="none" stroke="${ctx.col[0] || "#2D4A78"}" stroke-width="${f2(s * 0.8)}" stroke-linecap="round"/><circle cx="0" cy="5" r="6" fill="${ctx.col[1] || "#F2F6FA"}" ${ink(s * 0.7)}/><path d="M-3,5 Q0,2 3,5" fill="none" stroke="${INK}" stroke-width="${f2(s * 0.4)}" stroke-linecap="round"/>`),
    };
  };
  // 5. ほねほね めがね: クリームいろの まるい ふち（ほねの いろ）・はなの うえの ほね・よこの ほね
  WEAR.mw_boneglass = (ctx) => ({
    top: eyeWrap(ctx, (s) => {
      const c = ctx.col[0] || "#F4EBD3";
      let o = "";
      for (const x of [-21, 21]) o += `<circle cx="${x}" cy="0" r="14" fill="#FFFFFF" fill-opacity="0.3" stroke="${INK}" stroke-width="${f2(s * 1.9)}"/><circle cx="${x}" cy="0" r="14" fill="none" stroke="${c}" stroke-width="${f2(s * 1.05)}"/>`;
      o += bone(-6, -4, 6, -4, 3.4, c, s * 0.4);
      return o + bone(-48, -3, -36, -1, 3, c, s * 0.4) + bone(36, -1, 48, -3, 3, c, s * 0.4);
    }),
  });
  // 6. きばの ネックレス: かわひも・ちいさな ビーズ・まんなかに しろい きば（きんの わ）。うしろは ひもだけ
  WEAR.mw_fang = (ctx) => ({
    top: neckWrap(ctx, (s) => {
      const c = ctx.col[0] || "#8A5A3B", tooth = ctx.col[1] || "#FFF9EA";
      const cord = `<path d="M-42,-2 C-24,16 24,16 42,-2" fill="none" stroke="${INK}" stroke-width="${f2(s * 1.2)}" stroke-linecap="round"/><path d="M-42,-2 C-24,16 24,16 42,-2" fill="none" stroke="${c}" stroke-width="${f2(s * 0.55)}" stroke-linecap="round"/>`;
      if (ctx.view === "back") return cord;
      let o = cord;
      for (const t of [0.22, 0.36, 0.64, 0.78]) { const x = -42 + 84 * t, y = -2 + Math.sin(t * Math.PI) * 13.5; o += `<circle cx="${f2(x)}" cy="${f2(y)}" r="3.4" fill="${t < 0.5 ? "#E7C46B" : "#9FC6A0"}" ${ink(s * 0.4)}/>`; }
      o += `<rect x="-4.5" y="10" width="9" height="5" rx="2" fill="#E7C46B" ${ink(s * 0.45)}/>`;
      o += `<path d="M-5.5,15 C-6,26 -3,34 1,41 C4,33 6,25 5.5,15 Z" fill="${tooth}" ${ink(s * 0.6)}/>`;
      return o + `<path d="M-2,19 C-2,25 -0.5,30 1,34" fill="none" stroke="#D9CBAA" stroke-width="${f2(s * 0.35)}" stroke-linecap="round"/>`;
    }),
  });
  // 7. ステゴ パーカー: みどりの パーカー・まえは きいろい おなか。うしろ・よこは オレンジの いたが せぼねに そって ならぶ
  const plate = (x, y, h, w, fill, sw, dir = 0) => {
    // dir 0: うえむき（せなかの まんなか）・1: みぎむき（よこむきの せなか）
    if (dir) return `<path d="M${f2(x)},${f2(y - w)} L${f2(x + h * 0.7)},${f2(y - w * 0.75)} L${f2(x + h)},${f2(y)} L${f2(x + h * 0.7)},${f2(y + w * 0.75)} L${f2(x)},${f2(y + w)} Z" fill="${fill}" ${ink(sw)}/>`;
    return `<path d="M${f2(x - w)},${f2(y)} L${f2(x - w * 0.75)},${f2(y - h * 0.7)} L${f2(x)},${f2(y - h)} L${f2(x + w * 0.75)},${f2(y - h * 0.7)} L${f2(x + w)},${f2(y)} Z" fill="${fill}" ${ink(sw)}/>`;
  };
  WEAR.mw_stego = (ctx) => {
    const W = IkeWear, F = W.frame(ctx), c = ctx.col[0] || "#7CB663", pl = ctx.col[1] || "#F2B347", cd = shade(c, -0.22), belly = "#E9F2B8";
    const { cx, sx } = F, hem = F.v(F.big ? 0.86 : 0.9), k = F.big ? 1 : 0.72;
    let body = garment(ctx, hem, c);
    if (F.back) {
      // せぼねに そって いた 4まい（ひだり・みぎ こうご）・フード
      const hy = F.v(F.big ? 0.1 : 0.16), hr = F.hw * (F.big ? 0.44 : 0.66);
      body += W.p(`M${f2(cx - hr)},${f2(hy - hr * 0.4)} Q${f2(cx - hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx)},${f2(hy + hr * 1.05)} Q${f2(cx + hr * 1.05)},${f2(hy + hr * 0.9)} ${f2(cx + hr)},${f2(hy - hr * 0.4)} Z`, shade(c, 0.1), 3.2);
      // ほんものと おなじ 2れつ（こうご）。まんなかは 3人の しっぽ・せなかの もようが うえに くるので すこし はなす
      [0.4, 0.52, 0.64, 0.76].forEach((t, i) => { body += plate(cx + (i % 2 ? 1 : -1) * F.hw * 0.34, F.v(t) + 8 * k, 18 * k, 8 * k, pl, 2.4); });
    } else {
      body += W.p(`M${f2(cx + sx - F.hw * 0.5)},${f2(hem)} C${f2(cx + sx - F.hw * 0.56)},${f2(F.v(0.42))} ${f2(cx + sx + F.hw * 0.56)},${f2(F.v(0.42))} ${f2(cx + sx + F.hw * 0.5)},${f2(hem)} Z`, belly, 2.6);
      for (const t of [0.56, 0.68, 0.8]) body += W.line(`M${f2(cx + sx - F.hw * 0.4)},${f2(F.v(t))} Q${f2(cx + sx)},${f2(F.v(t) + 3)} ${f2(cx + sx + F.hw * 0.4)},${f2(F.v(t))}`, shade(belly, -0.15), 1.4);
    }
    body += W.rib(hem - (F.big ? 10 : 7), hem, cd, c) + W.hemLine(hem);
    const out = { sleeve: W.sleeves(ctx, c, { len: 0.84, cuff: cd }), torso: torsoClip(ctx, body) };
    if (F.side) {
      // よこむき（ひだりむき）: せなかの がわ（みぎ）に いたが はみだす（からだの うしろ）
      const ex = cx + F.hw - 6;
      out.behind = [0.28, 0.46, 0.64].map((t) => plate(ex, F.v(t), 20 * k, 8 * k, pl, 2.4, 1)).join("");
    }
    if (!F.back) out.top = neckWrap(ctx, (s) => W.line("M-12,4 C-14,14 -12,24 -13,34 M12,4 C14,14 12,24 13,34", pl, s * 0.55) + plate(-13, 40, 7, 3.4, pl, s * 0.35) + plate(13, 40, 7, 3.4, pl, s * 0.35));
    return out;
  };
  // 8. プテラの つばさ: とがった ながい つばさ・まえの ふちの ゆび（つめ）・まくの すじ
  WEAR.mw_ptera = (ctx) => {
    const c = ctx.col[0] || "#C77E48", m = ctx.col[1] || "#F2CDA2";
    const wing = (s, dir) => `<g transform="scale(${dir},1)"><path d="M6,-8 C26,-34 58,-46 94,-44 C84,-34 76,-20 72,-6 C62,-10 52,-6 46,2 C38,-4 28,-2 22,6 C16,2 10,2 6,4 Z" fill="${m}" ${ink(s)}/>` +
      `<path d="M6,-8 C26,-34 58,-46 94,-44 C70,-40 44,-30 10,-4 Z" fill="${c}" ${ink(s * 0.8)}/>` +
      `<path d="M30,-24 C40,-14 44,-6 46,2 M52,-34 C60,-22 66,-12 72,-6" fill="none" stroke="${shade(m, -0.2)}" stroke-width="${f2(s * 0.55)}" stroke-linecap="round"/>` +
      `<path d="M56,-38 C58,-44 62,-46 64,-43" fill="none" ${ink(s * 0.8)}/></g>`;
    const w = backWrap(ctx, (s) => wing(s, 1) + wing(s, -1));
    return ctx.view === "back" ? { top: w } : { behind: w };
  };

  // ---- ゲームに いれる（おみせには ならばない）----
  for (const it of ITEMS) {
    const w = { id: it.id, name: it.name, slot: it.slot, wear: it.id, col: it.col, price: 0, rare: true, exclusive: "museum", museumWear: it.hall, st: it.st, desc: it.desc };
    WEAR_ITEMS.push(w); ITEM_INDEX[it.id] = w;
  }

  const st = () => { const m = Save.d.museum; if (!m.wear || typeof m.wear !== "object" || Array.isArray(m.wear)) m.wear = {}; return m.wear; };
  // きふの かず（すいぞくかんは さかなの しゅるい・はくぶつかんは ほねの かず）
  const count = (hall) => Object.keys((Save.d.museum && Save.d.museum[hall === "aquarium" ? "fish" : "bones"]) || {}).length;
  const list = (hall) => ITEMS.filter((it) => it.hall === hall);
  return {
    ITEMS, INDEX, HALL, count, list,
    has(id) { return !!st()[id]; },
    next(hall) { return list(hall).find((it) => !st()[it.id]) || null; },
    // とどいた ものを わたす（わたした ものの ならび）
    claim(hall, day = U.today()) {
      const n = count(hall), w = st(), out = [];
      for (const it of list(hall)) if (n >= it.need && !w[it.id]) { w[it.id] = String(day); WearStock.add(it.id, 1); out.push(it); }
      if (out.length) { Save.mark(); Save.write(); }
      return out;
    },
    // きふの まどの みだしの したに だす: つぎの ごほうび
    hint(hall) {
      const nx = this.next(hall), H = HALL[hall];
      return nx ? `ごほうび「${nx.name}」まで あと ${nx.need - count(hall)}${H.unit}（${H.what} ${nx.need}${H.unit} きふ）` : `げんていの ふく 4つ、ぜんぶ もらったよ！`;
    },
    source(id) { const it = INDEX[id]; if (!it) return ""; const H = HALL[it.hall]; return `${H.name}に ${H.what} ${it.need}${H.unit} きふすると もらえる げんていの ふく だよ。`; },
    pic(it) { return Art.iconSvg("wear", it.id); },
    // もらった ときの カード（館の 人が わたす）
    card(it, name, face) {
      return new Promise((done) => {
        const H = HALL[it.hall], body = U.el("div", { class: "mw-card" });
        body.innerHTML = `<div class="mw-art">${this.pic(it)}</div><div class="mw-name"></div><div class="mw-need"></div><p class="mw-desc"></p><div class="mw-trio">${Chara.IDS.map((id) => `<div class="mw-who">${Chara.svg(id, { outfit: { [it.slot]: it.id }, face: "happy" })}</div>`).join("")}</div><p class="mw-note">1こで ひとり きられるよ。おうちの「きがえ」で つけてね。</p>`;
        body.querySelector(".mw-name").textContent = it.name;
        body.querySelector(".mw-need").textContent = `${H.name}に ${H.what} ${it.need}${H.unit} きふした ごほうび`;
        body.querySelector(".mw-desc").textContent = it.desc;
        Sound.se("fanfare");
        const m = UI.modal({ title: `🎁 ${name || H.name}から`, body, cls: "mw-panel", footer: UI.btn("ありがとう！", () => m.close(), "yellow wide"), onClose: done });
      });
    },
    // 館の 人の ところで: とどいた ものを じゅんに わたす
    async reward(hall, n, face) {
      const got = this.claim(hall);
      for (const it of got) await this.card(it, n && n.name, face);
      return got;
    },
    state() { return Object.fromEntries(Object.keys(HALL).map((h) => [h, { count: count(h), got: list(h).filter((it) => st()[it.id]).map((it) => it.id), next: this.next(h) ? this.next(h).id : null, hint: this.hint(h) }])); },
  };
})();
