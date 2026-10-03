// UI-58: けいば ちゅうけい コーナーの まど（しゅつばひょうと ばけんを かう・はらいもどし・あそびかた・けいば しんぶん・けっか）。
// ・しゅつばひょう: レースの タブ（1R〜12R・はじまった レースは「おわり」）→ うまの ひょう（わく・ばんごう・なまえ・せい・とし・きんりょう・きゃくしつ・ぜんそう・
//   たんしょうの オッズ・にんき・しんぶんの しるし）。したで しきべつ（8しゅ）・かいかた（ふつう／ボックス）・うまを タップ・まいすう → かう。
//   うまたん・3れんたん の ふつうは タップした じゅんばんが 1ちゃく・2ちゃく・3ちゃく。わくれんは わくの ボタン。
// ・ことばは ひらがな（しきべつの なまえも ひらがな）。ボタンは 44px いじょう。
const KeibaUI = (() => {
  const R = KeibaRules, K = KeibaRace, C = () => KeibaCorner;
  const NOTE = "ほんものの ばけんは 20さいに なってから。ここでは ゲームの コインだけで あそぶよ。";
  const chip = (no, waku, cls = "") => { const W = R.WAKU[waku] || R.WAKU[1], e = U.el("span", { class: "kb-chip " + cls, text: String(no) }); e.style.background = W.c; e.style.color = W.t; return e; };
  const keyText = (t, k) => (R.BY[t].ord ? k.split(">").join(" → ") : k.split("-").join(" - "));
  const coin = (n) => U.fmt(n) + " コイン";
  const odds1 = (v) => (v == null ? "-" : v >= 100 ? v.toFixed(0) : v.toFixed(1));
  const view = { open: null, no: 0, t: "tan", m: "one", sel: [], u: 1, msg: "" };

  // ---- しゅつばひょう・ばけんを かう ----
  const card = (no, opts = {}) => new Promise((resolve) => {
    const day = C().today();
    Object.assign(view, { open: "card", no: no || C().next() || 1, t: "tan", m: "one", sel: [], u: 1, msg: "", look: !!opts.view });
    const body = U.el("div", { class: "kb-card" });
    let m = null;
    const render = () => {
      const no = view.no, h = K.head(day, no), rc = K.race(day, no), run = C().runToday(no), mine = C().ticketsOf(day, no), b = K.board(rc, C().open());
      const races = U.el("div", { class: "kb-races" });
      for (let i = 1; i <= 12; i++) { const bt = UI.btn(i + "R", () => { if (view.no === i) return; view.no = i; view.sel = []; Sound.se("tap"); render(); }, "small" + (i === no ? " yellow" : "") + (C().runToday(i) ? " done" : "")); bt.dataset.no = i; races.append(bt); }
      const head = U.el("div", { class: "kb-head" });
      head.append(U.el("b", { text: K.title(h) }), U.el("span", { text: K.course(h) + "・" + h.going + "・" + h.n + "とう・" + h.post + " はっそう" + (run ? "（おわり）" : "") }));
      const list = U.el("div", { class: "kb-list" });
      list.append(U.el("div", { class: "kb-row kb-th", html: "<i>うま</i><i>なまえ</i><i>オッズ</i><i>にんき</i>" }));
      const T = R.BY[view.t], rowPick = !view.look && !run && !T.byWaku;
      for (const hh of rc.horses) {
        const r = U.el("div", { class: "kb-row" + (rowPick ? " pick" : "") + (view.sel.includes(hh.no) && !T.byWaku ? " on" : "") }); r.dataset.no = hh.no;
        const o = b[hh.no - 1], ord = T.ord && view.m === "one" && T.n > 1 ? view.sel.indexOf(hh.no) : -1;
        const nm = U.el("div", { class: "kb-name" }); nm.append(U.el("b", { text: hh.name }), U.el("small", { text: hh.sexName + hh.age + "・" + hh.kg + "・" + hh.styleName + "・" + (hh.last ? "ぜんそう " + hh.last + "ちゃく" : "はじめて") }));
        r.append(chip(hh.no, hh.waku), nm, U.el("span", { class: "kb-odds", text: odds1(o.odds) }), U.el("span", { class: "kb-pop", text: o.pop + (rc.marks[hh.no] ? " " + rc.marks[hh.no] : "") }));
        if (ord >= 0) r.append(U.el("em", { class: "kb-ord", text: ord + 1 + "ちゃく" }));
        if (rowPick) r.addEventListener("click", () => pick(hh.no, rc));
        list.append(r);
      }
      const parts = [races, head, list];
      if (view.look) parts.push(UI.btn("ばけんを かう", () => { view.look = false; Sound.se("tap"); render(); }, "yellow kb-go"));
      else if (run) parts.push(U.el("p", { class: "kb-hint", text: "この レースは もう はじまったよ。けっかは「けっかの ボード」や はらいもどしきで みてね。" }));
      else parts.push(betPanel(rc, mine));
      if (mine.length) { const tl = U.el("div", { class: "kb-mine" }); tl.append(U.el("b", { text: "この レースの ばけん（" + mine.reduce((a, t) => a + t.keys.length * t.u, 0) + "まい）" })); for (const t of mine) tl.append(ticketEl(t, rc)); parts.push(tl); }
      parts.push(U.el("p", { class: "kb-note", text: NOTE }));
      body.replaceChildren(...parts);
      if (m) m.setTitle("しゅつばひょう " + no + "R");
    };
    const pick = (hno, rc) => {
      const T = R.BY[view.t], i = view.sel.indexOf(hno);
      if (i >= 0) view.sel.splice(i, 1);
      else if (T.n > 1 && view.m === "one" && view.sel.length >= T.n) { UI.toast(T.n + "とう まで えらべるよ（はずす ときは もう いちど タップ）"); return; }
      else view.sel.push(hno);
      Sound.se("tap"); render();
    };
    const betPanel = (rc, mine) => {
      const T = R.BY[view.t], p = U.el("div", { class: "kb-bet" });
      const types = U.el("div", { class: "kb-types" });
      for (const tt of R.TYPES) { const why = R.sold(tt.id, rc.n), bt = UI.btn(tt.name, () => { if (why) { UI.toast(why); return; } view.t = tt.id; view.sel = []; if (tt.n === 1 || tt.byWaku) view.m = "one"; Sound.se("tap"); render(); }, "small" + (tt.id === view.t ? " yellow" : "") + (why ? " off" : "")); bt.dataset.t = tt.id; types.append(bt); }
      p.append(types, U.el("p", { class: "kb-desc", text: T.desc + "（はらいもどし りつ " + (T.rate / 10).toFixed(1) + "%）" }));
      if (T.n > 1 && !T.byWaku) {
        const mt = U.el("div", { class: "kb-method" });
        for (const [k, nm] of [["one", "ふつう"], ["box", "ボックス"]]) { const bt = UI.btn(nm, () => { view.m = k; view.sel = []; Sound.se("tap"); render(); }, "small" + (view.m === k ? " yellow" : "")); bt.dataset.m = k; mt.append(bt); }
        p.append(mt);
      }
      const hint = T.byWaku ? "わくの ボタンを 2つ タップ（おなじ わくに 2とう いる ときは おなじ わくを 2かい）" : T.n === 1 ? "うまを タップ（いくつでも。1とうずつ 1てん）" : view.m === "box" ? "うまを " + T.n + "とう いじょう タップ。えらんだ うまの くみあわせ ぜんぶ" : T.ord ? "うまを タップした じゅんばんが " + (T.n === 2 ? "1ちゃく・2ちゃく" : "1ちゃく・2ちゃく・3ちゃく") : "うまを " + T.n + "とう タップ";
      p.append(U.el("p", { class: "kb-hint", text: hint }));
      if (T.byWaku) {
        const cnt = R.wakuCounts(rc.n), wk = U.el("div", { class: "kb-waku" });
        for (let w = 1; w <= 8; w++) {
          const W = R.WAKU[w], n = view.sel.filter((x) => x === w).length, bt = UI.btn(w + "わく" + (n ? " ×" + n : ""), () => {
            // えらんで いない わく → たす／えらんだ わく → おなじ わくに 2とう いて まだ 1つ なら もう 1つ（ゾロめ）・ほかは はずす
            if (!n) { if (view.sel.length >= 2) { UI.toast("わくは 2つ まで（はずす ときは もう いちど タップ）"); return; } view.sel.push(w); }
            else if (n === 1 && cnt[w] >= 2 && view.sel.length < 2) view.sel.push(w);
            else view.sel.splice(view.sel.indexOf(w), 1);
            Sound.se("tap"); render();
          }, "small" + (n ? " on" : ""));
          bt.style.background = W.c; bt.style.color = W.t; bt.dataset.w = w; if (!cnt[w]) bt.disabled = true; wk.append(bt);
        }
        p.append(wk);
      }
      // まいすう・ごうけい・オッズ
      const keys = R.expand(view.t, view.sel, view.m, rc.n), n = keys.length, cost = n * view.u * R.UNIT;
      const units = U.el("div", { class: "kb-units" });
      units.append(UI.btn("−", () => { view.u = Math.max(1, view.u - 1); Sound.se("tap"); render(); }, "small round"), U.el("b", { text: "1てん " + view.u + "まい（" + coin(view.u * R.UNIT) + "）" }), UI.btn("＋", () => { view.u = Math.min(C().MAXU, view.u + 1); Sound.se("tap"); render(); }, "small round"));
      p.append(units);
      let od = "";
      if (n === 1 && !R.BY[view.t].multi) { const vm = K.votes(rc, view.t, C().open()), v = R.odds(view.t, vm, keys[0], K.total(vm)); od = v ? "・オッズ " + odds1(v) + "ばい" : ""; }
      else if (n === 1) { const vm = K.votes(rc, view.t, C().open()), rg = R.range(view.t, vm, keys[0], K.total(vm), rc.n); od = rg ? "・オッズ " + odds1(rg.lo) + "〜" + odds1(rg.hi) + "ばい" : ""; }
      p.append(U.el("div", { class: "kb-sum", text: n ? n + "てん × " + view.u + "まい = " + coin(cost) + od : "まだ えらんで いないよ" }));
      p.append(U.el("div", { class: "kb-coins", text: "もって いる コイン: " + U.fmt(Save.d.coins) + "・この レースは あと " + (C().CAP - C().spentOn(view.no)) + "まい" }));
      const buyBtn = UI.btn("かう", async () => {
        const r = C().buy(view.no, view.t, view.sel, view.m, view.u);
        if (r.err) { Sound.se("bad"); UI.toast(r.err); return; }
        Sound.se("buy"); if (typeof UI.updateHud === "function") UI.updateHud();
        UI.toast("ばけんを かったよ！ " + C().ticketText(r.ticket) + "（" + coin(r.ticket.cost) + "）");
        view.sel = []; view.u = 1; render();
      }, "yellow kb-buy" + (n ? "" : " off"));
      p.append(buyBtn);
      return p;
    };
    render();
    m = UI.modal({ title: "しゅつばひょう " + view.no + "R", body, cls: "full kb-panel", onClose: () => { view.open = null; resolve(); } });
  });

  // ばけん 1まいの 絵（DOM）
  const ticketEl = (t, rc) => {
    const e = U.el("div", { class: "kb-ticket " + t.st }), T = R.BY[t.t];
    const head = U.el("div", { class: "kb-tk-head" }); head.append(U.el("b", { text: "ぽかぽか けいば" }), U.el("span", { text: t.no + "R" + (rc ? " " + rc.name : "") }));
    e.append(head, U.el("div", { class: "kb-tk-type", text: T.name + (t.m === "box" ? " ボックス" : "") }), U.el("div", { class: "kb-tk-sel", text: C().selText(t) }), U.el("div", { class: "kb-tk-cost", text: t.keys.length + "てん × " + t.u + "まい = " + coin(t.cost) }));
    const stamp = t.st === "hit" ? "あたり " + coin(t.pay) : t.st === "paid" ? "うけとりずみ " + coin(t.pay) : t.st === "miss" ? "はずれ" : "まだ";
    e.append(U.el("i", { class: "kb-stamp", text: stamp }));
    return e;
  };

  // ---- はらいもどしの ひょう ----
  const payTable = (rc, pays) => {
    const tb = U.el("div", { class: "kb-pays" });
    for (const tt of R.TYPES) {
      const p = pays[tt.id], row = U.el("div", { class: "kb-pay" });
      row.append(U.el("b", { text: tt.name }));
      const cell = U.el("div", { class: "kb-pay-v" });
      if (!p || !p.sold) cell.append(U.el("span", { class: "kb-none", text: "うって いない" }));
      else for (const w of p.wins) { const ln = U.el("div"); ln.append(U.el("span", { class: "kb-key", text: keyText(tt.id, w.key) }), U.el("span", { class: "kb-yen", text: w.per ? coin(w.per) + (p.toku ? "（とくべつ ばらい）" : "") : "かった ひと なし" }), U.el("small", { text: w.per ? w.pop + "ばん にんき" : "" })); cell.append(ln); }
      row.append(cell); tb.append(row);
    }
    return tb;
  };
  const topThree = (rc) => {
    const res = K.result(rc), box = U.el("div", { class: "kb-top" });
    res.order.slice(0, 3).forEach((no, i) => { const h = rc.horses[no - 1], r = U.el("div", { class: "kb-top-row" }); r.append(U.el("b", { text: i + 1 + "ちゃく" }), chip(no, h.waku), U.el("span", { text: h.name }), U.el("small", { text: i ? res.margins[i] : K.fmtTime(res.time[0]) })); box.append(r); });
    return box;
  };

  // ---- レースの あと（ちゅうけいの がめんから）----
  const result = (rc, set) => new Promise((resolve) => {
    view.open = "result";
    const body = U.el("div", { class: "kb-result" });
    body.append(U.el("p", { class: "kb-lead", text: K.title(rc) + "　" + K.course(rc) }), topThree(rc), U.el("h4", { text: "はらいもどし（100コイン あたり）" }), payTable(rc, set.pays));
    const mine = set.tickets;
    if (mine.length) {
      body.append(U.el("h4", { text: "あなたの ばけん" }));
      const tl = U.el("div", { class: "kb-mine" }); for (const t of mine) tl.append(ticketEl(t, rc)); body.append(tl);
    }
    const won = C().unpaid().reduce((a, t) => a + t.pay, 0);
    body.append(U.el("p", { class: "kb-sumline", text: mine.length ? (set.won ? "あたり！ " + coin(set.won) + " もどって くるよ" : "こんどは はずれ…。つぎの レースで がんばろう") : "ばけんは かって いなかったよ。つぎは かって みよう" }));
    const foot = U.el("div", { class: "kb-foot" });
    let m = null;
    if (won > 0) foot.append(UI.btn("はらいもどしを うける（" + coin(won) + "）", () => { const r = C().claim(); Sound.se("coin"); if (typeof UI.updateHud === "function") UI.updateHud(); UI.toast(coin(r.sum) + " うけとったよ！", "good"); m.close(); }, "yellow kb-claim"));
    foot.append(UI.btn("コーナーへ もどる", () => m.close(), "kb-back"));
    m = UI.modal({ title: "レースの けっか", body, cls: "full kb-panel", footer: foot, closable: false, onClose: () => { view.open = null; resolve(); } });
  });

  // ---- はらいもどしき ----
  const refund = () => new Promise((resolve) => {
    view.open = "refund";
    const body = U.el("div", { class: "kb-refund" }), hits = C().unpaid(), open = C().open(), sum = hits.reduce((a, t) => a + t.pay, 0);
    body.append(U.el("p", { class: "kb-lead", text: hits.length ? "あたった ばけんが " + hits.length + "まい あるよ。あわせて " + coin(sum) + "。" : "あたった ばけんは いま ないよ。" }));
    if (hits.length) { const tl = U.el("div", { class: "kb-mine" }); for (const t of hits) tl.append(ticketEl(t, K.race(t.day, t.no))); body.append(tl); }
    if (open.length) { body.append(U.el("h4", { text: "まだ はしって いない レースの ばけん" })); const tl = U.el("div", { class: "kb-mine" }); for (const t of open) tl.append(ticketEl(t, K.race(t.day, t.no))); body.append(tl); }
    const d = C().st(); body.append(U.el("p", { class: "kb-stats", text: "これまで: ばけん " + d.bets + "まい・つかった コイン " + U.fmt(d.spent) + "・もどった コイン " + U.fmt(d.won) + "・いちばん おおきい あたり " + U.fmt(d.best) }));
    const foot = U.el("div", { class: "kb-foot" }); let m = null;
    if (sum > 0) foot.append(UI.btn("はらいもどしを うける", () => { const r = C().claim(); Sound.se("coin"); if (typeof UI.updateHud === "function") UI.updateHud(); UI.toast(coin(r.sum) + " うけとったよ！", "good"); m.close(); }, "yellow kb-claim"));
    foot.append(UI.btn("とじる", () => m.close(), "kb-back"));
    m = UI.modal({ title: "はらいもどしき", body, cls: "kb-panel", footer: foot, onClose: () => { view.open = null; resolve(); } });
  });

  // ---- あそびかた（マークカードの だい）----
  const help = () => new Promise((resolve) => {
    view.open = "help";
    const body = U.el("div", { class: "kb-help" });
    body.append(U.el("p", { class: "kb-lead", text: "ばけんを かって、おおがた ビジョンで レースを みよう。あたったら はらいもどしきで コインが もどるよ。" }));
    const tb = U.el("div", { class: "kb-types-help" });
    for (const tt of R.TYPES) { const r = U.el("div", { class: "kb-help-row" }); r.append(U.el("b", { text: tt.name }), U.el("span", { text: tt.desc }), U.el("small", { text: (tt.rate / 10).toFixed(1) + "%" })); tb.append(r); }
    body.append(U.el("h4", { text: "しきべつ（ばけんの しゅるい）" }), tb);
    const rules = [
      "1まい 100コイン。1てんに 10まい まで、1つの レースで 30まい（3000コイン）まで かえるよ。",
      "はらいもどしは みんなの かけた コインを わける しくみ。うりあげの うち「はらいもどし りつ」の ぶんを、あたった ばけんで わけるよ。にんきの ない うまほど たくさん もどる。",
      "100コイン あたりで 10コイン みまんは きりすて。100コインの ままに なる ときは 110コイン（プラス10）。",
      "だれも かって いない くみあわせが きたら、その しきべつを かった ぜんいんに 100コイン あたり 70コイン（とくべつ ばらい）。",
      "ふくしょうは 7とう いかの レースでは 2ちゃく まで。わくれんは 9とう いじょうの レースで うるよ。",
      "わくの いろ（きしゅの ぼうし）: 1 しろ・2 くろ・3 あか・4 あお・5 きいろ・6 みどり・7 オレンジ・8 ピンク。",
      "レースは おおがた ビジョンで みた とき（または つぎの ひ）に しめきり。あたった ばけんは いつでも うけとれるよ。",
    ];
    body.append(U.el("h4", { text: "きまり" }));
    for (const s of rules) body.append(U.el("p", { class: "kb-rule", text: s }));
    const w = U.el("div", { class: "kb-wakus" }); for (let i = 1; i <= 8; i++) w.append(chip(i, i)); body.append(w);
    body.append(U.el("p", { class: "kb-note", text: NOTE }));
    UI.modal({ title: "けいばの あそびかた", body, cls: "full kb-panel", onClose: () => { view.open = null; resolve(); } });
  });

  // ---- けいば しんぶん（きょうの ばんぐみ・けっか）----
  const news = () => new Promise((resolve) => {
    view.open = "news";
    const day = C().today(), d = C().sync(), body = U.el("div", { class: "kb-news" });
    body.append(U.el("p", { class: "kb-lead", text: K.COURSE.name + "（" + K.COURSE.dir + "）・" + K.dayInfo(day).weather + "・ばば " + K.dayInfo(day).going }));
    for (const h of K.card(day)) {
      const rc = K.race(day, h.no), top = Object.entries(rc.marks).find(([, mk]) => mk === "◎"), run = d.run[h.no], r = U.el("div", { class: "kb-news-row" + (run ? " done" : "") });
      const hi = d.hist.find((x) => x.day === day && x.no === h.no);
      r.append(U.el("b", { text: h.no + "R" }), U.el("span", { class: "kb-news-t", text: h.post }), U.el("div", { class: "kb-news-n", html: "" }));
      r.lastChild.append(U.el("b", { text: h.name + (h.grade ? "（" + h.grade + "）" : "") }), U.el("small", { text: K.course(h) + "・" + h.n + "とう" + (top ? "・◎ " + top[0] + "ばん " + rc.horses[top[0] - 1].name : "") }));
      r.append(U.el("span", { class: "kb-news-s", text: run ? (hi ? hi.order.join("-") : "おわり") : h.no === C().next() ? "つぎ" : "" }));
      body.append(r);
    }
    body.append(U.el("p", { class: "kb-note", text: "しんぶんの しるし: ◎ いちばん つよそう・○ つぎ・▲ 3ばんめ・△ ちゅうい。あたるとは かぎらないよ。" }));
    UI.modal({ title: "けいば しんぶん", body, cls: "full kb-panel", onClose: () => { view.open = null; resolve(); } });
  });

  // ---- けっかの ボード（さいごに はしった レース）----
  const lastResult = () => new Promise((resolve) => {
    view.open = "board";
    const d = C().sync(), h = d.hist[d.hist.length - 1], body = U.el("div", { class: "kb-result" });
    if (!h) body.append(U.el("p", { class: "kb-lead", text: "まだ はしった レースは ないよ。おおがた ビジョンで ちゅうけいを みてね。" }));
    else {
      const rc = K.race(h.day, h.no), mine = d.tickets.filter((t) => t.day === h.day && t.no === h.no), pays = K.payouts(rc, mine);
      body.append(U.el("p", { class: "kb-lead", text: K.title(rc) + "　" + K.course(rc) }), topThree(rc), U.el("h4", { text: "はらいもどし（100コイン あたり）" }), payTable(rc, pays));
    }
    UI.modal({ title: "けっかの ボード", body, cls: "full kb-panel", onClose: () => { view.open = null; resolve(); } });
  });

  // PokaDebug: ひらいて いる まどの ようす
  const state = () => {
    const wrap = document.querySelector(".modal-wrap:not(.out) .kb-panel");
    return { open: view.open, no: view.no, t: view.t, m: view.m, sel: view.sel.slice(), u: view.u, rows: wrap ? wrap.querySelectorAll(".kb-row:not(.kb-th)").length : 0, sum: wrap && wrap.querySelector(".kb-sum") ? wrap.querySelector(".kb-sum").textContent : "", tickets: wrap ? [...wrap.querySelectorAll(".kb-ticket")].map((e) => e.className.replace("kb-ticket ", "")) : [] };
  };
  return { NOTE, card, result, refund, help, news, lastResult, ticketEl, payTable, keyText, view, state };
})();
