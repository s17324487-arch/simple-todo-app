// コンビニ × ごわがの コラボ けいひんの 絵（UI-86・しくみは js/conbini-collab.js・こうかんは js/conbini-card.js）。
// ・ローリソン（あお と しろ・ぎゅうにゅう びんの しるし）と せぶんぶん（オレンジ・みどり・あかの しま）で ちがう デザイン。
// ・かんジュース（たべもの 64×64）・グラス／タンブラー（ゆかの 家具・フィギュア だい）・プレート／しましまざら（かべ）・おふろ グッズ（ゆかの 家具）
//   × わんこ・がちゃん・ごじ・なかよし（3人）。3人の かおは いちばんくじの 絵（KujiArt.smallHead）。
// ・線は INK・SVG の id は つかわない・キラキラの えんしゅつは つけない。この ゲームの ための オリジナルの 絵。
const ConbiniCollabArt = (() => {
  const K = INK, f1 = (v) => Math.round(v * 10) / 10;
  const sk = (w = 2.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const P = (d, fill, w = 2.2, e = "") => `<path d="${d}" fill="${fill}" ${w ? sk(w) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const L = (d, col = K, w = 1.6, e = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${e ? " " + e : ""}/>`;
  const E = (cx, cy, rx, ry, fill, w = 2.2, e = "") => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" ${w ? sk(w) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const C = (cx, cy, r, fill, w = 2.2, e = "") => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}" ${w ? sk(w) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const R = (x, y, w, h, rr, fill, sw = 2.2, e = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rr)}" fill="${fill}" ${sw ? sk(sw) : 'stroke="none"'}${e ? " " + e : ""}/>`;
  const grp = (x, y, s, body) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 1000) / 1000})">${body}</g>`;
  const svg = (body, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const shine = (d, a = 0.7) => L(d, "#FFFFFF", 2.2, `stroke-opacity="${a}"`);
  const shadow = (cx, cy, rx, ry) => E(cx, cy, rx, ry, "#1F1D1B", 0, 'fill-opacity="0.13"');
  // 3人の かお（いちばんくじの 絵と おなじ）。trio は 3人 ならべる
  const head = (who, x, y, s) => who === "trio" ? grp(x - 9 * s / 0.2, y + 2 * s / 0.2, s * 0.62, KujiArt.smallHead("gachan", 1)) + grp(x + 9 * s / 0.2, y + 2 * s / 0.2, s * 0.62, KujiArt.smallHead("goji", 1)) + grp(x, y - 3 * s / 0.2, s * 0.66, KujiArt.smallHead("wanko", 1)) : grp(x, y, s, KujiArt.smallHead(who, 1));
  const LAW = { blue: "#4A8CC9", dark: "#2F6CA8", light: "#DDEBF6", pale: "#F2F8FD" }, SEV = { or: "#F4A13A", gr: "#3FA36B", rd: "#E53935", bg: "#FCEFE3" };
  // みせの しるし（ちいさく）
  const mark = (store, x, y, s = 1) => store === "lawson"
    ? grp(x, y, s, P("M-4,5 L-4,-2 C-4,-5 4,-5 4,-2 L4,5 Z", "#FFFFFF", 1.2) + R(-2.5, -7, 5, 2.5, 0.8, LAW.blue, 0) + L("M-4,1 H4", LAW.blue, 1.1))
    : grp(x, y, s, R(-5, -5, 10, 10, 2, "#FFFFFF", 1.2) + L("M-5,-2 H5", SEV.or, 1.6) + L("M-5,0.6 H5", SEV.gr, 1.6) + L("M-5,3.2 H5", SEV.rd, 1.6));
  const stripes3 = (x, y, w, h) => R(x, y, w, h / 3, 0, SEV.or, 0) + R(x, y + h / 3, w, h / 3, 0, SEV.gr, 0) + R(x, y + (2 * h) / 3, w, h / 3, 0, SEV.rd, 0);

  // ---- かんジュース（64×64・たべもの）----
  const JUICE = {
    lawson: { wanko: ["#EAF4FF", "#FFFFFF"], gachan: ["#FFE066", "#FFF6C2"], goji: ["#9BD770", "#D9F2C2"], trio: ["#FFAB6E", "#FFE2CC"] },
    sevenbun: { wanko: ["#FFB74D", "#FFE0B2"], gachan: ["#FFB3C1", "#FFE4EA"], goji: ["#C5E8A0", "#EEF8E2"], trio: ["#FF9CB8", "#FFF0F5"] },
  };
  const can = (store, who) => {
    const law = store === "lawson", [col, hi] = JUICE[store][who];
    let s = shadow(32, 58, 15, 3.4);
    s += R(18, 9, 28, 47, 6, law ? "#FFFFFF" : SEV.bg);
    s += R(18, 15, 28, 33, 0, col, 0) + E(32, 15, 14, 2.6, hi, 0);
    s += law ? R(18, 44, 28, 6, 0, LAW.blue, 0) + R(18, 50, 28, 3, 0, LAW.dark, 0) : stripes3(18, 44, 28, 8);
    s += head(who, 32, 29, who === "trio" ? 0.13 : 0.15);
    // ソーダの あわ
    s += [[23, 20, 1.6], [42, 24, 1.3], [24, 39, 1.2], [41, 38, 1.7]].map(([x, y, r]) => C(x, y, r, "#FFFFFF", 0.9)).join("");
    s += R(18, 9, 28, 47, 6, "none") + E(32, 9.5, 13.4, 3.3, "#D6DDE3") + E(32, 9.5, 9.6, 2, "#BCC5CD", 1.2) + P("M29,8.5 L35,8.5 L34.5,6.6 L29.5,6.6 Z", "#E8ECF0", 1.1);
    s += shine("M22,17 V41", 0.75) + mark(store, 39.5, 53, 0.55);
    return svg(s, 64, 64);
  };

  // ---- グラス（ローリソン）／タンブラー（せぶんぶん）: 34×40 ----
  const cup = (store, who) => {
    let s = shadow(17, 37.5, 13, 2.6);
    if (store === "lawson") {
      s += P("M4,5 L30,5 L27,37 L7,37 Z", "#E8F4FB", 2.2, 'fill-opacity="0.92"');
      s += P("M6.6,30 L27.4,30 L27,37 L7,37 Z", LAW.blue, 0) + L("M6.6,30 H27.4", LAW.dark, 1.4);
      s += head(who, 17, 18, who === "trio" ? 0.1 : 0.115);
      s += P("M4,5 L30,5 L27,37 L7,37 Z", "none") + E(17, 5, 13, 2.4, "#FFFFFF", 1.8, 'fill-opacity="0.85"');
      s += shine("M8,9 L10,27", 0.8) + mark(store, 25, 33.4, 0.42);
    } else {
      s += P("M5,6 L29,6 L27.4,33 C27,36 24,37.5 17,37.5 C10,37.5 7,36 6.6,33 Z", SEV.bg);
      s += P("M5.3,9 L28.7,9 L28.4,15 L5.6,15 Z", "#FFFFFF", 0) + stripes3(5.6, 9.4, 22.8, 5.4);
      s += head(who, 17, 25, who === "trio" ? 0.1 : 0.115);
      s += P("M5,6 L29,6 L27.4,33 C27,36 24,37.5 17,37.5 C10,37.5 7,36 6.6,33 Z", "none") + E(17, 6, 12, 2.2, "#FFFDF8", 1.8);
      s += shine("M8.4,17 L9.6,31", 0.7);
    }
    return svg(s, 34, 40);
  };

  // ---- プレート（ローリソン）／しましまざら（せぶんぶん）: かべに かざる 46×48 ----
  const plate = (store, who) => {
    let s = L("M15,6 L23,2 L31,6", "#9AA3AB", 1.6) + C(23, 2, 1.6, "#C9CED3", 1);
    if (store === "lawson") {
      s += C(23, 26, 20.5, "#FFFFFF") + C(23, 26, 15, LAW.pale, 1.2);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += C(23 + Math.cos(a) * 17.8, 26 + Math.sin(a) * 17.8, i % 2 ? 1.1 : 1.7, i % 2 ? LAW.dark : LAW.blue, 0); }
    } else {
      const arc = (a0, a1, col) => { const p = (a, r) => `${f1(23 + Math.cos(a) * r)},${f1(26 + Math.sin(a) * r)}`; return P(`M${p(a0, 20)} A20,20 0 0 1 ${p(a1, 20)} L${p(a1, 15.4)} A15.4,15.4 0 0 0 ${p(a0, 15.4)} Z`, col, 0); };
      s += C(23, 26, 20.5, SEV.bg);
      s += arc(-2.6, -0.6, SEV.or) + arc(-0.5, 1.5, SEV.gr) + arc(1.6, 3.6, SEV.rd);
      s += C(23, 26, 15.2, "#FFFDF8", 1.2) + C(23, 26, 20.5, "none");
    }
    s += head(who, 23, 27, who === "trio" ? 0.13 : 0.15) + shine("M9,19 C10,14 13,11 17,9.5", 0.6);
    return svg(s, 46, 48);
  };

  // ---- おふろ グッズ ----
  const BATH = {
    // ローリソン: わんこの おふろおけ・がちゃんの おふろ ひよこ・ごじの バスチェア・なかよし タオルかけ
    lawson: {
      wanko: { w: 48, h: 36, draw: () => shadow(24, 33, 19, 3) + P("M4,9 L44,9 L40,33 L8,33 Z", LAW.light) + P("M5.2,15 L42.8,15 L42,20 L6,20 Z", LAW.blue, 0) + head("wanko", 24, 25, 0.13) + E(24, 9, 20, 4.4, "#FFFFFF") + E(24, 9, 16, 2.8, LAW.pale, 1.2) + shine("M9,22 L10.5,30", 0.7) + mark("lawson", 37, 28, 0.5) },
      gachan: { w: 38, h: 36, draw: () => shadow(19, 33.5, 15, 2.6) + P("M5,24 C4,16 10,13 16,15 C22,17 30,14 33,19 C36,26 31,33 19,33 C9,33 6,29 5,24 Z", "#FFD84D") + C(15, 12, 9.5, "#FFE066") + P("M22,11 L29,13 L22,15 Z", "#F59A3B", 1.6) + C(13.5, 10, 1.4, K, 0) + L("M10,15 Q12,16.4 14,15.2", "#E89A9A", 1.4) + L("M18,24 C22,27 27,26 29,22", "#E9B934", 1.8) + R(9.5, 19, 9, 3.6, 1.6, LAW.blue, 1.2) + shine("M9,7 C11,4.6 14,4 16,4.4", 0.8) },
      goji: { w: 46, h: 36, draw: () => shadow(23, 33.5, 18, 2.8) + P("M10,16 L8,33 M36,16 L38,33", "none", 0) + R(9, 15, 4, 18, 1.6, LAW.dark) + R(33, 15, 4, 18, 1.6, LAW.dark) + P("M5,12 C5,8 41,8 41,12 L41,17 C41,20 5,20 5,17 Z", "#B9C6D2") + E(23, 10.5, 18, 4, "#D5DEE6") + head("goji", 23, 15.5, 0.08) + R(19, 22, 8, 11, 2, LAW.blue, 1.6) + shine("M10,13 H17", 0.7) },
      trio: { w: 60, h: 64, draw: () => shadow(30, 61, 25, 3) + R(5, 58, 50, 4, 2, "#C9A36A", 1.8) + R(8, 8, 4, 51, 2, "#D9B886") + R(48, 8, 4, 51, 2, "#D9B886") + R(4, 6, 52, 5, 2.4, "#C9A36A") +
        [[10, "#FFFFFF", "wanko"], [24, "#FFF3B8", "gachan"], [38, "#E3E6EA", "goji"]].map(([x, col, w]) => P(`M${x},11 L${x + 12},11 L${x + 12},42 L${x},42 Z`, col) + L(`M${x},37 H${x + 12}`, LAW.blue, 1.6) + head(w, x + 6, 22, 0.07)).join("") + mark("lawson", 30, 50, 0.6) },
    },
    // せぶんぶん: わんこの せっけん・がちゃんの シャンプー・ごじの おふろの ふね・なかよし バスボム
    sevenbun: {
      wanko: { w: 44, h: 28, draw: () => shadow(22, 25, 18, 2.6) + P("M3,14 C3,22 9,24 22,24 C35,24 41,22 41,14 Z", SEV.or) + stripes3(6, 19, 32, 3.6) + P("M3,14 C3,22 9,24 22,24 C35,24 41,22 41,14 Z", "none") + R(10, 5, 24, 11, 5, "#FFFFFF") + head("wanko", 22, 10.6, 0.075) + C(36, 6, 2.6, "#FFFFFF", 1.2) + C(39.5, 10.5, 1.6, "#FFFFFF", 1) + C(7, 7, 1.8, "#FFFFFF", 1) + shine("M12,8 V12", 0.6) },
      gachan: { w: 28, h: 48, draw: () => shadow(14, 45.5, 11, 2.2) + R(10, 2, 8, 3.4, 1.2, "#FFFFFF", 1.4) + P("M12,5 L12,9 L16,9 L16,5", "#F2F2F2", 1.4) + P("M18,3.4 L24,3.4 L24,6", "none", 1.6) + R(4, 10, 20, 35, 7, "#FFE066") + R(4.4, 16, 19.2, 18, 0, "#FFFFFF", 0) + stripes3(4.4, 30, 19.2, 4.6) + head("gachan", 14, 23, 0.085) + R(4, 10, 20, 35, 7, "none") + shine("M7.6,14 V40", 0.6) },
      goji: { w: 48, h: 36, draw: () => shadow(24, 33.5, 20, 2.6) + R(23, 3, 2.2, 15, 1, "#8D6E5B", 1.2) + P("M25.2,4 L35,7.5 L25.2,11 Z", SEV.rd, 1.4) + P("M4,18 L44,18 L38,31 C34,33 14,33 10,31 Z", SEV.or) + R(6, 21, 36, 4, 0, SEV.gr, 0) + P("M4,18 L44,18 L38,31 C34,33 14,33 10,31 Z", "none") + R(14, 10, 14, 9, 3, "#FFFDF8") + head("goji", 21, 15, 0.06) + C(33, 14.5, 3, "#BFE3F5", 1.4) + L("M2,33 C6,31 10,35 14,33 M34,33 C38,31 42,35 46,33", "#7EC8F0", 1.6) },
      trio: { w: 50, h: 34, draw: () => shadow(25, 31.5, 22, 2.6) + R(3, 12, 44, 19, 3, SEV.bg) + stripes3(3.4, 25.6, 43.2, 4.6) + R(3, 12, 44, 19, 3, "none") +
        [[12, "#FFD3E0", "wanko"], [25, "#FFF3B8", "gachan"], [38, "#D8EEC4", "goji"]].map(([x, col, w]) => C(x, 13, 6.6, col) + head(w, x, 13, 0.055)).join("") + mark("sevenbun", 42.5, 21, 0.45) },
    },
  };
  const bath = (store, who) => { const a = BATH[store][who]; return svg(a.draw(), a.w, a.h); };
  const size = (cat, store, who) => cat === "cup" ? [34, 40] : cat === "plate" ? [46, 48] : cat === "bath" ? [BATH[store][who].w, BATH[store][who].h] : [64, 64];
  const pic = (cat, store, who) => (cat === "can" ? can : cat === "cup" ? cup : cat === "plate" ? plate : bath)(store, who);
  // こうかんの いちらんの アイコン（4しゅを 2×2 に ならべる）
  const tier = (cat, store) => {
    const at = [[0, 0], [32, 0], [0, 32], [32, 32]];
    return svg(["wanko", "gachan", "goji", "trio"].map((who, i) => { const [w, h] = size(cat, store, who), k = 30 / Math.max(w, h); return pic(cat, store, who).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${f1(at[i][0] + (32 - w * k) / 2)}" y="${f1(at[i][1] + (32 - h * k) / 2)}" width="${f1(w * k)}" height="${f1(h * k)}" `); }).join(""), 64, 64);
  };
  return { can, cup, plate, bath, pic, size, tier, BATH, JUICE };
})();
