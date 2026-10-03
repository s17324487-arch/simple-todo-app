// ファッションショー「ぽかぽか コレクション」の きまり（UI-36）。オーナーの FB 2026-10-01「池袋駅にファッションショーができる所を追加してほしい。
// ファッションのレベルとタイミングに合わせてごわががポーズをとる(ボタンを押す)ことで、点数が決まる。ボタンを押す操作は、難しめにして。審査コメントも欲しい
// ところだ。…点数によってお金がもらえるのと、景品を用意して。記念写真ももらえるようにして。…参加費500円もとる。実施できる場所は既存の建物(ほんのギャラリー)でよい」。
// ・会場は 池袋の「ファッションかん」（まえの なまえは ほんの ギャラリー）（館と うけつけ・きがえ・しゃしんの かべは js/fashion-hall.js、ランウェイの 画面は js/fashion-scene.js）。
// ・うけつけで さんかひ 500コイン（entry）→ きがえ → ランウェイ。ショーを はじめた ときに entry を つかう（とちゅうで やめても もどらない）。
// ・テーマは 日がわり（8しゅ・端末の 日づけ）。テーマに あう ふくは なまえ・ふくの かたち（wear）・いろ で きめる（tagsOf）。
// ・てんすう（1人 100てん）= おしゃれ レベル 60（ふくの かず 20・ねだん 15・テーマ 15・いろの そろえかた 10）＋ ポーズ 30（3かい × 10）＋ パーフェクト 10。
//   ポーズ: ランウェイの さきで カメラの わが ちぢまって まんなかの わに かさなる ときに「ポーズ！」。ぴったり ±50ms・いいね ±100ms・おしい ±170ms（むずかしめ）。
//   わは だんだん はやく なる（1人めの 1かいめ 1.0びょう → 3人めの 3かいめ 0.62びょう）。まつ じかんは まいかい ちがう（おぼえて おせない）。
// ・ショーの てんすうは 3人の へいきん。しんさいん 3人（メリー・レオ・ミミ）が 1〜10てんの ふだと ひとこと（みる ところが ちがう）。
// ・ランク: グランプリ（90〜）・ゴールド（75〜）・シルバー（60〜）・ブロンズ（40〜）・がんばったで しょう。コイン 2000／1200／800／500／200。
//   はじめて とどいた ランクの けいひん（トロフィー と 服。下の ランクの ぶんも まとめて）。きねん しゃしん（絵の データ・12まい まで）。
// セーブは あたらしい 項目 Save.d.fashion だけ（Save.SCHEMA は そのまま）。
const FashionShow = (() => {
  const FEE = 500, MAX_PHOTOS = 12, SLOTS = ["head", "face", "neck", "body", "back"];
  const THEMES = [
    { id: "kawaii", name: "かわいい", hint: "ピンクや リボン・ハート・うさぎの ふく", col: "#FF8FB8" },
    { id: "cool", name: "かっこいい", hint: "くろっぽい いろや サングラス・マント・シルクハット", col: "#5B6CC9" },
    { id: "natsu", name: "なつ", hint: "むぎわらぼうしや Tシャツ・サングラス", col: "#FFB347" },
    { id: "fuyu", name: "ふゆ", hint: "ニットぼうや マフラー・セーター", col: "#7FB8E0" },
    { id: "animal", name: "どうぶつ", hint: "ねこみみや うさぎ・くま・いきものの ふく", col: "#C69A70" },
    { id: "yumekawa", name: "ゆめかわ", hint: "パステルの いろや ほし・はね・ティアラ", col: "#B79BEA" },
    { id: "kichin", name: "きちんと", hint: "ちょうネクタイや シルクハット・ワンピース・ネックレス", col: "#4E5585" },
    { id: "genki", name: "げんき", hint: "はっぴや はちまき・オーバーオール・リュック", col: "#5CC97B" },
  ];
  const THEME = Object.fromEntries(THEMES.map((t) => [t.id, t]));
  // テーマに あう ふく: ふくの かたち（wear）・なまえ・いろ（family）の どれかが あえば その テーマ
  const RULES = {
    kawaii: { wear: ["ribbon", "heartglasses", "blush", "catears", "bunnyhood", "bell", "bib", "dress", "apron", "flowercrown", "sakura_wreath", "gacha_heartclip", "gacha_bunnyears", "gacha_barrette", "gacha_berrytie", "gacha_locket", "gacha_dotbow"], name: /リボン|ハート|うさぎ|うさみみ|ねこ|いちご|もも|ピンク|はなびら|はなかんむり/, fam: ["pink"] },
    cool: { wear: ["sunglasses", "tophat", "cape", "helmet", "armor", "batwings"], name: /マント|サングラス|ジャケット|よぞら|つきよ|くろばら|ゆうしゃ|シャチ|ヒーロー|ぶとうかい/, fam: ["black", "gray"], dark: true },
    natsu: { wear: ["strawhat", "tshirt", "sunglasses", "gacha_roundshades", "kc_cap", "kc_tee"], name: /むぎわら|Tシャツ|おひさま|マリン|うみ|すいか|ころころ|はなび|サングラス|ジンベエ|クマノミ/ },
    fuyu: { wear: ["knit", "muffler", "sweater"], name: /ニット|マフラー|セーター|ゆき|クリスマス|もこもこ|ポンチョ|カーディガン/ },
    animal: { wear: ["catears", "bunnyhood", "shell", "batwings", "gacha_bearears", "gacha_bunnyears", "gacha_unicorn", "aqc_whalehat", "aqc_orcapack"], name: /ねこ|うさぎ|くま|パンダ|こぐま|ユニコーン|かめ|こうもり|ジンベエ|シャチ|おさかな|クマノミ|マンタ|ステゴ|プテラ|ほねほね|きば|すずの/ },
    yumekawa: { wear: ["fairywings", "wings", "starclip", "crown", "gacha_tiara", "gacha_unicorn", "gacha_butterfly", "gacha_shootingstar", "gacha_starglasses", "gacha_pendant", "gacha_starsticker"], name: /ほし|ゆめ|ようせい|てんし|にじ|ユニコーン|パール|ちょうちょ|ティアラ|きらきら|ながれぼし|おうかん|つき/, pastel: true },
    kichin: { wear: ["bowtie", "necklace", "tophat", "glasses", "beret", "dress", "gacha_pearls", "gacha_pearlband", "gacha_dotbow"], name: /ちょうネクタイ|ネックレス|シルクハット|ベレー|ワンピース|カーディガン|ドレス|ジャケット|パール|しんじゅ|ネクタイ/ },
    genki: { wear: ["hachimaki", "happi", "overalls", "backpack", "helmet", "partyhat", "gacha_boppers"], name: /はちまき|はっぴ|サロペット|オーバーオール|リュック|パーティー|まつり|ヘルメット|ぴょこぴょこ/ },
  };
  // テーマの ポーズ（3かい。うでの ポーズは CHARA_GESTURES・js/puri-pose.js と js/fashion-art.js）。2人め・3人めは 1つずつ ずらす
  const POSES = {
    kawaii: ["heart", "nyan", "peace"], cool: ["fs_point", "fs_hip", "shakin"], natsu: ["wai", "fs_star", "peace"], fuyu: ["fs_wave", "heart", "nyan"],
    animal: ["nyan", "fs_wave", "wai"], yumekawa: ["fs_star", "heart", "fs_wave"], kichin: ["fs_hip", "fs_wave", "fs_point"], genki: ["wai", "shakin", "fs_star"],
  };
  // しんさいん（Art.npcSvg の sp・outfit）と しかい
  const JUDGES = [
    { id: "mery", name: "メリー", role: "ようふくやさんの てんちょう", sp: "sheep", look: "コーデ", outfit: { face: "glasses", neck: "scarf_red" } },
    { id: "leo", name: "レオ", role: "デザイナー", sp: "lion", look: "テーマ", outfit: { head: "beret", neck: "bowtie_red" } },
    { id: "mimi", name: "ミミ", role: "トップモデル", sp: "rabbit", look: "ポーズ", outfit: { face: "sunglasses", neck: "necklace" } },
  ];
  const MC = { id: "konkon", name: "コンコン", role: "しかい", sp: "fox", outfit: { neck: "bowtie_blue" } };
  // ポーズの はんてい（びょう）と てんすう
  const WINDOW = { perfect: 0.05, great: 0.1, good: 0.17 };
  const POINTS = { perfect: 10, great: 7, good: 4, miss: 0 };
  const JUDGE_TEXT = { perfect: "ぴったり！", great: "いいね！", good: "おしい！", miss: "ミス……" };
  // カメラの わが ちぢまる じかん（1かいめ〜3かいめ）× 1人め〜3人め
  const RING = [1.0, 0.85, 0.72], SPEED = [1, 0.93, 0.86];
  const RANKS = [
    { id: "grand", name: "グランプリ", min: 90, coins: 2000, col: "#F7C948" },
    { id: "gold", name: "ゴールド", min: 75, coins: 1200, col: "#F2B83A" },
    { id: "silver", name: "シルバー", min: 60, coins: 800, col: "#B9C3D3" },
    { id: "bronze", name: "ブロンズ", min: 40, coins: 500, col: "#D49A6A" },
    { id: "try", name: "がんばったで しょう", min: 0, coins: 200, col: "#9FD3F0" },
  ];
  const RANK = Object.fromEntries(RANKS.map((r) => [r.id, r]));
  // はじめて とどいた ランクの けいひん（トロフィーは 家具・服は 1こ。絵は js/fashion-art.js）
  const PRIZES = {
    bronze: { furn: "fs_trophy_bronze", wear: "fs_flash_glasses" },
    silver: { furn: "fs_trophy_silver", wear: "fs_runway_cape" },
    gold: { furn: "fs_trophy_gold", wear: "fs_star_tiara" },
    grand: { furn: "fs_trophy_grand", wear: "fs_best_sash" },
  };
  const FURN = [
    { id: "fs_trophy_bronze", name: "ブロンズ トロフィー", w: 44, h: 66, depth: 30, comfort: 6, desc: "ぽかぽか コレクションで ブロンズに なった しるし。" },
    { id: "fs_trophy_silver", name: "シルバー トロフィー", w: 46, h: 72, depth: 30, comfort: 8, desc: "ぽかぽか コレクションで シルバーに なった しるし。" },
    { id: "fs_trophy_gold", name: "ゴールド トロフィー", w: 48, h: 78, depth: 32, comfort: 10, desc: "ぽかぽか コレクションで ゴールドに なった しるし。" },
    { id: "fs_trophy_grand", name: "グランプリ トロフィー", w: 58, h: 92, depth: 36, comfort: 14, desc: "ぽかぽか コレクションの グランプリ！ ほしの かざりが かがやく。" },
  ];
  const WEARS = [
    { id: "fs_flash_glasses", name: "きらきら サングラス", slot: "face", col: ["#2C2A3A", "#FFD84D"], st: { sp: 2 }, desc: "フラッシュに まけない、ほしの ふちの サングラス。" },
    { id: "fs_runway_cape", name: "ランウェイ マント", slot: "back", col: ["#B23A6A", "#F7C948"], st: { spd: 2 }, desc: "ランウェイで ひらりと なびく、ほしの もようの マント。" },
    { id: "fs_star_tiara", name: "スターの ティアラ", slot: "head", col: ["#F7E07A", "#FF9EC4"], st: { sp: 3 }, desc: "ゴールドの ごほうび。まんなかに ほしの いし。" },
    { id: "fs_best_sash", name: "ベストドレッサーの たすき", slot: "neck", col: ["#E8434F", "#F7C948"], st: { atk: 2, def: 2 }, desc: "グランプリの しるし。かたから ななめに かける たすき。" },
  ];
  for (const f of FURN) { const it = { ...f, price: 0, kind: "floor", rare: true, exclusive: "fashion", fashionPrize: true }; FURNITURE.push(it); FURN_INDEX[it.id] = it; }
  for (const w of WEARS) { const it = { ...w, wear: w.id, price: 0, rare: true, exclusive: "fashion", fashionPrize: true }; WEAR_ITEMS.push(it); ITEM_INDEX[it.id] = it; }
  const PRIZE_IDS = new Set([...FURN.map((f) => f.id), ...WEARS.map((w) => w.id)]);

  // ---- いろ ----
  const hsl = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return null;
    const n = parseInt(m[1], 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
  };
  // いろの なかま（いろの そろえかた・テーマ）
  const family = (hex) => {
    const c = hsl(hex); if (!c) return null;
    if (c.l < 0.22) return "black";
    if (c.s < 0.16) return c.l > 0.82 ? "white" : c.l < 0.45 ? "black" : "gray";
    if (c.l > 0.94) return "white";
    if (c.h >= 15 && c.h < 45 && c.l < 0.48) return "brown";
    const h = c.h;
    return h < 15 ? "red" : h < 45 ? "orange" : h < 70 ? "yellow" : h < 170 ? "green" : h < 250 ? "blue" : h < 290 ? "purple" : h < 345 ? "pink" : "red";
  };
  const FAMILY_NAME = { red: "あか", orange: "オレンジ", yellow: "きいろ", green: "みどり", blue: "あお", purple: "むらさき", pink: "ピンク", brown: "ちゃいろ", white: "しろ", black: "くろ", gray: "はい" };
  const pastel = (hex) => { const c = hsl(hex); return !!c && c.l >= 0.74 && c.s >= 0.3 && ["pink", "purple", "blue", "green"].includes(family(hex)); };
  const mainCol = (it) => (it && Array.isArray(it.col) && it.col[0]) || null;

  // ---- テーマに あう ふく ----
  const tagCache = new Map();
  const tagsOf = (id) => {
    if (tagCache.has(id)) return tagCache.get(id);
    const it = ITEM_INDEX[id]; if (!it) return [];
    const col = mainCol(it), fam = col ? family(col) : null, c = col ? hsl(col) : null, out = [];
    for (const [t, R] of Object.entries(RULES)) {
      if (R.wear.includes(it.wear) || R.name.test(it.name || "") || (fam && R.fam && R.fam.includes(fam)) || (R.pastel && col && pastel(col)) || (R.dark && c && ["blue", "purple"].includes(fam) && c.l < 0.42)) out.push(t);
    }
    tagCache.set(id, out); return out;
  };

  // ---- おしゃれ レベル（1人 0〜60）----
  const outfitOf = (id, d = Save.d) => ({ outfit: { ...((d.chars && d.chars[id] && d.chars[id].outfit) || {}) }, color: (d.chars && d.chars[id] && d.chars[id].color) || "soft" });
  const valueOf = (it) => (it.price > 0 ? it.price : it.rare || it.exclusive ? 2500 : 0);
  const stars = (total) => Math.max(1, Math.min(5, 1 + Math.floor(total / 12.001)));
  const level = (id, themeId, d = Save.d, outfit = null) => {
    const o = outfit || outfitOf(id, d).outfit, items = SLOTS.map((s) => (o[s] && ITEM_INDEX[o[s]]) || null);
    const worn = items.filter(Boolean), slots = worn.length * 4;
    const sum = worn.reduce((a, it) => a + valueOf(it), 0), value = Math.round(15 * Math.min(1, Math.log(1 + sum / 150) / Math.log(1 + 80)));
    const matched = worn.filter((it) => tagsOf(it.id).includes(themeId)).map((it) => it.id), theme = [0, 6, 11, 15][Math.min(3, matched.length)];
    const fams = {}; for (const it of worn) { const f = mainCol(it) && family(mainCol(it)); if (f) fams[f] = (fams[f] || 0) + 1; }
    const best = Object.entries(fams).sort((a, b) => b[1] - a[1])[0] || null, harmony = best && best[1] >= 3 ? 10 : best && best[1] >= 2 ? 5 : 0;
    const total = slots + value + theme + harmony;
    return { id, total, slots, value, theme, harmony, sum, stars: stars(total), matched, family: best && best[1] >= 2 ? best[0] : null, empty: SLOTS.filter((s, i) => !items[i]), worn: worn.map((it) => it.id) };
  };

  // ---- ポーズ ----
  const judgeOf = (dt) => { if (dt == null || !Number.isFinite(dt)) return "miss"; const a = Math.abs(dt); return a <= WINDOW.perfect ? "perfect" : a <= WINDOW.great ? "great" : a <= WINDOW.good ? "good" : "miss"; };
  const ringDur = (model, k) => +(RING[k] * SPEED[model]).toFixed(3);
  const poseOf = (themeId, model, k) => { const p = POSES[themeId] || POSES.kawaii; return p[(k + model) % p.length]; };
  // まいかい ちがう まちじかん（ショーの たね から。0.5〜0.9びょう）
  const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  // ---- しんさ ----
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SLOT_WORD = { head: "あたま", face: "かお", neck: "くび", body: "ふく", back: "せなか" };
  const nameOfItem = (id) => (ITEM_INDEX[id] ? ITEM_INDEX[id].name : "");
  // ひとこと（{t}: テーマ・{i}: ふくの なまえ・{s}: つけて いない ところ・{c}: いろ）
  const pickBy = (list, seed) => list[Math.abs(seed) % list.length];
  const commentOf = (judge, r, themeId, seed) => {
    const L = r.level, n = r.counts, item = nameOfItem(L.matched[0] || L.worn[seed % Math.max(1, L.worn.length)] || ""), t = THEME[themeId].name;
    const fill = (s) => s.replace("{t}", t).replace("{i}", item || "その ふく").replace("{s}", SLOT_WORD[L.empty[0]] || "あたま").replace("{c}", FAMILY_NAME[L.family] || "");
    if (judge === "mery") {
      if (!L.worn.length) return fill("ふくを きて でると もっと すてきよ。きがえ スペースで えらんでね。");
      if (L.harmony >= 10) return fill(pickBy(["いろの そろえかたが とっても じょうず！", "{c}いろで そろえたのね。すてき！"], seed));
      if (L.slots >= 20) return fill(pickBy(["あたまから せなかまで ぜんぶ おしゃれ！", "どこを みても すてきな コーデ！"], seed));
      if (L.slots <= 8) return fill("{s}にも なにか つけると もっと すてきよ。");
      if (L.harmony >= 5) return fill("{c}いろが きれいに そろってるわ。");
      return fill(pickBy(["{i}が よく にあってる！", "{s}にも ひとつ たすと もっと よく なるわ。"], seed));
    }
    if (judge === "leo") {
      if (L.theme >= 15) return fill(pickBy(["テーマ「{t}」に ぴったり！ さすがだね。", "「{t}」の テーマを いちばん よく わかってる！"], seed));
      if (L.theme >= 6) return fill(pickBy(["「{t}」らしさが でてる。いいね！", "{i}が「{t}」に あってるよ。"], seed));
      if (L.value >= 12) return fill("いい ものを えらんで いるね。つぎは テーマ「{t}」も ためして みて。");
      return fill("テーマ「{t}」の ふくも ためして みて。きっと もっと よく なる！");
    }
    if (n.perfect === 3) return fill(pickBy(["ポーズ、ぜんぶ ぴったり！ プロみたい！", "カメラの わに ぴったり！ かんぺきよ！"], seed));
    if (r.pose >= 21) return fill(pickBy(["ポーズが きまってた！ かっこいい！", "すてきな えがおと ポーズ！"], seed));
    if (r.pose >= 12) return fill("いい えがお！ つぎは もっと ぴったりに。");
    if (n.miss >= 2) return fill("わが かさなる ときに「ポーズ！」。もういちど チャレンジ！");
    return fill("ランウェイ、どうどうと あるけてたよ！");
  };
  // 1人の けっか（judgments: ['perfect'|'great'|'good'|'miss'] × 3）
  const scoreModel = (lv, judgments, themeId, seed = 0) => {
    const counts = { perfect: 0, great: 0, good: 0, miss: 0 }; for (const j of judgments) counts[j in counts ? j : "miss"]++;
    const pose = judgments.reduce((a, j) => a + (POINTS[j] || 0), 0), bonus = counts.perfect === 3 ? 10 : 0, total = lv.total + pose + bonus;
    const r = { id: lv.id, level: lv, judgments: [...judgments], counts, fashion: lv.total, pose, bonus, total };
    const adj = {
      mery: ((lv.harmony / 10) * 0.5 + (lv.slots / 20) * 0.5 - 0.5) * 2,
      leo: ((lv.theme / 15) * 0.6 + (lv.value / 15) * 0.4 - 0.5) * 2,
      mimi: ((pose / 30) * 0.7 + (bonus / 10) * 0.3 - 0.5) * 2,
    };
    r.cards = JUDGES.map((j) => clamp(Math.round(total / 10 + adj[j.id]), 1, 10));
    r.comments = JUDGES.map((j, k) => commentOf(j.id, r, themeId, seed + k));
    return r;
  };
  const rankOf = (score) => RANKS.find((r) => score >= r.min) || RANKS[RANKS.length - 1];

  // ---- セーブ ----
  const st = (d = Save.d) => {
    let f = d.fashion; if (!f || typeof f !== "object" || Array.isArray(f)) f = d.fashion = {};
    if (!Number.isFinite(f.entry) || f.entry < 0) f.entry = 0;
    for (const k of ["shows", "best"]) if (!Number.isFinite(f[k]) || f[k] < 0) f[k] = 0;
    for (const k of ["ranks", "got"]) if (!f[k] || typeof f[k] !== "object" || Array.isArray(f[k])) f[k] = {};
    if (!Array.isArray(f.photos)) f.photos = [];
    f.photos = f.photos.filter((p) => p && typeof p === "object" && typeof p.id === "string" && p.o && typeof p.o === "object").slice(-MAX_PHOTOS);
    if (f.last !== null && typeof f.last !== "string") f.last = null;
    return f;
  };
  const dayNumber = (date = new Date()) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const themeOn = (date = new Date()) => THEMES[((dayNumber(date) % THEMES.length) + THEMES.length) % THEMES.length];

  return {
    FEE, MAX_PHOTOS, SLOTS, THEMES, THEME, RULES, POSES, JUDGES, MC, WINDOW, POINTS, JUDGE_TEXT, RING, SPEED, RANKS, RANK, PRIZES, FURN, WEARS, PRIZE_IDS, FAMILY_NAME,
    hsl, family, pastel, tagsOf, level, stars, judgeOf, ringDur, poseOf, rng, scoreModel, rankOf, commentOf, st, dayNumber, themeOn,
    theme() { return this.override ? THEME[this.override] || themeOn() : themeOn(); },
    override: null, // PokaDebug.fashionTheme（テスト）
    hasEntry() { return st().entry > 0; },
    // うけつけ: さんかひを はらう（もう はらって いれば なにも しない）
    pay() {
      const f = st(); if (f.entry > 0) return { ok: true, already: true };
      if (Save.d.coins < FEE) return { ok: false, short: FEE - Save.d.coins };
      Save.addCoins(-FEE); f.entry = Date.now(); Save.mark(); Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
      return { ok: true };
    },
    // ショーを はじめる（entry を つかう）。3人の ならび・テーマ・まいかい ちがう まちじかんの たね
    begin(seed = Date.now()) {
      const f = st(); if (!(f.entry > 0)) return null;
      f.entry = 0; Save.mark(); Save.write();
      const th = this.theme(), order = Save.d.order.slice();
      return { id: "fs" + seed.toString(36), seed: seed >>> 0, theme: th.id, order, looks: Object.fromEntries(order.map((id) => [id, outfitOf(id)])), levels: Object.fromEntries(order.map((id) => [id, level(id, th.id)])), done: false };
    },
    // 1人の けっか（ランウェイの しんさと ショーの けっかで おなじ ひとこと に なる ように たねを そろえる）
    modelResult(show, i, judgments) { return scoreModel(show.levels[show.order[i]], judgments, show.theme, ((show.seed >>> 0) % 997) + i * 7); },
    // ショーの けっか（results: [{ id, judgments, gestures, face }] × 3）→ てんすう・ランク・ごほうび・しゃしん。おなじ ショーは 1かいだけ
    finish(show, results) {
      const f = st(); if (!show || show.done || f.last === show.id) return show && show.summary ? show.summary : null;
      const models = results.map((r) => this.modelResult(show, show.order.indexOf(r.id), r.judgments));
      const score = Math.round(models.reduce((a, m) => a + m.total, 0) / Math.max(1, models.length)), rank = rankOf(score);
      Save.addCoins(rank.coins);
      // はじめて とどいた ランク（と その した の ランク）の けいひん
      const got = [], order = ["bronze", "silver", "gold", "grand"], reach = order.indexOf(rank.id);
      for (let k = 0; k <= reach; k++) {
        const P = PRIZES[order[k]]; if (!P || f.got[P.furn]) continue;
        Save.d.furn[P.furn] = (Save.d.furn[P.furn] || 0) + 1; WearStock.add(P.wear, 1);
        const day = new Date().toISOString().slice(0, 10); f.got[P.furn] = day; f.got[P.wear] = day; got.push(P.furn, P.wear);
      }
      f.ranks[rank.id] = (f.ranks[rank.id] || 0) + 1; f.shows++; f.best = Math.max(f.best, score); f.last = show.id;
      const photo = { id: show.id, t: Date.now(), th: show.theme, s: score, rk: rank.id, r: show.order.slice(), o: Object.fromEntries(show.order.map((id) => [id, [show.looks[id].outfit, show.looks[id].color]])), g: Object.fromEntries(results.map((r) => [r.id, r.gestures ? r.gestures[r.gestures.length - 1] : "heart"])), fc: Object.fromEntries(results.map((r) => [r.id, r.face || "smile"])) };
      f.photos.push(photo); while (f.photos.length > MAX_PHOTOS) f.photos.shift();
      Save.mark(); Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
      show.done = true; show.summary = { score, rank: rank.id, coins: rank.coins, got, models, photo };
      return show.summary;
    },
    photos() { return st().photos.slice(); },
    // ずかんの「どこで てに はいる？」
    source(id) {
      if (!PRIZE_IDS.has(id)) return null;
      const rk = Object.entries(PRIZES).find(([, p]) => p.furn === id || p.wear === id);
      return rk ? `いけぶくろの ファッションかんの ファッションショーで はじめて ${RANK[rk[0]].name}に なると もらえるよ。` : null;
    },
    // PokaDebug.fashion()
    state() {
      const f = st(), th = this.theme();
      return { entry: f.entry > 0, shows: f.shows, best: f.best, ranks: { ...f.ranks }, got: { ...f.got }, photos: f.photos.length, theme: th.id, themeName: th.name, levels: Object.fromEntries(Save.d.order.map((id) => [id, level(id, th.id)])) };
    },
  };
})();
