// きろく（UI-71。オーナーの FB 2026-10-03「実績をもっと細かくしてほしい。例えば図鑑のところで、食べた回数をみれたり、
// ステータスでトイレの回数、なでなでの回数、おねだりの回数とおねだりを聞いてもらえた回数、釣りの回数、先頭の回数など。」）。
// ・3人 それぞれの きろく（Save.d.records.kids[id]）: たべた・だいすきな もの・デザの おねだり → もらえた・おねがい → いいよ → かなった・
//   トイレ・なでなで・ぎゅー・つった さかな（せんとうの とき）・せんとうに なった・せんとうで たたかった・たおした まもの・とくぎ
// ・たべものごとの かず（Save.d.records.food[たべもの][子]）→ ずかんの「たべもの」（よく たべた じゅん・だれが なんかい・だいすき／にがて）
// ・みんなの きろく: バトル（かち・まけ・にげた）・つり・おてつだい・もらった コイン・おねがい・おれいの しな・トイレ・ごはん（まえの セーブの かずも つかう）
// 「先頭の回数」は バトル（戦闘）の かず と せんとう（れつの いちばん まえ）に なった かず の どちらとも とれる ので 両方 のせる。
// セーブ: Save.d.records = { since, kids: {}, food: {}, battle: { fled, lost } }（Save.fresh に たす だけ・SCHEMA は 2 の まま）。
// 3人の きろくは この 機能が はいった 日（since）から かぞえる。
const PlayRecords = {
  // ようすの「きろく」の ひょう: [みだし, [[なまえ, キー, たんい]...]]
  ROWS: [
    ["たべる", [["たべた", "ate", "かい"], ["だいすきな もの", "fav", "かい"], ["デザの おねだり", "deza", "かい"], ["おねだりを きいて もらえた", "dezaYes", "かい"]]],
    ["おねがい", [["おねがいした", "ask", "かい"], ["いいよ って いって もらえた", "yes", "かい"], ["かなえて もらえた", "done", "かい"]]],
    ["おうち", [["トイレ", "toilet", "かい"], ["なでなで", "pat", "かい"], ["ぎゅー", "hug", "かい"]]],
    ["おでかけ", [["つった さかな", "fish", "ひき"], ["せんとうに なった", "lead", "かい"], ["せんとうで たたかった", "leadBattle", "かい"], ["たおした まもの", "ko", "ひき"], ["とくぎを つかった", "skill", "かい"]]],
  ],
  get KEYS() { return this.ROWS.flatMap(([, r]) => r.map((x) => x[1])); },
  st() {
    const d = Save.d;
    if (!d.records || typeof d.records !== "object" || Array.isArray(d.records)) d.records = {};
    const r = d.records;
    for (const k of ["kids", "food"]) if (!r[k] || typeof r[k] !== "object" || Array.isArray(r[k])) r[k] = {};
    if (!r.battle || typeof r.battle !== "object" || Array.isArray(r.battle)) r.battle = {};
    for (const k of ["fled", "lost"]) if (!(r.battle[k] >= 0)) r.battle[k] = 0;
    if (!r.since) r.since = U.today();
    return r;
  },
  kid(id) {
    const r = this.st();
    if (!r.kids[id] || typeof r.kids[id] !== "object" || Array.isArray(r.kids[id])) r.kids[id] = {};
    const k = r.kids[id];
    for (const key of this.KEYS) if (!(Number.isFinite(k[key]) && k[key] >= 0)) k[key] = 0;
    return k;
  },
  add(id, key, n = 1) {
    if (!Save.d || !Save.d.chars || !Save.d.chars[id] || !this.KEYS.includes(key)) return 0;
    const k = this.kid(id); k[key] = Math.floor(k[key] + n); Save.mark();
    return k[key];
  },
  get(id, key) { return this.kid(id)[key] || 0; },
  // たべた（Care.feed の あと）
  ate(id, food) {
    if (!BAG_INDEX[food] || BAG_INDEX[food].kind !== "food" || !Save.d.chars[id]) return;
    const r = this.st(), f = r.food[food] && typeof r.food[food] === "object" && !Array.isArray(r.food[food]) ? r.food[food] : (r.food[food] = {});
    f[id] = (Number(f[id]) || 0) + 1;
    this.add(id, "ate");
    if (CHARA_INFO[id] && CHARA_INFO[id].like.includes(food)) this.add(id, "fav");
  },
  foodCount(food, id = null) { const f = this.st().food[food]; if (!f || typeof f !== "object") return 0; return id ? Number(f[id]) || 0 : Chara.IDS.reduce((a, k) => a + (Number(f[k]) || 0), 0); },
  // みんなの きろく（[なまえ, ことば]）
  team() {
    const d = Save.d, s = d.stats || {}, b = this.st().battle, n = (v) => U.fmt(Math.max(0, Math.floor(Number(v) || 0)));
    const out = [["バトル", `${n(s.battles)}かい（かち ${n(s.wins)}・まけ ${n(b.lost)}・にげた ${n(b.fled)}）`]];
    if (typeof Fishing !== "undefined" && Fishing.data()) { const f = Fishing.st(); out.push(["つった さかな", `${n(f.caught)}ひき（${n(Object.keys(f.dex || {}).length)}しゅるい）`]); }
    out.push(["おてつだい", `${n(s.shifts)}かい（パーフェクト ${n(s.perfects)}）`], ["もらった コイン", `${n(s.coinsEarned)}コイン`], ["ごはんを あげた", `${n(s.fed)}かい`]);
    if (d.wish) out.push(["おねがいを かなえた", `${n(d.wish.n)}かい` + (typeof WishGifts !== "undefined" ? `（おれいの しな ${n(WishGifts.count())}こ）` : "")]);
    if (d.toilet && Number.isFinite(d.toilet.n)) out.push(["トイレ（3にんで）", `${n(d.toilet.n)}かい`]);
    return out;
  },
  since() { const p = String(this.st().since).split("-"); return p.length === 3 ? `${+p[1]}がつ ${+p[2]}にち` : ""; },

  // ---- すまほの「ようす」: うえの タブで「ようす」と「きろく」----
  view(el, base) {
    const tabs = U.el("div", { class: "tabs rec-tabs" }), box = U.el("div", { class: "rec-box" });
    box.dataset.recBox = "1";
    const show = (k) => {
      this.tab = k; tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
      box.replaceChildren();
      if (k === "rec") this.table(box); else base(box);
    };
    for (const [k, label] of [["status", "ようす"], ["rec", "きろく"]]) {
      const b = U.el("button", { class: "tab", text: label }); b.dataset.k = k;
      b.addEventListener("click", () => { Sound.se("tap"); show(k); });
      tabs.append(b);
    }
    el.append(tabs, box);
    show(this.tab === "rec" ? "rec" : "status");
  },
  table(el) {
    const ids = Save.d.order.filter((id) => Save.d.chars[id]);
    const t = U.el("table", { class: "rec-table" }), head = U.el("tr");
    head.append(U.el("th", { class: "rec-lb", text: "" }));
    for (const id of ids) {
      const c = Save.d.chars[id], th = U.el("th", { class: "rec-who" });
      th.innerHTML = `<span class="rec-face">${Chara.svg(id, { color: c.color, outfit: c.outfit, face: "happy" })}</span><span class="rec-nm"></span>`;
      th.querySelector(".rec-nm").textContent = c.name; head.append(th);
    }
    t.append(head);
    for (const [title, rows] of this.ROWS) {
      const tr = U.el("tr", { class: "rec-sec" }), td = U.el("td", { text: title }); td.colSpan = ids.length + 1; tr.append(td); t.append(tr);
      for (const [label, key, unit] of rows) {
        const r = U.el("tr", { class: "rec-row" }); r.dataset.key = key;
        r.append(U.el("td", { class: "rec-lb", text: label }));
        const vals = ids.map((id) => this.get(id, key)), top = Math.max(...vals);
        ids.forEach((id, i) => r.append(U.el("td", { class: "rec-v" + (top > 0 && vals[i] === top ? " top" : ""), html: `${U.fmt(vals[i])}<small>${unit}</small>` })));
        t.append(r);
      }
    }
    el.append(t, U.el("p", { class: "muted rec-since", text: `3にんの きろくは ${this.since()}から かぞえて いるよ。` }));
    const team = U.el("div", { class: "rec-team" });
    team.append(U.el("div", { class: "rec-team-ttl", text: "みんなの きろく" }));
    for (const [k, v] of this.team()) { const row = U.el("div", { class: "rec-team-row" }); row.append(U.el("span", { text: k }), U.el("b", { text: v })); team.append(row); }
    el.append(team);
  },

  // ---- ずかんの「たべもの」----
  foods() { return FOODS.filter((f) => BAG_INDEX[f.id] && BAG_INDEX[f.id].kind === "food"); },
  foodDex(el) {
    const list = this.foods(), eaten = list.filter((f) => this.foodCount(f.id) > 0), total = list.reduce((a, f) => a + this.foodCount(f.id), 0);
    el.append(U.el("div", { class: "note", html: `たべた たべもの ${eaten.length} / ${list.length}しゅ・ぜんぶで ${U.fmt(total)}かい` }));
    const sort = U.el("div", { class: "tabs rec-sort" }), grid = U.el("div", { class: "grid rec-foods" });
    const draw = (mode) => {
      this.foodSort = mode; sort.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === mode));
      const L = mode === "most" ? [...list].sort((a, b) => this.foodCount(b.id) - this.foodCount(a.id)) : list;
      grid.replaceChildren();
      for (const f of L) {
        const n = this.foodCount(f.id), card = U.el("button", { class: "card rec-food" + (n ? "" : " lock"), "data-id": f.id, "aria-label": `${f.name} ${n}かい` });
        card.innerHTML = `<span class="ico">${Art.iconSvg("bag", f.id)}</span><span class="rec-food-nm"></span><span class="muted rec-food-n">${n ? `${U.fmt(n)}かい` : "まだ"}</span>`;
        card.querySelector(".rec-food-nm").textContent = f.name;
        card.addEventListener("click", () => { Sound.se("tap"); this.foodCard(f); });
        grid.append(card);
      }
    };
    for (const [k, label] of [["most", "よく たべた じゅん"], ["list", "ふつうの じゅん"]]) {
      const b = U.el("button", { class: "tab", text: label }); b.dataset.k = k;
      b.addEventListener("click", () => { Sound.se("tap"); draw(k); });
      sort.append(b);
    }
    el.append(sort, grid);
    draw(this.foodSort === "list" ? "list" : "most");
  },
  foodCard(f) {
    const body = U.el("div", { class: "rec-food-card" }), n = this.foodCount(f.id);
    body.innerHTML = `<div class="rec-food-art">${Art.iconSvg("bag", f.id)}</div><div class="rec-food-ttl"></div><p class="rec-food-desc"></p><div class="rec-food-gain">${typeof FoodBalance !== "undefined" ? FoodBalance.gainHtml(f) : ""}</div><div class="rec-food-total"></div><div class="rec-food-kids"></div>`;
    body.querySelector(".rec-food-ttl").textContent = f.name;
    body.querySelector(".rec-food-desc").textContent = f.desc || "";
    body.querySelector(".rec-food-total").textContent = n ? `3にんで ${U.fmt(n)}かい たべたよ` : "まだ たべて いないよ";
    const kids = body.querySelector(".rec-food-kids");
    for (const id of Save.d.order) {
      const c = Save.d.chars[id], info = CHARA_INFO[id], like = info.like.includes(f.id), dis = !!f.spicy || info.dislike.includes(f.id);
      const row = U.el("div", { class: "rec-food-kid" });
      row.innerHTML = `<span class="rec-face">${Chara.svg(id, { color: c.color, outfit: c.outfit, face: like ? "love" : dis ? "sad" : "happy" })}</span><span class="rec-kid-nm"></span><b>${U.fmt(this.foodCount(f.id, id))}かい</b>${like ? '<i class="rec-like">だいすき</i>' : dis ? '<i class="rec-dis">にがて</i>' : ""}`;
      row.querySelector(".rec-kid-nm").textContent = c.name;
      kids.append(row);
    }
    let m = null;
    m = UI.modal({ title: f.name, body, cls: "rec-food-panel", footer: UI.btn("とじる", () => { Sound.se("cancel"); if (m) m.close(); }, "wide") });
    return m;
  },
  // PokaDebug
  state() {
    const r = this.st();
    return JSON.parse(JSON.stringify({ since: r.since, kids: Object.fromEntries(Chara.IDS.map((id) => [id, this.kid(id)])), food: r.food, battle: r.battle, team: this.team() }));
  },
};

// くみこみ（ほかの ファイルの きまった ところの あと）
(() => {
  const wrap = (obj, name, fn) => {
    if (!obj || typeof obj[name] !== "function") return;
    const base = obj[name];
    obj[name] = function (...a) { return fn.call(this, base, a); };
  };
  const safe = (f) => { try { f(); } catch (e) { console.error(e); } };
  // ごはん（デザの おねだり・もらえた）
  wrap(Care, "feed", function (base, a) {
    const [id, item] = a, c = Save.d.chars[id], want = !!(c && c.wantsDeza), it = BAG_INDEX[item];
    const r = base.apply(this, a);
    if (r) safe(() => {
      if (!it || it.kind !== "food") return;
      PlayRecords.ate(id, item);
      if (it.deza && want) PlayRecords.add(id, "dezaYes");
      if (!want && c && c.wantsDeza) PlayRecords.add(id, "deza");
    });
    return r;
  });
  // トイレ
  if (typeof HomeToilet !== "undefined") wrap(HomeToilet, "done", function (base, a) { const r = base.apply(this, a); safe(() => PlayRecords.add(a[0], "toilet")); return r; });
  // なでなで（おうちで タップ）
  if (SCENES.house) wrap(SCENES.house.prototype, "pet", function (base, a) { const r = base.apply(this, a); safe(() => a[0] && PlayRecords.add(a[0].id, "pat")); return r; });
  // つり（そのとき せんとうの 子）
  if (typeof Fishing !== "undefined") wrap(Fishing, "record", function (base, a) { const r = base.apply(this, a); safe(() => PlayRecords.add(Save.d.order[0], "fish")); return r; });
  // バトル: せんとうで たたかった・たおした・とくぎ・にげた・まけ
  const BP = typeof BattleScene !== "undefined" ? BattleScene.prototype : null;
  if (BP) {
    wrap(BP, "enter", function (base, a) { safe(() => PlayRecords.add(Save.d.order[0], "leadBattle")); return base.apply(this, a); });
    wrap(BP, "hit", async function (base, a) {
      const [u, d] = a, was = !!(d && d.alive);
      const r = await base.apply(this, a);
      safe(() => { if (was && !d.alive && (this.foes || []).includes(d) && u && Save.d.chars[u.id]) PlayRecords.add(u.id, "ko"); });
      return r;
    });
    wrap(BP, "useSkill", function (base, a) { safe(() => a[0] && Save.d.chars[a[0].id] && PlayRecords.add(a[0].id, "skill")); return base.apply(this, a); });
    wrap(BP, "endFlee", function (base, a) { safe(() => { PlayRecords.st().battle.fled++; Save.mark(); }); return base.apply(this, a); });
    wrap(BP, "defeat", function (base, a) { safe(() => { PlayRecords.st().battle.lost++; Save.mark(); }); return base.apply(this, a); });
  }
  // すまほの「ようす」に「きろく」の タブ
  const status0 = Menu.status;
  Menu.status = function (el) {
    if (el && el.dataset && el.dataset.recBox) return status0.call(Menu, el); // 「せんとうに する」・「なまえ」の あとの かきなおし
    PlayRecords.view(el, (box) => status0.call(Menu, box));
  };
})();
