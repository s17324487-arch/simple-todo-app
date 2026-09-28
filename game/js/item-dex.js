// 家具と服のコレクション。表を毎回読むので、追加アイテムも自動で図鑑に載る。
const ItemDex = {
  PAGE_SIZE: 24,
  REWARD: 100,
  categories: {
    furn: [["all", "すべての かぐ"], ["floor", "おく かぐ"], ["rug", "ラグ"], ["wall", "かべかざり"]],
    wear: [["all", "すべての ふく"], ["head", "あたま"], ["face", "かお"], ["neck", "くび"], ["body", "からだ"], ["back", "せなか"]],
  },
  catalog(kind) {
    const items = kind === "furn" ? FURNITURE : kind === "wear" ? WEAR_ITEMS : [];
    return [...new Map(items.map(it => [it.id, it])).values()];
  },
  owned(kind, d = Save.d) {
    const counts = {};
    if (!d) return counts;
    if (kind === "furn") {
      // furn は設置中も含む総数。古いデータの配置記録は足さず、下限として補う。
      const placed = {};
      const rooms = [d.room, ...Object.entries(d.rooms?.stored || {}).filter(([id]) => id !== d.rooms?.active).map(([, r]) => r)];
      for (const room of rooms) for (const it of room?.items || []) placed[it.id] = (placed[it.id] || 0) + 1;
      for (const it of this.catalog(kind)) counts[it.id] = Math.max(0, Number(d.furn?.[it.id]) || 0, placed[it.id] || 0);
    } else if (kind === "wear") {
      const worn = new Set(Object.values(d.chars || {}).flatMap(c => Object.values(c.outfit || {})));
      // ぱぱ・ままの無料の着せ替えは別の仕組み。同名の服を入手扱いにしない。
      for (const it of this.catalog(kind)) counts[it.id] = d.wardrobe?.[it.id] || worn.has(it.id) ? 1 : 0;
    }
    return counts;
  },
  sync(d = Save.d) {
    if (!d) return false;
    let changed = false;
    if (!d.itemDex) { d.itemDex = { furn: {}, wear: {}, claimed: { furn: {}, wear: {} } }; changed = true; }
    for (const kind of ["furn", "wear"]) {
      if (!d.itemDex[kind]) { d.itemDex[kind] = {}; changed = true; }
      for (const [id, count] of Object.entries(this.owned(kind, d))) {
        if (count > 0 && !d.itemDex[kind][id]) { d.itemDex[kind][id] = true; changed = true; }
      }
    }
    if (!d.itemDex.claimed) { d.itemDex.claimed = { furn: {}, wear: {} }; changed = true; }
    for (const kind of ["furn", "wear"]) if (!d.itemDex.claimed[kind]) { d.itemDex.claimed[kind] = {}; changed = true; }
    return changed;
  },
  entries(kind, d = Save.d) {
    const owned = this.owned(kind, d);
    return this.catalog(kind).map(item => ({
      id: item.id, item, count: owned[item.id] || 0, owned: owned[item.id] > 0,
      seen: !!d?.itemDex?.[kind]?.[item.id] || owned[item.id] > 0,
      source: ItemDexSources.source(kind, item),
    }));
  },
  progress(kind, d = Save.d) {
    const entries = this.entries(kind, d), collected = entries.filter(e => e.seen).length, total = entries.length;
    const milestones = Array.from({ length: Math.floor(total / 10) }, (_, i) => (i + 1) * 10);
    const claimed = milestones.filter(n => !!d?.itemDex?.claimed?.[kind]?.[n]);
    return { collected, total, next: milestones.find(n => n > collected) || null,
      ready: milestones.filter(n => n <= collected && !claimed.includes(n)), claimed };
  },
  claim(kind, threshold) {
    if (!this.categories[kind] || !Number.isInteger(threshold)) return false;
    this.sync();
    if (!this.progress(kind).ready.includes(threshold)) return false;
    const d = Save.d, oldCoins = d.coins, oldEarned = d.stats.coinsEarned;
    d.itemDex.claimed[kind][threshold] = true;
    Save.addCoins(this.REWARD);
    Save.write();
    // 記録とコインを同じセーブへ。保存に失敗したら未受領に戻す。
    let saved;
    try { saved = JSON.parse(localStorage.getItem(Save.KEY)); } catch (e) { /* 下で未受領に戻す */ }
    if (!saved?.itemDex?.claimed?.[kind]?.[threshold] || saved.coins !== d.coins) {
      delete d.itemDex.claimed[kind][threshold]; d.coins = oldCoins; d.stats.coinsEarned = oldEarned; Save.mark();
      return false;
    }
    return true;
  },
  label(kind, item) { return this.categories[kind]?.find(([key]) => key === (kind === "furn" ? item.kind : item.slot))?.[1] || "そのほか"; },
  // 一覧と詳細を同時に開いても SVG の clipPath / gradient の ID がぶつからない。
  svg(kind, id, scope) {
    let svg = Art.iconSvg(kind, id);
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    for (const old of new Set(ids)) {
      const next = `${scope}-${old}`;
      svg = svg.split(`id="${old}"`).join(`id="${next}"`).split(`url(#${old})`).join(`url(#${next})`)
        .split(`href="#${old}"`).join(`href="#${next}"`);
    }
    return svg;
  },
  normalize(text) { return String(text).normalize("NFKC").toLowerCase().replace(/[\s　]/g, "").replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)); },
  render(el, kind) {
    if (!this.categories[kind]) return;
    if (this.sync()) { Save.mark(); Save.write(); }
    const book = U.el("section", { class: "item-dex", "aria-label": kind === "furn" ? "かぐの ずかん" : "ふくの ずかん" });
    const hero = U.el("div", { class: "item-dex-summary" });
    const reward = U.el("div", { class: "item-dex-rewards" });
    const search = U.el("input", { type: "search", class: "item-dex-search", placeholder: "なまえで さがす", "aria-label": "なまえで さがす" });
    const controls = U.el("div", { class: "item-dex-controls" });
    const select = (cls, label, options) => {
      const input = U.el("select", { class: cls, "aria-label": label });
      for (const [value, text] of options) input.append(U.el("option", { value, text }));
      return input;
    };
    const category = select("item-dex-category", "しゅるい", this.categories[kind]);
    const filter = select("item-dex-filter", "あつめた きろく", [["all", "ぜんぶ"], ["seen", "あつめた"], ["missing", "まだ ない"], ["rare", "レア"]]);
    controls.append(category, filter);
    const count = U.el("div", { class: "item-dex-results", "aria-live": "polite" });
    const grid = U.el("div", { class: "item-dex-grid" });
    const pages = U.el("div", { class: "item-dex-pages" });
    let page = 0;
    const drawSummary = () => {
      const p = this.progress(kind);
      hero.replaceChildren(U.el("span", { text: `${kind === "furn" ? "かぐ" : "ふく"}の コレクション` }),
        U.el("strong", { class: "item-dex-total", text: `${p.collected} / ${p.total} しゅ` }));
      const meter = U.el("progress", { max: p.total || 1, value: p.collected, "aria-label": "あつめた しゅるい" });
      hero.append(meter);
      reward.replaceChildren();
      if (p.ready.length) {
        const threshold = p.ready[0];
        const button = UI.btn(`${threshold}しゅの ごほうび　${this.REWARD}コイン`, () => {
          if (this.claim(kind, threshold)) { Sound.se("ok"); UI.updateHud(); UI.toast(`${this.REWARD}コイン もらったよ！`, "good"); }
          else UI.toast("セーブできなかったよ。もういちど ためしてね。");
          drawSummary();
        }, "item-dex-claim yellow");
        button.dataset.threshold = threshold; reward.append(button);
      } else reward.append(U.el("p", { text: p.next ? `つぎの ごほうびは ${p.next}しゅ。10しゅごとに 100コイン！` : p.collected === p.total ? "ぜんぶ そろった！ すてきな コレクションだね。" : "あと すこしで ぜんぶ そろうよ！" }));
    };
    const draw = () => {
      const query = this.normalize(search.value);
      const entries = this.entries(kind).filter(e =>
        (category.value === "all" || (kind === "furn" ? e.item.kind : e.item.slot) === category.value) &&
        (filter.value === "all" || filter.value === "seen" && e.seen || filter.value === "missing" && !e.seen || filter.value === "rare" && e.item.rare) &&
        (!query || this.normalize(e.item.name).includes(query)));
      const last = Math.max(0, Math.ceil(entries.length / this.PAGE_SIZE) - 1);
      page = Math.min(page, last);
      count.textContent = `${entries.length}しゅ　／　${page + 1} / ${last + 1}ページ`;
      grid.replaceChildren(); pages.replaceChildren();
      for (const e of entries.slice(page * this.PAGE_SIZE, (page + 1) * this.PAGE_SIZE)) {
        const card = U.el("button", { type: "button", class: "item-dex-card" + (e.seen ? "" : " unknown") + (e.item.rare ? " rare" : ""), "aria-label": e.seen ? e.item.name : "まだ ない もの・てにいれる ヒント" });
        card.dataset.id = e.id;
        card.append(U.el("span", { class: "item-dex-art", "aria-hidden": "true", html: this.svg(kind, e.id, "dex-list") }),
          U.el("span", { class: "item-dex-name", text: e.seen ? e.item.name : "？？？" }),
          U.el("span", { class: "item-dex-status", text: `${e.item.rare ? "★ レア · " : ""}${e.seen ? "あつめた ✓" : "まだ ない"}` }));
        card.addEventListener("click", () => { Sound.se("tap"); this.detail(kind, e.id); });
        grid.append(card);
      }
      if (!entries.length) grid.append(U.el("p", { class: "item-dex-empty", text: "みつからなかったよ。ことばや しゅるいを かえてみよう。" }));
      if (last > 0) {
        const jump = delta => { page += delta; Sound.se("tap"); draw(); count.scrollIntoView({ block: "start" }); };
        const prev = UI.btn("‹ まえ", () => jump(-1), "item-dex-prev"); prev.disabled = page === 0;
        const next = UI.btn("つぎ ›", () => jump(1), "item-dex-next"); next.disabled = page === last;
        pages.append(prev, U.el("span", { text: `${page + 1} / ${last + 1}` }), next);
      }
    };
    for (const control of [search, category, filter]) control.addEventListener(control === search ? "input" : "change", () => { page = 0; draw(); });
    book.append(hero, reward, search, controls, count, grid, pages,
      U.el("p", { class: "item-dex-footnote", text: "？？？を タップすると てにいれる ヒント。おへやに おいた かぐも きろくに のこるよ。" }));
    el.append(book); drawSummary(); draw();
  },
  detail(kind, id) {
    const e = this.entries(kind).find(entry => entry.id === id);
    if (!e) return;
    const it = e.item, body = U.el("div");
    const stage = U.el("div", { class: "item-dex-preview" + (e.seen ? "" : " unknown") });
    let who = Save.d.order[0], back = it.slot === "back";
    const draw = () => {
      if (kind === "wear" && e.seen) {
        const c = Save.d.chars[who];
        stage.innerHTML = Chara.svg(who, { outfit: { [it.slot]: it.id }, color: c.color, face: "happy", dir: back ? "up" : "down" });
      } else stage.innerHTML = this.svg(kind, id, "dex-detail");
    };
    draw(); body.append(stage);
    if (kind === "wear" && e.seen) {
      const trio = U.el("div", { class: "item-dex-who" });
      for (const charId of Save.d.order) {
        const b = UI.btn("", () => {
          who = charId;
          trio.querySelectorAll("button").forEach(button => { const selected = button.dataset.id === who; button.classList.toggle("on", selected); button.setAttribute("aria-pressed", String(selected)); });
          draw(); Sound.se("tap");
        });
        b.textContent = Save.d.chars[charId].name; b.dataset.id = charId; b.classList.toggle("on", who === charId); b.setAttribute("aria-pressed", String(who === charId)); trio.append(b);
      }
      body.append(trio, UI.btn("まえ・うしろ", () => { back = !back; draw(); Sound.se("tap"); }, "wide item-dex-turn"),
        U.el("p", { class: "item-dex-footnote", text: "ここでは みためを ためせるよ。きている ふくは かわらないよ。" }));
    }
    body.append(U.el("div", { class: "item-dex-detail-tags", text: `${this.label(kind, it)}${it.rare ? "　★ レア" : ""}　${e.seen ? "あつめた ✓" : "まだ ない"}` }));
    if (e.seen && it.desc) body.append(U.el("p", { class: "item-dex-description", text: it.desc }));
    if (e.seen) body.append(U.el("p", { text: kind === "furn" ? `もっている かず：${e.count}こ（おへやの ぶんも ふくむ）` : e.owned ? "みんなで きられる ふくだよ。" : "いちど てにいれた ふくだよ。" }));
    const hint = U.el("div", { class: "item-dex-hint" }, [U.el("b", { text: "てにいれる ヒント" }), U.el("p", { text: e.source })]);
    body.append(hint);
    const m = UI.modal({ title: e.seen ? it.name : "まだ ない もの", body, cls: "item-dex-detail" });
    body.append(UI.btn("ずかんに もどる", () => m.close(), "wide"));
  },
};
