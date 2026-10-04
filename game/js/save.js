// セーブデータと育成パラメータ（リアル時間で おなか・ごきげん が へる）
const Save = {
  // KEY は変えない（変えると プレイヤーのセーブが消えたように見える）
  KEY: "pokapoka-town-save-v1",
  // セーブ形式の番号。形式を変えたら +1 して migrate() に変換を足す
  // 2: 服は 1こで 1人（wardrobe の あたいは もって いる かず。true は 1こ。js/wear-stock.js・UI-31）
  SCHEMA: 2,
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
      v: 2,
      gameVersion: GAME_VERSION,
      created: Date.now(),
      last: Date.now(),
      coins: 150,
      arcade: {active:null,settled:null,plays:0,wins:0,boards:{},miss:{},got:{},rental:{}}, // クレーン: 台ごとの ようす（景品の 位置）・はずれの かず・とれた かず。rental: こういしつで かりた いしょうの まえの ふく（js/mee-fitting.js）
      chars: { wanko: chara("wanko"), gachan: chara("gachan"), goji: chara("goji") },
      order: ["wanko", "gachan", "goji"],
      parents: {
        papa: { outfit:"casual",color:"blue",face:"smile",hair:"short",accessory:"glasses",skin:"light",hairColor:"brown",equipment:{head:null,face:null,neck:null,body:null,back:null} },
        mama: { outfit:"casual",color:"pink",face:"smile",hair:"bob",accessory:"flower",skin:"light",hairColor:"brown",equipment:{head:null,face:null,neck:null,body:null,back:null} },
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
      rooms: { active: "main", owned: { main: true }, stored: {}, expanded: {}, presets: {} },
      // ② 町の人: なかよし・うけて いる おねがい（3つまで）・おわった 日・物々交換の 回数・その日に もちかけた 人
      folk: { bond: {}, req: [], done: {}, barter: {}, offered: {} },
      conversations: { recent: {}, stories: {} },
      townQuiz: { active: null, history: {}, rotation: {}, last: null, plays: 0, correct: 0, daily: { day: "", attempts: 0 } },
      // ③ 釣り: rod 0 なし／1 つりざお／2 りっぱな つりざお・dex { id: { n, max, first } }・keep { id: いけすの 数 }・caught つった 数
      fish: { rod: 0, dex: {}, keep: {}, caught: 0 },
      // ④ 化石: pick 0 なし／1 ピッケル・bones { "trex.skull": もって いる 数 }・dug { day, at: { site: ["x,y", …] } }（その日に ほった いわ）
      fossil: { pick: 0, bones: {}, dug: { day: "", at: {} } },
      // ⑤ 水族館と 博物館: 寄贈した 魚・骨（日づけ）・そろった 恐竜・入った へや（案内は 1かい）・ぜんぶ そろった おいわい
      museum: { fish: {}, bones: {}, done: {}, rooms: {}, all: {}, wear: {}, awards: {} }, // wear: きふの ごほうびの 服（js/museum-wear.js・UI-33）・awards: そんちょうさんの ひょうしょう（js/fossil-sell.js・UI-69）
      // ⑥ 射撃場: safety は RO の きまりを きいた・best は しゅもく:じゅう ごとの いちばん よい きろく・hop は じゅう ごとの ホップ ダイヤル
      range: { safety: false, plays: 0, best: {}, hop: {} },
      shopRewards: {},
      // ART-05: あつめた ディスク（id → てに いれた 日）。プレイヤーは furn に はいる
      discs: {},
      shops: {
        burger:{lv:1,rep:0,best:0,plays:0},
        groom: {lv:1,rep:0,best:0,plays:0},
        cake: { lv: 1, rep: 0, best: 0, plays: 0 },
        crepe: { lv: 1, rep: 0, best: 0, plays: 0 },
        dentist: { lv: 1, rep: 0, best: 0, plays: 0 },
        bakery: { lv: 1, rep: 0, best: 0, plays: 0 },
        florist: { lv: 1, rep: 0, best: 0, plays: 0 },
        link: { lv: 1, rep: 0, best: 0, plays: 0 },
        relay: { lv: 1, rep: 0, best: 0, plays: 0 },
        // ころころ フルーツ: pts は ちゅうもん モードで いちばん よかった ころころ ポイント。
        // スコア モード（js/korokoro-score.js・2026-09-30）: hi は ハイスコア・tops は ランキング（[{ s: スコア, d: "2026-10-1" }] 上から 5つ）・games は あそんだ かず
        // gifts は スコア モードで もらった とくべつな かぐ（js/korokoro-prizes.js・id → もらった 日）
        // recent は さいきん あそんだ きろく（[{ s: スコア, d: 日, t: できた いちばん 大きい だん〔-1 = なし〕}] あたらしい じゅんに 10こ・2026-09-30）
        korokoro: { lv: 1, rep: 0, best: 0, plays: 0, pts: 0, hi: 0, tops: [], games: 0, gifts: {}, recent: [] },
        // ネリカスタウンの ガソリンスタンド・ゆうびんきょく（2026-09-29）
        gasstand: { lv: 1, rep: 0, best: 0, plays: 0 },
        postoffice: { lv: 1, rep: 0, best: 0, plays: 0 },
        // あたまの たいそう（js/mg-brain.js・2026-10-03）: games は ゲームごとに えらんだ かず・last は さいごに えらんだ ゲーム
        // eng（js/mg-english.js・2026-10-04）: lv は さいごの レベル（jh 中学・hs 高校）・mode は あそびかた（word 単語の意味・fill 文の穴うめ）・
        //   plays・best（10問中の いちばん おおい 正解）・recent（さいきん だした 問題の ばんごう）は「レベル_あそびかた」ごと
        brain: { lv: 1, rep: 0, best: 0, plays: 0, games: { spot: 0, pair: 0, math: 0, eng: 0 }, last: "",
          eng: { lv: "jh", mode: "word", plays: { jh_word: 0, jh_fill: 0, hs_word: 0, hs_fill: 0 }, best: { jh_word: 0, jh_fill: 0, hs_word: 0, hs_fill: 0 }, recent: { jh_word: [], jh_fill: [], hs_word: [], hs_fill: [] } } },
        // パズル こうぼう（js/mg-kobo.js・2026-10-03）: games・last は あたまの たいそうと おなじ
        // numpla（js/mg-numpla.js・2026-10-04）: lv は さいごに えらんだ 難しさ・n は 難しさごとに だした かず（問題の たばの じゅんばん）・
        //   clear は クリアの かず・best は いちばん はやい 時間（びょう・0 は まだ）・cont は とちゅうの 問題（続きから。なければ null）
        kobo: { lv: 1, rep: 0, best: 0, plays: 0, games: { slide: 0, shape: 0, logic: 0, numpla: 0 }, last: "",
          numpla: { lv: "easy", n: { easy: 0, normal: 0, hard: 0, expert: 0 }, clear: { easy: 0, normal: 0, hard: 0, expert: 0 }, best: { easy: 0, normal: 0, hard: 0, expert: 0 }, cont: null } },
      },
      daily: {last:'',stamps:0,total:0,cycles:0},
      // ネリカスタウンの いらいの けいじばん（js/neri-quests.js）: きょうの 6まい・うけて いる いらい（3つまで）・きょう おわった もの・これまでの かず と ほうしゅう
      quests: { day: "", board: [], active: [], done: [], total: 0, earned: 0 },
      // はたけ（js/farm.js・2026-09-30）: plots は 6まい（{ c: さくもつ, s: だんかい 0〜4, w: みずが ある, t: その だんかいの はじまり〔かわいて いる ときは かわいた とき〕, f: ひりょう, n: まいた ばんごう, rain: あめで みずやり }・からは { c: null }）。
      // harvests しゅうかくの かいすう・sown まいた かいすう・fert ひりょうの かいすう・got { さくもつ: とった かず }・first { さくもつ: はじめて とった 日 }
      // cooked { りょうり: つくった かず }（js/farm-cook.js・とれたて りょうり）
      farm: { plots: [{ c: null }, { c: null }, { c: null }, { c: null }, { c: null }, { c: null }], harvests: 0, sown: 0, fert: 0, got: {}, first: {}, cooked: {} },
      // ぷりくら（js/purikura.js・Meeときょれじゃ）: photos は しゃしん（絵の データ・ふるい じゅん・60まい まで）。
      // purikura.active は はらった あと まだ できあがって いない 1かい（つぎは ただで とりなおせる）・plays あそんだ かず・taken とった まいすう
      photos: [],
      purikura: { plays: 0, active: null, taken: 0 },
      // ガチャガチャ（js/gacha.js）: plays まわした かず・got { けいひん: でた かず }・done { シリーズ: 4しゅ そろった 日 }。けいひんは furn／wardrobe に はいる
      // week: さいごに いれかえの ある 階〔Meeときょれじゃ 4F〕を みた しゅう（js/mee-rotation.js。かわって いたら おしらせ）
      gacha: { plays: 0, got: {}, done: {}, week: 0 },
      // シールちょう（js/sticker-book.js・UI-53）: have { シール: てもとの まい数 }・got { シール: これまでに もらった まい数 }・
      // pages [{ bg: かみ, s: [[シール, x, y, まわす, おおきさ], …] }]（6まい。はじめて つかう ときに つくる）。シートは ガチャの けいひん（Save.d.gacha.got）
      stickers: { have: {}, got: {}, pages: [] },
      // いちばんくじ（js/ichiban-kuji.js・UI-55・ネリカスタウンの コンビニ 2つ）: lots { みせ: ロット（のこり・はりつけ ひょう・ほかの おきゃくさん）}・got { けいひん: もらった かず }・
      // draws ひいた まい数・spent つかった コイン・coupons { クーポン: まい数 }・used・stubs { みせ: はんけん }・dc／dcLast ダブルチャンス・done コンプリート・pending まだ えらんで いない D〜Fしょう
      kuji: { lots: {}, got: {}, draws: 0, spent: 0, coupons: {}, used: 0, stubs: {}, dc: {}, dcLast: {}, done: {}, pending: [] },
      // けいば ちゅうけい（js/keiba-corner.js・UI-58・ネリカス でんき 10F）: day いまの ばんぐみの 日・run { レース: true } しめきった レース・
      // tickets [{ id, day, no, t しきべつ, m かいかた, sel, keys くみあわせ, u まいすう, cost, st open／hit／miss／paid, pay }]・hist さいきんの けっか・bets・spent・won・hits・best・races・seq
      keiba: { day: "", run: {}, tickets: [], hist: [], bets: 0, spent: 0, won: 0, hits: 0, best: 0, races: 0, seq: 0 },
      puzzle: { best: 0, plays: 0, claimed: {}, active: null, last: null },
      // コラボ グッズ（js/collab-goods.js）: ライン → { total: つみたての スコア, got: { id: もらった 日 } }。ラインは はじめて よむ ときに つくる
      collab: {},
      // ファッションショー（js/fashion-show.js・UI-36）: entry うけつけで さんかひを はらった じこく（0 は まだ）・shows でた かず・best さいこうの てんすう・
      // ranks { ランク: とった かず }・got { けいひん: もらった 日 }・photos きねん しゃしん（絵の データ・12まい まで）・last さいごの ショー（ごほうびは 1かいだけ）
      fashion: { entry: 0, shows: 0, best: 0, ranks: {}, got: {}, photos: [], last: null },
      world: { map: "town", x: 7, y: 7, dir: "down" },
      flags: { intro: false, chests: {}, boss: false, talked: {} },
      events: { records: {}, activeAnnual: null },
      dex: {},
      itemDex: { furn: {}, wear: {}, claimed: { furn: {}, wear: {} } },
      stats: { battles: 0, wins: 0, coinsEarned: 0, shifts: 0, perfects: 0, fed: 0 },
      // おてつだいで きょう もらった コイン（UI-67・js/shop-day-cap.js。1にちの じょうげんは UI-83 で なくした）: きょうの 日づけと おみせごとの もらった コイン
      shopDay: { day: "", earn: {} },
      // コンビニの ポイントカード（UI-85・js/conbini-card.js）: shops { みせ: { has・pts・carry 200 に たりない コイン・total・used・spent・owner オーナーに なった 日・got } }・
      // tickets { crane クレーン チケット・lv10／lv25 おてつだい レベル けん }・bus { until ていきけんの さいごの 日 }・log さいきんの こうかん
      conbiniCard: { shops: { lawson: { has: false, pts: 0, carry: 0, total: 0, used: 0, spent: 0, owner: "", got: {} }, sevenbun: { has: false, pts: 0, carry: 0, total: 0, used: 0, spent: 0, owner: "", got: {} } }, tickets: { crane: 0, lv10: 0, lv25: 0 }, bus: { until: "" }, log: [] },
      // きろく（UI-71・js/play-records.js）: 3人の きろく・たべものごとの かず・バトルの にげた／まけ（since から かぞえる）
      records: { since: "", kids: {}, food: {}, battle: { fled: 0, lost: 0 } },
      settings: { bgm: true, se: true, difficulty: "normal", worldZoom: 1 },
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
    if (d.v < 2) { this.repairWear(d); d.v = 2; }
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
  // SCHEMA 2: まえは 1この 服を みんなで きられた。1こを 2人 いじょうが つかって いたら、つかって いる 人の かずまで ふやす
  // （3人の outfit と ぱぱ・ままの equipment・5こ まで。もって いない 服〔かしだし〕は そのまま）。いまの みためは かわらない
  repairWear(d) {
    const w = d && d.wardrobe && typeof d.wardrobe === "object" ? d.wardrobe : null, n = {};
    if (!w) return 0;
    for (const c of Object.values(d.chars || {})) for (const id of Object.values((c && c.outfit) || {})) if (id) n[id] = (n[id] || 0) + 1;
    for (const p of ["papa", "mama"]) for (const id of Object.values((d.parents && d.parents[p] && d.parents[p].equipment) || {})) if (id) n[id] = (n[id] || 0) + 1;
    let fixed = 0;
    for (const [id, k] of Object.entries(n)) {
      const v = w[id], have = v === true ? 1 : Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
      if (have >= 1 && k > have) { w[id] = Math.min(5, k); fixed++; }
    }
    return fixed;
  },
  write() {
    if (!this.d) return;
    this.d.last = Date.now();
    this.d.gameVersion = GAME_VERSION;
    try {
      // 景品側が保存失敗で所持品を戻すとき、未獲得の図鑑記録を残さない。
      const pending = { ...this.d, itemDex: JSON.parse(JSON.stringify(this.d.itemDex || { furn: {}, wear: {}, claimed: { furn: {}, wear: {} } })) };
      if (typeof ItemDex !== "undefined") ItemDex.sync(pending);
      localStorage.setItem(this.KEY, JSON.stringify(pending));
      this.d.itemDex = pending.itemDex;
    } catch (e) { /* 容量不足・プライベートモードなど */ }
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
