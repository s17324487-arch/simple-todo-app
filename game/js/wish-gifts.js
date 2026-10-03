// おねがいの おれいの しな（UI-70。オーナーの FB 2026-10-03「3人のお願いを聞いたら、低確率でお礼の品が3人から貰えるようにして。
// それは、お手紙(ひらがなで二行くらい書いてある。実際に開いて見ることのできる)、街で拾ったキラキラの石、お小遣いで買ったアクセサリーなど、子供らしいものにして。」）。
// おねがいが かなって「ぎゅー！／なでなで」の あと、おねがいした 子が ときどき おれいを くれる（15%。8かい つづけて なにも ない ときは つぎは かならず ＝ だいたい 5かいに 1かい）。
// ・おてがみ 24まい（3人 × 8。ひらがなで 2ぎょう。ふうとうを タップして あける。すまほの「たからもの」で なんども よめる）
// ・まちで ひろった いし 9しゅ（3人 × 3。ハンカチの うえ。おうちに かざれる・フィギュア だいにも）
// ・おこづかいで かった アクセサリー 6しゅ（3人 × 2。ヘアピン 3・くびかざり 3。「きがえ」で つける・1こで ひとり）
// ・てづくり 3しゅ（わんこの かたたたき けん〔10かい つかえる〕・がちゃんの おりがみの つる・ごじの クレヨンの え〔かべ〕）
// えらびかた: しゅるいを おもみ（てがみ 45・いし 25・アクセ 18・てづくり 12）で えらび、その 子の まだ もって いない ものから。ぜんぶ もって いたら その 子の てがみを もう いちど。
// セーブ: Save.d.wish.gift = { miss, got: { id: かず }, log: [{ id, who, t }], used: { wg_coupon: つかった かず } }
// （Save.d.wish と おなじ ように はじめて つかう ときに できる。Save.fresh() には ない ので SCHEMA は そのまま）。絵は js/wish-gift-art.js
const WishGifts = (() => {
  const A = WishGiftArt;
  // ---- おてがみ（ひらがな だけ・2ぎょう）----
  const LETTERS = {
    wanko: [
      "いつも あそんで くれて ありがとう！\nあしたも いっしょに かけっこ しようね！",
      "おでかけ、すっごく たのしかった！\nまた つれてって ね。やくそく だよ！",
      "ぼく、みんなの ことが だいすき！\nずーっと いっしょに いようね。",
      "おなかが すいたら いってね。\nぼくの おにく、はんぶん あげる！",
      "がちゃんと ごじは ぼくが まもるよ。\nだって ぼく、りーだー だもん！",
      "なでなで されると しっぽが ぶんぶん。\nもっと なでて ほしいな〜。",
      "あめの ひは おうちで かくれんぼ しよう。\nぼく、かくれるの じょうず だよ！",
      "これからも よろしくね！\nぼく、もっと もっと がんばるよ！",
    ],
    gachan: [
      "いつも やさしく して くれて ありがとう♪\nがちゃん、とっても うれしいよ。",
      "きょう かわいい おはなを みつけたの。\nこんど いっしょに みに いこうね♪",
      "けがを したら がちゃんに いってね。\nばんそうこう、はって あげる♪",
      "めろんぱん、こんど はんぶんこ しよ♪\nいちばん おいしい ところ あげるね。",
      "ねる まえの おはなし、ありがとう。\nゆめの なかでも あそぼうね♪",
      "わんこと ごじと いっしょだと、\nまいにち とっても たのしいの♪",
      "がちゃん、おしゃれが だいすき。\nこんど いっしょに おかいもの しよ♪",
      "ずっと ずっと なかよしで いてね。\nはーとを いっぱい こめて かいたよ♪",
    ],
    goji: [
      "いつも ありがとう がうっ。\nぼく、みんなが だいすき だよ。",
      "ぷりん、ぷるぷるで おいしかった。\nまた いっしょに たべよう がうっ。",
      "おもい にもつは ぼくが もつよ。\nちからもち だから まかせて がうっ。",
      "きょうりゅうの ほね、かっこよかった。\nまた はくぶつかんに いこうね。",
      "ぼく、すこし こわがり だけど、\nみんなと いると へいき だよ がうっ。",
      "ねむく なったら ぼくに もたれてね。\nおなか ふかふか だから がうっ。",
      "おにわの はなに みずを あげたよ。\nはやく さくと いいね。",
      "これからも ずっと いっしょ がうっ。\nぼくの たからものは みんな だよ。",
    ],
  };
  // ---- いし・アクセサリー・てづくり（say は わたす ときの ことば・desc は せつめい）----
  const THINGS = [
    { id: "wg_stone_ring", kind: "stone", who: "wanko", name: "しろい わの いし", say: "かわらで みつけたよ！ しろい せんが ぐるっと 1しゅう してる いしは、ねがいが かなう いし なんだって。だから あげる！", desc: "しろい せんが ぐるっと 1しゅう して いる いし。ねがいを こめて だれかに あげると かなうんだって。" },
    { id: "wg_stone_heart", kind: "stone", who: "wanko", name: "ハートの いし", say: "こうえんの すなばで みつけたんだ！ ハートの かたち なんだよ！", desc: "こうえんの すなばで みつけた ハートの かたちの いし。" },
    { id: "wg_stone_white", kind: "stone", who: "wanko", name: "まっしろ つるつるの いし", say: "うみで ひろったよ！ つるつるで、さわると きもちいいんだ！", desc: "うみで ひろった まっしろな いし。つるつるで きもちいい。" },
    { id: "wg_seaglass", kind: "stone", who: "gachan", name: "みずいろの シーグラス", say: "ビーチで ひろったの♪ なみに ころころ されて まるく なった ガラス なんだって。うみの かけら みたいでしょ？", desc: "なみに みがかれて まるく なった みずいろの ガラス。" },
    { id: "wg_stone_pink", kind: "stone", who: "gachan", name: "ピンクの いし", say: "おはなばたけの ちかくで みつけたの♪ ほんのり ピンクで かわいいでしょ？", desc: "おはなばたけの ちかくで みつけた ほんのり ピンクの いし。" },
    { id: "wg_stone_opal", kind: "stone", who: "gachan", name: "にじいろの いし", say: "ひかりに かざすと にじいろに みえるの！ がちゃんの たからもの、あげる♪", desc: "ひかりに かざすと にじいろに みえる いし。" },
    { id: "wg_stone_mica", kind: "stone", who: "goji", name: "きらきらの いし", say: "やまの みちで ひろったよ。おひさまに あてると きらきら するんだ ガウっ", desc: "おひさまに あてると ちいさな つぶが きらきら ひかる いし。" },
    { id: "wg_stone_ammonite", kind: "stone", who: "goji", name: "アンモナイトの いし", say: "うずまきの もようが あるの。むかしの うみの いきものの あと なんだって ガウっ", desc: "うずまきの もようの いし。むかしの うみに いた アンモナイトの かせき。" },
    { id: "wg_stone_black", kind: "stone", who: "goji", name: "まっくろ まんまるの いし", say: "かわで ひろったの。まんまるで、てに のせると ちょうど いい ガウっ", desc: "かわで ひろった まんまるの くろい いし。" },
    { id: "wg_bonepin", kind: "acc", who: "wanko", slot: "head", name: "ほねの ヘアピン", say: "おこづかいで かったんだ！ ほねの かたち、かっこいいでしょ！", desc: "わんこが おこづかいで かった ほねの かたちの ヘアピン。" },
    { id: "wg_beads", kind: "acc", who: "wanko", slot: "neck", name: "ビーズの ネックレス", say: "おこづかいで かったよ！ いろんな いろの ビーズ、きれいでしょ！", desc: "いろとりどりの おおきな ビーズの ネックレス。" },
    { id: "wg_flowerpin", kind: "acc", who: "gachan", slot: "head", name: "おはなの ヘアピン", say: "おこづかいを ためて かったの♪ ぜったい にあうと おもって！", desc: "ちいさな おはなが 3つ ついた ヘアピン。" },
    { id: "wg_chick", kind: "acc", who: "gachan", slot: "neck", name: "ひよこの ペンダント", say: "おこづかいで かったの♪ がちゃんと おそろいの ひよこ！ にあうかな？", desc: "きんの くさりに ちいさな ひよこが ゆれる ペンダント。" },
    { id: "wg_dinopin", kind: "acc", who: "goji", slot: "head", name: "きょうりゅうの ヘアピン", say: "おこづかいで かったの。ぼくと おそろいの きょうりゅう だよ ガウっ", desc: "みどりの ちいさな きょうりゅうの ヘアピン。" },
    { id: "wg_starbadge", kind: "acc", who: "goji", slot: "neck", name: "ほしの バッジ", say: "おこづかいで かったの。つけると つよく なれる きが するんだ ガウっ", desc: "むねに つける きいろい ほしの バッジ。" },
    { id: "wg_coupon", kind: "hand", who: "wanko", name: "かたたたき けん", say: "かたたたき けん、つくったよ！ つかれたら いつでも つかってね！", desc: "わんこの てづくりの けん。10かい ぶん かたを たたいて くれる。" },
    { id: "wg_crane", kind: "hand", who: "gachan", name: "おりがみの つる", say: "おりがみで つるを おったの。ちょっと まがっちゃった けど…♪", desc: "がちゃんが おった ピンクの おりがみの つる。ちょっと まがって いる。" },
    { id: "wg_drawing", kind: "hand", who: "goji", name: "クレヨンの え", say: "みんなの えを かいたよ。ぼく、じょうずに かけた ガウっ？", desc: "ごじが クレヨンで かいた 3にんと おうちの え。" },
  ];
  const WHO = ["wanko", "gachan", "goji"];
  const ALL = [];
  for (const who of WHO) LETTERS[who].forEach((text, i) => ALL.push({ id: `wg_l_${who}_${i + 1}`, kind: "letter", who, n: i, text, name: `${i + 1}まいめの てがみ` }));
  ALL.push(...THINGS);
  const INDEX = Object.fromEntries(ALL.map((it) => [it.id, it]));
  const SECTIONS = [["letter", "おてがみ"], ["stone", "まちで ひろった いし"], ["acc", "おこづかいで かった アクセサリー"], ["hand", "てづくりの もの"]];
  // わたす ときの ひとこと（てがみ／ほかの もの）・とじた あとの ひとこと
  const ASK = {
    letter: { wanko: "てがみ かいたよ！ よんで よんで！", gachan: "おてがみ かいたの♪ よんでね", goji: "てがみ… かいたの。よんで ガウっ" },
    thing: { wanko: "あのね！ これ、おれいに あげる！", gachan: "あのね… これ、がちゃんから おれい♪", goji: "あのね… これ、ぼくから おれい ガウっ" },
  };
  const AFTER = { wanko: "えへへ、よろこんで くれて うれしい！", gachan: "えへへ… だいじに してね♪", goji: "えへへ… うれしい ガウっ" };
  const TAP = ["とんとん とんとん♪", "とんとん…… きもち いい？", "とんとこ とんとこ♪ いつも ありがとう！", "ぎゅっぎゅっ♪ かたが かるく なった？"];

  // ---- ゲームに いれる（家具・服。おみせには ならばない）----
  const FURN = {
    stone: { kind: "floor", w: A.SB.w, h: A.SB.h, depth: 22, comfort: 2 },
    wg_crane: { kind: "floor", w: 34, h: 30, depth: 24, comfort: 3 },
    wg_drawing: { kind: "wall", w: 56, h: 44, comfort: 5 },
  };
  for (const it of THINGS) {
    const F = it.kind === "stone" ? FURN.stone : FURN[it.id];
    if (F) {
      const f = { id: it.id, name: it.name, price: 0, ...F, rare: true, exclusive: "wish", wishGift: it.who, desc: it.desc };
      FURNITURE.push(f); FURN_INDEX[f.id] = f;
      FURN_ART[f.id] = it.kind === "stone" ? () => A.stone(it.id, it.who) : it.id === "wg_crane" ? () => A.crane() : () => A.drawing();
    } else if (it.kind === "acc") {
      const w = { id: it.id, name: it.name, slot: it.slot, wear: it.id, price: 0, rare: true, exclusive: "wish", wishGift: it.who, desc: it.desc };
      WEAR_ITEMS.push(w); ITEM_INDEX[w.id] = w;
      if (it.slot === "head" && typeof HeadPair !== "undefined") HeadPair.KIND[it.id] = "pin"; // ヘアピンは ぼうしとも いっしょに つけられる
    }
  }
  if (typeof FigureStand !== "undefined") FigureStand.addFigures([...THINGS.filter((it) => it.kind === "stone").map((it) => it.id), "wg_crane"]);

  const name = (who) => (Save.d && Save.d.chars[who] && Save.d.chars[who].name) || who;
  const face = (who, f = "love") => { const c = Save.d.chars[who] || {}; return Chara.svg(who, { color: c.color, outfit: c.outfit, face: f }); };
  const day = (t) => { const d = new Date(t); return `${d.getMonth() + 1}がつ ${d.getDate()}にち`; };
  const W = {
    ALL, INDEX, LETTERS, THINGS, SECTIONS, WHO, ASK, AFTER, TAP,
    CHANCE: 0.15, PITY: 8, COUPON: 10,
    WEIGHT: { letter: 45, stone: 25, acc: 18, hand: 12 },
    force: undefined, // PokaDebug.wishGift: "none"（でない）・しゅるい・id（つぎ だけ）
    st() {
      const w = GowagaWish.st();
      if (!w.gift || typeof w.gift !== "object" || Array.isArray(w.gift)) w.gift = {};
      const g = w.gift;
      if (!(g.miss >= 0)) g.miss = 0;
      for (const k of ["got", "used"]) if (!g[k] || typeof g[k] !== "object" || Array.isArray(g[k])) g[k] = {};
      if (!Array.isArray(g.log)) g.log = [];
      return g;
    },
    has(id) { return (this.st().got[id] || 0) > 0; },
    count() { return ALL.filter((it) => this.has(it.id)).length; },
    pool(who, kind) { return ALL.filter((it) => it.who === who && it.kind === kind); },
    // その 子の つぎの おれい（kind で しゅるいを きめる）。ぜんぶ もって いたら その 子の てがみを もう いちど
    choose(who, r = Math.random, kind = null) {
      const left = (k) => this.pool(who, k).filter((it) => !this.has(it.id));
      const kinds = (kind ? [kind] : Object.keys(this.WEIGHT)).filter((k) => left(k).length);
      if (!kinds.length) { const L = this.pool(who, "letter"); return L.length ? L[Math.floor(r() * L.length) % L.length].id : null; }
      let t = r() * kinds.reduce((a, k) => a + this.WEIGHT[k], 0), k = kinds[kinds.length - 1];
      for (const x of kinds) { t -= this.WEIGHT[x]; if (t < 0) { k = x; break; } }
      const L = left(k);
      return L[Math.floor(r() * L.length) % L.length].id;
    },
    // おねがいが かなった とき: おれいが ある なら その id（なければ null。miss を かぞえる）
    roll(who, r = Math.random) {
      const f = this.force;
      if (f === "none") return null;
      if (f) { this.force = undefined; if (INDEX[f]) return f; if (this.WEIGHT[f]) return this.choose(who, r, f); }
      const g = this.st();
      if (g.miss < this.PITY && !(r() < this.CHANCE)) { g.miss++; Save.mark(); return null; }
      return this.choose(who, r);
    },
    // もらう（家具・服・きろく）
    give(id, t = Date.now()) {
      const it = INDEX[id]; if (!it) return null;
      const g = this.st();
      g.got[id] = (g.got[id] || 0) + 1; g.miss = 0;
      g.log.push({ id, who: it.who, t }); while (g.log.length > 80) g.log.shift();
      if (FURN_INDEX[id]) Save.d.furn[id] = (Save.d.furn[id] || 0) + 1;
      if (it.kind === "acc" && typeof WearStock !== "undefined") WearStock.add(id, 1);
      Save.mark(); Save.write();
      return it;
    },
    when(id) { const L = this.st().log.find((x) => x.id === id); return L ? day(L.t) : ""; },
    // ずかんの ヒント（ItemDexSources.source）
    source(id) { const it = INDEX[id]; return it && it.kind !== "letter" ? `${name(it.who)}の おねがいを かなえると、たまに おれいに くれるよ。` : ""; },
    use(it) { return it.kind === "stone" || it.id === "wg_crane" ? "おうちの「もようがえ」で かざれるよ（フィギュア だいにも）。" : it.id === "wg_drawing" ? "おうちの「もようがえ」の かべかざりで はれるよ。" : it.kind === "acc" ? "「きがえ」で つけられるよ（1こで ひとり）。" : it.id === "wg_coupon" ? `たからものの なかで「つかう」と わんこが かたを たたいて くれるよ（${this.COUPON}かい）。` : ""; },
    pic(it, size = "") { return it.kind === "letter" ? A.envSmall(it.who) : it.kind === "acc" ? Art.iconSvg("wear", it.id) : it.id === "wg_coupon" ? A.coupon(this.st().used.wg_coupon || 0, this.COUPON) : Art.furnSvg(it.id); },

    // ---- おうちで わたす（GowagaWish.thank の さいごから。h.busy の まま）----
    async after(sc, x) {
      if (!sc || !x) return null;
      const id = this.roll(x.who); if (!id) return null;
      const it = INDEX[id];
      // ぎゅー／なでなでの へんじが おわる まで まつ
      for (let i = 0; i < 40 && G.scene === sc && sc.life && sc.life.queue.length; i++) await U.wait(200);
      await U.wait(1400);
      const w = GowagaWish.st(), last = w.log[w.log.length - 1];
      if (last && last.id === x.id) last.gift = id;
      if (G.scene !== sc) { this.give(id); UI.toast(`${name(x.who)}から おれいが とどいたよ（すまほの「たからもの」）`, "good"); return it; }
      const kid = sc.chars.find((k) => k.id === x.who);
      if (kid && !kid.hidden) sc.react(kid, "happy", "heart");
      HomeLife.say(sc, x.who, (it.kind === "letter" ? ASK.letter : ASK.thing)[x.who], false, "shout", { wish: x.id, gift: id });
      Sound.se("pop");
      await U.wait(1200);
      this.give(id);
      await this.present(it, true);
      if (G.scene === sc) {
        for (const k of sc.chars) if (!k.hidden) sc.react(k, "love", "heart");
        HomeLife.say(sc, x.who, AFTER[x.who], false, "say", { wish: x.id, gift: id });
      }
      return it;
    },
    present(it, gift = false) { return it.kind === "letter" ? this.openLetter(it.id, gift) : this.card(it, gift); },

    // ---- てがみ: ふうとうを タップ（か「あける」）→ ふたが ひらいて びんせんが でる → よむ ----
    openLetter(id, gift = false) {
      return new Promise((done) => {
        const it = INDEX[id]; if (!it || it.kind !== "letter") { done(false); return; }
        const who = it.who, nm = name(who);
        const body = U.el("div", { class: `wg-letter-box k-${who}` });
        const env = U.el("button", { class: "wg-env", "aria-label": "てがみを あける" });
        env.innerHTML = `<span class="wg-env-back">${A.envBack(who)}</span><span class="wg-env-paper"></span><span class="wg-env-front">${A.envFront(who)}</span><span class="wg-env-flap">${A.envFlap(who)}</span><span class="wg-env-to"></span>`;
        env.querySelector(".wg-env-to").textContent = `${nm}より`;
        const letter = U.el("div", { class: `wg-letter k-${who}` });
        letter.innerHTML = `<i class="wg-tape"></i><p class="wg-text"></p><div class="wg-sign"></div><span class="wg-doodle">${A.doodle(who, it.n)}</span>`;
        // ぶんせつ（スペースの あいだ）ごとに つつむ: ぶんせつの とちゅうで おりかえさない
        const tx = letter.querySelector(".wg-text");
        for (const line of it.text.split("\n")) {
          const ln = U.el("span", { class: "wg-ln" });
          line.split(" ").forEach((w, i) => { if (i) ln.append(" "); ln.append(U.el("span", { class: "wg-w", text: w })); });
          tx.append(ln);
        }
        letter.querySelector(".wg-sign").textContent = `${nm}より`;
        body.append(env, U.el("p", { class: "note wg-hint", text: "ふうとうを タップして あけてね。" }), letter);
        let opened = false, m = null;
        const btn = UI.btn("あける", () => open(), "yellow wide");
        const open = () => {
          if (opened) { if (body.classList.contains("read") && m) m.close(); return; }
          opened = true; Sound.se("swish"); env.classList.add("open"); btn.disabled = true;
          setTimeout(() => { body.classList.add("read"); btn.textContent = "だいじに する"; btn.disabled = false; Sound.se("sparkle"); }, 1000);
        };
        env.addEventListener("click", open);
        m = UI.modal({ title: `${gift ? "💌 " : ""}${nm}から おてがみ`, body, cls: "wg-panel", closable: !gift, footer: btn, onClose: () => done(true) });
      });
    },
    // いし・アクセサリー・てづくりの カード（もらった とき・たからものから）
    card(it, gift = false) {
      return new Promise((done) => {
        const who = it.who, nm = name(who), body = U.el("div", { class: `wg-card k-${who}` });
        body.innerHTML = `<div class="wg-from"><span class="wg-face">${face(who, gift ? "love" : "happy")}</span><p class="wg-say"></p></div><div class="wg-art"></div><div class="wg-name"></div><div class="wg-when"></div><p class="wg-desc"></p><p class="note wg-use"></p>`;
        body.querySelector(".wg-say").textContent = it.say;
        body.querySelector(".wg-name").textContent = it.name;
        body.querySelector(".wg-when").textContent = `${nm}から${this.when(it.id) ? "・" + this.when(it.id) : ""}`;
        body.querySelector(".wg-desc").textContent = it.desc;
        body.querySelector(".wg-use").textContent = this.use(it);
        const art = body.querySelector(".wg-art"), draw = () => { art.innerHTML = this.pic(it); };
        draw();
        let m = null;
        const close = UI.btn(gift ? "ありがとう！" : "とじる", () => { Sound.se("ok"); if (m) m.close(); }, gift ? "yellow wide" : "wide");
        const foot = [close];
        if (!gift && it.id === "wg_coupon") {
          const say = body.querySelector(".wg-say"), b = UI.btn("つかう", () => {
            const st = this.st(), n = st.used.wg_coupon || 0;
            if (n >= this.COUPON) return;
            st.used.wg_coupon = n + 1; Save.mark(); Save.write();
            say.textContent = st.used.wg_coupon >= this.COUPON ? "ぜんぶ つかったね！ また つくるね！" : TAP[n % TAP.length];
            body.classList.remove("tap"); void body.offsetWidth; body.classList.add("tap");
            Sound.se("tap"); setTimeout(() => Sound.se("tap"), 160);
            draw(); left();
          }, "pink wide");
          const left = () => { const n = this.st().used.wg_coupon || 0; b.disabled = n >= this.COUPON; body.querySelector(".wg-use").textContent = n >= this.COUPON ? "ぜんぶ つかったよ。" : `のこり ${this.COUPON - n}かい。${this.use(it)}`; };
          left(); foot.unshift(b);
        }
        m = UI.modal({ title: `${gift ? "🎁 " : ""}${nm}から ${gift ? "おれい" : it.name}`, body, cls: "wg-panel", closable: !gift, footer: foot, onClose: () => done(true) });
      });
    },

    // ---- すまほの「たからもの」----
    phoneView(el) {
      const box = U.el("div", { class: "wg-app" });
      box.append(U.el("div", { class: "wg-app-head", html: `<b>3にんから もらった たからもの</b><span class="wg-count">${this.count()} / ${ALL.length}</span>` }));
      box.append(U.el("p", { class: "muted wg-app-lead", text: "おねがいを かなえて あげると、たまに 3にんが おれいを くれるよ。" }));
      for (const [kind, title] of SECTIONS) {
        const list = ALL.filter((it) => it.kind === kind), n = list.filter((it) => this.has(it.id)).length;
        box.append(U.el("div", { class: "wg-sec", html: `<span>${title}</span><small>${n} / ${list.length}</small>` }));
        const grid = U.el("div", { class: `wg-grid g-${kind}` });
        for (const it of list) {
          const own = this.has(it.id);
          const b = U.el("button", { class: `wg-cell k-${it.who}${own ? " own" : ""}`, "data-id": it.id, "aria-label": own ? `${name(it.who)}の ${kind === "letter" ? "てがみ" : it.name}` : "まだ もって いない" });
          b.innerHTML = own ? `<span class="wg-cell-art">${this.pic(it)}</span><span class="wg-cell-nm"></span>` : `<span class="wg-cell-art wg-q">？</span><span class="wg-cell-nm"></span>`;
          b.querySelector(".wg-cell-nm").textContent = own ? (kind === "letter" ? name(it.who) : it.name) : name(it.who);
          if (own) b.addEventListener("click", () => { Sound.se("tap"); (kind === "letter" ? this.openLetter(it.id) : this.card(it)).then(() => { if (el.isConnected) { el.innerHTML = ""; this.phoneView(el); } }); });
          else b.disabled = true;
          grid.append(b);
        }
        box.append(grid);
      }
      el.append(box);
    },
    // すまほの「おねがい」の きろくに つける ちいさな プレゼントの 絵
    icon() { return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1.6" fill="#FFB3C7" stroke="${INK}" stroke-width="2"/><rect x="3" y="7" width="18" height="4" rx="1.2" fill="#FF8FB1" stroke="${INK}" stroke-width="2"/><path d="M12,7 L12,20" stroke="#FFE066" stroke-width="2.4"/><path d="M12,7 C9,2 5,4 8,7 M12,7 C15,2 19,4 16,7" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/></svg>`; },
    // PokaDebug
    state() {
      const g = this.st();
      return JSON.parse(JSON.stringify({ miss: g.miss, got: g.got, log: g.log.map((x) => x.id), used: g.used, have: this.count(), total: ALL.length, force: this.force === undefined ? null : this.force }));
    },
  };
  return W;
})();

// くみこみ: すまほの「たからもの」（「おねがい」の つぎ）
(() => {
  Smaho.ICON.treasure = `<path d="M7,19 C7,10 37,10 37,19 L37,23 L7,23 Z" fill="#E9A15F" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><rect x="7" y="22" width="30" height="16" rx="2" fill="#F2B36B" stroke="${INK}" stroke-width="2.6"/>`
    + `<path d="M7,28 L37,28" stroke="#C98A52" stroke-width="2"/><rect x="18.6" y="19.4" width="6.8" height="9" rx="1.6" fill="#FFE066" stroke="${INK}" stroke-width="2"/><path d="M22,36 C18.6,33.6 17.6,31.8 17.6,30.4 C17.6,29 18.6,28 20,28 C20.9,28 21.6,28.5 22,29.2 C22.4,28.5 23.1,28 24,28 C25.4,28 26.4,29 26.4,30.4 C26.4,31.8 25.4,33.6 22,36 Z" fill="#FF7BA8" stroke="${INK}" stroke-width="1.6"/>`;
  const i = Smaho.APPS.findIndex((a) => a.id === "wish");
  Smaho.APPS.splice(i < 0 ? Smaho.APPS.length : i + 1, 0, { id: "treasure", name: "たからもの", color: "#F7E3A1", render(el) { WishGifts.phoneView(el); } });
})();
