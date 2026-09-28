// 戦闘ごとに作る属性・状態。セーブには書き込まない。
const BattleElements = {
  types: {
    fire: { name: "ひ", color: "#F6A784", beats: "grass", status: "ひりひり", effect: "ばんの はじめに HPが すこし へる" },
    water: { name: "みず", color: "#8ED2ED", beats: "fire", status: "びしょぬれ", effect: "すばやさが さがる" },
    rock: { name: "いわ", color: "#CAB399", beats: "lightning", status: "ぐらぐら", effect: "ぼうぎょが さがる" },
    grass: { name: "くさ", color: "#A4D69A", beats: "rock", status: "つるからみ", effect: "こうげきが さがる" },
    lightning: { name: "かみなり", color: "#F8DE7F", beats: "water", status: "びりびり", effect: "ときどき 1かい おやすみ" },
  },
  party: { goji: ["rock", "fire"], gachan: ["grass"], wanko: ["lightning", "water"] },
  enemies: {
    purun: "water", moko: "grass", bunbun: "lightning", kinokko: "grass", donguri: "rock", happa: "grass",
    akapurun: "fire", koumori: "lightning", iwagoro: "rock", kirakira: "lightning", king: "water",
    snail: "water", sprout: "grass", fox: "fire", moth: "grass", robot: "lightning", crab: "rock", jelly: "water", seahorse: "water",
  },
  affinity(unit) { return unit.side === "ally" ? this.party[unit.id] : [this.enemies[unit.kind]]; },
  label(elements) { return elements.map(e => this.types[e].name).join("・"); },
  // 二属性は弱点同士を重ねない。有利と不利が両方あるときは等倍。
  multiplier(element, defenders) {
    if (!this.types[element]) return 1;
    const strong = defenders.some(d => this.types[element].beats === d);
    const weak = defenders.some(d => this.types[d]?.beats === element);
    return strong === weak ? 1 : strong ? 1.5 : 0.75;
  },
  stat(unit, key) {
    const e = unit.condition?.element;
    return (e === "water" && key === "spd") ? 0.7 : (e === "rock" && key === "def") ? 0.7 : (e === "grass" && key === "atk") ? 0.75 : 1;
  },
  inflict(unit, element, chance, roll = Math.random()) {
    if (!unit.alive || !this.types[element] || unit.guard || unit.condition || unit.conditionGrace > 0) return false;
    if (roll >= chance * (unit.e?.boss ? 0.5 : 1)) return false;
    unit.condition = { element, turns: element === "lightning" ? 2 : 3, skipped: false };
    return true;
  },
  clear(unit) { unit.condition = null; unit.conditionGrace = 2; },
  startTurn(unit, maxHp, roll = Math.random()) {
    const c = unit.condition;
    if (!c) return { damage: 0, skip: false };
    const skip = c.element === "lightning" && !c.skipped && roll < (unit.e?.boss ? 0.125 : 0.25);
    if (skip) c.skipped = true; // 同じ状態で二度は休ませない
    return { damage: c.element === "fire" ? Math.min(unit.e?.boss ? 12 : 20, Math.max(1, Math.round(maxHp * 0.04))) : 0, skip };
  },
  endTurn(unit) {
    if (unit.condition && --unit.condition.turns <= 0) this.clear(unit);
    else if (!unit.condition && unit.conditionGrace > 0) unit.conditionGrace--;
  },
  badge(unit) {
    const c = unit.condition;
    return c ? `${this.types[c.element].status} ${c.turns}` : this.label(this.affinity(unit));
  },
  music(foes, boss, partyLevel) {
    if (boss || foes.some(f => ENEMIES[f.kind].boss)) return "battle_crown";
    const strongest = [...foes].sort((a, b) => b.lv - a.lv || a.kind.localeCompare(b.kind))[0];
    if (strongest.lv >= 16 || strongest.lv >= partyLevel + 4) return "battle_elite";
    return "battle_" + this.enemies[strongest.kind];
  },
  help() {
    const body = U.el("div", { class: "element-help" });
    body.append(U.el("p", { text: "ひ → くさ → いわ → かみなり → みず → ひ" }));
    body.append(U.el("p", { text: "やじるしの さきに つよい（1.5ばい）。ぎゃくは 0.75ばい。ほかは 1ばい。ふたつの ぞくせいで つよい・よわいが かさなると 1ばいだよ。" }));
    for (const t of Object.values(this.types)) body.append(U.el("p", { html: `<b>${t.name}：${t.status}</b><br>${t.effect}` }));
    body.append(U.el("p", { text: "じょうたいは ひとつだけ。2〜3かいの じぶんの ばんで なおるよ。ぼうぎょ・かいふくの とくぎ・どうぐでも なおせるよ。ボスには かかりにくいよ。" }));
    UI.modal({ title: "ぞくせい と じょうたい", body });
  },
};

// 5属性 × 5技。低コスト・全体攻撃・状態重視・吸収/追加防御・大技を使い分ける。
(() => {
  const rows = {
    fire: [
      ["ember", "ひのこ", 1, 2, 1.05, "enemy", .5],
      ["ring", "ほのおの わ", 4, 5, .75, "enemies", .35],
      ["claw", "ひの つめ", 8, 5, 1.65, "enemy", .7],
      ["dance", "ほのおの おどり", 12, 8, 1.2, "enemies", .6],
      ["sun", "おひさま ブレス", 18, 11, 2.35, "enemy", 1],
    ],
    water: [
      ["splash", "みずでっぽう", 1, 2, 1.05, "enemy", .5],
      ["bubble", "あわの シャワー", 4, 5, .75, "enemies", .4],
      ["jet", "みずの やいば", 8, 5, 1.75, "enemy", .5],
      ["wave", "おおなみ", 12, 8, 1.25, "enemies", .65],
      ["spring", "いのちの しずく", 18, 11, 2, "enemy", .75, { drain: .35 }],
    ],
    rock: [
      ["pebble", "こいし ころころ", 1, 2, 1.15, "enemy", .4],
      ["rain", "いしの あられ", 4, 5, .9, "enemies", .25],
      ["fist", "いわの こぶし", 8, 6, 1.9, "enemy", .65],
      ["wall", "いわの とりで", 12, 8, 1.55, "enemy", .7, { armor: true }],
      ["mountain", "やまの おとしもの", 18, 12, 1.8, "enemies", .6],
    ],
    grass: [
      ["leaf", "わかば カッター", 1, 2, 1.05, "enemy", .5],
      ["petal", "はなびら のまい", 4, 5, .75, "enemies", .4],
      ["vine", "つるの ぎゅっ", 8, 5, 1.5, "enemy", .7, { drain: .3 }],
      ["forest", "もりの ささやき", 12, 8, 1.2, "enemies", .65],
      ["bloom", "まんかい ブーケ", 18, 11, 2.1, "enemy", 1, { drain: .4 }],
    ],
    lightning: [
      ["spark", "ちいさな いなずま", 1, 2, 1.05, "enemy", .35],
      ["chain", "かみなり リレー", 4, 5, .75, "enemies", .25],
      ["dash", "いなずま ダッシュ", 8, 5, 1.75, "enemy", .45],
      ["storm", "ごろごろ あらし", 12, 8, 1.25, "enemies", .4],
      ["bolt", "きらめく らいこう", 18, 11, 2.4, "enemy", .7],
    ],
  };
  for (const [element, skills] of Object.entries(rows)) {
    const user = Object.keys(BattleElements.party).find(id => BattleElements.party[id].includes(element));
    for (const [id, name, lv, sp, power, target, chance, extra = {}] of skills) {
      SKILLS[`${element}_${id}`] = { user, name, lv, sp, power, target, element, chance, fx: element, ...extra,
        desc: `${target === "enemies" ? "みんな" : "1たい"}に ${BattleElements.types[element].name}。ときどき ${BattleElements.types[element].status}${extra.drain ? "／HPすいとり" : extra.armor ? "／ぼうぎょアップ" : ""}` };
    }
    SKILLS[`e_${element}_touch`] = { name: `${BattleElements.types[element].name}の ちから`, power: 1.05, fx: element, element, chance: .3 };
  }
  Object.assign(SKILLS.breath, { element: "fire", chance: .35 });
  Object.assign(SKILLS.e_leaf, { element: "grass", chance: .2 });
  Object.assign(SKILLS.e_rock, { element: "rock", chance: .25 });
})();

// 敵属性5曲・強敵・ボス。既存の battle / boss は互換のため残す。
(() => {
  const tunes = {
    fire: [142, "E5 G5 A5 . G5 E5 D5 . | C5 . E5 . G5 A5 B5 .", "A2 . E3 . F2 . C3 . | G2 . D3 . E2 . B2 ."],
    water: [116, "D5 . F5 A5 . G5 F5 . | E5 . C5 . D5 F5 E5 .", "D2 . A2 . Bb2 . F3 . | C3 . G2 . A2 . E3 ."],
    rock: [124, "G4 . D5 . G4 Bb4 D5 . | F5 . Eb5 D5 C5 . D5 .", "G2 . G2 D3 Eb2 . Bb2 . | C3 . G2 . D2 . A2 ."],
    grass: [128, "G4 B4 D5 . E5 . D5 B4 | C5 E5 G5 . F#5 . D5 .", "G2 . D3 . E2 . B2 . | C3 . G2 . D3 . A2 ."],
    lightning: [148, "B4 D5 E5 B4 G5 . F#5 E5 | D5 A4 D5 F#5 B5 . A5 .", "E2 . B2 E3 G2 . D3 . | D2 . A2 D3 B1 . F#2 ."],
    elite: [154, "A4 E5 A5 . G5 E5 D5 C5 | D5 F5 A5 . E5 G#5 B5 .", "A2 E3 A2 E3 F2 C3 F2 C3 | D2 A2 D2 A2 E2 B2 E2 B2"],
    crown: [160, "D5 . A5 D6 C6 . A5 F5 | Bb5 A5 G5 F5 E5 . A5 .", "D2 A2 D3 A2 Bb1 F2 Bb2 F2 | G2 D3 G2 D3 A2 E3 A2 E3"],
  };
  for (const [key, [bpm, melody, bass]] of Object.entries(tunes)) SONGS[`battle_${key}`] = {
    bpm, tracks: [
      { wave: "sine", vol: .14, rel: .13, notes: melody },
      { wave: "triangle", vol: .18, gate: .75, notes: bass },
      { drum: true, vol: .045, notes: key === "elite" || key === "crown" ? "k h s h k k s h" : "k h s h k _ s h" },
    ],
  };
})();
