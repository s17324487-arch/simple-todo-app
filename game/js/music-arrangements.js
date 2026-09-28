// 元のテーマを残しながら、8小節の和音・ベース・ドラムで町ごとに編曲。
(() => {
  const harmonies = {
    C: ["C3+E3+G3+B3", "A2+C3+E3+G3", "F2+A2+C3+E3", "G2+B2+D3+F3", "E3+G3+B3+D4", "A2+C3+E3+G3", "D3+F3+A3+C4", "G2+B2+D3+F3"],
    F: ["F3+A3+C4+E4", "D3+F3+A3+C4", "Bb2+D3+F3+A3", "C3+E3+G3+Bb3", "A2+C3+E3+G3", "D3+F3+A3+C4", "G2+Bb2+D3+F3", "C3+E3+G3+Bb3"],
    G: ["G2+B2+D3+F#3", "E3+G3+B3+D4", "C3+E3+G3+B3", "D3+F#3+A3+C4", "G2+B2+D3+F#3", "C3+E3+G3+B3", "A2+C3+E3+G3", "D3+F#3+A3+C4"],
    Am: ["A2+C3+E3+G3", "A2+C3+E3+G3", "F2+A2+C3+E3", "E3+G#3+B3+D4", "A2+C3+E3+G3", "C3+E3+G3+B3", "F2+A2+C3+E3", "E3+G#3+B3+D4"],
    Dm: ["D3+F3+A3+C4", "G2+Bb2+D3+F3", "C3+E3+G3+Bb3", "F2+A2+C3+E3", "Bb2+D3+F3+A3", "G2+Bb2+D3+F3", "E3+G3+Bb3+D4", "A2+C#3+E3+G3"],
    Em: ["E3+G3+B3+D4", "D3+F#3+A3+C4", "C3+E3+G3+B3", "B2+D#3+F#3+A3", "E3+G3+B3+D4", "D3+F#3+A3+B3", "C3+E3+G3+B3", "B2+D#3+F#3+A3"],
    Gm: ["G2+Bb2+D3+F3", "Eb3+G3+Bb3+D4", "C3+Eb3+G3+Bb3", "D3+F#3+A3+C4", "G2+Bb2+D3+F3", "Bb2+D3+F3+A3", "Eb3+G3+Bb3+D4", "D3+F#3+A3+C4"],
  };
  // name: [bpm, key, lead, groove, swing, display title]
  const profiles = {
    title: [96, "C", "piano", "pop", .05, "はじまりの ひかり"],
    town: [106, "F", "pluck", "pop", .08, "ぽかぽか さんぽ"],
    house: [78, "C", "piano", "quiet", .07, "おうちの ひだまり"],
    city: [112, "C", "epiano", "city", .04, "まちの リズム"],
    heiwadai: [98, "C", "epiano", "lounge", .12, "へいわだいの ごご"],
    harbor: [88, "C", "pluck", "lounge", .1, "みなとの そよかぜ"],
    airport: [104, "C", "piano", "city", .02, "そらへの きっぷ"],
    coast: [92, "Dm", "mallet", "lounge", .08, "なみと ひとやすみ"],
    meadow: [116, "G", "pluck", "pop", .04, "はらっぱを こえて"],
    forest: [92, "Am", "mallet", "quiet", .1, "もりの こもれび"],
    cave: [80, "Dm", "epiano", "quiet", 0, "どうくつの しずく"],
    shop: [106, "C", "epiano", "pop", .08, "おみせへ ようこそ"],
    shop_crepe: [96, "C", "epiano", "lounge", .12, "あまい カフェ"],
    shop_dentist: [94, "Dm", "mallet", "pop", .04, "ぴかぴかの は"],
    shop_bakery: [102, "F", "piano", "pop", .09, "やきたての あさ"],
    shop_florist: [88, "C", "pluck", "lounge", .08, "はなを えらぼう"],
    shop_clothes: [116, "Am", "epiano", "city", .06, "おしゃれ ステップ"],
    shop_furniture: [90, "C", "pluck", "lounge", .1, "きのおへや"],
    shop_market: [108, "C", "piano", "pop", .04, "かごいっぱい"],
    shop_link: [112, "Dm", "mallet", "city", .02, "つながる リズム"],
    shop_relay: [128, "G", "pluck", "drive", .02, "そらの おとどけ"],
    battle_fire: [142, "Am", "pluck", "drive", 0, "ひのこ ステップ"],
    battle_water: [116, "Dm", "epiano", "pop", .06, "なみの チャレンジ"],
    battle_rock: [124, "Gm", "piano", "drive", .02, "いわの ビート"],
    battle_grass: [128, "G", "mallet", "pop", .04, "わかばの ダンス"],
    battle_lightning: [148, "Em", "pluck", "drive", 0, "ひらめく いなずま"],
    battle_elite: [154, "Am", "piano", "drive", 0, "ちからを あわせて"],
    battle_crown: [160, "Dm", "piano", "drive", 0, "おうさまに ちょうせん"],
    battle: [146, "Am", "pluck", "drive", 0, "たたかう ゆうき"],
    boss: [154, "Em", "piano", "drive", 0, "おおきな ちょうせん"],
  };
  const lower = n => n.replace(/(\d)$/, d => String(Number(d) - 1));
  const tokens = notes => notes.trim().split(/\s+/).filter(n => n !== "|");
  const melody = (notes, key) => {
    const original = tokens(notes).map(lower);
    if (original.length >= 64) return original.slice(0, 64).join(" ");
    const bars = [];
    for (let bar = 0; bar < 8; bar++) {
      const phrase = Array.from({ length: 8 }, (_, i) => original[(bar * 8 + i) % original.length]);
      if (bar === 3) { phrase[4] = "_"; phrase[5] = "."; }
      if (bar === 5) phrase[0] = "_";
      if (bar === 7) { phrase[4] = key[0] + "4"; phrase[5] = "."; phrase[6] = "."; phrase[7] = "_"; }
      bars.push(phrase.join(" "));
    }
    return bars.join(" | ");
  };
  for (const [name, old] of Object.entries(SONGS)) {
    if (old.once) {
      SONGS[name] = { ...old, modern: true, title: name === "victory" ? "やったね！" : "レベルアップ", tracks: old.tracks.map((tr, i) => ({ ...tr, wave: undefined, instrument: i ? "bass" : "piano", vol: i ? .2 : .17, notes: tokens(tr.notes).map(lower).join(" ") })) };
      continue;
    }
    const profile = profiles[name];
    if (!profile) throw new Error("music profile missing: " + name);
    const [bpm, key, lead, groove, swing, title] = profile, chords = harmonies[key];
    const urban = groove === "city", drive = groove === "drive", quiet = groove === "quiet";
    const rhythm = chords.map(c => urban ? `_ ${c} . _ ${c} . _ _` : drive ? `${c} . _ ${c} _ ${c} . _` : `${c} . . . _ ${c} . .`).join(" | ");
    const bass = chords.map(c => {
      const ns = c.split("+"), root = lower(ns[0]), fifth = lower(ns[2]);
      return urban || drive ? `${root} . _ ${fifth} ${root} . ${fifth} _` : `${root} . . _ ${fifth} . ${root} _`;
    }).join(" | ");
    const pad = chords.map(c => `${c} . . . . . . .`).join(" | ");
    SONGS[name] = { bpm, title, modern: true, swing, key, groove, tracks: [
      { instrument: lead, vol: quiet ? .16 : .18, gate: lead === "pluck" ? .67 : .86, pan: .16, notes: melody(old.tracks[0].notes, key) },
      { instrument: quiet ? "piano" : "epiano", vol: .13, pan: -.22, gate: .86, notes: rhythm },
      { instrument: "bass", vol: quiet ? .18 : .25, pan: 0, gate: .8, notes: bass },
      { instrument: "pad", vol: quiet ? .065 : .045, pan: -.06, gate: .95, notes: pad },
      { drum: true, vol: quiet ? .055 : drive ? .19 : .14, notes: urban ? "k _ s _ k k s _" : drive ? "k _ s k k _ s _" : quiet ? "k _ _ _ s _ _ _" : "k _ s _ k _ s _" },
      { drum: true, vol: quiet ? .012 : .026, pan: .3, notes: quiet ? "_ _ h _ _ _ h _" : "h h h h h h h h" },
    ] };
  }
})();
