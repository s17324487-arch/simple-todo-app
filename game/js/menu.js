// メニュー（≡）: せってい・あそびかた の メタな ものだけ。
// ようす・ちず・もちもの・ずかん は すまほ（js/smaho.js）の アプリから この status / map / bag / dex を よぶ。
const Menu = {
  open(tab = "settings") {
    Sound.se("ok");
    const body = U.el("div");
    const tabs = U.el("div", { class: "tabs menu-tabs" });
    const content = U.el("div");
    const T = [["settings", "せってい"], ["help", "あそびかた"]];
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
    show(T.some(([k]) => k === tab) ? tab : "settings");
  },

  // すまほの「ちず」（おうちへ かえる は すまほが 足す）
  map(el) { WorldAtlas.render(el); },
  // すまほの「ようす」（まいにち スタンプ は スタンプラリー、おみせの ごほうび は ごほうび アプリへ）
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
    // ③ だいじな もの（つりざお）
    const rod = typeof Fishing !== "undefined" && Fishing.rod();
    if (rod) {
      const key = U.el("div", { class: "key-item", html: `${Fishing.rodSvg()}<div><div class="nm"></div><div class="muted">みずを ながおしで なげる。うきが しずんだら「つる」</div></div>` });
      key.querySelector(".nm").textContent = `だいじな もの：${rod.name}`;
      el.append(key);
    }
    // ④ ピッケル
    if (typeof Fossils !== "undefined" && Fossils.data() && Fossils.hasPick()) {
      const key = U.el("div", { class: "key-item", html: `${Fossils.pickSvg()}<div><div class="nm"></div><div class="muted">ひびの ある いわの そばで「ほる」が でるよ</div></div>` });
      key.querySelector(".nm").textContent = `だいじな もの：${Fossils.data().pick.name}`;
      el.append(key);
    }
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

  dex(el, m, kind = this.dexKind || "enemy") {
    // まもの・さかな・かせきに、家具と服のコレクションを並べる。
    const kinds = [["enemy", "まもの"], ...(typeof Fishing !== "undefined" && Fishing.data() ? [["fish", "さかな"]] : []), ...(typeof Fossils !== "undefined" && Fossils.data() ? [["fossil", "かせき"]] : []), ["furn", "かぐ"], ["wear", "ふく"]];
    if (!kinds.some(([key]) => key === kind)) kind = "enemy";
    if (kinds.length > 1) {
      const sw = U.el("div", { class: "tabs dex-kinds" });
      sw.style.gridTemplateColumns = `repeat(${kinds.length}, minmax(0, 1fr))`;
      for (const [k, label] of kinds) {
        const b = U.el("button", { class: "tab" + (k === kind ? " on" : ""), text: label });
        b.dataset.k = k;
        b.addEventListener("click", () => { Sound.se("tap"); this.dexKind = k; el.innerHTML = ""; this.dex(el, m, k); });
        sw.append(b);
      }
      el.append(sw);
      if (kind === "fish") return Fishing.dex(el);
      if (kind === "fossil") return Fossils.note(el);
      if (kind === "furn" || kind === "wear") return ItemDex.render(el, kind);
    }
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
      if (x) card.addEventListener("click", () => UI.say([{ name: e.name, face: Art.enemySvg(e.art, e.col), text: `${e.desc}\nぞくせい：${BattleElements.types[BattleElements.enemies[k]].name}` }]));
      grid.append(card);
    }
    el.append(grid);
  },

  // ≡ の「あそびかた」
  help(el) {
    const rows = [
      ["すまほ", "ひだり したの「すまほ」（キーボードは Esc）で ちず・ようす・もちもの・ずかん・イベント・スタンプラリー・ひんと・うらない が ひらけるよ。"],
      ["いどう", "タップした ところへ 3にんで あるくよ。ドラッグすると スティックに なるよ。"],
      ["はなす", "「！」の ある ひとの となりで タップ。キーボードは z か Enter。"],
      ["おてつだい", "おみせで おてつだいすると コインが もらえるよ。○ が おおいと ディスクも みつかるかも。"],
      ["おうち", "ごはん・あそぶ・きがえ・もようがえ。ぱぱと ままは 9じ〜18じ おしごと だよ。"],
      ["バトル", "まものに ふれると バトル。HPが へったら おうちで ねよう。"],
    ];
    for (const [h, text] of rows) { const r = U.el("div", { class: "help-row" }); r.append(U.el("b", { text: h }), U.el("p", { text })); el.append(r); }
  },

  settings(el, menu = this.m) {
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
    el.append(UI.btn("セーブを かきだす",()=>SaveBackup.exportUI(),"wide"));
    const restore=UI.btn("セーブを よみこむ",()=>SaveBackup.importUI(),"wide");restore.disabled=!SaveBackup.canImport();el.append(restore);
    const del = UI.btn("データを けして はじめから", async () => {
      if (await UI.confirm("ほんとうに データを けす？\n（もとに もどせません）", "けす", "やめる")) {
        Save.reset(); Save.write(); this.m.close(); Game.goto("title", {}, "fade");
      }
    }, "wide");
    del.style.marginTop = "18px"; del.style.background = "#FFD6D6";
    el.append(del);
    const version = U.el("button", { type: "button", class: "menu-version muted", html: `ネリカスタウン ver ${GAME_VERSION}<br>キャラクター: わんこ・がちゃん・ごじ` });
    const hidden = U.el("div");
    let taps = 0, first = 0, last = 0, unlocked = false;
    version.addEventListener("click", () => {
      if (unlocked) return;
      const now = performance.now();
      if (!taps || now - last > 1500 || now - first > 6000) { taps = 0; first = now; }
      last = now;
      if (++taps < 7) return;
      unlocked = true;
      const entry = UI.btn("かんりしゃ コマンド", () => this.admin(menu), "wide admin-entry");
      hidden.append(entry); Sound.se("ok"); entry.scrollIntoView({ block: "nearest" });
    });
    el.append(version, hidden);
  },

  admin(parent) {
    const save = Save.d, body = U.el("div"), balance = U.el("div", { class: "note" });
    let running = false, closed = false;
    const panel = UI.modal({ title: "かんりしゃ コマンド", body, cls: "admin-commands", onClose: () => { closed = true; } });
    const available = () => ["house", "world"].includes(G.sceneName);
    const commands = [
      { label: "おかねを 99,999にする", question: () => `おかねを ${U.fmt(save.coins)} → 99,999 コインに する？`, apply: () => { save.coins = 99999; } },
      { label: "3にんの HP・SPを ぜんかいふく", question: () => "3にんの HP・SPを ぜんかいふくする？", care: true, apply: () => Save.healAll() },
      { label: "おなか・ごきげんを 100にする", question: () => "3にんの おなか・ごきげんを 100に する？", care: true, apply: () => {
        for (const id of Chara.IDS) { save.chars[id].hunger = 100; save.chars[id].mood = 100; }
      } },
    ];
    const buttons = [];
    const refresh = () => {
      balance.textContent = `いまの おかね：${U.fmt(save.coins)} コイン`;
      buttons.forEach((button, i) => { button.disabled = running || (commands[i].care && !available()); });
    };
    body.append(balance);
    for (const command of commands) {
      const button = UI.btn(command.label, async () => {
        if (running || closed || button.disabled) return;
        running = true; refresh();
        try {
          if (!await UI.confirm(command.question(), "じっこう", "やめる")) return;
          if (closed || Save.d !== save || !parent.el.isConnected || parent.el.closest(".out") || (command.care && !available())) return;
          command.apply(); Save.mark(); Save.write(); UI.updateHud(); G.scene?.updateCare?.();
          Sound.se("ok"); UI.toast("へんこうして セーブしたよ", "good");
        } finally { running = false; refresh(); }
      }, "wide");
      buttons.push(button); body.append(button);
    }
    if (!available()) body.append(U.el("div", { class: "note", text: "かいふくは おうちや まちで つかえるよ。" }));
    body.append(U.el("div", { class: "note", text: "じっこうすると じどうで セーブするよ。\nメニューを とじると コマンドは かくれるよ。" }), UI.btn("もどる", () => panel.close(), "wide"));
    refresh();
  },
};
