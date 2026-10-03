// ガチャガチャ（Meeときょれじゃ の カプセルトイ・UI-12）: 館の 12だいの 台が 12の シリーズ（UI-28 で 6 → 12。2F の ガチャ コーナーは 2れつ）。
// 1かい 200コインで シリーズの 4しゅの どれかが でる（ふつう 3しゅは 30%ずつ・レア 1しゅは 10%）。ほんものの カプセルトイと おなじく、
// まわす → カプセルが でてくる → タップで あける（あける まで どれが でたか わからない。カプセルの いろは けいひんと かんけい ない・UI-51）。けいひんは へやに かざる フィギュア（家具・ほしは ださない）か 服・アクセサリー（acc）。
// 服は 1こで 1人（js/wear-stock.js）なので、ダブった 服も 5こ までは もう 1こ もらえる（それより おおいと 50コイン もどる）。フィギュアは いくつでも かざれる。4しゅ そろうと コンプリート。絵は js/gacha-art.js（ふえた 6シリーズは js/gacha-art-more.js）。
// セーブ: Save.d.gacha（plays まわした かず・got { けいひん: でた かず }・done { シリーズ: そろった 日 }）。もちものは Save.d.furn／Save.d.wardrobe。
// シールの シート（kind: "sticker"・js/sticker-book.js）は 家具・服に いれない。でた とき Gacha.GIVE.sticker が シールちょうに いれる。シリーズごとの ねだんは S.price（ない ときは 200）。
const Gacha = (() => {
  const PRICE = 200, DUP = 50, RATE = [0.3, 0.3, 0.3, 0.1], RARE = 3;
  // [なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … 服
  const SERIES = [
    { id: "friends", name: "なかよし フィギュア", kind: "furn", wide: [3], color: "#F29BB2", caps: ["#F7A9C8", "#FFE07A", "#FFFFFF"], items: [
      ["ばんざい わんこ", "ジャンプして よろこぶ わんこの フィギュア。あたまに おほしさまの ピン。"],
      ["おすわり がちゃん", "ちょこんと すわった がちゃんの フィギュア。あおい ちょうネクタイ つき。"],
      ["はなかんむり ごじ", "はなかんむりの ごじ。ハートの めで にっこり。"],
      ["3にん なかよし", "わんこ・がちゃん・ごじ が ひとつの だいに ならんだ レアの フィギュア。"],
    ] },
    { id: "sleepy", name: "すやすや どうぶつ", kind: "furn", color: "#8EC5E8", caps: ["#BFE6F7", "#FFFFFF", "#D7C6EE"], items: [
      ["すやすや ねこ", "ふわふわの クッションで ねむる ねこ。"],
      ["すやすや うさぎ", "ながい みみを たたんで おひるね ちゅうの うさぎ。"],
      ["すやすや ハムスター", "まるくなって ねむる ハムスター。ほっぺが ぷっくり。"],
      ["ゆめみる ひつじ", "みかづきの うえで ゆめを みる ひつじ。レアの フィギュア。"],
    ] },
    { id: "sweets", name: "ミニチュア スイーツ", kind: "furn", color: "#F7C95B", caps: ["#FFE07A", "#F7A9C8", "#FFFFFF"], items: [
      ["ミニ ショートケーキ", "いちごの ショートケーキの ミニチュア。レースの おさら つき。"],
      ["ミニ プリン", "カラメルと さくらんぼの プリンの ミニチュア。"],
      ["ミニ パフェ", "いちごと チョコの パフェの ミニチュア。ストロー つき。"],
      ["ミニ 3だん ケーキ", "おうかんを のせた 3だんの ケーキ。レアの ミニチュア。"],
    ] },
    { id: "ride", name: "ぽかぽか のりもの", kind: "furn", color: "#9ED3A8", caps: ["#9ED3A8", "#FFE07A", "#BFE6F7"], items: [
      ["ミニ でんしゃ", "みどりの でんしゃの ミニチュア。レールの だいに のって いるよ。"],
      ["ミニ バス", "ぽかぽかタウンの きいろい バスの ミニチュア。"],
      ["ミニ ひこうき", "そらを とぶ ひこうきの ミニチュア。"],
      ["ミニ ロケット", "ほしぞらへ とびたつ ロケット。レアの ミニチュア。"],
    ] },
    { id: "ears", name: "どうぶつ みみ", kind: "wear", color: "#C9B6EE", caps: ["#D7C6EE", "#FFFFFF", "#F7A9C8"], items: [
      ["くまみみ カチューシャ", "まるい くまの みみの カチューシャ。", "head", "gacha_bearears", ["#B98B63", "#F2C9A0"]],
      ["うさみみ カチューシャ", "ながい うさぎの みみの カチューシャ。", "head", "gacha_bunnyears", ["#FFFFFF", "#F8A5C2"]],
      ["しろねこ カチューシャ", "しろい ねこの みみの カチューシャ。", "head", "catears", ["#FFFFFF", "#F8A5C2"]],
      ["ユニコーン カチューシャ", "きんの つのと おはなの レアの カチューシャ。", "head", "gacha_unicorn", ["#D8C8F2", "#F7C948"]],
    ] },
    { id: "sparkle", name: "キラキラ アクセ", kind: "wear", acc: true, color: "#F2A65E", caps: ["#FFB25B", "#FFFFFF", "#FFE07A"], items: [
      ["ほしの めがね", "おほしさまの かたちの めがね。", "face", "gacha_starglasses", ["#FFD84D"]],
      ["きらきら ペンダント", "みずいろの ほうせきの ペンダント。", "neck", "gacha_pendant", ["#7FD3F0", "#F7C948"]],
      ["ハートの ヘアピン", "ピンクの ハートの ヘアピン。", "head", "gacha_heartclip", ["#FF7BA8"]],
      ["にじいろ ティアラ", "にじいろの ほうせきが ならぶ レアの ティアラ。", "head", "gacha_tiara", ["#E6E9F2"]],
    ] },
    // ---- UI-28 で ふえた 6シリーズ（へやに かざる もの 3・アクセサリー 3）----
    { id: "zoo", name: "ミニ どうぶつえん", kind: "furn", color: "#8CC63F", caps: ["#C8E6A0", "#FFFFFF", "#FFE07A"], items: [
      ["ささと パンダ", "ささの はを かかえた パンダの フィギュア。"],
      ["みずあび ぞう", "はなで みずを しゅわっと とばす ぞう。"],
      ["いわの うえの ライオン", "いわの うえで むねを はる ライオン。"],
      ["ホワイトタイガー", "しろい からだに はいいろの しまの レアの フィギュア。"],
    ] },
    { id: "bakery", name: "こんがり パンやさん", kind: "furn", color: "#E0A066", caps: ["#F6D3A8", "#FFFFFF", "#FFE07A"], items: [
      ["ミニ メロンパン", "あみめの もようの メロンパンの ミニチュア。"],
      ["ミニ クロワッサン", "さくさくの クロワッサンの ミニチュア。"],
      ["ミニ しょくパン", "ふんわり やけた しょくパンの ミニチュア。"],
      ["ミニ パンかご", "いろいろな パンが ならぶ かごの レアの ミニチュア。"],
    ] },
    { id: "dino", name: "ちび きょうりゅう", kind: "furn", color: "#6CC3B0", caps: ["#BFE9DD", "#FFFFFF", "#FFE07A"], items: [
      ["ティラノサウルス", "おおきな あたまで がおっと ほえる きょうりゅう。"],
      ["トリケラトプス", "つの 3つと えりかざりの きょうりゅう。"],
      ["ステゴサウルス", "せなかに いたが ならぶ きょうりゅう。"],
      ["ブラキオサウルス", "くびの ながい おおきな レアの きょうりゅう。"],
    ] },
    { id: "hair", name: "ゆめかわ ヘアアクセ", kind: "wear", acc: true, color: "#F59AC0", caps: ["#FBD3E6", "#FFFFFF", "#D7C6EE"], items: [
      ["リボンの バレッタ", "みずたまの リボンに きんの ピンの バレッタ。", "head", "gacha_barrette", ["#C9B6EE", "#F7C948"]],
      ["いちごの ヘアゴム", "いちごが ふたつ ついた ヘアゴム。", "head", "gacha_berrytie", ["#FF5A6E", "#7CCB6B"]],
      ["パールの カチューシャ", "しろい パールが ならぶ カチューシャ。", "head", "gacha_pearlband", ["#F8D2E0", "#FFFFFF"]],
      ["ちょうちょの ヘアクリップ", "ほうせきの はねの レアの ヘアクリップ。", "head", "gacha_butterfly", ["#9FD8F2", "#F8A5C2"]],
    ] },
    { id: "neck", name: "キラキラ ネックレス", kind: "wear", acc: true, color: "#6FB7E0", caps: ["#BFE6F7", "#FFFFFF", "#E6E9F2"], items: [
      ["クローバーの ネックレス", "よつばの クローバーの ネックレス。", "neck", "gacha_clover", ["#7CCB6B", "#D9DEE8"]],
      ["ハートの ロケット", "あけしめ できる ハートの ロケット。", "neck", "gacha_locket", ["#F7C948", "#FF7BA8"]],
      ["パールの ネックレス", "まるい パールが ならんだ ネックレス。", "neck", "gacha_pearls", ["#FFFFFF", "#F2E6D9"]],
      ["ながれぼしの ネックレス", "ほしが ながれる レアの ネックレス。", "neck", "gacha_shootingstar", ["#FFE066", "#B79BEA"]],
    ] },
    { id: "party", name: "パーティー アクセ", kind: "wear", acc: true, color: "#A98BE0", caps: ["#D7C6EE", "#FFFFFF", "#FFE07A"], items: [
      ["まんまる サングラス", "ピンクの まるい レンズの サングラス。", "face", "gacha_roundshades", ["#FF9EC4", "#F7C948"]],
      ["ほしの フェイスシール", "ほっぺに はる ほしの シール。", "face", "gacha_starsticker", ["#FFD84D", "#FF7BA8"]],
      ["みずたまの ちょうネクタイ", "あかに しろい みずたまの ちょうネクタイ。", "neck", "gacha_dotbow", ["#E8434F", "#FFFFFF"]],
      ["ぴょこぴょこ カチューシャ", "ばねの さきに ほしが ゆれる レアの カチューシャ。", "head", "gacha_boppers", ["#B79BEA", "#FFD84D"]],
    ] },
  ];
  // けいひん（id: gacha_<シリーズ>_<0〜3>。3 が レア）
  // wide: よこに ながい けいひん（3にん なかよし など）の ばんごう。あとから たす シリーズ（js/gacha-forest.js）も Gacha.add で おなじ ように つくる
  const ITEMS = [], INDEX = {};
  const build = (S) => { const si = SERIES.indexOf(S); S.index = si; S.list = S.items.map((x, k) => { const it = { id: `gacha_${S.id}_${k}`, name: x[0], desc: x[1], kind: S.kind, series: si, k, rare: k === RARE, wide: (S.wide || []).includes(k) }; if (S.kind === "wear") Object.assign(it, { slot: x[2], wear: x[3], col: x[4] }); ITEMS.push(it); INDEX[it.id] = it; return it; }); };
  SERIES.forEach(build);
  const SIZE = (it) => (it.wide ? [90, 55, 34] : [50, 55, 30]); // へやでの w h depth（3にん なかよし は ひろい）

  // ---- くじ ----
  // r（0〜1）→ 0〜3。ふつう 3しゅ 30%ずつ・レア 10%
  const roll = (r) => { let a = 0; for (let k = 0; k < RATE.length; k++) { a += RATE[k]; if (r < a) return k; } return RARE; };
  const st = () => { const g = Save.d.gacha && typeof Save.d.gacha === "object" ? Save.d.gacha : (Save.d.gacha = { plays: 0, got: {}, done: {} }); if (!g.got || typeof g.got !== "object") g.got = {}; if (!g.done || typeof g.done !== "object") g.done = {}; if (!Number.isFinite(g.plays)) g.plays = 0; return g; };
  const got = (id) => { const n = st().got[id]; return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };
  const complete = (si) => SERIES[si].list.every((it) => got(it.id) > 0);
  const G2 = {
    PRICE, DUP, RATE, RARE, SERIES, ITEMS, INDEX, SIZE, roll, st, got, complete,
    next: null, // PokaDebug.gachaNext（つぎに でる 0〜3）
    speed: 1, // PokaDebug.gachaFast（えんしゅつの はやさ）
    seriesOf(id) { const it = INDEX[id]; return it ? SERIES[it.series] : null; },
    byId(id) { return SERIES.find((S) => S.id === id) || null; },
    // 1かいの ねだん（シールの 台は 100）
    priceOf(si) { const S = SERIES[si]; return S && S.price > 0 ? S.price : PRICE; },
    // 家具・服 いがいの けいひんを もちものに いれる（kind → (けいひん) => ことば。シールは js/sticker-book.js）
    GIVE: {},
    // 台の ふだ（シリーズの ばんごう → ことば。しゅうがわりの「NEW！」「らいしゅうは おやすみ」は js/mee-rotation.js）
    tagOf: null,
    // シリーズを あとから たす（4F の ガチャガチャの もり・js/gacha-forest.js）。ばんごうは つづき・けいひんは 家具／服に いれる
    add(list) { const items = []; for (const S of list) { SERIES.push(S); build(S); items.push(...S.list); } register(items); return list.map((S) => S.index); },
    // 1かい まわす（200コイン・シールは 100コイン）。でた けいひんを もちものに いれて けっかを かえす。コインが たりなければ null
    spin(si, r = Math.random()) {
      const S = SERIES[si], price = this.priceOf(si); if (!S || Save.d.coins < price) return null;
      const k = this.next != null && this.next >= 0 && this.next < 4 ? this.next : roll(r); this.next = null;
      const it = S.list[k], g = st(), first = !got(it.id), was = complete(si);
      Save.d.coins -= price; g.plays++; g.got[it.id] = got(it.id) + 1;
      let refund = 0, note = "";
      if (it.kind === "wear") { if (!WearStock.add(it.id, 1)) { refund = DUP; Save.d.coins += DUP; } }
      else if (it.kind === "furn") Save.d.furn[it.id] = (Save.d.furn[it.id] || 0) + 1;
      else if (this.GIVE[it.kind]) note = this.GIVE[it.kind](it) || "";
      const done = !was && complete(si); if (done) g.done[S.id] = U.today();
      Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
      return { item: it, k, rare: k === RARE, first, refund, note, price, complete: done, copies: it.kind === "wear" ? WearStock.count(it.id) : 0 };
    },
    // 絵（ラインナップの カード・けっか）
    pic(it) { return it.kind === "wear" ? Art.iconSvg("wear", it.id) : GachaArt.figure(it.id); },
  };

  // ---- 家具・服を ゲームに いれる ----
  const register = (items) => {
    for (const it of items) {
      if (it.kind === "wear") {
        const w = { id: it.id, name: it.name, slot: it.slot, wear: it.wear, col: it.col, price: it.rare ? 800 : 300, rare: it.rare, exclusive: "gacha", gachaPrize: true, st: { sp: it.rare ? 2 : 1 }, desc: it.desc };
        WEAR_ITEMS.push(w); ITEM_INDEX[it.id] = w;
      } else if (it.kind === "furn") {
        const [w, h, depth] = SIZE(it);
        const f = { id: it.id, name: it.name, price: 0, kind: "floor", w, h, depth, comfort: it.rare ? 6 : 4, rare: it.rare, interactive: true, exclusive: "gacha", gachaPrize: true, cityItem: { type: "gachafig", variant: it.id }, desc: it.desc };
        FURNITURE.push(f); FURN_INDEX[it.id] = f;
        FURN_ART[it.id] = () => GachaArt.figure(it.id).replace("<svg ", `<svg x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
      }
    }
  };
  const install = () => {
    register(ITEMS.slice());
    // おうちの 立体: たって いる 絵・足もとに かげ（ArcadePrizes.model と おなじ かたち）
    const model0 = IkebukuroItemArt.model;
    IkebukuroItemArt.model = function (id, opts = {}) {
      if (!INDEX[id] || INDEX[id].kind !== "furn") return model0.call(this, id, opts);
      const f = FURN_INDEX[id], w = f.w, h = f.h;
      return { x: -w / 2, y: -h, w, h: h + 12, footW: w, footD: f.depth, height: h, full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h} ${w} ${h + 12}">${GachaArt.figure(id).replace("<svg ", `<svg x="${-w / 2}" y="${-h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `)}</svg>` };
    };
  };
  install();
  return G2;
})();

// ---- 台の 画面（まわす・カプセル・あける）----
Gacha.REACT = {
  wanko: ["わん！ かわいい！", "わんこ、これ すき！", "やったー！"],
  gachan: ["ピヨ！ きらきら！", "がちゃんに にあう かな？", "ピヨピヨ♪"],
  goji: ["ガゥ！ いいね！", "ごじも ほしかった！", "ガゥガゥ♪"],
};
Gacha.wait = (ms) => new Promise((r) => setTimeout(r, ms / Math.max(1, Gacha.speed)));
Gacha.open = function (si) {
  const S = this.SERIES[si]; if (!S) return Promise.resolve();
  const price = this.priceOf(si), sticker = S.kind === "sticker";
  return new Promise((resolve) => {
    const body = U.el("div", { class: "gacha" });
    // shown: まわして から カプセルを あける まで の ラインナップ（まわす まえの ようす。でた けいひんの カードに「もってる」の わくが つかない ように・UI-51）
    let closed = false, busy = false, shown = null;
    const modal = UI.modal({ title: `「${S.name}」`, body, cls: "full gacha-panel", onClose: () => { closed = true; resolve(); } });
    this.view = { S, body, modal, phase: "ready", last: null };
    const cardsSvg = () => S.list.map((it, k) => this.pic(it).replace(/^<svg /, `<svg x="${40 + k * 26}" y="140" width="24" height="26" `)).join("") + `<text x="90" y="174" font-size="7" font-weight="900" text-anchor="middle" fill="${INK}" font-family="'M PLUS Rounded 1c',sans-serif">ぜんぶで 4しゅ</text>`;
    const stage = U.el("div", { class: "gacha-stage" });
    const mach = U.el("div", { class: "gacha-machine", html: GachaArt.machine(S, cardsSvg()) });
    const knob = U.el("div", { class: "gacha-knob", html: GachaArt.knob(S.color), "aria-hidden": "true" });
    const cap = U.el("div", { class: "gacha-cap hidden", "aria-hidden": "true" });
    mach.append(knob, cap); stage.append(mach);
    const side = U.el("div", { class: "gacha-side" }), sideInfo = U.el("div", { class: "gacha-info" }), acts = U.el("div", { class: "gacha-actions" });
    side.append(sideInfo, acts); stage.append(side);
    const line = U.el("div", { class: "gacha-line" });
    const result = U.el("div", { class: "gacha-result hidden", role: "status" });
    body.append(stage, result, line);
    // 服は もって いる かず（1こで 1人・5こ まで）、フィギュアは でた かず
    const counts = () => Object.fromEntries(S.list.map((it) => [it.id, it.kind === "wear" ? WearStock.count(it.id) : this.got(it.id)]));
    const info = () => {
      const own = shown ? shown.own : counts(), done = shown ? shown.done : this.complete(si);
      sideInfo.replaceChildren(
        U.el("div", { class: "gacha-label", text: "ガチャガチャ" }),
        U.el("div", { class: "gacha-price", text: `1かい ${price}コイン` }),
        U.el("div", { class: "gacha-coins", text: `もって いる コイン ${U.fmt(Save.d.coins)}` }),
        U.el("div", { class: "gacha-rate", text: "ふつう 3しゅ 30%ずつ・レア 10%" }),
        ...[this.tagOf ? this.tagOf(si) : ""].filter(Boolean).map((t) => U.el("div", { class: "gacha-week" + (/NEW/.test(t) ? " new" : ""), text: t })),
        U.el("div", { class: "gacha-kind", text: sticker ? "でるのは シールが 4まい はいった シート（すまほの「シール」で はれる）" : S.kind === "wear" ? (S.hand ? `でるのは もちもの（1こで ひとり・おなじ ものは ${WearStock.CAP}こ まで）` : S.acc ? `でるのは アクセサリー（1こで ひとり・おなじ ものは ${WearStock.CAP}こ まで）` : `でるのは ふく（1こで ひとり・おなじ ふくは ${WearStock.CAP}こ まで）`) : "でるのは へやに かざる フィギュア" }),
        ...(done ? [U.el("div", { class: "gacha-done", text: "コンプリート！" })] : []),
      );
      line.replaceChildren(...S.list.map((it) => {
        const n = own[it.id], c = U.el("div", { class: "gacha-card" + (it.rare ? " rare" : "") + (n ? " own" : "") });
        const has = sticker ? "でた" : "もってる"; // シートは はると なくなる ので「でた かず」
        c.append(U.el("img", { src: U.svgUrl(this.pic(it)), alt: "" }), U.el("div", { class: "gacha-name", text: it.name }), U.el("div", { class: "gacha-own", text: it.rare ? (n ? `レア・${has} ×${n}` : "レア・まだ") : n ? `${has} ×${n}` : "まだ" }));
        return c;
      }));
    };
    const buttons = () => {
      const can = Save.d.coins >= price;
      const go = UI.btn(`${price}コインで まわす`, () => spin(), "yellow gacha-go"); go.disabled = !can || busy;
      acts.replaceChildren(go);
      if (!can && !busy) acts.append(U.el("div", { class: "gacha-need", text: "コインが たりないよ" }));
    };
    const spin = async () => {
      if (busy || closed) return;
      const before = { own: counts(), done: this.complete(si) };
      const r = this.spin(si); if (!r) { UI.toast("コインが たりないよ"); buttons(); return; }
      shown = before; busy = true; this.view.phase = "turn"; this.view.last = r; buttons(); result.classList.add("hidden");
      info();
      Sound.se("ok"); knob.classList.remove("turn"); void knob.offsetWidth; knob.classList.add("turn");
      for (let i = 0; i < 3; i++) { Sound.se("gacha_turn"); await this.wait(280); }
      if (closed) return;
      // カプセルが でてくる（いろは シリーズの いろから でたらめに。けいひんや レアとは かんけい ない）
      const col = S.caps[Math.floor(Math.random() * S.caps.length) % S.caps.length];
      cap.innerHTML = GachaArt.capsule(col, 0, "g" + si); cap.classList.remove("hidden", "open", "drop"); void cap.offsetWidth; cap.classList.add("drop")
      Sound.se("gacha_drop"); await this.wait(520);
      if (closed) return;
      // でてきた カプセルを おおきく（タップで あける）
      this.view.phase = "capsule";
      const big = U.el("button", { class: "gacha-bigcap", "aria-label": "カプセルを あける", html: GachaArt.capsule(col, 0, "b" + si) });
      big.addEventListener("click", () => open(r, col, big));
      result.classList.remove("hidden"); result.replaceChildren(big, U.el("div", { class: "gacha-tap", text: "カプセルを タップして あけよう！" }));
      cap.classList.add("hidden");
    };
    const open = async (r, col, big) => {
      if (this.view.phase !== "capsule" || closed) return;
      this.view.phase = "open"; big.disabled = true;
      big.innerHTML = GachaArt.capsule(col, 1, "o" + si); big.classList.add("open"); Sound.se("gacha_open");
      await this.wait(260); if (closed) return;
      if (r.rare) Sound.se("gacha_rare"); else Sound.se("sparkle");
      const who = Save.d.order[(Save.d.gacha.plays - 1) % 3], line1 = this.REACT[who][(Save.d.gacha.plays - 1) % this.REACT[who].length];
      const card = U.el("div", { class: "gacha-prize" });
      card.append(U.el("img", { src: U.svgUrl(this.pic(r.item)), alt: r.item.name }));
      const txt = U.el("div", { class: "gacha-prize-text" });
      txt.append(U.el("div", { class: "gacha-badges", text: [r.rare ? "レア！" : "", r.first ? "NEW" : ""].filter(Boolean).join(" ") }), U.el("b", { text: r.item.name }), U.el("div", { class: "gacha-desc", text: r.item.desc }));
      if (r.note) txt.append(U.el("div", { class: "gacha-dup", text: r.note }));
      if (r.refund) txt.append(U.el("div", { class: "gacha-dup", text: `もう ${WearStock.CAP}こ もって いる ので ${r.refund}コイン もどったよ` }));
      else if (r.copies > 1) txt.append(U.el("div", { class: "gacha-dup", text: `${r.copies}こめ！ ${r.copies}にんで つかえるよ` }));
      txt.append(U.el("div", { class: "gacha-say", text: `${Save.d.chars[who].name}「${line1}」` }));
      card.append(txt);
      result.replaceChildren(card);
      if (r.complete) result.append(U.el("div", { class: "gacha-done big", text: `「${S.name}」 コンプリート！ 4しゅ ぜんぶ そろったよ` }));
      this.view.phase = "done"; busy = false; shown = null; info(); buttons();
      const go = acts.querySelector(".gacha-go"); if (go) go.textContent = `もう1かい まわす（${price}コイン）`;
    };
    info(); buttons();
  });
};

// ---- こうかおん ----
Object.assign(CraneSE, {
  gacha_turn: (S, T, N) => { N({ dur: 0.04, vol: 0.22, freq: 2200, q: 2.5 }); T({ f: 320, f2: 260, dur: 0.05, type: "square", vol: 0.06 }); N({ dur: 0.04, vol: 0.18, freq: 1800, q: 2.5, t: 0.12 }); },
  gacha_drop: (S, T, N) => { T({ f: 520, f2: 180, dur: 0.16, type: "triangle", vol: 0.12 }); T({ f: 140, f2: 70, dur: 0.14, type: "sine", vol: 0.3, t: 0.18 }); N({ dur: 0.08, vol: 0.16, freq: 700, q: 1, t: 0.18 }); T({ f: 180, f2: 90, dur: 0.1, type: "sine", vol: 0.18, t: 0.34 }); },
  gacha_open: (S, T, N) => { N({ dur: 0.05, vol: 0.25, freq: 2600, q: 1.5 }); T({ f: 660, f2: 1320, dur: 0.12, type: "triangle", vol: 0.1 }); },
  gacha_rare: (S, T) => { ["C6", "E6", "G6", "C7", "G6", "C7", "E7"].forEach((n, i) => T({ f: S.freq(n), t: i * 0.08, dur: i === 6 ? 0.5 : 0.09, type: "triangle", vol: 0.1 })); },
});
