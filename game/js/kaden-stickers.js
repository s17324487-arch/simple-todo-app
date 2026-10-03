// UI-57: ネリカス でんき 1F の シール うりば（オーナーの FB 2026-10-03「家電屋ではあるが、シールの販売を充実させよ。シールを新たに30種以上用意して…網羅せよ」）。
// ・シール 46しゅ（絵は js/kaden-sticker-art.js）を シールちょう（StickerBook.addDesigns）に たす。しゅるい kind と うごき fx:
//   ぷくぷく（マシュマロ: ふにっ）・ドロップ（ぷるん）・シャカシャカ（なかみが まう）・フレーク（ちいさい・1ふくろ 12まい）・タイル（3×3 の シートを きる）・へいせい レトロ・そざい 6しゅ
// ・しなもの 12（パック。1かい かうと シールが てもとに ふえる・すまほの「シール」で はれる）。ねだんは 200〜600コイン（家具や 服より ずっと やすい）。
// ・1F の いりぐちの ひがし（x 8〜14・y 19〜26）に うりば: フレークと レトロの たな・くるくる ラック 2つ（ドロップ・シャカシャカ）・ぷくぷくの テーブル・そざいの ショーケース・てんいんさん。
//   たなを タップすると その しゅるいの しなもの（UI.modal）。セーブは シールちょうと おなじ Save.d.stickers だけ（かたちは かわらない）。
const KadenStickers = (() => {
  const HINT = "ネリカス でんきの 1F の シール うりばで かえるよ";
  const KINDS = { puku: "ぷくぷく", drop: "ドロップ", shaka: "シャカシャカ", flake: "フレーク", tile: "タイル・レトロ", mat: "そざい" };
  const TABS = Object.keys(KINDS);
  const TIP = {
    squish: "マシュマロ シールは タップすると ふにっと するよ",
    jelly: "ドロップ シールは タップすると ぷるんと するよ",
    shaka: "シャカシャカ シールは ゆびで うごかすと なかの ラメが まうよ",
    tile: "タイル シートは えらんで「きる」を おすと 9まいに なるよ",
  };
  const TILES = KadenStickerArt.TILE_ORDER.map((k) => "stk_tl_" + k);
  const TILE_NAME = { heart: "ハート", star: "おほしさま", smile: "スマイル", rainbow: "にじ", berry: "いちご", cho: "ちょうちょ", phone: "ガラケー", note: "おんぷ", ribbon: "リボン" };
  // [id, なまえ, しゅるい, うごき, はる ときの おおきさ（SIZES の ばんごう）, ひとこと]
  const LIST = [
    ["stk_mm_wanko", "マシュマロ わんこ", "puku", "squish"], ["stk_mm_gachan", "マシュマロ がちゃん", "puku", "squish"], ["stk_mm_goji", "マシュマロ ごじ", "puku", "squish"],
    ["stk_mm_cloud", "ぷくぷく くも", "puku", "squish"], ["stk_mm_mochi", "ぷくぷく おもち", "puku", "squish"],
    ["stk_dp_heart", "ドロップ ハート", "drop", "jelly"], ["stk_dp_star", "ドロップ ほし", "drop", "jelly"], ["stk_dp_cherry", "ドロップ さくらんぼ", "drop", "jelly"], ["stk_dp_bunny", "ドロップ うさぎ", "drop", "jelly"], ["stk_dp_gem", "ドロップ ほうせき", "drop", "jelly"],
    ["stk_sk_sea", "シャカシャカ うみ", "shaka", "shaka"], ["stk_sk_snow", "シャカシャカ ゆき", "shaka", "shaka"], ["stk_sk_star", "シャカシャカ よぞら", "shaka", "shaka"], ["stk_sk_heart", "シャカシャカ ハート", "shaka", "shaka"],
    ["stk_fk_cupcake", "カップケーキ", "flake", null, 1], ["stk_fk_cookie", "ハートの クッキー", "flake", null, 1], ["stk_fk_pudding", "プリン", "flake", null, 1], ["stk_fk_cake", "ショートケーキ", "flake", null, 1], ["stk_fk_lolli", "ぺろぺろ キャンディ", "flake", null, 1], ["stk_fk_soda", "クリーム ソーダ", "flake", null, 1],
    ["stk_fk_sakura", "さくら", "flake", null, 1], ["stk_fk_tulip", "チューリップ", "flake", null, 1], ["stk_fk_sunflower", "ひまわり", "flake", null, 1], ["stk_fk_bird", "ことり", "flake", null, 1], ["stk_fk_butterfly", "ちょうちょ", "flake", null, 1], ["stk_fk_clover", "よつば", "flake", null, 1],
    ["stk_tl_sheet", "タイル シート", "tile", "tile", 4],
    ...TILES.map((id) => [id, "タイル " + TILE_NAME[id.slice(7)], "tile", null, 0]),
    ["stk_y2_phone", "ガラケー", "tile", null], ["stk_y2_pixel", "ドット ハート", "tile", null], ["stk_y2_smile", "にじいろ スマイル", "tile", null], ["stk_y2_egg", "たまごの ゲーム", "tile", null],
    ["stk_mt_paper", "かみの ねこ", "mat", null, null, "かみの シール: いちばん よく ある シール。つやは ないけど いろが やさしい"],
    ["stk_mt_film", "フィルムの ペンギン", "mat", null, null, "フィルムの シール: うすくて つるつる。みずにも つよいよ"],
    ["stk_mt_washi", "わしの きんぎょ", "mat", null, null, "わしの シール: にほんの かみ。すこし すけて、せんいの すじが みえるよ"],
    ["stk_mt_clear", "とうめいな ちょうちょ", "mat", null, null, "とうめいな シール: まわりが すけて、したの かみの もようが みえるよ"],
    ["stk_mt_mirror", "ミラーの ハート", "mat", null, null, "ミラーの シール: かがみの ように ぴかっと ひかる ぎんいろ"],
    ["stk_mt_foil", "はくおしの つき", "mat", null, null, "はくおしの シール: きんいろの はくを おしつけた、こうきゅうな シール"],
  ];
  StickerBook.addDesigns(LIST.map(([id, name, kind, fx, size, tip]) => ({
    id, name, series: "kaden", kind, fx, size: Number.isInteger(size) ? size : null, art: KadenStickerArt.FIG[id],
    hint: TILES.includes(id) ? "タイル シートを えらんで「きる」と でるよ（" + HINT + "）" : HINT,
    tip: tip || TIP[fx] || "", cut: id === "stk_tl_sheet" ? { into: TILES, cols: 3, size: 0 } : null,
    layers: fx === "shaka" ? () => KadenStickerArt.layers(id) : null,
  })));
  const IDS = LIST.map((x) => x[0]);

  // ---- しなもの（パック）----
  const PRODUCTS = [
    { id: "kst_mm3", kind: "puku", name: "マシュマロ シール（3にん）", price: 300, color: "#FFD3E4", stickers: [["stk_mm_wanko", 1], ["stk_mm_gachan", 1], ["stk_mm_goji", 1]], desc: "スポンジの ような やわらかい シール。ゆびで おすと ふにっと するよ。" },
    { id: "kst_mmfood", kind: "puku", name: "ぷくぷく シール（くもと おもち）", price: 200, color: "#E3F1FA", stickers: [["stk_mm_cloud", 2], ["stk_mm_mochi", 2]], desc: "ふっくら ふくらんだ ぷくぷく シールが 4まい。" },
    { id: "kst_dp1", kind: "drop", name: "ドロップ シール（ハートと ほし）", price: 400, color: "#FFC2D6", stickers: [["stk_dp_heart", 2], ["stk_dp_star", 2], ["stk_dp_gem", 1]], desc: "あめや グミの ような つやつやの ドロップ。あつみが あって、すける いろが きれい。" },
    { id: "kst_dp2", kind: "drop", name: "ドロップ シール（うさぎと さくらんぼ）", price: 400, color: "#FFD9C2", stickers: [["stk_dp_bunny", 2], ["stk_dp_cherry", 2], ["stk_dp_gem", 1]], desc: "ぷるんと した ドロップ シールが 5まい。ほうせきも はいって いるよ。" },
    { id: "kst_sk1", kind: "shaka", name: "シャカシャカ シール（うみと ゆき）", price: 500, color: "#C8E8F7", stickers: [["stk_sk_sea", 1], ["stk_sk_snow", 1]], desc: "なかに みずと ラメが はいって いて、うごかすと シャカシャカ まうよ。" },
    { id: "kst_sk2", kind: "shaka", name: "シャカシャカ シール（よぞらと ハート）", price: 500, color: "#E2D8F5", stickers: [["stk_sk_star", 1], ["stk_sk_heart", 1]], desc: "おほしさまや ハートの ラメが ゆらゆら。ゆびで ふって みてね。" },
    { id: "kst_fk1", kind: "flake", name: "フレーク シール（おかし 12まい）", price: 200, color: "#FFE7C2", stickers: ["stk_fk_cupcake", "stk_fk_cookie", "stk_fk_pudding", "stk_fk_cake", "stk_fk_lolli", "stk_fk_soda"].map((id) => [id, 2]), desc: "1まいずつ きりぬいて ある ちいさな シール。すきまに たくさん はれるよ。" },
    { id: "kst_fk2", kind: "flake", name: "フレーク シール（おはなと ことり 12まい）", price: 200, color: "#DDF1D2", stickers: ["stk_fk_sakura", "stk_fk_tulip", "stk_fk_sunflower", "stk_fk_bird", "stk_fk_butterfly", "stk_fk_clover"].map((id) => [id, 2]), desc: "おはなと ことりの フレークが 6しゅ 2まいずつ。" },
    { id: "kst_tl", kind: "tile", name: "タイル シール（じぶんで きる 9まい）", price: 400, color: "#FFF1C2", stickers: [["stk_tl_sheet", 1]], desc: "3×3 の タイルの シート。シールちょうで「きる」と 9まいの タイルに なるよ。" },
    { id: "kst_y2", kind: "tile", name: "へいせい レトロ シール", price: 300, color: "#F7D3F0", stickers: [["stk_y2_phone", 1], ["stk_y2_pixel", 1], ["stk_y2_smile", 1], ["stk_y2_egg", 1]], desc: "ちょっと むかしの はやりの もの。ガラケーや ドットの ハート。にじいろに ひかるよ。" },
    { id: "kst_mt1", kind: "mat", name: "そざいの シール（かみ・フィルム・わし）", price: 300, color: "#EFE6D6", stickers: [["stk_mt_paper", 1], ["stk_mt_film", 1], ["stk_mt_washi", 1]], desc: "おなじ シールでも そざいで さわりごこちが ちがうよ。かみ・つるつるの フィルム・にほんの かみ わし。" },
    { id: "kst_mt2", kind: "mat", name: "とくべつな そざい（とうめい・ミラー・はくおし）", price: 600, color: "#D9E2EE", stickers: [["stk_mt_clear", 1], ["stk_mt_mirror", 1], ["stk_mt_foil", 1]], desc: "すける とうめいな シール・かがみの ように ひかる ミラー・きんいろの はくおし。" },
  ];
  const P_INDEX = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const count = (p) => p.stickers.reduce((n, [, k]) => n + k, 0);
  // かう: コインを はらって シールを てもとへ。ことばを かえす（たりない ときは null）
  const buy = (pid) => {
    const p = P_INDEX[pid]; if (!p) return null;
    if (Save.d.coins < p.price) return null;
    Save.addCoins(-p.price);
    const fresh = []; for (const [id] of p.stickers) if (!(StickerBook.got(id) > 0) && !fresh.includes(id)) fresh.push(id);
    for (const [id, k] of p.stickers) StickerBook.add(id, k);
    view.bought++; view.last = p.id;
    return `シールが ${count(p)}まい ふえたよ。` + (fresh.length ? `あたらしい シール: ${fresh.map((id) => StickerBook.INDEX[id].name).join("・")}。` : "") + "すまほの「シール」で はれるよ";
  };

  // ---- うりばの がめん（UI.modal）----
  const URLS = {};
  const packUrl = (pid) => URLS[pid] || (URLS[pid] = U.svgUrl(KadenStickerArt.pack(P_INDEX[pid])));
  const view = { open: false, tab: null, bought: 0, last: null };
  const open = (scene, tab = "puku") => new Promise((resolve) => {
    view.open = true; view.tab = TABS.includes(tab) ? tab : "puku";
    const body = U.el("div", { class: "kst-shop" }), tabs = U.el("div", { class: "kst-tabs" }), coins = U.el("div", { class: "kst-coins" }), list = U.el("div", { class: "kst-list" });
    body.append(U.el("div", { class: "kst-lead", text: "シールは すまほの「シール」の シールちょうに はれるよ。" }), tabs, coins, list);
    const card = (p) => {
      const c = U.el("div", { class: "kst-card" }); c.dataset.id = p.id;
      const right = U.el("div", { class: "kst-info" });
      const have = U.el("div", { class: "kst-have" });
      for (const [id, k] of p.stickers) { const g = StickerBook.got(id), sp = U.el("span", { class: "kst-st" + (g ? "" : " new") }); sp.append(U.el("img", { src: StickerBook.url(id), alt: "", draggable: "false" }), U.el("b", { text: `×${k}` })); sp.setAttribute("aria-label", `${StickerBook.INDEX[id].name} ${k}まい`); have.append(sp); }
      const b = UI.btn(`かう（${p.price} コイン）`, () => {
        if (Save.d.coins < p.price) { Sound.se("bad"); UI.toast("コインが たりないよ"); return; }
        const note = buy(p.id); Sound.se("coin"); Save.write(); if (typeof UI.updateHud === "function") UI.updateHud(); UI.toast(note); render();
      }, "kst-buy" + (Save.d.coins < p.price ? " off" : ""));
      right.append(U.el("div", { class: "kst-name", text: p.name }), U.el("div", { class: "kst-desc", text: p.desc }), have, b);
      c.append(U.el("img", { class: "kst-pack", src: packUrl(p.id), alt: p.name, draggable: "false" }), right);
      return c;
    };
    const render = () => {
      tabs.replaceChildren(...TABS.map((k) => { const b = UI.btn(KINDS[k], () => { view.tab = k; Sound.se("tap"); render(); list.scrollTop = 0; }, "small" + (k === view.tab ? " yellow" : "")); b.dataset.tab = k; return b; }));
      coins.textContent = `もって いる コイン: ${U.fmt(Save.d.coins)}`;
      list.replaceChildren(...PRODUCTS.filter((p) => p.kind === view.tab).map(card));
    };
    render();
    UI.modal({ title: "シール うりば", body, cls: "full kst-panel", onClose: () => { view.open = false; resolve(); } });
  });

  // ---- 1F の うりば（館の 配置に たす）----
  const ZONE = { x: 8, y: 19, w: 7, h: 8 };
  const patch1 = (r) => {
    if (!r || r.zones.some((z) => z.shop === "kd_sticker")) return;
    // うりばに かかる うえきばちを どける
    r.fixtures = r.fixtures.filter((f) => !(f.kind === "planter" && f.x === 13 && f.y === 20));
    r.zones.push({ shop: "kd_sticker", ...ZONE, label: "シール", map: "シール" });
    for (let y = ZONE.y; y < ZONE.y + ZONE.h; y++) for (let x = ZONE.x; x < ZONE.x + ZONE.w; x++) { const row = r.rows[y]; r.rows[y] = row.slice(0, x) + "s" + row.slice(x + 1); }
    const F = (o) => r.fixtures.push({ shop: "kd_sticker", action: "stickers", ...o });
    F({ kind: "stkshelf", x: 8, y: 19, w: 3, h: 1, height: 150, tab: "flake", label: "フレーク シールの たな" });
    F({ kind: "stkshelf", variant: 1, x: 12, y: 19, w: 3, h: 1, height: 150, tab: "tile", label: "タイルと レトロの たな" });
    F({ kind: "stkspin", x: 9, y: 22, w: 1, h: 1, height: 160, tab: "drop", label: "ドロップの くるくる ラック" });
    F({ kind: "stkspin", variant: 1, x: 13, y: 22, w: 1, h: 1, height: 160, tab: "shaka", label: "シャカシャカの くるくる ラック" });
    F({ kind: "stktable", x: 9, y: 24, w: 3, h: 2, height: 72, tab: "puku", label: "ぷくぷく シールの テーブル" });
    F({ kind: "stkcase", x: 13, y: 24, w: 2, h: 1, height: 96, tab: "mat", label: "そざいの ショーケース" });
    r.fixtures.push({ kind: "npc", sp: "rabbit", x: 11, y: 21, w: 1, h: 1, height: 110, label: "シールの てんいんさん", action: "info", outfit: { body: "apron" }, text: "シール うりばへ ようこそ！\nぷくぷく・ドロップ・シャカシャカ・フレーク・タイル。\nそざいの ちがいも みてね。" });
    r.fixtures.push({ kind: "hangsign", x: 8, y: 19, w: 7, h: 1, z: 232, text: "シール うりば", col: "#F7B7CF", over: true, walk: true, fadeOver: true }); // たなの うえ（まえの 什器を かくさない）
    const svc = r.fixtures.find((f) => f.label === "サービス カウンター");
    if (svc && !/シール/.test(svc.text)) svc.text += "\nいりぐちの よこに シール うりばも あるよ。";
  };
  const install = () => {
    const def = typeof VenueHalls !== "undefined" ? VenueHalls.defs.electronics : null;
    if (def && def.floors && def.floors[1]) patch1(def.floors[1]);
    if (typeof KadenHall !== "undefined" && !KadenHall.stickerHook) {
      const prev = KadenHall.interact.bind(KadenHall);
      KadenHall.interact = async (sc, f) => {
        if (f.action !== "stickers") return prev(sc, f);
        sc.busy = true;
        try { Sound.se("tap"); await open(sc, f.tab); } finally { sc.busy = false; }
        return true;
      };
      KadenHall.stickerHook = true;
    }
  };
  install();
  // PokaDebug: うりばの ようす
  const state = () => ({ open: !!(view.open && document.querySelector(".modal-wrap:not(.out) .kst-shop")), tab: view.tab, bought: view.bought, last: view.last, cards: [...document.querySelectorAll(".modal-wrap:not(.out) .kst-card")].map((c) => c.dataset.id) });
  return { KINDS, TABS, LIST, IDS, TILES, PRODUCTS, P_INDEX, count, buy, open, packUrl, view, state, ZONE, patch1 };
})();
