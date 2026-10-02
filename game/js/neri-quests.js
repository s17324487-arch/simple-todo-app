// ネリカスタウンの いらいの けいじばん（オーナーの FB 2026-09-29「掲示板を 町に 設置して、モンスターの 討伐クエストや、おつかい依頼、
// 脱走した 猫や なくした ポーチ などの 探し物依頼 等を 実装。難易度に 応じて 報酬金額を 変えて、比較的 高額報酬に して 稼ぎやすく」）。
// けいじばんは 町の いりぐち（大通りの 北の はし・平和台から くると すぐ）。まいにち 6まい（たいじ 2・おつかい 2・さがしもの 2）が はりだされ、
// 3つまで うけられる。おわったら けいじばんで ほうこくして ほうしゅう（★1 400〜 ★5 2600 コイン。おてつだい 1かいより 多め）。
// - たいじ: その モンスターに かった かず（ずかんの won）で すすむ（バトルの しくみは かえない）。
// - おつかい: たのんだ 町の人に しなものを わたす（Talk.run の まえに わたす。もって いない ときは ひとこと いってから ふだんの 会話へ
//   すすむ ので、はじめての あいさつ・ペンの つりざお・町の人の おねがい は とまらない）。
// - さがしもの: 町の どこかの きらきら（TownFolk の spots と おなじ 絵と しらべかた）。ねこ・インコは みつけると うしろを ついて くる。
// セーブは Save.d.quests（あたらしい 項目だけ。Save.fresh に ある）。
const NeriQuests = (() => {
  const BOARD = [16, 58]; // おうちの ひだり よこの しばふ・よこだんほどうの はし（オーナーの FB 2026-09-30「掲示板を お家の 横に」。まえは 大通りの 北の はし [52, 2]。[17, 58] は がいとうの かげに なる）
  const TYPE = { hunt: { name: "たいじ", col: "#F4A6A0" }, errand: { name: "おつかい", col: "#F7D56A" }, find: { name: "さがしもの", col: "#9CC7E6" } };
  // いらい（★ = むずかしさ。reward = ほうしゅう）
  const Q = [
    // たいじ（enemy を n かい たおす）
    { id: "h_purun", type: "hunt", stars: 1, reward: 400, enemy: "purun", n: 3, area: "ぽかぽか はらっぱ", from: "みんなの はたけの ヤギじい", text: "はらっぱの プルンが はたけに ころがって くるんじゃ。3びき たいじして おくれ。" },
    { id: "h_moko", type: "hunt", stars: 1, reward: 450, enemy: "moko", n: 3, area: "ぽかぽか はらっぱ", from: "ほいくえんの せんせい", text: "モコモコの けだまで こどもたちが くしゃみ。3びき おねがい！" },
    { id: "h_bunbun", type: "hunt", stars: 2, reward: 750, enemy: "bunbun", n: 4, area: "ぽかぽか はらっぱ", from: "おはなやさんの フローラ", text: "ブンブンが はなばたけを ぶんぶん あらすの。4ひき おいはらって ケロ。" },
    { id: "h_kinokko", type: "hunt", stars: 3, reward: 1050, enemy: "kinokko", n: 3, area: "どんぐりの もり", from: "ゆうびんきょくの メエさん", text: "もりの みちに キノッコが いて、てがみが とどけられないの。3びき たのむ メエ。" },
    { id: "h_donguri", type: "hunt", stars: 3, reward: 1150, enemy: "donguri", n: 4, area: "どんぐりの もり", from: "こうばんの おまわりさん", text: "ドングリンが どんぐりを なげて くる ひろばが あるんだ。4ひき たいじ して くれ！" },
    { id: "h_happa", type: "hunt", stars: 3, reward: 1100, enemy: "happa", n: 3, area: "どんぐりの もり", from: "ガソリンスタンドの ブンさん", text: "ハッパンの はっぱで くるまが まっかっか。3びき たのむ！" },
    { id: "h_akapurun", type: "hunt", stars: 4, reward: 1600, enemy: "akapurun", n: 3, area: "どんぐりの もり", from: "くまの そんちょう", text: "おこりんぼの アカプルンが ふえて おる。3びき しずめて くれんか。" },
    { id: "h_koumori", type: "hunt", stars: 4, reward: 1700, enemy: "koumori", n: 3, area: "キラキラ どうくつ", from: "ひだまり アパートの ケンタ", text: "どうくつで ギターを ひくと コウモリンが あつまって くるんだ。3びき たのむ！" },
    { id: "h_iwagoro", type: "hunt", stars: 5, reward: 2400, enemy: "iwagoro", n: 3, area: "キラキラ どうくつ", from: "こうじげんばの おやかた", text: "イワゴロが みちを ふさいで こうじが すすまねえ。3びき たのんだ！" },
    { id: "h_kirakira", type: "hunt", stars: 5, reward: 2600, enemy: "kirakira", n: 4, area: "キラキラ どうくつ", from: "ひだまり アパートの ピッコ", text: "キラリンの ひかりが まぶしくて えが かけないの。4ひき おねがい。" },
    // おつかい（item を n こ、町の人 to に わたす）
    { id: "e_oden", type: "errand", stars: 2, reward: 800, item: "oden", n: 2, to: "mayor", where: "おまつりの けいじばんの まえ", shop: "せぶんぶん", text: "そんちょうの おひるごはんに、せぶんぶんの おでんを 2つ。" },
    { id: "e_karaage", type: "errand", stars: 2, reward: 750, item: "karaage", n: 2, to: "pig", where: "レストラン びっくぽの まえ", shop: "ローリソン", text: "ブーさんが ローリソンの からあげを 2つ ほしいって。" },
    { id: "e_cocoa", type: "errand", stars: 1, reward: 450, item: "cocoa", n: 1, to: "penguin", where: "ローリソンの まえ", shop: "せぶんぶん", text: "さむがりの ペンさんに、せぶんぶんの ココアを 1つ。" },
    { id: "e_milk", type: "errand", stars: 1, reward: 400, item: "milk", n: 2, to: "mouse", where: "パンやさんの まえ", shop: "ローリソン・スーパー", text: "パンに あう ぎゅうにゅうを 2ほん、チュウさんへ。" },
    { id: "e_cake", type: "errand", stars: 3, reward: 1100, item: "cake", n: 1, to: "sheep", where: "かぐやさんの まえ", shop: "ケーキやさん", text: "メェさんの おたんじょうび！ ショートケーキを 1つ とどけて。" },
    { id: "e_roll", type: "errand", stars: 2, reward: 700, item: "rollcake", n: 1, to: "rabbit", where: "ようふくやさんの まえ", shop: "ローリソン", text: "ミミさんの おやつに、ローリソンの ロールケーキを 1つ。" },
    { id: "e_onigiri", type: "errand", stars: 2, reward: 650, item: "onigiri", n: 3, to: "frog", where: "いけの そば", shop: "ローリソン", text: "つりに いく ケロさんの おべんとう。おにぎりを 3つ。" },
    { id: "e_juice", type: "errand", stars: 1, reward: 500, item: "juice", n: 3, to: "parkcat", where: "おおきい こうえん", shop: "せぶんぶん・スーパー", text: "こうえんで ピクニック。オレンジジュースを 3ぼん、ミントさんへ。" },
    // さがしもの（まちの どこかの きらきら。near が あれば その ちかく）
    { id: "f_cat", type: "find", stars: 2, reward: 850, spots: 6, follow: { sp: "cat", col: "#F4F1EA", stripe: false }, thing: "ぶちねこの モモ", from: "ひだまり アパートの ピッコ", text: "まどから モモが だっそう しちゃったの。しげみや きの かげが すきなの。", found: "いた！ モモ、おいで〜。" },
    { id: "f_pouch", type: "find", stars: 2, reward: 750, spots: 5, near: { x: 37, y: 26, r: 13 }, thing: "ポポの ポーチ", from: "ひだまり アパートの パンダの ママ", text: "こうえんで あそんだ ときに ポポの ポーチを なくしたの。", found: "あった！ くまの ワッペンの ポーチ！" },
    { id: "f_key", type: "find", stars: 3, reward: 1100, spots: 7, thing: "スタンドの かぎ", from: "ガソリンスタンドの ブンさん", text: "じむしょの かぎを どこかで おとした……。まちの どこかに ある はずだ！", found: "かぎを みつけた！ ライオンの キーホルダーつき。" },
    { id: "f_glasses", type: "find", stars: 3, reward: 1000, spots: 7, thing: "メリーさんの めがね", from: "ひだまり アパートの メリーさん", text: "おさんぽの とちゅうで めがねを おとしたの。よく みえなくて こまって いるの。", found: "めがね はっけん！ われて ないよ。" },
    { id: "f_letter", type: "find", stars: 1, reward: 450, spots: 4, near: { x: 8, y: 50, r: 12 }, thing: "とばされた てがみ", from: "ゆうびんきょくの メエさん", text: "かぜで てがみが 1まい とばされた メエ。ゆうびんきょくの ちかくの はず。", found: "てがみ あった！ メエさんに とどけよう。" },
    { id: "f_bird", type: "find", stars: 4, reward: 1500, spots: 9, follow: { sp: "bird", col: "#8FD19E", stripe: false }, thing: "インコの ピーちゃん", from: "ひだまり アパートの ケンタ", text: "ベランダから インコの ピーちゃんが にげちゃった！ まちの どこかの きに いるかも。", found: "ピーちゃん みっけ！ かたに とまった。" },
  ];
  const byId = Object.fromEntries(Q.map((q) => [q.id, q]));
  const MAX = 3;
  const st = () => Save.d.quests;
  const npcOf = (id) => (MAP_DEFS.town.npcs || []).find((n) => n.id === id);
  const npcName = (id) => { const n = npcOf(id); return n ? (typeof TownFolk !== "undefined" && TownFolk.name ? TownFolk.name(n) : n.name) : id; };
  const itemName = (id) => (BAG_INDEX[id] ? BAG_INDEX[id].name : id);
  const hiki = (n) => n + ({ 1: "ぴき", 3: "びき", 6: "ぴき", 8: "ぴき", 10: "ぴき" }[n] || "ひき");
  const count = (q, n = q.n) => (q.item === "milk" || q.item === "juice" ? n + ({ 1: "ぽん", 3: "ぼん" }[n] || "ほん") : n + "こ");
  const title = (q) => q.type === "hunt" ? `${ENEMIES[q.enemy].name}を ${hiki(q.n)} たいじ` : q.type === "errand" ? `${itemName(q.item)}を ${npcName(q.to)}へ` : `${q.thing}を さがして`;
  const who = (q) => (q.type === "errand" ? npcName(q.to) + "（" + q.where + "）" : q.from);
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const pick = (list, n, r) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  // その日の けいじばん（日づけで きまる。うけて いる ものは のこす）
  function board(day = U.today()) {
    const s = st();
    if (s.day !== day) {
      const r = rng("neri-board:" + day), act = new Set(s.active.map((a) => a.id)), free = (t) => Q.filter((q) => q.type === t && !act.has(q.id));
      s.day = day; s.done = []; s.board = [...pick(free("hunt"), 2, r), ...pick(free("errand"), 2, r), ...pick(free("find"), 2, r)].map((q) => q.id);
      Save.mark();
    }
    return s.board.map((id) => byId[id]).filter(Boolean);
  }
  const activeOf = (id) => st().active.find((a) => a.id === id) || null;
  function progress(a) {
    const q = byId[a.id]; if (!q) return { done: false, text: "" };
    if (q.type === "hunt") { const n = Math.min(q.n, ((Save.d.dex[q.enemy] || {}).won || 0) - a.base); return { done: n >= q.n, n, of: q.n, text: n >= q.n ? "たいじ できた！ ほうこく しよう" : `${q.area}で あと ${hiki(q.n - n)}（${n} / ${q.n}）` }; }
    if (q.type === "errand") { const have = Save.d.bag[q.item] || 0; return a.given ? { done: true, text: "わたした！ ほうこく しよう" } : { done: false, have, text: `${itemName(q.item)} ${Math.min(have, q.n)} / ${q.n}（${q.shop}で かえる）→ ${npcName(q.to)}へ` }; }
    return a.found ? { done: true, text: "みつけた！ ほうこく しよう" } : { done: false, text: `しらべた ばしょ ${a.checked.length} / ${q.spots}（きらきらを しらべよう）` };
  }
  function accept(id) {
    const q = byId[id], s = st(); if (!q || activeOf(id) || s.done.includes(id) || s.active.length >= MAX) return false;
    const a = { id, day: s.day, seed: s.day + ":" + (s.total || 0) + ":" + s.active.length };
    if (q.type === "hunt") a.base = (Save.d.dex[q.enemy] || {}).won || 0;
    if (q.type === "errand") a.given = false;
    if (q.type === "find") { a.found = false; a.checked = []; }
    s.active.push(a); Save.mark(); Save.write(); return true;
  }
  function cancel(id, scene) {
    const s = st(), i = s.active.findIndex((a) => a.id === id); if (i < 0) return false;
    s.active.splice(i, 1); Save.mark(); Save.write(); dropFollower(scene); return true;
  }
  function report(id, scene) {
    const q = byId[id], a = activeOf(id); if (!q || !a || !progress(a).done) return 0;
    const s = st(); s.active = s.active.filter((x) => x !== a); s.done.push(id); s.total = (s.total || 0) + 1; s.earned = (s.earned || 0) + q.reward;
    Save.addCoins(q.reward); WorkExp.give("quest", q.stars); Save.mark(); Save.write(); dropFollower(scene); return q.reward; // けいけんちは ★の かずで（UI-44）
  }
  const dropFollower = (scene) => { if (scene && scene.follower && typeof TownFolk !== "undefined" && !TownFolk.following()) scene.follower = null; };
  // ---- さがしもの: きらきら（TownFolk と おなじ えらびかた・絵・しらべかた）----
  const spotCache = {};
  function spots(mapId) {
    if (mapId !== "town" || !Save.d || !Save.d.quests || typeof TownFolk === "undefined") return [];
    const out = [];
    for (const a of st().active) {
      const q = byId[a.id]; if (!q || q.type !== "find" || a.found) continue;
      const key = a.id + "|" + a.seed; let pts = spotCache[key];
      if (!pts) pts = spotCache[key] = TownFolk.pickSpots("town", q.spots, "neriq:" + key, q.near || null);
      const hit = Math.floor(rng("hit:" + key)() * pts.length);
      pts.forEach(([x, y], i) => { if (!a.checked.includes(i)) out.push({ req: "neriq:" + a.id, kind: "find", x, y, i, prop: "sparkle", hit: i === hit }); });
    }
    return out;
  }
  async function investigate(spot, scene) {
    const id = spot.req.slice(6), a = activeOf(id), q = byId[id]; if (!a || !q) return;
    if (!spot.hit) { a.checked.push(spot.i); Save.mark(); Sound.se("tap"); await UI.say([{ who: "wanko", emo: "normal", text: "ここには ない みたい…" }]); return; }
    a.found = true; Save.mark(); Save.write(); Sound.se("fanfare");
    if (q.follow && scene && scene.startFollower) scene.startFollower(spot.x, spot.y);
    await UI.say([{ who: "gachan", emo: "happy", text: q.found }, { who: "goji", emo: "happy", text: "けいじばんで ほうこく しよう！" }]);
  }
  const following = () => !!(Save.d && Save.d.quests && st().active.some((a) => a.found && byId[a.id] && byId[a.id].follow));
  const followerSpec = () => { const a = Save.d && Save.d.quests && st().active.find((x) => x.found && byId[x.id] && byId[x.id].follow); return a ? { id: "neriq_" + a.id, ...byId[a.id].follow } : null; };
  // ---- おつかい: たのんだ 町の人に 話しかけると わたす（もって いない ときは ひとこと → ふだんの 会話）----
  async function talked(n, scene) {
    if (!Save.d || !Save.d.quests) return false;
    const a = st().active.find((x) => byId[x.id] && byId[x.id].type === "errand" && byId[x.id].to === n.id && !x.given); if (!a) return false;
    const q = byId[a.id], face = Art.npcSvg({ sp: n.sp, col: n.col, col2: n.col2, stripe: n.stripe, outfit: n.outfit, look: n.look, emo: "happy" }), name = npcName(n.id);
    Sound.se("tap");
    if ((Save.d.bag[q.item] || 0) < q.n) { await UI.say([{ name, face, text: `けいじばんを みて くれたの？\n${itemName(q.item)}を ${count(q)} もって きて ね。${q.shop}に あるよ。` }]); return false; }
    Save.addBag(q.item, -q.n); a.given = true; Save.mark(); Save.write(); Sound.se("good");
    await UI.say([{ name, face, text: `わぁ、${itemName(q.item)}！ ありがとう！\nけいじばんで ほうこく してね。` }, { who: "wanko", emo: "happy", text: "とどけたよ！ けいじばんへ いこう！" }]);
    return true;
  }
  // ---- けいじばんの 画面 ----
  const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
  const ICON = {
    hunt: `<path d="M12,34 L30,16 M26,12 L34,20 M14,28 L20,34 M10,36 L16,30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M30,16 L36,8 L34,18 Z" fill="#E6ECEF" stroke="${INK}" stroke-width="2"/>`,
    errand: `<path d="M10,18 H34 L31,38 H13 Z" fill="#F7D56A" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M16,18 C16,8 28,8 28,18" fill="none" stroke="${INK}" stroke-width="2.6"/>`,
    find: `<circle cx="19" cy="19" r="10" fill="#E6F4FA" stroke="${INK}" stroke-width="3"/><path d="M26,26 L36,36" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
  };
  const icon = (t) => `<svg viewBox="0 0 44 44" width="40" height="40" aria-hidden="true">${ICON[t]}</svg>`;
  function open(scene) {
    const list = board(); Save.write();
    const body = U.el("div", { class: "neri-quests" });
    const s = st();
    const render = () => {
      body.replaceChildren();
      body.append(U.el("p", { class: "nq-lead", text: `いらいは ${MAX}つまで うけられるよ（いま ${s.active.length} / ${MAX}）。おわったら ここで ほうこく！ まいにち あたらしい いらいが はりだされるよ。` }));
      // うけて いる いらい（きのうの ものも）→ きょうの いらい
      const ids = [...s.active.map((a) => a.id), ...list.map((q) => q.id).filter((id) => !activeOf(id))].filter((id) => byId[id]);
      for (const id of ids) {
        const q = byId[id], a = activeOf(id), done = s.done.includes(id), p = a ? progress(a) : null;
        const card = U.el("div", { class: "nq-card" + (a ? " on" : "") + (done ? " done" : "") });
        card.style.setProperty("--nq", TYPE[q.type].col);
        const head = U.el("div", { class: "nq-head", html: `${icon(q.type)}<span class="nq-type">${TYPE[q.type].name}</span><span class="nq-stars" aria-label="むずかしさ ${q.stars}">${stars(q.stars)}</span><b class="nq-reward">${q.reward} コイン</b>` });
        card.append(head, U.el("div", { class: "nq-ttl", text: title(q) }), U.el("div", { class: "nq-who", text: who(q) }), U.el("div", { class: "nq-text", text: q.text }));
        if (p) card.append(U.el("div", { class: "nq-prog" + (p.done ? " ok" : ""), text: p.text }));
        const btns = U.el("div", { class: "nq-btns" });
        if (done) btns.append(U.el("span", { class: "nq-stamp", text: "おわった！" }));
        else if (!a) { const b = UI.btn("うける", () => { if (accept(id)) { Sound.se("ok"); render(); } }, "yellow small"); b.setAttribute("aria-label", `「${title(q)}」を うける`); b.disabled = s.active.length >= MAX; btns.append(b); }
        else {
          if (p.done) { const b = UI.btn("ほうこくする", async () => { const got = report(id, scene); if (got) { Sound.se("coin"); Sound.se("fanfare"); UI.updateHud(); UI.toast(`ほうしゅう ${got} コイン！`, "good"); WorkExp.toast(WorkExp.last.rows); render(); } }, "pink small"); b.setAttribute("aria-label", `「${title(q)}」を ほうこくする`); btns.append(b); }
          const c = UI.btn("やめる", async () => { if (await UI.confirm(`「${title(q)}」を やめる？\nまた うける ことも できるよ。`, "やめる", "つづける")) { cancel(id, scene); render(); } }, "small"); c.setAttribute("aria-label", `「${title(q)}」を やめる`); btns.append(c);
        }
        card.append(btns); body.append(card);
      }
      body.append(U.el("p", { class: "muted nq-total", text: `これまでに ほうこく した いらい ${s.total || 0}こ・もらった ほうしゅう ${s.earned || 0} コイン` }));
    };
    render();
    Sound.se("ok");
    return UI.modal({ title: "ネリカス いらいの けいじばん", body, cls: "full" });
  }
  // すまほの アプリ（いま うけて いる いらいと すすみぐあい）
  function phoneView(el) {
    const s = st(), box = U.el("div", { class: "neri-quests" });
    if (!s.active.length) box.append(U.el("p", { class: "nq-lead", text: "いまは いらいを うけて いないよ。ネリカスタウンの いりぐちの けいじばんを みてね。" }));
    for (const a of s.active) { const q = byId[a.id], p = progress(a); if (!q) continue; const card = U.el("div", { class: "nq-card on" }); card.style.setProperty("--nq", TYPE[q.type].col); card.append(U.el("div", { class: "nq-head", html: `${icon(q.type)}<span class="nq-type">${TYPE[q.type].name}</span><span class="nq-stars">${stars(q.stars)}</span><b class="nq-reward">${q.reward} コイン</b>` }), U.el("div", { class: "nq-ttl", text: title(q) }), U.el("div", { class: "nq-prog" + (p.done ? " ok" : ""), text: p.text })); box.append(card); }
    el.append(box);
  }

  // ---- とりつけ（町の けいじばん・きらきら・ついて くる どうぶつ・おつかい）----
  WorldArt.questboard = () => ({ w: 44, h: 58, svg: `<path d="M9,34 V56 M35,34 V56" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M2,12 L22,2 L42,12 Z" fill="#C26A4A" ${OS(2.4)}/><rect x="4" y="11" width="36" height="28" rx="3" fill="#D9A066" ${OS(2.4)}/><rect x="7" y="14" width="30" height="22" rx="2" fill="#E9C38C"/><rect x="9" y="16" width="11" height="9" rx="1" fill="#FFFDF5" ${OS(1.2)}/><rect x="23" y="15" width="12" height="10" rx="1" fill="#F4A6A0" ${OS(1.2)}/><rect x="11" y="27" width="11" height="8" rx="1" fill="#9CC7E6" ${OS(1.2)}/><rect x="25" y="27" width="10" height="8" rx="1" fill="#F7D56A" ${OS(1.2)}/><circle cx="14" cy="16" r="1.6" fill="#E53935"/><circle cx="29" cy="15" r="1.6" fill="#1E88E5"/><path d="M11,20 h7 M25,19 h8 M13,31 h6" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>` });
  function install() {
    if (typeof MAP_DEFS === "undefined" || !MAP_DEFS.town) return;
    const [x, y] = BOARD;
    MAP_DEFS.town.objects.push({ id: "town_questboard", kind: "questboard", x, y, w: 1, h: 1, solid: true, questBoard: true, text: "いらいの けいじばん" });
    const act0 = WorldScenery.activate.bind(WorldScenery);
    WorldScenery.activate = (sc, o) => (o && o.questBoard ? (Sound.se("tap"), open(sc)) : act0(sc, o));
    if (typeof TownFolk !== "undefined") {
      const spots0 = TownFolk.spotsOn.bind(TownFolk), inv0 = TownFolk.investigate.bind(TownFolk), fol0 = TownFolk.following.bind(TownFolk);
      TownFolk.spotsOn = (mapId) => [...spots0(mapId), ...spots(mapId)];
      TownFolk.investigate = (spot, scene) => (String(spot.req).startsWith("neriq:") ? investigate(spot, scene) : inv0(spot, scene));
      TownFolk.following = () => fol0() || following();
    }
    if (typeof WorldScene !== "undefined") {
      const start0 = WorldScene.prototype.startFollower;
      WorldScene.prototype.startFollower = function (x, y) { start0.call(this, x, y); const spec = followerSpec(); if (spec && this.follower && !(Save.d.folk && TownFolk.st().req.some((r) => r.follow))) Object.assign(this.follower, spec); };
    }
    const run0 = Talk.run.bind(Talk);
    Talk.run = async (n, scene) => ((await talked(n, scene)) ? undefined : run0(n, scene));
  }
  install();
  return { Q, byId, BOARD, MAX, TYPE, board, accept, cancel, report, progress, spots, following, followerSpec, open, phoneView, title };
})();
