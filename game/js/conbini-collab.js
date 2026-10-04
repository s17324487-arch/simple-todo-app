// コンビニ × ごわがの コラボ けいひん（UI-86・オーナーの 指示 2026-10-04「200は、コンビニとごわがコラボの缶ジュース4種。500は、…食器コップ4種類。
// 800は、同様にコラボの食器で、お皿4種類。…3000は、コンビニとごわがのこらぼのお風呂グッズ4種」「景品は2店舗でコラボ系はことなり」）。
// ・ポイントカード（js/conbini-card.js）の こうかんの けいひんに 4だん（200・500・800・3000）を たす。どの だんも 4しゅ（わんこ・がちゃん・ごじ・なかよし）から 1つ えらぶ。
// ・ローリソン と せぶんぶんで ちがう しなもの（2 × 4だん × 4しゅ ＝ 32しゅ）:
//   かんジュース（たべもの・もちもの）／グラス・タンブラー（ゆかの 家具・フィギュア だいにも かざれる）／プレート・しましまざら（かべ）／おふろ グッズ（ゆかの 家具・さわると うごく）。
// ・絵は js/conbini-collab-art.js（ConbiniCollabArt）。セーブは ふつうの もちもの（Save.d.bag）と 家具（Save.d.furn）だけ（こうかんの きろくは Save.d.conbiniCard.shops.<みせ>.got）。
const ConbiniCollab = (() => {
  const WHO = ["wanko", "gachan", "goji", "trio"];
  const STORE_NAME = { lawson: "ローリソン", sevenbun: "せぶんぶん" };
  // [だん, ねだん（ポイント）, なまえ, せつめい, 4しゅ（[なまえ, せつめい, 家具の かず〔はば, おくゆき, いごこち〕]）]
  const SETS = {
    lawson: {
      can: [200, "コラボ かんジュース", "ローリソン と ごわがの コラボ かん。4しゅから 1つ えらべるよ（もちもの・のめる）。", [
        ["わんこ ミルクソーダ", "しろい かんに わんこ。ミルクの あまい しゅわしゅわ ソーダ。"],
        ["がちゃん レモンソーダ", "きいろい かんに がちゃん。すっぱくて さわやかな レモン。"],
        ["ごじ メロンソーダ", "みどりの かんに ごじ。メロンの かおりの しゅわしゅわ。"],
        ["なかよし ミックスジュース", "3にんの かおの かん。くだもの いっぱいの ミックス。"],
      ]],
      cup: [500, "コラボ グラス", "あおい そこの すきとおった グラス。4しゅから 1つ（かぐ・フィギュア だいにも かざれる）。", [
        ["わんこ グラス", "わんこの かおが ついた すきとおった グラス。", [34, 26, 2]],
        ["がちゃん グラス", "がちゃんの かおが ついた すきとおった グラス。", [34, 26, 2]],
        ["ごじ グラス", "ごじの かおが ついた すきとおった グラス。", [34, 26, 2]],
        ["なかよし グラス", "3にんが ならんだ すきとおった グラス。", [34, 26, 2]],
      ]],
      plate: [800, "コラボ プレート", "あおい ふちの かざりの おさら。4しゅから 1つ（かべに かざる）。", [
        ["わんこ プレート", "あおい みずたまの ふちに わんこ。かべに かざる おさら。", [46, 0, 3]],
        ["がちゃん プレート", "あおい みずたまの ふちに がちゃん。かべに かざる おさら。", [46, 0, 3]],
        ["ごじ プレート", "あおい みずたまの ふちに ごじ。かべに かざる おさら。", [46, 0, 3]],
        ["なかよし プレート", "あおい みずたまの ふちに 3にん。かべに かざる おさら。", [46, 0, 3]],
      ]],
      bath: [3000, "コラボ おふろ グッズ", "ローリソン と ごわがの おふろの かぐ。4しゅから 1つ（さわると うごく）。", [
        ["わんこ おふろおけ", "あおい おけに わんこ。おゆを すくって ざぶーん。", [48, 40, 5]],
        ["がちゃん おふろ ひよこ", "がちゃんの ような きいろい ひよこ。おすと ぴよっと なく。", [38, 30, 5]],
        ["ごじ バスチェア", "ごじの かおの おふろの いす。すわると ぽかぽか。", [46, 36, 5]],
        ["なかよし タオルかけ", "3にんの タオルが ならんだ タオルかけ。ふかふか。", [60, 30, 6]],
      ]],
    },
    sevenbun: {
      can: [200, "コラボ かんジュース", "せぶんぶん と ごわがの コラボ かん。4しゅから 1つ えらべるよ（もちもの・のめる）。", [
        ["わんこ みかんサイダー", "オレンジの かんに わんこ。みかんの しゅわしゅわ サイダー。"],
        ["がちゃん ももソーダ", "ももいろの かんに がちゃん。あまい ももの ソーダ。"],
        ["ごじ マスカットソーダ", "わかばいろの かんに ごじ。マスカットの さわやか ソーダ。"],
        ["なかよし いちごミルク", "3にんの かおの かん。いちごの あまい ミルク。"],
      ]],
      cup: [500, "コラボ タンブラー", "3しょくの しまの タンブラー。4しゅから 1つ（かぐ・フィギュア だいにも かざれる）。", [
        ["わんこ タンブラー", "しましまの うえに わんこ。あったかい のみものも ひえた のみものも。", [34, 26, 2]],
        ["がちゃん タンブラー", "しましまの うえに がちゃん。かるくて じょうぶ。", [34, 26, 2]],
        ["ごじ タンブラー", "しましまの うえに ごじ。ガゥっと のもう。", [34, 26, 2]],
        ["なかよし タンブラー", "しましまの うえに 3にん。みんなで おそろい。", [34, 26, 2]],
      ]],
      plate: [800, "コラボ しましまざら", "オレンジ・みどり・あかの ふちの かざりの おさら。4しゅから 1つ（かべに かざる）。", [
        ["わんこ しましまざら", "3しょくの ふちに わんこ。かべに かざる おさら。", [46, 0, 3]],
        ["がちゃん しましまざら", "3しょくの ふちに がちゃん。かべに かざる おさら。", [46, 0, 3]],
        ["ごじ しましまざら", "3しょくの ふちに ごじ。かべに かざる おさら。", [46, 0, 3]],
        ["なかよし しましまざら", "3しょくの ふちに 3にん。かべに かざる おさら。", [46, 0, 3]],
      ]],
      bath: [3000, "コラボ おふろ グッズ", "せぶんぶん と ごわがの おふろの かぐ。4しゅから 1つ（さわると うごく）。", [
        ["わんこ せっけん", "わんこの かおの せっけんと オレンジの せっけんざら。あわ ぶくぶく。", [44, 30, 5]],
        ["がちゃん シャンプー", "がちゃんの かおの シャンプー。おすと あわが ぽこっ。", [28, 24, 5]],
        ["ごじ おふろの ふね", "ごじが のった おもちゃの ふね。おふろに うかべて ぷかぷか。", [48, 34, 5]],
        ["なかよし バスボム", "3にんの かおの バスボム。おゆに いれると しゅわーっ。", [50, 32, 6]],
      ]],
    },
  };
  const CATS = ["can", "cup", "plate", "bath"];
  const idOf = (store, cat, who) => `cvc_${store === "lawson" ? "law" : "sev"}_${cat}_${who}`;
  const ITEMS = [], INDEX = {};
  for (const store of Object.keys(SETS)) for (const cat of CATS) {
    const [cost, title, desc, list] = SETS[store][cat];
    list.forEach(([name, d, dims], i) => {
      const who = WHO[i], id = idOf(store, cat, who), it = { id, store, cat, who, name, desc: d, cost, dims };
      ITEMS.push(it); INDEX[id] = it;
    });
  }
  const tierOf = (store, cat) => { const [cost, name, desc] = SETS[store][cat]; return { cost, name, desc, kinds: ITEMS.filter((it) => it.store === store && it.cat === cat).map((it) => it.id) }; };

  // ---- ゲームに いれる ----
  for (const it of ITEMS) {
    const [w, h] = ConbiniCollabArt.size(it.cat, it.store, it.who);
    if (it.cat === "can") {
      // かんジュース: たべもの（ねだんは 0・うって いない）
      const f = { id: it.id, name: it.name, price: 0, hunger: 4, mood: 12, hp: 15, sp: 4, deza: false, rare: true, exclusive: "conbini_card", desc: it.desc };
      FOODS.push(f); BAG_INDEX[it.id] = { ...f, kind: "food" };
      FOOD_ART[it.id] = ConbiniCollabArt.can(it.store, it.who).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    } else {
      const [fw, fd, comfort] = it.dims, kind = it.cat === "plate" ? "wall" : "floor";
      const f = { id: it.id, name: it.name, price: 0, kind, w, h, ...(kind === "floor" ? { depth: fd } : {}), comfort, rare: true, exclusive: "conbini_card", conbiniPrize: it.store, desc: it.desc };
      if (it.cat === "cup") f.figure = true;
      FURNITURE.push(f); FURN_INDEX[it.id] = f;
      FURN_ART[it.id] = () => ConbiniCollabArt.pic(it.cat, it.store, it.who);
    }
  }
  // フィギュア だいに かざれる もの（グラス・タンブラー）
  FigureStand.addFigures(ITEMS.filter((it) => it.cat === "cup").map((it) => it.id));

  // おふろ グッズ: へやの 立体と さわる うごき（ぴょこっと はねて 3人が しゃべる・おと）
  const BATH_LINES = {
    wanko: ["おゆを ざぶーん！", "おふろ だいすき わん！", "あわあわ〜"],
    gachan: ["ぴよっ！", "ぷかぷか うかぶ かな？", "きいろくて かわいい！"],
    goji: ["ガゥ〜 ぽかぽか", "おふろの じかんだ！", "ふねが すすむよ〜"],
    trio: ["3にん おそろい！", "ふかふかで しゅわしゅわ〜", "きょうも いっしょに おふろ！"],
  };
  const TONES = { wanko: [[523, 659], [659, 784]], gachan: [[988, 1319], [1319, 988]], goji: [[392, 330], [330, 440]], trio: [[523, 659], [659, 784], [784, 1047]] };
  const install = () => {
    if (typeof FurnModels === "undefined" || typeof FurnLive === "undefined") return;
    const since = (st) => G.t - (st.t0 == null ? -99 : st.t0);
    const mapper = (sc, item, r) => {
      const m = HomeDesign.model(item.id, item), dm = HomeDesign.dimensions(item.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
      const Pm = (x, y, z = 0) => { const q = item.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
      Pm.s = s; Pm.d = dm.d; return Pm;
    };
    const say = (sc, line) => { const kids = (sc.chars || []).filter((c) => !c.hidden); const who = kids[Math.floor(Math.random() * Math.max(1, kids.length))]; if (who && typeof HomeLife !== "undefined") HomeLife.say(sc, who.id, line, false, "say"); };
    const tone = (list) => { if (Sound.ctx && Save.d?.settings?.se) list.forEach(([f, f2], i) => Sound.tone(Sound.seGain, { f, f2, t: i * 0.09, dur: 0.12, type: "triangle", vol: 0.09, a: 0.005, r: 0.22 })); };
    const hop = (t) => (t >= 0 && t < 0.9 ? Math.sin(t * Math.PI / 0.9) * Math.exp(-t * 1.6) : 0);
    for (const it of ITEMS.filter((x) => x.cat === "bath")) {
      const f = FURN_INDEX[it.id], place = () => ConbiniCollabArt.pic("bath", it.store, it.who).replace(/ width="[\d.]+" height="[\d.]+"/, "").replace("<svg ", `<svg x="${-f.w / 2}" y="${-f.h}" width="${f.w}" height="${f.h}" preserveAspectRatio="xMidYMax meet" `);
      FurnModels.register(it.id, (k) => k.shadow(0.12, 4, 12) + k.L(k.at(0, -k.d / 2, 0, place(), f.w / 2 + 2, f.h + 2)));
      FurnLive.register(it.id, {
        tap(sc, item, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; tone(TONES[it.who]); say(sc, BATH_LINES[it.who][st.n % BATH_LINES[it.who].length]); },
        draw(ctx, sc, item, r, st) {
          const Pm = mapper(sc, item, r), q = Pm(0, -Pm.d / 2, 0), s = Pm.s, k = hop(since(st)), w = f.w * s, h = f.h * s;
          const px = Math.max(8, Math.ceil((f.w * s * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * f.h) / f.w));
          const img = SvgCache.get("cvc:" + it.id + ":" + px, () => ConbiniCollabArt.pic("bath", it.store, it.who), px, py);
          if (!img) return;
          ctx.save(); ctx.translate(q.x, q.y - k * 7 * s); if (item.flip) ctx.scale(-1, 1); ctx.scale(1 - k * 0.06, 1 + k * 0.08);
          ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
        },
      }, true);
    }
  };
  install();

  // ---- ポイントカードの けいひんに たす（みせごとに ちがう）----
  for (const store of Object.keys(SETS)) for (const cat of CATS) {
    const T = tierOf(store, cat);
    ConbiniCard.add(store, {
      id: cat, cost: T.cost, name: T.name, desc: T.desc, kinds: T.kinds, collab: true,
      icon: () => ConbiniCollabArt.tier(cat, store),
      kindIcon: (id) => { const x = INDEX[id]; return x.cat === "can" ? ConbiniCollabArt.can(x.store, x.who) : ConbiniCollabArt.pic(x.cat, x.store, x.who); },
      kindName: (id) => INDEX[id].name,
      have: (id) => (INDEX[id].cat === "can" ? Save.d.bag[id] || 0 : Save.d.furn[id] || 0),
      give(shop, id) { const x = INDEX[id]; if (!x || x.store !== shop || x.cat !== cat) return false; if (x.cat === "can") Save.addBag(id, 1); else Save.d.furn[id] = (Save.d.furn[id] || 0) + 1; return true; },
      async after(shop, r) {
        const x = INDEX[r.kind], polite = ConbiniCard.owner(shop);
        const where = x.cat === "can" ? (polite ? "もちものに おいれ いたしました。" : "もちものに いれたよ。のむと げんきに なるよ。") : x.cat === "plate" ? (polite ? "おうちの かべに おかざり くださいませ。" : "おうちの「もようがえ」で かべに かざってね。") : x.cat === "cup" ? (polite ? "もようがえや フィギュア だいで おたのしみ くださいませ。" : "おうちの「もようがえ」や フィギュア だいで かざってね。") : (polite ? "おうちに おいて さわって みて くださいませ。" : "おうちの「もようがえ」で おいてね。さわると うごくよ。");
        const k = NeriShops.SHOPS[shop];
        await UI.say([{ name: k.keeperName, face: Art.npcSvg({ ...k.keeper, emo: "happy" }), text: `${polite ? "「" + x.name + "」で ございます。" : "「" + x.name + "」だよ！"}\n${where}` }]);
      },
    });
  }

  // ずかんの ヒント（js/item-dex-sources.js）
  const source = (id) => { const it = INDEX[id]; return it ? `ネリカスタウンの ${STORE_NAME[it.store]}の ポイントカードで こうかん できるよ（${it.cost}ポイント）。` : ""; };
  return { WHO, CATS, SETS, ITEMS, INDEX, idOf, tierOf, source };
})();
