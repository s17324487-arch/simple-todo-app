// 町の人との会話と、アイテムの受け取り
const Loot = {
  give(loot, { chest = false } = {}) {
    const d = Save.d;
    if (loot.coins) {
      let n = loot.coins;
      if (chest && Stats.perk("explore")) n = Math.round(n * 1.5);
      Save.addCoins(n);
      Sound.se("coin");
      return `コインを ${n}まい てにいれた！`;
    }
    if (loot.bag) {
      Save.addBag(loot.bag, loot.n || 1);
      return `${BAG_INDEX[loot.bag].name}を ${loot.n || 1}こ てにいれた！`;
    }
    if (loot.wear) {
      const it = ITEM_INDEX[loot.wear];
      if (d.wardrobe[loot.wear]) { Save.addCoins(60); return `「${it.name}」は もう もっているので\nコイン 60まいに かえた！`; }
      d.wardrobe[loot.wear] = true; Save.mark();
      return `きせかえ「${it.name}」を てにいれた！\nおうちの「きがえ」で きられるよ。`;
    }
    if (loot.furn) {
      d.furn[loot.furn] = (d.furn[loot.furn] || 0) + 1; Save.mark();
      return `かぐ「${FURN_INDEX[loot.furn].name}」を てにいれた！\nおうちの「もようがえ」で おけるよ。`;
    }
    return "";
  },
};

const TALKS = {
  mayor: {
    first: [
      "やあやあ、ようこそ ネリカスタウンへ！\nわしは この まちの そんちょうじゃ。",
      "きみたち 3にんは いつも いっしょで なかよしじゃのう。",
      "まちの おみせで「おてつだい」を すると コインが もらえる。\nコインで ごはんや ふく、かぐが かえるぞ。",
      "みなみの ゲートを でると はらっぱ。まものが いるが、\nたおすと コインや けいけんちが もらえる。",
      "これは おいわいじゃ。コイン 100まい あげよう！",
    ],
    gift: { coins: 100 },
    lines: [
      ["おうちに かえって「ごはん」を あげると おなかが いっぱいになる。\nおなかが ぺこぺこだと ちからが でないぞ。"],
      ["おみせの ひょうばんが あがると、おみせが レベルアップ！\nむずかしく なるけど コインも たくさん もらえるぞ。"],
      ["3にんの「なかよしど」が たかいと、バトルで\n「なかよしトリオアタック」が はやく つかえるそうじゃ。"],
      ["よるに なると まちが くらくなる。\nそとの じかんと おなじように ときが ながれておるんじゃ。"],
    ],
    boss: ["なんと！ キングプルンを たおしたのか！\nきみたちは まちの じまんじゃ！"],
  },
  cat: {
    first: ["にゃあ。クレープやさんは わたしの おすすめ。", "ちゅうもんの トッピングを よく みてね。\nレベルが あがると ちゅうもんが すぐ きえちゃうの！"],
    lines: [["コックぼうを かぶって はたらくと チップが ふえるって うわさよ。"], ["いちごと クリームの クレープが いちばん すき にゃ〜。"]],
  },
  rabbit: {
    first: ["こんにちは。わたしは おはなが だいすき。", "おはなやさんでは、ちゅうもんの いろと かずを\nぴったり あわせるのが コツなの。"],
    lines: [["はなかんむりを かぶると おはなやさんで チップが ふえるわ。"], ["リボンの いろも ちゅうもんどおりに えらんでね。"]],
  },
  penguin: {
    first: ["ペンペン。ここから みる いけは きれいでしょ。"],
    lines: [["どうくつの なかは まっくら。あしもとに きをつけて。"], ["さかなを やくと いい においが するよね……ごじくんも すきかな？"], ["ぼくは およげるけど、きみたちは いけに はいれないよ。"]],
  },
  frog: {
    first: ["ケロケロ！ ぼくは この ひろばを さんぽするのが にっか！"],
    lines: [["はいしゃさんでは ばいきんを すばやく タップ！\nでも けんこうな はを さわると いたがるよ。"], ["ケロ〜。きょうも いい てんき。"], ["パンやさんの オーブンは じかんが だいじ。\nやきすぎると こげこげに なっちゃう！"]],
  },
  sheep: {
    first: ["メェ〜。ようふくやさんへ ようこそ……じゃなくて、\nわたしは おきゃくさんよ。", "ふくの なかには、きると つよくなる ものも あるの。\nおしゃれと つよさ、どっちも たのしんでね。"],
    lines: [["3にん おそろいの ふくも かわいいわよ。\nひとつ かえば みんな きられるの。"], ["せなかの アイテムは うしろから みると よく わかるわ。"]],
  },
  mouse: {
    first: ["チュウ！ この さきは はらっぱ。", "まものに さわると バトルに なるよ。\nHPが へったら おうちの ベッドで ねると なおる。", "こまったら メニューの「まちに かえる」で もどれるよ。"],
    lines: [["はらっぱの あとは もり、その おくは どうくつ。\nどんどん てきが つよくなるよ。"], ["たからばこの なかには、まいにち なかみが もどる ものも あるんだって。"]],
  },
  pig: {
    first: ["ブーブー！ スーパーで ごはんを かってね。", "すきな たべものを あげると ごきげんが ぐーんと あがるよ。\nわんこは ほねっこクッキー、がちゃんは メロンパン、\nごじは やきざかなが だいすきみたい。"],
    lines: [["きらいな たべものも あるから きをつけて。\nがちゃんは からいのが にがて らしいよ。"], ["とくべつな おかしを たべると、ずっと つよく なれるんだ。"]],
  },
  traveler: {
    first: ["やあ、ぼうけんしゃさん。わたしは たびの ひつじ。", "もりの おくには「いやしの いずみ」が あるよ。\nタップすると HPが ぜんかいするんだ。"],
    lines: [["たおした まものは メニューの「ずかん」に のるよ。\nぜんぶ あつめて みてね。"], ["くさむらの なかにも たからばこが かくれているよ。"]],
  },
  explorer: {
    first: ["おっと、もりの たんけんかか！ ぼくは ケロスケ。", "この さきの どうくつには キングプルンが いる。\nレベル16くらいは ないと きびしいぞ。"],
    lines: [["「とくぎ」は SPを つかう。SPは ジュースや ぎゅうにゅうで もどるよ。"], ["ごじの「かたくなる」で みんなを まもって、\nがちゃんの ヒールで たてなおすんだ。"]],
  },
};

const Talk = {
  hasNew(n) {
    const t = TALKS[n.talk];
    return t && t.first && !Save.d.flags.talked[n.id];
  },
  async run(n, scene) {
    if (n.role === "donate" && typeof Museum !== "undefined" && Museum.data()) return Museum.talk(n, scene); // ⑤ 館の 人（寄贈）
    const t = TALKS[n.talk];
    if (!t) return;
    Sound.se("tap");
    const face = Art.npcSvg({ sp: n.sp, col: n.col, stripe: n.stripe, outfit: n.outfit, emo: "happy" });
    const folk = typeof TownFolk !== "undefined" ? TownFolk : null;
    const f = Save.d.flags, name = folk ? folk.name(n) : n.name, who = { name, face };
    const first = !f.talked[n.id] && !!t.first;
    if (folk) folk.last = { npc: n.id, line: null, react: null };
    // 1. はじめての 会話は いまの まま
    if (first) {
      f.talked[n.id] = true;
      Save.mark();
      await UI.say(t.first.map((text) => ({ name, face, text })));
    }
    if (t.gift && !f["gift_" + n.id]) {
      f["gift_" + n.id] = true;
      const msg = Loot.give(t.gift);
      await UI.say([{ name: n.name, face, text: msg }]);
    }
    // ③ タウンの いけの ペンが つりざおを くれる（もらった ときは ふつうの セリフを 出さない）
    const rod = typeof Fishing !== "undefined" && await Fishing.talked(n, who);
    // ④ もりの ケロスケが ピッケルを くれる（おなじく）
    const pick = typeof Fossils !== "undefined" && await Fossils.talked(n, who);
    // 2. おねがいを すすめる（でんごん・わたす・わらしべ・おわり）
    const moved = (folk ? await folk.talked(n, scene, who) : false) || rod || pick;
    if (!first && !moved) {
      // 3. ふつうの セリフ: 3わりは あそびかたの ヒント（TALKS）、7わりは 町の人の セリフ（TOWNSFOLK_DATA。時間・天気・季節・おまつり・ボスの あと で えらぶ）
      let lines, line = null;
      if (t.boss && Save.d.flags.boss && U.chance(0.4)) lines = t.boss;
      else {
        line = folk && !U.chance(folk.TIP_SHARE) ? folk.line(n) : null;
        lines = line ? [line.text] : U.pick(t.lines);
      }
      if (folk) folk.last.line = line && line.id;
      await UI.say(lines.map((text) => ({ name, face, text })));
      // 4. おねがいを もちかける（10〜20%）
      if (folk) await folk.propose(n, who);
    }
    // ときどき なかまが ひとこと（3人の 性格に あう もの。話した あいてで かわる ものも ある）
    if (U.chance(folk ? folk.REACT_CHANCE : 0.35)) {
      const r = folk ? folk.react(n) : null;
      if (r) { TownFolk.last.react = r.id; await UI.say([{ who: r.who, emo: "happy", text: r.text }]); }
      else {
        const id = U.pick(Chara.IDS);
        const say = { wanko: ["ワン！ よろしくね！", "ふむふむ、なるほど〜"], gachan: ["ぴよっ！ おぼえたよ！", "ぴよぴよ〜♪"], goji: ["ガオー！（よろしく）", "……（こくり）"] }[id];
        await UI.say([{ who: id, emo: "happy", text: U.pick(say) }]);
      }
    }
  },
};
