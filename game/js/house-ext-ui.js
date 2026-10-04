// おうちの そとを かえる がめん（O9・UI-74。工務店の とうりょうさんに はなすと ひらく。js/koumuten.js）。
// うえに いまの おうちの 絵（ためしに えらんだ ものが すぐ うつる・☀/🌙 で よるの すがた）→ しゅるいの タブ（ペンキ・やね・かべ・まど・ドア・
// えんとつ・やねの うえ・あかり・ポスト・にわ）→ えらぶ。もって いない ものも ためせる。したの ボタンで「かって きめる（○コイン）」／「これに きめる」。
// 絵は js/house-ext-art.js（がめんの なかの SVG。SvgCache は つかわない）、かう・つけるは js/house-ext.js。
const HouseExtUI = (() => {
  let V = null; // ひらいて いる とき: { m, draft, tab, target, night, resolve, spent, changed }
  const X = () => HouseExt, A = () => HouseExtArt;
  const copy = (e) => ({ parts: { ...e.parts }, paint: { ...e.paint } });
  // まだ もって いない もの（えらんだ なかで）
  function unpaid(d) {
    const out = [];
    for (const c of X().CATS) { const p = X().part(c.id, d.parts[c.id]); if (p && !X().has(c.id, p.id)) out.push({ kind: "part", cat: c.id, id: p.id, name: p.name, price: p.price }); }
    const seen = new Set();
    for (const t of X().TARGETS) { const id = d.paint[t.id]; if (seen.has(id)) continue; seen.add(id); const p = X().PAINT[id]; if (p && !X().hasPaint(id)) out.push({ kind: "paint", id, name: p.name + "の ペンキ", price: p.price }); }
    return out;
  }
  const cost = (d) => unpaid(d).reduce((n, x) => n + x.price, 0);
  const dirty = (d) => X().key(d) !== X().key();
  function render() {
    if (!V) return;
    const d = V.draft, body = V.m.body;
    body.innerHTML = "";
    // おうちの 絵
    const pic = U.el("div", { class: "hx-preview", html: A().picture(X().resolve(d), V.night) });
    const nightBtn = UI.btn(V.night ? "☀ ひる" : "🌙 よる", () => { V.night = !V.night; Sound.se("tap"); render(); }, "small hx-night");
    pic.append(nightBtn);
    body.append(pic, U.el("div", { class: "hx-coins", text: `もって いる コイン: ${Save.d.coins.toLocaleString()}` }));
    // タブ
    const tabs = U.el("div", { class: "hx-tabs" });
    for (const t of [{ id: "paint", name: "ペンキ" }, ...X().CATS]) {
      const b = UI.btn(t.name, () => { V.tab = t.id; Sound.se("tap"); render(); }, "small hx-tab" + (V.tab === t.id ? " on" : ""));
      b.dataset.tab = t.id; tabs.append(b);
    }
    body.append(tabs);
    if (V.tab === "paint") {
      const tg = U.el("div", { class: "hx-targets" });
      for (const t of X().TARGETS) { const b = UI.btn(t.name, () => { V.target = t.id; Sound.se("tap"); render(); }, "small hx-target" + (V.target === t.id ? " on" : "")); b.dataset.target = t.id; tg.append(b); }
      const grid = U.el("div", { class: "hx-swatches" });
      for (const p of X().PAINTS) {
        const own = X().hasPaint(p.id), on = d.paint[V.target] === p.id;
        const b = U.el("button", { class: "hx-swatch" + (on ? " on" : "") + (own ? " own" : ""), "aria-label": p.name });
        b.dataset.paint = p.id;
        b.append(U.el("span", { class: "hx-dot", style: `background:${p.hex}` }), U.el("span", { class: "hx-name", text: p.name }), U.el("span", { class: "hx-price", text: own ? "もってる" : `${p.price}コイン` }));
        b.addEventListener("click", () => { d.paint[V.target] = p.id; Sound.se("tap"); render(); });
        grid.append(b);
      }
      body.append(tg, grid);
    } else {
      const c = X().CAT[V.tab], grid = U.el("div", { class: "hx-grid" });
      for (const p of c.parts) {
        const own = X().has(c.id, p.id), on = d.parts[c.id] === p.id, now = X().view().parts[c.id] === p.id;
        const b = U.el("button", { class: "hx-card" + (on ? " on" : "") + (own ? " own" : "") });
        b.dataset.cat = c.id; b.dataset.id = p.id;
        const t = copy(d); t.parts[c.id] = p.id;
        b.append(U.el("span", { class: "hx-thumb", html: A().icon(X().resolve(t), c.id) }), U.el("span", { class: "hx-name", text: p.name }), U.el("span", { class: "hx-price", text: now ? "いまの" : own ? "もってる" : `${p.price}コイン` }));
        b.addEventListener("click", () => { d.parts[c.id] = p.id; Sound.se("tap"); render(); });
        grid.append(b);
      }
      body.append(grid);
    }
    // したの ボタン
    const n = cost(d), go = V.m.el.querySelector(".hx-go");
    go.disabled = !dirty(d);
    go.innerHTML = n > 0 ? `かって きめる<small>${n.toLocaleString()}コイン</small>` : "これに きめる";
    go.classList.toggle("pink", n > 0);
    V.m.el.querySelector(".hx-reset").disabled = !dirty(d);
  }
  async function decide() {
    const d = V.draft, list = unpaid(d), n = cost(d);
    if (!dirty(d)) return;
    if (n > Save.d.coins) { Sound.se("cancel"); UI.toast(`コインが ${(n - Save.d.coins).toLocaleString()} たりないよ`); return; }
    for (const x of list) { const ok = x.kind === "part" ? X().buy(x.cat, x.id) : X().buyPaint(x.id); if (!ok) { UI.toast("コインが たりないよ"); render(); return; } }
    if (!X().apply(d)) { UI.toast("まだ かって いない ものが あるよ"); render(); return; }
    V.spent += n; V.changed = true;
    Sound.se(n > 0 ? "coin" : "good"); UI.toast("おうちの そとが かわったよ！", "good");
    V.m.close();
  }
  // ひらく（とじると { changed, spent }）。tab: さいしょの タブ（paint・roof・door など）
  function open({ tab = "paint" } = {}) {
    if (V) return Promise.resolve({ changed: false, spent: 0 });
    return new Promise((resolve) => {
      const foot = U.el("div", { class: "hx-foot" });
      const reset = UI.btn("もとに もどす", () => { V.draft = copy(X().view()); Sound.se("cancel"); render(); }, "hx-reset");
      const go = UI.btn("これに きめる", () => decide(), "yellow hx-go");
      foot.append(reset, go);
      const m = UI.modal({ title: "おうちの そとを かえる", cls: "full hx-panel", footer: foot, onClose: () => { const r = { changed: V.changed, spent: V.spent }; V = null; resolve(r); } });
      V = { m, draft: copy(X().view()), tab: tab === "paint" || X().CAT[tab] ? tab : "paint", target: "wall", night: false, spent: 0, changed: false };
      render();
    });
  }
  // PokaDebug・検査 よう
  const state = () => V ? { open: true, tab: V.tab, target: V.target, night: V.night, draft: copy(V.draft), cost: cost(V.draft), dirty: dirty(V.draft), unpaid: unpaid(V.draft).map((x) => x.kind + ":" + (x.cat ? x.cat + ":" : "") + x.id) } : { open: false };
  return { open, state, unpaid, cost };
})();
