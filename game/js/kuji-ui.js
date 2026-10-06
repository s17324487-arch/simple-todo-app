// いちばんくじの がめん（ネリカスタウンの コンビニ・UI-55。しくみは js/ichiban-kuji.js・絵は js/kuji-art.js）。
// ボード（けいひんの いちらん・のこり・はりつけ ひょう・ダブルチャンス・クーポン）→ ひく（1まい・10まい・のこり ぜんぶ。1まい 1000コイン）→
// はこから くじを とる → くじけんを めくる（タップ か うえに スライド。めくる まで なにしょうか わからない）→ てんいんさんに わたす →
// D〜Fしょうは のこりから えらぶ → けいひん。さいごの 1まいを ひくと ラストワンしょうも。キラキラの えんしゅつは つけない（UI-50）。
// オンラインの とき（UI-100）は ボードの うえで「ひとりの くじ」と「みんなの くじ」（js/kuji-net.js。オンラインの みんなで おなじ ロット・ほかの 人の けっかが リアルタイムで ならぶ）を えらべる。
const KujiUI = (() => {
  const K = IchibanKuji;
  // けいひんの 絵（1しゅ 1つ・かずが ふえない）
  const URLS = {};
  const url = (id) => URLS[id] || (URLS[id] = U.svgUrl(KujiArt.pic(id)));
  const BOX = {};
  const boxUrl = (s) => BOX[s] || (BOX[s] = U.svgUrl(KujiArt.box(s)));
  const ui = { speed: 1 }; // PokaDebug.kujiFast（えんしゅつの はやさ）
  const wait = (ms) => new Promise((r) => setTimeout(r, ms / Math.max(1, ui.speed)));
  // PokaDebug.kujiUi が みる ようす
  const view = { open: false, store: null, phase: null, mode: "solo", tickets: [], results: [], last: null, dc: null };
  const REACT = {
    wanko: ["わん！ やったー！", "これ だいすき！", "ふかふか だね！"],
    gachan: ["ピヨ！ うれしい！", "だいじに するね！", "ピヨピヨ♪ あたった！"],
    goji: ["ガゥ！ すごい！", "これ ほしかったんだ！", "ガゥガゥ♪ ラッキー！"],
  };
  const short = (it) => it.name.replace(/ ビッグ ぬいぐるみ$/, "");

  function open(s, scene) {
    if (!K.has(s)) return Promise.resolve();
    const S = K.BY[s];
    K.sync(s); Save.write();
    return new Promise((resolve) => {
      const body = U.el("div", { class: "kuji", style: `--kc:${S.color};--kl:${S.light};--kd:${S.dark}` });
      // みんなの くじ（js/kuji-net.js）: オンラインの ときだけ えらべる
      const netOk = () => typeof KujiNet !== "undefined" && KujiNet.available();
      let mode = netOk() && KujiNet.using() ? "net" : "solo", soonT = 0;
      const modal = UI.modal({ title: `${S.shop}の いちばんくじ`, body, cls: "full kuji-panel", onClose: () => { view.open = false; view.phase = null; clearTimeout(soonT); if (typeof KujiNet !== "undefined") KujiNet.unwatch(); if (scene && scene.closed !== true && typeof UI !== "undefined") UI.updateHud(); resolve(); } });
      Object.assign(view, { open: true, store: s, phase: "board", mode, tickets: [], results: [], last: null });
      const board = U.el("div", { class: "kuji-boardview" }), stage = U.el("div", { class: "kuji-stage hidden" });
      body.append(board, stage);
      const keeper = () => Art.npcSvg({ ...NeriShops.SHOPS[s].keeper, emo: "happy" });
      const redraw = (note = "") => (mode === "net" ? drawNet(note) : drawBoard(note));
      // ボードが うごく とき（ほかの 人が ひいた）に スクロールの ばしょを のこす
      const keepScroll = (fn) => { const pb = body.closest(".panel-body"), y = pb ? pb.scrollTop : 0; fn(); if (pb) pb.scrollTop = y; };
      const soon = () => { if (soonT) return; soonT = setTimeout(() => { soonT = 0; if (view.open && view.phase === "board" && mode === "net") keepScroll(() => drawNet()); }, 150); };
      const netWatch = () => KujiNet.watch(s, (kind) => {
        if (!view.open || mode !== "net") return;
        if (kind === "lot") KujiNet.reconcile(s).then((r) => { if (r.adopted || r.got.length) UI.toast("まえに ひいた くじの けいひんを うけとったよ", "good"); soon(); }).catch(() => {});
        soon();
      });
      const setMode = async (m) => {
        if (m === mode || view.phase !== "board") return;
        if (m === "net") {
          if (!netOk()) return;
          if (!KujiNet.st().since && !(await UI.confirm("みんなの くじ に する？\nオンラインの みんなと おなじ くじの はこを ひくよ。ひいた くじ（なんまいめ・じこく・えらんだ しゅるい）を おくるよ。なまえは「みんな」の なまえで でるよ", "みんなの くじ に する", "やめる"))) return;
          if (!view.open || view.phase !== "board") return;
          KujiNet.setMode(true); mode = view.mode = "net"; netWatch();
        } else { KujiNet.setMode(false); KujiNet.unwatch(); mode = view.mode = "solo"; }
        Sound.se("tap"); redraw();
      };
      const modeBar = () => {
        if (!netOk()) return null;
        const bar = U.el("div", { class: "kuji-modes", role: "group", "aria-label": "くじの しゅるい" });
        for (const [m, label] of [["solo", "ひとりの くじ"], ["net", "みんなの くじ"]]) {
          const b = U.el("button", { class: "kuji-mode" + (m === mode ? " on" : ""), text: label, "aria-pressed": m === mode ? "true" : "false" });
          b.dataset.mode = m; b.addEventListener("click", () => setMode(m)); bar.append(b);
        }
        return bar;
      };

      // ---------- ボード ----------
      const card = (id, cls = "", lefts = K.lot(s).left) => {
        const it = K.INDEX[id], left = lefts[id] || 0, all = S.plan[id] || 0;
        const c = U.el("div", { class: `kuji-card ${cls}` + (left <= 0 && all ? " gone" : "") + (K.got(id) ? " got" : "") });
        c.dataset.id = id;
        c.append(U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL[it.grade]}`, text: K.gradeLabel(it.grade) }), U.el("img", { src: url(id), alt: it.name }), U.el("div", { class: "kuji-name", text: short(it) }));
        if (all) c.append(U.el("div", { class: "kuji-left", text: left > 0 ? `のこり ${left}／${all}` : "でたよ" }));
        return c;
      };
      // ボードの ぶぶん（ひとりの くじ と みんなの くじ で おなじ）
      // D〜Iしょう（T: 賞ごとの のこり・lefts: しゅるいごとの のこり）
      const rowsPart = (T, lefts) => {
        const rows = U.el("div", { class: "kuji-rows" });
        for (const g of K.GRADES.slice(3)) {
          const row = U.el("div", { class: "kuji-row" }), all = K.PLAN[g].reduce((a, b) => a + b, 0);
          const head = U.el("div", { class: "kuji-rowhead" });
          head.append(U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL[g]}`, text: K.gradeLabel(g) }), U.el("b", { text: S.cats[g] }), U.el("span", { class: "kuji-left", text: `のこり ${T[g]}／${all}・${K.isPick(g) ? "えらべる" : "なにが でるか おたのしみ"}` }));
          const vars = U.el("div", { class: "vars" });
          for (const id of S.ids[g]) { const n = lefts[id] || 0, v = U.el("div", { class: "kuji-var" + (K.got(id) ? " got" : "") + (K.isPick(g) && !n ? " out" : "") }); v.dataset.id = id; v.append(U.el("img", { src: url(id), alt: K.INDEX[id].name })); if (K.isPick(g)) v.append(U.el("span", { text: `×${n}` })); vars.append(v); }
          row.append(head, vars); rows.append(row);
        }
        return rows;
      };
      // あつめた かず
      const collectPart = () => { const n = K.gotCount(s), full = S.lineup.length; return U.el("div", { class: "kuji-collect" + (K.complete(s) ? " done" : ""), text: K.complete(s) ? `コンプリート！ ${full}しゅ ぜんぶ そろったよ` : `あつめた けいひん ${n}／${full}しゅ（ラストワンしょうも いれて）` }); };
      // はりつけ ひょう（ひいた じゅんに 賞の もじ。ピンクの わくは じぶん）。log: [[賞, じぶんなら 1], …]
      const boardPart = (log, label) => {
        const bd = U.el("div", { class: "kuji-board", role: "img", "aria-label": `くじけんの はりつけ ひょう ${log.length}まい` });
        for (let i = 0; i < S.total; i++) { const e = log[i], c = U.el("div", { class: "kuji-cell" + (e ? " on" + (e[1] ? " me" : "") : ""), style: e ? `--g:${K.GRADE_COL[e[0]]}` : "", text: e ? e[0] : "" }); bd.append(c); }
        return [U.el("div", { class: "kuji-sub", text: label }), bd];
      };
      // ひく ボタン（left: のこり・stop: えらぶ まちが ある など）
      const actionsPart = (left, stop) => {
        const acts = U.el("div", { class: "kuji-actions" }), coins = Save.d.coins;
        const mk = (n, label, cls) => { const b = UI.btn(label, () => buy(n), "yellow " + cls); b.disabled = !left || n > left || coins < K.PRICE * n || stop; return b; };
        acts.append(mk(1, `1まい ひく（${K.PRICE}コイン）`, "one"));
        if (left >= 10) acts.append(mk(10, `10まい ひく（${U.fmt(K.PRICE * 10)}コイン）`, "ten"));
        if (left > 1) acts.append(mk(left, `のこり ぜんぶ ひく（${left}まい・${U.fmt(K.PRICE * left)}コイン）`, "all"));
        if (left && coins < K.PRICE) acts.append(U.el("div", { class: "kuji-need", text: "コインが たりないよ" }));
        return acts;
      };
      // ダブルチャンス・クーポン（どちらの くじでも てもとの もの）
      const dcPart = () => {
        const d = K.st(), dc = U.el("div", { class: "kuji-dc" }), stubs = d.stubs[s] || 0, e = d.dc[s];
        dc.append(U.el("b", { text: "ダブルチャンス" }), U.el("div", { class: "kuji-left", text: `くじけんの はんけんで おうぼ できるよ。けっかは つぎの ひ。あたると「${K.INDEX[S.dcId].name}」` }));
        const row = U.el("div", { class: "kuji-dcrow" });
        row.append(U.el("span", { text: `はんけん ${stubs}まい` + (e ? `・おうぼ ちゅう ${e.n}まい` : "") }));
        const enter = UI.btn("おうぼ する", () => { const m = K.enter(s); if (m) { Sound.se("ok"); UI.toast(`はんけん ${m}まいで おうぼ したよ。けっかは あした！`, "good"); } redraw(); }, "small kuji-enter");
        enter.disabled = !stubs; row.append(enter); dc.append(row);
        return dc;
      };
      const couponPart = () => {
        const cps = K.coupons(s);
        if (!cps.length) return null;
        const box = U.el("div", { class: "kuji-coupons" });
        box.append(U.el("b", { text: "もって いる クーポン" }), U.el("div", { class: "kuji-left", text: "てんいんさんの「かいものを する」で つかえるよ" }));
        const list = U.el("div", { class: "vars" });
        for (const c of cps) { const v = U.el("div", { class: "kuji-var kuji-cp" }); v.append(U.el("img", { src: url(c.id), alt: c.item.name }), U.el("span", { text: `×${c.n}` })); list.append(v); }
        box.append(list); return box;
      };
      // ダブルチャンスの けっか（つぎの 日に 1かい みせる）
      const dcResPart = () => {
        const r = K.st().dcLast[s];
        if (!r || r.seen) return null;
        r.seen = true; Save.write(); view.dc = r;
        return U.el("div", { class: "kuji-dcres" + (r.win ? " win" : ""), text: r.win ? `ダブルチャンスの けっか: あたり！「${K.INDEX[S.dcId].name}」が とどいたよ。もようがえで かべに かざれるよ` : `ダブルチャンスの けっか: ${r.n}まい おうぼ → こんかいは はずれ。また おうぼ してね` });
      };
      const posterPart = (text) => {
        const poster = U.el("div", { class: "kuji-poster" });
        poster.append(U.el("div", { class: "kuji-logo", text: "いちばんくじ" }), U.el("div", { class: "kuji-title", text: `「${S.title}」` }), U.el("div", { class: "kuji-price", text }));
        return poster;
      };
      const statPart = (left) => {
        const stat = U.el("div", { class: "kuji-stat" });
        stat.append(U.el("div", { html: `のこり <b>${left}</b>まい（ぜんぶで ${S.total}まい）` }), U.el("div", { class: "pill coins", html: `<i class="coin-ico"></i>${U.fmt(Save.d.coins)}` }));
        return stat;
      };
      const lastPart = (gone, text) => {
        const last = U.el("div", { class: "kuji-last" + (gone ? " gone" : "") }), lit = K.INDEX[S.lastId];
        last.append(U.el("img", { src: url(S.lastId), alt: lit.name }), U.el("div", { class: "kuji-lasttext" }, [U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL.L}`, text: "ラストワンしょう" }), U.el("b", { text: short(lit) }), U.el("div", { class: "kuji-left", text })]));
        return last;
      };
      const showBoard = (parts) => { board.replaceChildren(...parts.filter(Boolean)); board.classList.remove("hidden"); stage.classList.add("hidden"); view.phase = "board"; view.mode = mode; };

      // ---------- ひとりの くじ の ボード ----------
      const drawBoard = (note = "") => {
        K.sync(s);
        const L = K.lot(s), T = K.tickets(s), left = K.total(s), today = U.today();
        const parts = [modeBar(), posterPart(`1かい ${K.PRICE}コイン・ハズレ なし・ロット ${L.no}`), statPart(left)];
        if (note) parts.push(U.el("div", { class: "kuji-note", text: note }));
        if (L.news && L.news.day === today && L.news.n > 0) parts.push(U.el("div", { class: "kuji-news", text: `ほかの おきゃくさんも ひいたよ（きのう までに ${L.news.n}まい）` }));
        if (!left) parts.push(U.el("div", { class: "kuji-sold", text: K.pendingOf(s).length ? "うりきれ！ えらんで いない けいひんを えらんでね" : "うりきれ！ あした あたらしい くじが はいるよ" }));
        parts.push(dcResPart());
        // A〜Cしょう・ラストワン
        const top = U.el("div", { class: "kuji-top" });
        for (const g of ["A", "B", "C"]) top.append(card(S.ids[g][0]));
        parts.push(top, lastPart(L.sold || !left, left ? "さいごの 1まいを ひいた ひとに プレゼント" : "でたよ"));
        parts.push(rowsPart(T, L.left), collectPart(), ...boardPart(L.log, "くじけんの はりつけ ひょう（ピンクの わくは じぶんが ひいた くじ）"));
        parts.push(actionsPart(left, K.pendingOf(s).length > 0), dcPart(), couponPart());
        showBoard(parts);
        // えらんで いない D〜Fしょうが あれば さきに えらぶ
        if (K.pendingOf(s).length) choose([], null);
      };

      // ---------- みんなの くじ の ボード（js/kuji-net.js・UI-100）----------
      const drawNet = (note = "") => {
        const V = KujiNet.view(s), st = KujiNet.state();
        const status = U.el("div", { class: "kuji-netstat", role: "status", text: Online.STATE_TEXT[st] || Online.STATE_TEXT[""] });
        status.dataset.state = st;
        if (!V) { showBoard([modeBar(), posterPart(`1かい ${K.PRICE}コイン・ハズレ なし・みんなの くじ`), status, U.el("div", { class: "kuji-note", text: st === "denied" ? "みんなの くじを よめなかったよ。「ひとりの くじ」は いつでも ひけるよ" : "みんなの くじを よみこんで いるよ…" })]); return; }
        const uid = OnlineNet.uid(), mine = V.draws.filter((x) => x.u && x.u === uid).length, pend = KujiNet.pending(s).length, prev = KujiNet.prev(s);
        const parts = [modeBar(), posterPart(`1かい ${K.PRICE}コイン・ハズレ なし・みんなの ロット ${V.no}`), statPart(V.total), status];
        if (note) parts.push(U.el("div", { class: "kuji-note", text: note }));
        parts.push(U.el("div", { class: "kuji-news kuji-netnews", text: `みんなで ${V.n}まい ひいたよ（あなたは ${mine}まい）` }));
        if (prev && prev.no === V.no - 1) parts.push(U.el("div", { class: "kuji-news", text: `まえの ロット ${prev.no} の ラストワンしょうは ${KujiNet.nameOf(prev.last)}` }));
        if (V.sold) parts.push(U.el("div", { class: "kuji-sold", text: "うりきれ！ つぎの ロットを よういして いるよ" }));
        if (pend) parts.push(U.el("div", { class: "kuji-sold", text: "えらんで いない けいひんが あるよ。さきに えらんでね" }));
        parts.push(dcResPart());
        const top = U.el("div", { class: "kuji-top" });
        for (const g of ["A", "B", "C"]) top.append(card(S.ids[g][0], "", V.left));
        const lo = V.draws[KujiNet.MAX - 1];
        parts.push(top, lastPart(V.sold, lo ? `${KujiNet.nameOf(lo.u)}が ひいたよ` : "さいごの 1まいを ひいた ひとに プレゼント"));
        parts.push(rowsPart(V.tickets, V.left), collectPart());
        // みんなの けっか（あたらしい じゅん）
        const fd = KujiNet.feed(V), list = U.el("ol", { class: "kuji-feed" });
        for (const f of fd) {
          const li = U.el("li", { class: "kuji-feedrow" + (f.me ? " me" : "") });
          li.append(U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL[f.last ? "L" : f.g]}`, text: f.last ? "ラストワン" : K.gradeLabel(f.g) }), U.el("span", { class: "kuji-feedname", text: f.name }), U.el("span", { class: "kuji-feedno", text: `${f.k + 1}まいめ` }));
          list.append(li);
        }
        if (!fd.length) list.append(U.el("li", { class: "kuji-feedrow empty", text: "まだ だれも ひいて いないよ。さいしょの 1まいを ひこう！" }));
        parts.push(U.el("div", { class: "kuji-sub kuji-feedhead", text: "みんなの けっか（あたらしい じゅん）" }), list);
        parts.push(...boardPart(V.draws.map((x) => [x.g, x.u && x.u === uid ? 1 : 0]), "くじけんの はりつけ ひょう（みんなが ひいた じゅん・ピンクの わくは じぶん）"));
        parts.push(actionsPart(V.sold ? 0 : V.total, pend > 0), dcPart(), couponPart());
        showBoard(parts);
        if (pend) choose([], null);
      };

      // ---------- ひく ----------
      const buy = async (n) => {
        if (view.phase !== "board") return;
        if (mode === "net") { netBuy(n); return; }
        if (n >= 10 && !(await UI.confirm(`${n}まい ひく？\n${U.fmt(K.PRICE * n)}コイン つかうよ`, "ひく", "やめる"))) return;
        const r = K.draw(s, n);
        if (!r) { Sound.se("bad"); UI.toast("コインが たりないよ"); drawBoard(); return; }
        Sound.se("crane_coin_in"); UI.updateHud();
        view.last = r; view.tickets = r.tickets.map((t) => ({ g: t.g, id: t.id, pick: t.pick, last: !!t.last, open: false }));
        boxStep(r);
      };
      // みんなの くじ: サーバーで 1まいずつ ひく あいだ まつ（ひけた ぶんだけ コイン）→ はこ
      const netBuy = async (n) => {
        if (n >= 10 && !(await UI.confirm(`${n}まい ひく？\n${U.fmt(K.PRICE * n)}コイン つかうよ（ひけた ぶんだけ）`, "ひく", "やめる"))) return;
        if (!view.open || view.phase !== "board" || mode !== "net") return;
        view.phase = "wait"; board.classList.add("hidden"); stage.classList.remove("hidden");
        const say = U.el("div", { class: "kuji-say" }), prog = U.el("div", { class: "kuji-wait", role: "status", text: `0／${n}まい` });
        say.innerHTML = `<div class="kuji-keeper">${keeper()}</div><div>${NeriShops.SHOPS[s].keeperName}「みんなの くじの はこから ひいて いるよ…」</div>`;
        stage.replaceChildren(say, prog);
        let r = null, err = null;
        try { r = await KujiNet.draw(s, n, (i, m) => { prog.textContent = `${i}／${m}まい`; }); } catch (e) { err = e; }
        if (!view.open) return;
        UI.updateHud();
        if (!r || !r.tickets.length) {
          Sound.se("bad"); UI.toast(err ? "いまは つながらないよ。あとで もういちど ためしてね" : Save.d.coins < K.PRICE ? "コインが たりないよ" : "いまは ひけなかったよ。もういちど ためしてね");
          if (err) KujiNet.reconcile(s).then(() => soon()).catch(() => {}); // とちゅうまで ひけて いたら うけとる
          drawNet(); return;
        }
        if (r.tickets.length < n) UI.toast(`${r.tickets.length}まい ひけたよ`);
        Sound.se("crane_coin_in");
        view.last = r; view.tickets = r.tickets.map((t) => ({ g: t.g, id: t.id, pick: t.pick, last: !!t.last, open: false }));
        boxStep(r);
      };
      // はこから とる
      const boxStep = (r) => {
        view.phase = "box"; board.classList.add("hidden"); stage.classList.remove("hidden");
        const btn = U.el("button", { class: "kuji-boxbtn", "aria-label": "はこから くじを とる" });
        btn.append(U.el("img", { src: boxUrl(s), alt: "" }));
        const say = U.el("div", { class: "kuji-say" });
        say.innerHTML = `<div class="kuji-keeper">${keeper()}</div><div>${NeriShops.SHOPS[s].keeperName}「はこから くじを ${r.tickets.length}まい とってね！」</div>`;
        const go = UI.btn(`くじを とる（${r.tickets.length}まい）`, () => take(r), "yellow kuji-take");
        btn.addEventListener("click", () => take(r));
        stage.replaceChildren(say, btn, go);
      };
      let taking = false;
      const take = async (r) => {
        if (view.phase !== "box" || taking) return; taking = true;
        Sound.se("kuji_draw"); stage.querySelector(".kuji-boxbtn").classList.add("shake"); await wait(420); taking = false;
        if (!view.open) return;
        ticketsStep(r);
      };
      // くじけんを めくる
      const ticketsStep = (r) => {
        view.phase = "tickets";
        const grid = U.el("div", { class: "kuji-tickets" + (r.tickets.length > 12 ? " many" : r.tickets.length <= 3 ? " few" : "") }); // 3まい までは 大きく（めくりやすい）
        const hint = U.el("div", { class: "kuji-tap", text: "くじけんを タップか うえに スライドで めくろう！" });
        const pass = UI.btn("てんいんさんに わたす", () => handover(r), "yellow kuji-pass");
        const all = UI.btn("ぜんぶ めくる", () => { view.tickets.forEach((t, i) => peel(i)); }, "small kuji-all");
        pass.disabled = true;
        const check = () => { const done = view.tickets.every((t) => t.open); pass.disabled = !done; all.disabled = done; if (done) hint.textContent = "てんいんさんに わたして けいひんを もらおう"; };
        const peel = (i) => {
          const t = view.tickets[i]; if (!t || t.open) return;
          t.open = true; const b = grid.children[i]; b.classList.add("open"); b.setAttribute("aria-label", `${K.gradeLabel(t.g)}の くじけん`);
          Sound.se(["A", "B", "C"].includes(t.g) || t.last ? "kuji_bell" : "kuji_peel"); check();
        };
        r.tickets.forEach((t, i) => {
          const b = U.el("button", { class: "kuji-ticket", style: `--g:${K.GRADE_COL[t.g]}`, "aria-label": "まだ めくって いない くじけん" });
          const inside = U.el("div", { class: "in" }); inside.append(U.el("b", { text: t.g }), U.el("small", { text: "しょう" }));
          if (t.last) inside.append(U.el("small", { class: "lo", text: "ラストワン" }));
          b.append(inside, U.el("div", { class: "flap", html: "<span>いちばん<br>くじ</span>" }));
          let y0 = null;
          b.addEventListener("pointerdown", (e) => { y0 = e.clientY; });
          b.addEventListener("pointermove", (e) => { if (y0 != null && y0 - e.clientY > 22) { y0 = null; peel(i); } });
          b.addEventListener("click", () => peel(i));
          grid.append(b);
        });
        const foot = U.el("div", { class: "kuji-foot" }); foot.append(all, pass);
        stage.replaceChildren(hint, grid, foot); check();
        view.peel = peel;
      };
      // てんいんさんに わたす → えらぶ（D〜F）→ けいひん
      const handover = (r) => {
        if (view.phase !== "tickets") return;
        const res = r.tickets.filter((t) => t.id).map((t) => ({ g: t.g, id: t.id, first: t.first, note: t.note, complete: t.complete, sheet: t.sheet }));
        const lo = r.tickets.find((t) => t.last);
        choose(res, lo ? lo.lastPrize : null);
      };
      // えらぶ もと（ひとりの くじ: てもとの ロット・みんなの くじ: サーバー）
      const SRC = {
        solo: { pend: () => { const p = K.pendingOf(s)[0]; return p ? { g: p[1] } : null; }, count: () => K.pendingOf(s).length, opts: (p) => K.choices(s, p.g), left: (p, id) => K.lot(s).left[id], take: async (p, id) => K.choose(s, id) },
        net: { pend: () => KujiNet.pending(s)[0] || null, count: () => KujiNet.pending(s).length, opts: (p) => KujiNet.choices(s, p), left: (p, id) => KujiNet.leftOf(s, p, id), take: (p, id) => KujiNet.pick(s, p, id) },
      };
      let picking = false;
      const choose = (res, lo) => {
        const src = SRC[mode], p = src.pend();
        if (!p) { resultStep(res, lo); return; }
        view.phase = "choose"; board.classList.add("hidden"); stage.classList.remove("hidden");
        const g = p.g, ids = src.opts(p);
        const head = U.el("div", { class: "kuji-tap" }); head.append(U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL[g]}`, text: K.gradeLabel(g) }), document.createTextNode(` すきな ものを えらんでね（${S.cats[g]}）`));
        const grid = U.el("div", { class: "kuji-choose" });
        for (const id of ids) {
          const it = K.INDEX[id], b = U.el("button", { class: "kuji-card pickable", "aria-label": `${it.name}を えらぶ` });
          b.dataset.id = id;
          b.append(U.el("img", { src: url(id), alt: "" }), U.el("div", { class: "kuji-name", text: it.name }), U.el("div", { class: "kuji-left", text: `のこり ${src.left(p, id)}` + (K.got(id) ? "・もってる" : "") }));
          b.addEventListener("click", async () => {
            if (picking || view.phase !== "choose") return;
            picking = true; grid.classList.add("busy");
            let r = null, err = null;
            try { r = await src.take(p, id); } catch (e) { err = e; }
            picking = false;
            if (!view.open || view.phase !== "choose") return;
            if (r && r.taken) { Sound.se("bad"); UI.toast("ほかの ひとが さきに えらんだよ。べつの ものを えらんでね"); choose(res, lo); return; }
            if (!r) { Sound.se("bad"); grid.classList.remove("busy"); UI.toast(err ? "いまは つながらないよ。あとで ボードで えらべるよ" : "えらべなかったよ"); if (err) { if (res.length || (lo && lo.item)) resultStep(res, lo); else redraw(); } return; }
            Sound.se("ok"); res.push({ g: r.g, id: r.id, first: r.first, note: r.note, complete: r.complete, sheet: r.sheet });
            if (r.fixed) UI.toast(`ほかの ひとが さきに えらんだので「${K.INDEX[r.id].name}」に なったよ`);
            choose(res, lo);
          });
          grid.append(b);
        }
        const left = src.count();
        stage.replaceChildren(head, grid, U.el("div", { class: "kuji-sub", text: left > 1 ? `あと ${left}まい えらべるよ` : "" }));
      };
      const resultStep = (res0, lo) => {
        const res = res0.slice().sort((a, b) => K.GRADES.indexOf(a.g) - K.GRADES.indexOf(b.g)); // 賞の じゅん（A → I）
        view.phase = "result"; view.results = res.map((x) => x.id).concat(lo && lo.item ? [lo.item.id] : []);
        board.classList.add("hidden"); stage.classList.remove("hidden");
        const parts = [];
        const top = res.filter((x) => ["A", "B", "C"].includes(x.g));
        if (lo && lo.item) {
          const c = U.el("div", { class: "kuji-lastone" });
          c.append(U.el("img", { src: url(lo.item.id), alt: lo.item.name }), U.el("div", { class: "kuji-lasttext" }, [U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL.L}`, text: "ラストワンしょう！" }), U.el("b", { text: lo.item.name }), U.el("div", { class: "kuji-left", text: "さいごの 1まいを ひいたよ。おめでとう！" })]));
          parts.push(c); Sound.se("kuji_last");
        } else if (top.length) Sound.se("kuji_win"); else Sound.se("ok");
        if (top.length) parts.push(U.el("div", { class: "kuji-congrats", text: `${NeriShops.SHOPS[s].keeperName}「${top.map((x) => K.gradeLabel(x.g)).join("・")}、でました〜！ おめでとう ございます！」` }));
        const grid = U.el("div", { class: "kuji-results" + (res.length > 9 ? " many" : "") });
        for (const x of res) {
          const it = K.INDEX[x.id], c = U.el("div", { class: "kuji-card res" });
          c.dataset.id = x.id;
          c.append(U.el("span", { class: "kuji-g", style: `--g:${K.GRADE_COL[x.g]}`, text: K.gradeLabel(x.g) }), U.el("img", { src: url(x.id), alt: it.name }), U.el("div", { class: "kuji-name", text: short(it) }));
          if (x.first) c.append(U.el("span", { class: "kuji-new", text: "NEW" }));
          grid.append(c);
        }
        parts.push(grid);
        // せつめいは おなじ ものを 1つに。シールの シートは まとめて「シールが Nまい ふえたよ」
        const sheets = res.filter((x) => x.sheet), notes = [...new Set(res.filter((x) => !x.sheet).map((x) => x.note).concat(lo && lo.note ? [lo.note] : []).filter(Boolean))];
        if (sheets.length) {
          const n = sheets.reduce((a, x) => a + x.sheet.n, 0), fresh = [...new Set(sheets.flatMap((x) => x.sheet.fresh))].filter((id) => StickerBook.INDEX[id]);
          notes.unshift(`シールが ${n}まい ふえたよ。` + (fresh.length ? `あたらしい シール: ${fresh.map((id) => StickerBook.INDEX[id].name).join("・")}。` : "") + "すまほの「シール」で はれるよ");
        }
        if (notes.length) parts.push(U.el("div", { class: "kuji-sub", text: notes.join("　") }));
        if (res.some((x) => x.complete) || (lo && lo.complete)) parts.push(U.el("div", { class: "kuji-collect done big", text: `「${S.title}」 コンプリート！ ぜんぶ そろったよ` }));
        const who = Save.d.order[(K.st().draws - 1 + 3) % 3], line = REACT[who][K.st().draws % REACT[who].length];
        parts.push(U.el("div", { class: "kuji-say2", text: `${Save.d.chars[who].name}「${line}」` }));
        parts.push(UI.btn("ボードに もどる", () => redraw(), "yellow kuji-back"));
        stage.replaceChildren(...parts);
        UI.updateHud();
      };
      if (mode === "net") netWatch();
      redraw();
    });
  }
  return { open, view, ui, url };
})();

// ---- こうかおん（くじを とる・めくる・かね・ラストワン）----
Object.assign(CraneSE, {
  kuji_draw: (S, T, N) => { N({ dur: 0.16, vol: 0.12, freq: 2400, q: 0.8 }); N({ dur: 0.12, t: 0.16, vol: 0.1, freq: 1800, q: 0.8 }); T({ f: 600, f2: 900, t: 0.28, dur: 0.06, type: "triangle", vol: 0.06 }); },
  kuji_peel: (S, T, N) => { N({ dur: 0.12, vol: 0.14, freq: 3000, q: 0.8 }); T({ f: 880, f2: 1320, t: 0.06, dur: 0.08, type: "triangle", vol: 0.07 }); },
  kuji_bell: (S, T, N) => { N({ dur: 0.1, vol: 0.12, freq: 3000, q: 0.8 }); [0, 0.16, 0.32, 0.48].forEach((t, i) => T({ f: i % 2 ? 1568 : 1760, t, dur: 0.14, type: "triangle", vol: 0.1 })); },
  kuji_win: (S, T) => { ["C5", "E5", "G5", "C6", "G5", "C6"].forEach((n, i) => T({ f: S.freq(n), t: i * 0.11, dur: i === 5 ? 0.45 : 0.1, type: "triangle", vol: 0.11 })); },
  kuji_last: (S, T) => { ["G4", "C5", "E5", "G5", "C6", "E6", "G6"].forEach((n, i) => T({ f: S.freq(n), t: i * 0.09, dur: i === 6 ? 0.6 : 0.09, type: "triangle", vol: 0.11 })); [0.8, 0.96, 1.12].forEach((t, i) => T({ f: i % 2 ? 1568 : 1760, t, dur: 0.14, type: "triangle", vol: 0.08 })); },
});
