// コラボ グッズ（ごわが〔ごじ・がちゃん・わんこ〕× ミニゲーム）の しくみ。オーナーの FB 2026-09-30。
// あそんだ スコアの ごうけい（つみたて）が めやすに とどくと、その ゲーム だけの 服・家具を もらえる（1かいの スコアでは とどかない 大きな めやす）。
// ライン（なかよしパズル など）ごとに Save.d.collab[ライン] = { total: つみたて, got: { id: もらった 日 } }。
// はじめて よむ ときの つみたては line.seed()（まえからの きろく: パズルは ベスト）から はじめる（まえから あそんで いる 人も ゼロから に ならない）。
// 服は WEAR_ITEMS（Save.d.wardrobe）、家具は FURNITURE（Save.d.furn・FurnModels の 立体）。どちらも おみせに ならばない（exclusive）。
const CollabGoods = {
  LINES: {},
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
  // ラインの きろく（なければ つくる）
  state(lineId) {
    const d = Save.d, L = this.LINES[lineId];
    if (!d.collab || typeof d.collab !== "object") d.collab = {};
    let st = d.collab[lineId];
    if (!st || typeof st !== "object") st = d.collab[lineId] = { total: Math.max(0, Math.round((L && L.seed ? L.seed() : 0) || 0)), got: {} };
    if (!Number.isFinite(st.total) || st.total < 0) st.total = 0;
    if (!st.got || typeof st.got !== "object") st.got = {};
    return st;
  },
  total(lineId) { return this.state(lineId).total; },
  find(id) { for (const L of Object.values(this.LINES)) { const it = L.items.find((x) => x.id === id); if (it) return { line: L, item: it }; } return null; },
  has(id) { const x = this.find(id); return !!x && !!this.state(x.line.id).got[id]; },
  next(lineId) { const st = this.state(lineId); return this.LINES[lineId].items.find((it) => !st.got[it.id]) || null; },
  // スコアを つみたてて、とどいた グッズを わたす（わたした ものの ならびを かえす）
  add(lineId, points, day = U.today()) {
    const L = this.LINES[lineId], st = this.state(lineId), add = Math.max(0, Math.round(points) || 0), out = [];
    st.total = Math.min(1e9, st.total + add);
    for (const it of L.items) {
      if (st.total < it.need || st.got[it.id]) continue;
      st.got[it.id] = String(day); this.give(it); out.push(it);
    }
    if (add || out.length) Save.mark();
    return out;
  },
  give(it) { if (it.kind === "wear") Save.d.wardrobe[it.id] = true; else Save.d.furn[it.id] = (Save.d.furn[it.id] || 0) + 1; },
  pic(it) { return it.kind === "wear" ? Art.iconSvg("wear", it.id) : Art.furnSvg(it.id); },
  // ずかんの ヒント
  source(id) { const x = this.find(id); return x ? `${x.line.game}で あそんだ スコアの ごうけいが ${U.fmt(x.item.need)}${x.line.unit}に とどくと もらえる コラボ グッズ だよ。` : ""; },

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
    const L = this.LINES[lineId], st = this.state(lineId), nx = this.next(lineId), box = U.el("div", { class: "collab-box collab-" + lineId });
    const top = nx ? nx.need : L.items[L.items.length - 1].need, k = Math.max(0, Math.min(1, st.total / top));
    box.append(U.el("div", { class: "collab-head", html: `<span class="collab-eyebrow">ごわが × ${L.game}</span><h3>${L.name}</h3>` +
      `<p>${L.lead || "あそんだ スコアを ぜんぶ たして（つみたて）、めやすに とどくと げんていの ふくや かぐが もらえるよ。"}</p>` +
      `<div class="collab-total"><b>つみたて ${U.fmt(st.total)} ${L.unit}</b><span>${nx ? `つぎ「${nx.name}」まで あと ${U.fmt(nx.need - st.total)} ${L.unit}` : "ぜんぶ そろったよ！"}</span></div>` +
      `<div class="collab-meter"><i style="width:${(k * 100).toFixed(1)}%"></i></div>` }));
    for (const it of L.items) box.append(this.card(it, !!st.got[it.id], Math.max(0, it.need - st.total)));
    box.append(U.el("p", { class: "collab-note", text: "コラボ グッズは おみせでは かえない。ふくは「きがえ」、かぐは「もようがえ」で つかえるよ。" }));
    return box;
  },
  // けっかの まどに だす: いまの つみたて・もらった グッズ・つぎ
  result(lineId, got = [], added = 0) {
    const L = this.LINES[lineId], st = this.state(lineId), nx = this.next(lineId), box = U.el("div", { class: "collab-result" });
    box.append(U.el("p", { class: "collab-result-total", text: `コラボ つみたて +${U.fmt(added)} → ${U.fmt(st.total)} ${L.unit}` }));
    if (got.length) { box.append(U.el("strong", { text: "コラボ グッズを もらったよ！" })); for (const it of got) box.append(this.card(it, true)); }
    box.append(U.el("p", { class: "collab-result-next", text: nx ? `つぎの コラボ グッズ「${nx.name}」まで あと ${U.fmt(nx.need - st.total)} ${L.unit}` : "コラボ グッズ 5しゅ、ぜんぶ そろったよ！" }));
    return box;
  },
};
