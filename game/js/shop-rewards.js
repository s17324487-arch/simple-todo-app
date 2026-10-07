// おてつだいの節目。セーブは受取済みIDを足すだけで、所持金には触らない。
// UI-38（オーナーの FB 2026-10-01「ごほうびの景品の品質が低い。全面的に差し替えて」）: 11の おみせ × 4だん（Lv5・10・15・30）＝ 44こを（UI-64・65 で あたまの たいそう・パズル こうぼうの 4こずつを たして 52こ）、
// おみせごとに ちがう 家具に 作りなおした（まえは 4つの 形に しるしを かえた だけ）。id（shop_<おみせ>_<レベル>）・うけとりの きろく（Save.d.shopRewards）・
// もらいかたは そのまま。立体の 絵と さわった ときの うごき（あかりが つく・ゆれる・まわる など）は js/shop-reward-art.js（ShopRewardArt）。
// UI-108（オーナーの 指示 2026-10-07「お店のお手伝いのレベル上限をあげて。50くらいまで。」）: おみせ Lv は 50 まで（まえは 30）。
// ひょうばんの しきいは まえと おなじ しきで 31〜50 を たす（Lv.1〜30 の しきいは かわらない）。Lv.6 からの コインの ふえかたは js/economy.js（GameEconomy.lvBonus）。
const ShopRewards = {
  levels: [5, 10, 15, 30],
  maxLevel: 50,
  themes: {
    burger: { name: "バーガー", color: "#EDB56F" },
    groom: { name: "びようしつ", color: "#C7B3DD" },
    cake: { name: "ケーキ", color: "#ECB5C8" },
    crepe: { name: "クレープ", color: "#F0CE92" },
    dentist: { name: "はいしゃさん", color: "#B6DDE6" },
    bakery: { name: "パン", color: "#DCB58B" },
    florist: { name: "おはな", color: "#B7D3AE" },
    relay: { name: "そらの はいたつ", color: "#AEBFDF" },
    korokoro: { name: "ころころ フルーツ", color: "#F2C48D" },
    gasstand: { name: "ガソリンスタンド", color: "#F2A65A" },
    postoffice: { name: "ゆうびんきょく", color: "#E8766A" },
    brain: { name: "あたまの たいそう", color: "#9DB8E8" },
    kobo: { name: "パズル こうぼう", color: "#E9B872" },
  },
  // [なまえ, せつめい, はば, おくゆき, たかさ, しゅるい（もようがえの 一覧）, そのほか]。ならびは Lv5・10・15・30
  ITEMS: {
    burger: [
      ["バーガーの スツール", "ふかふかの バンズに すわれる。チーズが とろり。", 46, 46, 46, "sit"],
      ["ポテトの スタンドライト", "あかい はこの ポテトが ひかる。タップで ぱっ！", 42, 38, 98, "light"],
      ["ダイナーの ボックスせき", "あかい ソファと テーブルの おみせの せき。", 128, 72, 76, "sit"],
      ["ネオンの バーガー カウンター", "ネオンが ひかって シェイクの マシンが まわる。", 152, 66, 136, "table"],
    ],
    groom: [
      ["くるくる サインポール", "あか・あお・しろの しまが くるくる まわる。", 32, 32, 104, "misc"],
      ["ねこみみ ドライヤー チェア", "ねこみみの フードで ふんわり かわかす いす。", 66, 64, 116, "sit"],
      ["ライトつきの かがみだい", "まるい ライトが ならぶ かがみと ブラシ。", 116, 48, 128, "table"],
      ["チョキさんの ゆめの サロン", "きんの かがみと ふかふかの チェアの セット。", 154, 92, 156, "sit"],
    ],
    cake: [
      ["マカロンの クッション", "ピンクと ミントの マカロンを かさねた。", 48, 48, 40, "sit"],
      ["カップケーキの ランプ", "クリームの かさと さくらんぼが ひかる。", 46, 46, 88, "light"],
      ["ケーキの ショーケース", "ガラスの なかに ケーキが ずらり。", 116, 54, 100, "table"],
      ["ショートケーキの ベッド", "スポンジと クリームと いちごの ベッド。", 136, 98, 98, "sit", { sleep: 2 }],
    ],
    crepe: [
      ["クレープの メニュー ボード", "マダムの てがきの えが かわいい こくばん。", 48, 32, 80, "misc"],
      ["いちごの パラソル テーブル", "いちごの かさの まるい テーブル。", 90, 90, 124, "table"],
      ["クレープの やたい", "まるい てっぱんで うすく やく やたい。", 126, 64, 126, "table"],
      ["ゆめいろ クレープ カー", "やねに おおきな クレープが のった くるま。", 162, 86, 130, "misc"],
    ],
    dentist: [
      ["はブラシの スタンド", "おおきな はブラシと はみがきこ。", 42, 32, 88, "misc"],
      ["にこにこ はの いす", "にっこり わらう おくばの いす。", 60, 54, 68, "sit"],
      ["3にんの せんめんだい", "3にんの いろの はブラシと コップ。", 108, 50, 116, "table"],
      ["はの ようせいの おしろ", "しんじゅが ひかる おしろ。ようせいが とぶよ。", 128, 92, 168, "misc"],
    ],
    bakery: [
      ["しょくパンの クッション", "こんがり みみの ふわふわ しょくパン。", 50, 46, 38, "sit"],
      ["パンかごの ワゴン", "バゲットと クロワッサンの かご。", 88, 50, 78, "table"],
      ["レンガの パンがま", "まきの ひで パンが こんがり やける。", 116, 66, 120, "misc"],
      ["こんがり パンの おうち", "メロンパンの やねと クッキーの ドア。", 154, 112, 156, "toy"],
    ],
    florist: [
      ["はなの バケツ スタンド", "3だんの たなに はなの バケツ。", 58, 42, 78, "plant"],
      ["はなかざりの ベンチ", "せもたれに はなの かざりが ある ベンチ。", 108, 48, 72, "sit"],
      ["ガラスの おんしつ", "ちいさな おんしつ。ちょうちょが とぶよ。", 108, 64, 136, "plant"],
      ["ばらの ブランコ アーチ", "ばらの アーチに ゆれる ブランコ。", 154, 82, 174, "sit"],
    ],
    relay: [
      ["にもつの ダンボール いす", "そらの はいたつの シールが はってある。", 48, 48, 44, "sit"],
      ["ききゅうの ランプ", "しましまの ききゅうが ふわっと ひかる。", 56, 56, 122, "light"],
      ["そらの ちずの つくえ", "くもと ほしの ちずと ちきゅうぎ。", 122, 62, 98, "table"],
      ["くもの はいたつ ひこうき", "のれる ひこうき。プロペラが まわる。", 164, 112, 106, "toy"],
    ],
    korokoro: [
      ["どんぐりの スツール", "どんぐりの ぼうしに すわれる。", 44, 44, 50, "sit"],
      ["ぶどうの ランプ", "つるの スタンドに ぶどうの あかり。", 52, 52, 124, "light"],
      ["すいかの ソファ", "まんまるの すいかを きった ソファ。", 128, 66, 68, "sit"],
      ["コロンの きのうえの おうち", "おおきな きの うえの りすの おうち。", 144, 112, 180, "toy"],
    ],
    gasstand: [
      ["タイヤの スツール", "タイヤを 2つ かさねた スツール。", 48, 48, 42, "sit"],
      ["きゅうゆきの ランプ", "まるい あたまが ひかる レトロな きゅうゆき。", 48, 40, 118, "light"],
      ["くるまの ベッド", "あかい レーシングカーの ベッド。", 136, 76, 66, "sit", { sleep: 2 }],
      ["ライオンの ガレージ", "スロープを ミニカーが ころころ。", 154, 102, 136, "toy"],
    ],
    postoffice: [
      ["まるい ポストの ちょきんばこ", "あかい まるい ポスト。てがみが ぽこっ。", 34, 34, 78, "misc"],
      ["てがみの かきもの づくえ", "びんせんと きってと インクの つくえ。", 96, 52, 90, "table"],
      ["しわけの たな", "いろんな いろの てがみと こづつみ。", 122, 42, 128, "table"],
      ["あかい とけいとうの ポスト", "かねが なって てがみが とびだす。", 108, 94, 232, "misc"],
    ],
    // あたまの たいそう（js/mg-brain.js・UI-64）
    brain: [
      ["ふくろうの スツール", "ふくろうの せんせいの まるい いす。", 44, 44, 48, "sit"],
      ["ちきゅうぎの ランプ", "ちきゅうぎが ひかる。タップで ぱっ！", 46, 42, 104, "light"],
      ["こくばんの つくえ", "こくばんと ほんと りんごの つくえ。", 104, 56, 110, "table"],
      ["ほしの てんもんだい", "まるい やねから ぼうえんきょう。", 130, 104, 160, "toy"],
    ],
    // パズル こうぼう（js/mg-kobo.js・UI-65）
    kobo: [
      ["ジグソーの スツール", "4まいの ピースを くみあわせた いす。", 46, 46, 44, "sit"],
      ["キューブの ランプ", "いろの キューブが ひかる。タップで ぱっ！", 44, 44, 96, "light"],
      ["パズルの テーブル", "スライド パズルの てんばんの つくえ。", 100, 60, 62, "table"],
      ["からくり ビーだま コース", "ビーだまが ころころ くだって かねが なる。", 120, 64, 150, "toy"],
    ],
  },
  COMFORT: [5, 7, 9, 12],
  prizes: [],
  level(st) {
    let lv = Math.max(1, Math.min(this.maxLevel, st.lv || 1));
    while (lv < this.maxLevel && st.rep >= SHOP_LV_REP[lv + 1]) lv++;
    return lv;
  },
  rows(shop) {
    const st = Save.d.shops[shop];
    if (!st || !this.themes[shop]) return [];
    const lv = this.level(st), claimed = Save.d.shopRewards;
    return this.prizes.filter(p => p.shop === shop).map(p => ({ ...p, ready: lv >= p.level, claimed: !!claimed[p.id] }));
  },
  // レベルが あがった ときの ひとこと（けっかの まど）: Lv.5 までは むずかしさと コイン・Lv.6 からは コインの ボーナスと つぎの ごほうび（UI-108）
  upText(shop, lv) {
    if (lv <= 5) return "ちゅうもんが むずかしく なって、コインも ふえるよ。";
    const pct = typeof GameEconomy !== "undefined" ? GameEconomy.lvBonusPct(lv) : 0, next = this.prizes.find((p) => p.shop === shop && p.level > lv);
    return `もらえる コインが すこし ふえたよ（+${pct}%）。` + (next ? `つぎの ごほうびは Lv.${next.level}！` : lv >= this.maxLevel ? "さいこうの レベルだよ！" : "");
  },
  claim(shop) {
    const rows = this.rows(shop).filter(p => p.ready && !p.claimed);
    for (const p of rows) {
      // 家具と受取記録を同じセーブに書く。再入場・再読み込みでも二重配布しない。
      Save.d.furn[p.id] = (Save.d.furn[p.id] || 0) + 1;
      Save.d.shopRewards[p.id] = true;
    }
    if (rows.length) { Save.mark(); Save.write(); }
    return rows;
  },
  open(selected = "burger") {
    const body = U.el("div"), select = U.el("select", { "aria-label": "ごほうびの おみせ", style: "width:100%;min-height:44px;margin-bottom:10px" });
    for (const shop of Object.keys(this.themes)) select.append(U.el("option", { value: shop, text: SHOPS[shop].name }));
    select.value = selected;
    const content = U.el("div");
    const render = () => {
      const shop = select.value, rows = this.rows(shop), lv = this.level(Save.d.shops[shop]);
      content.replaceChildren();
      const pct = typeof GameEconomy !== "undefined" ? GameEconomy.lvBonusPct(lv) : 0;
      content.append(U.el("div", { class: "note", text: `おみせ Lv.${lv} ／ ${this.maxLevel}　ひょうばん ${Save.d.shops[shop].rep}${lv < this.maxLevel ? " / " + SHOP_LV_REP[lv + 1] : ""}` }));
      if (pct > 0) content.append(U.el("div", { class: "note shop-lv-bonus", text: `おみせ Lv.${lv}の ボーナス: もらえる コインが +${pct}%` }));
      const claim = UI.btn("ごほうびを うけとる", () => { const got = this.claim(shop); if (got.length) { Sound.se("fanfare"); UI.toast(`${got.length}こ の かぐを もらったよ！`); } render(); }, "wide yellow");
      claim.disabled = !rows.some(p => p.ready && !p.claimed); content.append(claim);
      for (const p of rows) {
        const card = U.el("div", { class: "shop-prize-card" + (p.ready ? "" : " lock") });
        card.append(U.el("div", { class: "shop-prize-picture", html: HomeDesign.model(p.id).full }));
        const info = U.el("div");
        info.append(U.el("b", { text: `Lv.${p.level}　${p.name}` }), U.el("div", { class: "muted", text: p.desc }), U.el("div", { class: "note", text: p.claimed ? "うけとりずみ" : p.ready ? "うけとれるよ！" : `あと ${p.level - lv} レベル` }));
        card.append(info); content.append(card);
      }
    };
    select.addEventListener("change", render);
    body.append(U.el("p", { class: "shop-prize-intro", text: "この おてつだいだけの かぐだよ。もらった かぐは おうちの「もようがえ」で かざろう！ さわると うごく かぐも あるよ。" }), select, content);
    render(); UI.modal({ title: "おみせの ごほうび", body, cls: "full" });
  },
};

// 5以降は注文の難しさを据え置き、評判による長期目標を増やす（コインは Lv.6 から すこしずつ ふえる: GameEconomy.lvBonus）。
for (let lv = SHOP_LV_REP.length; lv <= ShopRewards.maxLevel; lv++) SHOP_LV_REP[lv] = SHOP_LV_REP[lv - 1] + 200 + lv * 40;
for (const shop of Object.keys(ShopRewards.themes)) {
  ShopRewards.ITEMS[shop].forEach(([name, desc, w, d, h, cat, extra = {}], i) => {
    const level = ShopRewards.levels[i];
    const p = { id: `shop_${shop}_${level}`, shop, level, tier: i, name, desc, w, d, h };
    ShopRewards.prizes.push(p);
    const f = { id: p.id, name, price: 0, rare: true, shopPrize: true, kind: "floor", w, depth: d, h, comfort: ShopRewards.COMFORT[i], interactive: true, cat, desc, ...extra };
    FURNITURE.push(f); FURN_INDEX[f.id] = f;
    FURN_ART[f.id] = (opts = {}) => HomeDesign.model(f.id, opts).full;
  });
}
