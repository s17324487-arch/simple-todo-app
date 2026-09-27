// ② 町の人の 会話・物々交換・おねがい の 見本の 実装（classic script）。
// ゲームに 入れるときは js/townsfolk.js に うつし、data は TOWNSFOLK_DATA、st は Save.d.folk を わたす。
// ここは テストしやすいように「きめる」部分だけ（DOM を さわらない）。画面は UI.say / UI.ask / UI.modal を そのまま つかう。
// build-townsfolk.mjs が この ファイルを 読んで、20 の おねがいが ぜんぶ さいごまで すすめられるかを 確かめる。
const TownFolkRef = {
  MAX_ACTIVE: 3, // おねがいは 3つまで 同時に うけられる
  BARTER_CHANCE: 0.1, // おねがいが 出なかった ときに こうかんを もちかける かくりつ
  TIP_SHARE: 0.3, // いまの TALKS[npc].lines（あそびかたの ヒント）を 出す わりあい
  RECENT: 12, // おなじ 人の さいきんの セリフは この 数だけ 出さない

  // 時間の くぎり（① おうちの 会話と 同じ）
  period(h) { return h >= 5 && h < 10 ? "morning" : h < 16 && h >= 10 ? "day" : h < 19 && h >= 16 ? "evening" : h < 23 && h >= 19 ? "night" : "late"; },
  today(date = new Date()) { return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; },
  // 小さな 乱数（seed が 同じなら 同じ 並び）。見つける ばしょを その日の あいだ かえない ために つかう
  rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  shuffle(list, rand) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  // ゲームの いまの ようす → 条件の くらべる 相手。g を わたすと そちらを つかう（テスト用）
  context(npcId, st, g) {
    if (!g) g = {
      hour: U.hourNow(), weather: Weather.kind(), season: Seasonal.current().id, festival: AnnualFestivals.current().id,
      boss: !!Save.d.flags.boss, feature: this.features(),
    };
    return { time: this.period(g.hour), weather: g.weather, season: g.season, festival: g.festival, event: g.boss ? ["boss"] : [], feature: g.feature || {}, bond: (st.bond && st.bond[npcId]) || 0, person: npcId };
  },
  // あとから できる しせつ・あそび（x: の 条件）。できたかどうかは グローバル名と マップで 見る
  features() {
    return {
      fishing: typeof FISHING_DATA !== "undefined", fossil: typeof FOSSIL_DATA !== "undefined",
      aquarium: !!MAP_DEFS.aquarium, museum: !!MAP_DEFS.museum, range: typeof RANGE_DATA !== "undefined",
      heiwadai2: (MAP_DEFS.heiwadai.rows || []).length >= 60, // 平和台 v0.2（64×68）が できたら
    };
  },
  // 条件を くらべる。あわなければ -1、あえば 重みに つかう 数（x: は 数えない）。① おうちの 会話でも 同じ 関数を つかえる
  score(when, c) {
    let n = 0;
    for (const k in when || {}) {
      const vals = when[k];
      let ok;
      if (k === "feature") ok = vals.every((v) => (v[0] === "!" ? !c.feature[v.slice(1)] : !!c.feature[v]));
      else if (k === "bond") ok = vals.every((v) => c.bond >= +v);
      else { const have = [].concat(c[k] == null ? [] : c[k]); ok = vals.some((v) => have.includes(v)); } // 値が 配列（近くの 家具など）でも よい
      if (!ok) return -1;
      if (k !== "feature") n++;
    }
    return n;
  },
  // 条件に あう ものから 1つ。重み = 1 + 2 ×（あった 条件の 数）。recent に ある ものは なるべく さける
  pick(list, c, recent = [], rand = Math.random) {
    let cand = [];
    for (const l of list) { const s = this.score(l.when, c); if (s >= 0) cand.push([l, 1 + 2 * s]); }
    const fresh = cand.filter(([l]) => !recent.includes(l.id));
    if (fresh.length) cand = fresh;
    if (!cand.length) return null;
    let r = rand() * cand.reduce((a, [, w]) => a + w, 0);
    for (const [l, w] of cand) { r -= w; if (r < 0) return l; }
    return cand[cand.length - 1][0];
  },
  needsOk(needs, c) { return (needs || []).every((f) => c.feature[f]); },
  // こうかんで わたす ものを もっているか（have: かばん・さかな・ほねの かず）
  canGive(give, have) {
    if (give.bag) return (have.bag[give.bag] || 0) >= (give.n || 1);
    if (give.fish) return (have.fish[give.fish] || 0) >= (give.n || 1);
    if (give.bone) return give.bone === "dup" ? Object.values(have.bone).some((n) => n >= 2) : (have.bone[give.bone] || 0) >= (give.n || 1);
    return false;
  },
  isDone(ev, st, today) { const d = st.done[ev.id]; return ev.limit === "once" ? !!d : d === today; },

  // 話しかけた とき、おねがい・こうかんを もちかけるか きめる。
  // ・ことわった（あとでね）おねがいは、その日の うちなら つぎに 話しかけた とき かならず もう一度 きく
  // ・あたらしい おねがいは 1人 1日 1回まで。出る かくりつは その人の 候補の chance の いちばん 大きい 値（10〜20%）
  offer(npcId, c, st, data, today, have, rand = Math.random) {
    const o = st.offered[npcId];
    const active = new Set(st.req.map((r) => r.id));
    if (o && o.day === today) {
      if (o.wait) { const ev = data.events.find((e) => e.id === o.wait); if (ev && !active.has(ev.id) && !this.isDone(ev, st, today)) return { type: "event", ev }; }
      return null;
    }
    const evs = data.events.filter((e) => e.giver === npcId && !active.has(e.id) && !this.isDone(e, st, today) && this.score(e.when, c) >= 0 && this.needsOk(e.needs, c));
    if (evs.length && st.req.length < this.MAX_ACTIVE && rand() < Math.max(...evs.map((e) => e.chance))) {
      let r = rand() * evs.reduce((a, e) => a + e.chance, 0);
      for (const e of evs) { r -= e.chance; if (r < 0) return { type: "event", ev: e }; }
      return { type: "event", ev: evs[evs.length - 1] };
    }
    const bts = data.barter.filter((b) => b.npc === npcId && !(b.once && st.barter[b.id]) && this.needsOk(b.needs, c) && this.canGive(b.give, have));
    if (bts.length && rand() < this.BARTER_CHANCE) return { type: "barter", bt: bts[Math.floor(rand() * bts.length)] };
    return null;
  },
  // こたえを きろくする。ok=false（あとでね）は その日の あいだ まって もらう
  answer(off, ok, st, today) {
    if (off.type === "barter") { if (ok) st.barter[off.bt.id] = (st.barter[off.bt.id] || 0) + 1; st.offered[off.bt.npc] = { day: today }; return; }
    const ev = off.ev;
    st.offered[ev.giver] = ok ? { day: today } : { day: today, wait: ev.id };
    if (ok) st.req.push({ id: ev.id, step: 0, n: 0, day: today, carry: this.carryOf(ev) });
  },
  // さいしょに わたされる もちもの（とどける もの・わらしべ）
  carryOf(ev) { const s = ev.steps.find((x) => x.carry || x.start); return s ? s.start || s.item : null; },
  // いまの 手順（なにを すれば いいか）
  stepOf(r, data) { const ev = data.events.find((e) => e.id === r.id); return ev ? ev.steps[r.step] : null; },

  // できごと（signal）で おねがいを すすめる。すすんだ ものの 一覧を かえす（アイテムを へらす・会話を 出す などは ゲーム側）。
  // signal の 例: {do:"talk", npc:"rabbit", map:"town"}（話しかけた）/ {do:"have"}（かばんの 中身が かわった）
  //   {do:"tap", target:"litter", map:"heiwadai"} / {do:"find", item:"hat", map:"meadow"}（あたりの ばしょを しらべた）
  //   {do:"photo", map:"city", near:"city_fountain"}（その 小物の ちかくで とった）/ {do:"catch", fish:"ayu"} / {do:"dig"} / {do:"quiz", ok:true}
  signal(sig, st, data, have, today) {
    const moved = [];
    for (const r of st.req) {
      const ev = data.events.find((e) => e.id === r.id);
      // 「かう」が すんだら、同じ できごとで つぎの 手順（わたす）も すすめる（話しかけ 1回で わたせる）
      for (let guard = 0; ev && guard < 4; guard++) {
        const s = ev.steps[r.step];
        if (!s || !this.match(s, sig, r, have, data)) break;
        r.n += sig.n || 1;
        if (s.do === "find") { if (s.npc) r.follow = s.npc; else r.carry = s.item; } // みつけた こねこは 3にんの うしろを ついて くる
        if (s.do === "trade") r.carry = s.chain[r.n - 1][1]; // もらった ものを つぎの 人へ
        const need = s.do === "trade" ? s.chain.length : s.do === "quiz" ? s.q.length : ["tap", "catch", "dig"].includes(s.do) ? s.n || 1 : 1;
        const stepDone = r.n >= need;
        if (stepDone) { r.step++; r.n = 0; if (s.do === "follow") r.follow = null; if (s.do === "give" && r.carry === s.item) r.carry = null; }
        moved.push({ r, ev, step: s, stepDone, done: r.step >= ev.steps.length });
        if (!(stepDone && s.do === "buy")) break;
      }
    }
    st.req = st.req.filter((r) => { const ev = data.events.find((e) => e.id === r.id); return ev && r.step < ev.steps.length; });
    for (const m of moved) if (m.done) st.done[m.ev.id] = m.ev.limit === "once" ? "once" : today;
    return moved;
  },
  match(s, sig, r, have, data) {
    const onMap = (m) => !s.map || s.map === m;
    const talkTo = (npc) => sig.do === "talk" && sig.npc === npc && onMap(sig.map);
    switch (s.do) {
      case "buy": return (sig.do === "have" || sig.do === "talk") && (have.bag[s.item] || 0) >= s.n;
      case "give":
        if (!talkTo(s.to)) return false;
        if (data.items[s.item]) return r.carry === s.item; // おねがいの もちもの（かばんには ない）
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
  // いま だれに 会えば いいか（人の 上の ▼ に つかう）。見つける・さわる ばしょは spots() で べつに 出す
  targets(st, data) {
    const out = [];
    for (const r of st.req) {
      const s = this.stepOf(r, data);
      if (!s) continue;
      if (["give", "talk", "follow"].includes(s.do)) out.push({ npc: s.to, map: s.map || null, req: r.id });
      if (s.do === "trade") out.push({ npc: s.chain[r.n][0], map: null, req: r.id });
    }
    return out;
  },
  // おわった おねがいの ごほうびを Loot.give の 形に する（なかよし ポイントは 別）
  rewards(ev, first) {
    const w = { ...ev.reward, ...(first && ev.reward.first ? ev.reward.first : {}) }, out = [];
    if (w.coins) out.push({ coins: w.coins });
    if (w.bag) out.push({ bag: w.bag, n: w.n || 1 });
    if (w.furn) out.push({ furn: w.furn });
    if (w.wear) out.push({ wear: w.wear });
    return out;
  },
  bondOf(ev) { return ev.reward.bond || { [ev.giver]: 2 }; },
  // 見つける・さわる ばしょを えらぶ。歩けて、マップの 入口から たどりつける マスから、その日で きまった ものを n こ。
  // 木や しげみの となりを えらぶと「かくれている」感じが でる。walk(x,y) と reach は ゲーム側で 用意する
  spots(mapId, n, seed, walk, reach, near) {
    const cand = reach.filter(([x, y]) => walk(x, y) && (!near || Math.hypot(x - near.x, y - near.y) <= near.r));
    const hidden = cand.filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !walk(x + dx, y + dy)));
    const pool = this.shuffle(hidden.length >= n * 3 ? hidden : cand, this.rng(mapId + ":" + seed)), out = [];
    for (const p of pool) { if (out.every((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) >= 4)) out.push(p); if (out.length >= n) break; }
    return out;
  },
};

// ② の 絵（あたらしい もちもの 8つ・さがす／さわる ものの 小物・人の 上の しるし）。形式は FOOD_ART と おなじ（viewBox 0 0 64 64）
const TownFolkArt = (() => {
  const INKC = "#1F1D1B", S = (w = 3) => `stroke="${INKC}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const ITEM = {
    letter: `<rect x="8" y="16" width="48" height="34" rx="4" fill="#FFF7E0" ${S()}/><path d="M9,19 L32,37 L55,19" fill="none" ${S(2.6)}/><path d="M10,48 L26,33 M54,48 L38,33" stroke="#E3CFA4" stroke-width="2.4" stroke-linecap="round"/><path d="M32,33 C29,28 23,30 25,35 C26,38 32,42 32,42 C32,42 38,38 39,35 C41,30 35,28 32,33 Z" fill="#F07A8A" ${S(2)}/>`,
    bento: `<rect x="7" y="20" width="50" height="34" rx="7" fill="#D9534F" ${S()}/><rect x="12" y="25" width="40" height="24" rx="3" fill="#FFF8EC" ${S(2.4)}/><path d="M31,25 L31,49" ${S(2.4)}/><circle cx="21.5" cy="37" r="3" fill="#E35D5B" ${S(1.6)}/><rect x="34" y="28" width="14" height="8" rx="3" fill="#FFD54F" ${S(2)}/><path d="M37,28 L37,36 M41,28 L41,36" stroke="#E7B93A" stroke-width="1.6"/><circle cx="46" cy="43" r="3.6" fill="#6DBE5B" ${S(2)}/><circle cx="38" cy="43" r="3.4" fill="#F0705A" ${S(2)}/><path d="M9,59 L55,51" stroke="${INKC}" stroke-width="5.4" stroke-linecap="round"/><path d="M9,59 L55,51" stroke="#C98A52" stroke-width="2.4" stroke-linecap="round"/>`,
    umbrella: `<path d="M32,7 L32,12" ${S()}/><path d="M6,34 C8,19 20,12 32,12 C44,12 56,19 58,34 C54,30 48,30 45,34 C42,30 35,30 32,34 C29,30 22,30 19,34 C16,30 10,30 6,34 Z" fill="#8FC9F0" ${S()}/><path d="M32,12 C27,18 21,26 19,34 M32,12 C37,18 43,26 45,34" fill="none" stroke="#5E9FCC" stroke-width="2.4"/><path d="M32,34 L32,52 C32,59 23,59 23,52" fill="none" ${S()}/><ellipse cx="18" cy="22" rx="3" ry="6" fill="#FFF" fill-opacity="0.55" transform="rotate(35 18 22)"/>`,
    hat: `<ellipse cx="32" cy="43" rx="27" ry="9" fill="#FFD54F" ${S()}/><path d="M15,41 C15,21 49,21 49,41 C43,45 21,45 15,41 Z" fill="#FFE082" ${S()}/><path d="M15.4,35.5 C23,39.5 41,39.5 48.6,35.5 L49,40.5 C41,44.5 23,44.5 15,40.5 Z" fill="#F08A9A" ${S(2)}/><path d="M45,39 C51,41 53,47 50,50 C48,46 46,44 43,43" fill="#F08A9A" ${S(2)}/><path d="M24,28 C27,25 31,24 34,24" fill="none" stroke="#FFF" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.8"/>`,
    map: `<path d="M7,17 L22,12 L42,18 L57,13 L57,50 L42,55 L22,49 L7,54 Z" fill="#F6E3BF" ${S()}/><path d="M22,12 L22,49 M42,18 L42,55" fill="none" stroke="#C9A06A" stroke-width="2.2"/><path d="M13,44 C19,36 25,41 29,32 C32,26 37,29 43,26" fill="none" stroke="#8D6E63" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round"/><path d="M45,20 L52,27 M52,20 L45,27" stroke="#E35D5B" stroke-width="3.6" stroke-linecap="round"/><path d="M11,22 C13,20 16,21 16,24 C16,27 12,29 11,26" fill="#8BCB6B" ${S(1.6)}/>`,
    straw: `<path d="M13,57 C23,41 33,27 45,11" fill="none" stroke="${INKC}" stroke-width="7.4" stroke-linecap="round"/><path d="M13,57 C23,41 33,27 45,11" fill="none" stroke="#F2CF66" stroke-width="3.6" stroke-linecap="round"/><path d="M45,11 C49,6 55,9 51,14 C56,14 55,20 49,19 C52,23 47,27 44,22 C43,18 43,14 45,11 Z" fill="#F2CF66" ${S(2.2)}/><path d="M31,31 C26,30 22,28 19,26" fill="none" stroke="#8D6E63" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="13" cy="19" rx="8" ry="3.2" fill="#E6F6FF" ${S(1.8)} transform="rotate(-30 13 19)"/><ellipse cx="20" cy="16" rx="8" ry="3.2" fill="#E6F6FF" ${S(1.8)} transform="rotate(25 20 16)"/><path d="M10,28 L21,15" stroke="${INKC}" stroke-width="4.6" stroke-linecap="round"/><path d="M10,28 L21,15" stroke="#5E9FCC" stroke-width="2.2" stroke-linecap="round"/>`,
    seeds: `<path d="M15,10 L49,10 L49,57 L15,57 Z" fill="#FFF7E0" ${S()}/><path d="M15,10 L49,10 L49,18 L15,18 Z" fill="#8BCB6B" ${S(2.4)}/><path d="M32,44 L32,53 M32,49 C28,46 25,48 25,51 M32,49 C36,46 39,48 39,51" fill="none" stroke="#5FA24F" stroke-width="2.4" stroke-linecap="round"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(32 + 7 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" cy="${(34 - 7 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" r="5" fill="#F48FB1" ${S(1.8)}/>`).join("")}<circle cx="32" cy="34" r="4.2" fill="#FFD54F" ${S(1.8)}/><circle cx="21" cy="14" r="1.6" fill="#FFF"/><circle cx="27" cy="14" r="1.6" fill="#FFF"/>`,
    // おねがい ノート（HUD の ボタン・ノートの 見出し）
    note: `<rect x="12" y="8" width="38" height="48" rx="5" fill="#FFF4C2" ${S()}/><path d="M12,14 L12,50" stroke="#E0B84A" stroke-width="5"/><path d="M20,20 L42,20 M20,29 L42,29 M20,38 L34,38" stroke="#C9B27A" stroke-width="2.6" stroke-linecap="round"/><g transform="rotate(35 44 40)"><rect x="40" y="22" width="9" height="30" rx="2" fill="#F6B26B" ${S(2.4)}/><path d="M40,52 L44.5,60 L49,52 Z" fill="#F6E3BF" ${S(2.2)}/><rect x="40" y="18" width="9" height="6" rx="2" fill="#F48FB1" ${S(2.2)}/></g><path d="M22,46 L25,49 L31,43" fill="none" stroke="#6DBE5B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    photo: `<rect x="10" y="9" width="44" height="47" rx="3" fill="#FFF" ${S()}/><rect x="15" y="14" width="34" height="28" fill="#A8DBFF"/><path d="M15,33 C22,30 29,32 35,29 C41,27 45,30 49,31 L49,42 L15,42 Z" fill="#8BCB6B"/><circle cx="43" cy="20" r="3.6" fill="#FFD54F" ${S(1.4)}/><circle cx="23.5" cy="36" r="4.4" fill="#FFF" ${S(1.3)}/><path d="M19.6,33.4 C18.4,35 18.8,37.6 20.4,38.2 C20.8,36.6 20.6,34.6 19.6,33.4 Z" fill="#9C7552"/><circle cx="32" cy="35" r="4.4" fill="#FFD54F" ${S(1.3)}/><path d="M31.2,30.8 C30.4,29 32.6,28.4 32.6,30.4" fill="none" ${S(1)}/><path d="M31,36 L33,36 L32,37.4 Z" fill="#F29A1F"/><circle cx="40.5" cy="36" r="4.4" fill="#A7B4BA" ${S(1.3)}/><path d="M37.6,32.8 L38.4,30.8 L39.6,32.2 L40.6,30.4 L41.6,32 L42.8,30.8 L43.2,33" fill="#A7B4BA" ${S(1)}/>${[[22.4, 35.6], [24.8, 35.6], [30.9, 34.4], [33.1, 34.4], [39.4, 35.6], [41.6, 35.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.75" fill="${INKC}"/>`).join("")}<rect x="15" y="14" width="34" height="28" fill="none" ${S(2)}/><path d="M26,49 L38,49" stroke="#C9C1B4" stroke-width="2.4" stroke-linecap="round"/>`,
  };
  // さがす・さわる ものの 小物（1マス。足もとが 下の まん中。viewBox 0 0 32 32）
  const PROP = {
    litter: `<ellipse cx="16" cy="27" rx="11" ry="3" fill="#000" fill-opacity="0.14"/><path d="M5,24 C4,19 9,16 12,18 C14,14 20,16 19,21 C21,24 17,28 12,27 C9,28 6,27 5,24 Z" fill="#F4F1EA" stroke="${INKC}" stroke-width="1.6" stroke-linejoin="round"/><path d="M9,21 L12,23 L15,20" fill="none" stroke="#B8B0A2" stroke-width="1.2" stroke-linecap="round"/><g transform="rotate(-72 22 22)"><rect x="17" y="18" width="11" height="7" rx="2" fill="#E35D5B" stroke="${INKC}" stroke-width="1.6"/><path d="M20,18 L20,25" stroke="#FFF" stroke-width="1.4"/></g>`,
    flowerbed: `<ellipse cx="16" cy="27" rx="14" ry="3.4" fill="#000" fill-opacity="0.14"/><path d="M3,26 L4,20 L28,20 L29,26 Z" fill="#C9A06A" stroke="${INKC}" stroke-width="1.6" stroke-linejoin="round"/><path d="M5,20 C6,18 26,18 27,20" fill="#8B6446"/><path d="M10,19 C10,14 9,11 6,10 M16,19 C16,14 17,11 20,11 M22,19 C22,15 23,12 26,12" fill="none" stroke="#9AA66A" stroke-width="1.6" stroke-linecap="round"/><path d="M6,10 C3,11 3,14 5,14 M20,11 C22,9 24,11 22,13 M26,12 C28,11 29,14 27,15" fill="#D9B7A6" stroke="${INKC}" stroke-width="1.2"/>`,
    flowerbed_ok: `<ellipse cx="16" cy="27" rx="14" ry="3.4" fill="#000" fill-opacity="0.14"/><path d="M3,26 L4,20 L28,20 L29,26 Z" fill="#C9A06A" stroke="${INKC}" stroke-width="1.6" stroke-linejoin="round"/><path d="M5,20 C6,18 26,18 27,20" fill="#6B4A33"/><path d="M9,19 L9,11 M16,19 L16,8 M23,19 L23,11" stroke="#5FA24F" stroke-width="1.8" stroke-linecap="round"/>${[[9, 10, "#F48FB1"], [16, 7, "#FFD54F"], [23, 10, "#9FC8F0"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}" stroke="${INKC}" stroke-width="1.3"/><circle cx="${x}" cy="${y}" r="1.2" fill="#FFF"/>`).join("")}`,
    crop: `<ellipse cx="16" cy="29.5" rx="9" ry="2.6" fill="#000" fill-opacity="0.14"/><path d="M16,30 L16,4" stroke="${INKC}" stroke-width="4.6" stroke-linecap="round"/><path d="M16,30 L16,4" stroke="#7DBB5A" stroke-width="2.2" stroke-linecap="round"/><path d="M16,27 C10,25 5,20 3,14 C9,16 13,20 16,23 Z" fill="#8BCB6B" stroke="${INKC}" stroke-width="1.4" stroke-linejoin="round"/><path d="M16,18 C22,16 27,12 29,6 C23,8 19,12 16,15 Z" fill="#8BCB6B" stroke="${INKC}" stroke-width="1.4" stroke-linejoin="round"/><path d="M16,11 C12,9 10,6 9,2.5 C13,4 15,6.5 16,8.5 Z" fill="#9CD67C" stroke="${INKC}" stroke-width="1.3" stroke-linejoin="round"/><g transform="rotate(24 20 20)"><ellipse cx="20" cy="19" rx="3.8" ry="7" fill="#FFD54F" stroke="${INKC}" stroke-width="1.4"/><path d="M17.6,14 L22.4,14 M17,17 L23,17 M17,20 L23,20 M17.6,23 L22.4,23 M20,12.4 L20,25.6" stroke="#E0AE2E" stroke-width="0.9"/><path d="M16.4,25 C14.8,20 15.8,15 18,12 C18,17 19,22 20,26 Z" fill="#7DBB5A" stroke="${INKC}" stroke-width="1.2" stroke-linejoin="round"/><path d="M23.6,25 C25.2,20 24.2,15 22,12 C22,17 21,22 20,26 Z" fill="#6DAE4F" stroke="${INKC}" stroke-width="1.2" stroke-linejoin="round"/><path d="M20,12 C20,9 21,8 22.4,7" fill="none" stroke="#C98A52" stroke-width="1.3" stroke-linecap="round"/></g><path d="M16,4 L13,1 M16,4 L16,0.5 M16,4 L19,1" stroke="#C9A06A" stroke-width="1.3" stroke-linecap="round"/>`,
    acorn: `<ellipse cx="16" cy="27" rx="10" ry="2.8" fill="#000" fill-opacity="0.14"/>${[[10, 22, -18], [20, 23, 14], [15, 18, 0]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 4},${y - 1} C${x - 4},${y + 5} ${x + 4},${y + 5} ${x + 4},${y - 1} Z" fill="#C98A52" stroke="${INKC}" stroke-width="1.3"/><path d="M${x - 4.6},${y - 1} C${x - 4},${y - 5} ${x + 4},${y - 5} ${x + 4.6},${y - 1} Z" fill="#8D6E4A" stroke="${INKC}" stroke-width="1.3"/><path d="M${x},${y - 4.4} L${x + 1},${y - 6.4}" stroke="${INKC}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="${x - 1.6}" cy="${y + 1}" rx="0.9" ry="1.6" fill="#FFF" fill-opacity="0.6"/></g>`).join("")}`,
    sparkle: `<ellipse cx="16" cy="27" rx="7" ry="2" fill="#000" fill-opacity="0.1"/><path d="M16,8 C17,15 18,16 25,17 C18,18 17,19 16,26 C15,19 14,18 7,17 C14,16 15,15 16,8 Z" fill="#FFF3A8" stroke="${INKC}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="25" cy="9" r="1.8" fill="#FFF3A8" stroke="${INKC}" stroke-width="1"/>`,
  };
  const wrap64 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;
  const wrap32 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner}</svg>`;
  return {
    ITEM, PROP,
    item(id) { return ITEM[id] ? wrap64(ITEM[id]) : ""; },
    prop(id) { return PROP[id] ? wrap32(PROP[id]) : ""; },
    // 人の 上に 出す しるし（canvas に じかに かく。いまの「!」の bubble() と 同じ 大きさ）
    // offer … きいろの「！」: ことわった おねがいが まっている ／ target … みどりの ▼: おねがいの あいて
    marker(ctx, kind, x, y, t) {
      const bob = Math.sin(t * 4) * 2;
      ctx.save(); ctx.translate(x, y + bob); ctx.lineWidth = 2; ctx.strokeStyle = INKC;
      if (kind === "offer") {
        ctx.fillStyle = "#FFE38A"; U.rr(ctx, -9, -10, 18, 19, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, 8.5); ctx.lineTo(0, 13); ctx.lineTo(3, 8.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#FFE38A"; ctx.fillRect(-4, 6.5, 8, 3);
        ctx.fillStyle = INKC; ctx.font = "900 13px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("！", 0, 0);
      } else {
        ctx.fillStyle = "#A8E6CF"; ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(8, -7); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#FFF"; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(-4, -4.5); ctx.lineTo(0, -4.5); ctx.lineTo(-2, -1.5); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },
  };
})();
