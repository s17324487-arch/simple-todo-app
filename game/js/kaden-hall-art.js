// UI-56: ネリカス電機（池袋の 家電の 館）の 内装の 絵（斜め上から。MallArt と おなじ しくみ・館の 配置は js/kaden-hall.js）。
// 什器は 種類ごとの SVG（キーは 種類・大きさ・variant・shop・item だけ → 有限）。うごく ところ（テレビの かべ・スマホの がめん・パソコン・
// ゲームの がめん・ロボット そうじき・エアコンの かぜ・シアターの 大きな がめん・ねふだの 文字）は canvas で 描く。
// テレビの ばんぐみは KadenItems.tvShow（おうちの テレビと おなじ）。
const KadenHallArt = (() => {
  const art = Object.create(MallArt);
  const T = IsoVenue.T, A = IsoVenue.A, B = IsoVenue.B, TAU = Math.PI * 2;
  const st = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const WHITE = ["#FFFFFF", "#E4E0D8", "#F7F5F0"], DARK = ["#4E555F", "#3E434C", "#646B76"], WOOD = ["#D9B98E", "#C2A075", "#E7CFA6"], RED = "#E8453C";
  // 売り場の いろ（フロアマップ・かんばん・台の おび）
  const SHOPS = {
    kd_phone: { name: "スマホ", c: ["#F9D6E2", "#F2B6CB", "#D9879F"] },
    kd_camera: { name: "カメラ", c: ["#D8E1EA", "#BCC9D6", "#8C9CAE"] },
    kd_audio: { name: "イヤホン・とけい", c: ["#E2D8EF", "#CBBDE2", "#9D8BC0"] },
    kd_acc: { name: "スマホ アクセサリー", c: ["#FFE7C9", "#F7CFA0", "#D9A66A"] },
    kd_aircon: { name: "エアコン", c: ["#D6ECF7", "#B6DBEE", "#7FB6D6"] },
    kd_wash: { name: "せんたくき", c: ["#D3EEF2", "#B3DEE5", "#7FBCC6"] },
    kd_fridge: { name: "れいぞうこ", c: ["#D4EFE2", "#B5E0CB", "#83BFA2"] },
    kd_clean: { name: "そうじき", c: ["#FFF3C4", "#F7E18F", "#D9BC52"] },
    kd_kitchen: { name: "キッチン かでん", c: ["#FFE1CC", "#F7C3A0", "#D99A6A"] },
    kd_season: { name: "きせつの かでん", c: ["#DDF0D2", "#C2E2B0", "#8DBA74"] },
    kd_tv: { name: "テレビ", c: ["#D2DAEE", "#B3C0E0", "#7F8FBF"] },
    kd_speaker: { name: "オーディオ", c: ["#E6DAF0", "#D0BEE3", "#A28BBF"] },
    kd_pc: { name: "パソコン", c: ["#CFEAE8", "#AEDBD7", "#76B4AE"] },
    kd_game: { name: "ゲーム", c: ["#F8D3CF", "#EFB0A9", "#CF7F76"] },
    kd_tel: { name: "でんわ", c: ["#FCE3CF", "#F5C9A6", "#D9A273"] },
    kd_light: { name: "あかり", c: ["#FBEFC6", "#F2DE96", "#CFB45C"] },
    kd_health: { name: "マッサージチェア", c: ["#E8DDF2", "#D3C2E6", "#A891C9"] },
    kd_theater: { name: "シアター", c: ["#EAD3D8", "#D9B3BB", "#B07A86"] },
    kd_view: { name: "まちの ながめ", c: ["#DDEEF7", "#C3E0EF", "#8FBCD6"] },
    kd_sticker: { name: "シール", c: ["#FCE3EE", "#F7C3DA", "#E58CB0"] },
    kd_service: { name: "サービス カウンター", c: ["#E6E1D6", "#D3CBBD", "#A99D88"] },
    kd_register: { name: "おかいけい", c: ["#FAD2CE", "#F2ADA6", "#D97A70"] },
  };
  Object.assign(MallArt.SHOP, SHOPS);
  const shopC = (f) => (SHOPS[f.shop] || MallArt.SHOP[f.shop] || { c: ["#F1E7D6", "#E1D3BC", "#C9B79B"] }).c;
  // 投影した 点に 絵を おく（S.at の 5ばんめは ばいりつ。絵の はみだし hw・hh を はんいに いれる）
  const at = (S, x, y, z, inner, hw = 12, hh = 12) => { const q = S.P(x, y, z); S.grow(q.x - hw, q.y - hh, q.x + hw, q.y + hh); return S.at(x, y, z, inner); };

  // シールの パックの ちいさな 絵（たな・ラック用。12×16 くらい・つりさげの あな・いろの おび・なかの シールは かんたんな かたち）
  const miniPack = (k) => {
    const band = { flake: "#FFD9A8", flake2: "#C9E8B8", tile: "#FFE48A", y2k: "#F7B3DC", drop: "#FF9EBF", shaka: "#9FD3F0", puku: "#FFD3E4", mat: "#C9D0DA" }[k] || "#F7C3DA";
    let s = `<rect x="-6" y="-9" width="12" height="17" rx="1.6" fill="#FFFFFF" ${st(1)}/><rect x="-6" y="-9" width="12" height="4.4" rx="1.4" fill="${band}" ${st(0.9)}/><ellipse cx="0" cy="-7.2" rx="2" ry="0.9" fill="#FFFFFF"/>`;
    if (k === "flake" || k === "flake2") s += [[-3, -1, "#FF8FB0"], [2.5, -1.5, "#FFE14D"], [-1, 3, "#9FD3F0"], [3, 3.5, "#B8E6A6"], [-3.6, 5.4, "#C9A8FF"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`).join("");
    else if (k === "tile") for (let i = 0; i < 9; i++) s += `<rect x="${-4.2 + (i % 3) * 3}" y="${-3.4 + Math.floor(i / 3) * 3}" width="2.4" height="2.4" rx="0.5" fill="${["#FFB3CC", "#FFE48A", "#C9F2A8", "#BFE6F7", "#FFD3D3", "#E2D3FA"][i % 6]}" stroke="${INK}" stroke-width="0.4"/>`;
    else if (k === "y2k") s += `<rect x="-3" y="-3.4" width="4" height="8" rx="1" fill="#F7A3C8" stroke="${INK}" stroke-width="0.5"/><path d="M1.6,1 h1.4 v1.4 h1.4 v1.4 h-1.4 v1.4 h-1.4 Z" fill="#FF5C8A"/>`;
    else if (k === "drop") s += [[-2.4, 0, "#FF6F9C"], [2.4, 0.4, "#FFCF3D"], [0, 4, "#6FD3EA"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}" stroke="${INK}" stroke-width="0.5"/><circle cx="${x - 0.7}" cy="${y - 0.7}" r="0.6" fill="#FFFFFF"/>`).join("");
    else if (k === "shaka") s += `<circle cx="0" cy="1.6" r="4.4" fill="#BFE8F7" stroke="${INK}" stroke-width="0.6"/>` + [[-1.8, 3.2], [0.6, 4], [2, 2.6], [-0.4, 2.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.6" fill="#FFE14D"/>`).join("");
    else if (k === "puku") s += `<ellipse cx="0" cy="1.6" rx="4.2" ry="3.6" fill="#FFE3EC" stroke="${INK}" stroke-width="0.6"/><circle cx="-1.4" cy="1.2" r="0.5" fill="${INK}"/><circle cx="1.4" cy="1.2" r="0.5" fill="${INK}"/>`;
    else s += `<rect x="-4" y="-2.6" width="3.6" height="5" fill="#C9D0DA" stroke="#9AA4B2" stroke-width="0.4"/><rect x="0.6" y="-2.6" width="3.6" height="5" fill="#E8C15A" stroke="#B8902E" stroke-width="0.4"/><path d="M-3.4,2 L-1,-2" stroke="#FFFFFF" stroke-width="0.8"/>`;
    return s + `<path d="M-4.6,-4 L-3,-4 L-4.2,7 L-5,7 Z" fill="#FFFFFF" opacity=".5"/>`;
  };
  // ---- 什器の 絵（S は MallArt.svgBuilder・原点は 什器の かど・x y は マス・z は おうちの 単位）----
  const M = {
    // 家電の だい: しろい つやの だい・うえは 売り場の いろ・まえの おび・みぎ まえの ねふだ（文字は L.kstand）
    kstand(S, f) {
      const c = shopC(f), w = f.w, h = f.h, x0 = w - 0.78;
      let s = S.ellipse(w / 2, h / 2, 0, Math.max(w, h) * 0.5, "#00000012", 0);
      s += S.box(0.05, 0.05, w - 0.1, h - 0.1, 0, 12, WHITE);
      s += S.poly([[0.16, 0.16, 12.2], [w - 0.16, 0.16, 12.2], [w - 0.16, h - 0.16, 12.2], [0.16, h - 0.16, 12.2]], c[0], 1);
      s += S.poly([[0.05, h - 0.05, 3], [w - 0.05, h - 0.05, 3], [w - 0.05, h - 0.05, 8], [0.05, h - 0.05, 8]], c[1], 1);
      s += S.box(x0, h - 0.3, 0.64, 0.06, 12, 22, ["#FFFFFF", "#E5E1D9", "#FFFFFF"], 1.1) + S.poly([[x0, h - 0.24, 26], [x0 + 0.64, h - 0.24, 26], [x0 + 0.64, h - 0.24, 34], [x0, h - 0.24, 34]], RED, 1);
      return s;
    },
    // かべかけ エアコンの ねふだの だい（エアコンは かべの 絵・この だいは まえに たつ かんばん）
    kpop(S, f) {
      let s = S.box(0.3, 0.4, 0.4, 0.2, 0, 8, DARK) + S.box(0.46, 0.46, 0.08, 0.08, 8, 60, "#8D8A92");
      s += S.poly([[0.05, 0.5, 66], [0.95, 0.5, 66], [0.95, 0.5, 120], [0.05, 0.5, 120]], "#FFFFFF", 1.6) + S.poly([[0.05, 0.5, 66], [0.95, 0.5, 66], [0.95, 0.5, 76], [0.05, 0.5, 76]], RED, 1.2);
      s += at(S, 0.5, 0.5, 112, `<g transform="translate(-20 0) scale(.4)">${FURN_ART.ike_kaden_aircon ? FURN_ART.ike_kaden_aircon() : ""}</g>`, 22, 18);
      return s;
    },
    // スマホの だい: しろい てんばん・スマホ 5だい（がめんは L）・ちいさな ねふだ
    phonetable(S, f) {
      const w = f.w, h = f.h;
      let s = S.ellipse(w / 2, h / 2, 0, w * 0.45, "#00000012", 0);
      for (const [x, y] of [[0.2, 0.2], [w - 0.32, 0.2], [0.2, h - 0.32], [w - 0.32, h - 0.32]]) s += S.box(x, y, 0.12, 0.12, 0, 62, "#C9CED3", 1.1);
      s += S.box(0.05, 0.05, w - 0.1, h - 0.1, 62, 8, WHITE);
      for (let i = 0; i < 5; i++) { const x = 0.35 + i * ((w - 0.7) / 4.4), y = h / 2 - 0.2; s += S.box(x, y, 0.36, 0.5, 70, 2, DARK, 1) + S.box(x + 0.1, y - 0.08, 0.16, 0.1, 70, 12, "#9AA3AD", 1); }
      return s;
    },
    // カメラの ショーケース: きの だい・ガラスの はこ・カメラと レンズ
    camcase(S, f) {
      const w = f.w, h = f.h;
      let s = S.box(0.05, 0.05, w - 0.1, h - 0.1, 0, 40, WOOD) + S.box(0.05, 0.05, w - 0.1, h - 0.1, 40, 2, ["#EEF1F4", "#D6DCE2", "#FFFFFF"], 1);
      for (let i = 0; i < 3; i++) {
        const x = 0.3 + i * ((w - 0.6) / 3);
        s += S.box(x, 0.35, 0.5, 0.3, 42, 16, i === 1 ? ["#D9DEE3", "#B6BEC7", "#EEF1F4"] : DARK, 1.1) + S.box(x + 0.08, 0.32, 0.18, 0.04, 58, 5, "#8D949B", 1);
        s += at(S, x + 0.25, 0.65, 50, `<circle r="5.4" fill="#2F3540" ${st(1.1)}/><circle r="2.6" fill="#6D86A8"/><circle cx="-1" cy="-1" r="0.9" fill="#FFFFFF"/>`, 7, 7);
      }
      s += S.box(0.05, 0.05, w - 0.1, h - 0.1, 42, 36, ["#CFE7EC55", "#CFE7EC44", "#E8F4F866"], 1.2);
      s += S.line([[0.3, h - 0.05, 72], [0.9, h - 0.05, 52]], "#FFFFFF", 2.4, 'opacity=".7"');
      return s;
    },
    // ヘッドホンの かべ（たつ いた・フック・ヘッドホン）
    hpwall(S, f) {
      const w = f.w;
      let s = S.box(0.1, 0.3, 0.12, 0.2, 0, 150, "#8D8A92", 1.1) + S.box(w - 0.22, 0.3, 0.12, 0.2, 0, 150, "#8D8A92", 1.1);
      s += S.poly([[0.1, 0.5, 30], [w - 0.1, 0.5, 30], [w - 0.1, 0.5, 150], [0.1, 0.5, 150]], "#F4F1EA", 1.6);
      for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(w * 1.5); i++) {
        const x = 0.4 + i * 0.66, z = 128 - r * 36, c = ["#F2A7B8", "#9FC7E8", "#F7D56A", "#4E555F", "#B8DCA6", "#C9B6E0"][(i + r * 2) % 6];
        if (x > w - 0.3) continue;
        s += at(S, x, 0.52, z, `<path d="M-8,4 Q-8,-8 0,-9 Q8,-8 8,4" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M-8,4 Q-8,-8 0,-9 Q8,-8 8,4" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><rect x="-10.5" y="1" width="5" height="8" rx="2" fill="${c}" ${st(1.1)}/><rect x="5.5" y="1" width="5" height="8" rx="2" fill="${c}" ${st(1.1)}/>`, 12, 12);
      }
      return s;
    },
    // スマホ アクセサリーの ラック（フックに さがった ケースと ケーブル）
    accrack(S, f) {
      const w = f.w;
      let s = S.ellipse(w / 2, 0.5, 0, w * 0.45, "#00000010", 0) + S.box(0.15, 0.35, 0.1, 0.3, 0, 140, "#8D8A92", 1) + S.box(w - 0.25, 0.35, 0.1, 0.3, 0, 140, "#8D8A92", 1);
      s += S.poly([[0.15, 0.5, 20], [w - 0.15, 0.5, 20], [w - 0.15, 0.5, 140], [0.15, 0.5, 140]], "#EEE7DA", 1.5);
      for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(w * 2); i++) {
        const x = 0.4 + i * 0.5, z = 124 - r * 38; if (x > w - 0.3) continue;
        const c = ["#F9D6E2", "#BFE0F0", "#FFF3C4", "#D4EFE2", "#E2D8EF", "#FFE1CC"][(i * 3 + r) % 6];
        s += at(S, x, 0.52, z, `<path d="M0,-12 v3" ${st(1)}/><rect x="-6" y="-9" width="12" height="18" rx="2" fill="${c}" ${st(1.1)}/><rect x="-4" y="-6" width="8" height="10" rx="3" fill="#FFFFFF"/><circle cx="0" cy="-1" r="2" fill="${["#F2A7B8", "#9FC7E8", "#F7D56A"][i % 3]}"/>`, 8, 14);
      }
      return s;
    },
    // テレビの ラック（くろい ひくい だい・テレビ 3だい。がめんは L.tvrack）
    tvrack(S, f) {
      const w = f.w;
      let s = S.box(0.05, 0.1, w - 0.1, 0.8, 0, 26, DARK);
      for (let i = 0; i < 3; i++) { const x = 0.15 + i * ((w - 0.3) / 3), tw = (w - 0.3) / 3 - 0.15; s += S.box(x + tw / 2 - 0.1, 0.4, 0.2, 0.15, 26, 8, DARK, 1) + S.box(x, 0.45, tw, 0.08, 34, 60 + (i % 2) * 8, ["#2E333B", "#24282E", "#3A4048"], 1.2); }
      return s;
    },
    // パソコンの つくえ（しろい ながい つくえ・ノートパソコン 3だい。がめんは L.pcdesk）
    pcdesk(S, f) {
      const w = f.w;
      let s = S.ellipse(w / 2, 0.5, 0, w * 0.45, "#00000010", 0);
      for (const x of [0.15, w - 0.3]) s += S.box(x, 0.2, 0.15, 0.6, 0, 62, "#C9CED3", 1.1);
      s += S.box(0.05, 0.1, w - 0.1, 0.8, 62, 6, WHITE);
      for (let i = 0; i < 3; i++) { const x = 0.35 + i * ((w - 0.7) / 3); s += S.box(x, 0.35, 0.9, 0.45, 68, 2, "#C9CED3", 1) + S.poly([[x, 0.37, 70], [x + 0.9, 0.37, 70], [x + 0.9, 0.3, 104], [x, 0.3, 104]], "#C9CED3", 1.2) + S.poly([[x + 0.06, 0.375, 73], [x + 0.84, 0.375, 73], [x + 0.84, 0.31, 101], [x + 0.06, 0.31, 101]], "#2C3848", 0.9); }
      return s;
    },
    // ゲームの ためしあそび（ひくい だい・テレビ・ゲームき・コントローラー・ラグ）
    gamedemo(S, f) {
      const w = f.w, h = f.h;
      let s = S.poly([[0.1, 0.9, 0.5], [w - 0.1, 0.9, 0.5], [w - 0.1, h - 0.05, 0.5], [0.1, h - 0.05, 0.5]], "#F8D3CF", 1.2);
      s += S.box(0.3, 0.1, w - 0.6, 0.7, 0, 30, WOOD) + S.box(w / 2 - 0.15, 0.4, 0.3, 0.2, 30, 8, DARK, 1) + S.box(0.5, 0.45, w - 1, 0.1, 38, 66, ["#2E333B", "#24282E", "#3A4048"], 1.3);
      s += S.box(w / 2 - 0.45, 0.15, 0.9, 0.45, 30, 8, ["#F4F1EA", "#D9D3C8", "#FFFFFF"], 1.1);
      for (const x of [w / 2 - 0.8, w / 2 + 0.5]) s += at(S, x, h - 0.5, 4, `<rect x="-8" y="-5" width="16" height="9" rx="4" fill="${x < w / 2 ? "#9FC7E8" : "#F2A7B8"}" ${st(1.1)}/><circle cx="-4" cy="-1" r="1.4" fill="${INK}"/><circle cx="4" cy="-1" r="1.4" fill="${INK}"/>`, 10, 8);
      return s;
    },
    // ゲームソフトの たな
    gamerack(S, f) {
      const w = f.w;
      let s = S.box(0.05, 0.2, w - 0.1, 0.6, 0, 110, WOOD);
      for (const z of [30, 66, 100]) { s += S.poly([[0.12, 0.8, z - 28], [w - 0.12, 0.8, z - 28], [w - 0.12, 0.8, z], [0.12, 0.8, z]], "#F7EDE0", 1); for (let i = 0; i < Math.floor(w * 4); i++) { const x = 0.18 + i * 0.24; if (x > w - 0.3) break; s += S.poly([[x, 0.81, z - 26], [x + 0.18, 0.81, z - 26], [x + 0.18, 0.81, z - 4], [x, 0.81, z - 4]], ["#E8453C", "#5A87A8", "#F7C548", "#7FB06A", "#C98AA6", "#4E555F"][(i * 7 + z) % 6], 0.9); } }
      return s;
    },
    // キッチン こものの たな（ケトル・ミキサー・ホットプレート・なべ）
    kshelf(S, f) {
      const w = f.w;
      let s = S.box(0.05, 0.1, w - 0.1, 0.7, 0, 130, WHITE);
      for (const [z, k] of [[44, 0], [90, 1], [130, 2]]) {
        s += S.box(0.05, 0.1, w - 0.1, 0.72, z - 4, 4, ["#E9E4DA", "#CFC8BB", "#F4F0E8"], 1);
        for (let i = 0; i < Math.floor(w * 1.6); i++) { const x = 0.35 + i * 0.62, c = ["#F2A7B8", "#9FC7E8", "#F7D56A", "#B8DCA6", "#FFFFFF"][(i + k) % 5]; if (x > w - 0.3) break; s += (i + k) % 3 === 0 ? S.cyl(x, 0.5, 0.18, z, 22, c) + S.box(x - 0.04, 0.32, 0.08, 0.06, z + 16, 4, DARK, 1) : (i + k) % 3 === 1 ? S.box(x - 0.16, 0.32, 0.32, 0.36, z, 14, c) + S.cyl(x, 0.5, 0.12, z + 14, 16, ["#E8F4F8", "#CFE7EC"]) : S.box(x - 0.22, 0.3, 0.44, 0.4, z, 8, DARK) + S.poly([[x - 0.18, 0.34, z + 8.2], [x + 0.18, 0.34, z + 8.2], [x + 0.18, 0.66, z + 8.2], [x - 0.18, 0.66, z + 8.2]], "#8C8890", 0.8); }
      }
      return s;
    },
    // ロボット そうじきの ためしの さく（ひくい さく・ゆかの マット）。ロボットは L.vacpen
    vacpen(S, f) {
      const w = f.w, h = f.h;
      let s = S.poly([[0.1, 0.1, 0.5], [w - 0.1, 0.1, 0.5], [w - 0.1, h - 0.1, 0.5], [0.1, h - 0.1, 0.5]], "#E9DCC4", 1.2);
      for (let i = 1; i < w * 2; i++) s += S.line([[i * 0.5, 0.12, 0.6], [i * 0.5, h - 0.12, 0.6]], "#DCCBAE", 1);
      s += S.box(0.15, 0.15, 0.6, 0.3, 0, 12, ["#F4F2EC", "#D8D3C8", "#FFFFFF"], 1.1);
      for (const [x0, y0, x1, y1] of [[0, 0, w, 0], [0, 0, 0, h], [w, 0, w, h], [0, h, w, h]]) s += S.line([[x0, y0, 22], [x1, y1, 22]], INK, 4) + S.line([[x0, y0, 22], [x1, y1, 22]], "#F7E18F", 2.4);
      for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) s += S.box(x - 0.06, y - 0.06, 0.12, 0.12, 0, 24, "#D9BC52", 1);
      return s;
    },
    // あたまの うえの ペンダント ライト（コードと かさ。かさは いろいろ）
    pendants(S, f) {
      let s = "";
      for (let i = 0; i < f.w; i++) for (let j = 0; j < f.h; j++) {
        if ((i + j) % 2) continue;
        const x = i + 0.5, y = j + 0.5, z = 196 + ((i * 3 + j) % 3) * 14, c = ["#FBEFC6", "#F9D6E2", "#D3EEF2", "#E2D8EF"][(i + j * 2) % 4];
        s += S.line([[x, y, 300], [x, y, z + 18]], "#6F6C74", 1.4) + S.cyl(x, y, 0.08, z + 16, 4, ["#6F6C74", "#8D8A92"]) + at(S, x, y, z + 16, `<path d="M-12,0 L-16,14 L16,14 L12,0 Z" fill="${c}" ${st(1.4)}/><ellipse cx="0" cy="14" rx="16" ry="4" fill="${c}" ${st(1.2)}/><circle cy="15" r="4" fill="#FFF3C4" ${st(1)}/>`, 18, 4);
      }
      return s;
    },
    // おかいけいの カウンター（しろ・あかい おび・レジ 2だい・ふくろ）
    kcounter(S, f) {
      const w = f.w;
      let s = S.box(0.05, 0.15, w - 0.1, 0.7, 0, 56, ["#FFFFFF", "#E4E0D8", "#F7F5F0"]) + S.poly([[0.05, 0.85, 40], [w - 0.05, 0.85, 40], [w - 0.05, 0.85, 54], [0.05, 0.85, 54]], RED, 1.2);
      s += S.box(0.02, 0.12, w - 0.04, 0.76, 56, 5, ["#E8DCC6", "#D4C5AB", "#BFAE91"]);
      for (const x of [0.6, w - 1.3]) s += S.box(x, 0.3, 0.6, 0.4, 61, 14, DARK, 1.1) + S.poly([[x + 0.05, 0.32, 75], [x + 0.55, 0.32, 75], [x + 0.55, 0.32, 90], [x + 0.05, 0.32, 90]], "#9FE6F2", 1.1);
      s += S.box(w / 2 - 0.3, 0.3, 0.6, 0.4, 61, 24, ["#F7EDE0", "#E1D3BC", "#FFF8EA"], 1.1) + S.poly([[w / 2 - 0.15, 0.7, 70], [w / 2 + 0.15, 0.7, 70], [w / 2 + 0.15, 0.7, 80], [w / 2 - 0.15, 0.7, 80]], RED, 0.9);
      return s;
    },
    // あたらしい スマホの ステージ（まるい だい・おおきな スマホの もけい・ふうせん）
    promo(S, f) {
      const w = f.w, h = f.h, cx = w / 2, cy = h / 2;
      let s = S.ellipse(cx, cy, 0, Math.min(w, h) / 2, "#00000012", 0) + S.cyl(cx, cy, Math.min(w, h) / 2 - 0.1, 0, 16, ["#FFFFFF", "#E4E0D8"]) + S.ellipse(cx, cy, 16, Math.min(w, h) / 2 - 0.35, "#F9D6E2", 1.2);
      s += S.box(cx - 0.45, cy - 0.1, 0.9, 0.2, 16, 120, DARK) + S.poly([[cx - 0.38, cy + 0.11, 24], [cx + 0.38, cy + 0.11, 24], [cx + 0.38, cy + 0.11, 130], [cx - 0.38, cy + 0.11, 130]], "#8FCDEB", 1.2);
      for (const [dx, z, c] of [[-0.18, 108, "#F2A7B8"], [0, 86, "#F7D56A"], [0.18, 64, "#9ED08C"], [0, 44, "#FFFFFF"]]) s += S.poly([[cx + dx - 0.1, cy + 0.12, z], [cx + dx + 0.1, cy + 0.12, z], [cx + dx + 0.1, cy + 0.12, z + 14], [cx + dx - 0.1, cy + 0.12, z + 14]], c, 0.9);
      for (const [dx, dy, c] of [[-1.1, 0.4, "#F2A7B8"], [1.1, -0.3, "#9FC7E8"], [0.9, 0.7, "#F7D56A"]]) s += S.line([[cx + dx, cy + dy, 16], [cx + dx * 1.05, cy + dy, 120]], "#8D8A92", 1) + at(S, cx + dx * 1.05, cy + dy, 128, `<ellipse rx="10" ry="12" fill="${c}" ${st(1.3)}/><ellipse cx="-3" cy="-4" rx="3" ry="2" fill="#FFFFFF" opacity=".6"/>`, 12, 14);
      return s;
    },
    // セールの ワゴン（かなあみの かご・キャスター・はこが いっぱい・あかい ポップ。文字は L.wagon）
    wagon(S, f) {
      const w = f.w, h = f.h, C = ["#F2A7B8", "#9FC7E8", "#F7D56A", "#B8DCA6", "#E8A57A", "#C9B6E0"];
      let s = S.ellipse(w / 2, h / 2, 0, w * 0.5, "#00000012", 0);
      for (const [x, y] of [[0.22, 0.22], [w - 0.22, 0.22], [0.22, h - 0.22], [w - 0.22, h - 0.22]]) s += S.cyl(x, y, 0.07, 0, 6, ["#5A616D", "#3E434C"], 1);
      s += S.box(0.08, 0.08, w - 0.16, h - 0.16, 6, 4, ["#B9C0C8", "#A1A9B3", "#8C949E"], 1.2);
      // なかの はこ（かごの ふちから すこし でる）
      const nx = Math.floor((w - 0.2) / 0.46);
      for (let j = 0; j < 2; j++) for (let i = 0; i < nx; i++) { const x = 0.16 + i * ((w - 0.32) / nx), y = 0.16 + j * ((h - 0.32) / 2), hh = 30 + ((i * 2 + j * 3) % 4) * 4; s += S.box(x + 0.02, y + 0.02, (w - 0.32) / nx - 0.06, (h - 0.32) / 2 - 0.06, 10, hh - 10, C[(i + j * 2) % 6], 1); }
      // かなあみ（まえと よこの 面は すける せん・うえの ふち）
      for (let i = 0; i <= w * 5; i++) { const x = 0.08 + (i * (w - 0.16)) / (w * 5); s += S.line([[x, h - 0.08, 10], [x, h - 0.08, 40]], "#8C949E", 1); }
      for (let i = 0; i <= h * 5; i++) { const y = 0.08 + (i * (h - 0.16)) / (h * 5); s += S.line([[w - 0.08, y, 10], [w - 0.08, y, 40]], "#8C949E", 1); }
      for (const z of [10, 25, 40]) s += S.line([[0.08, h - 0.08, z], [w - 0.08, h - 0.08, z], [w - 0.08, 0.08, z]], "#6F7782", z === 40 ? 2.2 : 1.1);
      s += S.line([[0.08, 0.08, 40], [0.08, h - 0.08, 40]], "#6F7782", 2.2) + S.line([[0.08, 0.08, 40], [w - 0.08, 0.08, 40]], "#6F7782", 2.2);
      // あかい ポップ（うしろの まんなかの ぼう）
      s += S.line([[w / 2, 0.2, 40], [w / 2, 0.2, 96]], "#8D8A92", 2) + S.poly([[w / 2 - 0.5, 0.22, 88], [w / 2 + 0.5, 0.22, 88], [w / 2 + 0.5, 0.22, 116], [w / 2 - 0.5, 0.22, 116]], RED, 1.4);
      return s;
    },
    // ---- シール うりば（UI-57・js/kaden-stickers.js）。パックは ちいさな 絵（シールの 絵は いれない・かるく）----
    // シールの たな: したの だん・うしろの あなあき ボード・フックに つりさげた パック（variant 1 は タイルと レトロ）
    stkshelf(S, f) {
      const w = f.w, board = f.variant ? "#F6E3F4" : "#FDEEDD";
      let s = S.ellipse(w / 2, 0.5, 0, w * 0.45, "#00000010", 0) + S.box(0.05, 0.15, w - 0.1, 0.7, 0, 34, WHITE);
      s += S.box(0.05, 0.12, 0.1, 0.2, 34, 120, "#C9C3CC", 1) + S.box(w - 0.15, 0.12, 0.1, 0.2, 34, 120, "#C9C3CC", 1);
      s += S.poly([[0.1, 0.3, 34], [w - 0.1, 0.3, 34], [w - 0.1, 0.3, 152], [0.1, 0.3, 152]], board, 1.5);
      for (let z = 46; z < 148; z += 14) for (let x = 0.3; x < w - 0.2; x += 0.35) s += S.ellipse(x, 0.31, z, 0.025, "#00000022", 0);
      s += S.poly([[0.1, 0.3, 140], [w - 0.1, 0.3, 140], [w - 0.1, 0.3, 152], [0.1, 0.3, 152]], f.variant ? "#C9A8E8" : "#F7B7CF", 1.2);
      const kinds = f.variant ? ["tile", "y2k", "tile", "y2k"] : ["flake", "flake2", "flake", "flake2"], n = Math.max(2, Math.round(w * 1.3));
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const x = 0.45 + (i * (w - 0.9)) / (n - 1), z = 126 - r * 46; s += S.line([[x, 0.33, z + 6], [x, 0.42, z + 6]], "#8D8A92", 1.2) + at(S, x, 0.44, z, miniPack(kinds[(i + r) % 4]), 9, 12); }
      for (let i = 0; i < Math.floor(w * 2); i++) { const x = 0.3 + i * 0.5; if (x > w - 0.3) break; s += S.box(x - 0.18, 0.4, 0.36, 0.36, 34, 10 + (i % 2) * 4, ["#FFE3EE", "#E2D8EF", "#FFF3C4"][i % 3], 1); }
      return s;
    },
    // くるくる ラック: まるい だい・ぼう・3だんの パック（まわりに）・うえの ポップ（variant 0 ドロップ・1 シャカシャカ）
    stkspin(S, f) {
      const k = f.variant ? "shaka" : "drop", top = f.variant ? "#9FD3F0" : "#FF8FB0";
      let s = S.ellipse(0.5, 0.5, 0, 0.5, "#00000014", 0) + S.cyl(0.5, 0.5, 0.36, 0, 6, ["#E9E4EC", "#C9C3CC"], 1.2) + S.box(0.46, 0.46, 0.08, 0.08, 6, 132, "#9C98A2", 1);
      for (let t = 0; t < 3; t++) {
        const z = 40 + t * 34;
        s += S.cyl(0.5, 0.5, 0.3, z - 2, 2, ["#D9D4DD", "#B9B3BE"], 1);
        for (const [dx, dy] of [[-0.24, 0.16], [0.24, 0.16], [0, 0.3]]) s += at(S, 0.5 + dx, 0.5 + dy, z + 12, miniPack(t === 1 ? (k === "drop" ? "puku" : "mat") : k), 9, 12);
      }
      s += at(S, 0.5, 0.5, 150, f.variant ? `<path d="M0,-14 C6,-6 10,-1 10,4 C10,10 5,14 0,14 C-5,14 -10,10 -10,4 C-10,-1 -6,-6 0,-14 Z" fill="${top}" ${st(1.6)}/><circle cx="-3" cy="2" r="2.4" fill="#FFFFFF" opacity=".85"/><circle cx="3" cy="6" r="1.2" fill="#FFFFFF"/>` : `<path d="M0,12 C-14,4 -12,-8 -5,-9 C-2,-10 0,-7 0,-5 C0,-7 2,-10 5,-9 C12,-8 14,4 0,12 Z" fill="${top}" ${st(1.6)}/><path d="M-5,-4 q2 -3 5 -2" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`, 12, 16);
      return s;
    },
    // ぷくぷく シールの テーブル: ひくい しろい テーブル・うえに シートと ひらいた シールちょう・ためしの ポップ
    stktable(S, f) {
      const w = f.w, h = f.h, Z = 70;
      let s = S.ellipse(w / 2, h / 2, 0, w * 0.5, "#00000012", 0);
      for (const [x, y] of [[0.2, 0.2], [w - 0.3, 0.2], [0.2, h - 0.3], [w - 0.3, h - 0.3]]) s += S.box(x, y, 0.1, 0.1, 0, Z - 6, "#C9C3CC", 1);
      s += S.box(0.05, 0.05, w - 0.1, h - 0.1, Z - 6, 6, ["#FFFFFF", "#E8E2EA", "#F4EFF5"], 1.4) + S.poly([[0.15, 0.15, Z + 0.2], [w - 0.15, 0.15, Z + 0.2], [w - 0.15, h - 0.15, Z + 0.2], [0.15, h - 0.15, Z + 0.2]], "#FCE3EE", 1);
      // シートが ならぶ（いろの だいしに まるい シール）
      for (let i = 0; i < 4; i++) {
        const x = 0.3 + (i % 2) * 0.62, y = 0.3 + Math.floor(i / 2) * 0.72, c = ["#E6F5FC", "#FFF6CF", "#EFE8FA", "#FFE3EC"][i];
        s += S.poly([[x, y, Z + 0.5], [x + 0.52, y, Z + 0.5], [x + 0.52, y + 0.6, Z + 0.5], [x, y + 0.6, Z + 0.5]], c, 1.1);
        for (const [dx, dy, r, cc] of [[0.15, 0.18, 0.1, "#FFB3CC"], [0.36, 0.2, 0.08, "#9FD3F0"], [0.2, 0.42, 0.08, "#FFE48A"], [0.38, 0.42, 0.09, "#C9F2A8"]]) s += S.ellipse(x + dx, y + dy, Z + 0.7, r, cc, 1) + S.ellipse(x + dx - r * 0.3, y + dy - r * 0.3, Z + 0.8, r * 0.3, "#FFFFFF", 0);
      }
      // ひらいた シールちょう（ためし）
      const bx = w - 1.2, by = 0.35;
      s += S.poly([[bx, by, Z + 0.6], [bx + 0.5, by + 0.08, Z + 3], [bx + 0.5, by + 1.18, Z + 3], [bx, by + 1.1, Z + 0.6]], "#FFFDF6", 1.2) + S.poly([[bx + 0.5, by + 0.08, Z + 3], [bx + 1, by, Z + 0.6], [bx + 1, by + 1.1, Z + 0.6], [bx + 0.5, by + 1.18, Z + 3]], "#FFF6FA", 1.2);
      for (const [dx, dy, c] of [[0.2, 0.3, "#FF8FB0"], [0.28, 0.72, "#9FD3F0"], [0.72, 0.38, "#FFE14D"], [0.78, 0.8, "#C9A8FF"]]) s += S.ellipse(bx + dx, by + dy, Z + 2, 0.09, c, 1);
      // ポップ
      s += S.box(0.3, h - 0.32, 0.06, 0.06, Z, 28, "#C9C3CC", 1) + at(S, 0.33, h - 0.3, Z + 34, `<rect x="-12" y="-8" width="24" height="16" rx="4" fill="#FFFFFF" ${st(1.4)}/><path d="M-8,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M2,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0" fill="#FFC2D9" ${st(1)}/>`, 14, 10);
      return s;
    },
    // そざいの ショーケース: しろい だい・ガラス・なかに ミラー（ぎん）・はくおし（きん）・わし・とうめいの みほん
    stkcase(S, f) {
      const w = f.w, h = f.h;
      let s = S.box(0.05, 0.05, w - 0.1, h - 0.1, 0, 46, WHITE) + S.box(0.05, 0.05, w - 0.1, h - 0.1, 46, 2, ["#EEF1F4", "#D6DCE2", "#FFFFFF"], 1);
      const SAMPLE = [["#E3E8EE", "#FFFFFF", "#9AA4B2"], ["#22305A", "#E8C15A", "#E8C15A"], ["#F4EEDC", "#FFFFFF", "#8FB8E0"], ["#DDF3FA", "#FFFFFF", "#9FD3F0"]];
      SAMPLE.forEach(([bg, a, b], i) => { const x = 0.22 + i * ((w - 0.44) / 4); s += at(S, x + 0.18, 0.55, 58, `<rect x="-7" y="-9" width="14" height="18" rx="2" fill="${bg}" ${st(1.1)}/><path d="M-5,6 L4,-7 L7,-7 L-2,6 Z" fill="${a}" opacity=".85"/><circle cx="0" cy="0" r="3" fill="none" stroke="${b}" stroke-width="1.4"/>`, 9, 11); });
      s += S.box(0.05, 0.05, w - 0.1, h - 0.1, 48, 34, ["#CFE7EC55", "#CFE7EC44", "#E8F4F866"], 1.2);
      s += S.line([[0.3, h - 0.05, 78], [0.8, h - 0.05, 56]], "#FFFFFF", 2.4, 'opacity=".7"');
      return s;
    },
    // かいものかごの やま
    basket(S, f) {
      let s = "";
      for (let i = 0; i < 4; i++) s += S.box(0.15, 0.15, 0.7, 0.7, i * 9, 9, i % 2 ? ["#E8453C", "#C9362E", "#F06A60"] : ["#5A87A8", "#4A7090", "#7FA4C2"], 1.1);
      s += S.line([[0.2, 0.5, 36], [0.5, 0.5, 46], [0.8, 0.5, 36]], INK, 2.4);
      return s;
    },
    // シアターの ソファ（えんじいろ・ひじかけ・ざぶとん 2つ）
    tsofa(S, f) {
      const w = f.w, h = f.h, C0 = ["#B85A6A", "#9C4656", "#C9707E"], C1 = ["#D07A88", "#B85A6A", "#E08E9A"];
      let s = S.ellipse(w / 2, h / 2, 0, w * 0.45, "#00000012", 0) + S.box(0.05, 0.05, w - 0.1, h - 0.1, 0, 26, C0) + S.box(0.05, 0.05, w - 0.1, 0.3, 26, 34, C0);
      for (const x of [0.05, w - 0.3]) s += S.box(x, 0.05, 0.25, h - 0.1, 26, 14, C1);
      for (let i = 0; i < 2; i++) s += S.box(0.36 + i * (w - 0.72) / 2, 0.36, (w - 0.72) / 2 - 0.05, h - 0.46, 26, 8, C1);
      return s;
    },
    // ためせる マッサージチェア の マット（いすは 家電の 立体を drawItem で）
    kmat(S, f) { const c = shopC(f); return S.poly([[0.05, 0.05, 0.5], [f.w - 0.05, 0.05, 0.5], [f.w - 0.05, f.h - 0.05, 0.5], [0.05, f.h - 0.05, 0.5]], c[0], 1.2) + S.poly([[0.2, 0.2, 0.6], [f.w - 0.2, 0.2, 0.6], [f.w - 0.2, f.h - 0.2, 0.6], [0.2, f.h - 0.2, 0.6]], c[1], 0); },
  };

  // ---- うごく ところ（毎フレーム）----
  // 面の 上の ざひょう: face "y"（y = at の 面。u は +x・v は した）／ "top"（z の 面。u は +x・v は +y）。1 = おうちの 1 たんい
  const face = (ctx, sc, off, kind, x, y, z) => {
    const o = sc.toScreen(IsoVenue.p(x, y, z), off), a = sc.toScreen(IsoVenue.p(x + 1 / T, y, z), off), c = kind === "top" ? sc.toScreen(IsoVenue.p(x, y + 1 / T, z), off) : sc.toScreen(IsoVenue.p(x, y, z - 1), off);
    ctx.transform(a.x - o.x, a.y - o.y, c.x - o.x, c.y - o.y, o.x, o.y);
  };
  const price = (f) => { const it = VenueHalls.item(f.item); return it ? U.fmt(it.price) : ""; };
  const L = {
    kstand(ctx, sc, f, off) { if (!f.item) return; MallArt.planeText(ctx, sc, off, "y", f.x + f.w - 0.46, f.y + f.h - 0.235, 19, price(f), 9, 0.58 * T); MallArt.planeText(ctx, sc, off, "y", f.x + f.w - 0.46, f.y + f.h - 0.235, 30, "コイン", 6.5, 0.58 * T, "#FFFFFF"); },
    kpop(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + 0.5, f.y + 0.51, 71, (f.item ? price(f) : "") + " コイン", 8, 0.86 * T, "#FFFFFF"); MallArt.planeText(ctx, sc, off, "y", f.x + 0.5, f.y + 0.51, 90, "エアコン", 9, 0.86 * T); },
    phonetable(ctx, sc, f, off) {
      const w = f.w, h = f.h;
      for (let i = 0; i < 5; i++) {
        const x = f.x + 0.38 + i * ((w - 0.7) / 4.4), y = f.y + h / 2 - 0.17;
        ctx.save(); face(ctx, sc, off, "top", x, y, 72.1); const W = 0.3 * T, H = 0.44 * T, k = Math.floor(G.t / 3 + i) % 3;
        ctx.fillStyle = ["#BFE0F0", "#FFE7C9", "#E2D8EF"][k]; ctx.fillRect(0, 0, W, H);
        for (let j = 0; j < 6; j++) { ctx.fillStyle = ["#F2A7B8", "#F7D56A", "#9ED08C", "#9FC7E8", "#E8A57A", "#C9B6E0"][(j + i) % 6]; ctx.fillRect(2 + (j % 3) * (W / 3.2), 3 + Math.floor(j / 3) * 6, W / 4.4, 4.4); }
        if (i === 2) { ctx.fillStyle = "#2C3848"; ctx.fillRect(1, H - 9, W - 2, 8); KadenItems.trio(ctx, (G.t * 6) % (W - 4) + 2, H - 4, 2.4, G.t, Math.floor(G.t) % 3); }
        ctx.restore();
      }
    },
    tvrack(ctx, sc, f, off) {
      const w = f.w;
      for (let i = 0; i < 3; i++) {
        const x = f.x + 0.15 + i * ((w - 0.3) / 3), tw = (w - 0.3) / 3 - 0.15, hh = 60 + (i % 2) * 8, W = (tw - 0.08) * T, H = hh - 8;
        ctx.save(); face(ctx, sc, off, "y", x + 0.04, f.y + 0.531, 34 + hh - 4); KadenItems.tvShow(ctx, (Math.floor(G.t / 8) + i) % 4, G.t + i, W, H); ctx.restore();
      }
    },
    pcdesk(ctx, sc, f, off) {
      const w = f.w;
      for (let i = 0; i < 3; i++) {
        const x = f.x + 0.35 + i * ((w - 0.7) / 3);
        // がめんの 面（すこし うしろに たおれた いた）: 4すみを むすぶ
        const p0 = sc.toScreen(IsoVenue.p(x + 0.06, f.y + 0.375, 73), off), p1 = sc.toScreen(IsoVenue.p(x + 0.84, f.y + 0.375, 73), off), p3 = sc.toScreen(IsoVenue.p(x + 0.06, f.y + 0.31, 101), off);
        const W = 0.78 * T, H = 28;
        ctx.save(); ctx.transform((p1.x - p0.x) / W, (p1.y - p0.y) / W, (p0.x - p3.x) / H, (p0.y - p3.y) / H, p3.x, p3.y);
        ctx.fillStyle = ["#BFE0F0", "#FFFDF6", "#26324A"][i]; ctx.fillRect(0, 0, W, H);
        if (i === 0) { ctx.fillStyle = "#6D86A8"; ctx.fillRect(0, H - 4, W, 4); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(8, 4, W * 0.5, H * 0.55); }
        else if (i === 1) { ctx.strokeStyle = "#E8453C"; ctx.lineWidth = 1.6; ctx.beginPath(); const k = (G.t % 5) / 5; for (let j = 0; j <= 50 * k; j++) { const a = (j / 50) * TAU, rr = 6 + Math.sin(a * 5) * 3; const xx = W / 2 + Math.cos(a) * rr, yy = H / 2 + Math.sin(a) * rr; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
        else { const bx = Math.abs(((G.t * 20) % (2 * (W - 4))) - (W - 4)) + 2, by = Math.abs(((G.t * 13) % (2 * (H - 8))) - (H - 8)) + 2; ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = "#9FE6F2"; ctx.fillRect(Math.min(W - 12, Math.max(0, bx - 6)), H - 4, 12, 2); }
        ctx.restore();
      }
    },
    gamedemo(ctx, sc, f, off) {
      const W = (f.w - 1.1) * T, H = 58;
      ctx.save(); face(ctx, sc, off, "y", f.x + 0.55, f.y + 0.551, 100); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#8FCDEB"); g.addColorStop(1, "#D6EEF7"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#9ED08C"; ctx.fillRect(0, H * 0.72, W, H * 0.28); ctx.fillStyle = "#C98A52"; for (let i = 0; i < 4; i++) ctx.fillRect(((i * 37 - G.t * 30) % (W + 40) + W + 40) % (W + 40) - 20, H * 0.5, 14, 6);
      const jump = Math.abs(Math.sin(G.t * 3)) * H * 0.25; KadenItems.trio(ctx, W * 0.3, H * 0.66 - jump, 6, 0, 0); KadenItems.trio(ctx, W * 0.55, H * 0.66 - Math.abs(Math.sin(G.t * 3 + 1)) * H * 0.2, 6, 0, 1);
      ctx.fillStyle = "#F7D56A"; ctx.beginPath(); ctx.arc((G.t * 40) % W, H * 0.3, 3, 0, TAU); ctx.fill();
      ctx.restore();
    },
    vacpen(ctx, sc, f, off) {
      const s = sc.s, t = G.t * 0.6, cx = f.x + f.w / 2 + Math.sin(t) * (f.w / 2 - 0.6), cy = f.y + f.h / 2 + Math.sin(t * 1.7) * (f.h / 2 - 0.6), a = Math.atan2(Math.cos(t * 1.7) * 1.7 * (f.h / 2 - 0.6), Math.cos(t) * (f.w / 2 - 0.6));
      const P = (x, y, z) => sc.toScreen(IsoVenue.p(x, y, z), off), R = 0.36;
      const disc = (z, r) => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const b = (i / 24) * TAU, q = P(cx + Math.cos(b) * r, cy + Math.sin(b) * r, z); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.closePath(); };
      disc(0.2, R + 0.03); ctx.fillStyle = "rgba(31,29,27,.12)"; ctx.fill();
      ctx.beginPath(); for (let i = 0; i <= 12; i++) { const b = -Math.PI / 4 + (i / 12) * Math.PI, q = P(cx + Math.cos(b) * R, cy + Math.sin(b) * R, 9); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } for (let i = 12; i >= 0; i--) { const b = -Math.PI / 4 + (i / 12) * Math.PI, q = P(cx + Math.cos(b) * R, cy + Math.sin(b) * R, 0); ctx.lineTo(q.x, q.y); } ctx.closePath();
      ctx.fillStyle = "#B9C2CB"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3 * s * 2; ctx.stroke();
      disc(9, R); ctx.fillStyle = "#E9EDF0"; ctx.fill(); ctx.stroke(); disc(9.2, R * 0.6); ctx.fillStyle = "#D3DAE0"; ctx.fill(); ctx.lineWidth = 1 * s * 2; ctx.stroke();
      const e = P(cx + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.75, 9.4); ctx.fillStyle = "#9ED08C"; ctx.beginPath(); ctx.arc(e.x, e.y, 2.4 * s * 2, 0, TAU); ctx.fill(); ctx.stroke();
    },
    pendants(ctx, sc, f, off) {
      if (!(typeof DayTint !== "undefined" && DayTint.isNight()) && !f.glow) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < f.w; i++) for (let j = 0; j < f.h; j++) { if ((i + j) % 2) continue; const z = 196 + ((i * 3 + j) % 3) * 14, q = sc.toScreen(IsoVenue.p(f.x + i + 0.5, f.y + j + 0.5, z + 16), off), g = ctx.createRadialGradient(q.x, q.y + 8 * sc.s, 0, q.x, q.y + 8 * sc.s, 40 * sc.s); g.addColorStop(0, "rgba(255,236,180,.35)"); g.addColorStop(1, "rgba(255,236,180,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y + 8 * sc.s, 40 * sc.s, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
    wagon(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.225, 107, "セール", 12, 0.9 * T, "#FFFFFF"); },
    kcounter(ctx, sc, f, off) { MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.86, 47, "おかいけい", 11, (f.w - 0.4) * T, "#FFFFFF"); },
    promo(ctx, sc, f, off) {
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      ctx.save(); face(ctx, sc, off, "y", cx - 0.38, cy + 0.111, 130); const W = 0.76 * T, H = 106; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      KadenItems.tvShow(ctx, 1, G.t, W, H); ctx.restore();
      MallArt.planeText(ctx, sc, off, "y", cx, cy + Math.min(f.w, f.h) / 2 - 0.1, 8, "しんせいひん", 12, f.w * T * 0.6);
    },
  };
  for (const k of Object.keys(MallArt.L)) if (!L[k]) L[k] = MallArt.L[k];

  // ---- かべ（静止画）。うごく ところは under ----
  const R = (x, y, w, h, fill, extra = "") => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}" stroke="${INK}"${/stroke-width/.test(extra) ? "" : ` stroke-width="1.6"`} ${extra}/>`;
  function wallPart(p, H, r, side) {
    const u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, zt = MallArt.ZTOP;
    let s = "";
    if (p.kind === "kbrand") {
      // ネリカス でんきの かんばん（あかい いた・いなずまの マーク。もじは wallText）
      s += R(u0 + 6, V(zt + 34), w - 12, 70, RED, `rx="10"`) + R(u0 + 14, V(zt + 26), 54, 54, "#FFFFFF", `rx="12"`);
      s += `<path d="M${f2(u0 + 46)},${f2(V(zt + 20))} L${f2(u0 + 30)},${f2(V(zt - 4))} H${f2(u0 + 42)} L${f2(u0 + 36)},${f2(V(zt - 22))} L${f2(u0 + 54)},${f2(V(zt + 4))} H${f2(u0 + 42)} Z" fill="#F7C548" ${st(1.6)}/>`;
      for (let x = u0 + 80; x < u0 + w - 20; x += 22) s += `<circle cx="${f2(x)}" cy="${f2(V(zt + 30))}" r="3" fill="#FFE9A0"/>`;
      s += R(u0 + 6, V(zt - 44), w - 12, 70, "#FFF8EA", `rx="6"`);
      for (let i = 0; i < 4; i++) { const x = u0 + 20 + i * ((w - 40) / 4); s += R(x, V(zt - 52), (w - 40) / 4 - 14, 54, ["#F9D6E2", "#D8E1EA", "#E2D8EF", "#FFE7C9"][i], `rx="4"`); }
    } else if (p.kind === "tvwall") {
      // テレビの かべ: rows × cols の わく（がめんは under）
      const rows = p.rows || 2, cols = p.cols || 4, z0 = p.z0 || 70, z1 = p.z1 || zt + 30, cw = (w - 20) / cols, rh = (z1 - z0) / rows;
      s += R(u0 + 4, V(z1 + 8), w - 8, z1 - z0 + 16, "#3E434C", `rx="6"`);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += R(u0 + 10 + i * cw, V(z1 - j * rh), cw - 4, rh - 6, "#26324A", `rx="2"`);
    } else if (p.kind === "acwall") {
      // かべかけ エアコンが ならぶ（かぜは under）
      const n = p.n || 3, gap = w / n;
      for (let i = 0; i < n; i++) { const x = u0 + i * gap + (gap - 100) / 2, y = V(zt - 10 - (i % 2) * 50); s += `<g transform="translate(${f2(x)} ${f2(y)})">${FURN_ART.ike_kaden_aircon ? FURN_ART.ike_kaden_aircon() : ""}</g>` + R(x + 30, y + 52, 40, 22, "#FFFFFF", `rx="3"`) + R(x + 30, y + 52, 40, 7, RED, `rx="2"`); }
    } else if (p.kind === "theater") {
      // シアターの 大きな がめん（中みは under）・あかい カーテン
      const z0 = p.z0 || 60, z1 = p.z1 || H - 12;
      s += R(u0, V(z1 + 6), w, z1 - z0 + 12, "#2B2630") + R(u0 + 30, V(z1 - 6), w - 60, z1 - z0 - 12, "#26324A");
      for (const [x, d] of [[u0, 1], [u0 + w, -1]]) s += `<path d="M${f2(x)},${f2(V(z1 + 6))} q${f2(d * 40)},${f2((z1 - z0) * 0.5)} ${f2(d * 18)},${f2(z1 - z0 + 12)} h${f2(-d * 18)} Z" fill="#B0475A" ${st(1.4)}/>`;
    } else if (p.kind === "kposter") {
      // しょうひんの ポスター（いろの いた・かたちの マーク）
      const c = p.col || "#F9D6E2", top = V(zt - 20);
      s += R(u0 + 10, top, w - 20, 110, c, `rx="4"`) + R(u0 + 18, top + 8, w - 36, 70, "#FFFFFF", `rx="3"`);
      const cx = u0 + w / 2, cy = top + 43;
      const ic = { phone: `<rect x="${f2(cx - 13)}" y="${f2(cy - 24)}" width="26" height="46" rx="5" fill="#4E555F" ${st(1.4)}/><rect x="${f2(cx - 9)}" y="${f2(cy - 18)}" width="18" height="32" fill="#8FCDEB"/>`, camera: `<rect x="${f2(cx - 24)}" y="${f2(cy - 14)}" width="48" height="30" rx="6" fill="#4E555F" ${st(1.4)}/><circle cx="${f2(cx)}" cy="${f2(cy + 1)}" r="11" fill="#2F3540" ${st(1.2)}/><circle cx="${f2(cx)}" cy="${f2(cy + 1)}" r="5" fill="#6D86A8"/>`, washer: `<rect x="${f2(cx - 20)}" y="${f2(cy - 24)}" width="40" height="46" rx="3" fill="#FFFFFF" ${st(1.4)}/><circle cx="${f2(cx)}" cy="${f2(cy + 2)}" r="12" fill="#A9D4DF" ${st(1.2)}/>`, tv: `<rect x="${f2(cx - 28)}" y="${f2(cy - 18)}" width="56" height="34" rx="2" fill="#2C3848" ${st(1.4)}/><path d="M${f2(cx - 24)},${f2(cy + 10)} l14,-12 l10,6 l12,-10 l12,16 Z" fill="#9ED08C"/>`, lamp: `<path d="M${f2(cx - 16)},${f2(cy - 4)} L${f2(cx - 8)},${f2(cy - 22)} H${f2(cx + 8)} L${f2(cx + 16)},${f2(cy - 4)} Z" fill="#FBEFC6" ${st(1.4)}/><path d="M${f2(cx)},${f2(cy - 4)} V${f2(cy + 18)} M${f2(cx - 10)},${f2(cy + 20)} H${f2(cx + 10)}" ${st(2)}/>`, pc: `<rect x="${f2(cx - 26)}" y="${f2(cy - 20)}" width="52" height="32" rx="2" fill="#2C3848" ${st(1.4)}/><rect x="${f2(cx - 22)}" y="${f2(cy - 16)}" width="44" height="24" fill="#BFE0F0"/><path d="M${f2(cx - 30)},${f2(cy + 20)} H${f2(cx + 30)}" ${st(3)}/>`,
        fridge: `<rect x="${f2(cx - 15)}" y="${f2(cy - 26)}" width="30" height="50" rx="4" fill="#BFE3D2" ${st(1.4)}/><path d="M${f2(cx - 15)},${f2(cy - 8)} H${f2(cx + 15)} M${f2(cx - 10)},${f2(cy - 20)} v8 M${f2(cx - 10)},${f2(cy - 2)} v14" ${st(1.6)}/>`,
        vacuum: `<ellipse cx="${f2(cx - 6)}" cy="${f2(cy + 8)}" rx="16" ry="12" fill="#F2B8C6" ${st(1.4)}/><path d="M${f2(cx + 4)},${f2(cy)} Q${f2(cx + 22)},${f2(cy - 30)} ${f2(cx + 20)},${f2(cy - 8)} V${f2(cy + 20)} h8" fill="none" ${st(2.4)}/>`,
        oven: `<rect x="${f2(cx - 24)}" y="${f2(cy - 16)}" width="48" height="32" rx="4" fill="#F7E2A8" ${st(1.4)}/><rect x="${f2(cx - 19)}" y="${f2(cy - 11)}" width="28" height="22" rx="3" fill="#3F4954"/><circle cx="${f2(cx + 16)}" cy="${f2(cy - 4)}" r="3.4" fill="#FFFFFF" ${st(1)}/>`,
        fan: `<circle cx="${f2(cx)}" cy="${f2(cy - 6)}" r="18" fill="#FFFFFF" ${st(1.4)}/><path d="M${f2(cx)},${f2(cy - 6)} l10,-12 l4,8 Z M${f2(cx)},${f2(cy - 6)} l-14,2 l6,8 Z M${f2(cx)},${f2(cy - 6)} l4,15 l-8,-1 Z" fill="#9FC7E8" ${st(1)}/><path d="M${f2(cx)},${f2(cy + 12)} V${f2(cy + 24)} M${f2(cx - 10)},${f2(cy + 24)} H${f2(cx + 10)}" ${st(2.4)}/>`,
        speaker: `<rect x="${f2(cx - 26)}" y="${f2(cy - 24)}" width="20" height="46" rx="2" fill="#C9A26E" ${st(1.4)}/><rect x="${f2(cx + 6)}" y="${f2(cy - 24)}" width="20" height="46" rx="2" fill="#C9A26E" ${st(1.4)}/><circle cx="${f2(cx - 16)}" cy="${f2(cy + 8)}" r="7" fill="#5A524A"/><circle cx="${f2(cx + 16)}" cy="${f2(cy + 8)}" r="7" fill="#5A524A"/><circle cx="${f2(cx - 16)}" cy="${f2(cy - 12)}" r="4" fill="#5A524A"/><circle cx="${f2(cx + 16)}" cy="${f2(cy - 12)}" r="4" fill="#5A524A"/>`,
        game: `<rect x="${f2(cx - 24)}" y="${f2(cy - 10)}" width="48" height="24" rx="12" fill="#F2A7B8" ${st(1.4)}/><path d="M${f2(cx - 14)},${f2(cy + 2)} h8 M${f2(cx - 10)},${f2(cy - 2)} v8" ${st(2)}/><circle cx="${f2(cx + 10)}" cy="${f2(cy)}" r="2.6" fill="${INK}"/><circle cx="${f2(cx + 16)}" cy="${f2(cy + 5)}" r="2.6" fill="${INK}"/>`,
        chair: `<path d="M${f2(cx - 14)},${f2(cy + 20)} L${f2(cx - 12)},${f2(cy - 22)} Q${f2(cx)},${f2(cy - 30)} ${f2(cx + 8)},${f2(cy - 20)} L${f2(cx + 6)},${f2(cy + 2)} H${f2(cx + 22)} V${f2(cy + 20)} Z" fill="#D9C4A0" ${st(1.4)}/><circle cx="${f2(cx - 3)}" cy="${f2(cy - 8)}" r="3" fill="#B79A6E"/><circle cx="${f2(cx - 3)}" cy="${f2(cy + 2)}" r="3" fill="#B79A6E"/>` }[p.icon || "phone"] || "";
      s += ic;
    } else if (p.kind === "caseswall") {
      // スマホケースの かべの たな
      for (const zb of [70, 130, 190]) { s += R(u0 + 10, V(zb), w - 20, 6, "#E8DCC6"); for (let x = u0 + 18, i = 0; x < u0 + w - 26; x += 22, i++) s += R(x, V(zb + 36), 16, 30, ["#F9D6E2", "#BFE0F0", "#FFF3C4", "#D4EFE2", "#E2D8EF", "#FFE1CC"][i % 6], `rx="3"`) + `<circle cx="${f2(x + 8)}" cy="${f2(V(zb + 22))}" r="3" fill="${["#F2A7B8", "#9FC7E8", "#F7D56A"][i % 3]}"/>`; }
    } else if (p.kind === "skyline") {
      // おおきな まど（いけぶくろの まち・サンシャイン60）
      const top = V(zt + 10), hh = zt - 20;
      s += R(u0 + 6, top, w - 12, hh, "#BFE3F2");
      s += `<rect x="${f2(u0 + 7)}" y="${f2(top + hh * 0.55)}" width="${f2(w - 14)}" height="${f2(hh * 0.45 - 1)}" fill="#DCEFF7"/>`;
      for (let x = u0 + 14, i = 0; x < u0 + w - 30; x += 26 + (i % 3) * 6, i++) { const bh = 30 + ((i * 37) % 60), bw = 18 + (i % 3) * 6; s += R(x, top + hh - bh, bw, bh - 1, ["#C9D3DA", "#B6C2CC", "#D8DEE3"][i % 3], `stroke-width="1"`); for (let k = 0; k < Math.floor(bh / 12); k++) s += `<rect x="${f2(x + 4)}" y="${f2(top + hh - bh + 6 + k * 12)}" width="${f2(bw - 8)}" height="4" fill="#EAF3F7"/>`; }
      const sx = u0 + w * 0.62; s += R(sx, top + 12, 34, hh - 13, "#A9B7C2", `stroke-width="1.2"`) + `<path d="M${f2(sx + 17)},${f2(top + 2)} V${f2(top + 12)}" ${st(1.4)}/>`;
      for (let x = u0 + 6 + (w - 12) / 3; x < u0 + w - 6; x += (w - 12) / 3) s += `<path d="M${f2(x)},${f2(top)} V${f2(top + hh)}" stroke="#8D949B" stroke-width="5"/>`;
    } else if (p.kind === "lightwall") {
      // かべの ブラケット ライトと ミラー
      for (let x = u0 + 40; x < u0 + w - 30; x += 90) s += R(x - 18, V(zt - 10), 36, 6, "#B9974A") + `<path d="M${f2(x - 14)},${f2(V(zt - 16))} L${f2(x - 20)},${f2(V(zt - 50))} H${f2(x + 20)} L${f2(x + 14)},${f2(V(zt - 16))} Z" fill="#FBEFC6" ${st(1.4)}/>`;
    } else return MallArt.wallPart.call(art, p, H, r, side);
    return s;
  }
  function wallText(g, p, H) {
    const u0 = p.from * T, w = (p.to - p.from) * T, V = (z) => H - z, zt = MallArt.ZTOP;
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
    if (p.kind === "kbrand") { g.fillStyle = "#FFFFFF"; g.font = `900 34px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "ネリカス でんき", u0 + w / 2 + 30, V(zt), w - 110); g.fillStyle = INK; g.font = `900 15px 'M PLUS Rounded 1c', sans-serif`; (p.lines || []).forEach((t, i) => g.fillText(t, u0 + 20 + i * ((w - 40) / 4) + ((w - 40) / 4 - 14) / 2, V(zt - 80), (w - 40) / 4 - 20)); }
    else if (p.kind === "kposter") { g.font = `900 15px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "", u0 + w / 2, V(zt - 20) + 94, w - 30); }
    else if (p.kind === "acwall") { g.font = `900 9px 'M PLUS Rounded 1c', sans-serif`; const n = p.n || 3, gap = w / n; for (let i = 0; i < n; i++) { const x = u0 + i * gap + (gap - 100) / 2, y = V(zt - 10 - (i % 2) * 50); g.fillText(["ひんやり", "しずか", "パワフル"][i % 3], x + 50, y + 66, 36); } }
    else if (p.kind === "theater") { g.fillStyle = "#FFFFFF"; g.font = `900 14px 'M PLUS Rounded 1c', sans-serif`; g.fillText(p.label || "", u0 + w / 2, V((p.z1 || H - 12) + 0) + 2, w - 80); }
    else MallArt.wallText.call(art, g, p, H);
    g.textBaseline = "alphabetic";
  }
  // 北の かべの 面に 描く（u: かべに そって 左から・v: うえから。おうちの 単位）
  const northWall = (ctx, sc, r, off) => { const H = r.wallH || 300, o = sc.toScreen(IsoVenue.p(0, 0, H), off), s = sc.s; ctx.translate(o.x, o.y); ctx.transform(A * s, B * s, 0, s, 0, 0); return H; };
  function under(ctx, sc, r, floor, off) {
    for (const p of (r.walls && r.walls.north) || []) {
      const u0 = p.from * T, w = (p.to - p.from) * T, zt = MallArt.ZTOP;
      if (p.kind === "tvwall") {
        const rows = p.rows || 2, cols = p.cols || 4, z0 = p.z0 || 70, z1 = p.z1 || zt + 30, cw = (w - 20) / cols, rh = (z1 - z0) / rows;
        ctx.save(); const H = northWall(ctx, sc, r, off);
        // ときどき ぜんぶの テレビで 1まいの 大きな 絵（みせの テレビの かべ）
        const big = Math.floor(G.t / 10) % 3 === 2;
        if (big) { ctx.save(); ctx.translate(u0 + 10, H - z1); ctx.beginPath(); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) ctx.rect(i * cw, j * rh, cw - 4, rh - 6); ctx.clip(); KadenItems.tvShow(ctx, 2, G.t, w - 20, z1 - z0); ctx.restore(); }
        else for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { ctx.save(); ctx.translate(u0 + 10 + i * cw, H - z1 + j * rh); KadenItems.tvShow(ctx, (i + j * 2 + Math.floor(G.t / 10)) % 4, G.t + i * 0.7, cw - 4, rh - 6); ctx.restore(); }
        ctx.restore();
      } else if (p.kind === "theater") {
        const z0 = p.z0 || 60, z1 = p.z1 || (r.wallH || 300) - 12;
        ctx.save(); const H = northWall(ctx, sc, r, off); ctx.translate(u0 + 30, H - z1 + 6);
        if (art.theaterShow) art.theaterShow(ctx, sc, r, w - 60, z1 - z0 - 12); else KadenItems.tvShow(ctx, Math.floor(G.t / 12) % 4, G.t, w - 60, z1 - z0 - 12);
        ctx.restore();
      } else if (p.kind === "acwall") {
        const n = p.n || 3, gap = w / n;
        ctx.save(); const H = northWall(ctx, sc, r, off); ctx.strokeStyle = "rgba(159,215,240,.8)"; ctx.lineWidth = 2;
        for (let i = 0; i < n; i++) { const x = u0 + i * gap + (gap - 100) / 2, y = H - (zt - 10 - (i % 2) * 50) + 36; for (let k = 0; k < 3; k++) { const u = (G.t * 0.6 + k / 3 + i * 0.2) % 1; ctx.globalAlpha = (1 - u) * 0.9; ctx.beginPath(); ctx.moveTo(x + 22 + k * 28, y + u * 26); ctx.quadraticCurveTo(x + 28 + k * 28, y + 6 + u * 26, x + 22 + k * 28 + Math.sin(u * 6 + k) * 6, y + 14 + u * 26); ctx.stroke(); } }
        ctx.restore();
      }
    }
  }

  Object.assign(art, {
    M: { ...MallArt.M, ...M }, L,
    MAT: {
      ...MallArt.MAT,
      kwhite: { c: ["#F7F6F2", "#EFEDE7"], line: "#DEDAD0", pat: "tile" }, kpink: { c: ["#FBE3EA", "#F6D9E2"], line: "#EAC3D0", pat: "tile" }, kgray: { c: ["#E3E7EC", "#DADFE5"], line: "#C6CDD5", pat: "tile" },
      klav: { c: ["#ECE6F4", "#E4DCEF"], line: "#D2C7E3", pat: "carpet" }, kmint: { c: ["#E2F2EA", "#D8EDE2"], line: "#C1DECF", pat: "tile" }, klemon: { c: ["#FFF6D8", "#FBF0C8"], line: "#EDDFA8", pat: "tile" },
      korange: { c: ["#FCEBDD", "#F8E2CF"], line: "#EBCBB0", pat: "tile" }, kblue: { c: ["#E3EEF7", "#DAE8F3"], line: "#C3D6E6", pat: "tile" }, kwood: { c: ["#E3C9A3", "#DABF97"], line: "#C2A47A", pat: "plank" },
      kdark: { c: ["#D9DCE3", "#D1D5DD"], line: "#BCC1CC", pat: "carpet" }, kred: { c: ["#FBE0DC", "#F7D6D1"], line: "#EBBFB8", pat: "carpet" }, ktheater: { c: ["#8E6E78", "#86666F"], line: "#76585F", pat: "carpet" },
      ksticker: { c: ["#FDEEF4", "#F9E6EE"], line: "#EFCFDC", pat: "carpet" },
    },
    models: new Map(),
    modelKey(f) { return "kaden:" + f.kind + ":" + f.w + "x" + f.h + ":" + (f.variant ?? "") + ":" + (f.shop || "") + ":" + (f.item || "") + ":" + (f.dir || "") + ":" + (f.col || "") + ":" + (f.z || ""); },
    wallPart, wallText, under, SHOPS,
    backdrop(r) { return r && r.sky ? ["#8FB9D6", "#DCEBF3"] : ["#CFC6B6", "#E4DDD0"]; },
    tick(sc, dt) { MallArt.tick.call(this, sc, dt); if (typeof KadenHall !== "undefined") KadenHall.tick(sc, dt); },
    async interact(sc, f) { if (typeof KadenHall !== "undefined" && (await KadenHall.interact(sc, f))) return true; return MallArt.interact.call(this, sc, f); },
  });
  return art;
})();
