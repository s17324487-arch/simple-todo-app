// ⑥ 射撃場の しくみと 絵（docs/design/features/range の 見本 tools/feature-design/range-ref.js の RangeRef を 名前だけ ShootingRange に して そのまま 移した もの）。
// 1番: 弾道と 絵。2番で あそびの しくみ（Game・bot）と 画面（draw）を 足す。GunArt（gun-art.js）を 先に 読みこむ。
//   ShootingRange.ballistics(gun, hop, B) … BB弾の 弾道の 表（くうきの ていこう・ホップの 浮く 力）・ShootingRange.hopAt(gun, step, B) … ホップ ダイヤル → つよさ
//   ShootingRange.targetSvg(shape, def) … 的の 絵（キーは ShootingRange.tkey(def)。ShootingRange.artKeys(RANGE_DATA) で ぜんぶ わかる・有限）
//   ShootingRange.fpvSvg(gun, who, tone) … 主観の じゅう（手つき。SvgCache の キーは "rg:" + gun + ":" + who + ":" + tone・9×3×2）
//   ShootingRange.facade200() … 町の 建物の 外がわ（town-renewal-art.js の facades と 同じ 200×160）
// 角度は mrad（1mrad = 10m で 1cm）、長さは m。
const ShootingRange = (() => {
  const INK = "#1F1D1B", EYE = 1.5;
  const r1 = (n) => Math.round(n * 10) / 10;

  // ---- 弾道（BB弾）----
  // くうきの ていこう（速さの 2じょう）＋ ホップアップの 浮く 力（逆回転の マグヌス効果。回転は 速さほど はやく へらないので (速さ/初速)^liftExp）＋ じゅうりょく
  // 水平に うった ときの 高さ y と 時間 t を 1m ごとに ならべる。hop = 1 で うった しゅんかん じゅうりょくと つりあう
  function flight(gun, hop, B) {
    const A = Math.PI * 0.003 * 0.003, k = (0.5 * B.rho * B.cd * A) / (gun.bb / 1000), dt = B.dt, n = Math.round(B.maxD / B.step);
    const T = new Array(n + 1).fill(null), Y = new Array(n + 1).fill(null), V = new Array(n + 1).fill(null);
    let x = 0, y = 0, vx = gun.v0, vy = 0, t = 0, i = 0; T[0] = 0; Y[0] = 0; V[0] = gun.v0;
    while (i < n && t < 5) {
      const v = Math.hypot(vx, vy), lift = hop * B.g * Math.pow(v / gun.v0, B.liftExp);
      const ax = -k * v * vx - lift * (vy / v), ay = -k * v * vy + lift * (vx / v) - B.g;
      const px = x, py = y, pt = t; vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; t += dt;
      while (i < n && x >= (i + 1) * B.step) { i++; const f = (i * B.step - px) / (x - px); T[i] = pt + f * dt; Y[i] = py + f * (y - py); V[i] = Math.hypot(vx, vy); }
      if (vx < 5) break;
    }
    for (let j = 1; j <= n; j++) if (T[j] == null) { T[j] = T[j - 1] + 1; Y[j] = Y[j - 1] - 1; V[j] = 1; }
    return { T, Y, V, step: B.step };
  }
  // サイトの ゼロイン: いつもの ホップで zero m の ところで ねらった 高さに あたる ように じゅうこうを すこし 上に むける
  function ballistics(gun, hop, B, base) {
    const f = flight(gun, hop, B), fb = base || (hop === gun.hop ? f : flight(gun, gun.hop, B));
    const zi = Math.round(gun.zero / B.step), theta = (gun.sh - fb.Y[zi]) / gun.zero;
    const at = (d) => { const u = Math.max(0, Math.min(f.T.length - 1.001, d / f.step)), i = Math.floor(u), w = u - i; const L = (a) => a[i] + (a[i + 1] - a[i]) * w; return { t: L(f.T), y: L(f.Y) + d * theta - gun.sh, v: L(f.V) }; };
    return { at, theta, f };
  }
  // よこかぜで ながれる 量（m）: かぜ × （とぶ 時間 − くうきが なかった ときの 時間）
  const drift = (gun, d, t, w) => w * Math.max(0, t - d / gun.v0);

  // ---- 見え方（カメラ）----
  // コースごとの 見はば（のぞかない とき・度）。のぞくと じゅうの zoom ばい
  const FOV = { steel: 30, bullseye: 10, practical: 42, precision: 4, long: 30, moving: 30 };
  const RUN_SCREEN = 0.4; // ランニング ターゲットの めかくしの かべは 的の 0.4m てまえ
  const HC = 0.44; // ねらう 点の 画面の たかさ（H に たいする わりあい）
  // 的の 大きさ（m）: ipsc は 45×57cm（A ゾーン 15×32.5・C ゾーン 30×45。A・C は 半分の 大きさで もつ）、ポッパーは 高さ 1.1m
  const SHAPE = { ipsc: { w: 0.45, h: 0.57, cy: 1.25, A: [0.075, 0.1625], C: [0.15, 0.225] }, ns: { w: 0.45, h: 0.57, cy: 1.25 }, popper: { w: 0.3, h: 1.1, head: 0.22 } };
  // ホップ ダイヤル（0〜steps。まんなかが いつもの ホップ）→ ホップの つよさ
  const hopAt = (gun, step, B) => { const H = B.hop, s = step == null ? H.steps / 2 : step; return gun.hop * (H.min + ((H.max - H.min) * s) / H.steps); };

  // ---- 絵 ----
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // 的の 絵（mm 単位の viewBox。中心 0,0）。キーは "rt:" + shape（有限）
  function targetSvg(shape, def = {}) {
    let s = "", vb;
    if (shape === "round" || shape === "gong") { const r = ((def.d || 0.2) * 1000) / 2; vb = [-r - 20, -r - 20, 2 * r + 40, 2 * r + (shape === "gong" ? 40 : 200)]; s = shape === "gong" ? `<path d="M${-r * 0.6},${-r * 0.8} L${-r * 0.3},${-r - 18} M${r * 0.6},${-r * 0.8} L${r * 0.3},${-r - 18}" stroke="#555A60" stroke-width="${r * 0.06}"/><circle r="${r}" fill="#F2F2EE" ${st(r * 0.05)}/><circle r="${r * 0.18}" fill="#E35D5B"/>` : `<rect x="${-r * 0.1}" y="${r}" width="${r * 0.2}" height="${170}" fill="#555A60"/><circle r="${r}" fill="#F2F2EE" ${st(r * 0.06)}/>`; }
    else if (shape === "stop") { const w = 300, h = 250; vb = [-w / 2 - 20, -h / 2 - 20, w + 40, h + 220]; s = `<rect x="-15" y="${h / 2}" width="30" height="190" fill="#555A60"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="#F7C948" ${st(12)}/>`; }
    else if (shape === "aps" || shape === "issf") {
      const size = shape === "aps" ? 170 : 80; vb = [-size / 2, -size / 2, size, size];
      s = `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" fill="#FFFDF6"/>`;
      if (shape === "aps") s += [[50, "#FFFFFF"], [35, "#FFFFFF"], [22, "#1F1D1B"], [11, "#1F1D1B"]].map(([d, f], i) => `<circle r="${d / 2}" fill="${f}" stroke="${i > 1 ? "#FFFFFF" : INK}" stroke-width="0.8"/>`).join("") + `<circle r="${50 / 2}" fill="none" ${st(0.8)}/>`;
      else { for (let n = 1; n <= 10; n++) { const r = 2.5 * (11 - n) + 0.25 - 2.25; s += `<circle r="${r1(Math.max(0.25, r + 2.25))}" fill="${n >= 4 ? "#1F1D1B" : "#FFFFFF"}" stroke="${n >= 4 ? "#FFFFFF" : INK}" stroke-width="0.35"/>`; } s += `<circle r="0.25" fill="#FFFFFF"/>`; }
    }
    else if (shape === "ipsc" || shape === "ns") { const w = 450, h = 570, f = shape === "ns" ? "#FAFAF6" : "#C9A66B"; vb = [-w / 2 - 20, -h / 2 - 20, w + 40, h + 700]; const oct = `M${-w / 2 + 70},${-h / 2} L${w / 2 - 70},${-h / 2} L${w / 2},${-h / 2 + 90} L${w / 2},${h / 2 - 90} L${w / 2 - 70},${h / 2} L${-w / 2 + 70},${h / 2} L${-w / 2},${h / 2 - 90} L${-w / 2},${-h / 2 + 90} Z`;
      s = `<rect x="-14" y="${h / 2}" width="28" height="660" fill="#8C6A42"/><path d="${oct}" fill="${f}" ${st(10)}/>`;
      if (shape === "ipsc") s += `<rect x="-150" y="-225" width="300" height="450" rx="6" fill="none" stroke="#7A5A30" stroke-width="5"/><rect x="-75" y="-162.5" width="150" height="325" rx="4" fill="none" stroke="#7A5A30" stroke-width="5"/><text x="0" y="-110" font-size="44" font-weight="900" text-anchor="middle" fill="#7A5A30">A</text><text x="0" y="-180" font-size="36" text-anchor="middle" fill="#7A5A30">C</text><text x="-188" y="0" font-size="36" text-anchor="middle" fill="#7A5A30">D</text>`;
      else s += `<text x="0" y="30" font-size="110" font-weight="900" text-anchor="middle" fill="#C8C4BC">NS</text>`; }
    else if (shape === "popper") { vb = [-200, -1150, 400, 1200]; s = `<path d="M-150,0 L150,0 L110,-40 L110,-760 Q110,-860 70,-880 L-70,-880 Q-110,-860 -110,-760 L-110,-40 Z" fill="#F2F2EE" ${st(12)}/><circle cx="0" cy="-990" r="110" fill="#F2F2EE" ${st(12)}/><rect x="-20" y="-890" width="40" height="30" fill="#F2F2EE"/>`; }
    else if (shape === "run") { const r = 150; vb = [-r - 60, -r - 60, 2 * r + 120, 2 * r + 120]; s = `<rect x="${-r - 50}" y="${-r - 50}" width="${2 * r + 100}" height="${2 * r + 100}" rx="10" fill="#E8D6B0" ${st(8)}/>` + Array.from({ length: 10 }, (_, i) => `<circle r="${r1(r * (1 - i / 10))}" fill="${i >= 6 ? "#E35D5B" : i % 2 ? "#FFFDF6" : "#F4E6CC"}" stroke="${INK}" stroke-width="2"/>`).join(""); }
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(r1).join(" ")}" width="${r1(Math.min(600, vb[2]))}" height="${r1(Math.min(600, vb[2]) * vb[3] / vb[2])}">${s}</svg>`, vb };
  }
  // 的の 絵の キー（有限: しゅるい × 大きさ mm。rt:round:200・rt:gong:450・rt:ipsc など）
  const tkey = (d) => "rt:" + d.shape + (d.d ? ":" + Math.round(d.d * 1000) : "");
  const VB = new Map(), vbOf = (d) => { const k = tkey(d); if (!VB.has(k)) VB.set(k, targetSvg(d.shape, d).vb); return VB.get(k); };
  // courses の まと から ぜんぶの キーと 絵を つくる（ゲームでは SvgCache に さいしょに 入れる）
  function artKeys(data) {
    const seen = new Map(), add = (d) => { const k = tkey(d); if (!seen.has(k)) seen.set(k, { key: k, make: () => targetSvg(d.shape, d).svg }); };
    for (const C of Object.values(data.courses)) {
      for (const t of C.targets || []) add(t);
      if (C.card) add({ shape: C.kind === "bull" ? "aps" : "issf", size: C.card.size });
      if (C.kind === "run") add({ shape: "run", d: C.d });
    }
    return [...seen.values()];
  }

  // 手の 絵（わんこ: しろい まえあし・がちゃん: きいろい はね・ごじ: はいいろの 手と しろい つめ）
  const HAND = {
    wanko: { fill: "#FFFFFF", arm: "#F1EEE8", shade: "#9E978D", pad: "#F4B6C2", spot: "#1F1D1B", kind: "paw" },
    gachan: { fill: "#FADA78", arm: "#F2CF68", shade: "#A88B3E", pad: "#F2C04E", kind: "wing" },
    goji: { fill: "#8C8686", arm: "#7F7979", shade: "#4A4646", fill2: "#4A4A4C", claw: "#FFFFFF", kind: "claw" },
  };
  function handSvg(who, x, y, ang, tone, side) {
    const H = HAND[who], f = who === "goji" && tone === "dark" ? H.fill2 : H.fill, a = r1(ang);
    let arm = `<path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M${r1(x)},${r1(y)} L${r1(x + (side === "R" ? 90 : -40))},${r1(y + 140)}" stroke="${f}" stroke-width="40" stroke-linecap="round"/>`;
    let hand = "";
    if (H.kind === "paw") hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-8,-15 L-8,-6 M1,-16 L1,-6 M10,-14 L10,-6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9" cy="5" rx="5" ry="4" fill="${H.spot}"/>`;
    else if (H.kind === "wing") hand = `<path d="M-20,6 Q-22,-14 -2,-17 Q16,-18 22,-8 L14,-6 L20,1 L11,2 L15,9 Q0,18 -20,6 Z" fill="${f}" ${st(2)}/><path d="M-10,-4 Q0,-8 10,-6" fill="none" stroke="${H.pad}" stroke-width="2"/>`;
    else hand = `<ellipse rx="21" ry="16" fill="${f}" ${st(2)}/><path d="M-12,-14 L-15,-23 L-7,-16 Z M-1,-16 L-2,-26 L5,-16 Z M10,-14 L12,-23 L16,-11 Z" fill="${H.claw}" ${st(1.4)}/>`;
    return arm + `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${hand}</g>`;
  }
  // 主観の じゅう（手つき）。viewBox 360×260 の したの ほうに おく。キーは "rg:" + gun + ":" + who + ":" + tone（9×3×2 = 有限）
  const FPV = { hand: { px: 0.95, ang: 12, at: [214, 216] }, rifle: { px: 0.37, ang: 9, at: [266, 210] }, sniper: { px: 0.34, ang: 8, at: [270, 212] } };
  function fpvSvg(gun, who, tone = "soft") {
    const F = FPV[gun.cat], P = GunArt.parts(gun), b = P.box, px = F.px, rad = (F.ang * Math.PI) / 180;
    const gx = (P.grip[0] - b[0]) * px, gy = (P.grip[1] - b[1]) * px;
    const tr = (pt) => { const x = (pt[0] - b[0]) * px - gx, y = (pt[1] - b[1]) * px - gy; return [F.at[0] + x * Math.cos(rad) - y * Math.sin(rad), F.at[1] + x * Math.sin(rad) + y * Math.cos(rad)]; };
    const inner = GunArt.svg(gun, { px, uid: "fp" + gun.id + who }).replace("<svg ", `<svg x="${r1(-gx)}" y="${r1(-gy)}" `);
    let s = "";
    if (P.fore) { const [fx, fy] = tr(P.fore); s += handSvg(who, fx, fy + 6, F.ang - 10, tone, "L"); }
    s += `<g transform="translate(${F.at[0]} ${F.at[1]}) rotate(${F.ang})">${inner}</g>`;
    if (P.fore) { const [fx, fy] = tr(P.fore); s += `<g transform="translate(${r1(fx)} ${r1(fy + 6)}) rotate(${F.ang - 10})"><path d="M-18,-6 Q0,-16 18,-8" fill="none" stroke="${INK}" stroke-width="1.6"/></g>`; }
    const [hx, hy] = tr(P.grip); s += handSvg(who, hx, hy + 4, F.ang + 20, tone, "R");
    const mz = tr(P.muzzle);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="720" height="520" overflow="hidden">${s}</svg>`, muzzle: mz };
  }
  // 町の 建物の 外がわ（town-renewal-art.js の facades と 同じ 200×160 の デザイン。入口は つつむ 関数が まんなか したに 描く）
  //   コンクリートの かべ・あかい ライン・まとの マーク・シャッター（ひだり）・まど（みぎ）・「シューティング レンジ」
  function facade200() {
    const R = (x, y, w, h, c, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" ${st(1.7)}/>`;
    const P = (d, c = "none", sw = 1.7) => `<path d="${d}" fill="${c}" ${st(sw)}/>`;
    const C = (x, y, z, col) => `<circle cx="${x}" cy="${y}" r="${z}" fill="${col}" ${st(1.5)}/>`;
    const glass = (x, y, w, h) => R(x, y, w, h, "#B8DADF") + P(`M${x + 4},${y + h - 5} L${x + w - 4},${y + 5}`, "none", 1);
    let s = R(8, 50, 184, 102, "#D3D6D6", 3) + P("M2,52 L26,24 H174 L198,52 Z", "#8D9AA5") + R(8, 50, 184, 8, "#C96A64", 0);
    s += [13, 9.5, 6, 2.6].map((z, i) => C(100, 38, z, ["#FFF6DF", "#D9776F", "#FFF6DF", "#D9776F"][i])).join("");
    s += R(18, 96, 56, 54, "#B9C0C6") + Array.from({ length: 8 }, (_, i) => P(`M20,${101 + i * 6} H72`, "none", 0.7)).join("") + R(14, 90, 64, 7, "#8D9AA5");
    s += glass(132, 92, 50, 34) + P("M132,109 H182", "none", 1) + [0, 1, 2].map((i) => C(146 + i * 11, 138, 3.2, ["#D9776F", "#FFF6DF", "#D9776F"][i])).join("");
    s += R(40, 64, 120, 21, "#FFF6DF", 5) + `<text x="100" y="78.5" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="${INK}">シューティング レンジ</text>`;
    return s;
  }
  return { ballistics, flight, drift, hopAt, FOV, SHAPE, EYE, targetSvg, tkey, artKeys, handSvg, fpvSvg, FPV, facade200 };
})();
