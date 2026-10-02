// もちもの（UI-48・オーナーの FB 2026-10-02「持ち物で風船を持てたり…バックを持てたりしたい」）。
// ・きがえに あたらしい しゅるい「もちもの」（outfit.hand）。3人が 手に もつ ふうせん 4しゅ と バッグ 3しゅ。
//   ふうせん: 手から ひもが のびて あたまの よこに うかぶ（まる・ハート・ほし・くま）。バッグ: 手に さげる（トート・かご）・かたから ななめに かける（ポシェット）。
// ・ようふくやさんの「もちもの」の たなで かう（1こで ひとり。WearStock の きまりは ほかの ふくと おなじ）。ぱぱ・ままは もたない。
// ・絵は ほかの ふくと おなじ しくみ（WEAR[...]。SLOT_ORDER に hand を たすので キャッシュの キーにも はいる）。手の ばしょは charaArmEnds（まえ・よこは みぎ手、うしろむきは はんたいがわ）。
// ・セーブ: outfit.hand（ない ときは もって いない）。Save.SCHEMA は 2 の まま。
const HandItems = {
  SLOT: "hand", TAB: "もちもの",
  ITEMS: [
    { id: "hi_balloon_red", name: "あかい ふうせん", wear: "hi_balloon", col: ["#EF5350", "round"], price: 120, st: { spd: 1 }, desc: "まるくて あかい ふうせん。あるくと ふわふわ" },
    { id: "hi_balloon_heart", name: "ハートの ふうせん", wear: "hi_balloon", col: ["#F48FB1", "heart"], price: 180, st: { sp: 2 }, desc: "ピンクの ハート。もつと にこにこ" },
    { id: "hi_balloon_star", name: "ほしの ふうせん", wear: "hi_balloon", col: ["#FFD54F", "star"], price: 180, st: { spd: 1, sp: 1 }, desc: "きいろい おほしさまの ふうせん" },
    { id: "hi_balloon_bear", name: "くまの ふうせん", wear: "hi_balloon", col: ["#BCAAA4", "bear"], price: 240, st: { hp: 4 }, desc: "くまの かおの ふうせん。みみも ついてる" },
    { id: "hi_tote", name: "トートバッグ", wear: "hi_tote", col: ["#FFF3E0", "#4DB6AC"], price: 320, st: { def: 2 }, desc: "おかいものに ぴったりの おおきな バッグ" },
    { id: "hi_basket", name: "かごバッグ", wear: "hi_basket", col: ["#D7B377", "#E57373"], price: 280, st: { hp: 3 }, desc: "あみあみの かごに りぼん。ピクニックに" },
    { id: "hi_pochette", name: "ポシェット", wear: "hi_pochette", col: ["#F8BBD0", "#F06292"], price: 260, st: { def: 1, sp: 1 }, desc: "かたから ななめに かける ちいさな バッグ" },
  ],
  hand(ctx) { const k = ctx.view === "back" ? 0 : 1, E = charaArmEnds(ctx.p, k); return { k, x: E.hand[0], y: E.hand[1], side: k ? 1 : -1 }; },
  balloon(ctx) {
    const h = this.hand(ctx), c = ctx.col[0] || "#EF5350", shape = ctx.col[1] || "round", d = shade(c, -0.18), hi = shade(c, 0.45);
    const bx = U.clamp(h.x + h.side * 18, 14, 186), by = Math.round(U.clamp(ctx.a.hat.y - 28, 4, 30)), r = 20, ky = by + r + 3;
    const line = `<path d="M${f2(h.x)},${f2(h.y)} C${f2(h.x + h.side * 8)},${f2(h.y - 40)} ${f2(bx - h.side * 10)},${f2(ky + 34)} ${f2(bx)},${f2(ky + 2)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    const knot = `<path d="M${f2(bx - 3.5)},${f2(ky + 4)} L${f2(bx)},${f2(ky - 1)} L${f2(bx + 3.5)},${f2(ky + 4)} Z" fill="${d}" ${stroke(2)}/>`;
    let body;
    if (shape === "heart") body = `<path d="${heartPath(bx, by + 2, 3.9)}" fill="${c}" ${stroke(3.4)}/>`;
    else if (shape === "star") body = `<path d="${starPath(bx, by + 1, 24, 12)}" fill="${c}" ${stroke(3.4)}/>`;
    else if (shape === "bear") body = `<circle cx="${f2(bx - 14)}" cy="${f2(by - 15)}" r="8" fill="${c}" ${stroke(3)}/><circle cx="${f2(bx + 14)}" cy="${f2(by - 15)}" r="8" fill="${c}" ${stroke(3)}/>`
      + `<ellipse cx="${f2(bx)}" cy="${f2(by)}" rx="${r}" ry="${r - 1}" fill="${c}" ${stroke(3.4)}/><ellipse cx="${f2(bx)}" cy="${f2(by + 6)}" rx="9" ry="6.5" fill="${hi}" ${stroke(2.2)}/>`
      + `<circle cx="${f2(bx - 7)}" cy="${f2(by - 4)}" r="2.4" fill="${INK}"/><circle cx="${f2(bx + 7)}" cy="${f2(by - 4)}" r="2.4" fill="${INK}"/><ellipse cx="${f2(bx)}" cy="${f2(by + 4)}" rx="3.2" ry="2.3" fill="${INK}"/>`;
    else body = `<ellipse cx="${f2(bx)}" cy="${f2(by)}" rx="${r}" ry="${r + 2}" fill="${c}" ${stroke(3.2)}/>`;
    const shine = shape === "bear" ? "" : `<path d="M${f2(bx - 10)},${f2(by - 7)} C${f2(bx - 9)},${f2(by - 13)} ${f2(bx - 4)},${f2(by - 16)} ${f2(bx + 1)},${f2(by - 16)}" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>`;
    return { top: line + knot + body + shine };
  },
  // 手に さげる バッグ（トート・かご）: とっての わっかが 手に かかって、からだの よこに さがる
  bag(ctx, kind) {
    const h = this.hand(ctx), c = ctx.col[0], c2 = ctx.col[1] || shade(c, -0.25), x = U.clamp(h.x + h.side * 3, 18, 184), y0 = h.y + 8, w = kind === "basket" ? 32 : 32, hh = kind === "basket" ? 24 : 28;
    const handle = `<path d="M${f2(x - w * 0.28)},${f2(y0 + 2)} C${f2(x - w * 0.28)},${f2(h.y - 9)} ${f2(x + w * 0.28)},${f2(h.y - 9)} ${f2(x + w * 0.28)},${f2(y0 + 2)}" fill="none" stroke="${kind === "basket" ? shade(c, -0.25) : c2}" stroke-width="3.4" stroke-linecap="round"/>`;
    if (kind === "basket") {
      const b = `M${f2(x - w / 2)},${f2(y0)} H${f2(x + w / 2)} L${f2(x + w * 0.4)},${f2(y0 + hh)} C${f2(x + w * 0.2)},${f2(y0 + hh + 3)} ${f2(x - w * 0.2)},${f2(y0 + hh + 3)} ${f2(x - w * 0.4)},${f2(y0 + hh)} Z`;
      let weave = "";
      for (let i = 1; i < 4; i++) weave += `<path d="M${f2(x - w * 0.47 + i * 0.6)},${f2(y0 + i * 5)} H${f2(x + w * 0.47 - i * 0.6)}" stroke="${shade(c, -0.22)}" stroke-width="1.4"/>`;
      for (let i = -2; i <= 2; i++) weave += `<path d="M${f2(x + i * 5.5)},${f2(y0 + 1)} L${f2(x + i * 4.6)},${f2(y0 + hh)}" stroke="${shade(c, -0.22)}" stroke-width="1.2"/>`;
      return { top: handle + `<path d="${b}" fill="${c}" ${stroke(3)}/>` + weave + `<path d="M${f2(x - 3)},${f2(y0 + 2)} l-6,-4 l0,8 Z M${f2(x + 3)},${f2(y0 + 2)} l6,-4 l0,8 Z" fill="${c2}" ${stroke(1.6)}/><circle cx="${f2(x)}" cy="${f2(y0 + 2)}" r="2.6" fill="${c2}" ${stroke(1.6)}/>` };
    }
    return { top: handle + `<rect x="${f2(x - w / 2)}" y="${f2(y0)}" width="${w}" height="${hh}" rx="4" fill="${c}" ${stroke(3)}/>` + `<path d="M${f2(x - w / 2 + 2)},${f2(y0 + 8)} H${f2(x + w / 2 - 2)}" stroke="${c2}" stroke-width="4"/><circle cx="${f2(x)}" cy="${f2(y0 + 15)}" r="3.4" fill="${c2}" ${stroke(1.6)}/>` };
  },
  // かたから ななめに かける ポシェット（うしろむきは はんたいがわ）
  pochette(ctx) {
    const N = ctx.a.neck, T = ctx.a.torso, sgn = ctx.view === "back" ? -1 : 1, c = ctx.col[0], c2 = ctx.col[1] || shade(c, -0.25);
    const sx = N.x - sgn * N.w * 0.32, sy = N.y + 1, px = T.cx + sgn * T.w * 0.46, py = U.clamp(T.bottom - 24, T.top + 26, 200);
    const strap = `<path d="M${f2(sx)},${f2(sy)} C${f2(N.x)},${f2(sy + (py - sy) * 0.3)} ${f2(px - sgn * 10)},${f2(py - 16)} ${f2(px)},${f2(py - 7)}" fill="none" stroke="${c2}" stroke-width="3.6" stroke-linecap="round"/>`;
    const bag = `<path d="M${f2(px - 11)},${f2(py - 7)} H${f2(px + 11)} C${f2(px + 12)},${f2(py + 4)} ${f2(px + 8)},${f2(py + 10)} ${f2(px)},${f2(py + 10)} C${f2(px - 8)},${f2(py + 10)} ${f2(px - 12)},${f2(py + 4)} ${f2(px - 11)},${f2(py - 7)} Z" fill="${c}" ${stroke(2.8)}/>`
      + `<path d="M${f2(px - 11)},${f2(py - 6)} C${f2(px - 6)},${f2(py + 1)} ${f2(px + 6)},${f2(py + 1)} ${f2(px + 11)},${f2(py - 6)}" fill="${shade(c, -0.12)}" ${stroke(2.2)}/><path d="${heartPath(px, py + 3, 0.62)}" fill="${c2}"/>`;
    return { top: strap + bag };
  },
  // テスト・PokaDebug・すまほ: もって いる もちもの
  held(id) { const o = Save.d && Save.d.chars[id] && Save.d.chars[id].outfit, it = o && o.hand && ITEM_INDEX[o.hand]; return it && it.slot === this.SLOT ? it.id : null; },
};

// ---- ゲームに いれる ----
(() => {
  WEAR.hi_balloon = (ctx) => HandItems.balloon(ctx);
  WEAR.hi_tote = (ctx) => HandItems.bag(ctx, "tote");
  WEAR.hi_basket = (ctx) => HandItems.bag(ctx, "basket");
  WEAR.hi_pochette = (ctx) => HandItems.pochette(ctx);
  for (const it of HandItems.ITEMS) { const w = { ...it, slot: HandItems.SLOT }; WEAR_ITEMS.push(w); ITEM_INDEX[w.id] = w; }
  if (!SLOT_ORDER.includes(HandItems.SLOT)) SLOT_ORDER.push(HandItems.SLOT); // 絵の かさなり（いちばん うえ）と キャッシュの キー
  if (BUY_SHOPS.clothes && !BUY_SHOPS.clothes.tabs.some((t) => t[0] === HandItems.SLOT)) BUY_SHOPS.clothes.tabs.push([HandItems.SLOT, HandItems.TAB]);
  // ようふくやさんの タブは 6こ（2だんに おりかえす。css の .shop-wear）
  if (BUY_SHOPS.clothes) BUY_SHOPS.clothes.cls = ((BUY_SHOPS.clothes.cls || "") + " shop-wear").trim();
  // アイコン（おみせ・きがえ・ずかん）: もちもの だけを きりぬく
  const icon = Art.iconSvg;
  Art.iconSvg = function (kind, id) {
    const it = kind === "wear" && ITEM_INDEX[id];
    if (!it || it.slot !== HandItems.SLOT || !WEAR[it.wear]) return icon.apply(this, arguments);
    const r = WEAR[it.wear]({ p: PROFILE.wanko, a: PROFILE.wanko.a, view: "front", dx: 0, col: it.col || [], uid: "i" + id });
    const inner = `<g class="content">${r.behind || ""}${r.top || ""}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Art.fitBox("wear:" + id, inner, "60 -20 150 230")}">${inner}</svg>`;
  };
})();
