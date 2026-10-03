// シールの ガチャ と シールちょう（Meeときょれじゃ 4F・UI-53。オーナーの FB 2026-10-02「シールが出るタイプのガチャガチャ3台」）。
// ・ほんものの シールの カプセルトイの ように、1かい まわすと シールが 4まい はいった シートが 1まい でる。シートは 1台に 4しゅ（ふつう 3しゅ 30%ずつ・レア 10%・
//   あける まで わからない。しくみは js/gacha.js と おなじ）。1かい 100コイン。Gacha.add で 30〜32 ばんの シリーズ（kind: "sticker"）に たす。
// ・シールは 3しゅの てざわり: ぷっくり（3人の かお・ハート・おほしさま）・ふわふわ（どうぶつ）・うるうる（おかし）。ぜんぶで 18しゅ（レアの シートにだけ でる シールが 3しゅ）。
// ・すまほの「シール」アプリが シールちょう（ページ 6まい・はがせる かみ 6しゅ）。したの シールを タップで はる → ゆびで うごかす・まわす・おおきさ・はがす（てもとに もどる）。
// ・4F の きたの かべ（もりの ひろばの き の あいだ・x 16〜18。きりかぶの ベンチは その ひがし）に 3台。絵は js/sticker-art.js。
// ・セーブ: Save.d.stickers（have { シール: てもとの まい数 }・got { シール: これまでに もらった まい数 }・pages [{ bg: かみ, s: [[シール, x, y, まわす, おおきさ], …] }]）。シートの でた かずは Save.d.gacha.got。
// ・UI-57: ネリカス でんきの シール うりば（js/kaden-stickers.js）の シールは しゅるい kind（ぷくぷく・ドロップ・シャカシャカ・フレーク・タイル・そざい）と うごき fx を もつ:
//   squish（マシュマロ: タップで ふにっ）・jelly（ドロップ: ぷるん）・shaka（なかみの 4まいを かさねて、ゆびで うごかすと ラメが まう）・tile（えらんで「きる」で 9まいに）。
//   したの ならびは しゅるいごとに まとめる（たての ふだ）。セーブの かたちは おなじ（タイルを きると ページの 1まいが 9まいに なる）。
const StickerBook = (() => {
  const PRICE = 100, PAGES = 6, PER = 24, PW = 300, PH = 360, BASE = 64, CAP = 99, TURN = 15;
  const SIZES = [0.6, 0.8, 1, 1.25, 1.5], MID = 2;
  // [id, なまえ, シリーズ, レア]
  const DESIGNS = [
    ["stk_wanko", "わんこ", 0], ["stk_gachan", "がちゃん", 0], ["stk_goji", "ごじ", 0], ["stk_heart", "ハート", 0], ["stk_star", "おほしさま", 0], ["stk_trio", "なかよし 3にん", 0, 1],
    ["stk_cat", "ねこ", 1], ["stk_rabbit", "うさぎ", 1], ["stk_bear", "くま", 1], ["stk_panda", "パンダ", 1], ["stk_chick", "ひよこ", 1], ["stk_unicorn", "ユニコーン", 1, 1],
    ["stk_strawberry", "いちご", 2], ["stk_icecream", "アイス", 2], ["stk_candy", "キャンディ", 2], ["stk_donut", "ドーナツ", 2], ["stk_macaron", "マカロン", 2], ["stk_parfait", "にじいろ パフェ", 2, 1],
  ].map(([id, name, series, rare]) => ({ id, name, series, rare: !!rare }));
  const INDEX = Object.fromEntries(DESIGNS.map((d) => [d.id, d]));
  // ほかの ところで でる シールを たす（ネリカスタウンの コンビニの いちばんくじ・js/ichiban-kuji.js）: [{ id, name, series, hint, art }]。
  // series は みせの id（ガチャの 3シリーズは 0〜2 の かず）・hint は まだ でて いない シールを タップした ときの ことば・art は 100×100 の 絵
  const addDesigns = (list) => {
    for (const d of list) {
      if (!d || !d.id || INDEX[d.id]) continue;
      const x = { id: d.id, name: d.name, series: d.series, rare: !!d.rare, hint: d.hint || "", kind: d.kind || null, fx: d.fx || null, size: Number.isInteger(d.size) ? d.size : null, cut: d.cut || null, layers: typeof d.layers === "function" ? d.layers : null, tip: d.tip || "" };
      DESIGNS.push(x); INDEX[d.id] = x; if (typeof d.art === "function") StickerArt.FIG[d.id] = d.art;
    }
  };
  // シリーズ（ガチャの 台）。items: [なまえ, せつめい, [[シール, まい数], …]]（4まい・3 が レア）。paper: シートの だいしの いろ
  const SERIES = [
    { id: "stkpuku", name: "ぷっくり シール", kind: "sticker", sticker: true, price: PRICE, color: "#F7A9C8", caps: ["#FBD3E6", "#FFFFFF", "#BFE6F7"], paper: ["#EAF6FC", "#FFF8DC", "#F1ECFA", "#FFE9F1"], items: [
      ["わんこの シート", "わんこ 2まいと ハート・おほしさまの ぷっくり シール。", [["stk_wanko", 2], ["stk_heart", 1], ["stk_star", 1]]],
      ["がちゃんの シート", "がちゃん 2まいと ハート・おほしさまの ぷっくり シール。", [["stk_gachan", 2], ["stk_heart", 1], ["stk_star", 1]]],
      ["ごじの シート", "ごじ 2まいと ハート・おほしさまの ぷっくり シール。", [["stk_goji", 2], ["stk_heart", 1], ["stk_star", 1]]],
      ["なかよしの シート", "レアの「なかよし 3にん」と わんこ・がちゃん・ごじの シール。", [["stk_trio", 1], ["stk_wanko", 1], ["stk_gachan", 1], ["stk_goji", 1]]],
    ] },
    { id: "stkfuwa", name: "ふわふわ シール", kind: "sticker", sticker: true, price: PRICE, color: "#B9DCA0", caps: ["#E4F4DC", "#FFFFFF", "#FFE7C7"], paper: ["#FFF3E4", "#FFEFF4", "#F6EEE2", "#F1ECFA"], items: [
      ["ねこの シート", "ねこ 2まいと パンダ・ひよこの ふわふわ シール。", [["stk_cat", 2], ["stk_panda", 1], ["stk_chick", 1]]],
      ["うさぎの シート", "うさぎ 2まいと ひよこ・パンダの ふわふわ シール。", [["stk_rabbit", 2], ["stk_chick", 1], ["stk_panda", 1]]],
      ["くまの シート", "くま 2まいと パンダ・ひよこの ふわふわ シール。", [["stk_bear", 2], ["stk_panda", 1], ["stk_chick", 1]]],
      ["ユニコーンの シート", "レアの「ユニコーン」と ねこ・うさぎ・くまの シール。", [["stk_unicorn", 1], ["stk_cat", 1], ["stk_rabbit", 1], ["stk_bear", 1]]],
    ] },
    { id: "stkuru", name: "うるうる シール", kind: "sticker", sticker: true, price: PRICE, color: "#A6DCF2", caps: ["#DDF1FB", "#FFFFFF", "#FFE680"], paper: ["#FFEFF2", "#FFF7E6", "#FFF0E0", "#EAF6FC"], items: [
      ["いちごの シート", "いちご 2まいと キャンディ・マカロンの うるうる シール。", [["stk_strawberry", 2], ["stk_candy", 1], ["stk_macaron", 1]]],
      ["アイスの シート", "アイス 2まいと キャンディ・マカロンの うるうる シール。", [["stk_icecream", 2], ["stk_candy", 1], ["stk_macaron", 1]]],
      ["ドーナツの シート", "ドーナツ 2まいと キャンディ・マカロンの うるうる シール。", [["stk_donut", 2], ["stk_candy", 1], ["stk_macaron", 1]]],
      ["パフェの シート", "レアの「にじいろ パフェ」と いちご・アイス・ドーナツの シール。", [["stk_parfait", 1], ["stk_strawberry", 1], ["stk_icecream", 1], ["stk_donut", 1]]],
    ] },
  ];
  const first = Gacha.SERIES.length;
  Gacha.add(SERIES);
  SERIES.forEach((S) => S.list.forEach((it, k) => { it.stickers = S.items[k][2]; GachaArt.FIG[it.id] = () => StickerArt.sheet(it, S.paper[k], it.rare); }));
  const isSticker = (si) => { const S = Gacha.SERIES[si]; return !!(S && S.kind === "sticker"); };

  // ---- セーブ ----
  const int = (v, a, b) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.round(+v))) : null);
  const turn = (v) => { const n = Math.round(+v / TURN) * TURN; return Number.isFinite(n) ? (((n % 360) + 540) % 360) - 180 : 0; };
  const counts = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([id, n]) => INDEX[id] && int(n, 0, 999) > 0).map(([id, n]) => [id, int(n, 0, 999)]));
  // こわれた セーブでも うごく ように なおす（しらない シール・はんいの そとの かずは すてる）
  const clean = (d) => {
    const pages = Array.from({ length: PAGES }, (_, i) => {
      const p = Array.isArray(d.pages) ? d.pages[i] : null, bg = p && int(p.bg, 0, StickerArt.PAPERS.length - 1);
      const s = (p && Array.isArray(p.s) ? p.s : []).filter((x) => Array.isArray(x) && INDEX[x[0]]).map((x) => [x[0], int(x[1], 0, PW), int(x[2], 0, PH), turn(x[3]), int(x[4], 0, SIZES.length - 1)]).filter((x) => x.every((v) => v !== null)).slice(0, PER);
      return { bg: bg === null || bg === undefined ? i % StickerArt.PAPERS.length : bg, s };
    });
    return { have: counts(d.have), got: counts(d.got), pages };
  };
  const ok = new WeakSet();
  const st = () => {
    let d = Save.d.stickers;
    if (!d || typeof d !== "object" || !ok.has(d)) { d = Save.d.stickers = clean(d && typeof d === "object" ? d : {}); ok.add(d); }
    return d;
  };
  const have = (id) => st().have[id] || 0;
  const got = (id) => st().got[id] || 0;
  const placed = (id) => st().pages.reduce((n, p) => n + p.s.filter((x) => x[0] === id).length, 0);
  // シールを もらう（ガチャの シート・PokaDebug）。ことばを かえす
  const add = (id, n = 1) => { if (!INDEX[id] || !(n > 0)) return false; const s = st(); s.have[id] = Math.min(CAP, have(id) + Math.floor(n)); s.got[id] = Math.min(999, got(id) + Math.floor(n)); return true; };
  const give = (it) => {
    const fresh = [], s0 = st(); let n = 0;
    for (const [id, k] of it.stickers || []) { if (!INDEX[id]) continue; if (!(s0.got[id] > 0) && !fresh.includes(id)) fresh.push(id); add(id, k); n += k; }
    return `シールが ${n}まい ふえたよ。` + (fresh.length ? `あたらしい シール: ${fresh.map((id) => INDEX[id].name).join("・")}。` : "") + "すまほの「シール」で はれるよ";
  };
  Gacha.GIVE.sticker = give;
  // ---- はる・うごかす・まわす・おおきさ・はがす（ページ p の i ばんめ）----
  const page = (p) => st().pages[Math.max(0, Math.min(PAGES - 1, p | 0))];
  const put = (p, id, x = PW / 2, y = PH / 2) => {
    const pg = page(p); if (!INDEX[id]) return -1;
    if (have(id) <= 0) return -2;
    if (pg.s.length >= PER) return -3;
    st().have[id]--; if (!st().have[id]) delete st().have[id];
    const z = INDEX[id].size; pg.s.push([id, int(x, 0, PW), int(y, 0, PH), 0, z === null || z === undefined ? MID : Math.max(0, Math.min(SIZES.length - 1, z))]); return pg.s.length - 1;
  };
  const move = (p, i, x, y) => { const it = page(p).s[i]; if (!it) return false; it[1] = int(x, 0, PW); it[2] = int(y, 0, PH); return true; };
  const rotate = (p, i, d) => { const it = page(p).s[i]; if (!it) return false; it[3] = turn(it[3] + d * TURN); return true; };
  const resize = (p, i, d) => { const it = page(p).s[i]; if (!it) return false; const z = Math.max(0, Math.min(SIZES.length - 1, it[4] + d)); if (z === it[4]) return false; it[4] = z; return true; };
  const front = (p, i) => { const s = page(p).s; if (!s[i]) return -1; s.push(s.splice(i, 1)[0]); return s.length - 1; };
  const peel = (p, i) => { const s = page(p).s, it = s[i]; if (!it) return false; s.splice(i, 1); const h = st().have; h[it[0]] = Math.min(CAP, (h[it[0]] || 0) + 1); return true; };
  const paperNext = (p) => { const pg = page(p); pg.bg = (pg.bg + 1) % StickerArt.PAPERS.length; return pg.bg; };
  // タイルの シートを はさみで きる: ページの その 1まいを、シートの ならびの まま 9まい（cut.into）に わける。きった タイルは もらった ことに なる
  const cutTile = (p, i) => {
    const pg = page(p), it = pg.s[i], d = it && INDEX[it[0]];
    if (!d || !d.cut || !Array.isArray(d.cut.into)) return -1;
    const into = d.cut.into.filter((id) => INDEX[id]), cols = d.cut.cols || 3, rows = Math.ceil(into.length / cols);
    if (pg.s.length - 1 + into.length > PER) return -3;
    const step = (BASE * SIZES[it[4]] * 0.36), a = (it[3] * Math.PI) / 180, z = Number.isInteger(d.cut.size) ? d.cut.size : 0;
    pg.s.splice(i, 1);
    into.forEach((id, k) => {
      const gx = (k % cols) - (cols - 1) / 2, gy = Math.floor(k / cols) - (rows - 1) / 2;
      pg.s.push([id, int(it[1] + (gx * Math.cos(a) - gy * Math.sin(a)) * step, 0, PW), int(it[2] + (gx * Math.sin(a) + gy * Math.cos(a)) * step, 0, PH), it[3], z]);
      st().got[id] = Math.min(999, got(id) + 1);
    });
    return pg.s.length - into.length;
  };
  // したの ならびの まとまり（ガチャ・くじ・ネリカス でんきの しゅるい）
  const GROUPS = [["gacha", "ガチャ"], ["kuji", "くじ"], ["puku", "ぷくぷく"], ["drop", "ドロップ"], ["shaka", "シャカシャカ"], ["flake", "フレーク"], ["tile", "タイル"], ["mat", "そざい"]];
  const groupOf = (d) => (typeof d.series === "number" ? "gacha" : d.kind || "kuji");
  const grouped = () => GROUPS.map(([k, name]) => ({ k, name, list: DESIGNS.filter((d) => groupOf(d) === k) })).filter((g) => g.list.length);

  // ---- 4F（ガチャガチャの もり）の きたの かべに 3台 ----
  const IDX = SERIES.map((S) => S.index);
  const patch4 = (r) => {
    if (!r || r.fixtures.some((f) => f.kind === "gacha" && isSticker(f.series))) return;
    IDX.forEach((si, i) => r.fixtures.push({ kind: "gacha", x: 16 + i, y: 0, w: 1, h: 1, dir: "y", variant: si, series: si, height: 112, label: i === 0 ? "シールの ガチャ" : "", action: "gacha", spots: [[16 + i, 1]] }));
    r.zones.push({ x: 15, y: 0, w: 4, h: 3, shop: "arcForestSticker", label: "シールの ガチャ", map: "シール" }); // みぎの 20〜25 は クレーン 3台（js/gacha-forest.js）
    r.walls.north.push({ kind: "sign", from: 15.2, to: 18.8, z: 158, text: "シール 100コイン", col: "#FFD9E6" }); // き の はっぱ（z 180 より うえ）に かくれない ように 台の すぐ うえ
    const dir = r.fixtures.find((f) => f.kind === "directory");
    if (dir && !/シール/.test(dir.text)) dir.text = dir.text.replace("\nガチャは 1かい 200コイン。", "\nシールの ガチャ（きたの かべ）: 1かい 100コイン・シールちょうに はれる\nほかの ガチャは 1かい 200コイン。");
  };
  const install = () => {
    const def = typeof VenueHalls !== "undefined" ? VenueHalls.defs.arcade : null;
    if (def && def.floors && def.floors[4]) patch4(def.floors[4]);
    if (typeof MallArt !== "undefined") MallArt.SHOP.arcForestSticker = { name: "シール", c: ["#FFE3EE", "#F7B7CF", "#E58CB0"] };
    if (def && def.floors && def.floors[1]) { const d1 = def.floors[1].fixtures.find((f) => f.kind === "directory"); if (d1) d1.text = d1.text.replace("（ガチャ 18だい", "（ガチャ 18だい・シールの ガチャ 3だい"); }
  };
  install();

  // ---- すまほの「シール」アプリ（シールちょう）----
  const URLS = {};
  const url = (id) => URLS[id] || (URLS[id] = U.svgUrl(StickerArt.piece(id)));
  const PAPER_URLS = {};
  const paperUrl = (n) => PAPER_URLS[n] || (PAPER_URLS[n] = U.svgUrl(StickerArt.paper(n)));
  // シャカシャカの 4まい（base・rest・up・top）。シール 1しゅに 4つ まで
  const LAYER_URLS = {};
  const layerUrl = (id, k) => { const key = id + ":" + k; if (!LAYER_URLS[key]) { const L = INDEX[id] && INDEX[id].layers ? INDEX[id].layers() : null; LAYER_URLS[key] = L && L[k] ? U.svgUrl(L[k]) : url(id); } return LAYER_URLS[key]; };
  const ui = { page: 0, sel: -1, fit: null, shake: 0, tips: {} }; // ひらいて いる ページ・えらんで いる シール（PokaDebug.stickerUi）・がめんの おおきさが かわった ときの しらせ・シャカシャカした かず・いちど だした ひとこと
  const phoneView = (el) => {
    const s = st(); ui.sel = -1;
    const book = U.el("div", { class: "stk-book" });
    const top = U.el("div", { class: "stk-top" });
    const prev = UI.btn("‹", () => go(-1), "small stk-nav"), next = UI.btn("›", () => go(1), "small stk-nav"), no = U.el("div", { class: "stk-no" });
    prev.setAttribute("aria-label", "まえの ページ"); next.setAttribute("aria-label", "つぎの ページ");
    const pap = UI.btn("かみを かえる", () => { paperNext(ui.page); Sound.se("tap"); Save.write(); draw(); }, "small stk-paper");
    top.append(prev, no, next, pap);
    const stage = U.el("div", { class: "stk-stage" }), pg = U.el("div", { class: "stk-page", role: "img" });
    stage.append(pg);
    const tools = U.el("div", { class: "stk-tools" }), tray = U.el("div", { class: "stk-tray" });
    book.append(top, stage, tools, tray);
    el.append(book);
    const go = (d) => { const p = Math.max(0, Math.min(PAGES - 1, ui.page + d)); if (p === ui.page) return; ui.page = p; ui.sel = -1; Sound.se("tap"); draw(); };
    const cur = () => page(ui.page);
    // ページの シール（ばしょ・おおきさは ページに たいする わりあい。ページの おおきさが かわっても おなじ ところ）
    const style = (im, it) => { im.style.left = `${(it[1] / PW) * 100}%`; im.style.top = `${(it[2] / PH) * 100}%`; im.style.width = `${((BASE * SIZES[it[4]]) / PW) * 100}%`; im.style.transform = `translate(-50%, -50%) rotate(${it[3]}deg)`; };
    const drawPage = () => {
      const P = cur(), k = P.bg % StickerArt.PAPERS.length;
      pg.style.backgroundImage = `url("${paperUrl(k)}")`; pg.dataset.page = ui.page; pg.setAttribute("aria-label", `シールちょう ${ui.page + 1}ページ（${StickerArt.PAPERS[k].name}の かみ）`);
      pg.replaceChildren(...P.s.map((it, i) => {
        const d = INDEX[it[0]], cls = "stk-on" + (i === ui.sel ? " sel" : "") + (d.fx ? " fx-" + d.fx : "");
        let im;
        // シャカシャカ: わく・みず（base）→ したに たまった なかみ（rest）→ うかんだ なかみ（up・ふだんは みえない）→ ドームの ひかり（top）
        if (d.fx === "shaka" && d.layers) { im = U.el("div", { class: cls + " stk-shaka", role: "img", "aria-label": d.name }); for (const k of ["base", "rest", "up", "top"]) im.append(U.el("img", { class: "stk-shk-" + k, src: layerUrl(d.id, k), alt: "", draggable: "false" })); }
        else im = U.el("img", { class: cls, src: url(it[0]), alt: d.name, draggable: "false" });
        im.dataset.i = i; im.dataset.id = it[0]; style(im, it); return im;
      }));
      no.textContent = `${ui.page + 1} / ${PAGES}`; prev.disabled = ui.page <= 0; next.disabled = ui.page >= PAGES - 1;
    };
    const tool = (label, aria, fn) => { const b = UI.btn(label, () => { if (ui.sel < 0) return; if (fn() !== false) { Sound.se("tap"); Save.write(); draw(); } }, "small stk-tool"); b.setAttribute("aria-label", aria); return b; };
    const drawTools = () => {
      const total = DESIGNS.reduce((n, d) => n + got(d.id), 0);
      if (ui.sel >= 0 && cur().s[ui.sel]) {
        const peelB = UI.btn("はがす", () => { const id = cur().s[ui.sel][0]; peel(ui.page, ui.sel); ui.sel = -1; Sound.se("sticker_peel"); Save.write(); draw(); UI.toast(`${INDEX[id].name}の シールを はがしたよ`); }, "small stk-tool pink");
        peelB.setAttribute("aria-label", "はがす");
        const extra = [], d = INDEX[cur().s[ui.sel][0]];
        // タイルの シート: はさみで 9まいに きる
        if (d.cut) { const cutB = UI.btn("きる", () => { const r = cutTile(ui.page, ui.sel); if (r === -3) { UI.toast("この ページは いっぱい。すこし はがしてから きろう"); return; } if (r < 0) return; ui.sel = -1; Sound.se("sticker_snip"); Save.write(); draw(); UI.toast("チョキチョキ！ タイルが " + d.cut.into.length + "まいに なったよ"); }, "small stk-tool pink"); cutB.setAttribute("aria-label", "はさみで きる"); extra.push(cutB); }
        tools.replaceChildren(tool("↺", "ひだりに まわす", () => rotate(ui.page, ui.sel, -1)), tool("↻", "みぎに まわす", () => rotate(ui.page, ui.sel, 1)), tool("－", "ちいさく", () => resize(ui.page, ui.sel, -1)), tool("＋", "おおきく", () => resize(ui.page, ui.sel, 1)), ...extra, peelB);
      } else tools.replaceChildren(U.el("div", { class: "stk-hint", text: total ? "したの シールを タップして はろう。はった シールは ゆびで うごかせるよ" : "シールが まだ ないよ。Meeときょれじゃ 4F の シールの ガチャ・コンビニの いちばんくじ・ネリカス でんきの シール うりばで あつめよう！" }));
    };
    const drawTray = () => {
      const keep = tray.scrollLeft, kids = [];
      // しゅるいごとに まとめる（たての ふだ「ガチャ」「くじ」「ぷくぷく」…）
      for (const g of grouped()) { const h = U.el("div", { class: "stk-grp" + (g.name.length >= 5 ? " long" : ""), text: g.name }); h.setAttribute("aria-hidden", "true"); kids.push(h, ...g.list.map(slot)); }
      tray.replaceChildren(...kids);
      tray.scrollLeft = keep;
    };
    const slot = (d) => {
      const n = have(d.id), g = got(d.id), b = U.el("button", { class: "stk-slot" + (n ? "" : g ? " out" : " none"), "aria-label": g ? `${d.name} ${n}まい` : "まだ ない シール" });
      b.dataset.id = d.id;
      b.append(U.el("img", { src: url(d.id), alt: "", draggable: "false" }), U.el("span", { class: "stk-n", text: g ? `×${n}` : "？" }));
      b.addEventListener("click", () => {
        if (!g) { UI.toast(d.hint || "まだ でて いない シールだよ。4F の シールの ガチャで でるよ"); return; }
        const i = put(ui.page, d.id, PW / 2 + ((cur().s.length * 23) % 90) - 45, PH / 2 + ((cur().s.length * 37) % 110) - 55);
        if (i === -2) { UI.toast(`${d.name}の シールは ぜんぶ はって あるよ`); return; }
        if (i === -3) { UI.toast("この ページは いっぱい。つぎの ページに はろう"); return; }
        ui.sel = i; Sound.se("sticker_put"); Save.write(); draw();
        // とくべつな シールは はじめて はった ときに ひとこと
        const tk = d.fx || (d.kind === "mat" ? d.id : null); if (d.tip && tk && !ui.tips[tk]) { ui.tips[tk] = 1; UI.toast(d.tip); }
      });
      return b;
    };
    const draw = () => { drawPage(); drawTools(); drawTray(); };
    // ゆびで うごかす（さわった シールは いちばん うえに）
    let drag = null;
    const at = (e) => { const R = pg.getBoundingClientRect(); return [((e.clientX - R.left) / R.width) * PW, ((e.clientY - R.top) / R.height) * PH]; };
    pg.addEventListener("pointerdown", (e) => {
      const t = e.target.closest(".stk-on");
      if (!t) { if (ui.sel >= 0) { ui.sel = -1; drawPage(); drawTools(); } return; }
      e.preventDefault();
      const i = front(ui.page, +t.dataset.i), it = cur().s[i], [px, py] = at(e);
      ui.sel = i; drawPage(); drawTools();
      drag = { id: e.pointerId, dx: it[1] - px, dy: it[2] - py, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, im: pg.querySelector(`.stk-on[data-i="${i}"]`) };
      try { pg.setPointerCapture(e.pointerId); } catch (err) {}
      const fx = INDEX[it[0]].fx;
      if (fx === "squish" || fx === "jelly") poke(drag.im, fx);
      else if (fx === "shaka") shake(drag.im, 0, 8);
    });
    // マシュマロは ふにっ・ドロップは ぷるん（CSS の scale の アニメーション）
    const poke = (el, fx) => { if (!el) return; const c = fx === "squish" ? "squish" : "jelly"; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); Sound.se(fx === "squish" ? "sticker_puni" : "sticker_pururu"); };
    // シャカシャカ: うごかした むきの はんたいへ なかみが ゆれて うかぶ。とまると したへ しずむ（CSS の transition）
    let shakeT = 0, shakeSnd = -1e9;
    const shake = (el, vx, vy) => {
      if (!el || !el.classList.contains("stk-shaka")) return;
      const k = 0.5, sx = Math.max(-5, Math.min(5, -vx * k)), sy = Math.max(-5, Math.min(5, -vy * k));
      el.style.setProperty("--sx", sx.toFixed(1) + "%"); el.style.setProperty("--sy", sy.toFixed(1) + "%"); el.style.setProperty("--sr", Math.round(sx * 3) + "deg");
      el.classList.add("shake"); ui.shake++;
      clearTimeout(shakeT); shakeT = setTimeout(() => el.classList.remove("shake"), 280);
      const now = performance.now(); if (now - shakeSnd > 240) { shakeSnd = now; Sound.se("sticker_shaka"); }
    };
    pg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 4) return;
      drag.moved = true; const [px, py] = at(e), it = cur().s[ui.sel], vx = e.clientX - drag.lx, vy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
      if (it) { move(ui.page, ui.sel, px + drag.dx, py + drag.dy); style(drag.im, it); if (INDEX[it[0]].fx === "shaka") shake(drag.im, vx, vy); }
    });
    const end = (e) => { if (!drag || e.pointerId !== drag.id) return; const m = drag.moved; drag = null; if (m) { Sound.se("sticker_put"); Save.write(); } };
    pg.addEventListener("pointerup", end); pg.addEventListener("pointercancel", end);
    // ページの おおきさ（たて 360・よこ 300 の わりあいの まま、あいて いる ところに いっぱい）
    const fit = () => {
      if (!pg.isConnected) { removeEventListener("resize", fit); if (ui.fit === fit) ui.fit = null; return; }
      const w = stage.clientWidth, h = stage.clientHeight, k = Math.max(0.3, Math.min(w / PW, h / PH));
      pg.style.width = `${Math.floor(PW * k)}px`; pg.style.height = `${Math.floor(PH * k)}px`;
    };
    if (ui.fit) removeEventListener("resize", ui.fit); // まえに ひらいた ときの しらせは けす
    ui.fit = fit; addEventListener("resize", fit);
    draw(); fit(); requestAnimationFrame(fit);
  };

  return { PRICE, PAGES, PER, PW, PH, BASE, CAP, TURN, SIZES, DESIGNS, INDEX, SERIES, first, IDX, isSticker, addDesigns, clean, st, have, got, placed, add, give, page, put, move, rotate, resize, front, peel, paperNext, cutTile, GROUPS, groupOf, grouped, patch4, ui, phoneView, url, layerUrl };
})();

// ---- こうかおん（ぺたっ・ぺりっ）----
Object.assign(CraneSE, {
  sticker_put: (S, T, N) => { N({ dur: 0.03, vol: 0.12, freq: 1800, q: 1.4 }); T({ f: 520, f2: 760, dur: 0.07, type: "sine", vol: 0.12 }); },
  sticker_peel: (S, T, N) => { N({ dur: 0.12, vol: 0.14, freq: 3200, q: 0.8 }); T({ f: 900, f2: 420, dur: 0.1, type: "triangle", vol: 0.06 }); },
  // UI-57: マシュマロ（ふにっ）・ドロップ（ぷるん）・シャカシャカ（ラメの おと）・タイルを きる（チョキン）
  sticker_puni: (S, T) => { T({ f: 320, f2: 180, dur: 0.12, type: "sine", vol: 0.13 }); T({ f: 260, f2: 340, dur: 0.1, type: "sine", vol: 0.07 }); },
  sticker_pururu: (S, T) => { T({ f: 660, f2: 520, dur: 0.08, type: "sine", vol: 0.08 }); T({ f: 560, f2: 700, dur: 0.12, type: "sine", vol: 0.06 }); },
  sticker_shaka: (S, T, N) => { N({ dur: 0.06, vol: 0.09, freq: 6200, q: 1.2 }); N({ dur: 0.05, vol: 0.06, freq: 4800, q: 1.4 }); },
  sticker_snip: (S, T, N) => { N({ dur: 0.04, vol: 0.14, freq: 2600, q: 2 }); T({ f: 1400, f2: 900, dur: 0.05, type: "square", vol: 0.04 }); },
});
