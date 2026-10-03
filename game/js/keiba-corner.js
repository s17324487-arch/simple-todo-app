// UI-58: ネリカス でんき 10F の けいば ちゅうけい コーナー（オーナーの FB 2026-10-03「建物内に競馬中継コーナーを用意して、実際に賭けて遊べるようにせよ」）。
// ・ばけんを かう（1まい 100コイン・1てん 10まい まで・1レース 30まい〔3000コイン〕まで）→ おおきな がめんで レースを みる（SCENES.keiba）→ あたったら はらいもどし。
// ・1にち 12レース。レースは がめんで みた とき（または つぎの 日に なった とき）に しめきる。あたった ばけんは はらいもどしきで いつでも うけとれる。
// ・10F の みなみがわ（x 17〜37・y 15〜27・みどりの じゅうたん）: おおがた ビジョン・オッズの モニター・けっかの ボード・いす 6・じどう はつばいき 3・はらいもどしき・
//   マークカードの だい（あそびかた）・けいば しんぶん・かかりの ひと・ファン 2人・つりさげの ふだ。フロアマップにも「けいば ちゅうけい」。
// ・セーブ Save.d.keiba: day（いまの ばんぐみの 日）・run { レース: true }（しめきった）・tickets [{ id, day, no, t, m, sel, keys, u, cost, st: open／hit／miss／paid, pay }]・
//   hist（さいきんの けっか 12）・bets（かった まいすう）・spent・won（うけとった コイン）・hits・best・races・seq。
// ・ほんものの ばけんは 20さい みまんは かえない（競馬法 第28条）。ここでは ゲームの コインだけ。
const KeibaCorner = (() => {
  const R = KeibaRules, K = KeibaRace, CAP = 30, MAXU = 10, KEEP = 80;
  const fresh = () => ({ day: "", run: {}, tickets: [], hist: [], bets: 0, spent: 0, won: 0, hits: 0, best: 0, races: 0, seq: 0 });
  const int = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.floor(+v))) : lo);
  // セーブの かたちを ととのえる（ふるい セーブ・こわれた あたい）
  const st = () => {
    let d = Save.d.keiba;
    if (!d || typeof d !== "object") d = Save.d.keiba = fresh();
    for (const [k, v] of Object.entries(fresh())) if (d[k] === undefined || typeof d[k] !== typeof v || Array.isArray(v) !== Array.isArray(d[k])) d[k] = v;
    if (!d.run || typeof d.run !== "object" || Array.isArray(d.run)) d.run = {};
    d.tickets = d.tickets.filter((t) => t && typeof t === "object" && R.BY[t.t] && Array.isArray(t.keys) && t.keys.length && typeof t.day === "string" && t.no >= 1 && t.no <= 12);
    return d;
  };
  const today = () => K.dayKey();
  // ひづけが かわったら: まえの 日の ばけんを ぜんぶ しめきる（けっかは きまって いる）
  const sync = () => {
    const d = st(), day = today();
    const old = [...new Set(d.tickets.filter((t) => t.st === "open" && (t.day !== day || d.day !== day)).map((t) => t.day + "|" + t.no))];
    for (const k of old) { const [dd, no] = k.split("|"); if (dd !== day) settle(dd, +no); }
    if (d.day !== day) { d.day = day; d.run = {}; }
    return d;
  };
  const ticketsOf = (day, no) => st().tickets.filter((t) => t.day === day && t.no === no);
  const runToday = (no) => sync().run[no] === true;
  const next = () => { const d = sync(); for (let no = 1; no <= 12; no++) if (!d.run[no]) return no; return 0; };
  const spentOn = (no) => ticketsOf(today(), no).reduce((a, t) => a + t.keys.length * t.u, 0);

  // ---- かう ----
  const check = (no, t, sel, m, u) => {
    const d = sync(), day = today();
    if (!(no >= 1 && no <= 12)) return "レースを えらんでね";
    if (d.run[no]) return "この レースは もう はじまったよ";
    const h = K.head(day, no), why = R.sold(t, h.n); if (why) return why;
    const keys = R.expand(t, sel, m, h.n); if (!keys.length) return R.BY[t].byWaku ? "わくを 2つ えらんでね" : m === "box" ? "うまを " + R.BY[t].n + "とう いじょう えらんでね" : R.BY[t].n === 1 ? "うまを えらんでね" : "うまを " + R.BY[t].n + "とう えらんでね";
    if (!(u >= 1 && u <= MAXU)) return "まいすうは 1〜" + MAXU + "まい";
    if (spentOn(no) + keys.length * u > CAP) return "1つの レースで かえるのは " + CAP + "まい（" + U.fmt(CAP * R.UNIT) + "コイン）まで。あと " + (CAP - spentOn(no)) + "まい";
    if (Save.d.coins < keys.length * u * R.UNIT) return "コインが たりないよ";
    return { day, keys, cost: keys.length * u * R.UNIT };
  };
  const buy = (no, t, sel, m = "one", u = 1) => {
    u = int(u, 1, MAXU); const c = check(no, t, sel, m, u);
    if (typeof c === "string") return { err: c };
    const d = st(), tk = { id: ++d.seq, day: c.day, no, t, m, sel: (sel || []).map(Number), keys: c.keys, u, cost: c.cost, st: "open", pay: 0, at: Date.now() };
    Save.addCoins(-c.cost); d.tickets.push(tk); d.bets += c.keys.length * u; d.spent += c.cost;
    // ふるい ばけん（うけとった・はずれ）から すてる
    while (d.tickets.length > KEEP) { const i = d.tickets.findIndex((x) => x.st === "paid" || x.st === "miss"); if (i < 0) break; d.tickets.splice(i, 1); }
    Save.write(); return { ticket: tk };
  };

  // ---- しめきる・はらいもどしを きめる ----
  const settle = (day, no) => {
    const d = st(), rc = K.race(day, no), mine = d.tickets.filter((t) => t.day === day && t.no === no), pays = K.payouts(rc, mine);
    for (const t of mine) {
      if (t.st !== "open") continue;
      const p = pays[t.t]; let pay = 0;
      if (p && p.sold) { if (p.toku) pay = 70 * t.u * t.keys.length; else for (const w of p.wins) if (w.per && t.keys.includes(w.key)) pay += w.per * t.u; }
      t.pay = pay; t.st = pay > 0 ? "hit" : "miss"; if (pay > 0) d.hits++;
    }
    if (!d.hist.some((h) => h.day === day && h.no === no)) {
      const res = K.result(rc); d.hist.push({ day, no, name: rc.name, grade: rc.grade || "", order: res.order.slice(0, 3), tan: pays.tan.wins[0] ? pays.tan.wins[0].per : 0, tierce: pays.tierce.wins[0] ? pays.tierce.wins[0].per : 0 });
      while (d.hist.length > 12) d.hist.shift();
      d.races++;
    }
    return { rc, pays, tickets: mine };
  };
  // レースを はじめる（がめんに はいった とき）: しめきって はらいもどしを きめる
  const start = (day, no) => {
    const d = sync(); if (day === today()) d.run[no] = true;
    const s = settle(day, no); Save.write();
    const horses = new Set(); for (const t of s.tickets) for (const k of t.keys) for (const v of R.parse(k)) { if (R.BY[t.t].byWaku) s.rc.horses.filter((h) => h.waku === v).forEach((h) => horses.add(h.no)); else horses.add(v); }
    return { pays: s.pays, tickets: s.tickets, won: s.tickets.reduce((a, t) => a + (t.st === "hit" ? t.pay : 0), 0), horses: [...horses] };
  };
  // あたった ばけんを ぜんぶ うけとる
  const claim = () => {
    const d = sync(), hits = d.tickets.filter((t) => t.st === "hit"); let sum = 0;
    for (const t of hits) { sum += t.pay; d.best = Math.max(d.best, t.pay); t.st = "paid"; }
    if (sum > 0) { Save.addCoins(sum); d.won += sum; Save.write(); }
    return { sum, n: hits.length };
  };
  const unpaid = () => sync().tickets.filter((t) => t.st === "hit");
  const open = () => sync().tickets.filter((t) => t.st === "open");
  // ばけんの ことば（たんしょう 5・3れんたん ボックス 1・4・9 など）
  const selText = (t) => { const T = R.BY[t.t]; if (t.m === "box") return t.sel.join("・"); if (T.n === 1) return t.sel.join("・"); return t.sel.join(T.ord ? " → " : " - "); };
  const ticketText = (t) => R.BY[t.t].name + (t.m === "box" ? " ボックス" : "") + "　" + selText(t);

  // ---- 10F の コーナー ----
  const ZONE = { x: 17, y: 15, w: 21, h: 13 };
  const patch10 = (r) => {
    if (!r || r.zones.some((z) => z.shop === "kd_keiba")) return;
    r.title = "10F あかり・シアター・けいば"; r.short = "あかり・シアター・けいば";
    r.zones.push({ shop: "kd_keiba", ...ZONE, label: "けいば ちゅうけい", map: "けいば ちゅうけい" });
    for (let y = ZONE.y; y < ZONE.y + ZONE.h; y++) for (let x = ZONE.x; x < ZONE.x + ZONE.w; x++) { const row = r.rows[y]; r.rows[y] = row.slice(0, x) + "e" + row.slice(x + 1); }
    r.mats = { ...r.mats, e: "kkeiba" };
    const F = (o) => r.fixtures.push({ shop: "kd_keiba", action: "keiba", ...o });
    F({ kind: "kbvision", x: 22, y: 16, w: 8, h: 1, height: 236, keiba: "watch", label: "おおがた ビジョン" });
    F({ kind: "kbodds", x: 18, y: 16, w: 3, h: 1, height: 176, keiba: "odds", label: "オッズの モニター" });
    F({ kind: "kbboard", x: 32, y: 16, w: 3, h: 1, height: 176, keiba: "board", label: "けっかの ボード" });
    for (const y of [19, 21]) for (const x of [22, 25, 28]) F({ kind: "kbseat", x, y, w: 3, h: 1, height: 50, keiba: "watch", label: "ちゅうけいの いす" });
    for (const x of [18, 20, 22]) F({ kind: "kbseller", x, y: 24, w: 1, h: 1, height: 150, keiba: "buy", label: "ばけんの じどう はつばいき" });
    F({ kind: "kbrefund", x: 24, y: 24, w: 1, h: 1, height: 150, keiba: "refund", label: "はらいもどしき" });
    F({ kind: "kbdesk", x: 27, y: 24, w: 2, h: 1, height: 96, keiba: "help", label: "マークカードの だい" });
    F({ kind: "kbnews", x: 30, y: 24, w: 1, h: 1, height: 110, keiba: "news", label: "けいば しんぶん" });
    r.fixtures.push({ kind: "npc", sp: "sheep", x: 33, y: 22, w: 1, h: 1, height: 110, label: "けいば コーナーの かかりの ひと", action: "keiba", keiba: "staff", shop: "kd_keiba", outfit: { body: "apron" } });
    r.fixtures.push({ kind: "npc", sp: "dog", ci: 1, x: 35, y: 19, w: 1, h: 1, height: 110, label: "けいばの ファン", action: "info", text: "つぎの レースは どの うまに しようかな。\nしんぶんの ◎ しるしも みてね！" });
    r.fixtures.push({ kind: "npc", sp: "cat", ci: 2, x: 19, y: 20, w: 1, h: 1, height: 110, label: "けいばの ファン", action: "info", text: "おおがた ビジョンで ちゅうけいを みると、\nゴールの まえが どきどき するよ！" });
    r.fixtures.push({ kind: "hangsign", x: 18, y: 15, w: 17, h: 1, z: 238, text: "けいば ちゅうけい", col: "#7CC28F", over: true, walk: true, fadeOver: true });
  };

  // ---- 什器の 絵（KadenHallArt に たす）----
  const T = () => IsoVenue.T, stl = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const M = {
    // おおがた ビジョン: 2ほんの あし・くろい わく・したに ふだ（がめんは L）
    kbvision(S, f) {
      const w = f.w;
      let s = S.ellipse(w / 2, 0.5, 0, w * 0.4, "#00000012", 0);
      for (const x of [0.6, w - 0.9]) s += S.box(x, 0.38, 0.3, 0.24, 0, 96, ["#7A808A", "#5E646E", "#8A909A"], 1.4);
      s += S.box(0.05, 0.3, w - 0.1, 0.4, 92, 144, ["#4A4F58", "#33373E", "#5A606A"], 1.8);
      s += S.poly([[0.2, 0.7, 98], [w - 0.2, 0.7, 98], [w - 0.2, 0.7, 230], [0.2, 0.7, 230]], "#1E2B33", 1.4);
      s += S.box(w / 2 - 1.6, 0.36, 3.2, 0.3, 74, 18, ["#7CC28F", "#5FA572", "#8FD0A0"], 1.4);
      return s;
    },
    // オッズの モニター: あしの ついた 2×2 の がめん
    kbodds(S, f) {
      const w = f.w;
      let s = S.box(w / 2 - 0.12, 0.42, 0.24, 0.16, 0, 100, ["#8A909A", "#6E747E", "#9AA0AA"], 1.2);
      s += S.box(0.08, 0.32, w - 0.16, 0.36, 96, 80, ["#4A4F58", "#33373E", "#5A606A"], 1.6);
      for (const [x0, z0] of [[0.18, 100], [w / 2 + 0.04, 100], [0.18, 138], [w / 2 + 0.04, 138]]) s += S.poly([[x0, 0.681, z0], [x0 + w / 2 - 0.26, 0.681, z0], [x0 + w / 2 - 0.26, 0.681, z0 + 34], [x0, 0.681, z0 + 34]], "#16232B", 1);
      return s;
    },
    // けっかの ボード（くろい いた・したに あし）
    kbboard(S, f) {
      const w = f.w;
      let s = S.box(0.4, 0.42, 0.2, 0.16, 0, 100, ["#8A909A", "#6E747E", "#9AA0AA"], 1.2) + S.box(w - 0.6, 0.42, 0.2, 0.16, 0, 100, ["#8A909A", "#6E747E", "#9AA0AA"], 1.2);
      s += S.box(0.06, 0.34, w - 0.12, 0.3, 94, 82, ["#3C4048", "#2A2D33", "#4C5058"], 1.6);
      s += S.poly([[0.16, 0.641, 100], [w - 0.16, 0.641, 100], [w - 0.16, 0.641, 170], [0.16, 0.641, 170]], "#1C2026", 1);
      return s;
    },
    // ちゅうけいの いす（みどりの いす 3つ。せなかが こちら）
    kbseat(S, f) {
      const w = f.w;
      let s = S.box(0.1, 0.42, w - 0.2, 0.16, 0, 18, ["#9AA0AA", "#7E848E", "#AAB0BA"], 1.2);
      for (let i = 0; i < 3; i++) { const x = 0.18 + i * ((w - 0.36) / 3); s += S.box(x, 0.18, (w - 0.36) / 3 - 0.08, 0.5, 18, 10, ["#7CC28F", "#5FA572", "#8FD0A0"], 1.3) + S.box(x, 0.66, (w - 0.36) / 3 - 0.08, 0.12, 22, 30, ["#8FD0A0", "#6FB582", "#9FE0B0"], 1.3); }
      return s;
    },
    // じどう はつばいき（クリームの からだ・みどりの おび・ななめの がめん・カードと コインの いれぐち）
    kbseller(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.45, "#00000012", 0) + S.box(0.08, 0.12, 0.84, 0.76, 0, 128, ["#F4F0E4", "#E0DACB", "#EAE5D8"], 1.6);
      s += S.box(0.08, 0.12, 0.84, 0.76, 128, 18, ["#7CC28F", "#5FA572", "#8FD0A0"], 1.5);
      s += S.poly([[0.18, 0.881, 70], [0.82, 0.881, 70], [0.82, 0.881, 116], [0.18, 0.881, 116]], "#24323B", 1.2);
      s += S.poly([[0.22, 0.881, 40], [0.78, 0.881, 40], [0.78, 0.881, 50], [0.22, 0.881, 50]], "#5A606A", 1);
      s += S.poly([[0.3, 0.881, 18], [0.7, 0.881, 18], [0.7, 0.881, 26], [0.3, 0.881, 26]], "#5A606A", 1);
      return s;
    },
    // はらいもどしき（あおい おび）
    kbrefund(S, f) {
      let s = S.ellipse(0.5, 0.5, 0, 0.45, "#00000012", 0) + S.box(0.08, 0.12, 0.84, 0.76, 0, 128, ["#F4F0E4", "#E0DACB", "#EAE5D8"], 1.6);
      s += S.box(0.08, 0.12, 0.84, 0.76, 128, 18, ["#7FB2E8", "#5F92C8", "#8FC2F8"], 1.5);
      s += S.poly([[0.18, 0.881, 70], [0.82, 0.881, 70], [0.82, 0.881, 116], [0.18, 0.881, 116]], "#24323B", 1.2);
      s += S.poly([[0.26, 0.881, 30], [0.74, 0.881, 30], [0.74, 0.881, 52], [0.26, 0.881, 52]], "#C9C3B4", 1.2);
      return s;
    },
    // マークカードの だい（たかい つくえ・いろの カード・あかい ペン）
    kbdesk(S, f) {
      const w = f.w, Z = 92;
      let s = S.box(0.15, 0.3, 0.16, 0.16, 0, Z, ["#9AA0AA", "#7E848E", "#AAB0BA"], 1.2) + S.box(w - 0.31, 0.3, 0.16, 0.16, 0, Z, ["#9AA0AA", "#7E848E", "#AAB0BA"], 1.2);
      s += S.box(0.05, 0.1, w - 0.1, 0.8, Z, 6, ["#F4F0E4", "#E0DACB", "#EAE5D8"], 1.5);
      ["#8FD0A0", "#9FC7EE", "#F7B7CF", "#FFE48A"].forEach((c, i) => { const x = 0.18 + i * ((w - 0.36) / 4); s += S.box(x, 0.18, (w - 0.36) / 4 - 0.06, 0.3, Z + 6, 4 + (i % 2) * 2, [c, MallArt.shade(c, -0.12), MallArt.shade(c, -0.2)], 1); });
      for (let i = 0; i < 3; i++) s += S.line([[0.3 + i * 0.5, 0.62, Z + 7], [0.55 + i * 0.5, 0.72, Z + 7]], "#E5483F", 2.4);
      return s;
    },
    // けいば しんぶんの ラック
    kbnews(S, f) {
      let s = S.box(0.12, 0.2, 0.76, 0.6, 0, 60, ["#C9A577", "#A98757", "#B99567"], 1.4);
      for (let i = 0; i < 3; i++) s += S.poly([[0.18, 0.78 - i * 0.12, 60 + i * 12], [0.82, 0.78 - i * 0.12, 60 + i * 12], [0.82, 0.74 - i * 0.12, 96 + i * 8], [0.18, 0.74 - i * 0.12, 96 + i * 8]], ["#FFFDF6", "#F7F3E8", "#FFFFFF"][i], 1.1) + S.poly([[0.24, 0.775 - i * 0.12, 82 + i * 10], [0.6, 0.775 - i * 0.12, 82 + i * 10], [0.6, 0.765 - i * 0.12, 90 + i * 9], [0.24, 0.765 - i * 0.12, 90 + i * 9]], ["#E5483F", "#3B7BD8", "#3AA45A"][i], 0);
      return s;
    },
  };
  // うごく ところ（がめん）
  const face = (ctx, sc, off, x, y, z) => { const o = sc.toScreen(IsoVenue.p(x, y, z), off), a = sc.toScreen(IsoVenue.p(x + 1 / T(), y, z), off), c = sc.toScreen(IsoVenue.p(x, y, z - 1), off); ctx.transform(a.x - o.x, a.y - o.y, c.x - o.x, c.y - o.y, o.x, o.y); };
  const nextHead = () => { const n = next(); return n ? K.head(today(), n) : null; };
  const L = {
    kbvision(ctx, sc, f, off) {
      const w = (f.w - 0.4) * T(), h = 128, nh = nextHead();
      ctx.save(); face(ctx, sc, off, f.x + 0.2, f.y + 0.701, 228); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      // ちいさな ちゅうけい（ながれる コース・はしる うま）
      const t = G.t, gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8FCDEB"); gr.addColorStop(1, "#D6EEF7"); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#A9CF8E"; ctx.fillRect(0, h * 0.42, w, h * 0.12); ctx.fillStyle = "#8FCB76"; ctx.fillRect(0, h * 0.54, w, h * 0.46);
      ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 14; i++) { const x = (((i * 40 - t * 120) % (w + 40)) + w + 40) % (w + 40) - 20; ctx.fillRect(x, h * 0.5, 3, 12); } ctx.fillRect(0, h * 0.5, w, 3);
      if (nh) {
        const rc = K.race(nh.day, nh.no);
        for (let i = 0; i < Math.min(5, rc.n); i++) { const hh = rc.horses[i], img = KeibaArt.horseImg(Math.floor(t * 9 + i) % 4, hh), x = w * 0.18 + i * w * 0.15 + Math.sin(t * 1.3 + i) * 10, y = h * 0.62 + (i % 3) * h * 0.1, sz = 70; if (img) ctx.drawImage(img, x - sz / 2, y - sz * 0.7, sz, (sz * KeibaArt.VB.h) / KeibaArt.VB.w); }
        ctx.fillStyle = "rgba(31,29,27,.55)"; ctx.fillRect(0, 0, w, 26); ctx.fillStyle = "#FFFFFF"; ctx.font = KeibaArt.FONT(15); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("つぎは " + K.title(nh) + "・" + nh.post + " はっそう", 10, 13, w - 20);
      } else { ctx.fillStyle = "rgba(31,29,27,.55)"; ctx.fillRect(0, 0, w, 26); ctx.fillStyle = "#FFFFFF"; ctx.font = KeibaArt.FONT(15); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("きょうの レースは ぜんぶ おわりました", 10, 13, w - 20); }
      ctx.restore();
      MallArt.planeText(ctx, sc, off, "y", f.x + f.w / 2, f.y + 0.67, 83, "けいば ちゅうけい", 12, 3 * T(), "#FFFFFF");
    },
    kbodds(ctx, sc, f, off) {
      const nh = nextHead(); if (!nh) return;
      const rc = K.race(nh.day, nh.no), b = K.board(rc, open()).slice().sort((a, c) => a.pop - c.pop), w = (f.w / 2 - 0.26) * T();
      [[0.18, 172], [f.w / 2 + 0.04, 172], [0.18, 134], [f.w / 2 + 0.04, 134]].forEach(([x0, z0], j) => {
        ctx.save(); face(ctx, sc, off, f.x + x0, f.y + 0.682, z0); ctx.fillStyle = "#16232B"; ctx.fillRect(0, 0, w, 34);
        ctx.font = KeibaArt.FONT(8); ctx.textBaseline = "middle"; ctx.textAlign = "left";
        if (j === 0) { ctx.fillStyle = "#FFE27A"; ctx.fillText(nh.no + "R たんしょう", 3, 7, w - 6); }
        const rows = j === 0 ? b.slice(0, 2) : b.slice(2 + (j - 1) * 3, 5 + (j - 1) * 3);
        rows.forEach((o, i) => { const y = j === 0 ? 17 + i * 10 : 7 + i * 10; ctx.fillStyle = (R.WAKU[rc.horses[o.no - 1].waku] || R.WAKU[1]).c; ctx.fillRect(3, y - 4, 9, 8); ctx.fillStyle = (R.WAKU[rc.horses[o.no - 1].waku] || R.WAKU[1]).t; ctx.textAlign = "center"; ctx.fillText(String(o.no), 7.5, y); ctx.fillStyle = "#9FE6B4"; ctx.textAlign = "right"; ctx.fillText(o.odds ? o.odds.toFixed(1) : "-", w - 3, y); });
        ctx.restore();
      });
    },
    kbboard(ctx, sc, f, off) {
      const d = st(), h = d.hist[d.hist.length - 1], w = (f.w - 0.32) * T();
      ctx.save(); face(ctx, sc, off, f.x + 0.16, f.y + 0.642, 168); ctx.fillStyle = "#1C2026"; ctx.fillRect(0, 0, w, 66);
      ctx.font = KeibaArt.FONT(9); ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#FFE27A";
      if (!h) ctx.fillText("けっかは まだ ないよ", 6, 12, w - 12);
      else {
        ctx.fillText(h.no + "R けっか", 6, 10, w - 12);
        h.order.forEach((no, i) => { ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.fillText(i + 1 + "", 8 + i * (w / 3.3), 30); ctx.fillStyle = "#FFB86B"; ctx.font = KeibaArt.FONT(15); ctx.fillText(String(no), 18 + i * (w / 3.3), 30); ctx.font = KeibaArt.FONT(9); });
        ctx.fillStyle = "#9FE6B4"; ctx.textAlign = "left"; ctx.fillText("たんしょう " + U.fmt(h.tan), 6, 52, w - 12);
      }
      ctx.restore();
    },
    kbseller(ctx, sc, f, off) {
      ctx.save(); face(ctx, sc, off, f.x + 0.18, f.y + 0.882, 116); const w = 0.64 * T(); ctx.fillStyle = Math.floor(G.t * 2) % 2 ? "#2F6E52" : "#285E46"; ctx.fillRect(0, 0, w, 46);
      ctx.fillStyle = "#FFFFFF"; ctx.font = KeibaArt.FONT(9); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ばけん", w / 2, 14, w - 4); ctx.fillStyle = "#FFE27A"; ctx.fillText("タッチ", w / 2, 32, w - 4); ctx.restore();
    },
    kbrefund(ctx, sc, f, off) {
      const n = st().tickets.filter((t) => t.st === "hit").length;
      ctx.save(); face(ctx, sc, off, f.x + 0.18, f.y + 0.882, 116); const w = 0.64 * T(); ctx.fillStyle = "#24427A"; ctx.fillRect(0, 0, w, 46);
      ctx.fillStyle = "#FFFFFF"; ctx.font = KeibaArt.FONT(8); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("はらいもどし", w / 2, 14, w - 4); if (n) { ctx.fillStyle = Math.floor(G.t * 3) % 2 ? "#FFE27A" : "#FFFFFF"; ctx.fillText("あたり " + n + "まい", w / 2, 32, w - 4); } ctx.restore();
    },
  };
  // ---- しらべる ----
  const interact = async (sc, f) => {
    const k = f.keiba;
    if (k === "watch") {
      const no = next();
      if (!no) { await UI.say([{ name: f.label, text: "きょうの レースは ぜんぶ おわったよ。\nまた あした きてね。" }]); return; }
      const h = K.head(today(), no), n = ticketsOf(today(), no).length;
      const i = await UI.ask("つぎは " + K.title(h) + "\n" + K.course(h) + "・" + h.n + "とう・" + h.post + " はっそう" + (n ? "\nかった ばけん: " + n + "まい" : "\nばけんは まだ かって いないよ"), ["ちゅうけいを みる", "ばけんを かう", "やめておく"]);
      if (i === 0) watch(sc, no);
      else if (i === 1) await KeibaUI.card(no);
      return;
    }
    if (k === "buy") { await KeibaUI.card(next() || 1); return; }
    if (k === "odds") { await KeibaUI.card(next() || 1, { view: true }); return; }
    if (k === "refund") { await KeibaUI.refund(); return; }
    if (k === "help") { await KeibaUI.help(); return; }
    if (k === "news") { await KeibaUI.news(); return; }
    if (k === "board") { await KeibaUI.lastResult(); return; }
    if (k === "staff") { await UI.say([{ name: f.label, text: "けいば ちゅうけい コーナーへ ようこそ！\nばけんを かって、おおがた ビジョンで レースを みてね。" }, { name: f.label, text: "ほんものの ばけんは 20さいに なってから。\nここでは ゲームの コインだけで あそぶよ。" }]); return; }
  };
  const watch = (sc, no) => { const at = [26, 23]; Game.goto("keiba", { day: today(), no, back: { venue: sc.id, floor: sc.floor, back: sc.back, at } }, "circle"); };
  const install = () => {
    const def = typeof VenueHalls !== "undefined" ? VenueHalls.defs.electronics : null;
    if (def && def.floors && def.floors[10]) patch10(def.floors[10]);
    if (typeof KadenHallArt !== "undefined") {
      Object.assign(KadenHallArt.M, M); Object.assign(KadenHallArt.L, L);
      KadenHallArt.MAT.kkeiba = { c: ["#E3F1DA", "#D9EBCE"], line: "#C3DDB5", pat: "carpet" };
      KadenHallArt.SHOPS.kd_keiba = MallArt.SHOP.kd_keiba = { name: "けいば", c: ["#E3F1DA", "#BFE0C8", "#7CC28F"] };
    }
    if (typeof KadenHall !== "undefined" && !KadenHall.keibaHook) {
      const prev = KadenHall.interact.bind(KadenHall);
      KadenHall.interact = async (sc, f) => {
        if (f.action !== "keiba") return prev(sc, f);
        sc.busy = true;
        try { Sound.se("tap"); await interact(sc, f); } finally { sc.busy = false; }
        return true;
      };
      KadenHall.keibaHook = true;
    }
  };
  install();
  // PokaDebug: いまの ようす
  const state = () => { const d = sync(); return { day: d.day, next: next(), run: Object.keys(d.run).map(Number).sort((a, b) => a - b), open: open().length, hits: unpaid().length, unpaid: unpaid().reduce((a, t) => a + t.pay, 0), tickets: d.tickets.length, bets: d.bets, spent: d.spent, won: d.won, best: d.best, races: d.races, hist: d.hist.slice(-3) }; };
  return { CAP, MAXU, ZONE, fresh, st, sync, today, next, runToday, ticketsOf, spentOn, check, buy, settle, start, claim, unpaid, open, selText, ticketText, patch10, M, L, interact, watch, state };
})();
