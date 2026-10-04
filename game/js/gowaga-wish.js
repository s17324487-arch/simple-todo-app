// ごわがの おねがい（UI-46。オーナーの FB 2026-10-02「お家で、ごわがからのお願いというイベントを追加して。内容は、○○に連れてって、や○○を食べたい、プリクラを撮りたい、ファッションショーをしたい など。お願いを実現できたら、たくさん感謝して甘えて。」）
// おうちで 3人の だれかが「おねがいが あるの」→「いいよ！」で すまほの「おねがい」に のる → かなえる（つれて いく・たべさせる・いっしょに あそぶ）
// → おうちに かえると 3人が まえに かけよって おれい → 「ぎゅー！」か「なでなで」→ しばらく くっついて あまえる（ハート・ごきげん・なかよし）。
// ・おねがいが くるのは おうちに はいって 6〜12びょう あと（6わり）。まえの おねがいから 12ふん たってから（ことわったら 6ふん）。すまほの アプリから きく ことも できる。
// ・かなった かどうか: たべさせる（Care.feed）・ついた ばしょ（館の かい・町と フィールド）・ぷりくら／ファッションショー／つり／ガチャ／しゅうかく の おわり。
// ・おねだり（UI-88。オーナーの 指示 2026-10-04「おねだりは家電やシール、ガチャガチャ、クレーンゲームも対象にして。とくにガチャガチャとクレーンゲームはよくやりたくなるようだ」）:
//   ネリカス でんき（つれてって・マッサージチェア・ためしの だい）・シール・ガチャ 3・クレーン 3 を たした（29しゅ）。ガチャと クレーンは w: 3（3ばい でやすい）。
//   beg が ある おねがいは 館（Meeときょれじゃ・ネリカス でんき）の その かいで、その場で「あっ、○○だ！ やりたい！」と おねだり する
//   （かいに はいって 4〜8びょう・はんぶんの かくりつ・おねがいが ない とき・まえの おねがいから 5ふん）。「いいよ！」で すまほの「おねがい」に のる（かなえかたは おうちの おねがいと おなじ）。
// セーブ: Save.d.wish（はじめて つかう ときに できる。Save.fresh() には ない）= { cur: { id, t, done, doneT } | null, last, n, log: [{ id, t, how }] }
const GowagaWish = {
  COOL: 12 * 60e3,
  CHANCE: 0.6,
  // 館の おねだり（UI-88）: まえの おねがいから 5ふん・かいに はいる たびに はんぶんの かくりつ・4〜8びょう あと
  BEG_COOL: 5 * 60e3,
  BEG_CHANCE: 0.5,
  AMAE: 24, // あまえる じかん（びょう）
  // kind: go（つれてって）・eat（たべたい）・do（あそびたい）。at: いる ばしょ（venue と floors・map・scene）。foods: たべもの。act: あそび
  // w: でやすさ（ない ときは 1）。beg: 館の その かいで おねだり する（venue と floors）・begAsk: その ときの ことば（UI-88。まどで ことばの とちゅうで おりかえさない ように \n で 2ぎょう）
  WISHES: [
    { id: "go_aquarium", kind: "go", who: "gachan", short: "すいぞくかん", ask: "すいぞくかんに つれてって！ くらげさん、みたいな〜", hint: "サンシャインいけぶの 12かい・13かいの すいぞくかんへ", thanks: "すいぞくかん、つれて いって くれて ありがとう！ くらげさん、きれい だったね♪", at: [{ venue: "mall", floors: [12, 13] }] },
    { id: "go_museum", kind: "go", who: "goji", short: "きょうりゅう はくぶつかん", ask: "はくぶつかんの ティラノさんに あいたい！ つれてって ガウっ", hint: "いけぶくろの きょうりゅう はくぶつかんへ", thanks: "ティラノさんに あえた！ つれて いって くれて ありがとう ガウっ", at: [{ venue: "museum" }] },
    { id: "go_arcade", kind: "go", who: "wanko", short: "Meeときょれじゃ", ask: "Meeときょれじゃに いきたい！ ゲームが いっぱい あるんだよ！", hint: "いけぶくろの Meeときょれじゃへ", thanks: "ゲームセンター、たのしかった！ つれて いって くれて ありがとう！", at: [{ venue: "arcade" }] },
    { id: "go_mall", kind: "go", who: "gachan", short: "サンシャインいけぶ", ask: "サンシャインいけぶで おかいもの したいな♪ つれてって？", hint: "いけぶくろの サンシャインいけぶ（1〜3かい）へ", thanks: "おかいもの、たのしかった♪ つれて いって くれて ありがとう！", at: [{ venue: "mall", floors: [1, 2, 3] }] },
    { id: "go_beach", kind: "go", who: "wanko", short: "しおかぜビーチ", ask: "うみに いきたい！ すなはまで かけっこ しよう！", hint: "しおかぜビーチへ", thanks: "うみ、ひろかった〜！ つれて いって くれて ありがとう！", at: [{ map: "coast" }] },
    { id: "go_forest", kind: "go", who: "goji", short: "どんぐりの もり", ask: "どんぐりの もりに いきたい。どんぐり ひろいたい ガウっ", hint: "どんぐりの もりへ", thanks: "もり、きもち よかった！ つれて いって くれて ありがとう ガウっ", at: [{ map: "forest" }] },
    { id: "go_airport", kind: "go", who: "gachan", short: "そらいろくうこう", ask: "ひこうき、ちかくで みたいな… くうこうに つれてって？", hint: "そらいろくうこうへ", thanks: "ひこうき、おっきかった！ つれて いって くれて ありがとう♪", at: [{ map: "airport" }] },
    { id: "go_kaden", kind: "go", who: "gachan", short: "ネリカス でんき", ask: "ネリカス でんきに いきたいな♪ おっきな テレビ みたい！", hint: "いけぶくろの ネリカス でんきへ", thanks: "でんきやさん、ピカピカ だったね♪ つれて いって くれて ありがとう！", at: [{ venue: "electronics" }] },
    { id: "eat_burger", kind: "eat", who: "wanko", short: "ハンバーガー", ask: "ハンバーガー たべたい！ チーズ とろ〜り！", hint: "バーガーやさんで かって、たべさせて あげよう", thanks: "ハンバーガー、おいしかった〜！ ありがとう！", foods: ["burger", "bm_hamburger", "bm_teriyaki", "bm_fish", "bm_chicken", "bm_ebi", "bm_double", "bm_big"] },
    { id: "eat_cake", kind: "eat", who: "gachan", short: "ショートケーキ", ask: "いちごの ショートケーキ たべたいな♪", hint: "ケーキやさんで かって、たべさせて あげよう", thanks: "ケーキ、あま〜い♪ ありがとう！", foods: ["cake", "annual_christmas_deza"] },
    { id: "eat_pudding", kind: "eat", who: "goji", short: "プリン", ask: "ぷるぷるの プリン たべたい ガウっ", hint: "ケーキやさん・ローリソン・スーパーで かえるよ", thanks: "プリン、ぷるぷる だった！ ありがとう ガウっ", foods: ["pudding", "annual_halloween_deza"] },
    { id: "eat_oden", kind: "eat", who: "wanko", short: "おでん", ask: "あったかい おでん たべたいな… クンクン", hint: "せぶんぶんで かって、たべさせて あげよう", thanks: "おでん、ぽかぽか〜！ ありがとう！", foods: ["oden"] },
    { id: "eat_omurice", kind: "eat", who: "gachan", short: "オムライス", ask: "オムライス たべたい！ ケチャップで ハート かいてね♪", hint: "びっくぽで かって、たべさせて あげよう", thanks: "オムライス、ハートの あじ♪ ありがとう！", foods: ["omurice"] },
    { id: "eat_karaage", kind: "eat", who: "goji", short: "からあげ", ask: "からあげ、ぼく いっぱい たべたい ガウっ", hint: "ローリソンで かって、たべさせて あげよう", thanks: "からあげ、カリカリ！ ありがとう ガウっ", foods: ["karaage"] },
    { id: "eat_crepe", kind: "eat", who: "gachan", short: "クレープ", ask: "クレープ たべたいな〜♪ いちごの やつ！", hint: "まちの クレープやさんで かうか、サンシャインいけぶで いっしょに たべよう", thanks: "クレープ、ふわふわ♪ ありがとう！", foods: ["crepe_berry", "crepe_choco", "crepe_custard", "crepe_ice", "ike_crepes_0", "ike_crepes_1", "ike_crepes_2", "ike_crepes_3", "ike_crepes_4", "ike_crepes_5"] },
    { id: "eat_pancake", kind: "eat", who: "wanko", short: "パンケーキ", ask: "ふわふわの パンケーキ たべたい！", hint: "びっくぽで かって、たべさせて あげよう", thanks: "パンケーキ、ふわっふわ！ ありがとう！", foods: ["pancake"] },
    { id: "do_purikura", kind: "do", who: "gachan", short: "ぷりくら", ask: "3にんで ぷりくら とりたい！ ハートの ポーズ しよ♪", hint: "Meeときょれじゃ 3かいの ぷりくら（300 コイン）", thanks: "ぷりくら、たからもの！ いっしょに とって くれて ありがとう♪", act: "purikura", beg: [{ venue: "arcade", floors: [3] }], begAsk: "ぷりくら あるよ♪\n3にんで とろうよ〜" },
    { id: "do_fashion", kind: "do", who: "wanko", short: "ファッションショー", ask: "ファッションショーに でたい！ ランウェイを あるいて みたい！", hint: "いけぶくろえきの ファッションかん（500 コイン）", thanks: "ランウェイ、どきどき したけど たのしかった！ ありがとう！", act: "fashion" },
    { id: "do_fishing", kind: "do", who: "goji", short: "つり", ask: "いっしょに つりが したい！ おっきい さかな つる ガウっ", hint: "つりざおを もって、いけや うみの ちかくで", thanks: "さかな、つれた！ いっしょに つって くれて ありがとう ガウっ", act: "fishing" },
    { id: "do_gacha", kind: "do", who: "wanko", short: "ガチャガチャ", ask: "ガチャガチャ まわして みたい！ なにが でるかな？", hint: "Meeときょれじゃ 2かいの ガチャ コーナー（200 コイン）", thanks: "ガチャガチャ、どきどき した！ ありがとう！", act: "gacha", w: 3, beg: [{ venue: "arcade", floors: [2, 4] }], begAsk: "あっ、ガチャガチャだ！\n1かい まわしたい！" },
    { id: "do_harvest", kind: "do", who: "goji", short: "やさいの しゅうかく", ask: "はたけで やさい ぬきたい！ うんとこしょ ガウっ", hint: "おうちの よこの はたけで、そだった やさいを とろう", thanks: "やさい、とれた！ いっしょに して くれて ありがとう ガウっ", act: "harvest" },
    // UI-88: 家電・シール・ガチャ・クレーン（ガチャと クレーンは よく やりたく なる → w: 3）
    { id: "do_massage", kind: "do", who: "goji", short: "マッサージチェア", ask: "マッサージチェアに すわって みたい ガウっ。もみもみ〜", hint: "ネリカス でんき 10かいの マッサージチェア", thanks: "もみもみ、きもち よかった ガウっ… ありがとう！", act: "massage", beg: [{ venue: "electronics", floors: [10] }], begAsk: "あっ、マッサージチェアだ！\nすわって いい？ ガウっ" },
    { id: "do_kaden_try", kind: "do", who: "wanko", short: "でんきやさんの おためし", ask: "でんきやさんで ゲームや カメラを ためして みたい！", hint: "ネリカス でんき 1かい・3かいの ためしの だい", thanks: "おためし、たのしかった！ いっしょに きて くれて ありがとう！", act: "demo", beg: [{ venue: "electronics", floors: [1, 3] }], begAsk: "わあ、さわれる だいだ！\nためして みて いい？" },
    { id: "do_sticker", kind: "do", who: "gachan", short: "シール", ask: "キラキラの シール ほしいな♪ シールちょうに はりたい！", hint: "ネリカス でんき 1かいの シールうりば か Mee 4かいの ガチャ", thanks: "シール、かわいい♪ シールちょうに はるね！ ありがとう！", act: "sticker", beg: [{ venue: "electronics", floors: [1] }, { venue: "arcade", floors: [4] }], begAsk: "シールが いっぱい♪\n1つ ほしいな… だめ？" },
    { id: "do_gacha_forest", kind: "do", who: "gachan", short: "ガチャガチャの もり", ask: "ガチャガチャの もりで いっぱい まわしたいな♪", hint: "Meeときょれじゃ 4かいの ガチャガチャの もり", thanks: "ガチャガチャ、かわいいの でた♪ ありがとう！", act: "gacha", w: 3, beg: [{ venue: "arcade", floors: [2, 4] }], begAsk: "なにが でるかな？\nガチャガチャ しても いい？" },
    { id: "do_gacha_goji", kind: "do", who: "goji", short: "フィギュアの ガチャ", ask: "ガチャガチャで フィギュア あてたい ガウっ！", hint: "Meeときょれじゃ 2かい・4かいの ガチャ（200 コイン）", thanks: "ガチャガチャ、どきどき した ガウっ！ ありがとう！", act: "gacha", w: 3, beg: [{ venue: "arcade", floors: [2, 4] }], begAsk: "ガウっ！ ガチャガチャ\nやりたい！ 1かい だけ！" },
    { id: "do_crane", kind: "do", who: "wanko", short: "クレーンゲーム", ask: "クレーンゲーム やりたい！ ぬいぐるみ とるんだ！", hint: "Meeときょれじゃの クレーンゲーム（1かい 100 コイン）", thanks: "クレーンゲーム、たのしかった！ いっしょに やって くれて ありがとう！", act: "crane", w: 3, beg: [{ venue: "arcade", floors: [1, 2, 3, 4] }], begAsk: "あっ、クレーンゲーム！\nやりたい やりたい！" },
    { id: "do_crane_snack", kind: "do", who: "gachan", short: "おかしの クレーン", ask: "おかしの クレーンゲーム やって みたいな♪", hint: "Meeときょれじゃ 2かいの おかし キャッチャー など", thanks: "クレーンゲーム、どきどき したね♪ ありがとう！", act: "crane", w: 3, beg: [{ venue: "arcade", floors: [2, 3] }], begAsk: "おかしが いっぱい♪\nクレーンで とって みたい！" },
    { id: "do_crane_goji", kind: "do", who: "goji", short: "ぬいぐるみの クレーン", ask: "クレーンゲームで ぬいぐるみ とりたい ガウっ！", hint: "Meeときょれじゃの クレーンゲーム（チケットでも できる）", thanks: "クレーンゲーム、さいこう ガウっ！ ありがとう！", act: "crane", w: 3, beg: [{ venue: "arcade", floors: [1, 2, 3, 4] }], begAsk: "ガウっ！ あの ぬいぐるみ、\nぼくが とる！" },
  ],
  KIND: { go: { name: "つれてって", col: "#BFE6C9" }, eat: { name: "たべたい", col: "#FBE3A0" }, do: { name: "あそびたい", col: "#F9CFDE" } },
  // おれいの とき ほかの 2人・あまえる ことば・ぎゅー／なでなでの へんじ・あまえて いる あいだの ひとこと
  OTHER: { wanko: ["ぼくも たのしかった！ ありがとう！", "わーい！ ありがとう！ だいすき！"], gachan: ["がちゃんも うれしい♪ ありがとう", "ありがとう… えへへ"], goji: ["ぼくも うれしい ガウっ", "ありがとう ガゥ…"] },
  AMAE_ASK: { wanko: "ねえねえ、なでなで して〜", gachan: "ねえ… ぎゅって して？", goji: "ぼくも だっこ… ガゥ" },
  HUG: { wanko: "ぎゅー！ あったか〜い！", gachan: "えへへ… しあわせ♪", goji: "ぼくも ぎゅー ガウっ！" },
  PAT: { wanko: "わふ〜 もっと なでて〜", gachan: "ぴよ♪ きもちいい…", goji: "ガゥ… ねむく なっちゃう" },
  AMAE_LINES: { wanko: ["だいすき！ ずっと いっしょ だよ！", "しっぽが とまらない〜"], gachan: ["もうちょっと くっついて いい？", "がちゃん、しあわせ♪"], goji: ["ぼくも そばに いる ガウっ", "また いっしょに いこうね"] },
  asking: false,
  st() {
    const d = Save.d;
    if (!d.wish || typeof d.wish !== "object") d.wish = { cur: null, last: Date.now(), n: 0, log: [] };
    const w = d.wish;
    if (!Array.isArray(w.log)) w.log = [];
    if (w.cur && !this.INDEX[w.cur.id]) w.cur = null;
    if (!(w.last >= 0)) w.last = Date.now();
    return w;
  },
  who(x) { const c = Save.d.chars[x.who]; return (c && c.name) || x.who; },
  // つぎの おねがい: さいきんの 8つ と まえと おなじ しゅるいを さける。でやすさ w（ガチャ・クレーンは 3）で えらぶ（UI-88）
  pick(r = Math.random, from = this.WISHES, kinds = true) {
    const w = this.st(), recent = w.log.slice(-8).map((x) => x.id), last = w.log.length ? this.INDEX[w.log[w.log.length - 1].id] : null;
    let list = from.filter((x) => !recent.includes(x.id) && (!kinds || !last || x.kind !== last.kind));
    if (!list.length) list = from.filter((x) => !recent.includes(x.id));
    if (!list.length) list = from;
    return this.weighted(list, r());
  },
  weighted(list, v) { const tot = list.reduce((s, x) => s + (x.w || 1), 0); let a = Math.max(0, Math.min(0.999999, v)) * tot; for (const x of list) { a -= x.w || 1; if (a < 0) return x; } return list[list.length - 1]; },
  start(id) {
    const w = this.st(), x = this.INDEX[id];
    if (!x || w.cur) return false;
    w.cur = { id, t: Date.now(), done: false }; w.last = Date.now();
    Save.mark(); Save.write();
    return true;
  },
  cancel() {
    const w = this.st();
    if (!w.cur || w.cur.done) return false;
    w.cur = null; w.last = Date.now() - this.COOL / 2;
    Save.mark(); Save.write();
    return true;
  },
  // いま いる ばしょ（館は venue と floor・町と フィールドは map・ほかは scene）
  place() {
    if (typeof G === "undefined" || !G.scene) return null;
    if (G.sceneName === "venue") return { venue: G.scene.id, floor: G.scene.floor };
    if (G.sceneName === "world") return { map: G.scene.mapId };
    return { scene: G.sceneName };
  },
  placeOk(x, p) { return !!p && (x.at || []).some((a) => (a.venue ? p.venue === a.venue && (!a.floors || a.floors.includes(p.floor)) : a.map ? p.map === a.map : a.scene === p.scene)); },
  // かなった かどうか（kind と あいて）。かなったら トースト
  signal(kind, what) {
    if (typeof Save === "undefined" || !Save.d) return false;
    const w = this.st(), c = w.cur, x = c && this.INDEX[c.id];
    if (!x || c.done || x.kind !== kind) return false;
    if (kind === "eat" ? !x.foods.includes(what) : kind === "do" ? x.act !== what : !this.placeOk(x, what)) return false;
    c.done = true; c.doneT = Date.now();
    Save.mark(); Save.write();
    if (typeof UI !== "undefined" && UI.toast) UI.toast(`<span class="wish-toast">${this.icon("heart")}${this.who(x)}の おねがい かなった！${G.sceneName === "house" ? "" : " おうちに かえろう"}</span>`, "good");
    if (typeof Sound !== "undefined") Sound.se("sparkle");
    return true;
  },
  // ついた ばしょ（館の かいに はいった とき・町と フィールドに はいった とき）
  arrive(p) {
    if (typeof Save === "undefined" || !Save.d || !Save.d.wish) return false;
    const c = Save.d.wish.cur, x = c && this.INDEX[c.id];
    return !!(x && !c.done && x.kind === "go") && this.signal("go", p);
  },

  // ---- 館の なかの おねだり（UI-88）: beg の ある おねがいを その かいで ----
  begList(p) { return p ? this.WISHES.filter((x) => (x.beg || []).some((a) => a.venue === p.venue && (!a.floors || a.floors.includes(p.floor)))) : []; },
  // まいフレーム（VenueScene の update の あと）: かいに はいって 4〜8びょう・はんぶんの かくりつ（かいごとに 1かい）・おねがいが ない とき・まえの おねがいから 5ふん
  venue(sc, dt, r = Math.random) {
    if (!sc || sc.closed || typeof Save === "undefined" || !Save.d) return;
    let b = sc.begFx;
    if (!b || b.floor !== sc.floor || b.venue !== sc.id) b = sc.begFx = { venue: sc.id, floor: sc.floor, t: 0, at: r() < this.BEG_CHANCE ? 4 + r() * 4 : null };
    if (b.at == null) return;
    b.t += dt;
    if (b.t < b.at || sc.busy || UI.busy || Game.trans || Game.inputLocked || sc.lift > 0 || this.asking) return;
    b.at = null;
    const w = this.st();
    if (w.cur || Date.now() - w.last < this.BEG_COOL || !this.begList({ venue: sc.id, floor: sc.floor }).length) return;
    this.beg(sc);
  },
  // おねだり（id を わたすと その おねがい。PokaDebug から）: 「いいよ！」で すまほの「おねがい」に のる・「また こんどね」で 5ふん まつ
  async beg(sc, id) {
    const x = id ? this.INDEX[id] : this.pick(Math.random, this.begList({ venue: sc.id, floor: sc.floor }), false);
    if (!x || this.st().cur || this.asking || sc.busy) return false;
    sc.busy = true; this.asking = true;
    try {
      Sound.se("pop");
      if (typeof PlayRecords !== "undefined") PlayRecords.add(x.who, "ask"); // きろく（UI-71）
      const i = await UI.ask(x.begAsk || x.ask, ["いいよ！", "また こんどね"], { cancel: false, who: x.who, name: `${this.who(x)}の おねだり` });
      if (G.scene !== sc) return false;
      if (i === 0) {
        this.start(x.id);
        if (typeof PlayRecords !== "undefined") PlayRecords.add(x.who, "yes");
        Sound.se("ok");
        UI.toast(`<span class="wish-toast">${this.icon("note")}${this.who(x)}「やったー！」 すまほの「おねがい」に かいたよ</span>`);
        return true;
      }
      const w = this.st(); w.last = Date.now(); Save.mark(); Save.write();
      UI.toast(`${this.who(x)}「そっか… また こんど ね」`);
      return false;
    } finally { sc.busy = false; this.asking = false; }
  },

  // ---- おうち（SCENES.house の update の あと） ----
  house(sc, dt) {
    const h = sc.wishFx || (sc.wishFx = { t: 0, ask: Math.random() < this.CHANCE ? 6 + Math.random() * 6 : null, busy: false, amae: 0, beat: 0 });
    h.t += dt;
    if (h.amae > 0) this.amaeTick(sc, h, dt);
    const calm = !sc.mode && !UI.busy && !Game.trans && !(sc.life && sc.life.quarrel) && !(sc.work && !["home", "away"].includes(sc.work.phase));
    if (h.busy || !calm) return;
    const w = this.st(), c = w.cur;
    if (c && c.done) { if (h.t > 1.5) this.thank(sc); return; }
    if (!c && h.ask != null && h.t >= h.ask) { h.ask = null; if (Date.now() - w.last >= this.COOL) this.ask(sc); }
  },
  // おねがいを きく（id を わたすと その おねがい。アプリと テストから）
  async ask(sc, id) {
    const x = id ? this.INDEX[id] : this.pick(), h = sc.wishFx || (sc.wishFx = { t: 0, ask: null, busy: false, amae: 0, beat: 0 });
    if (!x || this.st().cur || h.busy) return false;
    h.busy = true; this.asking = true;
    try {
      const kid = sc.chars.find((k) => k.id === x.who);
      if (kid && !kid.hidden) sc.react(kid, "happy", "heart");
      HomeLife.say(sc, x.who, "ねえねえ… おねがいが あるの", false, "say", { wish: x.id });
      await U.wait(900);
      if (G.scene !== sc) return false;
      if (typeof PlayRecords !== "undefined") PlayRecords.add(x.who, "ask"); // きろく（UI-71）
      const i = await UI.ask(x.ask, ["いいよ！", "また こんどね"], { cancel: false, who: x.who, name: `${this.who(x)}の おねがい` });
      if (G.scene !== sc) return false;
      if (i === 0) {
        this.start(x.id);
        if (typeof PlayRecords !== "undefined") PlayRecords.add(x.who, "yes");
        for (const k of sc.chars) if (!k.hidden) sc.react(k, "love", "heart");
        HomeLife.say(sc, x.who, "やったー！ やくそく だよ！", false, "shout", { wish: x.id });
        UI.toast(`<span class="wish-toast">${this.icon("note")}すまほの「おねがい」に かいたよ</span>`);
        return true;
      }
      const w = this.st(); w.last = Date.now() - this.COOL / 2; Save.mark();
      HomeLife.say(sc, x.who, "そっか… また こんど ね", false, "say", { wish: x.id });
      return false;
    } finally { h.busy = false; this.asking = false; }
  },
  // かなった おねがいの おれい → ぎゅー／なでなで → あまえる
  async thank(sc) {
    const w = this.st(), c = w.cur, x = c && this.INDEX[c.id], h = sc.wishFx;
    if (!x || !c.done || h.busy) return false;
    h.busy = true;
    if (sc.life) sc.life.next = Math.max(sc.life.next || 0, 30); // おれいの あいだは ふだんの かけあいを まつ
    try {
      const ids = [x.who, ...Save.d.order.filter((id) => id !== x.who)];
      const kids = ids.map((id) => sc.chars.find((k) => k.id === id)).filter((k) => k && !k.hidden);
      const cx = ROOM.W / 2, spots = [cx, cx - 72, cx + 72];
      kids.forEach((k, i) => { HomeActions.cancel(k); k.state = "walk"; k.tx = spots[i]; k.ty = ROOM.H - 70; });
      await U.wait(1100);
      if (G.scene !== sc) return false;
      kids.forEach((k) => { k.x = k.tx; k.y = k.ty; k.state = "amae"; k.dir = "down"; k.emo = "love"; sc.fx("heart", k); });
      Sound.se("sparkle");
      const meta = { wish: x.id };
      const turns = [{ who: x.who, text: x.thanks, kind: "shout", meta }, ...ids.slice(1).map((id) => ({ who: id, text: U.pick(this.OTHER[id]), meta })), { who: x.who, text: this.AMAE_ASK[x.who], meta }];
      HomeLife.converse(sc, turns);
      await U.wait(turns.length * 1300 + 500);
      if (G.scene !== sc) return false;
      const i = await UI.ask(`${ids.map((id) => Save.d.chars[id].name).join("・")}が あまえて きた！`, ["ぎゅー！", "なでなで"], { cancel: false, who: x.who, name: this.who(x) });
      if (G.scene !== sc) return false;
      const hug = i !== 1, said = hug ? this.HUG : this.PAT;
      for (const k of kids) sc.react(k, "love", "heart");
      HomeLife.converse(sc, ids.map((id) => ({ who: id, text: said[id], meta: { wish: x.id, how: hug ? "hug" : "pat" } })));
      Sound.se("fanfare");
      for (const id of Save.d.order) Save.care(id, { mood: 20, bond: id === x.who ? 6 : 4 });
      w.n = (w.n || 0) + 1; w.log.push({ id: x.id, t: Date.now(), how: hug ? "hug" : "pat" }); while (w.log.length > 40) w.log.shift();
      if (typeof PlayRecords !== "undefined") { PlayRecords.add(x.who, "done"); for (const k of kids) PlayRecords.add(k.id, hug ? "hug" : "pat"); } // きろく（UI-71）
      w.cur = null; w.last = Date.now();
      Save.mark(); Save.write();
      if (sc.updateCare) sc.updateCare();
      h.amae = this.AMAE; h.beat = ids.length * 1.3 + 1.5;
      if (typeof WishGifts !== "undefined") await WishGifts.after(sc, x); // ときどき おれいの しな（js/wish-gifts.js・UI-70）
      return true;
    } finally { h.busy = false; }
  },
  // あまえて いる あいだ: そばに いる（ぶらぶら しない）・ときどき ハートと ひとこと・けんかや ほかの かけあいは まつ
  amaeTick(sc, h, dt) {
    h.amae -= dt; h.beat -= dt;
    if (sc.life) sc.life.next = Math.max(sc.life.next || 0, 3);
    const kids = sc.chars.filter((k) => !k.hidden);
    if (h.amae <= 0) { h.amae = 0; for (const k of kids) if (k.state === "amae") { k.state = "idle"; k.t = U.rand(1, 3); k.emo = null; } return; }
    for (const k of kids) if (k.state === "idle" || k.state === "walk") { HomeActions.cancel(k); k.state = "amae"; k.emo = "love"; k.dir = "down"; }
    if (h.beat <= 0 && !UI.busy && !sc.mode) {
      const k = U.pick(kids);
      if (k) { sc.fx("heart", k); if (sc.life && !sc.life.queue.length) HomeLife.say(sc, k.id, U.pick(this.AMAE_LINES[k.id]), false, "say", { wish: "amae" }); }
      h.beat = 4 + Math.random() * 2;
    }
  },

  // ---- すまほの「おねがい」 ----
  phoneView(el, ph) {
    const w = this.st(), c = w.cur, x = c && this.INDEX[c.id], box = U.el("div", { class: "wish-app" });
    box.append(U.el("div", { class: "wish-head", html: `${this.icon("heart")}<b>ごわがの おねがい</b>` }));
    if (x) {
      const d = Save.d.chars[x.who], card = U.el("div", { class: "wish-card" + (c.done ? " done" : "") });
      card.append(U.el("div", { class: "wish-face", html: Chara.svg(x.who, { color: d.color, outfit: d.outfit, face: c.done ? "love" : "happy" }) }),
        U.el("div", { class: "wish-body", html: `<div class="wish-who">${this.who(x)}の おねがい <span class="wish-kind k-${x.kind}">${this.KIND[x.kind].name}</span></div><div class="wish-text">${x.ask}</div>`
          + `<div class="wish-hint">${c.done ? "かなった！ おうちに かえると、3にんが まってるよ。" : "ヒント: " + x.hint}</div>` }));
      box.append(card);
      if (!c.done) box.append(UI.btn("この おねがいを やめる", async () => { if (await UI.confirm("この おねがいを やめる？", "やめる", "やめない")) { this.cancel(); el.innerHTML = ""; this.phoneView(el, ph); } }, "small"));
    } else {
      box.append(U.el("div", { class: "note", text: "いまは おねがいは ないよ。" }));
      const home = G.sceneName === "house", b = UI.btn("3にんに きいて みる", () => { if (G.sceneName !== "house") return; const sc = G.scene; ph.close(); setTimeout(() => this.ask(sc), 300); }, "pink wide");
      b.disabled = !home;
      box.append(b);
      if (!home) box.append(U.el("div", { class: "muted", text: "おうちで きいて みよう。" }));
    }
    box.append(U.el("div", { class: "wish-count", text: `かなえた おねがい ${w.n || 0}こ` }));
    const log = w.log.slice(-8).reverse().map((it) => this.INDEX[it.id] && [this.INDEX[it.id], it]).filter(Boolean);
    if (log.length) {
      const list = U.el("div", { class: "wish-log" });
      for (const [y, it] of log) list.append(U.el("div", { class: "wish-log-row", html: `<span class="wish-kind k-${y.kind}">${this.KIND[y.kind].name}</span><span class="wish-log-text">${this.who(y)}: ${y.short}${it.how === "pat" ? "（なでなで）" : "（ぎゅー）"}</span>${it.gift && typeof WishGifts !== "undefined" ? `<span class="wish-gift" aria-label="おれいを もらった">${WishGifts.icon()}</span>` : ""}` }));
      box.append(list);
    }
    el.append(box);
  },
  // ちいさな 絵（ハート・ノート）
  icon(k) {
    const s = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
    if (k === "note") return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="#FFF6DD" ${s}/><path d="M8.5,8 L15.5,8 M8.5,12 L15.5,12 M8.5,16 L13,16" fill="none" ${s}/></svg>`;
    return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12,20 C5,15 3,11.5 3,8.6 C3,6 5,4 7.4,4 C9.4,4 11,5.2 12,6.9 C13,5.2 14.6,4 16.6,4 C19,4 21,6 21,8.6 C21,11.5 19,15 12,20 Z" fill="#F48FB1" ${s}/><path d="M7.4,8 C7.6,7 8.3,6.6 9,6.6" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  },
};
GowagaWish.INDEX = Object.fromEntries(GowagaWish.WISHES.map((x) => [x.id, x]));

// くみこみ: たべさせる・ぷりくら・ファッションショー・つり・ガチャ・しゅうかく・クレーン・シール・マッサージ・ためしの だい の おわり・ついた ばしょ・おうちと 館の まいフレーム
(() => {
  const after = (obj, name, fn) => {
    if (!obj || typeof obj[name] !== "function") return;
    const base = obj[name];
    obj[name] = function (...a) { const r = base.apply(this, a); try { fn(r, a); } catch (e) { console.error(e); } return r; };
  };
  after(Care, "feed", (r, [, item]) => { if (r && BAG_INDEX[item] && BAG_INDEX[item].kind === "food") GowagaWish.signal("eat", item); });
  if (typeof Purikura !== "undefined") after(Purikura, "finish", (r) => { if (r) GowagaWish.signal("do", "purikura"); });
  if (typeof FashionShow !== "undefined") after(FashionShow, "finish", (r) => { if (r) GowagaWish.signal("do", "fashion"); });
  if (typeof Fishing !== "undefined") after(Fishing, "record", () => GowagaWish.signal("do", "fishing"));
  if (typeof Gacha !== "undefined") after(Gacha, "spin", (r) => { if (r) { GowagaWish.signal("do", "gacha"); if (r.item && r.item.kind === "sticker") GowagaWish.signal("do", "sticker"); } });
  if (typeof Farm !== "undefined") after(Farm, "harvest", (r) => { if (r) GowagaWish.signal("do", "harvest"); });
  // UI-88: クレーン（メダルの コイン プッシャーは のぞく）・シール（ネリカス でんきの うりば・シールの ガチャ）・ネリカス でんきの マッサージチェア／ためしの だい
  if (typeof PrizeArcade !== "undefined") after(PrizeArcade, "finish", (r, [run]) => { const m = r && run && PrizeArcade.machines[run.machine]; if (m && m.type !== "pusher") GowagaWish.signal("do", "crane"); });
  if (typeof StickerBook !== "undefined") after(StickerBook, "add", (r) => { if (r) GowagaWish.signal("do", "sticker"); });
  if (typeof KadenHall !== "undefined") {
    const base = KadenHall.interact;
    KadenHall.interact = async function (sc, f) { const r = await base.call(this, sc, f); try { if (r && f && (f.action === "massage" || f.action === "demo")) GowagaWish.signal("do", f.action); } catch (e) { console.error(e); } return r; };
  }
  // 館: かいに はいる たび（エレベーターで 12かい など）。町・フィールド: はいった とき
  const VP = VenueScene.prototype, load = VP.loadFloor;
  VP.loadFloor = function (...a) { const r = load.apply(this, a); if (G.sceneName === "venue") GowagaWish.arrive({ venue: this.id, floor: this.floor }); return r; };
  // 館の おねだり（UI-88）: まいフレーム
  const vup = VP.update;
  VP.update = function (dt) { vup.call(this, dt); if (G.sceneName === "venue" && G.scene === this) GowagaWish.venue(this, dt); };
  const WP = WorldScene.prototype, enter = WP.enter;
  WP.enter = async function (...a) { const r = await enter.apply(this, a); if (G.sceneName === "world") GowagaWish.arrive({ map: this.mapId }); return r; };
  const HS = SCENES.house.prototype, up = HS.update;
  HS.update = function (dt) { up.call(this, dt); GowagaWish.house(this, dt); };
})();
