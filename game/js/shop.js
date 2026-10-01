// 買い物のお店（ようふくや・かぐや・スーパー）
const BUY_SHOPS = {
  clothes: {
    name: "ようふくやさん", keeper: { sp: "sheep", outfit: { face: "glasses", neck: "scarf_red" } }, keeperName: "てんちょうの メリー",
    hello: ["いらっしゃいませ メェ〜。", "きょうは どんな おしゃれに する？"],
    tabs: [["head", "あたま"], ["face", "かお"], ["neck", "くび"], ["body", "ふく"], ["back", "せなか"]],
    items: (tab) => WEAR_ITEMS.filter((w) => w.slot === tab && !w.rare && w.price > 0),
  },
  furniture: {
    name: "かぐやさん", keeper: { sp: "bear", col: "#8D6E63", outfit: { head: "helmet", body: "overalls" } }, keeperName: "だいくの クマゴロウ",
    hello: ["へい らっしゃい！", "おうちを すてきに もようがえ しようぜ！"],
    tabs: [["floor", "かぐ"], ["wall", "かべかざり"], ["wp", "かべがみ"], ["fl", "ゆか"]],
    items: (tab) => tab === "floor" ? FURNITURE.filter((f) => (f.kind === "floor" || f.kind === "rug") && !f.rare) : tab === "wall" ? FURNITURE.filter((f) => f.kind === "wall") : tab === "wp" ? WALLPAPERS.filter((w) => w.price > 0) : FLOORS.filter((w) => w.price > 0),
  },
  market: {
    name: "スーパー", keeper: { sp: "pig", outfit: { body: "apron", head: "partyhat" } }, keeperName: "てんいんの ブーコ",
    hello: ["いらっしゃいませ〜 ブー！", "しんせんな たべもの そろってるよ！"],
    tabs: [["food", "たべもの"], ["tool", "どうぐ"], ["boost", "とくべつ"]],
    items: (tab) => tab === "food" ? FOODS.filter((f) => !f.boost && !f.rare) : tab === "tool" ? TOOLS : FOODS.filter((f) => f.boost),
  },
};

const ShopUI = {
  open(shopId, startTab) {
    return new Promise((resolve) => {
      const S = BUY_SHOPS[shopId];
      const previousMusic = Sound.cur?.name || Sound.want || (G.sceneName === "house" ? "house" : G.scene?.map?.bgm || "town");
      Sound.bgm("shop_" + shopId);
      const body = U.el("div");
      const m = UI.modal({ title: S.name, body, cls: "full" + (S.cls ? " " + S.cls : ""), onClose: () => { Sound.bgm(previousMusic); resolve(); } });
      const keeper = Art.npcSvg({ ...S.keeper, emo: "happy" });
      const greet = U.el("div", { class: "chara-card", style: "align-items:center" });
      greet.innerHTML = `<div class="portrait" style="width:64px;flex-basis:64px">${keeper}</div><div class="info"><div class="nm" style="font-size:14px">${S.keeperName}</div><div>${U.pick(S.hello)}</div></div>`;
      const coins = U.el("div", { class: "pill coins", style: "display:inline-flex;margin:0 0 10px" });
      const updCoins = () => { coins.innerHTML = `<i class="coin-ico"></i>${U.fmt(Save.d.coins)}`; UI.updateHud(); };
      updCoins();
      const tabs = U.el("div", { class: "tabs" });
      const grid = U.el("div", { class: "grid" });
      body.append(greet, coins, tabs, grid);
      let cur = S.tabs.some((t) => t[0] === startTab) ? startTab : S.tabs[0][0];
      const render = () => {
        tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === cur));
        grid.innerHTML = "";
        for (const it of S.items(cur)) grid.append(this.card(shopId, cur, it, () => { updCoins(); render(); }));
      };
      for (const [k, label] of S.tabs) {
        const b = U.el("button", { class: "tab", text: label });
        b.dataset.k = k;
        b.addEventListener("click", () => { Sound.se("tap"); cur = k; render(); });
        tabs.append(b);
      }
      render();
    });
  },
  kindOf(shopId, tab) {
    if(shopId==='ike_electronics')return tab==='phones'?'wear':'furn';
    if (BUY_SHOPS[shopId].kind) return BUY_SHOPS[shopId].kind;
    if (shopId === "clothes") return "wear";
    if (shopId === "market") return "bag";
    return tab === "wp" ? "wall" : tab === "fl" ? "floor" : "furn";
  },
  owned(kind, it) {
    const d = Save.d;
    if (kind === "wear") return WearStock.count(it.id); // 服は かず（1こで 1人。js/wear-stock.js）
    if (kind === "wall") return !!d.room.wallpapers[it.id];
    if (kind === "floor") return !!d.room.floors[it.id];
    if (kind === "furn") return d.furn[it.id] || 0;
    return d.bag[it.id] || 0;
  },
  card(shopId, tab, it, onBuy) {
    const kind = this.kindOf(shopId, tab);
    const own = this.owned(kind, it);
    // かべがみ・ゆかは 1つで おしまい。服は 1こで 1人なので WearStock.CAP こ まで かえる
    const single = kind === "wall" || kind === "floor", full = (single && own) || (kind === "wear" && own >= WearStock.CAP);
    const card = U.el("button", { class: "card" + (full ? " on" : "") });
    const icoSize = kind === "furn" ? 58 : 48;
    card.innerHTML = `${own && !single ? `<span class="cnt">×${own}</span>` : ""}${UI.icon(kind, it.id, icoSize)}<div>${it.name}</div>` +
      (full ? `<div class="price">もってる</div>` : `<div class="price"><i class="coin-ico"></i>${it.price}</div>`);
    card.addEventListener("click", () => { Sound.se("tap"); this.detail(shopId, kind, it, onBuy); });
    return card;
  },
  detail(shopId, kind, it, onBuy) {
    const body = U.el("div");
    const single = kind === "wall" || kind === "floor";
    let who = Save.d.order[0];
    const stage = U.el("div", { class: "dress-stage" });
    const drawStage = () => {
      if (kind === "wear") {
        const c = Save.d.chars[who];
        const outfit = { ...c.outfit, [it.slot]: it.id };
        stage.innerHTML = `<div class="floor"></div><div class="who">${Chara.svg(who, { outfit, color: c.color, face: "happy", dir: it.slot === "back" ? "up" : "down" })}</div>`;
      } else if (kind === "furn") {
        stage.innerHTML = `<div class="floor"></div><div class="who" style="width:${Math.min(220, it.w * 2 + 30, it.cityItem ? 155 * HomeDesign.model(it.id).w / HomeDesign.model(it.id).h : 220)}px;bottom:30px">${Art.furnSvg(it.id)}</div>`;
      } else if (kind === "wall" || kind === "floor") {
        stage.innerHTML = `<div class="who" style="width:180px;bottom:24px">${Art.iconSvg(kind, it.id)}</div>`;
      } else {
        stage.innerHTML = `<div class="who" style="width:120px;bottom:50px">${Art.iconSvg("bag", it.id)}</div>`;
      }
    };
    drawStage();
    body.append(stage);
    if (kind === "wear") {
      const wt = U.el("div", { class: "who-tabs" });
      for (const id of Save.d.order) {
        const b = U.el("button", { class: "who-tab" + (id === who ? " on" : ""), html: Chara.svg(id, { color: Save.d.chars[id].color }) + Save.d.chars[id].name });
        b.addEventListener("click", () => { who = id; wt.querySelectorAll(".who-tab").forEach((x) => x.classList.remove("on")); b.classList.add("on"); drawStage(); Sound.se("tap"); });
        wt.append(b);
      }
      body.append(wt);
    }
    const info = [];
    if (it.desc) info.push(it.desc);
    if (it.st) info.push(Object.entries(it.st).map(([k, v]) => `${{ atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ", hp: "HP", sp: "SP" }[k]} ${v > 0 ? "+" : ""}${v}`).join(" ／ "));
    if (it.perk) info.push("とくせい: " + PERK_TEXT[it.perk]);
    if (kind === "wear") info.push(`1こで ひとり きられるよ（もってる: ${WearStock.count(it.id)}こ）`);
    if (it.comfort) info.push(`いごこち +${it.comfort}`);
    if (it.hunger) info.push(`おなか +${it.hunger}` + (it.mood ? ` ／ ごきげん ${it.mood > 0 ? "+" : ""}${it.mood}` : ""));
    // おみせの ひとこと（バーガーやさんの おまけの おもちゃ など。js/burger-menu.js）
    const shopNote = BUY_SHOPS[shopId] && BUY_SHOPS[shopId].note ? BUY_SHOPS[shopId].note(it) : "";
    if (shopNote) info.push(shopNote);
    if (info.length) body.append(U.el("div", { class: "note", html: info.join("<br>") }));
    let qty = 1;
    const foot = U.el("div", { class: "row", style: "width:100%" });
    const price = U.el("div", { class: "pill", style: "box-shadow:none" });
    const setPrice = () => (price.innerHTML = `<i class="coin-ico"></i>${it.price * qty}`);
    setPrice();
    foot.append(price);
    // 服は あと なんこ もてるか まで（3人に きせるなら 3こ）
    const max = kind === "wear" ? WearStock.room(it.id) : 20;
    if (!single && max > 0) {
      const minus = UI.btn("−", () => { qty = Math.max(1, qty - 1); setPrice(); q.textContent = "×" + qty; }, "small");
      const q = U.el("b", { text: "×1" });
      const plus = UI.btn("＋", () => { qty = Math.min(max, qty + 1); setPrice(); q.textContent = "×" + qty; }, "small");
      foot.append(minus, q, plus);
    }
    foot.append(U.el("div", { class: "spacer" }));
    const owned = single ? this.owned(kind, it) : max <= 0;
    const buy = UI.btn(owned ? "もってるよ" : "かう", async () => {
      if (buy.disabled) return;
      const cost = it.price * qty;
      if (Save.d.coins < cost) { Sound.se("bad"); UI.toast("コインが たりないよ……"); return; }
      buy.disabled = true;
      Save.addCoins(-cost);
      Sound.se("buy");
      if (kind === "wear") WearStock.add(it.id, qty);
      else if (kind === "wall") Save.d.room.wallpapers[it.id] = true;
      else if (kind === "floor") Save.d.room.floors[it.id] = true;
      else if (kind === "furn") Save.d.furn[it.id] = (Save.d.furn[it.id] || 0) + qty;
      else Save.addBag(it.id, qty);
      // おまけ（にこにこ セットの おもちゃ など）は セーブの まえに わたす。かえりは かった あとに ひらく まど
      const extra = BUY_SHOPS[shopId] && BUY_SHOPS[shopId].bought ? BUY_SHOPS[shopId].bought(it, qty) : null;
      Save.mark();
      Save.write();
      m.close();
      onBuy();
      if (kind === "wear") {
        if (await UI.confirm(`「${it.name}」を ${qty > 1 ? qty + "こ " : ""}かったよ！\n${Save.d.chars[who].name}が いま きる？`, "きる！", "あとで")) {
          WearStock.put(who, it.slot, it.id);
          Save.care(who, { mood: 6, bond: 1 }); Save.write();
          Save.mark();
          UI.toast(`${Save.d.chars[who].name}「にあう？」`, "good");
        }
      } else if (kind === "furn" || kind === "wall" || kind === "floor") UI.toast("おうちの「もようがえ」で つかえるよ", "good");
      else UI.toast(`${it.name}を ${qty}こ かった！`, "good");
      if (extra) await extra();
    }, owned ? "" : "yellow");
    if (owned) buy.disabled = true;
    foot.append(buy);
    const m = UI.modal({ title: it.name, body, footer: foot });
  },
};
