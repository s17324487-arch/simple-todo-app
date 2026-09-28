// 町の人 1人ずつの 見た目（look）と、おなじ 名前の 人たちの 名前。どうぶつの森の ように おなじ 人は いない。
// 人の ならび（どこに だれが いるか・セリフ）は マップと 町の データの まま（Codex の エリアの 修正と ぶつからない）。
// ここは 読みこみの さいごに MAP_DEFS の 町の人・お店の 人に look を のせるだけ。あたらしい 人が ふえても 自動で ちがう 見た目に なる。
//  ・名前の ある 人（村長・ミケ など）は FIXED の とおり（種も 名前も そのまま）
//  ・役の 名前で よばれる 人（町の なかま）は、おなじ 名前の 人が 2人 いじょう いれば、1人ずつ 名前を つける（「シティの ポコ」など）
//  ・役の 名前・セリフに 種が 出る 役（かわべの カエルさん・ふなのりの ペンギン など）は 種を かえない
const NpcCast = (() => {
  const H = (id, k) => U.hash([...String(id)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7), k, 4242);
  const pick = (list, id, k) => list[Math.floor(H(id, k) * list.length) % list.length];
  // 名前の ある 人（id ごと）。sp は かえない。col・col2 は ない ときだけ 入れる
  const FIXED = {
    mayor: { col: "#8D6E63", col2: "#E9D2BE", look: { brow: "thick", mouth: "smile", cheek: "none", tuft: "mustache", col3: "#F4EDE0" } },
    cat: { col: "#FFFFFF", col2: "#F5B06A", look: { pattern: "calico", col3: "#5A4A40", eye: "shine", cheek: "pink" } },
    rabbit: { look: { eye: "lash", cheek: "pink", tuft: "bow", acc: "#F06292" } },
    penguin: { look: { eye: "shine", cheek: "pink" } },
    frog: { look: { cheek: "pink", brow: "up" } },
    sheep: { look: { eye: "sleepy", cheek: "peach" } },
    mouse: { look: { eye: "shine", brow: "up", cheek: "rose" } },
    pig: { look: { brow: "soft", cheek: "rose", pattern: "forehead", col3: "#F48FB1" } },
    parkcat: { col: "#C9E7D8", col2: "#FFFFFF", look: { pattern: "socks", eye: "oval", tuft: "flower" } },
    traveler: { col: "#F4EDE0", col2: "#5A4E4A", look: { cheek: "none" } },
    explorer: { look: { pattern: "spots", col3: "#4E8F3C", eye: "sparkle", brow: "up" } },
    aq_curator: { col: "#4A6F7A", look: { eye: "oval", brow: "soft", cheek: "peach" } },
    mu_doctor: { col: "#6D5445", col2: "#D9BFA7", look: { brow: "thick", tuft: "mustache", col3: "#EDE3D1" } },
    cityguide: { col: "#F6E3BF", col2: "#F8B8C8", look: { eye: "sparkle", tuft: "flower" } },
    beachpenguin: { col: "#2F3542", look: { tuft: "spike", acc: "#F6C343", eye: "shine", cheek: "rose" } },
    portguide: { col: "#6E88A8", look: { eye: "shine", brow: "soft", cheek: "peach" } },
    heiwadai_local: { col: "#6B6B78", col2: "#FFFFFF", look: { pattern: "belly", eye: "shine" } },
    heiwadai_person_1: { look: { brow: "thick", mouth: "flat", cheek: "none" } },
    heiwadai_person_2: { col: "#5B6B85", look: { brow: "soft" } },
    heiwadai_person_3: { col: "#F6C9B8", col2: "#EE9D8A", look: { brow: "thick", cheek: "rose" } },
    heiwadai_person_4: { col: "#E8E1D5", look: { eye: "smile", cheek: "pink" } },
    heiwadai_person_5: { col: "#EEE3F4", look: { eye: "sparkle", brow: "up", mouth: "open" } },
    heiwadai_person_6: { col: "#7FC4B0", look: { brow: "soft", eye: "sleepy" } },
    heiwadai_person_7: { col: "#F2EDE4", look: { eye: "lash", cheek: "pink" } },
    airguide: { col2: "#F2CFA8", look: { eye: "cool", brow: "up", tuft: "curl" } },
  };
  // お店の 人（SHOP_OWNERS・BUY_SHOPS の keeper。おなじ 人が 2つの お店に 出る ことも ある）
  const SHOP = {
    crepe: { look: { eye: "lash", cheek: "pink", pattern: "socks" } },
    dentist: { col: "#F6E3BF", look: { eye: "oval", brow: "soft" } },
    bakery: { look: { eye: "smile", cheek: "peach", pattern: "belly" } },
    florist: { col: "#A6D66F", look: { eye: "shine", cheek: "pink" } },
    cake: { look: { eye: "sparkle", cheek: "pink", tuft: "curl" } },
    groom: { col: "#6B6B78", col2: "#FFFFFF", look: { pattern: "blaze", col3: "#FFFFFF", eye: "cool", brow: "up" } },
    burger: { col: "#F6C9B8", col2: "#EE9D8A", look: { brow: "thick", cheek: "rose", mouth: "grin" } },
  };
  // 町ごとの 種の なかま（町の なかまの 種を えらぶ）
  const POOL = {
    town: ["dog", "squirrel", "hamster", "duck", "hedgehog", "raccoon", "deer", "cow", "goat", "koala", "bird", "chicken"],
    city: ["fox", "monkey", "lion", "tiger", "redpanda", "panda", "owl", "horse", "kangaroo", "wolf", "elephant", "dog"],
    harbor: ["otter", "seal", "duck", "hippo", "croc", "bird", "dog", "raccoon", "wolf", "cat"],
    airport: ["elephant", "kangaroo", "koala", "owl", "bird", "horse", "goat", "deer", "fox", "chicken"],
    heiwadai: ["hamster", "squirrel", "owl", "raccoon", "dog", "hedgehog", "redpanda", "chicken", "rabbit", "bird"],
  };
  // 種ごとの 名前（2〜4もじ。ほかの 人と かぶらない ものを えらぶ）
  const NAMES = {
    cat: ["ミルル", "タマ", "ニャオ", "ココア", "シロ", "ルナ", "モカ", "クロエ", "チャコ", "ミュウ", "トラ", "ユキ"],
    dog: ["ポチ", "コロ", "ハチ", "ラッキー", "マロン", "ソラマメ", "ワッフル", "テツ", "ボタン", "ムギ", "ペコ", "コタロウ"],
    rabbit: ["ピョン", "ウサコ", "モモ", "ミント", "ラビィ", "シロップ", "ナナ", "ポプリ"],
    bear: ["クマキチ", "ベア", "モンタ", "ハニー", "ゴロ", "テディ", "クーマ", "ヒグ"],
    penguin: ["ペンタ", "ギン", "ポポ", "ペンネ", "コウテイ", "ヒョウ", "アデリ", "フリッパ", "イワト", "ナミ"],
    frog: ["ケロミ", "アマガ", "トノサ", "ゲコタ", "ピョコ", "ケロリン", "ハスノ", "アメンボ"],
    sheep: ["メリノ", "モコ", "ウール", "ラム", "フワリ", "コットン", "メェリ", "ヒツジロウ", "ソフィ", "マシュ"],
    mouse: ["チュータ", "チーズ", "ネネ", "カスタ", "ハツカ", "チッチ", "コムギ", "マウリ"],
    pig: ["トンキチ", "ブーコ", "ポーク", "トントン", "ピグ", "ブヒ", "モモコ"],
    duck: ["ガーコ", "アヒオ", "ダック", "カモネ", "グワ", "ペタ"],
    bird: ["ピッピ", "チュン", "インコ", "ピヨ", "ルリ", "カナ", "ツバメ"],
    chicken: ["コッコ", "トサカ", "ヒナタ", "ケッコウ", "チキ"],
    squirrel: ["クルミ", "ドングリ", "リッスン", "マツボ", "シマ", "チップ"],
    hamster: ["ハム", "ヒマワリ", "モチ", "ゴールデン", "ジャン", "ポッケ"],
    koala: ["ユーカリ", "コアラン", "ノンビ", "グレイ", "マルル"],
    elephant: ["パオ", "ゾウタ", "ハナナガ", "マンモ", "ピーナ"],
    deer: ["シカノ", "バンビ", "ナラ", "モミジ", "ツノタ"],
    fox: ["コンタ", "キツネビ", "ユウヒ", "イナリ", "ルーフ", "コハク"],
    raccoon: ["ポンタ", "タヌ", "ハッパ", "ドロン", "ポンキチ"],
    owl: ["ホウ", "フクロ", "ミネルバ", "ホッホ", "ヨルノ"],
    hippo: ["カバオ", "ヒポ", "ドボン", "ムッチ", "ザブン"],
    lion: ["レオ", "タテガ", "ガオウ", "サバンナ", "シシマル"],
    tiger: ["トラジ", "シマオ", "ガルル", "ベンガ", "タイガ"],
    monkey: ["モンキチ", "ウッキー", "サルタ", "バナナ", "エテ"],
    horse: ["パカラ", "ヒヒン", "ポニー", "ダービ", "タテガミ"],
    goat: ["ヤギオ", "メエコ", "ユキヤ", "ヒゲタ", "チーズン"],
    cow: ["モーモ", "ミルク", "ウシオ", "ホルス", "ベコ"],
    hedgehog: ["ハリー", "トゲオ", "チクリ", "マロ", "イガグリ"],
    otter: ["カワオ", "ラッコ", "ウソ", "スイスイ", "カイ"],
    panda: ["パンダン", "ササ", "ランラン", "シャオ", "モノクロ"],
    redpanda: ["レッサ", "ヒナタ", "フータ", "アカリ", "コレッサ"],
    wolf: ["ウルフ", "ガロウ", "ツキノ", "シルバ", "ロボ"],
    croc: ["ワニオ", "クロコ", "ガブ", "ニルス", "ワニタ"],
    kangaroo: ["ルー", "ポーチ", "ジャンプ", "カンタ", "ハネル"],
    seal: ["アザラ", "ゴマ", "タマちゃん", "プカ", "アイス"],
  };
  const SOUNDS = /ニャ|にゃ|ケロ|チュウ|ブー|ブヒ|ペン|メェ|メエ|ピョン|ぴょん|ワン|ガウ/;
  const ALLOWED = {
    penguin: ["none", "forehead", "heart"], frog: ["none", "spots", "belly", "forehead"], sheep: ["none", "socks", "forehead"], owl: ["none", "belly", "forehead"],
    tiger: ["stripes"], cow: ["spots"], raccoon: ["mask"], panda: ["none"], hedgehog: ["none", "belly"], croc: ["none", "spots", "belly"], kangaroo: ["pouch"],
    seal: ["none", "spots", "forehead"], duck: ["none", "forehead", "heart"], bird: ["none", "forehead", "belly"], chicken: ["none", "forehead"], elephant: ["none", "forehead", "heart"],
    hippo: ["none", "spots", "heart"], redpanda: ["none", "belly"], lion: ["none", "belly"], horse: ["none", "blaze", "socks", "spots"], deer: ["spots", "none", "antler"],
  };
  const PATS = ["none", "none", "patch", "spots", "stripes", "socks", "belly", "forehead", "heart", "blaze", "calico", "mask"];
  const ACCENT = ["#5A4A40", "#8E6A58", "#FFFFFF", "#4A4040", "#F6B26B", "#E57373", "#6D8FB5", "#F48FB1"];
  const TUFTS = ["none", "none", "none", "curl", "spike", "bang", "leaf", "bow", "flower", "cowlick"];
  const BEAKS = new Set(["penguin", "duck", "bird", "chicken", "owl", "elephant", "horse", "cow", "croc", "frog", "hippo"]);
  const BODY = ["tshirt_blue", "stripe", "sweater", "overalls", "dress", null, null, null];
  const HAT = ["ribbon_pink", "ribbon_blue", "beret", "knit", "strawhat", "catears", null, null, null, null, null];

  // 見た目の キー（おなじ キー = おなじ 見た目）と、ちいさく 見ても わかる ちがい（種・色・もよう・あたまの かざり・服）
  function keyOf(n) { return JSON.stringify([n.sp, n.col || "", n.col2 || "", n.look || {}, n.outfit || {}]); }
  function silhouette(n) { const l = n.look || {}; return [n.sp, n.col || SPECIES[n.sp]?.col, l.pattern || "none", l.tuft || "none", JSON.stringify(n.outfit || {})].join("|"); }
  function nameOf(n) { return typeof TownFolk !== "undefined" ? TownFolk.name(n) : n.name; }
  // 役の なかの 種の しばり（役の 名前か セリフに 種が 出る）
  function locked(n) {
    if (typeof TOWNSFOLK_DATA === "undefined") return true;
    const role = TOWNSFOLK_DATA.crowd[n.id];
    if (!role) return true;
    const nm = TOWNSFOLK_DATA.crowdNames[role] || "", names = Object.values(NpcArt.SP).map((s) => s.name);
    const kata = (s) => s.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    if (names.some((w) => nm.includes(w) || nm.includes(kata(w)))) return true;
    return TOWNSFOLK_DATA.lines.some((l) => l.npc === role && SOUNDS.test(JSON.stringify(l.text || l.lines || l)));
  }
  function mapGroup(mapId) {
    if (/^(city|museum)/.test(mapId)) return "city";
    if (/^(harbor|coast|aquarium)/.test(mapId)) return "harbor";
    if (/^airport/.test(mapId)) return "airport";
    if (/^heiwadai/.test(mapId)) return "heiwadai";
    return "town";
  }
  function build(n, sp, salt) {
    const S = NpcArt.SP[sp], id = n.id + "#" + salt, cols = pick(S.cols, id, 1), pats = ALLOWED[sp] || PATS;
    const pattern = pick(pats, id, 2), look = {
      eye: pick(NpcArt.EYE, id, 3), brow: pick(["none", "none", "soft", "thick", "up", "worry"], id, 4), cheek: pick(NpcArt.CHEEK, id, 5),
      pattern, tuft: pick(TUFTS, id, 6), acc: pick(ACCENT.slice(4), id, 7),
    };
    if (!BEAKS.has(sp) && H(id, 8) < 0.45) look.mouth = pick(NpcArt.MOUTH, id, 9);
    if (pattern !== "none") {
      look.col3 = H(id, 11) < 0.5 ? NpcArt.shade(cols[0], 0.62) : pick(ACCENT, id, 10);
      if (look.col3.toUpperCase() === String(cols[0]).toUpperCase()) look.col3 = cols[0].toUpperCase() === "#FFFFFF" ? "#5A4A40" : NpcArt.shade(cols[0], 0.62);
    }
    const outfit = { ...(n.outfit || {}) };
    if (!Object.keys(outfit).length) {
      const body = pick(BODY, id, 12), hat = look.tuft === "none" ? pick(HAT, id, 13) : null;
      if (body && ITEM_INDEX[body]) outfit.body = body;
      if (hat && ITEM_INDEX[hat]) outfit.head = hat;
    }
    return { sp, col: cols[0], col2: cols[1], look, outfit };
  }
  // 読みこみの さいご: 全員に look を のせる
  function assign() {
    const people = [], byId = new Map();
    for (const [mapId, d] of Object.entries(MAP_DEFS)) for (const n of d.npcs || []) { people.push({ n, mapId }); if (!byId.has(n.id)) byId.set(n.id, []); byId.get(n.id).push(n); }
    const keys = new Set(), sils = new Set(), given = new Set();
    const take = (n) => { keys.add(keyOf(n)); sils.add(silhouette(n)); };
    // 1) お店の 人（おなじ id は おなじ 人）
    const shopPeople = [];
    if (typeof SHOP_OWNERS !== "undefined") for (const [id, o] of Object.entries(SHOP_OWNERS)) shopPeople.push([id, o]);
    if (typeof BUY_SHOPS !== "undefined") for (const [id, s] of Object.entries(BUY_SHOPS)) if (s.keeper) shopPeople.push([id, s.keeper]);
    for (const [id, o] of shopPeople) { const f = SHOP[id]; if (f && !o.look) Object.assign(o, { ...f, look: { ...f.look } }, { sp: o.sp }); if (!keys.has(keyOf(o))) take(o); }
    // 2) 名前の ある 人（FIXED）→ 3) のこりの 人
    const names = new Map();
    for (const { n } of people) { const k = nameOf(n); names.set(k, (names.get(k) || new Set()).add(n.id)); }
    for (const nm of names.keys()) for (const w of nm.split(" ")) given.add(w);
    const done = new Set(), used = {};
    const order = [...people].sort((a, b) => (FIXED[b.n.id] ? 1 : 0) - (FIXED[a.n.id] ? 1 : 0) || a.mapId.localeCompare(b.mapId) || String(a.n.id).localeCompare(String(b.n.id)));
    for (const { n, mapId } of order) {
      if (done.has(n.id)) { const first = byId.get(n.id)[0]; if (first !== n) Object.assign(n, { sp: first.sp, col: first.col, col2: first.col2, look: first.look, outfit: first.outfit, name: first.name, given: first.given }); continue; }
      done.add(n.id);
      const f = FIXED[n.id];
      if (f) { Object.assign(n, { col: f.col || n.col, col2: f.col2 || n.col2, look: { ...f.look } }); take(n); continue; }
      if (n.look) { take(n); continue; } // マップで きめた 人は その まま
      const shared = (names.get(nameOf(n)) || new Set()).size > 1, free = !locked(n) && shared;
      // 種: しばりが なければ 町の なかまから、その 町で まだ すくない 種を
      let sp = n.sp && NpcArt.SP[n.sp] ? n.sp : "cat";
      if (free) {
        const g = mapGroup(mapId), pool = POOL[g], u = (used[g] = used[g] || {});
        sp = [...pool].sort((a, b) => (u[a] || 0) - (u[b] || 0) || H(n.id + a, 20) - H(n.id + b, 20))[0];
        u[sp] = (u[sp] || 0) + 1;
      }
      let spec = null;
      for (let salt = 0; salt < 400; salt++) {
        const s = build(n, sp, salt);
        if (!keys.has(keyOf(s)) && !sils.has(silhouette(s))) { spec = s; break; }
      }
      spec = spec || build(n, sp, 999);
      Object.assign(n, spec); take(n);
      // 名前: おなじ 名前の 人が いれば 1人ずつ（役の 名前の まえの ことば ＋ 種の 名前）
      if (shared) {
        const base = nameOf(n), head = base.includes("の ") ? base.split("の ")[0] + "の" : { town: "タウンの", city: "シティの", harbor: "みなとの", airport: "くうこうの", heiwadai: "へいわだいの" }[mapGroup(mapId)];
        const list = NAMES[sp] || NAMES.cat, at = Math.floor(H(n.id, 30) * list.length);
        const nm = list.map((_, i) => list[(i + at) % list.length]).find((w) => !given.has(w)) || list[at] + (given.size % 9);
        given.add(nm);
        n.name = head + " " + nm; n.given = true;
      }
    }
    // 4) お店に くる お客さん（きまった 60人。町の人とも ちがう 見た目。SvgCache の キーが ふえつづけない）
    customers.length = 0;
    const all = Object.keys(NpcArt.SP);
    for (let i = 0; customers.length < CUSTOMERS && i < CUSTOMERS * 6; i++) {
      const sp = all[i % all.length], base = { id: "customer" + i, outfit: {} };
      for (let salt = 0; salt < 60; salt++) {
        const c = build(base, sp, salt);
        if (keys.has(keyOf(c)) || sils.has(silhouette(c))) continue;
        if (sp === "penguin" || sp === "seal") delete c.outfit.body;
        c.cid = customers.length; c.name = SPECIES[sp].name + "さん"; take(c); customers.push(c); break;
      }
    }
    return people.length;
  }
  // つぎの お客さん（さいきんの 6人は くりかえさない）
  const CUSTOMERS = 60, customers = [], recent = [];
  function customer() {
    const pool = customers.filter((c) => !recent.includes(c.cid)), c = U.pick(pool.length ? pool : customers);
    recent.push(c.cid); if (recent.length > 6) recent.shift();
    return { sp: c.sp, col: c.col, col2: c.col2, look: c.look, outfit: { ...c.outfit }, name: c.name, cid: c.cid };
  }
  // テスト・PokaDebug 用: 全員の 見た目の ようす
  // sameLook: 見た目の キーか 小さく 見た ちがいが おなじ 2人／sameName: おなじ 名前の 2人（id の ペア）
  function report() {
    const seen = new Set(), key = new Map(), sil = new Map(), nm = new Map(), sameLook = [], sameName = [], species = new Set();
    for (const d of Object.values(MAP_DEFS)) for (const n of d.npcs || []) {
      if (seen.has(n.id + "")) continue;
      seen.add(n.id + ""); species.add(n.sp);
      for (const [m, v, bad] of [[key, keyOf(n), sameLook], [sil, silhouette(n), sameLook], [nm, nameOf(n), sameName]]) { if (m.has(v)) bad.push(m.get(v) + " / " + n.id); else m.set(v, n.id); }
    }
    return { people: seen.size, species: species.size, sameLook, sameName };
  }
  return { assign, report, customer, customers, keyOf, silhouette, FIXED, NAMES, POOL };
})();
NpcCast.assign();
