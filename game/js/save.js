// セーブデータと育成パラメータ（リアル時間で おなか・ごきげん が へる）
const Save = {
  // KEY は変えない（変えると プレイヤーのセーブが消えたように見える）
  KEY: "pokapoka-town-save-v1",
  // セーブ形式の番号。形式を変えたら +1 して migrate() に変換を足す
  SCHEMA: 1,
  d: null,
  dirty: false,

  fresh() {
    const chara = (id) => ({
      name: Chara.PROFILE[id].name,
      lv: 1, exp: 0, hp: null, sp: null,
      hunger: 70, mood: 75, bond: 5,
      outfit: { head: null, face: null, neck: null, body: null, back: null },
      boost: { hp: 0, sp: 0, atk: 0, def: 0, spd: 0 },
      color: "soft", lastPet: 0, wantsDeza: false,
    });
    return {
      v: 1,
      gameVersion: GAME_VERSION,
      created: Date.now(),
      last: Date.now(),
      coins: 150,
      chars: { wanko: chara("wanko"), gachan: chara("gachan"), goji: chara("goji") },
      order: ["wanko", "gachan", "goji"],
      parents: {
        papa: { outfit:"casual",color:"blue",face:"smile",hair:"short",accessory:"glasses",skin:"light" },
        mama: { outfit:"casual",color:"pink",face:"smile",hair:"bob",accessory:"flower",skin:"light" },
        auto:true, lastCare:{wanko:0,gachan:0,goji:0},
      },
      bag: { onigiri: 3, apple: 2, bandaid: 2 },
      wardrobe: { ribbon_pink: true, tshirt_red: true, scarf_green: true },
      furn: { bed_simple: 1, table_wood: 1, rug_round: 1, window: 1, plant: 1 },
      room: {
        wall: "wp_cream", floor: "fl_wood",
        items: [
          { uid: 1, id: "window", x: 190, y: 116, flip: false },
          { uid: 2, id: "rug_round", x: 190, y: 404, flip: false },
          { uid: 3, id: "bed_simple", x: 74, y: 318, flip: false },
          { uid: 4, id: "table_wood", x: 206, y: 372, flip: false },
          { uid: 5, id: "plant", x: 324, y: 304, flip: false },
        ],
        wallpapers: { wp_cream: true }, floors: { fl_wood: true },
        nextUid: 6,
      },
      rooms: { active: "main", owned: { main: true }, stored: {}, expanded: {} },
      shops: {
        groom: {lv:1,rep:0,best:0,plays:0},
        cake: { lv: 1, rep: 0, best: 0, plays: 0 },
        crepe: { lv: 1, rep: 0, best: 0, plays: 0 },
        dentist: { lv: 1, rep: 0, best: 0, plays: 0 },
        bakery: { lv: 1, rep: 0, best: 0, plays: 0 },
        florist: { lv: 1, rep: 0, best: 0, plays: 0 },
        link: { lv: 1, rep: 0, best: 0, plays: 0 },
        relay: { lv: 1, rep: 0, best: 0, plays: 0 },
      },
      puzzle: { best: 0, plays: 0, claimed: {}, active: null, last: null },
      world: { map: "town", x: 7, y: 7, dir: "down" },
      flags: { intro: false, chests: {}, boss: false, talked: {} },
      events: { records: {}, activeAnnual: null },
      dex: {},
      stats: { battles: 0, wins: 0, coinsEarned: 0, shifts: 0, perfects: 0, fed: 0 },
      settings: { bgm: true, se: true, difficulty: "normal" },
    };
  },

  exists() {
    try { return !!localStorage.getItem(this.KEY); } catch (e) { return false; }
  },
  load() {
    let d = null;
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) d = JSON.parse(raw);
    } catch (e) { d = null; }
    this.d = d ? this.migrate(d) : this.fresh();
    for (const id of Chara.IDS) {
      const c = this.d.chars[id];
      if (c.hp == null) c.hp = Stats.max(id, "hp");
      if (c.sp == null) c.sp = Stats.max(id, "sp");
    }
    this.applyElapsed(true);
    return this.d;
  },
  migrate(d) {
    // 1) 形式の変換（SCHEMA を上げたときだけ、ここに1段ずつ足す）
    //    例: if (d.v < 2) { d.newThing = convert(d.oldThing); delete d.oldThing; d.v = 2; }
    if (!d.v) d.v = 1;
    // 2) 足りないキーを fresh() から補う（新しい項目を足すだけなら 変換は不要）
    const f = this.fresh();
    const fill = (dst, src) => {
      for (const k in src) {
        if (dst[k] === undefined) dst[k] = src[k];
        else if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k]) && typeof dst[k] === "object") fill(dst[k], src[k]);
      }
    };
    fill(d, f);
    // 3) 名前に HTML の記号が入っていたら取りのぞく（innerHTML で表示するため。v1.0.0 では入力できた）
    for (const id in f.chars) {
      const c = d.chars[id];
      if (c && typeof c.name === "string") c.name = c.name.replace(/[<>&"'`]/g, "").slice(0, 6) || f.chars[id].name;
    }
    d.v = Math.max(d.v, this.SCHEMA);
    return d;
  },
  write() {
    if (!this.d) return;
    this.d.last = Date.now();
    this.d.gameVersion = GAME_VERSION;
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { /* 容量不足・プライベートモードなど */ }
    this.dirty = false;
  },
  reset() {
    try { localStorage.removeItem(this.KEY); } catch (e) {}
    this.d = this.fresh();
    for (const id of Chara.IDS) {
      this.d.chars[id].hp = Stats.max(id, "hp");
      this.d.chars[id].sp = Stats.max(id, "sp");
    }
  },
  mark() { this.dirty = true; },

  // 経過時間ぶん おなか・ごきげん を へらす
  applyElapsed(offline = false) {
    const d = this.d, now = Date.now();
    let min = (now - (d.last || now)) / 60000;
    d.last = now;
    if (min <= 0) return;
    if (offline) min = Math.min(min, 60 * 12); // 最大12時間ぶん
    const comfort = Room.comfort();
    const moodRate = 0.28 * (1 - Math.min(comfort, 50) / 100);
    for (const id of Chara.IDS) {
      const c = d.chars[id];
      const hungerRate = offline ? 0.22 : 0.4;
      const floor = offline ? 15 : 0;
      c.hunger = Math.max(Math.min(c.hunger, floor), c.hunger - hungerRate * min);
      let mr = moodRate * (offline ? 0.6 : 1);
      if (c.hunger < 25) mr += 0.25;
      c.mood = Math.max(Math.min(c.mood, offline ? 20 : 0), c.mood - mr * min);
      // しあわせな時間は なかよし度 が すこしずつ あがる
      if (!offline && c.hunger > 50 && c.mood > 60) c.bond = Math.min(100, c.bond + 0.02 * min);
    }
    this.mark();
  },

  addCoins(n) {
    this.d.coins = Math.max(0, Math.floor(this.d.coins + n));
    if (n > 0) this.d.stats.coinsEarned += n;
    this.mark();
  },
  addBag(id, n = 1) {
    this.d.bag[id] = (this.d.bag[id] || 0) + n;
    if (this.d.bag[id] <= 0) delete this.d.bag[id];
    this.mark();
  },
  care(id, { hunger = 0, mood = 0, bond = 0 } = {}) {
    const c = this.d.chars[id];
    c.hunger = U.clamp(c.hunger + hunger, 0, 100);
    c.mood = U.clamp(c.mood + mood, 0, 100);
    c.bond = U.clamp(c.bond + bond, 0, 100);
    this.mark();
  },
  careAll(v) { for (const id of Chara.IDS) this.care(id, v); },
  healAll() {
    for (const id of Chara.IDS) {
      const c = this.d.chars[id];
      c.hp = Stats.max(id, "hp");
      c.sp = Stats.max(id, "sp");
    }
    this.mark();
  },
  avg(key) {
    return Chara.IDS.reduce((s, id) => s + this.d.chars[id][key], 0) / Chara.IDS.length;
  },
};

// ステータス計算（レベル・装備・とっくん）
const Stats = {
  base(id, key, lv) {
    const [b, g] = CHARA_STATS[id][key];
    return Math.floor(b + g * (lv - 1));
  },
  equip(id, key) {
    const o = Save.d.chars[id].outfit;
    let s = 0;
    for (const slot in o) {
      const it = o[slot] && ITEM_INDEX[o[slot]];
      if (it && it.st && it.st[key]) s += it.st[key];
    }
    return s;
  },
  max(id, key) {
    const c = Save.d.chars[id];
    return Math.max(1, this.base(id, key, c.lv) + this.equip(id, key) + (c.boost[key] || 0));
  },
  get(id, key) { return this.max(id, key); },
  expNeed(lv) { return Math.floor(12 * Math.pow(lv, 1.7)); },
  // 経験値を足してレベルアップ結果を返す
  gainExp(id, n) {
    const c = Save.d.chars[id];
    const ups = [];
    if (c.lv >= 50) return ups;
    c.exp += n;
    while (c.exp >= this.expNeed(c.lv) && c.lv < 50) {
      c.exp -= this.expNeed(c.lv);
      const before = {};
      for (const k of ["hp", "sp", "atk", "def", "spd"]) before[k] = this.max(id, k);
      c.lv++;
      const diff = {};
      for (const k of ["hp", "sp", "atk", "def", "spd"]) diff[k] = this.max(id, k) - before[k];
      c.hp += diff.hp; c.sp += diff.sp;
      const learned = Object.values(SKILLS).filter((s) => s.user === id && s.lv === c.lv).map((s) => s.name);
      ups.push({ lv: c.lv, diff, learned });
    }
    Save.mark();
    return ups;
  },
  skills(id) {
    const lv = Save.d.chars[id].lv;
    return Object.entries(SKILLS).filter(([, s]) => s.user === id && s.lv <= lv).map(([k]) => k);
  },
  perk(name) {
    // パーティの誰かが その効果の服を着ていれば true
    return Chara.IDS.some((id) => Object.values(Save.d.chars[id].outfit).some((it) => it && ITEM_INDEX[it] && ITEM_INDEX[it].perk === name));
  },
};

// ごはん・どうぐを つかう（おうち・メニュー・バトル共通）
const Care = {
  fullText(id) { return (id==="goji"?"ガゥー♪ ":"")+U.pick(["はらぺん♪","はらぱん！"]); },
  // 食べ物の効果を計算して反映。返り値 { text, emo, like, dislike }
  feed(id, itemId, { free = false } = {}) {
    const it = BAG_INDEX[itemId];
    const c = Save.d.chars[id];
    if (!it || (!free && !Save.d.bag[itemId])) return null;
    if (!free) Save.addBag(itemId, -1);
    const info = CHARA_INFO[id];
    const dislike = !!it.spicy || info.dislike.includes(itemId), like = !dislike && info.like.includes(itemId);
    const msgs = [];
    if (it.kind === "food") {
      let mood = it.mood || 0;
      if (like) mood += 16;
      if (dislike) mood = -8;
      if (mood > 0 && Stats.perk("eat")) mood = Math.round(mood * 1.5);
      const full = c.hunger >= 96;
      Save.care(id, { hunger: it.hunger || 0, mood: full ? Math.min(mood, 2) : mood, bond: like ? 4 : dislike ? 0 : 2 });
      Save.d.stats.fed++;
      if (c.hunger >= 90) msgs.push(this.fullText(id));
      else if (like) msgs.push("だいこうぶつ！ とっても うれしそう！");
      else if (dislike) msgs.push("にがてな あじ……ちょっと ふきげん。");
      else msgs.push("おいしそうに たべた！");
      if (it.deza) { c.wantsDeza = false; msgs.push("デザは べつばら♪"); }
      else if ((it.hunger || 0) >= 20 && !it.boost) { c.wantsDeza = true; msgs.push(id === "goji" ? "ガゥー！ デザ ほしいな" : "つぎは デザ ほしいな♪"); }
      if (it.spicy) msgs[0] = "からいのは にがて……おみず ほしい！";
    }
    if (it.hp) {
      const mx = Stats.max(id, "hp");
      if (c.hp > 0) { const b = c.hp; c.hp = Math.min(mx, c.hp + it.hp); if (c.hp > b) msgs.push(`HPが ${c.hp - b} かいふく`); }
    }
    if (it.sp) { const mx = Stats.max(id, "sp"); const b = c.sp; c.sp = Math.min(mx, c.sp + it.sp); if (c.sp > b) msgs.push(`SPが ${c.sp - b} かいふく`); }
    if (it.revive && c.hp <= 0) { c.hp = Math.max(1, Math.round(Stats.max(id, "hp") * it.revive)); msgs.push("げんきに なった！"); }
    if (it.boost) {
      const names = { atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ", hp: "さいだいHP", sp: "さいだいSP" };
      for (const k in it.boost) { c.boost[k] = (c.boost[k] || 0) + it.boost[k]; msgs.push(`${names[k]}が ずっと +${it.boost[k]}！`); }
    }
    Save.mark();
    return { text: msgs.join("\n"), emo: dislike ? "angry" : like ? "love" : "happy", like, dislike };
  },
};
