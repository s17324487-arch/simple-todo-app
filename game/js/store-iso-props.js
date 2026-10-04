// 歩いて 入る お店の 店ごとの 什器（O10・UI-75。StoreIsoArt.M に たす。原点は 什器の 床の かど・線は INK）。
// バーガー（キッチン・ドリンク・フライヤー）・びようしつ（カット台・シャンプー台）・ケーキ（ケーキスタンド・ウエディングケーキ）・
// ようふく（かべの ラック・しちゃくしつ・マネキン）・かぐ（家具の みほん〔おうちの 家具の 立体〕）・スーパー（いけす・やおや）・
// クレープ（てっぱん・トッピング）・はいしゃ（しんさつ台・キッズ コーナー・すいそう）・パン（いしがま・さましだな）・はな（バケツの だん・トレリス）。
// コンビニ・ガソリンスタンド・ゆうびんきょく・パズルの おみせ などは うしろの まとまり。
(() => {
  const A = StoreIsoArt, SP = A.SP, G = A.GOODS, sh = A.shade, C3 = A.C3, st = A.st, txt = A.txt, icon = A.icon, img = A.img, pick = A.pick, faceS = A.faceS, faceE = A.faceE, T = () => IsoVenue.T;
  const steel = ["#E6EBEE", "#CBD3D8", "#B3BDC4"], white = ["#FAF8F3", "#E6E1D7", "#D2CCC0"], dark = ["#6E747E", "#5A606A", "#4A505A"];
  const shadow = (S, f, k = 0.45) => S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * k, "#00000012", 0);
  // 南の 面に 四角（とびら・ひきだし）
  const doorS = (S, y, x0, x1, z0, z1, c) => S.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], c, 1);
  const doorE = (S, x, y0, y1, z0, z1, c) => S.poly([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], c, 1);
  const npc = (sp, ci, dir, emo = "happy", outfit) => { const cols = (NpcArt.SP[sp] || {}).cols || [], col = cols.length ? cols[ci % cols.length] : null; return Art.npcSvg({ sp, emo, dir, pose: "idle_01", ...(col ? { col: col[0], col2: col[1] } : {}), ...(outfit ? { outfit } : {}) }); };
  // リボン・トロフィー（しなもの）
  SP.ribbon = (c) => `<path d="M0,-7 L-8,-12 L-8,-2 Z M0,-7 L8,-12 L8,-2 Z" fill="${c}" ${st(1)}/><circle cx="0" cy="-7" r="2.4" fill="${sh(c, -0.15)}" ${st(0.9)}/><path d="M-2,-5 L-4,0 M2,-5 L4,0" stroke="${c}" stroke-width="2"/>`;
  SP.trophy = (c = "#F3C24F") => `<rect x="-5" y="-3" width="10" height="3" rx="1" fill="#8A6A4A" ${st(0.9)}/><path d="M-1.6,-3 V-7 H1.6 V-3 Z" fill="${c}" ${st(0.8)}/><path d="M-6,-17 H6 Q6,-8 0,-7 Q-6,-8 -6,-17 Z" fill="${c}" ${st(1)}/><path d="M-6,-15 q-4,0 -3,4 q1,2 3,1 M6,-15 q4,0 3,4 q-1,2 -3,1" fill="none" ${st(0.9)}/>`;
  SP.crepe = (c = "#F2A7B8") => `<path d="M-6,-14 L0,2 L6,-14 Z" fill="#F2D79A" ${st(1)}/><circle cx="-3" cy="-15" r="3.6" fill="#FFFFFF" ${st(0.8)}/><circle cx="3" cy="-15" r="3.6" fill="#FFFFFF" ${st(0.8)}/><circle cx="0" cy="-18" r="3" fill="${c}" ${st(0.8)}/>`;
  G.ribbons = (i) => (i % 3 === 2 ? SP.hat(pick(["#F2C6D8", "#F4E3A1", "#C8DEEF"], i)) : SP.ribbon(pick(["#F28BB2", "#8EC5F4", "#F6D47A", "#C9B8E8", "#8FD19E"], i)));
  G.cups = (i) => SP.trophy(pick(["#F3C24F", "#C9CED3", "#D99A5E"], i));
  G.crepes = (i) => SP.crepe(pick(["#F2A7B8", "#8A5A3C", "#F6D35A", "#9CCB62"], i));
  const M = {
    // ---- バーガー ----
    // キッチン（てっぱん・フライヤー・ヒートランプの たなに つつんだ バーガー・フード）
    burgerkitchen(S, f) {
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.86, 0, 84, steel);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.96, 0.12 + i * 0.95, 0.95 + i * 0.95, 12, 70, "#DCE2E6");
      s += S.box(0, 0.06, f.w, 0.92, 84, 5, ["#C9D0D5", "#B3BBC1", "#A0A9AF"]);
      // てっぱん（パティ）
      s += S.poly([[0.12, 0.2, 89.5], [1.3, 0.2, 89.5], [1.3, 0.85, 89.5], [0.12, 0.85, 89.5]], "#4E545C", 1.2);
      for (let i = 0; i < 6; i++) s += S.at(0.3 + (i % 3) * 0.38, 0.38 + Math.floor(i / 3) * 0.28, 90, `<ellipse rx="8" ry="4" fill="#9A6A48" ${st(1)}/><ellipse cx="-2" cy="-1" rx="3" ry="1.2" fill="#B98560"/>`);
      // フライヤー（あぶら・バスケット）
      s += S.box(1.45, 0.22, 0.7, 0.6, 89, 6, ["#5A606A", "#4A505A", "#3E434B"]) + S.poly([[1.5, 0.27, 95.5], [2.1, 0.27, 95.5], [2.1, 0.77, 95.5], [1.5, 0.77, 95.5]], "#E9B74E", 1);
      for (const x of [1.55, 1.83]) s += S.box(x, 0.3, 0.24, 0.42, 96, 10, ["#C9D0D5", "#B3BBC1", "#A0A9AF"], 1) + S.line([[x + 0.12, 0.72, 104], [x + 0.12, 0.92, 112]], "#3E434B", 2.2);
      // ポテトの うけ（ヒートランプの した）
      s += S.box(2.3, 0.25, 0.6, 0.55, 89, 12, ["#E3E8EB", "#C8D0D5", "#B1BBC2"]) + S.at(2.6, 0.55, 101, [...Array(5)].map((_, i) => `<rect x="${-8 + i * 3.4}" y="${-10 - (i % 2) * 3}" width="2.4" height="${11 + (i % 2) * 3}" fill="#F2C24E" stroke="${INK}" stroke-width=".6"/>`).join(""));
      // ヒートランプの たな（つつんだ バーガー）
      s += S.box(0.1, 0.12, f.w - 0.2, 0.42, 132, 5, steel) + S.line([[0.3, 0.3, 89], [0.3, 0.3, 132]], "#9AA3AA", 2) + S.line([[f.w - 0.3, 0.3, 89], [f.w - 0.3, 0.3, 132]], "#9AA3AA", 2);
      for (let i = 0; i < 5; i++) s += S.at(0.42 + i * 0.52, 0.34, 137, i % 2 ? icon("bm_hamburger", 18) : `<path d="M-8,0 L8,0 L7,-8 Q0,-12 -7,-8 Z" fill="#F4E3C1" ${st(1)}/><path d="M-6,-5 h12" stroke="#E86F4E" stroke-width="1.6"/>`);
      for (let i = 0; i < 3; i++) s += S.at(0.6 + i * 0.9, 0.3, 160, `<path d="M-9,0 L9,0 L6,-8 L-6,-8 Z" fill="#F2F2EE" ${st(1)}/><ellipse cy="1" rx="6" ry="2" fill="#FFB74D" opacity=".85"/>`);
      return s;
    },
    // ドリンクの きかい（ボタン・のずる・カップ）
    sodafountain(S, f) {
      let s = S.box(0.06, 0.12, 0.88, 0.76, 0, 70, ["#F6EEDF", "#E5D8C2", "#D3C4AA"]) + S.box(0.02, 0.08, 0.96, 0.84, 70, 4, steel);
      s += S.box(0.14, 0.18, 0.72, 0.48, 74, 62, ["#E95F4B", "#C9483A", "#B13F33"]) + S.poly([[0.18, 0.66, 118], [0.82, 0.66, 118], [0.82, 0.66, 132], [0.18, 0.66, 132]], "#FFF3D6", 1);
      ["#F28B82", "#FFD54F", "#8FD19E", "#8EC5F4"].forEach((c, i) => { s += S.box(0.2 + i * 0.16, 0.6, 0.1, 0.06, 100, 12, [c, c, sh(c, -0.2)], 0.9) + S.box(0.23 + i * 0.16, 0.62, 0.04, 0.06, 88, 10, ["#8C8890", "#77737B", "#66626A"], 0.8); });
      s += S.at(0.5, 0.72, 74, SP.cup("#FFFFFF")) + S.at(0.78, 0.8, 74, SP.cup("#F8D7DA"));
      return s;
    },
    // ポテトの うけ（ひくい・ヒートランプ）
    fryer(S, f) {
      let s = S.box(0.06, 0.12, 0.88, 0.76, 0, 60, steel) + doorS(S, 0.88, 0.16, 0.86, 10, 52, "#DCE2E6");
      s += S.box(0.12, 0.2, 0.76, 0.6, 60, 6, ["#5A606A", "#4A505A", "#3E434B"]);
      s += S.at(0.5, 0.5, 66, `<path d="M-12,0 L12,0 L10,-6 L-10,-6 Z" fill="#E86F4E" ${st(1)}/>` + [...Array(7)].map((_, i) => `<rect x="${-10 + i * 3}" y="${-13 - (i % 3) * 2}" width="2.2" height="${9 + (i % 3) * 2}" fill="#F2C24E" stroke="${INK}" stroke-width=".5"/>`).join(""));
      return s;
    },
    // ---- びようしつ ----
    // カット台（かべの かがみ は かべの 絵。カウンター・どうぐ・いす と おきゃくさん〔うしろ すがた〕）
    station(S, f) {
      const c = f.col || "#F4F1EA";
      let s = shadow(S, f, 0.4) + S.box(0.12, 0.04, f.w - 0.24, 0.42, 0, 74, [c, sh(c, -0.08), sh(c, -0.16)]);
      for (let i = 0; i < 2; i++) s += doorS(S, 0.46, 0.2 + i * ((f.w - 0.4) / 2), 0.16 + (i + 1) * ((f.w - 0.4) / 2), 12, 64, sh(c, 0.04));
      s += S.at(0.45, 0.25, 74, SP.tube("#F2B8C8") + `<g transform="translate(7 0)">${SP.tube("#A8D5E2")}</g>`) + S.at(f.w - 0.5, 0.25, 74, `<path d="M-8,-4 h10 q4,0 4,4 h-14 Z" fill="#7A808C" ${st(1)}/><path d="M-6,-4 v-8 h5 v8" fill="#9AA1AC" ${st(1)}/>`);
      // いす（きた むき）と おきゃくさん
      const cx = f.w / 2, cy = 1.3;
      s += S.cyl(cx, cy, 0.24, 0, 6, ["#9AA1AC", "#868D98"]) + S.cyl(cx, cy, 0.06, 6, 28, ["#B9BEC4", "#9FA5AB"]) + S.box(cx - 0.28, cy - 0.26, 0.56, 0.52, 34, 12, ["#C9B8E8", "#B5A3D6", "#A08FC2"]);
      s += S.at(cx, cy - 0.06, 40, img(npc(f.sp || "rabbit", f.ci || 0, "up"), -28, -80, 56, 80));
      s += S.at(cx, cy - 0.02, 46, `<path d="M-17,-34 Q0,-40 17,-34 L21,4 Q0,10 -21,4 Z" fill="#F7F4EE" ${st(1.2)}/><path d="M-9,-36 q9,5 18,0" fill="none" stroke="#C9C1B3" stroke-width="1.2"/>`);
      s += S.box(cx - 0.3, cy + 0.2, 0.6, 0.12, 34, 42, ["#C9B8E8", "#B5A3D6", "#A08FC2"]);
      return s;
    },
    // シャンプー台（ながし 2つ・ねかせる いす）
    shampoo(S, f) {
      let s = shadow(S, f, 0.4) + S.box(0.06, 0.04, f.w - 0.12, 0.5, 0, 78, ["#EAF4F2", "#CFE2DE", "#B9D1CC"]);
      const n = 2;
      for (let i = 0; i < n; i++) {
        const cx = 0.75 + i * ((f.w - 1.5) / (n - 1));
        s += S.ellipse(cx, 0.32, 78, 0.24, "#FFFFFF", 1.2) + S.ellipse(cx, 0.32, 78, 0.14, "#DCEFF2", 0) + S.line([[cx, 0.12, 78], [cx, 0.12, 104], [cx + 0.12, 0.22, 104]], "#9AA3AA", 2.2);
        s += S.box(cx - 0.26, 0.62, 0.52, 0.9, 0, 30, ["#8FC7BC", "#78B2A6", "#669E92"]) + S.poly([[cx - 0.26, 0.62, 30], [cx + 0.26, 0.62, 30], [cx + 0.26, 0.86, 62], [cx - 0.26, 0.86, 62]], "#A5D6CB", 1.2);
      }
      for (let i = 0; i < 4; i++) s += S.at(0.3 + i * 0.25, 0.2, 78, SP.bottle(pick(["#F2B8C8", "#A8D5E2", "#F6E2A8", "#FFFFFF"], i), "#7A808C"));
      return s;
    },
    // タオルの ワゴン
    towelcart(S, f) {
      let s = shadow(S, f, 0.36);
      for (const z of [0, 46]) s += S.box(0.16, 0.2, 0.68, 0.6, z + 6, 4, steel);
      for (const [x, y] of [[0.18, 0.22], [0.78, 0.22], [0.18, 0.74], [0.78, 0.74]]) s += S.box(x, y, 0.05, 0.05, 0, 96, ["#B9BEC4", "#9FA5AB", "#8D9399"], 0.9);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) s += S.at(0.32 + i * 0.18, 0.5, 10 + k * 46, `<ellipse cx="0" cy="-5" rx="7" ry="5" fill="${pick(["#FFFFFF", "#F2C6D8", "#C8DEEF"], i + k)}" ${st(1)}/><ellipse cx="0" cy="-12" rx="7" ry="5" fill="${pick(["#C8DEEF", "#FFFFFF", "#F4E3A1"], i + k)}" ${st(1)}/>`);
      s += S.box(0.16, 0.2, 0.68, 0.6, 96, 4, steel);
      return s;
    },
    // ひくい ワゴン（ドライヤー・ブラシ・びん）
    haircart(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.2, 0.2, 0.6, 0.6, 0, 58, ["#F4F1EA", "#E0DACF", "#CCC5B8"]);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.8, 0.24, 0.76, 6 + i * 17, 20 + i * 17, "#E9E3D8");
      s += S.at(0.38, 0.4, 58, SP.bottle("#C9B8E8", "#FFFFFF")) + S.at(0.62, 0.46, 58, `<path d="M-8,-4 h10 q4,0 4,4 h-14 Z" fill="#E8848C" ${st(1)}/><path d="M-6,-4 v-8 h5 v8" fill="#F2A7B0" ${st(1)}/>`);
      return s;
    },
    // ざっしの ラック（ひくい）
    magazines(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d;
      let s = shadow(S, f, 0.36) + S.box(0.1, 0.18, f.w - 0.2, f.d - 0.36, 0, 44, C3(f.wood || "#C9A16E"));
      const n = Math.max(3, Math.round(L * 4));
      for (let i = 0; i < n; i++) { const u = 0.22 + (i * (L - 0.44)) / (n - 1); s += S.at(alongX ? u : f.w * 0.5, alongX ? f.d * 0.5 : u, 44, `<g transform="rotate(${i % 2 ? 6 : -6})"><rect x="-6" y="-17" width="12" height="17" rx="1.4" fill="${pick(["#F4B6C2", "#A8D5BA", "#FFE08A", "#A8C4E8", "#F7C08A"], i)}" ${st(1)}/><circle cx="0" cy="-11" r="3" fill="#FFFFFF"/><path d="M-4,-4 h8" stroke="#FFFFFF" stroke-width="1.2"/></g>`); }
      return s;
    },
    // ---- ケーキ ----
    // 3だんの ケーキスタンド（ちいさな だいの うえ）
    cakestand(S, f) {
      let s = shadow(S, f, 0.36) + S.box(0.16, 0.16, 0.68, 0.68, 0, 64, ["#FFFFFF", "#F2E6E9", "#E3D2D7"]) + S.box(0.12, 0.12, 0.76, 0.76, 64, 4, ["#F8D4DC", "#E8BCC6", "#D8A8B3"]);
      s += S.cyl(0.5, 0.5, 0.04, 68, 64, ["#E2C08E", "#C9A16E"]);
      [[0.36, 72, 4], [0.28, 94, 3], [0.2, 114, 2]].forEach(([r, z, n]) => { s += S.ellipse(0.5, 0.5, z, r, "#FFFFFF", 1.2); for (let i = 0; i < n; i++) s += S.at(0.5 + Math.cos((i / n) * 6.28) * r * 0.55, 0.5 + Math.sin((i / n) * 6.28) * r * 0.55, z, SP.cupcake(pick(["#F8C8D4", "#FFF1D6", "#C9E7F2", "#E3D3EF"], i + z)), 0.8); });
      return s;
    },
    // ギフトの はこ（ひくい つみかさね）
    giftboxes(S, f) {
      let s = shadow(S, f, 0.36);
      [[0.2, 0.25, 0.6, 0.5, 0, 24, "#F8D4DC"], [0.28, 0.32, 0.44, 0.36, 24, 18, "#FFF1D6"], [0.34, 0.38, 0.3, 0.24, 42, 14, "#C9E7F2"]].forEach(([x, y, w, d, z, h, c]) => { s += S.box(x, y, w, d, z, h, C3(c)) + S.line([[x + w / 2, y + d, z], [x + w / 2, y + d, z + h], [x + w / 2, y, z + h]], "#E8545E", 2) + S.line([[x + w, y + d / 2, z], [x + w, y + d / 2, z + h], [x, y + d / 2, z + h]], "#E8545E", 2); });
      s += S.at(0.5, 0.5, 56, `<path d="M0,0 L-7,-5 L-7,3 Z M0,0 L7,-5 L7,3 Z" fill="#E8545E" ${st(0.9)}/>`);
      return s;
    },
    // まんなかの ウエディングケーキ（まるい テーブル）
    weddingcake(S, f) {
      const cx = f.w / 2, cy = f.d / 2;
      let s = S.ellipse(cx, cy, 0, 0.85, "#00000012", 0) + S.cyl(cx, cy, 0.1, 0, 46, ["#E2C08E", "#C9A16E"]) + S.cyl(cx, cy, 0.78, 46, 6, ["#FFFFFF", "#EFE4E7"]) + S.ellipse(cx, cy, 52, 0.7, "#F8D4DC", 0);
      [[0.5, 52, 22, "#FFFFFF"], [0.36, 74, 20, "#FFF7F0"], [0.24, 94, 18, "#FFFFFF"]].forEach(([r, z, h, c]) => { s += S.cyl(cx, cy, r, z, h, [c, sh(c, -0.06)]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; if (Math.sin(a) > -0.3) s += S.at(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + h * 0.45, `<circle r="2.2" fill="#F2A7B8"/>`); } });
      s += S.at(cx, cy, 112, `<circle cx="-4" cy="-4" r="4" fill="#E8545E" ${st(0.9)}/><circle cx="4" cy="-5" r="4" fill="#E8545E" ${st(0.9)}/><path d="M0,-2 v-10" stroke="#7DAF62" stroke-width="1.6"/><path d="M-10,-1 q10,-12 20,0" fill="none" stroke="#F6D47A" stroke-width="1.4"/>`);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4; s += S.at(cx + Math.cos(a) * 0.62, cy + Math.sin(a) * 0.62, 52, SP.flower(pick(["#F2A7B8", "#FFFFFF", "#F6D47A"], i)), 0.8); }
      return s;
    },
    // コーヒーの きかい（ひくい だい）
    coffeemachine(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.12, 0.14, 0.76, 0.72, 0, 56, C3(f.col || "#E8D8C0")) + doorS(S, 0.86, 0.18, 0.82, 8, 48, sh(f.col || "#E8D8C0", 0.06));
      s += S.box(0.2, 0.22, 0.6, 0.46, 56, 26, dark) + S.box(0.3, 0.6, 0.4, 0.06, 66, 10, ["#C9D0D5", "#B3BBC1", "#A0A9AF"], 0.9);
      s += S.at(0.42, 0.74, 56, SP.mug("#FFFFFF")) + S.at(0.66, 0.78, 56, SP.mug("#F8D7DA"));
      return s;
    },
    // ---- ようふく ----
    // かべの ラック（うえの たなに ぼうし・ハンガーの ふく・したの ひきだしに くつ）
    wallrack(S, f) {
      const F = A.frame(S, f), wood = f.wood || "#D2A673", cols = f.cols || ["#F2B8C8", "#BFD8E8", "#F6E2A8", "#C9E2C0", "#E3D0F0", "#FFFFFF"];
      let s = F.poly([[0.04, 0.03, 0], [F.L - 0.04, 0.03, 0], [F.L - 0.04, 0.03, 168], [0.04, 0.03, 168]], sh(wood, 0.25), 1.2);
      s += F.box(0.06, 0, F.L - 0.12, 0.5, 0, 30, C3(wood));
      for (let i = 0; i < Math.round(F.L * 2); i++) s += F.at(0.3 + i * ((F.L - 0.6) / Math.max(1, Math.round(F.L * 2) - 1)), 0.4, 30, SP.shoe(pick(["#E86F6F", "#6E8FC9", "#F2D06B", "#FFFFFF", "#9C7A5A"], i)));
      s += F.box(0.1, 0.02, 0.06, 0.06, 30, 110, ["#B9BEC4", "#9FA5AB", "#8D9399"]) + F.box(F.L - 0.16, 0.02, 0.06, 0.06, 30, 110, ["#B9BEC4", "#9FA5AB", "#8D9399"]);
      s += F.poly([[0.12, 0.3, 128], [F.L - 0.12, 0.3, 128]], "none", 2.6);
      const n = Math.round(F.L * 4);
      for (let i = 0; i < n; i++) s += F.at(0.3 + (i * (F.L - 0.6)) / (n - 1), 0.3, 72, (i % 3 === 1 ? SP.dress : SP.shirt)(pick(cols, i)), 2.4);
      s += F.box(0.06, 0, F.L - 0.12, 0.42, 142, 5, C3(wood));
      for (let i = 0; i < Math.round(F.L * 2); i++) s += F.at(0.35 + i * ((F.L - 0.7) / Math.max(1, Math.round(F.L * 2) - 1)), 0.22, 147, SP.hat(pick(["#F2C6D8", "#F4E3A1", "#C8DEEF", "#DDEBC9"], i)));
      return s;
    },
    // しちゃくしつ（2つの へや・カーテン・うえの ふだ）
    fittingroom(S, f) {
      const c = f.col || "#E7AFC2", w = f.w, d = f.d, H = 150;
      let s = S.poly([[0.04, 0.04, 0], [w - 0.04, 0.04, 0], [w - 0.04, 0.04, H], [0.04, 0.04, H]], "#F8EEF0", 1.2);
      const rooms = 2, rw = (w - 0.12) / rooms;
      for (let i = 0; i <= rooms; i++) s += S.box(0.04 + i * rw - 0.04, 0.04, 0.08, d - 0.2, 0, H, ["#FFFDF8", "#EFE7DD", "#E0D6CA"]);
      for (let i = 0; i < rooms; i++) {
        const x0 = 0.08 + i * rw, x1 = x0 + rw - 0.08;
        if (i === 0) { s += S.poly([[x0 + 0.1, 0.06, 20], [x1 - 0.1, 0.06, 20], [x1 - 0.1, 0.06, 130], [x0 + 0.1, 0.06, 130]], "#DDEFF2", 1.2) + S.at(x0 + rw * 0.3, d - 0.4, 0, `<rect x="-9" y="-3" width="18" height="3" rx="1" fill="#C9A16E"/>`); s += S.poly([[x1 - 0.42, d - 0.16, 4], [x1, d - 0.16, 4], [x1, d - 0.16, 136], [x1 - 0.5, d - 0.16, 136]], c, 1.3); }
        else { s += S.poly([[x0, d - 0.16, 4], [x1, d - 0.16, 4], [x1, d - 0.16, 136], [x0, d - 0.16, 136]], c, 1.3); for (let k = 1; k < 5; k++) s += S.line([[x0 + (k * (x1 - x0)) / 5, d - 0.155, 8], [x0 + (k * (x1 - x0)) / 5, d - 0.155, 132]], sh(c, -0.18), 1); }
      }
      s += S.box(0, 0, w, d - 0.12, H, 10, ["#FFFDF8", "#EFE7DD", "#E0D6CA"]) + faceS(S, w / 2 - 0.8, w / 2 + 0.8, d - 0.1, H + 12, H + 38, `<rect x="2" y="2" width="${1.6 * T() - 4}" height="22" rx="8" fill="${c}" ${st(1.2)}/>` + txt(0.8 * T(), 18, 11, "しちゃくしつ", "#FFFDF6"));
      s += S.line([[0.06, d - 0.16, 138], [w - 0.06, d - 0.16, 138]], "#B9BEC4", 2.4);
      return s;
    },
    // マネキン（まるい だいの うえ。きて いる ふくは f.item）
    mannequin(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.42, "#00000014", 0) + S.cyl(0.5, 0.5, 0.36, 0, 12, ["#FFFBF2", "#E8DCC6"]);
      const svg = typeof WearMannequin !== "undefined" ? WearMannequin.svg(f.item || "mint_dress") : "";
      if (svg) s += S.at(0.5, 0.5, 12, img(svg, -34, -112, 68, 112));
      return s;
    },
    // ひくい だいに たたんだ ふく
    foldtable(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d;
      let s = shadow(S, f, 0.42) + S.box(0.08, 0.12, f.w - 0.16, f.d - 0.24, 0, 46, C3(f.wood || "#E2C49A"));
      const n = Math.max(3, Math.round(L * 2.6));
      for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const u = 0.3 + (i * (L - 0.6)) / (n - 1), v = 0.36 + k * 0.3; s += S.at(alongX ? u : v * f.w, alongX ? v * f.d : u, 46, SP.folded(pick(["#F2B8C8", "#BFD8E8", "#F6E2A8", "#C9E2C0", "#E3D0F0", "#FFFFFF"], i + k * 2)) + `<g transform="translate(0 -10)">${SP.folded(pick(["#BFD8E8", "#F6E2A8", "#FFFFFF", "#F2B8C8"], i + k))}</g>`); }
      return s;
    },
    // ぼうしの スタンド
    hatstand(S, f) {
      let s = shadow(S, f, 0.3) + S.cyl(0.5, 0.5, 0.26, 0, 6, ["#C9A16E", "#B08A58"]) + S.cyl(0.5, 0.5, 0.04, 6, 130, ["#D2A673", "#B08A58"]);
      [[0.32, 0.4, 100, "#F2C6D8"], [0.66, 0.42, 116, "#F4E3A1"], [0.4, 0.6, 128, "#C8DEEF"], [0.62, 0.62, 92, "#DDEBC9"]].forEach(([x, y, z, c]) => { s += S.line([[0.5, 0.5, z - 6], [x, y, z]], "#B08A58", 2) + S.at(x, y, z - 4, SP.hat(c), 1.1); });
      return s;
    },
    // ---- かぐ ----
    // 家具の みほん（おうちの 家具の 立体を ならべる。ラグの うえ）
    vignette(S, f) {
      const sets = {
        bedroom: { rug: "#E8D3D9", items: [["bed_simple", 1.1, 2.55], ["lamp", 0.3, 0.75], ["plant", 1.7, 0.75]] },
        living: { rug: "#D6E4D2", items: [["sofa", 1.5, 1.1], ["table_wood", 1.5, 2.3], ["plant", 0.35, 0.8], ["lamp", 2.65, 0.75]] },
        dining: { rug: "#EADCC5", items: [["chair_wood", 0.85, 0.75], ["chair_wood", 2.05, 0.75], ["table_wood", 1.45, 1.55], ["teddy", 2.65, 1.7]] },
        study: { rug: "#D9DDE9", items: [["bookshelf", 0.55, 0.6], ["desk", 1.4, 1.3], ["stool_oak", 1.4, 1.75]] },
      };
      const set = sets[f.variant] || sets.living;
      let s = S.poly([[0.12, 0.12, 0.6], [f.w - 0.12, 0.12, 0.6], [f.w - 0.12, f.d - 0.12, 0.6], [0.12, f.d - 0.12, 0.6]], set.rug, 1.2) + S.poly([[0.26, 0.26, 1], [f.w - 0.26, 0.26, 1], [f.w - 0.26, f.d - 0.26, 1], [0.26, f.d - 0.26, 1]], "none", 1) + S.poly([[0.26, 0.26, 1], [f.w - 0.26, 0.26, 1], [f.w - 0.26, f.d - 0.26, 1], [0.26, f.d - 0.26, 1]], sh(set.rug, 0.12), 0.6);
      const items = set.items.map(([id, cx, fy]) => ({ id, cx: Math.min(cx, f.w - 0.2), fy: Math.min(fy, f.d - 0.1) })).sort((a, b) => a.cx + a.fy - (b.cx + b.fy));
      for (const it of items) {
        if (typeof HomeDesign === "undefined" || !FURN_INDEX[it.id]) continue;
        const m = HomeDesign.model(it.id, {}), q = S.P(it.cx, it.fy, 1);
        S.grow(q.x + m.x, q.y + m.y, q.x + m.x + m.w, q.y + m.y + m.h);
        s += m.full.replace("<svg ", `<svg x="${f2(q.x + m.x)}" y="${f2(q.y + m.y)}" width="${f2(m.w)}" height="${f2(m.h)}" `);
      }
      // ねふだ
      s += S.at(f.w - 0.35, f.d - 0.2, 2, `<rect x="-16" y="-14" width="32" height="14" rx="3" fill="#FFFDF4" ${st(1)}/><path d="M-11,-9 h22 M-11,-5 h14" stroke="#B8B0A0" stroke-width="1"/>`);
      return s;
    },
    // かべがみの みほんと ラグの まきもの
    swatches(S, f) {
      const F = A.frame(S, f);
      let s = F.poly([[0.04, 0.03, 0], [F.L - 0.04, 0.03, 0], [F.L - 0.04, 0.03, 160], [0.04, 0.03, 160]], "#E9DFCF", 1.2);
      const cols = ["#DDAABD", "#B7C8AB", "#A5C5D0", "#ECD59D", "#C9B8E8", "#F2C6A8", "#BFD8E8", "#E8D3D9"];
      for (let i = 0; i < 8; i++) { const u0 = 0.14 + (i % 4) * ((F.L - 0.28) / 4), u1 = u0 + (F.L - 0.28) / 4 - 0.06, z0 = i < 4 ? 92 : 30; s += F.rect(0.06, u0, u1, z0, z0 + 52, cols[i], 1.2) + F.rect(0.065, u0 + 0.04, u1 - 0.04, z0 + 40, z0 + 46, "#FFFFFF88", 0); }
      for (let i = 0; i < 4; i++) s += F.box(0.2 + i * ((F.L - 0.4) / 4), 0.4, 0.2, 0.2, 0, 44 + (i % 2) * 14, C3(pick(["#C88B6A", "#8FA88E", "#E8C46E", "#A3B4D6"], i)), 1.1);
      s += F.box(0, -0.02, F.L, 0.2, 160, 8, C3("#C9A16E"));
      return s;
    },
    // ゆかに たつ ランプ（おうちの ランプ）
    floorlamp(S, f) {
      if (typeof HomeDesign === "undefined" || !FURN_INDEX[f.item || "lamp_tulip"]) return shadow(S, f);
      const m = HomeDesign.model(f.item || "lamp_tulip", {}), q = S.P(0.5, 0.75, 0);
      S.P(0, 0, 0); S.P(1, 1, 0); S.grow(q.x + m.x, q.y + m.y, q.x + m.x + m.w, q.y + m.y + m.h);
      return shadow(S, f, 0.3) + m.full.replace("<svg ", `<svg x="${f2(q.x + m.x)}" y="${f2(q.y + m.y)}" width="${f2(m.w)}" height="${f2(m.h)}" `);
    },
    // ---- スーパー ----
    // いけす（さかな が およぐ。うごきは L）
    fishtank(S, f) {
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.86, 0, 64, ["#7FA7C9", "#6A93B6", "#5A82A4"]);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.96, 0.12 + i * 0.95, 0.94 + i * 0.95, 10, 56, "#8FB5D3");
      s += S.box(0.06, 0.14, f.w - 0.12, 0.78, 64, 56, ["#BFE3EE66", "#9FD1E288", "#8BC4D888"], 1.4);
      s += S.poly([[0.1, 0.18, 108], [f.w - 0.1, 0.18, 108], [f.w - 0.1, 0.88, 108], [0.1, 0.88, 108]], "#8FCFE2aa", 1);
      s += S.poly([[0.1, 0.9, 70], [f.w - 0.1, 0.9, 70], [f.w - 0.1, 0.9, 104], [0.1, 0.9, 104]], "#6FB8D266", 0);
      for (let i = 0; i < 5; i++) s += S.at(0.3 + i * 0.55, 0.5 + (i % 2) * 0.2, 80 + (i % 3) * 8, `<path d="M-9,0 Q-3,-5 6,0 Q-3,5 -9,0 Z M6,0 l5,-4 v8 Z" fill="${pick(["#F28B5E", "#9FB7C9", "#F6D47A", "#C9A2D6"], i)}" ${st(0.9)}/><circle cx="-5" cy="-0.6" r="0.9" fill="${INK}"/>`);
      s += S.box(0.02, 0.06, f.w - 0.04, 0.9, 120, 6, ["#5A82A4", "#4C7395", "#406484"]) + faceS(S, f.w / 2 - 0.6, f.w / 2 + 0.6, 0.97, 128, 154, `<rect x="2" y="2" width="${1.2 * T() - 4}" height="22" rx="8" fill="#3F7FB0" ${st(1.2)}/>` + txt(0.6 * T(), 18, 12, "いけす", "#FFFFFF"));
      return s;
    },
    // やおや（ななめの はこに くだもの・やさい）
    produce(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d, goods = f.variant === "veg" ? G.veg : G.fruit;
      let s = shadow(S, f, 0.45) + S.box(0.06, 0.08, f.w - 0.12, f.d - 0.16, 0, 40, C3("#C99A6B"));
      for (let i = 0; i < Math.round(L * 1.5); i++) {
        const u0 = 0.1 + i * ((L - 0.2) / Math.round(L * 1.5)), u1 = u0 + (L - 0.2) / Math.round(L * 1.5) - 0.04;
        const P3 = (u, v, z) => (alongX ? [u, v, z] : [v, u, z]);
        s += S.poly([P3(u0, 0.12, 52), P3(u1, 0.12, 52), P3(u1, (alongX ? f.d : f.w) - 0.12, 40), P3(u0, (alongX ? f.d : f.w) - 0.12, 40)], pick(["#E3C391", "#D9B37E"], i), 1.1);
        for (let k = 0; k < 6; k++) { const u = u0 + 0.08 + (k % 3) * ((u1 - u0 - 0.16) / 2), v = 0.3 + Math.floor(k / 3) * ((alongX ? f.d : f.w) - 0.6); const [x, y, z] = P3(u, v, 44 + (1 - Math.floor(k / 3)) * 6); s += S.at(x, y, z, goods(i * 2 + (k % 2)), 0.95); }
      }
      s += alongX ? faceS(S, L / 2 - 0.45, L / 2 + 0.45, f.d - 0.07, 12, 32, `<rect x="2" y="2" width="${0.9 * T() - 4}" height="16" rx="4" fill="#FFFDF4" ${st(1)}/>` + txt(0.45 * T(), 14, 10, f.variant === "veg" ? "やさい" : "くだもの")) : faceE(S, f.w - 0.07, L / 2 - 0.45, L / 2 + 0.45, 12, 32, `<rect x="2" y="2" width="${0.9 * T() - 4}" height="16" rx="4" fill="#FFFDF4" ${st(1)}/>` + txt(0.45 * T(), 14, 10, f.variant === "veg" ? "やさい" : "くだもの"));
      return s;
    },
    // はかりの だい（ふくろ・はかり）
    scalestand(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.12, 0.14, 0.76, 0.72, 0, 64, C3("#E3E8EB")) + doorS(S, 0.86, 0.16, 0.84, 8, 56, "#EEF1F3");
      s += S.at(0.48, 0.5, 64, `<rect x="-11" y="-4" width="22" height="4" rx="1" fill="#DCE2E6" ${st(1)}/><rect x="-7" y="-14" width="14" height="10" rx="2" fill="#F6F2EA" ${st(1)}/><rect x="-5" y="-12" width="10" height="4" fill="#9FD7E0"/>`);
      return s;
    },
    // ---- クレープ ----
    // クレープの キッチン（まるい てっぱん 2つ・きじ・トッピング）
    crepekitchen(S, f) {
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.86, 0, 82, ["#FBEDE6", "#EDD7CC", "#DEC4B7"]);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.96, 0.12 + i * 0.95, 0.94 + i * 0.95, 12, 70, "#F6E1D8");
      s += S.box(0, 0.06, f.w, 0.92, 82, 5, steel);
      for (const cx of [0.55, 1.45]) s += S.cyl(cx, 0.5, 0.36, 87, 8, ["#6E747E", "#5A606A"]) + S.ellipse(cx, 0.5, 95, 0.3, "#F2D79A", 1.2) + S.ellipse(cx, 0.5, 95.5, 0.18, "#F8E4B4", 0);
      s += S.at(1.45, 0.5, 96, `<path d="M-14,-3 l9,6" stroke="#8A6A4A" stroke-width="2.4"/><ellipse cx="-16" cy="-4" rx="4" ry="2" fill="#C99A6B" ${st(0.9)}/>`);
      for (let i = 0; i < 4; i++) s += S.cyl(2.2 + (i % 2) * 0.34, 0.32 + Math.floor(i / 2) * 0.32, 0.13, 87, 12, [pick(["#FFF5EC", "#F2A7B8", "#8A5A3C", "#F6D47A"], i), "#E6D8C8"]);
      s += S.box(0.1, 0.12, f.w - 0.2, 0.36, 150, 5, ["#F6EEDF", "#E5D8C2", "#D3C4AA"]);
      for (let i = 0; i < 6; i++) s += S.at(0.35 + i * 0.45, 0.3, 155, SP.jar(pick(["#F2B8C0", "#F3D27A", "#B9DCA4", "#E9A86E", "#C9B4E4", "#FFFFFF"], i)));
      return s;
    },
    // トッピングの だい（ボウルに いちご・バナナ・クリーム）
    toppingbar(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.12, 0.14, 0.76, 0.72, 0, 70, ["#FBEDE6", "#EDD7CC", "#DEC4B7"]) + S.box(0.08, 0.1, 0.84, 0.8, 70, 4, steel);
      [[0.32, 0.35, "#E8545E"], [0.66, 0.38, "#F6D35A"], [0.4, 0.66, "#FFFFFF"], [0.7, 0.68, "#8A5A3C"]].forEach(([x, y, c]) => { s += S.cyl(x, y, 0.13, 74, 9, ["#FFFFFF", "#E6EEF0"]) + S.ellipse(x, y, 83, 0.1, c, 0.9); });
      return s;
    },
    // アイスの ケース（ひくい・ガラス）
    icecase(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.1, 0.12, 0.8, 0.76, 0, 58, ["#EAF6F8", "#CFE7EC", "#B5D6DD"]);
      for (let i = 0; i < 4; i++) s += S.at(0.3 + (i % 2) * 0.38, 0.32 + Math.floor(i / 2) * 0.34, 58, `<ellipse rx="8" ry="4" fill="${pick(["#F8C8D4", "#FFF4D8", "#B8D8A0", "#C79A76"], i)}" ${st(0.9)}/>`);
      s += S.poly([[0.12, 0.14, 62], [0.88, 0.14, 62], [0.88, 0.86, 62], [0.12, 0.86, 62]], "#FFFFFF44", 1);
      return s;
    },
    // ---- はいしゃ ----
    // しんさつ台（いす・ライト・トレイ・がめん・ついたて）
    dentalchair(S, f) {
      let s = shadow(S, f, 0.45);
      s += S.poly([[0.06, 0.06, 0], [f.w - 0.06, 0.06, 0], [f.w - 0.06, 0.06, 150], [0.06, 0.06, 150]], "#EAF5F8", 1.2);
      // ついたて（みなみ と ひがし）
      s += S.box(0.1, f.d - 0.2, f.w * 0.42, 0.08, 0, 112, ["#FFFFFF", "#E6EEF0", "#D3DEE2"]) + S.box(f.w - 0.18, 0.1, 0.08, f.d * 0.38, 0, 112, ["#FFFFFF", "#E6EEF0", "#D3DEE2"]);
      // いす（ねかせた かたち）
      const cx = 1.3, cy = 1.25;
      s += S.box(cx - 0.18, cy - 0.3, 0.36, 0.6, 0, 22, C3("#C9D0D5")) + S.poly([[cx - 0.3, cy + 0.45, 34], [cx + 0.3, cy + 0.45, 34], [cx + 0.3, cy - 0.15, 40], [cx - 0.3, cy - 0.15, 40]], "#7FC1D9", 1.3) + S.poly([[cx - 0.3, cy - 0.15, 40], [cx + 0.3, cy - 0.15, 40], [cx + 0.26, cy - 0.7, 78], [cx - 0.26, cy - 0.7, 78]], "#8FCBE0", 1.3);
      s += S.box(cx - 0.3, cy + 0.45, 0.6, 0.3, 24, 10, C3("#7FC1D9"));
      // ライトの うで・トレイ・がめん
      s += S.line([[0.35, 0.3, 0], [0.35, 0.3, 160], [cx, cy - 0.5, 150]], "#B9BEC4", 2.6) + S.at(cx, cy - 0.5, 140, `<ellipse rx="10" ry="6" fill="#FFF3C4" ${st(1.2)}/>`);
      s += S.line([[cx + 0.6, cy - 0.2, 0], [cx + 0.6, cy - 0.2, 82]], "#B9BEC4", 2.4) + S.box(cx + 0.38, cy - 0.42, 0.44, 0.36, 82, 4, steel) + S.at(cx + 0.6, cy - 0.24, 86, `<path d="M-6,0 L6,0 M-4,-3 l8,0" stroke="#9AA3AA" stroke-width="1.6"/>`);
      s += S.box(0.25, 0.1, 0.5, 0.06, 104, 34, ["#55606A", "#3F474F", "#4A535C"]) + S.poly([[0.28, 0.165, 108], [0.72, 0.165, 108], [0.72, 0.165, 134], [0.28, 0.165, 134]], "#BFE3EE", 0.8);
      s += S.cyl(cx + 0.7, cy + 0.35, 0.12, 0, 46, ["#FFFFFF", "#E3E8EB"]) + S.ellipse(cx + 0.7, cy + 0.35, 46, 0.09, "#9FD1E2", 0.8);
      return s;
    },
    // どうぐの たなと ながし（はいしゃ）
    dentcabinet(S, f) {
      let s = S.box(0.04, 0.1, f.w - 0.08, 0.84, 0, 80, ["#FFFFFF", "#E6EEF0", "#D3DEE2"]);
      for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) s += doorS(S, 0.94, 0.12 + i * 0.94, 0.94 + i * 0.94, 8 + k * 23, 27 + k * 23, k === 2 ? "#DCEFF6" : "#F4F8F9");
      s += S.box(0.02, 0.06, f.w - 0.04, 0.9, 80, 5, ["#DCE7EA", "#C6D4D8", "#B2C2C7"]);
      s += S.ellipse(2.3, 0.5, 85, 0.24, "#FFFFFF", 1.2) + S.line([[2.3, 0.18, 85], [2.3, 0.18, 108], [2.42, 0.28, 108]], "#9AA3AA", 2.2);
      for (let i = 0; i < 4; i++) s += S.at(0.3 + i * 0.3, 0.45, 85, i % 2 ? SP.jar("#BFE3EE", "#FFFFFF") : SP.bottle("#FFFFFF", "#7FC1D9"));
      s += S.box(0.1, 0.06, 1.3, 0.3, 140, 4, steel);
      for (let i = 0; i < 5; i++) s += S.at(0.22 + i * 0.25, 0.22, 144, SP.toothbrush(pick(["#F28B82", "#8EC5F4", "#F3C24F", "#8FD19E", "#C9B8E8"], i)));
      return s;
    },
    // キッズ コーナー（ちいさな テーブル・いす・つみき・えほん）
    kidscorner(S, f) {
      let s = S.poly([[0.08, 0.08, 0.5], [f.w - 0.08, 0.08, 0.5], [f.w - 0.08, f.d - 0.08, 0.5], [0.08, f.d - 0.08, 0.5]], "#F8E8A8", 1.2);
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) if ((i + k) % 2) s += S.poly([[0.08 + i * ((f.w - 0.16) / 4), 0.08 + k * ((f.d - 0.16) / 4), 0.8], [0.08 + (i + 1) * ((f.w - 0.16) / 4), 0.08 + k * ((f.d - 0.16) / 4), 0.8], [0.08 + (i + 1) * ((f.w - 0.16) / 4), 0.08 + (k + 1) * ((f.d - 0.16) / 4), 0.8], [0.08 + i * ((f.w - 0.16) / 4), 0.08 + (k + 1) * ((f.d - 0.16) / 4), 0.8]], "#9FD1D9", 0);
      const cx = f.w / 2, cy = f.d / 2;
      s += S.cyl(cx, cy, 0.05, 0, 30, ["#E2C08E", "#C9A16E"]) + S.cyl(cx, cy, 0.38, 30, 5, ["#F4A4A9", "#DD8D93"]);
      for (const [x, y] of [[cx - 0.55, cy], [cx, cy - 0.55]]) s += S.box(x - 0.14, y - 0.14, 0.28, 0.28, 0, 18, C3(pick(["#8EC5F4", "#F3C24F"], x > cx ? 1 : 0)));
      s += S.at(cx - 0.05, cy, 35, `<path d="M-9,-2 L0,-5 L9,-2 L9,1 L0,-2 L-9,1 Z" fill="#FFFDF6" ${st(1)}/><path d="M0,-5 V-2" stroke="${INK}" stroke-width=".8"/><g transform="translate(9 -1)">${SP.cube("#F28B82")}</g>`);
      s += S.at(f.w - 0.35, f.d - 0.35, 1, SP.cube("#8FD19E") + `<g transform="translate(9 2)">${SP.cube("#F3C24F")}</g><g transform="translate(4 -9)">${SP.cube("#8EC5F4")}</g>`);
      return s;
    },
    // すいそう（ちいさな だいの うえ。さかなは L）
    aquarium(S, f) {
      const alongX = f.w >= f.d;
      let s = shadow(S, f, 0.42) + S.box(0.08, 0.14, f.w - 0.16, f.d - 0.28, 0, 54, C3("#C9A16E"));
      s += S.box(0.1, 0.16, f.w - 0.2, f.d - 0.32, 54, 48, ["#BFE3EE55", "#9FD1E277", "#8BC4D877"], 1.4) + S.poly([[0.14, 0.2, 92], [f.w - 0.14, 0.2, 92], [f.w - 0.14, f.d - 0.2, 92], [0.14, f.d - 0.2, 92]], "#8FCFE2aa", 0.8);
      for (let i = 0; i < 4; i++) s += S.at(alongX ? 0.35 + i * ((f.w - 0.7) / 3) : f.w / 2, alongX ? f.d / 2 : 0.35 + i * ((f.d - 0.7) / 3), 58, `<path d="M0,0 q-3,-12 0,-22 M5,0 q4,-9 0,-16" fill="none" stroke="#6FA35E" stroke-width="2"/>`);
      for (let i = 0; i < 3; i++) s += S.at(alongX ? 0.4 + i * ((f.w - 0.8) / 2) : f.w / 2, alongX ? f.d / 2 : 0.4 + i * ((f.d - 0.8) / 2), 74 + (i % 2) * 8, `<path d="M-7,0 Q-2,-4 5,0 Q-2,4 -7,0 Z M5,0 l4,-3 v6 Z" fill="${pick(["#F28B5E", "#F6D47A", "#8EC5F4"], i)}" ${st(0.8)}/>`);
      s += S.box(0.08, 0.14, f.w - 0.16, f.d - 0.28, 102, 6, C3("#6E747E"));
      return s;
    },
    // ---- パン ----
    // いしがま オーブン（ほのおは L）
    stoneoven(S, f) {
      let s = S.box(0.02, 0.06, f.w - 0.04, 0.9, 0, 150, ["#E3B898", "#CFA383", "#BB8F70"]);
      for (let z = 14, k = 0; z < 146; z += 16, k++) for (let x = (k % 2) * 0.22 + 0.06; x < f.w - 0.1; x += 0.44) s += S.poly([[x, 0.965, z], [Math.min(x + 0.38, f.w - 0.06), 0.965, z], [Math.min(x + 0.38, f.w - 0.06), 0.965, z + 13], [x, 0.965, z + 13]], pick(["#D9A889", "#CD9A7B", "#E1B596"], k + Math.round(x * 3)), 0.8);
      s += faceS(S, 0.75, 2.25, 0.97, 40, 118, `<path d="M8,${78} V40 Q${0.75 * T()},-6 ${1.5 * T() - 8},40 V78 Z" fill="#5A4639" stroke="${INK}" stroke-width="2"/><path d="M22,78 Q${0.75 * T()},30 ${1.5 * T() - 22},78 Z" fill="#3A2C24"/><path d="M${0.75 * T() - 22},78 q8,-18 14,-6 q6,-20 14,0 q6,-12 10,6 Z" fill="#F2A33A" stroke="${INK}" stroke-width="1"/>`);
      s += S.box(0.6, 0.98, 1.8, 0.12, 36, 6, C3("#9A7A62"));
      s += S.box(0, 0.02, f.w, 0.94, 150, 10, C3("#C99A7E"));
      s += S.at(0.45, 0.5, 160, `<rect x="-3" y="-30" width="6" height="30" fill="#B9A08C" ${st(1)}/>`);
      return s;
    },
    // さましだな（トレイに やきたての パン）
    coolingrack(S, f) {
      let s = shadow(S, f, 0.34);
      for (const [x, y] of [[0.14, 0.16], [0.8, 0.16], [0.14, 0.78], [0.8, 0.78]]) s += S.box(x, y, 0.05, 0.05, 0, 124, ["#B9BEC4", "#9FA5AB", "#8D9399"], 0.9);
      for (let k = 0; k < 4; k++) { const z = 14 + k * 30; s += S.box(0.14, 0.16, 0.72, 0.68, z, 3, ["#D6DCE0", "#BFC7CC", "#AAB3B9"], 1); for (let i = 0; i < 3; i++) s += S.at(0.3 + i * 0.2, 0.5, z + 3, G.bread(i + k), 0.85); }
      return s;
    },
    // こむぎこの ふくろ
    flourbags(S, f) {
      let s = shadow(S, f, 0.34);
      [[0.3, 0.4, 0], [0.62, 0.46, 0], [0.45, 0.62, 30]].forEach(([x, y, z]) => { s += S.at(x, y, z, `<path d="M-11,0 L-12,-26 Q0,-31 12,-26 L11,0 Z" fill="#F3E6C8" ${st(1.1)}/><path d="M-8,-17 h16" stroke="#C99A6B" stroke-width="1.4"/>${txt(0, -8, 7, "こむぎ", "#A57E52")}`); });
      return s;
    },
    // パンの テーブル（トレイ・ねふだ）
    breadtable(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d;
      let s = shadow(S, f, 0.45) + S.box(0.06, 0.08, f.w - 0.12, f.d - 0.16, 0, 62, C3(f.wood || "#C9965E"));
      const n = Math.max(2, Math.round(L * 1.4));
      for (let i = 0; i < n; i++) {
        const u = 0.2 + i * ((L - 0.4) / n), lu = (L - 0.4) / n - 0.06, P3 = (uu, vv, z) => (alongX ? [uu, vv, z] : [vv, uu, z]);
        s += S.poly([P3(u, 0.16, 62.5), P3(u + lu, 0.16, 62.5), P3(u + lu, (alongX ? f.d : f.w) - 0.16, 62.5), P3(u, (alongX ? f.d : f.w) - 0.16, 62.5)], "#F6EEDF", 1);
        for (let k = 0; k < 3; k++) { const [x, y, z] = P3(u + lu / 2 + (k - 1) * lu * 0.28, 0.3 + (k % 2) * ((alongX ? f.d : f.w) - 0.6), 63); s += S.at(x, y, z, G.bread(i * 3 + k), 0.9); }
      }
      return s;
    },
    // トレイと トングの だい
    traystand(S, f) {
      let s = shadow(S, f, 0.3) + S.box(0.22, 0.22, 0.56, 0.56, 0, 70, C3("#C9965E"));
      for (let k = 0; k < 4; k++) s += S.box(0.24, 0.24, 0.52, 0.52, 70 + k * 3, 2.4, ["#F2F2EE", "#DDDDD5", "#C9C9C0"], 0.9);
      s += S.at(0.5, 0.5, 84, `<path d="M-8,0 L6,-12 M-6,2 L8,-10" stroke="#9AA3AA" stroke-width="2.4" stroke-linecap="round"/>`);
      return s;
    },
    // ---- はな ----
    // バケツの だん（おくが たかい 3だん・いろいろな はな。おく から じゅんに 描く）
    bucketstand(S, f) {
      const F = A.frame(S, f), L = F.L, wood = f.wood || "#B99B74", tiers = F.face === "s" && f.d === 1 ? [[0.06, 64], [0.36, 34], [0.66, 6]] : [[0.06, 58], [0.5, 22]];
      const bunch = (c, k) => `<path d="M-7,0 L-8,-13 L8,-13 L7,0 Z" fill="#9AA6AE" ${st(1)}/><path d="M-8,-13 h16" stroke="#C5CDD2" stroke-width="1.4"/>` + [[-5, -18], [0, -23], [5, -18], [-3, -27], [3, -28], [-7, -24], [7, -24]].map(([x, y], i) => `<path d="M0,-13 L${x},${y + 4}" stroke="#6E9A5E" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${i % 3 ? 3.4 : 4.2}" fill="${i % 4 === 3 ? "#FFFFFF" : c}" ${st(0.8)}/><circle cx="${x}" cy="${y}" r="1.2" fill="${sh(c, -0.25)}"/>`).join("") + `<path d="M-6,-15 q-4,-3 -6,1 M6,-15 q4,-3 6,1" fill="#8FB97E" ${st(0.8)}/>`;
      let s = "";
      tiers.forEach(([v0, z], k) => {
        s += F.box(0.06, v0, L - 0.12, 0.3, 0, z + 10, C3(sh(wood, (tiers.length - k) * 0.04)));
        const n = Math.max(2, Math.round(L * 2.3));
        for (let i = 0; i < n; i++) { const u = 0.28 + (i * (L - 0.56)) / (n - 1), c = pick(["#F2A7B8", "#F6D47A", "#C9B8E8", "#F28B82", "#F7B267", "#A8D5E2"], i + k * 2); s += F.at(u, v0 + 0.15, z + 10, bunch(c, k), 1.15); }
      });
      return s;
    },
    // つつみがみの ロール
    paperroll(S, f) {
      let s = shadow(S, f, 0.3) + S.box(0.2, 0.3, 0.6, 0.4, 0, 8, C3("#B99B74"));
      for (const x of [0.25, 0.7]) s += S.box(x, 0.45, 0.05, 0.1, 8, 110, C3("#B99B74"));
      [[96, "#F2C6D8"], [70, "#FFF3C4"], [44, "#C8DEEF"]].forEach(([z, c]) => { s += S.cyl(0.52, 0.5, 0.11, z, 2, [c, sh(c, -0.1)]) + S.line([[0.28, 0.5, z], [0.75, 0.5, z]], c, 7) + S.line([[0.28, 0.5, z + 4], [0.75, 0.5, z + 4]], "#FFFFFF", 1); });
      return s;
    },
    // リボンの ラック（ひくい）
    ribbonrack(S, f) {
      let s = shadow(S, f, 0.3) + S.box(0.16, 0.18, 0.68, 0.64, 0, 56, C3("#E9DFCF"));
      for (let i = 0; i < 6; i++) s += S.cyl(0.3 + (i % 3) * 0.2, 0.36 + Math.floor(i / 3) * 0.28, 0.07, 56, 8, [pick(["#F28BB2", "#F6D47A", "#8EC5F4", "#C9B8E8", "#8FD19E", "#FFFFFF"], i), "#E6D8C8"]);
      return s;
    },
    // トレリス（つるばら・つりばち）
    trellis(S, f) {
      const F = A.frame(S, f), L = F.L;
      let s = F.box(0.06, 0.1, L - 0.12, 0.4, 0, 40, C3("#B99B74"));
      for (let i = 0; i <= 6; i++) s += F.poly([[0.1 + (i * (L - 0.2)) / 6, 0.12, 40], [0.1 + (i * (L - 0.2)) / 6, 0.12, 170]], "none", 1.6);
      for (let k = 0; k <= 5; k++) s += F.poly([[0.1, 0.12, 40 + k * 26], [L - 0.1, 0.12, 40 + k * 26]], "none", 1.6);
      for (let i = 0; i < 14; i++) { const u = 0.2 + ((i * 0.37) % 1) * (L - 0.4), z = 50 + ((i * 53) % 110); s += F.at(u, 0.14, z, `<circle r="6" fill="#86AE78" ${st(1)}/><circle cx="4" cy="-3" r="3.4" fill="${pick(["#F2A7B8", "#F28B82", "#FFFFFF"], i)}" ${st(0.8)}/>`); }
      for (let i = 0; i < 4; i++) s += F.at(0.3 + i * ((L - 0.6) / 3), 0.32, 40, SP.pot(pick(["#D3A98E", "#E7B9A0", "#C9C1B3"], i)), 1.2);
      return s;
    },
    // はなたばの テーブル
    bouquettable(S, f) {
      const alongX = f.w >= f.d, L = alongX ? f.w : f.d;
      let s = shadow(S, f, 0.42) + S.box(0.08, 0.12, f.w - 0.16, f.d - 0.24, 0, 60, C3("#E9DFCF"));
      const n = Math.max(2, Math.round(L * 2));
      for (let i = 0; i < n; i++) { const u = 0.3 + (i * (L - 0.6)) / (n - 1); s += S.at(alongX ? u : f.w / 2, alongX ? f.d / 2 : u, 60, G.bouquets(i), 1.4); }
      return s;
    },
    // じょうろ と ブリキの バケツ
    wateringcans(S, f) {
      let s = shadow(S, f, 0.3);
      s += S.cyl(0.38, 0.5, 0.18, 0, 26, ["#B9C4CB", "#9FAAB2"]) + S.at(0.38, 0.5, 26, SP.flower("#F2A7B8"));
      s += S.at(0.66, 0.45, 0, `<path d="M-8,0 V-14 H8 V0 Z" fill="#8FC3A8" ${st(1)}/><path d="M8,-10 L17,-17 M-8,-12 q-6,0 -6,-6 t6,-2" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
      return s;
    },
  };
  Object.assign(A.M, M);
  Object.assign(A.HEIGHTS, {
    burgerkitchen: 140, sodafountain: 136, fryer: 70, station: 120, shampoo: 104, towelcart: 100, haircart: 70, magazines: 60,
    cakestand: 128, giftboxes: 64, weddingcake: 120, coffeemachine: 74, wallrack: 170, fittingroom: 186, mannequin: 124, foldtable: 66, hatstand: 136,
    vignette: 60, swatches: 168, floorlamp: 130, fishtank: 150, produce: 64, scalestand: 82, crepekitchen: 170, toppingbar: 84, icecase: 66,
    dentalchair: 120, dentcabinet: 150, kidscorner: 40, aquarium: 108, stoneoven: 160, coolingrack: 128, flourbags: 64, breadtable: 74, traystand: 90,
    bucketstand: 110, paperroll: 120, ribbonrack: 70, trellis: 172, bouquettable: 84, wateringcans: 50,
  });
  // うごく ところ: いけす・すいそうの さかな、オーブンの ほのお、てっぱんの ゆげ
  const steam = (ctx, sc, f, off, x, y, z, n = 3) => { ctx.save(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2 * sc.s; for (let i = 0; i < n; i++) { const t = (G.t * 0.5 + i / n) % 1, q = sc.toScreen(IsoVenue.p(f.x + x + (i - 1) * 0.25, f.y + y, z + t * 34), off); ctx.globalAlpha = 0.55 * (1 - t); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.quadraticCurveTo(q.x + Math.sin(t * 6 + i) * 5 * sc.s, q.y - 8 * sc.s, q.x, q.y - 16 * sc.s); ctx.stroke(); } ctx.restore(); };
  Object.assign(A.L, {
    burgerkitchen(ctx, sc, f, off) { steam(ctx, sc, f, off, 0.7, 0.5, 92); },
    crepekitchen(ctx, sc, f, off) { steam(ctx, sc, f, off, 0.55, 0.5, 98, 2); },
    stoneoven(ctx, sc, f, off) { const q = sc.toScreen(IsoVenue.p(f.x + 1.5, f.y + 0.97, 52), off), s = sc.s, fl = 0.75 + Math.sin(G.t * 9) * 0.15 + Math.sin(G.t * 23) * 0.08; ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#FFB347"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 34 * s * fl, 16 * s * fl, 0, 0, 7); ctx.fill(); ctx.restore(); },
    fishtank(ctx, sc, f, off) { const s = sc.s; ctx.save(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.2 * s; for (let i = 0; i < 4; i++) { const t = (G.t * 0.45 + i * 0.27) % 1, q = sc.toScreen(IsoVenue.p(f.x + 0.4 + i * 0.7, f.y + 0.4, 72 + t * 40), off); ctx.globalAlpha = 0.7 * (1 - t); ctx.beginPath(); ctx.arc(q.x, q.y, 2.4 * s, 0, 7); ctx.stroke(); } ctx.restore(); },
    aquarium(ctx, sc, f, off) { const s = sc.s; ctx.save(); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.1 * s; for (let i = 0; i < 3; i++) { const t = (G.t * 0.5 + i * 0.33) % 1, q = sc.toScreen(IsoVenue.p(f.x + 0.3 + i * 0.25, f.y + f.d / 2, 60 + t * 36), off); ctx.globalAlpha = 0.7 * (1 - t); ctx.beginPath(); ctx.arc(q.x, q.y, 2 * s, 0, 7); ctx.stroke(); } ctx.restore(); },
  });
})();

// ---- うしろの まとまり: なかよしパズル（ゲームだい）・ころころ フルーツ（ジュースバー・ガラスの はこ）・そらの はいたつ（ロッカー・ベルト）・
// あたまの たいそう（こくばん・つくえ）・パズル こうぼう（ジグソー・さぎょうだい）・コンビニ 2つ（うしろの だい・オープンケース・くじの たな）・
// ガソリンスタンド（じどうはんばいき・タイヤ）・ゆうびんきょく（ポスト・ゆうびんうけ）----
(() => {
  const A = StoreIsoArt, SP = A.SP, G = A.GOODS, sh = A.shade, C3 = A.C3, st = A.st, txt = A.txt, icon = A.icon, img = A.img, pick = A.pick, faceS = A.faceS, T = () => IsoVenue.T;
  const steel = ["#E6EBEE", "#CBD3D8", "#B3BDC4"], dark = ["#6E747E", "#5A606A", "#4A505A"], ink3 = ["#2F3540", "#2A2F38", "#252A32"];
  const shadow = (S, f, k = 0.45) => S.ellipse(f.w / 2, f.d / 2, 0, Math.max(f.w, f.d) * k, "#00000012", 0);
  const doorS = (S, y, x0, x1, z0, z1, c) => S.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], c, 1);
  const label = (W, H, t, bg, fg = "#FFFFFF", size = 10) => `<rect x="1.5" y="1.5" width="${f2(W - 3)}" height="${f2(H - 3)}" rx="${f2(Math.min(7, H / 3))}" fill="${bg}" ${st(1.1)}/>` + txt(W / 2, H / 2 + size * 0.36, size, t, fg);
  // はこ（テープと ラベル）
  const parcel = (S, x, y, w, d, z, h, c) => S.box(x, y, w, d, z, h, C3(c), 1.1) + S.line([[x + w / 2, y + d, z], [x + w / 2, y + d, z + h], [x + w / 2, y, z + h]], "#B98A4E", 2) + S.poly([[x + w, y + d * 0.2, z + h * 0.3], [x + w, y + d * 0.55, z + h * 0.3], [x + w, y + d * 0.55, z + h * 0.7], [x + w, y + d * 0.2, z + h * 0.7]], "#FFFDF6", 0.7);
  // イーゼル（まえあし 2・うしろあし 1・うけ。f の ながい ほうに そって 前が 見える）
  const easel = (F, L, z0, z1) => { let s = F.box(L / 2 - 0.03, 0.16, 0.06, 0.06, 0, z1 - 8, C3("#A0703F"), 1); for (const u of [0.26, L - 0.32]) s += F.box(u, 0.58, 0.06, 0.06, 0, z1 - 14, C3("#B98555"), 1); return s + F.box(0.14, 0.5, L - 0.28, 0.12, z0 - 6, 6, C3("#B98555"), 1); };
  // カウンターの うえの こもの（からあげの ケース・おでん・ちゅうかまん）
  Object.assign(A.CI, {
    hotcase: () => `<rect x="-15" y="-22" width="30" height="22" rx="3" fill="#FFF6E3" ${st(1.2)}/><rect x="-15" y="-27" width="30" height="6" rx="2" fill="#E95F4B" ${st(1.1)}/>` + [-8, 0, 8].map((x, i) => `<path d="M${x - 4},-4 L${x + 4},-4 L${x + 3},-12 L${x - 3},-12 Z" fill="${pick(["#E95F4B", "#F4B63F"], i)}" ${st(0.7)}/><circle cx="${x - 1.4}" cy="-13" r="2.3" fill="#D98A2E" ${st(0.5)}/><circle cx="${x + 1.6}" cy="-13.6" r="2.3" fill="#E39A3C" ${st(0.5)}/>`).join("") + `<path d="M-12,-20 L-6,-5" stroke="#FFFFFF" stroke-width="1.6" opacity=".6"/>`,
    oden: () => `<path d="M-15,-10 L15,-10 L13,0 L-13,0 Z" fill="#B5B8BA" ${st(1.1)}/><path d="M-15,-10 L-11,-15 L11,-15 L15,-10 Z" fill="#E6B96E" ${st(1)}/><path d="M-4,-15 L-5,-10 M4,-15 L5,-10" stroke="${INK}" stroke-width=".7"/><ellipse cx="-9" cy="-12.6" rx="3" ry="1.6" fill="#FFF3CF"/><ellipse cx="0" cy="-12.6" rx="2.6" ry="1.6" fill="#FFFFFF"/><circle cx="0" cy="-12.6" r="1" fill="#FFD54F"/><path d="M7,-11 L9,-14 L11,-11 Z" fill="#9EA3A8"/><path d="M-6,-18 c-3,-3 3,-5 0,-8 M3,-18 c-3,-3 3,-5 0,-8" fill="none" stroke="#C9D3D8" stroke-width="1.4" stroke-linecap="round"/>`,
    steamer: () => `<rect x="-13" y="-24" width="26" height="24" rx="3" fill="#FFF8F0" ${st(1.2)}/><path d="M-13,-12 h26" stroke="${INK}" stroke-width=".8"/>` + [[-6, -13], [3, -13], [-2, -1], [7, -1]].map(([x, y]) => `<path d="M${x - 4},${y} Q${x - 4},${y - 7} ${x},${y - 7} Q${x + 4},${y - 7} ${x + 4},${y} Z" fill="#FFFFFF" ${st(0.8)}/>`).join("") + `<rect x="-13" y="-28" width="26" height="5" rx="2" fill="#E86F3A" ${st(1)}/>`,
  });
  // きょうしつの え（まちがい さがし・2まい）
  const spotPic = (W, H, odd) => `<rect width="${f2(W)}" height="${f2(H)}" fill="#CFEAF8"/><rect y="${f2(H * 0.62)}" width="${f2(W)}" height="${f2(H * 0.38)}" fill="#A9D88A"/><circle cx="${f2(W * 0.78)}" cy="${f2(H * 0.2)}" r="${f2(H * 0.1)}" fill="${odd ? "#F28B82" : "#F6D47A"}" ${st(0.8)}/><path d="M${f2(W * 0.18)},${f2(H * 0.62)} V${f2(H * 0.4)} L${f2(W * 0.36)},${f2(H * 0.26)} L${f2(W * 0.54)},${f2(H * 0.4)} V${f2(H * 0.62)} Z" fill="#FFF3D6" ${st(0.8)}/><path d="M${f2(W * 0.14)},${f2(H * 0.42)} L${f2(W * 0.36)},${f2(H * 0.22)} L${f2(W * 0.58)},${f2(H * 0.42)}" fill="#E8848C" ${st(0.8)}/>` + (odd ? "" : `<rect x="${f2(W * 0.3)}" y="${f2(H * 0.44)}" width="${f2(W * 0.12)}" height="${f2(H * 0.1)}" fill="#8EC5F4" ${st(0.6)}/>`) + `<circle cx="${f2(W * 0.8)}" cy="${f2(H * 0.6)}" r="${f2(H * 0.12)}" fill="#7DB06A" ${st(0.8)}/><path d="M${f2(W * 0.8)},${f2(H * 0.72)} V${f2(H * 0.84)}" stroke="#8A6A4A" stroke-width="2"/>`;
  const KUJI = { lawson: { col: "#4A8CC9", bg: "#DDEBF6", ids: ["kj_law_b", "kj_law_a", "kj_law_c"] }, sevenbun: { col: "#F4A13A", bg: "#FCEFE3", ids: ["kj_sev_c", "kj_sev_a", "kj_sev_b"] } };
  // くじの たな（レジの みぎ。うえに ビッグ ぬいぐるみ A・B・C・まんなかに マグと アクリル スタンド・したに シールと ちいさな けいひん）
  const kujiShelf = (S, f, store) => {
    const F = A.frame(S, f), L = F.L, k = KUJI[store], H = 170;
    let s = F.poly([[0.04, 0.03, 0], [L - 0.04, 0.03, 0], [L - 0.04, 0.03, H], [0.04, 0.03, H]], k.bg, 1.2) + F.box(0.02, 0, 0.08, 0.66, 0, H, C3("#FFFFFF"));
    s += F.box(0.06, 0, L - 0.12, 0.66, 0, 34, C3("#FFFFFF")) + F.rect(0.665, 0.14, L - 0.14, 6, 28, k.bg, 1);
    for (let i = 0; i < 7; i++) s += F.at(0.3 + (i * (L - 0.6)) / 6, 0.5, 34, SP.card(pick(["#FFE08A", "#F7B6C8", "#A8D5BA", "#A8C4E8"], i)));
    s += F.box(0.06, 0, L - 0.12, 0.6, 70, 4, C3("#FFFFFF"));
    for (let i = 0; i < 6; i++) s += F.at(0.3 + (i * (L - 0.6)) / 5, 0.42, 74, i % 2 ? SP.mug(i % 4 === 1 ? k.col : "#FFFFFF") : `<rect x="-5" y="-17" width="10" height="15" rx="2" fill="#FFFFFF" fill-opacity=".75" ${st(0.9)}/><circle cx="0" cy="-11" r="3.4" fill="${pick(["#F2C6D8", "#FADA78", "#C8DEEF"], i)}" ${st(0.6)}/><rect x="-6" y="-3" width="12" height="3" rx="1" fill="${k.col}" ${st(0.7)}/>`);
    s += F.box(0.06, 0, L - 0.12, 0.6, 108, 4, C3("#FFFFFF"));
    k.ids.forEach((id, i) => { const svg = typeof KujiArt !== "undefined" ? KujiArt.plush(id) : "", w = i === 1 ? 46 : 38; if (svg) s += F.at(L * (0.2 + i * 0.3), 0.36, 112, img(svg, -w / 2, -w * 1.08, w, w * 1.08)); s += F.front(0.605, L * (0.2 + i * 0.3) - 0.14, L * (0.2 + i * 0.3) + 0.14, 100, 110, label(0.28 * T(), 10, ["B", "A", "C"][i] + "しょう", k.col, "#FFFFFF", 6.5)); });
    s += F.box(L - 0.1, 0, 0.08, 0.66, 0, H, C3("#FFFFFF"));
    s += F.box(0, -0.02, L, 0.5, H, 26, C3(k.col)) + F.front(0.48, 0.12, L - 0.12, H + 2, H + 24, txt((L - 0.24) * T() / 2, 15, 13, "いちばんくじ", "#FFFFFF", `stroke="${INK}" stroke-width="2.4" paint-order="stroke"`) + txt((L - 0.24) * T() / 2, 21.5, 5.5, "1かい 1000コイン", "#FFFFFF"));
    return s;
  };
  const M = {
    // ---- なかよしパズル ----
    // パズルの ゲームだい（1マスに 1だい。がめん・レバー・ボタン・うえの かんばん）
    puzzlecab(S, f) {
      const F = A.frame(S, f), n = Math.max(1, Math.round(F.L)), cols = ["#F28BB2", "#8EC5F4", "#F6D47A", "#9CD3A8"], off = f.variant === "b" ? 2 : 0;
      const screen = (i) => { const W = 0.7 * T(); let g = `<rect width="${f2(W)}" height="54" rx="3" fill="#2B2F4A"/>` + txt(W / 2, 9, 6.5, "スコア 1200", "#F6D47A"); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g += `<circle cx="${f2(6 + c * ((W - 12) / 3))}" cy="${f2(18 + r * 10)}" r="3.6" fill="${pick(cols, r * 3 + c * 2 + i)}" stroke="#FFFFFF" stroke-width=".6"/>`; return g + `<path d="M6,18 L${f2(6 + (W - 12) / 3)},28 L${f2(6 + (2 * (W - 12)) / 3)},28" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`; };
      let s = "";
      for (let i = 0; i < n; i++) {
        const u = i + 0.08, c = pick(cols, i + off);
        s += F.box(u, 0.08, 0.84, 0.56, 0, 74, C3(sh(c, 0.12))) + F.rect(0.644, u + 0.14, u + 0.7, 14, 58, sh(c, 0.32), 1) + F.front(0.646, u + 0.3, u + 0.54, 30, 44, `<rect width="${f2(0.24 * T())}" height="14" rx="2" fill="#3F4650"/><rect x="${f2(0.12 * T() - 1.4)}" y="3" width="2.8" height="8" rx="1" fill="#F6D47A"/>`);
        s += F.box(u - 0.02, 0.36, 0.88, 0.56, 74, 7, C3(sh(c, -0.05)));
        s += F.box(u, 0.08, 0.84, 0.34, 81, 76, C3(c)) + F.front(0.425, u + 0.07, u + 0.77, 92, 146, screen(i));
        s += F.box(u - 0.02, 0.04, 0.88, 0.44, 157, 22, C3(sh(c, -0.25))) + F.front(0.485, u + 0.04, u + 0.8, 159, 177, label(0.76 * T(), 18, "パズル", "#FFF7D9", INK, 9.5));
        s += F.at(u + 0.26, 0.66, 81, `<rect x="-1.2" y="-10" width="2.4" height="10" fill="#55606A"/><circle cy="-11" r="3.4" fill="#E8545E" ${st(1)}/>`) + F.at(u + 0.56, 0.62, 81, [0, 1, 2].map((k) => `<ellipse cx="${k * 5 - 5}" cy="${f2(-1.5 + k * 1.2)}" rx="2.4" ry="1.4" fill="${pick(["#F6D47A", "#8EC5F4", "#8FD19E"], k)}" ${st(0.8)}/>`).join(""));
      }
      return s;
    },
    // トロフィーの だい（ゆうしょう）
    trophy(S, f) {
      let s = shadow(S, f, 0.36) + S.box(0.18, 0.2, 0.64, 0.6, 0, 58, C3("#9C8CD6")) + S.box(0.14, 0.16, 0.72, 0.68, 58, 5, C3("#F6EEDF"));
      s += faceS(S, 0.28, 0.72, 0.805, 18, 40, label(0.44 * T(), 22, "ゆうしょう", "#F6D47A", INK, 8));
      return s + S.at(0.3, 0.32, 63, SP.trophy("#C9CED3"), 1.4) + S.at(0.5, 0.5, 63, SP.trophy("#F3C24F"), 2.4) + S.at(0.72, 0.7, 63, SP.trophy("#D99A5E"), 1.4);
    },
    // あめの びん（ひくい だい）
    candyjar(S, f) {
      let s = shadow(S, f, 0.36) + S.box(0.12, 0.16, 0.76, 0.68, 0, 40, C3(f.col || "#B9A6E0")) + doorS(S, 0.84, 0.18, 0.82, 8, 32, sh(f.col || "#B9A6E0", 0.15));
      [[0.3, 0.38, "#F28B82"], [0.66, 0.4, "#8FD19E"], [0.48, 0.66, "#F6D47A"]].forEach(([x, y, c], k) => {
        s += S.cyl(x, y, 0.13, 40, 24, ["#EAF6FA", "#D7EEF5"], 1.1) + S.at(x, y, 42, [...Array(5)].map((_, i) => `<circle cx="${(i % 3) * 4 - 4}" cy="${-3 - Math.floor(i / 3) * 4 - (i % 2)}" r="2.2" fill="${pick([c, "#FFFFFF", "#F2A7D0", "#8EC5F4"], i + k)}" stroke="${INK}" stroke-width=".5"/>`).join("")) + S.cyl(x, y, 0.14, 64, 5, [sh(c, 0.2), c], 1);
      });
      return s;
    },
    // パズルの テーブル（balls: つなぐ たま・cards: カード あわせ・jigsaw: ジグソー）と いす
    puzzletable(S, f) {
      const W = f.w, D = f.d, v = f.variant || "balls", top = f.wood || "#E8D8B8";
      const stool = (x, y, c) => S.cyl(x, y, 0.05, 0, 30, ["#9AA1AC", "#868D98"]) + S.cyl(x, y, 0.2, 30, 7, [c, sh(c, -0.15)]);
      let s = S.ellipse(W / 2, D / 2, 0, Math.min(W, D) * 0.48, "#00000012", 0) + stool(0.32, 0.3, "#F28BB2") + stool(W - 0.32, 0.3, "#8EC5F4");
      for (const [x, y] of [[0.42, 0.62], [W - 0.5, 0.62], [0.42, D - 0.46], [W - 0.5, D - 0.46]]) s += S.box(x, y, 0.08, 0.08, 0, 50, C3(sh(top, -0.3)), 1);
      s += S.box(0.36, 0.56, W - 0.72, D - 0.92, 50, 6, C3(top));
      const x0 = 0.5, y0 = 0.68, x1 = W - 0.5, y1 = D - 0.48, z = 56.5, q = (a, b, c, d, col, w = 0.8) => S.poly([[a, b, z + 0.4], [c, b, z + 0.4], [c, d, z + 0.4], [a, d, z + 0.4]], col, w);
      s += q(x0, y0, x1, y1, v === "cards" ? "#E3DAF5" : v === "jigsaw" ? "#F3E6CC" : "#FFFDF6", 1.1);
      if (v === "cards") { const n = 4, m = 3, cw = (x1 - x0 - 0.1) / n, ch = (y1 - y0 - 0.1) / m; for (let i = 0; i < n; i++) for (let k = 0; k < m; k++) { const a = x0 + 0.05 + i * cw, b = y0 + 0.05 + k * ch, up = (i + k * 2) % 5 === 1; s += q(a + 0.02, b + 0.02, a + cw - 0.02, b + ch - 0.02, up ? "#FFFFFF" : "#9C8CD6"); if (up) s += S.at(a + cw / 2, b + ch / 2, z + 0.5, SP.fruit(pick(["#E8545E", "#F7A43A"], i)), 0.7); } }
      else if (v === "jigsaw") { s += q(x0 + 0.08, y0 + 0.08, x0 + (x1 - x0) * 0.62, y1 - 0.08, "#BFE3F7") + q(x0 + 0.08, y0 + (y1 - y0) * 0.55, x0 + (x1 - x0) * 0.62, y1 - 0.08, "#A9D88A"); for (let i = 0; i < 5; i++) s += S.at(x0 + (x1 - x0) * (0.7 + (i % 2) * 0.14), y0 + 0.15 + i * ((y1 - y0 - 0.3) / 4), z + 0.5, SP.puzzle(pick(["#BFE3F7", "#A9D88A", "#F6D47A", "#F28B82"], i)), 0.7); }
      else { const n = 5, m = 4, cs = ["#F28BB2", "#8EC5F4", "#F6D47A", "#9CD3A8"]; for (let i = 0; i < n; i++) for (let k = 0; k < m; k++) s += S.ellipse(x0 + 0.1 + (i * (x1 - x0 - 0.2)) / (n - 1), y0 + 0.1 + (k * (y1 - y0 - 0.2)) / (m - 1), z + 0.6, 0.07, pick(cs, i * 2 + k * 3), 0.8); s += S.line([[x0 + 0.1, y0 + 0.1, z + 1], [x0 + 0.1 + (x1 - x0 - 0.2) / 4, y0 + 0.1 + (y1 - y0 - 0.2) / 3, z + 1], [x0 + 0.1 + (x1 - x0 - 0.2) / 2, y0 + 0.1 + (y1 - y0 - 0.2) / 3, z + 1]], "#E8545E", 2); }
      return s + stool(W - 0.36, D - 0.18, "#F6D47A");
    },
    // ---- ころころ フルーツ ----
    // フルーツ ジュースの だい（ジューサー・くだものの はこ・カップ・シロップの たな）
    juicebar(S, f) {
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.86, 0, 84, ["#FBEBD6", "#EED7BA", "#E0C6A2"]);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.96, 0.12 + i * 0.95, 0.94 + i * 0.95, 12, 72, "#F8E2C8");
      s += S.box(0, 0.06, f.w, 0.92, 84, 5, ["#FFFFFF", "#E6E1D7", "#D2CCC0"]);
      [[0.4, "#F7A43A"], [0.95, "#E8545E"]].forEach(([x, c]) => { s += S.box(x - 0.18, 0.3, 0.36, 0.36, 89, 16, dark) + S.cyl(x, 0.48, 0.13, 105, 20, [sh(c, 0.15), c], 0.8) + S.cyl(x, 0.48, 0.15, 105, 30, ["#EAF6FA66", "#D7EEF588"], 1.1) + S.cyl(x, 0.48, 0.15, 135, 6, ["#9AA1AC", "#868D98"]); });
      s += S.box(1.4, 0.24, 0.72, 0.5, 89, 14, C3("#C99A6B"));
      for (let i = 0; i < 6; i++) s += S.at(1.52 + (i % 3) * 0.24, 0.36 + Math.floor(i / 3) * 0.24, 103, G.fruit(i), 0.95);
      for (let i = 0; i < 4; i++) s += S.at(2.32 + (i % 2) * 0.28, 0.42 + Math.floor(i / 2) * 0.26, 89, SP.cup(pick(["#F7A43A", "#E8545E", "#F6D35A", "#9CCB62"], i)));
      s += S.box(0.1, 0.1, f.w - 0.2, 0.36, 146, 5, C3("#D9A06A"));
      for (let i = 0; i < 7; i++) s += S.at(0.3 + i * 0.4, 0.28, 151, SP.bottle(pick(["#F7A43A", "#E8545E", "#F6D35A", "#9CCB62", "#C9A2D6"], i), "#FFFFFF"));
      return s;
    },
    // くだものの かご（3だん）
    fruitbasket(S, f) {
      let s = shadow(S, f, 0.34);
      for (const [x, y] of [[0.2, 0.2], [0.76, 0.2], [0.2, 0.76], [0.76, 0.76]]) s += S.box(x, y, 0.05, 0.05, 0, 100, ["#B98457", "#A0703F", "#8E6236"], 0.9);
      [10, 44, 78].forEach((z, k) => { s += S.box(0.18, 0.18, 0.64, 0.64, z, 12, C3("#D9B37E"), 1.1) + S.line([[0.18, 0.82, z + 6], [0.82, 0.82, z + 6], [0.82, 0.18, z + 6]], "#B98A4E", 1); for (let i = 0; i < 5; i++) s += S.at(0.3 + (i % 3) * 0.2, 0.36 + Math.floor(i / 3) * 0.26, z + 12, SP.fruit(pick([["#E8545E", "#F7A43A", "#F6D35A"], ["#9CCB62", "#E8545E", "#B4659C"], ["#F7A43A", "#F6D35A", "#E8545E"]][k], i)), 0.95); });
      return s;
    },
    // ころころ パズルの ガラスの はこ（うえが あいた はこに 3人の かおの 玉と くだもの・あかい てんせん・うえの つぎの くだもの）
    fruitbox(S, f) {
      const F = A.frame(S, f), L = F.L, R = [6, 7.5, 9, 11, 13, 15, 18, 21], Z0 = 16, Z1 = 108, wood = "#C98E5A", rim = "#E8853A";
      const ball = (t, u, z) => { const r = R[t], svg = typeof KorokoroArt !== "undefined" ? KorokoroArt.svg(t, "normal", r * 2) : ""; return svg ? F.at(u, 0.52, z + r, img(svg, -r, -r, r * 2, r * 2)) : ""; };
      const post = (u, v) => F.box(u, v, 0.06, 0.06, Z0, Z1 - Z0, C3(wood), 1);
      let s = F.box(0.04, 0.1, L - 0.08, 0.82, 0, Z0, C3(wood)) + F.rect(0.922, 0.12, L - 0.12, 6, Z0 - 6, "#E9B27A", 1);
      s += F.poly([[0.1, 0.17, Z0], [L - 0.1, 0.17, Z0], [L - 0.1, 0.17, Z1], [0.1, 0.17, Z1]], "#FFF8EA", 1.1) + F.poly([[0.1, 0.17, Z0 + 0.5], [L - 0.1, 0.17, Z0 + 0.5], [L - 0.1, 0.87, Z0 + 0.5], [0.1, 0.87, Z0 + 0.5]], "#E8C08E", 1);
      s += post(0.06, 0.12) + post(L - 0.12, 0.12) + F.box(0.06, 0.12, L - 0.12, 0.06, Z1 - 4, 4, C3(rim), 1);
      const lay = L >= 2 ? [[7, 0.62, 0], [6, 1.46, 0], [5, 0.42, 42], [4, 1.1, 34], [3, 1.7, 36], [1, 1.36, 58], [0, 0.86, 60]] : [[5, 0.5, 0], [2, 0.24, 26], [1, 0.78, 24], [0, 0.52, 30]];
      for (const [t, u, z] of lay) s += ball(t, L >= 2 ? (u * L) / 2 : u, Z0 + 1 + z);
      s += S.line([F.P(0.12, 0.87, Z1 - 14), F.P(L - 0.12, 0.87, Z1 - 14)], "#E8453C", 2.2, 'stroke-dasharray="5 4"');
      s += F.rect(0.87, 0.1, L - 0.1, Z0, Z1, "#E6F6FB30", 1.3) + F.poly([[0.26, 0.875, Z0 + 10], [0.42, 0.875, Z0 + 10], [0.3, 0.875, Z1 - 10], [0.14, 0.875, Z1 - 10]], "#FFFFFF66", 0);
      s += post(0.06, 0.84) + post(L - 0.12, 0.84) + F.box(0.06, 0.84, L - 0.12, 0.06, Z1 - 4, 4, C3(rim), 1);
      for (const u of [0.06, L - 0.12]) s += F.box(u, 0.12, 0.06, 0.78, Z1 - 4, 4, C3(rim), 1);
      s += S.line([F.P(0.16, 0.52, Z1 + 30), F.P(L - 0.16, 0.52, Z1 + 30)], "#9AA1AC", 2.4) + F.box(L * 0.58 - 0.08, 0.44, 0.16, 0.16, Z1 + 22, 10, C3("#E8453C"), 1) + ball(1, L * 0.58, Z1 + 4);
      return s;
    },
    // ---- そらの はいたつ ----
    // にもつの やま
    parcelstack(S, f) {
      let s = shadow(S, f, 0.36);
      [[0.12, 0.14, 0.46, 0.4, 0, 28, "#D9B37E"], [0.18, 0.18, 0.36, 0.32, 28, 20, "#E3C391"], [0.24, 0.22, 0.24, 0.22, 48, 14, "#CFA571"], [0.6, 0.18, 0.3, 0.34, 0, 22, "#E3C391"], [0.2, 0.58, 0.36, 0.3, 0, 18, "#CFA571"], [0.6, 0.6, 0.26, 0.26, 0, 14, "#D9B37E"]].forEach(([x, y, w, d, z, h, c]) => { s += parcel(S, x, y, w, d, z, h, c); });
      return s;
    },
    // はいたつ ロッカー（とびら・がめんと ボタン）
    lockers(S, f) {
      const F = A.frame(S, f), L = F.L, H = 168, c = f.col || "#7FA7C9", cols = Math.round(L * 3), rows = 5, du = (L - 0.2) / cols, dz = (H - 20) / rows, mid = Math.floor(cols / 2);
      let s = F.box(0.04, 0.06, L - 0.08, 0.62, 0, H, C3(sh(c, 0.2)));
      for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
        if (i === mid && (k === 2 || k === 3)) continue;
        const u0 = 0.1 + i * du, z0 = 10 + k * dz;
        s += F.rect(0.684, u0 + 0.02, u0 + du - 0.02, z0 + 2, z0 + dz - 2, pick(["#EEF3F7", "#E2EAF1"], i + k), 1) + F.rect(0.688, u0 + du - 0.11, u0 + du - 0.07, z0 + dz / 2 - 5, z0 + dz / 2 + 5, "#8C98A2", 0.7);
      }
      const um = 0.1 + mid * du;
      s += F.rect(0.684, um + 0.02, um + du - 0.02, 10 + 2 * dz + 2, 10 + 4 * dz - 2, "#3F4650", 1.2) + F.rect(0.688, um + 0.06, um + du - 0.06, 10 + 3 * dz + 4, 10 + 4 * dz - 8, "#9FD7E0", 0.8);
      s += F.front(0.69, um + 0.07, um + du - 0.07, 10 + 2 * dz + 6, 10 + 3 * dz - 2, [...Array(9)].map((_, i) => `<rect x="${f2(2 + (i % 3) * ((du - 0.14) * T() / 3))}" y="${2 + Math.floor(i / 3) * 7}" width="${f2((du - 0.14) * T() / 3 - 3)}" height="5" rx="1" fill="${i === 8 ? "#8FD19E" : "#E6EBEE"}"/>`).join(""));
      return s + F.box(0, 0.02, L, 0.7, H, 8, C3(sh(c, -0.1)));
    },
    // にもつの ベルト（ローラー・にもつ・スキャナーの アーチ）
    conveyor(S, f) {
      const F = A.frame(S, f), L = F.L, ua = L * 0.62;
      let s = "";
      for (const u of [0.2, L / 2, L - 0.28]) s += F.box(u, 0.22, 0.08, 0.08, 0, 58, C3("#9AA6AE"), 1);
      s += F.box(ua, 0.08, 0.1, 0.1, 58, 70, C3("#7FA7C9"), 1);
      for (const u of [0.2, L / 2, L - 0.28]) s += F.box(u, 0.7, 0.08, 0.08, 0, 58, C3("#9AA6AE"), 1);
      s += F.box(0.06, 0.16, L - 0.12, 0.68, 58, 10, C3("#B3BDC4")) + F.poly([[0.1, 0.22, 68.5], [L - 0.1, 0.22, 68.5], [L - 0.1, 0.78, 68.5], [0.1, 0.78, 68.5]], "#4E545C", 1.1);
      for (let u = 0.18; u < L - 0.12; u += 0.2) s += S.line([F.P(u, 0.24, 69), F.P(u, 0.76, 69)], "#6E747E", 1.2);
      [[0.3, 0.32, 0.42, 0.36, 22, "#D9B37E"], [1.1, 0.3, 0.34, 0.4, 16, "#E3C391"], [1.72, 0.34, 0.44, 0.32, 26, "#CFA571"], [2.4, 0.3, 0.3, 0.38, 14, "#D9B37E"]].forEach(([u, v, lu, lv, h, c]) => { if (u + lu < L - 0.08) { const p = F.P(u, v, 69), q = F.P(u + lu, v + lv, 69); s += parcel(S, Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1]), 69, h, c); } });
      s += F.box(ua, 0.82, 0.1, 0.1, 58, 70, C3("#7FA7C9"), 1) + F.box(ua - 0.02, 0.06, 0.14, 0.88, 128, 10, C3("#5D8FB8")) + F.at(ua + 0.07, 0.5, 128, `<circle r="3" fill="#E8453C" ${st(0.8)}/><path d="M-8,4 L0,16 L8,4" fill="#E8453C" opacity=".18"/>`);
      return s;
    },
    // しわけ コーナー（おくに こべやの たな・テーブルに にもつと てがみ・ハンディ スキャナー）
    sortingtable(S, f) {
      const W = f.w, D = f.d, wood = "#C9A16E", rows = 3, cols = Math.round(W * 2.5), du = (W - 0.36) / cols;
      let s = S.ellipse(W / 2, D / 2, 0, Math.min(W, D) * 0.5, "#00000012", 0) + S.box(0.1, 0.08, W - 0.2, 0.5, 0, 150, C3(sh(wood, 0.15)));
      for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) { const x = 0.18 + i * du, z0 = 72 + k * 24; s += S.poly([[x + 0.02, 0.582, z0 + 2], [x + du - 0.02, 0.582, z0 + 2], [x + du - 0.02, 0.582, z0 + 21], [x + 0.02, 0.582, z0 + 21]], "#6E5A44", 0.9); if ((i + k) % 3 !== 2) s += S.at(x + du / 2, 0.52, z0 + 3, (i + k) % 2 ? SP.letter(pick(["#FFFFFF", "#FFF3D6", "#E8F2FA"], i)) : `<rect x="-5" y="-12" width="10" height="12" fill="${pick(["#F28B82", "#8EC5F4", "#F6D47A", "#8FD19E"], i + k)}" ${st(0.7)}/>`, 0.8); }
      for (const [x, y] of [[0.2, 0.7], [W - 0.28, 0.7], [0.2, D - 0.24], [W - 0.28, D - 0.24]]) s += S.box(x, y, 0.08, 0.08, 0, 64, C3("#9AA6AE"), 1);
      s += S.box(0.1, 0.62, W - 0.2, D - 0.76, 64, 6, C3(wood));
      s += parcel(S, 0.3, 0.8, 0.4, 0.34, 70, 18, "#D9B37E") + parcel(S, 0.86, 0.92, 0.3, 0.3, 70, 14, "#E3C391") + S.at(W - 0.5, 1.2, 70, SP.letter("#FBE3EA") + `<g transform="translate(6 3)">${SP.letter()}</g>`) + S.at(0.6, D - 0.5, 70, `<path d="M-6,0 L-3,-12 L3,-12 L6,-6 L2,0 Z" fill="#F6D47A" ${st(1)}/><rect x="-2" y="-11" width="4" height="3" fill="#E8453C"/>`);
      return s;
    },
    // ひこうきの もけい（スタンド）
    planemodel(S, f) {
      return shadow(S, f, 0.3) + S.cyl(0.5, 0.5, 0.24, 0, 8, ["#5D8FB8", "#4C7395"]) + S.cyl(0.5, 0.5, 0.03, 8, 84, ["#B9BEC4", "#9FA5AB"]) + S.at(0.5, 0.5, 96, `<g transform="rotate(-14)"><path d="M-2,3 L-10,14 L-3,14 L8,3 Z" fill="#7FB3E0" ${st(1)}/><path d="M-26,0 Q-22,-6 -10,-6 L18,-6 Q28,-6 30,0 Q28,4 18,4 L-10,4 Q-22,4 -26,0 Z" fill="#FFFFFF" ${st(1.1)}/><path d="M-2,-5 L-12,-20 L-4,-20 L8,-5 Z" fill="#8EC5F4" ${st(1)}/><path d="M-24,-1 L-30,-14 L-24,-14 L-16,-3 Z" fill="#8EC5F4" ${st(1)}/>${[0, 1, 2, 3].map((i) => `<circle cx="${-6 + i * 6}" cy="-2" r="1.3" fill="#8EC5F4"/>`).join("")}<path d="M-18,1.6 H22" stroke="#5D8FB8" stroke-width="1.6"/></g>`, 1.1);
    },
    // ---- あたまの たいそう ----
    // こくばん（キャスターの ついた たて がた）
    chalkboard(S, f) {
      const F = A.frame(S, f), L = F.L, H = 160, W = (L - 0.4) * T(), Hh = H - 68;
      let s = "";
      for (const u of [0.25, L - 0.31]) s += F.box(u, 0.3, 0.06, 0.4, 0, 6, C3("#8C8890"), 1) + F.box(u, 0.46, 0.06, 0.06, 6, 52, C3("#B98555"), 1);
      s += F.box(0.12, 0.42, L - 0.24, 0.14, 52, H - 52, C3("#B98555"));
      s += F.front(0.565, 0.2, L - 0.2, 60, H - 8, `<rect width="${f2(W)}" height="${Hh}" rx="3" fill="#3E6B57"/>` + txt(W * 0.28, 30, 15, "1 + 2 = ?", "#FFFFFF") + txt(W * 0.76, 30, 14, "○ △ □", "#FFE48A") + `<path d="M${f2(W * 0.12)},${Hh - 28} q${f2(W * 0.12)},-16 ${f2(W * 0.24)},0 t${f2(W * 0.24)},0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>` + txt(W * 0.74, Hh - 16, 10, "きょうの もんだい", "#FFFFFF"));
      s += F.box(0.16, 0.56, L - 0.32, 0.1, 58, 4, C3("#D9C7A6")) + F.at(0.7, 0.62, 62, `<rect x="-6" y="-2.4" width="10" height="2.4" rx="1" fill="#FFFFFF" ${st(0.6)}/><rect x="6" y="-2.4" width="8" height="2.4" rx="1" fill="#F7D56A" ${st(0.6)}/>`);
      return s;
    },
    // かんがえる つくえ（ふたつ・いす・ほんと えんぴつ）
    desks(S, f) {
      const W = f.w, n = Math.max(1, Math.round(W));
      let s = "";
      const desk = (x) => { let t = ""; for (const [dx, dy] of [[0.06, 0.34], [0.62, 0.34], [0.06, 0.72], [0.62, 0.72]]) t += S.box(x + dx, dy, 0.05, 0.05, 0, 50, C3("#9AA1AC"), 0.9); return t + S.box(x, 0.28, 0.74, 0.54, 50, 5, C3("#D9A066")) + S.at(x + 0.26, 0.52, 55, `<path d="M-9,-2 L0,-5 L9,-2 L9,1 L0,-2 L-9,1 Z" fill="#FFFDF6" ${st(1)}/><path d="M0,-5 V-2" stroke="${INK}" stroke-width=".8"/>`) + S.at(x + 0.54, 0.58, 55, `<path d="M-6,2 L6,-4" stroke="#E57373" stroke-width="2.6" stroke-linecap="round"/><path d="M6,-4 l2,-1" stroke="#F6D47A" stroke-width="2.6"/>`); };
      const chair = (x, c) => { let t = ""; for (const [dx, dy] of [[0.2, 1.1], [0.52, 1.1], [0.2, 1.4], [0.52, 1.4]]) t += S.box(x + dx, dy, 0.04, 0.04, 0, 30, C3("#9AA1AC"), 0.8); return t + S.box(x + 0.16, 1.06, 0.44, 0.4, 30, 5, C3(c)) + S.box(x + 0.16, 1.42, 0.44, 0.06, 35, 30, C3(c)); };
      for (let i = 0; i < n; i++) s += desk(0.12 + i);
      for (let i = 0; i < n; i++) s += chair(0.12 + i, pick(["#8EC5F4", "#F28B82"], i));
      return s;
    },
    // まちがい さがしの え（イーゼルに 2まい）
    spotboard(S, f) {
      const F = A.frame(S, f), L = F.L, W = (L - 0.36) * T(), Hh = 82, pw = (W - 12) / 2;
      let s = easel(F, L, 50, 150) + F.box(0.12, 0.46, L - 0.24, 0.06, 50, 94, C3("#FFFDF6"), 1.2);
      s += F.front(0.525, 0.18, L - 0.18, 56, 138, `<rect width="${f2(W)}" height="${Hh}" fill="#FFFDF6"/><g transform="translate(4 14)">${spotPic(pw, Hh - 20, false)}</g><g transform="translate(${f2(8 + pw)} 14)">${spotPic(pw, Hh - 20, true)}</g><circle cx="${f2(8 + pw + pw * 0.78)}" cy="${f2(14 + (Hh - 20) * 0.2)}" r="${f2((Hh - 20) * 0.16)}" fill="none" stroke="#E53935" stroke-width="2.4"/>` + txt(W / 2, 10, 8, "ちがう ところは どこ？"));
      return s;
    },
    // ちきゅうぎ
    globe(S, f) {
      return shadow(S, f, 0.3) + S.cyl(0.5, 0.5, 0.22, 0, 8, ["#B98555", "#A0703F"]) + S.cyl(0.5, 0.5, 0.03, 8, 40, ["#C9A16E", "#B08A58"]) + S.at(0.5, 0.5, 48, `<path d="M-22,-24 A26,26 0 1 0 18,-40" fill="none" stroke="#C9A16E" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-28" r="20" fill="#8FC3DF" ${st(1.3)}/><path d="M-12,-36 q6,-6 12,-2 t8,8 q-4,6 -12,3 Z M-16,-24 q4,2 5,8 q-4,2 -6,-2 Z M6,-18 q6,-2 9,2 q-2,4 -8,3 Z" fill="#9CCB86" ${st(0.8)}/><ellipse cx="-7" cy="-36" rx="4" ry="2.4" fill="#FFFFFF" opacity=".6"/>`);
    },
    // ---- パズル こうぼう ----
    // スライド パズルの がく（イーゼル・1〜8 の いた）
    slideframe(S, f) {
      const F = A.frame(S, f), L = F.L, TILE = ["#F2C14E", "#E57373", "#64B5F6", "#81C784", "#BA68C8", "#FFB74D", "#4DB6AC", "#F48FB1"], W = (L - 0.32) * T(), Hh = 80, tw = (W - 8) / 3, th = (Hh - 8) / 3;
      let s = easel(F, L, 46, 148) + F.box(0.1, 0.46, L - 0.2, 0.08, 46, 98, C3("#B98555"), 1.2);
      s += F.front(0.545, 0.16, L - 0.16, 54, 136, `<rect width="${f2(W)}" height="${Hh}" rx="3" fill="#7A5638"/>` + TILE.map((c, i) => `<rect x="${f2(4 + (i % 3) * tw + 1)}" y="${f2(4 + Math.floor(i / 3) * th + 1)}" width="${f2(tw - 2)}" height="${f2(th - 2)}" rx="3" fill="${c}" ${st(0.8)}/>` + txt(4 + (i % 3) * tw + tw / 2, 4 + Math.floor(i / 3) * th + th / 2 + 4.5, 12, i + 1, "#FFFFFF")).join(""));
      return s;
    },
    // ジグソーの かべ（かべに たてかけた え・まだ ない ピース・てまえの だいに ばらばらの ピース）
    jigsawwall(S, f) {
      const F = A.frame(S, f), L = F.L, W = (L - 0.36) * T(), Hh = 116, pic = typeof KoboArt !== "undefined" ? KoboArt.picSvg("friends") : "", cw = W / 5, ch = Hh / 4;
      let s = F.box(0.1, 0.04, L - 0.2, 0.14, 40, 132, C3("#B98555"), 1.3);
      let g = `<rect width="${f2(W)}" height="${Hh}" fill="#BFE3F7"/>` + (pic ? `<image href="${U.svgUrl(pic)}" width="${f2(W)}" height="${Hh}" preserveAspectRatio="xMidYMid slice"/>` : "");
      for (const [i, k] of [[4, 0], [3, 0], [4, 1], [0, 3]]) g += `<rect x="${f2(i * cw)}" y="${f2(k * ch)}" width="${f2(cw)}" height="${f2(ch)}" fill="#E9D7B8" stroke="#B98555" stroke-width="1" stroke-dasharray="3 2"/>`;
      for (let i = 1; i < 5; i++) g += `<path d="M${f2(i * cw)},0 V${Hh}" stroke="#FFFFFF" stroke-width="1" opacity=".7"/>`;
      for (let k = 1; k < 4; k++) g += `<path d="M0,${f2(k * ch)} H${f2(W)}" stroke="#FFFFFF" stroke-width="1" opacity=".7"/>`;
      for (let i = 1; i < 5; i++) for (let k = 0; k < 4; k++) g += `<circle cx="${f2(i * cw + (k % 2 ? 2 : -2))}" cy="${f2(k * ch + ch / 2)}" r="2.6" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".7"/>`;
      s += F.front(0.185, 0.18, L - 0.18, 48, 164, g);
      s += F.box(0.2, 0.32, L - 0.4, 0.6, 0, 36, C3("#D9A066"));
      for (let i = 0; i < 7; i++) s += F.at(0.4 + i * ((L - 0.8) / 6), 0.5 + (i % 2) * 0.2, 36, SP.puzzle(pick(["#F2C14E", "#64B5F6", "#E57373", "#81C784", "#BA68C8"], i)), 0.9);
      return s;
    },
    // こうぼうの さぎょうだい（まんりき・き の ブロック・のこぎり・かなづち・けずりくず）
    workbench(S, f) {
      const F = A.frame(S, f), L = F.L;
      let s = shadow(S, f, 0.45);
      for (const u of [0.12, L - 0.2]) for (const v of [0.18, 0.74]) s += F.box(u, v, 0.08, 0.08, 0, 66, C3("#A0703F"), 1);
      s += F.box(0.12, 0.2, L - 0.24, 0.6, 16, 4, C3("#B98457"), 1);
      for (let i = 0; i < 3; i++) s += F.box(0.3 + i * 0.36, 0.3, 0.3, 0.24, 20, 10 + (i % 2) * 6, C3(pick(["#E8C38E", "#D9A066", "#F2D7A8"], i)), 1);
      s += F.box(0.06, 0.12, L - 0.12, 0.76, 66, 8, C3("#D9A066"));
      s += F.box(0.12, 0.68, 0.26, 0.2, 74, 12, C3("#7A808C"), 1) + S.line([F.P(0.25, 0.88, 78), F.P(0.25, 1.0, 72)], "#55606A", 2.2);
      s += F.box(0.52, 0.3, 0.32, 0.26, 74, 14, C3("#E8C38E"), 1) + F.box(0.58, 0.36, 0.18, 0.14, 88, 10, C3("#F2D7A8"), 1);
      s += F.at(1.05, 0.46, 74, SP.puzzle("#F2C14E"), 1.1) + F.at(1.3, 0.62, 74, SP.puzzle("#64B5F6"), 1.1);
      s += F.at(L - 0.55, 0.42, 74, `<path d="M-14,-2 L8,-2 L12,-8 L-14,-8 Z" fill="#C9CED3" ${st(1)}/><path d="M-14,-2 l2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2" fill="none" stroke="${INK}" stroke-width=".6"/><rect x="8" y="-10" width="9" height="7" rx="2" fill="#C98A52" ${st(1)}/>`) + F.at(L - 0.8, 0.68, 74, `<rect x="-1.4" y="-14" width="2.8" height="14" rx="1" fill="#C98A52" ${st(0.9)}/><rect x="-6" y="-17" width="12" height="5" rx="1.4" fill="#7A808C" ${st(1)}/>`);
      s += F.at(0.75, 0.74, 74, `<path d="M-6,0 q2,-4 5,-1 q2,-4 5,0" fill="none" stroke="#E8C38E" stroke-width="1.4"/>`);
      return s;
    },
    // かたち はめの つくえ（ひくい・あなの いた と ばらばらの かたち）
    shapesorter(S, f) {
      const F = A.frame(S, f), L = F.L, z = 47;
      let s = shadow(S, f, 0.42);
      for (const u of [0.16, L - 0.24]) for (const v of [0.2, 0.72]) s += F.box(u, v, 0.08, 0.08, 0, 34, C3("#A0703F"), 1);
      s += F.box(0.1, 0.14, L - 0.2, 0.72, 34, 5, C3("#D9A066")) + F.box(0.26, 0.22, L - 0.52, 0.38, 39, 8, C3("#E8C38E"));
      const holes = (k, u) => { const [x, y] = F.P(u, 0.41, 0); if (k === 0) return S.ellipse(x, y, z, 0.1, "#6D5D4B", 0.8); if (k === 1) return S.poly([[x - 0.09, y - 0.09, z], [x + 0.09, y - 0.09, z], [x + 0.09, y + 0.09, z], [x - 0.09, y + 0.09, z]], "#6D5D4B", 0.8); return S.poly([[x, y - 0.12, z], [x + 0.11, y + 0.08, z], [x - 0.11, y + 0.08, z]], "#6D5D4B", 0.8); };
      for (let k = 0; k < 3; k++) s += holes(k, 0.5 + k * ((L - 1) / 2));
      const [x0, y0] = F.P(0.5, 0.76, 0), [x1, y1] = F.P(L / 2, 0.74, 0), [x2, y2] = F.P(L - 0.5, 0.76, 0);
      s += S.cyl(x0, y0, 0.09, 39, 8, ["#EF5350", "#D84444"]) + S.box(x1 - 0.08, y1 - 0.08, 0.16, 0.16, 39, 9, C3("#42A5F5"), 1) + S.poly([[x2, y2 - 0.1, 48], [x2 + 0.1, y2 + 0.07, 48], [x2 - 0.1, y2 + 0.07, 48]], "#66BB6A", 1);
      return s;
    },
    // いろの キューブ（ひくい だい）
    cubes(S, f) {
      const cube = (x, y, z, e, k) => {
        const h = e * T(), n = 3, d = e / n, hz = h / n, cs = [["#F2C14E", "#E57373", "#64B5F6"], ["#81C784", "#FFFFFF", "#F2C14E"], ["#E57373", "#64B5F6", "#81C784"]][k];
        let t = S.box(x, y, e, e, z, h, ink3, 1.2);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          t += S.poly([[x + i * d + 0.012, y + j * d + 0.012, z + h + 0.2], [x + (i + 1) * d - 0.012, y + j * d + 0.012, z + h + 0.2], [x + (i + 1) * d - 0.012, y + (j + 1) * d - 0.012, z + h + 0.2], [x + i * d + 0.012, y + (j + 1) * d - 0.012, z + h + 0.2]], pick(cs, i + j * 2), 0);
          t += S.poly([[x + i * d + 0.012, y + e + 0.002, z + j * hz + 0.8], [x + (i + 1) * d - 0.012, y + e + 0.002, z + j * hz + 0.8], [x + (i + 1) * d - 0.012, y + e + 0.002, z + (j + 1) * hz - 0.8], [x + i * d + 0.012, y + e + 0.002, z + (j + 1) * hz - 0.8]], pick(cs, i + j + 1), 0);
          t += S.poly([[x + e + 0.002, y + i * d + 0.012, z + j * hz + 0.8], [x + e + 0.002, y + (i + 1) * d - 0.012, z + j * hz + 0.8], [x + e + 0.002, y + (i + 1) * d - 0.012, z + (j + 1) * hz - 0.8], [x + e + 0.002, y + i * d + 0.012, z + (j + 1) * hz - 0.8]], pick(cs, i * 2 + j + 2), 0);
        }
        return t;
      };
      return shadow(S, f, 0.34) + S.box(0.18, 0.18, 0.64, 0.64, 0, 28, C3("#B98555")) + S.box(0.14, 0.14, 0.72, 0.72, 28, 4, C3("#D9A066")) + cube(0.2, 0.2, 32, 0.36, 0) + cube(0.58, 0.56, 32, 0.24, 1) + cube(0.25, 0.25, 32 + 0.36 * T(), 0.24, 2);
    },
    // おえかき ロジックの ボード（5×5・ハート・すうじの ヒント）
    picross(S, f) {
      const F = A.frame(S, f), L = F.L, W = (L - 0.36) * T(), Hh = 84, heart = [".#.#.", "#####", "#####", ".###.", "..#.."], done = [1, 1, 1, 0, 0], cs = Math.min((W - 26) / 5, (Hh - 22) / 5);
      let g = `<rect width="${f2(W)}" height="${Hh}" rx="3" fill="#FFFDF6"/>`;
      heart.forEach((row, y) => [...row].forEach((v, x) => { g += `<rect x="${f2(22 + x * cs)}" y="${f2(18 + y * cs)}" width="${f2(cs - 1)}" height="${f2(cs - 1)}" fill="${v === "#" && done[y] ? "#EF5350" : "#FFFFFF"}" stroke="#B8B0A0" stroke-width=".6"/>`; }));
      ["1 1", "5", "5", "3", "1"].forEach((t, y) => { g += txt(11, 18 + y * cs + cs * 0.7, 6.5, t); });
      ["2", "4", "4", "4", "2"].forEach((t, x) => { g += txt(22 + x * cs + cs / 2, 14, 6.5, t); });
      return easel(F, L, 50, 150) + F.box(0.12, 0.46, L - 0.24, 0.06, 50, 96, C3("#B98555"), 1.2) + F.front(0.525, 0.18, L - 0.18, 56, 140, g);
    },
    // ---- コンビニ ----
    // レジの うしろの だい（コーヒー マシン・カップ・からあげの フライヤー／ちゅうかまんの せいろ・うえの たな）
    cvsback(S, f) {
      const law = f.shop !== "sevenbun", c = law ? "#4A8CC9" : "#E86F3A";
      let s = S.box(0.02, 0.1, f.w - 0.04, 0.86, 0, 84, ["#F2F2EE", "#DCDCD5", "#C9C9C0"]);
      for (let i = 0; i < 3; i++) s += doorS(S, 0.96, 0.12 + i * 0.95, 0.94 + i * 0.95, 12, 72, "#ECECE6");
      s += S.box(0, 0.06, f.w, 0.92, 84, 5, ["#E3E8EB", "#C8D0D5", "#B1BBC2"]);
      s += S.box(0.14, 0.24, 0.5, 0.48, 89, 52, [sh(c, -0.1), sh(c, -0.2), sh(c, -0.3)]) + S.poly([[0.2, 0.721, 100], [0.58, 0.721, 100], [0.58, 0.721, 122], [0.2, 0.721, 122]], "#2F3540", 1) + S.at(0.39, 0.74, 101, SP.cup("#FFFFFF")) + S.poly([[0.22, 0.721, 128], [0.56, 0.721, 128], [0.56, 0.721, 137], [0.22, 0.721, 137]], "#9FD7E0", 0.8);
      for (let i = 0; i < 3; i++) s += S.cyl(0.82 + i * 0.16, 0.42 + (i % 2) * 0.16, 0.07, 89, 24 + i * 4, ["#FFFFFF", "#E6E6E6"], 1);
      if (law) { s += S.box(1.4, 0.26, 0.8, 0.52, 89, 8, dark) + S.box(1.42, 0.28, 0.76, 0.48, 97, 30, ["#FFF6E366", "#F2E2C488", "#E5D3B088"], 1.1); for (let i = 0; i < 4; i++) s += S.at(1.55 + i * 0.17, 0.52, 98, icon("karaage", 16)); s += S.box(1.4, 0.26, 0.8, 0.52, 127, 5, C3("#E95F4B")); }
      else { s += S.box(1.4, 0.26, 0.8, 0.52, 89, 40, ["#FFF8F066", "#F2E6D888", "#E5D8C888"], 1.1); for (let i = 0; i < 6; i++) s += S.at(1.56 + (i % 3) * 0.24, 0.42 + Math.floor(i / 3) * 0.2, 89 + Math.floor(i / 3) * 0 + 2, `<path d="M-6,0 Q-6,-9 0,-9 Q6,-9 6,0 Z" fill="${i % 2 ? "#FFFFFF" : "#FBE3C8"}" ${st(0.8)}/>`); s += S.box(1.4, 0.26, 0.8, 0.52, 129, 5, C3("#E86F3A")); }
      s += S.box(2.36, 0.3, 0.46, 0.44, 89, 18, C3("#FFFFFF")) + S.at(2.59, 0.52, 107, `<rect x="-8" y="-4" width="16" height="4" rx="1" fill="#F6EEDF" ${st(0.8)}/><rect x="-6" y="-8" width="12" height="4" rx="1" fill="#FFFFFF" ${st(0.8)}/>`);
      s += S.box(0.1, 0.1, f.w - 0.2, 0.36, 150, 5, steel);
      for (let i = 0; i < 6; i++) s += S.at(0.32 + i * 0.46, 0.28, 155, i % 2 ? SP.box(pick(["#FFFFFF", "#F6EEDF"], i), 12, 10) : SP.jar(pick(["#F6EEDF", "#FFFFFF", "#E8D8C0"], i), c));
      return s;
    },
    // でんしレンジ（ひくい だい の うえ）
    microwave(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.1, 0.12, 0.8, 0.76, 0, 40, ["#F2F2EE", "#DCDCD5", "#C9C9C0"]) + doorS(S, 0.88, 0.14, 0.86, 6, 34, "#ECECE6");
      s += S.box(0.14, 0.2, 0.72, 0.6, 40, 30, ["#F6F6F2", "#E3E3DC", "#CFCFC8"]) + S.poly([[0.18, 0.802, 44], [0.62, 0.802, 44], [0.62, 0.802, 66], [0.18, 0.802, 66]], "#3F4650", 1) + S.poly([[0.22, 0.803, 48], [0.58, 0.803, 48], [0.58, 0.803, 62], [0.22, 0.803, 62]], "#7FA7B9", 0.6);
      s += S.poly([[0.66, 0.802, 46], [0.82, 0.802, 46], [0.82, 0.802, 66], [0.66, 0.802, 66]], "#D9D9D2", 0.8) + S.at(0.74, 0.81, 60, `<rect x="-3.4" y="-3" width="6.8" height="2.6" fill="#8FF0A0"/><circle cx="-2" cy="2" r="1.2" fill="#8C8890"/><circle cx="2" cy="2" r="1.2" fill="#8C8890"/>`);
      return s;
    },
    // ホットの のみもの（あたためる ケース）
    hotdrinks(S, f) {
      const c = "#E8853A";
      let s = shadow(S, f, 0.34) + S.box(0.12, 0.14, 0.76, 0.7, 0, 112, C3(sh(c, 0.3))) + S.poly([[0.18, 0.842, 14], [0.82, 0.842, 14], [0.82, 0.842, 94], [0.18, 0.842, 94]], "#FFF1DE", 1.1);
      for (let k = 0; k < 3; k++) { s += S.line([[0.2, 0.845, 16 + k * 26], [0.8, 0.845, 16 + k * 26]], "#C9A27A", 1); for (let i = 0; i < 4; i++) s += S.at(0.27 + i * 0.15, 0.845, 17 + k * 26, k === 1 ? SP.bottle(pick(["#C9E3A8", "#E8D29A", "#F1C9A0", "#B9DBE8"], i), c) : SP.can(pick(["#8D5B3E", "#E8853A", "#C9483A", "#F3C24F"], i + k)), 0.9); }
      s += S.poly([[0.24, 0.846, 20], [0.36, 0.846, 20], [0.3, 0.846, 88], [0.2, 0.846, 88]], "#FFFFFF55", 0);
      return s + S.box(0.1, 0.12, 0.8, 0.74, 112, 12, C3(c)) + faceS(S, 0.18, 0.82, 0.862, 113, 123, txt(0.32 * T(), 8.5, 8, "ホット", "#FFFFFF"));
    },
    // あったか ココアの マシン
    cocoa(S, f) {
      let s = shadow(S, f, 0.34) + S.box(0.12, 0.16, 0.76, 0.66, 0, 140, C3("#5E5A60"));
      s += faceS(S, 0.18, 0.82, 0.822, 96, 132, `<rect x="1" y="1" width="${f2(0.64 * T() - 2)}" height="34" rx="4" fill="#F4ECE2" ${st(1)}/>` + txt(0.32 * T(), 16, 10, "ココア", "#8D5B3E") + txt(0.32 * T(), 28, 6.5, "あったか", "#B98457"));
      s += S.poly([[0.3, 0.821, 30], [0.7, 0.821, 30], [0.7, 0.821, 70], [0.3, 0.821, 70]], "#3E3A40", 1) + S.at(0.5, 0.83, 32, `<path d="M-5,0 L5,0 L6,-11 L-6,-11 Z" fill="#FFFFFF" ${st(0.9)}/><rect x="-6" y="-13" width="12" height="2.4" fill="#8D5B3E"/>`);
      for (let i = 0; i < 3; i++) s += S.at(0.78, 0.822, 86 - i * 9, `<circle r="2.6" fill="${pick(["#F28B82", "#FFD54F", "#8FD19E"], i)}" ${st(0.7)}/>`);
      return s;
    },
    // オープン ケース（ふたの ない れいぞう だな。したほど ふかい 4だん・うえの あかりと かんばん）
    opencase(S, f) {
      const F = A.frame(S, f), L = F.L, H = 160, body = f.body || "#E8EEF2", goods = f.foods ? A.foods(f.foods) : G[f.variant] || G.snacks, c = f.signCol || A.pal(f.shop).a;
      let s = F.poly([[0.04, 0.04, 0], [L - 0.04, 0.04, 0], [L - 0.04, 0.04, H], [0.04, 0.04, H]], "#F7FAFB", 1.2) + F.box(0.02, 0, 0.08, 0.88, 0, H, C3(body));
      s += F.box(0.06, 0.1, L - 0.12, 0.8, 0, 28, C3(sh(body, -0.05))) + F.rect(0.902, 0.14, L - 0.14, 6, 22, "#C9D3D8", 1);
      for (let u = 0.24; u < L - 0.16; u += 0.12) s += S.line([F.P(u, 0.904, 9), F.P(u, 0.904, 19)], "#9AA6AE", 1);
      [[28, 0.88], [66, 0.68], [102, 0.52], [136, 0.38]].forEach(([z, v], k) => {
        s += F.box(0.08, 0.04, L - 0.16, v - 0.04, z - 3, 3, ["#FFFFFF", "#E6EBEE", "#D6DDE2"], 1);
        const per = Math.max(3, Math.round(L * 3.2));
        for (let i = 0; i < per; i++) s += F.at(0.26 + (i * (L - 0.52)) / (per - 1), v * 0.62, z, goods(i + k * 3, k));
        s += F.rect(v + 0.002, 0.12, L - 0.12, z - 3, z, "#FFFDF4", 0.6);
      });
      s += F.box(L - 0.1, 0, 0.08, 0.88, 0, H, C3(body)) + F.box(0.02, -0.02, L - 0.04, 0.5, H, 12, C3(c));
      if (f.sign) s += F.front(0.482, L / 2 - 0.6, L / 2 + 0.6, H + 1, H + 11, txt(0.6 * T(), 8.6, 8.5, f.sign, "#FFFFFF"));
      return s + F.poly([[0.12, 0.47, H - 1], [L - 0.12, 0.47, H - 1]], "none", 2.2);
    },
    // ざっしの ラック（ななめの 3だん）
    magrack(S, f) {
      const F = A.frame(S, f), L = F.L, wood = f.wood || "#D9C7A6", cols = ["#F4B6C2", "#A8D5BA", "#FFE08A", "#A8C4E8", "#F7C08A", "#C7B8E8"];
      const mag = (i) => `<rect x="-6" y="-19" width="12" height="17" rx="1.2" fill="${pick(cols, i)}" ${st(0.9)}/><circle cx="0" cy="-12" r="3.4" fill="#FFFFFF"/><path d="M-4,-5 h8" stroke="#FFFFFF" stroke-width="1.2"/>`;
      let s = F.poly([[0.04, 0.04, 0], [L - 0.04, 0.04, 0], [L - 0.04, 0.04, 112], [0.04, 0.04, 112]], sh(wood, 0.2), 1.2) + F.box(0.02, 0, 0.08, 0.62, 0, 112, C3(wood));
      [[8, 0.58], [44, 0.42], [80, 0.26]].forEach(([z, v], k) => { s += F.box(0.08, 0.04, L - 0.16, v - 0.04, z - 4, 4, C3(sh(wood, 0.1)), 1); const n = Math.round(L * 3); for (let i = 0; i < n; i++) s += F.at(0.2 + (i * (L - 0.4)) / (n - 1), v - 0.06, z, mag(i + k * 3)); });
      return s + F.box(L - 0.1, 0, 0.08, 0.62, 0, 112, C3(wood));
    },
    // ATM と コピーき
    atm(S, f) {
      const F = A.frame(S, f), L = F.L;
      let s = shadow(S, f, 0.42) + F.box(0.1, 0.12, 0.8, 0.7, 0, 138, C3("#9FB6C7"));
      s += F.front(0.822, 0.18, 0.82, 76, 130, `<rect width="${f2(0.64 * T())}" height="54" rx="4" fill="#E6F4FA" ${st(1)}/><rect x="4" y="12" width="${f2(0.64 * T() - 8)}" height="20" rx="2" fill="#4A8CC9"/>` + txt(0.32 * T(), 9, 7, "ATM") + txt(0.32 * T(), 25, 7, "いらっしゃいませ", "#FFFFFF") + [...Array(6)].map((_, i) => `<rect x="${f2(5 + (i % 3) * 7)}" y="${36 + Math.floor(i / 3) * 7}" width="5" height="5" rx="1" fill="#F5F2EA" ${st(0.5)}/>`).join(""));
      s += F.box(0.12, 0.62, 0.76, 0.24, 64, 8, C3("#B9CBD8"), 1);
      if (L >= 2) {
        s += F.box(1.08, 0.14, 0.84, 0.72, 0, 84, C3("#E3E0D6")) + F.box(1.06, 0.12, 0.88, 0.76, 84, 8, C3("#C9C4B6"));
        for (let k = 0; k < 3; k++) s += F.rect(0.862, 1.16, 1.84, 10 + k * 20, 26 + k * 20, "#F2EFE6", 1);
        s += F.box(1.5, 0.66, 0.36, 0.2, 92, 6, C3("#8C8890"), 1) + F.at(1.68, 0.76, 98, `<rect x="-5" y="-3" width="10" height="3" fill="#8FD19E"/>`) + F.front(0.882, 1.16, 1.56, 66, 80, label(0.4 * T(), 14, "コピー", "#FFFFFF", INK, 7));
      }
      return s;
    },
    kuji_lawson(S, f) { return kujiShelf(S, f, "lawson"); },
    kuji_sevenbun(S, f) { return kujiShelf(S, f, "sevenbun"); },
    // ---- ガソリンスタンド ----
    // タイヤの ラック（2だん）
    tirerack(S, f) {
      const F = A.frame(S, f), L = F.L, n = Math.max(2, Math.round(L * 1.6));
      let s = shadow(S, f, 0.42);
      for (const u of [0.1, L - 0.16]) s += F.box(u, 0.2, 0.06, 0.06, 0, 112, C3("#8C8890"), 1);
      for (const z of [6, 58]) { s += F.box(0.1, 0.2, L - 0.2, 0.6, z, 4, C3("#B8B2A6"), 1); for (let i = 0; i < n; i++) s += F.at(0.34 + (i * (L - 0.68)) / (n - 1), 0.5, z + 4, SP.tire(), 2.1); }
      for (const u of [0.1, L - 0.16]) s += F.box(u, 0.74, 0.06, 0.06, 0, 112, C3("#8C8890"), 1);
      return s + F.box(0.08, 0.18, L - 0.16, 0.64, 112, 5, C3("#B8B2A6"));
    },
    // タイヤの やま（ひくい）
    tirestack(S, f) {
      let s = shadow(S, f, 0.4);
      for (let k = 0; k < 3; k++) s += S.cyl(0.5, 0.5, 0.34, k * 15, 14, ["#3F4448", "#2F3438"]) + S.ellipse(0.5, 0.5, k * 15 + 14.2, 0.18, "#C9CED3", 1) + S.ellipse(0.5, 0.5, k * 15 + 14.4, 0.08, "#7A8086", 0.8);
      return s;
    },
    // じどうはんばいき（1マスに 1だい）
    vending(S, f) {
      const F = A.frame(S, f), n = Math.max(1, Math.round(F.L)), cs = [f.col || "#E8453C", "#4A8CC9", "#5DB070"];
      let s = "";
      for (let k = 0; k < n; k++) {
        const u = k + 0.06, c = pick(cs, k);
        s += F.box(u, 0.1, 0.88, 0.72, 0, 164, C3(c)) + F.rect(0.822, u + 0.08, u + 0.8, 90, 154, "#F4FBFD", 1.2);
        for (let r = 0; r < 2; r++) { s += F.poly([[u + 0.1, 0.824, 92 + r * 30], [u + 0.78, 0.824, 92 + r * 30]], "none", 1); for (let i = 0; i < 4; i++) s += F.at(u + 0.18 + i * 0.17, 0.826, 93 + r * 30, i % 2 ? SP.can(pick(["#E95F4B", "#F3C24F", "#4A8CC9", "#5DB070"], i + r + k)) : SP.bottle(pick(["#9CCFA8", "#E7A8B8", "#A8C4E8", "#F4B26A"], i + r + k)), 0.92); }
        s += F.front(0.826, u + 0.08, u + 0.8, 60, 86, `<rect width="${f2(0.72 * T())}" height="26" rx="3" fill="${sh(c, 0.35)}" ${st(0.9)}/>` + [0, 1, 2, 3].map((i) => `<rect x="${f2(3 + i * 0.17 * T())}" y="4" width="${f2(0.17 * T() - 3)}" height="5" rx="1.4" fill="#8FD19E" ${st(0.5)}/>`).join("") + txt(0.36 * T(), 21, 7, "つめたい", "#FFFFFF") + `<rect x="${f2(0.72 * T() - 8)}" y="13" width="4" height="9" rx="1" fill="#2F3540"/>`);
        s += F.rect(0.824, u + 0.14, u + 0.66, 14, 36, "#2F3540", 1.1);
      }
      return s;
    },
    // きょうの ガソリン（はしらの かんばん）
    priceboard(S, f) {
      const fuels = typeof GAS_FUELS !== "undefined" ? GAS_FUELS : [{ name: "レギュラー", col: "#E8453C" }, { name: "ハイオク", col: "#F7C948" }, { name: "けいゆ", col: "#4FAE5A" }], W = 0.84 * T();
      let s = shadow(S, f, 0.3) + S.box(0.36, 0.4, 0.28, 0.2, 0, 6, C3("#8C8890")) + S.box(0.46, 0.46, 0.08, 0.08, 6, 70, C3("#B9BEC4"), 1) + S.box(0.08, 0.4, 0.84, 0.16, 76, 88, C3("#FFFDF6"));
      return s + faceS(S, 0.08, 0.92, 0.562, 78, 162, `<rect x="2" y="2" width="${f2(W - 4)}" height="16" rx="3" fill="#E8453C"/>` + txt(W / 2, 13, 8, "ガソリン", "#FFFFFF") + fuels.slice(0, 3).map((q, i) => `<rect x="3" y="${22 + i * 20}" width="${f2(W - 6)}" height="17" rx="2" fill="#2F3540"/><rect x="5" y="${25 + i * 20}" width="5" height="11" rx="1" fill="${q.col}"/>` + txt(W * 0.42, 34 + i * 20, 6.2, q.name, "#FFFFFF") + txt(W * 0.82, 34 + i * 20, 7.5, [120, 130, 110][i], "#F6D47A")).join(""));
    },
    // どうぐばこ（あかい ワゴン）
    toolchest(S, f) {
      let s = shadow(S, f, 0.34);
      for (const [x, y] of [[0.22, 0.26], [0.74, 0.26], [0.22, 0.72], [0.74, 0.72]]) s += S.cyl(x, y, 0.05, 0, 6, ["#3F4448", "#2F3438"]);
      s += S.box(0.14, 0.2, 0.72, 0.6, 6, 84, C3("#E8453C"));
      for (let k = 0; k < 5; k++) s += doorS(S, 0.8, 0.18, 0.82, 10 + k * 15, 22 + k * 15, "#F06A5E") + S.line([[0.4, 0.802, 16 + k * 15], [0.6, 0.802, 16 + k * 15]], "#C9CED3", 2);
      return s + S.box(0.12, 0.18, 0.76, 0.64, 90, 4, C3("#3F4448")) + S.at(0.4, 0.44, 94, `<path d="M-10,2 L6,-6 M6,-6 l3,-4 m-3,4 l5,-1" stroke="#9AA6AE" stroke-width="3" stroke-linecap="round"/>`) + S.at(0.66, 0.6, 94, SP.oil("#F3C24F"), 0.9);
    },
    // ---- ゆうびんきょく ----
    // あかい ポスト（まるい あたま・いれぐち・てがみの ふだ）
    postbox(S, f) {
      const c = "#E53935";
      let s = shadow(S, f, 0.34) + S.box(0.28, 0.28, 0.44, 0.44, 0, 12, C3("#8C2A27")) + S.cyl(0.5, 0.5, 0.24, 12, 96, [c, sh(c, -0.15)]);
      s += S.at(0.5, 0.5, 108, `<path d="M-14.3,0 A14.3,13 0 0 1 14.3,0 A14.3,7.8 0 0 1 -14.3,0 Z" fill="${sh(c, 0.08)}" ${st(1.2)}/>`);
      return s + S.at(0.62, 0.66, 90, `<rect x="-7" y="-2" width="12" height="3.4" rx="1.6" fill="#5A1A18"/>`) + S.at(0.6, 0.7, 64, `<rect x="-7" y="-14" width="14" height="14" rx="1.4" fill="#FFFFFF" ${st(0.8)}/><g transform="translate(0 -3) scale(.7)">${SP.letter("#FFFFFF")}</g>`);
    },
    // ゆうびんうけ（ちいさな とびらが たくさん）
    pobox(S, f) {
      const F = A.frame(S, f), L = F.L, H = 160, cols = Math.round(L * 4), rows = 6, du = (L - 0.2) / cols, dz = (H - 24) / rows;
      let s = F.box(0.04, 0.04, L - 0.08, 0.5, 0, H, C3("#C9C1B3"));
      for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) { const u0 = 0.1 + i * du, z0 = 14 + k * dz; s += F.rect(0.542, u0 + 0.015, u0 + du - 0.015, z0 + 1.5, z0 + dz - 1.5, pick(["#D9C08A", "#E3CC98"], i + k), 0.9) + F.rect(0.546, u0 + du * 0.28, u0 + du * 0.72, z0 + dz * 0.6, z0 + dz * 0.8, "#FFFDF6", 0) + F.rect(0.546, u0 + du * 0.74, u0 + du * 0.86, z0 + dz * 0.28, z0 + dz * 0.5, "#8C7A5A", 0); }
      return s + F.box(0, 0.02, L, 0.56, H, 8, C3("#A99F8E"));
    },
    // こづつみの はかり
    parcelscale(S, f) {
      let s = shadow(S, f, 0.36) + S.box(0.12, 0.14, 0.76, 0.72, 0, 70, C3("#D9D4CC")) + doorS(S, 0.86, 0.16, 0.84, 8, 62, "#E6E1D7");
      s += S.box(0.16, 0.2, 0.68, 0.6, 70, 6, C3("#B9B4AC")) + parcel(S, 0.28, 0.28, 0.38, 0.34, 76, 22, "#D9A066");
      return s + S.box(0.62, 0.66, 0.22, 0.12, 76, 16, dark, 1) + faceS(S, 0.64, 0.82, 0.782, 80, 90, `<rect width="${f2(0.18 * T())}" height="10" fill="#2F3A3E"/>` + txt(0.09 * T(), 8, 7, "1.2", "#8FF0A0"));
    },
    // てがみを かく だい（ななめの つくえ・ペン・ようし・のり）
    writingdesk(S, f) {
      const F = A.frame(S, f), L = F.L;
      let s = shadow(S, f, 0.42);
      for (const u of [0.16, L - 0.24]) s += F.box(u, 0.4, 0.08, 0.2, 0, 86, C3("#A0703F"), 1);
      s += F.box(0.08, 0.1, L - 0.16, 0.16, 86, 22, C3("#C98A52"));
      for (let i = 0; i < Math.round(L * 3); i++) s += F.at(0.3 + i * ((L - 0.6) / Math.max(1, Math.round(L * 3) - 1)), 0.18, 108, SP.card(pick(["#F2A7B8", "#8EC5F4", "#F6D47A", "#8FD19E"], i)), 0.8);
      s += F.poly([[0.08, 0.26, 96], [L - 0.08, 0.26, 96], [L - 0.08, 0.86, 86], [0.08, 0.86, 86]], "#D9A066", 1.2) + F.box(0.08, 0.84, L - 0.16, 0.04, 82, 4, C3("#B98457"), 1);
      s += F.at(0.45, 0.56, 92, SP.letter("#FFFFFF"), 1.1) + F.at(L * 0.6, 0.5, 92, `<path d="M-8,4 L6,-6" stroke="#4A8CC9" stroke-width="2.4" stroke-linecap="round"/><path d="M6,-6 q6,-2 6,4 q0,4 -8,6" fill="none" stroke="#9AA6AE" stroke-width=".9"/>`) + F.at(L - 0.4, 0.6, 90, `<rect x="-3" y="-10" width="6" height="10" rx="1.4" fill="#F6D47A" ${st(0.9)}/><rect x="-2" y="-13" width="4" height="3" fill="#E8453C" ${st(0.6)}/>`);
      return s;
    },
    // ばんごうふだの きかい
    ticketmachine(S, f) {
      let s = shadow(S, f, 0.3) + S.box(0.36, 0.36, 0.28, 0.28, 0, 8, C3("#8C8890")) + S.box(0.44, 0.44, 0.12, 0.12, 8, 70, C3("#B9BEC4"), 1) + S.box(0.24, 0.3, 0.52, 0.42, 78, 46, C3("#F2F2EE"));
      s += faceS(S, 0.28, 0.72, 0.722, 94, 120, `<rect x="1" y="1" width="${f2(0.44 * T() - 2)}" height="24" rx="3" fill="#3F4650"/>` + txt(0.22 * T(), 10, 6.5, "ばんごう", "#9FF0B0") + txt(0.22 * T(), 21, 8, "12", "#FFFFFF"));
      return s + S.at(0.42, 0.73, 82, `<rect x="-4" y="-1" width="8" height="10" fill="#FFFFFF" ${st(0.8)}/>`) + S.at(0.64, 0.73, 88, `<circle r="3.4" fill="#E53935" ${st(0.9)}/>`);
    },
    // パンフレットの ラック
    brochures(S, f) {
      const F = A.frame(S, f), L = F.L, cols = ["#F2A7B8", "#8EC5F4", "#F6D47A", "#8FD19E", "#C9B8E8"], n = Math.max(2, Math.round(L * 2.4));
      let s = F.box(0.08, 0.04, L - 0.16, 0.36, 0, 140, C3("#E9DFCF"));
      for (let k = 0; k < 4; k++) { const z = 22 + k * 30; s += F.box(0.1, 0.34, L - 0.2, 0.12, z, 3, C3("#D2C4AE"), 0.9); for (let i = 0; i < n; i++) s += F.at(0.26 + (i * (L - 0.52)) / (n - 1), 0.42, z + 3, `<rect x="-5" y="-15" width="10" height="15" rx="1" fill="${pick(cols, i + k)}" ${st(0.8)}/><rect x="-3.4" y="-12" width="6.8" height="4" fill="#FFFFFF" opacity=".8"/>`); }
      return s;
    },
  };
  Object.assign(A.M, M);
  Object.assign(A.HEIGHTS, {
    puzzlecab: 180, trophy: 110, candyjar: 74, puzzletable: 66, juicebar: 170, fruitbasket: 112, fruitbox: 156, parcelstack: 70, lockers: 178, conveyor: 142,
    sortingtable: 158, planemodel: 130, chalkboard: 168, desks: 80, spotboard: 150, globe: 110, slideframe: 150, jigsawwall: 176, workbench: 100, shapesorter: 56,
    cubes: 66, picross: 150, cvsback: 170, microwave: 72, hotdrinks: 126, cocoa: 146, opencase: 176, magrack: 116, atm: 146, kuji_lawson: 200, kuji_sevenbun: 200,
    tirerack: 120, tirestack: 50, vending: 170, priceboard: 166, toolchest: 108, postbox: 136, pobox: 170, parcelscale: 100, writingdesk: 116, ticketmachine: 130, brochures: 146,
  });
  // うごく ところ: ジューサーの ゆげ（つめたい）・おでんの ゆげ は カウンターの 絵・ベルトの ランプ
  Object.assign(A.L, {
    conveyor(ctx, sc, f, off) { const F = f.w >= f.d, L = F ? f.w : f.d, u = L * 0.62 + 0.07, q = sc.toScreen(IsoVenue.p(f.x + (F ? u : 0.5), f.y + (F ? 0.5 : u), 128), off); ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * Math.max(0, Math.sin(G.t * 5)); ctx.fillStyle = "#FF6B5E"; ctx.beginPath(); ctx.arc(q.x, q.y, 5 * sc.s, 0, 7); ctx.fill(); ctx.restore(); },
  });
})();
