// ガチャガチャ（Meeときょれじゃ の カプセルトイ・UI-12）: 館の 6だいの 台が 6つの シリーズ。
// 1かい 200コインで シリーズの 4しゅの どれかが でる（ふつう 3しゅは 30%ずつ・レア 1しゅは 10%）。ほんものの カプセルトイと おなじく、
// まわす → カプセルが でてくる → タップで あける。けいひんは へやに かざる フィギュア（家具・ほしは ださない）か 服。
// ダブった 服は 50コイン もどる（フィギュアは いくつでも かざれる）。4しゅ そろうと コンプリート。絵は js/gacha-art.js。
// セーブ: Save.d.gacha（plays まわした かず・got { けいひん: でた かず }・done { シリーズ: そろった 日 }）。もちものは Save.d.furn／Save.d.wardrobe。
const Gacha = (() => {
  const PRICE = 200, DUP = 50, RATE = [0.3, 0.3, 0.3, 0.1], RARE = 3;
  // [なまえ, せつめい] … 家具 ／ [なまえ, せつめい, slot, wear, col] … 服
  const SERIES = [
    { id: "friends", name: "なかよし フィギュア", kind: "furn", color: "#F29BB2", caps: ["#F7A9C8", "#FFE07A", "#FFFFFF"], items: [
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
    { id: "sparkle", name: "キラキラ アクセ", kind: "wear", color: "#F2A65E", caps: ["#FFB25B", "#FFFFFF", "#FFE07A"], items: [
      ["ほしの めがね", "おほしさまの かたちの めがね。", "face", "gacha_starglasses", ["#FFD84D"]],
      ["きらきら ペンダント", "みずいろの ほうせきの ペンダント。", "neck", "gacha_pendant", ["#7FD3F0", "#F7C948"]],
      ["ハートの ヘアピン", "ピンクの ハートの ヘアピン。", "head", "gacha_heartclip", ["#FF7BA8"]],
      ["にじいろ ティアラ", "にじいろの ほうせきが ならぶ レアの ティアラ。", "head", "gacha_tiara", ["#E6E9F2"]],
    ] },
  ];
  // けいひん（id: gacha_<シリーズ>_<0〜3>。3 が レア）
  const ITEMS = [];
  SERIES.forEach((S, si) => { S.index = si; S.list = S.items.map((x, k) => { const it = { id: `gacha_${S.id}_${k}`, name: x[0], desc: x[1], kind: S.kind, series: si, k, rare: k === RARE }; if (S.kind === "wear") Object.assign(it, { slot: x[2], wear: x[3], col: x[4] }); ITEMS.push(it); return it; }); });
  const INDEX = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const SIZE = (it) => (it.id === "gacha_friends_3" ? [90, 55, 34] : [50, 55, 30]); // へやでの w h depth（3にん なかよし は ひろい）

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
    // 1かい まわす（200コイン）。でた けいひんを もちものに いれて けっかを かえす。コインが たりなければ null
    spin(si, r = Math.random()) {
      const S = SERIES[si]; if (!S || Save.d.coins < PRICE) return null;
      const k = this.next != null && this.next >= 0 && this.next < 4 ? this.next : roll(r); this.next = null;
      const it = S.list[k], g = st(), first = !got(it.id), was = complete(si);
      Save.d.coins -= PRICE; g.plays++; g.got[it.id] = got(it.id) + 1;
      let refund = 0;
      if (it.kind === "wear") { if (Save.d.wardrobe[it.id]) { refund = DUP; Save.d.coins += DUP; } else Save.d.wardrobe[it.id] = true; }
      else Save.d.furn[it.id] = (Save.d.furn[it.id] || 0) + 1;
      const done = !was && complete(si); if (done) g.done[S.id] = U.today();
      Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
      return { item: it, k, rare: k === RARE, first, refund, complete: done };
    },
    // 絵（ラインナップの カード・けっか）
    pic(it) { return it.kind === "wear" ? Art.iconSvg("wear", it.id) : GachaArt.figure(it.id); },
  };

  // ---- 家具・服を ゲームに いれる ----
  const install = () => {
    for (const it of ITEMS) {
      if (it.kind === "wear") {
        const w = { id: it.id, name: it.name, slot: it.slot, wear: it.wear, col: it.col, price: it.rare ? 800 : 300, rare: it.rare, exclusive: "gacha", gachaPrize: true, st: { sp: it.rare ? 2 : 1 }, desc: it.desc };
        WEAR_ITEMS.push(w); ITEM_INDEX[it.id] = w;
      } else {
        const [w, h, depth] = SIZE(it);
        const f = { id: it.id, name: it.name, price: 0, kind: "floor", w, h, depth, comfort: it.rare ? 6 : 4, rare: it.rare, interactive: true, exclusive: "gacha", gachaPrize: true, sparkle: false, cityItem: { type: "gachafig", variant: it.id }, desc: it.desc };
        FURNITURE.push(f); FURN_INDEX[it.id] = f;
        FURN_ART[it.id] = () => GachaArt.figure(it.id).replace("<svg ", `<svg x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
      }
    }
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
  return new Promise((resolve) => {
    const body = U.el("div", { class: "gacha" });
    let closed = false, busy = false;
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
    const info = () => {
      sideInfo.replaceChildren(
        U.el("div", { class: "gacha-label", text: "ガチャガチャ" }),
        U.el("div", { class: "gacha-price", text: `1かい ${this.PRICE}コイン` }),
        U.el("div", { class: "gacha-coins", text: `もって いる コイン ${U.fmt(Save.d.coins)}` }),
        U.el("div", { class: "gacha-rate", text: "ふつう 3しゅ 30%ずつ・レア 10%" }),
        U.el("div", { class: "gacha-kind", text: S.kind === "wear" ? `でるのは ふく（おなじ ふくは ${this.DUP}コイン もどる）` : "でるのは へやに かざる フィギュア" }),
        ...(this.complete(si) ? [U.el("div", { class: "gacha-done", text: "コンプリート！" })] : []),
      );
      line.replaceChildren(...S.list.map((it) => {
        const n = this.got(it.id), c = U.el("div", { class: "gacha-card" + (it.rare ? " rare" : "") + (n ? " own" : "") });
        c.append(U.el("img", { src: U.svgUrl(this.pic(it)), alt: "" }), U.el("div", { class: "gacha-name", text: it.name }), U.el("div", { class: "gacha-own", text: it.rare ? (n ? `レア・もってる ×${n}` : "レア・まだ") : n ? `もってる ×${n}` : "まだ" }));
        return c;
      }));
    };
    const buttons = () => {
      const can = Save.d.coins >= this.PRICE;
      const go = UI.btn(`${this.PRICE}コインで まわす`, () => spin(), "yellow gacha-go"); go.disabled = !can || busy;
      acts.replaceChildren(go);
      if (!can && !busy) acts.append(U.el("div", { class: "gacha-need", text: "コインが たりないよ" }));
    };
    const spin = async () => {
      if (busy || closed) return;
      const r = this.spin(si); if (!r) { UI.toast("コインが たりないよ"); buttons(); return; }
      busy = true; this.view.phase = "turn"; this.view.last = r; buttons(); result.classList.add("hidden");
      info();
      Sound.se("ok"); knob.classList.remove("turn"); void knob.offsetWidth; knob.classList.add("turn");
      for (let i = 0; i < 3; i++) { Sound.se("gacha_turn"); await this.wait(280); }
      if (closed) return;
      // カプセルが でてくる
      const col = r.rare ? "#F7C948" : S.caps[r.k % S.caps.length];
      cap.innerHTML = GachaArt.capsule(col, 0, "g" + si); cap.classList.remove("hidden", "open", "drop"); void cap.offsetWidth; cap.classList.add("drop"); if (r.rare) cap.classList.add("gold"); else cap.classList.remove("gold");
      Sound.se("gacha_drop"); await this.wait(520);
      if (closed) return;
      // でてきた カプセルを おおきく（タップで あける）
      this.view.phase = "capsule";
      const big = U.el("button", { class: "gacha-bigcap" + (r.rare ? " gold" : ""), "aria-label": "カプセルを あける", html: GachaArt.capsule(col, 0, "b" + si) });
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
      const card = U.el("div", { class: "gacha-prize" + (r.rare ? " rare" : "") });
      card.append(U.el("img", { src: U.svgUrl(this.pic(r.item)), alt: r.item.name }));
      const txt = U.el("div", { class: "gacha-prize-text" });
      txt.append(U.el("div", { class: "gacha-badges", text: [r.rare ? "レア！" : "", r.first ? "NEW" : ""].filter(Boolean).join(" ") }), U.el("b", { text: r.item.name }), U.el("div", { class: "gacha-desc", text: r.item.desc }));
      if (r.refund) txt.append(U.el("div", { class: "gacha-dup", text: `もう もって いる ふく だったので ${r.refund}コイン もどったよ` }));
      txt.append(U.el("div", { class: "gacha-say", text: `${Save.d.chars[who].name}「${line1}」` }));
      card.append(txt);
      result.replaceChildren(card);
      if (r.complete) result.append(U.el("div", { class: "gacha-done big", text: `「${S.name}」 コンプリート！ 4しゅ ぜんぶ そろったよ` }));
      this.view.phase = "done"; busy = false; info(); buttons();
      const go = acts.querySelector(".gacha-go"); if (go) go.textContent = `もう1かい まわす（${this.PRICE}コイン）`;
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
