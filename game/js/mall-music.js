// サンシャインいけぶ の 店内 BGM（フロアごと）。どれも 作曲者が なくなって 70年 いじょう たった 名曲（パブリックドメイン）で、
// 楽譜は Mutopia Project の LilyPond 原本（GitHub の MutopiaProject/MutopiaProject）から 写した。音の たかさ・ながさは 楽譜の まま、
// 楽器の わりふり（なにで ならすか）と ベース・パッド・ドラムの そえものは この ゲームの アレンジ。
// ModernMusic の 形（1トークン = step・どの パートも 64 step で 1まわり）。出典は docs/screenshots/mall/README.md にも 書く。
const MallMusic = {
  SONGS: {
    // 1F（ふく・かぐ の おおどおり と ふんすい ひろば）: ヘンデル「ガヴォット」（エイルズフォード 小品集）。4/4・1トークン = 8分音符・はじめの 8小節（さいごの 1拍は くりかえしの アウフタクト）
    mall_1f: {
      title: "ガヴォット", bpm: 96, key: "G", modern: true, groove: "classic", swing: 0, mall: 1,
      source: { composer: "G. F. Händel（1685-1759）", work: "Gavotte（Aylesford Pieces）", score: "Mutopia #151（Edition Schott 1930 に もとづく）", license: "Public Domain" },
      tracks: [
        { instrument: "pluck", vol: 0.17, gate: 0.78, pan: 0.14, notes: "B4 . A4 G4 D5 . E5 F#5 | G5 . . . . . G5 F#5 | F#5 E5 E5 D5 D5 C5 C5 B4 | A4 . . . . . G4 A4 | B4 . A4 G4 D5 . E5 F#5 | G5 . . . . . A5 G5 | F#5 . E5 D5 F#5 . E5 D5 | D5 . . . . . G4 A4" },
        { instrument: "epiano", vol: 0.09, gate: 0.86, pan: -0.2, notes: "_ _ _ _ B4 . A4 . | B4 . . . . . D5 . | _ _ G4 . F#4 . G4 . | F#4 . . . . . _ _ | _ _ _ _ B4 . A4 . | B4 . . . . . E5 . | A4+D5 . B4 . A4+D5 . A4+C#5 . | F#4+A4 . . . . . _ _" },
        { instrument: "bass", vol: 0.19, gate: 0.72, pan: 0, notes: "G3 . G2 . G3 . F#3 . | E3 . E2 . E3 . B2 . | C3 . B2 . A2 . G2 . | D3 . A2 . D2 . _ _ | G3 . G2 . G3 . F#3 . | E3 . E2 . E3 . C#3 . | D3 . G3 . A3 . A2 . | D3 . A2 . D2 . _ _" },
        { instrument: "pad", vol: 0.04, gate: 0.95, pan: -0.06, notes: "G3+B3+D4 . . . . . . . | E3+G3+B3 . . . . . . . | C4+E4 . B3+D4+G4 . A3+D4+F#4 . G3+D4 . | D3+F#3+A3 . . . . . . . | G3+B3+D4 . . . . . . . | E3+G3+B3 . . . . . A3+C#4+E4 . | D3+F#3+A3 . . . . . A3+C#4+E4 . | D3+F#3+A3 . . . . . _ _" },
        { drum: true, vol: 0.03, notes: "k _ _ _ k _ _ _" },
        { drum: true, vol: 0.012, pan: 0.3, notes: "_ _ h _ _ _ h _" },
      ],
    },
    // 2F（グルメ・フードコート）: ジョプリン「ジ・エンターテイナー」（1902）。2/4・1トークン = 16分音符（bpm 152 = 4分音符 76「はやすぎず」）・A の 8小節（小節5〜12）
    mall_2f: {
      title: "エンターテイナー", bpm: 152, key: "C", modern: true, groove: "classic", swing: 0, mall: 2,
      source: { composer: "S. Joplin（1868-1917）", work: "The Entertainer, A Ragtime Two Step（1902）", score: "Mutopia #263（1902年の 初版の 複製に もとづく）", license: "Public Domain" },
      tracks: [
        { instrument: "piano", vol: 0.16, gate: 0.8, pan: 0.12, notes: "E4 C5 . E4 C5 . E4 C5 | . . . . . C6 D6 D#6 | E6 C6 D6 E6 . B5 D6 . | C6 . . . . . D4 D#4 | E4 C5 . E4 C5 . E4 C5 | . . . . . . A5 G5 | F#5 A5 C6 E6 . D6 C6 A5 | D6 . . . . . D4 D#4" },
        { instrument: "piano", vol: 0.07, gate: 0.8, pan: -0.08, notes: "_ _ _ _ _ _ _ _ | _ _ _ _ _ C5 D5 D#5 | E5 C5 D5 E5 . B4 D5 . | C5 . . . . . _ _ | _ _ _ _ _ _ _ _ | _ _ _ _ _ _ A4 G4 | F#4 A4 C5 E5 . D5 C5 A4 | D5 . . . . . _ _" },
        { instrument: "epiano", vol: 0.09, gate: 0.6, pan: -0.2, notes: "_ _ E3+G3+C4 . _ _ G3+A#3+C4 . | _ _ A3+C4 . _ _ G3+C4 . | _ _ E3+G3+C4 . _ _ F3+G3+B3 . | _ _ E3+G3+C4 . E3+G3+C4 . G3+B3 . | _ _ E3+G3+C4 . _ _ G3+A#3+C4 . | _ _ A3+C4 . _ _ _ _ | _ _ D3+F#3+A3+C4 . _ _ F#3+A3+C4 . | G3+B3 . _ _ _ _ _ _" },
        { instrument: "bass", vol: 0.2, gate: 0.7, pan: 0, notes: "C3 . _ _ G2 . _ _ | F2 . _ _ E2 . _ _ | G2 . _ _ G2 . _ _ | C3 . _ _ _ _ _ _ | C3 . _ _ G2 . _ _ | F2 . _ _ E2 . D#2 . | D2 . _ _ D3 . _ _ | _ _ G2 . A2 . B2 ." },
        { drum: true, vol: 0.05, notes: "k _ _ _ s _ _ _" },
        { drum: true, vol: 0.014, pan: 0.3, notes: "_ _ h _ _ _ h _" },
      ],
    },
    // 3F（マルシェ・ほん・おもちゃ・パズル）: チャイコフスキー「きの へいたいの マーチ」（こどもの アルバム 作品39 だい5ばん）。2/4・1トークン = 16分音符（bpm 200 = 4分音符 100）・はじめの 8小節
    mall_3f: {
      title: "きの へいたいの マーチ", bpm: 200, key: "D", modern: true, groove: "classic", swing: 0, mall: 3,
      source: { composer: "P. I. Tchaikovsky（1840-1893）", work: "Album for the Young Op.39 No.5 March of the Wooden Soldiers", score: "Mutopia #1806（Schirmer 1904 に もとづく）", license: "Public Domain" },
      tracks: [
        { instrument: "mallet", vol: 0.17, gate: 0.7, pan: 0.12, notes: "A4+D5 . _ _ D5 . _ _ | B4 . . A#4 B4 . _ C#5 | A4+D5 . _ _ D5 . _ _ | B4 . . A#4 B4 . _ C#5 | A4+D5 . _ _ C#5+E5 . _ _ | F#5 . _ _ D5+F#5 . _ _ | E5+G5 . _ D5+F#5 C#5+E5 . _ B4+D5 | C#5+E5 . _ _ _ _ _ _" },
        { instrument: "piano", vol: 0.1, gate: 0.7, pan: -0.18, notes: "D4+F#4 . _ _ _ _ _ _ | D4+G4 . . F#4 G4 . _ E4 | D4+F#4 . _ _ _ _ _ _ | D4+G4 . . F#4 G4 . _ E4 | D4+F#4 . _ _ A4 . _ _ | D5 . _ _ _ _ _ _ | D4+A4 . _ _ _ _ _ _ | A4 . A4 A4 A4 . A4 ." },
        { instrument: "bass", vol: 0.16, gate: 0.6, pan: 0, notes: "D2 . _ _ A2 . _ _ | G2 . _ _ D2 . _ _ | D2 . _ _ A2 . _ _ | G2 . _ _ D2 . _ _ | D2 . _ _ A2 . _ _ | D2 . _ _ A2 . _ _ | A2 . _ _ A2 . _ _ | A2 . _ _ E2 . _ _" },
        { drum: true, vol: 0.08, notes: "k _ _ _ s _ _ s" },
        { drum: true, vol: 0.018, pan: 0.3, notes: "h _ h _ h _ h _" },
      ],
    },
  },
  // フロアの 曲（12F・13F は すいぞくかんの 曲 aquarium の まま）
  FLOOR: { 1: "mall_1f", 2: "mall_2f", 3: "mall_3f" },
  // 店の レジで ひらく 画面も フロアの 曲の まま（とちゅうから やりなおさない。Sound.bgm は おなじ 曲なら そのまま）
  SHOP: { hane: "mall_1f", animal: "mall_1f", gothic: "mall_1f", luxury: "mall_1f", marche: "mall_3f" },
  install() {
    Object.assign(SONGS, this.SONGS);
    for (const [id, song] of Object.entries(this.SHOP)) SONGS["shop_ike_" + id] = SONGS[song];
  },
};
MallMusic.install();
