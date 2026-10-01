// コラボ グッズ（ごわが〔ごじ・がちゃん・わんこ〕× ミニゲーム）の しくみ。オーナーの FB 2026-09-30。
// めやすに とどくと、その ゲーム だけの 服・家具を もらえる。ラインごとに 2つの かぞえかた:
// ・つみたて（なかよしパズル）: あそんだ スコアの ごうけい。Save.d.collab[ライン] = { total: つみたて, got: { id: もらった 日 } }。
//   はじめて よむ ときの つみたては line.seed()（まえからの きろく: パズルは ベスト）から はじめる（まえから あそんで いる 人も ゼロから に ならない）。
// ・1かいの スコア（mode: "best"・ころころ フルーツ。オーナーの FB 2026-10-01「コロコロフルーツの景品が積立になっているが、そうでなく、
//   一度の達成ポイントにしてくれ」）: 1かいで めやすに とどくと もらえる。{ best: いままでの 1かいの さいこう, mode: "best", got }（まえの total は のこす）。
//   はじめて よむ ときは line.seed()（ハイスコア）から。もう とどいて いる グッズは その とき わたす。
// 服は WEAR_ITEMS（Save.d.wardrobe）、家具は FURNITURE（Save.d.furn・FurnModels の 立体）。どちらも おみせに ならばない（exclusive）。
const CollabGoods = {
  LINES: {},
  pending: {}, // 1かいの スコアの ラインに かえた とき（ハイスコアで もう とどいて いた）に わたした もの
  // line: { id, name（コラボの なまえ）, game（ゲームの なまえ）, unit（"pt" など）, seed(), lead（まとめの せつめい・なくても よい）, items: [{ id, need, kind: "wear" | "furn", name, desc, sleep（ベッド）, … }] }
  register(line) {
    this.LINES[line.id] = line;
    for (const it of line.items) {
      it.line = line.id;
      if (it.kind === "wear") {
        const w = { id: it.id, name: it.name, slot: it.slot, wear: it.wear, col: it.col, price: 0, rare: true, exclusive: "collab", collab: line.id, st: it.st || { sp: 2 }, desc: it.desc };
        WEAR_ITEMS.push(w); ITEM_INDEX[it.id] = w;
      } else {
        const f = { id: it.id, name: it.name, price: 0, rare: true, exclusive: "collab", collab: line.id, kind: "floor", w: it.w, depth: it.depth, h: it.h, comfort: it.comfort || 8, interactive: true, desc: it.desc };
        if (it.sleep) f.sleep = it.sleep; // ベッド（おうちの「ねる」で ごきげんが ふえる）
        FURNITURE.push(f); FURN_INDEX[it.id] = f;
        FURN_ART[it.id] = () => HomeDesign.model(it.id).full;
      }
    }
    return line;
  },
  best(L) { return !!L && L.mode === "best"; },
  // ラインの きろく（なければ つくる）
  state(lineId) {
    const d = Save.d, L = this.LINES[lineId], seed = () => Math.max(0, Math.round((L && L.seed ? L.seed() : 0) || 0));
    if (!d.collab || typeof d.collab !== "object") d.collab = {};
    let st = d.collab[lineId];
    if (!st || typeof st !== "object") st = d.collab[lineId] = this.best(L) ? { best: 0, got: {} } : { total: seed(), got: {} };
    if (!this.best(L) && (!Number.isFinite(st.total) || st.total < 0)) st.total = 0;
    if (!st.got || typeof st.got !== "object") st.got = {};
    if (this.best(L)) {
      if (!Number.isFinite(st.best) || st.best < 0) st.best = 0;
      // つみたての まえの きろく・はじめて よむ とき: ハイスコアから。もう とどいて いる グッズは いま わたす
      // （わたした ものは つぎの add() の けっかにも のせる: さいしょの けっかの まどで「もらったよ」）
      if (st.mode !== "best") { st.mode = "best"; st.best = Math.max(st.best, seed()); this.pending[lineId] = this.reach(L, st, st.best); }
    }
    return st;
  },
  // 1かいの スコアで とどいた グッズを わたす（わたした ものの ならび）
  reach(L, st, score, day = U.today()) {
    const out = [];
    for (const it of L.items) {
      if (score < it.need || st.got[it.id]) continue;
      st.got[it.id] = String(day); this.give(it); out.push(it);
    }
    if (out.length) Save.mark();
    return out;
  },
  // めやすと くらべる かず（つみたて か 1かいの さいこう）
  total(lineId) { const L = this.LINES[lineId], st = this.state(lineId); return this.best(L) ? st.best : st.total; },
  find(id) { for (const L of Object.values(this.LINES)) { const it = L.items.find((x) => x.id === id); if (it) return { line: L, item: it }; } return null; },
  has(id) { const x = this.find(id); return !!x && !!this.state(x.line.id).got[id]; },
  next(lineId) { const st = this.state(lineId); return this.LINES[lineId].items.find((it) => !st.got[it.id]) || null; },
  // スコアを つみたてて（1かいの スコアの ラインは さいこうを おぼえて）、とどいた グッズを わたす（わたした ものの ならびを かえす）
  add(lineId, points, day = U.today()) {
    const L = this.LINES[lineId], st = this.state(lineId), add = Math.max(0, Math.round(points) || 0), out = [];
    if (this.best(L)) {
      if (add > st.best) { st.best = Math.min(1e9, add); Save.mark(); }
      const before = this.pending[lineId] || []; this.pending[lineId] = [];
      return [...before, ...this.reach(L, st, add, day)];
    }
    st.total = Math.min(1e9, st.total + add);
    for (const it of L.items) {
      if (st.total < it.need || st.got[it.id]) continue;
      st.got[it.id] = String(day); this.give(it); out.push(it);
    }
    if (add || out.length) Save.mark();
    return out;
  },
  give(it) { if (it.kind === "wear") WearStock.add(it.id, 1); else Save.d.furn[it.id] = (Save.d.furn[it.id] || 0) + 1; },
  pic(it) { return it.kind === "wear" ? Art.iconSvg("wear", it.id) : Art.furnSvg(it.id); },
  // ずかんの ヒント
  source(id) {
    const x = this.find(id); if (!x) return "";
    return this.best(x.line) ? `${x.line.game}の スコア モードで 1かいに ${U.fmt(x.item.need)}${x.line.unit} いじょう とると もらえる コラボ グッズ だよ。`
      : `${x.line.game}で あそんだ スコアの ごうけいが ${U.fmt(x.item.need)}${x.line.unit}に とどくと もらえる コラボ グッズ だよ。`;
  },

  // ---- 画面 ----
  // グッズ 1つの カード（own: もって いる・left: あと なん てん）
  card(it, own, left = 0) {
    const L = this.LINES[it.line];
    return U.el("div", { class: "collab-card" + (own ? " own" : ""), "data-collab": it.id, html:
      `<div class="collab-art">${this.pic(it)}</div><div class="collab-text"><span class="collab-need">${U.fmt(it.need)} ${L.unit}・${it.kind === "wear" ? "ふく" : "かぐ"}</span>` +
      `<strong>${it.name}</strong><p>${it.desc}</p><small>${own ? "もって いるよ" : `あと ${U.fmt(left)} ${L.unit}`}</small></div>` });
  },
  // うけつけに だす まとめ: つみたての メーターと グッズの カード
  section(lineId) {
    const L = this.LINES[lineId], st = this.state(lineId), nx = this.next(lineId), box = U.el("div", { class: "collab-box collab-" + lineId }), now = this.total(lineId), best = this.best(L);
    const top = nx ? nx.need : L.items[L.items.length - 1].need, k = Math.max(0, Math.min(1, now / top));
    box.append(U.el("div", { class: "collab-head", html: `<span class="collab-eyebrow">ごわが × ${L.game}</span><h3>${L.name}</h3>` +
      `<p>${L.lead || "あそんだ スコアを ぜんぶ たして（つみたて）、めやすに とどくと げんていの ふくや かぐが もらえるよ。"}</p>` +
      `<div class="collab-total"><b>${best ? "1かいの さいこう" : "つみたて"} ${U.fmt(now)} ${L.unit}</b><span>${nx ? (best ? `つぎ「${nx.name}」は 1かいで ${U.fmt(nx.need)} ${L.unit}` : `つぎ「${nx.name}」まで あと ${U.fmt(nx.need - now)} ${L.unit}`) : "ぜんぶ そろったよ！"}</span></div>` +
      `<div class="collab-meter"><i style="width:${(k * 100).toFixed(1)}%"></i></div>` }));
    for (const it of L.items) box.append(this.card(it, !!st.got[it.id], Math.max(0, it.need - now)));
    box.append(U.el("p", { class: "collab-note", text: "コラボ グッズは おみせでは かえない。ふくは「きがえ」、かぐは「もようがえ」で つかえるよ。" }));
    return box;
  },
  // けっかの まどに だす: いまの つみたて・もらった グッズ・つぎ
  result(lineId, got = [], added = 0) {
    const L = this.LINES[lineId], st = this.state(lineId), nx = this.next(lineId), box = U.el("div", { class: "collab-result" }), best = this.best(L);
    box.append(U.el("p", { class: "collab-result-total", text: best ? `コラボ: こんかい ${U.fmt(added)} ${L.unit}（1かいの さいこう ${U.fmt(st.best)} ${L.unit}）` : `コラボ つみたて +${U.fmt(added)} → ${U.fmt(st.total)} ${L.unit}` }));
    if (got.length) { box.append(U.el("strong", { text: "コラボ グッズを もらったよ！" })); for (const it of got) box.append(this.card(it, true)); }
    const left = nx ? (best ? `つぎの コラボ グッズ「${nx.name}」は 1かいで ${U.fmt(nx.need)} ${L.unit}（あと ${U.fmt(Math.max(0, nx.need - added))} ${L.unit}）` : `つぎの コラボ グッズ「${nx.name}」まで あと ${U.fmt(nx.need - st.total)} ${L.unit}`) : "コラボ グッズ 5しゅ、ぜんぶ そろったよ！";
    box.append(U.el("p", { class: "collab-result-next", text: left }));
    return box;
  },
};
