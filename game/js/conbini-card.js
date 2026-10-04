// コンビニの ポイントカード（UI-85・オーナーの 指示 2026-10-04「コンビニ（2店舗は別々に扱う）において、ポイントカードを用意して。…
// 購入時に200円ごとに10ポイント貯まる。100ポイント、200,500,800,1000,2000,3000,5000,10000ごとに、素敵な景品と交換できる仕組み」）。
// ・ネリカスタウンの 2つの コンビニ（ローリソン・せぶんぶん）は べつべつの カード。カードは 4しゅ: 2つの みせの ポイントカード と、
//   10000ポイントの ひみつの けいひんで なれる オーナー カード（ポイントは そのまま つづく）。もちものの「だいじな もの」に でる。
// ・かいもの（おみせの まどで かう・いちばんくじを ひく）で はらった コイン 200 ごとに 10ポイント。200 に たりない ぶんは つぎの かいものに もちこす。
//   はじめて かった ときに カードを つくる（てんいんさんに はなして「ポイントカード」からも つくれる）。クーポンで もらった ものは 0。
// ・こうかん（ポイントは へる）: 100 クレーン チケット（Meeときょれじゃの クレーンゲームが 1かい ただ・js/crane-scene.js）・
//   1000／2000 おてつだい レベル +10／+25 けん（すきな おみせを えらぶ・30 まで・とどいた レベルの ごほうびも もらえる）・
//   5000 バスの ていきけん（はんとし バスが ただ・js/transit.js）・10000 ひみつ（コンビニ オーナー けん: その みせの しなものが 10%びき・てんいんさんが とても ていねいに）。
//   200・500・800・3000 の ごわが コラボ（かんジュース・コップ・おさら・おふろ グッズ。みせごとに ちがう）は add() で たす。
// ・セーブ: Save.d.conbiniCard（Save.SCHEMA は 2 の まま・たす だけ）
//   shops { みせ: { has カード・pts いまの ポイント・carry 200 に たりない コイン・total これまで ためた ポイント・used つかった ポイント・spent かいものの コイン・
//                   owner オーナーに なった 日（"" は まだ）・got { けいひん: こうかんした かず } } }・tickets { crane, lv10, lv25: まいすう }・bus { until: ていきけんの さいごの 日 }・log さいきんの こうかん
const ConbiniCard = (() => {
  const STORES = ["lawson", "sevenbun"], PER = 200, PTS = 10, OFF = 0.9, BUS_MONTHS = 6, TICKET_MAX = 999, LOG_MAX = 30;
  const LV_ADD = { lv10: 10, lv25: 25 };
  const NAME = { lawson: "ローリソン", sevenbun: "せぶんぶん" };
  // こうかんの けいひん（2つの みせで おなじ。ごわが コラボは みせごとに ちがう ので add で たす）
  const PRIZES = [
    { id: "crane", cost: 100, name: "クレーン チケット", desc: "Meeときょれじゃの クレーンゲームが 1かい ただ（コイン プッシャーは のぞく）", unit: "まい" },
    { id: "lv10", cost: 1000, name: "おてつだい レベル +10 けん", desc: "すきな おてつだいの おみせ レベルが 10 あがる（30 まで）", unit: "まい" },
    { id: "lv25", cost: 2000, name: "おてつだい レベル +25 けん", desc: "すきな おてつだいの おみせ レベルが 25 あがる（30 まで）", unit: "まい" },
    { id: "bus", cost: 5000, name: "バスの ていきけん", desc: "はんとし（6かげつ）の あいだ バスが ただ。もって いれば のばせる" },
    { id: "owner", cost: 10000, name: "コンビニ オーナー けん", secret: true, desc: "この おみせの オーナーに なれる。しなものが 10%びき・てんいんさんが とても ていねいに なる" },
  ];
  const EXTRA = { lawson: [], sevenbun: [] };
  // オーナーの ときの てんいんさん（とても ていねい）
  const POLITE = {
    lawson: ["おかえりなさいませ、オーナー！ あげたての からあげを ごよういして おります。", "オーナー、いつも まことに ありがとう ございます。どうぞ ごゆっくり ごらんくださいませ。"],
    sevenbun: ["おかえりなさいませ、オーナー！ おでんが ぐつぐつと にえて おります。", "オーナー、ほんじつも ようこそ おこしくださいました。あったかい ココアも ございます。"],
  };
  const THANKS = { lawson: "おかいあげ まことに ありがとう ございます、オーナー！", sevenbun: "まことに ありがとう ございます、オーナー！ また おまちして おります。" };

  const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v)) || 0));
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
  const DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const dnum = (s) => { const m = DAY.exec(String(s || "")); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0; };
  const dparse = (s) => { const m = DAY.exec(String(s || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const dstr = (t) => `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
  const dtext = (s) => { const t = dparse(s); return t ? `${t.getFullYear()}ねん ${t.getMonth() + 1}がつ ${t.getDate()}にち` : ""; };
  // start の 日から n かげつ かん の さいごの 日（n かげつ あとの おなじ 日〔ない 日は その月の おわり〕の まえの 日）
  const lastDay = (start, months) => {
    const y = start.getFullYear(), m = start.getMonth() + months, days = new Date(y, m + 1, 0).getDate();
    const t = new Date(y, m, Math.min(start.getDate(), days)); t.setDate(t.getDate() - 1); return t;
  };
  const freshShop = () => ({ has: false, pts: 0, carry: 0, total: 0, used: 0, spent: 0, owner: "", got: {} });
  const fresh = () => ({ shops: { lawson: freshShop(), sevenbun: freshShop() }, tickets: { crane: 0, lv10: 0, lv25: 0 }, bus: { until: "" }, log: [] });
  // セーブを よむ たびに かたちを なおす（こわれた かず・ふるい セーブ）
  const st = () => {
    const d = obj(Save.d.conbiniCard) || (Save.d.conbiniCard = fresh());
    d.shops = obj(d.shops) || {};
    for (const s of STORES) {
      const c = (d.shops[s] = obj(d.shops[s]) || freshShop());
      c.has = !!c.has; for (const k of ["pts", "total", "used", "spent"]) c[k] = int(c[k], 0, 1e9);
      c.carry = int(c.carry, 0, PER - 1); c.owner = dnum(c.owner) ? c.owner : ""; c.got = obj(c.got) || {};
    }
    d.tickets = obj(d.tickets) || {};
    for (const k of ["crane", "lv10", "lv25"]) d.tickets[k] = int(d.tickets[k], 0, TICKET_MAX);
    d.bus = obj(d.bus) || {}; d.bus.until = dnum(d.bus.until) ? d.bus.until : "";
    if (!Array.isArray(d.log)) d.log = [];
    return d;
  };
  const ready = () => typeof Save !== "undefined" && !!Save.d;

  const API = {
    STORES, PER, PTS, OFF, BUS_MONTHS, NAME, PRIZES, POLITE, fresh, st, dtext, lastDay, dstr,
    card(shop) { return STORES.includes(shop) ? st().shops[shop] : null; },
    // カードの なまえ（4しゅ）
    cardName(shop) { const c = this.card(shop); return `${NAME[shop] || ""} ${c && c.owner ? "オーナー カード" : "ポイントカード"}`; },
    owner(shop) { return STORES.includes(shop) && ready() && !!st().shops[shop].owner; },
    // こうかんの けいひん（その みせ。ねだんの じゅん）
    prizes(shop) { return [...PRIZES, ...(EXTRA[shop] || [])].sort((a, b) => a.cost - b.cost); },
    prize(shop, id) { return this.prizes(shop).find((p) => p.id === id) || null; },
    // ごわが コラボ など（みせごとの けいひん）を たす: { id, cost, name, desc, icon(), give(shop) → false なら こうかん しない }
    add(shop, p) { if (EXTRA[shop] && !this.prize(shop, p.id)) EXTRA[shop].push(p); },
    // カードを つくる（むりょう）
    make(shop) { const c = this.card(shop); if (!c || c.has) return false; c.has = true; Save.mark(); return true; },
    // かいもので はらった コイン → ポイント（200 ごとに 10・あまりは もちこし）
    earn(shop, coins) {
      const c = this.card(shop); coins = int(coins, 0, 1e9);
      if (!c || !coins) return null;
      const first = !c.has, before = c.pts, sum = c.carry + coins, n = Math.floor(sum / PER) * PTS;
      c.has = true; c.spent += coins; c.carry = sum % PER; c.pts += n; c.total += n;
      Save.mark();
      const opened = this.prizes(shop).filter((p) => p.cost > before && p.cost <= c.pts && !(p.id === "owner" && c.owner));
      return { shop, first, coins, pts: n, now: c.pts, carry: c.carry, need: PER - c.carry, opened };
    },
    // こうかん。ポイントが たりない・もう オーナー・わたせない ときは null
    exchange(shop, id) {
      const d = st(), c = this.card(shop), p = this.prize(shop, id);
      if (!c || !p || !c.has || c.pts < p.cost || (p.id === "owner" && c.owner)) return null;
      if (p.give && p.give(shop) === false) return null;
      const out = { shop, prize: p };
      if (d.tickets[p.id] !== undefined) d.tickets[p.id] = Math.min(TICKET_MAX, d.tickets[p.id] + 1);
      else if (p.id === "bus") out.until = this.extendBus();
      else if (p.id === "owner") c.owner = U.today();
      c.pts -= p.cost; c.used += p.cost; c.got[p.id] = (c.got[p.id] || 0) + 1; out.left = c.pts;
      d.log.unshift([U.today(), shop, p.id]); if (d.log.length > LOG_MAX) d.log.length = LOG_MAX;
      Save.mark(); Save.write();
      return out;
    },
    // ---- チケット ----
    tickets(kind = "crane") { return ready() ? st().tickets[kind] || 0 : 0; },
    takeTicket(kind = "crane") { const t = st().tickets; if (!(t[kind] > 0)) return false; t[kind]--; Save.mark(); return true; },
    giveTicket(kind = "crane", n = 1) { const t = st().tickets; if (t[kind] === undefined) return false; t[kind] = Math.min(TICKET_MAX, t[kind] + int(n, 0, TICKET_MAX)); Save.mark(); return true; },
    // おてつだい レベル けん: えらべる おみせ（いまの レベル → つかった あと）
    lvTargets(kind) {
      const add = LV_ADD[kind] || 0, max = ShopRewards.maxLevel;
      return Object.keys(ShopRewards.themes).filter((s) => SHOPS[s] && Save.d.shops[s]).map((s) => { const from = ShopRewards.level(Save.d.shops[s]); return { shop: s, name: SHOPS[s].name, from, to: Math.min(max, from + add) }; });
    },
    useLv(kind, shop) {
      const d = st(), add = LV_ADD[kind], s = Save.d.shops[shop];
      if (!add || !(d.tickets[kind] > 0) || !s || !ShopRewards.themes[shop]) return null;
      const from = ShopRewards.level(s), to = Math.min(ShopRewards.maxLevel, from + add);
      if (to <= from) return null;
      d.tickets[kind]--; s.rep = Math.max(int(s.rep, 0, 1e9), SHOP_LV_REP[to]); s.lv = to;
      const prizes = ShopRewards.claim(shop);
      Save.mark(); Save.write();
      return { shop, kind, from, to, prizes };
    },
    // ---- バスの ていきけん ----
    busUntil() { return ready() ? st().bus.until : ""; },
    busFree(day = U.today()) { const u = this.busUntil(); return !!u && dnum(day) <= dnum(u); },
    // はんとし のばす（もって いれば その つぎの 日から）。さいごの 日を かえす
    extendBus(day = U.today()) {
      const b = st().bus, start = this.busFree(day) ? dparse(b.until) : dparse(day);
      if (this.busFree(day)) start.setDate(start.getDate() + 1);
      b.until = dstr(lastDay(start, BUS_MONTHS)); Save.mark();
      return b.until;
    },
    busText() { return this.busFree() ? `${dtext(this.busUntil())} まで` : ""; },
    // ---- オーナー ----
    // コンビニの ねだん（ConbiniGoods.price を つつむ）: オーナーの みせは 10%びき
    ownerPrice(shop, p) { return this.owner(shop) ? Math.max(1, Math.round(p * OFF)) : p; },
  };

  // ---- がめん: ポイントカードの まど ----
  const clerk = (shop) => { const S = NeriShops.SHOPS[shop]; return { name: S.keeperName, face: Art.npcSvg({ ...S.keeper, emo: "happy" }) }; };
  const say = (shop, text) => { const k = clerk(shop); return UI.say([{ name: k.name, face: k.face, text }]); };
  const fmt = (n) => U.fmt(n);
  API.icon = (shop, p) => (p.icon ? p.icon(shop) : ConbiniCardArt.prize(p.id, shop));
  API.open = (shop) => new Promise((resolve) => {
    if (!STORES.includes(shop)) { resolve(); return; }
    const body = U.el("div", { class: "cc-wrap" });
    const render = () => {
      const c = API.card(shop), title = body.closest(".panel")?.querySelector(".panel-title");
      if (title) title.textContent = API.cardName(shop); // オーナーに なると「オーナー カード」
      body.replaceChildren();
      const pic = U.el("div", { class: "cc-card", html: ConbiniCardArt.big(shop, !!c.owner) });
      pic.setAttribute("role", "img"); pic.setAttribute("aria-label", API.cardName(shop));
      body.append(pic);
      body.append(U.el("div", { class: "cc-pts", html: `<b>${fmt(c.pts)}</b><span>ポイント</span>` }));
      body.append(U.el("div", { class: "cc-info", html: `<span>これまで ためた ポイント ${fmt(c.total)}</span><span>つぎの ${PTS}ポイント まで あと ${PER - c.carry}コイン</span>` }));
      body.append(U.el("div", { class: "note cc-rule", text: c.owner ? `${PER}コイン かうごとに ${PTS}ポイント。オーナーなので この おみせの しなものは 10%びき だよ。` : `${PER}コイン かうごとに ${PTS}ポイント（いちばんくじも）。ためた ポイントで けいひんと こうかん できるよ。` }));
      const list = U.el("div", { class: "cc-list" });
      for (const p of API.prizes(shop)) {
        const done = p.id === "owner" && !!c.owner, hide = p.secret && !c.got[p.id], can = !done && c.pts >= p.cost;
        const row = U.el("div", { class: "cc-prize" + (can ? " can" : "") + (done ? " done" : "") });
        row.dataset.id = p.id;
        const have = API.tickets(p.id);
        row.append(U.el("div", { class: "cc-ico", html: hide ? ConbiniCardArt.prize("secret") : API.icon(shop, p) }));
        const txt = U.el("div", { class: "cc-txt" });
        txt.append(U.el("b", { text: hide ? "？？？ ひみつの けいひん" : p.name }), U.el("div", { class: "muted", text: hide ? "なにが もらえるかは こうかん してからの おたのしみ。" : p.desc }),
          U.el("div", { class: "cc-cost", text: `${fmt(p.cost)}ポイント${have && p.unit ? `　もってる ${have}${p.unit}` : ""}${p.id === "bus" && API.busFree() ? `　${API.busText()}` : ""}` }));
        row.append(txt);
        const b = UI.btn(done ? "オーナー" : "こうかん", () => trade(p), can ? "yellow small cc-trade" : "small cc-trade");
        b.disabled = !can; b.setAttribute("aria-label", (hide ? "ひみつの けいひん" : p.name) + "と こうかん");
        row.append(b);
        list.append(row);
      }
      body.append(list);
    };
    const trade = async (p) => {
      const c = API.card(shop); if (c.pts < p.cost) return;
      const hide = p.secret && !c.got[p.id];
      if (!(await UI.confirm(`${hide ? "ひみつの けいひん" : p.name}と こうかん する？\n${fmt(p.cost)}ポイント つかうよ（いま ${fmt(c.pts)}ポイント）。`, "こうかん", "やめる"))) return;
      const r = API.exchange(shop, p.id);
      if (!r) { Sound.se("bad"); render(); return; }
      Sound.se(p.id === "owner" ? "fanfare" : "buy");
      render();
      await API.after(shop, r);
      render();
    };
    UI.modal({ title: API.cardName(shop), body, cls: "full cc-modal", onClose: () => resolve() });
    render();
    API.view = { shop, render };
  });
  // こうかんした あと（てんいんさんの ことば・つかいかた）
  API.after = async (shop, r) => {
    const p = r.prize, polite = API.owner(shop) && p.id !== "owner";
    if (p.id === "crane") await say(shop, polite ? "クレーン チケットで ございます。Meeときょれじゃの クレーンゲームで おつかい くださいませ。" : "クレーン チケットだよ！ Meeときょれじゃの クレーンゲームで「チケットで あそぶ」を えらんでね。");
    else if (LV_ADD[p.id]) {
      await say(shop, polite ? `${p.name}で ございます。おすきな おてつだいを おえらび くださいませ。` : `${p.name}だよ！ すきな おてつだいの おみせを えらんでね。`);
      if (await UI.confirm("いま つかう？\n（もちものの「だいじな もの」からも つかえるよ）", "つかう", "あとで")) await API.chooseLv(p.id);
    } else if (p.id === "bus") await say(shop, polite ? `バスの ていきけんで ございます。${dtext(r.until)} まで バスに ただで おのり いただけます。` : `バスの ていきけん！ ${dtext(r.until)} まで バスが ただ だよ。`);
    else if (p.id === "owner") {
      await say(shop, "おめでとう ございます！ ひみつの けいひんは「コンビニ オーナー けん」で ございました。");
      await say(shop, `ほんじつから あなたさまが ${NAME[shop]}の オーナーで ございます。しなものは いつでも 10%びき。これからは まごころを こめて おもてなし いたします！`);
    } else if (p.after) await p.after(shop, r);
    else UI.toast(`${p.name}を もらったよ！`, "good");
  };
  // おてつだい レベル けんを つかう おみせを えらぶ
  API.chooseLv = (kind) => new Promise((resolve) => {
    if (!(API.tickets(kind) > 0)) { resolve(null); return; }
    const body = U.el("div", { class: "cc-lv" }), add = LV_ADD[kind];
    body.append(U.el("p", { class: "note", text: `どの おてつだいの おみせ レベルを ${add} あげる？（30 まで。とどいた レベルの ごほうびも もらえるよ）` }));
    let m = null;
    for (const t of API.lvTargets(kind)) {
      const b = UI.btn(`${t.name}　Lv.${t.from} → Lv.${t.to}`, async () => {
        if (!(await UI.confirm(`${t.name}の おみせ レベルを Lv.${t.from} → Lv.${t.to} に する？`, "つかう", "やめる"))) return;
        const r = API.useLv(kind, t.shop);
        if (!r) { Sound.se("bad"); return; }
        Sound.se("fanfare"); const mm = m; m = null; mm.close();
        UI.toast(`${t.name}が おみせ レベル ${r.to}に なった！`, "good");
        for (const p of r.prizes) UI.toast(`Lv.${p.level}の ごほうび「${p.name}」を もらったよ`, "good");
        resolve(r);
      }, "cc-lv-btn");
      b.dataset.shop = t.shop; if (t.to <= t.from) b.disabled = true;
      body.append(b);
    }
    m = UI.modal({ title: add === 25 ? "おてつだい レベル +25 けん" : "おてつだい レベル +10 けん", body, onClose: () => { if (m) { m = null; resolve(null); } } });
  });

  // ---- くみこみ ----
  // 1) おみせの まど: かうと ポイント（さいしょは カードを つくる）・オーナーは ていねいな あいさつと 10%びき
  const after = async (shop, r, quiet = false) => {
    if (!r) return;
    if (r.first && quiet) UI.toast(`${NAME[shop]}の ポイントカードを つくったよ`, "good");
    else if (r.first) await say(shop, `ポイントカードを つくったよ！\n${PER}コイン かうごとに ${PTS}ポイント たまるよ。ためた ポイントは てんいんに はなして「ポイントカード」で こうかんしてね。`);
    if (API.owner(shop) && !quiet) UI.toast(THANKS[shop], "good");
    UI.toast(r.pts ? `ポイント +${r.pts}（いま ${fmt(r.now)}ポイント）` : `ポイントカード: あと ${r.need}コインで +${PTS}ポイント`, r.pts ? "good" : "");
    if (r.opened.length) UI.toast("こうかん できる けいひんが あるよ！", "good");
  };
  for (const shop of STORES) {
    const B = BUY_SHOPS[shop]; if (!B) continue;
    const bought0 = B.bought, note0 = B.note;
    B.bought = (it, qty) => {
      const extra = bought0 ? bought0(it, qty) : null, r = API.earn(shop, it.price * qty);
      return async () => { if (extra) await extra(); await after(shop, r); };
    };
    B.note = (it) => [note0 ? note0(it) : "", API.owner(shop) && it.basePrice ? `オーナー さまは 10%びき（いつもは ${ConbiniGoods.price0(shop, BAG_INDEX[it.id] || it)}コイン）` : ""].filter(Boolean).join("<br>");
    let hello0 = B.hello;
    Object.defineProperty(B, "hello", { configurable: true, enumerable: true, get: () => (API.owner(shop) ? POLITE[shop] : hello0), set: (v) => { hello0 = v; } });
  }
  // コンビニの ねだん（1.5ばい）に オーナーの 10%びきを かさねる
  ConbiniGoods.price0 = ConbiniGoods.price;
  ConbiniGoods.price = (shop, it) => API.ownerPrice(shop, ConbiniGoods.price0(shop, it));
  // 2) いちばんくじ（1かい 1000コイン）も かいもの
  {
    const draw0 = IchibanKuji.draw;
    IchibanKuji.draw = function (s, n) {
      const r = draw0.call(this, s, n);
      if (r && STORES.includes(s)) { r.points = API.earn(s, r.price); after(s, r.points, true); }
      return r;
    };
  }
  // 3) てんいんさんに はなす: 「ポイントカード」（js/store-iso.js の talk）
  API.talkChoice = (sc) => (STORES.includes(sc.shopId) ? { label: "ポイントカード", run: async () => {
    const c = API.card(sc.shopId);
    if (!c.has) {
      if (!(await UI.confirm(`${clerk(sc.shopId).name}「ポイントカードを つくる？ むりょう だよ。\n${PER}コイン かうごとに ${PTS}ポイント たまるよ」`, "つくる", "やめる"))) return;
      API.make(sc.shopId); Sound.se("buy"); Save.write();
    }
    await API.open(sc.shopId);
  } } : null);
  // 4) おみせに はいった とき: オーナーには ていねいな あいさつ
  if (typeof StoreScene !== "undefined") {
    const enter0 = StoreScene.prototype.enter;
    StoreScene.prototype.enter = async function (p) {
      await enter0.call(this, p);
      if (API.owner(this.shopId)) UI.toast(`${NeriShops.SHOPS[this.shopId].keeperName}「${POLITE[this.shopId][0]}」`, "good");
    };
  }
  // 5) もちものの「だいじな もの」: カード 4しゅ・チケット・ていきけん（レベル けんは ここからも つかえる）
  {
    const bag0 = Menu.bag;
    Menu.bag = function (el) {
      if (ready()) API.bagKeys(el, () => { el.innerHTML = ""; Menu.bag(el); });
      return bag0.call(this, el);
    };
  }
  API.bagKeys = (el, redraw) => {
    const key = (svg, name, note, btn) => {
      const k = U.el("div", { class: "key-item cc-key", html: `${svg}<div class="cc-key-txt"><div class="nm"></div><div class="muted"></div></div>` });
      k.querySelector(".nm").textContent = `だいじな もの：${name}`; k.querySelector(".muted").textContent = note;
      if (btn) k.append(btn);
      el.append(k);
    };
    for (const s of STORES) {
      const c = API.card(s); if (!c.has) continue;
      key(ConbiniCardArt.icon(s, !!c.owner), API.cardName(s), `${fmt(c.pts)}ポイント（これまで ${fmt(c.total)}）${c.owner ? "・この おみせの しなものが 10%びき" : ""}`);
    }
    const t = st().tickets;
    if (t.crane) key(ConbiniCardArt.prize("crane"), `クレーン チケット ×${t.crane}`, "Meeときょれじゃの クレーンゲームで「チケットで あそぶ」");
    for (const kind of ["lv10", "lv25"]) if (t[kind]) {
      const p = PRIZES.find((x) => x.id === kind);
      key(ConbiniCardArt.prize(kind), `${p.name} ×${t[kind]}`, p.desc, UI.btn("つかう", async () => { const r = await API.chooseLv(kind); if (r) redraw(); }, "small yellow cc-use"));
    }
    if (API.busFree()) key(ConbiniCardArt.prize("bus"), "バスの ていきけん", `${API.busText()} バスが ただ`);
  };
  return API;
})();
