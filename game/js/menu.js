// メニュー（ようす・もちもの・ずかん・せってい）
const Menu = {
  open(tab = "status") {
    Sound.se("ok");
    const body = U.el("div");
    const tabs = U.el("div", { class: "tabs menu-tabs" });
    const content = U.el("div");
    const T = [["status", "ようす"], ["map", "ちず"], ["bag", "もちもの"], ["dex", "ずかん"], ["settings", "せってい"]];
    const m = UI.modal({ title: "メニュー", body, cls: "full" });
    this.m = m;
    const show = (k) => {
      tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
      content.innerHTML = "";
      this[k](content, m);
    };
    for (const [k, label] of T) {
      const b = U.el("button", { class: "tab", text: label });
      b.dataset.k = k;
      b.addEventListener("click", () => { Sound.se("tap"); show(k); });
      tabs.append(b);
    }
    body.append(tabs, content);
    show(tab);
    // フィールドでは「まちに かえる」
    const sc = G.scene;
    if (sc instanceof WorldScene) {
      const back = UI.btn("おうちへ", async () => {
        if (await UI.confirm("3にんで おうちに かえる？")) { m.close(); Game.goto("house", {}, "circle"); }
      }, "small");
      m.el.querySelector(".panel-head").insertBefore(back, m.el.querySelector(".close"));
    }
  },

  map(el) { el.append(UI.btn("きせつの おまつり",()=>Seasonal.open(),"wide")); WorldAtlas.render(el); },
  status(el) {
    const d = Save.d;
    d.order.forEach((id, idx) => {
      const c = d.chars[id];
      const card = U.el("div", { class: "chara-card" });
      const por = U.el("div", { class: "portrait", html: Chara.svg(id, { outfit: c.outfit, color: c.color, face: c.hunger < 25 || c.mood < 25 ? "sad" : "happy" }) });
      const need = Stats.expNeed(c.lv);
      const info = U.el("div", { class: "info" });
      const mhp = Stats.max(id, "hp"), msp = Stats.max(id, "sp");
      info.innerHTML = `
        <div class="nm">${c.name} <span class="lv">Lv.${c.lv}</span> <span class="muted">${CHARA_INFO[id].role}</span></div>
        <div class="stat-row"><span>HP</span>${UI.meter(c.hp, mhp, "hp")}<span>${Math.max(0, c.hp)}/${mhp}</span></div>
        <div class="stat-row"><span>SP</span>${UI.meter(c.sp, msp, "sp")}<span>${c.sp}/${msp}</span></div>
        <div class="stat-row"><span>けいけん</span>${UI.meter(c.exp, need, "exp")}<span>${need - c.exp}</span></div>
        <div class="stat-row"><span>おなか</span>${UI.meter(c.hunger, 100, "hunger")}<span>${Math.round(c.hunger)}</span></div>
        <div class="stat-row"><span>ごきげん</span>${UI.meter(c.mood, 100, "mood")}<span>${Math.round(c.mood)}</span></div>
        <div class="stat-row"><span>なかよし</span>${UI.meter(c.bond, 100, "bond")}<span>${Math.round(c.bond)}</span></div>
        <div class="stat-nums"><span>こうげき ${Stats.max(id, "atk")}</span><span>ぼうぎょ ${Stats.max(id, "def")}</span><span>すばやさ ${Stats.max(id, "spd")}</span></div>
        <div class="muted" style="margin-top:6px">とくぎ: ${Stats.skills(id).map((s) => SKILLS[s].name).join("・")}</div>`;
      const row = U.el("div", { class: "row wrap", style: "margin-top:8px" });
      if (idx > 0) row.append(UI.btn("せんとうに する", () => { Sound.se("ok"); d.order.splice(idx, 1); d.order.unshift(id); Save.mark(); this.refreshScene(); el.innerHTML = ""; this.status(el); }, "small"));
      row.append(UI.btn("なまえ", () => this.rename(id, el), "small"));
      info.append(row);
      card.append(por, info);
      el.append(card);
    });
    el.append(U.el("div", { class: "note", html: `コイン: <b>${U.fmt(d.coins)}</b>　／　バトル しょうり ${d.stats.wins}かい　／　おてつだい ${d.stats.shifts}かい` }));
  },
  async rename(id, el) {
    const c = Save.d.chars[id];
    const n = await UI.input(`${c.name} の あたらしい なまえ（6もじまで）`, c.name, { max: 6 });
    // 名前は あちこちで innerHTML に入るので、HTML の記号は取りのぞく
    const name = (n || "").replace(/[<>&"'`]/g, "").trim().slice(0, 6);
    if (name) { c.name = name; Save.mark(); el.innerHTML = ""; this.status(el); }
  },
  refreshScene() {
    const sc = G.scene;
    if (sc instanceof WorldScene) { sc.preload(); }
  },

  bag(el) {
    const d = Save.d;
    const ids = Object.keys(d.bag).filter((k) => d.bag[k] > 0 && BAG_INDEX[k]);
    if (!ids.length) { el.append(U.el("div", { class: "note", text: "もちものは からっぽ。スーパーで かえるよ。" })); return; }
    const grid = U.el("div", { class: "grid" });
    for (const k of ids) {
      const it = BAG_INDEX[k];
      const card = U.el("button", { class: "card", html: `<span class="cnt">×${d.bag[k]}</span>${UI.icon("bag", k, 44)}<div>${it.name}</div><div class="muted">${it.desc || ""}</div>` });
      card.addEventListener("click", async () => {
        Sound.se("tap");
        if (it.escape) { UI.toast("バトルの ときに つかえるよ"); return; }
        const who = await UI.ask(`${it.name}を だれに つかう？`, [...d.order.map((id) => d.chars[id].name), "やめる"]);
        if (who < 0 || who >= 3) return;
        const id = d.order[who];
        const r = Care.feed(id, k);
        if (r) { Sound.se(it.kind === "food" ? "eat" : "heal"); UI.toast(`${d.chars[id].name}: ${r.text.split("\n")[0]}`); }
        el.innerHTML = ""; this.bag(el);
      });
      grid.append(card);
    }
    el.append(grid);
  },

  dex(el) {
    const d = Save.d;
    const all = Object.keys(ENEMIES);
    const seen = all.filter((k) => d.dex[k]).length;
    el.append(U.el("div", { class: "note", html: `みつけた まもの ${seen} / ${all.length}` }));
    const grid = U.el("div", { class: "grid" });
    for (const k of all) {
      const e = ENEMIES[k], x = d.dex[k];
      const card = U.el("div", { class: "card" + (x ? "" : " lock") });
      if (x) card.innerHTML = `<div class="ico" style="width:72px;height:72px">${Art.enemySvg(e.art, e.col)}</div><div>${e.name}</div><div class="muted">たおした ${x.won || 0}</div>`;
      else card.innerHTML = `<div class="ico" style="width:72px;height:72px;filter:brightness(0) opacity(.25)">${Art.enemySvg(e.art, e.col)}</div><div>？？？</div>`;
      if (x) card.addEventListener("click", () => UI.say([{ name: e.name, face: Art.enemySvg(e.art, e.col), text: e.desc }]));
      grid.append(card);
    }
    el.append(grid);
  },

  settings(el) {
    const s = Save.d.settings;
    const row = (label, key) => {
      const b = UI.btn(`${label}: ${s[key] ? "ON" : "OFF"}`, () => { s[key] = !s[key]; Save.mark(); Sound.applySettings(); b.innerHTML = `${label}: ${s[key] ? "ON" : "OFF"}`; Sound.se("tap"); }, "wide");
      b.style.marginBottom = "8px";
      return b;
    };
    el.append(row("BGM", "bgm"), row("こうかおん", "se"));
    el.append(U.el("div", { class: "note", text: "あそびかた（つぎの バトル・おてつだいから）" }));
    for (const [id, mode] of Object.entries(GameEconomy.modes)) {
      const selected = s.difficulty === id;
      const b = UI.btn(`${selected ? "✓ " : ""}${mode.name} ／ コイン ${Math.round(mode.reward * 100)}%`, () => {
        s.difficulty = id; Save.mark(); Sound.se("ok"); el.innerHTML = ""; this.settings(el);
      }, "wide" + (selected ? " yellow" : ""));
      b.style.marginBottom = "8px"; el.append(b);
    }
    el.append(U.el("div", { class: "muted", text: "のんびり: じかん ながめ・てき よわめ。むずかしい: じかん みじかめ・てき つよめ。" }));
    el.append(UI.btn("いま セーブする", () => { Save.write(); Sound.se("ok"); UI.toast("セーブしました", "good"); }, "wide green"));
    el.append(U.el("div", { class: "note", html: "セーブは じどうでも されます。<br>ホーム画面に 追加すると アプリのように あそべます。" }));
    const del = UI.btn("データを けして はじめから", async () => {
      if (await UI.confirm("ほんとうに データを けす？\n（もとに もどせません）", "けす", "やめる")) {
        Save.reset(); Save.write(); this.m.close(); Game.goto("title", {}, "fade");
      }
    }, "wide");
    del.style.marginTop = "18px"; del.style.background = "#FFD6D6";
    el.append(del);
    el.append(U.el("div", { class: "muted", style: "margin-top:14px;text-align:center", html: `ぽかぽかタウン ver ${GAME_VERSION}<br>キャラクター: わんこ・がちゃん・ごじ` }));
  },
};
