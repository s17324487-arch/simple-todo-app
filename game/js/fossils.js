// ④ 化石ほり（docs/design/features/fossils の 見本 tools/feature-design/fossils-ref.js の FossilRef を 移した もの）。
// 1番: 骨の あつまりぐあい（progress は 見本と おなじ）・骨を もつ・メニューの「かせき ノート」。
// ほる しくみ（rocks・pick・Dig）と 画面（drawDig・rockSvg・pickSvg）は 2番で 足す。データは FOSSIL_DATA（自動生成）、セーブは Save.d.fossil。
const Fossils = {
  data() { return typeof FOSSIL_DATA !== "undefined" ? FOSSIL_DATA : null; },
  dino(id) { return ((this.data() || {}).dinos || []).find((d) => d.id === id) || null; },
  st() { return Save.d.fossil; },
  // ある 恐竜の 骨が いくつ そろったか（own: { "trex.skull": もって いる 数 }）
  progress(dino, own) { const n = dino.art.parts.filter((p) => own[dino.id + "." + p.id]).length; return { n, total: dino.art.parts.length, done: n === dino.art.parts.length }; },
  // もって いる 部品の id（FossilArt.svg の have に わたす）
  have(dino) { const own = this.st().bones; return dino.art.parts.filter((p) => own[dino.id + "." + p.id]).map((p) => p.id); },
  // 骨の id「<恐竜>.<部品>」→ { dino, part }
  bone(key) { const [id, pid] = String(key).split("."), d = this.dino(id), p = d && d.art.parts.find((x) => x.id === pid); return p ? { dino: d, part: p } : null; },
  give(key, n = 1) { const st = this.st(); st.bones[key] = (st.bones[key] || 0) + n; Save.mark(); },
  total() { return this.data().dinos.reduce((a, d) => a + d.art.parts.length, 0); },
  count() { return this.data().dinos.reduce((a, d) => a + this.have(d).length, 0); },

  // ---- かせき ノート（メニューの「ずかん」→「かせき」。見本 img/dig-flow.png の ⑤）----
  // ない 骨は 点線の かげ。そろった 恐竜に「そろった！」。はくぶつかん（⑤）が できるまでは その ことを 言わない
  note(el) {
    const museum = !!(typeof MAP_DEFS !== "undefined" && MAP_DEFS.museum);
    el.append(U.el("div", { class: "muted fossil-sum", text: `あつめた ほね ${this.count()} / ${this.total()}。` + (museum ? "そろった きょうりゅうは はくぶつかんで くみたてられるよ。" : "ほねが ぜんぶ そろうと きょうりゅうが かんせい！") }));
    const grid = U.el("div", { class: "fossil-note" });
    for (const d of this.data().dinos) {
      const h = this.have(d), done = h.length === d.art.parts.length, c = U.el("div", { class: "fossil-cell" + (done ? " done" : "") });
      c.dataset.id = d.id;
      c.innerHTML = `${FossilArt.svg(d, { have: h })}<div class="nm"></div><div class="cnt">${done ? "そろった！" : `ほね ${h.length}/${d.art.parts.length}`}</div>`;
      c.querySelector(".nm").textContent = h.length ? d.name : "？？？";
      if (h.length) c.addEventListener("click", () => { Sound.se("tap"); this.detail(d.id); });
      grid.append(c);
    }
    el.append(grid);
  },
  // くわしい ページ: 骨格・じだい・ばしょ・おおきさ・たべもの・あつまりぐあい・説明・まめちしき
  detail(id) {
    const d = this.dino(id); if (!d) return null;
    const h = this.have(d); if (!h.length) return null;
    const body = U.el("div", { class: "bone-card fossil-detail" });
    body.innerHTML = `<div class="art">${FossilArt.svg(d, { have: h })}</div><div class="nm"></div><div class="dn"></div>`
      + `<div class="facts"><span>いた じだい</span><span></span><span>みつかった ところ</span><span></span><span>おおきさ</span><span>${d.len}m</span><span>たべもの</span><span></span><span>ほね</span><span>${h.length} / ${d.art.parts.length}</span></div>`
      + `<div class="desc"></div><div class="fact"><b>まめちしき</b><span></span></div>`;
    const cells = body.querySelectorAll(".facts span");
    body.querySelector(".nm").textContent = d.name; body.querySelector(".dn").textContent = d.ago;
    cells[1].textContent = d.era; cells[3].textContent = d.where; cells[7].textContent = d.food;
    body.querySelector(".desc").textContent = d.desc; body.querySelector(".fact span").textContent = d.fact;
    return UI.modal({ title: d.name, body });
  },
};
