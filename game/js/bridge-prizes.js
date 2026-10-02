// Meeときょれじゃ 2F の はしわたし（橋渡し）の けいひん 14しゅ: フィギュア 6（3人の プレミアム フィギュア）・ざっか 8（へやの ライト・せんぷうき など）。
// ほんものの ゲームセンターの はしわたしの プライズ（まどつきの はこの フィギュア・はこいりの 家電や ざっか）を もとに、なまえと 絵は この ゲームの ために つくった。
// とれた けいひんは 家具（へやに かざる）。絵は 3つ: へやの 絵（FURN_ART・120×130）・クレーンの はこの テクスチャ（まえ・うしろ・よこ・うえ）・おうちの 立体（IkebukuroItemArt.model）。
// はこの 大きさは どれも 24×12×15cm（はしの すきま 13.5cm より みじかい へんが 1.5cm せまい）。テクスチャに id は つかわない（なかの 絵は <image> で うめこむ）。
const BridgePrizes = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  const st = (w = 2.4, c = K) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const txt = (x, y, s, t, c = K, extra = "") => `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(s)}" font-weight="900" text-anchor="middle" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif" fill="${c}" ${extra}>${t}</text>`;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = (s) => { const v = (n >> s) & 255; return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }; return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const circle = (x, y, r, fill, extra = "") => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}" ${extra}/>`;
  const ell = (x, y, rx, ry, fill, extra = "") => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" ${extra}/>`;
  const rect = (x, y, w, h, rx, fill, extra = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rx)}" fill="${fill}" ${extra}/>`;
  const star = (x, y, R, fill, extra = "") => `<path d="${starPath(x, y, R, R * 0.46)}" fill="${fill}" ${extra}/>`;
  const heart = (x, y, s, fill, extra = "") => `<path d="M${f1(x)} ${f1(y + s * 0.9)} C${f1(x - s * 1.3)} ${f1(y)} ${f1(x - s * 0.9)} ${f1(y - s * 0.9)} ${f1(x)} ${f1(y - s * 0.25)} C${f1(x + s * 0.9)} ${f1(y - s * 0.9)} ${f1(x + s * 1.3)} ${f1(y)} ${f1(x)} ${f1(y + s * 0.9)}Z" fill="${fill}" ${extra}/>`;
  const note = (x, y, s, fill) => `<path d="M${f1(x)} ${f1(y)} V${f1(y - s * 2.2)} L${f1(x + s * 1.4)} ${f1(y - s * 1.8)}" fill="none" ${st(Math.max(1.4, s * 0.34))}/>${ell(x - s * 0.5, y, s * 0.62, s * 0.46, fill, `${st(Math.max(1.2, s * 0.26))} transform="rotate(-20 ${f1(x - s * 0.5)} ${f1(y)})"`)}`;
  const sheen = (x, y, w, h) => `<path d="M${f1(x)} ${f1(y + h)} Q${f1(x - w * 0.15)} ${f1(y + h * 0.35)} ${f1(x + w * 0.55)} ${f1(y)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(Math.max(2, w * 0.2))}" stroke-linecap="round" opacity="0.6"/>`;
  const cloud = (x, y, s, fill = "#FFFFFF", extra = "") => `<path d="M${f1(x - s * 1.6)} ${f1(y)} C${f1(x - s * 2.1)} ${f1(y)} ${f1(x - s * 2.1)} ${f1(y - s * 0.9)} ${f1(x - s * 1.4)} ${f1(y - s * 0.95)} C${f1(x - s * 1.3)} ${f1(y - s * 1.7)} ${f1(x - s * 0.3)} ${f1(y - s * 1.8)} ${f1(x)} ${f1(y - s * 1.2)} C${f1(x + s * 0.4)} ${f1(y - s * 1.9)} ${f1(x + s * 1.6)} ${f1(y - s * 1.6)} ${f1(x + s * 1.5)} ${f1(y - s * 0.85)} C${f1(x + s * 2.2)} ${f1(y - s * 0.8)} ${f1(x + s * 2.2)} ${f1(y)} ${f1(x + s * 1.6)} ${f1(y)} Z" fill="${fill}" ${extra}/>`;

  // ---- 3人（フィギュア）。Chara.svg を x y w h に おさめる（足もとを したに そろえる）----
  const HERO_VB = { wanko: "0 -8 200 222", gachan: "30 12 140 202", goji: "-6 -6 212 222" };
  const nest = (s, x, y, w, h, vb) => s.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMax meet" `);
  const hero = (who, o, x, y, w, h) => nest(Chara.svg(who, { pose: o.pose, face: o.face, dir: "down", outfit: o.outfit || {}, color: "soft" }), x, y, w, h, HERO_VB[who]);
  // フィギュアの だいざ（まるい だい・まえに なまえの プレート）。y0 = だいの うえの めんの まんなか
  const pedestal = (col, y0 = 112, rx = 50, word = "") => {
    const d = shade(col, -0.22), l = shade(col, 0.35);
    return ell(60, y0 + 12, rx + 4, 7, "#4F465622")
      + `<path d="M${60 - rx} ${y0} V${y0 + 8} A${rx} 10 0 0 0 ${60 + rx} ${y0 + 8} V${y0}" fill="${d}" ${st()}/>`
      + ell(60, y0, rx, 10, col, st()) + `<path d="M${60 - rx * 0.7} ${y0 - 3} Q60 ${y0 - 8} ${60 + rx * 0.5} ${y0 - 5}" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round"/>`
      + (word ? rect(38, y0 + 3.5, 44, 9, 3, "#FFF6D8", st(1.6)) + txt(60, y0 + 10.6, 6.6, word, d) : "");
  };
  // ---- フィギュア 6しゅ（120×130）----
  const FIG = {
    // わんこ ヒーロー: マントで ジャンプ・うしろに おおきな ほし・くも
    hero: () => {
      let s = `<path d="${starPath(60, 50, 50, 26, 8)}" fill="#FFE68A" ${st(2)}/>` + `<path d="${starPath(60, 50, 36, 20, 8)}" fill="#FFF6C8"/>`;
      s += cloud(22, 106, 9, "#FFFFFF", st(2)) + cloud(98, 104, 8, "#FFFFFF", st(2));
      s += pedestal("#7FB8E6", 112, 48, "ヒーロー") + hero("wanko", { pose: "jump_01", face: "excited", outfit: { back: "cape", body: "tshirt_star" } }, 14, 2, 92, 104);
      return s + [[16, 22], [104, 30], [100, 12]].map(([x, y], i) => star(x, y, 4 + (i % 2) * 2, "#FFFFFF", st(1.4))).join("") + `<path d="M8 70 H24 M6 80 H20 M100 76 H114" ${st(2.2, "#FFFFFF")}/>`;
    },
    // わんこ コック: エプロンと コックぼう・ホットケーキと フライパン
    chef: () => {
      let s = ell(60, 118, 54, 8, "#4F465622") + `<path d="M8 110 Q60 96 112 110 L112 118 Q60 106 8 118 Z" fill="#D95C5C" ${st()}/>`;
      s += `<path d="M8 110 Q60 96 112 110" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="7 7"/>` + `<path d="M8 110 Q60 96 112 110 L112 118 Q60 106 8 118 Z" fill="none" ${st()}/>`;
      // ホットケーキ（3まい・バター・シロップ）
      const cake = (y) => `<path d="M84 ${y} C84 ${y - 5} 110 ${y - 5} 110 ${y} C110 ${y + 5} 84 ${y + 5} 84 ${y} Z" fill="#E9B26A" ${st(2)}/><path d="M85 ${y - 1} Q97 ${y + 3} 109 ${y - 1}" fill="none" stroke="#FFE0A8" stroke-width="2"/>`;
      s += cake(104) + cake(98) + cake(92) + `<path d="M88 90 Q97 84 106 90 Q104 96 98 94 Q96 100 92 96 Q88 96 88 90 Z" fill="#B7743C" ${st(1.6)}/>` + rect(93, 83, 8, 6, 1.5, "#FFE680", st(1.6));
      s += hero("wanko", { pose: "idle_01", face: "happy", outfit: { head: "chefhat", body: "apron" } }, 4, 4, 84, 104);
      return s + `<path d="M104 70 q4 -6 0 -12 M112 74 q4 -6 0 -12" fill="none" ${st(2, "#C9C2B6")}/>`;
    },
    // がちゃん アイドル: ステージ・スタンドマイク・おんぷ
    idol: () => {
      let s = ell(60, 120, 54, 7, "#4F465622") + `<path d="M6 106 H114 L110 118 H10 Z" fill="#F2A7C0" ${st()}/>` + `<path d="M6 106 Q60 98 114 106 Z" fill="#FFD1E2" ${st()}/>`;
      s += [18, 38, 60, 82, 102].map((x, i) => circle(x, 112, 2.6, i % 2 ? "#FFF6B0" : "#FFFFFF", st(1.2))).join("");
      // スタンドマイク
      s += `<path d="M96 104 V58" ${st(2.6)}/><path d="M90 104 H102" ${st(3)}/>` + rect(92, 46, 8, 13, 4, "#9AA3AE", st(2)) + `<path d="M93 50 H99 M93 54 H99" ${st(1.2, "#5E6670")}/>`;
      s += hero("gachan", { pose: "jump_01", face: "sparkle", outfit: { head: "starclip", body: "dress" } }, 16, 4, 70, 100);
      return s + note(16, 44, 6, "#FF8FB8") + note(104, 28, 5, "#8FA6D8") + heart(22, 22, 5, "#FF7BA8", st(1.4)) + star(76, 14, 4.5, "#FFE68A", st(1.4));
    },
    // がちゃん おつきさま: みかづきの うえで すやすや・くも・ほし
    moon: () => {
      let s = ell(60, 122, 46, 6, "#4F465622") + `<path d="M14 72 C14 108 50 126 84 114 C100 108 110 96 112 84 C100 102 70 110 50 98 C32 88 26 74 30 58 C20 60 14 64 14 72 Z" fill="#FFE68A" ${st(2.6)}/>`;
      s += `<path d="M24 78 C28 96 44 106 64 108" fill="none" stroke="#FFF6C8" stroke-width="3" stroke-linecap="round"/>` + cloud(28, 120, 8, "#E9E4F7", st(2)) + cloud(94, 118, 7, "#E9E4F7", st(2));
      s += hero("gachan", { pose: "land_01", face: "sleep", outfit: { head: "moon_hat", body: "night_pajama" } }, 32, 18, 64, 84);
      s += [[18, 26, 5], [100, 20, 4], [108, 50, 3], [70, 10, 3.5]].map(([x, y, r]) => star(x, y, r, "#FFF6C8", st(1.2))).join("");
      return s + txt(92, 38, 11, "z", "#8FA6D8", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`) + txt(101, 28, 8, "z", "#8FA6D8", `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`);
    },
    // ごじ かいじゅう: ちいさな まちの まんなかで がおー（ビルは ぱすてる）
    kaiju: () => {
      let s = pedestal("#9CCB8E", 112, 52, "がおー！");
      const bld = (x, w, h, c) => rect(x, 112 - h, w, h, 2, c, st(2)) + Array.from({ length: Math.floor((h - 6) / 8) }, (_, j) => rect(x + 3, 112 - h + 4 + j * 8, w - 6, 3.4, 1, "#FFF6C8")).join("");
      s += bld(10, 16, 34, "#C9B6EE") + bld(92, 18, 40, "#9ED3E6") + bld(26, 12, 22, "#FFD1A8") + bld(80, 12, 26, "#F7B7C9");
      s += hero("goji", { pose: "idle_02", face: "shout", outfit: {} }, 18, 0, 84, 108);
      return s + `<path d="M22 24 l6 4 M16 34 l8 1 M98 22 l-6 4 M104 32 l-8 1" ${st(2.4, "#FF8F6B")}/>`;
    },
    // ごじ ゆうしゃ: よろいと ヘルメット・おかの うえに はた
    knight: () => {
      let s = ell(60, 122, 54, 7, "#4F465622") + `<path d="M6 116 C16 96 40 92 60 94 C80 92 104 96 114 116 Z" fill="#8CCB7E" ${st()}/>`;
      s += `<path d="M14 112 q4 -6 8 0 M96 108 q4 -6 8 0 M40 102 q3 -5 6 0" fill="none" ${st(1.6, "#5E9E52")}/>` + [[24, 108, "#FFFFFF"], [88, 104, "#FFE680"], [104, 112, "#F7B7C9"]].map(([x, y, c]) => circle(x, y, 2.6, c, st(1))).join("");
      s += `<path d="M98 100 V40" ${st(2.6)}/><path d="M98 42 L118 50 L98 58 Z" fill="#F29B38" ${st(2)}/>` + star(104, 50, 3.4, "#FFF6C8");
      s += hero("goji", { pose: "walk_01", face: "happy", outfit: { body: "armor", head: "helmet" } }, 4, 2, 88, 104);
      return s;
    },
  };

  // ---- ざっか 8しゅ（120×130）----
  const GOODS = {
    // ほしぞら プラネタリウム: こんいろの ドームに ほしの あな・まわりに ほしの ひかり
    planet: () => {
      let s = `<path d="M60 60 L6 16 M60 60 L30 4 M60 60 L90 4 M60 60 L114 16" stroke="#FFF6C8" stroke-width="10" stroke-linecap="round" opacity="0.35"/>`;
      s += ell(60, 120, 40, 6, "#4F465622") + `<path d="M26 104 H94 L88 118 H32 Z" fill="#F4F0FA" ${st()}/>` + rect(40, 108, 12, 5, 2, "#8FA6D8", st(1.4)) + circle(80, 110.5, 3, "#FF8FB8", st(1.2));
      s += `<path d="M24 104 C24 62 96 62 96 104 Z" fill="#3B3F7A" ${st(2.6)}/>` + `<path d="M24 104 H96" ${st(2.6)}/>` + `<path d="M30 92 C38 76 50 70 64 70" fill="none" stroke="#6C72C0" stroke-width="3" stroke-linecap="round"/>`;
      s += [[40, 88, 2.6], [54, 80, 2], [68, 76, 2.8], [82, 86, 2.2], [48, 96, 1.8], [76, 96, 2], [62, 90, 1.6]].map(([x, y, r]) => star(x, y, r * 1.4, "#FFF6C8")).join("");
      return s + [[14, 34, 5], [104, 30, 6], [30, 14, 3.5], [92, 10, 3], [60, 20, 4]].map(([x, y, r]) => star(x, y, r, "#FFE68A", st(1.3))).join("") + `<path d="M84 40 a8 8 0 1 0 8 10 a6 6 0 1 1 -8 -10 Z" fill="#FFF6C8" ${st(1.4)}/>`;
    },
    // くもの ルームライト: ふわふわの くもが あたたかく ひかる・にっこり
    cloud: () => {
      let s = `<circle cx="60" cy="66" r="52" fill="#FFF3B0" opacity="0.45"/>` + ell(60, 120, 40, 6, "#4F465622");
      s += `<path d="M60 100 C60 108 70 110 72 118" fill="none" ${st(2)}/>` + rect(66, 114, 14, 8, 3, "#FF8FB8", st(1.6));
      s += `<path d="M22 96 C8 96 6 76 20 72 C18 52 42 42 54 56 C60 38 90 38 94 58 C112 56 118 78 104 86 C112 98 100 106 90 100 C78 106 64 106 58 98 C48 106 30 104 22 96 Z" fill="#FFFFFF" ${st(2.6)}/>`;
      s += `<path d="M26 92 C38 98 52 98 58 92 C66 98 82 98 92 94" fill="none" stroke="#FFE68A" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;
      s += `<path d="M44 76 q5 -5 10 0 M66 76 q5 -5 10 0" fill="none" ${st(2.4)}/>` + `<path d="M54 84 Q60 90 66 84" fill="none" ${st(2.2)}/>` + ell(40, 84, 5, 3, "#F7A9C8") + ell(80, 84, 5, 3, "#F7A9C8");
      return s + [[16, 30, 4], [102, 24, 5], [58, 14, 3.5]].map(([x, y, r]) => star(x, y, r, "#FFE68A", st(1.2))).join("");
    },
    // ミニ せんぷうき: ミントいろ・まるい ガード・はねは 4まい
    fan: () => {
      let s = ell(60, 122, 34, 6, "#4F465622") + `<path d="M34 118 C34 108 86 108 86 118 Z" fill="#8ED1C0" ${st()}/>` + `<path d="M56 110 L54 84 H66 L64 110 Z" fill="#CFEFE6" ${st(2)}/>` + rect(44, 110, 10, 4, 2, "#FFFFFF", st(1.2)) + rect(66, 110, 10, 4, 2, "#FF8FB8", st(1.2));
      s += circle(60, 54, 40, "#E9F8F4", st(2.6));
      for (let k = 0; k < 4; k++) { const a = k * 90 + 20; s += `<path d="M60 54 C${f1(60 + Math.cos((a - 26) * Math.PI / 180) * 36)} ${f1(54 + Math.sin((a - 26) * Math.PI / 180) * 36)} ${f1(60 + Math.cos((a + 16) * Math.PI / 180) * 38)} ${f1(54 + Math.sin((a + 16) * Math.PI / 180) * 38)} 60 54 Z" fill="${["#F7B7C9", "#FFE68A", "#9ED3E6", "#C9B6EE"][k]}" ${st(2)}/>`; }
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; s += `<path d="M${f1(60 + Math.cos(a) * 14)} ${f1(54 + Math.sin(a) * 14)} L${f1(60 + Math.cos(a) * 39)} ${f1(54 + Math.sin(a) * 39)}" stroke="#8ED1C0" stroke-width="1.6" opacity="0.9"/>`; }
      s += circle(60, 54, 40, "none", st(2.6)) + circle(60, 54, 10, "#FFFFFF", st(2)) + txt(60, 57, 6, "Mee", "#FF8FB8");
      return s + `<path d="M8 40 q6 -3 12 0 q6 3 12 0 M92 30 q6 -3 12 0 q6 3 12 0" fill="none" ${st(2, "#9ED3E6")}/>`;
    },
    // まるい スピーカー: むらさきの まるい はこ・まえに おおきな スピーカー・おんぷ
    speaker: () => {
      let s = ell(60, 120, 38, 6, "#4F465622") + rect(26, 112, 68, 8, 3, "#8E7CC3", st(2));
      s += `<path d="M20 70 C20 34 100 34 100 70 C100 104 82 114 60 114 C38 114 20 104 20 70 Z" fill="#C9B6EE" ${st(2.6)}/>` + `<path d="M28 60 C32 44 48 38 60 38" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`;
      s += circle(60, 76, 26, "#5B4F86", st(2.4)) + circle(60, 76, 18, "#3E3560", st(1.6)) + circle(60, 76, 7, "#8E7CC3", st(1.6));
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; s += circle(60 + Math.cos(a) * 22, 76 + Math.sin(a) * 22, 1, "#8E7CC3"); }
      s += circle(40, 104, 2.4, "#7CFFB2", st(1)) + circle(48, 107, 2.4, "#FFE68A", st(1)) + txt(78, 108, 7, "Mee", "#FFFFFF");
      return s + note(14, 40, 6, "#FF8FB8") + note(104, 30, 6, "#9ED3E6") + note(94, 12, 4, "#FFE68A");
    },
    // めざまし どけい: ピンクの まるい とけい・うえに ベル 2つ・あし
    clock: () => {
      let s = ell(60, 122, 36, 6, "#4F465622") + `<path d="M36 106 L28 120 M84 106 L92 120" ${st(3.4)}/>`;
      s += `<path d="M24 44 C24 26 48 20 52 34 Z" fill="#FFD84D" ${st(2.4)}/><path d="M96 44 C96 26 72 20 68 34 Z" fill="#FFD84D" ${st(2.4)}/>` + `<path d="M54 26 H66 M60 26 V32" ${st(2.6)}/>` + circle(60, 24, 3, "#FFD84D", st(1.6));
      s += circle(60, 74, 40, "#F7A9C8", st(2.6)) + circle(60, 74, 31, "#FFFDF5", st(2.2));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 - Math.PI / 2, big = k % 3 === 0; s += circle(60 + Math.cos(a) * 25, 74 + Math.sin(a) * 25, big ? 2.6 : 1.4, big ? "#E0668F" : "#C9C2B6"); }
      s += `<path d="M60 74 L60 56 M60 74 L74 80" ${st(3)}/>` + circle(60, 74, 3, "#E0668F", st(1.4)) + `<path d="M36 52 C40 46 46 43 52 42" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.8"/>`;
      return s + `<path d="M14 30 l-6 -4 M12 42 h-7 M106 30 l6 -4 M108 42 h7" ${st(2.2, "#E0668F")}/>`;
    },
    // ふわふわ ブランケット: たたんだ もうふ 3まい・リボン・にくきゅう
    blanket: () => {
      let s = ell(60, 122, 52, 6, "#4F465622");
      const layer = (y, h, c, dx = 0) => `<path d="M${10 + dx} ${y} C${10 + dx} ${y - 6} ${110 - dx} ${y - 6} ${110 - dx} ${y} V${y + h} C${110 - dx} ${y + h + 5} ${10 + dx} ${y + h + 5} ${10 + dx} ${y + h} Z" fill="${c}" ${st(2.4)}/>`;
      s += layer(96, 18, "#BFE3F7", 0) + layer(78, 18, "#FFF1C8", 3) + layer(58, 20, "#F7C4D4", 1);
      s += `<path d="M14 104 C40 110 80 110 106 104 M16 86 C40 92 80 92 104 86 M14 66 C40 72 80 72 106 66" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="4 5" opacity="0.8"/>`;
      // にくきゅう
      s += ell(40, 68, 7, 6, "#FFFFFF", st(1.4)) + [[-6, -8], [0, -10], [6, -8]].map(([dx, dy]) => circle(40 + dx, 68 + dy, 2.4, "#FFFFFF", st(1.2))).join("");
      // リボン
      s += `<path d="M76 54 V122" stroke="#FF7BA8" stroke-width="7"/><path d="M76 54 V122" fill="none" ${st(1.2)}/>` + `<path d="M76 54 C66 44 60 50 64 58 C68 62 74 58 76 54 Z M76 54 C86 44 92 50 88 58 C84 62 78 58 76 54 Z" fill="#FF9EBE" ${st(2)}/>` + circle(76, 55, 3.2, "#FF7BA8", st(1.6));
      return s + star(20, 40, 4, "#FFE68A", st(1.2)) + star(104, 36, 5, "#FFE68A", st(1.2));
    },
    // 3にんの マグカップ: わんこ・がちゃん・ごじの かお・ゆげ
    mug: () => {
      let s = ell(60, 122, 56, 6, "#4F465622");
      const mug = (x, y, w, h, c, face, ears) => {
        let m = `<path d="M${x + w} ${y + 10} C${x + w + 12} ${y + 10} ${x + w + 12} ${y + h - 10} ${x + w} ${y + h - 12}" fill="none" ${st(4.6)}/><path d="M${x + w} ${y + 10} C${x + w + 12} ${y + 10} ${x + w + 12} ${y + h - 10} ${x + w} ${y + h - 12}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
        m += ears + `<path d="M${x} ${y} H${x + w} V${y + h - 6} C${x + w} ${y + h + 2} ${x} ${y + h + 2} ${x} ${y + h - 6} Z" fill="${c}" ${st(2.4)}/>` + ell(x + w / 2, y, w / 2, 4, shade(c, -0.25), st(2));
        return m + face(x + w / 2, y + h * 0.55);
      };
      const eyes = (cx, cy) => ell(cx - 6, cy - 2, 2, 2.6, K) + ell(cx + 6, cy - 2, 2, 2.6, K) + `<path d="M${cx - 3} ${cy + 4} Q${cx} ${cy + 7} ${cx + 3} ${cy + 4}" fill="none" ${st(1.6)}/>` + ell(cx - 10, cy + 3, 3, 2, "#F7A9C8") + ell(cx + 10, cy + 3, 3, 2, "#F7A9C8");
      s += mug(6, 74, 28, 40, "#F3DDB7", eyes, `<path d="M8 80 C0 80 -2 96 6 100 M32 80 C40 80 42 96 34 100" fill="#C99A76" ${st(2)}/>`);
      s += mug(44, 70, 28, 44, "#FFE68A", (cx, cy) => eyes(cx, cy) + `<path d="M${cx - 3} ${cy + 1} L${cx} ${cy + 4} L${cx + 3} ${cy + 1} Z" fill="#F29B38" ${st(1.2)}/>`, `<path d="M58 70 C56 62 62 58 60 52" fill="none" ${st(2)}/>`);
      s += mug(82, 76, 28, 38, "#B8D8C8", eyes, `<path d="M84 80 L80 72 L88 76 M108 80 L112 72 L104 76" fill="#8FB8A4" ${st(1.8)}/>`);
      return s + `<path d="M18 64 q-4 -8 0 -14 q4 -6 0 -12 M56 58 q-4 -8 0 -14 M96 66 q-4 -8 0 -14 q4 -6 0 -12" fill="none" ${st(2, "#C9C2B6")}/>`;
    },
    // ぶたの ちょきんばこ: ピンクの ぶた・コインの いれぐち・きんの コイン
    piggy: () => {
      let s = ell(60, 122, 44, 6, "#4F465622") + [34, 50, 70, 86].map((x) => rect(x - 5, 102, 10, 18, 4, "#F7A9C8", st(2.2))).join("");
      s += `<path d="M100 74 C112 70 110 60 104 62 C98 64 104 72 112 66" fill="none" ${st(2.4)}/>`;
      s += `<path d="M18 76 C18 46 44 36 64 38 C92 40 106 58 104 80 C102 100 84 110 60 110 C34 110 18 98 18 76 Z" fill="#F7B7C9" ${st(2.6)}/>`;
      s += `<path d="M34 44 L30 26 L48 38 Z" fill="#F29BB2" ${st(2.2)}/><path d="M70 40 L80 24 L86 44 Z" fill="#F29BB2" ${st(2.2)}/>` + rect(50, 42, 22, 5, 2.5, "#8C5A6A", st(1.6));
      s += ell(26, 82, 12, 10, "#F29BB2", st(2.2)) + ell(22, 82, 2.2, 3.4, "#8C5A6A") + ell(30, 82, 2.2, 3.4, "#8C5A6A") + ell(42, 66, 3, 3.6, K) + circle(43, 64.6, 1.1, "#FFFFFF") + ell(56, 88, 5, 3, "#FF8FB8", `opacity="0.7"`);
      s += `<path d="M40 52 C48 46 60 44 70 46" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.7"/>`;
      return s + ell(61, 30, 11, 11, "#FFD84D", st(2.2)) + circle(61, 30, 7, "none", st(1.2, "#C99A20")) + star(61, 30, 4.4, "#FFF3B0", st(1, "#C99A20")) + star(92, 20, 4, "#FFE68A", st(1.2));
    },
  };

  // ---- けいひんの 一覧 ----
  // [key, なまえ, しゅるい, はこの いろ [もと・おび・もじ], ことば（はこの おび）, せつめい]
  const LIST = [
    ["hero", "わんこ ヒーロー フィギュア", "fig", ["#8EC5E8", "#F2C84B", "#2F5A8A"], "ヒーロー", "マントで とびだす わんこの フィギュア。うしろに おおきな ほし。"],
    ["chef", "わんこ コック フィギュア", "fig", ["#F3B5A8", "#D95C5C", "#8A2F2F"], "コック", "コックさんの わんこと ホットケーキの フィギュア。"],
    ["idol", "がちゃん アイドル フィギュア", "fig", ["#F7B7C9", "#FFE68A", "#B0406A"], "アイドル", "ステージで うたう がちゃんの フィギュア。"],
    ["moon", "がちゃん おつきさま フィギュア", "fig", ["#B7B3E6", "#FFE68A", "#4B4690"], "おつきさま", "みかづきで ねむる がちゃんの フィギュア。"],
    ["kaiju", "ごじ かいじゅう フィギュア", "fig", ["#9CCB8E", "#FF8F6B", "#2F6A3A"], "かいじゅう", "ちいさな まちで がおーと ほえる ごじの フィギュア。"],
    ["knight", "ごじ ゆうしゃ フィギュア", "fig", ["#9ED3E6", "#F29B38", "#2F5A8A"], "ゆうしゃ", "よろいを きて たびに でる ごじの フィギュア。"],
    ["planet", "ほしぞら プラネタリウム", "goods", ["#3B3F7A", "#FFE68A", "#FFFFFF"], "ほしぞら", "へやの てんじょうに ほしを うつす ライト。"],
    ["cloud", "くもの ルームライト", "goods", ["#BFE3F7", "#FFE68A", "#2F5A8A"], "ルームライト", "ふわふわの くもが ぽかぽか ひかる ライト。"],
    ["fan", "ミニ せんぷうき", "goods", ["#8ED1C0", "#F7B7C9", "#2F6A5A"], "せんぷうき", "4まいの はねの ちいさな せんぷうき。"],
    ["speaker", "まるい スピーカー", "goods", ["#C9B6EE", "#7CFFB2", "#4B3F7A"], "スピーカー", "まるくて かわいい むらさきの スピーカー。"],
    ["clock", "めざまし どけい", "goods", ["#F7A9C8", "#FFD84D", "#8A2F5A"], "めざまし", "ベルが 2つ ついた ピンクの めざまし どけい。"],
    ["blanket", "ふわふわ ブランケット", "goods", ["#FFF1C8", "#FF7BA8", "#8A5A2F"], "ブランケット", "にくきゅうの もようの ふわふわ もうふ。"],
    ["mug", "3にんの マグカップ", "goods", ["#FFFDF5", "#F2C84B", "#8A5A2F"], "マグカップ", "わんこ・がちゃん・ごじの かおの マグカップ。"],
    ["piggy", "ぶたの ちょきんばこ", "goods", ["#F7B7C9", "#FFD84D", "#8C3A5A"], "ちょきんばこ", "コインを ためられる ピンクの ぶた。"],
  ];
  const BOX = [24, 12, 15]; // はこの 大きさ（cm）: よこ・たかさ・おくゆき
  const ITEMS = LIST.map(([key, name, kind, col, word, desc]) => ({ key, id: "ike_hashi_" + key, name, kind, col, word, desc, size: BOX }));
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const BY_KEY = Object.fromEntries(ITEMS.map((it) => [it.key, it]));
  const art = (it) => (it.kind === "fig" ? FIG : GOODS)[it.key]();
  // へやの 絵（120×130）
  const itemSvg = (id) => { const it = INDEX[id]; return it ? svg(120, 130, art(it)) : ""; };

  // ---- はこ（まどつき）: 1cm = 10 の SVG ----
  const U10 = 10, W = BOX[0] * U10, H = BOX[1] * U10, D = BOX[2] * U10;
  const img = (it, x, y, w, h) => `<image href="${U.svgUrl(itemSvg(it.id))}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMid meet"/>`;
  const badge = (x, y, r) => circle(x, y, r, "#FF8FB8", st(2)) + txt(x, y + r * 0.34, r * 0.8, "Mee", "#FFFFFF");
  const plate = (x, y, w, h, word, ink, fs) => rect(x, y, w, h, h * 0.45, "#FFFDF5", st(2.2)) + txt(x + w / 2, y + h * 0.5 + (fs || Math.min(h * 0.62, (w * 0.86) / Math.max(3, word.length))) * 0.36, fs || Math.min(h * 0.62, (w * 0.86) / Math.max(3, word.length)), word, ink);
  const kindWord = (it) => (it.kind === "fig" ? "フィギュア" : "Mee ざっか");
  // まえ: ひだりに まど（なかの けいひんが みえる）・みぎに なまえ
  const boxFront = (it) => {
    const [c, band, ink] = it.col, dark = shade(c, -0.25);
    let s = rect(1.5, 1.5, W - 3, H - 3, 6, c) + `<path d="M1.5 ${H * 0.8} H${W - 1.5} V${H - 6} Q${W - 1.5} ${H - 1.5} ${W - 6} ${H - 1.5} H6 Q1.5 ${H - 1.5} 1.5 ${H - 6} Z" fill="${band}"/>`;
    s += [0.62, 0.7].map((v) => `<path d="M${f1(W * 0.56)} ${f1(H * v)} H${f1(W * 0.96)}" stroke="${shade(c, 0.3)}" stroke-width="3" stroke-linecap="round"/>`).join("");
    // まど（とうめいの プラスチック・ふちは こい いろ）
    s += rect(8, 8, W * 0.5, H - 16, 8, "#F4FAFF", st(2.4)) + img(it, 10, 9, W * 0.5 - 4, H - 18) + rect(8, 8, W * 0.5, H - 16, 8, "#FFFFFF", `fill-opacity="0.12" ${st(3.2, dark)}`) + sheen(18, 14, 20, 40);
    s += plate(W * 0.555, H * 0.1, W * 0.41, H * 0.27, it.word, ink === "#FFFFFF" ? dark : ink) + txt(W * 0.72, H * 0.52, H * 0.1, kindWord(it), it.kind === "fig" ? dark : ink === "#FFFFFF" ? "#FFFFFF" : dark);
    s += badge(W * 0.915, H * 0.49, H * 0.085) + star(W * 0.585, H * 0.9, H * 0.05, "#FFFFFF") + txt(W * 0.775, H * 0.935, H * 0.085, "Meeときょれじゃ", shade(band, -0.45));
    return s + rect(1.5, 1.5, W - 3, H - 3, 6, "none", st(3));
  };
  // うしろ: しろい パネル（せつめいの せん）・バーコード
  const boxBack = (it) => {
    const [c, band] = it.col;
    let s = rect(1.5, 1.5, W - 3, H - 3, 6, shade(c, -0.05)) + rect(W * 0.08, H * 0.14, W * 0.5, H * 0.62, 4, "#FFFFFF", st(1.8));
    s += [0.28, 0.4, 0.52, 0.64].map((v, i) => `<path d="M${f1(W * 0.12)} ${f1(H * v)} H${f1(W * (0.54 - (i % 2) * 0.1))}" ${st(1.6, "#C9C2B6")}/>`).join("");
    s += img(it, W * 0.62, H * 0.1, W * 0.3, H * 0.5) + rect(W * 0.64, H * 0.64, W * 0.28, H * 0.18, 2, "#FFFFFF", st(1.4)) + Array.from({ length: 14 }, (_, i) => rect(W * 0.66 + i * W * 0.017, H * 0.66, i % 3 ? 1 : 1.8, H * 0.13, 0, K)).join("");
    return s + rect(1.5, H * 0.84, W - 3, H * 0.16 - 1.5, 4, band) + rect(1.5, 1.5, W - 3, H - 3, 6, "none", st(3));
  };
  // うえ: なまえ・この めんを うえに（やじるし）・けいひんの 絵
  const boxTop = (it) => {
    const [c, band, ink] = it.col, dark = shade(c, -0.25);
    let s = rect(1.5, 1.5, W - 3, D - 3, 5, shade(c, 0.1)) + `<path d="M1.5 ${f1(D * 0.5)} H${W - 1.5}" stroke="${band}" stroke-width="${f1(D * 0.16)}" opacity="0.85"/>`;
    const fs = Math.min(D * 0.2, (W * 0.46) / Math.max(4, it.word.length));
    s += img(it, W * 0.04, D * 0.08, W * 0.3, D * 0.84) + txt(W * 0.595, D * 0.5 + fs * 0.36, fs, it.word, ink === "#FFFFFF" ? dark : ink, `stroke="#FFFFFF" stroke-width="3" paint-order="stroke"`);
    s += `<path d="M${f1(W * 0.9)} ${f1(D * 0.78)} V${f1(D * 0.3)} M${f1(W * 0.9 - 7)} ${f1(D * 0.3 + 8)} L${f1(W * 0.9)} ${f1(D * 0.3)} L${f1(W * 0.9 + 7)} ${f1(D * 0.3 + 8)}" fill="none" ${st(3, dark)}/>`;
    return s + badge(W * 0.9, D * 0.14, D * 0.08) + rect(1.5, 1.5, W - 3, D - 3, 5, "none", st(3));
  };
  // よこ: まるい まどに けいひん・Mee
  const boxSide = (it) => {
    const [c, band] = it.col;
    return rect(1.5, 1.5, D - 3, H - 3, 5, shade(c, -0.08)) + rect(1.5, H * 0.8, D - 3, H * 0.2 - 1.5, 4, shade(band, -0.08)) + circle(D / 2, H * 0.42, H * 0.3, "#FFFFFF", st(2)) + img(it, D / 2 - H * 0.28, H * 0.14, H * 0.56, H * 0.56) + rect(1.5, 1.5, D - 3, H - 3, 5, "none", st(3));
  };
  // クレーンの テクスチャ: look = "hashi-<key>"（front・back・top・side）
  const tex = {}, texSize = {};
  for (const it of ITEMS) {
    const L = "hashi-" + it.key, k = 1.6;
    tex[L + "-front"] = () => wrap(W, H, boxFront(it)); tex[L + "-back"] = () => wrap(W, H, boxBack(it));
    tex[L + "-top"] = () => wrap(W, D, boxTop(it)); tex[L + "-side"] = () => wrap(D, H, boxSide(it));
    texSize[L + "-front"] = [Math.round(W * k), Math.round(H * k)]; texSize[L + "-back"] = texSize[L + "-front"]; texSize[L + "-top"] = [Math.round(W * k), Math.round(D * k)]; texSize[L + "-side"] = [Math.round(D * k), Math.round(H * k)];
  }
  // 館の 台の なかの 絵（はこの まえ）。ratio = よこ / たて
  const boxSvg = (id) => { const it = INDEX[id]; return it ? tex["hashi-" + it.key + "-front"]() : ""; };
  const ratio = () => BOX[0] / BOX[1];
  // おうちの 立体（たって いる 絵・足もとに かげ）
  const model = (id) => { const f = FURN_INDEX[id], w = f.w, h = f.h; return { x: -w / 2, y: -h, w, h: h + 12, footW: w, footD: f.depth, height: h, full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h} ${w} ${h + 12}">${itemSvg(id).replace("<svg ", `<svg x="${-w / 2}" y="${-h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `)}</svg>` }; };
  const install = () => {
    for (const it of ITEMS) {
      const [w, h, depth] = it.kind === "fig" ? [96, 104, 56] : [90, 98, 56];
      const f = { id: it.id, name: it.name, price: 0, kind: "floor", w, h, depth, comfort: 6, rare: true, interactive: true, exclusive: "ikebukuro", arcadePrize: true, cityItem: { type: "hashiprize", variant: it.id }, desc: it.desc };
      FURNITURE.push(f); FURN_INDEX[it.id] = f;
      FURN_ART[it.id] = () => itemSvg(it.id).replace("<svg ", `<svg x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
    }
    const model0 = IkebukuroItemArt.model;
    IkebukuroItemArt.model = function (id, opts = {}) { return INDEX[id] ? model(id) : model0.call(this, id, opts); };
    Object.assign(CraneArt.TEX, tex); Object.assign(CraneArt.SIZE, texSize);
  };
  return { ITEMS, INDEX, BY_KEY, BOX, FIG, GOODS, itemSvg, boxSvg, ratio, model, install, tex };
})();
BridgePrizes.install();
