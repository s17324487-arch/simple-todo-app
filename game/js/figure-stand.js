// フィギュア台（オーナーの FB 2026-10-01「家具として、各種フィギュアを置ける、フィギュア台を作りなさい」）。
// かぐやで かう 家具 2しゅ: ひなだんの フィギュア だい（3だん × 3）・ガラスの フィギュア ケース（3だん × 3・よるは あかり）。
// タップすると「フィギュアを かざる」: ばしょを えらんで、もって いる フィギュア（ガチャガチャ・はしわたし・すいぞくかんの おみやげ・バーガーやさんの おまけ）を おく。
// おいた フィギュアは へやの 家具と おなじに かぞえる（Room.placed・いごこち）。だいを しまうと フィギュアは もちものに もどる。
// セーブ: だいの へやの アイテムに figs（ばしょの かず ぶんの フィギュアの id か null）を たす だけ（Save.SCHEMA は そのまま）。
// プリセット（RoomPresets）も figs を おぼえる（よびだす ときは ほかの へやで つかって いる かずも かぞえる）。
const FigureStand = (() => {
  const TAU = Math.PI * 2, Sh = FurnModels.shapes;
  // ---- だいの しゅるい（ばしょは [x, y, z]・左から右・うしろ／うえの だんから）----
  const STEP_Z = [46, 30, 14], STEP_Y = [-55, -33, -11], CASE_Z = [88.6, 50.6, 10.4], XS = [-34, 0, 34], CASE_XS = [-29, 0, 29];
  const STANDS = {
    figstand_step: { name: "ひなだんの フィギュア だい", price: 1280, w: 108, depth: 66, h: 60, comfort: 3, cap: 34, capW: 32,
      desc: "フィギュアを 9こ かざれる 3だんの だい。タップして ならべてね。", rows: ["うしろの だん", "まんなかの だん", "まえの だん"],
      slots: STEP_Z.flatMap((z, r) => XS.map((x) => [x, STEP_Y[r], z])) },
    figstand_case: { name: "ガラスの フィギュア ケース", price: 2480, w: 96, depth: 46, h: 132, comfort: 5, cap: 33, capW: 27,
      desc: "ガラスの たなに フィギュアを 9こ かざれる ケース。よるは あかりが つくよ。", rows: ["うえの たな", "まんなかの たな", "したの たな"], ceil: [124, 86, 48],
      slots: CASE_Z.flatMap((z) => CASE_XS.map((x) => [x, -23, z])) },
  };
  const isStand = (id) => !!STANDS[id];
  const COLS = ["ひだり", "まんなか", "みぎ"];
  const slotName = (S, i) => `${S.rows[Math.floor(i / 3)]}の ${COLS[i % 3]}`;

  // ---- かざれる フィギュア（ガチャガチャの へやに かざる もの・はしわたしの フィギュア・すいぞくかんの フィギュア・にこにこ セットの おもちゃ）----
  const isFigure = (id) => {
    if (!FURN_INDEX[id] || isStand(id)) return false;
    if (typeof Gacha !== "undefined" && Gacha.INDEX[id]) return Gacha.INDEX[id].kind === "furn";
    if (typeof BridgePrizes !== "undefined" && BridgePrizes.INDEX[id]) return BridgePrizes.INDEX[id].kind === "fig";
    if (typeof AquaGifts !== "undefined" && AquaGifts.INDEX[id]) return FURN_INDEX[id].aquaGift === "fig";
    if (typeof BurgerMenu !== "undefined" && BurgerMenu.TOY_INDEX[id]) return true; // バーガーやさんの にこにこ セットの おまけ
    return false;
  };
  const figures = () => FURNITURE.filter((f) => isFigure(f.id)).map((f) => f.id);
  // だいの figs を ばしょの かず に そろえる（しらない id・フィギュアで ない ものは からっぽ）
  const figsOf = (it) => { const S = STANDS[it && it.id]; if (!S) return []; const a = Array.isArray(it.figs) ? it.figs : []; return S.slots.map((_, i) => (typeof a[i] === "string" && isFigure(a[i]) ? a[i] : null)); };
  // へやの アイテムの ならびの なかで、だいに かざって いる かず
  const onStands = (items, id) => (items || []).reduce((n, it) => n + (isStand(it.id) ? figsOf(it).filter((x) => x === id).length : 0), 0);

  // ---- 家具に いれる ----
  for (const [id, S] of Object.entries(STANDS)) {
    const f = { id, name: S.name, price: S.price, kind: "floor", w: S.w, h: S.h, depth: S.depth, comfort: S.comfort, interactive: true, figureStand: S.slots.length, desc: S.desc };
    FURNITURE.push(f); FURN_INDEX[id] = f; FURN_ART[id] = () => HomeDesign.model(id).full;
  }
  for (const id of figures()) FURN_INDEX[id].figure = true;
  // おいた かず に だいの うえの フィギュアも いれる（もようがえで 2こめを おけない・だいを しまうと もどる）
  const placed0 = Room.placed;
  Room.placed = function (id) { return placed0.call(this, id) + (isFigure(id) ? HomeRooms.all().reduce((n, r) => n + onStands(r.items, id), 0) : 0); };
  // いごこち: かざった フィギュアも その へやの いごこちに なる
  const comfort0 = Room.comfort;
  Room.comfort = function () { return comfort0.call(this) + (Save.d.room.items || []).reduce((n, it) => n + (isStand(it.id) ? figsOf(it).reduce((m, x) => m + (x ? FURN_INDEX[x].comfort || 0 : 0), 0) : 0), 0); };
  // プリセット: figs も おぼえる・よびだす ときは ほかの へやで つかって いる かずも かぞえる
  const snap0 = RoomPresets.snapshot;
  RoomPresets.snapshot = function (name) { const p = snap0.call(this, name); Save.d.room.items.forEach((it, i) => { if (isStand(it.id) && p.items[i] && p.items[i].id === it.id) { const a = figsOf(it); if (a.some(Boolean)) p.items[i].figs = a; } }); return p; };
  const problem0 = RoomPresets.problem;
  RoomPresets.problem = function (p) {
    const why = problem0.call(this, p); if (why) return why;
    const need = {};
    for (const it of p.items) if (isStand(it.id)) for (const x of figsOf(it)) if (x) need[x] = (need[x] || 0) + 1;
    for (const [id, n] of Object.entries(need)) {
      const used = Object.values(Save.d.rooms.stored).reduce((a, r) => a + r.items.filter((it) => it.id === id).length + onStands(r.items, id), 0);
      const inPreset = p.items.filter((it) => it.id === id).length;
      if (n + inPreset + used > (Save.d.furn[id] || 0)) return FURN_INDEX[id].name + "が たりないよ。べつの おへやで かざって いないか みてね。";
    }
    return null;
  };

  // ---- 立体（FurnModels）----
  const WOOD = ["#E9D3AE", "#CDB287", "#F4E4C6"], FELT = "#F6C3CE", FELTD = "#E7A3B3", GOLD = "#E3C06B";
  const M = {};
  // 1. ひなだん: うしろ → まえ の じゅんに 3だん。うえに ピンクの フェルト・まえの ふちに きんの せん
  M.figstand_step = (k) => {
    const { box, shape, TP, FR, lineOn } = k;
    let s = k.shadow(0.12, 4, 8);
    [[-66, 46], [-44, 30], [-22, 14]].forEach(([y, z]) => {
      s += box(-54, y, 108, 22, 0, z, WOOD);
      s += shape(TP(z + 0.1), Sh.rect(-52, y + 2, 104, 18), FELT, 1) + lineOn(TP(z + 0.15), [[-52, y + 19], [52, y + 19]], FELTD, 1.2);
      s += lineOn(FR(y + 22.05), [[-54, z - 2.5], [54, z - 2.5]], GOLD, 1.6);
    });
    // まえの だんの ねふだ
    s += k.onP(FR(0.1), -14, 10, 28, 7, `<rect x="0" y="0" width="28" height="7" rx="2" fill="#FFF8EA" stroke="${INK}" stroke-width="0.9"/><path d="M5,3.5 H23" stroke="${GOLD}" stroke-width="1.2"/>`);
    return s;
  };
  // 2. ガラスの ケース: きの だいと やね・おくの かべ・ガラスの たな 2まい・みぎと まえの ガラスと はしら（live の ときは FurnLive が フィギュアの あとに 描く）
  const CW = ["#B98E5F", "#97704A", "#D4AC7C"], GLASS = ["#D7EEF5", "#BFDDE7", "#E9F7FB"];
  M.figstand_case = (k) => {
    const { box, shape, FR, SD, TP, lineOn, L } = k;
    let s = k.shadow(0.12, 3, 6);
    s += box(-48, -46, 96, 46, 0, 10, CW);
    s += shape(FR(-45.5), Sh.rect(-46, 10, 92, 114), "#F4EFE7", 1.2) + lineOn(FR(-45.4), [[-46, 122], [46, 122]], "#FFF6D8", 2.2, 'opacity=".8"');
    for (const z of [48, 86]) s += box(-46, -44, 92, 42, z, 2.4, GLASS, 1);
    s += shape(TP(10.1), Sh.rect(-46, -44, 92, 42), "#EFE6D6", 0);
    s += box(-48, -46, 96, 46, 124, 8, CW);
    s += box(44, -46, 4, 4, 10, 114, CW);
    s += L(glassSvg(k));
    return s;
  };
  // みぎと まえの ガラス・まえの はしら（2D の 絵で。live では canvas で おなじ ものを 描く）
  const glassSvg = (k) => {
    const { shape, FR, SD, lineOn, box } = k;
    return shape(SD(48), Sh.rect(-46, 10, 46, 114), GLASS[0], 1.2, 'fill-opacity=".3"') + shape(FR(0), Sh.rect(-48, 10, 96, 114), GLASS[2], 1.2, 'fill-opacity=".14"') +
      lineOn(FR(0.1), [[-30, 18], [-6, 110]], "#FFFFFF", 2.2, 'opacity=".6"') + lineOn(FR(0.1), [[-20, 18], [-8, 64]], "#FFFFFF", 1.4, 'opacity=".5"') +
      box(-48, -4, 4, 4, 10, 114, CW) + box(44, -4, 4, 4, 10, 114, CW);
  };
  for (const [id, fn] of Object.entries(M)) FurnModels.register(id, fn);

  // ---- へやで 描く（FurnLive）: だいの うえの フィギュア・ケースの ガラス・よるの あかり ----
  const mapper = (sc, it, r) => {
    const m = HomeDesign.model(it.id, it), dm = HomeDesign.dimensions(it.id), s = sc.s, ox = r.x - m.x * s, oy = r.y - m.y * s;
    const P = (x, y, z = 0) => { const q = it.flip ? HomeDesign.project(y + dm.d / 2, x - dm.w / 2, z) : HomeDesign.project(x, y, z); return { x: ox + q.x * s, y: oy + q.y * s }; };
    P.s = s; return P;
  };
  // フィギュアの 立体の 足もと（FurnModels の 2D の 絵は だいの まんなか・池袋の おしなもの〔ガチャ・はしわたし〕は 0, 0）
  const foot = (id) => { const f = FURN_INDEX[id]; if (FurnModels.has(id)) { const d = HomeDesign.dimensions(id).d; return HomeDesign.project(0, -d / 2, 0); } return { x: 0, y: 0 }; };
  // だいの ばしょに おく 大きさ（たかさ cap・はば capW に おさめる）
  const scaleOf = (S, id) => { const f = FURN_INDEX[id]; return Math.min(0.7, S.cap / f.h, S.capW / f.w); };
  const sprite = (id, k, s) => {
    const m = HomeDesign.model(id), px = Math.max(8, Math.ceil((m.w * k * s * (G.px || 2)) / 8) * 8), py = Math.max(8, Math.round((px * m.h) / m.w));
    const c = SvgCache.get(`figstand:${id}:${px}`, () => m.full, px, py); return c ? { c, m } : null;
  };
  const drawFigs = (ctx, sc, it, r) => {
    const S = STANDS[it.id], P = mapper(sc, it, r), a = figsOf(it);
    // うしろの だんから（ならびが うしろ → まえ）・おなじ だんは ひだりから
    S.slots.forEach(([x, y, z], i) => {
      const id = a[i]; if (!id) return;
      const k = scaleOf(S, id), sp = sprite(id, k, P.s); if (!sp) return;
      const q = P(x, y, z), ft = foot(id), s = P.s * k;
      ctx.drawImage(sp.c, q.x + (sp.m.x - ft.x) * s, q.y + (sp.m.y - ft.y) * s, sp.m.w * s, sp.m.h * s);
    });
  };
  const poly = (ctx, pts, fill, stroke) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = INK; ctx.lineWidth = stroke; ctx.lineJoin = "round"; ctx.stroke(); } };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const caseOn = (st) => (st.on == null ? typeof DayTint !== "undefined" && DayTint.isNight() : st.on);
  // たなの あかり（フィギュアの うしろに 描く ので フィギュアは しろく ならない）
  const drawCaseGlow = (ctx, sc, it, r, st) => {
    if (!caseOn(st)) return;
    const P = mapper(sc, it, r);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const z of [118, 80, 42]) { const c = P(0, -30, z); glow(ctx, c.x, c.y, 40 * P.s, "255,226,160", 0.2); }
    ctx.restore();
  };
  const drawGlass = (ctx, sc, it, r) => {
    const P = mapper(sc, it, r), s = P.s;
    poly(ctx, [P(48, -46, 10), P(48, 0, 10), P(48, 0, 124), P(48, -46, 124)], "rgba(215,238,245,0.3)", 1.2 * s);
    poly(ctx, [P(-48, 0, 10), P(48, 0, 10), P(48, 0, 124), P(-48, 0, 124)], "rgba(233,247,251,0.14)", 1.2 * s);
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineCap = "round";
    for (const [a, b, w] of [[[-30, 18], [-6, 110], 2.2], [[-20, 18], [-8, 64], 1.4]]) { const p = P(a[0], 0.1, a[1]), q = P(b[0], 0.1, b[1]); ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    // まえの はしら（2本）
    for (const x0 of [-48, 44]) {
      poly(ctx, [P(x0, 0, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 124), P(x0, 0, 124)], CW[0], 1.2 * s);
      poly(ctx, [P(x0 + 4, -4, 10), P(x0 + 4, 0, 10), P(x0 + 4, 0, 124), P(x0 + 4, -4, 124)], CW[1], 1.2 * s);
    }
  };
  const say = (sc, it, line, fx = "heart") => {
    const a = sc.anchor ? sc.anchor(it) : null, c = a && sc.chars ? sc.chars.filter((q) => !q.hidden).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0] : null;
    if (!c) return;
    sc.react?.(c, "happy", fx);
    if (typeof HomeLife !== "undefined") HomeLife.say(sc, c.id, line);
  };

  // ---- かざる 画面 ----
  // もって いて、どこにも おいて いない かず（いま かざって いる ばしょの ぶんは のぞく）
  const free = (id) => Room.available(id);
  const icon = (id, size = 46) => `<span class="figst-ico" style="width:${size}px;height:${size}px">${Art.furnSvg(id)}</span>`;
  let view = null;
  const save = () => { Save.mark(); Save.write(); };
  function open(sc, it) {
    const S = STANDS[it.id]; if (!S) return null;
    const body = U.el("div", { class: "figst" }), m = UI.modal({ title: "フィギュアを かざる", body, cls: "full figst-panel", onClose: () => { view = null; } });
    view = { sc, it, m, body, pick: null };
    const render = () => {
      const a = figsOf(it), have = figures().filter((id) => (Save.d.furn[id] || 0) > 0);
      body.replaceChildren(U.el("p", { class: "note figst-lead", text: `${S.name}。かざる ばしょを タップしてね（${a.filter(Boolean).length} / ${a.length}）。` }));
      const grid = U.el("div", { class: "figst-grid" });
      a.forEach((id, i) => {
        const b = U.el("button", { class: "figst-slot" + (id ? " on" : ""), "aria-label": slotName(S, i) + (id ? "・" + FURN_INDEX[id].name : "・あいて いる"), "data-slot": i, html: id ? icon(id, 60) : `<span class="figst-plus">＋</span>` });
        b.addEventListener("click", () => { Sound.se("tap"); choose(i); });
        grid.append(b);
      });
      body.append(grid);
      const row = U.el("div", { class: "row wrap figst-acts" });
      row.append(UI.btn("ぜんぶ ならべる", () => fill(), "yellow"), UI.btn("ぜんぶ もどす", () => clear(), "pink"));
      body.append(row, U.el("p", { class: "note", text: have.length ? `もって いる フィギュア ${have.length}しゅ。だいを しまうと フィギュアは もちものに もどるよ。` : "フィギュアが まだ ないよ。ガチャガチャ・はしわたし・すいぞくかんの おみやげで てに いれよう。" }));
    };
    const set = (i, id) => { const a = figsOf(it); a[i] = id; it.figs = a; save(); };
    const fill = () => {
      const a = figsOf(it); let n = 0;
      for (const id of figures()) { let k = free(id); while (k-- > 0) { const i = a.indexOf(null); if (i < 0) break; a[i] = id; n++; } }
      if (!n) { Sound.se("bad"); UI.toast(a.indexOf(null) < 0 ? "もう ぜんぶ かざって いるよ" : "かざれる フィギュアが ないよ"); return; }
      it.figs = a; save(); Sound.se("ok"); say(sc, it, "ずらっと ならんだ！", "heart"); render();
    };
    const clear = () => { if (!figsOf(it).some(Boolean)) return; it.figs = figsOf(it).map(() => null); save(); Sound.se("cancel"); render(); };
    // ばしょ i に かざる フィギュアを えらぶ
    const choose = (i) => {
      const cur = figsOf(it)[i], list = figures().filter((id) => free(id) > 0 || id === cur), pb = U.el("div", { class: "figst-pick" });
      if (!list.length) pb.append(U.el("p", { class: "note", text: "かざれる フィギュアが ないよ。ほかの だいや へやに おいて いないか みてね。" }));
      const g = U.el("div", { class: "grid figst-list" });
      for (const id of list) {
        const n = free(id), c = U.el("button", { class: "card" + (id === cur ? " on" : ""), "aria-label": FURN_INDEX[id].name, html: `${n > 0 ? `<span class="cnt">×${n}</span>` : ""}${icon(id, 52)}<div>${FURN_INDEX[id].name}</div>` });
        c.addEventListener("click", () => { Sound.se("ok"); set(i, id); pm.close(); render(); say(sc, it, ["かざったよ！", "いい ばしょ だね", "にあう〜！"][i % 3], "heart"); });
        g.append(c);
      }
      pb.append(g);
      const foot = U.el("div", { class: "row", style: "width:100%" });
      if (cur) foot.append(UI.btn("とりだす", () => { Sound.se("cancel"); set(i, null); pm.close(); render(); }, "pink"));
      const pm = UI.modal({ title: slotName(S, i), body: pb, cls: "full figst-panel", footer: cur ? foot : null });
      view.pick = { i, m: pm };
    };
    render();
    return m;
  }

  for (const id of Object.keys(STANDS)) {
    FurnLive.register(id, {
      ...(id === "figstand_case" ? { isOn: caseOn } : {}),
      tap(sc, it, st) { st.t0 = G.t; st.n = (st.n || 0) + 1; open(sc, it); },
      draw(ctx, sc, it, r, st) { if (id === "figstand_case") drawCaseGlow(ctx, sc, it, r, st); drawFigs(ctx, sc, it, r); if (id === "figstand_case") drawGlass(ctx, sc, it, r); },
      ...(id === "figstand_case" ? { light(ctx, sc, it, r, st) { if (!caseOn(st)) return; const P = mapper(sc, it, r), p = P(0, -23, 80); glow(ctx, p.x, p.y, 100 * P.s, "255,214,140", 0.22); } } : {}),
    }, id === "figstand_case");
  }
  return { STANDS, isStand, isFigure, figures, figsOf, onStands, slotName, scaleOf, foot, open, get view() { return view; } };
})();
