// かせきの ほねを うる（スーパー）と、きふで がいこつが かんせいした ときの そんちょうさんの ひょうしょう（UI-69。オーナーの FB 2026-10-03
// 「採掘した骨も売れるようにして。これは結構、高単価で。ただ、寄贈するインセンティブも残したい。寄贈してひとつの模型が完成すると、町長から表彰されて、お金ももらえるようにして。」）。
// どうぶつの森と おなじ ように、ほった ほねは おみせで たかく うれる。でも はくぶつかんに きふして 1たいの がいこつが かんせいすると、
// まちの そんちょうさん（ネリカスタウンの くまの そんちょう）が おいわいに きて ひょうしょうじょう と その ほねを ぜんぶ うる より おおい コインを くれる。
// ・ほねの ねだん: きょうりゅうの めずらしさ（rarity 1〜4）で 300・500・800・1200コイン。あたまの ほね（skull・head）は 1.5ばい。さかな（30〜2500・まんなか 120）より たかい
// ・ひょうしょうの コイン: その きょうりゅうの ほねを ぜんぶ うった ときの 1.5ばい（100 きざみ）。1たいめ・5たいめ・10たいめは かざる ものも
// ・まえの セーブで もう かんせいして いた ぶんは、つぎに はかせに はなしかけた ときに まとめて もらえる
// セーブ: Save.d.museum.awards（{ きょうりゅう: 日づけ }。たす だけ）。ほねの かずは Save.d.fossil.bones（Fossils.take で へらす）
const FossilSell = {
  RARITY: [300, 300, 500, 800, 1200], // rarity 0〜4（0 は 1 と おなじ）
  HEAD: 1.5,
  price(key) {
    const b = typeof Fossils !== "undefined" ? Fossils.bone(key) : null; if (!b) return 0;
    const base = this.RARITY[U.clamp(Math.round(b.dino.rarity) || 1, 1, 4)];
    return Math.round((base * (/^(skull|head)$/.test(b.part.id) ? this.HEAD : 1)) / 10) * 10;
  },
  // もって いる ほね（データの じゅん）
  held() {
    const own = Save.d.fossil.bones;
    return FOSSIL_DATA.dinos.flatMap((d) => d.art.parts.map((p) => d.id + "." + p.id)).filter((k) => (own[k] || 0) > 0);
  },
  // まだ はくぶつかんに ない ほね（きふすると がいこつに なる）
  needed(key) { return typeof Museum !== "undefined" && !!Museum.data() && !Museum.gaveBone(key); },
  // きふに いる 1こを のこした あまり（もう きふした ほねは ぜんぶ）
  spare(key) { const n = Save.d.fossil.bones[key] || 0; return this.needed(key) ? Math.max(0, n - 1) : n; },
  sellBone(key, n = 1) {
    const m = Math.min(Math.floor(n), Save.d.fossil.bones[key] || 0); if (!(m > 0) || !this.price(key)) return 0;
    Fossils.take(key, m);
    const c = this.price(key) * m; Save.addCoins(c); Save.mark();
    return c;
  },
  // StoreScene.talk の えらぶ ことば（スーパー・ほねを もって いる とき）
  choice(store) { return typeof Fossils !== "undefined" && Fossils.data() && store.shopId === "market" && this.held().length ? "ほねを うる" : null; },
  WARN: "まだ はくぶつかんに ない ほねだよ。\nきふして がいこつが かんせいすると、そんちょうさんから ひょうしょうと おいわいの コインが もらえるよ。\nそれでも うる？",
  open() {
    return new Promise((done) => {
      const body = U.el("div", { class: "fossil-sell" }), list = U.el("div", { class: "fossil-sell-list" }), foot = U.el("div", { class: "fossil-sell-foot" });
      const draw = () => {
        const keys = this.held(); list.replaceChildren(); foot.replaceChildren();
        if (!keys.length) { list.append(U.el("p", { class: "muted", text: "うれる ほねが なくなったよ。" })); return; }
        for (const key of keys) {
          const { dino: d, part: p } = Fossils.bone(key), n = Save.d.fossil.bones[key], need = this.needed(key);
          const row = U.el("div", { class: "fossil-sell-row" + (need ? " need" : "") });
          row.dataset.key = key;
          row.innerHTML = `<span class="ic">${FossilArt.partSvg(d, p.id)}</span><div class="t"><b></b><small></small></div>`;
          row.querySelector("b").textContent = `${d.name}の ${p.name} ×${n}`;
          row.querySelector("small").textContent = `1こ ${U.fmt(this.price(key))}コイン` + (need ? "・はくぶつかんに まだ ない" : "・きふずみ");
          row.append(UI.btn("1こ うる", async () => {
            if (need && n <= 1 && !(await UI.confirm(this.WARN, "うる", "やめる"))) return;
            const c = this.sellBone(key, 1);
            if (c) { Sound.se("coin"); UI.updateHud(); UI.toast(`${d.name}の ${p.name}を うって コイン +${U.fmt(c)}`, "good"); }
            draw();
          }, "small yellow"));
          list.append(row);
        }
        const spare = keys.map((k) => [k, this.spare(k)]).filter(([, m]) => m > 0), total = spare.reduce((a, [k, m]) => a + this.price(k) * m, 0);
        if (spare.length) foot.append(UI.btn(`あまった ほねを ぜんぶ うる（${U.fmt(total)}コイン）`, () => {
          let c = 0; for (const [k, m] of spare) c += this.sellBone(k, m);
          Sound.se("coin"); UI.updateHud(); UI.toast(`あまった ほねを うって コイン +${U.fmt(c)}`, "good"); draw();
        }, "wide"));
        else foot.append(U.el("p", { class: "muted", text: "あまった ほねは ないよ（きふに いる ぶんは のこして あるよ）。" }));
      };
      body.append(U.el("p", { class: "note", text: "ほった ほねを たかく かいとるよ。はくぶつかんに きふして がいこつが かんせいすると、そんちょうさんから ひょうしょうと おいわいの コインが もらえるよ。" }), list, foot);
      draw();
      UI.modal({ title: "ほねを うる", body, onClose: () => { Save.write(); done(); } });
    });
  },
};

const DinoAward = {
  MUL: 1.5,
  // 1たいめ・5たいめ・10たいめ（ぜんぶ）の かざる もの
  GIFTS: [[1, "dino_award_cert"], [5, "dino_award_trophy"], [10, "dino_award_gold"]],
  st() { const m = Save.d.museum; if (!m.awards || typeof m.awards !== "object" || Array.isArray(m.awards)) m.awards = {}; return m.awards; },
  count() { return Object.keys(this.st()).filter((id) => Fossils.dino(id)).length; },
  coins(id) { const d = Fossils.dino(id); if (!d) return 0; const sum = d.art.parts.reduce((a, p) => a + FossilSell.price(d.id + "." + p.id), 0); return Math.round((sum * this.MUL) / 100) * 100; },
  // かんせいして いて まだ ひょうしょうして いない きょうりゅう（データの じゅん）
  pending() { const done = (Save.d.museum || {}).done || {}; return FOSSIL_DATA.dinos.filter((d) => done[d.id] && !this.st()[d.id]).map((d) => d.id); },
  // ひょうしょう する（コイン・かざる もの）。もう して いたら null
  give(id, day = U.today()) {
    const d = Fossils.dino(id); if (!d || this.st()[id]) return null;
    this.st()[id] = String(day);
    const coins = this.coins(id), n = this.count(), gift = (this.GIFTS.find(([k]) => k === n) || [])[1] || null;
    Save.addCoins(coins);
    if (gift && FURN_INDEX[gift]) Save.d.furn[gift] = (Save.d.furn[gift] || 0) + 1;
    Save.mark(); Save.write();
    if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
    return { id, dino: d, coins, n, gift };
  },
  mayor() {
    const n = ((MAP_DEFS.town || {}).npcs || []).find((x) => x.id === "mayor") || { sp: "bear", name: "くまの そんちょう", outfit: { head: "tophat", neck: "bowtie_red" } };
    return { name: n.name || "くまの そんちょう", face: Art.npcSvg({ ...n, emo: "happy" }) };
  },
  names() { return Save.d.order.map((id) => Save.d.chars[id].name).join("・"); },
  // ひょうしょうじょうの カード（えらんだ きょうりゅう・3人の なまえ・もらった もの）
  card(r) {
    return new Promise((done) => {
      const body = U.el("div", { class: "award-card" });
      body.innerHTML = `<div class="award-paper"><div class="award-ttl">ひょうしょうじょう</div><div class="award-to"></div><div class="award-art">${FossilArt.svg(r.dino, { have: r.dino.art.parts.map((p) => p.id) })}</div>`
        + `<div class="award-txt"></div><div class="award-from"><span>ネリカスタウン そんちょう</span><i class="award-seal">そん</i></div></div><div class="award-gift"></div>`;
      body.querySelector(".award-to").textContent = `${this.names()} どの`;
      body.querySelector(".award-txt").textContent = `あなたたちは ほねを あつめて ${r.dino.name}の がいこつを かんせい させました。よって ここに ひょうしょう します。`;
      const g = body.querySelector(".award-gift");
      g.append(U.el("div", { class: "award-coin", text: `おいわい コイン +${U.fmt(r.coins)}` }));
      if (r.gift) g.append(U.el("div", { class: "note", text: `「${FURN_INDEX[r.gift].name}」も もらった！ おうちの「もようがえ」で かざれるよ。` }));
      g.append(U.el("div", { class: "muted", text: `ひょうしょう ${r.n} / ${FOSSIL_DATA.dinos.length}` }));
      let m = null;
      m = UI.modal({ title: "🏅 ひょうしょう", body, closable: false, footer: UI.btn("ありがとう！", () => { Sound.se("ok"); if (m) m.close(); m = null; done(); }, "yellow wide") });
    });
  },
  async present(id) {
    const r = this.give(id); if (!r) return null;
    const m = this.mayor();
    Sound.se("fanfare");
    await UI.say([{ text: "そんちょうさんが おいわいに かけつけて きた！" }, { name: m.name, face: m.face, text: `${r.dino.name}の がいこつ かんせい、おめでとう！\nまちの じまんじゃ。ひょうしょう するぞ！` }]);
    await this.card(r);
    await UI.say([{ name: m.name, face: m.face, text: r.gift ? `おいわいの ${U.fmt(r.coins)}コインと「${FURN_INDEX[r.gift].name}」じゃ。\nおうちに かざって おくれ。` : `おいわいの ${U.fmt(r.coins)}コインじゃ。\nこれからも たのむぞ。` }]);
    return r;
  },
  // ずかんの ヒント（ItemDexSources.source）
  source(id) {
    const g = this.GIFTS.find(([, x]) => x === id); if (!g) return "";
    return `はくぶつかんに ほねを きふして きょうりゅうの がいこつを ${g[0] >= FOSSIL_DATA.dinos.length ? "ぜんぶ（" + g[0] + "たい）" : g[0] + "たい"} かんせい させると、そんちょうさんから もらえるよ。`;
  },
  // まえの セーブで かんせいして いた ぶん（はかせに はなしかけた とき）
  async catchUp() { const out = []; for (const id of this.pending()) { const r = await this.present(id); if (r) out.push(r); } return out; },
};

// ---- かざる もの 3つ（かべの ひょうしょうじょう・ゆかの トロフィー 2つ）----
(() => {
  const K = INK, S = (w = 1.6) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // かわいい ティラノの かげ（viewBox 0 0 60 60・あしもとが y=58）
  const rex = (fill, edge = K) => `<path d="M8,50 C9,40 17,32 28,31 L33,31 C34,23 39,16 47,15 C54,14 58,19 56,25 L50,27 C48,33 45,38 41,42 L43,56 L37,56 L35,46 L27,47 L28,56 L22,56 L21,47 C15,48 10,52 3,55 C5,53 7,52 8,50 Z" fill="${fill}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<circle cx="50" cy="19.5" r="1.7" fill="${K}"/><path d="M41,34 L46,37" stroke="${edge}" stroke-width="2.2" stroke-linecap="round"/><path d="M51,25 L54,24.4" stroke="${edge}" stroke-width="1.2" stroke-linecap="round"/>`;
  const items = [
    { id: "dino_award_cert", name: "そんちょうさんの ひょうしょうじょう", kind: "wall", w: 60, h: 46, comfort: 6, desc: "はじめて がいこつを かんせい させた ときに もらった ひょうしょうじょう。" },
    { id: "dino_award_trophy", name: "きょうりゅう はかせ トロフィー", kind: "floor", w: 40, h: 74, depth: 30, comfort: 8, desc: "がいこつを 5たい かんせい させた しるし。きんいろの ティラノ。" },
    { id: "dino_award_gold", name: "きんの きょうりゅう トロフィー", kind: "floor", w: 56, h: 100, depth: 40, comfort: 12, desc: "10しゅ ぜんぶの がいこつを かんせい させた まちの じまん。" },
  ];
  // かべ: きの がくぶち・クリームの かみ・あかい だいめい・ことばの せん・ティラノ・あかい はんこ・きんの リボン
  const cert = () => `<rect x="1" y="1" width="58" height="44" rx="3" fill="#B98552" ${S(2.4)}/><rect x="3.6" y="3.6" width="52.8" height="38.8" rx="2" fill="#9C6B3E" stroke="none"/>`
    + `<rect x="5" y="5" width="50" height="36" rx="1.5" fill="#FFF8E6" ${S(1.4)}/><rect x="8" y="8" width="44" height="30" fill="none" stroke="#D9B45A" stroke-width="1" stroke-dasharray="2 1.4"/>`
    + `<rect x="19" y="10.4" width="22" height="3.6" rx="1.4" fill="#C2453A"/><path d="M24,18 H45 M24,22.2 H44 M24,26.4 H41" stroke="#8C7A66" stroke-width="1.3" stroke-linecap="round"/>`
    + `<g transform="translate(9 16) scale(0.25)">${rex("#E9D7A8", "#7A6A50")}</g>`
    + `<circle cx="43" cy="32.6" r="4.4" fill="#E25B4E" ${S(1)}/><circle cx="43" cy="32.6" r="2.7" fill="none" stroke="#FFE2DA" stroke-width="0.8"/>`
    + `<path d="M11.4,30 L9,38.6 L11.6,37.4 L13,39.6 L14.2,31 Z M15,30 L17.2,38.6 L14.8,37.4 L13.4,39.6 L12.4,31 Z" fill="#E25B4E" ${S(0.8)}/><circle cx="13" cy="30.2" r="3.4" fill="#F2C94C" ${S(1)}/><circle cx="13" cy="30.2" r="1.4" fill="#FFF3C0"/>`;
  FURN_ART.dino_award_cert = cert;
  // ゆか: きの だい（いし の プレート）と きんの ティラノ
  FurnModels.register("dino_award_trophy", (k) => {
    const { box, at, d } = k, cy = -d / 2;
    let s = k.shadow(0.12, 6, 18) + box(-17, -d + 4, 34, d - 8, 0, 10, ["#8B5E3C", "#6E4A2E", "#A87450"], 1.6) + box(-12, -d + 8, 24, d - 16, 10, 5, ["#E9D7A8", "#CDB98A", "#F6EBCB"], 1.2);
    s += box(-7, -4.5, 14, 0.6, 2.4, 5.2, ["#F2C94C", "#D9A93A", "#FFE08A"], 0.8); // まえの なふだ
    return s + at(0, cy, 15, `<g transform="translate(-26 -52) scale(0.9)">${rex("#F2C94C")}</g>`, 28, 54);
  });
  // ゆか: 2だんの だい・きんの カップ（とって・ティラノの もよう）
  FurnModels.register("dino_award_gold", (k) => {
    const { box, cyl, at, d } = k, cy = -d / 2;
    let s = k.shadow(0.14, 8, 26) + box(-24, -d + 4, 48, d - 8, 0, 12, ["#4E4B7A", "#3B3863", "#6A66A0"], 1.6) + cyl(0, cy, 12, 16, 8, "#3B3863", "#5C5893", 1.4);
    const cup = `<path d="M8,10 C-2,10 -2,30 12,32 M52,10 C62,10 62,30 48,32" fill="none" stroke="${K}" stroke-width="5"/><path d="M8,10 C-2,10 -2,30 12,32 M52,10 C62,10 62,30 48,32" fill="none" stroke="#E0A82E" stroke-width="2.6"/>`
      + `<path d="M8,4 H52 L47,34 C44,44 16,44 13,34 Z" fill="#FFD966" ${S(2.4)}/><path d="M14,9 L17,30" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity="0.55"/>`
      + `<g transform="translate(18 12) scale(0.42)">${rex("#E0A82E", "#9C6B1E")}</g>`
      + `<rect x="25" y="42" width="10" height="10" fill="#E0A82E" ${S(2)}/><path d="M16,52 H44 L47,60 H13 Z" fill="#E0A82E" ${S(2.2)}/>`;
    return s + at(0, cy, 20, `<g transform="translate(-30 -60)">${cup}</g>`, 32, 62);
  });
  for (const it of items) {
    const f = { ...it, price: 0, rare: true, exclusive: "museum", dinoAward: true }; // exclusive: かぐやさんに ならべない（ikebukuro-catalog.js）
    FURNITURE.push(f); FURN_INDEX[f.id] = f;
    if (f.kind === "floor") FURN_ART[f.id] = () => HomeDesign.model(f.id).full;
  }
})();
