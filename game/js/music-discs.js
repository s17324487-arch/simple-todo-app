// レアの 音楽プレイヤーと ディスク（ROADMAP M9 の ART-05）。
// プレイヤー 3しゅ（ラジカセ・ちくおんき・ジュークボックス）を へやに おいて タップ → もって いる ディスクを えらぶと その きょくが ながれる。
// ディスクは おてつだいの ほうび（その おみせの きょく）と、たんけんの たからばこ（その ばしょの きょく）で 手に入る。
// はじめての ディスクで ラジカセ、ディスク 3まいから たからばこで まれに ちくおんき、8まいで ジュークボックス（それぞれ 名曲の ディスクが 1まい つく）。
// セーブは Save.d.discs（id → 手に入れた 日）だけ。プレイヤーは ふつうの 家具（Save.d.furn）。
const MusicDiscs = (() => {
  // ---- ディスクだけの きょく: 作曲者が なくなって 70年 いじょう たった 名曲（パブリックドメイン）----
  // おとは Mutopia Project の 楽譜（LilyPond の 原本）から 写した。ModernMusic の 形（1トークン = step・8小節で 1まわり）。
  // source は 出典（docs/screenshots/music-discs/README.md にも 書く）。
  const rep = (s, n) => Array(n).fill(s).join(" | ");
  const pd = (title, bpm, key, source, tracks, swing = 0) => ({ bpm, title, modern: true, swing, key, groove: "classic", disc: true, source, tracks });
  // きらきらぼし（モーツァルト「ああ ママに 言うわ」による 12の 変奏曲 K.265 の 主題）: 2/4・1トークン = 8分音符
  SONGS.disc_twinkle = pd("きらきらぼし", 100, "C", { composer: "W. A. Mozart（1756-1791）", work: "12 Variations on \"Ah vous dirai-je, Maman\" K.265 主題", score: "Mutopia #2236", license: "Public Domain" }, [
    { instrument: "mallet", vol: 0.18, gate: 0.82, pan: 0.12, notes: "C5 . C5 . | G5 . G5 . | A5 . A5 . | G5 . G5 . | F5 . F5 . | E5 . E5 . | D5 . D5 E5 | C5 . . . | G5 . G5 . | F5 . F5 . | E5 . E5 . | D5 . D5 . | G5 . G5 . | F5 . F5 . | E5 . E5 F5 | E5 . D5 ." },
    { instrument: "epiano", vol: 0.1, gate: 0.8, pan: -0.2, notes: "C4+E4+G4 . E4+G4 . | C4+E4+G4 . E4+G4 . | F3+A3+C4 . A3+C4 . | C4+E4+G4 . E4+G4 . | G3+B3+D4+F4 . B3+D4 . | A3+C4+E4 . C4+E4 . | F3+A3+C4 . G3+B3+D4 . | C4+E4+G4 . . . | C4+E4+G4 . E4+G4 . | G3+B3+D4+F4 . B3+D4 . | C4+E4+G4 . E4+G4 . | G3+B3+D4 . B3+D4 . | C4+E4+G4 . E4+G4 . | G3+B3+D4+F4 . B3+D4 . | C4+E4+G4 . E4+G4 . | G3+B3+D4 . . ." },
    { instrument: "bass", vol: 0.19, gate: 0.78, pan: 0, notes: "C3 . G2 . | C3 . G2 . | F2 . C3 . | C3 . G2 . | G2 . D3 . | A2 . E2 . | F2 . G2 . | C3 . . . | C3 . G2 . | G2 . D3 . | C3 . G2 . | G2 . D3 . | C3 . G2 . | G2 . D3 . | C3 . G2 . | G2 . . ." },
    { instrument: "pad", vol: 0.05, gate: 0.95, pan: -0.06, notes: "C4+E4+G4 . . . | . . . . | F3+A3+C4 . . . | C4+E4+G4 . . . | G3+B3+D4 . . . | A3+C4+E4 . . . | F3+A3+C4 . G3+B3+D4 . | C4+E4+G4 . . . | C4+E4+G4 . . . | G3+B3+D4 . . . | C4+E4+G4 . . . | G3+B3+D4 . . . | C4+E4+G4 . . . | G3+B3+D4 . . . | C4+E4+G4 . . . | G3+B3+D4 . . ." },
    { drum: true, vol: 0.06, notes: "k _ s _ k _ s _" },
    { drum: true, vol: 0.014, pan: 0.3, notes: "_ h _ h _ h _ h" },
  ], 0.04);
  // カノン（パッヘルベル「3つの ヴァイオリンと 通奏低音の ための カノン」）: 4/4・1トークン = 8分音符。低音は 2小節の くりかえし
  const canonBass = "D3 . A2 . B2 . F#2 . | G2 . D2 . G2 . A2 .", canonPad = "D4+F#4+A4 . C#4+E4+A4 . B3+D4+F#4 . C#4+F#4+A4 . | B3+D4+G4 . A3+D4+F#4 . B3+D4+G4 . C#4+E4+A4 .";
  SONGS.disc_canon = pd("カノン", 72, "D", { composer: "J. Pachelbel（1653-1706）", work: "Canon per 3 Violini e Basso", score: "Mutopia #2047（楽譜の 清書は CC BY 4.0・Michael Fischer v. Mollard）", license: "Public Domain（作品）" }, [
    { instrument: "piano", vol: 0.16, gate: 0.9, pan: 0.14, notes: "F#5 . E5 . D5 . C#5 . | B4 . A4 . B4 . C#5 . | D5 . C#5 . B4 . A4 . | G4 . F#4 . G4 . E4 . | D4 F#4 A4 G4 F#4 D4 F#4 E4 | D4 B3 D4 A4 G4 B4 A4 G4 | F#4 D4 E4 C#5 D5 F#5 A5 A4 | B4 G4 A4 F#4 D4 D5 D5 C#5" },
    { instrument: "pad", vol: 0.065, gate: 0.96, pan: -0.16, notes: rep(canonPad, 4) },
    { instrument: "bass", vol: 0.2, gate: 0.9, pan: 0, notes: rep(canonBass, 4) },
    { instrument: "epiano", vol: 0.06, gate: 0.7, pan: -0.28, notes: rep("_ D4+F#4 _ C#4+E4 _ B3+D4 _ C#4+F#4 | _ B3+D4 _ A3+D4 _ B3+D4 _ C#4+E4", 4) },
  ]);
  // トルコ こうしんきょく（モーツァルト ピアノソナタ 第11番 K.331 だい3がくしょう）: 2/4・1トークン = 16分音符（bpm 200 = 4分音符 100）
  SONGS.disc_turkish = pd("トルコ こうしんきょく", 200, "Am", { composer: "W. A. Mozart（1756-1791）", work: "Piano Sonata No.11 K.331 III. Alla Turca", score: "Mutopia #108", license: "Public Domain" }, [
    { instrument: "piano", vol: 0.17, gate: 0.72, pan: 0.12, notes: "C5 . _ _ D5 C5 B4 C5 | E5 . _ _ F5 E5 D#5 E5 | B5 A5 G#5 A5 B5 A5 G#5 A5 | C6 . . . A5 . C6 . | B5 . A5 . G5 . A5 . | B5 . A5 . G5 . A5 . | B5 . A5 . G5 . F#5 . | E5 . . . B4 A4 G#4 A4" },
    { instrument: "piano", vol: 0.1, gate: 0.6, pan: -0.18, notes: "A3 . C4+E4 . C4+E4 . C4+E4 . | A3 . C4+E4 . C4+E4 . C4+E4 . | A3 . C4+E4 . A3 . C4+E4 . | A3 . C4+E4 . C4+E4 . C4+E4 . | E3 . B3+E4 . B3+E4 . B3+E4 . | E3 . B3+E4 . B3+E4 . B3+E4 . | E3 . B3+E4 . B2 . B3 . | E3 . . . _ _ _ _" },
    { instrument: "bass", vol: 0.2, gate: 0.7, pan: 0, notes: "A2 . _ _ A2 . _ _ | A2 . _ _ A2 . _ _ | A2 . _ _ A2 . _ _ | A2 . _ _ A2 . _ _ | E2 . _ _ E2 . _ _ | E2 . _ _ E2 . _ _ | E2 . _ _ B1 . _ _ | E2 . . . _ _ _ _" },
    { instrument: "pad", vol: 0.04, gate: 0.95, pan: -0.06, notes: "A3+C4+E4 . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | E3+G3+B3 . . . . . . . | . . . . . . . . | E3+G3+B3 . . . D#4+F#4+B3 . . . | E3+G#3+B3 . . . _ _ _ _" },
    { drum: true, vol: 0.1, notes: "k _ _ _ s _ _ _" },
    { drum: true, vol: 0.02, pan: 0.3, notes: "h _ h _ h _ h _" },
  ]);
  // アイネ クライネ（モーツァルト「アイネ・クライネ・ナハトムジーク」K.525 だい1がくしょう）: 4/4・1トークン = 8分音符
  SONGS.disc_nacht = pd("アイネ クライネ", 120, "G", { composer: "W. A. Mozart（1756-1791）", work: "Eine kleine Nachtmusik K.525 I. Allegro", score: "Mutopia #900", license: "Public Domain" }, [
    { instrument: "pluck", vol: 0.18, gate: 0.72, pan: 0.12, notes: "G5 . _ D5 G5 . _ D5 | G5 D5 G5 B5 D6 . _ _ | C6 . _ A5 C6 . _ A5 | C6 A5 F#5 A5 D5 . _ _ | G5 _ G5 . . B5 A5 G5 | G5 F#5 F#5 . . A5 C6 F#5 | A5 G5 G5 . . B5 A5 G5 | G5 F#5 F#5 . . A5 C6 F#5" },
    { instrument: "epiano", vol: 0.1, gate: 0.7, pan: -0.2, notes: "G3+B3+D4 . _ _ G3+B3+D4 . _ _ | G3+B3+D4 . _ _ G3+B3+D4 . _ _ | F#3+A3+C4+D4 . _ _ F#3+A3+C4+D4 . _ _ | F#3+A3+C4+D4 . _ _ F#3+A3+D4 . _ _ | G3+B3+D4 . _ G3+B3+D4 _ G3+B3+D4 _ G3+B3+D4 | F#3+A3+C4 . _ F#3+A3+C4 _ F#3+A3+C4 _ F#3+A3+C4 | G3+B3+D4 . _ G3+B3+D4 _ G3+B3+D4 _ G3+B3+D4 | F#3+A3+C4 . _ F#3+A3+C4 _ F#3+A3+C4 _ F#3+A3+C4" },
    { instrument: "bass", vol: 0.22, gate: 0.75, pan: 0, notes: "G2 . _ D2 G2 . _ D2 | G2 D2 G2 B2 D3 . _ _ | C3 . _ A2 C3 . _ A2 | C3 A2 F#2 A2 D2 . _ _ | G2 . G2 . G2 . G2 . | D2 . D2 . D2 . D2 . | G2 . G2 . G2 . G2 . | D2 . D2 . D2 . D2 ." },
    { instrument: "pad", vol: 0.04, gate: 0.95, pan: -0.06, notes: "G3+B3+D4 . . . . . . . | . . . . . . . . | F#3+A3+C4 . . . . . . . | . . . . . . . . | G3+B3+D4 . . . . . . . | F#3+A3+C4 . . . . . . . | G3+B3+D4 . . . . . . . | F#3+A3+C4 . . . . . . ." },
    { drum: true, vol: 0.12, notes: "k _ s _ k _ s _" },
    { drum: true, vol: 0.024, pan: 0.3, notes: "h h h h h h h h" },
  ], 0.03);

  // ---- ディスク（どこで 手に入るか）----
  const shopDisc = (shop, color) => ({ id: "disc_shop_" + shop, song: "shop_" + shop, color, from: { shop } });
  const DISCS = [
    { id: "disc_twinkle", song: "disc_twinkle", color: "#F7D56A", from: { starter: true } },
    shopDisc("crepe", "#F8A5C2"), shopDisc("bakery", "#F2C27B"), shopDisc("florist", "#B5E08A"), shopDisc("dentist", "#8FD3F4"),
    shopDisc("cake", "#EDBAC6"), shopDisc("groom", "#BFDED7"), shopDisc("burger", "#E5C69F"), shopDisc("relay", "#AEBFDF"),
    { id: "disc_meadow", song: "meadow", color: "#A9D6A0", from: { map: "meadow" } },
    { id: "disc_forest", song: "forest", color: "#7FAE6C", from: { map: "forest" } },
    { id: "disc_cave", song: "cave", color: "#9C8FB8", from: { map: "cave" } },
    { id: "disc_canon", song: "disc_canon", color: "#3E4F8C", from: { map: "cave" } },
    { id: "disc_town", song: "town", color: "#F3D98A", from: { town: true } },
    { id: "disc_city", song: "city", color: "#E77E6E", from: { town: true } },
    { id: "disc_heiwadai", song: "heiwadai", color: "#C9B6E0", from: { town: true } },
    { id: "disc_harbor", song: "harbor", color: "#6FA9CF", from: { town: true } },
    { id: "disc_coast", song: "coast", color: "#9CD8E0", from: { town: true } },
    { id: "disc_house", song: "house", color: "#F4E1B8", from: { town: true } },
    { id: "disc_aquarium", song: "aquarium", color: "#5FAFCB", from: { town: true } },
    { id: "disc_nacht", song: "disc_nacht", color: "#B69BD8", from: { gramophone: true } },
    { id: "disc_turkish", song: "disc_turkish", color: "#F29A5B", from: { jukebox: true } },
  ];
  const INDEX = Object.fromEntries(DISCS.map((d) => [d.id, d]));
  const title = (d) => SONGS[d.song]?.title || d.id;
  const PLAYERS = {
    player_boombox: { name: "ぽかぽか ラジカセ", w: 64, depth: 32, h: 46, desc: "ディスクを いれると きょくが ながれる ラジカセ。スピーカーが ぷるぷる ゆれるよ。" },
    player_gramophone: { name: "きんの ちくおんき", w: 60, depth: 50, h: 96, desc: "ラッパから やさしい おとが でる ちくおんき。レコードが くるくる まわるよ。" },
    player_jukebox: { name: "ほしの ジュークボックス", w: 64, depth: 40, h: 104, desc: "ディスクを 8まい あつめた ごほうび。ひかりが にじいろに かわるよ。" },
  };
  for (const [id, p] of Object.entries(PLAYERS)) {
    const f = { id, name: p.name, price: 0, rare: true, player: true, kind: "floor", w: p.w, depth: p.depth, h: p.h, comfort: 6, interactive: true, desc: p.desc };
    FURNITURE.push(f); FURN_INDEX[id] = f;
    FURN_ART[id] = () => HomeDesign.model(id).full;
  }

  // ---- 手に入れる ----
  const has = (id) => !!Save.d.discs?.[id];
  const count = () => DISCS.filter((d) => has(d.id)).length;
  const giveFurn = (id) => { Save.d.furn[id] = (Save.d.furn[id] || 0) + 1; return `かぐ「${FURN_INDEX[id].name}」を てにいれた！ おうちの「もようがえ」で おけるよ。`; };
  // ディスクを 1まい。はじめての ディスクで ラジカセと「3にんの テーマ」、8まいで ジュークボックスと「ぽかぽか マーチ」
  function grant(id) {
    const d = INDEX[id];
    if (!d || has(id)) return [];
    if (!Save.d.discs) Save.d.discs = {};
    Save.d.discs[id] = U.today();
    const out = [`ディスク「${title(d)}」を てにいれた！`];
    if (!Save.d.furn.player_boombox && !Object.keys(PLAYERS).some((p) => Save.d.furn[p])) {
      out.push(giveFurn("player_boombox") + " ディスクは ラジカセで きけるよ。");
      if (!has("disc_twinkle")) { Save.d.discs.disc_twinkle = U.today(); out.push(`おまけの ディスク「${title(INDEX.disc_twinkle)}」も ついて きた！`); }
    }
    if (count() >= 8 && !Save.d.furn.player_jukebox) {
      out.push(giveFurn("player_jukebox"));
      if (!has("disc_turkish")) { Save.d.discs.disc_turkish = U.today(); out.push(`ディスク「${title(INDEX.disc_turkish)}」も もらった！`); }
    }
    Save.mark();
    return out;
  }
  const pick = (list, rnd) => list[Math.floor(rnd() * list.length) % list.length];
  let lucky = false; // PokaDebug.discLuck(true) で かならず 出る（テスト用）
  const chance = () => (lucky ? () => 0 : Math.random);
  // おてつだいの あと: ○いじょうが 6わり で その おみせの ディスク（◎が はんぶんで 6わり、ほかは 35%）。もう あれば 町の ディスクを 20%
  function fromShop(shop, ranks, rnd = chance()) {
    if (!ranks.length) return [];
    const good = ranks.filter((r) => r >= 2).length / ranks.length, perfect = ranks.filter((r) => r === 3).length / ranks.length;
    if (good < 0.6) return [];
    const own = DISCS.find((d) => d.from.shop === shop);
    if (own && !has(own.id)) return rnd() < (perfect >= 0.5 ? 0.6 : 0.35) ? grant(own.id) : [];
    const town = DISCS.filter((d) => d.from.town && !has(d.id));
    return town.length && rnd() < (perfect >= 0.5 ? 0.3 : 0.2) ? grant(pick(town, rnd).id) : [];
  }
  // たからばこ: その ばしょの ディスク 40%、なければ 町の ディスク 15%。ディスクが 3まい いじょうで ちくおんきが 25%
  function fromChest(map, rnd = chance()) {
    const out = [], here = DISCS.filter((d) => d.from.map === map && !has(d.id)), town = DISCS.filter((d) => d.from.town && !has(d.id)), r = rnd();
    if (here.length && r < 0.4) out.push(...grant(pick(here, rnd).id));
    else if (town.length && r < 0.55) out.push(...grant(pick(town, rnd).id));
    if (count() >= 3 && !Save.d.furn.player_gramophone && rnd() < 0.25) {
      out.push(giveFurn("player_gramophone"));
      if (!has("disc_nacht")) { Save.d.discs.disc_nacht = U.today(); out.push(`ちくおんきに ディスク「${title(INDEX.disc_nacht)}」が はいって いた！`); }
      Save.mark();
    }
    return out;
  }

  // ---- きく ----
  const art = (d, size = 40) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-22 -22 44 44" width="${size}" height="${size}"><circle r="20" fill="#2E2B38" stroke="${INK}" stroke-width="2"/><circle r="15" fill="none" stroke="#4A4658" stroke-width="1"/><circle r="11" fill="none" stroke="#4A4658" stroke-width="1"/><circle r="8" fill="${d.color}" stroke="${INK}" stroke-width="1.4"/><circle r="1.8" fill="#FFFFFF"/><path d="M-14,-9 A17,17 0 0 1 -4,-16" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-opacity=".5"/></svg>`;
  function play(sc, it, d) {
    Sound.bgm(d.song);
    sc.music = { uid: it.uid, id: it.id, disc: d.id, song: d.song, t0: G.t, next: 5 };
    const kids = sc.chars.filter((c) => !c.hidden), kid = kids[Math.floor(Math.random() * kids.length)];
    if (kid) { HomeLife.say(sc, kid.id, `「${title(d)}」だ！ いい きょく♪`); sc.fx("note", kid); }
  }
  function stop(sc) { sc.music = null; Sound.bgm("house"); }
  function open(sc, it) {
    const owned = DISCS.filter((d) => has(d.id)), playing = sc.music && sc.music.uid === it.uid ? INDEX[sc.music.disc] : null;
    const body = U.el("div", { class: "disc-picker" });
    body.append(U.el("p", { text: playing ? `いまは「${title(playing)}」が ながれて いるよ。` : owned.length ? "きく ディスクを えらんでね。" : "ディスクが まだ ないよ。おてつだい や たんけんの たからばこで みつけよう！" }));
    const grid = U.el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
    let m = null;
    for (const d of owned) {
      const b = UI.btn(`${art(d, 34)}<span>${title(d)}</span>`, () => { Sound.se("ok"); play(sc, it, d); m.close(); }, playing === d ? "yellow" : "");
      b.style.cssText = "min-height:52px;display:flex;align-items:center;gap:6px;text-align:left;padding:6px 8px;font-size:14px;line-height:1.2";
      b.setAttribute("aria-label", title(d));
      grid.append(b);
    }
    body.append(grid, U.el("p", { class: "note", text: `あつめた ディスク ${owned.length} / ${DISCS.length}` }));
    m = UI.modal({ title: FURN_INDEX[it.id].name, body, cls: "full", footer: playing ? UI.btn("とめる", () => { Sound.se("cancel"); stop(sc); m.close(); }, "wide") : null });
    return m;
  }

  // ---- へやの プレーヤー（FurnModels の 立体モデルと FurnLive の うごき）----
  const S = FurnModels.shapes, MINT = ["#A9D6C2", "#86B39F", "#C3E3D4"], GOLD = "#E3C06B", GOLDD = "#B9974A";
  FurnModels.register("player_boombox", (k) => {
    const { box, prism, shape, FR, TP, lineOn, rod, ball, shadow } = k;
    let s = shadow(0.12, 3, 6);
    s += prism(FR(-4), S.rr(-31, 2, 62, 34, 7), [0, -24, 0], MINT[0], MINT[1]);
    for (const x of [-17, 17]) s += shape(FR(-3.9), S.ov(x, 18, 11, 11, 28), "#4A4658", 1.3) + shape(FR(-3.8), S.ov(x, 18, 7.5, 7.5, 24), "#6B6680", 1) + shape(FR(-3.7), S.ov(x, 18, 3, 3, 16), "#2E2B38", 0.9);
    s += shape(FR(-3.9), S.rr(-6, 11, 12, 15, 2), "#FFF6E3", 1.1) + shape(FR(-3.8), S.rr(-4, 15, 8, 6, 1), "#9CC7E6", 0.8);
    s += shape(FR(-3.9), S.rr(-27, 30, 54, 3, 1.4), "#FFFFFF", 0, 'fill-opacity=".45"');
    for (const [x, c] of [[-10, "#F2A7B8"], [-3, "#F7D56A"], [4, "#9CC7E6"], [11, "#E77E6E"]]) s += box(x, -18, 5, 5, 36, 2, [c, shade(c, -0.2), shade(c, 0.2)], 1);
    s += rod([[-20, -16, 36], [-20, -16, 44], [20, -16, 44], [20, -16, 36]], "#4A4658", 2.2) + rod([[24, -22, 36], [34, -26, 58]], "#C9CED6", 1) + ball(34, -26, 58.6, 1.5, "#C9CED6", 0.9, 0);
    return s;
  });
  FurnModels.register("player_gramophone", (k) => {
    const { box, shape, TP, lineOn, rod, ball, shadow, at, cyl, prism } = k;
    let s = shadow(0.12, 4, 10);
    s += box(-26, -44, 52, 40, 0, 26, ["#9A6A45", "#7A5236", "#B8845A"]) + lineOn(k.FR(-3.9), [[-22, 5], [22, 5], [22, 21], [-22, 21], [-22, 5]], "#C9A06A", 1.4) + ball(0, -3.8, 13, 1.6, GOLD, 1, 0.4);
    s += cyl(0, -24, 26, 18, 2.4, "#4A4658", "#3A3645", 1.2) + shape(TP(28.5), S.ov(0, -24, 16, 16, 36), "#2E2B38", 1.1) + lineOn(TP(28.6), S.close(S.ov(0, -24, 12, 12, 30)), "#4A4658", 0.9) + lineOn(TP(28.6), S.close(S.ov(0, -24, 8.5, 8.5, 26)), "#4A4658", 0.9);
    s += k.L(shape(TP(28.7), S.ov(0, -24, 5, 5, 20), "#F2A7B8", 1) + shape(TP(28.8), S.ov(0, -24, 1, 1, 8), "#FFFFFF", 0));
    s += rod([[20, -40, 26], [20, -40, 34], [8, -30, 31]], GOLDD, 1.8);
    // ラッパ（ちょうの 花の 形）: 首から ななめ上へ
    s += rod([[20, -40, 34], [16, -36, 50], [10, -32, 62]], GOLD, 3.4);
    s += at(8, -30, 62, `<g transform="rotate(-18)"><path d="M-2,4 C-18,-6 -30,-26 -26,-40 C-12,-34 12,-34 26,-40 C30,-26 18,-6 2,4 Z" fill="${GOLD}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-26,-40 C-12,-44 12,-44 26,-40 C12,-32 -12,-32 -26,-40 Z" fill="#7A5A2E" stroke="${INK}" stroke-width="1.3"/><path d="M-14,-10 C-18,-20 -20,-30 -18,-36 M0,0 V-34 M14,-10 C18,-20 20,-30 18,-36" fill="none" stroke="${GOLDD}" stroke-width="1.2"/></g>`, 34, 52);
    return s;
  });
  FurnModels.register("player_jukebox", (k) => {
    const { box, prism, shape, FR, TP, lineOn, shadow, onP } = k;
    const BODY = ["#E77E6E", "#C9604F", "#F29C8E"];
    let s = shadow(0.12, 3, 8);
    s += prism(FR(-6), S.arch(-32, 32, 0, 72, 102), [0, -32, 0], BODY[0], BODY[1]);
    s += shape(FR(-5.9), S.arch(-26, 26, 38, 70, 94), "#2E2B38", 1.3);
    for (const [i, c] of ["#F7D56A", "#9CC7E6", "#F2A7B8"].entries()) s += k.L(lineOn(FR(-5.8), S.arch(-29 + i * 1.6, 29 - i * 1.6, 36, 71 - i * 0.4, 99 - i * 1.6).slice(2), c, 2.2));
    s += shape(FR(-5.8), S.rr(-20, 44, 40, 22, 3), "#FFF6E3", 1.1);
    for (let i = 0; i < 5; i++) s += shape(FR(-5.7), S.ov(-14 + i * 7, 55, 3.2, 8, 16), ["#F2A7B8", "#F7D56A", "#9CC7E6", "#A9D6C2", "#C9B6E0"][i], 0.9);
    s += shape(FR(-5.9), S.rr(-24, 6, 48, 26, 4), "#C9604F", 1.2);
    for (let z = 10; z < 30; z += 4) s += lineOn(FR(-5.8), [[-20, z], [20, z]], "#8C3F33", 1.4);
    for (const [x, c] of [[-16, "#F7D56A"], [-8, "#9CC7E6"], [0, "#F2A7B8"], [8, "#A9D6C2"], [16, "#FFFFFF"]]) s += k.ball(x, -5, 36.5, 1.6, c, 0.9, 0.3);
    s += onP(FR(-5.7), -6, 106, 12, 10, `<path d="${starPath(6, 5, 5, 2.2)}" fill="${GOLD}" stroke="${INK}" stroke-width="1"/>`);
    return s;
  });
  // うごき: ならして いる ときの スピーカー・レコード・ひかり、音ぷ、3人の ♪
  const playingOn = (sc, it) => sc.music && sc.music.uid === it.uid && Sound.cur?.name === sc.music.song;
  const note = (ctx, x, y, s, i, a) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    ctx.fillStyle = ["#F2A7B8", "#9CC7E6", "#F7D56A", "#A9D6C2"][i % 4]; ctx.beginPath(); ctx.ellipse(-2.6, 5, 3.6, 2.8, -0.4, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.6, 4.4); ctx.lineTo(0.6, -8); ctx.quadraticCurveTo(5, -6, 6.4, -2.4); ctx.stroke(); ctx.restore();
  };
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  const beat = (sc) => { const b = SONGS[sc.music.song]?.bpm || 100, t = (G.t - sc.music.t0) * (b / 60); return { t, pulse: Math.max(0, 1 - (t % 1) * 3) }; };
  const common = (ctx, sc, it, r, top) => {
    const P = mapper(sc, it, r), k = G.t - sc.music.t0;
    for (let j = 0; j < 3; j++) { const a = (k * 0.55 + j / 3) % 1, p = P(top[0] - 10 + j * 10, top[1], top[2] + a * 36); note(ctx, p.x + Math.sin(a * 6 + j) * 5 * P.s, p.y, P.s, j, Math.min(1, (1 - a) * 1.6)); }
    if ((sc.music.next -= 1 / 60) <= 0) { sc.music.next = 6 + Math.random() * 3; const kids = sc.chars.filter((c) => !c.hidden && !c.activity && c.state === "idle"); const c = kids[Math.floor(Math.random() * kids.length)]; if (c) sc.fx("note", c); }
    return P;
  };
  FurnLive.register("player_boombox", {
    tap(sc, it) { open(sc, it); },
    draw(ctx, sc, it, r) {
      if (!playingOn(sc, it)) return;
      const P = common(ctx, sc, it, r, [0, -18, 50]), { pulse } = beat(sc);
      for (const x of [-17, 17]) { const c = P(x, -3.6, 18); ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.4})`; ctx.lineWidth = 1.6 * P.s; ctx.beginPath(); ctx.ellipse(c.x, c.y, (8 + pulse * 3) * P.s, (8 + pulse * 3) * P.s * 0.9, 0, 0, 7); ctx.stroke(); }
    },
  });
  FurnLive.register("player_gramophone", {
    tap(sc, it) { open(sc, it); },
    draw(ctx, sc, it, r) {
      const P = mapper(sc, it, r), on = playingOn(sc, it), ang = on ? (G.t - sc.music.t0) * 3.2 : 0, d = on ? INDEX[sc.music.disc] : null;
      // レコードの ラベル（まわる）
      const c = P(0, -24, 28.8), rx = 5 * 1.24 * P.s, ry = 5 * 0.68 * P.s;
      ctx.fillStyle = d ? d.color : "#F2A7B8"; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(ang) * rx * 0.6, c.y + Math.sin(ang) * ry * 0.6, 1.2 * P.s, 0.8 * P.s, 0, 0, 7); ctx.fill();
      if (on) common(ctx, sc, it, r, [0, -30, 90]);
    },
  }, true);
  FurnLive.register("player_jukebox", {
    tap(sc, it) { open(sc, it); },
    draw(ctx, sc, it, r) {
      const P = mapper(sc, it, r), on = playingOn(sc, it), k = on ? G.t - sc.music.t0 : 0;
      const cols = ["#F7D56A", "#9CC7E6", "#F2A7B8", "#A9D6C2", "#C9B6E0"];
      for (let i = 0; i < 3; i++) {
        const pts = S.arch(-29 + i * 1.6, 29 - i * 1.6, 36, 71 - i * 0.4, 99 - i * 1.6).slice(2).map(([x, z]) => P(x, -5.7, z));
        ctx.strokeStyle = cols[(i + Math.floor(k * 2)) % cols.length]; ctx.globalAlpha = on ? 0.95 : 0.8; ctx.lineWidth = 2.2 * P.s; ctx.lineCap = "round"; ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (on) {
        for (let i = 0; i < 6; i++) { const a = (k * 0.5 + i / 6) % 1, p = P(i % 2 ? 27 : -27, -5.6, 38 + a * 30); ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(p.x, p.y, 1.3 * P.s, 0, 7); ctx.fill(); }
        common(ctx, sc, it, r, [0, -20, 110]);
      }
    },
    light(ctx, sc, it, r) { if (!playingOn(sc, it)) return; const P = mapper(sc, it, r), p = P(0, -2, 60), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 90 * P.s); g.addColorStop(0, "rgba(255,170,200,.28)"); g.addColorStop(1, "rgba(255,170,200,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 90 * P.s, 0, 7); ctx.fill(); },
  }, true);

  // ---- 手に入る ところに つなぐ（おてつだいの けっか・たからばこ）----
  {
    const results = ShopScene.prototype.results;
    ShopScene.prototype.results = function (interrupted = false) {
      const got = !this.paid && !interrupted ? fromShop(this.shopId, this.ranks || []) : [];
      if (!got.length) return results.call(this, interrupted);
      // けっかの まどに「ディスクを てにいれた」を 足す（minigames.js は かえない）
      const modal = UI.modal;
      UI.modal = function (o) { UI.modal = modal; if (o && o.body && o.title === "きょうの けっか") for (const t of got) o.body.append(U.el("div", { class: "note", text: t })); return modal.call(this, o); };
      Sound.se("sparkle");
      return Promise.resolve(results.call(this, interrupted)).finally(() => { if (UI.modal !== modal) UI.modal = modal; });
    };
    // たからばこ: 中みの あとに「ディスクを てにいれた」を 1まいずつ 出す（ながい 文が まどから はみ出さない ように）
    let chestNews = null;
    const give = Loot.give;
    Loot.give = function (loot, opts = {}) {
      const msg = give.call(this, loot, opts);
      if (opts.chest) { const got = fromChest(G.sceneName === "world" ? G.scene.mapId : null); if (got.length) chestNews = got; }
      return msg;
    };
    const openChest = WorldScene.prototype.openChest;
    WorldScene.prototype.openChest = async function (c) {
      chestNews = null;
      await openChest.call(this, c);
      const got = chestNews; chestNews = null;
      if (got) { Sound.se("sparkle"); await UI.say(got.map((text) => ({ name: "たからばこ", text }))); }
    };
  }

  return { DISCS, INDEX, PLAYERS, has, count, grant, fromShop, fromChest, open, play, stop, title, art, luck(on) { lucky = !!on; return lucky; } };
})();
