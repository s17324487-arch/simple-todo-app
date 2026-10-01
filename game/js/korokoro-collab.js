// ごわが × ころころ フルーツ の コラボ グッズ（オーナーの FB 2026-09-30「コロコロフルーツに ついても 同様だ。5000てん・8000てん・10000てん・13000てん・15000てんの
// 景品を コロコロフルーツと ごわがの コラボグッズとして 用意せよ」）。はじめは つみたて だったが、オーナーの FB 2026-10-01「コロコロフルーツの景品が
// 積立になっているが、そうでなく、一度の達成ポイントにしてくれ」で スコア モードの 1かいの スコアに した（CollabGoods の mode: "best"）。
// 1かいの スコアは こどもの ボットで まんなか 990てん・いちばん 3050てん、ていねいな ボットで まんなか 1210てん・いちばん 4270てん（24かい）。
// 5000〜15000てんは 1かいでは とどかない ので、めやすを 5で わって 1000・1600・2000・2600・3000てん に した（ならびの わりあいは そのまま）。
// はじめて よむ ときは まえからの ハイスコアから（もう とどいて いる グッズは その とき わたす）。
// デザインは ころころ フルーツの 見た目（きの はこ・あかい てんせん・くだもの 5しゅと がちゃん・わんこ・ごじの 玉）に そろえた。
// ほんものの スイカゲームの グッズ（くっつけられる ぬいぐるみ・いちばん 大きい くだものの BIG クッション など）を 参考に した。
// 服 2つ（WEAR.kc_tee・WEAR.kc_cap。IkeWear と おなじ かさね）・家具 3つ（FurnModels の 立体・FurnLive の さわる うごき）。
const KorokoroCollab = (() => {
  const TAU = Math.PI * 2, f4 = (n) => (Math.round(n * 1e4) / 1e4).toString();
  // ころころ フルーツの はこ（mg-korokoro.js と おなじ いろ）: き（まえ・よこ・うえ）・なか・たての すじ・あかい てんせん
  const BOX = ["#E4B57F", "#C98E57", "#F2CFA0"], BOX_IN = "#FFF8EA", BOX_ST = "#FBEFD8", RED = "#E8453C", LEAF = "#7CC46E", STEM = "#7A5634";
  // だんの いろ（プリント・バッジ の ちいさな 玉。korokoro-art.js の 玉と おなじ）
  const TIER_COL = ["#E8545E", "#F0606B", "#F7A43A", "#E9525A", "#EBD27C", "#FADA78", "#FFFFFF", "#8C8686"];
  const ITEMS = [
    { id: "kc_tee", need: 1000, kind: "wear", slot: "body", wear: "kc_tee", col: ["#FFF6E4", "#E8545E"], st: { hp: 5, spd: 1 }, name: "ころころ フルーツ Tシャツ",
      desc: "むねに はこから のぞく 3にんの たま。せなかには 8しゅの たまが まるく ならぶよ。" },
    { id: "kc_pool", need: 1600, kind: "furn", w: 100, depth: 100, h: 40, comfort: 9, name: "ころころ ボールプール",
      desc: "ころころ フルーツの はこに たまが いっぱい。タップすると ぽんぽん はねるよ。" },
    { id: "kc_cap", need: 2000, kind: "wear", slot: "head", wear: "kc_cap", col: ["#EE5A64", "#7CC46E"], st: { sp: 3 }, name: "ころころ いちご ぼうし",
      desc: "いちごの かたちの ニットぼう。よこに 3にんの たまの バッジ。" },
    { id: "kc_bed", need: 2600, kind: "furn", w: 110, depth: 84, h: 80, comfort: 11, sleep: 2, name: "ころころ はこの ベッド",
      desc: "きの はこの ベッドに 3にんの たまの まくら。ねると ごきげんが ふえるよ。" },
    { id: "kc_plush", need: 3000, kind: "furn", w: 76, depth: 66, h: 140, comfort: 12, name: "ごわが くっつき ぬいぐるみ",
      desc: "1かいで 3000てんの あかし。ごじ・わんこ・がちゃんが くっついた おおきな ぬいぐるみ。" },
  ];

  // ---- ちいさな 玉（服の プリント・バッジ・もうふの もよう）: だん t を (x, y) に 半径 r で。w は 線の はば・face は かお ----
  const ink = (w) => `stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
  const mini = (t, x, y, r, w = 1.6, face = true) => {
    const X = (k) => f2(x + r * k), Y = (k) => f2(y + r * k), fw = Math.max(0.7, w * 0.62);
    const eye = (k, dy) => `<circle cx="${X(k)}" cy="${Y(dy)}" r="${f2(Math.max(0.55, r * 0.12))}" fill="${INK}"/>`;
    const eyes = (gap = 0.34, dy = -0.02) => (face ? eye(-gap, dy) + eye(gap, dy) : "");
    const smile = (dy = 0.24) => (face && r >= 3 ? `<path d="M${X(-0.17)},${Y(dy)} Q${X(0)},${Y(dy + 0.17)} ${X(0.17)},${Y(dy)}" fill="none" stroke="${INK}" stroke-width="${f2(fw)}" stroke-linecap="round"/>` : "");
    const leaf = (k, dy, len, rot) => { const lx = X(k), ly = Y(dy), L = r * len; return `<path d="M${lx},${ly} q${f2(L * 0.45)},${f2(-L * 0.5)} ${f2(L)},0 q${f2(-L * 0.45)},${f2(L * 0.5)} ${f2(-L)},0Z" transform="rotate(${rot} ${lx} ${ly})" fill="${LEAF}" ${ink(w * 0.8)}/>`; };
    const stem = (k0, dy0, k1, dy1) => `<path d="M${X(k0)},${Y(dy0)} Q${X((k0 + k1) / 2 + 0.08)},${Y((dy0 + dy1) / 2)} ${X(k1)},${Y(dy1)}" fill="none" stroke="${STEM}" stroke-width="${f2(w * 1.15)}" stroke-linecap="round"/>`;
    const disc = (fill) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${fill}" ${ink(w)}/>`;
    const shine = `<ellipse cx="${X(-0.38)}" cy="${Y(-0.4)}" rx="${f2(r * 0.26)}" ry="${f2(r * 0.15)}" transform="rotate(-35 ${X(-0.38)} ${Y(-0.4)})" fill="#FFFFFF" fill-opacity=".6"/>`;
    if (t === 0) return stem(0, -0.88, 0.45, -1.7) + leaf(0.32, -1.45, 0.75, -20) + disc(TIER_COL[0]) + shine + eyes() + smile();
    if (t === 1) {
      // いちご: まるい さんかく・つぶ・みどりの へた
      const d = `M${X(0)},${Y(-0.72)} C${X(0.55)},${Y(-0.98)} ${X(1.06)},${Y(-0.7)} ${X(0.98)},${Y(-0.18)} C${X(0.9)},${Y(0.42)} ${X(0.32)},${Y(0.94)} ${X(0)},${Y(1)} C${X(-0.32)},${Y(0.94)} ${X(-0.9)},${Y(0.42)} ${X(-0.98)},${Y(-0.18)} C${X(-1.06)},${Y(-0.7)} ${X(-0.55)},${Y(-0.98)} ${X(0)},${Y(-0.72)} Z`;
      const seeds = [[-0.58, -0.3], [0.58, -0.3], [-0.44, 0.42], [0.44, 0.42], [0, 0.72]].map(([a, b]) => `<ellipse cx="${X(a)}" cy="${Y(b)}" rx="${f2(r * 0.07)}" ry="${f2(r * 0.1)}" fill="#FCE58C"/>`).join("");
      const calyx = `<path d="M${X(-0.62)},${Y(-0.72)} L${X(-0.3)},${Y(-1.02)} L${X(-0.12)},${Y(-0.76)} L${X(0)},${Y(-1.08)} L${X(0.12)},${Y(-0.76)} L${X(0.3)},${Y(-1.02)} L${X(0.62)},${Y(-0.72)} Q${X(0)},${Y(-0.55)} ${X(-0.62)},${Y(-0.72)} Z" fill="${LEAF}" ${ink(w * 0.8)}/>`;
      return `<path d="${d}" fill="${TIER_COL[1]}" ${ink(w)}/>` + seeds + calyx + eyes(0.34, 0.02) + smile(0.3);
    }
    if (t === 2) return disc(TIER_COL[2]) + leaf(0.06, -0.94, 0.62, -15) + `<circle cx="${X(0)}" cy="${Y(-0.9)}" r="${f2(r * 0.14)}" fill="#8FB45A" ${ink(w * 0.7)}/>` + shine + eyes() + smile();
    if (t === 3) {
      // りんご: うえが くぼんだ かたち・くき・はっぱ
      const d = `M${X(0)},${Y(-0.62)} C${X(0.28)},${Y(-0.9)} ${X(0.98)},${Y(-0.82)} ${X(0.96)},${Y(-0.08)} C${X(0.94)},${Y(0.6)} ${X(0.42)},${Y(1)} ${X(0.14)},${Y(0.92)} C${X(0.05)},${Y(0.89)} ${X(-0.05)},${Y(0.89)} ${X(-0.14)},${Y(0.92)} C${X(-0.42)},${Y(1)} ${X(-0.94)},${Y(0.6)} ${X(-0.96)},${Y(-0.08)} C${X(-0.98)},${Y(-0.82)} ${X(-0.28)},${Y(-0.9)} ${X(0)},${Y(-0.62)} Z`;
      return `<path d="${d}" fill="${TIER_COL[3]}" ${ink(w)}/>` + stem(0, -0.6, 0.12, -1.22) + leaf(0.1, -1.02, 0.7, -28) + shine + eyes(0.34, 0.05) + smile(0.3);
    }
    if (t === 4) return disc(TIER_COL[4]) + stem(0, -0.95, 0.12, -1.36) + leaf(0.1, -1.18, 0.62, -10) + shine + eyes() + smile();
    if (t === 5) return disc(TIER_COL[5]) + (face ? eyes(0.34, -0.1) + `<path d="M${X(-0.22)},${Y(0.1)} L${X(0)},${Y(-0.02)} L${X(0.22)},${Y(0.1)} L${X(0)},${Y(0.32)} Z" fill="#F29A1F" ${ink(w * 0.7)}/>` : "");
    if (t === 6) {
      // わんこ: しろい かお・くろい たれみみ・はな
      const ear = (k) => `<ellipse cx="${X(k * 0.9)}" cy="${Y(0)}" rx="${f2(r * 0.34)}" ry="${f2(r * 0.52)}" transform="rotate(${k * -18} ${X(k * 0.9)} ${Y(0)})" fill="${INK}"/>`;
      return disc("#FFFFFF") + ear(-1) + ear(1) + (face ? eyes(0.3, -0.05) + `<ellipse cx="${X(0)}" cy="${Y(0.2)}" rx="${f2(r * 0.12)}" ry="${f2(r * 0.09)}" fill="${INK}"/>` : "");
    }
    // ごじ: はいいろ・あたまの うえの 目・しろい くちに あかい ぎざぎざ
    const bump = (k) => `<circle cx="${X(k)}" cy="${Y(-0.78)}" r="${f2(r * 0.26)}" fill="${TIER_COL[7]}" ${ink(w * 0.8)}/>` + (face ? `<circle cx="${X(k)}" cy="${Y(-0.78)}" r="${f2(Math.max(0.5, r * 0.1))}" fill="${INK}"/>` : "");
    const mouth = face ? `<rect x="${X(-0.46)}" y="${Y(0.02)}" width="${f2(r * 0.92)}" height="${f2(r * 0.34)}" rx="${f2(r * 0.12)}" fill="#FFFFFF" ${ink(w * 0.7)}/>` +
      `<path d="M${X(-0.4)},${Y(0.19)} L${X(-0.27)},${Y(0.08)} L${X(-0.13)},${Y(0.3)} L${X(0)},${Y(0.08)} L${X(0.13)},${Y(0.3)} L${X(0.27)},${Y(0.08)} L${X(0.4)},${Y(0.19)}" fill="none" stroke="#E8262A" stroke-width="${f2(Math.max(0.6, w * 0.7))}" stroke-linejoin="round"/>` : "";
    return disc(TIER_COL[7]) + bump(-0.5) + bump(0.5) + mouth;
  };

  // ---- 服 ----
  // Tシャツ（リンガー）: クリームいろ・あかい えりと そでぐち。むねは きの はこ（あかい てんせん）から ごじ・わんこ・がちゃんが のぞき、さくらんぼが ころん。
  // せなかは 8しゅの たまが まるく ならぶ（ほんものの スイカゲームの「しんかの わ」の ように、ちいさい じゅんに ひとまわり）
  WEAR.kc_tee = (ctx) => {
    const W = IkeWear, F = W.frame(ctx), c = ctx.col[0] || "#FFF6E4", r = ctx.col[1] || RED, cd = shade(c, -0.14);
    const { cx, sx } = F, hem = F.v(F.big ? 0.8 : 0.84), lw = F.big ? 2 : 1.6;
    let body = garment(ctx, hem, c) + `<path d="M${f2(cx + F.hw * 0.52)},${f2(F.T.top)} C${f2(cx + F.hw * 0.72)},${f2(F.v(0.4))} ${f2(cx + F.hw * 0.72)},${f2(hem - 10)} ${f2(cx + F.hw * 0.64)},${f2(hem)} H220 V${f2(F.T.top)} Z" fill="${cd}" opacity=".3"/>`;
    body += W.line(`M${f2(cx - 30)},${f2(F.T.top)} Q${f2(cx)},${f2(F.T.top + 16)} ${f2(cx + 30)},${f2(F.T.top)}`, r, 3.4);
    if (F.back) {
      const ry = F.v(F.big ? 0.5 : 0.52), R = F.hw * (F.big ? 0.44 : 0.52), px = cx + sx;
      body += `<circle cx="${f2(px)}" cy="${f2(ry)}" r="${f2(R)}" fill="none" stroke="${r}" stroke-width="${f2(lw * 0.8)}" stroke-dasharray="${f2(lw * 1.6)} ${f2(lw * 1.4)}"/>`;
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i / 8) * TAU, mr = R * (0.2 + i * 0.022) * (F.big ? 1 : 0.92);
        body += mini(i, px + Math.cos(a) * R, ry + Math.sin(a) * R, mr, lw * 0.8, F.big || i >= 5);
      }
      body += `<path d="${starPath(px, ry, R * 0.26, R * 0.12)}" fill="${r}" ${ink(lw * 0.7)}/>`;
    } else {
      // むねの はこ: 3人の 玉 → はこの まえの いた（玉の したを かくす）→ あかい てんせん
      const px = cx + sx, bw = F.hw * (F.big ? 0.88 : 1.02), by = F.v(F.big ? 0.44 : 0.5), bh = bw * 0.46, k = bw / 50;
      body += mini(7, px - bw * 0.44, by - bh * 0.05, 13 * k, lw) + mini(6, px + bw * 0.46, by + bh * 0.02, 11.5 * k, lw) + mini(5, px + bw * 0.02, by - bh * 0.42, 10 * k, lw);
      body += mini(0, px + bw * 0.9, by - bh * 0.66, 5.2 * k, lw * 0.85, F.big);
      body += `<rect x="${f2(px - bw)}" y="${f2(by)}" width="${f2(bw * 2)}" height="${f2(bh)}" rx="${f2(3 * k)}" fill="${BOX[0]}" ${ink(lw)}/>` +
        `<rect x="${f2(px - bw + 3 * k)}" y="${f2(by + 3 * k)}" width="${f2(bw * 2 - 6 * k)}" height="${f2(bh - 6 * k)}" rx="${f2(2 * k)}" fill="${BOX_IN}"/>`;
      for (let i = 1; i < 6; i++) body += `<rect x="${f2(px - bw + 3 * k + ((bw * 2 - 6 * k) * i) / 6 - 1.6 * k)}" y="${f2(by + 3 * k)}" width="${f2(3.2 * k)}" height="${f2(bh - 6 * k)}" fill="${BOX_ST}"/>`;
      body += W.line(`M${f2(px - bw - 2 * k)},${f2(by - 4 * k)} H${f2(px + bw + 2 * k)}`, r, lw * 0.9, `stroke-dasharray="${f2(lw * 2)} ${f2(lw * 1.6)}"`);
      body += `<rect x="${f2(px - bw)}" y="${f2(by + bh - 4 * k)}" width="${f2(bw * 2)}" height="${f2(4 * k)}" fill="${BOX[1]}" ${ink(lw * 0.8)}/>`;
    }
    body += W.hemLine(hem);
    return { sleeve: W.sleeves(ctx, c, { len: 0.44, cuff: r }), torso: torsoClip(ctx, body) };
  };
  // いちごの ニットぼう: あかい まるい ぼうし・きいろい つぶ・てっぺんに みどりの へた（はっぱ 6まい）と くき・したは ゴムあみ。
  // よこに 3人の 玉の バッジ（うしろ すがたでは はんたいがわ）
  const sepal = (a, len, w, fill, sw) => `<path d="M0,0 C${f2(len * 0.3)},${f2(-w)} ${f2(len * 0.75)},${f2(-w * 0.9)} ${f2(len)},0 C${f2(len * 0.75)},${f2(w * 0.9)} ${f2(len * 0.3)},${f2(w)} 0,0 Z" transform="rotate(${a})" fill="${fill}" ${ink(sw)}/>` +
    `<path d="M${f2(len * 0.12)},0 L${f2(len * 0.78)},0" transform="rotate(${a})" stroke="${shade(fill, -0.3)}" stroke-width="${f2(sw * 0.6)}" stroke-linecap="round"/>`;
  WEAR.kc_cap = (ctx) => ({
    top: hatWrap(ctx, (s) => {
      const c = ctx.col[0] || "#EE5A64", g = ctx.col[1] || LEAF, cd = shade(c, -0.16), L = (w) => ink(s * w);
      let o = `<path d="M-50,2 C-55,-56 55,-56 50,2 Z" fill="${c}" ${L(1)}/>`;
      o += `<path d="M31,-30 C44,-20 50,-8 49,1 L41,1 C42,-10 39,-20 31,-30 Z" fill="${cd}" opacity=".35"/>`;
      o += [[-30, -27], [-12, -37], [8, -33], [28, -25], [-38, -14], [-20, -19], [0, -21], [20, -14], [38, -12], [-28, -38], [26, -40]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="3.6" fill="#FCE58C" stroke="#D9A43A" stroke-width="${f2(s * 0.16)}"/>`).join("");
      // したの ゴムあみ
      o += `<rect x="-54" y="-10" width="108" height="16" rx="8" fill="${cd}" ${L(1)}/>` + [-42, -30, -18, -6, 6, 18, 30, 42].map((x) => `<path d="M${x},-7 V3" stroke="${shade(c, -0.3)}" stroke-width="${f2(s * 0.4)}" stroke-linecap="round"/>`).join("");
      // てっぺんの へた: おくの 2まい → くき → まえの 6まい（よこへ ひろがって すこし たれる）
      o += `<g transform="translate(0 -41)">${sepal(-150, 18, 4.6, shade(g, -0.12), s * 0.7)}${sepal(-30, 18, 4.6, shade(g, -0.12), s * 0.7)}` +
        `<path d="M0,-2 C-1,-10 2,-16 7,-20" fill="none" stroke="${shade(g, -0.35)}" stroke-width="${f2(s * 1.1)}" stroke-linecap="round"/>` +
        [176, 150, 122, 58, 30, 4].map((a, i) => sepal(a, i === 2 || i === 3 ? 20 : 25, 5.6, g, s * 0.7)).join("") + `<circle cx="0" cy="0" r="4" fill="${shade(g, -0.2)}" ${L(0.6)}/></g>`;
      // 3人の 玉の バッジ（ごじ・わんこ・がちゃん）
      const bx = ctx.view === "back" ? -30 : 30;
      o += mini(7, bx - 6, -2, 7.4, s * 0.42) + mini(6, bx + 8, -1, 6.6, s * 0.42) + mini(5, bx + 1, -12, 5.8, s * 0.42);
      return o;
    }),
  });

  // ---- 家具の 立体（FurnModels の kit。x は よこ・y は おく〔-d〜0〕・z は 上）----
  const Sh = FurnModels.shapes;
  // ころころ フルーツの 玉の 絵（KorokoroArt）を <g> で うめこむ。いれこの <svg> に しない（CSS の「svg { width: 100% }」で くずれない）。玉の 絵に id は ない
  const art = (tier, emo, cx, cy, r) => {
    const crop = KorokoroArt.cropOf(tier), svg = KorokoroArt.svg(tier, emo, Math.max(24, r * 4 * crop));
    const [vx, vy, vw] = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+)/.exec(svg).slice(1).map(Number), k = (r * 2 * crop) / vw;
    return `<g transform="translate(${f2(cx - (vx + vw / 2) * k)} ${f2(cy - (vy + vw / 2) * k)}) scale(${f4(k)})">${svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</g>`;
  };
  // 床に おいた 玉（した まんなかが 0,0・上は -y）
  const ballAt = (k, tier, emo, x, y, z, R) => k.at(x, y, z, art(tier, emo, 0, -R, R), R * KorokoroArt.cropOf(tier), R * 2 * KorokoroArt.cropOf(tier), false);
  const M = {};

  // 1. ころころ ボールプール: ころころ フルーツの はこ（きの かべ・なかは クリームいろの すじ・ふちに あかい てんせん）に 玉が こんもり
  // 玉は 5×5 の ます目に（3人の 玉は おおきく、まわりの ますを あける）。[だん, x, y, 玉の したの 高さ, 半径]。おくから てまえの じゅん（はんてんでも x + y の じゅんは おなじ）
  const POOL_H = 22, POOL_R = [5.2, 6, 6.6, 7.2, 7.8, 10.5, 11.5, 12.5];
  const POOL_BALLS = (() => {
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out = [[7, -9, -57], [6, 18, -40], [5, -17, -27]], fruits = [2, 0, 3, 1, 4, 0, 2, 1, 3, 0, 4, 2, 1, 0, 3, 2, 4, 1, 0, 2, 3, 1, 0, 4, 2];
    let n = 0;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const x = -32 + i * 16 + (rnd() - 0.5) * 5, y = -82 + j * 16 + (rnd() - 0.5) * 5, t = fruits[n++];
      if (out.some(([t2, x2, y2]) => Math.hypot(x - x2, y - y2) < (POOL_R[t2] + POOL_R[t]) * 0.82)) continue;
      out.push([t, x, y]);
    }
    return out.map(([t, x, y]) => { const R = POOL_R[t], mid = Math.max(0, 1 - Math.hypot(x, y + 50) / 44); return [t, +x.toFixed(2), +y.toFixed(2), +(POOL_H - R * 0.3 + mid * 6 + (t >= 5 ? 3 : 0)).toFixed(2), R]; })
      .sort((a, b) => a[1] + a[2] - (b[1] + b[2]));
  })();
  M.kc_pool = (k) => {
    const { box, shape, TP, FR, SD, lineOn, onP, shadow, L } = k, H = POOL_H, T = 7;
    let s = shadow(0.12, 2, 8);
    // おくと ひだりの かべ → なかの ゆか（はこの なかの いろと たての すじ）→ みぎと てまえの かべ
    s += box(-50, -100, 100, T, 0, H, BOX) + box(-50, -93, T, 86, 0, H, BOX);
    s += shape(TP(H - 5), Sh.rect(-43, -93, 86, 86), BOX_IN, 1.2);
    for (let i = 0; i < 6; i++) s += shape(TP(H - 4.95), Sh.rect(-43 + 4 + i * 14, -93, 6, 86), BOX_ST, 0);
    s += box(43, -93, T, 86, 0, H, BOX) + box(-50, -7, 100, T, 0, H, BOX);
    // そとの かべの いたの すじ・したの こい いろ
    s += lineOn(FR(0), [[-50, 11], [50, 11]], BOX[1], 1.1) + lineOn(SD(50), [[-100, 11], [0, 11]], BOX[1], 1.1);
    s += shape(FR(0.05), Sh.rect(-50, 0, 100, 4), BOX[1], 1) + shape(SD(50.05), Sh.rect(-100, 0, 100, 4), shade(BOX[1], -0.1), 1);
    // ふちの あかい てんせん（ころころ フルーツの はこの せん）
    s += lineOn(TP(H + 0.05), Sh.close(Sh.rect(-46.5, -96.5, 93, 93)), RED, 1.3, 'stroke-dasharray="3.2 2.6"');
    // まえの いたに 3人の 玉の しるし
    s += onP(FR(0.1), -16, 18, 32, 12, `<rect x="0" y="0" width="32" height="12" rx="4" fill="${BOX_IN}" ${ink(1)}/>` + mini(7, 7, 6, 4.2, 0.8) + mini(6, 16, 6, 3.8, 0.8) + mini(5, 25, 6, 3.4, 0.8));
    s += L(POOL_BALLS.map(([t, x, y, z, R]) => ballAt(k, t, t >= 5 ? "happy" : "normal", x, y, z, R)).join(""));
    return s;
  };

  // 2. ころころ はこの ベッド: きの はこの わく・クリームいろの すじの マットレス・くだものの もようの もうふ・3人の 玉の まくら・
  // ヘッドボードに くだもの 5しゅと あかい てんせん。まくらは [だん, x, y, 玉の したの 高さ, 半径]
  const BED_TOP = 34, BED_PILLOWS = [[7, -32, -66, BED_TOP - 3, 12.5], [6, 1, -66, BED_TOP - 3, 12], [5, 33, -66, BED_TOP - 3, 11]];
  const QUILT = (() => {
    // もうふの もよう（104 × 42）: さくらんぼ・みかん・なし・いちご・3人の ちいさな かお
    let o = `<rect x="0" y="0" width="104" height="42" fill="#F8C9B4"/>`;
    for (let i = 0; i < 9; i++) o += `<path d="M${6 + i * 12},0 V42" stroke="#F3B8A0" stroke-width="5"/>`;
    const dots = [[0, 8, 7], [2, 24, 9], [4, 40, 6], [1, 56, 9], [3, 72, 6], [0, 88, 9], [2, 100, 5], [5, 16, 21], [3, 32, 23], [6, 48, 20], [0, 64, 23], [7, 80, 21], [4, 96, 22],
      [1, 8, 35], [2, 24, 37], [0, 40, 34], [4, 56, 37], [5, 72, 35], [3, 88, 37]];
    for (const [t, x, y] of dots) o += mini(t, x, y, t >= 5 ? 4 : 3.2, 0.7, t >= 5);
    return o;
  })();
  M.kc_bed = (k) => {
    const { box, shape, prism, TP, FR, SD, lineOn, onP, cyl, shadow, byDepth, L } = k, z1 = BED_TOP;
    let s = shadow(0.13, 3, 12);
    for (const [x, y] of byDepth([[-50, -79], [50, -79], [-50, -5], [50, -5]])) s += cyl(x, y, 0, 3.6, 7, BOX[1], shade(BOX[1], 0.12), 1.3, 16);
    // ヘッドボード（はこの おくの かべ。うえが まるい）
    s += prism(FR(-78), Sh.arch(-55, 55, 7, 62, 80), [0, -6, 0], BOX[0], BOX[1]);
    s += onP(FR(-77.9), -46, 72, 92, 30, `<path d="M0,30 V12 Q46,-2 92,12 V30 Z" fill="${BOX_IN}" ${ink(1.1)}/>` + [14, 30, 46, 62, 78].map((x) => `<rect x="${x - 2}" y="${x === 46 ? 4 : 8}" width="4" height="${x === 46 ? 26 : 22}" fill="${BOX_ST}"/>`).join("") +
      `<path d="M3,20 H89" stroke="${RED}" stroke-width="1.2" stroke-dasharray="3 2.4"/>` + [0, 1, 2, 3, 4].map((t, i) => mini(t, 16 + i * 15, 10.5 - Math.sin((i / 4) * Math.PI) * 3, 4.4, 0.8)).join(""));
    // わく（はこ）と マットレス
    s += box(-55, -78, 110, 78, 7, 17, BOX);
    s += lineOn(FR(0), [[-55, 16], [55, 16]], BOX[1], 1) + lineOn(SD(55), [[-78, 16], [0, 16]], BOX[1], 1);
    s += box(-51, -76, 102, 72, 24, z1 - 24, ["#FFF4E2", "#EAD8BC", BOX_IN], 1.3);
    for (let i = 0; i < 7; i++) s += shape(TP(z1 + 0.05), Sh.rect(-48 + i * 14.5, -74, 6, 30), BOX_ST, 0);
    // もうふ（うえ・まえ・よこに たれる）と おりかえし
    s += shape(TP(z1 + 0.6), Sh.rect(-52, -46, 104, 42.5), "#F8C9B4", 1.3) + onP(TP(z1 + 0.7), -52, -3.5, 104, 42.5, QUILT);
    s += shape(FR(-3.4), [[-52, z1 + 0.6], [52, z1 + 0.6], [52, 24.6], [-52, 24.6]], "#F3B8A0", 1.3) + shape(SD(52.1), [[-46, z1 + 0.6], [-3.4, z1 + 0.6], [-3.4, 24.6], [-46, 24.6]], "#EEAE95", 1.3);
    s += shape(TP(z1 + 0.9), Sh.rect(-52, -47, 104, 7), "#FFF4E2", 1.2) + lineOn(TP(z1 + 1), [[-50, -43.5], [50, -43.5]], "#F3B8A0", 1, 'stroke-dasharray="2.4 2"');
    // わくの まえに 3人の 玉の しるしと あかい てんせん
    s += lineOn(FR(0.05), [[-53, 22], [53, 22]], RED, 1.1, 'stroke-dasharray="3 2.4"');
    s += onP(FR(0.1), -16, 19.5, 32, 11, `<rect x="0" y="0" width="32" height="11" rx="4" fill="${BOX_IN}" ${ink(1)}/>` + mini(7, 7, 5.5, 3.8, 0.8) + mini(6, 16, 5.5, 3.5, 0.8) + mini(5, 25, 5.5, 3.2, 0.8));
    s += L(BED_PILLOWS.map(([t, x, y, z, R]) => ballAt(k, t, "normal", x, y, z, R)).join(""));
    return s;
  };

  // 3. ごわが くっつき ぬいぐるみ: したから ごじ・わんこ・がちゃん の 玉が くっついた おおきな ぬいぐるみ（つなぎめの スナップ・ぬのの タグ・がちゃんの リボン）。
  // [だん, 玉の したの 高さ, 半径, ゆれの 大きさ]
  const PLUSH_Y = -33, PLUSH = [[7, 0, 30, 1.5], [6, 52, 24, 4.5], [5, 93, 19.5, 7.5]];
  // かざり（ぬのの タグ・リボン・スナップ）: (0, 0) が まんなかの 小さな 絵。モデルと FurnLive で おなじ 絵
  const TAG = `<g transform="rotate(14)"><rect x="-3.2" y="-4.2" width="6.4" height="8.4" rx="1" fill="#FFFFFF" ${ink(1)}/><path d="M-1.8,-1.5 H1.8 M-1.8,0.8 H1.8" stroke="${RED}" stroke-width="0.8"/></g>`;
  const BOW = `<g transform="rotate(18)"><path d="M0,0 L-6,-4 L-6,4 Z M0,0 L6,-4 L6,4 Z" fill="${RED}" ${ink(1)}/><circle cx="0" cy="0" r="1.8" fill="#F7858D" ${ink(0.8)}/></g>`;
  const SNAP = `<circle cx="0" cy="0" r="2.6" fill="#FFF4E2" ${ink(0.9)}/><circle cx="0" cy="0" r="1.05" fill="#E4C9A0"/>`;
  // 玉の まんなか c・半径 R からの かざりの ばしょ（タグは ごじの みぎした・リボンは がちゃんの みぎうえ）
  const tagAt = (c, R) => ({ x: c.x + R * 0.66, y: c.y + R * 0.5 }), bowAt = (c, R) => ({ x: c.x + R * 0.58, y: c.y - R * 0.72 });
  const put = (q, svg) => `<g transform="translate(${f2(q.x)} ${f2(q.y)})">${svg}</g>`;
  M.kc_plush = (k) => {
    const { shape, TP, P, L } = k;
    let toys = "";
    PLUSH.forEach(([t, z, R], i) => {
      toys += ballAt(k, t, t === 7 ? "normal" : "happy", 0, PLUSH_Y, z, R);
      if (i < 2) { const j = P(0, PLUSH_Y, PLUSH[i + 1][1] + 3); toys += put({ x: j.x - R * 0.42, y: j.y }, SNAP) + put({ x: j.x + R * 0.42, y: j.y }, SNAP); }
      const c = P(0, PLUSH_Y, z + R);
      if (i === 0) toys += put(tagAt(c, R), TAG);
      if (i === 2) toys += put(bowAt(c, R), BOW);
    });
    // かげは いつも。玉と かざりは live の とき FurnLive が ゆらして 描く（点は かぞえるので 絵の はんいは おなじ）
    return shape(TP(0), Sh.ov(0, PLUSH_Y, 31, 27, 36), INK, 0, 'fill-opacity=".13"') + L(toys);
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- さわる（FurnLive）----
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  const since = (st) => G.t - st.t0;
  // いちばん ちかくの 子が ひとこと
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };
  const tone = (list, step = 0.09, type = "triangle", vol = 0.12) => { if (Sound.ctx && Save.d?.settings?.se) list.forEach((f, i) => Sound.tone(Sound.seGain, { f, t: i * step, dur: 0.14, type, vol, a: 0.005, r: 0.3 })); };
  const pop = (list, step = 0.1) => list.forEach((t, i) => setTimeout(() => KorokoroSound.merge(t), i * step * 1000));
  const blink = (i) => KorokoroScore.blinkAt(G.t, i);
  // 床の 点 (x, y, z) に したが くる 玉（半径 R）を canvas に
  const drawBall = (ctx, P, tier, emo, x, y, z, R, ang = 0) => { const c = P(x, y, z + R); KorokoroArt.draw(ctx, tier, emo, c.x, c.y, R * P.s, ang); return c; };
  // かざりの 小さな 絵（リボン・タグ・スナップ。vw × vh の 絵の たんい）を (x, y) を まんなかに s ばいで canvas に。キーは かざりの しゅるいと ピクセル（8 の ばいすう）だけ（有限）
  const drawBit = (ctx, key, svg, x, y, vw, vh, s) => {
    const w = vw * s, h = vh * s, px = Math.max(8, Math.ceil((w * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * vh) / vw));
    const c = SvgCache.get(`kcbit:${key}:${px}`, () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-vw / 2} ${-vh / 2} ${vw} ${vh}">${svg}</svg>`, px, py);
    if (c) ctx.drawImage(c, x - w / 2, y - h / 2, w, h);
  };

  // 1. ボールプール: タップで 玉が ぽんぽん はねる（3人は にっこり・くだものは びっくり）。ふだんは 3人の 玉が ときどき まばたき
  FurnLive.register("kc_pool", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; pop([2, 4, 5, 6, 7], 0.09); say(sc, it, ["ぽんぽん はねる〜！", "ごじが かくれてた！", "くだものの プール、たのしい！"][st.n % 3], "note"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st);
      POOL_BALLS.forEach(([tier, x, y, z, R], i) => {
        const ph = t - i * 0.022, up = ph > 0 && ph < 2 ? (6 + (i % 4) * 3) * Math.exp(-ph * 2.3) * Math.abs(Math.sin(ph * 8 + i)) : 0, hero = tier >= 5;
        const emo = up > 2 ? (hero ? "happy" : "surprise") : hero ? (blink(i) ? "blink" : "happy") : "normal";
        drawBall(ctx, P, tier, emo, x, y, z + up, R, up > 1 ? Math.sin(ph * 11 + i) * 0.2 : 0);
      });
    },
  }, true);
  // 2. ベッド: よるは 3人の まくらが ねむる（タップすると あくび）。ひるは タップで 4びょう おひるね（isOn = ねて いる）。ふだんは まばたき
  const napping = (st) => (typeof DayTint !== "undefined" && DayTint.isNight()) || since(st) < 4;
  FurnLive.register("kc_bed", {
    isOn: napping,
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone([784, 659, 523, 392], 0.16, "sine", 0.09); say(sc, it, ["おやすみ、ころころ〜", "3にんの まくら、ふかふか", "ぐっすり ねむれそう"][st.n % 3], "dots"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), night = typeof DayTint !== "undefined" && DayTint.isNight(), nap = napping(st);
      BED_PILLOWS.forEach(([tier, x, y, z, R], i) => {
        const emo = night && t >= 0 && t < 1.3 ? "yawn" : nap ? "sleep" : blink(i) ? "blink" : "normal";
        const c = drawBall(ctx, P, tier, emo, x, y, z + (nap ? Math.sin(G.t * 2 + i) * 0.7 : 0), R);
        if (nap && tier === 7) {
          // ごじの ねむりの しるし（ほかの 2人は 絵に z が ある）
          const k = (G.t * 0.6 + i * 0.3) % 1;
          ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = INK; ctx.font = `900 ${Math.round((9 + k * 4) * P.s)}px 'M PLUS Rounded 1c', sans-serif`; ctx.textAlign = "center";
          ctx.fillText("z", c.x + R * 0.9 * P.s + k * 6 * P.s, c.y - R * 1.1 * P.s - k * 12 * P.s); ctx.restore();
        }
      });
    },
  }, true);
  // 3. ぬいぐるみ: タップで したから じゅんに ぽよん ぽよん ゆれて ハートの 目に。ふだんは まばたき
  FurnLive.register("kc_plush", {
    tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; pop([5, 6, 7], 0.12); say(sc, it, ["くっつき ぬいぐるみ、ぽよん！", "3にん いっしょ！", "ふわふわ だね〜"][st.n % 3], "heart"); },
    draw(ctx, sc, it, r, st) {
      const P = mapper(sc, it, r), t = since(st), on = t >= 0 && t < 2.4;
      let sway = 0;
      PLUSH.forEach(([tier, z, R, A], i) => {
        const ph = t - i * 0.08;
        sway = on && ph > 0 ? A * Math.sin(ph * 9) * Math.exp(-ph * 2.2) : 0;
        const emo = on && t < 1.4 ? "love" : on ? "happy" : blink(i) ? "blink" : tier === 7 ? "normal" : "happy";
        const c = drawBall(ctx, P, tier, emo, sway, PLUSH_Y, z, R, sway * 0.025), Rs = R * P.s;
        if (i < 2) { const j = P(sway, PLUSH_Y, PLUSH[i + 1][1] + 3); for (const k of [-1, 1]) drawBit(ctx, "snap", SNAP, j.x + k * R * 0.42 * P.s, j.y, 7, 7, P.s); }
        if (i === 0) { const q = tagAt(c, Rs); drawBit(ctx, "tag", TAG, q.x, q.y, 11, 11, P.s); }
        if (i === 2) { const q = bowAt(c, Rs); drawBit(ctx, "bow", BOW, q.x, q.y, 16, 16, P.s); }
      });
      if (on && t < 1.6) {
        const k = t / 1.6, top = P(0, PLUSH_Y, 140);
        ctx.save(); ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 3; i++) FX.heart(ctx, top.x - 16 * P.s + i * 16 * P.s + Math.sin(k * 7 + i) * 4 * P.s, top.y - k * 26 * P.s - i * 4 * P.s, 6 * P.s, ["#F06292", "#F7A1B0", "#FFB3C1"][i]);
        ctx.restore();
      }
    },
  }, true);

  // ---- ライン（CollabGoods）----
  // 1かいの さいこうの はじめ: まえからの ハイスコア（ランキングの いちばん うえ）
  const seed = () => {
    const st = Save.d.shops && Save.d.shops.korokoro;
    if (!st) return 0;
    const top = (Array.isArray(st.tops) ? st.tops : []).filter((e) => e && Number.isFinite(e.s)).reduce((a, e) => Math.max(a, e.s), 0);
    return Math.max(0, top, Number.isFinite(st.hi) ? st.hi : 0);
  };
  const line = CollabGoods.register({ id: "korokoro", name: "ごわが × ころころ フルーツ コラボ", game: "ころころ フルーツ", unit: "てん", mode: "best", seed, items: ITEMS,
    lead: "スコア モードの 1かいの スコアが めやすに とどくと、げんていの ふくや かぐが もらえるよ（たさないで 1かいで！）。" });
  return { ITEMS, line, mini, POOL_BALLS, BED_PILLOWS, PLUSH, seed };
})();
