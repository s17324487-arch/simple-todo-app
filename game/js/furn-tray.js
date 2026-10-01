// もようがえの 一覧を ひろげる・さがす（UI-37）。オーナーの FB 2026-10-01「模様替えの時にもっている家具が増えると、探しにくい。
// スライド操作で家具一覧の画面の面積を増やせるなど工夫してほしい」:
// ・いちらんの うえの ところ（つまみ・タブの よこ・いごこちの ぎょう）を うえに スライドすると ひろがる（ちいさい 1れつ → はんぶん → ほぼ ぜんぶ）。
//   した に スライドすると もどる。「ひろく ▲」の ボタンでも ひろがる。
// ・ひろげると なまえで さがす・ならびかえ（あたらしい・なまえ・いごこち）・しゅるいの ボタン（あかり・ラグ・かべ・すわる・つくえ・おもちゃ・みどり・いろいろ・とくべつ）。
// ・ひろげた まま かぐを えらぶと へやに おいて、ちいさく もどる（おいた ところが 見える）。
// セーブは ふやさない: ひろさ・しゅるい・ならびは あそんで いる あいだだけ おぼえる。
// 「あたらしい じゅん」は Save.d.furn の キーの じゅん（はじめて てに いれた じゅん）を うしろから ならべる。
const FurnTray = (() => {
  const CATS = [
    ["all", "ぜんぶ"], ["light", "あかり"], ["rug", "ラグ"], ["wall", "かべ"], ["sit", "すわる・ねる"], ["table", "つくえ・たな"],
    ["toy", "おもちゃ"], ["plant", "みどり"], ["misc", "いろいろ"], ["special", "とくべつ"],
  ];
  const SORTS = [["new", "あたらしい じゅん"], ["name", "なまえ じゅん"], ["comfort", "いごこち じゅん"]];
  // 家具の しゅるい（f.cat が あれば それ。なければ id と なまえから）。1つの 家具が いくつかの しゅるいに はいっても よい
  const RE = {
    light: /lamp|light|lantern|chandelier|candle|planet|ランプ|ライト|あかり|ちょうちん|ランタン|シャンデリア|キャンドル|ろうそく|プラネタリウム|灯/i,
    sit: /bed|sofa|chair|stool|cushion|bench|swing|kotatsu|mushroom|blanket|ベッド|ソファ|いす|イス|チェア|スツール|クッション|ベンチ|ざぶとん|こたつ|ブランコ|ブランケット|ふとん/i,
    table: /table|desk|shelf|wardrobe|console|cart|cabinet|kitchen|vanity|counter|figstand|ワゴン|テーブル|つくえ|デスク|たな|だな|クローゼット|コンソール|キッチン|ドレッサー|カウンター|ケース|ラック|ライブラリー|机/i,
    toy: /plush|teddy|figure|toy|mascot|chibi|train|rockinghorse|tent|ぬいぐるみ|フィギュア|おもちゃ|マスコット|もくば|きしゃ|テント|メリーゴーランド|アーケード|ボールプール/i,
    plant: /plant|flower|tree|cactus|bonsai|hydrangea|bamboo|sasa|terrarium|しょくぶつ|はな|ツリー|はち|サボテン|ぼんさい|みどり|テラリウム|ささ|かどまつ/i,
  };
  // まちがえやすい ことば（「グランプリ」の なかの ランプ・「たなばた」の たな・「はなび」の はな など）は さきに けす
  const NOT = { light: /グランプリ/g, table: /たなばた/g, plant: /はなび|はなかんむり|おはなみ/g };
  const FIGURE = (f) => !!(f.figure || f.gachaPrize || f.burgerToy);
  const SPECIAL = (f) => !!(f.rare || f.exclusive || f.shopPrize || f.puzzlePrize || f.quizPrize || !(f.price > 0));
  const cache = new Map();
  const cats = (f) => {
    if (cache.has(f.id)) return cache.get(f.id);
    const out = new Set(), own = f.cat ? [].concat(f.cat) : null, text = f.id + " " + f.name;
    // かべ・ラグは その しゅるい だけ。フィギュア・ぬいぐるみの けいひんは おもちゃ
    if (f.kind === "wall") out.add("wall");
    else if (f.kind === "rug") out.add("rug");
    else if (own) own.forEach((c) => out.add(c));
    else if (FIGURE(f)) out.add("toy");
    else {
      for (const k of ["light", "sit", "table", "toy", "plant"]) if (RE[k].test(NOT[k] ? text.replace(NOT[k], "") : text) || (k === "sit" && f.sleep)) out.add(k);
      if (!out.size) out.add("misc");
    }
    if (SPECIAL(f)) out.add("special");
    cache.set(f.id, out);
    return out;
  };
  // なまえで さがす: カタカナは ひらがなに、まんなかの すきまは とる（「べっど」で「ベッド」）
  const norm = (s) => String(s || "").normalize("NFKC").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/[\s・]+/g, "").toLowerCase();
  const collator = typeof Intl !== "undefined" && Intl.Collator ? new Intl.Collator("ja") : null;
  const byName = (a, b) => (collator ? collator.compare(a.name, b.name) : a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  const state = { size: "s", cat: "all", sort: "new", q: "" };
  const SIZES = ["s", "m", "l"];
  let sH = 0; // ちいさい ときの たかさ（はかった もの）

  // ---- 一覧の なかみ ----
  const owned = () => FURNITURE.filter((f) => Room.available(f.id) > 0 && (!HomeGarden.active() || f.kind !== "wall"));
  const list = (st = state) => {
    const ord = new Map(Object.keys(Save.d.furn).map((k, i) => [k, i])), q = norm(st.q);
    let items = owned();
    if (st.cat !== "all") items = items.filter((f) => cats(f).has(st.cat));
    if (q) items = items.filter((f) => norm(f.name).includes(q));
    const sorts = { new: (a, b) => (ord.get(b.id) ?? -1) - (ord.get(a.id) ?? -1), name: byName, comfort: (a, b) => (b.comfort || 0) - (a.comfort || 0) || byName(a, b) };
    return items.slice().sort(sorts[st.sort] || sorts.new);
  };
  const counts = () => {
    const n = Object.fromEntries(CATS.map(([k]) => [k, 0]));
    for (const f of owned()) { n.all++; for (const c of cats(f)) if (c in n) n[c]++; }
    return n;
  };

  // ---- たかさ ----
  const uiH = () => document.getElementById("ui")?.clientHeight || innerHeight;
  const heightOf = (size) => (size === "l" ? uiH() - 64 : size === "m" ? Math.round(uiH() * 0.55) : sH || 190);
  const setHeight = (sc, h) => {
    const e = sc.editUI;
    if (!e) return;
    const lo = sH || 190, hi = heightOf("l"), v = U.clamp(h, lo, hi);
    e.style.height = v <= lo + 2 ? "" : v + "px";
    e.classList.toggle("tall", v > lo + 24);
    sc.layout();
  };
  const apply = (sc) => {
    const e = sc.editUI;
    if (!e) return;
    e.dataset.size = state.size;
    if (state.size === "s") { e.style.height = ""; e.classList.remove("tall"); sH = e.getBoundingClientRect().height || sH; }
    else { e.style.height = heightOf(state.size) + "px"; e.classList.add("tall"); }
    const b = e.querySelector(".ft-size");
    if (b) { b.innerHTML = state.size === "s" ? "▲" : "▼"; b.setAttribute("aria-label", state.size === "s" ? "いちらんを ひろく する" : "いちらんを ちいさく する"); }
    sc.layout();
  };
  const setSize = (sc, size) => {
    if (!SIZES.includes(size) || size === state.size) return false;
    state.size = size;
    sc.renderEditBar();
    return true;
  };
  // ゆびを はなした ところに いちばん ちかい おおきさ（すこし うごかした だけでも うごかした むきへ 1つ すすむ）
  const snap = (sc, h, dy) => {
    const from = state.size, near = SIZES.slice().sort((a, b) => Math.abs(heightOf(a) - h) - Math.abs(heightOf(b) - h))[0];
    let to = near;
    if (to === from && Math.abs(dy) > 30) to = SIZES[U.clamp(SIZES.indexOf(from) + (dy > 0 ? 1 : -1), 0, SIZES.length - 1)];
    if (to === from) apply(sc); else setSize(sc, to);
    Sound.se(to === from ? "tap" : "swish");
  };
  // つまみ・タブの よこ・いごこちの ぎょうで スライド（ボタン・いれる ところは そのまま おせる）。
  // ちいさい ときは カードの ならびを たてに スライドしても ひろがる（よこは いままでどおり ならびを うごかす）
  const bound = new WeakSet(); // renderEditBar の たびに つけなおさない（edit-bar は もようがえの あいだ おなじ もの）
  const drag = (sc, zone) => {
    if (bound.has(zone)) return;
    bound.add(zone);
    zone.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      const inTray = !!ev.target.closest(".tray");
      if (ev.target.closest("input, select, .ft-chips") || (!inTray && ev.target.closest("button")) || (inTray && state.size !== "s")) return;
      const e = sc.editUI, x0 = ev.clientX, y0 = ev.clientY, h0 = e.getBoundingClientRect().height;
      let moved = false;
      // うごきは window で うける（マウスは いちらんの そとへ でても とどく。ゆびは さわった ところに つづけて とどく）
      const move = (m) => {
        if (m.pointerId !== ev.pointerId) return;
        const dy = y0 - m.clientY;
        if (!moved) {
          if (Math.abs(dy) < 8 || (inTray && Math.abs(dy) < Math.abs(m.clientX - x0) * 1.5)) return;
          moved = true; zone.setPointerCapture?.(m.pointerId);
        }
        setHeight(sc, h0 + dy);
      };
      const up = (u) => {
        if (u.pointerId !== ev.pointerId) return;
        removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
        if (!moved) return;
        // スライドの あとの クリックで カードを おかない
        const kill = (c) => { c.stopPropagation(); c.preventDefault(); };
        addEventListener("click", kill, { capture: true, once: true }); setTimeout(() => removeEventListener("click", kill, { capture: true }), 400);
        snap(sc, h0 + (y0 - u.clientY), y0 - u.clientY);
      };
      addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
    });
  };

  // ---- カード ----
  const card = (sc, f) => {
    const c = U.el("button", { class: "card", html: `<span class="cnt">×${Room.available(f.id)}</span>${UI.icon("furn", f.id, 50)}<div class="nm">${f.name}</div>` });
    c.addEventListener("click", async () => {
      state.size = "s";
      await sc.placeNew(f.id);
      if (sc.editUI && sc.editUI.dataset.size !== "s") sc.renderEditBar(); // おけなかった とき（1へや 64こ まで）も ちいさく もどす
    });
    return c;
  };
  const fillTray = (sc, tray) => {
    const items = list();
    tray.replaceChildren();
    if (!owned().length) { tray.append(U.el("div", { class: "note", text: "おける かぐが ないよ。まちの かぐやさんで かえるよ！" })); return; }
    if (!items.length) { tray.append(U.el("div", { class: "note ft-none", text: state.q ? "その なまえの かぐは みつからないよ" : "この しゅるいの かぐは ないよ" })); return; }
    for (const f of items) tray.append(card(sc, f));
  };

  return {
    CATS, SORTS, state, cats, norm, list, counts,
    // scene-house の renderEditBar から: head（タブと おわる）・info（いごこち）・tray（カード）を うけとって つけたす
    build(sc, { head, info, tray, furn }) {
      const e = sc.editUI;
      e.classList.add("ft");
      e.prepend(U.el("div", { class: "ft-pill", "aria-hidden": "true" }));
      // ▲ で ほぼ ぜんぶ・▼ で ちいさく（タブが せまく ならない ように しるし だけ）
      const size = UI.btn(state.size === "s" ? "▲" : "▼", () => { Sound.se("swish"); setSize(sc, state.size === "s" ? "l" : "s"); }, "small ft-size");
      size.setAttribute("aria-label", state.size === "s" ? "いちらんを ひろく する" : "いちらんを ちいさく する");
      head.insertBefore(size, head.lastChild);
      drag(sc, e);
      const parts = [];
      if (furn && state.size !== "s") {
        // なまえで さがす・ならびかえ
        const tools = U.el("div", { class: "ft-tools" });
        const q = U.el("input", { type: "search", class: "ft-q", placeholder: "なまえで さがす", "aria-label": "かぐの なまえで さがす", enterkeyhint: "search" });
        q.value = state.q;
        q.addEventListener("input", () => { state.q = q.value; fillTray(sc, tray); });
        const sort = U.el("select", { class: "ft-sort", "aria-label": "ならびかえ" });
        for (const [k, label] of SORTS) sort.append(U.el("option", { value: k, text: label }));
        sort.value = state.sort;
        sort.addEventListener("change", () => { state.sort = sort.value; Sound.se("tap"); fillTray(sc, tray); });
        tools.append(q, sort);
        // しゅるいの ボタン（0この しゅるいは ださない）
        const chips = U.el("div", { class: "ft-chips", role: "group", "aria-label": "かぐの しゅるい" }), n = counts();
        if (state.cat !== "all" && !n[state.cat]) state.cat = "all";
        for (const [k, label] of CATS) {
          if (k !== "all" && !n[k]) continue;
          const b = U.el("button", { class: "ft-chip" + (state.cat === k ? " on" : ""), html: `${label}<b>${n[k]}</b>` });
          b.dataset.cat = k;
          b.addEventListener("click", () => {
            state.cat = k; Sound.se("tap");
            chips.querySelectorAll(".ft-chip").forEach((x) => x.classList.toggle("on", x.dataset.cat === k));
            fillTray(sc, tray); tray.scrollTop = 0;
          });
          chips.append(b);
        }
        parts.push(tools, chips);
      }
      if (furn) fillTray(sc, tray);
      return parts;
    },
    apply, setSize, setHeight,
    // PokaDebug から
    view(sc) {
      const e = sc?.editUI;
      if (!e) return null;
      const r = e.getBoundingClientRect(), tray = e.querySelector(".tray"), cards = [...e.querySelectorAll(".tray .card")];
      const rows = new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top))).size;
      return { size: state.size, cat: state.cat, sort: state.sort, q: state.q, tall: e.classList.contains("tall"), height: Math.round(r.height), top: Math.round(r.top),
        cards: cards.length, rows, names: cards.slice(0, 12).map((c) => c.querySelector(".nm")?.textContent || ""), total: owned().length,
        chips: [...e.querySelectorAll(".ft-chip")].map((b) => ({ cat: b.dataset.cat, n: Number(b.querySelector("b")?.textContent || 0), on: b.classList.contains("on") })),
        scroll: tray ? { h: tray.scrollHeight, view: tray.clientHeight, w: tray.scrollWidth, vw: tray.clientWidth } : null };
    },
  };
})();
