// ② 町の人の 会話（docs/design/features/townsfolk の 見本 tools/feature-design/folk-ref.js の TownFolkRef を 移した もの）。
// データは TOWNSFOLK_DATA（自動生成）。さいきん 出た セリフは メモリだけに おぼえる（セーブしない）。
const TownFolk = {
  TIP_SHARE: 0.3,    // いまの TALKS[npc].lines（あそびかたの ヒント）を 出す わりあい
  REACT_CHANCE: 0.35, // 話した あとに 3人の だれかが ひとこと
  RECENT: 12,        // おなじ 人の さいきんの セリフは この 数だけ 出さない
  recent: {}, recentReact: [], last: null,
  data() { return typeof TOWNSFOLK_DATA !== "undefined" ? TOWNSFOLK_DATA : null; },
  // あとから できる しせつ・あそび（feature: の 条件）。できたかどうかは グローバル名と マップで 見る
  features() {
    return {
      fishing: typeof FISHING_DATA !== "undefined", fossil: typeof FOSSIL_DATA !== "undefined",
      aquarium: !!MAP_DEFS.aquarium, museum: !!MAP_DEFS.museum, range: typeof RANGE_DATA !== "undefined",
      heiwadai2: ((MAP_DEFS.heiwadai || {}).rows || []).length >= 60, // 平和台 v0.2（64×68）が できたら
    };
  },
  bond(npcId) { return ((Save.d.folk || {}).bond || {})[npcId] || 0; },
  // いまの ようす（when の キーと 同じ 名前）
  context(npcId) {
    return { time: U.dayPart(), weather: Weather.kind(), season: Seasonal.current().id, festival: AnnualFestivals.current().id,
      event: Save.d.flags.boss ? ["boss"] : [], feature: this.features(), bond: this.bond(npcId), person: npcId };
  },
  // 町の なかま（town_walker0 など）は 役（town_walker）の セリフと 名前を つかう
  role(npcId) { return ((this.data() || {}).crowd || {})[npcId] || null; },
  name(n) { const r = this.role(n.id); return (r && this.data().crowdNames[r]) || n.name; },
  // その人の セリフを 1つ（なければ null）
  line(n) {
    const D = this.data(); if (!D) return null;
    const who = this.role(n.id) || n.id, list = D.lines.filter(l => l.npc === who);
    const r = this.recent[who] || (this.recent[who] = []), l = U.condPick(list, this.context(n.id), r);
    if (l) { r.push(l.id); if (r.length > this.RECENT) r.shift(); }
    return l;
  },
  // 話した あとの 3人の ひとこと（person は 話した あいて）
  react(n) {
    const D = this.data(); if (!D) return null;
    const l = U.condPick(D.react, this.context(n.id), this.recentReact);
    if (l) { this.recentReact.push(l.id); if (this.recentReact.length > this.RECENT) this.recentReact.shift(); }
    return l;
  },

  // ---- おねがい（2番）。しくみは TownFolkRef の offer / answer / signal / match / targets / rewards と 同じ ----
  MAX_ACTIVE: 3,
  // いま すすめられる 手順（3番で find・tap・follow・photo を 足す。catch・dig は ③④ が できてから）
  STEPS: ["buy", "give", "talk", "quiz", "trade"],
  forced: null, // PokaDebug.folkOffer: つぎに その人と 話した とき かならず もちかける
  st() { return Save.d.folk; },
  today() { return U.today(); },
  have() { return { bag: Save.d.bag || {}, fish: {}, bone: {} }; },
  needsOk(needs, c) { return (needs || []).every((f) => c.feature[f]); },
  ready(ev) { return ev.steps.every((s) => this.STEPS.includes(s.do)); },
  event(id) { return ((this.data() || {}).events || []).find((e) => e.id === id) || null; },
  isDone(ev, today = this.today()) { const d = this.st().done[ev.id]; return ev.limit === "once" ? !!d : d === today; },
  npcDef(id) { for (const [map, d] of Object.entries(MAP_DEFS)) { const n = (d.npcs || []).find((x) => x.id === id); if (n) return { ...n, map }; } return null; },
  short(id) { const n = this.npcDef(id), nm = n ? this.name(n) : id; return nm.split(" ").pop(); },
  face(id) { const n = this.npcDef(id); return n ? Art.npcSvg({ sp: n.sp, col: n.col, stripe: n.stripe, outfit: n.outfit, emo: "happy" }) : ""; },
  itemName(id) { const D = this.data(); return (D.items[id] || {}).name || (BAG_INDEX[id] || {}).name || id; },
  itemArt(id) { const it = this.data().items[id]; if (!it) return BAG_INDEX[id] ? Art.iconSvg("bag", id) : ""; const [k, v] = it.art.split(":"); return k === "folk" ? TownFolkArt.item(v) : Art.iconSvg(k, v); },
  // 話しかけた とき、おねがいを もちかけるか きめる。ことわった ものは その日の うちなら もう一度。1人 1日 1回まで
  offer(npcId, rand = Math.random) {
    const D = this.data(); if (!D) return null;
    const st = this.st(), today = this.today(), c = this.context(npcId), active = new Set(st.req.map((r) => r.id));
    if (this.forced && this.forced.npc === npcId) { const ev = this.event(this.forced.id); this.forced = null; if (ev && !active.has(ev.id) && st.req.length < this.MAX_ACTIVE) return { type: "event", ev }; }
    const o = st.offered[npcId];
    if (o && o.day === today) {
      if (o.wait) { const ev = this.event(o.wait); if (ev && !active.has(ev.id) && !this.isDone(ev, today) && st.req.length < this.MAX_ACTIVE) return { type: "event", ev }; }
      return null;
    }
    const evs = D.events.filter((e) => e.giver === npcId && this.ready(e) && !active.has(e.id) && !this.isDone(e, today) && U.condScore(e.when, c) >= 0 && this.needsOk(e.needs, c));
    if (evs.length && st.req.length < this.MAX_ACTIVE && rand() < Math.max(...evs.map((e) => e.chance))) {
      let r = rand() * evs.reduce((a, e) => a + e.chance, 0);
      for (const e of evs) { r -= e.chance; if (r < 0) return { type: "event", ev: e }; }
      return { type: "event", ev: evs[evs.length - 1] };
    }
    return null;
  },
  // こたえを きろくする。ことわった（あとでね）ものは その日の あいだ まって もらう
  answer(off, ok) {
    const st = this.st(), today = this.today(), ev = off.ev;
    st.offered[ev.giver] = ok ? { day: today } : { day: today, wait: ev.id };
    if (ok) st.req.push({ id: ev.id, step: 0, n: 0, day: today, carry: this.carryOf(ev) });
    Save.mark();
  },
  carryOf(ev) { const s = ev.steps.find((x) => x.carry || x.start); return s ? s.start || s.item : null; },
  stepOf(r) { const ev = this.event(r.id); return ev ? ev.steps[r.step] : null; },
  // できごと（signal）で おねがいを すすめる（状態だけ）。すすんだ ものの 一覧を かえす
  signal(sig) {
    const D = this.data(), st = this.st(), have = this.have(), today = this.today(), moved = [];
    for (const r of st.req) {
      const ev = this.event(r.id);
      for (let guard = 0; ev && guard < 4; guard++) {
        const s = ev.steps[r.step];
        if (!s || !this.match(s, sig, r, have, D)) break;
        r.n += sig.n || 1;
        if (s.do === "find") { if (s.npc) r.follow = s.npc; else r.carry = s.item; }
        if (s.do === "trade") r.carry = s.chain[r.n - 1][1];
        const need = s.do === "trade" ? s.chain.length : s.do === "quiz" ? s.q.length : ["tap", "catch", "dig"].includes(s.do) ? s.n || 1 : 1;
        const stepDone = r.n >= need;
        if (stepDone) { r.step++; r.n = 0; if (s.do === "follow") r.follow = null; if (s.do === "give" && r.carry === s.item) r.carry = null; }
        moved.push({ r, ev, step: s, stepDone, done: r.step >= ev.steps.length });
        if (!(stepDone && s.do === "buy")) break;
      }
    }
    st.req = st.req.filter((r) => { const ev = this.event(r.id); return ev && r.step < ev.steps.length; });
    for (const m of moved) if (m.done) st.done[m.ev.id] = m.ev.limit === "once" ? "once" : today;
    if (moved.length) Save.mark();
    return moved;
  },
  match(s, sig, r, have, D) {
    const onMap = (m) => !s.map || s.map === m, talkTo = (npc) => sig.do === "talk" && sig.npc === npc && onMap(sig.map);
    switch (s.do) {
      case "buy": return (sig.do === "have" || sig.do === "talk") && (have.bag[s.item] || 0) >= s.n;
      case "give":
        if (!talkTo(s.to)) return false;
        if (D.items[s.item]) return r.carry === s.item;
        if (s.fish) return (have.fish[s.fish] || 0) >= s.n;
        return (have.bag[s.item] || 0) >= s.n;
      case "talk": return talkTo(s.to);
      case "find": return sig.do === "find" && sig.map === s.map && (s.item ? sig.item === s.item : sig.npc === s.npc);
      case "follow": return sig.do === "talk" && sig.npc === s.to && r.follow === s.npc;
      case "tap": return sig.do === "tap" && sig.target === s.target && sig.map === s.map;
      case "photo": return sig.do === "photo" && sig.map === s.map && sig.near === s.near;
      case "catch": return sig.do === "catch" && sig.fish === s.fish;
      case "dig": return sig.do === "dig";
      case "quiz": return sig.do === "quiz" && !!sig.ok;
      case "trade": { const link = s.chain[r.n]; return !!link && sig.do === "talk" && sig.npc === link[0]; }
    }
    return false;
  },
  // いま だれに 会えば いいか（人の 上の ▼）
  targets() {
    const out = [];
    for (const r of this.st().req) {
      const s = this.stepOf(r); if (!s) continue;
      if (["give", "talk", "follow"].includes(s.do)) out.push({ npc: s.to, map: s.map || null, req: r.id });
      if (s.do === "trade") out.push({ npc: s.chain[r.n][0], map: null, req: r.id });
    }
    return out;
  },
  // 人の 上の しるし: ▼（おねがいの あいて）か ！（ことわった おねがいが まって いる）
  markerOf(npcId, mapId) {
    if (!this.data() || !Save.d.folk) return null;
    if (this.targets().some((t) => t.npc === npcId && (!t.map || t.map === mapId))) return "target";
    const o = this.st().offered[npcId];
    if (o && o.wait && o.day === this.today()) { const ev = this.event(o.wait); if (ev && !this.st().req.some((r) => r.id === ev.id) && !this.isDone(ev)) return "offer"; }
    return null;
  },
  rewards(ev, first) {
    const w = { ...ev.reward, ...(first && ev.reward.first ? ev.reward.first : {}) }, out = [];
    if (w.coins) out.push({ coins: w.coins });
    if (w.bag) out.push({ bag: w.bag, n: w.n || 1 });
    if (w.furn) out.push({ furn: w.furn });
    if (w.wear) out.push({ wear: w.wear });
    return out;
  },
  bondOf(ev) { return ev.reward.bond || { [ev.giver]: 2 }; },
  // 3人の うち、その人と いちばん なかよしの 子（でんごんを 言う 子）
  teller() { return [...Chara.IDS].sort((a, b) => (Save.d.chars[b].bond || 0) - (Save.d.chars[a].bond || 0))[0]; },

  // ---- 画面と 会話（Talk.run から よぶ） ----
  // できごとを すすめて、会話・アイテムの へらし・ごほうびを 出す。すすんだ ものの 一覧を かえす
  async progress(sig, who) {
    const before = { ...this.st().done }, moved = this.signal(sig);
    await this.effects(moved, who, before);
    return moved;
  },
  async effects(moved, who, before) {
    for (const m of moved) {
      const s = m.step, ev = m.ev;
      if (s.do === "give" && m.stepDone && !this.data().items[s.item]) Save.d.bag[s.item] = Math.max(0, (Save.d.bag[s.item] || 0) - s.n);
      if (s.do === "give" && m.stepDone) UI.toast(`${this.itemName(s.item)}を わたした！`);
      if (s.do === "talk" && s.say) {
        const kid = this.teller(), text = `${this.short(s.to)}さん！ ${s.say}！`;
        if (this.last) this.last.relay = text;
        await UI.say([{ who: kid, emo: "happy", text }, { name: who.name, face: who.face, text: "わかった！ おしえて くれて ありがとう♪" }]);
      }
      if (s.do === "trade") {
        const link = s.chain[m.r.n - 1] || s.chain[s.chain.length - 1];
        await UI.say([{ name: who.name, face: who.face, text: link[2] }]);
        UI.toast(`${this.itemName(link[1])}を もらった！`);
      }
      if (m.done) await this.finish(ev, !(ev.id in before));
      else if (!(s.do === "talk" && s.say) && s.do !== "trade" && s.do !== "buy" && m.stepDone) UI.toast("おねがいが すすんだ！");
    }
    if (moved.length) { Save.write(); this.refresh(); }
  },
  // おわった: doneBy の 人の おれい → ごほうび → なかよし → トースト
  async finish(ev, first) {
    const by = this.npcDef(ev.doneBy) || this.npcDef(ev.giver);
    await UI.say([{ name: by ? this.name(by) : "", face: this.face(ev.doneBy), text: ev.lines.done }]);
    const got = this.rewards(ev, first).map((it) => ({ it, msg: Loot.give(it) }));
    const bond = this.bondOf(ev), st = this.st();
    for (const [id, v] of Object.entries(bond)) st.bond[id] = (st.bond[id] || 0) + v;
    const coins = got.find((g) => g.it.coins);
    UI.toast(`<span class="folk-reward">${TownFolkArt.item("note")}おねがい かなえた！${coins ? ` コイン +${coins.it.coins}` : ""}・なかよし +${Math.max(...Object.values(bond))}</span>`, "good");
    Sound.se("fanfare");
    // かぐ・ふく・もちものは どこで つかうかも つたえる（コインは トーストだけ）
    const more = got.filter((g) => !g.it.coins && g.msg).map((g) => ({ text: g.msg }));
    if (more.length) await UI.say(more);
  },
  // Talk.run の 2: 話しかけた ことで おねがいが すすむか（なぞなぞの やりなおしも ここ）
  async talked(n, scene, who) {
    if (!this.data() || !Save.d.folk) return false;
    const quiz = this.st().req.find((r) => { const ev = this.event(r.id); return ev && ev.giver === n.id && (this.stepOf(r) || {}).do === "quiz"; });
    if (quiz) {
      const ev = this.event(quiz.id);
      if (await UI.ask(ev.lines.remind, ["うん！", "また こんど"], { face: who.face, name: who.name }) !== 0) return true;
      await this.quiz(ev, who); return true;
    }
    return (await this.progress({ do: "talk", npc: n.id, map: scene && scene.mapId }, who)).length > 0;
  },
  // Talk.run の 4: もちかける
  async propose(n, who) {
    const off = this.offer(n.id); if (!off) return false;
    const ev = off.ev, i = await UI.ask(ev.lines.offer, ["うん、まかせて！", "あとでね"], { face: who.face, name: who.name });
    this.answer(off, i === 0);
    if (i === 0) {
      UI.toast("おねがい ノートに かいたよ"); this.refresh();
      if (ev.steps[0].do === "quiz") await this.quiz(ev, who);
    }
    Save.write();
    return true;
  },
  // なぞなぞ: ぜんぶ あたれば おわり。まちがえたら また こんど（ばつは ない）
  async quiz(ev, who) {
    const s = ev.steps.find((x) => x.do === "quiz");
    for (const [q, choices, ans] of s.q) {
      const i = await UI.ask(q, choices, { face: who.face, name: who.name, cancel: false });
      if (i !== ans) { await UI.say([{ name: who.name, face: who.face, text: "ざんねん！ また ちょうせん してね" }]); return false; }
      Sound.se("ok");
    }
    return (await this.progress({ do: "quiz", ok: true, n: s.q.length }, who)).length > 0;
  },

  // ---- おねがい ノート ----
  hint(r) {
    const ev = this.event(r.id), s = this.stepOf(r); if (!ev || !s) return "";
    if (r.step === 0 && !r.n) return ev.lines.remind;
    if (s.do === "give") return `${this.short(s.to)}に ${this.itemName(s.item)}を わたそう`;
    if (s.do === "talk") return s.say ? `${this.short(s.to)}に でんごん:『${s.say.replace(/^.*?『|』.*$/g, "")}』` : `${this.short(s.to)}に はなしかけよう`;
    if (s.do === "trade") { const link = s.chain[r.n]; return link ? `${this.short(link[0])}に ${this.itemName(r.carry)}を わたそう` : ev.lines.remind; }
    return ev.lines.remind;
  },
  progressOf(r) { const s = this.stepOf(r); if (!s) return null; if (s.do === "trade") return { done: r.n, total: s.chain.length }; if (["tap", "catch", "dig"].includes(s.do)) return { done: r.n, total: s.n || 1 }; return null; },
  openNote() {
    this.signal({ do: "have" }); // かって ある ものを 数えなおす
    const list = U.el("div", { class: "folk-list" }), st = this.st();
    if (!st.req.length) list.append(U.el("div", { class: "folk-empty", text: "いまは おねがいが ないよ。まちの ひとに はなしかけて みよう。" }));
    for (const r of st.req) {
      const ev = this.event(r.id), giver = this.npcDef(ev.giver), p = this.progressOf(r);
      const card = U.el("div", { class: "folk-card", "data-req": r.id });
      const prog = p ? `<div class="folk-prog"><div class="folk-bar"><i style="width:${Math.round((p.done / p.total) * 100)}%"></i></div>${p.done}/${p.total}</div>` : "";
      const carry = r.carry ? `<span class="folk-carry">${this.itemArt(r.carry)}${this.itemName(r.carry)}</span>` : "";
      card.innerHTML = `<div class="folk-face">${this.face(ev.giver)}</div><div><div class="folk-ttl"></div><div class="folk-who"></div><div class="folk-hint"></div>${prog}<div class="folk-row"><div>${carry}</div></div></div>`;
      card.querySelector(".folk-ttl").textContent = ev.title; card.querySelector(".folk-who").textContent = `${giver ? this.name(giver) : ""} から`; card.querySelector(".folk-hint").textContent = this.hint(r);
      const quit = UI.btn("やめる", async () => {
        if (!await UI.confirm(`「${ev.title}」を やめる？\nまた あとで たのまれる ことも あるよ。`)) return;
        st.req = st.req.filter((x) => x !== r); Save.mark(); Save.write(); m.close(); this.refresh(); this.openNote();
      }, "small folk-quit");
      card.querySelector(".folk-row").append(quit); list.append(card);
    }
    const m = UI.modal({ title: `${TownFolkArt.item("note").replace("<svg ", '<svg style="width:26px;height:26px;vertical-align:-6px;margin-right:4px" ')}おねがい ノート`, body: list, footer: U.el("div", { class: "muted", text: `おねがいは ${this.MAX_ACTIVE}つまで。まちの ひとに はなしかけると ふえるよ。` }) });
    return m;
  },
  // 町・外の 世界の 右上の ボタン（おねがいが ある ときだけ）
  mount(sc) { this.scene = sc; this.button = null; this.refresh(); },
  unmount() { if (this.button) this.button.remove(); this.button = null; this.scene = null; },
  refresh() {
    const sc = this.scene; if (!sc || G.scene !== sc || !Save.d.folk) return;
    const n = this.st().req.length;
    if (!n) { if (this.button) this.button.remove(); this.button = null; return; }
    if (!this.button) { this.button = UI.btn("", () => { if (!Game.inputLocked) this.openNote(); }, "folk-note-btn"); this.button.setAttribute("aria-label", "おねがい ノート"); UI.root.append(this.button); }
    this.button.innerHTML = `${TownFolkArt.item("note")}<span>おねがい</span><b>${n}</b>`;
  },
};
