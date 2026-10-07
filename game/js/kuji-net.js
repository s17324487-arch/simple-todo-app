// いちばんくじの「みんなの くじ」（E5 の オンライン・UI-100）。オーナーの 指示（2026-10-06）「一番くじについて、他のユーザーのくじ引き結果を連携するようにして。」
// ローリソン・せぶんぶん ごとに、オンラインの みんなで 1つの ロット（80まい）を ひく。ほかの 人が ひくと のこりが へる・はりつけ ひょうに ならぶ・ラストワンしょうは みんなで 1つ。
// がめんは js/kuji-ui.js の「みんなの くじ」。ひとりの くじ（js/ichiban-kuji.js の ロット・ほかの おきゃくさん）は そのまま のこる。
// - サーバー（game/firebase/database.rules.json の v1/kuji・v1/kujime）:
//   v1/kuji/{みせ}/cur いまの ロットの ばんごう（ない ときは 1）・lots/l{ロット}/n ひいた まい数・d/k{なんまいめ} = { u: 匿名の ID, t: サーバーの じこく }・
//   D〜Fしょうを えらぶと p（しゅるいの ばんごう 0〜2）と o（えらんだ じゅん。pc を 1 ずつ ふやす）。v1/kujime/{uid}/{みせ}_l{ロット} = true（けす ときに じぶんの くじを さがす）。
// - なんまいめは ルールが きめる（n を 1 ふやす ときだけ その ばんごうの くじを かける）ので、2人が おなじ くじを ひく ことは ない。だれかと かさなったら よみなおして もう いちど。
//   うりきれた（n が 80）ロットは だれでも つぎへ すすめられる（cur を 1 ふやす）。
// - けいひんは ひとりの くじ より ごうかな みんなの くじ だけの もの（IchibanKuji.NET_BY・UI-101。賞の ほんすうは おなじ）。
// - でた 賞は みんなが おなじ けいさんで きめる（derive）: その くじの サーバーの じこく と なんまいめ の たね（IchibanKuji.hash・seeded）で、のこりの まい数の おもみ（ひとりの くじと おなじ）。
//   じこくは サーバーが きめる（ルールで t === now）ので、ひく 人は どの 賞が でるか えらべない。A〜C・G〜Iしょうの しゅるいも おなじ たねで きまる。
//   D〜Fしょうは ひいた 人が のこりから えらぶ（えらんだ じゅん o の さきの 人から。もう ない しゅるいなら のこりの はじめの もの）。80まいめを ひいた 人に ラストワンしょう。
// - コインは てもとで けいさん（ひけた ときだけ 1まい 1000コイン。IchibanKuji.pay）。けいひんは ひいた 人の てもとに（ほかの 人の くじは みる だけ）。はんけん・ダブルチャンス・クーポンは ひとりの くじと おなじ。
// - おくる もの: 匿名の ID・なんまいめ・ひいた じこく（サーバーが いれる）・えらんだ しゅるい。なまえは おくらない（v1/players の なまえを よむ。なまえを かえると かわる・けすと きえる）。
// - 「みせた データを けす」（Online.wipe）: じぶんの くじの u を "" に する（くじの はこの なかみは かわらない・だれが ひいたか わからなく なる）・v1/kujime を けす。
// - セーブ（Save.d.kuji.net。IchibanKuji.cleanNet）: on 1 = みんなの くじ を つかう・since はじめて つかった とき（それ より まえの くじは じぶんの ものに しない）・uid・
//   rec { "みせ_ロット_なんまいめ": 1 = 賞を もらった ＋ 2 = ラストワンしょうを もらった（0 は コインを はらって えらぶ まち）}
const KujiNet = (() => {
  const K = IchibanKuji, MAX = 80, TRIES = 6, FEED = 8, SV = { ".sv": "timestamp" };
  const live = {}; // みせ → { cur, lot（サーバーの データ）, view（derive）, prev まえの ロット }
  const views = {}; // "みせ_ロット" → view（えらぶ まちの ある まえの ロット）
  const names = new Map(); // uid → なまえの コード（"" は なし・null は よみこみ中）
  let watcher = null, toastAt = 0;
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const st = () => K.st().net;
  const key = (s, no, k) => `${s}_${no}_${k}`;
  const lotPath = (s, no) => `v1/kuji/${s}/lots/l${no}`;
  const isUid = (u) => typeof u === "string" && /^[\w-]{1,128}$/.test(u);
  const denied = (e) => e && (e.status === 401 || e.status === 403);
  const available = () => typeof Online !== "undefined" && Online.on();

  // ---- でた 賞（みんな おなじ けいさん）----
  // lot: サーバーの ロット（{ n, pc, d: { k0: { u, t, p?, o? }, … } }）→ { no, n, draws: [{ k, u, t, g, id, pick, p, o, last, fixed }], left しゅるいごとの のこり, tickets 賞ごとの のこり, total, sold }
  function derive(s, no, lot) {
    const S = K.NET_BY[s], d = lot && lot.d && typeof lot.d === "object" ? lot.d : {}, T = {}, left = { ...S.plan }, draws = [];
    for (const g of K.GRADES) T[g] = sum(K.PLAN[g]);
    for (let k = 0; k < MAX; k++) {
      const r = d["k" + k];
      if (!r || typeof r !== "object" || !Number.isFinite(r.t)) break; // とちゅうが ない（よみこみ中）→ そこまで
      const rnd = K.seeded(K.hash(s, no, k, r.t));
      let g = null, x = rnd() * sum(T);
      for (const G of K.GRADES) { if (T[G] <= 0) continue; g = G; if ((x -= T[G]) < 0) break; }
      T[g]--;
      let id = null;
      if (!K.PICK[g]) {
        const ids = S.ids[g].filter((i) => left[i] > 0);
        let y = rnd() * ids.reduce((a, i) => a + left[i], 0); id = ids[ids.length - 1];
        for (const i of ids) { if ((y -= left[i]) < 0) { id = i; break; } }
        left[id]--;
      }
      draws.push({ k, u: isUid(r.u) ? r.u : "", t: r.t, g, id, pick: !!K.PICK[g], p: Number.isInteger(r.p) && r.p >= 0 && r.p <= 2 ? r.p : null, o: Number.isFinite(r.o) ? r.o : null, last: k === MAX - 1, fixed: false });
    }
    // D〜Fしょうの しゅるい: えらんだ じゅん（o・おなじ なら なんまいめ）
    for (const x of draws.filter((q) => q.pick && q.p !== null && q.o !== null).sort((a, b) => a.o - b.o || a.k - b.k)) {
      const ids = S.ids[x.g]; let id = ids[x.p];
      if (!(left[id] > 0)) { id = ids.find((i) => left[i] > 0) || null; x.fixed = true; }
      if (id) { left[id]--; x.id = id; }
    }
    return { store: s, no, n: draws.length, pc: lot && Number.isInteger(lot.pc) ? lot.pc : 0, draws, left, tickets: T, total: sum(T), sold: draws.length >= MAX };
  }
  // つぎに ひく くじ（n まいめ）が want しょうに なる じこく（テスト・PokaDebug.kujiNetT）。from から 1ミリびょうずつ
  function timeFor(s, no, lot, want, from = Date.now()) {
    const v = derive(s, no, lot), d = { ...(lot && lot.d ? lot.d : {}) };
    if (v.sold || !(v.tickets[want] > 0)) return null; // もう ない 賞
    for (let t = from; t < from + 20000; t++) { d["k" + v.n] = { u: "x", t }; const w = derive(s, no, { ...lot, d }).draws[v.n]; if (w && w.g === want) return t; }
    return null;
  }

  // ---- サーバーを よむ ----
  async function curOf(s) { const v = await OnlineNet.get(`v1/kuji/${s}/cur`); return Number.isInteger(v) && v >= 1 ? v : 1; }
  async function fetchLot(s, no) { const v = await OnlineNet.get(lotPath(s, no)); return v && typeof v === "object" ? v : {}; }
  // うりきれた ロットを つぎへ（だれかが さきに すすめて いたら なにも しない）
  async function advance(s, no) {
    try { await OnlineNet.patch(`v1/kuji/${s}`, { cur: no + 1 }); return true; } catch (e) { if (denied(e)) return false; throw e; }
  }
  // いまの ロットを よむ（うりきれて いたら つぎへ）
  async function load(s) {
    let cur = await curOf(s), lot = await fetchLot(s, cur), prev = live[s] && live[s].prev;
    for (let i = 0; i < 3 && derive(s, cur, lot).sold; i++) {
      const v = derive(s, cur, lot);
      prev = { no: cur, last: v.draws[MAX - 1] ? v.draws[MAX - 1].u : "" };
      await advance(s, cur);
      const c2 = await curOf(s); if (c2 === cur) break;
      cur = c2; lot = await fetchLot(s, cur);
    }
    if (live[s] && live[s].cur !== cur && live[s].view) views[s + "_" + live[s].cur] = live[s].view; // まえの ロット（えらぶ まちが ある かも）は のこす
    const L = (live[s] = { cur, lot, view: derive(s, cur, lot), prev });
    return L;
  }

  // ---- じぶんの くじ（コイン・けいひん）----
  // rec に ある じぶんの くじ k の けいひんを もらう（まだの ぶんだけ）。もらった ものを かえす
  function settle(s, view, k) {
    const x = view.draws[k], net = st(), rk = key(s, view.no, k), S = K.NET_BY[s];
    if (!x || !(rk in net.rec)) return null;
    let flag = net.rec[rk];
    const t = { g: x.g, id: x.id, pick: x.pick && !x.id, no: k + 1, lot: view.no, k, last: x.last };
    if (!(flag & 1) && x.id) { Object.assign(t, K.grant(x.id)); flag |= 1; }
    if (x.last && !(flag & 2)) { t.lastPrize = K.grant(S.lastId); flag |= 2; }
    net.rec[rk] = flag; Save.mark();
    return t;
  }
  // rec を あたらしい NET_MAX けん まで（もらい おわった ものから けす）
  function trim() {
    const net = st(), ks = Object.keys(net.rec);
    for (let i = 0; ks.length - i > K.NET_MAX && i < ks.length; i++) if (done(ks[i])) delete net.rec[ks[i]];
  }
  const done = (rk) => { const v = st().rec[rk], k = +rk.split("_")[2]; return (v & 1) && (k !== MAX - 1 || (v & 2)); };
  // まだ もらって いない じぶんの くじ（えらぶ まち・つながらなくて とちゅう）を もらう。いまの ロットの じぶんの くじで rec に ない ものも（ひいた へんじが こなかった）
  async function reconcile(s) {
    const net = st(), uid = OnlineNet.uid(), out = { got: [], adopted: 0 };
    if (!uid || net.uid !== uid) return out;
    const L = live[s] || (await load(s));
    for (const x of L.view.draws) {
      const rk = key(s, L.cur, x.k);
      if (x.u === uid && !(rk in net.rec) && net.since && x.t >= net.since) { K.pay(s, 1); net.rec[rk] = 0; out.adopted++; }
    }
    const lots = new Set(Object.keys(net.rec).filter((rk) => rk.startsWith(s + "_") && !done(rk)).map((rk) => +rk.split("_")[1]));
    for (const no of lots) {
      const v = no === L.cur ? L.view : derive(s, no, await fetchLot(s, no));
      views[s + "_" + no] = v;
      for (const x of v.draws) if (key(s, no, x.k) in net.rec && !done(key(s, no, x.k))) { if (x.u !== uid) { delete net.rec[key(s, no, x.k)]; continue; } const t = settle(s, v, x.k); if (t && (t.id || t.lastPrize) && !t.pick) out.got.push(t); }
    }
    Save.write();
    return out;
  }
  // えらぶ まちの D〜Fしょう（[{ s, lot, k, g }]・ふるい じゅん）
  function pending(s) {
    const net = st(), uid = OnlineNet.uid(), out = [];
    for (const rk of Object.keys(net.rec)) {
      const [ss, no, k] = rk.split("_"); if (ss !== s || (net.rec[rk] & 1)) continue;
      const v = live[s] && live[s].cur === +no ? live[s].view : views[s + "_" + no], x = v && v.draws[+k];
      if (x && x.u === uid && x.pick && !x.id) out.push({ s, lot: +no, k: +k, g: x.g });
    }
    return out.sort((a, b) => a.lot - b.lot || a.k - b.k);
  }
  const viewOf = (s, no) => (live[s] && live[s].cur === no ? live[s].view : views[s + "_" + no]);
  // えらべる しゅるい（のこりが ある もの）
  function choices(s, P) { const v = viewOf(s, P.lot); return v ? K.NET_BY[s].ids[P.g].filter((id) => v.left[id] > 0) : []; }
  function leftOf(s, P, id) { const v = viewOf(s, P.lot); return v ? v.left[id] || 0 : 0; }

  // ---- ひく ----
  // n まい ひく（1まいずつ。だれかと かさなったら よみなおして もう いちど）。step(ひけた まい数, n)。
  // かえす: IchibanKuji.draw と おなじ かたち { store, tickets: [{ g, id, pick, last, lastPrize, no, … }], price, lot, left }。1まいも ひけなければ tickets が から
  async function draw(s, n, step) {
    if (!K.has(s) || !available()) return null;
    const uid = await Online.ensure(); account(uid);
    const net = st(); if (!net.since) net.since = Date.now();
    let L = live[s] && live[s].view ? live[s] : await load(s), cur = L.cur, k = L.view.n;
    const mine = [];
    for (let i = 0; i < n && Save.d.coins >= K.PRICE; i++) {
      let ok = false;
      for (let tries = 0; tries < TRIES && !ok; tries++) {
        if (k >= MAX) { await advance(s, cur); L = await load(s); cur = L.cur; k = L.view.n; continue; }
        try {
          await OnlineNet.patch("v1", { [`kuji/${s}/lots/l${cur}/n`]: k + 1, [`kuji/${s}/lots/l${cur}/d/k${k}`]: { u: uid, t: SV }, [`kujime/${uid}/${s}_l${cur}`]: true });
          ok = true;
        } catch (e) {
          if (!denied(e)) { // つながらない: ひけたかを たしかめる（わからなければ あとで reconcile が うけとる）
            const r = await OnlineNet.get(`${lotPath(s, cur)}/d/k${k}`).catch(() => undefined);
            if (r === undefined) { Save.write(); throw e; }
            if (r && r.u === uid) { ok = true; break; }
          }
          L = await load(s); cur = L.cur; k = L.view.n; // だれかが さきに ひいた → よみなおして もう いちど
        }
      }
      if (!ok) break;
      K.pay(s, 1); net.rec[key(s, cur, k)] = 0; trim(); mine.push([cur, k]); k++;
      if (step) step(mine.length, n);
    }
    Save.write();
    if (!mine.length) return { store: s, tickets: [], price: 0, lot: cur, left: L.view.total };
    // でた 賞（サーバーの じこくで きまる）を よんで けいひんを もらう
    const out = [];
    for (const no of [...new Set(mine.map((m) => m[0]))]) {
      const lot = await fetchLot(s, no), v = derive(s, no, lot);
      if (no === live[s].cur) Object.assign(live[s], { lot, view: v }); else views[s + "_" + no] = v;
      for (const [n2, kk] of mine) if (n2 === no) { const t = settle(s, v, kk); if (t) out.push(t); }
    }
    Save.write(); if (typeof UI !== "undefined" && UI.updateHud) UI.updateHud();
    const now = live[s];
    if (now.view.sold) advance(s, now.cur).catch(() => {}); // さいごの 1まいを ひいた → つぎの ロットを だす
    return { store: s, tickets: out, price: K.PRICE * mine.length, lot: cur, left: now.view.total };
  }
  // D〜Fしょうを えらぶ（のこりの しゅるいから。えらんだ じゅんは pc を 1 ずつ）。かえす: もらった もの・{ taken: true }（だれかが さきに えらんだ）・null
  async function pick(s, P, id) {
    const S = K.NET_BY[s], uid = OnlineNet.uid(), ix = S.ids[P.g] ? S.ids[P.g].indexOf(id) : -1;
    if (ix < 0 || !uid) return null;
    for (let tries = 0; tries < TRIES; tries++) {
      const lot = await fetchLot(s, P.lot), v = derive(s, P.lot, lot), x = v.draws[P.k];
      keep(s, P.lot, lot, v);
      if (!x || x.u !== uid || !x.pick) return null;
      if (x.p !== null) return finish(s, v, P.k); // もう えらんで いた（へんじが こなかった）
      if (!(v.left[id] > 0)) return { taken: true };
      try { await OnlineNet.patch(lotPath(s, P.lot), { pc: v.pc + 1, [`d/k${P.k}/p`]: ix, [`d/k${P.k}/o`]: v.pc }); }
      catch (e) { if (denied(e)) continue; } // だれかと かさなった → よみなおす・つながらない → たしかめる
      const lot2 = await fetchLot(s, P.lot), v2 = derive(s, P.lot, lot2);
      keep(s, P.lot, lot2, v2);
      if (v2.draws[P.k] && v2.draws[P.k].p !== null) return finish(s, v2, P.k);
    }
    return null;
  }
  const keep = (s, no, lot, v) => { if (live[s] && live[s].cur === no) Object.assign(live[s], { lot, view: v }); else views[s + "_" + no] = v; };
  function finish(s, v, k) {
    const t = settle(s, v, k); Save.write();
    return t && t.id ? { g: t.g, id: t.id, first: t.first, note: t.note, complete: t.complete, sheet: t.sheet, fixed: v.draws[k].fixed } : null;
  }

  // ---- なまえ（v1/players の なまえの コード）----
  function nameOf(uid) {
    if (!uid) return "だれか";
    if (uid === OnlineNet.uid()) return "あなた";
    if (!names.has(uid)) {
      names.set(uid, null);
      OnlineNet.get(`v1/players/${uid}`).then((v) => { names.set(uid, v && typeof v.n === "string" && Online.parseNick(v.n) ? v.n : ""); if (watcher) watcher.cb("names"); }).catch(() => names.set(uid, ""));
    }
    const c = names.get(uid);
    return c === null ? "…" : c ? Online.nickText(Online.parseNick(c)) + "さん" : "だれか";
  }
  // さいきん ひかれた くじ（あたらしい じゅん・FEED まい）
  function feed(v) { return v ? v.draws.slice(-FEED).reverse().map((x) => ({ k: x.k, g: x.g, last: x.last, me: !!x.u && x.u === OnlineNet.uid(), name: nameOf(x.u) })) : []; }

  // ---- みはる（ボードを ひらいて いる あいだ・ストリーム）----
  // cb("data" | "state" | "names" | "lot")
  function watch(s, cb) {
    unwatch();
    const w = { s, cb, h: null, state: "", busy: false, seen: -1 };
    watcher = w;
    const start = async () => {
      let L;
      try { L = await load(s); } catch (e) { if (watcher === w) { w.state = denied(e) ? "denied" : "retry"; cb("state"); if (!denied(e)) w.timer = setTimeout(start, 5000); } return; }
      if (watcher !== w) return;
      w.seen = L.view.n; cb("lot");
      w.h = OnlineNet.listen(lotPath(s, L.cur), (ev) => {
        if (watcher !== w) return;
        if (ev.type === "state") { w.state = ev.state; cb("state"); return; }
        const L2 = live[s]; if (!L2 || L2.cur !== L.cur) return;
        L2.lot = OnlineNet.apply(L2.lot, ev); L2.view = derive(s, L2.cur, L2.lot);
        const fresh = L2.view.draws.filter((x) => x.k >= w.seen && w.seen >= 0 && x.u !== OnlineNet.uid());
        w.seen = L2.view.n;
        for (const x of fresh) if (["A", "B", "C"].includes(x.g) || x.last) tell(x);
        cb("data");
        if (L2.view.sold && !w.busy) { // うりきれ → すこし まって つぎの ロットへ（ラストワンしょうの 人を おぼえて おく）
          w.busy = true; L2.prev = { no: L2.cur, last: L2.view.draws[MAX - 1].u };
          w.timer = setTimeout(async () => { if (watcher !== w) return; if (w.h) w.h.close(); w.h = null; await advance(s, L2.cur).catch(() => {}); w.busy = false; start(); }, 1500);
        }
      });
    };
    start();
    return w;
  }
  function unwatch() { const w = watcher; watcher = null; if (w) { clearTimeout(w.timer); if (w.h) w.h.close(); } }
  // ほかの 人が A〜C・ラストワンを ひいた（3びょうに 1かい まで）
  function tell(x) {
    const say = () => {
      if (Date.now() - toastAt < 3000 || typeof UI === "undefined" || !watcher) return;
      const nm = nameOf(x.u); toastAt = Date.now();
      UI.toast(`${nm === "…" ? "だれか" : nm}が ${x.last ? "ラストワンしょう" : K.gradeLabel(x.g)}を ひいたよ！`);
    };
    if (names.get(x.u) === undefined && isUid(x.u)) { nameOf(x.u); setTimeout(say, 600); } else say();
  }

  // ---- モード・ID・けす ----
  function account(uid) { const net = st(); if (uid && net.uid !== uid) { net.uid = uid; net.rec = {}; Save.mark(); } }
  function setMode(on) { const net = st(); net.on = on ? 1 : 0; if (on && !net.since) net.since = Date.now(); Save.mark(); Save.write(); }
  // けす ときに じぶんの くじの なまえ（u）を ""（v1/kujime で さがす・てもとの rec も）・v1/kujime を けす。アカウントは つくらない。
  // v1/kujime が よめない ＝ くじの きまりを はる まえの ルール（くじは だれも かけない）→ くじの ぶんは なにも たさない（たすと 1かいの PATCH ごと とおらず、ほかの データも けせない）
  async function wipe(uid, up) {
    let mine = null;
    try { mine = await OnlineNet.get(`v1/kujime/${uid}`, "", false); } catch (e) { if (e.code === "noaccount" || denied(e)) return; }
    const lots = new Set();
    for (const k of Object.keys(mine && typeof mine === "object" ? mine : {})) { const m = /^(lawson|sevenbun)_l(\d{1,6})$/.exec(k); if (m) lots.add(m[1] + "_" + m[2]); }
    for (const rk of Object.keys(st().rec)) lots.add(rk.split("_").slice(0, 2).join("_"));
    for (const sl of lots) {
      const [s, no] = sl.split("_");
      let d = null;
      try { d = await OnlineNet.get(`${lotPath(s, no)}/d`, "", false); } catch (e) { if (denied(e)) continue; throw e; } // つながらない → けすのを やめる（もう いちど）
      for (const [k, r] of Object.entries(d && typeof d === "object" ? d : {})) if (/^k\d{1,2}$/.test(k) && r && r.u === uid) up[`kuji/${s}/lots/l${no}/d/${k}/u`] = "";
    }
    up[`kujime/${uid}`] = null;
  }

  return {
    MAX, TRIES, FEED,
    available, using: () => available() && st().on === 1, st, setMode, account,
    derive, timeFor, load, reconcile, pending, choices, leftOf, draw, pick, feed, nameOf, watch, unwatch, wipe,
    view: (s) => (live[s] ? live[s].view : null), cur: (s) => (live[s] ? live[s].cur : 0), prev: (s) => (live[s] ? live[s].prev : null),
    lot: (s) => (live[s] ? live[s].lot : null), state: () => (watcher ? watcher.state : ""), watching: () => (watcher ? watcher.s : null),
    reset() { unwatch(); for (const k of Object.keys(live)) delete live[k]; for (const k of Object.keys(views)) delete views[k]; names.clear(); },
  };
})();

// オンラインの「みせた データを けす」・ID が かわる ときの ぶん（js/online.js の Online.parts。すまほの「みんな」の タブは ない）
Online.parts.push({ id: "kuji", wipe: (uid, up) => KujiNet.wipe(uid, up), account: (uid) => KujiNet.account(uid) });
